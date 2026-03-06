import { Breadcrumb } from '@/components/Breadcrumb';
import ManifestosListDynamic from './ManifestosListDynamic';

export default function ManifestosPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Manifestos' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Manifestos</h2>
        <ManifestosListDynamic />
      </div>
    </>
  );
}
