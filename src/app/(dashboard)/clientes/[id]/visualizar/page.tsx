'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';
import type { Cliente } from '@/types';

export default function VisualizarClientePage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? '');
  const [data, setData] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/clientes/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) setData(result.data);
        else setError(result.error ?? 'Erro ao carregar');
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Clientes', href: '/clientes' }, { label: 'Visualizar' }]} />
        <div className="mt-4 p-6 text-slate-500">Carregando...</div>
      </>
    );
  }
  if (error || !data) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Clientes', href: '/clientes' }, { label: 'Visualizar' }]} />
        <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-800">{error ?? 'Registro não encontrado.'}</div>
        <Link href="/clientes" className="mt-4 inline-block text-indigo-600 hover:underline">Voltar à listagem</Link>
      </>
    );
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clientes', href: '/clientes' },
          { label: 'Visualizar', href: `/clientes/${id}/visualizar` },
        ]}
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-800">Visualizar cliente</h2>
        <div className="flex gap-2">
          <Link
            href={`/clientes/${id}/editar`}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
          >
            Editar
          </Link>
          <Link href="/clientes" className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">
            Voltar
          </Link>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><span className="text-slate-500 text-sm">Nome</span><p className="font-medium text-slate-800">{data.nome}</p></div>
          <div><span className="text-slate-500 text-sm">Razão social</span><p className="text-slate-800">{data.razao_social ?? '—'}</p></div>
          <div><span className="text-slate-500 text-sm">CNPJ/CPF</span><p className="text-slate-800">{data.cnpj_cpf ?? '—'}</p></div>
          <div><span className="text-slate-500 text-sm">Tipo</span><p className="text-slate-800 capitalize">{data.tipo_cadastro}</p></div>
          <div><span className="text-slate-500 text-sm">Classificação</span><p className="text-slate-800">{data.classificacao ?? '—'}</p></div>
          <div><span className="text-slate-500 text-sm">E-mail</span><p className="text-slate-800">{data.email ?? '—'}</p></div>
          <div><span className="text-slate-500 text-sm">Cidade / UF</span><p className="text-slate-800">{[data.municipio, data.uf].filter(Boolean).join(' / ') || '—'}</p></div>
          <div><span className="text-slate-500 text-sm">Ativo</span><p className="text-slate-800">{data.ativo ? 'Sim' : 'Não'}</p></div>
        </div>
      </div>
    </>
  );
}
