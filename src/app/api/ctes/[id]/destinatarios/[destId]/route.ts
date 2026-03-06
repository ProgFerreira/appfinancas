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


export const dynamic = 'force-dynamic';
export const dynamicParams = false;

export function generateStaticParams(): { id: string; destId: string }[] {
  return [{ id: '0', destId: '0' }];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; destId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id, destId } = await params;
    const cteId = parseInt(id, 10);
    const destIdNum = parseInt(destId, 10);
    if (!Number.isInteger(cteId) || !Number.isInteger(destIdNum)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const rows = await query<
      { id: number; cte_id: number; cnpj: string | null; inscricao_estadual: string | null; nome: string | null; telefone: string | null; logradouro: string | null; numero: string | null; complemento: string | null; bairro: string | null; codigo_municipio: number | null; municipio: string | null; cep: string | null; uf: string | null; codigo_pais: number | null; pais: string | null }[]
    >(
      'SELECT id, cte_id, cnpj, inscricao_estadual, nome, telefone, logradouro, numero, complemento, bairro, codigo_municipio, municipio, cep, uf, codigo_pais, pais FROM cte_destinatarios WHERE id = ? AND cte_id = ? LIMIT 1',
      [destIdNum, cteId]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Destinatário não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    console.error('API ctes destinatarios [destId] GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; destId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id, destId } = await params;
    const cteId = parseInt(id, 10);
    const destIdNum = parseInt(destId, 10);
    if (!Number.isInteger(cteId) || !Number.isInteger(destIdNum)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    await query(
      `UPDATE cte_destinatarios SET cnpj = ?, inscricao_estadual = ?, nome = ?, telefone = ?, logradouro = ?, numero = ?, complemento = ?, bairro = ?, codigo_municipio = ?, municipio = ?, cep = ?, uf = ?, codigo_pais = ?, pais = ? WHERE id = ? AND cte_id = ?`,
      [
        toStr(body.cnpj),
        toStr(body.inscricao_estadual),
        toStr(body.nome),
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
        destIdNum,
        cteId,
      ]
    );
    return NextResponse.json({ success: true, data: { id: destIdNum } });
  } catch (e) {
    console.error('API ctes destinatarios [destId] PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; destId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id, destId } = await params;
    const cteId = parseInt(id, 10);
    const destIdNum = parseInt(destId, 10);
    if (!Number.isInteger(cteId) || !Number.isInteger(destIdNum)) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    await query('DELETE FROM cte_destinatarios WHERE id = ? AND cte_id = ?', [destIdNum, cteId]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API ctes destinatarios [destId] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir.' }, { status: 500 });
  }
}
