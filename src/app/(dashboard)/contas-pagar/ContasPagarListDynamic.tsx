'use client';

import dynamic from 'next/dynamic';

const ContasPagarList = dynamic(
  () => import('./ContasPagarList').then((m) => m.ContasPagarList),
  { ssr: false }
);

export default function ContasPagarListDynamic() {
  return <ContasPagarList />;
}
