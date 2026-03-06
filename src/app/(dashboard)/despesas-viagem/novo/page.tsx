import { Breadcrumb } from '@/components/Breadcrumb';
import { DespesaViagemForm } from '../DespesaViagemForm';

export default function NovaDespesaViagemPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Despesas de viagem', href: '/despesas-viagem' }, { label: 'Nova' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Nova despesa de viagem</h2>
        <DespesaViagemForm />
      </div>
    </>
  );
}
