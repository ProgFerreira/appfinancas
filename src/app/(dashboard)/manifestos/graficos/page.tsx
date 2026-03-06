'use client';

import { useEffect, useState, useCallback } from 'react';
import { Breadcrumb } from '@/components/Breadcrumb';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const defaultInicio = () => {
  const d = new Date();
  d.setMonth(0, 1); // 1º de janeiro do ano atual
  return d.toISOString().slice(0, 10);
};
const defaultFim = () => new Date().toISOString().slice(0, 10);

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#ec4899'];

export default function ManifestosGraficosPage() {
  const [dataInicio, setDataInicio] = useState(() => defaultInicio());
  const [dataFim, setDataFim] = useState(() => defaultFim());
  const [motoristaId, setMotoristaId] = useState('');
  const [tipoServico, setTipoServico] = useState('');
  const [placa, setPlaca] = useState('');
  const [porData, setPorData] = useState<{ data: string; total_frete: number; total_liquido: number }[]>([]);
  const [porMotorista, setPorMotorista] = useState<{ name: string; total_frete: number; total_liquido: number }[]>([]);
  const [motoristas, setMotoristas] = useState<{ id: number; nome: string }[]>([]);
  const [tiposServico, setTiposServico] = useState<string[]>([]);
  const [placas, setPlacas] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string>('');

  const load = useCallback(() => {
    setError(null);
    setDebugLog('');
    setLoading(true);
    const params = new URLSearchParams({ data_inicio: dataInicio, data_fim: dataFim });
    if (motoristaId) params.set('motorista_id', motoristaId);
    if (tipoServico) params.set('tipo_servico', tipoServico);
    if (placa) params.set('placa', placa);
    const url = `/api/manifestos/graficos?${params}`;
    setDebugLog(`GET ${url}\nCarregando...`);
    fetch(url)
      .then(async (r) => {
        const text = await r.text();
        let data: { success?: boolean; data?: unknown; error?: string; detail?: string } = {};
        try {
          data = JSON.parse(text);
        } catch {
          setDebugLog((prev) => `${prev}\n\nResposta (status ${r.status}): ${text.slice(0, 500)}`);
          setError(`Resposta inválida (${r.status})`);
          return;
        }
        setDebugLog((prev) => `${prev}\n\nStatus: ${r.status}\nsuccess: ${data.success}\nerror: ${data.error ?? '-'}\ndetail: ${(data as { detail?: string }).detail ?? '-'}\nResposta: ${JSON.stringify(data).slice(0, 800)}`);
        if (data.success && data.data) {
          setPorData((data.data as { porData?: { data: string; total_frete: number; total_liquido: number }[] }).porData?.map((d: { data: string; total_frete: number; total_liquido: number }) => {
            const part = (d.data ?? '').trim().slice(0, 10);
            const [y, m, day] = part.split('-');
            const dataFmt = y && m && day ? `${m.padStart(2, '0')}/${day.padStart(2, '0')}/${y}` : (d.data ? new Date(d.data).toLocaleDateString('pt-BR') : '');
            return { ...d, data: dataFmt };
          }) ?? []);
          setPorMotorista((data.data as { porMotorista?: { motorista_nome: string | null; total_frete: number; total_liquido: number }[] }).porMotorista?.map((m: { motorista_nome: string | null; total_frete: number; total_liquido: number }) => ({
            name: m.motorista_nome || 'Sem motorista',
            total_frete: Number(m.total_frete ?? 0),
            total_liquido: Number(m.total_liquido ?? 0),
          })) ?? []);
        } else {
          setError(data.error ?? 'Erro ao carregar');
          if ((data as { detail?: string }).detail) {
            setDebugLog((prev) => `${prev}\n\nDetalhe: ${(data as { detail?: string }).detail}`);
          }
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : String(err);
        setDebugLog((prev) => `${prev}\n\nExceção: ${msg}\n${err instanceof Error ? err.stack : ''}`);
        setError('Erro de conexão');
      })
      .finally(() => {
        setLoading(false);
        setDebugLog((prev) => (prev ? `${prev}\n\n--- Fim do log ---` : prev));
      });
  }, [dataInicio, dataFim, motoristaId, tipoServico, placa]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch('/api/manifestos/analise?data_inicio=2000-01-01&data_fim=2100-12-31')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setMotoristas(data.data.motoristas ?? []);
          setTiposServico(data.data.tiposServico ?? []);
          setPlacas(data.data.placas ?? []);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Manifestos', href: '/manifestos' }, { label: 'Gráficos' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Evolução diária e distribuição por motorista</h2>

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
            <Link href="/manifestos/graficos" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm hover:bg-slate-50">Limpar</Link>
          </div>
        </form>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}

        {debugLog && (
          <div className="mb-4 p-4 rounded-lg bg-slate-100 border border-slate-300 text-slate-800 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">
            <strong className="block mb-2 text-slate-600">Log de debug (resposta da API / erros):</strong>
            {debugLog}
          </div>
        )}

        {loading ? (
          <div className="p-8 text-center text-slate-500">Carregando...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Evolução diária</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={porData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${(v / 1e3).toFixed(0)}k` : String(v))} />
                    <Tooltip formatter={(value: number | undefined) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)} />
                    <Legend />
                    <Line type="monotone" dataKey="total_frete" name="Valor frete" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="total_liquido" name="Valor líquido" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">Distribuição por motorista (valor líquido)</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={porMotorista}
                      dataKey="total_liquido"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {porMotorista.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | undefined) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value ?? 0)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
