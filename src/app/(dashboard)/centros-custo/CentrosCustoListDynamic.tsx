'use client';

import dynamic from 'next/dynamic';

const CentrosCustoList = dynamic(
  () => import('./CentrosCustoList').then((m) => m.CentrosCustoList),
  { ssr: false }
);

export default function CentrosCustoListDynamic() {
  return <CentrosCustoList />;
}
