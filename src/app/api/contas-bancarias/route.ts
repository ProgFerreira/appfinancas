import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo') ?? '1';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10)));
    const offset = (page - 1) * perPage;

    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    if (ativo === '1') {
      where += ' AND ativo = 1';
    } else if (ativo === '0') {
      where += ' AND ativo = 0';
    }

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM contas_bancarias ${where}`,
      params
    );
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;

    const limit = Math.min(50, Math.max(1, perPage)) | 0;
    const offsetSafe = Math.max(0, offset) | 0;
    const list = await query<
      { id: number; descricao: string; banco: string; agencia: string | null; conta: string | null; tipo: string; saldo_inicial: number; ativo: number }[]
    >(
      `SELECT id, descricao, banco, agencia, conta, tipo, saldo_inicial, ativo
       FROM contas_bancarias ${where} ORDER BY descricao LIMIT ${limit} OFFSET ${offsetSafe}`,
      params
    );
    const items = Array.isArray(list) ? list : [];

    return NextResponse.json({
      success: true,
      data: items,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API contas-bancarias GET:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao carregar contas bancárias.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}

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


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const body = await request.json();
    const data = validarContaBancaria(body);
    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Dados inválidos. Descrição e banco são obrigatórios.' },
        { status: 400 }
      );
    }
    await query(
      `INSERT INTO contas_bancarias (descricao, banco, agencia, conta, tipo, saldo_inicial, observacoes, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.descricao as string,
        data.banco as string,
        data.agencia as string | null,
        data.conta as string | null,
        data.tipo as string,
        data.saldo_inicial as number,
        data.observacoes as string | null,
        data.ativo as number,
      ]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const id = Array.isArray(result) && result[0] != null ? result[0].id : null;
    return NextResponse.json({ success: true, data: { id: id ?? 0 } });
  } catch (e) {
    console.error('API contas-bancarias POST:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao cadastrar conta bancária.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
