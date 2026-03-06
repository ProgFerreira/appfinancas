'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface TarefasResumo {
  total: number;
  pendente: number;
  em_andamento: number;
  concluido: number;
  cancelado: number;
  vencidas: number;
}

export function TarefasCards() {
  const router = useRouter();
  const [data, setData] = useState<TarefasResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    fetch('/api/tarefas/resumo')
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { success: false, error: 'Resposta vazia', status: res.status };
        try {
          return { ...JSON.parse(text), status: res.status } as {
            success: boolean;
            data?: TarefasResumo;
            error?: string;
            status: number;
          };
        } catch {
          return { success: false, error: 'Resposta inválida', status: res.status };
        }
      })
      .then((result) => {
        if (result.status === 401) {
          router.push('/login');
          return;
        }
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.error ?? 'Erro ao carregar resumo');
        }
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 text-sm">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const cards = [
    {
      label: 'Total de tarefas',
      value: data.total,
      href: '/tarefas',
      className: 'border-slate-200 bg-white',
      valueClass: 'text-slate-800',
    },
    {
      label: 'Pendentes',
      value: data.pendente,
      href: '/tarefas?status=pendente',
      className: 'border-amber-200 bg-amber-50/50',
      valueClass: 'text-amber-700',
    },
    {
      label: 'Em andamento',
      value: data.em_andamento,
      href: '/tarefas?status=em_andamento',
      className: 'border-blue-200 bg-blue-50/50',
      valueClass: 'text-blue-700',
    },
    {
      label: 'Concluídas',
      value: data.concluido,
      href: '/tarefas?status=concluido',
      className: 'border-emerald-200 bg-emerald-50/50',
      valueClass: 'text-emerald-700',
    },
    {
      label: 'Canceladas',
      value: data.cancelado,
      href: '/tarefas?status=cancelado',
      className: 'border-slate-200 bg-slate-50/50',
      valueClass: 'text-slate-600',
    },
    {
      label: 'Vencidas',
      value: data.vencidas,
      href: '/tarefas',
      className: data.vencidas > 0 ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-white',
      valueClass: data.vencidas > 0 ? 'text-red-700 font-semibold' : 'text-slate-600',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6 mb-6">
      {cards.map((card) => (
        <Link
          key={card.label}
          href={card.href}
          className={`rounded-xl border p-5 shadow-sm transition-shadow hover:shadow-md ${card.className}`}
        >
          <h3 className="text-sm font-medium text-slate-600">{card.label}</h3>
          <p className={`mt-1 text-2xl font-semibold ${card.valueClass}`}>{card.value}</p>
        </Link>
      ))}
    </div>
  );
}
