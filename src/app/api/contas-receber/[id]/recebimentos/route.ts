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
    const contaReceberId = parseInt(id, 10);
    if (!Number.isInteger(contaReceberId) || contaReceberId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const rows = await query<
      { id: number; conta_receber_id: number; data_recebimento: string; valor_recebido: number; desconto: number; forma_pagamento: string | null; conta_bancaria_id: number | null; observacoes: string | null; conta_descricao: string | null }[]
    >(
      `SELECT r.id, r.conta_receber_id, r.data_recebimento, r.valor_recebido, r.desconto, r.forma_pagamento, r.conta_bancaria_id, r.observacoes, cb.descricao AS conta_descricao
       FROM contas_receber_recebimentos r
       LEFT JOIN contas_bancarias cb ON cb.id = r.conta_bancaria_id
       WHERE r.conta_receber_id = ? ORDER BY r.data_recebimento DESC, r.id DESC`,
      [contaReceberId]
    );
    return NextResponse.json({ success: true, data: Array.isArray(rows) ? rows : [] });
  } catch (e) {
    console.error('API contas-receber recebimentos GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar recebimentos.' }, { status: 500 });
  }
}
