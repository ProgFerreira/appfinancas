import { z } from 'zod';

export const createPayableTitleSchema = z.object({
  fornecedor_id: z.number().int().min(0).nullable(),
  descricao: z.string().max(180).nullable(),
  categoria_id: z.number().int().min(1),
  plano_contas_id: z.number().int().min(1).nullable(),
  centro_custo_id: z.number().int().min(1).nullable(),
  valor: z.number().positive(),
  data_emissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  data_vencimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  data_competencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  conta_bancaria_id: z.number().int().min(1).nullable().optional(),
  forma_pagamento: z.string().max(30).nullable().optional(),
  tipo_custo: z.enum(['variavel', 'fixo']).optional(),
  observacoes: z.string().nullable().optional(),
  origem: z.string().max(40).nullable().optional(),
  cte_id: z.number().int().min(1).nullable().optional(),
});

export const createPaymentSchema = z.object({
  data_pagamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  valor_pago: z.number().positive(),
  conta_bancaria_id: z.number().int().min(1).nullable().optional(),
  observacoes: z.string().nullable().optional(),
});

export type CreatePayableTitleInput = z.infer<typeof createPayableTitleSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
