import React, { useState } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES, ALL_ROLE_IDS } from '@/config/role-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

/* ── Types ── */
interface CollabItem {
  type: 'discussion' | 'request' | 'task';
  title: string;
  description: string;
  participants: string[]; // RoleId
  scenario: string;
  time: string;
}

/* ── Mock data ── */
const MOCK_ITEMS: CollabItem[] = [
  { type: 'discussion', title: 'Log4Shell 后续影响评估', description: '评估近期供应链漏洞对核心系统的影响范围', participants: ['security-expert', 'supply-chain-security', 'ciso'], scenario: '漏洞管理', time: '10 分钟前' },
  { type: 'request', title: '生产环境补丁窗口审批', description: '安全运营团队请求在周六凌晨 2:00-4:00 进行补丁部署', participants: ['security-ops', 'ciso', 'business-security-officer'], scenario: '漏洞管理', time: '30 分钟前' },
  { type: 'task', title: '更新零信任架构文档', description: '根据最新威胁模型更新网络分段策略文档', participants: ['security-architect', 'security-expert'], scenario: '威胁响应', time: '1 小时前' },
  { type: 'discussion', title: 'GDPR 合规差距分析', description: '讨论用户数据处理流程中的合规风险点', participants: ['privacy-officer', 'ciso', 'security-architect'], scenario: '合规审计', time: '2 小时前' },
  { type: 'request', title: '供应商安全评估请求', description: '需要对新增云服务商进行安全评估', participants: ['supply-chain-security', 'security-expert', 'ciso'], scenario: '供应链事件', time: '3 小时前' },
  { type: 'task', title: '应急演练计划制定', description: '制定 Q2 安全事件应急演练方案', participants: ['secuclaw-commander', 'security-ops', 'business-security-officer'], scenario: '安全事件响应', time: '5 小时前' },
];

const TABS = [
  { key: 'discussion', label: '讨论' },
  { key: 'request', label: '请求' },
  { key: 'task', label: '任务' },
] as const;

export const RoleCollaborationSection: React.FC = () => {
  const currentRole = useRoleContextStore((s) => s.currentRole);
  const [activeTab, setActiveTab] = useState('discussion');

  if (!currentRole) return null;
  const theme = ROLE_THEMES[currentRole];

  const filtered = MOCK_ITEMS.filter((item) => item.type === activeTab);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: theme.colors.textSecondary }}>
          协作指挥区
        </h3>
        <Button
          size="sm"
          variant="ghost"
          className="text-xs gap-1 text-white/60 hover:text-white hover:bg-white/5"
        >
          <Plus className="w-3.5 h-3.5" />
          新建
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#0f1525] border border-white/5 h-8 p-0.5">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.key}
              value={tab.key}
              className="text-[11px] px-3 py-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-3 space-y-2">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="rounded-lg p-3 transition-all duration-200 hover:brightness-125"
              style={{ backgroundColor: '#0f1525' }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1.5 py-0 border-0"
                      style={{
                        backgroundColor: `${theme.colors.primary}22`,
                        color: theme.colors.secondary,
                      }}
                    >
                      {item.type === 'discussion' ? '讨论' : item.type === 'request' ? '请求' : '任务'}
                    </Badge>
                    <span className="text-xs font-medium text-white truncate">{item.title}</span>
                  </div>
                  <p className="text-[11px] text-white/40 line-clamp-1">{item.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-white/10 text-white/40">
                      {item.scenario}
                    </Badge>
                    <span className="text-[10px] text-white/30">{item.time}</span>
                  </div>
                </div>

                {/* Participant avatars */}
                <div className="flex -space-x-1.5 flex-shrink-0">
                  {item.participants.slice(0, 4).map((roleId) => {
                    const rTheme = ROLE_THEMES[roleId as keyof typeof ROLE_THEMES];
                    if (!rTheme) return null;
                    return (
                      <div
                        key={roleId}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs border border-[#0f1525]"
                        style={{ backgroundColor: rTheme.colors.primary }}
                        title={rTheme.nameCn}
                      >
                        <span className="text-[10px]">{rTheme.icon}</span>
                      </div>
                    );
                  })}
                  {item.participants.length > 4 && (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-white/60 border border-[#0f1525]">
                      +{item.participants.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-6 text-xs text-white/30">暂无{activeTab === 'discussion' ? '讨论' : activeTab === 'request' ? '请求' : '任务'}</div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RoleCollaborationSection;
