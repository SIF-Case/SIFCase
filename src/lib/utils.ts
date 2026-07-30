import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Inception date is free text from KIM/ISID entry (or an AI extraction that
// sometimes emits a raw ISO timestamp), so normalise the common shapes to
// "15 Mar 2025". Anything unparseable is passed through untouched.
export function formatInceptionDate(raw?: string | null): string {
  if (!raw) return "";
  let s = raw.trim();
  if (!s) return s;

  // Strip a trailing time component: "2025-10-20T00:00:00.000" / "21-Apr-26 12:00:00 AM"
  s = s.replace(/[T\s]+\d{1,2}:\d{2}(:\d{2}(\.\d+)?)?\s*(AM|PM)?$/i, "").trim();

  const monthIndex = (name: string) =>
    MONTH_NAMES.findIndex((m) => name.toLowerCase().startsWith(m.toLowerCase()));

  const fullYear = (y: number) => (y < 100 ? (y < 70 ? 2000 + y : 1900 + y) : y);

  const build = (day: number, month: number, year: number) => {
    const y = fullYear(year);
    if (month < 0 || month > 11 || day < 1 || day > 31 || y < 1900) return null;
    return `${day} ${MONTH_NAMES[month]} ${y}`;
  };

  // 2025-03-15 / 2025/03/15
  let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) return build(+m[3], +m[2] - 1, +m[1]) ?? s;

  // 15-03-2025 / 15/03/2025 / 15.03.2025 / 15-03-26 (day first — Indian convention)
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (m) return build(+m[1], +m[2] - 1, +m[3]) ?? s;

  // 15 Mar 2025 / 15-Mar-2025 / 15 March, 2025 / 21-Apr-26
  m = s.match(/^(\d{1,2})[-\s]+([A-Za-z]+),?[-\s]+(\d{2,4})$/);
  if (m) return build(+m[1], monthIndex(m[2]), +m[3]) ?? s;

  // Mar 15, 2025 / March 15 2025
  m = s.match(/^([A-Za-z]+)[-\s]+(\d{1,2}),?[-\s]+(\d{2,4})$/);
  if (m) return build(+m[2], monthIndex(m[1]), +m[3]) ?? s;

  return s;
}

export function formatFundName(name?: string | null): string {
  if (!name) return "";
  let fixed = name;
  fixed = fixed.replace(/\bqsif\b/ig, "qsif");
  fixed = fixed.replace(/\bisif\b/ig, "isif");
  fixed = fixed.replace(/\bwsif\b/ig, "wsif");
  // Optional: Capitalize first letters, or just fix specific prefixes
  return fixed;
}
