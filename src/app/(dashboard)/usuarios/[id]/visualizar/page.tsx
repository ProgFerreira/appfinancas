'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';

type Item = { id: number; nome: string; email: string; perfil: string; status: string; ativo: number; created_at: string };

const perfilLabel: Record<string, string> = { administrador: 'Administrador', financeiro: 'Financeiro', diretoria: 'Diretoria', operacao: 'Operação' };

export default function VisualizarUsuarioPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [data, setData] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/usuarios/${id}`)
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
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Usuários', href: '/usuarios' }, { label: 'Visualizar' }]} />
        <div className="mt-4 p-6 text-slate-500">Carregando...</div>
      </>
    );
  }
  if (error || !data) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Usuários', href: '/usuarios' }, { label: 'Visualizar' }]} />
        <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-800">{error ?? 'Registro não encontrado.'}</div>
        <Link href="/usuarios" className="mt-4 inline-block text-indigo-600 hover:underline">Voltar à listagem</Link>
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Usuários', href: '/usuarios' }, { label: 'Visualizar' }]} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-800">Visualizar usuário</h2>
        <div className="flex gap-2">
          <Link href={`/usuarios/${id}/editar`} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Editar</Link>
          <Link href="/usuarios" className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Voltar</Link>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><span className="text-slate-500 text-sm">Nome</span><p className="font-medium text-slate-800">{data.nome}</p></div>
          <div><span className="text-slate-500 text-sm">E-mail</span><p className="text-slate-800">{data.email}</p></div>
          <div><span className="text-slate-500 text-sm">Perfil</span><p className="text-slate-800">{perfilLabel[data.perfil] ?? data.perfil}</p></div>
          <div><span className="text-slate-500 text-sm">Status</span><p className="text-slate-800"><span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${data.status === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>{data.status}</span></p></div>
          <div><span className="text-slate-500 text-sm">Ativo</span><p className="text-slate-800">{data.ativo ? 'Sim' : 'Não'}</p></div>
          <div><span className="text-slate-500 text-sm">Criado em</span><p className="text-slate-800">{data.created_at ? new Date(data.created_at).toLocaleString('pt-BR') : '—'}</p></div>
        </div>
      </div>
    </>
  );
}
