import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

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


export const dynamic = 'force-dynamic';
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: '0' }];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const rows = await query<
      { id: number; codigo: string | null; nome: string; natureza_pai_id: number | null; tipo: string; descricao: string | null; nivel: number; ordem: number; ativo: number }[]
    >(
      'SELECT id, codigo, nome, natureza_pai_id, tipo, descricao, nivel, ordem, ativo FROM naturezas WHERE id = ? LIMIT 1',
      [idNum]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Natureza não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    console.error('API naturezas [id] GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const data = validar(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Dados inválidos.' }, { status: 400 });
    }
    await query(
      `UPDATE naturezas SET codigo = ?, nome = ?, natureza_pai_id = ?, tipo = ?, descricao = ?, nivel = ?, ordem = ?, ativo = ? WHERE id = ?`,
      [
        data.codigo as string | null,
        data.nome as string,
        data.natureza_pai_id as number | null,
        data.tipo as string,
        data.descricao as string | null,
        data.nivel as number,
        data.ordem as number,
        data.ativo as number,
        idNum,
      ]
    );
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API naturezas [id] PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar.' }, { status: 500 });
  }
}

/** Soft delete: define ativo = 0. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    await query('UPDATE naturezas SET ativo = 0 WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API naturezas [id] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir.' }, { status: 500 });
  }
}
