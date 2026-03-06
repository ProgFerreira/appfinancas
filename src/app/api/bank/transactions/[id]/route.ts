import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export function generateStaticParams(): { id: string }[] {
  return [{ id: '0' }];
}

/**
 * GET /api/bank/transactions/[id]
 * Retorna uma transação do extrato por ID (para formulários de criar conta a pagar/receber).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'bank.view');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para ver transações.' }, { status: 403 });
    }
    const id = parseInt((await params).id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido.' }, { status: 400 });
    }
    const rows = await query<
      { id: number; bank_account_id: number; fit_id: string; posted_at: string; amount: number; type: string; memo: string | null; payee: string | null; conta_descricao: string }[]
    >(
      `SELECT bt.id, bt.bank_account_id, bt.fit_id, bt.posted_at, bt.amount, bt.type, bt.memo, bt.payee,
              cb.descricao AS conta_descricao
       FROM bank_transactions bt
       LEFT JOIN contas_bancarias cb ON cb.id = bt.bank_account_id
       WHERE bt.id = ? LIMIT 1`,
      [id]
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) {
      return NextResponse.json({ success: false, error: 'Transação não encontrada.' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: {
        id: row.id,
        bank_account_id: row.bank_account_id,
        fit_id: row.fit_id,
        posted_at: row.posted_at,
        amount: Number(row.amount),
        type: row.type,
        memo: row.memo,
        payee: row.payee,
        conta_descricao: row.conta_descricao ?? '',
      },
    });
  } catch (e) {
    console.error('API bank/transactions/[id] GET:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar transação.', ...(process.env.NODE_ENV !== 'production' && { detail: message }) },
      { status: 500 }
    );
  }
}
