'use client';

import { useEffect, useState } from 'react';
import type { ClienteDadoBancario } from '@/types';

type Props = { clienteId: string };

export function ClienteDadosBancariosTab({ clienteId }: Props) {
  const [list, setList] = useState<ClienteDadoBancario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ClienteDadoBancario | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    favorecido: '',
    cnpj_cpf: '',
    banco: '',
    agencia: '',
    conta: '',
    operacao: '',
    pix: '',
    observacoes: '',
    ativo: 1,
  });

  function load() {
    setLoading(true);
    fetch(`/api/clientes/${clienteId}/dados-bancarios`)
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
    setForm({
      favorecido: '', cnpj_cpf: '', banco: '', agencia: '', conta: '', operacao: '', pix: '', observacoes: '', ativo: 1,
    });
    setShowForm(true);
  }

  function openEdit(d: ClienteDadoBancario) {
    setEditing(d);
    setForm({
      favorecido: d.favorecido ?? '',
      cnpj_cpf: d.cnpj_cpf ?? '',
      banco: d.banco ?? '',
      agencia: d.agencia ?? '',
      conta: d.conta ?? '',
      operacao: d.operacao ?? '',
      pix: d.pix ?? '',
      observacoes: d.observacoes ?? '',
      ativo: d.ativo ?? 1,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const url = editing
        ? `/api/clientes/${clienteId}/dados-bancarios/${editing.id}`
        : `/api/clientes/${clienteId}/dados-bancarios`;
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          favorecido: form.favorecido.trim(),
          banco: form.banco.trim(),
        }),
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

  async function handleDelete(d: ClienteDadoBancario) {
    if (!confirm(`Excluir dados bancários de "${d.favorecido}"?`)) return;
    setError('');
    const res = await fetch(`/api/clientes/${clienteId}/dados-bancarios/${d.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) load();
    else setError(data.error ?? 'Erro ao excluir');
  }

  if (loading) return <div className="p-4 text-slate-500">Carregando dados bancários...</div>;
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
      )}
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium text-slate-800">Dados bancários</h3>
        <button
          type="button"
          onClick={openNew}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
        >
          + Novo
        </button>
      </div>
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-medium text-slate-700 mb-3">{editing ? 'Editar' : 'Novo registro'}</h4>
          <form onSubmit={handleSubmit} className="form-grid space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Favorecido</label>
              <input
                type="text"
                value={form.favorecido}
                onChange={(e) => setForm((f) => ({ ...f, favorecido: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">CNPJ/CPF</label>
              <input
                type="text"
                value={form.cnpj_cpf}
                onChange={(e) => setForm((f) => ({ ...f, cnpj_cpf: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Banco</label>
              <input
                type="text"
                value={form.banco}
                onChange={(e) => setForm((f) => ({ ...f, banco: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Agência</label>
              <input
                type="text"
                value={form.agencia}
                onChange={(e) => setForm((f) => ({ ...f, agencia: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Conta</label>
              <input
                type="text"
                value={form.conta}
                onChange={(e) => setForm((f) => ({ ...f, conta: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Operação</label>
              <input
                type="text"
                value={form.operacao}
                onChange={(e) => setForm((f) => ({ ...f, operacao: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">PIX</label>
              <input
                type="text"
                value={form.pix}
                onChange={(e) => setForm((f) => ({ ...f, pix: e.target.value }))}
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
        <p className="text-slate-500 text-sm">Nenhum dado bancário cadastrado.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 font-medium text-slate-700">Favorecido</th>
                <th className="text-left py-2 px-2 font-medium text-slate-700">Banco</th>
                <th className="text-left py-2 px-2 font-medium text-slate-700">Agência / Conta</th>
                <th className="text-left py-2 px-2 font-medium text-slate-700 w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-2">{d.favorecido}</td>
                  <td className="py-2 px-2 text-slate-600">{d.banco}</td>
                  <td className="py-2 px-2 text-slate-600">{[d.agencia, d.conta].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="py-2 px-2">
                    <button
                      type="button"
                      onClick={() => openEdit(d)}
                      className="text-indigo-600 hover:underline mr-2"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(d)}
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
