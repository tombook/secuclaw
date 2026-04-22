/**
 * sc-mitre-attack-heatmap — MITRE ATT&CK Heatmap (Security Commander/Security Expert Core)
 * Tactics/techniques coverage, detection gap analysis, and improvement prioritization
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Technique {
  id: string;
  name: string;
  tactic: string;
  coverage: 'full' | 'partial' | 'none';
  detections: number;
  detectionsLast30Days: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cveCount?: number;
}

interface Tactic {
  id: string;
  name: string;
  order: number;
  color: string;
}

@customElement('sc-mitre-attack-heatmap')
export class ScMitreAttackHeatmap extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #111827); border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
    .stats { display: flex; gap: 10px; flex-wrap: wrap; }
    .stat { background: var(--bg-tertiary, #0a0e17); border-radius: 6px; padding: 6px 12px; min-width: 70px; text-align: center; }
    .sv { font-size: 16px; font-weight: 700; }
    .sl { font-size: 10px; color: var(--text-tertiary, #94a3b8); }
    .sv.full { color: #22c55e; }
    .sv.partial { color: #eab308; }
    .sv.none { color: #ef4444; }
    .controls-right { display: flex; gap: 6px; flex-wrap: wrap; }
    .btn { padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); color: var(--text-secondary, #94a3b8); transition: all 0.2s; }
    .btn.active { background: var(--accent-color, #3b82f6); color: white; border-color: var(--accent-color, #3b82f6); }
    .btn:hover { border-color: var(--accent-color, #3b82f6); color: var(--text-primary, #e2e8f0); }
    .heatmap-container { overflow-x: auto; margin-bottom: 16px; }
    .heatmap { display: flex; gap: 4px; align-items: stretch; min-width: 900px; }
    .tactic-column { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .tactic-header { text-align: center; font-size: 11px; font-weight: 600; padding: 8px 4px; border-radius: 4px 4px 0 0; color: white; }
    .techniques-list { display: flex; flex-direction: column; gap: 2px; }
    .technique-cell { padding: 6px 4px; border-radius: 3px; text-align: center; font-size: 9px; font-weight: 500; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
    .technique-cell:hover { filter: brightness(1.3); transform: scale(1.05); z-index: 10; }
    .technique-cell.full { background: #14532d; color: #86efac; border: 1px solid #22c55e; }
    .technique-cell.partial { background: #422006; color: #fde047; border: 1px solid #eab308; }
    .technique-cell.none { background: #450a0a; color: #fca5a5; border: 1px solid #ef4444; }
    .technique-cell .detection-badge { position: absolute; top: 1px; right: 2px; font-size: 7px; font-weight: 700; background: rgba(0,0,0,0.3); padding: 0 3px; border-radius: 2px; }
    .legend { display: flex; gap: 20px; align-items: center; justify-content: center; margin-bottom: 16px; flex-wrap: wrap; padding: 10px; background: var(--bg-secondary, #1f2937); border-radius: 6px; }
    .legend-group { display: flex; gap: 12px; align-items: center; }
    .legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; }
    .legend-color { width: 16px; height: 16px; border-radius: 3px; }
    .legend-color.full { background: #14532d; border: 1px solid #22c55e; }
    .legend-color.partial { background: #422006; border: 1px solid #eab308; }
    .legend-color.none { background: #450a0a; border: 1px solid #ef4444; }
    .legend-severity { display: flex; gap: 8px; align-items: center; }
    .legend-severity .legend-color { border-radius: 50%; width: 12px; height: 12px; }
    .legend-severity .critical { background: #ef4444; }
    .legend-severity .high { background: #f97316; }
    .legend-severity .medium { background: #eab308; }
    .legend-severity .low { background: #22c55e; }
    .details-panel { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 14px; border: 1px solid var(--border-color, #374151); }
    .details-title { font-size: 14px; font-weight: 600; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .details-content { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; font-size: 12px; }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .detail-label { color: var(--text-tertiary, #94a3b8); font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .detail-value { line-height: 1.4; }
    .mitre-id { font-family: monospace; background: var(--bg-tertiary, #0a0e17); padding: 2px 6px; border-radius: 3px; }
    .coverage-badge { padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; display: inline-block; }
    .coverage-badge.full { background: #14532d; color: #86efac; }
    .coverage-badge.partial { background: #422006; color: #fde047; }
    .coverage-badge.none { background: #450a0a; color: #fca5a5; }
    .gap-item { background: var(--bg-tertiary, #0a0e17); padding: 6px 10px; border-radius: 4px; margin-top: 8px; font-size: 11px; }
    .gap-header { font-weight: 600; margin-bottom: 4px; color: #f97316; }
    .gap-recommendation { color: var(--text-secondary, #cbd5e1); margin-top: 2px; }
    .priority-badge { padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; display: inline-block; }
    .priority-badge.high { background: #450a0a; color: #fca5a5; }
    .priority-badge.medium { background: #422006; color: #fde047; }
    .priority-badge.low { background: #052e16; color: #86efac; }

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

  @state() private _selectedTechnique: Technique | null = null;
  @state() private _viewMode: 'coverage' | 'detections' = 'coverage';

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


  private _tactics: Tactic[] = [
    { id: 'reconnaissance', name: 'Reconnaissance', order: 1, color: '#7c3aed' },
    { id: 'resource-development', name: 'Resource\nDevelopment', order: 2, color: '#6d28d9' },
    { id: 'initial-access', name: 'Initial\nAccess', order: 3, color: '#ef4444' },
    { id: 'execution', name: 'Execution', order: 4, color: '#f97316' },
    { id: 'persistence', name: 'Persistence', order: 5, color: '#ea580c' },
    { id: 'privilege-escalation', name: 'Privilege\nEscalation', order: 6, color: '#d97706' },
    { id: 'defense-evasion', name: 'Defense\nEvasion', order: 7, color: '#eab308' },
    { id: 'credential-access', name: 'Credential\nAccess', order: 8, color: '#a3e635' },
    { id: 'discovery', name: 'Discovery', order: 9, color: '#84cc16' },
    { id: 'lateral-movement', name: 'Lateral\nMovement', order: 10, color: '#22c55e' },
    { id: 'collection', name: 'Collection', order: 11, color: '#06b6d4' },
    { id: 'command-and-control', name: 'C2', order: 12, color: '#3b82f6' },
    { id: 'exfiltration', name: 'Exfiltration', order: 13, color: '#8b5cf6' },
    { id: 'impact', name: 'Impact', order: 14, color: '#ec4899' },
  ];

  private _techniques: Technique[] = [
    // Initial Access
    { id: 'T1566', name: 'Phishing', tactic: 'initial-access', coverage: 'partial', detections: 12, detectionsLast30Days: 8, severity: 'critical', cveCount: 0 },
    { id: 'T1190', name: 'Exploit Public-Facing App', tactic: 'initial-access', coverage: 'none', detections: 0, detectionsLast30Days: 3, severity: 'critical', cveCount: 5 },
    { id: 'T1078', name: 'Valid Accounts', tactic: 'initial-access', coverage: 'full', detections: 24, detectionsLast30Days: 15, severity: 'high', cveCount: 0 },
    { id: 'T1091', name: 'Replication Through Removable Media', tactic: 'initial-access', coverage: 'none', detections: 0, detectionsLast30Days: 0, severity: 'medium', cveCount: 0 },
    // Execution
    { id: 'T1059', name: 'Command & Scripting Interpreter', tactic: 'execution', coverage: 'full', detections: 86, detectionsLast30Days: 42, severity: 'high', cveCount: 0 },
    { id: 'T1204', name: 'User Execution', tactic: 'execution', coverage: 'partial', detections: 18, detectionsLast30Days: 12, severity: 'high', cveCount: 0 },
    { id: 'T1047', name: 'Windows Management Instrumentation', tactic: 'execution', coverage: 'partial', detections: 15, detectionsLast30Days: 9, severity: 'high', cveCount: 0 },
    { id: 'T1559', name: 'Exploitation for Client Execution', tactic: 'execution', coverage: 'none', detections: 0, detectionsLast30Days: 2, severity: 'critical', cveCount: 3 },
    // Persistence
    { id: 'T1547', name: 'Boot or Logon Autostart Execution', tactic: 'persistence', coverage: 'partial', detections: 12, detectionsLast30Days: 5, severity: 'high', cveCount: 0 },
    { id: 'T1546', name: 'Event Triggered Execution', tactic: 'persistence', coverage: 'none', detections: 0, detectionsLast30Days: 1, severity: 'high', cveCount: 0 },
    { id: 'T1136', name: 'Create Account', tactic: 'persistence', coverage: 'full', detections: 32, detectionsLast30Days: 18, severity: 'medium', cveCount: 0 },
    { id: 'T1078.004', name: 'Create Local Account', tactic: 'persistence', coverage: 'full', detections: 18, detectionsLast30Days: 10, severity: 'medium', cveCount: 0 },
    // Privilege Escalation
    { id: 'T1068', name: 'Exploitation for Privilege Escalation', tactic: 'privilege-escalation', coverage: 'partial', detections: 8, detectionsLast30Days: 3, severity: 'critical', cveCount: 7 },
    { id: 'T1548', name: 'Abuse Elevation Control Mechanism', tactic: 'privilege-escalation', coverage: 'none', detections: 0, detectionsLast30Days: 0, severity: 'high', cveCount: 0 },
    { id: 'T1055', name: 'Process Injection', tactic: 'privilege-escalation', coverage: 'partial', detections: 10, detectionsLast30Days: 6, severity: 'high', cveCount: 0 },
    // Defense Evasion
    { id: 'T1070', name: 'Indicator Removal on Host', tactic: 'defense-evasion', coverage: 'none', detections: 0, detectionsLast30Days: 2, severity: 'high', cveCount: 0 },
    { id: 'T1027', name: 'Obfuscated Files or Information', tactic: 'defense-evasion', coverage: 'partial', detections: 22, detectionsLast30Days: 15, severity: 'medium', cveCount: 0 },
    { id: 'T1564', name: 'Hide Artifacts', tactic: 'defense-evasion', coverage: 'none', detections: 0, detectionsLast30Days: 0, severity: 'medium', cveCount: 0 },
    { id: 'T1553', name: 'Subvert Trust Controls', tactic: 'defense-evasion', coverage: 'partial', detections: 14, detectionsLast30Days: 8, severity: 'high', cveCount: 0 },
    // Credential Access
    { id: 'T1003', name: 'OS Credential Dumping', tactic: 'credential-access', coverage: 'full', detections: 46, detectionsLast30Days: 28, severity: 'critical', cveCount: 0 },
    { id: 'T1555', name: 'Credentials from Password Stores', tactic: 'credential-access', coverage: 'partial', detections: 18, detectionsLast30Days: 12, severity: 'high', cveCount: 0 },
    { id: 'T1556', name: 'Input Capture', tactic: 'credential-access', coverage: 'none', detections: 0, detectionsLast30Days: 0, severity: 'high', cveCount: 0 },
    { id: 'T1111', name: 'Two-Factor Authentication Interception', tactic: 'credential-access', coverage: 'none', detections: 0, detectionsLast30Days: 0, severity: 'critical', cveCount: 0 },
    // Lateral Movement
    { id: 'T1021', name: 'Remote Services', tactic: 'lateral-movement', coverage: 'full', detections: 38, detectionsLast30Days: 22, severity: 'high', cveCount: 0 },
    { id: 'T1021.001', name: 'Remote Desktop Protocol', tactic: 'lateral-movement', coverage: 'full', detections: 24, detectionsLast30Days: 16, severity: 'critical', cveCount: 0 },
    { id: 'T1077', name: 'Windows Admin Shares', tactic: 'lateral-movement', coverage: 'partial', detections: 12, detectionsLast30Days: 7, severity: 'high', cveCount: 0 },
    { id: 'T1550', name: 'Use Alternate Authentication Material', tactic: 'lateral-movement', coverage: 'none', detections: 0, detectionsLast30Days: 1, severity: 'critical', cveCount: 0 },
    // Command and Control
    { id: 'T1071', name: 'Application Layer Protocol', tactic: 'command-and-control', coverage: 'partial', detections: 52, detectionsLast30Days: 32, severity: 'high', cveCount: 0 },
    { id: 'T1573', name: 'Encrypted Channel', tactic: 'command-and-control', coverage: 'partial', detections: 24, detectionsLast30Days: 14, severity: 'medium', cveCount: 0 },
    { id: 'T1090', name: 'Proxy', tactic: 'command-and-control', coverage: 'none', detections: 0, detectionsLast30Days: 2, severity: 'high', cveCount: 0 },
    { id: 'T1568', name: 'Dynamic Resolution', tactic: 'command-and-control', coverage: 'none', detections: 0, detectionsLast30Days: 0, severity: 'medium', cveCount: 0 },
    // Exfiltration
    { id: 'T1048', name: 'Exfiltration Over Alternative Protocol', tactic: 'exfiltration', coverage: 'partial', detections: 14, detectionsLast30Days: 9, severity: 'critical', cveCount: 0 },
    { id: 'T1052', name: 'Exfiltration Over Physical Medium', tactic: 'exfiltration', coverage: 'none', detections: 0, detectionsLast30Days: 0, severity: 'medium', cveCount: 0 },
    { id: 'T1567', name: 'Exfiltration Over Web Service', tactic: 'exfiltration', coverage: 'none', detections: 0, detectionsLast30Days: 1, severity: 'high', cveCount: 0 },
    // Impact
    { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'impact', coverage: 'full', detections: 18, detectionsLast30Days: 12, severity: 'critical', cveCount: 0 },
    { id: 'T1490', name: 'Inhibit System Recovery', tactic: 'impact', coverage: 'partial', detections: 8, detectionsLast30Days: 5, severity: 'high', cveCount: 0 },
    { id: 'T1498', name: 'Network Denial of Service', tactic: 'impact', coverage: 'full', detections: 32, detectionsLast30Days: 18, severity: 'medium', cveCount: 0 },
    { id: 'T1565', name: 'Data Manipulation', tactic: 'impact', coverage: 'none', detections: 0, detectionsLast30Days: 0, severity: 'high', cveCount: 0 },
  ];

  private _getTechniquesByTactic(tacticId: string): Technique[] {
    return this._techniques.filter(t => t.tactic === tacticId).sort((a, b) => b.detectionsLast30Days - a.detectionsLast30Days);
  }

  private _getHeatColor(t: Technique): string {
    if (this._viewMode === 'coverage') {
      if (t.coverage === 'full') return '#14532d';
      if (t.coverage === 'partial') return '#422006';
      return '#450a0a';
    } else {
      // Detections based heat
      const max = Math.max(...this._techniques.map(t => t.detectionsLast30Days));
      const ratio = t.detectionsLast30Days / max;
      if (ratio > 0.7) return '#450a0a';
      if (ratio > 0.3) return '#422006';
      return '#14532d';
    }
  }

  private _getBorderColor(t: Technique): string {
    switch (t.severity) {
      case 'critical': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#374151';
    }
  }

  private _getCoverageStats() {
    const total = this._techniques.length;
    const full = this._techniques.filter(t => t.coverage === 'full').length;
    const partial = this._techniques.filter(t => t.coverage === 'partial').length;
    const none = total - full - partial;
    const coverageRate = Math.round((full + partial * 0.5) / total * 100);
    return { total, full, partial, none, coverageRate };
  }

  private _getDetectedTechniquesCount(): number {
    return this._techniques.filter(t => t.detectionsLast30Days > 0).length;
  }

  private _getTopGapTechniques(): Technique[] {
    return this._techniques.filter(t => t.coverage === 'none' && t.severity === 'critical' || t.severity === 'high')
      .sort((a, b) => b.severity.localeCompare(a.severity))
      .slice(0, 3);
  }

  private _getRecommendationForTechnique(t: Technique): string {
    if (t.coverage === 'full') return 'Monitor detection efficacy, tune false positive rate, keep rules up to date';
    if (t.coverage === 'partial') return 'Add additional detection rules, cover more variations, implement correlation analysis';
    return 'Implement dedicated detection rules, deploy deception techniques, perform red team testing to verify coverage';
  }

  private _getPriorityForTechnique(t: Technique): 'high' | 'medium' | 'low' {
    if (t.severity === 'critical' && t.coverage === 'none') return 'high';
    if (t.severity === 'high' && t.coverage === 'none') return 'high';
    if (t.severity === 'critical' && t.coverage === 'partial') return 'high';
    if (t.severity === 'high' && t.coverage === 'partial') return 'medium';
    return 'low';
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
    const blob = new Blob(['mitre-attack-heatmap export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mitre-attack-heatmap-export.' + (format === 'markdown' ? 'md' : format); a.click();
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
    const stats = this._getCoverageStats();
    const detectedCount = this._getDetectedTechniquesCount();
    const topGaps = this._getTopGapTechniques();

    return html`
      <div class="panel">
        <div class="pt">
          🎯 MITRE ATT&CK Heatmap
          <span class="coverage-badge ${stats.coverageRate >= 70 ? 'full' : stats.coverageRate >= 40 ? 'partial' : 'none'}">
            Coverage: ${stats.coverageRate}%
          </span>
        </div>

        <div class="controls">
          <div class="stats">
            <div class="stat">
              <div class="sv full">${stats.full}</div>
              <div class="sl">Full Coverage</div>
            </div>
            <div class="stat">
              <div class="sv partial">${stats.partial}</div>
              <div class="sl">Partial Coverage</div>
            </div>
            <div class="stat">
              <div class="sv none">${stats.none}</div>
              <div class="sl">No Coverage</div>
            </div>
            <div class="stat">
              <div class="sv">${detectedCount}</div>
              <div class="sl">Active Detections (30d)</div>
            </div>
          </div>
          <div class="controls-right">
            <button class="btn ${this._viewMode === 'coverage' ? 'active' : ''}" @click=${() => this._viewMode = 'coverage'}>
              Coverage View
            </button>
            <button class="btn ${this._viewMode === 'detections' ? 'active' : ''}" @click=${() => this._viewMode = 'detections'}>
              Detections View
            </button>
            <button class="btn" @click=${() => this._selectedTechnique = null}>Clear Selection</button>
          </div>
        </div>

        <div class="heatmap-container">
          <div class="heatmap">
            ${this._tactics.sort((a, b) => a.order - b.order).map(tactic => {
              const techniques = this._getTechniquesByTactic(tactic.id);
              return html`
                <div class="tactic-column">
                  <div class="tactic-header" style="background: ${tactic.color}">
                    ${tactic.name.split('\n').map(line => html`<div>${line}</div>`)}
                  </div>
                  <div class="techniques-list">
                    ${techniques.map(tech => html`
                      <div 
                        class="technique-cell ${tech.coverage}"
                        style="background: ${this._getHeatColor(tech)}; border-color: ${this._getBorderColor(tech)};"
                        @click=${() => this._selectedTechnique = this._selectedTechnique?.id === tech.id ? null : tech}
                      >
                        ${tech.name}
                        ${this._viewMode === 'detections' ? html`
                          <span class="detection-badge">${tech.detectionsLast30Days}</span>
                        ` : nothing}
                      </div>
                    `)}
                  </div>
                </div>
              `
            })}
          </div>
        </div>

        <div class="legend">
          <div class="legend-group">
            <div class="legend-item">
              <span class="legend-color full"></span> Full Coverage
            </div>
            <div class="legend-item">
              <span class="legend-color partial"></span> Partial Coverage
            </div>
            <div class="legend-item">
              <span class="legend-color none"></span> No Coverage
            </div>
          </div>
          <div class="legend-severity">
            <div class="legend-item">
              <span class="legend-color critical"></span> Critical
            </div>
            <div class="legend-item">
              <span class="legend-color high"></span> High
            </div>
            <div class="legend-item">
              <span class="legend-color medium"></span> Medium
            </div>
            <div class="legend-item">
              <span class="legend-color low"></span> Low
            </div>
          </div>
          <div style="color: var(--text-tertiary, #94a3b8); font-size: 11px; margin-left: 16px;">
            💡 Click technique for details | ${topGaps.length} critical gaps found
          </div>
        </div>

        ${this._selectedTechnique ? html`
          <div class="details-panel">
            <div class="details-title">
              <span class="mitre-id">${this._selectedTechnique.id}</span> ${this._selectedTechnique.name}
              <span class="coverage-badge ${this._selectedTechnique.coverage}">${this._selectedTechnique.coverage.toUpperCase()}</span>
              <span class="priority-badge ${this._getPriorityForTechnique(this._selectedTechnique)}">
                Priority: ${this._getPriorityForTechnique(this._selectedTechnique).toUpperCase()}
              </span>
            </div>
            <div class="details-content">
              <div class="detail-item">
                <span class="detail-label">Tactic</span>
                <span class="detail-value">${this._tactics.find(t => t.id === this._selectedTechnique.tactic)?.name}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Severity</span>
                <span class="detail-value">${this._selectedTechnique.severity.toUpperCase()}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Detections (30 days)</span>
                <span class="detail-value">${this._selectedTechnique.detectionsLast30Days} attacks detected</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">CVEs Associated</span>
                <span class="detail-value">${this._selectedTechnique.cveCount ?? 0} known CVEs exploiting this technique</span>
              </div>
              <div class="detail-item" style="grid-column: 1 / -1;">
                <span class="detail-label">Recommendation</span>
                <span class="detail-value">${this._getRecommendationForTechnique(this._selectedTechnique)}</span>
              </div>
            </div>
          </div>
        ` : topGaps.length > 0 ? html`
          <div class="details-panel">
            <div class="details-title" style="color: #f97316;">⚠️ Critical Detection Gaps</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${topGaps.map(gap => html`
                <div class="gap-item">
                  <div class="gap-header">
                    <span class="mitre-id">${gap.id}</span> ${gap.name} 
                    <span class="priority-badge high">${gap.severity.toUpperCase()} PRIORITY</span>
                  </div>
                  <div class="gap-recommendation">Recommendation: ${this._getRecommendationForTechnique(gap)}</div>
                </div>
              `)}
              <div style="color: var(--text-secondary, #cbd5e1); font-size: 12px; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color, #374151);">
                💡 Closing these ${topGaps.length} gaps will improve overall coverage by ${Math.round(topGaps.length / stats.none * 100)}%
              </div>
            </div>
          </div>
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

declare global { interface HTMLElementTagNameMap { 'sc-mitre-attack-heatmap': ScMitreAttackHeatmap; } }
