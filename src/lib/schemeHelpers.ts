export function deriveFundName(schemeName: string): string {
  const m = schemeName.match(/^(.*\b(?:fund|sif)\b)/i);
  if (m) return m[1].replace(/[\s\-]+$/, "").trim();
  return schemeName.split(/\s*[-–]\s*/)[0].trim();
}

export function deriveCompanyNameShort(companyName: string): string {
  return companyName
    .replace(/\s+(Mutual\s+Funds?(?:\s+Limited)?|Asset\s+Management(?:\s+Company)?)\s*$/i, "")
    .trim();
}

const GENERIC_STARTS = /^(equity|hybrid|debt|liquid|balanced|index|flexi|multi|sectoral|mid|small|large|dynamic|short|ultra|long|fund|sif)\b/i;
export function deriveBrandName(schemeName: string): string {
  const words = schemeName.trim().split(/\s+/);
  if (words.length === 0) return "";
  if (!GENERIC_STARTS.test(words[0])) return words[0];
  return words[0];
}
