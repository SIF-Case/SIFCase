import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFundName(name?: string | null): string {
  if (!name) return "";
  let fixed = name;
  fixed = fixed.replace(/\bqsif\b/ig, "qSIF");
  fixed = fixed.replace(/\bisif\b/ig, "iSIF");
  fixed = fixed.replace(/\bwsif\b/ig, "WSIF");
  // Optional: Capitalize first letters, or just fix specific prefixes
  return fixed;
}
