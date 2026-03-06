'use client';

import dynamic from 'next/dynamic';

const CategoriasReceitaList = dynamic(
  () => import('./CategoriasReceitaList').then((m) => m.CategoriasReceitaList),
  { ssr: false }
);

export default function CategoriasReceitaListDynamic() {
  return <CategoriasReceitaList />;
}
