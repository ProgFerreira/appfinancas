'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';

type Option = { id: number; codigo: string; nome: string };
type GrupoOption = Option & { classificacao_id: number };

export default function NovoPlanoContasPage() {
  const router = useRouter();
  const [pais, setPais] = useState<Option[]>([]);
  const [classificacoes, setClassificacoes] = useState<Option[]>([]);
  const [grupos, setGrupos] = useState<GrupoOption[]>([]);
  const [naturezas, setNaturezas] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    codigo: '',
    nome: '',
    descricao: '',
    plano_pai_id: '' as string | number,
    classificacao_id: '' as string | number,
    grupo_dre_id: '' as string | number,
    natureza_fluxo_id: '' as string | number,
    tipo_conta: 'analitica' as 'sintetica' | 'analitica',
    eh_receita: 0,
    eh_despesa: 0,
    ativo: 1,
  });

  const gruposFiltrados = useMemo(
    () => (form.classificacao_id === '' ? grupos : grupos.filter((g) => g.classificacao_id === Number(form.classificacao_id))),
    [grupos, form.classificacao_id]
  );

  useEffect(() => {
    Promise.all([
      fetch('/api/plano-contas?ativo=all').then((r) => r.json()),
      fetch('/api/plano-contas/options').then((r) => r.json()),
    ])
      .then(([dataContas, dataOpt]) => {
        if (dataContas.success && dataContas.data) {
          setPais(dataContas.data.map((p: { id: number; codigo: string; nome: string }) => ({ id: p.id, codigo: p.codigo, nome: p.nome })));
        }
        if (dataOpt.success && dataOpt.data) {
          const o = dataOpt.data;
          setClassificacoes(o.classificacoes ?? []);
          setGrupos(o.grupos ?? []);
          setNaturezas(o.naturezas ?? []);
          const c = o.classificacoes?.[0]?.id;
          const primeiroGrupoDaClass = (o.grupos ?? []).find((gr: { classificacao_id: number }) => gr.classificacao_id === c);
          const g = primeiroGrupoDaClass?.id ?? o.grupos?.[0]?.id;
          const n = o.naturezas?.[0]?.id;
          setForm((f) => ({
            ...f,
            classificacao_id: c ?? '',
            grupo_dre_id: g ?? '',
            natureza_fluxo_id: n ?? '',
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.codigo.trim() || !form.nome.trim()) {
      setError('Código e nome são obrigatórios.');
      return;
    }
    setSaving(true);
    const payload = {
      codigo: form.codigo.trim(),
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      plano_pai_id: form.plano_pai_id === '' ? null : form.plano_pai_id,
      classificacao_id: form.classificacao_id === '' ? null : form.classificacao_id,
      grupo_dre_id: form.grupo_dre_id === '' ? null : form.grupo_dre_id,
      natureza_fluxo_id: form.natureza_fluxo_id === '' ? null : form.natureza_fluxo_id,
      tipo_conta: form.tipo_conta,
      eh_receita: form.eh_receita,
      eh_despesa: form.eh_despesa,
      ativo: form.ativo,
    };
    try {
      const res = await fetch('/api/plano-contas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/plano-contas');
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
    return (
      <>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Plano de contas', href: '/plano-contas' }, { label: 'Nova conta' }]} />
        <div className="mt-4 p-6 text-slate-500">Carregando...</div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Plano de contas', href: '/plano-contas' }, { label: 'Nova conta' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Nova conta</h2>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 max-w-2xl">
          {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código *</label>
                <input
                  type="text"
                  required
                  value={form.codigo}
                  onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Conta pai</label>
              <select
                value={form.plano_pai_id}
                onChange={(e) => setForm((f) => ({ ...f, plano_pai_id: e.target.value === '' ? '' : Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200"
              >
                <option value="">Nenhuma (raiz)</option>
                {pais.map((p) => (
                  <option key={p.id} value={p.id}>{p.codigo} – {p.nome}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Classificação</label>
                <select
                  value={form.classificacao_id}
                  onChange={(e) => {
                    const v = e.target.value === '' ? '' : Number(e.target.value);
                    setForm((f) => ({ ...f, classificacao_id: v, grupo_dre_id: '' }));
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                >
                  {classificacoes.map((c) => (
                    <option key={c.id} value={c.id}>{c.codigo} – {c.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Grupo DRE</label>
                <select
                  value={form.grupo_dre_id}
                  onChange={(e) => setForm((f) => ({ ...f, grupo_dre_id: e.target.value === '' ? '' : Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                >
                  {gruposFiltrados.map((g) => (
                    <option key={g.id} value={g.id}>{g.codigo} – {g.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Natureza</label>
                <select
                  value={form.natureza_fluxo_id}
                  onChange={(e) => setForm((f) => ({ ...f, natureza_fluxo_id: e.target.value === '' ? '' : Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                >
                  {naturezas.map((n) => (
                    <option key={n.id} value={n.id}>{n.codigo} – {n.nome}</option>
                  ))}
                </select>
              </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo conta</label>
                <select
                  value={form.tipo_conta}
                  onChange={(e) => setForm((f) => ({ ...f, tipo_conta: e.target.value as 'sintetica' | 'analitica' }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                >
                  <option value="analitica">Analítica</option>
                  <option value="sintetica">Sintética</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.eh_receita === 1}
                  onChange={(e) => setForm((f) => ({ ...f, eh_receita: e.target.checked ? 1 : 0 }))}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span className="text-sm text-slate-700">É receita</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.eh_despesa === 1}
                  onChange={(e) => setForm((f) => ({ ...f, eh_despesa: e.target.checked ? 1 : 0 }))}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span className="text-sm text-slate-700">É despesa</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.ativo === 1}
                  onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked ? 1 : 0 }))}
                  className="rounded border-slate-300 text-indigo-600"
                />
                <span className="text-sm text-slate-700">Ativo</span>
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <Link href="/plano-contas" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
