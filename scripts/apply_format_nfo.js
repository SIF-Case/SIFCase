const fs = require('fs');

const path = 'src/lib/nfoQueries.ts';
let code = fs.readFileSync(path, 'utf-8');

// Add import
if (!code.includes('import { formatFundName }')) {
  code = code.replace('import { getCollections } from "./mongodb";', 'import { getCollections } from "./mongodb";\nimport { formatFundName } from "@/lib/utils";');
}

// Replace occurrences
code = code.replace(/name: doc\.name,/g, 'name: formatFundName(doc.name),');

fs.writeFileSync(path, code);
console.log("Replaced in nfoQueries.ts");
