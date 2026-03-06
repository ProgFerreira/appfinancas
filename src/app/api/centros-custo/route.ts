import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo') ?? '1';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10)));
    const offset = (page - 1) * perPage;

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    if (ativo === '1') {
      where += ' AND cc.ativo = 1';
    } else if (ativo === '0') {
      where += ' AND cc.ativo = 0';
    }

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM centros_custo cc ${where}`,
      params
    );
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;

    const limit = Math.min(50, Math.max(1, perPage)) | 0;
    const offsetSafe = Math.max(0, offset) | 0;
    const list = await query<
      { id: number; codigo: string | null; nome: string; natureza_id: number | null; natureza: string; natureza_nome: string | null; ativo: number }[]
    >(
      `SELECT cc.id, cc.codigo, cc.nome, cc.natureza_id, cc.natureza,
              n.nome AS natureza_nome
       FROM centros_custo cc
       LEFT JOIN naturezas n ON n.id = cc.natureza_id
       ${where} ORDER BY cc.ordem ASC, cc.nome LIMIT ${limit} OFFSET ${offsetSafe}`,
      params
    );
    const items = Array.isArray(list) ? list : [];

    return NextResponse.json({
      success: true,
      data: items,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API centros-custo GET:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao carregar centros de custo.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}

function validar(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const nome = typeof b.nome === 'string' ? b.nome.trim() : '';
  if (!nome) return null;
  const natureza = typeof b.natureza === 'string' && ['ambos', 'receita', 'despesa'].includes(b.natureza) ? b.natureza : 'ambos';
  const naturezaId = b.natureza_id != null && b.natureza_id !== '' ? parseInt(String(b.natureza_id), 10) : null;
  const ordem = typeof b.ordem === 'number' ? b.ordem : parseInt(String(b.ordem ?? 0), 10) || 0;
  return {
    codigo: typeof b.codigo === 'string' ? b.codigo.trim() || null : null,
    nome,
    natureza_id: Number.isInteger(naturezaId) && naturezaId! > 0 ? naturezaId : null,
    natureza,
    plano_contas: typeof b.plano_contas === 'string' ? b.plano_contas.trim() || null : null,
    descricao: typeof b.descricao === 'string' ? b.descricao.trim() || null : null,
    ordem: Number.isInteger(ordem) ? ordem : 0,
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
      return NextResponse.json(
        { success: false, error: 'Dados inválidos. Nome é obrigatório.' },
        { status: 400 }
      );
    }
    await query(
      `INSERT INTO centros_custo (codigo, nome, natureza_id, natureza, plano_contas, descricao, ordem, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.codigo as string | null,
        data.nome as string,
        data.natureza_id as number | null,
        data.natureza as string,
        data.plano_contas as string | null,
        data.descricao as string | null,
        data.ordem as number,
        data.ativo as number,
      ]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const id = Array.isArray(result) && result[0] != null ? result[0].id : null;
    return NextResponse.json({ success: true, data: { id: id ?? 0 } });
  } catch (e) {
    console.error('API centros-custo POST:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao cadastrar centro de custo.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
