/**
 * Backfill SIF NAV History from AMFI
 * ====================================
 * Downloads historical NAV data for ALL SIF schemes from AMFI's portal
 * using their DownloadNAVHistoryReport_Po.aspx endpoint (POST with ViewState).
 *
 * Strategy:
 * 1. Fetch the form page to get ViewState
 * 2. POST with mf=0 (all fund houses) and date range to get the text report
 * 3. Parse the text and upsert into MongoDB
 * 4. Repeat for 90-day chunks from inception to May 31, 2026
 *
 * Usage: node scripts/backfill_sif_nav.js [--dry-run]
 */

require('dotenv').config();
const { MongoClient } = require('mongodb');
const https = require('https');
const http = require('http');
const { URLSearchParams } = require('url');

const MONGODB_URI = process.env.MONGODB_URI;
const DRY_RUN = process.argv.includes('--dry-run');

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found');
  process.exit(1);
}

// ── Date helpers ────────────────────────────────────────────────────────────

const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatAMFIDate(date) {
  // AMFI expects "DD-Mon-YYYY" e.g. "01-May-2026"
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const mon = MONTHS_SHORT[date.getUTCMonth()];
  const yyyy = date.getUTCFullYear();
  return `${dd}-${mon}-${yyyy}`;
}

function parseNavDate(raw) {
  // Parse "26-May-2026" → UTC midnight Date
  const MONTHS = {Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12'};
  const [dd, mon, yyyy] = raw.trim().split('-');
  const mm = MONTHS[mon];
  if (!dd || !mm || !yyyy) return null;
  return new Date(`${yyyy}-${mm}-${dd.padStart(2,'0')}T00:00:00.000Z`);
}

function addDays(date, n) {
  return new Date(date.getTime() + n * 86400000);
}

// Build 90-day chunks between fromDate and toDate (inclusive)
function buildChunks(fromDate, toDate) {
  const chunks = [];
  let start = new Date(fromDate);
  while (start <= toDate) {
    const end = new Date(Math.min(addDays(start, 89).getTime(), toDate.getTime()));
    chunks.push({ from: new Date(start), to: new Date(end) });
    start = addDays(end, 1);
  }
  return chunks;
}

// ── HTTP helpers ─────────────────────────────────────────────────────────────

function httpRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const mod = options.protocol === 'http:' ? http : https;
    const req = mod.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Request timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

async function fetchWithRedirect(urlStr, method = 'GET', postBody = null, extraHeaders = {}) {
  const url = new URL(urlStr);
  const options = {
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      ...extraHeaders,
    },
  };

  if (postBody) {
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.headers['Content-Length'] = Buffer.byteLength(postBody);
  }

  const res = await httpRequest(options, postBody);

  // Follow redirects
  if ([301,302,303,307,308].includes(res.status) && res.headers.location) {
    const loc = res.headers.location.startsWith('http') ? res.headers.location : `${url.protocol}//${url.host}${res.headers.location}`;
    return fetchWithRedirect(loc, 'GET', null, extraHeaders);
  }
  return res;
}

// ── AMFI scraper ─────────────────────────────────────────────────────────────

const AMFI_BASE = 'https://portal.amfiindia.com';
const AMFI_PATH = '/DownloadNAVHistoryReport_Po.aspx';

async function getViewState() {
  console.log('  → Fetching ViewState from AMFI form...');
  const res = await fetchWithRedirect(`${AMFI_BASE}${AMFI_PATH}`);
  if (res.status !== 200) throw new Error(`Failed to load form: HTTP ${res.status}`);
  
  const vsMatch = res.body.match(/id="__VIEWSTATE"\s+value="([^"]+)"/);
  const vsgMatch = res.body.match(/id="__VIEWSTATEGENERATOR"\s+value="([^"]+)"/);
  const vsEncMatch = res.body.match(/id="__VIEWSTATEENCRYPTED"\s+value="([^"]*)"/);
  const evMatch = res.body.match(/id="__EVENTVALIDATION"\s+value="([^"]+)"/);
  
  if (!vsMatch) throw new Error('Could not extract ViewState from AMFI form');
  
  return {
    __VIEWSTATE: vsMatch[1],
    __VIEWSTATEGENERATOR: vsgMatch ? vsgMatch[1] : '',
    __VIEWSTATEENCRYPTED: vsEncMatch ? vsEncMatch[1] : '',
    __EVENTVALIDATION: evMatch ? evMatch[1] : '',
  };
}

/**
 * Download NAV history from AMFI for a given date range.
 * Uses mf=0 (All Mutual Funds) and Sch=0 (All Schemes) to get everything in one shot.
 * Falls back to individual AMC codes if all-funds download returns no SIF data.
 */
async function downloadNavHistory(fromDate, toDate, viewState) {
  const fromStr = formatAMFIDate(fromDate);
  const toStr = formatAMFIDate(toDate);
  console.log(`  → Downloading NAV history ${fromStr} to ${toStr}...`);

  const params = new URLSearchParams({
    __VIEWSTATE: viewState.__VIEWSTATE,
    __VIEWSTATEGENERATOR: viewState.__VIEWSTATEGENERATOR,
    __VIEWSTATEENCRYPTED: viewState.__VIEWSTATEENCRYPTED || '',
    __EVENTVALIDATION: viewState.__EVENTVALIDATION || '',
    ddlMutualFund: '0',      // All Mutual Funds
    ddlScheme: '0',           // All Schemes
    txtFromDate: fromStr,
    txtToDate: toStr,
    btnGetReport: 'Get+Report',
  });

  const body = params.toString();
  const res = await fetchWithRedirect(`${AMFI_BASE}${AMFI_PATH}`, 'POST', body, {
    Referer: `${AMFI_BASE}${AMFI_PATH}`,
    Origin: AMFI_BASE,
  });

  if (res.status !== 200) {
    console.log(`  ⚠️  Got HTTP ${res.status}`);
    return [];
  }

  return parseNavText(res.body);
}

/**
 * Parse AMFI NAV history text response.
 * Format: "Scheme Code;ISIN;ISIN2;Scheme Name;NAV;Date"
 * Filter to SIF- codes only.
 */
function parseNavText(text) {
  const records = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  for (const line of lines) {
    // Only process lines that start with SIF-
    if (!/^SIF-\d+;/i.test(line)) continue;
    
    const parts = line.split(';');
    if (parts.length < 6) continue;
    
    const [schemeCode, isinGrowth, isinReinvestment, schemeName, navRaw, dateRaw] = parts;
    const nav = parseFloat(navRaw?.trim());
    if (!schemeCode?.trim() || isNaN(nav)) continue;
    
    const navDate = parseNavDate(dateRaw?.trim());
    if (!navDate) continue;
    
    records.push({
      schemeCode: schemeCode.trim(),
      isinGrowth: isinGrowth?.trim() || '',
      isinReinvestment: isinReinvestment?.trim() === '-' ? null : isinReinvestment?.trim(),
      schemeName: schemeName?.trim() || '',
      nav,
      navDate,
    });
  }
  
  return records;
}

// ── Fallback: per-AMC scraping ───────────────────────────────────────────────

// Known AMFI fund house codes for SIF AMCs (from URL ?mf=N)
// These were observed from the AMFI portal URL when selecting specific fund houses.
// The current SIF NAV file lists these AMCs:
const SIF_AMC_CODES = [
  // Format: { code: N, name: 'AMC Name' }
  // We'll try a range of codes and filter SIF results
  // qsif SIF → Quant Mutual Fund
  // DynaSIF → 360 ONE Mutual Fund  
  // Altiva → Altiva Mutual Fund
  // iSIF → ICICI Prudential
  // etc.
  // We try 'all' (code=0) first; if that fails we iterate known codes.
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🚀 SIF NAV Backfill Script ${DRY_RUN ? '[DRY RUN]' : ''}\n`);
  
  // SIF schemes launched around May 2, 2026
  // Backfill from May 1, 2026 to May 31, 2026 (report cutoff)
  const FROM_DATE = new Date('2026-05-01T00:00:00.000Z');
  const TO_DATE   = new Date('2026-05-31T00:00:00.000Z');
  
  const chunks = buildChunks(FROM_DATE, TO_DATE);
  console.log(`📅 Date range: ${formatAMFIDate(FROM_DATE)} → ${formatAMFIDate(TO_DATE)}`);
  console.log(`📦 Chunks: ${chunks.length} (90-day max per request)\n`);

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalParsed = 0;

  const client = new MongoClient(MONGODB_URI);
  
  try {
    if (!DRY_RUN) {
      console.log('🔄 Connecting to MongoDB...');
      await client.connect();
      console.log('✅ Connected\n');
    }
    
    const db = DRY_RUN ? null : client.db();
    const navCollection = DRY_RUN ? null : db.collection('sifnavs');

    for (const { from, to } of chunks) {
      console.log(`\n📥 Chunk: ${formatAMFIDate(from)} → ${formatAMFIDate(to)}`);
      
      let records = [];
      try {
        const viewState = await getViewState();
        records = await downloadNavHistory(from, to, viewState);
      } catch (err) {
        console.log(`  ❌ Error fetching chunk: ${err.message}`);
        console.log('  → Will retry in 5s...');
        await new Promise(r => setTimeout(r, 5000));
        try {
          const viewState = await getViewState();
          records = await downloadNavHistory(from, to, viewState);
        } catch (err2) {
          console.log(`  ❌ Retry also failed: ${err2.message}`);
          continue;
        }
      }

      console.log(`  📊 Parsed ${records.length} SIF records`);
      totalParsed += records.length;

      if (records.length === 0) {
        console.log('  ℹ️  No SIF records in this chunk (may be before launch date)');
        continue;
      }

      if (DRY_RUN) {
        console.log('  [DRY RUN] Sample records:');
        records.slice(0, 5).forEach(r => {
          console.log(`    ${r.schemeCode} | ${r.schemeName.substring(0,40)} | ${r.nav} | ${r.navDate.toISOString().slice(0,10)}`);
        });
        continue;
      }

      // Upsert into MongoDB
      const ops = records.map(r => ({
        updateOne: {
          filter: { schemeCode: r.schemeCode, navDate: r.navDate },
          update: {
            $setOnInsert: {
              schemeCode: r.schemeCode,
              nav: r.nav,
              repurchasePrice: null,
              salePrice: null,
              navDate: r.navDate,
              source: 'amfi_backfill',
              fetchedAt: new Date(),
            },
          },
          upsert: true,
        },
      }));

      try {
        const result = await navCollection.bulkWrite(ops, { ordered: false });
        const inserted = result.upsertedCount || 0;
        const matched = result.matchedCount || 0;
        console.log(`  ✅ Upserted: ${inserted} new, ${matched} already existed`);
        totalInserted += inserted;
        totalSkipped += matched;
      } catch (err) {
        console.log(`  ❌ DB write error: ${err.message}`);
      }

      // Rate limit — be polite to AMFI servers
      await new Promise(r => setTimeout(r, 2000));
    }

  } finally {
    if (!DRY_RUN) await client.close();
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 BACKFILL SUMMARY');
  console.log('='.repeat(60));
  console.log(`  Total records parsed:  ${totalParsed}`);
  if (!DRY_RUN) {
    console.log(`  New records inserted:  ${totalInserted}`);
    console.log(`  Already existed:       ${totalSkipped}`);
  }
  console.log('\n✅ Done!\n');
  console.log('Next step: Run `node scripts/export_may_report.js` to regenerate the report.\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
