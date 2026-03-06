import { Breadcrumb } from '@/components/Breadcrumb';
import CategoriasReceitaListDynamic from './CategoriasReceitaListDynamic';

export default function CategoriasReceitaPage() {
  return (
    <>
      <Breadcrumb
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Categorias de receita' }]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Categorias de receita</h2>
        <CategoriasReceitaListDynamic />
      </div>
    </>
  );
}
