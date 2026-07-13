import { connectDB } from "./mongodb";
import SifAum from "@/models/SifAum";

export interface AumFetchResult {
  ok: boolean;
  financialYear?: string;
  period?: string;
  totalAumLakhs?: number;
  errors: string[];
}

const AMFI_SIF_AUM_BASE = "https://www.amfiindia.com/api/sif-average-aum-fundwise";

interface FinancialYearsResponse {
  data: { id: number; financial_year: string }[];
}

interface PeriodsResponse {
  data: { financial_year: string; periods: { id: number; period: string }[] };
}

interface AumTableResponse {
  selectedPeriod: string;
  data: { Sr_No: string; SIFName: string; AUM: number | string; averageAUM: number | string }[];
  grandTotals: { aum: number; averageAum?: number; av?: number } | null;
}

/** Fetches the latest published SIF Average AUM figures from AMFI and stores them. */
export async function fetchAndStoreSifAum(): Promise<AumFetchResult> {
  await connectDB();
  const errors: string[] = [];

  try {
    // 1. Financial years — AMFI lists the current/most recent FY first.
    const fyRes = await fetch(AMFI_SIF_AUM_BASE, { cache: "no-store" });
    if (!fyRes.ok) throw new Error(`Financial years HTTP ${fyRes.status}`);
    const fyJson: FinancialYearsResponse = await fyRes.json();
    const latestFy = fyJson.data?.[0];
    if (!latestFy) throw new Error("No financial years returned");

    // 2. Periods within that FY — take the most recently published period (max id).
    const periodsRes = await fetch(`${AMFI_SIF_AUM_BASE}?fyId=${latestFy.id}`, { cache: "no-store" });
    if (!periodsRes.ok) throw new Error(`Periods HTTP ${periodsRes.status}`);
    const periodsJson: PeriodsResponse = await periodsRes.json();
    const periods = periodsJson.data?.periods ?? [];
    if (periods.length === 0) throw new Error("No periods returned for latest financial year");
    const latestPeriod = periods.reduce((a, b) => (b.id > a.id ? b : a));

    // 3. Actual AUM table for that fy+period.
    const tableRes = await fetch(`${AMFI_SIF_AUM_BASE}?fyId=${latestFy.id}&periodId=${latestPeriod.id}`, { cache: "no-store" });
    if (!tableRes.ok) throw new Error(`AUM table HTTP ${tableRes.status}`);
    const tableJson: AumTableResponse = await tableRes.json();
    if (!tableJson.grandTotals) throw new Error("No grandTotals in AUM table response");

    const byAmc = (tableJson.data ?? [])
      .map((row) => ({
        amc: row.SIFName,
        aumLakhs: typeof row.AUM === "number" ? row.AUM : null,
        averageAumLakhs: typeof row.averageAUM === "number" ? row.averageAUM : null,
      }))
      .filter((r) => r.aumLakhs !== null || r.averageAumLakhs !== null);

    await SifAum.findOneAndUpdate(
      { fyId: String(latestFy.id), periodId: String(latestPeriod.id) },
      {
        fyId: String(latestFy.id),
        periodId: String(latestPeriod.id),
        periodLabel: latestPeriod.period,
        financialYear: latestFy.financial_year,
        totalAumLakhs: tableJson.grandTotals.aum,
        totalAverageAumLakhs: tableJson.grandTotals.averageAum ?? tableJson.grandTotals.av ?? null,
        byAmc,
        fetchedAt: new Date(),
      },
      { upsert: true },
    );

    return {
      ok: true,
      financialYear: latestFy.financial_year,
      period: latestPeriod.period,
      totalAumLakhs: tableJson.grandTotals.aum,
      errors,
    };
  } catch (err) {
    errors.push(String(err));
    return { ok: false, errors };
  }
}
