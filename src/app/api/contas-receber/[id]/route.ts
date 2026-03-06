import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import type { ContaReceber } from '@/types';


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
    const rows = await query<(ContaReceber & { cliente_nome?: string })[]>(
      `SELECT cr.id, cr.cliente_id, cr.descricao, cr.valor, cr.data_emissao, cr.data_vencimento,
              cr.situacao, cr.observacoes, c.nome AS cliente_nome
       FROM contas_receber cr
       INNER JOIN clientes c ON c.id = cr.cliente_id
       WHERE cr.id = ? AND cr.ativo = 1 LIMIT 1`,
      [idNum]
    );
    const conta = Array.isArray(rows) ? rows[0] : null;
    if (!conta) {
      return NextResponse.json({ success: false, error: 'Conta não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: conta });
  } catch (e) {
    console.error('API contas-receber [id] GET:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar conta.' },
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
    await query('UPDATE contas_receber SET ativo = 0 WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API contas-receber [id] DELETE:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir conta.' },
      { status: 500 }
    );
  }
}
