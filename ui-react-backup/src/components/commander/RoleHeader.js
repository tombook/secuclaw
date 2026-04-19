import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { ROLE_THEMES } from '@/config/role-themes';
import { useRoleContextStore } from '@/stores/role-context';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Download, Zap } from 'lucide-react';
export const RoleHeader = ({ onBack }) => {
    const currentRole = useRoleContextStore((s) => s.currentRole);
    if (!currentRole)
        return null;
    const theme = ROLE_THEMES[currentRole];
    return (_jsx("div", { className: "relative pb-4 mb-6", style: { borderBottom: '1px solid rgba(255,255,255,0.08)' }, children: _jsxs("div", { className: "flex items-start gap-5", children: [_jsx("div", { className: "flex items-center justify-center flex-shrink-0 text-3xl shadow-lg", style: {
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        backgroundColor: theme.colors.primary,
                        boxShadow: `0 4px 20px ${theme.colors.primary}44`,
                    }, children: theme.icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-baseline gap-3 flex-wrap", children: [_jsx("h1", { className: "text-2xl font-bold tracking-tight", style: { color: theme.colors.text }, children: theme.name }), _jsx("span", { className: "text-sm font-medium", style: { color: theme.colors.textSecondary }, children: theme.nameCn })] }), _jsx("p", { className: "text-sm mt-1", style: { color: theme.colors.textSecondary }, children: theme.description })] }), _jsxs("div", { className: "flex items-center gap-2 flex-shrink-0", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: onBack, className: "text-white/60 hover:text-white hover:bg-white/5 gap-1.5", children: [_jsx(ChevronLeft, { className: "w-4 h-4" }), "\u8FD4\u56DE\u603B\u89C8"] }), _jsxs(Button, { variant: "ghost", size: "sm", className: "text-white/60 hover:text-white hover:bg-white/5 gap-1.5", children: [_jsx(Download, { className: "w-4 h-4" }), "\u5BFC\u51FA\u62A5\u544A"] }), _jsxs(Button, { size: "sm", className: "gap-1.5 text-white text-xs", style: { backgroundColor: theme.colors.primary }, children: [_jsx(Zap, { className: "w-3.5 h-3.5" }), "\u5FEB\u901F\u64CD\u4F5C"] })] })] }) }));
};
export default RoleHeader;
//# sourceMappingURL=RoleHeader.js.map