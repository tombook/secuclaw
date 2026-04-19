import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SecuClaw AI Experts Page
 *
 * 8-role card selector with detailed role view including radar,
 * MITRE heatmap, SCF controls, and capability bars.
 */
import React, { useState } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES, ALL_ROLE_IDS } from '@/config/role-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExpertiseRadar } from '@/components/visualizations/ExpertiseRadar';
import { MitreHeatmap } from '@/components/visualizations/MitreHeatmap';
// ── Mock Data ──
const MOCK_ROLE_DETAILS = {
    'security-expert': {
        scfControls: ['DSC-01', 'DSC-02', 'DSC-03', 'IAM-01', 'IAM-02', 'TVM-01', 'TVM-02'],
        capabilities: { light: 85, dark: 90, security: 95, legal: 45, technology: 92, business: 55 },
        radarData: [
            { dimension: '威胁检测', value: 92 },
            { dimension: '漏洞管理', value: 88 },
            { dimension: '渗透测试', value: 85 },
            { dimension: '应急响应', value: 78 },
            { dimension: '安全工具', value: 90 },
            { dimension: '合规评估', value: 60 },
        ],
    },
    'privacy-officer': {
        scfControls: ['PRI-01', 'PRI-02', 'PRI-03', 'DSP-01', 'DSP-02', 'GOV-01'],
        capabilities: { light: 90, dark: 35, security: 65, legal: 95, technology: 50, business: 70 },
        radarData: [
            { dimension: '隐私合规', value: 95 },
            { dimension: '法规解读', value: 92 },
            { dimension: '数据保护', value: 88 },
            { dimension: '风险评估', value: 80 },
            { dimension: '审计管理', value: 75 },
            { dimension: '技术实现', value: 45 },
        ],
    },
    'security-architect': {
        scfControls: ['SEF-01', 'SEF-02', 'SEF-03', 'DSC-04', 'IAM-03', 'TVM-03'],
        capabilities: { light: 80, dark: 70, security: 88, legal: 40, technology: 95, business: 50 },
        radarData: [
            { dimension: '架构设计', value: 95 },
            { dimension: '零信任', value: 88 },
            { dimension: '防御纵深', value: 90 },
            { dimension: '云安全', value: 82 },
            { dimension: '网络架构', value: 85 },
            { dimension: '合规框架', value: 55 },
        ],
    },
    'business-security-officer': {
        scfControls: ['GOV-02', 'GOV-03', 'RLT-01', 'RLT-02', 'STA-01', 'STA-02'],
        capabilities: { light: 85, dark: 25, security: 55, legal: 65, technology: 45, business: 95 },
        radarData: [
            { dimension: '业务连续性', value: 92 },
            { dimension: '风险管理', value: 88 },
            { dimension: 'ROI 分析', value: 85 },
            { dimension: '灾难恢复', value: 80 },
            { dimension: '安全治理', value: 70 },
            { dimension: '技术深度', value: 40 },
        ],
    },
    'secuclaw-commander': {
        scfControls: ['GOV-01', 'GOV-02', 'GOV-03', 'RLT-01', 'SEF-01', 'STA-01'],
        capabilities: { light: 75, dark: 80, security: 85, legal: 60, technology: 78, business: 85 },
        radarData: [
            { dimension: '指挥调度', value: 95 },
            { dimension: '跨角色协调', value: 92 },
            { dimension: '危机管理', value: 88 },
            { dimension: '策略制定', value: 85 },
            { dimension: '安全评估', value: 80 },
            { dimension: '技术执行', value: 70 },
        ],
    },
    ciso: {
        scfControls: ['GOV-01', 'GOV-02', 'GOV-03', 'RLT-01', 'RLT-02', 'STA-01', 'STA-02'],
        capabilities: { light: 80, dark: 30, security: 80, legal: 75, technology: 60, business: 90 },
        radarData: [
            { dimension: '战略规划', value: 95 },
            { dimension: '风险管理', value: 90 },
            { dimension: '治理合规', value: 88 },
            { dimension: '预算管理', value: 82 },
            { dimension: '董事会沟通', value: 85 },
            { dimension: '技术深度', value: 55 },
        ],
    },
    'security-ops': {
        scfControls: ['DSC-01', 'DSC-02', 'DSC-03', 'TVM-01', 'TVM-02', 'SEF-02'],
        capabilities: { light: 80, dark: 85, security: 90, legal: 35, technology: 88, business: 40 },
        radarData: [
            { dimension: 'SOC 运营', value: 95 },
            { dimension: 'SIEM/SOAR', value: 90 },
            { dimension: '事件响应', value: 88 },
            { dimension: '威胁狩猎', value: 82 },
            { dimension: '安全监控', value: 92 },
            { dimension: '合规管理', value: 50 },
        ],
    },
    'supply-chain-security': {
        scfControls: ['TPM-01', 'TPM-02', 'TPM-03', 'TVM-03', 'GOV-02', 'SEF-03'],
        capabilities: { light: 75, dark: 65, security: 80, legal: 55, technology: 75, business: 70 },
        radarData: [
            { dimension: '供应商评估', value: 92 },
            { dimension: 'SBOM 管理', value: 88 },
            { dimension: '第三方风险', value: 85 },
            { dimension: '合同审查', value: 75 },
            { dimension: '合规跟踪', value: 80 },
            { dimension: '技术架构', value: 65 },
        ],
    },
};
const CAPABILITY_LABELS = {
    light: { label: 'Light 能力', color: '#3b82f6' },
    dark: { label: 'Dark 能力', color: '#ef4444' },
    security: { label: 'Security', color: '#22c55e' },
    legal: { label: 'Legal', color: '#a78bfa' },
    technology: { label: 'Technology', color: '#06b6d4' },
    business: { label: 'Business', color: '#f59e0b' },
};
// ── Component ──
export const AIExpertsPage = () => {
    const currentRole = useRoleContextStore((s) => s.currentRole);
    const theme = currentRole ? ROLE_THEMES[currentRole] : null;
    const accentColor = theme?.colors.primary ?? '#1e40af';
    const [selectedRole, setSelectedRole] = useState('security-expert');
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState([]);
    const roleTheme = ROLE_THEMES[selectedRole];
    const roleDetail = MOCK_ROLE_DETAILS[selectedRole];
    const handleSendChat = () => {
        if (!chatInput.trim())
            return;
        setChatMessages((prev) => [
            ...prev,
            { role: 'user', content: chatInput.trim() },
            { role: 'ai', content: `我是${roleTheme.nameCn}，正在为您分析中...（模拟回复）` },
        ]);
        setChatInput('');
    };
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-white", children: "\uD83E\uDD16 AI \u5B89\u5168\u4E13\u5BB6\u56E2\u961F" }), _jsx("p", { className: "text-sm text-white/40 mt-0.5", children: "8 \u4F4D AI \u5B89\u5168\u4E13\u5BB6\uFF0C\u8986\u76D6\u5168\u65B9\u4F4D\u5B89\u5168\u9886\u57DF" })] }), _jsx("div", { className: "grid grid-cols-4 gap-3", children: ALL_ROLE_IDS.map((roleId) => {
                    const rt = ROLE_THEMES[roleId];
                    const isSelected = selectedRole === roleId;
                    return (_jsx(Card, { className: `cursor-pointer transition-all ${isSelected
                            ? 'bg-[#0f1525] border-2'
                            : 'bg-[#0f1525] border border-[#1e293b] hover:border-white/20'}`, style: isSelected ? { borderColor: rt.colors.primary } : undefined, onClick: () => setSelectedRole(roleId), children: _jsxs(CardContent, { className: "p-4 text-center", children: [_jsx("span", { className: "text-3xl", children: rt.icon }), _jsx("div", { className: "text-sm font-semibold text-white mt-2", children: rt.nameCn }), _jsx("div", { className: "text-[10px] text-white/40", children: rt.name }), _jsx("p", { className: "text-[10px] text-white/30 mt-1.5 leading-relaxed", children: rt.description })] }) }, roleId));
                }) }), _jsxs("div", { className: "grid grid-cols-[1fr_1fr] gap-4", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { className: "bg-[#0f1525] border border-[#1e293b]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm text-white/70 flex items-center gap-2", children: [_jsx("span", { className: "text-xl", children: roleTheme.icon }), roleTheme.name, " \u2014 \u80FD\u529B\u96F7\u8FBE"] }) }), _jsx(CardContent, { className: "flex justify-center", children: _jsx(ExpertiseRadar, { data: roleDetail.radarData, fillColor: `${roleTheme.colors.primary}40`, strokeColor: roleTheme.colors.secondary, size: 280 }) })] }), _jsxs(Card, { className: "bg-[#0f1525] border border-[#1e293b]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm text-white/70", children: "MITRE ATT&CK \u8986\u76D6" }) }), _jsx(CardContent, { children: _jsx(MitreHeatmap, { accentColor: roleTheme.colors.primary }) })] })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { className: "bg-[#0f1525] border border-[#1e293b]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm text-white/70", children: "\u516D\u7EF4\u80FD\u529B\u8BC4\u4F30" }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: Object.keys(CAPABILITY_LABELS).map((key) => {
                                                const meta = CAPABILITY_LABELS[key];
                                                const value = roleDetail.capabilities[key];
                                                return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("span", { className: "text-xs text-white/60", children: meta.label }), _jsxs("span", { className: "text-xs font-mono", style: { color: meta.color }, children: [value, "%"] })] }), _jsx("div", { className: "h-1.5 bg-white/[0.06] rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all", style: { width: `${value}%`, backgroundColor: meta.color } }) })] }, key));
                                            }) }) })] }), _jsxs(Card, { className: "bg-[#0f1525] border border-[#1e293b]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm text-white/70", children: "SCF \u63A7\u5236\u8986\u76D6" }) }), _jsx(CardContent, { children: _jsx("div", { className: "flex flex-wrap gap-2", children: roleDetail.scfControls.map((ctrl) => (_jsx(Badge, { variant: "outline", className: "text-[10px] border-white/10 text-white/50", children: ctrl }, ctrl))) }) })] }), _jsxs(Card, { className: "bg-[#0f1525] border border-[#1e293b]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs(CardTitle, { className: "text-sm text-white/70", children: ["\uD83D\uDCAC \u4E0E ", roleTheme.nameCn, " \u5BF9\u8BDD"] }) }), _jsxs(CardContent, { children: [_jsx(ScrollArea, { className: "h-40 mb-3", children: chatMessages.length === 0 ? (_jsxs("div", { className: "flex items-center justify-center h-full text-xs text-white/20", children: ["\u5411 ", roleTheme.nameCn, " \u63D0\u95EE\u4EFB\u4F55\u5B89\u5168\u95EE\u9898"] })) : (_jsx("div", { className: "space-y-2", children: chatMessages.map((msg, i) => (_jsx("div", { className: `text-xs p-2 rounded-lg ${msg.role === 'user'
                                                            ? 'bg-blue-600/15 text-white/70 ml-6'
                                                            : 'bg-white/[0.04] text-white/60 mr-6'}`, children: msg.content }, i))) })) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { value: chatInput, onChange: (e) => setChatInput(e.target.value), onKeyDown: (e) => e.key === 'Enter' && handleSendChat(), placeholder: `向 ${roleTheme.nameCn} 提问...`, className: "flex-1 bg-white/[0.05] border-white/10 text-white text-xs placeholder:text-white/25" }), _jsx(Button, { size: "sm", className: "text-xs px-4", style: { backgroundColor: accentColor }, onClick: handleSendChat, children: "\u53D1\u9001" })] })] })] })] })] })] }));
};
export default AIExpertsPage;
//# sourceMappingURL=AIExpertsPage.js.map