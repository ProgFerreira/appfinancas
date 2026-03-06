'use client';

import dynamic from 'next/dynamic';

const TabelasPrecoList = dynamic(() => import('./TabelasPrecoList').then((m) => m.TabelasPrecoList), { ssr: false });

export default function TabelasPrecoListDynamic() {
  return <TabelasPrecoList />;
}
