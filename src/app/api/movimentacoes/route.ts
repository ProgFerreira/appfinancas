import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

type MovItem = {
  id: number;
  conta_bancaria_id: number;
  tipo_movimentacao: string;
  descricao: string;
  valor_original: number;
  valor_liquido: number;
  data_movimentacao: string;
  conta_descricao: string;
};

function toDateStr(v: string | Date | null | undefined): string {
  if (v == null) return '';
  if (typeof v === 'string') return v.slice(0, 10);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

/** Lista unificada: bank_transactions + pagamentos (não conciliados) + recebimentos (não conciliados) */
async function getMovimentacoesUnificadas(
  contaId: number | null,
  limit: number,
  offset: number
): Promise<{ list: MovItem[]; total: number }> {
  const hasConta = contaId != null && Number.isInteger(contaId);
  const whereBank = hasConta ? 'WHERE bt.bank_account_id = ?' : '';
  const wherePag = hasConta ? 'AND p.conta_bancaria_id = ?' : '';
  const whereRec = hasConta ? 'AND r.conta_bancaria_id = ?' : '';
  const params = hasConta ? [contaId] : [];
  const notReconciled = `AND NOT EXISTS (SELECT 1 FROM reconciliation_matches rm WHERE rm.payable_payment_id = p.id AND rm.status IN ('suggested', 'confirmed'))`;
  const notReconciledRec = `AND NOT EXISTS (SELECT 1 FROM reconciliation_matches rm WHERE rm.receivable_receipt_id = r.id AND rm.status IN ('suggested', 'confirmed'))`;

  let bankRows: { id: number; bank_account_id: number; type: string; amount: number; memo: string | null; payee: string | null; posted_at: string; conta_descricao: string | null }[] = [];
  let pagRows: { id: number; conta_bancaria_id: number; valor_pago: number; data_pagamento: string; descricao: string | null; conta_descricao: string | null }[] = [];
  let recRows: { id: number; conta_bancaria_id: number; valor_recebido: number; data_recebimento: string; descricao: string | null; conta_descricao: string | null }[] = [];

  try {
    const qBank = await query<
      { id: number; bank_account_id: number; type: string; amount: number; memo: string | null; payee: string | null; posted_at: string; conta_descricao: string | null }[]
    >(
      `SELECT bt.id, bt.bank_account_id, bt.type, bt.amount, bt.memo, bt.payee, bt.posted_at, cb.descricao AS conta_descricao
       FROM bank_transactions bt
       LEFT JOIN contas_bancarias cb ON cb.id = bt.bank_account_id
       ${whereBank} ORDER BY bt.posted_at DESC, bt.id DESC LIMIT 2000`,
      params
    );
    bankRows = Array.isArray(qBank) ? qBank : [];
  } catch {
    // tabela pode não existir
  }
  try {
    const qPag = await query<
      { id: number; conta_bancaria_id: number; valor_pago: number; data_pagamento: string; descricao: string | null; conta_descricao: string | null }[]
    >(
      `SELECT p.id, p.conta_bancaria_id, p.valor_pago, p.data_pagamento, cp.descricao, cb.descricao AS conta_descricao
       FROM contas_pagar_pagamentos p
       INNER JOIN contas_pagar cp ON cp.id = p.conta_pagar_id
       LEFT JOIN contas_bancarias cb ON cb.id = p.conta_bancaria_id
       WHERE p.conta_bancaria_id IS NOT NULL ${notReconciled} ${wherePag}
       ORDER BY p.data_pagamento DESC, p.id DESC LIMIT 2000`,
      params
    );
    pagRows = Array.isArray(qPag) ? qPag : [];
  } catch {
    try {
      const qPag = await query<
        { id: number; conta_bancaria_id: number; valor_pago: number; data_pagamento: string; descricao: string | null; conta_descricao: string | null }[]
      >(
        `SELECT p.id, p.conta_bancaria_id, p.valor_pago, p.data_pagamento, cp.descricao, cb.descricao AS conta_descricao
         FROM contas_pagar_pagamentos p INNER JOIN contas_pagar cp ON cp.id = p.conta_pagar_id
         LEFT JOIN contas_bancarias cb ON cb.id = p.conta_bancaria_id
         WHERE p.conta_bancaria_id IS NOT NULL ${wherePag} ORDER BY p.data_pagamento DESC LIMIT 2000`,
        params
      );
      pagRows = Array.isArray(qPag) ? qPag : [];
    } catch {
      // ignore
    }
  }
  try {
    const qRec = await query<
      { id: number; conta_bancaria_id: number; valor_recebido: number; data_recebimento: string; descricao: string | null; conta_descricao: string | null }[]
    >(
      `SELECT r.id, r.conta_bancaria_id, r.valor_recebido, r.data_recebimento, cr.descricao, cb.descricao AS conta_descricao
       FROM contas_receber_recebimentos r
       INNER JOIN contas_receber cr ON cr.id = r.conta_receber_id
       LEFT JOIN contas_bancarias cb ON cb.id = r.conta_bancaria_id
       WHERE r.conta_bancaria_id IS NOT NULL ${notReconciledRec} ${whereRec}
       ORDER BY r.data_recebimento DESC, r.id DESC LIMIT 2000`,
      params
    );
    recRows = Array.isArray(qRec) ? qRec : [];
  } catch {
    try {
      const qRec = await query<
        { id: number; conta_bancaria_id: number; valor_recebido: number; data_recebimento: string; descricao: string | null; conta_descricao: string | null }[]
      >(
        `SELECT r.id, r.conta_bancaria_id, r.valor_recebido, r.data_recebimento, cr.descricao, cb.descricao AS conta_descricao
         FROM contas_receber_recebimentos r INNER JOIN contas_receber cr ON cr.id = r.conta_receber_id
         LEFT JOIN contas_bancarias cb ON cb.id = r.conta_bancaria_id
         WHERE r.conta_bancaria_id IS NOT NULL ${whereRec} ORDER BY r.data_recebimento DESC LIMIT 2000`,
        params
      );
      recRows = Array.isArray(qRec) ? qRec : [];
    } catch {
      // ignore
    }
  }

  const all: MovItem[] = [];
  bankRows.forEach((r) => {
    const val = Number(r.amount);
    all.push({
      id: r.id,
      conta_bancaria_id: r.bank_account_id,
      tipo_movimentacao: r.type === 'credit' ? 'entrada' : 'saida',
      descricao: (r.payee || r.memo || `Transação #${r.id}`).trim() || '—',
      valor_original: val,
      valor_liquido: val,
      data_movimentacao: toDateStr(r.posted_at),
      conta_descricao: r.conta_descricao ?? '—',
    });
  });
  pagRows.forEach((r) => {
    const val = Number(r.valor_pago);
    all.push({
      id: 1000000 + r.id,
      conta_bancaria_id: r.conta_bancaria_id,
      tipo_movimentacao: 'saida',
      descricao: (r.descricao || `Pagamento #${r.id}`).trim() || '—',
      valor_original: val,
      valor_liquido: val,
      data_movimentacao: toDateStr(r.data_pagamento),
      conta_descricao: r.conta_descricao ?? '—',
    });
  });
  recRows.forEach((r) => {
    const val = Number(r.valor_recebido);
    all.push({
      id: 2000000 + r.id,
      conta_bancaria_id: r.conta_bancaria_id,
      tipo_movimentacao: 'entrada',
      descricao: (r.descricao || `Recebimento #${r.id}`).trim() || '—',
      valor_original: val,
      valor_liquido: val,
      data_movimentacao: toDateStr(r.data_recebimento),
      conta_descricao: r.conta_descricao ?? '—',
    });
  });

  all.sort((a, b) => {
    const d = b.data_movimentacao.localeCompare(a.data_movimentacao);
    if (d !== 0) return d;
    return b.id - a.id;
  });
  const total = all.length;
  const list = all.slice(offset, offset + limit);
  return { list, total };
}


export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const contaIdParam = searchParams.get('conta_bancaria_id');
    const contaId = contaIdParam ? parseInt(contaIdParam, 10) : null;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10)));
    const offset = (page - 1) * perPage;
    const limit = Math.min(50, Math.max(1, perPage)) | 0;
    const offsetSafe = Math.max(0, offset);

    let total = 0;
    let list: MovItem[] = [];
    let useUnified = false;

    try {
      let where = 'WHERE 1=1';
      const params: (string | number)[] = [];
      if (contaId != null && Number.isInteger(contaId)) {
        where += ' AND mf.conta_bancaria_id = ?';
        params.push(contaId);
      }
      const countRows = await query<{ total: number }[]>(
        `SELECT COUNT(*) AS total FROM movimentacoes_financeiras mf ${where}`,
        params
      );
      total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;

      if (total > 0) {
        const listRows = await query<MovItem[]>(
          `SELECT mf.id, mf.conta_bancaria_id, mf.tipo_movimentacao, mf.descricao, mf.valor_original, mf.valor_liquido, mf.data_movimentacao, b.descricao AS conta_descricao
           FROM movimentacoes_financeiras mf
           LEFT JOIN contas_bancarias b ON b.id = mf.conta_bancaria_id
           ${where} ORDER BY mf.data_movimentacao DESC, mf.id DESC LIMIT ${limit} OFFSET ${offsetSafe}`,
          params
        );
        list = Array.isArray(listRows) ? listRows : [];
      } else {
        useUnified = true;
        const result = await getMovimentacoesUnificadas(
          contaId != null && Number.isInteger(contaId) ? contaId : null,
          limit,
          offsetSafe
        );
        list = result.list;
        total = result.total;
      }
    } catch {
      useUnified = true;
      const result = await getMovimentacoesUnificadas(
        contaId != null && Number.isInteger(contaId) ? contaId : null,
        limit,
        offsetSafe
      );
      list = result.list;
      total = result.total;
    }

    const totalPages = perPage > 0 ? Math.ceil(total / perPage) : 0;
    return NextResponse.json({
      success: true,
      data: list,
      meta: { total, page, perPage, totalPages },
      ...(useUnified && { source: 'unificado' }),
    });
  } catch (e) {
    console.error('API movimentacoes GET:', e);
    return NextResponse.json(
      {
        success: true,
        data: [],
        meta: { total: 0, page: 1, perPage: 20, totalPages: 0 },
        error: 'Erro ao carregar movimentações.',
      },
      { status: 200 }
    );
  }
}
