import { Breadcrumb } from '@/components/Breadcrumb';
import { VeiculoForm } from '../../VeiculoForm';

export default async function EditarVeiculoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Veículos', href: '/veiculos' }, { label: 'Editar' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar veículo</h2>
        <VeiculoForm id={id} />
      </div>
    </>
  );
}
