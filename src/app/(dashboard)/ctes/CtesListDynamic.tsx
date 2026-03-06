'use client';

import dynamic from 'next/dynamic';

const CtesList = dynamic(
  () => import('./CtesList').then((m) => m.CtesList),
  { ssr: false }
);

export default function CtesListDynamic() {
  return <CtesList />;
}
