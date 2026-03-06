import { query } from '@/lib/db';

/**
 * Check if user has the given permission.
 * - If user has role "Administrador" or perfil "administrador", always true.
 * - Otherwise check role_permissions via user_roles.
 */
export async function hasPermission(userId: number, permission: string): Promise<boolean> {
  const userRows = await query<{ perfil: string }[]>(
    'SELECT perfil FROM usuarios WHERE id = ? AND ativo = 1 LIMIT 1',
    [userId]
  );
  const user = Array.isArray(userRows) ? userRows[0] : null;
  if (!user) return false;
  if (user.perfil === 'administrador') return true;

  const rows = await query<{ n: number }[]>(
    `SELECT 1 AS n FROM user_roles ur
     INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
     INNER JOIN permissions p ON p.id = rp.permission_id AND p.code = ?
     WHERE ur.user_id = ?
     LIMIT 1`,
    [permission, userId]
  );
  return Array.isArray(rows) && rows.length > 0;
}

/** Lista padrão de permissões quando a tabela permissions não existe (fallback para admin). */
const FALLBACK_PERMISSIONS = [
  'dashboard.view', 'contas-pagar.view', 'contas-receber.view', 'contas-receber-ctes.view',
  'despesas-fixas.view', 'ctes.view', 'manifestos.view', 'manifestos.import',
  'contas-bancarias.view', 'bank.view', 'bank.import',
  'conciliacao-bancaria.view', 'reconciliation.view', 'reconciliation.confirm',
  'movimentacoes.view', 'fluxo-caixa.view', 'dre.view',
  'clientes.view', 'categorias-despesa.view', 'categorias-receita.view', 'centros-custo.view',
  'naturezas.view', 'plano-contas.view', 'tabelas-frete.view', 'motoristas.view', 'veiculos.view',
  'despesas-viagem.view', 'usuarios.view', 'perfis.view',
];

/**
 * Get all permission codes for a user (for UI).
 */
export async function getUserPermissions(userId: number): Promise<string[]> {
  const userRows = await query<{ perfil: string }[]>(
    'SELECT perfil FROM usuarios WHERE id = ? AND ativo = 1 LIMIT 1',
    [userId]
  );
  const user = Array.isArray(userRows) ? userRows[0] : null;
  if (!user) return [];
  if (user.perfil === 'administrador') {
    try {
      const all = await query<{ code: string }[]>('SELECT code FROM permissions');
      const fromDb = Array.isArray(all) ? all.map((r) => r.code) : [];
      // Mescla com fallback para que novos módulos (ex.: manifestos) apareçam mesmo antes de rodar a migration de permissões
      return [...new Set([...fromDb, ...FALLBACK_PERMISSIONS])];
    } catch {
      return FALLBACK_PERMISSIONS;
    }
  }
  try {
    const rows = await query<{ code: string }[]>(
      `SELECT DISTINCT p.code FROM user_roles ur
       INNER JOIN role_permissions rp ON rp.role_id = ur.role_id
       INNER JOIN permissions p ON p.id = rp.permission_id
       WHERE ur.user_id = ?`,
      [userId]
    );
    return Array.isArray(rows) ? rows.map((r) => r.code) : [];
  } catch {
    return [];
  }
}
