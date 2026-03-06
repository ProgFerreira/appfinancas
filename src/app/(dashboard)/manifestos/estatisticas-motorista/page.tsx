'use client';

import { useEffect, useState, useCallback } from 'react';
import { Breadcrumb } from '@/components/Breadcrumb';
import Link from 'next/link';

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

type AnaliseGeral = {
  total_manifestos: number;
  total_frete: number;
  custo_total: number;
  total_liquido: number;
  margem_media: number;
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
  d.setMonth(0, 1); // 1º de janeiro do ano atual
  return d.toISOString().slice(0, 10);
};
const defaultFim = () => new Date().toISOString().slice(0, 10);

export default function ManifestosEstatisticasMotoristaPage() {
  const [dataInicio, setDataInicio] = useState(() => defaultInicio());
  const [dataFim, setDataFim] = useState(() => defaultFim());
  const [motoristaId, setMotoristaId] = useState('');
  const [tipoServico, setTipoServico] = useState('');
  const [placa, setPlaca] = useState('');
  const [analiseGeral, setAnaliseGeral] = useState<AnaliseGeral | null>(null);
  const [estatisticasMotoristas, setEstatisticasMotoristas] = useState<EstatMotorista[]>([]);
  const [motoristas, setMotoristas] = useState<{ id: number; nome: string }[]>([]);
  const [tiposServico, setTiposServico] = useState<string[]>([]);
  const [placas, setPlacas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    const params = new URLSearchParams({ data_inicio: dataInicio, data_fim: dataFim });
    if (motoristaId) params.set('motorista_id', motoristaId);
    if (tipoServico) params.set('tipo_servico', tipoServico);
    if (placa) params.set('placa', placa);
    fetch(`/api/manifestos/analise?${params}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setAnaliseGeral(data.data.analiseGeral ?? null);
          setEstatisticasMotoristas(data.data.estatisticasMotoristas ?? []);
          setMotoristas(data.data.motoristas ?? []);
          setTiposServico(data.data.tiposServico ?? []);
          setPlacas(data.data.placas ?? []);
        } else setError(data.error ?? 'Erro ao carregar');
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false));
  }, [dataInicio, dataFim, motoristaId, tipoServico, placa]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Manifestos', href: '/manifestos' }, { label: 'Estatísticas por motorista' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Estatísticas por motorista</h2>

        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="mb-6 p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <h3 className="text-sm font-medium text-slate-600 mb-3">Filtros</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Data início</label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200" required />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Data fim</label>
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200" required />
            </div>
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
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">Filtrar</button>
            <Link href="/manifestos/estatisticas-motorista" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50">Limpar</Link>
          </div>
        </form>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}

        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
                <p className="text-xs text-slate-500 uppercase font-semibold">Total manifestos</p>
                <p className="text-lg font-bold text-indigo-600">{(Number(analiseGeral?.total_manifestos) || 0).toLocaleString('pt-BR')}</p>
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
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Por motorista</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="text-left p-3">Motorista</th>
                      <th className="text-left p-3">Placa</th>
                      <th className="text-right p-3">Qtd</th>
                      <th className="text-right p-3">Total frete</th>
                      <th className="text-right p-3">Total despesa</th>
                      <th className="text-right p-3">Total líquido</th>
                      <th className="text-right p-3">Rentab. %</th>
                      <th className="text-left p-3">Tipos serviço</th>
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
                          <td className="p-3 text-right text-slate-600">{Number(r.total_manifestos) || 0}</td>
                          <td className="p-3 text-right text-slate-700">{formatMoney(Number(r.total_frete) || 0)}</td>
                          <td className="p-3 text-right text-red-600">{formatMoney(Number(r.total_despesa) || 0)}</td>
                          <td className="p-3 text-right font-medium text-emerald-600">{formatMoney(Number(r.total_liquido) || 0)}</td>
                          <td className="p-3 text-right">{Number(r.percentual_rentabilidade ?? 0).toFixed(1)}%</td>
                          <td className="p-3 text-slate-600 text-xs max-w-xs truncate" title={r.tipos_servico ?? undefined}>{r.tipos_servico ?? '—'}</td>
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
