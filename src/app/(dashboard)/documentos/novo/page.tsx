'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';

const MAX_SIZE_MB = 50;

export default function NovoDocumentoPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoDocumentoId, setTipoDocumentoId] = useState<string>('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [tipos, setTipos] = useState<{ id: number; nome: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/documento-tipos?ativo=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setTipos(data.data.map((t: { id: number; nome: string }) => ({ id: t.id, nome: t.nome })));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!file || file.size === 0) {
      setError('Selecione um arquivo.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`O arquivo deve ter no máximo ${MAX_SIZE_MB} MB.`);
      return;
    }
    setSaving(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('nome', nome.trim() || file.name);
    if (descricao.trim()) formData.append('descricao', descricao.trim());
    if (tipoDocumentoId) formData.append('tipo_documento_id', tipoDocumentoId);
    if (dataVencimento.trim()) formData.append('data_vencimento', dataVencimento.trim());
    try {
      const res = await fetch('/api/documentos', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/documentos?created=1');
        router.refresh();
        return;
      }
      setError(data.error ?? 'Erro ao enviar documento.');
      if (res.status === 401) router.push('/login');
    } catch {
      setError('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Documentos', href: '/documentos' },
          { label: 'Enviar documento' },
        ]}
      />
      <div className="mt-4 max-w-2xl">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Enviar documento</h2>
        <p className="text-sm text-slate-600 mb-4">
          Formatos permitidos: PDF, Excel (xls, xlsx), CSV, Word (doc, docx), imagens. Máximo {MAX_SIZE_MB} MB.
        </p>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Arquivo *</label>
            <input
              type="file"
              required
              accept=".pdf,.xls,.xlsx,.ods,.csv,.txt,.doc,.docx,.odt,.jpg,.jpeg,.png,.gif,.webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
            {file && <p className="mt-1 text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome de exibição</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Deixe em branco para usar o nome do arquivo"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de documento</label>
            <select
              value={tipoDocumentoId}
              onChange={(e) => setTipoDocumentoId(e.target.value)}
              className="w-full max-w-xs px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Nenhum —</option>
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">
              <Link href="/documentos/tipos" className="text-indigo-600 hover:underline">Cadastrar tipos de documento</Link>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data de vencimento</label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="w-full max-w-xs px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-slate-500">Opcional. Documentos com vencimento em até 30 dias aparecem em destaque na listagem.</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Enviando...' : 'Enviar'}
            </button>
            <Link href="/documentos" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Cancelar</Link>
          </div>
        </form>
      </div>
    </>
  );
}
