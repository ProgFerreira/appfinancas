import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


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
    const cteId = parseInt(id, 10);
    if (!Number.isInteger(cteId) || cteId < 1) {
      return NextResponse.json({ success: false, error: 'ID do CTe inválido' }, { status: 400 });
    }
    const rows = await query<
      { id: number; cte_id: number; cnpj: string | null; inscricao_estadual: string | null; nome: string | null; nome_fantasia: string | null; telefone: string | null; logradouro: string | null; numero: string | null; complemento: string | null; bairro: string | null; codigo_municipio: number | null; municipio: string | null; cep: string | null; uf: string | null; codigo_pais: number | null; pais: string | null }[]
    >(
      'SELECT id, cte_id, cnpj, inscricao_estadual, nome, nome_fantasia, telefone, logradouro, numero, complemento, bairro, codigo_municipio, municipio, cep, uf, codigo_pais, pais FROM cte_remetentes WHERE cte_id = ? ORDER BY id',
      [cteId]
    );
    return NextResponse.json({ success: true, data: Array.isArray(rows) ? rows : [] });
  } catch (e) {
    console.error('API ctes remetentes GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao listar remetentes.' }, { status: 500 });
  }
}

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const cteId = parseInt(id, 10);
    if (!Number.isInteger(cteId) || cteId < 1) {
      return NextResponse.json({ success: false, error: 'ID do CTe inválido' }, { status: 400 });
    }
    const body = await request.json();
    await query(
      `INSERT INTO cte_remetentes (cte_id, cnpj, inscricao_estadual, nome, nome_fantasia, telefone, logradouro, numero, complemento, bairro, codigo_municipio, municipio, cep, uf, codigo_pais, pais)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cteId,
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
      ]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const newId = Array.isArray(result) && result[0] ? result[0].id : 0;
    return NextResponse.json({ success: true, data: { id: newId } });
  } catch (e) {
    console.error('API ctes remetentes POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao cadastrar remetente.' }, { status: 500 });
  }
}
