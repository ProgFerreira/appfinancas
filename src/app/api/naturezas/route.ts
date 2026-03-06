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
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10)));
    const offset = (page - 1) * perPage;
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    if (ativo === '1') where += ' AND ativo = 1';
    else if (ativo === '0') where += ' AND ativo = 0';
    const countRows = await query<{ total: number }[]>(`SELECT COUNT(*) AS total FROM naturezas ${where}`, params);
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;
    const limit = Math.min(50, Math.max(1, perPage)) | 0;
    const list = await query<
      { id: number; codigo: string | null; nome: string; natureza_pai_id: number | null; tipo: string; ordem: number; ativo: number }[]
    >(
      `SELECT id, codigo, nome, natureza_pai_id, tipo, ordem, ativo FROM naturezas ${where} ORDER BY ordem ASC, nome LIMIT ${limit} OFFSET ${Math.max(0, offset)}`,
      params
    );
    return NextResponse.json({
      success: true,
      data: Array.isArray(list) ? list : [],
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API naturezas GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar naturezas.' }, { status: 500 });
  }
}

function validar(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const nome = typeof b.nome === 'string' ? b.nome.trim() : '';
  if (!nome) return null;
  const tipo = typeof b.tipo === 'string' && ['ambos', 'receita', 'despesa'].includes(b.tipo) ? b.tipo : 'ambos';
  const naturezaPaiId = b.natureza_pai_id != null && b.natureza_pai_id !== '' ? parseInt(String(b.natureza_pai_id), 10) : null;
  const ordem = parseInt(String(b.ordem ?? 0), 10) || 0;
  const nivel = parseInt(String(b.nivel ?? 1), 10) || 1;
  return {
    codigo: typeof b.codigo === 'string' ? b.codigo.trim() || null : null,
    nome,
    natureza_pai_id: Number.isInteger(naturezaPaiId) && naturezaPaiId! > 0 ? naturezaPaiId : null,
    tipo,
    descricao: typeof b.descricao === 'string' ? b.descricao.trim() || null : null,
    nivel: Number.isInteger(nivel) ? nivel : 1,
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
      return NextResponse.json({ success: false, error: 'Nome é obrigatório.' }, { status: 400 });
    }
    await query(
      `INSERT INTO naturezas (codigo, nome, natureza_pai_id, tipo, descricao, nivel, ordem, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.codigo as string | null,
        data.nome as string,
        data.natureza_pai_id as number | null,
        data.tipo as string,
        data.descricao as string | null,
        data.nivel as number,
        data.ordem as number,
        data.ativo as number,
      ]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const id = Array.isArray(result) && result[0] != null ? result[0].id : 0;
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    console.error('API naturezas POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao cadastrar natureza.' }, { status: 500 });
  }
}
