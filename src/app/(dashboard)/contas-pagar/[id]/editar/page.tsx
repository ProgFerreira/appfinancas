'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Editar conta a pagar: redireciona para a tela de baixa (registro de pagamento),
 * que é a ação principal de "edição" do título.
 */
export default function EditarContaPagarPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params?.id ?? '');

  useEffect(() => {
    if (id) router.replace(`/contas-pagar/${id}/baixa`);
  }, [id, router]);

  return <div className="p-6 text-slate-500">Redirecionando...</div>;
}
