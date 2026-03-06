'use client';

import { useState } from 'react';
import TarefasListDynamic from './TarefasListDynamic';
import { TarefasKanban } from './TarefasKanban';

type ViewMode = 'lista' | 'kanban';

export function TarefasView() {
  const [view, setView] = useState<ViewMode>('lista');

  return (
    <>
      <div className="flex gap-1 border-b border-slate-200 mb-4">
        <button
          type="button"
          onClick={() => setView('lista')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            view === 'lista'
              ? 'bg-white border border-slate-200 border-b-0 -mb-px text-indigo-600'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Lista
        </button>
        <button
          type="button"
          onClick={() => setView('kanban')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            view === 'kanban'
              ? 'bg-white border border-slate-200 border-b-0 -mb-px text-indigo-600'
              : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          Kanban
        </button>
      </div>
      {view === 'lista' ? <TarefasListDynamic /> : <TarefasKanban />}
    </>
  );
}
