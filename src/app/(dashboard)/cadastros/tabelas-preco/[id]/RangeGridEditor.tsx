'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CotacaoPriceTableRange } from '@/types';

type Props = { priceTableId: number };

export default function RangeGridEditor({ priceTableId }: Props) {
  const router = useRouter();
  const [ranges, setRanges] = useState<CotacaoPriceTableRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/price-tables/${priceTableId}/ranges`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setRanges(data.data);
      })
      .catch(() => setError('Erro ao carregar'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [priceTableId]);

  const addRange = () => {
    setSaving(true);
    setError(null);
    fetch(`/api/price-tables/${priceTableId}/ranges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        peso_inicial_kg: ranges.length > 0 ? ranges[ranges.length - 1].peso_final_kg : 0,
        peso_final_kg: ranges.length > 0 ? ranges[ranges.length - 1].peso_final_kg + 10 : 10,
        valor_base: 0,
        valor_excedente_por_kg: null,
        prazo_dias: 1,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) load();
        else setError(data.error || 'Erro ao criar faixa');
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setSaving(false));
  };

  const deleteRange = (rangeId: number) => {
    if (!confirm('Remover esta faixa?')) return;
    setSaving(true);
    fetch(`/api/price-tables/ranges/${rangeId}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) load();
        else setError(data.error || 'Erro ao remover');
      })
      .finally(() => setSaving(false));
  };

  if (loading) return <p className="text-slate-500">Carregando...</p>;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {error && <div className="p-4 bg-red-50 text-red-800 text-sm">{error}</div>}
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <span className="text-sm text-slate-600">{ranges.length} faixa(s)</span>
        <button
          type="button"
          onClick={addRange}
          disabled={saving}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          + Nova faixa
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Peso inicial (kg)</th>
              <th className="px-4 py-2 font-medium">Peso final (kg)</th>
              <th className="px-4 py-2 font-medium">Valor base (R$)</th>
              <th className="px-4 py-2 font-medium">Excedente/kg (R$)</th>
              <th className="px-4 py-2 font-medium">Prazo (dias)</th>
              <th className="px-4 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {ranges.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="px-4 py-2">{Number(r.peso_inicial_kg)}</td>
                <td className="px-4 py-2">{Number(r.peso_final_kg)}</td>
                <td className="px-4 py-2">{Number(r.valor_base).toFixed(2)}</td>
                <td className="px-4 py-2">{r.valor_excedente_por_kg != null ? Number(r.valor_excedente_por_kg).toFixed(4) : '—'}</td>
                <td className="px-4 py-2">{r.prazo_dias}</td>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => deleteRange(r.id)}
                    className="text-red-600 hover:underline text-sm"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
