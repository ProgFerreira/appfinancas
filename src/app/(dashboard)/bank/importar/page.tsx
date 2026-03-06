'use client';

import { useState, useEffect } from 'react';
import { Breadcrumb } from '@/components/Breadcrumb';
import Link from 'next/link';

interface ImportRow {
  id: number;
  bank_account_id: number;
  filename: string;
  imported_at: string;
  status: string;
  error_message?: string | null;
  conta_descricao: string;
}

interface Options {
  contasBancarias: { id: number; descricao: string }[];
}

export default function BankImportarPage() {
  const [imports, setImports] = useState<ImportRow[]>([]);
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankAccountId, setBankAccountId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [importSuccess, setImportSuccess] = useState<{ inserted: number; skipped: number } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/cadastros/options').then((r) => r.json()),
      fetch('/api/bank/imports').then((r) => r.json()),
    ]).then(([optRes, impRes]) => {
      if (optRes.success) setOptions(optRes.data);
      if (impRes.success) setImports(impRes.data);
    }).catch(() => setError('Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [uploading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !bankAccountId) {
      setError('Selecione a conta e o arquivo OFX.');
      return;
    }
    setError(null);
    setUploading(true);
    const formData = new FormData();
    formData.set('file', file);
    formData.set('bank_account_id', bankAccountId);
    fetch('/api/bank/import', { method: 'POST', body: formData })
      .then((r) => r.text())
      .then((text) => {
        let json: { success?: boolean; error?: string; data?: { importId: number; total: number; inserted: number; skipped: number } } = {};
        try {
          json = text ? JSON.parse(text) : {};
        } catch {
          setError('Resposta inválida do servidor.');
          return;
        }
        if (json.success && json.data) {
          setFile(null);
          const d = json.data;
          setImportSuccess(d.inserted > 0 ? { inserted: d.inserted, skipped: d.skipped } : null);
          setImports((prev) => [
            {
              id: d.importId,
              bank_account_id: parseInt(bankAccountId, 10),
              filename: file.name,
              imported_at: new Date().toISOString(),
              status: 'done',
              conta_descricao: options?.contasBancarias?.find((c) => String(c.id) === bankAccountId)?.descricao ?? '',
              error_message: d.inserted > 0 ? `Inseridas: ${d.inserted}${d.skipped > 0 ? `, ignoradas: ${d.skipped}` : ''}` : (d.skipped > 0 ? `Duplicadas: ${d.skipped}` : 'Nenhuma transação'),
            },
            ...prev,
          ]);
          if (d.total === 0) {
            setError('Arquivo processado, mas nenhuma transação foi encontrada no OFX. Verifique o formato.');
          } else if (d.inserted === 0 && d.skipped > 0) {
            setError(`Todas as ${d.skipped} transações já existem (duplicadas). Nenhuma nova inserida.`);
          } else {
            setError(null);
          }
          fetch('/api/bank/imports').then((r) => r.json()).then((res) => { if (res.success && res.data) setImports(res.data); });
        } else {
          const detail = (json as { detail?: string }).detail;
          setError(detail ? `${json.error || 'Erro ao importar'} — ${detail}` : (json.error || 'Erro ao importar'));
        }
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => {
        setUploading(false);
        setTimeout(() => setImportSuccess(null), 15000);
      });
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Contas bancárias', href: '/contas-bancarias' }, { label: 'Importar OFX' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-2">Importar extrato OFX</h2>
        <p className="text-sm text-slate-600 mb-4">
          Envie o arquivo OFX da sua conta. Depois, acesse <strong>Transações extrato</strong> para ver o extrato, gerar sugestões de lançamentos e vincular cada transação a um pagamento ou recebimento já cadastrado.
        </p>
        {options && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-white border border-slate-200 rounded-lg max-w-md">
            {(!options.contasBancarias || options.contasBancarias.length === 0) && (
              <p className="mb-3 text-amber-700 text-sm">Cadastre uma conta bancária em Contas bancárias para poder importar.</p>
            )}
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Conta bancária</label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full border border-slate-300 rounded px-2 py-1.5"
              >
                <option value="">Selecione</option>
                {options.contasBancarias.map((c) => (
                  <option key={c.id} value={c.id}>{c.descricao}</option>
                ))}
              </select>
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Arquivo OFX</label>
              <input
                type="file"
                accept=".ofx,.qfx,.OFX,.QFX"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full border border-slate-300 rounded px-2 py-1.5"
              />
            </div>
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <button
              type="submit"
              disabled={uploading}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploading ? 'Importando...' : 'Importar'}
            </button>
          </form>
        )}
        {importSuccess && importSuccess.inserted > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200">
            <p className="font-medium text-green-800 mb-2">
              {importSuccess.inserted} transação(ões) importada(s).
              {importSuccess.skipped > 0 && ` ${importSuccess.skipped} duplicada(s) ignorada(s).`}
            </p>
            <p className="text-sm text-green-700 mb-3">Próximo passo: abra o extrato, gere sugestões e vincule as transações aos lançamentos.</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/bank/transacoes"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700"
              >
                Abrir extrato e conciliar
              </Link>
            </div>
          </div>
        )}
        <h3 className="font-medium text-slate-700 mb-2">Importações recentes</h3>
        {loading && <p className="text-slate-500">Carregando...</p>}
        {!loading && (
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Conta</th>
                  <th className="text-left p-2">Arquivo</th>
                  <th className="text-left p-2">Data</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {imports.length === 0 ? (
                  <tr><td colSpan={6} className="p-2 text-slate-500">Nenhuma importação</td></tr>
                ) : (
                  imports.map((imp) => (
                    <tr key={imp.id} className="border-t border-slate-100">
                      <td className="p-2">{imp.id}</td>
                      <td className="p-2">{imp.conta_descricao || imp.bank_account_id}</td>
                      <td className="p-2">{imp.filename}</td>
                      <td className="p-2">{imp.imported_at.slice(0, 19)}</td>
                      <td className="p-2">{imp.status}</td>
                      <td className="p-2 text-slate-600 text-xs max-w-xs truncate" title={imp.error_message ?? undefined}>{imp.error_message ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-4 text-sm text-slate-600">
          <Link href="/bank/transacoes" className="text-indigo-600 hover:underline">Transações extrato</Link>
        </p>
      </div>
    </>
  );
}
