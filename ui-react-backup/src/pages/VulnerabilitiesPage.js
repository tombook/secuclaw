import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SecuClaw Vulnerabilities Page
 *
 * Vulnerability management with CVSS scoring, severity stats,
 * filterable table, progress bars, and distribution pie chart.
 */
import React, { useState, useMemo } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
// ── Mock Data ──
const MOCK_VULNS = [
    { id: 'v1', cveId: 'CVE-2024-21762', title: 'FortiOS out-of-bounds write', cvss: 9.8, severity: 'critical', status: 'open', affectedAssets: ['Firewall-01', 'Firewall-02'], discoveredAt: '2024-04-10', description: 'Fortinet FortiOS SSL VPN 存在越界写入漏洞，可被远程利用执行任意代码。' },
    { id: 'v2', cveId: 'CVE-2024-0204', title: 'GoAnywhere MFT authentication bypass', cvss: 9.1, severity: 'critical', status: 'remediating', affectedAssets: ['MFT-Server-01'], discoveredAt: '2024-04-08', description: 'GoAnywhere MFT 存在认证绕过漏洞，允许未授权用户创建管理员账户。' },
    { id: 'v3', cveId: 'CVE-2024-23897', title: 'Jenkins CLI arbitrary file read', cvss: 8.6, severity: 'high', status: 'remediating', affectedAssets: ['CI-Jenkins-01', 'CI-Jenkins-02'], discoveredAt: '2024-04-05', description: 'Jenkins CLI 命令行接口存在任意文件读取漏洞。' },
    { id: 'v4', cveId: 'CVE-2024-23917', title: 'Apache Struts file upload RCE', cvss: 8.1, severity: 'high', status: 'open', affectedAssets: ['App-Server-03'], discoveredAt: '2024-04-06', description: 'Apache Struts 文件上传功能存在远程代码执行漏洞。' },
    { id: 'v5', cveId: 'CVE-2024-22252', title: 'VMware Workstation heap overflow', cvss: 7.8, severity: 'high', status: 'resolved', affectedAssets: ['Workstation-Group-A'], discoveredAt: '2024-04-03', description: 'VMware Workstation 存在堆溢出漏洞，可在宿主机上执行代码。' },
    { id: 'v6', cveId: 'CVE-2024-21413', title: 'Microsoft Outlook moniker link', cvss: 7.5, severity: 'high', status: 'resolved', affectedAssets: ['Mail-Server-01', 'Workstations-ALL'], discoveredAt: '2024-03-28', description: 'Microsoft Outlook 存在 Moniker 链接漏洞，可泄露 NTLM 凭据。' },
    { id: 'v7', cveId: 'CVE-2024-27198', title: 'TeamCity auth bypass via alternate path', cvss: 7.2, severity: 'medium', status: 'accepted', affectedAssets: ['CI-TeamCity-01'], discoveredAt: '2024-04-02', description: 'JetBrains TeamCity 存在备用路径认证绕过漏洞。' },
    { id: 'v8', cveId: 'CVE-2024-1709', title: 'ConnectWise ScreenConnect auth bypass', cvss: 6.5, severity: 'medium', status: 'remediating', affectedAssets: ['Remote-Support-01'], discoveredAt: '2024-04-01', description: 'ConnectWise ScreenConnect 存在认证绕过漏洞。' },
    { id: 'v9', cveId: 'CVE-2024-22262', title: 'Spring Framework URL parsing', cvss: 5.6, severity: 'medium', status: 'risk-accepted', affectedAssets: ['App-Server-01'], discoveredAt: '2024-03-25', description: 'Spring Framework URL 解析不一致可能导致安全绕过。' },
    { id: 'v10', cveId: 'CVE-2024-22259', title: 'Spring Framework input validation', cvss: 4.3, severity: 'low', status: 'resolved', affectedAssets: ['App-Server-02'], discoveredAt: '2024-03-20', description: 'Spring Framework 存在输入验证不足问题。' },
];
// ── Helpers ──
const SEVERITY_VARIANT = {
    critical: 'critical', high: 'high', medium: 'medium', low: 'low',
};
const SEVERITY_LABEL = {
    critical: '严重', high: '高危', medium: '中危', low: '低危',
};
const STATUS_LABEL = {
    open: '待处理',
    accepted: '已确认',
    remediating: '修复中',
    resolved: '已修复',
    'risk-accepted': '风险接受',
};
const STATUS_COLOR = {
    open: '#3b82f6',
    accepted: '#f59e0b',
    remediating: '#f97316',
    resolved: '#22c55e',
    'risk-accepted': '#6b7280',
};
function cvssColor(score) {
    if (score >= 9)
        return '#ef4444';
    if (score >= 7)
        return '#f97316';
    if (score >= 4)
        return '#eab308';
    return '#22c55e';
}
// ── Mini Pie Chart SVG ──
const PieChart = ({ data }) => {
    const total = data.reduce((s, d) => s + d.count, 0);
    const cx = 80, cy = 80, r = 60;
    const circumference = 2 * Math.PI * r;
    let cumulative = 0;
    const arcs = data.map((d) => {
        const fraction = d.count / total;
        const dashLen = fraction * circumference;
        const dashOffset = -cumulative * circumference;
        cumulative += fraction;
        return { ...d, dashLen, dashOffset, fraction };
    });
    return (_jsxs("div", { className: "flex items-center gap-6", children: [_jsx("svg", { width: 160, height: 160, viewBox: "0 0 160 160", children: arcs.map((arc, i) => (_jsx("circle", { cx: cx, cy: cy, r: r, fill: "none", stroke: arc.color, strokeWidth: 24, strokeDasharray: `${arc.dashLen} ${circumference - arc.dashLen}`, strokeDashoffset: arc.dashOffset, transform: `rotate(-90 ${cx} ${cy})`, className: "transition-all duration-500" }, i))) }), _jsx("div", { className: "space-y-1.5", children: data.map((d) => (_jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsx("span", { className: "w-2.5 h-2.5 rounded-sm flex-shrink-0", style: { backgroundColor: d.color } }), _jsx("span", { className: "text-white/60", children: d.label }), _jsx("span", { className: "text-white font-semibold ml-auto", children: d.count })] }, d.label))) })] }));
};
// ── Component ──
export const VulnerabilitiesPage = () => {
    const currentRole = useRoleContextStore((s) => s.currentRole);
    const theme = currentRole ? ROLE_THEMES[currentRole] : null;
    const accentColor = theme?.colors.primary ?? '#1e40af';
    const [severityFilter, setSeverityFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const filtered = useMemo(() => {
        return MOCK_VULNS.filter((v) => {
            if (severityFilter !== 'all' && v.severity !== severityFilter)
                return false;
            if (statusFilter !== 'all' && v.status !== statusFilter)
                return false;
            if (searchQuery && !v.cveId.toLowerCase().includes(searchQuery.toLowerCase()) && !v.title.toLowerCase().includes(searchQuery.toLowerCase()))
                return false;
            return true;
        });
    }, [severityFilter, statusFilter, searchQuery]);
    const stats = useMemo(() => ({
        total: MOCK_VULNS.length,
        critical: MOCK_VULNS.filter((v) => v.severity === 'critical').length,
        high: MOCK_VULNS.filter((v) => v.severity === 'high').length,
        patchRate: Math.round((MOCK_VULNS.filter((v) => v.status === 'resolved').length / MOCK_VULNS.length) * 100),
    }), []);
    const pieData = useMemo(() => [
        { label: '严重', count: MOCK_VULNS.filter((v) => v.severity === 'critical').length, color: '#ef4444' },
        { label: '高危', count: MOCK_VULNS.filter((v) => v.severity === 'high').length, color: '#f97316' },
        { label: '中危', count: MOCK_VULNS.filter((v) => v.severity === 'medium').length, color: '#eab308' },
        { label: '低危', count: MOCK_VULNS.filter((v) => v.severity === 'low').length, color: '#22c55e' },
    ], []);
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-white", children: "\uD83D\uDC1B \u6F0F\u6D1E\u7BA1\u7406" }), _jsx("p", { className: "text-sm text-white/40 mt-0.5", children: "\u6F0F\u6D1E\u53D1\u73B0\u3001\u8BC4\u4F30\u3001\u4FEE\u590D\u8DDF\u8E2A\u4E0E\u98CE\u9669\u63A5\u53D7\u7BA1\u7406" })] }), _jsx("div", { className: "grid grid-cols-4 gap-3", children: [
                    { label: '漏洞总数', value: stats.total, icon: '📋', color: accentColor },
                    { label: '严重漏洞', value: stats.critical, icon: '🔴', color: '#ef4444' },
                    { label: '高危漏洞', value: stats.high, icon: '🟠', color: '#f97316' },
                    { label: '补丁覆盖率', value: `${stats.patchRate}%`, icon: '🔧', color: '#22c55e' },
                ].map((s) => (_jsx(Card, { className: "bg-[#0f1525] border-white/[0.06]", children: _jsxs(CardContent, { className: "p-3 flex items-center gap-3", children: [_jsx("span", { className: "text-xl", children: s.icon }), _jsxs("div", { children: [_jsx("div", { className: "text-xl font-bold text-white", children: s.value }), _jsx("div", { className: "text-[10px] text-white/40", children: s.label })] })] }) }, s.label))) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Input, { placeholder: "\u641C\u7D22 CVE ID / \u6807\u9898...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-64 bg-[#0f1525] border-white/10 text-white text-xs placeholder:text-white/25" }), _jsxs(Select, { value: severityFilter, onValueChange: setSeverityFilter, children: [_jsx(SelectTrigger, { className: "w-32 bg-[#0f1525] border-white/10 text-white text-xs", children: _jsx(SelectValue, { placeholder: "\u4E25\u91CD\u7A0B\u5EA6" }) }), _jsxs(SelectContent, { className: "bg-[#0f1525] border-white/10", children: [_jsx(SelectItem, { value: "all", className: "text-xs", children: "\u5168\u90E8\u4E25\u91CD\u7A0B\u5EA6" }), _jsx(SelectItem, { value: "critical", className: "text-xs", children: "\u4E25\u91CD" }), _jsx(SelectItem, { value: "high", className: "text-xs", children: "\u9AD8\u5371" }), _jsx(SelectItem, { value: "medium", className: "text-xs", children: "\u4E2D\u5371" }), _jsx(SelectItem, { value: "low", className: "text-xs", children: "\u4F4E\u5371" })] })] }), _jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [_jsx(SelectTrigger, { className: "w-32 bg-[#0f1525] border-white/10 text-white text-xs", children: _jsx(SelectValue, { placeholder: "\u72B6\u6001" }) }), _jsxs(SelectContent, { className: "bg-[#0f1525] border-white/10", children: [_jsx(SelectItem, { value: "all", className: "text-xs", children: "\u5168\u90E8\u72B6\u6001" }), _jsx(SelectItem, { value: "open", className: "text-xs", children: "\u5F85\u5904\u7406" }), _jsx(SelectItem, { value: "accepted", className: "text-xs", children: "\u5DF2\u786E\u8BA4" }), _jsx(SelectItem, { value: "remediating", className: "text-xs", children: "\u4FEE\u590D\u4E2D" }), _jsx(SelectItem, { value: "resolved", className: "text-xs", children: "\u5DF2\u4FEE\u590D" }), _jsx(SelectItem, { value: "risk-accepted", className: "text-xs", children: "\u98CE\u9669\u63A5\u53D7" })] })] }), _jsxs("span", { className: "text-xs text-white/30 ml-auto", children: ["\u5171 ", filtered.length, " \u6761"] })] }), _jsxs("div", { className: "grid grid-cols-[1fr_260px] gap-4", children: [_jsxs(Card, { className: "bg-[#0f1525] border-white/[0.06] overflow-hidden", children: [_jsxs("div", { className: "grid grid-cols-[100px_1fr_80px_80px_80px_100px_120px] gap-2 px-4 py-2.5 border-b border-white/[0.06] text-[10px] font-semibold text-white/40 uppercase", children: [_jsx("span", { children: "CVE ID" }), _jsx("span", { children: "\u6807\u9898" }), _jsx("span", { children: "CVSS" }), _jsx("span", { children: "\u4E25\u91CD\u7A0B\u5EA6" }), _jsx("span", { children: "\u72B6\u6001" }), _jsx("span", { children: "\u5F71\u54CD\u8D44\u4EA7" }), _jsx("span", { children: "\u53D1\u73B0\u65F6\u95F4" })] }), filtered.map((v) => (_jsxs("div", { className: "grid grid-cols-[100px_1fr_80px_80px_80px_100px_120px] gap-2 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors items-center", children: [_jsx("span", { className: "text-xs text-blue-400 font-mono", children: v.cveId }), _jsx("span", { className: "text-xs text-white truncate", children: v.title }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "text-xs font-bold", style: { color: cvssColor(v.cvss) }, children: v.cvss }), _jsx(Progress, { value: (v.cvss / 10) * 100, className: "h-1.5 flex-1" })] }), _jsx(Badge, { variant: SEVERITY_VARIANT[v.severity], className: "text-[9px] px-1.5 py-0 justify-center", children: SEVERITY_LABEL[v.severity] }), _jsx("span", { className: "text-[10px]", style: { color: STATUS_COLOR[v.status] }, children: STATUS_LABEL[v.status] }), _jsxs("span", { className: "text-[10px] text-white/40 truncate", children: [v.affectedAssets.length, " \u53F0"] }), _jsx("span", { className: "text-[10px] text-white/30", children: v.discoveredAt })] }, v.id)))] }), _jsxs(Card, { className: "bg-[#0f1525] border-white/[0.06]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-xs text-white/50", children: "\u6F0F\u6D1E\u5206\u5E03" }) }), _jsx(CardContent, { children: _jsx(PieChart, { data: pieData }) })] })] }), _jsx("button", { className: "fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg hover:scale-110 transition-transform", style: { backgroundColor: accentColor }, children: "\uD83E\uDD16" })] }));
};
export default VulnerabilitiesPage;
//# sourceMappingURL=VulnerabilitiesPage.js.map