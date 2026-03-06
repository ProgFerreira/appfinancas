import { Breadcrumb } from '@/components/Breadcrumb';
import { ContaPagarForm } from '../ContaPagarForm';

export default function NovoContaPagarPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Contas a pagar', href: '/contas-pagar' },
          { label: 'Nova conta a pagar' },
        ]}
      />
      <div className="mt-6 max-w-6xl">
        <h2 className="form-page-title">Nova conta a pagar</h2>
        <p className="form-page-subtitle">Preencha os dados da despesa. Campos com * são obrigatórios.</p>
        <ContaPagarForm />
      </div>
    </>
  );
}
