import { Breadcrumb } from '@/components/Breadcrumb';
import { CategoriaDespesaForm } from '../CategoriaDespesaForm';

export default function NovaCategoriaDespesaPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Categorias de despesa', href: '/categorias-despesa' },
          { label: 'Nova' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Nova categoria de despesa</h2>
        <CategoriaDespesaForm />
      </div>
    </>
  );
}
