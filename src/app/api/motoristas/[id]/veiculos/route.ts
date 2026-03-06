import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * POST: vincula um veículo ao motorista.
 * Body: { veiculo_id: number }
 * Atualiza o veículo: proprietario_tipo = 'motorista', proprietario_id = id do motorista.
 */

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: '0' }];
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
    const motoristaId = parseInt(id, 10);
    if (!Number.isInteger(motoristaId) || motoristaId < 1) {
      return NextResponse.json({ success: false, error: 'ID do motorista inválido' }, { status: 400 });
    }
    const body = await request.json();
    const veiculoId = typeof body?.veiculo_id !== 'undefined' ? parseInt(String(body.veiculo_id), 10) : null;
    if (veiculoId == null || !Number.isInteger(veiculoId) || veiculoId < 1) {
      return NextResponse.json({ success: false, error: 'veiculo_id é obrigatório e deve ser um número válido.' }, { status: 400 });
    }

    const motorista = await query<{ id: number }[]>(
      'SELECT id FROM motoristas WHERE id = ? LIMIT 1',
      [motoristaId]
    );
    if (!Array.isArray(motorista) || motorista.length === 0) {
      return NextResponse.json({ success: false, error: 'Motorista não encontrado.' }, { status: 404 });
    }

    const veiculo = await query<{ id: number }[]>(
      'SELECT id FROM veiculos WHERE id = ? LIMIT 1',
      [veiculoId]
    );
    if (!Array.isArray(veiculo) || veiculo.length === 0) {
      return NextResponse.json({ success: false, error: 'Veículo não encontrado.' }, { status: 404 });
    }

    await query(
      `UPDATE veiculos SET proprietario_tipo = 'motorista', proprietario_id = ? WHERE id = ?`,
      [motoristaId, veiculoId]
    );
    return NextResponse.json({ success: true, data: { veiculo_id: veiculoId } });
  } catch (e) {
    console.error('API motoristas [id] veiculos POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao vincular veículo.' }, { status: 500 });
  }
}
