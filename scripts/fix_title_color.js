const fs = require('fs');

const files = [
  'src/app/privacy/page.tsx',
  'src/app/disclaimer/page.tsx',
  'src/app/terms/page.tsx'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Replace text-heading with text-[#098B91] for the h2 tags
  code = code.replace(/<h2 className="text-\[16px\] font-semibold text-heading text-balance">/g, '<h2 className="text-[16px] font-semibold text-[#098B91] text-balance">');
  
  fs.writeFileSync(file, code);
  console.log(`Updated titles in ${file}`);
}
