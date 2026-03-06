import { Breadcrumb } from '@/components/Breadcrumb';
import { ConciliacaoForm } from '../ConciliacaoForm';

export default function ConciliacaoNovoPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Conciliação bancária', href: '/conciliacao-bancaria' }, { label: 'Nova conciliação' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Nova conciliação</h2>
        <ConciliacaoForm />
      </div>
    </>
  );
}
