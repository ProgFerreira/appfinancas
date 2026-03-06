const fs = require('fs');
const path = require('path');

const layoutContent = `export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
  return [{ id: '0' }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
`;

const base = path.join(__dirname, '..', 'src', 'app', '(dashboard)');
const dirs = [
  'categorias-receita', 'centros-custo', 'clientes', 'conciliacao-bancaria',
  'contas-bancarias', 'contas-pagar', 'contas-receber', 'ctes',
  'despesas-fixas', 'despesas-viagem', 'documentos', 'motoristas',
  'naturezas', 'perfis', 'plano-contas', 'tabelas-frete', 'tarefas',
  'usuarios', 'veiculos'
];

dirs.forEach((d) => {
  const layoutPath = path.join(base, d, '[id]', 'layout.tsx');
  if (!fs.existsSync(layoutPath)) {
    fs.writeFileSync(layoutPath, layoutContent);
    console.log('Created', d + '/[id]/layout.tsx');
  }
});

const cadastrosBase = path.join(base, 'cadastros');
['parceiros', 'tabelas-preco'].forEach((d) => {
  const layoutPath = path.join(cadastrosBase, d, '[id]', 'layout.tsx');
  if (!fs.existsSync(layoutPath)) {
    fs.writeFileSync(layoutPath, layoutContent);
    console.log('Created cadastros/' + d + '/[id]/layout.tsx');
  }
});

console.log('Done.');
