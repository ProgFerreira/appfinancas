import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import type { Cte } from '@/types';

/** Forma validada do body para PUT (campos aceitos pela query). */
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


export const dynamic = 'force-dynamic';
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
    const rows = await query<(Cte & { cliente_nome: string })[]>(
      `SELECT ct.id, ct.numero, ct.serie, ct.chave, ct.cliente_id, ct.data_emissao, ct.valor_frete,
              ct.origem, ct.destino, ct.minuta, ct.emitente_cnpj, ct.peso, ct.cubagem, ct.tipo_operacao,
              ct.vencimento, ct.centro_custo_id, ct.arquivo_xml, ct.status, ct.ativo, ct.created_at, ct.updated_at,
              c.nome AS cliente_nome
       FROM ctes ct
       LEFT JOIN clientes c ON c.id = ct.cliente_id
       WHERE ct.id = ? LIMIT 1`,
      [idNum]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'CTe não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    console.error('API ctes GET [id]:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar CTe.' }, { status: 500 });
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
    const v = validarCte(body);
    if (!v) {
      return NextResponse.json({ success: false, error: 'Dados inválidos.' }, { status: 400 });
    }
    await query(
      `UPDATE ctes SET numero = ?, serie = ?, chave = ?, cliente_id = ?, data_emissao = ?, valor_frete = ?,
       origem = ?, destino = ?, minuta = ?, emitente_cnpj = ?, peso = ?, cubagem = ?, tipo_operacao = ?,
       vencimento = ?, centro_custo_id = ?, arquivo_xml = ?, status = ?, ativo = ?, updated_at = NOW()
       WHERE id = ?`,
      [
        v.numero, v.serie, v.chave, v.cliente_id, v.data_emissao, v.valor_frete, v.origem, v.destino,
        v.minuta, v.emitente_cnpj, v.peso, v.cubagem, v.tipo_operacao, v.vencimento, v.centro_custo_id,
        v.arquivo_xml, v.status, v.ativo, idNum,
      ]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API ctes PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar CTe.' }, { status: 500 });
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
    await query('UPDATE ctes SET ativo = 0 WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API ctes [id] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir CTe.' }, { status: 500 });
  }
}
