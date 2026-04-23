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

  render() {
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
}
declare global { interface HTMLElementTagNameMap { 'sc-incident-timeline-viz': ScIncidentTimelineViz; } }
