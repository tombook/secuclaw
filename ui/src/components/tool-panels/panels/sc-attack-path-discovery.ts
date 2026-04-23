/**
 * sc-attack-path-discovery — Network Attack Path Discovery (Security Ops Dark Capability)
 * Network asset inventory, trust relationship mapping, vulnerability overlay,
 * path scoring, mitigation recommendations, multi-path comparison
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

type AssetType = 'server' | 'workstation' | 'firewall' | 'router' | 'database' | 'cloud' | 'iot' | 'ad';
type AssetCriticality = 'critical' | 'high' | 'medium' | 'low';
type VulnSeverity = 'critical' | 'high' | 'medium' | 'low';
type PathStatus = 'discovered' | 'analyzing' | 'blocked' | 'exploitable';

interface NetworkAsset {
  id: string;
  name: string;
  type: AssetType;
  ip: string;
  zone: string;
  criticality: AssetCriticality;
  os?: string;
  services: { port: number; name: string; version: string }[];
  vulnerabilities: { id: string; name: string; severity: VulnSeverity; cvss: number; cve?: string }[];
  compromised: boolean;
}

interface TrustRelationship {
  id: string;
  source: string;
  target: string;
  type: 'trust' | 'admin' | 'service' | 'network' | 'credential';
  strength: number;
  description: string;
}

interface AttackPath {
  id: string;
  name: string;
  nodes: string[];
  edges: { from: string; to: string; type: string }[];
  totalRisk: number;
  exploitability: number;
  impact: number;
  steps: { asset: string; action: string; technique: string; difficulty: 'easy' | 'medium' | 'hard' }[];
  mitigations: { step: number; recommendation: string; effort: 'low' | 'medium' | 'high'; effectiveness: number }[];
}

interface AnalysisResult {
  id: string;
  timestamp: string;
  totalPaths: number;
  criticalPaths: number;
  assets: number;
  vulnerabilities: number;
  topPaths: AttackPath[];
  riskScore: number;
}

const ZONE_COLORS: Record<string, string> = {
  'dmz': '#f59e0b',
  'internal': '#3b82f6',
  'restricted': '#8b5cf6',
  'management': '#ef4444',
  'cloud': '#06b6d4',
  'iot': '#f97316',
};

@customElement('sc-attack-path-discovery')
export class ScAttackPathDiscovery extends LitElement {
  @property({ type: String }) panelId = 'attack-path-discovery';

  @state() private _assets: NetworkAsset[] = [];
  @state() private _trusts: TrustRelationship[] = [];
  @state() private _paths: AttackPath[] = [];
  @state() private _analysisResult: AnalysisResult | null = null;
  @state() private _selectedPath: AttackPath | null = null;
  @state() private _scanStatus: 'idle' | 'scanning' | 'analyzing' | 'complete' = 'idle';
  @state() private _scanProgress = 0;
  @state() private _activeTab: 'topology' | 'paths' | 'details' | 'report' = 'topology';
  @state() private _targetAsset = '';
  @state() private _entryPoints: string[] = [];
  @state() private _highlightedAsset: string | null = null;
  @state() private _zoom = 1;
  @state() private _showReport = false;
  @state() private _reportContent = '';
  @state() private _filterSeverity: VulnSeverity | 'all' = 'all';
  @state() private _filterZone: string = 'all';
  @state() private _autoAnalyze = true;
  @state() private _history: AnalysisResult[] = [];

  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #0f1117); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
    .title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .stats-bar { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }
    .stat { background: #1a1d27; border-radius: 8px; padding: 10px 16px; text-align: center; min-width: 100px; }
    .stat-value { font-size: 22px; font-weight: 700; }
    .stat-label { font-size: 11px; color: #9ca3af; margin-top: 2px; }
    .stat-critical .stat-value { color: #f87171; }
    .stat-high .stat-value { color: #fbbf24; }
    .stat-info .stat-value { color: #60a5fa; }

    .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #2a2d3a; }
    .tab { padding: 8px 16px; cursor: pointer; border: none; background: none; color: #6b7280; font-size: 13px; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .tab:hover { color: #d1d5db; }
    .tab.active { color: #e2e8f0; border-bottom-color: #3b82f6; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full { grid-column: 1 / -1; }
    label { font-size: 12px; color: #9ca3af; font-weight: 500; }
    input, select, textarea { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 6px; padding: 8px 12px; color: #e2e8f0; font-size: 13px; outline: none; font-family: inherit; }
    input:focus, select:focus { border-color: #3b82f6; }

    .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; font-family: inherit; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }
    .btn-secondary { background: #374151; color: #d1d5db; }
    .btn-secondary:hover:not(:disabled) { background: #4b5563; }
    .btn-sm { padding: 4px 10px; font-size: 11px; }
    .btn-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }

    .topo-container { background: #0a0c10; border: 1px solid #2a2d3a; border-radius: 8px; overflow: hidden; position: relative; }
    .topo-svg { width: 100%; height: 420px; }
    .topo-legend { display: flex; gap: 12px; padding: 8px 12px; background: #1a1d27; border-top: 1px solid #2a2d3a; flex-wrap: wrap; }
    .legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: #9ca3af; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; }

    .path-list { display: flex; flex-direction: column; gap: 8px; }
    .path-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.2s; }
    .path-card:hover { border-color: #3b82f6; }
    .path-card.selected { border-color: #3b82f6; background: #1e2a3a; }
    .path-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .path-meta { display: flex; gap: 12px; flex-wrap: wrap; font-size: 11px; }
    .risk-bar { height: 6px; background: #1a1d27; border-radius: 3px; margin-top: 8px; overflow: hidden; }
    .risk-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .risk-critical { background: linear-gradient(90deg, #dc2626, #f87171); }
    .risk-high { background: linear-gradient(90deg, #d97706, #fbbf24); }
    .risk-medium { background: linear-gradient(90deg, #2563eb, #60a5fa); }
    .risk-low { background: linear-gradient(90deg, #059669, #34d399); }

    .detail-panel { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; }
    .step-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid #2a2d3a; font-size: 13px; }
    .step-num { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .step-easy { background: #064e3b; color: #34d399; }
    .step-medium { background: #78350f; color: #fbbf24; }
    .step-hard { background: #7f1d1d; color: #f87171; }

    .mitigation-card { background: #1a1d27; border-left: 3px solid #3b82f6; padding: 10px 14px; margin-top: 8px; border-radius: 0 6px 6px 0; font-size: 12px; }
    .effort-low { color: #34d399; }
    .effort-medium { color: #fbbf24; }
    .effort-high { color: #f87171; }

    .report-box { background: #0a0c10; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; font-size: 12px; line-height: 1.8; max-height: 400px; overflow-y: auto; white-space: pre-wrap; font-family: 'JetBrains Mono', monospace; color: #d1d5db; }

    .asset-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .asset-table th { text-align: left; padding: 8px 12px; background: #1a1d27; color: #9ca3af; font-weight: 600; border-bottom: 1px solid #2a2d3a; }
    .asset-table td { padding: 8px 12px; border-bottom: 1px solid #1a1d27; }
    .asset-table tr:hover td { background: #1a1d27; }

    .progress-bar { width: 100%; height: 6px; background: #1a1d27; border-radius: 3px; overflow: hidden; margin-bottom: 12px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 3px; transition: width 0.3s; }

    .empty-state { text-align: center; padding: 40px; color: #6b7280; }

    .checkbox-row { display: flex; align-items: center; gap: 8px; }
    .checkbox-row input[type="checkbox"] { width: 16px; height: 16px; accent-color: #3b82f6; }

    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
      .stats-bar { flex-direction: column; }
    }
    .risk-gauge { background: #1f2937; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .gauge-row { display: flex; justify-content: space-around; margin-top: 8px; }
    .gauge-item { text-align: center; }
    .gauge-item .gauge-val { font-size: 20px; font-weight: 700; }
    .gauge-item .gauge-lbl { font-size: 10px; color: #6b7280; }
    .comment-section { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .comment-item { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #1f2937; }
    .comment-item:last-child { border-bottom: none; }
    .comment-avatar { width: 28px; height: 28px; border-radius: 50%; background: #374151; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .comment-text { font-size: 12px; color: #d1d5db; margin-top: 2px; }
    .footer-bar { margin-top: 12px; padding-top: 8px; border-top: 1px solid #374151; display: flex; justify-content: space-between; font-size: 10px; color: #6b7280; }
    .footer-actions { display: flex; gap: 8px; margin-top: 6px; }
    .footer-btn { flex: 1; padding: 8px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #94a3b8; font-size: 11px; cursor: pointer; text-align: center; }
    .footer-btn:hover { border-color: #8b5cf6; color: #e2e8f0; }
    .dist-bar { display: flex; height: 12px; border-radius: 6px; overflow: hidden; gap: 1px; margin-bottom: 6px; }
    .dist-legend { display: flex; gap: 12px; font-size: 9px; color: #6b7280; }
    .dist-legend span { display: inline-flex; align-items: center; gap: 3px; }
    .dist-dot { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
  `;

  private _sampleNetwork(): void {
    this._assets = [
      { id: 'a1', name: 'Web Server', type: 'server', ip: '10.0.0.10', zone: 'dmz', criticality: 'high', os: 'Ubuntu 22.04', services: [{ port: 80, name: 'nginx', version: '1.18.0' }, { port: 443, name: 'nginx', version: '1.18.0' }, { port: 22, name: 'ssh', version: '8.9' }], vulnerabilities: [{ id: 'V1', name: 'Nginx Misconfiguration', severity: 'high', cvss: 7.5, cve: 'CVE-2023-0001' }, { id: 'V2', name: 'SSH Weak Key Exchange', severity: 'medium', cvss: 5.3 }], compromised: false },
      { id: 'a2', name: 'Mail Server', type: 'server', ip: '10.0.0.20', zone: 'dmz', criticality: 'high', os: 'CentOS 8', services: [{ port: 25, name: 'postfix', version: '3.5' }, { port: 587, name: 'postfix', version: '3.5' }], vulnerabilities: [{ id: 'V3', name: 'Open Relay', severity: 'critical', cvss: 9.8, cve: 'CVE-2023-0002' }], compromised: false },
      { id: 'a3', name: 'AD Controller', type: 'ad', ip: '10.0.1.10', zone: 'management', criticality: 'critical', os: 'Windows Server 2022', services: [{ port: 389, name: 'ldap', version: 'Active Directory' }, { port: 445, name: 'smb', version: '3.1.1' }, { port: 636, name: 'ldaps', version: 'Active Directory' }], vulnerabilities: [{ id: 'V4', name: 'Kerberoasting', severity: 'high', cvss: 8.1, cve: 'CVE-2023-0003' }, { id: 'V5', name: 'AS-REP Roasting', severity: 'high', cvss: 7.8 }], compromised: false },
      { id: 'a4', name: 'DB Server', type: 'database', ip: '10.0.2.10', zone: 'restricted', criticality: 'critical', os: 'RHEL 9', services: [{ port: 3306, name: 'mysql', version: '8.0.33' }, { port: 22, name: 'ssh', version: '8.9' }], vulnerabilities: [{ id: 'V6', name: 'MySQL Privilege Escalation', severity: 'critical', cvss: 9.1, cve: 'CVE-2023-0004' }], compromised: false },
      { id: 'a5', name: 'Dev Workstation', type: 'workstation', ip: '10.0.1.100', zone: 'internal', criticality: 'medium', os: 'Windows 11', services: [{ port: 445, name: 'smb', version: '3.1.1' }, { port: 3389, name: 'rdp', version: '10.0' }], vulnerabilities: [{ id: 'V7', name: 'Pass-the-Hash', severity: 'high', cvss: 8.5 }], compromised: false },
      { id: 'a6', name: 'Firewall', type: 'firewall', ip: '10.0.0.1', zone: 'dmz', criticality: 'critical', os: 'pfSense 2.7', services: [{ port: 443, name: 'https', version: 'admin' }], vulnerabilities: [{ id: 'V8', name: 'Default Credentials', severity: 'critical', cvss: 9.8 }], compromised: false },
      { id: 'a7', name: 'File Server', type: 'server', ip: '10.0.1.50', zone: 'internal', criticality: 'high', os: 'Windows Server 2019', services: [{ port: 445, name: 'smb', version: '3.1.1' }, { port: 135, name: 'rpc', version: 'Windows RPC' }], vulnerabilities: [{ id: 'V9', name: 'SMB Signing Disabled', severity: 'medium', cvss: 5.9 }], compromised: false },
      { id: 'a8', name: 'Cloud API', type: 'cloud', ip: '172.16.0.10', zone: 'cloud', criticality: 'high', os: 'AWS Lambda', services: [{ port: 443, name: 'https', version: 'API Gateway' }], vulnerabilities: [{ id: 'V10', name: 'Overly Permissive IAM Role', severity: 'high', cvss: 8.6 }], compromised: false },
      { id: 'a9', name: 'IoT Gateway', type: 'iot', ip: '10.0.3.10', zone: 'iot', criticality: 'medium', os: 'Embedded Linux', services: [{ port: 80, name: 'http', version: 'lighttpd 1.4' }, { port: 1883, name: 'mqtt', version: '5.0' }], vulnerabilities: [{ id: 'V11', name: 'Default Admin Password', severity: 'critical', cvss: 9.8 }, { id: 'V12', name: 'Firmware Outdated', severity: 'high', cvss: 7.5 }], compromised: false },
      { id: 'a10', name: 'CI/CD Runner', type: 'server', ip: '10.0.1.200', zone: 'internal', criticality: 'high', os: 'Ubuntu 22.04', services: [{ port: 8443, name: 'https', version: 'GitLab Runner 16.0' }], vulnerabilities: [{ id: 'V13', name: 'Pipeline Injection', severity: 'critical', cvss: 9.1 }], compromised: false },
    ];

    this._trusts = [
      { id: 't1', source: 'a6', target: 'a1', type: 'network', strength: 8, description: 'Firewall allows HTTP/HTTPS to DMZ' },
      { id: 't2', source: 'a6', target: 'a2', type: 'network', strength: 8, description: 'Firewall allows SMTP to Mail Server' },
      { id: 't3', source: 'a1', target: 'a3', type: 'service', strength: 6, description: 'Web app uses LDAP for authentication' },
      { id: 't4', source: 'a1', target: 'a4', type: 'service', strength: 7, description: 'Web app connects to database' },
      { id: 't5', source: 'a3', target: 'a5', type: 'admin', strength: 9, description: 'AD manages workstation via GPO' },
      { id: 't6', source: 'a3', target: 'a7', type: 'admin', strength: 9, description: 'AD manages file server' },
      { id: 't7', source: 'a5', target: 'a4', type: 'credential', strength: 5, description: 'Developer has DB credentials in scripts' },
      { id: 't8', source: 'a7', target: 'a3', type: 'credential', strength: 6, description: 'Service account for file share' },
      { id: 't9', source: 'a8', target: 'a4', type: 'service', strength: 7, description: 'Lambda reads from RDS' },
      { id: 't10', source: 'a9', target: 'a1', type: 'network', strength: 4, description: 'IoT gateway sends telemetry to web server' },
      { id: 't11', source: 'a5', target: 'a10', type: 'admin', strength: 7, description: 'Developer has CI/CD admin access' },
      { id: 't12', source: 'a10', target: 'a8', type: 'credential', strength: 6, description: 'CI/CD has cloud deployment keys' },
    ];
  }

  private _discoverPaths(): void {
    this._scanStatus = 'analyzing';
    this._scanProgress = 0;

    const paths: AttackPath[] = [];

    // Path 1: Internet -> Firewall (default creds) -> AD -> DB
    paths.push({
      id: 'P1', name: 'Internet -> Firewall -> AD Controller -> Database',
      nodes: ['internet', 'a6', 'a3', 'a4'],
      edges: [{ from: 'internet', to: 'a6', type: 'network' }, { from: 'a6', to: 'a3', type: 'admin' }, { from: 'a3', to: 'a4', type: 'service' }],
      totalRisk: 9.2, exploitability: 9.5, impact: 9.8,
      steps: [
        { asset: 'Firewall (a6)', action: 'Login with default credentials', technique: 'T1078 - Valid Accounts', difficulty: 'easy' },
        { asset: 'AD Controller (a3)', action: 'Pivot from firewall to management network', technique: 'T1021 - Remote Services', difficulty: 'easy' },
        { asset: 'AD Controller (a3)', action: 'Kerberoasting to get service hashes', technique: 'T1558.003 - Kerberoasting', difficulty: 'medium' },
        { asset: 'Database (a4)', action: 'Access database with compromised service account', technique: 'T1550 - Use Alternate Authentication Material', difficulty: 'medium' },
      ],
      mitigations: [
        { step: 0, recommendation: 'Change default firewall credentials immediately. Enforce strong password policy.', effort: 'low', effectiveness: 95 },
        { step: 1, recommendation: 'Implement network segmentation between DMZ and management zone.', effort: 'medium', effectiveness: 80 },
        { step: 2, recommendation: 'Use Group Managed Service Accounts (gMSA) to prevent Kerberoasting.', effort: 'medium', effectiveness: 85 },
        { step: 3, recommendation: 'Implement database access controls and MFA for service accounts.', effort: 'high', effectiveness: 75 },
      ],
    });

    // Path 2: Internet -> IoT -> Web Server -> DB
    paths.push({
      id: 'P2', name: 'Internet -> IoT Gateway -> Web Server -> Database',
      nodes: ['internet', 'a9', 'a1', 'a4'],
      edges: [{ from: 'internet', to: 'a9', type: 'network' }, { from: 'a9', to: 'a1', type: 'network' }, { from: 'a1', to: 'a4', type: 'service' }],
      totalRisk: 8.5, exploitability: 8.8, impact: 9.0,
      steps: [
        { asset: 'IoT Gateway (a9)', action: 'Exploit default admin password', technique: 'T1078 - Valid Accounts', difficulty: 'easy' },
        { asset: 'IoT Gateway (a9)', action: 'Lateral movement to web server via network trust', technique: 'T1021 - Remote Services', difficulty: 'medium' },
        { asset: 'Web Server (a1)', action: 'Exploit Nginx misconfiguration for RCE', technique: 'T1190 - Exploit Public-Facing Application', difficulty: 'medium' },
        { asset: 'Database (a4)', action: 'Use web app credentials to access database', technique: 'T1552 - Unsecured Credentials', difficulty: 'easy' },
      ],
      mitigations: [
        { step: 0, recommendation: 'Change IoT device default passwords. Isolate IoT network.', effort: 'low', effectiveness: 90 },
        { step: 1, recommendation: 'Implement firewall rules blocking IoT-to-DMZ traffic.', effort: 'medium', effectiveness: 85 },
        { step: 2, recommendation: 'Update Nginx configuration. Apply security headers.', effort: 'low', effectiveness: 80 },
        { step: 3, recommendation: 'Rotate database credentials. Use secret management.', effort: 'medium', effectiveness: 85 },
      ],
    });

    // Path 3: Internet -> Web -> AD -> Workstation -> CI/CD -> Cloud
    paths.push({
      id: 'P3', name: 'Internet -> Web Server -> AD -> Workstation -> CI/CD -> Cloud',
      nodes: ['internet', 'a1', 'a3', 'a5', 'a10', 'a8'],
      edges: [{ from: 'internet', to: 'a1', type: 'network' }, { from: 'a1', to: 'a3', type: 'service' }, { from: 'a3', to: 'a5', type: 'admin' }, { from: 'a5', to: 'a10', type: 'admin' }, { from: 'a10', to: 'a8', type: 'credential' }],
      totalRisk: 8.0, exploitability: 7.5, impact: 8.8,
      steps: [
        { asset: 'Web Server (a1)', action: 'Exploit Nginx vulnerability for initial access', technique: 'T1190 - Exploit Public-Facing Application', difficulty: 'medium' },
        { asset: 'AD Controller (a3)', action: 'Extract credentials from web app config', technique: 'T1552 - Unsecured Credentials', difficulty: 'easy' },
        { asset: 'Workstation (a5)', action: 'Pass-the-hash to developer workstation', technique: 'T1550.002 - Pass the Hash', difficulty: 'medium' },
        { asset: 'CI/CD Runner (a10)', action: 'Compromise pipeline with stolen developer token', technique: 'T1195 - Supply Chain Compromise', difficulty: 'hard' },
        { asset: 'Cloud API (a8)', action: 'Deploy malicious code via CI/CD keys', technique: 'T1078.004 - Cloud Accounts', difficulty: 'medium' },
      ],
      mitigations: [
        { step: 0, recommendation: 'Patch Nginx. Implement WAF.', effort: 'low', effectiveness: 70 },
        { step: 1, recommendation: 'Use managed secrets. Never store credentials in config files.', effort: 'medium', effectiveness: 85 },
        { step: 2, recommendation: 'Enable SMB signing. Implement credential guard.', effort: 'medium', effectiveness: 75 },
        { step: 3, recommendation: 'Implement pipeline security. Require code review for deployment.', effort: 'high', effectiveness: 80 },
        { step: 4, recommendation: 'Use short-lived CI/CD tokens. Implement cloud guardrails.', effort: 'medium', effectiveness: 85 },
      ],
    });

    // Path 4: Mail -> Internal -> File Server -> AD
    paths.push({
      id: 'P4', name: 'Phishing -> Mail Server -> Internal Network -> File Server -> AD',
      nodes: ['internet', 'a2', 'a5', 'a7', 'a3'],
      edges: [{ from: 'internet', to: 'a2', type: 'network' }, { from: 'a2', to: 'a5', type: 'credential' }, { from: 'a5', to: 'a7', type: 'credential' }, { from: 'a7', to: 'a3', type: 'credential' }],
      totalRisk: 7.8, exploitability: 8.0, impact: 8.5,
      steps: [
        { asset: 'Mail Server (a2)', action: 'Exploit open relay for phishing campaign', technique: 'T1566.002 - Spearphishing Link', difficulty: 'easy' },
        { asset: 'Workstation (a5)', action: 'User clicks phishing link, malware executes', technique: 'T1203 - Exploitation for Client Execution', difficulty: 'easy' },
        { asset: 'File Server (a7)', action: 'Access file shares with stolen credentials', technique: 'T1021.002 - SMB/Windows Admin Shares', difficulty: 'medium' },
        { asset: 'AD Controller (a3)', action: 'Extract service account from file server', technique: 'T1003.001 - LSASS Memory', difficulty: 'hard' },
      ],
      mitigations: [
        { step: 0, recommendation: 'Close open relay. Implement SPF/DKIM/DMARC.', effort: 'low', effectiveness: 90 },
        { step: 1, recommendation: 'Security awareness training. Implement email filtering.', effort: 'medium', effectiveness: 70 },
        { step: 2, recommendation: 'Segment file server access. Implement conditional access.', effort: 'medium', effectiveness: 75 },
        { step: 3, recommendation: 'Credential Guard. LSA Protection. Monitor LSASS access.', effort: 'high', effectiveness: 80 },
      ],
    });

    this._paths = paths.sort((a, b) => b.totalRisk - a.totalRisk);

    const totalVulns = this._assets.reduce((sum, a) => sum + a.vulnerabilities.length, 0);
    const critPaths = paths.filter(p => p.totalRisk >= 8.5).length;

    this._analysisResult = {
      id: 'AR-' + Date.now(),
      timestamp: new Date().toISOString(),
      totalPaths: paths.length,
      criticalPaths: critPaths,
      assets: this._assets.length,
      vulnerabilities: totalVulns,
      topPaths: paths.slice(0, 5),
      riskScore: Math.round(paths.reduce((s, p) => s + p.totalRisk, 0) / paths.length * 10) / 10,
    };
    this._history = [this._analysisResult, ...this._history].slice(0, 20);

    // Simulate progress
    let p = 0;
    const iv = setInterval(() => {
      p += 10;
      this._scanProgress = Math.min(p, 100);
      if (p >= 100) {
        clearInterval(iv);
        this._scanStatus = 'complete';
      }
    }, 200);
  }

  private _runFullScan(): void {
    this._scanStatus = 'scanning';
    this._scanProgress = 0;
    this._paths = [];
    this._analysisResult = null;
    this._selectedPath = null;
    this._highlightedAsset = null;

    this._sampleNetwork();

    let p = 0;
    const iv = setInterval(() => {
      p += 5;
      this._scanProgress = Math.min(p, 50);
      if (p >= 50) {
        clearInterval(iv);
        if (this._autoAnalyze) {
          this._discoverPaths();
        } else {
          this._scanStatus = 'complete';
          this._scanProgress = 100;
        }
      }
    }, 150);
  }

  private _getRiskClass(risk: number): string {
    if (risk >= 9) return 'risk-critical';
    if (risk >= 7) return 'risk-high';
    if (risk >= 5) return 'risk-medium';
    return 'risk-low';
  }

  private _getDiffClass(d: string): string {
    if (d === 'easy') return 'step-easy';
    if (d === 'medium') return 'step-medium';
    return 'step-hard';
  }

  private _getAssetTypeIcon(type: AssetType): string {
    const icons: Record<AssetType, string> = { server: '\u{1F5A5}', workstation: '\u{1F4BB}', firewall: '\u{1F6E1}', router: '\u{1F310}', database: '\u{1F4BE}', cloud: '\u2601', iot: '\u{1F4E1}', ad: '\u{1F510}' };
    return icons[type] || '\u{1F4E2}';
  }

  private _selectPath(path: AttackPath): void {
    this._selectedPath = path;
    this._activeTab = 'details';
  }

  private _generateReport(): void {
    if (!this._analysisResult) return;
    const lines: string[] = [];
    lines.push('# Attack Path Discovery Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('## Executive Summary');
    lines.push(`- Total Assets Discovered: ${this._analysisResult.assets}`);
    lines.push(`- Total Vulnerabilities: ${this._analysisResult.vulnerabilities}`);
    lines.push(`- Attack Paths Found: ${this._analysisResult.totalPaths}`);
    lines.push(`- Critical Paths: ${this._analysisResult.criticalPaths}`);
    lines.push(`- Overall Risk Score: ${this._analysisResult.riskScore}/10`);
    lines.push('');
    lines.push('## Attack Paths (Ordered by Risk)');
    this._paths.forEach((p, i) => {
      lines.push(`### ${i + 1}. ${p.name} [Risk: ${p.totalRisk}]`);
      lines.push(`- Exploitability: ${p.exploitability}/10`);
      lines.push(`- Impact: ${p.impact}/10`);
      p.steps.forEach((s, j) => {
        lines.push(`  ${j + 1}. [${s.difficulty.toUpperCase()}] ${s.asset}: ${s.action} (${s.technique})`);
      });
      lines.push('');
      lines.push('  Mitigations:');
      p.mitigations.forEach(m => {
        lines.push(`  - [${m.effort} effort, ${m.effectiveness}% effective] ${m.recommendation}`);
      });
      lines.push('');
    });
    lines.push('## Network Assets');
    this._assets.forEach(a => {
      lines.push(`- [${a.zone.toUpperCase()}] ${a.name} (${a.ip}) - ${a.type} - ${a.criticality}`);
      if (a.vulnerabilities.length) {
        a.vulnerabilities.forEach(v => { lines.push(`  - [${v.severity}] ${v.name} (CVSS ${v.cvss})${v.cve ? ' ' + v.cve : ''}`); });
      }
    });
    this._reportContent = lines.join('\n');
    this._showReport = true;
    this._activeTab = 'report';
  }

  private _exportReport(): void {
    if (!this._reportContent) return;
    const blob = new Blob([this._reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attack-path-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- CVSS-like Path Severity Calculator ---
  private _calculatePathCVSS(path: any): { baseScore: number; impact: number; exploitability: number; severity: string } {
    const vulnSeverities: Record<string, number> = { critical: 10, high: 7.5, medium: 5, low: 2.5 };
    const vulns = path.vulns || [];
    const maxVuln = vulns.length > 0 ? Math.max(...vulns.map((v: any) => vulnSeverities[v.severity] || 5)) : 0;
    const avgVuln = vulns.length > 0 ? vulns.reduce((s: number, v: any) => s + (vulnSeverities[v.severity] || 5), 0) / vulns.length : 0;
    const impact = Math.min(10, maxVuln * 0.6 + avgVuln * 0.4);
    const accessVector = path.needsAuth ? 0.6 : 0.85;
    const complexity = path.exploitComplexity === 'low' ? 0.9 : path.exploitComplexity === 'medium' ? 0.7 : 0.4;
    const privileges = path.needsPrivEsc ? 0.5 : 0.85;
    const userInteraction = path.needsUserInteraction ? 0.6 : 0.85;
    const exploitability = 8.22 * accessVector * complexity * privileges * userInteraction;
    const baseScore = Math.min(10, (impact === 0 ? 0 : Math.round(((0.6 * impact) + (0.4 * exploitability) - 1.5) * 10) / 10));
    const severity = baseScore >= 9 ? 'critical' : baseScore >= 7 ? 'high' : baseScore >= 4 ? 'medium' : 'low';
    return { baseScore: Math.max(0, baseScore), impact: Math.round(impact * 10) / 10, exploitability: Math.round(exploitability * 10) / 10, severity };
  }

  // --- Multi-Path Comparison Matrix ---
  private _pathComparisonMatrix(): { pathId: string; pathName: string; cvss: number; hops: number; vulns: number; risk: number; time: number }[] {
    return this._discoveredPaths.slice(0, 8).map((p: any) => {
      const cvssData = this._calculatePathCVSS(p);
      return {
        pathId: p.id || 'unknown',
        pathName: p.name || 'Unnamed Path',
        cvss: cvssData.baseScore,
        hops: p.hops || p.steps?.length || 0,
        vulns: (p.vulns || []).length,
        risk: this._computePathRisk(p),
        time: p.estimatedTime || Math.floor(Math.random() * 120) + 10,
      };
    });
  }

  private _renderPathComparison(): any {
    const matrix = this._pathComparisonMatrix();
    if (matrix.length === 0) return nothing;
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Path Comparison Matrix</div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr style="background:#0f172a;color:#94a3b8">
              <th style="padding:6px 8px;text-align:left">Path</th>
              <th style="padding:6px 8px;text-align:center">CVSS</th>
              <th style="padding:6px 8px;text-align:center">Hops</th>
              <th style="padding:6px 8px;text-align:center">Vulns</th>
              <th style="padding:6px 8px;text-align:center">Risk</th>
              <th style="padding:6px 8px;text-align:center">ETA</th>
            </tr></thead>
            <tbody>
              ${matrix.map(m => html`<tr style="border-bottom:1px solid #1f2937">
                <td style="padding:6px 8px;color:#e2e8f0">${m.pathName}</td>
                <td style="padding:6px 8px;text-align:center;color:${m.cvss >= 9 ? '#ef4444' : m.cvss >= 7 ? '#f97316' : m.cvss >= 4 ? '#eab308' : '#22c55e'};font-weight:700">${m.cvss.toFixed(1)}</td>
                <td style="padding:6px 8px;text-align:center">${m.hops}</td>
                <td style="padding:6px 8px;text-align:center">${m.vulns}</td>
                <td style="padding:6px 8px;text-align:center">
                  <div style="height:6px;background:#0f172a;border-radius:3px;overflow:hidden;max-width:60px;margin:0 auto">
                    <div style="height:100%;width:${m.risk}%;background:${m.risk > 75 ? '#ef4444' : m.risk > 50 ? '#f97316' : m.risk > 25 ? '#eab308' : '#22c55e'};border-radius:3px"></div>
                  </div>
                </td>
                <td style="padding:6px 8px;text-align:center;color:#9ca3af">${m.time}min</td>
              </tr>`)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  // --- Anomaly Detection for Network Paths ---
  private _networkAnomalies: { id: string; type: string; description: string; severity: string; asset: string; detectedAt: string }[] = [
    { id: 'an1', type: 'Unusual Protocol', description: 'RDP traffic detected from DMZ to internal database server', severity: 'high', asset: 'DB-SRV-01', detectedAt: new Date(Date.now() - 1800000).toISOString() },
    { id: 'an2', type: 'Port Scan', description: 'Sequential port scan from workstation WS-042 targeting subnet 10.0.3.0/24', severity: 'medium', asset: 'WS-042', detectedAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 'an3', type: 'Data Volume Spike', description: '300% increase in outbound traffic from App-SRV-03 to external IP', severity: 'critical', asset: 'App-SRV-03', detectedAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'an4', type: 'Auth Anomaly', description: '5 failed login attempts followed by success on DC-01 within 60 seconds', severity: 'high', asset: 'DC-01', detectedAt: new Date(Date.now() - 5400000).toISOString() },
  ];

  private _renderAnomalyPanel(): any {
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px;display:flex;align-items:center;gap:8px">
          <span>Network Anomalies</span>
          <span style="background:#450a0a;color:#fca5a5;font-size:10px;padding:1px 6px;border-radius:4px">${this._networkAnomalies.length}</span>
        </div>
        ${this._networkAnomalies.map(a => html`
          <div style="background:#1f2937;border-radius:6px;padding:8px;margin-bottom:4px;border-left:3px solid ${a.severity === 'critical' ? '#ef4444' : a.severity === 'high' ? '#f97316' : '#eab308'}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:600;font-size:11px;color:#e2e8f0">${a.type}</span>
              <span style="font-size:9px;color:#6b7280">${new Date(a.detectedAt).toLocaleTimeString()}</span>
            </div>
            <div style="font-size:10px;color:#9ca3af;margin-top:2px">${a.description}</div>
            <div style="font-size:9px;color:#6b7280;margin-top:2px">Asset: ${a.asset}</div>
          </div>
        `)}
      </div>
    `;
  }

  // --- Panel Configuration ---
  @state() private _panelConfig: { autoRefresh: boolean; refreshInterval: number; showTopology: boolean; showSankey: boolean; showAnomalies: boolean; compactView: boolean } = {
    autoRefresh: false, refreshInterval: 30, showTopology: true, showSankey: true, showAnomalies: true, compactView: false,
  };

  // --- Risk Heatmap SVG ---
  private _riskHeatmapSVG(): string {
    const w = 400, h = 200;
    const zones = ['DMZ', 'Internal', 'Core', 'Cloud', 'IoT'];
    const metrics = ['Vulns', 'Exploit', 'Access', 'Exfil', 'Impact'];
    const data = zones.map(z => metrics.map(m => Math.floor(Math.random() * 100)));
    const cellW = (w - 60) / metrics.length, cellH = (h - 40) / zones.length;
    let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
    metrics.forEach((m, i) => {
      svg += `<text x="${60 + i * cellW + cellW / 2}" y="15" fill="#9ca3af" font-size="8" text-anchor="middle">${m}</text>`;
    });
    zones.forEach((z, zi) => {
      svg += `<text x="50" y="${30 + zi * cellH + cellH / 2 + 3}" fill="#9ca3af" font-size="8" text-anchor="end">${z}</text>`;
      metrics.forEach((m, mi) => {
        const val = data[zi][mi];
        const x = 60 + mi * cellW, y = 30 + zi * cellH;
        const color = val > 75 ? '#ef4444' : val > 50 ? '#f97316' : val > 25 ? '#eab308' : '#22c55e';
        svg += `<rect x="${x + 1}" y="${y + 1}" width="${cellW - 2}" height="${cellH - 2}" rx="3" fill="${color}" opacity="0.3" stroke="${color}" stroke-width="0.5"/>`;
        svg += `<text x="${x + cellW / 2}" y="${y + cellH / 2 + 3}" fill="#e2e8f0" font-size="10" text-anchor="middle" font-weight="600">${val}</text>`;
      });
    });
    svg += `</svg>`;
    return svg;
  }

  // --- Trend Prediction for Attack Paths ---
  private _predictPathTrends(): { direction: 'increasing' | 'stable' | 'decreasing'; confidence: number; reason: string }[] {
    const trends: { direction: 'increasing' | 'stable' | 'decreasing'; confidence: number; reason: string }[] = [];
    const totalPaths = this._discoveredPaths.length;
    const exploitable = this._discoveredPaths.filter((p: any) => p.status === 'exploitable').length;
    if (exploitable > totalPaths * 0.5) {
      trends.push({ direction: 'increasing', confidence: 0.85, reason: 'Majority of paths are exploitable. Risk trajectory is upward.' });
    } else if (exploitable > 2) {
      trends.push({ direction: 'stable', confidence: 0.6, reason: 'Exploitable paths exist but are contained. Monitor for changes.' });
    } else {
      trends.push({ direction: 'decreasing', confidence: 0.7, reason: 'Few exploitable paths. Attack surface is well-managed.' });
    }
    return trends;
  }

  private _renderPanelConfig(): any {
    const cfg = this._panelConfig;
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Panel Configuration</div>
        ${[
          { key: 'showTopology', label: 'Network Topology', desc: 'Show attack path topology diagram' },
          { key: 'showSankey', label: 'Flow Sankey', desc: 'Show attack flow sankey diagram' },
          { key: 'showAnomalies', label: 'Anomaly Panel', desc: 'Show network anomaly detections' },
          { key: 'compactView', label: 'Compact View', desc: 'Reduce spacing for more data density' },
        ].map(item => html`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1f2937">
            <div><div style="font-size:11px;font-weight:600">${item.label}</div><div style="font-size:9px;color:#6b7280">${item.desc}</div></div>
            <div style="width:36px;height:20px;border-radius:10px;background:${(cfg as any)[item.key] ? '#22c55e' : '#374151'};cursor:pointer;position:relative" @click=${() => { this._panelConfig = { ...cfg, [item.key]: !(cfg as any)[item.key] }; }}>
              <div style="width:16px;height:16px;border-radius:50%;background:white;position:absolute;top:2px;left:${(cfg as any)[item.key] ? '18px' : '2px'};transition:left 0.2s"></div>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  // --- Attack Path Risk Scoring Engine ---
  private _pathRiskFactors: Record<string, { weight: number; label: string }> = {
    vulnCount: { weight: 0.25, label: 'Vulnerability Density' },
    pathLength: { weight: 0.15, label: 'Path Length (hops)' },
    assetCriticality: { weight: 0.25, label: 'Target Asset Criticality' },
    exploitComplexity: { weight: 0.20, label: 'Exploit Complexity' },
    lateralMoveRisk: { weight: 0.15, label: 'Lateral Movement Risk' },
  };

  private _computePathRisk(path: any): number {
    const vulnScore = Math.min(100, (path.vulns || []).length * 20);
    const lengthScore = Math.min(100, (path.hops || 3) * 15);
    const critScore = path.targetCriticality === 'critical' ? 100 : path.targetCriticality === 'high' ? 75 : 50;
    const exploitScore = path.exploitComplexity === 'low' ? 100 : path.exploitComplexity === 'medium' ? 60 : 30;
    const lateralScore = Math.min(100, (path.lateralMoves || 0) * 25);
    const factors = [
      { score: vulnScore, weight: this._pathRiskFactors.vulnCount.weight },
      { score: lengthScore, weight: this._pathRiskFactors.pathLength.weight },
      { score: critScore, weight: this._pathRiskFactors.assetCriticality.weight },
      { score: exploitScore, weight: this._pathRiskFactors.exploitComplexity.weight },
      { score: lateralScore, weight: this._pathRiskFactors.lateralMoveRisk.weight },
    ];
    return Math.round(factors.reduce((s, f) => s + f.score * f.weight, 0));
  }

  // --- MITRE ATT&CK Attack Path Correlation ---
  private _mitrePathMap: Record<string, { tactic: string; techniqueId: string; techniqueName: string }> = {
    'credential-access': { tactic: 'Credential Access', techniqueId: 'T1110', techniqueName: 'Brute Force' },
    'lateral-movement': { tactic: 'Lateral Movement', techniqueId: 'T1021', techniqueName: 'Remote Services' },
    'privilege-escalation': { tactic: 'Privilege Escalation', techniqueId: 'T1068', techniqueName: 'Exploitation for Privilege Escalation' },
    'persistence': { tactic: 'Persistence', techniqueId: 'T1053', techniqueName: 'Scheduled Task/Job' },
    'defense-evasion': { tactic: 'Defense Evasion', techniqueId: 'T1070', techniqueName: 'Indicator Removal' },
    'exfiltration': { tactic: 'Exfiltration', techniqueId: 'T1048', techniqueName: 'Exfiltration Over Alternative Protocol' },
    'command-control': { tactic: 'Command and Control', techniqueId: 'T1071', techniqueName: 'Application Layer Protocol' },
    'discovery': { tactic: 'Discovery', techniqueId: 'T1046', techniqueName: 'Network Service Discovery' },
  };

  private _correlatePathMitre(path: any): { tactic: string; techniques: { id: string; name: string }[] }[] {
    const tactics: Record<string, { id: string; name: string }[]> = {};
    for (const [key, mitre] of Object.entries(this._mitrePathMap)) {
      if (path.steps && path.steps.some((s: any) => s.type && s.type.toLowerCase().includes(key))) {
        if (!tactics[mitre.tactic]) tactics[mitre.tactic] = [];
        tactics[mitre.tactic].push({ id: mitre.techniqueId, name: mitre.techniqueName });
      }
    }
    return Object.entries(tactics).map(([tactic, techniques]) => ({ tactic, techniques }));
  }

  // --- Attack Path Topology SVG ---
  private _pathTopologySVG(): string {
    const w = 800, h = 300;
    const nodes = [
      { id: 'entry', x: 80, y: 150, label: 'Entry Point', type: 'external', color: '#ef4444' },
      { id: 'dmz', x: 220, y: 100, label: 'DMZ Web Server', type: 'server', color: '#f97316' },
      { id: 'dmz-db', x: 220, y: 200, label: 'DMZ Database', type: 'database', color: '#f97316' },
      { id: 'fw1', x: 360, y: 150, label: 'Firewall', type: 'firewall', color: '#6366f1' },
      { id: 'app', x: 500, y: 80, label: 'App Server', type: 'server', color: '#eab308' },
      { id: 'ad', x: 500, y: 150, label: 'Domain Controller', type: 'ad', color: '#ef4444' },
      { id: 'db', x: 500, y: 220, label: 'Core Database', type: 'database', color: '#ef4444' },
      { id: 'target', x: 660, y: 150, label: 'Crown Jewels', type: 'server', color: '#dc2626' },
    ];
    const edges = [
      { from: 'entry', to: 'dmz', risk: 'high' }, { from: 'entry', to: 'dmz-db', risk: 'medium' },
      { from: 'dmz', to: 'fw1', risk: 'high' }, { from: 'dmz-db', to: 'fw1', risk: 'medium' },
      { from: 'fw1', to: 'app', risk: 'medium' }, { from: 'fw1', to: 'ad', risk: 'high' },
      { from: 'fw1', to: 'db', risk: 'low' }, { from: 'ad', to: 'target', risk: 'critical' },
      { from: 'app', to: 'db', risk: 'medium' }, { from: 'app', to: 'target', risk: 'high' },
    ];
    let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
    // Edges
    edges.forEach(e => {
      const from = nodes.find(n => n.id === e.from)!;
      const to = nodes.find(n => n.id === e.to)!;
      const riskColor = e.risk === 'critical' ? '#ef4444' : e.risk === 'high' ? '#f97316' : e.risk === 'medium' ? '#eab308' : '#22c55e';
      svg += `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${riskColor}" stroke-width="2" opacity="0.6"/>`;
      const mx = (from.x + to.x) / 2, my = (from.y + to.y) / 2;
      svg += `<circle cx="${mx}" cy="${my}" r="3" fill="${riskColor}"/>`;
    });
    // Nodes
    nodes.forEach(n => {
      svg += `<rect x="${n.x - 35}" y="${n.y - 18}" width="70" height="36" rx="6" fill="#1f2937" stroke="${n.color}" stroke-width="2"/>`;
      svg += `<text x="${n.x}" y="${n.y + 1}" fill="#e2e8f0" font-size="9" text-anchor="middle" dominant-baseline="middle">${n.label}</text>`;
    });
    svg += `</svg>`;
    return svg;
  }

  // --- Attack Path Sankey Diagram ---
  private _pathSankeySVG(): string {
    const w = 700, h = 200;
    const stages = ['Entry', 'DMZ', 'Internal', 'Target'];
    const flows = [
      { from: 0, to: 1, value: 8, label: 'Web Exploit', color: '#ef4444' },
      { from: 0, to: 1, value: 5, label: 'Phishing', color: '#f97316' },
      { from: 1, to: 2, value: 6, label: 'Pivot', color: '#eab308' },
      { from: 1, to: 2, value: 4, label: 'SQLi', color: '#f97316' },
      { from: 2, to: 3, value: 3, label: 'Lateral Move', color: '#ef4444' },
      { from: 2, to: 3, value: 2, label: 'Priv Esc', color: '#dc2626' },
    ];
    const stageX = stages.map((_, i) => 60 + (i / (stages.length - 1)) * (w - 120));
    let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
    stages.forEach((s, i) => {
      svg += `<text x="${stageX[i]}" y="20" fill="#e2e8f0" font-size="11" text-anchor="middle" font-weight="600">${s}</text>`;
      svg += `<line x1="${stageX[i]}" y1="28" x2="${stageX[i]}" y2="${h - 10}" stroke="#374151" stroke-width="1"/>`;
    });
    let yOffset = 35;
    flows.forEach(f => {
      const x1 = stageX[f.from], x2 = stageX[f.to];
      const bw = f.value * 4;
      const midX = (x1 + x2) / 2;
      svg += `<path d="M${x1},${yOffset} C${midX},${yOffset} ${midX},${yOffset} ${x2},${yOffset}" fill="none" stroke="${f.color}" stroke-width="${bw}" opacity="0.5"/>`;
      svg += `<text x="${midX}" y="${yOffset - bw / 2 - 3}" fill="#9ca3af" font-size="8" text-anchor="middle">${f.label}</text>`;
      yOffset += bw + 6;
    });
    svg += `</svg>`;
    return svg;
  }

  // --- Collaboration ---
  @state() private _teamMembers: { id: string; name: string; role: string; status: string }[] = [
    { id: 't1', name: 'Red Team Lead', role: 'Offense', status: 'online' },
    { id: 't2', name: 'Blue Team Lead', role: 'Defense', status: 'online' },
    { id: 't3', name: 'Network Engineer', role: 'Infrastructure', status: 'busy' },
    { id: 't4', name: 'Threat Analyst', role: 'Intelligence', status: 'offline' },
  ];
  @state() private _pathComments: { id: string; userId: string; pathId: string; text: string; timestamp: string }[] = [];
  @state() private _newComment = '';

  private _addPathComment(pathId: string) {
    if (!this._newComment.trim()) return;
    this._pathComments = [{ id: 'c' + Date.now(), userId: 'You', pathId, text: this._newComment.trim(), timestamp: new Date().toISOString() }, ...this._pathComments];
    this._newComment = '';
  }

  private _renderTeamPanel(): any {
    return html`
      <div style="margin-top:16px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:13px;margin-bottom:10px">Path Analysis Team</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
          ${this._teamMembers.map(m => html`
            <div style="display:flex;align-items:center;gap:6px;background:#1f2937;border-radius:6px;padding:5px 10px">
              <div style="width:8px;height:8px;border-radius:50%;background:${m.status === 'online' ? '#22c55e' : m.status === 'busy' ? '#eab308' : '#6b7280'}"></div>
              <div><div style="font-size:11px;font-weight:600">${m.name}</div><div style="font-size:9px;color:#6b7280">${m.role}</div></div>
            </div>
          `)}
        </div>
        ${this._pathComments.length > 0 ? html`
          <div style="max-height:80px;overflow-y:auto;margin-bottom:8px">
            ${this._pathComments.slice(0, 5).map(c => html`
              <div style="font-size:11px;padding:4px 0;border-bottom:1px solid #1f2937">
                <span style="font-weight:600">${c.userId}</span>
                <span style="color:#6b7280"> on ${c.pathId}:</span>
                <span style="color:#9ca3af">${c.text}</span>
                <span style="float:right;font-size:9px;color:#4b5563">${new Date(c.timestamp).toLocaleTimeString()}</span>
              </div>
            `)}
          </div>
        ` : ''}
        <div style="display:flex;gap:6px">
          <input style="flex:1;background:#0f172a;border:1px solid #374151;border-radius:6px;padding:5px 8px;color:#e2e8f0;font-size:11px" placeholder="Comment on path..." .value=${this._newComment} @input=${(e: any) => this._newComment = e.target.value}>
          <button style="background:#f59e0b;color:#111827;border:none;border-radius:6px;padding:5px 10px;font-size:10px;font-weight:600;cursor:pointer" @click=${() => this._addPathComment('general')}>Post</button>
        </div>
      </div>
    `;
  }

  // --- Auto-Insights ---
  private _generatePathInsights(): { icon: string; text: string; severity: string }[] {
    const insights: { icon: string; text: string; severity: string }[] = [];
    const totalPaths = this._discoveredPaths.length;
    const exploitable = this._discoveredPaths.filter((p: any) => p.status === 'exploitable').length;
    if (exploitable > 0) insights.push({ icon: '\uD83D\uDFE1', text: `${exploitable} exploitable paths to critical assets require immediate mitigation.`, severity: 'critical' });
    if (totalPaths > 10) insights.push({ icon: '\uD83D\uDD0D', text: `High path complexity (${totalPaths} paths). Attack surface exceeds recommended thresholds.`, severity: 'high' });
    if (this._discoveredPaths.some((p: any) => p.steps && p.steps.length > 5)) insights.push({ icon: '\uD83D\uDEE1\uFE0F', text: 'Multi-hop paths detected. Deep defense-in-depth review recommended.', severity: 'medium' });
    return insights.length > 0 ? insights : [{ icon: '\u2705', text: 'No critical path risks detected.', severity: 'low' }];
  }

  private _renderPathInsights(): any {
    const insights = this._generatePathInsights();
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Auto-Insights</div>
        ${insights.map(i => html`
          <div style="display:flex;gap:8px;padding:6px;margin-bottom:4px;background:#1f2937;border-radius:4px;font-size:11px;border-left:3px solid ${i.severity === 'critical' ? '#ef4444' : i.severity === 'high' ? '#f97316' : '#22c55e'}">
            <span>${i.icon}</span><span style="color:#e2e8f0">${i.text}</span>
          </div>
        `)}
      </div>
    `;
  }

  private _renderRiskGauge(): any {
    const riskDist = { critical: 0, high: 0, medium: 0, low: 0 };
    this._items.forEach((item: any) => { riskDist[item.risk] = (riskDist[item.risk] || 0) + 1; });
    const total = this._items.length || 1;
    const score = Math.round(((riskDist.critical * 10 + riskDist.high * 7 + riskDist.medium * 4 + riskDist.low * 1) / (total * 10)) * 100);
    const scoreColor = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e';
    return html`<div class="risk-gauge">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Risk Overview</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:${scoreColor}">${score}</div>
          <div style="font-size:9px;color:#6b7280">Risk Score</div>
        </div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#ef4444">${riskDist.critical}</div>
          <div style="font-size:9px;color:#6b7280">Critical</div>
        </div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:22px;font-weight:700;color:#f59e0b">${riskDist.high}</div>
          <div style="font-size:9px;color:#6b7280">High Risk</div>
        </div>
      </div>
      <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Distribution</div>
      <div class="dist-bar">
        <div style="width:${(riskDist.critical / total) * 100}%;background:#ef4444;border-radius:3px"></div>
        <div style="width:${(riskDist.high / total) * 100}%;background:#f97316"></div>
        <div style="width:${(riskDist.medium / total) * 100}%;background:#eab308"></div>
        <div style="width:${(riskDist.low / total) * 100}%;background:#22c55e;border-radius:3px"></div>
      </div>
      <div class="dist-legend">
        <span><span class="dist-dot" style="background:#ef4444"></span>Critical</span>
        <span><span class="dist-dot" style="background:#f97316"></span>High</span>
        <span><span class="dist-dot" style="background:#eab308"></span>Medium</span>
        <span><span class="dist-dot" style="background:#22c55e"></span>Low</span>
      </div>
    </div>`;
  }

  private _renderComments(): any {
    if (!this._expandedId) return nothing;
    const itemComments = this._comments.filter((c: any) => c.itemId === this._expandedId);
    return html`<div class="comment-section">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Discussion (${itemComments.length})</div>
      ${itemComments.length === 0 ? html`<div style="font-size:12px;color:#6b7280;padding:8px 0">No comments yet</div>` : ''}
      ${itemComments.map((c: any) => html`<div class="comment-item">
        <div class="comment-avatar">${c.author.charAt(0)}</div>
        <div style="flex:1"><div style="font-size:11px"><span style="font-weight:600">${c.author}</span> <span style="color:#6b7280">${new Date(c.timestamp).toLocaleString()}</span></div><div class="comment-text">${c.text}</div></div>
      </div>`)}
      <div style="display:flex;gap:8px;margin-top:8px">
        <input type="text" placeholder="Add comment..." .value=${this._newComment} @input=${(e: Event) => { this._newComment = (e.target as HTMLInputElement).value; }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._addComment(); }} style="flex:1;background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;outline:none">
        <button class="btn btn-primary btn-sm" @click=${this._addComment}>Post</button>
      </div>
    </div>`;
  }

  private _renderFooter(): any {
    return html`<div>
      <div class="footer-bar">
        <span>Last scan: ${this._execHistory.length > 0 ? new Date(this._execHistory[0].timestamp).toLocaleString() : 'Never'}</span>
        <span>${this._items.length} items | ${this._auditTrail.length} audit entries</span>
      </div>
      <div class="footer-actions">
        <div class="footer-btn" @click=${() => { this._addAudit('export', 'Full report exported'); }}>Export Report</div>
        <div class="footer-btn" @click=${() => { this._addAudit('export', 'CSV exported'); }}>Export CSV</div>
        <div class="footer-btn" @click=${this._runScanWithHistory}>Run Analysis</div>
      </div>
    </div>`;
  }

  private _renderSLABar(): any {
    const total = this._slaTargetHours * 3600;
    const pct = 75 + Math.floor(Math.random() * 25);
    const hrs = Math.floor((total * (100 - pct)) / 3600000);
    const color = pct < 25 ? '#ef4444' : pct < 50 ? '#f59e0b' : '#22c55e';
    return html`<div class="sla-bar">
      <div class="sla-indicator" style="background:${color}"></div>
      <div style="flex:1">
        <div style="font-size:11px;color:#94a3b8;margin-bottom:4px">SLA (${this._slaTargetHours}h)</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
      </div>
      <div class="sla-time" style="color:${color}">${hrs}h elapsed</div>
    </div>`;
  }


  private _renderMiniGraph(): any {
    const data = this._items.slice(0, 12).map((item: any, i: number) => ({
      name: item.name.substring(0, 10),
      risk: item.risk,
      score: ({critical: 10, high: 7, medium: 4, low: 1}) as any)[item.risk]) || 1,
      idx: i
    }));
    const barW = 360;
    const barH = 180;
    const maxBars = data.length;
    const bw = Math.max(20, Math.floor((barW - 40) / maxBars) - 4);
    const maxScore = 10;
    const riskColors: any = {critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e'};
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px">Risk Score Chart</div>
      <svg width="100%" viewBox="0 0 ${barW} ${barH}" style="max-width:420px">
        ${[0, 2, 4, 6, 8, 10].map(v => html`<line x1="30" y1="${barH - 20 - (v / maxScore) * (barH - 50)}" x2="${barW - 10}" y2="${barH - 20 - (v / maxScore) * (barH - 50)}" stroke="#1f2937" stroke-width="0.5"/><text x="25" y="${barH - 18 - (v / maxScore) * (barH - 50)}" text-anchor="end" fill="#6b7280" font-size="7">${v}</text>`)}
        ${data.map((d: any, i: number) => {
          const x = 35 + i * (bw + 4);
          const h = (d.score / maxScore) * (barH - 50);
          const y = barH - 20 - h;
          return html`<g><rect x="${x}" y="${y}" width="${bw}" height="${h}" fill="${riskColors[d.risk]}60" rx="2" stroke="${riskColors[d.risk]}" stroke-width="0.5"/><text x="${x + bw / 2}" y="${barH - 8}" text-anchor="middle" fill="#6b7280" font-size="6" transform="rotate(-30, ${x + bw / 2}, ${barH - 8})">${d.name}</text></g>`;
        })}
        <line x1="30" y1="${barH - 20}" x2="${barW - 10}" y2="${barH - 20}" stroke="#374151" stroke-width="1"/>
      </svg>
    </div>`;
  }

  private _renderEscalationRules(): any {
    const rules = [
      { name: 'Auto-escalate critical', condition: 'risk === critical', action: 'Notify security lead', enabled: true },
      { name: 'Auto-escalate high count', condition: 'flagged >= threshold', action: 'Create incident', enabled: this._criticalThreshold > 0 },
      { name: 'SLA breach warning', condition: 'elapsed > 75% SLA', action: 'Send reminder', enabled: true },
      { name: 'Daily digest', condition: 'schedule: daily 9am', action: 'Email summary', enabled: false },
    ];
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px">Escalation Rules</div>
      ${rules.map((r: any) => html`<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:#0f172a;border-radius:6px;margin-bottom:4px;font-size:12px">
        <input type="checkbox" .checked=${r.enabled} style="accent-color:#8b5cf6" @change=${(e: Event) => { this._addAudit('config', 'Rule ' + (r.enabled ? 'disabled' : 'enabled') + ': ' + r.name); }}>
        <div style="flex:1">
          <div style="font-weight:600">${r.name}</div>
          <div style="font-size:10px;color:#6b7280;margin-top:2px">${r.condition} → ${r.action}</div>
        </div>
      </div>`)}
    </div>`;
  }

  private _renderNotificationPanel(): any {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:10px">Notification Channels</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <div style="background:#0f172a;border-radius:6px;padding:10px;display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">&#128232;</span>
          <div><div style="font-size:11px;font-weight:600">Email</div><div style="font-size:9px;color:#6b7280">${this._escalationEmail || 'Not configured'}</div></div>
        </div>
        <div style="background:#0f172a;border-radius:6px;padding:10px;display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">&#128276;</span>
          <div><div style="font-size:11px;font-weight:600">Slack Webhook</div><div style="font-size:9px;color:#6b7280">${this._webhookUrl ? 'Configured' : 'Not configured'}</div></div>
        </div>
        <div style="background:#0f172a;border-radius:6px;padding:10px;display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">&#128172;</span>
          <div><div style="font-size:11px;font-weight:600">Teams</div><div style="font-size:9px;color:#6b7280">Not configured</div></div>
        </div>
        <div style="background:#0f172a;border-radius:6px;padding:10px;display:flex;align-items:center;gap:8px">
          <span style="font-size:16px">&#128279;</span>
          <div><div style="font-size:11px;font-weight:600">PagerDuty</div><div style="font-size:9px;color:#6b7280">Not configured</div></div>
        </div>
      </div>
    </div>`;
  }

  render() {
    return html`
      <div class="panel">
        <div class="header">
          <div class="title"><span>&#x1F5FA;</span> Attack Path Discovery</div>
          <div class="btn-row">
            <button class="btn btn-secondary btn-sm" @click=${() => { this._assets = []; this._paths = []; this._analysisResult = null; this._selectedPath = null; this._scanStatus = 'idle'; this._scanProgress = 0; }}>Reset</button>
            <button class="btn btn-secondary btn-sm" @click=${this._generateReport} ?disabled=${!this._analysisResult}>Generate Report</button>
          </div>
        </div>

        ${this._analysisResult ? html`
          <div class="stats-bar">
            <div class="stat stat-critical"><div class="stat-value">${this._analysisResult.assets}</div><div class="stat-label">Assets</div></div>
            <div class="stat stat-high"><div class="stat-value">${this._analysisResult.vulnerabilities}</div><div class="stat-label">Vulnerabilities</div></div>
            <div class="stat stat-critical"><div class="stat-value">${this._analysisResult.totalPaths}</div><div class="stat-label">Attack Paths</div></div>
            <div class="stat stat-high"><div class="stat-value">${this._analysisResult.criticalPaths}</div><div class="stat-label">Critical Paths</div></div>
            <div class="stat stat-info"><div class="stat-value">${this._analysisResult.riskScore}</div><div class="stat-label">Risk Score</div></div>
          </div>
        ` : nothing}

        <div class="form-grid">
          <div class="form-group">
            <label>Target Asset (optional)</label>
            <input type="text" .value=${this._targetAsset} @input=${(e: Event) => { this._targetAsset = (e.target as HTMLInputElement).value; }} placeholder="e.g. Database Server">
          </div>
          <div class="form-group">
            <label>Filter by Zone</label>
            <select .value=${this._filterZone} @change=${(e: Event) => { this._filterZone = (e.target as HTMLSelectElement).value; }}>
              <option value="all">All Zones</option>
              <option value="dmz">DMZ</option>
              <option value="internal">Internal</option>
              <option value="restricted">Restricted</option>
              <option value="management">Management</option>
              <option value="cloud">Cloud</option>
              <option value="iot">IoT</option>
            </select>
          </div>
          <div class="form-group">
            <div class="checkbox-row">
              <input type="checkbox" ?checked=${this._autoAnalyze} @change=${(e: Event) => { this._autoAnalyze = (e.target as HTMLInputElement).checked; }}>
              <label style="margin:0">Auto-analyze after scan</label>
            </div>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn btn-primary" @click=${this._runFullScan} ?disabled=${this._scanStatus === 'scanning' || this._scanStatus === 'analyzing'}>
            ${this._scanStatus === 'idle' ? 'Discover Network & Paths' : 'Scanning...'}
          </button>
        </div>

        ${this._scanStatus !== 'idle' && this._scanStatus !== 'complete' ? html`
          <div class="progress-bar"><div class="progress-fill" style="width:${this._scanProgress}%"></div></div>
        ` : nothing}

        ${this._assets.length > 0 ? html`
          <div class="tabs">
            <button class="tab ${this._activeTab === 'topology' ? 'active' : ''}" @click=${() => { this._activeTab = 'topology'; }}>Topology</button>
            <button class="tab ${this._activeTab === 'paths' ? 'active' : ''}" @click=${() => { this._activeTab = 'paths'; }}>Paths (${this._paths.length})</button>
            ${this._selectedPath ? html`
              <button class="tab ${this._activeTab === 'details' ? 'active' : ''}" @click=${() => { this._activeTab = 'details'; }}>Path Details</button>
            ` : nothing}
            <button class="tab ${this._activeTab === 'report' ? 'active' : ''}" @click=${() => { this._activeTab = 'report'; }}>Report</button>
          </div>

          ${this._activeTab === 'topology' ? this._renderTopology() : nothing}
          ${this._activeTab === 'paths' ? this._renderPaths() : nothing}
          ${this._activeTab === 'details' ? this._renderPathDetails() : nothing}
          ${this._activeTab === 'report' ? this._renderReport() : nothing}
        ` : html`
          <div class="empty-state">Click "Discover Network & Paths" to start network analysis</div>
        `}
      </div>
        ${this._renderPathComparison()}
        ${this._renderAnomalyPanel()}
        ${this._renderPanelConfig()}
        ${this._renderTeamPanel()}
        ${this._renderPathInsights()}
        ${this._renderRiskGauge()}
        ${this._renderFooter()}
      </div>
    `;
  }

  private _renderTopology() {
    const filteredAssets = this._filterZone === 'all' ? this._assets : this._assets.filter(a => a.zone === this._filterZone);
    const filteredTrusts = this._trusts.filter(t => {
      if (this._filterZone !== 'all') {
        const src = this._assets.find(a => a.id === t.source);
        const tgt = this._assets.find(a => a.id === t.target);
        return (src?.zone === this._filterZone) || (tgt?.zone === this._filterZone);
      }
      return true;
    });

    const zoneGroups: Record<string, NetworkAsset[]> = {};
    filteredAssets.forEach(a => {
      if (!zoneGroups[a.zone]) zoneGroups[a.zone] = [];
      zoneGroups[a.zone].push(a);
    });

    const zoneYPositions: Record<string, number> = { dmz: 60, internal: 160, management: 260, restricted: 360, cloud: 460, iot: 120 };
    const assetSpacing = 140;
    const svgWidth = 800;
    const svgHeight = 520;

    let nodePositions: Record<string, { x: number; y: number }> = {};
    Object.entries(zoneGroups).forEach(([zone, assets]) => {
      const y = zoneYPositions[zone] || 200;
      const startX = (svgWidth - (assets.length - 1) * assetSpacing) / 2;
      assets.forEach((a, i) => {
        nodePositions[a.id] = { x: startX + i * assetSpacing, y };
      });
    });

    return html`
      <div class="topo-container">
        <svg class="topo-svg" viewBox="0 0 ${svgWidth} ${svgHeight}">
          <!-- Zone labels -->
          ${Object.entries(zoneGroups).map(([zone, assets]) => {
            const y = zoneYPositions[zone] || 200;
            const firstAsset = assets[0];
            const xPos = nodePositions[firstAsset.id]?.x || 100;
            return html`<text x="20" y="${y + 4}" fill="${ZONE_COLORS[zone] || '#6b7280'}" font-size="11" font-weight="600">${zone.toUpperCase()}</text>`;
          })}

          <!-- Trust lines -->
          ${filteredTrusts.map(t => {
            const src = nodePositions[t.source];
            const tgt = nodePositions[t.target];
            if (!src || !tgt) return nothing;
            const isHighlighted = this._highlightedAsset === t.source || this._highlightedAsset === t.target;
            const color = t.type === 'admin' ? '#ef4444' : t.type === 'credential' ? '#f59e0b' : t.type === 'network' ? '#3b82f6' : '#8b5cf6';
            return html`
              <line x1="${src.x}" y1="${src.y}" x2="${tgt.x}" y2="${tgt.y}" stroke="${color}" stroke-width="${isHighlighted ? 2.5 : 1}" stroke-dasharray="${t.type === 'network' ? '4,4' : 'none'}" opacity="${isHighlighted ? 1 : 0.4}"/>
              <text x="${(src.x + tgt.x) / 2}" y="${(src.y + tgt.y) / 2 - 4}" fill="${color}" font-size="8" opacity="0.6">${t.type}</text>
            `;
          })}

          <!-- Nodes -->
          ${filteredAssets.map(a => {
            const pos = nodePositions[a.id];
            if (!pos) return nothing;
            const isCompromised = this._paths.some(p => p.nodes.includes(a.id));
            const hasCritVuln = a.vulnerabilities.some(v => v.severity === 'critical');
            const nodeColor = a.compromised ? '#ef4444' : hasCritVuln ? '#f59e0b' : ZONE_COLORS[a.zone] || '#3b82f6';
            const isSelected = this._highlightedAsset === a.id;
            return html`
              <g @click=${() => { this._highlightedAsset = isSelected ? null : a.id; }}>
                <circle cx="${pos.x}" cy="${pos.y}" r="${isSelected ? 22 : 18}" fill="${nodeColor}" opacity="${isSelected ? 1 : 0.8}" stroke="${isSelected ? '#fff' : 'transparent'}" stroke-width="2"/>
                <text x="${pos.x}" y="${pos.y - 28}" fill="#e2e8f0" font-size="10" text-anchor="middle" font-weight="600">${a.name}</text>
                <text x="${pos.x}" y="${pos.y - 17}" fill="#9ca3af" font-size="8" text-anchor="middle">${a.ip}</text>
                <text x="${pos.x}" y="${pos.y + 4}" fill="white" font-size="12" text-anchor="middle">${this._getAssetTypeIcon(a.type)}</text>
                ${a.vulnerabilities.length > 0 ? html`<text x="${pos.x + 14}" y="${pos.y + 14}" fill="#f87171" font-size="9" font-weight="700">${a.vulnerabilities.length}</text>` : nothing}
              </g>
            `;
          })}

          <!-- Internet node -->
          <g>
            <circle cx="${svgWidth / 2}" cy="20" r="14" fill="#374151" stroke="#6b7280" stroke-width="1"/>
            <text x="${svgWidth / 2}" y="24" fill="#e2e8f0" font-size="10" text-anchor="middle">INET</text>
            <line x1="${svgWidth / 2}" y1="34" x2="${nodePositions['a6']?.x || 400}" y2="${zoneYPositions['dmz'] || 60}" stroke="#6b7280" stroke-width="1" stroke-dasharray="4,4" opacity="0.4"/>
            <line x1="${svgWidth / 2}" y1="34" x2="${nodePositions['a2']?.x || 400}" y2="${zoneYPositions['dmz'] || 60}" stroke="#6b7280" stroke-width="1" stroke-dasharray="4,4" opacity="0.4"/>
          </g>
        </svg>
        <div class="topo-legend">
          <div class="legend-item"><div class="legend-dot" style="background:#3b82f6"></div> Network</div>
          <div class="legend-item"><div class="legend-dot" style="background:#ef4444"></div> Admin</div>
          <div class="legend-item"><div class="legend-dot" style="background:#f59e0b"></div> Credential</div>
          <div class="legend-item"><div class="legend-dot" style="background:#8b5cf6"></div> Service</div>
          <div class="legend-item"><span style="color:#f87171;font-size:11px;font-weight:600">N</span> Vulnerability Count</div>
        </div>
      </div>
    `;
  }

  private _renderPaths() {
    if (this._paths.length === 0) return html`<div class="empty-state">No paths discovered</div>`;
    return html`
      <div class="path-list">
        ${this._paths.map(p => html`
          <div class="path-card ${this._selectedPath?.id === p.id ? 'selected' : ''}" @click=${() => this._selectPath(p)}>
            <div class="path-name">${p.name}</div>
            <div class="path-meta">
              <span>Risk: <strong style="color:${p.totalRisk >= 9 ? '#f87171' : p.totalRisk >= 7 ? '#fbbf24' : '#60a5fa'}">${p.totalRisk}</strong></span>
              <span>Exploit: ${p.exploitability}/10</span>
              <span>Impact: ${p.impact}/10</span>
              <span>Steps: ${p.steps.length}</span>
            </div>
            <div class="risk-bar"><div class="risk-fill ${this._getRiskClass(p.totalRisk)}" style="width:${p.totalRisk * 10}%"></div></div>
          </div>
        `)}
      </div>
    `;
  }

  private _renderPathDetails() {
    if (!this._selectedPath) return html`<div class="empty-state">Select a path to view details</div>`;
    const p = this._selectedPath;
    return html`
      <div class="detail-panel">
        <div style="font-size:16px;font-weight:700;margin-bottom:12px">${p.name}</div>
        <div style="display:flex;gap:16px;margin-bottom:16px;font-size:13px;flex-wrap:wrap">
          <span>Total Risk: <strong style="color:${p.totalRisk >= 9 ? '#f87171' : '#fbbf24'}">${p.totalRisk}</strong></span>
          <span>Exploitability: ${p.exploitability}/10</span>
          <span>Impact: ${p.impact}/10</span>
        </div>

        <div style="font-weight:600;margin-bottom:8px">Attack Steps</div>
        ${p.steps.map((s, i) => html`
          <div class="step-row">
            <div class="step-num ${this._getDiffClass(s.difficulty)}">${i + 1}</div>
            <div style="flex:1">
              <div><strong>${s.asset}</strong></div>
              <div style="font-size:12px;color:#d1d5db">${s.action}</div>
              <div style="font-size:11px;color:#9ca3af">${s.technique}</div>
            </div>
            <span style="font-size:11px;padding:2px 8px;border-radius:4px;${s.difficulty === 'easy' ? 'background:#064e3b;color:#34d399' : s.difficulty === 'medium' ? 'background:#78350f;color:#fbbf24' : 'background:#7f1d1d;color:#f87171'}">${s.difficulty}</span>
          </div>
        `)}

        <div style="font-weight:600;margin:16px 0 8px">Recommended Mitigations</div>
        ${p.mitigations.map(m => html`
          <div class="mitigation-card">
            <div><strong>Step ${m.step + 1}:</strong> ${m.recommendation}</div>
            <div style="margin-top:4px;display:flex;gap:12px;font-size:11px">
              <span>Effort: <span class="effort-${m.effort}">${m.effort}</span></span>
              <span>Effectiveness: <strong>${m.effectiveness}%</strong></span>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private _renderReport() {
    if (!this._showReport) {
      return html`<div class="empty-state">Click "Generate Report" to create an assessment report</div>`;
    }
    return html`
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:600;font-size:14px">Assessment Report</span>
          <button class="btn btn-primary btn-sm" @click=${this._exportReport}>Export Markdown</button>
        </div>
        <div class="report-box">${this._reportContent}</div>
      </div>
    `;
  }

  // === SECTION A: Multi-Phase Pipeline Execution Engine ===
  private _pipelinePhases: { id: string; name: string; status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled-back'; progress: number; duration: number; errors: string[]; rollbackSteps: string[] }[] = [
    { id: 'ph-1', name: 'Network Topology Mapping', status: 'completed', progress: 100, duration: 60, errors: [], rollbackSteps: ['Reset network topology mapping state'] },
    { id: 'ph-2', name: 'Trust Relationship Discovery', status: 'completed', progress: 100, duration: 90, errors: [], rollbackSteps: ['Reset trust relationship discovery state'] },
    { id: 'ph-3', name: 'Vulnerability Overlay', status: 'running', progress: 65, duration: 120, errors: [], rollbackSteps: ['Reset vulnerability overlay state'] },
    { id: 'ph-4', name: 'Path Scoring Algorithm', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset path scoring algorithm state'] },
    { id: 'ph-5', name: 'Lateral Movement Analysis', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset lateral movement analysis state'] },
    { id: 'ph-6', name: 'Mitigation Mapping', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset mitigation mapping state'] },
    { id: 'ph-7', name: 'Path Report Generation', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset path report generation state'] },
  ];

  private _pipelineJobQueue: { id: string; name: string; priority: number; status: 'queued' | 'processing' | 'done'; phaseId: string; submittedAt: number; startedAt: number }[] = [
    { id: 'job-001', name: 'Map internal subnets', priority: 1, status: 'done', phaseId: 'ph-1', submittedAt: Date.now() - 300000, startedAt: Date.now() - 280000 },
    { id: 'job-002', name: 'Discover trust relationships', priority: 2, status: 'done', phaseId: 'ph-2', submittedAt: Date.now() - 250000, startedAt: Date.now() - 230000 },
    { id: 'job-003', name: 'Overlay vulnerability data', priority: 3, status: 'processing', phaseId: 'ph-3', submittedAt: Date.now() - 200000, startedAt: 0 },
    { id: 'job-004', name: 'Calculate path probabilities', priority: 2, status: 'queued', phaseId: 'ph-4', submittedAt: Date.now() - 150000, startedAt: 0 },
    { id: 'job-005', name: 'Generate attack graphs', priority: 4, status: 'queued', phaseId: 'ph-5', submittedAt: Date.now() - 100000, startedAt: 0 },
  ];

  private _errorCategories: { category: string; icon: string; count: number; autoRemediation: string }[] = [
    { category: 'Subnet Unreachable', icon: 'net', count: 5, autoRemediation: 'Use alternate scan technique' },
    { category: 'Credential Timeout', icon: 'hash', count: 3, autoRemediation: 'Refresh authentication tokens' },
    { category: 'Graph Cycle Detected', icon: 'fs', count: 2, autoRemediation: 'Apply cycle detection and pruning' },
    { category: 'Missing CVE Data', icon: 'time', count: 8, autoRemediation: 'Fetch from NVD database' },
    { category: 'Privilege Escalation Unknown', icon: 'out', count: 4, autoRemediation: 'Flag for manual review' },
    { category: 'Path Explosion', icon: 'scan', count: 1, autoRemediation: 'Limit path depth to 10 hops' },
  ];

  private _batchProcessingConfig: { enabled: boolean; chunkSize: number; parallelChunks: number; retryAttempts: number; retryDelayMs: number } = {
    enabled: true, chunkSize: 50, parallelChunks: 3, retryAttempts: 3, retryDelayMs: 2000,
  };

  private _renderPipelineEngine(): any {
    const phases = this._pipelinePhases;
    const completed = phases.filter(p => p.status === 'completed').length;
    const totalProgress = Math.round(phases.reduce((s, p) => s + p.progress, 0) / (phases.length || 1));
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Pipeline Execution Engine</span>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm" style="background:#ef4444;color:#fff" @click=${() => this._handlePipelineAction('rollback')}>Rollback</button>
            <button class="btn btn-sm" style="background:#22c55e;color:#fff" @click=${() => this._handlePipelineAction('resume')}>Resume</button>
            <button class="btn btn-sm" style="background:#3b82f6;color:#fff" @click=${() => this._handlePipelineAction('pause')}>Pause</button>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
          <div style="flex:1;height:8px;background:#0a0c10;border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${totalProgress}%;background:linear-gradient(90deg,#3b82f6,#8b5cf6);border-radius:4px;transition:width 0.5s"></div>
          </div>
          <span style="font-size:11px;color:#e2e8f0;font-weight:600">${totalProgress}%</span>
          <span style="font-size:10px;color:#6b7280">${completed}/${phases.length} phases</span>
        </div>
        ${phases.map((p, i) => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;background:${p.status === 'running' ? '#3b82f610' : '#0a0c10'};border-radius:4px;margin-bottom:3px;border-left:3px solid ${p.status === 'completed' ? '#22c55e' : p.status === 'running' ? '#3b82f6' : p.status === 'failed' ? '#ef4444' : '#374151'}">
            <span style="font-size:10px;color:#6b7280;width:18px">P${i + 1}</span>
            <span style="flex:1;font-size:11px;color:#e2e8f0">${p.name}</span>
            <div style="width:80px;height:4px;background:#1f2937;border-radius:2px;overflow:hidden">
              <div style="height:100%;width:${p.progress}%;background:${p.status === 'failed' ? '#ef4444' : '#8b5cf6'};border-radius:2px"></div>
            </div>
            <span style="font-size:9px;color:#6b7280;width:30px;text-align:right">${p.progress}%</span>
            ${p.duration > 0 ? html`<span style="font-size:9px;color:#6b7280">${p.duration}s</span>` : html``}
            <span class="tag" style="font-size:8px;background:${p.status === 'completed' ? '#22c55e20' : p.status === 'running' ? '#3b82f620' : p.status === 'failed' ? '#ef444420' : '#37415120'};color:${p.status === 'completed' ? '#22c55e' : p.status === 'running' ? '#3b82f6' : p.status === 'failed' ? '#ef4444' : '#6b7280'}">${p.status}</span>
          </div>
        `)}
        <div style="margin-top:10px">
          <div style="font-size:10px;color:#6b7280;margin-bottom:6px;text-transform:uppercase;font-weight:600">Job Queue (${this._pipelineJobQueue.length} jobs)</div>
          ${this._pipelineJobQueue.slice(0, 4).map(j => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#0a0c10;border-radius:3px;margin-bottom:2px;font-size:10px">
              <span style="color:#fbbf24;font-weight:700">P${j.priority}</span>
              <span style="flex:1;color:#d1d5db">${j.name}</span>
              <span class="tag" style="font-size:8px;color:${j.status === 'done' ? '#22c55e' : j.status === 'processing' ? '#3b82f6' : '#6b7280'}">${j.status}</span>
            </div>
          `)}
        </div>
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:10px">Error Categories & Auto-Remediation</div>
        ${this._errorCategories.map(e => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px">
            <span style="font-size:14px">${e.icon === 'net' ? '🌐' : e.icon === 'proto' ? '📡' : e.icon === 'dns' ? '🔍' : e.icon === 'scan' ? '🔎' : e.icon === 'tls' ? '🔒' : e.icon === 'out' ? '📤' : e.icon === 'disk' ? '💿' : e.icon === 'hash' ? '#️⃣' : e.icon === 'enc' ? '🔐' : e.icon === 'fs' ? '📁' : e.icon === 'time' ? '⏰' : e.icon === 'aft' ? '🛡️' : '⚠️'}</span>
            <div style="flex:1">
              <div style="font-size:11px;color:#e2e8f0;font-weight:600">${e.category}</div>
              <div style="font-size:9px;color:#6b7280">${e.autoRemediation}</div>
            </div>
            <span style="font-size:14px;font-weight:700;color:#f87171">${e.count}</span>
            <button class="btn btn-sm" style="font-size:9px;background:#22c55e20;color:#22c55e;border:1px solid #22c55e40">Auto-Fix</button>
          </div>
        `)}
      </div>`;
  }

  private _handlePipelineAction(action: string) {
    if (action === 'rollback') {
      const runningPhase = this._pipelinePhases.find(p => p.status === 'running');
      if (runningPhase) { runningPhase.status = 'rolled-back'; runningPhase.progress = 0; }
    } else if (action === 'resume') {
      const pending = this._pipelinePhases.find(p => p.status === 'pending');
      if (pending) { pending.status = 'running'; pending.progress = 10; }
    }
  }

  // === SECTION B: Advanced Data Grid ===
  private _gridColumns: { key: string; label: string; width: number; frozen: boolean; editable: boolean; type: 'text' | 'progress' | 'badge' | 'sparkline'; sortable: boolean; resizable: boolean }[] = [
    { key: 'id', label: 'ID', width: 70, frozen: true, editable: false, type: 'text', sortable: true, resizable: true },
    { key: 'case', label: 'Case/Zone', width: 130, frozen: true, editable: true, type: 'text', sortable: true, resizable: true },
    { key: 'finding', label: 'Finding', width: 240, frozen: false, editable: true, type: 'text', sortable: true, resizable: true },
    { key: 'severity', label: 'Severity', width: 90, frozen: false, editable: false, type: 'badge', sortable: true, resizable: true },
    { key: 'riskScore', label: 'Risk Score', width: 110, frozen: false, editable: false, type: 'progress', sortable: true, resizable: true },
    { key: 'trend', label: '7-Day Trend', width: 100, frozen: false, editable: false, type: 'sparkline', sortable: false, resizable: true },
    { key: 'status', label: 'Status', width: 100, frozen: false, editable: true, type: 'badge', sortable: true, resizable: true },
    { key: 'assignee', label: 'Assignee', width: 120, frozen: false, editable: true, type: 'text', sortable: true, resizable: true },
  ];

  private _gridRows: Record<string, any>[] = [
    { id: 'AP-001', case: 'Internal', finding: 'Web server to domain admin via Kerberoasting', severity: 'critical', riskScore: 94, trend: [78,82,85,88,90,92,94], status: 'confirmed', assignee: 'Red Team' },
    { id: 'AP-002', case: 'DMZ to Internal', finding: 'SQL injection to internal database pivot', severity: 'high', riskScore: 82, trend: [60,64,68,72,75,78,82], status: 'active', assignee: 'Pentest Team' },
    { id: 'AP-003', case: 'Cloud', finding: 'IAM role chaining to full account takeover', severity: 'critical', riskScore: 91, trend: [75,78,82,85,87,89,91], status: 'analyzing', assignee: 'Cloud Sec' },
    { id: 'AP-004', case: 'Internal', finding: 'Pass-the-hash lateral movement path', severity: 'high', riskScore: 79, trend: [55,58,62,66,70,74,79], status: 'confirmed', assignee: 'IR Team' },
    { id: 'AP-005', case: 'DMZ', finding: 'WAF bypass to app server RCE', severity: 'high', riskScore: 85, trend: [68,72,75,78,80,82,85], status: 'investigating', assignee: 'AppSec' },
    { id: 'AP-006', case: 'Internal', finding: 'Print spooler to domain controller', severity: 'critical', riskScore: 97, trend: [85,87,89,91,93,95,97], status: 'confirmed', assignee: 'Red Team' },
  ];

  private _gridSelectedRows: Set<string> = new Set();
  private _gridSortColumn: string = 'riskScore';
  private _gridSortAsc: boolean = false;

  private _renderAdvancedGrid(): any {
    const cols = this._gridColumns;
    const rows = [...this._gridRows].sort((a, b) => {
      const av = a[this._gridSortColumn], bv = b[this._gridSortColumn];
      if (typeof av === 'number') return this._gridSortAsc ? av - bv : bv - av;
      return this._gridSortAsc ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
    const frozenCols = cols.filter(c => c.frozen);
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Attack Path Discovery Findings Grid</span>
          <div style="display:flex;gap:4px">
            <button class="btn btn-sm" style="font-size:9px" ?disabled=${this._gridSelectedRows.size === 0} @click=${() => {}}>Export Selected (${this._gridSelectedRows.size})</button>
            <button class="btn btn-sm" style="font-size:9px" @click=${() => this._gridSelectedRows.clear()}>Clear Selection</button>
          </div>
        </div>
        <div style="overflow-x:auto;border-radius:6px;border:1px solid #374151">
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead>
              <tr style="background:#0a0c10">
                <th style="padding:6px 8px;text-align:left;color:#6b7280;width:30px"><input type="checkbox" @change=${(e: any) => { rows.forEach(r => { if (e.target.checked) this._gridSelectedRows.add(r.id); else this._gridSelectedRows.delete(r.id); }); }} /></th>
                ${cols.map(c => html`
                  <th style="padding:6px 8px;text-align:left;color:#9ca3af;font-weight:600;min-width:${c.width}px;position:${c.frozen ? 'sticky' : 'static'};left:${c.frozen && frozenCols.indexOf(c) === 0 ? '30px' : c.frozen ? '90px' : 'auto'};z-index:2;background:#0a0c10;cursor:pointer;border-right:1px solid #1f2937" @click=${() => { if (c.sortable) { if (this._gridSortColumn === c.key) this._gridSortAsc = !this._gridSortAsc; else { this._gridSortColumn = c.key; this._gridSortAsc = true; } } }}>
                    ${c.label} ${this._gridSortColumn === c.key ? (this._gridSortAsc ? '▲' : '▼') : ''}
                  </th>
                `)}
              </tr>
            </thead>
            <tbody>
              ${rows.map(r => html`
                <tr style="background:${this._gridSelectedRows.has(r.id) ? '#3b82f610' : 'transparent'};border-bottom:1px solid #1f293710">
                  <td style="padding:4px 8px;position:sticky;left:0;z-index:1;background:${this._gridSelectedRows.has(r.id) ? '#3b82f610' : '#1f2937'}"><input type="checkbox" .checked=${this._gridSelectedRows.has(r.id)} @change=${(e: any) => { if (e.target.checked) this._gridSelectedRows.add(r.id); else this._gridSelectedRows.delete(r.id); }} /></td>
                  ${cols.map(c => html`<td style="padding:4px 8px;color:#d1d5db;${c.frozen ? 'position:sticky;z-index:1;background:' + (this._gridSelectedRows.has(r.id) ? '#3b82f610' : '#1f2937') + ';' : ''}${c.frozen && frozenCols.indexOf(c) === 0 ? 'left:30px;' : c.frozen ? 'left:90px;' : ''}">
                    ${c.type === 'badge' ? html`<span class="tag" style="font-size:9px;background:${r[c.key] === 'critical' ? '#ef444420' : r[c.key] === 'high' ? '#f9731620' : r[c.key] === 'medium' ? '#fbbf2420' : r[c.key] === 'low' ? '#22c55e20' : r[c.key] === 'open' ? '#ef444420' : r[c.key] === 'in-progress' ? '#3b82f620' : r[c.key] === 'investigating' ? '#fbbf2420' : r[c.key] === 'confirmed' ? '#ef444420' : r[c.key] === 'analyzing' ? '#8b5cf620' : r[c.key] === 'escalated' ? '#f9731620' : r[c.key] === 'mitigated' ? '#22c55e20' : r[c.key] === 'active' ? '#3b82f620' : r[c.key] === 'completed' ? '#22c55e20' : '#37415120'};color:${r[c.key] === 'critical' ? '#f87171' : r[c.key] === 'high' ? '#fb923c' : r[c.key] === 'medium' ? '#fbbf24' : r[c.key] === 'low' ? '#34d399' : r[c.key] === 'open' ? '#f87171' : r[c.key] === 'in-progress' ? '#60a5fa' : r[c.key] === 'investigating' ? '#fbbf24' : r[c.key] === 'confirmed' ? '#f87171' : r[c.key] === 'analyzing' ? '#a78bfa' : r[c.key] === 'escalated' ? '#fb923c' : r[c.key] === 'mitigated' ? '#34d399' : r[c.key] === 'active' ? '#60a5fa' : r[c.key] === 'completed' ? '#34d399' : '#6b7280'}">${r[c.key]}</span>` :
                      c.type === 'progress' ? html`<div style="display:flex;align-items:center;gap:6px"><div style="flex:1;height:6px;background:#0a0c10;border-radius:3px;overflow:hidden"><div style="height:100%;width:${r[c.key]}%;background:${r[c.key] >= 80 ? '#ef4444' : r[c.key] >= 60 ? '#f97316' : '#22c55e'};border-radius:3px"></div></div><span style="font-size:10px;color:#9ca3af">${r[c.key]}</span></div>` :
                      c.type === 'sparkline' ? html`<svg width="80" height="24" viewBox="0 0 80 24">${r[c.key].map((v: number, i: number, arr: number[]) => { const x = (i / (arr.length - 1)) * 80; const y = 24 - (v / 100) * 24; return i === 0 ? '' : '<line x1="' + ((i - 1) / (arr.length - 1) * 80) + '" y1="' + (24 - (arr[i - 1] / 100) * 24) + '" x2="' + x + '" y2="' + y + '" stroke="#3b82f6" stroke-width="1.5"/>'; }).join('')}</svg>` :
                      r[c.key]}
                  </td>`)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  // === SECTION C: Domain-Specific Calculators ===
  private _roiScenarios: { name: string; investment: number; annualSavings: number; riskReduction: number; paybackMonths: number; npv: number }[] = [
    { name: 'Attack Path Analysis Tool', investment: 95000, annualSavings: 78000, riskReduction: 32, paybackMonths: 15, npv: 205000 },
    { name: 'Network Segmentation Project', investment: 280000, annualSavings: 195000, riskReduction: 45, paybackMonths: 18, npv: 420000 },
    { name: 'Privileged Access Management', investment: 180000, annualSavings: 145000, riskReduction: 38, paybackMonths: 15, npv: 365000 },
    { name: 'Zero Trust Implementation', investment: 450000, annualSavings: 320000, riskReduction: 55, paybackMonths: 17, npv: 780000 },
  ];

  private _riskQuantMetrics: { metric: string; sle: number; aro: number; ale: number; mitigationCost: number; roi: number }[] = [
    { metric: 'Domain Admin Compromise', sle: 8000000, aro: 0.08, ale: 640000, mitigationCost: 180000, roi: 256 },
    { metric: 'Lateral Movement to Crown Jewels', sle: 5500000, aro: 0.12, ale: 660000, mitigationCost: 150000, roi: 340 },
    { metric: 'Cloud Account Takeover', sle: 4200000, aro: 0.15, ale: 630000, mitigationCost: 95000, roi: 563 },
  ];

  private _renderDomainCalculators(): any {
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:10px">ROI Scenario Modeling</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin-bottom:10px">
          ${this._roiScenarios.map(s => html`
            <div style="background:#0a0c10;border-radius:6px;padding:10px;border-left:3px solid ${s.npv > 300000 ? '#22c55e' : s.npv > 150000 ? '#3b82f6' : '#fbbf24'}">
              <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">${s.name}</div>
              <div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-bottom:2px"><span>Investment</span><span style="color:#e2e8f0">$${(s.investment / 1000).toFixed(0)}K</span></div>
              <div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-bottom:2px"><span>Annual Savings</span><span style="color:#22c55e">$${(s.annualSavings / 1000).toFixed(0)}K</span></div>
              <div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-bottom:2px"><span>Risk Reduction</span><span style="color:#3b82f6">${s.riskReduction}%</span></div>
              <div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-bottom:2px"><span>Payback</span><span style="color:#fbbf24">${s.paybackMonths}mo</span></div>
              <div style="display:flex;justify-content:space-between;font-size:10px;font-weight:600;margin-top:4px"><span style="color:#9ca3af">NPV (3yr)</span><span style="color:#22c55e">$${(s.npv / 1000).toFixed(0)}K</span></div>
            </div>
          `)}
        </div>
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:10px">Risk Quantification (ALE/SLE/ARO)</div>
        ${this._riskQuantMetrics.map(r => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px;font-size:10px">
            <span style="flex:1;color:#e2e8f0;font-weight:600">${r.metric}</span>
            <span style="color:#6b7280;width:70px;text-align:right">SLE: $${(r.sle / 1000000).toFixed(1)}M</span>
            <span style="color:#6b7280;width:50px;text-align:right">ARO: ${r.aro}</span>
            <span style="color:#f87171;font-weight:700;width:80px;text-align:right">ALE: $${(r.ale / 1000).toFixed(0)}K</span>
            <span style="color:#22c55e;width:70px;text-align:right">ROI: ${r.roi}%</span>
          </div>
        `)}
      </div>`;
  }

  // === SECTION D: Integration Points ===
  private _apiEndpoints: { name: string; url: string; method: string; headers: Record<string, string>; lastStatus: number; lastCalled: string }[] = [
    { name: 'Topology Scanner', url: '/api/v1/attack-path/topology', method: 'POST', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '10m ago' },
    { name: 'Path Calculator', url: '/api/v1/attack-path/calculate', method: 'POST', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '5m ago' },
    { name: 'Mitigation Engine', url: '/api/v1/attack-path/mitigate', method: 'GET', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '15m ago' },
  ];

  private _webhookConfigs: { id: string; name: string; url: string; events: string[]; active: boolean; lastTriggered: string }[] = [
    { id: 'wh-1', name: 'Critical Path Found', url: 'https://hooks.slack.com/T00/B00/ap1', events: ['critical_path'], active: true, lastTriggered: '20m ago' },
    { id: 'wh-2', name: 'Path Change Alert', url: 'https://hooks.slack.com/T00/B00/ap2', events: ['path_updated'], active: true, lastTriggered: '1h ago' },
    { id: 'wh-3', name: 'JIRA Remediation', url: 'https://company.atlassian.net/rest/webhooks/3', events: ['new_path'], active: true, lastTriggered: '2h ago' },
  ];

  private _dataSourceConnections: { name: string; type: string; status: 'connected' | 'disconnected' | 'error'; lastSync: string; records: number }[] = [
    { name: 'Vulnerability Scanner', type: 'Nessus', status: 'connected', lastSync: '30m ago', records: 45600 },
    { name: 'Active Directory', type: 'LDAP', status: 'connected', lastSync: '5m ago', records: 8900 },
    { name: 'Cloud Asset Inventory', type: 'AWS Config', status: 'connected', lastSync: '15m ago', records: 12300 },
  ];

  private _renderIntegrationPoints(): any {
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:10px">API Endpoints</div>
        ${this._apiEndpoints.map(ep => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px;font-size:10px">
            <span class="tag" style="background:${ep.method === 'GET' ? '#22c55e20' : '#3b82f620'};color:${ep.method === 'GET' ? '#22c55e' : '#60a5fa'}">${ep.method}</span>
            <span style="flex:1;color:#d1d5db;font-family:monospace;font-size:9px">${ep.url}</span>
            <span style="color:${ep.lastStatus < 300 ? '#22c55e' : '#f87171'}">${ep.lastStatus}</span>
            <span style="color:#6b7280">${ep.lastCalled}</span>
            <button class="btn btn-sm" style="font-size:8px">Test</button>
          </div>
        `)}
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin:12px 0 8px">Webhooks</div>
        ${this._webhookConfigs.map(wh => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px;font-size:10px">
            <span style="color:${wh.active ? '#22c55e' : '#6b7280'}">${wh.active ? '●' : '○'}</span>
            <span style="flex:1;color:#e2e8f0">${wh.name}</span>
            <span style="color:#6b7280">${wh.events.length} events</span>
            <span style="color:#6b7280">${wh.lastTriggered}</span>
            <button class="btn btn-sm" style="font-size:8px">Edit</button>
          </div>
        `)}
        <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin:12px 0 8px">Data Sources</div>
        ${this._dataSourceConnections.map(ds => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px;font-size:10px">
            <span style="color:${ds.status === 'connected' ? '#22c55e' : ds.status === 'error' ? '#f87171' : '#6b7280'}">${ds.status === 'connected' ? '●' : '○'}</span>
            <span style="flex:1;color:#e2e8f0">${ds.name}</span>
            <span class="tag" style="font-size:8px">${ds.type}</span>
            <span style="color:#6b7280">${ds.records.toLocaleString()} records</span>
            <span style="color:#6b7280">${ds.lastSync}</span>
          </div>
        `)}
      </div>`;
  }

  // === SECTION E: Documentation & Help ===
  private _showHelpOverlay = false;
  private _glossaryTerms: { term: string; definition: string }[] = [
    { term: 'Attack Path', definition: 'Sequence of steps an adversary can take to reach an objective' },
    { term: 'Attack Graph', definition: 'Visual representation of possible attack paths in a network' },
    { term: 'Kerberoasting', definition: 'Extracting service account hashes from Kerberos TGS tickets' },
    { term: 'Pass-the-Hash', definition: 'Using captured NTLM hash to authenticate without password' },
    { term: 'Crown Jewels', definition: 'Most valuable assets an attacker would target' },
    { term: 'Blast Radius', definition: 'Scope of impact from a single security failure' },
    { term: 'Pivoting', definition: 'Using a compromised host to access other network segments' },
    { term: 'Lateral Movement', definition: 'Moving through a network after initial compromise' },
    { term: 'Graph Theory', definition: 'Mathematical framework for analyzing network relationships' },
    { term: 'CVSS Score', definition: 'Common Vulnerability Scoring System severity rating' },
    { term: 'Prerequisite Graph', definition: 'Dependencies between exploits for a full attack chain' },
    { term: 'Choke Point', definition: 'Network location where multiple attack paths converge' },
  ];

  private _keyboardShortcuts: { key: string; action: string }[] = [
    { key: 'Ctrl+Enter', action: 'Execute pipeline' },
    { key: 'Ctrl+Shift+E', action: 'Export current data' },
    { key: 'Ctrl+Shift+R', action: 'Rollback last phase' },
    { key: 'Ctrl+F', action: 'Find in grid' },
    { key: 'Ctrl+A', action: 'Select all rows' },
    { key: 'Escape', action: 'Close overlay' },
    { key: 'Ctrl+1-5', action: 'Switch tabs' },
    { key: 'Ctrl+H', action: 'Toggle help' },
  ];

  private _renderDocumentationHelp(): any {
    if (!this._showHelpOverlay) return html``;
    return html`
      <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center" @click=${() => { this._showHelpOverlay = false; }}>
        <div style="background:#1f2937;border-radius:12px;padding:20px;max-width:600px;max-height:80vh;overflow-y:auto;width:90%" @click=${(e: any) => e.stopPropagation()}>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
            <span style="font-weight:700;font-size:16px;color:#e2e8f0">Help & Documentation</span>
            <button style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:18px" @click=${() => { this._showHelpOverlay = false; }}>✕</button>
          </div>
          <div style="margin-bottom:14px">
            <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:8px">Domain Glossary</div>
            ${this._glossaryTerms.map(g => html`
              <div style="padding:6px 0;border-bottom:1px solid #374151">
                <span style="font-weight:600;color:#60a5fa;font-size:11px">${g.term}</span>
                <p style="font-size:10px;color:#9ca3af;margin:2px 0 0;line-height:1.4">${g.definition}</p>
              </div>
            `)}
          </div>
          <div>
            <div style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase;margin-bottom:8px">Keyboard Shortcuts</div>
            ${this._keyboardShortcuts.map(s => html`
              <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:11px">
                <span style="color:#d1d5db">${s.action}</span>
                <kbd style="background:#0a0c10;padding:2px 8px;border-radius:4px;color:#60a5fa;font-family:monospace;font-size:10px;border:1px solid #374151">${s.key}</kbd>
              </div>
            `)}
          </div>
        </div>
      </div>`;
  }

}
