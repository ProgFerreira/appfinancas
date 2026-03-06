'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { CotacaoParceiro, CotacaoPriceTable, CotacaoPriceTableRange, CotacaoPartnerFees, CotacaoPartnerTE } from '@/types';
import { CoverageEditor } from './CoverageEditor';

const TIPOS = ['RODOVIARIO', 'AEREO', 'AMBOS'] as const;
const TABS = ['dados', 'cobertura', 'tabelas', 'taxas'] as const;
type TabId = (typeof TABS)[number];

type FracaoRow = { fracao_kg: number; minimo_fixo: number; peso_franquia_kg: number; excedente_por_fracao: number };
type FaixaPesoRow = { peso_inicial_kg: number; peso_final_kg: number; tarifa_minima: number; peso_franquia_kg: number; peso_excedente: number };
type FaixaFreteRow = { frete_inicial: number; frete_final: number; tarifa_minima: number; frete_franquia: number; frete_excedente: number };
type FaixaNFRow = { valor_inicial: number; valor_final: number; minimo_fixo: number; franquia_desconto: number; nf_excedente: number };
type FaixaPesoNFRow = { peso_inicial_kg: number; peso_final_kg: number; minimo_fixo: number; peso_franquia_kg: number; nf_excedente: number };
type FaixaDespachoNFRow = { valor_inicial: number; valor_final: number; tarifa_minima: number; franquia_desconto: number; nf_excedente: number };
type FeeRangesState = {
  peso_fracao: FracaoRow | null;
  peso_faixas: FaixaPesoRow[];
  pedagio_faixas: FaixaPesoRow[];
  pedagio_fracao: FracaoRow | null;
  trt_faixas: FaixaFreteRow[];
  tas_faixas: FaixaPesoRow[];
  tde_faixas: FaixaFreteRow[];
  tde_peso_faixas: FaixaPesoRow[];
  advalorem_nf_faixas: FaixaNFRow[];
  advalorem_peso_faixas: FaixaPesoNFRow[];
  advalorem_carga_faixas: FaixaNFRow[];
  gris_nf_faixas: FaixaNFRow[];
  gris_peso_faixas: FaixaPesoNFRow[];
  despacho_faixas: FaixaPesoRow[];
  despacho_nf_faixas: FaixaDespachoNFRow[];
};
function emptyFracao(): FracaoRow {
  return { fracao_kg: 0, minimo_fixo: 0, peso_franquia_kg: 0, excedente_por_fracao: 0 };
}
function emptyFaixaPeso(): FaixaPesoRow {
  return { peso_inicial_kg: 0, peso_final_kg: 0, tarifa_minima: 0, peso_franquia_kg: 0, peso_excedente: 0 };
}
function emptyFaixaFrete(): FaixaFreteRow {
  return { frete_inicial: 0, frete_final: 0, tarifa_minima: 0, frete_franquia: 0, frete_excedente: 0 };
}

function emptyFaixaNF(): FaixaNFRow {
  return { valor_inicial: 0.01, valor_final: 999999999.99, minimo_fixo: 0, franquia_desconto: 0, nf_excedente: 0 };
}
function emptyFaixaPesoNF(): FaixaPesoNFRow {
  return { peso_inicial_kg: 0, peso_final_kg: 0, minimo_fixo: 0, peso_franquia_kg: 0, nf_excedente: 0 };
}
function emptyFaixaDespachoNF(): FaixaDespachoNFRow {
  return { valor_inicial: 0.01, valor_final: 999999999.99, tarifa_minima: 0, franquia_desconto: 0, nf_excedente: 0 };
}
function emptyFeeRangesState(): FeeRangesState {
  return {
    peso_fracao: null,
    peso_faixas: [],
    pedagio_faixas: [],
    pedagio_fracao: null,
    trt_faixas: [],
    tas_faixas: [],
    tde_faixas: [],
    tde_peso_faixas: [],
    advalorem_nf_faixas: [],
    advalorem_peso_faixas: [],
    advalorem_carga_faixas: [],
    gris_nf_faixas: [],
    gris_peso_faixas: [],
    despacho_faixas: [],
    despacho_nf_faixas: [],
  };
}

type FaixaPesoKeyUI = 'peso_faixas' | 'pedagio_faixas' | 'tas_faixas' | 'tde_peso_faixas' | 'despacho_faixas';
type FaixaNFKeyUI = 'advalorem_nf_faixas' | 'advalorem_carga_faixas' | 'gris_nf_faixas';
type FaixaPesoNFKeyUI = 'advalorem_peso_faixas' | 'gris_peso_faixas';

function FeeRangesSections({
  feeRanges,
  onUpdatePesoFracao,
  onUpdateFaixaPeso,
  onUpdateFaixaFrete,
  onAddFaixaPeso,
  onAddFaixaFrete,
  onRemoveFaixaPeso,
  onRemoveFaixaFrete,
  onUpdateFaixaNF,
  onAddFaixaNF,
  onRemoveFaixaNF,
  onUpdateFaixaPesoNF,
  onAddFaixaPesoNF,
  onRemoveFaixaPesoNF,
  onUpdateFaixaDespachoNF,
  onAddFaixaDespachoNF,
  onRemoveFaixaDespachoNF,
  onInitPesoFracao,
  onInitPedagioFracao,
  onSave,
  saving,
}: {
  feeRanges: FeeRangesState;
  onUpdatePesoFracao: (field: keyof FracaoRow, value: number, which: 'peso_fracao' | 'pedagio_fracao') => void;
  onUpdateFaixaPeso: (idx: number, field: keyof FaixaPesoRow, value: number, key: FaixaPesoKeyUI) => void;
  onUpdateFaixaFrete: (idx: number, field: keyof FaixaFreteRow, value: number, key: 'trt_faixas' | 'tde_faixas') => void;
  onAddFaixaPeso: (key: FaixaPesoKeyUI) => void;
  onAddFaixaFrete: (key: 'trt_faixas' | 'tde_faixas') => void;
  onRemoveFaixaPeso: (key: FaixaPesoKeyUI, idx: number) => void;
  onRemoveFaixaFrete: (key: 'trt_faixas' | 'tde_faixas', idx: number) => void;
  onUpdateFaixaNF: (idx: number, field: keyof FaixaNFRow, value: number, key: FaixaNFKeyUI) => void;
  onAddFaixaNF: (key: FaixaNFKeyUI) => void;
  onRemoveFaixaNF: (key: FaixaNFKeyUI, idx: number) => void;
  onUpdateFaixaPesoNF: (idx: number, field: keyof FaixaPesoNFRow, value: number, key: FaixaPesoNFKeyUI) => void;
  onAddFaixaPesoNF: (key: FaixaPesoNFKeyUI) => void;
  onRemoveFaixaPesoNF: (key: FaixaPesoNFKeyUI, idx: number) => void;
  onUpdateFaixaDespachoNF: (idx: number, field: keyof FaixaDespachoNFRow, value: number) => void;
  onAddFaixaDespachoNF: () => void;
  onRemoveFaixaDespachoNF: (idx: number) => void;
  onInitPesoFracao: () => void;
  onInitPedagioFracao: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const fracaoFields: [keyof FracaoRow, string][] = [
    ['fracao_kg', 'Fração (kg)'],
    ['minimo_fixo', 'R$ Mínimo/Fixo'],
    ['peso_franquia_kg', 'Peso franquia (kg)'],
    ['excedente_por_fracao', 'Excedente por Fração'],
  ];
  const renderFracao = (which: 'peso_fracao' | 'pedagio_fracao', title: string, init: () => void) => {
    const row = which === 'peso_fracao' ? feeRanges.peso_fracao : feeRanges.pedagio_fracao;
    if (row == null) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">{title}</span>
          <button type="button" onClick={init} className="px-2 py-1 bg-slate-200 rounded text-xs hover:bg-slate-300">Adicionar</button>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <h5 className="text-sm font-medium text-slate-700">{title}</h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {fracaoFields.map(([field, label]) => (
            <label key={field}>
              <span className="block text-xs text-slate-500">{label}</span>
              <input type="number" step={0.01} value={row[field]} onChange={(e) => onUpdatePesoFracao(field, Number(e.target.value) || 0, which)} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
            </label>
          ))}
        </div>
      </div>
    );
  };
  const renderFaixaPesoTable = (key: FaixaPesoKeyUI, title: string) => {
    const rows = feeRanges[key];
    const cols: [keyof FaixaPesoRow, string][] = [
      ['peso_inicial_kg', 'Peso inicial'],
      ['peso_final_kg', 'Peso final'],
      ['tarifa_minima', 'Tarifa mínima'],
      ['peso_franquia_kg', 'Peso franquia'],
      ['peso_excedente', 'Peso excedente'],
    ];
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h5 className="text-sm font-medium text-slate-700">{title}</h5>
          <button type="button" onClick={() => onAddFaixaPeso(key)} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">+ Faixa</button>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhuma faixa. Clique em + Faixa.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-600">
                  {cols.map(([, l]) => <th key={l} className="text-left py-1 pr-2">{l}</th>)}
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    {cols.map(([field]) => (
                      <td key={field} className="py-1 pr-2">
                        <input type="number" step={0.01} value={r[field]} onChange={(e) => onUpdateFaixaPeso(idx, field, Number(e.target.value) || 0, key)} className="w-full min-w-[4rem] rounded border border-slate-300 px-1.5 py-0.5" />
                      </td>
                    ))}
                    <td><button type="button" onClick={() => onRemoveFaixaPeso(key, idx)} className="text-red-600 hover:underline">Remover</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  const renderFaixaFreteTable = (key: 'trt_faixas' | 'tde_faixas', title: string) => {
    const rows = feeRanges[key];
    const cols: [keyof FaixaFreteRow, string][] = [
      ['frete_inicial', 'Frete inicial'],
      ['frete_final', 'Frete final'],
      ['tarifa_minima', 'Tarifa mínima'],
      ['frete_franquia', 'Frete franquia'],
      ['frete_excedente', 'Frete excedente'],
    ];
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h5 className="text-sm font-medium text-slate-700">{title}</h5>
          <button type="button" onClick={() => onAddFaixaFrete(key)} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">+ Faixa</button>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhuma faixa. Clique em + Faixa.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-600">
                  {cols.map(([, l]) => <th key={l} className="text-left py-1 pr-2">{l}</th>)}
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    {cols.map(([field]) => (
                      <td key={field} className="py-1 pr-2">
                        <input type="number" step={0.01} value={r[field]} onChange={(e) => onUpdateFaixaFrete(idx, field, Number(e.target.value) || 0, key)} className="w-full min-w-[4rem] rounded border border-slate-300 px-1.5 py-0.5" />
                      </td>
                    ))}
                    <td><button type="button" onClick={() => onRemoveFaixaFrete(key, idx)} className="text-red-600 hover:underline">Remover</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  const nfCols: [keyof FaixaNFRow, string][] = [
    ['valor_inicial', 'Quantidade NF inicial'],
    ['valor_final', 'Quantidade NF final'],
    ['minimo_fixo', 'R$ Mínimo/Fixo'],
    ['franquia_desconto', 'Franquia/desconto'],
    ['nf_excedente', 'NF excedente'],
  ];
  const renderFaixaNFTable = (key: FaixaNFKeyUI, title: string) => {
    const rows = feeRanges[key];
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h5 className="text-sm font-medium text-slate-700">{title}</h5>
          <button type="button" onClick={() => onAddFaixaNF(key)} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">+ Faixa</button>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhuma faixa. Clique em + Faixa.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-600">
                  {nfCols.map(([, l]) => <th key={l} className="text-left py-1 pr-2">{l}</th>)}
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    {nfCols.map(([field]) => (
                      <td key={field} className="py-1 pr-2">
                        <input type="number" step={0.01} value={r[field]} onChange={(e) => onUpdateFaixaNF(idx, field, Number(e.target.value) || 0, key)} className="w-full min-w-[4rem] rounded border border-slate-300 px-1.5 py-0.5" />
                      </td>
                    ))}
                    <td><button type="button" onClick={() => onRemoveFaixaNF(key, idx)} className="text-red-600 hover:underline">Remover</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  const pesoNFCols: [keyof FaixaPesoNFRow, string][] = [
    ['peso_inicial_kg', 'Peso inicial'],
    ['peso_final_kg', 'Peso final'],
    ['minimo_fixo', 'R$ Mínimo/Fixo'],
    ['peso_franquia_kg', 'Peso franquia'],
    ['nf_excedente', 'NF excedente'],
  ];
  const renderFaixaPesoNFTable = (key: FaixaPesoNFKeyUI, title: string) => {
    const rows = feeRanges[key];
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h5 className="text-sm font-medium text-slate-700">{title}</h5>
          <button type="button" onClick={() => onAddFaixaPesoNF(key)} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">+ Faixa</button>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhuma faixa. Clique em + Faixa.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-600">
                  {pesoNFCols.map(([, l]) => <th key={l} className="text-left py-1 pr-2">{l}</th>)}
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    {pesoNFCols.map(([field]) => (
                      <td key={field} className="py-1 pr-2">
                        <input type="number" step={0.01} value={r[field]} onChange={(e) => onUpdateFaixaPesoNF(idx, field, Number(e.target.value) || 0, key)} className="w-full min-w-[4rem] rounded border border-slate-300 px-1.5 py-0.5" />
                      </td>
                    ))}
                    <td><button type="button" onClick={() => onRemoveFaixaPesoNF(key, idx)} className="text-red-600 hover:underline">Remover</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };
  const despachoNFCols: [keyof FaixaDespachoNFRow, string][] = [
    ['valor_inicial', 'Quantidade NF inicial'],
    ['valor_final', 'Quantidade NF final'],
    ['tarifa_minima', 'Tarifa mínima'],
    ['franquia_desconto', 'Franquia/desconto'],
    ['nf_excedente', 'NF excedente'],
  ];
  const renderFaixaDespachoNFTable = (title: string) => {
    const rows = feeRanges.despacho_nf_faixas;
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h5 className="text-sm font-medium text-slate-700">{title}</h5>
          <button type="button" onClick={onAddFaixaDespachoNF} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">+ Faixa</button>
        </div>
        {rows.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhuma faixa. Clique em + Faixa.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-600">
                  {despachoNFCols.map(([, l]) => <th key={l} className="text-left py-1 pr-2">{l}</th>)}
                  <th className="w-16" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} className="border-t border-slate-100">
                    {despachoNFCols.map(([field]) => (
                      <td key={field} className="py-1 pr-2">
                        <input type="number" step={0.01} value={r[field]} onChange={(e) => onUpdateFaixaDespachoNF(idx, field, Number(e.target.value) || 0)} className="w-full min-w-[4rem] rounded border border-slate-300 px-1.5 py-0.5" />
                      </td>
                    ))}
                    <td><button type="button" onClick={() => onRemoveFaixaDespachoNF(idx)} className="text-red-600 hover:underline">Remover</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h4 className="text-base font-semibold text-slate-800">Taxas por faixa e fração</h4>
      <section className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
        {renderFaixaPesoTable('peso_faixas', '8. Faixas de peso')}
      </section>
      <section className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
        {renderFaixaNFTable('advalorem_nf_faixas', '4. Advalorem (por valor NF)')}
      </section>
      <section className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
        {renderFaixaPesoNFTable('advalorem_peso_faixas', '4.1 Advalorem por Faixa de Peso')}
      </section>
      <section className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
        {renderFaixaNFTable('advalorem_carga_faixas', '4.2 Advalorem Carga/Valor')}
      </section>
      <section className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
        {renderFaixaNFTable('gris_nf_faixas', '5. GRIS por Valor NF')}
      </section>
      <section className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
        {renderFaixaPesoNFTable('gris_peso_faixas', '5.1 GRIS por Faixa de Peso')}
      </section>
      <section className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
        {renderFaixaPesoTable('despacho_faixas', '6. Despacho (por faixa de peso)')}
      </section>
      <section className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
        {renderFaixaDespachoNFTable('6.1 Despacho por faixa de valor de nota')}
      </section>
      <section className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
        {renderFaixaPesoTable('pedagio_faixas', '11. Pedágio (por faixa de peso)')}
      </section>
      <section className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
        {renderFracao('pedagio_fracao', '11.1 Pedágio por Fração', onInitPedagioFracao)}
      </section>
      <section className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
        {renderFaixaFreteTable('trt_faixas', '21. Taxa TRT (por faixa de valor de frete)')}
      </section>
      <section className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
        {renderFaixaPesoTable('tas_faixas', '22. Taxa TAS (por faixa de peso)')}
      </section>
      <section className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
        {renderFaixaFreteTable('tde_faixas', '24. Taxa TDE (por faixa de valor de frete)')}
      </section>
      <section className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
        {renderFaixaPesoTable('tde_peso_faixas', '24.1 Taxa TDE por Peso (por faixa de peso)')}
      </section>
      <button type="button" onClick={onSave} disabled={saving} className="px-4 py-2 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
        {saving ? 'Salvando...' : 'Salvar taxas por faixa/fração'}
      </button>
    </div>
  );
}

export default function ParceirosUnified() {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get('id');
  const tabFromUrl = searchParams.get('tab') as TabId | null;
  const novoFromUrl = searchParams.get('novo') === '1';

  const [partners, setPartners] = useState<CotacaoParceiro[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(() => (idFromUrl ? parseInt(idFromUrl, 10) : null));
  const [tab, setTab] = useState<TabId>(tabFromUrl && TABS.includes(tabFromUrl) ? tabFromUrl : 'dados');
  const [isNew, setIsNew] = useState(novoFromUrl);

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<string>(TIPOS[0]);
  const [cnpj, setCnpj] = useState('');
  const [contato, setContato] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [ativo, setAtivo] = useState(1);
  const [observacoes, setObservacoes] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [priceTables, setPriceTables] = useState<CotacaoPriceTable[]>([]);
  const [expandedTableId, setExpandedTableId] = useState<number | null>(null);
  const [fees, setFees] = useState<Partial<CotacaoPartnerFees> | null>(null);
  const [feesSaving, setFeesSaving] = useState(false);
  const [feesError, setFeesError] = useState<string | null>(null);
  const [feeRanges, setFeeRanges] = useState<FeeRangesState | null>(null);
  const [feeRangesSaving, setFeeRangesSaving] = useState(false);
  const [teList, setTeList] = useState<CotacaoPartnerTE[]>([]);
  const [teSaving, setTeSaving] = useState(false);

  const loadPartners = useCallback(() => {
    fetch('/api/partners')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setPartners(data.data);
      });
  }, []);

  useEffect(() => { loadPartners(); }, [loadPartners]);

  useEffect(() => {
    if (novoFromUrl) {
      setSelectedId(null);
      setIsNew(true);
    } else if (idFromUrl) {
      const n = parseInt(idFromUrl, 10);
      if (!Number.isNaN(n)) {
        setSelectedId(n);
        setIsNew(false);
      }
    }
  }, [idFromUrl, novoFromUrl]);

  useEffect(() => {
    if (!selectedId || selectedId < 1) {
      setIsNew(false);
      setNome('');
      setTipo(TIPOS[0]);
      setCnpj('');
      setContato('');
      setEmail('');
      setTelefone('');
      setAtivo(1);
      setObservacoes('');
      setPriceTables([]);
      setFees(null);
      setFeeRanges(null);
      setTeList([]);
      setExpandedTableId(null);
      return;
    }
    setIsNew(false);
    fetch(`/api/partners/${selectedId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const p = data.data;
          setNome(p.nome ?? '');
          setTipo(p.tipo ?? TIPOS[0]);
          setCnpj(p.cnpj ?? '');
          setContato(p.contato ?? '');
          setEmail(p.email ?? '');
          setTelefone(p.telefone ?? '');
          setAtivo(p.ativo ?? 1);
          setObservacoes(p.observacoes ?? '');
        }
      });
    fetch(`/api/price-tables?partner_id=${selectedId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setPriceTables(data.data);
        else setPriceTables([]);
      });
    fetch(`/api/partner-fees?partner_id=${selectedId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setFees(data.data || {});
        else setFees({});
      });
    fetch(`/api/partners/${selectedId}/te`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) setTeList(data.data);
        else setTeList([]);
      })
      .catch(() => setTeList([]));
    fetch(`/api/partners/${selectedId}/fee-ranges`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const d = data.data as FeeRangesState;
          setFeeRanges({
            peso_fracao: d.peso_fracao ?? null,
            peso_faixas: Array.isArray(d.peso_faixas) ? d.peso_faixas : [],
            pedagio_faixas: Array.isArray(d.pedagio_faixas) ? d.pedagio_faixas : [],
            pedagio_fracao: d.pedagio_fracao ?? null,
            trt_faixas: Array.isArray(d.trt_faixas) ? d.trt_faixas : [],
            tas_faixas: Array.isArray(d.tas_faixas) ? d.tas_faixas : [],
            tde_faixas: Array.isArray(d.tde_faixas) ? d.tde_faixas : [],
            tde_peso_faixas: Array.isArray(d.tde_peso_faixas) ? d.tde_peso_faixas : [],
            advalorem_nf_faixas: Array.isArray(d.advalorem_nf_faixas) ? d.advalorem_nf_faixas : [],
            advalorem_peso_faixas: Array.isArray(d.advalorem_peso_faixas) ? d.advalorem_peso_faixas : [],
            advalorem_carga_faixas: Array.isArray(d.advalorem_carga_faixas) ? d.advalorem_carga_faixas : [],
            gris_nf_faixas: Array.isArray(d.gris_nf_faixas) ? d.gris_nf_faixas : [],
            gris_peso_faixas: Array.isArray(d.gris_peso_faixas) ? d.gris_peso_faixas : [],
            despacho_faixas: Array.isArray(d.despacho_faixas) ? d.despacho_faixas : [],
            despacho_nf_faixas: Array.isArray(d.despacho_nf_faixas) ? d.despacho_nf_faixas : [],
          });
        } else {
          setFeeRanges(emptyFeeRangesState());
        }
      })
      .catch(() => setFeeRanges(emptyFeeRangesState()));
  }, [selectedId]);

  const handleSelectPartner = (value: string) => {
    if (value === '__novo__') {
      setSelectedId(null);
      setIsNew(true);
      setNome('');
      setTipo(TIPOS[0]);
      setCnpj('');
      setContato('');
      setEmail('');
      setTelefone('');
      setAtivo(1);
      setObservacoes('');
      setTab('dados');
    } else {
      const n = parseInt(value, 10);
      setSelectedId(Number.isNaN(n) ? null : n);
      setIsNew(false);
    }
  };

  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    if (!nome.trim()) {
      setSaveError('Nome é obrigatório.');
      return;
    }
    setSaving(true);
    const body = {
      nome: nome.trim(),
      tipo,
      cnpj: cnpj.trim() || null,
      contato: contato.trim() || null,
      email: email.trim() || null,
      telefone: telefone.trim() || null,
      ativo,
      observacoes: observacoes.trim() || null,
    };
    const url = selectedId ? `/api/partners/${selectedId}` : '/api/partners';
    const method = selectedId ? 'PUT' : 'POST';
    fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (!selectedId && data.data?.id) {
            setSelectedId(data.data.id);
            loadPartners();
          }
          setIsNew(false);
          setSaveError(null);
        } else setSaveError(data.error || 'Erro ao salvar');
      })
      .catch(() => setSaveError('Erro de conexão'))
      .finally(() => setSaving(false));
  };

  const handleSaveFees = () => {
    if (!selectedId) return;
    setFeesSaving(true);
    setFeesError(null);
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
        lib_suframa: fees?.lib_suframa ?? 0,
        minimo_trecho: fees?.minimo_trecho ?? 0,
        tde_geral: fees?.tde_geral ?? 0,
        reentrega_percent: fees?.reentrega_percent ?? 0,
        reentrega_taxa_fixa: fees?.reentrega_taxa_fixa ?? 0,
        reentrega_minima: fees?.reentrega_minima ?? 0,
        reentrega_soma_icms: fees?.reentrega_soma_icms ?? 0,
        devolucao_percent: fees?.devolucao_percent ?? 0,
        devolucao_taxa_fixa: fees?.devolucao_taxa_fixa ?? 0,
        devolucao_minima: fees?.devolucao_minima ?? 0,
        devolucao_soma_icms: fees?.devolucao_soma_icms ?? 0,
        margem_rodoviario: fees?.margem_rodoviario ?? 0,
        margem_aereo: fees?.margem_aereo ?? 0,
        margem_base_cte: fees?.margem_base_cte ?? 'frete_total',
        tarifa_aerea_minima: fees?.tarifa_aerea_minima ?? 0,
        tarifa_aerea_taxa_extra: fees?.tarifa_aerea_taxa_extra ?? 0,
        tarifa_aerea_tad: fees?.tarifa_aerea_tad ?? 0,
        tarifa_aerea_soma_minimo: fees?.tarifa_aerea_soma_minimo ?? 1,
        percentual_frete: fees?.percentual_frete ?? 0,
        percentual_pedagio_frete: fees?.percentual_pedagio_frete ?? 0,
        desconto_max_percent: fees?.desconto_max_percent ?? 0,
        acrescimo_max_percent: fees?.acrescimo_max_percent ?? 0,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setFeesError(null);
        else setFeesError(data.error || 'Erro ao salvar');
      })
      .catch(() => setFeesError('Erro de conexão'))
      .finally(() => setFeesSaving(false));
  };

  const handleSaveTE = async () => {
    if (!selectedId) return;
    setTeSaving(true);
    try {
      const res = await fetch(`/api/partners/${selectedId}/te`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teList.map((t) => ({ codigo: t.codigo, minima: t.minima, peso_franquia_kg: t.peso_franquia_kg, tarifa: t.tarifa, soma_ao_frete_peso: t.soma_ao_frete_peso }))),
      });
      const data = await res.json();
      if (data.success) {
        const r2 = await fetch(`/api/partners/${selectedId}/te`);
        const d2 = await r2.json();
        if (d2.success && Array.isArray(d2.data)) setTeList(d2.data);
      }
    } finally {
      setTeSaving(false);
    }
  };

  const updateFee = (field: keyof CotacaoPartnerFees, value: number | string | null) => {
    setFees((prev) => (prev ? { ...prev, [field]: value ?? undefined } : { [field]: value ?? undefined }));
  };

  const handleSaveFeeRanges = () => {
    if (!selectedId || !feeRanges) return;
    setFeeRangesSaving(true);
    fetch(`/api/partners/${selectedId}/fee-ranges`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feeRanges),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) setFeesError(data.error || 'Erro ao salvar taxas por faixa.');
      })
      .finally(() => setFeeRangesSaving(false));
  };

  const updatePesoFracao = (field: keyof FracaoRow, value: number, which: 'peso_fracao' | 'pedagio_fracao') => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      const current = which === 'peso_fracao' ? prev.peso_fracao : prev.pedagio_fracao;
      const row = current ?? emptyFracao();
      const next = { ...row, [field]: value };
      return which === 'peso_fracao' ? { ...prev, peso_fracao: next } : { ...prev, pedagio_fracao: next };
    });
  };
  type FaixaPesoKey = 'peso_faixas' | 'pedagio_faixas' | 'tas_faixas' | 'tde_peso_faixas' | 'despacho_faixas';
  const updateFaixaPeso = (idx: number, field: keyof FaixaPesoRow, value: number, key: FaixaPesoKey) => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      const arr = [...prev[key]];
      if (!arr[idx]) return prev;
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, [key]: arr };
    });
  };
  const updateFaixaFrete = (idx: number, field: keyof FaixaFreteRow, value: number, key: 'trt_faixas' | 'tde_faixas') => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      const arr = [...prev[key]];
      if (!arr[idx]) return prev;
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, [key]: arr };
    });
  };
  const addFaixaPeso = (key: FaixaPesoKey) => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      const arr = prev[key];
      const last = arr.length > 0 ? arr[arr.length - 1] : null;
      const newRow = emptyFaixaPeso();
      if (last) {
        newRow.peso_inicial_kg = last.peso_final_kg;
        newRow.peso_final_kg = last.peso_final_kg + 100;
      } else {
        newRow.peso_final_kg = 9999999999.99;
      }
      return { ...prev, [key]: [...arr, newRow] };
    });
  };
  const addFaixaFrete = (key: 'trt_faixas' | 'tde_faixas') => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      const arr = prev[key];
      const last = arr.length > 0 ? arr[arr.length - 1] : null;
      const newRow = emptyFaixaFrete();
      if (last) {
        newRow.frete_inicial = last.frete_final;
        newRow.frete_final = last.frete_final + 1000000;
      } else {
        newRow.frete_final = 999999999.99;
      }
      return { ...prev, [key]: [...arr, newRow] };
    });
  };
  const removeFaixaPeso = (key: FaixaPesoKey, idx: number) => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      const arr = prev[key].filter((_, i) => i !== idx);
      return { ...prev, [key]: arr };
    });
  };
  type FaixaNFKey = 'advalorem_nf_faixas' | 'advalorem_carga_faixas' | 'gris_nf_faixas';
  type FaixaPesoNFKey = 'advalorem_peso_faixas' | 'gris_peso_faixas';
  const updateFaixaNF = (idx: number, field: keyof FaixaNFRow, value: number, key: FaixaNFKey) => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      const arr = [...prev[key]];
      if (!arr[idx]) return prev;
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, [key]: arr };
    });
  };
  const addFaixaNF = (key: FaixaNFKey) => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      const arr = prev[key];
      const last = arr.length > 0 ? arr[arr.length - 1] : null;
      const newRow = emptyFaixaNF();
      if (last) {
        newRow.valor_inicial = last.valor_final;
        newRow.valor_final = last.valor_final + 1000000;
      }
      return { ...prev, [key]: [...arr, newRow] };
    });
  };
  const removeFaixaNF = (key: FaixaNFKey, idx: number) => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: prev[key].filter((_, i) => i !== idx) };
    });
  };
  const updateFaixaPesoNF = (idx: number, field: keyof FaixaPesoNFRow, value: number, key: FaixaPesoNFKey) => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      const arr = [...prev[key]];
      if (!arr[idx]) return prev;
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, [key]: arr };
    });
  };
  const addFaixaPesoNF = (key: FaixaPesoNFKey) => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: [...prev[key], emptyFaixaPesoNF()] };
    });
  };
  const removeFaixaPesoNF = (key: FaixaPesoNFKey, idx: number) => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: prev[key].filter((_, i) => i !== idx) };
    });
  };
  const updateFaixaDespachoNF = (idx: number, field: keyof FaixaDespachoNFRow, value: number) => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      const arr = [...prev.despacho_nf_faixas];
      if (!arr[idx]) return prev;
      arr[idx] = { ...arr[idx], [field]: value };
      return { ...prev, despacho_nf_faixas: arr };
    });
  };
  const addFaixaDespachoNF = () => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      return { ...prev, despacho_nf_faixas: [...prev.despacho_nf_faixas, emptyFaixaDespachoNF()] };
    });
  };
  const removeFaixaDespachoNF = (idx: number) => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      return { ...prev, despacho_nf_faixas: prev.despacho_nf_faixas.filter((_, i) => i !== idx) };
    });
  };
  const removeFaixaFrete = (key: 'trt_faixas' | 'tde_faixas', idx: number) => {
    setFeeRanges((prev) => {
      if (!prev) return prev;
      const arr = prev[key].filter((_, i) => i !== idx);
      return { ...prev, [key]: arr };
    });
  };
  const initPesoFracao = () => setFeeRanges((prev) => (prev && !prev.peso_fracao ? { ...prev, peso_fracao: emptyFracao() } : prev));
  const initPedagioFracao = () => setFeeRanges((prev) => (prev && !prev.pedagio_fracao ? { ...prev, pedagio_fracao: emptyFracao() } : prev));

  const loadPriceTables = useCallback(() => {
    if (!selectedId) return;
    fetch(`/api/price-tables?partner_id=${selectedId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setPriceTables(data.data);
      });
  }, [selectedId]);

  const showPanel = selectedId != null && selectedId > 0 || isNew;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">Parceiro:</span>
          <select
            value={isNew ? '__novo__' : (selectedId ?? '')}
            onChange={(e) => handleSelectPartner(e.target.value)}
            className="rounded border border-slate-300 px-3 py-2 text-sm min-w-[220px]"
          >
            <option value="">Selecione...</option>
            <option value="__novo__">➕ Novo parceiro</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </label>
      </div>

      {!showPanel && partners.length === 0 && (
        <p className="text-slate-500 text-sm">Nenhum parceiro cadastrado. Selecione &quot;Novo parceiro&quot; para criar.</p>
      )}

      {showPanel && (
        <>
          <div className="border-b border-slate-200">
            <nav className="flex gap-1" aria-label="Abas">
              {TABS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                    tab === t
                      ? 'bg-white border border-slate-200 border-b-0 text-indigo-600 -mb-px'
                      : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {t === 'dados' && 'Dados'}
                  {t === 'cobertura' && 'Cobertura'}
                  {t === 'tabelas' && 'Tabelas e faixas'}
                  {t === 'taxas' && 'Taxas'}
                </button>
              ))}
            </nav>
          </div>

          <div className="rounded-b-xl border border-t-0 border-slate-200 bg-white shadow-sm p-6">
            {tab === 'dados' && (
              <form onSubmit={handleSavePartner} className="max-w-2xl space-y-4">
                {saveError && <div className="p-3 rounded bg-red-50 text-red-800 text-sm">{saveError}</div>}
                <label>
                  <span className="block text-sm font-medium text-slate-700 mb-1">Nome *</span>
                  <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" required />
                </label>
                <label>
                  <span className="block text-sm font-medium text-slate-700 mb-1">Tipo</span>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label>
                    <span className="block text-sm font-medium text-slate-700 mb-1">CNPJ</span>
                    <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                  <label>
                    <span className="block text-sm font-medium text-slate-700 mb-1">Contato</span>
                    <input type="text" value={contato} onChange={(e) => setContato(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label>
                    <span className="block text-sm font-medium text-slate-700 mb-1">E-mail</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                  <label>
                    <span className="block text-sm font-medium text-slate-700 mb-1">Telefone</span>
                    <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
                  </label>
                </div>
                <label>
                  <span className="block text-sm font-medium text-slate-700 mb-1">Observações</span>
                  <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={ativo === 1} onChange={(e) => setAtivo(e.target.checked ? 1 : 0)} />
                  <span className="text-sm text-slate-700">Ativo</span>
                </label>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {saving ? 'Salvando...' : selectedId ? 'Atualizar' : 'Cadastrar'}
                </button>
              </form>
            )}

            {tab === 'cobertura' && selectedId != null && selectedId > 0 && (
              <CoverageEditor partnerId={selectedId} />
            )}
            {tab === 'cobertura' && (isNew || !selectedId) && (
              <p className="text-slate-500 text-sm">Salve o parceiro na aba Dados para cadastrar cobertura.</p>
            )}

            {tab === 'tabelas' && selectedId != null && selectedId > 0 && (
              <div className="space-y-8">
                <TabelasEFaixasTab
                  partnerId={selectedId}
                  priceTables={priceTables}
                  onReload={loadPriceTables}
                  expandedTableId={expandedTableId}
                  onToggleExpand={setExpandedTableId}
                />
                <hr className="border-slate-200" />
                {feeRanges === null ? (
                  <p className="text-sm text-slate-500">Carregando taxas por faixa/fração...</p>
                ) : (
                  <FeeRangesSections
                    feeRanges={feeRanges}
                    onUpdatePesoFracao={updatePesoFracao}
                    onUpdateFaixaPeso={updateFaixaPeso}
                    onUpdateFaixaFrete={updateFaixaFrete}
                    onAddFaixaPeso={addFaixaPeso}
                    onAddFaixaFrete={addFaixaFrete}
                    onRemoveFaixaPeso={removeFaixaPeso}
                    onRemoveFaixaFrete={removeFaixaFrete}
                    onUpdateFaixaNF={updateFaixaNF}
                    onAddFaixaNF={addFaixaNF}
                    onRemoveFaixaNF={removeFaixaNF}
                    onUpdateFaixaPesoNF={updateFaixaPesoNF}
                    onAddFaixaPesoNF={addFaixaPesoNF}
                    onRemoveFaixaPesoNF={removeFaixaPesoNF}
                    onUpdateFaixaDespachoNF={updateFaixaDespachoNF}
                    onAddFaixaDespachoNF={addFaixaDespachoNF}
                    onRemoveFaixaDespachoNF={removeFaixaDespachoNF}
                    onInitPesoFracao={initPesoFracao}
                    onInitPedagioFracao={initPedagioFracao}
                    onSave={handleSaveFeeRanges}
                    saving={feeRangesSaving}
                  />
                )}
              </div>
            )}
            {tab === 'tabelas' && (isNew || !selectedId) && (
              <p className="text-slate-500 text-sm">Salve o parceiro na aba Dados para cadastrar tabelas.</p>
            )}

            {tab === 'taxas' && selectedId != null && selectedId > 0 && (
              <div className="max-w-4xl space-y-6">
                {feesError && <div className="p-3 rounded bg-red-50 text-red-800 text-sm">{feesError}</div>}
                {fees && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {(
                        [
                          ['gris_percent', 'GRIS (%)'],
                          ['advalorem_percent', 'Ad Valorem (%)'],
                          ['pedagio_fixo', 'Pedágio (R$ fixo)'],
                          ['seguro_minimo', 'Seguro mínimo (R$)'],
                          ['seguro_percent', 'Seguro (%)'],
                          ['coleta_fixo', 'Coleta (R$)'],
                          ['entrega_fixo', 'Entrega (R$)'],
                        ] as const
                      ).map(([field, label]) => (
                        <label key={field}>
                          <span className="block text-sm text-slate-600 mb-0.5">{label}</span>
                          <input
                            type="number"
                            step={field.includes('percent') ? 0.0001 : 0.01}
                            value={fees[field] ?? ''}
                            onChange={(e) => updateFee(field as keyof CotacaoPartnerFees, e.target.value === '' ? null : Number(e.target.value))}
                            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
                          />
                        </label>
                      ))}
                    </div>
                    <hr className="border-slate-200" />
                    <h4 className="text-sm font-semibold text-slate-800">Taxas adicionais</h4>
                    <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-4">
                      <p className="text-xs text-slate-500 font-medium">Generalidades</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <label><span className="block text-xs text-slate-600">Lib SUFRAMA</span><input type="number" step={0.01} value={fees?.lib_suframa ?? ''} onChange={(e) => updateFee('lib_suframa', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                        <label><span className="block text-xs text-slate-600">Mínimo trecho</span><input type="number" step={0.01} value={fees?.minimo_trecho ?? ''} onChange={(e) => updateFee('minimo_trecho', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                        <label><span className="block text-xs text-slate-600">TDE</span><input type="number" step={0.01} value={fees?.tde_geral ?? ''} onChange={(e) => updateFee('tde_geral', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                      </div>
                      <p className="text-xs text-slate-500 font-medium pt-2">Reentrega</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <label><span className="block text-xs text-slate-600">% reentrega</span><input type="number" step={0.01} value={fees?.reentrega_percent ?? ''} onChange={(e) => updateFee('reentrega_percent', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                        <label><span className="block text-xs text-slate-600">Taxa fixa</span><input type="number" step={0.01} value={fees?.reentrega_taxa_fixa ?? ''} onChange={(e) => updateFee('reentrega_taxa_fixa', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                        <label><span className="block text-xs text-slate-600">Mínima</span><input type="number" step={0.01} value={fees?.reentrega_minima ?? ''} onChange={(e) => updateFee('reentrega_minima', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                        <label><span className="block text-xs text-slate-600">Soma ICMS</span><select value={fees?.reentrega_soma_icms ? 'SIM' : 'NAO'} onChange={(e) => updateFee('reentrega_soma_icms', e.target.value === 'SIM' ? 1 : 0)} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"><option value="NAO">NÃO</option><option value="SIM">SIM</option></select></label>
                      </div>
                      <p className="text-xs text-slate-500 font-medium pt-2">Devolução</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <label><span className="block text-xs text-slate-600">% devolução</span><input type="number" step={0.01} value={fees?.devolucao_percent ?? ''} onChange={(e) => updateFee('devolucao_percent', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                        <label><span className="block text-xs text-slate-600">Taxa fixa</span><input type="number" step={0.01} value={fees?.devolucao_taxa_fixa ?? ''} onChange={(e) => updateFee('devolucao_taxa_fixa', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                        <label><span className="block text-xs text-slate-600">Mínima</span><input type="number" step={0.01} value={fees?.devolucao_minima ?? ''} onChange={(e) => updateFee('devolucao_minima', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                        <label><span className="block text-xs text-slate-600">Soma ICMS</span><select value={fees?.devolucao_soma_icms ? 'SIM' : 'NAO'} onChange={(e) => updateFee('devolucao_soma_icms', e.target.value === 'SIM' ? 1 : 0)} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"><option value="NAO">NÃO</option><option value="SIM">SIM</option></select></label>
                      </div>
                      <p className="text-xs text-slate-500 font-medium pt-2">Margem sobre o total do frete</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <label><span className="block text-xs text-slate-600">Rodoviário</span><input type="number" step={0.01} value={fees?.margem_rodoviario ?? ''} onChange={(e) => updateFee('margem_rodoviario', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                        <label><span className="block text-xs text-slate-600">Aéreo</span><input type="number" step={0.01} value={fees?.margem_aereo ?? ''} onChange={(e) => updateFee('margem_aereo', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                        <label><span className="block text-xs text-slate-600">Base % sobre CTE</span><select value={fees?.margem_base_cte ?? 'frete_total'} onChange={(e) => updateFee('margem_base_cte', e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"><option value="frete_total">Frete total</option></select></label>
                      </div>
                      <p className="text-xs text-slate-500 font-medium pt-2">Tarifa aérea mínima</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <label><span className="block text-xs text-slate-600">Tarifa mínima</span><input type="number" step={0.01} value={fees?.tarifa_aerea_minima ?? ''} onChange={(e) => updateFee('tarifa_aerea_minima', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                        <label><span className="block text-xs text-slate-600">Taxa Extra</span><input type="number" step={0.01} value={fees?.tarifa_aerea_taxa_extra ?? ''} onChange={(e) => updateFee('tarifa_aerea_taxa_extra', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                        <label><span className="block text-xs text-slate-600">TAD</span><input type="number" step={0.01} value={fees?.tarifa_aerea_tad ?? ''} onChange={(e) => updateFee('tarifa_aerea_tad', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                        <label><span className="block text-xs text-slate-600">Soma Mínimo</span><select value={fees?.tarifa_aerea_soma_minimo ? 'SIM' : 'NAO'} onChange={(e) => updateFee('tarifa_aerea_soma_minimo', e.target.value === 'SIM' ? 1 : 0)} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"><option value="NAO">NÃO</option><option value="SIM">SIM</option></select></label>
                      </div>
                      <p className="text-xs text-slate-500 font-medium pt-2">Percentuais</p>
                      <div className="grid grid-cols-2 gap-3">
                        <label><span className="block text-xs text-slate-600">Percentual de Frete</span><input type="number" step={0.01} value={fees?.percentual_frete ?? ''} onChange={(e) => updateFee('percentual_frete', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                        <label><span className="block text-xs text-slate-600">% pedágio sobre frete</span><input type="number" step={0.01} value={fees?.percentual_pedagio_frete ?? ''} onChange={(e) => updateFee('percentual_pedagio_frete', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                      </div>
                      <p className="text-xs text-slate-500 font-medium pt-2">Desconto/acréscimo</p>
                      <div className="grid grid-cols-2 gap-3">
                        <label><span className="block text-xs text-slate-600">Desconto máximo (%)</span><input type="number" step={0.01} value={fees?.desconto_max_percent ?? ''} onChange={(e) => updateFee('desconto_max_percent', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                        <label><span className="block text-xs text-slate-600">Acréscimo máximo (%)</span><input type="number" step={0.01} value={fees?.acrescimo_max_percent ?? ''} onChange={(e) => updateFee('acrescimo_max_percent', e.target.value === '' ? null : Number(e.target.value))} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" /></label>
                      </div>
                    </div>
                    <button type="button" onClick={handleSaveFees} disabled={feesSaving} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                      {feesSaving ? 'Salvando...' : 'Salvar taxas'}
                    </button>

                    <hr className="border-slate-200" />
                    <h4 className="text-sm font-semibold text-slate-800">Tarifas específicas - TE</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="text-slate-600"><th className="text-left py-1 pr-2">Código</th><th className="text-left py-1 pr-2">Mínima</th><th className="text-left py-1 pr-2">Peso Franquia</th><th className="text-left py-1 pr-2">Tarifa</th><th className="text-left py-1 pr-2">Soma ao Frete Peso</th><th className="w-16" /></tr></thead>
                        <tbody>
                          {teList.map((te, idx) => (
                            <tr key={te.id ?? idx} className="border-t border-slate-100">
                              <td className="py-1 pr-2"><input type="text" value={te.codigo ?? ''} onChange={(e) => setTeList(prev => { const n = [...prev]; n[idx] = { ...n[idx], codigo: e.target.value }; return n; })} className="w-24 rounded border border-slate-300 px-2 py-1 text-sm" /></td>
                              <td className="py-1 pr-2"><input type="number" step={0.01} value={te.minima} onChange={(e) => setTeList(prev => { const n = [...prev]; n[idx] = { ...n[idx], minima: Number(e.target.value) || 0 }; return n; })} className="w-20 rounded border border-slate-300 px-2 py-1 text-sm" /></td>
                              <td className="py-1 pr-2"><input type="number" step={0.001} value={te.peso_franquia_kg} onChange={(e) => setTeList(prev => { const n = [...prev]; n[idx] = { ...n[idx], peso_franquia_kg: Number(e.target.value) || 0 }; return n; })} className="w-20 rounded border border-slate-300 px-2 py-1 text-sm" /></td>
                              <td className="py-1 pr-2"><input type="number" step={0.01} value={te.tarifa} onChange={(e) => setTeList(prev => { const n = [...prev]; n[idx] = { ...n[idx], tarifa: Number(e.target.value) || 0 }; return n; })} className="w-20 rounded border border-slate-300 px-2 py-1 text-sm" /></td>
                              <td className="py-1 pr-2"><select value={te.soma_ao_frete_peso ? 'SIM' : 'NAO'} onChange={(e) => setTeList(prev => { const n = [...prev]; n[idx] = { ...n[idx], soma_ao_frete_peso: e.target.value === 'SIM' ? 1 : 0 }; return n; })} className="rounded border border-slate-300 px-2 py-1 text-sm"><option value="NAO">NÃO</option><option value="SIM">SIM</option></select></td>
                              <td><button type="button" onClick={() => setTeList(prev => prev.filter((_, i) => i !== idx))} className="text-red-600 hover:underline text-xs">Remover</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setTeList(prev => [...prev, { id: 0, partner_id: selectedId, codigo: null, minima: 0, peso_franquia_kg: 0, tarifa: 0, soma_ao_frete_peso: 0 }])} className="px-3 py-1.5 bg-slate-200 rounded text-sm hover:bg-slate-300">+ Linha TE</button>
                      <button type="button" onClick={handleSaveTE} disabled={teSaving} className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700 disabled:opacity-50">{teSaving ? 'Salvando...' : 'Salvar TE'}</button>
                    </div>
                  </>
                )}
              </div>
            )}
            {tab === 'taxas' && (isNew || !selectedId) && (
              <p className="text-slate-500 text-sm">Salve o parceiro na aba Dados para configurar taxas.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function TrechoUnifiedContent({ table, onReload }: { table: CotacaoPriceTable; onReload: () => void }) {
  return (
    <div className="space-y-6">
      <section>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Trecho</h4>
        <p className="text-sm text-slate-600">
          <strong>{table.nome}</strong> — {table.origem_uf} / {table.origem_cidade} → {table.destino_uf} / {table.destino_cidade}
        </p>
      </section>
      <section>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Faixas de peso</h4>
        <RangesInline priceTableId={table.id} />
      </section>
    </div>
  );
}

function TabelasEFaixasTab({
  partnerId,
  priceTables,
  onReload,
  expandedTableId,
  onToggleExpand,
}: {
  partnerId: number;
  priceTables: CotacaoPriceTable[];
  onReload: () => void;
  expandedTableId: number | null;
  onToggleExpand: (id: number | null) => void;
}) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [newNome, setNewNome] = useState('');
  const [newOrigemUf, setNewOrigemUf] = useState('');
  const [newOrigemCidade, setNewOrigemCidade] = useState('');
  const [newDestinoUf, setNewDestinoUf] = useState('');
  const [newDestinoCidade, setNewDestinoCidade] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNome.trim() || !newOrigemUf.trim() || !newOrigemCidade.trim() || !newDestinoUf.trim() || !newDestinoCidade.trim()) {
      setError('Preencha nome, origem e destino.');
      return;
    }
    setSubmitting(true);
    setError(null);
    fetch('/api/price-tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        partner_id: partnerId,
        nome: newNome.trim(),
        origem_uf: newOrigemUf.trim().toUpperCase().slice(0, 2),
        origem_cidade: newOrigemCidade.trim(),
        destino_uf: newDestinoUf.trim().toUpperCase().slice(0, 2),
        destino_cidade: newDestinoCidade.trim(),
        ativo: 1,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setShowNewForm(false);
          setNewNome('');
          setNewOrigemUf('');
          setNewOrigemCidade('');
          setNewDestinoUf('');
          setNewDestinoCidade('');
          onReload();
        } else setError(data.error || 'Erro ao criar tabela');
      })
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-600">{priceTables.length} tabela(s)</span>
        <button
          type="button"
          onClick={() => setShowNewForm((v) => !v)}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700"
        >
          {showNewForm ? 'Cancelar' : '+ Nova tabela'}
        </button>
      </div>
      {showNewForm && (
        <form onSubmit={handleCreateTable} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <input type="text" placeholder="Nome da tabela" value={newNome} onChange={(e) => setNewNome(e.target.value)} className="rounded border border-slate-300 px-2 py-1.5 text-sm col-span-2" />
            <input type="text" placeholder="UF origem" value={newOrigemUf} onChange={(e) => setNewOrigemUf(e.target.value.toUpperCase().slice(0, 2))} className="rounded border border-slate-300 px-2 py-1.5 text-sm" maxLength={2} />
            <input type="text" placeholder="Cidade origem" value={newOrigemCidade} onChange={(e) => setNewOrigemCidade(e.target.value)} className="rounded border border-slate-300 px-2 py-1.5 text-sm" />
            <input type="text" placeholder="UF destino" value={newDestinoUf} onChange={(e) => setNewDestinoUf(e.target.value.toUpperCase().slice(0, 2))} className="rounded border border-slate-300 px-2 py-1.5 text-sm" maxLength={2} />
            <input type="text" placeholder="Cidade destino" value={newDestinoCidade} onChange={(e) => setNewDestinoCidade(e.target.value)} className="rounded border border-slate-300 px-2 py-1.5 text-sm" />
          </div>
          <button type="submit" disabled={submitting} className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm disabled:opacity-50">Criar tabela</button>
        </form>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Origem</th>
              <th className="px-4 py-2 font-medium">Destino</th>
              <th className="px-4 py-2 font-medium w-24">Ações</th>
            </tr>
          </thead>
          <tbody>
            {priceTables.map((pt) => (
              <React.Fragment key={pt.id}>
                <tr className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-2">{pt.nome}</td>
                  <td className="px-4 py-2">{pt.origem_uf} / {pt.origem_cidade}</td>
                  <td className="px-4 py-2">{pt.destino_uf} / {pt.destino_cidade}</td>
                  <td className="px-4 py-2">
                    <button type="button" onClick={() => onToggleExpand(expandedTableId === pt.id ? null : pt.id)} className="text-indigo-600 hover:underline text-sm">
                      {expandedTableId === pt.id ? 'Fechar' : 'Editar trecho e taxas'}
                    </button>
                  </td>
                </tr>
                {expandedTableId === pt.id && (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 bg-slate-50/80 align-top">
                      <TrechoUnifiedContent table={pt} onReload={onReload} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {priceTables.length === 0 && !showNewForm && <p className="text-slate-500 text-sm">Nenhuma tabela. Clique em &quot;Nova tabela&quot;.</p>}
    </div>
  );
}

function RangesInline({ priceTableId }: { priceTableId: number }) {
  const [ranges, setRanges] = useState<CotacaoPriceTableRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/price-tables/${priceTableId}/ranges`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setRanges(data.data);
      })
      .finally(() => setLoading(false));
  }, [priceTableId]);

  useEffect(() => { load(); }, [load]);

  const addRange = () => {
    setSaving(true);
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
      .then((data) => { if (data.success) load(); })
      .finally(() => setSaving(false));
  };

  const deleteRange = (rangeId: number) => {
    if (!confirm('Remover esta faixa?')) return;
    setSaving(true);
    fetch(`/api/price-tables/ranges/${rangeId}`, { method: 'DELETE' })
      .then((res) => res.json())
      .then((data) => { if (data.success) load(); })
      .finally(() => setSaving(false));
  };

  const saveRange = (r: CotacaoPriceTableRange, edit: { peso_inicial_kg: string; peso_final_kg: string; valor_base: string; valor_excedente_por_kg: string; prazo_dias: string }) => {
    const pesoIni = parseFloat(edit.peso_inicial_kg);
    const pesoFim = parseFloat(edit.peso_final_kg);
    const valorBase = parseFloat(edit.valor_base);
    const prazo = Math.max(1, parseInt(edit.prazo_dias, 10) || 1);
    const exced = edit.valor_excedente_por_kg.trim() === '' ? null : parseFloat(edit.valor_excedente_por_kg);
    if (Number.isNaN(pesoIni) || Number.isNaN(pesoFim) || pesoFim <= pesoIni || Number.isNaN(valorBase) || valorBase < 0) return;
    setSavingId(r.id);
    fetch(`/api/price-tables/ranges/${r.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        peso_inicial_kg: pesoIni,
        peso_final_kg: pesoFim,
        valor_base: valorBase,
        valor_excedente_por_kg: exced,
        prazo_dias: prazo,
      }),
    })
      .then((res) => res.json())
      .then((data) => { if (data.success) load(); })
      .finally(() => setSavingId(null));
  };

  if (loading) return <p className="text-slate-500 text-sm py-2">Carregando faixas...</p>;

  return (
    <div className="py-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-slate-500">{ranges.length} faixa(s) — edite os valores e clique em Salvar na linha</span>
        <button type="button" onClick={addRange} disabled={saving} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs disabled:opacity-50">+ Nova faixa</button>
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-600">
            <th className="text-left py-1 pr-2">Peso ini (kg)</th>
            <th className="text-left py-1 pr-2">Peso fim (kg)</th>
            <th className="text-left py-1 pr-2">Valor base (R$)</th>
            <th className="text-left py-1 pr-2">Exced/kg</th>
            <th className="text-left py-1 pr-2">Prazo (d)</th>
            <th className="w-28" />
          </tr>
        </thead>
        <tbody>
          {ranges.map((r) => (
            <RangeRow
              key={r.id}
              range={r}
              onSave={saveRange}
              onDelete={deleteRange}
              saving={savingId === r.id}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RangeRow({
  range: r,
  onSave,
  onDelete,
  saving,
}: {
  range: CotacaoPriceTableRange;
  onSave: (range: CotacaoPriceTableRange, edit: { peso_inicial_kg: string; peso_final_kg: string; valor_base: string; valor_excedente_por_kg: string; prazo_dias: string }) => void;
  onDelete: (id: number) => void;
  saving: boolean;
}) {
  const [pesoIni, setPesoIni] = useState(String(r.peso_inicial_kg));
  const [pesoFim, setPesoFim] = useState(String(r.peso_final_kg));
  const [valorBase, setValorBase] = useState(String(r.valor_base));
  const [exced, setExced] = useState(r.valor_excedente_por_kg != null ? String(r.valor_excedente_por_kg) : '');
  const [prazo, setPrazo] = useState(String(r.prazo_dias));

  useEffect(() => {
    setPesoIni(String(r.peso_inicial_kg));
    setPesoFim(String(r.peso_final_kg));
    setValorBase(String(r.valor_base));
    setExced(r.valor_excedente_por_kg != null ? String(r.valor_excedente_por_kg) : '');
    setPrazo(String(r.prazo_dias));
  }, [r.peso_inicial_kg, r.peso_final_kg, r.valor_base, r.valor_excedente_por_kg, r.prazo_dias]);

  const handleSave = () => {
    onSave(r, { peso_inicial_kg: pesoIni, peso_final_kg: pesoFim, valor_base: valorBase, valor_excedente_por_kg: exced, prazo_dias: prazo });
  };

  return (
    <tr className="border-t border-slate-100">
      <td className="py-1 pr-2">
        <input type="number" step={0.01} min={0} value={pesoIni} onChange={(e) => setPesoIni(e.target.value)} className="w-20 rounded border border-slate-300 px-1.5 py-0.5 text-xs" />
      </td>
      <td className="py-1 pr-2">
        <input type="number" step={0.01} min={0} value={pesoFim} onChange={(e) => setPesoFim(e.target.value)} className="w-20 rounded border border-slate-300 px-1.5 py-0.5 text-xs" />
      </td>
      <td className="py-1 pr-2">
        <input type="number" step={0.01} min={0} value={valorBase} onChange={(e) => setValorBase(e.target.value)} className="w-20 rounded border border-slate-300 px-1.5 py-0.5 text-xs" />
      </td>
      <td className="py-1 pr-2">
        <input type="number" step={0.0001} min={0} value={exced} onChange={(e) => setExced(e.target.value)} placeholder="—" className="w-16 rounded border border-slate-300 px-1.5 py-0.5 text-xs" />
      </td>
      <td className="py-1 pr-2">
        <input type="number" min={1} value={prazo} onChange={(e) => setPrazo(e.target.value)} className="w-12 rounded border border-slate-300 px-1.5 py-0.5 text-xs" />
      </td>
      <td className="py-1 pr-2 flex items-center gap-1">
        <button type="button" onClick={handleSave} disabled={saving} className="px-2 py-0.5 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700 disabled:opacity-50">Salvar</button>
        <button type="button" onClick={() => onDelete(r.id)} className="text-red-600 hover:underline text-xs">Excluir</button>
      </td>
    </tr>
  );
}
