'use client';

import dynamic from 'next/dynamic';

const CategoriasDespesaList = dynamic(
  () => import('./CategoriasDespesaList').then((m) => m.CategoriasDespesaList),
  { ssr: false }
);

export default function CategoriasDespesaListDynamic() {
  return <CategoriasDespesaList />;
}
