import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SecuClaw Compliance Page
 *
 * Compliance management with framework progress bars,
 * control checklist, compliance dashboard, and gap analysis.
 */
import React, { useState } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
// ── Mock Data ──
const MOCK_FRAMEWORKS = [
    { id: 'gdpr', name: 'GDPR 通用数据保护条例', icon: '🇪🇺', totalControls: 45, compliant: 32, partial: 8, nonCompliant: 3, notAssessed: 2, lastAudit: '2024-03-15', nextAudit: '2024-09-15' },
    { id: 'pipl', name: '个人信息保护法 PIPL', icon: '🇨🇳', totalControls: 52, compliant: 41, partial: 6, nonCompliant: 2, notAssessed: 3, lastAudit: '2024-04-01', nextAudit: '2024-10-01' },
    { id: 'ccpa', name: 'CCPA 加州消费者隐私法', icon: '🇺🇸', totalControls: 30, compliant: 18, partial: 7, nonCompliant: 3, notAssessed: 2, lastAudit: '2024-02-20', nextAudit: '2024-08-20' },
    { id: 'cybersecurity-law', name: '网络安全法 + 等保 2.0', icon: '🛡️', totalControls: 68, compliant: 50, partial: 10, nonCompliant: 5, notAssessed: 3, lastAudit: '2024-03-30', nextAudit: '2024-09-30' },
];
const MOCK_CONTROLS = [
    { id: 'C-001', frameworkId: 'gdpr', title: '数据处理合法基础记录', status: 'compliant', owner: '王芳', evidence: '数据处理协议模板 v3.2', dueDate: '2024-06-01', category: '数据处理' },
    { id: 'C-002', frameworkId: 'gdpr', title: '数据主体访问请求流程', status: 'compliant', owner: '李明', evidence: 'DSAR 工作流文档', dueDate: '2024-06-01', category: '数据主体权利' },
    { id: 'C-003', frameworkId: 'gdpr', title: '数据泄露通知机制', status: 'partial', owner: '张伟', evidence: '通知流程文档（待更新）', dueDate: '2024-05-15', category: '数据泄露' },
    { id: 'C-004', frameworkId: 'gdpr', title: 'DPO 任命数据保护官', status: 'compliant', owner: '赵刚', evidence: 'DPO 任命书', dueDate: '-', category: '治理' },
    { id: 'C-005', frameworkId: 'gdpr', title: '隐私影响评估 DPIA', status: 'partial', owner: '陈晓', evidence: 'DPIA 模板（进行中）', dueDate: '2024-07-01', category: '评估' },
    { id: 'C-006', frameworkId: 'pipl', title: '个人信息收集同意机制', status: 'compliant', owner: '王芳', evidence: '同意管理平台配置', dueDate: '2024-05-01', category: '同意管理' },
    { id: 'C-007', frameworkId: 'pipl', title: '跨境数据传输安全评估', status: 'non-compliant', owner: '张伟', evidence: '待完成安全评估报告', dueDate: '2024-04-30', category: '跨境传输' },
    { id: 'C-008', frameworkId: 'pipl', title: '个人信息安全事件应急', status: 'compliant', owner: '李明', evidence: '应急响应预案 v2.0', dueDate: '-', category: '事件响应' },
    { id: 'C-009', frameworkId: 'ccpa', title: '消费者选择退出机制', status: 'partial', owner: '赵刚', evidence: 'Opt-out 页面（开发中）', dueDate: '2024-06-15', category: '消费者权利' },
    { id: 'C-010', frameworkId: 'ccpa', title: '数据销售披露声明', status: 'compliant', owner: '陈晓', evidence: '隐私政策更新', dueDate: '-', category: '披露' },
    { id: 'C-011', frameworkId: 'cybersecurity-law', title: '网络安全等级保护备案', status: 'compliant', owner: '张伟', evidence: '等保三级备案证明', dueDate: '-', category: '等级保护' },
    { id: 'C-012', frameworkId: 'cybersecurity-law', title: '关键信息基础设施保护', status: 'partial', owner: '李明', evidence: 'CII 识别报告（审批中）', dueDate: '2024-05-30', category: '基础设施' },
    { id: 'C-013', frameworkId: 'cybersecurity-law', title: '安全日志留存 6 个月', status: 'non-compliant', owner: '赵刚', evidence: '日志存储扩容方案', dueDate: '2024-05-15', category: '日志管理' },
    { id: 'C-014', frameworkId: 'cybersecurity-law', title: '个人信息去标识化处理', status: 'not-assessed', owner: '-', evidence: '-', dueDate: '2024-08-01', category: '数据处理' },
    { id: 'C-015', frameworkId: 'pipl', title: '个人信息保护影响评估', status: 'not-assessed', owner: '-', evidence: '-', dueDate: '2024-08-15', category: '评估' },
];
// ── Helpers ──
const STATUS_CONFIG = {
    compliant: { label: '合规', color: '#22c55e', bgColor: '#22c55e22' },
    partial: { label: '部分合规', color: '#eab308', bgColor: '#eab30822' },
    'non-compliant': { label: '不合规', color: '#ef4444', bgColor: '#ef444422' },
    'not-assessed': { label: '未评估', color: '#6b7280', bgColor: '#6b728022' },
};
// ── Compliance Gauge SVG ──
const MiniGauge = ({ value, label, size = 80 }) => {
    const r = (size - 8) / 2;
    const c = 2 * Math.PI * r;
    const offset = c - (value / 100) * c;
    const color = value >= 80 ? '#22c55e' : value >= 60 ? '#eab308' : '#ef4444';
    return (_jsxs("div", { className: "flex flex-col items-center gap-1", children: [_jsxs("svg", { width: size, height: size, className: "-rotate-90", children: [_jsx("circle", { cx: size / 2, cy: size / 2, r: r, fill: "none", stroke: "rgba(255,255,255,0.06)", strokeWidth: 6 }), _jsx("circle", { cx: size / 2, cy: size / 2, r: r, fill: "none", stroke: color, strokeWidth: 6, strokeLinecap: "round", strokeDasharray: c, strokeDashoffset: offset, className: "transition-all duration-700" })] }), _jsx("div", { className: "absolute flex flex-col items-center justify-center pointer-events-none", style: { width: size, height: size }, children: _jsxs("span", { className: "text-sm font-bold", style: { color }, children: [Math.round(value), "%"] }) }), _jsx("span", { className: "text-[10px] text-white/40", children: label })] }));
};
// ── Component ──
export const CompliancePage = () => {
    const currentRole = useRoleContextStore((s) => s.currentRole);
    const theme = currentRole ? ROLE_THEMES[currentRole] : null;
    const accentColor = theme?.colors.primary ?? '#1e40af';
    const [selectedFramework, setSelectedFramework] = useState('gdpr');
    const selectedFw = MOCK_FRAMEWORKS.find((f) => f.id === selectedFramework);
    const controls = MOCK_CONTROLS.filter((c) => c.frameworkId === selectedFramework);
    const complianceRate = Math.round((selectedFw.compliant / selectedFw.totalControls) * 100);
    // Gap analysis
    const gaps = MOCK_CONTROLS.filter((c) => c.status === 'non-compliant' || c.status === 'partial');
    const gapByFramework = MOCK_FRAMEWORKS.map((fw) => ({
        ...fw,
        gaps: MOCK_CONTROLS.filter((c) => c.frameworkId === fw.id && (c.status === 'non-compliant' || c.status === 'partial')),
    }));
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-white", children: "\u2705 \u5408\u89C4\u7BA1\u7406" }), _jsx("p", { className: "text-sm text-white/40 mt-0.5", children: "\u5408\u89C4\u6846\u67B6\u8DDF\u8E2A\u3001\u63A7\u5236\u9879\u7BA1\u7406\u4E0E\u5DEE\u8DDD\u5206\u6790" })] }), _jsx("div", { className: "grid grid-cols-4 gap-3", children: MOCK_FRAMEWORKS.map((fw) => {
                    const rate = Math.round((fw.compliant / fw.totalControls) * 100);
                    const isSelected = selectedFramework === fw.id;
                    return (_jsx(Card, { className: `bg-[#0f1525] border-white/[0.06] cursor-pointer transition-all hover:border-white/10 ${isSelected ? 'ring-1' : ''}`, style: isSelected ? { borderColor: accentColor } : {}, onClick: () => setSelectedFramework(fw.id), children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "text-lg", children: fw.icon }), _jsx("span", { className: "text-xs font-medium text-white", children: fw.name })] }), _jsxs("div", { className: "flex items-center justify-between text-[10px] text-white/40 mb-1.5", children: [_jsxs("span", { children: [fw.compliant, "/", fw.totalControls, " \u63A7\u5236"] }), _jsxs("span", { className: "font-semibold", style: { color: rate >= 80 ? '#22c55e' : '#eab308' }, children: [rate, "%"] })] }), _jsx(Progress, { value: rate, className: "h-2" }), _jsx("div", { className: "flex gap-3 mt-2 text-[9px] text-white/30", children: _jsxs("span", { children: ["\u4E0B\u6B21\u5BA1\u8BA1: ", fw.nextAudit] }) })] }) }, fw.id));
                }) }), _jsxs(Tabs, { defaultValue: "controls", className: "space-y-4", children: [_jsxs(TabsList, { className: "bg-[#0f1525] border border-white/[0.06]", children: [_jsx(TabsTrigger, { value: "controls", className: "text-xs data-[state=active]:bg-white/10", children: "\uD83D\uDCCB \u63A7\u5236\u9879" }), _jsx(TabsTrigger, { value: "dashboard", className: "text-xs data-[state=active]:bg-white/10", children: "\uD83D\uDCCA \u4EEA\u8868\u76D8" }), _jsx(TabsTrigger, { value: "gaps", className: "text-xs data-[state=active]:bg-white/10", children: "\uD83D\uDD0D \u5DEE\u8DDD\u5206\u6790" })] }), _jsx(TabsContent, { value: "controls", children: _jsxs(Card, { className: "bg-[#0f1525] border-white/[0.06] overflow-hidden", children: [_jsxs(CardHeader, { className: "pb-2 flex-row items-center justify-between", children: [_jsxs(CardTitle, { className: "text-sm text-white/70", children: [selectedFw.icon, " ", selectedFw.name, " \u2014 \u63A7\u5236\u9879\u68C0\u67E5\u5217\u8868"] }), _jsxs(Badge, { variant: "outline", className: "text-[10px] px-2 border-white/10 text-white/50", children: [controls.length, " \u9879"] })] }), _jsxs(CardContent, { children: [_jsx("div", { className: "flex gap-4 mb-3", children: ['compliant', 'partial', 'non-compliant', 'not-assessed'].map((status) => {
                                                const cfg = STATUS_CONFIG[status];
                                                const count = controls.filter((c) => c.status === status).length;
                                                return (_jsxs("div", { className: "flex items-center gap-1.5 text-[10px]", children: [_jsx("span", { className: "w-2 h-2 rounded-full", style: { backgroundColor: cfg.color } }), _jsx("span", { className: "text-white/40", children: cfg.label }), _jsx("span", { className: "font-semibold text-white/60", children: count })] }, status));
                                            }) }), _jsx("div", { className: "space-y-1", children: controls.map((ctrl) => {
                                                const cfg = STATUS_CONFIG[ctrl.status];
                                                return (_jsxs("div", { className: "flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/[0.02] transition-colors", children: [_jsx("span", { className: "w-2 h-2 rounded-full flex-shrink-0", style: { backgroundColor: cfg.color } }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-medium text-white", children: ctrl.title }), _jsx(Badge, { className: "text-[9px] px-1.5 py-0 border-0", style: { backgroundColor: cfg.bgColor, color: cfg.color }, children: cfg.label })] }), _jsxs("div", { className: "text-[10px] text-white/30 mt-0.5", children: [ctrl.category, " \u00B7 \u8D1F\u8D23\u4EBA: ", ctrl.owner, " \u00B7 \u622A\u6B62: ", ctrl.dueDate] })] }), _jsx("div", { className: "text-[10px] text-white/25 max-w-[160px] truncate", children: ctrl.evidence }), _jsx(Button, { variant: "ghost", size: "sm", className: "text-[10px] text-white/30 hover:text-white h-6 px-2", children: "\u67E5\u770B" })] }, ctrl.id));
                                            }) })] })] }) }), _jsx(TabsContent, { value: "dashboard", children: _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs(Card, { className: "bg-[#0f1525] border-white/[0.06]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-xs text-white/50", children: "\u5408\u89C4\u72B6\u6001\u6982\u89C8" }) }), _jsx(CardContent, { children: _jsx("div", { className: "flex justify-around py-4", children: MOCK_FRAMEWORKS.map((fw) => {
                                                    const rate = Math.round((fw.compliant / fw.totalControls) * 100);
                                                    return (_jsx("div", { className: "relative", children: _jsx(MiniGauge, { value: rate, label: fw.name.split(' ')[0], size: 90 }) }, fw.id));
                                                }) }) })] }), _jsxs(Card, { className: "bg-[#0f1525] border-white/[0.06]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-xs text-white/50", children: "\u63A7\u5236\u9879\u72B6\u6001\u5206\u5E03" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "space-y-3", children: [MOCK_FRAMEWORKS.map((fw) => (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-[10px]", children: [_jsxs("span", { className: "text-white/60", children: [fw.icon, " ", fw.name.split(' ')[0]] }), _jsxs("span", { className: "text-white/40", children: [fw.compliant, "/", fw.totalControls] })] }), _jsxs("div", { className: "flex h-3 rounded-full overflow-hidden bg-white/[0.04]", children: [_jsx("div", { style: { width: `${(fw.compliant / fw.totalControls) * 100}%`, backgroundColor: '#22c55e' }, className: "transition-all duration-500" }), _jsx("div", { style: { width: `${(fw.partial / fw.totalControls) * 100}%`, backgroundColor: '#eab308' }, className: "transition-all duration-500" }), _jsx("div", { style: { width: `${(fw.nonCompliant / fw.totalControls) * 100}%`, backgroundColor: '#ef4444' }, className: "transition-all duration-500" }), _jsx("div", { style: { width: `${(fw.notAssessed / fw.totalControls) * 100}%`, backgroundColor: '#6b7280' }, className: "transition-all duration-500" })] })] }, fw.id))), _jsx("div", { className: "flex gap-4 pt-2", children: [
                                                            { color: '#22c55e', label: '合规' },
                                                            { color: '#eab308', label: '部分合规' },
                                                            { color: '#ef4444', label: '不合规' },
                                                            { color: '#6b7280', label: '未评估' },
                                                        ].map((l) => (_jsxs("div", { className: "flex items-center gap-1 text-[9px] text-white/40", children: [_jsx("span", { className: "w-2 h-2 rounded-sm", style: { backgroundColor: l.color } }), l.label] }, l.label))) })] }) })] })] }) }), _jsx(TabsContent, { value: "gaps", children: _jsxs("div", { className: "space-y-4", children: [_jsx(Card, { className: "bg-[#0f1525] border-white/[0.06]", children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-6", children: [_jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-red-400", children: gaps.length }), _jsx("div", { className: "text-[10px] text-white/40", children: "\u5F85\u4FEE\u590D\u5DEE\u8DDD\u9879" })] }), _jsx("div", { className: "h-10 w-px bg-white/[0.06]" }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-yellow-400", children: gaps.filter((g) => g.status === 'partial').length }), _jsx("div", { className: "text-[10px] text-white/40", children: "\u90E8\u5206\u5408\u89C4" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-red-500", children: gaps.filter((g) => g.status === 'non-compliant').length }), _jsx("div", { className: "text-[10px] text-white/40", children: "\u4E0D\u5408\u89C4" })] })] }) }) }), gapByFramework.filter((fw) => fw.gaps.length > 0).map((fw) => (_jsxs(Card, { className: "bg-[#0f1525] border-white/[0.06]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm text-white/70", children: [fw.icon, " ", fw.name, _jsxs(Badge, { variant: "destructive", className: "ml-2 text-[9px] px-1.5 py-0", children: [fw.gaps.length, " \u4E2A\u5DEE\u8DDD"] })] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-2", children: fw.gaps.map((gap) => {
                                                    const cfg = STATUS_CONFIG[gap.status];
                                                    return (_jsxs("div", { className: "flex items-center gap-3 p-2.5 rounded-md bg-white/[0.02]", children: [_jsx("span", { className: "w-2 h-2 rounded-full", style: { backgroundColor: cfg.color } }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-xs font-medium text-white", children: gap.title }), _jsx("div", { className: "text-[10px] text-white/30", children: gap.evidence })] }), _jsx(Badge, { className: "text-[9px] px-1.5 py-0 border-0", style: { backgroundColor: cfg.bgColor, color: cfg.color }, children: cfg.label }), _jsxs("div", { className: "text-[10px] text-white/30", children: ["\u622A\u6B62: ", gap.dueDate] })] }, gap.id));
                                                }) }) })] }, fw.id)))] }) })] }), _jsx("button", { className: "fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg hover:scale-110 transition-transform", style: { backgroundColor: accentColor }, children: "\uD83E\uDD16" })] }));
};
export default CompliancePage;
//# sourceMappingURL=CompliancePage.js.map