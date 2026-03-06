'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CrudActionsCell } from '@/components/CrudActionsCell';

type Item = { id: number; conta_bancaria_id: number; data_movimentacao: string; valor: number; tipo: string; descricao: string; status: string; conta_descricao: string };

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function ConciliacoesList() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setError(null);
    const q = new URLSearchParams({ page: String(page), per_page: '20' });
    if (statusFilter) q.set('status', statusFilter);
    fetch(`/api/conciliacoes?${q}`)
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { success: false, status: res.status };
        try {
          return { ...JSON.parse(text), status: res.status } as { success: boolean; data?: Item[]; meta?: { total: number; totalPages: number }; error?: string; detail?: string; status: number };
        } catch {
          return { success: false, status: res.status };
        }
      })
      .then((data) => {
        if (data.status === 401) { router.push('/login'); return; }
        if (data.success && data.data) {
          setItems(data.data);
          setTotal(data.meta?.total ?? 0);
          setTotalPages(data.meta?.totalPages ?? 0);
          setError(null);
        } else {
          const msg = (data as { detail?: string }).detail
            ? `${(data as { error?: string }).error ?? 'Erro'} — ${(data as { detail?: string }).detail}`
            : ((data as { error?: string }).error ?? 'Erro ao carregar');
          setError(msg);
          setItems([]);
        }
      })
      .catch(() => { setError('Erro de conexão.'); setItems([]); })
      .finally(() => setLoading(false));
  }, [page, statusFilter, refreshKey, router]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          <p>{error}</p>
          {error.includes("doesn't exist") || error.includes('conciliacoes_bancarias') ? (
            <p className="mt-2 text-xs">Execute a migration: <code className="bg-red-100 px-1 rounded">database/migrations/20250227_create_conciliacoes_bancarias.sql</code></p>
          ) : null}
        </div>
      )}
      <div className="p-4 border-b border-slate-200 flex gap-2 flex-wrap items-center justify-between">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-slate-200">
          <option value="">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="autorizado">Autorizado</option>
          <option value="ignorado">Ignorado</option>
        </select>
        <Link href="/conciliacao-bancaria/novo" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">Nova conciliação</Link>
      </div>
      {loading ? (
        <div className="p-8 text-center text-slate-500">Carregando...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Conta</th>
                  <th className="text-left p-3">Descrição</th>
                  <th className="text-right p-3">Valor</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3 min-w-[180px]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">Nenhuma conciliação encontrada.</td>
                  </tr>
                ) : (
                  items.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-3 text-slate-700">{r.data_movimentacao}</td>
                      <td className="p-3 text-slate-600">{r.conta_descricao}</td>
                      <td className="p-3 font-medium text-slate-800">{r.descricao}</td>
                      <td className="p-3 text-right font-medium text-slate-800">{formatMoney(r.valor)}</td>
                      <td className="p-3 text-slate-600">{r.tipo === 'entrada' ? 'Entrada' : 'Saída'}</td>
                      <td className="p-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          r.status === 'autorizado' ? 'bg-green-100 text-green-800' :
                          r.status === 'ignorado' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'
                        }`}>{r.status}</span>
                      </td>
                      <CrudActionsCell basePath="/conciliacao-bancaria" id={r.id} entityLabel={r.descricao} onDeleted={refetch} apiBasePath="/conciliacoes" />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-200 flex justify-between items-center text-sm text-slate-600">
              <span>Total: {total} | Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50">Anterior</button>
                <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50">Próxima</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
