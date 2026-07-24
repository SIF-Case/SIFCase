import { connectDB } from "./mongodb";
import FundDetails from "@/models/FundDetails";
import SchemeMapping from "@/models/SchemeMapping";
import SIFScheme from "@/models/SIFScheme";
import {
  fetchSchemesForSifId, fetchSsd, fetchTer, extractFromSsd,
  normaliseName, sifIdsFromTer, type TerRow,
} from "./amfiSif";

// Orchestration for the three AMFI-derived sources. Both the nightly cron and the
// per-fund "Update all sources" button in admin call in here, so what an editor
// verifies by hand is exactly what runs at 08:00 — a second code path would let
// the admin check drift away from production behaviour.
//
// The rule every phase obeys: write a field only when the source returned a
// usable value. A 404, a timeout, malformed XML or a blank element leaves the
// stored value untouched. Data goes stale before it goes blank, and staleness is
// made visible via ssdAvailability / ssdLastSeenAt rather than hidden.

export interface SourceOutcome {
  source: "finapi" | "ssd" | "ter";
  ok: boolean;
  /** Fields actually written. Empty with ok:true means "nothing new to say". */
  fieldsWritten: string[];
  message: string;
}

export interface FundSyncReport {
  fundName: string;
  schemeId: string | null;
  outcomes: SourceOutcome[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Phase 1 — scheme mapping ─────────────────────────────────────────────────

export interface MappingResult {
  schemesSeen: number;
  created: number;
  matched: number;
  verified: number;
  /** SIFScheme rows (the 108 plan/option rows) stamped with an AMFI schemeId. */
  schemesStamped: number;
  conflicts: string[];
  unmatchedAmfi: string[];
  errors: string[];
}

/**
 * Discover every AMFI scheme, match it to a funddetails record by normalised
 * name, and upgrade the match to `verified` when the SSD's ISINs agree with the
 * ISINs we already hold. A mapping that is already verified is never re-matched,
 * so an upstream rename cannot silently repoint it.
 */
export async function syncSchemeMappings(opts: { throttleMs?: number } = {}): Promise<MappingResult> {
  const throttleMs = opts.throttleMs ?? 250;
  await connectDB();

  const res: MappingResult = {
    schemesSeen: 0, created: 0, matched: 0, verified: 0, schemesStamped: 0,
    conflicts: [], unmatchedAmfi: [], errors: [],
  };

  // The provider list comes from the TER feed rather than a hardcoded array, so a
  // new AMC appears on its own.
  const ter = await fetchTer();
  const sifIds = sifIdsFromTer(ter.rows);
  if (sifIds.length === 0) {
    res.errors.push("TER feed returned no SIF_Ids — cannot enumerate schemes");
    return res;
  }

  const schemes: { sifId: number; schemeName: string; schemeId: string }[] = [];
  for (const id of sifIds) {
    try {
      schemes.push(...(await fetchSchemesForSifId(id)));
    } catch (err) {
      res.errors.push(`sif_id ${id}: ${err instanceof Error ? err.message : String(err)}`);
    }
    await sleep(throttleMs);
  }
  res.schemesSeen = schemes.length;

  const funds = await FundDetails.find({}, { fundName: 1, isin: 1, _id: 0 }).lean<
    { fundName: string; isin?: string }[]
  >();
  const fundsByKey = new Map<string, { fundName: string; isin?: string }[]>();
  for (const f of funds) {
    const k = normaliseName(f.fundName);
    if (!fundsByKey.has(k)) fundsByKey.set(k, []);
    fundsByKey.get(k)!.push(f);
  }

  const terByKey = new Map(ter.rows.map((r) => [normaliseName(r.schemeName), r]));

  for (const s of schemes) {
    const existing = await SchemeMapping.findOne({ schemeId: s.schemeId });
    const hits = fundsByKey.get(normaliseName(s.schemeName)) ?? [];

    if (hits.length === 0) res.unmatchedAmfi.push(`${s.schemeId} ${s.schemeName}`);
    if (hits.length > 1) {
      res.conflicts.push(
        `${s.schemeId} ${s.schemeName}: ${hits.length} funddetails docs share this name — dedupe before mapping`,
      );
    }

    const matchedFundName = hits.length === 1 ? hits[0].fundName : "";
    const terRow = terByKey.get(normaliseName(s.schemeName));

    const doc = existing ?? new SchemeMapping({ schemeId: s.schemeId });
    if (!existing) res.created++;

    doc.sifId = String(s.sifId);
    doc.schemeName = s.schemeName;
    doc.nsdlSchemeCode = terRow?.nsdlSchemeCode ?? doc.nsdlSchemeCode;
    // A verified mapping is frozen — do not let a later name match move it.
    if (doc.status !== "verified" && matchedFundName) doc.matchedFundName = matchedFundName;
    if (doc.matchedFundName) res.matched++;

    // Fetch the SSD to record availability and, where possible, verify by ISIN.
    const ssd = await fetchSsd(s.schemeId);
    doc.ssdCheckedAt = new Date();
    if (ssd.ok) {
      doc.ssdAvailability = "available";
      doc.ssdFormat = ssd.doc.format;
      doc.ssdLastSeenAt = new Date();
      doc.ssdMissReason = "";
      if (ssd.doc.isins.length) doc.isins = ssd.doc.isins;

      const fundIsin = hits.length === 1 ? (hits[0].isin ?? "").trim().toUpperCase() : "";
      if (doc.status !== "verified" && fundIsin && ssd.doc.isins.length) {
        if (ssd.doc.isins.includes(fundIsin)) {
          doc.status = "verified";
          res.verified++;
        } else {
          doc.status = "conflict";
          doc.note = `fund ISIN ${fundIsin} absent from SSD ISINs`;
          res.conflicts.push(`${s.schemeId} ${s.schemeName}: ${doc.note}`);
        }
      }
    } else {
      doc.ssdAvailability = "not_published";
      doc.ssdMissReason = ssd.miss.reason;
    }

    await doc.save();

    // Mirror onto the fund so the detail record can show its own SSD state.
    if (doc.matchedFundName) {
      await FundDetails.updateOne(
        { fundName: doc.matchedFundName },
        {
          $set: {
            schemeId: doc.schemeId,
            ssdAvailability: doc.ssdAvailability,
            ssdCheckedAt: doc.ssdCheckedAt,
            ssdMissReason: doc.ssdMissReason,
            ...(doc.ssdLastSeenAt ? { ssdLastSeenAt: doc.ssdLastSeenAt } : {}),
          },
        },
      );
    }

    await sleep(throttleMs);
  }

  // Stamp the SIFScheme rows (the 108 plan/option rows admin sees) with their AMFI
  // schemeId. One AMFI scheme (e.g. S-4) fans out to every SIFScheme row whose
  // derived fundName matches its scheme_name — Direct/Regular × Growth/IDCW all
  // share one schemeId. Reuses `schemes` already fetched above; no extra calls.
  try {
    const byName = new Map(schemes.map((s) => [normaliseName(s.schemeName), s]));
    const rows = await SIFScheme.find(
      {},
      { schemeCode: 1, fundName: 1, schemeId: 1, _id: 0 },
    ).lean<{ schemeCode: string; fundName: string; schemeId: string }[]>();

    const ops = [];
    for (const row of rows) {
      const s = byName.get(normaliseName(row.fundName));
      if (!s) continue;
      if (row.schemeId === s.schemeId) continue; // already stamped, no-op
      ops.push({
        updateOne: {
          filter: { schemeCode: row.schemeCode },
          update: { $set: { schemeId: s.schemeId, sifId: String(s.sifId) } },
        },
      });
    }
    if (ops.length) await SIFScheme.bulkWrite(ops);
    res.schemesStamped = ops.length;
  } catch (err) {
    res.errors.push(`SIFScheme stamp: ${err instanceof Error ? err.message : String(err)}`);
  }

  return res;
}

// ── Phase 2 — SSD -> FundDetails ─────────────────────────────────────────────

const SSD_OWNED: (keyof ReturnType<typeof extractFromSsd>)[] = [
  "riskBand", "exitLoad", "minInvestment", "additionalInvestment",
  "benchmarkName", "benchmarkDetails", "registrarName", "inceptionDate",
  "schemeCategory", "statedAssetAllocation",
];

export async function applySsdToFund(fundName: string): Promise<SourceOutcome> {
  await connectDB();
  const mapping = await SchemeMapping.findOne({ matchedFundName: fundName }).lean<{
    schemeId: string; status: string;
  } | null>();

  if (!mapping) {
    return { source: "ssd", ok: false, fieldsWritten: [], message: "no AMFI scheme mapped to this fund yet" };
  }
  if (mapping.status === "conflict") {
    return { source: "ssd", ok: false, fieldsWritten: [], message: "mapping is in conflict — ISINs disagree, writes blocked" };
  }

  const ssd = await fetchSsd(mapping.schemeId);
  const now = new Date();

  if (!ssd.ok) {
    // Record the miss; do NOT null out anything already stored.
    await FundDetails.updateOne(
      { fundName },
      { $set: { ssdAvailability: "not_published", ssdCheckedAt: now, ssdMissReason: ssd.miss.reason } },
    );
    return {
      source: "ssd", ok: false, fieldsWritten: [],
      message: `SSD not available for ${mapping.schemeId} — ${ssd.miss.reason}. Other sources still applied.`,
    };
  }

  const extract = extractFromSsd(ssd.doc);
  const set: Record<string, unknown> = {
    ssdAvailability: "available",
    ssdCheckedAt: now,
    ssdLastSeenAt: now,
    ssdMissReason: "",
    schemeId: mapping.schemeId,
  };
  const written: string[] = [];
  for (const key of SSD_OWNED) {
    const v = extract[key];
    if (v !== undefined && v !== null && v !== "") {
      set[key] = v;
      written.push(key);
    }
  }

  await FundDetails.updateOne({ fundName }, { $set: set }, { upsert: false });
  return {
    source: "ssd", ok: true, fieldsWritten: written,
    message: `SSD ${mapping.schemeId} (${ssd.doc.format}) — ${written.length} fields`,
  };
}

// ── Phase 3 — TER -> FundDetails ─────────────────────────────────────────────

export async function applyTerToFund(fundName: string, rows?: TerRow[]): Promise<SourceOutcome> {
  await connectDB();
  const terRows = rows ?? (await fetchTer()).rows;
  const row = terRows.find((r) => normaliseName(r.schemeName) === normaliseName(fundName));

  if (!row) {
    return { source: "ter", ok: false, fieldsWritten: [], message: "fund not present in the AMFI TER feed" };
  }

  const set: Record<string, unknown> = {
    terBreakdown: {
      terYear: row.terYear,
      terDate: row.terDate,
      regular: row.regular,
      direct: row.direct,
    },
    terLastSyncedAt: new Date(),
  };
  const written = ["terBreakdown"];

  // terMax still backs FundRow.expenseRatio, so keep it fed from the authoritative
  // Regular-plan TER until expenseRatio is repointed onto terBreakdown and terMax
  // is dropped (docs/product/refactor/09-fund-details-sources.md §6).
  if (row.regular.ter) {
    set.terMax = `${row.regular.ter}%`;
    written.push("terMax");
  }

  await FundDetails.updateOne({ fundName }, { $set: set }, { upsert: false });
  return { source: "ter", ok: true, fieldsWritten: written, message: `TER ${row.terYear} — Regular ${row.regular.ter}%, Direct ${row.direct.ter}%` };
}

// ── Combined ─────────────────────────────────────────────────────────────────

/**
 * SSD then TER for one fund. Independent of each other: a missing SSD does not
 * stop TER from being applied, which is the whole point of reporting per source.
 */
export async function syncAmfiSourcesForFund(fundName: string): Promise<FundSyncReport> {
  await connectDB();
  const outcomes: SourceOutcome[] = [];

  try {
    outcomes.push(await applySsdToFund(fundName));
  } catch (err) {
    outcomes.push({ source: "ssd", ok: false, fieldsWritten: [], message: err instanceof Error ? err.message : String(err) });
  }

  try {
    outcomes.push(await applyTerToFund(fundName));
  } catch (err) {
    outcomes.push({ source: "ter", ok: false, fieldsWritten: [], message: err instanceof Error ? err.message : String(err) });
  }

  const mapping = await SchemeMapping.findOne({ matchedFundName: fundName }).lean<{ schemeId: string } | null>();
  return { fundName, schemeId: mapping?.schemeId ?? null, outcomes };
}

export interface AllFundsResult {
  mapping: MappingResult;
  funds: number;
  ssdApplied: number;
  ssdMissing: number;
  terApplied: number;
  errors: string[];
}

/** Full nightly run: refresh mappings, then SSD + TER for every mapped fund. */
export async function syncAllAmfiSources(opts: { throttleMs?: number } = {}): Promise<AllFundsResult> {
  const throttleMs = opts.throttleMs ?? 250;
  await connectDB();

  const mapping = await syncSchemeMappings({ throttleMs });
  const out: AllFundsResult = {
    mapping, funds: 0, ssdApplied: 0, ssdMissing: 0, terApplied: 0, errors: [],
  };

  // One TER fetch for the whole run instead of one per fund.
  let terRows: TerRow[] = [];
  try {
    terRows = (await fetchTer()).rows;
  } catch (err) {
    out.errors.push(`TER: ${err instanceof Error ? err.message : String(err)}`);
  }

  const mapped = await SchemeMapping.find(
    { matchedFundName: { $ne: "" }, status: { $ne: "conflict" } },
    { matchedFundName: 1, _id: 0 },
  ).lean<{ matchedFundName: string }[]>();

  for (const m of mapped) {
    out.funds++;
    try {
      const ssd = await applySsdToFund(m.matchedFundName);
      if (ssd.ok) out.ssdApplied++;
      else out.ssdMissing++;
    } catch (err) {
      out.errors.push(`${m.matchedFundName} ssd: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (terRows.length) {
      try {
        const ter = await applyTerToFund(m.matchedFundName, terRows);
        if (ter.ok) out.terApplied++;
      } catch (err) {
        out.errors.push(`${m.matchedFundName} ter: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    await sleep(throttleMs);
  }

  return out;
}
