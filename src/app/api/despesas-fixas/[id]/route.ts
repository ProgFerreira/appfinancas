import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import type { DespesaFixa } from '@/types';

function validarDespesaFixa(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const descricao = typeof b.descricao === 'string' ? b.descricao.trim() : '';
  if (!descricao) return null;
  const categoriaId = typeof b.categoria_id === 'number' ? b.categoria_id : parseInt(String(b.categoria_id), 10);
  if (!Number.isInteger(categoriaId) || categoriaId < 1) return null;
  const valorPrevisto = Number(b.valor_previsto);
  if (Number.isNaN(valorPrevisto) || valorPrevisto < 0) return null;
  const diaVencimento = typeof b.dia_vencimento === 'number' ? b.dia_vencimento : parseInt(String(b.dia_vencimento), 10);
  if (!Number.isInteger(diaVencimento) || diaVencimento < 1 || diaVencimento > 31) return null;
  return {
    categoria_id: categoriaId,
    plano_contas_id: b.plano_contas_id != null && b.plano_contas_id !== '' ? parseInt(String(b.plano_contas_id), 10) : null,
    centro_custo_id: b.centro_custo_id != null && b.centro_custo_id !== '' ? parseInt(String(b.centro_custo_id), 10) : null,
    fornecedor_id: b.fornecedor_id != null && b.fornecedor_id !== '' ? parseInt(String(b.fornecedor_id), 10) : null,
    descricao,
    valor_previsto: valorPrevisto,
    dia_vencimento: diaVencimento,
    gerar_automaticamente: b.gerar_automaticamente === true || b.gerar_automaticamente === 1 ? 1 : 0,
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
    const rows = await query<DespesaFixa[]>(
      `SELECT id, categoria_id, plano_contas_id, centro_custo_id, fornecedor_id, descricao, valor_previsto, dia_vencimento, gerar_automaticamente, ativo, created_at, updated_at
       FROM despesas_fixas WHERE id = ? LIMIT 1`,
      [idNum]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Despesa fixa não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    console.error('API despesas-fixas [id] GET:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar despesa fixa.' },
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
    const data = validarDespesaFixa(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Dados inválidos.' }, { status: 400 });
    }
    await query(
      `UPDATE despesas_fixas SET categoria_id = ?, plano_contas_id = ?, centro_custo_id = ?, fornecedor_id = ?, descricao = ?, valor_previsto = ?, dia_vencimento = ?, gerar_automaticamente = ?, ativo = ? WHERE id = ?`,
      [
        data.categoria_id as number,
        data.plano_contas_id as number | null,
        data.centro_custo_id as number | null,
        data.fornecedor_id as number | null,
        data.descricao as string,
        data.valor_previsto as number,
        data.dia_vencimento as number,
        data.gerar_automaticamente as number,
        data.ativo as number,
        idNum,
      ]
    );
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API despesas-fixas [id] PUT:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar despesa fixa.' },
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
    await query('UPDATE despesas_fixas SET ativo = 0 WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API despesas-fixas [id] DELETE:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir despesa fixa.' },
      { status: 500 }
    );
  }
}
