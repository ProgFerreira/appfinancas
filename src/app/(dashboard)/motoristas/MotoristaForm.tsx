'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Options = { clientes: { id: number; nome: string }[] };

type Props = { id?: string };

export function MotoristaForm({ id }: Props) {
  const router = useRouter();
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    parceiro_id: '' as number | '',
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    tipo_vinculo: 'clt',
    observacoes: '',
    ativo: 1,
  });

  useEffect(() => {
    fetch('/api/cadastros/options').then((res) => res.json()).then((data) => {
      if (data.success && data.data) setOptions({ clientes: data.data.clientes ?? [] });
    }).finally(() => { if (!id) setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/motoristas/${id}`).then((res) => res.json()).then((data) => {
      if (data.success && data.data) {
        const d = data.data;
        setForm({
          parceiro_id: d.parceiro_id ?? '',
          nome: d.nome ?? '',
          cpf: d.cpf ?? '',
          telefone: d.telefone ?? '',
          email: d.email ?? '',
          tipo_vinculo: d.tipo_vinculo ?? 'clt',
          observacoes: d.observacoes ?? '',
          ativo: d.ativo ?? 1,
        });
      } else setError('Motorista não encontrado.');
    }).catch(() => setError('Erro ao carregar.')).finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      parceiro_id: form.parceiro_id ? Number(form.parceiro_id) : null,
      nome: form.nome.trim(),
      cpf: form.cpf.trim(),
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      tipo_vinculo: form.tipo_vinculo,
      observacoes: form.observacoes.trim() || null,
      ativo: form.ativo,
    };
    const url = id ? `/api/motoristas/${id}` : '/api/motoristas';
    try {
      const res = await fetch(url, { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const text = await res.text();
      let data: { success?: boolean; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError('Resposta inválida do servidor. Tente novamente.');
        setSaving(false);
        return;
      }
      if (data.success) { router.push('/motoristas'); router.refresh(); return; }
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
            <input type="text" required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">CPF *</label>
            <input type="text" required value={form.cpf} onChange={(e) => setForm((f) => ({ ...f, cpf: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo vínculo *</label>
            <input type="text" required value={form.tipo_vinculo} onChange={(e) => setForm((f) => ({ ...f, tipo_vinculo: e.target.value }))} placeholder="ex: CLT, PJ" className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parceiro (cliente)</label>
            <select value={form.parceiro_id} onChange={(e) => setForm((f) => ({ ...f, parceiro_id: e.target.value ? Number(e.target.value) : '' }))} className="w-full px-3 py-2 rounded-lg border border-slate-200">
              <option value="">— Nenhum —</option>
              {options.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
            <input type="text" value={form.telefone} onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
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
          <Link href="/motoristas" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
