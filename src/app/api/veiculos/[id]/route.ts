import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

function validar(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const placa = typeof b.placa === 'string' ? b.placa.trim() : '';
  const modelo = typeof b.modelo === 'string' ? b.modelo.trim() : '';
  const tipo = typeof b.tipo === 'string' ? b.tipo.trim() : '';
  if (!placa || !modelo || !tipo) return null;
  const ano = b.ano != null && b.ano !== '' ? parseInt(String(b.ano), 10) : null;
  const capacidade = b.capacidade != null && b.capacidade !== '' ? parseFloat(String(b.capacidade)) : null;
  return {
    placa,
    modelo,
    tipo,
    ano: Number.isInteger(ano) && ano! > 0 ? ano : null,
    proprietario_tipo: typeof b.proprietario_tipo === 'string' ? b.proprietario_tipo.trim() || 'empresa' : 'empresa',
    proprietario_id: b.proprietario_id != null && b.proprietario_id !== '' ? parseInt(String(b.proprietario_id), 10) : null,
    renavam: typeof b.renavam === 'string' ? b.renavam.trim() || null : null,
    capacidade: capacidade != null && !Number.isNaN(capacidade) ? capacidade : null,
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
      { id: number; placa: string; modelo: string; tipo: string; ano: number | null; proprietario_tipo: string; proprietario_id: number | null; renavam: string | null; capacidade: number | null; observacoes: string | null; ativo: number }[]
    >(
      'SELECT id, placa, modelo, tipo, ano, proprietario_tipo, proprietario_id, renavam, capacidade, observacoes, ativo FROM veiculos WHERE id = ? LIMIT 1',
      [idNum]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Veículo não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    console.error('API veiculos [id] GET:', e);
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
      `UPDATE veiculos SET placa = ?, modelo = ?, tipo = ?, ano = ?, proprietario_tipo = ?, proprietario_id = ?, renavam = ?, capacidade = ?, observacoes = ?, ativo = ? WHERE id = ?`,
      [
        data.placa as string,
        data.modelo as string,
        data.tipo as string,
        data.ano as number | null,
        data.proprietario_tipo as string,
        data.proprietario_id as number | null,
        data.renavam as string | null,
        data.capacidade as number | null,
        data.observacoes as string | null,
        data.ativo as number,
        idNum,
      ]
    );
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API veiculos [id] PUT:', e);
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
    await query('UPDATE veiculos SET ativo = 0 WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API veiculos [id] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir.' }, { status: 500 });
  }
}
