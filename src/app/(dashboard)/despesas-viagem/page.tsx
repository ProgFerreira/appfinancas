'use client';

import { Breadcrumb } from '@/components/Breadcrumb';
import dynamic from 'next/dynamic';

const DespesasViagemList = dynamic(() => import('./DespesasViagemList').then((m) => m.DespesasViagemList), { ssr: false });

export default function DespesasViagemPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Despesas de viagem' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Despesas de viagem</h2>
        <DespesasViagemList />
      </div>
    </>
  );
}
