import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';


export const dynamic = 'force-dynamic';
export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ id: string }[]> {
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
    const allowed = await hasPermission(userId, 'bank.view');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão.' }, { status: 403 });
    }
    const { id } = await params;
    const bankTransactionId = parseInt(id, 10);
    if (!Number.isInteger(bankTransactionId) || bankTransactionId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const rows = await query<
      {
        match_id: number;
        score: number;
        payable_payment_id: number | null;
        receivable_receipt_id: number | null;
        descricao: string | null;
        valor: number;
      }[]
    >(
      `SELECT rm.id AS match_id, rm.score, rm.payable_payment_id, rm.receivable_receipt_id,
              COALESCE(cp.descricao, cr.descricao) AS descricao,
              COALESCE(p.valor_pago, r.valor_recebido) AS valor
       FROM reconciliation_matches rm
       LEFT JOIN contas_pagar_pagamentos p ON p.id = rm.payable_payment_id
       LEFT JOIN contas_pagar cp ON cp.id = p.conta_pagar_id
       LEFT JOIN contas_receber_recebimentos r ON r.id = rm.receivable_receipt_id
       LEFT JOIN contas_receber cr ON cr.id = r.conta_receber_id
       WHERE rm.status = 'suggested' AND rm.bank_transaction_id = ?
       ORDER BY rm.score DESC`,
      [bankTransactionId]
    );
    const arr = Array.isArray(rows) ? rows : [];
    const suggestions = arr.map((r) => ({
      match_id: r.match_id,
      tipo: r.payable_payment_id != null ? ('pagamento' as const) : ('recebimento' as const),
      referencia: r.payable_payment_id ?? r.receivable_receipt_id ?? 0,
      descricao: r.descricao ?? null,
      valor: Number(r.valor),
      score: Number(r.score),
    }));
    return NextResponse.json({ success: true, data: suggestions });
  } catch (e) {
    console.error('API bank/transactions/[id]/suggestions GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar sugestões.' }, { status: 500 });
  }
}
