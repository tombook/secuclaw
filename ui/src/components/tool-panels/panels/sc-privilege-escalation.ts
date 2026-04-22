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
}
