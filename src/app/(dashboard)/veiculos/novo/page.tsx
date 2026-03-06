import { Breadcrumb } from '@/components/Breadcrumb';
import { VeiculoForm } from '../VeiculoForm';

export default function NovoVeiculoPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Veículos', href: '/veiculos' }, { label: 'Novo' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Novo veículo</h2>
        <VeiculoForm />
      </div>
    </>
  );
}
