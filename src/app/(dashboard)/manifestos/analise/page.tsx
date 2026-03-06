'use client';

import { useEffect, useState, useCallback } from 'react';
import { Breadcrumb } from '@/components/Breadcrumb';
import Link from 'next/link';

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
/** Formata data do banco (YYYY-MM-DD) como MM/DD/YYYY (ex: 2025-02-12 → 02/12/2025 = 12 de fev). */
function formatDate(s: string | null) {
  if (!s) return '—';
  const part = String(s).trim().slice(0, 10);
  const [y, m, d] = part.split('-');
  if (y && m && d) return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`;
  return new Date(s).toLocaleDateString('pt-BR');
}

type AnaliseGeral = {
  total_manifestos: number;
  total_motoristas?: number;
  total_frete: number;
  custo_total: number;
  total_liquido: number;
  margem_media: number;
};
type TopManifesto = {
  id: number;
  numero_manifesto: string;
  data_manifesto: string | null;
  tipo_servico?: string | null;
  motorista_nome: string | null;
  rota?: string | null;
  responsavel?: string | null;
  valor_frete: number;
  valor_despesa: number;
  valor_liquido: number;
  custo_adicional: number;
  custo_pedagio: number;
  lucro: number;
};
type EstatMotorista = {
  motorista_id: number | null;
  motorista_nome: string | null;
  placa: string | null;
  total_manifestos: number;
  total_frete: number;
  total_despesa: number;
  total_liquido: number;
  percentual_rentabilidade: number;
  tipos_servico: string | null;
};

const defaultInicio = () => {
  const d = new Date();
  d.setMonth(0, 1);
  return d.toISOString().slice(0, 10);
};
const defaultFim = () => new Date().toISOString().slice(0, 10);

export default function ManifestosAnalisePage() {
  const [todoPeriodo, setTodoPeriodo] = useState(true);
  const [dataInicio, setDataInicio] = useState(() => defaultInicio());
  const [dataFim, setDataFim] = useState(() => defaultFim());
  const [motoristaId, setMotoristaId] = useState('');
  const [tipoServico, setTipoServico] = useState('');
  const [placa, setPlaca] = useState('');
  const [limiteManifestos, setLimiteManifestos] = useState('30');
  const [analiseGeral, setAnaliseGeral] = useState<AnaliseGeral | null>(null);
  const [topManifestos, setTopManifestos] = useState<TopManifesto[]>([]);
  const [estatisticasMotoristas, setEstatisticasMotoristas] = useState<EstatMotorista[]>([]);
  const [motoristas, setMotoristas] = useState<{ id: number; nome: string }[]>([]);
  const [tiposServico, setTiposServico] = useState<string[]>([]);
  const [placas, setPlacas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    const params = new URLSearchParams();
    if (!todoPeriodo && dataInicio && dataFim) {
      const toYmd = (s: string) => {
        if (!s) return s;
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) return s;
        const parts = String(s).split('/').map((p) => p.padStart(2, '0'));
        if (parts.length === 3 && parts[2]?.length === 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
        return s;
      };
      params.set('data_inicio', toYmd(dataInicio));
      params.set('data_fim', toYmd(dataFim));
    }
    if (motoristaId) params.set('motorista_id', motoristaId);
    if (tipoServico) params.set('tipo_servico', tipoServico);
    if (placa) params.set('placa', placa);
    params.set('limite_manifestos', limiteManifestos === 'todos' ? 'todos' : limiteManifestos);
    fetch(`/api/manifestos/analise?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setAnaliseGeral(data.data.analiseGeral ?? null);
          setTopManifestos(data.data.topManifestos ?? []);
          setEstatisticasMotoristas(data.data.estatisticasMotoristas ?? []);
          setMotoristas(data.data.motoristas ?? []);
          setTiposServico(data.data.tiposServico ?? []);
          setPlacas(data.data.placas ?? []);
        } else setError(data.error ?? 'Erro ao carregar');
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false));
  }, [todoPeriodo, dataInicio, dataFim, motoristaId, tipoServico, placa, limiteManifestos]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Manifestos', href: '/manifestos' }, { label: 'Análise' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Análise de rentabilidade</h2>

        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="mb-6 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <h3 className="text-sm font-medium text-slate-600 mb-3">Filtros</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <label className="flex items-center gap-2 h-[42px] cursor-pointer">
              <input
                type="checkbox"
                checked={todoPeriodo}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setTodoPeriodo(checked);
                  if (!checked) {
                    setDataInicio(defaultInicio());
                    setDataFim(defaultFim());
                  }
                }}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-700">Todo o período</span>
            </label>
            {!todoPeriodo && (
              <>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Data início</label>
                  <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200" required={!todoPeriodo} />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Data fim</label>
                  <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200" required={!todoPeriodo} />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Motorista</label>
              <select value={motoristaId} onChange={(e) => setMotoristaId(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 min-w-[180px]">
                <option value="">Todos</option>
                {motoristas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Tipo serviço</label>
              <select value={tipoServico} onChange={(e) => setTipoServico(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 min-w-[140px]">
                <option value="">Todos</option>
                {tiposServico.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Placa</label>
              <select value={placa} onChange={(e) => setPlaca(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 min-w-[100px]">
                <option value="">Todas</option>
                {placas.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Limite top</label>
              <select value={limiteManifestos} onChange={(e) => setLimiteManifestos(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200">
                <option value="10">10</option>
                <option value="30">30</option>
                <option value="50">50</option>
                <option value="todos">Todos</option>
              </select>
            </div>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">Filtrar</button>
            <Link href="/manifestos/analise" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50">Limpar</Link>
          </div>
        </form>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}

        {!loading && !todoPeriodo && (Number(analiseGeral?.total_manifestos) || 0) === 0 && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            Nenhum manifesto com data no período selecionado. Amplie o intervalo (ex.: 01/01 a 31/12) ou marque &quot;Todo o período&quot; para ver todos.
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-xs text-slate-500 uppercase font-semibold">Quantidade manifestos</p>
                <p className="text-lg font-bold text-indigo-600">{(Number(analiseGeral?.total_manifestos) || 0).toLocaleString('pt-BR')}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-xs text-slate-500 uppercase font-semibold">Quantidade motoristas</p>
                <p className="text-lg font-bold text-violet-600">{(Number(analiseGeral?.total_motoristas) ?? 0).toLocaleString('pt-BR')}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-xs text-slate-500 uppercase font-semibold">Faturamento</p>
                <p className="text-lg font-bold text-emerald-600 truncate">{formatMoney(Number(analiseGeral?.total_frete) || 0)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-xs text-slate-500 uppercase font-semibold">Custo total</p>
                <p className="text-lg font-bold text-red-600 truncate">{formatMoney(Number(analiseGeral?.custo_total) || 0)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-xs text-slate-500 uppercase font-semibold">Resultado</p>
                <p className="text-lg font-bold text-sky-600 truncate">{formatMoney(Number(analiseGeral?.total_liquido) || 0)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-xs text-slate-500 uppercase font-semibold">Margem média</p>
                <p className="text-lg font-bold text-amber-600">{(Number(analiseGeral?.margem_media) || 0).toFixed(2)}%</p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-6">
              <div className="px-4 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Top manifestos mais rentáveis</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left p-3">Número</th>
                      <th className="text-left p-3">Data</th>
                      <th className="text-left p-3">Tipo</th>
                      <th className="text-left p-3">Motorista</th>
                      <th className="text-left p-3">Rota</th>
                      <th className="text-left p-3">Responsável</th>
                      <th className="text-right p-3">Valor frete</th>
                      <th className="text-right p-3">Custo</th>
                      <th className="text-right p-3">Lucro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topManifestos.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-6 text-center text-slate-500">
                          {!todoPeriodo ? 'Nenhum manifesto com data no período. Tente outro intervalo ou marque "Todo o período".' : 'Nenhum dado no período.'}
                        </td>
                      </tr>
                    ) : (
                      topManifestos.map((r) => (
                        <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="p-3 font-medium text-slate-800">{r.numero_manifesto ?? '—'}</td>
                          <td className="p-3 text-slate-600">{formatDate(r.data_manifesto)}</td>
                          <td className="p-3 text-slate-600 text-xs max-w-[100px] truncate" title={r.tipo_servico ?? undefined}>{r.tipo_servico ?? '—'}</td>
                          <td className="p-3 text-slate-600">{r.motorista_nome ?? '—'}</td>
                          <td className="p-3 text-slate-600 max-w-[120px] truncate" title={r.rota ?? undefined}>{r.rota ?? '—'}</td>
                          <td className="p-3 text-slate-600">{r.responsavel ?? '—'}</td>
                          <td className="p-3 text-right text-slate-700">{formatMoney(Number(r.valor_frete) || 0)}</td>
                          <td className="p-3 text-right text-red-600">{formatMoney((Number(r.valor_despesa) || 0) + (Number(r.custo_adicional) || 0) + (Number(r.custo_pedagio) || 0))}</td>
                          <td className="p-3 text-right font-medium text-emerald-600">{formatMoney(Number(r.lucro) || 0)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Estatísticas por motorista</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left p-3">Motorista</th>
                      <th className="text-left p-3">Placa</th>
                      <th className="text-left p-3">Tipo</th>
                      <th className="text-right p-3">Qtd</th>
                      <th className="text-right p-3">Total frete</th>
                      <th className="text-right p-3">Total despesa</th>
                      <th className="text-right p-3">Total líquido</th>
                      <th className="text-right p-3">Rentab. %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estatisticasMotoristas.length === 0 ? (
                      <tr><td colSpan={8} className="p-6 text-center text-slate-500">Nenhum dado no período.</td></tr>
                    ) : (
                      estatisticasMotoristas.map((r, i) => (
                        <tr key={r.motorista_id ?? i} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="p-3 font-medium text-slate-800">{r.motorista_nome ?? '—'}</td>
                          <td className="p-3 text-slate-600">{r.placa ?? '—'}</td>
                          <td className="p-3 text-slate-600 text-xs max-w-[140px] truncate" title={r.tipos_servico ?? undefined}>{r.tipos_servico ?? '—'}</td>
                          <td className="p-3 text-right text-slate-600">{Number(r.total_manifestos) || 0}</td>
                          <td className="p-3 text-right text-slate-700">{formatMoney(Number(r.total_frete) || 0)}</td>
                          <td className="p-3 text-right text-red-600">{formatMoney(Number(r.total_despesa) || 0)}</td>
                          <td className="p-3 text-right font-medium text-emerald-600">{formatMoney(Number(r.total_liquido) || 0)}</td>
                          <td className="p-3 text-right">{Number(r.percentual_rentabilidade ?? 0).toFixed(1)}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
