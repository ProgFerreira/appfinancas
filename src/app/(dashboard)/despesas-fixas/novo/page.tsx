import { Breadcrumb } from '@/components/Breadcrumb';
import { DespesaFixaForm } from '../DespesaFixaForm';

export default function NovaDespesaFixaPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Despesas fixas', href: '/despesas-fixas' },
          { label: 'Nova' },
        ]}
      />
      <div className="mt-6 max-w-6xl">
        <h2 className="form-page-title">Nova despesa fixa</h2>
        <p className="form-page-subtitle">Preencha os dados da despesa recorrente. Campos com * são obrigatórios.</p>
        <DespesaFixaForm />
      </div>
    </>
  );
}
