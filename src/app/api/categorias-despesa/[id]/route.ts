import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

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


export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
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
      { id: number; plano_contas_id: number; nome: string; tipo: string; descricao: string | null; ativo: number }[]
    >(
      `SELECT id, plano_contas_id, nome, tipo, descricao, ativo
       FROM categorias_despesa WHERE id = ? LIMIT 1`,
      [idNum]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Categoria não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    console.error('API categorias-despesa [id] GET:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar categoria.' },
      { status: 500 }
    );
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
      `UPDATE categorias_despesa SET plano_contas_id = ?, nome = ?, tipo = ?, descricao = ?, ativo = ? WHERE id = ?`,
      [
        data.plano_contas_id as number,
        data.nome as string,
        data.tipo as string,
        data.descricao as string | null,
        data.ativo as number,
        idNum,
      ]
    );
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API categorias-despesa [id] PUT:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar categoria.' },
      { status: 500 }
    );
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
    await query('UPDATE categorias_despesa SET ativo = 0 WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API categorias-despesa [id] DELETE:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir categoria.' },
      { status: 500 }
    );
  }
}
