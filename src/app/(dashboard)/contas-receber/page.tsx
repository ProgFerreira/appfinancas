import { Breadcrumb } from '@/components/Breadcrumb';
import ContasReceberListDynamic from './ContasReceberListDynamic';

export default function ContasReceberPage() {
  return (
    <>
      <Breadcrumb
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Contas a receber' }]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Contas a receber</h2>
        <ContasReceberListDynamic />
      </div>
    </>
  );
}
