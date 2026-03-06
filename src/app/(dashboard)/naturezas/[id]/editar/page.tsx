import { Breadcrumb } from '@/components/Breadcrumb';
import { NaturezaForm } from '../../NaturezaForm';

export default async function EditarNaturezaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Naturezas', href: '/naturezas' }, { label: 'Editar' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar natureza</h2>
        <NaturezaForm id={id} />
      </div>
    </>
  );
}
