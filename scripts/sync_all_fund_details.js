/**
 * Sync Fund Details from finapi.upvaly.com for ALL SIF funds
 * =============================================================
 * Mirrors POST /api/admin/fund-details/sync-isin, but loops every fund's
 * Regular-plan Growth ISIN instead of syncing one at a time from the admin UI.
 *
 * Usage: node scripts/sync_all_fund_details.js [--dry-run]
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DRY_RUN = process.argv.includes('--dry-run');
const FINAPI_BASE = 'https://api.finapi.upvaly.com/api/mf/isin';

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found');
  process.exit(1);
}

// ── finapi fetch (mirrors src/lib/finApiClient.ts fetchFundByIsin) ──────────

async function fetchFundByIsin(isin) {
  const res = await fetch(`${FINAPI_BASE}/${encodeURIComponent(isin)}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`finapi request failed: ${res.status} ${res.statusText}`);
  const body = await res.json();
  if (body.status !== 'success' || !body.data) {
    throw new Error(`finapi returned non-success: ${body.message ?? 'unknown error'}`);
  }
  return body.data;
}

// ── Mapping (ported from src/lib/finApiClient.ts mapFinApiToFundDetails +
//    src/lib/sifData.ts normaliseRiskBand, kept in sync manually) ───────────

const RISK_BAND_STRING_MAP = {
  'Low Risk': 1, 'Low to Moderate Risk': 2, 'Moderate Risk': 3,
  'Moderately High Risk': 4, 'High Risk': 5, 'Very High Risk': 5,
};

function normaliseRiskBand(v) {
  if (v == null) return null;
  if (typeof v === 'string') {
    if (RISK_BAND_STRING_MAP[v]) return RISK_BAND_STRING_MAP[v];
    const n = parseInt(v, 10);
    if (n >= 1 && n <= 5) return n;
    return null;
  }
  if (typeof v === 'number' && v >= 1 && v <= 5) return Math.round(v);
  return null;
}

function toNumOrNull(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isNaN(n) ? null : n;
}

function mapAssetAllocation(a) {
  return [
    { assetClass: 'Equity', percentage: toNumOrNull(a.equityAllocation) ?? 0 },
    { assetClass: 'Debt', percentage: toNumOrNull(a.debtAllocation) ?? 0 },
    { assetClass: 'Cash', percentage: toNumOrNull(a.cashAllocation) ?? 0 },
    { assetClass: 'Other', percentage: toNumOrNull(a.otherAllocation) ?? 0 },
  ];
}

function mapFinApiToFundDetails(raw) {
  const fundManagers = (raw.schemeFundManagers || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({ name }));

  const mc = raw.portfolio?.marketCapWeightage;
  const conc = raw.portfolio?.concentration;
  const f = raw.fundamentals;
  const rm = raw.riskMetrics;

  return {
    amcName: raw.companyName ?? '',
    benchmarkName: raw.benchmarkIndex ?? '',
    exitLoad: raw.exitLoadMessage ?? '',
    schemeCategory: raw.schemeCategoryLabel || raw.schemeCategory || '',
    schemeNature: raw.schemeCategory ?? '',
    schemeType: raw.schemeStructure ?? '',
    inceptionDate: raw.inceptionDate ?? '',
    aumCurrent: toNumOrNull(raw.aum),
    terMax: raw.expenseRatio ?? '',
    riskBand: normaliseRiskBand(raw.schemeRisk),
    fundManagers,
    assetAllocation: raw.portfolio?.assetAllocation ? mapAssetAllocation(raw.portfolio.assetAllocation) : [],
    portfolioByIndustry: (raw.sectors ?? []).map((s) => ({
      industry: s.sector,
      percentage: toNumOrNull(s.weightage) ?? 0,
      marketValue: toNumOrNull(s.marketValue),
      change1M: toNumOrNull(s.change1M),
    })),
    topHoldings: (raw.holdings ?? []).map((h) => ({
      name: h.name,
      percentage: toNumOrNull(h.weightage) ?? 0,
      sector: h.sector,
      rating: undefined,
      marketValue: toNumOrNull(h.marketValue),
      change1M: toNumOrNull(h.change1M),
    })),
    planCodes: raw.planName && raw.isinDivPayoutOrGrowth
      ? [{ planName: `${raw.planName}${raw.optionName ? ` - ${raw.optionName}` : ''}`, isin: raw.isinDivPayoutOrGrowth }]
      : [],
    isin: raw.isinDivPayoutOrGrowth ?? raw.isinDivPayout ?? '',
    externalSchemeCode: raw.schemeCode ?? '',
    marketCapWeightage: mc
      ? {
          largeCap: toNumOrNull(mc.largeCap),
          midCap: toNumOrNull(mc.midCap),
          smallCap: toNumOrNull(mc.smallCap),
          others: toNumOrNull(mc.others),
        }
      : null,
    concentration: conc
      ? {
          numberOfHoldings: conc.numberOfHoldings ?? null,
          averageMarketCap: conc.averageMarketCap ?? '',
          top3SectorWeight: toNumOrNull(conc.top3SectorWeight),
          top5StocksWeight: toNumOrNull(conc.top5StocksWeight),
          top10StocksWeight: toNumOrNull(conc.top10StocksWeight),
        }
      : null,
    fundamentals: f
      ? {
          pe: toNumOrNull(f.pe), categoryAveragePe: toNumOrNull(f.categoryAveragePe),
          pb: toNumOrNull(f.pb), categoryAveragePb: toNumOrNull(f.categoryAveragePb),
          priceToSale: toNumOrNull(f.priceToSale), categoryAveragePriceToSale: toNumOrNull(f.categoryAveragePriceToSale),
          priceToCashFlow: toNumOrNull(f.priceToCashFlow), categoryAveragePriceToCashFlow: toNumOrNull(f.categoryAveragePriceToCashFlow),
          dividendYield: toNumOrNull(f.dividendYield), categoryAverageDividendYield: toNumOrNull(f.categoryAverageDividendYield),
          roe: toNumOrNull(f.roe), categoryAverageRoe: toNumOrNull(f.categoryAverageRoe),
        }
      : null,
    riskMetricsConclusions: rm
      ? {
          returns: { info: rm.returns?.info ?? '', timeframes: rm.returns?.timeframes ?? [] },
          riskStandardDeviation: { info: rm.riskStandardDeviation?.info ?? '', timeframes: rm.riskStandardDeviation?.timeframes ?? [] },
          sharpRatio: { info: rm.sharpRatio?.info ?? '', timeframes: rm.sharpRatio?.timeframes ?? [] },
          sortinoRatio: { info: rm.sortinoRatio?.info ?? '', timeframes: rm.sortinoRatio?.timeframes ?? [] },
          beta: { info: rm.beta?.info ?? '', timeframes: rm.beta?.timeframes ?? [] },
        }
      : null,
    rollingReturns: (raw.rollingReturns ?? []).map((r) => ({
      timeframe: r.timeframe,
      averageReturn: toNumOrNull(r.averageReturn),
      medianReturn: toNumOrNull(r.medianReturn),
      minReturn: toNumOrNull(r.minReturn),
      minPeriod: r.minPeriod ?? '',
      maxReturn: toNumOrNull(r.maxReturn),
      maxPeriod: r.maxPeriod ?? '',
      standardDeviation: toNumOrNull(r.standardDeviation),
      downsideDeviation: toNumOrNull(r.downsideDeviation),
      positiveRatio: toNumOrNull(r.positiveRatio),
      negativeRatio: toNumOrNull(r.negativeRatio),
      consistencyScore: toNumOrNull(r.consistencyScore),
    })),
    categoryRanks: (raw.ranks ?? []).map((r) => ({
      timeframe: r.timeframe,
      annualizedReturn: toNumOrNull(r.annualizedReturn),
      categoryAverage: toNumOrNull(r.categoryAverage),
      rankInCategory: r.rankInCategory ?? '',
    })),
    peers: (raw.peers ?? []).map((p) => ({
      schemeCode: p.schemeCode ?? '',
      isin: p.isin ?? '',
      schemeName: p.schemeName ?? '',
      schemeNameShort: p.schemeNameShort ?? '',
      aum: p.aum ?? '',
      pe: p.pe ?? '',
      pb: p.pb ?? '',
      dividendYield: p.dividendYield ?? '',
      expenseRatio: p.expenseRatio ?? '',
    })),
    amcOtherFunds: raw.moreFundsFromAmc
      ? {
          companyName: raw.moreFundsFromAmc.companyName ?? '',
          schemeList: (raw.moreFundsFromAmc.schemeList ?? []).map((s) => ({
            schemeCode: s.schemeCode ?? '',
            isin: s.isin ?? '',
            schemeName: s.schemeName ?? '',
            schemeShortName: s.schemeShortName ?? '',
            morningstarRating: s.morningstarRating,
            aum: s.aum ?? '',
            returns: s.returns ?? {},
          })),
        }
      : null,
    lastSyncedFromFinApi: new Date(),
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log(`\nSync All Fund Details ${DRY_RUN ? '[DRY RUN]' : ''}\n`);

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log('Connected to MongoDB\n');

  const db = client.db();
  const schemes = db.collection('sifschemes');
  const fundDetails = db.collection('funddetails');

  // One row per fund: pick the Regular/Growth ISIN, same as the admin list endpoint.
  const rows = await schemes
    .find({ plan: 'Regular', isinGrowth: { $ne: '' } }, { projection: { fundName: 1, isinGrowth: 1, _id: 0 } })
    .toArray();

  const byFund = new Map();
  for (const r of rows) {
    if (!r.fundName || !r.isinGrowth) continue;
    if (!byFund.has(r.fundName)) byFund.set(r.fundName, r.isinGrowth);
  }

  const funds = Array.from(byFund.entries()); // [fundName, isinGrowth][]
  console.log(`Found ${funds.length} funds to sync\n`);

  let ok = 0;
  const failed = [];

  for (const [fundName, isin] of funds) {
    process.stdout.write(`  → ${fundName} (${isin}) ... `);
    try {
      const raw = await fetchFundByIsin(isin);
      const mapped = mapFinApiToFundDetails(raw);

      // Merge planCodes across previously-synced plan/option variants of this fund.
      const existing = await fundDetails.findOne({ fundName }, { projection: { planCodes: 1 } });
      if (existing?.planCodes?.length || mapped.planCodes?.length) {
        const byIsin = new Map();
        for (const pc of existing?.planCodes ?? []) byIsin.set(pc.isin, pc);
        for (const pc of mapped.planCodes ?? []) byIsin.set(pc.isin, pc);
        mapped.planCodes = Array.from(byIsin.values());
      }

      if (!DRY_RUN) {
        await fundDetails.updateOne(
          { fundName },
          { $set: mapped },
          { upsert: true },
        );
      }

      console.log(`ok (${Object.keys(mapped).length} fields)`);
      ok++;
    } catch (err) {
      console.log(`FAILED — ${err.message}`);
      failed.push({ fundName, isin, error: err.message });
    }

    // Be polite to finapi — small delay between calls.
    await sleep(400);
  }

  await client.close();

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Synced OK: ${ok}/${funds.length}`);
  if (failed.length) {
    console.log(`  Failed:    ${failed.length}`);
    failed.forEach((f) => console.log(`    - ${f.fundName} (${f.isin}): ${f.error}`));
  }
  console.log(DRY_RUN ? '\n[DRY RUN] No writes performed.\n' : '\nDone.\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
