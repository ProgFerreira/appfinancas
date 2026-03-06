'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';

type Item = {
  id: number; cte_id: number; categoria_id: number; plano_contas_id: number | null; centro_custo_id: number | null;
  fornecedor_id: number | null; descricao: string | null; valor: number; data_despesa: string; conta_pagar_id: number | null; ativo: number;
};

export default function VisualizarDespesaViagemPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [data, setData] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/despesas-viagem/${id}`)
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
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Despesas de viagem', href: '/despesas-viagem' }, { label: 'Visualizar' }]} />
        <div className="mt-4 p-6 text-slate-500">Carregando...</div>
      </>
    );
  }
  if (error || !data) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Despesas de viagem', href: '/despesas-viagem' }, { label: 'Visualizar' }]} />
        <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-800">{error ?? 'Registro não encontrado.'}</div>
        <Link href="/despesas-viagem" className="mt-4 inline-block text-indigo-600 hover:underline">Voltar à listagem</Link>
      </>
    );
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Despesas de viagem', href: '/despesas-viagem' }, { label: 'Visualizar' }]} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-800">Visualizar despesa de viagem</h2>
        <div className="flex gap-2">
          <Link href={`/despesas-viagem/${id}/editar`} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Editar</Link>
          <Link href="/despesas-viagem" className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Voltar</Link>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><span className="text-slate-500 text-sm">CTe ID</span><p className="font-medium text-slate-800">{data.cte_id}</p></div>
          <div><span className="text-slate-500 text-sm">Categoria ID</span><p className="text-slate-800">{data.categoria_id}</p></div>
          <div><span className="text-slate-500 text-sm">Data despesa</span><p className="text-slate-800">{data.data_despesa}</p></div>
          <div><span className="text-slate-500 text-sm">Valor</span><p className="text-slate-800">{fmt(data.valor)}</p></div>
          <div><span className="text-slate-500 text-sm">Plano de contas ID</span><p className="text-slate-800">{data.plano_contas_id ?? '—'}</p></div>
          <div><span className="text-slate-500 text-sm">Centro de custo ID</span><p className="text-slate-800">{data.centro_custo_id ?? '—'}</p></div>
          <div><span className="text-slate-500 text-sm">Fornecedor ID</span><p className="text-slate-800">{data.fornecedor_id ?? '—'}</p></div>
          <div><span className="text-slate-500 text-sm">Conta a pagar ID</span><p className="text-slate-800">{data.conta_pagar_id ?? '—'}</p></div>
          <div className="md:col-span-2"><span className="text-slate-500 text-sm">Descrição</span><p className="text-slate-800">{data.descricao ?? '—'}</p></div>
          <div><span className="text-slate-500 text-sm">Ativo</span><p className="text-slate-800">{data.ativo ? 'Sim' : 'Não'}</p></div>
        </div>
      </div>
    </>
  );
}
