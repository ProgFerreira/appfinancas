import { Breadcrumb } from '@/components/Breadcrumb';
import { ContaBancariaForm } from '../ContaBancariaForm';

export default function NovaContaBancariaPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Contas bancárias', href: '/contas-bancarias' },
          { label: 'Nova' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Nova conta bancária</h2>
        <ContaBancariaForm />
      </div>
    </>
  );
}
