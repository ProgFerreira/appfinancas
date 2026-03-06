import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { DreService } from '@/modules/finance/services/DreService';
import { format, subMonths } from 'date-fns';

function normalizePeriod(dataInicio: string | null, dataFim: string | null): { dataInicio: string; dataFim: string } {
  const now = new Date();
  const start = dataInicio?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(dataInicio)
    ? dataInicio
    : format(subMonths(now, 1), 'yyyy-MM-dd');
  const end = dataFim?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(dataFim)
    ? dataFim
    : format(now, 'yyyy-MM-dd');
  if (start > end) return { dataInicio: end, dataFim: start };
  return { dataInicio: start, dataFim: end };
}


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
    const { searchParams } = new URL(request.url);
    const { dataInicio, dataFim } = normalizePeriod(
      searchParams.get('data_inicio'),
      searchParams.get('data_fim')
    );
    const centroCustoId = searchParams.get('centro_custo_id');
    const grupo = searchParams.get('grupo') as 'receita' | 'custo' | 'despesa' | 'imposto' | null;
    const service = new DreService();
    const result = await service.getByPeriod({
      dataInicio,
      dataFim,
      centroCustoId: centroCustoId ? parseInt(centroCustoId, 10) : null,
      grupo: grupo || null,
    });
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    console.error('API dre:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao carregar DRE.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
