'use client';

import { useState } from 'react';
import type { QuoteBreakdown, QuoteOption } from '@/types';

type QuoteResultsListProps = {
  options: QuoteOption[];
  quoteId: number | null;
  onSelect: (option: QuoteOption) => void;
  loading: boolean;
};

type SortType = 'preco' | 'prazo' | 'custo_beneficio';

function formatBrl(value: number | undefined | null): string {
  const n = Number(value);
  return (Number.isNaN(n) ? 0 : n).toFixed(2).replace('.', ',');
}

function isQuoteBreakdown(b: unknown): b is QuoteBreakdown {
  return typeof b === 'object' && b !== null && 'composicao' in b && 'frete_total' in b && 'tx_coleta' in b;
}

function QuoteComposicaoPanel({ breakdown, precoFinal }: { breakdown: Record<string, number>; precoFinal: number }) {
  const isNew = isQuoteBreakdown(breakdown);
  const [descontoPct, setDescontoPct] = useState(0);
  const [acrescimoPct, setAcrescimoPct] = useState(0);

  const valorDesconto = isNew ? (breakdown.frete_total ?? precoFinal) * (descontoPct / 100) : 0;
  const valorAcrescimo = isNew ? (breakdown.frete_total ?? precoFinal) * (acrescimoPct / 100) : 0;
  const freteComAjuste = (breakdown.frete_total ?? precoFinal) - valorDesconto + valorAcrescimo;
  const lucroValor = freteComAjuste - (breakdown.composicao ?? precoFinal);
  const lucroPct = (breakdown.composicao ?? precoFinal) > 0 ? (lucroValor / (breakdown.composicao ?? precoFinal)) * 100 : 0;

  if (isNew) {
    const b = breakdown as QuoteBreakdown;
    const n = (v: number | undefined | null) => (v != null && !Number.isNaN(Number(v)) ? Number(v) : 0);
    const valorRows1 = [
      { label: 'TX. COLETA', value: n(b.tx_coleta) },
      { label: 'TX. PEDAGIO', value: n(b.tx_pedagio) },
      { label: 'TX. GRIS.', value: n(b.tx_gris) },
      { label: 'TAS', value: n(b.tas) },
    ];
    const valorRows2 = [
      { label: 'TX. ENTREGA', value: n(b.tx_entrega) },
      { label: 'TX. TAD', value: n(b.tx_tad) },
      { label: 'TX. PESO ADD', value: n(b.tx_peso_add) },
      { label: 'TRT', value: n(b.trt) },
    ];
    const valorRows3 = [
      { label: '% NF', value: n(b.pct_nf) },
      { label: 'Ad Valorem', value: n(b.advalorem) },
      { label: 'TX. REDESPACHO', value: n(b.tx_redespacho) },
      { label: 'TDE', value: n(b.tde) },
    ];
    const valorRows4 = [
      { label: 'FRETE PESO', value: n(b.frete_peso) },
      { label: 'OUTRAS TAXAS', value: n(b.outras_taxas) },
      { label: 'TX. DESPACHO', value: n(b.tx_despacho) },
      { label: 'SET/CAT', value: n(b.set_cat) },
    ];

    return (
      <div className="mt-4 p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
        <h5 className="text-sm font-semibold text-slate-700">Valores (composição pela tabela de preço)</h5>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 text-sm">
          {[valorRows1, valorRows2, valorRows3, valorRows4].map((col, i) => (
            <div key={i} className="space-y-2">
              {col.map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-medium tabular-nums">R$ {formatBrl(value)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-200">
          <div>
            <span className="text-slate-600 text-sm">COMPOSIÇÃO</span>
            <p className="font-semibold text-slate-800">R$ {formatBrl(n(b.composicao))}</p>
          </div>
          <div>
            <span className="text-slate-600 text-sm">MEDIA Kg</span>
            <p className="font-semibold text-slate-800">{formatBrl(n(b.media_kg))}</p>
          </div>
          <div>
            <span className="text-slate-600 text-sm">SUB TOTAL</span>
            <p className="font-semibold text-slate-800">R$ {formatBrl(n(b.subtotal))}</p>
          </div>
          <div>
            <span className="text-slate-600 text-sm">FRETE TOTAL</span>
            <p className="font-semibold text-slate-800 border-b-2 border-slate-800">R$ {formatBrl(n(b.frete_total))}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-200">
          <div className="col-span-2">
            <span className="text-slate-600 text-sm block">Desconto % / Acréscimo %</span>
            <div className="flex gap-4 mt-1">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  max={100}
                  value={descontoPct}
                  onChange={(e) => setDescontoPct(Number(e.target.value) || 0)}
                  className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                />
                <span className="text-slate-600 text-sm">Valor: R$ {formatBrl(valorDesconto)}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  max={100}
                  value={acrescimoPct}
                  onChange={(e) => setAcrescimoPct(Number(e.target.value) || 0)}
                  className="w-16 rounded border border-slate-300 px-2 py-1 text-sm"
                />
                <span className="text-slate-600 text-sm">Valor: R$ {formatBrl(valorAcrescimo)}</span>
              </div>
            </div>
          </div>
          <div>
            <span className="text-slate-600 text-sm">Total de lucro</span>
            <p className="font-semibold text-slate-800">
              R$ {formatBrl(lucroValor)} ({lucroPct.toFixed(2)}%)
            </p>
          </div>
          {b.cod_trecho != null && (
            <div>
              <span className="text-slate-600 text-sm">CÓD. TRECHO</span>
              <p className="font-semibold text-slate-800">{b.cod_trecho}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const entries = Object.entries(breakdown || {}).filter(([, v]) => v !== undefined && v !== null);
  return (
    <div className="mt-3 pt-3 border-t border-slate-200 text-sm text-slate-600 grid grid-cols-2 sm:grid-cols-4 gap-2">
      {entries.length === 0 ? (
        <span className="text-slate-500">Sem detalhamento.</span>
      ) : (
        entries.map(([key, value]) => (
          <span key={key}>
            {key.replace(/_/g, ' ')}: R$ {formatBrl(Number(value))}
          </span>
        ))
      )}
    </div>
  );
}

function optionKey(opt: QuoteOption): string {
  const cod = (opt.breakdown as QuoteBreakdown | undefined)?.cod_trecho;
  return cod != null ? `${opt.partner_id}-${cod}` : `opt-${opt.partner_id}`;
}

export function QuoteResultsList({ options: initialOptions, quoteId, onSelect, loading }: QuoteResultsListProps) {
  const [sort, setSort] = useState<SortType>('preco');
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const options = [...initialOptions].sort((a, b) => {
    if (sort === 'prazo') return a.prazo_dias - b.prazo_dias || a.preco_final - b.preco_final;
    if (sort === 'custo_beneficio') {
      const scoreA = a.prazo_dias > 0 ? a.preco_final / a.prazo_dias : a.preco_final;
      const scoreB = b.prazo_dias > 0 ? b.preco_final / b.prazo_dias : b.preco_final;
      return scoreA - scoreB;
    }
    return a.preco_final - b.preco_final;
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-800">Opções de frete</h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Ordenar:</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="preco">Mais barato</option>
            <option value="prazo">Mais rápido</option>
            <option value="custo_beneficio">Melhor custo-benefício</option>
          </select>
        </div>
      </div>
      <ul className="divide-y divide-slate-200">
        {options.map((opt) => {
          const key = optionKey(opt);
          return (
          <li key={key} className="p-4 hover:bg-slate-50/50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-medium text-slate-800">{opt.partner_nome}</p>
                <p className="text-sm text-slate-500">
                  {opt.tipo === 'AEREO' ? 'Aéreo' : opt.tipo === 'RODOVIARIO' ? 'Rodoviário' : 'Rodoviário/Aéreo'}
                  {' · '}
                  {opt.prazo_dias} dia(s)
                  {opt.breakdown?.cod_trecho != null && (
                    <span className="ml-2 text-slate-400">Trecho #{opt.breakdown.cod_trecho}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold text-slate-800">
                  R$ {formatBrl(opt.preco_final)}
                </p>
                <button
                  type="button"
                  onClick={() => onSelect(opt)}
                  disabled={loading}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  Selecionar
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedKey(expandedKey === key ? null : key)}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  {expandedKey === key ? 'Ocultar' : 'Detalhes'}
                </button>
              </div>
            </div>
            {expandedKey === key && opt.breakdown && (
              <QuoteComposicaoPanel breakdown={opt.breakdown} precoFinal={opt.preco_final} />
            )}
          </li>
          );
        })}
      </ul>
    </div>
  );
}
