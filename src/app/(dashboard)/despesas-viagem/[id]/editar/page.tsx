import { Breadcrumb } from '@/components/Breadcrumb';
import { DespesaViagemForm } from '../../DespesaViagemForm';

export default async function EditarDespesaViagemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Despesas de viagem', href: '/despesas-viagem' }, { label: 'Editar' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar despesa de viagem</h2>
        <DespesaViagemForm id={id} />
      </div>
    </>
  );
}
