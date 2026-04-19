import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { RACI_SCENARIOS } from '@/config/raci-matrix';
import { ROLE_THEMES } from '@/config/role-themes';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
/* ── Helpers ── */
const RACI_CONFIG = {
    R: { color: '#3b82f6', label: 'R 负责执行', desc: '需要你亲自执行的任务', actionLabel: '执行' },
    A: { color: '#ef4444', label: 'A 最终审批', desc: '需要你做出决策的事项', actionLabel: '审批' },
    C: { color: '#22c55e', label: 'C 咨询建议', desc: '需要你提供专业意见', actionLabel: '回复' },
    I: { color: '#f59e0b', label: 'I 知会同步', desc: '需要你知晓的信息', actionLabel: '确认' },
};
const STATUS_DOT = {
    pending: 'bg-white/30',
    'in-progress': 'bg-blue-400 animate-pulse',
    done: 'bg-green-400',
};
export const RaciTaskSection = () => {
    const currentRole = useRoleContextStore((s) => s.currentRole);
    const [expanded, setExpanded] = useState(null);
    if (!currentRole)
        return null;
    const theme = ROLE_THEMES[currentRole];
    // Aggregate tasks by RACI type
    const raciGroups = { R: [], A: [], C: [], I: [] };
    RACI_SCENARIOS.forEach((scenario) => {
        const assignment = scenario.assignments.find((a) => a.role === currentRole);
        if (!assignment)
            return;
        const role = assignment.raci;
        assignment.tasks.forEach((task, idx) => {
            raciGroups[role].push({
                title: task,
                description: scenario.description,
                scenario: scenario.name,
                status: idx === 0 ? 'in-progress' : idx < 2 ? 'pending' : 'done',
            });
        });
    });
    const raciTypes = ['R', 'A', 'C', 'I'];
    return (_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold mb-3", style: { color: theme.colors.textSecondary }, children: "RACI \u4EFB\u52A1\u533A" }), _jsx("div", { className: "grid grid-cols-4 gap-3 mb-3", children: raciTypes.map((type) => {
                    const cfg = RACI_CONFIG[type];
                    const tasks = raciGroups[type];
                    const isExpanded = expanded === type;
                    return (_jsxs("div", { children: [_jsxs("button", { onClick: () => setExpanded(isExpanded ? null : type), className: "w-full text-left rounded-lg p-3 transition-all duration-200 hover:brightness-125", style: {
                                    backgroundColor: '#0f1525',
                                    borderLeft: `3px solid ${cfg.color}`,
                                    boxShadow: isExpanded ? `0 0 12px ${cfg.color}22` : 'none',
                                }, children: [_jsx(Badge, { className: "text-[10px] mb-2 border-0", style: { backgroundColor: `${cfg.color}22`, color: cfg.color }, children: cfg.label }), _jsx("div", { className: "text-2xl font-bold", style: { color: theme.colors.text }, children: tasks.length }), _jsx("div", { className: "text-[11px] mt-0.5", style: { color: theme.colors.textSecondary }, children: cfg.desc })] }), isExpanded && tasks.length > 0 && (_jsx("div", { className: "mt-2 space-y-1.5", children: tasks.map((task, idx) => (_jsxs("div", { className: "rounded-md p-2.5 flex items-start gap-2 transition-colors hover:bg-white/5", style: { backgroundColor: '#0f1525' }, children: [_jsx("span", { className: `mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[task.status]}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "text-xs font-medium text-white truncate", children: task.title }), _jsx("div", { className: "text-[10px] text-white/40 truncate", children: task.description }), _jsx(Badge, { variant: "outline", className: "mt-1 text-[9px] px-1.5 py-0 border-white/10 text-white/50", children: task.scenario })] }), _jsx(Button, { size: "sm", variant: "ghost", className: "text-[10px] h-6 px-2 flex-shrink-0 hover:bg-white/10", style: { color: cfg.color }, children: cfg.actionLabel })] }, idx))) }))] }, type));
                }) })] }));
};
export default RaciTaskSection;
//# sourceMappingURL=RaciTaskSection.js.map