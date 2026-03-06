'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';
import type { DocumentoTipo } from '@/types';

export default function TiposDocumentoPage() {
  const [items, setItems] = useState<DocumentoTipo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ nome: '', ordem: 0, ativo: 1 });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchList = useCallback(() => {
    setError(null);
    fetch('/api/documento-tipos')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) setItems(data.data);
        else setError(data.error ?? 'Erro ao carregar.');
      })
      .catch(() => setError('Erro de conexão.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      setMessage({ type: 'error', text: 'Nome é obrigatório.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    const url = editingId ? `/api/documento-tipos/${editingId}` : '/api/documento-tipos';
    const method = editingId ? 'PUT' : 'POST';
    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: form.nome.trim(),
        ordem: form.ordem,
        ativo: form.ativo,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessage({ type: 'success', text: editingId ? 'Tipo atualizado.' : 'Tipo cadastrado.' });
          setForm({ nome: '', ordem: 0, ativo: 1 });
          setEditingId(null);
          fetchList();
        } else {
          setMessage({ type: 'error', text: data.error ?? 'Erro ao salvar.' });
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Erro de conexão.' }))
      .finally(() => setSaving(false));
  }

  function startEdit(t: DocumentoTipo) {
    setEditingId(t.id);
    setForm({ nome: t.nome, ordem: t.ordem, ativo: t.ativo });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ nome: '', ordem: 0, ativo: 1 });
  }

  function handleDelete(id: number, nome: string) {
    if (!confirm(`Excluir o tipo "${nome}"? Os documentos que usam este tipo ficarão sem tipo.`)) return;
    fetch(`/api/documento-tipos/${id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setMessage({ type: 'success', text: 'Tipo excluído.' });
          fetchList();
          if (editingId === id) cancelEdit();
        } else {
          setMessage({ type: 'error', text: data.error ?? 'Erro ao excluir.' });
        }
      })
      .catch(() => setMessage({ type: 'error', text: 'Erro de conexão.' }));
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Documentos', href: '/documentos' },
          { label: 'Tipos de documento' },
        ]}
      />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-800">Tipos de documento</h2>
        <Link
          href="/documentos"
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
        >
          Voltar aos documentos
        </Link>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        Cadastre os tipos de documento (ex.: Contrato, Nota fiscal, Comprovante) para classificar os arquivos.
      </p>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <h3 className="font-medium text-slate-800 mb-4">
            {editingId ? 'Editar tipo' : 'Novo tipo'}
          </h3>
          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {message.text}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                placeholder="Ex: Contrato, Nota fiscal"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ordem</label>
              <input
                type="number"
                min={0}
                value={form.ordem}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ordem: parseInt(e.target.value, 10) || 0 }))
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="ativo"
                checked={form.ativo === 1}
                onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked ? 1 : 0 }))}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="ativo" className="text-sm text-slate-700">
                Ativo
              </label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                {saving ? 'Salvando...' : editingId ? 'Atualizar' : 'Cadastrar'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-medium text-slate-800">Tipos cadastrados</h3>
          </div>
          {loading ? (
            <div className="p-6 text-center text-slate-500">Carregando...</div>
          ) : error ? (
            <div className="p-6 text-red-600 text-sm">{error}</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-slate-500 text-sm">Nenhum tipo cadastrado.</div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {items.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between gap-2 p-4 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-slate-800">{t.nome}</span>
                    <span className="ml-2 text-xs text-slate-500">ordem: {t.ordem}</span>
                    {t.ativo === 0 && (
                      <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                        Inativo
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(t)}
                      className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(t.id, t.nome)}
                      className="px-2 py-1 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100"
                    >
                      Excluir
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
