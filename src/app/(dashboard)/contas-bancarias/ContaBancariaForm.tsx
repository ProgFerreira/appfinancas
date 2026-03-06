'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Props = { id?: string };

export function ContaBancariaForm({ id }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    descricao: '',
    banco: '',
    agencia: '',
    conta: '',
    tipo: 'corrente',
    saldo_inicial: '0',
    observacoes: '',
    ativo: 1,
  });

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/contas-bancarias/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const d = data.data;
          setForm({
            descricao: d.descricao ?? '',
            banco: d.banco ?? '',
            agencia: d.agencia ?? '',
            conta: d.conta ?? '',
            tipo: d.tipo ?? 'corrente',
            saldo_inicial: String(d.saldo_inicial ?? 0),
            observacoes: d.observacoes ?? '',
            ativo: d.ativo ?? 1,
          });
        } else {
          setError('Conta bancária não encontrada.');
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
      descricao: form.descricao.trim(),
      banco: form.banco.trim(),
      agencia: form.agencia.trim() || null,
      conta: form.conta.trim() || null,
      tipo: form.tipo,
      saldo_inicial: Number(String(form.saldo_inicial).replace(',', '.')) || 0,
      observacoes: form.observacoes.trim() || null,
      ativo: form.ativo,
    };
    const url = id ? `/api/contas-bancarias/${id}` : '/api/contas-bancarias';
    const method = id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/contas-bancarias');
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

  if (loading) {
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
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição *</label>
          <input
            type="text"
            required
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Banco *</label>
            <input
              type="text"
              required
              value={form.banco}
              onChange={(e) => setForm((f) => ({ ...f, banco: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Agência</label>
            <input
              type="text"
              value={form.agencia}
              onChange={(e) => setForm((f) => ({ ...f, agencia: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Conta</label>
            <input
              type="text"
              value={form.conta}
              onChange={(e) => setForm((f) => ({ ...f, conta: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            >
              <option value="corrente">Corrente</option>
              <option value="poupanca">Poupança</option>
              <option value="investimento">Investimento</option>
              <option value="outros">Outros</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Saldo inicial (R$)</label>
          <input
            type="text"
            value={form.saldo_inicial}
            onChange={(e) => setForm((f) => ({ ...f, saldo_inicial: e.target.value }))}
            placeholder="0,00"
            className="w-full px-3 py-2 rounded-lg border border-slate-200"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
          <textarea
            value={form.observacoes}
            onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
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
            href="/contas-bancarias"
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
