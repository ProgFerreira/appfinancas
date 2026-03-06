'use client';

import dynamic from 'next/dynamic';

const ContasReceberList = dynamic(
  () => import('./ContasReceberList').then((m) => m.ContasReceberList),
  { ssr: false }
);

export default function ContasReceberListDynamic() {
  return <ContasReceberList />;
}
