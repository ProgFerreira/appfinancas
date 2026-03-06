const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, '..', 'src', 'app', 'api');

const SEGMENT_KEYS = {
  id: 'id',
  rangeId: 'rangeId',
  dbId: 'dbId',
  destId: 'destId',
  remId: 'remId',
  veiculoId: 'veiculoId',
  contatoId: 'contatoId',
};

function getParamKey(relPath) {
  if (relPath.includes('[id]')) return 'id';
  if (relPath.includes('[rangeId]')) return 'rangeId';
  if (relPath.includes('[dbId]')) return 'dbId';
  if (relPath.includes('[destId]')) return 'destId';
  if (relPath.includes('[remId]')) return 'remId';
  if (relPath.includes('[veiculoId]')) return 'veiculoId';
  if (relPath.includes('[contatoId]')) return 'contatoId';
  return 'id';
}

function walk(dir, pathSoFar) {
  pathSoFar = pathSoFar || '';
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const rel = pathSoFar ? pathSoFar + '/' + f : f;
    if (fs.statSync(full).isDirectory()) {
      walk(full, rel);
    } else if (f === 'route.ts') {
      const hasDynamic = /\[[\w]+\]/.test(rel);
      if (!hasDynamic) continue;
      let content = fs.readFileSync(full, 'utf8');
      if (!content.includes('generateStaticParams')) continue;
      if (!content.includes('return [];')) continue;
      const key = getParamKey(rel);
      const replacement = `return [{ ${key}: '0' }];`;
      content = content.replace('return [];', replacement);
      if (!content.includes('dynamicParams = false')) {
        content = content.replace("export const dynamic = 'force-static';", "export const dynamic = 'force-static';\nexport const dynamicParams = false;");
      }
      fs.writeFileSync(full, content);
      console.log('Fixed', rel);
    }
  }
}

walk(apiDir);
console.log('Done.');
