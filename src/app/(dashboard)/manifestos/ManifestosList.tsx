'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Manifesto } from '@/types';

function formatMoney(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value) || 0);
}
/** Formata data do banco (YYYY-MM-DD) como MM/DD/YYYY (ex: 2025-02-12 → 02/12/2025 = 12 de fev). */
function formatDate(s: string | null) {
  if (!s) return '—';
  const part = String(s).trim().slice(0, 10);
  const [y, m, d] = part.split('-');
  if (y && m && d) return `${m.padStart(2, '0')}/${d.padStart(2, '0')}/${y}`;
  return new Date(s).toLocaleDateString('pt-BR');
}

function toNum(v: unknown): number {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

type MotoristaOption = { id: number; nome: string };

type ManifestoRow = Manifesto & { motorista_nome?: string | null; motorista_placa?: string | null };

function normalizeRow(raw: Record<string, unknown>): ManifestoRow {
  return {
    ...raw,
    id: toNum(raw.id),
    valor_frete: toNum(raw.valor_frete),
    valor_despesa: toNum(raw.valor_despesa),
    valor_liquido: toNum(raw.valor_liquido),
    custo_adicional: toNum(raw.custo_adicional),
    custo_pedagio: toNum(raw.custo_pedagio),
    quantidade_volumes: toNum(raw.quantidade_volumes),
    quantidade_entrega: toNum(raw.quantidade_entrega),
    peso: toNum(raw.peso),
    peso_taxa: toNum(raw.peso_taxa),
    km: toNum(raw.km),
    numero_manifesto: String(raw.numero_manifesto ?? ''),
    data_manifesto: raw.data_manifesto != null ? String(raw.data_manifesto) : null,
    data_saida_efetiva: raw.data_saida_efetiva != null ? String(raw.data_saida_efetiva) : null,
    motorista_nome: (raw.motorista_nome ?? raw.Motorista_nome) != null ? String(raw.motorista_nome ?? raw.Motorista_nome) : null,
    motorista_placa: (raw.motorista_placa ?? raw.Motorista_placa) != null ? String(raw.motorista_placa ?? raw.Motorista_placa) : null,
    tipo_servico: raw.tipo_servico != null ? String(raw.tipo_servico) : null,
    rota: raw.rota != null ? String(raw.rota) : null,
    responsavel: raw.responsavel != null ? String(raw.responsavel) : null,
    status: raw.status != null ? String(raw.status) : 'pendente',
    emissor: raw.emissor != null ? String(raw.emissor) : null,
    tipo_rodado: raw.tipo_rodado != null ? String(raw.tipo_rodado) : null,
    unidade: raw.unidade != null ? String(raw.unidade) : null,
    total_nf: raw.total_nf != null ? toNum(raw.total_nf) : null,
    entrega_realizada: raw.entrega_realizada != null ? toNum(raw.entrega_realizada) : null,
  } as ManifestoRow;
}

export function ManifestosList() {
  const router = useRouter();
  const [items, setItems] = useState<Manifesto[]>([]);
  const [motoristas, setMotoristas] = useState<MotoristaOption[]>([]);
  const [tiposServico, setTiposServico] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [numero, setNumero] = useState('');
  const [motoristaId, setMotoristaId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipoServico, setTipoServico] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchManifestos = useCallback(() => {
    setError(null);
    const q = new URLSearchParams({ page: String(page), per_page: '20' });
    if (numero) q.set('numero', numero);
    if (motoristaId) q.set('motorista_id', motoristaId);
    if (dataInicio) q.set('data_inicio', dataInicio);
    if (dataFim) q.set('data_fim', dataFim);
    if (tipoServico) q.set('tipo_servico', tipoServico);
    fetch(`/api/manifestos?${q}`)
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { success: false, error: 'Resposta vazia', status: res.status };
        try {
          const data = JSON.parse(text) as { success?: boolean; data?: unknown[]; meta?: { total?: number; totalPages?: number }; error?: string };
          return { ...data, status: res.status };
        } catch {
          return { success: false, error: 'Resposta inválida', status: res.status };
        }
      })
      .then((data) => {
        if (data.status === 401) {
          router.push('/login');
          return;
        }
        if (data.success && Array.isArray(data.data)) {
          setItems(data.data.map((row: unknown) => normalizeRow(row as Record<string, unknown>)));
          setTotal(Number(data.meta?.total) ?? 0);
          setTotalPages(Number(data.meta?.totalPages) ?? 0);
          setError(null);
        } else {
          setError(data.error ?? 'Erro ao carregar');
          setItems([]);
        }
      })
      .catch(() => {
        setError('Erro de conexão.');
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, [page, numero, motoristaId, dataInicio, dataFim, tipoServico, router]);

  useEffect(() => {
    setLoading(true);
    fetchManifestos();
  }, [fetchManifestos, refreshKey]);

  useEffect(() => {
    fetch('/api/motoristas?per_page=500')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setMotoristas(data.data.map((m: { id: number; nome: string }) => ({ id: m.id, nome: m.nome })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/manifestos/options')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data?.tiposServico) {
          setTiposServico(data.data.tiposServico);
        }
      })
      .catch(() => {});
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setRefreshKey((k) => k + 1);
  };

  const custoTotal = (m: Manifesto) =>
    (m.valor_despesa ?? 0) + (m.custo_adicional ?? 0) + (m.custo_pedagio ?? 0);
  const margemPct = (m: Manifesto) =>
    (m.valor_frete ?? 0) > 0
      ? ((m.valor_liquido ?? 0) / (m.valor_frete ?? 1)) * 100
      : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {error && (
        <div className="mx-4 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
      )}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/manifestos/analise"
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
          >
            Análise
          </Link>
          <Link
            href="/manifestos/importar"
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Importar
          </Link>
        </div>
      </div>

      <form onSubmit={handleFilter} className="p-4 border-b border-slate-200 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Número</label>
          <input
            type="text"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Número manifesto"
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 w-40"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Motorista</label>
          <select
            value={motoristaId}
            onChange={(e) => { setMotoristaId(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
          >
            <option value="">Todos</option>
            {motoristas.map((m) => (
              <option key={m.id} value={m.id}>{m.nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Tipo serviço</label>
          <select
            value={tipoServico}
            onChange={(e) => { setTipoServico(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
          >
            <option value="">Todos</option>
            {tiposServico.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Data início</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Data fim</label>
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
      </form>

      {loading ? (
        <div className="p-8 text-center text-slate-500">Carregando...</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left p-3">Data</th>
                  <th className="text-left p-3">Manifesto</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Responsável</th>
                  <th className="text-left p-3">Motorista</th>
                  <th className="text-left p-3">Placa</th>
                  <th className="text-left p-3">Rota</th>
                  <th className="text-right p-3">Qtd vol.</th>
                  <th className="text-right p-3">Qtd ent.</th>
                  <th className="text-right p-3">Peso</th>
                  <th className="text-right p-3">Peso tax.</th>
                  <th className="text-right p-3">KM</th>
                  <th className="text-right p-3">Faturamento</th>
                  <th className="text-right p-3">Custo frete</th>
                  <th className="text-right p-3">Custo total</th>
                  <th className="text-right p-3">Resultado</th>
                  <th className="text-left p-3">Emissor</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-right p-3">Rentab.</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={19} className="p-6 text-center text-slate-500">
                      Nenhum manifesto encontrado.
                    </td>
                  </tr>
                ) : (
                  items.map((r, idx) => {
                    const margem = Number(margemPct(r)) || 0;
                    const corMargem = margem >= 70 ? 'bg-emerald-100 text-emerald-800' : margem >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800';
                    return (
                      <tr key={r.id ?? idx} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-3 text-slate-600 whitespace-nowrap">{formatDate(r.data_manifesto)}</td>
                        <td className="p-3 font-medium text-slate-800">{r.numero_manifesto}</td>
                        <td className="p-3 text-slate-600 text-xs max-w-[120px] truncate" title={r.tipo_servico ?? undefined}>{r.tipo_servico ?? '—'}</td>
                        <td className="p-3 text-slate-600 text-xs max-w-[120px] truncate" title={r.responsavel ?? undefined}>{r.responsavel ?? '—'}</td>
                        <td className="p-3 text-slate-600 text-xs max-w-[140px] truncate" title={r.motorista_nome ?? undefined}>{r.motorista_nome ?? '—'}</td>
                        <td className="p-3 text-slate-600">{r.motorista_placa ?? '—'}</td>
                        <td className="p-3 text-slate-600 text-xs max-w-[100px] truncate" title={r.rota ?? undefined}>{r.rota ?? '—'}</td>
                        <td className="p-3 text-right text-slate-600">{(r.quantidade_volumes ?? 0).toLocaleString('pt-BR')}</td>
                        <td className="p-3 text-right text-slate-600">{(r.quantidade_entrega ?? 0).toLocaleString('pt-BR')}</td>
                        <td className="p-3 text-right text-slate-600">{(r.peso ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 3 })}</td>
                        <td className="p-3 text-right text-slate-600">{(r.peso_taxa ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 3 })}</td>
                        <td className="p-3 text-right text-slate-600">{(r.km ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right font-medium text-slate-800">{formatMoney(r.valor_frete ?? 0)}</td>
                        <td className="p-3 text-right text-red-600">{formatMoney(r.valor_despesa ?? 0)}</td>
                        <td className="p-3 text-right text-red-600">{formatMoney(custoTotal(r))}</td>
                        <td className="p-3 text-right font-medium text-slate-800">{formatMoney(r.valor_liquido ?? 0)}</td>
                        <td className="p-3 text-slate-600 text-xs">{r.emissor ?? '—'}</td>
                        <td className="p-3 text-slate-600 text-xs max-w-[100px] truncate" title={r.status ?? undefined}>{r.status ?? '—'}</td>
                        <td className="p-3 text-right">
                          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${corMargem}`}>
                            {margem.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="p-3 border-t border-slate-200 flex justify-between items-center text-sm text-slate-600">
              <span>Total: {total} | Página {page} de {totalPages}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded border border-slate-200 disabled:opacity-50 hover:bg-slate-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
