'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Usuario } from '@/types';
import type { TarefaStatus, TarefaPrioridade } from '@/types';

const STATUS_OPTIONS: { value: TarefaStatus; label: string }[] = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
];

const PRIORIDADE_OPTIONS: { value: TarefaPrioridade; label: string }[] = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
];

type Props = { id?: string };

export function TarefaForm({ id }: Props) {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [unidades, setUnidades] = useState<{ id: number; nome: string }[]>([]);
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    status: 'pendente' as TarefaStatus,
    prioridade: 'media' as TarefaPrioridade,
    unidade_id: '' as number | '',
    data_vencimento: '',
    responsavel_id: '' as number | '',
  });

  useEffect(() => {
    fetch('/api/usuarios?per_page=100')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) setUsuarios(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/tarefa-unidades?ativo=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setUnidades(data.data.map((u: { id: number; nome: string }) => ({ id: u.id, nome: u.nome })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/tarefas/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const d = data.data;
          setForm({
            titulo: d.titulo ?? '',
            descricao: d.descricao ?? '',
            status: (STATUS_OPTIONS.some((o) => o.value === d.status) ? d.status : 'pendente') as TarefaStatus,
            prioridade: (PRIORIDADE_OPTIONS.some((o) => o.value === d.prioridade) ? d.prioridade : 'media') as TarefaPrioridade,
            unidade_id: d.unidade_id ?? '',
            data_vencimento: d.data_vencimento ? d.data_vencimento.slice(0, 10) : '',
            responsavel_id: d.responsavel_id ?? '',
          });
        } else setError('Tarefa não encontrada.');
      })
      .catch(() => setError('Erro ao carregar.'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.titulo.trim()) {
      setError('Título é obrigatório.');
      return;
    }
    if (!form.unidade_id) {
      setError('Unidade é obrigatória.');
      return;
    }
    if (!form.responsavel_id) {
      setError('Responsável é obrigatório.');
      return;
    }
    setSaving(true);
    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      status: form.status,
      prioridade: form.prioridade,
      unidade_id: Number(form.unidade_id),
      data_vencimento: form.data_vencimento.trim() || null,
      responsavel_id: Number(form.responsavel_id),
    };
    const url = id ? `/api/tarefas/${id}` : '/api/tarefas';
    const method = id ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        if (id) {
          router.push('/tarefas');
        } else {
          router.push('/tarefas?created=1');
        }
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
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 max-w-2xl">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
          <input
            type="text"
            required
            value={form.titulo}
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
          <textarea
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as TarefaStatus }))
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Prioridade</label>
            <select
              value={form.prioridade}
              onChange={(e) =>
                setForm((f) => ({ ...f, prioridade: e.target.value as TarefaPrioridade }))
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              {PRIORIDADE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Unidade *</label>
          <select
            value={form.unidade_id}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                unidade_id: e.target.value ? Number(e.target.value) : '',
              }))
            }
            required
            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Selecione a unidade</option>
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Data de vencimento
            </label>
            <input
              type="date"
              value={form.data_vencimento}
              onChange={(e) => setForm((f) => ({ ...f, data_vencimento: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Responsável *</label>
            <select
              value={form.responsavel_id}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  responsavel_id: e.target.value ? Number(e.target.value) : '',
                }))
              }
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione o responsável</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
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
            href="/tarefas"
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
