import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SecuClaw AppHeader
 *
 * Top bar: page title / breadcrumbs (left), role switcher (center),
 * notification bell + AI assistant + settings (right).
 * Height 56 px, semi-transparent with bottom glow border.
 */
import React from 'react';
import { Bell, Bot, Settings, Menu } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RoleSwitcher } from './RoleSwitcher';
import { cn } from '@/lib/utils';
export const AppHeader = () => {
    const toggleSidebar = useUIStore((s) => s.toggleSidebar);
    const notifications = useUIStore((s) => s.notifications);
    const currentRole = useRoleContextStore((s) => s.currentRole);
    const theme = currentRole ? ROLE_THEMES[currentRole] : null;
    const unreadCount = notifications.length;
    return (_jsxs("header", { className: cn('sticky top-0 z-30 flex h-14 items-center justify-between px-4', 'bg-[#0f1525]/80 backdrop-blur-xl', 'border-b transition-colors duration-500'), style: {
            borderBottomColor: theme
                ? `${theme.colors.primary}40`
                : 'rgba(255,255,255,0.06)',
            boxShadow: theme
                ? `0 1px 8px ${theme.colors.primary}20`
                : 'none',
        }, children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "shrink-0 text-slate-400 hover:text-slate-200 hover:bg-white/5 md:hidden", onClick: toggleSidebar, children: _jsx(Menu, { className: "h-5 w-5" }) }), _jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [_jsx("h1", { className: "text-sm font-semibold text-slate-200 truncate", children: theme?.nameCn ?? 'SecuClaw' }), theme && (_jsxs("span", { className: "hidden sm:inline text-xs text-slate-500 truncate", children: ["/ ", theme.description] }))] })] }), _jsx("div", { className: "hidden md:flex", children: _jsx(RoleSwitcher, {}) }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsxs(Button, { variant: "ghost", size: "icon", className: "relative text-slate-400 hover:text-slate-200 hover:bg-white/5", children: [_jsx(Bell, { className: "h-[18px] w-[18px]" }), unreadCount > 0 && (_jsx(Badge, { className: "absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 text-[10px] font-bold flex items-center justify-center rounded-full", style: {
                                    backgroundColor: theme?.colors.accent ?? '#ef4444',
                                    color: '#fff',
                                    border: 'none',
                                }, children: unreadCount > 99 ? '99+' : unreadCount }))] }), _jsx(Button, { variant: "ghost", size: "icon", className: "text-slate-400 hover:text-slate-200 hover:bg-white/5", style: {
                            color: theme?.colors.secondary,
                        }, children: _jsx(Bot, { className: "h-[18px] w-[18px]" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "text-slate-400 hover:text-slate-200 hover:bg-white/5", children: _jsx(Settings, { className: "h-[18px] w-[18px]" }) })] })] }));
};
export default AppHeader;
//# sourceMappingURL=AppHeader.js.map