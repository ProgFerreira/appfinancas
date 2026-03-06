'use client';

import dynamic from 'next/dynamic';

const ContasBancariasList = dynamic(
  () => import('./ContasBancariasList').then((m) => m.ContasBancariasList),
  { ssr: false }
);

export default function ContasBancariasListDynamic() {
  return <ContasBancariasList />;
}
