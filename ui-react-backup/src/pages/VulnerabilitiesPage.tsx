/**
 * SecuClaw Vulnerabilities Page
 *
 * Vulnerability management with CVSS scoring, severity stats,
 * filterable table, progress bars, and distribution pie chart.
 */

import React, { useState, useMemo } from 'react';
import { useRoleContextStore } from '@/stores/role-context';
import { ROLE_THEMES } from '@/config/role-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── Types ──

type VulnSeverity = 'critical' | 'high' | 'medium' | 'low';
type VulnStatus = 'open' | 'accepted' | 'remediating' | 'resolved' | 'risk-accepted';

interface Vulnerability {
  id: string;
  cveId: string;
  title: string;
  cvss: number;
  severity: VulnSeverity;
  status: VulnStatus;
  affectedAssets: string[];
  discoveredAt: string;
  description: string;
}

// ── Mock Data ──

const MOCK_VULNS: Vulnerability[] = [
  { id: 'v1', cveId: 'CVE-2024-21762', title: 'FortiOS out-of-bounds write', cvss: 9.8, severity: 'critical', status: 'open', affectedAssets: ['Firewall-01', 'Firewall-02'], discoveredAt: '2024-04-10', description: 'Fortinet FortiOS SSL VPN 存在越界写入漏洞，可被远程利用执行任意代码。' },
  { id: 'v2', cveId: 'CVE-2024-0204', title: 'GoAnywhere MFT authentication bypass', cvss: 9.1, severity: 'critical', status: 'remediating', affectedAssets: ['MFT-Server-01'], discoveredAt: '2024-04-08', description: 'GoAnywhere MFT 存在认证绕过漏洞，允许未授权用户创建管理员账户。' },
  { id: 'v3', cveId: 'CVE-2024-23897', title: 'Jenkins CLI arbitrary file read', cvss: 8.6, severity: 'high', status: 'remediating', affectedAssets: ['CI-Jenkins-01', 'CI-Jenkins-02'], discoveredAt: '2024-04-05', description: 'Jenkins CLI 命令行接口存在任意文件读取漏洞。' },
  { id: 'v4', cveId: 'CVE-2024-23917', title: 'Apache Struts file upload RCE', cvss: 8.1, severity: 'high', status: 'open', affectedAssets: ['App-Server-03'], discoveredAt: '2024-04-06', description: 'Apache Struts 文件上传功能存在远程代码执行漏洞。' },
  { id: 'v5', cveId: 'CVE-2024-22252', title: 'VMware Workstation heap overflow', cvss: 7.8, severity: 'high', status: 'resolved', affectedAssets: ['Workstation-Group-A'], discoveredAt: '2024-04-03', description: 'VMware Workstation 存在堆溢出漏洞，可在宿主机上执行代码。' },
  { id: 'v6', cveId: 'CVE-2024-21413', title: 'Microsoft Outlook moniker link', cvss: 7.5, severity: 'high', status: 'resolved', affectedAssets: ['Mail-Server-01', 'Workstations-ALL'], discoveredAt: '2024-03-28', description: 'Microsoft Outlook 存在 Moniker 链接漏洞，可泄露 NTLM 凭据。' },
  { id: 'v7', cveId: 'CVE-2024-27198', title: 'TeamCity auth bypass via alternate path', cvss: 7.2, severity: 'medium', status: 'accepted', affectedAssets: ['CI-TeamCity-01'], discoveredAt: '2024-04-02', description: 'JetBrains TeamCity 存在备用路径认证绕过漏洞。' },
  { id: 'v8', cveId: 'CVE-2024-1709', title: 'ConnectWise ScreenConnect auth bypass', cvss: 6.5, severity: 'medium', status: 'remediating', affectedAssets: ['Remote-Support-01'], discoveredAt: '2024-04-01', description: 'ConnectWise ScreenConnect 存在认证绕过漏洞。' },
  { id: 'v9', cveId: 'CVE-2024-22262', title: 'Spring Framework URL parsing', cvss: 5.6, severity: 'medium', status: 'risk-accepted', affectedAssets: ['App-Server-01'], discoveredAt: '2024-03-25', description: 'Spring Framework URL 解析不一致可能导致安全绕过。' },
  { id: 'v10', cveId: 'CVE-2024-22259', title: 'Spring Framework input validation', cvss: 4.3, severity: 'low', status: 'resolved', affectedAssets: ['App-Server-02'], discoveredAt: '2024-03-20', description: 'Spring Framework 存在输入验证不足问题。' },
];

// ── Helpers ──

const SEVERITY_VARIANT: Record<VulnSeverity, 'critical' | 'high' | 'medium' | 'low'> = {
  critical: 'critical', high: 'high', medium: 'medium', low: 'low',
};

const SEVERITY_LABEL: Record<VulnSeverity, string> = {
  critical: '严重', high: '高危', medium: '中危', low: '低危',
};

const STATUS_LABEL: Record<VulnStatus, string> = {
  open: '待处理',
  accepted: '已确认',
  remediating: '修复中',
  resolved: '已修复',
  'risk-accepted': '风险接受',
};

const STATUS_COLOR: Record<VulnStatus, string> = {
  open: '#3b82f6',
  accepted: '#f59e0b',
  remediating: '#f97316',
  resolved: '#22c55e',
  'risk-accepted': '#6b7280',
};

function cvssColor(score: number): string {
  if (score >= 9) return '#ef4444';
  if (score >= 7) return '#f97316';
  if (score >= 4) return '#eab308';
  return '#22c55e';
}

// ── Mini Pie Chart SVG ──

const PieChart: React.FC<{ data: { label: string; count: number; color: string }[] }> = ({ data }) => {
  const total = data.reduce((s, d) => s + d.count, 0);
  const cx = 80, cy = 80, r = 60;
  const circumference = 2 * Math.PI * r;

  let cumulative = 0;
  const arcs = data.map((d) => {
    const fraction = d.count / total;
    const dashLen = fraction * circumference;
    const dashOffset = -cumulative * circumference;
    cumulative += fraction;
    return { ...d, dashLen, dashOffset, fraction };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={160} height={160} viewBox="0 0 160 160">
        {arcs.map((arc, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={arc.color}
            strokeWidth={24}
            strokeDasharray={`${arc.dashLen} ${circumference - arc.dashLen}`}
            strokeDashoffset={arc.dashOffset}
            transform={`rotate(-90 ${cx} ${cy})`}
            className="transition-all duration-500"
          />
        ))}
      </svg>
      <div className="space-y-1.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
            <span className="text-white/60">{d.label}</span>
            <span className="text-white font-semibold ml-auto">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Component ──

export const VulnerabilitiesPage: React.FC = () => {
  const currentRole = useRoleContextStore((s) => s.currentRole);
  const theme = currentRole ? ROLE_THEMES[currentRole] : null;
  const accentColor = theme?.colors.primary ?? '#1e40af';

  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return MOCK_VULNS.filter((v) => {
      if (severityFilter !== 'all' && v.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;
      if (searchQuery && !v.cveId.toLowerCase().includes(searchQuery.toLowerCase()) && !v.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [severityFilter, statusFilter, searchQuery]);

  const stats = useMemo(() => ({
    total: MOCK_VULNS.length,
    critical: MOCK_VULNS.filter((v) => v.severity === 'critical').length,
    high: MOCK_VULNS.filter((v) => v.severity === 'high').length,
    patchRate: Math.round((MOCK_VULNS.filter((v) => v.status === 'resolved').length / MOCK_VULNS.length) * 100),
  }), []);

  const pieData = useMemo(() => [
    { label: '严重', count: MOCK_VULNS.filter((v) => v.severity === 'critical').length, color: '#ef4444' },
    { label: '高危', count: MOCK_VULNS.filter((v) => v.severity === 'high').length, color: '#f97316' },
    { label: '中危', count: MOCK_VULNS.filter((v) => v.severity === 'medium').length, color: '#eab308' },
    { label: '低危', count: MOCK_VULNS.filter((v) => v.severity === 'low').length, color: '#22c55e' },
  ], []);

  return (
    <div className="space-y-5">
      {/* ── Page Header ── */}
      <div>
        <h1 className="text-xl font-bold text-white">🐛 漏洞管理</h1>
        <p className="text-sm text-white/40 mt-0.5">漏洞发现、评估、修复跟踪与风险接受管理</p>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '漏洞总数', value: stats.total, icon: '📋', color: accentColor },
          { label: '严重漏洞', value: stats.critical, icon: '🔴', color: '#ef4444' },
          { label: '高危漏洞', value: stats.high, icon: '🟠', color: '#f97316' },
          { label: '补丁覆盖率', value: `${stats.patchRate}%`, icon: '🔧', color: '#22c55e' },
        ].map((s) => (
          <Card key={s.label} className="bg-[#0f1525] border-white/[0.06]">
            <CardContent className="p-3 flex items-center gap-3">
              <span className="text-xl">{s.icon}</span>
              <div>
                <div className="text-xl font-bold text-white">{s.value}</div>
                <div className="text-[10px] text-white/40">{s.label}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="搜索 CVE ID / 标题..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64 bg-[#0f1525] border-white/10 text-white text-xs placeholder:text-white/25"
        />
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-32 bg-[#0f1525] border-white/10 text-white text-xs">
            <SelectValue placeholder="严重程度" />
          </SelectTrigger>
          <SelectContent className="bg-[#0f1525] border-white/10">
            <SelectItem value="all" className="text-xs">全部严重程度</SelectItem>
            <SelectItem value="critical" className="text-xs">严重</SelectItem>
            <SelectItem value="high" className="text-xs">高危</SelectItem>
            <SelectItem value="medium" className="text-xs">中危</SelectItem>
            <SelectItem value="low" className="text-xs">低危</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-32 bg-[#0f1525] border-white/10 text-white text-xs">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent className="bg-[#0f1525] border-white/10">
            <SelectItem value="all" className="text-xs">全部状态</SelectItem>
            <SelectItem value="open" className="text-xs">待处理</SelectItem>
            <SelectItem value="accepted" className="text-xs">已确认</SelectItem>
            <SelectItem value="remediating" className="text-xs">修复中</SelectItem>
            <SelectItem value="resolved" className="text-xs">已修复</SelectItem>
            <SelectItem value="risk-accepted" className="text-xs">风险接受</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-white/30 ml-auto">共 {filtered.length} 条</span>
      </div>

      {/* ── Main Content: Table + Pie ── */}
      <div className="grid grid-cols-[1fr_260px] gap-4">
        {/* Table */}
        <Card className="bg-[#0f1525] border-white/[0.06] overflow-hidden">
          <div className="grid grid-cols-[100px_1fr_80px_80px_80px_100px_120px] gap-2 px-4 py-2.5 border-b border-white/[0.06] text-[10px] font-semibold text-white/40 uppercase">
            <span>CVE ID</span>
            <span>标题</span>
            <span>CVSS</span>
            <span>严重程度</span>
            <span>状态</span>
            <span>影响资产</span>
            <span>发现时间</span>
          </div>
          {filtered.map((v) => (
            <div
              key={v.id}
              className="grid grid-cols-[100px_1fr_80px_80px_80px_100px_120px] gap-2 px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors items-center"
            >
              <span className="text-xs text-blue-400 font-mono">{v.cveId}</span>
              <span className="text-xs text-white truncate">{v.title}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold" style={{ color: cvssColor(v.cvss) }}>{v.cvss}</span>
                <Progress value={(v.cvss / 10) * 100} className="h-1.5 flex-1" />
              </div>
              <Badge variant={SEVERITY_VARIANT[v.severity]} className="text-[9px] px-1.5 py-0 justify-center">
                {SEVERITY_LABEL[v.severity]}
              </Badge>
              <span className="text-[10px]" style={{ color: STATUS_COLOR[v.status] }}>{STATUS_LABEL[v.status]}</span>
              <span className="text-[10px] text-white/40 truncate">{v.affectedAssets.length} 台</span>
              <span className="text-[10px] text-white/30">{v.discoveredAt}</span>
            </div>
          ))}
        </Card>

        {/* Pie Chart Panel */}
        <Card className="bg-[#0f1525] border-white/[0.06]">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-white/50">漏洞分布</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChart data={pieData} />
          </CardContent>
        </Card>
      </div>

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

export default VulnerabilitiesPage;
