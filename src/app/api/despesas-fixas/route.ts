import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import type { DespesaFixa } from '@/types';


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
      where += ' AND df.ativo = 1';
    } else if (ativo === '0') {
      where += ' AND df.ativo = 0';
    }
    // ativo === 'all' => sem filtro

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM despesas_fixas df ${where}`,
      params
    );
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;

    const limit = Math.min(50, Math.max(1, perPage)) | 0;
    const offsetSafe = Math.max(0, offset) | 0;
    const list = await query<(DespesaFixa & { categoria_nome: string; fornecedor_nome: string | null })[]>(
      `SELECT df.id, df.categoria_id, df.plano_contas_id, df.centro_custo_id, df.fornecedor_id, df.descricao,
              df.valor_previsto, df.dia_vencimento, df.gerar_automaticamente, df.ativo, df.created_at, df.updated_at,
              cd.nome AS categoria_nome, c.nome AS fornecedor_nome
       FROM despesas_fixas df
       INNER JOIN categorias_despesa cd ON cd.id = df.categoria_id
       LEFT JOIN clientes c ON c.id = df.fornecedor_id
       ${where} ORDER BY df.descricao LIMIT ${limit} OFFSET ${offsetSafe}`,
      params
    );
    const items = Array.isArray(list) ? list : [];

    return NextResponse.json({
      success: true,
      data: items,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API despesas-fixas:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao carregar despesas fixas.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}

function validarDespesaFixa(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const descricao = typeof b.descricao === 'string' ? b.descricao.trim() : '';
  if (!descricao) return null;
  const categoriaId = typeof b.categoria_id === 'number' ? b.categoria_id : parseInt(String(b.categoria_id), 10);
  if (!Number.isInteger(categoriaId) || categoriaId < 1) return null;
  const valorPrevisto = Number(b.valor_previsto);
  if (Number.isNaN(valorPrevisto) || valorPrevisto < 0) return null;
  const diaVencimento = typeof b.dia_vencimento === 'number' ? b.dia_vencimento : parseInt(String(b.dia_vencimento), 10);
  if (!Number.isInteger(diaVencimento) || diaVencimento < 1 || diaVencimento > 31) return null;
  return {
    categoria_id: categoriaId,
    plano_contas_id: b.plano_contas_id != null && b.plano_contas_id !== '' ? parseInt(String(b.plano_contas_id), 10) : null,
    centro_custo_id: b.centro_custo_id != null && b.centro_custo_id !== '' ? parseInt(String(b.centro_custo_id), 10) : null,
    fornecedor_id: b.fornecedor_id != null && b.fornecedor_id !== '' ? parseInt(String(b.fornecedor_id), 10) : null,
    descricao,
    valor_previsto: valorPrevisto,
    dia_vencimento: diaVencimento,
    gerar_automaticamente: b.gerar_automaticamente === true || b.gerar_automaticamente === 1 ? 1 : 0,
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
    const data = validarDespesaFixa(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Dados inválidos. Descrição, categoria, valor e dia vencimento são obrigatórios.' }, { status: 400 });
    }
    await query(
      `INSERT INTO despesas_fixas (categoria_id, plano_contas_id, centro_custo_id, fornecedor_id, descricao, valor_previsto, dia_vencimento, gerar_automaticamente, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.categoria_id as number,
        data.plano_contas_id as number | null,
        data.centro_custo_id as number | null,
        data.fornecedor_id as number | null,
        data.descricao as string,
        data.valor_previsto as number,
        data.dia_vencimento as number,
        data.gerar_automaticamente as number,
        data.ativo as number,
      ]
    );
    const result = await query<{ id: number }[]>(
      'SELECT LAST_INSERT_ID() AS id'
    );
    const id = Array.isArray(result) && result[0] != null ? result[0].id : null;
    return NextResponse.json({ success: true, data: { id: id ?? 0 } });
  } catch (e) {
    console.error('API despesas-fixas POST:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao cadastrar despesa fixa.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
