'use client';

import { useEffect, useState } from 'react';
import type { ClienteContato } from '@/types';

const TIPOS = [
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'outros', label: 'Outros' },
];

type Props = { clienteId: string };

export function ClienteContatosTab({ clienteId }: Props) {
  const [list, setList] = useState<ClienteContato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClienteContato | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    tipo: 'comercial' as 'financeiro' | 'comercial' | 'outros',
    nome: '',
    telefone: '',
    whatsapp: '',
    email: '',
    observacoes: '',
    ativo: 1,
  });

  function load() {
    setLoading(true);
    fetch(`/api/clientes/${clienteId}/contatos`)
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

  function openNew() {
    setEditing(null);
    setForm({ tipo: 'comercial', nome: '', telefone: '', whatsapp: '', email: '', observacoes: '', ativo: 1 });
    setShowForm(true);
  }

  function openEdit(c: ClienteContato) {
    setEditing(c);
    setForm({
      tipo: c.tipo as 'financeiro' | 'comercial' | 'outros',
      nome: c.nome ?? '',
      telefone: c.telefone ?? '',
      whatsapp: c.whatsapp ?? '',
      email: c.email ?? '',
      observacoes: c.observacoes ?? '',
      ativo: c.ativo ?? 1,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const url = editing
        ? `/api/clientes/${clienteId}/contatos/${editing.id}`
        : `/api/clientes/${clienteId}/contatos`;
      const method = editing ? 'PUT' : 'POST';
      const body = editing
        ? { ...form, nome: form.nome.trim() }
        : { ...form, nome: form.nome.trim() };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setShowForm(false);
        load();
        return;
      }
      setError(data.error ?? 'Erro ao salvar');
    } catch {
      setError('Erro de conexão');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: ClienteContato) {
    if (!confirm(`Excluir contato "${c.nome}"?`)) return;
    setError('');
    const res = await fetch(`/api/clientes/${clienteId}/contatos/${c.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) load();
    else setError(data.error ?? 'Erro ao excluir');
  }

  if (loading) return <div className="p-4 text-slate-500">Carregando contatos...</div>;
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
      )}
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium text-slate-800">Contatos</h3>
        <button
          type="button"
          onClick={openNew}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
        >
          + Novo contato
        </button>
      </div>
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-medium text-slate-700 mb-3">{editing ? 'Editar contato' : 'Novo contato'}</h4>
          <form onSubmit={handleSubmit} className="form-grid space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as 'financeiro' | 'comercial' | 'outros' }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                {TIPOS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nome</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Telefone</label>
              <input
                type="text"
                value={form.telefone}
                onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">WhatsApp</label>
              <input
                type="text"
                value={form.whatsapp}
                onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div className="xl:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">Observações</label>
              <textarea
                rows={2}
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={!!form.ativo}
                  onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked ? 1 : 0 }))}
                  className="rounded border-slate-300"
                />
                Ativo
              </label>
            </div>
            <div className="flex gap-2 xl:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
      {list.length === 0 && !showForm ? (
        <p className="text-slate-500 text-sm">Nenhum contato cadastrado. Clique em &quot;Novo contato&quot; para adicionar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 font-medium text-slate-700">Tipo</th>
                <th className="text-left py-2 px-2 font-medium text-slate-700">Nome</th>
                <th className="text-left py-2 px-2 font-medium text-slate-700">Telefone</th>
                <th className="text-left py-2 px-2 font-medium text-slate-700">E-mail</th>
                <th className="text-left py-2 px-2 font-medium text-slate-700 w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-2 text-slate-600">{TIPOS.find((t) => t.value === c.tipo)?.label ?? c.tipo}</td>
                  <td className="py-2 px-2">{c.nome}</td>
                  <td className="py-2 px-2 text-slate-600">{c.telefone ?? '—'}</td>
                  <td className="py-2 px-2 text-slate-600">{c.email ?? '—'}</td>
                  <td className="py-2 px-2">
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      className="text-indigo-600 hover:underline mr-2"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(c)}
                      className="text-red-600 hover:underline"
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
