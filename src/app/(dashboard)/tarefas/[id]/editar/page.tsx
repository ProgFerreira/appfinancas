import { Breadcrumb } from '@/components/Breadcrumb';
import { TarefaForm } from '../../TarefaForm';

export default async function EditarTarefaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Tarefas', href: '/tarefas' },
          { label: 'Editar' },
        ]}
      />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Editar tarefa</h2>
        <TarefaForm id={id} />
      </div>
    </>
  );
}
