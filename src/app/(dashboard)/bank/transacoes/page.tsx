'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Breadcrumb } from '@/components/Breadcrumb';
import Link from 'next/link';

type SuggestionItem = {
  match_id: number;
  tipo: 'pagamento' | 'recebimento';
  referencia: number;
  descricao: string | null;
  valor: number;
  score: number;
};

type CadastroOptions = {
  categoriasDespesa?: { id: number; nome: string }[];
  categoriasReceita?: { id: number; nome: string }[];
  clientes?: { id: number; nome: string }[];
  centrosCusto?: { id: number; nome: string }[];
  planoContas?: { id: number; codigo: string; nome: string }[];
  contasBancarias?: { id: number; descricao: string }[];
};

function DrawerTransacao({
  tx,
  options,
  initialExpandPayable,
  initialExpandReceivable,
  onClose,
  onAction,
  setToast,
}: {
  tx: TxRow;
  options: CadastroOptions | null;
  initialExpandPayable?: boolean;
  initialExpandReceivable?: boolean;
  onClose: () => void;
  onAction: () => void;
  setToast: (t: { type: 'success' | 'error'; message: string } | null) => void;
}) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [showCreatePayable, setShowCreatePayable] = useState(false);
  const [showCreateReceivable, setShowCreateReceivable] = useState(false);
  const [creatingPayable, setCreatingPayable] = useState(false);
  const [creatingReceivable, setCreatingReceivable] = useState(false);
  const postedAt = typeof tx.posted_at === 'string' ? tx.posted_at.slice(0, 10) : '';
  const defaultCompetence = postedAt ? `${postedAt.slice(0, 7)}-01` : '';
  const defaultDesc = (tx.memo || tx.payee || `OFX ${postedAt}`).slice(0, 180);
  const defaultContaId = tx.bank_account_id ? String(tx.bank_account_id) : '';
  const [payableForm, setPayableForm] = useState({
    categoria_id: '',
    data_competencia: defaultCompetence,
    data_lancamento_baixa: postedAt,
    conta_bancaria_id: defaultContaId,
    descricao: defaultDesc,
    fornecedor_id: '',
    fornecedor_nome: '',
    centro_custo_id: '',
    plano_contas_id: '',
    tipo_custo: 'variavel',
  });
  const [receivableForm, setReceivableForm] = useState({
    cliente_id: '',
    cliente_nome: '',
    data_competencia: defaultCompetence,
    data_lancamento_baixa: postedAt,
    conta_bancaria_id: defaultContaId,
    descricao: defaultDesc,
    categoria_receita_id: '',
    plano_contas_id: '',
  });
  const [clienteSearchQuery, setClienteSearchQuery] = useState('');
  const [clienteSearchResults, setClienteSearchResults] = useState<{ id: number; nome: string }[]>([]);
  const [clienteSearchLoading, setClienteSearchLoading] = useState(false);
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const clienteSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clienteDropdownRef = useRef<HTMLDivElement>(null);

  const [fornecedorSearchQuery, setFornecedorSearchQuery] = useState('');
  const [fornecedorSearchResults, setFornecedorSearchResults] = useState<{ id: number; nome: string }[]>([]);
  const [fornecedorSearchLoading, setFornecedorSearchLoading] = useState(false);
  const [showFornecedorDropdown, setShowFornecedorDropdown] = useState(false);
  const fornecedorSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fornecedorDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPayableForm((f) => ({ ...f, data_competencia: defaultCompetence, data_lancamento_baixa: postedAt, descricao: defaultDesc, conta_bancaria_id: defaultContaId }));
    setReceivableForm((f) => ({ ...f, data_competencia: defaultCompetence, data_lancamento_baixa: postedAt, descricao: defaultDesc, conta_bancaria_id: defaultContaId }));
  }, [defaultCompetence, defaultDesc, postedAt, defaultContaId]);

  const fetchClientes = useCallback((q: string) => {
    const t = q.trim();
    if (!t || t.length < 2) {
      setClienteSearchResults([]);
      return;
    }
    setClienteSearchLoading(true);
    const params = new URLSearchParams({ q: t, ativo: '1', per_page: '20' });
    fetch(`/api/clientes?${params.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) {
          setClienteSearchResults(j.data.map((c: { id: number; nome: string }) => ({ id: c.id, nome: c.nome })));
        } else {
          setClienteSearchResults([]);
        }
      })
      .catch(() => setClienteSearchResults([]))
      .finally(() => setClienteSearchLoading(false));
  }, []);

  const fetchFornecedores = useCallback((q: string) => {
    const t = q.trim();
    if (!t || t.length < 2) {
      setFornecedorSearchResults([]);
      return;
    }
    setFornecedorSearchLoading(true);
    const params = new URLSearchParams({ q: t, ativo: '1', per_page: '20' });
    fetch(`/api/clientes?${params.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) {
          setFornecedorSearchResults(j.data.map((c: { id: number; nome: string }) => ({ id: c.id, nome: c.nome })));
        } else {
          setFornecedorSearchResults([]);
        }
      })
      .catch(() => setFornecedorSearchResults([]))
      .finally(() => setFornecedorSearchLoading(false));
  }, []);

  useEffect(() => {
    if (clienteSearchTimeoutRef.current) clearTimeout(clienteSearchTimeoutRef.current);
    if (!showCreateReceivable) return;
    clienteSearchTimeoutRef.current = setTimeout(() => {
      fetchClientes(clienteSearchQuery);
      clienteSearchTimeoutRef.current = null;
    }, 300);
    return () => {
      if (clienteSearchTimeoutRef.current) clearTimeout(clienteSearchTimeoutRef.current);
    };
  }, [clienteSearchQuery, showCreateReceivable, fetchClientes]);

  useEffect(() => {
    if (fornecedorSearchTimeoutRef.current) clearTimeout(fornecedorSearchTimeoutRef.current);
    if (!showCreatePayable) return;
    fornecedorSearchTimeoutRef.current = setTimeout(() => {
      fetchFornecedores(fornecedorSearchQuery);
      fornecedorSearchTimeoutRef.current = null;
    }, 300);
    return () => {
      if (fornecedorSearchTimeoutRef.current) clearTimeout(fornecedorSearchTimeoutRef.current);
    };
  }, [fornecedorSearchQuery, showCreatePayable, fetchFornecedores]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clienteDropdownRef.current && !clienteDropdownRef.current.contains(e.target as Node)) {
        setShowClienteDropdown(false);
      }
      if (fornecedorDropdownRef.current && !fornecedorDropdownRef.current.contains(e.target as Node)) {
        setShowFornecedorDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setLoadingSuggestions(true);
    fetch(`/api/bank/transactions/${tx.id}/suggestions`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) setSuggestions(j.data);
        else setSuggestions([]);
      })
      .catch(() => setSuggestions([]))
      .finally(() => setLoadingSuggestions(false));
  }, [tx.id]);

  useEffect(() => {
    if (initialExpandPayable && tx.type === 'debit') setShowCreatePayable(true);
  }, [initialExpandPayable, tx.type]);
  useEffect(() => {
    if (initialExpandReceivable && tx.type === 'credit') setShowCreateReceivable(true);
  }, [initialExpandReceivable, tx.type]);

  function handleConfirmReject(matchId: number, action: 'confirm' | 'reject') {
    setActing(String(matchId));
    fetch(`/api/reconciliation/${matchId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) onAction();
        else setToast({ type: 'error', message: j.error || 'Erro ao processar.' });
      })
      .catch(() => setToast({ type: 'error', message: 'Erro de conexão.' }))
      .finally(() => setActing(null));
  }

  function handleIgnorar() {
    if (!confirm('Marcar esta transação como ignorada?')) return;
    setActing('ignorar');
    fetch('/api/reconciliation/ignore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bank_transaction_id: tx.id }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) onAction();
        else setToast({ type: 'error', message: j.error || 'Erro ao ignorar.' });
      })
      .catch(() => setToast({ type: 'error', message: 'Erro de conexão.' }))
      .finally(() => setActing(null));
  }

  function handleCreatePayable(e: React.FormEvent) {
    e.preventDefault();
    const categoriaId = parseInt(String(payableForm.categoria_id), 10);
    if (!Number.isInteger(categoriaId) || categoriaId < 1) {
      setToast({ type: 'error', message: 'Selecione a categoria.' });
      return;
    }
    setCreatingPayable(true);
    fetch(`/api/bank/transactions/${tx.id}/create-payable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categoria_id: categoriaId,
        data_competencia: payableForm.data_competencia || undefined,
        data_emissao: payableForm.data_lancamento_baixa || undefined,
        data_vencimento: payableForm.data_lancamento_baixa || undefined,
        data_pagamento: payableForm.data_lancamento_baixa || undefined,
        conta_bancaria_id: payableForm.conta_bancaria_id ? parseInt(payableForm.conta_bancaria_id, 10) : undefined,
        descricao: payableForm.descricao || undefined,
        fornecedor_id: payableForm.fornecedor_id ? parseInt(payableForm.fornecedor_id, 10) : undefined,
        centro_custo_id: payableForm.centro_custo_id ? parseInt(payableForm.centro_custo_id, 10) : undefined,
        plano_contas_id: payableForm.plano_contas_id ? parseInt(payableForm.plano_contas_id, 10) : undefined,
        tipo_custo: payableForm.tipo_custo,
      }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setToast({ type: 'success', message: j.data?.message ?? 'Conta a pagar criada e conciliada.' });
          onAction();
        } else setToast({ type: 'error', message: j.error || 'Erro ao criar conta a pagar.' });
      })
      .catch(() => setToast({ type: 'error', message: 'Erro de conexão.' }))
      .finally(() => setCreatingPayable(false));
  }

  function handleCreateReceivable(e: React.FormEvent) {
    e.preventDefault();
    const clienteId = parseInt(String(receivableForm.cliente_id), 10);
    if (!Number.isInteger(clienteId) || clienteId < 1) {
      setToast({ type: 'error', message: 'Selecione o cliente.' });
      return;
    }
    setCreatingReceivable(true);
    fetch(`/api/bank/transactions/${tx.id}/create-receivable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cliente_id: clienteId,
        data_competencia: receivableForm.data_competencia || undefined,
        data_emissao: receivableForm.data_lancamento_baixa || undefined,
        data_vencimento: receivableForm.data_lancamento_baixa || undefined,
        data_recebimento: receivableForm.data_lancamento_baixa || undefined,
        conta_bancaria_id: receivableForm.conta_bancaria_id ? parseInt(receivableForm.conta_bancaria_id, 10) : undefined,
        descricao: receivableForm.descricao || undefined,
        categoria_receita_id: receivableForm.categoria_receita_id ? parseInt(receivableForm.categoria_receita_id, 10) : undefined,
        plano_contas_id: receivableForm.plano_contas_id ? parseInt(receivableForm.plano_contas_id, 10) : undefined,
      }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setToast({ type: 'success', message: j.data?.message ?? 'Conta a receber criada e conciliada.' });
          onAction();
        } else setToast({ type: 'error', message: j.error || 'Erro ao criar conta a receber.' });
      })
      .catch(() => setToast({ type: 'error', message: 'Erro de conexão.' }))
      .finally(() => setCreatingReceivable(false));
  }

  const canCreate = tx.reconciliation_status !== 'conciliado' && tx.reconciliation_status !== 'ignorado';

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-xl border-l border-slate-200 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-800">Detalhes da transação</h3>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-700 text-sm">
            Fechar
          </button>
        </div>
        <div className="text-sm text-slate-700 space-y-1 mb-4">
          <p><span className="font-medium">Data:</span> {tx.posted_at.slice(0, 10)}</p>
          <p><span className="font-medium">Conta:</span> {tx.conta_descricao}</p>
          <p><span className="font-medium">Histórico:</span> {tx.memo || tx.payee || tx.fit_id || '—'}</p>
          <p>
            <span className="font-medium">Valor:</span>{' '}
            <span className={tx.type === 'debit' ? 'text-red-700' : 'text-green-700'}>
              {tx.type === 'debit' ? '-' : ''}
              {Number(tx.amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </p>
          <p>
            <span className="font-medium">Saldo após movimento:</span>{' '}
            {Number(tx.running_balance ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <p>
            <span className="font-medium">Situação:</span>{' '}
            {tx.reconciliation_status === 'conciliado' && 'Conciliado'}
            {tx.reconciliation_status === 'sugestao' && 'Com sugestão'}
            {tx.reconciliation_status === 'nao_conciliado' && 'Não conciliado'}
            {tx.reconciliation_status === 'ignorado' && 'Ignorado'}
          </p>
        </div>
        <h4 className="text-xs font-semibold text-slate-700 mb-2">Sugestões de lançamentos</h4>
        {loadingSuggestions && <p className="text-slate-500 text-sm">Carregando...</p>}
        {!loadingSuggestions && suggestions.length === 0 && (
          <p className="text-slate-500 text-sm">Nenhuma sugestão. Use &quot;Gerar sugestões&quot; na tela de Conciliação ou vincule manualmente.</p>
        )}
        {!loadingSuggestions && suggestions.length > 0 && (
          <ul className="space-y-2 mb-4">
            {suggestions.map((s) => (
              <li key={s.match_id} className="p-2 rounded border border-slate-200 bg-slate-50 text-sm">
                <div className="font-medium">
                  {s.tipo === 'pagamento' ? 'Pagamento' : 'Recebimento'} #{s.referencia}
                  {s.descricao ? ` — ${s.descricao}` : ''}
                </div>
                <div className="text-slate-600 text-xs mt-1">
                  {Number(s.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · score {s.score}
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={acting !== null}
                    onClick={() => handleConfirmReject(s.match_id, 'confirm')}
                    className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Vincular
                  </button>
                  <button
                    type="button"
                    disabled={acting !== null}
                    onClick={() => handleConfirmReject(s.match_id, 'reject')}
                    className="px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
                  >
                    Rejeitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {canCreate && tx.type === 'debit' && (
          <div className="mb-4 border border-slate-200 rounded p-3 bg-slate-50">
            <button
              type="button"
              onClick={() => setShowCreatePayable((v) => !v)}
              className="text-sm font-medium text-slate-800 hover:text-indigo-600"
            >
              {showCreatePayable ? '▼' : '▶'} Criar CP a partir do OFX
            </button>
            {showCreatePayable && (
              <form onSubmit={handleCreatePayable} className="mt-3 space-y-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">Data do lançamento e da baixa</label>
                  <input
                    type="date"
                    value={payableForm.data_lancamento_baixa}
                    onChange={(e) => setPayableForm((f) => ({ ...f, data_lancamento_baixa: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">Conta bancária</label>
                  <select
                    value={payableForm.conta_bancaria_id}
                    onChange={(e) => setPayableForm((f) => ({ ...f, conta_bancaria_id: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="">Selecione</option>
                    {(options?.contasBancarias ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.descricao}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">Categoria *</label>
                  <select
                    value={payableForm.categoria_id}
                    onChange={(e) => setPayableForm((f) => ({ ...f, categoria_id: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                    required
                  >
                    <option value="">Selecione</option>
                    {(options?.categoriasDespesa ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">Competência</label>
                  <input
                    type="date"
                    value={payableForm.data_competencia}
                    onChange={(e) => setPayableForm((f) => ({ ...f, data_competencia: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">Descrição</label>
                  <input
                    type="text"
                    value={payableForm.descricao}
                    onChange={(e) => setPayableForm((f) => ({ ...f, descricao: e.target.value.slice(0, 180) }))}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                    maxLength={180}
                  />
                </div>
                <div ref={fornecedorDropdownRef} className="relative">
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">Fornecedor</label>
                  {payableForm.fornecedor_id ? (
                    <div className="flex items-center gap-2 border border-slate-300 rounded px-2 py-1.5 text-sm bg-slate-50">
                      <span className="flex-1 text-slate-800">{payableForm.fornecedor_nome}</span>
                      <button
                        type="button"
                        onClick={() => setPayableForm((f) => ({ ...f, fornecedor_id: '', fornecedor_nome: '' }))}
                        className="text-slate-500 hover:text-red-600 text-xs font-medium"
                      >
                        Limpar
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={fornecedorSearchQuery}
                        onChange={(e) => {
                          setFornecedorSearchQuery(e.target.value);
                          setShowFornecedorDropdown(true);
                        }}
                        onFocus={() => setShowFornecedorDropdown(true)}
                        placeholder="Digite para buscar o fornecedor..."
                        className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                        autoComplete="off"
                      />
                      {showFornecedorDropdown && (
                        <div className="absolute z-50 mt-1 w-full rounded border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                          {fornecedorSearchLoading && (
                            <div className="p-2 text-sm text-slate-500">Buscando...</div>
                          )}
                          {!fornecedorSearchLoading && fornecedorSearchQuery.trim().length < 2 && (
                            <div className="p-2 text-sm text-slate-500">Digite ao menos 2 caracteres</div>
                          )}
                          {!fornecedorSearchLoading && fornecedorSearchQuery.trim().length >= 2 && fornecedorSearchResults.length === 0 && (
                            <div className="p-2 text-sm text-slate-500">Nenhum fornecedor encontrado</div>
                          )}
                          {!fornecedorSearchLoading && fornecedorSearchResults.length > 0 &&
                            fornecedorSearchResults.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setPayableForm((f) => ({ ...f, fornecedor_id: String(c.id), fornecedor_nome: c.nome }));
                                  setFornecedorSearchQuery('');
                                  setShowFornecedorDropdown(false);
                                  setFornecedorSearchResults([]);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 border-b border-slate-100 last:border-0"
                              >
                                {c.nome}
                              </button>
                            ))
                          }
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">Centro de custo</label>
                  <select
                    value={payableForm.centro_custo_id}
                    onChange={(e) => setPayableForm((f) => ({ ...f, centro_custo_id: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="">Nenhum</option>
                    {(options?.centrosCusto ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">Tipo custo</label>
                  <select
                    value={payableForm.tipo_custo}
                    onChange={(e) => setPayableForm((f) => ({ ...f, tipo_custo: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="variavel">Variável</option>
                    <option value="fixo">Fixo</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={creatingPayable}
                  className="w-full py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {creatingPayable ? 'Criando...' : 'Criar CP e conciliar'}
                </button>
              </form>
            )}
          </div>
        )}

        {canCreate && tx.type === 'credit' && (
          <div className="mb-4 border border-slate-200 rounded p-3 bg-slate-50">
            <button
              type="button"
              onClick={() => setShowCreateReceivable((v) => !v)}
              className="text-sm font-medium text-slate-800 hover:text-indigo-600"
            >
              {showCreateReceivable ? '▼' : '▶'} Criar CR a partir do OFX
            </button>
            {showCreateReceivable && (
              <form onSubmit={handleCreateReceivable} className="mt-3 space-y-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">Data do lançamento e da baixa</label>
                  <input
                    type="date"
                    value={receivableForm.data_lancamento_baixa}
                    onChange={(e) => setReceivableForm((f) => ({ ...f, data_lancamento_baixa: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">Conta bancária</label>
                  <select
                    value={receivableForm.conta_bancaria_id}
                    onChange={(e) => setReceivableForm((f) => ({ ...f, conta_bancaria_id: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="">Selecione</option>
                    {(options?.contasBancarias ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.descricao}</option>
                    ))}
                  </select>
                </div>
                <div ref={clienteDropdownRef} className="relative">
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">Cliente *</label>
                  {receivableForm.cliente_id ? (
                    <div className="flex items-center gap-2 border border-slate-300 rounded px-2 py-1.5 text-sm bg-slate-50">
                      <span className="flex-1 text-slate-800">{receivableForm.cliente_nome}</span>
                      <button
                        type="button"
                        onClick={() => setReceivableForm((f) => ({ ...f, cliente_id: '', cliente_nome: '' }))}
                        className="text-slate-500 hover:text-red-600 text-xs font-medium"
                      >
                        Limpar
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={clienteSearchQuery}
                        onChange={(e) => {
                          setClienteSearchQuery(e.target.value);
                          setShowClienteDropdown(true);
                        }}
                        onFocus={() => setShowClienteDropdown(true)}
                        placeholder="Digite para buscar o cliente..."
                        className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                        autoComplete="off"
                      />
                      {showClienteDropdown && (
                        <div className="absolute z-50 mt-1 w-full rounded border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                          {clienteSearchLoading && (
                            <div className="p-2 text-sm text-slate-500">Buscando...</div>
                          )}
                          {!clienteSearchLoading && clienteSearchQuery.trim().length < 2 && (
                            <div className="p-2 text-sm text-slate-500">Digite ao menos 2 caracteres</div>
                          )}
                          {!clienteSearchLoading && clienteSearchQuery.trim().length >= 2 && clienteSearchResults.length === 0 && (
                            <div className="p-2 text-sm text-slate-500">Nenhum cliente encontrado</div>
                          )}
                          {!clienteSearchLoading && clienteSearchResults.length > 0 &&
                            clienteSearchResults.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setReceivableForm((f) => ({ ...f, cliente_id: String(c.id), cliente_nome: c.nome }));
                                  setClienteSearchQuery('');
                                  setShowClienteDropdown(false);
                                  setClienteSearchResults([]);
                                }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-100 border-b border-slate-100 last:border-0"
                              >
                                {c.nome}
                              </button>
                            ))
                          }
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">Competência</label>
                  <input
                    type="date"
                    value={receivableForm.data_competencia}
                    onChange={(e) => setReceivableForm((f) => ({ ...f, data_competencia: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">Descrição</label>
                  <input
                    type="text"
                    value={receivableForm.descricao}
                    onChange={(e) => setReceivableForm((f) => ({ ...f, descricao: e.target.value.slice(0, 180) }))}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                    maxLength={180}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-0.5">Categoria receita</label>
                  <select
                    value={receivableForm.categoria_receita_id}
                    onChange={(e) => setReceivableForm((f) => ({ ...f, categoria_receita_id: e.target.value }))}
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                  >
                    <option value="">Nenhuma</option>
                    {(options?.categoriasReceita ?? []).map((c) => (
                      <option key={c.id} value={c.id}>{c.nome}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={creatingReceivable}
                  className="w-full py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                >
                  {creatingReceivable ? 'Criando...' : 'Criar CR e conciliar'}
                </button>
              </form>
            )}
          </div>
        )}

        {tx.reconciliation_status !== 'ignorado' && (
          <button
            type="button"
            disabled={acting !== null}
            onClick={handleIgnorar}
            className="w-full py-2 text-sm border border-amber-300 text-amber-700 rounded hover:bg-amber-50 disabled:opacity-50"
          >
            Marcar como ignorada
          </button>
        )}
      </div>
    </div>
  );
}

interface BestSuggestion {
  match_id: number;
  tipo: 'pagamento' | 'recebimento';
  referencia: number;
  descricao: string | null;
  valor: number;
  score: number;
}

interface TxRow {
  id: number;
  bank_account_id: number;
  fit_id: string;
  posted_at: string;
  amount: number;
  type: string;
  memo: string | null;
  payee: string | null;
  conta_descricao: string;
  reconciliation_status: 'conciliado' | 'nao_conciliado' | 'sugestao' | 'ignorado';
  running_balance: number;
  best_suggestion: BestSuggestion | null;
  suggestions_count: number;
}

export default function BankTransacoesPage() {
  const [data, setData] = useState<TxRow[]>([]);
  const [options, setOptions] = useState<CadastroOptions & { contasBancarias?: { id: number; descricao: string }[] } | null>(null);
  const [imports, setImports] = useState<{ id: number; filename: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankAccountId, setBankAccountId] = useState('');
  const [status, setStatus] = useState<'todos' | 'conciliado' | 'nao_conciliado' | 'sugestao' | 'ignorado'>('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [importId, setImportId] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1, perPage: 20 });
  const [listError, setListError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TxRow | null>(null);
  const [expandPayableOnOpen, setExpandPayableOnOpen] = useState(false);
  const [expandReceivableOnOpen, setExpandReceivableOnOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [gerandoSugestoes, setGerandoSugestoes] = useState(false);

  useEffect(() => {
    fetch('/api/cadastros/options').then((r) => r.json()).then((j) => { if (j.success && j.data) setOptions(j.data); });
  }, []);

  // carregar imports ao trocar conta
  useEffect(() => {
    if (!bankAccountId) {
      setImports([]);
      setImportId('');
      return;
    }
    const params = new URLSearchParams({ bank_account_id: bankAccountId, per_page: '50' });
    fetch(`/api/bank/imports?${params.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) {
          setImports(j.data.map((imp: { id: number; filename: string }) => ({ id: imp.id, filename: imp.filename })));
        } else {
          setImports([]);
        }
      })
      .catch(() => setImports([]));
  }, [bankAccountId]);

  useEffect(() => {
    setLoading(true);
    setListError(null);
    const params = new URLSearchParams({ page: String(page), per_page: '20' });
    if (bankAccountId) params.set('bank_account_id', bankAccountId);
    if (dataInicio) params.set('start_date', dataInicio);
    if (dataFim) params.set('end_date', dataFim);
    if (status && status !== 'todos') params.set('status', status);
    if (importId) params.set('import_id', importId);
    fetch(`/api/bank/transactions?${params.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (j && j.success === true) {
          const list = Array.isArray(j.data) ? j.data : [];
          const metaInfo = j.meta || { total: 0, totalPages: 1 };
          const totalPages = Math.max(1, Number(metaInfo.totalPages));
          setData(list);
          setMeta({ total: Number(metaInfo.total ?? 0), totalPages, page: Number(metaInfo.page ?? page), perPage: Number(metaInfo.perPage ?? 20) });
          setListError(null);
          if (Number(page) > totalPages) setPage(totalPages);
        } else {
          setData([]);
          const msg = (j && j.detail) ? `${j.error ?? 'Erro'} — ${j.detail}` : (j && j.error) ?? 'Erro ao carregar';
          setListError((j && j.hint) ? `${msg}. ${j.hint}` : msg);
        }
      })
      .catch(() => {
        setData([]);
        setListError('Erro de conexão.');
      })
      .finally(() => setLoading(false));
  }, [page, bankAccountId, dataInicio, dataFim, status, importId, refreshKey]);

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Contas bancárias', href: '/contas-bancarias' }, { label: 'Transações extrato' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Extrato bancário</h2>
        <p className="text-sm text-slate-600 mb-4">
          Importe o OFX em <Link href="/bank/importar" className="text-indigo-600 hover:underline">Importar OFX</Link>, depois use esta tela para ver o extrato e vincular transações a lançamentos já existentes (sugestões) ou ignorar.
        </p>
        {toast && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {toast.message}
            <button type="button" onClick={() => setToast(null)} className="ml-2 underline">Fechar</button>
          </div>
        )}
        {listError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            {listError}
          </div>
        )}
        {options && (
          <div className="mb-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Conta</label>
              <select
                value={bankAccountId}
                onChange={(e) => { setBankAccountId(e.target.value); setPage(1); }}
                className="border border-slate-300 rounded px-2 py-1 min-w-[180px]"
              >
                <option value="">Todas</option>
                {(options.contasBancarias ?? []).map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.descricao}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">De</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => { setDataInicio(e.target.value); setPage(1); }}
                className="border border-slate-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Até</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => { setDataFim(e.target.value); setPage(1); }}
                className="border border-slate-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Situação</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value as typeof status); setPage(1); }}
                className="border border-slate-300 rounded px-2 py-1"
              >
                <option value="todos">Todas</option>
                <option value="nao_conciliado">Não conciliado</option>
                <option value="sugestao">Com sugestão</option>
                <option value="conciliado">Conciliado</option>
                <option value="ignorado">Ignorado</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-700 mb-1">Importação</label>
              <select
                value={importId}
                onChange={(e) => { setImportId(e.target.value); setPage(1); }}
                className="border border-slate-300 rounded px-2 py-1 min-w-[180px]"
                disabled={!bankAccountId || imports.length === 0}
              >
                <option value="">{imports.length === 0 ? 'Todas' : 'Todas as importações'}</option>
                {imports.map((imp) => (
                  <option key={imp.id} value={String(imp.id)}>
                    #{imp.id} — {imp.filename}
                  </option>
                ))}
              </select>
            </div>
            {bankAccountId && (
              <button
                type="button"
                disabled={gerandoSugestoes}
                onClick={() => {
                  setGerandoSugestoes(true);
                  fetch('/api/reconciliation/suggestions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bank_account_id: parseInt(bankAccountId, 10), tolerance: 0.01, days: 2 }),
                  })
                    .then((r) => r.json())
                    .then((j) => {
                      if (j.success) {
                        setToast({ type: 'success', message: (j.data?.count ?? 0) > 0 ? `${j.data.count} sugestão(ões) gerada(s).` : 'Nenhuma sugestão encontrada para as transações em aberto.' });
                        setRefreshKey((k) => k + 1);
                      } else setToast({ type: 'error', message: j.error || 'Erro ao gerar sugestões.' });
                    })
                    .catch(() => setToast({ type: 'error', message: 'Erro de conexão.' }))
                    .finally(() => setGerandoSugestoes(false));
                }}
                className="px-3 py-1.5 rounded border border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 disabled:opacity-50 text-sm"
              >
                {gerandoSugestoes ? 'Gerando...' : 'Gerar sugestões'}
              </button>
            )}
          </div>
        )}
        <div key={`transactions-page-${page}`} className="min-h-[200px]">
          {loading ? (
            <p className="text-slate-500 py-4">Carregando...</p>
          ) : (
            <>
            <div className="border border-slate-200 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-2">Data</th>
                    <th className="text-left p-2">Conta</th>
                    <th className="text-left p-2">Histórico</th>
                    <th className="text-right p-2">Valor</th>
                    <th className="text-right p-2">Saldo</th>
                    <th className="text-left p-2">Situação</th>
                    <th className="text-left p-2">Sugestão</th>
                    <th className="text-right p-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-slate-500 text-center">
                        Nenhuma transação.
                        <p className="mt-2 text-sm">Importe um OFX em <Link href="/bank/importar" className="text-indigo-600 hover:underline">Importar OFX</Link>.</p>
                      </td>
                    </tr>
                  ) : (
                    data.map((tx, idx) => (
                      <tr key={tx?.id ?? `row-${idx}`} className="border-t border-slate-100">
                        <td className="p-2 text-slate-800">
                          {typeof tx?.posted_at === 'string' ? tx.posted_at.slice(0, 10) : (tx?.posted_at ? String(tx.posted_at).slice(0, 10) : '—')}
                        </td>
                        <td className="p-2">{tx?.conta_descricao ?? '—'}</td>
                        <td className="p-2">{tx?.memo || tx?.payee || tx?.fit_id || '—'}</td>
                        <td className={`p-2 text-right ${tx?.type === 'debit' ? 'text-red-700' : 'text-green-700'}`}>
                          {tx?.type === 'debit' ? '-' : ''}{Number(tx?.amount ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-2 text-right text-slate-800">
                          {Number(tx?.running_balance ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </td>
                        <td className="p-2">
                          {tx?.reconciliation_status === 'conciliado' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Conciliado
                            </span>
                          )}
                          {tx?.reconciliation_status === 'sugestao' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              Sugestão
                            </span>
                          )}
                          {tx?.reconciliation_status === 'nao_conciliado' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                              Não conciliado
                            </span>
                          )}
                          {tx?.reconciliation_status === 'ignorado' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                              Ignorado
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-slate-700 text-xs">
                          {tx?.best_suggestion ? (
                            <>
                              {tx.best_suggestion.tipo === 'pagamento' ? 'Pagamento' : 'Recebimento'} #{tx.best_suggestion.referencia}
                              {' · '}
                              {Number(tx.best_suggestion.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              {' · score '}
                              {tx.best_suggestion.score}
                              {(tx?.suggestions_count ?? 0) > 1 ? ` (${(tx?.suggestions_count ?? 0) - 1} outra${(tx?.suggestions_count ?? 0) - 1 > 1 ? 's' : ''})` : ''}
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-2 text-right">
                          {tx?.reconciliation_status !== 'conciliado' && tx?.reconciliation_status !== 'ignorado' && tx?.type === 'debit' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTx(tx);
                                setExpandPayableOnOpen(true);
                                setDrawerOpen(true);
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 mr-1"
                            >
                              Criar CP
                            </button>
                          )}
                          {tx?.reconciliation_status !== 'conciliado' && tx?.reconciliation_status !== 'ignorado' && tx?.type === 'credit' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTx(tx);
                                setExpandReceivableOnOpen(true);
                                setDrawerOpen(true);
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 mr-1"
                            >
                              Criar CR
                            </button>
                          )}
                          {tx?.reconciliation_status !== 'conciliado' && tx?.reconciliation_status !== 'ignorado' && tx?.best_suggestion && (
                            <button
                              type="button"
                              disabled={actionLoading !== null}
                              onClick={() => {
                                setActionLoading(`vincular-${tx!.id}`);
                                fetch(`/api/reconciliation/${tx!.best_suggestion!.match_id}`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ action: 'confirm' }),
                                })
                                  .then((r) => r.json())
                                  .then((j) => {
                                    if (j.success) { setToast({ type: 'success', message: 'Transação vinculada ao lançamento.' }); setRefreshKey((k) => k + 1); setDrawerOpen(false); setSelectedTx(null); }
                                    else setToast({ type: 'error', message: j.error || 'Erro ao vincular.' });
                                  })
                                  .catch(() => setToast({ type: 'error', message: 'Erro de conexão.' }))
                                  .finally(() => setActionLoading(null));
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50 mr-1"
                            >
                              Vincular
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => { setSelectedTx(tx); setExpandPayableOnOpen(false); setExpandReceivableOnOpen(false); setDrawerOpen(true); }}
                            className="inline-flex items-center px-2 py-1 text-xs border border-slate-300 rounded hover:bg-slate-50 mr-1"
                          >
                            Detalhes
                          </button>
                          {tx?.reconciliation_status !== 'ignorado' && (
                            <button
                              type="button"
                              disabled={actionLoading !== null}
                              onClick={() => {
                                if (!confirm('Marcar esta transação como ignorada?')) return;
                                setActionLoading(`ignorar-${tx!.id}`);
                                fetch('/api/reconciliation/ignore', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ bank_transaction_id: tx!.id }),
                                })
                                  .then((r) => r.json())
                                  .then((j) => {
                                    if (j.success) { setToast({ type: 'success', message: 'Transação ignorada.' }); setRefreshKey((k) => k + 1); setDrawerOpen(false); setSelectedTx(null); }
                                    else setToast({ type: 'error', message: j.error || 'Erro ao ignorar.' });
                                  })
                                  .catch(() => setToast({ type: 'error', message: 'Erro de conexão.' }))
                                  .finally(() => setActionLoading(null));
                              }}
                              className="inline-flex items-center px-2 py-1 text-xs border border-amber-300 text-amber-700 rounded hover:bg-amber-50 disabled:opacity-50 mr-1"
                            >
                              Ignorar
                            </button>
                          )}
                          <Link
                            href={tx.type === 'debit'
                              ? `/contas-pagar/novo?conta_bancaria_id=${tx?.bank_account_id ?? ''}&valor=${tx?.amount ?? ''}&data_vencimento=${typeof tx?.posted_at === 'string' ? tx.posted_at.slice(0, 10) : ''}&descricao=${encodeURIComponent((tx?.memo || tx?.payee || '').slice(0, 100))}`
                              : `/contas-receber/novo?conta_bancaria_id=${tx?.bank_account_id ?? ''}&valor=${tx?.amount ?? ''}&data_vencimento=${typeof tx?.posted_at === 'string' ? tx.posted_at.slice(0, 10) : ''}&descricao=${encodeURIComponent((tx?.memo || tx?.payee || '').slice(0, 100))}`}
                            className="inline-flex items-center px-2 py-1 text-xs border border-indigo-200 text-indigo-700 rounded hover:bg-indigo-50"
                          >
                            Lançar novo
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {Number(meta.totalPages) > 1 && (
              <div className="mt-2 flex gap-2 items-center">
                <button
                  type="button"
                  disabled={Number(page) <= 1}
                  onClick={() => {
                    setDrawerOpen(false);
                    setSelectedTx(null);
                    setPage((p) => Math.max(1, p - 1));
                  }}
                  className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Anterior
                </button>
                <span className="py-1 text-sm text-slate-600">Página {Number(page)} de {Number(meta.totalPages)}</span>
                <button
                  type="button"
                  disabled={Number(page) >= Number(meta.totalPages)}
                  onClick={() => {
                    setDrawerOpen(false);
                    setSelectedTx(null);
                    setPage((p) => Math.min(Number(meta.totalPages), p + 1));
                  }}
                  className="px-3 py-1 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Próxima
                </button>
              </div>
            )}
            </>
          )}
        </div>
        <p className="mt-4">
          <Link href="/bank/importar" className="text-indigo-600 hover:underline">Importar OFX</Link>
        </p>

        {drawerOpen && selectedTx && selectedTx.id != null && (
          <DrawerTransacao
            tx={selectedTx}
            options={options}
            initialExpandPayable={expandPayableOnOpen}
            initialExpandReceivable={expandReceivableOnOpen}
            onClose={() => { setDrawerOpen(false); setSelectedTx(null); setExpandPayableOnOpen(false); setExpandReceivableOnOpen(false); }}
            onAction={() => { setRefreshKey((k) => k + 1); setDrawerOpen(false); setSelectedTx(null); setExpandPayableOnOpen(false); setExpandReceivableOnOpen(false); setToast({ type: 'success', message: 'Ação concluída.' }); }}
            setToast={setToast}
          />
        )}
      </div>
    </>
  );
}
