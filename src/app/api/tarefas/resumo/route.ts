import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

export interface TarefasResumo {
  total: number;
  pendente: number;
  em_andamento: number;
  concluido: number;
  cancelado: number;
  vencidas: number;
}


export const dynamic = 'force-static';

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const baseWhere = 'WHERE deleted_at IS NULL';
    const [totalRow] = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM tarefas ${baseWhere}`
    );
    const total = totalRow?.total ?? 0;

    const byStatus = await query<{ status: string; total: number }[]>(
      `SELECT status, COUNT(*) AS total FROM tarefas ${baseWhere} GROUP BY status`
    );
    const statusCounts: Record<string, number> = {};
    for (const row of Array.isArray(byStatus) ? byStatus : []) {
      statusCounts[row.status] = row.total;
    }

    const [vencidasRow] = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM tarefas ${baseWhere}
       AND data_vencimento IS NOT NULL AND data_vencimento < CURDATE()
       AND status NOT IN ('concluido', 'cancelado')`
    );
    const vencidas = vencidasRow?.total ?? 0;

    const resumo: TarefasResumo = {
      total,
      pendente: statusCounts.pendente ?? 0,
      em_andamento: statusCounts.em_andamento ?? 0,
      concluido: statusCounts.concluido ?? 0,
      cancelado: statusCounts.cancelado ?? 0,
      vencidas,
    };

    return NextResponse.json({ success: true, data: resumo });
  } catch (e) {
    console.error('API tarefas/resumo GET:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar resumo de tarefas.' },
      { status: 500 }
    );
  }
}
