import { Breadcrumb } from '@/components/Breadcrumb';
import { CentroCustoForm } from '../../CentroCustoForm';

export default async function EditarCentroCustoPage({
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
          { label: 'Centros de custo', href: '/centros-custo' },
          { label: 'Editar' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar centro de custo</h2>
        <CentroCustoForm id={id} />
      </div>
    </>
  );
}
