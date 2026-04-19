import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * SecuClaw Settings Page
 *
 * Multi-tab settings: General, LLM Services, AI Experts, Role Management, Notifications.
 */
import React, { useState } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES, ALL_ROLE_IDS } from '@/config/role-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from '@/components/ui/dialog';
// ── Mock Data ──
const MOCK_LLM_SERVICES = [
    {
        id: 'llm-1',
        name: 'OpenAI GPT-4',
        type: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-a1b2****',
        models: ['gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'],
    },
    {
        id: 'llm-2',
        name: 'Claude 3.5',
        type: 'Anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        apiKey: 'sk-ant-c3d4****',
        models: ['claude-3-5-sonnet', 'claude-3-opus'],
    },
    {
        id: 'llm-3',
        name: 'GLM-4 Plus',
        type: 'ZhipuAI',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        apiKey: 'zhipu-e5f6****',
        models: ['glm-4-plus', 'glm-4-flash'],
    },
];
const MOCK_ROLE_LLMS = {
    'security-expert': { llmId: 'llm-1', temperature: 0.3, maxTokens: 4096 },
    'privacy-officer': { llmId: 'llm-2', temperature: 0.4, maxTokens: 4096 },
    'security-architect': { llmId: 'llm-1', temperature: 0.5, maxTokens: 8192 },
    'business-security-officer': { llmId: 'llm-3', temperature: 0.6, maxTokens: 4096 },
    'secuclaw-commander': { llmId: 'llm-1', temperature: 0.3, maxTokens: 8192 },
    ciso: { llmId: 'llm-2', temperature: 0.5, maxTokens: 4096 },
    'security-ops': { llmId: 'llm-1', temperature: 0.2, maxTokens: 4096 },
    'supply-chain-security': { llmId: 'llm-3', temperature: 0.4, maxTokens: 4096 },
};
const TIMEZONES = ['Asia/Shanghai', 'Asia/Tokyo', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'UTC'];
const NOTIFICATION_CHANNELS = ['飞书', 'Telegram', 'Slack', 'Email', 'Webhook'];
// ── Component ──
export const SettingsPage = () => {
    const currentRole = useRoleContextStore((s) => s.currentRole);
    const theme = currentRole ? ROLE_THEMES[currentRole] : null;
    const accentColor = theme?.colors.primary ?? '#1e40af';
    const [activeTab, setActiveTab] = useState('general');
    const [llmServices, setLlmServices] = useState(MOCK_LLM_SERVICES);
    const [llmDialogOpen, setLlmDialogOpen] = useState(false);
    const [editingLlm, setEditingLlm] = useState(null);
    const [roleEnabled, setRoleEnabled] = useState({
        'security-expert': true,
        'privacy-officer': true,
        'security-architect': true,
        'business-security-officer': true,
        'secuclaw-commander': true,
        ciso: true,
        'security-ops': true,
        'supply-chain-security': false,
    });
    const [alertThreshold, setAlertThreshold] = useState('medium');
    const [selectedNotifyChannels, setSelectedNotifyChannels] = useState(new Set(['飞书', 'Email']));
    const tabs = [
        { id: 'general', label: '通用', icon: '⚙️' },
        { id: 'llm', label: 'LLM 服务', icon: '🤖' },
        { id: 'experts', label: 'AI 专家', icon: '🧠' },
        { id: 'roles', label: '角色管理', icon: '👥' },
        { id: 'notifications', label: '通知', icon: '🔔' },
    ];
    const toggleNotifyChannel = (ch) => {
        setSelectedNotifyChannels((prev) => {
            const next = new Set(prev);
            if (next.has(ch))
                next.delete(ch);
            else
                next.add(ch);
            return next;
        });
    };
    // ── Tab Content ──
    const renderGeneral = () => (_jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { className: "bg-[#0f1525] border border-[#1e293b]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm text-white/70", children: "\u8BED\u8A00" }) }), _jsx(CardContent, { children: _jsxs(Select, { defaultValue: "zh-CN", children: [_jsx(SelectTrigger, { className: "w-64 bg-white/[0.05] border-white/10 text-white text-xs", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { className: "bg-[#0f1525] border-white/10", children: [_jsx(SelectItem, { value: "zh-CN", className: "text-xs", children: "\u7B80\u4F53\u4E2D\u6587" }), _jsx(SelectItem, { value: "en-US", className: "text-xs", children: "English (US)" }), _jsx(SelectItem, { value: "ja-JP", className: "text-xs", children: "\u65E5\u672C\u8A9E" })] })] }) })] }), _jsxs(Card, { className: "bg-[#0f1525] border border-[#1e293b]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm text-white/70", children: "\u4E3B\u9898" }) }), _jsx(CardContent, { children: _jsxs("div", { className: "flex items-center justify-between w-64", children: [_jsx("span", { className: "text-xs text-white/50", children: "\u6DF1\u8272\u6A21\u5F0F" }), _jsx(Switch, { defaultChecked: true })] }) })] }), _jsxs(Card, { className: "bg-[#0f1525] border border-[#1e293b]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm text-white/70", children: "\u65F6\u533A" }) }), _jsx(CardContent, { children: _jsxs(Select, { defaultValue: "Asia/Shanghai", children: [_jsx(SelectTrigger, { className: "w-64 bg-white/[0.05] border-white/10 text-white text-xs", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { className: "bg-[#0f1525] border-white/10", children: TIMEZONES.map((tz) => (_jsx(SelectItem, { value: tz, className: "text-xs", children: tz }, tz))) })] }) })] })] }));
    const renderLlm = () => (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-semibold text-white/70", children: "LLM \u670D\u52A1\u5546" }), _jsx(Button, { size: "sm", className: "text-xs", style: { backgroundColor: accentColor }, onClick: () => { setEditingLlm(null); setLlmDialogOpen(true); }, children: "+ \u6DFB\u52A0\u670D\u52A1\u5546" })] }), _jsxs(Card, { className: "bg-[#0f1525] border border-[#1e293b] overflow-hidden", children: [_jsxs("div", { className: "grid grid-cols-[1fr_100px_180px_120px_100px] gap-3 px-4 py-2.5 border-b border-white/[0.06] text-[10px] font-semibold text-white/40 uppercase", children: [_jsx("span", { children: "\u540D\u79F0" }), _jsx("span", { children: "\u7C7B\u578B" }), _jsx("span", { children: "Base URL" }), _jsx("span", { children: "API Key" }), _jsx("span", { children: "\u64CD\u4F5C" })] }), llmServices.map((svc) => (_jsxs("div", { className: "grid grid-cols-[1fr_100px_180px_120px_100px] gap-3 px-4 py-3 border-b border-white/[0.03] items-center", children: [_jsx("span", { className: "text-xs font-medium text-white", children: svc.name }), _jsx(Badge, { variant: "outline", className: "text-[10px] border-white/10 text-white/50 w-fit", children: svc.type }), _jsx("span", { className: "text-[11px] text-white/40 font-mono truncate", children: svc.baseUrl }), _jsx("span", { className: "text-[11px] text-white/30 font-mono", children: svc.apiKey }), _jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { variant: "ghost", size: "sm", className: "text-[10px] text-white/40 hover:text-white px-1.5", onClick: () => { setEditingLlm(svc); setLlmDialogOpen(true); }, children: "\u7F16\u8F91" }), _jsx(Button, { variant: "ghost", size: "sm", className: "text-[10px] text-red-400/60 hover:text-red-400 px-1.5", onClick: () => setLlmServices((prev) => prev.filter((s) => s.id !== svc.id)), children: "\u5220\u9664" })] })] }, svc.id)))] }), _jsx(Dialog, { open: llmDialogOpen, onOpenChange: setLlmDialogOpen, children: _jsxs(DialogContent, { className: "bg-[#0f1525] border-white/10 max-w-md", children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { className: "text-white", children: [editingLlm ? '编辑' : '添加', " LLM \u670D\u52A1"] }) }), _jsxs("div", { className: "space-y-3 py-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-white/40 mb-1 block", children: "\u540D\u79F0" }), _jsx(Input, { defaultValue: editingLlm?.name ?? '', className: "bg-white/[0.05] border-white/10 text-white text-xs" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-white/40 mb-1 block", children: "\u7C7B\u578B" }), _jsxs(Select, { defaultValue: editingLlm?.type ?? 'OpenAI', children: [_jsx(SelectTrigger, { className: "bg-white/[0.05] border-white/10 text-white text-xs", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { className: "bg-[#0f1525] border-white/10", children: [_jsx(SelectItem, { value: "OpenAI", className: "text-xs", children: "OpenAI" }), _jsx(SelectItem, { value: "Anthropic", className: "text-xs", children: "Anthropic" }), _jsx(SelectItem, { value: "ZhipuAI", className: "text-xs", children: "ZhipuAI" }), _jsx(SelectItem, { value: "Azure", className: "text-xs", children: "Azure OpenAI" }), _jsx(SelectItem, { value: "Custom", className: "text-xs", children: "Custom / Ollama" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-white/40 mb-1 block", children: "Base URL" }), _jsx(Input, { defaultValue: editingLlm?.baseUrl ?? '', className: "bg-white/[0.05] border-white/10 text-white text-xs" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-white/40 mb-1 block", children: "API Key" }), _jsx(Input, { type: "password", defaultValue: editingLlm?.apiKey ?? '', className: "bg-white/[0.05] border-white/10 text-white text-xs" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-white/40 mb-1 block", children: "\u6A21\u578B\u5217\u8868\uFF08\u9017\u53F7\u5206\u9694\uFF09" }), _jsx(Input, { defaultValue: editingLlm?.models?.join(', ') ?? '', className: "bg-white/[0.05] border-white/10 text-white text-xs" })] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "ghost", className: "text-xs text-white/50", onClick: () => setLlmDialogOpen(false), children: "\u53D6\u6D88" }), _jsx(Button, { className: "text-xs", style: { backgroundColor: accentColor }, onClick: () => setLlmDialogOpen(false), children: "\u4FDD\u5B58" })] })] }) })] }));
    const renderExperts = () => (_jsx("div", { className: "space-y-3", children: ALL_ROLE_IDS.map((roleId) => {
            const rt = ROLE_THEMES[roleId];
            const config = MOCK_ROLE_LLMS[roleId];
            return (_jsx(Card, { className: "bg-[#0f1525] border border-[#1e293b]", children: _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center gap-3 mb-3", children: [_jsx("span", { className: "text-xl", children: rt.icon }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold text-white", children: rt.nameCn }), _jsx("div", { className: "text-[10px] text-white/30", children: rt.name })] })] }), _jsxs("div", { className: "grid grid-cols-3 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[10px] text-white/40 mb-1 block", children: "LLM \u670D\u52A1" }), _jsxs(Select, { defaultValue: config.llmId, children: [_jsx(SelectTrigger, { className: "bg-white/[0.05] border-white/10 text-white text-xs", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { className: "bg-[#0f1525] border-white/10", children: llmServices.map((s) => (_jsx(SelectItem, { value: s.id, className: "text-xs", children: s.name }, s.id))) })] })] }), _jsxs("div", { children: [_jsxs("label", { className: "text-[10px] text-white/40 mb-1 block", children: ["Temperature: ", config.temperature] }), _jsx("input", { type: "range", min: "0", max: "1", step: "0.1", defaultValue: config.temperature, className: "w-full h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[10px] text-white/40 mb-1 block", children: "Max Tokens" }), _jsx(Input, { type: "number", defaultValue: config.maxTokens, className: "bg-white/[0.05] border-white/10 text-white text-xs" })] })] })] }) }, roleId));
        }) }));
    const renderRoles = () => (_jsx("div", { className: "grid grid-cols-2 gap-3", children: ALL_ROLE_IDS.map((roleId) => {
            const rt = ROLE_THEMES[roleId];
            const enabled = roleEnabled[roleId];
            return (_jsx(Card, { className: "bg-[#0f1525] border border-[#1e293b]", children: _jsxs(CardContent, { className: "p-4 flex items-center gap-4", children: [_jsx("span", { className: "text-2xl", children: rt.icon }), _jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "text-sm font-semibold text-white", children: rt.nameCn }), _jsx("div", { className: "text-[10px] text-white/30", children: rt.description })] }), _jsx(Switch, { checked: enabled, onCheckedChange: (checked) => setRoleEnabled((prev) => ({ ...prev, [roleId]: checked })) })] }) }, roleId));
        }) }));
    const renderNotifications = () => (_jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { className: "bg-[#0f1525] border border-[#1e293b]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm text-white/70", children: "\u544A\u8B66\u7EA7\u522B\u9608\u503C" }) }), _jsxs(CardContent, { children: [_jsxs(Select, { value: alertThreshold, onValueChange: setAlertThreshold, children: [_jsx(SelectTrigger, { className: "w-64 bg-white/[0.05] border-white/10 text-white text-xs", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { className: "bg-[#0f1525] border-white/10", children: [_jsx(SelectItem, { value: "critical", className: "text-xs", children: "\uD83D\uDD34 \u4EC5\u4E25\u91CD" }), _jsx(SelectItem, { value: "high", className: "text-xs", children: "\uD83D\uDFE0 \u9AD8\u5371\u53CA\u4EE5\u4E0A" }), _jsx(SelectItem, { value: "medium", className: "text-xs", children: "\uD83D\uDFE1 \u4E2D\u5371\u53CA\u4EE5\u4E0A" }), _jsx(SelectItem, { value: "low", className: "text-xs", children: "\uD83D\uDFE2 \u6240\u6709\u544A\u8B66" })] })] }), _jsx("p", { className: "text-[10px] text-white/25 mt-2", children: "\u4F4E\u4E8E\u6B64\u7EA7\u522B\u7684\u544A\u8B66\u4E0D\u4F1A\u89E6\u53D1\u63A8\u9001\u901A\u77E5" })] })] }), _jsxs(Card, { className: "bg-[#0f1525] border border-[#1e293b]", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm text-white/70", children: "\u901A\u77E5\u6E20\u9053" }) }), _jsx(CardContent, { children: _jsx("div", { className: "flex flex-wrap gap-2", children: NOTIFICATION_CHANNELS.map((ch) => {
                                const selected = selectedNotifyChannels.has(ch);
                                return (_jsxs("button", { className: `px-3 py-1.5 rounded-md text-xs transition-colors ${selected
                                        ? 'text-white font-medium'
                                        : 'text-white/40 bg-white/[0.03] hover:text-white/60'}`, style: selected
                                        ? { backgroundColor: `${accentColor}30`, border: `1px solid ${accentColor}50` }
                                        : { border: '1px solid rgba(255,255,255,0.06)' }, onClick: () => toggleNotifyChannel(ch), children: [ch, " ", selected && '✓'] }, ch));
                            }) }) })] })] }));
    const TAB_CONTENT = {
        general: renderGeneral,
        llm: renderLlm,
        experts: renderExperts,
        roles: renderRoles,
        notifications: renderNotifications,
    };
    return (_jsxs("div", { className: "flex gap-6 h-[calc(100vh-8rem)]", children: [_jsx("div", { className: "w-48 flex-shrink-0 space-y-1", children: tabs.map((tab) => (_jsxs("button", { className: `w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex items-center gap-2 ${activeTab === tab.id
                        ? 'text-white font-medium'
                        : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'}`, style: activeTab === tab.id ? { backgroundColor: `${accentColor}20` } : undefined, onClick: () => setActiveTab(tab.id), children: [_jsx("span", { children: tab.icon }), tab.label] }, tab.id))) }), _jsxs("div", { className: "flex-1 overflow-y-auto", children: [_jsxs("h2", { className: "text-lg font-bold text-white mb-4", children: [tabs.find((t) => t.id === activeTab)?.icon, ' ', tabs.find((t) => t.id === activeTab)?.label] }), TAB_CONTENT[activeTab]()] })] }));
};
export default SettingsPage;
//# sourceMappingURL=SettingsPage.js.map