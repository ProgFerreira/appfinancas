const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'src', 'app');

const patterns = [
  /export const dynamic = 'force-static';\r?\nexport const dynamicParams = false;\r?\n\r?\nexport function generateStaticParams\(\) \{\r?\n  return \[\{ id: '0' \}\];\r?\n\}\r?\n\r?\n/g,
  /export const dynamic = 'force-static';\nexport const dynamicParams = false;\n\nexport function generateStaticParams\(\) \{\n  return \[\{ id: '0' \}\];\n\}\n\n/g,
];

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
    } else if (f === 'page.tsx' && full.includes('[id]') && !full.includes('layout')) {
      let content = fs.readFileSync(full, 'utf8');
      if (!content.includes('generateStaticParams')) continue;
          const orig = content;
          patterns.forEach((p) => { content = content.replace(p, ''); });
          if (content !== orig) {
            fs.writeFileSync(full, content);
            console.log('Removed', path.relative(appDir, full));
          }
    }
  }
}

walk(appDir);
console.log('Done.');
