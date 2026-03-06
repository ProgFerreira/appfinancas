import Link from 'next/link';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function AcessoNegadoPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Acesso negado' }]} />
      <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-amber-200 bg-amber-50/50 p-8 text-center">
        <h2 className="text-xl font-semibold text-amber-800">Acesso negado</h2>
        <p className="mt-2 text-slate-600">
          Você não tem permissão para acessar esta página. Entre em contato com o administrador se precisar de acesso.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
        >
          Voltar ao início
        </Link>
      </div>
    </>
  );
}
