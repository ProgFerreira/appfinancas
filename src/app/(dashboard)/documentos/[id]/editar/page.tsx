'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';

const MAX_SIZE_MB = 50;

export default function EditarDocumentoPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? '');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoDocumentoId, setTipoDocumentoId] = useState<string>('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [nomeArquivo, setNomeArquivo] = useState('');
  const [tipos, setTipos] = useState<{ id: number; nome: string }[]>([]);
  const [canDelete, setCanDelete] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [replacing, setReplacing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/documentos/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) {
          setNome(result.data.nome);
          setDescricao(result.data.descricao ?? '');
          setTipoDocumentoId(result.data.tipo_documento_id ? String(result.data.tipo_documento_id) : '');
          setDataVencimento(result.data.data_vencimento ? String(result.data.data_vencimento).slice(0, 10) : '');
          setNomeArquivo(result.data.nome_arquivo ?? '');
          setCanDelete(!!result.data.can_delete);
          if (!result.data.can_edit) setError('Sem permissão para editar este documento.');
        } else setError(result.error ?? 'Documento não encontrado.');
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nome.trim()) { setError('Nome é obrigatório.'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/documentos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          tipo_documento_id: tipoDocumentoId ? Number(tipoDocumentoId) : null,
          data_vencimento: dataVencimento.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/documentos/${id}/visualizar`);
        router.refresh();
        return;
      }
      setError(data.error ?? 'Erro ao salvar.');
      if (res.status === 401) router.push('/login');
    } catch {
      setError('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  const handleReplaceFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceFile || replaceFile.size === 0) { setError('Selecione um arquivo para substituir.'); return; }
    if (replaceFile.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`O arquivo deve ter no máximo ${MAX_SIZE_MB} MB.`);
      return;
    }
    setError('');
    setReplacing(true);
    const formData = new FormData();
    formData.append('file', replaceFile);
    try {
      const res = await fetch(`/api/documentos/${id}/arquivo`, { method: 'PUT', body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        setNomeArquivo(replaceFile.name);
        setReplaceFile(null);
        router.refresh();
      } else setError(data.error ?? 'Erro ao substituir arquivo.');
      if (res.status === 401) router.push('/login');
    } catch {
      setError('Erro de conexão.');
    } finally {
      setReplacing(false);
    }
  };

  const handleDelete = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    try {
      const res = await fetch(`/api/documentos/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push('/documentos');
        router.refresh();
        return;
      }
      setError(data.error ?? 'Erro ao excluir.');
      if (res.status === 401) router.push('/login');
    } catch {
      setError('Erro de conexão.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documentos', href: '/documentos' }, { label: 'Editar' }]} />
        <div className="mt-4 p-6 text-slate-500">Carregando...</div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documentos', href: '/documentos' }, { label: 'Editar' }]} />
      <div className="mt-4 max-w-2xl space-y-6">
        <h2 className="text-lg font-semibold text-slate-800">Editar documento</h2>
        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome de exibição *</label>
            <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500" />
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
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Data de vencimento</label>
            <input
              type="date"
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              className="w-full max-w-xs px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
            <Link href={`/documentos/${id}/visualizar`} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Cancelar</Link>
          </div>
        </form>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <h3 className="text-sm font-medium text-slate-800 mb-2">Substituir arquivo</h3>
          <p className="text-sm text-slate-600 mb-2">Arquivo atual: <strong>{nomeArquivo || '—'}</strong></p>
          <p className="text-xs text-slate-500 mb-3">O novo arquivo substituirá o atual. Formatos permitidos: PDF, Excel, CSV, Word, imagens. Máx. {MAX_SIZE_MB} MB.</p>
          <form onSubmit={handleReplaceFile} className="flex flex-wrap items-end gap-2">
            <input
              type="file"
              accept=".pdf,.xls,.xlsx,.ods,.csv,.txt,.doc,.docx,.odt,.jpg,.jpeg,.png,.gif,.webp"
              onChange={(e) => setReplaceFile(e.target.files?.[0] ?? null)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
            />
            <button type="submit" disabled={replacing || !replaceFile} className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 text-sm">
              {replacing ? 'Substituindo...' : 'Substituir arquivo'}
            </button>
          </form>
        </div>

        {canDelete && (
          <div className="rounded-xl border border-red-200 bg-red-50/50 shadow-sm p-6">
            <h3 className="text-sm font-medium text-red-800 mb-2">Excluir documento</h3>
            <p className="text-sm text-red-700 mb-3">Esta ação remove o documento e o arquivo permanentemente. Não é possível desfazer.</p>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-sm"
            >
              {deleting ? 'Excluindo...' : 'Excluir documento'}
            </button>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-4">
            <h3 className="font-semibold text-slate-800 mb-2">Confirmar exclusão</h3>
            <p className="text-sm text-slate-600 mb-4">
              Deseja realmente excluir o documento <strong>{nome}</strong>? O arquivo será removido e não será possível recuperar.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 rounded border border-slate-200 hover:bg-slate-50">Cancelar</button>
              <button type="button" onClick={handleDelete} className="px-3 py-1.5 rounded bg-red-600 text-white hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
