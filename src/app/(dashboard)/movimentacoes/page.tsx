'use client';

import { Breadcrumb } from '@/components/Breadcrumb';
import dynamic from 'next/dynamic';

const MovimentacoesList = dynamic(() => import('./MovimentacoesList').then((m) => m.MovimentacoesList), { ssr: false });

export default function MovimentacoesPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Movimentações financeiras' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Movimentações financeiras</h2>
        <MovimentacoesList />
      </div>
    </>
  );
}
