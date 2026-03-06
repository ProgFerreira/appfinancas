'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Tarefa } from '@/types';
import type { Usuario } from '@/types';
import { CrudActionsCell } from '@/components/CrudActionsCell';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

const PRIORIDADE_OPTIONS = [
  { value: '', label: 'Todas prioridades' },
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
];

type UnidadeOption = { id: number; nome: string };

/** Formata data (YYYY-MM-DD ou ISO datetime) para pt-BR. Evita "Invalid Date" ao não concatenar 'Z' em formato date-only. */
function formatDate(dateStr: string | null | undefined): string {
  if (dateStr == null || String(dateStr).trim() === '') return '—';
  const s = String(dateStr).trim();
  try {
    const iso = s.length === 10 ? `${s}T12:00:00.000Z` : s.replace(' ', 'T');
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
}

function statusLabel(s: string): string {
  return STATUS_OPTIONS.find((o) => o.value === s)?.label ?? s;
}

function prioridadeLabel(p: string): string {
  return PRIORIDADE_OPTIONS.find((o) => o.value === p)?.label ?? p;
}

/** Retorna texto "X dias para vencer", "hoje", "vencida há X dias" ou "—" se sem data. */
function diasParaVencer(dateStr: string | null | undefined): string {
  if (dateStr == null || String(dateStr).trim() === '') return '—';
  const s = String(dateStr).trim();
  try {
    const iso = s.length === 10 ? `${s}T12:00:00.000Z` : s.replace(' ', 'T');
    const due = new Date(iso);
    if (Number.isNaN(due.getTime())) return '—';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return '1 dia';
    if (diffDays > 1 && diffDays <= 365) return `${diffDays} dias`;
    if (diffDays === -1) return 'Vencida há 1 dia';
    if (diffDays < -1) return `Vencida há ${Math.abs(diffDays)} dias`;
    return `${diffDays} dias`;
  } catch {
    return '—';
  }
}

export function TarefasList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreatedMessage, setShowCreatedMessage] = useState(false);
  const [items, setItems] = useState<Tarefa[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [unidades, setUnidades] = useState<UnidadeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? '');
  const [prioridadeFilter, setPrioridadeFilter] = useState('');
  const [unidadeFilter, setUnidadeFilter] = useState('');
  const [responsavelFilter, setResponsavelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const updateStatus = useCallback(
    async (id: number, status: 'concluido' | 'cancelado') => {
      setUpdatingId(id);
      try {
        const res = await fetch(`/api/tarefas/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          refetch();
        } else {
          alert(data.error ?? 'Erro ao atualizar status.');
        }
      } catch {
        alert('Erro de conexão.');
      } finally {
        setUpdatingId(null);
      }
    },
    [refetch]
  );

  useEffect(() => {
    if (searchParams.get('created') === '1') {
      setShowCreatedMessage(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('created');
      router.replace(url.pathname + (url.search || ''));
      const t = setTimeout(() => setShowCreatedMessage(false), 5000);
      return () => clearTimeout(t);
    }
  }, [searchParams, router]);

  useEffect(() => {
    fetch('/api/usuarios?per_page=100')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) setUsuarios(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/tarefa-unidades?ativo=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setUnidades(data.data.map((u: { id: number; nome: string }) => ({ id: u.id, nome: u.nome })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setError(null);
    const q = new URLSearchParams({ page: String(page), per_page: '20' });
    if (busca.trim()) q.set('q', busca.trim());
    if (statusFilter) q.set('status', statusFilter);
    if (prioridadeFilter) q.set('prioridade', prioridadeFilter);
    if (unidadeFilter) q.set('unidade_id', unidadeFilter);
    if (responsavelFilter) q.set('responsavel_id', responsavelFilter);
    fetch(`/api/tarefas?${q}`)
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { success: false, error: 'Resposta vazia', status: res.status };
        try {
          const parsed = JSON.parse(text) as {
            success: boolean;
            data?: Tarefa[];
            meta?: { total: number; totalPages: number };
            error?: string;
            detail?: string;
          };
          return { ...parsed, status: res.status };
        } catch {
          return { success: false, error: 'Resposta inválida', status: res.status };
        }
      })
      .then((data) => {
        if (data.status === 401) {
          router.push('/login');
          return;
        }
        if (data.success && data.data) {
          setItems(data.data);
          setTotal(data.meta?.total ?? 0);
          setTotalPages(data.meta?.totalPages ?? 0);
        } else {
          const msg = data.detail
            ? `${data.error ?? 'Erro'} — ${data.detail}`
            : (data.error ?? 'Erro ao carregar tarefas.');
          setError(msg);
          setItems([]);
        }
      })
      .catch(() => {
        setError(
          'Erro de conexão. Verifique se o banco está acessível. Abra /api/db/health para o erro exato.'
        );
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [page, busca, statusFilter, prioridadeFilter, unidadeFilter, responsavelFilter, refreshKey, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setLoading(true);
    setError(null);
    const q = new URLSearchParams({ page: '1', per_page: '20' });
    if (busca.trim()) q.set('q', busca.trim());
    if (statusFilter) q.set('status', statusFilter);
    if (prioridadeFilter) q.set('prioridade', prioridadeFilter);
    if (unidadeFilter) q.set('unidade_id', unidadeFilter);
    if (responsavelFilter) q.set('responsavel_id', responsavelFilter);
    fetch(`/api/tarefas?${q}`)
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { success: false, error: 'Resposta vazia', status: res.status };
        try {
          const parsed = JSON.parse(text) as {
            success: boolean;
            data?: Tarefa[];
            meta?: { total: number; totalPages: number };
            error?: string;
          };
          return { ...parsed, status: res.status };
        } catch {
          return { success: false, error: 'Resposta inválida', status: res.status };
        }
      })
      .then((data) => {
        if (data.status === 401) {
          router.push('/login');
          return;
        }
        if (data.success && data.data) {
          setItems(data.data);
          setTotal(data.meta?.total ?? 0);
          setTotalPages(data.meta?.totalPages ?? 0);
        } else {
          setError(data.error ?? 'Erro ao carregar tarefas.');
          setItems([]);
        }
      })
      .catch(() => {
        setError('Erro de conexão.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {showCreatedMessage && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between">
          <span>Tarefa cadastrada com sucesso.</span>
          <button
            type="button"
            onClick={() => setShowCreatedMessage(false)}
            className="text-green-600 hover:text-green-800"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      )}
      {error && (
        <div className="mx-4 mt-4 p-4 rounded-lg bg-red-50 border-2 border-red-300 text-red-800 text-sm space-y-1">
          <p className="font-medium">Erro</p>
          <p className="whitespace-pre-wrap break-words">{error}</p>
          <p className="text-xs mt-2">
            <a
              href="/api/db/health"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Verificar conexão com o banco (/api/db/health)
            </a>
          </p>
        </div>
      )}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-wrap flex-1 min-w-0">
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por título ou descrição..."
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={prioridadeFilter}
            onChange={(e) => {
              setPrioridadeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            {PRIORIDADE_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <select
            value={unidadeFilter}
            onChange={(e) => {
              setUnidadeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas unidades</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
          <select
            value={responsavelFilter}
            onChange={(e) => {
              setResponsavelFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos responsáveis</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Buscar
          </button>
        </form>
        <Link
          href="/tarefas/novo"
          className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 shrink-0"
        >
          Nova tarefa
        </Link>
      </div>
      {loading ? (
        <div className="p-8 text-center text-slate-500">Carregando...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left p-3">Título</th>
                  <th className="text-left p-3">Unidade</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Prioridade</th>
                  <th className="text-left p-3">Vencimento</th>
                  <th className="text-left p-3">Dias p/ vencer</th>
                  <th className="text-left p-3">Data de criação</th>
                  <th className="text-left p-3">Responsável</th>
                  <th className="text-left p-3 min-w-[180px]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500">
                      Nenhuma tarefa encontrada.
                    </td>
                  </tr>
                ) : (
                  items.map((t) => (
                    <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{t.titulo}</td>
                      <td className="p-3 text-slate-600">{t.unidade_nome ?? '—'}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            t.status === 'concluido'
                              ? 'bg-green-100 text-green-800'
                              : t.status === 'cancelado'
                                ? 'bg-slate-100 text-slate-600'
                                : t.status === 'em_andamento'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {statusLabel(t.status)}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">{prioridadeLabel(t.prioridade)}</td>
                      <td className="p-3 text-slate-600">{formatDate(t.data_vencimento)}</td>
                      <td className="p-3">
                        {(() => {
                          const txt = diasParaVencer(t.data_vencimento);
                          if (txt === '—') return <span className="text-slate-400">{txt}</span>;
                          if (txt.startsWith('Vencida')) return <span className="text-red-600 font-medium">{txt}</span>;
                          if (txt === 'Hoje' || txt === '1 dia') return <span className="text-amber-600 font-medium">{txt}</span>;
                          return <span className="text-slate-600">{txt}</span>;
                        })()}
                      </td>
                      <td className="p-3 text-slate-600">{formatDate(t.created_at)}</td>
                      <td className="p-3 text-slate-600">{t.responsavel_nome ?? '—'}</td>
                      <CrudActionsCell
                        basePath="/tarefas"
                        id={t.id}
                        entityLabel={t.titulo}
                        onDeleted={refetch}
                      >
                        {t.status !== 'concluido' && t.status !== 'cancelado' && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateStatus(t.id, 'concluido')}
                              disabled={updatingId === t.id}
                              className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50"
                              title="Marcar como concluído"
                            >
                              {updatingId === t.id ? '…' : 'Concluir'}
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStatus(t.id, 'cancelado')}
                              disabled={updatingId === t.id}
                              className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                              title="Cancelar tarefa"
                            >
                              {updatingId === t.id ? '…' : 'Cancelar'}
                            </button>
                          </>
                        )}
                      </CrudActionsCell>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-200 flex justify-between items-center text-sm text-slate-600">
              <span>
                Total: {total} | Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
