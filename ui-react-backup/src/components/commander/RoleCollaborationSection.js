import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES, ALL_ROLE_IDS } from '@/config/role-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
/* ── Mock data ── */
const MOCK_ITEMS = [
    { type: 'discussion', title: 'Log4Shell 后续影响评估', description: '评估近期供应链漏洞对核心系统的影响范围', participants: ['security-expert', 'supply-chain-security', 'ciso'], scenario: '漏洞管理', time: '10 分钟前' },
    { type: 'request', title: '生产环境补丁窗口审批', description: '安全运营团队请求在周六凌晨 2:00-4:00 进行补丁部署', participants: ['security-ops', 'ciso', 'business-security-officer'], scenario: '漏洞管理', time: '30 分钟前' },
    { type: 'task', title: '更新零信任架构文档', description: '根据最新威胁模型更新网络分段策略文档', participants: ['security-architect', 'security-expert'], scenario: '威胁响应', time: '1 小时前' },
    { type: 'discussion', title: 'GDPR 合规差距分析', description: '讨论用户数据处理流程中的合规风险点', participants: ['privacy-officer', 'ciso', 'security-architect'], scenario: '合规审计', time: '2 小时前' },
    { type: 'request', title: '供应商安全评估请求', description: '需要对新增云服务商进行安全评估', participants: ['supply-chain-security', 'security-expert', 'ciso'], scenario: '供应链事件', time: '3 小时前' },
    { type: 'task', title: '应急演练计划制定', description: '制定 Q2 安全事件应急演练方案', participants: ['secuclaw-commander', 'security-ops', 'business-security-officer'], scenario: '安全事件响应', time: '5 小时前' },
];
const TABS = [
    { key: 'discussion', label: '讨论' },
    { key: 'request', label: '请求' },
    { key: 'task', label: '任务' },
];
export const RoleCollaborationSection = () => {
    const currentRole = useRoleContextStore((s) => s.currentRole);
    const [activeTab, setActiveTab] = useState('discussion');
    if (!currentRole)
        return null;
    const theme = ROLE_THEMES[currentRole];
    const filtered = MOCK_ITEMS.filter((item) => item.type === activeTab);
    return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-sm font-semibold", style: { color: theme.colors.textSecondary }, children: "\u534F\u4F5C\u6307\u6325\u533A" }), _jsxs(Button, { size: "sm", variant: "ghost", className: "text-xs gap-1 text-white/60 hover:text-white hover:bg-white/5", children: [_jsx(Plus, { className: "w-3.5 h-3.5" }), "\u65B0\u5EFA"] })] }), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, children: [_jsx(TabsList, { className: "bg-[#0f1525] border border-white/5 h-8 p-0.5", children: TABS.map((tab) => (_jsx(TabsTrigger, { value: tab.key, className: "text-[11px] px-3 py-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50", children: tab.label }, tab.key))) }), _jsxs(TabsContent, { value: activeTab, className: "mt-3 space-y-2", children: [filtered.map((item, idx) => (_jsx("div", { className: "rounded-lg p-3 transition-all duration-200 hover:brightness-125", style: { backgroundColor: '#0f1525' }, children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Badge, { variant: "outline", className: "text-[9px] px-1.5 py-0 border-0", style: {
                                                                backgroundColor: `${theme.colors.primary}22`,
                                                                color: theme.colors.secondary,
                                                            }, children: item.type === 'discussion' ? '讨论' : item.type === 'request' ? '请求' : '任务' }), _jsx("span", { className: "text-xs font-medium text-white truncate", children: item.title })] }), _jsx("p", { className: "text-[11px] text-white/40 line-clamp-1", children: item.description }), _jsxs("div", { className: "flex items-center gap-2 mt-2", children: [_jsx(Badge, { variant: "outline", className: "text-[9px] px-1.5 py-0 border-white/10 text-white/40", children: item.scenario }), _jsx("span", { className: "text-[10px] text-white/30", children: item.time })] })] }), _jsxs("div", { className: "flex -space-x-1.5 flex-shrink-0", children: [item.participants.slice(0, 4).map((roleId) => {
                                                    const rTheme = ROLE_THEMES[roleId];
                                                    if (!rTheme)
                                                        return null;
                                                    return (_jsx("div", { className: "w-6 h-6 rounded-full flex items-center justify-center text-xs border border-[#0f1525]", style: { backgroundColor: rTheme.colors.primary }, title: rTheme.nameCn, children: _jsx("span", { className: "text-[10px]", children: rTheme.icon }) }, roleId));
                                                }), item.participants.length > 4 && (_jsxs("div", { className: "w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-white/60 border border-[#0f1525]", children: ["+", item.participants.length - 4] }))] })] }) }, idx))), filtered.length === 0 && (_jsxs("div", { className: "text-center py-6 text-xs text-white/30", children: ["\u6682\u65E0", activeTab === 'discussion' ? '讨论' : activeTab === 'request' ? '请求' : '任务'] }))] })] })] }));
};
export default RoleCollaborationSection;
//# sourceMappingURL=RoleCollaborationSection.js.map