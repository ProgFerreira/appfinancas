'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';
import type { Documento } from '@/types';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string | null | undefined): string {
  if (dateStr == null || String(dateStr).trim() === '') return '—';
  try {
    const d = new Date(dateStr + 'T12:00:00.000Z');
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR');
  } catch {
    return '—';
  }
}

export default function VisualizarDocumentoPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [data, setData] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/documentos/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) setData(result.data);
        else setError(result.error ?? 'Erro ao carregar');
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documentos', href: '/documentos' }, { label: 'Visualizar' }]} />
        <div className="mt-4 p-6 text-slate-500">Carregando...</div>
      </>
    );
  }
  if (error || !data) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documentos', href: '/documentos' }, { label: 'Visualizar' }]} />
        <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-800">{error ?? 'Documento não encontrado.'}</div>
        <Link href="/documentos" className="mt-4 inline-block text-indigo-600 hover:underline">Voltar</Link>
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documentos', href: '/documentos' }, { label: 'Visualizar' }]} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-800">{data.nome}</h2>
        <div className="flex gap-2">
          {data.can_download ? (
            <a
              href={`/api/documentos/${id}/download`}
              download
              className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
            >
              Baixar
            </a>
          ) : null}
          {data.can_edit ? (
            <Link href={`/documentos/${id}/editar`} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Editar</Link>
          ) : null}
          {data.can_edit ? (
            <Link href={`/documentos/${id}/permissoes`} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Permissões</Link>
          ) : null}
          <Link href="/documentos" className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Voltar</Link>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><span className="text-slate-500 text-sm">Nome</span><p className="font-medium text-slate-800">{data.nome}</p></div>
          <div><span className="text-slate-500 text-sm">Arquivo original</span><p className="text-slate-800">{data.nome_arquivo}</p></div>
          <div><span className="text-slate-500 text-sm">Data de vencimento</span><p className="text-slate-800">{formatDate(data.data_vencimento)}</p></div>
          <div><span className="text-slate-500 text-sm">Tipo de documento</span><p className="text-slate-800">{data.tipo_documento_nome ?? '—'}</p></div>
          <div><span className="text-slate-500 text-sm">Tipo MIME</span><p className="text-slate-800">{data.mime_type ?? '—'}</p></div>
          <div><span className="text-slate-500 text-sm">Tamanho</span><p className="text-slate-800">{formatBytes(data.tamanho)}</p></div>
          <div><span className="text-slate-500 text-sm">Enviado por</span><p className="text-slate-800">{data.created_by_nome ?? '—'}</p></div>
          <div className="md:col-span-2"><span className="text-slate-500 text-sm">Descrição</span><p className="text-slate-800 whitespace-pre-wrap">{data.descricao ?? '—'}</p></div>
        </div>
      </div>
    </>
  );
}
