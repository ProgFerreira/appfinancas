'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Cliente } from '@/types';

const TIPOS = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'funcionario', label: 'Funcionário' },
  { value: 'parceiro', label: 'Parceiro' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'outros', label: 'Outros' },
];

const CLASSIFICACOES = [
  { value: '', label: '—' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
];

type Options = {
  centrosCusto: { id: number; nome: string }[];
  categoriasReceita: { id: number; nome: string }[];
  categoriasDespesa: { id: number; nome: string }[];
  planoContas: { id: number; codigo: string; nome: string }[];
};

type Props = { id?: string; onSuccessCreate?: (newId: number) => Promise<void> };

export function ClienteForm({ id, onSuccessCreate }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [options, setOptions] = useState<Options | null>(null);
  const [form, setForm] = useState({
    nome: '',
    razao_social: '',
    cnpj_cpf: '',
    inscricao_estadual: '',
    tipo_cadastro: 'cliente',
    tipo_parceiro: '',
    condicao_pagamento: '',
    dados_bancarios: '',
    classificacao: '' as '' | 'A' | 'B' | 'C',
    contato: '',
    email: '',
    telefone: '',
    telefone_xml: '',
    observacoes: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    codigo_municipio: '' as string | number,
    municipio: '',
    uf: '',
    codigo_pais: '' as string | number,
    pais: '',
    prazo_pagamento: '' as string | number,
    tipo_cobranca: 'boleto',
    pode_faturar: 1,
    centro_custo_id: '' as number | '',
    categoria_receita_id: '' as number | '',
    categoria_despesa_id: '' as number | '',
    plano_contas_id: '' as number | '',
    plano_contas_despesa_id: '' as number | '',
    ativo: 1,
  });

  useEffect(() => {
    fetch('/api/cadastros/options')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setOptions({
            centrosCusto: data.data.centrosCusto ?? [],
            categoriasReceita: data.data.categoriasReceita ?? [],
            categoriasDespesa: data.data.categoriasDespesa ?? [],
            planoContas: data.data.planoContas ?? [],
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
    fetch(`/api/clientes/${id}`)
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { parsed: null, status: res.status };
        try {
          const parsed = JSON.parse(text) as { success: boolean; data?: Cliente };
          return { parsed, status: res.status };
        } catch {
          return { parsed: null, status: res.status };
        }
      })
      .then(({ parsed, status }) => {
        if (status === 401) {
          router.push('/login');
          return;
        }
        if (parsed?.success && parsed.data) {
          const c = parsed.data;
          setForm({
            nome: c.nome ?? '',
            razao_social: c.razao_social ?? '',
            cnpj_cpf: c.cnpj_cpf ?? '',
            inscricao_estadual: c.inscricao_estadual ?? '',
            tipo_cadastro: c.tipo_cadastro ?? 'cliente',
            tipo_parceiro: c.tipo_parceiro ?? '',
            condicao_pagamento: c.condicao_pagamento ?? '',
            dados_bancarios: c.dados_bancarios ?? '',
            classificacao: (c.classificacao ?? '') as '' | 'A' | 'B' | 'C',
            contato: c.contato ?? '',
            email: c.email ?? '',
            telefone: c.telefone ?? '',
            telefone_xml: c.telefone_xml ?? '',
            observacoes: c.observacoes ?? '',
            cep: c.cep ?? '',
            logradouro: c.logradouro ?? '',
            numero: c.numero ?? '',
            complemento: c.complemento ?? '',
            bairro: c.bairro ?? '',
            codigo_municipio: c.codigo_municipio ?? '',
            municipio: c.municipio ?? '',
            uf: c.uf ?? '',
            codigo_pais: c.codigo_pais ?? '',
            pais: c.pais ?? '',
            prazo_pagamento: c.prazo_pagamento ?? '',
            tipo_cobranca: c.tipo_cobranca ?? 'boleto',
            pode_faturar: c.pode_faturar ?? 1,
            centro_custo_id: c.centro_custo_id ?? '',
            categoria_receita_id: c.categoria_receita_id ?? '',
            categoria_despesa_id: c.categoria_despesa_id ?? '',
            plano_contas_id: c.plano_contas_id ?? '',
            plano_contas_despesa_id: c.plano_contas_despesa_id ?? '',
            ativo: c.ativo ?? 1,
          });
        } else {
          setError('Cliente não encontrado.');
        }
      })
      .catch(() => setError('Erro ao carregar cliente.'))
      .finally(() => setLoading(false));
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      nome: form.nome.trim(),
      razao_social: form.razao_social.trim() || undefined,
      cnpj_cpf: form.cnpj_cpf.trim() || undefined,
      inscricao_estadual: form.inscricao_estadual.trim() || undefined,
      tipo_cadastro: form.tipo_cadastro,
      tipo_parceiro: form.tipo_parceiro.trim() || undefined,
      condicao_pagamento: form.condicao_pagamento.trim() || undefined,
      dados_bancarios: form.dados_bancarios.trim() || undefined,
      classificacao: form.classificacao || undefined,
      contato: form.contato.trim() || undefined,
      email: form.email.trim() || undefined,
      telefone: form.telefone.trim() || undefined,
      telefone_xml: form.telefone_xml.trim() || undefined,
      observacoes: form.observacoes.trim() || undefined,
      cep: form.cep.trim() || undefined,
      logradouro: form.logradouro.trim() || undefined,
      numero: form.numero.trim() || undefined,
      complemento: form.complemento.trim() || undefined,
      bairro: form.bairro.trim() || undefined,
      codigo_municipio: form.codigo_municipio === '' ? undefined : Number(form.codigo_municipio),
      municipio: form.municipio.trim() || undefined,
      uf: form.uf.trim() || undefined,
      codigo_pais: form.codigo_pais === '' ? undefined : Number(form.codigo_pais),
      pais: form.pais.trim() || undefined,
      prazo_pagamento: form.prazo_pagamento === '' ? undefined : Number(form.prazo_pagamento),
      tipo_cobranca: form.tipo_cobranca || undefined,
      pode_faturar: form.pode_faturar,
      centro_custo_id: form.centro_custo_id || undefined,
      categoria_receita_id: form.categoria_receita_id || undefined,
      categoria_despesa_id: form.categoria_despesa_id || undefined,
      plano_contas_id: form.plano_contas_id || undefined,
      plano_contas_despesa_id: form.plano_contas_despesa_id || undefined,
      ativo: form.ativo,
    };
    const url = id ? `/api/clientes/${id}` : '/api/clientes';
    const method = id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data: { success?: boolean; data?: { id?: number }; error?: string; detail?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError(`Resposta inválida do servidor. Status: ${res.status}. Corpo: ${text.slice(0, 200)}`);
        setSaving(false);
        return;
      }
      if (data.success) {
        const newId = id ? undefined : (Number(data.data?.id) || undefined);
        if (!id && newId) {
          if (onSuccessCreate) {
            await onSuccessCreate(newId);
            return;
          }
          router.push('/clientes?created=1');
        } else {
          router.push('/clientes');
        }
        router.refresh();
        return;
      }
      const msg = [data.error ?? 'Erro ao salvar.', res.status && `(HTTP ${res.status})`, data.detail].filter(Boolean).join(' ');
      setError(msg);
      if (res.status === 401) router.push('/login');
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setError(`Erro de conexão. Detalhe: ${detail}`);
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
        <div className="mb-4 p-4 rounded-lg bg-red-50 border-2 border-red-300 text-red-800 text-sm space-y-1">
          <p className="font-medium">Erro ao salvar</p>
          <p className="whitespace-pre-wrap break-words">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-grid-2">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-slate-700 mb-1">
              Nome *
            </label>
            <input
              id="nome"
              type="text"
              required
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="razao_social" className="block text-sm font-medium text-slate-700 mb-1">
              Razão social *
            </label>
            <input
              id="razao_social"
              type="text"
              required
              value={form.razao_social}
              onChange={(e) => setForm((f) => ({ ...f, razao_social: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label htmlFor="cnpj_cpf" className="block text-sm font-medium text-slate-700 mb-1">
              CNPJ/CPF
            </label>
            <input
              id="cnpj_cpf"
              type="text"
              value={form.cnpj_cpf}
              onChange={(e) => setForm((f) => ({ ...f, cnpj_cpf: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="tipo_cadastro" className="block text-sm font-medium text-slate-700 mb-1">
              Tipo
            </label>
            <select
              id="tipo_cadastro"
              value={form.tipo_cadastro}
              onChange={(e) => setForm((f) => ({ ...f, tipo_cadastro: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {form.tipo_cadastro === 'parceiro' && (
          <div>
            <label htmlFor="tipo_parceiro" className="block text-sm font-medium text-slate-700 mb-1">Tipo parceiro</label>
            <input
              id="tipo_parceiro"
              type="text"
              value={form.tipo_parceiro}
              onChange={(e) => setForm((f) => ({ ...f, tipo_parceiro: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}
        <div className="form-grid">
          <div>
            <label htmlFor="condicao_pagamento" className="block text-sm font-medium text-slate-700 mb-1">Condição pagamento</label>
            <input
              id="condicao_pagamento"
              type="text"
              value={form.condicao_pagamento}
              onChange={(e) => setForm((f) => ({ ...f, condicao_pagamento: e.target.value }))}
              placeholder="Ex: 30 dias"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="inscricao_estadual" className="block text-sm font-medium text-slate-700 mb-1">
              Inscrição estadual
            </label>
            <input
              id="inscricao_estadual"
              type="text"
              value={form.inscricao_estadual}
              onChange={(e) => setForm((f) => ({ ...f, inscricao_estadual: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="classificacao" className="block text-sm font-medium text-slate-700 mb-1">
              Classificação
            </label>
            <select
              id="classificacao"
              value={form.classificacao}
              onChange={(e) => setForm((f) => ({ ...f, classificacao: e.target.value as '' | 'A' | 'B' | 'C' }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              {CLASSIFICACOES.map((o) => (
                <option key={o.value || 'x'} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="telefone" className="block text-sm font-medium text-slate-700 mb-1">
              Telefone
            </label>
            <input
              id="telefone"
              type="text"
              value={form.telefone}
              onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="telefone_xml" className="block text-sm font-medium text-slate-700 mb-1">Telefone XML</label>
            <input
              id="telefone_xml"
              type="text"
              value={form.telefone_xml}
              onChange={(e) => setForm((f) => ({ ...f, telefone_xml: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="dados_bancarios" className="block text-sm font-medium text-slate-700 mb-1">Dados bancários (texto)</label>
          <textarea
            id="dados_bancarios"
            rows={2}
            value={form.dados_bancarios}
            onChange={(e) => setForm((f) => ({ ...f, dados_bancarios: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="contato" className="block text-sm font-medium text-slate-700 mb-1">
            Contato
          </label>
          <input
            id="contato"
            type="text"
            value={form.contato}
            onChange={(e) => setForm((f) => ({ ...f, contato: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="border-t border-slate-200 pt-4 mt-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Endereço</h4>
          <div className="form-grid">
            <div>
              <label htmlFor="cep" className="block text-sm font-medium text-slate-600 mb-1">CEP</label>
              <input
                id="cep"
                type="text"
                value={form.cep}
                onChange={(e) => setForm((f) => ({ ...f, cep: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="uf" className="block text-sm font-medium text-slate-600 mb-1">UF</label>
              <input
                id="uf"
                type="text"
                maxLength={2}
                value={form.uf}
                onChange={(e) => setForm((f) => ({ ...f, uf: e.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="form-grid mt-2">
            <div className="sm:col-span-2">
              <label htmlFor="logradouro" className="block text-sm font-medium text-slate-600 mb-1">Logradouro</label>
              <input
                id="logradouro"
                type="text"
                value={form.logradouro}
                onChange={(e) => setForm((f) => ({ ...f, logradouro: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="numero" className="block text-sm font-medium text-slate-600 mb-1">Número</label>
              <input
                id="numero"
                type="text"
                value={form.numero}
                onChange={(e) => setForm((f) => ({ ...f, numero: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="complemento" className="block text-sm font-medium text-slate-600 mb-1">Complemento</label>
              <input
                id="complemento"
                type="text"
                value={form.complemento}
                onChange={(e) => setForm((f) => ({ ...f, complemento: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="bairro" className="block text-sm font-medium text-slate-600 mb-1">Bairro</label>
              <input
                id="bairro"
                type="text"
                value={form.bairro}
                onChange={(e) => setForm((f) => ({ ...f, bairro: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="municipio" className="block text-sm font-medium text-slate-600 mb-1">Município</label>
              <input
                id="municipio"
                type="text"
                value={form.municipio}
                onChange={(e) => setForm((f) => ({ ...f, municipio: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="codigo_municipio" className="block text-sm font-medium text-slate-600 mb-1">Cód. município</label>
              <input
                id="codigo_municipio"
                type="number"
                value={form.codigo_municipio === '' ? '' : form.codigo_municipio}
                onChange={(e) => setForm((f) => ({ ...f, codigo_municipio: e.target.value === '' ? '' : Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="codigo_pais" className="block text-sm font-medium text-slate-600 mb-1">Cód. país</label>
              <input
                id="codigo_pais"
                type="number"
                value={form.codigo_pais === '' ? '' : form.codigo_pais}
                onChange={(e) => setForm((f) => ({ ...f, codigo_pais: e.target.value === '' ? '' : Number(e.target.value) }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="pais" className="block text-sm font-medium text-slate-600 mb-1">País</label>
              <input
                id="pais"
                type="text"
                value={form.pais}
                onChange={(e) => setForm((f) => ({ ...f, pais: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label htmlFor="prazo_pagamento" className="block text-sm font-medium text-slate-700 mb-1">
              Prazo pagamento (dias)
            </label>
            <input
              id="prazo_pagamento"
              type="number"
              min={0}
              value={form.prazo_pagamento === '' ? '' : form.prazo_pagamento}
              onChange={(e) => setForm((f) => ({ ...f, prazo_pagamento: e.target.value === '' ? '' : Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="tipo_cobranca" className="block text-sm font-medium text-slate-700 mb-1">
              Tipo cobrança
            </label>
            <input
              id="tipo_cobranca"
              type="text"
              value={form.tipo_cobranca}
              onChange={(e) => setForm((f) => ({ ...f, tipo_cobranca: e.target.value }))}
              placeholder="Ex: boleto, PIX"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="pode_faturar"
              type="checkbox"
              checked={form.pode_faturar === 1}
              onChange={(e) => setForm((f) => ({ ...f, pode_faturar: e.target.checked ? 1 : 0 }))}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="pode_faturar" className="text-sm text-slate-700">Pode faturar</label>
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label htmlFor="centro_custo_id" className="block text-sm font-medium text-slate-700 mb-1">Centro de custo</label>
            <select
              id="centro_custo_id"
              value={form.centro_custo_id}
              onChange={(e) => setForm((f) => ({ ...f, centro_custo_id: e.target.value ? Number(e.target.value) : '' }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Selecione —</option>
              {(options?.centrosCusto ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="categoria_receita_id" className="block text-sm font-medium text-slate-700 mb-1">Categoria receita</label>
            <select
              id="categoria_receita_id"
              value={form.categoria_receita_id}
              onChange={(e) => setForm((f) => ({ ...f, categoria_receita_id: e.target.value ? Number(e.target.value) : '' }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Selecione —</option>
              {(options?.categoriasReceita ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="categoria_despesa_id" className="block text-sm font-medium text-slate-700 mb-1">Categoria despesa</label>
            <select
              id="categoria_despesa_id"
              value={form.categoria_despesa_id}
              onChange={(e) => setForm((f) => ({ ...f, categoria_despesa_id: e.target.value ? Number(e.target.value) : '' }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Selecione —</option>
              {(options?.categoriasDespesa ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="plano_contas_id" className="block text-sm font-medium text-slate-700 mb-1">Plano de contas (receita)</label>
            <select
              id="plano_contas_id"
              value={form.plano_contas_id}
              onChange={(e) => setForm((f) => ({ ...f, plano_contas_id: e.target.value ? Number(e.target.value) : '' }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Selecione —</option>
              {(options?.planoContas ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.codigo} – {p.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="plano_contas_despesa_id" className="block text-sm font-medium text-slate-700 mb-1">Plano de contas (despesa)</label>
            <select
              id="plano_contas_despesa_id"
              value={form.plano_contas_despesa_id}
              onChange={(e) => setForm((f) => ({ ...f, plano_contas_despesa_id: e.target.value ? Number(e.target.value) : '' }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Selecione —</option>
              {(options?.planoContas ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.codigo} – {p.nome}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="observacoes" className="block text-sm font-medium text-slate-700 mb-1">
            Observações
          </label>
          <textarea
            id="observacoes"
            rows={3}
            value={form.observacoes}
            onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="ativo"
            type="checkbox"
            checked={form.ativo === 1}
            onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked ? 1 : 0 }))}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="ativo" className="text-sm text-slate-700">
            Ativo
          </label>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <Link
            href="/clientes"
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
