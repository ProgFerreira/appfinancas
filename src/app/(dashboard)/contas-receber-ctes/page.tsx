'use client';

import { useCallback, useState } from 'react';
import { Breadcrumb } from '@/components/Breadcrumb';
import dynamic from 'next/dynamic';

const ContasReceberCtesList = dynamic(() => import('./ContasReceberCtesList').then((m) => m.ContasReceberCtesList), { ssr: false });
const VincularCteForm = dynamic(() => import('./VincularCteForm').then((m) => m.VincularCteForm), { ssr: false });

export default function ContasReceberCtesPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Contas a receber', href: '/contas-receber' }, { label: 'Vínculos CTe' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Contas a receber × CTe</h2>
        <p className="text-sm text-slate-600 mb-4">
          Vincule um CTe a uma conta a receber. Cada CTe pode estar vinculado a no máximo uma conta a receber.
        </p>
        <div className="space-y-4">
          <VincularCteForm onSuccess={refetch} />
          <ContasReceberCtesList key={refreshKey} />
        </div>
      </div>
    </>
  );
}
