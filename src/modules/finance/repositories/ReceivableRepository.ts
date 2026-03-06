import { query } from '@/lib/db';

export interface ContaReceberRow {
  id: number;
  valor: number;
  data_emissao: string;
  data_competencia?: string | null;
  plano_contas_id: number | null;
  categoria_receita_id: number | null;
  conta_bancaria_id: number | null;
  situacao: string;
}

export class ReceivableRepository {
  async getById(id: number): Promise<ContaReceberRow | null> {
    const rows = await query<ContaReceberRow[]>(
      `SELECT id, valor, data_emissao, plano_contas_id, categoria_receita_id, conta_bancaria_id, situacao
       FROM contas_receber WHERE id = ? AND ativo = 1 LIMIT 1`,
      [id]
    );
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  }

  async sumReceipts(contaReceberId: number): Promise<number> {
    const rows = await query<{ total: number }[]>(
      'SELECT COALESCE(SUM(valor_recebido), 0) AS total FROM contas_receber_recebimentos WHERE conta_receber_id = ?',
      [contaReceberId]
    );
    return Array.isArray(rows) && rows[0] ? Number(rows[0].total) : 0;
  }

  async updateSituacao(id: number, situacao: string): Promise<void> {
    await query('UPDATE contas_receber SET situacao = ?, updated_at = NOW() WHERE id = ?', [
      situacao,
      id,
    ]);
  }
}
