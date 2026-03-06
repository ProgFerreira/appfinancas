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
    const status = searchParams.get('status') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10)));
    const offset = (page - 1) * perPage;
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    if (status && ['pendente', 'autorizado', 'ignorado'].includes(status)) {
      where += ' AND cb.status = ?';
      params.push(status);
    }
    const countRows = await query<{ total: number }[]>(`SELECT COUNT(*) AS total FROM conciliacoes_bancarias cb ${where}`, params);
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;
    const limit = Math.min(50, Math.max(1, perPage)) | 0;
    const list = await query<
      { id: number; conta_bancaria_id: number; data_movimentacao: string; valor: number; tipo: string; descricao: string; status: string; conta_descricao: string }[]
    >(
      `SELECT cb.id, cb.conta_bancaria_id, cb.data_movimentacao, cb.valor, cb.tipo, cb.descricao, cb.status, b.descricao AS conta_descricao
       FROM conciliacoes_bancarias cb
       INNER JOIN contas_bancarias b ON b.id = cb.conta_bancaria_id
       ${where} ORDER BY cb.data_movimentacao DESC, cb.id DESC LIMIT ${limit} OFFSET ${Math.max(0, offset)}`,
      params
    );
    return NextResponse.json({
      success: true,
      data: Array.isArray(list) ? list : [],
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API conciliacoes GET:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao carregar conciliações.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const body = await request.json();
    const contaBancariaId = parseInt(String(body.conta_bancaria_id ?? 0), 10);
    const dataMov = typeof body.data_movimentacao === 'string' ? body.data_movimentacao.trim() : '';
    const valor = Number(body.valor);
    const tipo = typeof body.tipo === 'string' && ['entrada', 'saida'].includes(body.tipo) ? body.tipo : 'entrada';
    const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';
    if (!Number.isInteger(contaBancariaId) || contaBancariaId < 1 || !dataMov || Number.isNaN(valor) || !descricao) {
      return NextResponse.json({ success: false, error: 'Conta bancária, data, valor e descrição são obrigatórios.' }, { status: 400 });
    }
    const status = typeof body.status === 'string' && ['pendente', 'autorizado', 'ignorado'].includes(body.status) ? body.status : 'pendente';
    const memo = typeof body.memo === 'string' ? body.memo.trim() || null : null;
    await query(
      `INSERT INTO conciliacoes_bancarias (conta_bancaria_id, data_movimentacao, valor, tipo, descricao, memo, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [contaBancariaId, dataMov, valor, tipo, descricao, memo, status, userId]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const id = Array.isArray(result) && result[0] != null ? result[0].id : 0;
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    console.error('API conciliacoes POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao cadastrar conciliação.' }, { status: 500 });
  }
}
