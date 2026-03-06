import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';

/**
 * POST /api/bank/transactions/[id]/create-receivable
 * Cria uma conta a receber a partir de uma transação OFX (crédito), registra o recebimento e concilia.
 * Body: cliente_id (obrigatório), data_competencia?, descricao?, categoria_receita_id?, plano_contas_id?
 */

export const dynamic = 'force-static';
export const dynamicParams = false;

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
        { success: false, error: 'Sem permissão para criar conta a receber a partir do extrato.' },
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
    if (bt.type !== 'credit') {
      return NextResponse.json(
        { success: false, error: 'Apenas transações de crédito (entrada) podem gerar conta a receber.' },
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
    const clienteId = body.cliente_id != null ? parseInt(String(body.cliente_id), 10) : 0;
    if (!Number.isInteger(clienteId) || clienteId < 1) {
      return NextResponse.json({ success: false, error: 'Cliente é obrigatório.' }, { status: 400 });
    }

    const postedAt = String(bt.posted_at).slice(0, 10);
    const dataLancamento =
      typeof body.data_emissao === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.data_emissao)
        ? body.data_emissao
        : typeof body.data_vencimento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.data_vencimento)
          ? body.data_vencimento
          : postedAt;
    const dataRecebimento =
      typeof body.data_recebimento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.data_recebimento)
        ? body.data_recebimento
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
    const categoriaReceitaId = body.categoria_receita_id != null && body.categoria_receita_id !== '' ? parseInt(String(body.categoria_receita_id), 10) : null;
    const planoContasId = body.plano_contas_id != null && body.plano_contas_id !== '' ? parseInt(String(body.plano_contas_id), 10) : null;
    const valor = Number(bt.amount);
    if (valor <= 0) {
      return NextResponse.json({ success: false, error: 'Valor da transação inválido.' }, { status: 400 });
    }

    await query(
      `INSERT INTO contas_receber (cliente_id, categoria_receita_id, plano_contas_id, descricao, valor, data_emissao, data_vencimento, data_competencia, conta_bancaria_id, situacao, observacoes, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'em_aberto', 'Gerado a partir do extrato OFX', 1)`,
      [
        clienteId,
        categoriaReceitaId,
        planoContasId,
        descricao,
        valor,
        dataLancamento,
        dataLancamento,
        dataCompetencia,
        contaBancariaId,
      ]
    );
    const crIdRows = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const contaReceberId = Array.isArray(crIdRows) && crIdRows[0] ? Number(crIdRows[0].id) : 0;
    if (contaReceberId === 0) {
      return NextResponse.json({ success: false, error: 'Erro ao criar conta a receber.' }, { status: 500 });
    }

    await query(
      `INSERT INTO contas_receber_recebimentos (conta_receber_id, data_recebimento, valor_recebido, desconto, forma_pagamento, conta_bancaria_id, observacoes)
       VALUES (?, ?, ?, 0, NULL, ?, 'Gerado a partir do extrato OFX')`,
      [contaReceberId, dataRecebimento, valor, contaBancariaId]
    );
    const recIdRows = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const receiptId = Array.isArray(recIdRows) && recIdRows[0] ? Number(recIdRows[0].id) : 0;

    await query('UPDATE contas_receber SET situacao = ? WHERE id = ?', ['recebido', contaReceberId]);

    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await query(
      `INSERT INTO reconciliation_matches (bank_transaction_id, payable_payment_id, receivable_receipt_id, status, confirmed_at, confirmed_by)
       VALUES (?, NULL, ?, 'confirmed', ?, ?)`,
      [id, receiptId, now, userId]
    );

    return NextResponse.json({
      success: true,
      data: { conta_receber_id: contaReceberId, recebimento_id: receiptId, message: 'Conta a receber criada e conciliada.' },
    });
  } catch (e) {
    console.error('API bank/transactions/[id]/create-receivable POST:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao criar conta a receber.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
