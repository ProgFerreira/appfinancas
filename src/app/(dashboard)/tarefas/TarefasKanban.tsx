'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import type { Tarefa } from '@/types';

const COLUMNS: { id: Tarefa['status']; label: string; className: string }[] = [
  { id: 'pendente', label: 'Pendente', className: 'bg-amber-50 border-amber-200' },
  { id: 'em_andamento', label: 'Em andamento', className: 'bg-blue-50 border-blue-200' },
  { id: 'concluido', label: 'Concluído', className: 'bg-emerald-50 border-emerald-200' },
  { id: 'cancelado', label: 'Cancelado', className: 'bg-slate-100 border-slate-200' },
];

const PRIORIDADE_LABEL: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr + 'Z').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function groupByStatus(tasks: Tarefa[]): Record<Tarefa['status'], Tarefa[]> {
  const groups: Record<Tarefa['status'], Tarefa[]> = {
    pendente: [],
    em_andamento: [],
    concluido: [],
    cancelado: [],
  };
  for (const t of tasks) {
    if (groups[t.status]) groups[t.status].push(t);
  }
  return groups;
}

export function TarefasKanban() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchTasks = useCallback(() => {
    setError(null);
    fetch('/api/tarefas?per_page=500')
      .then(async (res) => {
        const text = await res.text();
        if (!text) return { success: false, error: 'Resposta vazia', status: res.status };
        try {
          return { ...JSON.parse(text), status: res.status } as {
            success: boolean;
            data?: Tarefa[];
            error?: string;
            status: number;
          };
        } catch {
          return { success: false, error: 'Resposta inválida', status: res.status };
        }
      })
      .then((result) => {
        if (result.status === 401) {
          router.push('/login');
          return;
        }
        if (result.success && result.data) {
          setTasks(result.data);
        } else {
          setError(result.error ?? 'Erro ao carregar tarefas.');
        }
      })
      .catch(() => setError('Erro de conexão'))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  async function handleDragEnd(result: DropResult) {
    const { source, destination } = result;
    if (!destination || source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId as Tarefa['status'];
    const taskId = parseInt(result.draggableId, 10);
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const prevTasks = [...tasks];
    setUpdateError(null);
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    setUpdatingId(taskId);

    // Incluir unidade_id para não perder ao atualizar status no Kanban
    const payload = {
      titulo: task.titulo,
      descricao: task.descricao,
      status: newStatus,
      prioridade: task.prioridade,
      unidade_id: task.unidade_id != null ? task.unidade_id : null,
      data_vencimento: task.data_vencimento,
      responsavel_id: task.responsavel_id,
    };

    try {
      const res = await fetch(`/api/tarefas/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTasks(prevTasks);
        setUpdateError(data.error ?? 'Erro ao atualizar status.');
      }
    } catch {
      setTasks(prevTasks);
      setUpdateError('Erro de conexão ao atualizar.');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-72 shrink-0 h-64 rounded-xl bg-slate-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-800 text-sm flex items-center justify-between">
        <span>{error}</span>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            fetchTasks();
          }}
          className="px-3 py-1.5 rounded bg-red-100 hover:bg-red-200 text-sm font-medium"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  const byStatus = groupByStatus(tasks);

  return (
    <div className="mt-4">
      {updateError && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-800 text-sm flex items-center justify-between">
          <span>{updateError}</span>
          <button
            type="button"
            onClick={() => setUpdateError(null)}
            className="text-amber-600 hover:text-amber-800"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
      )}
      <div className="flex justify-end mb-2">
        <Link
          href="/tarefas/novo"
          className="px-3 py-1.5 rounded-lg bg-slate-800 text-white text-sm hover:bg-slate-700"
        >
          Nova tarefa
        </Link>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[420px]">
          {COLUMNS.map((col) => (
            <Droppable key={col.id} droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`w-72 shrink-0 rounded-xl border-2 ${col.className} ${
                    snapshot.isDraggingOver ? 'ring-2 ring-indigo-300 ring-offset-2' : ''
                  }`}
                >
                  <div className="p-3 border-b border-current/10">
                    <h3 className="font-semibold text-slate-800">
                      {col.label}
                      <span className="ml-2 text-sm font-normal text-slate-500">
                        ({byStatus[col.id].length})
                      </span>
                    </h3>
                  </div>
                  <div className="p-2 min-h-[320px]">
                    {byStatus[col.id].map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={String(task.id)}
                        index={index}
                        isDragDisabled={updatingId === task.id}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-2 rounded-lg border bg-white p-3 shadow-sm transition-shadow ${
                              snapshot.isDragging ? 'shadow-lg ring-1 ring-slate-200' : ''
                            } ${updatingId === task.id ? 'opacity-60' : ''}`}
                          >
                            <Link
                              href={`/tarefas/${task.id}/visualizar`}
                              onClick={(e) => snapshot.isDragging && e.preventDefault()}
                              className="block text-slate-800 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                            >
                              <p className="font-medium text-sm line-clamp-2">
                                {task.titulo}
                              </p>
                              {task.data_vencimento && (
                                <p
                                  className={`mt-1 text-xs ${
                                    new Date(task.data_vencimento + 'Z') < new Date()
                                      && col.id !== 'concluido'
                                      && col.id !== 'cancelado'
                                      ? 'text-red-600 font-medium'
                                      : 'text-slate-500'
                                  }`}
                                >
                                  Vence: {formatDate(task.data_vencimento)}
                                </p>
                              )}
                              <p className="mt-1 text-xs text-slate-500">
                                {PRIORIDADE_LABEL[task.prioridade] ?? task.prioridade}
                                {task.responsavel_nome
                                  ? ` · ${task.responsavel_nome}`
                                  : ''}
                              </p>
                            </Link>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
