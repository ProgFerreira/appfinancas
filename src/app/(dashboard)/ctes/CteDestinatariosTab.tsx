'use client';

import { useEffect, useState } from 'react';

type Destinatario = {
  id: number;
  cte_id: number;
  cnpj: string | null;
  inscricao_estadual: string | null;
  nome: string | null;
  telefone: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  codigo_municipio: number | null;
  municipio: string | null;
  cep: string | null;
  uf: string | null;
  codigo_pais: number | null;
  pais: string | null;
};

const emptyForm = {
  cnpj: '',
  inscricao_estadual: '',
  nome: '',
  telefone: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  codigo_municipio: '',
  municipio: '',
  cep: '',
  uf: '',
  codigo_pais: '',
  pais: '',
};

type Props = { cteId: string };

export function CteDestinatariosTab({ cteId }: Props) {
  const [list, setList] = useState<Destinatario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Destinatario | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function load() {
    setLoading(true);
    fetch(`/api/ctes/${cteId}/destinatarios`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) setList(data.data);
        else setError(data.error ?? 'Erro ao carregar');
      })
      .catch(() => setError('Erro ao carregar'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (cteId) load();
  }, [cteId]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(d: Destinatario) {
    setEditing(d);
    setForm({
      cnpj: d.cnpj ?? '',
      inscricao_estadual: d.inscricao_estadual ?? '',
      nome: d.nome ?? '',
      telefone: d.telefone ?? '',
      logradouro: d.logradouro ?? '',
      numero: d.numero ?? '',
      complemento: d.complemento ?? '',
      bairro: d.bairro ?? '',
      codigo_municipio: d.codigo_municipio != null ? String(d.codigo_municipio) : '',
      municipio: d.municipio ?? '',
      cep: d.cep ?? '',
      uf: d.uf ?? '',
      codigo_pais: d.codigo_pais != null ? String(d.codigo_pais) : '',
      pais: d.pais ?? '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const url = editing
        ? `/api/ctes/${cteId}/destinatarios/${editing.id}`
        : `/api/ctes/${cteId}/destinatarios`;
      const method = editing ? 'PUT' : 'POST';
      const body = {
        ...form,
        codigo_municipio: form.codigo_municipio ? parseInt(form.codigo_municipio, 10) : null,
        codigo_pais: form.codigo_pais ? parseInt(form.codigo_pais, 10) : null,
      };
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

  async function handleDelete(d: Destinatario) {
    if (!confirm('Excluir este destinatário?')) return;
    setError('');
    const res = await fetch(`/api/ctes/${cteId}/destinatarios/${d.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) load();
    else setError(data.error ?? 'Erro ao excluir');
  }

  if (loading) return <div className="p-4 text-slate-500">Carregando destinatários...</div>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
      )}
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium text-slate-800">Destinatários</h3>
        <button
          type="button"
          onClick={openNew}
          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
        >
          + Novo destinatário
        </button>
      </div>
      {showForm && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-medium text-slate-700 mb-3">
            {editing ? 'Editar destinatário' : 'Novo destinatário'}
          </h4>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <label className="block text-sm font-medium text-slate-600 mb-1">CNPJ</label>
              <input
                type="text"
                value={form.cnpj}
                onChange={(e) => setForm((f) => ({ ...f, cnpj: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Inscrição estadual</label>
              <input
                type="text"
                value={form.inscricao_estadual}
                onChange={(e) => setForm((f) => ({ ...f, inscricao_estadual: e.target.value }))}
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
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">Logradouro</label>
              <input
                type="text"
                value={form.logradouro}
                onChange={(e) => setForm((f) => ({ ...f, logradouro: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Número</label>
              <input
                type="text"
                value={form.numero}
                onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Complemento</label>
              <input
                type="text"
                value={form.complemento}
                onChange={(e) => setForm((f) => ({ ...f, complemento: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Bairro</label>
              <input
                type="text"
                value={form.bairro}
                onChange={(e) => setForm((f) => ({ ...f, bairro: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Município</label>
              <input
                type="text"
                value={form.municipio}
                onChange={(e) => setForm((f) => ({ ...f, municipio: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">UF</label>
              <input
                type="text"
                value={form.uf}
                onChange={(e) => setForm((f) => ({ ...f, uf: e.target.value }))}
                maxLength={2}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">CEP</label>
              <input
                type="text"
                value={form.cep}
                onChange={(e) => setForm((f) => ({ ...f, cep: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">País</label>
              <input
                type="text"
                value={form.pais}
                onChange={(e) => setForm((f) => ({ ...f, pais: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              />
            </div>
            <div className="flex gap-2 md:col-span-2">
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
        <p className="text-slate-500 text-sm">Nenhum destinatário. Clique em &quot;Novo destinatário&quot; para adicionar.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 font-medium text-slate-700">Nome</th>
                <th className="text-left py-2 px-2 font-medium text-slate-700">CNPJ</th>
                <th className="text-left py-2 px-2 font-medium text-slate-700">Município/UF</th>
                <th className="text-left py-2 px-2 font-medium text-slate-700 w-24">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-2">{d.nome ?? '—'}</td>
                  <td className="py-2 px-2 text-slate-600">{d.cnpj ?? '—'}</td>
                  <td className="py-2 px-2 text-slate-600">{[d.municipio, d.uf].filter(Boolean).join(' / ') || '—'}</td>
                  <td className="py-2 px-2">
                    <button type="button" onClick={() => openEdit(d)} className="text-indigo-600 hover:underline mr-2">
                      Editar
                    </button>
                    <button type="button" onClick={() => handleDelete(d)} className="text-red-600 hover:underline">
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
