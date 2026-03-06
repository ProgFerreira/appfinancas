'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { CteForm } from '../../CteForm';
import { CteDestinatariosTab } from '../../CteDestinatariosTab';
import { CteRemetentesTab } from '../../CteRemetentesTab';

const TABS = [
  { id: 'dados', label: 'Dados do CTe' },
  { id: 'destinatarios', label: 'Destinatários' },
  { id: 'remetentes', label: 'Remetentes' },
] as const;

export default function EditarCtePage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('dados');

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'CTe', href: '/ctes' },
          { label: 'Editar CTe' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar CTe</h2>
        <div className="border-b border-slate-200 mb-4">
          <nav className="flex gap-1" aria-label="Abas">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  tab === t.id
                    ? 'bg-white border border-slate-200 border-b-0 text-indigo-600 -mb-px'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
        {tab === 'dados' && <CteForm id={id} />}
        {tab === 'destinatarios' && <CteDestinatariosTab cteId={id} />}
        {tab === 'remetentes' && <CteRemetentesTab cteId={id} />}
      </div>
    </>
  );
}
