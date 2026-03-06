import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

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
      { id: number; cte_id: number; categoria_id: number; plano_contas_id: number | null; centro_custo_id: number | null; fornecedor_id: number | null; descricao: string | null; valor: number; data_despesa: string; conta_pagar_id: number | null; ativo: number }[]
    >(
      'SELECT id, cte_id, categoria_id, plano_contas_id, centro_custo_id, fornecedor_id, descricao, valor, data_despesa, conta_pagar_id, ativo FROM despesas_viagem WHERE id = ? LIMIT 1',
      [idNum]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Despesa de viagem não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    console.error('API despesas-viagem [id] GET:', e);
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
      `UPDATE despesas_viagem SET cte_id = ?, categoria_id = ?, plano_contas_id = ?, centro_custo_id = ?, fornecedor_id = ?, descricao = ?, valor = ?, data_despesa = ?, conta_pagar_id = ?, ativo = ? WHERE id = ?`,
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
        idNum,
      ]
    );
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API despesas-viagem [id] PUT:', e);
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
    if (!userId) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    await query('UPDATE despesas_viagem SET ativo = 0 WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API despesas-viagem [id] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir.' }, { status: 500 });
  }
}
