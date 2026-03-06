'use client';

import { Breadcrumb } from '@/components/Breadcrumb';
import dynamic from 'next/dynamic';

const UsuariosList = dynamic(() => import('./UsuariosList').then((m) => m.UsuariosList), { ssr: false });

export default function UsuariosPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Usuários' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Usuários</h2>
        <UsuariosList />
      </div>
    </>
  );
}
