'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CotacaoParceiro } from '@/types';

export function ParceirosList() {
  const router = useRouter();
  const [items, setItems] = useState<CotacaoParceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/partners?ativo=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) setItems(data.data);
        else setError(data.error || 'Erro ao carregar');
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Carregando...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <span className="text-sm text-slate-600">{items.length} parceiro(s)</span>
        <Link
          href="/cadastros/parceiros/novo"
          className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700"
        >
          Novo parceiro
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">CNPJ</th>
              <th className="px-4 py-2 font-medium">Contato</th>
              <th className="px-4 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-2">{p.nome}</td>
                <td className="px-4 py-2">{p.tipo}</td>
                <td className="px-4 py-2">{p.cnpj ?? '—'}</td>
                <td className="px-4 py-2">{p.contato ?? p.email ?? '—'}</td>
                <td className="px-4 py-2">
                  <Link href={`/cadastros/parceiros/${p.id}/editar`} className="text-indigo-600 hover:underline mr-2">Editar</Link>
                  <Link href={`/cadastros/parceiros/${p.id}/tabelas`} className="text-indigo-600 hover:underline">Tabelas</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
