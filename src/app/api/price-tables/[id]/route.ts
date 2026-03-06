import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import * as priceTableRepo from '@/repositories/cotacao/priceTable.repo';

function validatePriceTableBody(body: unknown): { nome: string; origem_uf: string; origem_cidade: string; destino_uf: string; destino_cidade: string; ativo: number } | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const nome = typeof b.nome === 'string' ? b.nome.trim() : '';
  const origem_uf = typeof b.origem_uf === 'string' ? b.origem_uf.trim().toUpperCase().slice(0, 2) : '';
  const origem_cidade = typeof b.origem_cidade === 'string' ? b.origem_cidade.trim() : '';
  const destino_uf = typeof b.destino_uf === 'string' ? b.destino_uf.trim().toUpperCase().slice(0, 2) : '';
  const destino_cidade = typeof b.destino_cidade === 'string' ? b.destino_cidade.trim() : '';
  if (!nome || !origem_uf || !origem_cidade || !destino_uf || !destino_cidade) return null;
  const ativo = b.ativo === 0 || b.ativo === '0' ? 0 : 1;
  return { nome, origem_uf, origem_cidade, destino_uf, destino_cidade, ativo };
}


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
    const id = parseInt((await params).id, 10);
    if (Number.isNaN(id) || id < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const pt = await priceTableRepo.findById(id);
    if (!pt) {
      return NextResponse.json({ success: false, error: 'Tabela não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: pt });
  } catch (e) {
    console.error('API price-tables [id] GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao buscar tabela.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const id = parseInt((await params).id, 10);
    if (Number.isNaN(id) || id < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const data = validatePriceTableBody(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Dados inválidos.' }, { status: 400 });
    }
    const ok = await priceTableRepo.update(id, data);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Tabela não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API price-tables [id] PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar tabela.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const id = parseInt((await params).id, 10);
    if (Number.isNaN(id) || id < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const ok = await priceTableRepo.softDelete(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Tabela não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API price-tables [id] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir tabela.' }, { status: 500 });
  }
}
