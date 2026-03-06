'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Options = { clientes: { id: number; nome: string }[] };

type Props = { id?: string };

export function TabelaFreteForm({ id }: Props) {
  const router = useRouter();
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    cliente_id: '' as number | '',
    descricao: '',
    origem: '',
    destino: '',
    valor_venda: '',
    valor_custo: '',
    observacoes: '',
    ativo: 1,
  });

  useEffect(() => {
    fetch('/api/cadastros/options')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setOptions({ clientes: data.data.clientes ?? [] });
      })
      .finally(() => { if (!id) setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/tabelas-frete/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const d = data.data;
          setForm({
            cliente_id: d.cliente_id ?? '',
            descricao: d.descricao ?? '',
            origem: d.origem ?? '',
            destino: d.destino ?? '',
            valor_venda: String(d.valor_venda ?? ''),
            valor_custo: String(d.valor_custo ?? ''),
            observacoes: d.observacoes ?? '',
            ativo: d.ativo ?? 1,
          });
        } else setError('Tabela de frete não encontrada.');
      })
      .catch(() => setError('Erro ao carregar.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      cliente_id: Number(form.cliente_id),
      descricao: form.descricao.trim(),
      origem: form.origem.trim(),
      destino: form.destino.trim(),
      valor_venda: Number(String(form.valor_venda).replace(',', '.')) || 0,
      valor_custo: Number(String(form.valor_custo).replace(',', '.')) || 0,
      observacoes: form.observacoes.trim() || null,
      ativo: form.ativo,
    };
    const url = id ? `/api/tabelas-frete/${id}` : '/api/tabelas-frete';
    const method = id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        router.push('/tabelas-frete');
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
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
          <select
            required
            value={form.cliente_id}
            onChange={(e) => setForm((f) => ({ ...f, cliente_id: e.target.value ? Number(e.target.value) : '' }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">— Selecione —</option>
            {options.clientes.map((c) => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição *</label>
          <input type="text" required value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
        </div>
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Origem *</label>
            <input type="text" required value={form.origem} onChange={(e) => setForm((f) => ({ ...f, origem: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Destino *</label>
            <input type="text" required value={form.destino} onChange={(e) => setForm((f) => ({ ...f, destino: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor venda (R$) *</label>
            <input type="text" required value={form.valor_venda} onChange={(e) => setForm((f) => ({ ...f, valor_venda: e.target.value }))} placeholder="0,00" className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor custo (R$) *</label>
            <input type="text" required value={form.valor_custo} onChange={(e) => setForm((f) => ({ ...f, valor_custo: e.target.value }))} placeholder="0,00" className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
          <textarea value={form.observacoes} onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.ativo === 1} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked ? 1 : 0 }))} className="rounded border-slate-300 text-indigo-600" />
          <span className="text-sm text-slate-700">Ativo</span>
        </label>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
          <Link href="/tabelas-frete" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
