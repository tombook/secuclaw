/**
 * sc-scan-results-table - Scan Results Table
 * Interactive security operations panel with filtering, search, visualization, and export capabilities
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type Status = 'open' | 'in-progress' | 'resolved' | 'closed' | 'escalated' | 'acknowledged' | 'false-positive';
type Priority = 'p1' | 'p2' | 'p3' | 'p4' | 'p5';

interface PanelItem {
  id: string;
  title: string;
  severity: Severity;
  status: Status;
  category: string;
  source: string;
  description: string;
  createdAt: string;
  assignee: string;
  tags: string[];
  priority: Priority;
  slaMinutes: number;
  stepsTaken: string[];
}

interface HistoryEntry {
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

interface TrendPoint {
  date: string;
  opened: number;
  resolved: number;
  critical: number;
}

@customElement('sc-scan-results-table')
export class ScScanResultsTable extends LitElement {

  // --- ScanResults Risk Scoring Engine ---
  @state() private _scanriskScore = 0;
  @state() private _scanriskLevel = 'low';
  private _scanriskFactors: Record<string, { weight: number; label: string }> = {
    factor1: { weight: 0.25, label: 'Primary Factor' },
    factor2: { weight: 0.20, label: 'Secondary Factor' },
    factor3: { weight: 0.20, label: 'Tertiary Factor' },
    factor4: { weight: 0.15, label: 'Quaternary Factor' },
    factor5: { weight: 0.20, label: 'Quinary Factor' },
  };

  private _computeScanResultsRisk(): { score: number; level: string; factors: { name: string; score: number; label: string }[] } {
    const factors: { name: string; score: number; label: string }[] = Object.entries(this._scanriskFactors).map(([name, f]) => ({
      name, score: Math.floor(Math.random() * 60) + 20, label: f.label,
    }));
    const score = Math.round(factors.reduce((s, f) => s + f.score * (this._scanriskFactors[f.name]?.weight || 0.15), 0));
    const level = score > 75 ? 'critical' : score > 50 ? 'high' : score > 25 ? 'medium' : 'low';
    this._scanriskScore = score;
    this._scanriskLevel = level;
    return { score, level, factors };
  }

  // --- MITRE ATT&CK Correlation ---
  private _scanmitreMap: Record<string, { techniqueId: string; techniqueName: string; tactic: string }> = {
    'phishing': { techniqueId: 'T1566', techniqueName: 'Phishing', tactic: 'Initial Access' },
    'valid-accounts': { techniqueId: 'T1078', techniqueName: 'Valid Accounts', tactic: 'Initial Access' },
    'command-exec': { techniqueId: 'T1059', techniqueName: 'Command Interpreter', tactic: 'Execution' },
    'credential-dump': { techniqueId: 'T1003', techniqueName: 'Credential Dumping', tactic: 'Credential Access' },
    'lateral-movement': { techniqueId: 'T1021', techniqueName: 'Remote Services', tactic: 'Lateral Movement' },
    'defense-evasion': { techniqueId: 'T1070', techniqueName: 'Indicator Removal', tactic: 'Defense Evasion' },
  };

  private _correlateScanResultsMitre(): { tactic: string; techniques: { id: string; name: string; count: number }[] }[] {
    const tacticMap: Record<string, { id: string; name: string; count: number }[]> = {};
    for (const [key, mitre] of Object.entries(this._scanmitreMap)) {
      if (!tacticMap[mitre.tactic]) tacticMap[mitre.tactic] = [];
      tacticMap[mitre.tactic].push({ id: mitre.techniqueId, name: mitre.techniqueName, count: Math.floor(Math.random() * 5) + 1 });
    }
    return Object.entries(tacticMap).map(([tactic, techniques]) => ({ tactic, techniques }));
  }

  // --- Radar Chart SVG ---
  private _scanradarSVG(): string {
    const dims = Object.values(this._scanriskFactors).map(f => f.label);
    const values = dims.map(() => Math.random() * 0.6 + 0.3);
    const cx = 100, cy = 100, r = 70, n = dims.length;
    let svg = '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">';
    for (let ring = 1; ring <= 4; ring++) {
      const rr = (ring / 4) * r;
      const pts: string[] = [];
      for (let i = 0; i < n; i++) { const a = (Math.PI * 2 * i) / n - Math.PI / 2; pts.push((cx + rr * Math.cos(a)) + ',' + (cy + rr * Math.sin(a))); }
      svg += '<polygon points="' + pts.join(' ') + '" fill="none" stroke="#374151" stroke-width="0.5"/>';
    }
    for (let i = 0; i < n; i++) { const a = (Math.PI * 2 * i) / n - Math.PI / 2; svg += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + r * Math.cos(a)) + '" y2="' + (cy + r * Math.sin(a)) + '" stroke="#374151" stroke-width="0.5"/>'; }
    const dataPts: string[] = [];
    for (let i = 0; i < n; i++) { const a = (Math.PI * 2 * i) / n - Math.PI / 2; dataPts.push((cx + values[i] * r * Math.cos(a)) + ',' + (cy + values[i] * r * Math.sin(a))); }
    svg += '<polygon points="' + dataPts.join(' ') + '" fill="#f59e0b" fill-opacity="0.2" stroke="#f59e0b" stroke-width="1.5"/>';
    for (let i = 0; i < n; i++) { const a = (Math.PI * 2 * i) / n - Math.PI / 2; const lx = cx + (r + 18) * Math.cos(a), ly = cy + (r + 18) * Math.sin(a); svg += '<text x="' + lx + '" y="' + ly + '" fill="#9ca3af" font-size="7" text-anchor="middle" dominant-baseline="middle">' + dims[i] + '</text>'; }
    svg += '</svg>';
    return svg;
  }

  // --- Heatmap SVG ---
  private _scanheatmapSVG(): string {
    const w = 500, h = 180;
    const rows = ['Critical', 'High', 'Medium', 'Low'];
    const cols = ['Coverage', 'Compliance', 'Risk', 'Trend', 'Status'];
    const data = rows.map(() => cols.map(() => Math.floor(Math.random() * 100)));
    const cellW = (w - 70) / cols.length, cellH = (h - 30) / rows.length;
    let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">';
    cols.forEach((c, i) => { svg += '<text x="' + (70 + i * cellW + cellW / 2) + '" y="15" fill="#9ca3af" font-size="8" text-anchor="middle">' + c + '</text>'; });
    rows.forEach((r, ri) => {
      svg += '<text x="60" y="' + (30 + ri * cellH + cellH / 2 + 3) + '" fill="#9ca3af" font-size="8" text-anchor="end">' + r + '</text>';
      cols.forEach((c, ci) => {
        const val = data[ri][ci];
        const x = 70 + ci * cellW, y = 30 + ri * cellH;
        const color = val > 75 ? '#ef4444' : val > 50 ? '#f97316' : val > 25 ? '#eab308' : '#22c55e';
        svg += '<rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="' + (cellW - 2) + '" height="' + (cellH - 2) + '" rx="3" fill="' + color + '" opacity="0.3" stroke="' + color + '" stroke-width="0.5"/>';
        svg += '<text x="' + (x + cellW / 2) + '" y="' + (y + cellH / 2 + 3) + '" fill="#e2e8f0" font-size="9" text-anchor="middle">' + val + '</text>';
      });
    });
    svg += '</svg>';
    return svg;
  }

  // --- Collaboration ---
  @state() private _scanteam: { id: string; name: string; role: string; status: string }[] = [
    { id: 'scan1', name: 'Team Lead', role: 'Management', status: 'online' },
    { id: 'scan2', name: 'Analyst', role: 'Operations', status: 'online' },
    { id: 'scan3', name: 'Engineer', role: 'Technical', status: 'busy' },
  ];
  @state() private _scancomments: { id: string; userId: string; text: string; timestamp: string }[] = [];
  @state() private _scancommentText = '';

  private _addScanResultsComment() {
    if (!this._scancommentText.trim()) return;
    this._scancomments = [{ id: 'scanc' + Date.now(), userId: 'You', text: this._scancommentText.trim(), timestamp: new Date().toISOString() }, ...this._scancomments].slice(0, 30);
    this._scancommentText = '';
  }

  private _renderScanResultsCollab(): any {
    return html`
      <div style="margin-top:16px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Team Discussion</div>
        ${
          this._scanteam.map(m => html`
            <div style="display:flex;align-items:center;gap:4px;background:#1f2937;border-radius:4px;padding:3px 8px;font-size:10px">
              <div style="width:6px;height:6px;border-radius:50%;background:${m.status === 'online' ? '#22c55e' : '#eab308'}"></div>
              <span style="font-weight:600">${m.name}</span>
            </div>
          `)
        }
        ${
          this._scancomments.length > 0 ? html`
            <div style="max-height:60px;overflow-y:auto;margin-bottom:6px">
              ${
                this._scancomments.slice(0, 5).map(c => html`<div style="font-size:10px;padding:3px 0;border-bottom:1px solid #1f2937"><span style="font-weight:600;color:#e2e8f0">${c.userId}</span><span style="color:#9ca3af">: ${c.text}</span></div>`)
              }
            </div>
          ` : nothing
        }
        <div style="display:flex;gap:6px">
          <input style="flex:1;background:#0f172a;border:1px solid #374151;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:10px" placeholder="Comment..." .value=${this._scancommentText} @input=${(e: any) => this._scancommentText = e.target.value}>
          <button style="background:#f59e0b;color:#111827;border:none;border-radius:4px;padding:4px 10px;font-size:10px;font-weight:600;cursor:pointer" @click=${this._addScanResultsComment}>Post</button>
        </div>
      </div>
    `;
  }

  // --- Auto-Insights ---
  private _generateScanResultsInsights(): { icon: string; text: string; severity: string }[] {
    const insights: { icon: string; text: string; severity: string }[] = [];
    const risk = this._computeScanResultsRisk();
    if (risk.score > 75) insights.push({ icon: '\u26A0\uFE0F', text: 'ScanResults risk score is ' + risk.score + '/100. Immediate attention required.', severity: 'critical' });
    else if (risk.score > 50) insights.push({ icon: '\uD83D\uDD04', text: 'ScanResults risk is elevated at ' + risk.score + '/100.', severity: 'high' });
    return insights.length > 0 ? insights : [{ icon: '\u2705', text: 'ScanResults status is normal.', severity: 'low' }];
  }

  private _renderScanResultsInsights(): any {
    const insights = this._generateScanResultsInsights();
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Auto-Insights</div>
        ${
          insights.map(i => html`
            <div style="display:flex;gap:6px;padding:5px;margin-bottom:3px;background:#1f2937;border-radius:4px;font-size:10px;border-left:3px solid ${i.severity === 'critical' ? '#ef4444' : i.severity === 'high' ? '#f97316' : '#22c55e'}">
              <span>${i.icon}</span>
              <span style="color:#e2e8f0">${i.text}</span>
            </div>
          `)
        }
      </div>
    `;
  }

  // --- Panel Config ---
  @state() private _scanconfig: { showRadar: boolean; showHeatmap: boolean; showCollab: boolean; autoRefresh: boolean } = { showRadar: true, showHeatmap: true, showCollab: true, autoRefresh: false };

  private _renderScanResultsConfig(): any {
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Configuration</div>
        ${
          Object.entries(this._scanconfig).map(([key, val]) => html`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1f2937">
              <span style="font-size:10px;color:#9ca3af">${key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <div style="width:32px;height:18px;border-radius:9px;background:${val ? '#22c55e' : '#374151'};cursor:pointer;position:relative" @click=${() => { this._scanconfig = { ...this._scanconfig, [key]: !val }; }}>
                <div style="width:14px;height:14px;border-radius:50%;background:white;position:absolute;top:2px;left:${val ? '16px' : '2px'};transition:left 0.2s"></div>
              </div>
            </div>
          `)
        }
      </div>
    `;
  }

  // --- Anomaly Detection ---
  private _detectScanResultsAnomalies(): { type: string; description: string; severity: string }[] {
    const anomalies: { type: string; description: string; severity: string }[] = [];
    const risk = this._computeScanResultsRisk();
    if (risk.score > 80) anomalies.push({ type: 'Critical Risk', description: 'ScanResults risk exceeds 80 threshold.', severity: 'critical' });
    return anomalies;
  }

  private _renderScanResultsAnomalies(): any {
    const anomalies = this._detectScanResultsAnomalies();
    if (anomalies.length === 0) return nothing;
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px;color:#f59e0b">Anomalies (${anomalies.length})</div>
        ${
          anomalies.map(a => html`
            <div style="background:#1f2937;border-radius:4px;padding:6px;margin-bottom:4px;border-left:3px solid ${a.severity === 'critical' ? '#ef4444' : '#eab308'}">
              <div style="font-size:11px;font-weight:600;color:#e2e8f0">${a.type}</div>
              <div style="font-size:10px;color:#9ca3af">${a.description}</div>
            </div>
          `)
        }
      </div>
    `;
  }

  // --- Trend Prediction ---
  private _predictScanResultsTrend(): { direction: string; confidence: number; reason: string } {
    const risk = this._computeScanResultsRisk();
    if (risk.score > 60) return { direction: 'INCREASING', confidence: 0.7, reason: 'Risk indicators trending upward' };
    return { direction: 'STABLE', confidence: 0.6, reason: 'Risk within normal parameters' };
  }

  private _renderScanResultsTrend(): any {
    const trend = this._predictScanResultsTrend();
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Trend Prediction</div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:20px">${trend.direction === 'INCREASING' ? '\uD83D\uDD3C' : '\u2192'}</div>
          <div>
            <div style="font-size:11px;font-weight:600;color:${trend.direction === 'INCREASING' ? '#ef4444' : '#eab308'}">${trend.direction}</div>
            <div style="font-size:10px;color:#9ca3af">${trend.reason}</div>
            <div style="font-size:9px;color:#6b7280">Confidence: ${Math.round(trend.confidence * 100)}%</div>
          </div>
        </div>
      </div>
    `;
  }

  // --- Compliance ---
  private _scancomplianceRules: { rule: string; standard: string; status: 'pass' | 'fail' | 'warning' }[] = [
    { rule: 'Security controls documented', standard: 'ISO 27001 A.5.1', status: 'pass' },
    { rule: 'Regular assessments performed', standard: 'NIST 800-53 CA-2', status: 'pass' },
    { rule: 'Risk acceptance criteria defined', standard: 'ISO 27001 A.6.1', status: 'warning' },
    { rule: 'Remediation tracking active', standard: 'NIST 800-53 RA-5', status: 'fail' },
    { rule: 'Stakeholder reporting current', standard: 'SOC2 CC4.1', status: 'pass' },
  ];

  private _renderScanResultsCompliance(): any {
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Compliance</div>
        ${
          this._scancomplianceRules.map(r => html`
            <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #1f2937;font-size:10px">
              <div style="width:8px;height:8px;border-radius:50%;background:${r.status === 'pass' ? '#22c55e' : r.status === 'fail' ? '#ef4444' : '#eab308'}"></div>
              <span style="flex:1;color:#e2e8f0">${r.rule}</span>
              <span style="color:#6b7280;font-size:9px">${r.standard}</span>
            </div>
          `)
        }
      </div>
    `;
  }


  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .controls-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
    .search-box { padding: 8px 12px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 13px; flex: 1; min-width: 180px; outline: none; }
    .search-box:focus { border-color: #f59e0b; }
    .filter-select { padding: 8px 12px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 13px; outline: none; cursor: pointer; }
    .btn { padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; transition: all 0.2s; }
    .btn:hover { border-color: #f59e0b; }
    .btn.primary { background: #1e40af; border-color: #3b82f6; color: white; }
    .btn.success { background: #052e16; border-color: #166534; color: #86efac; }
    .btn.danger { background: #450a0a; border-color: #7f1d1d; color: #fca5a5; }
    .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .score-card { background: #0a0e17; border-radius: 8px; padding: 12px; text-align: center; border: 1px solid #1e293b; }
    .score-val { font-size: 22px; font-weight: 700; }
    .score-lbl { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 600; margin-top: 2px; }
    .tabs { display: flex; gap: 0; margin-bottom: 12px; border-bottom: 1px solid #374151; }
    .tab { padding: 8px 16px; font-size: 12px; font-weight: 600; border: none; background: transparent; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; }
    .tab.active { color: #f59e0b; border-bottom-color: #f59e0b; }
    .tab:hover { color: #e2e8f0; }
    .list { display: flex; flex-direction: column; gap: 6px; max-height: 500px; overflow-y: auto; }
    .item { background: #1f2937; border: 1px solid #374151; border-radius: 6px; padding: 12px; cursor: pointer; transition: all 0.2s; }
    .item:hover { border-color: #4b5563; }
    .item.expanded { border-color: #f59e0b; }
    .item-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .item-title { font-size: 13px; font-weight: 600; flex: 1; }
    .badges { display: flex; gap: 4px; flex-shrink: 0; }
    .badge { font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .badge-critical { background: #450a0a; color: #fca5a5; }
    .badge-high { background: #431407; color: #fdba74; }
    .badge-medium { background: #422006; color: #fde047; }
    .badge-low { background: #052e16; color: #86efac; }
    .badge-info { background: #172554; color: #93c5fd; }
    .badge-open { background: #1e293b; color: #94a3b8; }
    .badge-remediated { background: #052e16; color: #86efac; }
    .badge-in-progress { background: #1e3a8a; color: #93c5fd; }
    .badge-resolved { background: #052e16; color: #86efac; }
    .badge-escalated { background: #450a0a; color: #fca5a5; }
    .badge-new { background: #172554; color: #93c5fd; }
    .badge-acknowledged { background: #1e3a8a; color: #93c5fd; }
    .badge-false-positive { background: #1e293b; color: #6b7280; }
    .badge-p1 { background: #450a0a; color: #fca5a5; }
    .badge-p2 { background: #431407; color: #fdba74; }
    .badge-p3 { background: #422006; color: #fde047; }
    .badge-p4 { background: #052e16; color: #86efac; }
    .badge-p5 { background: #172554; color: #93c5fd; }
    .badge-completed { background: #052e16; color: #86efac; }
    .badge-failed { background: #450a0a; color: #fca5a5; }
    .badge-scheduled { background: #172554; color: #93c5fd; }
    .badge-active { background: #1e3a8a; color: #93c5fd; }
    .badge-blocked { background: #431407; color: #fdba74; }
    .badge-pending { background: #422006; color: #fde047; }
    .badge-approved { background: #052e16; color: #86efac; }
    .badge-expired { background: #450a0a; color: #fca5a5; }
    .badge-revoked { background: #1e293b; color: #6b7280; }
    .badge-denied { background: #450a0a; color: #fca5a5; }
    .badge-healthy { background: #052e16; color: #86efac; }
    .badge-warning { background: #422006; color: #fde047; }
    .badge-degraded { background: #431407; color: #fdba74; }
    .item-meta { font-size: 11px; color: #94a3b8; margin-top: 4px; }
    .item-detail { margin-top: 10px; padding-top: 10px; border-top: 1px solid #374151; }
    .chart-container { background: #0a0e17; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .chart-title { font-size: 13px; font-weight: 700; margin-bottom: 12px; }
    .form-section { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .form-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-label { font-size: 11px; font-weight: 600; color: #94a3b8; }
    .form-input { padding: 8px 10px; border-radius: 6px; border: 1px solid #374151; background: #0a0e17; color: #e2e8f0; font-size: 13px; outline: none; }
    .form-input:focus { border-color: #f59e0b; }
    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    .history-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .history-table th { text-align: left; padding: 8px 10px; border-bottom: 1px solid #374151; color: #94a3b8; font-weight: 600; font-size: 11px; }
    .history-table td { padding: 8px 10px; border-bottom: 1px solid #1e293b; }
    .history-table tr:hover td { background: #1f2937; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 10px; }
    .remediation-box { background: #052e16; border: 1px solid #166534; border-radius: 6px; padding: 10px; font-size: 12px; }
    .remediation-box strong { color: #86efac; }

  `;

  @state() private _searchQuery = '';
  @state() private _severityFilter: Severity | 'all' = 'all';
  @state() private _statusFilter: Status | 'all' = 'all';
  @state() private _activeTab: 'overview' | 'details' | 'trends' | 'history' | 'new' = 'overview';
  @state() private _expandedId: string | null = null;
  @state() private _sortField: 'severity' | 'date' | 'title' = 'date';
  @state() private _sortAsc = false;

  private _items: PanelItem[] = [
      {
            "id": "scan-results-table-1",
            "title": "Scan Results Table Finding #1",
            "severity": "low",
            "status": "open",
            "category": "Security",
            "source": "SIEM",
            "description": "Automated scan results table assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-15T00:00:00Z",
            "assignee": "soc-tier1",
            "tags": [
                  "scan-results-table",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 15,
            "stepsTaken": []
      },
      {
            "id": "scan-results-table-2",
            "title": "Scan Results Table Finding #2",
            "severity": "medium",
            "status": "open",
            "category": "Network",
            "source": "EDR",
            "description": "Automated scan results table assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-16T02:00:00Z",
            "assignee": "soc-tier2",
            "tags": [
                  "scan-results-table",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 30,
            "stepsTaken": []
      },
      {
            "id": "scan-results-table-3",
            "title": "Scan Results Table Finding #3",
            "severity": "high",
            "status": "open",
            "category": "Access",
            "source": "Scanner",
            "description": "Automated scan results table assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-17T04:00:00Z",
            "assignee": "security-eng",
            "tags": [
                  "scan-results-table",
                  "automated"
            ],
            "priority": "p3",
            "slaMinutes": 60,
            "stepsTaken": []
      },
      {
            "id": "scan-results-table-4",
            "title": "Scan Results Table Finding #4",
            "severity": "low",
            "status": "open",
            "category": "Compliance",
            "source": "Audit",
            "description": "Automated scan results table assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-18T06:00:00Z",
            "assignee": "compliance",
            "tags": [
                  "scan-results-table",
                  "automated"
            ],
            "priority": "p4",
            "slaMinutes": 120,
            "stepsTaken": []
      },
      {
            "id": "scan-results-table-5",
            "title": "Scan Results Table Finding #5",
            "severity": "medium",
            "status": "open",
            "category": "Operations",
            "source": "Manual",
            "description": "Automated scan results table assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-19T08:00:00Z",
            "assignee": "ops",
            "tags": [
                  "scan-results-table",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 240,
            "stepsTaken": []
      },
      {
            "id": "scan-results-table-6",
            "title": "Scan Results Table Finding #6",
            "severity": "high",
            "status": "open",
            "category": "Security",
            "source": "SIEM",
            "description": "Automated scan results table assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-20T10:00:00Z",
            "assignee": "soc-tier1",
            "tags": [
                  "scan-results-table",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 15,
            "stepsTaken": []
      },
      {
            "id": "scan-results-table-7",
            "title": "Scan Results Table Finding #7",
            "severity": "low",
            "status": "open",
            "category": "Network",
            "source": "EDR",
            "description": "Automated scan results table assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-21T12:00:00Z",
            "assignee": "soc-tier2",
            "tags": [
                  "scan-results-table",
                  "automated"
            ],
            "priority": "p3",
            "slaMinutes": 30,
            "stepsTaken": []
      },
      {
            "id": "scan-results-table-8",
            "title": "Scan Results Table Finding #8",
            "severity": "medium",
            "status": "open",
            "category": "Access",
            "source": "Scanner",
            "description": "Automated scan results table assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-22T14:00:00Z",
            "assignee": "security-eng",
            "tags": [
                  "scan-results-table",
                  "automated"
            ],
            "priority": "p4",
            "slaMinutes": 60,
            "stepsTaken": []
      },
      {
            "id": "scan-results-table-9",
            "title": "Scan Results Table Finding #9",
            "severity": "high",
            "status": "open",
            "category": "Compliance",
            "source": "Audit",
            "description": "Automated scan results table assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-23T16:00:00Z",
            "assignee": "compliance",
            "tags": [
                  "scan-results-table",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 120,
            "stepsTaken": []
      },
      {
            "id": "scan-results-table-10",
            "title": "Scan Results Table Finding #10",
            "severity": "low",
            "status": "open",
            "category": "Operations",
            "source": "Manual",
            "description": "Automated scan results table assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-24T18:00:00Z",
            "assignee": "ops",
            "tags": [
                  "scan-results-table",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 240,
            "stepsTaken": []
      }
];

  private _history: HistoryEntry[] = [
    { timestamp: '2026-04-23 04:15', action: 'Auto-correlated', user: 'system', details: 'Grouped related findings from Scan Results Table analysis' },
    { timestamp: '2026-04-23 03:00', action: 'Created', user: 'scanner', details: 'New Scan Results Table finding detected by automated assessment' },
    { timestamp: '2026-04-23 02:30', action: 'Escalated', user: 'soc-tier1', details: 'Escalated critical finding to tier 2 for investigation' },
    { timestamp: '2026-04-23 01:00', action: 'Updated', user: 'soc-tier2', details: 'Added investigation notes and IOC indicators' },
    { timestamp: '2026-04-22 22:00', action: 'Resolved', user: 'security-eng', details: 'Remediation applied and verified for Scan Results Table finding' },
    { timestamp: '2026-04-22 18:00', action: 'Created', user: 'audit', details: 'Compliance audit identified Scan Results Table gap requiring remediation' },
    { timestamp: '2026-04-22 14:00', action: 'Acknowledged', user: 'ops-team', details: 'Operations team acknowledged finding and created remediation task' },
    { timestamp: '2026-04-22 10:00', action: 'Assigned', user: 'manager', details: 'Finding assigned to security engineering team for resolution' },
    { timestamp: '2026-04-21 16:00', action: 'Resolved', user: 'soc-tier1', details: 'False positive confirmed - benign activity flagged by Scan Results Table scan' },
    { timestamp: '2026-04-21 12:00', action: 'Exported', user: 'compliance', details: 'Exported Scan Results Table findings for Q1 compliance report' },
  ];

  private _trends: TrendPoint[] = [
    { date: 'Apr 17', opened: 8, resolved: 6, critical: 1 },
    { date: 'Apr 18', opened: 12, resolved: 10, critical: 2 },
    { date: 'Apr 19', opened: 6, resolved: 8, critical: 0 },
    { date: 'Apr 20', opened: 15, resolved: 11, critical: 3 },
    { date: 'Apr 21', opened: 9, resolved: 12, critical: 1 },
    { date: 'Apr 22', opened: 11, resolved: 9, critical: 2 },
    { date: 'Apr 23', opened: 10, resolved: 3, critical: 0 },
  ];

  private _toggle(id: string) { this._expandedId = this._expandedId === id ? null : id; }

  private _getSevBadge(s: string): string { return `badge-${s}`; }

  private _getFiltered(): PanelItem[] {
    let result = [...this._items];
    if (this._severityFilter !== 'all') result = result.filter(i => i.severity === this._severityFilter);
    if (this._statusFilter !== 'all') result = result.filter(i => i.status === this._statusFilter);
    if (this._searchQuery) {
      const q = this._searchQuery.toLowerCase();
      result = result.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.assignee.toLowerCase().includes(q) || i.source.toLowerCase().includes(q));
    }
    const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
    result.sort((a, b) => {
      if (this._sortField === 'severity') return this._sortAsc ? sevOrder[a.severity] - sevOrder[b.severity] : sevOrder[b.severity] - sevOrder[a.severity];
      if (this._sortField === 'date') return this._sortAsc ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt);
      return this._sortAsc ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title);
    });
    return result;
  }

  private _renderDonut(): unknown {
    const crit = this._items.filter(i => i.severity === 'critical').length;
    const high = this._items.filter(i => i.severity === 'high').length;
    const med = this._items.filter(i => i.severity === 'medium').length;
    const low = this._items.filter(i => i.severity === 'low' || i.severity === 'info').length;
    const total = crit + high + med + low || 1;
    const data = [{ label: 'Critical', val: crit, color: '#ef4444' }, { label: 'High', val: high, color: '#f97316' }, { label: 'Medium', val: med, color: '#eab308' }, { label: 'Low/Info', val: low, color: '#22c55e' }];
    const cx = 60, cy = 60, r = 40, sw = 14;
    let cum = -90;
    return html`
      <div class="chart-container">
        <div class="chart-title">Severity Distribution</div>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <svg viewBox="0 0 120 120" width="120" height="120">
            ${data.filter(d => d.val > 0).map(d => {
              const angle = (d.val / total) * 360;
              const s = (cum * Math.PI) / 180;
              const e = ((cum + angle) * Math.PI) / 180;
              cum += angle;
              const x1 = cx + r * Math.cos(s); const y1 = cy + r * Math.sin(s);
              const x2 = cx + r * Math.cos(e); const y2 = cy + r * Math.sin(e);
              return html`<path d="M${x1},${y1} A${r},${r} 0 ${angle > 180 ? 1 : 0},1 ${x2},${y2}" fill="none" stroke="${d.color}" stroke-width="${sw}" stroke-linecap="round"/>`;
            })}
            <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#e2e8f0" font-size="18" font-weight="700">${total}</text>
          </svg>
          <div style="display:flex;flex-direction:column;gap:4px;">
            ${data.map(d => html`<div style="display:flex;align-items:center;gap:6px;font-size:12px;"><span style="width:10px;height:10px;border-radius:2px;background:${d.color};"></span><span style="color:#94a3b8;">${d.label}:</span><span style="font-weight:700;">${d.val}</span></div>`)}
          </div>
        </div>
      </div>`;
  }

  private _renderBarChart(): unknown {
    const data = this._trends;
    const w = 500, h = 140, pad = 30;
    const maxVal = Math.max(...data.map(d => Math.max(d.opened, d.resolved)), 20);
    const barW = (w - pad * 2) / data.length - 8;
    return html`
      <div class="chart-container">
        <div class="chart-title">7-Day Trend</div>
        <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
          ${data.map((d, i) => {
            const x = pad + i * (barW + 8);
            const h1 = (d.opened / maxVal) * (h - pad - 20);
            const h2 = (d.resolved / maxVal) * (h - pad - 20);
            return html`<rect x="${x}" y="${h - pad - h1}" width="${barW / 2 - 1}" height="${h1}" rx="2" fill="#ef4444" opacity="0.7"/><rect x="${x + barW / 2 + 1}" y="${h - pad - h2}" width="${barW / 2 - 1}" height="${h2}" rx="2" fill="#22c55e" opacity="0.7"/><text x="${x + barW / 2}" y="${h - 6}" text-anchor="middle" fill="#94a3b8" font-size="9">${d.date}</text>`;
          })}
        </svg>
        <div style="display:flex;gap:16px;font-size:10px;color:#94a3b8;margin-top:8px;">
          <span><span style="display:inline-block;width:10px;height:10px;background:#ef4444;border-radius:2px;margin-right:4px;"></span>Opened</span>
          <span><span style="display:inline-block;width:10px;height:10px;background:#22c55e;border-radius:2px;margin-right:4px;"></span>Resolved</span>
        </div>
      </div>`;
  }

  private _renderGauge(value: number, max: number, label: string, color: string): unknown {
    const pct = Math.round((value / max) * 100);
    const cx = 60, cy = 70, r = 45, sw = 12;
    const circ = 2 * Math.PI * r;
    const offset = circ * (1 - pct / 100);
    return html`
      <div class="score-card" style="text-align:center;">
        <svg viewBox="0 0 120 100" width="100" height="83">
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1e293b" stroke-width="${sw}"/>
          <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
          <text x="${cx}" y="${cy + 5}" text-anchor="middle" fill="#e2e8f0" font-size="16" font-weight="700">${value}</text>
        </svg>
        <div class="score-lbl">${label}</div>
      </div>`;
  }

  private _exportJSON() {
    const blob = new Blob([JSON.stringify(this._getFiltered(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sc-scan-results-table-data.json'; a.click();
    URL.revokeObjectURL(url);
  }

  private _exportCSV() {
    const items = this._getFiltered();
    const header = 'ID,Title,Severity,Status,Category,Source,Assignee,Priority,Created\n';
    const rows = items.map(i => `"${i.id}","${i.title}","${i.severity}","${i.status}","${i.category}","${i.source}","${i.assignee}","${i.priority}","${i.createdAt}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sc-scan-results-table-data.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  render() {
    const items = this._getFiltered();
    const crit = items.filter(i => i.severity === 'critical').length;
    const high = items.filter(i => i.severity === 'high').length;
    const open = items.filter(i => i.status === 'open' || i.status === 'in-progress').length;
    const resolved = items.filter(i => i.status === 'resolved').length;
    return html`
      <div class="panel">
        <div class="pt">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          Scan Results Table
        </div>
        <div class="score-grid">
          <div class="score-card"><div class="score-val">${items.length}</div><div class="score-lbl">Total Items</div></div>
          <div class="score-card"><div class="score-val" style="color:#ef4444">${crit}</div><div class="score-lbl">Critical</div></div>
          <div class="score-card"><div class="score-val" style="color:#f97316">${high}</div><div class="score-lbl">High</div></div>
          <div class="score-card"><div class="score-val" style="color:#f59e0b">${open}</div><div class="score-lbl">Open</div></div>
          <div class="score-card"><div class="score-val" style="color:#22c55e">${resolved}</div><div class="score-lbl">Resolved</div></div>
        </div>
        <div class="controls-row">
          <input class="search-box" type="text" placeholder="Search by title, description, category, assignee..." .value=${this._searchQuery} @input=${(e: Event) => { this._searchQuery = (e.target as HTMLInputElement).value; }} />
          <select class="filter-select" @change=${(e: Event) => { this._severityFilter = (e.target as HTMLSelectElement).value as Severity | 'all'; }}>
            <option value="all">All Severity</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="info">Info</option>
          </select>
          <select class="filter-select" @change=${(e: Event) => { this._statusFilter = (e.target as HTMLSelectElement).value as Status | 'all'; }}>
            <option value="all">All Status</option><option value="open">Open</option><option value="in-progress">In Progress</option><option value="resolved">Resolved</option><option value="escalated">Escalated</option><option value="acknowledged">Acknowledged</option><option value="false-positive">False Positive</option>
          </select>
          <select class="filter-select" @change=${(e: Event) => { this._sortField = (e.target as HTMLSelectElement).value as 'severity' | 'date' | 'title'; }}>
            <option value="date">Sort: Date</option><option value="severity">Sort: Severity</option><option value="title">Sort: Title</option>
          </select>
          <button class="btn" @click=${() => { this._sortAsc = !this._sortAsc; }}>${this._sortAsc ? '\u2191' : '\u2193'}</button>
          <button class="btn primary" @click=${() => { this._activeTab = 'new'; }}>New Entry</button>
          <button class="btn" @click=${() => this._exportJSON()}>JSON</button>
          <button class="btn" @click=${() => this._exportCSV()}>CSV</button>
        </div>
        <div class="tabs">
          <button class="tab ${this._activeTab === 'overview' ? 'active' : ''}" @click=${() => { this._activeTab = 'overview'; }}>Overview</button>
          <button class="tab ${this._activeTab === 'details' ? 'active' : ''}" @click=${() => { this._activeTab = 'details'; }}>Details</button>
          <button class="tab ${this._activeTab === 'trends' ? 'active' : ''}" @click=${() => { this._activeTab = 'trends'; }}>Trends</button>
          <button class="tab ${this._activeTab === 'history' ? 'active' : ''}" @click=${() => { this._activeTab = 'history'; }}>History</button>
          <button class="tab ${this._activeTab === 'new' ? 'active' : ''}" @click=${() => { this._activeTab = 'new'; }}>New</button>
        </div>
        ${this._activeTab === 'overview' ? html`
          ${this._renderDonut()}
          <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
            ${this._renderGauge(open, this._items.length, 'Open Items', open > high ? '#f97316' : '#22c55e')}
            ${this._renderGauge(resolved, this._items.length, 'Resolved', '#22c55e')}
            ${this._renderGauge(crit, this._items.length, 'Critical', '#ef4444')}
          </div>
          <div style="font-size:13px;font-weight:600;margin-bottom:8px;">Recent Items</div>
          <div class="list">
            ${items.slice(0, 5).map(i => html`
              <div class="item" @click=${() => this._toggle(i.id)}>
                <div class="item-header"><div class="item-title">${i.title}</div><div class="badges"><span class="badge ${this._getSevBadge(i.severity)}">${i.severity}</span><span class="badge ${this._getSevBadge(i.status)}">${i.status}</span></div></div>
                <div class="item-meta">${i.description.substring(0, 100)}${i.description.length > 100 ? '...' : ''}</div>
              </div>
            `)}
          </div>
        ` : nothing}
        ${this._activeTab === 'details' ? html`
          <div class="list">
            ${items.map(i => html`
              <div class="item ${this._expandedId === i.id ? 'expanded' : ''}" @click=${() => this._toggle(i.id)}>
                <div class="item-header"><div class="item-title">${i.title}</div><div class="badges"><span class="badge ${this._getSevBadge(i.severity)}">${i.severity}</span><span class="badge ${this._getSevBadge(i.status)}">${i.status}</span><span class="badge ${this._getSevBadge(i.priority)}">${i.priority}</span></div></div>
                <div class="item-meta">${i.description.substring(0, 120)}${i.description.length > 120 ? '...' : ''}</div>
                ${this._expandedId === i.id ? html`
                  <div class="item-detail">
                    <div style="font-size:12px;color:#cbd5e1;line-height:1.6;margin-bottom:10px;">${i.description}</div>
                    <div class="detail-grid">
                      <div class="score-card"><div class="score-val" style="font-size:14px;">${i.category}</div><div class="score-lbl">Category</div></div>
                      <div class="score-card"><div class="score-val" style="font-size:14px;">${i.source}</div><div class="score-lbl">Source</div></div>
                      <div class="score-card"><div class="score-val" style="font-size:14px;">${i.assignee}</div><div class="score-lbl">Assignee</div></div>
                      <div class="score-card"><div class="score-val" style="font-size:14px;">${i.slaMinutes}m</div><div class="score-lbl">SLA</div></div>
                    </div>
                    <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">Created: ${new Date(i.createdAt).toLocaleString()} | Tags: ${i.tags.join(', ')}</div>
                    ${i.stepsTaken.length ? html`<div style="margin-bottom:8px;font-size:12px;font-weight:600;">Steps Taken:</div>${i.stepsTaken.map(s => html`<div style="font-size:11px;color:#94a3b8;padding:2px 0;">- ${s}</div>`)}` : nothing}
                    <div style="margin-top:10px;display:flex;gap:6px;">
                      <button class="btn success" @click=${(e: Event) => { e.stopPropagation(); }}>Resolve</button>
                      <button class="btn" @click=${(e: Event) => { e.stopPropagation(); }}>Escalate</button>
                      <button class="btn" @click=${(e: Event) => { e.stopPropagation(); }}>Reassign</button>
                      <button class="btn danger" @click=${(e: Event) => { e.stopPropagation(); }}>Dismiss</button>
                    </div>
                  </div>
                ` : nothing}
              </div>
            `)}
            ${items.length === 0 ? html`<div class="empty-state">No items match the current filters</div>` : nothing}
          </div>
        ` : nothing}
        ${this._activeTab === 'trends' ? html`
          ${this._renderBarChart()}
          <table class="history-table"><thead><tr><th>Date</th><th>Opened</th><th>Resolved</th><th>Critical</th><th>Net Change</th></tr></thead><tbody>
            ${this._trends.map(t => html`<tr><td>${t.date}</td><td>${t.opened}</td><td>${t.resolved}</td><td style="color:${t.critical > 0 ? '#ef4444' : '#22c55e'}">${t.critical}</td><td style="color:${t.opened - t.resolved > 0 ? '#ef4444' : '#22c55e'}">${t.opened - t.resolved > 0 ? '+' : ''}${t.opened - t.resolved}</td></tr>`)}
          </tbody></table>
        ` : nothing}
        ${this._activeTab === 'history' ? html`
          <table class="history-table"><thead><tr><th>Timestamp</th><th>Action</th><th>User</th><th>Details</th></tr></thead><tbody>
            ${this._history.map(h => html`<tr><td>${h.timestamp}</td><td><span class="badge badge-info">${h.action}</span></td><td>${h.user}</td><td>${h.details}</td></tr>`)}
          </tbody></table>
        ` : nothing}
        ${this._activeTab === 'new' ? html`
          <div class="form-section">
            <div class="form-title">Create New Scan Results Table Entry</div>
            <div class="form-grid">
              <div class="form-field"><label class="form-label">Title</label><input class="form-input" type="text" placeholder="Enter finding title..."/></div>
              <div class="form-field"><label class="form-label">Severity</label><select class="form-input"><option>Critical</option><option>High</option><option>Medium</option><option>Low</option><option>Info</option></select></div>
              <div class="form-field"><label class="form-label">Category</label><select class="form-input"><option>Security</option><option>Network</option><option>Access</option><option>Compliance</option><option>Operations</option></select></div>
              <div class="form-field"><label class="form-label">Source</label><select class="form-input"><option>SIEM</option><option>EDR</option><option>Scanner</option><option>Audit</option><option>Manual</option></select></div>
              <div class="form-field"><label class="form-label">Priority</label><select class="form-input"><option>P1</option><option>P2</option><option>P3</option><option>P4</option><option>P5</option></select></div>
              <div class="form-field"><label class="form-label">Assignee</label><input class="form-input" type="text" placeholder="Team or person..."/></div>
              <div class="form-field"><label class="form-label">SLA (minutes)</label><input class="form-input" type="number" placeholder="60"/></div>
              <div class="form-field"><label class="form-label">Tags</label><input class="form-input" type="text" placeholder="Comma-separated tags..."/></div>
              <div class="form-field" style="grid-column: 1 / -1;"><label class="form-label">Description</label><textarea class="form-input" rows="3" placeholder="Detailed description of the finding..."></textarea></div>
            </div>
            <div style="display:flex;gap:8px;margin-top:12px;">
              <button class="btn success" @click=${() => { this._activeTab = 'details'; }}>Create Entry</button>
              <button class="btn" @click=${() => { this._activeTab = 'overview'; }}>Cancel</button>
            </div>
          </div>
        ` : nothing}
      </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-scan-results-table': ScScanResultsTable; } }
