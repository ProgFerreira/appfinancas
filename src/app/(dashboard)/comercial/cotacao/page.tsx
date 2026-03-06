import { Breadcrumb } from '@/components/Breadcrumb';
import CotacaoClient from './CotacaoClient';

export default function CotacaoPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Cotações', href: '/comercial/cotacao' },
          { label: 'Nova cotação' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Cotação de frete</h2>
        <CotacaoClient />
      </div>
    </>
  );
}
