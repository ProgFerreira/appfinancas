import { Breadcrumb } from '@/components/Breadcrumb';
import { TabelaFreteForm } from '../TabelaFreteForm';

export default function NovaTabelaFretePage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Tabelas de frete', href: '/tabelas-frete' }, { label: 'Nova' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Nova tabela de frete</h2>
        <TabelaFreteForm />
      </div>
    </>
  );
}
