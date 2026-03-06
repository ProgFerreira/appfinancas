import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

/** Retorna classificações, grupos DRE e naturezas para os formulários do plano de contas. */

export const dynamic = 'force-static';

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const [classificacoes, grupos, naturezas] = await Promise.all([
      query<{ id: number; codigo: string; nome: string }[]>(
        'SELECT id, codigo, nome FROM plano_contas_classificacoes ORDER BY codigo'
      ),
      query<{ id: number; codigo: string; nome: string; classificacao_id: number }[]>(
        'SELECT id, codigo, nome, classificacao_id FROM plano_contas_grupos ORDER BY codigo'
      ),
      query<{ id: number; codigo: string; nome: string }[]>(
        'SELECT id, codigo, nome FROM plano_contas_naturezas ORDER BY codigo'
      ),
    ]);
    return NextResponse.json({
      success: true,
      data: {
        classificacoes: Array.isArray(classificacoes) ? classificacoes : [],
        grupos: Array.isArray(grupos) ? grupos : [],
        naturezas: Array.isArray(naturezas) ? naturezas : [],
      },
    });
  } catch (e) {
    console.error('API plano-contas/options GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar opções.' }, { status: 500 });
  }
}
