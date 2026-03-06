'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Permission = { id: number; code: string; nome: string; descricao: string | null };
type UserOption = { id: number; nome: string; email: string };

type Props = { id?: string };

export function PerfilForm({ id }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [form, setForm] = useState({
    nome: '',
    descricao: '',
    ativo: 1,
    permission_ids: [] as number[],
    user_ids: [] as number[],
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/permissions').then((r) => r.json()),
      fetch('/api/usuarios?per_page=500').then((r) => r.json()),
    ]).then(([permRes, usersRes]) => {
      if (permRes.success && permRes.data) setPermissions(permRes.data);
      if (usersRes.success && usersRes.data) {
        setAllUsers(usersRes.data.map((u: { id: number; nome: string; email: string }) => ({ id: u.id, nome: u.nome, email: u.email })));
      }
    });
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/perfis/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const d = data.data;
          setForm({
            nome: d.nome ?? '',
            descricao: d.descricao ?? '',
            ativo: d.ativo ?? 1,
            permission_ids: Array.isArray(d.permission_ids) ? d.permission_ids : [],
            user_ids: Array.isArray(d.usuarios) ? d.usuarios.map((u: { user_id: number }) => u.user_id) : [],
          });
        } else setError('Perfil não encontrado.');
      })
      .catch(() => setError('Erro ao carregar.'))
      .finally(() => setLoading(false));
  }, [id]);

  const togglePermission = (permId: number) => {
    setForm((f) => ({
      ...f,
      permission_ids: f.permission_ids.includes(permId)
        ? f.permission_ids.filter((x) => x !== permId)
        : [...f.permission_ids, permId],
    }));
  };

  const toggleUser = (userId: number) => {
    setForm((f) => ({
      ...f,
      user_ids: f.user_ids.includes(userId)
        ? f.user_ids.filter((x) => x !== userId)
        : [...f.user_ids, userId],
    }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.nome.trim()) {
      setError('Nome do perfil é obrigatório.');
      return;
    }
    setSaving(true);
    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      ativo: form.ativo,
      permission_ids: form.permission_ids,
      user_ids: form.user_ids,
    };
    const url = id ? `/api/perfis/${id}` : '/api/perfis';
    try {
      const res = await fetch(url, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/perfis');
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
  }

  if (loading) return <div className="p-6 text-slate-500">Carregando...</div>;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 max-w-4xl">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do perfil *</label>
            <input
              type="text"
              required
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
              placeholder="Ex: Financeiro, Operação"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={form.ativo}
              onChange={(e) => setForm((f) => ({ ...f, ativo: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            >
              <option value={1}>Ativo</option>
              <option value={0}>Inativo</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <input
            type="text"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200"
            placeholder="Opcional"
          />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Telas que este perfil pode acessar</h3>
          <p className="text-xs text-slate-500 mb-2">
            Marque as permissões para liberar o acesso às telas do sistema.
          </p>
          <div className="border border-slate-200 rounded-lg p-3 max-h-64 overflow-y-auto bg-slate-50/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {permissions.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.permission_ids.includes(p.id)}
                    onChange={() => togglePermission(p.id)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="text-sm text-slate-800">{p.nome}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-800 mb-2">Usuários com este perfil</h3>
          <p className="text-xs text-slate-500 mb-2">
            Marque os usuários que terão este perfil (acesso às telas marcadas acima).
          </p>
          <div className="border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto bg-slate-50/50">
            <div className="flex flex-col gap-1">
              {allUsers.map((u) => (
                <label
                  key={u.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.user_ids.includes(u.id)}
                    onChange={() => toggleUser(u.id)}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="text-sm text-slate-800">{u.nome}</span>
                  <span className="text-xs text-slate-500">({u.email})</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <Link
            href="/perfis"
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
