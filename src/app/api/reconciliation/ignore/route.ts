import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { ReconciliationService } from '@/modules/bank/reconciliation/ReconciliationService';
import { hasPermission } from '@/lib/rbac';


export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'reconciliation.confirm');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para ignorar transação do extrato.' }, { status: 403 });
    }
    const body = await request.json();
    const bankTransactionId = body.bank_transaction_id != null ? parseInt(String(body.bank_transaction_id), 10) : 0;
    if (!bankTransactionId || bankTransactionId < 1) {
      return NextResponse.json({ success: false, error: 'ID da transação do extrato é obrigatório.' }, { status: 400 });
    }
    const service = new ReconciliationService();
    await service.ignoreTransaction(bankTransactionId);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API reconciliation/ignore POST:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: 'Erro ao ignorar transação.', ...(process.env.NODE_ENV !== 'production' && { detail: message }) },
      { status: 500 }
    );
  }
}
