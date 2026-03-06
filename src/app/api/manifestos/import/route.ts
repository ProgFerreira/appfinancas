import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import * as XLSX from 'xlsx';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['xls', 'xlsx', 'csv'];

function normalizeHeader(h: string): string {
  return String(h || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Lê valor da planilha e devolve número.
 * - Número (Excel): retorna direto.
 * - 100.50, 238.50, 1000.00 (ponto = decimal; equivale a 100,50 / 238,50 / 1.000,00 em BR).
 * - 100,50, 1.000,00 (vírgula decimal, ponto milhares).
 */
function parseNumber(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  let s = String(v ?? '').trim().replace(/\s/g, '');
  if (!s) return 0;
  if (/^\d+\.\d{1,2}$/.test(s)) {
    return parseFloat(s);
  }
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma > -1 && lastDot > -1) {
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (lastComma > -1) {
    const after = s.slice(lastComma + 1);
    if (after.length === 3 && /^\d{3}$/.test(after) && s.length === lastComma + 4) {
      s = s.replace(/,/g, '');
    } else {
      s = s.replace(',', '.');
    }
  } else if (lastDot > -1) {
    const after = s.slice(lastDot + 1);
    if (/^\d{1,2}$/.test(after)) {
      // ponto é decimal: 100.50, 1000.00
    } else {
      s = s.replace(/\./g, '');
    }
  }
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

/** Converte para YYYY-MM-DD (MySQL). Planilha usa DD/MM/YYYY (ex: 03/12/2025 = 3 dez). Não usar new Date() em DD/MM pois vira MM/DD. */
function parseDate(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === 'string') {
    const s = String(v).trim();
    const match = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (match) {
      const [, d, m, y] = match;
      const year = (y!.length === 2 ? `20${y}` : y)!;
      return `${year}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`;
    }
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) return s;
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  if (typeof v === 'number' && v > 0) {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  return null;
}

/** Mapeamento exato da planilha manifesto.xls (primeira linha = cabeçalho) */
const PLANILHA_HEADERS: Record<string, string> = {
  DATA: 'data',
  MANIFESTO: 'numero_manifesto',
  TIPO: 'tipo_servico',
  SERVICO: 'servico',
  'RESPONSÁVEL': 'responsavel',
  MOTORISTA: 'motorista',
  'CNPJ/CPF': 'cnpj_cpf',
  PLACA: 'placa',
  ROTA: 'rota',
  'DATA SAÍDA EFETIVA': 'data_saida_efetiva',
  'QTD VOLUME': 'quantidade_volumes',
  'QTD ENTREGA': 'quantidade_entrega',
  PESO: 'peso',
  'PESO TAXADO': 'peso_taxa',
  'TOTAL NF': 'total_nf',
  'ENTREGA REALIZADA': 'entrega_realizada',
  KM: 'km',
  'FATURAMENTO / KM': 'faturamento_km',
  'CUSTO KM': 'custo_km',
  FATURAMENTO: 'valor_frete',
  'CUSTO FRETE': 'valor_despesa',
  'CUSTO ADICIONAL': 'custo_adicional',
  'CUSTO PEDÁGIO': 'custo_pedagio',
  'CUSTO TOTAL': 'custo_total',
  RESULTADO: 'valor_liquido',
  EMISSOR: 'emissor',
  'STATUS MANIFESTO': 'status',
  'TIPO DE RODADO': 'tipo_rodado',
  UNIDADE: 'unidade',
};

function mapHeaders(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  const norm = (s: string) => normalizeHeader(s);
  headers.forEach((key) => {
    if (!key || typeof key !== 'string') return;
    const k = key.trim();
    const fromPlanilha = PLANILHA_HEADERS[k] ?? PLANILHA_HEADERS[k.toUpperCase()];
    if (fromPlanilha) {
      map[key] = fromPlanilha;
      return;
    }
    const n = norm(k);
    if (/^manifesto$/i.test(k)) map[key] = 'numero_manifesto';
    else if (/^data$/i.test(k) && !map[key]) map[key] = 'data';
    else if (/^tipo$/i.test(k)) map[key] = 'tipo_servico';
    else if (/motorista/i.test(n)) map[key] = 'motorista';
    else if (/cnpj|cpf/i.test(n)) map[key] = 'cnpj_cpf';
    else if (/^placa$/i.test(k)) map[key] = 'placa';
    else if (/^faturamento$/i.test(k) || /faturamento/i.test(n)) map[key] = 'valor_frete';
    else if (/custo\s*frete|valor_despesa/i.test(n)) map[key] = 'valor_despesa';
    else if (/resultado|valor_liquido|liquido/i.test(n)) map[key] = 'valor_liquido';
    else if (/origem/i.test(n)) map[key] = 'origem';
    else if (/destino/i.test(n)) map[key] = 'destino';
    else if (/cliente/i.test(n)) map[key] = 'cliente';
    else if (/qtd\s*volume|quantidade.*volume|volumes/i.test(n)) map[key] = 'quantidade_volumes';
    else if (/qtd\s*entrega|quantidade.*entrega/i.test(n)) map[key] = 'quantidade_entrega';
    else if (/^peso$/i.test(k)) map[key] = 'peso';
    else if (/peso.*taxa|taxado/i.test(n)) map[key] = 'peso_taxa';
    else if (/^km$/i.test(k)) map[key] = 'km';
    else if (/custo\s*adicional/i.test(n)) map[key] = 'custo_adicional';
    else if (/custo.*pedagio|pedágio/i.test(n)) map[key] = 'custo_pedagio';
    else if (/rota/i.test(n)) map[key] = 'rota';
    else if (/responsavel|responsável/i.test(n)) map[key] = 'responsavel';
    else if (/emissor/i.test(n)) map[key] = 'emissor';
    else if (/status/i.test(n)) map[key] = 'status';
    else if (/tipo.*rodado|rodado/i.test(n)) map[key] = 'tipo_rodado';
    else if (/unidade/i.test(n)) map[key] = 'unidade';
  });
  return map;
}

async function buscarOuCriarMotorista(
  nome: string,
  cnpjCpf: string | null,
  placa: string | null,
  tipo: string | null
): Promise<number | null> {
  if (!nome || !nome.trim()) return null;
  const n = nome.trim();
  const cpf = (cnpjCpf && cnpjCpf.trim()) || '';
  const p = (placa && placa.trim()) || null;
  const t = (tipo && tipo.trim()) || 'agregado';

  const byCpf = await query<{ id: number }[]>(
    'SELECT id FROM motoristas WHERE (cnpj_cpf = ? OR cpf = ?) AND ativo = 1 LIMIT 1',
    [cpf, cpf]
  );
  if (Array.isArray(byCpf) && byCpf[0]) return byCpf[0].id;

  if (p) {
    const byPlaca = await query<{ id: number }[]>('SELECT id FROM motoristas WHERE placa = ? AND ativo = 1 LIMIT 1', [p]);
    if (Array.isArray(byPlaca) && byPlaca[0]) return byPlaca[0].id;
  }

  const byNome = await query<{ id: number }[]>('SELECT id FROM motoristas WHERE nome = ? AND ativo = 1 LIMIT 1', [n]);
  if (Array.isArray(byNome) && byNome[0]) return byNome[0].id;

  await query(
    `INSERT INTO motoristas (nome, cpf, cnpj_cpf, placa, tipo, tipo_vinculo, ativo) VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [n, cpf || '0', cpf || null, p, t, t]
  );
  const inserted = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
  return Array.isArray(inserted) && inserted[0] ? inserted[0].id : null;
}


export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ success: false, error: 'Formato não suportado. Use .xls, .xlsx ou .csv' }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'Arquivo muito grande.' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: 'buffer', raw: true });
    const firstSheet = wb.SheetNames[0];
    if (!firstSheet) {
      return NextResponse.json({ success: false, error: 'Planilha vazia.' }, { status: 400 });
    }
    const sheet = wb.Sheets[firstSheet];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false });
    if (!data.length) {
      return NextResponse.json({ success: false, error: 'Nenhuma linha de dados na planilha.' }, { status: 400 });
    }

    const headers = Object.keys(data[0] || {});
    const columnMap = mapHeaders(headers);

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, unknown>;
      try {
        const numeroKey = Object.keys(columnMap).find((k) => columnMap[k] === 'numero_manifesto');
        let numero = numeroKey ? String(row[numeroKey!] ?? '').trim() : '';
        if (!numero) {
          for (const [k, v] of Object.entries(row)) {
            if (normalizeHeader(k).includes('manifesto') && v && String(v).trim() && String(v).toUpperCase() !== 'MANIFESTO') {
              numero = String(v).trim();
              break;
            }
          }
        }
        if (!numero || numero.toUpperCase() === 'MANIFESTO') continue;

        const dataKey = Object.keys(columnMap).find((k) => columnMap[k] === 'data');
        const dataVal = dataKey ? row[dataKey] : null;
        const dataManifesto = parseDate(dataVal);

        const motoristaKey = Object.keys(columnMap).find((k) => columnMap[k] === 'motorista');
        const cnpjKey = Object.keys(columnMap).find((k) => columnMap[k] === 'cnpj_cpf');
        const placaKey = Object.keys(columnMap).find((k) => columnMap[k] === 'placa');
        const tipoKey = Object.keys(columnMap).find((k) => columnMap[k] === 'tipo_servico');
        const nomeMotorista = motoristaKey ? String(row[motoristaKey] ?? '').trim() : '';
        const cnpjCpf = cnpjKey ? String(row[cnpjKey] ?? '').trim() || null : null;
        const placaVal = placaKey ? String(row[placaKey] ?? '').trim() || null : null;
        const tipoVal = tipoKey ? String(row[tipoKey] ?? '').trim() || null : null;

        let motoristaId: number | null = null;
        if (nomeMotorista) {
          motoristaId = await buscarOuCriarMotorista(nomeMotorista, cnpjCpf, placaVal, tipoVal);
          // Atualiza placa do motorista quando a planilha traz placa e o cadastro está vazio (para exibir em Estatísticas por motorista)
          if (motoristaId && placaVal) {
            try {
              await query('UPDATE motoristas SET placa = ? WHERE id = ? AND (placa IS NULL OR placa = "")', [placaVal, motoristaId]);
            } catch {
              // ignora se coluna placa não existir
            }
          }
        }

        const vfKey = Object.keys(columnMap).find((k) => columnMap[k] === 'valor_frete');
        const vdKey = Object.keys(columnMap).find((k) => columnMap[k] === 'valor_despesa');
        const vlKey = Object.keys(columnMap).find((k) => columnMap[k] === 'valor_liquido');
        const valorFrete = parseNumber(vfKey ? row[vfKey] : 0);
        const valorDespesa = parseNumber(vdKey ? row[vdKey] : 0);
        let valorLiquidoRaw = vlKey ? row[vlKey] : 0;
        if (typeof valorLiquidoRaw === 'string') valorLiquidoRaw = valorLiquidoRaw.replace(/\s*\([^)]*\)\s*$/g, '').trim();
        let valorLiquido = parseNumber(valorLiquidoRaw);
        if (valorLiquido === 0 && (valorFrete > 0 || valorDespesa > 0)) {
          valorLiquido = valorFrete - valorDespesa;
        }

        const caKey = Object.keys(columnMap).find((k) => columnMap[k] === 'custo_adicional');
        const cpKey = Object.keys(columnMap).find((k) => columnMap[k] === 'custo_pedagio');
        const custoAdicional = caKey != null ? parseNumber(row[caKey]) : 0;
        const custoPedagio = cpKey != null ? parseNumber(row[cpKey]) : 0;

        const origemKey = Object.keys(columnMap).find((k) => columnMap[k] === 'origem');
        const destinoKey = Object.keys(columnMap).find((k) => columnMap[k] === 'destino');
        const clienteKey = Object.keys(columnMap).find((k) => columnMap[k] === 'cliente');
        const origem = origemKey ? String(row[origemKey] ?? '').trim() || null : null;
        const destino = destinoKey ? String(row[destinoKey] ?? '').trim() || null : null;
        const cliente = clienteKey ? String(row[clienteKey] ?? '').trim() || null : null;

        const qvKey = Object.keys(columnMap).find((k) => columnMap[k] === 'quantidade_volumes');
        const qeKey = Object.keys(columnMap).find((k) => columnMap[k] === 'quantidade_entrega');
        const pesoKey = Object.keys(columnMap).find((k) => columnMap[k] === 'peso');
        const ptKey = Object.keys(columnMap).find((k) => columnMap[k] === 'peso_taxa');
        const kmKey = Object.keys(columnMap).find((k) => columnMap[k] === 'km');
        let tipoServicoVal = tipoKey ? String(row[tipoKey] ?? '').trim() || null : null;
        const servicoKey = Object.keys(columnMap).find((k) => columnMap[k] === 'servico');
        const servicoVal = servicoKey ? String(row[servicoKey] ?? '').trim() || null : null;
        if (servicoVal && tipoServicoVal) tipoServicoVal = `${tipoServicoVal} - ${servicoVal}`.trim();
        else if (servicoVal) tipoServicoVal = servicoVal;

        const quantidadeVolumes = Math.floor(parseNumber(qvKey ? row[qvKey] : 0));
        const quantidadeEntrega = Math.floor(parseNumber(qeKey ? row[qeKey] : 0));
        const entregaRealizadaKey = Object.keys(columnMap).find((k) => columnMap[k] === 'entrega_realizada');
        const entregaRealizada = entregaRealizadaKey != null ? Math.floor(parseNumber(row[entregaRealizadaKey])) : null;
        const peso = parseNumber(pesoKey ? row[pesoKey] : 0);
        const pesoTaxa = parseNumber(ptKey ? row[ptKey] : 0);
        const km = parseNumber(kmKey ? row[kmKey] : 0);

        const rotaKey = Object.keys(columnMap).find((k) => columnMap[k] === 'rota');
        const dataSaidaKey = Object.keys(columnMap).find((k) => columnMap[k] === 'data_saida_efetiva');
        const responsavelKey = Object.keys(columnMap).find((k) => columnMap[k] === 'responsavel');
        const emissorKey = Object.keys(columnMap).find((k) => columnMap[k] === 'emissor');
        const statusKey = Object.keys(columnMap).find((k) => columnMap[k] === 'status');
        const tipoRodadoKey = Object.keys(columnMap).find((k) => columnMap[k] === 'tipo_rodado');
        const unidadeKey = Object.keys(columnMap).find((k) => columnMap[k] === 'unidade');
        const totalNfKey = Object.keys(columnMap).find((k) => columnMap[k] === 'total_nf');
        const rotaVal = rotaKey ? String(row[rotaKey] ?? '').trim() || null : null;
        const dataSaidaVal = dataSaidaKey ? parseDate(row[dataSaidaKey]) : null;
        const responsavelVal = responsavelKey ? String(row[responsavelKey] ?? '').trim() || null : null;
        const emissorVal = emissorKey ? String(row[emissorKey] ?? '').trim() || null : null;
        const statusVal = statusKey ? String(row[statusKey] ?? '').trim() || 'importado' : 'importado';
        const tipoRodadoVal = tipoRodadoKey ? String(row[tipoRodadoKey] ?? '').trim() || null : null;
        const unidadeVal = unidadeKey ? String(row[unidadeKey] ?? '').trim() || null : null;
        const totalNf = totalNfKey != null ? parseNumber(row[totalNfKey]) : null;
        const custoTotalKey = Object.keys(columnMap).find((k) => columnMap[k] === 'custo_total');
        const custoTotalVal = custoTotalKey != null ? parseNumber(row[custoTotalKey]) : null;

        const existente = await query<{ id: number }[]>(
          'SELECT id FROM manifestos WHERE numero_manifesto = ? LIMIT 1',
          [numero]
        );
        const exists = Array.isArray(existente) && existente[0];

        const custoTotalValToSave = custoTotalVal ?? (valorDespesa + custoAdicional + custoPedagio);

        const updateWithCustoTotal = () =>
          query(
            `UPDATE manifestos SET motorista_id = ?, data_manifesto = ?, data_saida_efetiva = ?, origem = ?, destino = ?, cliente = ?,
             valor_frete = ?, valor_despesa = ?, valor_liquido = ?, custo_adicional = ?, custo_pedagio = ?, custo_total = ?,
             quantidade_volumes = ?, quantidade_entrega = ?, entrega_realizada = ?, peso = ?, peso_taxa = ?, km = ?, tipo_servico = ?, rota = ?, responsavel = ?, status = ?, emissor = ?, tipo_rodado = ?, unidade = ?, total_nf = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
              motoristaId, dataManifesto, dataSaidaVal, origem, destino, cliente,
              valorFrete, valorDespesa, valorLiquido, custoAdicional, custoPedagio, custoTotalValToSave,
              quantidadeVolumes, quantidadeEntrega, entregaRealizada, peso, pesoTaxa, km,
              tipoServicoVal, rotaVal, responsavelVal, statusVal, emissorVal, tipoRodadoVal, unidadeVal, totalNf,
              existente[0].id,
            ]
          );
        const updateWithoutCustoTotal = () =>
          query(
            `UPDATE manifestos SET motorista_id = ?, data_manifesto = ?, data_saida_efetiva = ?, origem = ?, destino = ?, cliente = ?,
             valor_frete = ?, valor_despesa = ?, valor_liquido = ?, custo_adicional = ?, custo_pedagio = ?,
             quantidade_volumes = ?, quantidade_entrega = ?, entrega_realizada = ?, peso = ?, peso_taxa = ?, km = ?, tipo_servico = ?, rota = ?, responsavel = ?, status = ?, emissor = ?, tipo_rodado = ?, unidade = ?, total_nf = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [
              motoristaId, dataManifesto, dataSaidaVal, origem, destino, cliente,
              valorFrete, valorDespesa, valorLiquido, custoAdicional, custoPedagio,
              quantidadeVolumes, quantidadeEntrega, entregaRealizada, peso, pesoTaxa, km,
              tipoServicoVal, rotaVal, responsavelVal, statusVal, emissorVal, tipoRodadoVal, unidadeVal, totalNf,
              existente[0].id,
            ]
          );
        const insertWithCustoTotal = () =>
          query(
            `INSERT INTO manifestos (numero_manifesto, motorista_id, data_manifesto, data_saida_efetiva, origem, destino, cliente,
             valor_frete, valor_despesa, valor_liquido, custo_adicional, custo_pedagio, custo_total, quantidade_volumes, quantidade_entrega, entrega_realizada, peso, peso_taxa, km,
             tipo_servico, rota, responsavel, status, emissor, tipo_rodado, unidade, total_nf, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              numero, motoristaId, dataManifesto, dataSaidaVal, origem, destino, cliente,
              valorFrete, valorDespesa, valorLiquido, custoAdicional, custoPedagio, custoTotalValToSave,
              quantidadeVolumes, quantidadeEntrega, entregaRealizada, peso, pesoTaxa, km,
              tipoServicoVal, rotaVal, responsavelVal, statusVal, emissorVal, tipoRodadoVal, unidadeVal, totalNf, userId,
            ]
          );
        const insertWithoutCustoTotal = () =>
          query(
            `INSERT INTO manifestos (numero_manifesto, motorista_id, data_manifesto, data_saida_efetiva, origem, destino, cliente,
             valor_frete, valor_despesa, valor_liquido, custo_adicional, custo_pedagio, quantidade_volumes, quantidade_entrega, entrega_realizada, peso, peso_taxa, km,
             tipo_servico, rota, responsavel, status, emissor, tipo_rodado, unidade, total_nf, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              numero, motoristaId, dataManifesto, dataSaidaVal, origem, destino, cliente,
              valorFrete, valorDespesa, valorLiquido, custoAdicional, custoPedagio,
              quantidadeVolumes, quantidadeEntrega, entregaRealizada, peso, pesoTaxa, km,
              tipoServicoVal, rotaVal, responsavelVal, statusVal, emissorVal, tipoRodadoVal, unidadeVal, totalNf, userId,
            ]
          );

        if (exists) {
          try {
            await updateWithCustoTotal();
          } catch {
            await updateWithoutCustoTotal();
          }
          updated++;
        } else {
          try {
            await insertWithCustoTotal();
          } catch {
            await insertWithoutCustoTotal();
          }
          inserted++;
        }
      } catch (err) {
        console.error('Import row error:', err);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      data: { inserted, updated, errors },
    });
  } catch (e) {
    console.error('API manifestos/import POST:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: 'Erro ao importar. Verifique o formato do arquivo.', detail: process.env.NODE_ENV === 'development' ? message : undefined },
      { status: 500 }
    );
  }
}
