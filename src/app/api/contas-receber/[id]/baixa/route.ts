import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { createReceiptSchema } from '@/modules/finance/validators/receivable';
import { ReceivableService } from '@/modules/finance/services/ReceivableService';

/** Registra baixa (recebimento) de uma conta a receber. Usa ReceivableService (ledger + auditoria). */

export const dynamic = 'force-dynamic';
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: '0' }];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = createReceiptSchema.safeParse({
      data_recebimento: body.data_recebimento,
      valor_recebido: body.valor_recebido,
      desconto: body.desconto ?? 0,
      forma_pagamento: body.forma_pagamento ?? null,
      conta_bancaria_id: body.conta_bancaria_id ?? null,
      observacoes: body.observacoes ?? null,
    });
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { success: false, error: 'Dados inválidos.', errors: msg },
        { status: 400 }
      );
    }

    const receivableService = new ReceivableService();
    const result = await receivableService.registerReceipt(idNum, parsed.data, userId);
    return NextResponse.json({ success: true, data: { situacao: result.situacao, receiptId: result.receiptId } });
  } catch (e) {
    console.error('API contas-receber baixa:', e);
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('não encontrada')) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao registrar recebimento.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
