'use client';

import dynamic from 'next/dynamic';

const TabelasFreteList = dynamic(() => import('./TabelasFreteList').then((m) => m.TabelasFreteList), { ssr: false });

export default function TabelasFreteListDynamic() {
  return <TabelasFreteList />;
}
