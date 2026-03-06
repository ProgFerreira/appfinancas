import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import * as quoteRepo from '@/repositories/cotacao/quote.repo';


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
    const quoteId = parseInt((await params).id, 10);
    if (Number.isNaN(quoteId) || quoteId < 1) {
      return NextResponse.json({ success: false, error: 'ID da cotação inválido' }, { status: 400 });
    }
    const quote = await quoteRepo.findQuoteById(quoteId);
    if (!quote) {
      return NextResponse.json({ success: false, error: 'Cotação não encontrada' }, { status: 404 });
    }
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Payload inválido.' }, { status: 400 });
    }
    const b = body as Record<string, unknown>;
    const partner_id = parseInt(String(b.partner_id ?? 0), 10);
    const preco_final = Number(b.preco_final);
    const prazo_dias = Math.max(1, Math.floor(Number(b.prazo_dias) || 1));
    const breakdown_json = (b.breakdown_json != null && typeof b.breakdown_json === 'object') ? (b.breakdown_json as Record<string, unknown>) : null;

    if (!Number.isInteger(partner_id) || partner_id < 1 || Number.isNaN(preco_final) || preco_final < 0) {
      return NextResponse.json({ success: false, error: 'partner_id, preco_final e prazo_dias são obrigatórios.' }, { status: 400 });
    }

    const selectionId = await quoteRepo.createSelection({
      quote_id: quoteId,
      partner_id,
      preco_final,
      prazo_dias,
      breakdown_json,
      status: 'selecionada',
    });

    return NextResponse.json({ success: true, data: { id: selectionId } });
  } catch (e) {
    console.error('API quotes select POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao salvar seleção.' }, { status: 500 });
  }
}
