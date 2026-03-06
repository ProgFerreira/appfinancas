import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


export const dynamic = 'force-static';

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const list = await query<
      { id: number; conta_receber_id: number; cte_id: number; valor: number; created_at: string; conta_descricao: string; cliente_nome: string; cte_numero: string }[]
    >(
      `SELECT v.id, v.conta_receber_id, v.cte_id, v.valor, v.created_at,
              cr.descricao AS conta_descricao, c.nome AS cliente_nome, ct.numero AS cte_numero
       FROM contas_receber_ctes v
       INNER JOIN contas_receber cr ON cr.id = v.conta_receber_id
       INNER JOIN clientes c ON c.id = cr.cliente_id
       INNER JOIN ctes ct ON ct.id = v.cte_id
       ORDER BY v.created_at DESC`
    );
    return NextResponse.json({ success: true, data: Array.isArray(list) ? list : [] });
  } catch (e) {
    console.error('API contas-receber-ctes GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar vínculos.' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const body = await request.json();
    const contaReceberId = parseInt(String(body.conta_receber_id ?? 0), 10);
    const cteId = parseInt(String(body.cte_id ?? 0), 10);
    const valor = Number(body.valor);
    if (!Number.isInteger(contaReceberId) || contaReceberId < 1 || !Number.isInteger(cteId) || cteId < 1) {
      return NextResponse.json({ success: false, error: 'Conta a receber e CTe são obrigatórios.' }, { status: 400 });
    }
    if (Number.isNaN(valor) || valor < 0) {
      return NextResponse.json({ success: false, error: 'Valor deve ser maior ou igual a zero.' }, { status: 400 });
    }
    await query(
      'INSERT INTO contas_receber_ctes (conta_receber_id, cte_id, valor) VALUES (?, ?, ?)',
      [contaReceberId, cteId, valor]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const id = Array.isArray(result) && result[0] != null ? result[0].id : null;
    return NextResponse.json({ success: true, data: { id: id ?? 0 } });
  } catch (e) {
    console.error('API contas-receber-ctes POST:', e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Duplicate') || msg.includes('uq_cr_cte')) {
      return NextResponse.json({ success: false, error: 'Este CTe já está vinculado a outra conta a receber.' }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: 'Erro ao vincular.' }, { status: 500 });
  }
}
