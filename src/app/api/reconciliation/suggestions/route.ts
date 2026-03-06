import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { ReconciliationService } from '@/modules/bank/reconciliation/ReconciliationService';
import { hasPermission } from '@/lib/rbac';


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'reconciliation.confirm');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para gerar sugestões de conciliação.' }, { status: 403 });
    }
    const body = await request.json();
    const bankAccountId = body.bank_account_id != null ? parseInt(String(body.bank_account_id), 10) : 0;
    if (!bankAccountId || bankAccountId < 1) {
      return NextResponse.json({ success: false, error: 'Conta bancária obrigatória para gerar sugestões.' }, { status: 400 });
    }
    const service = new ReconciliationService();
    const suggestions = await service.getSuggestions(bankAccountId, {
      tolerance: body.tolerance ?? 0.01,
      days: body.days ?? 5,
    });
    return NextResponse.json({ success: true, data: { count: suggestions.length, suggestions } });
  } catch (e) {
    console.error('API reconciliation suggestions POST:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: 'Erro ao gerar sugestões.', ...(process.env.NODE_ENV !== 'production' && { detail: message }) },
      { status: 500 }
    );
  }
}
