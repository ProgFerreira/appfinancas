import { Breadcrumb } from '@/components/Breadcrumb';
import { NaturezaForm } from '../NaturezaForm';

export default function NovaNaturezaPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Naturezas', href: '/naturezas' }, { label: 'Nova' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Nova natureza</h2>
        <NaturezaForm />
      </div>
    </>
  );
}
