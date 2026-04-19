import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * SecuClaw AppSidebar
 *
 * Left sidebar with role-centric navigation.
 * Collapsible: 220 px expanded / 64 px collapsed.
 * Selected item highlighted with role theme color + subtle glow.
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Shield, Briefcase, Settings2, HardHat, Lock, TrendingUp, Link2, Crosshair, FileText, Bug, Target, CheckCircle2, BarChart3, Activity, BookOpen, ShoppingBag, Radio, Settings, ChevronLeft, ChevronRight, } from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
const NAV_ITEMS = [
    { type: 'page', id: 'dashboard', label: '统一总览', emoji: '🏠', icon: LayoutDashboard },
    { type: 'role', id: 'security-expert', label: '安全专家视角', emoji: '🛡️', icon: Shield, roleId: 'security-expert' },
    { type: 'role', id: 'ciso', label: 'CISO 视角', emoji: '👔', icon: Briefcase, roleId: 'ciso' },
    { type: 'role', id: 'security-ops', label: '安全运营视角', emoji: '⚙️', icon: Settings2, roleId: 'security-ops' },
    { type: 'role', id: 'security-architect', label: '架构师视角', emoji: '🏗️', icon: HardHat, roleId: 'security-architect' },
    { type: 'role', id: 'privacy-officer', label: '隐私官视角', emoji: '🔐', icon: Lock, roleId: 'privacy-officer' },
    { type: 'role', id: 'business-security-officer', label: '业务安全视角', emoji: '📊', icon: TrendingUp, roleId: 'business-security-officer' },
    { type: 'role', id: 'supply-chain-security', label: '供应链视角', emoji: '🔗', icon: Link2, roleId: 'supply-chain-security' },
    { type: 'role', id: 'secuclaw-commander', label: '指挥官视角', emoji: '🎯', icon: Crosshair, roleId: 'secuclaw-commander' },
    { type: 'separator' },
    { type: 'page', id: 'incidents', label: '安全事件', emoji: '📋', icon: FileText },
    { type: 'page', id: 'vulnerabilities', label: '漏洞管理', emoji: '🐛', icon: Bug },
    { type: 'page', id: 'threat-intel', label: '威胁情报', emoji: '🎯', icon: Target },
    { type: 'page', id: 'compliance', label: '合规管理', emoji: '✅', icon: CheckCircle2 },
    { type: 'page', id: 'reports', label: '分析报告', emoji: '📊', icon: BarChart3 },
    { type: 'page', id: 'war-room', label: '作战室', emoji: '🏥', icon: Activity },
    { type: 'page', id: 'knowledge', label: '知识库', emoji: '📚', icon: BookOpen },
    { type: 'page', id: 'skill-market', label: '技能市场', emoji: '🛒', icon: ShoppingBag },
    { type: 'page', id: 'channels', label: '频道管理', emoji: '📡', icon: Radio },
    { type: 'separator' },
    { type: 'page', id: 'settings', label: '系统设置', emoji: '⚙️', icon: Settings },
];
// ── Active state tracking (local, for now) ──
const useActiveItem = () => {
    const [activeId, setActiveId] = React.useState('dashboard');
    return { activeId, setActiveId };
};
// ── Route mapping ──
const NAV_ROUTES = {
    dashboard: '/',
    incidents: '/incidents',
    vulnerabilities: '/vulnerabilities',
    'threat-intel': '/threats',
    compliance: '/compliance',
    reports: '/reports',
    'war-room': '/war-room',
    knowledge: '/knowledge',
    'skill-market': '/skills-market',
    channels: '/channels',
    settings: '/settings',
};
// ── Component ──
export const AppSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const collapsed = useUIStore((s) => s.sidebarCollapsed);
    const toggleSidebar = useUIStore((s) => s.toggleSidebar);
    const currentRole = useRoleContextStore((s) => s.currentRole);
    const setRole = useRoleContextStore((s) => s.setRole);
    const theme = currentRole ? ROLE_THEMES[currentRole] : null;
    const { activeId, setActiveId } = useActiveItem();
    // Sync active state with current route
    React.useEffect(() => {
        const path = location.pathname.replace('/', '') || 'dashboard';
        const routeKey = Object.entries(NAV_ROUTES).find(([, v]) => v === location.pathname)?.[0] || path;
        setActiveId(routeKey);
    }, [location.pathname]);
    const handleNavClick = (item) => {
        if (item.type === 'separator')
            return;
        if (item.type === 'role') {
            setRole(item.roleId);
        }
        const route = NAV_ROUTES[item.id] || `/${item.id === 'dashboard' ? '' : item.id}`;
        navigate(route);
        setActiveId(item.id);
    };
    const isActive = (item) => {
        if (item.type === 'separator')
            return false;
        if (item.type === 'role' && item.roleId === currentRole)
            return true;
        return item.id === activeId;
    };
    return (_jsx(TooltipProvider, { delayDuration: 0, children: _jsxs("aside", { className: cn('hidden md:flex flex-col h-full shrink-0 overflow-hidden', 'bg-[#0f1525] border-r border-white/[0.06]', 'transition-all duration-300 ease-in-out'), style: { width: collapsed ? 64 : 220 }, children: [_jsxs("div", { className: cn('flex items-center h-14 shrink-0 border-b border-white/[0.06] px-4', collapsed ? 'justify-center' : 'gap-3'), children: [_jsx("div", { className: "h-8 w-8 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 transition-colors duration-500", style: {
                                background: theme
                                    ? `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                                    : 'linear-gradient(135deg, #1e40af, #3b82f6)',
                            }, children: "\uD83E\uDD85" }), !collapsed && (_jsx("span", { className: "text-sm font-bold text-slate-200 tracking-wide whitespace-nowrap", children: "SecuClaw" }))] }), _jsx("nav", { className: "flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-thin", children: NAV_ITEMS.map((item, idx) => {
                        if (item.type === 'separator') {
                            return (_jsx(Separator, { className: "my-2 bg-white/[0.06]" }, `sep-${idx}`));
                        }
                        const active = isActive(item);
                        const Icon = item.icon;
                        const activeColor = theme?.colors.secondary ?? '#3b82f6';
                        const inner = (_jsxs("button", { onClick: () => handleNavClick(item), className: cn('group relative flex items-center w-full rounded-lg text-left', 'transition-all duration-200', collapsed ? 'justify-center px-0 py-2' : 'gap-3 px-3 py-2', active
                                ? 'text-white'
                                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'), style: {
                                backgroundColor: active ? `${activeColor}15` : undefined,
                                boxShadow: active ? `inset 3px 0 0 ${activeColor}, 0 0 12px ${activeColor}20` : undefined,
                            }, children: [_jsx(Icon, { className: cn('shrink-0 transition-colors duration-200', collapsed ? 'h-5 w-5' : 'h-4 w-4'), style: { color: active ? activeColor : undefined } }), !collapsed && (_jsx("span", { className: "text-sm truncate", children: item.label }))] }, item.id));
                        // When collapsed, wrap in tooltip
                        if (collapsed) {
                            return (_jsxs(Tooltip, { children: [_jsx(TooltipTrigger, { asChild: true, children: inner }), _jsxs(TooltipContent, { side: "right", className: "bg-[#1a2035] text-slate-200 border-white/10 text-xs", children: [item.emoji, " ", item.label] })] }, item.id));
                        }
                        return inner;
                    }) }), _jsx("div", { className: "shrink-0 border-t border-white/[0.06] p-2", children: _jsx(Button, { variant: "ghost", size: "sm", className: "w-full text-slate-500 hover:text-slate-300 hover:bg-white/5", onClick: toggleSidebar, children: collapsed ? (_jsx(ChevronRight, { className: "h-4 w-4" })) : (_jsxs(_Fragment, { children: [_jsx(ChevronLeft, { className: "h-4 w-4 mr-2" }), _jsx("span", { className: "text-xs", children: "\u6536\u8D77" })] })) }) })] }) }));
};
export default AppSidebar;
//# sourceMappingURL=AppSidebar.js.map