import { Breadcrumb } from '@/components/Breadcrumb';
import DespesasFixasListDynamic from './DespesasFixasListDynamic';

export default function DespesasFixasPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Despesas fixas' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Despesas fixas</h2>
        <DespesasFixasListDynamic />
      </div>
    </>
  );
}
