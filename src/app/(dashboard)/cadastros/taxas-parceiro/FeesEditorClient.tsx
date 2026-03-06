'use client';

import { useEffect, useState } from 'react';
import type { CotacaoParceiro } from '@/types';
import type { CotacaoPartnerFees } from '@/types';

export default function FeesEditorClient() {
  const [partners, setPartners] = useState<CotacaoParceiro[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [fees, setFees] = useState<Partial<CotacaoPartnerFees> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/partners')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setPartners(data.data);
          if (data.data.length > 0 && !selectedId) setSelectedId(data.data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      setFees(null);
      return;
    }
    setLoading(true);
    fetch(`/api/partner-fees?partner_id=${selectedId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setFees(data.data || {});
        else setFees({});
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  const handleSave = () => {
    if (selectedId == null) return;
    setSaving(true);
    setError(null);
    fetch('/api/partner-fees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partner_id: selectedId,
        gris_percent: fees?.gris_percent,
        advalorem_percent: fees?.advalorem_percent,
        pedagio_fixo: fees?.pedagio_fixo,
        seguro_minimo: fees?.seguro_minimo,
        seguro_percent: fees?.seguro_percent,
        coleta_fixo: fees?.coleta_fixo,
        entrega_fixo: fees?.entrega_fixo,
        fator_cubagem_rodoviario: fees?.fator_cubagem_rodoviario ?? 300,
        fator_cubagem_aereo: fees?.fator_cubagem_aereo ?? 166.7,
        peso_minimo_tarifavel_kg: fees?.peso_minimo_tarifavel_kg,
        arredondar_peso_cima: fees?.arredondar_peso_cima ?? 1,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setError(null);
        else setError(data.error || 'Erro ao salvar');
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setSaving(false));
  };

  const update = (field: keyof CotacaoPartnerFees, value: number | null) => {
    setFees((prev) => (prev ? { ...prev, [field]: value ?? undefined } : { [field]: value ?? undefined }));
  };

  if (partners.length === 0 && !loading) return <p className="text-slate-500">Nenhum parceiro cadastrado.</p>;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 max-w-2xl space-y-4">
      <label>
        <span className="block text-sm font-medium text-slate-700 mb-1">Parceiro</span>
        <select
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(parseInt(e.target.value, 10) || null)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        >
          {partners.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </label>
      {error && <div className="p-3 rounded bg-red-50 text-red-800 text-sm">{error}</div>}
      {fees && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <label>
              <span className="block text-sm text-slate-600 mb-0.5">GRIS (%)</span>
              <input
                type="number"
                step={0.0001}
                value={fees.gris_percent ?? ''}
                onChange={(e) => update('gris_percent', e.target.value === '' ? null : Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-0.5">Ad Valorem (%)</span>
              <input
                type="number"
                step={0.0001}
                value={fees.advalorem_percent ?? ''}
                onChange={(e) => update('advalorem_percent', e.target.value === '' ? null : Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-0.5">Pedágio (R$ fixo)</span>
              <input
                type="number"
                step={0.01}
                value={fees.pedagio_fixo ?? ''}
                onChange={(e) => update('pedagio_fixo', e.target.value === '' ? null : Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-0.5">Seguro mínimo (R$)</span>
              <input
                type="number"
                step={0.01}
                value={fees.seguro_minimo ?? ''}
                onChange={(e) => update('seguro_minimo', e.target.value === '' ? null : Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-0.5">Seguro (%)</span>
              <input
                type="number"
                step={0.0001}
                value={fees.seguro_percent ?? ''}
                onChange={(e) => update('seguro_percent', e.target.value === '' ? null : Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-0.5">Coleta (R$)</span>
              <input
                type="number"
                step={0.01}
                value={fees.coleta_fixo ?? ''}
                onChange={(e) => update('coleta_fixo', e.target.value === '' ? null : Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
            <label>
              <span className="block text-sm text-slate-600 mb-0.5">Entrega (R$)</span>
              <input
                type="number"
                step={0.01}
                value={fees.entrega_fixo ?? ''}
                onChange={(e) => update('entrega_fixo', e.target.value === '' ? null : Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar taxas'}
          </button>
        </>
      )}
    </div>
  );
}
