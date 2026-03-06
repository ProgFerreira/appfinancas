import { Breadcrumb } from '@/components/Breadcrumb';
import { UsuarioForm } from '../../UsuarioForm';

export default async function UsuarioEditarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Usuários', href: '/usuarios' }, { label: 'Editar' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar usuário</h2>
        <UsuarioForm id={id} />
      </div>
    </>
  );
}
