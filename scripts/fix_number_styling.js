const fs = require('fs');

const files = [
  'src/app/privacy/page.tsx',
  'src/app/disclaimer/page.tsx',
  'src/app/terms/page.tsx'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace text-[11px] font-mono text-faint with text-[12px] font-mono text-[#098B91]
  code = code.replace(/className="text-\[11px\] font-mono text-faint mt-1/g, 'className="text-[12px] font-mono text-[#098B91] mt-1');
  
  fs.writeFileSync(file, code);
  console.log(`Updated numbers in ${file}`);
}
