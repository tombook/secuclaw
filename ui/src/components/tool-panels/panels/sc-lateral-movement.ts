/**
 * sc-lateral-movement.ts - Advanced Lateral Movement Toolkit (Security Ops Dark Capability)
 * Network topology discovery, credential management, pivot target analysis,
 * path planning with risk scoring, execution simulation, technique catalog,
 * detection evasion assessment, history tracking, and comprehensive reporting
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

type MoveStatus = 'idle' | 'recon' | 'planning' | 'executing' | 'success' | 'failed';
type CredType = 'hash' | 'plaintext' | 'ticket' | 'key' | 'token' | 'certificate';
type MoveMethod = 'pass-the-hash' | 'pass-the-ticket' | 'ssh-key' | 'wmi-exec' | 'ps-exec' | 'rdp' | 'winrm' | 'dcom' | 'psexec' | 'smb-exec' | 'crackmapexec' | 'impacket';
type OSType = 'windows' | 'linux' | 'macos';
type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface Cred {
  id: string; username: string; password: string; domain: string; source: string;
  type: CredType; privilege: 'user' | 'admin' | 'system' | 'domain-admin'; valid: boolean;
}

interface PivotTarget {
  id: string; host: string; ip: string; os: OSType; role: string;
  services: { name: string; port: number; version: string; vuln: boolean }[];
  credentials: string[]; compromised: boolean; detectionRisk: number;
  zone: string; lastScan: string;
}

interface MovePath {
  id: string; name: string; steps: { from: string; to: string; method: MoveMethod; cred: string; risk: number; estimatedTime: string }[];
  totalRisk: number; totalSteps: number; recommended: boolean;
}

interface Technique {
  id: string; name: string; platform: OSType[]; method: MoveMethod;
  description: string; requirements: string[]; detectionRisk: number;
  mitreId: string; tools: string[]; steps: string[];
  detectabilityByTool: { tool: string; detectable: boolean; confidence: number }[];
}

interface MoveResult {
  id: string; target: PivotTarget; status: 'success' | 'failed'; startedAt: string;
  completedAt: string; method: MoveMethod; credential: Cred | null;
  output: string[]; detectionRisk: number; artifacts: string[];
}

const TECHNIQUES: Technique[] = [
  { id: 't1', name: 'Pass-the-Hash (SMB)', platform: ['windows'], method: 'pass-the-hash', description: 'Authenticate to remote Windows system using NTLM hash without cracking', requirements: ['NTLM hash', 'SMB access (445)', 'Administrative share access'], detectionRisk: 40, mitreId: 'T1550.002', tools: ['Impacket', 'CrackMapExec', 'Mimikatz'], steps: ['Dump NTLM hash from LSASS or SAM', 'Use hash with SMB authentication', 'Access ADMIN$ share', 'Execute payload via service creation'], detectabilityByTool: [{ tool: 'Windows Security Logs', detectable: true, confidence: 70 }, { tool: 'EDR', detectable: true, confidence: 80 }, { tool: 'Network IDS', detectable: false, confidence: 20 }] },
  { id: 't2', name: 'Kerberoasting + Crack', platform: ['windows'], method: 'pass-the-ticket', description: 'Request service tickets and crack offline to obtain service account passwords', requirements: ['Domain user account', 'Kerberos TGT', 'SPN enumeration'], detectionRisk: 50, mitreId: 'T1558.003', tools: ['Rubeus', 'Impacket', 'Kekeo'], steps: ['Enumerate SPNs via LDAP', 'Request service tickets (TGS)', 'Extract tickets from memory', 'Crack with hashcat offline'], detectabilityByTool: [{ tool: 'Domain Controller Logs', detectable: true, confidence: 75 }, { tool: 'SIEM', detectable: true, confidence: 65 }] },
  { id: 't3', name: 'SSH Key Theft', platform: ['linux', 'macos'], method: 'ssh-key', description: 'Steal SSH private keys and use them to authenticate to remote systems', requirements: ['SSH private key file', 'Target allows key auth', 'Key not passphrase protected'], detectionRisk: 30, mitreId: 'T1021.004', tools: ['ssh', 'Paramiko', 'Impacket'], steps: ['Locate SSH keys in ~/.ssh/', 'Copy private key files', 'Test key authentication to targets', 'Establish SSH session'], detectabilityByTool: [{ tool: 'SSH logs', detectable: true, confidence: 60 }, { tool: 'File integrity monitoring', detectable: true, confidence: 70 }] },
  { id: 't4', name: 'WMI Remote Execution', platform: ['windows'], method: 'wmi-exec', description: 'Use Windows Management Instrumentation for remote command execution', requirements: ['WMI access (135)', 'Administrative credentials', 'DCOM enabled'], detectionRisk: 55, mitreId: 'T1047', tools: ['WMI', 'CIMStudio', 'SharpWMI'], steps: ['Connect to WMI namespace', 'Create process via Win32_Process', 'Execute payload remotely', 'Retrieve output via event subscription'], detectabilityByTool: [{ tool: 'Windows Event Logs', detectable: true, confidence: 80 }, { tool: 'EDR', detectable: true, confidence: 75 }] },
  { id: 't5', name: 'PSExec / SMB Exec', platform: ['windows'], method: 'psexec', description: 'Execute binaries on remote systems via SMB ADMIN$ share', requirements: ['SMB access (445)', 'Admin credentials', 'ADMIN$ share writable'], detectionRisk: 65, mitreId: 'T1021.002', tools: ['PSExec', 'Impacket psexec', 'CrackMapExec'], steps: ['Upload payload to ADMIN$ share', 'Create service pointing to payload', 'Start service remotely', 'Clean up service and payload'], detectabilityByTool: [{ tool: 'Windows Security Logs', detectable: true, confidence: 90 }, { tool: 'EDR', detectable: true, confidence: 85 }, { tool: 'Network IDS', detectable: true, confidence: 50 }] },
  { id: 't6', name: 'RDP Hijacking', platform: ['windows'], method: 'rdp', description: 'Take over existing RDP sessions or create new ones for lateral movement', requirements: ['RDP access (3389)', 'Session hijacking capability', 'tscon.exe access'], detectionRisk: 45, mitreId: 'T1021.001', tools: ['RDP', 'tscon', 'xFreerDP', 'SharpRDP'], steps: ['Enumerate active RDP sessions', 'Hijack existing session or create new', 'Execute commands in RDP context', 'Maintain persistence via RDP'], detectabilityByTool: [{ tool: 'RDP logs', detectable: true, confidence: 70 }, { tool: 'EDR', detectable: true, confidence: 65 }] },
  { id: 't7', name: 'WinRM Remote Execution', platform: ['windows'], method: 'winrm', description: 'Use Windows Remote Management for PowerShell remoting', requirements: ['WinRM enabled (5985/5986)', 'Admin credentials', 'PowerShell remoting configured'], detectionRisk: 50, mitreId: 'T1021.006', tools: ['PowerShell', 'Enter-PSSession', 'Invoke-Command', 'Evil-WinRM'], steps: ['Establish WinRM session', 'Execute PowerShell commands remotely', 'Run scripts via Invoke-Command', 'Maintain session for persistence'], detectabilityByTool: [{ tool: 'WinRM logs', detectable: true, confidence: 80 }, { tool: 'PowerShell logging', detectable: true, confidence: 70 }] },
  { id: 't8', name: 'DCOM Remote Activation', platform: ['windows'], method: 'dcom', description: 'Use DCOM for remote instantiation and method execution', requirements: ['DCOM access', 'Admin credentials', 'Target DCOM object permissions'], detectionRisk: 35, mitreId: 'T1021.003', tools: ['PowerShell', 'ComObj', 'SharpCOM'], steps: ['Instantiate remote DCOM object', 'Execute method on remote object', 'Leverage MMC20.Application or ShellBrowserWindow', 'Execute payload via DCOM'], detectabilityByTool: [{ tool: 'DCOM logs', detectable: true, confidence: 55 }, { tool: 'EDR', detectable: true, confidence: 60 }] },
];

@customElement('sc-lateral-movement')
export class ScLateralMovement extends LitElement {
  @property({ type: String }) panelId = 'lateral-movement';
  @state() private _status: MoveStatus = 'idle';
  @state() private _progress = 0;
  @state() private _credentials: Cred[] = [];
  @state() private _targets: PivotTarget[] = [];
  @state() private _paths: MovePath[] = [];
  @state() private _results: MoveResult[] = [];
  @state() private _output: string[] = [];
  @state() private _activeTab: 'creds' | 'topology' | 'paths' | 'techniques' | 'execute' | 'history' = 'creds';
  @state() private _newCredUser = '';
  @state() private _newCredPass = '';
  @state() private _newCredDomain = '';
  @state() private _newCredType: CredType = 'plaintext';
  @state() private _selectedTarget: PivotTarget | null = null;
  @state() private _expandedTechnique: string | null = null;

  @state() private _showExport = false;
  @state() private _showApproval = false;
  @state() private _selectedForBatch: Set<string> = new Set();
  @state() private _showRiskScoring = false;
  // Enhanced features
  @state() private _auditTrail: Array<{id:string;timestamp:string;action:string;user:string;details:string;category:string}> = [];
  @state() private _auditFilter = 'all';
  @state() private _execHistory: Array<{id:string;timestamp:string;itemsScanned:number;findings:number;criticalCount:number;duration:number;status:string}> = [];
  @state() private _execRunning = false;
  @state() private _execProgress = 0;
  @state() private _settingsTab: string = 'general';
  @state() private _autoInterval = 24;
  @state() private _criticalThreshold = 3;
  @state() private _escalationEmail = '';
  @state() private _webhookUrl = '';
  @state() private _slaTargetHours = 72;
  @state() private _tablePage = 0;
  @state() private _tablePageSize = 10;
  @state() private _showEnhanced = false;


  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #0f1117); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
    .title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #2a2d3a; flex-wrap: wrap; }
    .tab { padding: 8px 16px; cursor: pointer; border: none; background: none; color: #6b7280; font-size: 13px; font-weight: 500; border-bottom: 2px solid transparent; }
    .tab:hover { color: #d1d5db; }
    .tab.active { color: #e2e8f0; border-bottom-color: #3b82f6; }
    .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }
    .btn-secondary { background: #374151; color: #d1d5db; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-sm { padding: 4px 10px; font-size: 11px; }
    .btn-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    label { font-size: 12px; color: #9ca3af; font-weight: 500; }
    input, select { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 6px; padding: 8px 12px; color: #e2e8f0; font-size: 13px; outline: none; font-family: inherit; }
    input:focus, select:focus { border-color: #3b82f6; }
    .progress-bar { width: 100%; height: 6px; background: #1a1d27; border-radius: 3px; overflow: hidden; margin-bottom: 12px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 3px; transition: width 0.3s; }
    .cred-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .cred-table th { text-align: left; padding: 8px 10px; background: #1a1d27; color: #9ca3af; font-weight: 600; border-bottom: 1px solid #2a2d3a; }
    .cred-table td { padding: 8px 10px; border-bottom: 1px solid #1a1d27; }
    .target-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .target-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.2s; }
    .target-card:hover { border-color: #3b82f6; }
    .target-card.compromised { border-color: #34d399; }
    .target-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .target-meta { font-size: 11px; color: #9ca3af; }
    .tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #374151; color: #d1d5db; }
    .tag-vuln { background: #3a1e1e; color: #f87171; }
    .tag-safe { background: #1e3a2f; color: #34d399; }
    .path-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 3px solid #f59e0b; }
    .path-card.recommended { border-left-color: #34d399; }
    .path-name { font-weight: 600; font-size: 13px; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    .path-step { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 12px; }
    .path-arrow { color: #6b7280; }
    .output-box { background: #0a0c10; border: 1px solid #1a1d27; border-radius: 8px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.6; max-height: 350px; overflow-y: auto; white-space: pre-wrap; }
    .output-info { color: #60a5fa; }
    .output-success { color: #34d399; }
    .output-error { color: #f87171; }
    .output-warn { color: #fbbf24; }
    .technique-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
    .technique-card:hover { border-color: #3b82f6; }
    .technique-name { font-weight: 600; font-size: 13px; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; }
    .technique-desc { font-size: 12px; color: #9ca3af; margin-bottom: 6px; }
    .detail-panel { background: #0f1117; border: 1px solid #2a2d3a; border-radius: 8px; padding: 14px; margin-top: 8px; }
    .detail-title { font-weight: 700; font-size: 13px; margin-bottom: 8px; }
    .step-item { padding: 3px 0; font-size: 12px; color: #d1d5db; }
    .step-num { color: #60a5fa; font-weight: 600; margin-right: 6px; }
    .tool-bar { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 12px; }
    .tool-name { min-width: 140px; font-weight: 600; }
    .tool-bar-track { flex: 1; height: 5px; background: #0f1117; border-radius: 3px; overflow: hidden; }
    .tool-bar-fill { height: 100%; border-radius: 3px; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .stat { background: #1a1d27; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-value { font-size: 22px; font-weight: 700; }
    .stat-label { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr 1fr; } .target-grid { grid-template-columns: 1fr; } .stat-grid { grid-template-columns: repeat(2, 1fr); } }

    .wizard-num { width: 24px; height: 24px; border-radius: 50%; background: #374151; color: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .wizard-num.active { background: #8b5cf6; }
    .wizard-num.done { background: #22c55e; }
    .mitre-tag { display: inline-block; font-size: 9px; padding: 1px 5px; border-radius: 3px; background: #312e81; color: #a5b4fc; margin-right: 3px; }
    .export-panel { background: #0f172a; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .export-btn { padding: 8px 16px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 11px; font-weight: 600; cursor: pointer; margin-right: 6px; }
    .export-btn:hover { border-color: #8b5cf6; background: #8b5cf620; }
    .risk-bar-track { flex: 1; height: 6px; background: #1f2937; border-radius: 3px; overflow: hidden; }
    .risk-bar-fill { height: 100%; border-radius: 3px; }
    .cb { width: 14px; height: 14px; accent-color: #8b5cf6; cursor: pointer; }
    .batch-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #1e1b4b; border-radius: 8px; margin-bottom: 10px; font-size: 11px; }
    .batch-bar button { padding: 4px 12px; border-radius: 5px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 10px; font-weight: 600; cursor: pointer; }
    .batch-bar button:hover { background: #8b5cf630; border-color: #8b5cf6; }
    .approval-modal { background: #0f172a; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .heatmap-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
    .heatmap-cell { width: 100%; aspect-ratio: 1; border-radius: 3px; }
    .sla-bar { display: flex; align-items: center; gap: 12px; background: #1f2937; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
    .sla-indicator { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  `;

  private _addCredential(): void {
    if (!this._newCredUser) return;
    this._credentials = [...this._credentials, {
      id: 'CR-' + Date.now(), username: this._newCredUser, password: this._newCredPass || '(none)',
      domain: this._newCredDomain || 'WORKGROUP', source: 'Manual input', type: this._newCredType,
      privilege: 'user', valid: Math.random() > 0.2,
    }];
    this._newCredUser = ''; this._newCredPass = ''; this._newCredDomain = '';
  }

  private _discoverNetwork(): void {
    this._status = 'recon'; this._progress = 0;
    this._targets = [
      { id: 'T1', host: 'DC01', ip: '10.0.1.10', os: 'windows', role: 'Domain Controller', services: [{ name: 'LDAP', port: 389, version: 'Active Directory', vuln: false }, { name: 'Kerberos', port: 88, version: 'KDC', vuln: false }, { name: 'SMB', port: 445, version: 'SMB 3.1.1', vuln: true }, { name: 'DNS', port: 53, version: 'Microsoft DNS', vuln: false }], credentials: [], compromised: false, detectionRisk: 75, zone: 'restricted', lastScan: new Date().toISOString() },
      { id: 'T2', host: 'FS01', ip: '10.0.1.50', os: 'windows', role: 'File Server', services: [{ name: 'SMB', port: 445, version: 'SMB 3.0', vuln: true }, { name: 'RPC', port: 135, version: 'Microsoft RPC', vuln: false }], credentials: [], compromised: false, detectionRisk: 45, zone: 'internal', lastScan: new Date().toISOString() },
      { id: 'T3', host: 'WEB01', ip: '10.0.2.10', os: 'linux', role: 'Web Server', services: [{ name: 'SSH', port: 22, version: 'OpenSSH 8.9', vuln: false }, { name: 'NGINX', port: 443, version: 'nginx/1.22', vuln: true }, { name: 'MySQL', port: 3306, version: 'MySQL 8.0', vuln: false }], credentials: [], compromised: false, detectionRisk: 55, zone: 'dmz', lastScan: new Date().toISOString() },
      { id: 'T4', host: 'DB01', ip: '10.0.2.20', os: 'linux', role: 'Database Server', services: [{ name: 'SSH', port: 22, version: 'OpenSSH 9.0', vuln: false }, { name: 'PostgreSQL', port: 5432, version: 'PostgreSQL 15', vuln: false }], credentials: [], compromised: false, detectionRisk: 65, zone: 'restricted', lastScan: new Date().toISOString() },
      { id: 'T5', host: 'DEV01', ip: '10.0.1.100', os: 'windows', role: 'Developer Workstation', services: [{ name: 'RDP', port: 3389, version: 'RDP 10', vuln: true }, { name: 'SMB', port: 445, version: 'SMB 3.1.1', vuln: true }, { name: 'WinRM', port: 5985, version: 'WinRM 2.0', vuln: false }], credentials: [], compromised: false, detectionRisk: 35, zone: 'internal', lastScan: new Date().toISOString() },
      { id: 'T6', host: 'CI01', ip: '10.0.1.200', os: 'linux', role: 'CI/CD Runner', services: [{ name: 'SSH', port: 22, version: 'OpenSSH 8.4', vuln: false }, { name: 'Docker', port: 2376, version: 'Docker 24.0', vuln: true }, { name: 'GitLab Runner', port: 8093, version: '15.x', vuln: false }], credentials: [], compromised: false, detectionRisk: 50, zone: 'internal', lastScan: new Date().toISOString() },
      { id: 'T7', host: 'EXCH01', ip: '10.0.1.20', os: 'windows', role: 'Exchange Server', services: [{ name: 'HTTPS', port: 443, version: 'Exchange 2019 CU12', vuln: true }, { name: 'SMB', port: 445, version: 'SMB 3.1.1', vuln: true }, { name: 'RPC', port: 135, version: 'Microsoft RPC', vuln: false }], credentials: [], compromised: false, detectionRisk: 60, zone: 'restricted', lastScan: new Date().toISOString() },
      { id: 'T8', host: 'LOG01', ip: '10.0.1.30', os: 'linux', role: 'SIEM Server', services: [{ name: 'SSH', port: 22, version: 'OpenSSH 9.1', vuln: false }, { name: 'Elastic', port: 9200, version: 'Elasticsearch 8.x', vuln: false }, { name: 'Kibana', port: 5601, version: 'Kibana 8.x', vuln: true }], credentials: [], compromised: false, detectionRisk: 70, zone: 'restricted', lastScan: new Date().toISOString() },
    ];
    this._paths = [
      { id: 'P1', name: 'Workstation -> File Server -> Domain Controller', recommended: false, steps: [{ from: 'DEV01', to: 'FS01', method: 'pass-the-hash', cred: 'admin_hash', risk: 40, estimatedTime: '30s' }, { from: 'FS01', to: 'DC01', method: 'pass-the-ticket', cred: 'svc_sql_ticket', risk: 65, estimatedTime: '2m' }], totalRisk: 55, totalSteps: 2 },
      { id: 'P2', name: 'Workstation -> Web Server -> Database (Linux)', recommended: true, steps: [{ from: 'DEV01', to: 'WEB01', method: 'ssh-key', cred: 'ssh_key', risk: 35, estimatedTime: '15s' }, { from: 'WEB01', to: 'DB01', method: 'ssh-key', cred: 'db_ssh_key', risk: 50, estimatedTime: '20s' }], totalRisk: 42, totalSteps: 2 },
      { id: 'P3', name: 'Workstation -> CI/CD -> Cloud Infrastructure', recommended: false, steps: [{ from: 'DEV01', to: 'CI01', method: 'ssh-key', cred: 'ci_ssh_key', risk: 35, estimatedTime: '15s' }, { from: 'CI01', to: 'Cloud', method: 'ssh-key', cred: 'cloud_api_key', risk: 70, estimatedTime: '45s' }], totalRisk: 55, totalSteps: 2 },
      { id: 'P4', name: 'Workstation -> Exchange -> Domain Controller', recommended: false, steps: [{ from: 'DEV01', to: 'EXCH01', method: 'pass-the-hash', cred: 'exchange_hash', risk: 45, estimatedTime: '30s' }, { from: 'EXCH01', to: 'DC01', method: 'dcom', cred: 'exchange_priv', risk: 55, estimatedTime: '1m' }], totalRisk: 50, totalSteps: 2 },
    ].sort((a, b) => a.totalRisk - b.totalRisk);

    let p = 0;
    const iv = setInterval(() => {
      p += 10; this._progress = Math.min(p, 100);
      if (p >= 100) { clearInterval(iv); this._status = 'idle'; this._activeTab = 'topology'; }
    }, 150);
  }

  private _executeMove(target: PivotTarget): void {
    if (target.compromised) return;
    this._status = 'executing'; this._progress = 0; this._output = [];
    const lines: string[] = [];
    lines.push(`[*] Initiating lateral movement to ${target.host} (${target.ip})`);
    lines.push(`[*] Target OS: ${target.os} | Role: ${target.role} | Zone: ${target.zone}`);
    const cred = this._credentials.length > 0 ? this._credentials.find(c => c.valid) || this._credentials[0] : null;
    if (cred) {
      lines.push(`[*] Using credential: ${cred.username}@${cred.domain} (${cred.type}) - ${cred.privilege}`);
    } else {
      lines.push('[!] No valid credentials available, attempting anonymous methods');
    }
    const technique = TECHNIQUES.find(t => t.platform.includes(target.os)) || TECHNIQUES[0];
    lines.push(`[*] Selected technique: ${technique.name} (${technique.mitreId})`);
    lines.push(`[*] Detection risk: ${technique.detectionRisk}% | Tools: ${technique.tools.join(', ')}`);
    lines.push('');

    const steps = technique.steps.map((s, i) => `[${i + 1}/${technique.steps.length}] ${s}`);
    let i = 0;
    const run = () => {
      if (i >= steps.length) {
        const success = Math.random() > 0.25;
        if (success) {
          lines.push(''); lines.push('[+] LATERAL MOVEMENT SUCCESSFUL');
          lines.push(`[+] Access obtained to ${target.host}`);
          lines.push(`[+] Method: ${technique.name}`);
          lines.push(`[+] Artifacts: Service created, logs generated`);
          target.compromised = true;
          this._targets = [...this._targets];
          this._results = [...this._results, {
            id: 'MR-' + Date.now().toString(36), target: { ...target }, status: 'success',
            startedAt: new Date(Date.now() - 5000).toISOString(), completedAt: new Date().toISOString(),
            method: technique.method, credential: cred, output: [...lines],
            detectionRisk: technique.detectionRisk, artifacts: ['Service creation log', 'Network connection log', 'Authentication event'],
          }];
        } else {
          lines.push(''); lines.push('[-] LATERAL MOVEMENT FAILED');
          lines.push('[-] Credential may be invalid or access denied');
          this._results = [...this._results, {
            id: 'MR-' + Date.now().toString(36), target: { ...target }, status: 'failed',
            startedAt: new Date(Date.now() - 5000).toISOString(), completedAt: new Date().toISOString(),
            method: technique.method, credential: cred, output: [...lines],
            detectionRisk: technique.detectionRisk, artifacts: ['Failed authentication log'],
          }];
        }
        this._output = lines; this._status = success ? 'success' : 'failed'; return;
      }
      lines.push(steps[i]);
      if (Math.random() > 0.15) lines.push(`  [+] Step completed successfully`);
      else lines.push(`  [!] Minor issue, retrying... [+] Retry successful`);
      this._output = [...lines]; this._progress = Math.round(((i + 1) / steps.length) * 100);
      i++; setTimeout(run, 400 + Math.random() * 400);
    };
    setTimeout(run, 300);
  }


  private _mitreTechniques = ['T1059', 'T1078', 'T1566', 'T1190'];

  private _computeRiskScore(item: { id: string; risk: string; status: string }): number {
    const riskW: Record<string, number> = { critical: 40, high: 30, medium: 20, low: 10 };
    const statusW: Record<string, number> = { active: 0, reviewing: -5, flagged: 10, completed: -15, expired: 5 };
    return Math.max(0, Math.min(100, (riskW[item.risk] || 20) + (statusW[item.status] || 0)));
  }

  private _riskColor(score: number): string {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f97316';
    if (score >= 40) return '#eab308';
    return '#22c55e';
  }

  private _riskLabel(score: number): string {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  }

  private _exportData(format: string) {
    const blob = new Blob(['lateral-movement export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'lateral-movement-export.' + (format === 'markdown' ? 'md' : format); a.click();
    URL.revokeObjectURL(url);
    this._showExport = false;
  }

  private _renderExportPanel() {
    return html`<div class="export-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:13px;font-weight:700">Export Data</div>
        <button class="detail-close" style="background:#374151;border:none;color:#94a3b8;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:11px" @click=${() => { this._showExport = false; }}>\u2715</button>
      </div>
      <div style="display:flex;gap:8px">
        <button class="export-btn" @click=${() => this._exportData('csv')}>CSV</button>
        <button class="export-btn" @click=${() => this._exportData('json')}>JSON</button>
        <button class="export-btn" @click=${() => this._exportData('markdown')}>Markdown</button>
      </div>
    </div>`;
  }

  private _renderPlaybook() {
    const steps: [string, string][] = [
      ['Identify', 'Identify relevant items and scope the analysis'],
      ['Assess', 'Evaluate current state against security requirements'],
      ['Plan', 'Develop prioritized remediation plan'],
      ['Implement', 'Execute remediation actions with proper controls'],
      ['Verify', 'Validate remediation effectiveness through testing'],
      ['Report', 'Document results, metrics, and lessons learned'],
    ];
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Panel Playbook</div>
      ${steps.map((s: [string, string], i: number) => html`
        <div style="display:flex;align-items:center;gap:10px;${i < steps.length - 1 ? 'margin-bottom:4px' : ''}">
          <div class="wizard-num ${i < 3 ? 'done' : i === 3 ? 'active' : ''}">${i < 3 ? '\u2713' : (i + 1).toString()}</div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600;${i === 3 ? 'color:#8b5cf6' : i < 3 ? 'color:#22c55e' : 'color:#6b7280'}">${s[0]}</div>
            <div style="font-size:10px;color:#6b7280">${s[1]}</div>
          </div>
        </div>
      `)}
    </div>`;
  }

  private _renderDecisionTree() {
    const nodes: [string, string][] = [
      ['Is the item high-risk or critical?', 'YES -> Immediate action required | NO -> Standard process'],
      ['Is there an existing control?', 'YES -> Verify effectiveness | NO -> Implement new control'],
      ['Is remediation within SLA?', 'YES -> Continue monitoring | NO -> Escalate to management'],
      ['Is the item recurring?', 'YES -> Automate detection and response | NO -> One-time remediation'],
    ];
    return html`<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Decision Tree</div>
      ${nodes.map((n: [string, string]) => html`
        <div style="margin-bottom:8px">
          <div style="font-size:11px;color:#e2e8f0;font-weight:600">${n[0]}</div>
          <div style="margin-left:20px;font-size:10px;color:#94a3b8;margin-top:2px">${n[1]}</div>
        </div>
      `)}
    </div>`;
  }

  private _renderKPIs() {
    const kpis: [string, string, string, string][] = [
      ['Total Items', '142', '+5', '#3b82f6'],
      ['High Risk', '23', '-2', '#ef4444'],
      ['Compliance Rate', '94%', '+3%', '#22c55e'],
      ['Pending Actions', '12', '-4', '#f97316'],
    ];
    return html`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px">
      ${kpis.map((k: [string, string, string, string]) => html`
        <div style="background:#0f172a;border-radius:8px;padding:12px;border-left:3px solid ${k[3]}">
          <div style="font-size:10px;color:#6b7280;text-transform:uppercase">${k[0]}</div>
          <div style="font-size:20px;font-weight:700;color:${k[3]}">${k[1]}</div>
          <div style="font-size:10px;color:${k[2].startsWith('+') ? '#22c55e' : '#ef4444'}">${k[2].startsWith('+') ? '\u25B2' : '\u25BC'} ${k[2]} vs last period</div>
        </div>
      `)}
    </div>`;
  }

  private _renderHeatmap() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatColor = (v: number) => v >= 10 ? '#ef4444' : v >= 7 ? '#f97316' : v >= 4 ? '#eab308' : v >= 2 ? '#22c55e80' : '#22c55e30';
    const grouped: { day: string; hours: { hour: number; value: number }[] }[] = [];
    for (const d of days) {
      const hours: { hour: number; value: number }[] = [];
      for (let h = 0; h < 24; h++) {
        const base = (h >= 8 && h <= 18) ? 5 : 1;
        const wknd = (d === 'Sat' || d === 'Sun') ? 0.3 : 1;
        hours.push({ hour: h, value: Math.round((base + Math.random() * 8) * wknd) });
      }
      grouped.push({ day: d, hours });
    }
    return html`<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Activity Heatmap</div>
      <div style="display:flex;gap:4px;align-items:center;margin-bottom:4px">
        <span style="width:30px;font-size:9px;color:#6b7280"></span>
        ${Array.from({ length: 24 }, (_, i) => html`<div style="flex:1;text-align:center;font-size:8px;color:#6b7280">${i}</div>`)}
      </div>
      ${grouped.map(d => html`<div style="display:flex;gap:4px;align-items:center;margin-bottom:2px">
        <span style="width:30px;font-size:9px;color:#6b7280">${d.day}</span>
        ${d.hours.map(h => html`<div class="heatmap-cell" style="flex:1;background:${heatColor(h.value)}" title="${d.day} ${h.hour}:00 - ${h.value} events"></div>`)}
      </div>`)}
      <div style="display:flex;gap:8px;margin-top:6px;font-size:9px;color:#6b7280;align-items:center">
        <span>Low</span><div style="width:12px;height:8px;border-radius:2px;background:#22c55e30"></div>
        <div style="width:12px;height:8px;border-radius:2px;background:#eab308"></div>
        <div style="width:12px;height:8px;border-radius:2px;background:#ef4444"></div><span>High</span>
      </div>
    </div>`;
  }

  private _approvalQueue = [
    { id: 'APR-001', item: 'Review pending', requestor: 'Team Lead', action: 'Approve changes', status: 'pending', submittedAt: '2026-04-21T10:00:00' },
    { id: 'APR-002', item: 'Policy update', requestor: 'Compliance', action: 'Update document', status: 'pending', submittedAt: '2026-04-20T14:00:00' },
    { id: 'APR-003', item: 'Access request', requestor: 'IT Ops', action: 'Grant access', status: 'approved', submittedAt: '2026-04-19T09:00:00' },
  ];

  private _renderApprovalWorkflow() {
    const pending = this._approvalQueue.filter(a => a.status === 'pending');
    const resolved = this._approvalQueue.filter(a => a.status !== 'pending');
    return html`<div class="approval-modal">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">Approval Queue (${pending.length} pending)</div>
      ${pending.map(a => html`<div style="background:#1f2937;border-radius:8px;padding:10px;margin-bottom:8px;border-left:3px solid #f97316">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-weight:600;font-size:12px">${a.id}: ${a.action}</div>
          <div style="font-size:10px;color:#6b7280;margin-top:2px">By: ${a.requestor} | ${a.submittedAt}</div></div>
          <div style="display:flex;gap:4px">
            <button class="export-btn" style="border-color:#22c55e;color:#22c55e;padding:4px 10px" @click=${() => { a.status = 'approved'; this.requestUpdate(); }}>Approve</button>
            <button class="export-btn" style="border-color:#ef4444;color:#ef4444;padding:4px 10px" @click=${() => { a.status = 'rejected'; this.requestUpdate(); }}>Reject</button>
          </div>
        </div>
      </div>`)}
      ${resolved.map(a => html`<div style="background:#1f2937;border-radius:6px;padding:8px;margin-bottom:4px;opacity:0.6">
        <div style="display:flex;justify-content:space-between;font-size:11px"><span>${a.id}: ${a.action}</span>
        <span style="color:${a.status === 'approved' ? '#22c55e' : '#ef4444'}">${a.status}</span></div>
      </div>`)}
    </div>`;
  }

  private _renderRiskScoringTable() {
    const items = this._items || [];
    return html`<div class="approval-modal">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">Risk Scoring Analysis</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr><th style="text-align:left;padding:6px 8px;background:#0f172a;color:#94a3b8;font-size:9px;text-transform:uppercase;border-bottom:1px solid #374151">Item</th><th style="text-align:left;padding:6px 8px;background:#0f172a;color:#94a3b8;font-size:9px;text-transform:uppercase;border-bottom:1px solid #374151">Score</th><th style="text-align:left;padding:6px 8px;background:#0f172a;color:#94a3b8;font-size:9px;text-transform:uppercase;border-bottom:1px solid #374151">Level</th></tr></thead>
        <tbody>${items.map((item: { id: string; name: string; risk: string; status: string }) => {
          const score = this._computeRiskScore(item);
          return html`<tr><td style="padding:6px 8px;border-bottom:1px solid #1f2937">${item.name}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #1f2937"><div style="display:flex;align-items:center;gap:6px">
              <span style="font-weight:700;color:${this._riskColor(score)}">${score}</span>
              <div class="risk-bar-track"><div class="risk-bar-fill" style="width:${score}%;background:${this._riskColor(score)}"></div></div></div></td>
            <td style="padding:6px 8px;border-bottom:1px solid #1f2937"><span style="color:${this._riskColor(score)};font-size:10px;font-weight:600">${this._riskLabel(score)}</span></td></tr>`;
        })}</tbody></table>
    </div>`;
  }

  private _addAudit(category: string, details: string): void {
    this._auditTrail = [{ id: 'a-' + Date.now(), timestamp: new Date().toISOString(), action: category, user: 'Current User', details, category }, ...this._auditTrail].slice(0, 50);
  }

  private _runScanWithHistory(): void {
    this._execRunning = true;
    this._execProgress = 0;
    this._addAudit('scan', 'Starting analysis');
    const record: any = { id: 'ex-' + Date.now(), timestamp: new Date().toISOString(), itemsScanned: 0, findings: 0, criticalCount: 0, duration: 0, status: 'running' };
    const start = Date.now();
    const iv = setInterval(() => {
      this._execProgress = Math.min(this._execProgress + 12, 100);
      record.duration = Math.round((Date.now() - start) / 1000);
      if (this._execProgress >= 100) {
        clearInterval(iv);
        record.status = 'success';
        record.itemsScanned = this._results.length;
        record.findings = this._results.filter((x: any) => x.risk && x.risk !== 'low').length;
        record.criticalCount = this._results.filter((x: any) => x.risk === 'critical').length;
        this._execHistory = [record, ...this._execHistory].slice(0, 20);
        this._execRunning = false;
        this._addAudit('scan', 'Scan completed: ' + record.findings + ' findings');
      }
    }, 200);
  }

  private _renderAuditPanel(): any {
    const filtered = this._auditFilter === 'all' ? this._auditTrail : this._auditTrail.filter((e: any) => e.category === this._auditFilter);
    return html`<div>
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
        ${['all', 'scan', 'review', 'config', 'export'].map((f: string) => html`<button class="btn btn-sm ${this._auditFilter === f ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._auditFilter = f; }}>${f}</button>`)}
      </div>
      <div style="max-height:400px;overflow-y:auto">
        ${filtered.map((e: any) => html`<div style="display:flex;gap:10px;padding:8px 10px;background:#0f172a;border-radius:6px;margin-bottom:4px;font-size:12px">
          <span style="padding:2px 6px;border-radius:3px;font-size:9px;font-weight:600;background:${((({scan:'#3b82f6',review:'#f59e0b',config:'#8b5cf6',export:'#22c55e'}}) as any)[e.category]) || '#374151'}20;color:${((({scan:'#60a5fa',review:'#fbbf24',config:'#a78bfa',export:'#34d399'}}) as any)[e.category]) || '#9ca3af'}">${e.category}</span>
          <div style="flex:1"><div style="color:#e2e8f0;font-weight:500">${e.details}</div><div style="font-size:10px;color:#6b7280;margin-top:2px">${e.user} | ${new Date(e.timestamp).toLocaleString()}</div></div>
        </div>`)}
      </div>
    </div>`;
  }

  private _renderExecHistory(): any {
    if (this._execHistory.length === 0) return html`<div class="empty-state"><div>No scan history</div></div>`;
    const sorted = [...this._execHistory].sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));
    const totalPages = Math.max(1, Math.ceil(sorted.length / this._tablePageSize));
    const start = this._tablePage * this._tablePageSize;
    const records = sorted.slice(start, start + this._tablePageSize);
    return html`<div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
        <span style="font-weight:600;font-size:12px;color:#94a3b8">History (${this._execHistory.length})</span>
        <select style="background:#1f2937;border:1px solid #374151;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:11px" .value=${String(this._tablePageSize)} @change=${(e: Event) => { this._tablePageSize = parseInt((e.target as HTMLSelectElement).value); this._tablePage = 0; }}>
          <option value="5">5/page</option><option value="10">10/page</option><option value="25">25/page</option>
        </select>
      </div>
      ${this._execRunning ? html`<div class="progress-bar"><div class="progress-fill" style="width:${this._execProgress}%"></div></div>` : nothing}
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Time</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Items</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Findings</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Duration</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Status</th></tr></thead>
        <tbody>${records.map((r: any) => html`<tr style="border-bottom:1px solid #1f2937">
          <td style="padding:7px 8px;font-size:11px;color:#6b7280">${new Date(r.timestamp).toLocaleString()}</td>
          <td style="padding:7px 8px">${r.itemsScanned}</td>
          <td style="padding:7px 8px;color:#f59e0b;font-weight:700">${r.findings}</td>
          <td style="padding:7px 8px">${r.duration}s</td>
          <td style="padding:7px 8px"><span style="font-size:10px;padding:2px 8px;border-radius:4px;font-weight:600;background:${r.status === 'success' ? '#22c55e20' : '#ef444420'};color:${r.status === 'success' ? '#34d399' : '#f87171'}">${r.status}</span></td>
        </tr>`)}</tbody>
      </table>
      ${totalPages > 1 ? html`<div style="display:flex;gap:4px;justify-content:center;margin-top:8px">${Array.from({ length: totalPages }, (_: any, i: number) => html`<button class="btn btn-sm ${this._tablePage === i ? 'btn-primary' : 'btn-secondary'}" style="padding:4px 10px" @click=${() => { this._tablePage = i; }}>${i + 1}</button>`)}
      </div>` : nothing}
    </div>`;
  }

  private _renderSettingsPanel(): any {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px">
      <div style="font-weight:700;font-size:14px;margin-bottom:12px">Settings</div>
      <div style="display:flex;gap:4px;margin-bottom:12px">
        ${['general', 'thresholds', 'integrations'].map((t: string) => html`<button class="btn btn-sm ${this._settingsTab === t ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = t; }}>${t}</button>`)}
      </div>
      ${this._settingsTab === 'general' ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Auto-scan Interval</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="168" .value=${String(this._autoInterval)} @input=${(e: Event) => { this._autoInterval = parseInt((e.target as HTMLInputElement).value); } style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._autoInterval}h</span></div></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">SLA Target</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="720" .value=${String(this._slaTargetHours)} @input=${(e: Event) => { this._slaTargetHours = parseInt((e.target as HTMLInputElement).value); } style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._slaTargetHours}h</span></div></div>
      </div>` : nothing}
      ${this._settingsTab === 'thresholds' ? html`<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Critical Threshold</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="20" .value=${String(this._criticalThreshold)} @input=${(e: Event) => { this._criticalThreshold = parseInt((e.target as HTMLInputElement).value); } style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._criticalThreshold}</span></div></div>` : nothing}
      ${this._settingsTab === 'integrations' ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Escalation Email</div><input type="email" .value=${this._escalationEmail} @input=${(e: Event) => { this._escalationEmail = (e.target as HTMLInputElement).value; } style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Webhook URL</div><input type="url" .value=${this._webhookUrl} @input=${(e: Event) => { this._webhookUrl = (e.target as HTMLInputElement).value; } style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
        <div style="grid-column:1/-1;display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary btn-sm" @click=${() => { this._addAudit('config', 'Settings saved'); }}>Save</button>
          <button class="btn btn-secondary btn-sm" @click=${() => { this._addAudit('config', 'Config exported'); }}>Export</button>
        </div>
      </div>` : nothing}
    </div>`;
  }

  private _renderRiskGauge(): any {
    const riskDist: any = { critical: 0, high: 0, medium: 0, low: 0 };
    this._results.forEach((item: any) => { const r = item.risk; if (riskDist[r] !== undefined) riskDist[r]++; else riskDist.medium++; });
    const total = this._results.length || 1;
    const score = Math.round(((riskDist.critical * 10 + riskDist.high * 7 + riskDist.medium * 4 + riskDist.low * 1) / (total * 10)) * 100);
    const scoreColor = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e';
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Risk Overview</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:${scoreColor}">${score}</div><div style="font-size:9px;color:#6b7280">Risk Score</div></div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:#ef4444">${riskDist.critical}</div><div style="font-size:9px;color:#6b7280">Critical</div></div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:#f59e0b">${riskDist.high}</div><div style="font-size:9px;color:#6b7280">High Risk</div></div>
      </div>
      <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;gap:1px;margin-bottom:6px">
        <div style="width:${(riskDist.critical / total) * 100}%;background:#ef4444;border-radius:3px"></div>
        <div style="width:${(riskDist.high / total) * 100}%;background:#f97316"></div>
        <div style="width:${(riskDist.medium / total) * 100}%;background:#eab308"></div>
        <div style="width:${(riskDist.low / total) * 100}%;background:#22c55e;border-radius:3px"></div>
      </div>
      <div style="display:flex;gap:12px;font-size:9px;color:#6b7280">
        <span><span style="display:inline-block;width:8px;height:8px;background:#ef4444;border-radius:2px;margin-right:3px"></span>Critical</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:#f97316;border-radius:2px;margin-right:3px"></span>High</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:#eab308;border-radius:2px;margin-right:3px"></span>Medium</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:#22c55e;border-radius:2px;margin-right:3px"></span>Low</span>
      </div>
    </div>`;
  }

  private _renderBarChart(): any {
    const data = this._results.slice(0, 10).map((item: any, i: number) => ({ name: (item.name || item.title || item.id || 'Item ' + i).substring(0, 8), score: ({critical: 10, high: 7, medium: 4, low: 1}}}}) as any)[item.risk]) || 2, risk: item.risk || 'medium' }));
    const w = 380, h = 160;
    const bw = Math.max(18, Math.floor((w - 50) / data.length) - 4);
    const colors: any = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Score Chart</div>
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="max-width:440px">
        ${[0,5,10].map(v => html`<line x1="35" y1="${h - 20 - (v / 10) * (h - 45)}" x2="${w - 10}" y2="${h - 20 - (v / 10) * (h - 45)}" stroke="#1f2937" stroke-width="0.5"/><text x="30" y="${h - 18 - (v / 10) * (h - 45)}" text-anchor="end" fill="#6b7280" font-size="7">${v}</text>`)}
        ${data.map((d: any, i: number) => html`<g><rect x="${40 + i * (bw + 4)}" y="${h - 20 - (d.score / 10) * (h - 45)}" width="${bw}" height="${(d.score / 10) * (h - 45)}" fill="${(colors[d.risk] || '#8b5cf6')}60" rx="2" stroke="${colors[d.risk] || '#8b5cf6'}" stroke-width="0.5"/><text x="${40 + i * (bw + 4) + bw / 2}" y="${h - 6}" text-anchor="middle" fill="#6b7280" font-size="6" transform="rotate(-25, ${40 + i * (bw + 4) + bw / 2}, ${h - 6})">${d.name}</text></g>`)}
        <line x1="35" y1="${h - 20}" x2="${w - 10}" y2="${h - 20}" stroke="#374151" stroke-width="1"/>
      </svg>
    </div>`;
  }

  private _renderEnhancedSection(): any {
    if (!this._showEnhanced) return nothing;
    return html`<div style="margin-top:16px;border-top:1px solid #374151;padding-top:16px">
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #374151;padding-bottom:8px">
        <button class="btn btn-sm ${this._settingsTab === 'audit' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'audit'; }}>Audit</button>
        <button class="btn btn-sm ${this._settingsTab === 'history' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'history'; }}>History</button>
        <button class="btn btn-sm ${this._settingsTab === 'settings' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'settings'; }}>Settings</button>
      </div>
      ${this._settingsTab === 'audit' ? this._renderAuditPanel() : ''}
      ${this._settingsTab === 'history' ? this._renderExecHistory() : ''}
      ${this._settingsTab === 'settings' ? this._renderSettingsPanel() : ''}
      <div style="margin-top:12px">
        ${this._renderRiskGauge()}
        ${this._renderBarChart()}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <div style="flex:1;padding:8px;border-radius:6px;border:1px solid #374151;background:#1f2937;color:#94a3b8;font-size:11px;cursor:pointer;text-align:center" @click=${() => { this._addAudit('export', 'Report exported'); }}>Export Report</div>
        <div style="flex:1;padding:8px;border-radius:6px;border:1px solid #374151;background:#1f2937;color:#94a3b8;font-size:11px;cursor:pointer;text-align:center" @click=${this._runScanWithHistory}>Run Analysis</div>
      </div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #374151;display:flex;justify-content:space-between;font-size:10px;color:#6b7280">
        <span>Last scan: ${this._execHistory.length > 0 ? new Date(this._execHistory[0].timestamp).toLocaleString() : 'Never'}</span>
        <span>${this._results.length} items | ${this._auditTrail.length} audit entries</span>
      </div>
    </div>`;
  }


  render() {
    return html`
      <div class="panel">
        <div class="header"><div class="title"><span>&#x1F310;</span> Lateral Movement Toolkit</div></div>
        <div class="tabs">
          <button class="tab ${this._activeTab === 'creds' ? 'active' : ''}" @click=${() => { this._activeTab = 'creds'; }}>Credentials (${this._credentials.length})</button>
          <button class="tab ${this._activeTab === 'topology' ? 'active' : ''}" @click=${() => { this._activeTab = 'topology'; }}>Network (${this._targets.length})</button>
          <button class="tab ${this._activeTab === 'paths' ? 'active' : ''}" @click=${() => { this._activeTab = 'paths'; }}>Paths (${this._paths.length})</button>
          <button class="tab ${this._activeTab === 'techniques' ? 'active' : ''}" @click=${() => { this._activeTab = 'techniques'; }}>Techniques (${TECHNIQUES.length})</button>
          <button class="tab ${this._activeTab === 'execute' ? 'active' : ''}" @click=${() => { this._activeTab = 'execute'; }}>Execute</button>
          <button class="tab ${this._activeTab === 'history' ? 'active' : ''}" @click=${() => { this._activeTab = 'history'; }}>History (${this._results.length})</button>
        </div>

        ${this._activeTab === 'creds' ? html`
          <div class="form-grid">
            <div class="form-group"><label>Username</label><input type="text" .value=${this._newCredUser} @input=${(e: Event) => { this._newCredUser = (e.target as HTMLInputElement).value; }}></div>
            <div class="form-group"><label>Password/Hash</label><input type="text" .value=${this._newCredPass} @input=${(e: Event) => { this._newCredPass = (e.target as HTMLInputElement).value; }}></div>
            <div class="form-group"><label>Domain</label><input type="text" .value=${this._newCredDomain} @input=${(e: Event) => { this._newCredDomain = (e.target as HTMLInputElement).value; }}></div>
            <div class="form-group"><label>Type</label>
              <select .value=${this._newCredType} @change=${(e: Event) => { this._newCredType = (e.target as HTMLSelectElement).value as CredType; }}>
                <option value="plaintext">Plaintext</option><option value="hash">NTLM Hash</option><option value="ticket">Kerberos Ticket</option><option value="key">SSH Key</option><option value="token">OAuth Token</option><option value="certificate">Certificate</option>
              </select>
            </div>
          </div>
          <div class="btn-row">
            <button class="btn btn-primary btn-sm" @click=${this._addCredential}>Add Credential</button>
            <button class="btn btn-secondary btn-sm" @click=${() => { for (let i = 0; i < 5; i++) this._addCredential(); }}>Generate 5 Random</button>
            <button class="btn btn-secondary btn-sm" @click=${this._discoverNetwork}>Discover Network</button>
          </div>
          ${this._credentials.length > 0 ? html`
            <div style="max-height:300px;overflow-y:auto">
              <table class="cred-table">
                <thead><tr><th>Username</th><th>Domain</th><th>Type</th><th>Privilege</th><th>Valid</th></tr></thead>
                <tbody>${this._credentials.map(c => html`<tr><td>${c.username}</td><td>${c.domain}</td><td><span class="tag">${c.type}</span></td><td><span class="tag">${c.privilege}</span></td><td style="color:${c.valid ? '#34d399' : '#f87171'}">${c.valid ? 'Yes' : 'No'}</td></tr>`)}</tbody>
              </table>
            </div>
          ` : html`<div class="empty-state" style="padding:20px">Add credentials or discover network to start</div>`}
        ` : nothing}

        ${this._activeTab === 'topology' ? html`
          ${this._targets.length === 0 ? html`<div class="empty-state">Discover network first</div>` : html`
            <div class="stat-grid">
              <div class="stat"><div class="stat-value">${this._targets.length}</div><div class="stat-label">Discovered Hosts</div></div>
              <div class="stat"><div class="stat-value" style="color:#34d399">${this._targets.filter(t => t.compromised).length}</div><div class="stat-label">Compromised</div></div>
              <div class="stat"><div class="stat-value" style="color:#f87171">${this._targets.reduce((s, t) => s + t.services.filter(sv => sv.vuln).length, 0)}</div><div class="stat-label">Vulnerable Services</div></div>
              <div class="stat"><div class="stat-value" style="color:#fbbf24">${this._targets.filter(t => t.detectionRisk > 60).length}</div><div class="stat-label">High-Risk Targets</div></div>
            </div>
            <div class="target-grid">${this._targets.map(t => html`
              <div class="target-card ${t.compromised ? 'compromised' : ''}" @click=${() => { this._selectedTarget = t; }}>
                <div class="target-name">${t.host} ${t.compromised ? html`<span style="color:#34d399;font-size:11px">COMPROMISED</span>` : nothing} <span class="tag" style="margin-left:4px">${t.zone}</span></div>
                <div class="target-meta">${t.ip} | ${t.os} | ${t.role}</div>
                <div class="target-meta" style="margin-top:4px">Services: ${t.services.map(s => html`<span class="${s.vuln ? 'tag tag-vuln' : 'tag tag-safe'}">${s.name}:${s.port}</span>`)}</div>
                <div class="target-meta">Detection Risk: <span style="color:${t.detectionRisk > 60 ? '#f87171' : '#fbbf24'}">${t.detectionRisk}%</span></div>
              </div>
            `)}</div>
          `}
        ` : nothing}

        ${this._activeTab === 'paths' ? html`
          ${this._paths.length === 0 ? html`<div class="empty-state">Discover network first</div>` : this._paths.map(p => html`
            <div class="path-card ${p.recommended ? 'recommended' : ''}">
              <div class="path-name">${p.name} ${p.recommended ? html`<span class="tag tag-safe">RECOMMENDED</span>` : nothing} <span style="font-size:11px;color:#fbbf24">Risk: ${p.totalRisk}%</span></div>
              ${p.steps.map(s => html`
                <div class="path-step">
                  <strong>${s.from}</strong> <span class="path-arrow">&#x27A1;</span> <strong>${s.to}</strong>
                  <span class="tag">${s.method}</span>
                  <span style="color:${s.risk > 60 ? '#f87171' : '#fbbf24'}">Risk: ${s.risk}%</span>
                  <span style="color:#6b7280">${s.estimatedTime}</span>
                </div>
              `)}
            </div>
          `)}
        ` : nothing}

        ${this._activeTab === 'techniques' ? html`
          <div style="font-weight:600;margin-bottom:8px">Lateral Movement Technique Catalog</div>
          ${TECHNIQUES.map(t => html`
            <div class="technique-card" @click=${() => { this._expandedTechnique = this._expandedTechnique === t.id ? null : t.id; }}>
              <div class="technique-name">
                ${t.name}
                <span class="tag">${t.mitreId}</span>
                <span class="tag">${t.platform.join('/')}</span>
                <span style="font-size:11px;color:${t.detectionRisk > 50 ? '#f87171' : '#fbbf24'}">Detect: ${t.detectionRisk}%</span>
              </div>
              <div class="technique-desc">${t.description}</div>
              <div style="font-size:11px;color:#6b7280">Tools: ${t.tools.join(', ')} | Requirements: ${t.requirements.join(', ')}</div>
              ${this._expandedTechnique === t.id ? html`
                <div class="detail-panel">
                  <div class="detail-title">Attack Steps:</div>
                  ${t.steps.map((s, i) => html`<div class="step-item"><span class="step-num">${i + 1}.</span>${s}</div>`)}
                  <div class="detail-title" style="margin-top:10px">Detection by Tool:</div>
                  ${t.detectabilityByTool.map(d => html`
                    <div class="tool-bar">
                      <span class="tool-name">${d.tool}</span>
                      <div class="tool-bar-track"><div class="tool-bar-fill" style="width:${d.confidence}%;background:${d.detectable ? '#f87171' : '#34d399'}"></div></div>
                      <span style="font-size:11px;color:${d.detectable ? '#f87171' : '#34d399'};min-width:50px;text-align:right">${d.confidence}%</span>
                    </div>
                  `)}
                </div>
              ` : nothing}
            </div>
          `)}
        ` : nothing}

        ${this._activeTab === 'execute' ? html`
          ${this._targets.length === 0 ? html`<div class="empty-state">Discover network first</div>` : html`
            <div style="font-weight:600;margin-bottom:8px">Select target to move laterally:</div>
            <div class="target-grid" style="margin-bottom:16px">${this._targets.filter(t => !t.compromised).map(t => html`
              <div class="target-card" style="cursor:pointer" @click=${() => this._executeMove(t)}>
                <div class="target-name">${t.host}</div>
                <div class="target-meta">${t.ip} | ${t.role} | Risk: ${t.detectionRisk}%</div>
              </div>
            `)}</div>
            ${this._status !== 'idle' ? html`<div class="progress-bar"><div class="progress-fill" style="width:${this._progress}%"></div></div>` : nothing}
            ${this._output.length > 0 ? html`<div class="output-box">${this._output.map(l => html`<div class="${l.startsWith('[+]') ? 'output-success' : l.startsWith('[-]') ? 'output-error' : l.startsWith('[!]') ? 'output-warn' : 'output-info'}">${l}</div>`)}</div>` : nothing}
          `}
        ` : nothing}

        ${this._activeTab === 'history' ? html`
          ${this._results.length === 0 ? html`<div class="empty-state">No movement history</div>` : this._results.map(r => html`
            <div style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:8px;padding:10px;margin-bottom:6px;border-left:3px solid ${r.status === 'success' ? '#34d399' : '#f87171'}">
              <div style="font-weight:600;font-size:13px">${r.target.host} (${r.target.ip}) - <span style="color:${r.status === 'success' ? '#34d399' : '#f87171'}">${r.status.toUpperCase()}</span></div>
              <div style="font-size:11px;color:#9ca3af">Method: ${r.method} | Detection Risk: ${r.detectionRisk}% | ${new Date(r.completedAt).toLocaleString()}</div>
              <div style="font-size:11px;color:#6b7280;margin-top:2px">Artifacts: ${r.artifacts.join(', ')}</div>
            </div>
          `)}
        ` : nothing}
      </div>
      </div>
      <div style="margin-top:12px;display:flex;justify-content:center">
        <button class="btn btn-sm ${this._showEnhanced ? 'btn-primary' : 'btn-secondary'}" @click=${() => {{ this._showEnhanced = !this._showEnhanced; this.requestUpdate(); }}>${this._showEnhanced ? 'Hide' : 'Show'} Advanced</button>
      </div>
      ${this._renderEnhancedSection()}
    `;
  }
}
