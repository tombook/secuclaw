/**
 * SecuClaw AppLayout
 *
 * Master layout: collapsible sidebar + content area.
 * On mobile (md breakpoint), sidebar becomes a Sheet overlay.
 * SmartRecommendationBar sits at the top of the content area.
 */

import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores/ui-store';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { SmartRecommendationBar } from './SmartRecommendationBar';
import { cn } from '@/lib/utils';

// ── Mobile sidebar (Sheet-based) ──

const MobileSidebar: React.FC = () => {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);
  const open = !collapsed; // When not collapsed on mobile, show sheet

  return (
    <Sheet open={open} onOpenChange={(v) => setSidebarCollapsed(!v)}>
      <SheetContent
        side="left"
        className="w-[260px] p-0 bg-[#0f1525] border-r border-white/[0.06]"
      >
        <SheetTitle className="sr-only">导航菜单</SheetTitle>
        {/* Re-use the same sidebar content, but always expanded */}
        <div className="h-full">
          <SidebarContent forceExpanded />
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Extracted sidebar content (reused by desktop + mobile) ──

const SidebarContent: React.FC<{ forceExpanded?: boolean }> = () => {
  // Just render AppSidebar — it manages its own collapsed state via store
  return <AppSidebar />;
};

// ── Main layout ──

export const AppLayout: React.FC = () => {
  const currentRole = useRoleContextStore((s) => s.currentRole);
  const theme = currentRole ? ROLE_THEMES[currentRole] : null;

  return (
    <div
      className={cn(
        'flex h-screen w-screen overflow-hidden',
        'bg-[#0a0e1a] text-slate-100',
        'transition-colors duration-500'
      )}
      style={{
        // Subtle tint from role theme
        backgroundImage: theme
          ? `radial-gradient(ellipse at 50% 0%, ${theme.colors.primary}08 0%, transparent 60%)`
          : undefined,
      }}
    >
      {/* Desktop sidebar */}
      <AppSidebar />

      {/* Mobile sidebar (Sheet) */}
      <MobileSidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <AppHeader />

        {/* Smart recommendation bar */}
        <SmartRecommendationBar />

        {/* Page content — rendered via React Router Outlet */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
