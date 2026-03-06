import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { createPaymentSchema } from '@/modules/finance/validators/payable';
import { PayableService } from '@/modules/finance/services/PayableService';

/** Registra baixa (pagamento) de uma conta a pagar. Usa PayableService (ledger + auditoria). */

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
    const parsed = createPaymentSchema.safeParse({
      data_pagamento: body.data_pagamento,
      valor_pago: body.valor_pago,
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

    const payableService = new PayableService();
    const result = await payableService.registerPayment(idNum, parsed.data, userId);
    return NextResponse.json({ success: true, data: { situacao: result.situacao, paymentId: result.paymentId } });
  } catch (e) {
    console.error('API contas-pagar baixa:', e);
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('não encontrada')) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao registrar pagamento.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
