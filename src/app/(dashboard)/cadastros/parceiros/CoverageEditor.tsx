'use client';

import { useEffect, useState } from 'react';
import type { CotacaoParceiroCoverage } from '@/types';

type Props = { partnerId: number };

export function CoverageEditor({ partnerId }: Props) {
  const [list, setList] = useState<CotacaoParceiroCoverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uf, setUf] = useState('');
  const [cidade, setCidade] = useState('');
  const [cepInicio, setCepInicio] = useState('');
  const [cepFim, setCepFim] = useState('');

  const load = () => {
    setLoading(true);
    fetch(`/api/partners/${partnerId}/coverages`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setList(data.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [partnerId]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uf.trim() || !cidade.trim()) return;
    setSaving(true);
    fetch(`/api/partners/${partnerId}/coverages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uf: uf.trim().toUpperCase().slice(0, 2),
        cidade: cidade.trim(),
        cep_inicio: cepInicio.replace(/\D/g, '').slice(0, 8) || null,
        cep_fim: cepFim.replace(/\D/g, '').slice(0, 8) || null,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUf('');
          setCidade('');
          setCepInicio('');
          setCepFim('');
          load();
        }
      })
      .finally(() => setSaving(false));
  };

  const remove = (id: number) => {
    if (!confirm('Remover esta praça?')) return;
    setSaving(true);
    fetch(`/api/partners/${partnerId}/coverages?id=${id}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data) => { if (data.success) load(); })
      .finally(() => setSaving(false));
  };

  return (
    <div className="rounded border border-slate-200 p-4 bg-slate-50/50">
      <h3 className="text-sm font-medium text-slate-700 mb-2">Cobertura (praças atendidas)</h3>
      {loading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : (
        <>
          <form onSubmit={add} className="flex flex-wrap gap-2 mb-3">
            <input
              type="text"
              placeholder="UF"
              value={uf}
              onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
              className="w-14 rounded border border-slate-300 px-2 py-1 text-sm"
              maxLength={2}
            />
            <input
              type="text"
              placeholder="Cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-40 rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <input
              type="text"
              placeholder="CEP início"
              value={cepInicio}
              onChange={(e) => setCepInicio(e.target.value.replace(/\D/g, '').slice(0, 8))}
              className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <input
              type="text"
              placeholder="CEP fim"
              value={cepFim}
              onChange={(e) => setCepFim(e.target.value.replace(/\D/g, '').slice(0, 8))}
              className="w-24 rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <button type="submit" disabled={saving} className="px-2 py-1 bg-indigo-600 text-white rounded text-sm disabled:opacity-50">
              Adicionar
            </button>
          </form>
          <ul className="text-sm space-y-1">
            {list.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-1">
                <span>{c.uf} / {c.cidade}{c.cep_inicio ? ` (CEP ${c.cep_inicio}-${c.cep_fim ?? ''})` : ''}</span>
                <button type="button" onClick={() => remove(c.id)} className="text-red-600 hover:underline">Excluir</button>
              </li>
            ))}
            {list.length === 0 && <li className="text-slate-500">Nenhuma praça cadastrada.</li>}
          </ul>
        </>
      )}
    </div>
  );
}
