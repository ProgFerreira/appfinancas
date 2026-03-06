'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';
import type { DocumentoPermissao } from '@/types';
import type { Usuario } from '@/types';

export default function PermissoesDocumentoPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [docNome, setDocNome] = useState('');
  const [perms, setPerms] = useState<(DocumentoPermissao & { user_nome?: string | null })[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [addUserId, setAddUserId] = useState('');
  const [addView, setAddView] = useState(true);
  const [addDownload, setAddDownload] = useState(false);
  const [addEdit, setAddEdit] = useState(false);
  const [addDelete, setAddDelete] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    Promise.all([
      fetch(`/api/documentos/${id}`).then((r) => r.json()),
      fetch(`/api/documentos/${id}/permissoes`).then((r) => r.json()),
      fetch('/api/usuarios?per_page=100').then((r) => r.json()),
    ])
      .then(([docRes, permsRes, usersRes]) => {
        if (docRes.success && docRes.data) setDocNome(docRes.data.nome);
        if (docRes.success && !docRes.data?.can_edit) setError('Sem permissão para gerenciar este documento.');
        if (permsRes.success && permsRes.data) setPerms(permsRes.data);
        if (usersRes.success && usersRes.data) setUsuarios(usersRes.data);
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = parseInt(addUserId, 10);
    if (!Number.isInteger(uid) || uid < 1) { setError('Selecione um usuário.'); return; }
    setError('');
    setSaving(true);
    try {
      const res = await fetch(`/api/documentos/${id}/permissoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: uid,
          can_view: addView ? 1 : 0,
          can_download: addDownload ? 1 : 0,
          can_edit: addEdit ? 1 : 0,
          can_delete: addDelete ? 1 : 0,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const permsRes = await fetch(`/api/documentos/${id}/permissoes`);
        const permsData = await permsRes.json();
        if (permsData.success && permsData.data) setPerms(permsData.data);
        setAddUserId('');
        setAddView(true);
        setAddDownload(false);
        setAddEdit(false);
        setAddDelete(false);
      } else setError(data.error ?? 'Erro ao salvar.');
    } catch {
      setError('Erro de conexão.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (permId: number) => {
    setRemovingId(permId);
    try {
      const res = await fetch(`/api/documentos/${id}/permissoes?perm_id=${permId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) setPerms((p) => p.filter((x) => x.id !== permId));
      else setError(data.error ?? 'Erro ao remover.');
    } catch {
      setError('Erro de conexão.');
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documentos', href: '/documentos' }, { label: 'Permissões' }]} />
        <div className="mt-4 p-6 text-slate-500">Carregando...</div>
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documentos', href: '/documentos' }, { label: docNome || 'Documento' }, { label: 'Permissões' }]} />
      <div className="mt-4 max-w-3xl">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Permissões: {docNome || id}</h2>
          <Link href={`/documentos/${id}/visualizar`} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Voltar</Link>
        </div>
        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
          <div>
            <h3 className="font-medium text-slate-800 mb-2">Adicionar permissão</h3>
            <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px]">
                <label className="block text-xs text-slate-500 mb-1">Usuário</label>
                <select
                  value={addUserId}
                  onChange={(e) => setAddUserId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                >
                  <option value="">— Selecione —</option>
                  {usuarios
                    .filter((u) => !perms.some((p) => p.user_id === u.id))
                    .map((u) => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={addView} onChange={(e) => setAddView(e.target.checked)} /> Visualizar</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={addDownload} onChange={(e) => setAddDownload(e.target.checked)} /> Baixar</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={addEdit} onChange={(e) => setAddEdit(e.target.checked)} /> Editar</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={addDelete} onChange={(e) => setAddDelete(e.target.checked)} /> Excluir</label>
              </div>
              <button type="submit" disabled={saving || !addUserId} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Adicionar'}</button>
            </form>
          </div>

          <div>
            <h3 className="font-medium text-slate-800 mb-2">Permissões atuais</h3>
            {perms.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhuma permissão adicional. O dono do documento tem acesso total. Adicione usuários acima.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {perms.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2">
                    <span className="font-medium text-slate-800">{p.user_nome ?? `Usuário #${p.user_id}`}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500">
                        {p.can_view ? 'Ver ' : ''}{p.can_download ? 'Baixar ' : ''}{p.can_edit ? 'Editar ' : ''}{p.can_delete ? 'Excluir' : ''}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemove(p.id)}
                        disabled={removingId === p.id}
                        className="text-red-600 hover:underline text-sm disabled:opacity-50"
                      >
                        {removingId === p.id ? 'Removendo...' : 'Remover'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
