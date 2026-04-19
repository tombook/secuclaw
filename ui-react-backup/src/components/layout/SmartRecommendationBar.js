import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SecuClaw SmartRecommendationBar
 *
 * Fixed at the top of the content area. Shows contextual recommendations
 * based on the current security posture and active role.
 * Collapsible, with priority tags (high / medium / low).
 */
import React from 'react';
import { ChevronUp, ChevronDown, Zap, ArrowRight } from 'lucide-react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
// Static demo recommendations — in production these would come from an API
const RECOMMENDATIONS = [
    {
        id: 'rec-1',
        roleId: 'secuclaw-commander',
        title: '检测到异常登录激增',
        description: '过去1小时内异常登录尝试增加 340%，建议切换到指挥官模式协调响应。',
        priority: 'high',
        action: '进入作战室',
    },
    {
        id: 'rec-2',
        roleId: 'security-ops',
        title: 'SIEM 告警积压',
        description: '有 47 条未处理的 SIEM 告警，其中 12 条为高优先级。',
        priority: 'medium',
        action: '查看告警队列',
    },
    {
        id: 'rec-3',
        roleId: 'supply-chain-security',
        title: '第三方依赖风险更新',
        description: '2 个关键依赖检测到新 CVE，CVSS 评分 > 8.0。',
        priority: 'high',
        action: '查看详情',
    },
    {
        id: 'rec-4',
        roleId: 'privacy-officer',
        title: '合规审计即将到期',
        description: 'PIPL 合规审计还有 7 天到期，建议尽快完成自检。',
        priority: 'low',
        action: '开始自检',
    },
];
// ── Priority config ──
const PRIORITY_CONFIG = {
    high: { label: '高', color: '#ef4444', bg: '#ef444420' },
    medium: { label: '中', color: '#f59e0b', bg: '#f59e0b20' },
    low: { label: '低', color: '#10b981', bg: '#10b98120' },
};
// ── Component ──
export const SmartRecommendationBar = () => {
    const [expanded, setExpanded] = React.useState(true);
    const currentRole = useRoleContextStore((s) => s.currentRole);
    const setRole = useRoleContextStore((s) => s.setRole);
    const theme = currentRole ? ROLE_THEMES[currentRole] : null;
    const handleAction = (rec) => {
        if (rec.roleId !== currentRole) {
            setRole(rec.roleId);
        }
        // In production: navigate to the relevant view
    };
    return (_jsxs("div", { className: cn('shrink-0 border-b transition-all duration-300 overflow-hidden', 'bg-[#0f1525]/60 backdrop-blur-sm'), style: {
            borderBottomColor: theme ? `${theme.colors.primary}30` : 'rgba(255,255,255,0.06)',
        }, children: [_jsxs("div", { className: "flex items-center justify-between px-4 py-2 cursor-pointer select-none hover:bg-white/[0.02] transition-colors", onClick: () => setExpanded(!expanded), children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Zap, { className: "h-3.5 w-3.5", style: { color: theme?.colors.accent ?? '#f59e0b' } }), _jsx("span", { className: "text-xs font-medium text-slate-300", children: "\u667A\u80FD\u63A8\u8350" }), _jsx(Badge, { className: "h-4 px-1.5 text-[10px] border-0 rounded-full font-medium", style: {
                                    backgroundColor: (theme?.colors.accent ?? '#f59e0b') + '20',
                                    color: theme?.colors.accent ?? '#f59e0b',
                                }, children: RECOMMENDATIONS.length })] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-5 w-5 text-slate-500 hover:text-slate-300", children: expanded ? (_jsx(ChevronUp, { className: "h-3.5 w-3.5" })) : (_jsx(ChevronDown, { className: "h-3.5 w-3.5" })) })] }), _jsx("div", { className: cn('grid gap-2 px-4 pb-3 transition-all duration-300', expanded ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'hidden'), children: RECOMMENDATIONS.map((rec) => {
                    const recTheme = ROLE_THEMES[rec.roleId];
                    const pConfig = PRIORITY_CONFIG[rec.priority];
                    return (_jsxs("div", { className: cn('group relative rounded-lg border p-3', 'bg-[#0a0e1a]/60 transition-all duration-200', 'hover:bg-white/[0.03] hover:border-white/10'), style: {
                            borderColor: `${recTheme.colors.primary}30`,
                            borderLeftWidth: 3,
                            borderLeftColor: recTheme.colors.primary,
                        }, children: [_jsxs("div", { className: "flex items-center gap-2 mb-1.5", children: [_jsx("span", { className: "text-sm", children: recTheme.icon }), _jsx(Badge, { className: "h-4 px-1.5 text-[10px] border-0 rounded-full font-medium", style: {
                                            backgroundColor: pConfig.bg,
                                            color: pConfig.color,
                                        }, children: pConfig.label })] }), _jsx("h4", { className: "text-xs font-semibold text-slate-200 leading-snug mb-0.5", children: rec.title }), _jsx("p", { className: "text-[11px] text-slate-400 leading-relaxed line-clamp-2", children: rec.description }), _jsxs(Button, { variant: "ghost", size: "sm", className: "mt-2 h-6 px-2 text-[11px] gap-1 transition-colors duration-200", style: { color: recTheme.colors.secondary }, onClick: (e) => {
                                    e.stopPropagation();
                                    handleAction(rec);
                                }, children: [rec.action, _jsx(ArrowRight, { className: "h-3 w-3" })] })] }, rec.id));
                }) })] }));
};
export default SmartRecommendationBar;
//# sourceMappingURL=SmartRecommendationBar.js.map