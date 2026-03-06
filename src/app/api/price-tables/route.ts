import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import * as priceTableRepo from '@/repositories/cotacao/priceTable.repo';


export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partner_id');
    const ativo = searchParams.get('ativo');
    const partnerIdNum = partnerId ? parseInt(partnerId, 10) : undefined;
    const ativoNum = ativo === '0' ? 0 : ativo === '1' ? 1 : undefined;
    const list = await priceTableRepo.findAll(partnerIdNum, ativoNum);
    return NextResponse.json({ success: true, data: list });
  } catch (e) {
    console.error('API price-tables GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao listar tabelas de preço.' }, { status: 500 });
  }
}

function validatePriceTableBody(body: unknown): { partner_id: number; nome: string; origem_uf: string; origem_cidade: string; destino_uf: string; destino_cidade: string; ativo: number } | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const partner_id = parseInt(String(b.partner_id ?? 0), 10);
  if (!Number.isInteger(partner_id) || partner_id < 1) return null;
  const nome = typeof b.nome === 'string' ? b.nome.trim() : '';
  const origem_uf = typeof b.origem_uf === 'string' ? b.origem_uf.trim().toUpperCase().slice(0, 2) : '';
  const origem_cidade = typeof b.origem_cidade === 'string' ? b.origem_cidade.trim() : '';
  const destino_uf = typeof b.destino_uf === 'string' ? b.destino_uf.trim().toUpperCase().slice(0, 2) : '';
  const destino_cidade = typeof b.destino_cidade === 'string' ? b.destino_cidade.trim() : '';
  if (!nome || !origem_uf || !origem_cidade || !destino_uf || !destino_cidade) return null;
  const ativo = b.ativo === 0 || b.ativo === '0' ? 0 : 1;
  return { partner_id, nome, origem_uf, origem_cidade, destino_uf, destino_cidade, ativo };
}


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const body = await request.json();
    const data = validatePriceTableBody(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Dados inválidos. Preencha parceiro, nome, origem e destino.' }, { status: 400 });
    }
    const id = await priceTableRepo.create(data);
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    console.error('API price-tables POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao criar tabela de preço.' }, { status: 500 });
  }
}
