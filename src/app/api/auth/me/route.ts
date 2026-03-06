import { NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import type { Usuario } from '@/types';


export const dynamic = 'force-static';

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
  }

  const rows = await query<Usuario[]>(
    'SELECT id, nome, email, perfil, status, ativo, created_at, updated_at FROM usuarios WHERE id = ? LIMIT 1',
    [userId]
  );
  const user = Array.isArray(rows) ? rows[0] : null;
  if (!user) {
    return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: user });
}
