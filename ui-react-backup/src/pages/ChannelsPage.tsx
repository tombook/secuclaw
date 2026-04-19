/**
 * SecuClaw Channels Page
 *
 * Channel management with card grid, detail panel, and config dialog.
 */

import React, { useState } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// ── Types ──

interface Channel {
  id: string;
  name: string;
  emoji: string;
  connected: boolean;
  description: string;
  features: string[];
  configFields: { key: string; label: string; value: string; type: 'text' | 'password' }[];
}

// ── Mock Data ──

const MOCK_CHANNELS: Channel[] = [
  {
    id: 'feishu',
    name: '飞书 Lark',
    emoji: '🐦',
    connected: true,
    description: '飞书即时通讯集成，支持群聊消息推送、机器人交互、文档分享。',
    features: ['群聊消息推送', '机器人命令', '文档分享', '消息卡片', '日历集成'],
    configFields: [
      { key: 'app_id', label: 'App ID', value: 'cli_a5xxxxxx', type: 'text' },
      { key: 'app_secret', label: 'App Secret', value: '••••••••••', type: 'password' },
      { key: 'webhook', label: 'Webhook URL', value: 'https://open.feishu.cn/...', type: 'text' },
    ],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    emoji: '✈️',
    connected: true,
    description: 'Telegram Bot 集成，支持私聊/群聊消息、内联键盘、文件传输。',
    features: ['Bot 命令', '群组消息', '内联键盘', '文件传输', 'Stickers'],
    configFields: [
      { key: 'bot_token', label: 'Bot Token', value: '123456:ABC...', type: 'password' },
      { key: 'chat_id', label: 'Default Chat ID', value: '-1001234567890', type: 'text' },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    emoji: '💬',
    connected: false,
    description: 'Slack 工作空间集成，支持频道消息、Slash 命令、Block Kit。',
    features: ['频道消息', 'Slash 命令', 'Block Kit', '文件上传', 'Thread 回复'],
    configFields: [
      { key: 'bot_token', label: 'Bot Token (xoxb-)', value: '', type: 'password' },
      { key: 'signing_secret', label: 'Signing Secret', value: '', type: 'password' },
    ],
  },
  {
    id: 'discord',
    name: 'Discord',
    emoji: '🎮',
    connected: true,
    description: 'Discord 服务器集成，支持频道消息、Slash 命令、Embeds。',
    features: ['服务器消息', 'Slash 命令', 'Embeds', '文件上传', 'Reaction'],
    configFields: [
      { key: 'bot_token', label: 'Bot Token', value: 'MTIzNDU2Nz...', type: 'password' },
      { key: 'guild_id', label: 'Guild ID', value: '9876543210', type: 'text' },
      { key: 'channel_id', label: 'Channel ID', value: '1234567890', type: 'text' },
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    emoji: '📱',
    connected: false,
    description: 'WhatsApp Business API 集成，支持消息模板、媒体消息。',
    features: ['文本消息', '消息模板', '媒体消息', '位置共享'],
    configFields: [
      { key: 'phone_id', label: 'Phone Number ID', value: '', type: 'text' },
      { key: 'token', label: 'Access Token', value: '', type: 'password' },
      { key: 'verify_token', label: 'Verify Token', value: '', type: 'password' },
    ],
  },
  {
    id: 'google-chat',
    name: 'Google Chat',
    emoji: '🌐',
    connected: false,
    description: 'Google Chat 集成，支持空间消息、卡片消息。',
    features: ['空间消息', '卡片消息', '文件附件', 'Thread'],
    configFields: [
      { key: 'webhook', label: 'Webhook URL', value: '', type: 'text' },
      { key: 'service_key', label: 'Service Account Key', value: '', type: 'password' },
    ],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    emoji: '👥',
    connected: false,
    description: 'Microsoft Teams 集成，支持频道消息、自适应卡片。',
    features: ['频道消息', '自适应卡片', '文件共享', 'Meeting'],
    configFields: [
      { key: 'webhook', label: 'Webhook URL', value: '', type: 'text' },
      { key: 'tenant_id', label: 'Tenant ID', value: '', type: 'text' },
    ],
  },
  {
    id: 'signal',
    name: 'Signal',
    emoji: '🔒',
    connected: false,
    description: 'Signal 私密通讯集成，端到端加密消息。',
    features: ['加密消息', '群组消息', '文件传输'],
    configFields: [
      { key: 'phone', label: 'Phone Number', value: '', type: 'text' },
      { key: 'api_url', label: 'Signal CLI URL', value: 'http://localhost:8080', type: 'text' },
    ],
  },
  {
    id: 'imessage',
    name: 'iMessage',
    emoji: '💌',
    connected: false,
    description: 'Apple iMessage 集成（macOS BlueBubbles）。',
    features: ['iMessage', '群聊', '附件'],
    configFields: [
      { key: 'server_url', label: 'BlueBubbles URL', value: '', type: 'text' },
      { key: 'password', label: 'Password', value: '', type: 'password' },
    ],
  },
  {
    id: 'nostr',
    name: 'Nostr',
    emoji: '⚡',
    connected: false,
    description: 'Nostr 去中心化社交协议集成。',
    features: ['Notes', 'DM', 'Relay 管理', 'Zaps'],
    configFields: [
      { key: 'nsec', label: 'Private Key (nsec)', value: '', type: 'password' },
      { key: 'relays', label: 'Relays (逗号分隔)', value: 'wss://relay.damus.io', type: 'text' },
    ],
  },
];

// ── Component ──

export const ChannelsPage: React.FC = () => {
  const currentRole = useRoleContextStore((s) => s.currentRole);
  const theme = currentRole ? ROLE_THEMES[currentRole] : null;
  const accentColor = theme?.colors.primary ?? '#1e40af';

  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [configChannel, setConfigChannel] = useState<Channel | null>(null);
  const [testSending, setTestSending] = useState<string | null>(null);

  const connectedCount = MOCK_CHANNELS.filter((c) => c.connected).length;

  const handleTestMessage = (channelId: string) => {
    setTestSending(channelId);
    setTimeout(() => setTestSending(null), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">📡 频道管理</h1>
          <p className="text-sm text-white/40 mt-0.5">
            管理消息推送渠道 — {connectedCount}/{MOCK_CHANNELS.length} 已连接
          </p>
        </div>
      </div>

      {/* Channel Cards Grid */}
      <div className="grid grid-cols-3 gap-3">
        {MOCK_CHANNELS.map((channel) => (
          <Card
            key={channel.id}
            className={`bg-[#0f1525] border cursor-pointer transition-all ${
              selectedChannel?.id === channel.id
                ? 'border-white/20'
                : 'border-[#1e293b] hover:border-white/15'
            }`}
            onClick={() => setSelectedChannel(channel)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{channel.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">{channel.name}</div>
                </div>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: channel.connected ? '#22c55e' : '#ef4444' }}
                  title={channel.connected ? '已连接' : '未连接'}
                />
              </div>
              <p className="text-[10px] text-white/30 leading-relaxed line-clamp-2">
                {channel.description}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1.5 ${
                    channel.connected
                      ? 'border-green-500/30 text-green-400'
                      : 'border-white/10 text-white/30'
                  }`}
                >
                  {channel.connected ? '在线' : '离线'}
                </Badge>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[10px] text-white/40 hover:text-white px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfigChannel(channel);
                  }}
                >
                  ⚙️ 配置
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Channel Detail Panel */}
      {selectedChannel && (
        <Card className="bg-[#0f1525] border border-[#1e293b]">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <span className="text-4xl">{selectedChannel.emoji}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">{selectedChannel.name}</h2>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: selectedChannel.connected ? '#22c55e' : '#ef4444' }}
                  />
                </div>
                <p className="text-xs text-white/40 mt-1">{selectedChannel.description}</p>

                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-white/50 mb-2">功能特性</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedChannel.features.map((f) => (
                      <Badge key={f} variant="outline" className="text-[10px] border-white/10 text-white/50">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-white/50 mb-2">配置信息</h4>
                  <div className="space-y-1.5">
                    {selectedChannel.configFields.map((field) => (
                      <div key={field.key} className="flex items-center gap-2 text-xs">
                        <span className="text-white/30 w-28 flex-shrink-0">{field.label}</span>
                        <span className="text-white/50 font-mono text-[11px] truncate">
                          {field.type === 'password' ? '••••••••' : field.value || '(未配置)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-white/10"
                  disabled={!selectedChannel.connected}
                  onClick={() => handleTestMessage(selectedChannel.id)}
                >
                  {testSending === selectedChannel.id ? '发送中...' : '📤 发送测试消息'}
                </Button>
                <Button
                  size="sm"
                  className="text-xs"
                  style={{ backgroundColor: accentColor }}
                  onClick={() => setConfigChannel(selectedChannel)}
                >
                  ⚙️ 配置
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Config Dialog ── */}
      <Dialog open={!!configChannel} onOpenChange={(open) => !open && setConfigChannel(null)}>
        <DialogContent className="bg-[#0f1525] border-white/10 max-w-md">
          {configChannel && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <span className="text-xl">{configChannel.emoji}</span>
                  配置 {configChannel.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 py-4">
                {configChannel.configFields.map((field) => (
                  <div key={field.key}>
                    <label className="text-xs text-white/40 mb-1 block">{field.label}</label>
                    <Input
                      defaultValue={field.value}
                      type={field.type === 'password' ? 'password' : 'text'}
                      className="bg-white/[0.05] border-white/10 text-white text-xs placeholder:text-white/25"
                    />
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-white/40">启用连接</span>
                  <Switch defaultChecked={configChannel.connected} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" className="text-xs text-white/50" onClick={() => setConfigChannel(null)}>
                  取消
                </Button>
                <Button
                  className="text-xs"
                  style={{ backgroundColor: accentColor }}
                  onClick={() => setConfigChannel(null)}
                >
                  保存配置
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChannelsPage;
