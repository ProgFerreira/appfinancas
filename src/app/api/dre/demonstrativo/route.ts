import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { DreDemonstrativoService } from '@/modules/finance/services/DreDemonstrativoService';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'dre.view');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 });
    }
    const mesRef = request.nextUrl.searchParams.get('mes_ref') ?? '';
    const service = new DreDemonstrativoService();
    const result = await service.getDemonstrativo(mesRef);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    console.error('API dre/demonstrativo:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao carregar demonstrativo DRE.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
