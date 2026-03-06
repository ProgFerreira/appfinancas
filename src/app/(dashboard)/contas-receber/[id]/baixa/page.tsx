'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';

type Conta = {
  id: number;
  valor: number;
  descricao: string | null;
  cliente_nome?: string;
  data_vencimento: string;
};

type Options = { contasBancarias: { id: number; descricao: string }[] };

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export default function BaixaContaReceberPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id ?? '');
  const [conta, setConta] = useState<Conta | null>(null);
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    data_recebimento: new Date().toISOString().slice(0, 10),
    valor_recebido: '',
    desconto: '0',
    conta_bancaria_id: '' as number | '',
    observacoes: '',
  });

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/contas-receber/${id}`).then((r) => r.json()),
      fetch('/api/cadastros/options').then((r) => r.json()),
    ]).then(([resConta, resOpt]) => {
      if (resConta.success && resConta.data) setConta(resConta.data);
      else setError(resConta.error ?? 'Conta não encontrada');
      if (resOpt.success && resOpt.data) setOptions(resOpt.data);
    }).catch(() => setError('Erro ao carregar')).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (conta && !form.valor_recebido) setForm((f) => ({ ...f, valor_recebido: String(conta.valor) }));
  }, [conta]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      data_recebimento: form.data_recebimento,
      valor_recebido: Number(form.valor_recebido.replace(',', '.')),
      desconto: Number(form.desconto.replace(',', '.')) || 0,
      conta_bancaria_id: form.conta_bancaria_id || null,
      observacoes: form.observacoes || null,
    };
    try {
      const res = await fetch(`/api/contas-receber/${id}/baixa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data: { success?: boolean; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError('Resposta inválida do servidor. Tente novamente.');
        setSaving(false);
        return;
      }
      if (data.success) {
        router.push('/contas-receber');
        router.refresh();
        return;
      }
      setError(data.error ?? 'Erro ao registrar.');
      if (res.status === 401) router.push('/login');
    } catch {
      setError('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !conta) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Contas a receber', href: '/contas-receber' }, { label: 'Registrar recebimento' }]} />
        <div className="mt-4 p-6 text-slate-500">{loading ? 'Carregando...' : error || 'Conta não encontrada.'}</div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Contas a receber', href: '/contas-receber' },
          { label: 'Registrar recebimento' },
        ]}
      />
      <div className="mt-4 form-panel">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Registrar recebimento</h2>
        <div className="mb-4 p-4 rounded-lg bg-slate-50 text-sm">
          <p><strong>Cliente:</strong> {conta.cliente_nome ?? '—'}</p>
          <p><strong>Descrição:</strong> {conta.descricao ?? '—'}</p>
          <p><strong>Valor do título:</strong> {formatMoney(conta.valor)}</p>
        </div>
        <div className="form-panel rounded-xl border border-slate-200 bg-white shadow-sm p-6 form-contraste">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data recebimento *</label>
              <input
                type="date"
                required
                value={form.data_recebimento}
                onChange={(e) => setForm((f) => ({ ...f, data_recebimento: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Valor recebido (R$) *</label>
              <input
                type="text"
                required
                value={form.valor_recebido}
                onChange={(e) => setForm((f) => ({ ...f, valor_recebido: e.target.value }))}
                placeholder="0,00"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Desconto (R$)</label>
              <input
                type="text"
                value={form.desconto}
                onChange={(e) => setForm((f) => ({ ...f, desconto: e.target.value }))}
                placeholder="0,00"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Conta bancária</label>
              <select
                value={form.conta_bancaria_id}
                onChange={(e) => setForm((f) => ({ ...f, conta_bancaria_id: e.target.value ? Number(e.target.value) : '' }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">— Selecione —</option>
                {options?.contasBancarias?.map((c) => (
                  <option key={c.id} value={c.id}>{c.descricao}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
              <textarea
                rows={2}
                value={form.observacoes}
                onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? 'Registrando...' : 'Registrar recebimento'}
              </button>
              <Link href="/contas-receber" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
