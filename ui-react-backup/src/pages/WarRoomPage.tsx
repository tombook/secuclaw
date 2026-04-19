/**
 * SecuClaw War Room Page — Incident Command Center
 *
 * Split-panel layout: left incident details + right collaboration.
 * Includes RACI matrix, live discussion, timeline, and quick actions.
 */

import React, { useState } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES, ALL_ROLE_IDS, type RoleId } from '@/config/role-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// ── Types ──

type RaciRole = 'R' | 'A' | 'C' | 'I';
type IocType = 'IP' | 'Domain' | 'Hash' | 'Email' | 'URL';

interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  time: string;
  isMe?: boolean;
}

// ── Mock Data ──

const MOCK_INCIDENT = {
  id: 'INC-2024-001',
  title: 'SQL 注入攻击导致数据泄露',
  severity: 'critical' as const,
  description:
    '检测到针对客户管理系统的 SQL 注入攻击，初步判断已获取部分客户数据。攻击源 IP 来自境外代理。WAF 已拦截后续请求，正在溯源分析。',
  iocs: [
    { type: 'IP' as IocType, value: '103.24.77.xx' },
    { type: 'URL' as IocType, value: '/api/users?id=1 OR 1=1' },
    { type: 'Hash' as IocType, value: 'a1b2c3d4e5f6...' },
    { type: 'Email' as IocType, value: 'attacker@proton.me' },
    { type: 'Domain' as IocType, value: 'c2.evil-domain.com' },
  ],
};

const MOCK_RACI: Record<RoleId, RaciRole> = {
  'security-expert': 'R',
  'privacy-officer': 'C',
  'security-architect': 'C',
  'business-security-officer': 'I',
  'secuclaw-commander': 'A',
  ciso: 'I',
  'security-ops': 'R',
  'supply-chain-security': 'I',
};

const RACI_COLORS: Record<RaciRole, string> = {
  R: '#3b82f6',
  A: '#ef4444',
  C: '#22c55e',
  I: '#f59e0b',
};

const RACI_LABELS: Record<RaciRole, string> = {
  R: '执行',
  A: '负责',
  C: '咨询',
  I: '知会',
};

const MOCK_CHAT: ChatMessage[] = [
  { id: '1', sender: '安全指挥官', avatar: '🎯', content: '已启动作战室，所有人请注意 RACI 分工', time: '08:16' },
  { id: '2', sender: '安全专家', avatar: '🛡️', content: '正在分析 SQL 注入 payload，初步判断为自动化工具 sqlmap', time: '08:18' },
  { id: '3', sender: '安全运营', avatar: '⚙️', content: 'WAF 规则已更新，IP 已封禁。日志已导出', time: '08:20' },
  { id: '4', sender: '隐私官', avatar: '🔐', content: '涉及客户数据，需要评估 GDPR 合规影响', time: '08:22' },
  { id: '5', sender: '安全架构师', avatar: '🏗️', content: '建议启用数据库审计日志，排查横向移动', time: '08:25' },
  { id: '6', sender: '安全指挥官', avatar: '🎯', content: '好的，安全专家继续取证，运营团队保持监控', time: '08:28' },
];

const MOCK_TIMELINE = [
  { time: '08:15', event: 'WAF 触发 SQL 注入告警', status: 'done' },
  { time: '08:16', event: '启动应急响应流程', status: 'done' },
  { time: '08:18', event: '安全团队开始调查', status: 'done' },
  { time: '08:20', event: 'WAF 规则更新 + IP 封禁', status: 'done' },
  { time: '08:30', event: '确认数据泄露范围', status: 'active' },
  { time: '09:00', event: '完成取证分析', status: 'pending' },
  { time: '09:30', event: '提交初步报告', status: 'pending' },
  { time: '10:00', event: '漏洞修复验证', status: 'pending' },
];

// ── Component ──

export const WarRoomPage: React.FC = () => {
  const currentRole = useRoleContextStore((s) => s.currentRole);
  const theme = currentRole ? ROLE_THEMES[currentRole] : null;
  const accentColor = theme?.colors.primary ?? '#1e40af';

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(MOCK_CHAT);
  const [chatInput, setChatInput] = useState('');
  const [expertDialogOpen, setExpertDialogOpen] = useState(false);
  const [selectedExperts, setSelectedExperts] = useState<Set<RoleId>>(new Set());

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        sender: '我',
        avatar: '👤',
        content: chatInput.trim(),
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
      },
    ]);
    setChatInput('');
  };

  const toggleExpert = (roleId: RoleId) => {
    setSelectedExperts((prev) => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* ── Left Panel: Incident Details ── */}
      <div className="w-[480px] flex-shrink-0 space-y-4 overflow-y-auto pr-2">
        {/* Header */}
        <Card className="bg-[#0f1525] border border-[#1e293b]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="critical" className="text-[10px]">严重</Badge>
              <span className="text-xs text-white/30 font-mono">{MOCK_INCIDENT.id}</span>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">{MOCK_INCIDENT.title}</h2>
            <p className="text-xs text-white/50 leading-relaxed">{MOCK_INCIDENT.description}</p>
          </CardContent>
        </Card>

        {/* IOC List */}
        <Card className="bg-[#0f1525] border border-[#1e293b]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">IOC 指标</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {MOCK_INCIDENT.iocs.map((ioc, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/[0.06]"
                >
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-white/10 text-white/50">
                    {ioc.type}
                  </Badge>
                  <span className="text-xs text-white/60 font-mono">{ioc.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* RACI Matrix */}
        <Card className="bg-[#0f1525] border border-[#1e293b]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">RACI 矩阵</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ROLE_IDS.map((roleId) => {
                const raciRole = MOCK_RACI[roleId];
                const roleTheme = ROLE_THEMES[roleId];
                return (
                  <div
                    key={roleId}
                    className="flex items-center gap-2 p-2 rounded-md bg-white/[0.02] border border-white/[0.04]"
                  >
                    <span className="text-sm">{roleTheme.icon}</span>
                    <span className="text-xs text-white/60 flex-1 truncate">{roleTheme.nameCn}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        color: RACI_COLORS[raciRole],
                        backgroundColor: `${RACI_COLORS[raciRole]}15`,
                      }}
                    >
                      {raciRole} · {RACI_LABELS[raciRole]}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-[#0f1525] border border-[#1e293b]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">快速操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '🔒 隔离主机', color: '#ef4444' },
                { label: '🚫 封禁 IP', color: '#f97316' },
                { label: '⬆️ 升级事件', color: '#3b82f6' },
                { label: '🔍 取证分析', color: '#22c55e' },
              ].map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="text-xs justify-start border-white/10 hover:bg-white/[0.04]"
                  style={{ borderLeftColor: action.color, borderLeftWidth: '3px' }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
            <Button
              className="w-full mt-3 text-xs"
              style={{ backgroundColor: accentColor }}
              onClick={() => setExpertDialogOpen(true)}
            >
              🩺 请求专家会诊
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ── Right Panel: Collaboration ── */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Chat Area */}
        <Card className="bg-[#0f1525] border border-[#1e293b] flex-1 flex flex-col min-h-0">
          <CardHeader className="pb-2 border-b border-white/[0.06]">
            <CardTitle className="text-sm text-white/70">💬 实时讨论</CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.isMe ? 'flex-row-reverse' : ''}`}
                >
                  <span className="text-lg flex-shrink-0">{msg.avatar}</span>
                  <div
                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                      msg.isMe
                        ? 'bg-blue-600/20 border border-blue-500/20'
                        : 'bg-white/[0.04] border border-white/[0.06]'
                    }`}
                  >
                    {!msg.isMe && (
                      <div className="text-[10px] text-white/40 mb-1">{msg.sender}</div>
                    )}
                    <div className="text-xs text-white/80">{msg.content}</div>
                    <div className={`text-[9px] text-white/25 mt-1 ${msg.isMe ? 'text-right' : ''}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="p-3 border-t border-white/[0.06]">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                placeholder="输入消息..."
                className="flex-1 bg-white/[0.05] border-white/10 text-white text-xs placeholder:text-white/25"
              />
              <Button size="sm" className="text-xs px-4" style={{ backgroundColor: accentColor }} onClick={handleSendChat}>
                发送
              </Button>
            </div>
          </div>
        </Card>

        {/* Timeline */}
        <Card className="bg-[#0f1525] border border-[#1e293b]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white/70">📋 处置时间线</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-0 overflow-x-auto pb-2">
              {MOCK_TIMELINE.map((item, i) => (
                <div key={i} className="flex items-center min-w-[140px]">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full border-2 ${
                        item.status === 'done'
                          ? 'bg-green-500 border-green-500'
                          : item.status === 'active'
                          ? 'bg-blue-500 border-blue-500 animate-pulse'
                          : 'bg-transparent border-white/20'
                      }`}
                    />
                    {i < MOCK_TIMELINE.length - 1 && (
                      <div
                        className={`w-0.5 h-6 ${
                          item.status === 'done' ? 'bg-green-500/50' : 'bg-white/10'
                        }`}
                      />
                    )}
                  </div>
                  <div className="ml-2">
                    <div className="text-[10px] text-white/30">{item.time}</div>
                    <div className={`text-xs ${item.status === 'pending' ? 'text-white/30' : 'text-white/70'}`}>
                      {item.event}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Expert Consultation Dialog ── */}
      <Dialog open={expertDialogOpen} onOpenChange={setExpertDialogOpen}>
        <DialogContent className="bg-[#0f1525] border-white/10 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">🩺 请求专家会诊</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-xs text-white/40 mb-3">选择需要参与会诊的 AI 专家：</p>
            <div className="grid grid-cols-2 gap-2">
              {ALL_ROLE_IDS.map((roleId) => {
                const roleTheme = ROLE_THEMES[roleId];
                const isSelected = selectedExperts.has(roleId);
                return (
                  <button
                    key={roleId}
                    onClick={() => toggleExpert(roleId)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500/30'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                    }`}
                  >
                    <span className="text-lg">{roleTheme.icon}</span>
                    <span className="text-xs text-white/70">{roleTheme.nameCn}</span>
                    {isSelected && <span className="ml-auto text-blue-400 text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-xs text-white/50" onClick={() => setExpertDialogOpen(false)}>
              取消
            </Button>
            <Button
              className="text-xs"
              style={{ backgroundColor: accentColor }}
              onClick={() => {
                setExpertDialogOpen(false);
                setSelectedExperts(new Set());
              }}
            >
              发起会诊（{selectedExperts.size} 位专家）
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WarRoomPage;
