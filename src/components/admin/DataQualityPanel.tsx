import Link from "next/link";
import type { Db } from "mongodb";
import { ShieldAlert, ShieldCheck, ChevronDown } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────

type Severity = "critical" | "warning";

type Finding = {
  title: string;
  href: string;
};

type Category = {
  key: string;
  label: string;
  description: string;
  severity: Severity;
  findings: Finding[];
};

export type DataQualityResult = {
  categories: Category[];
  totalIssues: number;
};

// ── Checks — run against the raw MongoDB driver so this works with the same
//    collections the rest of /admin uses, no separate model wiring needed. ──

export async function runDataQualityChecks(db: Db): Promise<DataQualityResult> {
  const schemes = db.collection("sifschemes");
  const fundDetails = db.collection("funddetails");
  const clients = db.collection("clients");
  const users = db.collection("users");

  const [
    regularGrowthSchemes,
    allFundDetails,
    allClients,
    allUserIds,
  ] = await Promise.all([
    schemes.find(
      { plan: "Regular" },
      { projection: { fundName: 1, isinGrowth: 1, isinReinvestment: 1, _id: 0 } },
    ).toArray(),
    fundDetails.find(
      {},
      { projection: { fundName: 1, riskBand: 1, aumCurrent: 1, benchmarkName: 1, updatedAt: 1, _id: 0 } },
    ).toArray(),
    clients.find(
      {},
      { projection: { name: 1, phone: 1, linkedUserId: 1, _id: 1 } },
    ).toArray(),
    users.distinct("_id"),
  ]);

  const userIdSet = new Set(allUserIds.map((id) => String(id)));
  const detailsByFund = new Map(allFundDetails.map((d) => [d.fundName as string, d]));

  // One row per fund (a fund can have multiple plan/option scheme rows) —
  // pick the Regular/Growth ISIN the same way the finapi sync does.
  const fundNames = [...new Set(regularGrowthSchemes.map((s) => s.fundName as string))].sort();

  // ── Placeholder ISINs ("-") on the Regular plan ──────────────────────────
  const placeholderIsinFunds = fundNames.filter((name) => {
    const rows = regularGrowthSchemes.filter((s) => s.fundName === name);
    return rows.every((r) => !r.isinGrowth || r.isinGrowth === "-") &&
      rows.every((r) => !r.isinReinvestment || r.isinReinvestment === "-");
  });

  // ── Never synced from finapi (no FundDetails doc at all) ────────────────
  const neverSynced = fundNames.filter((name) => !detailsByFund.has(name));

  // ── Synced but missing key fields ────────────────────────────────────────
  const missingRiskBand: string[] = [];
  const missingAum: string[] = [];
  const missingBenchmark: string[] = [];
  for (const name of fundNames) {
    const d = detailsByFund.get(name);
    if (!d) continue; // already counted under "never synced"
    if (d.riskBand == null) missingRiskBand.push(name);
    if (d.aumCurrent == null) missingAum.push(name);
    if (!d.benchmarkName) missingBenchmark.push(name);
  }

  // ── CRM: orphaned Client records (linkedUserId points to a deleted User) ─
  const orphanedClients = allClients.filter(
    (c) => c.linkedUserId && !userIdSet.has(String(c.linkedUserId)),
  );

  // ── CRM: duplicate phone numbers across Client records ───────────────────
  const byPhone = new Map<string, typeof allClients>();
  for (const c of allClients) {
    const digits = String(c.phone || "").replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) continue;
    if (!byPhone.has(digits)) byPhone.set(digits, []);
    byPhone.get(digits)!.push(c);
  }
  const duplicatePhoneGroups = [...byPhone.entries()].filter(([, group]) => group.length > 1);

  // ── Assemble ──────────────────────────────────────────────────────────────
  const categories: Category[] = [
    {
      key: "placeholder-isin",
      label: "Placeholder ISINs",
      description: "Regular-plan funds with no real ISIN on record (\"-\") — can't be synced from finapi until fixed in Funds.",
      severity: "critical" as const,
      findings: placeholderIsinFunds.map((name) => ({
        title: name,
        href: `/admin/schemes?q=${encodeURIComponent(name)}`,
      })),
    },
    {
      key: "never-synced",
      label: "Never synced from finapi",
      description: "Funds with a valid scheme but no FundDetails record yet — holdings, sectors, fundamentals all blank.",
      severity: "critical" as const,
      findings: neverSynced.map((name) => ({
        title: name,
        href: `/admin/fund-details?fund=${encodeURIComponent(name)}`,
      })),
    },
    {
      key: "missing-riskband",
      label: "Missing risk band",
      description: "Synced funds where riskBand is still null — usually an unmapped finapi risk-label variant.",
      severity: "warning" as const,
      findings: missingRiskBand.map((name) => ({
        title: name,
        href: `/admin/fund-details?fund=${encodeURIComponent(name)}`,
      })),
    },
    {
      key: "missing-aum",
      label: "Missing AUM",
      description: "Synced funds with no current AUM value.",
      severity: "warning" as const,
      findings: missingAum.map((name) => ({
        title: name,
        href: `/admin/fund-details?fund=${encodeURIComponent(name)}`,
      })),
    },
    {
      key: "missing-benchmark",
      label: "Missing benchmark",
      description: "Synced funds with no benchmark index on record.",
      severity: "warning" as const,
      findings: missingBenchmark.map((name) => ({
        title: name,
        href: `/admin/fund-details?fund=${encodeURIComponent(name)}`,
      })),
    },
    {
      key: "orphaned-clients",
      label: "Orphaned CRM records",
      description: "Client records linked to a User account that no longer exists — leftover from a User deletion.",
      severity: "critical" as const,
      findings: orphanedClients.map((c) => ({
        title: (c.name as string) || (c.phone as string) || String(c._id),
        href: `/admin/clients`,
      })),
    },
    {
      key: "duplicate-phones",
      label: "Duplicate phone numbers",
      description: "Multiple Client records sharing the same phone number — usually a leftover from a re-signup.",
      severity: "warning" as const,
      findings: duplicatePhoneGroups.map(([digits, group]) => ({
        title: `${digits} — ${group.map((c) => c.name || "unnamed").join(", ")}`,
        href: `/admin/clients?q=${encodeURIComponent(digits)}`,
      })),
    },
  ].filter((c) => c.findings.length > 0);

  const totalIssues = categories.reduce((sum, c) => sum + c.findings.length, 0);

  return { categories, totalIssues };
}

// ── Presentation ──────────────────────────────────────────────────────────

export function DataQualityPanel({ result }: { result: DataQualityResult }) {
  const { categories, totalIssues } = result;

  if (totalIssues === 0) {
    return (
      <div className="bg-white rounded-[14px] border border-emerald-200 shadow-card mb-8 px-5 py-4 flex items-center gap-2.5">
        <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
        <p className="text-[13px] text-body">
          <span className="font-semibold text-emerald-700">Data quality: all clear.</span> No missing risk bands, AUM, benchmarks, placeholder ISINs, or orphaned CRM records.
        </p>
      </div>
    );
  }

  const criticalCount = categories.filter((c) => c.severity === "critical").reduce((s, c) => s + c.findings.length, 0);

  return (
    <div className="bg-white rounded-[14px] border border-amber-200 shadow-card mb-8">
      <div className="px-5 py-4 border-b border-amber-100 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-amber-600" />
          <h2 className="text-[15px] font-bold text-heading">Data Quality</h2>
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            {totalIssues} issue{totalIssues === 1 ? "" : "s"}
          </span>
          {criticalCount > 0 && (
            <span className="text-[11px] font-semibold text-loss bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              {criticalCount} critical
            </span>
          )}
        </div>
        <p className="text-[12px] text-muted">Funds, schemes &amp; CRM records that need attention</p>
      </div>

      <div className="divide-y divide-rule">
        {categories.map((cat) => (
          <details key={cat.key} className="group" open={cat.severity === "critical"}>
            <summary className="flex items-center gap-3 px-5 py-3 cursor-pointer select-none hover:bg-surface transition-colors list-none">
              <ChevronDown className="size-3.5 text-muted shrink-0 transition-transform group-open:rotate-180" />
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] font-mono uppercase tracking-wide shrink-0 ${
                  cat.severity === "critical"
                    ? "text-loss bg-red-50 border border-red-200"
                    : "text-amber-700 bg-amber-50 border border-amber-200"
                }`}
              >
                {cat.severity}
              </span>
              <span className="text-[13.5px] font-semibold text-heading">{cat.label}</span>
              <span className="text-[12px] text-muted">({cat.findings.length})</span>
              <span className="text-[11.5px] text-faint ml-auto hidden lg:block truncate max-w-[40%]">{cat.description}</span>
            </summary>
            <div className="pb-2">
              {cat.findings.map((f, i) => (
                <Link
                  key={`${cat.key}-${i}`}
                  href={f.href}
                  className="flex items-center gap-2 px-5 py-2 pl-11 text-[12.5px] text-body hover:bg-surface hover:text-primary transition-colors truncate"
                >
                  {f.title}
                </Link>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
