'use client';

import dynamic from 'next/dynamic';

const ManifestosList = dynamic(
  () => import('./ManifestosList').then((m) => m.ManifestosList),
  { ssr: false }
);

export default function ManifestosListDynamic() {
  return <ManifestosList />;
}
