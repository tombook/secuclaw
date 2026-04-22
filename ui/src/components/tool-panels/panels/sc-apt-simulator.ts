/**
 * sc-apt-simulator.ts - APT Campaign Simulator (Security Ops Dark Capability)
 * APT group profiling, campaign planning, kill chain execution, TTP mapping,
 * timeline management, IOC generation, attribution analysis
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

type Phase = 'reconnaissance' | 'weaponization' | 'delivery' | 'exploitation' | 'installation' | 'command-control' | 'actions-objectives';
type CampaignStatus = 'planning' | 'active' | 'paused' | 'completed' | 'detected' | 'failed';
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface APTProfile {
  id: string; name: string; alias: string; origin: string; sophistication: 'advanced' | 'intermediate' | 'basic';
  motivation: 'espionage' | 'financial' | 'sabotage' | 'activism' | 'nation-state';
  targets: string[]; knownTools: string[]; mitreGroups: string[];
}

interface TTP {
  id: string; tactic: string; techniqueId: string; techniqueName: string;
  description: string; platform: string[]; detectability: number;
}

interface CampaignPhase {
  phase: Phase; status: 'pending' | 'in-progress' | 'completed' | 'skipped' | 'detected';
  ttps: TTP[]; startedAt: string; completedAt: string; output: string[]; detectionRisk: number;
}

interface IOC {
  type: 'ip' | 'domain' | 'hash' | 'url' | 'email' | 'mutex' | 'registry' | 'file';
  value: string; description: string; confidence: number; phase: Phase;
}

interface CampaignConfig {
  targetOrg: string; targetSector: string; aptProfile: string; objective: string;
  duration: number; stealthLevel: number; persistenceDays: number; exfilMethod: string;
  initialAccess: string; c2Infrastructure: string;
}

interface CampaignResult {
  id: string; config: CampaignConfig; phases: CampaignPhase[]; iocs: IOC[];
  startedAt: string; completedAt: string; status: CampaignStatus; totalRisk: number;
  attributionConfidence: number;
}

const APT_GROUPS: APTProfile[] = [
  { id: 'apt29', name: 'APT29', alias: 'Cozy Bear', origin: 'Russia', sophistication: 'advanced', motivation: 'espionage', targets: ['Government', 'Think tanks', 'Technology'], knownTools: ['CozyCar', 'MiniDuke', 'RegBackdoor'], mitreGroups: ['G-0016'] },
  { id: 'apt28', name: 'APT28', alias: 'Fancy Bear', origin: 'Russia', sophistication: 'advanced', motivation: 'espionage', targets: ['Government', 'Military', 'Media'], knownTools: ['XAgent', 'Sofacy', 'Zebrocy'], mitreGroups: ['G-0007'] },
  { id: 'apt41', name: 'APT41', alias: 'Double Dragon', origin: 'China', sophistication: 'advanced', motivation: 'espionage', targets: ['Healthcare', 'Telecom', 'Software Supply Chain'], knownTools: ['Mimikatz', 'PlugX', 'Gh0st RAT'], mitreGroups: ['G-0096'] },
  { id: 'lazarus', name: 'Lazarus Group', alias: 'Hidden Cobra', origin: 'North Korea', sophistication: 'advanced', motivation: 'financial', targets: ['Financial', 'Cryptocurrency', 'Defense'], knownTools: ['WannaCry', 'Destover', 'Brambul'], mitreGroups: ['G-0032'] },
  { id: 'apt33', name: 'APT33', alias: 'Elfin', origin: 'Iran', sophistication: 'intermediate', motivation: 'espionage', targets: ['Energy', 'Aerospace', 'Business'], knownTools: ['Shamoon', 'StoneDrill', 'TurnedUp'], mitreGroups: ['G-0064'] },
  { id: 'darkhotel', name: 'Darkhotel', alias: 'Dubious Panda', origin: 'South Korea', sophistication: 'intermediate', motivation: 'espionage', targets: ['Hospitality', 'Government', 'Executive'], knownTools: ['Inexsmar', 'Memtime', 'Romber'], mitreGroups: ['G-0012'] },
];

const PHASE_TTPS: Record<Phase, TTP[]}> = {
  'reconnaissance': [
    { id: 't1', tactic: 'Reconnaissance', techniqueId: 'T1595', techniqueName: 'Active Scanning', description: 'Scan target infrastructure for open ports, services, and vulnerabilities', platform: ['Windows', 'Linux'], detectability: 60 },
    { id: 't2', tactic: 'Reconnaissance', techniqueId: 'T1593', techniqueName: 'Search Open Websites/Domains', description: 'Gather OSINT from public sources, LinkedIn, job postings, domain registrations', platform: ['Windows', 'Linux', 'macOS'], detectability: 20 },
    { id: 't3', tactic: 'Reconnaissance', techniqueId: 'T1589', techniqueName: 'Gather Victim Identity Information', description: 'Collect employee emails, org charts, and social media profiles for spear phishing', platform: ['Windows', 'Linux', 'macOS'], detectability: 15 },
    { id: 't4', tactic: 'Reconnaissance', techniqueId: 'T1592', techniqueName: 'Gather Victim Host Information', description: 'Enumerate host systems, software versions, and network topology', platform: ['Windows', 'Linux'], detectability: 45 },
  ],
  'weaponization': [
    { id: 't5', tactic: 'Resource Development', techniqueId: 'T1588', techniqueName: 'Obtain Capabilities', description: 'Acquire or develop malware tools, exploits, and infrastructure', platform: ['Windows', 'Linux'], detectability: 30 },
    { id: 't6', tactic: 'Resource Development', techniqueId: 'T1608', techniqueName: 'Stage Capabilities', description: 'Prepare staging infrastructure, payload encoding, delivery mechanisms', platform: ['Windows', 'Linux'], detectability: 25 },
    { id: 't7', tactic: 'Resource Development', techniqueId: 'T1564', techniqueName: 'Hide Artifacts', description: 'Implement obfuscation, encryption, and anti-analysis techniques', platform: ['Windows', 'Linux', 'macOS'], detectability: 35 },
  ],
  'delivery': [
    { id: 't8', tactic: 'Initial Access', techniqueId: 'T1566', techniqueName: 'Phishing', description: 'Send spear phishing emails with malicious attachments or links', platform: ['Windows', 'Linux', 'macOS'], detectability: 55 },
    { id: 't9', tactic: 'Initial Access', techniqueId: 'T1190', techniqueName: 'Exploit Public-Facing Application', description: 'Exploit vulnerable web applications or services', platform: ['Windows', 'Linux'], detectability: 70 },
    { id: 't10', tactic: 'Initial Access', techniqueId: 'T1078', techniqueName: 'Valid Accounts', description: 'Use compromised or purchased valid credentials', platform: ['Windows', 'Linux', 'macOS'], detectability: 25 },
    { id: 't11', tactic: 'Initial Access', techniqueId: 'T1195', techniqueName: 'Supply Chain Compromise', description: 'Compromise software supply chain or update mechanisms', platform: ['Windows', 'Linux'], detectability: 40 },
  ],
  'exploitation': [
    { id: 't12', tactic: 'Execution', techniqueId: 'T1059', techniqueName: 'Command and Scripting Interpreter', description: 'Execute PowerShell, Python, or shell scripts on target', platform: ['Windows', 'Linux', 'macOS'], detectability: 65 },
    { id: 't13', tactic: 'Execution', techniqueId: 'T1203', techniqueName: 'Exploitation for Client Execution', description: 'Exploit office documents, PDFs, or browser vulnerabilities', platform: ['Windows', 'macOS'], detectability: 55 },
    { id: 't14', tactic: 'Defense Evasion', techniqueId: 'T1055', techniqueName: 'Process Injection', description: 'Inject code into legitimate processes for stealth execution', platform: ['Windows', 'Linux'], detectability: 45 },
  ],
  'installation': [
    { id: 't15', tactic: 'Persistence', techniqueId: 'T1053', techniqueName: 'Scheduled Task/Job', description: 'Create scheduled tasks or cron jobs for persistence', platform: ['Windows', 'Linux'], detectability: 50 },
    { id: 't16', tactic: 'Persistence', techniqueId: 'T1547', techniqueName: 'Boot or Logon Autostart', description: 'Modify registry, startup items, or init scripts for persistence', platform: ['Windows', 'Linux', 'macOS'], detectability: 45 },
    { id: 't17', tactic: 'Persistence', techniqueId: 'T1543', techniqueName: 'Create or Modify System Process', description: 'Create Windows services or systemd units for persistence', platform: ['Windows', 'Linux'], detectability: 55 },
    { id: 't18', tactic: 'Privilege Escalation', techniqueId: 'T1068', techniqueName: 'Exploitation for Privilege Escalation', description: 'Exploit local vulnerabilities for privilege escalation', platform: ['Windows', 'Linux'], detectability: 60 },
  ],
  'command-control': [
    { id: 't19', tactic: 'Command and Control', techniqueId: 'T1071', techniqueName: 'Application Layer Protocol', description: 'Use HTTP/HTTPS, DNS, or other protocols for C2 communication', platform: ['Windows', 'Linux', 'macOS'], detectability: 50 },
    { id: 't20', tactic: 'Command and Control', techniqueId: 'T1573', techniqueName: 'Encrypted Channel', description: 'Use TLS/SSL with custom certificates for encrypted C2', platform: ['Windows', 'Linux', 'macOS'], detectability: 30 },
    { id: 't21', tactic: 'Command and Control', techniqueId: 'T1008', techniqueName: 'Fallback Channels', description: 'Maintain multiple C2 channels for redundancy', platform: ['Windows', 'Linux'], detectability: 35 },
  ],
  'actions-objectives': [
    { id: 't22', tactic: 'Collection', techniqueId: 'T1005', techniqueName: 'Data from Local System', description: 'Collect sensitive data from local files, databases, and registries', platform: ['Windows', 'Linux'], detectability: 40 },
    { id: 't23', tactic: 'Exfiltration', techniqueId: 'T1048', techniqueName: 'Exfiltration Over Alternative Protocol', description: 'Exfiltrate data via DNS tunneling, ICMP, or other covert channels', platform: ['Windows', 'Linux'], detectability: 35 },
    { id: 't24', tactic: 'Impact', techniqueId: 'T1486', techniqueName: 'Data Encrypted for Impact', description: 'Encrypt files for ransomware or destructive purposes', platform: ['Windows', 'Linux'], detectability: 70 },
    { id: 't25', tactic: 'Collection', techniqueId: 'T1114', techniqueName: 'Email Collection', description: 'Collect email communications and attachments from mail servers', platform: ['Windows', 'Linux'], detectability: 30 },
  ],
};

const PHASE_ORDER: Phase[] = ['reconnaissance', 'weaponization', 'delivery', 'exploitation', 'installation', 'command-control', 'actions-objectives'];
const PHASE_LABELS: Record<Phase, string> = {
  'reconnaissance': '1. Reconnaissance', 'weaponization': '2. Weaponization', 'delivery': '3. Delivery',
  'exploitation': '4. Exploitation', 'installation': '5. Installation', 'command-control': '6. C2', 'actions-objectives': '7. Actions'
};

@customElement('sc-apt-simulator')
export class ScAptSimulator extends LitElement {
  @property({ type: String }) panelId = 'apt-simulator';
  @state() private _config: CampaignConfig = {
    targetOrg: '', targetSector: 'Technology', aptProfile: 'apt29', objective: 'espionage',
    duration: 90, stealthLevel: 7, persistenceDays: 30, exfilMethod: 'https-encrypted',
    initialAccess: 'phishing', c2Infrastructure: 'domain-fronting',
  };
  @state() private _campaigns: CampaignResult[] = [];
  @state() private _activeCampaign: CampaignResult | null = null;
  @state() private _status: CampaignStatus = 'planning';
  @state() private _progress = 0;
  @state() private _activeTab: 'plan' | 'execute' | 'results' | 'history' | 'attribution' = 'plan';
  @state() private _output: string[] = [];
  @state() private _expandedPhase: Phase | null = null;
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
    .badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .badge-planning { background: #1e3a5f; color: #60a5fa; }
    .badge-active { background: #1e3a2f; color: #34d399; }
    .badge-detected { background: #3a1e1e; color: #f87171; }
    .badge-completed { background: #3a3a1e; color: #fbbf24; }
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #2a2d3a; flex-wrap: wrap; }
    .tab { padding: 8px 16px; cursor: pointer; border: none; background: none; color: #6b7280; font-size: 13px; font-weight: 500; border-bottom: 2px solid transparent; }
    .tab:hover { color: #d1d5db; }
    .tab.active { color: #e2e8f0; border-bottom-color: #3b82f6; }
    .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; font-family: inherit; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-danger:hover:not(:disabled) { background: #b91c1c; }
    .btn-secondary { background: #374151; color: #d1d5db; }
    .btn-sm { padding: 4px 10px; font-size: 11px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full { grid-column: 1 / -1; }
    label { font-size: 12px; color: #9ca3af; font-weight: 500; }
    input, select, textarea { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 6px; padding: 8px 12px; color: #e2e8f0; font-size: 13px; outline: none; font-family: inherit; }
    input:focus, select:focus, textarea:focus { border-color: #3b82f6; }
    textarea { resize: vertical; min-height: 60px; }
    .progress-bar { width: 100%; height: 8px; background: #1a1d27; border-radius: 4px; overflow: hidden; margin: 12px 0; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6, #dc2626); border-radius: 4px; transition: width 0.5s; }
    .kill-chain { display: flex; gap: 4px; margin: 16px 0; flex-wrap: wrap; }
    .chain-node { flex: 1; min-width: 100px; padding: 10px 12px; border-radius: 8px; text-align: center; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
    .chain-node.pending { background: #1a1d27; color: #6b7280; border-color: #2a2d3a; }
    .chain-node.in-progress { background: #1e3a5f; color: #60a5fa; border-color: #3b82f6; animation: pulse 1.5s infinite; }
    .chain-node.completed { background: #1e3a2f; color: #34d399; border-color: #10b981; }
    .chain-node.detected { background: #3a1e1e; color: #f87171; border-color: #dc2626; }
    .chain-node.skipped { background: #1a1d27; color: #4b5563; border-color: #1f2937; text-decoration: line-through; }
    .chain-node:hover { transform: translateY(-2px); }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
    .phase-detail { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .phase-title { font-weight: 700; font-size: 14px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; }
    .ttp-item { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 6px; font-size: 12px; margin-bottom: 4px; background: #0f1117; }
    .ttp-id { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #60a5fa; min-width: 60px; }
    .ttp-name { font-weight: 600; flex: 1; }
    .ttp-det { font-size: 10px; padding: 2px 6px; border-radius: 4px; }
    .ttp-det-high { background: #3a1e1e; color: #f87171; }
    .ttp-det-med { background: #3a3a1e; color: #fbbf24; }
    .ttp-det-low { background: #1e3a2f; color: #34d399; }
    .output-box { background: #0a0c10; border: 1px solid #1a1d27; border-radius: 8px; padding: 12px; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.6; max-height: 350px; overflow-y: auto; white-space: pre-wrap; }
    .output-info { color: #60a5fa; }
    .output-success { color: #34d399; }
    .output-error { color: #f87171; }
    .output-warn { color: #fbbf24; }
    .ioc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 8px; }
    .ioc-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 10px 12px; font-size: 12px; }
    .ioc-type { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #374151; color: #d1d5db; font-weight: 600; text-transform: uppercase; }
    .ioc-value { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #f87171; word-break: break-all; margin-top: 4px; }
    .ioc-desc { color: #9ca3af; margin-top: 4px; }
    .history-item { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: all 0.2s; }
    .history-item:hover { border-color: #3b82f6; }
    .history-title { font-weight: 600; font-size: 13px; margin-bottom: 4px; }
    .history-meta { font-size: 11px; color: #9ca3af; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .stat { background: #1a1d27; border-radius: 8px; padding: 12px; text-align: center; }
    .stat-value { font-size: 24px; font-weight: 700; }
    .stat-label { font-size: 11px; color: #9ca3af; margin-top: 2px; }
    .apt-select-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; margin-bottom: 16px; }
    .apt-card { background: #1a1d27; border: 2px solid #2a2d3a; border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.2s; }
    .apt-card:hover { border-color: #3b82f6; }
    .apt-card.selected { border-color: #3b82f6; background: #1e293b; }
    .apt-name { font-weight: 700; font-size: 13px; }
    .apt-alias { font-size: 11px; color: #9ca3af; }
    .apt-meta { font-size: 10px; color: #6b7280; margin-top: 4px; }
    .attribution-bar { display: flex; height: 24px; border-radius: 6px; overflow: hidden; margin: 8px 0; }
    .attr-segment { display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; transition: width 0.5s; }
    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    .btn-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
      .kill-chain { flex-direction: column; }
      .chain-node { min-width: auto; }
    }
    .sla-bar { display: flex; align-items: center; gap: 12px; background: #1f2937; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
    .sla-indicator { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  `;

  private _getAptProfile(): APTProfile {
    return APT_GROUPS.find(g => g.id === this._config.aptProfile) || APT_GROUPS[0];
  }

  private _generateIOCs(profile: APTProfile, phases: Phase[]): IOC[] {
    const iocs: IOC[] = [];
    const randHex = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    const randIp = () => `${Math.floor(Math.random() * 200) + 10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    const randDomain = () => `${['cdn', 'api', 'static', 'update', 'service', 'assets'][Math.floor(Math.random() * 6)]}-${randHex(4)}.com`;
    const randHash = () => randHex(32).toUpperCase();
    phases.forEach(phase => {
      if (phase === 'command-control') {
        iocs.push({ type: 'ip', value: randIp(), description: 'C2 server IP address', confidence: 85, phase });
        iocs.push({ type: 'domain', value: randDomain(), description: 'C2 domain with DGA pattern', confidence: 80, phase });
        iocs.push({ type: 'ip', value: randIp(), description: 'C2 fallback server', confidence: 70, phase });
      } else if (phase === 'delivery') {
        iocs.push({ type: 'email', value: `support@${randDomain()}`, description: 'Phishing sender email', confidence: 75, phase });
        iocs.push({ type: 'url', value: `https://${randDomain()}/update/${randHex(8)}`, description: 'Malicious download URL', confidence: 80, phase });
      } else if (phase === 'installation') {
        iocs.push({ type: 'hash', value: randHash(), description: 'Dropper payload SHA256', confidence: 95, phase });
        iocs.push({ type: 'registry', value: 'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\svchost_update', description: 'Persistence registry key', confidence: 90, phase });
        iocs.push({ type: 'mutex', value: `Global\\${randHex(16)}`, description: 'Malware mutex name', confidence: 85, phase });
      } else if (phase === 'exploitation') {
        iocs.push({ type: 'hash', value: randHash(), description: 'Initial payload SHA256', confidence: 95, phase });
        iocs.push({ type: 'file', value: 'C:\\Users\\Public\\libcrypto.dll', description: 'DLL side-loading payload', confidence: 80, phase });
      } else if (phase === 'actions-objectives') {
        iocs.push({ type: 'domain', value: `cloud.${randDomain()}`, description: 'Exfiltration endpoint', confidence: 75, phase });
        iocs.push({ type: 'hash', value: randHash(), description: 'Data staging tool SHA256', confidence: 90, phase });
      }
    });
    return iocs;
  }

  private _calculateAttribution(profile: APTProfile, stealth: number): number {
    let conf = 60 + (profile.sophistication === 'advanced' ? 20 : 10);
    conf -= stealth * 3;
    return Math.max(15, Math.min(95, Math.round(conf + (Math.random() - 0.5) * 20)));
  }

  private _executeCampaign(): void {
    if (!this._config.targetOrg.trim()) return;
    const profile = this._getAptProfile();
    const phases: CampaignPhase[] = PHASE_ORDER.map(phase => ({
      phase, status: 'pending' as const, ttps: PHASE_TTPS[phase],
      startedAt: '', completedAt: '', output: [], detectionRisk: 0,
    }));
    const campaign: CampaignResult = {
      id: 'APT-' + Date.now().toString(36).toUpperCase(),
      config: { ...this._config },
      phases, iocs: [],
      startedAt: new Date().toISOString(),
      completedAt: '', status: 'active', totalRisk: 0,
      attributionConfidence: this._calculateAttribution(profile, this._config.stealthLevel),
    };
    this._activeCampaign = campaign;
    this._status = 'active';
    this._output = [];
    this._activeTab = 'execute';
    this._progress = 0;
    this._output.push(`[*] APT Campaign ${campaign.id} initiated`);
    this._output.push(`[*] Threat Actor: ${profile.name} (${profile.alias})`);
    this._output.push(`[*] Target: ${this._config.targetOrg} (${this._config.targetSector})`);
    this._output.push(`[*] Objective: ${this._config.objective}`);
    this._output.push(`[*] Sophistication: ${profile.sophistication} | Motivation: ${profile.motivation}`);
    this._output.push('');

    let phaseIdx = 0;
    const executePhase = () => {
      if (phaseIdx >= phases.length) {
        campaign.completedAt = new Date().toISOString();
        const detected = Math.random() > (this._config.stealthLevel / 10);
        campaign.status = detected ? 'detected' : 'completed';
        this._status = campaign.status;
        campaign.totalRisk = Math.round(phases.reduce((s, p) => s + p.detectionRisk, 0) / phases.length);
        campaign.iocs = this._generateIOCs(profile, PHASE_ORDER.filter((_, i) => phases[i].status === 'completed'));
        this._campaigns = [campaign, ...this._campaigns].slice(0, 20);
        this._output.push('');
        this._output.push(detected ? '[!] CAMPAIGN DETECTED BY DEFENDER' : '[+] CAMPAIGN COMPLETED SUCCESSFULLY');
        this._output.push(`[*] Total detection risk: ${campaign.totalRisk}%`);
        this._output.push(`[*] Attribution confidence: ${campaign.attributionConfidence}%`);
        this._output.push(`[*] IOCs generated: ${campaign.iocs.length}`);
        this.requestUpdate();
        return;
      }
      const phase = phases[phaseIdx];
      phase.status = 'in-progress';
      phase.startedAt = new Date().toISOString();
      this._expandedPhase = phase.phase;
      this._progress = Math.round(((phaseIdx) / phases.length) * 100);
      this._output.push(`[*] === Phase: ${PHASE_LABELS[phase.phase]} ===`);
      const selectedTtps = phase.ttps.slice(0, 1 + Math.floor(Math.random() * 2));
      const stealthMod = this._config.stealthLevel / 10;
      let stepIdx = 0;
      const executeStep = () => {
        if (stepIdx >= selectedTtps.length) {
          const detected = Math.random() > stealthMod;
          phase.status = detected ? 'detected' : 'completed';
          phase.completedAt = new Date().toISOString();
          phase.detectionRisk = Math.round(selectedTtps.reduce((s, t) => s + t.detectability, 0) / selectedTtps.length * (1 - stealthMod * 0.3));
          phase.output = selectedTtps.map(t => `[T${t.techniqueId}] ${t.techniqueName}: ${t.description}`);
          this._output.push(detected ? '  [!] Phase detected by defender!' : '  [+] Phase completed successfully');
          this._output.push('');
          this.requestUpdate();
          phaseIdx++;
          setTimeout(executePhase, 800 + Math.random() * 400);
          return;
        }
        const ttp = selectedTtps[stepIdx];
        this._output.push(`  [*] Executing ${ttp.techniqueId} - ${ttp.techniqueName}`);
        this._output.push(`    ${ttp.description}`);
        if (Math.random() > 0.2) {
          this._output.push(`    [+] Technique executed successfully`);
        } else {
          this._output.push(`    [!] Minor issue, retrying...`);
          this._output.push(`    [+] Retry successful`);
        }
        stepIdx++;
        this.requestUpdate();
        setTimeout(executeStep, 400 + Math.random() * 600);
      };
      setTimeout(executeStep, 300);
    };
    setTimeout(executePhase, 500);
  }

  private _exportReport(campaign: CampaignResult): void {
    const profile = this._getAptProfile();
    const report = {
      campaignId: campaign.id, threatActor: profile.name, alias: profile.alias,
      targetOrg: campaign.config.targetOrg, sector: campaign.config.targetSector,
      status: campaign.status, startedAt: campaign.startedAt, completedAt: campaign.completedAt,
      totalDetectionRisk: campaign.totalRisk, attributionConfidence: campaign.attributionConfidence,
      phases: campaign.phases.map(p => ({
        phase: p.phase, status: p.status, detectionRisk: p.detectionRisk,
        ttps: p.ttps.map(t => ({ techniqueId: t.techniqueId, name: t.techniqueName, detectability: t.detectability })),
      })),
      iocs: campaign.iocs.map(i => ({ type: i.type, value: i.value, description: i.description, confidence: i.confidence, phase: i.phase })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `apt-campaign-${campaign.id}.json`; a.click();
    URL.revokeObjectURL(url);
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
    const profile = this._getAptProfile();
    const campaign = this._activeCampaign;
    return html`
      <div class="panel">
        <div class="header">
          <div class="title"><span>&#x1F575;</span> APT Campaign Simulator</div>
          ${this._status !== 'planning' ? html`<span class="badge badge-${this._status}">${this._status.toUpperCase()}</span>` : nothing}
        </div>
        <div class="tabs">
          <button class="tab ${this._activeTab === 'plan' ? 'active' : ''}" @click=${() => { this._activeTab = 'plan'; }}>Campaign Planning</button>
          <button class="tab ${this._activeTab === 'execute' ? 'active' : ''}" @click=${() => { this._activeTab = 'execute'; }}>Execution</button>
          <button class="tab ${this._activeTab === 'results' ? 'active' : ''}" @click=${() => { this._activeTab = 'results'; }}>IOCs & Results</button>
          <button class="tab ${this._activeTab === 'history' ? 'active' : ''}" @click=${() => { this._activeTab = 'history'; }}>History (${this._campaigns.length})</button>
          <button class="tab ${this._activeTab === 'attribution' ? 'active' : ''}" @click=${() => { this._activeTab = 'attribution'; }}>Attribution</button>
        </div>

        ${this._activeTab === 'plan' ? html`
          <div style="font-weight:600;margin-bottom:8px">Select Threat Actor Profile:</div>
          <div class="apt-select-grid">
            ${APT_GROUPS.map(g => html`
              <div class="apt-card ${this._config.aptProfile === g.id ? 'selected' : ''}" @click=${() => { this._config.aptProfile = g.id; }}>
                <div class="apt-name">${g.name}</div>
                <div class="apt-alias">${g.alias} | ${g.origin}</div>
                <div class="apt-meta">Motivation: ${g.motivation} | Sophistication: ${g.sophistication}</div>
                <div class="apt-meta">Targets: ${g.targets.join(', ')}</div>
                <div class="apt-meta">Tools: ${g.knownTools.join(', ')}</div>
              </div>
            `)}
          </div>
          <div style="font-weight:600;margin-bottom:8px">Campaign Configuration:</div>
          <div class="form-grid">
            <div class="form-group"><label>Target Organization</label><input type="text" .value=${this._config.targetOrg} @input=${(e: Event) => { this._config.targetOrg = (e.target as HTMLInputElement).value; } placeholder="Enter target name"></div>
            <div class="form-group"><label>Target Sector</label>
              <select .value=${this._config.targetSector} @change=${(e: Event) => { this._config.targetSector = (e.target as HTMLSelectElement).value; }}>
                <option value="Technology">Technology</option><option value="Financial">Financial</option><option value="Healthcare">Healthcare</option>
                <option value="Government">Government</option><option value="Defense">Defense</option><option value="Energy">Energy</option>
                <option value="Telecom">Telecom</option><option value="Manufacturing">Manufacturing</option>
              </select>
            </div>
            <div class="form-group"><label>Primary Objective</label>
              <select .value=${this._config.objective} @change=${(e: Event) => { this._config.objective = (e.target as HTMLSelectElement).value; }}>
                <option value="espionage">Cyber Espionage</option><option value="financial">Financial Gain</option>
                <option value="sabotage">Sabotage</option><option value="supply-chain">Supply Chain Compromise</option>
                <option value="ransomware">Ransomware Deployment</option>
              </select>
            </div>
            <div class="form-group"><label>Initial Access Method</label>
              <select .value=${this._config.initialAccess} @change=${(e: Event) => { this._config.initialAccess = (e.target as HTMLSelectElement).value; }}>
                <option value="phishing">Spear Phishing</option><option value="exploit">Public-Facing Exploit</option>
                <option value="credential">Valid Credentials</option><option value="supply-chain">Supply Chain</option>
                <option value="insider">Insider Threat</option>
              </select>
            </div>
            <div class="form-group"><label>C2 Infrastructure</label>
              <select .value=${this._config.c2Infrastructure} @change=${(e: Event) => { this._config.c2Infrastructure = (e.target as HTMLSelectElement).value; }}>
                <option value="domain-fronting">Domain Fronting</option><option value="dns-tunneling">DNS Tunneling</option>
                <option value="https-beacon">HTTPS Beaconing</option><option value="tor">Tor Hidden Services</option>
                <option value="telegram">Telegram C2</option><option value="cloud-api">Cloud API C2</option>
              </select>
            </div>
            <div class="form-group"><label>Exfiltration Method</label>
              <select .value=${this._config.exfilMethod} @change=${(e: Event) => { this._config.exfilMethod = (e.target as HTMLSelectElement).value; }}>
                <option value="https-encrypted">HTTPS Encrypted</option><option value="dns-tunneling">DNS Tunneling</option>
                <option value="cloud-storage">Cloud Storage</option><option value="email">Email Exfil</option>
                <option value="steganography">Steganography</option>
              </select>
            </div>
            <div class="form-group"><label>Campaign Duration (days)</label><input type="number" min="1" max="365" .value=${String(this._config.duration)} @input=${(e: Event) => { this._config.duration = parseInt((e.target as HTMLInputElement).value) || 30; }}></div>
            <div class="form-group"><label>Stealth Level (1-10)</label><input type="number" min="1" max="10" .value=${String(this._config.stealthLevel)} @input=${(e: Event) => { this._config.stealthLevel = Math.min(10, Math.max(1, parseInt((e.target as HTMLInputElement).value) || 5)); }}></div>
            <div class="form-group"><label>Persistence Duration (days)</label><input type="number" min="1" max="365" .value=${String(this._config.persistenceDays)} @input=${(e: Event) => { this._config.persistenceDays = parseInt((e.target as HTMLInputElement).value) || 30; }}></div>
          </div>
          <div class="btn-row">
            <button class="btn btn-primary" ?disabled=${!this._config.targetOrg.trim() || this._status === 'active'} @click=${this._executeCampaign}>
              ${this._status === 'active' ? 'Campaign Running...' : 'Launch APT Campaign'}
            </button>
          </div>
        ` : nothing}

        ${this._activeTab === 'execute' ? html`
          ${campaign ? html`
            <div class="stat-grid">
              <div class="stat"><div class="stat-value" style="color:#60a5fa">${profile.name}</div><div class="stat-label">Threat Actor</div></div>
              <div class="stat"><div class="stat-value">${campaign.phases.filter(p => p.status === 'completed').length}/${PHASE_ORDER.length}</div><div class="stat-label">Phases Complete</div></div>
              <div class="stat"><div class="stat-value" style="color:${campaign.totalRisk > 60 ? '#f87171' : '#fbbf24'}">${campaign.totalRisk}%</div><div class="stat-label">Detection Risk</div></div>
              <div class="stat"><div class="stat-value" style="color:#34d399">${campaign.attributionConfidence}%</div><div class="stat-label">Attribution</div></div>
            </div>
            <div class="kill-chain">
              ${campaign.phases.map(p => html`
                <div class="chain-node ${p.status}" @click=${() => { this._expandedPhase = this._expandedPhase === p.phase ? null : p.phase; }}>
                  ${PHASE_LABELS[p.phase].split('. ')[1]}<br><span style="font-size:9px">${p.status}</span>
                </div>
              `)}
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${this._progress}%"></div></div>
            ${this._expandedPhase && campaign.phases.find(p => p.phase === this._expandedPhase) ? html`
              <div class="phase-detail">
                <div class="phase-title">${PHASE_LABELS[this._expandedPhase]} - TTPs</div>
                ${(campaign.phases.find(p => p.phase === this._expandedPhase)!.ttps).map(t => html`
                  <div class="ttp-item">
                    <span class="ttp-id">${t.techniqueId}</span>
                    <span class="ttp-name">${t.techniqueName}</span>
                    <span class="ttp-det ${t.detectability > 55 ? 'ttp-det-high' : t.detectability > 35 ? 'ttp-det-med' : 'ttp-det-low'}">${t.detectability}% detect</span>
                  </div>
                `)}
              </div>
            ` : nothing}
            ${this._output.length > 0 ? html`
              <div style="font-weight:600;margin-bottom:8px">Execution Log:</div>
              <div class="output-box">${this._output.map(l => html`<div class="${l.startsWith('[+]') ? 'output-success' : l.startsWith('[!]') ? 'output-warn' : l.startsWith('[-]') ? 'output-error' : 'output-info'}">${l}</div>`)}</div>
            ` : html`<div class="empty-state">Launch a campaign to see execution output</div>`}
          ` : html`<div class="empty-state">Plan and launch a campaign first</div>`}
        ` : nothing}

        ${this._activeTab === 'results' ? html`
          ${campaign && campaign.iocs.length > 0 ? html`
            <div style="font-weight:600;margin-bottom:8px">Generated IOCs (${campaign.iocs.length})</div>
            <div class="btn-row">
              <button class="btn btn-secondary btn-sm" @click=${() => this._exportReport(campaign)}>Export Full Report (JSON)</button>
              <button class="btn btn-secondary btn-sm" @click=${() => {
                const csv = 'Type,Value,Description,Confidence,Phase\n' + campaign.iocs.map(i => `${i.type},"${i.value}","${i.description}",${i.confidence},${i.phase}`).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url; a.download = `iocs-${campaign.id}.csv`; a.click(); URL.revokeObjectURL(url);
              }>Export IOCs (CSV)</button>
            </div>
            <div class="ioc-grid">${campaign.iocs.map(i => html`
              <div class="ioc-card">
                <span class="ioc-type">${i.type}</span>
                <div class="ioc-value">${i.value}</div>
                <div class="ioc-desc">${i.description}</div>
                <div style="margin-top:4px;font-size:10px;color:${i.confidence > 85 ? '#34d399' : i.confidence > 70 ? '#fbbf24' : '#6b7280'}">Confidence: ${i.confidence}% | Phase: ${i.phase}</div>
              </div>
            `)}</div>
          ` : html`<div class="empty-state">No IOCs yet. Complete a campaign first.</div>`}
        ` : nothing}

        ${this._activeTab === 'history' ? html`
          ${this._campaigns.length === 0 ? html`<div class="empty-state">No campaign history yet</div>` : this._campaigns.map(c => html`
            <div class="history-item" @click=${() => { this._activeCampaign = c; this._activeTab = 'execute'; }}>
              <div class="history-title">${c.id} - ${c.config.targetOrg || 'Unknown'}</div>
              <div class="history-meta">
                Actor: ${APT_GROUPS.find(g => g.id === c.config.aptProfile)?.name || c.config.aptProfile} |
                Status: <span style="color:${c.status === 'completed' ? '#34d399' : c.status === 'detected' ? '#f87171' : '#fbbf24'}">${c.status}</span> |
                Risk: ${c.totalRisk}% |
                ${c.completedAt ? new Date(c.completedAt).toLocaleString() : 'In progress'}
              </div>
            </div>
          `)}
        ` : nothing}

        ${this._activeTab === 'attribution' ? html`
          <div style="font-weight:600;margin-bottom:12px">Threat Actor Attribution Analysis</div>
          ${this._activeCampaign ? html`
            <div class="stat-grid">
              <div class="stat"><div class="stat-value" style="color:#60a5fa">${profile.name}</div><div class="stat-label">Primary Attribution</div></div>
              <div class="stat"><div class="stat-value">${profile.origin}</div><div class="stat-label">Attributed Origin</div></div>
              <div class="stat"><div class="stat-value" style="color:#fbbf24">${this._activeCampaign.attributionConfidence}%</div><div class="stat-label">Confidence Level</div></div>
              <div class="stat"><div class="stat-value">${profile.motivation}</div><div class="stat-label">Motivation</div></div>
            </div>
            <div style="font-weight:600;margin-bottom:8px">Attribution Evidence:</div>
            <div class="attribution-bar">
              ${[
                { label: 'TTPs', pct: 85, color: '#3b82f6' },
                { label: 'Infrastructure', pct: 70, color: '#8b5cf6' },
                { label: 'Tooling', pct: 60, color: '#ec4899' },
                { label: 'Language', pct: 45, color: '#f59e0b' },
                { label: 'Timing', pct: 30, color: '#10b981' },
              ].map(s => html`<div class="attr-segment" style="width:${s.pct}%;background:${s.color}">${s.label}</div>`)}
            </div>
            <div style="font-size:12px;margin-bottom:16px;color:#9ca3af">
              TTPs: ${profile.knownTools.slice(0, 3).join(', ')} | MITRE Groups: ${profile.mitreGroups.join(', ')}
            </div>
            <div style="font-weight:600;margin-bottom:8px">Known TTP Patterns:</div>
            ${PHASE_ORDER.map(phase => {
              const ttps = PHASE_TTPS[phase].slice(0, 2);
              return html`<div class="phase-detail" style="padding:8px 12px;margin-bottom:4px">
                <div style="font-size:12px;font-weight:600;margin-bottom:4px">${PHASE_LABELS[phase]}</div>
                ${ttps.map(t => html`<div style="font-size:11px;color:#9ca3af">${t.techniqueId} - ${t.techniqueName}</div>`)}
              </div>`;
            })}
          ` : html`<div class="empty-state">Run a campaign to see attribution analysis</div>`}
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
