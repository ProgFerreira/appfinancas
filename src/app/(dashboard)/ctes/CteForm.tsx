'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Cte } from '@/types';

type Options = {
  clientes: { id: number; nome: string }[];
  centrosCusto: { id: number; nome: string }[];
};

type Props = { id?: string };

export function CteForm({ id }: Props) {
  const router = useRouter();
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    numero: '',
    serie: '',
    chave: '',
    cliente_id: '' as number | '',
    data_emissao: '',
    valor_frete: '',
    origem: '',
    destino: '',
    minuta: '',
    emitente_cnpj: '',
    peso: '',
    cubagem: '',
    tipo_operacao: '',
    vencimento: '',
    centro_custo_id: '' as number | '',
    arquivo_xml: '',
    status: 'em_aberto',
    ativo: 1,
  });

  useEffect(() => {
    fetch('/api/cadastros/options')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setOptions({
            clientes: data.data.clientes ?? [],
            centrosCusto: data.data.centrosCusto ?? [],
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    fetch(`/api/ctes/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const c = data.data as Cte;
          setForm({
            numero: c.numero ?? '',
            serie: c.serie ?? '',
            chave: c.chave ?? '',
            cliente_id: c.cliente_id ?? '',
            data_emissao: c.data_emissao ? c.data_emissao.slice(0, 10) : '',
            valor_frete: String(c.valor_frete ?? ''),
            origem: c.origem ?? '',
            destino: c.destino ?? '',
            minuta: c.minuta ?? '',
            emitente_cnpj: c.emitente_cnpj ?? '',
            peso: String(c.peso ?? ''),
            cubagem: String(c.cubagem ?? ''),
            tipo_operacao: c.tipo_operacao ?? '',
            vencimento: c.vencimento ? c.vencimento.slice(0, 10) : '',
            centro_custo_id: c.centro_custo_id ?? '',
            arquivo_xml: c.arquivo_xml ?? '',
            status: c.status ?? 'em_aberto',
            ativo: c.ativo ?? 1,
          });
        } else {
          setError('CTe não encontrado.');
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
      numero: form.numero.trim(),
      serie: form.serie.trim() || null,
      chave: form.chave.trim() || null,
      cliente_id: Number(form.cliente_id),
      data_emissao: form.data_emissao || null,
      valor_frete: Number(form.valor_frete.replace(',', '.')) || 0,
      origem: form.origem.trim() || null,
      destino: form.destino.trim() || null,
      minuta: form.minuta.trim() || null,
      emitente_cnpj: form.emitente_cnpj.trim() || null,
      peso: parseFloat(form.peso.replace(',', '.')) || 0,
      cubagem: parseFloat(form.cubagem.replace(',', '.')) || 0,
      tipo_operacao: form.tipo_operacao.trim() || null,
      vencimento: form.vencimento || null,
      centro_custo_id: form.centro_custo_id || null,
      arquivo_xml: form.arquivo_xml.trim() || null,
      status: form.status,
      ativo: form.ativo,
    };
    const url = id ? `/api/ctes/${id}` : '/api/ctes';
    const method = id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        router.push('/ctes');
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
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Número *</label>
            <input
              type="text"
              required
              value={form.numero}
              onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Série</label>
            <input
              type="text"
              value={form.serie}
              onChange={(e) => setForm((f) => ({ ...f, serie: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
            <select
              required
              value={form.cliente_id}
              onChange={(e) => setForm((f) => ({ ...f, cliente_id: e.target.value ? Number(e.target.value) : '' }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            >
              <option value="">— Selecione —</option>
              {options.clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data emissão</label>
            <input
              type="date"
              value={form.data_emissao}
              onChange={(e) => setForm((f) => ({ ...f, data_emissao: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Valor frete (R$)</label>
            <input
              type="text"
              value={form.valor_frete}
              onChange={(e) => setForm((f) => ({ ...f, valor_frete: e.target.value }))}
              placeholder="0,00"
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Chave</label>
            <input
              type="text"
              value={form.chave}
              onChange={(e) => setForm((f) => ({ ...f, chave: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Origem</label>
            <input
              type="text"
              value={form.origem}
              onChange={(e) => setForm((f) => ({ ...f, origem: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Destino</label>
            <input
              type="text"
              value={form.destino}
              onChange={(e) => setForm((f) => ({ ...f, destino: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Minuta</label>
            <input
              type="text"
              value={form.minuta}
              onChange={(e) => setForm((f) => ({ ...f, minuta: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Emitente CNPJ</label>
            <input
              type="text"
              value={form.emitente_cnpj}
              onChange={(e) => setForm((f) => ({ ...f, emitente_cnpj: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Peso</label>
            <input
              type="text"
              value={form.peso}
              onChange={(e) => setForm((f) => ({ ...f, peso: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cubagem</label>
            <input
              type="text"
              value={form.cubagem}
              onChange={(e) => setForm((f) => ({ ...f, cubagem: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo operação</label>
            <input
              type="text"
              value={form.tipo_operacao}
              onChange={(e) => setForm((f) => ({ ...f, tipo_operacao: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento</label>
            <input
              type="date"
              value={form.vencimento}
              onChange={(e) => setForm((f) => ({ ...f, vencimento: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Centro de custo</label>
            <select
              value={form.centro_custo_id}
              onChange={(e) => setForm((f) => ({ ...f, centro_custo_id: e.target.value ? Number(e.target.value) : '' }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            >
              <option value="">— Selecione —</option>
              {options.centrosCusto.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            >
              <option value="em_aberto">Em aberto</option>
              <option value="faturado">Faturado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={!!form.ativo}
                onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked ? 1 : 0 }))}
                className="rounded border-slate-300"
              />
              Ativo
            </label>
          </div>
          <div className="xl:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Arquivo XML</label>
            <input
              type="text"
              value={form.arquivo_xml}
              onChange={(e) => setForm((f) => ({ ...f, arquivo_xml: e.target.value }))}
              placeholder="Caminho ou nome do arquivo"
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <Link href="/ctes" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
