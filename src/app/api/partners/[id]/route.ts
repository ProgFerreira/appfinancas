import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import * as partnerRepo from '@/repositories/cotacao/partner.repo';

function validatePartnerBody(body: unknown): { nome: string; tipo: string; cnpj: string | null; contato: string | null; email: string | null; telefone: string | null; ativo: number; observacoes: string | null } | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const nome = typeof b.nome === 'string' ? b.nome.trim() : '';
  if (!nome) return null;
  const tipo = typeof b.tipo === 'string' && ['RODOVIARIO', 'AEREO', 'AMBOS'].includes(b.tipo) ? b.tipo : 'RODOVIARIO';
  const cnpj = typeof b.cnpj === 'string' ? b.cnpj.trim() || null : null;
  const contato = typeof b.contato === 'string' ? b.contato.trim() || null : null;
  const email = typeof b.email === 'string' ? b.email.trim() || null : null;
  const telefone = typeof b.telefone === 'string' ? b.telefone.trim() || null : null;
  const ativo = b.ativo === 0 || b.ativo === '0' ? 0 : 1;
  const observacoes = typeof b.observacoes === 'string' ? b.observacoes.trim() || null : null;
  return { nome, tipo, cnpj, contato, email, telefone, ativo, observacoes };
}


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
    const id = parseInt((await params).id, 10);
    if (Number.isNaN(id) || id < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const partner = await partnerRepo.findById(id);
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Parceiro não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: partner });
  } catch (e) {
    console.error('API partners [id] GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao buscar parceiro.' }, { status: 500 });
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
    const data = validatePartnerBody(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Dados inválidos. Nome é obrigatório.' }, { status: 400 });
    }
    const ok = await partnerRepo.update(id, data);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Parceiro não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API partners [id] PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar parceiro.' }, { status: 500 });
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
    const ok = await partnerRepo.softDelete(id);
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Parceiro não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API partners [id] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir parceiro.' }, { status: 500 });
  }
}
