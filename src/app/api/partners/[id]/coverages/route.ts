import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import * as coverageRepo from '@/repositories/cotacao/coverage.repo';


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
    const partnerId = parseInt((await params).id, 10);
    if (Number.isNaN(partnerId) || partnerId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const list = await coverageRepo.findByPartnerId(partnerId);
    return NextResponse.json({ success: true, data: list });
  } catch (e) {
    console.error('API partners coverages GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao listar coberturas.' }, { status: 500 });
  }
}

function validateCoverageBody(body: unknown): { uf: string; cidade: string; cep_inicio: string | null; cep_fim: string | null } | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const uf = typeof b.uf === 'string' ? b.uf.trim().toUpperCase().slice(0, 2) : '';
  const cidade = typeof b.cidade === 'string' ? b.cidade.trim() : '';
  if (!uf || !cidade) return null;
  const cep_inicio = typeof b.cep_inicio === 'string' ? b.cep_inicio.replace(/\D/g, '').slice(0, 8) || null : null;
  const cep_fim = typeof b.cep_fim === 'string' ? b.cep_fim.replace(/\D/g, '').slice(0, 8) || null : null;
  return { uf, cidade, cep_inicio, cep_fim };
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
    const data = validateCoverageBody(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'UF e cidade são obrigatórios.' }, { status: 400 });
    }
    const id = await coverageRepo.create({ partner_id: partnerId, ...data });
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    console.error('API partners coverages POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao criar cobertura.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') ?? '0', 10);
    if (Number.isNaN(id) || id < 1) {
      return NextResponse.json({ success: false, error: 'ID da cobertura é obrigatório.' }, { status: 400 });
    }
    const ok = await coverageRepo.remove(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Cobertura não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API partners coverages DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao remover cobertura.' }, { status: 500 });
  }
}
