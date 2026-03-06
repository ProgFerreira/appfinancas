import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';

/**
 * POST /api/bank/transactions/[id]/create-payable
 * Cria uma conta a pagar a partir de uma transação OFX (débito), registra o pagamento e concilia.
 * Body: categoria_id (obrigatório), data_competencia?, descricao?, fornecedor_id?, centro_custo_id?, plano_contas_id?, tipo_custo?
 */

export const dynamic = 'force-static';

export function generateStaticParams(): { id: string }[] {
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
      return NextResponse.json(
        { success: false, error: 'Sem permissão para criar conta a pagar a partir do extrato.' },
        { status: 403 }
      );
    }
    const id = parseInt((await params).id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return NextResponse.json({ success: false, error: 'ID da transação inválido.' }, { status: 400 });
    }

    const btRows = await query<
      { id: number; bank_account_id: number; posted_at: string; amount: number; type: string; memo: string | null; payee: string | null }[]
    >(
      'SELECT id, bank_account_id, posted_at, amount, type, memo, payee FROM bank_transactions WHERE id = ? LIMIT 1',
      [id]
    );
    const bt = Array.isArray(btRows) ? btRows[0] : null;
    if (!bt) {
      return NextResponse.json({ success: false, error: 'Transação não encontrada.' }, { status: 404 });
    }
    if (bt.type !== 'debit') {
      return NextResponse.json(
        { success: false, error: 'Apenas transações de débito (saída) podem gerar conta a pagar.' },
        { status: 400 }
      );
    }

    const confirmed = await query<{ n: number }[]>(
      `SELECT 1 AS n FROM reconciliation_matches WHERE bank_transaction_id = ? AND status = 'confirmed' LIMIT 1`,
      [id]
    );
    if (Array.isArray(confirmed) && confirmed.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Esta transação já está conciliada.' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const categoriaId = body.categoria_id != null ? parseInt(String(body.categoria_id), 10) : 0;
    if (!Number.isInteger(categoriaId) || categoriaId < 1) {
      return NextResponse.json({ success: false, error: 'Categoria é obrigatória.' }, { status: 400 });
    }

    const postedAt = String(bt.posted_at).slice(0, 10);
    const dataLancamento =
      typeof body.data_emissao === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.data_emissao)
        ? body.data_emissao
        : typeof body.data_vencimento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.data_vencimento)
          ? body.data_vencimento
          : postedAt;
    const dataPagamento =
      typeof body.data_pagamento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.data_pagamento)
        ? body.data_pagamento
        : dataLancamento;
    const contaBancariaId =
      body.conta_bancaria_id != null && body.conta_bancaria_id !== '' && Number.isInteger(parseInt(String(body.conta_bancaria_id), 10))
        ? parseInt(String(body.conta_bancaria_id), 10)
        : bt.bank_account_id;
    const dataCompetencia =
      typeof body.data_competencia === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.data_competencia)
        ? body.data_competencia
        : dataLancamento.slice(0, 7) + '-01';
    const descricao =
      typeof body.descricao === 'string' && body.descricao.trim()
        ? body.descricao.trim().slice(0, 180)
        : (bt.memo || bt.payee || `OFX ${postedAt}`).slice(0, 180);
    const fornecedorId = body.fornecedor_id != null && body.fornecedor_id !== '' ? parseInt(String(body.fornecedor_id), 10) : null;
    const centroCustoId = body.centro_custo_id != null && body.centro_custo_id !== '' ? parseInt(String(body.centro_custo_id), 10) : null;
    const planoContasId = body.plano_contas_id != null && body.plano_contas_id !== '' ? parseInt(String(body.plano_contas_id), 10) : null;
    const tipoCusto = typeof body.tipo_custo === 'string' && ['fixo', 'variavel'].includes(body.tipo_custo) ? body.tipo_custo : 'variavel';
    const valor = Number(bt.amount);
    if (valor <= 0) {
      return NextResponse.json({ success: false, error: 'Valor da transação inválido.' }, { status: 400 });
    }

    await query(
      `INSERT INTO contas_pagar (fornecedor_id, descricao, categoria_id, plano_contas_id, centro_custo_id, valor, data_emissao, data_vencimento, data_competencia, conta_bancaria_id, forma_pagamento, tipo_custo, origem, situacao, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 'ofx', 'em_aberto', 1)`,
      [
        fornecedorId,
        descricao,
        categoriaId,
        planoContasId,
        centroCustoId,
        valor,
        dataLancamento,
        dataLancamento,
        dataCompetencia,
        contaBancariaId,
        tipoCusto,
      ]
    );
    const cpIdRows = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const contaPagarId = Array.isArray(cpIdRows) && cpIdRows[0] ? Number(cpIdRows[0].id) : 0;
    if (contaPagarId === 0) {
      return NextResponse.json({ success: false, error: 'Erro ao criar conta a pagar.' }, { status: 500 });
    }

    await query(
      `INSERT INTO contas_pagar_pagamentos (conta_pagar_id, data_pagamento, valor_pago, conta_bancaria_id, observacoes)
       VALUES (?, ?, ?, ?, 'Gerado a partir do extrato OFX')`,
      [contaPagarId, dataPagamento, valor, contaBancariaId]
    );
    const payIdRows = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const paymentId = Array.isArray(payIdRows) && payIdRows[0] ? Number(payIdRows[0].id) : 0;

    await query('UPDATE contas_pagar SET situacao = ? WHERE id = ?', ['pago', contaPagarId]);

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await query(
      `INSERT INTO reconciliation_matches (bank_transaction_id, payable_payment_id, receivable_receipt_id, status, confirmed_at, confirmed_by)
       VALUES (?, ?, NULL, 'confirmed', ?, ?)`,
      [id, paymentId, now, userId]
    );

    return NextResponse.json({
      success: true,
      data: { conta_pagar_id: contaPagarId, pagamento_id: paymentId, message: 'Conta a pagar criada e conciliada.' },
    });
  } catch (e) {
    console.error('API bank/transactions/[id]/create-payable POST:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar conta a pagar.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
