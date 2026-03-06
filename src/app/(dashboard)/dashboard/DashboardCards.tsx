'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Resumo {
  contasPagar: { total: number; soma: number };
  contasReceber: { total: number; soma: number };
  totalClientes: number;
  tarefasPendentes?: number;
}

interface VisaoGeral {
  faturamento: number;
  custos_variaveis: number;
  custos_fixos: number;
  resultado: number;
  percentual_fixos: number;
  percentual_variaveis: number;
}

interface FluxoItem {
  data: string;
  total: number;
}

interface MargemCteItem {
  id: number;
  numero: string;
  cliente_id: number | null;
  cliente_nome: string | null;
  valor_frete: number;
  custo: number;
  margem: number;
  data_emissao: string | null;
}

interface RankingClienteItem {
  cliente_id: number;
  nome: string;
  total: number;
}

interface DashboardData {
  resumo: Resumo;
  periodo: { dataInicio: string; dataFim: string };
  visaoGeral: VisaoGeral;
  alertas: { contas_pagar_vencidas: number; contas_receber_vencidas: number };
  fluxo: { entradas: FluxoItem[]; saidas: FluxoItem[] };
  margemPorCte?: MargemCteItem[];
  rankingClientes?: RankingClienteItem[];
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(s: string) {
  return new Date(s + 'T12:00:00').toLocaleDateString('pt-BR');
}

function getDefaultDates(): { inicio: string; fim: string } {
  const hoje = new Date();
  const primeiro = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return {
    inicio: primeiro.toISOString().slice(0, 10),
    fim: hoje.toISOString().slice(0, 10),
  };
}

export function DashboardCards() {
  const router = useRouter();
  const defaults = getDefaultDates();
  const [dataInicio, setDataInicio] = useState(defaults.inicio);
  const [dataFim, setDataFim] = useState(defaults.fim);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const load = (inicio: string, fim: string) => {
    setError('');
    const params = new URLSearchParams({ data_inicio: inicio, data_fim: fim });
    fetch(`/api/dashboard?${params}`)
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { success: false, error: 'Resposta vazia', status: res.status };
        try {
          return { ...JSON.parse(text), status: res.status } as {
            success: boolean;
            data?: DashboardData;
            error?: string;
            detail?: string;
            status: number;
          };
        } catch {
          return { success: false, error: 'Resposta inválida', status: res.status };
        }
      })
      .then((result) => {
        if (result.status === 401) {
          router.push('/login');
          return;
        }
        if (result.success && result.data) {
          setData(result.data);
          setDataInicio(result.data.periodo.dataInicio);
          setDataFim(result.data.periodo.dataFim);
          setErrorDetail(null);
        } else {
          setError(result.error ?? 'Erro ao carregar');
          setErrorDetail(result.detail ?? null);
        }
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(defaults.inicio, defaults.fim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFiltrar = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    load(dataInicio, dataFim);
  };

  const handleLimpar = () => {
    const d = getDefaultDates();
    setDataInicio(d.inicio);
    setDataFim(d.fim);
    setLoading(true);
    load(d.inicio, d.fim);
  };

  if (loading && !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800">
        <p className="font-medium">{error}</p>
        {errorDetail && (
          <p className="mt-2 text-sm font-mono bg-red-100/50 p-2 rounded break-all">{errorDetail}</p>
        )}
        <p className="mt-2 text-sm">
          Confira o <code className="bg-red-100/50 px-1 rounded">.env.local</code> e se o MySQL está rodando.
          <a href="/api/db/health" target="_blank" rel="noopener noreferrer" className="underline ml-1">/api/db/health</a>
        </p>
        <button
          type="button"
          onClick={() => { setError(''); setLoading(true); load(dataInicio, dataFim); }}
          className="mt-3 px-3 py-1.5 rounded bg-red-100 hover:bg-red-200 text-sm font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const stats = data?.resumo;
  const vg = data?.visaoGeral;
  const alertas = data?.alertas;
  const fluxo = data?.fluxo;

  return (
    <div className="space-y-6">
      {/* Filtro de período */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-medium text-slate-600 mb-3">Filtros do período</h3>
        <form onSubmit={handleFiltrar} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Data inicial</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Data final</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
            Filtrar
          </button>
          <button type="button" onClick={handleLimpar} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50">
            Limpar
          </button>
        </form>
      </div>

      {/* Resumo: 4 cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Contas a receber (aberto)</h3>
          <p className="mt-1 text-2xl font-semibold text-slate-800">
            {stats ? formatMoney(stats.contasReceber.soma) : '—'}
          </p>
          <p className="text-sm text-slate-500">{stats?.contasReceber.total ?? 0} título(s)</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Contas a pagar (aberto)</h3>
          <p className="mt-1 text-2xl font-semibold text-slate-800">
            {stats ? formatMoney(stats.contasPagar.soma) : '—'}
          </p>
          <p className="text-sm text-slate-500">{stats?.contasPagar.total ?? 0} título(s)</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500">Clientes ativos</h3>
          <p className="mt-1 text-2xl font-semibold text-slate-800">{stats?.totalClientes ?? 0}</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/tarefas')}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm text-left hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <h3 className="text-sm font-medium text-slate-500">Tarefas pendentes</h3>
          <p className="mt-1 text-2xl font-semibold text-slate-800">
            {stats?.tarefasPendentes ?? 0}
          </p>
          <p className="text-sm text-indigo-600 font-medium mt-1">Ver tarefas →</p>
        </button>
      </div>

      {/* Indicadores do período (visão geral) */}
      {vg && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-indigo-600 text-white">
            <h3 className="font-semibold">Indicadores do período ({formatDate(data!.periodo.dataInicio)} a {formatDate(data!.periodo.dataFim)})</h3>
          </div>
          <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center p-3 rounded-lg bg-slate-50">
              <p className="text-xs text-slate-500 uppercase font-semibold">Faturamento</p>
              <p className="text-lg font-bold text-emerald-600">{formatMoney(vg.faturamento)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50">
              <p className="text-xs text-slate-500 uppercase font-semibold">Custos variáveis</p>
              <p className="text-lg font-bold text-red-600">{formatMoney(vg.custos_variaveis)}</p>
              <p className="text-xs text-slate-500">{vg.percentual_variaveis}% do faturamento</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50">
              <p className="text-xs text-slate-500 uppercase font-semibold">Custos fixos</p>
              <p className="text-lg font-bold text-amber-600">{formatMoney(vg.custos_fixos)}</p>
              <p className="text-xs text-slate-500">{vg.percentual_fixos}% do faturamento</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-slate-50">
              <p className="text-xs text-slate-500 uppercase font-semibold">Resultado</p>
              <p className={`text-lg font-bold ${vg.resultado >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatMoney(vg.resultado)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alertas vencidas */}
      {alertas && (alertas.contas_pagar_vencidas > 0 || alertas.contas_receber_vencidas > 0) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-semibold text-amber-800 mb-2">Alertas</h3>
          <ul className="text-sm text-amber-800">
            {alertas.contas_pagar_vencidas > 0 && (
              <li>{alertas.contas_pagar_vencidas} conta(s) a pagar vencida(s).</li>
            )}
            {alertas.contas_receber_vencidas > 0 && (
              <li>{alertas.contas_receber_vencidas} conta(s) a receber vencida(s).</li>
            )}
          </ul>
        </div>
      )}

      {/* Fluxo de caixa previsto */}
      {fluxo && (fluxo.entradas.length > 0 || fluxo.saidas.length > 0) && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Fluxo de caixa previsto (período)</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4 p-4">
            <div>
              <h4 className="text-emerald-600 font-medium mb-2">Entradas previstas</h4>
              <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {fluxo.entradas.map((e) => (
                  <li key={e.data} className="flex justify-between items-center px-4 py-2 bg-white">
                    <span>{formatDate(e.data)}</span>
                    <span className="font-medium text-emerald-600">{formatMoney(e.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-red-600 font-medium mb-2">Saídas previstas</h4>
              <ul className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {fluxo.saidas.map((s) => (
                  <li key={s.data} className="flex justify-between items-center px-4 py-2 bg-white">
                    <span>{formatDate(s.data)}</span>
                    <span className="font-medium text-red-600">{formatMoney(s.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Margem por CT-e (período) */}
      {data?.margemPorCte && data.margemPorCte.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Margem por CT-e (período)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Receita = valor do frete; custo = soma das despesas de viagem do CT-e. Limite 50 registros.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Número</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Cliente</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Emissão</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-600">Receita</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-600">Custo</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-600">Margem</th>
                </tr>
              </thead>
              <tbody>
                {data.margemPorCte.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-2">
                      <a href={`/ctes/${r.id}`} className="text-indigo-600 hover:underline">{r.numero || r.id}</a>
                    </td>
                    <td className="px-4 py-2 text-slate-700">{r.cliente_nome ?? '—'}</td>
                    <td className="px-4 py-2 text-slate-600">{r.data_emissao ? formatDate(r.data_emissao) : '—'}</td>
                    <td className="px-4 py-2 text-right text-slate-700">{formatMoney(r.valor_frete)}</td>
                    <td className="px-4 py-2 text-right text-red-600">{formatMoney(r.custo)}</td>
                    <td className={`px-4 py-2 text-right font-medium ${r.margem >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatMoney(r.margem)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ranking de clientes (faturamento no período) */}
      {data?.rankingClientes && data.rankingClientes.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <h3 className="font-semibold text-slate-800">Ranking de clientes (faturamento no período)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Soma das contas a receber por cliente (data de emissão no período). Top 15.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2 font-medium text-slate-600 w-10">#</th>
                  <th className="text-left px-4 py-2 font-medium text-slate-600">Cliente</th>
                  <th className="text-right px-4 py-2 font-medium text-slate-600">Faturamento</th>
                </tr>
              </thead>
              <tbody>
                {data.rankingClientes.map((r, i) => (
                  <tr key={r.cliente_id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-2 text-slate-500">{i + 1}</td>
                    <td className="px-4 py-2">
                      <a href={`/clientes/${r.cliente_id}`} className="text-indigo-600 hover:underline">{r.nome}</a>
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-emerald-600">{formatMoney(r.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
