import { Breadcrumb } from '@/components/Breadcrumb';
import CentrosCustoListDynamic from './CentrosCustoListDynamic';

export default function CentrosCustoPage() {
  return (
    <>
      <Breadcrumb
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Centros de custo' }]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Centros de custo</h2>
        <CentrosCustoListDynamic />
      </div>
    </>
  );
}
