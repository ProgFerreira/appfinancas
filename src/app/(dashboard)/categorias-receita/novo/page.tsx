import { Breadcrumb } from '@/components/Breadcrumb';
import { CategoriaReceitaForm } from '../CategoriaReceitaForm';

export default function NovaCategoriaReceitaPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Categorias de receita', href: '/categorias-receita' },
          { label: 'Nova' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Nova categoria de receita</h2>
        <CategoriaReceitaForm />
      </div>
    </>
  );
}
