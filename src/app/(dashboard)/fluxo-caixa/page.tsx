'use client';

import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Breadcrumb } from '@/components/Breadcrumb';

type Options = { contasBancarias: { id: number; descricao: string }[]; centrosCusto: { id: number; nome: string }[]; categoriasDespesa: { id: number; nome: string }[] };

interface CashFlowEntry {
  data: string;
  tipo: string;
  valor: number;
  descricao?: string;
  categoria_nome?: string | null;
  centro_custo_nome?: string | null;
}

interface CashFlowData {
  entradas: CashFlowEntry[];
  saidas: CashFlowEntry[];
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  periodo: { dataInicio: string; dataFim: string };
}

interface DiaFluxo {
  data: string;
  entradasRealizadas: CashFlowEntry[];
  saidasRealizadas: CashFlowEntry[];
  entradasPrevistas: CashFlowEntry[];
  saidasPrevistas: CashFlowEntry[];
  totalEntradasRealizadas: number;
  totalSaidasRealizadas: number;
  totalEntradasPrevistas: number;
  totalSaidasPrevistas: number;
  saldoAcumulado: number;
}

interface FluxoDiaADiaData {
  saldoInicial: number;
  dias: DiaFluxo[];
  alertasFaltaCaixa: string[];
  periodo: { dataInicio: string; dataFim: string };
}

function formatarData(iso: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatDataColuna(iso: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return iso;
  }
}

function formatMoney(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type ExpandirPor = 'nenhum' | 'centro' | 'natureza';

interface LinhaMatriz {
  id: string;
  label: string;
  tipo: 'entrada' | 'saida' | 'saldo';
  valoresPorDia: Record<string, number>;
  total: number;
  isSubRow?: boolean;
}

function buildLinhasMatriz(dataDiaADia: FluxoDiaADiaData, expandirPor: ExpandirPor): LinhaMatriz[] {
  const dias = dataDiaADia.dias;
  const datas = dias.map((d) => d.data);
  const linhas: LinhaMatriz[] = [];

  const getChave = (e: CashFlowEntry): string => {
    if (expandirPor === 'centro') return (e as CashFlowEntry & { centro_custo_nome?: string }).centro_custo_nome ?? 'Sem centro';
    if (expandirPor === 'natureza') return (e as CashFlowEntry & { categoria_nome?: string }).categoria_nome ?? 'Sem natureza';
    return '';
  };

  const agregarPorDia = (entries: CashFlowEntry[]): Record<string, number> => {
    const out: Record<string, number> = {};
    datas.forEach((data) => { out[data] = 0; });
    entries.forEach((e) => {
      const d = e.data.slice(0, 10);
      if (out[d] !== undefined) out[d] += e.valor;
    });
    return out;
  };

  const agregarPorDiaEGrupo = (entries: CashFlowEntry[]): Map<string, Record<string, number>> => {
    const map = new Map<string, Record<string, number>>();
    entries.forEach((e) => {
      const chave = getChave(e);
      if (!map.has(chave)) {
        const rec: Record<string, number> = {};
        datas.forEach((data) => { rec[data] = 0; });
        map.set(chave, rec);
      }
      const d = e.data.slice(0, 10);
      const rec = map.get(chave)!;
      if (rec[d] !== undefined) rec[d] += e.valor;
    });
    return map;
  };

  // Entradas realizadas
  const todasEntradasReal = dias.flatMap((d) => d.entradasRealizadas);
  linhas.push({
    id: 'entradas-realizadas',
    label: 'Entradas realizadas',
    tipo: 'entrada',
    valoresPorDia: agregarPorDia(todasEntradasReal),
    total: dias.reduce((s, d) => s + d.totalEntradasRealizadas, 0),
  });
  if (expandirPor !== 'nenhum' && todasEntradasReal.some((e) => getChave(e))) {
    agregarPorDiaEGrupo(todasEntradasReal).forEach((valores, chave) => {
      linhas.push({
        id: `entradas-real-${chave}`,
        label: `  ${chave}`,
        tipo: 'entrada',
        valoresPorDia: valores,
        total: Object.values(valores).reduce((a, b) => a + b, 0),
        isSubRow: true,
      });
    });
  }

  // Entradas previstas
  const todasEntradasPrev = dias.flatMap((d) => d.entradasPrevistas);
  linhas.push({
    id: 'entradas-previstas',
    label: 'Entradas previstas',
    tipo: 'entrada',
    valoresPorDia: agregarPorDia(todasEntradasPrev),
    total: dias.reduce((s, d) => s + d.totalEntradasPrevistas, 0),
  });
  if (expandirPor !== 'nenhum' && todasEntradasPrev.some((e) => getChave(e))) {
    agregarPorDiaEGrupo(todasEntradasPrev).forEach((valores, chave) => {
      linhas.push({
        id: `entradas-prev-${chave}`,
        label: `  ${chave}`,
        tipo: 'entrada',
        valoresPorDia: valores,
        total: Object.values(valores).reduce((a, b) => a + b, 0),
        isSubRow: true,
      });
    });
  }

  // Saídas realizadas
  const todasSaidasReal = dias.flatMap((d) => d.saidasRealizadas);
  linhas.push({
    id: 'saidas-realizadas',
    label: 'Saídas realizadas',
    tipo: 'saida',
    valoresPorDia: agregarPorDia(todasSaidasReal),
    total: dias.reduce((s, d) => s + d.totalSaidasRealizadas, 0),
  });
  if (expandirPor !== 'nenhum' && todasSaidasReal.some((e) => getChave(e))) {
    agregarPorDiaEGrupo(todasSaidasReal).forEach((valores, chave) => {
      linhas.push({
        id: `saidas-real-${chave}`,
        label: `  ${chave}`,
        tipo: 'saida',
        valoresPorDia: valores,
        total: Object.values(valores).reduce((a, b) => a + b, 0),
        isSubRow: true,
      });
    });
  }

  // Saídas previstas
  const todasSaidasPrev = dias.flatMap((d) => d.saidasPrevistas);
  linhas.push({
    id: 'saidas-previstas',
    label: 'Saídas previstas',
    tipo: 'saida',
    valoresPorDia: agregarPorDia(todasSaidasPrev),
    total: dias.reduce((s, d) => s + d.totalSaidasPrevistas, 0),
  });
  if (expandirPor !== 'nenhum' && todasSaidasPrev.some((e) => getChave(e))) {
    agregarPorDiaEGrupo(todasSaidasPrev).forEach((valores, chave) => {
      linhas.push({
        id: `saidas-prev-${chave}`,
        label: `  ${chave}`,
        tipo: 'saida',
        valoresPorDia: valores,
        total: Object.values(valores).reduce((a, b) => a + b, 0),
        isSubRow: true,
      });
    });
  }

  // Saldo acumulado (por dia, último valor de cada dia)
  const saldoPorDia: Record<string, number> = {};
  datas.forEach((data) => {
    const dia = dias.find((d) => d.data === data);
    saldoPorDia[data] = dia ? dia.saldoAcumulado : 0;
  });
  linhas.push({
    id: 'saldo-acumulado',
    label: 'Saldo acumulado',
    tipo: 'saldo',
    valoresPorDia: saldoPorDia,
    total: dias.length ? dias[dias.length - 1].saldoAcumulado : 0,
  });

  return linhas;
}

export default function FluxoCaixaPage() {
  const [visao, setVisao] = useState<'consolidado' | 'dia-a-dia'>('dia-a-dia');
  const [data, setData] = useState<CashFlowData | null>(null);
  const [dataDiaADia, setDataDiaADia] = useState<FluxoDiaADiaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<Options | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [contaBancariaId, setContaBancariaId] = useState('');
  const [centroCustoId, setCentroCustoId] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [saldoInicialManual, setSaldoInicialManual] = useState('');
  const [expandirPor, setExpandirPor] = useState<'nenhum' | 'centro' | 'natureza'>('nenhum');
  const [exportando, setExportando] = useState<'pdf' | 'excel' | null>(null);

  const formatMoneyExport = (value: number) =>
    value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const escapeCsv = (cell: string | number): string => {
    const s = String(cell);
    if (s.includes(';') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const exportToExcel = () => {
    if (visao === 'dia-a-dia' && dataDiaADia) {
      const datas = dataDiaADia.dias.map((d) => d.data);
      const linhas = buildLinhasMatriz(dataDiaADia, expandirPor);
      const header = ['Tipo', ...datas.map((d) => formatDataColuna(d)), 'Total'];
      const rows = linhas.map((linha) => {
        const isSaida = linha.tipo === 'saida';
        const cells = [
          linha.label,
          ...datas.map((data) => formatMoneyExport(isSaida ? -(linha.valoresPorDia[data] ?? 0) : (linha.valoresPorDia[data] ?? 0))),
          formatMoneyExport(isSaida ? -linha.total : linha.total),
        ];
        return cells.map(escapeCsv).join(';');
      });
      const csv = '\uFEFF' + [header.map(escapeCsv).join(';'), ...rows].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fluxo-caixa-${dataInicio}-${dataFim}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (visao === 'consolidado' && data) {
      const header = ['Tipo', 'Data', 'Descrição', 'Valor (R$)'];
      const rowsEntradas = data.entradas.map((e) => [escapeCsv('Entrada'), escapeCsv(formatarData(e.data)), escapeCsv(e.descricao ?? ''), escapeCsv(formatMoneyExport(e.valor))].join(';'));
      const rowsSaidas = data.saidas.map((s) => [escapeCsv('Saída'), escapeCsv(formatarData(s.data)), escapeCsv(s.descricao ?? ''), escapeCsv(formatMoneyExport(-s.valor))].join(';'));
      const totalLine = [escapeCsv(''), escapeCsv(''), escapeCsv('Total entradas'), escapeCsv(formatMoneyExport(data.totalEntradas))].join(';');
      const totalSaidasLine = [escapeCsv(''), escapeCsv(''), escapeCsv('Total saídas'), escapeCsv(formatMoneyExport(-data.totalSaidas))].join(';');
      const saldoLine = [escapeCsv(''), escapeCsv(''), escapeCsv('Saldo'), escapeCsv(formatMoneyExport(data.saldo))].join(';');
      const csv = '\uFEFF' + [header.map(escapeCsv).join(';'), ...rowsEntradas, ...rowsSaidas, '', totalLine, totalSaidasLine, saldoLine].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fluxo-caixa-consolidado-${dataInicio}-${dataFim}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExportando(null);
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'l', unit: 'pt', format: 'a4' });
    doc.setFontSize(14);
    doc.text('Fluxo de Caixa', 14, 22);
    doc.setFontSize(10);
    doc.text(`Período: ${dataInicio} a ${dataFim}`, 14, 36);
    let startY = 48;

    if (visao === 'dia-a-dia' && dataDiaADia) {
      const datas = dataDiaADia.dias.map((d) => d.data);
      const linhas = buildLinhasMatriz(dataDiaADia, expandirPor);
      doc.setFontSize(9);
      doc.text(`Saldo inicial: ${formatMoney(dataDiaADia.saldoInicial)}`, 14, startY);
      startY += 14;
      const headers = ['Tipo', ...datas.map((d) => formatDataColuna(d)), 'Total'];
      const body = linhas.map((linha) => {
        const isSaida = linha.tipo === 'saida';
        return [
          linha.label,
          ...datas.map((d) => formatMoneyExport(isSaida ? -(linha.valoresPorDia[d] ?? 0) : (linha.valoresPorDia[d] ?? 0))),
          formatMoneyExport(isSaida ? -linha.total : linha.total),
        ];
      });
      autoTable(doc, {
        head: [headers],
        body,
        startY,
        styles: { fontSize: 7 },
        margin: { left: 14 },
      });
    } else if (visao === 'consolidado' && data) {
      doc.text(`Total entradas: ${formatMoney(data.totalEntradas)}`, 14, startY);
      startY += 12;
      doc.text(`Total saídas: ${formatMoney(data.totalSaidas)}`, 14, startY);
      startY += 12;
      doc.text(`Saldo: ${formatMoney(data.saldo)}`, 14, startY);
      startY += 20;
      autoTable(doc, {
        head: [['Tipo', 'Data', 'Descrição', 'Valor']],
        body: [
          ...data.entradas.map((e) => ['Entrada', formatarData(e.data), (e.descricao ?? '').slice(0, 40), formatMoney(e.valor)]),
          ...data.saidas.map((s) => ['Saída', formatarData(s.data), (s.descricao ?? '').slice(0, 40), formatMoney(-s.valor)]),
        ],
        startY,
        styles: { fontSize: 8 },
        margin: { left: 14 },
      });
    } else {
      doc.text('Nenhum dado para exportar.', 14, startY);
    }
    doc.save(`fluxo-caixa-${dataInicio}-${dataFim}.pdf`);
    setExportando(null);
  };

  const handleExport = (tipo: 'pdf' | 'excel') => {
    if ((visao === 'dia-a-dia' && !dataDiaADia) || (visao === 'consolidado' && !data)) return;
    setExportando(tipo);
    setTimeout(() => {
      if (tipo === 'pdf') exportToPDF();
      else exportToExcel();
    }, 0);
  };

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    if (!dataInicio) setDataInicio(start.toISOString().slice(0, 10));
    if (!dataFim) setDataFim(endOfMonth.toISOString().slice(0, 10));
  }, [dataInicio, dataFim]);

  useEffect(() => {
    fetch('/api/cadastros/options').then((r) => r.json()).then((j) => { if (j.success && j.data) setOptions(j.data); });
  }, []);

  useEffect(() => {
    if (!dataInicio || !dataFim) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ data_inicio: dataInicio, data_fim: dataFim });
    if (contaBancariaId) params.set('conta_bancaria_id', contaBancariaId);
    if (centroCustoId) params.set('centro_custo_id', centroCustoId);
    if (categoriaId) params.set('categoria_id', categoriaId);

    if (visao === 'dia-a-dia') {
      params.set('visao', 'dia-a-dia');
      if (saldoInicialManual.trim() !== '' && !Number.isNaN(Number(saldoInicialManual))) {
        params.set('saldo_inicial', saldoInicialManual);
      }
      fetch(`/api/fluxo-caixa?${params}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setDataDiaADia(json.data);
            setData(null);
          } else {
            setError(json.error || 'Erro ao carregar');
            setDataDiaADia(null);
          }
        })
        .catch(() => { setError('Erro de conexão'); setDataDiaADia(null); })
        .finally(() => setLoading(false));
      return;
    }

    fetch(`/api/fluxo-caixa?${params}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setData(json.data);
          setDataDiaADia(null);
        } else {
          setError(json.error || 'Erro ao carregar');
          setData(null);
        }
      })
      .catch(() => { setError('Erro de conexão'); setData(null); })
      .finally(() => setLoading(false));
  }, [visao, dataInicio, dataFim, contaBancariaId, centroCustoId, categoriaId, saldoInicialManual]);

  const filtros = (
    <div className="flex flex-wrap gap-3 mb-4 items-center">
      <label className="flex items-center gap-2">
        <span className="text-slate-600">De</span>
        <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
      </label>
      <label className="flex items-center gap-2">
        <span className="text-slate-600">Até</span>
        <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-sm" />
      </label>
      <select value={contaBancariaId} onChange={(e) => setContaBancariaId(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-sm min-w-[160px]">
        <option value="">Todas as contas</option>
        {(options?.contasBancarias ?? []).map((c) => <option key={c.id} value={c.id}>{c.descricao}</option>)}
      </select>
      <select value={centroCustoId} onChange={(e) => setCentroCustoId(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-sm min-w-[160px]">
        <option value="">Todos centros de custo</option>
        {(options?.centrosCusto ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
      <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} className="border border-slate-300 rounded px-2 py-1.5 text-sm min-w-[160px]">
        <option value="">Todas categorias</option>
        {(options?.categoriasDespesa ?? []).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
      {visao === 'dia-a-dia' && (
        <label className="flex items-center gap-2">
          <span className="text-slate-600">Saldo inicial (opcional)</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="Calculado automaticamente"
            value={saldoInicialManual}
            onChange={(e) => setSaldoInicialManual(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1.5 text-sm w-40"
          />
        </label>
      )}
    </div>
  );

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Fluxo de caixa' }]} />
      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Fluxo de caixa</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setVisao('dia-a-dia')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${visao === 'dia-a-dia' ? 'bg-white text-slate-800 shadow border border-slate-200' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Dia a dia
              </button>
              <button
                type="button"
                onClick={() => setVisao('consolidado')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md ${visao === 'consolidado' ? 'bg-white text-slate-800 shadow border border-slate-200' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Consolidado
              </button>
            </div>
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
              <button
                type="button"
                onClick={() => handleExport('pdf')}
                disabled={loading || (visao === 'dia-a-dia' ? !dataDiaADia : !data) || exportando !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportando === 'pdf' ? '...' : 'PDF'}
              </button>
              <button
                type="button"
                onClick={() => handleExport('excel')}
                disabled={loading || (visao === 'dia-a-dia' ? !dataDiaADia : !data) || exportando !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exportando === 'excel' ? '...' : 'Excel'}
              </button>
            </div>
          </div>
        </div>

        {filtros}

        {error && (
          <p className="text-red-600 mb-4">{error}</p>
        )}
        {loading && <p className="text-slate-500">Carregando...</p>}

        {!loading && visao === 'dia-a-dia' && dataDiaADia && (() => {
          const datas = dataDiaADia.dias.map((d) => d.data);
          const linhas = buildLinhasMatriz(dataDiaADia, expandirPor);
          return (
            <>
              {/* Resumo e alerta de falta de caixa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <p className="text-sm text-slate-600">Saldo inicial (antes do período)</p>
                  <p className="text-xl font-semibold text-slate-900">{formatMoney(dataDiaADia.saldoInicial)}</p>
                </div>
                {dataDiaADia.alertasFaltaCaixa.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-red-800">Atenção: falta de caixa prevista</p>
                    <p className="text-sm text-red-700 mt-1">
                      Em {dataDiaADia.alertasFaltaCaixa.length} dia(s) o saldo acumulado fica negativo:{' '}
                      {dataDiaADia.alertasFaltaCaixa.map((d) => formatarData(d)).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Expandir por centro de custo ou natureza */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <span className="text-slate-600 text-sm">Expandir por:</span>
                <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => setExpandirPor('nenhum')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${expandirPor === 'nenhum' ? 'bg-white text-slate-800 shadow border border-slate-200' : 'text-slate-600 hover:text-slate-800'}`}
                  >
                    Nenhum
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandirPor('centro')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${expandirPor === 'centro' ? 'bg-white text-slate-800 shadow border border-slate-200' : 'text-slate-600 hover:text-slate-800'}`}
                  >
                    Centro de custo
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandirPor('natureza')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md ${expandirPor === 'natureza' ? 'bg-white text-slate-800 shadow border border-slate-200' : 'text-slate-600 hover:text-slate-800'}`}
                  >
                    Natureza (categoria)
                  </button>
                </div>
              </div>

              {/* Matriz: colunas = dias, linhas = tipos */}
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="text-left p-2 min-w-[180px] sticky left-0 z-10 bg-slate-100 border-r border-slate-200 text-slate-800 font-medium">
                          Tipo
                        </th>
                        {datas.map((data) => (
                          <th key={data} className="text-right p-2 whitespace-nowrap text-slate-800 font-medium">
                            {formatDataColuna(data)}
                          </th>
                        ))}
                        <th className="text-right p-2 min-w-[100px] bg-slate-100 font-medium text-slate-800">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((linha) => {
                        const isSaldo = linha.tipo === 'saldo';
                        const isEntrada = linha.tipo === 'entrada';
                        const isSaida = linha.tipo === 'saida';
                        const negativo = isSaldo && linha.total < 0;
                        return (
                          <tr
                            key={linha.id}
                            className={`border-t border-slate-100 ${linha.isSubRow ? 'bg-slate-50/80' : ''} ${negativo ? 'bg-red-50' : ''}`}
                          >
                            <td className={`p-2 sticky left-0 z-10 border-r border-slate-100 ${linha.isSubRow ? 'bg-slate-50/80 pl-6' : 'bg-white'} font-medium text-slate-800`}>
                              {linha.label}
                            </td>
                            {datas.map((data) => {
                              const val = linha.valoresPorDia[data] ?? 0;
                              const valorExibir = isSaida ? -val : val;
                              const showZero = val === 0 && !linha.isSubRow;
                              const saldoNegativo = isSaldo && val < 0;
                              return (
                                <td
                                  key={data}
                                  className={`p-2 text-right whitespace-nowrap ${
                                    isEntrada ? 'text-green-700' : isSaldo ? (saldoNegativo ? 'text-red-700 font-semibold bg-red-50/50' : 'text-slate-900 font-semibold') : 'text-red-700'
                                  } ${showZero ? 'text-slate-400' : ''}`}
                                >
                                  {formatMoney(valorExibir)}
                                </td>
                              );
                            })}
                            <td className={`p-2 text-right whitespace-nowrap font-medium bg-slate-50 ${
                              isEntrada ? 'text-green-800' : isSaldo ? (negativo ? 'text-red-700' : 'text-slate-900') : 'text-red-800'
                            }`}>
                              {formatMoney(isSaida ? -linha.total : linha.total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="text-slate-500 text-sm mt-2">
                Colunas = dias. Linhas = tipos de movimento. Use &quot;Expandir por&quot; para ver detalhe por centro de custo ou natureza (categoria).
              </p>
            </>
          );
        })()}

        {!loading && visao === 'consolidado' && data && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">Total entradas</p>
                <p className="text-xl font-semibold text-green-900">{formatMoney(data.totalEntradas)}</p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">Total saídas</p>
                <p className="text-xl font-semibold text-red-900">{formatMoney(data.totalSaidas)}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-800">Saldo</p>
                <p className="text-xl font-semibold text-slate-900">{formatMoney(data.saldo)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-slate-700 mb-2">Entradas</h3>
                <div className="border border-slate-200 rounded overflow-hidden bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="text-left p-2 text-slate-800 font-medium">Data</th>
                        <th className="text-left p-2 text-slate-800 font-medium">Descrição</th>
                        <th className="text-right p-2 text-slate-800 font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.entradas.length === 0 ? (
                        <tr><td colSpan={3} className="p-2 text-slate-500">Nenhuma entrada no período</td></tr>
                      ) : (
                        data.entradas.map((e, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="p-2 text-slate-800">{formatarData(e.data)}</td>
                            <td className="p-2 text-slate-800">{e.descricao ?? '—'}</td>
                            <td className="p-2 text-right text-green-700 font-medium">{formatMoney(e.valor)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-slate-700 mb-2">Saídas</h3>
                <div className="border border-slate-200 rounded overflow-hidden bg-white">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="text-left p-2 text-slate-800 font-medium">Data</th>
                        <th className="text-left p-2 text-slate-800 font-medium">Descrição</th>
                        <th className="text-right p-2 text-slate-800 font-medium">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.saidas.length === 0 ? (
                        <tr><td colSpan={3} className="p-2 text-slate-500">Nenhuma saída no período</td></tr>
                      ) : (
                        data.saidas.map((s, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="p-2 text-slate-800">{formatarData(s.data)}</td>
                            <td className="p-2 text-slate-800">{s.descricao ?? '—'}</td>
                            <td className="p-2 text-right text-red-700 font-medium">{formatMoney(s.valor)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
