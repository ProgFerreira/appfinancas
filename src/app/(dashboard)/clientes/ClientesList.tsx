'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Cliente } from '@/types';
import { CrudActionsCell } from '@/components/CrudActionsCell';

export function ClientesList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreatedMessage, setShowCreatedMessage] = useState(false);
  const [items, setItems] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [ativoFilter, setAtivoFilter] = useState('1'); // '1' | '0' | 'all'
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

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
    setError(null);
    const q = new URLSearchParams({ page: String(page), per_page: '20', ativo: ativoFilter });
    if (busca.trim()) q.set('q', busca.trim());
    fetch(`/api/clientes?${q}`)
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { success: false, error: 'Resposta vazia', status: res.status };
        try {
          const parsed = JSON.parse(text) as { success: boolean; data?: Cliente[]; meta?: { total: number; totalPages: number }; error?: string; detail?: string };
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
          const msg = data.detail ? `${data.error ?? 'Erro'} — ${data.detail}` : (data.error ?? 'Erro ao carregar clientes');
          setError(msg);
          setItems([]);
        }
      })
      .catch(() => {
        setError('Erro de conexão. Verifique se o banco está acessível. Abra /api/db/health para o erro exato.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [page, busca, ativoFilter, refreshKey, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setLoading(true);
    setError(null);
    const q = new URLSearchParams({ page: '1', per_page: '20', ativo: ativoFilter });
    if (busca.trim()) q.set('q', busca.trim());
    fetch(`/api/clientes?${q}`)
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { success: false, error: 'Resposta vazia', status: res.status };
        try {
          const parsed = JSON.parse(text) as { success: boolean; data?: Cliente[]; meta?: { total: number; totalPages: number }; error?: string; detail?: string };
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
          const msg = data.detail ? `${data.error ?? 'Erro'} — ${data.detail}` : (data.error ?? 'Erro ao carregar clientes');
          setError(msg);
          setItems([]);
        }
      })
      .catch(() => {
        setError('Erro de conexão. Verifique se o banco está acessível. Abra /api/db/health para o erro exato.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {showCreatedMessage && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between">
          <span>Cliente cadastrado com sucesso. Ele aparece na listagem abaixo.</span>
          <button type="button" onClick={() => setShowCreatedMessage(false)} className="text-green-600 hover:text-green-800" aria-label="Fechar">×</button>
        </div>
      )}
      {error && (
        <div className="mx-4 mt-4 p-4 rounded-lg bg-red-50 border-2 border-red-300 text-red-800 text-sm space-y-1">
          <p className="font-medium">Erro (exibido na tela para debug)</p>
          <p className="whitespace-pre-wrap break-words">{error}</p>
          <p className="text-xs mt-2">
            <a href="/api/db/health" target="_blank" rel="noopener noreferrer" className="underline">Verificar conexão com o banco (/api/db/health)</a>
          </p>
        </div>
      )}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-wrap flex-1 min-w-0">
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, CNPJ, e-mail..."
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={ativoFilter}
            onChange={(e) => { setAtivoFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="1">Ativos</option>
            <option value="0">Inativos</option>
            <option value="all">Todos</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Buscar
          </button>
        </form>
        <Link
          href="/clientes/novo"
          className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 shrink-0"
        >
          Novo cliente
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
                  <th className="text-left p-3">Razão social</th>
                  <th className="text-left p-3">CNPJ/CPF</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Classif.</th>
                  <th className="text-left p-3">E-mail</th>
                  <th className="text-left p-3">Cidade/UF</th>
                  {ativoFilter === 'all' && <th className="text-left p-3">Ativo</th>}
                  <th className="text-left p-3 min-w-[180px]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={ativoFilter === 'all' ? 9 : 8} className="p-6 text-center text-slate-500">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  items.map((c) => (
                    <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{c.nome}</td>
                      <td className="p-3 text-slate-600">{c.razao_social ?? '—'}</td>
                      <td className="p-3 text-slate-600">{c.cnpj_cpf ?? '—'}</td>
                      <td className="p-3 text-slate-600">{c.tipo_cadastro}</td>
                      <td className="p-3 text-slate-600">{c.classificacao ?? '—'}</td>
                      <td className="p-3 text-slate-600">{c.email ?? '—'}</td>
                      <td className="p-3 text-slate-600">
                        {[c.municipio, c.uf].filter(Boolean).join(' / ') || '—'}
                      </td>
                      {ativoFilter === 'all' && (
                        <td className="p-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${c.ativo ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                            {c.ativo ? 'Sim' : 'Não'}
                          </span>
                        </td>
                      )}
                      <CrudActionsCell
                        basePath="/clientes"
                        id={c.id}
                        entityLabel={c.nome}
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
