import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { getUserPermissions } from '@/lib/rbac';


export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const permissions = await getUserPermissions(userId);
    return NextResponse.json({ success: true, data: { permissions } });
  } catch (e) {
    console.error('API auth/permissions:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar permissões' }, { status: 500 });
  }
}
