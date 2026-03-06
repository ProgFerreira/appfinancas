import { Breadcrumb } from '@/components/Breadcrumb';
import NaturezasListDynamic from './NaturezasListDynamic';

export default function NaturezasPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Naturezas' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Naturezas</h2>
        <NaturezasListDynamic />
      </div>
    </>
  );
}
