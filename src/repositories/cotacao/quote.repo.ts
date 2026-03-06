import { getConnection, query } from '@/lib/db';
import type { CotacaoQuote } from '@/types';

export async function createQuote(data: {
  origem_cep: string;
  destino_cep: string;
  origem_uf: string | null;
  origem_cidade: string | null;
  destino_uf: string | null;
  destino_cidade: string | null;
  tipo_carga: string | null;
  valor_nf: number;
  peso_real_kg: number;
  peso_cubado_kg: number;
  peso_tarifavel_kg: number;
  servico_ar: number;
  servico_mao_propria: number;
  servico_coleta: number;
  servico_entrega: number;
  servico_seguro: number;
  created_by: number | null;
}): Promise<number> {
  const conn = await getConnection();
  try {
    const [rows] = await conn.execute(
      `INSERT INTO cotacao_quotes (origem_cep, destino_cep, origem_uf, origem_cidade, destino_uf, destino_cidade, tipo_carga, valor_nf, peso_real_kg, peso_cubado_kg, peso_tarifavel_kg, servico_ar, servico_mao_propria, servico_coleta, servico_entrega, servico_seguro, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.origem_cep,
        data.destino_cep,
        data.origem_uf,
        data.origem_cidade,
        data.destino_uf,
        data.destino_cidade,
        data.tipo_carga,
        data.valor_nf,
        data.peso_real_kg,
        data.peso_cubado_kg,
        data.peso_tarifavel_kg,
        data.servico_ar,
        data.servico_mao_propria,
        data.servico_coleta,
        data.servico_entrega,
        data.servico_seguro,
        data.created_by,
      ]
    );
    const r = rows as unknown as { insertId?: number };
    return r?.insertId ?? 0;
  } finally {
    conn.release();
  }
}

export async function createQuoteItems(quoteId: number, items: { quantidade: number; altura_cm: number; largura_cm: number; comprimento_cm: number; peso_kg: number }[]): Promise<void> {
  const conn = await getConnection();
  try {
    for (const item of items) {
      await conn.execute(
        `INSERT INTO cotacao_quote_items (quote_id, quantidade, altura_cm, largura_cm, comprimento_cm, peso_kg) VALUES (?, ?, ?, ?, ?, ?)`,
        [quoteId, item.quantidade, item.altura_cm, item.largura_cm, item.comprimento_cm, item.peso_kg]
      );
    }
  } finally {
    conn.release();
  }
}

export async function findQuoteById(id: number): Promise<CotacaoQuote | null> {
  const rows = await query<CotacaoQuote[]>(
    `SELECT id, origem_cep, destino_cep, origem_uf, origem_cidade, destino_uf, destino_cidade, tipo_carga, valor_nf, peso_real_kg, peso_cubado_kg, peso_tarifavel_kg, servico_ar, servico_mao_propria, servico_coleta, servico_entrega, servico_seguro, created_by, created_at, updated_at FROM cotacao_quotes WHERE id = ? LIMIT 1`,
    [id]
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export async function createSelection(data: {
  quote_id: number;
  partner_id: number;
  preco_final: number;
  prazo_dias: number;
  breakdown_json: Record<string, unknown> | null;
  status?: string;
}): Promise<number> {
  const result = await query<{ insertId: number }>(
    `INSERT INTO cotacao_quote_selections (quote_id, partner_id, preco_final, prazo_dias, breakdown_json, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [data.quote_id, data.partner_id, data.preco_final, data.prazo_dias, data.breakdown_json ? JSON.stringify(data.breakdown_json) : null, data.status ?? 'selecionada']
  );
  const r = result as unknown as { insertId?: number };
  return r?.insertId ?? 0;
}
