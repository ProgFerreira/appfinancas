'use client';

import { useState, useCallback } from 'react';
import { QuoteForm } from './QuoteForm';
import { QuoteResultsList } from './QuoteResultsList';
import type { QuoteOption } from '@/types';

export interface VolumeInput {
  quantidade: number;
  altura_cm: number;
  largura_cm: number;
  comprimento_cm: number;
  peso_kg: number;
}

export default function CotacaoClient() {
  const [options, setOptions] = useState<QuoteOption[]>([]);
  const [quoteId, setQuoteId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCalculate = useCallback(async (payload: {
    origem_uf: string;
    origem_cidade: string;
    destino_uf: string;
    destino_cidade: string;
    tipo_carga?: string;
    valor_nf: number;
    volumes: VolumeInput[];
    servico_ar: boolean;
    servico_mao_propria: boolean;
    servico_coleta: boolean;
    servico_entrega: boolean;
    servico_seguro: boolean;
  }) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/quotes/calc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origem_uf: payload.origem_uf,
          origem_cidade: payload.origem_cidade,
          destino_uf: payload.destino_uf,
          destino_cidade: payload.destino_cidade,
          tipo_carga: payload.tipo_carga || undefined,
          valor_nf: payload.valor_nf,
          volumes: payload.volumes,
          servico_ar: payload.servico_ar,
          servico_mao_propria: payload.servico_mao_propria,
          servico_coleta: payload.servico_coleta,
          servico_entrega: payload.servico_entrega,
          servico_seguro: payload.servico_seguro,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setOptions([]);
        setQuoteId(null);
        setError(data.error || 'Erro ao calcular cotação.');
        return;
      }
      setQuoteId(data.data?.quote_id ?? null);
      setOptions(data.data?.options ?? []);
    } catch {
      setOptions([]);
      setQuoteId(null);
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, []);

  const onSelectOption = useCallback(async (option: QuoteOption) => {
    if (!quoteId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partner_id: option.partner_id,
          preco_final: option.preco_final,
          prazo_dias: option.prazo_dias,
          breakdown_json: option.breakdown,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Erro ao salvar seleção.');
        return;
      }
      setError(null);
      alert('Opção selecionada com sucesso. Esta cotação pode ser convertida em operação/OT.');
    } catch {
      setError('Erro de conexão.');
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  return (
    <div className="space-y-6">
      <QuoteForm onCalculate={onCalculate} loading={loading} />
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}
      {options.length > 0 && (
        <QuoteResultsList
          options={options}
          quoteId={quoteId}
          onSelect={onSelectOption}
          loading={loading}
        />
      )}
    </div>
  );
}
