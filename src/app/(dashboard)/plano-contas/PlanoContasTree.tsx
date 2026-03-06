'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CrudActionsCell } from '@/components/CrudActionsCell';

type Item = { id: number; codigo: string; nome: string; plano_pai_id: number | null; tipo_conta: string; eh_receita: number; eh_despesa: number; ativo: number; pai_codigo: string | null };

type Node = Item & { children: Node[] };

function buildTree(items: Item[]): Node[] {
  const byId = new Map<number, Node>();
  items.forEach((it) => byId.set(it.id, { ...it, children: [] }));
  const roots: Node[] = [];
  items.forEach((it) => {
    const node = byId.get(it.id)!;
    if (it.plano_pai_id == null) {
      roots.push(node);
    } else {
      const parent = byId.get(it.plano_pai_id);
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
  });
  roots.sort((a, b) => (a.codigo < b.codigo ? -1 : 1));
  roots.forEach((r) => r.children.sort((a, b) => (a.codigo < b.codigo ? -1 : 1)));
  return roots;
}

function TreeRow({ node, depth, ativoFilter, onDeleted }: { node: Node; depth: number; ativoFilter: string; onDeleted: () => void }) {
  return (
    <>
      <tr className="border-t border-slate-100 hover:bg-slate-50">
        <td className="p-3 font-mono font-medium text-slate-800" style={{ paddingLeft: `${12 + depth * 20}px` }}>
          {depth > 0 && <span className="text-slate-300 mr-1">└</span>}
          {node.codigo}
        </td>
        <td className="p-3 text-slate-800">{node.nome}</td>
        <td className="p-3 text-slate-600">{node.pai_codigo ?? '—'}</td>
        <td className="p-3 text-slate-600">{node.tipo_conta}</td>
        <td className="p-3">{node.eh_receita ? 'Sim' : 'Não'}</td>
        <td className="p-3">{node.eh_despesa ? 'Sim' : 'Não'}</td>
        {ativoFilter === 'all' && (
          <td className="p-3">
            <span className={`inline-flex px-2 py-0.5 rounded text-xs ${node.ativo ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
              {node.ativo ? 'Sim' : 'Não'}
            </span>
          </td>
        )}
        <td className="p-3">
          <CrudActionsCell basePath="/plano-contas" id={node.id} entityLabel={`${node.codigo} ${node.nome}`} onDeleted={onDeleted} />
        </td>
      </tr>
      {node.children.map((child) => (
        <TreeRow key={child.id} node={child} depth={depth + 1} ativoFilter={ativoFilter} onDeleted={onDeleted} />
      ))}
    </>
  );
}

export function PlanoContasTree() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ativoFilter, setAtivoFilter] = useState('1');
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setError(null);
    fetch(`/api/plano-contas?ativo=${ativoFilter}`)
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
  }, [ativoFilter, refreshKey, router]);

  const tree = useMemo(() => buildTree(items), [items]);

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
          onChange={(e) => setAtivoFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200"
        >
          <option value="1">Ativos</option>
          <option value="0">Inativos</option>
          <option value="all">Todos</option>
        </select>
      </div>
      {loading ? (
        <div className="p-8 text-center text-slate-500">Carregando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left p-3">Código</th>
                <th className="text-left p-3">Nome</th>
                <th className="text-left p-3">Conta pai</th>
                <th className="text-left p-3">Tipo</th>
                <th className="text-left p-3">Receita</th>
                <th className="text-left p-3">Despesa</th>
                {ativoFilter === 'all' && <th className="text-left p-3">Ativo</th>}
                <th className="text-left p-3 min-w-[180px]">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tree.length === 0 ? (
                <tr>
                  <td colSpan={ativoFilter === 'all' ? 8 : 7} className="p-6 text-center text-slate-500">
                    Nenhuma conta.
                  </td>
                </tr>
              ) : (
                tree.map((node) => <TreeRow key={node.id} node={node} depth={0} ativoFilter={ativoFilter} onDeleted={refetch} />)
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
