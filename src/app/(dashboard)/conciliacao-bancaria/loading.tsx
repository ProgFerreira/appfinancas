import { Breadcrumb } from '@/components/Breadcrumb';

export default function ConciliacaoBancariaLoading() {
  return (
    <div className="min-h-[400px]">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Conciliação bancária' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Conciliação bancária</h2>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-8 text-center text-slate-500">
          Carregando...
        </div>
      </div>
    </div>
  );
}
