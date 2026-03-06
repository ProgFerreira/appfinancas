import { redirect } from 'next/navigation';
import { getSessionUserId } from '@/lib/auth';
import { getUserPermissions } from '@/lib/rbac';
import { query } from '@/lib/db';
import { DashboardShell } from '@/components/DashboardShell';
import type { Usuario } from '@/types';

async function getUser(id: number): Promise<Usuario | null> {
  const rows = await query<Usuario[]>(
    'SELECT id, nome, email, perfil, status FROM usuarios WHERE id = ? LIMIT 1',
    [id]
  );
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionUserId();
  if (!userId) redirect('/login');

  const [user, permissions] = await Promise.all([
    getUser(userId),
    getUserPermissions(userId),
  ]);

  return (
    <DashboardShell
      userName={user?.nome}
      title="Gestão Financeira"
      permissions={permissions}
    >
      {children}
    </DashboardShell>
  );
}
