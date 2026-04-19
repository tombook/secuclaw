/**
 * SecuClaw Skills Market Page
 *
 * Skill cards grid with search, category tabs, and detail dialog.
 */

import React, { useState, useMemo } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES, type RoleId } from '@/config/role-themes';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ── Types ──

interface Skill {
  id: string;
  name: string;
  emoji: string;
  roleId: RoleId;
  category: 'defense' | 'attack' | 'compliance' | 'governance' | 'operations';
  description: string;
  light: number;
  dark: number;
  security: number;
  legal: number;
  technology: number;
  business: number;
  mitreCoverage: number;
  scfCoverage: number;
  installed: boolean;
}

// ── Mock Data ──

const MOCK_SKILLS: Skill[] = [
  {
    id: 'skill-vuln-scanner',
    name: '漏洞扫描专家',
    emoji: '🛡️',
    roleId: 'security-expert',
    category: 'defense',
    description: '自动化漏洞扫描、CVE 分析和修补建议，支持主流扫描工具集成。',
    light: 85, dark: 30, security: 90, legal: 25, technology: 88, business: 40,
    mitreCoverage: 75, scfCoverage: 68, installed: true,
  },
  {
    id: 'skill-pentest',
    name: '渗透测试大师',
    emoji: '🗡️',
    roleId: 'security-expert',
    category: 'attack',
    description: '自动化渗透测试框架，模拟 APT 攻击路径，生成测试报告。',
    light: 40, dark: 92, security: 88, legal: 55, technology: 90, business: 30,
    mitreCoverage: 85, scfCoverage: 45, installed: false,
  },
  {
    id: 'skill-gdpr',
    name: 'GDPR 合规助手',
    emoji: '🔐',
    roleId: 'privacy-officer',
    category: 'compliance',
    description: 'GDPR 合规评估、DPIA 分析、数据保护影响评估自动化。',
    light: 90, dark: 10, security: 45, legal: 95, technology: 35, business: 70,
    mitreCoverage: 20, scfCoverage: 82, installed: true,
  },
  {
    id: 'skill-zero-trust',
    name: '零信任架构师',
    emoji: '🏗️',
    roleId: 'security-architect',
    category: 'defense',
    description: '零信任架构设计与评估，网络分段策略，身份验证流程优化。',
    light: 80, dark: 55, security: 85, legal: 35, technology: 92, business: 50,
    mitreCoverage: 60, scfCoverage: 72, installed: false,
  },
  {
    id: 'skill-bcp',
    name: '业务连续性规划',
    emoji: '📊',
    roleId: 'business-security-officer',
    category: 'governance',
    description: '业务连续性计划制定、BIA 分析、灾难恢复策略和 RTO/RPO 评估。',
    light: 88, dark: 15, security: 50, legal: 60, technology: 40, business: 95,
    mitreCoverage: 25, scfCoverage: 65, installed: false,
  },
  {
    id: 'skill-incident-cmd',
    name: '事件指挥系统',
    emoji: '🎯',
    roleId: 'secuclaw-commander',
    category: 'operations',
    description: '安全事件指挥调度，跨角色 RACI 协调，实时作战室管理。',
    light: 70, dark: 75, security: 80, legal: 50, technology: 70, business: 85,
    mitreCoverage: 55, scfCoverage: 70, installed: true,
  },
  {
    id: 'skill-ciso-report',
    name: 'CISO 决策报告',
    emoji: '👔',
    roleId: 'ciso',
    category: 'governance',
    description: '安全态势报告生成、KPI 仪表盘、董事会汇报材料自动化。',
    light: 82, dark: 20, security: 70, legal: 65, technology: 50, business: 92,
    mitreCoverage: 30, scfCoverage: 78, installed: true,
  },
  {
    id: 'skill-soc-ops',
    name: 'SOC 运营自动化',
    emoji: '⚙️',
    roleId: 'security-ops',
    category: 'operations',
    description: 'SIEM 规则管理、SOAR playbooks、告警分诊和自动化响应。',
    light: 75, dark: 80, security: 92, legal: 25, technology: 90, business: 35,
    mitreCoverage: 78, scfCoverage: 60, installed: false,
  },
  {
    id: 'skill-sbom',
    name: 'SBOM 分析器',
    emoji: '🔗',
    roleId: 'supply-chain-security',
    category: 'defense',
    description: '软件物料清单分析、供应链风险评估、第三方组件漏洞追踪。',
    light: 70, dark: 50, security: 75, legal: 40, technology: 80, business: 60,
    mitreCoverage: 40, scfCoverage: 75, installed: false,
  },
  {
    id: 'skill-threat-intel',
    name: '威胁情报中心',
    emoji: '🔍',
    roleId: 'security-ops',
    category: 'defense',
    description: '威胁情报聚合、IOC 管理、威胁猎杀和攻击者画像分析。',
    light: 65, dark: 85, security: 92, legal: 30, technology: 88, business: 35,
    mitreCoverage: 82, scfCoverage: 55, installed: true,
  },
  {
    id: 'skill-compliance-scan',
    name: '合规扫描引擎',
    emoji: '📋',
    roleId: 'privacy-officer',
    category: 'compliance',
    description: '多框架合规扫描（ISO 27001、SOC 2、NIST），差距分析和修复建议。',
    light: 88, dark: 12, security: 55, legal: 90, technology: 45, business: 72,
    mitreCoverage: 15, scfCoverage: 90, installed: false,
  },
  {
    id: 'skill-red-team',
    name: '红队模拟器',
    emoji: '☠️',
    roleId: 'security-expert',
    category: 'attack',
    description: '红队攻击模拟、APT 场景复现、紫队评估和攻击路径分析。',
    light: 30, dark: 95, security: 90, legal: 50, technology: 92, business: 25,
    mitreCoverage: 90, scfCoverage: 35, installed: false,
  },
];

const CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'defense', label: '🛡️ 防御' },
  { id: 'attack', label: '⚔️ 攻击' },
  { id: 'compliance', label: '📋 合规' },
  { id: 'governance', label: '🏛️ 治理' },
  { id: 'operations', label: '⚙️ 运营' },
];

const DIMENSION_LABELS: { key: keyof Skill; label: string; color: string }[] = [
  { key: 'light', label: 'Light', color: '#3b82f6' },
  { key: 'dark', label: 'Dark', color: '#ef4444' },
  { key: 'security', label: 'Security', color: '#22c55e' },
  { key: 'legal', label: 'Legal', color: '#a78bfa' },
  { key: 'technology', label: 'Technology', color: '#06b6d4' },
  { key: 'business', label: 'Business', color: '#f59e0b' },
];

// ── Component ──

export const SkillsMarketPage: React.FC = () => {
  const currentRole = useRoleContextStore((s) => s.currentRole);
  const theme = currentRole ? ROLE_THEMES[currentRole] : null;
  const accentColor = theme?.colors.primary ?? '#1e40af';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [installedSet, setInstalledSet] = useState<Set<string>>(
    new Set(MOCK_SKILLS.filter((s) => s.installed).map((s) => s.id))
  );

  const filtered = useMemo(() => {
    return MOCK_SKILLS.filter((skill) => {
      if (categoryFilter !== 'all' && skill.category !== categoryFilter) return false;
      if (searchQuery && !skill.name.toLowerCase().includes(searchQuery.toLowerCase()) && !skill.description.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    });
  }, [categoryFilter, searchQuery]);

  const toggleInstall = (skillId: string) => {
    setInstalledSet((prev) => {
      const next = new Set(prev);
      if (next.has(skillId)) next.delete(skillId);
      else next.add(skillId);
      return next;
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white">🛒 技能市场</h1>
        <p className="text-sm text-white/40 mt-0.5">发现和安装 AI 安全技能扩展</p>
      </div>

      {/* Search + Tabs */}
      <div className="space-y-3">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索技能..."
          className="w-full bg-[#0f1525] border-white/10 text-white text-xs placeholder:text-white/25"
        />
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                categoryFilter === cat.id
                  ? 'text-white font-medium'
                  : 'text-white/40 hover:text-white/60 bg-white/[0.03]'
              }`}
              style={
                categoryFilter === cat.id
                  ? { backgroundColor: `${accentColor}30`, border: `1px solid ${accentColor}50` }
                  : { border: '1px solid rgba(255,255,255,0.06)' }
              }
              onClick={() => setCategoryFilter(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Skill Cards Grid */}
      <div className="grid grid-cols-3 gap-3">
        {filtered.map((skill) => {
          const isInstalled = installedSet.has(skill.id);
          return (
            <Card
              key={skill.id}
              className="bg-[#0f1525] border border-[#1e293b] hover:border-white/15 transition-colors cursor-pointer"
              onClick={() => setSelectedSkill(skill)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{skill.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{skill.name}</div>
                    <div className="text-[10px] text-white/30 mt-0.5">
                      {ROLE_THEMES[skill.roleId].nameCn}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-white/40 mt-2 leading-relaxed line-clamp-2">{skill.description}</p>
                <div className="flex items-center gap-1.5 mt-3">
                  <Badge variant="outline" className="text-[9px] border-blue-500/30 text-blue-400 px-1.5">
                    Light {skill.light}%
                  </Badge>
                  <Badge variant="outline" className="text-[9px] border-red-500/30 text-red-400 px-1.5">
                    Dark {skill.dark}%
                  </Badge>
                  <div className="flex-1" />
                  <Button
                    size="sm"
                    variant={isInstalled ? 'outline' : 'default'}
                    className={`text-[10px] px-2.5 py-0.5 h-6 ${
                      isInstalled ? 'border-white/10 text-green-400' : ''
                    }`}
                    style={!isInstalled ? { backgroundColor: accentColor } : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleInstall(skill.id);
                    }}
                  >
                    {isInstalled ? '已安装 ✓' : '安装'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-xs text-white/20">没有找到匹配的技能</div>
      )}

      {/* ── Skill Detail Dialog ── */}
      <Dialog open={!!selectedSkill} onOpenChange={(open) => !open && setSelectedSkill(null)}>
        <DialogContent className="bg-[#0f1525] border-white/10 max-w-lg">
          {selectedSkill && (
            <>
              <DialogHeader>
                <DialogTitle className="text-white flex items-center gap-2">
                  <span className="text-2xl">{selectedSkill.emoji}</span>
                  {selectedSkill.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <p className="text-xs text-white/50 leading-relaxed">{selectedSkill.description}</p>

                {/* 6 Dimensions */}
                <div>
                  <h4 className="text-xs font-semibold text-white/50 mb-2">六维能力</h4>
                  <div className="space-y-2">
                    {DIMENSION_LABELS.map((dim) => (
                      <div key={dim.key}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[11px] text-white/50">{dim.label}</span>
                          <span className="text-[10px] font-mono" style={{ color: dim.color }}>
                            {(selectedSkill as unknown as Record<string, number>)[dim.key]}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(selectedSkill as unknown as Record<string, number>)[dim.key]}%`,
                              backgroundColor: dim.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coverage Bars */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] text-white/50">MITRE 覆盖</span>
                      <span className="text-[10px] font-mono text-orange-400">{selectedSkill.mitreCoverage}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-orange-500" style={{ width: `${selectedSkill.mitreCoverage}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[11px] text-white/50">SCF 覆盖</span>
                      <span className="text-[10px] font-mono text-cyan-400">{selectedSkill.scfCoverage}%</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-cyan-500" style={{ width: `${selectedSkill.scfCoverage}%` }} />
                    </div>
                  </div>
                </div>

                {/* Install Button */}
                <Button
                  className="w-full text-xs"
                  style={{ backgroundColor: accentColor }}
                  onClick={() => {
                    toggleInstall(selectedSkill.id);
                    setSelectedSkill(null);
                  }}
                >
                  {installedSet.has(selectedSkill.id) ? '卸载技能' : '安装技能'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SkillsMarketPage;
