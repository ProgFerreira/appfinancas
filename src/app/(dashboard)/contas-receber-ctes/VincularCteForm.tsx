'use client';

import { useState, useEffect, useCallback } from 'react';

type Option = { id: number; label: string };

export function VincularCteForm({ onSuccess }: { onSuccess: () => void }) {
  const [contas, setContas] = useState<Option[]>([]);
  const [ctes, setCtes] = useState<Option[]>([]);
  const [contaId, setContaId] = useState('');
  const [cteId, setCteId] = useState('');
  const [valor, setValor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOptions = useCallback(() => {
    Promise.all([
      fetch('/api/contas-receber?per_page=500').then((r) => r.json()),
      fetch('/api/ctes?per_page=500').then((r) => r.json()),
    ]).then(([crRes, cteRes]) => {
      if (crRes.success && crRes.data) {
        setContas(crRes.data.map((c: { id: number; descricao: string | null; cliente_nome?: string }) => ({
          id: c.id,
          label: `${c.descricao ?? 'Sem descrição'} (${c.cliente_nome ?? '?'}) #${c.id}`,
        })));
      }
      if (cteRes.success && cteRes.data) {
        setCtes(cteRes.data.map((c: { id: number; numero: string }) => ({ id: c.id, label: c.numero })));
      }
    });
  }, []);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cId = parseInt(contaId, 10);
    const tId = parseInt(cteId, 10);
    const v = Number(valor.replace(',', '.'));
    if (!Number.isInteger(cId) || cId < 1 || !Number.isInteger(tId) || tId < 1) {
      setError('Selecione uma conta a receber e um CTe.');
      return;
    }
    if (Number.isNaN(v) || v < 0) {
      setError('Informe um valor válido.');
      return;
    }
    setSubmitting(true);
    fetch('/api/contas-receber-ctes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conta_receber_id: cId, cte_id: tId, valor: v }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setContaId('');
          setCteId('');
          setValor('');
          onSuccess();
        } else {
          setError(data.error ?? 'Erro ao vincular');
        }
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setSubmitting(false));
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">Vincular CTe a conta a receber</h3>
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Conta a receber</label>
          <select
            value={contaId}
            onChange={(e) => setContaId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            required
          >
            <option value="">Selecione</option>
            {contas.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">CTe</label>
          <select
            value={cteId}
            onChange={(e) => setCteId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
            required
          >
            <option value="">Selecione</option>
            {ctes.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Valor (R$)</label>
          <input
            type="text"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Salvando...' : 'Vincular'}
          </button>
        </div>
      </div>
    </form>
  );
}
