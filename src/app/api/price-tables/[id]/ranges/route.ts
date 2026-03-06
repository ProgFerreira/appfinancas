import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import * as priceTableRepo from '@/repositories/cotacao/priceTable.repo';


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
    const list = await priceTableRepo.findRangesByPriceTableId(priceTableId);
    return NextResponse.json({ success: true, data: list });
  } catch (e) {
    console.error('API price-tables ranges GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao listar faixas.' }, { status: 500 });
  }
}

function validateRangeBody(body: unknown): { peso_inicial_kg: number; peso_final_kg: number; valor_base: number; valor_excedente_por_kg: number | null; prazo_dias: number } | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const peso_inicial_kg = Number(b.peso_inicial_kg);
  const peso_final_kg = Number(b.peso_final_kg);
  const valor_base = Number(b.valor_base);
  const prazo_dias = Math.max(1, Math.floor(Number(b.prazo_dias) || 1));
  if (Number.isNaN(peso_inicial_kg) || Number.isNaN(peso_final_kg) || peso_final_kg <= peso_inicial_kg || Number.isNaN(valor_base) || valor_base < 0) return null;
  const valor_excedente_por_kg = b.valor_excedente_por_kg != null ? Number(b.valor_excedente_por_kg) : null;
  return { peso_inicial_kg, peso_final_kg, valor_base, valor_excedente_por_kg: Number.isNaN(Number(valor_excedente_por_kg)) ? null : valor_excedente_por_kg, prazo_dias };
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
    const data = validateRangeBody(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Dados inválidos (peso inicial/final, valor base, prazo).' }, { status: 400 });
    }
    const id = await priceTableRepo.createRange({ price_table_id: priceTableId, ...data });
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    console.error('API price-tables ranges POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao criar faixa.' }, { status: 500 });
  }
}
