import { Breadcrumb } from '@/components/Breadcrumb';
import { TarefaForm } from '../TarefaForm';

export default function NovaTarefaPage() {
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Tarefas', href: '/tarefas' },
          { label: 'Nova tarefa' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Nova tarefa</h2>
        <TarefaForm />
      </div>
    </>
  );
}
