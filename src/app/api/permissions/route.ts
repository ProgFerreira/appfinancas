import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/rbac';


export const dynamic = 'force-static';

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const allowed = await hasPermission(userId, 'perfis.view');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para listar permissões.' }, { status: 403 });
    }
    const rows = await query<{ id: number; code: string; nome: string; descricao: string | null }[]>(
      'SELECT id, code, nome, descricao FROM permissions ORDER BY nome'
    );
    return NextResponse.json({
      success: true,
      data: Array.isArray(rows) ? rows : [],
    });
  } catch (e) {
    console.error('API permissions GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar permissões.' }, { status: 500 });
  }
}
