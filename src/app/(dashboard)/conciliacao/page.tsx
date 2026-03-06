'use client';

import { useEffect, useState } from 'react';
import { Breadcrumb } from '@/components/Breadcrumb';
import Link from 'next/link';

interface UnreconciledTx {
  id: number;
  bank_account_id: number;
  fit_id: string;
  posted_at: string;
  amount: number;
  type: string;
  memo: string | null;
  payee: string | null;
  conta_descricao: string;
}

interface SuggestedMatch {
  matchId: number;
  bankTransactionId: number;
  amount: number;
  type: string;
  postedAt: string;
  memo: string | null;
  paymentId: number | null;
  receiptId: number | null;
  score: number;
}

export default function ConciliacaoPage() {
  const [unreconciled, setUnreconciled] = useState<UnreconciledTx[]>([]);
  const [suggested, setSuggested] = useState<SuggestedMatch[]>([]);
  const [options, setOptions] = useState<{ contasBancarias: { id: number; descricao: string }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [bankAccountId, setBankAccountId] = useState('');
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  function load() {
    const params = bankAccountId ? `?bank_account_id=${bankAccountId}` : '';
    fetch(`/api/reconciliation${params}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          setUnreconciled(Array.isArray(j.data.unreconciled) ? j.data.unreconciled : []);
          setSuggested(Array.isArray(j.data.suggested) ? j.data.suggested : []);
        } else {
          setUnreconciled([]);
          setSuggested([]);
        }
      })
      .catch(() => { setUnreconciled([]); setSuggested([]); })
      .finally(() => setLoading(false));
  }

  function clearFeedback() {
    setActionError(null);
    setActionSuccess(null);
  }

  useEffect(() => {
    fetch('/api/cadastros/options').then((r) => r.json()).then((j) => { if (j.success) setOptions(j.data); });
  }, []);

  useEffect(() => {
    setLoading(true);
    load();
  }, [bankAccountId]);

  function handleGenerateSuggestions() {
    if (!bankAccountId) return;
    setGenerating(true);
    setActionError(null);
    setActionSuccess(null);
    fetch('/api/reconciliation/suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bank_account_id: parseInt(bankAccountId, 10), tolerance: 0.01, days: 2 }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          const list = Array.isArray(j.data.suggestions) ? j.data.suggestions : [];
          setSuggested(list.map((s: { matchId: number; bankTransactionId: number; bankTransactionAmount?: number; amount?: number; bankTransactionType?: string; type?: string; bankTransactionDate?: string; bankTransactionMemo?: string | null; paymentId?: number | null; receiptId?: number | null; score: number }) => ({
            matchId: s.matchId,
            bankTransactionId: s.bankTransactionId,
            amount: s.bankTransactionAmount ?? s.amount ?? 0,
            type: s.bankTransactionType ?? s.type ?? '',
            postedAt: s.bankTransactionDate ?? '',
            memo: s.bankTransactionMemo ?? null,
            paymentId: s.paymentId ?? null,
            receiptId: s.receiptId ?? null,
            score: s.score,
          })));
          load();
          if (list.length > 0) {
            setActionSuccess(`${list.length} sugestão(ões) gerada(s). Confirme ou rejeite na tabela abaixo.`);
          } else {
            setActionSuccess('Nenhuma sugestão encontrada (valor/data próximos a pagamentos ou recebimentos).');
          }
        } else {
          setActionError(j.error || 'Erro ao gerar sugestões.');
        }
      })
      .catch(() => setActionError('Erro de conexão.'))
      .finally(() => setGenerating(false));
  }

  function handleConfirmReject(matchId: number, action: 'confirm' | 'reject') {
    setActionError(null);
    setActionSuccess(null);
    fetch(`/api/reconciliation/${matchId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setActionSuccess(action === 'confirm' ? 'Conciliação confirmada.' : 'Sugestão rejeitada.');
          load();
        } else {
          setActionError(j.error || 'Erro ao processar.');
        }
      })
      .catch(() => setActionError('Erro de conexão.'));
  }

  function handleIgnorar(txId: number) {
    if (!confirm('Marcar esta transação do extrato como ignorada (não conciliar)?')) return;
    setActionError(null);
    setActionSuccess(null);
    fetch('/api/reconciliation/ignore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bank_transaction_id: txId }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setActionSuccess('Transação marcada como ignorada.');
          load();
        } else {
          setActionError(j.error || 'Erro ao ignorar.');
        }
      })
      .catch(() => setActionError('Erro de conexão.'));
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Conciliação' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Conciliação (visão avançada)</h2>

        <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
          <p className="font-medium text-slate-800 mb-2">Fluxo recomendado:</p>
          <p className="mb-2">
            Use <Link href="/bank/importar" className="text-indigo-600 hover:underline">Importar OFX</Link> e depois a tela <Link href="/bank/transacoes" className="text-indigo-600 hover:underline">Transações extrato</Link> para ver o extrato, gerar sugestões e vincular ou ignorar cada linha. Esta tela é uma <strong>visão alternativa</strong> para revisão em massa e auditoria.
          </p>
          <p className="font-medium text-slate-800 mb-2 mt-3">Nesta tela (avançada):</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Selecione a <strong>conta</strong> no filtro (obrigatório para gerar sugestões).</li>
            <li>Clique em <strong>Gerar sugestões</strong> para buscar pagamentos/recebimentos com valor e data próximos às transações do extrato.</li>
            <li>Na tabela <strong>Sugestões de conciliação</strong>, use <strong>Confirmar</strong> ou <strong>Rejeitar</strong>.</li>
            <li>Use <strong>Ignorar</strong> nas transações sem correspondência.</li>
          </ol>
        </div>

        {actionError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm flex justify-between items-center">
            <span>{actionError}</span>
            <button type="button" onClick={clearFeedback} className="text-red-600 hover:underline">Fechar</button>
          </div>
        )}
        {actionSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm flex justify-between items-center">
            <span>{actionSuccess}</span>
            <button type="button" onClick={clearFeedback} className="text-green-600 hover:underline">Fechar</button>
          </div>
        )}

        {options && (
          <div className="mb-4 flex flex-wrap gap-4 items-center">
            <label className="flex items-center gap-2">
              <span>Conta:</span>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="border border-slate-300 rounded px-2 py-1"
              >
                <option value="">Todas</option>
                {(options.contasBancarias ?? []).map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.descricao}</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={handleGenerateSuggestions}
              disabled={!bankAccountId || generating}
              className="bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {generating ? 'Gerando...' : 'Gerar sugestões'}
            </button>
            <Link
              href="/bank/transacoes"
              className="inline-flex items-center px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 hover:border-slate-400"
            >
              Ver extrato
            </Link>
            <Link
              href="/conciliacao-bancaria"
              className="inline-flex items-center px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Conciliação manual (lançamentos manuais)
            </Link>
          </div>
        )}
        {!options && (
          <div className="mb-4">
            <Link href="/bank/transacoes" className="inline-flex items-center px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50">
              Ver extrato
            </Link>
          </div>
        )}
        {loading && <p className="text-slate-500">Carregando...</p>}
        {!loading && (
          <>
            <section className="mb-6">
              <h3 className="font-medium text-slate-700 mb-2">Transações do extrato sem conciliação confirmada</h3>
              <div className="border border-slate-200 rounded overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left p-2 text-slate-800 font-medium">Data</th>
                      <th className="text-left p-2 text-slate-800 font-medium">Conta</th>
                      <th className="text-left p-2 text-slate-800 font-medium">Memo / Payee</th>
                      <th className="text-right p-2 text-slate-800 font-medium">Valor</th>
                      <th className="text-right p-2 text-slate-800 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unreconciled.length === 0 ? (
                      <tr><td colSpan={5} className="p-2 text-slate-500">Nenhuma transação em aberto</td></tr>
                    ) : (
                      unreconciled.map((tx) => (
                        <tr key={tx.id} className="border-t border-slate-100">
                          <td className="p-2 text-slate-800">{typeof tx.posted_at === 'string' ? tx.posted_at.slice(0, 10) : tx.posted_at}</td>
                          <td className="p-2 text-slate-800">{tx.conta_descricao || '—'}</td>
                          <td className="p-2 text-slate-800">{tx.memo || tx.payee || '—'}</td>
                          <td className={`p-2 text-right font-medium ${tx.type === 'debit' ? 'text-red-700' : 'text-green-700'}`}>
                            {tx.type === 'debit' ? '-' : ''}{tx.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </td>
                          <td className="p-2 text-right">
                            <button type="button" onClick={() => handleIgnorar(tx.id)} className="text-amber-600 hover:underline font-medium">Ignorar</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
            <section>
              <h3 className="font-medium text-slate-700 mb-2">Sugestões de conciliação</h3>
              <div className="border border-slate-200 rounded overflow-hidden bg-white">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left p-2 text-slate-800 font-medium">Data</th>
                      <th className="text-left p-2 text-slate-800 font-medium">Valor</th>
                      <th className="text-left p-2 text-slate-800 font-medium">Memo</th>
                      <th className="text-left p-2 text-slate-800 font-medium">Vínculo</th>
                      <th className="text-right p-2 text-slate-800 font-medium">Score</th>
                      <th className="text-right p-2 text-slate-800 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggested.length === 0 ? (
                      <tr><td colSpan={6} className="p-2 text-slate-500">Nenhuma sugestão. Selecione uma conta e clique em &quot;Gerar sugestões&quot;.</td></tr>
                    ) : (
                      suggested.map((s) => (
                        <tr key={s.matchId} className="border-t border-slate-100">
                          <td className="p-2 text-slate-800">{typeof s.postedAt === 'string' ? s.postedAt.slice(0, 10) : s.postedAt}</td>
                          <td className="p-2 text-slate-800">{s.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                          <td className="p-2 text-slate-800">{s.memo || '—'}</td>
                          <td className="p-2 text-slate-800">{s.paymentId != null ? `Pagamento #${s.paymentId}` : s.receiptId != null ? `Recebimento #${s.receiptId}` : '—'}</td>
                          <td className="p-2 text-right text-slate-800">{s.score}</td>
                          <td className="p-2 text-right">
                            <button type="button" onClick={() => handleConfirmReject(s.matchId, 'confirm')} className="text-green-600 hover:underline mr-2 font-medium">Confirmar</button>
                            <button type="button" onClick={() => handleConfirmReject(s.matchId, 'reject')} className="text-red-600 hover:underline font-medium">Rejeitar</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </>
  );
}
