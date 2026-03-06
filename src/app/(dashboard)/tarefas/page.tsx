import { Breadcrumb } from '@/components/Breadcrumb';
import { TarefasCards } from './TarefasCards';
import { TarefasView } from './TarefasView';

export default function TarefasPage() {
  return (
    <>
      <Breadcrumb
        items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Tarefas' }]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Tarefas</h2>
        <TarefasCards />
        <TarefasView />
      </div>
    </>
  );
}
