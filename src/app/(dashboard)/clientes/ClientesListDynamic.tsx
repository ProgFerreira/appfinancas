'use client';

import dynamic from 'next/dynamic';

const ClientesList = dynamic(
  () => import('./ClientesList').then((m) => m.ClientesList),
  { ssr: false }
);

export default function ClientesListDynamic() {
  return <ClientesList />;
}
