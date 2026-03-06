'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';

type Veiculo = { id: number; placa: string; modelo: string; tipo: string; ano: number | null; ativo: number };
type Item = {
  id: number; nome: string; cpf: string; telefone: string | null; email: string | null;
  tipo_vinculo: string; observacoes: string | null; ativo: number;
  veiculos?: Veiculo[];
};

export default function VisualizarMotoristaPage() {
  const params = useParams();
  const id = String(params?.id ?? '');
  const [data, setData] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [veiculosDisponiveis, setVeiculosDisponiveis] = useState<{ id: number; placa: string; modelo: string }[]>([]);
  const [vincularVeiculoId, setVincularVeiculoId] = useState('');
  const [vincularLoading, setVincularLoading] = useState(false);
  const [vincularError, setVincularError] = useState('');

  const loadMotorista = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/motoristas/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) setData(result.data);
        else setError(result.error ?? 'Erro ao carregar');
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadMotorista();
  }, [loadMotorista]);

  useEffect(() => {
    fetch('/api/veiculos?per_page=200&ativo=1')
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) setVeiculosDisponiveis(result.data);
      })
      .catch(() => {});
  }, []);

  if (loading) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Motoristas', href: '/motoristas' }, { label: 'Visualizar' }]} />
        <div className="mt-4 p-6 text-slate-500">Carregando...</div>
      </>
    );
  }
  async function handleVincularVeiculo(e: React.FormEvent) {
    e.preventDefault();
    if (!vincularVeiculoId) return;
    setVincularError('');
    setVincularLoading(true);
    try {
      const res = await fetch(`/api/motoristas/${id}/veiculos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ veiculo_id: parseInt(vincularVeiculoId, 10) }),
      });
      const result = await res.json();
      if (result.success) {
        setVincularVeiculoId('');
        loadMotorista();
      } else setVincularError(result.error ?? 'Erro ao vincular.');
    } catch {
      setVincularError('Erro de conexão.');
    } finally {
      setVincularLoading(false);
    }
  }

  async function handleDesvincular(veiculoId: number) {
    if (!confirm('Desvincular este veículo do motorista?')) return;
    try {
      const res = await fetch(`/api/motoristas/${id}/veiculos/${veiculoId}`, { method: 'DELETE' });
      const result = await res.json();
      if (result.success) loadMotorista();
    } catch {}
  }

  if (error || !data) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Motoristas', href: '/motoristas' }, { label: 'Visualizar' }]} />
        <div className="mt-4 p-4 rounded-lg bg-red-50 text-red-800">{error ?? 'Registro não encontrado.'}</div>
        <Link href="/motoristas" className="mt-4 inline-block text-indigo-600 hover:underline">Voltar à listagem</Link>
      </>
    );
  }

  const veiculos = data.veiculos ?? [];

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Motoristas', href: '/motoristas' }, { label: 'Visualizar' }]} />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-800">Visualizar motorista</h2>
        <div className="flex gap-2">
          <Link href={`/motoristas/${id}/editar`} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700">Editar</Link>
          <Link href="/motoristas" className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm">Voltar</Link>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><span className="text-slate-500 text-sm">Nome</span><p className="font-medium text-slate-800">{data.nome}</p></div>
          <div><span className="text-slate-500 text-sm">CPF</span><p className="text-slate-800">{data.cpf}</p></div>
          <div><span className="text-slate-500 text-sm">Tipo vínculo</span><p className="text-slate-800">{data.tipo_vinculo}</p></div>
          <div><span className="text-slate-500 text-sm">E-mail</span><p className="text-slate-800">{data.email ?? '—'}</p></div>
          <div><span className="text-slate-500 text-sm">Telefone</span><p className="text-slate-800">{data.telefone ?? '—'}</p></div>
          <div><span className="text-slate-500 text-sm">Ativo</span><p className="text-slate-800">{data.ativo ? 'Sim' : 'Não'}</p></div>
          {data.observacoes && (
            <div className="md:col-span-2"><span className="text-slate-500 text-sm">Observações</span><p className="text-slate-800">{data.observacoes}</p></div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-slate-800 mb-3">Veículos vinculados</h3>
        <p className="text-sm text-slate-600 mb-4">Todo motorista pode ter um ou mais veículos vinculados. Vincule ou desvincule abaixo.</p>

        <form onSubmit={handleVincularVeiculo} className="flex flex-wrap gap-2 items-end mb-4">
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1">Vincular veículo</label>
            <select
              value={vincularVeiculoId}
              onChange={(e) => setVincularVeiculoId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200"
            >
              <option value="">— Selecione —</option>
              {veiculosDisponiveis.map((v) => (
                <option key={v.id} value={v.id}>{v.placa} – {v.modelo}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={vincularLoading || !vincularVeiculoId} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50">
            {vincularLoading ? 'Vinculando...' : 'Vincular'}
          </button>
        </form>
        {vincularError && <div className="mb-4 p-2 rounded bg-red-50 text-red-800 text-sm">{vincularError}</div>}

        {veiculos.length === 0 ? (
          <p className="text-slate-500 text-sm">Nenhum veículo vinculado a este motorista.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {veiculos.map((v) => (
              <li key={v.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <Link href={`/veiculos/${v.id}/visualizar`} className="font-medium text-indigo-600 hover:underline">{v.placa}</Link>
                  <span className="text-slate-600 ml-2">{v.modelo} · {v.tipo}{v.ano ? ` · ${v.ano}` : ''}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDesvincular(v.id)}
                  className="px-3 py-1 rounded border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
                >
                  Desvincular
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
