'use client';

import { useState, useMemo, useEffect } from 'react';
import { VolumeRepeater, computeTotals } from './VolumeRepeater';
import type { VolumeInput } from './CotacaoClient';

const TIPOS_CARGA = ['Carga geral', 'Envelope', 'Documento', 'Outros'] as const;

type Praca = { uf: string; cidade: string };

type QuoteFormProps = {
  onCalculate: (payload: {
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
  }) => void;
  loading: boolean;
};

export function QuoteForm({ onCalculate, loading }: QuoteFormProps) {
  const [pracas, setPracas] = useState<Praca[]>([]);
  const [origemUf, setOrigemUf] = useState('');
  const [origemCidade, setOrigemCidade] = useState('');
  const [destinoUf, setDestinoUf] = useState('');
  const [destinoCidade, setDestinoCidade] = useState('');
  const [tipoCarga, setTipoCarga] = useState<string>(TIPOS_CARGA[0]);
  const [valorNf, setValorNf] = useState('');
  const [volumes, setVolumes] = useState<VolumeInput[]>([{ quantidade: 1, altura_cm: 0, largura_cm: 0, comprimento_cm: 0, peso_kg: 0 }]);
  const [servicoAr, setServicoAr] = useState(false);
  const [servicoMaoPropria, setServicoMaoPropria] = useState(false);
  const [servicoColeta, setServicoColeta] = useState(false);
  const [servicoEntrega, setServicoEntrega] = useState(false);
  const [servicoSeguro, setServicoSeguro] = useState(false);

  useEffect(() => {
    fetch('/api/pracas')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) setPracas(data.data);
      })
      .catch(() => {});
  }, []);

  const ufs = useMemo(() => [...new Set(pracas.map((p) => p.uf))].sort(), [pracas]);
  const cidadesByUf = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const p of pracas) {
      if (!map[p.uf]) map[p.uf] = [];
      if (!map[p.uf].includes(p.cidade)) map[p.uf].push(p.cidade);
    }
    for (const uf of Object.keys(map)) map[uf].sort();
    return map;
  }, [pracas]);

  const origemCidades = useMemo(() => cidadesByUf[origemUf] ?? [], [cidadesByUf, origemUf]);
  const destinoCidades = useMemo(() => cidadesByUf[destinoUf] ?? [], [cidadesByUf, destinoUf]);

  const { pesoReal, pesoCubado, pesoTarifavel } = useMemo(() => computeTotals(volumes), [volumes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseFloat(valorNf.replace(/\D/g, '').replace(/,/, '.') || '0');
    const vols = volumes.filter((v) => v.peso_kg > 0 || (v.altura_cm > 0 && v.largura_cm > 0 && v.comprimento_cm > 0));
    if (vols.length === 0) {
      alert('Informe ao menos um volume com peso ou dimensões.');
      return;
    }
    if (pesoTarifavel <= 0) {
      alert('Peso tarifável deve ser maior que zero.');
      return;
    }
    if (!origemUf || !origemCidade || !destinoUf || !destinoCidade) {
      alert('Selecione origem e destino (UF e cidade).');
      return;
    }
    onCalculate({
      origem_uf: origemUf,
      origem_cidade: origemCidade,
      destino_uf: destinoUf,
      destino_cidade: destinoCidade,
      tipo_carga: tipoCarga,
      valor_nf: valor,
      volumes: vols,
      servico_ar: servicoAr,
      servico_mao_propria: servicoMaoPropria,
      servico_coleta: servicoColeta,
      servico_entrega: servicoEntrega,
      servico_seguro: servicoSeguro,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">Origem</span>
          <div className="flex gap-2">
            <label className="flex-1 min-w-0">
              <span className="sr-only">UF origem</span>
              <select
                value={origemUf}
                onChange={(e) => {
                  setOrigemUf(e.target.value);
                  setOrigemCidade('');
                }}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">UF</option>
                {ufs.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </label>
            <label className="flex-[2] min-w-0">
              <span className="sr-only">Cidade origem</span>
              <select
                value={origemCidade}
                onChange={(e) => setOrigemCidade(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                disabled={!origemUf}
              >
                <option value="">Cidade</option>
                {origemCidades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div>
          <span className="block text-sm font-medium text-slate-700 mb-2">Destino</span>
          <div className="flex gap-2">
            <label className="flex-1 min-w-0">
              <span className="sr-only">UF destino</span>
              <select
                value={destinoUf}
                onChange={(e) => {
                  setDestinoUf(e.target.value);
                  setDestinoCidade('');
                }}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">UF</option>
                {ufs.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </label>
            <label className="flex-[2] min-w-0">
              <span className="sr-only">Cidade destino</span>
              <select
                value={destinoCidade}
                onChange={(e) => setDestinoCidade(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                disabled={!destinoUf}
              >
                <option value="">Cidade</option>
                {destinoCidades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
      {pracas.length === 0 && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
          Nenhuma praça cadastrada. Cadastre CEP/praças na tabela <code className="text-xs">cep_pracas</code> para exibir origem e destino.
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label>
          <span className="block text-sm font-medium text-slate-700 mb-1">Tipo de carga</span>
          <select
            value={tipoCarga}
            onChange={(e) => setTipoCarga(e.target.value)}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          >
            {TIPOS_CARGA.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="block text-sm font-medium text-slate-700 mb-1">Valor da NF (R$)</span>
          <input
            type="text"
            placeholder="0,00"
            value={valorNf}
            onChange={(e) => setValorNf(e.target.value.replace(/\D/g, '').replace(/(\d+)(\d{2})$/, '$1,$2'))}
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
      </div>

      <VolumeRepeater
        volumes={volumes}
        onChange={setVolumes}
        pesoRealTotal={pesoReal}
        pesoCubadoTotal={pesoCubado}
        pesoTarifavel={pesoTarifavel}
      />

      <div>
        <span className="block text-sm font-medium text-slate-700 mb-2">Serviços</span>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={servicoAr} onChange={(e) => setServicoAr(e.target.checked)} />
            Aviso de Recebimento (AR)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={servicoMaoPropria} onChange={(e) => setServicoMaoPropria(e.target.checked)} />
            Mão própria
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={servicoColeta} onChange={(e) => setServicoColeta(e.target.checked)} />
            Coleta
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={servicoEntrega} onChange={(e) => setServicoEntrega(e.target.checked)} />
            Entrega
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={servicoSeguro} onChange={(e) => setServicoSeguro(e.target.checked)} />
            Seguro
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || pracas.length === 0}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Calculando...' : 'Cotação instantânea'}
      </button>
    </form>
  );
}
