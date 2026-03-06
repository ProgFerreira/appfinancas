import { Breadcrumb } from '@/components/Breadcrumb';
import { MotoristaForm } from '../../MotoristaForm';

export default async function EditarMotoristaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Motoristas', href: '/motoristas' }, { label: 'Editar' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar motorista</h2>
        <MotoristaForm id={id} />
      </div>
    </>
  );
}
