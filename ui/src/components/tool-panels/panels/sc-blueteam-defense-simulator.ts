/**
 * sc-blueteam-defense-simulator — Blue Team Defense Capability Simulator (Defensive Core Component)
 * Attack simulation, detection rule testing, security control evaluation, response drill, defense effectiveness scoring
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

type SimulationStatus = 'not-started' | 'running' | 'completed' | 'failed';
type TestStatus = 'passed' | 'failed' | 'warning';
type ControlType = 'prevention' | 'detection' | 'response' | 'recovery';
type RuleType = 'signature' | 'behavioral' | 'anomaly' | 'threat-intel' | 'correlation';

interface DetectionRule {
  id: string;
  name: string;
  type: RuleType;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  testResults: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    falsePositives: number;
    falseNegatives: number;
    averageDetectionTime?: number;
  };
  lastUpdated: string;
}

interface SecurityControl {
  id: string;
  name: string;
  type: ControlType;
  description: string;
  coverage: string[];
  effectivenessScore: number;
  testResults: {
    totalAttacksBlocked: number;
    totalAttacksDetected: number;
    totalAttacksMissed: number;
    bypassedBy: string[];
  };
  status: 'active' | 'disabled' | 'misconfigured';
}

interface SimulationTest {
  id: string;
  name: string;
  description: string;
  attackTactic: string;
  attackTechnique: string;
  cve?: string;
  status: TestStatus;
  expectedOutcome: 'blocked' | 'detected' | 'alerted' | 'logged';
  actualOutcome: 'blocked' | 'detected' | 'alerted' | 'logged' | 'missed' | 'bypassed';
  executionTime?: string;
  detectionTime?: number;
  details: string;
}

interface SimulationSuite {
  id: string;
  name: string;
  description: string;
  type: 'phishing-simulation' | 'malware-detection-test' | 'endpoint-protection-evaluation' | 'network-security-test' | 'incident-response-drill' | 'full-attack-simulation';
  status: SimulationStatus;
  startTime?: string;
  endTime?: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  tests: SimulationTest[];
  targetSystems: string[];
  operators: string[];
  summary?: {
    overallEffectiveness: number;
    preventionRate: number;
    detectionRate: number;
    responseRate: number;
    averageDetectionTime: number;
    gapsIdentified: number;
    recommendations: string[];
  };
}

@customElement('sc-blueteam-defense-simulator')
export class ScBlueteamDefenseSimulator extends LitElement {
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
    .status-running { background: #1e3a8a; color: #93c5fd; animation: pulse 2s infinite; }
    .status-completed { background: #052e16; color: #86efac; }
    .status-failed { background: #450a0a; color: #fca5a5; }
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
    .gauge-container { position: relative; height: 8px; background: var(--bg-tertiary, #0a0e17); border-radius: 4px; overflow: hidden; margin-top: 6px; }
    .gauge-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .gauge-fill.green { background: #22c55e; }
    .gauge-fill.yellow { background: #eab308; }
    .gauge-fill.orange { background: #f97316; }
    .gauge-fill.red { background: #ef4444; }
    .content-tabs { display: flex; gap: 0; margin-bottom: 12px; border-bottom: 1px solid var(--border-color, #374151); }
    .tab-btn { padding: 6px 16px; font-size: 12px; font-weight: 600; border: none; background: transparent; color: var(--text-secondary, #94a3b8); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .tab-btn.active { color: var(--accent-color, #3b82f6); border-bottom-color: var(--accent-color, #3b82f6); }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .test-results-grid { display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; }
    .test-card { background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); border-radius: 6px; padding: 10px 12px; }
    .test-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .test-name { font-weight: 600; font-size: 13px; }
    .test-status { padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .test-status-passed { background: #052e16; color: #86efac; }
    .test-status-failed { background: #450a0a; color: #fca5a5; }
    .test-status-warning { background: #422006; color: #fde047; }
    .test-meta { display: flex; gap: 16px; font-size: 11px; color: var(--text-secondary, #cbd5e1); margin-bottom: 6px; flex-wrap: wrap; }
    .test-tactic { background: var(--bg-tertiary, #0a0e17); padding: 2px 6px; border-radius: 3px; }
    .test-outcome { display: flex; gap: 20px; font-size: 11px; }
    .outcome-item { display: flex; flex-direction: column; }
    .outcome-label { color: var(--text-tertiary, #94a3b8); font-size: 9px; text-transform: uppercase; font-weight: 600; margin-bottom: 2px; }
    .outcome-value.blocked { color: #22c55e; font-weight: 600; }
    .outcome-value.detected { color: #3b82f6; font-weight: 600; }
    .outcome-value.missed { color: #f97316; font-weight: 600; }
    .outcome-value.bypassed { color: #ef4444; font-weight: 600; }
    .test-details { font-size: 11px; color: var(--text-secondary, #cbd5e1); margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border-color, #374151); }
    .rules-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 8px; max-height: 400px; overflow-y: auto; }
    .rule-card { background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); border-radius: 6px; padding: 10px 12px; }
    .rule-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
    .rule-name { font-weight: 600; font-size: 12px; }
    .rule-type { padding: 1px 4px; border-radius: 2px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
    .rule-type-signature { background: #0e7490; color: #38bdf8; }
    .rule-type-behavioral { background: #7e22ce; color: #e9d5ff; }
    .rule-type-anomaly { background: #c2410c; color: #fdba74; }
    .rule-type-threat-intel { background: #15803d; color: #86efac; }
    .rule-type-correlation { background: #4338ca; color: #c4b5fd; }
    .rule-effectiveness { display: flex; gap: 12px; font-size: 10px; margin-bottom: 6px; }
    .effectiveness-item { display: flex; flex-direction: column; }
    .effectiveness-label { color: var(--text-tertiary, #94a3b8); }
    .effectiveness-value { font-weight: 600; }
    .effectiveness-value.good { color: #22c55e; }
    .effectiveness-value.poor { color: #ef4444; }
    .effectiveness-value.warning { color: #eab308; }
    .controls-list { display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; }
    .control-item { background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); border-radius: 6px; padding: 10px 12px; display: flex; align-items: center; gap: 12px; }
    .control-score { width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }
    .score-green { background: rgba(34, 197, 94, 0.1); color: #22c55e; border: 2px solid rgba(34, 197, 94, 0.3); }
    .score-yellow { background: rgba(234, 179, 8, 0.1); color: #eab308; border: 2px solid rgba(234, 179, 8, 0.3); }
    .score-orange { background: rgba(249, 115, 22, 0.1); color: #f97316; border: 2px solid rgba(249, 115, 22, 0.3); }
    .score-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 2px solid rgba(239, 68, 68, 0.3); }
    .control-info { flex: 1; }
    .control-name { font-weight: 600; font-size: 13px; margin-bottom: 2px; }
    .control-type { font-size: 10px; color: var(--text-tertiary, #94a3b8); text-transform: uppercase; font-weight: 600; }
    .control-metrics { display: flex; gap: 16px; font-size: 11px; color: var(--text-secondary, #cbd5e1); margin-top: 4px; }
    .recommendations-list { display: flex; flex-direction: column; gap: 8px; }
    .recommendation-card { background: var(--bg-secondary, #1f2937); border-left: 4px solid #f97316; border-radius: 0 6px 6px 0; padding: 10px 12px; }
    .recommendation-title { font-weight: 600; font-size: 12px; margin-bottom: 4px; color: #f97316; }
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

  @state() private _selectedSimulation: SimulationSuite | null = null;
  @state() private _activeTab: 'test-results' | 'detection-rules' | 'security-controls' | 'recommendations' = 'test-results';
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


  private _simulations: SimulationSuite[] = [
    {
      id: 'sim-2026-001',
      name: 'Q2 Endpoint Protection Evaluation',
      description: 'Comprehensive test of EDR/XDR detection and prevention capabilities against latest threats',
      type: 'endpoint-protection-evaluation',
      status: 'completed',
      startTime: '2026-04-19 10:00',
      endTime: '2026-04-19 14:30',
      totalTests: 120,
      passedTests: 88,
      failedTests: 32,
      targetSystems: ['Windows 10 endpoints', 'Windows Server 2022', 'Linux servers', 'macOS endpoints'],
      operators: ['blue-team-lead', 'security-analyst-1', 'security-analyst-2'],
      tests: [
        {
          id: 'test-001',
          name: 'Ransomware Encryption Simulation',
          description: 'Test ability to detect and block ransomware file encryption behavior',
          attackTactic: 'Impact',
          attackTechnique: 'Data Encrypted for Impact',
          status: 'failed',
          expectedOutcome: 'blocked',
          actualOutcome: 'bypassed',
          executionTime: '2026-04-19 10:15',
          details: 'Ransomware successfully encrypted 1,200+ test files before EDR detected the behavior. No prevention action taken, only post-encryption alert triggered.'
        },
        {
          id: 'test-002',
          name: 'CVE-2026-1234 Exploit Detection',
          description: 'Test detection of Log4j exploit attempts and post-exploitation activity',
          attackTactic: 'Initial Access',
          attackTechnique: 'Exploit Public-Facing Application',
          cve: 'CVE-2026-1234',
          status: 'passed',
          expectedOutcome: 'blocked',
          actualOutcome: 'blocked',
          detectionTime: 0.3,
          details: 'Exploit attempt blocked at network level, payload prevented from executing. Alert generated correctly with proper context.'
        },
        {
          id: 'test-003',
          name: 'Living-off-the-Land (LotL) Attack Detection',
          description: 'Test detection of attacks using legitimate system tools (PowerShell, WMI, etc.)',
          attackTactic: 'Execution',
          attackTechnique: 'Command and Scripting Interpreter',
          status: 'failed',
          expectedOutcome: 'detected',
          actualOutcome: 'missed',
          executionTime: '2026-04-19 10:35',
          details: 'PowerShell Empire C2 activity completely undetected. No alerts generated despite multiple suspicious commands and encoded payload execution.'
        },
        {
          id: 'test-004',
          name: 'Phishing Malware Execution',
          description: 'Test detection of malware downloaded and executed from phishing emails',
          attackTactic: 'Execution',
          attackTechnique: 'User Execution',
          status: 'passed',
          expectedOutcome: 'blocked',
          actualOutcome: 'blocked',
          detectionTime: 0.1,
          details: 'Malware payload blocked immediately upon execution. Malicious file quarantined successfully, user notified, alert generated with email context.'
        },
        {
          id: 'test-005',
          name: 'Credential Dumping Detection',
          description: 'Test detection of LSASS memory dumping and credential theft attempts',
          attackTactic: 'Credential Access',
          attackTechnique: 'OS Credential Dumping',
          status: 'warning',
          expectedOutcome: 'detected',
          actualOutcome: 'detected',
          detectionTime: 120,
          details: 'Credential dumping activity detected, but with 2 minute delay. Attack had already completed and exfiltrated hashes before alert was generated.'
        },
        {
          id: 'test-006',
          name: 'Lateral Movement via SMB Detection',
          description: 'Test detection of pass-the-hash attacks and lateral movement over SMB',
          attackTactic: 'Lateral Movement',
          attackTechnique: 'Remote Services: SMB/Windows Admin Shares',
          status: 'failed',
          expectedOutcome: 'detected',
          actualOutcome: 'missed',
          executionTime: '2026-04-19 11:20',
          details: 'Pass-the-hash attack from compromised workstation to file server completely undetected. No alerts generated for anomalous SMB connections or authentication events.'
        }
      ],
      summary: {
        overallEffectiveness: 73,
        preventionRate: 65,
        detectionRate: 78,
        responseRate: 82,
        averageDetectionTime: 47,
        gapsIdentified: 9,
        recommendations: [
          'Deploy behavioral detection rules for LotL PowerShell/WMI activity',
          'Enable real-time LSASS protection to prevent credential dumping',
          'Update EDR signatures for latest ransomware families with behavior-based prevention',
          'Implement network anomaly detection for unusual SMB authentication patterns',
          'Tune correlation rules to reduce detection time for critical attacks'
        ]
      }
    },
    {
      id: 'sim-2026-002',
      name: 'Incident Response Drill - Ransomware Scenario',
      description: 'Full IR process drill simulating enterprise ransomware attack',
      type: 'incident-response-drill',
      status: 'running',
      startTime: '2026-04-21 14:00',
      totalTests: 45,
      passedTests: 18,
      failedTests: 7,
      targetSystems: ['Entire production environment'],
      operators: ['blue-team-lead', 'incident-response-team', 'IT-operations'],
      tests: [],
      summary: undefined
    }
  ];

  private _detectionRules: DetectionRule[] = [
    {
      id: 'rule-001',
      name: 'Ransomware File Encryption Behavior',
      type: 'behavioral',
      description: 'Detects rapid mass file encryption activity with known ransomware extensions',
      severity: 'critical',
      enabled: true,
      testResults: {
        totalTests: 25,
        passedTests: 12,
        failedTests: 13,
        falsePositives: 3,
        falseNegatives: 13,
        averageDetectionTime: 120
      },
      lastUpdated: '2026-03-15'
    },
    {
      id: 'rule-002',
      name: 'Log4j Exploit Attempt (CVE-2026-1234)',
      type: 'signature',
      description: 'Detects Log4j JNDI lookup exploitation attempts in network traffic',
      severity: 'critical',
      enabled: true,
      testResults: {
        totalTests: 15,
        passedTests: 15,
        failedTests: 0,
        falsePositives: 2,
        falseNegatives: 0,
        averageDetectionTime: 0.3
      },
      lastUpdated: '2026-04-01'
    },
    {
      id: 'rule-003',
      name: 'Suspicious PowerShell Command Line',
      type: 'behavioral',
      description: 'Detects obfuscated, encoded, or suspicious PowerShell command patterns',
      severity: 'high',
      enabled: true,
      testResults: {
        totalTests: 30,
        passedTests: 8,
        failedTests: 22,
        falsePositives: 12,
        falseNegatives: 22
      },
      lastUpdated: '2026-02-20'
    },
    {
      id: 'rule-004',
      name: 'LSASS Memory Access Attempt',
      type: 'behavioral',
      description: 'Detects non-standard processes accessing LSASS memory for credential dumping',
      severity: 'critical',
      enabled: true,
      testResults: {
        totalTests: 12,
        passedTests: 9,
        failedTests: 3,
        falsePositives: 1,
        falseNegatives: 3,
        averageDetectionTime: 47
      },
      lastUpdated: '2026-03-30'
    },
    {
      id: 'rule-005',
      name: 'Unusual SMB Lateral Movement',
      type: 'anomaly',
      description: 'Detects anomalous SMB connection patterns indicating lateral movement',
      severity: 'high',
      enabled: false,
      testResults: {
        totalTests: 10,
        passedTests: 2,
        failedTests: 8,
        falsePositives: 28,
        falseNegatives: 8
      },
      lastUpdated: '2026-01-10'
    }
  ];

  private _securityControls: SecurityControl[] = [
    {
      id: 'control-001',
      name: 'EDR/XDR Endpoint Protection',
      type: 'prevention',
      description: 'Endpoint detection and response platform',
      coverage: ['All endpoints', 'Servers'],
      effectivenessScore: 73,
      testResults: {
        totalAttacksBlocked: 78,
        totalAttacksDetected: 94,
        totalAttacksMissed: 22,
        bypassedBy: ['LotL PowerShell attacks', 'Custom ransomware strains', 'Pass-the-hash lateral movement']
      },
      status: 'active'
    },
    {
      id: 'control-002',
      name: 'Next-Generation Firewall (NGFW)',
      type: 'prevention',
      description: 'Network edge security with IPS/IDS',
      coverage: ['Network edge', 'North-south traffic'],
      effectivenessScore: 92,
      testResults: {
        totalAttacksBlocked: 110,
        totalAttacksDetected: 116,
        totalAttacksMissed: 4,
        bypassedBy: ['Encrypted C2 traffic', 'Zero-day exploits']
      },
      status: 'active'
    },
    {
      id: 'control-003',
      name: 'Email Security Gateway',
      type: 'prevention',
      description: 'Anti-phishing and anti-malware email protection',
      coverage: ['All email traffic'],
      effectivenessScore: 85,
      testResults: {
        totalAttacksBlocked: 102,
        totalAttacksDetected: 108,
        totalAttacksMissed: 12,
        bypassedBy: ['Zero-day phishing campaigns', 'Malicious macros in password-protected archives']
      },
      status: 'active'
    },
    {
      id: 'control-004',
      name: 'SIEM Correlation Rules',
      type: 'detection',
      description: 'Security information and event management system',
      coverage: ['All security logs', 'Network logs', 'Endpoint logs'],
      effectivenessScore: 62,
      testResults: {
        totalAttacksBlocked: 0,
        totalAttacksDetected: 74,
        totalAttacksMissed: 46,
        bypassedBy: ['LotL attacks with no signatures', 'Slow and stealthy attacks', 'Encrypted traffic']
      },
      status: 'misconfigured'
    }
  ];

  constructor() {
    super();
    this._selectedSimulation = this._simulations[0];
  }

  private _getScoreClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'average';
    if (score >= 30) return 'poor';
    return 'bad';
  }

  private _getGaugeColorClass(score: number): string {
    if (score >= 70) return 'green';
    if (score >= 50) return 'yellow';
    if (score >= 30) return 'orange';
    return 'red';
  }

  private _getControlScoreClass(score: number): string {
    if (score >= 80) return 'score-green';
    if (score >= 60) return 'score-yellow';
    if (score >= 40) return 'score-orange';
    return 'score-red';
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
  @state() private _btdsRules: { id: string; name: string; category: string; severity: Severity; enabled: boolean; lastEval: string; passRate: number }[] = [];
  private _initBtdsRules() {
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
    this._btdsRules = rules;
  }
  private _evaluateBtdsRules(): { passed: number; failed: number; skipped: number; total: number } {
    let passed = 0, failed = 0, skipped = 0;
    this._btdsRules.forEach(r => { if (!r.enabled) { skipped++; } else if (r.passRate >= 80) { passed++; } else { failed++; } });
    return { passed, failed, skipped, total: this._btdsRules.length };
  }

  // --- CVSS Scoring ---
  @state() private _btdscvssData: { itemId: string; vector: string; base: number; temporal: number; environmental: number; overall: number }[] = [];
  private _initBtdsCvss() {
    const vectors = ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:A/AC:H/PR:L/UI:R/S:C/C:L/I:L/A:N', 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N', 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:N/I:L/A:N'];
    this._btdscvssData = vectors.map((v, i) => {
      const base = parseFloat((Math.random() * 6 + 3).toFixed(1));
      const temporal = parseFloat((base * (0.7 + Math.random() * 0.3)).toFixed(1));
      const environmental = parseFloat((temporal * (0.8 + Math.random() * 0.2)).toFixed(1));
      return { itemId: 'V-' + String(i + 1).padStart(3, '0'), vector: v, base, temporal, environmental, overall: environmental };
    });
  }

  // --- Anomaly Detection ---
  @state() private _btdsanomalies: { id: string; type: string; severity: Severity; description: string; detected: string; confidence: number; affected: string[] }[] = [];
  private _runBtdsAnomalyDetection() {
    const types = [
      { type: 'Spike in violation rate', severity: 'high' as Severity, desc: 'Detected 280% increase in violations over the last 24 hours', affected: ['Core', 'Operations'] },
      { type: 'SLA breach pattern', severity: 'critical' as Severity, desc: 'Recurring SLA breaches on weekends indicating staffing gaps', affected: ['SLA', 'Staffing'] },
      { type: 'Baseline drift detected', severity: 'medium' as Severity, desc: 'Score drifted 10 points below established baseline over 7 days', affected: ['Metrics', 'Baseline'] },
      { type: 'Unusual escalation volume', severity: 'high' as Severity, desc: 'Escalation rate 2.5x above normal in infrastructure controls', affected: ['Infrastructure', 'Controls'] },
      { type: 'Stale findings accumulation', severity: 'low' as Severity, desc: '18 findings older than 90 days without status change', affected: ['Maintenance'] },
    ];
    this._btdsanomalies = types.map((a, i) => ({
      id: 'ANO-' + String(i + 1).padStart(3, '0'), type: a.type, severity: a.severity,
      description: a.desc, detected: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(2)), affected: a.affected,
    }));
  }

  // --- Trend Prediction ---
  @state() private _btdspredictions: { horizon: string; metric: string; current: number; predicted: number; direction: 'up' | 'down' | 'stable'; confidence: number }[] = [];
  private _generateBtdsPredictions() {
    this._btdspredictions = [
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
  @state() private _btdsApprovals: { id: string; title: string; requester: string; status: 'pending' | 'approved' | 'rejected' | 'expired'; createdAt: string; priority: Priority; type: string }[] = [];
  private _initBtdsApprovals() {
    this._btdsApprovals = [
      { id: 'APR-001', title: 'Emergency exception request for critical finding', requester: 'Alice Chen', status: 'pending', createdAt: '2026-04-23T07:00:00Z', priority: 'p1', type: 'Exception' },
      { id: 'APR-002', title: 'Extend compliance deadline for quarterly audit', requester: 'Bob Martinez', status: 'pending', createdAt: '2026-04-22T18:00:00Z', priority: 'p2', type: 'Extension' },
      { id: 'APR-003', title: 'Disable security control for system migration', requester: 'Carol Wu', status: 'rejected', createdAt: '2026-04-22T14:00:00Z', priority: 'p1', type: 'Policy Change' },
      { id: 'APR-004', title: 'New assessment approval for third-party vendor', requester: 'Dave Kim', status: 'approved', createdAt: '2026-04-21T10:00:00Z', priority: 'p3', type: 'Vendor' },
      { id: 'APR-005', title: 'Network rule change for partner integration', requester: 'Eve Johnson', status: 'expired', createdAt: '2026-04-19T08:00:00Z', priority: 'p2', type: 'Network' },
    ];
  }
  private _approveBtdsItem(id: string) { const item = this._btdsApprovals.find(a => a.id === id); if (item) item.status = 'approved'; this.requestUpdate(); }
  private _rejectBtdsItem(id: string) { const item = this._btdsApprovals.find(a => a.id === id); if (item) item.status = 'rejected'; this.requestUpdate(); }

  // --- Activity Feed ---
  @state() private _btdsActivity: { id: string; action: string; user: string; target: string; timestamp: string }[] = [];
  private _initBtdsActivity() {
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
    this._btdsActivity = actions.map((a, i) => ({ id: 'ACT-' + String(i + 1).padStart(3, '0'), ...a, timestamp: new Date(Date.now() - i * 3600000).toISOString() }));
  }

  // --- Notification System ---
  @state() private _btdsNotifications: { id: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; read: boolean; timestamp: string }[] = [];
  private _initBtdsNotifications() {
    this._btdsNotifications = [
      { id: 'NTF-001', message: 'Score dropped below threshold', type: 'warning', read: false, timestamp: new Date().toISOString() },
      { id: 'NTF-002', message: '3 items approaching SLA deadline within 24h', type: 'error', read: false, timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: 'NTF-003', message: 'Weekly report generated successfully', type: 'success', read: true, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'NTF-004', message: 'New framework mapped to existing controls', type: 'info', read: true, timestamp: new Date(Date.now() - 14400000).toISOString() },
    ];
  }
  private _markBtdsNotifRead(id: string) { const n = this._btdsNotifications.find(x => x.id === id); if (n) n.read = true; this.requestUpdate(); }

  // --- Panel Configuration ---
  @state() private _btdsConfig: { layout: 'compact' | 'default' | 'expanded'; theme: 'dark' | 'midnight' | 'slate'; showAnomalies: boolean; showPredictions: boolean; autoRefresh: boolean; refreshInterval: number } = {
    layout: 'default', theme: 'dark', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60,
  };
  private _btdsPresets: { name: string; config: typeof this._btdsConfig }[] = [
    { name: 'Analyst View', config: { layout: 'expanded', theme: 'dark', showAnomalies: true, showPredictions: false, autoRefresh: true, refreshInterval: 30 } },
    { name: 'Executive Summary', config: { layout: 'compact', theme: 'slate', showAnomalies: false, showPredictions: true, autoRefresh: false, refreshInterval: 300 } },
    { name: 'Audit Mode', config: { layout: 'expanded', theme: 'midnight', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60 } },
  ];
  private _applyBtdsPreset(preset: typeof this._btdsPresets[0]) { this._btdsConfig = { ...preset.config }; this.requestUpdate(); }

  private _renderBtdsTreemapSVG(): string {
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

  private _renderBtdsSankeySVG(): string {
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
  private _renderBtdsRules(): any {
    const ev = this._evaluateBtdsRules();
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
          $${this._btdsRules.map(r => html`
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
  private _renderBtdsAnomalies(): any {
    const sc = (s: Severity) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Anomaly Detection</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._btdsanomalies.map(a => html`
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
  private _renderBtdsPredictions(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Trend Predictions</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          $${this._btdspredictions.map(pr => html`
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
  private _renderBtdsApprovals(): any {
    const stc = (s: string) => s === 'pending' ? '#eab308' : s === 'approved' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#6b7280';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Approval Workflow</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._btdsApprovals.map(a => html`
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
                  <button class="btn success" style="padding:2px 8px;font-size:9px" @click=$${() => this._approveBtdsItem(a.id)}>Approve</button>
                  <button class="btn error" style="padding:2px 8px;font-size:9px" @click=$${() => this._rejectBtdsItem(a.id)}>Reject</button>
                </div>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Activity Feed ---
  private _renderBtdsActivity(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Activity Feed</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto">
          $${this._btdsActivity.map(a => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <div style="width:20px;height:20px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;font-size:9px">•</div>
              <div style="flex:1"><span style="font-weight:600">$${a.user}</span> $${a.action}</div>
              <span style="font-size:8px;color:#6b7280">$${new Date(a.timestamp).toLocaleTimeString()}</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Notifications ---
  private _renderBtdsNotifications(): any {
    const tc = (t: string) => t === 'error' ? '#ef4444' : t === 'warning' ? '#eab308' : t === 'success' ? '#22c55e' : '#3b82f6';
    const unread = this._btdsNotifications.filter(n => !n.read).length;
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Notifications $${unread > 0 ? html`<span class="badge badge-error">$${unread} new</span>` : nothing}</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:120px;overflow-y:auto">
          $${this._btdsNotifications.map(n => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:$${n.read ? '#1f2937' : '#252a36'};border-radius:4px;font-size:10px;opacity:$${n.read ? '0.6' : '1'};cursor:pointer" @click=$${() => this._markBtdsNotifRead(n.id)}>
              <span style="width:8px;height:8px;border-radius:50%;background:$${tc(n.type)}"></span>
              <span style="flex:1">$${n.message}</span>
              $${!n.read ? html`<span style="width:6px;height:6px;border-radius:50%;background:#3b82f6"></span>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Panel Config ---
  private _renderBtdsConfig(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Panel Configuration</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Layout</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._btdsConfig.layout = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="compact" ?selected=$${this._btdsConfig.layout === 'compact'}>Compact</option>
              <option value="default" ?selected=$${this._btdsConfig.layout === 'default'}>Default</option>
              <option value="expanded" ?selected=$${this._btdsConfig.layout === 'expanded'}>Expanded</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Theme</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._btdsConfig.theme = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="dark" ?selected=$${this._btdsConfig.theme === 'dark'}>Dark</option>
              <option value="midnight" ?selected=$${this._btdsConfig.theme === 'midnight'}>Midnight</option>
              <option value="slate" ?selected=$${this._btdsConfig.theme === 'slate'}>Slate</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Auto Refresh</span>
            <input type="checkbox" ?checked=$${this._btdsConfig.autoRefresh} @change=$${() => { this._btdsConfig.autoRefresh = !this._btdsConfig.autoRefresh; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Anomalies</span>
            <input type="checkbox" ?checked=$${this._btdsConfig.showAnomalies} @change=$${() => { this._btdsConfig.showAnomalies = !this._btdsConfig.showAnomalies; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Predictions</span>
            <input type="checkbox" ?checked=$${this._btdsConfig.showPredictions} @change=$${() => { this._btdsConfig.showPredictions = !this._btdsConfig.showPredictions; this.requestUpdate(); }}/>
          </div>
          <div style="margin-top:6px;font-weight:600">Presets</div>
          <div style="display:flex;gap:4px">
            $${this._btdsPresets.map(ps => html`<button class="btn" style="padding:2px 8px;font-size:9px" @click=$${() => this._applyBtdsPreset(ps)}>$${ps.name}</button>`)}
          </div>
        </div>
      </div>`;
  }

  render() {
    if (!this._selectedSimulation) {
      return html`<div class="panel"><div class="empty-state">No simulation selected</div></div>`;
    }
    if (this._btdsRules.length === 0) { this._initBtdsRules(); this._initBtdsCvss(); this._runBtdsAnomalyDetection(); this._generateBtdsPredictions(); this._initBtdsApprovals(); this._initBtdsActivity(); this._initBtdsNotifications(); }

    const summary = this._selectedSimulation.summary;

    return html`
      <div class="panel">
        <div class="pt">
          🛡️ Blue Team Defense Simulator
          <span class="status-badge status-${this._selectedSimulation.status}">
            ${this._selectedSimulation.status.replace('-', ' ').toUpperCase()}
          </span>
        </div>

        <div class="simulation-header">
          <div class="simulation-info">
            <h2>${this._selectedSimulation.name}</h2>
            <div class="simulation-meta">
              <span class="type-badge">${this._selectedSimulation.type.replace(/-/g, ' ')}</span>
              <span>Duration: ${this._selectedSimulation.startTime} - ${this._selectedSimulation.endTime || 'In Progress'}</span>
              <span>Operators: ${this._selectedSimulation.operators.join(', ')}</span>
              <span>Tests: ${this._selectedSimulation.passedTests} Passed / ${this._selectedSimulation.failedTests} Failed / ${this._selectedSimulation.totalTests} Total</span>
            </div>
          </div>
          <div class="controls">
            ${this._simulations.map(s => html`
              <button class="btn ${s.id === this._selectedSimulation.id ? 'active' : ''}" @click=${() => {
                this._selectedSimulation = s;
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
              <div class="score-value ${this._getScoreClass(summary.overallEffectiveness)}">${summary.overallEffectiveness}%</div>
              <div class="score-label">Overall Effectiveness</div>
              <div class="gauge-container">
                <div class="gauge-fill ${this._getGaugeColorClass(summary.overallEffectiveness)}" style="width: ${summary.overallEffectiveness}%"></div>
              </div>
            </div>
            <div class="score-card">
              <div class="score-value ${this._getScoreClass(summary.preventionRate)}">${summary.preventionRate}%</div>
              <div class="score-label">Prevention Rate</div>
              <div class="gauge-container">
                <div class="gauge-fill ${this._getGaugeColorClass(summary.preventionRate)}" style="width: ${summary.preventionRate}%"></div>
              </div>
            </div>
            <div class="score-card">
              <div class="score-value ${this._getScoreClass(summary.detectionRate)}">${summary.detectionRate}%</div>
              <div class="score-label">Detection Rate</div>
              <div class="gauge-container">
                <div class="gauge-fill ${this._getGaugeColorClass(summary.detectionRate)}" style="width: ${summary.detectionRate}%"></div>
              </div>
            </div>
            <div class="score-card">
              <div class="score-value ${this._getScoreClass(summary.responseRate)}">${summary.responseRate}%</div>
              <div class="score-label">Response Rate</div>
              <div class="gauge-container">
                <div class="gauge-fill ${this._getGaugeColorClass(summary.responseRate)}" style="width: ${summary.responseRate}%"></div>
              </div>
            </div>
            <div class="score-card">
              <div class="score-value ${this._getScoreClass(100 - (summary.averageDetectionTime / 300) * 100)}">${summary.averageDetectionTime}s</div>
              <div class="score-label">Avg Detection Time</div>
            </div>
            <div class="score-card">
              <div class="score-value bad">${summary.gapsIdentified}</div>
              <div class="score-label">Gaps Identified</div>
            </div>
          </div>
        ` : nothing}

        <div class="content-tabs">
          <button class="tab-btn ${this._activeTab === 'test-results' ? 'active' : ''}" @click=${() => this._activeTab = 'test-results'}>
            🧪 Test Results
          </button>
          <button class="tab-btn ${this._activeTab === 'detection-rules' ? 'active' : ''}" @click=${() => this._activeTab = 'detection-rules'}>
            📏 Detection Rules
          </button>
          <button class="tab-btn ${this._activeTab === 'security-controls' ? 'active' : ''}" @click=${() => this._activeTab = 'security-controls'}>
            🔒 Security Controls
          </button>
          <button class="tab-btn ${this._activeTab === 'recommendations' ? 'active' : ''}" @click=${() => this._activeTab = 'recommendations'}>
            💡 Recommendations
          </button>
        </div>

        <div class="tab-content ${this._activeTab === 'test-results' ? 'active' : ''}">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">
            Simulation Test Results (${this._selectedSimulation.tests.length} tests executed)
          </h3>
          <div class="test-results-grid">
            ${this._selectedSimulation.tests.length > 0 ? this._selectedSimulation.tests.map(test => html`
              <div class="test-card">
                <div class="test-header">
                  <div class="test-name">${test.name}</div>
                  <span class="test-status test-status-${test.status}">${test.status}</span>
                </div>
                <div class="test-meta">
                  <span class="test-tactic">${test.attackTactic} > ${test.attackTechnique}</span>
                  ${test.cve ? html`<span>CVE: ${test.cve}</span>` : nothing}
                  ${test.executionTime ? html`<span>Executed: ${test.executionTime}</span>` : nothing}
                </div>
                <div class="test-outcome">
                  <div class="outcome-item">
                    <span class="outcome-label">Expected</span>
                    <span class="outcome-value outcome-${test.expectedOutcome}">${test.expectedOutcome.toUpperCase()}</span>
                  </div>
                  <div class="outcome-item">
                    <span class="outcome-label">Actual</span>
                    <span class="outcome-value outcome-${test.actualOutcome}">${test.actualOutcome.toUpperCase()}</span>
                  </div>
                  ${test.detectionTime !== undefined ? html`
                    <div class="outcome-item">
                      <span class="outcome-label">Detection Time</span>
                      <span class="outcome-value">${test.detectionTime}s</span>
                    </div>
                  ` : nothing}
                </div>
                <div class="test-details">${test.details}</div>
              </div>
            `) : html`<div class="empty-state">No test results available for this simulation</div>`}
          </div>
        </div>

        <div class="tab-content ${this._activeTab === 'detection-rules' ? 'active' : ''}">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">
            Detection Rule Effectiveness (${this._detectionRules.length} rules evaluated)
          </h3>
          <div class="rules-grid">
            ${this._detectionRules.map(rule => html`
              <div class="rule-card">
                <div class="rule-header">
                  <div class="rule-name">${rule.name}</div>
                  <span class="rule-type rule-type-${rule.type}">${rule.type.replace('-', ' ')}</span>
                </div>
                <div style="font-size: 11px; color: var(--text-secondary, #cbd5e1); margin-bottom: 6px;">${rule.description}</div>
                <div class="rule-effectiveness">
                  <div class="effectiveness-item">
                    <span class="effectiveness-label">Detection Rate</span>
                    <span class="effectiveness-value ${rule.testResults.passedTests / rule.testResults.totalTests >= 0.7 ? 'good' : 'poor'}">
                      ${Math.round((rule.testResults.passedTests / rule.testResults.totalTests) * 100)}%
                    </span>
                  </div>
                  <div class="effectiveness-item">
                    <span class="effectiveness-label">False Negatives</span>
                    <span class="effectiveness-value ${rule.testResults.falseNegatives <= 3 ? 'good' : 'poor'}">
                      ${rule.testResults.falseNegatives}
                    </span>
                  </div>
                  <div class="effectiveness-item">
                    <span class="effectiveness-label">False Positives</span>
                    <span class="effectiveness-value ${rule.testResults.falsePositives <= 5 ? 'good' : 'warning'}">
                      ${rule.testResults.falsePositives}
                    </span>
                  </div>
                  ${rule.testResults.averageDetectionTime ? html`
                    <div class="effectiveness-item">
                      <span class="effectiveness-label">Avg Detection Time</span>
                      <span class="effectiveness-value ${rule.testResults.averageDetectionTime <= 10 ? 'good' : 'warning'}">
                        ${rule.testResults.averageDetectionTime}s
                      </span>
                    </div>
                  ` : nothing}
                </div>
                <div style="font-size: 10px; color: var(--text-tertiary, #94a3b8); display: flex; justify-content: space-between; margin-top: 4px;">
                  <span>Severity: ${rule.severity.toUpperCase()}</span>
                  <span>Last updated: ${rule.lastUpdated}</span>
                  <span>Status: ${rule.enabled ? 'ENABLED' : 'DISABLED'}</span>
                </div>
              </div>
            `)}
          </div>
        </div>

        <div class="tab-content ${this._activeTab === 'security-controls' ? 'active' : ''}">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">
            Security Control Effectiveness Evaluation
          </h3>
          <div class="controls-list">
            ${this._securityControls.map(control => html`
              <div class="control-item">
                <div class="control-score ${this._getControlScoreClass(control.effectivenessScore)}">
                  ${control.effectivenessScore}
                </div>
                <div class="control-info">
                  <div class="control-name">${control.name}</div>
                  <div class="control-type">${control.type.toUpperCase()} • ${control.status.toUpperCase()}</div>
                  <div style="font-size: 11px; color: var(--text-secondary, #cbd5e1); margin-top: 3px;">${control.description}</div>
                  <div class="control-metrics">
                    <span>Blocked: ${control.testResults.totalAttacksBlocked}</span>
                    <span>Detected: ${control.testResults.totalAttacksDetected}</span>
                    <span>Missed: ${control.testResults.totalAttacksMissed}</span>
                  </div>
                  ${control.testResults.bypassedBy.length > 0 ? html`
                    <div style="font-size: 10px; color: #f97316; margin-top: 4px;">
                      Bypassed by: ${control.testResults.bypassedBy.join(', ')}
                    </div>
                  ` : nothing}
                </div>
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

declare global { interface HTMLElementTagNameMap { 'sc-blueteam-defense-simulator': ScBlueteamDefenseSimulator; } }
