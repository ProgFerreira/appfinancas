'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { CoverageEditor } from './CoverageEditor';

const TIPOS = ['RODOVIARIO', 'AEREO', 'AMBOS'] as const;

type PartnerFormProps = {
  partnerId?: number | null;
};

export default function PartnerForm({ partnerId }: PartnerFormProps) {
  const router = useRouter();
  const params = useParams();
  const id = partnerId ?? (params?.id ? parseInt(String(params.id), 10) : null);
  const isEdit = id != null && !Number.isNaN(id) && id > 0;

  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<string>(TIPOS[0]);
  const [cnpj, setCnpj] = useState('');
  const [contato, setContato] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [ativo, setAtivo] = useState(1);
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadDone, setLoadDone] = useState(!isEdit);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    fetch(`/api/partners/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          const p = data.data;
          setNome(p.nome ?? '');
          setTipo(p.tipo ?? TIPOS[0]);
          setCnpj(p.cnpj ?? '');
          setContato(p.contato ?? '');
          setEmail(p.email ?? '');
          setTelefone(p.telefone ?? '');
          setAtivo(p.ativo ?? 1);
          setObservacoes(p.observacoes ?? '');
        }
      })
      .catch(() => setError('Erro ao carregar'))
      .finally(() => { setLoading(false); setLoadDone(true); });
  }, [id, isEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nome.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    setLoading(true);
    const body = {
      nome: nome.trim(),
      tipo,
      cnpj: cnpj.trim() || null,
      contato: contato.trim() || null,
      email: email.trim() || null,
      telefone: telefone.trim() || null,
      ativo,
      observacoes: observacoes.trim() || null,
    };
    const url = isEdit ? `/api/partners/${id}` : '/api/partners';
    const method = isEdit ? 'PUT' : 'POST';
    fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (isEdit) router.push('/cadastros/parceiros');
          else router.push(`/cadastros/parceiros/${data.data?.id ?? ''}/editar`);
          router.refresh();
        } else setError(data.error || 'Erro ao salvar');
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false));
  };

  if (!loadDone && isEdit) return <p className="text-slate-500">Carregando...</p>;

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white shadow-sm p-6 max-w-2xl space-y-4">
      {error && <div className="p-3 rounded bg-red-50 text-red-800 text-sm">{error}</div>}
      <label>
        <span className="block text-sm font-medium text-slate-700 mb-1">Nome *</span>
        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" required />
      </label>
      <label>
        <span className="block text-sm font-medium text-slate-700 mb-1">Tipo</span>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm">
          {TIPOS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label>
          <span className="block text-sm font-medium text-slate-700 mb-1">CNPJ</span>
          <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label>
          <span className="block text-sm font-medium text-slate-700 mb-1">Contato</span>
          <input type="text" value={contato} onChange={(e) => setContato(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label>
          <span className="block text-sm font-medium text-slate-700 mb-1">E-mail</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label>
          <span className="block text-sm font-medium text-slate-700 mb-1">Telefone</span>
          <input type="text" value={telefone} onChange={(e) => setTelefone(e.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
        </label>
      </div>
      <label>
        <span className="block text-sm font-medium text-slate-700 mb-1">Observações</span>
        <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={ativo === 1} onChange={(e) => setAtivo(e.target.checked ? 1 : 0)} />
        <span className="text-sm text-slate-700">Ativo</span>
      </label>
      {isEdit && id != null && (
        <div className="pt-2">
          <CoverageEditor partnerId={id} />
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
          {loading ? 'Salvando...' : isEdit ? 'Atualizar' : 'Cadastrar'}
        </button>
        <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-slate-300 rounded text-sm text-slate-700 hover:bg-slate-50">
          Voltar
        </button>
      </div>
    </form>
  );
}
