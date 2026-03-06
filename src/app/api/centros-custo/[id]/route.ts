import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

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


export const dynamic = 'force-static';
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
      { id: number; codigo: string | null; nome: string; natureza_id: number | null; natureza: string; plano_contas: string | null; descricao: string | null; ordem: number; ativo: number }[]
    >(
      `SELECT id, codigo, nome, natureza_id, natureza, plano_contas, descricao, ordem, ativo
       FROM centros_custo WHERE id = ? LIMIT 1`,
      [idNum]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Centro de custo não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    console.error('API centros-custo [id] GET:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar centro de custo.' },
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
      `UPDATE centros_custo SET codigo = ?, nome = ?, natureza_id = ?, natureza = ?, plano_contas = ?, descricao = ?, ordem = ?, ativo = ? WHERE id = ?`,
      [
        data.codigo as string | null,
        data.nome as string,
        data.natureza_id as number | null,
        data.natureza as string,
        data.plano_contas as string | null,
        data.descricao as string | null,
        data.ordem as number,
        data.ativo as number,
        idNum,
      ]
    );
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API centros-custo [id] PUT:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar centro de custo.' },
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
    await query('UPDATE centros_custo SET ativo = 0 WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API centros-custo [id] DELETE:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir centro de custo.' },
      { status: 500 }
    );
  }
}
