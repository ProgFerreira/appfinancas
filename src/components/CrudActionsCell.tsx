'use client';

import { useState } from 'react';
import Link from 'next/link';

/* Ícones inline (evita dependência de lib) */
const IconView = () => (
  <svg className="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEdit = () => (
  <svg className="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconTrash = () => (
  <svg className="btn-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

/**
 * Padrão do sistema: todas as telas de listagem exibem as ações
 * Visualizar | Editar | Excluir (Soft Delete) — com ícones.
 */
export type CrudActionsCellProps = {
  /** Base path do módulo (ex: '/clientes', '/despesas-fixas') */
  basePath: string;
  /** ID do registro (aceita number ou string; API/MySQL às vezes retorna string) */
  id: number | string;
  /** Label para confirmação de exclusão (ex: "Cliente João") */
  entityLabel?: string;
  /** Callback após exclusão bem-sucedida (ex: refresh da listagem) */
  onDeleted?: () => void;
  /** Exibir ação Visualizar (default: true) */
  showView?: boolean;
  /** Exibir ação Editar (default: true) */
  showEdit?: boolean;
  /** Exibir ação Excluir - Soft Delete (default: true) */
  showDelete?: boolean;
  /** Ações extras renderizadas após as padrão (ex: link "Registrar pagamento") */
  children?: React.ReactNode;
  /** Path da API para DELETE quando diferente do basePath (ex: basePath="/conciliacao-bancaria" mas API é /api/conciliacoes) */
  apiBasePath?: string;
};

export function CrudActionsCell({
  basePath,
  id,
  entityLabel,
  onDeleted,
  showView = true,
  showEdit = true,
  showDelete = true,
  children,
  apiBasePath,
}: CrudActionsCellProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const idStr = String(id);
  // URL da API DELETE: usa apiBasePath se informado (ex: /conciliacoes), senão basePath (ex: /clientes)
  const apiDeleteUrl = `/api${apiBasePath ?? basePath}/${idStr}`;

  const doDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(apiDeleteUrl, { method: 'DELETE' });
      const text = await res.text();
      let data: { success?: boolean; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // Resposta não é JSON (ex: página de erro HTML)
      }
      if (res.ok && data.success) {
        setConfirming(false);
        onDeleted?.();
      } else {
        alert(data.error ?? 'Erro ao excluir.');
      }
    } catch {
      alert('Erro de conexão ao excluir.');
    } finally {
      setDeleting(false);
    }
  };

  const label = entityLabel ?? `registro #${idStr}`;

  return (
    <td className="p-3">
      <div className="flex flex-wrap items-center gap-1">
        {showView && (
          <Link
            href={`${basePath}/${idStr}/visualizar`}
            className="btn btn-secondary btn-sm btn-icon"
            title="Visualizar"
            aria-label="Visualizar"
          >
            <IconView />
          </Link>
        )}
        {showEdit && (
          <Link
            href={`${basePath}/${idStr}/editar`}
            className="btn btn-primary btn-sm btn-icon"
            title="Editar"
            aria-label="Editar"
          >
            <IconEdit />
          </Link>
        )}
        {showDelete && (
          <>
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="btn btn-danger btn-sm btn-icon"
              title="Excluir"
              aria-label="Excluir"
            >
              <IconTrash />
            </button>
            {confirming && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
                <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-4">
                  <h3 id="confirm-title" className="font-semibold text-slate-800 mb-2">
                    Confirmar exclusão
                  </h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Deseja realmente excluir (inativar) <strong>{label}</strong>? Esta ação pode ser revertida editando o registro e ativando-o novamente.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      disabled={deleting}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={doDelete}
                      disabled={deleting}
                      className="btn btn-danger btn-sm"
                    >
                      {deleting ? 'Excluindo...' : 'Excluir'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        {children && (
          <>
            {children}
          </>
        )}
      </div>
    </td>
  );
}
