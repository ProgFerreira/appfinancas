import { Breadcrumb } from '@/components/Breadcrumb';
import CategoriasDespesaListDynamic from './CategoriasDespesaListDynamic';

export default function CategoriasDespesaPage() {
  return (
    <>
      <Breadcrumb
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Categorias de despesa' }]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Categorias de despesa</h2>
        <CategoriasDespesaListDynamic />
      </div>
    </>
  );
}
