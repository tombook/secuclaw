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

// ── Types ──

type FrameworkId = 'gdpr' | 'pipl' | 'ccpa' | 'cybersecurity-law';
type ControlStatus = 'compliant' | 'partial' | 'non-compliant' | 'not-assessed';

interface Framework {
  id: FrameworkId;
  name: string;
  icon: string;
  totalControls: number;
  compliant: number;
  partial: number;
  nonCompliant: number;
  notAssessed: number;
  lastAudit: string;
  nextAudit: string;
}

interface Control {
  id: string;
  frameworkId: FrameworkId;
  title: string;
  status: ControlStatus;
  owner: string;
  evidence: string;
  dueDate: string;
  category: string;
}

// ── Mock Data ──

const MOCK_FRAMEWORKS: Framework[] = [
  { id: 'gdpr', name: 'GDPR 通用数据保护条例', icon: '🇪🇺', totalControls: 45, compliant: 32, partial: 8, nonCompliant: 3, notAssessed: 2, lastAudit: '2024-03-15', nextAudit: '2024-09-15' },
  { id: 'pipl', name: '个人信息保护法 PIPL', icon: '🇨🇳', totalControls: 52, compliant: 41, partial: 6, nonCompliant: 2, notAssessed: 3, lastAudit: '2024-04-01', nextAudit: '2024-10-01' },
  { id: 'ccpa', name: 'CCPA 加州消费者隐私法', icon: '🇺🇸', totalControls: 30, compliant: 18, partial: 7, nonCompliant: 3, notAssessed: 2, lastAudit: '2024-02-20', nextAudit: '2024-08-20' },
  { id: 'cybersecurity-law', name: '网络安全法 + 等保 2.0', icon: '🛡️', totalControls: 68, compliant: 50, partial: 10, nonCompliant: 5, notAssessed: 3, lastAudit: '2024-03-30', nextAudit: '2024-09-30' },
];

const MOCK_CONTROLS: Control[] = [
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

const STATUS_CONFIG: Record<ControlStatus, { label: string; color: string; bgColor: string }> = {
  compliant: { label: '合规', color: '#22c55e', bgColor: '#22c55e22' },
  partial: { label: '部分合规', color: '#eab308', bgColor: '#eab30822' },
  'non-compliant': { label: '不合规', color: '#ef4444', bgColor: '#ef444422' },
  'not-assessed': { label: '未评估', color: '#6b7280', bgColor: '#6b728022' },
};

// ── Compliance Gauge SVG ──

const MiniGauge: React.FC<{ value: number; label: string; size?: number }> = ({ value, label, size = 80 }) => {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 80 ? '#22c55e' : value >= 60 ? '#eab308' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={6} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset} className="transition-all duration-700" />
      </svg>
      <div className="absolute flex flex-col items-center justify-center pointer-events-none" style={{ width: size, height: size }}>
        <span className="text-sm font-bold" style={{ color }}>{Math.round(value)}%</span>
      </div>
      <span className="text-[10px] text-white/40">{label}</span>
    </div>
  );
};

// ── Component ──

export const CompliancePage: React.FC = () => {
  const currentRole = useRoleContextStore((s) => s.currentRole);
  const theme = currentRole ? ROLE_THEMES[currentRole] : null;
  const accentColor = theme?.colors.primary ?? '#1e40af';

  const [selectedFramework, setSelectedFramework] = useState<FrameworkId>('gdpr');

  const selectedFw = MOCK_FRAMEWORKS.find((f) => f.id === selectedFramework)!;
  const controls = MOCK_CONTROLS.filter((c) => c.frameworkId === selectedFramework);
  const complianceRate = Math.round((selectedFw.compliant / selectedFw.totalControls) * 100);

  // Gap analysis
  const gaps = MOCK_CONTROLS.filter((c) => c.status === 'non-compliant' || c.status === 'partial');
  const gapByFramework = MOCK_FRAMEWORKS.map((fw) => ({
    ...fw,
    gaps: MOCK_CONTROLS.filter((c) => c.frameworkId === fw.id && (c.status === 'non-compliant' || c.status === 'partial')),
  }));

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-bold text-white">✅ 合规管理</h1>
        <p className="text-sm text-white/40 mt-0.5">合规框架跟踪、控制项管理与差距分析</p>
      </div>

      {/* ── Framework Progress Bars ── */}
      <div className="grid grid-cols-4 gap-3">
        {MOCK_FRAMEWORKS.map((fw) => {
          const rate = Math.round((fw.compliant / fw.totalControls) * 100);
          const isSelected = selectedFramework === fw.id;
          return (
            <Card
              key={fw.id}
              className={`bg-[#0f1525] border-white/[0.06] cursor-pointer transition-all hover:border-white/10 ${isSelected ? 'ring-1' : ''}`}
              style={isSelected ? { borderColor: accentColor } : {}}
              onClick={() => setSelectedFramework(fw.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{fw.icon}</span>
                  <span className="text-xs font-medium text-white">{fw.name}</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/40 mb-1.5">
                  <span>{fw.compliant}/{fw.totalControls} 控制</span>
                  <span className="font-semibold" style={{ color: rate >= 80 ? '#22c55e' : '#eab308' }}>{rate}%</span>
                </div>
                <Progress value={rate} className="h-2" />
                <div className="flex gap-3 mt-2 text-[9px] text-white/30">
                  <span>下次审计: {fw.nextAudit}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="controls" className="space-y-4">
        <TabsList className="bg-[#0f1525] border border-white/[0.06]">
          <TabsTrigger value="controls" className="text-xs data-[state=active]:bg-white/10">📋 控制项</TabsTrigger>
          <TabsTrigger value="dashboard" className="text-xs data-[state=active]:bg-white/10">📊 仪表盘</TabsTrigger>
          <TabsTrigger value="gaps" className="text-xs data-[state=active]:bg-white/10">🔍 差距分析</TabsTrigger>
        </TabsList>

        {/* ── Control Items ── */}
        <TabsContent value="controls">
          <Card className="bg-[#0f1525] border-white/[0.06] overflow-hidden">
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-sm text-white/70">
                {selectedFw.icon} {selectedFw.name} — 控制项检查列表
              </CardTitle>
              <Badge variant="outline" className="text-[10px] px-2 border-white/10 text-white/50">
                {controls.length} 项
              </Badge>
            </CardHeader>
            <CardContent>
              {/* Filter by status */}
              <div className="flex gap-4 mb-3">
                {(['compliant', 'partial', 'non-compliant', 'not-assessed'] as ControlStatus[]).map((status) => {
                  const cfg = STATUS_CONFIG[status];
                  const count = controls.filter((c) => c.status === status).length;
                  return (
                    <div key={status} className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                      <span className="text-white/40">{cfg.label}</span>
                      <span className="font-semibold text-white/60">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* Control list */}
              <div className="space-y-1">
                {controls.map((ctrl) => {
                  const cfg = STATUS_CONFIG[ctrl.status];
                  return (
                    <div
                      key={ctrl.id}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/[0.02] transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-white">{ctrl.title}</span>
                          <Badge
                            className="text-[9px] px-1.5 py-0 border-0"
                            style={{ backgroundColor: cfg.bgColor, color: cfg.color }}
                          >
                            {cfg.label}
                          </Badge>
                        </div>
                        <div className="text-[10px] text-white/30 mt-0.5">
                          {ctrl.category} · 负责人: {ctrl.owner} · 截止: {ctrl.dueDate}
                        </div>
                      </div>
                      <div className="text-[10px] text-white/25 max-w-[160px] truncate">{ctrl.evidence}</div>
                      <Button variant="ghost" size="sm" className="text-[10px] text-white/30 hover:text-white h-6 px-2">
                        查看
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Compliance Dashboard ── */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-2 gap-4">
            {/* Gauge cards */}
            <Card className="bg-[#0f1525] border-white/[0.06]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-white/50">合规状态概览</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-around py-4">
                  {MOCK_FRAMEWORKS.map((fw) => {
                    const rate = Math.round((fw.compliant / fw.totalControls) * 100);
                    return (
                      <div key={fw.id} className="relative">
                        <MiniGauge value={rate} label={fw.name.split(' ')[0]} size={90} />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Status breakdown */}
            <Card className="bg-[#0f1525] border-white/[0.06]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-white/50">控制项状态分布</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {MOCK_FRAMEWORKS.map((fw) => (
                    <div key={fw.id} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/60">{fw.icon} {fw.name.split(' ')[0]}</span>
                        <span className="text-white/40">{fw.compliant}/{fw.totalControls}</span>
                      </div>
                      {/* Stacked bar */}
                      <div className="flex h-3 rounded-full overflow-hidden bg-white/[0.04]">
                        <div style={{ width: `${(fw.compliant / fw.totalControls) * 100}%`, backgroundColor: '#22c55e' }} className="transition-all duration-500" />
                        <div style={{ width: `${(fw.partial / fw.totalControls) * 100}%`, backgroundColor: '#eab308' }} className="transition-all duration-500" />
                        <div style={{ width: `${(fw.nonCompliant / fw.totalControls) * 100}%`, backgroundColor: '#ef4444' }} className="transition-all duration-500" />
                        <div style={{ width: `${(fw.notAssessed / fw.totalControls) * 100}%`, backgroundColor: '#6b7280' }} className="transition-all duration-500" />
                      </div>
                    </div>
                  ))}
                  {/* Legend */}
                  <div className="flex gap-4 pt-2">
                    {[
                      { color: '#22c55e', label: '合规' },
                      { color: '#eab308', label: '部分合规' },
                      { color: '#ef4444', label: '不合规' },
                      { color: '#6b7280', label: '未评估' },
                    ].map((l) => (
                      <div key={l.label} className="flex items-center gap-1 text-[9px] text-white/40">
                        <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
                        {l.label}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Gap Analysis ── */}
        <TabsContent value="gaps">
          <div className="space-y-4">
            {/* Summary */}
            <Card className="bg-[#0f1525] border-white/[0.06]">
              <CardContent className="p-4">
                <div className="flex items-center gap-6">
                  <div>
                    <div className="text-2xl font-bold text-red-400">{gaps.length}</div>
                    <div className="text-[10px] text-white/40">待修复差距项</div>
                  </div>
                  <div className="h-10 w-px bg-white/[0.06]" />
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">
                      {gaps.filter((g) => g.status === 'partial').length}
                    </div>
                    <div className="text-[10px] text-white/40">部分合规</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-500">
                      {gaps.filter((g) => g.status === 'non-compliant').length}
                    </div>
                    <div className="text-[10px] text-white/40">不合规</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gap details by framework */}
            {gapByFramework.filter((fw) => fw.gaps.length > 0).map((fw) => (
              <Card key={fw.id} className="bg-[#0f1525] border-white/[0.06]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-white/70">
                    {fw.icon} {fw.name}
                    <Badge variant="destructive" className="ml-2 text-[9px] px-1.5 py-0">
                      {fw.gaps.length} 个差距
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {fw.gaps.map((gap) => {
                      const cfg = STATUS_CONFIG[gap.status];
                      return (
                        <div key={gap.id} className="flex items-center gap-3 p-2.5 rounded-md bg-white/[0.02]">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cfg.color }} />
                          <div className="flex-1">
                            <div className="text-xs font-medium text-white">{gap.title}</div>
                            <div className="text-[10px] text-white/30">{gap.evidence}</div>
                          </div>
                          <Badge className="text-[9px] px-1.5 py-0 border-0" style={{ backgroundColor: cfg.bgColor, color: cfg.color }}>
                            {cfg.label}
                          </Badge>
                          <div className="text-[10px] text-white/30">截止: {gap.dueDate}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Floating AI Button ── */}
      <button
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg hover:scale-110 transition-transform"
        style={{ backgroundColor: accentColor }}
      >
        🤖
      </button>
    </div>
  );
};

export default CompliancePage;
