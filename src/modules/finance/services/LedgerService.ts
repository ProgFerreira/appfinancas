import { LedgerRepository } from '../repositories/LedgerRepository';

export class LedgerService {
  private repo = new LedgerRepository();

  /**
   * Register ledger entries for an AP payment.
   * Debit: bank account, Credit: expense/cost account (plano_contas).
   */
  async registerPaymentAp(params: {
    payablePaymentId: number;
    contaBancariaId: number | null;
    planoContasId: number;
    valor: number;
    competenceDate: string;
    occurredAt: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const meta = params.metadata ? JSON.stringify(params.metadata) : null;
    if (params.contaBancariaId != null) {
      await this.repo.insert({
        event_type: 'payment_ap',
        entity_type: 'payable_payment',
        entity_id: params.payablePaymentId,
        account_type: 'bank',
        account_id: params.contaBancariaId,
        debit: params.valor,
        credit: 0,
        competence_date: params.competenceDate,
        occurred_at: params.occurredAt,
        metadata_json: meta,
      });
    }
    await this.repo.insert({
      event_type: 'payment_ap',
      entity_type: 'payable_payment',
      entity_id: params.payablePaymentId,
      account_type: 'plano_contas',
      account_id: params.planoContasId,
      debit: 0,
      credit: params.valor,
      competence_date: params.competenceDate,
      occurred_at: params.occurredAt,
      metadata_json: meta,
    });
  }

  /**
   * Register ledger entries for an AR receipt.
   * Debit: bank account, Credit: revenue account (plano_contas).
   */
  async registerReceiptAr(params: {
    receivableReceiptId: number;
    contaBancariaId: number | null;
    planoContasId: number;
    valor: number;
    competenceDate: string;
    occurredAt: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const meta = params.metadata ? JSON.stringify(params.metadata) : null;
    if (params.contaBancariaId != null) {
      await this.repo.insert({
        event_type: 'receipt_ar',
        entity_type: 'receivable_receipt',
        entity_id: params.receivableReceiptId,
        account_type: 'bank',
        account_id: params.contaBancariaId,
        debit: params.valor,
        credit: 0,
        competence_date: params.competenceDate,
        occurred_at: params.occurredAt,
        metadata_json: meta,
      });
    }
    await this.repo.insert({
      event_type: 'receipt_ar',
      entity_type: 'receivable_receipt',
      entity_id: params.receivableReceiptId,
      account_type: 'plano_contas',
      account_id: params.planoContasId,
      debit: 0,
      credit: params.valor,
      competence_date: params.competenceDate,
      occurred_at: params.occurredAt,
      metadata_json: meta,
    });
  }
}
