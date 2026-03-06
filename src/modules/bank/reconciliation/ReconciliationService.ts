import { query } from '@/lib/db';

const DEFAULT_TOLERANCE = 0.01;
const DEFAULT_DAYS = 2;

export interface ReconciliationSuggestion {
  bankTransactionId: number;
  bankTransactionAmount: number;
  bankTransactionType: string;
  bankTransactionDate: string;
  bankTransactionMemo: string | null;
  matchId: number;
  paymentId?: number | null;
  receiptId?: number | null;
  score: number;
}

export interface UnreconciledTx {
  id: number;
  bank_account_id: number;
  fit_id: string;
  posted_at: string;
  amount: number;
  type: string;
  memo: string | null;
  payee: string | null;
  conta_descricao: string;
}

export class ReconciliationService {
  async getUnreconciledTransactions(bankAccountId?: number | null): Promise<UnreconciledTx[]> {
    let where = `WHERE NOT EXISTS (
      SELECT 1 FROM reconciliation_matches rm
      WHERE rm.bank_transaction_id = bt.id AND rm.status = 'confirmed'
    ) AND NOT EXISTS (
      SELECT 1 FROM reconciliation_matches rm2
      WHERE rm2.bank_transaction_id = bt.id AND rm2.status = 'ignored'
    )`;
    const params: (number | string)[] = [];
    if (bankAccountId != null && bankAccountId > 0) {
      where += ' AND bt.bank_account_id = ?';
      params.push(bankAccountId);
    }
    const rows = await query<
      { id: number; bank_account_id: number; fit_id: string; posted_at: string; amount: number; type: string; memo: string | null; payee: string | null; conta_descricao: string }[]
    >(
      `SELECT bt.id, bt.bank_account_id, bt.fit_id, bt.posted_at, bt.amount, bt.type, bt.memo, bt.payee, cb.descricao AS conta_descricao
       FROM bank_transactions bt
       LEFT JOIN contas_bancarias cb ON cb.id = bt.bank_account_id
       ${where}
       ORDER BY bt.posted_at DESC`,
      params
    );
    return Array.isArray(rows) ? rows : [];
  }

  async getSuggestions(
    bankAccountId: number,
    options?: { tolerance?: number; days?: number }
  ): Promise<ReconciliationSuggestion[]> {
    const tolerance = options?.tolerance ?? DEFAULT_TOLERANCE;
    const days = options?.days ?? DEFAULT_DAYS;
    const unreconciled = await this.getUnreconciledTransactions(bankAccountId);
    const results: ReconciliationSuggestion[] = [];
    for (const tx of unreconciled) {
      const txDate = tx.posted_at;
      const minDate = new Date(txDate);
      minDate.setDate(minDate.getDate() - days);
      const maxDate = new Date(txDate);
      maxDate.setDate(maxDate.getDate() + days);
      const minStr = minDate.toISOString().slice(0, 10);
      const maxStr = maxDate.toISOString().slice(0, 10);
      const amount = Number(tx.amount);
      const minVal = amount - tolerance;
      const maxVal = amount + tolerance;
      if (tx.type === 'debit') {
        const payments = await query<
          { id: number; valor_pago: number; data_pagamento: string }[]
        >(
          `SELECT p.id, p.valor_pago, p.data_pagamento
           FROM contas_pagar_pagamentos p
           INNER JOIN contas_pagar cp ON cp.id = p.conta_pagar_id AND cp.ativo = 1
           WHERE p.conta_bancaria_id = ? AND p.data_pagamento BETWEEN ? AND ?
             AND p.valor_pago BETWEEN ? AND ?
             AND NOT EXISTS (SELECT 1 FROM reconciliation_matches rm WHERE rm.payable_payment_id = p.id AND rm.status = 'confirmed')`,
          [bankAccountId, minStr, maxStr, minVal, maxVal]
        );
        for (const pay of Array.isArray(payments) ? payments : []) {
          const score = this.scoreMatch(amount, pay.valor_pago, txDate, pay.data_pagamento);
          const existing = await query<{ n: number }[]>(
            `SELECT 1 AS n FROM reconciliation_matches WHERE bank_transaction_id = ? AND payable_payment_id = ? AND status IN ('suggested', 'confirmed') LIMIT 1`,
            [tx.id, pay.id]
          );
          if (Array.isArray(existing) && existing.length > 0) continue;
          await query(
            `INSERT INTO reconciliation_matches (bank_transaction_id, payable_payment_id, status, score)
             VALUES (?, ?, 'suggested', ?)`,
            [tx.id, pay.id, score]
          );
          const idRows = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
          const matchId = Array.isArray(idRows) && idRows[0] ? idRows[0].id : 0;
          results.push({
            bankTransactionId: tx.id,
            bankTransactionAmount: amount,
            bankTransactionType: tx.type,
            bankTransactionDate: tx.posted_at,
            bankTransactionMemo: tx.memo,
            matchId,
            paymentId: pay.id,
            receiptId: null,
            score,
          });
        }
      } else {
        const receipts = await query<
          { id: number; valor_recebido: number; data_recebimento: string }[]
        >(
          `SELECT r.id, r.valor_recebido, r.data_recebimento
           FROM contas_receber_recebimentos r
           INNER JOIN contas_receber cr ON cr.id = r.conta_receber_id AND cr.ativo = 1
           WHERE r.conta_bancaria_id = ? AND r.data_recebimento BETWEEN ? AND ?
             AND r.valor_recebido BETWEEN ? AND ?
             AND NOT EXISTS (SELECT 1 FROM reconciliation_matches rm WHERE rm.receivable_receipt_id = r.id AND rm.status = 'confirmed')`,
          [bankAccountId, minStr, maxStr, minVal, maxVal]
        );
        for (const rec of Array.isArray(receipts) ? receipts : []) {
          const score = this.scoreMatch(amount, rec.valor_recebido, txDate, rec.data_recebimento);
          const existingRec = await query<{ n: number }[]>(
            `SELECT 1 AS n FROM reconciliation_matches WHERE bank_transaction_id = ? AND receivable_receipt_id = ? AND status IN ('suggested', 'confirmed') LIMIT 1`,
            [tx.id, rec.id]
          );
          if (Array.isArray(existingRec) && existingRec.length > 0) continue;
          await query(
            `INSERT INTO reconciliation_matches (bank_transaction_id, receivable_receipt_id, status, score)
             VALUES (?, ?, 'suggested', ?)`,
            [tx.id, rec.id, score]
          );
          const idRows = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
          const matchId = Array.isArray(idRows) && idRows[0] ? idRows[0].id : 0;
          results.push({
            bankTransactionId: tx.id,
            bankTransactionAmount: amount,
            bankTransactionType: tx.type,
            bankTransactionDate: tx.posted_at,
            bankTransactionMemo: tx.memo,
            matchId,
            paymentId: null,
            receiptId: rec.id,
            score,
          });
        }
      }
    }
    return results;
  }

  private scoreMatch(txAmount: number, payAmount: number, txDate: string, payDate: string): number {
    const valueMatch = Math.abs(txAmount - payAmount) < 0.01 ? 100 : Math.max(0, 100 - Math.abs(txAmount - payAmount));
    const d1 = new Date(txDate).getTime();
    const d2 = new Date(payDate).getTime();
    const diffDays = Math.abs((d1 - d2) / (24 * 60 * 60 * 1000));
    const dateScore = diffDays === 0 ? 100 : Math.max(0, 100 - diffDays * 5);
    return Math.round((valueMatch + dateScore) / 2);
  }

  async listSuggestedMatches(bankAccountId?: number | null): Promise<
    { matchId: number; bankTransactionId: number; amount: number; type: string; postedAt: string; memo: string | null; paymentId: number | null; receiptId: number | null; score: number }[]
  > {
    let where = "WHERE rm.status = 'suggested'";
    const params: (number | string)[] = [];
    if (bankAccountId != null && bankAccountId > 0) {
      where += ' AND bt.bank_account_id = ?';
      params.push(bankAccountId);
    }
    const rows = await query<
      { match_id: number; bank_transaction_id: number; amount: number; type: string; posted_at: string; memo: string | null; payable_payment_id: number | null; receivable_receipt_id: number | null; score: number }[]
    >(
      `SELECT rm.id AS match_id, bt.id AS bank_transaction_id, bt.amount, bt.type, bt.posted_at, bt.memo,
              rm.payable_payment_id, rm.receivable_receipt_id, rm.score
       FROM reconciliation_matches rm
       INNER JOIN bank_transactions bt ON bt.id = rm.bank_transaction_id
       ${where}
       ORDER BY rm.score DESC, bt.posted_at DESC`,
      params
    );
    return (Array.isArray(rows) ? rows : []).map((r) => ({
      matchId: r.match_id,
      bankTransactionId: r.bank_transaction_id,
      amount: Number(r.amount),
      type: r.type,
      postedAt: r.posted_at,
      memo: r.memo,
      paymentId: r.payable_payment_id,
      receiptId: r.receivable_receipt_id,
      score: Number(r.score),
    }));
  }

  async confirmMatch(matchId: number, userId: number): Promise<void> {
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
    await query(
      `UPDATE reconciliation_matches SET status = 'confirmed', confirmed_at = ?, confirmed_by = ? WHERE id = ? AND status = 'suggested'`,
      [now, userId, matchId]
    );
  }

  async rejectMatch(matchId: number, _userId: number): Promise<void> {
    await query(
      `UPDATE reconciliation_matches SET status = 'rejected' WHERE id = ? AND status = 'suggested'`,
      [matchId]
    );
  }

  async ignoreTransaction(bankTransactionId: number): Promise<void> {
    await query(
      `INSERT INTO reconciliation_matches (bank_transaction_id, payable_payment_id, receivable_receipt_id, status)
       VALUES (?, NULL, NULL, 'ignored')`,
      [bankTransactionId]
    );
  }
}
