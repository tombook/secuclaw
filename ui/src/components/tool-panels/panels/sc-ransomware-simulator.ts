/**
 * sc-ransomware-simulator — Ransomware Attack Simulator (Security Resilience Testing Component)
 * Full ransomware kill chain simulation, defense effectiveness testing, business impact assessment, backup/recovery verification
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

type SimulationStatus = 'not-started' | 'running' | 'completed' | 'failed';
type AttackPhaseStatus = 'not-started' | 'in-progress' | 'succeeded' | 'failed' | 'blocked' | 'detected';
type RecoveryTestStatus = 'passed' | 'failed' | 'warning';
type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

interface AttackPhase {
  id: string;
  name: string;
  status: AttackPhaseStatus;
  progress: number;
  startTime?: string;
  endTime?: string;
  techniques: string[];
  detectionStatus: 'undetected' | 'detected' | 'delayed-detection';
  preventionStatus: 'not-blocked' | 'blocked' | 'delayed-blocking';
  details: string;
}

interface ImpactAssessment {
  systemsEncrypted: number;
  totalFilesEncrypted: number;
  sensitiveDataExfiltrated: number; // in GB
  estimatedDowntime: number; // in hours
  estimatedRecoveryTime: number; // in hours
  estimatedFinancialLoss: number; // in USD
  businessProcessesAffected: string[];
  regulatoryImpact: string;
}

interface DefenseControl {
  id: string;
  name: string;
  type: 'prevention' | 'detection' | 'response' | 'recovery';
  effectiveness: 'effective' | 'partially-effective' | 'ineffective' | 'not-tested';
  attackPhase: string;
  comments: string;
}

interface BackupTestResult {
  id: string;
  name: string;
  type: 'full-backup' | 'incremental-backup' | 'offline-backup' | 'cloud-backup';
  status: RecoveryTestStatus;
  recoveryTime: number; // in hours
  dataLoss: number; // data lost in GB, 0 means no loss
  integrityVerified: boolean;
  details: string;
}

interface RansomwareFamily {
  id: string;
  name: string;
  aliases: string[];
  severity: SeverityLevel;
  characteristics: string[];
  knownExtortionTactics: string[];
}

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  ransomwareFamily: RansomwareFamily;
  attackVector: 'phishing' | 'exploit-public-facing' | 'compromised-credentials' | 'supply-chain' | 'insider-threat';
  targetSystems: string[];
  targetDepartments: string[];
  exfiltrationEnabled: boolean;
  doubleExtortionEnabled: boolean;
  tripleExtortionEnabled: boolean;
  lateralMovementEnabled: boolean;
}

interface SimulationRun {
  id: string;
  name: string;
  scenario: SimulationScenario;
  status: SimulationStatus;
  startTime?: string;
  endTime?: string;
  operator: string;
  attackPhases: AttackPhase[];
  impact: ImpactAssessment;
  defenseControls: DefenseControl[];
  backupTests: BackupTestResult[];
  summary: {
    overallResilienceScore: number;
    preventionEffectiveness: number;
    detectionEffectiveness: number;
    responseEffectiveness: number;
    recoveryEffectiveness: number;
    recommendations: string[];
    gapsIdentified: number;
  };
}

@customElement('sc-ransomware-simulator')
export class ScRansomwareSimulator extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #111827); border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .simulation-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .simulation-info h2 { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
    .simulation-meta { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; font-size: 12px; color: var(--text-secondary, #cbd5e1); }
    .status-badge { padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; }
    .status-not-started { background: #1e293b; color: #94a3b8; }
    .status-running { background: #431407; color: #fdba74; animation: pulse 2s infinite; }
    .status-completed { background: #052e16; color: #86efac; }
    .status-failed { background: #450a0a; color: #fca5a5; }
    .severity-badge { padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .severity-critical { background: #450a0a; color: #fca5a5; }
    .severity-high { background: #431407; color: #fdba74; }
    .severity-medium { background: #422006; color: #fde047; }
    .severity-low { background: #166534; color: #86efac; }
    .type-badge { padding: 3px 8px; border-radius: 3px; font-size: 10px; font-weight: 600; background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); text-transform: uppercase; }
    .controls { display: flex; gap: 6px; flex-wrap: wrap; }
    .btn { padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); color: var(--text-secondary, #94a3b8); transition: all 0.2s; }
    .btn.active { background: var(--accent-color, #3b82f6); color: white; border-color: var(--accent-color, #3b82f6); }
    .btn:hover { border-color: var(--accent-color, #3b82f6); color: var(--text-primary, #e2e8f0); }
    .btn.danger { background: #450a0a; border-color: #7f1d1d; color: #fca5a5; }
    .btn.danger:hover { background: #7f1d1d; }
    .btn.success { background: #052e16; border-color: #166534; color: #86efac; }
    .btn.success:hover { background: #166534; }
    .btn.warning { background: #422006; border-color: #854d0e; color: #fde047; }
    .btn.warning:hover { background: #854d0e; }
    .score-card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .score-card { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 12px; text-align: center; border: 1px solid var(--border-color, #374151); }
    .score-value { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .score-label { font-size: 11px; color: var(--text-tertiary, #94a3b8); text-transform: uppercase; font-weight: 600; }
    .score-value.excellent { color: #22c55e; }
    .score-value.good { color: #84cc16; }
    .score-value.average { color: #eab308; }
    .score-value.poor { color: #f97316; }
    .score-value.bad { color: #ef4444; }
    .kill-chain-container { margin-bottom: 20px; overflow-x: auto; padding-bottom: 8px; }
    .kill-chain { display: flex; gap: 2px; min-width: 900px; }
    .phase-card { flex: 1; min-width: 80px; background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); border-radius: 6px; padding: 8px; cursor: pointer; transition: all 0.2s; position: relative; text-align: center; }
    .phase-card:hover { border-color: var(--accent-color, #3b82f6); transform: translateY(-2px); }
    .phase-card.active { border-color: var(--accent-color, #3b82f6); background: var(--bg-primary, #111827); }
    .phase-name { font-weight: 700; font-size: 10px; margin-bottom: 6px; line-height: 1.3; }
    .phase-status-badge { position: absolute; top: 4px; right: 4px; font-size: 8px; padding: 1px 3px; border-radius: 2px; font-weight: 600; }
    .status-not-started { background: #0a0e17; color: #6b7280; }
    .status-in-progress { background: #1e3a8a; color: #93c5fd; animation: pulse 2s infinite; }
    .status-succeeded { background: #052e16; color: #86efac; }
    .status-failed { background: #450a0a; color: #fca5a5; }
    .status-blocked { background: #15803d; color: #86efac; }
    .status-detected { background: #1e40af; color: #93c5fd; }
    .phase-progress { height: 4px; background: var(--bg-tertiary, #0a0e17); border-radius: 2px; margin-bottom: 6px; overflow: hidden; }
    .phase-progress-fill { height: 100%; border-radius: 2px; }
    .phase-detection-status { font-size: 8px; font-weight: 600; margin-top: 4px; text-transform: uppercase; }
    .detection-undetected { color: #ef4444; }
    .detection-detected { color: #22c55e; }
    .detection-delayed-detection { color: #eab308; }
    .content-tabs { display: flex; gap: 0; margin-bottom: 12px; border-bottom: 1px solid var(--border-color, #374151); }
    .tab-btn { padding: 6px 16px; font-size: 12px; font-weight: 600; border: none; background: transparent; color: var(--text-secondary, #94a3b8); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .tab-btn.active { color: var(--accent-color, #3b82f6); border-bottom-color: var(--accent-color, #3b82f6); }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .impact-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .impact-card { background: var(--bg-tertiary, #0a0e17); border-radius: 6px; padding: 10px; }
    .impact-value { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
    .impact-value.critical { color: #ef4444; }
    .impact-value.high { color: #f97316; }
    .impact-value.medium { color: #eab308; }
    .impact-value.low { color: #22c55e; }
    .impact-label { font-size: 10px; color: var(--text-tertiary, #94a3b8); text-transform: uppercase; font-weight: 600; }
    .impact-desc { font-size: 11px; color: var(--text-secondary, #cbd5e1); margin-top: 4px; }
    .controls-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 8px; max-height: 400px; overflow-y: auto; }
    .control-item { background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); border-radius: 6px; padding: 10px 12px; }
    .control-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .control-name { font-weight: 600; font-size: 13px; }
    .control-type { font-size: 9px; padding: 1px 4px; border-radius: 2px; text-transform: uppercase; font-weight: 600; background: var(--bg-tertiary, #0a0e17); }
    .control-effectiveness { padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .effectiveness-effective { background: #052e16; color: #86efac; }
    .effectiveness-partially-effective { background: #422006; color: #fde047; }
    .effectiveness-ineffective { background: #450a0a; color: #fca5a5; }
    .effectiveness-not-tested { background: #1e293b; color: #94a3b8; }
    .control-phase { font-size: 10px; color: var(--text-tertiary, #94a3b8); margin-bottom: 6px; }
    .control-details { font-size: 11px; color: var(--text-secondary, #cbd5e1); }
    .backup-tests-list { display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; }
    .backup-test-item { background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); border-radius: 6px; padding: 10px 12px; }
    .backup-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .backup-name { font-weight: 600; font-size: 13px; }
    .backup-status { padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .status-passed { background: #052e16; color: #86efac; }
    .status-failed { background: #450a0a; color: #fca5a5; }
    .status-warning { background: #422006; color: #fde047; }
    .backup-metrics { display: flex; gap: 16px; font-size: 11px; color: var(--text-secondary, #cbd5e1); margin-bottom: 6px; }
    .backup-details { font-size: 11px; color: var(--text-secondary, #cbd5e1); }
    .recommendations-list { display: flex; flex-direction: column; gap: 8px; }
    .recommendation-card { background: var(--bg-secondary, #1f2937); border-left: 4px solid #ef4444; border-radius: 0 6px 6px 0; padding: 10px 12px; }
    .recommendation-title { font-weight: 600; font-size: 12px; margin-bottom: 4px; color: #ef4444; }
    .recommendation-desc { font-size: 11px; color: var(--text-secondary, #cbd5e1); line-height: 1.4; }
    .priority-badge { padding: 1px 4px; border-radius: 2px; font-size: 9px; font-weight: 600; margin-left: 6px; }
    .priority-critical { background: #450a0a; color: #fca5a5; }
    .priority-high { background: #431407; color: #fdba74; }
    .priority-medium { background: #422006; color: #fde047; }
    .empty-state { text-align: center; padding: 40px 20px; color: var(--text-tertiary, #94a3b8); font-size: 14px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    .sla-bar { display: flex; align-items: center; gap: 12px; background: #1f2937; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
    .sla-indicator { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  `;

  @state() private _selectedSimulation: SimulationRun | null = null;
  @state() private _selectedPhaseId: string | null = null;
  @state() private _activeTab: 'impact-assessment' | 'defense-controls' | 'backup-recovery' | 'recommendations' = 'impact-assessment';
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


  private _simulations: SimulationRun[] = [
    {
      id: 'ransom-sim-2026-001',
      name: 'BlackCat/ALPHV Ransomware Simulation',
      scenario: {
        id: 'scenario-001',
        name: 'Enterprise Double Extortion Ransomware',
        description: 'Full simulation of modern double extortion ransomware attack with data exfiltration',
        ransomwareFamily: {
          id: 'family-001',
          name: 'BlackCat/ALPHV',
          aliases: ['ALPHV', 'BlackCat', 'Noberus'],
          severity: 'critical',
          characteristics: ['Rust-based', 'Double extortion', 'Triple extortion support', 'Encrypts ESXi hosts', 'File exfiltration', 'DDoS threats'],
          knownExtortionTactics: ['Data leak on public leak site', 'DDoS attacks', 'Contacting customers/partners', 'Threat of regulatory reporting']
        },
        attackVector: 'phishing',
        targetSystems: ['Windows 10 endpoints', 'Windows Server 2022', 'Linux web servers', 'ESXi hypervisors', 'NAS storage devices'],
        targetDepartments: ['Finance', 'HR', 'Engineering', 'Operations', 'Customer Support'],
        exfiltrationEnabled: true,
        doubleExtortionEnabled: true,
        tripleExtortionEnabled: true,
        lateralMovementEnabled: true
      },
      status: 'completed',
      startTime: '2026-04-20 14:00',
      endTime: '2026-04-20 16:30',
      operator: 'red-team-lead',
      attackPhases: [
        {
          id: 'phase-1',
          name: 'Initial Access',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 14:00',
          endTime: '2026-04-20 14:15',
          techniques: ['Phishing email with malicious macro attachment', 'User execution of malicious document'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Phishing email sent to 50 finance department employees, 3 users enabled macros, initial access achieved on 2 workstations.'
        },
        {
          id: 'phase-2',
          name: 'Execution',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 14:15',
          endTime: '2026-04-20 14:25',
          techniques: ['PowerShell execution', 'C2 communication established'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Malicious macro executed PowerShell download cradle, established C2 connection to attacker-controlled server, downloaded additional payloads.'
        },
        {
          id: 'phase-3',
          name: 'Persistence',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 14:25',
          endTime: '2026-04-20 14:30',
          techniques: ['Registry run keys', 'Scheduled tasks'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Persistence established via run keys and scheduled tasks to maintain access after reboots.'
        },
        {
          id: 'phase-4',
          name: 'Privilege Escalation',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 14:30',
          endTime: '2026-04-20 14:40',
          techniques: ['Local privilege escalation via CVE-2026-XXXX', 'Credential dumping from LSASS'],
          detectionStatus: 'delayed-detection',
          preventionStatus: 'not-blocked',
          details: 'Privilege escalation to local admin successful, LSASS memory dumped, 18 domain credentials recovered. Detected after 2 hours.'
        },
        {
          id: 'phase-5',
          name: 'Defense Evasion',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 14:40',
          endTime: '2026-04-20 14:50',
          techniques: ['Obfuscated payloads', 'AMSI bypass', 'EDR evasion'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Payload obfuscation successfully evaded EDR detection, no alerts generated during entire attack chain.'
        },
        {
          id: 'phase-6',
          name: 'Credential Access',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 14:50',
          endTime: '2026-04-20 15:00',
          techniques: ['Pass-the-hash', 'Domain account compromise'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Pass-the-hash used to move laterally, Domain Admin credentials obtained via compromised domain controller.'
        },
        {
          id: 'phase-7',
          name: 'Lateral Movement',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 15:00',
          endTime: '2026-04-20 15:30',
          techniques: ['SMB lateral movement', 'RDP access to servers'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Successfully moved laterally to 38 endpoints and 12 servers, including all file servers and domain controllers.'
        },
        {
          id: 'phase-8',
          name: 'Collection',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 15:30',
          endTime: '2026-04-20 15:50',
          techniques: ['Document collection', 'Database enumeration'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Collected 280GB of sensitive documents, customer data, financial records, and intellectual property.'
        },
        {
          id: 'phase-9',
          name: 'Command & Control',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 14:25',
          endTime: '2026-04-20 16:30',
          techniques: ['HTTPS C2 communication', 'Domain generation algorithm (DGA)'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Persistent C2 connection maintained throughout entire attack, no network detection.'
        },
        {
          id: 'phase-10',
          name: 'Exfiltration',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 15:50',
          endTime: '2026-04-20 16:10',
          techniques: ['Encrypted data exfiltration to cloud storage'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: '280GB of collected data successfully exfiltrated to attacker-controlled cloud storage via HTTPS.'
        },
        {
          id: 'phase-11',
          name: 'Impact (Encryption)',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 16:10',
          endTime: '2026-04-20 16:30',
          techniques: ['Mass file encryption', 'Ransom note deployment', 'ESXi host encryption', 'Backup deletion'],
          detectionStatus: 'detected',
          preventionStatus: 'not-blocked',
          details: '12 servers and 38 endpoints encrypted, 850,000+ files encrypted, all accessible backups deleted. Ransom note deployed after encryption completed.'
        }
      ],
      impact: {
        systemsEncrypted: 50,
        totalFilesEncrypted: 850000,
        sensitiveDataExfiltrated: 280,
        estimatedDowntime: 72,
        estimatedRecoveryTime: 96,
        estimatedFinancialLoss: 12500000,
        businessProcessesAffected: ['All core business operations', 'Customer support', 'Financial systems', 'Engineering development', 'Manufacturing operations'],
        regulatoryImpact: 'GDPR breach notification required, potential fines up to 4% of global annual revenue.'
      },
      defenseControls: [
        {
          id: 'control-001',
          name: 'Email Security Gateway',
          type: 'prevention',
          effectiveness: 'ineffective',
          attackPhase: 'Initial Access',
          comments: 'Phishing email with malicious macro attachment not detected or blocked, delivered to user inboxes.'
        },
        {
          id: 'control-002',
          name: 'Endpoint Detection and Response (EDR)',
          type: 'prevention',
          effectiveness: 'ineffective',
          attackPhase: 'Execution / Defense Evasion',
          comments: 'Malicious macro execution, PowerShell activity, and payload obfuscation completely undetected. No prevention actions taken.'
        },
        {
          id: 'control-003',
          name: 'Privilege Access Management (PAM)',
          type: 'prevention',
          effectiveness: 'not-tested',
          attackPhase: 'Privilege Escalation',
          comments: 'PAM not implemented for domain admin accounts, allowing unfettered privileged access.'
        },
        {
          id: 'control-004',
          name: 'Network Detection and Response (NDR)',
          type: 'detection',
          effectiveness: 'ineffective',
          attackPhase: 'C2 / Exfiltration',
          comments: 'C2 communication and 280GB data exfiltration completely undetected by network security monitoring.'
        },
        {
          id: 'control-005',
          name: 'SIEM Correlation Rules',
          type: 'detection',
          effectiveness: 'partially-effective',
          attackPhase: 'Privilege Escalation / Encryption',
          comments: 'LSASS credential dumping detected after 2 hour delay. Mass file encryption activity detected immediately at impact phase.'
        },
        {
          id: 'control-006',
          name: 'Zero Trust Microsegmentation',
          type: 'prevention',
          effectiveness: 'ineffective',
          attackPhase: 'Lateral Movement',
          comments: 'Lateral movement unrestricted, no network segmentation between endpoints and critical servers.'
        },
        {
          id: 'control-007',
          name: 'Backup Protection',
          type: 'recovery',
          effectiveness: 'ineffective',
          attackPhase: 'Impact',
          comments: 'All online backups connected to domain, accessible to attackers and deleted during attack.'
        }
      ],
      backupTests: [
        {
          id: 'backup-001',
          name: 'Primary File Server Backup',
          type: 'full-backup',
          status: 'failed',
          recoveryTime: 0,
          dataLoss: 120,
          integrityVerified: false,
          details: 'All primary backups were connected to domain and deleted during attack. No usable backup available.'
        },
        {
          id: 'backup-002',
          name: 'Offline Air-Gapped Backup',
          type: 'offline-backup',
          status: 'passed',
          recoveryTime: 72,
          dataLoss: 24,
          integrityVerified: true,
          details: 'Offline air-gapped backup intact, contains data up to 24 hours before attack. Full recovery estimated to take 72 hours.'
        },
        {
          id: 'backup-003',
          name: 'Cloud Object Storage Backup',
          type: 'cloud-backup',
          status: 'warning',
          recoveryTime: 12,
          dataLoss: 6,
          integrityVerified: true,
          details: 'Cloud backup intact, but immutable backup configuration misconfigured, allowing partial deletion. 6 hours of data lost.'
        },
        {
          id: 'backup-004',
          name: 'Virtual Machine Hypervisor Backup',
          type: 'incremental-backup',
          status: 'failed',
          recoveryTime: 0,
          dataLoss: 24,
          integrityVerified: false,
          details: 'ESXi hypervisor backups encrypted by ransomware, no usable VM backups available.'
        }
      ],
      summary: {
        overallResilienceScore: 22,
        preventionEffectiveness: 10,
        detectionEffectiveness: 25,
        responseEffectiveness: 30,
        recoveryEffectiveness: 45,
        gapsIdentified: 12,
        recommendations: [
          'Implement macro blocking for all Office documents from external senders',
          'Deploy advanced EDR with behavior-based ransomware prevention capabilities',
          'Implement zero-trust network segmentation to prevent lateral movement between endpoints and critical servers',
          'Implement offline air-gapped backups with 3-2-1 backup strategy, regular recovery testing',
          'Enable immutable storage for cloud backups, restrict backup access with MFA and least privilege',
          'Tune SIEM correlation rules to detect ransomware TTPs in real-time',
          'Implement Privileged Access Management (PAM) for all admin and service accounts',
          'Deploy Network Detection and Response (NDR) to detect C2 and data exfiltration activity',
          'Develop and test ransomware incident response plan, regular tabletop exercises',
          'Implement email security with anti-phishing, URL rewriting, and attachment sandboxing'
        ]
      }
    }
  ];

  constructor() {
    super();
    this._selectedSimulation = this._simulations[0];
    const lastPhase = this._selectedSimulation.attackPhases[this._selectedSimulation.attackPhases.length - 1];
    this._selectedPhaseId = lastPhase.id;
  }

  private _getPhaseColor(phase: AttackPhase): string {
    switch (phase.status) {
      case 'succeeded': return '#ef4444';
      case 'blocked': return '#22c55e';
      case 'detected': return '#3b82f6';
      case 'failed': return '#6b7280';
      case 'in-progress': return '#f97316';
      default: return '#6b7280';
    }
  }

  private _getScoreClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'average';
    if (score >= 30) return 'poor';
    return 'bad';
  }

  private _getImpactSeverity(value: number, thresholdHigh: number, thresholdCritical: number): 'low' | 'medium' | 'high' | 'critical' {
    if (value >= thresholdCritical) return 'critical';
    if (value >= thresholdHigh) return 'high';
    if (value > 0) return 'medium';
    return 'low';
  }

  private _getPriorityForRecommendation(index: number, total: number): 'critical' | 'high' | 'medium' {
    const third = Math.ceil(total / 3);
    if (index < third) return 'critical';
    if (index < 2 * third) return 'high';
    return 'medium';
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
        record.findings = this._items.filter((x: any) => x.severity && x.severity !== 'low').length;
        record.criticalCount = this._items.filter((x: any) => x.severity === 'critical').length;
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
          <span style="padding:2px 6px;border-radius:3px;font-size:9px;font-weight:600;background:${((({scan:'#3b82f6',review:'#f59e0b',config:'#8b5cf6',export:'#22c55e'}) as any)[e.category]) || '#374151'}20;color:${((({scan:'#60a5fa',review:'#fbbf24',config:'#a78bfa',export:'#34d399'}) as any)[e.category]) || '#9ca3af'}">${e.category}</span>
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
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Auto-scan Interval</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="168" .value=${String(this._autoInterval)} @input=${(e: Event) => { this._autoInterval = parseInt((e.target as HTMLInputElement).value); }} style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._autoInterval}h</span></div></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">SLA Target</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="720" .value=${String(this._slaTargetHours)} @input=${(e: Event) => { this._slaTargetHours = parseInt((e.target as HTMLInputElement).value); }} style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._slaTargetHours}h</span></div></div>
      </div>` : nothing}
      ${this._settingsTab === 'thresholds' ? html`<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Critical Threshold</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="20" .value=${String(this._criticalThreshold)} @input=${(e: Event) => { this._criticalThreshold = parseInt((e.target as HTMLInputElement).value); }} style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._criticalThreshold}</span></div></div>` : nothing}
      ${this._settingsTab === 'integrations' ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Escalation Email</div><input type="email" .value=${this._escalationEmail} @input=${(e: Event) => { this._escalationEmail = (e.target as HTMLInputElement).value; }} style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Webhook URL</div><input type="url" .value=${this._webhookUrl} @input=${(e: Event) => { this._webhookUrl = (e.target as HTMLInputElement).value; }} style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
        <div style="grid-column:1/-1;display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary btn-sm" @click=${() => { this._addAudit('config', 'Settings saved'); }}>Save</button>
          <button class="btn btn-secondary btn-sm" @click=${() => { this._addAudit('config', 'Config exported'); }}>Export</button>
        </div>
      </div>` : nothing}
    </div>`;
  }

  private _renderRiskGauge(): any {
    const riskDist: any = { critical: 0, high: 0, medium: 0, low: 0 };
    this._items.forEach((item: any) => { const r = item.severity; if (riskDist[r] !== undefined) riskDist[r]++; else riskDist.medium++; });
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
    const data = this._items.slice(0, 10).map((item: any, i: number) => ({ name: (item.name || item.title || item.id || 'Item ' + i).substring(0, 8), score: ({critical: 10, high: 7, medium: 4, low: 1} as any)[item.severity] || 2, risk: item.severity || 'medium' }));
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



  // --- Domain Rules Engine ---
  @state() private _rsimRules: { id: string; name: string; category: string; severity: Severity; enabled: boolean; lastEval: string; passRate: number }[] = [];
  private _initRsimRules() {
    const rules = [
      { id: 'R-001', name: 'Primary Compliance Check', category: 'Core', severity: 'critical' as Severity, enabled: true, lastEval: '2026-04-23T08:00:00Z', passRate: 88 },
      { id: 'R-002', name: 'Secondary Validation', category: 'Operations', severity: 'high' as Severity, enabled: true, lastEval: '2026-04-23T07:30:00Z', passRate: 74 },
      { id: 'R-003', name: 'Tertiary Assessment', category: 'Infrastructure', severity: 'medium' as Severity, enabled: true, lastEval: '2026-04-23T06:00:00Z', passRate: 82 },
      { id: 'R-004', name: 'Quaternary Audit', category: 'Security', severity: 'critical' as Severity, enabled: true, lastEval: '2026-04-23T05:00:00Z', passRate: 65 },
      { id: 'R-005', name: 'Quinary Review', category: 'Governance', severity: 'high' as Severity, enabled: true, lastEval: '2026-04-23T04:00:00Z', passRate: 91 },
      { id: 'R-006', name: 'Senary Inspection', category: 'Access Control', severity: 'medium' as Severity, enabled: false, lastEval: '2026-04-22T20:00:00Z', passRate: 53 },
      { id: 'R-007', name: 'Septenary Check', category: 'Data Protection', severity: 'high' as Severity, enabled: true, lastEval: '2026-04-22T18:00:00Z', passRate: 78 },
      { id: 'R-008', name: 'Octenary Scan', category: 'Network', severity: 'critical' as Severity, enabled: true, lastEval: '2026-04-22T14:00:00Z', passRate: 96 },
    ];
    this._rsimRules = rules;
  }
  private _evaluateRsimRules(): { passed: number; failed: number; skipped: number; total: number } {
    let passed = 0, failed = 0, skipped = 0;
    this._rsimRules.forEach(r => { if (!r.enabled) { skipped++; } else if (r.passRate >= 80) { passed++; } else { failed++; } });
    return { passed, failed, skipped, total: this._rsimRules.length };
  }

  // --- CVSS Scoring ---
  @state() private _rsimcvssData: { itemId: string; vector: string; base: number; temporal: number; environmental: number; overall: number }[] = [];
  private _initRsimCvss() {
    const vectors = ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:A/AC:H/PR:L/UI:R/S:C/C:L/I:L/A:N', 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N', 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:N/I:L/A:N'];
    this._rsimcvssData = vectors.map((v, i) => {
      const base = parseFloat((Math.random() * 6 + 3).toFixed(1));
      const temporal = parseFloat((base * (0.7 + Math.random() * 0.3)).toFixed(1));
      const environmental = parseFloat((temporal * (0.8 + Math.random() * 0.2)).toFixed(1));
      return { itemId: 'V-' + String(i + 1).padStart(3, '0'), vector: v, base, temporal, environmental, overall: environmental };
    });
  }

  // --- Anomaly Detection ---
  @state() private _rsimanomalies: { id: string; type: string; severity: Severity; description: string; detected: string; confidence: number; affected: string[] }[] = [];
  private _runRsimAnomalyDetection() {
    const types = [
      { type: 'Spike in violation rate', severity: 'high' as Severity, desc: 'Detected 280% increase in violations over the last 24 hours', affected: ['Core', 'Operations'] },
      { type: 'SLA breach pattern', severity: 'critical' as Severity, desc: 'Recurring SLA breaches on weekends indicating staffing gaps', affected: ['SLA', 'Staffing'] },
      { type: 'Baseline drift detected', severity: 'medium' as Severity, desc: 'Score drifted 10 points below established baseline over 7 days', affected: ['Metrics', 'Baseline'] },
      { type: 'Unusual escalation volume', severity: 'high' as Severity, desc: 'Escalation rate 2.5x above normal in infrastructure controls', affected: ['Infrastructure', 'Controls'] },
      { type: 'Stale findings accumulation', severity: 'low' as Severity, desc: '18 findings older than 90 days without status change', affected: ['Maintenance'] },
    ];
    this._rsimanomalies = types.map((a, i) => ({
      id: 'ANO-' + String(i + 1).padStart(3, '0'), type: a.type, severity: a.severity,
      description: a.desc, detected: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(2)), affected: a.affected,
    }));
  }

  // --- Trend Prediction ---
  @state() private _rsimpredictions: { horizon: string; metric: string; current: number; predicted: number; direction: 'up' | 'down' | 'stable'; confidence: number }[] = [];
  private _generateRsimPredictions() {
    this._rsimpredictions = [
      { horizon: '7 days', metric: 'Compliance Score', current: 78, predicted: 75, direction: 'down' as const, confidence: 0.82 },
      { horizon: '7 days', metric: 'Open Critical Items', current: 12, predicted: 15, direction: 'up' as const, confidence: 0.71 },
      { horizon: '30 days', metric: 'Overall Score', current: 78, predicted: 82, direction: 'up' as const, confidence: 0.64 },
      { horizon: '30 days', metric: 'SLA Rate', current: 88, predicted: 91, direction: 'up' as const, confidence: 0.73 },
      { horizon: '30 days', metric: 'Readiness', current: 72, predicted: 68, direction: 'down' as const, confidence: 0.59 },
      { horizon: '90 days', metric: 'Risk Score', current: 45, predicted: 38, direction: 'down' as const, confidence: 0.51 },
      { horizon: '90 days', metric: 'Maturity Level', current: 3.2, predicted: 3.5, direction: 'up' as const, confidence: 0.47 },
    ];
  }

  // --- Approval Workflow ---
  @state() private _rsimApprovals: { id: string; title: string; requester: string; status: 'pending' | 'approved' | 'rejected' | 'expired'; createdAt: string; priority: Priority; type: string }[] = [];
  private _initRsimApprovals() {
    this._rsimApprovals = [
      { id: 'APR-001', title: 'Emergency exception request for critical finding', requester: 'Alice Chen', status: 'pending', createdAt: '2026-04-23T07:00:00Z', priority: 'p1', type: 'Exception' },
      { id: 'APR-002', title: 'Extend compliance deadline for quarterly audit', requester: 'Bob Martinez', status: 'pending', createdAt: '2026-04-22T18:00:00Z', priority: 'p2', type: 'Extension' },
      { id: 'APR-003', title: 'Disable security control for system migration', requester: 'Carol Wu', status: 'rejected', createdAt: '2026-04-22T14:00:00Z', priority: 'p1', type: 'Policy Change' },
      { id: 'APR-004', title: 'New assessment approval for third-party vendor', requester: 'Dave Kim', status: 'approved', createdAt: '2026-04-21T10:00:00Z', priority: 'p3', type: 'Vendor' },
      { id: 'APR-005', title: 'Network rule change for partner integration', requester: 'Eve Johnson', status: 'expired', createdAt: '2026-04-19T08:00:00Z', priority: 'p2', type: 'Network' },
    ];
  }
  private _approveRsimItem(id: string) { const item = this._rsimApprovals.find(a => a.id === id); if (item) item.status = 'approved'; this.requestUpdate(); }
  private _rejectRsimItem(id: string) { const item = this._rsimApprovals.find(a => a.id === id); if (item) item.status = 'rejected'; this.requestUpdate(); }

  // --- Activity Feed ---
  @state() private _rsimActivity: { id: string; action: string; user: string; target: string; timestamp: string }[] = [];
  private _initRsimActivity() {
    const actions = [
      { action: 'Updated compliance rule R-003', user: 'Alice Chen', target: 'Policy Update' },
      { action: 'Approved exception APR-004', user: 'Bob Martinez', target: 'Vendor Assessment' },
      { action: 'Created new finding F-1024', user: 'Carol Wu', target: 'Cloud Misconfiguration' },
      { action: 'Resolved finding F-0987', user: 'Dave Kim', target: 'Unencrypted Storage' },
      { action: 'Escalated finding F-1015 to P1', user: 'Eve Johnson', target: 'Exposed Credentials' },
      { action: 'Ran automated scan', user: 'System', target: 'Full Infrastructure' },
      { action: 'Updated risk score for asset A-2048', user: 'Alice Chen', target: 'Database Server' },
      { action: 'Rejected policy change request', user: 'Bob Martinez', target: 'Encryption Policy' },
    ];
    this._rsimActivity = actions.map((a, i) => ({ id: 'ACT-' + String(i + 1).padStart(3, '0'), ...a, timestamp: new Date(Date.now() - i * 3600000).toISOString() }));
  }

  // --- Notification System ---
  @state() private _rsimNotifications: { id: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; read: boolean; timestamp: string }[] = [];
  private _initRsimNotifications() {
    this._rsimNotifications = [
      { id: 'NTF-001', message: 'Score dropped below threshold', type: 'warning', read: false, timestamp: new Date().toISOString() },
      { id: 'NTF-002', message: '3 items approaching SLA deadline within 24h', type: 'error', read: false, timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: 'NTF-003', message: 'Weekly report generated successfully', type: 'success', read: true, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'NTF-004', message: 'New framework mapped to existing controls', type: 'info', read: true, timestamp: new Date(Date.now() - 14400000).toISOString() },
    ];
  }
  private _markRsimNotifRead(id: string) { const n = this._rsimNotifications.find(x => x.id === id); if (n) n.read = true; this.requestUpdate(); }

  // --- Panel Configuration ---
  @state() private _rsimConfig: { layout: 'compact' | 'default' | 'expanded'; theme: 'dark' | 'midnight' | 'slate'; showAnomalies: boolean; showPredictions: boolean; autoRefresh: boolean; refreshInterval: number } = {
    layout: 'default', theme: 'dark', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60,
  };
  private _rsimPresets: { name: string; config: typeof this._rsimConfig }[] = [
    { name: 'Analyst View', config: { layout: 'expanded', theme: 'dark', showAnomalies: true, showPredictions: false, autoRefresh: true, refreshInterval: 30 } },
    { name: 'Executive Summary', config: { layout: 'compact', theme: 'slate', showAnomalies: false, showPredictions: true, autoRefresh: false, refreshInterval: 300 } },
    { name: 'Audit Mode', config: { layout: 'expanded', theme: 'midnight', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60 } },
  ];
  private _applyRsimPreset(preset: typeof this._rsimPresets[0]) { this._rsimConfig = { ...preset.config }; this.requestUpdate(); }

  private _renderRsimTreemapSVG(): string {
    const categories = [
      { name: 'Critical', value: 28, color: '#ef4444' },
      { name: 'High', value: 22, color: '#f97316' },
      { name: 'Medium', value: 18, color: '#eab308' },
      { name: 'Low', value: 14, color: '#22c55e' },
      { name: 'Info', value: 10, color: '#3b82f6' },
      { name: 'Monitoring', value: 8, color: '#8b5cf6' },
    ];
    const total = categories.reduce((s, c) => s + c.value, 0);
    const w = 480, h = 200;
    let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">';
    let x = 0, rowH = h, rowStart = 0, rowSum = 0;
    for (let i = 0; i < categories.length; i++) {
      const c = categories[i];
      if (rowSum + c.value > total * 0.55 && rowStart < i) {
        const rw = (rowSum / total) * w;
        let ry = 0;
        for (let j = rowStart; j < i; j++) {
          const ch = (categories[j].value / rowSum) * rowH;
          svg += '<rect x="' + x + '" y="' + ry + '" width="' + rw + '" height="' + ch + '" rx="3" fill="' + categories[j].color + '" opacity="0.35" stroke="' + categories[j].color + '" stroke-width="0.5"/>';
          svg += '<text x="' + (x + rw / 2) + '" y="' + (ry + ch / 2) + '" fill="#e2e8f0" font-size="8" text-anchor="middle" dominant-baseline="middle">' + categories[j].name + ' (' + categories[j].value + ')</text>';
          ry += ch;
        }
        x += rw; rowH = h; rowStart = i; rowSum = c.value;
      } else { rowSum += c.value; }
    }
    if (rowStart < categories.length) {
      const rw = w - x; let ry = 0;
      for (let j = rowStart; j < categories.length; j++) {
        const ch = (categories[j].value / rowSum) * rowH;
        svg += '<rect x="' + x + '" y="' + ry + '" width="' + rw + '" height="' + ch + '" rx="3" fill="' + categories[j].color + '" opacity="0.35" stroke="' + categories[j].color + '" stroke-width="0.5"/>';
        svg += '<text x="' + (x + rw / 2) + '" y="' + (ry + ch / 2) + '" fill="#e2e8f0" font-size="8" text-anchor="middle" dominant-baseline="middle">' + categories[j].name + ' (' + categories[j].value + ')</text>';
        ry += ch;
      }
    }
    svg += '</svg>';
    return svg;
  }

  private _renderRsimSankeySVG(): string {
    const sources = ['Source A', 'Source B', 'Source C'];
    const targets = ['Target 1', 'Target 2', 'Target 3', 'Target 4'];
    const links: { s: number; t: number; v: number }[] = [
      { s: 0, t: 0, v: 14 }, { s: 0, t: 1, v: 8 }, { s: 0, t: 3, v: 5 },
      { s: 1, t: 1, v: 10 }, { s: 1, t: 2, v: 12 },
      { s: 2, t: 0, v: 6 }, { s: 2, t: 2, v: 9 }, { s: 2, t: 3, v: 7 },
    ];
    const w = 520, h = 180, lx = 20, rx = 400, nodeW = 14;
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
    const targetH: number[] = targets.map(() => 0);
    links.forEach(l => { targetH[l.t] += l.v; });
    const maxH = Math.max(...targets.map((_, i) => targetH[i]));
    const scaleY = (h - 10) / maxH;
    let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">';
    sources.forEach((s, i) => { const sy = 10 + i * (h - 10) / sources.length; svg += '<rect x="' + lx + '" y="' + sy + '" width="' + nodeW + '" height="12" rx="2" fill="#6366f1"/>'; svg += '<text x="' + (lx - 2) + '" y="' + (sy + 7) + '" fill="#9ca3af" font-size="7" text-anchor="end">' + s + '</text>'; });
    targets.forEach((t, i) => {
      const ty = (h - targetH[i] * scaleY) / 2;
      svg += '<rect x="' + rx + '" y="' + ty + '" width="' + nodeW + '" height="' + (targetH[i] * scaleY) + '" rx="2" fill="' + colors[i] + '"/>';
      svg += '<text x="' + (rx + nodeW + 3) + '" y="' + (ty + targetH[i] * scaleY / 2) + '" fill="#9ca3af" font-size="7">' + t + '</text>';
    });
    links.forEach(l => {
      const sx = lx + nodeW; const sy = 10 + l.s * (h - 10) / sources.length + 4;
      const tx = rx; const targetOffset = links.filter(ll => ll.t === l.t && ll.s < l.s).reduce((s, ll) => s + ll.v, 0);
      const ty = (h - targetH[l.t] * scaleY) / 2 + targetOffset * scaleY;
      const sw = l.v * 0.6; const tw = l.v * scaleY;
      const mx = (sx + tx) / 2;
      svg += '<path d="M' + sx + ' ' + (sy - sw / 2) + ' C' + mx + ' ' + (sy - sw / 2) + ' ' + mx + ' ' + ty + ' ' + tx + ' ' + ty + '" fill="' + colors[l.t] + '" opacity="0.25"/>';
      svg += '<path d="M' + sx + ' ' + (sy + sw / 2) + ' C' + mx + ' ' + (sy + sw / 2) + ' ' + mx + ' ' + (ty + tw) + ' ' + tx + ' ' + (ty + tw) + '" fill="' + colors[l.t] + '" opacity="0.25"/>';
    });
    svg += '</svg>';
    return svg;
  }

  // --- Render: Rules Engine ---
  private _renderRsimRules(): any {
    const ev = this._evaluateRsimRules();
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Rules Engine</div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <span class="badge badge-success">$${ev.passed} Passed</span>
          <span class="badge badge-error">$${ev.failed} Failed</span>
          <span class="badge" style="background:#374151">$${ev.skipped} Skipped</span>
          <span class="badge" style="background:#1f2937">$${ev.total} Total</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto">
          $${this._rsimRules.map(r => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <span style="width:8px;height:8px;border-radius:50%;background:$${r.passRate >= 80 ? '#22c55e' : '#ef4444'}"></span>
              <span style="flex:1;font-weight:600">$${r.name}</span>
              <span style="color:#9ca3af">$${r.category}</span>
              <span class="badge badge-$${r.severity === 'critical' ? 'error' : r.severity === 'high' ? 'warning' : 'info'}">$${r.severity}</span>
              <span style="font-weight:700;color:$${r.passRate >= 80 ? '#22c55e' : '#ef4444'}">$${r.passRate}%</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Anomaly Panel ---
  private _renderRsimAnomalies(): any {
    const sc = (s: Severity) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Anomaly Detection</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._rsimanomalies.map(a => html`
            <div style="padding:6px 8px;background:#1f2937;border-radius:4px;border-left:3px solid $${sc(a.severity)}">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span class="badge badge-$${a.severity === 'critical' ? 'error' : a.severity === 'high' ? 'warning' : 'info'}">$${a.severity}</span>
                <span style="font-weight:600;font-size:10px">$${a.type}</span>
                <span style="margin-left:auto;font-size:9px;color:#9ca3af">$${(a.confidence * 100).toFixed(0)}%</span>
              </div>
              <div style="font-size:9px;color:#9ca3af;margin-bottom:3px">$${a.description}</div>
              <div style="display:flex;gap:4px">$${a.affected.map(af => html`<span class="badge" style="background:#374151;font-size:8px">$${af}</span>`)}</div>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Predictions ---
  private _renderRsimPredictions(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Trend Predictions</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          $${this._rsimpredictions.map(pr => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <span class="badge" style="background:#374151">$${pr.horizon}</span>
              <span style="flex:1">$${pr.metric}</span>
              <span style="color:#9ca3af">$${pr.current}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="$${pr.direction === 'up' ? '#22c55e' : pr.direction === 'down' ? '#ef4444' : '#eab308'}" stroke-width="2"><path d="$${pr.direction === 'up' ? 'M12 19V5M5 12l7-7 7 7' : pr.direction === 'down' ? 'M12 5v14M19 12l-7 7-7-7' : 'M5 12h14'}"/></svg>
              <span style="font-weight:700;color:$${pr.direction === 'up' ? '#22c55e' : pr.direction === 'down' ? '#ef4444' : '#eab308'}">$${pr.predicted}</span>
              <span style="font-size:8px;color:#6b7280">$${(pr.confidence * 100).toFixed(0)}%</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Approvals ---
  private _renderRsimApprovals(): any {
    const stc = (s: string) => s === 'pending' ? '#eab308' : s === 'approved' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#6b7280';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Approval Workflow</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._rsimApprovals.map(a => html`
            <div style="padding:6px 8px;background:#1f2937;border-radius:4px">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span style="width:8px;height:8px;border-radius:50%;background:$${stc(a.status)}"></span>
                <span style="font-weight:600;font-size:10px;flex:1">$${a.title}</span>
                <span class="badge badge-$${a.priority === 'p1' ? 'error' : a.priority === 'p2' ? 'warning' : 'info'}">$${a.priority}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;font-size:9px;color:#9ca3af;margin-bottom:3px">
                <span>By $${a.requester}</span><span>Type: $${a.type}</span>
                <span>Status: <span style="color:$${stc(a.status)};text-transform:capitalize">$${a.status}</span></span>
              </div>
              $${a.status === 'pending' ? html`
                <div style="display:flex;gap:4px;margin-top:4px">
                  <button class="btn success" style="padding:2px 8px;font-size:9px" @click=$${() => this._approveRsimItem(a.id)}>Approve</button>
                  <button class="btn error" style="padding:2px 8px;font-size:9px" @click=$${() => this._rejectRsimItem(a.id)}>Reject</button>
                </div>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Activity Feed ---
  private _renderRsimActivity(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Activity Feed</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto">
          $${this._rsimActivity.map(a => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <div style="width:20px;height:20px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;font-size:9px">•</div>
              <div style="flex:1"><span style="font-weight:600">$${a.user}</span> $${a.action}</div>
              <span style="font-size:8px;color:#6b7280">$${new Date(a.timestamp).toLocaleTimeString()}</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Notifications ---
  private _renderRsimNotifications(): any {
    const tc = (t: string) => t === 'error' ? '#ef4444' : t === 'warning' ? '#eab308' : t === 'success' ? '#22c55e' : '#3b82f6';
    const unread = this._rsimNotifications.filter(n => !n.read).length;
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Notifications $${unread > 0 ? html`<span class="badge badge-error">$${unread} new</span>` : nothing}</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:120px;overflow-y:auto">
          $${this._rsimNotifications.map(n => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:$${n.read ? '#1f2937' : '#252a36'};border-radius:4px;font-size:10px;opacity:$${n.read ? '0.6' : '1'};cursor:pointer" @click=$${() => this._markRsimNotifRead(n.id)}>
              <span style="width:8px;height:8px;border-radius:50%;background:$${tc(n.type)}"></span>
              <span style="flex:1">$${n.message}</span>
              $${!n.read ? html`<span style="width:6px;height:6px;border-radius:50%;background:#3b82f6"></span>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Panel Config ---
  private _renderRsimConfig(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Panel Configuration</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Layout</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._rsimConfig.layout = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="compact" ?selected=$${this._rsimConfig.layout === 'compact'}>Compact</option>
              <option value="default" ?selected=$${this._rsimConfig.layout === 'default'}>Default</option>
              <option value="expanded" ?selected=$${this._rsimConfig.layout === 'expanded'}>Expanded</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Theme</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._rsimConfig.theme = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="dark" ?selected=$${this._rsimConfig.theme === 'dark'}>Dark</option>
              <option value="midnight" ?selected=$${this._rsimConfig.theme === 'midnight'}>Midnight</option>
              <option value="slate" ?selected=$${this._rsimConfig.theme === 'slate'}>Slate</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Auto Refresh</span>
            <input type="checkbox" ?checked=$${this._rsimConfig.autoRefresh} @change=$${() => { this._rsimConfig.autoRefresh = !this._rsimConfig.autoRefresh; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Anomalies</span>
            <input type="checkbox" ?checked=$${this._rsimConfig.showAnomalies} @change=$${() => { this._rsimConfig.showAnomalies = !this._rsimConfig.showAnomalies; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Predictions</span>
            <input type="checkbox" ?checked=$${this._rsimConfig.showPredictions} @change=$${() => { this._rsimConfig.showPredictions = !this._rsimConfig.showPredictions; this.requestUpdate(); }}/>
          </div>
          <div style="margin-top:6px;font-weight:600">Presets</div>
          <div style="display:flex;gap:4px">
            $${this._rsimPresets.map(ps => html`<button class="btn" style="padding:2px 8px;font-size:9px" @click=$${() => this._applyRsimPreset(ps)}>$${ps.name}</button>`)}
          </div>
        </div>
      </div>`;
  }

  render() {
    if (!this._selectedSimulation) {
      return html`<div class="panel"><div class="empty-state">No simulation selected</div></div>`;
    }
    if (this._rsimRules.length === 0) { this._initRsimRules(); this._initRsimCvss(); this._runRsimAnomalyDetection(); this._generateRsimPredictions(); this._initRsimApprovals(); this._initRsimActivity(); this._initRsimNotifications(); }

    const summary = this._selectedSimulation.summary;
    const scenario = this._selectedSimulation.scenario;
    const impact = this._selectedSimulation.impact;

    return html`
      <div class="panel">
        <div class="pt">
          🦹‍♂️ Ransomware Attack Simulator
          <span class="status-badge status-${this._selectedSimulation.status}">
            ${this._selectedSimulation.status.replace('-', ' ').toUpperCase()}
          </span>
        </div>

        <div class="simulation-header">
          <div class="simulation-info">
            <h2>
              ${this._selectedSimulation.name}
              <span class="severity-badge severity-${scenario.ransomwareFamily.severity}">
                ${scenario.ransomwareFamily.severity.toUpperCase()}
              </span>
            </h2>
            <div class="simulation-meta">
              <span class="type-badge">${scenario.attackVector.replace('-', ' ')}</span>
              <span>Ransomware: ${scenario.ransomwareFamily.name}</span>
              <span>Duration: ${this._selectedSimulation.startTime} - ${this._selectedSimulation.endTime || 'In Progress'}</span>
              <span>Operator: ${this._selectedSimulation.operator}</span>
              <span>${scenario.doubleExtortionEnabled ? 'Double Extortion' : ''} ${scenario.tripleExtortionEnabled ? ' / Triple Extortion' : ''}</span>
            </div>
          </div>
          <div class="controls">
            ${this._simulations.map(s => html`
              <button class="btn ${s.id === this._selectedSimulation.id ? 'active' : ''}" @click=${() => {
                this._selectedSimulation = s;
                const lastPhase = s.attackPhases[s.attackPhases.length - 1];
                this._selectedPhaseId = lastPhase.id;
              }}>
                ${s.name.length > 20 ? s.name.substring(0, 20) + '...' : s.name}
              </button>
            `)}
            <button class="btn success">▶ Run Simulation</button>
            <button class="btn warning">⏸ Pause</button>
            <button class="btn">📊 Generate Report</button>
          </div>
        </div>

        ${summary ? html`
          <div class="score-card-grid">
            <div class="score-card">
              <div class="score-value ${this._getScoreClass(summary.overallResilienceScore)}">${summary.overallResilienceScore}%</div>
              <div class="score-label">Overall Resilience</div>
            </div>
            <div class="score-card">
              <div class="score-value ${this._getScoreClass(summary.preventionEffectiveness)}">${summary.preventionEffectiveness}%</div>
              <div class="score-label">Prevention Effectiveness</div>
            </div>
            <div class="score-card">
              <div class="score-value ${this._getScoreClass(summary.detectionEffectiveness)}">${summary.detectionEffectiveness}%</div>
              <div class="score-label">Detection Effectiveness</div>
            </div>
            <div class="score-card">
              <div class="score-value ${this._getScoreClass(summary.responseEffectiveness)}">${summary.responseEffectiveness}%</div>
              <div class="score-label">Response Effectiveness</div>
            </div>
            <div class="score-card">
              <div class="score-value ${this._getScoreClass(summary.recoveryEffectiveness)}">${summary.recoveryEffectiveness}%</div>
              <div class="score-label">Recovery Effectiveness</div>
            </div>
            <div class="score-card">
              <div class="score-value bad">${summary.gapsIdentified}</div>
              <div class="score-label">Gaps Identified</div>
            </div>
          </div>
        ` : nothing}

        <div class="kill-chain-container">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">
            Ransomware Kill Chain Execution (${this._selectedSimulation.attackPhases.length} phases)
          </h3>
          <div class="kill-chain">
            ${this._selectedSimulation.attackPhases.map(phase => html`
              <div 
                class="phase-card ${this._selectedPhaseId === phase.id ? 'active' : ''}"
                @click=${() => this._selectedPhaseId = phase.id}
              >
                <div class="phase-name">${phase.name}</div>
                <div class="phase-status-badge status-${phase.status}">
                  ${phase.status.replace('-', ' ').toUpperCase()}
                </div>
                <div class="phase-progress">
                  <div class="phase-progress-fill" style="width: ${phase.progress}%; background: ${this._getPhaseColor(phase)}"></div>
                </div>
                <div class="phase-detection-status detection-${phase.detectionStatus}">
                  ${phase.detectionStatus.replace('-', ' ').toUpperCase()}
                </div>
              </div>
            `)}
          </div>
          ${this._selectedPhaseId ? html`
            <div style="background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); border-radius: 6px; padding: 10px; margin-top: 8px;">
              ${this._selectedSimulation.attackPhases.find(p => p.id === this._selectedPhaseId)?.details}
            </div>
          ` : nothing}
        </div>

        <div class="content-tabs">
          <button class="tab-btn ${this._activeTab === 'impact-assessment' ? 'active' : ''}" @click=${() => this._activeTab = 'impact-assessment'}>
            📉 Impact Assessment
          </button>
          <button class="tab-btn ${this._activeTab === 'defense-controls' ? 'active' : ''}" @click=${() => this._activeTab = 'defense-controls'}>
            🔒 Defense Controls
          </button>
          <button class="tab-btn ${this._activeTab === 'backup-recovery' ? 'active' : ''}" @click=${() => this._activeTab = 'backup-recovery'}>
            💾 Backup & Recovery
          </button>
          <button class="tab-btn ${this._activeTab === 'recommendations' ? 'active' : ''}" @click=${() => this._activeTab = 'recommendations'}>
            💡 Recommendations
          </button>
        </div>

        <div class="tab-content ${this._activeTab === 'impact-assessment' ? 'active' : ''}">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">
            Business Impact Assessment
          </h3>
          <div class="impact-metrics">
            <div class="impact-card">
              <div class="impact-value ${this._getImpactSeverity(impact.systemsEncrypted, 20, 40)}">${impact.systemsEncrypted}</div>
              <div class="impact-label">Systems Encrypted</div>
              <div class="impact-desc">38 endpoints, 12 servers including domain controllers, file servers, and ESXi hypervisors</div>
            </div>
            <div class="impact-card">
              <div class="impact-value ${this._getImpactSeverity(impact.totalFilesEncrypted, 100000, 500000)}">${impact.totalFilesEncrypted.toLocaleString()}</div>
              <div class="impact-label">Files Encrypted</div>
              <div class="impact-desc">850,000+ business documents, database files, VM disks, and system files</div>
            </div>
            <div class="impact-card">
              <div class="impact-value ${this._getImpactSeverity(impact.sensitiveDataExfiltrated, 50, 200)}">${impact.sensitiveDataExfiltrated} GB</div>
              <div class="impact-label">Sensitive Data Exfiltrated</div>
              <div class="impact-desc">280GB of customer PII, financial records, intellectual property, and internal documents</div>
            </div>
            <div class="impact-card">
              <div class="impact-value ${this._getImpactSeverity(impact.estimatedDowntime, 24, 72)}">${impact.estimatedDowntime}h</div>
              <div class="impact-label">Estimated Downtime</div>
              <div class="impact-desc">All core business operations expected to be down for 3 days during recovery</div>
            </div>
            <div class="impact-card">
              <div class="impact-value ${this._getImpactSeverity(impact.estimatedRecoveryTime, 48, 96)}">${impact.estimatedRecoveryTime}h</div>
              <div class="impact-label">Estimated Recovery Time</div>
              <div class="impact-desc">Full system recovery expected to take 4 days from offline air-gapped backups</div>
            </div>
            <div class="impact-card">
              <div class="impact-value ${this._getImpactSeverity(impact.estimatedFinancialLoss, 1000000, 10000000)}">$${(impact.estimatedFinancialLoss / 1000000).toFixed(1)}M</div>
              <div class="impact-label">Estimated Financial Loss</div>
              <div class="impact-desc">$12.5M estimated loss including downtime, recovery costs, and regulatory fines</div>
            </div>
          </div>
          <div style="background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); border-radius: 6px; padding: 12px;">
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 6px;">Business Impact Summary</div>
            <div style="font-size: 12px; color: var(--text-secondary, #cbd5e1); line-height: 1.5;">
              <div style="margin-bottom: 4px;"><strong>Affected Business Processes:</strong> ${impact.businessProcessesAffected.join(', ')}</div>
              <div><strong>Regulatory Impact:</strong> ${impact.regulatoryImpact}</div>
            </div>
          </div>
        </div>

        <div class="tab-content ${this._activeTab === 'defense-controls' ? 'active' : ''}">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">
            Defense Control Effectiveness Evaluation
          </h3>
          <div class="controls-list">
            ${this._selectedSimulation.defenseControls.map(control => html`
              <div class="control-item">
                <div class="control-header">
                  <div class="control-name">${control.name}</div>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <span class="control-type">${control.type}</span>
                    <span class="control-effectiveness effectiveness-${control.effectiveness}">${control.effectiveness.replace('-', ' ').toUpperCase()}</span>
                  </div>
                </div>
                <div class="control-phase">Attack Phase: ${control.attackPhase}</div>
                <div class="control-details">${control.comments}</div>
              </div>
            `)}
          </div>
        </div>

        <div class="tab-content ${this._activeTab === 'backup-recovery' ? 'active' : ''}">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">
            Backup & Recovery Test Results
          </h3>
          <div class="backup-tests-list">
            ${this._selectedSimulation.backupTests.map(test => html`
              <div class="backup-test-item">
                <div class="backup-header">
                  <div class="backup-name">${test.name}</div>
                  <span class="backup-status status-${test.status}">${test.status}</span>
                </div>
                <div style="font-size: 11px; color: var(--text-secondary, #cbd5e1); margin-bottom: 6px;">
                  Type: ${test.type.replace('-', ' ')} • Integrity Verified: ${test.integrityVerified ? '✅ Yes' : '❌ No'}
                </div>
                <div class="backup-metrics">
                  <span>Recovery Time: ${test.recoveryTime || 'N/A'}h</span>
                  <span>Data Loss: ${test.dataLoss || '0'} GB</span>
                </div>
                <div class="backup-details">${test.details}</div>
              </div>
            `)}
          </div>
        </div>

        <div class="tab-content ${this._activeTab === 'recommendations' ? 'active' : ''}">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">
            Improvement Recommendations (${summary?.recommendations.length || 0} total)
          </h3>
          ${summary && summary.recommendations.length > 0 ? html`
            <div class="recommendations-list">
              ${summary.recommendations.map((rec, index) => {
                const priority = this._getPriorityForRecommendation(index, summary.recommendations.length);
                return html`
                  <div class="recommendation-card">
                    <div class="recommendation-title">
                      Recommendation ${index + 1}
                      <span class="priority-badge priority-${priority}">${priority.toUpperCase()} PRIORITY</span>
                    </div>
                    <div class="recommendation-desc">${rec}</div>
                  </div>
                `;
              })}
            </div>
          ` : html`<div class="empty-state">No recommendations available for this simulation</div>`}
        </div>
      </div>
      </div>
      <div style="margin-top:12px;display:flex;justify-content:center">
        <button class="btn btn-sm ${this._showEnhanced ? 'btn-primary' : 'btn-secondary'}}" @click=${() => {{ this._showEnhanced = !this._showEnhanced; this.requestUpdate(); }}}}>${this._showEnhanced ? 'Hide' : 'Show'}} Advanced</button>
      </div>
      ${this._renderEnhancedSection()}}
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-ransomware-simulator': ScRansomwareSimulator; } }
