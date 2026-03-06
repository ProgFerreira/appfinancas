'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';

const STORAGE_KEY = 'financas-sidebar-open';

type MenuLink = {
  type: 'link';
  href: string;
  label: string;
  icon: string;
  /** Código da permissão necessária para exibir o link (ex: dashboard.view). Se não informado, sempre exibe. */
  permission?: string;
};

type MenuGroup = {
  type: 'group';
  label: string;
  icon: string;
  children: MenuLink[];
};

type MenuItem = MenuLink | MenuGroup;

function isGroup(item: MenuItem): item is MenuGroup {
  return item.type === 'group';
}

const menuStructure: MenuItem[] = [
  { type: 'link', href: '/dashboard', label: 'Dashboard', icon: '📊', permission: 'dashboard.view' },
  {
    type: 'group',
    label: 'Cotações',
    icon: '💰',
    children: [
      { type: 'link', href: '/comercial/cotacao', label: 'Cotação de frete', icon: '📦', permission: 'cotacao.view' },
      { type: 'link', href: '/cadastros/parceiros', label: 'Parceiros', icon: '🤝', permission: 'parceiros.view' },
    ],
  },
  {
    type: 'group',
    label: 'Tarefas',
    icon: '✅',
    children: [
      { type: 'link', href: '/tarefas', label: 'Tarefas', icon: '✅', permission: 'tarefas.view' },
      { type: 'link', href: '/tarefas/unidades', label: 'Tipos de unidade', icon: '📂', permission: 'tarefas.view' },
    ],
  },
  {
    type: 'group',
    label: 'Docs',
    icon: '📄',
    children: [
      { type: 'link', href: '/documentos', label: 'Documentos', icon: '📄', permission: 'documentos.view' },
      { type: 'link', href: '/documentos/tipos', label: 'Tipos de documento', icon: '📂', permission: 'documentos.view' },
    ],
  },
  {
    type: 'group',
    label: 'Contas a pagar e receber',
    icon: '💸',
    children: [
      { type: 'link', href: '/contas-pagar', label: 'Contas a Pagar', icon: '💸', permission: 'contas-pagar.view' },
      { type: 'link', href: '/contas-receber', label: 'Contas a Receber', icon: '💰', permission: 'contas-receber.view' },
      { type: 'link', href: '/contas-receber-ctes', label: 'Contas a receber × CTe', icon: '🔗', permission: 'contas-receber-ctes.view' },
      { type: 'link', href: '/despesas-fixas', label: 'Despesas fixas', icon: '📌', permission: 'despesas-fixas.view' },
    ],
  },
  {
    type: 'group',
    label: 'Documentos',
    icon: '📋',
    children: [
      { type: 'link', href: '/ctes', label: 'CTe', icon: '📄', permission: 'ctes.view' },
      { type: 'link', href: '/manifestos', label: 'Manifestos', icon: '📋', permission: 'manifestos.view' },
      { type: 'link', href: '/manifestos/importar', label: 'Importar manifestos', icon: '📤', permission: 'manifestos.import' },
      { type: 'link', href: '/manifestos/analise', label: 'Análise manifestos', icon: '📊', permission: 'manifestos.view' },
      { type: 'link', href: '/manifestos/estatisticas-motorista', label: 'Estatísticas por motorista', icon: '👤', permission: 'manifestos.view' },
      { type: 'link', href: '/manifestos/graficos', label: 'Gráficos manifestos', icon: '📈', permission: 'manifestos.view' },
    ],
  },
  {
    type: 'group',
    label: 'Bancário',
    icon: '🏦',
    children: [
      { type: 'link', href: '/contas-bancarias', label: 'Contas bancárias', icon: '🏦', permission: 'contas-bancarias.view' },
      { type: 'link', href: '/bank/importar', label: 'Importar OFX', icon: '📤', permission: 'bank.import' },
      { type: 'link', href: '/bank/transacoes', label: 'Transações extrato', icon: '📑', permission: 'bank.view' },
      { type: 'link', href: '/bank/extrato', label: 'Extrato bancário', icon: '📋', permission: 'bank.view' },
      { type: 'link', href: '/conciliacao-bancaria', label: 'Conciliação bancária', icon: '🔄', permission: 'conciliacao-bancaria.view' },
      { type: 'link', href: '/conciliacao', label: 'Conciliação (sugestões)', icon: '✓', permission: 'reconciliation.view' },
    ],
  },
  {
    type: 'group',
    label: 'Relatórios',
    icon: '📈',
    children: [
      { type: 'link', href: '/dre', label: 'DRE', icon: '📋', permission: 'dre.view' },
      { type: 'link', href: '/fluxo-caixa', label: 'Fluxo de caixa', icon: '💵', permission: 'fluxo-caixa.view' },
      { type: 'link', href: '/movimentacoes', label: 'Movimentações', icon: '📈', permission: 'movimentacoes.view' },
    ],
  },
  {
    type: 'group',
    label: 'Cadastros',
    icon: '📁',
    children: [
      { type: 'link', href: '/clientes', label: 'Clientes', icon: '👥', permission: 'clientes.view' },
      { type: 'link', href: '/categorias-despesa', label: 'Categorias despesa', icon: '📁', permission: 'categorias-despesa.view' },
      { type: 'link', href: '/categorias-receita', label: 'Categorias receita', icon: '📂', permission: 'categorias-receita.view' },
      { type: 'link', href: '/centros-custo', label: 'Centros de custo', icon: '📊', permission: 'centros-custo.view' },
      { type: 'link', href: '/naturezas', label: 'Naturezas', icon: '🌿', permission: 'naturezas.view' },
      { type: 'link', href: '/plano-contas', label: 'Plano de contas', icon: '📒', permission: 'plano-contas.view' },
      { type: 'link', href: '/tabelas-frete', label: 'Tabelas de frete', icon: '🚚', permission: 'tabelas-frete.view' },
      { type: 'link', href: '/motoristas', label: 'Motoristas', icon: '👤', permission: 'motoristas.view' },
      { type: 'link', href: '/veiculos', label: 'Veículos', icon: '🚛', permission: 'veiculos.view' },
      { type: 'link', href: '/despesas-viagem', label: 'Despesas de viagem', icon: '✈️', permission: 'despesas-viagem.view' },
    ],
  },
  {
    type: 'group',
    label: 'Configurações',
    icon: '🔐',
    children: [
      { type: 'link', href: '/usuarios', label: 'Usuários', icon: '🔐', permission: 'usuarios.view' },
      { type: 'link', href: '/perfis', label: 'Perfis', icon: '👤', permission: 'perfis.view' },
    ],
  },
];

function hasActiveChild(pathname: string, group: MenuGroup): boolean {
  return group.children.some(
    (c) => pathname === c.href || (c.href !== '/' && pathname.startsWith(c.href + '/'))
  );
}

/** Filtra o menu conforme permissões do usuário. null = ainda não carregou (mostra tudo); [] = sem permissões (só itens sem permission); senão filtra por permission. */
function filterMenuByPermissions(menu: MenuItem[], permissions: string[] | null): MenuItem[] {
  const showAll = permissions === null;
  return menu
    .map((item) => {
      if (item.type === 'link') {
        if (!item.permission || showAll || permissions.includes(item.permission)) return item;
        return null;
      }
      const filteredChildren = item.children.filter(
        (c) => !c.permission || showAll || permissions.includes(c.permission)
      );
      if (filteredChildren.length === 0) return null;
      return { ...item, children: filteredChildren };
    })
    .filter((x): x is MenuItem => x !== null);
}

type SidebarProps = {
  userName?: string;
  /** Em mobile: controla se o drawer está aberto. */
  isMobileOpen?: boolean;
  /** Em mobile: callback para fechar o menu (ex.: ao clicar em um link). */
  onClose?: () => void;
};

export function Sidebar({ userName, isMobileOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/auth/permissions')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data?.permissions)) {
          setPermissions(data.data.permissions);
        } else {
          setPermissions([]);
        }
      })
      .catch(() => setPermissions([]));
  }, []);

  const menuFiltered = useMemo(() => filterMenuByPermissions(menuStructure, permissions), [permissions]);

  const initialOpen = useMemo(() => {
    const o: Record<string, boolean> = {};
    menuFiltered.forEach((item) => {
      if (isGroup(item) && hasActiveChild(pathname, item)) {
        o[item.label] = true;
      }
    });
    return o;
  }, [pathname, menuFiltered]);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setOpenGroups(JSON.parse(s) as Record<string, boolean>);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (Object.keys(openGroups).length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(openGroups));
    } catch {
      // ignore
    }
  }, [openGroups]);

  const isOpen = (label: string) => openGroups[label] ?? initialOpen[label] ?? false;
  const toggle = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !(prev[label] ?? initialOpen[label]) }));

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <nav
      className="sidebar-drawer flex flex-col h-full w-64 shrink-0 overflow-hidden border-r"
      data-open={isMobileOpen ? 'true' : 'false'}
      style={{
        background: 'hsl(var(--sidebar-background))',
        color: 'hsl(var(--sidebar-foreground))',
        borderColor: 'hsl(var(--sidebar-border))',
      }}
    >
      <div className="p-4 border-b shrink-0" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <span>🚛</span> Financeiro
        </h2>
        {userName && (
          <p className="text-sm mt-1 truncate opacity-80">Olá, {userName}</p>
        )}
      </div>

      <ul className="flex flex-col gap-0.5 p-2 flex-1 overflow-y-auto">
        {menuFiltered.map((item) => {
          if (item.type === 'link') {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                    isActive
                      ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]'
                      : 'hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              </li>
            );
          }

          const group = item;
          const open = isOpen(group.label);
          const activeChild = hasActiveChild(pathname, group);

          return (
            <li key={group.label} className="flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => toggle(group.label)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm w-full text-left ${
                  activeChild
                    ? 'bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]'
                    : 'hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]'
                }`}
              >
                <span className="shrink-0">{group.icon}</span>
                <span className="truncate flex-1">{group.label}</span>
                <span
                  className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                  aria-hidden
                >
                  ▾
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ease-out ${
                  open ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <ul className="pl-4 pb-1 flex flex-col gap-0.5 border-l ml-3 space-y-0.5" style={{ borderColor: 'hsl(var(--sidebar-border))' }}>
                  {group.children.map((child) => {
                    const isActive =
                      pathname === child.href ||
                      (child.href !== '/' && pathname.startsWith(child.href + '/'));
                    return (
                      <li key={child.href}>
                        <Link
                          href={child.href}
                          onClick={onClose}
                          className={`flex items-center gap-2 px-2.5 py-2 rounded-md text-sm ${
                            isActive
                              ? 'bg-[hsl(var(--sidebar-primary))] text-[hsl(var(--sidebar-primary-foreground))]'
                              : 'hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))] opacity-90'
                          }`}
                        >
                          <span className="shrink-0 text-xs">{child.icon}</span>
                          <span className="truncate">{child.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          );
        })}

        <li className="mt-auto pt-2">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-sm opacity-80 hover:opacity-100 hover:bg-[hsl(var(--sidebar-accent))] transition-colors"
            style={{ color: 'hsl(0 72% 65%)' }}
          >
            <span>🚪</span> Sair
          </button>
        </li>
      </ul>
    </nav>
  );
}
