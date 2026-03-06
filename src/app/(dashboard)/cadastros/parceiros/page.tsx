import { Breadcrumb } from '@/components/Breadcrumb';
import ParceirosUnified from './ParceirosUnified';

export default function ParceirosPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Cotações', href: '/comercial/cotacao' }, { label: 'Parceiros' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Parceiros — dados, cobertura, tabelas e taxas</h2>
        <ParceirosUnified />
      </div>
    </>
  );
}
