const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');
const gsp = "export function generateStaticParams() {\n  return [];\n}\n\n";

function walk(dir, pathSoFar) {
  pathSoFar = pathSoFar || '';
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const rel = pathSoFar ? pathSoFar + '/' + f : f;
    if (fs.statSync(full).isDirectory()) {
      walk(full, rel);
    } else if (f === 'route.ts') {
      const hasDynamicSegment = rel.includes('[');
      if (!hasDynamicSegment) continue;
      let content = fs.readFileSync(full, 'utf8');
      if (content.includes('generateStaticParams')) continue;
      if (content.includes("dynamic = 'force-static'")) {
        content = content.replace(
          /(export const dynamic = 'force-static';)\n\n/,
          '$1\n\n' + gsp
        );
        fs.writeFileSync(full, content);
        console.log('Added generateStaticParams to', rel);
      }
    }
  }
}

walk(apiDir);
console.log('Done.');
