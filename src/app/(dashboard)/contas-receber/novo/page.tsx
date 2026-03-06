import { Breadcrumb } from '@/components/Breadcrumb';
import { ContaReceberForm } from '../ContaReceberForm';

export default function NovoContaReceberPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Contas a receber', href: '/contas-receber' },
          { label: 'Nova conta a receber' },
        ]}
      />
      <div className="mt-6 max-w-6xl">
        <h2 className="form-page-title">Nova conta a receber</h2>
        <p className="form-page-subtitle">Preencha os dados da receita. Campos com * são obrigatórios.</p>
        <ContaReceberForm />
      </div>
    </>
  );
}
