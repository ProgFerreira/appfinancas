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
      where += ' AND cd.ativo = 1';
    } else if (ativo === '0') {
      where += ' AND cd.ativo = 0';
    }

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM categorias_despesa cd ${where}`,
      params
    );
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;

    const limit = Math.min(50, Math.max(1, perPage)) | 0;
    const offsetSafe = Math.max(0, offset) | 0;
    const list = await query<
      { id: number; plano_contas_id: number; nome: string; tipo: string; descricao: string | null; ativo: number; plano_nome: string }[]
    >(
      `SELECT cd.id, cd.plano_contas_id, cd.nome, cd.tipo, cd.descricao, cd.ativo,
              CONCAT(pc.codigo, ' - ', pc.nome) AS plano_nome
       FROM categorias_despesa cd
       INNER JOIN plano_contas pc ON pc.id = cd.plano_contas_id
       ${where} ORDER BY cd.nome LIMIT ${limit} OFFSET ${offsetSafe}`,
      params
    );
    const items = Array.isArray(list) ? list : [];

    return NextResponse.json({
      success: true,
      data: items,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API categorias-despesa GET:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao carregar categorias de despesa.',
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
  const planoContasId = typeof b.plano_contas_id === 'number' ? b.plano_contas_id : parseInt(String(b.plano_contas_id), 10);
  if (!Number.isInteger(planoContasId) || planoContasId < 1) return null;
  const tipo = typeof b.tipo === 'string' ? b.tipo.trim() || 'variavel' : 'variavel';
  return {
    plano_contas_id: planoContasId,
    nome,
    tipo: ['variavel', 'fixo', 'outros'].includes(tipo) ? tipo : 'variavel',
    descricao: typeof b.descricao === 'string' ? b.descricao.trim() || null : null,
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
        { success: false, error: 'Dados inválidos. Nome e plano de contas são obrigatórios.' },
        { status: 400 }
      );
    }
    await query(
      `INSERT INTO categorias_despesa (plano_contas_id, nome, tipo, descricao, ativo)
       VALUES (?, ?, ?, ?, ?)`,
      [
        data.plano_contas_id as number,
        data.nome as string,
        data.tipo as string,
        data.descricao as string | null,
        data.ativo as number,
      ]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const id = Array.isArray(result) && result[0] != null ? result[0].id : null;
    return NextResponse.json({ success: true, data: { id: id ?? 0 } });
  } catch (e) {
    console.error('API categorias-despesa POST:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao cadastrar categoria de despesa.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
