'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Item = { id: number; conta_bancaria_id: number; tipo_movimentacao: string; descricao: string; valor_original: number; valor_liquido: number; data_movimentacao: string; conta_descricao: string };

type Option = { id: number; descricao: string };

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function MovimentacoesList() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [contas, setContas] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contaFilter, setContaFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetch('/api/cadastros/options').then((res) => res.json()).then((data) => {
      if (data.success && data.data?.contasBancarias) setContas(data.data.contasBancarias);
    });
  }, []);

  useEffect(() => {
    setError(null);
    const q = new URLSearchParams({ page: String(page), per_page: '20' });
    if (contaFilter) q.set('conta_bancaria_id', contaFilter);
    fetch(`/api/movimentacoes?${q}`)
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { success: false, status: res.status };
        try {
          return { ...JSON.parse(text), status: res.status } as { success: boolean; data?: Item[]; meta?: { total: number; totalPages: number }; error?: string; status: number };
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
        } else {
          setError(data.error ?? 'Erro ao carregar');
          setItems([]);
        }
      })
      .catch(() => { setError('Erro de conexão.'); setItems([]); })
      .finally(() => setLoading(false));
  }, [page, contaFilter, router]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {error && <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}
      <div className="p-4 border-b border-slate-200 flex gap-2 flex-wrap items-center justify-between">
        <select value={contaFilter} onChange={(e) => { setContaFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-slate-200">
          <option value="">Todas as contas</option>
          {contas.map((c) => <option key={c.id} value={c.id}>{c.descricao}</option>)}
        </select>
        <Link href="/conciliacao-bancaria" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">Conciliação bancária</Link>
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
                  <th className="text-right p-3">Valor original</th>
                  <th className="text-right p-3">Valor líquido</th>
                  <th className="text-left p-3">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">Nenhuma movimentação encontrada.</td>
                  </tr>
                ) : (
                  items.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-3 text-slate-700">{r.data_movimentacao}</td>
                      <td className="p-3 text-slate-600">{r.conta_descricao ?? '—'}</td>
                      <td className="p-3 font-medium text-slate-800">{r.descricao}</td>
                      <td className="p-3 text-right text-slate-700">{formatMoney(r.valor_original)}</td>
                      <td className="p-3 text-right font-medium text-slate-800">{formatMoney(r.valor_liquido)}</td>
                      <td className="p-3 text-slate-600">{r.tipo_movimentacao === 'entrada' ? 'Entrada' : 'Saída'}</td>
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
