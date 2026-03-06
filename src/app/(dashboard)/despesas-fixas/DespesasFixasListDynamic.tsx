'use client';

import dynamic from 'next/dynamic';

const DespesasFixasList = dynamic(
  () => import('./DespesasFixasList').then((m) => m.DespesasFixasList),
  { ssr: false }
);

export default function DespesasFixasListDynamic() {
  return <DespesasFixasList />;
}
