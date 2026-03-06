import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { ReconciliationService } from '@/modules/bank/reconciliation/ReconciliationService';
import { hasPermission } from '@/lib/rbac';


export const dynamic = 'force-dynamic';
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: '0' }];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'reconciliation.confirm');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para confirmar/rejeitar conciliação.' }, { status: 403 });
    }
    const { id } = await params;
    const matchId = parseInt(id, 10);
    if (!Number.isInteger(matchId) || matchId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const action = body.action === 'reject' ? 'reject' : 'confirm';
    const service = new ReconciliationService();
    if (action === 'reject') {
      await service.rejectMatch(matchId, userId);
      return NextResponse.json({ success: true, data: { status: 'rejected' } });
    }
    await service.confirmMatch(matchId, userId);
    return NextResponse.json({ success: true, data: { status: 'confirmed' } });
  } catch (e) {
    console.error('API reconciliation [id] POST:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar match.', ...(process.env.NODE_ENV !== 'production' && { detail: message }) },
      { status: 500 }
    );
  }
}
