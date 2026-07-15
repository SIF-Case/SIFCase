const fs = require('fs');

const files = [
  'src/app/privacy/page.tsx',
  'src/app/disclaimer/page.tsx',
  'src/app/terms/page.tsx'
];

for (const file of files) {
  let code = fs.readFileSync(file, 'utf8');
  
  // Remove the white background and border from the Hero section
  code = code.replace(/className="bg-white border-b border-rule pt-10 pb-10"/g, 'className="pt-12 pb-6"');
  code = code.replace(/className="bg-white border-b border-rule pt-12 pb-12"/g, 'className="pt-12 pb-6"');
  
  // Also reduce the top padding of the content section so the gap isn't huge
  code = code.replace(/\{(\/\* Content \*\/)\}\n\s*<section className="py-12">/g, '{$1}\n      <section className="pb-16 pt-6">');
  
  fs.writeFileSync(file, code);
  console.log(`Updated ${file}`);
}
