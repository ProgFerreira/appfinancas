import { Breadcrumb } from '@/components/Breadcrumb';
import { CteForm } from '../CteForm';

export default function NovoCtePage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'CTe', href: '/ctes' },
          { label: 'Novo CTe' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Novo CTe</h2>
        <CteForm />
      </div>
    </>
  );
}
