'use client';

import dynamic from 'next/dynamic';

const ConciliacoesList = dynamic(
  () => import('./ConciliacoesList').then((m) => m.ConciliacoesList),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8 text-center text-slate-500">
        Carregando lista...
      </div>
    ),
  }
);

export default function ConciliacoesListDynamic() {
  return <ConciliacoesList />;
}
