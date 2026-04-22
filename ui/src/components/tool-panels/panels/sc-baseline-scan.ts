/**
 * sc-baseline-scan - Security Baseline Configuration Scanner
 * CIS/NIST/STIG benchmark scanning, compliance gap analysis, drift detection, remediation tracking
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
type ScanStatus = 'idle' | 'scanning' | 'completed' | 'failed' | 'scheduled';
type BenchmarkType = 'cis' | 'nist' | 'stig' | 'hipaa' | 'pci-dss' | 'iso27001';
type ComplianceState = 'compliant' | 'non-compliant' | 'partial' | 'not-assessed';
type RemediationPriority = 'immediate' | 'high' | 'normal' | 'low';

interface BenchmarkProfile {
  id: string;
  name: string;
  type: BenchmarkType;
  version: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  score: number;
  lastScan: string;
  targetSystem: string;
  osVersion: string;
}

interface ScanFinding {
  id: string;
  benchmarkId: string;
  ruleId: string;
  title: string;
  severity: SeverityLevel;
  status: 'open' | 'remediated' | 'accepted-risk' | 'false-positive' | 'in-progress';
  category: string;
  description: string;
  currentConfig: string;
  expectedConfig: string;
  remediation: string;
  remediationComplexity: 'low' | 'medium' | 'high';
  cveReferences: string[];
  discoveredAt: string;
  remediatedAt?: string;
  assignedTo?: string;
  notes?: string;
}

interface DriftEvent {
  id: string;
  findingId: string;
  timestamp: string;
  previousValue: string;
  newValue: string;
  changedBy: string;
  changeSource: 'manual' | 'automation' | 'package-update' | 'policy-change' | 'unknown';
  approved: boolean;
}

interface ScanSchedule {
  id: string;
  name: string;
  benchmarkType: BenchmarkType;
  targets: string[];
  cronExpression: string;
  enabled: boolean;
  lastRun: string;
  nextRun: string;
  notifications: boolean;
}

interface ComplianceSummary {
  benchmarkType: BenchmarkType;
  totalProfiles: number;
  compliantCount: number;
  nonCompliantCount: number;
  partialCount: number;
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface TrendDataPoint {
  date: string;
  score: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

@customElement('sc-baseline-scan')
export class ScBaselineScan extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .controls-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
    .search-box { padding: 8px 12px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 13px; flex: 1; min-width: 200px; outline: none; }
    .search-box:focus { border-color: #f59e0b; }
    .filter-select { padding: 8px 12px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 13px; outline: none; cursor: pointer; }
    .filter-select:focus { border-color: #f59e0b; }
    .btn { padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; transition: all 0.2s; }
    .btn:hover { border-color: #f59e0b; }
    .btn.primary { background: #1e40af; border-color: #3b82f6; color: white; }
    .btn.primary:hover { background: #2563eb; }
    .btn.danger { background: #450a0a; border-color: #7f1d1d; color: #fca5a5; }
    .btn.success { background: #052e16; border-color: #166534; color: #86efac; }
    .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .score-card { background: #0a0e17; border-radius: 8px; padding: 12px; text-align: center; border: 1px solid #1e293b; }
    .score-val { font-size: 26px; font-weight: 700; }
    .score-lbl { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 600; margin-top: 2px; }
    .tabs { display: flex; gap: 0; margin-bottom: 12px; border-bottom: 1px solid #374151; }
    .tab { padding: 8px 16px; font-size: 12px; font-weight: 600; border: none; background: transparent; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; }
    .tab.active { color: #f59e0b; border-bottom-color: #f59e0b; }
    .tab:hover { color: #e2e8f0; }
    .bench-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .bench-card { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.2s; }
    .bench-card:hover { border-color: #4b5563; transform: translateY(-1px); }
    .bench-card.selected { border-color: #f59e0b; box-shadow: 0 0 0 1px #f59e0b; }
    .bench-name { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
    .bench-meta { font-size: 11px; color: #94a3b8; margin-bottom: 8px; display: flex; gap: 10px; }
    .bench-score-bar { height: 6px; background: #0a0e17; border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
    .bench-score-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .bench-stats { display: flex; justify-content: space-between; font-size: 10px; }
    .findings-list { display: flex; flex-direction: column; gap: 6px; max-height: 500px; overflow-y: auto; }
    .finding-item { background: #1f2937; border: 1px solid #374151; border-radius: 6px; padding: 12px; cursor: pointer; transition: all 0.2s; }
    .finding-item:hover { border-color: #4b5563; }
    .finding-item.expanded { border-color: #f59e0b; }
    .finding-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .finding-title { font-size: 13px; font-weight: 600; flex: 1; }
    .finding-badges { display: flex; gap: 4px; flex-shrink: 0; }
    .badge { font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .badge-critical { background: #450a0a; color: #fca5a5; }
    .badge-high { background: #431407; color: #fdba74; }
    .badge-medium { background: #422006; color: #fde047; }
    .badge-low { background: #052e16; color: #86efac; }
    .badge-info { background: #172554; color: #93c5fd; }
    .badge-open { background: #1e293b; color: #94a3b8; }
    .badge-remediated { background: #052e16; color: #86efac; }
    .badge-in-progress { background: #1e3a8a; color: #93c5fd; }
    .finding-meta { font-size: 11px; color: #94a3b8; margin-top: 4px; }
    .finding-detail { margin-top: 10px; padding-top: 10px; border-top: 1px solid #374151; display: none; }
    .finding-item.expanded .finding-detail { display: block; }
    .finding-desc { font-size: 12px; color: #cbd5e1; line-height: 1.5; margin-bottom: 8px; }
    .config-diff { background: #0a0e17; border-radius: 6px; padding: 10px; margin-bottom: 8px; font-family: monospace; font-size: 12px; }
    .config-current { color: #fca5a5; }
    .config-expected { color: #86efac; }
    .remediation-box { background: #052e16; border: 1px solid #166534; border-radius: 6px; padding: 10px; font-size: 12px; }
    .remediation-box strong { color: #86efac; }
    .drift-timeline { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
    .drift-item { display: flex; gap: 10px; align-items: flex-start; font-size: 11px; }
    .drift-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 3px; flex-shrink: 0; }
    .drift-dot.approved { background: #22c55e; }
    .drift-dot.unapproved { background: #ef4444; }
    .chart-container { background: #0a0e17; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .chart-title { font-size: 13px; font-weight: 700; margin-bottom: 12px; }
    .svg-chart { width: 100%; }
    .form-section { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .form-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-label { font-size: 11px; font-weight: 600; color: #94a3b8; }
    .form-input { padding: 8px 10px; border-radius: 6px; border: 1px solid #374151; background: #0a0e17; color: #e2e8f0; font-size: 13px; outline: none; }
    .form-input:focus { border-color: #f59e0b; }
    .form-actions { display: flex; gap: 8px; margin-top: 12px; }
    .history-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .history-table th { text-align: left; padding: 8px 10px; border-bottom: 1px solid #374151; color: #94a3b8; font-weight: 600; font-size: 11px; }
    .history-table td { padding: 8px 10px; border-bottom: 1px solid #1e293b; }
    .history-table tr:hover td { background: #1f2937; }
    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    .export-btn { position: relative; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .scanning { animation: pulse 1.5s infinite; }
  `;

  @state() private _searchQuery = '';
  @state() private _severityFilter: SeverityLevel | 'all' = 'all';
  @state() private _statusFilter = 'all';
  @state() private _activeTab: 'benchmarks' | 'findings' | 'drift' | 'schedule' | 'export' = 'benchmarks';
  @state() private _expandedFinding: string | null = null;
  @state() private _scanStatus: ScanStatus = 'idle';
  @state() private _selectedBenchmark: string | null = null;
  @state() private _showNewScheduleForm = false;
  @state() private _historyPage = 0;

  private _benchmarks: BenchmarkProfile[] = [
    { id: 'b1', name: 'CIS Benchmark: Windows Server 2022', type: 'cis', version: '2.3.0', totalChecks: 387, passedChecks: 289, failedChecks: 72, warningChecks: 26, score: 75, lastScan: '2026-04-22T14:30:00Z', targetSystem: 'PROD-WIN-01', osVersion: 'Windows Server 2022 21H2' },
    { id: 'b2', name: 'CIS Benchmark: Ubuntu 22.04 LTS', type: 'cis', version: '1.1.0', totalChecks: 215, passedChecks: 178, failedChecks: 24, warningChecks: 13, score: 83, lastScan: '2026-04-22T10:15:00Z', targetSystem: 'PROD-LNX-01', osVersion: 'Ubuntu 22.04.3 LTS' },
    { id: 'b3', name: 'CIS Benchmark: Kubernetes v1.28', type: 'cis', version: '1.8.0', totalChecks: 168, passedChecks: 112, failedChecks: 42, warningChecks: 14, score: 67, lastScan: '2026-04-21T18:00:00Z', targetSystem: 'k8s-cluster-prod', osVersion: 'Kubernetes 1.28.5' },
    { id: 'b4', name: 'NIST SP 800-53 Rev5', type: 'nist', version: 'Rev5', totalChecks: 520, passedChecks: 416, failedChecks: 68, warningChecks: 36, score: 80, lastScan: '2026-04-20T09:00:00Z', targetSystem: 'Enterprise-wide', osVersion: 'Multi-platform' },
    { id: 'b5', name: 'DISA STIG: RHEL 9', type: 'stig', version: 'V1R5', totalChecks: 298, passedChecks: 232, failedChecks: 48, warningChecks: 18, score: 78, lastScan: '2026-04-22T06:00:00Z', targetSystem: 'PROD-RHEL-01', osVersion: 'RHEL 9.3' },
    { id: 'b6', name: 'PCI DSS v4.0', type: 'pci-dss', version: '4.0.1', totalChecks: 250, passedChecks: 215, failedChecks: 22, warningChecks: 13, score: 86, lastScan: '2026-04-19T12:00:00Z', targetSystem: 'Payment Gateway', osVersion: 'CentOS 8 + PostgreSQL 15' },
    { id: 'b7', name: 'HIPAA Security Rule', type: 'hipaa', version: '2023', totalChecks: 180, passedChecks: 148, failedChecks: 19, warningChecks: 13, score: 82, lastScan: '2026-04-21T15:00:00Z', targetSystem: 'EHR Systems', osVersion: 'Windows Server 2019' },
    { id: 'b8', name: 'CIS Benchmark: Docker CE', type: 'cis', version: '1.4.0', totalChecks: 78, passedChecks: 55, failedChecks: 16, warningChecks: 7, score: 71, lastScan: '2026-04-22T11:30:00Z', targetSystem: 'Docker Host PROD', osVersion: 'Docker 24.0.7' },
  ];

  private _findings: ScanFinding[] = [
    { id: 'f1', benchmarkId: 'b1', ruleId: '2.3.1.1', title: 'Ensure Windows Firewall is enabled', severity: 'critical', status: 'open', category: 'Network Security', description: 'Windows Firewall is currently disabled on all profiles (Domain, Private, Public). This exposes the system to unauthorized network access.', currentConfig: 'EnableFirewall=0 (all profiles)', expectedConfig: 'EnableFirewall=1 (all profiles)', remediation: 'Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True', remediationComplexity: 'low', cveReferences: ['CVE-2024-21351'], discoveredAt: '2026-04-22T14:30:00Z', assignedTo: 'sysops-team' },
    { id: 'f2', benchmarkId: 'b1', ruleId: '2.2.34', title: 'Ensure LAPS is installed and enabled', severity: 'high', status: 'in-progress', category: 'Access Control', description: 'Local Administrator Password Solution (LAPS) is not installed. Local admin passwords are not being rotated.', currentConfig: 'LAPS: Not Installed', expectedConfig: 'LAPS: Installed, AdmPwd GPO deployed', remediation: 'Install LAPS via Server Manager, configure GPO for password rotation', remediationComplexity: 'medium', cveReferences: [], discoveredAt: '2026-04-22T14:30:00Z', assignedTo: 'ad-team' },
    { id: 'f3', benchmarkId: 'b3', ruleId: '5.2.6', title: 'Ensure kubelet anonymous auth is disabled', severity: 'critical', status: 'open', category: 'Kubernetes Security', description: 'Kubelet anonymous authentication is enabled, allowing unauthenticated access to the kubelet API.', currentConfig: 'anonymous-auth=true', expectedConfig: 'anonymous-auth=false', remediation: 'Edit /etc/kubernetes/kubelet.conf and set --anonymous-auth=false, then restart kubelet', remediationComplexity: 'low', cveReferences: ['CVE-2023-2727'], discoveredAt: '2026-04-21T18:00:00Z', assignedTo: 'k8s-team' },
    { id: 'f4', benchmarkId: 'b3', ruleId: '5.3.2', title: 'Ensure TLS encryption for etcd is configured', severity: 'high', status: 'remediated', category: 'Kubernetes Security', description: 'etcd communications are not encrypted with TLS. Data in transit between etcd peers is unencrypted.', currentConfig: 'peer-cert-file="" (not set)', expectedConfig: 'peer-cert-file=/etc/kubernetes/pki/etcd/peer.crt', remediation: 'Generate TLS certs and configure etcd with --peer-client-cert-auth=true', remediationComplexity: 'high', cveReferences: [], discoveredAt: '2026-04-15T10:00:00Z', remediatedAt: '2026-04-20T14:00:00Z', assignedTo: 'k8s-team' },
    { id: 'f5', benchmarkId: 'b2', ruleId: '1.4.1', title: 'Ensure permissions on bootloader config are configured', severity: 'high', status: 'open', category: 'File System', description: 'Bootloader configuration file (grub.cfg) is world-readable, allowing potential boot parameter tampering.', currentConfig: '/boot/grub/grub.cfg: 644 (world-readable)', expectedConfig: '/boot/grub/grub.cfg: 400 (owner-read-only)', remediation: 'chmod 400 /boot/grub/grub.cfg && chown root:root /boot/grub/grub.cfg', remediationComplexity: 'low', cveReferences: [], discoveredAt: '2026-04-22T10:15:00Z', assignedTo: 'sysops-team' },
    { id: 'f6', benchmarkId: 'b2', ruleId: '3.1.2', title: 'Ensure wireless interfaces are disabled', severity: 'medium', status: 'accepted-risk', category: 'Network Security', description: 'Wireless network interfaces are active on a production server.', currentConfig: 'wlan0: UP, RUNNING', expectedConfig: 'wlan0: DOWN or removed', remediation: 'nmcli radio wifi off; echo "blacklist wl" >> /etc/modprobe.d/blacklist.conf', remediationComplexity: 'low', cveReferences: [], discoveredAt: '2026-04-22T10:15:00Z', notes: 'Accepted: physical isolation, no wireless AP in datacenter' },
    { id: 'f7', benchmarkId: 'b5', ruleId: 'RHEL-09-252030', title: 'Ensure SSH root login is disabled', severity: 'critical', status: 'remediated', category: 'Access Control', description: 'SSH direct root login is permitted, increasing brute-force attack surface.', currentConfig: 'PermitRootLogin yes', expectedConfig: 'PermitRootLogin no', remediation: 'Edit /etc/ssh/sshd_config: set PermitRootLogin no, restart sshd', remediationComplexity: 'low', cveReferences: [], discoveredAt: '2026-04-18T06:00:00Z', remediatedAt: '2026-04-19T09:00:00Z', assignedTo: 'sysops-team' },
    { id: 'f8', benchmarkId: 'b8', ruleId: '4.1', title: 'Ensure a user for the container has been created', severity: 'high', status: 'open', category: 'Container Security', description: 'Docker containers are running as root user. Containers should run as non-root users.', currentConfig: 'USER: root (default)', expectedConfig: 'USER appuser (non-privileged)', remediation: 'Add USER directive in Dockerfile after FROM statement', remediationComplexity: 'low', cveReferences: [], discoveredAt: '2026-04-22T11:30:00Z', assignedTo: 'devops-team' },
    { id: 'f9', benchmarkId: 'b4', ruleId: 'AC-2(7)', title: 'Ensure unsuccessful login attempts are monitored', severity: 'medium', status: 'open', category: 'Audit & Monitoring', description: 'No monitoring or alerting configured for repeated failed login attempts across the enterprise.', currentConfig: 'Failed login monitoring: Not configured', expectedConfig: 'SIEM rule: >5 failed logins in 5min triggers alert', remediation: 'Configure SIEM correlation rule for failed auth events, enable email/SMS alerts', remediationComplexity: 'medium', cveReferences: [], discoveredAt: '2026-04-20T09:00:00Z', assignedTo: 'soc-team' },
    { id: 'f10', benchmarkId: 'b6', ruleId: 'Req-2.2', title: 'Ensure system components are patched', severity: 'high', status: 'in-progress', category: 'Patch Management', description: '3 critical security patches are pending on the payment gateway server (last patched 45 days ago).', currentConfig: 'Last patch: 2026-03-08, 3 critical pending', expectedConfig: 'All critical patches applied within 30 days', remediation: 'Schedule maintenance window, apply 3 critical patches, reboot, verify services', remediationComplexity: 'medium', cveReferences: ['CVE-2024-3094', 'CVE-2024-27198'], discoveredAt: '2026-04-19T12:00:00Z', assignedTo: 'patch-team' },
    { id: 'f11', benchmarkId: 'b1', ruleId: '17.1.1', title: 'Ensure audit log retention is configured', severity: 'medium', status: 'open', category: 'Audit', description: 'Windows Security Event Log retention is set to overwrite as needed instead of a specific retention period.', currentConfig: 'Retention: Overwrite as needed', expectedConfig: 'Retention: 180 days minimum', remediation: 'wevtutil sl Security /rt:true /ms:104857600', remediationComplexity: 'low', cveReferences: [], discoveredAt: '2026-04-22T14:30:00Z', assignedTo: 'sysops-team' },
    { id: 'f12', benchmarkId: 'b7', ruleId: '164.308(a)(1)', title: 'Ensure security management process is documented', severity: 'low', status: 'open', category: 'Compliance', description: 'Security management process documentation is outdated (last review: 2025-09). Annual review required.', currentConfig: 'Last review: 2025-09-15', expectedConfig: 'Review within last 12 months', remediation: 'Schedule and complete annual security management process review with CISO', remediationComplexity: 'low', cveReferences: [], discoveredAt: '2026-04-21T15:00:00Z', assignedTo: 'compliance-team' },
  ];

  private _driftEvents: DriftEvent[] = [
    { id: 'd1', findingId: 'f7', timestamp: '2026-04-18T06:05:00Z', previousValue: 'PermitRootLogin no', newValue: 'PermitRootLogin yes', changedBy: 'admin_john', changeSource: 'manual', approved: false },
    { id: 'd2', findingId: 'f1', timestamp: '2026-04-20T09:30:00Z', previousValue: 'EnableFirewall=1', newValue: 'EnableFirewall=0', changedBy: 'system', changeSource: 'automation', approved: false },
    { id: 'd3', findingId: 'f3', timestamp: '2026-04-21T16:00:00Z', previousValue: 'anonymous-auth=false', newValue: 'anonymous-auth=true', changedBy: 'deploy_pipeline', changeSource: 'automation', approved: false },
    { id: 'd4', findingId: 'f4', timestamp: '2026-04-20T14:30:00Z', previousValue: 'peer-cert-file=""', newValue: 'peer-cert-file=/etc/kubernetes/pki/etcd/peer.crt', changedBy: 'k8s_admin', changeSource: 'manual', approved: true },
    { id: 'd5', findingId: 'f5', timestamp: '2026-04-22T08:00:00Z', previousValue: '/boot/grub/grub.cfg: 400', newValue: '/boot/grub/grub.cfg: 644', changedBy: 'system', changeSource: 'package-update', approved: false },
  ];

  private _schedules: ScanSchedule[] = [
    { id: 's1', name: 'Daily CIS Windows Scan', benchmarkType: 'cis', targets: ['PROD-WIN-01', 'PROD-WIN-02'], cronExpression: '0 2 * * *', enabled: true, lastRun: '2026-04-22T02:00:00Z', nextRun: '2026-04-23T02:00:00Z', notifications: true },
    { id: 's2', name: 'Weekly CIS Linux Scan', benchmarkType: 'cis', targets: ['PROD-LNX-01', 'PROD-RHEL-01'], cronExpression: '0 3 * * 1', enabled: true, lastRun: '2026-04-21T03:00:00Z', nextRun: '2026-04-28T03:00:00Z', notifications: true },
    { id: 's3', name: 'Monthly K8s CIS Scan', benchmarkType: 'cis', targets: ['k8s-cluster-prod'], cronExpression: '0 4 1 * *', enabled: true, lastRun: '2026-04-01T04:00:00Z', nextRun: '2026-05-01T04:00:00Z', notifications: true },
    { id: 's4', name: 'Quarterly PCI DSS Scan', benchmarkType: 'pci-dss', targets: ['Payment Gateway'], cronExpression: '0 0 1 1,4,7,10 *', enabled: true, lastRun: '2026-04-01T00:00:00Z', nextRun: '2026-07-01T00:00:00Z', notifications: true },
  ];

  private _trendData: TrendDataPoint[] = [
    { date: '2026-01', score: 68, critical: 18, high: 32, medium: 45, low: 28 },
    { date: '2026-02', score: 71, critical: 15, high: 29, medium: 42, low: 30 },
    { date: '2026-03', score: 74, critical: 12, high: 27, medium: 40, low: 32 },
    { date: '2026-04', score: 78, critical: 8, high: 24, medium: 38, low: 35 },
  ];

  private _getScoreColor(score: number): string {
    if (score >= 90) return '#22c55e';
    if (score >= 80) return '#84cc16';
    if (score >= 70) return '#eab308';
    if (score >= 60) return '#f97316';
    return '#ef4444';
  }

  private _getSeverityBadgeClass(sev: SeverityLevel): string {
    const map: Record<SeverityLevel, string> = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low', info: 'badge-info' };
    return map[sev] || 'badge-info';
  }

  private _renderTrendChart(): unknown {
    const w = 500, h = 140, pad = 30;
    const maxScore = 100;
    const points = this._trendData;
    const barW = (w - pad * 2) / points.length - 8;
    return html`
      <div class="chart-container">
        <div class="chart-title">Compliance Score Trend</div>
        <svg class="svg-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
          ${points.map((p, i) => {
            const x = pad + i * (barW + 8) + barW / 2;
            const barH = (p.score / maxScore) * (h - pad - 20);
            const y = h - pad - barH;
            return html`
              <rect x="${x - barW / 2}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${this._getScoreColor(p.score)}" opacity="0.8"/>
              <text x="${x}" y="${y - 4}" text-anchor="middle" fill="#e2e8f0" font-size="10" font-weight="700">${p.score}</text>
              <text x="${x}" y="${h - 8}" text-anchor="middle" fill="#94a3b8" font-size="9">${p.date}</text>
            `;
          })}
        </svg>
      </div>`;
  }

  private _renderSeverityDonut(): unknown {
    const crit = this._findings.filter(f => f.severity === 'critical' && f.status === 'open').length;
    const high = this._findings.filter(f => f.severity === 'high' && f.status === 'open').length;
    const med = this._findings.filter(f => f.severity === 'medium' && f.status === 'open').length;
    const low = this._findings.filter(f => f.severity === 'low' && f.status === 'open').length;
    const total = crit + high + med + low || 1;
    const data = [
      { label: 'Critical', val: crit, color: '#ef4444' },
      { label: 'High', val: high, color: '#f97316' },
      { label: 'Medium', val: med, color: '#eab308' },
      { label: 'Low', val: low, color: '#22c55e' },
    ];
    const cx = 60, cy = 60, r = 40, sw = 14;
    let cumAngle = -90;
    return html`
      <div class="chart-container">
        <div class="chart-title">Open Findings by Severity</div>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <svg viewBox="0 0 120 120" width="120" height="120">
            ${data.filter(d => d.val > 0).map(d => {
              const angle = (d.val / total) * 360;
              const startAngle = cumAngle;
              const endAngle = cumAngle + angle;
              cumAngle = endAngle;
              const s = (startAngle * Math.PI) / 180;
              const e = (endAngle * Math.PI) / 180;
              const largeArc = angle > 180 ? 1 : 0;
              const x1 = cx + r * Math.cos(s);
              const y1 = cy + r * Math.sin(s);
              const x2 = cx + r * Math.cos(e);
              const y2 = cy + r * Math.sin(e);
              return html`<path d="M${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2}" fill="none" stroke="${d.color}" stroke-width="${sw}" stroke-linecap="round"/>`;
            })}
            <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#e2e8f0" font-size="18" font-weight="700">${total}</text>
          </svg>
          <div style="display:flex;flex-direction:column;gap:4px;">
            ${data.map(d => html`<div style="display:flex;align-items:center;gap:6px;font-size:12px;">
              <span style="width:10px;height:10px;border-radius:2px;background:${d.color};flex-shrink:0;"></span>
              <span style="color:#94a3b8;">${d.label}:</span>
              <span style="font-weight:700;">${d.val}</span>
            </div>`)}
          </div>
        </div>
      </div>`;
  }

  private _toggleFinding(id: string) {
    this._expandedFinding = this._expandedFinding === id ? null : id;
  }

  private _getFilteredFindings(): ScanFinding[] {
    let result = this._findings;
    if (this._selectedBenchmark) result = result.filter(f => f.benchmarkId === this._selectedBenchmark);
    if (this._severityFilter !== 'all') result = result.filter(f => f.severity === this._severityFilter);
    if (this._statusFilter !== 'all') result = result.filter(f => f.status === this._statusFilter);
    if (this._searchQuery) {
      const q = this._searchQuery.toLowerCase();
      result = result.filter(f => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.ruleId.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
    }
    return result;
  }

  private _startScan() {
    this._scanStatus = 'scanning';
    setTimeout(() => { this._scanStatus = 'completed'; }, 3000);
  }

  private _exportData(format: 'json' | 'csv') {
    const data = this._getFilteredFindings().map(f => ({
      ruleId: f.ruleId, title: f.title, severity: f.severity, status: f.status,
      category: f.category, benchmarkId: f.benchmarkId, remediation: f.remediation
    }));
    const blob = new Blob(
      [format === 'json' ? JSON.stringify(data, null, 2) : 'Rule ID,Title,Severity,Status,Category,Remediation\n' + data.map(r => `"${r.ruleId}","${r.title}","${r.severity}","${r.status}","${r.category}","${r.remediation}"`).join('\n')],
      { type: format === 'json' ? 'application/json' : 'text/csv' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `baseline-findings.${format}`; a.click();
    URL.revokeObjectURL(url);
  }

  render() {
    const openFindings = this._findings.filter(f => f.status === 'open');
    const criticalOpen = openFindings.filter(f => f.severity === 'critical').length;
    const highOpen = openFindings.filter(f => f.severity === 'high').length;
    const avgScore = Math.round(this._benchmarks.reduce((s, b) => s + b.score, 0) / this._benchmarks.length);
    const filtered = this._getFilteredFindings();

    return html`
      <div class="panel">
        <div class="pt">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
          Security Baseline Scanner
        </div>

        <div class="score-grid">
          <div class="score-card">
            <div class="score-val" style="color:${this._getScoreColor(avgScore)}">${avgScore}%</div>
            <div class="score-lbl">Avg Compliance</div>
          </div>
          <div class="score-card">
            <div class="score-val" style="color:#ef4444">${criticalOpen}</div>
            <div class="score-lbl">Critical Open</div>
          </div>
          <div class="score-card">
            <div class="score-val" style="color:#f97316">${highOpen}</div>
            <div class="score-lbl">High Open</div>
          </div>
          <div class="score-card">
            <div class="score-val">${this._benchmarks.length}</div>
            <div class="score-lbl">Benchmarks</div>
          </div>
          <div class="score-card">
            <div class="score-val">${this._findings.filter(f => f.status === 'remediated').length}</div>
            <div class="score-lbl">Remediated</div>
          </div>
        </div>

        <div class="controls-row">
          <input class="search-box" type="text" placeholder="Search findings by rule, title, category..." .value=${this._searchQuery} @input=${(e: Event) => { this._searchQuery = (e.target as HTMLInputElement).value; }}/>
          <select class="filter-select" @change=${(e: Event) => { this._severityFilter = (e.target as HTMLSelectElement).value as SeverityLevel | 'all'; }}>
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select class="filter-select" @change=${(e: Event) => { this._statusFilter = (e.target as HTMLSelectElement).value; }}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="remediated">Remediated</option>
            <option value="accepted-risk">Accepted Risk</option>
          </select>
          <button class="btn primary" @click=${() => this._startScan()}>${this._scanStatus === 'scanning' ? html`<span class="scanning">Scanning...</span>` : 'Run Scan'}</button>
          <button class="btn" @click=${() => this._exportData('json')}>Export JSON</button>
          <button class="btn" @click=${() => this._exportData('csv')}>Export CSV</button>
        </div>

        <div class="tabs">
          <button class="tab ${this._activeTab === 'benchmarks' ? 'active' : ''}" @click=${() => { this._activeTab = 'benchmarks'; }}>Benchmarks</button>
          <button class="tab ${this._activeTab === 'findings' ? 'active' : ''}" @click=${() => { this._activeTab = 'findings'; }}>Findings (${filtered.length})</button>
          <button class="tab ${this._activeTab === 'drift' ? 'active' : ''}" @click=${() => { this._activeTab = 'drift'; }}>Config Drift</button>
          <button class="tab ${this._activeTab === 'schedule' ? 'active' : ''}" @click=${() => { this._activeTab = 'schedule'; }}>Schedules</button>
          <button class="tab ${this._activeTab === 'export' ? 'active' : ''}" @click=${() => { this._activeTab = 'export'; }}>History</button>
        </div>

        ${this._activeTab === 'benchmarks' ? html`
          ${this._renderSeverityDonut()}
          ${this._renderTrendChart()}
          <div class="bench-grid">
            ${this._benchmarks.map(b => html`
              <div class="bench-card ${this._selectedBenchmark === b.id ? 'selected' : ''}" @click=${() => { this._selectedBenchmark = this._selectedBenchmark === b.id ? null : b.id; }}>
                <div class="bench-name">${b.name}</div>
                <div class="bench-meta">
                  <span>v${b.version}</span>
                  <span>${b.targetSystem}</span>
                </div>
                <div class="bench-score-bar">
                  <div class="bench-score-fill" style="width:${b.score}%;background:${this._getScoreColor(b.score)};"></div>
                </div>
                <div class="bench-stats">
                  <span style="color:#86efac">${b.passedChecks} passed</span>
                  <span style="color:#fca5a5">${b.failedChecks} failed</span>
                  <span style="color:#fde047">${b.warningChecks} warn</span>
                </div>
              </div>
            `)}
          </div>
        ` : nothing}

        ${this._activeTab === 'findings' ? html`
          <div class="findings-list">
            ${filtered.map(f => html`
              <div class="finding-item ${this._expandedFinding === f.id ? 'expanded' : ''}" @click=${() => this._toggleFinding(f.id)}>
                <div class="finding-header">
                  <div class="finding-title">[${f.ruleId}] ${f.title}</div>
                  <div class="finding-badges">
                    <span class="badge ${this._getSeverityBadgeClass(f.severity)}">${f.severity}</span>
                    <span class="badge badge-${f.status === 'remediated' ? 'remediated' : f.status === 'in-progress' ? 'in-progress' : 'open'}">${f.status.replace('-', ' ')}</span>
                  </div>
                </div>
                <div class="finding-meta">${f.category} | ${f.benchmarkId.toUpperCase()} | Discovered: ${new Date(f.discoveredAt).toLocaleDateString()} ${f.assignedTo ? '| Assigned: ' + f.assignedTo : ''}</div>
                ${this._expandedFinding === f.id ? html`
                  <div class="finding-detail">
                    <div class="finding-desc">${f.description}</div>
                    <div class="config-diff">
                      <div class="config-current">Current: ${f.currentConfig}</div>
                      <div class="config-expected">Expected: ${f.expectedConfig}</div>
                    </div>
                    <div class="remediation-box">
                      <strong>Remediation (${f.remediationComplexity}):</strong><br/>
                      ${f.remediation}
                    </div>
                    ${f.cveReferences.length ? html`<div style="margin-top:8px;font-size:11px;color:#94a3b8;">CVE: ${f.cveReferences.map(c => html`<span style="color:#fca5a5;margin-right:8px;">${c}</span>`).join('')}</div>` : nothing}
                    ${f.notes ? html`<div style="margin-top:8px;font-size:11px;color:#94a3b8;font-style:italic;">Note: ${f.notes}</div>` : nothing}
                    <div style="margin-top:10px;display:flex;gap:6px;">
                      <button class="btn success" @click=${(e: Event) => { e.stopPropagation(); }}>Mark Remediated</button>
                      <button class="btn" @click=${(e: Event) => { e.stopPropagation(); }}>Accept Risk</button>
                      <button class="btn" @click=${(e: Event) => { e.stopPropagation(); }}>Assign</button>
                    </div>
                  </div>
                ` : nothing}
              </div>
            `)}
            ${filtered.length === 0 ? html`<div class="empty-state">No findings match the current filters</div>` : nothing}
          </div>
        ` : nothing}

        ${this._activeTab === 'drift' ? html`
          <div style="margin-bottom:12px;font-size:13px;color:#94a3b8;">Configuration drift events detected across monitored systems:</div>
          <div class="drift-timeline">
            ${this._driftEvents.map(d => html`
              <div class="finding-item" style="padding:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <span style="font-size:13px;font-weight:600;">Finding: ${d.findingId}</span>
                  <span class="badge ${d.approved ? 'badge-remediated' : 'badge-critical'}">${d.approved ? 'Approved' : 'Unauthorized'}</span>
                </div>
                <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">${new Date(d.timestamp).toLocaleString()} | Changed by: ${d.changedBy} | Source: ${d.changeSource.replace('-', ' ')}</div>
                <div class="config-diff" style="font-size:11px;">
                  <div class="config-current">Before: ${d.previousValue}</div>
                  <div class="config-expected">After: ${d.newValue}</div>
                </div>
              </div>
            `)}
          </div>
        ` : nothing}

        ${this._activeTab === 'schedule' ? html`
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:13px;color:#94a3b8;">Scheduled baseline scans</span>
            <button class="btn primary" @click=${() => { this._showNewScheduleForm = !this._showNewScheduleForm; }}>
              ${this._showNewScheduleForm ? 'Cancel' : 'New Schedule'}
            </button>
          </div>
          ${this._showNewScheduleForm ? html`
            <div class="form-section">
              <div class="form-title">Create Scan Schedule</div>
              <div class="form-grid">
                <div class="form-field">
                  <label class="form-label">Schedule Name</label>
                  <input class="form-input" type="text" placeholder="e.g., Daily CIS Scan"/>
                </div>
                <div class="form-field">
                  <label class="form-label">Benchmark Type</label>
                  <select class="form-input">
                    <option value="cis">CIS</option><option value="nist">NIST 800-53</option>
                    <option value="stig">STIG</option><option value="pci-dss">PCI DSS</option>
                    <option value="hipaa">HIPAA</option><option value="iso27001">ISO 27001</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="form-label">Cron Expression</label>
                  <input class="form-input" type="text" placeholder="0 2 * * *"/>
                </div>
                <div class="form-field">
                  <label class="form-label">Target Systems</label>
                  <input class="form-input" type="text" placeholder="Comma-separated hostnames"/>
                </div>
              </div>
              <div class="form-actions">
                <button class="btn success">Create Schedule</button>
                <button class="btn" @click=${() => { this._showNewScheduleForm = false; }}>Cancel</button>
              </div>
            </div>
          ` : nothing}
          <div class="findings-list">
            ${this._schedules.map(s => html`
              <div class="finding-item" style="padding:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <div style="font-size:13px;font-weight:600;">${s.name}</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:4px;">
                      ${s.benchmarkType.toUpperCase()} | Cron: ${s.cronExpression} | Targets: ${s.targets.join(', ')}
                    </div>
                    <div style="font-size:10px;color:#6b7280;margin-top:2px;">
                      Last: ${new Date(s.lastRun).toLocaleDateString()} | Next: ${new Date(s.nextRun).toLocaleDateString()}
                    </div>
                  </div>
                  <div style="display:flex;gap:6px;">
                    <span class="badge ${s.enabled ? 'badge-remediated' : 'badge-open'}">${s.enabled ? 'Enabled' : 'Disabled'}</span>
                    <button class="btn" style="font-size:10px;">Edit</button>
                  </div>
                </div>
              </div>
            `)}
          </div>
        ` : nothing}

        ${this._activeTab === 'export' ? html`
          <div style="margin-bottom:12px;font-size:13px;color:#94a3b8;">Scan execution history</div>
          <table class="history-table">
            <thead>
              <tr><th>Date</th><th>Benchmark</th><th>Target</th><th>Score</th><th>Findings</th><th>Duration</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr><td>Apr 22, 2026</td><td>CIS Windows Server</td><td>PROD-WIN-01</td><td style="color:#eab308">75%</td><td>72</td><td>4m 32s</td><td><span class="badge badge-remediated">Complete</span></td></tr>
              <tr><td>Apr 22, 2026</td><td>CIS Ubuntu 22.04</td><td>PROD-LNX-01</td><td style="color:#84cc16">83%</td><td>24</td><td>2m 15s</td><td><span class="badge badge-remediated">Complete</span></td></tr>
              <tr><td>Apr 22, 2026</td><td>CIS Docker</td><td>Docker Host PROD</td><td style="color:#eab308">71%</td><td>16</td><td>1m 48s</td><td><span class="badge badge-remediated">Complete</span></td></tr>
              <tr><td>Apr 21, 2026</td><td>CIS Kubernetes</td><td>k8s-cluster-prod</td><td style="color:#f97316">67%</td><td>42</td><td>6m 10s</td><td><span class="badge badge-remediated">Complete</span></td></tr>
              <tr><td>Apr 21, 2026</td><td>HIPAA</td><td>EHR Systems</td><td style="color:#84cc16">82%</td><td>19</td><td>3m 55s</td><td><span class="badge badge-remediated">Complete</span></td></tr>
              <tr><td>Apr 20, 2026</td><td>NIST 800-53</td><td>Enterprise-wide</td><td style="color:#84cc16">80%</td><td>68</td><td>12m 40s</td><td><span class="badge badge-remediated">Complete</span></td></tr>
              <tr><td>Apr 19, 2026</td><td>PCI DSS v4.0</td><td>Payment Gateway</td><td style="color:#84cc16">86%</td><td>22</td><td>5m 20s</td><td><span class="badge badge-remediated">Complete</span></td></tr>
            </tbody>
          </table>
        ` : nothing}
      </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-baseline-scan': ScBaselineScan; } }
