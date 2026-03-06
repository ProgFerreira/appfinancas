import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { CashFlowService } from '@/modules/finance/services/CashFlowService';
import { format, lastDayOfMonth, startOfMonth } from 'date-fns';

function normalizePeriod(dataInicio: string | null, dataFim: string | null): { dataInicio: string; dataFim: string } {
  const now = new Date();
  const firstDay = format(startOfMonth(now), 'yyyy-MM-dd');
  const lastDay = format(lastDayOfMonth(now), 'yyyy-MM-dd');
  const start = dataInicio?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(dataInicio)
    ? dataInicio
    : firstDay;
  const end = dataFim?.trim() && /^\d{4}-\d{2}-\d{2}$/.test(dataFim)
    ? dataFim
    : lastDay;
  if (start > end) return { dataInicio: end, dataFim: start };
  return { dataInicio: start, dataFim: end };
}


export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'fluxo-caixa.view');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const { dataInicio, dataFim } = normalizePeriod(
      searchParams.get('data_inicio'),
      searchParams.get('data_fim')
    );
    const contaBancariaId = searchParams.get('conta_bancaria_id');
    const centroCustoId = searchParams.get('centro_custo_id');
    const categoriaId = searchParams.get('categoria_id');
    const visao = searchParams.get('visao');
    const saldoInicialParam = searchParams.get('saldo_inicial');

    const params = {
      dataInicio,
      dataFim,
      contaBancariaId: contaBancariaId ? parseInt(contaBancariaId, 10) : null,
      centroCustoId: centroCustoId ? parseInt(centroCustoId, 10) : null,
      categoriaId: categoriaId ? parseInt(categoriaId, 10) : null,
    };

    const service = new CashFlowService();

    if (visao === 'dia-a-dia') {
      const saldoInicialManual =
        saldoInicialParam !== null && saldoInicialParam !== '' && !Number.isNaN(Number(saldoInicialParam))
          ? Number(saldoInicialParam)
          : null;
      const result = await service.getFluxoDiaADia(params, saldoInicialManual);
      return NextResponse.json({ success: true, data: result });
    }

    const result = await service.getByPeriod(params);
    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    console.error('API fluxo-caixa:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao carregar fluxo de caixa.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
