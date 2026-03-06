import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { ReconciliationService } from '@/modules/bank/reconciliation/ReconciliationService';
import { hasPermission } from '@/lib/rbac';


export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'reconciliation.view');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para ver conciliação.' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get('bank_account_id');
    const service = new ReconciliationService();
    const unreconciled = await service.getUnreconciledTransactions(
      bankAccountId ? parseInt(bankAccountId, 10) : null
    );
    const suggested = await service.listSuggestedMatches(
      bankAccountId ? parseInt(bankAccountId, 10) : null
    );
    return NextResponse.json({
      success: true,
      data: { unreconciled, suggested },
    });
  } catch (e) {
    console.error('API reconciliation GET:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar conciliação.', ...(process.env.NODE_ENV !== 'production' && { detail: message }) },
      { status: 500 }
    );
  }
}
