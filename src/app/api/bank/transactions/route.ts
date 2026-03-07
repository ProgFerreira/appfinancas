import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'bank.view');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para ver transações do extrato.' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10)));
    const bankAccountId = searchParams.get('bank_account_id');
    const dataInicio =
      searchParams.get('start_date') ??
      searchParams.get('data_inicio');
    const dataFim =
      searchParams.get('end_date') ??
      searchParams.get('data_fim');
    const status = searchParams.get('status'); // conciliado, nao_conciliado, sugestao, ignorado
    const importId = searchParams.get('import_id');

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];

    if (bankAccountId) {
      const id = parseInt(bankAccountId, 10);
      if (Number.isInteger(id) && id > 0) {
        where += ' AND bt.bank_account_id = ?';
        params.push(id);
      }
    }
    if (importId) {
      const importIdNum = parseInt(importId, 10);
      if (Number.isInteger(importIdNum) && importIdNum > 0) {
        where += ' AND bt.bank_statement_import_id = ?';
        params.push(importIdNum);
      }
    }
    if (dataInicio && /^\d{4}-\d{2}-\d{2}$/.test(dataInicio)) {
      where += ' AND bt.posted_at >= ?';
      params.push(dataInicio);
    }
    if (dataFim && /^\d{4}-\d{2}-\d{2}$/.test(dataFim)) {
      where += ' AND bt.posted_at <= ?';
      params.push(dataFim);
    }

    // Filtro por status de conciliação, baseado em aggregation de reconciliation_matches
    if (status && ['conciliado', 'nao_conciliado', 'sugestao', 'ignorado'].includes(status)) {
      if (status === 'conciliado') {
        where += ' AND COALESCE(rm.has_confirmed, 0) = 1';
      } else if (status === 'ignorado') {
        where += ' AND COALESCE(rm.has_ignored, 0) = 1';
      } else if (status === 'sugestao') {
        where +=
          ' AND COALESCE(rm.has_confirmed, 0) = 0 AND COALESCE(rm.has_ignored, 0) = 0 AND COALESCE(rm.has_suggested, 0) = 1';
      } else if (status === 'nao_conciliado') {
        where +=
          ' AND COALESCE(rm.has_confirmed, 0) = 0 AND COALESCE(rm.has_ignored, 0) = 0 AND COALESCE(rm.has_suggested, 0) = 0';
      }
    }

    const fromClause = `
      FROM bank_transactions bt
      LEFT JOIN contas_bancarias cb ON cb.id = bt.bank_account_id
      LEFT JOIN (
        SELECT
          bank_transaction_id,
          MAX(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS has_confirmed,
          MAX(CASE WHEN status = 'ignored' THEN 1 ELSE 0 END)   AS has_ignored,
          MAX(CASE WHEN status = 'suggested' THEN 1 ELSE 0 END) AS has_suggested
        FROM reconciliation_matches
        GROUP BY bank_transaction_id
      ) rm ON rm.bank_transaction_id = bt.id
    `;

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total ${fromClause} ${where}`,
      params
    );
    const totalRaw = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;
    const total = Math.max(0, Number(totalRaw));
    const limitNum = Math.floor(Math.max(1, Math.min(50, perPage)));
    const offsetNum = Math.floor(Math.max(0, (page - 1) * limitNum));
    const list = await query<
      {
        id: number;
        bank_account_id: number;
        fit_id: string;
        posted_at: string;
        amount: number;
        type: string;
        memo: string | null;
        payee: string | null;
        conta_descricao: string;
        reconciliation_status: string;
        running_balance: number;
      }[]
    >(
      `SELECT
         bt.id,
         bt.bank_account_id,
         bt.fit_id,
         bt.posted_at,
         bt.amount,
         bt.type,
         bt.memo,
         bt.payee,
         cb.descricao AS conta_descricao,
         CASE
           WHEN COALESCE(rm.has_confirmed, 0) = 1 THEN 'conciliado'
           WHEN COALESCE(rm.has_ignored, 0) = 1 THEN 'ignorado'
           WHEN COALESCE(rm.has_suggested, 0) = 1 THEN 'sugestao'
           ELSE 'nao_conciliado'
         END AS reconciliation_status,
         SUM(CASE WHEN bt.type = 'credit' THEN bt.amount ELSE -bt.amount END)
           OVER (PARTITION BY bt.bank_account_id ORDER BY bt.posted_at, bt.id
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_balance
       ${fromClause}
       ${where}
       ORDER BY bt.posted_at DESC, bt.id DESC
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      params
    );

    const rows = Array.isArray(list) ? list : [];
    const ids = rows.map((r) => r.id);
    type BestSuggestion = {
      match_id: number;
      tipo: 'pagamento' | 'recebimento';
      referencia: number;
      descricao: string | null;
      valor: number;
      score: number;
    };
    const suggestionsByTx: Record<number, { best: BestSuggestion; count: number }> = {};
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      const suggestionRows = await query<
        {
          match_id: number;
          bank_transaction_id: number;
          score: number;
          payable_payment_id: number | null;
          receivable_receipt_id: number | null;
          descricao: string | null;
          valor: number;
        }[]
      >(
        `SELECT rm.id AS match_id, rm.bank_transaction_id, rm.score,
                rm.payable_payment_id, rm.receivable_receipt_id,
                COALESCE(cp.descricao, cr.descricao) AS descricao,
                COALESCE(p.valor_pago, r.valor_recebido) AS valor
         FROM reconciliation_matches rm
         LEFT JOIN contas_pagar_pagamentos p ON p.id = rm.payable_payment_id
         LEFT JOIN contas_pagar cp ON cp.id = p.conta_pagar_id
         LEFT JOIN contas_receber_recebimentos r ON r.id = rm.receivable_receipt_id
         LEFT JOIN contas_receber cr ON cr.id = r.conta_receber_id
         WHERE rm.status = 'suggested' AND rm.bank_transaction_id IN (${placeholders})
         ORDER BY rm.bank_transaction_id, rm.score DESC`,
        ids
      );
      const arr = Array.isArray(suggestionRows) ? suggestionRows : [];
      for (const row of arr) {
        const btId = row.bank_transaction_id;
        if (!suggestionsByTx[btId]) {
          suggestionsByTx[btId] = {
            best: {
              match_id: row.match_id,
              tipo: row.payable_payment_id != null ? 'pagamento' : 'recebimento',
              referencia: row.payable_payment_id ?? row.receivable_receipt_id ?? 0,
              descricao: row.descricao ?? null,
              valor: Number(row.valor),
              score: Number(row.score),
            },
            count: 0,
          };
        }
        suggestionsByTx[btId].count += 1;
      }
    }

    const data = rows.map((r) => {
      const sug = suggestionsByTx[r.id];
      return {
        ...r,
        best_suggestion: sug
          ? {
              match_id: sug.best.match_id,
              tipo: sug.best.tipo,
              referencia: sug.best.referencia,
              descricao: sug.best.descricao,
              valor: sug.best.valor,
              score: sug.best.score,
            }
          : null,
        suggestions_count: sug ? sug.count : 0,
      };
    });

    const totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / limitNum));
    return NextResponse.json({
      success: true,
      data,
      meta: { total, page: Number(page), perPage: limitNum, totalPages },
    });
  } catch (e) {
    console.error('API bank/transactions GET:', e);
    const message = e instanceof Error ? e.message : String(e);
    const isTableOrColumn = /Unknown (table|column)/i.test(message) || /doesn't exist/i.test(message);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao listar transações.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
        ...(isTableOrColumn && { hint: 'Execute a migration: database/migrations/019_bank_ofx_reconciliation.sql' }),
      },
      { status: 500 }
    );
  }
}
