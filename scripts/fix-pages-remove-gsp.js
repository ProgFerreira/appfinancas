const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'src', 'app');

const blockToRemove = /export const dynamic = 'force-static';\nexport const dynamicParams = false;\n\nexport function generateStaticParams\(\) \{\n  return \[\{ id: '0' \}\];\n}\n\n/g;

function walk(dir, pathSoFar) {
  pathSoFar = pathSoFar || '';
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const rel = pathSoFar ? pathSoFar + '/' + f : f;
    if (fs.statSync(full).isDirectory()) {
      walk(full, rel);
    } else if (f === 'page.tsx' || f === 'page.js') {
      const hasDynamic = /\[[\w]+\]/.test(rel);
      if (!hasDynamic) continue;
      let content = fs.readFileSync(full, 'utf8');
      if (!content.includes('generateStaticParams')) continue;
      content = content.replace(blockToRemove, '');
      content = content.replace(/export const dynamic = 'force-static';\nexport const dynamicParams = false;\n\nexport function generateStaticParams\(\) \{\n  return \[\{ id: '0' \}\];\n}\n\n/g, '');
      const regex = /export const dynamic = 'force-static';\s*\nexport const dynamicParams = false;\s*\n\nexport function generateStaticParams\(\) \{\s*\n\s*return \[\{ id: '0' \}\];\s*\n\}\s*\n\n/g;
      content = content.replace(regex, '');
      if (content !== fs.readFileSync(full, 'utf8')) {
        fs.writeFileSync(full, content);
        console.log('Removed from', rel);
      }
    }
  }
}

walk(appDir);
console.log('Done.');
