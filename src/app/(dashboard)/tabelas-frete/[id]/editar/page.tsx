import { Breadcrumb } from '@/components/Breadcrumb';
import { TabelaFreteForm } from '../../TabelaFreteForm';

export default async function EditarTabelaFretePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Tabelas de frete', href: '/tabelas-frete' }, { label: 'Editar' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar tabela de frete</h2>
        <TabelaFreteForm id={id} />
      </div>
    </>
  );
}
