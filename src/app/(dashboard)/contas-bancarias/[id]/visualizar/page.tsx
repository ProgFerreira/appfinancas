'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

type Item = {
  id: number;
  descricao: string;
  banco: string;
  agencia: string | null;
  conta: string | null;
  tipo: string;
  saldo_inicial: number;
  observacoes: string | null;
  ativo: number;
};

export default function VisualizarContaBancariaPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [data, setData] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/contas-bancarias/${id}`)
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
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Contas bancárias', href: '/contas-bancarias' }, { label: 'Visualizar' }]} />
        <div className="mt-4 p-6 text-slate-500">Carregando...</div>
      </>
    );
  }
  if (error || !data) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Contas bancárias', href: '/contas-bancarias' }, { label: 'Visualizar' }]} />
        <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-800">{error ?? 'Registro não encontrado.'}</div>
        <Link href="/contas-bancarias" className="mt-4 inline-block text-indigo-600 hover:underline">Voltar à listagem</Link>
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Contas bancárias', href: '/contas-bancarias' }, { label: 'Visualizar' }]} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-800">Visualizar conta bancária</h2>
        <div className="flex gap-2">
          <Link href={`/contas-bancarias/${id}/editar`} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Editar</Link>
          <Link href="/contas-bancarias" className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Voltar</Link>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><span className="text-slate-500 text-sm">Descrição</span><p className="font-medium text-slate-800">{data.descricao}</p></div>
          <div><span className="text-slate-500 text-sm">Banco</span><p className="text-slate-800">{data.banco}</p></div>
          <div><span className="text-slate-500 text-sm">Agência / Conta</span><p className="text-slate-800">{[data.agencia, data.conta].filter(Boolean).join(' / ') || '—'}</p></div>
          <div><span className="text-slate-500 text-sm">Tipo</span><p className="text-slate-800 capitalize">{data.tipo}</p></div>
          <div><span className="text-slate-500 text-sm">Saldo inicial</span><p className="text-slate-800">{formatMoney(data.saldo_inicial)}</p></div>
          <div><span className="text-slate-500 text-sm">Ativo</span><p className="text-slate-800">{data.ativo ? 'Sim' : 'Não'}</p></div>
          {data.observacoes && (
            <div className="md:col-span-2"><span className="text-slate-500 text-sm">Observações</span><p className="text-slate-800">{data.observacoes}</p></div>
          )}
        </div>
      </div>
    </>
  );
}
