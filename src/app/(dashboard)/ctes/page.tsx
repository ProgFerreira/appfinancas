import { Breadcrumb } from '@/components/Breadcrumb';
import CtesListDynamic from './CtesListDynamic';

export default function CtesPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'CTe' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Conhecimento de Transporte Eletrônico</h2>
        <CtesListDynamic />
      </div>
    </>
  );
}
