import { Breadcrumb } from '@/components/Breadcrumb';
import ConciliacoesListDynamic from './ConciliacoesListDynamic';

export default function ConciliacaoBancariaPage() {
  return (
    <div
      className="min-h-[400px] bg-white text-slate-800 rounded-xl border border-slate-200 shadow-sm overflow-hidden"
      data-page="conciliacao-bancaria"
    >
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Conciliação bancária' }]} />
      <div className="mt-4 p-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Conciliação bancária</h2>
        <ConciliacoesListDynamic />
      </div>
    </div>
  );
}
