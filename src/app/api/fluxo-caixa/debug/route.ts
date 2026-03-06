import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { hasPermission } from '@/lib/rbac';
import { query } from '@/lib/db';

/**
 * Diagnóstico: retorna o registro contas_pagar pelo id e indica por que pode não aparecer no fluxo.
 * GET /api/fluxo-caixa/debug?conta_pagar_id=5
 */

export const dynamic = 'force-dynamic';

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
    const idStr = searchParams.get('conta_pagar_id');
    const id = idStr ? parseInt(idStr, 10) : 0;
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Informe conta_pagar_id (ex: 5)' }, { status: 400 });
    }

    const row = await query<
      { id: number; ativo: number | null; situacao: string | null; data_vencimento: string | null; valor: number; conta_bancaria_id: number | null; centro_custo_id: number | null; categoria_id: number | null }[]
    >(
      `SELECT id, ativo, situacao, data_vencimento, valor, conta_bancaria_id, centro_custo_id, categoria_id
       FROM contas_pagar WHERE id = ? LIMIT 1`,
      [id]
    );
    const cp = Array.isArray(row) ? row[0] : null;
    if (!cp) {
      return NextResponse.json({
        success: true,
        data: { encontrado: false, id, mensagem: 'Nenhum registro encontrado com este id.' },
      });
    }

    const pagamentos = await query<{ total: number }[]>(
      `SELECT COALESCE(SUM(valor_pago), 0) AS total FROM contas_pagar_pagamentos WHERE conta_pagar_id = ?`,
      [id]
    );
    const totalPago = Number((Array.isArray(pagamentos) ? pagamentos[0]?.total : 0) ?? 0);
    const valorPendente = Number(cp.valor) - totalPago;
    const situacaoNorm = (cp.situacao ?? '').trim().toLowerCase();
    const ativoOk = cp.ativo === 1 || cp.ativo === null;
    const situacaoOk = situacaoNorm === 'em_aberto' || situacaoNorm === 'parcial';
    const dataVenc = cp.data_vencimento ? String(cp.data_vencimento).slice(0, 10) : null;

    return NextResponse.json({
      success: true,
      data: {
        encontrado: true,
        id: cp.id,
        ativo: cp.ativo,
        situacao: cp.situacao,
        situacao_normalizado: situacaoNorm,
        data_vencimento: dataVenc,
        valor: Number(cp.valor),
        total_pago: totalPago,
        valor_pendente: valorPendente,
        conta_bancaria_id: cp.conta_bancaria_id,
        centro_custo_id: cp.centro_custo_id,
        categoria_id: cp.categoria_id,
        aparece_em_saidas_previstas: ativoOk && situacaoOk && valorPendente > 0,
        motivos_se_nao_aparece: [
          !ativoOk && 'Registro inativo (ativo != 1).',
          !situacaoOk && `Situação deve ser "em_aberto" ou "parcial". Valor no banco: "${cp.situacao ?? ''}".`,
          valorPendente <= 0 && 'Valor pendente é zero ou negativo (título já pago ou valor pago >= valor).',
        ].filter(Boolean),
        dica_periodo: dataVenc
          ? `No fluxo de caixa, use "De" e "Até" de forma que ${dataVenc} esteja dentro do período.`
          : null,
      },
    });
  } catch (e) {
    console.error('API fluxo-caixa/debug:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { success: false, error: 'Erro no diagnóstico.', detail: message },
      { status: 500 }
    );
  }
}
