'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CrudActionsCell } from '@/components/CrudActionsCell';

type Item = {
  id: number;
  nome: string;
  descricao: string | null;
  ativo: number;
  created_at: string;
};

export function PerfisList() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setError(null);
    fetch('/api/perfis')
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        if (data.success && data.data) {
          setItems(data.data);
        } else {
          setError(data.error ?? 'Erro ao carregar perfis.');
          setItems([]);
        }
      })
      .catch(() => {
        setError('Erro de conexão.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [refreshKey, router]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}
      <div className="p-4 border-b border-slate-200 flex justify-end">
        <Link
          href="/perfis/novo"
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          Novo perfil
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
                  <th className="text-left p-3">Descrição</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3 min-w-[180px]">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-slate-500">
                      Nenhum perfil cadastrado. Crie um perfil para controlar acessos por tela.
                    </td>
                  </tr>
                ) : (
                  items.map((r) => (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-medium text-slate-800">{r.nome}</td>
                      <td className="p-3 text-slate-600">{r.descricao ?? '—'}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                            r.ativo ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {r.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <CrudActionsCell
                        basePath="/perfis"
                        id={r.id}
                        entityLabel={r.nome}
                        onDeleted={refetch}
                        showView={false}
                      />
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
