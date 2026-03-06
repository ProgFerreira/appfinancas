'use client';

import { useEffect, useState } from 'react';
import type { ClienteCategoria } from '@/types';

const CATEGORIAS: { value: ClienteCategoria['categoria']; label: string }[] = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'funcionario', label: 'Funcionário' },
  { value: 'parceiro', label: 'Parceiro' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'outros', label: 'Outros' },
];

type Props = { clienteId: string };

export function ClienteCategoriasTab({ clienteId }: Props) {
  const [list, setList] = useState<ClienteCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [categoriaToAdd, setCategoriaToAdd] = useState<ClienteCategoria['categoria']>('cliente');

  function load() {
    setLoading(true);
    fetch(`/api/clientes/${clienteId}/categorias`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) setList(data.data);
        else setError(data.error ?? 'Erro ao carregar');
      })
      .catch(() => setError('Erro ao carregar'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (clienteId) load();
  }, [clienteId]);

  const disponiveis = CATEGORIAS.filter((c) => !list.some((l) => l.categoria === c.value));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setAdding(true);
    try {
      const res = await fetch(`/api/clientes/${clienteId}/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoria: categoriaToAdd }),
      });
      const data = await res.json();
      if (data.success) {
        load();
        setCategoriaToAdd(disponiveis[0]?.value ?? 'cliente');
        return;
      }
      setError(data.error ?? 'Erro ao adicionar');
    } catch {
      setError('Erro de conexão');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(cat: ClienteCategoria) {
    if (!confirm(`Remover categoria "${CATEGORIAS.find((c) => c.value === cat.categoria)?.label}"?`)) return;
    setError('');
    const res = await fetch(`/api/clientes/${clienteId}/categorias?categoria_id=${cat.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) load();
    else setError(data.error ?? 'Erro ao remover');
  }

  if (loading) return <div className="p-4 text-slate-500">Carregando categorias...</div>;
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
      )}
      <h3 className="text-base font-medium text-slate-800">Categorias do parceiro</h3>
      <p className="text-sm text-slate-600">
        Um cliente pode ter várias categorias (ex.: Cliente e Fornecedor). Adicione ou remova abaixo.
      </p>
      {disponiveis.length > 0 && (
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Adicionar categoria</label>
            <select
              value={categoriaToAdd}
              onChange={(e) => setCategoriaToAdd(e.target.value as ClienteCategoria['categoria'])}
              className="px-3 py-2 rounded-lg border border-slate-200"
            >
              {disponiveis.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={adding}
            className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {adding ? 'Adicionando...' : 'Adicionar'}
          </button>
        </form>
      )}
      {list.length === 0 ? (
        <p className="text-slate-500 text-sm">Nenhuma categoria vinculada. Use o seletor acima para adicionar.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {list.map((cat) => (
            <li
              key={cat.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-sm"
            >
              <span>{CATEGORIAS.find((c) => c.value === cat.categoria)?.label ?? cat.categoria}</span>
              <button
                type="button"
                onClick={() => handleRemove(cat)}
                className="text-red-600 hover:underline"
                title="Remover"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
