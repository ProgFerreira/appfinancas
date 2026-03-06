import { Breadcrumb } from '@/components/Breadcrumb';
import { CentroCustoForm } from '../CentroCustoForm';

export default function NovoCentroCustoPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Centros de custo', href: '/centros-custo' },
          { label: 'Novo' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Novo centro de custo</h2>
        <CentroCustoForm />
      </div>
    </>
  );
}
