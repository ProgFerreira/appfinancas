import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo') ?? '1';
    const cteId = searchParams.get('cte_id');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10)));
    const offset = (page - 1) * perPage;
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    if (ativo === '1') where += ' AND dv.ativo = 1';
    else if (ativo === '0') where += ' AND dv.ativo = 0';
    if (cteId) {
      const cteNum = parseInt(cteId, 10);
      if (Number.isInteger(cteNum)) {
        where += ' AND dv.cte_id = ?';
        params.push(cteNum);
      }
    }
    const countRows = await query<{ total: number }[]>(`SELECT COUNT(*) AS total FROM despesas_viagem dv ${where}`, params);
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;
    const limit = Math.min(50, Math.max(1, perPage)) | 0;
    const list = await query<
      { id: number; cte_id: number; categoria_id: number; valor: number; data_despesa: string; ativo: number; categoria_nome: string; cte_numero: string }[]
    >(
      `SELECT dv.id, dv.cte_id, dv.categoria_id, dv.valor, dv.data_despesa, dv.ativo, cd.nome AS categoria_nome, c.numero AS cte_numero
       FROM despesas_viagem dv
       INNER JOIN categorias_despesa cd ON cd.id = dv.categoria_id
       INNER JOIN ctes c ON c.id = dv.cte_id
       ${where} ORDER BY dv.data_despesa DESC LIMIT ${limit} OFFSET ${Math.max(0, offset)}`,
      params
    );
    return NextResponse.json({
      success: true,
      data: Array.isArray(list) ? list : [],
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API despesas-viagem GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar despesas de viagem.' }, { status: 500 });
  }
}

function validar(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const cteId = parseInt(String(b.cte_id ?? 0), 10);
  const categoriaId = parseInt(String(b.categoria_id ?? 0), 10);
  if (!Number.isInteger(cteId) || cteId < 1 || !Number.isInteger(categoriaId) || categoriaId < 1) return null;
  const valor = Number(b.valor);
  if (Number.isNaN(valor) || valor < 0) return null;
  const dataDespesa = typeof b.data_despesa === 'string' ? b.data_despesa.trim() : '';
  if (!dataDespesa) return null;
  return {
    cte_id: cteId,
    categoria_id: categoriaId,
    plano_contas_id: b.plano_contas_id != null && b.plano_contas_id !== '' ? parseInt(String(b.plano_contas_id), 10) : null,
    centro_custo_id: b.centro_custo_id != null && b.centro_custo_id !== '' ? parseInt(String(b.centro_custo_id), 10) : null,
    fornecedor_id: b.fornecedor_id != null && b.fornecedor_id !== '' ? parseInt(String(b.fornecedor_id), 10) : null,
    descricao: typeof b.descricao === 'string' ? b.descricao.trim() || null : null,
    valor,
    data_despesa: dataDespesa,
    conta_pagar_id: b.conta_pagar_id != null && b.conta_pagar_id !== '' ? parseInt(String(b.conta_pagar_id), 10) : null,
    ativo: b.ativo === false || b.ativo === 0 ? 0 : 1,
  };
}


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const body = await request.json();
    const data = validar(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'CTe, categoria, valor e data são obrigatórios.' }, { status: 400 });
    }
    await query(
      `INSERT INTO despesas_viagem (cte_id, categoria_id, plano_contas_id, centro_custo_id, fornecedor_id, descricao, valor, data_despesa, conta_pagar_id, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.cte_id as number,
        data.categoria_id as number,
        data.plano_contas_id as number | null,
        data.centro_custo_id as number | null,
        data.fornecedor_id as number | null,
        data.descricao as string | null,
        data.valor as number,
        data.data_despesa as string,
        data.conta_pagar_id as number | null,
        data.ativo as number,
      ]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const id = Array.isArray(result) && result[0] != null ? result[0].id : 0;
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    console.error('API despesas-viagem POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao cadastrar despesa de viagem.' }, { status: 500 });
  }
}
