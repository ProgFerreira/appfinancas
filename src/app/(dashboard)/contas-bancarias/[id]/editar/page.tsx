import { Breadcrumb } from '@/components/Breadcrumb';
import { ContaBancariaForm } from '../../ContaBancariaForm';

export default async function EditarContaBancariaPage({
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
          { label: 'Contas bancárias', href: '/contas-bancarias' },
          { label: 'Editar' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar conta bancária</h2>
        <ContaBancariaForm id={id} />
      </div>
    </>
  );
}
