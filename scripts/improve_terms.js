const fs = require('fs');
let code = fs.readFileSync('src/app/terms/page.tsx', 'utf8');

// Increase width to 1000px for better reading experience on desktop
code = code.replace(/max-w-\[760px\]/g, 'max-w-[1000px]');

// Add text-balance to headings and text-pretty to paragraphs
code = code.replace(/text-heading mb-3/g, 'text-heading mb-3 text-balance');
code = code.replace(/text-heading">/g, 'text-heading text-balance">');
code = code.replace(/text-heading mb-2">/g, 'text-heading mb-2 text-balance">');
code = code.replace(/text-heading mb-1">/g, 'text-heading mb-1 text-balance">');

// Add text-pretty to body texts
code = code.replace(/text-body leading-relaxed max-w-\[600px\]/g, 'text-body leading-relaxed max-w-[700px] text-pretty');
code = code.replace(/text-body leading-\[1.7\]/g, 'text-body leading-[1.7] text-pretty');

// Make lists slightly larger and more readable
code = code.replace(/text-\[13.5px\]/g, 'text-[14px]');
code = code.replace(/text-\[15px\]/g, 'text-[16px]');

// Add aria-hidden="true" to decorative Shield icons
code = code.replace(/<Shield className="w-4.5 h-4.5 text-primary" strokeWidth=\{1.75\} \/>/g, '<Shield className="w-4.5 h-4.5 text-primary" strokeWidth={1.75} aria-hidden="true" />');
code = code.replace(/<Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" strokeWidth=\{1.75\} \/>/g, '<Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" />');

fs.writeFileSync('src/app/terms/page.tsx', code);
console.log('Updated terms layout');
