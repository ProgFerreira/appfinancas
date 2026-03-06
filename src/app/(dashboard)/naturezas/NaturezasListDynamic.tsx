'use client';

import dynamic from 'next/dynamic';

const NaturezasList = dynamic(() => import('./NaturezasList').then((m) => m.NaturezasList), { ssr: false });

export default function NaturezasListDynamic() {
  return <NaturezasList />;
}
