import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: '0' }];
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    await query('DELETE FROM contas_receber_ctes WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API contas-receber-ctes [id] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir vínculo.' }, { status: 500 });
  }
}
