import { connectDB } from "./mongodb";
import SIFScheme from "@/models/SIFScheme";
import FundDetails from "@/models/FundDetails";
import { fetchFundByIsin, mapFinApiToFundDetails } from "@/lib/finApiClient";
import type { IFundDetails } from "@/models/FundDetails";

// Daily refresh of FundDetails from finapi (https://finapi.upvaly.com).
//
// Only the Regular / Growth plan is synced. A fund has many plan+option variants
// (Regular/Direct × Growth/IDCW/IDCW Payout/…) and finapi returns exactly one
// plan per ISIN call, but the fund-level facts we store — AUM, TER, risk band,
// holdings, sectors, rolling returns — are identical across them. Syncing every
// variant would be ~144 upstream calls a night to restate the same numbers.
// Regular/Growth is the canonical row, so it's the one we read.
//
// Note: on non-Growth rows the `isinGrowth` field does NOT hold a growth ISIN.
// AMFI's NAVAll feed packs "ISIN Div Payout / ISIN Growth" into one column, so an
// IDCW row carries its payout ISIN there. Filtering on plan alone picks up 53
// ISINs instead of 29 — option === "Growth" is required, not optional.
//
// Still grouped by fundName and written once per fund: one fund legitimately has
// two Regular/Growth ISINs, and writing per ISIN would make the second clobber
// the first's planCodes — the hazard /api/admin/fund-details/sync-isin guards
// against for a single manual sync.

export interface FundDetailsSyncResult {
  funds: number;
  fundsUpdated: number;
  isinsFetched: number;
  isinsFailed: number;
  /** Malformed values in SIFScheme (e.g. "-") — skipped without an upstream call. */
  isinsInvalid: number;
  skipped: number;
  /** Funds synced from Direct/Growth because they have no Regular plan. */
  fallbackFunds: string[];
  truncated: boolean;
  durationMs: number;
  errors: string[];
}

// Same shape sync-isin enforces, so a value rejected there can't slip in here.
// SIFScheme carries placeholder junk like "-" in these fields.
const ISIN_RE = /^[A-Za-z0-9]{9,12}$/;

interface SyncOptions {
  /** Wall-clock ceiling. Vercel's limit is 300s; stop early and leave headroom. */
  timeBudgetMs?: number;
  /** Spacing between finapi calls. It's a free API — don't hammer it. */
  throttleMs?: number;
  /** Retries per ISIN on 429/5xx. */
  maxRetries?: number;
  /** Cap funds processed this run. For verifying the pipeline without a full sweep. */
  limitFunds?: number;
}

const DEFAULTS = { timeBudgetMs: 240_000, throttleMs: 400, maxRetries: 2 } as const;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * finApiClient throws Error("finapi request failed: <status> <text>"), so the
 * status has to be recovered from the message to decide whether a retry is
 * worthwhile. Retrying a 404 (ISIN genuinely absent upstream) just wastes the
 * time budget.
 */
function isRetryable(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const status = /failed: (\d{3})/.exec(msg)?.[1];
  if (!status) return true; // network error / timeout — worth one more go
  const code = Number(status);
  return code === 429 || code >= 500;
}

async function fetchWithRetry(isin: string, maxRetries: number) {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetchFundByIsin(isin);
    } catch (err) {
      lastErr = err;
      if (attempt === maxRetries || !isRetryable(err)) break;
      await sleep(1000 * 2 ** attempt); // 1s, 2s
    }
  }
  throw lastErr;
}

/**
 * fundName → Regular/Growth ISINs.
 *
 * One fund (currently DynaSIF Active Asset Allocator) has no Regular plan at all,
 * only Direct/Growth. Strict Regular-only selection would drop it from the sync
 * permanently, so Direct/Growth is used as a per-fund fallback — the fund-level
 * facts are the same either way, and the alternative is a fund that never gets
 * details. Funds WITH a Regular row never consult the fallback.
 */
async function groupIsinsByFund(): Promise<{
  byFund: Map<string, string[]>;
  fallbackFunds: string[];
}> {
  const schemes = await SIFScheme.find(
    { isActive: true, option: "Growth" },
    { fundName: 1, plan: 1, isinGrowth: 1, _id: 0 },
  ).lean<{ fundName: string; plan: "Regular" | "Direct"; isinGrowth?: string }[]>();

  const regular = new Map<string, string[]>();
  const direct = new Map<string, string[]>();

  for (const s of schemes) {
    if (!s.fundName || !s.isinGrowth) continue;
    const target = s.plan === "Regular" ? regular : direct;
    target.set(s.fundName, [...(target.get(s.fundName) ?? []), s.isinGrowth]);
  }

  const byFund = new Map<string, string[]>();
  const fallbackFunds: string[] = [];

  for (const fundName of new Set([...regular.keys(), ...direct.keys()])) {
    const isins = regular.get(fundName) ?? direct.get(fundName) ?? [];
    if (!regular.has(fundName)) fallbackFunds.push(fundName);
    byFund.set(fundName, Array.from(new Set(isins)));
  }

  return { byFund, fallbackFunds };
}

/**
 * Stalest funds first, never-synced before those. If the time budget truncates a
 * run, the next day resumes where this one stopped instead of re-doing the funds
 * that were already fresh — so full coverage holds even under repeated truncation.
 */
async function orderByStaleness(fundNames: string[]): Promise<string[]> {
  const docs = await FundDetails.find(
    { fundName: { $in: fundNames } },
    { fundName: 1, lastSyncedFromFinApi: 1, _id: 0 },
  ).lean<{ fundName: string; lastSyncedFromFinApi?: Date }[]>();

  const syncedAt = new Map(docs.map((d) => [d.fundName, d.lastSyncedFromFinApi?.getTime() ?? 0]));
  return [...fundNames].sort((a, b) => (syncedAt.get(a) ?? 0) - (syncedAt.get(b) ?? 0));
}

export async function syncAllFundDetailsFromFinApi(
  opts: SyncOptions = {},
): Promise<FundDetailsSyncResult> {
  const { timeBudgetMs, throttleMs, maxRetries, limitFunds } = { ...DEFAULTS, ...opts };
  const startedAt = Date.now();

  const result: FundDetailsSyncResult = {
    funds: 0, fundsUpdated: 0, isinsFetched: 0, isinsFailed: 0, isinsInvalid: 0,
    skipped: 0, fallbackFunds: [], truncated: false, durationMs: 0, errors: [],
  };

  await connectDB();

  const { byFund, fallbackFunds } = await groupIsinsByFund();
  const ordered = await orderByStaleness([...byFund.keys()]);
  const order = limitFunds ? ordered.slice(0, limitFunds) : ordered;
  result.funds = order.length;
  result.fallbackFunds = fallbackFunds.filter((f) => order.includes(f));

  for (const fundName of order) {
    if (Date.now() - startedAt > timeBudgetMs) {
      result.truncated = true;
      result.errors.push(
        `Time budget reached after ${result.fundsUpdated}/${order.length} funds — remainder resumes next run (stalest first).`,
      );
      break;
    }

    const isins = byFund.get(fundName) ?? [];
    let base: Partial<IFundDetails> | null = null;
    const planCodesByIsin = new Map<string, { planName: string; isin: string }>();

    // Existing plan variants must survive: finapi only ever returns the plan for
    // the ISIN queried, so anything synced previously is invisible to this run.
    const existing = await FundDetails.findOne({ fundName }, { planCodes: 1, _id: 0 })
      .lean<{ planCodes?: { planName: string; isin: string }[] } | null>();
    for (const pc of existing?.planCodes ?? []) planCodesByIsin.set(pc.isin, pc);

    for (const isin of isins) {
      if (Date.now() - startedAt > timeBudgetMs) break;

      if (!ISIN_RE.test(isin)) {
        result.isinsInvalid++;
        result.errors.push(`${fundName}: skipped malformed ISIN "${isin}"`);
        continue; // no upstream call, no throttle — it was never going to resolve
      }

      try {
        const raw = await fetchWithRetry(isin, maxRetries);
        const mapped = mapFinApiToFundDetails(raw);
        result.isinsFetched++;

        // First success wins the scalar fields — ISINs are ordered growth-first,
        // so the canonical plan decides AUM, TER, risk band and the rest.
        if (!base) base = mapped;
        for (const pc of mapped.planCodes ?? []) planCodesByIsin.set(pc.isin, pc);
      } catch (err) {
        result.isinsFailed++;
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`${fundName} [${isin}]: ${msg}`);
      }
      await sleep(throttleMs);
    }

    if (!base) {
      result.skipped++;
      continue;
    }

    base.planCodes = Array.from(planCodesByIsin.values());

    try {
      await FundDetails.findOneAndUpdate({ fundName }, { $set: base }, { upsert: true });
      result.fundsUpdated++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      result.errors.push(`${fundName}: save failed — ${msg}`);
    }
  }

  result.durationMs = Date.now() - startedAt;
  return result;
}
