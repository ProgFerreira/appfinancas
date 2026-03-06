'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';
import type { Tarefa } from '@/types';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr + 'Z').toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

const PRIORIDADE_LABELS: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

export default function VisualizarTarefaPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [data, setData] = useState<(Tarefa & { responsavel_nome?: string | null }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/tarefas/${id}`)
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
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tarefas', href: '/tarefas' },
            { label: 'Visualizar' },
          ]}
        />
        <div className="mt-4 p-6 text-slate-500">Carregando...</div>
      </>
    );
  }
  if (error || !data) {
    return (
      <>
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Tarefas', href: '/tarefas' },
            { label: 'Visualizar' },
          ]}
        />
        <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-800">
          {error ?? 'Registro não encontrado.'}
        </div>
        <Link href="/tarefas" className="mt-4 inline-block text-indigo-600 hover:underline">
          Voltar à listagem
        </Link>
      </>
    );
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Tarefas', href: '/tarefas' },
          { label: 'Visualizar' },
        ]}
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-800">Visualizar tarefa</h2>
        <div className="flex gap-2">
          <Link
            href={`/tarefas/${id}/editar`}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
          >
            Editar
          </Link>
          <Link
            href="/tarefas"
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
          >
            Voltar
          </Link>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-slate-500 text-sm">Título</span>
            <p className="font-medium text-slate-800">{data.titulo}</p>
          </div>
          <div>
            <span className="text-slate-500 text-sm">Status</span>
            <p className="text-slate-800">{STATUS_LABELS[data.status] ?? data.status}</p>
          </div>
          <div>
            <span className="text-slate-500 text-sm">Prioridade</span>
            <p className="text-slate-800">{PRIORIDADE_LABELS[data.prioridade] ?? data.prioridade}</p>
          </div>
          <div>
            <span className="text-slate-500 text-sm">Data de vencimento</span>
            <p className="text-slate-800">{formatDate(data.data_vencimento)}</p>
          </div>
          <div>
            <span className="text-slate-500 text-sm">Unidade</span>
            <p className="text-slate-800">{data.unidade_nome ?? '—'}</p>
          </div>
          <div>
            <span className="text-slate-500 text-sm">Responsável</span>
            <p className="text-slate-800">{data.responsavel_nome ?? '—'}</p>
          </div>
          <div className="md:col-span-2">
            <span className="text-slate-500 text-sm">Descrição</span>
            <p className="text-slate-800 whitespace-pre-wrap">{data.descricao ?? '—'}</p>
          </div>
        </div>
      </div>
    </>
  );
}
