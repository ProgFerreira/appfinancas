import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import * as partnerRepo from '@/repositories/cotacao/partner.repo';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo');
    const ativoNum = ativo === '0' ? 0 : ativo === '1' ? 1 : undefined;
    const list = await partnerRepo.findAll(ativoNum);
    return NextResponse.json({ success: true, data: list });
  } catch (e) {
    console.error('API partners GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao listar parceiros.' }, { status: 500 });
  }
}

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


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const body = await request.json();
    const data = validatePartnerBody(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Dados inválidos. Nome é obrigatório.' }, { status: 400 });
    }
    const id = await partnerRepo.create(data);
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    console.error('API partners POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao criar parceiro.' }, { status: 500 });
  }
}
