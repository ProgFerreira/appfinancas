'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR');
}

type Titulo = {
  id: number;
  descricao: string | null;
  valor: number;
  data_emissao: string;
  data_vencimento: string;
  situacao: string;
  fornecedor_nome?: string;
};

type Pagamento = {
  id: number;
  data_pagamento: string;
  valor_pago: number;
  conta_descricao: string | null;
  observacoes: string | null;
};

export default function VisualizarContaPagarPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? '');
  const [titulo, setTitulo] = useState<Titulo | null>(null);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/contas-pagar/${id}`).then((r) => r.json()),
      fetch(`/api/contas-pagar/${id}/pagamentos`).then((r) => r.json()),
    ])
      .then(([resTitulo, resPag]) => {
        if (resTitulo.success && resTitulo.data) setTitulo(resTitulo.data);
        else setError(resTitulo.error ?? 'Título não encontrado.');
        if (resPag.success && Array.isArray(resPag.data)) setPagamentos(resPag.data);
      })
      .catch(() => setError('Erro ao carregar.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-slate-500">Carregando...</div>;
  if (error || !titulo) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || 'Título não encontrado.'}</p>
        <Link href="/contas-pagar" className="text-indigo-600 hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Contas a pagar', href: '/contas-pagar' }, { label: 'Visualizar' }]} />
      <div className="mt-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/contas-pagar" className="text-slate-600 hover:underline text-sm">← Contas a pagar</Link>
        <Link href={`/contas-pagar/${id}/editar`} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Editar</Link>
        {(titulo.situacao === 'em_aberto' || titulo.situacao === 'parcial') && (
          <Link href={`/contas-pagar/${id}/baixa`} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Registrar pagamento</Link>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Título #{titulo.id}</h2>
          <p className="text-sm text-slate-600 mt-1">{titulo.descricao ?? '—'}</p>
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="font-medium text-slate-500">Fornecedor</dt>
              <dd className="mt-0.5 text-slate-900 break-words">{titulo.fornecedor_nome ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Valor</dt>
              <dd className="mt-0.5 text-slate-900 font-medium">{formatMoney(titulo.valor)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Vencimento</dt>
              <dd className="mt-0.5 text-slate-900">{formatDate(titulo.data_vencimento)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Situação</dt>
              <dd className="mt-0.5">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${titulo.situacao === 'pago' ? 'bg-green-100 text-green-800' : titulo.situacao === 'parcial' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'}`}>
                  {titulo.situacao}
                </span>
              </dd>
            </div>
          </dl>
        </div>
        <div className="p-4">
          <h3 className="text-base font-medium text-slate-800 mb-3">Histórico de pagamentos</h3>
          {pagamentos.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhum pagamento registrado.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-700">
                  <th className="text-left py-3 px-2 font-medium">Data</th>
                  <th className="text-right py-3 px-2 font-medium">Valor pago</th>
                  <th className="text-left py-3 px-2 font-medium">Conta bancária</th>
                  <th className="text-left py-3 px-2 font-medium">Observações</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-2 text-slate-900">{formatDate(p.data_pagamento)}</td>
                    <td className="py-3 px-2 text-right font-medium text-slate-900">{formatMoney(p.valor_pago)}</td>
                    <td className="py-3 px-2 text-slate-700 break-words max-w-[200px]">{p.conta_descricao ?? '—'}</td>
                    <td className="py-3 px-2 text-slate-700">{p.observacoes ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
