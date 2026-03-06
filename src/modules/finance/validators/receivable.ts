import { z } from 'zod';

export const createReceivableTitleSchema = z.object({
  cliente_id: z.number().int().min(1),
  categoria_receita_id: z.number().int().min(1).nullable().optional(),
  plano_contas_id: z.number().int().min(1).nullable().optional(),
  descricao: z.string().max(180).nullable().optional(),
  valor: z.number().positive(),
  data_emissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  data_vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  data_competencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  conta_bancaria_id: z.number().int().min(1).nullable().optional(),
  observacoes: z.string().nullable().optional(),
  cte_id: z.number().int().min(1).nullable().optional(),
});

export const createReceiptSchema = z.object({
  data_recebimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valor_recebido: z.number().positive(),
  desconto: z.number().min(0).optional(),
  forma_pagamento: z.string().max(30).nullable().optional(),
  conta_bancaria_id: z.number().int().min(1).nullable().optional(),
  observacoes: z.string().nullable().optional(),
});

export type CreateReceivableTitleInput = z.infer<typeof createReceivableTitleSchema>;
export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
