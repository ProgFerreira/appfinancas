'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CrudActionsCell } from '@/components/CrudActionsCell';

type Item = {
  id: number;
  nome: string;
  plano_nome: string;
  ativo: number;
};

export function CategoriasReceitaList() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ativoFilter, setAtivoFilter] = useState('1');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setError(null);
    const q = new URLSearchParams({ page: String(page), per_page: '20', ativo: ativoFilter });
    fetch(`/api/categorias-receita?${q}`)
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { success: false, status: res.status };
        try {
          return { ...JSON.parse(text), status: res.status } as {
            success: boolean;
            data?: Item[];
            meta?: { total: number; totalPages: number };
            error?: string;
            status: number;
          };
        } catch {
          return { success: false, status: res.status };
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
          setError(data.error ?? 'Erro ao carregar');
          setItems([]);
        }
      })
      .catch(() => {
        setError('Erro de conexão.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [page, ativoFilter, refreshKey, router]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}
      <div className="p-4 border-b border-slate-200 flex gap-2 flex-wrap items-center justify-between">
        <select
          value={ativoFilter}
          onChange={(e) => {
            setAtivoFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-slate-200"
        >
          <option value="1">Ativos</option>
          <option value="0">Inativos</option>
          <option value="all">Todos</option>
        </select>
        <Link
          href="/categorias-receita/novo"
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          Nova categoria
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
                  <th className="text-left p-3">Nome</th>
                  <th className="text-left p-3">Plano de contas</th>
                  {ativoFilter === 'all' && <th className="text-left p-3">Ativo</th>}
                  <th className="text-left p-3 min-w-[180px]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={ativoFilter === 'all' ? 4 : 3} className="p-6 text-center text-slate-500">
                      Nenhuma categoria de receita encontrada.
                    </td>
                  </tr>
                ) : (
                  items.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{r.nome}</td>
                      <td className="p-3 text-slate-600">{r.plano_nome}</td>
                      {ativoFilter === 'all' && (
                        <td className="p-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              r.ativo ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {r.ativo ? 'Sim' : 'Não'}
                          </span>
                        </td>
                      )}
                      <CrudActionsCell
                        basePath="/categorias-receita"
                        id={r.id}
                        entityLabel={r.nome}
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
