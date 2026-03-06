import { Breadcrumb } from '@/components/Breadcrumb';
import { DespesaFixaForm } from '../../DespesaFixaForm';

export default async function EditarDespesaFixaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Despesas fixas', href: '/despesas-fixas' },
          { label: 'Editar' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar despesa fixa</h2>
        <DespesaFixaForm id={id} />
      </div>
    </>
  );
}
