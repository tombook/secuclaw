import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SecuClaw RoleSwitcher
 *
 * Dropdown panel showing 8 role cards. Clicking a card switches the entire
 * UI color scheme via the Zustand role-context store.
 *
 * Uses shadcn/ui DropdownMenu (Popover is not available in this project).
 */
import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES, ALL_ROLE_IDS } from '@/config/role-themes';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
export const RoleSwitcher = () => {
    const currentRole = useRoleContextStore((s) => s.currentRole);
    const setRole = useRoleContextStore((s) => s.setRole);
    const theme = currentRole ? ROLE_THEMES[currentRole] : null;
    return (_jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs("button", { className: cn('flex items-center gap-2 rounded-lg px-3 py-1.5', 'text-sm font-medium transition-all duration-300', 'hover:bg-white/10 focus:outline-none focus:ring-1', 'border border-white/10'), style: {
                        color: theme?.colors.text ?? '#f1f5f9',
                    }, children: [_jsx("span", { className: "text-base", children: theme?.icon ?? '🛡️' }), _jsx("span", { className: "hidden sm:inline max-w-[120px] truncate", children: theme?.nameCn ?? '选择角色' }), _jsx(ChevronDown, { className: "h-3.5 w-3.5 opacity-60" })] }) }), _jsxs(DropdownMenuContent, { align: "center", className: "w-[420px] max-h-[460px] overflow-y-auto rounded-xl border border-white/10 bg-[#0f1525] p-2 shadow-2xl", children: [_jsx("div", { className: "px-2 py-1.5 text-xs font-medium uppercase tracking-wider text-slate-500", children: "\u5207\u6362\u5B89\u5168\u89D2\u8272" }), _jsx("div", { className: "grid grid-cols-1 gap-1 mt-1", children: ALL_ROLE_IDS.map((roleId) => {
                            const r = ROLE_THEMES[roleId];
                            const isActive = currentRole === roleId;
                            return (_jsxs(DropdownMenuItem, { className: cn('relative flex items-start gap-3 rounded-lg px-3 py-2.5 cursor-pointer', 'transition-all duration-200 hover:bg-white/5 focus:bg-white/5', isActive && 'bg-white/10'), onSelect: (e) => {
                                    e.preventDefault();
                                    setRole(roleId);
                                }, children: [_jsx("div", { className: "absolute left-0 top-2 bottom-2 w-[3px] rounded-full transition-all duration-300", style: { backgroundColor: r.colors.primary } }), _jsx("span", { className: "text-xl mt-0.5 ml-2", children: r.icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-semibold text-slate-100", children: r.nameCn }), _jsx("span", { className: "text-[10px] text-slate-500", children: r.name }), isActive && (_jsx("span", { className: "ml-auto text-[10px] px-1.5 py-0.5 rounded-full font-medium", style: {
                                                            backgroundColor: r.colors.primary + '40',
                                                            color: r.colors.secondary,
                                                        }, children: "\u5F53\u524D" }))] }), _jsx("p", { className: "text-xs text-slate-400 mt-0.5 truncate", children: r.description })] })] }, roleId));
                        }) })] })] }));
};
export default RoleSwitcher;
//# sourceMappingURL=RoleSwitcher.js.map