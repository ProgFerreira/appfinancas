import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import type { Cte } from '@/types';

/** Forma validada do body para POST (campos aceitos pela query). */
type CteValidado = {
  numero: string;
  serie: string | null;
  chave: string | null;
  cliente_id: number;
  data_emissao: string | null;
  valor_frete: number;
  origem: string | null;
  destino: string | null;
  minuta: string | null;
  emitente_cnpj: string | null;
  peso: number;
  cubagem: number;
  tipo_operacao: string | null;
  vencimento: string | null;
  centro_custo_id: number | null;
  arquivo_xml: string | null;
  status: string;
  ativo: number;
};


export const dynamic = 'force-static';

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
    if (ativo === '1') where += ' AND ct.ativo = 1';
    else if (ativo === '0') where += ' AND ct.ativo = 0';

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM ctes ct ${where}`,
      params
    );
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;

    const limit = Math.min(50, Math.max(1, perPage)) | 0;
    const offsetSafe = Math.max(0, offset) | 0;
    const list = await query<(Cte & { cliente_nome: string })[]>(
      `SELECT ct.id, ct.numero, ct.serie, ct.chave, ct.cliente_id, ct.data_emissao, ct.valor_frete,
              ct.origem, ct.destino, ct.minuta, ct.emitente_cnpj, ct.peso, ct.cubagem, ct.tipo_operacao,
              ct.vencimento, ct.centro_custo_id, ct.arquivo_xml, ct.status, ct.ativo, ct.created_at, ct.updated_at,
              c.nome AS cliente_nome
       FROM ctes ct
       LEFT JOIN clientes c ON c.id = ct.cliente_id
       ${where} ORDER BY ct.data_emissao DESC, ct.id DESC LIMIT ${limit} OFFSET ${offsetSafe}`,
      params
    );
    const items = Array.isArray(list) ? list : [];

    return NextResponse.json({
      success: true,
      data: items,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API ctes GET:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao carregar CTe.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}

function validarCte(body: unknown): CteValidado | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const numero = typeof b.numero === 'string' ? b.numero.trim() : '';
  if (!numero) return null;
  const clienteId = typeof b.cliente_id === 'number' ? b.cliente_id : parseInt(String(b.cliente_id), 10);
  if (!Number.isInteger(clienteId) || clienteId < 1) return null;
  const valorFrete = Number(b.valor_frete);
  if (Number.isNaN(valorFrete) || valorFrete < 0) return null;
  return {
    numero,
    serie: typeof b.serie === 'string' ? b.serie.trim() || null : null,
    chave: typeof b.chave === 'string' ? b.chave.trim() || null : null,
    cliente_id: clienteId,
    data_emissao: typeof b.data_emissao === 'string' && b.data_emissao ? b.data_emissao.trim() || null : null,
    valor_frete: valorFrete,
    origem: typeof b.origem === 'string' ? b.origem.trim() || null : null,
    destino: typeof b.destino === 'string' ? b.destino.trim() || null : null,
    minuta: typeof b.minuta === 'string' ? b.minuta.trim() || null : null,
    emitente_cnpj: typeof b.emitente_cnpj === 'string' ? b.emitente_cnpj.trim() || null : null,
    peso: typeof b.peso === 'number' ? b.peso : parseFloat(String(b.peso)) || 0,
    cubagem: typeof b.cubagem === 'number' ? b.cubagem : parseFloat(String(b.cubagem)) || 0,
    tipo_operacao: typeof b.tipo_operacao === 'string' ? b.tipo_operacao.trim() || null : null,
    vencimento: typeof b.vencimento === 'string' && b.vencimento ? b.vencimento.trim() || null : null,
    centro_custo_id: b.centro_custo_id != null && b.centro_custo_id !== '' ? parseInt(String(b.centro_custo_id), 10) : null,
    arquivo_xml: typeof b.arquivo_xml === 'string' ? b.arquivo_xml.trim() || null : null,
    status: typeof b.status === 'string' && b.status ? b.status.trim() : 'em_aberto',
    ativo: b.ativo === 0 ? 0 : 1,
  };
}


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const body = await request.json();
    const v = validarCte(body);
    if (!v) {
      return NextResponse.json({ success: false, error: 'Dados inválidos. Número e cliente são obrigatórios.' }, { status: 400 });
    }
    await query(
      `INSERT INTO ctes (numero, serie, chave, cliente_id, data_emissao, valor_frete, origem, destino, minuta, emitente_cnpj, peso, cubagem, tipo_operacao, vencimento, centro_custo_id, arquivo_xml, status, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        v.numero, v.serie, v.chave, v.cliente_id, v.data_emissao, v.valor_frete, v.origem, v.destino,
        v.minuta, v.emitente_cnpj, v.peso, v.cubagem, v.tipo_operacao, v.vencimento, v.centro_custo_id,
        v.arquivo_xml, v.status, v.ativo,
      ]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const newId = Array.isArray(result) && result[0] ? result[0].id : 0;
    return NextResponse.json({ success: true, data: { id: newId } });
  } catch (e) {
    console.error('API ctes POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao criar CTe.' }, { status: 500 });
  }
}
