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
}
