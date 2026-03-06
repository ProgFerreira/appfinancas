import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import * as partnerFeeRangesRepo from '@/repositories/cotacao/partnerFeeRanges.repo';
import type { FaixaPesoRow, FaixaFreteRow } from '@/repositories/cotacao/partnerFeeRanges.repo';


export const dynamic = 'force-static';
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
    const partnerId = parseInt((await params).id, 10);
    if (Number.isNaN(partnerId) || partnerId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const data = await partnerFeeRangesRepo.getFeeRangesByPartnerId(partnerId);
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('API partners [id] fee-ranges GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao buscar taxas por faixa.' }, { status: 500 });
  }
}

function toNum(v: unknown): number {
  if (v == null || v === '') return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
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
    const partnerId = parseInt((await params).id, 10);
    if (Number.isNaN(partnerId) || partnerId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Body inválido.' }, { status: 400 });
    }
    const b = body as Record<string, unknown>;

    const payload: Parameters<typeof partnerFeeRangesRepo.saveFeeRanges>[1] = {};

    if (b.peso_fracao != null && typeof b.peso_fracao === 'object') {
      const p = b.peso_fracao as Record<string, unknown>;
      payload.peso_fracao = {
        fracao_kg: toNum(p.fracao_kg),
        minimo_fixo: toNum(p.minimo_fixo),
        peso_franquia_kg: toNum(p.peso_franquia_kg),
        excedente_por_fracao: toNum(p.excedente_por_fracao),
      } as Parameters<typeof partnerFeeRangesRepo.saveFeeRanges>[1]['peso_fracao'];
    }
    if (Array.isArray(b.peso_faixas)) {
      payload.peso_faixas = b.peso_faixas.map((r: Record<string, unknown>) => ({
        peso_inicial_kg: toNum(r.peso_inicial_kg),
        peso_final_kg: toNum(r.peso_final_kg),
        tarifa_minima: toNum(r.tarifa_minima),
        peso_franquia_kg: toNum(r.peso_franquia_kg),
        peso_excedente: toNum(r.peso_excedente),
      })) as FaixaPesoRow[];
    }
    if (b.pedagio_fracao != null && typeof b.pedagio_fracao === 'object') {
      const p = b.pedagio_fracao as Record<string, unknown>;
      payload.pedagio_fracao = {
        fracao_kg: toNum(p.fracao_kg),
        minimo_fixo: toNum(p.minimo_fixo),
        peso_franquia_kg: toNum(p.peso_franquia_kg),
        excedente_por_fracao: toNum(p.excedente_por_fracao),
      } as Parameters<typeof partnerFeeRangesRepo.saveFeeRanges>[1]['pedagio_fracao'];
    }
    if (Array.isArray(b.pedagio_faixas)) {
      payload.pedagio_faixas = b.pedagio_faixas.map((r: Record<string, unknown>) => ({
        peso_inicial_kg: toNum(r.peso_inicial_kg),
        peso_final_kg: toNum(r.peso_final_kg),
        tarifa_minima: toNum(r.tarifa_minima),
        peso_franquia_kg: toNum(r.peso_franquia_kg),
        peso_excedente: toNum(r.peso_excedente),
      })) as FaixaPesoRow[];
    }
    if (Array.isArray(b.trt_faixas)) {
      payload.trt_faixas = b.trt_faixas.map((r: Record<string, unknown>) => ({
        frete_inicial: toNum(r.frete_inicial),
        frete_final: toNum(r.frete_final),
        tarifa_minima: toNum(r.tarifa_minima),
        frete_franquia: toNum(r.frete_franquia),
        frete_excedente: toNum(r.frete_excedente),
      })) as FaixaFreteRow[];
    }
    if (Array.isArray(b.tas_faixas)) {
      payload.tas_faixas = b.tas_faixas.map((r: Record<string, unknown>) => ({
        peso_inicial_kg: toNum(r.peso_inicial_kg),
        peso_final_kg: toNum(r.peso_final_kg),
        tarifa_minima: toNum(r.tarifa_minima),
        peso_franquia_kg: toNum(r.peso_franquia_kg),
        peso_excedente: toNum(r.peso_excedente),
      })) as FaixaPesoRow[];
    }
    if (Array.isArray(b.tde_faixas)) {
      payload.tde_faixas = b.tde_faixas.map((r: Record<string, unknown>) => ({
        frete_inicial: toNum(r.frete_inicial),
        frete_final: toNum(r.frete_final),
        tarifa_minima: toNum(r.tarifa_minima),
        frete_franquia: toNum(r.frete_franquia),
        frete_excedente: toNum(r.frete_excedente),
      })) as FaixaFreteRow[];
    }
    if (Array.isArray(b.tde_peso_faixas)) {
      payload.tde_peso_faixas = b.tde_peso_faixas.map((r: Record<string, unknown>) => ({
        peso_inicial_kg: toNum(r.peso_inicial_kg),
        peso_final_kg: toNum(r.peso_final_kg),
        tarifa_minima: toNum(r.tarifa_minima),
        peso_franquia_kg: toNum(r.peso_franquia_kg),
        peso_excedente: toNum(r.peso_excedente),
      })) as FaixaPesoRow[];
    }
    const mapNF = (r: Record<string, unknown>) => ({
      valor_inicial: toNum(r.valor_inicial),
      valor_final: toNum(r.valor_final),
      minimo_fixo: toNum(r.minimo_fixo),
      franquia_desconto: toNum(r.franquia_desconto),
      nf_excedente: toNum(r.nf_excedente),
    });
    const mapPesoNF = (r: Record<string, unknown>) => ({
      peso_inicial_kg: toNum(r.peso_inicial_kg),
      peso_final_kg: toNum(r.peso_final_kg),
      minimo_fixo: toNum(r.minimo_fixo),
      peso_franquia_kg: toNum(r.peso_franquia_kg),
      nf_excedente: toNum(r.nf_excedente),
    });
    if (Array.isArray(b.advalorem_nf_faixas)) payload.advalorem_nf_faixas = b.advalorem_nf_faixas.map((r: Record<string, unknown>) => mapNF(r));
    if (Array.isArray(b.advalorem_peso_faixas)) payload.advalorem_peso_faixas = b.advalorem_peso_faixas.map((r: Record<string, unknown>) => mapPesoNF(r));
    if (Array.isArray(b.advalorem_carga_faixas)) payload.advalorem_carga_faixas = b.advalorem_carga_faixas.map((r: Record<string, unknown>) => mapNF(r));
    if (Array.isArray(b.gris_nf_faixas)) payload.gris_nf_faixas = b.gris_nf_faixas.map((r: Record<string, unknown>) => mapNF(r));
    if (Array.isArray(b.gris_peso_faixas)) payload.gris_peso_faixas = b.gris_peso_faixas.map((r: Record<string, unknown>) => mapPesoNF(r));
    if (Array.isArray(b.despacho_faixas)) {
      payload.despacho_faixas = b.despacho_faixas.map((r: Record<string, unknown>) => ({
        peso_inicial_kg: toNum(r.peso_inicial_kg),
        peso_final_kg: toNum(r.peso_final_kg),
        tarifa_minima: toNum(r.tarifa_minima),
        peso_franquia_kg: toNum(r.peso_franquia_kg),
        peso_excedente: toNum(r.peso_excedente),
      })) as FaixaPesoRow[];
    }
    if (Array.isArray(b.despacho_nf_faixas)) {
      payload.despacho_nf_faixas = b.despacho_nf_faixas.map((r: Record<string, unknown>) => ({
        valor_inicial: toNum(r.valor_inicial),
        valor_final: toNum(r.valor_final),
        tarifa_minima: toNum(r.tarifa_minima),
        franquia_desconto: toNum(r.franquia_desconto),
        nf_excedente: toNum(r.nf_excedente),
      }));
    }

    await partnerFeeRangesRepo.saveFeeRanges(partnerId, payload);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API partners [id] fee-ranges POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao salvar taxas por faixa.' }, { status: 500 });
  }
}
