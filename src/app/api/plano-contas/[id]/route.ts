import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


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
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const rows = await query<
      { id: number; codigo: string; nome: string; descricao: string | null; plano_pai_id: number | null; tipo_conta: string; eh_receita: number; eh_despesa: number; ativo: number; classificacao_id: number; grupo_dre_id: number; natureza_fluxo_id: number }[]
    >(
      'SELECT id, codigo, nome, descricao, plano_pai_id, tipo_conta, eh_receita, eh_despesa, ativo, classificacao_id, grupo_dre_id, natureza_fluxo_id FROM plano_contas WHERE id = ? LIMIT 1',
      [idNum]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Conta não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    console.error('API plano-contas [id] GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar.' }, { status: 500 });
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
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const codigo = typeof body.codigo === 'string' ? body.codigo.trim() : '';
    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    if (!codigo || !nome) {
      return NextResponse.json({ success: false, error: 'Código e nome são obrigatórios.' }, { status: 400 });
    }
    const descricao = typeof body.descricao === 'string' ? body.descricao.trim() || null : null;
    const tipoConta = typeof body.tipo_conta === 'string' && ['sintetica', 'analitica'].includes(body.tipo_conta) ? body.tipo_conta : 'analitica';
    const ehReceita = body.eh_receita === true || body.eh_receita === 1 ? 1 : 0;
    const ehDespesa = body.eh_despesa === true || body.eh_despesa === 1 ? 1 : 0;
    const ativo = body.ativo === false || body.ativo === 0 ? 0 : 1;
    const classificacaoId = body.classificacao_id != null && body.classificacao_id !== '' ? parseInt(String(body.classificacao_id), 10) : null;
    const grupoDreId = body.grupo_dre_id != null && body.grupo_dre_id !== '' ? parseInt(String(body.grupo_dre_id), 10) : null;
    const naturezaFluxoId = body.natureza_fluxo_id != null && body.natureza_fluxo_id !== '' ? parseInt(String(body.natureza_fluxo_id), 10) : null;
    if (classificacaoId != null && grupoDreId != null && naturezaFluxoId != null) {
      await query(
        `UPDATE plano_contas SET codigo = ?, nome = ?, descricao = ?, tipo_conta = ?, eh_receita = ?, eh_despesa = ?, ativo = ?, classificacao_id = ?, grupo_dre_id = ?, natureza_fluxo_id = ? WHERE id = ?`,
        [codigo, nome, descricao, tipoConta, ehReceita, ehDespesa, ativo, classificacaoId, grupoDreId, naturezaFluxoId, idNum]
      );
    } else {
      await query(
        `UPDATE plano_contas SET codigo = ?, nome = ?, descricao = ?, tipo_conta = ?, eh_receita = ?, eh_despesa = ?, ativo = ? WHERE id = ?`,
        [codigo, nome, descricao, tipoConta, ehReceita, ehDespesa, ativo, idNum]
      );
    }
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API plano-contas [id] PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar.' }, { status: 500 });
  }
}

/** Soft delete: define ativo = 0. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    await query('UPDATE plano_contas SET ativo = 0 WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API plano-contas [id] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir.' }, { status: 500 });
  }
}
