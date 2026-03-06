'use client';

import { Breadcrumb } from '@/components/Breadcrumb';
import dynamic from 'next/dynamic';

const PerfisList = dynamic(() => import('./PerfisList').then((m) => m.PerfisList), { ssr: false });

export default function PerfisPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Perfis' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Perfis de acesso</h2>
        <p className="text-sm text-slate-600 mb-4">
          Controle quais telas cada perfil pode acessar e associe usuários aos perfis.
        </p>
        <PerfisList />
      </div>
    </>
  );
}
