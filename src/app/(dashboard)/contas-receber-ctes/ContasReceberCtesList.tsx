'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Vinculo = { id: number; conta_receber_id: number; cte_id: number; valor: number; created_at: string; conta_descricao: string; cliente_nome: string; cte_numero: string };

export function ContasReceberCtesList() {
  const router = useRouter();
  const [items, setItems] = useState<Vinculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setError(null);
    fetch('/api/contas-receber-ctes')
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 401) {
          router.push('/login');
          return;
        }
        if (data.success && data.data) setItems(data.data);
        else {
          setError(data.error ?? 'Erro');
          setItems([]);
        }
      })
      .catch(() => {
        setError('Erro de conexão.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [refreshKey, router]);

  function handleDelete(id: number) {
    if (!confirm('Desvincular este CTe da conta a receber?')) return;
    fetch(`/api/contas-receber-ctes/${id}`, { method: 'DELETE' })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) refetch();
        else alert(data.error ?? 'Erro ao excluir');
      })
      .catch(() => alert('Erro de conexão'));
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-BR');

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}
      {loading ? (
        <div className="p-8 text-center text-slate-500">Carregando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-3">Conta a receber</th>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3">CTe</th>
                <th className="text-right p-3">Valor</th>
                <th className="text-left p-3">Criado em</th>
                <th className="text-left p-3 w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Nenhum vínculo cadastrado. Use o formulário abaixo para vincular um CTe a uma conta a receber.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 text-slate-800">{r.conta_descricao ?? `#${r.conta_receber_id}`}</td>
                    <td className="p-3 text-slate-600">{r.cliente_nome}</td>
                    <td className="p-3 font-mono text-slate-800">{r.cte_numero}</td>
                    <td className="p-3 text-right font-medium text-slate-800">{fmt(r.valor)}</td>
                    <td className="p-3 text-slate-600">{fmtDate(r.created_at)}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Desvincular
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
