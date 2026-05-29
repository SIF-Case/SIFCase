import * as XLSX from "xlsx";
import type { Fund } from "@/lib/data";

export type ExportRow = {
  Name: string;
  AMC: string;
  Strategy: string;
  Category: string;
  Risk: number;
  AUM_Cr: number;
  NAV: number;
  Expense_Pct: number;
  Return_YTD: number;
  Return_1M: number;
  Return_3M: number;
  Return_6M: number;
  Return_1Y: number;
  Return_SI: number;
  Sharpe: number;
  Vol_Pct: number;
  Drawdown_Pct: number;
  Alpha: number;
  Beta: number;
  Benchmark: string;
  Launch: string;
};

export function toRows(funds: Fund[]): ExportRow[] {
  return funds.map((f) => ({
    Name: f.name,
    AMC: f.amc,
    Strategy: f.strategy,
    Category: f.category,
    Risk: f.risk,
    AUM_Cr: f.aum,
    NAV: f.nav,
    Expense_Pct: f.expense,
    Return_YTD: f.returns.ytd,
    Return_1M: f.returns.m1,
    Return_3M: f.returns.m3,
    Return_6M: f.returns.m6,
    Return_1Y: f.returns.y1,
    Return_SI: f.returns.si,
    Sharpe: f.metrics.sharpe,
    Vol_Pct: f.metrics.vol,
    Drawdown_Pct: f.metrics.drawdown,
    Alpha: f.metrics.alpha,
    Beta: f.metrics.beta,
    Benchmark: f.benchmark,
    Launch: f.launch,
  }));
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const ts = () => new Date().toISOString().slice(0, 10);

export function exportCSV(funds: Fund[]) {
  const rows = toRows(funds);
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = (r as Record<string, unknown>)[h];
          const s = v == null ? "" : String(v);
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    ),
  ];
  download(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" }), `sifhub-funds-${ts()}.csv`);
}

export function exportJSON(funds: Fund[]) {
  download(
    new Blob([JSON.stringify(toRows(funds), null, 2)], { type: "application/json" }),
    `sifhub-funds-${ts()}.json`,
  );
}

export function exportXLSX(funds: Fund[]) {
  const ws = XLSX.utils.json_to_sheet(toRows(funds));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "SIFs");
  XLSX.writeFile(wb, `sifhub-funds-${ts()}.xlsx`);
}

export function printPDF() {
  window.print();
}

export async function copyShareLink() {
  if (typeof window === "undefined") return;
  await navigator.clipboard.writeText(window.location.href);
}
