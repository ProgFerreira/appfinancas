import { query } from '@/lib/db';
import { ReceivableRepository } from '../repositories/ReceivableRepository';
import { LedgerService } from './LedgerService';
import { AuditService } from './AuditService';
import type { CreateReceiptInput } from '../validators/receivable';

export class ReceivableService {
  private receivableRepo = new ReceivableRepository();
  private ledgerService = new LedgerService();
  private auditService = new AuditService();

  static defaultCompetence(dataEmissao: string): string {
    const d = new Date(dataEmissao + 'T12:00:00');
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  }

  async registerReceipt(
    contaReceberId: number,
    input: CreateReceiptInput,
    userId: number
  ): Promise<{ receiptId: number; situacao: string }> {
    const title = await this.receivableRepo.getById(contaReceberId);
    if (!title) throw new Error('Conta a receber não encontrada.');

    const totalReceived = await this.receivableRepo.sumReceipts(contaReceberId);
    const newTotal = totalReceived + input.valor_recebido;
    const situacao = newTotal >= title.valor ? 'recebido' : 'parcial';

    await query(
      `INSERT INTO contas_receber_recebimentos (conta_receber_id, data_recebimento, valor_recebido, desconto, forma_pagamento, conta_bancaria_id, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        contaReceberId,
        input.data_recebimento,
        input.valor_recebido,
        input.desconto ?? 0,
        input.forma_pagamento ?? null,
        input.conta_bancaria_id ?? null,
        input.observacoes ?? null,
      ]
    );
    const idRows = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const receiptId = Array.isArray(idRows) && idRows[0] ? Number(idRows[0].id) : 0;

    await this.receivableRepo.updateSituacao(contaReceberId, situacao);

    try {
      await this.auditService.log({
        userId,
        action: 'receipt_register',
        entityType: 'contas_receber_recebimentos',
        entityId: receiptId,
        newValues: { conta_receber_id: contaReceberId, valor_recebido: input.valor_recebido, data_recebimento: input.data_recebimento },
      });
    } catch (auditErr) {
      console.warn('Audit log failed (table audit_logs may not exist):', auditErr);
    }

    const competenceDate = title.data_competencia ?? ReceivableService.defaultCompetence(title.data_emissao);
    const planoContasId = title.plano_contas_id ?? 0;
    if (planoContasId > 0) {
      try {
        await this.ledgerService.registerReceiptAr({
          receivableReceiptId: receiptId,
          contaBancariaId: input.conta_bancaria_id ?? title.conta_bancaria_id,
          planoContasId,
          valor: input.valor_recebido,
          competenceDate,
          occurredAt: input.data_recebimento + 'T12:00:00',
          metadata: { user_id: userId },
        });
      } catch (ledgerErr) {
        console.warn('Ledger entry failed (table ledger_entries may not exist):', ledgerErr);
      }
    }

    return { receiptId, situacao };
  }
}
