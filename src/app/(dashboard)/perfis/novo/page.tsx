'use client';

import { Breadcrumb } from '@/components/Breadcrumb';
import { PerfilForm } from '../PerfilForm';

export default function NovoPerfilPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Perfis', href: '/perfis' },
          { label: 'Novo perfil' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Novo perfil</h2>
        <PerfilForm />
      </div>
    </>
  );
}
