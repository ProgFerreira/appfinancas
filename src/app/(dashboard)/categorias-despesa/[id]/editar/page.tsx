import { Breadcrumb } from '@/components/Breadcrumb';
import { CategoriaDespesaForm } from '../../CategoriaDespesaForm';

export default async function EditarCategoriaDespesaPage({
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
          { label: 'Categorias de despesa', href: '/categorias-despesa' },
          { label: 'Editar' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar categoria de despesa</h2>
        <CategoriaDespesaForm id={id} />
      </div>
    </>
  );
}
