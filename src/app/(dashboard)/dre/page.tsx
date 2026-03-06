'use client';

import { useCallback, useEffect, useState } from 'react';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Calendar, ChevronDown, ChevronRight, Check } from 'lucide-react';
import type { DreDemonstrativoResult, DreDemonstrativoRow, DreRowType } from '@/modules/finance/services/DreDemonstrativoService';

function formatCurrency(value: number): string {
  if (value === 0) return '0';
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return value < 0 ? `(${formatted})` : formatted;
}

function formatPercent(value: number): string {
  const formatted = value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${formatted}%`;
}

function formatInteger(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

function rowClass(rowType: DreRowType, isChild: boolean): string {
  const base = isChild ? 'pl-8' : '';
  switch (rowType) {
    case 'metric':
      return `bg-emerald-50 ${base}`;
    case 'section':
      return `bg-slate-700 text-white font-medium ${base}`;
    case 'total':
      return `bg-slate-600 text-white font-semibold ${base}`;
    case 'subtotal':
      return `bg-slate-100 ${base}`;
    case 'detail':
      return `bg-white ${base}`;
    case 'margin':
      return `bg-white text-emerald-600 font-medium ${base}`;
    default:
      return `bg-white ${base}`;
  }
}

function cellClass(rowType: DreRowType, isYtd: boolean): string {
  if (rowType === 'section' && isYtd) return 'bg-slate-700 text-white text-right p-2 tabular-nums';
  if (rowType === 'total' && isYtd) return 'bg-slate-600 text-white text-right p-2 tabular-nums font-semibold';
  if (rowType === 'metric') return 'text-right p-2 tabular-nums';
  return 'text-right p-2 tabular-nums';
}

export default function DrePage() {
  const [data, setData] = useState<DreDemonstrativoResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mesRef, setMesRef] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandAll, setExpandAll] = useState(false);

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    if (!mesRef) setMesRef(`${y}-${m}`);
  }, [mesRef]);

  const fetchData = useCallback(() => {
    if (!mesRef) return;
    setLoading(true);
    setError(null);
    fetch(`/api/dre/demonstrativo?mes_ref=${encodeURIComponent(mesRef)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setData(json.data);
        else setError(json.error || 'Erro ao carregar');
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false));
  }, [mesRef]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (!data) return;
    const allExpandable = data.rows.filter((r) => r.expandable && (r.children?.length ?? 0) > 0).map((r) => r.id);
    if (expandAll) {
      setExpanded(new Set());
      setExpandAll(false);
    } else {
      setExpanded(new Set(allExpandable));
      setExpandAll(true);
    }
  };

  const flattenRows = (rows: DreDemonstrativoRow[], expandedSet: Set<string>): DreDemonstrativoRow[] => {
    const out: DreDemonstrativoRow[] = [];
    for (const r of rows) {
      out.push(r);
      if (r.expandable && r.children?.length && expandedSet.has(r.id)) {
        for (const c of r.children) out.push(c);
      }
    }
    return out;
  };

  const isMargin = (row: DreDemonstrativoRow) => row.rowType === 'margin';
  const isMetric = (row: DreDemonstrativoRow) => row.rowType === 'metric';

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Demonstrativo de resultado (DRE – caixa)' }]} />
      <div className="mt-4">
        <div className="mb-4">
            <p className="text-xs text-slate-500 mb-1">
              Receitas pela data do recebimento; custos e despesas pela data do pagamento.
            </p>
          <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800">
              Demonstrativo de resultado (BRL) – regime de caixa {data ? data.mesRefLabel : ''}
            </h2>
            <label className="flex items-center gap-2 border border-slate-300 rounded-md overflow-hidden bg-white">
              <Calendar className="w-4 h-4 text-slate-500 ml-2" aria-hidden />
              <input
                type="month"
                value={mesRef}
                onChange={(e) => setMesRef(e.target.value)}
                className="border-0 py-1.5 pr-2 text-sm focus:ring-0 focus:outline-none"
                aria-label="Mês de referência"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={toggleExpandAll}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1"
          >
            <Check className="w-4 h-4" aria-hidden />
            {expandAll ? 'Recolher todas' : 'Expandir todas'}
          </button>
          </div>
        </div>

        {error && <p className="text-red-600 mb-4">{error}</p>}
        {loading && <p className="text-slate-500">Carregando...</p>}

        {!loading && data && (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-100">
                  <th className="text-left p-2 font-medium text-slate-700 border-b border-slate-200">
                    Conta / Grupo
                  </th>
                  {data.meses.map((m) => (
                    <th
                      key={m.key}
                      className="text-right p-2 font-medium text-slate-700 border-b border-slate-200 whitespace-nowrap"
                    >
                      {m.label}
                    </th>
                  ))}
                  <th className="text-right p-2 font-medium text-slate-700 border-b border-slate-200 bg-emerald-50 whitespace-nowrap">
                    YTD
                  </th>
                </tr>
              </thead>
              <tbody>
                {flattenRows(data.rows, expanded).map((row) => {
                  const hasChildren = row.expandable && (row.children?.length ?? 0) > 0;
                  const isChild = !!row.parentId;
                  const open = expanded.has(row.id);
                  return (
                    <tr key={row.id} className={rowClass(row.rowType, isChild)}>
                      <td className={`p-2 border-b border-slate-100 ${row.rowType === 'section' ? 'text-white' : 'text-slate-800'}`}>
                        <span className="inline-flex items-center gap-1">
                          {hasChildren ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(row.id)}
                              className="p-0.5 rounded hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-inset"
                              aria-expanded={open}
                              aria-label={open ? 'Recolher' : 'Expandir'}
                            >
                              {open ? (
                                <ChevronDown className="w-4 h-4" aria-hidden />
                              ) : (
                                <ChevronRight className="w-4 h-4" aria-hidden />
                              )}
                            </button>
                          ) : (
                            <span className="w-5 inline-block" aria-hidden />
                          )}
                          {row.label}
                        </span>
                      </td>
                      {data.meses.map((m) => (
                        <td
                          key={m.key}
                          className={`${cellClass(row.rowType, false)} border-b border-slate-100 ${
                            isMargin(row) ? 'text-emerald-600' : ''
                          }`}
                        >
                          {isMargin(row)
                            ? formatPercent(row.values[m.key] ?? 0)
                            : isMetric(row)
                              ? formatInteger(row.values[m.key] ?? 0)
                              : formatCurrency(row.values[m.key] ?? 0)}
                        </td>
                      ))}
                      <td
                        className={`${cellClass(row.rowType, true)} border-b border-slate-100 ${
                          row.rowType === 'section' ? 'bg-slate-700 text-white' : ''
                        } ${row.rowType === 'total' ? 'bg-slate-600 text-white' : ''} ${isMargin(row) ? 'text-emerald-600' : ''}`}
                      >
                        {isMargin(row)
                          ? formatPercent(row.values[data.ytdKey] ?? 0)
                          : isMetric(row)
                            ? formatInteger(row.values[data.ytdKey] ?? 0)
                            : formatCurrency(row.values[data.ytdKey] ?? 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
