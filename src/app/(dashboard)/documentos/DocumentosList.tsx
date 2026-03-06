'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Documento } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Retorna o início da descrição com reticências se passar do limite. */
function truncarDescricao(texto: string | null | undefined, maxLen = 80): string {
  if (texto == null || typeof texto !== 'string') return '—';
  const t = texto.trim();
  if (!t) return '—';
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen)}…`;
}

/** Formata data (YYYY-MM-DD ou ISO) para pt-BR. Evita "Invalid Date". */
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

/** Formata data/hora (ISO ou MySQL datetime) para pt-BR. */
function formatDateTime(dateStr: string | null | undefined): string {
  if (dateStr == null || String(dateStr).trim() === '') return '—';
  const s = String(dateStr).trim();
  try {
    const iso = s.length === 10 ? `${s}T12:00:00.000Z` : s.replace(' ', 'T');
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

/** Retorna número de dias até o vencimento (negativo = já vencido). */
function diasAteVencimento(dataVencimento: string | null | undefined): number | null {
  if (dataVencimento == null || String(dataVencimento).trim() === '') return null;
  const s = String(dataVencimento).trim();
  const iso = s.length === 10 ? `${s}T12:00:00.000Z` : s.replace(' ', 'T');
  const ven = new Date(iso);
  if (Number.isNaN(ven.getTime())) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  ven.setHours(0, 0, 0, 0);
  return Math.floor((ven.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

/** Retorna 'vencido' | 'proximo' (≤30 dias) | null */
function vencimentoAlerta(dataVencimento: string | null | undefined): 'vencido' | 'proximo' | null {
  const dias = diasAteVencimento(dataVencimento);
  if (dias === null) return null;
  if (dias < 0) return 'vencido';
  if (dias <= 30) return 'proximo';
  return null;
}

/** Texto "Faltam X dias para vencer" / "Vence hoje" / "Vencido há X dias". */
function textoFaltamDias(dataVencimento: string | null | undefined): string {
  const dias = diasAteVencimento(dataVencimento);
  if (dias === null) return '';
  if (dias < 0) return `Vencido há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'dia' : 'dias'}`;
  if (dias === 0) return 'Vence hoje';
  if (dias === 1) return 'Falta 1 dia para vencer';
  return `Faltam ${dias} dias para vencer`;
}

export function DocumentosList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreatedMessage, setShowCreatedMessage] = useState(false);
  const [items, setItems] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [tipos, setTipos] = useState<{ id: number; nome: string }[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; nome: string } | null>(null);

  useEffect(() => {
    fetch('/api/documento-tipos?ativo=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setTipos(data.data.map((t: { id: number; nome: string }) => ({ id: t.id, nome: t.nome })));
        }
      })
      .catch(() => {});
  }, []);

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
    const q = new URLSearchParams({ page: String(page), per_page: '20' });
    if (busca.trim()) q.set('q', busca.trim());
    if (tipoFilter) q.set('tipo_documento_id', tipoFilter);
    fetch(`/api/documentos?${q}`)
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { success: false, error: 'Resposta vazia', status: res.status };
        try {
          const parsed = JSON.parse(text) as {
            success: boolean;
            data?: Documento[];
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
          const msg = (data as { detail?: string }).detail
            ? `${(data as { error?: string }).error ?? 'Erro'} — ${(data as { detail?: string }).detail}`
            : ((data as { error?: string }).error ?? 'Erro ao carregar documentos.');
          setError(msg);
          setItems([]);
        }
      })
      .catch(() => {
        setError('Erro de conexão.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [page, busca, tipoFilter, refreshKey, router]);

  const handleDelete = async (id: number) => {
    setConfirmDelete(null);
    setDeletingId(id);
    try {
      const res = await fetch(`/api/documentos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) refetch();
      else alert(data.error ?? 'Erro ao excluir.');
    } catch {
      alert('Erro de conexão.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {showCreatedMessage && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm flex items-center justify-between">
          <span>Documento enviado com sucesso.</span>
          <button type="button" onClick={() => setShowCreatedMessage(false)} className="text-green-600 hover:text-green-800" aria-label="Fechar">×</button>
        </div>
      )}
      {error && (
        <div className="mx-4 mt-4 p-4 rounded-lg bg-red-50 border-2 border-red-300 text-red-800 text-sm">{error}</div>
      )}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center gap-2">
        <form
          onSubmit={(e) => { e.preventDefault(); setPage(1); }}
          className="flex gap-2 flex-wrap flex-1 min-w-0"
        >
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou descrição..."
            className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={tipoFilter}
            onChange={(e) => { setTipoFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos os tipos</option>
            {tipos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nome}
              </option>
            ))}
          </select>
          <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Buscar</button>
        </form>
        <Link href="/documentos/novo" className="px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700 shrink-0">
          Enviar documento
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
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Arquivo</th>
                  <th className="text-left p-3 max-w-[200px]">Descrição</th>
                  <th className="text-left p-3">Vencimento</th>
                  <th className="text-left p-3">Postado em</th>
                  <th className="text-left p-3">Tamanho</th>
                  <th className="text-left p-3">Enviado por</th>
                  <th className="text-left p-3 min-w-[220px]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-6 text-center text-slate-500">
                      Nenhum documento encontrado. Apenas documentos que você pode visualizar aparecem aqui.
                    </td>
                  </tr>
                ) : (
                  items.map((doc) => {
                    const alerta = vencimentoAlerta(doc.data_vencimento);
                    return (
                    <tr key={doc.id} className={`border-t border-slate-100 hover:bg-slate-50 ${alerta === 'vencido' ? 'bg-red-50/50' : alerta === 'proximo' ? 'bg-amber-50/50' : ''}`}>
                      <td className="p-3 font-medium text-slate-800">{doc.nome}</td>
                      <td className="p-3 text-slate-600">{doc.tipo_documento_nome ?? '—'}</td>
                      <td className="p-3 text-slate-600">{doc.nome_arquivo}</td>
                      <td className="p-3 text-slate-600 max-w-[200px]" title={doc.descricao ?? undefined}>
                        {truncarDescricao(doc.descricao)}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-600">{formatDate(doc.data_vencimento)}</span>
                          {doc.data_vencimento && (
                            <span className={`text-xs ${alerta === 'vencido' ? 'text-red-600' : alerta === 'proximo' ? 'text-amber-700' : 'text-slate-500'}`}>
                              {textoFaltamDias(doc.data_vencimento)}
                            </span>
                          )}
                        </div>
                        {alerta === 'vencido' && (
                          <span className="mt-1 inline-flex px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800" title="Documento vencido">
                            Vencido
                          </span>
                        )}
                        {alerta === 'proximo' && (
                          <span className="mt-1 inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800" title="Vence em até 30 dias">
                            Próximo do vencimento
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-600" title={doc.created_at ?? undefined}>
                        {formatDateTime(doc.created_at)}
                      </td>
                      <td className="p-3 text-slate-600">{formatBytes(doc.tamanho)}</td>
                      <td className="p-3 text-slate-600">{doc.created_by_nome ?? '—'}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-1">
                          {doc.can_view ? (
                            <Link
                              href={`/documentos/${doc.id}/visualizar`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs"
                            >
                              Visualizar
                            </Link>
                          ) : null}
                          {doc.can_download ? (
                            <a
                              href={`/api/documentos/${doc.id}/download`}
                              download
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs"
                            >
                              Baixar
                            </a>
                          ) : null}
                          {doc.can_edit ? (
                            <Link
                              href={`/documentos/${doc.id}/editar`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 text-xs"
                            >
                              Editar
                            </Link>
                          ) : null}
                          {doc.can_edit ? (
                            <Link
                              href={`/documentos/${doc.id}/permissoes`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs"
                            >
                              Permissões
                            </Link>
                          ) : null}
                          {doc.can_delete ? (
                            <button
                              type="button"
                              onClick={() => setConfirmDelete({ id: doc.id, nome: doc.nome })}
                              disabled={deletingId === doc.id}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-xs disabled:opacity-50"
                            >
                              {deletingId === doc.id ? 'Excluindo...' : 'Excluir'}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ); })
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

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-4">
            <h3 className="font-semibold text-slate-800 mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-slate-600 mb-4">
              Deseja realmente excluir o documento <strong>{confirmDelete.nome}</strong>? O arquivo será removido.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmDelete(null)} className="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50">Cancelar</button>
              <button type="button" onClick={() => handleDelete(confirmDelete.id)} className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
