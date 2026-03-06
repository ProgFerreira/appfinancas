'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Cte } from '@/types';
import { CrudActionsCell } from '@/components/CrudActionsCell';

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
function formatDate(s: string | null) {
  return s ? new Date(s).toLocaleDateString('pt-BR') : '—';
}

export function CtesList() {
  const router = useRouter();
  const [items, setItems] = useState<(Cte & { cliente_nome?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ativo, setAtivo] = useState('1');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setError(null);
    const q = new URLSearchParams({ page: String(page), per_page: '20' });
    if (ativo !== 'all') q.set('ativo', ativo);
    fetch(`/api/ctes?${q}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setItems(data.data);
          setTotal(data.meta?.total ?? 0);
          setTotalPages(data.meta?.totalPages ?? 0);
        } else {
          setError(data.error ?? 'Erro ao carregar');
          setItems([]);
        }
      })
      .catch(() => {
        setError('Erro de conexão.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [page, ativo]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
      )}
      <div className="p-4 border-b border-slate-200 flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select
            value={ativo}
            onChange={(e) => { setAtivo(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="1">Ativos</option>
            <option value="0">Inativos</option>
            <option value="all">Todos</option>
          </select>
          <Link
            href="/ctes/novo"
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Novo CTe
          </Link>
        </div>
      </div>
      {loading ? (
        <div className="p-8 text-center text-slate-500">Carregando...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left p-3">Número</th>
                  <th className="text-left p-3">Série</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Emissão</th>
                  <th className="text-right p-3">Valor frete</th>
                  <th className="text-left p-3">Origem / Destino</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3 min-w-[180px]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500">
                      Nenhum CTe encontrado.
                    </td>
                  </tr>
                ) : (
                  items.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{r.numero}</td>
                      <td className="p-3 text-slate-600">{r.serie ?? '—'}</td>
                      <td className="p-3 text-slate-600">{r.cliente_nome ?? '—'}</td>
                      <td className="p-3 text-slate-600">{formatDate(r.data_emissao)}</td>
                      <td className="p-3 text-right font-medium text-slate-800">{formatMoney(r.valor_frete)}</td>
                      <td className="p-3 text-slate-600 text-xs">
                        {[r.origem, r.destino].filter(Boolean).join(' → ') || '—'}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
                          {r.status ?? 'em_aberto'}
                        </span>
                      </td>
                      <CrudActionsCell
                        basePath="/ctes"
                        id={r.id}
                        entityLabel={`CTe ${r.numero}`}
                        onDeleted={refetch}
                      />
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
