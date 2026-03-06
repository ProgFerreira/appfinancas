import { Breadcrumb } from '@/components/Breadcrumb';
import { ConciliacaoForm } from '../../ConciliacaoForm';

export default async function ConciliacaoEditarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Conciliação bancária', href: '/conciliacao-bancaria' }, { label: 'Editar' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar conciliação</h2>
        <ConciliacaoForm id={id} />
      </div>
    </>
  );
}
