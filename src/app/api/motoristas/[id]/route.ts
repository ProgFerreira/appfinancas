import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

function validar(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const nome = typeof b.nome === 'string' ? b.nome.trim() : '';
  const cpf = typeof b.cpf === 'string' ? b.cpf.trim() : '';
  const tipoVinculo = typeof b.tipo_vinculo === 'string' ? b.tipo_vinculo.trim() : '';
  if (!nome || !cpf || !tipoVinculo) return null;
  const parceiroId = b.parceiro_id != null && b.parceiro_id !== '' ? parseInt(String(b.parceiro_id), 10) : null;
  return {
    parceiro_id: Number.isInteger(parceiroId) && parceiroId! > 0 ? parceiroId : null,
    nome,
    cpf,
    telefone: typeof b.telefone === 'string' ? b.telefone.trim() || null : null,
    email: typeof b.email === 'string' ? b.email.trim() || null : null,
    tipo_vinculo: tipoVinculo,
    observacoes: typeof b.observacoes === 'string' ? b.observacoes.trim() || null : null,
    ativo: b.ativo === false || b.ativo === 0 ? 0 : 1,
  };
}


export const dynamic = 'force-static';
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
    const rows = await query<
      { id: number; parceiro_id: number | null; nome: string; cpf: string; telefone: string | null; email: string | null; tipo_vinculo: string; observacoes: string | null; ativo: number }[]
    >(
      'SELECT id, parceiro_id, nome, cpf, telefone, email, tipo_vinculo, observacoes, ativo FROM motoristas WHERE id = ? LIMIT 1',
      [idNum]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Motorista não encontrado' }, { status: 404 });
    }
    const veiculos = await query<
      { id: number; placa: string; modelo: string; tipo: string; ano: number | null; ativo: number }[]
    >(
      `SELECT id, placa, modelo, tipo, ano, ativo FROM veiculos
       WHERE proprietario_tipo = 'motorista' AND proprietario_id = ? ORDER BY placa`,
      [idNum]
    );
    return NextResponse.json({
      success: true,
      data: {
        ...item,
        veiculos: Array.isArray(veiculos) ? veiculos : [],
      },
    });
  } catch (e) {
    console.error('API motoristas [id] GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar.' }, { status: 500 });
  }
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
    const data = validar(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Dados inválidos.' }, { status: 400 });
    }
    await query(
      `UPDATE motoristas SET parceiro_id = ?, nome = ?, cpf = ?, telefone = ?, email = ?, tipo_vinculo = ?, observacoes = ?, ativo = ? WHERE id = ?`,
      [
        data.parceiro_id as number | null,
        data.nome as string,
        data.cpf as string,
        data.telefone as string | null,
        data.email as string | null,
        data.tipo_vinculo as string,
        data.observacoes as string | null,
        data.ativo as number,
        idNum,
      ]
    );
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API motoristas [id] PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar.' }, { status: 500 });
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
    await query('UPDATE motoristas SET ativo = 0 WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API motoristas [id] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir.' }, { status: 500 });
  }
}
