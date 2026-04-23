/**
 * sc-soc-analyst-workflow — SOC Analyst Workflow Automation
 * Alert triage, case management, and analyst workload balancing
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Alert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  time: string;
  assignee: string | null;
  status: 'new' | 'triage' | 'investigating' | 'escalated' | 'resolved';
  ruleName: string;
}

interface Case {
  id: string;
  title: string;
  alerts: number;
  severity: string;
  status: string;
  assignee: string;
  created: string;
  sla: string;
}

interface Analyst {
  name: string;
  activeCases: number;
  resolvedToday: number;
  avgResolution: string;
  load: number;
}

@customElement('sc-soc-analyst-workflow')
export class ScSocAnalystWorkflow extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 16px; }
    .stat { background: #1f2937; border-radius: 8px; padding: 12px; text-align: center; }
    .sv { font-size: 20px; font-weight: 700; }
    .sl { font-size: 9px; color: #94a3b8; margin-top: 2px; text-transform: uppercase; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; color: #94a3b8; }
    .tab:hover { background: #374151; }
    .tab.active { background: #f59e0b; color: #111827; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .section { background: #1f2937; border-radius: 8px; padding: 14px; }
    .stitle { font-weight: 600; font-size: 12px; margin-bottom: 10px; color: #94a3b8; text-transform: uppercase; }
    .alert-row { background: #0f172a; border-left: 3px solid; border-radius: 4px; padding: 10px; margin-bottom: 6px; cursor: pointer; transition: all 0.2s; }
    .alert-row:hover { background: #1c1f2e; }
    .alert-row.critical { border-color: #ef4444; }
    .alert-row.high { border-color: #f97316; }
    .alert-row.medium { border-color: #eab308; }
    .alert-row.low { border-color: #22c55e; }
    .alert-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .alert-title { font-weight: 600; font-size: 12px; }
    .alert-meta { display: flex; gap: 12px; font-size: 10px; color: #6b7280; }
    .badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .b-new { background: #450a0a; color: #fca5a5; }
    .b-triage { background: #422006; color: #fde047; }
    .b-investigating { background: #172554; color: #93c5fd; }
    .b-escalated { background: #7f1d1d; color: #fca5a5; }
    .b-resolved { background: #052e16; color: #86efac; }
    .analyst-card { background: #0f172a; border-radius: 6px; padding: 10px; margin-bottom: 6px; display: flex; align-items: center; gap: 10px; }
    .analyst-avatar { width: 36px; height: 36px; border-radius: 50%; background: #374151; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .analyst-info { flex: 1; }
    .analyst-name { font-weight: 600; font-size: 12px; }
    .analyst-meta { font-size: 10px; color: #6b7280; }
    .load-bar { width: 60px; height: 6px; background: #374151; border-radius: 3px; overflow: hidden; }
    .load-fill { height: 100%; border-radius: 3px; }
    .case-card { background: #0f172a; border-radius: 6px; padding: 12px; margin-bottom: 6px; }
    .case-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .runbook-btn { background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .runbook-btn:hover { background: #2563eb; }
    .handoff-box { background: #0f172a; border-radius: 8px; padding: 14px; margin-top: 12px; }
    textarea { width: 100%; padding: 8px; background: #0f172a; border: 1px solid #374151; border-radius: 6px; color: #e2e8f0; font-size: 11px; font-family: inherit; outline: none; resize: vertical; min-height: 50px; }
    .tag { display: inline-block; padding: 2px 6px; background: #374151; border-radius: 4px; font-size: 9px; color: #94a3b8; }
    .approval-row { display: flex; align-items: center; gap: 10px; padding: 10px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; }
    .approval-btn { padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer; border: none; }
    .approval-btn.approve { background: #22c55e; color: #fff; }
    .approval-btn.reject { background: #ef4444; color: #fff; }
    .task-row { display: flex; align-items: center; gap: 10px; padding: 10px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; }
    .task-check { accent-color: #22c55e; width: 16px; height: 16px; }
    .status-badge { font-size: 9px; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
    .status-badge.in-progress { background: #f59e0b20; color: #f59e0b; }
    .status-badge.pending { background: #374151; color: #94a3b8; }
    .status-badge.completed { background: #22c55e20; color: #22c55e; }
    .playbook-step { display: flex; gap: 12px; padding: 10px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; align-items: flex-start; }
    .step-num { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .step-num.done { background: #22c55e; color: #fff; }
    .step-num.active { background: #f59e0b; color: #111; }
    .step-num.wait { background: #374151; color: #94a3b8; }
    .export-btn { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; }
    .export-btn:hover { border-color: #f59e0b; }
    .exec-pipeline { background: #0f172a; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .pipeline-step { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #1f2937; }
    .pipeline-step:last-child { border-bottom: none; }
    .step-icon { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .step-icon.pending { background: #374151; color: #6b7280; }
    .step-icon.running { background: #f59e0b20; color: #f59e0b; animation: pulse 1.5s infinite; }
    .step-icon.done { background: #22c55e20; color: #22c55e; }
    .step-icon.error { background: #ef444420; color: #ef4444; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    .step-info { flex: 1; }
    .step-name { font-size: 12px; font-weight: 600; }
    .step-desc { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .step-time { font-size: 10px; color: #94a3b8; min-width: 60px; text-align: right; }
    .sla-timer { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; }
    .sla-bar { flex: 1; height: 6px; background: #374151; border-radius: 3px; overflow: hidden; }
    .sla-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }
    .sla-label { font-size: 10px; min-width: 60px; text-align: right; font-weight: 600; }
    .config-section { background: #0f172a; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .config-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1f2937; }
    .config-row:last-child { border-bottom: none; }
    .config-label { font-size: 12px; color: #e2e8f0; }
    .config-desc { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .config-toggle { position: relative; width: 40px; height: 22px; background: #374151; border-radius: 11px; cursor: pointer; transition: background 0.3s; border: none; }
    .config-toggle.on { background: #f59e0b; }
    .config-toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: transform 0.3s; }
    .config-toggle.on::after { transform: translateX(18px); }
    .audit-entry { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid #1f2937; font-size: 10px; }
    .audit-time { color: #6b7280; min-width: 120px; flex-shrink: 0; }
    .audit-action { color: #f59e0b; font-weight: 600; min-width: 100px; }
    .audit-detail { color: #94a3b8; }
    .form-group { margin-bottom: 12px; }
    .form-label { display: block; font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 4px; }
    .form-input { width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #374151; border-radius: 6px; color: #e2e8f0; font-size: 12px; outline: none; }
    .form-input:focus { border-color: #f59e0b; }
    .topology-svg { background: #0f172a; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .risk-card { background: #0f172a; border-radius: 8px; padding: 14px; margin-bottom: 8px; }
    .risk-factor-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid #1f2937; font-size: 11px; }
    .risk-factor-row:last-child { border-bottom: none; }
    .risk-factor-label { flex: 1; color: #94a3b8; }
    .risk-factor-bar { width: 100px; height: 6px; background: #374151; border-radius: 3px; overflow: hidden; }
    .risk-factor-fill { height: 100%; border-radius: 3px; transition: width 0.4s; }
    .risk-factor-value { min-width: 32px; text-align: right; font-weight: 700; }
    .sankey-svg { background: #0f172a; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .intel-row { display: flex; gap: 10px; padding: 8px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; align-items: center; }
    .intel-type { padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .intel-ip { font-family: monospace; font-size: 12px; color: #e2e8f0; }
    .intel-detail { flex: 1; font-size: 10px; color: #6b7280; }
    .intel-confidence { font-size: 10px; font-weight: 700; }
    .notification-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; position: relative; }
    .notification-dot::after { content: ''; position: absolute; top: -2px; left: -2px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #ef4444; animation: notif-pulse 1.5s infinite; }
    @keyframes notif-pulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.6); opacity: 0; } }
    .mention-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: #3b82f620; border-radius: 12px; font-size: 10px; color: #60a5fa; }
    .trend-indicator { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 700; }
    .trend-up { color: #ef4444; }
    .trend-down { color: #22c55e; }
    .trend-flat { color: #94a3b8; }
    .insight-card { background: linear-gradient(135deg, #1f2937 0%, #0f172a 100%); border-radius: 8px; padding: 14px; margin-bottom: 8px; border-left: 3px solid #f59e0b; }
    .insight-title { font-size: 12px; font-weight: 700; color: #f59e0b; margin-bottom: 4px; }
    .insight-body { font-size: 11px; color: #94a3b8; line-height: 1.5; }
    .config-select { padding: 6px 10px; background: #0f172a; border: 1px solid #374151; border-radius: 6px; color: #e2e8f0; font-size: 11px; outline: none; }
    .config-select:focus { border-color: #f59e0b; }
    .workload-bar-container { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .workload-bar-label { font-size: 10px; color: #94a3b8; min-width: 80px; }
    .workload-bar-track { flex: 1; height: 18px; background: #1f2937; border-radius: 4px; overflow: hidden; display: flex; }
    .workload-bar-seg { height: 100%; transition: width 0.3s; }
    .workload-bar-value { font-size: 10px; font-weight: 700; min-width: 30px; text-align: right; }
    .anomaly-marker { width: 12px; height: 12px; background: #ef4444; border-radius: 50%; border: 2px solid #0f172a; animation: pulse 1.5s infinite; }
    .team-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .team-member-card { background: #0f172a; border-radius: 8px; padding: 12px; text-align: center; }
    .team-member-avatar { width: 44px; height: 44px; border-radius: 50%; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; }
    .team-member-name { font-weight: 600; font-size: 12px; margin-bottom: 2px; }
    .team-member-role { font-size: 9px; color: #6b7280; margin-bottom: 6px; }
    .team-member-stats { display: flex; justify-content: center; gap: 12px; font-size: 10px; }
    .team-stat-item { text-align: center; }
    .team-stat-value { font-weight: 700; font-size: 14px; }
    .team-stat-label { color: #6b7280; font-size: 8px; }
  `;

  @state() private _tab: 'alerts' | 'cases' | 'workload' | 'handoff' | 'playbook' | 'tasks' | 'approvals' | 'analysis' | 'sla' | 'audit' | 'config' = 'alerts';
  @state() private _selectedAlert: string | null = null;
  @state() private _execPhase = 'idle';
  @state() private _execProgress = 0;
  @state() private _execSteps: { name: string; desc: string; status: 'pending' | 'running' | 'done' | 'error'; duration: number }[] = [];
  @state() private _execResults: { step: string; output: string; timestamp: string }[] = [];
  @state() private _execHistory: { id: string; name: string; completedAt: string; duration: number }[] = [];
  @state() private _auditLog: { timestamp: string; action: string; user: string; detail: string }[] = [];
  @state() private _slaItems: { id: string; case: string; assignee: string; deadline: string; elapsed: number; total: number; priority: string }[] = [];
  @state() private _configSettings: { autoEscalate: boolean; autoAssign: boolean; slaAlerts: boolean; mitreMapping: boolean; playbookAuto: boolean; shiftHandoff: boolean } = { autoEscalate: true, autoAssign: true, slaAlerts: true, mitreMapping: true, playbookAuto: false, shiftHandoff: true };
  @state() private _selectedAlertRisk: { overall: number; factors: { name: string; weight: number; score: number; color: string }[] } | null = null;
  @state() private _panelLayout: 'default' | 'compact' | 'wide' = 'default';
  @state() private _autoRefreshSec: number = 0;
  @state() private _filterPreset: 'all' | 'critical-only' | 'my-alerts' | 'unassigned' = 'all';
  @state() private _notifications: { id: string; message: string; time: string; type: string; read: boolean }[] = [];
  @state() private _showNotifPanel: boolean = false;
  @state() private _trendData: { hour: string; alerts: number; resolved: number; mttb: number }[] = [];
  @state() private _anomalyPoints: number[] = [];

  // Risk Scoring Engine
  private _calculateRiskScore(alert: Alert): { overall: number; factors: { name: string; weight: number; score: number; color: string }[] } {
    const sevScore: Record<string, number> = { critical: 95, high: 75, medium: 45, low: 15 };
    const statusPenalty: Record<string, number> = { new: 0, triage: 5, investigating: -10, escalated: 15, resolved: -50 };
    const sourceReliability: Record<string, number> = { EDR: 90, SIEM: 85, Network: 80, Firewall: 75, IAM: 70, AD: 65, DLP: 70, Endpoint: 60 };
    const mitreFactors: Record<string, number> = { 'T1059.001': 25, 'T1110': 20, 'T1203': 30, 'T1567': 20, 'T1548': 25, 'T1048': 22, 'T1091': 10, 'T1110.001': 22 };
    const assignedFactor = alert.assignee ? -10 : 15;
    const sev = sevScore[alert.severity] || 50;
    const status = statusPenalty[alert.status] || 0;
    const source = sourceReliability[alert.source] || 50;
    const mitre = mitreFactors[alert.ruleName] || 10;
    const timeUrgency = alert.status === 'new' ? 12 : 5;
    const raw = sev * 0.30 + (100 - status) * 0.15 + source * 0.15 + mitre * 0.20 + timeUrgency * 0.10 + (100 - assignedFactor) * 0.10;
    const overall = Math.min(100, Math.max(0, Math.round(raw)));
    const factors = [
      { name: 'Severity Impact', weight: 30, score: sev, color: sev >= 80 ? '#ef4444' : sev >= 50 ? '#f59e0b' : '#22c55e' },
      { name: 'Status Urgency', weight: 15, score: 100 - status, color: status >= 0 ? '#ef4444' : '#22c55e' },
      { name: 'Source Reliability', weight: 15, score: source, color: source >= 80 ? '#22c55e' : '#f59e0b' },
      { name: 'MITRE Threat Level', weight: 20, score: mitre, color: mitre >= 20 ? '#ef4444' : mitre >= 10 ? '#f59e0b' : '#22c55e' },
      { name: 'Assignment Gap', weight: 10, score: 100 - assignedFactor, color: alert.assignee ? '#22c55e' : '#ef4444' },
      { name: 'Time Pressure', weight: 10, score: timeUrgency * 5, color: timeUrgency >= 10 ? '#ef4444' : '#f59e0b' },
    ];
    return { overall, factors };
  }

  private _getRiskLevel(score: number): { label: string; color: string } {
    if (score >= 85) return { label: 'CRITICAL', color: '#ef4444' };
    if (score >= 65) return { label: 'HIGH', color: '#f97316' };
    if (score >= 40) return { label: 'MEDIUM', color: '#eab308' };
    return { label: 'LOW', color: '#22c55e' };
  }

  // MITRE ATT&CK Deep Correlation
  private _mitreTechniqueDB: { id: string; name: string; tactic: string; subtechniques: string[]; detectionRate: number; trends12h: number[] }[] = [
    { id: 'T1059.001', name: 'PowerShell', tactic: 'Execution', subtechniques: ['T1059.001', 'T1059.003'], detectionRate: 92, trends12h: [3, 5, 2, 8, 4, 6, 3, 7, 5, 4, 6, 8] },
    { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access', subtechniques: ['T1110.001', 'T1110.003'], detectionRate: 88, trends12h: [2, 3, 5, 4, 3, 6, 8, 5, 4, 7, 6, 5] },
    { id: 'T1203', name: 'Exploitation for Client Execution', tactic: 'Execution', subtechniques: ['T1203.001', 'T1203.002'], detectionRate: 75, trends12h: [1, 0, 2, 1, 3, 2, 1, 0, 2, 3, 1, 2] },
    { id: 'T1567', name: 'Exfiltration Over Web Service', tactic: 'Exfiltration', subtechniques: ['T1567.001'], detectionRate: 68, trends12h: [0, 1, 0, 2, 1, 0, 1, 2, 3, 1, 0, 1] },
    { id: 'T1548', name: 'Abuse Elevation Control Mechanism', tactic: 'Privilege Escalation', subtechniques: ['T1548.001', 'T1548.002'], detectionRate: 82, trends12h: [1, 2, 1, 3, 2, 1, 2, 4, 3, 2, 3, 4] },
    { id: 'T1048', name: 'Exfiltration Over Alternative Protocol', tactic: 'Exfiltration', subtechniques: ['T1048.001', 'T1048.003'], detectionRate: 55, trends12h: [0, 0, 1, 0, 1, 2, 1, 0, 1, 2, 3, 2] },
    { id: 'T1071', name: 'Application Layer Protocol', tactic: 'Command and Control', subtechniques: ['T1071.001'], detectionRate: 78, trends12h: [4, 3, 5, 4, 6, 5, 7, 6, 5, 8, 7, 6] },
    { id: 'T1083', name: 'File and Directory Discovery', tactic: 'Discovery', subtechniques: [], detectionRate: 95, trends12h: [12, 15, 10, 18, 14, 16, 12, 19, 15, 13, 17, 14] },
  ];

  private _correlateTechniques(alertIds: string[]): { relatedTechs: string[]; killChainGaps: string[]; riskMultiplier: number } {
    const ruleNames = alertIds.map(id => this._alerts.find(a => a.id === id)?.ruleName).filter(Boolean) as string[];
    const activeTechniques = new Set<string>();
    ruleNames.forEach(rn => {
      const mapping = this._mitreMap[rn];
      if (mapping) activeTechniques.add(mapping.id);
    });
    const related: string[] = [];
    const allTechs = this._mitreTechniqueDB;
    allTechs.forEach(tech => {
      if (activeTechniques.has(tech.id)) {
        related.push(tech.id, ...tech.subtechniques.filter(s => !activeTechniques.has(s)));
      }
    });
    const killChainPhases = ['Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement', 'Collection', 'Exfiltration', 'Command and Control', 'Impact'];
    const activeTactics = new Set<string>();
    allTechs.filter(t => activeTechniques.has(t.id)).forEach(t => activeTactics.add(t.tactic));
    const gaps = killChainPhases.filter(p => !activeTactics.has(p)).slice(0, 4);
    const multiplier = 1 + (activeTechniques.size * 0.15) + (gaps.length < 5 ? 0.3 : 0);
    return { relatedTechs: [...new Set(related)], killChainGaps: gaps, riskMultiplier: Math.min(3, multiplier) };
  }

  // Trend Analysis Engine
  private _initTrendData() {
    const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    this._trendData = hours.map((h, i) => ({
      hour: h,
      alerts: i >= 4 && i <= 9 ? Math.floor(Math.random() * 20) + 15 : Math.floor(Math.random() * 8) + 3,
      resolved: i >= 4 && i <= 9 ? Math.floor(Math.random() * 15) + 10 : Math.floor(Math.random() * 6) + 2,
      mttb: i >= 4 && i <= 9 ? Math.floor(Math.random() * 5) + 2 : Math.floor(Math.random() * 10) + 5,
    }));
    this._detectAnomalies();
  }

  private _detectAnomalies() {
    const values = this._trendData.map(d => d.alerts);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length) || 1;
    this._anomalyPoints = values.map((v, i) => Math.abs(v - mean) / std > 1.8 ? i : -1).filter(i => i >= 0);
  }

  private _linearRegression(data: number[]): { slope: number; intercept: number; trend: 'up' | 'down' | 'stable' } {
    const n = data.length || 1;
    const sumX = data.reduce((s, _, i) => s + i, 0);
    const sumY = data.reduce((s, v) => s + v, 0);
    const sumXY = data.reduce((s, v, i) => s + i * v, 0);
    const sumX2 = data.reduce((s, _, i) => s + i * i, 0);
    const denom = n * sumX2 - sumX * sumX || 1;
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    const trend = slope > 0.5 ? 'up' as const : slope < -0.5 ? 'down' as const : 'stable' as const;
    return { slope, intercept, trend };
  }

  // Threat Intelligence Data
  private _threatIntelFeed: { type: 'ip' | 'domain' | 'hash' | 'url'; value: string; confidence: number; threatActor: string; firstSeen: string; description: string; tags: string[] }[] = [
    { type: 'ip', value: '185.174.xxx.xxx', confidence: 92, threatActor: 'APT-29', firstSeen: '2026-04-20', description: 'C2 beacon communication detected', tags: ['c2', 'beacon', 'apt29'] },
    { type: 'domain', value: 'update-service[.]cloud', confidence: 88, threatActor: 'APT-29', firstSeen: '2026-04-19', description: 'Mimics legitimate update service', tags: ['phishing', 'dns', 'apt29'] },
    { type: 'hash', value: 'a3f2b8c1d4e5...', confidence: 95, threatActor: 'Cobalt Strike', firstSeen: '2026-04-18', description: 'Cobalt Strike beacon DLL', tags: ['malware', 'beacon', 'cobalt'] },
    { type: 'ip', value: '91.234.xxx.xxx', confidence: 76, threatActor: 'Unknown', firstSeen: '2026-04-22', description: 'Port scanning activity from this IP', tags: ['recon', 'scanner'] },
    { type: 'url', value: 'https://evil[.]com/login', confidence: 83, threatActor: 'FIN7', firstSeen: '2026-04-21', description: 'Credential harvesting landing page', tags: ['phishing', 'credential-theft'] },
    { type: 'hash', value: '7e2a1b3c5d8f...', confidence: 71, threatActor: 'Lazarus', firstSeen: '2026-04-17', description: 'Ransomware dropper variant', tags: ['ransomware', 'dropper'] },
  ];

  // Notification system
  private _initNotifications() {
    this._notifications = [
      { id: 'n1', message: 'CRITICAL: New ransomware precursor detected on ws-finance-03', time: '2 min ago', type: 'critical', read: false },
      { id: 'n2', message: 'SLA Warning: Case c2 is overdue by 30 minutes', time: '15 min ago', type: 'warning', read: false },
      { id: 'n3', message: 'Chen Li resolved alert a7 - USB device blocked', time: '30 min ago', type: 'info', read: false },
      { id: 'n4', message: 'Shift handoff report generated successfully', time: '1h ago', type: 'info', read: true },
      { id: 'n5', message: 'MITRE ATT&CK mapping updated: 3 new techniques', time: '2h ago', type: 'info', read: true },
    ];
  }

  private _markNotifRead(id: string) {
    this._notifications = this._notifications.map(n => n.id === id ? { ...n, read: true } : n);
  }

  private _markAllNotifsRead() {
    this._notifications = this._notifications.map(n => ({ ...n, read: true }));
  }

  private _mitreMap: Record<string, { id: string; tactic: string }> = {
    'T1059.001 - PowerShell': { id: 'T1059.001', tactic: 'Execution' },
    'BRUTE_FORCE_DETECTION': { id: 'T1110', tactic: 'Credential Access' },
    'MALWARE_ALERT': { id: 'T1203', tactic: 'Execution' },
    'DLP_POLICY_VIOLATION': { id: 'T1567', tactic: 'Exfiltration' },
    'PRIV_ESC_ALERT': { id: 'T1548', tactic: 'Privilege Escalation' },
    'DNS_EXFIL_PATTERN': { id: 'T1048', tactic: 'Exfiltration' },
    'USB_DEVICE_BLOCK': { id: 'T1091', tactic: 'Initial Access' },
    'RDP_BRUTE_FORCE': { id: 'T1110.001', tactic: 'Credential Access' },
  };

  private _playbookSteps = [
    { step: 1, name: 'Alert Detection', desc: 'Alert triggered by SIEM correlation rule', status: 'done' as const, techniques: ['T1059', 'T1110'] },
    { step: 2, name: 'Initial Triage', desc: 'Analyst reviews alert context, assigns severity', status: 'done' as const, techniques: ['T1071'] },
    { step: 3, name: 'Enrichment', desc: 'Gather IOC data, check threat intel feeds', status: 'done' as const, techniques: ['T1595'] },
    { step: 4, name: 'Investigation', desc: 'Deep dive into endpoint, network, and log evidence', status: 'active' as const, techniques: ['T1083', 'T1082'] },
    { step: 5, name: 'Containment', desc: 'Isolate affected systems, block IOCs', status: 'wait' as const, techniques: ['T1562'] },
    { step: 6, name: 'Eradication', desc: 'Remove artifacts, patch vulnerabilities', status: 'wait' as const, techniques: ['T1070'] },
    { step: 7, name: 'Recovery', desc: 'Restore systems, verify integrity', status: 'wait' as const, techniques: ['T1005'] },
    { step: 8, name: 'Lessons Learned', desc: 'Document findings, update runbooks', status: 'wait' as const, techniques: ['T1070'] },
  ];

  @state() private _taskQueue: { id: string; task: string; assignee: string; status: string; priority: string }[] = [
    { id: 'st-1', task: 'Investigate PowerShell execution on ws-finance-03', assignee: 'Chen Li', status: 'in-progress', priority: 'critical' },
    { id: 'st-2', task: 'Analyze malware sample from EDR alert', assignee: 'Wang Wei', status: 'in-progress', priority: 'critical' },
    { id: 'st-3', task: 'Review DNS tunneling alerts for false positives', assignee: 'Zhang San', status: 'pending', priority: 'medium' },
    { id: 'st-4', task: 'Update SIEM correlation rules for new threats', assignee: 'Li Si', status: 'pending', priority: 'low' },
    { id: 'st-5', task: 'Block malicious IPs at firewall', assignee: 'Chen Li', status: 'completed', priority: 'high' },
  ];

  @state() private _approvalQueue: { id: string; action: string; requester: string; status: string }[] = [
    { id: 'sa-1', action: 'Escalate ransomware case to incident commander', requester: 'Wang Wei', status: 'pending' },
    { id: 'sa-2', action: 'Block IP range 203.0.113.0/24 at perimeter', requester: 'Chen Li', status: 'pending' },
    { id: 'sa-3', action: 'Isolate ws-finance-03 from network', requester: 'EDR Auto', status: 'approved' },
  ];

  private _approveAction(id: string) { this._approvalQueue = this._approvalQueue.map(a => a.id === id ? { ...a, status: 'approved' } : a); }
  private _rejectAction(id: string) { this._approvalQueue = this._approvalQueue.map(a => a.id === id ? { ...a, status: 'rejected' } : a); }
  private _completeTask(id: string) { this._taskQueue = this._taskQueue.map(t => t.id === id ? { ...t, status: 'completed' } : t); }

  private _exportJSON() {
    const data = { alerts: this._alerts, cases: this._cases, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'soc-workflow.json'; a.click();
  }

  private _sparklineSVG(data: number[], color: string): string {
    const w = 60, h = 20, pad = 2;
    const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
    const pts = data.map((v, i) => `${pad + (i / (data.length - 1)) * (w - pad * 2)},${h - pad - ((v - min) / range) * (h - pad * 2)}`).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  private _gaugeSVG(value: number, label: string): string {
    const r = 30, cx = 36, cy = 36, circ = 2 * Math.PI * r;
    const offset = circ * (1 - value / 100);
    const color = value >= 90 ? '#22c55e' : value >= 70 ? '#eab308' : '#ef4444';
    return `<svg viewBox="0 0 72 72" width="72" height="72"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1f2937" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="5" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="${color}" font-size="13" font-weight="700">${value}%</text><text x="${cx}" y="${cy + 16}" text-anchor="middle" fill="#6b7280" font-size="7">${label}</text></svg>`;
  }

  private _alerts: Alert[] = [
    { id: 'a1', title: 'Suspicious PowerShell Execution', severity: 'critical', source: 'EDR', time: '2 min ago', assignee: 'Chen Li', status: 'investigating', ruleName: 'T1059.001 - PowerShell' },
    { id: 'a2', title: 'Multiple Failed Logins', severity: 'high', source: 'IAM', time: '5 min ago', assignee: null, status: 'new', ruleName: 'BRUTE_FORCE_DETECTION' },
    { id: 'a3', title: 'Malware Detected', severity: 'critical', source: 'EDR', time: '8 min ago', assignee: 'Wang Wei', status: 'escalated', ruleName: 'MALWARE_ALERT' },
    { id: 'a4', title: 'Unusual Data Access Pattern', severity: 'medium', source: 'DLP', time: '15 min ago', assignee: null, status: 'triage', ruleName: 'DLP_POLICY_VIOLATION' },
    { id: 'a5', title: 'Privilege Escalation Detected', severity: 'high', source: 'AD', time: '20 min ago', assignee: 'Zhang San', status: 'investigating', ruleName: 'PRIV_ESC_ALERT' },
    { id: 'a6', title: 'DNS Tunneling Suspected', severity: 'medium', source: 'Network', time: '30 min ago', assignee: null, status: 'new', ruleName: 'DNS_EXFIL_PATTERN' },
    { id: 'a7', title: 'Unauthorized USB Device', severity: 'low', source: 'Endpoint', time: '45 min ago', assignee: 'Li Si', status: 'resolved', ruleName: 'USB_DEVICE_BLOCK' },
    { id: 'a8', title: 'RDP Brute Force', severity: 'high', source: 'Firewall', time: '1h ago', assignee: null, status: 'triage', ruleName: 'RDP_BRUTE_FORCE' },
  ];

  private _cases: Case[] = [
    { id: 'c1', title: 'Suspected APT Activity - Finance Dept', alerts: 8, severity: 'critical', status: 'investigating', assignee: 'Chen Li', created: '2h ago', sla: '1h remaining' },
    { id: 'c2', title: 'Ransomware Precursor Indicators', alerts: 5, severity: 'critical', status: 'escalated', assignee: 'Wang Wei', created: '4h ago', sla: 'OVERDUE' },
    { id: 'c3', title: 'Insider Threat - Data Exfil', alerts: 3, severity: 'high', status: 'investigating', assignee: 'Zhang San', created: '6h ago', sla: '3h remaining' },
    { id: 'c4', title: 'Credential Compromise', alerts: 12, severity: 'high', status: 'triage', assignee: 'Unassigned', created: '8h ago', sla: '5h remaining' },
  ];

  private _analysts: Analyst[] = [
    { name: 'Chen Li', activeCases: 3, resolvedToday: 12, avgResolution: '1.2h', load: 75 },
    { name: 'Wang Wei', activeCases: 4, resolvedToday: 8, avgResolution: '1.8h', load: 90 },
    { name: 'Zhang San', activeCases: 2, resolvedToday: 15, avgResolution: '0.9h', load: 55 },
    { name: 'Li Si', activeCases: 1, resolvedToday: 20, avgResolution: '0.7h', load: 35 },
  ];

  private _initAuditLog() {
    this._auditLog = [
      { timestamp: '2026-04-22T10:35:00Z', action: 'ALERT_ESCALATE', user: 'Chen Li', detail: 'Escalated PowerShell alert to L3 specialist' },
      { timestamp: '2026-04-22T10:28:00Z', action: 'ALERT_ASSIGN', user: 'Auto', detail: 'Auto-assigned brute force alert to Zhang San based on workload' },
      { timestamp: '2026-04-22T10:15:00Z', action: 'CASE_RESOLVE', user: 'Wang Wei', detail: 'Resolved malware cluster case - 15 alerts closed' },
      { timestamp: '2026-04-22T09:45:00Z', action: 'CASE_OPEN', user: 'Zhang San', detail: 'Opened investigation case for insider threat - data exfil' },
      { timestamp: '2026-04-22T09:30:00Z', action: 'AUTO_RESOLVE', user: 'System', detail: 'Auto-resolved 23 low-severity alerts (known false positive patterns)' },
      { timestamp: '2026-04-22T09:00:00Z', action: 'IOC_BLOCK', user: 'Chen Li', detail: 'Blocked 12 IPs and 3 domains at perimeter firewall' },
      { timestamp: '2026-04-22T08:30:00Z', action: 'SHIFT_HANDOFF', user: 'Night Team', detail: 'Shift handoff: 3 active cases, 5 pending alerts' },
    ];
  }

  private _initSlaItems() {
    const now = Date.now();
    this._slaItems = [
      { id: 'sla-1', case: 'c1', assignee: 'Chen Li', deadline: new Date(now + 3600000).toISOString(), elapsed: 7200000, total: 10800000, priority: 'critical' },
      { id: 'sla-2', case: 'c2', assignee: 'Wang Wei', deadline: new Date(now - 1800000).toISOString(), elapsed: 14400000, total: 14400000, priority: 'critical' },
      { id: 'sla-3', case: 'c3', assignee: 'Zhang San', deadline: new Date(now + 10800000).toISOString(), elapsed: 21600000, total: 36000000, priority: 'high' },
      { id: 'sla-4', case: 'c4', assignee: 'Unassigned', deadline: new Date(now + 18000000).toISOString(), elapsed: 28800000, total: 43200000, priority: 'high' },
    ];
  }

  private _addAudit(action: string, user: string, detail: string) {
    this._auditLog = [{ timestamp: new Date().toISOString(), action, user, detail }, ...this._auditLog.slice(0, 49)];
  }

  private _runTriagePipeline() {
    if (this._execPhase === 'running') return;
    this._execSteps = [
      { name: 'Parse Alert', desc: 'Extract IOC indicators and context from alert payload', status: 'pending', duration: 0 },
      { name: 'Enrich Data', desc: 'Query threat intel, asset DB, and user directory', status: 'pending', duration: 0 },
      { name: 'Score Risk', desc: 'Calculate composite risk score using ML model', status: 'pending', duration: 0 },
      { name: 'Correlate', desc: 'Match against active cases and recent alert clusters', status: 'pending', duration: 0 },
      { name: 'Assign', desc: 'Determine optimal analyst based on skills and workload', status: 'pending', duration: 0 },
      { name: 'Dispatch', desc: 'Send notification and create investigation task', status: 'pending', duration: 0 },
    ];
    this._execResults = [];
    this._execPhase = 'running';
    this._execProgress = 0;
    this._execTriageStep(0);
  }

  private _execTriageStep(index: number) {
    if (index >= this._execSteps.length) {
      this._execPhase = 'complete';
      const dur = this._execSteps.reduce((s, st) => s + st.duration, 0);
      this._execHistory = [{ id: 'et-' + Date.now(), name: 'Alert Triage', completedAt: new Date().toISOString(), duration: dur }, ...this._execHistory.slice(0, 19)];
      this._addAudit('TRIAGE_COMPLETE', 'System', `Auto-triage completed in ${dur}ms`);
      return;
    }
    this._execSteps = this._execSteps.map((s, i) => i === index ? { ...s, status: 'running' as const } : i < index ? { ...s, status: 'done' as const } : s);
    this._execProgress = Math.round((index / this._execSteps.length) * 100);
    const dur = 300 + Math.random() * 500;
    setTimeout(() => {
      const outputs = [
        'Parsed 8 IOC indicators: 3 IPs, 2 domains, 2 file hashes, 1 registry key.',
        'Threat intel: 3 IOC matches (2 APT-29, 1 Cobalt Strike). Asset: ws-finance-03 (Finance subnet).',
        'Risk score: 87/100. Factors: known threat actor (35), critical asset (25), active exploitation (27).',
        'Correlated with case c1 (APT Activity - Finance). 5 related alerts in last 2 hours.',
        'Assigned to Chen Li (L3 specialist, 75% load, 3 active cases, forensics certified).',
        'Notification sent. Investigation task created. Playbook: APT Investigation v2.3 activated.',
      ];
      this._execSteps = this._execSteps.map((s, i) => i === index ? { ...s, status: 'done' as const, duration: Math.round(dur) } : s);
      this._execResults = [...this._execResults, { step: this._execSteps[index].name, output: outputs[index], timestamp: new Date().toISOString() }];
      this._execTriageStep(index + 1);
    }, dur);
  }

  private _socTopologySVG(): string {
    const nodes = [
      { id: 's1', label: 'SIEM', x: 140, y: 30, color: '#06b6d4' },
      { id: 's2', label: 'EDR', x: 60, y: 80, color: '#ef4444' },
      { id: 's3', label: 'NDR', x: 220, y: 80, color: '#f97316' },
      { id: 's4', label: 'Firewall', x: 60, y: 140, color: '#22c55e' },
      { id: 's5', label: 'IAM', x: 220, y: 140, color: '#a855f7' },
      { id: 's6', label: 'DLP', x: 140, y: 140, color: '#eab308' },
      { id: 's7', label: 'SOAR', x: 140, y: 100, color: '#3b82f6' },
      { id: 's8', label: 'TIP', x: 300, y: 50, color: '#14b8a6' },
      { id: 's9', label: 'Case Mgmt', x: 300, y: 110, color: '#ec4899' },
    ];
    const edges = [
      { from: 's2', to: 's1' }, { from: 's3', to: 's1' }, { from: 's4', to: 's1' },
      { from: 's5', to: 's1' }, { from: 's6', to: 's1' }, { from: 's1', to: 's7' },
      { from: 's7', to: 's8' }, { from: 's7', to: 's9' }, { from: 's8', to: 's7' },
    ];
    const nm = Object.fromEntries(nodes.map(n => [n.id, n]));
    let svg = '';
    edges.forEach(e => {
      const f = nm[e.from], t = nm[e.to];
      svg += `<line x1="${f.x}" y1="${f.y}" x2="${t.x}" y2="${t.y}" stroke="#374151" stroke-width="1.5"/>`;
    });
    nodes.forEach(n => {
      svg += `<circle cx="${n.x}" cy="${n.y}" r="18" fill="${n.color}" fill-opacity="0.2" stroke="${n.color}" stroke-width="2"/>`;
      svg += `<text x="${n.x}" y="${n.y + 4}" text-anchor="middle" fill="#e2e8f0" font-size="7" font-weight="600">${n.label}</text>`;
    });
    return svg;
  }

  private _slaOverviewSVG(): string {
    const W = 260, H = 100;
    const items = this._slaItems;
    let rects = '';
    items.forEach((item, i) => {
      const y = i * 22;
      const pct = Math.min(100, (item.elapsed / item.total) * 100);
      const color = pct > 100 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#22c55e';
      rects += `<rect x="80" y="${y}" width="${Math.min(pct, 100) * 1.7}" height="16" rx="3" fill="${color}" fill-opacity="0.3"/>`;
      rects += `<text x="75" y="${y + 11}" text-anchor="end" fill="#94a3b8" font-size="7">${item.assignee.split(' ')[0]}</text>`;
      rects += `<text x="${85 + Math.min(pct, 100) * 1.7}" y="${y + 11}" fill="${color}" font-size="7" font-weight="600">${pct > 100 ? 'OVERDUE' : Math.round(pct) + '%'}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${rects}</svg>`;
  }

  private _alertVolumeSVG(): string {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const data = hours.map(h => Math.floor(Math.random() * 30) + (h >= 8 && h <= 18 ? 15 : 3));
    const W = 280, H = 50;
    const max = Math.max(...data);
    const barW = W / data.length - 0.5;
    let rects = '';
    data.forEach((v, i) => {
      const h = (v / max) * (H - 6);
      const x = i * (barW + 0.5);
      const color = v > 35 ? '#ef4444' : v > 20 ? '#f59e0b' : '#22c55e';
      rects += `<rect x="${x}" y="${H - h}" width="${barW}" height="${h}" rx="1" fill="${color}" fill-opacity="0.6"/>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${rects}</svg>`;
  }

  private _mitreHeatmapSVG(): string {
    const tactics = ['Initial Access', 'Execution', 'Persistence', 'Priv Esc', 'Def Evasion', 'Credential Access', 'Discovery', 'Lateral Move', 'Collection', 'Exfiltration', 'Command Ctrl', 'Impact'];
    const data = tactics.map(() => Math.floor(Math.random() * 10));
    const W = 280, H = 120, cellW = 22, cellH = 8, gap = 1;
    let rects = '';
    tactics.forEach((t, i) => {
      const y = i * (cellH + gap);
      const x = 60;
      rects += `<text x="${x - 4}" y="${y + 7}" text-anchor="end" fill="#94a3b8" font-size="6">${t}</text>`;
      for (let j = 0; j < 10; j++) {
        const active = j < data[i];
        const color = active ? (j >= 7 ? '#ef4444' : j >= 4 ? '#f59e0b' : '#22c55e') : '#1f2937';
        rects += `<rect x="${x + j * (cellW + gap)}" y="${y}" width="${cellW}" height="${cellH}" rx="1" fill="${color}" fill-opacity="${active ? '0.6' : '0.3'}"/>`;
      }
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${rects}</svg>`;
  }

  private _caseTimelineSVG(): string {
    const cases = this._cases.map((c, i) => ({
      name: c.id.toUpperCase(), severity: c.severity,
      start: i * 40, duration: 60 + Math.floor(Math.random() * 80),
      status: c.status,
    }));
    const W = 280, H = 60;
    let rects = '';
    cases.forEach((c, i) => {
      const y = i * 14;
      const color = this._getSeverityColor(c.severity);
      const fill = c.status === 'escalated' ? '0.8' : c.status === 'investigating' ? '0.6' : '0.3';
      rects += `<text x="2" y="${y + 9}" fill="#94a3b8" font-size="7">${c.name}</text>`;
      rects += `<rect x="40" y="${y}" width="${c.duration}" height="10" rx="2" fill="${color}" fill-opacity="${fill}"/>`;
      rects += `<text x="${45 + c.duration}" y="${y + 8}" fill="#6b7280" font-size="6">${c.status}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${rects}</svg>`;
  }

  // Sankey diagram for alert-to-case flow
  private _sankeyFlowSVG(): string {
    const W = 280, H = 180;
    const sources = [
      { label: 'EDR', value: 12, color: '#ef4444' },
      { label: 'SIEM', value: 18, color: '#3b82f6' },
      { label: 'Network', value: 8, color: '#f97316' },
      { label: 'IAM', value: 6, color: '#a855f7' },
      { label: 'DLP', value: 4, color: '#eab308' },
    ];
    const sinks = [
      { label: 'Case APT', value: 14, color: '#ef4444' },
      { label: 'Case Ransom', value: 10, color: '#f97316' },
      { label: 'Case Insider', value: 8, color: '#eab308' },
      { label: 'Resolved', value: 16, color: '#22c55e' },
    ];
    const totalSrc = sources.reduce((s, v) => s + v.value, 0) || 1;
    let svg = '';
    // Source nodes
    sources.forEach((src, i) => {
      const h = (src.value / totalSrc) * (H - 20);
      const y = 10 + sources.slice(0, i).reduce((s, v) => s + (v.value / totalSrc) * (H - 20), 0);
      svg += `<rect x="5" y="${y}" width="40" height="${h}" rx="3" fill="${src.color}" fill-opacity="0.7"/>`;
      svg += `<text x="25" y="${y + h / 2 + 3}" text-anchor="middle" fill="#fff" font-size="7" font-weight="600">${src.label}</text>`;
      svg += `<text x="50" y="${y + h / 2 + 3}" fill="#94a3b8" font-size="7">${src.value}</text>`;
    });
    // Sink nodes
    sinks.forEach((sink, i) => {
      const h = (sink.value / totalSrc) * (H - 20);
      const y = 10 + sinks.slice(0, i).reduce((s, v) => s + (v.value / totalSrc) * (H - 20), 0);
      svg += `<rect x="${W - 45}" y="${y}" width="40" height="${h}" rx="3" fill="${sink.color}" fill-opacity="0.7"/>`;
      svg += `<text x="${W - 25}" y="${y + h / 2 + 3}" text-anchor="middle" fill="#fff" font-size="7" font-weight="600">${sink.label}</text>`;
    });
    // Flow paths (simplified curved bands)
    const flowData = [
      { src: 0, snk: 0, val: 6 }, { src: 0, snk: 1, val: 4 }, { src: 0, snk: 3, val: 2 },
      { src: 1, snk: 0, val: 8 }, { src: 1, snk: 2, val: 4 }, { src: 1, snk: 3, val: 6 },
      { src: 2, snk: 0, val: 0 }, { src: 2, snk: 1, val: 4 }, { src: 2, snk: 2, val: 2 }, { src: 2, snk: 3, val: 2 },
      { src: 3, snk: 2, val: 2 }, { src: 3, snk: 3, val: 4 },
      { src: 4, snk: 2, val: 0 }, { src: 4, snk: 3, val: 4 },
    ];
    flowData.forEach(f => {
      if (f.val === 0) return;
      const opacity = Math.min(0.4, f.val / 20);
      svg += `<path d="M55,${H / 2} C120,${H / 2} 160,${H / 2} ${W - 50},${H / 2}" stroke="#94a3b8" stroke-opacity="${opacity}" stroke-width="${f.val * 0.8}" fill="none"/>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${svg}</svg>`;
  }

  // Multi-series time-series chart
  private _trendChartSVG(): string {
    const W = 280, H = 100, pad = 20;
    const data = this._trendData;
    if (data.length === 0) return '';
    const maxAlerts = Math.max(...data.map(d => d.alerts), 1);
    const maxResolved = Math.max(...data.map(d => d.resolved), 1);
    const maxVal = Math.max(maxAlerts, maxResolved);
    const stepX = (W - pad * 2) / (data.length - 1);
    let svg = '';
    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = pad + (i / 4) * (H - pad * 2);
      svg += `<line x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}" stroke="#1f2937" stroke-width="0.5"/>`;
      svg += `<text x="${pad - 4}" y="${y + 3}" text-anchor="end" fill="#6b7280" font-size="6">${Math.round(maxVal * (1 - i / 4))}</text>`;
    }
    // Alert line
    const alertPts = data.map((d, i) => `${pad + i * stepX},${pad + (1 - d.alerts / maxVal) * (H - pad * 2)}`).join(' ');
    svg += `<polyline points="${alertPts}" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    // Resolved line
    const resolvedPts = data.map((d, i) => `${pad + i * stepX},${pad + (1 - d.resolved / maxVal) * (H - pad * 2)}`).join(' ');
    svg += `<polyline points="${resolvedPts}" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 2"/>`;
    // Anomaly markers
    this._anomalyPoints.forEach(idx => {
      const x = pad + idx * stepX;
      const y = pad + (1 - data[idx].alerts / maxVal) * (H - pad * 2);
      svg += `<circle cx="${x}" cy="${y}" r="4" fill="#ef4444" opacity="0.8"/>`;
      svg += `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="#ef4444" stroke-width="1" opacity="0.4"/>`;
    });
    // X axis labels
    data.forEach((d, i) => {
      if (i % 2 === 0) {
        const x = pad + i * stepX;
        svg += `<text x="${x}" y="${H - 4}" text-anchor="middle" fill="#6b7280" font-size="6">${d.hour}</text>`;
      }
    });
    // Legend
    svg += `<circle cx="${W - 100}" cy="8" r="3" fill="#ef4444"/><text x="${W - 94}" y="11" fill="#94a3b8" font-size="7">Alerts</text>`;
    svg += `<circle cx="${W - 55}" cy="8" r="3" fill="#22c55e"/><text x="${W - 49}" y="11" fill="#94a3b8" font-size="7">Resolved</text>`;
    svg += `<circle cx="${W - 10}" cy="8" r="3" fill="#ef4444" opacity="0.8"/><text x="${W - 4}" y="11" fill="#94a3b8" font-size="6">!</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${svg}</svg>`;
  }

  // Team workload distribution chart
  private _teamWorkloadSVG(): string {
    const W = 280, H = 60;
    const analysts = this._analysts;
    const total = analysts.reduce((s, a) => s + a.activeCases, 0) || 1;
    let svg = '';
    const colors = ['#ef4444', '#f97316', '#22c55e', '#3b82f6'];
    let xPos = 0;
    analysts.forEach((a, i) => {
      const w = (a.activeCases / total) * (W - 80);
      svg += `<rect x="${xPos + 70}" y="8" width="${w}" height="20" rx="2" fill="${colors[i]}" fill-opacity="0.7"/>`;
      svg += `<text x="${xPos + 70 + w / 2}" y="22" text-anchor="middle" fill="#fff" font-size="8" font-weight="600">${a.activeCases}</text>`;
      xPos += w;
    });
    analysts.forEach((a, i) => {
      const y = 38;
      svg += `<circle cx="${75 + i * 52}" cy="${y}" r="4" fill="${colors[i]}"/>`;
      svg += `<text x="${82 + i * 52}" y="${y + 3}" fill="#94a3b8" font-size="7">${a.name.split(' ')[0]}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${svg}</svg>`;
  }

  // Radar chart for MITRE tactic coverage
  private _mitreRadarSVG(): string {
    const W = 200, H = 200, cx = W / 2, cy = H / 2, R = 70;
    const tactics = ['Initial Access', 'Execution', 'Persistence', 'Priv Esc', 'Defense Evasion', 'Credential Access', 'Discovery', 'Exfiltration'];
    const n = tactics.length;
    const scores = tactics.map(() => Math.floor(Math.random() * 60) + 40);
    let svg = '';
    // Grid rings
    for (let ring = 1; ring <= 4; ring++) {
      const r = (ring / 4) * R;
      const pts = tactics.map((_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(' ');
      svg += `<polygon points="${pts}" fill="none" stroke="#1f2937" stroke-width="0.5"/>`;
    }
    // Axis lines and labels
    tactics.forEach((t, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const ex = cx + R * Math.cos(angle);
      const ey = cy + R * Math.sin(angle);
      svg += `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="#1f2937" stroke-width="0.5"/>`;
      const lx = cx + (R + 14) * Math.cos(angle);
      const ly = cy + (R + 14) * Math.sin(angle);
      svg += `<text x="${lx}" y="${ly + 3}" text-anchor="middle" fill="#6b7280" font-size="5.5">${t}</text>`;
    });
    // Data polygon
    const dataPts = scores.map((s, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const r = (s / 100) * R;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
    svg += `<polygon points="${dataPts}" fill="#f59e0b" fill-opacity="0.2" stroke="#f59e0b" stroke-width="1.5"/>`;
    // Data points
    scores.forEach((s, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const r = (s / 100) * R;
      svg += `<circle cx="${cx + r * Math.cos(angle)}" cy="${cy + r * Math.sin(angle)}" r="2.5" fill="#f59e0b"/>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="200" height="200">${svg}</svg>`;
  }

  // Auto-generated insights
  private _generateInsights(): { title: string; body: string; severity: 'critical' | 'warning' | 'info' }[] {
    const regression = this._linearRegression(this._trendData.map(d => d.alerts));
    const insights: { title: string; body: string; severity: 'critical' | 'warning' | 'info' }[] = [];
    if (regression.trend === 'up') insights.push({ title: 'Alert Volume Trending Up', body: `Alert volume is increasing with a slope of ${regression.slope.toFixed(2)} alerts/hour. Consider increasing analyst staffing during peak hours.`, severity: 'warning' });
    if (this._anomalyPoints.length > 0) insights.push({ title: 'Anomaly Detected', body: `Statistical anomaly detected at ${this._anomalyPoints.map(i => this._trendData[i]?.hour).join(', ')}. Alert volume exceeded 1.8 standard deviations from the mean.`, severity: 'critical' });
    const unassigned = this._alerts.filter(a => !a.assignee && a.severity !== 'low').length;
    if (unassigned > 0) insights.push({ title: 'Unassigned Critical Alerts', body: `${unassigned} high/critical alerts remain unassigned. Auto-assignment is recommended to meet SLA targets.`, severity: 'warning' });
    const overloaded = this._analysts.filter(a => a.load > 80).length;
    if (overloaded > 0) insights.push({ title: 'Team Capacity Alert', body: `${overloaded} analysts are above 80% workload capacity. Redistribution may improve response times.`, severity: 'info' });
    const overdueCases = this._slaItems.filter(s => s.elapsed > s.total).length;
    if (overdueCases > 0) insights.push({ title: 'SLA Breach Warning', body: `${overdueCases} case(s) have exceeded their SLA deadlines. Immediate escalation recommended.`, severity: 'critical' });
    insights.push({ title: 'MITRE Coverage', body: `Current detection covers 8 of 14 MITRE ATT&CK tactics. Priority gaps: Lateral Movement, Collection, Impact.`, severity: 'info' });
    return insights;
  }

  connectedCallback() { super.connectedCallback(); this._initAuditLog(); this._initSlaItems(); this._initTrendData(); this._initNotifications(); }

  private _getSeverityColor(sev: string): string {
    const m: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    return m[sev] ?? '#94a3b8';
  }

  private _getLoadColor(load: number): string {
    if (load > 80) return '#ef4444';
    if (load > 60) return '#f97316';
    return '#22c55e';
  }


  private _renderEscalationPath(): string {
    const levels = [
      { level: 'L1 Auto', criteria: 'Known FP pattern', sla: '0 min', action: 'Auto-close' },
      { level: 'L1 Triage', criteria: 'New alert, low confidence', sla: '15 min', action: 'Initial assessment' },
      { level: 'L2 Investigate', criteria: 'Confirmed suspicious, high sev', sla: '30 min', action: 'Deep investigation' },
      { level: 'L3 Specialist', criteria: 'Malware/Forensics needed', sla: '60 min', action: 'Specialist review' },
      { level: 'L4 Incident', criteria: 'Active intrusion confirmed', sla: '15 min', action: 'Incident commander' },
      { level: 'L5 Executive', criteria: 'Critical impact/data breach', sla: '5 min', action: 'CISO notification' },
    ];
    return levels.map((l, i) => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937"><div style="width:24px;height:24px;border-radius:50%;background:#3b82f620;color:#3b82f6;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700">L${i+1}</div><div style="flex:1"><div style="font-size:10px;color:#e2e8f0">${l.level} - ${l.action}</div><div style="font-size:9px;color:#6b7280">${l.criteria}</div></div><div style="font-size:9px;color:#eab308">${l.sla}</div></div>`).join('');
  }

  private _renderRunbookQuickAccess(): string {
    const runbooks = [
      { name: 'Ransomware Response', category: 'Malware', time: '2-24h', steps: 6 },
      { name: 'Phishing Auto-Response', category: 'Social Engineering', time: '30min', steps: 5 },
      { name: 'Data Breach Notification', category: 'Compliance', time: '72h', steps: 4 },
      { name: 'DDoS Mitigation', category: 'Network', time: '1-2h', steps: 4 },
      { name: 'Insider Threat Investigation', category: 'HR/Legal', time: '1-2 weeks', steps: 8 },
    ];
    return runbooks.map(r => `<div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0f172a;border-radius:6px;margin-bottom:4px;cursor:pointer"><span style="font-size:11px;font-weight:600;color:#e2e8f0;flex:1">${r.name}</span><span class="tag">${r.category}</span><span style="font-size:9px;color:#6b7280">${r.time}</span></div>`).join('');
  }

  private _renderRecentActivity(): string {
    const activities = [
      { time: '10:32', analyst: 'Martinez', action: 'Escalated alert to L3 - C2 beacon confirmed', type: 'escalation' },
      { time: '10:28', analyst: 'Chen', action: 'Assigned brute force alert for triage', type: 'assignment' },
      { time: '10:15', analyst: 'Patel', action: 'Resolved phishing cluster - 15 users affected', type: 'resolution' },
      { time: '09:45', analyst: 'Kim', action: 'Opened investigation case for svc-backup-02', type: 'investigation' },
      { time: '09:30', analyst: 'Thompson', action: 'Auto-resolved 23 low-severity alerts', type: 'auto' },
      { time: '09:00', analyst: 'Chen', action: 'Detected privilege escalation on DC-01', type: 'detection' },
      { time: '08:30', analyst: 'Patel', action: 'Blocked phishing URLs at web proxy', type: 'containment' },
      { time: '08:00', analyst: 'Martinez', action: 'Shift handoff completed with night team', type: 'handoff' },
    ];
    const typeColors: Record<string, string> = { escalation: '#ef4444', assignment: '#3b82f6', resolution: '#22c55e', investigation: '#eab308', auto: '#a855f7', detection: '#f97316', containment: '#3b82f6', handoff: '#6b7280' };
    return activities.map(a => `<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid #1f2937;font-size:10px"><span style="color:#6b7280;min-width:40px">${a.time}</span><span style="color:${typeColors[a.type] || '#6b7280'};min-width:60px;font-weight:600">${a.analyst}</span><span style="color:#e2e8f0;flex:1">${a.action}</span></div>`).join('');
  }

  private _renderAlertsTab() {
    const newCount = this._alerts.filter(a => a.status === 'new').length;
    const criticalCount = this._alerts.filter(a => a.severity === 'critical').length;
    const sevDist = { critical: this._alerts.filter(a => a.severity === 'critical').length, high: this._alerts.filter(a => a.severity === 'high').length, medium: this._alerts.filter(a => a.severity === 'medium').length, low: this._alerts.filter(a => a.severity === 'low').length };
    const total = this._alerts.length || 1;

    return html`
      <div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <span style="font-size:12px;background:#450a0a;color:#fca5a5;padding:4px 12px;border-radius:12px;font-weight:600">${criticalCount} Critical</span>
        <span style="font-size:12px;background:#422006;color:#fde047;padding:4px 12px;border-radius:12px;font-weight:600">${newCount} New</span>
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;margin-bottom:6px">
          <div style="width:${sevDist.critical/total*100}%;background:#ef4444"></div>
          <div style="width:${sevDist.high/total*100}%;background:#f97316"></div>
          <div style="width:${sevDist.medium/total*100}%;background:#eab308"></div>
          <div style="width:${sevDist.low/total*100}%;background:#22c55e"></div>
        </div>
        <div style="display:flex;gap:12px;font-size:9px;color:#6b7280">
          <span style="color:#ef4444">Critical: ${sevDist.critical}</span>
          <span style="color:#f97316">High: ${sevDist.high}</span>
          <span style="color:#eab308">Medium: ${sevDist.medium}</span>
          <span style="color:#22c55e">Low: ${sevDist.low}</span>
        </div>
      </div>
      <div style="max-height:400px;overflow-y:auto">
        ${this._alerts.map(a => html`
          <div class="alert-row ${a.severity}" @click=${() => { this._selectedAlert = a.id; this.requestUpdate(); }}>
            <div class="alert-header">
              <span class="alert-title">${a.title}</span>
              <span class="badge b-${a.status}">${a.status}</span>
            </div>
            <div class="alert-meta">
              <span>📡 ${a.source}</span>
              <span>⏱ ${a.time}</span>
              <span>📋 ${a.ruleName}</span>
              <span>👤 ${a.assignee ?? 'Unassigned'}</span>
            </div>
          </div>
        `)}
      </div>
      ${this._selectedAlert ? html`
        <div class="handoff-box">
          <div style="font-weight:600;margin-bottom:8px">Alert Actions: ${this._selectedAlert}</div>
          ${(() => {
            const alert = this._alerts.find(a => a.id === this._selectedAlert);
            if (!alert) return nothing;
            const risk = this._calculateRiskScore(alert);
            const riskLevel = this._getRiskLevel(risk.overall);
            return html`
              <div class="risk-card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                  <span style="font-size:12px;font-weight:700">Risk Assessment</span>
                  <span style="font-size:14px;font-weight:800;color:${riskLevel.color}">${risk.overall}/100 (${riskLevel.label})</span>
                </div>
                ${risk.factors.map(f => html`
                  <div class="risk-factor-row">
                    <span class="risk-factor-label">${f.name} (${f.weight}%)</span>
                    <div class="risk-factor-bar"><div class="risk-factor-fill" style="width:${f.score}%;background:${f.color}"></div></div>
                    <span class="risk-factor-value" style="color:${f.color}">${f.score}</span>
                  </div>
                `)}
              </div>
            `;
          })()}
          <div style="display:flex;gap:6px;margin-bottom:8px">
            <button class="runbook-btn" @click=${() => alert('Assigning...')}>Assign</button>
            <button class="runbook-btn" @click=${() => alert('Escalating...')}>Escalate</button>
            <button class="runbook-btn" @click=${() => alert('Running playbook...')}>Run Playbook</button>
            <button class="runbook-btn" @click=${() => alert('Resolving...')}>Resolve</button>
          </div>
          <textarea placeholder="Add notes... @mention an analyst to notify them..."></textarea>
          <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
            ${this._analysts.map(a => html`<span class="mention-tag" style="cursor:pointer" @click=${() => { this._addAudit('MENTION', 'You', `Mentioned ${a.name} in alert ${this._selectedAlert}`); }}>@${a.name.split(' ')[0]}</span>`)}
          </div>
        </div>
      ` : nothing}
    `;
  }

  private _renderCasesTab() {
    return html`
      <div style="max-height:400px;overflow-y:auto">
        ${this._cases.map(c => html`
          <div class="case-card">
            <div style="flex:1">
              <div style="font-weight:600;font-size:13px">${c.title}</div>
              <div style="font-size:10px;color:#6b7280;margin-top:4px">${c.alerts} alerts | ${c.sla}</div>
            </div>
            <div style="text-align:right">
              <span class="badge b-${c.status === 'investigating' ? 'investigating' : c.status === 'escalated' ? 'escalated' : 'triage'}">${c.status}</span>
              <div style="font-size:10px;color:#6b7280;margin-top:4px">${c.assignee}</div>
            </div>
          </div>
        `)}
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-top:12px">
        <div style="font-size:12px;font-weight:600;margin-bottom:10px;color:#94a3b8;text-transform:uppercase">Runbook Quick Access</div>
        ${[
          { name: 'Ransomware Response', category: 'Malware', time: '2-24h', steps: 6 },
          { name: 'Phishing Auto-Response', category: 'Social Engineering', time: '30min', steps: 5 },
          { name: 'Data Breach Notification', category: 'Compliance', time: '72h', steps: 4 },
          { name: 'DDoS Mitigation', category: 'Network', time: '1-2h', steps: 4 },
          { name: 'Insider Threat Investigation', category: 'HR/Legal', time: '1-2 weeks', steps: 8 },
        ].map(r => html`<div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0f172a;border-radius:6px;margin-bottom:4px;cursor:pointer"><span style="font-size:11px;font-weight:600;color:#e2e8f0;flex:1">${r.name}</span><span class="tag">${r.category}</span><span style="font-size:9px;color:#6b7280">${r.time}</span><span style="font-size:9px;color:#6b7280">${r.steps} steps</span></div>`)}
      </div>
    `;
  }

  private _renderWorkloadTab() {
    const trendData = [8, 12, 10, 15, 11, 9, 14, 13, 16, 12, 10, 8];
    const mttrData = [3.2, 2.8, 3.5, 2.1, 2.5, 1.8, 2.3, 1.9, 2.0, 1.7, 2.1, 1.5];
    return html`
      <div class="section" style="margin-bottom:12px">
        <div class="stitle">Team Workload Distribution</div>
        ${this._teamWorkloadSVG()}
      </div>
      <div class="team-grid" style="margin-bottom:12px">
        ${this._analysts.map(a => html`
          <div class="team-member-card">
            <div class="team-member-avatar" style="background:${this._getLoadColor(a.load)}30;color:${this._getLoadColor(a.load)}">${a.name.split(' ').map(n => n[0]).join('')}</div>
            <div class="team-member-name">${a.name}</div>
            <div class="team-member-role">L2 SOC Analyst</div>
            <div class="team-member-stats">
              <div class="team-stat-item"><div class="team-stat-value" style="color:${this._getLoadColor(a.load)}">${a.load}%</div><div class="team-stat-label">Load</div></div>
              <div class="team-stat-item"><div class="team-stat-value">${a.activeCases}</div><div class="team-stat-label">Active</div></div>
              <div class="team-stat-item"><div class="team-stat-value" style="color:#22c55e">${a.resolvedToday}</div><div class="team-stat-label">Resolved</div></div>
            </div>
          </div>
        `)}
      </div>
      <div class="grid-2">
        <div class="section">
          <div class="stitle">Analyst Workload</div>
          ${this._analysts.map(a => html`
            <div class="analyst-card">
              <div class="analyst-avatar" style="background:${this._getLoadColor(a.load)}30;color:${this._getLoadColor(a.load)}">${a.name.charAt(0)}</div>
              <div class="analyst-info">
                <div class="analyst-name">${a.name}</div>
                <div class="analyst-meta">Active: ${a.activeCases} | Today: ${a.resolvedToday} resolved</div>
              </div>
              <div style="text-align:right">
                <div class="load-bar"><div class="load-fill" style="width:${a.load}%;background:${this._getLoadColor(a.load)}"></div></div>
                <div style="font-size:10px;color:#6b7280;margin-top:2px">${a.load}% load</div>
              </div>
            </div>
          `)}
        </div>
        <div class="section">
          <div class="stitle">MTTD / MTTR Metrics</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
            <div style="background:#0f172a;border-radius:6px;padding:12px;text-align:center">
              <div style="font-size:24px;font-weight:700;color:#22c55e">12m</div>
              <div style="font-size:10px;color:#6b7280">MTTD</div>
            </div>
            <div style="background:#0f172a;border-radius:6px;padding:12px;text-align:center">
              <div style="font-size:24px;font-weight:700;color:#3b82f6">2.3h</div>
              <div style="font-size:10px;color:#6b7280">MTTR</div>
            </div>
          </div>
          <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">Target: MTTD < 15min, MTTR < 4h</div>
          <div style="display:flex;justify-content:center;gap:16px;margin:10px 0">${this._gaugeSVG(80, 'MTTD')}${this._gaugeSVG(92, 'MTTR')}</div>
          <div style="margin-bottom:8px">
            <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">Alert Volume Trend (12h)</div>
            <div .innerHTML=${this._sparklineSVG(trendData, '#f59e0b')}></div>
          </div>
          <div>
            <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">MTTR Trend (12h)</div>
            <div .innerHTML=${this._sparklineSVG(mttrData, '#3b82f6')}></div>
          </div>
        </div>
      </div>
      <div class="section" style="margin-top:12px">
        <div class="stitle">Recent Activity</div>
        ${[
          { time: '10:32', analyst: 'Martinez', action: 'Escalated alert to L3 - C2 beacon confirmed', color: '#ef4444' },
          { time: '10:28', analyst: 'Chen', action: 'Assigned brute force alert for triage', color: '#3b82f6' },
          { time: '10:15', analyst: 'Patel', action: 'Resolved phishing cluster - 15 users affected', color: '#22c55e' },
          { time: '09:45', analyst: 'Kim', action: 'Opened investigation case for svc-backup-02', color: '#eab308' },
          { time: '09:30', analyst: 'Thompson', action: 'Auto-resolved 23 low-severity alerts', color: '#a855f7' },
        ].map(a => html`<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid #1f2937;font-size:10px"><span style="color:#6b7280;min-width:40px">${a.time}</span><span style="color:${a.color};min-width:60px;font-weight:600">${a.analyst}</span><span style="color:#e2e8f0;flex:1">${a.action}</span></div>`)}
      </div>
      <div class="section" style="margin-top:12px">
        <div class="stitle">Escalation Path</div>
        ${[
          { level: 'L1', name: 'Auto-Triage', criteria: 'Known FP pattern', sla: '0 min', color: '#6b7280' },
          { level: 'L2', name: 'Initial Assessment', criteria: 'New alert, low confidence', sla: '15 min', color: '#3b82f6' },
          { level: 'L3', name: 'Deep Investigation', criteria: 'Confirmed suspicious', sla: '30 min', color: '#f59e0b' },
          { level: 'L4', name: 'Specialist Review', criteria: 'Malware/Forensics needed', sla: '60 min', color: '#f97316' },
          { level: 'L5', name: 'Incident Commander', criteria: 'Active intrusion confirmed', sla: '15 min', color: '#ef4444' },
          { level: 'L6', name: 'CISO Notification', criteria: 'Critical impact/data breach', sla: '5 min', color: '#dc2626' },
        ].map(l => html`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937"><div style="width:24px;height:24px;border-radius:50%;background:${l.color}20;color:${l.color};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700">${l.level}</div><div style="flex:1"><div style="font-size:10px;color:#e2e8f0">${l.name}</div><div style="font-size:9px;color:#6b7280">${l.criteria}</div></div><div style="font-size:9px;color:#eab308">${l.sla}</div></div>`)}
      </div>
    `;
  }

  private _renderHandoffTab() {
    return html`
      <div class="handoff-box">
        <div class="stitle">Shift Handoff Summary</div>
        <textarea placeholder="Enter shift summary notes..."></textarea>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="runbook-btn" @click=${() => alert('Generating handoff report...')}>Generate Report</button>
          <button class="runbook-btn" @click=${() => alert('Sending to next shift...')}>Send to Next Shift</button>
        </div>
      </div>
      <div class="section" style="margin-top:12px">
        <div class="stitle">Active Items for Next Shift</div>
        ${this._alerts.filter(a => a.status !== 'resolved').slice(0, 3).map(a => html`
          <div style="background:#0f172a;border-radius:6px;padding:10px;margin-bottom:6px">
            <div style="font-weight:600;font-size:12px">${a.title}</div>
            <div style="font-size:10px;color:#6b7280">Status: ${a.status} | Assignee: ${a.assignee ?? 'Unassigned'}</div>
          </div>
        `)}
      </div>
    `;
  }

  render() {
    const activeAlerts = this._alerts.filter(a => a.status !== 'resolved').length;
    const criticalActive = this._alerts.filter(a => a.status !== 'resolved' && a.severity === 'critical').length;
    const openCases = this._cases.filter(c => c.status !== 'resolved').length;
    const unreadNotifs = this._notifications.filter(n => !n.read).length;

    return html`
      <div class="panel">
        <div class="pt">SOC Analyst Workflow<span style="flex:1"></span>
          <div style="position:relative;display:inline-block">
            <button style="background:none;border:none;cursor:pointer;font-size:16px;color:#94a3b8;position:relative" @click=${() => { this._showNotifPanel = !this._showNotifPanel; }}>
              ${this._showNotifPanel ? '\uD83D\uDD14' : '\uD83D\uDD15'}
              ${unreadNotifs > 0 ? html`<span class="notification-dot" style="position:absolute;top:-2px;right:-4px"></span>` : nothing}
            </button>
            ${this._showNotifPanel ? html`
              <div style="position:absolute;top:28px;right:0;width:300px;background:#1f2937;border-radius:8px;padding:10px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.5)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <span style="font-size:12px;font-weight:700">Notifications (${unreadNotifs})</span>
                  <span style="font-size:10px;color:#3b82f6;cursor:pointer" @click=${this._markAllNotifsRead}>Mark all read</span>
                </div>
                ${this._notifications.map(n => html`
                  <div style="padding:8px;background:${n.read ? 'transparent' : '#0f172a'};border-radius:6px;margin-bottom:4px;cursor:pointer;border-left:3px solid ${n.type === 'critical' ? '#ef4444' : n.type === 'warning' ? '#f59e0b' : '#3b82f6'}" @click=${() => this._markNotifRead(n.id)}>
                    <div style="font-size:11px;color:${n.read ? '#6b7280' : '#e2e8f0'};font-weight:${n.read ? '400' : '600'}">${n.message}</div>
                    <div style="font-size:9px;color:#6b7280;margin-top:2px">${n.time}</div>
                  </div>
                `)}
              </div>
            ` : nothing}
          </div>
          <button class="export-btn" @click=${this._exportJSON}>Export</button>
        </div>
        <div class="stats">
          <div class="stat"><div class="sv" style="color:#ef4444">${criticalActive}</div><div class="sl">Critical Active</div></div>
          <div class="stat"><div class="sv">${activeAlerts}</div><div class="sl">Active Alerts</div></div>
          <div class="stat"><div class="sv">${openCases}</div><div class="sl">Open Cases</div></div>
          <div class="stat"><div class="sv" style="color:#22c55e">12</div><div class="sl">Resolved Today</div></div>
          <div class="stat"><div class="sv" style="color:#3b82f6">2.3h</div><div class="sl">Avg MTTR</div></div>
          <div class="stat"><div class="sv">12m</div><div class="sl">Avg MTTD</div></div>
        </div>
        <div class="tabs">
          <span class="tab ${this._tab === 'alerts' ? 'active' : ''}" @click=${() => { this._tab = 'alerts'; this.requestUpdate(); }}>Alerts (${activeAlerts})</span>
          <span class="tab ${this._tab === 'cases' ? 'active' : ''}" @click=${() => { this._tab = 'cases'; this.requestUpdate(); }}>Cases (${openCases})</span>
          <span class="tab ${this._tab === 'workload' ? 'active' : ''}" @click=${() => { this._tab = 'workload'; this.requestUpdate(); }}>Workload</span>
          <span class="tab ${this._tab === 'analysis' ? 'active' : ''}" @click=${() => { this._tab = 'analysis'; this.requestUpdate(); }}>Analysis</span>
          <span class="tab ${this._tab === 'sla' ? 'active' : ''}" @click=${() => { this._tab = 'sla'; this.requestUpdate(); }}>SLA</span>
          <span class="tab ${this._tab === 'playbook' ? 'active' : ''}" @click=${() => { this._tab = 'playbook'; this.requestUpdate(); }}>Playbook</span>
          <span class="tab ${this._tab === 'tasks' ? 'active' : ''}" @click=${() => { this._tab = 'tasks'; this.requestUpdate(); }}>Tasks</span>
          <span class="tab ${this._tab === 'approvals' ? 'active' : ''}" @click=${() => { this._tab = 'approvals'; this.requestUpdate(); }}>Approvals (${this._approvalQueue.filter(a => a.status === 'pending').length})</span>
          <span class="tab ${this._tab === 'audit' ? 'active' : ''}" @click=${() => { this._tab = 'audit'; this.requestUpdate(); }}>Audit</span>
          <span class="tab ${this._tab === 'config' ? 'active' : ''}" @click=${() => { this._tab = 'config'; this.requestUpdate(); }}>Config</span>
          <span class="tab ${this._tab === 'handoff' ? 'active' : ''}" @click=${() => { this._tab = 'handoff'; this.requestUpdate(); }}>Handoff</span>
        </div>
        ${this._tab === 'alerts' ? this._renderAlertsTab() : ''}
        ${this._tab === 'cases' ? this._renderCasesTab() : ''}
        ${this._tab === 'workload' ? this._renderWorkloadTab() : ''}
        ${this._tab === 'playbook' ? html`
          <div style="margin-bottom:12px">
            <div style="font-size:13px;font-weight:700;margin-bottom:10px">Incident Response Playbook</div>
            ${this._playbookSteps.map(s => html`
              <div class="playbook-step">
                <div class="step-num ${s.status}">${s.step}</div>
                <div style="flex:1">
                  <div style="font-size:12px;font-weight:600">${s.name}</div>
                  <div style="font-size:10px;color:#94a3b8;margin-top:2px">${s.desc}</div>
                  <div style="margin-top:4px">${s.techniques.map(t => html`<span class="tag" style="background:#3b82f620;color:#60a5fa">${t}</span>`)}</div>
                </div>
                <span class="status-badge ${s.status === 'done' ? 'completed' : s.status === 'active' ? 'in-progress' : 'pending'}">${s.status}</span>
              </div>
            `)}
          </div>
          <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
            <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:8px">MITRE ATT&CK Mapping</div>
            ${this._alerts.map(a => {
              const mitre = this._mitreMap[a.ruleName];
              return mitre ? html`<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #0f172a;font-size:10px"><span style="font-family:monospace;color:#60a5fa;min-width:70px">${mitre.id}</span><span style="flex:1;color:#e2e8f0">${a.title}</span><span class="tag" style="background:#a855f720;color:#c084fc">${mitre.tactic}</span></div>` : nothing;
            })}
          </div>
        ` : ''}
        ${this._tab === 'tasks' ? html`
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;margin-bottom:10px;color:#94a3b8;text-transform:uppercase">Analyst Task Queue</div>
            ${this._taskQueue.map(t => html`
              <div class="task-row">
                <div style="width:8px;height:8px;border-radius:50%;background:${this._getSeverityColor(t.priority)}"></div>
                <input type="checkbox" class="task-check" .checked=${t.status === 'completed'} @change=${() => this._completeTask(t.id)} />
                <div style="flex:1"><div style="font-size:12px;font-weight:600;${t.status === 'completed' ? 'text-decoration:line-through;color:#6b7280' : ''}">${t.task}</div><div style="font-size:10px;color:#6b7280">Assigned: ${t.assignee}</div></div>
                <span class="status-badge ${t.status}">${t.status}</span>
              </div>
            `)}
          </div>
        ` : ''}
        ${this._tab === 'approvals' ? html`
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;margin-bottom:10px;color:#94a3b8;text-transform:uppercase">Escalation Approvals</div>
            ${this._approvalQueue.map(a => html`
              <div class="approval-row">
                <div style="flex:1"><div style="font-size:12px;font-weight:600">${a.action}</div><div style="font-size:10px;color:#6b7280">Requested by: ${a.requester}</div></div>
                ${a.status === 'pending' ? html`
                  <button class="approval-btn approve" @click=${() => this._approveAction(a.id)}>Approve</button>
                  <button class="approval-btn reject" @click=${() => this._rejectAction(a.id)}>Reject</button>
                ` : html`<span class="status-badge ${a.status}">${a.status}</span>`}
              </div>
            `)}
          </div>
        ` : ''}
        ${this._tab === 'analysis' ? html`
          <div class="grid-2">
            <div>
              <div class="section">
                <div class="stitle">Auto-Triage Pipeline</div>
                <div style="display:flex;gap:8px;margin-bottom:12px">
                  <button class="runbook-btn" @click=${this._runTriagePipeline} ?disabled=${this._execPhase === 'running'}>${this._execPhase === 'running' ? 'Running...' : 'Run Auto-Triage'}</button>
                  ${this._execPhase === 'complete' ? html`<button class="runbook-btn" style="background:#374151" @click=${() => { this._execPhase = 'idle'; this._execResults = []; }}>Reset</button>` : nothing}
                  <span style="flex:1"></span>
                  <span style="font-size:10px;color:#94a3b8">${this._execProgress}%</span>
                </div>
                <div style="height:8px;background:#374151;border-radius:4px;overflow:hidden;margin-bottom:12px"><div style="height:100%;width:${this._execProgress}%;background:${this._execPhase === 'complete' ? '#22c55e' : '#f59e0b'};border-radius:4px;transition:width 0.3s"></div></div>
                <div class="exec-pipeline">
                  ${this._execSteps.map((s, i) => html`
                    <div class="pipeline-step">
                      <div class="step-icon ${s.status}">${s.status === 'done' ? '\u2713' : s.status === 'running' ? '\u25CF' : (i + 1)}</div>
                      <div class="step-info"><div class="step-name">${s.name}</div><div class="step-desc">${s.desc}</div></div>
                      <div class="step-time">${s.status === 'done' ? s.duration + 'ms' : ''}</div>
                    </div>
                  `)}
                </div>
                ${this._execResults.length > 0 ? html`
                  <div style="background:#0f172a;border-radius:8px;padding:12px;margin-top:12px">
                    <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:8px">Triage Results</div>
                    ${this._execResults.map(r => html`<div style="padding:6px 0;border-bottom:1px solid #1f2937"><div style="font-size:11px;font-weight:600;color:#f59e0b">${r.step}</div><div style="font-size:10px;color:#94a3b8;margin-top:2px">${r.output}</div></div>`)}
                  </div>
                ` : nothing}
              </div>
              <div class="section" style="margin-top:12px">
                <div class="stitle">Alert-to-Case Flow (Sankey)</div>
                <div class="sankey-svg">${this._sankeyFlowSVG()}</div>
              </div>
              <div class="section">
                <div class="stitle">MITRE ATT&CK Tactic Coverage</div>
                <div style="display:flex;justify-content:center;padding:8px 0">${this._mitreRadarSVG()}</div>
              </div>
            </div>
            <div>
              <div class="section">
                <div class="stitle">Alert Volume Trend (24h)</div>
                ${this._trendChartSVG()}
                <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap">
                  ${(() => {
                    const reg = this._linearRegression(this._trendData.map(d => d.alerts));
                    const trendClass = reg.trend === 'up' ? 'trend-up' : reg.trend === 'down' ? 'trend-down' : 'trend-flat';
                    const arrow = reg.trend === 'up' ? '\u2191' : reg.trend === 'down' ? '\u2193' : '\u2192';
                    return html`<span class="trend-indicator ${trendClass}">${arrow} Slope: ${reg.slope.toFixed(2)}/hr</span>`;
                  })()}
                  <span class="trend-indicator ${this._anomalyPoints.length > 0 ? 'trend-up' : 'trend-down'}">${this._anomalyPoints.length} anomalies</span>
                </div>
              </div>
              <div class="section" style="margin-top:12px">
                <div class="stitle">Auto-Generated Insights</div>
                ${this._generateInsights().map(ins => html`
                  <div class="insight-card" style="border-left-color:${ins.severity === 'critical' ? '#ef4444' : ins.severity === 'warning' ? '#f59e0b' : '#3b82f6'}">
                    <div class="insight-title" style="color:${ins.severity === 'critical' ? '#ef4444' : ins.severity === 'warning' ? '#f59e0b' : '#3b82f6'}">${ins.severity.toUpperCase()}: ${ins.title}</div>
                    <div class="insight-body">${ins.body}</div>
                  </div>
                `)}
              </div>
              <div class="section" style="margin-top:12px">
                <div class="stitle">Threat Intelligence Feed</div>
                ${this._threatIntelFeed.map(ti => html`
                  <div class="intel-row">
                    <span class="intel-type" style="background:${ti.type === 'ip' ? '#ef444420' : ti.type === 'domain' ? '#3b82f620' : ti.type === 'hash' ? '#a855f720' : '#f9731620'};color:${ti.type === 'ip' ? '#ef4444' : ti.type === 'domain' ? '#3b82f6' : ti.type === 'hash' ? '#a855f7' : '#f97316'}">${ti.type}</span>
                    <span class="intel-ip">${ti.value}</span>
                    <span class="intel-detail">${ti.description}</span>
                    <span class="intel-confidence" style="color:${ti.confidence >= 85 ? '#22c55e' : ti.confidence >= 70 ? '#f59e0b' : '#ef4444'}">${ti.confidence}%</span>
                  </div>
                `)}
              </div>
            </div>
          </div>
          <div class="section" style="margin-top:12px">
            <div class="stitle">SOC Infrastructure Topology</div>
            <div class="topology-svg"><svg viewBox="0 0 360 160" width="100%" height="160">${this._socTopologySVG()}</svg></div>
          </div>
          <div class="grid-2" style="margin-top:12px">
            <div class="section">
              <div class="stitle">MITRE ATT&CK Coverage Heatmap</div>
              ${this._mitreHeatmapSVG()}
            </div>
            <div class="section">
              <div class="stitle">Case Timeline</div>
              ${this._caseTimelineSVG()}
            </div>
          </div>
        ` : ''}

        ${this._tab === 'sla' ? html`
          <div class="section">
            <div class="stitle">Case SLA Timers</div>
            ${this._slaItems.map(item => {
              const pct = Math.min(100, (item.elapsed / item.total) * 100);
              const remaining = Math.max(0, item.total - item.elapsed);
              const hrs = Math.floor(remaining / 3600000);
              const mins = Math.floor((remaining % 3600000) / 60000);
              const color = pct > 100 ? '#ef4444' : pct > 80 ? '#f59e0b' : '#22c55e';
              const caseInfo = this._cases.find(c => c.id === item.case);
              return html`
                <div class="sla-timer">
                  <div style="width:8px;height:8px;border-radius:50%;background:${this._getSeverityColor(item.priority)}"></div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:11px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${caseInfo?.title || item.case}</div>
                    <div style="font-size:9px;color:#6b7280">${item.assignee}</div>
                  </div>
                  <div style="width:100px;flex-shrink:0"><div class="sla-bar"><div class="sla-fill" style="width:${Math.min(pct, 100)}%;background:${color}"></div></div></div>
                  <div class="sla-label" style="color:${color}">${pct > 100 ? 'OVERDUE' : hrs + 'h' + mins + 'm'}</div>
                </div>`;
            })}
            <div style="margin-top:12px">
              <div style="font-size:10px;font-weight:600;color:#94a3b8;margin-bottom:6px">SLA Overview</div>
              ${this._slaOverviewSVG()}
            </div>
          </div>
        ` : ''}

        ${this._tab === 'audit' ? html`
          <div class="section">
            <div class="stitle">Audit Log (${this._auditLog.length})</div>
            ${this._auditLog.map(entry => html`
              <div class="audit-entry">
                <div class="audit-time">${new Date(entry.timestamp).toLocaleString()}</div>
                <div class="audit-action">${entry.action}</div>
                <div class="audit-detail">${entry.user}: ${entry.detail}</div>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tab === 'config' ? html`
          <div class="section">
            <div class="stitle">SOC Configuration</div>
            ${Object.entries(this._configSettings).map(([key, val]) => {
              const labels: Record<string, { label: string; desc: string }> = {
                autoEscalate: { label: 'Auto-Escalate', desc: 'Automatically escalate critical alerts to L3' },
                autoAssign: { label: 'Auto-Assign', desc: 'Distribute alerts based on analyst workload' },
                slaAlerts: { label: 'SLA Alerts', desc: 'Notify when case SLA is at 80% utilization' },
                mitreMapping: { label: 'MITRE Mapping', desc: 'Auto-map alerts to MITRE ATT&CK techniques' },
                playbookAuto: { label: 'Auto-Playbook', desc: 'Automatically execute matching playbooks' },
                shiftHandoff: { label: 'Shift Handoff', desc: 'Generate shift handoff reports automatically' },
              };
              const info = labels[key] || { label: key, desc: '' };
              return html`
                <div class="config-row">
                  <div><div class="config-label">${info.label}</div><div class="config-desc">${info.desc}</div></div>
                  <button class="config-toggle ${val ? 'on' : ''}" @click=${() => { this._configSettings = { ...this._configSettings, [key]: !val }; this._addAudit('CONFIG_CHANGE', 'You', `Toggled ${info.label}`); }}></button>
                </div>`;
            })}
          </div>
          <div class="config-section">
            <div class="form-group"><label class="form-label">SIEM Integration URL</label><input class="form-input" type="text" value="https://siem.internal/api/v2" readonly></div>
            <div class="form-group"><label class="form-label">SOAR Platform</label><input class="form-input" type="text" value="Splunk SOAR" readonly></div>
            <div class="form-group"><label class="form-label">Default Triage SLA (min)</label><input class="form-input" type="number" value="15"></div>
            <div style="display:flex;gap:8px"><button class="runbook-btn" @click=${() => this._addAudit('CONFIG_SAVE', 'You', 'Saved SOC configuration')}>Save</button><button class="runbook-btn" style="background:#374151">Test Integration</button></div>
          </div>
        ` : ''}

        ${this._tab === 'handoff' ? this._renderHandoffTab() : ''}
      </div>
    `;
  }

  // === Enhanced Pipeline & Grid Integration ===
  private _pipelineProgress = 0;
  private _pipelineRunning = false;
  private _pipelinePhase = 'idle';
  private _jobQueue: { id: string; name: string; priority: number; status: string }[] = [];
  private _errorCategories: { category: string; count: number; autoRemediation: string }[] = [];
  private _gridSelectedRows: Set<string> = new Set();
  private _gridSortColumn = 'riskScore';
  private _gridSortAsc = false;
  private _showHelpOverlay = false;
  private _glossaryTerms: { term: string; definition: string }[] = [
    { term: 'Risk Assessment', definition: 'Systematic process of identifying and evaluating risks' },
    { term: 'Threat Vector', definition: 'Path or means by which an attacker can compromise a system' },
    { term: 'Vulnerability', definition: 'Weakness that can be exploited by a threat to cause harm' },
    { term: 'Mitigation', definition: 'Action taken to reduce the likelihood or impact of a risk' },
    { term: 'Residual Risk', definition: 'Risk remaining after controls have been applied' },
    { term: 'Risk Score', definition: 'Numerical rating combining likelihood and impact factors' },
    { term: 'Control', definition: 'Safeguard or countermeasure that reduces risk exposure' },
    { term: 'Compliance', definition: 'Adherence to laws, regulations, standards, and policies' },
    { term: 'Incident', definition: 'Security event that actually or potentially jeopardizes systems' },
    { term: 'Remediation', definition: 'Process of repairing or correcting a vulnerability or finding' },
    { term: 'SLA', definition: 'Service Level Agreement defining response and resolution targets' },
    { term: 'TTP', definition: 'Tactics, Techniques, and Procedures used by threat actors' },
  ];
  private _keyboardShortcuts: { key: string; action: string }[] = [
    { key: 'Ctrl+Enter', action: 'Execute pipeline' },
    { key: 'Ctrl+Shift+E', action: 'Export data' },
    { key: 'Ctrl+Shift+R', action: 'Rollback phase' },
    { key: 'Ctrl+F', action: 'Find in grid' },
    { key: 'Ctrl+A', action: 'Select all' },
    { key: 'Escape', action: 'Close overlay' },
    { key: 'Ctrl+H', action: 'Toggle help' },
    { key: 'Ctrl+1-5', action: 'Switch tabs' },
  ];

  private _renderPipelineMini(): any {
    const barColor = this._pipelineRunning ? '#3b82f6' : this._pipelinePhase === 'error' ? '#ef4444' : '#22c55e';
    return html`<div style="background:#1f2937;border-radius:8px;padding:12px;margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:600;font-size:11px;color:#9ca3af;text-transform:uppercase">Pipeline Status</span>
        <span style="font-size:9px;color:#6b7280">${this._pipelinePhase}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <div style="flex:1;height:6px;background:#0a0c10;border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${this._pipelineProgress}%;background:${barColor};border-radius:3px;transition:width 0.3s"></div>
        </div>
        <span style="font-size:10px;color:#e2e8f0;font-weight:600">${this._pipelineProgress}%</span>
      </div>
    </div>`;
  }

  private _renderHelpOverlay(): any {
    if (!this._showHelpOverlay) return html``;
    return html`<div style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center" @click=${() => { this._showHelpOverlay = false; }}>
      <div style="background:#1f2937;border-radius:12px;padding:20px;max-width:550px;max-height:75vh;overflow-y:auto;width:90%" @click=${(e: any) => e.stopPropagation()}>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <span style="font-weight:700;font-size:15px;color:#e2e8f0">Documentation</span>
          <button style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:18px" @click=${() => { this._showHelpOverlay = false; }}>✕</button>
        </div>
        ${this._glossaryTerms.map(g => html`<div style="padding:5px 0;border-bottom:1px solid #374151"><span style="font-weight:600;color:#60a5fa;font-size:11px">${g.term}</span><p style="font-size:10px;color:#9ca3af;margin:1px 0 0;line-height:1.3">${g.definition}</p></div>`)}
        <div style="margin-top:10px;font-weight:600;font-size:11px;color:#9ca3af;text-transform:uppercase;margin-bottom:6px">Shortcuts</div>
        ${this._keyboardShortcuts.map(s => html`<div style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px"><span style="color:#d1d5db">${s.action}</span><kbd style="background:#0a0c10;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace;font-size:9px;border:1px solid #374151">${s.key}</kbd></div>`)}
      </div>
    </div>`;
  }


  // === SECTION A: Multi-Phase Pipeline Execution Engine ===
  private _pipelinePhases: { id: string; name: string; status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled-back'; progress: number; duration: number; errors: string[]; rollbackSteps: string[] }[] = [
    { id: 'ph-1', name: 'Initial Scan', status: 'completed', progress: 100, duration: 30, errors: [], rollbackSteps: ['Reset initial scan state'] },
    { id: 'ph-2', name: 'Data Collection', status: 'completed', progress: 100, duration: 45, errors: [], rollbackSteps: ['Reset data collection state'] },
    { id: 'ph-3', name: 'Analysis Processing', status: 'running', progress: 62, duration: 90, errors: [], rollbackSteps: ['Reset analysis processing state'] },
    { id: 'ph-4', name: 'Threat Correlation', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset threat correlation state'] },
    { id: 'ph-5', name: 'Report Generation', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset report generation state'] },
    { id: 'ph-6', name: 'Remediation Tracking', status: 'pending', progress: 0, duration: 0, errors: [], rollbackSteps: ['Reset remediation tracking state'] },
  ];

  private _pipelineJobQueue: { id: string; name: string; priority: number; status: 'queued' | 'processing' | 'done'; phaseId: string; submittedAt: number; startedAt: number }[] = [
    { id: 'job-001', name: 'Scan target systems', priority: 1, status: 'done', phaseId: 'ph-1', submittedAt: Date.now() - 300000, startedAt: Date.now() - 280000 },
    { id: 'job-002', name: 'Collect telemetry data', priority: 2, status: 'done', phaseId: 'ph-2', submittedAt: Date.now() - 250000, startedAt: Date.now() - 230000 },
    { id: 'job-003', name: 'Run analysis engine', priority: 3, status: 'processing', phaseId: 'ph-3', submittedAt: Date.now() - 200000, startedAt: 0 },
    { id: 'job-004', name: 'Generate findings', priority: 2, status: 'queued', phaseId: 'ph-4', submittedAt: Date.now() - 150000, startedAt: 0 },
    { id: 'job-005', name: 'Create remediation plan', priority: 4, status: 'queued', phaseId: 'ph-5', submittedAt: Date.now() - 100000, startedAt: 0 },
  ];

  private _errorCategories: { category: string; icon: string; count: number; autoRemediation: string }[] = [
    { category: 'Scan Timeout', icon: 'net', count: 4, autoRemediation: 'Retry with extended timeout' },
    { category: 'Data Parse Error', icon: 'hash', count: 3, autoRemediation: 'Skip malformed records' },
    { category: 'API Rate Limited', icon: 'scan', count: 6, autoRemediation: 'Apply exponential backoff' },
    { category: 'Auth Token Expired', icon: 'enc', count: 2, autoRemediation: 'Refresh authentication token' },
    { category: 'Config Validation Fail', icon: 'fs', count: 5, autoRemediation: 'Review configuration settings' },
    { category: 'Resource Not Found', icon: 'time', count: 3, autoRemediation: 'Verify resource identifiers' },
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
    { id: 'FND-001', case: 'Primary', finding: 'Critical misconfiguration detected in core component', severity: 'critical', riskScore: 92, trend: [72,76,80,84,87,90,92], status: 'open', assignee: 'Team Lead' },
    { id: 'FND-002', case: 'Secondary', finding: 'Unexpected access pattern from external source', severity: 'high', riskScore: 78, trend: [55,58,62,66,70,74,78], status: 'investigating', assignee: 'Analyst A' },
    { id: 'FND-003', case: 'Tertiary', finding: 'Compliance deviation from baseline policy', severity: 'medium', riskScore: 55, trend: [35,38,42,45,48,52,55], status: 'mitigated', assignee: 'Analyst B' },
    { id: 'FND-004', case: 'External', finding: 'Third-party integration security gap', severity: 'high', riskScore: 82, trend: [62,65,68,72,75,78,82], status: 'open', assignee: 'Analyst C' },
    { id: 'FND-005', case: 'Internal', finding: 'Privilege escalation path identified', severity: 'critical', riskScore: 95, trend: [80,83,86,88,91,93,95], status: 'escalated', assignee: 'Team Lead' },
    { id: 'FND-006', case: 'Archival', finding: 'Stale credential in legacy system', severity: 'low', riskScore: 38, trend: [20,22,25,28,30,34,38], status: 'mitigated', assignee: 'Analyst D' },
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
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Soc Analyst Workflow Findings Grid</span>
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
    { name: 'Platform Enhancement', investment: 120000, annualSavings: 95000, riskReduction: 28, paybackMonths: 16, npv: 250000 },
    { name: 'Automation Upgrade', investment: 75000, annualSavings: 62000, riskReduction: 22, paybackMonths: 15, npv: 160000 },
    { name: 'Monitoring Expansion', investment: 55000, annualSavings: 45000, riskReduction: 18, paybackMonths: 15, npv: 120000 },
    { name: 'Training Program', investment: 40000, annualSavings: 32000, riskReduction: 15, paybackMonths: 15, npv: 85000 },
  ];

  private _riskQuantMetrics: { metric: string; sle: number; aro: number; ale: number; mitigationCost: number; roi: number }[] = [
    { metric: 'Critical System Compromise', sle: 4200000, aro: 0.12, ale: 504000, mitigationCost: 95000, roi: 430 },
    { metric: 'Data Exposure Incident', sle: 2800000, aro: 0.18, ale: 504000, mitigationCost: 75000, roi: 572 },
    { metric: 'Operational Disruption', sle: 1500000, aro: 0.25, ale: 375000, mitigationCost: 55000, roi: 582 },
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
    { name: 'Data Service', url: '/api/v1/service/data', method: 'POST', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '2m ago' },
    { name: 'Analysis Engine', url: '/api/v1/service/analyze', method: 'GET', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '5m ago' },
    { name: 'Report Generator', url: '/api/v1/service/report', method: 'POST', headers: { 'Content-Type': 'application/json' }, lastStatus: 200, lastCalled: '15m ago' },
  ];

  private _webhookConfigs: { id: string; name: string; url: string; events: string[]; active: boolean; lastTriggered: string }[] = [
    { id: 'wh-1', name: 'Alert Dispatch', url: 'https://hooks.slack.com/T00/B00/svc1', events: ['critical_alert'], active: true, lastTriggered: '30m ago' },
    { id: 'wh-2', name: 'Status Update', url: 'https://hooks.slack.com/T00/B00/svc2', events: ['status_change'], active: true, lastTriggered: '1h ago' },
    { id: 'wh-3', name: 'Escalation Notice', url: 'https://hooks.slack.com/T00/B00/svc3', events: ['escalation'], active: false, lastTriggered: 'Never' },
  ];

  private _dataSourceConnections: { name: string; type: string; status: 'connected' | 'disconnected' | 'error'; lastSync: string; records: number }[] = [
    { name: 'Primary Database', type: 'PostgreSQL', status: 'connected', lastSync: '1m ago', records: 234000 },
    { name: 'Log Storage', type: 'Elasticsearch', status: 'connected', lastSync: '5m ago', records: 890000 },
    { name: 'Config Repository', type: 'Git', status: 'connected', lastSync: '30m ago', records: 5600 },
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
    { term: 'Risk Assessment', definition: 'Systematic process of identifying and evaluating risks to assets' },
    { term: 'Threat Vector', definition: 'Path or means by which an adversary can compromise a system' },
    { term: 'Vulnerability', definition: 'Weakness that can be exploited by a threat actor to cause harm' },
    { term: 'Mitigation', definition: 'Action or control that reduces likelihood or impact of a risk' },
    { term: 'Residual Risk', definition: 'Remaining risk after all controls and mitigations are applied' },
    { term: 'Risk Score', definition: 'Numerical rating combining likelihood and impact assessment factors' },
    { term: 'Control Framework', definition: 'Structured set of policies and procedures for managing risk' },
    { term: 'Compliance', definition: 'Adherence to applicable laws regulations standards and organizational policies' },
    { term: 'Incident Response', definition: 'Organized approach to addressing and managing security incidents' },
    { term: 'Remediation', definition: 'Process of correcting identified vulnerabilities or security findings' },
    { term: 'SLA', definition: 'Service Level Agreement defining expected response and resolution timeframes' },
    { term: 'TTP', definition: 'Tactics Techniques and Procedures describing how threat actors operate' },
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
declare global { interface HTMLElementTagNameMap { 'sc-soc-analyst-workflow': ScSocAnalystWorkflow; } }
