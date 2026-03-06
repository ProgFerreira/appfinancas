import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import * as cepPracasRepo from '@/repositories/cotacao/cepPracas.repo';


export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const pracas = await cepPracasRepo.listPracas();
    return NextResponse.json({ success: true, data: pracas });
  } catch (e) {
    console.error('API pracas GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao listar praças.' }, { status: 500 });
  }
}
