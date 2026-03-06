import { Breadcrumb } from '@/components/Breadcrumb';
import { CategoriaReceitaForm } from '../../CategoriaReceitaForm';

export default async function EditarCategoriaReceitaPage({
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
          { label: 'Categorias de receita', href: '/categorias-receita' },
          { label: 'Editar' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar categoria de receita</h2>
        <CategoriaReceitaForm id={id} />
      </div>
    </>
  );
}
