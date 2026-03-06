'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Options = { naturezas: { id: number; nome: string }[] };

type Props = { id?: string };

export function NaturezaForm({ id }: Props) {
  const router = useRouter();
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    codigo: '',
    nome: '',
    natureza_pai_id: '' as number | '',
    tipo: 'ambos' as 'ambos' | 'receita' | 'despesa',
    descricao: '',
    nivel: '1',
    ordem: '0',
    ativo: 1,
  });

  useEffect(() => {
    fetch('/api/cadastros/options')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setOptions({ naturezas: data.data.naturezas ?? [] });
      })
      .finally(() => { if (!id) setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/naturezas/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const d = data.data;
          setForm({
            codigo: d.codigo ?? '',
            nome: d.nome ?? '',
            natureza_pai_id: d.natureza_pai_id ?? '',
            tipo: (d.tipo === 'receita' || d.tipo === 'despesa' ? d.tipo : 'ambos') as 'ambos' | 'receita' | 'despesa',
            descricao: d.descricao ?? '',
            nivel: String(d.nivel ?? 1),
            ordem: String(d.ordem ?? 0),
            ativo: d.ativo ?? 1,
          });
        } else setError('Natureza não encontrada.');
      })
      .catch(() => setError('Erro ao carregar.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      codigo: form.codigo.trim() || null,
      nome: form.nome.trim(),
      natureza_pai_id: form.natureza_pai_id ? Number(form.natureza_pai_id) : null,
      tipo: form.tipo,
      descricao: form.descricao.trim() || null,
      nivel: parseInt(form.nivel, 10) || 1,
      ordem: parseInt(form.ordem, 10) || 0,
      ativo: form.ativo,
    };
    const url = id ? `/api/naturezas/${id}` : '/api/naturezas';
    const method = id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        router.push('/naturezas');
        router.refresh();
        return;
      }
      setError(data.error ?? 'Erro ao salvar.');
      if (res.status === 401) router.push('/login');
    } catch {
      setError('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !options) return <div className="p-6 text-slate-500">Carregando...</div>;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 max-w-2xl">
      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
            <input type="text" value={form.codigo} onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
            <input type="text" required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as 'ambos' | 'receita' | 'despesa' }))} className="w-full px-3 py-2 rounded-lg border border-slate-200">
              <option value="ambos">Ambos</option>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Natureza pai</label>
            <select value={form.natureza_pai_id} onChange={(e) => setForm((f) => ({ ...f, natureza_pai_id: e.target.value ? Number(e.target.value) : '' }))} className="w-full px-3 py-2 rounded-lg border border-slate-200">
              <option value="">— Nenhuma —</option>
              {options.naturezas.filter((n) => !id || n.id !== Number(id)).map((n) => (
                <option key={n.id} value={n.id}>{n.nome}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nível</label>
            <input type="number" min={1} value={form.nivel} onChange={(e) => setForm((f) => ({ ...f, nivel: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 max-w-[100px]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ordem</label>
            <input type="number" min={0} value={form.ordem} onChange={(e) => setForm((f) => ({ ...f, ordem: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200 max-w-[100px]" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.ativo === 1} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked ? 1 : 0 }))} className="rounded border-slate-300 text-indigo-600" />
          <span className="text-sm text-slate-700">Ativo</span>
        </label>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
          <Link href="/naturezas" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
