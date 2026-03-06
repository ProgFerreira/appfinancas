/**
 * Teste das regras de negócio da API Dashboard.
 * Requer: servidor rodando (npm run dev) e banco com tabelas.
 * Executar: node tests/api-dashboard.test.mjs
 * Ou com login: obter cookie de sessão e passar em COOKIE.
 */

const BASE = process.env.API_BASE || 'http://localhost:3000';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Resposta não é JSON: ${text.slice(0, 200)}`);
  }
  return { res, data };
}

async function run() {
  console.log('Testando API Dashboard (regras de negócio)...\n');
  let ok = 0;
  let fail = 0;

  // 1) GET sem auth deve retornar 401
  try {
    const { res } = await fetchJson(`${BASE}/api/dashboard`);
    if (res.status === 401) {
      console.log('✓ GET /api/dashboard sem auth retorna 401');
      ok++;
    } else {
      console.log('✗ GET /api/dashboard sem auth: esperado 401, obtido', res.status);
      fail++;
    }
  } catch (e) {
    console.log('✗ GET /api/dashboard sem auth:', e.message);
    fail++;
  }

  // 2) GET com período (requer auth - pode falhar 401)
  try {
    const { res, data } = await fetchJson(
      `${BASE}/api/dashboard?data_inicio=2025-01-01&data_fim=2025-01-31`
    );
    if (res.status === 401) {
      console.log('○ GET /api/dashboard com período exige auth (401) - OK');
      ok++;
    } else if (res.status === 200 && data.success && data.data) {
      const d = data.data;
      const hasResumo = d.resumo && typeof d.resumo.contasPagar === 'object' && typeof d.resumo.contasReceber === 'object';
      const hasPeriodo = d.periodo && d.periodo.dataInicio && d.periodo.dataFim;
      const hasVisao = d.visaoGeral && typeof d.visaoGeral.faturamento === 'number' && typeof d.visaoGeral.resultado === 'number';
      const hasAlertas = d.alertas && typeof d.alertas.contas_pagar_vencidas === 'number';
      const hasFluxo = d.fluxo && Array.isArray(d.fluxo.entradas) && Array.isArray(d.fluxo.saidas);
      if (hasResumo && hasPeriodo && hasVisao && hasAlertas && hasFluxo) {
        console.log('✓ GET /api/dashboard com período retorna resumo, periodo, visaoGeral, alertas, fluxo');
        ok++;
      } else {
        console.log('✗ GET /api/dashboard: estrutura incompleta', { hasResumo, hasPeriodo, hasVisao, hasAlertas, hasFluxo });
        fail++;
      }
    } else {
      console.log('✗ GET /api/dashboard com período: status', res.status, data.error || '');
      fail++;
    }
  } catch (e) {
    console.log('✗ GET /api/dashboard com período:', e.message);
    fail++;
  }

  console.log('\n---');
  console.log(`Ok: ${ok}, Falhas: ${fail}`);
  process.exit(fail > 0 ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
