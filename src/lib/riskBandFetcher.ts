/**
 * Fetch and store risk band (riskometer) data from AMFI XML feeds
 * 
 * AMFI provides scheme summary documents in XML format at:
 * https://www.amfiindia.com/research-information/other-data/sif-scheme-performance
 * 
 * Each scheme has an XML file with risk band information.
 */

import { connectDB } from "./mongodb";
import { parseStringPromise } from "xml2js";

export interface RiskBandFetchResult {
  fetched: number;
  updated: number;
  skipped: number;
  errors: string[];
}

// Map text risk bands to numeric values
const RISK_BAND_MAP: Record<string, 1 | 2 | 3 | 4 | 5> = {
  'Risk Band Level 1': 1,
  'Risk Band Level 2': 2,
  'Risk Band Level 3': 3,
  'Risk Band Level 4': 4,
  'Risk Band Level 5': 5,
  'Low Risk': 1,
  'Low to Moderate Risk': 2,
  'Moderate Risk': 3,
  'Moderately High Risk': 4,
  'High Risk': 5,
  'Very Low': 1,
  'Low': 1,
  'Moderately Low': 2,
  'Moderate': 3,
  'Moderately High': 4,
  'High': 5,
  'Very High': 5,
};

function normalizeRiskBand(value: string): 1 | 2 | 3 | 4 | 5 | null {
  if (!value) return null;

  const cleaned = value.trim();

  // Check mapped strings first
  if (RISK_BAND_MAP[cleaned]) {
    return RISK_BAND_MAP[cleaned];
  }

  // Extract numeric value (e.g., "Level 3" → 3)
  const numMatch = cleaned.match(/(\d)/);
  if (numMatch) {
    const num = parseInt(numMatch[1]);
    if (num >= 1 && num <= 5) {
      return num as 1 | 2 | 3 | 4 | 5;
    }
  }

  return null;
}

/**
 * Fetch scheme list from AMFI to get XML URLs
 * Note: This is a placeholder - actual AMFI XML structure needs to be verified
 */
async function getSchemeXMLUrls(): Promise<Array<{ schemeCode: string; xmlUrl: string }>> {
  // AMFI doesn't provide a direct XML API for risk bands
  // Risk band data is typically in:
  // 1. PDF factsheets
  // 2. XLS scheme summary documents
  // 3. Individual scheme pages on AMFI portal

  // For now, return empty array - manual upload is required
  console.warn('AMFI does not provide a public XML API for risk band data');
  return [];
}

/**
 * Parse XML and extract risk band
 */
async function parseSchemeXML(xmlContent: string): Promise<{
  fundName: string | null;
  riskBand: 1 | 2 | 3 | 4 | 5 | null;
}> {
  try {
    const result = await parseStringPromise(xmlContent);

    // Expected XML structure (this is hypothetical - needs verification):
    // <SchemeData>
    //   <FundName>Altiva Hybrid Long-Short Fund</FundName>
    //   <Riskometer>Risk Band Level 1</Riskometer>
    // </SchemeData>

    const fundName = result?.SchemeData?.FundName?.[0] || null;
    const riskBandText = result?.SchemeData?.Riskometer?.[0] || null;
    const riskBand = riskBandText ? normalizeRiskBand(riskBandText) : null;

    return { fundName, riskBand };
  } catch (error) {
    throw new Error(`XML parse error: ${error}`);
  }
}

/**
 * Main function to fetch and store risk bands from AMFI
 */
export async function fetchAndStoreRiskBands(): Promise<RiskBandFetchResult> {
  await connectDB();

  const result: RiskBandFetchResult = {
    fetched: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Get list of scheme XML URLs
    const schemes = await getSchemeXMLUrls();
    result.fetched = schemes.length;

    if (schemes.length === 0) {
      result.errors.push('No XML URLs available - AMFI does not provide public risk band API');
      return result;
    }

    const db = (await import('mongoose')).connection.db!;
    const fundDetails = db.collection('funddetails');

    // Process each scheme
    for (const { schemeCode, xmlUrl } of schemes) {
      try {
        // Fetch XML
        const response = await fetch(xmlUrl, { cache: 'no-store' });
        if (!response.ok) {
          result.errors.push(`HTTP ${response.status} for ${schemeCode}`);
          continue;
        }

        const xmlContent = await response.text();
        const { fundName, riskBand } = await parseSchemeXML(xmlContent);

        if (!fundName || !riskBand) {
          result.skipped++;
          continue;
        }

        // Update database
        const updateResult = await fundDetails.updateOne(
          { fundName: { $regex: new RegExp(`^${fundName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
          { $set: { riskBand, riskBandUpdatedAt: new Date() } }
        );

        if (updateResult.matchedCount > 0) {
          result.updated++;
        } else {
          result.errors.push(`Fund not found in DB: ${fundName}`);
        }
      } catch (error) {
        result.errors.push(`Error processing ${schemeCode}: ${error}`);
      }
    }
  } catch (error) {
    result.errors.push(`Fatal error: ${error}`);
  }

  return result;
}

/**
 * Alternative: Scrape risk band from AMFI website
 * This would require parsing HTML from individual scheme pages
 */
export async function scrapeRiskBandFromAMFI(schemeCode: string): Promise<number | null> {
  try {
    // AMFI scheme detail URL (hypothetical - needs verification)
    const url = `https://www.amfiindia.com/scheme-detail/${schemeCode}`;

    const response = await fetch(url);
    if (!response.ok) return null;

    const html = await response.text();

    // Look for risk band in HTML (this regex is hypothetical)
    const riskMatch = html.match(/Risk Band Level (\d)/i) ||
      html.match(/riskometer.*?level[^\d]*(\d)/i);

    if (riskMatch && riskMatch[1]) {
      const level = parseInt(riskMatch[1]);
      if (level >= 1 && level <= 5) {
        return level;
      }
    }

    return null;
  } catch (error) {
    console.error(`Error scraping risk band for ${schemeCode}:`, error);
    return null;
  }
}
