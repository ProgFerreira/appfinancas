'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Options = {
  planoContas: { id: number; codigo: string; nome: string }[];
};

type Props = { id?: string };

export function CategoriaDespesaForm({ id }: Props) {
  const router = useRouter();
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    plano_contas_id: '' as number | '',
    nome: '',
    tipo: 'variavel' as 'variavel' | 'fixo' | 'outros',
    descricao: '',
    ativo: 1,
  });

  useEffect(() => {
    fetch('/api/cadastros/options')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setOptions({
            planoContas: data.data.planoContas ?? [],
          });
        }
      })
      .finally(() => {
        if (!id) setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/categorias-despesa/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const d = data.data;
          setForm({
            plano_contas_id: d.plano_contas_id ?? '',
            nome: d.nome ?? '',
            tipo: (d.tipo === 'fixo' || d.tipo === 'outros' ? d.tipo : 'variavel') as 'variavel' | 'fixo' | 'outros',
            descricao: d.descricao ?? '',
            ativo: d.ativo ?? 1,
          });
        } else {
          setError('Categoria não encontrada.');
        }
      })
      .catch(() => setError('Erro ao carregar.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      plano_contas_id: Number(form.plano_contas_id),
      nome: form.nome.trim(),
      tipo: form.tipo,
      descricao: form.descricao.trim() || null,
      ativo: form.ativo,
    };
    const url = id ? `/api/categorias-despesa/${id}` : '/api/categorias-despesa';
    const method = id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/categorias-despesa');
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

  if (loading || !options) {
    return <div className="p-6 text-slate-500">Carregando...</div>;
  }

  return (
    <div className="form-panel rounded-xl border border-slate-200 bg-white shadow-sm p-6 form-contraste">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
          <input
            type="text"
            required
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Plano de contas *</label>
          <select
            required
            value={form.plano_contas_id}
            onChange={(e) => setForm((f) => ({ ...f, plano_contas_id: e.target.value ? Number(e.target.value) : '' }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">— Selecione —</option>
            {options.planoContas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.codigo} – {p.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
          <select
            value={form.tipo}
            onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as 'variavel' | 'fixo' | 'outros' }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200"
          >
            <option value="variavel">Variável</option>
            <option value="fixo">Fixo</option>
            <option value="outros">Outros</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <textarea
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-200"
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.ativo === 1}
            onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked ? 1 : 0 }))}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700">Ativo</span>
        </label>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <Link
            href="/categorias-despesa"
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
