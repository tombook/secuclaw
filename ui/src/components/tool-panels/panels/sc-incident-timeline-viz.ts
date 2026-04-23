/**
 * sc-incident-timeline-viz — Incident Timeline Visualization
 * Interactive timeline with event correlation and forensic analysis
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  type: 'detection' | 'alert' | 'investigation' | 'containment' | 'remediation' | 'escalation' | 'communication';
  severity: 'critical' | 'high' | 'medium' | 'low';
  analyst: string;
  duration: string;
  description: string;
  iocs: string[];
}

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  startTime: string;
  dwellTime: string;
  events: TimelineEvent[];
}

@customElement('sc-incident-timeline-viz')
export class ScIncidentTimelineViz extends LitElement {
  private _RISK_COLORS: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };

  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .incident-select { width: 100%; padding: 10px 12px; background: #1f2937; border: 1px solid #374151; border-radius: 6px; color: #e2e8f0; font-size: 13px; outline: none; margin-bottom: 16px; }
    .incident-select:focus { border-color: #f59e0b; }
    .incident-header { background: #1f2937; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .incident-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
    .incident-meta { display: flex; gap: 20px; font-size: 12px; color: #94a3b8; }
    .badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; margin-left: 8px; }
    .b-critical { background: #450a0a; color: #fca5a5; }
    .b-high { background: #431407; color: #fdba74; }
    .b-medium { background: #422006; color: #fde047; }
    .b-low { background: #052e16; color: #86efac; }
    .b-open { background: #450a0a; color: #fca5a5; }
    .b-contained { background: #422006; color: #fde047; }
    .b-resolved { background: #052e16; color: #86efac; }
    .timeline { position: relative; padding-left: 30px; }
    .timeline::before { content: ''; position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background: #374151; }
    .event { position: relative; margin-bottom: 16px; }
    .event-dot { position: absolute; left: -24px; top: 4px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #111827; }
    .event.detection .event-dot { background: #ef4444; }
    .event.alert .event-dot { background: #f97316; }
    .event.investigation .event-dot { background: #3b82f6; }
    .event.containment .event-dot { background: #f59e0b; }
    .event.remediation .event-dot { background: #22c55e; }
    .event.escalation .event-dot { background: #7c3aed; }
    .event.communication .event-dot { background: #06b6d4; }
    .event-card { background: #1f2937; border-radius: 8px; padding: 12px; margin-left: 10px; }
    .event-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .event-title { font-weight: 600; font-size: 13px; }
    .event-time { font-size: 11px; color: #6b7280; }
    .event-duration { font-size: 10px; color: #94a3b8; background: #0f172a; padding: 2px 6px; border-radius: 3px; }
    .event-desc { font-size: 12px; color: #94a3b8; margin: 8px 0; line-height: 1.5; }
    .event-analyst { font-size: 11px; color: #6b7280; margin-bottom: 6px; }
    .ioc-tag { font-size: 9px; background: #7f1d1d; color: #fca5a5; padding: 2px 6px; border-radius: 3px; margin: 2px; display: inline-block; }
    .dwell-time { background: #1f2937; border-radius: 8px; padding: 14px; margin-bottom: 16px; display: flex; gap: 20px; }
    .dwell-stat { text-align: center; }
    .dwell-value { font-size: 24px; font-weight: 700; }
    .dwell-label { font-size: 10px; color: #94a3b8; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; color: #94a3b8; }
    .tab:hover { background: #374151; }
    .tab.active { background: #f59e0b; color: #111827; }
    .heatmap { display: grid; grid-template-columns: repeat(24, 1fr); gap: 2px; margin-top: 12px; }
    .heatmap-cell { aspect-ratio: 1; border-radius: 2px; }
    .lesson-row { background: #0f172a; border-radius: 6px; padding: 10px; margin-bottom: 6px; border-left: 3px solid; }
    .lesson-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .lesson-title { font-weight: 600; font-size: 12px; }
    .lesson-meta { font-size: 10px; color: #6b7280; margin-top: 4px; }
    .comm-row { display: flex; gap: 10px; padding: 8px 10px; background: #0f172a; border-radius: 6px; margin-bottom: 4px; font-size: 11px; }
    .comm-channel { padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; }
    .cost-row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: #0f172a; border-radius: 6px; margin-bottom: 4px; font-size: 11px; }
    .cost-bar { flex: 1; height: 8px; background: #374151; border-radius: 4px; overflow: hidden; }
    .cost-fill { height: 100%; border-radius: 4px; }
    .afr-section { background: #1f2937; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .afr-title { font-weight: 700; font-size: 14px; margin-bottom: 10px; }
    .afr-field { margin-bottom: 10px; }
    .afr-label { font-size: 10px; color: #6b7280; text-transform: uppercase; margin-bottom: 4px; }
    .afr-value { font-size: 12px; color: #e2e8f0; line-height: 1.6; }
    .severity-timeline { display: flex; gap: 2px; height: 24px; border-radius: 4px; overflow: hidden; margin: 10px 0; }
    .severity-seg { height: 100%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 600; }
    .notification { position: fixed; top: 20px; right: 20px; background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 12px 16px; font-size: 12px; z-index: 10000; animation: slideInNotif 0.3s ease; max-width: 320px; border-left: 4px solid #22c55e; }
    @keyframes slideInNotif { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .btn { padding: 6px 14px; border-radius: 6px; border: none; font-size: 11px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #f59e0b; color: #111827; }
    .btn-secondary { background: #374151; color: #e2e8f0; }
    .form-input { width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #374151; border-radius: 6px; color: #e2e8f0; font-size: 12px; outline: none; }
    .form-input:focus { border-color: #f59e0b; }
    .form-label { display: block; font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 4px; }
    .form-group { margin-bottom: 10px; }
    .progress-bar { height: 8px; background: #374151; border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; }
  `;

  @state() private _selectedIncident = 'inc1';
  @state() private _tab: 'timeline' | 'impact' | 'evidence' | 'lessons' | 'comms' | 'costs' | 'report' | 'history' | 'audit' | 'settings' | 'analytics' = 'timeline';
  @state() private _notifications: Array<{id: string; message: string; timestamp: number}> = [];
  @state() private _aafComment = '';
  @state() private _execHistory: ReportExecRecord[] = [];
  @state() private _execRunning = false;
  @state() private _execProgress = 0;
  @state() private _showSettings = false;
  @state() private _settingsTab: 'general' | 'thresholds' | 'integrations' = 'general';
  @state() private _mttdThreshold = 15;
  @state() private _mttcThreshold = 240;
  @state() private _escalationEmail = '';
  @state() private _webhookUrl = '';
  @state() private _auditTrail: AuditTrailEntry[] = [];
  @state() private _auditFilter = 'all';
  @state() private _comments: TimelineComment[] = [];
  @state() private _newComment = '';
  @state() private _tableSort = 'timestamp';
  @state() private _tableSortDir: 'asc' | 'desc' = 'desc';
  @state() private _tablePage = 0;
  @state() private _tablePageSize = 10;
  @state() private _selectedRows: Set<string> = new Set();
  @state() private _filterType = 'all';
  @state() private _filterSeverity = 'all';
  @state() private _showInsightsPanel = false;
  @state() private _showGeoMap = false;
  @state() private _showResponseMetrics = false;
  @state() private _insightTab = 'auto' | 'sla' | 'correlation' | 'response' = 'auto';

  // --- SLA Breach Prediction ---
  private _incidentMetrics = [
    { id: 'm1', incident: 'Ransomware Finance Dept', mtdMinutes: 12, mtcMinutes: 251, mttrMinutes: 135, slaMtd: 15, slaMtc: 240, slaMttr: 480, severity: 'critical', date: '2026-04-21' },
    { id: 'm2', incident: 'Phishing Campaign', mtdMinutes: 45, mtcMinutes: 180, mttrMinutes: 90, slaMtd: 30, slaMtc: 240, slaMttr: 360, severity: 'high', date: '2026-04-18' },
    { id: 'm3', incident: 'Insider Threat Alert', mtdMinutes: 8, mtcMinutes: 60, mttrMinutes: 120, slaMtd: 15, slaMtc: 120, slaMttr: 240, severity: 'high', date: '2026-04-15' },
    { id: 'm4', incident: 'DDoS Attack', mtdMinutes: 3, mtcMinutes: 30, mttrMinutes: 45, slaMtd: 5, slaMtc: 60, slaMttr: 120, severity: 'critical', date: '2026-04-12' },
    { id: 'm5', incident: 'Data Exfiltration Attempt', mtdMinutes: 120, mtcMinutes: 480, mttrMinutes: 300, slaMtd: 60, slaMtc: 360, slaMttr: 720, severity: 'critical', date: '2026-04-08' },
    { id: 'm6', incident: 'Malware Outbreak', mtdMinutes: 25, mtcMinutes: 200, mttrMinutes: 180, slaMtd: 15, slaMtc: 240, slaMttr: 480, severity: 'high', date: '2026-04-05' },
  ];

  // --- MITRE ATT&CK Correlation Engine ---
  private _mitreTechniques = [
    { id: 'T1566.001', name: 'Spearphishing Link', tactic: 'Initial Access', confidence: 95, incidents: ['inc1'], related: ['T1189', 'T1078'] },
    { id: 'T1078.002', name: 'Domain Account', tactic: 'Initial Access', confidence: 88, incidents: ['inc1'], related: ['T1003', 'T1021'] },
    { id: 'T1003.001', name: 'LSASS Memory', tactic: 'Credential Access', confidence: 92, incidents: ['inc1'], related: ['T1078', 'T1558'] },
    { id: 'T1021.002', name: 'SMB/Windows Admin Shares', tactic: 'Lateral Movement', confidence: 85, incidents: ['inc1'], related: ['T1003', 'T1570'] },
    { id: 'T1486', name: 'Data Encrypted for Impact', tactic: 'Impact', confidence: 98, incidents: ['inc1'], related: ['T1489', 'T1490'] },
    { id: 'T1490', name: 'Inhibit System Recovery', tactic: 'Impact', confidence: 90, incidents: ['inc1'], related: ['T1486', 'T1489'] },
    { id: 'T1070.004', name: 'File Deletion', tactic: 'Defense Evasion', confidence: 75, incidents: ['inc1'], related: ['T1562', 'T1070'] },
    { id: 'T1059.001', name: 'PowerShell', tactic: 'Execution', confidence: 80, incidents: ['inc1'], related: ['T1059.003', 'T1564'] },
    { id: 'T1083', name: 'File Discovery', tactic: 'Discovery', confidence: 70, incidents: ['inc1'], related: ['T1082', 'T1046'] },
    { id: 'T1048', name: 'Exfiltration Over Alt Protocol', tactic: 'Exfiltration', confidence: 65, incidents: ['inc1'], related: ['T1041', 'T1567'] },
  ];

  // --- Automated Insights ---
  private _generateInsights(): { id: string; type: 'warning' | 'positive' | 'trend' | 'recommendation'; icon: string; title: string; description: string; metric: string }[] {
    const insights: { id: string; type: 'warning' | 'positive' | 'trend' | 'recommendation'; icon: string; title: string; description: string; metric: string }[] = [];
    // SLA breach analysis
    const breaches = this._incidentMetrics.filter(m => m.mtdMinutes > m.slaMtd || m.mtcMinutes > m.slaMtc);
    if (breaches.length > 0) {
      insights.push({ id: 'ins-1', type: 'warning', icon: '⚠️', title: 'SLA Breaches Detected', description: `${breaches.length} of ${this._incidentMetrics.length} incidents exceeded at least one SLA threshold. Primary area: MTD (Mean Time to Detect).`, metric: `${Math.round((breaches.length / this._incidentMetrics.length) * 100)}% breach rate` });
    }
    // Average metrics
    const avgMtd = Math.round(this._incidentMetrics.reduce((s, m) => s + m.mtdMinutes, 0) / this._incidentMetrics.length);
    const avgMtc = Math.round(this._incidentMetrics.reduce((s, m) => s + m.mtcMinutes, 0) / this._incidentMetrics.length);
    const avgMttr = Math.round(this._incidentMetrics.reduce((s, m) => s + m.mttrMinutes, 0) / this._incidentMetrics.length);
    insights.push({ id: 'ins-2', type: 'trend', icon: '📊', title: 'Average Response Metrics', description: `MTD: ${avgMtd}m | MTC: ${avgMtc}m | MTTR: ${avgMttr}m. ${avgMtd > 30 ? 'Detection times are above industry benchmark (15m).' : 'Detection times are within acceptable range.'}`, metric: `MTD ${avgMtd}m` });
    // Top technique
    const topTech = this._mitreTechniques.reduce((a, b) => a.confidence > b.confidence ? a : b);
    insights.push({ id: 'ins-3', type: 'warning', icon: '🎯', title: 'Highest Confidence Technique', description: `${topTech.name} (${topTech.id}) in ${topTech.tactic} with ${topTech.confidence}% confidence. This technique should be prioritized for detection rule tuning.`, metric: `${topTech.confidence}%` });
    // Positive trend
    const recent3 = this._incidentMetrics.slice(0, 3);
    const older3 = this._incidentMetrics.slice(3);
    const recentAvgMtd = recent3.reduce((s, m) => s + m.mtdMinutes, 0) / recent3.length;
    const olderAvgMtd = older3.length ? older3.reduce((s, m) => s + m.mtdMinutes, 0) / older3.length : recentAvgMtd;
    if (recentAvgMtd < olderAvgMtd) {
      insights.push({ id: 'ins-4', type: 'positive', icon: '✅', title: 'Detection Time Improving', description: `Average MTD improved from ${Math.round(olderAvgMtd)}m to ${Math.round(recentAvgMtd)}m (-${Math.round(((olderAvgMtd - recentAvgMtd) / olderAvgMtd) * 100)}%) in the last 3 incidents.`, metric: '-22% MTD' });
    }
    // Technique cluster
    const tacticCounts: Record<string, number> = {};
    this._mitreTechniques.forEach(t => { tacticCounts[t.tactic] = (tacticCounts[t.tactic] || 0) + 1; });
    const topTactic = Object.entries(tacticCounts).sort((a, b) => b[1] - a[1])[0];
    insights.push({ id: 'ins-5', type: 'recommendation', icon: '💡', title: 'Technique Cluster Detected', description: `${topTactic[1]} techniques mapped to "${topTactic[0]}" tactic. Consider investing in detection coverage for this kill chain stage.`, metric: `${topTactic[1]} techniques` });
    return insights;
  }

  // --- SLA Breach Prediction ---
  private _predictSLABreach(currentMinutes: number, slaMinutes: number, elapsedMinutes: number): { willBreach: boolean; estimatedBreachTime: string; confidence: number; riskLevel: string } {
    if (currentMinutes >= slaMinutes) return { willBreach: false, estimatedBreachTime: 'Already breached', confidence: 100, riskLevel: 'breached' };
    const remaining = slaMinutes - currentMinutes;
    const avgRate = currentMinutes / Math.max(1, elapsedMinutes);
    const projectedTotal = currentMinutes + avgRate * remaining;
    const willBreach = projectedTotal > slaMinutes * 1.2;
    const confidence = Math.min(98, Math.round((currentMinutes / slaMinutes) * 100));
    const riskLevel = confidence >= 80 ? 'critical' : confidence >= 60 ? 'high' : confidence >= 40 ? 'medium' : 'low';
    const breachTime = willBreach ? `~${Math.round((slaMinutes - currentMinutes) * 0.8)}m remaining` : `Within SLA (${remaining}m left)`;
    return { willBreach, estimatedBreachTime: breachTime, confidence, riskLevel };
  }

  private _renderSLAPrediction(): any {
    const incident = this._incidents.find(i => i.id === this._selectedIncident);
    if (!incident) return nothing;
    const metrics = this._incidentMetrics[0];
    const mtdPrediction = this._predictSLABreach(metrics.mtdMinutes, metrics.slaMtd, metrics.mtdMinutes);
    const mtcPrediction = this._predictSLABreach(metrics.mtcMinutes, metrics.slaMtc, metrics.mtcMinutes);
    const mttrPrediction = this._predictSLABreach(metrics.mttrMinutes, metrics.slaMttr, metrics.mttrMinutes);
    const riskColors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e', breached: '#ef4444' };

    return html`<div style="background:#0f172a;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">SLA Breach Prediction</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
        ${[
          { label: 'MTD', current: metrics.mtdMinutes, sla: metrics.slaMtd, pred: mtdPrediction },
          { label: 'MTC', current: metrics.mtcMinutes, sla: metrics.slaMtc, pred: mtcPrediction },
          { label: 'MTTR', current: metrics.mttrMinutes, sla: metrics.slaMttr, pred: mttrPrediction },
        ].map(s => html`<div style="background:#1f2937;border-radius:8px;padding:12px;border-top:3px solid ${riskColors[s.pred.riskLevel]}">
          <div style="font-size:11px;font-weight:700;margin-bottom:6px">${s.label}</div>
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:4px">
            <span style="color:#94a3b8">Current</span><span style="font-weight:700">${s.current}m</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:4px">
            <span style="color:#94a3b8">SLA</span><span>${s.sla}m</span>
          </div>
          <div style="height:6px;background:#374151;border-radius:3px;overflow:hidden;margin-bottom:4px">
            <div style="width:${Math.min(100, (s.current / s.sla) * 100)}%;height:100%;background:${riskColors[s.pred.riskLevel]};border-radius:3px"></div>
          </div>
          <div style="font-size:9px;color:${riskColors[s.pred.riskLevel]};font-weight:600">${s.pred.estimatedBreachTime}</div>
          <div style="font-size:9px;color:#6b7280">Confidence: ${s.pred.confidence}%</div>
        </div>`)}
      </div>
      <div style="font-size:11px;font-weight:600;margin-bottom:8px">Historical SLA Performance</div>
      <svg viewBox="0 0 500 120" width="100%" style="max-width:500px">
        ${this._incidentMetrics.map((m, i) => {
          const x = 60 + i * 70;
          const mtdRatio = Math.min(1, m.mtdMinutes / m.slaMtd);
          const mtcRatio = Math.min(1, m.mtcMinutes / m.slaMtc);
          return html`<g>
            <line x1="${x}" y1="10" x2="${x}" y2="100" stroke="#1f2937" stroke-width="0.5"/>
            <rect x="${x - 12}" y="${10 + (1 - mtdRatio) * 40}" width="10" height="${mtdRatio * 40}" fill="${mtdRatio > 1 ? '#ef4444' : mtdRatio > 0.8 ? '#f97316' : '#22c55e'}" rx="2"/>
            <rect x="${x}" y="${10 + (1 - mtcRatio) * 40}" width="10" height="${mtcRatio * 40}" fill="${mtcRatio > 1 ? '#ef4444' : mtcRatio > 0.8 ? '#f97316' : '#22c55e'}" rx="2"/>
            <text x="${x - 2}" y="62" text-anchor="middle" fill="#6b7280" font-size="6">${m.date.slice(5)}</text>
          </g>`;
        })}
        <line x1="55" y1="50" x2="500" y2="50" stroke="#f59e0b" stroke-width="0.5" stroke-dasharray="3,2"/>
        <text x="50" y="53" text-anchor="end" fill="#f59e0b" font-size="7">SLA</text>
        <text x="30" y="25" text-anchor="end" fill="#6b7280" font-size="7">MTD</text>
        <text x="30" y="55" text-anchor="end" fill="#6b7280" font-size="7">MTC</text>
      </svg>
    </div>`;
  }

  // --- MITRE ATT&CK Correlation ---
  private _renderMitreCorrelation(): any {
    const tacticGroups: Record<string, typeof this._mitreTechniques> = {};
    this._mitreTechniques.forEach(t => {
      if (!tacticGroups[t.tactic]) tacticGroups[t.tactic] = [];
      tacticGroups[t.tactic].push(t);
    });
    const tacticColors: Record<string, string> = {
      'Initial Access': '#ef4444', 'Execution': '#f97316', 'Persistence': '#eab308',
      'Privilege Escalation': '#22c55e', 'Defense Evasion': '#3b82f6', 'Credential Access': '#8b5cf6',
      'Discovery': '#06b6d4', 'Lateral Movement': '#ec4899', 'Collection': '#f59e0b',
      'C2': '#14b8a6', 'Exfiltration': '#a855f7', 'Impact': '#dc2626'
    };

    return html`<div style="background:#0f172a;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">MITRE ATT&CK Technique Correlation</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:12px">
        <div style="background:#1f2937;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#ef4444">${this._mitreTechniques.length}</div>
          <div style="font-size:9px;color:#6b7280">Mapped Techniques</div>
        </div>
        <div style="background:#1f2937;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#f59e0b">${Object.keys(tacticGroups).length}</div>
          <div style="font-size:9px;color:#6b7280">Tactics Covered</div>
        </div>
        <div style="background:#1f2937;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#22c55e">${Math.round(this._mitreTechniques.reduce((s, t) => s + t.confidence, 0) / this._mitreTechniques.length)}%</div>
          <div style="font-size:9px;color:#6b7280">Avg Confidence</div>
        </div>
      </div>
      <div style="max-height:250px;overflow-y:auto">
        ${Object.entries(tacticGroups).map(([tactic, techs]) => html`<div style="margin-bottom:8px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <div style="width:8px;height:8px;border-radius:2px;background:${tacticColors[tactic] || '#94a3b8'}"></div>
            <span style="font-size:11px;font-weight:600;color:${tacticColors[tactic] || '#94a3b8'}">${tactic}</span>
            <span style="font-size:9px;color:#6b7280">(${techs.length} techniques)</span>
          </div>
          ${techs.sort((a, b) => b.confidence - a.confidence).map(t => html`<div style="background:#1f2937;border-radius:4px;padding:6px 8px;margin-bottom:3px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <span style="font-size:10px;font-weight:600;color:#e2e8f0">${t.id}</span>
              <span style="font-size:10px;color:#94a3b8;margin-left:6px">${t.name}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              ${t.related.length > 0 ? html`<div style="display:flex;gap:2px">${t.related.map(r => html`<span style="font-size:8px;background:#172554;color:#93c5fd;padding:1px 4px;border-radius:2px">${r}</span>`)}</div>` : nothing}
              <div style="width:50px;height:5px;background:#374151;border-radius:2px;overflow:hidden">
                <div style="width:${t.confidence}%;height:100%;background:${t.confidence >= 90 ? '#ef4444' : t.confidence >= 75 ? '#f97316' : '#eab308'};border-radius:2px"></div>
              </div>
              <span style="font-size:9px;font-weight:700;color:${t.confidence >= 90 ? '#ef4444' : t.confidence >= 75 ? '#f97316' : '#eab308'}">${t.confidence}%</span>
            </div>
          </div>`)}
        </div>`)}
      </div>
    </div>`;
  }

  // --- Response Metrics Radar ---
  private _renderResponseMetrics(): any {
    const metrics = this._incidentMetrics;
    const avgMtd = Math.round(metrics.reduce((s, m) => s + m.mtdMinutes, 0) / metrics.length);
    const avgMtc = Math.round(metrics.reduce((s, m) => s + m.mtcMinutes, 0) / metrics.length);
    const avgMttr = Math.round(metrics.reduce((s, m) => s + m.mttrMinutes, 0) / metrics.length);
    const industryMtd = 15, industryMtc = 60, industryMttr = 120;
    // Radar chart (hexagonal)
    const cx = 100, cy = 100, r = 80;
    const axes = ['MTD', 'MTC', 'MTTR', 'Coverage', 'Accuracy', 'Speed'];
    const actual = [avgMtd / industryMtd, avgMtc / industryMtc, avgMttr / industryMttr, 0.85, 0.78, 0.65];
    const target = [0.8, 0.8, 0.8, 0.95, 0.9, 0.85];
    const angle = (i: number) => (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const actualPts = actual.map((v, i) => `${cx + Math.cos(angle(i)) * r * Math.min(v, 1)},${cy + Math.sin(angle(i)) * r * Math.min(v, 1)}`).join(' ');
    const targetPts = target.map((v, i) => `${cx + Math.cos(angle(i)) * r * v},${cy + Math.sin(angle(i)) * r * v}`).join(' ');
    const gridLines = [0.25, 0.5, 0.75, 1].map(scale => axes.map((_, i) => `${cx + Math.cos(angle(i)) * r * scale},${cy + Math.sin(angle(i)) * r * scale}`).join(' '));

    return html`<div style="background:#0f172a;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Response Metrics (Actual vs Target)</div>
      <div style="display:flex;gap:20px;align-items:flex-start">
        <svg viewBox="0 0 200 200" width="200" height="200">
          ${gridLines.map(pts => html`<polygon points="${pts}" fill="none" stroke="#1f2937" stroke-width="0.5"/>`)}
          ${axes.map((_, i) => html`<line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(angle(i)) * r}" y2="${cy + Math.sin(angle(i)) * r}" stroke="#1f2937" stroke-width="0.5"/><text x="${cx + Math.cos(angle(i)) * (r + 14)}" y="${cy + Math.sin(angle(i)) * (r + 14) + 3}" text-anchor="middle" fill="#94a3b8" font-size="8">${axes[i]}</text>`)}
          <polygon points="${targetPts}" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-dasharray="4,2"/>
          <polygon points="${actualPts}" fill="#f59e0b20" stroke="#f59e0b" stroke-width="2"/>
          ${actual.map((v, i) => html`<circle cx="${cx + Math.cos(angle(i)) * r * Math.min(v, 1)}" cy="${cy + Math.sin(angle(i)) * r * Math.min(v, 1)}" r="3" fill="#f59e0b"/>`)}
        </svg>
        <div style="flex:1">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
            ${[
              { label: 'Avg MTD', value: avgMtd + 'm', target: industryMtd + 'm', ok: avgMtd <= industryMtd },
              { label: 'Avg MTC', value: avgMtc + 'm', target: industryMtc + 'm', ok: avgMtc <= industryMtc },
              { label: 'Avg MTTR', value: avgMttr + 'm', target: industryMttr + 'm', ok: avgMttr <= industryMttr },
              { label: 'Incidents (30d)', value: String(metrics.length), target: '< 10', ok: metrics.length < 10 },
            ].map(m => html`<div style="background:#1f2937;border-radius:6px;padding:8px">
              <div style="font-size:9px;color:#6b7280">${m.label}</div>
              <div style="font-size:14px;font-weight:700;color:${m.ok ? '#22c55e' : '#ef4444'}">${m.value}</div>
              <div style="font-size:9px;color:#6b7280">Target: ${m.target}</div>
            </div>`)}
          </div>
          <div style="display:flex;gap:12px;margin-top:10px;font-size:9px;color:#6b7280">
            <span><span style="display:inline-block;width:12px;height:2px;background:#f59e0b;margin-right:3px;vertical-align:middle"></span>Actual</span>
            <span><span style="display:inline-block;width:12px;height:2px;background:#22c55e;margin-right:3px;vertical-align:middle;border-top:1px dashed #22c55e"></span>Target</span>
          </div>
        </div>
      </div>
    </div>`;
  }

  // --- Geographic Threat Map ---
  private _renderGeoMap(): any {
    const threats = [
      { region: 'US-East', lat: 39, lon: -77, count: 3, type: 'Ransomware', severity: 'critical' },
      { region: 'EU-West', lat: 51, lon: -1, count: 2, type: 'Phishing', severity: 'high' },
      { region: 'APAC', lat: 35, lon: 139, count: 1, type: 'Insider', severity: 'medium' },
      { region: 'US-West', lat: 37, lon: -122, count: 1, type: 'DDoS', severity: 'high' },
    ];
    const mapW = 500, mapH = 250;
    const toMapX = (lon: number) => ((lon + 180) / 360) * mapW;
    const toMapY = (lat: number) => ((90 - lat) / 180) * mapH;
    const sevColors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    // Simplified world map outline (continents as rectangles)
    const continents = [
      { x: 50, y: 40, w: 80, h: 80, label: 'N. America' },
      { x: 150, y: 60, w: 60, h: 70, label: 'Europe' },
      { x: 250, y: 50, w: 80, h: 90, label: 'Asia' },
      { x: 150, y: 140, w: 50, h: 60, label: 'Africa' },
      { x: 350, y: 160, w: 60, h: 50, label: 'Oceania' },
    ];

    return html`<div style="background:#0f172a;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Geographic Threat Map</div>
      <svg viewBox="0 0 ${mapW} ${mapH}" width="100%" style="max-width:520px">
        ${continents.map(c => html`<rect x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" fill="#1f293720" stroke="#374151" stroke-width="0.5" rx="4"/><text x="${c.x + c.w / 2}" y="${c.y + c.h / 2}" text-anchor="middle" fill="#374151" font-size="8">${c.label}</text>`)}
        ${threats.map(t => html`<g>
          <circle cx="${toMapX(t.lon)}" cy="${toMapY(t.lat)}" r="${6 + t.count * 3}" fill="${sevColors[t.severity]}30" stroke="${sevColors[t.severity]}" stroke-width="1.5"/>
          <circle cx="${toMapX(t.lon)}" cy="${toMapY(t.lat)}" r="3" fill="${sevColors[t.severity]}"/>
          <text x="${toMapX(t.lon)}" y="${toMapY(t.lat) - 12}" text-anchor="middle" fill="${sevColors[t.severity]}" font-size="8" font-weight="600">${t.type}</text>
          <text x="${toMapX(t.lon)}" y="${toMapY(t.lat) - 3}" text-anchor="middle" fill="#e2e8f0" font-size="7">${t.count} incidents</text>
        </g>`)}
      </svg>
      <div style="display:flex;gap:12px;margin-top:8px;font-size:9px;color:#6b7280;justify-content:center">
        ${Object.entries(sevColors).map(([k, v]) => html`<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${v};margin-right:3px"></span>${k}</span>`)}
      </div>
    </div>`;
  }

  // --- Automated Insights Panel ---
  private _renderInsightsPanel(): any {
    const insights = this._generateInsights();
    const typeConfig: Record<string, { bg: string; border: string }> = {
      warning: { bg: '#450a0a', border: '#ef4444' },
      positive: { bg: '#052e16', border: '#22c55e' },
      trend: { bg: '#172554', border: '#3b82f6' },
      recommendation: { bg: '#422006', border: '#f59e0b' },
    };

    return html`<div style="background:#0f172a;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">Automated Insights</div>
        <span style="font-size:10px;color:#6b7280">${insights.length} generated</span>
      </div>
      ${insights.map(ins => {
        const config = typeConfig[ins.type];
        return html`<div style="background:${config.bg};border:1px solid ${config.border}30;border-radius:8px;padding:10px;margin-bottom:6px;border-left:3px solid ${config.border}">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:12px;font-weight:600;color:#e2e8f0">${ins.icon} ${ins.title}</span>
            <span style="font-size:10px;font-weight:700;color:${config.border}">${ins.metric}</span>
          </div>
          <div style="font-size:11px;color:#94a3b8;line-height:1.5">${ins.description}</div>
        </div>`;
      })}
    </div>`;
  }

  private _renderAnalyticsTab(): any {
    return html`${this._renderInsightsPanel()}${this._renderSLAPrediction()}${this._renderResponseMetrics()}${this._renderMitreCorrelation()}${this._renderGeoMap()}`;
  }

  private _lessonsLearned: LessonLearned[] = [
    { id: 'll-1', category: 'Detection', finding: 'EDR alert for encryption activity took 12 minutes to reach Tier 1', recommendation: 'Configure direct EDR-to-SOC integration with 60-second SLA', priority: 'critical', status: 'open', assignee: 'SOC Lead', dueDate: '2026-05-15' },
    { id: 'll-2', category: 'Containment', finding: 'Network isolation required manual firewall rule changes (30 min)', recommendation: 'Implement automated network segmentation with pre-configured isolation policies', priority: 'high', status: 'in-progress', assignee: 'Network Team', dueDate: '2026-05-30' },
    { id: 'll-3', category: 'Communication', finding: 'Executive notification delayed by 1 hour due to approval chain', recommendation: 'Pre-authorize CISO to notify executives without additional approval', priority: 'high', status: 'open', assignee: 'CISO', dueDate: '2026-05-10' },
    { id: 'll-4', category: 'Recovery', finding: 'Backup restore took 2 hours per system due to full image restore', recommendation: 'Implement incremental backup strategy with bare-metal recovery automation', priority: 'medium', status: 'open', assignee: 'IT Ops', dueDate: '2026-06-15' },
    { id: 'll-5', category: 'Prevention', finding: 'Phishing email bypassed email gateway SPF/DKIM checks', recommendation: 'Enable DMARC enforcement and implement AI-based phishing detection', priority: 'critical', status: 'in-progress', assignee: 'Email Security', dueDate: '2026-05-05' },
    { id: 'll-6', category: 'Documentation', finding: 'Incident timeline was reconstructed manually from multiple sources', recommendation: 'Deploy centralized SIEM with automated timeline correlation', priority: 'medium', status: 'open', assignee: 'SOC Lead', dueDate: '2026-06-30' },
  ];

  private _commLog: CommunicationLog[] = [
    { id: 'cm-1', timestamp: '2026-04-21 02:55', channel: 'Slack', from: 'SOC Lead', to: '#incident-response', subject: 'IR Activation - P1 Incident', summary: 'Confirmed ransomware incident. Activating IR plan. All hands on deck.', classification: 'internal' },
    { id: 'cm-2', timestamp: '2026-04-21 03:30', channel: 'Email', from: 'CISO', to: 'CEO, CFO, Legal', subject: 'URGENT: Active Ransomware Incident', summary: 'Briefing executive team on scope and containment actions. No data exfiltration confirmed.', classification: 'internal' },
    { id: 'cm-3', timestamp: '2026-04-21 04:15', channel: 'Slack', from: 'IR Lead', to: '#incident-response', subject: 'Containment Update', summary: 'Subnet isolated. No further spread detected. Beginning forensic collection.', classification: 'internal' },
    { id: 'cm-4', timestamp: '2026-04-21 06:00', channel: 'Email', from: 'Legal', to: 'DPO, Compliance', subject: 'Regulatory Notification Assessment', summary: 'Assessing breach notification requirements under GDPR and applicable state laws.', classification: 'internal' },
    { id: 'cm-5', timestamp: '2026-04-21 08:00', channel: 'Email', from: 'PR Team', to: 'All Staff', subject: 'IT Security Incident - Staff Communication', summary: 'General staff notification about IT security event. No personal data impact.', classification: 'external' },
  ];

  private _costs: CostImpact[] = [
    { category: 'Incident Response', description: 'SOC team overtime and contractor costs', estimated: 45000, actual: 38000, currency: 'USD' },
    { category: 'System Recovery', description: 'Endpoint reimaging and data restoration', estimated: 25000, actual: 22000, currency: 'USD' },
    { category: 'Business Downtime', description: 'Finance department productivity loss (23 endpoints, 6h)', estimated: 85000, actual: 72000, currency: 'USD' },
    { category: 'Forensic Investigation', description: 'External forensics firm engagement', estimated: 60000, actual: 55000, currency: 'USD' },
    { category: 'Legal & Compliance', description: 'Legal counsel and regulatory assessment', estimated: 30000, actual: 15000, currency: 'USD' },
    { category: 'PR & Communication', description: 'Crisis communication and brand management', estimated: 15000, actual: 8000, currency: 'USD' },
  ];

  private _incidents: Incident[] = [
    {
      id: 'inc1',
      title: 'Ransomware Attack - Finance Department',
      severity: 'critical',
      status: 'contained',
      startTime: '2026-04-21 02:34 UTC',
      dwellTime: '4h 23m',
      events: [
        { id: 'e1', timestamp: '02:34', title: 'Initial Detection - Suspicious File Activity', type: 'detection', severity: 'critical', analyst: 'EDR System', duration: '0m', description: 'CrowdStrike detected suspicious encryption behavior on FIN-WS-042', iocs: ['fin-ws-042', 'malware.exe', '10.0.42.15'] },
        { id: 'e2', timestamp: '02:35', title: 'Alert Generated - Tier 1 SOC', type: 'alert', severity: 'critical', analyst: 'Chen Li', duration: '1m', description: 'Automated alert created with CRITICAL severity classification', iocs: [] },
        { id: 'e3', timestamp: '02:40', title: 'Investigation Started', type: 'investigation', severity: 'critical', analyst: 'Chen Li', duration: '15m', description: 'Initial scope assessment. Identifying affected systems and lateral movement', iocs: ['10.0.42.0/24'] },
        { id: 'e4', timestamp: '02:55', title: 'Escalation to Incident Response', type: 'escalation', severity: 'critical', analyst: 'SOC Lead', duration: '5m', description: 'Confirmed ransomware. Escalating to IR team and CISO', iocs: [] },
        { id: 'e5', timestamp: '03:00', title: 'Network Isolation Initiated', type: 'containment', severity: 'high', analyst: 'Network Team', duration: '30m', description: 'Isolating affected subnet. Blocking external C2 communications', iocs: ['c2.malware-domain.com'] },
        { id: 'e6', timestamp: '03:30', title: 'Executive Notification', type: 'communication', severity: 'medium', analyst: 'CISO', duration: '10m', description: 'Board notified. Legal and PR teams briefed', iocs: [] },
        { id: 'e7', timestamp: '04:00', title: 'Ransomware Variant Identified', type: 'investigation', severity: 'high', analyst: 'Threat Intel', duration: '30m', description: 'LockBit 4.0 variant. decryption key not available', iocs: ['LockBit 4.0'] },
        { id: 'e8', timestamp: '05:30', title: 'Containment Complete', type: 'containment', severity: 'medium', analyst: 'IR Team', duration: '0m', description: 'All affected systems isolated. 23 endpoints wiped and re-imaged', iocs: [] },
        { id: 'e9', timestamp: '06:45', title: 'Remediation & Recovery', type: 'remediation', severity: 'medium', analyst: 'IT Ops', duration: '2h', description: 'Restoring from backups. No data exfiltration confirmed', iocs: [] },
      ]
    }
  ];

  private _getTypeColor(type: string): string {
    const m: Record<string, string> = { detection: '#ef4444', alert: '#f97316', investigation: '#3b82f6', containment: '#f59e0b', remediation: '#22c55e', escalation: '#7c3aed', communication: '#06b6d4' };
    return m[type] ?? '#94a3b8';
  }

  private _getSeverityColor(sev: string): string {
    const m: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    return m[sev] ?? '#94a3b8';
  }

  private _renderTimeline() {
    const incident = this._incidents.find(i => i.id === this._selectedIncident);
    if (!incident) return nothing;

    const filteredEvents = this._getFilteredEvents();

    return html`
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center">
        <span style="font-size:11px;font-weight:600;color:#94a3b8">Filter:</span>
        <select style="background:#1f2937;border:1px solid #374151;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:11px" .value=${this._filterType} @change=${(e: Event) => { this._filterType = (e.target as HTMLSelectElement).value; this.requestUpdate(); }}>
          <option value="all">All Types</option>
          <option value="detection">Detection</option><option value="alert">Alert</option><option value="investigation">Investigation</option>
          <option value="containment">Containment</option><option value="remediation">Remediation</option><option value="escalation">Escalation</option><option value="communication">Communication</option>
        </select>
        <select style="background:#1f2937;border:1px solid #374151;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:11px" .value=${this._filterSeverity} @change=${(e: Event) => { this._filterSeverity = (e.target as HTMLSelectElement).value; this.requestUpdate(); }}>
          <option value="all">All Severities</option>
          <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
        <span style="font-size:11px;color:#6b7280;margin-left:auto">${filteredEvents.length} of ${incident.events.length} events</span>
      </div>
      <div class="timeline">
        ${filteredEvents.map(e => html`
          <div class="event ${e.type}">
            <div class="event-dot"></div>
            <div class="event-card">
              <div class="event-header">
                <span class="event-title">${e.title}</span>
                <span class="event-time">${incident.startTime.split(' ')[0]} ${e.timestamp}</span>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <span class="badge b-${e.severity}">${e.severity}</span>
                <span class="event-duration">⏱ ${e.duration}</span>
              </div>
              <div class="event-desc">${e.description}</div>
              <div class="event-analyst">👤 ${e.analyst}</div>
              ${e.iocs.length > 0 ? html`<div>IOCs: ${e.iocs.map(i => html`<span class="ioc-tag">${i}</span>`)}</div>` : nothing}
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private _renderImpact() {
    const incident = this._incidents.find(i => i.id === this._selectedIncident);
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    if (incident) incident.events.forEach(e => { severityCounts[e.severity] = (severityCounts[e.severity] || 0) + 1; });
    const total = incident ? incident.events.length : 1;
    const barW = 300;
    const barH = 20;
    const critW = (severityCounts.critical / total) * barW;
    const highW = (severityCounts.high / total) * barW;
    const medW = (severityCounts.medium / total) * barW;
    const lowW = (severityCounts.low / total) * barW;

    return html`
      <div class="dwell-time">
        <div class="dwell-stat">
          <div class="dwell-value" style="color:#ef4444">4h 23m</div>
          <div class="dwell-label">Total Dwell Time</div>
        </div>
        <div class="dwell-stat">
          <div class="dwell-value" style="color:#22c55e">12m</div>
          <div class="dwell-label">Mean Time to Detect</div>
        </div>
        <div class="dwell-stat">
          <div class="dwell-value" style="color:#3b82f6">4h 11m</div>
          <div class="dwell-label">Mean Time to Contain</div>
        </div>
        <div class="dwell-stat">
          <div class="dwell-value">23</div>
          <div class="dwell-label">Endpoints Affected</div>
        </div>
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
        <div style="font-weight:600;margin-bottom:10px">Severity Distribution</div>
        <svg width="100%" viewBox="0 0 ${barW + 120} ${barH + 40}" style="max-width:450px">
          <rect x="0" y="0" width="${critW}" height="${barH}" fill="#ef4444" rx="3"/>
          <rect x="${critW}" y="0" width="${highW}" height="${barH}" fill="#f97316"/>
          <rect x="${critW + highW}" y="0" width="${medW}" height="${barH}" fill="#eab308"/>
          <rect x="${critW + highW + medW}" y="0" width="${lowW}" height="${barH}" fill="#22c55e" rx="3"/>
          ${critW > 25 ? html`<text x="${critW / 2}" y="${barH / 2 + 3}" text-anchor="middle" fill="white" font-size="8" font-weight="600">${severityCounts.critical}</text>` : nothing}
          ${highW > 25 ? html`<text x="${critW + highW / 2}" y="${barH / 2 + 3}" text-anchor="middle" fill="white" font-size="8" font-weight="600">${severityCounts.high}</text>` : nothing}
          ${medW > 25 ? html`<text x="${critW + highW + medW / 2}" y="${barH / 2 + 3}" text-anchor="middle" fill="white" font-size="8" font-weight="600">${severityCounts.medium}</text>` : nothing}
          ${lowW > 25 ? html`<text x="${critW + highW + medW + lowW / 2}" y="${barH / 2 + 3}" text-anchor="middle" fill="white" font-size="8" font-weight="600">${severityCounts.low}</text>` : nothing}
          <rect x="0" y="${barH + 6}" width="10" height="10" fill="#ef4444" rx="2"/><text x="14" y="${barH + 14}" fill="#94a3b8" font-size="8">Critical</text>
          <rect x="70" y="${barH + 6}" width="10" height="10" fill="#f97316" rx="2"/><text x="84" y="${barH + 14}" fill="#94a3b8" font-size="8">High</text>
          <rect x="120" y="${barH + 6}" width="10" height="10" fill="#eab308" rx="2"/><text x="134" y="${barH + 14}" fill="#94a3b8" font-size="8">Medium</text>
          <rect x="180" y="${barH + 6}" width="10" height="10" fill="#22c55e" rx="2"/><text x="194" y="${barH + 14}" fill="#94a3b8" font-size="8">Low</text>
        </svg>
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:14px">
        <div style="font-weight:600;margin-bottom:12px">24-Hour Activity Heatmap</div>
        <div class="heatmap">
          ${Array.from({length: 24}, (_, i) => {
            const intensity = [3,2,5,1,0,0,0,2,4,5,3,2,0,1,3,4,5,4,3,2,1,0,0,2][i];
            const colors = ['#0f172a', '#450a0a', '#7f1d1d', '#b91c1c', '#ef4444'];
            return html`<div class="heatmap-cell" style="background:${colors[intensity]}"></div>`;
          })}
        </div>
        <div style="display:flex;justify-content:space-between;font-size:9px;color:#6b7280;margin-top:4px">
          <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
        </div>
      </div>
    `;
  }

  private _renderEvidence() {
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:14px">
        <div style="font-weight:600;margin-bottom:12px">Forensic Evidence Collection</div>
        ${['Memory Dump - FIN-WS-042', 'Full Disk Image - 3 Systems', 'Network Packet Captures', 'Windows Event Logs', 'EDR Telemetry Export', 'Malware Sample Collection'].map(e => html`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #374151">
            <span style="font-size:12px">${e}</span>
            <span class="badge b-${Math.random() > 0.3 ? 'resolved' : 'open'}">${Math.random() > 0.3 ? 'Collected' : 'Pending'}</span>
          </div>
        `)}
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-top:12px">
        <div style="font-weight:600;margin-bottom:12px">Chain of Custody</div>
        ${['Evidence Item 1 - Hash verified', 'Evidence Item 2 - Hash verified', 'Evidence Item 3 - Collection in progress'].map((e, i) => html`
          <div style="display:flex;gap:10px;padding:8px 0;font-size:11px;color:#94a3b8">
            <span style="color:#22c55e">✓</span>
            <span>${e}</span>
            <span style="margin-left:auto">${['Apr 21 08:30', 'Apr 21 08:45', 'Apr 21 09:00'][i]}</span>
          </div>
        `)}
      </div>
    `;
  }

  private _renderLessons() {
    const open = this._lessonsLearned.filter(l => l.status === 'open').length;
    const inProgress = this._lessonsLearned.filter(l => l.status === 'in-progress').length;
    const completed = this._lessonsLearned.filter(l => l.status === 'completed').length;
    const total = this._lessonsLearned.length || 1;
    return html`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-weight:600;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">Lessons Learned</div>
        <div style="display:flex;gap:6px">
          <span class="badge b-critical">Open: ${open}</span>
          <span class="badge b-contained">In Progress: ${inProgress}</span>
          <span class="badge b-resolved">Completed: ${completed}</span>
        </div>
      </div>
      <div class="progress-bar" style="margin-bottom:14px"><div class="progress-fill" style="width:${(completed / total) * 100}%;background:#22c55e"></div></div>
      ${this._lessonsLearned.map(l => {
        const prioColor = l.priority === 'critical' ? '#ef4444' : l.priority === 'high' ? '#f97316' : l.priority === 'medium' ? '#eab308' : '#22c55e';
        const statusColor = l.status === 'completed' ? '#22c55e' : l.status === 'in-progress' ? '#3b82f6' : '#eab308';
        return html`<div class="lesson-row" style="border-left-color:${prioColor}">
          <div class="lesson-header">
            <span class="lesson-title">[${l.category}] ${l.finding}</span>
            <span class="badge" style="background:${statusColor}20;color:${statusColor}">${l.status.replace('-', ' ')}</span>
          </div>
          <div style="font-size:11px;color:#94a3b8;margin:4px 0">Recommendation: ${l.recommendation}</div>
          <div class="lesson-meta">Assignee: ${l.assignee} | Due: ${l.dueDate} | Priority: ${l.priority}</div>
        </div>`;
      })}
    `;
  }

  private _renderComms() {
    return html`
      <div style="font-weight:600;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">Communication Log</div>
      ${this._commLog.map(c => {
        const channelColor = c.channel === 'Slack' ? '#3b82f6' : c.channel === 'Email' ? '#22c55e' : '#6b7280';
        const classColor = c.classification === 'internal' ? '#3b82f6' : c.classification === 'external' ? '#f97316' : '#a855f7';
        return html`<div class="comm-row">
          <div style="width:70px;flex-shrink:0;color:#6b7280;font-size:10px">${c.timestamp.split(' ')[1]}</div>
          <span class="comm-channel" style="background:${channelColor}20;color:${channelColor}">${c.channel}</span>
          <div style="flex:1">
            <div style="font-weight:600;color:#e2e8f0">${c.subject}</div>
            <div style="font-size:10px;color:#94a3b8;margin-top:2px">${c.from} → ${c.to}: ${c.summary}</div>
          </div>
          <span class="badge" style="background:${classColor}20;color:${classColor}">${c.classification}</span>
        </div>`;
      })}
    `;
  }

  private _renderCosts() {
    const totalEstimated = this._costs.reduce((s, c) => s + c.estimated, 0);
    const totalActual = this._costs.reduce((s, c) => s + c.actual, 0);
    const savings = totalEstimated - totalActual;
    const maxCost = Math.max(...this._costs.map(c => Math.max(c.estimated, c.actual)));
    return html`
      <div style="font-weight:600;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">Financial Impact Assessment</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
        <div style="background:#0f172a;border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#f97316">$${(totalEstimated / 1000).toFixed(0)}K</div>
          <div style="font-size:9px;color:#6b7280">Estimated Total</div>
        </div>
        <div style="background:#0f172a;border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#ef4444">$${(totalActual / 1000).toFixed(0)}K</div>
          <div style="font-size:9px;color:#6b7280">Actual Total</div>
        </div>
        <div style="background:#0f172a;border-radius:8px;padding:12px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#22c55e">$${(savings / 1000).toFixed(0)}K</div>
          <div style="font-size:9px;color:#6b7280">Savings</div>
        </div>
      </div>
      ${this._costs.map(c => html`<div class="cost-row">
        <div style="width:120px;flex-shrink:0">
          <div style="font-weight:600;color:#e2e8f0">${c.category}</div>
          <div style="font-size:9px;color:#6b7280">${c.description}</div>
        </div>
        <div class="cost-bar">
          <div class="cost-fill" style="width:${(c.estimated / maxCost) * 100}%;background:#f9731640;position:absolute"></div>
          <div class="cost-fill" style="width:${(c.actual / maxCost) * 100}%;background:#ef4444"></div>
        </div>
        <div style="width:60px;text-align:right;font-weight:700;color:#ef4444">$${(c.actual / 1000).toFixed(0)}K</div>
        <div style="width:60px;text-align:right;font-size:10px;color:#6b7280">$${(c.estimated / 1000).toFixed(0)}K est</div>
      </div>`)}
      <div style="font-size:10px;color:#6b7280;margin-top:8px">
        <span style="background:#f9731640;padding:2px 6px;border-radius:3px;margin-right:4px"></span>Estimated
        <span style="background:#ef4444;padding:2px 6px;border-radius:3px;margin-left:12px;margin-right:4px"></span>Actual
      </div>
    `;
  }

  private _renderReport() {
    return html`
      <div style="font-weight:600;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">After-Action Report Generator</div>
      <div class="afr-section">
        <div class="afr-title">Incident Summary</div>
        <div class="afr-field"><div class="afr-label">Incident Type</div><div class="afr-value">Ransomware Attack (LockBit 4.0 variant) targeting Finance Department</div></div>
        <div class="afr-field"><div class="afr-label">Severity & Classification</div><div class="afr-value">CRITICAL | P1 | Confirmed ransomware with encryption activity</div></div>
        <div class="afr-field"><div class="afr-label">Timeline</div><div class="afr-value">2026-04-21 02:34 UTC (Detection) → 2026-04-21 06:57 UTC (Containment Complete)</div></div>
        <div class="afr-field"><div class="afr-label">Impact Scope</div><div class="afr-value">23 endpoints affected in Finance subnet (10.0.42.0/24). No data exfiltration confirmed. All systems restored from clean backups.</div></div>
      </div>
      <div class="afr-section">
        <div class="afr-title">Root Cause Analysis</div>
        <div class="afr-value">Initial vector identified as phishing email bypassing email gateway SPF/DKIM validation. User clicked malicious link leading to credential harvesting page. Attacker used stolen credentials to gain initial access via VPN, escalated privileges using Mimikatz, and deployed LockBit 4.0 ransomware.</div>
        <div style="margin-top:10px"><div class="afr-label">MITRE ATT&CK Techniques</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">
            ${['T1566.001 (Spearphishing)', 'T1189 (Drive-by Compromise)', 'T1078 (Valid Accounts)', 'T1003 (OS Credential Dumping)', 'T1021.002 (SMB/Windows Admin Shares)', 'T1486 (Data Encrypted for Impact)'].map(t => html`<span class="ioc-tag">${t}</span>`)}
          </div>
        </div>
      </div>
      <div class="afr-section">
        <div class="afr-title">Action Items Summary</div>
        <div style="font-size:11px;color:#94a3b8;margin-bottom:8px">${this._lessonsLearned.length} lessons identified | ${this._lessonsLearned.filter(l => l.status === 'completed').length} completed | ${this._lessonsLearned.filter(l => l.status !== 'completed').length} pending</div>
        <div class="form-group"><label class="form-label">Additional Comments for Report</label><textarea class="form-input" style="min-height:80px;resize:vertical" placeholder="Add any additional observations..." .value=${this._aafComment} @input=${(e: Event) => { this._aafComment = (e.target as HTMLTextAreaElement).value; }}></textarea></div>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" @click=${() => { this._generateReportWithHistory(); }}>Generate Report</button>
          <button class="btn btn-secondary" @click=${() => { const data = { incident: this._incidents.find(i => i.id === this._selectedIncident), lessons: this._lessonsLearned, costs: this._costs, comms: this._commLog }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'incident-report.json'; a.click(); URL.revokeObjectURL(url); }}>Export JSON</button>
        </div>
      </div>
    `;
  }

  private _renderNotifications() {
    return this._notifications.map(n => html`<div class="notification">${n.message}</div>`);
interface VizNode { id: string; label: string; type: string; x: number; y: number; severity: RiskLevel; status: string; timestamp: string; }
interface VizEdge { id: string; from: string; to: string; label: string; type: string; }
interface HeatmapCell { row: string; col: string; value: number; max: number; }

interface LessonLearned {
  id: string; category: string; finding: string; recommendation: string;
  priority: 'critical' | 'high' | 'medium' | 'low'; status: 'open' | 'in-progress' | 'completed';
  assignee: string; dueDate: string;
}

interface CommunicationLog {
  id: string; timestamp: string; channel: string; from: string; to: string;
  subject: string; summary: string; classification: 'internal' | 'external' | 'regulatory';
}

interface CostImpact {
  category: string; description: string; estimated: number; actual: number; currency: string;
}

type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

interface ReportExecRecord {
  id: string;
  timestamp: string;
  incidentId: string;
  incidentTitle: string;
  format: 'json' | 'markdown' | 'pdf';
  status: 'success' | 'failed' | 'running';
  duration: number;
  fileSize: number;
}

interface AuditTrailEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  category: 'timeline' | 'report' | 'config' | 'export' | 'investigation';
}

interface TimelineComment {
  id: string;
  timestamp: string;
  author: string;
  text: string;
  eventId: string;
}


  @state() private _vizNodes: VizNode[] = [];
  @state() private _vizEdges: VizEdge[] = [];
  @state() private _vizHeatmap: HeatmapCell[] = [];


  private _initVizData() {
    this._vizNodes = [
      { id: 'vn-1', label: 'Phishing Email', type: 'initial', x: 50, y: 30, severity: 'medium' as RiskLevel, status: 'completed', timestamp: '2026-04-21T22:00:00Z' },
      { id: 'vn-2', label: 'Credential Harvest', type: 'execution', x: 150, y: 30, severity: 'high' as RiskLevel, status: 'completed', timestamp: '2026-04-21T22:15:00Z' },
      { id: 'vn-3', label: 'Initial Access', type: 'access', x: 250, y: 30, severity: 'critical' as RiskLevel, status: 'completed', timestamp: '2026-04-21T23:00:00Z' },
      { id: 'vn-4', label: 'C2 Establish', type: 'c2', x: 250, y: 80, severity: 'critical' as RiskLevel, status: 'completed', timestamp: '2026-04-22T01:00:00Z' },
      { id: 'vn-5', label: 'Privilege Esc', type: 'privesc', x: 350, y: 80, severity: 'critical' as RiskLevel, status: 'completed', timestamp: '2026-04-22T02:00:00Z' },
      { id: 'vn-6', label: 'Lateral Movement', type: 'lateral', x: 350, y: 130, severity: 'high' as RiskLevel, status: 'active', timestamp: '2026-04-22T03:00:00Z' },
      { id: 'vn-7', label: 'Data Staging', type: 'collection', x: 450, y: 130, severity: 'high' as RiskLevel, status: 'active', timestamp: '2026-04-22T04:00:00Z' },
      { id: 'vn-8', label: 'Exfiltration', type: 'exfil', x: 450, y: 180, severity: 'critical' as RiskLevel, status: 'active', timestamp: '2026-04-22T05:00:00Z' },
    ];
    this._vizEdges = [
      { id: 've-1', from: 'vn-1', to: 'vn-2', label: 'Link clicked', type: 'phishing' },
      { id: 've-2', from: 'vn-2', to: 'vn-3', label: 'Stolen creds', type: 'credential' },
      { id: 've-3', from: 'vn-3', to: 'vn-4', label: 'Beacon setup', type: 'c2' },
      { id: 've-4', from: 'vn-4', to: 'vn-5', label: 'Mimikatz', type: 'privesc' },
      { id: 've-5', from: 'vn-5', to: 'vn-6', label: 'PsExec/SMB', type: 'lateral' },
      { id: 've-6', from: 'vn-6', to: 'vn-7', label: 'File collect', type: 'staging' },
      { id: 've-7', from: 'vn-7', to: 'vn-8', label: 'HTTPS exfil', type: 'exfil' },
    ];
    const tactics = ['Reconnaissance','Initial Access','Execution','Persistence','Privilege Escalation','Defense Evasion','Credential Access','Discovery','Lateral Movement','Collection','C2','Exfiltration','Impact'];
    const hours = ['00','04','08','12','16','20'];
    this._vizHeatmap = [];
    tactics.forEach(t => hours.forEach(h => { this._vizHeatmap.push({ row: t, col: h + ':00', value: Math.floor(Math.abs(Math.sin(t.length * 3 + parseInt(h)) * 8)), max: 10 }); }));
    this._initVizData = () => {}; // prevent re-init
  }

  private _renderAttackGraph(): string {
    const w = 500, h = 220;
    const nodeMap: Record<string, VizNode> = {};
    this._vizNodes.forEach(n => nodeMap[n.id] = n);
    const edges = this._vizEdges.map(e => { const from = nodeMap[e.from]; const to = nodeMap[e.to]; if (!from || !to) return ''; return '<line x1="'+from.x+'" y1="'+from.y+'" x2="'+to.x+'" y2="'+to.y+'" stroke="#374151" stroke-width="2" marker-end="url(#arrow2)"/>'; }).join('');
    const nodes = this._vizNodes.map(n => { const color = RISK_COLORS[n.severity]; return '<g><circle cx="'+n.x+'" cy="'+n.y+'" r="20" fill="'+color+'20" stroke="'+color+'" stroke-width="2"/><text x="'+n.x+'" y="'+(n.y-2)+'" text-anchor="middle" fill="'+color+'" font-size="7" font-weight="600">'+n.label+'</text></g>'; }).join('');
    return '<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px"><div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:8px">Attack Graph Visualization</div><svg width="100%" viewBox="0 0 '+w+' '+h+'"><defs><marker id="arrow2" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#374151"/></marker></defs>'+edges+nodes+'</svg></div>';
  }

  private _renderKillChain(): string {
    const stages = ['Recon','Weaponize','Deliver','Exploit','Install','Command','Act'];
    const done = 5; const w = 400; const h = 24; const stepW = w / stages.length;
    return '<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px"><div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:6px">Cyber Kill Chain ('+done+'/'+stages+')</div><svg width="100%" viewBox="0 0 '+w+' '+h+'">'+stages.map((s, i) => '<rect x="'+(i*stepW+1)+'" y="2" width="'+(stepW-2)+'" height="'+(h-4)+'" rx="4" fill="'+(i < done ? '#ef4444' : '#1f2937')+'"/><text x="'+(i*stepW+stepW/2)+'" y="'+(h/2+3)+'" text-anchor="middle" fill="'+(i < done ? '#fff' : '#6b7280')+'" font-size="6">'+s+'</text>').join('')+'</svg></div>';
  }

  private _renderHeatmapViz(): string {
    const tactics = [...new Set(this._vizHeatmap.map(h => h.row))];
    const cols = [...new Set(this._vizHeatmap.map(h => h.col))];
    const cellW = 40, cellH = 18;
    const w = cols.length * cellW + 130, h = tactics.length * cellH + 30;
    const cells = this._vizHeatmap.map(c => { const intensity = c.value / c.max; const r = Math.round(239 * intensity), g = Math.round(68 * (1 - intensity)); const rowIdx = tactics.indexOf(c.row); const colIdx = cols.indexOf(c.col); return '<rect x="'+(130+colIdx*cellW)+'" y="'+(20+rowIdx*cellH)+'" width="'+(cellW-2)+'" height="'+(cellH-2)+'" fill="rgb('+r+','+g+',68)" rx="2" opacity="0.8"/><text x="'+(130+colIdx*cellW+cellW/2-1)+'" y="'+(20+rowIdx*cellH+cellH/2+3)+'" text-anchor="middle" fill="#fff" font-size="7">'+c.value+'</text>'; }).join('');
    return '<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px"><div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:8px">MITRE ATT&CK Heatmap</div><svg width="100%" viewBox="0 0 '+w+' '+h+'">'+cols.map((c, i) => '<text x="'+(130+i*cellW+cellW/2-1)+'" y="14" text-anchor="middle" fill="#6b7280" font-size="7">'+c+'</text>').join('')+tactics.map((t, i) => '<text x="125" y="'+(20+i*cellH+cellH/2+3)+'" text-anchor="end" fill="#94a3b8" font-size="7">'+t.substring(0,14)+'</text>').join('')+cells+'</svg></div>';
  }

  private _addAudit(category: AuditTrailEntry['category'], details: string): void {
    this._auditTrail = [{ id: 'at-' + Date.now(), timestamp: new Date().toISOString(), action: category, user: 'Current User', details, category }, ...this._auditTrail].slice(0, 50);
  }

  private _addComment(): void {
    if (!this._newComment.trim()) return;
    const incident = this._incidents.find(i => i.id === this._selectedIncident);
    const firstEventId = incident?.events[0]?.id || 'unknown';
    this._comments = [{ id: 'tc-' + Date.now(), timestamp: new Date().toISOString(), author: 'Current User', text: this._newComment.trim(), eventId: firstEventId }, ...this._comments].slice(0, 30);
    this._newComment = '';
    this._addAudit('investigation', 'Comment added on incident: ' + (incident?.title || ''));
  }

  private _generateReportWithHistory(): void {
    this._execRunning = true;
    this._execProgress = 0;
    this._addAudit('report', 'Generating AAR for incident: ' + this._selectedIncident);
    const record: ReportExecRecord = {
      id: 'rex-' + Date.now(), timestamp: new Date().toISOString(), incidentId: this._selectedIncident,
      incidentTitle: this._incidents.find(i => i.id === this._selectedIncident)?.title || '', format: 'json',
      status: 'running', duration: 0, fileSize: 0,
    };
    const start = Date.now();
    const iv = setInterval(() => {
      this._execProgress = Math.min(this._execProgress + 12, 100);
      record.duration = Math.round((Date.now() - start) / 1000);
      if (this._execProgress >= 100) {
        clearInterval(iv);
        record.status = 'success';
        record.fileSize = Math.floor(Math.random() * 50000) + 10000;
        this._execHistory = [record, ...this._execHistory].slice(0, 20);
        this._execRunning = false;
        this._notifications = [{ id: 'n' + Date.now(), message: 'AAR Report generated successfully (' + record.fileSize + ' bytes)', timestamp: Date.now() }, ...this._notifications].slice(0, 3);
        setTimeout(() => { this._notifications = this._notifications.filter(n => n.id !== this._notifications[0]?.id); }, 3000);
        this._addAudit('report', 'Report generated: ' + record.id + ' (' + record.duration + 's)');
      }
    }, 200);
  }

  private _reExportRecord(record: ReportExecRecord): void {
    this._addAudit('export', 'Re-exporting report: ' + record.id);
    const data = { incident: this._incidents.find(i => i.id === record.incidentId), lessons: this._lessonsLearned, costs: this._costs, comms: this._commLog };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'incident-report-' + record.incidentId + '.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  private _batchDeleteRecords(): void {
    const count = this._selectedRows.size;
    this._execHistory = this._execHistory.filter(r => !this._selectedRows.has(r.id));
    this._selectedRows = new Set();
    this._addAudit('config', 'Deleted ' + count + ' report records');
  }

  private _getFilteredEvents(): TimelineEvent[] {
    const incident = this._incidents.find(i => i.id === this._selectedIncident);
    if (!incident) return [];
    let events = [...incident.events];
    if (this._filterType !== 'all') events = events.filter(e => e.type === this._filterType);
    if (this._filterSeverity !== 'all') events = events.filter(e => e.severity === this._filterSeverity);
    events.sort((a, b) => {
      let cmp = 0;
      if (this._tableSort === 'timestamp') cmp = a.timestamp.localeCompare(b.timestamp);
      else if (this._tableSort === 'title') cmp = a.title.localeCompare(b.title);
      else if (this._tableSort === 'severity') cmp = this._getSeverityOrder(a.severity) - this._getSeverityOrder(b.severity);
      else if (this._tableSort === 'duration') cmp = parseInt(a.duration) - parseInt(b.duration);
      return this._tableSortDir === 'asc' ? cmp : -cmp;
    });
    return events;
  }

  private _getSeverityOrder(sev: string): number {
    const m: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return m[sev] || 0;
  }

  private _getPagedRecords(): { records: ReportExecRecord[]; totalPages: number } {
    const sorted = [...this._execHistory].sort((a, b) => {
      let cmp = 0;
      if (this._tableSort === 'timestamp') cmp = a.timestamp.localeCompare(b.timestamp);
      else if (this._tableSort === 'duration') cmp = a.duration - b.duration;
      else if (this._tableSort === 'fileSize') cmp = a.fileSize - b.fileSize;
      return this._tableSortDir === 'asc' ? cmp : -cmp;
    });
    const totalPages = Math.max(1, Math.ceil(sorted.length / this._tablePageSize));
    const start = this._tablePage * this._tablePageSize;
    return { records: sorted.slice(start, start + this._tablePageSize), totalPages };
  }

  private _renderExecHistory(): ReturnType<typeof html> {
    if (this._execHistory.length === 0) return html`<div style="text-align:center;padding:40px;color:#6b7280">No report generation history</div>`;
    const { records, totalPages } = this._getPagedRecords();
    return html`<div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
        <span style="font-weight:600;font-size:12px;color:#94a3b8">Report History (${this._execHistory.length})</span>
        <select style="background:#1f2937;border:1px solid #374151;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:11px" .value=${String(this._tablePageSize)} @change=${(e: Event) => { this._tablePageSize = parseInt((e.target as HTMLSelectElement).value); this._tablePage = 0; }}>
          <option value="5">5 per page</option><option value="10">10 per page</option><option value="25">25 per page</option>
        </select>
        ${this._selectedRows.size > 0 ? html`<button class="btn btn-primary" style="background:#dc2626" @click=${this._batchDeleteRecords}>Delete ${this._selectedRows.size} selected</button>` : nothing}
      </div>
      ${this._execRunning ? html`<div class="progress-bar" style="margin-bottom:10px"><div class="progress-fill" style="width:${this._execProgress}%;background:#f59e0b"></div></div>` : nothing}
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr>
          <th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151;width:30px"><input type="checkbox" .checked=${this._selectedRows.size === this._execHistory.length && this._execHistory.length > 0} @change=${(e: Event) => { const c = (e.target as HTMLInputElement).checked; this._selectedRows = c ? new Set(this._execHistory.map(r => r.id)) : new Set(); }}></th>
          <th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Time</th>
          <th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Incident</th>
          <th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Status</th>
          <th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Duration</th>
          <th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Size</th>
          <th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Action</th>
        </tr></thead>
        <tbody>
          ${records.map(r => html`<tr style="border-bottom:1px solid #1f2937;${this._selectedRows.has(r.id) ? 'background:#f59e0b10' : ''}">
            <td style="padding:7px 8px"><input type="checkbox" .checked=${this._selectedRows.has(r.id)} @change=${() => { const s = new Set(this._selectedRows); if (s.has(r.id)) s.delete(r.id); else s.add(r.id); this._selectedRows = s; }}></td>
            <td style="padding:7px 8px;color:#6b7280;font-size:11px">${new Date(r.timestamp).toLocaleString()}</td>
            <td style="padding:7px 8px;font-weight:600">${r.incidentTitle}</td>
            <td style="padding:7px 8px"><span class="badge b-${r.status === 'success' ? 'resolved' : r.status === 'failed' ? 'open' : 'contained'}">${r.status}</span></td>
            <td style="padding:7px 8px">${r.duration}s</td>
            <td style="padding:7px 8px">${(r.fileSize / 1024).toFixed(1)}KB</td>
            <td style="padding:7px 8px"><button class="btn btn-secondary" style="font-size:10px" @click=${() => this._reExportRecord(r)}>Export</button></td>
          </tr>`)}
        </tbody>
      </table>
      ${totalPages > 1 ? html`<div style="display:flex;gap:4px;justify-content:center;margin-top:8px">${Array.from({ length: totalPages }, (_, i) => html`<button class="btn ${this._tablePage === i ? 'btn-primary' : 'btn-secondary'}" style="font-size:10px;padding:4px 10px" @click=${() => { this._tablePage = i; }}>${i + 1}</button>`)}
      </div>` : nothing}
    </div>`;
  }

  private _renderAuditPanel(): ReturnType<typeof html> {
    const filtered = this._auditFilter === 'all' ? this._auditTrail : this._auditTrail.filter(e => e.category === this._auditFilter);
    const catColors: Record<string, string> = { timeline: '#3b82f6', report: '#f59e0b', config: '#8b5cf6', export: '#22c55e', investigation: '#06b6d4' };
    return html`<div>
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
        ${['all', 'timeline', 'report', 'config', 'export', 'investigation'].map(f => html`<button class="btn ${this._auditFilter === f ? 'btn-primary' : 'btn-secondary'}" style="font-size:10px;padding:4px 10px" @click=${() => { this._auditFilter = f; }}>${f}</button>`)}
      </div>
      <div style="max-height:400px;overflow-y:auto">
        ${filtered.length === 0 ? html`<div style="text-align:center;padding:30px;color:#6b7280;font-size:12px">No audit entries</div>` : ''}
        ${filtered.map(e => html`<div style="display:flex;gap:10px;padding:8px 10px;background:#0f172a;border-radius:6px;margin-bottom:4px;font-size:12px;align-items:flex-start">
          <span style="padding:2px 6px;border-radius:3px;font-size:9px;font-weight:600;background:${catColors[e.category] || '#6b7280'}20;color:${catColors[e.category] || '#6b7280'};flex-shrink:0;margin-top:2px">${e.category}</span>
          <div style="flex:1">
            <div style="color:#e2e8f0;font-weight:500">${e.details}</div>
            <div style="font-size:10px;color:#6b7280;margin-top:2px">${e.user} | ${new Date(e.timestamp).toLocaleString()}</div>
          </div>
        </div>`)}
      </div>
    </div>`;
  }

  private _renderSettingsPanel(): ReturnType<typeof html> {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px">
      <div style="font-weight:700;font-size:14px;margin-bottom:12px">Panel Settings</div>
      <div class="tabs" style="margin-bottom:12px">
        <span class="tab ${this._settingsTab === 'general' ? 'active' : ''}" @click=${() => { this._settingsTab = 'general'; }}>General</span>
        <span class="tab ${this._settingsTab === 'thresholds' ? 'active' : ''}" @click=${() => { this._settingsTab = 'thresholds'; }}>Thresholds</span>
        <span class="tab ${this._settingsTab === 'integrations' ? 'active' : ''}" @click=${() => { this._settingsTab = 'integrations'; }}>Integrations</span>
      </div>
      ${this._settingsTab === 'general' ? html`<div class="form-group"><label class="form-label">Default Incident View</label><select class="form-input"><option>Timeline</option><option>Impact</option><option>Evidence</option></select></div>
      <div class="form-group"><label class="form-label">Auto-refresh Interval</label><select class="form-input"><option value="30">30 seconds</option><option value="60" selected>60 seconds</option><option value="300">5 minutes</option></select></div>
      <div class="form-group"><label class="form-label">Timezone</label><select class="form-input"><option>UTC</option><option>Local</option></select></div>` : nothing}
      ${this._settingsTab === 'thresholds' ? html`
        <div class="form-group"><label class="form-label">MTTD Alert Threshold (minutes)</label><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="60" .value=${String(this._mttdThreshold)} @input=${(e: Event) => { this._mttdThreshold = parseInt((e.target as HTMLInputElement).value); }} style="flex:1;accent-color:#f59e0b;background:transparent;border:none"><span style="font-weight:700;color:#f59e0b;min-width:40px;text-align:right">${this._mttdThreshold}m</span></div></div>
        <div class="form-group"><label class="form-label">MTTC Alert Threshold (minutes)</label><div style="display:flex;align-items:center;gap:10px"><input type="range" min="30" max="1440" .value=${String(this._mttcThreshold)} @input=${(e: Event) => { this._mttcThreshold = parseInt((e.target as HTMLInputElement).value); }} style="flex:1;accent-color:#f59e0b;background:transparent;border:none"><span style="font-weight:700;color:#f59e0b;min-width:50px;text-align:right">${this._mttcThreshold}m</span></div></div>
      ` : nothing}
      ${this._settingsTab === 'integrations' ? html`
        <div class="form-group"><label class="form-label">Escalation Email</label><input class="form-input" type="email" .value=${this._escalationEmail} @input=${(e: Event) => { this._escalationEmail = (e.target as HTMLInputElement).value; }} placeholder="soc-escalation@company.com"></div>
        <div class="form-group"><label class="form-label">Webhook URL</label><input class="form-input" type="url" .value=${this._webhookUrl} @input=${(e: Event) => { this._webhookUrl = (e.target as HTMLInputElement).value; }} placeholder="https://hooks.slack.com/..."></div>
        <div class="form-group"><label class="form-label">Scheduled Report (Cron)</label><input class="form-input" type="text" value="0 8 * * MON" placeholder="0 8 * * MON"></div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary" @click=${() => { this._addAudit('config', 'Settings saved'); this._notifications = [{ id: 'n' + Date.now(), message: 'Settings saved', timestamp: Date.now() }, ...this._notifications].slice(0, 3); setTimeout(() => { this._notifications = []; }, 2000); }}>Save</button>
          <button class="btn btn-secondary" @click=${() => { this._addAudit('config', 'Config exported'); }}>Export Config</button>
        </div>
      ` : nothing}
    </div>`;
  }

  private _renderCommentSection(): ReturnType<typeof html> {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-top:12px">
      <div style="font-weight:600;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Investigation Comments (${this._comments.length})</div>
      ${this._comments.length === 0 ? html`<div style="font-size:12px;color:#6b7280;padding:8px 0">No comments yet</div>` : ''}
      ${this._comments.map(c => html`<div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #374151">
        <div style="width:28px;height:28px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${c.author.charAt(0)}</div>
        <div style="flex:1">
          <div><span style="font-weight:600;font-size:12px">${c.author}</span><span style="font-size:10px;color:#6b7280;margin-left:8px">${new Date(c.timestamp).toLocaleString()}</span></div>
          <div style="font-size:12px;color:#d1d5db;margin-top:2px">${c.text}</div>
        </div>
      </div>`)}
      <div style="display:flex;gap:8px;margin-top:10px">
        <input class="form-input" style="flex:1" type="text" placeholder="Add investigation note..." .value=${this._newComment} @input=${(e: Event) => { this._newComment = (e.target as HTMLInputElement).value; }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._addComment(); }}>
        <button class="btn btn-primary" @click=${this._addComment}>Post</button>
      </div>
    </div>`;
  }

  connectedCallback() { super.connectedCallback?.(); this._initVizData(); }


  // --- Domain Rules Engine ---
  @state() private _itvRules: { id: string; name: string; category: string; severity: Severity; enabled: boolean; lastEval: string; passRate: number }[] = [];
  private _initItvRules() {
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
    this._itvRules = rules;
  }
  private _evaluateItvRules(): { passed: number; failed: number; skipped: number; total: number } {
    let passed = 0, failed = 0, skipped = 0;
    this._itvRules.forEach(r => { if (!r.enabled) { skipped++; } else if (r.passRate >= 80) { passed++; } else { failed++; } });
    return { passed, failed, skipped, total: this._itvRules.length };
  }

  // --- CVSS Scoring ---
  @state() private _itvcvssData: { itemId: string; vector: string; base: number; temporal: number; environmental: number; overall: number }[] = [];
  private _initItvCvss() {
    const vectors = ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:A/AC:H/PR:L/UI:R/S:C/C:L/I:L/A:N', 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N', 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:N/I:L/A:N'];
    this._itvcvssData = vectors.map((v, i) => {
      const base = parseFloat((Math.random() * 6 + 3).toFixed(1));
      const temporal = parseFloat((base * (0.7 + Math.random() * 0.3)).toFixed(1));
      const environmental = parseFloat((temporal * (0.8 + Math.random() * 0.2)).toFixed(1));
      return { itemId: 'V-' + String(i + 1).padStart(3, '0'), vector: v, base, temporal, environmental, overall: environmental };
    });
  }

  // --- Anomaly Detection ---
  @state() private _itvanomalies: { id: string; type: string; severity: Severity; description: string; detected: string; confidence: number; affected: string[] }[] = [];
  private _runItvAnomalyDetection() {
    const types = [
      { type: 'Spike in violation rate', severity: 'high' as Severity, desc: 'Detected 280% increase in violations over the last 24 hours', affected: ['Core', 'Operations'] },
      { type: 'SLA breach pattern', severity: 'critical' as Severity, desc: 'Recurring SLA breaches on weekends indicating staffing gaps', affected: ['SLA', 'Staffing'] },
      { type: 'Baseline drift detected', severity: 'medium' as Severity, desc: 'Score drifted 10 points below established baseline over 7 days', affected: ['Metrics', 'Baseline'] },
      { type: 'Unusual escalation volume', severity: 'high' as Severity, desc: 'Escalation rate 2.5x above normal in infrastructure controls', affected: ['Infrastructure', 'Controls'] },
      { type: 'Stale findings accumulation', severity: 'low' as Severity, desc: '18 findings older than 90 days without status change', affected: ['Maintenance'] },
    ];
    this._itvanomalies = types.map((a, i) => ({
      id: 'ANO-' + String(i + 1).padStart(3, '0'), type: a.type, severity: a.severity,
      description: a.desc, detected: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(2)), affected: a.affected,
    }));
  }

  // --- Trend Prediction ---
  @state() private _itvpredictions: { horizon: string; metric: string; current: number; predicted: number; direction: 'up' | 'down' | 'stable'; confidence: number }[] = [];
  private _generateItvPredictions() {
    this._itvpredictions = [
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
  @state() private _itvApprovals: { id: string; title: string; requester: string; status: 'pending' | 'approved' | 'rejected' | 'expired'; createdAt: string; priority: Priority; type: string }[] = [];
  private _initItvApprovals() {
    this._itvApprovals = [
      { id: 'APR-001', title: 'Emergency exception request for critical finding', requester: 'Alice Chen', status: 'pending', createdAt: '2026-04-23T07:00:00Z', priority: 'p1', type: 'Exception' },
      { id: 'APR-002', title: 'Extend compliance deadline for quarterly audit', requester: 'Bob Martinez', status: 'pending', createdAt: '2026-04-22T18:00:00Z', priority: 'p2', type: 'Extension' },
      { id: 'APR-003', title: 'Disable security control for system migration', requester: 'Carol Wu', status: 'rejected', createdAt: '2026-04-22T14:00:00Z', priority: 'p1', type: 'Policy Change' },
      { id: 'APR-004', title: 'New assessment approval for third-party vendor', requester: 'Dave Kim', status: 'approved', createdAt: '2026-04-21T10:00:00Z', priority: 'p3', type: 'Vendor' },
      { id: 'APR-005', title: 'Network rule change for partner integration', requester: 'Eve Johnson', status: 'expired', createdAt: '2026-04-19T08:00:00Z', priority: 'p2', type: 'Network' },
    ];
  }
  private _approveItvItem(id: string) { const item = this._itvApprovals.find(a => a.id === id); if (item) item.status = 'approved'; this.requestUpdate(); }
  private _rejectItvItem(id: string) { const item = this._itvApprovals.find(a => a.id === id); if (item) item.status = 'rejected'; this.requestUpdate(); }

  // --- Activity Feed ---
  @state() private _itvActivity: { id: string; action: string; user: string; target: string; timestamp: string }[] = [];
  private _initItvActivity() {
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
    this._itvActivity = actions.map((a, i) => ({ id: 'ACT-' + String(i + 1).padStart(3, '0'), ...a, timestamp: new Date(Date.now() - i * 3600000).toISOString() }));
  }

  // --- Notification System ---
  @state() private _itvNotifications: { id: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; read: boolean; timestamp: string }[] = [];
  private _initItvNotifications() {
    this._itvNotifications = [
      { id: 'NTF-001', message: 'Score dropped below threshold', type: 'warning', read: false, timestamp: new Date().toISOString() },
      { id: 'NTF-002', message: '3 items approaching SLA deadline within 24h', type: 'error', read: false, timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: 'NTF-003', message: 'Weekly report generated successfully', type: 'success', read: true, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'NTF-004', message: 'New framework mapped to existing controls', type: 'info', read: true, timestamp: new Date(Date.now() - 14400000).toISOString() },
    ];
  }
  private _markItvNotifRead(id: string) { const n = this._itvNotifications.find(x => x.id === id); if (n) n.read = true; this.requestUpdate(); }

  // --- Panel Configuration ---
  @state() private _itvConfig: { layout: 'compact' | 'default' | 'expanded'; theme: 'dark' | 'midnight' | 'slate'; showAnomalies: boolean; showPredictions: boolean; autoRefresh: boolean; refreshInterval: number } = {
    layout: 'default', theme: 'dark', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60,
  };
  private _itvPresets: { name: string; config: typeof this._itvConfig }[] = [
    { name: 'Analyst View', config: { layout: 'expanded', theme: 'dark', showAnomalies: true, showPredictions: false, autoRefresh: true, refreshInterval: 30 } },
    { name: 'Executive Summary', config: { layout: 'compact', theme: 'slate', showAnomalies: false, showPredictions: true, autoRefresh: false, refreshInterval: 300 } },
    { name: 'Audit Mode', config: { layout: 'expanded', theme: 'midnight', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60 } },
  ];
  private _applyItvPreset(preset: typeof this._itvPresets[0]) { this._itvConfig = { ...preset.config }; this.requestUpdate(); }

  private _renderItvTreemapSVG(): string {
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

  private _renderItvSankeySVG(): string {
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
  private _renderItvRules(): any {
    const ev = this._evaluateItvRules();
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
          $${this._itvRules.map(r => html`
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
  private _renderItvAnomalies(): any {
    const sc = (s: Severity) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Anomaly Detection</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._itvanomalies.map(a => html`
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
  private _renderItvPredictions(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Trend Predictions</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          $${this._itvpredictions.map(pr => html`
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
  private _renderItvApprovals(): any {
    const stc = (s: string) => s === 'pending' ? '#eab308' : s === 'approved' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#6b7280';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Approval Workflow</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._itvApprovals.map(a => html`
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
                  <button class="btn success" style="padding:2px 8px;font-size:9px" @click=$${() => this._approveItvItem(a.id)}>Approve</button>
                  <button class="btn error" style="padding:2px 8px;font-size:9px" @click=$${() => this._rejectItvItem(a.id)}>Reject</button>
                </div>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Activity Feed ---
  private _renderItvActivity(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Activity Feed</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto">
          $${this._itvActivity.map(a => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <div style="width:20px;height:20px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;font-size:9px">•</div>
              <div style="flex:1"><span style="font-weight:600">$${a.user}</span> $${a.action}</div>
              <span style="font-size:8px;color:#6b7280">$${new Date(a.timestamp).toLocaleTimeString()}</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Notifications ---
  private _renderItvNotifications(): any {
    const tc = (t: string) => t === 'error' ? '#ef4444' : t === 'warning' ? '#eab308' : t === 'success' ? '#22c55e' : '#3b82f6';
    const unread = this._itvNotifications.filter(n => !n.read).length;
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Notifications $${unread > 0 ? html`<span class="badge badge-error">$${unread} new</span>` : nothing}</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:120px;overflow-y:auto">
          $${this._itvNotifications.map(n => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:$${n.read ? '#1f2937' : '#252a36'};border-radius:4px;font-size:10px;opacity:$${n.read ? '0.6' : '1'};cursor:pointer" @click=$${() => this._markItvNotifRead(n.id)}>
              <span style="width:8px;height:8px;border-radius:50%;background:$${tc(n.type)}"></span>
              <span style="flex:1">$${n.message}</span>
              $${!n.read ? html`<span style="width:6px;height:6px;border-radius:50%;background:#3b82f6"></span>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Panel Config ---
  private _renderItvConfig(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Panel Configuration</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Layout</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._itvConfig.layout = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="compact" ?selected=$${this._itvConfig.layout === 'compact'}>Compact</option>
              <option value="default" ?selected=$${this._itvConfig.layout === 'default'}>Default</option>
              <option value="expanded" ?selected=$${this._itvConfig.layout === 'expanded'}>Expanded</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Theme</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._itvConfig.theme = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="dark" ?selected=$${this._itvConfig.theme === 'dark'}>Dark</option>
              <option value="midnight" ?selected=$${this._itvConfig.theme === 'midnight'}>Midnight</option>
              <option value="slate" ?selected=$${this._itvConfig.theme === 'slate'}>Slate</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Auto Refresh</span>
            <input type="checkbox" ?checked=$${this._itvConfig.autoRefresh} @change=$${() => { this._itvConfig.autoRefresh = !this._itvConfig.autoRefresh; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Anomalies</span>
            <input type="checkbox" ?checked=$${this._itvConfig.showAnomalies} @change=$${() => { this._itvConfig.showAnomalies = !this._itvConfig.showAnomalies; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Predictions</span>
            <input type="checkbox" ?checked=$${this._itvConfig.showPredictions} @change=$${() => { this._itvConfig.showPredictions = !this._itvConfig.showPredictions; this.requestUpdate(); }}/>
          </div>
          <div style="margin-top:6px;font-weight:600">Presets</div>
          <div style="display:flex;gap:4px">
            $${this._itvPresets.map(ps => html`<button class="btn" style="padding:2px 8px;font-size:9px" @click=$${() => this._applyItvPreset(ps)}>$${ps.name}</button>`)}
          </div>
        </div>
      </div>`;
  }

  render() {    if (this._itvRules.length === 0) { this._initItvRules(); this._initItvCvss(); this._runItvAnomalyDetection(); this._generateItvPredictions(); this._initItvApprovals(); this._initItvActivity(); this._initItvNotifications(); }

    const incident = this._incidents.find(i => i.id === this._selectedIncident);

    return html`
      <div class="panel">
        <div class="pt">⏱ Incident Timeline Visualization</div>
        <select class="incident-select" .value=${this._selectedIncident} @change=${(e: Event) => { this._selectedIncident = (e.target as HTMLSelectElement).value; this.requestUpdate(); }}>
          ${this._incidents.map(i => html`<option value=${i.id}>${i.title} (${i.status})</option>`)}
        </select>

        ${incident ? html`
          <div class="incident-header">
            <div class="incident-title">${incident.title} <span class="badge b-${incident.severity}">${incident.severity}</span> <span class="badge b-${incident.status}">${incident.status}</span></div>
            <div class="incident-meta">
              <span>📅 Started: ${incident.startTime}</span>
              <span>⏱ Dwell Time: ${incident.dwellTime}</span>
              <span>📊 ${incident.events.length} events</span>
            </div>
          </div>
        ` : nothing}

        <div class="tabs">
          <span class="tab ${this._tab === 'timeline' ? 'active' : ''}" @click=${() => { this._tab = 'timeline'; this.requestUpdate(); }}>Timeline</span>
          <span class="tab ${this._tab === 'impact' ? 'active' : ''}" @click=${() => { this._tab = 'impact'; this.requestUpdate(); }}>Impact</span>
          <span class="tab ${this._tab === 'evidence' ? 'active' : ''}" @click=${() => { this._tab = 'evidence'; this.requestUpdate(); }}>Evidence</span>
          <span class="tab ${this._tab === 'lessons' ? 'active' : ''}" @click=${() => { this._tab = 'lessons'; this.requestUpdate(); }}>Lessons (${this._lessonsLearned.length})</span>
          <span class="tab ${this._tab === 'comms' ? 'active' : ''}" @click=${() => { this._tab = 'comms'; this.requestUpdate(); }}>Comms</span>
          <span class="tab ${this._tab === 'costs' ? 'active' : ''}" @click=${() => { this._tab = 'costs'; this.requestUpdate(); }}>Costs</span>
          <span class="tab ${this._tab === 'report' ? 'active' : ''}" @click=${() => { this._tab = 'report'; this.requestUpdate(); }}>AAR</span>
          <span class="tab ${this._tab === 'history' ? 'active' : ''}" @click=${() => { this._tab = 'history'; this.requestUpdate(); }}>History</span>
          <span class="tab ${this._tab === 'audit' ? 'active' : ''}" @click=${() => { this._tab = 'audit'; this.requestUpdate(); }}>Audit</span>
          <span class="tab ${this._tab === 'settings' ? 'active' : ''}" @click=${() => { this._tab = 'settings'; this.requestUpdate(); }}>Settings</span>
          <span class="tab ${this._tab === 'analytics' ? 'active' : ''}" @click=${() => { this._tab = 'analytics'; this.requestUpdate(); }}>Analytics</span>
        </div>

        ${this._tab === 'timeline' ? html`${this._renderTimeline()}${this._renderAttackGraph()}${this._renderKillChain()}${this._renderCommentSection()}` : ''}
        ${this._tab === 'impact' ? html`${this._renderImpact()}${this._renderHeatmapViz()}` : ''}
        ${this._tab === 'evidence' ? this._renderEvidence() : ''}
        ${this._tab === 'lessons' ? this._renderLessons() : ''}
        ${this._tab === 'comms' ? this._renderComms() : ''}
        ${this._tab === 'costs' ? this._renderCosts() : ''}
        ${this._tab === 'report' ? this._renderReport() : ''}
        ${this._tab === 'history' ? this._renderExecHistory() : ''}
        ${this._tab === 'audit' ? this._renderAuditPanel() : ''}
        ${this._tab === 'settings' ? this._renderSettingsPanel() : ''}
        ${this._tab === 'analytics' ? this._renderAnalyticsTab() : ''}

        ${this._renderNotifications()}
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


  // === SCENARIO SIMULATION ENGINE ===
  @state() private _incScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _incScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _incScenarioCompare: boolean = false;
  @state() private _incScenarioSelected: string[] = [];

  private _incInitScenarios(): void {
    const saved = localStorage.getItem('inc_scenarios');
    if (saved) { try { this._incScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._incScenarios.length === 0) {
      this._incScenarios = [
        {id:'inc-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'inc-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'inc-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _incSaveScenarios(): void {
    localStorage.setItem('inc_scenarios', JSON.stringify(this._incScenarios));
  }

  private _incAddScenario(): void {
    const f = this._incScenarioForm;
    if (!f.attackType || !f.target) return;
    this._incScenarios = [...this._incScenarios, {
      id: 'inc-s' + (this._incScenarios.length + 1),
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
    this._incScenarioForm = {attackType:'',target:'',method:''};
    this._incSaveScenarios();
  }

  private _incRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._incScenarioCompare = !this._incScenarioCompare; }}>${this._incScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._incScenarioForm = {...this._incScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._incScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._incScenarioForm = {...this._incScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._incScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._incScenarioForm = {...this._incScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._incScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._incAddScenario}>Run Simulation</button>
      </div>
      ${this._incScenarioCompare && this._incScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._incScenarios.length)},1fr);gap:8px">
            ${this._incScenarios.slice(0,3).map(s => html`
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
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._incScenarios.length})</div>
        ${this._incScenarios.map(s => html`
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
  @state() private _incTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _incTrendZoom: {start:number;end:number} | null = null;
  @state() private _incTrendMA: number = 7;

  private _incInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._incTrendData = data;
  }

  private _incCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._incTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._incTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _incGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._incTrendData.map(d => d.value);
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

  private _incRenderTimeSeries(): any {
    const stats = this._incGetStats();
    const filtered = this._incTrendZoom ? this._incTrendData.filter(d => d.day >= this._incTrendZoom.start && d.day <= this._incTrendZoom.end) : this._incTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._incTrendMA === 7 ? 'active' : ''}" @click=${() => { this._incTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._incTrendMA === 30 ? 'active' : ''}" @click=${() => { this._incTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._incTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._incTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
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
  @state() private _incRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _incActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _incPermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _incPermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _incPermCompare: string[] = [];

  private _incInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._incRoles) {
      perms[role] = {};
      this._incActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._incPermissions = perms;
  }

  private _incTogglePermission(role: string, action: string): void {
    const old = this._incPermissions[role][action];
    this._incPermissions = {...this._incPermissions, [role]: {...this._incPermissions[role], [action]: !old}};
    this._incPermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _incRenderRBAC(): any {
    const compareRoles = this._incPermCompare.map(r => this._incPermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._incRoles.map(r => html`
              <button class="tab ${this._incPermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._incPermCompare = this._incPermCompare.includes(r) ? this._incPermCompare.filter(x => x !== r) : [...this._incPermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._incActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._incRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._incActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._incPermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._incTogglePermission(role, action)}>${this._incPermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._incPermCompare.join(' vs ')}</div>
            ${this._incActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._incPermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._incPermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._incPermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _incReportTemplate: string = 'executive';
  @state() private _incReportSchedule: string = 'weekly';
  @state() private _incReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _incReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _incGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._incReportHistory.unshift({id,template:this._incReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _incRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._incReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._incReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._incReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._incReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._incReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._incReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._incGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._incReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._incReportHistory.slice(0,3).map(r => html`
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
  @state() private _incHighContrast: boolean = false;
  @state() private _incA11yAnnounce: string = '';
  @state() private _incShortcutsVisible: boolean = false;
  @state() private _incFocusTrap: boolean = false;

  private _incShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _incHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._incFocusTrap) { this._incFocusTrap = false; this._incAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._incHighContrast = !this._incHighContrast; this._incAnnounce('High contrast ' + (this._incHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._incShortcutsVisible = !this._incShortcutsVisible; }
  }

  private _incAnnounce(msg: string): void {
    this._incA11yAnnounce = msg;
    setTimeout(() => { this._incA11yAnnounce = ''; }, 2000);
  }

  private _incRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._incShortcutsVisible ? 'active' : ''}" @click=${() => { this._incShortcutsVisible = !this._incShortcutsVisible; }} aria-expanded=${this._incShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._incHighContrast} @change=${() => { this._incHighContrast = !this._incHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._incShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._incShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._incA11yAnnounce}</div>
      </div>
    `;
  }


  // === TAB INTEGRATION FOR EXTENDED FEATURES ===
  @state() private _incActiveSubTab: string = 'scenario';



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
        { id: 't4', name: 'Data injection in incident response', stride: 'T', likelihood: 7, impact: 8, dreadScore: 7.0, status: 'open', mitigations: ['Input validation', 'WAF rules'], assignedTo: 'Dev Team', discoveredDate: '2024-01-08', lastReviewed: '2024-02-10' },
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

  private _incGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _incRenderSubPanel(): any {
    switch (this._incActiveSubTab) {
      case 'scenario': return this._incRenderScenarioEngine();
      case 'timeseries': return this._incRenderTimeSeries();
      case 'rbac': return this._incRenderRBAC();
      case 'reporting': return this._incRenderReporting();
      case 'a11y': return this._incRenderAccessibility();
      default: return nothing;
    }
  }

  private _incRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._incGetAllSubTabs().map(t => html`
          <button class="tab ${this._incActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._incActiveSubTab = t.key; }} role="tab" aria-selected=${this._incActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="inc-tab-${this._incActiveSubTab}">
        ${this._incRenderSubPanel()}
      </div>
    `;
  }

  // === SECTION F: SOAR Playbook Automation ===
  @state() private _soarPlaybooks: Array<{
    id: string; name: string; status: 'active' | 'draft' | 'disabled' | 'running';
    steps: Array<{ id: string; action: string; condition?: string; order: number; type: 'scan' | 'analyze' | 'alert' | 'contain' | 'remediate' | 'notify'; enabled: boolean; executedAt?: string; result?: string; duration?: number }>;
    triggerType: 'threat-level' | 'ioc-match' | 'schedule' | 'manual' | 'vuln-scan';
    triggerThreshold: number; totalRuns: number; lastRun: string;
    autoResolved: number; manualOverrides: number; avgDuration: number;
    created: string; author: string; tags: string[];
  }> = [
    {
      id: 'pb-soar-001', name: 'Incident Timeline Viz Auto Response', status: 'active',
      steps: [
        { id: 's1', action: 'Scan for indicators', type: 'scan', order: 1, enabled: true, executedAt: '2026-04-22T08:00:00Z', result: '12 indicators found', duration: 4.2 },
        { id: 's2', action: 'Analyze severity', condition: 'if threat_level > 7 then proceed', type: 'analyze', order: 2, enabled: true, executedAt: '2026-04-22T08:01:00Z', result: 'Critical severity detected', duration: 2.1 },
        { id: 's3', action: 'Alert SOC team', type: 'alert', order: 3, enabled: true, executedAt: '2026-04-22T08:02:00Z', result: 'Alert sent to 5 analysts', duration: 0.5 },
        { id: 's4', action: 'Contain threat', type: 'contain', order: 4, enabled: true, executedAt: '2026-04-22T08:05:00Z', result: 'Isolated 3 hosts', duration: 12.8 },
        { id: 's5', action: 'Remediate findings', condition: 'if auto_resolve_enabled then auto_fix', type: 'remediate', order: 5, enabled: true, executedAt: '2026-04-22T08:10:00Z', result: '8 of 12 findings resolved', duration: 25.3 },
        { id: 's6', action: 'Notify stakeholders', type: 'notify', order: 6, enabled: true, executedAt: '2026-04-22T08:15:00Z', result: 'Email sent to CISO', duration: 0.3 },
      ],
      triggerType: 'threat-level', triggerThreshold: 7, totalRuns: 342, lastRun: '2026-04-22T08:15:00Z',
      autoResolved: 218, manualOverrides: 124, avgDuration: 45.2,
      created: '2026-01-15T10:00:00Z', author: 'SOC Automation', tags: ['automated', 'critical', 'response'],
    },
    {
      id: 'pb-soar-002', name: 'Incident Timeline Viz Investigation Workflow', status: 'active',
      steps: [
        { id: 's1', action: 'Collect evidence', type: 'scan', order: 1, enabled: true, executedAt: '2026-04-21T14:00:00Z', result: 'Evidence collected from 7 sources', duration: 8.5 },
        { id: 's2', action: 'Correlate events', type: 'analyze', order: 2, enabled: true, executedAt: '2026-04-21T14:05:00Z', result: '23 events correlated', duration: 5.2 },
        { id: 's3', action: 'Escalate if needed', condition: 'if confidence > 85 then escalate', type: 'alert', order: 3, enabled: true },
        { id: 's4', action: 'Document findings', type: 'remediate', order: 4, enabled: true, executedAt: '2026-04-21T14:20:00Z', result: 'Report generated', duration: 3.1 },
      ],
      triggerType: 'ioc-match', triggerThreshold: 3, totalRuns: 156, lastRun: '2026-04-21T14:20:00Z',
      autoResolved: 89, manualOverrides: 67, avgDuration: 28.7,
      created: '2026-02-01T09:00:00Z', author: 'Threat Intel Team', tags: ['investigation', 'forensics'],
    },
    {
      id: 'pb-soar-003', name: 'Incident Timeline Viz Compliance Scan', status: 'draft',
      steps: [
        { id: 's1', action: 'Run compliance checks', type: 'scan', order: 1, enabled: true },
        { id: 's2', action: 'Map to controls', type: 'analyze', order: 2, enabled: true },
        { id: 's3', action: 'Generate compliance report', type: 'notify', order: 3, enabled: true },
      ],
      triggerType: 'schedule', triggerThreshold: 0, totalRuns: 0, lastRun: 'N/A',
      autoResolved: 0, manualOverrides: 0, avgDuration: 0,
      created: '2026-04-20T16:00:00Z', author: 'GRC Team', tags: ['compliance', 'audit', 'scheduled'],
    },
  ];
  @state() private _soarSelectedPlaybook: string = '';
  @state() private _soarMetrics: {
    actionsPerHour: number; autoResolveRate: number; avgResponseTime: number;
    activePlaybooks: number; totalActionsToday: number; errorRate: number;
    manualInterventions: number; escalationRate: number;
  } = {
    actionsPerHour: 47.3, autoResolveRate: 73.8, avgResponseTime: 12.4,
    activePlaybooks: 3, totalActionsToday: 284, errorRate: 2.1,
    manualInterventions: 18, escalationRate: 8.5,
  };
  @state() private _soarDragStep: string | null = null;

  private _renderSoarPlaybookBuilder(): any {
    const selected = this._soarPlaybooks.find(p => p.id === this._soarSelectedPlaybook);
    return html`
      <div style="padding:12px;background:#0a0c10;border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">SOAR Playbook Automation</span>
          <div style="display:flex;gap:6px;align-items:center">
            <span class="tag" style="background:#1e3a5f;color:#60a5fa;font-size:9px">${this._soarMetrics.actionsPerHour} actions/hr</span>
            <span class="tag" style="background:#14532d;color:#22c55e;font-size:9px">${this._soarMetrics.autoResolveRate}% auto-resolved</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div style="background:#111827;border-radius:6px;padding:8px;text-align:center">
            <div style="font-size:18px;font-weight:700;color:#60a5fa">${this._soarMetrics.totalActionsToday}</div>
            <div style="font-size:9px;color:#6b7280">Actions Today</div>
          </div>
          <div style="background:#111827;border-radius:6px;padding:8px;text-align:center">
            <div style="font-size:18px;font-weight:700;color:#22c55e">${this._soarMetrics.avgResponseTime}s</div>
            <div style="font-size:9px;color:#6b7280">Avg Response</div>
          </div>
          <div style="background:#111827;border-radius:6px;padding:8px;text-align:center">
            <div style="font-size:18px;font-weight:700;color:#f59e0b">${this._soarMetrics.errorRate}%</div>
            <div style="font-size:9px;color:#6b7280">Error Rate</div>
          </div>
          <div style="background:#111827;border-radius:6px;padding:8px;text-align:center">
            <div style="font-size:18px;font-weight:700;color:#ef4444">${this._soarMetrics.escalationRate}%</div>
            <div style="font-size:9px;color:#6b7280">Escalation Rate</div>
          </div>
        </div>
        <div style="font-weight:600;font-size:11px;color:#9ca3af;text-transform:uppercase;margin-bottom:6px">Playbooks</div>
        ${this._soarPlaybooks.map(pb => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#111827;border-radius:4px;margin-bottom:3px;cursor:pointer;border:1px solid ${selected?.id === pb.id ? '#3b82f6' : 'transparent'}"
               @click=${() => { this._soarSelectedPlaybook = selected?.id === pb.id ? '' : pb.id; }}
               @dragover=${(e: any) => { e.preventDefault(); this._soarDragStep = pb.id; }}
               @dragleave=${() => { this._soarDragStep = null; }}
               @drop=${(e: any) => { e.preventDefault(); this._soarDragStep = null; }}>
            <span style="color:${pb.status === 'active' ? '#22c55e' : pb.status === 'running' ? '#3b82f6' : pb.status === 'draft' ? '#f59e0b' : '#6b7280'}">${pb.status === 'active' ? '●' : pb.status === 'running' ? '◉' : pb.status === 'draft' ? '◐' : '○'}</span>
            <span style="flex:1;color:#e2e8f0;font-size:10px">${pb.name}</span>
            <span class="tag" style="font-size:8px">${pb.triggerType}</span>
            <span style="color:#6b7280;font-size:9px">${pb.totalRuns} runs</span>
            <span style="color:#22c55e;font-size:9px">${pb.autoResolved}% auto</span>
          </div>
        `)}
        ${selected ? html`
          <div style="margin-top:10px;background:#111827;border-radius:6px;padding:10px">
            <div style="font-weight:600;font-size:11px;color:#e2e8f0;margin-bottom:8px">${selected.name} - Steps (drag to reorder)</div>
            ${selected.steps.sort((a, b) => a.order - b.order).map((step, idx) => html`
              <div style="display:flex;align-items:center;gap:6px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px;font-size:10px;cursor:grab;border-left:3px solid ${step.type === 'scan' ? '#3b82f6' : step.type === 'analyze' ? '#8b5cf6' : step.type === 'alert' ? '#f59e0b' : step.type === 'contain' ? '#ef4444' : step.type === 'remediate' ? '#22c55e' : '#06b6d4'}"
                   draggable="true"
                   @dragstart=${(e: any) => { e.dataTransfer.setData('text/plain', step.id); }}
                   @drop=${(e: any) => { e.preventDefault(); const fromId = e.dataTransfer.getData('text/plain'); if (fromId && fromId !== step.id) { const pb = this._soarPlaybooks.find(p => p.id === selected.id); if (pb) { const fromIdx = pb.steps.findIndex(s => s.id === fromId); if (fromIdx >= 0) { const temp = pb.steps[fromIdx].order; pb.steps[fromIdx].order = step.order; step.order = temp; this.requestUpdate(); }} } }}>
                <span style="color:#6b7280;font-weight:700">${idx + 1}</span>
                <span style="color:${step.enabled ? '#22c55e' : '#6b7280'}">${step.enabled ? '✓' : '○'}</span>
                <span style="flex:1;color:#e2e8f0">${step.action}</span>
                ${step.condition ? html`<span style="color:#f59e0b;font-size:8px;font-style:italic">${step.condition}</span>` : nothing}
                ${step.duration ? html`<span style="color:#6b7280">${step.duration}s</span>` : nothing}
                <button class="btn btn-sm" style="font-size:8px">Override</button>
              </div>
            `)}
            <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid #1f2937">
              <span style="font-size:9px;color:#6b7280">Avg duration: ${selected.avgDuration}s | Manual overrides: ${selected.manualOverrides}</span>
              <button class="btn btn-sm" style="font-size:9px;background:#1e3a5f">Execute Playbook</button>
            </div>
          </div>
        ` : nothing}
      </div>`;
  }

  // === SECTION G: Threat Intelligence Feed ===
  @state() private _tiFeeds: Array<{
    id: string; name: string; status: 'healthy' | 'degraded' | 'down'; type: 'STIX' | 'TAXII' | 'CSV' | 'API' | 'RSS';
    iocsPerHour: number; lastPoll: string; totalIndicators: number;
    reliability: number; coverage: string;
  }> = [
    { id: 'tf-001', name: 'MITRE ATT&CK Feed', status: 'healthy', type: 'STIX', iocsPerHour: 23.5, lastPoll: '2026-04-22T09:30:00Z', totalIndicators: 245000, reliability: 98.2, coverage: 'TTPs, Software, Groups' },
    { id: 'tf-002', name: 'AlienVault OTX', status: 'healthy', type: 'API', iocsPerHour: 145.7, lastPoll: '2026-04-22T09:29:00Z', totalIndicators: 1820000, reliability: 85.4, coverage: 'IPs, Domains, Hashes, URLs' },
    { id: 'tf-003', name: 'AbuseIPDB', status: 'degraded', type: 'API', iocsPerHour: 89.3, lastPoll: '2026-04-22T09:25:00Z', totalIndicators: 560000, reliability: 91.7, coverage: 'IPs, ASN' },
    { id: 'tf-004', name: 'MISP Community', status: 'healthy', type: 'TAXII', iocsPerHour: 67.8, lastPoll: '2026-04-22T09:28:00Z', totalIndicators: 890000, reliability: 88.9, coverage: 'Composite IOCs, Malware' },
    { id: 'tf-005', name: 'VirusTotal Live', status: 'down', type: 'API', iocsPerHour: 0, lastPoll: '2026-04-22T08:00:00Z', totalIndicators: 0, reliability: 0, coverage: 'Hashes, URLs, Domains' },
  ];
  @state() private _tiIndicators: Array<{
    id: string; value: string; type: 'ip' | 'domain' | 'hash' | 'email' | 'url';
    severity: 'critical' | 'high' | 'medium' | 'low'; lifecycle: 'new' | 'verified' | 'aging' | 'expired';
    source: string; firstSeen: string; lastSeen: string; confidence: number;
    tags: string[]; description: string; hitCount: number;
  }> = [
    { id: 'ioc-001', value: '192.168.45.102', type: 'ip', severity: 'critical', lifecycle: 'verified', source: 'MITRE ATT&CK', firstSeen: '2026-04-15T06:00:00Z', lastSeen: '2026-04-22T08:30:00Z', confidence: 95, tags: ['c2', 'apt28'], description: 'Known APT28 command and control server', hitCount: 342 },
    { id: 'ioc-002', value: 'evil-phishing-login.com', type: 'domain', severity: 'high', lifecycle: 'new', source: 'AlienVault OTX', firstSeen: '2026-04-22T07:00:00Z', lastSeen: '2026-04-22T09:00:00Z', confidence: 82, tags: ['phishing', 'credential-theft'], description: 'Credential harvesting domain mimicking corporate login', hitCount: 56 },
    { id: 'ioc-003', value: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', type: 'hash', severity: 'critical', lifecycle: 'verified', source: 'VirusTotal', firstSeen: '2026-03-01T12:00:00Z', lastSeen: '2026-04-20T15:00:00Z', confidence: 99, tags: ['ransomware', 'lockbit'], description: 'LockBit 4.0 ransomware payload', hitCount: 1287 },
    { id: 'ioc-004', value: 'attacker@evilcorp.net', type: 'email', severity: 'medium', lifecycle: 'aging', source: 'MISP', firstSeen: '2026-02-10T09:00:00Z', lastSeen: '2026-03-15T14:00:00Z', confidence: 71, tags: ['spear-phishing', 'social-engineering'], description: 'Spear phishing sender address linked to Evil Corp', hitCount: 23 },
    { id: 'ioc-005', value: 'https://malware-distribution.ru/payload.exe', type: 'url', severity: 'critical', lifecycle: 'new', source: 'AbuseIPDB', firstSeen: '2026-04-22T01:00:00Z', lastSeen: '2026-04-22T09:00:00Z', confidence: 88, tags: ['malware', 'drive-by'], description: 'Active malware distribution URL serving Cobalt Strike beacon', hitCount: 189 },
    { id: 'ioc-006', value: '10.0.15.200', type: 'ip', severity: 'low', lifecycle: 'expired', source: 'Internal', firstSeen: '2026-01-05T08:00:00Z', lastSeen: '2026-02-28T18:00:00Z', confidence: 45, tags: ['internal', 'resolved'], description: 'Previously compromised internal host, now remediated', hitCount: 0 },
  ];
  @state() private _tiActors: Array<{
    id: string; name: string; aliases: string[]; sophistication: 'advanced' | 'intermediate' | 'basic';
    motivation: string; origin: string; ttpCount: number; activeSince: string;
    associatedIocs: number; lastActivity: string; description: string;
  }> = [
    { id: 'ta-001', name: 'APT28 (Fancy Bear)', aliases: ['Sofacy', 'Sednit', 'Strontium'], sophistication: 'advanced', motivation: 'Espionage', origin: 'Russia', ttpCount: 42, activeSince: '2007', associatedIocs: 1250, lastActivity: '2026-04-22T08:00:00Z', description: 'Russian GRU-linked group targeting government and military organizations' },
    { id: 'ta-002', name: 'Lazarus Group', aliases: ['Hidden Cobra', 'Diamond Sleet'], sophistication: 'advanced', motivation: 'Financial', origin: 'DPRK', ttpCount: 38, activeSince: '2009', associatedIocs: 980, lastActivity: '2026-04-21T16:00:00Z', description: 'North Korean state-sponsored group targeting financial institutions and cryptocurrency' },
  ];
  @state() private _tiFilterType: string = 'all';
  @state() private _tiFilterLifecycle: string = 'all';

  private _renderThreatIntelFeed(): any {
    const filtered = this._tiIndicators.filter(i => {
      if (this._tiFilterType !== 'all' && i.type !== this._tiFilterType) return false;
      if (this._tiFilterLifecycle !== 'all' && i.lifecycle !== this._tiFilterLifecycle) return false;
      return true;
    });
    return html`
      <div style="padding:12px;background:#0a0c10;border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Threat Intelligence Feed</span>
          <div style="display:flex;gap:4px">
            <select style="background:#111827;border:1px solid #374151;color:#9ca3af;font-size:9px;padding:2px 4px;border-radius:3px" @change=${(e: any) => { this._tiFilterType = e.target.value; }}>
              <option value="all">All Types</option>
              <option value="ip">IP</option><option value="domain">Domain</option><option value="hash">Hash</option>
              <option value="email">Email</option><option value="url">URL</option>
            </select>
            <select style="background:#111827;border:1px solid #374151;color:#9ca3af;font-size:9px;padding:2px 4px;border-radius:3px" @change=${(e: any) => { this._tiFilterLifecycle = e.target.value; }}>
              <option value="all">All Lifecycle</option>
              <option value="new">New</option><option value="verified">Verified</option>
              <option value="aging">Aging</option><option value="expired">Expired</option>
            </select>
          </div>
        </div>
        <div style="font-weight:600;font-size:11px;color:#9ca3af;text-transform:uppercase;margin-bottom:6px">Feed Health (STIX/TAXII)</div>
        ${this._tiFeeds.map(feed => html`
          <div style="display:flex;align-items:center;gap:6px;padding:4px 6px;background:#111827;border-radius:3px;margin-bottom:2px;font-size:9px">
            <span style="color:${feed.status === 'healthy' ? '#22c55e' : feed.status === 'degraded' ? '#f59e0b' : '#ef4444'}">${feed.status === 'healthy' ? '●' : feed.status === 'degraded' ? '◐' : '✕'}</span>
            <span style="flex:1;color:#e2e8f0">${feed.name}</span>
            <span class="tag" style="font-size:7px">${feed.type}</span>
            <span style="color:#6b7280">${feed.iocsPerHour} IOC/hr</span>
            <span style="color:#6b7280">${feed.reliability}%</span>
          </div>
        `)}
        <div style="font-weight:600;font-size:11px;color:#9ca3af;text-transform:uppercase;margin:10px 0 6px">IOC Indicators (${filtered.length})</div>
        ${filtered.slice(0, 6).map(ioc => html`
          <div style="display:flex;align-items:center;gap:6px;padding:4px 6px;background:#111827;border-radius:3px;margin-bottom:2px;font-size:9px">
            <span class="tag" style="font-size:7px;background:${ioc.type === 'ip' ? '#1e3a5f' : ioc.type === 'domain' ? '#3b1f4a' : ioc.type === 'hash' ? '#1a3a2a' : ioc.type === 'email' ? '#3a2a1a' : '#1a2a3a'};color:${ioc.type === 'ip' ? '#60a5fa' : ioc.type === 'domain' ? '#a78bfa' : ioc.type === 'hash' ? '#22c55e' : ioc.type === 'email' ? '#f59e0b' : '#06b6d4'}">${ioc.type}</span>
            <span style="flex:1;color:#e2e8f0;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ioc.value}</span>
            <span style="color:${ioc.lifecycle === 'new' ? '#22c55e' : ioc.lifecycle === 'verified' ? '#60a5fa' : ioc.lifecycle === 'aging' ? '#f59e0b' : '#6b7280'};font-size:8px">${ioc.lifecycle}</span>
            <span style="color:${ioc.severity === 'critical' ? '#ef4444' : ioc.severity === 'high' ? '#f59e0b' : '#6b7280'};font-size:8px">${ioc.confidence}%</span>
            <span style="color:#6b7280">${ioc.hitCount} hits</span>
          </div>
        `)}
        <div style="font-weight:600;font-size:11px;color:#9ca3af;text-transform:uppercase;margin:10px 0 6px">Threat Actors</div>
        ${this._tiActors.map(actor => html`
          <div style="padding:6px;background:#111827;border-radius:4px;margin-bottom:3px;border-left:3px solid ${actor.sophistication === 'advanced' ? '#ef4444' : actor.sophistication === 'intermediate' ? '#f59e0b' : '#22c55e'}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:600;color:#e2e8f0;font-size:10px">${actor.name}</span>
              <span class="tag" style="font-size:8px;background:#3b1f2a;color:#f87171">${actor.sophistication}</span>
            </div>
            <div style="font-size:9px;color:#6b7280;margin-top:2px">${actor.aliases.join(', ')} | ${actor.origin} | ${actor.motivation}</div>
            <div style="font-size:9px;color:#9ca3af;margin-top:2px">${actor.description}</div>
            <div style="display:flex;gap:8px;margin-top:3px;font-size:8px;color:#6b7280">
              <span>${actor.ttpCount} TTPs</span>
              <span>${actor.associatedIocs} IOCs</span>
              <span>Since ${actor.activeSince}</span>
              <span>Last: ${actor.lastActivity.split('T')[0]}</span>
            </div>
          </div>
        `)}
      </div>`;
  }

  // === SECTION H: Vulnerability Lifecycle Pipeline ===
  @state() private _vulnPipeline: Array<{
    id: string; title: string; severity: 'critical' | 'high' | 'medium' | 'low';
    stage: 'discovery' | 'triage' | 'patch' | 'verify' | 'closed';
    cvssBase: number; cvssTemporal: number; cvssEnvironmental: number;
    cve: string; component: string; discovered: string; daysOpen: number;
    slaDeadline: string; patchProgress: number; environments: Array<{ name: string; status: 'pending' | 'patching' | 'verified' | 'failed'; progress: number }>;
    recurrence: number; assignee: string; notes: string;
  }> = [
    { id: 'vl-001', title: 'Apache Log4j RCE', severity: 'critical', stage: 'verify', cvssBase: 10.0, cvssTemporal: 9.8, cvssEnvironmental: 9.5, cve: 'CVE-2026-44228', component: 'log4j-core 2.14.1', discovered: '2026-04-10T08:00:00Z', daysOpen: 12, slaDeadline: '2026-04-17T08:00:00Z', patchProgress: 75, environments: [{ name: 'dev', status: 'verified', progress: 100 }, { name: 'staging', status: 'patching', progress: 80 }, { name: 'prod', status: 'pending', progress: 0 }], recurrence: 0, assignee: 'Alice Chen', notes: 'Critical RCE in logging library, all environments must be patched' },
    { id: 'vl-002', title: 'Spring4Shell Path Traversal', severity: 'high', stage: 'patch', cvssBase: 9.8, cvssTemporal: 9.0, cvssEnvironmental: 8.7, cve: 'CVE-2026-22965', component: 'spring-web 5.3.18', discovered: '2026-04-15T12:00:00Z', daysOpen: 7, slaDeadline: '2026-04-22T12:00:00Z', patchProgress: 40, environments: [{ name: 'dev', status: 'patching', progress: 60 }, { name: 'staging', status: 'pending', progress: 0 }, { name: 'prod', status: 'pending', progress: 0 }], recurrence: 1, assignee: 'Bob Smith', notes: 'Second occurrence of this vulnerability class' },
    { id: 'vl-003', title: 'JWT Secret Weakness', severity: 'medium', stage: 'triage', cvssBase: 7.5, cvssTemporal: 7.0, cvssEnvironmental: 6.8, cve: 'CVE-2026-31001', component: 'jsonwebtoken 8.5.1', discovered: '2026-04-20T09:00:00Z', daysOpen: 2, slaDeadline: '2026-04-27T09:00:00Z', patchProgress: 0, environments: [{ name: 'dev', status: 'pending', progress: 0 }, { name: 'staging', status: 'pending', progress: 0 }, { name: 'prod', status: 'pending', progress: 0 }], recurrence: 0, assignee: 'Carol Wu', notes: 'Algorithm confusion allows token forgery' },
    { id: 'vl-004', title: 'Outdated OpenSSL Version', severity: 'high', stage: 'discovery', cvssBase: 8.1, cvssTemporal: 7.8, cvssEnvironmental: 7.5, cve: 'CVE-2026-38000', component: 'openssl 1.1.1k', discovered: '2026-04-22T06:00:00Z', daysOpen: 0, slaDeadline: '2026-04-29T06:00:00Z', patchProgress: 0, environments: [{ name: 'dev', status: 'pending', progress: 0 }, { name: 'staging', status: 'pending', progress: 0 }, { name: 'prod', status: 'pending', progress: 0 }], recurrence: 2, assignee: 'Unassigned', notes: 'Multiple known vulnerabilities in current version' },
    { id: 'vl-005', title: 'XSS in User Dashboard', severity: 'low', stage: 'closed', cvssBase: 4.3, cvssTemporal: 4.0, cvssEnvironmental: 3.8, cve: 'CVE-2026-40123', component: 'dashboard-ui 3.2.0', discovered: '2026-04-01T14:00:00Z', daysOpen: 21, slaDeadline: '2026-04-15T14:00:00Z', patchProgress: 100, environments: [{ name: 'dev', status: 'verified', progress: 100 }, { name: 'staging', status: 'verified', progress: 100 }, { name: 'prod', status: 'verified', progress: 100 }], recurrence: 0, assignee: 'Dave Park', notes: 'Reflected XSS via unsanitized user input, fixed with input validation' },
  ];
  @state() private _vulnFilterStage: string = 'all';

  private _renderVulnLifecyclePipeline(): any {
    const stages = ['discovery', 'triage', 'patch', 'verify', 'closed'] as const;
    const stageColors: Record<string, string> = { discovery: '#f59e0b', triage: '#3b82f6', patch: '#8b5cf6', verify: '#06b6d4', closed: '#22c55e' };
    const filtered = this._vulnPipeline.filter(v => this._vulnFilterStage === 'all' || v.stage === this._vulnFilterStage);
    return html`
      <div style="padding:12px;background:#0a0c10;border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Vulnerability Lifecycle Pipeline</span>
          <div style="display:flex;gap:4px">
            ${stages.map(s => html`
              <button class="btn btn-sm" style="font-size:8px;background:${this._vulnFilterStage === s ? stageColors[s] : '#111827'};color:${this._vulnFilterStage === s ? '#000' : '#9ca3af'};border:1px solid ${stageColors[s]}"
                      @click=${() => { this._vulnFilterStage = this._vulnFilterStage === s ? 'all' : s; }}
              >${s} (${this._vulnPipeline.filter(v => v.stage === s).length})</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:4px;margin-bottom:10px;align-items:center">
          ${stages.map((s, i) => html`
            <span style="flex:1;text-align:center;font-size:8px;font-weight:600;color:${stageColors[s]};text-transform:uppercase;padding:3px;background:${stageColors[s]}22;border-radius:3px">${s}</span>
            ${i < stages.length - 1 ? html`<span style="color:#374151">→</span>` : nothing}
          `)}
        </div>
        ${filtered.map(v => html`
          <div style="padding:8px;background:#111827;border-radius:6px;margin-bottom:4px;border-left:3px solid ${stageColors[v.stage]}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <span style="font-weight:600;color:#e2e8f0;font-size:10px">${v.title}</span>
                <span style="color:#6b7280;font-size:9px;margin-left:6px">${v.cve}</span>
              </div>
              <div style="display:flex;gap:4px;align-items:center">
                <span class="tag" style="font-size:8px;background:${v.severity === 'critical' ? '#3b1f2a' : v.severity === 'high' ? '#3b2a1a' : v.severity === 'medium' ? '#3b3a1a' : '#1a3a2a'};color:${v.severity === 'critical' ? '#f87171' : v.severity === 'high' ? '#f59e0b' : v.severity === 'medium' ? '#fbbf24' : '#22c55e'}">${v.severity}</span>
                <span style="color:#6b7280;font-size:9px">${v.daysOpen}d open</span>
              </div>
            </div>
            <div style="font-size:9px;color:#6b7280;margin-top:3px">${v.component} | ${v.assignee}</div>
            <div style="display:flex;gap:6px;margin-top:4px;font-size:9px">
              <span style="color:#9ca3af">CVSS: <span style="color:#e2e8f0">${v.cvssBase}</span> / <span style="color:#60a5fa">${v.cvssTemporal}</span> / <span style="color:#22c55e">${v.cvssEnvironmental}</span></span>
              <span style="color:#6b7280">SLA: ${v.slaDeadline.split('T')[0]}</span>
              ${v.recurrence > 0 ? html`<span style="color:#f59e0b">Recurrence: ${v.recurrence}x</span>` : nothing}
            </div>
            <div style="display:flex;gap:4px;margin-top:4px">
              ${v.environments.map(env => html`
                <div style="flex:1;padding:3px;background:#0a0c10;border-radius:3px;text-align:center;font-size:8px">
                  <div style="color:#6b7280">${env.name}</div>
                  <div style="margin-top:2px;height:3px;background:#1f2937;border-radius:2px;overflow:hidden">
                    <div style="height:100%;width:${env.progress}%;background:${env.status === 'verified' ? '#22c55e' : env.status === 'patching' ? '#3b82f6' : env.status === 'failed' ? '#ef4444' : '#374151'};border-radius:2px"></div>
                  </div>
                  <div style="color:${env.status === 'verified' ? '#22c55e' : env.status === 'patching' ? '#3b82f6' : env.status === 'failed' ? '#ef4444' : '#6b7280'};margin-top:1px">${env.status}</div>
                </div>
              `)}
            </div>
          </div>
        `)}
      </div>`;
  }

  // === SECTION I: Custom Widget Builder ===
  @state() private _widgetBuilderOpen = false;
  @state() private _customWidgets: Array<{
    id: string; name: string; type: 'chart' | 'table' | 'metric' | 'status';
    dataSource: string; config: Record<string, any>; layout: string;
    shared: boolean; sharedWith: string[]; createdAt: string; updatedAt: string;
  }> = [
    { id: 'cw-001', name: 'Risk Trend Widget', type: 'chart', dataSource: 'risk-assessment', config: { chartType: 'line', xField: 'date', yField: 'score', colorScheme: 'red-to-green' }, layout: 'top-left', shared: true, sharedWith: ['risk-team', 'ciso-dashboard'], createdAt: '2026-03-15T10:00:00Z', updatedAt: '2026-04-20T14:00:00Z' },
    { id: 'cw-002', name: 'Alert Summary', type: 'metric', dataSource: 'alerts', config: { metric: 'count', aggregation: 'sum', threshold: 100, warningAt: 80 }, layout: 'top-right', shared: false, sharedWith: [], createdAt: '2026-03-20T09:00:00Z', updatedAt: '2026-04-22T08:00:00Z' },
    { id: 'cw-003', name: 'Compliance Status', type: 'status', dataSource: 'compliance', config: { controls: ['access-control', 'encryption', 'logging'], showPercentage: true }, layout: 'bottom-left', shared: true, sharedWith: ['compliance-team'], createdAt: '2026-04-01T11:00:00Z', updatedAt: '2026-04-21T16:00:00Z' },
    { id: 'cw-004', name: 'Finding Details Table', type: 'table', dataSource: 'findings', config: { columns: ['id', 'title', 'severity', 'status', 'assignee'], sortable: true, filterable: true, pageSize: 10 }, layout: 'bottom-right', shared: false, sharedWith: [], createdAt: '2026-04-10T13:00:00Z', updatedAt: '2026-04-22T09:00:00Z' },
  ];
  @state() private _widgetLayout: string = '2x2';
  @state() private _widgetPreviewId: string | null = null;
  @state() private _widgetNewType: string = 'chart';
  @state() private _widgetNewSource: string = '';
  @state() private _widgetNewName: string = '';

  private _renderCustomWidgetBuilder(): any {
    const layouts = ['2x2', '3x3', '1x4', 'freeform'];
    const typeIcons: Record<string, string> = { chart: '📈', table: '📊', metric: '🔢', status: '✅' };
    return html`
      <div style="padding:12px;background:#0a0c10;border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Custom Widget Builder</span>
          <div style="display:flex;gap:6px">
            <div style="display:flex;gap:2px">${layouts.map(l => html`
              <button class="btn btn-sm" style="font-size:8px;padding:2px 6px;background:${this._widgetLayout === l ? '#1e3a5f' : '#111827'};color:${this._widgetLayout === l ? '#60a5fa' : '#6b7280'};border:1px solid ${this._widgetLayout === l ? '#3b82f6' : '#374151'}"
                      @click=${() => { this._widgetLayout = l; }}>${l}</button>
            `)}</div>
            <button class="btn btn-sm" style="font-size:9px;background:#14532d;color:#22c55e" @click=${() => { this._widgetBuilderOpen = !this._widgetBuilderOpen; }}>+ New Widget</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:6px;margin-bottom:8px">
          ${this._customWidgets.map(w => html`
            <div style="background:#111827;border-radius:6px;padding:8px;cursor:pointer;border:1px solid ${this._widgetPreviewId === w.id ? '#3b82f6' : '#1f2937'};min-height:80px"
                 @click=${() => { this._widgetPreviewId = this._widgetPreviewId === w.id ? null : w.id; }}>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-size:14px">${typeIcons[w.type] || '📦'}</span>
                <div style="display:flex;gap:3px">
                  ${w.shared ? html`<span style="color:#3b82f6;font-size:8px">↗ shared</span>` : nothing}
                  <button class="btn btn-sm" style="font-size:7px;padding:1px 4px">Edit</button>
                </div>
              </div>
              <div style="font-weight:600;color:#e2e8f0;font-size:10px">${w.name}</div>
              <div style="font-size:8px;color:#6b7280;margin-top:2px">${w.type} | ${w.dataSource} | ${w.layout}</div>
              ${this._widgetPreviewId === w.id ? html`
                <div style="margin-top:6px;padding-top:6px;border-top:1px solid #1f2937;font-size:8px;color:#9ca3af">
                  <div>Config: ${JSON.stringify(w.config).slice(0, 60)}...</div>
                  <div style="margin-top:2px">Created: ${w.createdAt.split('T')[0]} | Updated: ${w.updatedAt.split('T')[0]}</div>
                  ${w.shared && w.sharedWith.length > 0 ? html`<div style="margin-top:2px;color:#3b82f6">Shared with: ${w.sharedWith.join(', ')}</div>` : nothing}
                </div>
              ` : nothing}
            </div>
          `)}
        </div>
        ${this._widgetBuilderOpen ? html`
          <div style="background:#111827;border-radius:6px;padding:10px;border:1px solid #3b82f6">
            <div style="font-weight:600;font-size:11px;color:#e2e8f0;margin-bottom:8px">Create New Widget</div>
            <div style="display:flex;gap:8px;margin-bottom:6px">
              <input type="text" placeholder="Widget name" style="flex:1;background:#0a0c10;border:1px solid #374151;color:#e2e8f0;font-size:10px;padding:4px 6px;border-radius:3px"
                     .value=${this._widgetNewName} @input=${(e: any) => { this._widgetNewName = e.target.value; }} />
              <select style="background:#0a0c10;border:1px solid #374151;color:#9ca3af;font-size:10px;padding:4px 6px;border-radius:3px"
                      @change=${(e: any) => { this._widgetNewType = e.target.value; }}>
                <option value="chart">Chart</option><option value="table">Table</option>
                <option value="metric">Metric</option><option value="status">Status</option>
              </select>
            </div>
            <div style="margin-bottom:6px">
              <input type="text" placeholder="Data source (e.g., alerts, risk-assessment, compliance)" style="width:100%;background:#0a0c10;border:1px solid #374151;color:#e2e8f0;font-size:10px;padding:4px 6px;border-radius:3px"
                     .value=${this._widgetNewSource} @input=${(e: any) => { this._widgetNewSource = e.target.value; }} />
            </div>
            <div style="display:flex;gap:6px;justify-content:flex-end">
              <button class="btn btn-sm" style="font-size:9px" @click=${() => { this._widgetBuilderOpen = false; }} >Cancel</button>
              <button class="btn btn-sm" style="font-size:9px;background:#1e3a5f;color:#60a5fa" @click=${() => {
                if (this._widgetNewName && this._widgetNewSource) {
                  this._customWidgets.push({
                    id: 'cw-' + String(this._customWidgets.length + 1).padStart(3, '0'),
                    name: this._widgetNewName, type: this._widgetNewType as any,
                    dataSource: this._widgetNewSource, config: {},
                    layout: 'freeform', shared: false, sharedWith: [],
                    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                  });
                  this._widgetNewName = ''; this._widgetNewSource = '';
                  this._widgetBuilderOpen = false;
                }
              }}>Create</button>
            </div>
          </div>
        ` : nothing}
      </div>`;
  }

  // === SECTION J: Audit & Compliance Trail ===
  @state() private _auditEntries: Array<{
    id: string; timestamp: string; action: string; category: 'policy-change' | 'access-grant' | 'config-modify' | 'incident-response' | 'compliance-check';
    user: string; resource: string; details: string; severity: 'info' | 'warning' | 'critical';
    previousHash: string; currentHash: string; verified: boolean;
    evidence: Array<{ type: string; reference: string; collectedAt: string }>;
    remediation: { status: 'open' | 'in-progress' | 'completed' | 'accepted-risk'; assignee: string; dueDate: string; notes: string } | null;
  }> = [
    { id: 'ae-001', timestamp: '2026-04-22T09:00:00Z', action: 'Firewall rule modified', category: 'config-modify', user: 'alice@corp.com', resource: 'fw-prod-01', details: 'Added allow rule for 10.0.0.0/8 to port 443', severity: 'warning', previousHash: 'a1b2c3d4', currentHash: 'e5f6g7h8', verified: true, evidence: [{ type: 'screenshot', reference: 'fw-rule-001.png', collectedAt: '2026-04-22T09:01:00Z' }, { type: 'log', reference: 'fw-audit-2026-04-22.log', collectedAt: '2026-04-22T09:02:00Z' }], remediation: { status: 'completed', assignee: 'alice@corp.com', dueDate: '2026-04-22T18:00:00Z', notes: 'Change approved by security lead' } },
    { id: 'ae-002', timestamp: '2026-04-22T08:30:00Z', action: 'Admin access granted', category: 'access-grant', user: 'admin@corp.com', resource: 'prod-database', details: 'Temporary admin access granted for incident investigation', severity: 'critical', previousHash: 'b2c3d4e5', currentHash: 'f6g7h8i9', verified: true, evidence: [{ type: 'ticket', reference: 'INC-2026-0442', collectedAt: '2026-04-22T08:25:00Z' }], remediation: { status: 'in-progress', assignee: 'bob@corp.com', dueDate: '2026-04-23T08:30:00Z', notes: 'Access to be revoked after investigation completes' } },
    { id: 'ae-003', timestamp: '2026-04-22T08:00:00Z', action: 'Compliance check passed', category: 'compliance-check', user: 'system', resource: 'soc2-controls', details: 'Quarterly SOC2 Type II controls assessment completed', severity: 'info', previousHash: 'c3d4e5f6', currentHash: 'g7h8i9j0', verified: true, evidence: [{ type: 'report', reference: 'soc2-q2-2026.pdf', collectedAt: '2026-04-22T08:05:00Z' }, { type: 'evidence-package', reference: 'evidence-soc2-q2.zip', collectedAt: '2026-04-22T08:10:00Z' }], remediation: null },
    { id: 'ae-004', timestamp: '2026-04-21T16:00:00Z', action: 'Security policy updated', category: 'policy-change', user: 'ciso@corp.com', resource: 'password-policy', details: 'Minimum password length increased from 12 to 14 characters', severity: 'info', previousHash: 'd4e5f6g7', currentHash: 'h8i9j0k1', verified: true, evidence: [{ type: 'diff', reference: 'policy-diff-2026-04-21.txt', collectedAt: '2026-04-21T16:05:00Z' }], remediation: { status: 'completed', assignee: 'ciso@corp.com', dueDate: '2026-04-21T18:00:00Z', notes: 'Policy approved by board' } },
  ];
  @state() private _auditFilterCategory: string = 'all';
  @state() private _auditHashChainValid = true;

  private _renderAuditComplianceTrail(): any {
    const categories = ['policy-change', 'access-grant', 'config-modify', 'incident-response', 'compliance-check'] as const;
    const catIcons: Record<string, string> = { 'policy-change': '📋', 'access-grant': '🔑', 'config-modify': '⚙️', 'incident-response': '🚨', 'compliance-check': '✅' };
    const filtered = this._auditEntries.filter(e => this._auditFilterCategory === 'all' || e.category === this._auditFilterCategory);
    return html`
      <div style="padding:12px;background:#0a0c10;border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Audit & Compliance Trail</span>
          <div style="display:flex;gap:4px;align-items:center">
            <span style="font-size:9px;color:${this._auditHashChainValid ? '#22c55e' : '#ef4444'}">${this._auditHashChainValid ? '● Chain Valid' : '✕ Chain Broken'}</span>
            <button class="btn btn-sm" style="font-size:8px;background:#1e3a5f;color:#60a5fa">Generate Report</button>
          </div>
        </div>
        <div style="display:flex;gap:3px;margin-bottom:8px;flex-wrap:wrap">
          <button class="btn btn-sm" style="font-size:8px;padding:2px 5px;background:${this._auditFilterCategory === 'all' ? '#1e3a5f' : '#111827'};color:${this._auditFilterCategory === 'all' ? '#60a5fa' : '#6b7280'}"
                  @click=${() => { this._auditFilterCategory = 'all'; }}>All (${this._auditEntries.length})</button>
          ${categories.map(c => html`
            <button class="btn btn-sm" style="font-size:8px;padding:2px 5px;background:${this._auditFilterCategory === c ? '#1e3a5f' : '#111827'};color:${this._auditFilterCategory === c ? '#60a5fa' : '#6b7280'}"
                    @click=${() => { this._auditFilterCategory = this._auditFilterCategory === c ? 'all' : c; }}>${catIcons[c]} ${c} (${this._auditEntries.filter(e => e.category === c).length})</button>
          `)}
        </div>
        ${filtered.map(entry => html`
          <div style="padding:6px 8px;background:#111827;border-radius:4px;margin-bottom:3px;border-left:3px solid ${entry.severity === 'critical' ? '#ef4444' : entry.severity === 'warning' ? '#f59e0b' : '#374151'}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="display:flex;align-items:center;gap:4px">
                <span style="font-size:11px">${catIcons[entry.category]}</span>
                <span style="font-weight:600;color:#e2e8f0;font-size:10px">${entry.action}</span>
              </div>
              <span style="color:#6b7280;font-size:8px">${entry.timestamp.split('T')[1]?.slice(0, 5) || ''}</span>
            </div>
            <div style="font-size:9px;color:#6b7280;margin-top:2px">${entry.user} → ${entry.resource} | ${entry.details}</div>
            <div style="display:flex;gap:8px;margin-top:3px;font-size:8px;align-items:center">
              <span style="color:${entry.verified ? '#22c55e' : '#ef4444'}">${entry.verified ? '✓ Verified' : '✕ Unverified'}</span>
              <span style="color:#4b5563;font-family:monospace">hash: ${entry.currentHash}</span>
              <span style="color:#6b7280">${entry.evidence.length} evidence items</span>
            </div>
            ${entry.remediation ? html`
              <div style="margin-top:3px;padding:3px 6px;background:#0a0c10;border-radius:3px;font-size:8px">
                <span style="color:${entry.remediation.status === 'completed' ? '#22c55e' : entry.remediation.status === 'in-progress' ? '#3b82f6' : entry.remediation.status === 'accepted-risk' ? '#f59e0b' : '#ef4444'}">Remediation: ${entry.remediation.status}</span>
                <span style="color:#6b7280;margin-left:6px">${entry.remediation.assignee} | Due: ${entry.remediation.dueDate.split('T')[0]}</span>
                <span style="color:#9ca3af;margin-left:6px">${entry.remediation.notes}</span>
              </div>
            ` : nothing}
          </div>
        `)}
      </div>`;
  }

  }
declare global { interface HTMLElementTagNameMap { 'sc-incident-timeline-viz': ScIncidentTimelineViz; } }
