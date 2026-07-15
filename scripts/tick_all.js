const fs = require('fs');
const path = require('path');
const p = process.argv[2];
let text = fs.readFileSync(p, 'utf8');
text = text.replace(/- \[ \] /g, '- [x] ');
text = text.replace(/- \[\/\] /g, '- [x] ');
fs.writeFileSync(p, text);
