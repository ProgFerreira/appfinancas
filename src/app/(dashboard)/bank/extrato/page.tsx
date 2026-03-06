'use client';

import { useEffect, useState } from 'react';
import { Breadcrumb } from '@/components/Breadcrumb';
import Link from 'next/link';

interface Transacao {
  id: number;
  data: string;
  historico: string;
  debito: number | null;
  credito: number | null;
  saldo_apos: number;
  origem?: 'bank' | 'pagamento' | 'recebimento';
}

interface ExtratoData {
  conta: { id: number; descricao: string; banco: string; agencia: string | null; conta: string | null };
  data_inicio: string;
  data_fim: string;
  saldo_inicial: number;
  saldo_final: number;
  transacoes: Transacao[];
}

function formatMoney(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(d: string): string {
  if (!d || d.length < 10) return d;
  return `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
}

export default function ExtratoBancarioPage() {
  const [options, setOptions] = useState<{ contasBancarias: { id: number; descricao: string }[] } | null>(null);
  const [bankAccountId, setBankAccountId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [data, setData] = useState<ExtratoData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    if (!dataInicio) setDataInicio(start.toISOString().slice(0, 10));
    if (!dataFim) setDataFim(now.toISOString().slice(0, 10));
  }, [dataInicio, dataFim]);

  useEffect(() => {
    fetch('/api/cadastros/options')
      .then((r) => r.json())
      .then((j) => { if (j.success && j.data) setOptions(j.data); });
  }, []);

  function handleBuscar(e: React.FormEvent) {
    e.preventDefault();
    if (!bankAccountId || !dataInicio || !dataFim) {
      setError('Selecione a conta e o período.');
      return;
    }
    setError(null);
    setLoading(true);
    const params = new URLSearchParams({
      bank_account_id: bankAccountId,
      start_date: dataInicio,
      end_date: dataFim,
    });
    fetch(`/api/bank/extrato?${params.toString()}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data) {
          setData(j.data);
        } else {
          setData(null);
          setError([j.error, j.detail].filter(Boolean).join(' — ') || 'Erro ao carregar extrato.');
        }
      })
      .catch((err) => {
        setData(null);
        setError(err?.message || 'Erro de conexão.');
      })
      .finally(() => setLoading(false));
  }

  const byDay = data?.transacoes?.length
    ? data.transacoes.reduce<Record<string, Transacao[]>>((acc, t) => {
        const d = t.data;
        if (!acc[d]) acc[d] = [];
        acc[d].push(t);
        return acc;
      }, {})
    : {};
  const dias = Object.keys(byDay).sort();

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Contas bancárias', href: '/contas-bancarias' },
          { label: 'Extrato bancário' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Extrato bancário</h2>
        <p className="text-sm text-slate-600 mb-4">
          Consulte o extrato por conta e período, com saldo anterior, movimentos por dia e saldo ao final de cada dia.
        </p>

        <form onSubmit={handleBuscar} className="mb-6 p-4 bg-white border border-slate-200 rounded-xl shadow-sm max-w-2xl">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[200px]">
              <label className="block text-sm font-medium text-slate-700 mb-1">Conta *</label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">— Selecione —</option>
                {(options?.contasBancarias ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.descricao}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">De</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Até</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Gerando...' : 'Gerar extrato'}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        {data && !error && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-semibold text-slate-800">{data.conta.descricao}</h3>
              <p className="text-sm text-slate-600">
                {data.conta.banco}
                {data.conta.agencia != null && ` · Ag ${data.conta.agencia}`}
                {data.conta.conta != null && ` · Cc ${data.conta.conta}`}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Período: {formatDate(data.data_inicio)} a {formatDate(data.data_fim)}
              </p>
            </div>

            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <span className="text-slate-600">Saldo anterior em {formatDate(data.data_inicio)}</span>
              <span className={`font-semibold ${data.saldo_inicial >= 0 ? 'text-slate-800' : 'text-red-700'}`}>
                {formatMoney(data.saldo_inicial)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="text-left p-3 w-28">Data</th>
                    <th className="text-left p-3">Histórico</th>
                    <th className="text-left p-3 w-24">Origem</th>
                    <th className="text-right p-3 w-32">Débito</th>
                    <th className="text-right p-3 w-32">Crédito</th>
                    <th className="text-right p-3 w-36">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {dias.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500">
                        Nenhum movimento no período.
                      </td>
                    </tr>
                  ) : (
                    dias.flatMap((dia) => {
                      const txs = byDay[dia];
                      const ultimoSaldo = txs.length ? txs[txs.length - 1].saldo_apos : 0;
                      return [
                        ...txs.map((t) => (
                          <tr key={`${t.origem ?? 'bank'}-${t.id}`} className="border-t border-slate-100 hover:bg-slate-50/50">
                            <td className="p-3 text-slate-700">{formatDate(t.data)}</td>
                            <td className="p-3 text-slate-800">{t.historico}</td>
                            <td className="p-3">
                              {t.origem === 'pagamento' && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">Pagamento</span>}
                              {t.origem === 'recebimento' && <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">Recebimento</span>}
                              {(!t.origem || t.origem === 'bank') && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">Extrato</span>}
                            </td>
                            <td className="p-3 text-right text-red-700">
                              {t.debito != null && t.debito > 0 ? formatMoney(t.debito) : '—'}
                            </td>
                            <td className="p-3 text-right text-green-700">
                              {t.credito != null && t.credito > 0 ? formatMoney(t.credito) : '—'}
                            </td>
                            <td className={`p-3 text-right font-medium ${ultimoSaldo >= 0 ? 'text-slate-800' : 'text-red-700'}`}>
                              {formatMoney(t.saldo_apos)}
                            </td>
                          </tr>
                        )),
                        <tr key={`saldo-${dia}`} className="border-t border-slate-200 bg-slate-50">
                          <td className="p-2" colSpan={5}>
                            <span className="text-xs font-medium text-slate-500">Saldo em {formatDate(dia)}</span>
                          </td>
                          <td className={`p-2 text-right font-semibold ${ultimoSaldo >= 0 ? 'text-slate-800' : 'text-red-700'}`}>
                            {formatMoney(ultimoSaldo)}
                          </td>
                        </tr>,
                      ];
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t-2 border-slate-200 bg-slate-50 flex justify-between items-center">
              <span className="font-medium text-slate-700">Saldo final em {formatDate(data.data_fim)}</span>
              <span className={`text-lg font-semibold ${data.saldo_final >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
                {formatMoney(data.saldo_final)}
              </span>
            </div>
          </div>
        )}

        <p className="mt-4 text-sm text-slate-600">
          <Link href="/bank/transacoes" className="text-indigo-600 hover:underline">
            Transações e conciliação
          </Link>
          {' · '}
          <Link href="/bank/importar" className="text-indigo-600 hover:underline">
            Importar OFX
          </Link>
        </p>
      </div>
    </>
  );
}
