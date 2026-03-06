'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CrudActionsCell } from '@/components/CrudActionsCell';

type Item = { id: number; cte_id: number; valor: number; data_despesa: string; categoria_nome: string; cte_numero: string; ativo: number };

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function DespesasViagemList() {
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
    fetch(`/api/despesas-viagem?${q}`)
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { success: false, status: res.status };
        try {
          return { ...JSON.parse(text), status: res.status } as { success: boolean; data?: Item[]; meta?: { total: number; totalPages: number }; error?: string; status: number };
        } catch { return { success: false, status: res.status }; }
      })
      .then((data) => {
        if (data.status === 401) { router.push('/login'); return; }
        if (data.success && data.data) {
          setItems(data.data);
          setTotal(data.meta?.total ?? 0);
          setTotalPages(data.meta?.totalPages ?? 0);
        } else { setError(data.error ?? 'Erro'); setItems([]); }
      })
      .catch(() => { setError('Erro de conexão.'); setItems([]); })
      .finally(() => setLoading(false));
  }, [page, ativoFilter, refreshKey, router]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {error && <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}
      <div className="p-4 border-b border-slate-200 flex gap-2 flex-wrap justify-between items-center">
        <select value={ativoFilter} onChange={(e) => { setAtivoFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-slate-200">
          <option value="1">Ativos</option>
          <option value="0">Inativos</option>
          <option value="all">Todos</option>
        </select>
        <Link href="/despesas-viagem/novo" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">Nova despesa de viagem</Link>
      </div>
      {loading ? <div className="p-8 text-center text-slate-500">Carregando...</div> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left p-3">CTe</th>
                  <th className="text-left p-3">Categoria</th>
                  <th className="text-right p-3">Valor</th>
                  <th className="text-left p-3">Data</th>
                  {ativoFilter === 'all' && <th className="text-left p-3">Ativo</th>}
                  <th className="text-left p-3 min-w-[180px]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={ativoFilter === 'all' ? 6 : 5} className="p-6 text-center text-slate-500">Nenhuma despesa de viagem.</td></tr>
                ) : items.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-800">{r.cte_numero}</td>
                    <td className="p-3 text-slate-600">{r.categoria_nome}</td>
                    <td className="p-3 text-right font-medium text-slate-800">{formatMoney(r.valor)}</td>
                    <td className="p-3 text-slate-600">{r.data_despesa}</td>
                    {ativoFilter === 'all' && <td className="p-3"><span className={`inline-flex px-2 py-0.5 rounded text-xs ${r.ativo ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>{r.ativo ? 'Sim' : 'Não'}</span></td>}
                    <CrudActionsCell basePath="/despesas-viagem" id={r.id} entityLabel={`Despesa #${r.id}`} onDeleted={refetch} />
                  </tr>
                ))}
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
