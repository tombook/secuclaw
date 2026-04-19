import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SecuClaw Dashboard — Unified Security Overview
 *
 * Role-driven: each of the 8 security roles sees different KPIs,
 * charts, filters, and data based on role-dashboard-config.ts.
 * When role switches, data automatically reloads.
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import { ROLE_DASHBOARD_CONFIG } from '@/config/role-dashboard-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { SecurityScoreGauge } from '@/components/visualizations/SecurityScoreGauge';
import { ThreatTimeline } from '@/components/visualizations/ThreatTimeline';
import { VulnerabilityChart } from '@/components/visualizations/VulnerabilityChart';
import { MitreHeatmap } from '@/components/visualizations/MitreHeatmap';
import { AlertTriangle, ShieldAlert, TrendingUp, CheckCircle, Activity, Zap, Eye, FileSearch, } from 'lucide-react';
// ── Role → icon mapping ──
const ROLE_ICONS = {
    'security-expert': _jsx(ShieldAlert, { className: "h-5 w-5" }),
    'privacy-officer': _jsx(Eye, { className: "h-5 w-5" }),
    'security-architect': _jsx(Activity, { className: "h-5 w-5" }),
    'business-security-officer': _jsx(TrendingUp, { className: "h-5 w-5" }),
    'secuclaw-commander': _jsx(Zap, { className: "h-5 w-5" }),
    'ciso': _jsx(CheckCircle, { className: "h-5 w-5" }),
    'security-ops': _jsx(AlertTriangle, { className: "h-5 w-5" }),
    'supply-chain-security': _jsx(FileSearch, { className: "h-5 w-5" }),
};
// ── Mock data generator (role-differentiated) ──
// In production this would come from the API filtered by role
function getMockDataByRole(roleId) {
    const bases = {
        'security-expert': {
            metrics: { activeIncidents: 12, criticalVulns: 37, activeThreats: 8, complianceRate: 87.4 },
            threatEvents: [
                { time: '08:15', label: 'CVE-2024-XXXX 漏洞利用尝试', severity: 'critical' },
                { time: '09:30', label: '恶意附件检测（钓鱼）', severity: 'critical' },
                { time: '10:45', label: '异常数据外传行为', severity: 'high' },
                { time: '11:20', label: '端口扫描活动', severity: 'medium' },
                { time: '13:00', label: '暴力破解告警', severity: 'low' },
            ],
            vulnData: [
                { severity: 'Critical', count: 37 },
                { severity: 'High', count: 124 },
                { severity: 'Medium', count: 289 },
                { severity: 'Low', count: 156 },
            ],
            securityScore: 72,
            raciTasks: [
                { type: 'R', label: '待执行', count: 8, color: '#3b82f6' },
                { type: 'A', label: '待审批', count: 3, color: '#ef4444' },
                { type: 'C', label: '待咨询', count: 5, color: '#22c55e' },
                { type: 'I', label: '待确认', count: 12, color: '#f59e0b' },
            ],
        },
        'privacy-officer': {
            metrics: { activeIncidents: 2, criticalVulns: 0, activeThreats: 3, complianceRate: 91.2 },
            threatEvents: [
                { time: '08:00', label: 'GDPR数据主体请求超时', severity: 'high' },
                { time: '10:30', label: 'PIPL删除请求积压', severity: 'high' },
                { time: '14:00', label: '隐私影响评估待审批', severity: 'medium' },
            ],
            vulnData: [
                { severity: 'Critical', count: 0 },
                { severity: 'High', count: 3 },
                { severity: 'Medium', count: 8 },
                { severity: 'Low', count: 12 },
            ],
            securityScore: 91,
            raciTasks: [
                { type: 'R', label: '处理中', count: 4, color: '#3b82f6' },
                { type: 'A', label: '待审批', count: 6, color: '#ef4444' },
                { type: 'C', label: '待咨询', count: 2, color: '#22c55e' },
                { type: 'I', label: '待通知', count: 9, color: '#f59e0b' },
            ],
        },
        'security-architect': {
            metrics: { activeIncidents: 5, criticalVulns: 12, activeThreats: 15, complianceRate: 78.3 },
            threatEvents: [
                { time: '09:00', label: '零信任架构差距分析', severity: 'high' },
                { time: '11:00', label: '新系统威胁建模评审', severity: 'medium' },
                { time: '14:30', label: '安全控制有效性下降', severity: 'high' },
            ],
            vulnData: [
                { severity: 'Critical', count: 12 },
                { severity: 'High', count: 45 },
                { severity: 'Medium', count: 134 },
                { severity: 'Low', count: 89 },
            ],
            securityScore: 65,
            raciTasks: [
                { type: 'R', label: '评审中', count: 6, color: '#3b82f6' },
                { type: 'A', label: '待审批', count: 4, color: '#ef4444' },
                { type: 'C', label: '咨询中', count: 8, color: '#22c55e' },
                { type: 'I', label: '待通知', count: 3, color: '#f59e0b' },
            ],
        },
        'business-security-officer': {
            metrics: { activeIncidents: 3, criticalVulns: 1, activeThreats: 5, complianceRate: 94.1 },
            threatEvents: [
                { time: '08:30', label: '业务连续性计划待演练', severity: 'medium' },
                { time: '13:00', label: '灾难恢复测试计划', severity: 'high' },
            ],
            vulnData: [
                { severity: 'Critical', count: 1 },
                { severity: 'High', count: 8 },
                { severity: 'Medium', count: 23 },
                { severity: 'Low', count: 45 },
            ],
            securityScore: 88,
            raciTasks: [
                { type: 'R', label: '执行中', count: 3, color: '#3b82f6' },
                { type: 'A', label: '待审批', count: 2, color: '#ef4444' },
                { type: 'C', label: '协调中', count: 4, color: '#22c55e' },
                { type: 'I', label: '已通知', count: 7, color: '#f59e0b' },
            ],
        },
        'secuclaw-commander': {
            metrics: { activeIncidents: 28, criticalVulns: 15, activeThreats: 42, complianceRate: 71.5 },
            threatEvents: [
                { time: '06:00', label: '大规模勒索软件攻击', severity: 'critical' },
                { time: '08:15', label: '多个站点同时告警', severity: 'critical' },
                { time: '09:30', label: '跨区域协调请求', severity: 'high' },
                { time: '10:00', label: '危机管理级别升级', severity: 'critical' },
                { time: '11:30', label: '应急响应队伍动员', severity: 'high' },
            ],
            vulnData: [
                { severity: 'Critical', count: 15 },
                { severity: 'High', count: 67 },
                { severity: 'Medium', count: 198 },
                { severity: 'Low', count: 234 },
            ],
            securityScore: 58,
            raciTasks: [
                { type: 'R', label: '执行中', count: 15, color: '#3b82f6' },
                { type: 'A', label: '待审批', count: 8, color: '#ef4444' },
                { type: 'C', label: '协调中', count: 12, color: '#22c55e' },
                { type: 'I', label: '已通知', count: 24, color: '#f59e0b' },
            ],
        },
        'ciso': {
            metrics: { activeIncidents: 8, criticalVulns: 9, activeThreats: 11, complianceRate: 83.7 },
            threatEvents: [
                { time: '09:00', label: '董事会安全汇报', severity: 'medium' },
                { time: '11:00', label: '安全预算审查', severity: 'high' },
                { time: '14:00', label: '季度安全 KPI 评估', severity: 'medium' },
            ],
            vulnData: [
                { severity: 'Critical', count: 9 },
                { severity: 'High', count: 34 },
                { severity: 'Medium', count: 112 },
                { severity: 'Low', count: 178 },
            ],
            securityScore: 76,
            raciTasks: [
                { type: 'R', label: '审批中', count: 4, color: '#3b82f6' },
                { type: 'A', label: '决策中', count: 6, color: '#ef4444' },
                { type: 'C', label: '汇报中', count: 3, color: '#22c55e' },
                { type: 'I', label: '已通知', count: 15, color: '#f59e0b' },
            ],
        },
        'security-ops': {
            metrics: { activeIncidents: 45, criticalVulns: 8, activeThreats: 67, complianceRate: 79.2 },
            threatEvents: [
                { time: '02:00', label: '深夜告警风暴', severity: 'critical' },
                { time: '06:30', label: 'SIEM 异常检测', severity: 'high' },
                { time: '09:15', label: 'SOAR 剧本执行失败', severity: 'medium' },
                { time: '10:00', label: '待处理告警积压', severity: 'high' },
                { time: '14:45', label: '误报率异常上升', severity: 'medium' },
            ],
            vulnData: [
                { severity: 'Critical', count: 8 },
                { severity: 'High', count: 89 },
                { severity: 'Medium', count: 234 },
                { severity: 'Low', count: 312 },
            ],
            securityScore: 61,
            raciTasks: [
                { type: 'R', label: '处理中', count: 22, color: '#3b82f6' },
                { type: 'A', label: '待审批', count: 5, color: '#ef4444' },
                { type: 'C', label: '升级中', count: 8, color: '#22c55e' },
                { type: 'I', label: '已通知', count: 18, color: '#f59e0b' },
            ],
        },
        'supply-chain-security': {
            metrics: { activeIncidents: 6, criticalVulns: 4, activeThreats: 19, complianceRate: 82.8 },
            threatEvents: [
                { time: '08:00', label: '关键供应商安全评估过期', severity: 'high' },
                { time: '10:30', label: '第三方组件漏洞预警', severity: 'critical' },
                { time: '13:00', label: 'SBOM 覆盖率异常', severity: 'medium' },
            ],
            vulnData: [
                { severity: 'Critical', count: 4 },
                { severity: 'High', count: 23 },
                { severity: 'Medium', count: 67 },
                { severity: 'Low', count: 98 },
            ],
            securityScore: 74,
            raciTasks: [
                { type: 'R', label: '评估中', count: 5, color: '#3b82f6' },
                { type: 'A', label: '待审批', count: 3, color: '#ef4444' },
                { type: 'C', label: '协调中', count: 6, color: '#22c55e' },
                { type: 'I', label: '已通知', count: 11, color: '#f59e0b' },
            ],
        },
    };
    return bases[roleId] || bases['security-expert'];
}
// ── Severity badge helper ──
function SeverityBadge({ severity }) {
    const map = {
        critical: { label: '严重', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
        high: { label: '高危', className: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
        medium: { label: '中危', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
        low: { label: '低危', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    };
    const cfg = map[severity] || map.low;
    return (_jsx("span", { className: `text-xs px-1.5 py-0.5 rounded border ${cfg.className}`, children: cfg.label }));
}
// ── Metric Card ──
function MetricCard({ label, value, unit, trend, trendValue, icon, accentColor, }) {
    return (_jsx(Card, { className: "bg-[#0f1525] border-white/[0.06] hover:border-white/[0.12] transition-colors", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-400 mb-1", children: label }), _jsxs("p", { className: "text-2xl font-bold text-white", children: [value, unit && _jsx("span", { className: "text-sm font-normal text-slate-400 ml-1", children: unit })] }), trend && trendValue && (_jsxs("p", { className: `text-xs mt-1 flex items-center gap-0.5 ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'}`, children: [trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→', " ", trendValue] }))] }), _jsx("div", { className: "p-2 rounded-lg", style: { backgroundColor: `${accentColor}20`, color: accentColor }, children: icon })] }) }) }));
}
// ── RACI Mini Card ──
function RaciMiniCard({ type, label, count, color, accentColor, }) {
    return (_jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg bg-[#0f1525] border border-white/[0.06] cursor-pointer hover:border-white/[0.12] transition-all", style: { borderLeftWidth: '3px', borderLeftColor: color }, children: [_jsx("div", { className: "text-2xl font-bold", style: { color }, children: count }), _jsxs("div", { children: [_jsx("div", { className: "text-xs font-semibold text-white", children: type }), _jsx("div", { className: "text-xs text-slate-400", children: label })] })] }));
}
// ── Component ──
export const Dashboard = () => {
    const navigate = useNavigate();
    const currentRole = useRoleContextStore((s) => s.currentRole);
    const theme = currentRole ? ROLE_THEMES[currentRole] : null;
    const accentColor = theme?.colors.primary ?? '#1e40af';
    const secondaryColor = theme?.colors.secondary ?? '#3b82f6';
    // Get role-specific config and data
    const roleConfig = useMemo(() => (currentRole ? ROLE_DASHBOARD_CONFIG[currentRole] : null), [currentRole]);
    const roleData = useMemo(() => getMockDataByRole(currentRole || 'security-expert'), [currentRole]);
    const now = new Date();
    const dateStr = now.toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
    });
    const timeStr = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const { metrics, threatEvents, vulnData, securityScore, raciTasks } = roleData;
    const roleLabel = theme?.nameCn || '安全专家';
    const roleIcon = currentRole ? ROLE_ICONS[currentRole] : null;
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-400 mb-1", children: [dateStr, " \u00B7 ", timeStr, _jsx("span", { className: "mx-1", children: "\u00B7" }), _jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs", style: { backgroundColor: `${accentColor}20`, color: accentColor }, children: [roleIcon, roleLabel, " \u89C6\u89D2"] })] }), _jsx("h1", { className: "text-xl font-bold text-white", children: theme?.name || '统一安全总览' }), _jsx("p", { className: "text-sm text-slate-400 mt-0.5", children: theme?.description || 'SecuClaw Security Commander' })] }), _jsxs(Button, { size: "sm", className: "gap-2 text-xs", style: { backgroundColor: accentColor }, onClick: () => navigate('/ai-experts'), children: [roleIcon, "\u8FDB\u5165\u89D2\u8272\u6307\u6325\u53F0"] })] }), _jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3", children: [_jsx(MetricCard, { label: "\u6D3B\u8DC3\u4E8B\u4EF6", value: metrics.activeIncidents, icon: _jsx(AlertTriangle, { className: "h-4 w-4" }), trend: metrics.activeIncidents > 20 ? 'up' : 'stable', trendValue: metrics.activeIncidents > 20 ? '高于平均' : '正常', accentColor: accentColor }), _jsx(MetricCard, { label: "\u4E25\u91CD\u6F0F\u6D1E", value: metrics.criticalVulns, icon: _jsx(ShieldAlert, { className: "h-4 w-4" }), trend: metrics.criticalVulns > 10 ? 'up' : 'down', trendValue: metrics.criticalVulns > 10 ? '需关注' : '可控', accentColor: accentColor }), _jsx(MetricCard, { label: "\u6D3B\u8DC3\u5A01\u80C1", value: metrics.activeThreats, icon: _jsx(Activity, { className: "h-4 w-4" }), trend: metrics.activeThreats > 20 ? 'up' : 'stable', trendValue: metrics.activeThreats > 20 ? '上升趋势' : '平稳', accentColor: accentColor }), _jsx(MetricCard, { label: "\u5408\u89C4\u7387", value: metrics.complianceRate, unit: "%", icon: _jsx(CheckCircle, { className: "h-4 w-4" }), trend: metrics.complianceRate > 85 ? 'up' : 'down', trendValue: metrics.complianceRate > 85 ? '达标' : '需提升', accentColor: accentColor })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [_jsxs(Card, { className: "bg-[#0f1525] border-white/[0.06] lg:col-span-1", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium text-slate-300", children: "\u5B89\u5168\u8BC4\u5206" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "flex justify-center py-2", children: _jsx(SecurityScoreGauge, { score: securityScore, accentColor: accentColor }) }), _jsx("div", { className: "mt-2", children: _jsx(ThreatTimeline, { events: threatEvents, compact: true }) })] })] }), _jsxs(Card, { className: "bg-[#0f1525] border-white/[0.06] lg:col-span-2", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm font-medium text-slate-300", children: ["\u6F0F\u6D1E\u5206\u5E03\uFF08", currentRole ? ROLE_THEMES[currentRole].nameCn : '', "\u89C6\u89D2\uFF09"] }) }), _jsx(CardContent, { children: _jsx(VulnerabilityChart, { data: vulnData, accentColor: accentColor }) })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [_jsxs(Card, { className: "bg-[#0f1525] border-white/[0.06]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm font-medium text-slate-300 flex items-center justify-between", children: [_jsx("span", { children: roleConfig?.raciTaskSummary?.label || 'RACI 任务概览' }), _jsx(Button, { size: "xs", variant: "ghost", className: "text-xs h-auto py-0.5 px-2", style: { color: accentColor }, onClick: () => navigate('/ai-experts'), children: "\u6307\u6325\u53F0 \u2192" })] }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "grid grid-cols-2 gap-2", children: raciTasks.map((task) => (_jsx(RaciMiniCard, { type: task.type, label: task.label, count: task.count, color: task.color, accentColor: accentColor }, task.type))) }), roleConfig?.quickActions && (_jsxs("div", { className: "mt-3 pt-3 border-t border-white/[0.06]", children: [_jsx("p", { className: "text-xs text-slate-400 mb-2", children: "\u5FEB\u901F\u64CD\u4F5C" }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: roleConfig.quickActions.map((action) => (_jsx(Button, { size: "xs", variant: "outline", className: "text-xs h-6", style: { borderColor: `${accentColor}40`, color: accentColor }, children: action }, action))) })] }))] })] }), _jsxs(Card, { className: "bg-[#0f1525] border-white/[0.06] lg:col-span-2", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm font-medium text-slate-300", children: ["\u8FD1\u671F\u544A\u8B66\uFF08", roleConfig?.alertFilters?.category?.join(', ') || '全部类型', "\uFF09"] }) }), _jsxs(CardContent, { className: "space-y-2", children: [threatEvents.slice(0, 5).map((event, i) => (_jsxs("div", { className: "flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(SeverityBadge, { severity: event.severity }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-white", children: event.label }), _jsx("p", { className: "text-xs text-slate-500", children: event.time })] })] }), _jsx(Button, { size: "xs", variant: "ghost", className: "text-xs", style: { color: accentColor }, onClick: () => navigate('/incidents'), children: "\u67E5\u770B" })] }, i))), threatEvents.length === 0 && (_jsx("p", { className: "text-sm text-slate-500 text-center py-4", children: "\u6682\u65E0\u544A\u8B66" }))] })] })] }), _jsxs(Card, { className: "bg-[#0f1525] border-white/[0.06]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm font-medium text-slate-300", children: ["MITRE ATT&CK \u8986\u76D6\uFF08", roleLabel, "\u89C6\u89D2\uFF09"] }) }), _jsx(CardContent, { children: _jsx(MitreHeatmap, { roleId: currentRole || 'security-expert', accentColor: accentColor }) })] }), _jsx(Button, { size: "icon", className: "fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg", style: { backgroundColor: accentColor }, onClick: () => navigate('/ai-experts'), children: _jsx(Zap, { className: "h-5 w-5" }) })] }));
};
//# sourceMappingURL=Dashboard.js.map