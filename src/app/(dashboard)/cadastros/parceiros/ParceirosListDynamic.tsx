'use client';

import dynamic from 'next/dynamic';

const ParceirosList = dynamic(() => import('./ParceirosList').then((m) => m.ParceirosList), { ssr: false });

export default function ParceirosListDynamic() {
  return <ParceirosList />;
}
