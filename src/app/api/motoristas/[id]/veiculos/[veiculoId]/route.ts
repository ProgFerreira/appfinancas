import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * DELETE: desvincula o veículo do motorista.
 * Só desvincula se o veículo estiver vinculado a este motorista.
 * Atualiza o veículo: proprietario_tipo = 'empresa', proprietario_id = NULL.
 */

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): { id: string; veiculoId: string }[] {
  return [{ id: '0', veiculoId: '0' }];
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; veiculoId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id, veiculoId } = await params;
    const motoristaId = parseInt(id, 10);
    const veiculoIdNum = parseInt(veiculoId, 10);
    if (!Number.isInteger(motoristaId) || motoristaId < 1 || !Number.isInteger(veiculoIdNum) || veiculoIdNum < 1) {
      return NextResponse.json({ success: false, error: 'IDs inválidos' }, { status: 400 });
    }

    const rows = await query<{ id: number }[]>(
      `SELECT id FROM veiculos WHERE id = ? AND proprietario_tipo = 'motorista' AND proprietario_id = ? LIMIT 1`,
      [veiculoIdNum, motoristaId]
    );
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Veículo não está vinculado a este motorista.' }, { status: 404 });
    }

    await query(
      `UPDATE veiculos SET proprietario_tipo = 'empresa', proprietario_id = NULL WHERE id = ?`,
      [veiculoIdNum]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API motoristas [id] veiculos [veiculoId] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao desvincular veículo.' }, { status: 500 });
  }
}
