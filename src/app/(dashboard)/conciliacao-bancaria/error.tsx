'use client';

import { Breadcrumb } from '@/components/Breadcrumb';
import { useEffect } from 'react';

export default function ConciliacaoBancariaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('ConciliacaoBancariaError', error);
  }, [error]);

  return (
    <div className="min-h-[400px]">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Conciliação bancária' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Conciliação bancária</h2>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          <p className="font-medium">Erro ao carregar a página.</p>
          <p className="mt-2 text-sm">{error.message}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
}
