import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const rows = await query<{ tipo_servico: string }[]>(
      `SELECT DISTINCT tipo_servico FROM manifestos WHERE tipo_servico IS NOT NULL AND tipo_servico != '' ORDER BY tipo_servico ASC`
    );
    const tiposServico = Array.isArray(rows) ? rows.map((r) => r.tipo_servico).filter(Boolean) : [];
    return NextResponse.json({ success: true, data: { tiposServico } });
  } catch (e) {
    console.error('API manifestos/options GET:', e);
    return NextResponse.json({ success: true, data: { tiposServico: [] } });
  }
}
