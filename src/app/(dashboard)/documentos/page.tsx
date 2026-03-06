import { Breadcrumb } from '@/components/Breadcrumb';
import DocumentosListDynamic from './DocumentosListDynamic';

export default function DocumentosPage() {
  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Documentos' }]} />
      <div className="mt-4">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Repositório de documentos</h2>
        <p className="text-sm text-slate-600 mb-4">
          Envie e gerencie documentos (PDF, planilhas, etc.). O acesso é controlado por permissões por documento (visualizar, baixar, editar, excluir).
        </p>
        <DocumentosListDynamic />
      </div>
    </>
  );
}
