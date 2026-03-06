'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  cliente_nome?: string;
};

type Recebimento = {
  id: number;
  data_recebimento: string;
  valor_recebido: number;
  desconto: number;
  forma_pagamento: string | null;
  conta_descricao: string | null;
  observacoes: string | null;
};

export default function VisualizarContaReceberPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [titulo, setTitulo] = useState<Titulo | null>(null);
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/contas-receber/${id}`).then((r) => r.json()),
      fetch(`/api/contas-receber/${id}/recebimentos`).then((r) => r.json()),
    ])
      .then(([resTitulo, resRec]) => {
        if (resTitulo.success && resTitulo.data) setTitulo(resTitulo.data);
        else setError(resTitulo.error ?? 'Título não encontrado.');
        if (resRec.success && Array.isArray(resRec.data)) setRecebimentos(resRec.data);
      })
      .catch(() => setError('Erro ao carregar.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-6 text-slate-500">Carregando...</div>;
  if (error || !titulo) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error || 'Título não encontrado.'}</p>
        <Link href="/contas-receber" className="text-indigo-600 hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Contas a receber', href: '/contas-receber' }, { label: 'Visualizar' }]} />
      <div className="mt-4">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link href="/contas-receber" className="text-slate-600 hover:underline text-sm">← Contas a receber</Link>
        <Link href={`/contas-receber/${id}/editar`} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Editar</Link>
        {(titulo.situacao === 'em_aberto' || titulo.situacao === 'parcial') && (
          <Link href={`/contas-receber/${id}/baixa`} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Registrar recebimento</Link>
        )}
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">Título #{titulo.id}</h2>
          <p className="text-sm text-slate-600 mt-1">{titulo.descricao ?? '—'}</p>
          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3 text-sm">
            <div>
              <dt className="font-medium text-slate-500">Cliente</dt>
              <dd className="mt-0.5 text-slate-900 break-words">{titulo.cliente_nome ?? '—'}</dd>
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
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${titulo.situacao === 'pago' || titulo.situacao === 'recebido' ? 'bg-green-100 text-green-800' : titulo.situacao === 'parcial' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-800'}`}>
                  {titulo.situacao}
                </span>
              </dd>
            </div>
          </dl>
        </div>
        <div className="p-4">
          <h3 className="text-base font-medium text-slate-800 mb-3">Histórico de recebimentos</h3>
          {recebimentos.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhum recebimento registrado.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 bg-slate-50 text-slate-700">
                  <th className="text-left py-3 px-2 font-medium">Data</th>
                  <th className="text-right py-3 px-2 font-medium">Valor recebido</th>
                  <th className="text-right py-3 px-2 font-medium">Desconto</th>
                  <th className="text-left py-3 px-2 font-medium">Forma</th>
                  <th className="text-left py-3 px-2 font-medium">Conta</th>
                  <th className="text-left py-3 px-2 font-medium">Observações</th>
                </tr>
              </thead>
              <tbody>
                {recebimentos.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-3 px-2 text-slate-900">{formatDate(r.data_recebimento)}</td>
                    <td className="py-3 px-2 text-right font-medium text-slate-900">{formatMoney(r.valor_recebido)}</td>
                    <td className="py-3 px-2 text-right text-slate-700">{formatMoney(r.desconto)}</td>
                    <td className="py-3 px-2 text-slate-700">{r.forma_pagamento ?? '—'}</td>
                    <td className="py-3 px-2 text-slate-700 break-words max-w-[200px]">{r.conta_descricao ?? '—'}</td>
                    <td className="py-3 px-2 text-slate-700">{r.observacoes ?? '—'}</td>
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
