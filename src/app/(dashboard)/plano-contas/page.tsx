'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';
import dynamic from 'next/dynamic';

const PlanoContasList = dynamic(() => import('./PlanoContasList').then((m) => m.PlanoContasList), { ssr: false });
const PlanoContasTree = dynamic(() => import('./PlanoContasTree').then((m) => m.PlanoContasTree), { ssr: false });

export default function PlanoContasPage() {
  const [viewMode, setViewMode] = useState<'lista' | 'arvore'>('lista');

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Plano de contas' }]} />
      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Plano de contas</h2>
          <div className="flex items-center gap-2">
            <Link
              href="/plano-contas/novo"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              Nova conta
            </Link>
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              type="button"
              onClick={() => setViewMode('lista')}
              className={`px-3 py-1.5 text-sm rounded-md ${viewMode === 'lista' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Lista
            </button>
            <button
              type="button"
              onClick={() => setViewMode('arvore')}
              className={`px-3 py-1.5 text-sm rounded-md ${viewMode === 'arvore' ? 'bg-white text-slate-800 shadow' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Árvore
            </button>
            </div>
          </div>
        </div>
        {viewMode === 'lista' ? <PlanoContasList /> : <PlanoContasTree />}
      </div>
    </>
  );
}
