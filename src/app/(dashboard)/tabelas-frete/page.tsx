import { Breadcrumb } from '@/components/Breadcrumb';
import TabelasFreteListDynamic from './TabelasFreteListDynamic';

export default function TabelasFretePage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Tabelas de frete' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Tabelas de frete</h2>
        <TabelasFreteListDynamic />
      </div>
    </>
  );
}
