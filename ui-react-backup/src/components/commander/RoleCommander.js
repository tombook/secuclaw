import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import { getRoleLayoutConfig } from '@/config/role-layout-config';
import { RoleHeader } from './RoleHeader';
import { RaciTaskSection } from './RaciTaskSection';
import { RoleMetricsSection } from './RoleMetricsSection';
import { RoleCollaborationSection } from './RoleCollaborationSection';
/**
 * Map layout type to CSS grid template.
 * We support 8 layout variants but use a unified responsive grid.
 */
function gridClass(layoutType) {
    switch (layoutType) {
        case 'grid':
            return 'grid grid-cols-3 gap-4';
        case 'card-flow':
            return 'grid grid-cols-2 gap-4';
        case 'three-column':
            return 'grid grid-cols-3 gap-4';
        case 'timeline':
            return 'flex flex-col gap-4';
        case 'war-room':
            return 'grid grid-cols-2 gap-4';
        case 'dashboard':
            return 'grid grid-cols-3 gap-4';
        case 'queue':
            return 'flex flex-col gap-4';
        case 'graph':
            return 'grid grid-cols-2 gap-4';
        default:
            return 'grid grid-cols-3 gap-4';
    }
}
/**
 * Map section size to span class.
 */
function spanClass(size) {
    switch (size) {
        case 'full':
            return 'col-span-full';
        case 'large':
            return 'col-span-2';
        case 'medium':
            return 'col-span-1';
        case 'small':
            return 'col-span-1';
        default:
            return 'col-span-1';
    }
}
export const RoleCommander = ({ onBack }) => {
    const currentRole = useRoleContextStore((s) => s.currentRole);
    const resetToOverview = useRoleContextStore((s) => s.resetToOverview);
    if (!currentRole)
        return null;
    const theme = ROLE_THEMES[currentRole];
    const layoutConfig = getRoleLayoutConfig(currentRole);
    const handleBack = () => {
        resetToOverview();
        onBack?.();
    };
    // Build section renderers based on type
    const sectionRenderer = (type) => {
        switch (type) {
            case 'raci':
                return _jsx(RaciTaskSection, {});
            case 'metrics':
                return _jsx(RoleMetricsSection, {});
            case 'collaboration':
                return _jsx(RoleCollaborationSection, {});
            case 'custom':
                return (_jsx("div", { className: "rounded-lg p-4 flex items-center justify-center text-xs text-white/30", style: { backgroundColor: '#0f1525', minHeight: 120 }, children: "[\u81EA\u5B9A\u4E49\u7EC4\u4EF6\u533A\u57DF]" }));
            default:
                return null;
        }
    };
    return (_jsxs("div", { className: "min-h-screen p-6", style: {
            backgroundColor: theme.colors.background,
            color: theme.colors.text,
            '--role-primary': theme.colors.primary,
            '--role-secondary': theme.colors.secondary,
            '--role-accent': theme.colors.accent,
            '--role-text': theme.colors.text,
            '--role-text-secondary': theme.colors.textSecondary,
        }, children: [_jsx(RoleHeader, { onBack: handleBack }), _jsx("div", { className: gridClass(layoutConfig.layoutType), children: layoutConfig.sections
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (_jsx("div", { className: spanClass(section.size), children: _jsxs("div", { className: "rounded-lg p-4 transition-all duration-200 hover:brightness-105", style: { backgroundColor: '#0f1525' }, children: [_jsx("h4", { className: "text-xs font-semibold mb-3 uppercase tracking-wide", style: { color: theme.colors.textSecondary }, children: section.title }), sectionRenderer(section.type)] }) }, section.id))) })] }));
};
export default RoleCommander;
//# sourceMappingURL=RoleCommander.js.map