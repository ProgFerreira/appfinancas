import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import * as quoteRepo from '@/repositories/cotacao/quote.repo';
import { calculateOptions } from '@/services/cotacao/QuoteCalculationService';

/** Fator de cubagem rodoviário (kg por m³). Dimensões em cm. */
const FATOR_CUBAGEM_RODOVIARIO = 300;
const FATOR_CUBAGEM_AEREO = 166.7;

function parseVolume(v: unknown): { quantidade: number; altura_cm: number; largura_cm: number; comprimento_cm: number; peso_kg: number } | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const quantidade = Math.max(1, Math.floor(Number(o.quantidade) || 1));
  const altura_cm = Number(o.altura_cm) || 0;
  const largura_cm = Number(o.largura_cm) || 0;
  const comprimento_cm = Number(o.comprimento_cm) || 0;
  const peso_kg = Number(o.peso_kg) || 0;
  if ((altura_cm <= 0 || largura_cm <= 0 || comprimento_cm <= 0) && peso_kg <= 0) return null;
  return { quantidade, altura_cm, largura_cm, comprimento_cm, peso_kg };
}


export const dynamic = 'force-static';

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Payload inválido.' }, { status: 400 });
    }
    const b = body as Record<string, unknown>;
    const valor_nf = Number(b.valor_nf) || 0;
    const tipo_carga = typeof b.tipo_carga === 'string' ? b.tipo_carga.trim() || undefined : undefined;

    const origem_uf = typeof b.origem_uf === 'string' ? b.origem_uf.trim().toUpperCase().slice(0, 2) : '';
    const origem_cidade = typeof b.origem_cidade === 'string' ? b.origem_cidade.trim() : '';
    const destino_uf = typeof b.destino_uf === 'string' ? b.destino_uf.trim().toUpperCase().slice(0, 2) : '';
    const destino_cidade = typeof b.destino_cidade === 'string' ? b.destino_cidade.trim() : '';

    const useCity = origem_uf && origem_cidade && destino_uf && destino_cidade;
    if (!useCity) {
      return NextResponse.json({ success: false, error: 'Origem e destino (UF e cidade) são obrigatórios.' }, { status: 400 });
    }

    const volumesRaw = Array.isArray(b.volumes) ? b.volumes : [];
    const volumes: { quantidade: number; altura_cm: number; largura_cm: number; comprimento_cm: number; peso_kg: number }[] = [];
    for (const v of volumesRaw) {
      const parsed = parseVolume(v);
      if (parsed) volumes.push(parsed);
    }

    let peso_real_kg = Number(b.peso_real_kg) || 0;
    let peso_cubado_kg = Number(b.peso_cubado_kg) || 0;
    if (volumes.length > 0) {
      peso_real_kg = volumes.reduce((s, v) => s + v.quantidade * v.peso_kg, 0);
      peso_cubado_kg = volumes.reduce((s, v) => {
        const cubagem = (v.altura_cm * v.largura_cm * v.comprimento_cm) / (FATOR_CUBAGEM_RODOVIARIO * 1000);
        return s + v.quantidade * cubagem;
      }, 0);
    }
    const peso_tarifavel_kg = Math.max(peso_real_kg, peso_cubado_kg);

    if (peso_tarifavel_kg <= 0) {
      return NextResponse.json({ success: false, error: 'Informe ao menos um volume com peso ou dimensões.' }, { status: 400 });
    }

    const servico_ar = !!(b.servico_ar === true || b.servico_ar === 1 || b.servico_ar === '1');
    const servico_mao_propria = !!(b.servico_mao_propria === true || b.servico_mao_propria === 1 || b.servico_mao_propria === '1');
    const servico_coleta = !!(b.servico_coleta === true || b.servico_coleta === 1 || b.servico_coleta === '1');
    const servico_entrega = !!(b.servico_entrega === true || b.servico_entrega === 1 || b.servico_entrega === '1');
    const servico_seguro = !!(b.servico_seguro === true || b.servico_seguro === 1 || b.servico_seguro === '1');

    const quoteId = await quoteRepo.createQuote({
      origem_cep: '00000000',
      destino_cep: '00000000',
      origem_uf: origem_uf || null,
      origem_cidade: origem_cidade || null,
      destino_uf: destino_uf || null,
      destino_cidade: destino_cidade || null,
      tipo_carga: tipo_carga ?? null,
      valor_nf: valor_nf,
      peso_real_kg,
      peso_cubado_kg,
      peso_tarifavel_kg,
      servico_ar: servico_ar ? 1 : 0,
      servico_mao_propria: servico_mao_propria ? 1 : 0,
      servico_coleta: servico_coleta ? 1 : 0,
      servico_entrega: servico_entrega ? 1 : 0,
      servico_seguro: servico_seguro ? 1 : 0,
      created_by: userId,
    });

    if (volumes.length > 0) {
      const items = volumes.flatMap((v) =>
        Array.from({ length: v.quantidade }, () => ({
          quantidade: 1,
          altura_cm: v.altura_cm,
          largura_cm: v.largura_cm,
          comprimento_cm: v.comprimento_cm,
          peso_kg: v.peso_kg,
        }))
      );
      await quoteRepo.createQuoteItems(quoteId, items);
    }

    const options = await calculateOptions({
      origem_uf,
      origem_cidade,
      destino_uf,
      destino_cidade,
      tipo_carga: tipo_carga ?? undefined,
      valor_nf: valor_nf,
      peso_real_kg,
      peso_cubado_kg,
      peso_tarifavel_kg,
      servico_ar: servico_ar,
      servico_mao_propria: servico_mao_propria,
      servico_coleta: servico_coleta,
      servico_entrega: servico_entrega,
      servico_seguro: servico_seguro,
    });

    const sortBy = typeof b.sort === 'string' ? b.sort : 'preco';
    if (sortBy === 'prazo') {
      options.sort((a, b) => a.prazo_dias - b.prazo_dias || a.preco_final - b.preco_final);
    } else if (sortBy === 'custo_beneficio') {
      options.sort((a, b) => {
        const scoreA = a.prazo_dias > 0 ? a.preco_final / a.prazo_dias : a.preco_final;
        const scoreB = b.prazo_dias > 0 ? b.preco_final / b.prazo_dias : b.preco_final;
        return scoreA - scoreB;
      });
    } else {
      options.sort((a, b) => a.preco_final - b.preco_final);
    }

    return NextResponse.json({
      success: true,
      data: {
        quote_id: quoteId,
        options,
        peso_real_kg,
        peso_cubado_kg,
        peso_tarifavel_kg,
      },
    });
  } catch (e) {
    console.error('API quotes/calc POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao calcular cotação.' }, { status: 500 });
  }
}
