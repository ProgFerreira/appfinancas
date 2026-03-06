'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ClienteForm } from '../../ClienteForm';
import { ClienteContatosTab } from '../../ClienteContatosTab';
import { ClienteDadosBancariosTab } from '../../ClienteDadosBancariosTab';
import { ClienteCategoriasTab } from '../../ClienteCategoriasTab';

const TABS = [
  { id: 'dados', label: 'Dados gerais' },
  { id: 'contatos', label: 'Contatos' },
  { id: 'bancarios', label: 'Dados bancários' },
  { id: 'categorias', label: 'Categorias' },
] as const;

export default function EditarClientePage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('dados');

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clientes', href: '/clientes' },
          { label: 'Editar cliente' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar cliente</h2>
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
        {tab === 'dados' && <ClienteForm id={id} />}
        {tab === 'contatos' && <ClienteContatosTab clienteId={id} />}
        {tab === 'bancarios' && <ClienteDadosBancariosTab clienteId={id} />}
        {tab === 'categorias' && <ClienteCategoriasTab clienteId={id} />}
      </div>
    </>
  );
}
