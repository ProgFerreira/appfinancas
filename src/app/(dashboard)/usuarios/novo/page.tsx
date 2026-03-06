import { Breadcrumb } from '@/components/Breadcrumb';
import { UsuarioForm } from '../UsuarioForm';

export default function UsuarioNovoPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Usuários', href: '/usuarios' }, { label: 'Novo usuário' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Novo usuário</h2>
        <UsuarioForm />
      </div>
    </>
  );
}
