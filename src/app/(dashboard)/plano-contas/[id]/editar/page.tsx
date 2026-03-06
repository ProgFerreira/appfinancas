import { Breadcrumb } from '@/components/Breadcrumb';
import { PlanoContasForm } from '../../PlanoContasForm';

export default async function EditarPlanoContasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Plano de contas', href: '/plano-contas' }, { label: 'Editar' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar conta</h2>
        <PlanoContasForm id={id} />
      </div>
    </>
  );
}
