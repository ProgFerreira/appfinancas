'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Options = { contasBancarias: { id: number; descricao: string }[] };

type Props = { id?: string };

export function ConciliacaoForm({ id }: Props) {
  const router = useRouter();
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    conta_bancaria_id: '' as number | '',
    data_movimentacao: '',
    valor: '',
    tipo: 'entrada' as 'entrada' | 'saida',
    descricao: '',
    memo: '',
    status: 'pendente' as 'pendente' | 'autorizado' | 'ignorado',
  });

  useEffect(() => {
    fetch('/api/cadastros/options').then((res) => res.json()).then((data) => {
      if (data.success && data.data) setOptions({ contasBancarias: data.data.contasBancarias ?? [] });
    }).finally(() => { if (!id) setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/conciliacoes/${id}`).then((res) => res.json()).then((data) => {
      if (data.success && data.data) {
        const d = data.data;
        setForm({
          conta_bancaria_id: d.conta_bancaria_id ?? '',
          data_movimentacao: d.data_movimentacao ?? '',
          valor: String(d.valor ?? ''),
          tipo: d.tipo === 'saida' ? 'saida' : 'entrada',
          descricao: d.descricao ?? '',
          memo: d.memo ?? '',
          status: ['autorizado', 'ignorado'].includes(d.status) ? d.status : 'pendente',
        });
      } else setError('Conciliação não encontrada.');
    }).catch(() => setError('Erro ao carregar.')).finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const valor = parseFloat(String(form.valor).replace(',', '.'));
    if (Number.isNaN(valor)) { setError('Valor inválido.'); setSaving(false); return; }
    const payload = {
      conta_bancaria_id: Number(form.conta_bancaria_id),
      data_movimentacao: form.data_movimentacao,
      valor,
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      memo: form.memo.trim() || null,
      status: form.status,
    };
    const url = id ? `/api/conciliacoes/${id}` : '/api/conciliacoes';
    try {
      const res = await fetch(url, { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { router.push('/conciliacao-bancaria'); router.refresh(); return; }
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Conta bancária *</label>
            <select required value={form.conta_bancaria_id} onChange={(e) => setForm((f) => ({ ...f, conta_bancaria_id: e.target.value ? Number(e.target.value) : '' }))} className="w-full px-3 py-2 rounded-lg border border-slate-200">
              <option value="">— Selecione —</option>
              {options.contasBancarias.map((c) => <option key={c.id} value={c.id}>{c.descricao}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data movimentação *</label>
            <input type="date" required value={form.data_movimentacao} onChange={(e) => setForm((f) => ({ ...f, data_movimentacao: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor *</label>
            <input type="text" required value={form.valor} onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))} placeholder="0,00" className="w-full px-3 py-2 rounded-lg border border-slate-200" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
            <select value={form.tipo} onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as 'entrada' | 'saida' }))} className="w-full px-3 py-2 rounded-lg border border-slate-200">
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição *</label>
          <input type="text" required value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Memo</label>
          <input type="text" value={form.memo} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'pendente' | 'autorizado' | 'ignorado' }))} className="w-full px-3 py-2 rounded-lg border border-slate-200">
            <option value="pendente">Pendente</option>
            <option value="autorizado">Autorizado</option>
            <option value="ignorado">Ignorado</option>
          </select>
        </div>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
          <Link href="/conciliacao-bancaria" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
