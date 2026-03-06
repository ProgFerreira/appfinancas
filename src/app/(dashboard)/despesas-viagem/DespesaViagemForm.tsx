'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Options = {
  categoriasDespesa: { id: number; nome: string }[];
  centrosCusto: { id: number; nome: string }[];
  clientes: { id: number; nome: string }[];
  planoContas: { id: number; codigo: string; nome: string }[];
};
type CteOption = { id: number; numero: string };

type Props = { id?: string };

export function DespesaViagemForm({ id }: Props) {
  const router = useRouter();
  const [options, setOptions] = useState<Options | null>(null);
  const [ctes, setCtes] = useState<CteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    cte_id: '' as number | '',
    categoria_id: '' as number | '',
    plano_contas_id: '' as number | '',
    centro_custo_id: '' as number | '',
    fornecedor_id: '' as number | '',
    descricao: '',
    valor: '',
    data_despesa: new Date().toISOString().slice(0, 10),
    ativo: 1,
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/cadastros/options').then((r) => r.json()),
      fetch('/api/ctes?per_page=500').then((r) => r.json()),
    ]).then(([opt, ctesRes]) => {
      if (opt.success && opt.data) setOptions({
        categoriasDespesa: opt.data.categoriasDespesa ?? [],
        centrosCusto: opt.data.centrosCusto ?? [],
        clientes: opt.data.clientes ?? [],
        planoContas: opt.data.planoContas ?? [],
      });
      if (ctesRes.success && Array.isArray(ctesRes.data)) setCtes(ctesRes.data.map((c: { id: number; numero: string }) => ({ id: c.id, numero: c.numero })));
    }).finally(() => { if (!id) setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/despesas-viagem/${id}`).then((res) => res.json()).then((data) => {
      if (data.success && data.data) {
        const d = data.data;
        setForm({
          cte_id: d.cte_id ?? '',
          categoria_id: d.categoria_id ?? '',
          plano_contas_id: d.plano_contas_id ?? '',
          centro_custo_id: d.centro_custo_id ?? '',
          fornecedor_id: d.fornecedor_id ?? '',
          descricao: d.descricao ?? '',
          valor: String(d.valor ?? ''),
          data_despesa: d.data_despesa ? d.data_despesa.slice(0, 10) : new Date().toISOString().slice(0, 10),
          ativo: d.ativo ?? 1,
        });
      } else setError('Despesa não encontrada.');
    }).catch(() => setError('Erro ao carregar.')).finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      cte_id: Number(form.cte_id),
      categoria_id: Number(form.categoria_id),
      plano_contas_id: form.plano_contas_id ? Number(form.plano_contas_id) : null,
      centro_custo_id: form.centro_custo_id ? Number(form.centro_custo_id) : null,
      fornecedor_id: form.fornecedor_id ? Number(form.fornecedor_id) : null,
      descricao: form.descricao.trim() || null,
      valor: Number(String(form.valor).replace(',', '.')) || 0,
      data_despesa: form.data_despesa,
      ativo: form.ativo,
    };
    const url = id ? `/api/despesas-viagem/${id}` : '/api/despesas-viagem';
    try {
      const res = await fetch(url, { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { router.push('/despesas-viagem'); router.refresh(); return; }
      setError(data.error ?? 'Erro ao salvar.');
      if (res.status === 401) router.push('/login');
    } catch { setError('Erro de conexão.'); } finally { setSaving(false); }
  }

  if (loading || !options) return <div className="p-6 text-slate-500">Carregando...</div>;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 max-w-2xl">
      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CTe *</label>
            <select required value={form.cte_id} onChange={(e) => setForm((f) => ({ ...f, cte_id: e.target.value ? Number(e.target.value) : '' }))} className="w-full px-3 py-2 rounded-lg border border-slate-200">
              <option value="">— Selecione —</option>
              {ctes.map((c) => <option key={c.id} value={c.id}>CTe {c.numero}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Categoria *</label>
            <select required value={form.categoria_id} onChange={(e) => setForm((f) => ({ ...f, categoria_id: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border border-slate-200">
              <option value="">— Selecione —</option>
              {options.categoriasDespesa.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$) *</label>
            <input type="text" required value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} placeholder="0,00" className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data despesa *</label>
            <input type="date" required value={form.data_despesa} onChange={(e) => setForm((f) => ({ ...f, data_despesa: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <textarea value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
        </div>
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fornecedor</label>
            <select value={form.fornecedor_id} onChange={(e) => setForm((f) => ({ ...f, fornecedor_id: e.target.value ? Number(e.target.value) : '' }))} className="w-full px-3 py-2 rounded-lg border border-slate-200">
              <option value="">— Nenhum —</option>
              {options.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Centro de custo</label>
            <select value={form.centro_custo_id} onChange={(e) => setForm((f) => ({ ...f, centro_custo_id: e.target.value ? Number(e.target.value) : '' }))} className="w-full px-3 py-2 rounded-lg border border-slate-200">
              <option value="">— Nenhum —</option>
              {options.centrosCusto.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Plano de contas</label>
          <select value={form.plano_contas_id} onChange={(e) => setForm((f) => ({ ...f, plano_contas_id: e.target.value ? Number(e.target.value) : '' }))} className="w-full px-3 py-2 rounded-lg border border-slate-200">
            <option value="">— Nenhum —</option>
            {options.planoContas.map((p) => <option key={p.id} value={p.id}>{p.codigo} – {p.nome}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.ativo === 1} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked ? 1 : 0 }))} className="rounded border-slate-300 text-indigo-600" />
          <span className="text-sm text-slate-700">Ativo</span>
        </label>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
          <Link href="/despesas-viagem" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
