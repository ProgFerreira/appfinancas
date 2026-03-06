import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import * as partnerTERepo from '@/repositories/cotacao/partnerTE.repo';


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
    const list = await partnerTERepo.findByPartnerId(partnerId);
    return NextResponse.json({ success: true, data: list });
  } catch (e) {
    console.error('API partners [id] te GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao buscar tarifas TE.' }, { status: 500 });
  }
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
    const rows = Array.isArray(body) ? body : (body?.rows && Array.isArray(body.rows) ? body.rows : []);
    const toSave = rows.map((r: Record<string, unknown>) => ({
      codigo: r.codigo != null ? String(r.codigo) : null,
      minima: Number(r.minima) || 0,
      peso_franquia_kg: Number(r.peso_franquia_kg) || 0,
      tarifa: Number(r.tarifa) || 0,
      soma_ao_frete_peso: r.soma_ao_frete_peso === 1 || r.soma_ao_frete_peso === true || r.soma_ao_frete_peso === 'SIM',
    }));
    await partnerTERepo.saveList(partnerId, toSave);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API partners [id] te POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao salvar tarifas TE.' }, { status: 500 });
  }
}
