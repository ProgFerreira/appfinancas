'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Options = { motoristas: { id: number; nome: string }[] };
type Props = { id?: string };

export function VeiculoForm({ id }: Props) {
  const router = useRouter();
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    placa: '',
    modelo: '',
    tipo: '',
    ano: '',
    proprietario_tipo: 'empresa' as 'empresa' | 'motorista',
    proprietario_id: '' as number | '',
    renavam: '',
    capacidade: '',
    observacoes: '',
    ativo: 1,
  });

  useEffect(() => {
    fetch('/api/cadastros/options')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setOptions({ motoristas: data.data.motoristas ?? [] });
      })
      .finally(() => { if (!id) setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/veiculos/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const d = data.data;
          setForm({
            placa: d.placa ?? '',
            modelo: d.modelo ?? '',
            tipo: d.tipo ?? '',
            ano: d.ano != null ? String(d.ano) : '',
            proprietario_tipo: (d.proprietario_tipo === 'motorista' ? 'motorista' : 'empresa') as 'empresa' | 'motorista',
            proprietario_id: d.proprietario_tipo === 'motorista' && d.proprietario_id != null ? d.proprietario_id : '',
            renavam: d.renavam ?? '',
            capacidade: d.capacidade != null ? String(d.capacidade) : '',
            observacoes: d.observacoes ?? '',
            ativo: d.ativo ?? 1,
          });
        } else setError('Veículo não encontrado.');
      })
      .catch(() => setError('Erro ao carregar.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      placa: form.placa.trim(),
      modelo: form.modelo.trim(),
      tipo: form.tipo.trim(),
      ano: form.ano ? parseInt(form.ano, 10) : null,
      proprietario_tipo: form.proprietario_tipo,
      proprietario_id: form.proprietario_tipo === 'motorista' && form.proprietario_id ? Number(form.proprietario_id) : null,
      renavam: form.renavam.trim() || null,
      capacidade: form.capacidade ? parseFloat(form.capacidade.replace(',', '.')) : null,
      observacoes: form.observacoes.trim() || null,
      ativo: form.ativo,
    };
    const url = id ? `/api/veiculos/${id}` : '/api/veiculos';
    try {
      const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/veiculos');
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
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Placa *</label>
            <input type="text" required value={form.placa} onChange={(e) => setForm((f) => ({ ...f, placa: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Modelo *</label>
            <input type="text" required value={form.modelo} onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
            <input type="text" required value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))} placeholder="ex: Caminhão" className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ano</label>
            <input type="number" min={1900} max={2100} value={form.ano} onChange={(e) => setForm((f) => ({ ...f, ano: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Proprietário</label>
            <select
              value={form.proprietario_tipo}
              onChange={(e) => setForm((f) => ({ ...f, proprietario_tipo: e.target.value as 'empresa' | 'motorista', proprietario_id: '' }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            >
              <option value="empresa">Empresa</option>
              <option value="motorista">Motorista</option>
            </select>
          </div>
          {form.proprietario_tipo === 'motorista' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Motorista</label>
              <select
                value={form.proprietario_id}
                onChange={(e) => setForm((f) => ({ ...f, proprietario_id: e.target.value ? Number(e.target.value) : '' }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="">— Selecione o motorista —</option>
                {options.motoristas.map((m) => (
                  <option key={m.id} value={m.id}>{m.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Renavam</label>
            <input type="text" value={form.renavam} onChange={(e) => setForm((f) => ({ ...f, renavam: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Capacidade</label>
            <input type="text" value={form.capacidade} onChange={(e) => setForm((f) => ({ ...f, capacidade: e.target.value }))} placeholder="ex: 20.5" className="w-full px-3 py-2 rounded-lg border border-slate-200" />
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
          <Link href="/veiculos" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
