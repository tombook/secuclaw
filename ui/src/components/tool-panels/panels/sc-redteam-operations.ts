/**
 * sc-redteam-operations — Red Team Operation Management Panel (Red Team Core Command Component)
 * Attack chain visualization, mission tracking, IOC management, TTP mapping, campaign monitoring
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

type MissionStatus = 'planned' | 'active' | 'paused' | 'completed' | 'aborted';
type TacticStatus = 'not-started' | 'in-progress' | 'succeeded' | 'failed' | 'blocked';
type IOCType = 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'c2' | 'exfiltration';

interface IOC {
  id: string;
  type: IOCType;
  value: string;
  description: string;
  usedIn: string;
  detected: boolean;
  firstSeen?: string;
}

interface AttackTactic {
  id: string;
  name: string;
  status: TacticStatus;
  successRate: number;
  startTime?: string;
  endTime?: string;
  operator: string;
  techniques: { id: string; name: string; status: TacticStatus; cve?: string; description: string }[];
}

interface Mission {
  id: string;
  name: string;
  codename: string;
  type: 'phishing-campaign' | 'external-intrusion' | 'internal-lateral-movement' | 'ransomware-simulation' | 'adversary-emulation';
  status: MissionStatus;
  startDate: string;
  endDate: string;
  objectives: string[];
  operators: string[];
  targetScope: string[];
  attackChain: AttackTactic[];
  iocs: IOC[];
  metrics: {
    initialAccessTime?: string;
    firstPrivEscTime?: string;
    domainAdminTime?: string;
    exfiltratedDataSize?: number;
    assetsCompromised: number;
    detectionsTriggered: number;
  };
}

@customElement('sc-redteam-operations')
export class ScRedteamOperations extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #111827); border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .mission-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .mission-info h2 { font-size: 18px; font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 8px; }
    .codename { background: var(--accent-color, #3b82f6); color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
    .mission-meta { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; font-size: 12px; color: var(--text-secondary, #cbd5e1); }
    .status-badge { padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; }
    .status-planned { background: #1e3a8a; color: #93c5fd; }
    .status-active { background: #431407; color: #fdba74; animation: pulse 2s infinite; }
    .status-paused { background: #422006; color: #fde047; }
    .status-completed { background: #052e16; color: #86efac; }
    .status-aborted { background: #450a0a; color: #fca5a5; }
    .type-badge { padding: 3px 8px; border-radius: 3px; font-size: 10px; font-weight: 600; background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); }
    .controls { display: flex; gap: 6px; flex-wrap: wrap; }
    .btn { padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); color: var(--text-secondary, #94a3b8); transition: all 0.2s; }
    .btn.active { background: var(--accent-color, #3b82f6); color: white; border-color: var(--accent-color, #3b82f6); }
    .btn:hover { border-color: var(--accent-color, #3b82f6); color: var(--text-primary, #e2e8f0); }
    .btn.danger { background: #450a0a; border-color: #7f1d1d; color: #fca5a5; }
    .btn.danger:hover { background: #7f1d1d; }
    .btn.success { background: #052e16; border-color: #166534; color: #86efac; }
    .btn.success:hover { background: #166534; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .metric-card { background: var(--bg-secondary, #1f2937); border-radius: 6px; padding: 10px; text-align: center; border: 1px solid var(--border-color, #374151); }
    .metric-value { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .metric-label { font-size: 10px; color: var(--text-tertiary, #94a3b8); text-transform: uppercase; }
    .metric-value.success { color: #22c55e; }
    .metric-value.warning { color: #eab308; }
    .metric-value.danger { color: #ef4444; }
    .metric-value.info { color: #3b82f6; }
    .attack-chain-container { margin-bottom: 20px; overflow-x: auto; padding-bottom: 8px; }
    .attack-chain { display: flex; gap: 2px; min-width: 800px; }
    .tactic-card { flex: 1; min-width: 110px; background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); border-radius: 6px; padding: 10px; cursor: pointer; transition: all 0.2s; position: relative; }
    .tactic-card:hover { border-color: var(--accent-color, #3b82f6); transform: translateY(-2px); }
    .tactic-card.active { border-color: var(--accent-color, #3b82f6); background: var(--bg-primary, #111827); }
    .tactic-name { font-weight: 700; font-size: 11px; margin-bottom: 6px; text-align: center; }
    .tactic-status-badge { position: absolute; top: 6px; right: 6px; font-size: 8px; padding: 1px 3px; border-radius: 2px; font-weight: 600; }
    .status-not-started { background: #0a0e17; color: #6b7280; }
    .status-in-progress { background: #1e3a8a; color: #93c5fd; animation: pulse 2s infinite; }
    .status-succeeded { background: #052e16; color: #86efac; }
    .status-failed { background: #450a0a; color: #fca5a5; }
    .status-blocked { background: #422006; color: #fde047; }
    .tactic-progress { height: 4px; background: var(--bg-tertiary, #0a0e17); border-radius: 2px; margin-bottom: 8px; overflow: hidden; }
    .tactic-progress-fill { height: 100%; border-radius: 2px; }
    .tactic-meta { font-size: 9px; color: var(--text-tertiary, #94a3b8); text-align: center; }
    .tactic-meta .operator { font-weight: 600; color: var(--text-secondary, #cbd5e1); }
    .content-tabs { display: flex; gap: 0; margin-bottom: 12px; border-bottom: 1px solid var(--border-color, #374151); }
    .tab-btn { padding: 6px 16px; font-size: 12px; font-weight: 600; border: none; background: transparent; color: var(--text-secondary, #94a3b8); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .tab-btn.active { color: var(--accent-color, #3b82f6); border-bottom-color: var(--accent-color, #3b82f6); }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .techniques-list { display: flex; flex-direction: column; gap: 6px; max-height: 350px; overflow-y: auto; }
    .technique-item { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: var(--bg-tertiary, #0a0e17); border-radius: 4px; }
    .technique-status { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
    .status-succeeded-bg { background: #22c55e; }
    .status-failed-bg { background: #ef4444; }
    .status-in-progress-bg { background: #3b82f6; animation: pulse 2s infinite; }
    .status-blocked-bg { background: #f97316; }
    .status-not-started-bg { background: #6b7280; }
    .technique-info { flex: 1; }
    .technique-name { font-size: 12px; font-weight: 600; margin-bottom: 2px; }
    .technique-desc { font-size: 10px; color: var(--text-secondary, #cbd5e1); }
    .technique-meta { display: flex; gap: 10px; font-size: 9px; color: var(--text-tertiary, #94a3b8); margin-top: 4px; }
    .cve-tag { font-family: monospace; background: var(--bg-secondary, #1f2937); padding: 1px 4px; border-radius: 2px; }
    .iocs-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 8px; max-height: 350px; overflow-y: auto; }
    .ioc-card { background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); border-radius: 6px; padding: 10px; }
    .ioc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .ioc-type { padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
    .ioc-type-ip { background: #1e3a8a; color: #93c5fd; }
    .ioc-type-domain { background: #0e7490; color: #38bdf8; }
    .ioc-type-url { background: #0369a1; color: #7dd3fc; }
    .ioc-type-hash { background: #4338ca; color: #c4b5fd; }
    .ioc-type-c2 { background: #7e22ce; color: #e9d5ff; }
    .ioc-type-exfiltration { background: #92400e; color: #fdba74; }
    .ioc-detected { font-size: 9px; padding: 1px 3px; border-radius: 2px; font-weight: 600; }
    .detected-yes { background: #450a0a; color: #fca5a5; }
    .detected-no { background: #052e16; color: #86efac; }
    .ioc-value { font-family: monospace; font-size: 11px; font-weight: 600; margin-bottom: 4px; word-break: break-all; }
    .ioc-desc { font-size: 10px; color: var(--text-secondary, #cbd5e1); margin-bottom: 4px; }
    .ioc-meta { display: flex; justify-content: space-between; font-size: 9px; color: var(--text-tertiary, #94a3b8); }
    .timeline-container { max-height: 350px; overflow-y: auto; }
    .timeline-item { position: relative; padding-left: 24px; padding-bottom: 12px; border-left: 2px solid var(--border-color, #374151); }
    .timeline-item:last-child { border-left-color: transparent; }
    .timeline-dot { position: absolute; left: -7px; top: 0; width: 12px; height: 12px; border-radius: 50%; background: var(--accent-color, #3b82f6); border: 2px solid var(--bg-primary, #111827); }
    .timeline-dot.success { background: #22c55e; }
    .timeline-dot.warning { background: #f97316; }
    .timeline-dot.danger { background: #ef4444; }
    .timeline-time { font-size: 10px; color: var(--text-tertiary, #94a3b8); margin-bottom: 3px; }
    .timeline-title { font-weight: 600; font-size: 12px; margin-bottom: 3px; }
    .timeline-desc { font-size: 10px; color: var(--text-secondary, #cbd5e1); line-height: 1.4; }
    .empty-state { text-align: center; padding: 40px 20px; color: var(--text-tertiary, #94a3b8); font-size: 14px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    .sla-bar { display: flex; align-items: center; gap: 12px; background: #1f2937; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
    .sla-indicator { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  `;

  @state() private _selectedMission: Mission | null = null;
  @state() private _selectedTacticId: string | null = null;
  @state() private _activeTab: 'techniques' | 'iocs' | 'timeline' = 'techniques';
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


  private _missions: Mission[] = [
    {
      id: 'rt-2026-001',
      name: 'Q2 External Intrusion Simulation',
      codename: 'DARK STORM',
      type: 'external-intrusion',
      status: 'active',
      startDate: '2026-04-20',
      endDate: '2026-04-27',
      objectives: [
        'Gain initial access to corporate network',
        'Escalate privileges to Domain Admin',
        'Exfiltrate sensitive customer data',
        'Avoid detection for at least 48 hours'
      ],
      operators: ['alpha-operator', 'bravo-operator', 'charlie-operator'],
      targetScope: ['10.0.0.0/24', '*.acme.com', '192.168.1.0/24', 'AWS production account'],
      attackChain: [
        {
          id: 'tac-001',
          name: 'Reconnaissance',
          status: 'succeeded',
          successRate: 100,
          startTime: '2026-04-20 09:00',
          endTime: '2026-04-20 12:00',
          operator: 'alpha-operator',
          techniques: [
            { id: 'tec-001', name: 'OSINT Collection', status: 'succeeded', description: 'Collected employee emails, infrastructure info, technology stack' },
            { id: 'tec-002', name: 'Port & Service Scanning', status: 'succeeded', description: 'Identified 230 open ports, 187 running services' },
            { id: 'tec-003', name: 'Vulnerability Discovery', status: 'succeeded', cve: 'CVE-2026-1234', description: 'Discovered critical RCE vulnerability on public web server' }
          ]
        },
        {
          id: 'tac-002',
          name: 'Initial Access',
          status: 'succeeded',
          successRate: 100,
          startTime: '2026-04-20 14:00',
          endTime: '2026-04-20 14:23',
          operator: 'bravo-operator',
          techniques: [
            { id: 'tec-004', name: 'Exploit Public-Facing Application', status: 'succeeded', cve: 'CVE-2026-1234', description: 'Successfully exploited Log4j vulnerability on prod-web-01, gained webshell access' },
            { id: 'tec-005', name: 'Phishing Campaign', status: 'succeeded', description: 'Sent 230 phishing emails, 18 users clicked links, 7 downloaded malware' }
          ]
        },
        {
          id: 'tac-003',
          name: 'Execution',
          status: 'succeeded',
          successRate: 100,
          startTime: '2026-04-20 14:30',
          endTime: '2026-04-20 15:10',
          operator: 'bravo-operator',
          techniques: [
            { id: 'tec-006', name: 'Command & Script Interpreter', status: 'succeeded', description: 'Executed PowerShell scripts to establish persistence' },
            { id: 'tec-007', name: 'User Execution', status: 'succeeded', description: '7 users executed downloaded malware, 5 machines compromised' }
          ]
        },
        {
          id: 'tac-004',
          name: 'Persistence',
          status: 'succeeded',
          successRate: 90,
          startTime: '2026-04-20 15:15',
          endTime: '2026-04-20 15:45',
          operator: 'charlie-operator',
          techniques: [
            { id: 'tec-008', name: 'Registry Run Keys', status: 'succeeded', description: 'Created persistence run keys on 4 compromised hosts' },
            { id: 'tec-009', name: 'Scheduled Task/Job', status: 'succeeded', description: 'Created scheduled tasks to maintain access every 30 minutes' },
            { id: 'tec-010', name: 'Create Account', status: 'failed', description: 'Account creation attempt detected and blocked by EDR' }
          ]
        },
        {
          id: 'tac-005',
          name: 'Privilege Escalation',
          status: 'in-progress',
          successRate: 60,
          startTime: '2026-04-21 09:00',
          operator: 'alpha-operator',
          techniques: [
            { id: 'tec-011', name: 'Exploit Vulnerability for PrivEsc', status: 'succeeded', cve: 'CVE-2026-0876', description: 'Escalated to local admin on 3 workstations' },
            { id: 'tec-012', name: 'Credentials Dumping', status: 'succeeded', description: 'Dumped local SAM database, recovered 23 NTLM hashes' },
            { id: 'tec-013', name: 'Pass-the-Hash', status: 'in-progress', description: 'Attempting to reuse NTLM hashes to access domain resources' }
          ]
        },
        {
          id: 'tac-006',
          name: 'Defense Evasion',
          status: 'not-started',
          successRate: 0,
          operator: 'charlie-operator',
          techniques: [
            { id: 'tec-014', name: 'Obfuscated Files/Information', status: 'not-started', description: 'Obfuscate payloads to avoid EDR detection' },
            { id: 'tec-015', name: 'Indicator Removal on Host', status: 'not-started', description: 'Clear logs, remove artifacts from compromised hosts' }
          ]
        },
        {
          id: 'tac-007',
          name: 'Credential Access',
          status: 'not-started',
          successRate: 0,
          operator: 'bravo-operator',
          techniques: []
        },
        {
          id: 'tac-008',
          name: 'Lateral Movement',
          status: 'not-started',
          successRate: 0,
          operator: 'alpha-operator',
          techniques: []
        },
        {
          id: 'tac-009',
          name: 'Collection',
          status: 'not-started',
          successRate: 0,
          operator: 'charlie-operator',
          techniques: []
        },
        {
          id: 'tac-010',
          name: 'Exfiltration',
          status: 'not-started',
          successRate: 0,
          operator: 'bravo-operator',
          techniques: []
        }
      ],
      iocs: [
        { id: 'ioc-001', type: 'ip', value: '203.0.113.45', description: 'C2 server IP', usedIn: 'Initial Access', detected: false },
        { id: 'ioc-002', type: 'domain', value: 'update-verify-service.com', description: 'Phishing domain', usedIn: 'Phishing Campaign', detected: true, firstSeen: '2026-04-20 14:15' },
        { id: 'ioc-003', type: 'url', value: 'https://update-verify-service.com/office-patch.exe', description: 'Malware download URL', usedIn: 'Phishing Campaign', detected: true, firstSeen: '2026-04-20 14:18' },
        { id: 'ioc-004', type: 'hash', value: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', description: 'Malware payload SHA256', usedIn: 'Execution', detected: false },
        { id: 'ioc-005', type: 'c2', value: 'wss://comms.update-verify-service.com/ws', description: 'C2 websocket endpoint', usedIn: 'C2 Communication', detected: false },
        { id: 'ioc-006', type: 'exfiltration', value: 's3://external-backup-storage-us-east-1', description: 'Exfiltration destination', usedIn: 'Data Exfiltration', detected: false }
      ],
      metrics: {
        initialAccessTime: '23 minutes',
        assetsCompromised: 7,
        detectionsTriggered: 3
      }
    },
    {
      id: 'rt-2026-002',
      name: 'Ransomware Simulation Exercise',
      codename: 'CRYSTAL RANSOM',
      type: 'ransomware-simulation',
      status: 'planned',
      startDate: '2026-05-10',
      endDate: '2026-05-15',
      objectives: [
        'Simulate full ransomware attack flow',
        'Test incident response capability',
        'Measure recovery time objective (RTO)',
        'Identify security gaps'
      ],
      operators: ['alpha-operator', 'delta-operator'],
      targetScope: ['192.168.2.0/24', 'File servers', 'Backup systems'],
      attackChain: [],
      iocs: [],
      metrics: { assetsCompromised: 0, detectionsTriggered: 0 }
    }
  ];

  constructor() {
    super();
    this._selectedMission = this._missions[0];
    const activeTactic = this._selectedMission.attackChain.find(t => t.status === 'in-progress');
    if (activeTactic) this._selectedTacticId = activeTactic.id;
  }

  private _getTacticColor(tactic: AttackTactic): string {
    switch (tactic.status) {
      case 'succeeded': return '#22c55e';
      case 'in-progress': return '#3b82f6';
      case 'failed': return '#ef4444';
      case 'blocked': return '#f97316';
      default: return '#6b7280';
    }
  }

  private _getOverallProgress(): number {
    if (!this._selectedMission) return 0;
    const completedTactics = this._selectedMission.attackChain.filter(t => t.status === 'succeeded').length;
    return Math.round((completedTactics / this._selectedMission.attackChain.length) * 100);
  }

  private _getSelectedTactic(): AttackTactic | undefined {
    return this._selectedMission?.attackChain.find(t => t.id === this._selectedTacticId);
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
        record.itemsScanned = this._items.length;
        record.findings = this._items.filter((x: any) => x.risk && x.risk !== 'low').length;
        record.criticalCount = this._items.filter((x: any) => x.risk === 'critical').length;
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
    this._items.forEach((item: any) => { const r = item.risk; if (riskDist[r] !== undefined) riskDist[r]++; else riskDist.medium++; });
    const total = this._items.length || 1;
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
    const data = this._items.slice(0, 10).map((item: any, i: number) => ({ name: (item.name || item.title || item.id || 'Item ' + i).substring(0, 8), score: ({critical: 10, high: 7, medium: 4, low: 1}}}}) as any)[item.risk]) || 2, risk: item.risk || 'medium' }));
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
        <span>${this._items.length} items | ${this._auditTrail.length} audit entries</span>
      </div>
    </div>`;
  }


  render() {
    if (!this._selectedMission) {
      return html`<div class="panel"><div class="empty-state">No mission selected</div></div>`;
    }

    const overallProgress = this._getOverallProgress();
    const selectedTactic = this._getSelectedTactic();
    const detectedIocs = this._selectedMission.iocs.filter(i => i.detected).length;
    const totalIocs = this._selectedMission.iocs.length;

    return html`
      <div class="panel">
        <div class="pt">
          🎯 Red Team Operations
          <span class="status-badge status-${this._selectedMission.status}">
            ${this._selectedMission.status.replace('-', ' ').toUpperCase()}
          </span>
        </div>

        <div class="mission-header">
          <div class="mission-info">
            <h2>
              ${this._selectedMission.name}
              <span class="codename">CODENAME: ${this._selectedMission.codename}</span>
            </h2>
            <div class="mission-meta">
              <span class="type-badge">${this._selectedMission.type.replace(/-/g, ' ').toUpperCase()}</span>
              <span>Period: ${this._selectedMission.startDate} - ${this._selectedMission.endDate}</span>
              <span>Operators: ${this._selectedMission.operators.join(', ')}</span>
              <span>Progress: ${overallProgress}%</span>
            </div>
          </div>
          <div class="controls">
            ${this._missions.map(m => html`
              <button class="btn ${m.id === this._selectedMission.id ? 'active' : ''}" @click=${() => {
                this._selectedMission = m;
                const activeTactic = m.attackChain.find(t => t.status === 'in-progress');
                this._selectedTacticId = activeTactic ? activeTactic.id : m.attackChain[0]?.id || null;
              }>
                ${m.codename}
              </button>
            `)}
            <button class="btn success">▶ Start Mission</button>
            <button class="btn">⏸ Pause</button>
            <button class="btn danger">⏹ Abort</button>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value success">${this._selectedMission.metrics.assetsCompromised}</div>
            <div class="metric-label">Assets Compromised</div>
          </div>
          <div class="metric-card">
            <div class="metric-value warning">${this._selectedMission.metrics.detectionsTriggered}</div>
            <div class="metric-label">Detections Triggered</div>
          </div>
          <div class="metric-card">
            <div class="metric-value danger">${detectedIocs}/${totalIocs}</div>
            <div class="metric-label">IOCs Detected</div>
          </div>
          <div class="metric-card">
            <div class="metric-value info">${this._selectedMission.metrics.initialAccessTime || '-'}</div>
            <div class="metric-label">Initial Access Time</div>
          </div>
          <div class="metric-card">
            <div class="metric-value warning">${this._selectedMission.metrics.firstPrivEscTime || '-'}</div>
            <div class="metric-label">First PrivEsc Time</div>
          </div>
          <div class="metric-card">
            <div class="metric-value danger">${this._selectedMission.metrics.domainAdminTime || '-'}</div>
            <div class="metric-label">Domain Admin Time</div>
          </div>
          <div class="metric-card">
            <div class="metric-value info">${this._selectedMission.metrics.exfiltratedDataSize ? `${this._selectedMission.metrics.exfiltratedDataSize} MB` : '-'}</div>
            <div class="metric-label">Data Exfiltrated</div>
          </div>
        </div>

        <div class="attack-chain-container">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">MITRE ATT&CK® Kill Chain</h3>
          <div class="attack-chain">
            ${this._selectedMission.attackChain.map(tactic => html`
              <div 
                class="tactic-card ${this._selectedTacticId === tactic.id ? 'active' : ''}"
                @click=${() => this._selectedTacticId = tactic.id}
              >
                <div class="tactic-name">${tactic.name}</div>
                <div class="tactic-status-badge status-${tactic.status}">
                  ${tactic.status.replace('-', ' ').toUpperCase()}
                </div>
                <div class="tactic-progress">
                  <div class="tactic-progress-fill" style="width: ${tactic.successRate}%; background: ${this._getTacticColor(tactic)}"></div>
                </div>
                <div class="tactic-meta">
                  <div>Success: ${tactic.successRate}%</div>
                  <div>Operator: <span class="operator">${tactic.operator}</span></div>
                </div>
              </div>
            `)}
          </div>
        </div>

        <div class="content-tabs">
          <button class="tab-btn ${this._activeTab === 'techniques' ? 'active' : ''}" @click=${() => this._activeTab = 'techniques'}>
            🛠️ Techniques
          </button>
          <button class="tab-btn ${this._activeTab === 'iocs' ? 'active' : ''}" @click=${() => this._activeTab = 'iocs'}>
            🚩 IOCs
          </button>
          <button class="tab-btn ${this._activeTab === 'timeline' ? 'active' : ''}" @click=${() => this._activeTab = 'timeline'}>
            📅 Timeline
          </button>
        </div>

        <div class="tab-content ${this._activeTab === 'techniques' ? 'active' : ''}">
          ${selectedTactic ? html`
            <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">
              ${selectedTactic.name} Techniques (${selectedTactic.techniques.filter(t => t.status === 'succeeded').length}/${selectedTactic.techniques.length} succeeded)
            </h3>
            <div class="techniques-list">
              ${selectedTactic.techniques.length > 0 ? selectedTactic.techniques.map(technique => html`
                <div class="technique-item">
                  <div class="technique-status status-${technique.status}-bg"></div>
                  <div class="technique-info">
                    <div class="technique-name">${technique.name}</div>
                    <div class="technique-desc">${technique.description}</div>
                    <div class="technique-meta">
                      ${technique.cve ? html`<span class="cve-tag">${technique.cve}</span>` : nothing}
                      <span>Status: ${technique.status.replace('-', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              `) : html`<div class="empty-state">No techniques defined for this tactic</div>`}
            </div>
          ` : html`<div class="empty-state">Select a tactic to view techniques</div>`}
        </div>

        <div class="tab-content ${this._activeTab === 'iocs' ? 'active' : ''}">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">
            Indicators of Compromise (${this._selectedMission.iocs.length} total, ${detectedIocs} detected)
          </h3>
          <div class="iocs-grid">
            ${this._selectedMission.iocs.length > 0 ? this._selectedMission.iocs.map(ioc => html`
              <div class="ioc-card">
                <div class="ioc-header">
                  <span class="ioc-type ioc-type-${ioc.type}">${ioc.type}</span>
                  <span class="ioc-detected ${ioc.detected ? 'detected-yes' : 'detected-no'}">
                    ${ioc.detected ? 'DETECTED' : 'UNDETECTED'}
                  </span>
                </div>
                <div class="ioc-value">${ioc.value}</div>
                <div class="ioc-desc">${ioc.description}</div>
                <div class="ioc-meta">
                  <span>Used in: ${ioc.usedIn}</span>
                  ${ioc.firstSeen ? html`<span>First seen: ${ioc.firstSeen}</span>` : nothing}
                </div>
              </div>
            `) : html`<div class="empty-state">No IOCs recorded for this mission</div>`}
          </div>
        </div>

        <div class="tab-content ${this._activeTab === 'timeline' ? 'active' : ''}">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">Mission Timeline</h3>
          <div class="timeline-container">
            <div class="timeline-item">
              <div class="timeline-dot success"></div>
              <div class="timeline-time">2026-04-20 09:00</div>
              <div class="timeline-title">Mission Start: DARK STORM</div>
              <div class="timeline-desc">Red team operation officially started, all operators assigned, scope confirmed</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot success"></div>
              <div class="timeline-time">2026-04-20 12:00</div>
              <div class="timeline-title">Reconnaissance Phase Completed</div>
              <div class="timeline-desc">OSINT collected, scanning completed, critical vulnerability CVE-2026-1234 discovered on public web server</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot success"></div>
              <div class="timeline-time">2026-04-20 14:23</div>
              <div class="timeline-title">Initial Access Achieved</div>
              <div class="timeline-desc">Successfully exploited CVE-2026-1234 on prod-web-01, gained shell access. Total time to initial access: 23 minutes</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot success"></div>
              <div class="timeline-time">2026-04-20 14:30</div>
              <div class="timeline-title">Phishing Campaign Results</div>
              <div class="timeline-desc">230 phishing emails sent, 18 clicks, 7 malware executions, 5 workstations compromised</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot success"></div>
              <div class="timeline-time">2026-04-20 15:45</div>
              <div class="timeline-title">Persistence Established</div>
              <div class="timeline-desc">Registry run keys and scheduled tasks created on 4 compromised hosts to maintain access</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot warning"></div>
              <div class="timeline-time">2026-04-20 15:50</div>
              <div class="timeline-title">Detection Triggered</div>
              <div class="timeline-desc">Phishing domain update-verify-service.com detected by DNS security controls, 3 IOCs flagged</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot warning"></div>
              <div class="timeline-time">2026-04-20 16:05</div>
              <div class="timeline-title">Account Creation Attempt Blocked</div>
              <div class="timeline-desc">Attempt to create local admin account on prod-web-01 detected and blocked by EDR</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot success"></div>
              <div class="timeline-time">2026-04-21 09:15</div>
              <div class="timeline-title">Privilege Escalation Success</div>
              <div class="timeline-desc">Escalated to local admin on 3 workstations, dumped 23 NTLM hashes from local SAM databases</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-dot info"></div>
              <div class="timeline-time">2026-04-21 11:30 (Now)</div>
              <div class="timeline-title">Pass-the-Hash Attempt in Progress</div>
              <div class="timeline-desc">Attempting to reuse recovered NTLM hashes to access domain resources and move laterally</div>
            </div>
          </div>
        </div>
      </div>
      </div>
      <div style="margin-top:12px;display:flex;justify-content:center">
        <button class="btn btn-sm ${this._showEnhanced ? 'btn-primary' : 'btn-secondary'}" @click=${() => {{ this._showEnhanced = !this._showEnhanced; this.requestUpdate(); }}>${this._showEnhanced ? 'Hide' : 'Show'} Advanced</button>
      </div>
      ${this._renderEnhancedSection()}
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-redteam-operations': ScRedteamOperations; } }
