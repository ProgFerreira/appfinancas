import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';

type ExtratoRow = {
  data: string;
  ordem: number;
  id: number;
  historico: string;
  debito: number | null;
  credito: number | null;
  origem: 'bank' | 'pagamento' | 'recebimento';
};

function toDateStr(v: string | Date | null | undefined): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

/**
 * GET /api/bank/extrato
 * Params: bank_account_id (obrigatório), start_date, end_date (YYYY-MM-DD)
 * Retorna extrato bancário: saldo inicial, movimentos (OFX + pagamentos contas a pagar + recebimentos contas a receber), saldo após cada linha e saldo final.
 * Pagamentos/recebimentos já conciliados com OFX não são duplicados (entra só a linha do banco).
 */

export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'bank.view');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para ver extrato.' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const bankAccountId = searchParams.get('bank_account_id');
    const startDate = searchParams.get('start_date') ?? searchParams.get('data_inicio');
    const endDate = searchParams.get('end_date') ?? searchParams.get('data_fim');

    const accountId = bankAccountId ? parseInt(bankAccountId, 10) : 0;
    if (!Number.isInteger(accountId) || accountId < 1) {
      return NextResponse.json({ success: false, error: 'Informe a conta bancária (bank_account_id).' }, { status: 400 });
    }
    if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !endDate || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json({ success: false, error: 'Informe start_date e end_date (YYYY-MM-DD).' }, { status: 400 });
    }

    const contaRows = await query<
      { id: number; descricao: string; banco: string; agencia: string | null; conta: string | null; saldo_inicial: number }[]
    >(
      `SELECT id, descricao, banco, agencia, conta, COALESCE(saldo_inicial, 0) AS saldo_inicial
       FROM contas_bancarias WHERE id = ? AND ativo = 1 LIMIT 1`,
      [accountId]
    );
    const conta = Array.isArray(contaRows) ? contaRows[0] : null;
    if (!conta) {
      return NextResponse.json({ success: false, error: 'Conta bancária não encontrada.' }, { status: 404 });
    }

    let movBank = 0;
    let movPagAntes = 0;
    let movRecAntes = 0;
    try {
      const saldoAnteriorRows = await query<{ saldo: number }[]>(
        `SELECT COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END), 0) AS saldo
         FROM bank_transactions WHERE bank_account_id = ? AND posted_at < ?`,
        [accountId, startDate]
      );
      movBank = Array.isArray(saldoAnteriorRows) && saldoAnteriorRows[0] ? Number(saldoAnteriorRows[0].saldo) : 0;
    } catch {
      // bank_transactions pode não existir
    }
    try {
      const pagAntesRows = await query<{ total: number }[]>(
        `SELECT COALESCE(SUM(p.valor_pago), 0) AS total
         FROM contas_pagar_pagamentos p
         WHERE p.conta_bancaria_id = ? AND p.data_pagamento < ?
         AND NOT EXISTS (SELECT 1 FROM reconciliation_matches rm WHERE rm.payable_payment_id = p.id AND rm.status IN ('suggested', 'confirmed'))`,
        [accountId, startDate]
      );
      movPagAntes = Array.isArray(pagAntesRows) && pagAntesRows[0] ? Number(pagAntesRows[0].total) : 0;
    } catch {
      try {
        const pagAntesRows = await query<{ total: number }[]>(
          `SELECT COALESCE(SUM(p.valor_pago), 0) AS total FROM contas_pagar_pagamentos p
           WHERE p.conta_bancaria_id = ? AND p.data_pagamento < ?`,
          [accountId, startDate]
        );
        movPagAntes = Array.isArray(pagAntesRows) && pagAntesRows[0] ? Number(pagAntesRows[0].total) : 0;
      } catch {
        // tabela pode não existir
      }
    }
    try {
      const recAntesRows = await query<{ total: number }[]>(
        `SELECT COALESCE(SUM(r.valor_recebido), 0) AS total
         FROM contas_receber_recebimentos r
         WHERE r.conta_bancaria_id = ? AND r.data_recebimento < ?
         AND NOT EXISTS (SELECT 1 FROM reconciliation_matches rm WHERE rm.receivable_receipt_id = r.id AND rm.status IN ('suggested', 'confirmed'))`,
        [accountId, startDate]
      );
      movRecAntes = Array.isArray(recAntesRows) && recAntesRows[0] ? Number(recAntesRows[0].total) : 0;
    } catch {
      try {
        const recAntesRows = await query<{ total: number }[]>(
          `SELECT COALESCE(SUM(r.valor_recebido), 0) AS total FROM contas_receber_recebimentos r
           WHERE r.conta_bancaria_id = ? AND r.data_recebimento < ?`,
          [accountId, startDate]
        );
        movRecAntes = Array.isArray(recAntesRows) && recAntesRows[0] ? Number(recAntesRows[0].total) : 0;
      } catch {
        // tabela pode não existir
      }
    }
    const saldoInicial = Number(conta.saldo_inicial) + movBank + movRecAntes - movPagAntes;

    let bankRows: { id: number; posted_at: string; type: string; amount: number; memo: string | null; payee: string | null }[] = [];
    let pagamentosRows: { id: number; data_pagamento: string; valor_pago: number; observacoes: string | null; descricao: string | null }[] = [];
    let recebimentosRows: { id: number; data_recebimento: string; valor_recebido: number; observacoes: string | null; descricao: string | null }[] = [];
    try {
      const bt = await query<{ id: number; posted_at: string; type: string; amount: number; memo: string | null; payee: string | null }[]>(
        `SELECT id, posted_at, type, amount, memo, payee
         FROM bank_transactions
         WHERE bank_account_id = ? AND posted_at >= ? AND posted_at <= ?
         ORDER BY posted_at ASC, id ASC`,
        [accountId, startDate, endDate]
      );
      bankRows = Array.isArray(bt) ? bt : [];
    } catch {
      // bank_transactions pode não existir
    }
    try {
      const pp = await query<{ id: number; data_pagamento: string; valor_pago: number; observacoes: string | null; descricao: string | null }[]>(
        `SELECT p.id, p.data_pagamento, p.valor_pago, p.observacoes, cp.descricao
         FROM contas_pagar_pagamentos p
         INNER JOIN contas_pagar cp ON cp.id = p.conta_pagar_id
         WHERE p.conta_bancaria_id = ? AND p.data_pagamento >= ? AND p.data_pagamento <= ?
         AND NOT EXISTS (
           SELECT 1 FROM reconciliation_matches rm
           WHERE rm.payable_payment_id = p.id AND rm.status IN ('suggested', 'confirmed')
         )
         ORDER BY p.data_pagamento ASC, p.id ASC`,
        [accountId, startDate, endDate]
      );
      pagamentosRows = Array.isArray(pp) ? pp : [];
    } catch {
      try {
        const pp = await query<{ id: number; data_pagamento: string; valor_pago: number; observacoes: string | null; descricao: string | null }[]>(
          `SELECT p.id, p.data_pagamento, p.valor_pago, p.observacoes, cp.descricao
           FROM contas_pagar_pagamentos p
           INNER JOIN contas_pagar cp ON cp.id = p.conta_pagar_id
           WHERE p.conta_bancaria_id = ? AND p.data_pagamento >= ? AND p.data_pagamento <= ?
           ORDER BY p.data_pagamento ASC, p.id ASC`,
          [accountId, startDate, endDate]
        );
        pagamentosRows = Array.isArray(pp) ? pp : [];
      } catch {
        // tabelas podem não existir
      }
    }
    try {
      const rr = await query<{ id: number; data_recebimento: string; valor_recebido: number; observacoes: string | null; descricao: string | null }[]>(
        `SELECT r.id, r.data_recebimento, r.valor_recebido, r.observacoes, cr.descricao
         FROM contas_receber_recebimentos r
         INNER JOIN contas_receber cr ON cr.id = r.conta_receber_id
         WHERE r.conta_bancaria_id = ? AND r.data_recebimento >= ? AND r.data_recebimento <= ?
         AND NOT EXISTS (
           SELECT 1 FROM reconciliation_matches rm
           WHERE rm.receivable_receipt_id = r.id AND rm.status IN ('suggested', 'confirmed')
         )
         ORDER BY r.data_recebimento ASC, r.id ASC`,
        [accountId, startDate, endDate]
      );
      recebimentosRows = Array.isArray(rr) ? rr : [];
    } catch {
      try {
        const rr = await query<{ id: number; data_recebimento: string; valor_recebido: number; observacoes: string | null; descricao: string | null }[]>(
          `SELECT r.id, r.data_recebimento, r.valor_recebido, r.observacoes, cr.descricao
           FROM contas_receber_recebimentos r
           INNER JOIN contas_receber cr ON cr.id = r.conta_receber_id
           WHERE r.conta_bancaria_id = ? AND r.data_recebimento >= ? AND r.data_recebimento <= ?
           ORDER BY r.data_recebimento ASC, r.id ASC`,
          [accountId, startDate, endDate]
        );
        recebimentosRows = Array.isArray(rr) ? rr : [];
      } catch {
        // tabelas podem não existir
      }
    }

    const all: ExtratoRow[] = [];

    bankRows.forEach((r) => {
      const valor = Number(r.amount);
      all.push({
        data: toDateStr(r.posted_at),
        ordem: 0,
        id: r.id,
        historico: (r.payee || r.memo || String(r.id)).trim() || '—',
        debito: r.type === 'debit' ? valor : null,
        credito: r.type === 'credit' ? valor : null,
        origem: 'bank',
      });
    });
    pagamentosRows.forEach((r) => {
      const valor = Number(r.valor_pago);
      all.push({
        data: toDateStr(r.data_pagamento),
        ordem: 1,
        id: r.id,
        historico: (r.descricao || r.observacoes || `Pagamento #${r.id}`).trim() || '—',
        debito: valor,
        credito: null,
        origem: 'pagamento',
      });
    });
    recebimentosRows.forEach((r) => {
      const valor = Number(r.valor_recebido);
      all.push({
        data: toDateStr(r.data_recebimento),
        ordem: 2,
        id: r.id,
        historico: (r.descricao || r.observacoes || `Recebimento #${r.id}`).trim() || '—',
        debito: null,
        credito: valor,
        origem: 'recebimento',
      });
    });

    all.sort((a, b) => {
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return a.ordem - b.ordem || a.id - b.id;
    });

    let saldoCorrente = saldoInicial;
    const transacoes = all.map((r) => {
      const deb = r.debito ?? 0;
      const cred = r.credito ?? 0;
      saldoCorrente += cred - deb;
      return {
        id: r.id,
        data: r.data,
        historico: r.historico,
        debito: r.debito,
        credito: r.credito,
        saldo_apos: saldoCorrente,
        origem: r.origem,
      };
    });

    const saldoFinal = saldoCorrente;

    return NextResponse.json({
      success: true,
      data: {
        conta: {
          id: conta.id,
          descricao: conta.descricao,
          banco: conta.banco,
          agencia: conta.agencia,
          conta: conta.conta,
        },
        data_inicio: startDate,
        data_fim: endDate,
        saldo_inicial: saldoInicial,
        saldo_final: saldoFinal,
        transacoes,
      },
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('API bank/extrato GET:', err.message, err.stack);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao gerar extrato.',
        ...(process.env.NODE_ENV !== 'production' && { detail: err.message }),
      },
      { status: 500 }
    );
  }
}
