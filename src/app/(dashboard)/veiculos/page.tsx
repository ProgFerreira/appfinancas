'use client';

import { Breadcrumb } from '@/components/Breadcrumb';
import dynamic from 'next/dynamic';

const VeiculosList = dynamic(() => import('./VeiculosList').then((m) => m.VeiculosList), { ssr: false });

export default function VeiculosPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Veículos' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Veículos</h2>
        <VeiculosList />
      </div>
    </>
  );
}
