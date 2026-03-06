'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ContaReceber } from '@/types';
import { CrudActionsCell } from '@/components/CrudActionsCell';

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString('pt-BR');
}

type Options = { contasBancarias: { id: number; descricao: string }[]; categoriasReceita: { id: number; nome: string }[] };

export function ContasReceberList() {
  const router = useRouter();
  const [items, setItems] = useState<(ContaReceber & { cliente_nome?: string; categoria_receita_nome?: string; plano_contas_nome?: string; conta_bancaria_descricao?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<Options | null>(null);
  const [situacao, setSituacao] = useState('');
  const [dataVencDe, setDataVencDe] = useState('');
  const [dataVencAte, setDataVencAte] = useState('');
  const [contaBancariaId, setContaBancariaId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [busca, setBusca] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    fetch('/api/cadastros/options').then((r) => r.json()).then((j) => { if (j.success && j.data) setOptions(j.data); });
  }, []);

  useEffect(() => {
    setError(null);
    const q = new URLSearchParams({ page: String(page), per_page: '20' });
    if (situacao) q.set('situacao', situacao);
    if (dataVencDe) q.set('data_vencimento_de', dataVencDe);
    if (dataVencAte) q.set('data_vencimento_ate', dataVencAte);
    if (contaBancariaId) q.set('conta_bancaria_id', contaBancariaId);
    if (categoriaId) q.set('categoria_id', categoriaId);
    if (busca.trim()) q.set('q', busca.trim());
    fetch(`/api/contas-receber?${q}`)
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { success: false, error: 'Resposta vazia', status: res.status };
        try {
          return { ...JSON.parse(text), status: res.status } as { success: boolean; data?: (ContaReceber & { cliente_nome?: string; categoria_receita_nome?: string; plano_contas_nome?: string; conta_bancaria_descricao?: string })[]; meta?: { total: number; totalPages: number }; error?: string; detail?: string; status: number };
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
          const msg = data.detail ? `${data.error ?? 'Erro'} — ${data.detail}` : (data.error ?? 'Erro ao carregar');
          setError(msg);
          setItems([]);
        }
      })
      .catch(() => {
        setError('Erro de conexão. Verifique se o banco está acessível. Abra /api/db/health para o erro exato.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [page, situacao, dataVencDe, dataVencAte, contaBancariaId, categoriaId, busca, refreshKey, router]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm space-y-1">
          <p>{error}</p>
          <p className="text-xs">
            <a href="/api/db/health" target="_blank" rel="noopener noreferrer" className="underline">Verificar conexão com o banco (/api/db/health)</a>
          </p>
        </div>
      )}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={situacao}
              onChange={(e) => { setSituacao(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm"
            >
              <option value="">Todas situações</option>
              <option value="em_aberto">Em aberto</option>
              <option value="parcial">Parcial</option>
              <option value="recebido">Recebido</option>
            </select>
            <input type="date" value={dataVencDe} onChange={(e) => { setDataVencDe(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-slate-300 text-sm max-w-[140px]" title="Venc. de" />
            <input type="date" value={dataVencAte} onChange={(e) => { setDataVencAte(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-slate-300 text-sm max-w-[140px]" title="Venc. até" />
            <select value={contaBancariaId} onChange={(e) => { setContaBancariaId(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-slate-300 text-sm min-w-[160px]">
              <option value="">Todas as contas</option>
              {(options?.contasBancarias ?? []).map((c) => <option key={c.id} value={c.id}>{c.descricao}</option>)}
            </select>
            <select value={categoriaId} onChange={(e) => { setCategoriaId(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg border border-slate-300 text-sm min-w-[160px]">
              <option value="">Todas categorias</option>
              {(options?.categoriasReceita ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), setPage(1))} placeholder="Cliente ou descrição" className="px-3 py-2 rounded-lg border border-slate-300 text-sm w-48" />
            <button type="button" onClick={() => setPage(1)} className="btn btn-secondary btn-sm">Filtrar</button>
          </div>
          <Link href="/contas-receber/novo" className="btn btn-primary">Nova conta a receber</Link>
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
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Descrição</th>
                  <th className="text-right p-3">Valor</th>
                  <th className="text-left p-3">Emissão</th>
                  <th className="text-left p-3">Vencimento</th>
                  <th className="text-left p-3">Categoria</th>
                  <th className="text-left p-3">Plano</th>
                  <th className="text-left p-3">Conta</th>
                  <th className="text-left p-3">Situação</th>
                  <th className="text-left p-3 min-w-[220px]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-slate-500">
                      Nenhum título encontrado.
                    </td>
                  </tr>
                ) : (
                  items.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{r.cliente_nome ?? '—'}</td>
                      <td className="p-3 text-slate-600">{r.descricao ?? '—'}</td>
                      <td className="p-3 text-right font-medium text-slate-800">{formatMoney(r.valor)}</td>
                      <td className="p-3 text-slate-600">{formatDate(r.data_emissao)}</td>
                      <td className="p-3 text-slate-600">{formatDate(r.data_vencimento)}</td>
                      <td className="p-3 text-slate-600">{r.categoria_receita_nome ?? '—'}</td>
                      <td className="p-3 text-slate-600">{r.plano_contas_nome ?? '—'}</td>
                      <td className="p-3 text-slate-600">{r.conta_bancaria_descricao ?? '—'}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            r.situacao === 'recebido'
                              ? 'bg-green-100 text-green-800'
                              : r.situacao === 'parcial'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {r.situacao}
                        </span>
                      </td>
                      <CrudActionsCell
                        basePath="/contas-receber"
                        id={r.id}
                        entityLabel={r.descricao ?? `#${r.id}`}
                        onDeleted={refetch}
                      >
                        {(r.situacao === 'em_aberto' || r.situacao === 'parcial') && (
                          <Link
                            href={`/contas-receber/${r.id}/baixa`}
                            className="text-indigo-600 hover:underline text-sm"
                          >
                            Registrar recebimento
                          </Link>
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
