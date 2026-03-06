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

type Props = { id?: string };

export function DespesaFixaForm({ id }: Props) {
  const router = useRouter();
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    categoria_id: '' as number | '',
    plano_contas_id: '' as number | '',
    centro_custo_id: '' as number | '',
    fornecedor_id: '' as number | '',
    descricao: '',
    valor_previsto: '',
    dia_vencimento: '10',
    gerar_automaticamente: 0,
    ativo: 1,
  });

  useEffect(() => {
    fetch('/api/cadastros/options')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setOptions({
            categoriasDespesa: data.data.categoriasDespesa ?? [],
            centrosCusto: data.data.centrosCusto ?? [],
            clientes: data.data.clientes ?? [],
            planoContas: data.data.planoContas ?? [],
          });
        }
      })
      .finally(() => { if (!id) setLoading(false); });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/despesas-fixas/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const d = data.data;
          setForm({
            categoria_id: d.categoria_id ?? '',
            plano_contas_id: d.plano_contas_id ?? '',
            centro_custo_id: d.centro_custo_id ?? '',
            fornecedor_id: d.fornecedor_id ?? '',
            descricao: d.descricao ?? '',
            valor_previsto: String(d.valor_previsto ?? ''),
            dia_vencimento: String(d.dia_vencimento ?? 10),
            gerar_automaticamente: d.gerar_automaticamente ?? 0,
            ativo: d.ativo ?? 1,
          });
        } else {
          setError('Despesa fixa não encontrada.');
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
      categoria_id: Number(form.categoria_id),
      plano_contas_id: form.plano_contas_id || null,
      centro_custo_id: form.centro_custo_id || null,
      fornecedor_id: form.fornecedor_id || null,
      descricao: form.descricao.trim(),
      valor_previsto: Number(form.valor_previsto.replace(',', '.')),
      dia_vencimento: Number(form.dia_vencimento),
      gerar_automaticamente: form.gerar_automaticamente,
      ativo: form.ativo,
    };
    const url = id ? `/api/despesas-fixas/${id}` : '/api/despesas-fixas';
    const method = id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
        router.push('/despesas-fixas');
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
    <div className="form-card form-contraste">
      {error && (
        <div className="mx-6 mt-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="form-grid-4">
          <div>
            <label className="form-label">Descrição *</label>
            <input
              type="text"
              required
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Descrição da despesa fixa"
            />
          </div>
          <div>
            <label className="form-label">Categoria *</label>
            <select
              required
              value={form.categoria_id}
              onChange={(e) => setForm((f) => ({ ...f, categoria_id: Number(e.target.value) }))}
            >
              <option value="">— Selecione —</option>
              {options.categoriasDespesa.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Valor previsto (R$) *</label>
            <input
              type="text"
              required
              value={form.valor_previsto}
              onChange={(e) => setForm((f) => ({ ...f, valor_previsto: e.target.value }))}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="form-label">Dia vencimento (1-31) *</label>
            <input
              type="number"
              min={1}
              max={31}
              required
              value={form.dia_vencimento}
              onChange={(e) => setForm((f) => ({ ...f, dia_vencimento: e.target.value }))}
            />
          </div>

          <div>
            <label className="form-label">Fornecedor</label>
            <select
              value={form.fornecedor_id}
              onChange={(e) => setForm((f) => ({ ...f, fornecedor_id: e.target.value ? Number(e.target.value) : '' }))}
            >
              <option value="">— Selecione —</option>
              {options.clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Plano de contas</label>
            <select
              value={form.plano_contas_id}
              onChange={(e) => setForm((f) => ({ ...f, plano_contas_id: e.target.value ? Number(e.target.value) : '' }))}
            >
              <option value="">— Selecione —</option>
              {(options.planoContas ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.codigo} – {p.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Centro de custo</label>
            <select
              value={form.centro_custo_id}
              onChange={(e) => setForm((f) => ({ ...f, centro_custo_id: e.target.value ? Number(e.target.value) : '' }))}
            >
              <option value="">— Selecione —</option>
              {options.centrosCusto.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.gerar_automaticamente === 1}
              onChange={(e) => setForm((f) => ({ ...f, gerar_automaticamente: e.target.checked ? 1 : 0 }))}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">Gerar automaticamente</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.ativo === 1}
              onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked ? 1 : 0 }))}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-slate-700">Ativo</span>
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <Link href="/despesas-fixas" className="btn btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
