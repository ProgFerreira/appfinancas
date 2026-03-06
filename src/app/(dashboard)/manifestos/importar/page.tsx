'use client';

import { useState } from 'react';
import { Breadcrumb } from '@/components/Breadcrumb';
import Link from 'next/link';

export default function ManifestosImportarPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ inserted: number; updated: number; errors: number } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError('Selecione um arquivo.');
      return;
    }
    setError(null);
    setResult(null);
    setUploading(true);
    const formData = new FormData();
    formData.set('file', file);
    fetch('/api/manifestos/import', { method: 'POST', body: formData })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setFile(null);
          setResult(data.data);
          setError(null);
        } else {
          setError(data.error ?? 'Erro ao importar.');
        }
      })
      .catch(() => setError('Erro de conexão.'))
      .finally(() => setUploading(false));
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Manifestos', href: '/manifestos' }, { label: 'Importar' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Importar manifestos</h2>
        <p className="text-sm text-slate-600 mb-4">
          Envie um arquivo no formato da planilha <strong>manifesto.xls</strong>. A primeira linha deve ser o cabeçalho com os nomes das colunas abaixo.
        </p>
        <div className="mb-4 p-4 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
          <p className="font-medium mb-2">Colunas da planilha (cabeçalho exato):</p>
          <p className="font-mono text-xs break-words">
            DATA, MANIFESTO, TIPO, SERVICO, RESPONSÁVEL, MOTORISTA, CNPJ/CPF, PLACA, ROTA, DATA SAÍDA EFETIVA, QTD VOLUME, QTD ENTREGA, PESO, PESO TAXADO, TOTAL NF, ENTREGA REALIZADA, KM, FATURAMENTO / KM, CUSTO KM, FATURAMENTO, CUSTO FRETE, CUSTO ADICIONAL, CUSTO PEDÁGIO, CUSTO TOTAL, RESULTADO, EMISSOR, STATUS MANIFESTO, TIPO DE RODADO, UNIDADE
          </p>
          <p className="mt-2 text-slate-600">Colunas obrigatórias: DATA, MANIFESTO, MOTORISTA (ou CNPJ/CPF/PLACA), FATURAMENTO, CUSTO FRETE, RESULTADO. Valores numéricos podem usar ponto ou vírgula como decimal.</p>
          <p className="mt-1 text-amber-700 text-xs">Para gravar Rota, Responsável, Emissor, Status, Tipo rodado, Unidade etc., execute antes a migration <code className="bg-amber-100 px-1 rounded">database/migrations/004_manifestos_planilha_cols.sql</code>.</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white border border-slate-200 rounded-xl max-w-md">
          <div className="mb-3">
            <label className="block text-sm font-medium text-slate-700 mb-1">Arquivo</label>
            <input
              type="file"
              accept=".xls,.xlsx,.csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading ? 'Importando...' : 'Importar'}
            </button>
            <Link
              href="/manifestos"
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
            >
              Voltar
            </Link>
          </div>
        </form>

        {result && (result.inserted > 0 || result.updated > 0 || result.errors > 0) && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <p className="font-medium text-emerald-800 mb-2">Importação concluída</p>
            <p className="text-sm text-emerald-700">
              {result.inserted > 0 && <span>{result.inserted} inserido(s). </span>}
              {result.updated > 0 && <span>{result.updated} atualizado(s). </span>}
              {result.errors > 0 && <span>{result.errors} erro(s). </span>}
            </p>
            <Link
              href="/manifestos"
              className="inline-flex mt-3 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
            >
              Ir para listagem
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
