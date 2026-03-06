import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

function toStr(v: unknown): string | null {
  if (v == null) return null;
  const s = typeof v === 'string' ? v.trim() : String(v).trim();
  return s || null;
}
function toInt(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = parseInt(String(v), 10);
  return Number.isInteger(n) ? n : null;
}


export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): { id: string; remId: string }[] {
  return [{ id: '0', remId: '0' }];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; remId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id, remId } = await params;
    const cteId = parseInt(id, 10);
    const remIdNum = parseInt(remId, 10);
    if (!Number.isInteger(cteId) || !Number.isInteger(remIdNum)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const rows = await query<
      { id: number; cte_id: number; cnpj: string | null; inscricao_estadual: string | null; nome: string | null; nome_fantasia: string | null; telefone: string | null; logradouro: string | null; numero: string | null; complemento: string | null; bairro: string | null; codigo_municipio: number | null; municipio: string | null; cep: string | null; uf: string | null; codigo_pais: number | null; pais: string | null }[]
    >(
      'SELECT id, cte_id, cnpj, inscricao_estadual, nome, nome_fantasia, telefone, logradouro, numero, complemento, bairro, codigo_municipio, municipio, cep, uf, codigo_pais, pais FROM cte_remetentes WHERE id = ? AND cte_id = ? LIMIT 1',
      [remIdNum, cteId]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Remetente não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    console.error('API ctes remetentes [remId] GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; remId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id, remId } = await params;
    const cteId = parseInt(id, 10);
    const remIdNum = parseInt(remId, 10);
    if (!Number.isInteger(cteId) || !Number.isInteger(remIdNum)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    await query(
      `UPDATE cte_remetentes SET cnpj = ?, inscricao_estadual = ?, nome = ?, nome_fantasia = ?, telefone = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, codigo_municipio = ?, municipio = ?, cep = ?, uf = ?, codigo_pais = ?, pais = ? WHERE id = ? AND cte_id = ?`,
      [
        toStr(body.cnpj),
        toStr(body.inscricao_estadual),
        toStr(body.nome),
        toStr(body.nome_fantasia),
        toStr(body.telefone),
        toStr(body.logradouro),
        toStr(body.numero),
        toStr(body.complemento),
        toStr(body.bairro),
        toInt(body.codigo_municipio),
        toStr(body.municipio),
        toStr(body.cep),
        toStr(body.uf),
        toInt(body.codigo_pais),
        toStr(body.pais),
        remIdNum,
        cteId,
      ]
    );
    return NextResponse.json({ success: true, data: { id: remIdNum } });
  } catch (e) {
    console.error('API ctes remetentes [remId] PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; remId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id, remId } = await params;
    const cteId = parseInt(id, 10);
    const remIdNum = parseInt(remId, 10);
    if (!Number.isInteger(cteId) || !Number.isInteger(remIdNum)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    await query('DELETE FROM cte_remetentes WHERE id = ? AND cte_id = ?', [remIdNum, cteId]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API ctes remetentes [remId] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir.' }, { status: 500 });
  }
}
