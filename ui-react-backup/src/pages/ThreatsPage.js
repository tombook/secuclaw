import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SecuClaw Threats Page
 *
 * Threat intelligence with stats, list/card view toggle,
 * threat cards with IOC/MTTI tags, and timeline view.
 */
import React, { useState } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ThreatTimeline } from '@/components/visualizations/ThreatTimeline';
// ── Mock Data ──
const MOCK_THREATS = [
    {
        id: 'T-001', name: 'APT41 DragonVoice', type: 'apt', severity: 'critical', confidence: 92,
        description: 'APT41 组织利用供应链攻击和零日漏洞进行间谍活动，针对多个亚洲国家政府和科技企业。',
        iocSummary: '12 个恶意域名, 8 个 C2 IP, 3 个恶意样本',
        mitreTechniques: ['T1190', 'T1059', 'T1566', 'T1078'],
        firstSeen: '2024-03-15', lastSeen: '2024-04-17', affectedSectors: ['政府', '科技', '金融'],
    },
    {
        id: 'T-002', name: 'LockBit 4.0 勒索家族', type: 'ransomware', severity: 'critical', confidence: 88,
        description: 'LockBit 勒索软件最新变种，采用双重勒索策略，已攻击超过 200 个目标。',
        iocSummary: '5 个泄露站点, 15 个恶意哈希',
        mitreTechniques: ['T1486', 'T1490', 'T1027', 'T1055'],
        firstSeen: '2024-02-20', lastSeen: '2024-04-16', affectedSectors: ['制造业', '医疗', '教育'],
    },
    {
        id: 'T-003', name: 'Midnight Blizzard 钓鱼活动', type: 'phishing', severity: 'high', confidence: 95,
        description: '俄罗斯关联组织发起的大规模钓鱼活动，利用 Teams 和 OAuth 应用进行初始访问。',
        iocSummary: '20+ 恶意 OAuth 应用, 5 个仿冒域名',
        mitreTechniques: ['T1566', 'T1078', 'T1114'],
        firstSeen: '2024-04-01', lastSeen: '2024-04-17', affectedSectors: ['科技', '政府'],
    },
    {
        id: 'T-004', name: 'Volt Typhoon 潜伏活动', type: 'apt', severity: 'high', confidence: 78,
        description: '中国关联 APT 组织长期潜伏于关键基础设施网络，通过 Living-off-the-Land 技术避免检测。',
        iocSummary: 'LOLBins 使用, 异常 RDP 连接模式',
        mitreTechniques: ['T1059', 'T1078', 'T1021', 'T1082'],
        firstSeen: '2023-06-01', lastSeen: '2024-04-15', affectedSectors: ['能源', '通信', '交通'],
    },
    {
        id: 'T-005', name: 'Ivanti VPN 零日利用', type: 'zero-day', severity: 'critical', confidence: 100,
        description: 'Ivanti Connect Secure 多个零日漏洞正在被大规模利用，已有国家级 APT 组织参与。',
        iocSummary: 'CVE-2024-21893, CVE-2024-21887, 已知利用 IP 列表',
        mitreTechniques: ['T1190', 'T1078', 'T1059'],
        firstSeen: '2023-12-01', lastSeen: '2024-04-17', affectedSectors: ['政府', '企业', '金融'],
    },
    {
        id: 'T-006', name: 'XDDoS 僵尸网络变种', type: 'ddos', severity: 'medium', confidence: 85,
        description: '新型 DDoS 僵尸网络，利用 Mirai 代码变种发动大规模 UDP/TCP Flood 攻击。',
        iocSummary: '3 个 C2 域名, 大量受感染 IoT 设备',
        mitreTechniques: ['T1498', 'T1499'],
        firstSeen: '2024-03-20', lastSeen: '2024-04-14', affectedSectors: ['互联网', '游戏', '电商'],
    },
    {
        id: 'T-007', name: '3CX 供应链攻击后续', type: 'supply-chain', severity: 'high', confidence: 90,
        description: '3CX 供应链攻击事件衍生的新一轮攻击活动，通过更新渠道传播恶意软件。',
        iocSummary: '恶意更新包哈希, 2 个 C2 域名',
        mitreTechniques: ['T1195', 'T1059', 'T1071'],
        firstSeen: '2024-01-15', lastSeen: '2024-04-10', affectedSectors: ['科技', '金融', '咨询'],
    },
    {
        id: 'T-008', name: 'Agent Tesla 信息窃取', type: 'malware', severity: 'medium', confidence: 82,
        description: 'Agent Tesla 间谍软件通过钓鱼邮件分发，窃取浏览器凭据、键盘记录和屏幕截图。',
        iocSummary: '钓鱼邮件附件, SMTP 外传, 4 个 C2',
        mitreTechniques: ['T1566', 'T1056', 'T1113', 'T1115'],
        firstSeen: '2024-04-05', lastSeen: '2024-04-17', affectedSectors: ['企业', '个人'],
    },
];
// ── Helpers ──
const SEVERITY_VARIANT = {
    critical: 'critical', high: 'high', medium: 'medium', low: 'low',
};
const SEVERITY_LABEL = {
    critical: '严重', high: '高危', medium: '中危', low: '低危',
};
const TYPE_LABEL = {
    apt: 'APT 组织', ransomware: '勒索软件', phishing: '钓鱼攻击',
    malware: '恶意软件', ddos: 'DDoS', 'zero-day': '零日漏洞', 'supply-chain': '供应链攻击',
};
const TYPE_ICON = {
    apt: '🏴', ransomware: '🔐', phishing: '🎣', malware: '🦠', ddos: '💥', 'zero-day': '⚡', 'supply-chain': '🔗',
};
// ── Component ──
export const ThreatsPage = () => {
    const currentRole = useRoleContextStore((s) => s.currentRole);
    const theme = currentRole ? ROLE_THEMES[currentRole] : null;
    const accentColor = theme?.colors.primary ?? '#1e40af';
    const secondaryColor = theme?.colors.secondary ?? '#3b82f6';
    const stats = {
        total: MOCK_THREATS.length,
        critical: MOCK_THREATS.filter((t) => t.severity === 'critical').length,
        high: MOCK_THREATS.filter((t) => t.severity === 'high').length,
        avgConfidence: Math.round(MOCK_THREATS.reduce((s, t) => s + t.confidence, 0) / MOCK_THREATS.length),
    };
    const timelineEvents = MOCK_THREATS.map((t) => ({
        time: t.lastSeen.slice(5),
        label: t.name,
        severity: t.severity,
    }));
    return (_jsxs("div", { className: "space-y-5", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold text-white", children: "\uD83C\uDFAF \u5A01\u80C1\u60C5\u62A5" }), _jsx("p", { className: "text-sm text-white/40 mt-0.5", children: "\u5A01\u80C1\u60C5\u62A5\u6536\u96C6\u3001\u5206\u6790\u4E0E\u8FFD\u8E2A" })] }), _jsx("div", { className: "grid grid-cols-4 gap-3", children: [
                    { label: '活跃威胁', value: stats.total, icon: '🎯', color: '#ef4444' },
                    { label: '严重威胁', value: stats.critical, icon: '🔴', color: '#dc2626' },
                    { label: '高危威胁', value: stats.high, icon: '🟠', color: '#f97316' },
                    { label: '平均置信度', value: `${stats.avgConfidence}%`, icon: '📊', color: '#3b82f6' },
                ].map((s) => (_jsx(Card, { className: "bg-[#0f1525] border-white/[0.06]", children: _jsxs(CardContent, { className: "p-3 flex items-center gap-3", children: [_jsx("span", { className: "text-xl", children: s.icon }), _jsxs("div", { children: [_jsx("div", { className: "text-xl font-bold text-white", children: s.value }), _jsx("div", { className: "text-[10px] text-white/40", children: s.label })] })] }) }, s.label))) }), _jsxs(Tabs, { defaultValue: "cards", className: "space-y-4", children: [_jsxs(TabsList, { className: "bg-[#0f1525] border border-white/[0.06]", children: [_jsx(TabsTrigger, { value: "cards", className: "text-xs data-[state=active]:bg-white/10", children: "\uD83D\uDCCB \u5361\u7247\u89C6\u56FE" }), _jsx(TabsTrigger, { value: "list", className: "text-xs data-[state=active]:bg-white/10", children: "\uD83D\uDCCA \u5217\u8868\u89C6\u56FE" }), _jsx(TabsTrigger, { value: "timeline", className: "text-xs data-[state=active]:bg-white/10", children: "\u23F1\uFE0F \u65F6\u95F4\u7EBF" })] }), _jsx(TabsContent, { value: "cards", children: _jsx("div", { className: "grid grid-cols-2 gap-4", children: MOCK_THREATS.map((threat) => (_jsx(Card, { className: "bg-[#0f1525] border-white/[0.06] hover:border-white/10 transition-colors", children: _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: TYPE_ICON[threat.type] }), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-white", children: threat.name }), _jsxs("div", { className: "text-[10px] text-white/40", children: [TYPE_LABEL[threat.type], " \u00B7 ", threat.id] })] })] }), _jsx("div", { className: "flex items-center gap-1.5", children: _jsx(Badge, { variant: SEVERITY_VARIANT[threat.severity], className: "text-[9px] px-1.5 py-0", children: SEVERITY_LABEL[threat.severity] }) })] }), _jsx("p", { className: "text-xs text-white/50 leading-relaxed line-clamp-2", children: threat.description }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between text-[10px] mb-1", children: [_jsx("span", { className: "text-white/40", children: "\u7F6E\u4FE1\u5EA6" }), _jsxs("span", { className: "text-white/60", children: [threat.confidence, "%"] })] }), _jsx("div", { className: "h-1.5 bg-white/[0.06] rounded-full overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all", style: {
                                                            width: `${threat.confidence}%`,
                                                            backgroundColor: threat.confidence > 85 ? '#22c55e' : threat.confidence > 60 ? '#eab308' : '#ef4444',
                                                        } }) })] }), _jsxs("div", { className: "text-[10px] text-white/30", children: [_jsx("span", { className: "text-white/50 font-medium", children: "IOC: " }), threat.iocSummary] }), _jsx("div", { className: "flex flex-wrap gap-1", children: threat.mitreTechniques.map((tech) => (_jsx(Badge, { variant: "outline", className: "text-[9px] px-1.5 py-0 border-white/10 text-white/40", children: tech }, tech))) }), _jsxs("div", { className: "flex items-center justify-between pt-1 border-t border-white/[0.04]", children: [_jsxs("span", { className: "text-[10px] text-white/25", children: ["\u6D3B\u8DC3: ", threat.firstSeen, " \u2192 ", threat.lastSeen] }), _jsx("div", { className: "flex gap-1", children: threat.affectedSectors.slice(0, 2).map((s) => (_jsx(Badge, { variant: "secondary", className: "text-[9px] px-1.5 py-0", children: s }, s))) })] })] }) }, threat.id))) }) }), _jsx(TabsContent, { value: "list", children: _jsxs(Card, { className: "bg-[#0f1525] border-white/[0.06] overflow-hidden", children: [_jsxs("div", { className: "grid grid-cols-[60px_1fr_100px_80px_70px_100px_120px] gap-2 px-4 py-2.5 border-b border-white/[0.06] text-[10px] font-semibold text-white/40 uppercase", children: [_jsx("span", { children: "ID" }), _jsx("span", { children: "\u540D\u79F0" }), _jsx("span", { children: "\u7C7B\u578B" }), _jsx("span", { children: "\u4E25\u91CD\u7A0B\u5EA6" }), _jsx("span", { children: "\u7F6E\u4FE1\u5EA6" }), _jsx("span", { children: "IOC \u6458\u8981" }), _jsx("span", { children: "\u6700\u8FD1\u6D3B\u52A8" })] }), MOCK_THREATS.map((t) => (_jsxs("div", { className: "grid grid-cols-[60px_1fr_100px_80px_70px_100px_120px] gap-2 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors items-center", children: [_jsx("span", { className: "text-xs text-white/50 font-mono", children: t.id }), _jsx("span", { className: "text-xs text-white font-medium truncate", children: t.name }), _jsxs("span", { className: "text-xs text-white/50", children: [TYPE_ICON[t.type], " ", TYPE_LABEL[t.type]] }), _jsx(Badge, { variant: SEVERITY_VARIANT[t.severity], className: "text-[9px] px-1.5 py-0 justify-center", children: SEVERITY_LABEL[t.severity] }), _jsxs("span", { className: "text-xs text-white/60", children: [t.confidence, "%"] }), _jsxs("span", { className: "text-[10px] text-white/40 truncate", children: [t.iocSummary.slice(0, 30), "..."] }), _jsx("span", { className: "text-[10px] text-white/30", children: t.lastSeen })] }, t.id)))] }) }), _jsx(TabsContent, { value: "timeline", children: _jsxs(Card, { className: "bg-[#0f1525] border-white/[0.06]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-xs text-white/50", children: "\u5A01\u80C1\u6D3B\u52A8\u65F6\u95F4\u7EBF" }) }), _jsx(CardContent, { children: _jsx(ThreatTimeline, { events: timelineEvents, accentColor: secondaryColor }) })] }) })] }), _jsx("button", { className: "fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg hover:scale-110 transition-transform", style: { backgroundColor: accentColor }, children: "\uD83E\uDD16" })] }));
};
export default ThreatsPage;
//# sourceMappingURL=ThreatsPage.js.map