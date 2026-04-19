import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { Sheet, SheetContent, SheetTitle, } from '@/components/ui/sheet';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { SmartRecommendationBar } from './SmartRecommendationBar';
import { cn } from '@/lib/utils';
// ── Mobile sidebar (Sheet-based) ──
const MobileSidebar = () => {
    const collapsed = useUIStore((s) => s.sidebarCollapsed);
    const setSidebarCollapsed = useUIStore((s) => s.setSidebarCollapsed);
    const open = !collapsed; // When not collapsed on mobile, show sheet
    return (_jsx(Sheet, { open: open, onOpenChange: (v) => setSidebarCollapsed(!v), children: _jsxs(SheetContent, { side: "left", className: "w-[260px] p-0 bg-[#0f1525] border-r border-white/[0.06]", children: [_jsx(SheetTitle, { className: "sr-only", children: "\u5BFC\u822A\u83DC\u5355" }), _jsx("div", { className: "h-full", children: _jsx(SidebarContent, { forceExpanded: true }) })] }) }));
};
// ── Extracted sidebar content (reused by desktop + mobile) ──
const SidebarContent = () => {
    // Just render AppSidebar — it manages its own collapsed state via store
    return _jsx(AppSidebar, {});
};
// ── Main layout ──
export const AppLayout = () => {
    const currentRole = useRoleContextStore((s) => s.currentRole);
    const theme = currentRole ? ROLE_THEMES[currentRole] : null;
    return (_jsxs("div", { className: cn('flex h-screen w-screen overflow-hidden', 'bg-[#0a0e1a] text-slate-100', 'transition-colors duration-500'), style: {
            // Subtle tint from role theme
            backgroundImage: theme
                ? `radial-gradient(ellipse at 50% 0%, ${theme.colors.primary}08 0%, transparent 60%)`
                : undefined,
        }, children: [_jsx(AppSidebar, {}), _jsx(MobileSidebar, {}), _jsxs("div", { className: "flex flex-1 flex-col min-w-0 overflow-hidden", children: [_jsx(AppHeader, {}), _jsx(SmartRecommendationBar, {}), _jsx("main", { className: "flex-1 overflow-y-auto p-4 md:p-6", children: _jsx(Outlet, {}) })] })] }));
};
export default AppLayout;
//# sourceMappingURL=AppLayout.js.map