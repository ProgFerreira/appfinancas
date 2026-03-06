'use client';

import { Breadcrumb } from '@/components/Breadcrumb';
import dynamic from 'next/dynamic';

const MotoristasList = dynamic(() => import('./MotoristasList').then((m) => m.MotoristasList), { ssr: false });

export default function MotoristasPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Motoristas' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Motoristas</h2>
        <MotoristasList />
      </div>
    </>
  );
}
