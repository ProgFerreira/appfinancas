'use client';

import dynamic from 'next/dynamic';

const DocumentosList = dynamic(() => import('./DocumentosList').then((m) => m.DocumentosList), { ssr: false });

export default function DocumentosListDynamic() {
  return <DocumentosList />;
}
