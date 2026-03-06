'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CotacaoPriceTable } from '@/types';

export function TabelasPrecoList() {
  const [items, setItems] = useState<CotacaoPriceTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/price-tables')
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-2 font-medium">Nome</th>
              <th className="px-4 py-2 font-medium">Parceiro</th>
              <th className="px-4 py-2 font-medium">Origem</th>
              <th className="px-4 py-2 font-medium">Destino</th>
              <th className="px-4 py-2 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-2">{t.nome}</td>
                <td className="px-4 py-2">{t.partner_nome ?? '—'}</td>
                <td className="px-4 py-2">{t.origem_uf} / {t.origem_cidade}</td>
                <td className="px-4 py-2">{t.destino_uf} / {t.destino_cidade}</td>
                <td className="px-4 py-2">
                  <Link href={`/cadastros/tabelas-preco/${t.id}`} className="text-indigo-600 hover:underline">Faixas</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
