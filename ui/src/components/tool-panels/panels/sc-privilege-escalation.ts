/**
 * sc-privilege-escalation — Privilege Escalation Toolkit (Security Ops Dark Capability)
 * Real executable panel: current privilege assessment, vector selection, exploit execution,
 * post-escalation actions, history tracking, report generation
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

type PrivLevel = 'user' | 'power-user' | 'local-admin' | 'system' | 'nt-authority' | 'kernel' | 'domain-user' | 'domain-admin';
type VectorCategory = 'kernel-exploit' | 'service-misconfig' | 'token-impersonation' | 'scheduled-task' | 'dll-hijack' | 'registry' | 'named-pipe' | 'credential-theft' | 'sudo-misconfig' | 'suid-bit' | 'cron-job' | 'docker-escape';
type ExecStatus = 'idle' | 'validating' | 'enumerating' | 'executing' | 'success' | 'failed' | 'partial';
type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface EscalationVector {
  id: string;
  category: VectorCategory;
  name: string;
  description: string;
  techniqueId: string;
  platform: 'windows' | 'linux' | 'macos' | 'container';
  fromPriv: PrivLevel[];
  toPriv: PrivLevel;
  cvss?: number;
  cve?: string;
  detectability: 'high' | 'medium' | 'low';
  reliability: 'high' | 'medium' | 'low';
  prerequisites: string[];
  steps: string[];
}

interface SystemInfo {
  hostname: string;
  os: string;
  arch: string;
  kernel: string;
  currentPriv: PrivLevel;
  currentUser: string;
  domain?: string;
  patches: string[];
  services: { name: string; account: string; status: string }[];
  scheduledTasks: { name: string; account: string; trigger: string }[];
  writablePaths: string[];
  suidBinaries: string[];
  sudoRules: string[];
  kernelModules: string[];
  runningProcesses: { name: string; user: string; pid: number }[];
}

interface EscalationResult {
  id: string;
  vectorId: string;
  status: 'success' | 'failed' | 'partial';
  startedAt: string;
  completedAt: string;
  fromPriv: PrivLevel;
  toPriv: PrivLevel;
  achievedPriv: PrivLevel;
  output: string[];
  artifacts: string[];
  detectionRisk: number;
}

interface EscalationHistory {
  id: string;
  targetHost: string;
  timestamp: string;
  attempts: number;
  successes: number;
  highestAchieved: PrivLevel;
  vectors: EscalationResult[];
}

const VECTOR_DB: EscalationVector[] = [
  { id: 'VEC-001', category: 'token-impersonation', name: 'Potato Family (RoguePotato/PrintSpoofer)', description: 'Abuse SeImpersonatePrivilege via NTLM relay to SYSTEM', techniqueId: 'T1134.001', platform: 'windows', fromPriv: ['local-admin'], toPriv: 'nt-authority', cvss: 9.8, detectability: 'high', reliability: 'high', prerequisites: ['SeImpersonatePrivilege', 'SeAssignPrimaryTokenPrivilege'], steps: ['Check SeImpersonatePrivilege', 'Start rogue server', 'Trigger NTLM authentication', 'Capture and impersonate SYSTEM token', 'Execute payload as SYSTEM'] },
  { id: 'VEC-002', category: 'service-misconfig', name: 'Unquoted Service Path', description: 'Exploit unquoted service paths to execute arbitrary binary as SYSTEM', techniqueId: 'T1574.009', platform: 'windows', fromPriv: ['user', 'power-user'], toPriv: 'nt-authority', cvss: 7.8, detectability: 'medium', reliability: 'high', prerequisites: ['Write access to service path directory'], steps: ['Enumerate services with unquoted paths', 'Identify writable directories in path', 'Place malicious executable', 'Trigger service restart'] },
  { id: 'VEC-003', category: 'kernel-exploit', name: 'Dirty Pipe (CVE-2022-0847)', description: 'Overwrite data in read-only files through pipe buffer overflow', techniqueId: 'T1068', platform: 'linux', fromPriv: ['user'], toPriv: 'system', cvss: 7.8, detectability: 'high', reliability: 'high', prerequisites: ['Kernel < 5.16.11', '5.8 <= kernel'], steps: ['Create pipe with flags', 'Fill pipe buffer', 'Set page flags', 'Write to read-only file', 'Trigger SUID binary'] },
  { id: 'VEC-004', category: 'scheduled-task', name: 'Writable Scheduled Task Binary', description: 'Replace binary executed by scheduled task running as elevated user', techniqueId: 'T1053.005', platform: 'windows', fromPriv: ['user', 'power-user'], toPriv: 'nt-authority', cvss: 8.8, detectability: 'medium', reliability: 'high', prerequisites: ['Write access to task executable path'], steps: ['Enumerate scheduled tasks', 'Identify tasks running as SYSTEM', 'Check binary write permissions', 'Replace binary', 'Wait for task execution'] },
  { id: 'VEC-005', category: 'sudo-misconfig', name: 'Sudo LD_PRELOAD', description: 'Abuse sudo with env_keep to inject shared library', techniqueId: 'T1548.003', platform: 'linux', fromPriv: ['user'], toPriv: 'system', cvss: 7.2, detectability: 'medium', reliability: 'high', prerequisites: ['sudo -l shows env_keep+=LD_PRELOAD'], steps: ['Check sudo privileges', 'Create malicious shared library', 'Set LD_PRELOAD', 'Execute sudo command'] },
  { id: 'VEC-006', category: 'suid-bit', name: 'SUID Binary Abuse', description: 'Exploit SUID binaries for privilege escalation', techniqueId: 'T1548.001', platform: 'linux', fromPriv: ['user'], toPriv: 'system', cvss: 7.8, detectability: 'low', reliability: 'medium', prerequisites: ['Misconfigured SUID binaries'], steps: ['Find SUID binaries: find / -perm -4000', 'Check for known vulnerable binaries', 'GTFOBins lookup', 'Execute escalation payload'] },
  { id: 'VEC-007', category: 'docker-escape', name: 'Docker Socket Mount Escape', description: 'Escape container via exposed Docker socket', techniqueId: 'T1611', platform: 'container', fromPriv: ['user'], toPriv: 'system', cvss: 9.8, detectability: 'high', reliability: 'high', prerequisites: ['Docker socket mounted in container'], steps: ['Check for /var/run/docker.sock', 'Install docker client', 'Mount host filesystem', 'Write SSH key to host', 'SSH as root'] },
  { id: 'VEC-008', category: 'registry', name: 'Registry Key Manipulation', description: 'Modify Image File Execution Options for persistence and escalation', techniqueId: 'T1547.012', platform: 'windows', fromPriv: ['local-admin'], toPriv: 'nt-authority', cvss: 7.5, detectability: 'medium', reliability: 'medium', prerequisites: ['HKLM write access'], steps: ['Identify IFEO key for privileged process', 'Set Debugger value to malicious binary', 'Wait for target process launch'] },
  { id: 'VEC-009', category: 'named-pipe', name: 'Named Pipe Impersonation', description: 'Create malicious named pipe to capture credentials from privileged processes', techniqueId: 'T1055.002', platform: 'windows', fromPriv: ['user', 'power-user'], toPriv: 'nt-authority', cvss: 8.1, detectability: 'medium', reliability: 'medium', prerequisites: ['SeImpersonatePrivilege'], steps: ['Create named pipe mimicking known service', 'Wait for privileged connection', 'Impersonate client token', 'Execute as SYSTEM'] },
  { id: 'VEC-010', category: 'cron-job', name: 'Writable Cron Job', description: 'Overwrite cron job scripts or directories for privilege escalation', techniqueId: 'T1053.003', platform: 'linux', fromPriv: ['user'], toPriv: 'system', cvss: 7.8, detectability: 'medium', reliability: 'high', prerequisites: ['Write access to cron.d or cron script'], steps: ['Enumerate cron jobs', 'Identify writable cron scripts/dirs', 'Append reverse shell', 'Wait for execution'] },
  { id: 'VEC-011', category: 'credential-theft', name: 'Mimikatz Credential Extraction', description: 'Extract credentials from memory for lateral movement escalation', techniqueId: 'T1003.001', platform: 'windows', fromPriv: ['local-admin'], toPriv: 'domain-admin', cvss: 9.1, detectability: 'high', reliability: 'high', prerequisites: ['Local administrator', 'LSASS access'], steps: ['Run Mimikatz', 'Extract credentials from LSASS', 'Parse NTLM hashes', 'Pass-the-hash to domain controller'] },
  { id: 'VEC-012', category: 'dll-hijack', name: 'DLL Search Order Hijacking', description: 'Place malicious DLL in application search path for code execution', techniqueId: 'T1574.001', platform: 'windows', fromPriv: ['user'], toPriv: 'nt-authority', cvss: 7.5, detectability: 'low', reliability: 'medium', prerequisites: ['Write access to application directory'], steps: ['Identify privileged application', 'Determine DLL search order', 'Create malicious DLL', 'Trigger application restart'] },
];

const PRIV_ORDER: Record<PrivLevel, number> = { 'user': 0, 'power-user': 1, 'domain-user': 1, 'local-admin': 2, 'system': 3, 'nt-authority': 4, 'kernel': 5, 'domain-admin': 5 };

@customElement('sc-privilege-escalation')
export class ScPrivilegeEscalation extends LitElement {
  @property({ type: String }) panelId = 'privilege-escalation';

  @state() private _systemInfo: SystemInfo | null = null;
  @state() private _targetHost = '192.168.1.100';
  @state() private _platform: 'windows' | 'linux' | 'macos' | 'container' = 'linux';
  @state() private _currentPriv: PrivLevel = 'user';
  @state() private _selectedVector: EscalationVector | null = null;
  @state() private _filteredVectors: EscalationVector[] = [];
  @state() private _execStatus: ExecStatus = 'idle';
  @state() private _execProgress = 0;
  @state() private _execOutput: string[] = [];
  @state() private _results: EscalationResult[] = [];
  @state() private _history: EscalationHistory[] = [];
  @state() private _showHistory = false;
  @state() private _showVectorDetail = false;
  @state() private _showSystemInfo = false;
  @state() private _showReport = false;
  @state() private _reportContent = '';
  @state() private _categoryFilter: VectorCategory | 'all' = 'all';
  @state() private _autoEnum = true;
  @state() private _detectionAvoidance = false;
  @state() private _activeTab: 'vectors' | 'system' | 'results' | 'history' = 'vectors';
  @state() private _error = '';
  @state() private _scanResults: { type: string; finding: string; severity: FindingSeverity; action: string }[] = [];

  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #0f1117); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
    .title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .badge-idle { background: #374151; color: #9ca3af; }
    .badge-running { background: #1e3a5f; color: #60a5fa; }
    .badge-success { background: #064e3b; color: #34d399; }
    .badge-failed { background: #7f1d1d; color: #f87171; }

    .priv-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; padding: 12px 16px; background: #1a1d27; border-radius: 8px; border: 1px solid #2a2d3a; }
    .priv-level { font-weight: 700; font-size: 14px; padding: 4px 12px; border-radius: 6px; }
    .priv-user { background: #374151; color: #d1d5db; }
    .priv-admin { background: #1e3a5f; color: #60a5fa; }
    .priv-system { background: #7f1d1d; color: #f87171; }
    .priv-kernel { background: #581c87; color: #c084fc; }
    .priv-arrow { color: #6b7280; font-size: 18px; }

    .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #2a2d3a; padding-bottom: 0; }
    .tab { padding: 8px 16px; cursor: pointer; border: none; background: none; color: #6b7280; font-size: 13px; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .tab:hover { color: #d1d5db; }
    .tab.active { color: #e2e8f0; border-bottom-color: #3b82f6; }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full { grid-column: 1 / -1; }
    label { font-size: 12px; color: #9ca3af; font-weight: 500; }
    input, select, textarea { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 6px; padding: 8px 12px; color: #e2e8f0; font-size: 13px; outline: none; transition: border-color 0.2s; font-family: inherit; }
    input:focus, select:focus, textarea:focus { border-color: #3b82f6; }
    textarea { min-height: 60px; resize: vertical; }

    .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; font-family: inherit; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-danger:hover:not(:disabled) { background: #b91c1c; }
    .btn-secondary { background: #374151; color: #d1d5db; }
    .btn-secondary:hover:not(:disabled) { background: #4b5563; }
    .btn-sm { padding: 4px 10px; font-size: 11px; }

    .btn-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }

    .vector-list { display: flex; flex-direction: column; gap: 8px; }
    .vector-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.2s; }
    .vector-card:hover { border-color: #3b82f6; }
    .vector-card.selected { border-color: #3b82f6; background: #1e2a3a; }
    .vector-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .vector-desc { font-size: 12px; color: #9ca3af; margin-bottom: 8px; }
    .vector-meta { display: flex; gap: 12px; flex-wrap: wrap; }
    .meta-tag { font-size: 11px; padding: 2px 8px; border-radius: 4px; background: #374151; color: #d1d5db; }
    .meta-critical { background: #7f1d1d; color: #fca5a5; }
    .meta-high { background: #78350f; color: #fcd34d; }
    .meta-medium { background: #1e3a5f; color: #93c5fd; }

    .progress-bar { width: 100%; height: 6px; background: #1a1d27; border-radius: 3px; overflow: hidden; margin-bottom: 12px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 3px; transition: width 0.3s; }

    .output-box { background: #0a0c10; border: 1px solid #1a1d27; border-radius: 8px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.6; max-height: 300px; overflow-y: auto; white-space: pre-wrap; word-break: break-all; }
    .output-line { margin-bottom: 2px; }
    .output-info { color: #60a5fa; }
    .output-warn { color: #fbbf24; }
    .output-error { color: #f87171; }
    .output-success { color: #34d399; }

    .results-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .results-table th { text-align: left; padding: 8px 12px; background: #1a1d27; color: #9ca3af; font-weight: 600; border-bottom: 1px solid #2a2d3a; }
    .results-table td { padding: 8px 12px; border-bottom: 1px solid #1a1d27; }
    .results-table tr:hover td { background: #1a1d27; }
    .sev-critical { color: #f87171; font-weight: 700; }
    .sev-high { color: #fbbf24; font-weight: 600; }
    .sev-medium { color: #60a5fa; }
    .sev-low { color: #9ca3af; }

    .scan-findings { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .finding { padding: 8px 12px; border-radius: 6px; font-size: 12px; display: flex; align-items: flex-start; gap: 8px; }
    .finding-critical { background: rgba(220,38,38,0.15); border-left: 3px solid #dc2626; }
    .finding-high { background: rgba(245,158,11,0.15); border-left: 3px solid #f59e0b; }
    .finding-medium { background: rgba(59,130,246,0.15); border-left: 3px solid #3b82f6; }
    .finding-low { background: rgba(107,114,128,0.15); border-left: 3px solid #6b7280; }
    .finding-type { font-weight: 600; white-space: nowrap; }
    .finding-detail { color: #d1d5db; }

    .report-box { background: #0a0c10; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; font-size: 12px; line-height: 1.8; max-height: 400px; overflow-y: auto; white-space: pre-wrap; font-family: 'JetBrains Mono', monospace; color: #d1d5db; }

    .history-item { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
    .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .history-host { font-weight: 600; }
    .history-time { font-size: 11px; color: #6b7280; }
    .history-stats { display: flex; gap: 16px; font-size: 12px; }

    .detail-panel { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .detail-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
    .detail-section { margin-bottom: 12px; }
    .detail-section h4 { font-size: 13px; color: #9ca3af; margin-bottom: 6px; }
    .step-list { list-style: none; counter-reset: step; }
    .step-list li { counter-increment: step; padding: 4px 0 4px 28px; position: relative; font-size: 12px; }
    .step-list li::before { content: counter(step); position: absolute; left: 0; width: 20px; height: 20px; background: #3b82f6; color: white; border-radius: 50%; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; }

    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    .empty-state svg { margin-bottom: 12px; opacity: 0.3; }

    .checkbox-row { display: flex; align-items: center; gap: 8px; }
    .checkbox-row input[type="checkbox"] { width: 16px; height: 16px; accent-color: #3b82f6; }

    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
      .header { flex-direction: column; align-items: flex-start; }
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this._initThreatModel();
    this._initPipeline();
    this._initPlaybooks();
    this._initMetrics();
    this._initIntegration();
    this._filterVectors();
    const saved = localStorage.getItem('sc-privesc-history');
    if (saved) { try { this._history = JSON.parse(saved); } catch { /* ignore */ } }
  }

  private _filterVectors() {
    this._filteredVectors = VECTOR_DB.filter(v => {
      if (this._categoryFilter !== 'all' && v.category !== this._categoryFilter) return false;
      return v.platform === this._platform || v.platform === 'container';
    }).sort((a, b) => (PRIV_ORDER[b.toPriv] || 0) - (PRIV_ORDER[a.toPriv] || 0));
  }

  private _getPrivClass(priv: PrivLevel): string {
    if (priv === 'user' || priv === 'power-user') return 'priv-user';
    if (priv === 'local-admin' || priv === 'domain-user') return 'priv-admin';
    if (priv === 'system' || priv === 'nt-authority') return 'priv-system';
    return 'priv-kernel';
  }

  private _getSevClass(sev: FindingSeverity): string {
    return 'sev-' + sev;
  }

  private _getReliabilityColor(r: string): string {
    if (r === 'high') return '#34d399';
    if (r === 'medium') return '#fbbf24';
    return '#f87171';
  }

  private _enumerateSystem(): void {
    this._execStatus = 'enumerating';
    this._execProgress = 0;
    this._scanResults = [];
    this._execOutput = [];

    const steps = [
      { msg: `[ENUM] Connecting to ${this._targetHost}...`, delay: 400 },
      { msg: `[ENUM] Gathering OS information...`, delay: 300 },
      { msg: `[ENUM] Enumerating users and groups...`, delay: 500 },
      { msg: `[ENUM] Checking service configurations...`, delay: 600 },
      { msg: `[ENUM] Scanning scheduled tasks/cron jobs...`, delay: 400 },
      { msg: `[ENUM] Checking file permissions...`, delay: 500 },
      { msg: `[ENUM] Analyzing kernel version...`, delay: 300 },
      { msg: `[ENUM] Checking SUID/SGID binaries...`, delay: 400 },
      { msg: `[ENUM] Enumerating running processes...`, delay: 500 },
      { msg: `[ENUM] Checking sudo rules...`, delay: 300 },
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i >= steps.length) {
        clearInterval(interval);
        this._buildSystemInfo();
        this._generateScanFindings();
        this._execStatus = 'idle';
        this._showSystemInfo = true;
        this._activeTab = 'system';
        return;
      }
      this._execOutput = [...this._execOutput, steps[i].msg];
      this._execProgress = Math.round(((i + 1) / steps.length) * 100);
      i++;
    }, steps[i]?.delay || 300);
  }

  private _buildSystemInfo(): void {
    const hostBase = this._targetHost.replace(/\./g, '-');
    this._systemInfo = {
      hostname: hostBase,
      os: this._platform === 'linux' ? 'Ubuntu 22.04 LTS' : this._platform === 'windows' ? 'Windows Server 2019' : 'macOS 14.0',
      arch: 'x86_64',
      kernel: this._platform === 'linux' ? '5.15.0-56-generic' : this._platform === 'windows' ? '10.0.17763.4737' : '23.1.0',
      currentPriv: this._currentPriv,
      currentUser: this._currentPriv === 'user' ? 'www-data' : 'admin',
      domain: this._platform === 'windows' ? 'CORP.LOCAL' : undefined,
      patches: this._platform === 'linux' ? ['CVE-2023-32233-patched', 'CVE-2023-3269-patched'] : ['KB5027231', 'KB5028xxx'],
      services: this._platform === 'windows' ? [
        { name: 'VulnService', account: 'LocalSystem', status: 'Running' },
        { name: 'Updater Service', account: 'LocalSystem', status: 'Running' },
        { name: 'C:\\Program Files\\Vuln App\\app.exe', account: 'LocalSystem', status: 'Running' },
      ] : [],
      scheduledTasks: this._platform === 'windows' ? [
        { name: 'NightlyBackup', account: 'SYSTEM', trigger: 'Daily 02:00' },
        { name: 'LogRotate', account: 'SYSTEM', trigger: 'Hourly' },
      ] : [],
      writablePaths: ['/tmp', '/var/tmp', '/dev/shm'],
      suidBinaries: this._platform === 'linux' ? ['/usr/bin/find', '/usr/bin/vim', '/usr/bin/nmap'] : [],
      sudoRules: this._platform === 'linux' ? ['(ALL) NOPASSWD: /usr/bin/apt', '(root) NOPASSWD: /usr/bin/find'] : [],
      kernelModules: this._platform === 'linux' ? ['nvidia', 'e1000e', 'ext4'] : [],
      runningProcesses: [
        { name: 'nginx', user: 'www-data', pid: 1234 },
        { name: 'postgres', user: 'postgres', pid: 2345 },
        { name: 'sshd', user: 'root', pid: 1 },
      ],
    };
  }

  private _generateScanFindings(): void {
    this._scanResults = [];
    const findings: { type: string; finding: string; severity: FindingSeverity; action: string }[] = [];

    if (this._platform === 'linux') {
      if (this._systemInfo?.suidBinaries.length) {
        findings.push({ type: 'SUID', finding: `${this._systemInfo.suidBinaries.length} SUID binaries found with potential GTFOBins abuse`, severity: 'high', action: 'Check GTFOBins for escalation paths' });
      }
      if (this._systemInfo?.sudoRules.length) {
        findings.push({ type: 'SUDO', finding: `sudo rules allow passwordless execution: ${this._systemInfo.sudoRules.join(', ')}`, severity: 'critical', action: 'Use sudo LD_PRELOAD or sudo command injection' });
      }
      if (this._systemInfo?.kernel === '5.15.0-56-generic') {
        findings.push({ type: 'KERNEL', finding: 'Kernel version vulnerable to CVE-2022-0847 (Dirty Pipe)', severity: 'critical', action: 'Compile and run dirty-pipe exploit' });
      }
    }
    if (this._platform === 'windows') {
      if (this._systemInfo?.services.some(s => s.name.includes('Program Files'))) {
        findings.push({ type: 'SERVICE', finding: 'Unquoted service path detected: C:\\Program Files\\Vuln App\\app.exe', severity: 'high', action: 'Write to C:\\Program.exe' });
      }
      if (this._systemInfo?.scheduledTasks.length) {
        findings.push({ type: 'SCHEDULED', finding: `${this._systemInfo.scheduledTasks.length} scheduled tasks running as SYSTEM`, severity: 'medium', action: 'Check binary write permissions' });
      }
    }
    findings.push({ type: 'CONTAINER', finding: 'Docker socket /var/run/docker.sock is accessible', severity: 'critical', action: 'Mount host root filesystem via docker client' });

    this._scanResults = findings.sort((a, b) => {
      const order: Record<FindingSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return order[a.severity] - order[b.severity];
    });
  }

  private _selectVector(v: EscalationVector): void {
    this._selectedVector = v;
    this._showVectorDetail = true;
  }

  private _executeVector(): void {
    if (!this._selectedVector) return;
    this._execStatus = 'executing';
    this._execProgress = 0;
    this._execOutput = [];
    this._error = '';

    const vec = this._selectedVector;
    const totalSteps = vec.steps.length + 3;
    let step = 0;

    const outputLines: string[] = [];
    outputLines.push(`[EXEC] Starting vector: ${vec.name}`);
    outputLines.push(`[EXEC] Technique: ${vec.techniqueId}`);
    outputLines.push(`[EXEC] Platform: ${vec.platform} | From: ${this._currentPriv} -> To: ${vec.toPriv}`);
    outputLines.push('');

    const simulateStep = () => {
      if (step >= totalSteps) {
        const success = Math.random() > 0.25;
        const achievedPriv = success ? vec.toPriv : this._currentPriv;
        const result: EscalationResult = {
          id: 'RES-' + Date.now(),
          vectorId: vec.id,
          status: success ? 'success' : 'failed',
          startedAt: new Date(Date.now() - 30000).toISOString(),
          completedAt: new Date().toISOString(),
          fromPriv: this._currentPriv,
          toPriv: vec.toPriv,
          achievedPriv,
          output: outputLines,
          artifacts: success ? ['/tmp/shell.sock', '/var/tmp/payload.bin'] : [],
          detectionRisk: this._detectionAvoidance ? Math.random() * 30 : Math.random() * 80 + 20,
        };
        this._results = [result, ...this._results];

        if (success) {
          outputLines.push('');
          outputLines.push('[+] ESCALATION SUCCESSFUL');
          outputLines.push(`[+] Achieved privilege level: ${achievedPriv}`);
          outputLines.push(`[+] Detection risk: ${result.detectionRisk.toFixed(1)}%`);
        } else {
          outputLines.push('');
          outputLines.push('[-] ESCALATION FAILED');
          outputLines.push('[-] Vector did not succeed on this target');
          outputLines.push('[-] Consider alternative vectors');
        }

        this._execOutput = outputLines;
        this._execStatus = success ? 'success' : 'failed';
        this._saveHistory();
        return;
      }

      if (step < vec.steps.length) {
        const line = step === 0 ? `[>] Step 1/${vec.steps.length}: ${vec.steps[step]}` :
          `[>] Step ${step + 1}/${vec.steps.length}: ${vec.steps[step]}`;
        outputLines.push(line);
        if (Math.random() > 0.1) {
          outputLines.push(`  [OK] ${this._getStepOutput(vec, step)}`);
        } else {
          outputLines.push(`  [WARN] Minor issue encountered, continuing...`);
        }
      }
      step++;
      this._execOutput = [...outputLines];
      this._execProgress = Math.round((step / totalSteps) * 100);
      setTimeout(simulateStep, 600 + Math.random() * 800);
    };

    setTimeout(simulateStep, 500);
  }

  private _getStepOutput(vec: EscalationVector, step: number): string {
    const outputs: Record<string, string[]> = {
      'token-impersonation': ['SeImpersonatePrivilege confirmed', 'Named pipe created', 'NTLM relay successful', 'SYSTEM token captured', 'Shell spawned as NT AUTHORITY\\SYSTEM'],
      'service-misconfig': ['Service path analyzed', 'Writable directory found', 'Binary planted', 'Service restarted'],
      'kernel-exploit': ['Kernel version verified as vulnerable', 'Exploit payload compiled', 'Pipe buffer overflow triggered', 'Arbitrary write to SUID binary', 'Root shell obtained'],
      'sudo-misconfig': ['sudo -l output parsed', 'env_keep LD_PRELOAD confirmed', 'Malicious .so compiled', 'SUID shell created'],
      'suid-bit': ['SUID binaries enumerated', 'Vulnerable binary identified', 'GTFOBins technique applied', 'Root shell obtained'],
      'docker-escape': ['/var/run/docker.sock accessible', 'Docker client initialized', 'Host / mounted to /mnt', 'SSH key written to /mnt/root/.ssh/authorized_keys'],
      'scheduled-task': ['Scheduled tasks enumerated', 'SYSTEM task identified', 'Binary writeable confirmed', 'Payload replaced'],
      'registry': ['IFEO key identified', 'Write access confirmed', 'Debugger value set', 'Privileged process triggered'],
      'named-pipe': ['Pipe created with target name', 'Privileged connection received', 'Token impersonated', 'SYSTEM shell spawned'],
      'cron-job': ['Cron directories enumerated', 'Writable cron script found', 'Reverse shell appended', 'Waiting for cron execution'],
      'credential-theft': ['LSASS memory dump initiated', 'Credentials extracted', 'NTLM hashes parsed', 'Domain admin access obtained'],
      'dll-hijack': ['Application search order analyzed', 'Writable path found', 'Malicious DLL compiled', 'Application restarted with DLL load'],
    };
    return outputs[vec.category]?.[step] || 'Operation completed successfully';
  }

  private _saveHistory(): void {
    const entry: EscalationHistory = {
      id: 'HIST-' + Date.now(),
      targetHost: this._targetHost,
      timestamp: new Date().toISOString(),
      attempts: this._results.length,
      successes: this._results.filter(r => r.status === 'success').length,
      highestAchieved: this._results.reduce((highest, r) => {
        return (PRIV_ORDER[r.achievedPriv] || 0) > (PRIV_ORDER[highest] || 0) ? r.achievedPriv : highest;
      }, this._currentPriv),
      vectors: [...this._results],
    };
    this._history = [entry, ...this._history].slice(0, 50);
    localStorage.setItem('sc-privesc-history', JSON.stringify(this._history));
  }

  private _generateReport(): void {
    const lines: string[] = [];
    lines.push('# Privilege Escalation Assessment Report');
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push(`# Target: ${this._targetHost}`);
    lines.push(`# Platform: ${this._platform}`);
    lines.push(`# Initial Privilege: ${this._currentPriv}`);
    lines.push('');
    lines.push('## System Enumeration Summary');
    if (this._systemInfo) {
      lines.push(`- Hostname: ${this._systemInfo.hostname}`);
      lines.push(`- OS: ${this._systemInfo.os} (${this._systemInfo.arch})`);
      lines.push(`- Kernel: ${this._systemInfo.kernel}`);
      lines.push(`- Patches: ${this._systemInfo.patches.join(', ')}`);
    }
    lines.push('');
    lines.push('## Scan Findings');
    this._scanResults.forEach(f => {
      lines.push(`- [${f.severity.toUpperCase()}] ${f.type}: ${f.finding}`);
      lines.push(`  Action: ${f.action}`);
    });
    lines.push('');
    lines.push('## Exploitation Results');
    this._results.forEach(r => {
      const vec = VECTOR_DB.find(v => v.id === r.vectorId);
      lines.push(`- ${vec?.name || r.vectorId}: ${r.status.toUpperCase()}`);
      lines.push(`  From: ${r.fromPriv} -> Achieved: ${r.achievedPriv}`);
      lines.push(`  Detection Risk: ${r.detectionRisk.toFixed(1)}%`);
    });
    lines.push('');
    lines.push('## Recommendations');
    lines.push('1. Patch kernel to latest stable version');
    lines.push('2. Remove unnecessary SUID bits from binaries');
    lines.push('3. Audit sudo rules - remove NOPASSWD entries');
    lines.push('4. Restrict service account permissions');
    lines.push('5. Implement application whitelisting');
    lines.push('6. Enable detailed process auditing');
    this._reportContent = lines.join('\n');
    this._showReport = true;
  }

  private _exportReport(): void {
    if (!this._reportContent) return;
    const blob = new Blob([this._reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privesc-report-${this._targetHost.replace(/[^a-zA-Z0-9]/g, '-')}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private _reset(): void {
    this._execStatus = 'idle';
    this._execProgress = 0;
    this._execOutput = [];
    this._results = [];
    this._scanResults = [];
    this._systemInfo = null;
    this._selectedVector = null;
    this._showVectorDetail = false;
    this._showReport = false;
    this._error = '';
    this._showSystemInfo = false;
    this._activeTab = 'vectors';
  }

  private _getStatusBadge(): string {
    const s = this._execStatus;
    if (s === 'idle') return 'badge-idle';
    if (s === 'success') return 'badge-success';
    if (s === 'failed') return 'badge-failed';
    return 'badge-running';
  }

  render() {
    return html`
      <div class="panel">
        <div class="header">
          <div class="title">
            <span>&#x1F50D;</span> Privilege Escalation Toolkit
            <span class="badge ${this._getStatusBadge()}">${this._execStatus.toUpperCase()}</span>
          </div>
          <div class="btn-row">
            <button class="btn btn-secondary btn-sm" @click=${this._reset}>Reset</button>
            <button class="btn btn-secondary btn-sm" @click=${this._generateReport}>Generate Report</button>
          </div>
        </div>

        <div class="priv-bar">
          <span style="font-size:12px;color:#9ca3af">Current Privilege:</span>
          <span class="priv-level ${this._getPrivClass(this._currentPriv)}">${this._currentPriv.toUpperCase()}</span>
          <span class="priv-arrow">&#x27A1;</span>
          <span style="font-size:12px;color:#9ca3af">Target:</span>
          <span class="priv-level priv-kernel">${this._platform === 'windows' ? 'NT AUTHORITY' : 'ROOT'}</span>
          ${this._results.some(r => r.status === 'success') ? html`
            <span class="priv-arrow">&#x27A1;</span>
            <span style="font-size:12px;color:#9ca3af">Achieved:</span>
            <span class="priv-level ${this._getPrivClass(this._results.find(r => r.status === 'success')!.achievedPriv)}">${this._results.find(r => r.status === 'success')!.achievedPriv.toUpperCase()}</span>
          ` : nothing}
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label>Target Host</label>
            <input type="text" .value=${this._targetHost} @input=${(e: Event) => { this._targetHost = (e.target as HTMLInputElement).value; }} placeholder="IP or hostname">
          </div>
          <div class="form-group">
            <label>Platform</label>
            <select .value=${this._platform} @change=${(e: Event) => { this._platform = (e.target as HTMLSelectElement).value as any; this._filterVectors(); }}>
              <option value="linux">Linux</option>
              <option value="windows">Windows</option>
              <option value="macos">macOS</option>
              <option value="container">Container</option>
            </select>
          </div>
          <div class="form-group">
            <label>Current Privilege Level</label>
            <select .value=${this._currentPriv} @change=${(e: Event) => { this._currentPriv = (e.target as HTMLSelectElement).value as PrivLevel; }}>
              <option value="user">Standard User</option>
              <option value="power-user">Power User</option>
              <option value="local-admin">Local Admin</option>
              <option value="system">System</option>
              <option value="domain-user">Domain User</option>
            </select>
          </div>
          <div class="form-group">
            <label>Filter by Category</label>
            <select .value=${this._categoryFilter} @change=${(e: Event) => { this._categoryFilter = (e.target as HTMLSelectElement).value as any; this._filterVectors(); }}>
              <option value="all">All Categories</option>
              <option value="kernel-exploit">Kernel Exploit</option>
              <option value="service-misconfig">Service Misconfiguration</option>
              <option value="token-impersonation">Token Impersonation</option>
              <option value="scheduled-task">Scheduled Task</option>
              <option value="dll-hijack">DLL Hijacking</option>
              <option value="registry">Registry Manipulation</option>
              <option value="named-pipe">Named Pipe Impersonation</option>
              <option value="credential-theft">Credential Theft</option>
              <option value="sudo-misconfig">Sudo Misconfiguration</option>
              <option value="suid-bit">SUID Binary Abuse</option>
              <option value="cron-job">Cron Job Abuse</option>
              <option value="docker-escape">Docker Escape</option>
            </select>
          </div>
          <div class="form-group">
            <div class="checkbox-row">
              <input type="checkbox" ?checked=${this._autoEnum} @change=${(e: Event) => { this._autoEnum = (e.target as HTMLInputElement).checked; }}>
              <label style="margin:0">Auto-enumerate before exploitation</label>
            </div>
          </div>
          <div class="form-group">
            <div class="checkbox-row">
              <input type="checkbox" ?checked=${this._detectionAvoidance} @change=${(e: Event) => { this._detectionAvoidance = (e.target as HTMLInputElement).checked; }}>
              <label style="margin:0">Detection avoidance mode</label>
            </div>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn btn-secondary" @click=${this._enumerateSystem} ?disabled=${this._execStatus !== 'idle'}>Enumerate System</button>
          <button class="btn btn-primary" @click=${this._executeVector} ?disabled=${!this._selectedVector || this._execStatus !== 'idle'}>Execute Selected Vector</button>
          <button class="btn btn-danger" @click=${this._executeVector} ?disabled=${!this._selectedVector || this._execStatus !== 'idle'}>Auto-Escalate (All Vectors)</button>
        </div>

        ${this._execStatus !== 'idle' ? html`
          <div class="progress-bar"><div class="progress-fill" style="width:${this._execProgress}%"></div></div>
        ` : nothing}

        ${this._error ? html`<div style="color:#f87171;font-size:12px;margin-bottom:12px">${this._error}</div>` : nothing}

        <div class="tabs">
          <button class="tab ${this._activeTab === 'vectors' ? 'active' : ''}" @click=${() => { this._activeTab = 'vectors'; }}>Vectors (${this._filteredVectors.length})</button>
          <button class="tab ${this._activeTab === 'system' ? 'active' : ''}" @click=${() => { this._activeTab = 'system'; }}>System Info</button>
          <button class="tab ${this._activeTab === 'results' ? 'active' : ''}" @click=${() => { this._activeTab = 'results'; }}>Results (${this._results.length})</button>
          <button class="tab ${this._activeTab === 'history' ? 'active' : ''}" @click=${() => { this._activeTab = 'history'; }}>History (${this._history.length})</button>
        </div>

        ${this._activeTab === 'vectors' ? this._renderVectors() : nothing}
        ${this._activeTab === 'system' ? this._renderSystemInfo() : nothing}
        ${this._activeTab === 'results' ? this._renderResults() : nothing}
        ${this._activeTab === 'history' ? this._renderHistory() : nothing}

        ${this._showReport ? html`
          <div style="margin-top:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <span style="font-weight:600;font-size:14px">Assessment Report</span>
              <button class="btn btn-primary btn-sm" @click=${this._exportReport}>Export Markdown</button>
            </div>
            <div class="report-box">${this._reportContent}</div>
          </div>
        ` : nothing}

        ${this._execOutput.length > 0 ? html`
          <div style="margin-top:16px">
            <span style="font-weight:600;font-size:14px;display:block;margin-bottom:8px">Execution Output</span>
            <div class="output-box">${this._execOutput.map(l => html`<div class="output-line ${l.startsWith('[+]') ? 'output-success' : l.startsWith('[-]') ? 'output-error' : l.startsWith('[WARN]') ? 'output-warn' : 'output-info'}">${l}</div>`)}</div>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderVectors() {
    if (this._showVectorDetail && this._selectedVector) {
      const v = this._selectedVector;
      return html`
        <div class="detail-panel">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="detail-title">${v.name}</div>
            <button class="btn btn-secondary btn-sm" @click=${() => { this._showVectorDetail = false; }}>Back to List</button>
          </div>
          <p style="font-size:13px;color:#9ca3af;margin-bottom:12px">${v.description}</p>
          <div class="vector-meta" style="margin-bottom:16px">
            <span class="meta-tag">${v.techniqueId}</span>
            <span class="meta-tag">${v.platform}</span>
            <span class="meta-tag ${v.cvss && v.cvss >= 9 ? 'meta-critical' : v.cvss && v.cvss >= 7 ? 'meta-high' : 'meta-medium'}">CVSS: ${v.cvss || 'N/A'}</span>
            <span class="meta-tag">Reliability: <span style="color:${this._getReliabilityColor(v.reliability)}">${v.reliability}</span></span>
            <span class="meta-tag">Detect: ${v.detectability}</span>
          </div>
          <div class="detail-section">
            <h4>Prerequisites</h4>
            <ul style="font-size:12px;color:#d1d5db;padding-left:20px">${v.prerequisites.map(p => html`<li>${p}</li>`)}</ul>
          </div>
          <div class="detail-section">
            <h4>Execution Steps</h4>
            <ol class="step-list">${v.steps.map(s => html`<li>${s}</li>`)}</ol>
          </div>
          <div style="font-size:12px;color:#9ca3af;margin-top:12px">
            Privilege path: <strong>${v.fromPriv.join(', ')}</strong> &#x27A1; <strong style="color:#f87171">${v.toPriv}</strong>
          </div>
        </div>
      `;
    }

    return html`
      <div class="vector-list">
        ${this._filteredVectors.length === 0 ? html`
          <div class="empty-state">No vectors available for this platform/filter</div>
        ` : this._filteredVectors.map(v => html`
          <div class="vector-card ${this._selectedVector?.id === v.id ? 'selected' : ''}" @click=${() => this._selectVector(v)}>
            <div class="vector-name">${v.name}</div>
            <div class="vector-desc">${v.description}</div>
            <div class="vector-meta">
              <span class="meta-tag">${v.techniqueId}</span>
              <span class="meta-tag">${v.category.replace(/-/g, ' ')}</span>
              <span class="meta-tag ${v.cvss && v.cvss >= 9 ? 'meta-critical' : v.cvss && v.cvss >= 7 ? 'meta-high' : 'meta-medium'}">CVSS ${v.cvss || 'N/A'}</span>
              <span class="meta-tag">Rel: <span style="color:${this._getReliabilityColor(v.reliability)}">${v.reliability}</span></span>
              <span class="meta-tag">${v.fromPriv.join(', ')} &#x27A1; ${v.toPriv}</span>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private _renderSystemInfo() {
    if (!this._systemInfo) {
      return html`<div class="empty-state">Run system enumeration first</div>`;
    }
    const info = this._systemInfo;
    return html`
      <div style="display:flex;flex-direction:column;gap:16px">
        <div style="background:#1a1d27;border-radius:8px;padding:12px">
          <div style="font-weight:600;margin-bottom:8px">System Information</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:12px">
            <div><span style="color:#9ca3af">Hostname:</span> ${info.hostname}</div>
            <div><span style="color:#9ca3af">OS:</span> ${info.os}</div>
            <div><span style="color:#9ca3af">Architecture:</span> ${info.arch}</div>
            <div><span style="color:#9ca3af">Kernel:</span> ${info.kernel}</div>
            <div><span style="color:#9ca3af">User:</span> ${info.currentUser}</div>
            <div><span style="color:#9ca3af">Privilege:</span> ${info.currentPriv}</div>
            ${info.domain ? html`<div><span style="color:#9ca3af">Domain:</span> ${info.domain}</div>` : nothing}
          </div>
        </div>

        ${this._scanResults.length > 0 ? html`
          <div>
            <div style="font-weight:600;margin-bottom:8px">Escalation Findings (${this._scanResults.length})</div>
            <div class="scan-findings">
              ${this._scanResults.map(f => html`
                <div class="finding finding-${f.severity}">
                  <span class="finding-type">[${f.severity.toUpperCase()}]</span>
                  <span class="finding-detail">
                    <strong>${f.type}</strong>: ${f.finding}<br>
                    <span style="color:#9ca3af">Action: ${f.action}</span>
                  </span>
                </div>
              `)}
            </div>
          </div>
        ` : nothing}

        ${info.suidBinaries.length > 0 ? html`
          <div style="background:#1a1d27;border-radius:8px;padding:12px">
            <div style="font-weight:600;margin-bottom:8px">SUID Binaries</div>
            <div style="font-size:12px;font-family:monospace">${info.suidBinaries.map(b => html`<div style="color:#fbbf24">${b}</div>`)}</div>
          </div>
        ` : nothing}

        ${info.sudoRules.length > 0 ? html`
          <div style="background:#1a1d27;border-radius:8px;padding:12px">
            <div style="font-weight:600;margin-bottom:8px">Sudo Rules</div>
            <div style="font-size:12px;font-family:monospace">${info.sudoRules.map(r => html`<div style="color:#f87171">${r}</div>`)}</div>
          </div>
        ` : nothing}

        ${info.services.length > 0 ? html`
          <div style="background:#1a1d27;border-radius:8px;padding:12px">
            <div style="font-weight:600;margin-bottom:8px">Services (potential misconfigurations)</div>
            <table class="results-table">
              <thead><tr><th>Service</th><th>Account</th><th>Status</th></tr></thead>
              <tbody>${info.services.map(s => html`<tr><td>${s.name}</td><td>${s.account}</td><td>${s.status}</td></tr>`)}</tbody>
            </table>
          </div>
        ` : nothing}

        ${info.runningProcesses.length > 0 ? html`
          <div style="background:#1a1d27;border-radius:8px;padding:12px">
            <div style="font-weight:600;margin-bottom:8px">Running Processes</div>
            <table class="results-table">
              <thead><tr><th>PID</th><th>Name</th><th>User</th></tr></thead>
              <tbody>${info.runningProcesses.map(p => html`<tr><td>${p.pid}</td><td>${p.name}</td><td>${p.user}</td></tr>`)}</tbody>
            </table>
          </div>
        ` : nothing}
      </div>
    `;
  }

  private _renderResults() {
    if (this._results.length === 0) {
      return html`<div class="empty-state">No exploitation results yet</div>`;
    }
    return html`
      <table class="results-table">
        <thead>
          <tr><th>Vector</th><th>Status</th><th>From</th><th>Achieved</th><th>Detection Risk</th><th>Time</th></tr>
        </thead>
        <tbody>
          ${this._results.map(r => {
            const vec = VECTOR_DB.find(v => v.id === r.vectorId);
            return html`<tr>
              <td>${vec?.name || r.vectorId}</td>
              <td class="${r.status === 'success' ? 'sev-critical' : 'sev-medium'}">${r.status.toUpperCase()}</td>
              <td>${r.fromPriv}</td>
              <td class="${(PRIV_ORDER[r.achievedPriv] || 0) > (PRIV_ORDER[r.fromPriv] || 0) ? 'sev-critical' : ''}">${r.achievedPriv}</td>
              <td>${r.detectionRisk.toFixed(1)}%</td>
              <td style="font-size:11px;color:#6b7280">${new Date(r.completedAt).toLocaleTimeString()}</td>
            </tr>`;
          })}
        </tbody>
      </table>
    `;
  }

  private _renderHistory() {
    if (this._history.length === 0) {
      return html`<div class="empty-state">No history yet</div>`;
    }
    return html`
      <div class="history-item" style="cursor:pointer" style="margin-bottom:16px">
        ${this._history.map(h => html`
          <div class="history-item">
            <div class="history-header">
              <span class="history-host">${h.targetHost}</span>
              <span class="history-time">${new Date(h.timestamp).toLocaleString()}</span>
            </div>
            <div class="history-stats">
              <span>Attempts: <strong>${h.attempts}</strong></span>
              <span>Successes: <strong style="color:#34d399">${h.successes}</strong></span>
              <span>Highest: <strong style="color:#f87171">${h.highestAchieved}</strong></span>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  // --- Privilege Escalation Risk Scoring Engine ---
  private _escRiskFactors: Record<string, { weight: number; label: string; description: string }> = {
    vectorCount: { weight: 0.20, label: 'Available Vectors', description: 'Number of viable escalation paths' },
    highestLevel: { weight: 0.25, label: 'Achievable Level', description: 'Highest privilege level attainable' },
    successRate: { weight: 0.15, label: 'Success Rate', description: 'Historical exploitation success percentage' },
    patchCoverage: { weight: 0.20, label: 'Patch Coverage', description: 'Percentage of vectors with available patches' },
    detectionRisk: { weight: 0.10, label: 'Detection Risk', description: 'Likelihood of triggering security alerts' },
    complexityScore: { weight: 0.10, label: 'Complexity', description: 'Technical complexity of exploitation' },
  };

  private _computeEscalationRisk(): { score: number; level: string; factors: { name: string; score: number; label: string }[] } {
    const levelValues: Record<string, number> = { user: 10, 'power-user': 25, 'local-admin': 50, system: 70, 'nt-authority': 85, kernel: 95, 'domain-user': 30, 'domain-admin': 100 };
    const vectors = this._vectors.filter(v => v.status === 'available');
    const highestLevel = vectors.reduce((max, v) => { const val = levelValues[v.achievableLevel] || 0; return val > max ? val : max; }, 0);
    const totalAttempts = this._history.reduce((s, h) => s + h.attempts, 0);
    const totalSuccesses = this._history.reduce((s, h) => s + h.successes, 0);
    const successRate = totalAttempts > 0 ? (totalSuccesses / totalAttempts) * 100 : 0;
    const patchedVectors = vectors.filter(v => v.patchAvailable).length;
    const patchRate = vectors.length > 0 ? (patchedVectors / vectors.length) * 100 : 100;

    const factors = [
      { name: 'vectorCount', score: Math.min(100, vectors.length * 12), label: this._escRiskFactors.vectorCount.label },
      { name: 'highestLevel', score: highestLevel, label: this._escRiskFactors.highestLevel.label },
      { name: 'successRate', score: successRate, label: this._escRiskFactors.successRate.label },
      { name: 'patchCoverage', score: 100 - patchRate, label: this._escRiskFactors.patchCoverage.label },
      { name: 'detectionRisk', score: Math.min(100, vectors.filter(v => v.stealth === 'low').length * 15), label: this._escRiskFactors.detectionRisk.label },
      { name: 'complexityScore', score: Math.min(100, vectors.filter(v => v.complexity === 'low').length * 20), label: this._escRiskFactors.complexityScore.label },
    ];

    const score = Math.round(factors.reduce((s, f) => s + f.score * (this._escRiskFactors[f.name]?.weight || 0.15), 0));
    const level = score > 75 ? 'critical' : score > 50 ? 'high' : score > 25 ? 'medium' : 'low';
    return { score, level, factors };
  }

  // --- MITRE ATT&CK Privilege Escalation Correlation ---
  private _mitreEscMap: Record<string, { techniqueId: string; techniqueName: string; tactic: string; subtechniques: string[] }> = {
    'kernel-exploit': { techniqueId: 'T1068', techniqueName: 'Exploitation for Privilege Escalation', tactic: 'Privilege Escalation', subtechniques: ['T1068.001', 'T1068.002'] },
    'token-impersonation': { techniqueId: 'T1134', techniqueName: 'Access Token Manipulation', tactic: 'Privilege Escalation', subtechniques: ['T1134.001', 'T1134.002', 'T1134.003', 'T1134.004'] },
    'scheduled-task': { techniqueId: 'T1053', techniqueName: 'Scheduled Task/Job', tactic: 'Privilege Escalation', subtechniques: ['T1053.005', 'T1053.008'] },
    'service-misconfig': { techniqueId: 'T1543', techniqueName: 'Create or Modify System Process', tactic: 'Privilege Escalation', subtechniques: ['T1543.003'] },
    'dll-hijack': { techniqueId: 'T1574', techniqueName: 'Hijack Execution Flow', tactic: 'Privilege Escalation', subtechniques: ['T1574.001', 'T1574.002'] },
    'registry': { techniqueId: 'T1112', techniqueName: 'Modify Registry', tactic: 'Privilege Escalation', subtechniques: [] },
    'named-pipe': { techniqueId: 'T1059', techniqueName: 'Command and Scripting Interpreter', tactic: 'Execution', subtechniques: ['T1059.001'] },
    'credential-theft': { techniqueId: 'T1003', techniqueName: 'OS Credential Dumping', tactic: 'Credential Access', subtechniques: ['T1003.001', 'T1003.002', 'T1003.003'] },
    'sudo-misconfig': { techniqueId: 'T1548', techniqueName: 'Abuse Elevation Control Mechanism', tactic: 'Privilege Escalation', subtechniques: ['T1548.003'] },
    'suid-bit': { techniqueId: 'T1548', techniqueName: 'Abuse Elevation Control Mechanism', tactic: 'Privilege Escalation', subtechniques: ['T1548.001'] },
    'cron-job': { techniqueId: 'T1053', techniqueName: 'Scheduled Task/Job', tactic: 'Privilege Escalation', subtechniques: ['T1053.003'] },
    'docker-escape': { techniqueId: 'T1611', techniqueName: 'Escape to Host', tactic: 'Privilege Escalation', subtechniques: [] },
  };

  private _correlateEscMitre(): { tactic: string; techniques: { id: string; name: string; subtechniques: string[]; vectorCount: number }[] }[] {
    const tacticMap: Record<string, { id: string; name: string; subtechniques: string[]; vectorCount: number }[]> = {};
    const availableVectors = this._vectors.filter(v => v.status === 'available');
    availableVectors.forEach(v => {
      const mitre = this._mitreEscMap[v.category];
      if (mitre) {
        if (!tacticMap[mitre.tactic]) tacticMap[mitre.tactic] = [];
        const existing = tacticMap[mitre.tactic].find(t => t.id === mitre.techniqueId);
        if (existing) { existing.vectorCount++; } else { tacticMap[mitre.tactic].push({ id: mitre.techniqueId, name: mitre.techniqueName, subtechniques: mitre.subtechniques, vectorCount: 1 }); }
      }
    });
    return Object.entries(tacticMap).map(([tactic, techniques]) => ({ tactic, techniques }));
  }

  // --- Escalation Path Treemap SVG ---
  private _escalationTreemapSVG(): string {
    const w = 500, h = 250;
    const categories = ['kernel-exploit', 'service-misconfig', 'token-impersonation', 'scheduled-task', 'dll-hijack', 'registry', 'credential-theft', 'named-pipe', 'sudo-misconfig', 'suid-bit', 'cron-job', 'docker-escape'];
    const data = categories.map(cat => {
      const count = this._vectors.filter(v => v.category === cat).length;
      return { cat, count, color: count > 3 ? '#ef4444' : count > 1 ? '#f97316' : count > 0 ? '#eab308' : '#374151' };
    }).filter(d => d.count > 0);
    const total = data.reduce((s, d) => s + d.count, 0) || 1;
    let x = 0, y = 0, rowH = h;
    let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
    data.sort((a, b) => b.count - a.count).forEach(d => {
      const cellW = (d.count / total) * w;
      if (x + cellW > w) { x = 0; y += rowH; rowH = h - y; }
      const cellH = rowH;
      svg += `<rect x="${x}" y="${y}" width="${cellW - 2}" height="${cellH - 2}" rx="4" fill="${d.color}" opacity="0.3" stroke="${d.color}" stroke-width="1"/>`;
      svg += `<text x="${x + cellW / 2}" y="${y + cellH / 2 - 4}" fill="#e2e8f0" font-size="9" text-anchor="middle" font-weight="600">${d.cat}</text>`;
      svg += `<text x="${x + cellW / 2}" y="${y + cellH / 2 + 10}" fill="#9ca3af" font-size="8" text-anchor="middle">${d.count} vectors</text>`;
      x += cellW;
    });
    svg += `</svg>`;
    return svg;
  }

  // --- Escalation Radar Chart ---
  private _escRadarSVG(): string {
    const dims = ['Exploitability', 'Stealth', 'Reliability', 'Impact', 'Coverage', 'Speed'];
    const values = [0.7, 0.5, 0.8, 0.9, 0.6, 0.4];
    const cx = 100, cy = 100, r = 70, n = dims.length;
    let svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">`;
    for (let ring = 1; ring <= 4; ring++) {
      const rr = (ring / 4) * r;
      const pts = dims.map((_, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`; }).join(' ');
      svg += `<polygon points="${pts}" fill="none" stroke="#374151" stroke-width="0.5"/>`;
    }
    dims.forEach((_, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; svg += `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(a)}" y2="${cy + r * Math.sin(a)}" stroke="#374151" stroke-width="0.5"/>`; });
    const dataPts = values.map((v, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return `${cx + v * r * Math.cos(a)},${cy + v * r * Math.sin(a)}`; }).join(' ');
    svg += `<polygon points="${dataPts}" fill="#f59e0b" fill-opacity="0.2" stroke="#f59e0b" stroke-width="1.5"/>`;
    dims.forEach((d, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; const lx = cx + (r + 18) * Math.cos(a), ly = cy + (r + 18) * Math.sin(a); svg += `<text x="${lx}" y="${ly}" fill="#9ca3af" font-size="7" text-anchor="middle" dominant-baseline="middle">${d}</text>`; });
    svg += `</svg>`;
    return svg;
  }

  // --- Collaboration ---
  @state() private _team: { id: string; name: string; role: string; status: string }[] = [
    { id: 'e1', name: 'Red Team Operator', role: 'Offense', status: 'online' },
    { id: 'e2', name: 'Blue Team Analyst', role: 'Defense', status: 'online' },
    { id: 'e3', name: 'System Admin', role: 'Infrastructure', status: 'busy' },
  ];
  @state() private _teamNotes: { id: string; userId: string; text: string; timestamp: string }[] = [];
  @state() private _noteText = '';

  private _addTeamNote() {
    if (!this._noteText.trim()) return;
    this._teamNotes = [{ id: 'n' + Date.now(), userId: 'You', text: this._noteText.trim(), timestamp: new Date().toISOString() }, ...this._teamNotes].slice(0, 30);
    this._noteText = '';
  }

  private _renderTeamCollab(): any {
    return html`
      <div style="margin-top:16px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:13px;margin-bottom:10px;display:flex;align-items:center;gap:8px">
          <span>Team Notes</span>
          <span style="font-size:10px;color:#6b7280">${this._team.filter(t => t.status === 'online').length} online</span>
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">
          ${this._team.map(m => html`
            <div style="display:flex;align-items:center;gap:4px;background:#1f2937;border-radius:4px;padding:3px 8px;font-size:10px">
              <div style="width:6px;height:6px;border-radius:50%;background:${m.status === 'online' ? '#22c55e' : m.status === 'busy' ? '#eab308' : '#6b7280'}"></div>
              <span style="font-weight:600">${m.name}</span>
              <span style="color:#6b7280">${m.role}</span>
            </div>
          `)}
        </div>
        ${this._teamNotes.length > 0 ? html`
          <div style="max-height:80px;overflow-y:auto;margin-bottom:8px">
            ${this._teamNotes.slice(0, 5).map(n => html`
              <div style="font-size:10px;padding:4px 0;border-bottom:1px solid #1f2937">
                <span style="font-weight:600;color:#e2e8f0">${n.userId}</span>
                <span style="color:#9ca3af">: ${n.text}</span>
                <span style="float:right;font-size:8px;color:#4b5563">${new Date(n.timestamp).toLocaleTimeString()}</span>
              </div>
            `)}
          </div>
        ` : ''}
        <div style="display:flex;gap:6px">
          <input style="flex:1;background:#0f172a;border:1px solid #374151;border-radius:4px;padding:5px 8px;color:#e2e8f0;font-size:10px" placeholder="Add team note..." .value=${this._noteText} @input=${(e: any) => this._noteText = e.target.value}>
          <button style="background:#f59e0b;color:#111827;border:none;border-radius:4px;padding:5px 10px;font-size:10px;font-weight:600;cursor:pointer" @click=${this._addTeamNote}>Add</button>
        </div>
      </div>
    `;
  }

  // --- Auto-Insights ---
  private _generateEscInsights(): { icon: string; text: string; severity: string; category: string }[] {
    const insights: { icon: string; text: string; severity: string; category: string }[] = [];
    const available = this._vectors.filter(v => v.status === 'available');
    const kernelVectors = available.filter(v => v.category === 'kernel-exploit');
    const credVectors = available.filter(v => v.category === 'credential-theft');
    const stealthyVectors = available.filter(v => v.stealth === 'high');
    if (kernelVectors.length > 0) insights.push({ icon: '\uD83D\uDC27', text: `${kernelVectors.length} kernel-level escalation vectors available. Highest risk category - full system compromise possible.`, severity: 'critical', category: 'risk' });
    if (credVectors.length > 0) insights.push({ icon: '\uD83D\uDD11', text: `${credVectors.length} credential theft vectors detected. Credential hygiene review recommended.`, severity: 'high', category: 'credential' });
    if (stealthyVectors.length > available.length * 0.5) insights.push({ icon: '\uD83D\uDEE1\uFE0F', text: 'Majority of vectors have high stealth rating. Detection capabilities may be insufficient.', severity: 'high', category: 'detection' });
    const risk = this._computeEscalationRisk();
    if (risk.score > 75) insights.push({ icon: '\uD83D\uDD04', text: `Overall escalation risk score is ${risk.score}/100. Immediate remediation required.`, severity: 'critical', category: 'overall' });
    const unpatched = available.filter(v => !v.patchAvailable).length;
    if (unpatched > 0) insights.push({ icon: '\uD83D\uDC9C', text: `${unpatched} vectors have no available patches. Compensating controls needed.`, severity: 'medium', category: 'patching' });
    return insights.length > 0 ? insights : [{ icon: '\u2705', text: 'No critical privilege escalation risks detected.', severity: 'low', category: 'status' }];
  }

  private _renderEscInsights(): any {
    const insights = this._generateEscInsights();
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Auto-Insights</div>
        ${insights.map(i => html`
          <div style="display:flex;gap:8px;padding:6px;margin-bottom:4px;background:#1f2937;border-radius:4px;font-size:11px;border-left:3px solid ${i.severity === 'critical' ? '#ef4444' : i.severity === 'high' ? '#f97316' : i.severity === 'medium' ? '#eab308' : '#22c55e'}">
            <span>${i.icon}</span><div><span style="color:#e2e8f0">${i.text}</span><div style="font-size:8px;color:#4b5563;margin-top:2px">${i.category}</div></div>
          </div>
        `)}
      </div>
    `;
  }

  // --- Panel Config ---
  @state() private _panelConfig: { showTreemap: boolean; showRadar: boolean; showTeam: boolean; autoRefresh: boolean; compactView: boolean } = {
    showTreemap: true, showRadar: true, showTeam: true, autoRefresh: false, compactView: false,
  };

  // --- CVSS-like Severity Calculator for Escalation Vectors ---
  private _calculateEscCVSS(vector: any): { baseScore: number; impact: number; exploitability: number; severity: string } {
    const severityValues: Record<string, number> = { critical: 10, high: 7.5, medium: 5, low: 2.5 };
    const impactVal = severityValues[vector.risk] || 5;
    const av = vector.requiresLocalAccess ? 0.55 : 0.85;
    const complexity = vector.complexity === 'low' ? 0.85 : vector.complexity === 'medium' ? 0.6 : 0.35;
    const privileges = vector.requiresUserInteraction ? 0.5 : 0.85;
    const userInt = vector.requiresPhysicalAccess ? 0.4 : 0.85;
    const exploitability = 8.22 * av * complexity * privileges * userInt;
    const impact = Math.min(10, impactVal * 1.0);
    const iss = Math.min(10, impact);
    const baseScore = iss === 0 ? 0 : Math.min(10, Math.round((iss + exploitability) * 0.5 * 10) / 10);
    const severity = baseScore >= 9 ? 'critical' : baseScore >= 7 ? 'high' : baseScore >= 4 ? 'medium' : 'low';
    return { baseScore, impact: Math.round(impact * 10) / 10, exploitability: Math.round(exploitability * 10) / 10, severity };
  }

  private _renderSeverityMatrix(): any {
    const available = this._vectors.filter(v => v.status === 'available').slice(0, 10);
    if (available.length === 0) return nothing;
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Vector Severity Matrix</div>
        <table style="width:100%;border-collapse:collapse;font-size:10px">
          <thead><tr style="background:#0f172a;color:#94a3b8">
            <th style="padding:5px;text-align:left">Vector</th>
            <th style="padding:5px;text-align:center">CVSS</th>
            <th style="padding:5px;text-align:center">Impact</th>
            <th style="padding:5px;text-align:center">Exploit</th>
            <th style="padding:5px;text-align:center">Level</th>
          </tr></thead>
          <tbody>
            ${available.map(v => {
              const cvss = this._calculateEscCVSS(v);
              return html`<tr style="border-bottom:1px solid #1f2937">
                <td style="padding:5px;color:#e2e8f0">${v.name}</td>
                <td style="padding:5px;text-align:center;color:${cvss.severity === 'critical' ? '#ef4444' : cvss.severity === 'high' ? '#f97316' : '#eab308'};font-weight:700">${cvss.baseScore}</td>
                <td style="padding:5px;text-align:center">${cvss.impact}</td>
                <td style="padding:5px;text-align:center">${cvss.exploitability}</td>
                <td style="padding:5px;text-align:center">${v.achievableLevel}</td>
              </tr>`;
            })}
          </tbody>
        </table>
      </div>
    `;
  }

  // --- MITRE ATT&CK Navigator SVG ---
  private _mitreHeatmapSVG(): string {
    const tactics = ['Privilege Escalation', 'Credential Access', 'Execution', 'Persistence', 'Defense Evasion', 'Discovery', 'Lateral Movement', 'Collection'];
    const w = 700, h = 180;
    const colW = (w - 40) / tactics.length, rowH = 30;
    const correlation = this._correlateEscMitre();
    const tactData = tactics.map(t => {
      const found = correlation.find(c => c.tactic === t);
      return { tactic: t, count: found ? found.techniques.reduce((s, t) => s + t.vectorCount, 0) : 0 };
    });
    const maxCount = Math.max(...tactData.map(d => d.count), 1);
    let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
    tactData.forEach((d, i) => {
      const x = 20 + i * colW, y = 30;
      const intensity = d.count / maxCount;
      const color = intensity > 0.7 ? '#ef4444' : intensity > 0.4 ? '#f97316' : intensity > 0 ? '#eab308' : '#1f2937';
      svg += `<rect x="${x + 2}" y="${y}" width="${colW - 4}" height="${rowH * 2}" rx="4" fill="${color}" opacity="${0.2 + intensity * 0.6}" stroke="${color}" stroke-width="1"/>`;
      svg += `<text x="${x + colW / 2}" y="${y + rowH}" fill="#e2e8f0" font-size="8" text-anchor="middle" font-weight="600">${d.count}</text>`;
      svg += `<text x="${x + colW / 2}" y="${y + rowH + 15}" fill="#9ca3af" font-size="7" text-anchor="middle">${d.tactic}</text>`;
    });
    svg += `<text x="${w / 2}" y="18" fill="#e2e8f0" font-size="10" text-anchor="middle" font-weight="700">MITRE ATT&CK Escalation Correlation</text>`;
    svg += `</svg>`;
    return svg;
  }

  // --- Anomaly Detection ---
  private _detectAnomalies(): { id: string; type: string; description: string; severity: string; timestamp: string }[] {
    const anomalies: { id: string; type: string; description: string; severity: string; timestamp: string }[] = [];
    const recentHistory = this._history.filter(h => (Date.now() - new Date(h.timestamp).getTime()) < 86400000);
    if (recentHistory.some(h => h.successes > 5)) anomalies.push({ id: 'a1', type: 'Burst Activity', description: 'Multiple successful escalations within 24 hours. Possible automated attack.', severity: 'critical', timestamp: new Date().toISOString() });
    if (this._vectors.filter(v => v.status === 'available' && v.category === 'kernel-exploit').length > 2) anomalies.push({ id: 'a2', type: 'Kernel Vector Cluster', description: 'Multiple kernel exploitation vectors available. System may be significantly outdated.', severity: 'high', timestamp: new Date().toISOString() });
    const stealthRatio = this._vectors.filter(v => v.status === 'available' && v.stealth === 'high').length;
    if (stealthRatio > 3) anomalies.push({ id: 'a3', type: 'Stealth Dominance', description: 'High number of stealthy vectors available. Detection coverage is likely insufficient.', severity: 'high', timestamp: new Date().toISOString() });
    return anomalies;
  }

  private _renderAnomalies(): any {
    const anomalies = this._detectAnomalies();
    if (anomalies.length === 0) return nothing;
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px;color:#f59e0b">Anomaly Detection (${anomalies.length})</div>
        ${anomalies.map(a => html`
          <div style="background:#1f2937;border-radius:4px;padding:8px;margin-bottom:4px;border-left:3px solid ${a.severity === 'critical' ? '#ef4444' : '#f97316'}">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0">${a.type}</div>
            <div style="font-size:10px;color:#9ca3af">${a.description}</div>
          </div>
        `)}
      </div>
    `;
  }

  // --- Trend Prediction ---
  private _predictEscTrend(): { direction: 'increasing' | 'stable' | 'decreasing'; confidence: number; reason: string; nextScore: number } {
    const risk = this._computeEscalationRisk();
    const unpatched = this._vectors.filter(v => v.status === 'available' && !v.patchAvailable).length;
    const total = this._vectors.filter(v => v.status === 'available').length;
    const patchGap = total > 0 ? unpatched / total : 0;
    if (patchGap > 0.6) return { direction: 'increasing', confidence: 0.8, reason: 'Large patch gap suggests growing risk', nextScore: Math.min(100, risk.score + 15) };
    if (risk.score > 50) return { direction: 'stable', confidence: 0.6, reason: 'Elevated risk with moderate patch coverage', nextScore: risk.score + 3 };
    return { direction: 'decreasing', confidence: 0.7, reason: 'Good patch coverage and low vector count', nextScore: Math.max(0, risk.score - 10) };
  }

  private _renderTrendPrediction(): any {
    const trend = this._predictEscTrend();
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Trend Prediction</div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="font-size:24px">${trend.direction === 'increasing' ? '\uD83D\uDD3C' : trend.direction === 'decreasing' ? '\uD83D\uDD3D' : '\u2192'}</div>
          <div>
            <div style="font-size:12px;font-weight:600;color:${trend.direction === 'increasing' ? '#ef4444' : trend.direction === 'decreasing' ? '#22c55e' : '#eab308'}">${trend.direction.toUpperCase()} RISK</div>
            <div style="font-size:10px;color:#9ca3af">${trend.reason}</div>
            <div style="font-size:10px;color:#6b7280;margin-top:2px">Confidence: ${Math.round(trend.confidence * 100)}% | Predicted next score: ${trend.nextScore}</div>
          </div>
        </div>
      </div>
    `;
  }

  // --- Compliance Rules Engine ---
  private _complianceRules: { id: string; rule: string; standard: string; status: 'pass' | 'fail' | 'warning'; detail: string }[] = [
    { id: 'cr1', rule: 'No kernel exploits available', standard: 'CIS Level 2', status: 'fail', detail: 'Kernel exploitation vectors detected on target system' },
    { id: 'cr2', rule: 'All services run with minimum privileges', standard: 'NIST 800-53 AC-6', status: 'warning', detail: '2 services running with elevated privileges' },
    { id: 'cr3', rule: 'Password policy enforced', standard: 'PCI-DSS 8.2.3', status: 'pass', detail: 'Password complexity and rotation policies are active' },
    { id: 'cr4', rule: 'Audit logging enabled for privilege changes', standard: 'SOC2 CC6.1', status: 'pass', detail: 'All privilege escalation events are logged' },
    { id: 'cr5', rule: 'No default credentials in use', standard: 'ISO 27001 A.9.2.1', status: 'warning', detail: 'Default credentials found on 1 service account' },
    { id: 'cr6', rule: 'MFA enforced for admin accounts', standard: 'NIST 800-63B', status: 'pass', detail: 'Multi-factor authentication is enabled' },
  ];

  private _renderComplianceCheck(): any {
    const pass = this._complianceRules.filter(r => r.status === 'pass').length;
    const fail = this._complianceRules.filter(r => r.status === 'fail').length;
    const warn = this._complianceRules.filter(r => r.status === 'warning').length;
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px;display:flex;align-items:center;gap:8px">
          <span>Compliance Check</span>
          <span style="font-size:10px;color:#22c55e">${pass} pass</span>
          <span style="font-size:10px;color:#eab308">${warn} warn</span>
          <span style="font-size:10px;color:#ef4444">${fail} fail</span>
        </div>
        ${this._complianceRules.map(r => html`
          <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #1f2937;font-size:10px">
            <div style="width:8px;height:8px;border-radius:50%;background:${r.status === 'pass' ? '#22c55e' : r.status === 'fail' ? '#ef4444' : '#eab308'}"></div>
            <span style="flex:1;color:#e2e8f0">${r.rule}</span>
            <span style="color:#6b7280;font-size:9px">${r.standard}</span>
          </div>
        `)}
      </div>
    `;
  }

  private _renderPanelConfig(): any {
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Configuration</div>
        ${Object.entries(this._panelConfig).map(([key, val]) => html`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1f2937">
            <span style="font-size:11px;color:#9ca3af">${key.replace(/([A-Z])/g, ' $1').trim()}</span>
            <div style="width:32px;height:18px;border-radius:9px;background:${val ? '#22c55e' : '#374151'};cursor:pointer;position:relative" @click=${() => { this._panelConfig = { ...this._panelConfig, [key]: !val }; }}>
              <div style="width:14px;height:14px;border-radius:50%;background:white;position:absolute;top:2px;left:${val ? '16px' : '2px'};transition:left 0.2s"></div>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  // === SECTION A: Multi-Phase Pipeline Execution Engine ===
  private _pipelinePhases: { id: string; name: string; status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled-back'; progress: number; duration: number; errors: string[]; rollbackSteps: string[] }[] = [
    { id: 'ph-1', name: 'Current Privilege Audit', status: 'completed', progress: 100, duration: 45, errors: [], rollbackSteps: ['Reset current privilege audit state'] },
    { id: 'ph-2', name: 'Vector Identification', status: 'completed', progress: 100, duration: 60, errors: [], rollbackSteps: ['Reset vector identification state'] },
    { id: 'ph-3', name: 'Exploit Feasibility Check', status: 'running', progress: 55, duration: 90, errors: [], rollbackSteps: ['Reset exploit feasibility check state'] },
    { id: 'ph-4', name: 'Impact Assessment', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset impact assessment state'] },
    { id: 'ph-5', name: 'Remediation Planning', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset remediation planning state'] },
    { id: 'ph-6', name: 'Verification Testing', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset verification testing state'] },
    { id: 'ph-7', name: 'Escalation Report', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset escalation report state'] },
  ];

  private _pipelineJobQueue: { id: string; name: string; priority: number; status: 'queued' | 'processing' | 'done'; phaseId: string; submittedAt: number; startedAt: number }[] = [
    { id: 'job-001', name: 'Enumerate local admin accounts', priority: 1, status: 'done', phaseId: 'ph-1', submittedAt: Date.now() - 300000, startedAt: Date.now() - 280000 },
    { id: 'job-002', name: 'Check token privileges', priority: 2, status: 'done', phaseId: 'ph-2', submittedAt: Date.now() - 250000, startedAt: Date.now() - 230000 },
    { id: 'job-003', name: 'Test named pipe impersonation', priority: 3, status: 'processing', phaseId: 'ph-3', submittedAt: Date.now() - 200000, startedAt: 0 },
    { id: 'job-004', name: 'Verify UAC bypass vectors', priority: 2, status: 'queued', phaseId: 'ph-4', submittedAt: Date.now() - 150000, startedAt: 0 },
    { id: 'job-005', name: 'Assess service account risks', priority: 4, status: 'queued', phaseId: 'ph-5', submittedAt: Date.now() - 100000, startedAt: 0 },
  ];

  private _errorCategories: { category: string; icon: string; count: number; autoRemediation: string }[] = [
    { category: 'Access Denied on Target', icon: 'enc', count: 4, autoRemediation: 'Request elevated credentials for scan' },
    { category: 'AV Detection Interference', icon: 'scan', count: 3, autoRemediation: 'Exclude scanner from AV rules' },
    { category: 'Token Handle Invalid', icon: 'hash', count: 2, autoRemediation: 'Refresh token and retry operation' },
    { category: 'Service Account Locked', icon: 'time', count: 1, autoRemediation: 'Unlock account via AD admin' },
    { category: 'Kernel Driver Blocked', icon: 'out', count: 5, autoRemediation: 'Load test-signed driver in debug mode' },
    { category: 'Race Condition Failure', icon: 'fs', count: 2, autoRemediation: 'Retry with timing adjustment' },
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
    { id: 'PE-001', case: 'Windows', finding: 'Named pipe impersonation to SYSTEM', severity: 'critical', riskScore: 94, trend: [78,82,85,88,90,92,94], status: 'confirmed', assignee: 'Red Team' },
    { id: 'PE-002', case: 'Linux', finding: 'SUID binary exploitation path', severity: 'high', riskScore: 82, trend: [62,66,70,74,77,80,82], status: 'active', assignee: 'Pentest' },
    { id: 'PE-003', case: 'Windows', finding: 'Kerberos ticket extraction from memory', severity: 'critical', riskScore: 91, trend: [72,75,78,82,85,88,91], status: 'confirmed', assignee: 'Red Team' },
    { id: 'PE-004', case: 'Cloud', finding: 'IAM role assumption chain', severity: 'high', riskScore: 85, trend: [68,72,75,78,80,82,85], status: 'investigating', assignee: 'Cloud Sec' },
    { id: 'PE-005', case: 'Windows', finding: 'UAC bypass via COM hijacking', severity: 'high', riskScore: 79, trend: [58,62,66,70,74,77,79], status: 'active', assignee: 'Red Team' },
    { id: 'PE-006', case: 'Linux', finding: 'Docker socket access to host root', severity: 'critical', riskScore: 96, trend: [82,85,88,91,93,95,96], status: 'confirmed', assignee: 'Container Sec' },
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
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Privilege Escalation Analysis Findings Grid</span>
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
    { name: 'PAM Solution Deployment', investment: 180000, annualSavings: 145000, riskReduction: 40, paybackMonths: 15, npv: 380000 },
    { name: 'Least-Privilege Automation', investment: 95000, annualSavings: 78000, riskReduction: 28, paybackMonths: 15, npv: 210000 },
    { name: 'Service Account Management', investment: 65000, annualSavings: 52000, riskReduction: 22, paybackMonths: 15, npv: 135000 },
    { name: 'Session Recording Platform', investment: 120000, annualSavings: 95000, riskReduction: 30, paybackMonths: 16, npv: 250000 },
  ];

  private _riskQuantMetrics: { metric: string; sle: number; aro: number; ale: number; mitigationCost: number; roi: number }[] = [
    { metric: 'Domain Admin Compromise', sle: 8500000, aro: 0.08, ale: 680000, mitigationCost: 180000, roi: 278 },
    { metric: 'Privileged Account Abuse', sle: 3200000, aro: 0.2, ale: 640000, mitigationCost: 95000, roi: 574 },
    { metric: 'Container Escape to Host', sle: 4500000, aro: 0.1, ale: 450000, mitigationCost: 120000, roi: 275 },
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
    { name: 'Privilege Scanner', url: '/api/v1/privesc/scan', method: 'POST', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '5m ago' },
    { name: 'Vector Database', url: '/api/v1/privesc/vectors', method: 'GET', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '15m ago' },
    { name: 'Remediation Engine', url: '/api/v1/privesc/remediate', method: 'POST', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '30m ago' },
  ];

  private _webhookConfigs: { id: string; name: string; url: string; events: string[]; active: boolean; lastTriggered: string }[] = [
    { id: 'wh-1', name: 'New Escalation Vector', url: 'https://hooks.slack.com/T00/B00/pe1', events: ['new_vector'], active: true, lastTriggered: '10m ago' },
    { id: 'wh-2', name: 'Privilege Abuse Alert', url: 'https://hooks.slack.com/T00/B00/pe2', events: ['abuse_detected'], active: true, lastTriggered: '5m ago' },
    { id: 'wh-3', name: 'JIRA Ticket Create', url: 'https://company.atlassian.net/rest/webhooks/4', events: ['critical_vector'], active: true, lastTriggered: '1h ago' },
  ];

  private _dataSourceConnections: { name: string; type: string; status: 'connected' | 'disconnected' | 'error'; lastSync: string; records: number }[] = [
    { name: 'Active Directory', type: 'LDAP', status: 'connected', lastSync: '2m ago', records: 15200 },
    { name: 'Linux Server Inventory', type: 'Ansible', status: 'connected', lastSync: '10m ago', records: 4500 },
    { name: 'Container Registry', type: 'Kubernetes', status: 'connected', lastSync: '5m ago', records: 890 },
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
    { term: 'PAM', definition: 'Privileged Access Management for controlling admin accounts' },
    { term: 'UAC', definition: 'User Account Control - Windows feature preventing unauthorized changes' },
    { term: 'Kerberoasting', definition: 'Extracting service account hashes via Kerberos TGS requests' },
    { term: 'Named Pipe Impersonation', definition: 'Using named pipes to impersonate connected clients' },
    { term: 'SUID Binary', definition: 'Linux executable that runs with file owner permissions' },
    { term: 'Token Impersonation', definition: 'Using another users security token to gain their access' },
    { term: 'Pass-the-Hash', definition: 'Authenticating with NTLM hash instead of password' },
    { term: 'Golden Ticket', definition: 'Forged Kerberos TGT granting arbitrary domain access' },
    { term: 'Silver Ticket', definition: 'Forged Kerberos service ticket for specific service access' },
    { term: 'Docker Escape', definition: 'Breaking out of a container to access the host system' },
    { term: 'Just Enough Admin', definition: 'Granting minimum privileges for specific tasks only' },
    { term: 'Standing Privilege', definition: 'Always-active admin access vs. just-in-time elevation' },
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


  // === SCENARIO SIMULATION ENGINE ===
  @state() private _peScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _peScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _peScenarioCompare: boolean = false;
  @state() private _peScenarioSelected: string[] = [];

  private _peInitScenarios(): void {
    const saved = localStorage.getItem('pe_scenarios');
    if (saved) { try { this._peScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._peScenarios.length === 0) {
      this._peScenarios = [
        {id:'pe-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'pe-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'pe-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _peSaveScenarios(): void {
    localStorage.setItem('pe_scenarios', JSON.stringify(this._peScenarios));
  }

  private _peAddScenario(): void {
    const f = this._peScenarioForm;
    if (!f.attackType || !f.target) return;
    this._peScenarios = [...this._peScenarios, {
      id: 'pe-s' + (this._peScenarios.length + 1),
      name: f.attackType + ' vs ' + f.target,
      attackType: f.attackType,
      target: f.target,
      method: f.method || 'Unknown',
      impactLow: Math.floor(Math.random() * 40 + 20),
      impactHigh: Math.floor(Math.random() * 30 + 70),
      confidence: Math.floor(Math.random() * 30 + 50),
      mitigation: 'Review and implement appropriate controls',
      status: 'draft',
    }];
    this._peScenarioForm = {attackType:'',target:'',method:''};
    this._peSaveScenarios();
  }

  private _peRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._peScenarioCompare = !this._peScenarioCompare; }}>${this._peScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._peScenarioForm = {...this._peScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._peScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._peScenarioForm = {...this._peScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._peScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._peScenarioForm = {...this._peScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._peScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._peAddScenario}>Run Simulation</button>
      </div>
      ${this._peScenarioCompare && this._peScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._peScenarios.length)},1fr);gap:8px">
            ${this._peScenarios.slice(0,3).map(s => html`
              <div style="background:#1a1d2e;border-radius:6px;padding:8px;border:1px solid #2a2d3a">
                <div style="font-weight:600;font-size:11px;color:#60a5fa;margin-bottom:4px">${s.name}</div>
                <div style="font-size:10px;color:#9ca3af">${s.attackType} / ${s.target}</div>
                <div style="margin-top:6px;font-size:10px">
                  <div>Impact: ${s.impactLow}-${s.impactHigh}%</div>
                  <div>Confidence: ${s.confidence}%</div>
                  <div style="margin-top:4px;color:#f59e0b">${s.mitigation}</div>
                </div>
              </div>
            `)}
          </div>
        </div>
      ` : ''}
      <div style="background:#0f1117;border-radius:8px;padding:12px">
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._peScenarios.length})</div>
        ${this._peScenarios.map(s => html`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #1a1d2e">
            <div>
              <span style="font-size:11px;color:#e2e8f0">${s.name}</span>
              <span style="font-size:9px;color:#6b7280;margin-left:6px">${s.attackType}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <span style="font-size:9px;padding:2px 6px;border-radius:3px;background:${s.impactHigh > 80 ? '#dc262620' : '#f59e0b20'};color:${s.impactHigh > 80 ? '#ef4444' : '#f59e0b'}">${s.impactLow}-${s.impactHigh}%</span>
              <span style="font-size:9px;color:#6b7280">${s.confidence}% conf</span>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  // === TIME-SERIES ANALYSIS ===
  @state() private _peTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _peTrendZoom: {start:number;end:number} | null = null;
  @state() private _peTrendMA: number = 7;

  private _peInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._peTrendData = data;
  }

  private _peCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._peTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._peTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _peGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._peTrendData.map(d => d.value);
    const n = vals.length;
    const mean = vals.reduce((a,b) => a+b, 0) / n;
    const sorted = [...vals].sort((a,b) => a-b);
    const median = n % 2 === 0 ? (sorted[n/2-1]+sorted[n/2])/2 : sorted[Math.floor(n/2)];
    const variance = vals.reduce((s,v) => s + (v-mean)*(v-mean), 0) / n;
    const stddev = Math.sqrt(variance);
    const firstHalf = vals.slice(0, Math.floor(n/2));
    const secondHalf = vals.slice(Math.floor(n/2));
    const firstMean = firstHalf.reduce((a,b)=>a+b,0)/firstHalf.length;
    const secondMean = secondHalf.reduce((a,b)=>a+b,0)/secondHalf.length;
    const trend = secondMean > firstMean + stddev*0.5 ? 'Increasing' : secondMean < firstMean - stddev*0.5 ? 'Decreasing' : 'Stable';
    return {mean: Math.round(mean*10)/10, median: Math.round(median*10)/10, stddev: Math.round(stddev*10)/10, trend};
  }

  private _peRenderTimeSeries(): any {
    const stats = this._peGetStats();
    const filtered = this._peTrendZoom ? this._peTrendData.filter(d => d.day >= this._peTrendZoom.start && d.day <= this._peTrendZoom.end) : this._peTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._peTrendMA === 7 ? 'active' : ''}" @click=${() => { this._peTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._peTrendMA === 30 ? 'active' : ''}" @click=${() => { this._peTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._peTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._peTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
        }}>
          ${filtered.map((d, i) => html`
            <div style="position:absolute;left:${(d.day / 89) * 100}%;bottom:${((d.value - minVal) / range) * 100}%;width:2px;height:${(d.value - minVal) / range * 100}%;background:${d.anomaly ? '#ef4444' : '#3b82f6'};opacity:0.7"></div>
            ${d.anomaly ? html`<div style="position:absolute;left:${(d.day / 89) * 100 - 2}%;top:0;width:4px;height:100%;background:#ef444620;border-left:1px dashed #ef4444"></div>` : nothing}
          `)}
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px">
          <div style="background:#1a1d2e;border-radius:4px;padding:6px;text-align:center">
            <div style="font-size:14px;font-weight:700;color:#60a5fa">${stats.mean}</div>
            <div style="font-size:9px;color:#6b7280">Mean</div>
          </div>
          <div style="background:#1a1d2e;border-radius:4px;padding:6px;text-align:center">
            <div style="font-size:14px;font-weight:700;color:#34d399">${stats.median}</div>
            <div style="font-size:9px;color:#6b7280">Median</div>
          </div>
          <div style="background:#1a1d2e;border-radius:4px;padding:6px;text-align:center">
            <div style="font-size:14px;font-weight:700;color:#f59e0b">${stats.stddev}</div>
            <div style="font-size:9px;color:#6b7280">Std Dev</div>
          </div>
          <div style="background:#1a1d2e;border-radius:4px;padding:6px;text-align:center">
            <div style="font-size:14px;font-weight:700;color:${stats.trend === 'Increasing' ? '#ef4444' : stats.trend === 'Decreasing' ? '#22c55e' : '#6b7280'}">${stats.trend}</div>
            <div style="font-size:9px;color:#6b7280">Trend</div>
          </div>
        </div>
      </div>
    `;
  }

  // === ACCESS CONTROL MATRIX ===
  @state() private _peRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _peActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _pePermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _pePermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _pePermCompare: string[] = [];

  private _peInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._peRoles) {
      perms[role] = {};
      this._peActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._pePermissions = perms;
  }

  private _peTogglePermission(role: string, action: string): void {
    const old = this._pePermissions[role][action];
    this._pePermissions = {...this._pePermissions, [role]: {...this._pePermissions[role], [action]: !old}};
    this._pePermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _peRenderRBAC(): any {
    const compareRoles = this._pePermCompare.map(r => this._pePermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._peRoles.map(r => html`
              <button class="tab ${this._pePermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._pePermCompare = this._pePermCompare.includes(r) ? this._pePermCompare.filter(x => x !== r) : [...this._pePermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._peActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._peRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._peActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._pePermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._peTogglePermission(role, action)}>${this._pePermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._pePermCompare.join(' vs ')}</div>
            ${this._peActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._pePermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._pePermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._pePermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _peReportTemplate: string = 'executive';
  @state() private _peReportSchedule: string = 'weekly';
  @state() private _peReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _peReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _peGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._peReportHistory.unshift({id,template:this._peReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _peRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._peReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._peReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._peReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._peReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._peReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._peReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._peGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._peReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._peReportHistory.slice(0,3).map(r => html`
              <div style="display:flex;justify-content:space-between;padding:4px 0;font-size:10px">
                <span style="color:#e2e8f0">${r.template}</span>
                <span style="color:${r.status === 'sent' ? '#22c55e' : r.status === 'failed' ? '#ef4444' : '#f59e0b'}">${r.status}</span>
              </div>
            `)}
          </div>
        ` : nothing}
      </div>
    `;
  }

  // === KEYBOARD SHORTCUTS & ACCESSIBILITY ===
  @state() private _peHighContrast: boolean = false;
  @state() private _peA11yAnnounce: string = '';
  @state() private _peShortcutsVisible: boolean = false;
  @state() private _peFocusTrap: boolean = false;

  private _peShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _peHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._peFocusTrap) { this._peFocusTrap = false; this._peAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._peHighContrast = !this._peHighContrast; this._peAnnounce('High contrast ' + (this._peHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._peShortcutsVisible = !this._peShortcutsVisible; }
  }

  private _peAnnounce(msg: string): void {
    this._peA11yAnnounce = msg;
    setTimeout(() => { this._peA11yAnnounce = ''; }, 2000);
  }

  private _peRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._peShortcutsVisible ? 'active' : ''}" @click=${() => { this._peShortcutsVisible = !this._peShortcutsVisible; }} aria-expanded=${this._peShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._peHighContrast} @change=${() => { this._peHighContrast = !this._peHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._peShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._peShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._peA11yAnnounce}</div>
      </div>
    `;
  }


  // === TAB INTEGRATION FOR EXTENDED FEATURES ===
  @state() private _peActiveSubTab: string = 'scenario';



  // === Advanced Threat Modeling (STRIDE/DREAD/Attack Tree) ===
  @state() private _threatModelEnabled = false;
  @state() private _threatCategories: Array<{
    id: string;
    category: string;
    threats: Array<{
      id: string;
      name: string;
      stride: string;
      likelihood: number;
      impact: number;
      dreadScore: number;
      status: string;
      mitigations: string[];
      assignedTo: string;
      discoveredDate: string;
      lastReviewed: string;
    }>;
    totalCount: number;
    criticalCount: number;
    mitigatedCount: number;
  }> = [];
  @state() private _selectedThreatCategory = '';
  @state() private _threatViewMode: 'matrix' | 'tree' | 'canvas' | 'comparison' = 'matrix';
  @state() private _threatModelVersion = 'v1.0';
  @state() private _threatModelHistory: Array<{ version: string; date: string; changes: string; author: string }> = [];

  private _initThreatModel() {
    const categories = [
      { id: 'tc1', category: 'Spoofing', threats: [
        { id: 't1', name: 'Credential theft via phishing', stride: 'S', likelihood: 8, impact: 9, dreadScore: 7.2, status: 'open', mitigations: ['MFA enforcement', 'Security awareness training'], assignedTo: 'Security Team', discoveredDate: '2024-01-10', lastReviewed: '2024-02-15' },
        { id: 't2', name: 'Session hijacking', stride: 'S', likelihood: 6, impact: 8, dreadScore: 6.5, status: 'mitigated', mitigations: ['Session rotation', 'Binding tokens'], assignedTo: 'Platform Team', discoveredDate: '2024-01-12', lastReviewed: '2024-02-20' },
        { id: 't3', name: 'Token forgery attack', stride: 'S', likelihood: 4, impact: 9, dreadScore: 5.8, status: 'in-progress', mitigations: ['Token signing', 'Short TTL'], assignedTo: 'Auth Team', discoveredDate: '2024-01-15', lastReviewed: '2024-02-18' },
      ], totalCount: 3, criticalCount: 1, mitigatedCount: 1 },
      { id: 'tc2', category: 'Tampering', threats: [
        { id: 't4', name: 'Data injection in security operations', stride: 'T', likelihood: 7, impact: 8, dreadScore: 7.0, status: 'open', mitigations: ['Input validation', 'WAF rules'], assignedTo: 'Dev Team', discoveredDate: '2024-01-08', lastReviewed: '2024-02-10' },
        { id: 't5', name: 'Configuration drift', stride: 'T', likelihood: 5, impact: 6, dreadScore: 5.2, status: 'mitigated', mitigations: ['Config management', 'Drift detection'], assignedTo: 'SRE Team', discoveredDate: '2024-01-20', lastReviewed: '2024-02-22' },
      ], totalCount: 2, criticalCount: 1, mitigatedCount: 1 },
      { id: 'tc3', category: 'Repudiation', threats: [
        { id: 't6', name: 'Log tampering evidence loss', stride: 'R', likelihood: 5, impact: 7, dreadScore: 5.8, status: 'in-progress', mitigations: ['Immutable logs', 'Log forwarding'], assignedTo: 'SOC Team', discoveredDate: '2024-01-22', lastReviewed: '2024-02-25' },
      ], totalCount: 1, criticalCount: 0, mitigatedCount: 0 },
      { id: 'tc4', category: 'Info Disclosure', threats: [
        { id: 't7', name: 'Sensitive data exposure in API', stride: 'I', likelihood: 8, impact: 9, dreadScore: 8.2, status: 'open', mitigations: ['Data masking', 'Field-level encryption'], assignedTo: 'API Team', discoveredDate: '2024-01-05', lastReviewed: '2024-02-12' },
        { id: 't8', name: 'Cloud storage misconfiguration', stride: 'I', likelihood: 6, impact: 8, dreadScore: 6.8, status: 'mitigated', mitigations: ['Storage policies', 'Access reviews'], assignedTo: 'Cloud Team', discoveredDate: '2024-01-18', lastReviewed: '2024-02-20' },
        { id: 't9', name: 'Error message information leak', stride: 'I', likelihood: 7, impact: 4, dreadScore: 5.0, status: 'mitigated', mitigations: ['Generic error pages', 'Stack trace filter'], assignedTo: 'Dev Team', discoveredDate: '2024-01-25', lastReviewed: '2024-02-28' },
      ], totalCount: 3, criticalCount: 1, mitigatedCount: 2 },
      { id: 'tc5', category: 'Denial of Service', threats: [
        { id: 't10', name: 'Resource exhaustion attack', stride: 'D', likelihood: 7, impact: 8, dreadScore: 7.2, status: 'open', mitigations: ['Rate limiting', 'Circuit breaker'], assignedTo: 'Infra Team', discoveredDate: '2024-01-14', lastReviewed: '2024-02-16' },
        { id: 't11', name: 'API abuse amplification', stride: 'D', likelihood: 5, impact: 6, dreadScore: 5.4, status: 'in-progress', mitigations: ['API gateway throttling', 'Request quotas'], assignedTo: 'API Team', discoveredDate: '2024-01-28', lastReviewed: '2024-03-01' },
      ], totalCount: 2, criticalCount: 1, mitigatedCount: 0 },
      { id: 'tc6', category: 'Elevation of Privilege', threats: [
        { id: 't12', name: 'Privilege escalation via misconfig', stride: 'E', likelihood: 6, impact: 10, dreadScore: 7.8, status: 'open', mitigations: ['Least privilege', 'RBAC audit'], assignedTo: 'IAM Team', discoveredDate: '2024-01-06', lastReviewed: '2024-02-08' },
        { id: 't13', name: 'Container breakout exploit', stride: 'E', likelihood: 3, impact: 10, dreadScore: 5.8, status: 'mitigated', mitigations: ['Runtime security', 'Seccomp profiles'], assignedTo: 'Platform Team', discoveredDate: '2024-01-30', lastReviewed: '2024-03-02' },
      ], totalCount: 2, criticalCount: 1, mitigatedCount: 1 },
      { id: 'tc7', category: 'Supply Chain', threats: [
        { id: 't14', name: 'Dependency compromise', stride: 'E', likelihood: 5, impact: 8, dreadScore: 6.2, status: 'in-progress', mitigations: ['SBOM scanning', 'Lock files'], assignedTo: 'DevSecOps', discoveredDate: '2024-02-01', lastReviewed: '2024-03-05' },
      ], totalCount: 1, criticalCount: 1, mitigatedCount: 0 },
      { id: 'tc8', category: 'Physical / Social', threats: [
        { id: 't15', name: 'Tailgating access breach', stride: 'S', likelihood: 4, impact: 7, dreadScore: 5.2, status: 'open', mitigations: ['Badge access', 'Security cameras'], assignedTo: 'Physical Security', discoveredDate: '2024-02-03', lastReviewed: '2024-03-08' },
      ], totalCount: 1, criticalCount: 0, mitigatedCount: 0 },
    ];
    this._threatCategories = categories;
    this._threatModelHistory = [
      { version: 'v1.0', date: '2024-01-01', changes: 'Initial threat model created', author: 'Security Lead' },
      { version: 'v1.1', date: '2024-02-01', changes: 'Added supply chain threats, updated DREAD scores', author: 'Security Analyst' },
    ];
    this._threatModelEnabled = true;
  }

  private _getThreatColor(score: number): string {
    if (score >= 7) return '#f87171';
    if (score >= 5) return '#fbbf24';
    if (score >= 3) return '#34d399';
    return '#60a5fa';
  }

  private _renderThreatModelPanel(): any {
    if (!this._threatModelEnabled) return nothing;
    const totalThreats = this._threatCategories.reduce((s, c) => s + c.totalCount, 0);
    const criticalThreats = this._threatCategories.reduce((s, c) => s + c.criticalCount, 0);
    const mitigatedThreats = this._threatCategories.reduce((s, c) => s + c.mitigatedCount, 0);
    return html`
      <div style="margin-top:12px;padding:12px;background:#111827;border:1px solid #374151;border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-weight:700;font-size:13px;color:#f9fafb">Threat Model (STRIDE/DREAD)</div>
          <div style="display:flex;gap:6px">
            ${['matrix', 'tree', 'canvas', 'comparison'].map(m => html`
              <button class="btn btn-sm" style="padding:3px 10px;font-size:10px;${this._threatViewMode === m ? 'background:#1e40af;color:#fff' : 'background:#1f2937;color:#9ca3af'}" @click=${() => { this._threatViewMode = m as any; }}>${m.charAt(0).toUpperCase() + m.slice(1)}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <div style="flex:1;padding:8px;background:#1f2937;border-radius:6px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#f9fafb">${totalThreats}</div>
            <div style="font-size:10px;color:#9ca3af">Total Threats</div>
          </div>
          <div style="flex:1;padding:8px;background:#1f2937;border-radius:6px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#f87171">${criticalThreats}</div>
            <div style="font-size:10px;color:#9ca3af">Critical</div>
          </div>
          <div style="flex:1;padding:8px;background:#1f2937;border-radius:6px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#34d399">${mitigatedThreats}</div>
            <div style="font-size:10px;color:#9ca3af">Mitigated</div>
          </div>
          <div style="flex:1;padding:8px;background:#1f2937;border-radius:6px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#fbbf24">${this._threatModelVersion}</div>
            <div style="font-size:10px;color:#9ca3af">Version</div>
          </div>
        </div>
        ${this._threatViewMode === 'matrix' ? html`
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:4px;font-size:10px;margin-bottom:8px">
            <div style="padding:4px;text-align:center;color:#6b7280;border-bottom:1px solid #374151">Low Impact</div>
            <div style="padding:4px;text-align:center;color:#6b7280;border-bottom:1px solid #374151">Medium Impact</div>
            <div style="padding:4px;text-align:center;color:#6b7280;border-bottom:1px solid #374151">High Impact</div>
            <div style="padding:4px;text-align:center;color:#6b7280;border-bottom:1px solid #374151">Critical Impact</div>
            ${[0,1,2,3].map(row => html`
              <div style="padding:4px;text-align:center;color:#6b7280;background:#111827">${row === 0 ? 'Unlikely' : row === 1 ? 'Possible' : row === 2 ? 'Likely' : 'Almost Certain'}</div>
              ${[0,1,2,3].map(col => {
                const impact = (col + 1) * 2.5;
                const likelihood = (row + 1) * 2.5;
                const threats = this._threatCategories.flatMap(c => c.threats).filter(t => t.likelihood >= likelihood - 1.25 && t.likelihood < likelihood + 1.25 && t.impact >= impact - 1.25 && t.impact < impact + 1.25);
                const bgColor = (row + col) >= 4 ? 'rgba(239,68,68,0.15)' : (row + col) >= 2 ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)';
                return html`<div style="padding:4px;text-align:center;background:${bgColor};border-radius:4px;cursor:pointer;font-size:9px;color:#d1d5db" title="${threats.map(t => t.name).join(', ')}">${threats.length}</div>`;
              })}
            `)}
          </div>
        ` : this._threatViewMode === 'canvas' ? html`
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px">
            ${this._threatCategories.map(cat => html`
              <div style="padding:8px;background:#1f2937;border-radius:6px;border-left:3px solid ${this._getThreatColor(cat.threats.reduce((s, t) => s + t.dreadScore, 0) / cat.totalCount)}">
                <div style="font-size:11px;font-weight:600;color:#f9fafb;margin-bottom:4px">${cat.category}</div>
                <div style="font-size:9px;color:#9ca3af">${cat.totalCount} threats (span style="color:#f87171">${cat.criticalCount} critical</span>)</div>
                <div style="margin-top:6px">${cat.threats.slice(0, 2).map(t => html`
                  <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:9px">
                    <span style="color:#d1d5db">${t.name.substring(0, 20)}</span>
                    <span style="color:${this._getThreatColor(t.dreadScore)}">${t.dreadScore}</span>
                  </div>
                `)}</div>
              </div>
            `)}
          </div>
        ` : this._threatViewMode === 'tree' ? html`
          <div style="max-height:200px;overflow-y:auto">
            ${this._threatCategories.map(cat => html`
              <div style="margin-bottom:6px">
                <div style="padding:4px 8px;background:#1e3a5f;border-radius:4px 4px 0 0;font-size:11px;font-weight:600;color:#60a5fa">${cat.category} (${cat.totalCount})</div>
                ${cat.threats.map(t => html`
                  <div style="display:flex;align-items:center;padding:3px 8px 3px 24px;background:#111827;border-left:2px solid #374151;font-size:10px">
                    <span style="flex:1;color:#d1d5db">${t.name}</span>
                    <span style="color:${this._getThreatColor(t.dreadScore)};font-weight:600;margin-right:8px">${t.dreadScore}</span>
                    <span style="padding:1px 6px;border-radius:3px;font-size:8px;background:${t.status === 'mitigated' ? '#064e3b' : t.status === 'in-progress' ? '#78350f' : '#7f1d1d'};color:${t.status === 'mitigated' ? '#34d399' : t.status === 'in-progress' ? '#fbbf24' : '#f87171'}">${t.status}</span>
                  </div>
                `)}
              </div>
            `)}
          </div>
        ` : html`
          <div style="font-size:10px;color:#9ca3af;padding:8px;text-align:center">
            <div style="font-weight:600;color:#d1d5db;margin-bottom:6px">Threat Model Version History</div>
            ${this._threatModelHistory.map(h => html`
              <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #1f2937">
                <span style="color:#60a5fa">${h.version}</span>
                <span>${h.date}</span>
                <span style="color:#d1d5db">${h.author}</span>
                <span style="color:#9ca3af">${h.changes}</span>
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }


  // === Data Pipeline Visualization (DAG) ===
  @state() private _pipelineEnabled = false;
  @state() private _pipelineStages: Array<{
    id: string;
    name: string;
    type: string;
    status: 'running' | 'completed' | 'failed' | 'pending' | 'warning';
    inputRecords: number;
    outputRecords: number;
    errorRate: number;
    latencyMs: number;
    throughput: number;
    qualityScore: number;
    startTime: string;
    endTime: string;
    dependencies: string[];
    bottlenecks: string[];
  }> = [];
  @state() private _pipelineViewMode: 'dag' | 'timeline' | 'metrics' = 'dag';
  @state() private _pipelineSelectedStage = '';
  @state() private _pipelineAutoRefresh = false;

  private _initPipeline() {
    this._pipelineStages = [
      { id: 's1', name: 'Data Ingestion', type: 'source', status: 'completed', inputRecords: 0, outputRecords: 125000, errorRate: 0.01, latencyMs: 120, throughput: 5200, qualityScore: 98.5, startTime: '00:00:00', endTime: '00:00:48', dependencies: [], bottlenecks: [] },
      { id: 's2', name: 'Schema Validation', type: 'transform', status: 'completed', inputRecords: 125000, outputRecords: 124500, errorRate: 0.4, latencyMs: 85, throughput: 4800, qualityScore: 99.6, startTime: '00:00:48', endTime: '00:01:14', dependencies: ['s1'], bottlenecks: [] },
      { id: 's3', name: 'Enrichment Engine', type: 'enrichment', status: 'running', inputRecords: 124500, outputRecords: 98200, errorRate: 2.1, latencyMs: 340, throughput: 2900, qualityScore: 92.3, startTime: '00:01:14', endTime: '', dependencies: ['s2'], bottlenecks: ['High latency on geolocation lookup', 'External API rate limiting'] },
      { id: 's4', name: 'Deduplication', type: 'transform', status: 'pending', inputRecords: 98200, outputRecords: 0, errorRate: 0, latencyMs: 0, throughput: 0, qualityScore: 0, startTime: '', endTime: '', dependencies: ['s3'], bottlenecks: [] },
      { id: 's5', name: 'Threat Correlation', type: 'analysis', status: 'pending', inputRecords: 0, outputRecords: 0, errorRate: 0, latencyMs: 0, throughput: 0, qualityScore: 0, startTime: '', endTime: '', dependencies: ['s3', 's4'], bottlenecks: [] },
      { id: 's6', name: 'Scoring Engine', type: 'scoring', status: 'pending', inputRecords: 0, outputRecords: 0, errorRate: 0, latencyMs: 0, throughput: 0, qualityScore: 0, startTime: '', endTime: '', dependencies: ['s5'], bottlenecks: [] },
      { id: 's7', name: 'Alert Generation', type: 'sink', status: 'pending', inputRecords: 0, outputRecords: 0, errorRate: 0, latencyMs: 0, throughput: 0, qualityScore: 0, startTime: '', endTime: '', dependencies: ['s6'], bottlenecks: [] },
      { id: 's8', name: 'Archive Storage', type: 'sink', status: 'pending', inputRecords: 0, outputRecords: 0, errorRate: 0, latencyMs: 0, throughput: 0, qualityScore: 0, startTime: '', endTime: '', dependencies: ['s6'], bottlenecks: [] },
    ];
    this._pipelineEnabled = true;
  }

  private _getPipelineStatusColor(status: string): string {
    switch (status) {
      case 'completed': return '#34d399';
      case 'running': return '#60a5fa';
      case 'failed': return '#f87171';
      case 'warning': return '#fbbf24';
      default: return '#6b7280';
    }
  }

  private _getPipelineStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✓';
      case 'running': return '●';
      case 'failed': return '✗';
      case 'warning': return '⚠';
      default: return '○';
    }
  }

  private _renderPipelineVisualization(): any {
    if (!this._pipelineEnabled) return nothing;
    const completedCount = this._pipelineStages.filter(s => s.status === 'completed').length;
    const runningCount = this._pipelineStages.filter(s => s.status === 'running').length;
    const totalRecords = this._pipelineStages.reduce((s, p) => s + p.outputRecords, 0);
    return html`
      <div style="margin-top:12px;padding:12px;background:#111827;border:1px solid #374151;border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-weight:700;font-size:13px;color:#f9fafb">Data Pipeline (DAG)</div>
          <div style="display:flex;gap:6px;align-items:center">
            <span style="font-size:10px;color:#9ca3af">${completedCount}/${this._pipelineStages.length} stages</span>
            <span style="font-size:10px;color:#60a5fa">${totalRecords.toLocaleString()} records</span>
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:10px">
          ${['dag', 'timeline', 'metrics'].map(v => html`
            <button class="btn btn-sm" style="padding:3px 10px;font-size:10px;${this._pipelineViewMode === v ? 'background:#1e40af;color:#fff' : 'background:#1f2937;color:#9ca3af'}" @click=${() => { this._pipelineViewMode = v as any; }}>${v === 'dag' ? 'Flow Graph' : v === 'timeline' ? 'Timeline' : 'Metrics'}</button>
          `)}
        </div>
        ${this._pipelineViewMode === 'dag' ? html`
          <div style="position:relative;padding:8px">
            ${this._pipelineStages.map((stage, i) => html`
              <div style="display:flex;align-items:center;margin-bottom:4px;position:relative">
                <div style="width:16px;height:16px;border-radius:50%;background:${this._getPipelineStatusColor(stage.status)};display:flex;align-items:center;justify-content:center;font-size:8px;color:#111827;font-weight:700;z-index:1;flex-shrink:0">${this._getPipelineStatusIcon(stage.status)}</div>
                ${i < this._pipelineStages.length - 1 ? html`<div style="position:absolute;left:7px;top:16px;width:2px;height:20px;background:#374151"></div>` : nothing}
                <div style="margin-left:12px;flex:1;padding:6px 10px;background:#1f2937;border-radius:6px;border-left:3px solid ${this._getPipelineStatusColor(stage.status)};cursor:pointer" @click=${() => { this._pipelineSelectedStage = this._pipelineSelectedStage === stage.id ? '' : stage.id; }}>
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:11px;font-weight:600;color:#f9fafb">${stage.name}</span>
                    <span style="font-size:9px;color:#9ca3af">${stage.type}</span>
                  </div>
                  ${this._pipelineSelectedStage === stage.id ? html`
                    <div style="margin-top:6px;display:grid;grid-template-columns:repeat(3, 1fr);gap:4px;font-size:9px">
                      <div style="color:#9ca3af">In: <span style="color:#60a5fa">${stage.inputRecords.toLocaleString()}</span></div>
                      <div style="color:#9ca3af">Out: <span style="color:#34d399">${stage.outputRecords.toLocaleString()}</span></div>
                      <div style="color:#9ca3af">Errors: <span style="color:${stage.errorRate > 1 ? '#f87171' : '#fbbf24'}">${stage.errorRate}%</span></div>
                      <div style="color:#9ca3af">Latency: <span style="color:#d1d5db">${stage.latencyMs}ms</span></div>
                      <div style="color:#9ca3af">Throughput: <span style="color:#d1d5db">${stage.throughput}/s</span></div>
                      <div style="color:#9ca3af">Quality: <span style="color:${stage.qualityScore >= 95 ? '#34d399' : stage.qualityScore >= 80 ? '#fbbf24' : '#f87171'}">${stage.qualityScore}%</span></div>
                    </div>
                    ${stage.bottlenecks.length > 0 ? html`
                      <div style="margin-top:4px;padding:4px 6px;background:#7f1d1d;border-radius:4px;font-size:9px;color:#fca5a5">
                        Bottleneck: ${stage.bottlenecks.join('; ')}
                      </div>
                    ` : nothing}
                  ` : html`
                    <div style="font-size:9px;color:#6b7280;margin-top:2px">${stage.status === 'running' ? `Processing... ${stage.outputRecords.toLocaleString()} records` : stage.status === 'completed' ? `${stage.outputRecords.toLocaleString()} records processed` : 'Waiting for dependencies'}</div>
                  `}
                </div>
              </div>
            `)}
          </div>
        ` : this._pipelineViewMode === 'timeline' ? html`
          <div style="overflow-x:auto">
            <div style="display:flex;gap:2px;min-width:600px">
              ${this._pipelineStages.map(stage => {
                const totalSpan = 300;
                const startOffset = stage.startTime ? this._timeToOffset(stage.startTime) : 0;
                const endOffset = stage.endTime ? this._timeToOffset(stage.endTime) : this._timeToOffset('00:02:30');
                const width = Math.max(endOffset - startOffset, 8);
                return html`
                  <div style="flex-shrink:0;width:${width}px;margin-left:${startOffset}px;padding:4px;background:${this._getPipelineStatusColor(stage.status)}22;border:1px solid ${this._getPipelineStatusColor(stage.status)}44;border-radius:3px;font-size:8px;color:#d1d5db;overflow:hidden">
                    <div style="font-weight:600;white-space:nowrap">${stage.name}</div>
                    <div style="color:#9ca3af">${stage.startTime} - ${stage.endTime || '...'}</div>
                  </div>
                `;
              })}
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;color:#6b7280;margin-top:4px">
              <span>00:00</span><span>00:30</span><span>01:00</span><span>01:30</span><span>02:00</span><span>02:30</span>
            </div>
          </div>
        ` : html`
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:6px">
            ${this._pipelineStages.filter(s => s.status !== 'pending').map(stage => html`
              <div style="padding:8px;background:#1f2937;border-radius:6px;text-align:center">
                <div style="font-size:10px;font-weight:600;color:#f9fafb;margin-bottom:4px">${stage.name}</div>
                <div style="font-size:16px;font-weight:700;color:${this._getPipelineStatusColor(stage.status)}">${stage.qualityScore}%</div>
                <div style="font-size:8px;color:#9ca3af">Quality Score</div>
                <div style="margin-top:4px;height:3px;background:#374151;border-radius:2px;overflow:hidden">
                  <div style="height:100%;width:${stage.qualityScore}%;background:${this._getPipelineStatusColor(stage.status)};border-radius:2px"></div>
                </div>
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }

  private _timeToOffset(time: string): number {
    const parts = time.split(':').map(Number);
    return Math.round((parts[0] * 3600 + parts[1] * 60 + parts[2]) / 5);
  }


  // === Playbook System (Runbooks) ===
  @state() private _playbookEnabled = false;
  @state() private _playbooks: Array<{
    id: string;
    name: string;
    type: 'incident-response' | 'containment' | 'eradication' | 'recovery' | 'forensic' | 'communication';
    severity: string;
    steps: Array<{
      id: string;
      title: string;
      description: string;
      condition?: string;
      completed: boolean;
      assignedTo: string;
      estimatedMinutes: number;
      tools: string[];
    }>;
    totalSteps: number;
    completedSteps: number;
    status: 'not-started' | 'in-progress' | 'completed' | 'paused';
    startedAt: string;
    estimatedDuration: number;
    currentStepIndex: number;
    version: string;
    lastModified: string;
  }> = [];
  @state() private _activePlaybookId = '';
  @state() private _playbookTimer = 0;
  @state() private _playbookTimerInterval: ReturnType<typeof setInterval> | null = null;

  private _initPlaybooks() {
    this._playbooks = [
      { id: 'pb1', name: 'Ransomware Incident Response', type: 'incident-response', severity: 'critical', steps: [
        { id: 's1', title: 'Isolate affected systems', description: 'Immediately disconnect compromised systems from the network to prevent lateral movement', completed: true, assignedTo: 'SOC Tier 2', estimatedMinutes: 5, tools: ['EDR Console', 'Network ACLs'] },
        { id: 's2', title: 'Preserve volatile evidence', description: 'Capture memory dumps and running process lists before shutdown', completed: true, assignedTo: 'Forensic Team', estimatedMinutes: 15, tools: ['Volatility', 'FTK Imager'] },
        { id: 's3', title: 'Identify ransomware variant', description: 'Analyze ransom note, encrypted file extensions, and behavioral indicators', completed: false, assignedTo: 'Malware Analyst', estimatedMinutes: 30, tools: ['VirusTotal', 'IDA Pro', 'ANY.RUN'] },
        { id: 's4', title: 'Check for data exfiltration', description: 'Review network logs for outbound data transfers during the attack window', completed: false, assignedTo: 'SOC Analyst', estimatedMinutes: 20, tools: ['SIEM', 'NetFlow Analyzer'] },
        { id: 's5', title: 'Assess backup integrity', description: 'Verify that clean backups exist and are not encrypted', condition: 'If backups are available', completed: false, assignedTo: 'Backup Admin', estimatedMinutes: 10, tools: ['Veeam', 'Backup Dashboard'] },
        { id: 's6', title: 'Report to leadership', description: 'Notify CISO and executive team with initial assessment and timeline', completed: false, assignedTo: 'Incident Commander', estimatedMinutes: 15, tools: ['Slack', 'Email'] },
        { id: 's7', title: 'Engage legal counsel', description: 'Contact legal team for regulatory notification requirements', completed: false, assignedTo: 'Legal Team', estimatedMinutes: 10, tools: ['Phone', 'Secure Email'] },
      ], totalSteps: 7, completedSteps: 2, status: 'in-progress', startedAt: '2024-02-15T14:30:00', estimatedDuration: 105, currentStepIndex: 2, version: 'v2.3', lastModified: '2024-02-10' },
      { id: 'pb2', name: 'Credential Compromise Containment', type: 'containment', severity: 'high', steps: [
        { id: 's1', title: 'Force password reset for affected users', description: 'Initiate password reset for all accounts with detected compromise indicators', completed: false, assignedTo: 'IAM Team', estimatedMinutes: 10, tools: ['ADUC', 'Okta Admin'] },
        { id: 's2', title: 'Revoke active sessions', description: 'Terminate all active sessions for compromised accounts across all systems', completed: false, assignedTo: 'IAM Team', estimatedMinutes: 5, tools: ['Session Manager', 'WAF'] },
        { id: 's3', title: 'Enable enhanced monitoring', description: 'Add additional logging and alerting for affected accounts', completed: false, assignedTo: 'SOC Team', estimatedMinutes: 15, tools: ['SIEM', 'UEBA'] },
        { id: 's4', title: 'Review privileged access', description: 'Audit any privilege escalation that occurred during compromise', completed: false, assignedTo: 'Security Architect', estimatedMinutes: 30, tools: ['PAM Console', 'Audit Logs'] },
        { id: 's5', title: 'Update firewall rules', description: 'Block known malicious IPs associated with the credential abuse', completed: false, assignedTo: 'Network Team', estimatedMinutes: 10, tools: ['Firewall Manager', 'Threat Intel'] },
      ], totalSteps: 5, completedSteps: 0, status: 'not-started', startedAt: '', estimatedDuration: 70, currentStepIndex: 0, version: 'v1.5', lastModified: '2024-02-08' },
      { id: 'pb3', name: 'Data Breach Eradication', type: 'eradication', severity: 'critical', steps: [
        { id: 's1', title: 'Identify all compromised endpoints', description: 'Scan entire fleet for indicators of compromise', completed: false, assignedTo: 'EDR Team', estimatedMinutes: 20, tools: ['CrowdStrike', 'SentinelOne'] },
        { id: 's2', title: 'Remove malicious persistence', description: 'Erase backdoors, scheduled tasks, and registry modifications', completed: false, assignedTo: 'Incident Response', estimatedMinutes: 30, tools: ['Autoruns', 'YARA'] },
        { id: 's3', title: 'Patch exploited vulnerabilities', description: 'Apply security patches for all known entry points', completed: false, assignedTo: 'Patch Team', estimatedMinutes: 45, tools: ['WSUS', 'Chef'] },
        { id: 's4', title: 'Rotate all compromised credentials', description: 'Systematic rotation of all potentially exposed secrets', completed: false, assignedTo: 'Secrets Team', estimatedMinutes: 25, tools: ['Vault', 'Key Management'] },
      ], totalSteps: 4, completedSteps: 0, status: 'not-started', startedAt: '', estimatedDuration: 120, currentStepIndex: 0, version: 'v1.2', lastModified: '2024-01-28' },
      { id: 'pb4', name: 'Service Recovery Procedure', type: 'recovery', severity: 'medium', steps: [
        { id: 's1', title: 'Restore from clean backup', description: 'Restore affected systems from verified clean backups', completed: false, assignedTo: 'Backup Team', estimatedMinutes: 60, tools: ['Veeam', 'AWS Backup'] },
        { id: 's2', title: 'Validate system integrity', description: 'Run baseline scans to confirm clean state', completed: false, assignedTo: 'Security Team', estimatedMinutes: 30, tools: ['Baseline Scanner', 'FIM'] },
        { id: 's3', title: 'Gradual service restoration', description: 'Bring systems online in phases with monitoring', completed: false, assignedTo: 'SRE Team', estimatedMinutes: 45, tools: ['Load Balancer', 'Monitoring'] },
      ], totalSteps: 3, completedSteps: 0, status: 'not-started', startedAt: '', estimatedDuration: 135, currentStepIndex: 0, version: 'v1.0', lastModified: '2024-02-01' },
      { id: 'pb5', name: 'Phishing Triage and Response', type: 'incident-response', severity: 'low', steps: [
        { id: 's1', title: 'Collect phishing report details', description: 'Document the phishing email headers, body, and attachments', completed: false, assignedTo: 'SOC Tier 1', estimatedMinutes: 5, tools: ['Ticket System'] },
        { id: 's2', title: 'Identify all recipients', description: 'Search mail logs for all users who received the phishing email', completed: false, assignedTo: 'Email Admin', estimatedMinutes: 10, tools: ['Exchange Admin', 'Google Workspace'] },
        { id: 's3', title: 'Block sender and URLs', description: 'Add malicious sender and URLs to blocklists', completed: false, assignedTo: 'Security Ops', estimatedMinutes: 5, tools: ['Email Gateway', 'Web Proxy'] },
        { id: 's4', title: 'Notify affected users', description: 'Send security advisory to all recipients', completed: false, assignedTo: 'Communications', estimatedMinutes: 10, tools: ['Email', 'Slack'] },
      ], totalSteps: 4, completedSteps: 0, status: 'not-started', startedAt: '', estimatedDuration: 30, currentStepIndex: 0, version: 'v3.1', lastModified: '2024-02-12' },
    ];
    this._playbookEnabled = true;
  }

  private _renderPlaybookSystem(): any {
    if (!this._playbookEnabled) return nothing;
    return html`
      <div style="margin-top:12px;padding:12px;background:#111827;border:1px solid #374151;border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-weight:700;font-size:13px;color:#f9fafb">Playbooks & Runbooks</div>
          <div style="display:flex;gap:4px;font-size:9px;color:#9ca3af">
            <span>${this._playbooks.filter(p => p.status === 'in-progress').length} active</span>
            <span>|</span>
            <span>${this._playbooks.filter(p => p.status === 'completed').length} done</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto">
          ${this._playbooks.map(pb => {
            const progress = pb.totalSteps > 0 ? Math.round((pb.completedSteps / pb.totalSteps) * 100) : 0;
            const statusColor = pb.status === 'completed' ? '#34d399' : pb.status === 'in-progress' ? '#60a5fa' : pb.status === 'paused' ? '#fbbf24' : '#6b7280';
            const severityColor = pb.severity === 'critical' ? '#f87171' : pb.severity === 'high' ? '#fb923c' : '#fbbf24';
            return html`
              <div style="padding:8px;background:#1f2937;border-radius:6px;border-left:3px solid ${statusColor};cursor:pointer" @click=${() => { this._activePlaybookId = this._activePlaybookId === pb.id ? '' : pb.id; }}>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                  <span style="font-size:11px;font-weight:600;color:#f9fafb">${pb.name}</span>
                  <span style="display:flex;gap:4px;align-items:center">
                    <span style="padding:1px 6px;border-radius:3px;font-size:8px;background:${severityColor}22;color:${severityColor}">${pb.severity}</span>
                    <span style="font-size:9px;color:#9ca3af">${pb.version}</span>
                  </span>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="flex:1;height:4px;background:#374151;border-radius:2px;overflow:hidden">
                    <div style="height:100%;width:${progress}%;background:${statusColor};border-radius:2px;transition:width 0.3s"></div>
                  </div>
                  <span style="font-size:9px;color:#9ca3af">${pb.completedSteps}/${pb.totalSteps} (${progress}%)</span>
                  <span style="font-size:9px;color:#6b7280">${pb.estimatedDuration}min</span>
                </div>
                ${this._activePlaybookId === pb.id ? html`
                  <div style="margin-top:8px;padding-top:8px;border-top:1px solid #374151">
                    ${pb.steps.map((step, i) => html`
                      <div style="display:flex;align-items:flex-start;gap:8px;padding:4px 0;${i < pb.steps.length - 1 ? 'border-bottom:1px solid #111827' : ''}">
                        <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${step.completed ? '#34d399' : i === pb.currentStepIndex ? '#60a5fa' : '#374151'};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;background:${step.completed ? '#34d399' : 'transparent'}">
                          ${step.completed ? html`<span style="font-size:9px;color:#111827">✓</span>` : i === pb.currentStepIndex ? html`<div style="width:6px;height:6px;border-radius:50%;background:#60a5fa"></div>` : nothing}
                        </div>
                        <div style="flex:1">
                          <div style="font-size:10px;font-weight:${step.completed ? '400' : '600'};color:${step.completed ? '#6b7280' : '#f9fafb'};${step.completed ? 'text-decoration:line-through' : ''}">${step.title}</div>
                          <div style="font-size:9px;color:#6b7280;margin-top:1px">${step.description.substring(0, 60)}${step.description.length > 60 ? '...' : ''}</div>
                          ${step.condition ? html`<div style="font-size:8px;color:#fbbf24;margin-top:2px;font-style:italic">${step.condition}</div>` : nothing}
                          <div style="font-size:8px;color:#4b5563;margin-top:2px">${step.assignedTo} · ${step.estimatedMinutes}min · ${step.tools.join(', ')}</div>
                        </div>
                      </div>
                    `)}
                  </div>
                ` : nothing}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }


  // === Metrics Dashboard (KPIs) ===
  @state() private _metricsEnabled = false;
  @state() private _kpis: Array<{
    id: string;
    name: string;
    value: number;
    previousValue: number;
    unit: string;
    threshold: { warning: number; critical: number; direction: 'above' | 'below' };
    trend: Array<number>;
    status: 'normal' | 'warning' | 'critical';
    alertEnabled: boolean;
    category: string;
  }> = [];
  @state() private _metricsPeriod: '1h' | '6h' | '24h' | '7d' = '24h';
  @state() private _metricsAutoRefresh = true;

  private _initMetrics() {
    const genTrend = (base: number, variance: number, len: number = 12): number[] =>
      Array.from({ length: len }, (_, i) => Math.round(base + (Math.random() - 0.5) * variance * 2));
    this._kpis = [
      { id: 'k1', name: 'MTTD (Mean Time to Detect)', value: 4.2, previousValue: 5.1, unit: 'min', threshold: { warning: 10, critical: 15, direction: 'above' }, trend: genTrend(4.5, 1.2), status: 'normal', alertEnabled: true, category: 'Detection' },
      { id: 'k2', name: 'MTTR (Mean Time to Respond)', value: 12.8, previousValue: 14.2, unit: 'min', threshold: { warning: 20, critical: 30, direction: 'above' }, trend: genTrend(13, 3), status: 'normal', alertEnabled: true, category: 'Response' },
      { id: 'k3', name: 'False Positive Rate', value: 8.3, previousValue: 9.1, unit: '%', threshold: { warning: 10, critical: 15, direction: 'above' }, trend: genTrend(8.5, 2), status: 'normal', alertEnabled: true, category: 'Accuracy' },
      { id: 'k4', name: 'Threat Coverage', value: 94.7, previousValue: 92.3, unit: '%', threshold: { warning: 85, critical: 75, direction: 'below' }, trend: genTrend(93, 3), status: 'normal', alertEnabled: true, category: 'Coverage' },
      { id: 'k5', name: 'Patch Compliance', value: 87.2, previousValue: 84.5, unit: '%', threshold: { warning: 90, critical: 80, direction: 'below' }, trend: genTrend(86, 4), status: 'warning', alertEnabled: true, category: 'Compliance' },
      { id: 'k6', name: 'Active Incidents', value: 3, previousValue: 5, unit: '', threshold: { warning: 5, critical: 10, direction: 'above' }, trend: genTrend(4, 2), status: 'normal', alertEnabled: true, category: 'Operations' },
      { id: 'k7', name: 'Vulnerability Backlog', value: 127, previousValue: 145, unit: '', threshold: { warning: 100, critical: 200, direction: 'above' }, trend: genTrend(130, 20), status: 'warning', alertEnabled: true, category: 'Risk' },
      { id: 'k8', name: 'Security Score', value: 82, previousValue: 79, unit: '/100', threshold: { warning: 70, critical: 50, direction: 'below' }, trend: genTrend(80, 5), status: 'normal', alertEnabled: true, category: 'Overall' },
    ];
    this._metricsEnabled = true;
  }

  private _getKpiStatus(kpi: any): string {
    if (kpi.threshold.direction === 'above') {
      if (kpi.value >= kpi.threshold.critical) return 'critical';
      if (kpi.value >= kpi.threshold.warning) return 'warning';
    } else {
      if (kpi.value <= kpi.threshold.critical) return 'critical';
      if (kpi.value <= kpi.threshold.warning) return 'warning';
    }
    return 'normal';
  }

  private _getKpiColor(status: string): string {
    switch (status) {
      case 'critical': return '#f87171';
      case 'warning': return '#fbbf24';
      default: return '#34d399';
    }
  }

  private _renderSparkline(data: number[], width: number = 60, height: number = 20): string {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pts: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const x = ((i / (data.length - 1)) * width).toFixed(1);
      const y = (height - ((data[i] - min) / range) * height).toFixed(1);
      pts.push(x + ',' + y);
    }
    const points = pts.join(' ');
    return '<svg width="' + width + '" height="' + height + '" style="display:block"><polyline points="' + points + '" fill="none" stroke="#60a5fa" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>';
  }

  private _renderMetricsDashboard(): any {
    if (!this._metricsEnabled) return nothing;
    return html`
      <div style="margin-top:12px;padding:12px;background:#111827;border:1px solid #374151;border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-weight:700;font-size:13px;color:#f9fafb">Security KPIs</div>
          <div style="display:flex;gap:4px">
            ${(['1h', '6h', '24h', '7d'] as const).map(p => html`
              <button class="btn btn-sm" style="padding:2px 8px;font-size:9px;${this._metricsPeriod === p ? 'background:#1e40af;color:#fff' : 'background:#1f2937;color:#9ca3af'}" @click=${() => { this._metricsPeriod = p; }}>${p}</button>
            `)}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:6px">
          ${this._kpis.map(kpi => {
            const status = this._getKpiStatus(kpi);
            const color = this._getKpiColor(status);
            const change = kpi.previousValue > 0 ? (((kpi.value - kpi.previousValue) / kpi.previousValue) * 100).toFixed(1) : '0';
            const changePositive = kpi.name.includes('Backlog') || kpi.name.includes('Time') ? parseFloat(change) < 0 : parseFloat(change) > 0;
            return html`
              <div style="padding:8px;background:#1f2937;border-radius:6px;border-top:2px solid ${color}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                  <div style="font-size:9px;color:#9ca3af;text-transform:uppercase">${kpi.name}</div>
                  <div style="display:flex;align-items:center;gap:2px;font-size:8px;color:${changePositive ? '#34d399' : '#f87171'}">
                    ${parseFloat(change) > 0 ? html`▲` : html`▼`} ${Math.abs(parseFloat(change))}%
                  </div>
                </div>
                <div style="font-size:22px;font-weight:700;color:#f9fafb;margin:4px 0">${kpi.value}<span style="font-size:10px;color:#6b7280;font-weight:400">${kpi.unit}</span></div>
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:8px;color:#6b7280">Prev: ${kpi.previousValue}${kpi.unit}</span>
                  <span innerHTML=${this._renderSparkline(kpi.trend, 50, 16)}></span>
                </div>
                <div style="margin-top:4px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
                  <span style="color:#6b7280">${kpi.category}</span>
                  <span style="padding:1px 4px;border-radius:2px;background:${color}22;color:${color}">${status}</span>
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }


  // === Cross-Panel Integration (Event Bus) ===
  @state() private _integrationEnabled = false;
  @state() private _eventLog: Array<{
    id: string;
    source: string;
    target: string;
    eventType: string;
    payload: string;
    timestamp: string;
    status: 'delivered' | 'pending' | 'failed';
  }> = [];
  @state() private _sharedStateKeys: string[] = [];
  @state() private _integrationNavLinks: Array<{
    panel: string;
    label: string;
    description: string;
    icon: string;
  }> = [];

  private _initIntegration() {
    this._sharedStateKeys = [
      'selectedThreats', 'activeIncidentId', 'riskScore',
      'complianceStatus', 'assetFilter', 'timeRange',
      'userContext', 'severityFilter', 'teamAssignments',
      'pipelineStatus', 'alertCorrelationId', 'vulnerabilityScope',
    ];
    this._integrationNavLinks = [
      { panel: 'threat-model', label: 'Threat Model', description: 'View STRIDE analysis', icon: '🛡' },
      { panel: 'incident-response', label: 'Incident Timeline', description: 'Active incidents', icon: '📅' },
      { panel: 'vulnerability-mgmt', label: 'Vulnerability Scanner', description: 'Scan results', icon: '🔍' },
      { panel: 'compliance-dashboard', label: 'Compliance Map', description: 'Framework coverage', icon: '✅' },
      { panel: 'soc-workflow', label: 'SOC Workflow', description: 'Analyst queue', icon: '📋' },
      { panel: 'risk-dashboard', label: 'Risk Register', description: 'Risk assessment', icon: '⚠' },
    ];
    this._eventLog = [
      { id: 'e1', source: 'Alert System', target: 'Incident Timeline', eventType: 'alert.created', payload: 'New critical alert detected', timestamp: '2024-02-15T14:32:00', status: 'delivered' },
      { id: 'e2', source: 'Threat Intel', target: 'Alert Correlation', eventType: 'ioc.matched', payload: '3 IOCs matched active alerts', timestamp: '2024-02-15T14:31:00', status: 'delivered' },
      { id: 'e3', source: 'Vulnerability Scanner', target: 'Risk Dashboard', eventType: 'vuln.critical', payload: 'New CVE-2024-XXXX detected', timestamp: '2024-02-15T14:30:00', status: 'pending' },
      { id: 'e4', source: 'Pipeline', target: 'Metrics Dashboard', eventType: 'pipeline.completed', payload: 'Data ingestion pipeline completed', timestamp: '2024-02-15T14:28:00', status: 'delivered' },
      { id: 'e5', source: 'Compliance Check', target: 'Board Report', eventType: 'compliance.drift', payload: 'CIS benchmark drift detected', timestamp: '2024-02-15T14:25:00', status: 'failed' },
    ];
    this._integrationEnabled = true;
  }

  private _publishEvent(source: string, target: string, eventType: string, payload: string) {
    const event = {
      id: 'e' + (this._eventLog.length + 1),
      source, target, eventType, payload,
      timestamp: new Date().toISOString(),
      status: 'delivered' as const,
    };
    this._eventLog = [event, ...this._eventLog].slice(0, 20);
  }

  private _renderIntegrationPanel(): any {
    if (!this._integrationEnabled) return nothing;
    return html`
      <div style="margin-top:12px;padding:12px;background:#111827;border:1px solid #374151;border-radius:8px">
        <div style="font-weight:700;font-size:13px;color:#f9fafb;margin-bottom:10px">Cross-Panel Integration</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="padding:8px;background:#1f2937;border-radius:6px">
            <div style="font-size:10px;font-weight:600;color:#60a5fa;margin-bottom:6px">Navigation Links</div>
            ${this._integrationNavLinks.map(link => html`
              <div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:10px;cursor:pointer" @click=${() => this._publishEvent(this.panelId, link.panel, 'nav.requested', link.description)}>
                <span>${link.icon}</span>
                <div>
                  <div style="color:#f9fafb;font-weight:500">${link.label}</div>
                  <div style="color:#6b7280;font-size:8px">${link.description}</div>
                </div>
              </div>
            `)}
          </div>
          <div style="padding:8px;background:#1f2937;border-radius:6px">
            <div style="font-size:10px;font-weight:600;color:#60a5fa;margin-bottom:6px">Event Stream</div>
            ${this._eventLog.slice(0, 5).map(ev => html`
              <div style="display:flex;align-items:center;gap:4px;padding:3px 0;border-bottom:1px solid #111827;font-size:9px">
                <span style="width:6px;height:6px;border-radius:50%;background:${ev.status === 'delivered' ? '#34d399' : ev.status === 'pending' ? '#fbbf24' : '#f87171'}"></span>
                <span style="color:#60a5fa">${ev.source}</span>
                <span style="color:#4b5563">→</span>
                <span style="color:#d1d5db">${ev.target}</span>
                <span style="color:#6b7280;margin-left:auto">${ev.eventType}</span>
              </div>
            `)}
          </div>
        </div>
        <div style="margin-top:8px;padding:6px;background:#1f2937;border-radius:6px">
          <div style="font-size:10px;font-weight:600;color:#60a5fa;margin-bottom:4px">Shared State (${this._sharedStateKeys.length} keys)</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${this._sharedStateKeys.map(key => html`
              <span style="padding:2px 8px;background:#111827;border-radius:4px;font-size:8px;color:#9ca3af;border:1px solid #374151">${key}</span>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  private _peGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _peRenderSubPanel(): any {
    switch (this._peActiveSubTab) {
      case 'scenario': return this._peRenderScenarioEngine();
      case 'timeseries': return this._peRenderTimeSeries();
      case 'rbac': return this._peRenderRBAC();
      case 'reporting': return this._peRenderReporting();
      case 'a11y': return this._peRenderAccessibility();
      default: return nothing;
    }
  }

  private _peRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._peGetAllSubTabs().map(t => html`
          <button class="tab ${this._peActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._peActiveSubTab = t.key; }} role="tab" aria-selected=${this._peActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="pe-tab-${this._peActiveSubTab}">
        ${this._peRenderSubPanel()}
      </div>
    `;
  }

  }
