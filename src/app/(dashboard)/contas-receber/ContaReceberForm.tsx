'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

type Options = {
  categoriasReceita: { id: number; nome: string }[];
  contasBancarias: { id: number; descricao: string }[];
  clientes: { id: number; nome: string }[];
  planoContas: { id: number; codigo: string; nome: string }[];
};

export function ContaReceberForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [options, setOptions] = useState<Options | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    cliente_id: '' as number | '',
    categoria_receita_id: '' as number | '',
    plano_contas_id: '' as number | '',
    descricao: '',
    valor: '',
    data_emissao: new Date().toISOString().slice(0, 10),
    data_vencimento: '',
    conta_bancaria_id: '' as number | '',
    cte_id: '' as number | '',
    observacoes: '',
  });

  useEffect(() => {
    fetch('/api/cadastros/options')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setOptions(data.data);
          const hoje = new Date().toISOString().slice(0, 10);
          setForm((f) => ({ ...f, data_vencimento: f.data_vencimento || hoje }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const conta = searchParams.get('conta_bancaria_id');
    const valor = searchParams.get('valor');
    const dataVenc = searchParams.get('data_vencimento');
    const desc = searchParams.get('descricao');
    if (conta || valor || dataVenc || desc) {
      setForm((f) => ({
        ...f,
        ...(conta && { conta_bancaria_id: Number(conta) || ('' as number | '') }),
        ...(valor != null && valor !== '' && { valor: String(valor).replace('.', ',') }),
        ...(dataVenc && { data_vencimento: dataVenc, data_emissao: dataVenc }),
        ...(desc != null && desc !== '' && { descricao: decodeURIComponent(desc) }),
      }));
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      cliente_id: Number(form.cliente_id),
      categoria_receita_id: form.categoria_receita_id || null,
      plano_contas_id: form.plano_contas_id || null,
      descricao: form.descricao || null,
      valor: Number(form.valor.replace(',', '.')),
      data_emissao: form.data_emissao,
      data_vencimento: form.data_vencimento,
      conta_bancaria_id: form.conta_bancaria_id || null,
      cte_id: form.cte_id || null,
      observacoes: form.observacoes || null,
    };
    try {
      const res = await fetch('/api/contas-receber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data: { success?: boolean; error?: string } = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        setError('Resposta inválida do servidor. Tente novamente.');
        setSaving(false);
        return;
      }
      if (data.success) {
        router.push('/contas-receber');
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

  if (loading || !options) {
    return <div className="p-6 text-slate-500">Carregando opções...</div>;
  }

  return (
    <div className="form-card form-contraste">
      {error && (
        <div className="mx-6 mt-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="form-grid-4">
          <div>
            <label className="form-label">Cliente *</label>
            <select
              required
              value={form.cliente_id}
              onChange={(e) => setForm((f) => ({ ...f, cliente_id: Number(e.target.value) }))}
            >
              <option value="">— Selecione —</option>
              {options.clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Categoria receita</label>
            <select
              value={form.categoria_receita_id}
              onChange={(e) => setForm((f) => ({ ...f, categoria_receita_id: e.target.value ? Number(e.target.value) : '' }))}
            >
              <option value="">— Selecione —</option>
              {options.categoriasReceita.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Plano de contas</label>
            <select
              value={form.plano_contas_id}
              onChange={(e) => setForm((f) => ({ ...f, plano_contas_id: e.target.value ? Number(e.target.value) : '' }))}
            >
              <option value="">— Selecione —</option>
              {(options.planoContas ?? []).map((p) => (
                <option key={p.id} value={p.id}>{p.codigo} – {p.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Descrição</label>
            <input
              type="text"
              value={form.descricao}
              onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
              placeholder="Descrição da receita"
            />
          </div>

          <div>
            <label className="form-label">Valor (R$) *</label>
            <input
              type="text"
              required
              value={form.valor}
              onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
              placeholder="0,00"
            />
          </div>
          <div>
            <label className="form-label">Conta bancária</label>
            <select
              value={form.conta_bancaria_id}
              onChange={(e) => setForm((f) => ({ ...f, conta_bancaria_id: e.target.value ? Number(e.target.value) : '' }))}
            >
              <option value="">— Selecione —</option>
              {options.contasBancarias.map((c) => (
                <option key={c.id} value={c.id}>{c.descricao}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Data emissão *</label>
            <input
              type="date"
              required
              value={form.data_emissao}
              onChange={(e) => setForm((f) => ({ ...f, data_emissao: e.target.value }))}
            />
          </div>
          <div>
            <label className="form-label">Data vencimento *</label>
            <input
              type="date"
              required
              value={form.data_vencimento}
              onChange={(e) => setForm((f) => ({ ...f, data_vencimento: e.target.value }))}
            />
          </div>

          <div>
            <label className="form-label">ID CTe</label>
            <input
              type="number"
              min={0}
              value={form.cte_id === '' ? '' : form.cte_id}
              onChange={(e) => setForm((f) => ({ ...f, cte_id: e.target.value === '' ? '' : Number(e.target.value) }))}
              placeholder="Opcional"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="form-label">Observações</label>
          <textarea
            rows={2}
            value={form.observacoes}
            onChange={(e) => setForm((f) => ({ ...f, observacoes: e.target.value }))}
            placeholder="Observações adicionais"
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          <Link href="/contas-receber" className="btn btn-secondary">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
