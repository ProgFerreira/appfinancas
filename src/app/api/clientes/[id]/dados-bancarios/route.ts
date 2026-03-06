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
    const clienteId = parseInt(id, 10);
    if (!Number.isInteger(clienteId) || clienteId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const rows = await query<{ id: number; cliente_id: number; favorecido: string; cnpj_cpf: string | null; banco: string; agencia: string | null; conta: string | null; operacao: string | null; pix: string | null; observacoes: string | null; ativo: number }[]>(
      'SELECT id, cliente_id, favorecido, cnpj_cpf, banco, agencia, conta, operacao, pix, observacoes, ativo FROM cliente_dados_bancarios WHERE cliente_id = ? ORDER BY favorecido',
      [clienteId]
    );
    return NextResponse.json({ success: true, data: Array.isArray(rows) ? rows : [] });
  } catch (e) {
    console.error('API clientes dados-bancarios GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao listar dados bancários.' }, { status: 500 });
  }
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
    const clienteId = parseInt(id, 10);
    if (!Number.isInteger(clienteId) || clienteId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const favorecido = typeof body.favorecido === 'string' ? body.favorecido.trim() : '';
    const banco = typeof body.banco === 'string' ? body.banco.trim() : '';
    if (!favorecido || !banco) {
      return NextResponse.json({ success: false, error: 'Favorecido e banco são obrigatórios.' }, { status: 400 });
    }
    await query(
      `INSERT INTO cliente_dados_bancarios (cliente_id, favorecido, cnpj_cpf, banco, agencia, conta, operacao, pix, observacoes, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clienteId,
        favorecido,
        typeof body.cnpj_cpf === 'string' ? body.cnpj_cpf.trim() || null : null,
        banco,
        typeof body.agencia === 'string' ? body.agencia.trim() || null : null,
        typeof body.conta === 'string' ? body.conta.trim() || null : null,
        typeof body.operacao === 'string' ? body.operacao.trim() || null : null,
        typeof body.pix === 'string' ? body.pix.trim() || null : null,
        typeof body.observacoes === 'string' ? body.observacoes.trim() || null : null,
        body.ativo === 0 ? 0 : 1,
      ]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const newId = Array.isArray(result) && result[0] ? result[0].id : 0;
    return NextResponse.json({ success: true, data: { id: newId } });
  } catch (e) {
    console.error('API clientes dados-bancarios POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao cadastrar.' }, { status: 500 });
  }
}
