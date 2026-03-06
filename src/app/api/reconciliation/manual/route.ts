import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';

/**
 * Cria vínculo manual entre uma transação do extrato (bank_transactions)
 * e um pagamento (contas_pagar_pagamentos) ou um recebimento (contas_receber_recebimentos).
 * Body: { bank_transaction_id, payable_payment_id? , receivable_receipt_id? }
 * Exatamente um de payable_payment_id ou receivable_receipt_id deve ser enviado.
 */

export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'reconciliation.confirm');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para vincular manualmente.' }, { status: 403 });
    }
    const body = await request.json();
    const bankTransactionId = body.bank_transaction_id != null ? parseInt(String(body.bank_transaction_id), 10) : 0;
    const payablePaymentId = body.payable_payment_id != null ? parseInt(String(body.payable_payment_id), 10) : null;
    const receivableReceiptId = body.receivable_receipt_id != null ? parseInt(String(body.receivable_receipt_id), 10) : null;

    if (!bankTransactionId || bankTransactionId < 1) {
      return NextResponse.json({ success: false, error: 'bank_transaction_id é obrigatório.' }, { status: 400 });
    }
    const hasPayment = payablePaymentId != null && payablePaymentId > 0;
    const hasReceipt = receivableReceiptId != null && receivableReceiptId > 0;
    if (hasPayment === hasReceipt) {
      return NextResponse.json(
        { success: false, error: 'Informe exatamente um de: payable_payment_id ou receivable_receipt_id.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await query(
      `INSERT INTO reconciliation_matches (bank_transaction_id, payable_payment_id, receivable_receipt_id, status, confirmed_at, confirmed_by)
       VALUES (?, ?, ?, 'confirmed', ?, ?)`,
      [
        bankTransactionId,
        hasPayment ? payablePaymentId : null,
        hasReceipt ? receivableReceiptId : null,
        now,
        userId,
      ]
    );
    return NextResponse.json({ success: true, data: { message: 'Vínculo criado.' } });
  } catch (e) {
    console.error('API reconciliation/manual POST:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: 'Erro ao criar vínculo.', ...(process.env.NODE_ENV !== 'production' && { detail: message }) },
      { status: 500 }
    );
  }
}
