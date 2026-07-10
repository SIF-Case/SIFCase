/**
 * Export all 28 SIF funds to a fund-wise (one row per fund) multi-sheet Excel workbook.
 * Every repeating item (holdings, sectors, managers, etc.) gets its own indexed column
 * — Holding (1), Holding (2), ... — sized to the longest list across all funds. Funds
 * with fewer/no items just get blank cells; funds with no FundDetails doc at all
 * (not yet synced) still get a full row of blanks, never skipped.
 *
 * Usage: node scripts/export_fund_details_excel.js [outPath]
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const XLSX = require('xlsx');
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not found');
  process.exit(1);
}

const OUT_PATH = process.argv[2] || path.join(__dirname, '..', 'Fund_Details_Export.xlsx');

function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toISOString().slice(0, 10);
}

function maxLen(funds, getArr) {
  return funds.reduce((m, f) => Math.max(m, (getArr(f) || []).length), 0);
}

// Build a fund-wise sheet: one row per fund, N indexed columns for a repeating field.
function indexedSheet(funds, label, getArr, cellFn) {
  const n = maxLen(funds, getArr);
  const rows = funds.map((f) => {
    const row = { 'Fund Name': f.fundName };
    const arr = getArr(f) || [];
    for (let i = 0; i < n; i++) {
      row[`${label} (${i + 1})`] = arr[i] ? cellFn(arr[i]) : '';
    }
    return row;
  });
  return { rows, n };
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();

  const schemes = await db.collection('sifschemes').find({ plan: 'Regular' }).toArray();
  const allFundNames = [...new Set(schemes.map((s) => s.fundName))].sort();

  const detailsDocs = await db.collection('funddetails').find({}).toArray();
  const detailsByName = new Map(detailsDocs.map((d) => [d.fundName, d]));

  const isinsByFund = new Map();
  for (const s of schemes) {
    if (!isinsByFund.has(s.fundName)) isinsByFund.set(s.fundName, []);
    isinsByFund.get(s.fundName).push(s);
  }

  // Every fund gets a row — synced or not. Empty object stands in for "not yet synced".
  const funds = allFundNames.map((fundName) => ({
    fundName,
    ...(detailsByName.get(fundName) || {}),
  }));

  const wb = XLSX.utils.book_new();

  // ── Overview ─────────────────────────────────────────────────────────────
  const overviewRows = funds.map((f) => {
    const schemeRows = isinsByFund.get(f.fundName) || [];
    const growthIsin = schemeRows.find((s) => s.isinGrowth && s.isinGrowth !== '-')?.isinGrowth || '';
    const reinvIsin = schemeRows.find((s) => s.isinReinvestment)?.isinReinvestment || '';
    return {
      'Fund Name': f.fundName,
      'Synced from finapi': f.lastSyncedFromFinApi ? 'Yes' : 'No',
      'AMC': f.amcName || '',
      'Scheme Category': f.schemeCategory || '',
      'Scheme Nature': f.schemeNature || '',
      'Scheme Type': f.schemeType || '',
      'Benchmark': f.benchmarkName || '',
      'Inception Date': f.inceptionDate || '',
      'Risk Band': f.riskBand ?? '',
      'Benchmark Risk Band': f.benchmarkRiskBand ?? '',
      'AUM Current (Cr)': f.aumCurrent ?? '',
      'AUM Aggregate (Cr)': f.aumAggregate ?? '',
      'AUM End (Cr)': f.aumEnd ?? '',
      'TER Max (%)': f.terMax || '',
      'Exit Load': f.exitLoad || '',
      'Min Investment': f.minInvestment ?? '',
      'Additional Investment': f.additionalInvestment ?? '',
      'ISIN (Regular Growth)': f.isin || growthIsin,
      'ISIN (Regular IDCW Reinvestment)': reinvIsin,
      'External Scheme Code': f.externalSchemeCode || '',
      'Concentration - # Holdings': f.concentration?.numberOfHoldings ?? '',
      'Concentration - Avg Mkt Cap': f.concentration?.averageMarketCap || '',
      'Concentration - Top 3 Sector Wt (%)': f.concentration?.top3SectorWeight ?? '',
      'Concentration - Top 5 Stocks Wt (%)': f.concentration?.top5StocksWeight ?? '',
      'Concentration - Top 10 Stocks Wt (%)': f.concentration?.top10StocksWeight ?? '',
      'Mkt Cap - Large (%)': f.marketCapWeightage?.largeCap ?? '',
      'Mkt Cap - Mid (%)': f.marketCapWeightage?.midCap ?? '',
      'Mkt Cap - Small (%)': f.marketCapWeightage?.smallCap ?? '',
      'Mkt Cap - Others (%)': f.marketCapWeightage?.others ?? '',
      'PE': f.fundamentals?.pe ?? '',
      'Category Avg PE': f.fundamentals?.categoryAveragePe ?? '',
      'PB': f.fundamentals?.pb ?? '',
      'Category Avg PB': f.fundamentals?.categoryAveragePb ?? '',
      'Price/Sale': f.fundamentals?.priceToSale ?? '',
      'Category Avg Price/Sale': f.fundamentals?.categoryAveragePriceToSale ?? '',
      'Price/Cash Flow': f.fundamentals?.priceToCashFlow ?? '',
      'Category Avg Price/Cash Flow': f.fundamentals?.categoryAveragePriceToCashFlow ?? '',
      'Dividend Yield (%)': f.fundamentals?.dividendYield ?? '',
      'Category Avg Div Yield (%)': f.fundamentals?.categoryAverageDividendYield ?? '',
      'ROE (%)': f.fundamentals?.roe ?? '',
      'Category Avg ROE (%)': f.fundamentals?.categoryAverageRoe ?? '',
      'Last Synced (finapi)': fmtDate(f.lastSyncedFromFinApi),
      'Last Updated': fmtDate(f.updatedAt),
    };
  });
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(overviewRows), 'Overview');

  // ── Asset Allocation ─────────────────────────────────────────────────────
  const assetAlloc = indexedSheet(
    funds, 'Asset Class', (f) => f.assetAllocation,
    (a) => `${a.assetClass}: ${a.percentage}%`,
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assetAlloc.rows), 'Asset Allocation');

  // ── Fund Managers ────────────────────────────────────────────────────────
  const managers = indexedSheet(
    funds, 'Manager', (f) => f.fundManagers,
    (m) => m.name,
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(managers.rows), 'Fund Managers');

  // ── Top Holdings ─────────────────────────────────────────────────────────
  const holdings = indexedSheet(
    funds, 'Holding', (f) => f.topHoldings,
    (h) => `${h.name}${h.sector ? ` [${h.sector}]` : ''} — ${h.percentage}%`,
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(holdings.rows), 'Top Holdings');

  // ── Sector Allocation ────────────────────────────────────────────────────
  const sectors = indexedSheet(
    funds, 'Sector', (f) => f.portfolioByIndustry,
    (s) => `${s.industry} — ${s.percentage}%`,
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sectors.rows), 'Sector Allocation');

  // ── Rolling Returns ──────────────────────────────────────────────────────
  const rolling = indexedSheet(
    funds, 'Rolling Return', (f) => f.rollingReturns,
    (r) => `${r.timeframe}: avg ${r.averageReturn}%, median ${r.medianReturn}%, min ${r.minReturn}% (${r.minPeriod}), max ${r.maxReturn}% (${r.maxPeriod}), stdDev ${r.standardDeviation}, consistency ${r.consistencyScore}`,
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rolling.rows), 'Rolling Returns');

  // ── Category Ranks ───────────────────────────────────────────────────────
  const ranks = indexedSheet(
    funds, 'Category Rank', (f) => f.categoryRanks,
    (r) => `${r.timeframe}: ${r.annualizedReturn}% (cat avg ${r.categoryAverage}%) — ${r.rankInCategory}`,
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ranks.rows), 'Category Ranks');

  // ── Risk Metrics (flatten metric x timeframe) ───────────────────────────
  const riskEntries = (f) => {
    const rm = f.riskMetricsConclusions;
    if (!rm) return [];
    const out = [];
    for (const [metric, group] of Object.entries(rm)) {
      for (const tf of group?.timeframes || []) {
        out.push({ metric, timeframe: tf.timeframe, conclusion: tf.conclusion });
      }
    }
    return out;
  };
  const riskMetrics = indexedSheet(
    funds, 'Risk Metric', riskEntries,
    (r) => `${r.metric} / ${r.timeframe}: ${r.conclusion}`,
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(riskMetrics.rows), 'Risk Metrics');

  // ── Peers ────────────────────────────────────────────────────────────────
  const peers = indexedSheet(
    funds, 'Peer', (f) => f.peers,
    (p) => `${p.schemeName || p.schemeNameShort} (${p.isin}) — AUM ${p.aum}, PE ${p.pe}, PB ${p.pb}, DivYield ${p.dividendYield}, TER ${p.expenseRatio}`,
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(peers.rows), 'Peers');

  // ── AMC Other Funds ──────────────────────────────────────────────────────
  const amcFunds = indexedSheet(
    funds, 'AMC Fund', (f) => f.amcOtherFunds?.schemeList,
    (s) => `${s.schemeName || s.schemeShortName} (${s.isin}) — AUM ${s.aum}, Rating ${s.morningstarRating ?? '—'}`,
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(amcFunds.rows), 'AMC Other Funds');

  // ── Plan Codes ───────────────────────────────────────────────────────────
  const planCodes = indexedSheet(
    funds, 'Plan Code', (f) => f.planCodes,
    (pc) => `${pc.planName}: ${pc.isin}`,
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(planCodes.rows), 'Plan Codes');

  XLSX.writeFile(wb, OUT_PATH);
  console.log(`Wrote ${OUT_PATH}`);
  console.log(`  Funds: ${funds.length} (all schemes, synced + unsynced)`);
  console.log(`  Holdings columns: ${holdings.n}, AMC Other Funds columns: ${amcFunds.n}, Peers columns: ${peers.n}`);
  console.log(`  Sheets: Overview, Asset Allocation, Fund Managers, Top Holdings, Sector Allocation, Rolling Returns, Category Ranks, Risk Metrics, Peers, AMC Other Funds, Plan Codes`);

  await client.close();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
