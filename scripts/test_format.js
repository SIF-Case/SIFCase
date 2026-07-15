function formatFundName(name) {
  if (!name) return name;
  let fixed = name;
  fixed = fixed.replace(/\bqsif\b/ig, "qSIF");
  fixed = fixed.replace(/\bisif\b/ig, "iSIF");
  fixed = fixed.replace(/\bwsif\b/ig, "WSIF");
  return fixed;
}
console.log(formatFundName("qsif Sector Rotation Long-Short Fund"));
console.log(formatFundName("isif Active Momentum Long-Short Fund"));
console.log(formatFundName("wsif Equity Ex-Top 100 Long-Short Fund"));
console.log(formatFundName("QSIF MULTI-ASSET"));
