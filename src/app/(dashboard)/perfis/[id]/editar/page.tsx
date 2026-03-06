'use client';

import { useParams } from 'next/navigation';
import { Breadcrumb } from '@/components/Breadcrumb';
import { PerfilForm } from '../../PerfilForm';

export default function EditarPerfilPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : undefined;

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Perfis', href: '/perfis' },
          { label: 'Editar perfil' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar perfil</h2>
        <PerfilForm id={id} />
      </div>
    </>
  );
}
