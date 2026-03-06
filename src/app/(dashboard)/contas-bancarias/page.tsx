import { Breadcrumb } from '@/components/Breadcrumb';
import ContasBancariasListDynamic from './ContasBancariasListDynamic';

export default function ContasBancariasPage() {
  return (
    <>
      <Breadcrumb
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Contas bancárias' }]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Contas bancárias</h2>
        <ContasBancariasListDynamic />
      </div>
    </>
  );
}
