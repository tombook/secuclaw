/**
 * SecuClaw AI Experts Page
 *
 * 8-role card selector with detailed role view including radar,
 * MITRE heatmap, SCF controls, and capability bars.
 */

import React, { useState } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES, ALL_ROLE_IDS, type RoleId } from '@/config/role-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExpertiseRadar, type RadarDataPoint } from '@/components/visualizations/ExpertiseRadar';
import { MitreHeatmap } from '@/components/visualizations/MitreHeatmap';

// ── Types ──

interface RoleCapabilities {
  light: number;
  dark: number;
  security: number;
  legal: number;
  technology: number;
  business: number;
}

interface RoleDetail {
  scfControls: string[];
  capabilities: RoleCapabilities;
  radarData: RadarDataPoint[];
}

// ── Mock Data ──

const MOCK_ROLE_DETAILS: Record<RoleId, RoleDetail> = {
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

const CAPABILITY_LABELS: Record<keyof RoleCapabilities, { label: string; color: string }> = {
  light: { label: 'Light 能力', color: '#3b82f6' },
  dark: { label: 'Dark 能力', color: '#ef4444' },
  security: { label: 'Security', color: '#22c55e' },
  legal: { label: 'Legal', color: '#a78bfa' },
  technology: { label: 'Technology', color: '#06b6d4' },
  business: { label: 'Business', color: '#f59e0b' },
};

// ── Component ──

export const AIExpertsPage: React.FC = () => {
  const currentRole = useRoleContextStore((s) => s.currentRole);
  const theme = currentRole ? ROLE_THEMES[currentRole] : null;
  const accentColor = theme?.colors.primary ?? '#1e40af';

  const [selectedRole, setSelectedRole] = useState<RoleId>('security-expert');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);

  const roleTheme = ROLE_THEMES[selectedRole];
  const roleDetail = MOCK_ROLE_DETAILS[selectedRole];

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { role: 'user', content: chatInput.trim() },
      { role: 'ai', content: `我是${roleTheme.nameCn}，正在为您分析中...（模拟回复）` },
    ]);
    setChatInput('');
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-white">🤖 AI 安全专家团队</h1>
        <p className="text-sm text-white/40 mt-0.5">8 位 AI 安全专家，覆盖全方位安全领域</p>
      </div>

      {/* ── Role Selector Grid ── */}
      <div className="grid grid-cols-4 gap-3">
        {ALL_ROLE_IDS.map((roleId) => {
          const rt = ROLE_THEMES[roleId];
          const isSelected = selectedRole === roleId;
          return (
            <Card
              key={roleId}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'bg-[#0f1525] border-2'
                  : 'bg-[#0f1525] border border-[#1e293b] hover:border-white/20'
              }`}
              style={isSelected ? { borderColor: rt.colors.primary } : undefined}
              onClick={() => setSelectedRole(roleId)}
            >
              <CardContent className="p-4 text-center">
                <span className="text-3xl">{rt.icon}</span>
                <div className="text-sm font-semibold text-white mt-2">{rt.nameCn}</div>
                <div className="text-[10px] text-white/40">{rt.name}</div>
                <p className="text-[10px] text-white/30 mt-1.5 leading-relaxed">{rt.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Selected Role Detail ── */}
      <div className="grid grid-cols-[1fr_1fr] gap-4">
        {/* Left: Radar + MITRE */}
        <div className="space-y-4">
          <Card className="bg-[#0f1525] border border-[#1e293b]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/70 flex items-center gap-2">
                <span className="text-xl">{roleTheme.icon}</span>
                {roleTheme.name} — 能力雷达
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <ExpertiseRadar
                data={roleDetail.radarData}
                fillColor={`${roleTheme.colors.primary}40`}
                strokeColor={roleTheme.colors.secondary}
                size={280}
              />
            </CardContent>
          </Card>

          <Card className="bg-[#0f1525] border border-[#1e293b]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/70">MITRE ATT&CK 覆盖</CardTitle>
            </CardHeader>
            <CardContent>
              <MitreHeatmap accentColor={roleTheme.colors.primary} />
            </CardContent>
          </Card>
        </div>

        {/* Right: Capabilities + SCF + Chat */}
        <div className="space-y-4">
          {/* 6 Dimensions */}
          <Card className="bg-[#0f1525] border border-[#1e293b]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/70">六维能力评估</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(Object.keys(CAPABILITY_LABELS) as (keyof RoleCapabilities)[]).map((key) => {
                  const meta = CAPABILITY_LABELS[key];
                  const value = roleDetail.capabilities[key];
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/60">{meta.label}</span>
                        <span className="text-xs font-mono" style={{ color: meta.color }}>{value}%</span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${value}%`, backgroundColor: meta.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* SCF Controls */}
          <Card className="bg-[#0f1525] border border-[#1e293b]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/70">SCF 控制覆盖</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {roleDetail.scfControls.map((ctrl) => (
                  <Badge key={ctrl} variant="outline" className="text-[10px] border-white/10 text-white/50">
                    {ctrl}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Chat */}
          <Card className="bg-[#0f1525] border border-[#1e293b]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-white/70">
                💬 与 {roleTheme.nameCn} 对话
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-40 mb-3">
                {chatMessages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-xs text-white/20">
                    向 {roleTheme.nameCn} 提问任何安全问题
                  </div>
                ) : (
                  <div className="space-y-2">
                    {chatMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`text-xs p-2 rounded-lg ${
                          msg.role === 'user'
                            ? 'bg-blue-600/15 text-white/70 ml-6'
                            : 'bg-white/[0.04] text-white/60 mr-6'
                        }`}
                      >
                        {msg.content}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder={`向 ${roleTheme.nameCn} 提问...`}
                  className="flex-1 bg-white/[0.05] border-white/10 text-white text-xs placeholder:text-white/25"
                />
                <Button size="sm" className="text-xs px-4" style={{ backgroundColor: accentColor }} onClick={handleSendChat}>
                  发送
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AIExpertsPage;
