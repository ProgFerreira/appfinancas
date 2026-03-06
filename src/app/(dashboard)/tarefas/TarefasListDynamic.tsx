'use client';

import dynamic from 'next/dynamic';

const TarefasList = dynamic(() => import('./TarefasList').then((m) => m.TarefasList), {
  ssr: false,
});

export default function TarefasListDynamic() {
  return <TarefasList />;
}
