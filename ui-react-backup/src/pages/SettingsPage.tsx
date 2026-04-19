/**
 * SecuClaw Settings Page
 *
 * Multi-tab settings: General, LLM Services, AI Experts, Role Management, Notifications.
 */

import React, { useState } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES, ALL_ROLE_IDS, type RoleId } from '@/config/role-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// ── Types ──

interface LlmService {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
}

// ── Mock Data ──

const MOCK_LLM_SERVICES: LlmService[] = [
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

const MOCK_ROLE_LLMS: Record<RoleId, { llmId: string; temperature: number; maxTokens: number }> = {
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

type SettingsTab = 'general' | 'llm' | 'experts' | 'roles' | 'notifications';

// ── Component ──

export const SettingsPage: React.FC = () => {
  const currentRole = useRoleContextStore((s) => s.currentRole);
  const theme = currentRole ? ROLE_THEMES[currentRole] : null;
  const accentColor = theme?.colors.primary ?? '#1e40af';

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [llmServices, setLlmServices] = useState(MOCK_LLM_SERVICES);
  const [llmDialogOpen, setLlmDialogOpen] = useState(false);
  const [editingLlm, setEditingLlm] = useState<LlmService | null>(null);
  const [roleEnabled, setRoleEnabled] = useState<Record<RoleId, boolean>>({
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
  const [selectedNotifyChannels, setSelectedNotifyChannels] = useState<Set<string>>(new Set(['飞书', 'Email']));

  const tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'general', label: '通用', icon: '⚙️' },
    { id: 'llm', label: 'LLM 服务', icon: '🤖' },
    { id: 'experts', label: 'AI 专家', icon: '🧠' },
    { id: 'roles', label: '角色管理', icon: '👥' },
    { id: 'notifications', label: '通知', icon: '🔔' },
  ];

  const toggleNotifyChannel = (ch: string) => {
    setSelectedNotifyChannels((prev) => {
      const next = new Set(prev);
      if (next.has(ch)) next.delete(ch);
      else next.add(ch);
      return next;
    });
  };

  // ── Tab Content ──

  const renderGeneral = () => (
    <div className="space-y-4">
      <Card className="bg-[#0f1525] border border-[#1e293b]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white/70">语言</CardTitle></CardHeader>
        <CardContent>
          <Select defaultValue="zh-CN">
            <SelectTrigger className="w-64 bg-white/[0.05] border-white/10 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0f1525] border-white/10">
              <SelectItem value="zh-CN" className="text-xs">简体中文</SelectItem>
              <SelectItem value="en-US" className="text-xs">English (US)</SelectItem>
              <SelectItem value="ja-JP" className="text-xs">日本語</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="bg-[#0f1525] border border-[#1e293b]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white/70">主题</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between w-64">
            <span className="text-xs text-white/50">深色模式</span>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-[#0f1525] border border-[#1e293b]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white/70">时区</CardTitle></CardHeader>
        <CardContent>
          <Select defaultValue="Asia/Shanghai">
            <SelectTrigger className="w-64 bg-white/[0.05] border-white/10 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0f1525] border-white/10">
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz} className="text-xs">{tz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );

  const renderLlm = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/70">LLM 服务商</h3>
        <Button
          size="sm"
          className="text-xs"
          style={{ backgroundColor: accentColor }}
          onClick={() => { setEditingLlm(null); setLlmDialogOpen(true); }}
        >
          + 添加服务商
        </Button>
      </div>

      <Card className="bg-[#0f1525] border border-[#1e293b] overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_100px_180px_120px_100px] gap-3 px-4 py-2.5 border-b border-white/[0.06] text-[10px] font-semibold text-white/40 uppercase">
          <span>名称</span>
          <span>类型</span>
          <span>Base URL</span>
          <span>API Key</span>
          <span>操作</span>
        </div>
        {llmServices.map((svc) => (
          <div
            key={svc.id}
            className="grid grid-cols-[1fr_100px_180px_120px_100px] gap-3 px-4 py-3 border-b border-white/[0.03] items-center"
          >
            <span className="text-xs font-medium text-white">{svc.name}</span>
            <Badge variant="outline" className="text-[10px] border-white/10 text-white/50 w-fit">{svc.type}</Badge>
            <span className="text-[11px] text-white/40 font-mono truncate">{svc.baseUrl}</span>
            <span className="text-[11px] text-white/30 font-mono">{svc.apiKey}</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] text-white/40 hover:text-white px-1.5"
                onClick={() => { setEditingLlm(svc); setLlmDialogOpen(true); }}
              >
                编辑
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-[10px] text-red-400/60 hover:text-red-400 px-1.5"
                onClick={() => setLlmServices((prev) => prev.filter((s) => s.id !== svc.id))}
              >
                删除
              </Button>
            </div>
          </div>
        ))}
      </Card>

      {/* LLM Edit Dialog */}
      <Dialog open={llmDialogOpen} onOpenChange={setLlmDialogOpen}>
        <DialogContent className="bg-[#0f1525] border-white/10 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingLlm ? '编辑' : '添加'} LLM 服务
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div>
              <label className="text-xs text-white/40 mb-1 block">名称</label>
              <Input defaultValue={editingLlm?.name ?? ''} className="bg-white/[0.05] border-white/10 text-white text-xs" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">类型</label>
              <Select defaultValue={editingLlm?.type ?? 'OpenAI'}>
                <SelectTrigger className="bg-white/[0.05] border-white/10 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0f1525] border-white/10">
                  <SelectItem value="OpenAI" className="text-xs">OpenAI</SelectItem>
                  <SelectItem value="Anthropic" className="text-xs">Anthropic</SelectItem>
                  <SelectItem value="ZhipuAI" className="text-xs">ZhipuAI</SelectItem>
                  <SelectItem value="Azure" className="text-xs">Azure OpenAI</SelectItem>
                  <SelectItem value="Custom" className="text-xs">Custom / Ollama</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Base URL</label>
              <Input defaultValue={editingLlm?.baseUrl ?? ''} className="bg-white/[0.05] border-white/10 text-white text-xs" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">API Key</label>
              <Input type="password" defaultValue={editingLlm?.apiKey ?? ''} className="bg-white/[0.05] border-white/10 text-white text-xs" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">模型列表（逗号分隔）</label>
              <Input defaultValue={editingLlm?.models?.join(', ') ?? ''} className="bg-white/[0.05] border-white/10 text-white text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-xs text-white/50" onClick={() => setLlmDialogOpen(false)}>取消</Button>
            <Button className="text-xs" style={{ backgroundColor: accentColor }} onClick={() => setLlmDialogOpen(false)}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderExperts = () => (
    <div className="space-y-3">
      {ALL_ROLE_IDS.map((roleId) => {
        const rt = ROLE_THEMES[roleId];
        const config = MOCK_ROLE_LLMS[roleId];
        return (
          <Card key={roleId} className="bg-[#0f1525] border border-[#1e293b]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{rt.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{rt.nameCn}</div>
                  <div className="text-[10px] text-white/30">{rt.name}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] text-white/40 mb-1 block">LLM 服务</label>
                  <Select defaultValue={config.llmId}>
                    <SelectTrigger className="bg-white/[0.05] border-white/10 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1525] border-white/10">
                      {llmServices.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] text-white/40 mb-1 block">
                    Temperature: {config.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue={config.temperature}
                    className="w-full h-1.5 bg-white/[0.06] rounded-full appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-white/40 mb-1 block">Max Tokens</label>
                  <Input
                    type="number"
                    defaultValue={config.maxTokens}
                    className="bg-white/[0.05] border-white/10 text-white text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderRoles = () => (
    <div className="grid grid-cols-2 gap-3">
      {ALL_ROLE_IDS.map((roleId) => {
        const rt = ROLE_THEMES[roleId];
        const enabled = roleEnabled[roleId];
        return (
          <Card key={roleId} className="bg-[#0f1525] border border-[#1e293b]">
            <CardContent className="p-4 flex items-center gap-4">
              <span className="text-2xl">{rt.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white">{rt.nameCn}</div>
                <div className="text-[10px] text-white/30">{rt.description}</div>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={(checked) =>
                  setRoleEnabled((prev) => ({ ...prev, [roleId]: checked }))
                }
              />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-4">
      <Card className="bg-[#0f1525] border border-[#1e293b]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white/70">告警级别阈值</CardTitle></CardHeader>
        <CardContent>
          <Select value={alertThreshold} onValueChange={setAlertThreshold}>
            <SelectTrigger className="w-64 bg-white/[0.05] border-white/10 text-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#0f1525] border-white/10">
              <SelectItem value="critical" className="text-xs">🔴 仅严重</SelectItem>
              <SelectItem value="high" className="text-xs">🟠 高危及以上</SelectItem>
              <SelectItem value="medium" className="text-xs">🟡 中危及以上</SelectItem>
              <SelectItem value="low" className="text-xs">🟢 所有告警</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-[10px] text-white/25 mt-2">低于此级别的告警不会触发推送通知</p>
        </CardContent>
      </Card>

      <Card className="bg-[#0f1525] border border-[#1e293b]">
        <CardHeader className="pb-2"><CardTitle className="text-sm text-white/70">通知渠道</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {NOTIFICATION_CHANNELS.map((ch) => {
              const selected = selectedNotifyChannels.has(ch);
              return (
                <button
                  key={ch}
                  className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                    selected
                      ? 'text-white font-medium'
                      : 'text-white/40 bg-white/[0.03] hover:text-white/60'
                  }`}
                  style={
                    selected
                      ? { backgroundColor: `${accentColor}30`, border: `1px solid ${accentColor}50` }
                      : { border: '1px solid rgba(255,255,255,0.06)' }
                  }
                  onClick={() => toggleNotifyChannel(ch)}
                >
                  {ch} {selected && '✓'}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const TAB_CONTENT: Record<SettingsTab, () => React.ReactNode> = {
    general: renderGeneral,
    llm: renderLlm,
    experts: renderExperts,
    roles: renderRoles,
    notifications: renderNotifications,
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-8rem)]">
      {/* Left Tab Nav */}
      <div className="w-48 flex-shrink-0 space-y-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'text-white font-medium'
                : 'text-white/40 hover:text-white/60 hover:bg-white/[0.03]'
            }`}
            style={activeTab === tab.id ? { backgroundColor: `${accentColor}20` } : undefined}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Right Content */}
      <div className="flex-1 overflow-y-auto">
        <h2 className="text-lg font-bold text-white mb-4">
          {tabs.find((t) => t.id === activeTab)?.icon}{' '}
          {tabs.find((t) => t.id === activeTab)?.label}
        </h2>
        {TAB_CONTENT[activeTab]()}
      </div>
    </div>
  );
};

export default SettingsPage;
