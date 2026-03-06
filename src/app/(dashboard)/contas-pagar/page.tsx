import { Breadcrumb } from '@/components/Breadcrumb';
import ContasPagarListDynamic from './ContasPagarListDynamic';

export default function ContasPagarPage() {
  return (
    <>
      <Breadcrumb
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Contas a pagar' }]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Contas a pagar</h2>
        <ContasPagarListDynamic />
      </div>
    </>
  );
}
