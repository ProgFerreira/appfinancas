'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Props = { id?: string };

const PERFIS = ['administrador', 'financeiro', 'diretoria', 'operacao'] as const;

type RoleOption = { id: number; nome: string };

export function UsuarioForm({ id }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    senha: '',
    perfil: 'operacao' as (typeof PERFIS)[number],
    status: 'ativo' as 'ativo' | 'inativo',
    ativo: 1,
    role_ids: [] as number[],
  });

  useEffect(() => {
    fetch('/api/perfis')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) setRoles(data.data.map((r: { id: number; nome: string }) => ({ id: r.id, nome: r.nome })));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    fetch(`/api/usuarios/${id}`).then((res) => res.json()).then((data) => {
      if (data.success && data.data) {
        const d = data.data;
        setForm({
          nome: d.nome ?? '',
          email: d.email ?? '',
          senha: '',
          perfil: PERFIS.includes(d.perfil as (typeof PERFIS)[number]) ? d.perfil : 'operacao',
          status: d.status === 'inativo' ? 'inativo' : 'ativo',
          ativo: d.ativo ?? 1,
          role_ids: Array.isArray(d.role_ids) ? d.role_ids : [],
        });
      } else setError('Usuário não encontrado.');
    }).catch(() => setError('Erro ao carregar.')).finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!id && (!form.senha || form.senha.length < 6)) {
      setError('Senha é obrigatória (mínimo 6 caracteres).');
      return;
    }
    setSaving(true);
    const payload: Record<string, unknown> = {
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      perfil: form.perfil,
      status: form.status,
      ativo: form.ativo,
      role_ids: form.role_ids,
    };
    if (form.senha) payload.senha = form.senha;
    const url = id ? `/api/usuarios/${id}` : '/api/usuarios';
    try {
      const res = await fetch(url, { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { router.push('/usuarios'); router.refresh(); return; }
      setError(data.error ?? 'Erro ao salvar.');
      if (res.status === 401) router.push('/login');
    } catch { setError('Erro de conexão.'); } finally { setSaving(false); }
  }

  if (loading) return <div className="p-6 text-slate-500">Carregando...</div>;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 max-w-2xl">
      {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
          <input type="text" required value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">E-mail *</label>
          <input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">{id ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}</label>
          <input type="password" value={form.senha} onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))} placeholder={id ? 'Opcional' : 'Mín. 6 caracteres'} minLength={id ? undefined : 6} className="w-full px-3 py-2 rounded-lg border border-slate-200" />
        </div>
        <div className="form-grid">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Perfil *</label>
            <select value={form.perfil} onChange={(e) => setForm((f) => ({ ...f, perfil: e.target.value as (typeof PERFIS)[number] }))} className="w-full px-3 py-2 rounded-lg border border-slate-200">
              {PERFIS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as 'ativo' | 'inativo' }))} className="w-full px-3 py-2 rounded-lg border border-slate-200">
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.ativo === 1} onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked ? 1 : 0 }))} className="rounded border-slate-300 text-indigo-600" />
          <span className="text-sm text-slate-700">Ativo</span>
        </label>
        {roles.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Perfis de acesso (telas)</label>
            <p className="text-xs text-slate-500 mb-2">Marque os perfis que definem quais telas este usuário pode acessar.</p>
            <div className="flex flex-wrap gap-3 border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              {roles.map((r) => (
                <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.role_ids.includes(r.id)}
                    onChange={(e) => setForm((f) => ({ ...f, role_ids: e.target.checked ? [...f.role_ids, r.id] : f.role_ids.filter((id) => id !== r.id) }))}
                    className="rounded border-slate-300 text-indigo-600"
                  />
                  <span className="text-sm text-slate-800">{r.nome}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Salvando...' : 'Salvar'}</button>
          <Link href="/usuarios" className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">Cancelar</Link>
        </div>
      </form>
    </div>
  );
}
