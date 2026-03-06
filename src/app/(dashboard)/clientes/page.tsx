import { Breadcrumb } from '@/components/Breadcrumb';
import ClientesListDynamic from './ClientesListDynamic';

export default function ClientesPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Clientes' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Clientes e parceiros</h2>
        <ClientesListDynamic />
      </div>
    </>
  );
}
