import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


export const dynamic = 'force-dynamic';
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: '0' }];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const contaPagarId = parseInt(id, 10);
    if (!Number.isInteger(contaPagarId) || contaPagarId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const rows = await query(
      `SELECT p.id, p.conta_pagar_id, p.data_pagamento, p.valor_pago, p.conta_bancaria_id, p.observacoes, cb.descricao AS conta_descricao
       FROM contas_pagar_pagamentos p
       LEFT JOIN contas_bancarias cb ON cb.id = p.conta_bancaria_id
       WHERE p.conta_pagar_id = ? ORDER BY p.data_pagamento DESC, p.id DESC`,
      [contaPagarId]
    );
    return NextResponse.json({ success: true, data: Array.isArray(rows) ? rows : [] });
  } catch (e) {
    console.error('API contas-pagar pagamentos GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar pagamentos.' }, { status: 500 });
  }
}
