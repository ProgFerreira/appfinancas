import { Breadcrumb } from '@/components/Breadcrumb';
import DashboardCardsDynamic from './DashboardCardsDynamic';

export default function DashboardPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Visão geral</h2>
        <DashboardCardsDynamic />
      </div>
    </>
  );
}
