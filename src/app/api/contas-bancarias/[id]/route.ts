import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

function validarContaBancaria(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const descricao = typeof b.descricao === 'string' ? b.descricao.trim() : '';
  const banco = typeof b.banco === 'string' ? b.banco.trim() : '';
  const tipo = typeof b.tipo === 'string' ? b.tipo.trim() : 'corrente';
  if (!descricao || !banco) return null;
  const saldoInicial = Number(b.saldo_inicial);
  const saldo = Number.isNaN(saldoInicial) ? 0 : saldoInicial;
  return {
    descricao,
    banco,
    agencia: typeof b.agencia === 'string' ? b.agencia.trim() || null : null,
    conta: typeof b.conta === 'string' ? b.conta.trim() || null : null,
    tipo: tipo || 'corrente',
    saldo_inicial: saldo,
    observacoes: typeof b.observacoes === 'string' ? b.observacoes.trim() || null : null,
    ativo: b.ativo === false || b.ativo === 0 ? 0 : 1,
  };
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
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const rows = await query<
      { id: number; descricao: string; banco: string; agencia: string | null; conta: string | null; tipo: string; saldo_inicial: number; observacoes: string | null; ativo: number }[]
    >(
      `SELECT id, descricao, banco, agencia, conta, tipo, saldo_inicial, observacoes, ativo
       FROM contas_bancarias WHERE id = ? LIMIT 1`,
      [idNum]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Conta bancária não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    console.error('API contas-bancarias [id] GET:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar conta bancária.' },
      { status: 500 }
    );
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
    const data = validarContaBancaria(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Dados inválidos.' }, { status: 400 });
    }
    await query(
      `UPDATE contas_bancarias SET descricao = ?, banco = ?, agencia = ?, conta = ?, tipo = ?, saldo_inicial = ?, observacoes = ?, ativo = ? WHERE id = ?`,
      [
        data.descricao as string,
        data.banco as string,
        data.agencia as string | null,
        data.conta as string | null,
        data.tipo as string,
        data.saldo_inicial as number,
        data.observacoes as string | null,
        data.ativo as number,
        idNum,
      ]
    );
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API contas-bancarias [id] PUT:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar conta bancária.' },
      { status: 500 }
    );
  }
}

/** Soft delete: define ativo = 0. */
export async function DELETE(
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
    await query('UPDATE contas_bancarias SET ativo = 0 WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API contas-bancarias [id] DELETE:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir conta bancária.' },
      { status: 500 }
    );
  }
}
