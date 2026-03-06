'use client';

import type { VolumeInput } from './CotacaoClient';

const FATOR_CUBAGEM = 300;

function cubado(altura_cm: number, largura_cm: number, comprimento_cm: number): number {
  if (altura_cm <= 0 || largura_cm <= 0 || comprimento_cm <= 0) return 0;
  return (altura_cm * largura_cm * comprimento_cm) / (FATOR_CUBAGEM * 1000);
}

type VolumeRepeaterProps = {
  volumes: VolumeInput[];
  onChange: (volumes: VolumeInput[]) => void;
  pesoRealTotal: number;
  pesoCubadoTotal: number;
  pesoTarifavel: number;
};

export function VolumeRepeater({ volumes, onChange, pesoRealTotal, pesoCubadoTotal, pesoTarifavel }: VolumeRepeaterProps) {
  const add = () => {
    onChange([...volumes, { quantidade: 1, altura_cm: 0, largura_cm: 0, comprimento_cm: 0, peso_kg: 0 }]);
  };

  const update = (index: number, field: keyof VolumeInput, value: number) => {
    const next = volumes.map((v, i) =>
      i === index ? { ...v, [field]: value } : v
    );
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(volumes.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Volumes</span>
        <button
          type="button"
          onClick={add}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          + Adicionar volume
        </button>
      </div>
      {volumes.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhum volume. Clique em &quot;Adicionar volume&quot;.</p>
      ) : (
        <div className="space-y-2">
          {volumes.map((vol, i) => (
            <div
              key={i}
              className="grid grid-cols-2 sm:grid-cols-6 gap-2 items-end rounded border border-slate-200 p-3 bg-slate-50/50"
            >
              <label className="col-span-2 sm:col-span-1">
                <span className="block text-xs text-slate-500 mb-0.5">Qtd</span>
                <input
                  type="number"
                  min={1}
                  value={vol.quantidade}
                  onChange={(e) => update(i, 'quantidade', Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
              </label>
              <label>
                <span className="block text-xs text-slate-500 mb-0.5">Alt (cm)</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={vol.altura_cm || ''}
                  onChange={(e) => update(i, 'altura_cm', Number(e.target.value) || 0)}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
              </label>
              <label>
                <span className="block text-xs text-slate-500 mb-0.5">Larg (cm)</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={vol.largura_cm || ''}
                  onChange={(e) => update(i, 'largura_cm', Number(e.target.value) || 0)}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
              </label>
              <label>
                <span className="block text-xs text-slate-500 mb-0.5">Comp (cm)</span>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={vol.comprimento_cm || ''}
                  onChange={(e) => update(i, 'comprimento_cm', Number(e.target.value) || 0)}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
              </label>
              <label>
                <span className="block text-xs text-slate-500 mb-0.5">Peso (kg)</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={vol.peso_kg || ''}
                  onChange={(e) => update(i, 'peso_kg', Number(e.target.value) || 0)}
                  className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-red-600 hover:text-red-800 text-sm"
                aria-label="Remover volume"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
      {volumes.length > 0 && (
        <div className="text-sm text-slate-600 mt-2">
          Peso real: <strong>{pesoRealTotal.toFixed(2)} kg</strong>
          {' · '}
          Peso cubado: <strong>{pesoCubadoTotal.toFixed(2)} kg</strong>
          {' · '}
          Peso tarifável: <strong>{pesoTarifavel.toFixed(2)} kg</strong>
        </div>
      )}
    </div>
  );
}

export function computeTotals(volumes: VolumeInput[]): { pesoReal: number; pesoCubado: number; pesoTarifavel: number } {
  let pesoReal = 0;
  let totalCubado = 0;
  for (const v of volumes) {
    pesoReal += v.quantidade * v.peso_kg;
    totalCubado += v.quantidade * cubado(v.altura_cm, v.largura_cm, v.comprimento_cm);
  }
  const pesoTarifavel = Math.max(pesoReal, totalCubado);
  return { pesoReal, pesoCubado: totalCubado, pesoTarifavel };
}
