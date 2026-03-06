'use client';

import { useRouter } from 'next/navigation';

type TopbarProps = {
  title: string;
  /** Callback para abrir/fechar o menu em mobile. Se não informado, o botão hambúrguer não é exibido. */
  onMenuToggle?: () => void;
};

export default function Topbar({ title, onMenuToggle }: TopbarProps) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="h-14 shrink-0 flex items-center justify-between gap-2 px-4 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 min-w-0">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="shrink-0 p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
            aria-label="Abrir menu principal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h1 className="font-semibold text-slate-800 truncate">{title}</h1>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        className="text-sm text-slate-600 hover:text-red-600"
      >
        Sair
      </button>
    </header>
  );
}
