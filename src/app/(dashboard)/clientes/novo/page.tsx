'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ClienteForm } from '../ClienteForm';

const TABS = [
  { id: 'dados', label: 'Dados gerais' },
  { id: 'contatos', label: 'Contatos' },
  { id: 'bancarios', label: 'Dados bancários' },
  { id: 'categorias', label: 'Categorias' },
] as const;

const TIPOS_CONTATO = [
  { value: 'financeiro', label: 'Financeiro' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'outros', label: 'Outros' },
];

const CATEGORIAS_OPCOES = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'funcionario', label: 'Funcionário' },
  { value: 'parceiro', label: 'Parceiro' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'outros', label: 'Outros' },
];

type DraftContato = {
  tipo: 'financeiro' | 'comercial' | 'outros';
  nome: string;
  telefone: string;
  whatsapp: string;
  email: string;
  observacoes: string;
  ativo: number;
};

type DraftDadoBancario = {
  favorecido: string;
  cnpj_cpf: string;
  banco: string;
  agencia: string;
  conta: string;
  operacao: string;
  pix: string;
  observacoes: string;
  ativo: number;
};

export default function NovoClientePage() {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('dados');
  const [draftContatos, setDraftContatos] = useState<DraftContato[]>([]);
  const [draftDadosBancarios, setDraftDadosBancarios] = useState<DraftDadoBancario[]>([]);
  const [draftCategorias, setDraftCategorias] = useState<string[]>([]);

  // Formulário em branco para adicionar contato
  const [formContato, setFormContato] = useState<DraftContato>({
    tipo: 'comercial',
    nome: '',
    telefone: '',
    whatsapp: '',
    email: '',
    observacoes: '',
    ativo: 1,
  });

  const [formDadoBancario, setFormDadoBancario] = useState<DraftDadoBancario>({
    favorecido: '',
    cnpj_cpf: '',
    banco: '',
    agencia: '',
    conta: '',
    operacao: '',
    pix: '',
    observacoes: '',
    ativo: 1,
  });

  const [categoriaToAdd, setCategoriaToAdd] = useState<string>('cliente');
  const [savingDrafts, setSavingDrafts] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);

  const disponiveisCategorias = CATEGORIAS_OPCOES.filter((c) => !draftCategorias.includes(c.value));

  async function handleSuccessCreate(newId: number) {
    setSavingDrafts(true);
    setDraftError(null);
    try {
      for (const c of draftContatos) {
        const r = await fetch(`/api/clientes/${newId}/contatos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(c),
        });
        const text = await r.text();
        if (!r.ok) {
          let detail = text.slice(0, 300);
          try {
            const j = JSON.parse(text) as { error?: string; detail?: string };
            detail = [j.error, j.detail].filter(Boolean).join(' — ') || detail;
          } catch {
            // use raw slice
          }
          setDraftError(`Contatos: HTTP ${r.status}. ${detail}`);
          setSavingDrafts(false);
          return;
        }
      }
      for (const d of draftDadosBancarios) {
        const r = await fetch(`/api/clientes/${newId}/dados-bancarios`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(d),
        });
        const text = await r.text();
        if (!r.ok) {
          let detail = text.slice(0, 300);
          try {
            const j = JSON.parse(text) as { error?: string; detail?: string };
            detail = [j.error, j.detail].filter(Boolean).join(' — ') || detail;
          } catch {
            //
          }
          setDraftError(`Dados bancários: HTTP ${r.status}. ${detail}`);
          setSavingDrafts(false);
          return;
        }
      }
      for (const cat of draftCategorias) {
        const r = await fetch(`/api/clientes/${newId}/categorias`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoria: cat }),
        });
        const text = await r.text();
        if (!r.ok) {
          let detail = text.slice(0, 300);
          try {
            const j = JSON.parse(text) as { error?: string; detail?: string };
            detail = [j.error, j.detail].filter(Boolean).join(' — ') || detail;
          } catch {
            //
          }
          setDraftError(`Categorias: HTTP ${r.status}. ${detail}`);
          setSavingDrafts(false);
          return;
        }
      }
      router.push('/clientes?created=1');
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setDraftError(`Erro ao salvar: ${msg}`);
    } finally {
      setSavingDrafts(false);
    }
  }

  function addContato(e: React.FormEvent) {
    e.preventDefault();
    setDraftContatos((prev) => [...prev, { ...formContato }]);
    setFormContato({
      tipo: 'comercial',
      nome: '',
      telefone: '',
      whatsapp: '',
      email: '',
      observacoes: '',
      ativo: 1,
    });
  }

  function removeContato(i: number) {
    setDraftContatos((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addDadoBancario(e: React.FormEvent) {
    e.preventDefault();
    setDraftDadosBancarios((prev) => [...prev, { ...formDadoBancario }]);
    setFormDadoBancario({
      favorecido: '',
      cnpj_cpf: '',
      banco: '',
      agencia: '',
      conta: '',
      operacao: '',
      pix: '',
      observacoes: '',
      ativo: 1,
    });
  }

  function removeDadoBancario(i: number) {
    setDraftDadosBancarios((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addCategoria() {
    if (draftCategorias.includes(categoriaToAdd)) return;
    setDraftCategorias((prev) => [...prev, categoriaToAdd]);
  }

  function removeCategoria(cat: string) {
    setDraftCategorias((prev) => prev.filter((c) => c !== cat));
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Clientes', href: '/clientes' },
          { label: 'Novo cliente' },
        ]}
      />
      <div className="mt-4">
        {draftError && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 border-2 border-red-300 text-red-800 text-sm">
            <p className="font-medium">Erro (exibido na tela para debug)</p>
            <p className="whitespace-pre-wrap break-words mt-1">{draftError}</p>
          </div>
        )}
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Novo cliente</h2>
        <p className="text-sm text-slate-500 mb-4">Apenas <strong>Nome</strong> e <strong>Razão social</strong> são obrigatórios; os demais são opcionais.</p>
        <div className="border-b border-slate-200 mb-4">
          <nav className="flex gap-1" aria-label="Abas">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  tab === t.id
                    ? 'bg-white border border-slate-200 border-b-0 text-indigo-600 -mb-px'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        {tab === 'dados' && (
          <ClienteForm
            onSuccessCreate={
              draftContatos.length > 0 || draftDadosBancarios.length > 0 || draftCategorias.length > 0
                ? handleSuccessCreate
                : undefined
            }
          />
        )}

        {tab === 'contatos' && (
          <div className="form-panel rounded-xl border border-slate-200 bg-white shadow-sm p-6 form-contraste">
            <p className="text-slate-600 text-sm mb-2">
              Adicione contatos abaixo. Eles serão salvos quando você salvar o cliente na aba &quot;Dados gerais&quot;.
            </p>
            <p className="text-slate-500 text-sm mb-4">Todos os campos desta aba são opcionais.</p>
            <form onSubmit={addContato} className="form-grid space-y-3 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select
                  value={formContato.tipo}
                  onChange={(e) =>
                    setFormContato((f) => ({ ...f, tipo: e.target.value as DraftContato['tipo'] }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                >
                  {TIPOS_CONTATO.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={formContato.nome}
                  onChange={(e) => setFormContato((f) => ({ ...f, nome: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                <input
                  type="text"
                  value={formContato.telefone}
                  onChange={(e) => setFormContato((f) => ({ ...f, telefone: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={formContato.whatsapp}
                  onChange={(e) => setFormContato((f) => ({ ...f, whatsapp: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
                <input
                  type="email"
                  value={formContato.email}
                  onChange={(e) => setFormContato((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div className="xl:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={formContato.observacoes}
                  onChange={(e) => setFormContato((f) => ({ ...f, observacoes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!formContato.ativo}
                    onChange={(e) => setFormContato((f) => ({ ...f, ativo: e.target.checked ? 1 : 0 }))}
                    className="rounded border-slate-300"
                  />
                  Ativo
                </label>
              </div>
              <div className="xl:col-span-2">
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                >
                  + Adicionar contato
                </button>
              </div>
            </form>
            {draftContatos.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-2 font-medium text-slate-700">Tipo</th>
                      <th className="text-left py-2 px-2 font-medium text-slate-700">Nome</th>
                      <th className="text-left py-2 px-2 font-medium text-slate-700">Telefone</th>
                      <th className="text-left py-2 px-2 font-medium text-slate-700 w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftContatos.map((c, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-2 px-2">
                          {TIPOS_CONTATO.find((t) => t.value === c.tipo)?.label ?? c.tipo}
                        </td>
                        <td className="py-2 px-2">{c.nome}</td>
                        <td className="py-2 px-2 text-slate-600">{c.telefone || '—'}</td>
                        <td className="py-2 px-2">
                          <button
                            type="button"
                            onClick={() => removeContato(i)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'bancarios' && (
          <div className="form-panel rounded-xl border border-slate-200 bg-white shadow-sm p-6 form-contraste">
            <p className="text-slate-600 text-sm mb-2">
              Adicione dados bancários. Eles serão salvos quando você salvar o cliente na aba &quot;Dados
              gerais&quot;.
            </p>
            <p className="text-slate-500 text-sm mb-4">Todos os campos desta aba são opcionais.</p>
            <form onSubmit={addDadoBancario} className="form-grid space-y-3 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Favorecido</label>
                <input
                  type="text"
                  value={formDadoBancario.favorecido}
                  onChange={(e) =>
                    setFormDadoBancario((f) => ({ ...f, favorecido: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ/CPF</label>
                <input
                  type="text"
                  value={formDadoBancario.cnpj_cpf}
                  onChange={(e) =>
                    setFormDadoBancario((f) => ({ ...f, cnpj_cpf: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Banco</label>
                <input
                  type="text"
                  value={formDadoBancario.banco}
                  onChange={(e) => setFormDadoBancario((f) => ({ ...f, banco: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Agência</label>
                <input
                  type="text"
                  value={formDadoBancario.agencia}
                  onChange={(e) =>
                    setFormDadoBancario((f) => ({ ...f, agencia: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Conta</label>
                <input
                  type="text"
                  value={formDadoBancario.conta}
                  onChange={(e) => setFormDadoBancario((f) => ({ ...f, conta: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Operação</label>
                <input
                  type="text"
                  value={formDadoBancario.operacao}
                  onChange={(e) =>
                    setFormDadoBancario((f) => ({ ...f, operacao: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">PIX</label>
                <input
                  type="text"
                  value={formDadoBancario.pix}
                  onChange={(e) => setFormDadoBancario((f) => ({ ...f, pix: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div className="xl:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={formDadoBancario.observacoes}
                  onChange={(e) =>
                    setFormDadoBancario((f) => ({ ...f, observacoes: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-200"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!formDadoBancario.ativo}
                    onChange={(e) =>
                      setFormDadoBancario((f) => ({ ...f, ativo: e.target.checked ? 1 : 0 }))
                    }
                    className="rounded border-slate-300"
                  />
                  Ativo
                </label>
              </div>
              <div className="xl:col-span-2">
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                >
                  + Adicionar dados bancários
                </button>
              </div>
            </form>
            {draftDadosBancarios.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-2 font-medium text-slate-700">Favorecido</th>
                      <th className="text-left py-2 px-2 font-medium text-slate-700">Banco</th>
                      <th className="text-left py-2 px-2 font-medium text-slate-700 w-20">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {draftDadosBancarios.map((d, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="py-2 px-2">{d.favorecido}</td>
                        <td className="py-2 px-2">{d.banco}</td>
                        <td className="py-2 px-2">
                          <button
                            type="button"
                            onClick={() => removeDadoBancario(i)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            Remover
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'categorias' && (
          <div className="form-panel rounded-xl border border-slate-200 bg-white shadow-sm p-6 form-contraste">
            <p className="text-slate-600 text-sm mb-4">
              Adicione categorias do parceiro (ex.: Cliente e Fornecedor). Serão salvas ao salvar o cliente na aba
              &quot;Dados gerais&quot;.
            </p>
            {disponiveisCategorias.length > 0 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addCategoria();
                }}
                className="flex flex-wrap items-end gap-2 mb-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Adicionar categoria</label>
                  <select
                    value={categoriaToAdd}
                    onChange={(e) => setCategoriaToAdd(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-slate-200"
                  >
                    {disponiveisCategorias.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                >
                  Adicionar
                </button>
              </form>
            )}
            {draftCategorias.length === 0 ? (
              <p className="text-slate-500 text-sm">Nenhuma categoria adicionada. Use o seletor acima.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {draftCategorias.map((cat) => (
                  <li
                    key={cat}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-sm"
                  >
                    <span>{CATEGORIAS_OPCOES.find((c) => c.value === cat)?.label ?? cat}</span>
                    <button
                      type="button"
                      onClick={() => removeCategoria(cat)}
                      className="text-red-600 hover:underline"
                      title="Remover"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {savingDrafts && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <p className="text-slate-700">Salvando contatos, dados bancários e categorias...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
