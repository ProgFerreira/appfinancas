const fs = require('fs');
const path = require('path');

const appDir = path.join(__dirname, '..', 'src', 'app');

function getParamsForPath(relPath) {
  const params = {};
  if (relPath.includes('[id]')) params.id = '0';
  if (relPath.includes('[contatoId]')) params.contatoId = '0';
  if (relPath.includes('[dbId]')) params.dbId = '0';
  if (relPath.includes('[destId]')) params.destId = '0';
  if (relPath.includes('[remId]')) params.remId = '0';
  if (relPath.includes('[veiculoId]')) params.veiculoId = '0';
  if (relPath.includes('[rangeId]')) params.rangeId = '0';
  if (Object.keys(params).length === 0 && /\[[\w]+\]/.test(relPath)) params.id = '0';
  return params;
}

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
      if (content.includes('generateStaticParams')) continue;
      const params = getParamsForPath(rel);
      const paramsEntry = '{ ' + Object.entries(params).map(([k, v]) => `${k}: '${v}'`).join(', ') + ' }';
      const exportBlock = `export const dynamic = 'force-static';\nexport const dynamicParams = false;\n\nexport function generateStaticParams() {\n  return [${paramsEntry}];\n}\n\n`;
      content = content.replace(/\n(export default )/m, '\n' + exportBlock + '$1');
      fs.writeFileSync(full, content);
      console.log('Fixed', rel);
    }
  }
}

walk(appDir);
console.log('Done.');
