'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { PermissionGuard } from '@/components/PermissionGuard';
import type { ReactNode } from 'react';

type DashboardShellProps = {
  userName?: string;
  title: string;
  permissions: string[];
  children: ReactNode;
};

export function DashboardShell({ userName, title, permissions, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMenu = () => setMobileMenuOpen(false);
  const toggleMenu = () => setMobileMenuOpen((o) => !o);

  return (
    <div className="caixa-theme flex h-screen overflow-hidden bg-[hsl(var(--background))]">
      {/* Overlay em telas pequenas quando o menu está aberto */}
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={closeMenu}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 lg:hidden ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      <Sidebar
        userName={userName}
        isMobileOpen={mobileMenuOpen}
        onClose={closeMenu}
      />

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Topbar title={title} onMenuToggle={toggleMenu} />
        <main className="form-contraste flex-1 overflow-y-auto p-4">
          <PermissionGuard permissions={permissions}>{children}</PermissionGuard>
        </main>
      </div>
    </div>
  );
}
