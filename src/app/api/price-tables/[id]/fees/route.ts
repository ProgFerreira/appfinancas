import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import * as priceTableFeesRepo from '@/repositories/cotacao/priceTableFees.repo';


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
    const priceTableId = parseInt((await params).id, 10);
    if (Number.isNaN(priceTableId) || priceTableId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const fees = await priceTableFeesRepo.findByPriceTableId(priceTableId);
    return NextResponse.json({ success: true, data: fees });
  } catch (e) {
    console.error('API price-tables [id] fees GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao buscar taxas do trecho.' }, { status: 500 });
  }
}

function parseNum(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
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
    const priceTableId = parseInt((await params).id, 10);
    if (Number.isNaN(priceTableId) || priceTableId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Body inválido.' }, { status: 400 });
    }
    const b = body as Record<string, unknown>;
    await priceTableFeesRepo.upsert({
      price_table_id: priceTableId,
      gris_percent: parseNum(b.gris_percent),
      advalorem_percent: parseNum(b.advalorem_percent),
      tde_fixo: parseNum(b.tde_fixo),
      tde_percent: parseNum(b.tde_percent),
      trt_fixo: parseNum(b.trt_fixo),
      tda_fixo: parseNum(b.tda_fixo),
      pedagio_fixo: parseNum(b.pedagio_fixo),
      seguro_minimo: parseNum(b.seguro_minimo),
      seguro_percent: parseNum(b.seguro_percent),
      coleta_fixo: parseNum(b.coleta_fixo),
      entrega_fixo: parseNum(b.entrega_fixo),
      fator_cubagem_rodoviario: parseNum(b.fator_cubagem_rodoviario) ?? 300,
      fator_cubagem_aereo: parseNum(b.fator_cubagem_aereo) ?? 166.7,
      peso_minimo_tarifavel_kg: parseNum(b.peso_minimo_tarifavel_kg),
      arredondar_peso_cima: b.arredondar_peso_cima === 0 || b.arredondar_peso_cima === '0' ? 0 : 1,
      prazo_rodoviario_dias: parseNum(b.prazo_rodoviario_dias),
      prazo_aereo_dias: parseNum(b.prazo_aereo_dias),
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API price-tables [id] fees POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao salvar taxas do trecho.' }, { status: 500 });
  }
}
