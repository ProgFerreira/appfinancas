'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { canAccessPath } from '@/lib/routePermissions';

type Props = {
  permissions: string[];
  children: React.ReactNode;
};

/**
 * Redireciona para /acesso-negado se o usuário não tiver permissão para a rota atual.
 * Usado no layout do dashboard para bloquear acesso direto por URL.
 */
export function PermissionGuard({ permissions, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname) return;
    const allowed = canAccessPath(pathname, permissions);
    if (!allowed) {
      router.replace('/acesso-negado');
    }
  }, [pathname, permissions, router]);

  const allowed = canAccessPath(pathname ?? '', permissions);
  if (!allowed) {
    return null;
  }
  return <>{children}</>;
}
