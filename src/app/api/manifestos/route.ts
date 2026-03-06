import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import type { Manifesto } from '@/types';

/** Garante que as linhas sejam serializáveis em JSON (evita BigInt/Date que quebram). */
function sanitizeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === null || v === undefined) {
      out[k] = v;
    } else if (typeof v === 'bigint') {
      out[k] = Number(v);
    } else if (v instanceof Date) {
      out[k] = v.toISOString().slice(0, 10);
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Date)) {
      out[k] = sanitizeRow(v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const numero = searchParams.get('numero')?.trim() ?? '';
    const motoristaId = searchParams.get('motorista_id') ? parseInt(searchParams.get('motorista_id')!, 10) : 0;
    const dataInicio = searchParams.get('data_inicio')?.trim() ?? '';
    const dataFim = searchParams.get('data_fim')?.trim() ?? '';
    const tipoServico = searchParams.get('tipo_servico')?.trim() ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(100, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10)));
    const offset = (page - 1) * perPage;

    const conditions: string[] = ['1=1'];
    const params: (string | number)[] = [];

    if (numero) {
      conditions.push('m.numero_manifesto LIKE ?');
      params.push(`%${numero}%`);
    }
    if (motoristaId > 0 && Number.isFinite(motoristaId)) {
      conditions.push('m.motorista_id = ?');
      params.push(motoristaId);
    }
    if (dataInicio) {
      conditions.push('m.data_manifesto >= ?');
      params.push(dataInicio);
    }
    if (dataFim) {
      conditions.push('m.data_manifesto <= ?');
      params.push(dataFim);
    }
    if (tipoServico) {
      conditions.push('m.tipo_servico = ?');
      params.push(tipoServico);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countRows = await query<{ total: unknown }[]>(
      `SELECT COUNT(*) AS total FROM manifestos m ${where}`,
      params
    );
    const total = Math.max(0, Number(Array.isArray(countRows) ? countRows[0]?.total : 0) || 0);

    const limit = Math.min(100, Math.max(1, perPage));
    const limitNum = Number(limit) | 0 || 20;
    const offsetNum = Number(offset) | 0;
    // LIMIT/OFFSET como literais (já validados) para evitar "Incorrect arguments to mysqld_stmt_execute"
    const limitClause = `LIMIT ${limitNum} OFFSET ${offsetNum}`;
    let list: (Manifesto & { motorista_nome: string | null; motorista_placa: string | null })[];
    try {
      list = await query<(Manifesto & { motorista_nome: string | null; motorista_placa: string | null })[]>(
        `SELECT m.id, m.numero_manifesto, m.motorista_id, m.data_manifesto, m.data_saida_efetiva, m.origem, m.destino, m.cliente,
                m.valor_frete, m.valor_despesa, m.valor_liquido, m.custo_adicional, m.custo_pedagio,
                m.quantidade_volumes, m.quantidade_entrega, m.entrega_realizada, m.peso, m.peso_taxa, m.km, m.tipo_carga, m.tipo_servico,
                m.rota, m.responsavel, m.status, m.emissor, m.tipo_rodado, m.unidade, m.total_nf, m.observacoes, m.created_at, m.updated_at, m.created_by,
                mot.nome AS motorista_nome, mot.placa AS motorista_placa
         FROM manifestos m
         LEFT JOIN motoristas mot ON mot.id = m.motorista_id
         ${where}
         ORDER BY m.data_manifesto DESC, m.numero_manifesto DESC
         ${limitClause}`,
        params
      );
    } catch {
      try {
        list = await query<(Manifesto & { motorista_nome: string | null; motorista_placa: string | null })[]>(
          `SELECT m.id, m.numero_manifesto, m.motorista_id, m.data_manifesto, m.data_saida_efetiva, m.origem, m.destino, m.cliente,
                  m.valor_frete, m.valor_despesa, m.valor_liquido, m.custo_adicional, m.custo_pedagio,
                  m.quantidade_volumes, m.quantidade_entrega, m.entrega_realizada, m.peso, m.peso_taxa, m.km, m.tipo_carga, m.tipo_servico,
                  m.rota, m.responsavel, m.status, m.emissor, m.tipo_rodado, m.unidade, m.total_nf, m.observacoes, m.created_at, m.updated_at, m.created_by,
                  mot.nome AS motorista_nome, NULL AS motorista_placa
           FROM manifestos m
           LEFT JOIN motoristas mot ON mot.id = m.motorista_id
           ${where}
           ORDER BY m.data_manifesto DESC, m.numero_manifesto DESC
           ${limitClause}`,
          params
        );
      } catch {
        list = await query<(Manifesto & { motorista_nome: string | null; motorista_placa: string | null })[]>(
          `SELECT m.id, m.numero_manifesto, m.motorista_id, m.data_manifesto, m.origem, m.destino, m.cliente,
                  m.valor_frete, m.valor_despesa, m.valor_liquido, m.custo_adicional, m.custo_pedagio,
                  m.quantidade_volumes, m.quantidade_entrega, m.peso, m.peso_taxa, m.km, m.tipo_carga, m.tipo_servico,
                  m.status, m.observacoes, m.created_at, m.updated_at, m.created_by,
                  mot.nome AS motorista_nome, NULL AS motorista_placa
           FROM manifestos m
           LEFT JOIN motoristas mot ON mot.id = m.motorista_id
           ${where}
           ORDER BY m.data_manifesto DESC, m.numero_manifesto DESC
           ${limitClause}`,
          params
        );
      }
    }
    const rawItems = Array.isArray(list) ? list : [];
    const items = rawItems.map((row) => sanitizeRow(row as unknown as Record<string, unknown>));

    return NextResponse.json({
      success: true,
      data: items,
      meta: {
        total: Number(total),
        page,
        perPage,
        totalPages: Math.ceil(Number(total) / perPage),
      },
    });
  } catch (e) {
    console.error('API manifestos GET:', e);
    const message = e instanceof Error ? e.message : String(e);
    const tableMissing = /Table .*manifestos.* doesn't exist/i.test(message);
    return NextResponse.json(
      {
        success: false,
        error: tableMissing
          ? 'Tabela manifestos não encontrada. Execute a migration database/migrations/002_manifestos.sql.'
          : 'Erro ao carregar manifestos.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
