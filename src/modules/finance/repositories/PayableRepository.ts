import { query } from '@/lib/db';

export interface ContaPagarRow {
  id: number;
  valor: number;
  data_emissao: string;
  data_competencia?: string | null;
  plano_contas_id: number | null;
  categoria_id: number;
  conta_bancaria_id: number | null;
  situacao: string;
}

export class PayableRepository {
  async getById(id: number): Promise<ContaPagarRow | null> {
    const rows = await query<ContaPagarRow[]>(
      `SELECT id, valor, data_emissao, plano_contas_id, categoria_id, conta_bancaria_id, situacao
       FROM contas_pagar WHERE id = ? AND ativo = 1 LIMIT 1`,
      [id]
    );
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  }

  async sumPayments(contaPagarId: number): Promise<number> {
    const rows = await query<{ total: number }[]>(
      'SELECT COALESCE(SUM(valor_pago), 0) AS total FROM contas_pagar_pagamentos WHERE conta_pagar_id = ?',
      [contaPagarId]
    );
    return Array.isArray(rows) && rows[0] ? Number(rows[0].total) : 0;
  }

  async updateSituacao(id: number, situacao: string): Promise<void> {
    await query('UPDATE contas_pagar SET situacao = ?, updated_at = NOW() WHERE id = ?', [
      situacao,
      id,
    ]);
  }
}
