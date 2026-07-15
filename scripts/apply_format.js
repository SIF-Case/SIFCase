const fs = require('fs');

const path = 'src/lib/sifData.ts';
let code = fs.readFileSync(path, 'utf-8');

// Add import
if (!code.includes('import { formatFundName }')) {
  code = code.replace('import { unstable_cache } from "next/cache";', 'import { unstable_cache } from "next/cache";\nimport { formatFundName } from "@/lib/utils";');
}

// Replace occurrences
code = code.replace(/fundName: \(s\.fundName as string\) \|\| \(s\.schemeName as string\),/g, 'fundName: formatFundName((s.fundName as string) || (s.schemeName as string)),');
code = code.replace(/name: s\.schemeName as string,/g, 'name: formatFundName(s.schemeName as string),');
code = code.replace(/name: s\.name,/g, 'name: formatFundName(s.name),');
code = code.replace(/fundName: s\.fundName,/g, 'fundName: formatFundName(s.fundName),');
code = code.replace(/name: scheme\.schemeName as string,/g, 'name: formatFundName(scheme.schemeName as string),');

fs.writeFileSync(path, code);
console.log("Replaced in sifData.ts");
