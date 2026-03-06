import { Breadcrumb } from '@/components/Breadcrumb';
import { MotoristaForm } from '../MotoristaForm';

export default function NovoMotoristaPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Motoristas', href: '/motoristas' }, { label: 'Novo' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Novo motorista</h2>
        <MotoristaForm />
      </div>
    </>
  );
}
