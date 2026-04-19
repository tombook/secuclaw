/**
 * SecuClaw Knowledge Base Page
 *
 * Dual-pane: left navigation tree (MITRE + SCF) + right content display.
 * Search bar with real-time filtering. Coverage stats at top.
 */

import React, { useState, useMemo } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

// ── Types ──

interface Technique {
  id: string;
  name: string;
  description: string;
  platforms: string[];
  detection: string;
  coverage: number;
}

interface Tactic {
  id: string;
  name: string;
  techniques: Technique[];
}

interface ScfControl {
  id: string;
  name: string;
  description: string;
  status: 'implemented' | 'partial' | 'planned' | 'not-started';
}

interface ScfDomain {
  id: string;
  name: string;
  controls: ScfControl[];
}

type SelectedItem =
  | { type: 'mitre'; tacticId: string; technique: Technique }
  | { type: 'scf'; domainId: string; control: ScfControl }
  | null;

// ── Mock Data ──

const MOCK_MITRE: Tactic[] = [
  {
    id: 'TA0043',
    name: '侦察 Reconnaissance',
    techniques: [
      { id: 'T1595', name: 'Active Scanning', description: '攻击者扫描目标系统获取漏洞信息', platforms: ['Windows', 'Linux', 'SaaS'], detection: '网络流量分析、IDS/IPS', coverage: 75 },
      { id: 'T1592', name: 'Gather Victim Host Info', description: '收集目标主机信息用于后续攻击', platforms: ['Windows', 'Linux'], detection: '威胁情报平台', coverage: 60 },
    ],
  },
  {
    id: 'TA0042',
    name: '资源开发 Resource Development',
    techniques: [
      { id: 'T1587', name: 'Develop Capabilities', description: '开发自定义恶意工具', platforms: ['Windows', 'Linux', 'macOS'], detection: '沙箱分析、YARA 规则', coverage: 30 },
      { id: 'T1589', name: 'Gather Victim Identity', description: '收集受害者身份信息', platforms: ['SaaS', 'Cloud'], detection: '暗网监控、威胁情报', coverage: 50 },
    ],
  },
  {
    id: 'TA0001',
    name: '初始访问 Initial Access',
    techniques: [
      { id: 'T1190', name: 'Exploit Public-Facing App', description: '利用公开应用漏洞获取初始访问', platforms: ['Windows', 'Linux', 'Cloud'], detection: 'WAF、漏洞扫描器', coverage: 85 },
      { id: 'T1566', name: 'Phishing', description: '钓鱼攻击获取凭证', platforms: ['Windows', 'macOS', 'SaaS'], detection: '邮件网关、用户报告', coverage: 70 },
      { id: 'T1078', name: 'Valid Accounts', description: '利用合法凭证登录', platforms: ['Windows', 'Linux', 'Cloud', 'SaaS'], detection: 'UEBA、异常登录检测', coverage: 65 },
    ],
  },
  {
    id: 'TA0002',
    name: '执行 Execution',
    techniques: [
      { id: 'T1059', name: 'Command and Scripting Interpreter', description: '使用命令行/脚本执行恶意代码', platforms: ['Windows', 'Linux', 'macOS'], detection: '进程监控、EDR', coverage: 80 },
      { id: 'T1203', name: 'Exploitation for Client Execution', description: '利用客户端漏洞执行代码', platforms: ['Windows', 'macOS'], detection: '漏洞扫描、EDR', coverage: 55 },
    ],
  },
  {
    id: 'TA0003',
    name: '持久化 Persistence',
    techniques: [
      { id: 'T1053', name: 'Scheduled Task/Job', description: '创建计划任务维持持久化', platforms: ['Windows', 'Linux'], detection: '计划任务审计、SIEM', coverage: 72 },
      { id: 'T1133', name: 'External Remote Services', description: '利用外部远程服务维持访问', platforms: ['Windows', 'Linux', 'SaaS'], detection: 'VPN 日志分析', coverage: 60 },
    ],
  },
  {
    id: 'TA0004',
    name: '权限提升 Privilege Escalation',
    techniques: [
      { id: 'T1068', name: 'Exploitation for Privilege Escalation', description: '利用漏洞提升权限', platforms: ['Windows', 'Linux'], detection: 'EDR、权限审计', coverage: 68 },
      { id: 'T1548', name: 'Abuse Elevation Control Mechanism', description: '滥用提权机制', platforms: ['Windows', 'Linux', 'macOS'], detection: 'SIEM 规则、日志分析', coverage: 50 },
    ],
  },
  {
    id: 'TA0005',
    name: '防御规避 Defense Evasion',
    techniques: [
      { id: 'T1562', name: 'Impair Defenses', description: '破坏安全防护机制', platforms: ['Windows', 'Linux'], detection: '安全工具状态监控', coverage: 75 },
      { id: 'T1070', name: 'Indicator Removal', description: '清除攻击指标', platforms: ['Windows', 'Linux', 'macOS'], detection: '文件完整性监控', coverage: 45 },
    ],
  },
  {
    id: 'TA0006',
    name: '凭证访问 Credential Access',
    techniques: [
      { id: 'T1110', name: 'Brute Force', description: '暴力破解获取凭证', platforms: ['Windows', 'Linux', 'SaaS'], detection: '登录失败监控、EDR', coverage: 82 },
      { id: 'T1003', name: 'OS Credential Dumping', description: '导出操作系统凭证', platforms: ['Windows', 'Linux'], detection: 'EDR、蜜罐', coverage: 70 },
    ],
  },
  {
    id: 'TA0007',
    name: '发现 Discovery',
    techniques: [
      { id: 'T1082', name: 'System Information Discovery', description: '收集系统信息', platforms: ['Windows', 'Linux', 'macOS'], detection: '进程监控、SIEM', coverage: 78 },
      { id: 'T1046', name: 'Network Service Discovery', description: '网络服务扫描', platforms: ['Windows', 'Linux'], detection: 'IDS/IPS、网络流量分析', coverage: 65 },
    ],
  },
  {
    id: 'TA0008',
    name: '横向移动 Lateral Movement',
    techniques: [
      { id: 'T1021', name: 'Remote Services', description: '利用远程服务横向移动', platforms: ['Windows', 'Linux'], detection: '网络流量分析、EDR', coverage: 60 },
      { id: 'T1570', name: 'Lateral Tool Transfer', description: '传输工具到其他系统', platforms: ['Windows', 'Linux'], detection: '文件传输监控', coverage: 50 },
    ],
  },
  {
    id: 'TA0009',
    name: '收集 Collection',
    techniques: [
      { id: 'T1005', name: 'Data from Local System', description: '从本地系统收集数据', platforms: ['Windows', 'Linux', 'macOS'], detection: 'DLP、文件访问审计', coverage: 55 },
      { id: 'T1039', name: 'Data from Network Shared Drive', description: '从网络共享收集数据', platforms: ['Windows'], detection: '文件服务器审计', coverage: 48 },
    ],
  },
  {
    id: 'TA0011',
    name: '命令与控制 Command & Control',
    techniques: [
      { id: 'T1071', name: 'Application Layer Protocol', description: '使用应用层协议通信', platforms: ['Windows', 'Linux', 'macOS'], detection: '网络流量分析、DNS 监控', coverage: 70 },
      { id: 'T1573', name: 'Encrypted Channel', description: '使用加密通道通信', platforms: ['Windows', 'Linux'], detection: 'TLS 指纹分析', coverage: 42 },
    ],
  },
];

const MOCK_SCF: ScfDomain[] = [
  {
    id: 'DSC',
    name: '数据安全与隐私 (DSC)',
    controls: [
      { id: 'DSC-01', name: '数据分类分级', description: '对数据进行分类分级管理', status: 'implemented' },
      { id: 'DSC-02', name: '数据加密', description: '传输和存储中的数据加密', status: 'implemented' },
      { id: 'DSC-03', name: '数据防泄漏', description: 'DLP 策略和工具部署', status: 'partial' },
      { id: 'DSC-04', name: '数据备份与恢复', description: '定期备份和恢复测试', status: 'planned' },
    ],
  },
  {
    id: 'IAM',
    name: '身份与访问管理 (IAM)',
    controls: [
      { id: 'IAM-01', name: '多因素认证', description: '关键系统启用 MFA', status: 'implemented' },
      { id: 'IAM-02', name: '最小权限原则', description: '基于角色的访问控制', status: 'partial' },
      { id: 'IAM-03', name: '统一身份管理', description: 'SSO 和集中身份管理', status: 'implemented' },
    ],
  },
  {
    id: 'TVM',
    name: '威胁与漏洞管理 (TVM)',
    controls: [
      { id: 'TVM-01', name: '漏洞扫描', description: '定期自动漏洞扫描', status: 'implemented' },
      { id: 'TVM-02', name: '补丁管理', description: '漏洞修补流程和 SLA', status: 'partial' },
      { id: 'TVM-03', name: '威胁情报', description: '威胁情报订阅和利用', status: 'implemented' },
    ],
  },
  {
    id: 'SEF',
    name: '安全事件管理 (SEF)',
    controls: [
      { id: 'SEF-01', name: '事件响应流程', description: '建立事件响应计划', status: 'implemented' },
      { id: 'SEF-02', name: 'SOC 运营', description: '安全运营中心建设', status: 'partial' },
      { id: 'SEF-03', name: '取证分析', description: '数字取证能力', status: 'planned' },
    ],
  },
  {
    id: 'GOV',
    name: '安全治理 (GOV)',
    controls: [
      { id: 'GOV-01', name: '安全策略', description: '信息安全策略制定和维护', status: 'implemented' },
      { id: 'GOV-02', name: '风险管理', description: '信息安全风险管理框架', status: 'partial' },
      { id: 'GOV-03', name: '安全培训', description: '全员安全意识培训', status: 'implemented' },
    ],
  },
  {
    id: 'RLT',
    name: '法规合规 (RLT)',
    controls: [
      { id: 'RLT-01', name: '合规评估', description: '定期合规差距评估', status: 'partial' },
      { id: 'RLT-02', name: '审计管理', description: '内外部审计管理', status: 'implemented' },
    ],
  },
  {
    id: 'STA',
    name: '安全架构 (STA)',
    controls: [
      { id: 'STA-01', name: '零信任架构', description: '零信任安全架构设计', status: 'planned' },
      { id: 'STA-02', name: '网络分段', description: '网络微分段实施', status: 'not-started' },
    ],
  },
  {
    id: 'TPM',
    name: '第三方管理 (TPM)',
    controls: [
      { id: 'TPM-01', name: '供应商评估', description: '第三方供应商安全评估', status: 'partial' },
      { id: 'TPM-02', name: '合同安全条款', description: '供应商合同安全要求', status: 'implemented' },
      { id: 'TPM-03', name: 'SBOM 管理', description: '软件物料清单管理', status: 'planned' },
    ],
  },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  implemented: { label: '已实施', color: '#22c55e', bg: '#22c55e15' },
  partial: { label: '部分实施', color: '#f59e0b', bg: '#f59e0b15' },
  planned: { label: '计划中', color: '#3b82f6', bg: '#3b82f615' },
  'not-started': { label: '未开始', color: '#6b7280', bg: '#6b728015' },
};

// ── Component ──

export const KnowledgeBasePage: React.FC = () => {
  const currentRole = useRoleContextStore((s) => s.currentRole);
  const theme = currentRole ? ROLE_THEMES[currentRole] : null;
  const accentColor = theme?.colors.primary ?? '#1e40af';

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTactics, setExpandedTactics] = useState<Set<string>>(new Set(['TA0001']));
  const [expandedDomains, setExpandedDomains] = useState<Set<string>>(new Set(['DSC']));
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null);
  const [activeTab, setActiveTab] = useState<'mitre' | 'scf'>('mitre');

  // Stats
  const mitreCoverage = useMemo(() => {
    const total = MOCK_MITRE.reduce((sum, t) => sum + t.techniques.length, 0);
    const covered = MOCK_MITRE.reduce(
      (sum, t) => sum + t.techniques.filter((tech) => tech.coverage >= 60).length,
      0
    );
    return Math.round((covered / total) * 100);
  }, []);

  const scfCoverage = useMemo(() => {
    const total = MOCK_SCF.reduce((sum, d) => sum + d.controls.length, 0);
    const implemented = MOCK_SCF.reduce(
      (sum, d) => sum + d.controls.filter((c) => c.status === 'implemented').length,
      0
    );
    return Math.round((implemented / total) * 100);
  }, []);

  const toggleTactic = (id: string) => {
    setExpandedTactics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDomain = (id: string) => {
    setExpandedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter by search
  const filteredMitre = useMemo(() => {
    if (!searchQuery) return MOCK_MITRE;
    const q = searchQuery.toLowerCase();
    return MOCK_MITRE.map((tactic) => ({
      ...tactic,
      techniques: tactic.techniques.filter(
        (tech) =>
          tech.name.toLowerCase().includes(q) ||
          tech.id.toLowerCase().includes(q) ||
          tech.description.toLowerCase().includes(q)
      ),
    })).filter((tactic) => tactic.techniques.length > 0);
  }, [searchQuery]);

  const filteredScf = useMemo(() => {
    if (!searchQuery) return MOCK_SCF;
    const q = searchQuery.toLowerCase();
    return MOCK_SCF.map((domain) => ({
      ...domain,
      controls: domain.controls.filter(
        (ctrl) =>
          ctrl.name.toLowerCase().includes(q) ||
          ctrl.id.toLowerCase().includes(q) ||
          ctrl.description.toLowerCase().includes(q)
      ),
    })).filter((domain) => domain.controls.length > 0);
  }, [searchQuery]);

  return (
    <div className="space-y-5">
      {/* Header + Stats */}
      <div>
        <h1 className="text-xl font-bold text-white">📚 安全知识库</h1>
        <p className="text-sm text-white/40 mt-0.5">MITRE ATT&CK 与 SCF 安全控制框架</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[#0f1525] border border-[#1e293b]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50">MITRE 战术覆盖率</span>
              <span className="text-xs font-mono text-blue-400">{mitreCoverage}%</span>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${mitreCoverage}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#0f1525] border border-[#1e293b]">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50">SCF 控制实施率</span>
              <span className="text-xs font-mono text-green-400">{scfCoverage}%</span>
            </div>
            <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-green-500" style={{ width: `${scfCoverage}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="搜索技术、控制项..."
        className="w-full bg-[#0f1525] border-white/10 text-white text-xs placeholder:text-white/25"
      />

      {/* Dual Pane */}
      <div className="flex gap-4 h-[calc(100vh-22rem)]">
        {/* Left Nav Tree */}
        <div className="w-[320px] flex-shrink-0 bg-[#0f1525] border border-[#1e293b] rounded-lg overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-white/[0.06]">
            {(['mitre', 'scf'] as const).map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === tab ? 'text-white border-b-2' : 'text-white/40 hover:text-white/60'
                }`}
                style={activeTab === tab ? { borderColor: accentColor } : undefined}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'mitre' ? 'MITRE ATT&CK' : 'SCF 控制'}
              </button>
            ))}
          </div>

          <ScrollArea className="flex-1">
            {activeTab === 'mitre' ? (
              <div className="p-2">
                {filteredMitre.map((tactic) => (
                  <div key={tactic.id} className="mb-1">
                    <button
                      className="w-full text-left px-2.5 py-2 rounded-md text-xs text-white/70 hover:bg-white/[0.03] flex items-center gap-2"
                      onClick={() => toggleTactic(tactic.id)}
                    >
                      <span className="text-[10px] text-white/30">{expandedTactics.has(tactic.id) ? '▼' : '▶'}</span>
                      <span className="truncate">{tactic.name}</span>
                      <Badge variant="outline" className="ml-auto text-[8px] px-1 py-0 border-white/10 text-white/30">
                        {tactic.techniques.length}
                      </Badge>
                    </button>
                    {expandedTactics.has(tactic.id) && (
                      <div className="ml-5 space-y-0.5 mt-0.5">
                        {tactic.techniques.map((tech) => (
                          <button
                            key={tech.id}
                            className="w-full text-left px-2 py-1.5 rounded text-[11px] text-white/50 hover:bg-white/[0.03] hover:text-white/80 flex items-center gap-2"
                            onClick={() => setSelectedItem({ type: 'mitre', tacticId: tactic.id, technique: tech })}
                          >
                            <span className="font-mono text-[9px] text-white/25">{tech.id}</span>
                            <span className="truncate">{tech.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-2">
                {filteredScf.map((domain) => (
                  <div key={domain.id} className="mb-1">
                    <button
                      className="w-full text-left px-2.5 py-2 rounded-md text-xs text-white/70 hover:bg-white/[0.03] flex items-center gap-2"
                      onClick={() => toggleDomain(domain.id)}
                    >
                      <span className="text-[10px] text-white/30">{expandedDomains.has(domain.id) ? '▼' : '▶'}</span>
                      <span className="truncate">{domain.name}</span>
                      <Badge variant="outline" className="ml-auto text-[8px] px-1 py-0 border-white/10 text-white/30">
                        {domain.controls.length}
                      </Badge>
                    </button>
                    {expandedDomains.has(domain.id) && (
                      <div className="ml-5 space-y-0.5 mt-0.5">
                        {domain.controls.map((ctrl) => {
                          const sc = STATUS_CONFIG[ctrl.status];
                          return (
                            <button
                              key={ctrl.id}
                              className="w-full text-left px-2 py-1.5 rounded text-[11px] text-white/50 hover:bg-white/[0.03] hover:text-white/80 flex items-center gap-2"
                              onClick={() => setSelectedItem({ type: 'scf', domainId: domain.id, control: ctrl })}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: sc.color }}
                              />
                              <span className="font-mono text-[9px] text-white/25">{ctrl.id}</span>
                              <span className="truncate">{ctrl.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0">
          {!selectedItem ? (
            <div className="h-full flex items-center justify-center text-xs text-white/20 bg-[#0f1525] border border-[#1e293b] rounded-lg">
              ← 从左侧选择一个技术或控制项查看详情
            </div>
          ) : selectedItem.type === 'mitre' ? (
            <Card className="bg-[#0f1525] border border-[#1e293b] h-full overflow-y-auto">
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-white/30">{selectedItem.technique.id}</div>
                  <h2 className="text-lg font-bold text-white mt-1">{selectedItem.technique.name}</h2>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-white/50 mb-1.5">描述</h4>
                  <p className="text-xs text-white/60 leading-relaxed">{selectedItem.technique.description}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-white/50 mb-1.5">平台</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.technique.platforms.map((p) => (
                      <Badge key={p} variant="outline" className="text-[10px] border-white/10 text-white/50">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-white/50 mb-1.5">检测方式</h4>
                  <p className="text-xs text-white/60">{selectedItem.technique.detection}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-white/50 mb-2">检测覆盖率</h4>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${selectedItem.technique.coverage}%`,
                          backgroundColor:
                            selectedItem.technique.coverage >= 70
                              ? '#22c55e'
                              : selectedItem.technique.coverage >= 50
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      />
                    </div>
                    <span className="text-xs font-mono text-white/50">{selectedItem.technique.coverage}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[#0f1525] border border-[#1e293b] h-full overflow-y-auto">
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="text-[10px] font-mono text-white/30">{selectedItem.control.id}</div>
                  <h2 className="text-lg font-bold text-white mt-1">{selectedItem.control.name}</h2>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-white/50 mb-1.5">描述</h4>
                  <p className="text-xs text-white/60 leading-relaxed">{selectedItem.control.description}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-white/50 mb-1.5">实施状态</h4>
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
                    style={{
                      color: STATUS_CONFIG[selectedItem.control.status].color,
                      backgroundColor: STATUS_CONFIG[selectedItem.control.status].bg,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STATUS_CONFIG[selectedItem.control.status].color }} />
                    {STATUS_CONFIG[selectedItem.control.status].label}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
