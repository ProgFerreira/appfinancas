import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'bank.view');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para ver importações.' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10)));
    const bankAccountId = searchParams.get('bank_account_id');
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    if (bankAccountId) {
      const id = parseInt(bankAccountId, 10);
      if (Number.isInteger(id) && id > 0) {
        where += ' AND bsi.bank_account_id = ?';
        params.push(id);
      }
    }
    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM bank_statement_imports bsi ${where}`,
      params
    );
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;
    const offset = (page - 1) * perPage;
    const list = await query<
      { id: number; bank_account_id: number; filename: string; imported_at: string; status: string; error_message: string | null; conta_descricao: string }[]
    >(
      `SELECT bsi.id, bsi.bank_account_id, bsi.filename, bsi.imported_at, bsi.status, bsi.error_message, cb.descricao AS conta_descricao
       FROM bank_statement_imports bsi
       LEFT JOIN contas_bancarias cb ON cb.id = bsi.bank_account_id
       ${where} ORDER BY bsi.id DESC LIMIT ? OFFSET ?`,
      [...params, perPage, offset]
    );
    return NextResponse.json({
      success: true,
      data: Array.isArray(list) ? list : [],
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API bank/imports GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao listar importações.' }, { status: 500 });
  }
}
