import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * Retorna listas para preencher selects em formulários:
 * categorias_despesa, categorias_receita, centros_custo, contas_bancarias, plano_contas
 */

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const [categoriasDespesa, categoriasReceita, centrosCusto, contasBancarias, clientes, planoContas, naturezas, motoristas] = await Promise.all([
      query<{ id: number; nome: string }[]>(
        'SELECT id, nome FROM categorias_despesa WHERE ativo = 1 ORDER BY nome'
      ),
      query<{ id: number; nome: string }[]>(
        'SELECT id, nome FROM categorias_receita WHERE ativo = 1 ORDER BY nome'
      ),
      query<{ id: number; nome: string }[]>(
        'SELECT id, nome FROM centros_custo WHERE ativo = 1 ORDER BY nome'
      ),
      query<{ id: number; descricao: string }[]>(
        'SELECT id, descricao FROM contas_bancarias WHERE ativo = 1 ORDER BY descricao'
      ),
      query<{ id: number; nome: string }[]>(
        'SELECT id, nome FROM clientes WHERE ativo = 1 ORDER BY nome LIMIT 500'
      ),
      query<{ id: number; codigo: string; nome: string }[]>(
        'SELECT id, codigo, nome FROM plano_contas WHERE ativo = 1 ORDER BY codigo'
      ),
      query<{ id: number; nome: string }[]>(
        'SELECT id, nome FROM naturezas WHERE ativo = 1 ORDER BY nome'
      ),
      query<{ id: number; nome: string }[]>(
        'SELECT id, nome FROM motoristas WHERE ativo = 1 ORDER BY nome LIMIT 500'
      ),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        categoriasDespesa: Array.isArray(categoriasDespesa) ? categoriasDespesa : [],
        categoriasReceita: Array.isArray(categoriasReceita) ? categoriasReceita : [],
        centrosCusto: Array.isArray(centrosCusto) ? centrosCusto : [],
        contasBancarias: Array.isArray(contasBancarias) ? contasBancarias : [],
        clientes: Array.isArray(clientes) ? clientes : [],
        planoContas: Array.isArray(planoContas) ? planoContas : [],
        naturezas: Array.isArray(naturezas) ? naturezas : [],
        motoristas: Array.isArray(motoristas) ? motoristas : [],
      },
    });
  } catch (e) {
    console.error('API cadastros/options:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao carregar opções. Verifique a conexão com o banco.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
