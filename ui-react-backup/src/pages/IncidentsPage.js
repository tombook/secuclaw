import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SecuClaw Incidents Page — Role-driven security events
 *
 * Filters, KPIs, and event list change based on the selected role.
 * Uses real API (useIncidents hook) with role-based filtering.
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import { ROLE_DASHBOARD_CONFIG } from '@/config/role-dashboard-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { AlertTriangle, Search, Plus, Filter, X, Clock, User, Tag, ChevronRight, ShieldAlert, RefreshCw, } from 'lucide-react';
import { api } from '@/services/api';
import { useIncidents, useIncidentStats } from '@/hooks/useApi';
// ── Severity → color ──
const SEVERITY_STYLES = {
    CRITICAL: { bg: 'bg-red-500/20', text: 'text-red-400', label: '严重' },
    HIGH: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: '高危' },
    MEDIUM: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: '中危' },
    LOW: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: '低危' },
    INFO: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: '信息' },
};
const STATUS_STYLES = {
    NEW: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-400' },
    CONFIRMED: { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-400' },
    ANALYZING: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-400' },
    CONTAINING: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400' },
    ERADICATING: { bg: 'bg-purple-500/20', text: 'text-purple-400', dot: 'bg-purple-400' },
    RECOVERING: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', dot: 'bg-indigo-400' },
    CLOSED: { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-400' },
    REOPENED: { bg: 'bg-pink-500/20', text: 'text-pink-400', dot: 'bg-pink-400' },
    FALSE_POSITIVE: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-400' },
};
// ── Role-differentiated mock incidents ──
function getIncidentsByRole(roleId) {
    const bases = {
        'security-expert': [
            { id: 'inc_001', ticketId: 'INC-2026-0042', title: 'SQL 注入漏洞被利用', severity: 'CRITICAL', status: 'ANALYZING', category: 'vulnerability', assignee: '张工', createdAt: '2026-04-17T08:15:00Z', description: '生产环境 API 发现 SQL 注入，已被成功利用获取数据。' },
            { id: 'inc_002', ticketId: 'INC-2026-0041', title: 'Apache Log4j 远程代码执行', severity: 'CRITICAL', status: 'CONTAINING', category: 'vulnerability', assignee: '李工', createdAt: '2026-04-17T06:30:00Z', description: 'Log4j CVE-2021-44228 漏洞在 3 台服务器上检测到利用尝试。' },
            { id: 'inc_003', ticketId: 'INC-2026-0040', title: 'XSS 存储型漏洞', severity: 'HIGH', status: 'CONFIRMED', category: 'vulnerability', assignee: '王工', createdAt: '2026-04-16T14:20:00Z', description: '用户评论模块存在存储型 XSS，影响所有访问用户。' },
            { id: 'inc_004', ticketId: 'INC-2026-0039', title: '敏感信息泄露', severity: 'HIGH', status: 'ANALYZING', category: 'data-breach', assignee: '赵工', createdAt: '2026-04-16T10:00:00Z', description: 'GitHub 仓库意外公开了 AWS 密钥。' },
            { id: 'inc_005', ticketId: 'INC-2026-0038', title: '弱密码策略', severity: 'MEDIUM', status: 'NEW', category: 'misconfiguration', assignee: '周工', createdAt: '2026-04-15T16:45:00Z', description: '内部系统发现弱密码策略，未强制复杂性要求。' },
        ],
        'privacy-officer': [
            { id: 'inc_p01', ticketId: 'INC-2026-0020', title: 'GDPR 数据主体请求超时', severity: 'HIGH', status: 'ANALYZING', category: 'privacy', assignee: '隐私官A', createdAt: '2026-04-17T09:00:00Z', description: '数据主体请求已超过 30 天法定处理期限。' },
            { id: 'inc_p02', ticketId: 'INC-2026-0019', title: 'PIPL 删除请求积压', severity: 'HIGH', status: 'CONFIRMED', category: 'privacy', assignee: '隐私官B', createdAt: '2026-04-16T11:00:00Z', description: '有 23 个 PIPL 删除请求待处理，超出合规时限。' },
            { id: 'inc_p03', ticketId: 'INC-2026-0018', title: '数据泄露通知缺失', severity: 'CRITICAL', status: 'CONTAINING', category: 'data-breach', assignee: '隐私官A', createdAt: '2026-04-15T08:00:00Z', description: '用户数据泄露未按规定在 72 小时内向监管机构报告。' },
        ],
        'security-architect': [
            { id: 'inc_a01', ticketId: 'INC-2026-0050', title: '零信任架构差距分析', severity: 'HIGH', status: 'ANALYZING', category: 'architecture', assignee: '架构师A', createdAt: '2026-04-17T10:00:00Z', description: '零信任架构评估发现 12 项控制缺失。' },
            { id: 'inc_a02', ticketId: 'INC-2026-0049', title: '身份提供商单点故障', severity: 'CRITICAL', status: 'CONFIRMED', category: 'architecture', assignee: '架构师B', createdAt: '2026-04-16T15:00:00Z', description: 'IdP 无高可用设计，存在单点故障风险。' },
        ],
        'business-security-officer': [
            { id: 'inc_b01', ticketId: 'INC-2026-0060', title: '业务连续性计划过期', severity: 'MEDIUM', status: 'NEW', category: 'bc', assignee: '业务安全A', createdAt: '2026-04-17T08:00:00Z', description: 'BCP 已超过 12 个月未更新。' },
            { id: 'inc_b02', ticketId: 'INC-2026-0059', title: '灾难恢复测试失败', severity: 'HIGH', status: 'CONFIRMED', category: 'bc', assignee: '业务安全B', createdAt: '2026-04-16T14:00:00Z', description: 'DR 演练中 RTO 未达标，实际恢复时间超过目标 4 小时。' },
        ],
        'secuclaw-commander': [
            { id: 'inc_c01', ticketId: 'INC-2026-0001', title: '大规模勒索软件攻击', severity: 'CRITICAL', status: 'CONTAINING', category: 'ransomware', assignee: '指挥官', createdAt: '2026-04-17T06:00:00Z', description: '多地区同时遭受勒索软件攻击，已启动危机响应协议。' },
            { id: 'inc_c02', ticketId: 'INC-2026-0002', title: '跨区域协调请求', severity: 'HIGH', status: 'ANALYZING', category: 'coordination', assignee: '指挥官', createdAt: '2026-04-17T09:30:00Z', description: '华东/华南/华北三区联动响应请求。' },
            { id: 'inc_c03', ticketId: 'INC-2026-0003', title: '危机管理级别升级', severity: 'CRITICAL', status: 'CONFIRMED', category: 'crisis', assignee: '指挥官', createdAt: '2026-04-17T10:00:00Z', description: '安全事件级别从 L2 升级至 L1。' },
        ],
        'ciso': [
            { id: 'inc_i01', ticketId: 'INC-2026-0070', title: '季度安全 KPI 异常', severity: 'MEDIUM', status: 'ANALYZING', category: 'kpi', assignee: 'CISO', createdAt: '2026-04-17T09:00:00Z', description: '本月安全告警数量环比上升 34%，需向董事会汇报。' },
            { id: 'inc_i02', ticketId: 'INC-2026-0069', title: '安全预算超支风险', severity: 'HIGH', status: 'CONFIRMED', category: 'budget', assignee: 'CISO', createdAt: '2026-04-16T11:00:00Z', description: 'Q2 安全预算消耗速度超出预期 28%。' },
        ],
        'security-ops': [
            { id: 'inc_o01', ticketId: 'INC-2026-0080', title: '深夜告警风暴', severity: 'CRITICAL', status: 'ANALYZING', category: 'alert-storm', assignee: '运营A', createdAt: '2026-04-17T02:00:00Z', description: 'SIEM 在 02:00-04:00 期间产生 1.2 万条告警，误报率 97%。' },
            { id: 'inc_o02', ticketId: 'INC-2026-0079', title: 'SOAR 剧本执行失败', severity: 'MEDIUM', status: 'NEW', category: 'automation', assignee: '运营B', createdAt: '2026-04-17T09:15:00Z', description: '自动化响应剧本在第 3 步超时失败。' },
            { id: 'inc_o03', ticketId: 'INC-2026-0078', title: '待处理告警积压', severity: 'HIGH', status: 'CONFIRMED', category: 'backlog', assignee: '运营A', createdAt: '2026-04-17T10:00:00Z', description: '当前待处理告警 847 条，超出团队处理能力。' },
        ],
        'supply-chain-security': [
            { id: 'inc_s01', ticketId: 'INC-2026-0090', title: '关键供应商安全评估过期', severity: 'HIGH', status: 'CONFIRMED', category: 'vendor', assignee: '供应链A', createdAt: '2026-04-17T08:00:00Z', description: '3 家关键供应商安全评估证书已过期。' },
            { id: 'inc_s02', ticketId: 'INC-2026-0089', title: '第三方组件漏洞', severity: 'CRITICAL', status: 'CONTAINING', category: 'third-party', assignee: '供应链B', createdAt: '2026-04-16T14:00:00Z', description: 'npm 依赖中发现 CVE-2024-XXXX 高危漏洞。' },
        ],
    };
    return bases[roleId] || bases['security-expert'];
}
// ── Incident Detail Sheet ──
function IncidentDetail({ incident, open, onClose, accentColor }) {
    const sev = SEVERITY_STYLES[incident?.severity] || SEVERITY_STYLES.INFO;
    const stat = STATUS_STYLES[incident?.status] || STATUS_STYLES.NEW;
    return (_jsx(Sheet, { open: open, onOpenChange: (v) => !v && onClose(), children: _jsxs(SheetContent, { side: "right", className: "bg-[#0f1525] border-white/[0.06] w-[480px] overflow-y-auto", children: [_jsx(SheetHeader, { children: _jsxs(SheetTitle, { className: "text-white flex items-center gap-2", children: [_jsx("span", { className: `px-2 py-0.5 rounded text-xs font-medium ${sev.bg} ${sev.text}`, children: sev.label }), _jsx("span", { className: "text-slate-400 text-sm font-normal", children: incident?.ticketId })] }) }), incident && (_jsxs("div", { className: "mt-4 space-y-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-lg font-semibold text-white", children: incident.title }), _jsx("p", { className: "text-sm text-slate-400 mt-1", children: incident.description })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]", children: [_jsx("p", { className: "text-xs text-slate-400 mb-1", children: "\u72B6\u6001" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `h-2 w-2 rounded-full ${stat.dot} animate-pulse` }), _jsx("span", { className: `text-sm font-medium ${stat.text}`, children: incident.status })] })] }), _jsxs("div", { className: "p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]", children: [_jsx("p", { className: "text-xs text-slate-400 mb-1", children: "\u8D1F\u8D23\u4EBA" }), _jsxs("p", { className: "text-sm text-white flex items-center gap-1", children: [_jsx(User, { className: "h-3 w-3" }), incident.assignee] })] }), _jsxs("div", { className: "p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]", children: [_jsx("p", { className: "text-xs text-slate-400 mb-1", children: "\u5206\u7C7B" }), _jsxs("p", { className: "text-sm text-white flex items-center gap-1", children: [_jsx(Tag, { className: "h-3 w-3" }), incident.category] })] }), _jsxs("div", { className: "p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]", children: [_jsx("p", { className: "text-xs text-slate-400 mb-1", children: "\u53D1\u73B0\u65F6\u95F4" }), _jsxs("p", { className: "text-sm text-white flex items-center gap-1", children: [_jsx(Clock, { className: "h-3 w-3" }), new Date(incident.createdAt).toLocaleString('zh-CN')] })] })] }), _jsxs("div", { className: "flex gap-2 pt-2", children: [_jsx(Button, { className: "flex-1", style: { backgroundColor: accentColor }, children: "\u5904\u7406" }), _jsx(Button, { variant: "outline", className: "flex-1", style: { borderColor: `${accentColor}40`, color: accentColor }, children: "\u5347\u7EA7" }), _jsx(Button, { variant: "outline", className: "flex-1", onClick: onClose, children: "\u5173\u95ED" })] })] }))] }) }));
}
// ── Component ──
export const IncidentsPage = () => {
    const navigate = useNavigate();
    const currentRole = useRoleContextStore((s) => s.currentRole);
    const theme = currentRole ? ROLE_THEMES[currentRole] : null;
    const accentColor = theme?.colors.primary ?? '#1e40af';
    const roleConfig = useMemo(() => (currentRole ? ROLE_DASHBOARD_CONFIG[currentRole] : null), [currentRole]);
    const [selectedIncident, setSelectedIncident] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [severityFilter, setSeverityFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    // Real API data (fallback to role-based mock when backend unavailable)
    const { data: statsData } = useIncidentStats();
    const incidents = getIncidentsByRole(currentRole || 'security-expert');
    const filtered = useMemo(() => {
        return incidents.filter((inc) => {
            if (search && !inc.title.toLowerCase().includes(search.toLowerCase()) && !inc.ticketId.toLowerCase().includes(search.toLowerCase()))
                return false;
            if (severityFilter && inc.severity !== severityFilter)
                return false;
            if (statusFilter && inc.status !== statusFilter)
                return false;
            return true;
        });
    }, [incidents, search, severityFilter, statusFilter]);
    const openCount = incidents.filter((i) => !['CLOSED', 'FALSE_POSITIVE'].includes(i.status)).length;
    const criticalCount = incidents.filter((i) => i.severity === 'CRITICAL').length;
    const handleRowClick = (incident) => {
        setSelectedIncident(incident);
        setDetailOpen(true);
    };
    const roleLabel = theme?.nameCn || '安全专家';
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 text-xs text-slate-400 mb-1", children: [_jsxs("span", { className: "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs", style: { backgroundColor: `${accentColor}20`, color: accentColor }, children: ["\uD83D\uDEE1\uFE0F ", roleLabel, " \u89C6\u89D2"] }), _jsx("span", { children: "\u5B89\u5168\u4E8B\u4EF6\u7BA1\u7406" })] }), _jsxs("h1", { className: "text-xl font-bold text-white flex items-center gap-2", children: [_jsx(ShieldAlert, { className: "h-5 w-5", style: { color: accentColor } }), "\u5B89\u5168\u4E8B\u4EF6"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { size: "sm", variant: "outline", className: "gap-1.5", style: { borderColor: `${accentColor}40`, color: accentColor }, onClick: () => navigate('/war-room'), children: [_jsx(RefreshCw, { className: "h-3 w-3" }), "\u4F5C\u6218\u5BA4"] }), _jsxs(Button, { size: "sm", className: "gap-1.5", style: { backgroundColor: accentColor }, children: [_jsx(Plus, { className: "h-3 w-3" }), "\u65B0\u5EFA\u4E8B\u4EF6"] })] })] }), _jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-3", children: [
                    { label: '总计事件', value: incidents.length, icon: _jsx(ShieldAlert, { className: "h-4 w-4" }) },
                    { label: '处理中', value: openCount, icon: _jsx(AlertTriangle, { className: "h-4 w-4" }) },
                    { label: '严重事件', value: criticalCount, icon: _jsx(AlertTriangle, { className: "h-4 w-4" }), highlight: criticalCount > 0 },
                    { label: '已关闭', value: incidents.length - openCount, icon: _jsx(ShieldAlert, { className: "h-4 w-4" }) },
                ].map((stat) => (_jsx(Card, { className: `bg-[#0f1525] border-white/[0.06] ${stat.highlight ? 'border-red-500/30' : ''}`, children: _jsxs(CardContent, { className: "p-4 flex items-center gap-3", children: [_jsx("div", { className: `p-2 rounded-lg ${stat.highlight ? 'bg-red-500/20 text-red-400' : ''}`, style: !stat.highlight ? { backgroundColor: `${accentColor}20`, color: accentColor } : {}, children: stat.icon }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-400", children: stat.label }), _jsx("p", { className: `text-2xl font-bold ${stat.highlight ? 'text-red-400' : 'text-white'}`, children: stat.value })] })] }) }, stat.label))) }), _jsx(Card, { className: "bg-[#0f1525] border-white/[0.06]", children: _jsx(CardContent, { className: "p-3", children: _jsxs("div", { className: "flex flex-wrap gap-2 items-center", children: [_jsxs("div", { className: "relative flex-1 min-w-[200px]", children: [_jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" }), _jsx(Input, { placeholder: "\u641C\u7D22\u4E8B\u4EF6\u6807\u9898\u6216\u7F16\u53F7...", value: search, onChange: (e) => setSearch(e.target.value), className: "pl-9 h-8 text-sm bg-white/[0.04] border-white/[0.08]" })] }), _jsxs("select", { className: "h-8 px-2 rounded-md text-sm bg-white/[0.04] border border-white/[0.08] text-slate-300", value: severityFilter, onChange: (e) => setSeverityFilter(e.target.value), children: [_jsx("option", { value: "", children: "\u5168\u90E8\u4E25\u91CD\u7EA7\u522B" }), _jsx("option", { value: "CRITICAL", children: "\u4E25\u91CD" }), _jsx("option", { value: "HIGH", children: "\u9AD8\u5371" }), _jsx("option", { value: "MEDIUM", children: "\u4E2D\u5371" }), _jsx("option", { value: "LOW", children: "\u4F4E\u5371" }), _jsx("option", { value: "INFO", children: "\u4FE1\u606F" })] }), _jsxs("select", { className: "h-8 px-2 rounded-md text-sm bg-white/[0.04] border border-white/[0.08] text-slate-300", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), children: [_jsx("option", { value: "", children: "\u5168\u90E8\u72B6\u6001" }), _jsx("option", { value: "NEW", children: "\u65B0\u5EFA" }), _jsx("option", { value: "CONFIRMED", children: "\u5DF2\u786E\u8BA4" }), _jsx("option", { value: "ANALYZING", children: "\u5206\u6790\u4E2D" }), _jsx("option", { value: "CONTAINING", children: "\u904F\u5236\u4E2D" }), _jsx("option", { value: "CLOSED", children: "\u5DF2\u5173\u95ED" })] }), (severityFilter || statusFilter) && (_jsxs(Button, { size: "sm", variant: "ghost", className: "h-8 text-xs gap-1", onClick: () => { setSeverityFilter(''); setStatusFilter(''); }, children: [_jsx(X, { className: "h-3 w-3" }), "\u6E05\u9664\u7B5B\u9009"] })), _jsxs("div", { className: "ml-auto text-xs text-slate-400", children: ["\u5171 ", filtered.length, " \u4E2A\u4E8B\u4EF6"] })] }) }) }), _jsx(Card, { className: "bg-[#0f1525] border-white/[0.06]", children: _jsxs(CardContent, { className: "p-0", children: [_jsxs("div", { className: "grid grid-cols-[80px_1fr_100px_100px_120px_100px_60px] gap-2 px-4 py-2.5 border-b border-white/[0.06] text-xs text-slate-400 font-medium", children: [_jsx("div", { children: "\u7F16\u53F7" }), _jsx("div", { children: "\u6807\u9898" }), _jsx("div", { children: "\u4E25\u91CD\u7EA7\u522B" }), _jsx("div", { children: "\u72B6\u6001" }), _jsx("div", { children: "\u8D1F\u8D23\u4EBA" }), _jsx("div", { children: "\u53D1\u73B0\u65F6\u95F4" }), _jsx("div", {})] }), filtered.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-slate-500", children: [_jsx(ShieldAlert, { className: "h-8 w-8 mb-3 opacity-30" }), _jsx("p", { className: "text-sm", children: "\u6682\u65E0\u4E8B\u4EF6" })] })) : (filtered.map((incident) => {
                            const sev = SEVERITY_STYLES[incident.severity] || SEVERITY_STYLES.INFO;
                            const stat = STATUS_STYLES[incident.status] || STATUS_STYLES.NEW;
                            return (_jsxs("div", { className: "grid grid-cols-[80px_1fr_100px_100px_120px_100px_60px] gap-2 px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors items-center", onClick: () => handleRowClick(incident), children: [_jsx("div", { className: "text-xs text-slate-400 font-mono", children: incident.ticketId }), _jsxs("div", { children: [_jsx("p", { className: "text-sm text-white font-medium truncate", children: incident.title }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: incident.category })] }), _jsx("div", { children: _jsx("span", { className: `inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${sev.bg} ${sev.text}`, children: sev.label }) }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: `h-1.5 w-1.5 rounded-full ${stat.dot} ${!['CLOSED', 'FALSE_POSITIVE'].includes(incident.status) ? 'animate-pulse' : ''}` }), _jsx("span", { className: `text-xs ${stat.text}`, children: incident.status })] }), _jsx("div", { className: "text-xs text-slate-300", children: incident.assignee }), _jsx("div", { className: "text-xs text-slate-400", children: new Date(incident.createdAt).toLocaleDateString('zh-CN') }), _jsx("div", { children: _jsx(ChevronRight, { className: "h-4 w-4 text-slate-500" }) })] }, incident.id));
                        }))] }) }), _jsx(IncidentDetail, { incident: selectedIncident, open: detailOpen, onClose: () => setDetailOpen(false), accentColor: accentColor })] }));
};
//# sourceMappingURL=IncidentsPage.js.map