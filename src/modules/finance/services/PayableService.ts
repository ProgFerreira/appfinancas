import { query } from '@/lib/db';
import { PayableRepository } from '../repositories/PayableRepository';
import { LedgerService } from './LedgerService';
import { AuditService } from './AuditService';
import type { CreatePaymentInput } from '../validators/payable';

export class PayableService {
  private payableRepo = new PayableRepository();
  private ledgerService = new LedgerService();
  private auditService = new AuditService();

  /**
   * Default competence = first day of data_emissao month.
   */
  static defaultCompetence(dataEmissao: string): string {
    const d = new Date(dataEmissao + 'T12:00:00');
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  }

  /**
   * Register payment for a payable title; update status; optionally write ledger.
   */
  async registerPayment(
    contaPagarId: number,
    input: CreatePaymentInput,
    userId: number
  ): Promise<{ paymentId: number; situacao: string }> {
    const title = await this.payableRepo.getById(contaPagarId);
    if (!title) throw new Error('Conta a pagar não encontrada.');

    const totalPaid = await this.payableRepo.sumPayments(contaPagarId);
    const newTotal = totalPaid + input.valor_pago;
    const situacao = newTotal >= title.valor ? 'pago' : 'parcial';

    await query(
      `INSERT INTO contas_pagar_pagamentos (conta_pagar_id, data_pagamento, valor_pago, conta_bancaria_id, observacoes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        contaPagarId,
        input.data_pagamento,
        input.valor_pago,
        input.conta_bancaria_id ?? null,
        input.observacoes ?? null,
      ]
    );
    const idRows = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const paymentId = Array.isArray(idRows) && idRows[0] ? Number(idRows[0].id) : 0;

    await this.payableRepo.updateSituacao(contaPagarId, situacao);

    try {
      await this.auditService.log({
        userId,
        action: 'payment_register',
        entityType: 'contas_pagar_pagamentos',
        entityId: paymentId,
        newValues: { conta_pagar_id: contaPagarId, valor_pago: input.valor_pago, data_pagamento: input.data_pagamento },
      });
    } catch (auditErr) {
      console.warn('Audit log failed (table audit_logs may not exist):', auditErr);
    }

    const competenceDate = title.data_competencia ?? PayableService.defaultCompetence(title.data_emissao);
    const planoContasId = title.plano_contas_id ?? 0;
    if (planoContasId > 0) {
      try {
        await this.ledgerService.registerPaymentAp({
          payablePaymentId: paymentId,
          contaBancariaId: input.conta_bancaria_id ?? title.conta_bancaria_id,
          planoContasId,
          valor: input.valor_pago,
          competenceDate,
          occurredAt: input.data_pagamento + 'T12:00:00',
          metadata: { user_id: userId },
        });
      } catch (ledgerErr) {
        console.warn('Ledger entry failed (table ledger_entries may not exist):', ledgerErr);
      }
    }

    return { paymentId, situacao };
  }
}
