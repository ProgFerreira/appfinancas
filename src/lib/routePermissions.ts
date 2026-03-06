/**
 * Mapeamento de rotas (pathname) para permissão necessária.
 * Ordenado por prefixo mais longo primeiro para que /bank/importar use bank.import e não bank.view.
 */
const PATH_PERMISSIONS: [string, string][] = [
  ['/bank/importar', 'bank.import'],
  ['/manifestos/importar', 'manifestos.import'],
  ['/manifestos', 'manifestos.view'],
  ['/bank/transacoes', 'bank.view'],
  ['/bank/extrato', 'bank.view'],
  ['/bank', 'bank.view'],
  ['/dashboard', 'dashboard.view'],
  ['/comercial/cotacao', 'cotacao.view'],
  ['/cadastros/parceiros', 'parceiros.view'],
  ['/cadastros/tabelas-preco', 'tabelas-preco-cotacao.view'],
  ['/cadastros/taxas-parceiro', 'taxas-parceiro.view'],
  ['/contas-pagar', 'contas-pagar.view'],
  ['/contas-receber', 'contas-receber.view'],
  ['/contas-receber-ctes', 'contas-receber-ctes.view'],
  ['/despesas-fixas', 'despesas-fixas.view'],
  ['/ctes', 'ctes.view'],
  ['/contas-bancarias', 'contas-bancarias.view'],
  ['/conciliacao-bancaria', 'conciliacao-bancaria.view'],
  ['/conciliacao', 'reconciliation.view'],
  ['/movimentacoes', 'movimentacoes.view'],
  ['/fluxo-caixa', 'fluxo-caixa.view'],
  ['/dre', 'dre.view'],
  ['/clientes', 'clientes.view'],
  ['/categorias-despesa', 'categorias-despesa.view'],
  ['/categorias-receita', 'categorias-receita.view'],
  ['/centros-custo', 'centros-custo.view'],
  ['/naturezas', 'naturezas.view'],
  ['/plano-contas', 'plano-contas.view'],
  ['/tabelas-frete', 'tabelas-frete.view'],
  ['/motoristas', 'motoristas.view'],
  ['/veiculos', 'veiculos.view'],
  ['/despesas-viagem', 'despesas-viagem.view'],
  ['/tarefas', 'tarefas.view'],
  ['/documentos', 'documentos.view'],
  ['/usuarios', 'usuarios.view'],
  ['/perfis', 'perfis.view'],
];

/** Rotas que não exigem verificação de permissão (ex: página de acesso negado). */
const PUBLIC_PATHS = ['/acesso-negado'];

/**
 * Retorna a permissão necessária para acessar o pathname, ou null se a rota é pública ou não mapeada.
 */
export function getRequiredPermission(pathname: string): string | null {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return null;
  }
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  for (const [prefix, permission] of PATH_PERMISSIONS) {
    if (normalized === prefix || normalized.startsWith(prefix + '/')) {
      return permission;
    }
  }
  return null;
}

/**
 * Verifica se o usuário pode acessar o pathname com base nas permissões.
 * Administrador (quando permissions inclui todas) ou se a rota não exige permissão: true.
 */
export function canAccessPath(pathname: string, permissions: string[]): boolean {
  const required = getRequiredPermission(pathname);
  if (required === null) return true;
  return permissions.includes(required);
}
