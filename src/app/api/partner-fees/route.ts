import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import * as partnerFeesRepo from '@/repositories/cotacao/partnerFees.repo';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const partnerId = parseInt(searchParams.get('partner_id') ?? '0', 10);
    if (!Number.isInteger(partnerId) || partnerId < 1) {
      return NextResponse.json({ success: false, error: 'partner_id é obrigatório.' }, { status: 400 });
    }
    const fees = await partnerFeesRepo.findByPartnerId(partnerId);
    return NextResponse.json({ success: true, data: fees });
  } catch (e) {
    console.error('API partner-fees GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao buscar taxas.' }, { status: 500 });
  }
}

function parseNum(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Body inválido.' }, { status: 400 });
    }
    const b = body as Record<string, unknown>;
    const partner_id = parseInt(String(b.partner_id ?? 0), 10);
    if (!Number.isInteger(partner_id) || partner_id < 1) {
      return NextResponse.json({ success: false, error: 'partner_id é obrigatório.' }, { status: 400 });
    }
    await partnerFeesRepo.upsert({
      partner_id,
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
      lib_suframa: parseNum(b.lib_suframa) ?? 0,
      minimo_trecho: parseNum(b.minimo_trecho) ?? 0,
      tde_geral: parseNum(b.tde_geral) ?? 0,
      reentrega_percent: parseNum(b.reentrega_percent) ?? 0,
      reentrega_taxa_fixa: parseNum(b.reentrega_taxa_fixa) ?? 0,
      reentrega_minima: parseNum(b.reentrega_minima) ?? 0,
      reentrega_soma_icms: b.reentrega_soma_icms === 1 || b.reentrega_soma_icms === true || b.reentrega_soma_icms === 'SIM' ? 1 : 0,
      devolucao_percent: parseNum(b.devolucao_percent) ?? 0,
      devolucao_taxa_fixa: parseNum(b.devolucao_taxa_fixa) ?? 0,
      devolucao_minima: parseNum(b.devolucao_minima) ?? 0,
      devolucao_soma_icms: b.devolucao_soma_icms === 1 || b.devolucao_soma_icms === true || b.devolucao_soma_icms === 'SIM' ? 1 : 0,
      margem_rodoviario: parseNum(b.margem_rodoviario) ?? 0,
      margem_aereo: parseNum(b.margem_aereo) ?? 0,
      margem_base_cte: typeof b.margem_base_cte === 'string' ? b.margem_base_cte : 'frete_total',
      tarifa_aerea_minima: parseNum(b.tarifa_aerea_minima) ?? 0,
      tarifa_aerea_taxa_extra: parseNum(b.tarifa_aerea_taxa_extra) ?? 0,
      tarifa_aerea_tad: parseNum(b.tarifa_aerea_tad) ?? 0,
      tarifa_aerea_soma_minimo: b.tarifa_aerea_soma_minimo === 0 || b.tarifa_aerea_soma_minimo === false || b.tarifa_aerea_soma_minimo === 'NAO' ? 0 : 1,
      percentual_frete: parseNum(b.percentual_frete) ?? 0,
      percentual_pedagio_frete: parseNum(b.percentual_pedagio_frete) ?? 0,
      desconto_max_percent: parseNum(b.desconto_max_percent) ?? 0,
      acrescimo_max_percent: parseNum(b.acrescimo_max_percent) ?? 0,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API partner-fees POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao salvar taxas.' }, { status: 500 });
  }
}


export async function PUT(request: NextRequest) {
  return POST(request);
}
