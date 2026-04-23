/**
 * sc-security-timeline - Security Timeline
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

@customElement('sc-security-timeline')
export class ScSecurityTimeline extends LitElement {

  // --- SecurityTimeline Risk Scoring Engine ---
  @state() private _stmriskScore = 0;
  @state() private _stmriskLevel = 'low';
  private _stmriskFactors: Record<string, { weight: number; label: string }> = {
    factor1: { weight: 0.25, label: 'Primary Factor' },
    factor2: { weight: 0.20, label: 'Secondary Factor' },
    factor3: { weight: 0.20, label: 'Tertiary Factor' },
    factor4: { weight: 0.15, label: 'Quaternary Factor' },
    factor5: { weight: 0.20, label: 'Quinary Factor' },
  };

  private _computeSecurityTimelineRisk(): { score: number; level: string; factors: { name: string; score: number; label: string }[] } {
    const factors: { name: string; score: number; label: string }[] = Object.entries(this._stmriskFactors).map(([name, f]) => ({
      name, score: Math.floor(Math.random() * 60) + 20, label: f.label,
    }));
    const score = Math.round(factors.reduce((s, f) => s + f.score * (this._stmriskFactors[f.name]?.weight || 0.15), 0));
    const level = score > 75 ? 'critical' : score > 50 ? 'high' : score > 25 ? 'medium' : 'low';
    this._stmriskScore = score;
    this._stmriskLevel = level;
    return { score, level, factors };
  }

  // --- MITRE ATT&CK Correlation ---
  private _stmmitreMap: Record<string, { techniqueId: string; techniqueName: string; tactic: string }> = {
    'phishing': { techniqueId: 'T1566', techniqueName: 'Phishing', tactic: 'Initial Access' },
    'valid-accounts': { techniqueId: 'T1078', techniqueName: 'Valid Accounts', tactic: 'Initial Access' },
    'command-exec': { techniqueId: 'T1059', techniqueName: 'Command Interpreter', tactic: 'Execution' },
    'credential-dump': { techniqueId: 'T1003', techniqueName: 'Credential Dumping', tactic: 'Credential Access' },
    'lateral-movement': { techniqueId: 'T1021', techniqueName: 'Remote Services', tactic: 'Lateral Movement' },
    'defense-evasion': { techniqueId: 'T1070', techniqueName: 'Indicator Removal', tactic: 'Defense Evasion' },
  };

  private _correlateSecurityTimelineMitre(): { tactic: string; techniques: { id: string; name: string; count: number }[] }[] {
    const tacticMap: Record<string, { id: string; name: string; count: number }[]> = {};
    for (const [key, mitre] of Object.entries(this._stmmitreMap)) {
      if (!tacticMap[mitre.tactic]) tacticMap[mitre.tactic] = [];
      tacticMap[mitre.tactic].push({ id: mitre.techniqueId, name: mitre.techniqueName, count: Math.floor(Math.random() * 5) + 1 });
    }
    return Object.entries(tacticMap).map(([tactic, techniques]) => ({ tactic, techniques }));
  }

  // --- Radar Chart SVG ---
  private _stmradarSVG(): string {
    const dims = Object.values(this._stmriskFactors).map(f => f.label);
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
  private _stmheatmapSVG(): string {
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
  @state() private _stmteam: { id: string; name: string; role: string; status: string }[] = [
    { id: 'stm1', name: 'Team Lead', role: 'Management', status: 'online' },
    { id: 'stm2', name: 'Analyst', role: 'Operations', status: 'online' },
    { id: 'stm3', name: 'Engineer', role: 'Technical', status: 'busy' },
  ];
  @state() private _stmcomments: { id: string; userId: string; text: string; timestamp: string }[] = [];
  @state() private _stmcommentText = '';

  private _addSecurityTimelineComment() {
    if (!this._stmcommentText.trim()) return;
    this._stmcomments = [{ id: 'stmc' + Date.now(), userId: 'You', text: this._stmcommentText.trim(), timestamp: new Date().toISOString() }, ...this._stmcomments].slice(0, 30);
    this._stmcommentText = '';
  }

  private _renderSecurityTimelineCollab(): any {
    return html`
      <div style="margin-top:16px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Team Discussion</div>
        ${
          this._stmteam.map(m => html`
            <div style="display:flex;align-items:center;gap:4px;background:#1f2937;border-radius:4px;padding:3px 8px;font-size:10px">
              <div style="width:6px;height:6px;border-radius:50%;background:${m.status === 'online' ? '#22c55e' : '#eab308'}"></div>
              <span style="font-weight:600">${m.name}</span>
            </div>
          `)
        }
        ${
          this._stmcomments.length > 0 ? html`
            <div style="max-height:60px;overflow-y:auto;margin-bottom:6px">
              ${
                this._stmcomments.slice(0, 5).map(c => html`<div style="font-size:10px;padding:3px 0;border-bottom:1px solid #1f2937"><span style="font-weight:600;color:#e2e8f0">${c.userId}</span><span style="color:#9ca3af">: ${c.text}</span></div>`)
              }
            </div>
          ` : nothing
        }
        <div style="display:flex;gap:6px">
          <input style="flex:1;background:#0f172a;border:1px solid #374151;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:10px" placeholder="Comment..." .value=${this._stmcommentText} @input=${(e: any) => this._stmcommentText = e.target.value}>
          <button style="background:#f59e0b;color:#111827;border:none;border-radius:4px;padding:4px 10px;font-size:10px;font-weight:600;cursor:pointer" @click=${this._addSecurityTimelineComment}>Post</button>
        </div>
      </div>
    `;
  }

  // --- Auto-Insights ---
  private _generateSecurityTimelineInsights(): { icon: string; text: string; severity: string }[] {
    const insights: { icon: string; text: string; severity: string }[] = [];
    const risk = this._computeSecurityTimelineRisk();
    if (risk.score > 75) insights.push({ icon: '\u26A0\uFE0F', text: 'SecurityTimeline risk score is ' + risk.score + '/100. Immediate attention required.', severity: 'critical' });
    else if (risk.score > 50) insights.push({ icon: '\uD83D\uDD04', text: 'SecurityTimeline risk is elevated at ' + risk.score + '/100.', severity: 'high' });
    return insights.length > 0 ? insights : [{ icon: '\u2705', text: 'SecurityTimeline status is normal.', severity: 'low' }];
  }

  private _renderSecurityTimelineInsights(): any {
    const insights = this._generateSecurityTimelineInsights();
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
  @state() private _stmconfig: { showRadar: boolean; showHeatmap: boolean; showCollab: boolean; autoRefresh: boolean } = { showRadar: true, showHeatmap: true, showCollab: true, autoRefresh: false };

  private _renderSecurityTimelineConfig(): any {
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Configuration</div>
        ${
          Object.entries(this._stmconfig).map(([key, val]) => html`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1f2937">
              <span style="font-size:10px;color:#9ca3af">${key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <div style="width:32px;height:18px;border-radius:9px;background:${val ? '#22c55e' : '#374151'};cursor:pointer;position:relative" @click=${() => { this._stmconfig = { ...this._stmconfig, [key]: !val }; }}>
                <div style="width:14px;height:14px;border-radius:50%;background:white;position:absolute;top:2px;left:${val ? '16px' : '2px'};transition:left 0.2s"></div>
              </div>
            </div>
          `)
        }
      </div>
    `;
  }

  // --- Anomaly Detection ---
  private _detectSecurityTimelineAnomalies(): { type: string; description: string; severity: string }[] {
    const anomalies: { type: string; description: string; severity: string }[] = [];
    const risk = this._computeSecurityTimelineRisk();
    if (risk.score > 80) anomalies.push({ type: 'Critical Risk', description: 'SecurityTimeline risk exceeds 80 threshold.', severity: 'critical' });
    return anomalies;
  }

  private _renderSecurityTimelineAnomalies(): any {
    const anomalies = this._detectSecurityTimelineAnomalies();
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
  private _predictSecurityTimelineTrend(): { direction: string; confidence: number; reason: string } {
    const risk = this._computeSecurityTimelineRisk();
    if (risk.score > 60) return { direction: 'INCREASING', confidence: 0.7, reason: 'Risk indicators trending upward' };
    return { direction: 'STABLE', confidence: 0.6, reason: 'Risk within normal parameters' };
  }

  private _renderSecurityTimelineTrend(): any {
    const trend = this._predictSecurityTimelineTrend();
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
  private _stmcomplianceRules: { rule: string; standard: string; status: 'pass' | 'fail' | 'warning' }[] = [
    { rule: 'Security controls documented', standard: 'ISO 27001 A.5.1', status: 'pass' },
    { rule: 'Regular assessments performed', standard: 'NIST 800-53 CA-2', status: 'pass' },
    { rule: 'Risk acceptance criteria defined', standard: 'ISO 27001 A.6.1', status: 'warning' },
    { rule: 'Remediation tracking active', standard: 'NIST 800-53 RA-5', status: 'fail' },
    { rule: 'Stakeholder reporting current', standard: 'SOC2 CC4.1', status: 'pass' },
  ];

  private _renderSecurityTimelineCompliance(): any {
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Compliance</div>
        ${
          this._stmcomplianceRules.map(r => html`
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

  
    .risk-transfer-section, .talent-mgmt-section, .vendor-assess-section,
    .policy-engine-section, .metrics-builder-section {
      margin-top: 1.5rem; padding: 1rem; border: 1px solid #2a3a5c; border-radius: 8px;
      background: rgba(15, 23, 42, 0.6);
    }
    .risk-transfer-section h4, .talent-mgmt-section h4, .vendor-assess-section h4,
    .policy-engine-section h4, .metrics-builder-section h4 {
      margin: 0 0 0.75rem; font-size: 0.95rem; color: #60a5fa; border-bottom: 1px solid #1e3a5f; padding-bottom: 0.4rem;
    }
    .risk-transfer-section h5, .talent-mgmt-section h5, .vendor-assess-section h5,
    .policy-engine-section h5, .metrics-builder-section h5 {
      margin: 1rem 0 0.5rem; font-size: 0.85rem; color: #93c5fd;
    }
    .rt-summary-row, .tm-stats-row, .va-stats-row, .pe-stats-row, .mb-canvas-header {
      display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem;
    }
    .rt-stat, .tm-stat, .va-stat, .pe-stat { flex: 1; min-width: 120px; padding: 0.5rem; background: rgba(30, 58, 95, 0.5); border-radius: 6px; text-align: center; }
    .rt-label, .tm-label, .va-label, .pe-label { display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 0.25rem; }
    .rt-value, .tm-value, .va-value, .pe-value { display: block; font-size: 1.1rem; font-weight: 700; color: #e2e8f0; }
    .rt-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
    .rt-table th, .rt-table td { padding: 0.35rem 0.5rem; border: 1px solid #1e3a5f; text-align: left; }
    .rt-table th { background: #1e3a5f; color: #93c5fd; }
    .status-active { color: #34d399; } .status-pending { color: #fbbf24; } .status-draft { color: #f97316; }
    .status-under-review { color: #60a5fa; }
    .rt-decision-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; }
    .rt-decision-card { padding: 0.6rem; background: rgba(30, 58, 95, 0.4); border-radius: 6px; border: 1px solid #1e3a5f; }
    .rt-risk-name { font-weight: 600; color: #e2e8f0; font-size: 0.8rem; } .rt-category { font-size: 0.7rem; color: #94a3b8; }
    .rt-bar-wrap { display: flex; height: 8px; border-radius: 4px; overflow: hidden; margin: 0.3rem 0; }
    .rt-bar-transfer { background: #3b82f6; } .rt-bar-retain { background: #f59e0b; }
    .rt-bar-labels { display: flex; justify-content: space-between; font-size: 0.65rem; color: #94a3b8; }
    .rt-decision-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 10px; font-size: 0.65rem; font-weight: 600; margin-top: 0.3rem; }
    .rt-decision-badge.transfer { background: rgba(59,130,246,0.2); color: #60a5fa; }
    .rt-decision-badge.partial-transfer { background: rgba(168,85,247,0.2); color: #c084fc; }
    .rt-decision-badge.retain { background: rgba(245,158,11,0.2); color: #fbbf24; }
    .tm-skills-grid { overflow-x: auto; }
    .tm-skills-header, .tm-member-row { display: flex; align-items: center; min-width: 900px; }
    .tm-name-cell { width: 140px; min-width: 140px; padding: 0.3rem; font-size: 0.7rem; color: #e2e8f0; }
    .tm-name-cell small { color: #64748b; }
    .tm-skill-cell, .tm-level-cell { width: 80px; min-width: 80px; text-align: center; padding: 0.3rem; font-size: 0.65rem; border: 1px solid #1e3a5f; }
    .tm-skill-cell { background: #1e3a5f; color: #93c5fd; font-weight: 600; }
    .tm-level-cell { background: rgba(30, 58, 95, 0.3); }
    .level-5 { background: rgba(16,185,129,0.4) !important; color: #34d399; font-weight: 700; }
    .level-4 { background: rgba(59,130,246,0.3) !important; color: #60a5fa; font-weight: 600; }
    .level-3 { background: rgba(168,85,247,0.2) !important; color: #c084fc; }
    .level-2 { background: rgba(245,158,11,0.2) !important; color: #fbbf24; }
    .level-1 { background: rgba(239,68,68,0.2) !important; color: #f87171; }
    .tm-meta-cell { width: 90px; min-width: 90px; text-align: center; font-size: 0.65rem; color: #94a3b8; padding: 0.3rem; }
    .tm-pipeline { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.5rem; }
    .tm-pipe-card { padding: 0.5rem; background: rgba(30,58,95,0.4); border-radius: 6px; border: 1px solid #1e3a5f; }
    .tm-pipe-role { font-weight: 600; font-size: 0.8rem; color: #e2e8f0; }
    .tm-pipe-stage { font-size: 0.7rem; color: #60a5fa; margin: 0.2rem 0; }
    .tm-pipe-info { display: flex; justify-content: space-between; font-size: 0.65rem; color: #94a3b8; }
    .tm-pipe-priority { display: inline-block; padding: 0.1rem 0.4rem; border-radius: 8px; font-size: 0.6rem; font-weight: 600; margin-top: 0.2rem; }
    .priority-critical { background: rgba(239,68,68,0.3); color: #f87171; }
    .priority-high { background: rgba(245,158,11,0.3); color: #fbbf24; }
    .priority-medium { background: rgba(59,130,246,0.3); color: #60a5fa; }
    .va-scorecard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
    .va-vendor-card { padding: 0.6rem; background: rgba(30,58,95,0.4); border-radius: 6px; border: 1px solid #1e3a5f; }
    .va-vendor-name { font-weight: 700; font-size: 0.85rem; color: #e2e8f0; }
    .va-vendor-cat { font-size: 0.7rem; color: #94a3b8; }
    .va-score-bar { position: relative; height: 8px; background: #1e293b; border-radius: 4px; margin: 0.4rem 0; }
    .va-score-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 4px; }
    .va-score-bar span { position: absolute; right: 4px; top: -1px; font-size: 0.65rem; color: #e2e8f0; }
    .va-vendor-meta { display: flex; gap: 0.5rem; font-size: 0.65rem; color: #94a3b8; flex-wrap: wrap; }
    .risk-low { color: #34d399; } .risk-medium { color: #fbbf24; } .risk-high { color: #f87171; }
    .va-renewal { font-size: 0.65rem; color: #60a5fa; margin-top: 0.2rem; }
    .va-dep-table { overflow-x: auto; }
    .va-dep-table table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
    .va-dep-table th, .va-dep-table td { padding: 0.35rem 0.5rem; border: 1px solid #1e3a5f; }
    .va-dep-table th { background: #1e3a5f; color: #93c5fd; }
    .sp-yes { color: #f87171; font-weight: 600; } .sp-no { color: #34d399; }
    .pe-policy-list { max-height: 400px; overflow-y: auto; }
    .pe-policy-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem; border-bottom: 1px solid #1e293b; font-size: 0.7rem; flex-wrap: wrap; }
    .pe-id { color: #64748b; width: 60px; } .pe-name { color: #e2e8f0; width: 180px; font-weight: 600; }
    .pe-ver { color: #94a3b8; width: 40px; } .pe-owner { color: #94a3b8; width: 80px; }
    .pe-next { color: #fbbf24; font-size: 0.65rem; width: 100px; }
    .pe-compliance-bar { position: relative; width: 80px; height: 6px; background: #1e293b; border-radius: 3px; }
    .pe-comp-fill { height: 100%; background: #3b82f6; border-radius: 3px; }
    .pe-compliance-bar span { position: absolute; right: 2px; top: -2px; font-size: 0.6rem; color: #e2e8f0; }
    .pe-exceptions { margin-top: 0.5rem; }
    .pe-exc-row { display: flex; gap: 0.5rem; padding: 0.3rem; border-bottom: 1px solid #1e293b; font-size: 0.7rem; flex-wrap: wrap; }
    .exc-approved { color: #34d399; } .exc-pending { color: #fbbf24; }
    .mb-grid { display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(3, 120px); gap: 0.5rem; margin-bottom: 1rem; }
    .mb-widget { background: rgba(30,58,95,0.5); border: 1px solid #1e3a5f; border-radius: 6px; padding: 0.5rem; display: flex; flex-direction: column; }
    .mb-widget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem; }
    .mb-widget-title { font-size: 0.7rem; font-weight: 600; color: #e2e8f0; }
    .mb-widget-type { font-size: 0.6rem; color: #64748b; background: rgba(100,116,139,0.2); padding: 0.1rem 0.3rem; border-radius: 4px; }
    .mb-widget-body { flex: 1; display: flex; align-items: center; justify-content: center; }
    .mb-kpi { font-size: 1.5rem; font-weight: 700; color: #60a5fa; }
    .mb-trend { font-size: 0.75rem; color: #34d399; margin-left: 0.3rem; }
    .mb-gauge { width: 80%; height: 10px; background: #1e293b; border-radius: 5px; position: relative; }
    .mb-gauge-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #3b82f6); border-radius: 5px; }
    .mb-gauge span { position: absolute; right: -30px; top: -2px; font-size: 0.7rem; color: #e2e8f0; }
    .mb-counter { font-size: 2rem; font-weight: 700; color: #e2e8f0; }
    .mb-delta { font-size: 0.8rem; color: #34d399; }
    .mb-placeholder { color: #475569; font-size: 0.75rem; font-style: italic; }
    .mb-catalog { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.4rem; }
    .mb-catalog-item { padding: 0.4rem; background: rgba(30,58,95,0.3); border-radius: 4px; border: 1px solid #1e293b; cursor: grab; }
    .mb-ci-type { font-size: 0.6rem; color: #64748b; } .mb-ci-name { font-size: 0.75rem; color: #e2e8f0; font-weight: 600; }
    .mb-ci-desc { font-size: 0.65rem; color: #94a3b8; } .mb-ci-cat { font-size: 0.6rem; color: #60a5fa; margin-top: 0.1rem; }
    .mb-templates { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
    .mb-tpl-card { padding: 0.5rem; background: rgba(30,58,95,0.3); border-radius: 6px; border: 1px solid #1e3a5f; }
    .mb-tpl-name { font-weight: 600; font-size: 0.8rem; color: #e2e8f0; }
    .mb-tpl-meta { display: flex; gap: 0.5rem; font-size: 0.65rem; color: #94a3b8; }
    .mb-tpl-shared { font-size: 0.65rem; color: #64748b; margin-top: 0.2rem; }
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
            "id": "security-timeline-1",
            "title": "Security Timeline Finding #1",
            "severity": "low",
            "status": "open",
            "category": "Security",
            "source": "SIEM",
            "description": "Automated security timeline assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-15T00:00:00Z",
            "assignee": "soc-tier1",
            "tags": [
                  "security-timeline",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 15,
            "stepsTaken": []
      },
      {
            "id": "security-timeline-2",
            "title": "Security Timeline Finding #2",
            "severity": "medium",
            "status": "open",
            "category": "Network",
            "source": "EDR",
            "description": "Automated security timeline assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-16T02:00:00Z",
            "assignee": "soc-tier2",
            "tags": [
                  "security-timeline",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 30,
            "stepsTaken": []
      },
      {
            "id": "security-timeline-3",
            "title": "Security Timeline Finding #3",
            "severity": "high",
            "status": "open",
            "category": "Access",
            "source": "Scanner",
            "description": "Automated security timeline assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-17T04:00:00Z",
            "assignee": "security-eng",
            "tags": [
                  "security-timeline",
                  "automated"
            ],
            "priority": "p3",
            "slaMinutes": 60,
            "stepsTaken": []
      },
      {
            "id": "security-timeline-4",
            "title": "Security Timeline Finding #4",
            "severity": "low",
            "status": "open",
            "category": "Compliance",
            "source": "Audit",
            "description": "Automated security timeline assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-18T06:00:00Z",
            "assignee": "compliance",
            "tags": [
                  "security-timeline",
                  "automated"
            ],
            "priority": "p4",
            "slaMinutes": 120,
            "stepsTaken": []
      },
      {
            "id": "security-timeline-5",
            "title": "Security Timeline Finding #5",
            "severity": "medium",
            "status": "open",
            "category": "Operations",
            "source": "Manual",
            "description": "Automated security timeline assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-19T08:00:00Z",
            "assignee": "ops",
            "tags": [
                  "security-timeline",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 240,
            "stepsTaken": []
      },
      {
            "id": "security-timeline-6",
            "title": "Security Timeline Finding #6",
            "severity": "high",
            "status": "open",
            "category": "Security",
            "source": "SIEM",
            "description": "Automated security timeline assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-20T10:00:00Z",
            "assignee": "soc-tier1",
            "tags": [
                  "security-timeline",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 15,
            "stepsTaken": []
      },
      {
            "id": "security-timeline-7",
            "title": "Security Timeline Finding #7",
            "severity": "low",
            "status": "open",
            "category": "Network",
            "source": "EDR",
            "description": "Automated security timeline assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-21T12:00:00Z",
            "assignee": "soc-tier2",
            "tags": [
                  "security-timeline",
                  "automated"
            ],
            "priority": "p3",
            "slaMinutes": 30,
            "stepsTaken": []
      },
      {
            "id": "security-timeline-8",
            "title": "Security Timeline Finding #8",
            "severity": "medium",
            "status": "open",
            "category": "Access",
            "source": "Scanner",
            "description": "Automated security timeline assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-22T14:00:00Z",
            "assignee": "security-eng",
            "tags": [
                  "security-timeline",
                  "automated"
            ],
            "priority": "p4",
            "slaMinutes": 60,
            "stepsTaken": []
      },
      {
            "id": "security-timeline-9",
            "title": "Security Timeline Finding #9",
            "severity": "high",
            "status": "open",
            "category": "Compliance",
            "source": "Audit",
            "description": "Automated security timeline assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-23T16:00:00Z",
            "assignee": "compliance",
            "tags": [
                  "security-timeline",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 120,
            "stepsTaken": []
      },
      {
            "id": "security-timeline-10",
            "title": "Security Timeline Finding #10",
            "severity": "low",
            "status": "open",
            "category": "Operations",
            "source": "Manual",
            "description": "Automated security timeline assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-24T18:00:00Z",
            "assignee": "ops",
            "tags": [
                  "security-timeline",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 240,
            "stepsTaken": []
      }
];

  private _history: HistoryEntry[] = [
    { timestamp: '2026-04-23 04:15', action: 'Auto-correlated', user: 'system', details: 'Grouped related findings from Security Timeline analysis' },
    { timestamp: '2026-04-23 03:00', action: 'Created', user: 'scanner', details: 'New Security Timeline finding detected by automated assessment' },
    { timestamp: '2026-04-23 02:30', action: 'Escalated', user: 'soc-tier1', details: 'Escalated critical finding to tier 2 for investigation' },
    { timestamp: '2026-04-23 01:00', action: 'Updated', user: 'soc-tier2', details: 'Added investigation notes and IOC indicators' },
    { timestamp: '2026-04-22 22:00', action: 'Resolved', user: 'security-eng', details: 'Remediation applied and verified for Security Timeline finding' },
    { timestamp: '2026-04-22 18:00', action: 'Created', user: 'audit', details: 'Compliance audit identified Security Timeline gap requiring remediation' },
    { timestamp: '2026-04-22 14:00', action: 'Acknowledged', user: 'ops-team', details: 'Operations team acknowledged finding and created remediation task' },
    { timestamp: '2026-04-22 10:00', action: 'Assigned', user: 'manager', details: 'Finding assigned to security engineering team for resolution' },
    { timestamp: '2026-04-21 16:00', action: 'Resolved', user: 'soc-tier1', details: 'False positive confirmed - benign activity flagged by Security Timeline scan' },
    { timestamp: '2026-04-21 12:00', action: 'Exported', user: 'compliance', details: 'Exported Security Timeline findings for Q1 compliance report' },
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
    const a = document.createElement('a'); a.href = url; a.download = 'sc-security-timeline-data.json'; a.click();
    URL.revokeObjectURL(url);
  }

  private _exportCSV() {
    const items = this._getFiltered();
    const header = 'ID,Title,Severity,Status,Category,Source,Assignee,Priority,Created\n';
    const rows = items.map(i => `"${i.id}","${i.title}","${i.severity}","${i.status}","${i.category}","${i.source}","${i.assignee}","${i.priority}","${i.createdAt}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sc-security-timeline-data.csv'; a.click();
    URL.revokeObjectURL(url);
  }


  // --- Domain Rules Engine ---
  @state() private _stlRules: { id: string; name: string; category: string; severity: Severity; enabled: boolean; lastEval: string; passRate: number }[] = [];
  private _initStlRules() {
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
    this._stlRules = rules;
  }
  private _evaluateStlRules(): { passed: number; failed: number; skipped: number; total: number } {
    let passed = 0, failed = 0, skipped = 0;
    this._stlRules.forEach(r => { if (!r.enabled) { skipped++; } else if (r.passRate >= 80) { passed++; } else { failed++; } });
    return { passed, failed, skipped, total: this._stlRules.length };
  }

  // --- CVSS Scoring ---
  @state() private _stlcvssData: { itemId: string; vector: string; base: number; temporal: number; environmental: number; overall: number }[] = [];
  private _initStlCvss() {
    const vectors = ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:A/AC:H/PR:L/UI:R/S:C/C:L/I:L/A:N', 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N', 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:N/I:L/A:N'];
    this._stlcvssData = vectors.map((v, i) => {
      const base = parseFloat((Math.random() * 6 + 3).toFixed(1));
      const temporal = parseFloat((base * (0.7 + Math.random() * 0.3)).toFixed(1));
      const environmental = parseFloat((temporal * (0.8 + Math.random() * 0.2)).toFixed(1));
      return { itemId: 'V-' + String(i + 1).padStart(3, '0'), vector: v, base, temporal, environmental, overall: environmental };
    });
  }

  // --- Anomaly Detection ---
  @state() private _stlanomalies: { id: string; type: string; severity: Severity; description: string; detected: string; confidence: number; affected: string[] }[] = [];
  private _runStlAnomalyDetection() {
    const types = [
      { type: 'Spike in violation rate', severity: 'high' as Severity, desc: 'Detected 280% increase in violations over the last 24 hours', affected: ['Core', 'Operations'] },
      { type: 'SLA breach pattern', severity: 'critical' as Severity, desc: 'Recurring SLA breaches on weekends indicating staffing gaps', affected: ['SLA', 'Staffing'] },
      { type: 'Baseline drift detected', severity: 'medium' as Severity, desc: 'Score drifted 10 points below established baseline over 7 days', affected: ['Metrics', 'Baseline'] },
      { type: 'Unusual escalation volume', severity: 'high' as Severity, desc: 'Escalation rate 2.5x above normal in infrastructure controls', affected: ['Infrastructure', 'Controls'] },
      { type: 'Stale findings accumulation', severity: 'low' as Severity, desc: '18 findings older than 90 days without status change', affected: ['Maintenance'] },
    ];
    this._stlanomalies = types.map((a, i) => ({
      id: 'ANO-' + String(i + 1).padStart(3, '0'), type: a.type, severity: a.severity,
      description: a.desc, detected: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(2)), affected: a.affected,
    }));
  }

  // --- Trend Prediction ---
  @state() private _stlpredictions: { horizon: string; metric: string; current: number; predicted: number; direction: 'up' | 'down' | 'stable'; confidence: number }[] = [];
  private _generateStlPredictions() {
    this._stlpredictions = [
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
  @state() private _stlApprovals: { id: string; title: string; requester: string; status: 'pending' | 'approved' | 'rejected' | 'expired'; createdAt: string; priority: Priority; type: string }[] = [];
  private _initStlApprovals() {
    this._stlApprovals = [
      { id: 'APR-001', title: 'Emergency exception request for critical finding', requester: 'Alice Chen', status: 'pending', createdAt: '2026-04-23T07:00:00Z', priority: 'p1', type: 'Exception' },
      { id: 'APR-002', title: 'Extend compliance deadline for quarterly audit', requester: 'Bob Martinez', status: 'pending', createdAt: '2026-04-22T18:00:00Z', priority: 'p2', type: 'Extension' },
      { id: 'APR-003', title: 'Disable security control for system migration', requester: 'Carol Wu', status: 'rejected', createdAt: '2026-04-22T14:00:00Z', priority: 'p1', type: 'Policy Change' },
      { id: 'APR-004', title: 'New assessment approval for third-party vendor', requester: 'Dave Kim', status: 'approved', createdAt: '2026-04-21T10:00:00Z', priority: 'p3', type: 'Vendor' },
      { id: 'APR-005', title: 'Network rule change for partner integration', requester: 'Eve Johnson', status: 'expired', createdAt: '2026-04-19T08:00:00Z', priority: 'p2', type: 'Network' },
    ];
  }
  private _approveStlItem(id: string) { const item = this._stlApprovals.find(a => a.id === id); if (item) item.status = 'approved'; this.requestUpdate(); }
  private _rejectStlItem(id: string) { const item = this._stlApprovals.find(a => a.id === id); if (item) item.status = 'rejected'; this.requestUpdate(); }

  // --- Activity Feed ---
  @state() private _stlActivity: { id: string; action: string; user: string; target: string; timestamp: string }[] = [];
  private _initStlActivity() {
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
    this._stlActivity = actions.map((a, i) => ({ id: 'ACT-' + String(i + 1).padStart(3, '0'), ...a, timestamp: new Date(Date.now() - i * 3600000).toISOString() }));
  }

  // --- Notification System ---
  @state() private _stlNotifications: { id: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; read: boolean; timestamp: string }[] = [];
  private _initStlNotifications() {
    this._stlNotifications = [
      { id: 'NTF-001', message: 'Score dropped below threshold', type: 'warning', read: false, timestamp: new Date().toISOString() },
      { id: 'NTF-002', message: '3 items approaching SLA deadline within 24h', type: 'error', read: false, timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: 'NTF-003', message: 'Weekly report generated successfully', type: 'success', read: true, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'NTF-004', message: 'New framework mapped to existing controls', type: 'info', read: true, timestamp: new Date(Date.now() - 14400000).toISOString() },
    ];
  }
  private _markStlNotifRead(id: string) { const n = this._stlNotifications.find(x => x.id === id); if (n) n.read = true; this.requestUpdate(); }

  // --- Panel Configuration ---
  @state() private _stlConfig: { layout: 'compact' | 'default' | 'expanded'; theme: 'dark' | 'midnight' | 'slate'; showAnomalies: boolean; showPredictions: boolean; autoRefresh: boolean; refreshInterval: number } = {
    layout: 'default', theme: 'dark', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60,
  };
  private _stlPresets: { name: string; config: typeof this._stlConfig }[] = [
    { name: 'Analyst View', config: { layout: 'expanded', theme: 'dark', showAnomalies: true, showPredictions: false, autoRefresh: true, refreshInterval: 30 } },
    { name: 'Executive Summary', config: { layout: 'compact', theme: 'slate', showAnomalies: false, showPredictions: true, autoRefresh: false, refreshInterval: 300 } },
    { name: 'Audit Mode', config: { layout: 'expanded', theme: 'midnight', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60 } },
  ];
  private _applyStlPreset(preset: typeof this._stlPresets[0]) { this._stlConfig = { ...preset.config }; this.requestUpdate(); }

  private _renderStlTreemapSVG(): string {
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

  private _renderStlSankeySVG(): string {
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
  private _renderStlRules(): any {
    const ev = this._evaluateStlRules();
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
          $${this._stlRules.map(r => html`
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
  private _renderStlAnomalies(): any {
    const sc = (s: Severity) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Anomaly Detection</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._stlanomalies.map(a => html`
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
  private _renderStlPredictions(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Trend Predictions</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          $${this._stlpredictions.map(pr => html`
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
  private _renderStlApprovals(): any {
    const stc = (s: string) => s === 'pending' ? '#eab308' : s === 'approved' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#6b7280';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Approval Workflow</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._stlApprovals.map(a => html`
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
                  <button class="btn success" style="padding:2px 8px;font-size:9px" @click=$${() => this._approveStlItem(a.id)}>Approve</button>
                  <button class="btn error" style="padding:2px 8px;font-size:9px" @click=$${() => this._rejectStlItem(a.id)}>Reject</button>
                </div>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Activity Feed ---
  private _renderStlActivity(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Activity Feed</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto">
          $${this._stlActivity.map(a => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <div style="width:20px;height:20px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;font-size:9px">•</div>
              <div style="flex:1"><span style="font-weight:600">$${a.user}</span> $${a.action}</div>
              <span style="font-size:8px;color:#6b7280">$${new Date(a.timestamp).toLocaleTimeString()}</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Notifications ---
  private _renderStlNotifications(): any {
    const tc = (t: string) => t === 'error' ? '#ef4444' : t === 'warning' ? '#eab308' : t === 'success' ? '#22c55e' : '#3b82f6';
    const unread = this._stlNotifications.filter(n => !n.read).length;
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Notifications $${unread > 0 ? html`<span class="badge badge-error">$${unread} new</span>` : nothing}</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:120px;overflow-y:auto">
          $${this._stlNotifications.map(n => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:$${n.read ? '#1f2937' : '#252a36'};border-radius:4px;font-size:10px;opacity:$${n.read ? '0.6' : '1'};cursor:pointer" @click=$${() => this._markStlNotifRead(n.id)}>
              <span style="width:8px;height:8px;border-radius:50%;background:$${tc(n.type)}"></span>
              <span style="flex:1">$${n.message}</span>
              $${!n.read ? html`<span style="width:6px;height:6px;border-radius:50%;background:#3b82f6"></span>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Panel Config ---
  private _renderStlConfig(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Panel Configuration</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Layout</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._stlConfig.layout = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="compact" ?selected=$${this._stlConfig.layout === 'compact'}>Compact</option>
              <option value="default" ?selected=$${this._stlConfig.layout === 'default'}>Default</option>
              <option value="expanded" ?selected=$${this._stlConfig.layout === 'expanded'}>Expanded</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Theme</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._stlConfig.theme = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="dark" ?selected=$${this._stlConfig.theme === 'dark'}>Dark</option>
              <option value="midnight" ?selected=$${this._stlConfig.theme === 'midnight'}>Midnight</option>
              <option value="slate" ?selected=$${this._stlConfig.theme === 'slate'}>Slate</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Auto Refresh</span>
            <input type="checkbox" ?checked=$${this._stlConfig.autoRefresh} @change=$${() => { this._stlConfig.autoRefresh = !this._stlConfig.autoRefresh; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Anomalies</span>
            <input type="checkbox" ?checked=$${this._stlConfig.showAnomalies} @change=$${() => { this._stlConfig.showAnomalies = !this._stlConfig.showAnomalies; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Predictions</span>
            <input type="checkbox" ?checked=$${this._stlConfig.showPredictions} @change=$${() => { this._stlConfig.showPredictions = !this._stlConfig.showPredictions; this.requestUpdate(); }}/>
          </div>
          <div style="margin-top:6px;font-weight:600">Presets</div>
          <div style="display:flex;gap:4px">
            $${this._stlPresets.map(ps => html`<button class="btn" style="padding:2px 8px;font-size:9px" @click=$${() => this._applyStlPreset(ps)}>$${ps.name}</button>`)}
          </div>
        </div>
      </div>`;
  }


  // ===== THREAT HUNTING WORKSPACE MODULE =====
  @state() private _huntHypotheses: Array<{
    id: string; title: string; description: string; status: 'active' | 'validated' | 'refuted' | 'pending';
    created: string; lastUpdated: string; assignedTo: string; killChainStage: string;
    iocPivots: number; findingsCount: number; confidence: number;
  }> = [
    { id: 'h-001', title: 'Credential Dumping via LSASS', description: 'Investigate potential LSASS access patterns from non-system processes',
      status: 'active', created: '2026-04-20T08:00:00Z', lastUpdated: '2026-04-23T06:30:00Z',
      assignedTo: 'Hunter-A', killChainStage: 'Credential Access', iocPivots: 12, findingsCount: 3, confidence: 72 },
    { id: 'h-002', title: 'Lateral Movement via RDP', description: 'Detect anomalous RDP connections between workstations',
      status: 'validated', created: '2026-04-19T14:00:00Z', lastUpdated: '2026-04-22T18:00:00Z',
      assignedTo: 'Hunter-B', killChainStage: 'Lateral Movement', iocPivots: 8, findingsCount: 5, confidence: 89 },
    { id: 'h-003', title: 'DNS Tunneling Detection', description: 'Analyze DNS query patterns for potential data exfiltration tunnels',
      status: 'pending', created: '2026-04-21T10:00:00Z', lastUpdated: '2026-04-21T10:00:00Z',
      assignedTo: 'Hunter-C', killChainStage: 'Command & Control', iocPivots: 3, findingsCount: 0, confidence: 35 },
    { id: 'h-004', title: 'Persistence via Scheduled Tasks', description: 'Hunt for suspicious scheduled task creations on critical servers',
      status: 'active', created: '2026-04-18T09:00:00Z', lastUpdated: '2026-04-22T12:00:00Z',
      assignedTo: 'Hunter-A', killChainStage: 'Persistence', iocPivots: 6, findingsCount: 2, confidence: 64 },
    { id: 'h-005', title: 'Living off the Land Binaries', description: 'Identify abuse of legitimate system tools for malicious purposes',
      status: 'refuted', created: '2026-04-17T11:00:00Z', lastUpdated: '2026-04-20T16:00:00Z',
      assignedTo: 'Hunter-D', killChainStage: 'Defense Evasion', iocPivots: 15, findingsCount: 1, confidence: 91 },
  ];
  @state() private _huntSessions: Array<{
    id: string; hypothesisId: string; startedAt: string; endedAt: string | null; duration: number;
    queriesRun: number; resultsFound: number; truePositives: number; falsePositives: number; status: 'running' | 'completed' | 'paused';
  }> = [
    { id: 's-001', hypothesisId: 'h-001', startedAt: '2026-04-23T06:00:00Z', endedAt: null, duration: 4500,
      queriesRun: 24, resultsFound: 8, truePositives: 3, falsePositives: 5, status: 'running' },
    { id: 's-002', hypothesisId: 'h-002', startedAt: '2026-04-22T14:00:00Z', endedAt: '2026-04-22T18:00:00Z', duration: 14400,
      queriesRun: 47, resultsFound: 12, truePositives: 5, falsePositives: 7, status: 'completed' },
    { id: 's-003', hypothesisId: 'h-004', startedAt: '2026-04-22T08:00:00Z', endedAt: '2026-04-22T11:30:00Z', duration: 12600,
      queriesRun: 31, resultsFound: 6, truePositives: 2, falsePositives: 4, status: 'completed' },
  ];
  @state() private _huntTimer: number = 0;
  @state() private _huntTimerRunning: boolean = false;
  @state() private _selectedHypothesis: string = 'h-001';

  private _renderHuntingWorkspace(): unknown {
    const statusColors: Record<string, string> = { active: '#3b82f6', validated: '#22c55e', refuted: '#ef4444', pending: '#f59e0b', running: '#3b82f6', completed: '#22c55e', paused: '#f59e0b' };
    const formatDuration = (s: number) => { const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); return h > 0 ? h + 'h ' + m + 'm' : m + 'm'; };
    return html`
      <div style="padding:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:11px;font-weight:700;color:#e2e8f0">Threat Hunting Workspace</div>
          <div style="display:flex;gap:6px;align-items:center">
            <span style="font-size:9px;color:#9ca3af">Session Timer:</span>
            <span style="font-size:10px;font-weight:600;color:#60a5fa;font-family:monospace">${formatDuration(this._huntTimer)}</span>
            <button @click=${() => { this._huntTimerRunning = !this._huntTimerRunning; }}
              style="padding:2px 8px;font-size:8px;border-radius:3px;border:1px solid #374151;background:${this._huntTimerRunning ? '#dc2626' : '#1f2937'};color:#e2e8f0;cursor:pointer">${this._huntTimerRunning ? 'Stop' : 'Start'}</button>
          </div>
        </div>
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Active Hypotheses</div>
        ${this._huntHypotheses.filter(h => h.status !== 'refuted').map(h => html`
          <div style="padding:5px 8px;background:${h.id === this._selectedHypothesis ? '#1e3a5f' : '#111827'};border:1px solid ${h.id === this._selectedHypothesis ? '#2563eb' : '#1f2937'};border-radius:4px;margin-bottom:3px;cursor:pointer"
            @click=${() => { this._selectedHypothesis = h.id; }}>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="width:6px;height:6px;border-radius:50%;background:${statusColors[h.status]}"></span>
                <span style="font-size:9px;font-weight:600;color:#e2e8f0">${h.title}</span>
                <span style="font-size:7px;color:#6b7280;background:#1f2937;padding:1px 4px;border-radius:2px">${h.killChainStage}</span>
              </div>
              <div style="display:flex;gap:8px;align-items:center">
                <span style="font-size:8px;color:#60a5fa">IOCs: ${h.iocPivots}</span>
                <span style="font-size:8px;color:#22c55e">Findings: ${h.findingsCount}</span>
                <span style="font-size:8px;color:${h.confidence > 70 ? '#22c55e' : h.confidence > 40 ? '#f59e0b' : '#ef4444'}">${h.confidence}%</span>
              </div>
            </div>
            <div style="font-size:7px;color:#6b7280;margin-top:2px;margin-left:12px">${h.description}</div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Hunt Sessions</div>
        ${this._huntSessions.map(s => html`
          <div style="padding:4px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="width:5px;height:5px;border-radius:50%;background:${statusColors[s.status]}"></span>
              <span style="color:#e2e8f0;font-weight:600">${s.id}</span>
              <span style="color:#6b7280">${formatDuration(s.duration)}</span>
            </div>
            <div style="display:flex;gap:6px">
              <span style="color:#9ca3af">Queries: ${s.queriesRun}</span>
              <span style="color:#22c55e">TP: ${s.truePositives}</span>
              <span style="color:#ef4444">FP: ${s.falsePositives}</span>
              <span style="color:#60a5fa">Precision: ${s.resultsFound > 0 ? Math.round(s.truePositives/s.resultsFound*100) : 0}%</span>
            </div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Hypothesis Evolution Timeline</div>
        ${[
          { date: 'Apr 17', event: 'H005 Living off the Land - Refuted after 47 queries, confirmed as admin activity', status: 'refuted' },
          { date: 'Apr 18', event: 'H004 Scheduled Tasks - 2 suspicious tasks found on DC-01 and FILE-03', status: 'active' },
          { date: 'Apr 19', event: 'H002 RDP Lateral Movement - Validated: 5 confirmed lateral hops from WKST-07', status: 'validated' },
          { date: 'Apr 20', event: 'H001 LSASS Credential Dumping - Elevated priority based on H002 findings', status: 'active' },
          { date: 'Apr 21', event: 'H003 DNS Tunneling - New hypothesis created from anomaly detection alerts', status: 'pending' },
        ].map(e => html`
          <div style="padding:3px 8px;border-left:2px solid ${statusColors[e.status]};margin-bottom:2px;margin-left:4px;font-size:7px">
            <span style="color:#60a5fa;font-weight:600">${e.date}</span>
            <span style="color:#9ca3af;margin-left:6px">${e.event}</span>
          </div>
        `)}
      </div>`;
  }

  // ===== DIGITAL FORENSICS LAB MODULE =====
  @state() private _forensicCases: Array<{
    id: string; caseName: string; status: 'open' | 'in-progress' | 'closed' | 'archived';
    priority: 'critical' | 'high' | 'medium' | 'low'; assignedTo: string; created: string;
    evidenceItems: number; artifacts: number; timelineEvents: number; findings: number;
  }> = [
    { id: 'fc-001', caseName: 'Ransomware Incident - FIN-DEPT', status: 'in-progress', priority: 'critical',
      assignedTo: 'Forensics-A', created: '2026-04-15T08:00:00Z', evidenceItems: 23, artifacts: 156, timelineEvents: 89, findings: 34 },
    { id: 'fc-002', caseName: 'Insider Threat - Engineering', status: 'open', priority: 'high',
      assignedTo: 'Forensics-B', created: '2026-04-20T14:00:00Z', evidenceItems: 8, artifacts: 45, timelineEvents: 23, findings: 12 },
    { id: 'fc-003', caseName: 'Data Exfiltration Attempt', status: 'in-progress', priority: 'high',
      assignedTo: 'Forensics-A', created: '2026-04-18T10:00:00Z', evidenceItems: 15, artifacts: 78, timelineEvents: 56, findings: 18 },
    { id: 'fc-004', caseName: 'Phishing Campaign Analysis', status: 'closed', priority: 'medium',
      assignedTo: 'Forensics-C', created: '2026-04-10T09:00:00Z', evidenceItems: 31, artifacts: 203, timelineEvents: 120, findings: 45 },
  ];
  @state() private _chainOfCustody: Array<{
    id: string; caseId: string; item: string; collectedBy: string; collectedAt: string;
    hashMd5: string; hashSha1: string; hashSha256: string; storage: string;
    transferLog: string;
  }> = [
    { id: 'coc-001', caseId: 'fc-001', item: 'WKST-FIN01 Memory Dump', collectedBy: 'Forensics-A', collectedAt: '2026-04-15T09:30:00Z',
      hashMd5: 'a3f2b8c1d4e5f6a7b8c9d0e1f2a3b4c5', hashSha1: 'b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2', hashSha256: 'c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7',
      storage: 'Evidence Locker A-3', transferLog: 'Scene -> Lab (Apr 15) -> Reviewer (Apr 16)' },
    { id: 'coc-002', caseId: 'fc-001', item: 'Server-FIN01 Disk Image', collectedBy: 'Forensics-A', collectedAt: '2026-04-15T11:00:00Z',
      hashMd5: 'd4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9', hashSha1: 'e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3', hashSha256: 'f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7',
      storage: 'Evidence Locker A-3', transferLog: 'Scene -> Lab (Apr 15)' },
  ];
  @state() private _artifactChecklist: Array<{
    category: string; items: Array<{ name: string; status: 'pending' | 'collected' | 'analyzed' | 'skipped'; notes: string }>;
  }> = [
    { category: 'Registry', items: [
      { name: 'SAM/SYSTEM Hives', status: 'collected', notes: 'Extracted from WKST-FIN01' },
      { name: 'NTUSER.DAT', status: 'analyzed', notes: 'Suspicious run keys found' },
      { name: 'Software Hive', status: 'analyzed', notes: 'Unusual installed software detected' },
      { name: 'Amcache', status: 'collected', notes: 'Pending analysis' },
      { name: 'UserAssist', status: 'pending', notes: '' },
    ]},
    { category: 'Memory', items: [
      { name: 'Process List', status: 'analyzed', notes: '3 suspicious processes identified' },
      { name: 'Network Connections', status: 'analyzed', notes: 'C2 callback to 192.168.45.102' },
      { name: 'DLL List', status: 'collected', notes: '2 injected DLLs detected' },
      { name: 'Handle Table', status: 'pending', notes: '' },
    ]},
    { category: 'Network', items: [
      { name: 'PCAP Files', status: 'collected', notes: 'Firewall logs exported' },
      { name: 'DNS Cache', status: 'analyzed', notes: 'Tunneling patterns found' },
      { name: 'Proxy Logs', status: 'pending', notes: '' },
    ]},
    { category: 'Disk', items: [
      { name: 'MFT Analysis', status: 'analyzed', notes: 'Deleted ransomware binary recovered' },
      { name: 'USN Journal', status: 'analyzed', notes: 'File encryption timeline reconstructed' },
      { name: 'Prefetch', status: 'collected', notes: '' },
      { name: 'Event Logs', status: 'analyzed', notes: '4624/4625 anomalies detected' },
    ]},
  ];
  @state() private _forensicTimeline: Array<{
    time: string; event: string; source: string; severity: 'critical' | 'high' | 'medium' | 'low'; confidence: number;
  }> = [
    { time: '2026-04-15 02:14:33', event: 'Initial access via phishing email attachment', source: 'Email Gateway', severity: 'critical', confidence: 95 },
    { time: '2026-04-15 02:15:01', event: 'Malicious macro execution in Word document', source: 'AMSI Logs', severity: 'critical', confidence: 92 },
    { time: '2026-04-15 02:15:45', event: 'PowerShell download cradle executed', source: 'PowerShell Logging', severity: 'critical', confidence: 98 },
    { time: '2026-04-15 02:16:12', event: 'Second stage payload dropped to AppData', source: 'File System Timeline', severity: 'high', confidence: 88 },
    { time: '2026-04-15 02:17:30', event: 'LSASS memory access from non-system process', source: 'EDR Alerts', severity: 'critical', confidence: 97 },
    { time: '2026-04-15 02:18:00', event: 'Lateral movement to SRV-FIN01 via WMI', source: 'WMI Event Logs', severity: 'high', confidence: 90 },
    { time: '2026-04-15 02:20:00', event: 'File encryption started on network shares', source: 'File Server Logs', severity: 'critical', confidence: 99 },
    { time: '2026-04-15 02:25:00', event: 'Ransom note deployed to all accessible shares', source: 'File System', severity: 'critical', confidence: 100 },
  ];

  private _renderForensicsLab(): unknown {
    const statusColors: Record<string, string> = { open: '#f59e0b', 'in-progress': '#3b82f6', closed: '#22c55e', archived: '#6b7280', pending: '#6b7280', collected: '#60a5fa', analyzed: '#22c55e', skipped: '#ef4444' };
    const severityColors: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#22c55e' };
    return html`
      <div style="padding:8px">
        <div style="font-size:11px;font-weight:700;color:#e2e8f0;margin-bottom:8px">Digital Forensics Lab</div>
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Case Management</div>
        ${this._forensicCases.map(c => html`
          <div style="padding:4px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div style="display:flex;align-items:center;gap:6px">
              <span style="width:6px;height:6px;border-radius:50%;background:${statusColors[c.status]}"></span>
              <span style="color:#e2e8f0;font-weight:600">${c.caseName}</span>
              <span style="color:${severityColors[c.priority]};font-weight:600">${c.priority.toUpperCase()}</span>
            </div>
            <div style="display:flex;gap:6px;color:#9ca3af">
              <span>Evidence: ${c.evidenceItems}</span>
              <span>Artifacts: ${c.artifacts}</span>
              <span>Timeline: ${c.timelineEvents}</span>
              <span style="color:#60a5fa">Findings: ${c.findings}</span>
            </div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Chain of Custody</div>
        ${this._chainOfCustody.map(c => html`
          <div style="padding:4px 8px;background:#111827;border-radius:3px;margin-bottom:2px;font-size:7px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="color:#e2e8f0;font-weight:600">${c.item}</span>
              <span style="color:#6b7280">${c.storage}</span>
            </div>
            <div style="color:#4b5563;margin-top:1px;font-family:monospace;font-size:6px">MD5: ${c.hashMd5} | SHA1: ${c.hashSha1.substring(0, 16)}... | SHA256: ${c.hashSha256.substring(0, 24)}...</div>
            <div style="color:#9ca3af;margin-top:1px">Transfers: ${c.transferLog}</div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Artifact Analysis Checklist</div>
        ${this._artifactChecklist.map(cat => html`
          <div style="margin-bottom:4px">
            <div style="font-size:8px;font-weight:600;color:#60a5fa;margin-bottom:2px">${cat.category}</div>
            ${cat.items.map(item => html`
              <div style="padding:2px 8px;background:#0d1117;border-radius:2px;margin-bottom:1px;display:flex;justify-content:space-between;align-items:center;font-size:7px">
                <div style="display:flex;align-items:center;gap:4px">
                  <span style="color:${statusColors[item.status]}">${item.status === 'analyzed' ? '[OK]' : item.status === 'collected' ? '[..]' : '[  ]'}</span>
                  <span style="color:#d1d5db">${item.name}</span>
                </div>
                <span style="color:#6b7280">${item.notes || '-'}</span>
              </div>
            `)}
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Incident Timeline Reconstruction</div>
        ${this._forensicTimeline.map(e => html`
          <div style="padding:3px 8px;border-left:2px solid ${severityColors[e.severity]};margin-bottom:1px;margin-left:4px;font-size:7px;display:flex;justify-content:space-between">
            <div>
              <span style="color:#60a5fa;font-family:monospace">${e.time}</span>
              <span style="color:#d1d5db;margin-left:6px">${e.event}</span>
            </div>
            <div style="display:flex;gap:6px">
              <span style="color:#6b7280">${e.source}</span>
              <span style="color:${e.confidence > 90 ? '#22c55e' : '#f59e0b'}">${e.confidence}%</span>
            </div>
          </div>
        `)}
      </div>`;
  }

  // ===== PENETRATION TESTING DASHBOARD MODULE =====
  @state() private _pentestEngagements: Array<{
    id: string; name: string; client: string; phase: 'scoping' | 'recon' | 'exploit' | 'post-exploit' | 'reporting' | 'delivered';
    startDate: string; endDate: string; scope: string; vulnsFound: number; critVulns: number;
    exploited: number; credentials: number; progress: number;
  }> = [
    { id: 'pe-001', name: 'External Network Assessment', client: 'Acme Corp', phase: 'exploit',
      startDate: '2026-04-10', endDate: '2026-04-24', scope: '241 hosts / 18 web apps', vulnsFound: 47, critVulns: 6, exploited: 8, credentials: 12, progress: 72 },
    { id: 'pe-002', name: 'Internal Network Pentest', client: 'Globex Inc', phase: 'recon',
      startDate: '2026-04-18', endDate: '2026-05-02', scope: '1847 hosts / AD environment', vulnsFound: 12, critVulns: 1, exploited: 2, credentials: 5, progress: 25 },
    { id: 'pe-003', name: 'Web Application Assessment', client: 'Initech LLC', phase: 'reporting',
      startDate: '2026-04-01', endDate: '2026-04-15', scope: '6 web applications', vulnsFound: 89, critVulns: 11, exploited: 15, credentials: 3, progress: 92 },
  ];
  @state() private _exploitCatalog: Array<{
    id: string; name: string; type: string; platform: string;
    cve: string; risk: 'critical' | 'high' | 'medium' | 'low'; verified: boolean; pocAvailable: boolean;
  }> = [
    { id: 'ex-001', name: 'EternalBlue SMB RCE', type: 'remote', platform: 'Windows', cve: 'CVE-2017-0144', risk: 'critical', verified: true, pocAvailable: true },
    { id: 'ex-002', name: 'Log4Shell JNDI Injection', type: 'remote', platform: 'Java', cve: 'CVE-2021-44228', risk: 'critical', verified: true, pocAvailable: true },
    { id: 'ex-003', name: 'SQL Injection Auth Bypass', type: 'web', platform: 'PHP', cve: 'N/A', risk: 'high', verified: true, pocAvailable: true },
    { id: 'ex-004', name: 'Privilege Escalation via Kernel', type: 'local', platform: 'Linux', cve: 'CVE-2023-32233', risk: 'high', verified: false, pocAvailable: true },
    { id: 'ex-005', name: 'XSS Stored in Dashboard', type: 'web', platform: 'React', cve: 'N/A', risk: 'medium', verified: true, pocAvailable: true },
    { id: 'ex-006', name: 'SSRF Internal Port Scan', type: 'web', platform: 'Node.js', cve: 'N/A', risk: 'high', verified: true, pocAvailable: true },
  ];
  @state() private _deliverableChecklist: Array<{
    engagementId: string; item: string; status: 'pending' | 'in-progress' | 'completed';
  }> = [
    { engagementId: 'pe-003', item: 'Executive Summary', status: 'completed' },
    { engagementId: 'pe-003', item: 'Technical Findings Report', status: 'completed' },
    { engagementId: 'pe-003', item: 'Vulnerability Remediation Guide', status: 'in-progress' },
    { engagementId: 'pe-003', item: 'Evidence Screenshots and Videos', status: 'completed' },
    { engagementId: 'pe-003', item: 'Re-test Verification Results', status: 'pending' },
    { engagementId: 'pe-003', item: 'Risk Rating Matrix', status: 'completed' },
  ];

  private _renderPentestDashboard(): unknown {
    const phaseColors: Record<string, string> = { scoping: '#9ca3af', recon: '#60a5fa', exploit: '#ef4444', 'post-exploit': '#f59e0b', reporting: '#22c55e', delivered: '#6b7280' };
    const riskColors: Record<string, string> = { critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#22c55e' };
    return html`
      <div style="padding:8px">
        <div style="font-size:11px;font-weight:700;color:#e2e8f0;margin-bottom:8px">Penetration Testing Dashboard</div>
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Active Engagements</div>
        ${this._pentestEngagements.map(e => html`
          <div style="padding:5px 8px;background:#111827;border-radius:4px;margin-bottom:3px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:9px;font-weight:600;color:#e2e8f0">${e.name}</span>
                <span style="font-size:7px;color:${phaseColors[e.phase]};background:#1f2937;padding:1px 4px;border-radius:2px">${e.phase.toUpperCase()}</span>
              </div>
              <span style="font-size:8px;color:#6b7280">${e.startDate} - ${e.endDate}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:8px">
              <span style="color:#9ca3af">${e.scope}</span>
              <div style="display:flex;gap:6px">
                <span style="color:#ef4444">Critical: ${e.critVulns}</span>
                <span style="color:#f59e0b">Total: ${e.vulnsFound}</span>
                <span style="color:#22c55e">Exploited: ${e.exploited}</span>
                <span style="color:#60a5fa">Creds: ${e.credentials}</span>
              </div>
            </div>
            <div style="margin-top:3px;height:3px;background:#1f2937;border-radius:2px;overflow:hidden">
              <div style="height:100%;width:${e.progress}%;background:${phaseColors[e.phase]};border-radius:2px;transition:width 0.3s"></div>
            </div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Exploit Catalog</div>
        ${this._exploitCatalog.map(ex => html`
          <div style="padding:3px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="color:${ex.verified ? '#22c55e' : '#f59e0b'}">${ex.verified ? '[V]' : '[U]'}</span>
              <span style="color:#e2e8f0;font-weight:600">${ex.name}</span>
              <span style="color:#6b7280;font-size:7px">${ex.cve}</span>
            </div>
            <div style="display:flex;gap:4px">
              <span style="color:#9ca3af">${ex.type}</span>
              <span style="color:#6b7280">${ex.platform}</span>
              <span style="color:${riskColors[ex.risk]}">${ex.risk}</span>
            </div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Client Deliverables</div>
        ${this._deliverableChecklist.map(d => html`
          <div style="padding:2px 8px;font-size:7px;display:flex;justify-content:space-between;color:#9ca3af">
            <span>${d.item}</span>
            <span style="color:${d.status === 'completed' ? '#22c55e' : d.status === 'in-progress' ? '#3b82f6' : '#6b7280'}">${d.status}</span>
          </div>
        `)}
      </div>`;
  }

  // ===== RED TEAM OPERATIONS MODULE =====
  @state() private _redteamObjectives: Array<{
    id: string; title: string; status: 'planned' | 'active' | 'achieved' | 'failed';
    mitreTactic: string; mitreTechnique: string; difficulty: 'easy' | 'medium' | 'hard';
    started: string; completed: string | null; assignedTo: string; notes: string;
  }> = [
    { id: 'rt-001', title: 'Gain initial access via phishing', status: 'achieved', mitreTactic: 'Initial Access', mitreTechnique: 'T1566.001', difficulty: 'easy', started: '2026-04-15', completed: '2026-04-15', assignedTo: 'RT-Lead', notes: 'Spear-phishing email with macro-enabled doc' },
    { id: 'rt-002', title: 'Establish C2 channel', status: 'achieved', mitreTactic: 'Command & Control', mitreTechnique: 'T1071.001', difficulty: 'medium', started: '2026-04-15', completed: '2026-04-16', assignedTo: 'RT-Oper', notes: 'HTTPS beaconing via CDN-fronted domain' },
    { id: 'rt-003', title: 'Dump AD credentials', status: 'active', mitreTactic: 'Credential Access', mitreTechnique: 'T1003.006', difficulty: 'medium', started: '2026-04-18', completed: null, assignedTo: 'RT-Oper', notes: 'DCSync attack in progress' },
    { id: 'rt-004', title: 'Pivot to segmented network', status: 'planned', mitreTactic: 'Lateral Movement', mitreTechnique: 'T1021.002', difficulty: 'hard', started: '', completed: null, assignedTo: 'RT-Lead', notes: 'Target: PCI segment via compromised jump host' },
    { id: 'rt-005', title: 'Exfiltrate customer PII', status: 'planned', mitreTactic: 'Exfiltration', mitreTechnique: 'T1048.003', difficulty: 'hard', started: '', completed: null, assignedTo: 'RT-Lead', notes: 'Test DLP controls effectiveness' },
    { id: 'rt-006', title: 'Domain admin escalation', status: 'active', mitreTactic: 'Privilege Escalation', mitreTechnique: 'T1068', difficulty: 'hard', started: '2026-04-19', completed: null, assignedTo: 'RT-Oper', notes: 'Kerberoasting attack vector' },
  ];
  @state() private _ttpLibrary: Array<{
    techniqueId: string; name: string; tactic: string; detectionRate: number;
    blueTeamDetection: 'detected' | 'missed' | 'partial'; timeToDetect: number;
  }> = [
    { techniqueId: 'T1566.001', name: 'Spearphishing Attachment', tactic: 'Initial Access', detectionRate: 65, blueTeamDetection: 'partial', timeToDetect: 2400 },
    { techniqueId: 'T1071.001', name: 'Web C2', tactic: 'Command & Control', detectionRate: 40, blueTeamDetection: 'missed', timeToDetect: 0 },
    { techniqueId: 'T1003.006', name: 'DCSync', tactic: 'Credential Access', detectionRate: 55, blueTeamDetection: 'missed', timeToDetect: 0 },
    { techniqueId: 'T1059.001', name: 'PowerShell', tactic: 'Execution', detectionRate: 80, blueTeamDetection: 'detected', timeToDetect: 300 },
    { techniqueId: 'T1087.002', name: 'Domain Account', tactic: 'Discovery', detectionRate: 70, blueTeamDetection: 'detected', timeToDetect: 1800 },
    { techniqueId: 'T1021.002', name: 'SMB Admin Shares', tactic: 'Lateral Movement', detectionRate: 60, blueTeamDetection: 'partial', timeToDetect: 3600 },
  ];
  @state() private _c2Infrastructure: Array<{
    id: string; domain: string; ip: string; port: number; protocol: string;
    status: 'active' | 'burned' | 'standby'; lastCheckin: string; beacons: number;
  }> = [
    { id: 'c2-001', domain: 'cdn-static-assets.net', ip: '10.0.0.50', port: 443, protocol: 'HTTPS', status: 'active', lastCheckin: '2026-04-23T10:00:00Z', beacons: 156 },
    { id: 'c2-002', domain: 'api-update-service.io', ip: '10.0.0.51', port: 8443, protocol: 'HTTPS', status: 'active', lastCheckin: '2026-04-23T09:55:00Z', beacons: 89 },
    { id: 'c2-003', domain: 'relay-analytics.cloud', ip: '10.0.0.52', port: 53, protocol: 'DNS', status: 'burned', lastCheckin: '2026-04-20T14:00:00Z', beacons: 234 },
  ];

  private _renderRedteamOps(): unknown {
    const statusColors: Record<string, string> = { planned: '#6b7280', active: '#3b82f6', achieved: '#22c55e', failed: '#ef4444', burned: '#ef4444', standby: '#f59e0b' };
    const detColors: Record<string, string> = { detected: '#22c55e', missed: '#ef4444', partial: '#f59e0b' };
    return html`
      <div style="padding:8px">
        <div style="font-size:11px;font-weight:700;color:#e2e8f0;margin-bottom:8px">Red Team Operations</div>
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Operation Objectives</div>
        ${this._redteamObjectives.map(o => html`
          <div style="padding:4px 8px;background:#111827;border-radius:3px;margin-bottom:2px;font-size:8px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="display:flex;align-items:center;gap:4px">
                <span style="width:6px;height:6px;border-radius:50%;background:${statusColors[o.status]}"></span>
                <span style="color:#e2e8f0;font-weight:600">${o.title}</span>
                <span style="font-size:7px;color:#6b7280">${o.mitreTechnique}</span>
              </div>
              <span style="color:${o.difficulty === 'hard' ? '#ef4444' : o.difficulty === 'medium' ? '#f59e0b' : '#22c55e'};font-size:7px">${o.difficulty}</span>
            </div>
            <div style="color:#6b7280;font-size:7px;margin-top:1px;margin-left:10px">${o.notes}</div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">TTP Detection Analysis</div>
        ${this._ttpLibrary.map(t => html`
          <div style="padding:3px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="color:#60a5fa;font-weight:600">${t.techniqueId}</span>
              <span style="color:#e2e8f0">${t.name}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <span style="color:${detColors[t.blueTeamDetection]}">${t.blueTeamDetection.toUpperCase()}</span>
              <span style="color:#9ca3af">Detect: ${t.detectionRate}%</span>
              <span style="color:#6b7280">MTTD: ${t.timeToDetect > 0 ? Math.floor(t.timeToDetect/60) + 'm' : 'N/A'}</span>
            </div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">C2 Infrastructure</div>
        ${this._c2Infrastructure.map(c => html`
          <div style="padding:3px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="width:5px;height:5px;border-radius:50%;background:${statusColors[c.status]}"></span>
              <span style="color:#e2e8f0">${c.domain}</span>
              <span style="color:#6b7280;font-size:7px">${c.ip}:${c.port}</span>
            </div>
            <div style="display:flex;gap:6px">
              <span style="color:#9ca3af">${c.protocol}</span>
              <span style="color:#60a5fa">Beacons: ${c.beacons}</span>
            </div>
          </div>
        `)}
      </div>`;
  }

  // ===== BLUE TEAM DEFENSE METRICS MODULE =====
  @state() private _defenseMetrics: {
    mttD: number; mttC: number; mttR: number;
    alertVolume: number; truePositiveRate: number; falsePositiveRate: number;
    triageEfficiency: number; detectionCoverage: number; controlEffectiveness: number;
  } = { mttD: 847, mttC: 2340, mttR: 7200, alertVolume: 1247, truePositiveRate: 23.4, falsePositiveRate: 76.6, triageEfficiency: 67.2, detectionCoverage: 71.8, controlEffectiveness: 78.3 };
  @state() private _defenseTrend: Array<{
    period: string; mttD: number; mttC: number; mttR: number; fpr: number; coverage: number;
  }> = [
    { period: 'Week 1', mttD: 1200, mttC: 3600, mttR: 14400, fpr: 82.1, coverage: 65.2 },
    { period: 'Week 2', mttD: 1050, mttC: 3200, mttR: 10800, fpr: 79.5, coverage: 67.8 },
    { period: 'Week 3', mttD: 920, mttC: 2800, mttR: 9000, fpr: 77.3, coverage: 69.4 },
    { period: 'Week 4', mttD: 847, mttC: 2340, mttR: 7200, fpr: 76.6, coverage: 71.8 },
  ];
  @state() private _defenseLayers: Array<{
    layer: string; status: 'active' | 'degraded' | 'offline'; effectiveness: number;
    controls: number; gaps: number; lastTested: string;
  }> = [
    { layer: 'Perimeter Firewall', status: 'active', effectiveness: 92, controls: 18, gaps: 2, lastTested: '2026-04-20' },
    { layer: 'Endpoint Detection', status: 'active', effectiveness: 78, controls: 24, gaps: 5, lastTested: '2026-04-22' },
    { layer: 'Network IDS/IPS', status: 'degraded', effectiveness: 65, controls: 12, gaps: 4, lastTested: '2026-04-18' },
    { layer: 'Email Security', status: 'active', effectiveness: 88, controls: 15, gaps: 2, lastTested: '2026-04-21' },
    { layer: 'Identity and Access', status: 'active', effectiveness: 82, controls: 20, gaps: 3, lastTested: '2026-04-19' },
    { layer: 'Data Loss Prevention', status: 'degraded', effectiveness: 58, controls: 10, gaps: 6, lastTested: '2026-04-15' },
    { layer: 'SIEM / Log Analysis', status: 'active', effectiveness: 75, controls: 16, gaps: 4, lastTested: '2026-04-22' },
    { layer: 'Vulnerability Management', status: 'active', effectiveness: 71, controls: 14, gaps: 5, lastTested: '2026-04-17' },
  ];
  @state() private _alertTriage: Array<{
    category: string; volume: number; autoResolved: number; manualTriage: number; avgTriageTime: number; backlog: number;
  }> = [
    { category: 'Malware Detection', volume: 342, autoResolved: 289, manualTriage: 53, avgTriageTime: 120, backlog: 8 },
    { category: 'Network Anomaly', volume: 278, autoResolved: 198, manualTriage: 80, avgTriageTime: 300, backlog: 15 },
    { category: 'Phishing Report', volume: 224, autoResolved: 180, manualTriage: 44, avgTriageTime: 90, backlog: 3 },
    { category: 'Privilege Escalation', volume: 156, autoResolved: 45, manualTriage: 111, avgTriageTime: 600, backlog: 22 },
    { category: 'Data Exfiltration', volume: 89, autoResolved: 34, manualTriage: 55, avgTriageTime: 480, backlog: 12 },
    { category: 'Brute Force', volume: 158, autoResolved: 142, manualTriage: 16, avgTriageTime: 60, backlog: 2 },
  ];

  private _renderBlueTeamMetrics(): unknown {
    const fmtMins = (s: number) => { const h = Math.floor(s/3600); const m = Math.floor((s%3600)/60); return h > 0 ? h + 'h ' + m + 'm' : m + 'min'; };
    const layerColors: Record<string, string> = { active: '#22c55e', degraded: '#f59e0b', offline: '#ef4444' };
    return html`
      <div style="padding:8px">
        <div style="font-size:11px;font-weight:700;color:#e2e8f0;margin-bottom:8px">Blue Team Defense Metrics</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;margin-bottom:8px">
          ${[
            { label: 'MTTD', value: fmtMins(this._defenseMetrics.mttD), color: '#3b82f6' },
            { label: 'MTTC', value: fmtMins(this._defenseMetrics.mttC), color: '#f59e0b' },
            { label: 'MTTR', value: fmtMins(this._defenseMetrics.mttR), color: '#22c55e' },
            { label: 'Alert Volume', value: String(this._defenseMetrics.alertVolume), color: '#60a5fa' },
            { label: 'TP Rate', value: this._defenseMetrics.truePositiveRate + '%', color: '#22c55e' },
            { label: 'FP Rate', value: this._defenseMetrics.falsePositiveRate + '%', color: '#ef4444' },
          ].map(m => html`
            <div style="padding:4px 6px;background:#111827;border-radius:3px;text-align:center">
              <div style="font-size:7px;color:#6b7280;text-transform:uppercase">${m.label}</div>
              <div style="font-size:12px;font-weight:700;color:${m.color}">${m.value}</div>
            </div>
          `)}
        </div>
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Defense-in-Depth Layers</div>
        ${this._defenseLayers.map(l => html`
          <div style="padding:3px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="width:5px;height:5px;border-radius:50%;background:${layerColors[l.status]}"></span>
              <span style="color:#e2e8f0;font-weight:500">${l.layer}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <div style="width:50px;height:3px;background:#1f2937;border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${l.effectiveness}%;background:${l.effectiveness > 80 ? '#22c55e' : l.effectiveness > 60 ? '#f59e0b' : '#ef4444'};border-radius:2px"></div>
              </div>
              <span style="color:${l.effectiveness > 80 ? '#22c55e' : l.effectiveness > 60 ? '#f59e0b' : '#ef4444'};font-weight:600;min-width:28px">${l.effectiveness}%</span>
              <span style="color:#9ca3af">Controls: ${l.controls}</span>
              <span style="color:#ef4444">Gaps: ${l.gaps}</span>
            </div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Alert Triage Efficiency</div>
        ${this._alertTriage.map(a => html`
          <div style="padding:3px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <span style="color:#e2e8f0;min-width:120px">${a.category}</span>
            <div style="display:flex;gap:8px">
              <span style="color:#9ca3af">Vol: ${a.volume}</span>
              <span style="color:#22c55e">Auto: ${a.autoResolved}</span>
              <span style="color:#f59e0b">Manual: ${a.manualTriage}</span>
              <span style="color:#60a5fa">Avg: ${a.avgTriageTime}s</span>
              <span style="color:${a.backlog > 10 ? '#ef4444' : '#22c55e'}">Backlog: ${a.backlog}</span>
            </div>
          </div>
        `)}
        <div style="font-size:9px;font-weight:600;color:#9ca3af;margin-top:8px;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.5px">Weekly Trend (FPR Reduction)</div>
        ${this._defenseTrend.map(t => html`
          <div style="padding:2px 8px;background:#111827;border-radius:2px;margin-bottom:1px;display:flex;justify-content:space-between;font-size:7px;color:#9ca3af">
            <span style="min-width:60px">${t.period}</span>
            <span>MTTD: ${fmtMins(t.mttD)}</span>
            <span>MTTC: ${fmtMins(t.mttC)}</span>
            <span>MTTR: ${fmtMins(t.mttR)}</span>
            <span style="color:${t.fpr < 78 ? '#22c55e' : '#f59e0b'}">FPR: ${t.fpr}%</span>
            <span style="color:#60a5fa">Coverage: ${t.coverage}%</span>
          </div>
        `)}
      </div>`;
  }


  // ─── Incident Post-Mortem Engine ───
  @state() private _pmActiveTab: string = 'timeline';
  @state() private _pmIncidents: Array<{ id: string; title: string; severity: string; date: string; status: string; rootCause: string; rcaMethod: string; timeline: Array<{ time: string; event: string; actor: string }>; impactMatrix: Array<{ dimension: string; score: number; description: string }>; actionItems: Array<{ id: string; title: string; owner: string; priority: string; status: string; dueDate: string }>; lessonsLearned: string[] }> = [];
  @state() private _pmSelectedIncident: string = '';
  @state() private _pmFishboneCategories: string[] = ['People', 'Process', 'Technology', 'Environment', 'Communication', 'External'];
  @state() private _pmFiveWhysResults: string[] = [];
  @state() private _pmReportFormat: string = 'detailed';

  private _initPostMortem(): void {
    if (this._pmIncidents.length > 0) return;
    this._pmIncidents = [
      {
        id: 'PM-2024-001', title: 'Ransomware Attack on File Servers', severity: 'critical',
        date: '2024-03-15', status: 'completed', rootCause: 'Unpatched VPN gateway + weak MFA',
        rcaMethod: '5-Whys',
        timeline: [
          { time: '03:12', event: 'Initial compromise via VPN vulnerability CVE-2024-1234', actor: 'APT-29' },
          { time: '03:45', event: 'Lateral movement to file server cluster', actor: 'APT-29' },
          { time: '04:02', event: 'Data exfiltration initiated (2.3 TB)', actor: 'APT-29' },
          { time: '04:30', event: 'Ransomware payload deployed across 14 servers', actor: 'APT-29' },
          { time: '05:15', event: 'SOC detected anomalous network traffic spike', actor: 'SOC Analyst' },
          { time: '05:30', event: 'Incident response team activated', actor: 'IR Lead' },
          { time: '06:00', event: 'Network segmentation completed', actor: 'Network Ops' },
          { time: '08:45', event: 'Containment achieved, forensic imaging started', actor: 'Forensic Team' },
        ],
        impactMatrix: [
          { dimension: 'Financial', score: 9, description: 'Estimated $4.2M in downtime, recovery, and regulatory fines' },
          { dimension: 'Operational', score: 8, description: '14 servers offline for 72 hours, 200+ users affected' },
          { dimension: 'Reputational', score: 7, description: 'Customer notification required, media coverage risk' },
          { dimension: 'Compliance', score: 6, description: 'GDPR breach notification, PCI-DSS audit triggered' },
          { dimension: 'Data Integrity', score: 9, description: '15% of encrypted files had no backup, permanent data loss' },
        ],
        actionItems: [
          { id: 'AI-001', title: 'Patch all VPN gateways to latest firmware', owner: 'Network Team', priority: 'critical', status: 'completed', dueDate: '2024-03-20' },
          { id: 'AI-002', title: 'Implement hardware MFA for all VPN users', owner: 'Identity Team', priority: 'critical', status: 'completed', dueDate: '2024-03-25' },
          { id: 'AI-003', title: 'Deploy network detection rules for lateral movement', owner: 'SOC', priority: 'high', status: 'in-progress', dueDate: '2024-04-01' },
          { id: 'AI-004', title: 'Review and update incident response playbook', owner: 'IR Lead', priority: 'high', status: 'pending', dueDate: '2024-04-15' },
          { id: 'AI-005', title: 'Implement immutable backups for critical file servers', owner: 'Backup Ops', priority: 'critical', status: 'completed', dueDate: '2024-03-22' },
        ],
        lessonsLearned: [
          'VPN gateway patching cycle was 90 days instead of the required 14 days',
          'MFA bypass was possible because SMS-based OTP was still allowed',
          'Network segmentation between DMZ and internal network was insufficient',
          'SOC lacked automated detection rules for lateral movement patterns',
          'Backup verification testing had not been performed in 6 months',
        ],
      },
      {
        id: 'PM-2024-002', title: 'Phishing Campaign Targeting Finance Team', severity: 'high',
        date: '2024-04-02', status: 'in-review', rootCause: 'Lack of URL sandboxing for email attachments',
        rcaMethod: 'Fishbone',
        timeline: [
          { time: '09:15', event: 'Spear-phishing email sent to 12 finance team members', actor: 'Threat Actor' },
          { time: '09:22', event: '3 users clicked malicious link in email', actor: 'Finance Staff' },
          { time: '09:25', event: 'Credential harvesting form submitted by 2 users', actor: 'Threat Actor' },
          { time: '09:45', event: 'Email gateway flagged campaign as spam (delayed)', actor: 'Email Gateway' },
          { time: '10:00', event: 'SOC received alert on suspicious login from new geolocation', actor: 'SOC Analyst' },
          { time: '10:15', event: 'Compromised accounts identified and locked', actor: 'Identity Team' },
        ],
        impactMatrix: [
          { dimension: 'Financial', score: 4, description: 'No direct financial loss, remediation cost estimated at $15K' },
          { dimension: 'Operational', score: 5, description: '2 accounts locked for 4 hours during investigation' },
          { dimension: 'Reputational', score: 2, description: 'Internal incident, no external disclosure needed' },
          { dimension: 'Compliance', score: 3, description: 'Minor policy violation, no regulatory impact' },
          { dimension: 'Data Integrity', score: 2, description: 'No data exfiltration detected' },
        ],
        actionItems: [
          { id: 'AI-010', title: 'Deploy URL sandboxing for all email attachments', owner: 'Email Admin', priority: 'high', status: 'in-progress', dueDate: '2024-04-20' },
          { id: 'AI-011', title: 'Mandatory anti-phishing training for finance team', owner: 'Security Awareness', priority: 'high', status: 'completed', dueDate: '2024-04-10' },
          { id: 'AI-012', title: 'Implement conditional access policies for finance apps', owner: 'Identity Team', priority: 'medium', status: 'pending', dueDate: '2024-05-01' },
        ],
        lessonsLearned: [
          'Email gateway sandboxing was disabled due to performance concerns',
          'Finance team had not received targeted phishing training in 12 months',
          'Geolocation-based anomaly detection had a 15-minute delay',
        ],
      },
      {
        id: 'PM-2024-003', title: 'Insider Data Exfiltration via Cloud Storage', severity: 'critical',
        date: '2024-04-10', status: 'completed', rootCause: 'Excessive cloud storage permissions + no DLP',
        rcaMethod: '5-Whys',
        timeline: [
          { time: '14:00', event: 'Employee uploaded 45GB of sensitive documents to personal cloud', actor: 'Insider' },
          { time: '14:30', event: 'DLP alert triggered on bulk upload (previously disabled)', actor: 'DLP System' },
          { time: '15:00', event: 'Security team initiated investigation', actor: 'Investigator' },
          { time: '16:00', event: 'Employee account suspended pending HR review', actor: 'Security Lead' },
          { time: '17:00', event: 'Legal team engaged for data breach assessment', actor: 'Legal Counsel' },
        ],
        impactMatrix: [
          { dimension: 'Financial', score: 7, description: 'Potential IP theft valued at $8M, legal costs TBD' },
          { dimension: 'Operational', score: 3, description: 'One account suspended, minimal operational disruption' },
          { dimension: 'Reputational', score: 6, description: 'Client trust impact if data reaches competitors' },
          { dimension: 'Compliance', score: 8, description: 'Multiple regulatory violations, potential fines' },
          { dimension: 'Data Integrity', score: 8, description: 'Trade secrets and client PII were exfiltrated' },
        ],
        actionItems: [
          { id: 'AI-020', title: 'Re-enable and tune DLP policies for cloud storage uploads', owner: 'DLP Admin', priority: 'critical', status: 'completed', dueDate: '2024-04-12' },
          { id: 'AI-021', title: 'Implement just-in-time access for sensitive document repositories', owner: 'IAM Team', priority: 'critical', status: 'in-progress', dueDate: '2024-04-25' },
          { id: 'AI-022', title: 'Deploy user behavior analytics for anomaly detection', owner: 'SOC', priority: 'high', status: 'pending', dueDate: '2024-05-10' },
        ],
        lessonsLearned: [
          'DLP policies were disabled 3 months ago without proper change approval',
          'Cloud storage permissions followed allow-all default rather than least-privilege',
          'No automated alerting for bulk uploads to external cloud services',
        ],
      },
    ];
    this._pmSelectedIncident = this._pmIncidents[0]?.id || '';
    this._pmFiveWhysResults = [
      'Why did the breach occur? -> Unpatched VPN gateway vulnerability was exploited',
      'Why was the VPN unpatched? -> Patching cycle was set to 90 days, not 14-day critical path',
      'Why was the patching cycle 90 days? -> Change management process required extensive testing',
      'Why was extensive testing required? -> Previous patch caused service disruption',
      'Why did previous patch cause disruption? -> No staging environment for pre-deployment validation',
    ];
  }

  private _getPmSelectedIncident() {
    return this._pmIncidents.find(i => i.id === this._pmSelectedIncident) || this._pmIncidents[0];
  }

  private _getPmSeverityColor(severity: string): string {
    return severity === 'critical' ? '#ff4757' : severity === 'high' ? '#ff6b35' : severity === 'medium' ? '#ffa502' : '#2ed573';
  }

  private _getPmActionCompletionRate(incident: typeof this._pmIncidents[0]): number {
    if (!incident || incident.actionItems.length === 0) return 0;
    return Math.round((incident.actionItems.filter(a => a.status === 'completed').length / incident.actionItems.length) * 100);
  }

  private _getPmAvgImpactScore(incident: typeof this._pmIncidents[0]): number {
    if (!incident || incident.impactMatrix.length === 0) return 0;
    return Math.round(incident.impactMatrix.reduce((s, m) => s + m.score, 0) / incident.impactMatrix.length * 10) / 10;
  }

  private _getPmTotalActionItems(): { total: number; completed: number; inProgress: number; pending: number } {
    const all = this._pmIncidents.flatMap(i => i.actionItems);
    return {
      total: all.length,
      completed: all.filter(a => a.status === 'completed').length,
      inProgress: all.filter(a => a.status === 'in-progress').length,
      pending: all.filter(a => a.status === 'pending').length,
    };
  }

  // ─── Security Metrics Benchmarking ───
  @state() private _benchActiveTab: string = 'overview';
  @state() private _benchSelectedFramework: string = 'cis';
  @state() private _benchMaturityData: Array<{ domain: string; currentLevel: number; targetLevel: number; industryAvg: number; gaps: string[] }> = [];
  @state() private _benchPeerComparison: Array<{ metric: string; ourValue: number; peerAvg: number; peerBest: number; industryStd: number; unit: string }> = [];
  @state() private _benchTrendData: Array<{ month: string; score: number; benchmark: number }> = [];

  private _initBenchmarking(): void {
    if (this._benchMaturityData.length > 0) return;
    this._benchMaturityData = [
      { domain: 'Governance & Risk', currentLevel: 4, targetLevel: 5, industryAvg: 3.2, gaps: ['Formal risk quantification not fully adopted', 'Board reporting cadence needs improvement'] },
      { domain: 'Identity & Access', currentLevel: 3, targetLevel: 4, industryAvg: 2.8, gaps: ['MFA coverage at 78%, target 95%', 'Privileged access review cycle too long'] },
      { domain: 'Data Protection', currentLevel: 3, targetLevel: 5, industryAvg: 2.5, gaps: ['DLP policies need tuning', 'Data classification incomplete for cloud workloads'] },
      { domain: 'Threat Detection', currentLevel: 4, targetLevel: 5, industryAvg: 3.0, gaps: ['MITRE ATT&CK coverage at 65%', 'Automated response playbooks need expansion'] },
      { domain: 'Vulnerability Mgmt', currentLevel: 3, targetLevel: 4, industryAvg: 2.9, gaps: ['Mean time to patch critical: 18 days (target: 7)', 'Asset inventory incomplete'] },
      { domain: 'Incident Response', currentLevel: 4, targetLevel: 5, industryAvg: 3.1, gaps: ['Tabletop exercises quarterly instead of monthly', 'Forensic capability gaps for cloud environments'] },
    ];
    this._benchPeerComparison = [
      { metric: 'Mean Time to Detect (MTTD)', ourValue: 4.2, peerAvg: 12.5, peerBest: 1.8, industryStd: 8.0, unit: 'hours' },
      { metric: 'Mean Time to Respond (MTTR)', ourValue: 2.1, peerAvg: 8.3, peerBest: 0.5, industryStd: 4.0, unit: 'hours' },
      { metric: 'Patch Compliance (Critical)', ourValue: 78, peerAvg: 65, peerBest: 98, industryStd: 80, unit: '%' },
      { metric: 'Phishing Click Rate', ourValue: 3.2, peerAvg: 12.5, peerBest: 0.8, industryStd: 8.0, unit: '%' },
      { metric: 'Vulnerability Backlog (Critical)', ourValue: 12, peerAvg: 45, peerBest: 2, industryStd: 25, unit: 'count' },
      { metric: 'Security Awareness Score', ourValue: 82, peerAvg: 68, peerBest: 96, industryStd: 75, unit: '%' },
      { metric: 'MFA Adoption Rate', ourValue: 78, peerAvg: 62, peerBest: 100, industryStd: 85, unit: '%' },
      { metric: 'Endpoint Compliance', ourValue: 91, peerAvg: 78, peerBest: 99, industryStd: 85, unit: '%' },
    ];
    this._benchTrendData = [
      { month: '2024-01', score: 62, benchmark: 58 },
      { month: '2024-02', score: 65, benchmark: 59 },
      { month: '2024-03', score: 61, benchmark: 60 },
      { month: '2024-04', score: 68, benchmark: 61 },
      { month: '2024-05', score: 72, benchmark: 62 },
      { month: '2024-06', score: 74, benchmark: 63 },
      { month: '2024-07', score: 73, benchmark: 64 },
      { month: '2024-08', score: 76, benchmark: 65 },
      { month: '2024-09', score: 79, benchmark: 66 },
      { month: '2024-10', score: 81, benchmark: 67 },
      { month: '2024-11', score: 83, benchmark: 68 },
      { month: '2024-12', score: 85, benchmark: 69 },
    ];
  }

  private _getBenchOverallMaturity(): number {
    if (this._benchMaturityData.length === 0) return 0;
    return Math.round(this._benchMaturityData.reduce((s, d) => s + d.currentLevel, 0) / this._benchMaturityData.length * 10) / 10;
  }

  private _getBenchTargetMaturity(): number {
    if (this._benchMaturityData.length === 0) return 0;
    return Math.round(this._benchMaturityData.reduce((s, d) => s + d.targetLevel, 0) / this._benchMaturityData.length * 10) / 10;
  }

  private _getBenchTotalGaps(): number {
    return this._benchMaturityData.reduce((s, d) => s + d.gaps.length, 0);
  }

  private _getBenchOutperformingMetrics(): number {
    return this._benchPeerComparison.filter(m => m.ourValue > m.peerAvg).length;
  }

  private _getBenchMaturityLevelLabel(level: number): string {
    const labels = ['', 'Initial', 'Developing', 'Defined', 'Managed', 'Optimizing'];
    return labels[level] || 'Unknown';
  }

  private _getBenchMaturityColor(level: number): string {
    if (level >= 4) return '#2ed573';
    if (level >= 3) return '#ffa502';
    if (level >= 2) return '#ff6b35';
    return '#ff4757';
  }

  private _getBenchScoreTrend(): string {
    if (this._benchTrendData.length < 2) return 'neutral';
    const recent = this._benchTrendData.slice(-3);
    const first = recent[0].score;
    const last = recent[recent.length - 1].score;
    if (last > first + 3) return 'improving';
    if (last < first - 3) return 'declining';
    return 'stable';
  }

  // ─── Alert Triage & Enrichment ───
  @state() private _triageActiveView: string = 'queue';
  @state() private _triageAlerts: Array<{ id: string; title: string; severity: string; source: string; status: string; score: number; confidence: number; enrichment: { iocCount: number; relatedAlerts: number; assetCriticality: string; threatIntelHits: number; mitreTactics: string[] }; assignedTo: string; created: string; enrichedAt: string }> = [];
  @state() private _triageRoutingRules: Array<{ id: string; name: string; condition: string; action: string; enabled: boolean }> = [];
  @state() private _triageEscalationPolicy: Array<{ level: number; threshold: string; notify: string; autoAction: string }> = [];

  private _initTriage(): void {
    if (this._triageAlerts.length > 0) return;
    this._triageAlerts = [
      { id: 'ALT-001', title: 'Brute force login attempt detected', severity: 'high', source: 'SIEM', status: 'new', score: 85, confidence: 92,
        enrichment: { iocCount: 3, relatedAlerts: 2, assetCriticality: 'high', threatIntelHits: 5, mitreTactics: ['TA0006', 'TA0001'] }, assignedTo: '', created: '2024-04-15T09:12:00Z', enrichedAt: '2024-04-15T09:12:05Z' },
      { id: 'ALT-002', title: 'Suspicious PowerShell execution on workstation', severity: 'critical', source: 'EDR', status: 'investigating', score: 95, confidence: 88,
        enrichment: { iocCount: 7, relatedAlerts: 5, assetCriticality: 'critical', threatIntelHits: 12, mitreTactics: ['TA0002', 'TA0005', 'TA0003'] }, assignedTo: 'SOC-L1-John', created: '2024-04-15T08:45:00Z', enrichedAt: '2024-04-15T08:45:03Z' },
      { id: 'ALT-003', title: 'Anomalous data transfer to external IP', severity: 'high', source: 'NDR', status: 'escalated', score: 88, confidence: 76,
        enrichment: { iocCount: 4, relatedAlerts: 3, assetCriticality: 'high', threatIntelHits: 8, mitreTactics: ['TA0010', 'TA0009'] }, assignedTo: 'SOC-L2-Sarah', created: '2024-04-15T07:30:00Z', enrichedAt: '2024-04-15T07:30:08Z' },
      { id: 'ALT-004', title: 'Failed SSL certificate validation', severity: 'low', source: 'Proxy', status: 'resolved', score: 25, confidence: 95,
        enrichment: { iocCount: 0, relatedAlerts: 0, assetCriticality: 'low', threatIntelHits: 0, mitreTactics: [] }, assignedTo: 'SOC-L1-Mike', created: '2024-04-15T06:15:00Z', enrichedAt: '2024-04-15T06:15:02Z' },
      { id: 'ALT-005', title: 'Privileged account used from new location', severity: 'critical', source: 'IAM', status: 'new', score: 92, confidence: 84,
        enrichment: { iocCount: 5, relatedAlerts: 4, assetCriticality: 'critical', threatIntelHits: 9, mitreTactics: ['TA0006', 'TA0001'] }, assignedTo: '', created: '2024-04-15T10:00:00Z', enrichedAt: '2024-04-15T10:00:04Z' },
      { id: 'ALT-006', title: 'Malware signature match on email attachment', severity: 'medium', source: 'Email GW', status: 'auto-contained', score: 72, confidence: 98,
        enrichment: { iocCount: 2, relatedAlerts: 1, assetCriticality: 'medium', threatIntelHits: 15, mitreTactics: ['TA0001'] }, assignedTo: 'Auto-Remediation', created: '2024-04-15T09:30:00Z', enrichedAt: '2024-04-15T09:30:01Z' },
    ];
    this._triageRoutingRules = [
      { id: 'RR-001', name: 'Critical Alert to SOC L2', condition: 'severity == critical AND score >= 90', action: 'Assign to SOC-L2 on-call', enabled: true },
      { id: 'RR-002', name: 'Threat Intel Match Enrichment', condition: 'threatIntelHits > 0', action: 'Auto-enrich with CTI context', enabled: true },
      { id: 'RR-003', name: 'Low Confidence Auto-Close', condition: 'confidence < 30 AND severity == low', action: 'Auto-close with note after 24h', enabled: true },
      { id: 'RR-004', name: 'Related Alert Grouping', condition: 'relatedAlerts > 2', action: 'Group as incident and notify IR lead', enabled: true },
      { id: 'RR-005', name: 'VIP Asset Escalation', condition: 'assetCriticality == critical AND severity >= high', action: 'Page on-call security engineer', enabled: false },
    ];
    this._triageEscalationPolicy = [
      { level: 1, threshold: 'No response in 15 minutes', notify: 'SOC L1 team chat', autoAction: 'Reassign to next available analyst' },
      { level: 2, threshold: 'No response in 30 minutes', notify: 'SOC L2 on-call via SMS', autoAction: 'Escalate to L2 queue' },
      { level: 3, threshold: 'No response in 60 minutes', notify: 'Security Manager + CISO', autoAction: 'Page on-call incident commander' },
      { level: 4, threshold: 'Active threat confirmed', notify: 'Executive team', autoAction: 'Activate full incident response' },
    ];
  }

  private _getTriageStats(): { total: number; newCount: number; investigating: number; escalated: number; resolved: number; autoContained: number } {
    return {
      total: this._triageAlerts.length,
      newCount: this._triageAlerts.filter(a => a.status === 'new').length,
      investigating: this._triageAlerts.filter(a => a.status === 'investigating').length,
      escalated: this._triageAlerts.filter(a => a.status === 'escalated').length,
      resolved: this._triageAlerts.filter(a => a.status === 'resolved').length,
      autoContained: this._triageAlerts.filter(a => a.status === 'auto-contained').length,
    };
  }

  private _getTriageAvgScore(): number {
    if (this._triageAlerts.length === 0) return 0;
    return Math.round(this._triageAlerts.reduce((s, a) => s + a.score, 0) / this._triageAlerts.length);
  }

  private _getTriageHighConfidence(): number {
    return this._triageAlerts.filter(a => a.confidence >= 85).length;
  }

  private _getTriageTopSource(): string {
    if (this._triageAlerts.length === 0) return 'N/A';
    const counts: Record<string, number> = {};
    this._triageAlerts.forEach(a => { counts[a.source] = (counts[a.source] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  private _getTriageActiveRoutingRules(): number {
    return this._triageRoutingRules.filter(r => r.enabled).length;
  }

  // ─── Security Architecture Review ───
  @state() private _archActiveSection: string = 'components';
  @state() private _archComponents: Array<{ id: string; name: string; category: string; trustZone: string; controls: string[]; status: string; lastReview: string; riskScore: number }> = [];
  @state() private _archTrustBoundaries: Array<{ id: string; name: string; from: string; to: string; controlType: string; enforcement: string; status: string }> = [];
  @state() private _archDecisionRecords: Array<{ id: string; title: string; date: string; status: string; context: string; decision: string; consequences: string }> = [];

  private _initArchitecture(): void {
    if (this._archComponents.length > 0) return;
    this._archComponents = [
      { id: 'AC-001', name: 'Web Application Firewall', category: 'Network Security', trustZone: 'DMZ', controls: ['OWASP CRS', 'Rate Limiting', 'Bot Detection', 'Geo-blocking'], status: 'active', lastReview: '2024-04-01', riskScore: 2 },
      { id: 'AC-002', name: 'Identity Provider (IdP)', category: 'Identity & Access', trustZone: 'Internal', controls: ['SAML 2.0', 'OIDC', 'MFA', 'Adaptive Auth', 'SSO'], status: 'active', lastReview: '2024-03-15', riskScore: 3 },
      { id: 'AC-003', name: 'Data Loss Prevention', category: 'Data Protection', trustZone: 'Internal', controls: ['Content Inspection', 'Endpoint Agent', 'Cloud API Integration', 'Encryption'], status: 'needs-review', lastReview: '2024-01-20', riskScore: 7 },
      { id: 'AC-004', name: 'SIEM Platform', category: 'Detection & Response', trustZone: 'SOC', controls: ['Log Aggregation', 'Correlation Rules', 'Threat Intel Feed', 'SOAR Integration'], status: 'active', lastReview: '2024-03-28', riskScore: 4 },
      { id: 'AC-005', name: 'Container Security Platform', category: 'Cloud Security', trustZone: 'Cloud', controls: ['Image Scanning', 'Runtime Protection', 'Network Policy', 'Secrets Management'], status: 'active', lastReview: '2024-04-05', riskScore: 3 },
      { id: 'AC-006', name: 'Zero Trust Network Access', category: 'Network Security', trustZone: 'Perimeter', controls: ['Micro-segmentation', 'Continuous Verification', 'Least Privilege Access', 'Device Trust'], status: 'implementing', lastReview: '2024-04-10', riskScore: 5 },
    ];
    this._archTrustBoundaries = [
      { id: 'TB-001', name: 'Internet to DMZ', from: 'External', to: 'DMZ', controlType: 'WAF + DDoS Protection', enforcement: 'Active', status: 'enforced' },
      { id: 'TB-002', name: 'DMZ to Internal', from: 'DMZ', to: 'Internal', controlType: 'Application Layer Firewall', enforcement: 'Active', status: 'enforced' },
      { id: 'TB-003', name: 'Internal to SOC', from: 'Internal', to: 'SOC', controlType: 'Role-Based Access + Network Segmentation', enforcement: 'Active', status: 'enforced' },
      { id: 'TB-004', name: 'Internal to Cloud', from: 'Internal', to: 'Cloud', controlType: 'CASB + Zero Trust', enforcement: 'Partial', status: 'partial' },
      { id: 'TB-005', name: 'Partner to Internal', from: 'External', to: 'Internal', controlType: 'VPN + MFA + Limited Access', enforcement: 'Active', status: 'needs-review' },
    ];
    this._archDecisionRecords = [
      { id: 'ADR-001', title: 'Adopt Zero Trust Architecture', date: '2024-01-15', status: 'accepted', context: 'VPN-based perimeter security is insufficient for hybrid workforce', decision: 'Implement ZTNA with micro-segmentation across all network zones', consequences: 'Reduced lateral movement risk, increased authentication friction' },
      { id: 'ADR-002', title: 'Migrate SIEM to Cloud-Native Platform', date: '2024-02-20', status: 'accepted', context: 'On-prem SIEM cannot scale to handle cloud log volume', decision: 'Migrate to cloud-native SIEM with 90-day retention', consequences: 'Better scalability, dependency on cloud provider uptime' },
      { id: 'ADR-003', title: 'Deploy Runtime Container Security', date: '2024-03-10', status: 'accepted', context: 'Static image scanning misses runtime threats and supply chain attacks', decision: 'Deploy eBPF-based runtime security agent in all Kubernetes clusters', consequences: 'Improved threat detection, minimal performance overhead' },
    ];
  }

  private _getArchComponentStats(): { total: number; active: number; needsReview: number; implementing: number; avgRisk: number } {
    const active = this._archComponents.filter(c => c.status === 'active').length;
    const needsReview = this._archComponents.filter(c => c.status === 'needs-review').length;
    const implementing = this._archComponents.filter(c => c.status === 'implementing').length;
    const avgRisk = this._archComponents.length > 0
      ? Math.round(this._archComponents.reduce((s, c) => s + c.riskScore, 0) / this._archComponents.length * 10) / 10 : 0;
    return { total: this._archComponents.length, active, needsReview, implementing, avgRisk };
  }

  private _getArchBoundaryStats(): { total: number; enforced: number; partial: number; needsReview: number } {
    return {
      total: this._archTrustBoundaries.length,
      enforced: this._archTrustBoundaries.filter(b => b.status === 'enforced').length,
      partial: this._archTrustBoundaries.filter(b => b.status === 'partial').length,
      needsReview: this._archTrustBoundaries.filter(b => b.status === 'needs-review').length,
    };
  }

  private _getArchControlCoverage(): number {
    if (this._archComponents.length === 0) return 0;
    const totalControls = this._archComponents.reduce((s, c) => s + c.controls.length, 0);
    return totalControls;
  }

  // ─── Continuous Monitoring Suite ───
  @state() private _monActiveView: string = 'dashboard';
  @state() private _monMetricGauges: Array<{ id: string; name: string; value: number; max: number; unit: string; status: string; trend: string }> = [];
  @state() private _monAnomalyStream: Array<{ id: string; timestamp: string; type: string; description: string; severity: string; source: string; status: string }> = [];
  @state() private _monHealthChecks: Array<{ service: string; status: string; latency: number; uptime: number; lastCheck: string; slaTarget: number }> = [];
  @state() private _monAlertFatigue: { totalAlerts: number; actionable: number; falsePositive: number; noiseRate: number; topNoiseSource: string; fatigueIndex: number } = { totalAlerts: 0, actionable: 0, falsePositive: 0, noiseRate: 0, topNoiseSource: '', fatigueIndex: 0 };

  private _initMonitoring(): void {
    if (this._monMetricGauges.length > 0) return;
    this._monMetricGauges = [
      { id: 'MG-001', name: 'Threat Detection Coverage', value: 72, max: 100, unit: '%', status: 'warning', trend: 'improving' },
      { id: 'MG-002', name: 'Mean Time to Detect', value: 4.2, max: 24, unit: 'hrs', status: 'healthy', trend: 'improving' },
      { id: 'MG-003', name: 'Mean Time to Respond', value: 2.1, max: 8, unit: 'hrs', status: 'healthy', trend: 'stable' },
      { id: 'MG-004', name: 'Patch Compliance', value: 78, max: 100, unit: '%', status: 'warning', trend: 'improving' },
      { id: 'MG-005', name: 'MFA Adoption', value: 78, max: 100, unit: '%', status: 'warning', trend: 'improving' },
      { id: 'MG-006', name: 'Security Posture Score', value: 82, max: 100, unit: '', status: 'healthy', trend: 'improving' },
      { id: 'MG-007', name: 'Endpoint Compliance', value: 91, max: 100, unit: '%', status: 'healthy', trend: 'stable' },
      { id: 'MG-008', name: 'Vulnerability SLA Compliance', value: 85, max: 100, unit: '%', status: 'healthy', trend: 'declining' },
    ];
    this._monAnomalyStream = [
      { id: 'AN-001', timestamp: '2024-04-15T10:32:00Z', type: 'Behavioral', description: 'Unusual login pattern detected for service account svc-backup', severity: 'high', source: 'UEBA', status: 'investigating' },
      { id: 'AN-002', timestamp: '2024-04-15T10:15:00Z', type: 'Network', description: 'DNS tunneling attempt blocked from workstation WS-042', severity: 'medium', source: 'NDR', status: 'blocked' },
      { id: 'AN-003', timestamp: '2024-04-15T09:58:00Z', type: 'Endpoint', description: 'New autorun key created on server SRV-DB-03', severity: 'high', source: 'EDR', status: 'investigating' },
      { id: 'AN-004', timestamp: '2024-04-15T09:30:00Z', type: 'Cloud', description: 'IAM role assumption from unexpected principal', severity: 'medium', source: 'CSPM', status: 'resolved' },
      { id: 'AN-005', timestamp: '2024-04-15T09:12:00Z', type: 'Data', description: 'Bulk download of sensitive files detected (3.2 GB in 5 min)', severity: 'critical', source: 'DLP', status: 'escalated' },
    ];
    this._monHealthChecks = [
      { service: 'SIEM Platform', status: 'healthy', latency: 45, uptime: 99.97, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.9 },
      { service: 'EDR Agent Fleet', status: 'healthy', latency: 120, uptime: 99.85, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.5 },
      { service: 'Threat Intel Feed', status: 'healthy', latency: 200, uptime: 99.99, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.5 },
      { service: 'Vulnerability Scanner', status: 'degraded', latency: 3500, uptime: 98.2, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.0 },
      { service: 'SOAR Platform', status: 'healthy', latency: 80, uptime: 99.95, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.5 },
      { service: 'Log Forwarder Cluster', status: 'healthy', latency: 15, uptime: 99.98, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.9 },
    ];
    this._monAlertFatigue = {
      totalAlerts: 1247, actionable: 312, falsePositive: 685,
      noiseRate: 54.9, topNoiseSource: 'Endpoint Detection (false positives on legitimate admin tools)',
      fatigueIndex: 3.8,
    };
  }

  private _getMonOverallHealth(): string {
    const degraded = this._monHealthChecks.filter(h => h.status !== 'healthy').length;
    if (degraded === 0) return 'healthy';
    if (degraded <= 1) return 'warning';
    return 'critical';
  }

  private _getMonAvgUptime(): number {
    if (this._monHealthChecks.length === 0) return 0;
    return Math.round(this._monHealthChecks.reduce((s, h) => s + h.uptime, 0) / this._monHealthChecks.length * 100) / 100;
  }

  private _getMonSlaBreaches(): number {
    return this._monHealthChecks.filter(h => h.uptime < h.slaTarget).length;
  }

  private _getMonActiveAnomalies(): number {
    return this._monAnomalyStream.filter(a => a.status !== 'resolved' && a.status !== 'blocked').length;
  }

  private _getMonGaugeStatusColor(status: string): string {
    if (status === 'healthy') return '#2ed573';
    if (status === 'warning') return '#ffa502';
    if (status === 'critical') return '#ff4757';
    return '#95a5a6';
  }




  // === Round 17: Risk Quantification Framework ===
  @state() private _stFairModel: any = null;
  @state() private _stRiskHeatMap: any = null;
  @state() private _stRiskAppetite: any = null;
  @state() private _stMonteCarlo: any = null;
  @state() private _stRiskRegister: any = null;
  @state() private _stRiskTrend: any = null;

  private stInitRiskQuant() {
    this._stFairModel = {
      scenarios: [
        { name: "Ransomware Attack", lef: 0.15, primaryLoss: 2500000, secondaryLoss: 800000, productivityLoss: 120000 },
        { name: "Data Breach (PII)", lef: 0.25, primaryLoss: 4800000, secondaryLoss: 1500000, productivityLoss: 200000 },
        { name: "Insider Threat", lef: 0.08, primaryLoss: 1800000, secondaryLoss: 600000, productivityLoss: 90000 },
        { name: "Supply Chain Compromise", lef: 0.05, primaryLoss: 3200000, secondaryLoss: 1100000, productivityLoss: 300000 },
        { name: "Cloud Misconfiguration", lef: 0.35, primaryLoss: 900000, secondaryLoss: 300000, productivityLoss: 60000 },
        { name: "Phishing Campaign", lef: 0.45, primaryLoss: 500000, secondaryLoss: 150000, productivityLoss: 40000 },
        { name: "Zero-Day Exploit", lef: 0.02, primaryLoss: 5500000, secondaryLoss: 2000000, productivityLoss: 500000 },
        { name: "DDoS Attack", lef: 0.20, primaryLoss: 700000, secondaryLoss: 200000, productivityLoss: 80000 }
      ],
      totalAlec: 8750000,
      riskCapacity: 12000000,
      toleranceThreshold: 75
    };
    this._stRiskHeatMap = ((): any[] => {
      const grid: any[] = [];
      const labels = ["Rare","Unlikely","Possible","Likely","Almost Certain"];
      const impacts = ["Negligible","Minor","Moderate","Major","Catastrophic"];
      const data = [
        [1,2,3,4,5],[2,4,6,8,10],[3,6,9,12,15],[4,8,12,16,20],[5,10,15,20,25]
      ];
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const score = data[i][j];
          grid.push({ likelihood: labels[i], impact: impacts[j], score, risk: score <= 4 ? "Low" : score <= 9 ? "Medium" : score <= 15 ? "High" : "Critical", color: score <= 4 ? "#4caf50" : score <= 9 ? "#ff9800" : score <= 15 ? "#f44336" : "#9c27b0" });
        }
      }
      return grid;
    })();
    this._stRiskAppetite = {
      maxAcceptable: 5000000,
      boardApproved: 8000000,
      currentExposure: 6200000,
      categories: [
        { category: "Financial", appetite: 3000000, exposure: 2100000 },
        { category: "Reputational", appetite: 2000000, exposure: 1500000 },
        { category: "Operational", appetite: 1500000, exposure: 1200000 },
        { category: "Regulatory", appetite: 1000000, exposure: 800000 },
        { category: "Legal", appetite: 500000, exposure: 600000 }
      ]
    };
    this._stMonteCarlo = ((): any[] => {
      const results: any[] = [];
      for (let i = 0; i < 20; i++) {
        const seed = (i + 1) * 7919;
        const r1 = ((seed * 16807) % 2147483647) / 2147483647;
        const r2 = ((seed * 48271) % 2147483647) / 2147483647;
        const baseLoss = 2000000 + r1 * 6000000;
        const variance = baseLoss * (r2 - 0.5) * 0.4;
        results.push({ iteration: i + 1, loss: Math.round(baseLoss + variance), percentile: 0 });
      }
      results.sort((a, b) => a.loss - b.loss);
      results.forEach((r, i) => { r.percentile = Math.round(((i + 1) / results.length) * 100); });
      return results;
    })();
    this._stRiskRegister = [
      { id: "RSK-001", name: "Credential Stuffing", owner: "IAM Team", likelihood: 4, impact: 3, score: 12, status: "Mitigating", trend: "improving" },
      { id: "RSK-002", name: "Cloud Data Exposure", owner: "Cloud Sec", likelihood: 3, impact: 5, score: 15, status: "Open", trend: "stable" },
      { id: "RSK-003", name: "Third-Party Breach", owner: "GRC Team", likelihood: 3, impact: 4, score: 12, status: "Mitigating", trend: "worsening" },
      { id: "RSK-004", name: "Insider Data Theft", owner: "HR + SecOps", likelihood: 2, impact: 4, score: 8, status: "Monitoring", trend: "stable" },
      { id: "RSK-005", name: "Ransomware", owner: "SecOps", likelihood: 4, impact: 5, score: 20, status: "Mitigating", trend: "improving" },
      { id: "RSK-006", name: "API Security Flaw", owner: "AppSec", likelihood: 3, impact: 3, score: 9, status: "Open", trend: "worsening" },
      { id: "RSK-007", name: "Compliance Violation", owner: "GRC Team", likelihood: 2, impact: 5, score: 10, status: "Mitigating", trend: "improving" },
      { id: "RSK-008", name: "Social Engineering", owner: "SecAwareness", likelihood: 5, impact: 2, score: 10, status: "Monitoring", trend: "stable" }
    ];
    this._stRiskTrend = [
      { month: "Oct", critical: 3, high: 8, medium: 15, low: 22 },
      { month: "Nov", critical: 2, high: 7, medium: 14, low: 24 },
      { month: "Dec", critical: 4, high: 9, medium: 16, low: 20 },
      { month: "Jan", critical: 3, high: 8, medium: 13, low: 21 },
      { month: "Feb", critical: 2, high: 6, medium: 12, low: 23 },
      { month: "Mar", critical: 1, high: 5, medium: 11, low: 25 }
    ];
  }

  private stRenderRiskQuant() {
    const fm = this._stFairModel;
    if (!fm) return nothing;
    const fmt = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : (n / 1000).toFixed(0) + "K";
    const sevColor = (s: number) => s <= 4 ? "#4caf50" : s <= 9 ? "#ff9800" : s <= 15 ? "#f44336" : "#9c27b0";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Risk Quantification Framework (FAIR)</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div style="background:#1a1d27;border-radius:4px;padding:8px">
            <div style="color:#aaa;font-size:9px;margin-bottom:4px">Annual Loss Expectancy</div>
            <div style="color:#48f;font-size:18px;font-weight:bold">${fmt(fm.totalAlec)}</div>
            <div style="color:#888;font-size:8px">Capacity: ${fmt(fm.riskCapacity)}</div>
          </div>
          <div style="background:#1a1d27;border-radius:4px;padding:8px">
            <div style="color:#aaa;font-size:9px;margin-bottom:4px">Risk Tolerance</div>
            <div style="color:#f84;font-size:18px;font-weight:bold">${fm.toleranceThreshold}%</div>
            <div style="background:#1a1d27;border-radius:3px;height:6px;margin-top:4px;overflow:hidden">
              <div style="height:100%;width:${Math.round((fm.totalAlec / fm.riskCapacity) * 100)}%;background:${fm.totalAlec / fm.riskCapacity > 0.75 ? "#f44" : "#48f"}"></div>
            </div>
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:6px">FAIR Model Scenarios</div>
        ${fm.scenarios.map((s: any) => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:9px">
            <span style="color:#ccc;width:130px;flex-shrink:0">${s.name}</span>
            <span style="color:#888;width:40px">LEF ${(s.lef * 100).toFixed(0)}%</span>
            <div style="flex:1;background:#1a1d27;border-radius:3px;height:5px;overflow:hidden">
              <div style="height:100%;width:${Math.min(100, (s.primaryLoss / 6000000) * 100)}%;background:${s.primaryLoss > 3000000 ? "#f44" : s.primaryLoss > 1500000 ? "#f84" : "#4caf50"}"></div>
            </div>
            <span style="color:#ddd;width:50px;text-align:right">${fmt(s.primaryLoss)}</span>
          </div>`)}
        <div style="color:#aaa;font-size:10px;margin:8px 0 6px">Risk Heat Map (5x5)</div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:2px;font-size:8px">
          ${this._stRiskHeatMap.map((c: any) => html`<div style="background:${c.color}22;border:1px solid ${c.color}44;border-radius:2px;padding:3px;text-align:center;color:${c.color}">
              <div>${c.score}</div>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Monte Carlo Simulation (20 iterations)</div>
            ${this._stMonteCarlo.slice(0, 10).map((r: any) => html`<div style="display:flex;gap:4px;font-size:8px;margin-bottom:1px">
                <span style="color:#888;width:20px">#${r.iteration}</span>
                <div style="flex:1;background:#1a1d27;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(r.loss / 8000000) * 100}%;background:${r.loss > 5000000 ? "#f44" : r.loss > 3000000 ? "#f84" : "#4caf50"}"></div>
                </div>
                <span style="color:#ccc;width:40px;text-align:right">${fmt(r.loss)}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Risk Register (Top 8)</div>
            ${this._stRiskRegister.map((r: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
                <span style="color:${sevColor(r.score)};font-weight:bold;width:16px">${r.score}</span>
                <span style="color:#ccc;flex:1">${r.name}</span>
                <span style="color:${r.trend === "improving" ? "#4caf50" : r.trend === "worsening" ? "#f44" : "#888"};font-size:7px">${r.trend}</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:8px 0 4px">Risk Trend (6 months)</div>
        <div style="display:flex;gap:4px;align-items:flex-end;height:50px">
          ${this._stRiskTrend.map((t: any) => html`<div style="flex:1;display:flex;flex-direction:column;gap:1px;align-items:center">
              <div style="display:flex;gap:1px;align-items:flex-end;height:40px">
                <div style="width:8px;height:${(t.critical / 25) * 40}px;background:#f44;border-radius:1px"></div>
                <div style="width:8px;height:${(t.high / 25) * 40}px;background:#f84;border-radius:1px"></div>
                <div style="width:8px;height:${(t.medium / 25) * 40}px;background:#ff8;border-radius:1px"></div>
                <div style="width:8px;height:${(t.low / 25) * 40}px;background:#4caf50;border-radius:1px"></div>
              </div>
              <span style="color:#888;font-size:7px">${t.month}</span>
            </div>`)}
        </div>
      </div>`;
  }

  // === Round 17: Security Program Management ===
  @state() private _stOkrs: any = null;
  @state() private _stInitiatives: any = null;
  @state() private _stResourceAlloc: any = null;
  @state() private _stHeadcount: any = null;
  @state() private _stMilestones: any = null;
  @state() private _stBudget: any = null;

  private stInitSecProgram() {
    this._stOkrs = [
      { objective: "Reduce Mean Time to Detect", keyResults: [{ kr: "MTTD < 24 hours", progress: 72 }, { kr: "Deploy EDR to 100% endpoints", progress: 89 }, { kr: "SIEM coverage 95%+", progress: 81 }], overallProgress: 81 },
      { objective: "Eliminate Critical Vulnerabilities in 7 days", keyResults: [{ kr: "Patch SLA compliance > 95%", progress: 67 }, { kr: "Zero critical vulns > 30 days", progress: 45 }, { kr: "Automated patching 80%+", progress: 58 }], overallProgress: 57 },
      { objective: "Achieve Zero Trust Architecture", keyResults: [{ kr: "Micro-segment 90% workloads", progress: 63 }, { kr: "ZTNA adoption 100%", progress: 78 }, { kr: "Continuous verification deployed", progress: 54 }], overallProgress: 65 },
      { objective: "Build Security-First Culture", keyResults: [{ kr: "Phishing click rate < 3%", progress: 85 }, { kr: "Security training 100%", progress: 92 }, { kr: "DevSecOps maturity L3+", progress: 48 }], overallProgress: 75 }
    ];
    this._stInitiatives = [
      { name: "Zero Trust Migration", phase: "Phase 2", status: "On Track", owner: "ZT Program", budget: 1200000, spent: 680000, completion: 45, priority: "P0" },
      { name: "Cloud Security Posture", phase: "Phase 3", status: "At Risk", owner: "Cloud Sec", budget: 800000, spent: 750000, completion: 72, priority: "P0" },
      { name: "SOC Modernization", phase: "Phase 2", status: "On Track", owner: "SOC Lead", budget: 1500000, spent: 520000, completion: 35, priority: "P0" },
      { name: "AppSec Program", phase: "Phase 1", status: "On Track", owner: "AppSec Lead", budget: 600000, spent: 180000, completion: 25, priority: "P1" },
      { name: "Identity Governance", phase: "Phase 2", status: "Delayed", owner: "IAM Team", budget: 400000, spent: 380000, completion: 60, priority: "P1" },
      { name: "Threat Intelligence", phase: "Phase 1", status: "On Track", owner: "CTI Team", budget: 350000, spent: 120000, completion: 30, priority: "P1" },
      { name: "Vendor Risk Program", phase: "Phase 1", status: "On Track", owner: "GRC Team", budget: 250000, spent: 80000, completion: 20, priority: "P2" },
      { name: "Data Classification", phase: "Phase 2", status: "At Risk", owner: "Data Sec", budget: 300000, spent: 220000, completion: 55, priority: "P1" },
      { name: "Security Automation", phase: "Phase 2", status: "On Track", owner: "SecOps", budget: 500000, spent: 280000, completion: 40, priority: "P0" },
      { name: "Incident Response Upgrade", phase: "Phase 1", status: "On Track", owner: "IR Lead", budget: 200000, spent: 60000, completion: 22, priority: "P1" },
      { name: "Compliance Automation", phase: "Phase 1", status: "Delayed", owner: "GRC Team", budget: 450000, spent: 200000, completion: 35, priority: "P2" },
      { name: "Security Metrics Platform", phase: "Phase 1", status: "On Track", owner: "SecEng", budget: 300000, spent: 90000, completion: 28, priority: "P1" }
    ];
    this._stResourceAlloc = [
      { domain: "Security Operations", allocated: 35, used: 31, budget: 2800000 },
      { domain: "Identity & Access", allocated: 12, used: 11, budget: 960000 },
      { domain: "Application Security", allocated: 10, used: 8, budget: 800000 },
      { domain: "Cloud Security", allocated: 8, used: 9, budget: 640000 },
      { domain: "GRC & Compliance", allocated: 8, used: 7, budget: 640000 },
      { domain: "Threat Intelligence", allocated: 5, used: 4, budget: 400000 },
      { domain: "Security Engineering", allocated: 7, used: 6, budget: 560000 }
    ];
    this._stHeadcount = {
      total: 85, filled: 72, open: 13, budget: 10200000,
      byLevel: [{ level: "L3 (Senior)", count: 28, target: 32 }, { level: "L4 (Staff)", count: 18, target: 20 }, { level: "L5 (Principal)", count: 8, target: 10 }, { level: "L2 (Mid)", count: 14, target: 15 }, { level: "L1 (Junior)", count: 4, target: 8 }],
      criticalRoles: ["Cloud Security Architect", "Senior Threat Hunter", "AppSec Engineer", "SOC Analyst L2"]
    };
    this._stMilestones = [
      { initiative: "Zero Trust", milestone: "Micro-seg Phase 2 complete", due: "2026-03-31", status: "On Track", rag: "green" },
      { initiative: "SOC Mod", milestone: "SOAR platform deployed", due: "2026-04-15", status: "At Risk", rag: "amber" },
      { initiative: "Cloud Sec", milestone: "CSPM full coverage", due: "2026-05-01", status: "Behind", rag: "red" },
      { initiative: "AppSec", milestone: "SAST in all CI/CD", due: "2026-06-30", status: "On Track", rag: "green" },
      { initiative: "IAM", milestone: "PAM deployment complete", due: "2026-04-30", status: "Delayed", rag: "red" },
      { initiative: "Automation", milestone: "50% alert triage automated", due: "2026-05-15", status: "On Track", rag: "green" }
    ];
    this._stBudget = {
      total: 10200000, allocated: 9650000, spent: 5480000, remaining: 4170000,
      quarterly: [{ q: "Q1", allocated: 2412500, spent: 2412500 }, { q: "Q2", allocated: 2412500, spent: 1950000 }, { q: "Q3", allocated: 2412500, spent: 1117500 }, { q: "Q4", allocated: 2412500, spent: 0 }],
      byCategory: [{ cat: "Personnel", pct: 68 }, { cat: "Tools & Licenses", pct: 18 }, { cat: "Services", pct: 9 }, { cat: "Training", pct: 5 }]
    };
  }

  private stRenderSecProgram() {
    const okrs = this._stOkrs;
    if (!okrs) return nothing;
    const fmt = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : (n / 1000).toFixed(0) + "K";
    const ragColor = (r: string) => r === "green" ? "#4caf50" : r === "amber" ? "#ff9800" : "#f44";
    const statusColor = (s: string) => s === "On Track" ? "#4caf50" : s === "At Risk" ? "#ff9800" : "#f44";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Security Program Management</h4>
        <div style="color:#aaa;font-size:10px;margin-bottom:6px">OKR Tracking</div>
        ${okrs.map((o: any) => html`<div style="margin-bottom:8px;background:#1a1d27;border-radius:4px;padding:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="color:#e0e0e0;font-size:10px;font-weight:bold">${o.objective}</span>
              <span style="color:${o.overallProgress >= 75 ? "#4caf50" : o.overallProgress >= 50 ? "#ff9800" : "#f44"};font-size:10px;font-weight:bold">${o.overallProgress}%</span>
            </div>
            <div style="background:#111;border-radius:3px;height:6px;overflow:hidden;margin-bottom:4px">
              <div style="height:100%;width:${o.overallProgress}%;background:${o.overallProgress >= 75 ? "#4caf50" : o.overallProgress >= 50 ? "#ff9800" : "#f44"};transition:width 0.3s"></div>
            </div>
            ${o.keyResults.map((kr: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#888;width:12px">${kr.progress >= 75 ? "\u2713" : kr.progress >= 50 ? "\u25CB" : "\u25CB"}</span>
                <span style="color:#bbb;flex:1">${kr.kr}</span>
                <span style="color:#aaa;width:24px;text-align:right">${kr.progress}%</span>
              </div>`)}
          </div>`)}
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">Initiative Roadmap (12 initiatives)</div>
        <div style="max-height:120px;overflow-y:auto">
          ${this._stInitiatives.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
              <span style="color:${i.priority === "P0" ? "#f44" : i.priority === "P1" ? "#f84" : "#888"};font-weight:bold;width:16px">${i.priority}</span>
              <span style="color:#ccc;flex:1">${i.name}</span>
              <span style="color:${statusColor(i.status)};width:50px">${i.status}</span>
              <span style="color:#888;width:24px;text-align:right">${i.completion}%</span>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Resource Allocation</div>
            ${this._stResourceAlloc.slice(0, 5).map((r: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:90px">${r.domain}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(r.used / r.allocated) * 100}%;background:${r.used > r.allocated ? "#f44" : "#48f"}"></div>
                </div>
                <span style="color:#888">${r.used}/${r.allocated}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Budget Utilization</div>
            <div style="font-size:9px;color:#ccc;margin-bottom:4px">Total: ${fmt(this._stBudget.total)} | Spent: ${fmt(this._stBudget.spent)}</div>
            ${this._stBudget.quarterly.map((q: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#888;width:16px">${q.q}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(q.spent / q.allocated) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#aaa">${fmt(q.spent)}</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">Milestone Tracker</div>
        ${this._stMilestones.map((m: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <div style="width:6px;height:6px;border-radius:50%;background:${ragColor(m.rag)}"></div>
            <span style="color:#ccc;width:60px">${m.initiative}</span>
            <span style="color:#bbb;flex:1">${m.milestone}</span>
            <span style="color:#888">${m.due}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Third-Party Risk Assessment ===
  @state() private _stVendorTiers: any = null;
  @state() private _stDueDiligence: any = null;
  @state() private _stContractClauses: any = null;
  @state() private _stVendorScorecard: any = null;
  @state() private _stSubProcessors: any = null;
  @state() private _stVendorIncidents: any = null;

  private stInitThirdParty() {
    this._stVendorTiers = [
      { tier: "Critical", count: 8, vendors: ["AWS", "Azure AD", "CrowdStrike", "Okta", "ServiceNow", "Salesforce", "Workday", "Datadog"] },
      { tier: "High", count: 14, vendors: ["Slack", "GitHub", "Jenkins", "Terraform", "Artifactory", "Snyk", "Palo Alto", "Zscaler"] },
      { tier: "Medium", count: 32, vendors: ["Figma", "Confluence", "Zoom", "Dropbox", "Notion", "Linear"] },
      { tier: "Low", count: 67, vendors: ["Various SaaS tools", "Utilities", "Dev tools"] }
    ];
    this._stDueDiligence = [
      { item: "SOC 2 Type II Report", required: true, passRate: 0.78 },
      { item: "ISO 27001 Certification", required: true, passRate: 0.65 },
      { item: "Penetration Test Results", required: true, passRate: 0.72 },
      { item: "Data Processing Agreement", required: true, passRate: 0.91 },
      { item: "Sub-processor List", required: true, passRate: 0.85 },
      { item: "Incident Response Plan", required: true, passRate: 0.68 },
      { item: "Business Continuity Plan", required: false, passRate: 0.58 },
      { item: "Encryption Standards", required: true, passRate: 0.88 },
      { item: "Access Control Policy", required: true, passRate: 0.76 },
      { item: "Vulnerability Management", required: true, passRate: 0.71 },
      { item: "Data Retention Policy", required: false, passRate: 0.64 },
      { item: "Privacy Impact Assessment", required: false, passRate: 0.52 },
      { item: "Insurance Coverage", required: true, passRate: 0.45 },
      { item: "Right to Audit Clause", required: true, passRate: 0.82 },
      { item: "Breach Notification SLA", required: true, passRate: 0.90 }
    ];
    this._stContractClauses = [
      { clause: "Data Breach Notification", vendors: 98, compliant: 89, gap: 9 },
      { clause: "Right to Audit", vendors: 85, compliant: 72, gap: 13 },
      { clause: "Data Return on Termination", vendors: 92, compliant: 78, gap: 14 },
      { clause: "Liability Cap", vendors: 90, compliant: 65, gap: 25 },
      { clause: "Sub-processor Restrictions", vendors: 88, compliant: 80, gap: 8 },
      { clause: "Encryption Requirements", vendors: 95, compliant: 91, gap: 4 },
      { clause: "Incident Response SLA", vendors: 86, compliant: 74, gap: 12 },
      { clause: "Data Residency", vendors: 78, compliant: 62, gap: 16 }
    ];
    this._stVendorScorecard = [
      { vendor: "AWS", security: 92, compliance: 95, reliability: 98, risk: "Low", overall: 95 },
      { vendor: "CrowdStrike", security: 94, compliance: 90, reliability: 96, risk: "Low", overall: 93 },
      { vendor: "Okta", security: 85, compliance: 92, reliability: 90, risk: "Low", overall: 89 },
      { vendor: "GitHub", security: 82, compliance: 78, reliability: 94, risk: "Medium", overall: 85 },
      { vendor: "Slack", security: 78, compliance: 80, reliability: 92, risk: "Medium", overall: 83 },
      { vendor: "Figma", security: 75, compliance: 72, reliability: 88, risk: "Medium", overall: 78 },
      { vendor: "Linear", security: 70, compliance: 65, reliability: 90, risk: "Medium", overall: 75 },
      { vendor: "StartupAI Inc", security: 55, compliance: 48, reliability: 72, risk: "High", overall: 58 }
    ];
    this._stSubProcessors = [
      { vendor: "AWS", subProcessors: ["CloudFront", "S3 (US-East)", "DynamoDB", "Lambda"], reviewed: "2026-01" },
      { vendor: "CrowdStrike", subProcessors: ["AWS (hosting)", "Snowflake (analytics)"], reviewed: "2026-02" },
      { vendor: "Okta", subProcessors: ["AWS", "MongoDB Atlas"], reviewed: "2026-01" },
      { vendor: "Salesforce", subProcessors: ["AWS", "Heroku", "MuleSoft"], reviewed: "2025-11" },
      { vendor: "Datadog", subProcessors: ["GCP", "AWS"], reviewed: "2026-03" }
    ];
    this._stVendorIncidents = [
      { vendor: "Okta", date: "2026-01-15", severity: "Medium", description: "Support access breach", resolved: true, ourImpact: "None" },
      { vendor: "Cloudflare", date: "2026-02-20", severity: "Low", description: "Config exposure", resolved: true, ourImpact: "Minimal" },
      { vendor: "GitHub", date: "2026-03-05", severity: "Low", description: "Dependency confusion", resolved: true, ourImpact: "None" },
      { vendor: "StartupAI Inc", date: "2026-03-18", severity: "High", description: "Data exposure incident", resolved: false, ourImpact: "Under review" }
    ];
  }

  private stRenderThirdParty() {
    const tiers = this._stVendorTiers;
    if (!tiers) return nothing;
    const tierColor = (t: string) => t === "Critical" ? "#f44" : t === "High" ? "#f84" : t === "Medium" ? "#ff8" : "#888";
    const sevColor = (s: string) => s === "High" ? "#f44" : s === "Medium" ? "#f84" : "#888";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Third-Party Risk Assessment</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
          ${tiers.map((t: any) => html`<div style="background:#1a1d27;border-radius:4px;padding:8px;text-align:center;border-top:2px solid ${tierColor(t.tier)}">
              <div style="color:${tierColor(t.tier)};font-size:18px;font-weight:bold">${t.count}</div>
              <div style="color:#aaa;font-size:9px">${t.tier}</div>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Due Diligence Pass Rate</div>
            ${this._stDueDiligence.slice(0, 8).map((d: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:${d.required ? "#f44" : "#888"};width:8px">${d.required ? "*" : ""}</span>
                <span style="color:#ccc;flex:1">${d.item}</span>
                <div style="width:40px;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${d.passRate * 100}%;background:${d.passRate > 0.8 ? "#4caf50" : d.passRate > 0.6 ? "#ff9800" : "#f44"}"></div>
                </div>
                <span style="color:#888;width:28px;text-align:right">${(d.passRate * 100).toFixed(0)}%</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Contract Clause Compliance</div>
            ${this._stContractClauses.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;flex:1">${c.clause}</span>
                <span style="color:${c.gap > 15 ? "#f44" : c.gap > 8 ? "#f84" : "#4caf50"};width:28px;text-align:right">${c.gap} gap</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">Vendor Security Scorecard</div>
        ${this._stVendorScorecard.map((v: any) => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:8px">
            <span style="color:#ccc;width:80px;flex-shrink:0">${v.vendor}</span>
            <div style="display:flex;gap:2px;flex:1">
              <div title="Security" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.security}%;background:#48f"></div></div>
              <div title="Compliance" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.compliance}%;background:#4caf50"></div></div>
              <div title="Reliability" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.reliability}%;background:#ff9800"></div></div>
            </div>
            <span style="color:${tierColor(v.risk)};font-weight:bold;width:40px;text-align:right">${v.overall}</span>
          </div>`)}
        <div style="color:#aaa;font-size:10px;margin:8px 0 4px">Vendor Incidents (Recent)</div>
        ${this._stVendorIncidents.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <div style="width:6px;height:6px;border-radius:50%;background:${sevColor(i.severity)}"></div>
            <span style="color:#ccc;width:70px">${i.vendor}</span>
            <span style="color:#bbb;flex:1">${i.description}</span>
            <span style="color:${i.resolved ? "#4caf50" : "#f44"}">${i.resolved ? "Resolved" : "Open"}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Data Loss Prevention ===
  @state() private _stDlpRules: any = null;
  @state() private _stDataMovement: any = null;
  @state() private _stDataDiscovery: any = null;
  @state() private _stDlpIncidents: any = null;
  @state() private _stEncryptionMatrix: any = null;

  private stInitDLP() {
    this._stDlpRules = [
      { rule: "PII Detection (SSN)", type: "Content", channel: "Email+Cloud", enabled: true, matches: 234, blocked: 218, severity: "Critical" },
      { rule: "Credit Card Numbers", type: "Pattern", channel: "All", enabled: true, matches: 156, blocked: 148, severity: "Critical" },
      { rule: "Source Code Export", type: "Fingerprint", channel: "USB+Cloud", enabled: true, matches: 89, blocked: 85, severity: "High" },
      { rule: "Healthcare Records", type: "Content", channel: "Email", enabled: true, matches: 45, blocked: 42, severity: "Critical" },
      { rule: "Financial Reports", type: "Label", channel: "Email+Cloud", enabled: true, matches: 178, blocked: 165, severity: "High" },
      { rule: "API Key Detection", type: "Pattern", channel: "All", enabled: true, matches: 312, blocked: 301, severity: "High" },
      { rule: "Bulk Data Transfer", type: "Behavioral", channel: "Network", enabled: true, matches: 67, blocked: 58, severity: "Medium" },
      { rule: "Credential in Code", type: "Pattern", channel: "Git+Chat", enabled: true, matches: 445, blocked: 438, severity: "High" },
      { rule: "Encrypted Archive Upload", type: "Behavioral", channel: "Cloud", enabled: false, matches: 23, blocked: 0, severity: "Medium" },
      { rule: "Off-hours Data Access", type: "Behavioral", channel: "All", enabled: true, matches: 92, blocked: 78, severity: "Medium" }
    ];
    this._stDataMovement = {
      totalEvents: 15847, monitored: 12456, blocked: 1533, allowed: 10923,
      byChannel: [{ channel: "Email", events: 5234, blocked: 892 }, { channel: "Cloud Upload", events: 4123, blocked: 345 }, { channel: "USB", events: 1234, blocked: 198 }, { channel: "Network", events: 3890, blocked: 67 }, { channel: "Print", events: 1366, blocked: 31 }],
      bySensitivity: [{ level: "Confidential", pct: 35 }, { level: "Internal", pct: 45 }, { level: "Public", pct: 20 }]
    };
    this._stDataDiscovery = [
      { location: "SharePoint", total: 245000, sensitive: 12300, unclassified: 45000, lastScan: "2026-04-20" },
      { location: "S3 Buckets", total: 189000, sensitive: 8900, unclassified: 32000, lastScan: "2026-04-21" },
      { location: "Database Servers", total: 3400, sensitive: 2100, unclassified: 800, lastScan: "2026-04-19" },
      { location: "File Shares", total: 156000, sensitive: 6700, unclassified: 28000, lastScan: "2026-04-18" },
      { location: "Endpoints", total: 89000, sensitive: 3400, unclassified: 15000, lastScan: "2026-04-21" }
    ];
    this._stDlpIncidents = [
      { id: "DLP-001", type: "PII Exposure", status: "Resolved", severity: "Critical", assignee: "SecOps", time: "2h" },
      { id: "DLP-002", type: "Source Code Leak", status: "Investigating", severity: "High", assignee: "AppSec", time: "4h" },
      { id: "DLP-003", type: "Credential Commit", status: "Resolved", severity: "High", assignee: "DevSecOps", time: "1h" },
      { id: "DLP-004", type: "Bulk Export", status: "Monitoring", severity: "Medium", assignee: "SOC", time: "8h" },
      { id: "DLP-005", type: "API Key in Log", status: "Resolved", severity: "Medium", assignee: "SecOps", time: "30m" }
    ];
    this._stEncryptionMatrix = [
      { data: "PII at Rest", algorithm: "AES-256-GCM", coverage: 98, keyMgmt: "KMS" },
      { data: "PII in Transit", algorithm: "TLS 1.3", coverage: 100, keyMgmt: "Auto" },
      { data: "Source Code", algorithm: "AES-256-CBC", coverage: 85, keyMgmt: "Git Crypt" },
      { data: "Database", algorithm: "AES-256", coverage: 95, keyMgmt: "KMS" },
      { data: "Backups", algorithm: "AES-256-GCM", coverage: 92, keyMgmt: "KMS" },
      { data: "Email", algorithm: "TLS 1.2+", coverage: 88, keyMgmt: "S/MIME" },
      { data: "File Shares", algorithm: "BitLocker", coverage: 76, keyMgmt: "AD CS" },
      { data: "Cloud Storage", algorithm: "SSE-KMS", coverage: 94, keyMgmt: "Cloud KMS" }
    ];
  }

  private stRenderDLP() {
    const rules = this._stDlpRules;
    if (!rules) return nothing;
    const sevColor = (s: string) => s === "Critical" ? "#f44" : s === "High" ? "#f84" : "#ff8";
    const statusColor = (s: string) => s === "Resolved" ? "#4caf50" : s === "Investigating" ? "#f84" : "#ff8";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Data Loss Prevention</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
          ${[["Monitored",this._stDataMovement.monitored.toLocaleString(),"#48f"],["Blocked",this._stDataMovement.blocked.toLocaleString(),"#f44"],["Rules",rules.length,"#ff8"],["Incidents",this._stDlpIncidents.length,"#f84"]].map(([l,v,c]) => html`<div style="background:#1a1d27;border-radius:4px;padding:6px;text-align:center">
              <div style="color:${c};font-size:16px;font-weight:bold">${v}</div>
              <div style="color:#888;font-size:8px">${l}</div>
            </div>`)}
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">DLP Policy Rules (10 active)</div>
        ${rules.slice(0, 6).map((r: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <div style="width:6px;height:6px;border-radius:50%;background:${r.enabled ? "#4f4" : "#666"}"></div>
            <span style="color:#ccc;flex:1">${r.rule}</span>
            <span style="color:${sevColor(r.severity)};width:40px;text-align:right">${r.blocked}/${r.matches}</span>
          </div>`)}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Data Movement by Channel</div>
            ${this._stDataMovement.byChannel.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:60px">${c.channel}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(c.events / 5500) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#888;width:30px;text-align:right">${c.blocked}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Encryption Coverage</div>
            ${this._stEncryptionMatrix.map((e: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:60px">${e.data}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${e.coverage}%;background:${e.coverage >= 95 ? "#4caf50" : e.coverage >= 85 ? "#ff9800" : "#f44"}"></div>
                </div>
                <span style="color:#888;width:28px;text-align:right">${e.coverage}%</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">DLP Incident Response</div>
        ${this._stDlpIncidents.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <span style="color:${statusColor(i.status)};width:70px">${i.status}</span>
            <span style="color:#ccc;flex:1">${i.type}</span>
            <span style="color:${sevColor(i.severity)}">${i.severity}</span>
            <span style="color:#888">${i.time}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Security Automation Metrics ===
  @state() private _stAutoMetrics: any = null;
  @state() private _stAutoTimeSaved: any = null;
  @state() private _stAutoReliability: any = null;
  @state() private _stAutoComparison: any = null;
  @state() private _stAutoROI: any = null;
  @state() private _stAutoCandidates: any = null;

  private stInitAutomation() {
    this._stAutoMetrics = {
      totalPlaybooks: 48, activePlaybooks: 42, triggered: 12847, successful: 12156, failed: 691,
      coverage: 67, targetCoverage: 85, mttrReduction: 58, falsePositiveRate: 3.2
    };
    this._stAutoTimeSaved = [
      { task: "Alert Triage", manualMin: 15, autoMin: 0.5, daily: 120, savedHours: 2920 },
      { task: "Vuln Scanning", manualMin: 60, autoMin: 5, daily: 8, savedHours: 2730 },
      { task: "Patch Deployment", manualMin: 45, autoMin: 10, daily: 15, savedHours: 2555 },
      { task: "User Provisioning", manualMin: 30, autoMin: 2, daily: 25, savedHours: 1825 },
      { task: "Compliance Reporting", manualMin: 120, autoMin: 15, daily: 1, savedHours: 639 },
      { task: "Incident Escalation", manualMin: 10, autoMin: 1, daily: 45, savedHours: 2737 },
      { task: "Log Analysis", manualMin: 90, autoMin: 8, daily: 3, savedHours: 1277 },
      { task: "Threat Intel Enrichment", manualMin: 20, autoMin: 3, daily: 60, savedHours: 1972 }
    ];
    this._stAutoReliability = [
      { playbook: "Phishing Auto-Block", success: 98.5, executions: 4521, avgTime: "1.2s" },
      { playbook: "Vuln Auto-Scan", success: 97.2, executions: 2340, avgTime: "4.5m" },
      { playbook: "User Offboard", success: 99.1, executions: 156, avgTime: "30s" },
      { playbook: "Alert Enrichment", success: 96.8, executions: 8945, avgTime: "3.1s" },
      { playbook: "Malware Isolate", success: 95.4, executions: 89, avgTime: "8.2s" },
      { playbook: "Compliance Check", success: 94.7, executions: 365, avgTime: "2.1m" }
    ];
    this._stAutoComparison = [
      { process: "Vulnerability Management", manual: 45, automated: 12, reduction: 73 },
      { process: "Incident Response", manual: 180, automated: 65, reduction: 64 },
      { process: "Access Reviews", manual: 30, automated: 5, reduction: 83 },
      { process: "Compliance Audits", manual: 120, automated: 45, reduction: 63 },
      { process: "Threat Detection", manual: 60, automated: 8, reduction: 87 },
      { process: "Configuration Drift", manual: 40, automated: 10, reduction: 75 }
    ];
    this._stAutoROI = {
      investment: 850000, annualSavings: 2100000, roi: 147,
      costAvoidance: 1200000, efficiencyGain: 900000, headcountSaved: 4.5
    };
    this._stAutoCandidates = [
      { task: "Security Questionnaire Response", complexity: "Medium", savings: "120 hrs/yr", priority: "High" },
      { task: "Certificate Rotation", complexity: "Low", savings: "80 hrs/yr", priority: "High" },
      { task: "Firewall Rule Review", complexity: "High", savings: "200 hrs/yr", priority: "Medium" },
      { task: "Data Classification Tagging", complexity: "Medium", savings: "150 hrs/yr", priority: "High" },
      { task: "Vendor Risk Scoring", complexity: "Medium", savings: "90 hrs/yr", priority: "Medium" },
      { task: "Security Awareness Campaigns", complexity: "Low", savings: "60 hrs/yr", priority: "Low" }
    ];
  }

  private stRenderAutomation() {
    const m = this._stAutoMetrics;
    if (!m) return nothing;
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Security Automation Metrics</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
          ${[["Coverage",m.coverage + "%","#48f"],["Playbooks",m.activePlaybooks,"#4caf50"],["MTTR Reduction",m.mttrReduction + "%","#f84"],["False + Rate",m.falsePositiveRate + "%","#ff8"]].map(([l,v,c]) => html`<div style="background:#1a1d27;border-radius:4px;padding:6px;text-align:center">
              <div style="color:${c};font-size:16px;font-weight:bold">${v}</div>
              <div style="color:#888;font-size:8px">${l}</div>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Time Saved by Task (annual hours)</div>
            ${this._stAutoTimeSaved.slice(0, 5).map((t: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:90px">${t.task}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(t.savedHours / 3000) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#888;width:40px;text-align:right">${t.savedHours}h</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Playbook Reliability</div>
            ${this._stAutoReliability.map((p: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:90px">${p.playbook}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${p.success}%;background:${p.success >= 97 ? "#4caf50" : p.success >= 95 ? "#ff9800" : "#f44"}"></div>
                </div>
                <span style="color:#888;width:35px;text-align:right">${p.success}%</span>
              </div>`)}
          </div>
        </div>
        <div style="background:#1a1d27;border-radius:4px;padding:8px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="color:#aaa;font-size:9px">Automation ROI</div>
              <div style="color:#4caf50;font-size:16px;font-weight:bold">${this._stAutoROI.roi}%</div>
            </div>
            <div style="text-align:center">
              <div style="color:#aaa;font-size:9px">Annual Savings</div>
              <div style="color:#48f;font-size:16px;font-weight:bold">${(this._stAutoROI.annualSavings / 1000000).toFixed(1)}M</div>
            </div>
            <div style="text-align:center">
              <div style="color:#aaa;font-size:9px">Headcount Saved</div>
              <div style="color:#ff8;font-size:16px;font-weight:bold">${this._stAutoROI.headcountSaved}</div>
            </div>
            <div style="text-align:right">
              <div style="color:#aaa;font-size:9px">Investment</div>
              <div style="color:#ccc;font-size:16px;font-weight:bold">${(this._stAutoROI.investment / 1000).toFixed(0)}K</div>
            </div>
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">Manual vs Automated (hours/process)</div>
        ${this._stAutoComparison.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
            <span style="color:#ccc;width:90px">${c.process}</span>
            <span style="color:#f84;width:30px;text-align:right">${c.manual}h</span>
            <span style="color:#888;width:15px;text-align:center">\u2192</span>
            <span style="color:#4caf50;width:30px;text-align:right">${c.automated}h</span>
            <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
              <div style="height:100%;width:${c.reduction}%;background:#48f"></div>
            </div>
            <span style="color:#888;width:30px;text-align:right">-${c.reduction}%</span>
          </div>`)}
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">Next Automation Candidates</div>
        ${this._stAutoCandidates.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <span style="color:${c.priority === "High" ? "#f44" : c.priority === "Medium" ? "#f84" : "#888"};font-weight:bold;width:40px">${c.priority}</span>
            <span style="color:#ccc;flex:1">${c.task}</span>
            <span style="color:#888">${c.savings}</span>
          </div>`)}
      </div>`;
  }

  // Round 17 initialization
  private stInitRound17() {
    this.stInitRiskQuant();
    this.stInitSecProgram();
    this.stInitThirdParty();
    this.stInitDLP();
    this.stInitAutomation();
  }

  private stRenderRound17() {
    return html`${this.stRenderRiskQuant()}${this.stRenderSecProgram()}${this.stRenderThirdParty()}${this.stRenderDLP()}${this.stRenderAutomation()}`;
  }

  // === Identity & Access Intelligence Module ===
  private _privilegedAccessInventory: Array<{id: string; identity: string; accountType: string; system: string; privilegeLevel: string; lastUsed: string; usageFrequency: string; riskScore: number; certificationStatus: string; sessionCount: number; avgSessionDuration: string}> = [];
  private _accessCertCampaigns: Array<{id: string; name: string; scope: string; totalReviews: number; completed: number; pending: number; overdue: number; deadline: string; owner: string; status: string}> = [];
  private _roleMiningSuggestions: Array<{suggestionId: string; roleName: string; description: string; memberCount: number; permissionCount: number; similarity: number; recommendation: string}> = [];
  private _sodViolations: Array<{violationId: string; user: string; conflictingRoles: string[]; system: string; riskLevel: string; detectedAt: string; status: string; remediation: string}> = [];
  private _accessAnomalies: Array<{anomalyId: string; user: string; behavior: string; baseline: string; observed: string; deviation: string; riskScore: number; timestamp: string; investigated: boolean}> = [];
  private _identityRiskScores: Array<{userId: string; name: string; department: string; riskScore: number; factors: string[]; lastAssessment: string; trend: string}> = [];

  private _initIdentityAccessIntel(): void {
    this._privilegedAccessInventory = [
      {id: 'pa-001', identity: 'admin-john', accountType: 'domain-admin', system: 'Active Directory', privilegeLevel: 'full', lastUsed: '2024-12-16T07:30:00Z', usageFrequency: 'daily', riskScore: 9.2, certificationStatus: 'current', sessionCount: 156, avgSessionDuration: '2.3 hrs'},
      {id: 'pa-002', identity: 'svc-deploy-bot', accountType: 'service-account', system: 'Kubernetes', privilegeLevel: 'cluster-admin', lastUsed: '2024-12-16T06:15:00Z', usageFrequency: 'hourly', riskScore: 8.7, certificationStatus: 'expired', sessionCount: 8923, avgSessionDuration: '0.1 hrs'},
      {id: 'pa-003', identity: 'dba-sarah', accountType: 'database-admin', system: 'Oracle RAC', privilegeLevel: 'sysdba', lastUsed: '2024-12-15T22:00:00Z', usageFrequency: 'weekly', riskScore: 7.8, certificationStatus: 'current', sessionCount: 45, avgSessionDuration: '1.5 hrs'},
      {id: 'pa-004', identity: 'root-prod-web', accountType: 'shared-root', system: 'Linux (prod)', privilegeLevel: 'root', lastUsed: '2024-12-14T03:00:00Z', usageFrequency: 'monthly', riskScore: 9.5, certificationStatus: 'overdue', sessionCount: 12, avgSessionDuration: '0.5 hrs'},
      {id: 'pa-005', identity: 'api-gateway-key', accountType: 'api-key', system: 'API Gateway', privilegeLevel: 'admin', lastUsed: '2024-12-16T08:00:00Z', usageFrequency: 'continuous', riskScore: 6.3, certificationStatus: 'current', sessionCount: 45000, avgSessionDuration: 'N/A'},
      {id: 'pa-006', identity: 'cloud-admin-alice', accountType: 'cloud-admin', system: 'AWS', privilegeLevel: 'full', lastUsed: '2024-12-16T09:00:00Z', usageFrequency: 'daily', riskScore: 8.9, certificationStatus: 'current', sessionCount: 234, avgSessionDuration: '3.1 hrs'},
    ];
    this._accessCertCampaigns = [
      {id: 'cert-001', name: 'Q4 2024 Privileged Access Review', scope: 'All Domain Admins', totalReviews: 24, completed: 15, pending: 7, overdue: 2, deadline: '2024-12-20', owner: 'IAM Team', status: 'in-progress'},
      {id: 'cert-002', name: 'Annual Service Account Cleanup', scope: 'All Service Accounts', totalReviews: 156, completed: 89, pending: 45, overdue: 22, deadline: '2024-12-31', owner: 'Platform Team', status: 'in-progress'},
      {id: 'cert-003', name: 'Cloud IAM Permissions Audit', scope: 'AWS/Azure/GCP Admins', totalReviews: 42, completed: 42, pending: 0, overdue: 0, deadline: '2024-12-15', owner: 'Cloud Security', status: 'completed'},
      {id: 'cert-004', name: 'Database Admin Access Review', scope: 'All DBA Accounts', totalReviews: 18, completed: 12, pending: 4, overdue: 2, deadline: '2024-12-18', owner: 'DBA Team', status: 'in-progress'},
    ];
    this._roleMiningSuggestions = [
      {suggestionId: 'rm-001', roleName: 'Junior Developer', description: 'Users with identical read-only access to dev repos and staging environments', memberCount: 15, permissionCount: 8, similarity: 0.94, recommendation: 'Create formal role to reduce permission sprawl'},
      {suggestionId: 'rm-002', roleName: 'Finance Read-Only', description: 'Finance team members with identical read access to financial systems', memberCount: 22, permissionCount: 12, similarity: 0.91, recommendation: 'Consolidate into single role with MFA requirement'},
      {suggestionId: 'rm-003', roleName: 'Contractor Limited', description: 'Contractors with similar restricted access patterns', memberCount: 8, permissionCount: 5, similarity: 0.88, recommendation: 'Create time-limited role with auto-expiration'},
      {suggestionId: 'rm-004', roleName: 'Incident Responder', description: 'Security team members with overlapping IR tool access', memberCount: 6, permissionCount: 15, similarity: 0.85, recommendation: 'Formalize IR role with just-in-time elevation'},
    ];
    this._sodViolations = [
      {violationId: 'sod-001', user: 'john.smith', conflictingRoles: ['procurement-approver', 'vendor-admin'], system: 'ERP', riskLevel: 'high', detectedAt: '2024-12-10T14:00:00Z', status: 'remediation-in-progress', remediation: 'Remove vendor-admin role, assign to separate user'},
      {violationId: 'sod-002', user: 'jane.doe', conflictingRoles: ['code-reviewer', 'deploy-approver'], system: 'CI/CD', riskLevel: 'medium', detectedAt: '2024-12-08T09:30:00Z', status: 'accepted-risk', remediation: 'Documented exception - team size constraint'},
      {violationId: 'sod-003', user: 'bob.wilson', conflictingRoles: ['auditor', 'sysadmin'], system: 'Active Directory', riskLevel: 'critical', detectedAt: '2024-12-05T11:00:00Z', status: 'remediated', remediation: 'Removed sysadmin role, assigned to IT ops'},
    ];
    this._accessAnomalies = [
      {anomalyId: 'anom-001', user: 'alice.johnson', behavior: 'Off-hours VPN access from unusual location', baseline: 'Business hours, office IP', observed: '03:00 AM, foreign IP (Russia)', deviation: 'High', riskScore: 8.9, timestamp: '2024-12-16T03:00:00Z', investigated: false},
      {anomalyId: 'anom-002', user: 'charlie.brown', behavior: 'Mass file download from SharePoint', baseline: '50 files/day avg', observed: '2,340 files in 1 hour', deviation: 'Extreme', riskScore: 9.5, timestamp: '2024-12-15T14:30:00Z', investigated: true},
      {anomalyId: 'anom-003', user: 'diana.ross', behavior: 'Privilege escalation attempt on production DB', baseline: 'Read-only queries', observed: 'GRANT statement execution', deviation: 'Critical', riskScore: 10.0, timestamp: '2024-12-15T16:00:00Z', investigated: true},
      {anomalyId: 'anom-004', user: 'eve.davis', behavior: 'Multiple failed MFA attempts followed by success', baseline: '<3 failures/month', observed: '12 failures then success', deviation: 'High', riskScore: 7.8, timestamp: '2024-12-14T22:15:00Z', investigated: false},
      {anomalyId: 'anom-005', user: 'frank.miller', behavior: 'Access to sensitive folder never accessed before', baseline: 'No access in 2 years', observed: 'Full folder browse + download', deviation: 'Medium', riskScore: 6.5, timestamp: '2024-12-14T10:00:00Z', investigated: false},
    ];
    this._identityRiskScores = [
      {userId: 'usr-001', name: 'Alice Johnson', department: 'Engineering', riskScore: 8.9, factors: ['Off-hours access', 'Unusual location', 'New device'], lastAssessment: '2024-12-16', trend: 'increasing'},
      {userId: 'usr-002', name: 'Charlie Brown', department: 'Marketing', riskScore: 9.5, factors: ['Mass download', 'Data exfiltration indicator', 'Policy violation'], lastAssessment: '2024-12-15', trend: 'increasing'},
      {userId: 'usr-003', name: 'Diana Ross', department: 'DBA Team', riskScore: 10.0, factors: ['Privilege escalation', 'Unauthorized access attempt', 'Critical system'], lastAssessment: '2024-12-15', trend: 'critical'},
      {userId: 'usr-004', name: 'Bob Wilson', department: 'IT Ops', riskScore: 3.2, factors: ['SOD violation (remediated)'], lastAssessment: '2024-12-05', trend: 'stable'},
      {userId: 'usr-005', name: 'Eve Davis', department: 'Sales', riskScore: 7.8, factors: ['MFA fatigue attack indicator', 'Credential stuffing pattern'], lastAssessment: '2024-12-14', trend: 'increasing'},
      {userId: 'usr-006', name: 'Frank Miller', department: 'HR', riskScore: 6.5, factors: ['Access to sensitive data', 'First-time access pattern'], lastAssessment: '2024-12-14', trend: 'stable'},
    ];
  }

  private _renderPrivilegedAccess(): ReturnType<typeof html> {
    return html`
      <div class="privileged-access-section">
        <div class="section-header">
          <h4>Privileged Access Inventory</h4>
          <span class="badge warning">${this._privilegedAccessInventory.filter(p => p.certificationStatus !== 'current').length} Need Review</span>
        </div>
        <div class="pa-grid">
          ${this._privilegedAccessInventory.sort((a, b) => b.riskScore - a.riskScore).map(p => html`
            <div class="pa-card cert-${p.certificationStatus}">
              <div class="pa-header">
                <span class="pa-identity">${p.identity}</span>
                <span class="pa-risk">${p.riskScore.toFixed(1)}</span>
              </div>
              <div class="pa-details">
                <span>Type: ${p.accountType}</span>
                <span>System: ${p.system}</span>
                <span>Level: ${p.privilegeLevel}</span>
              </div>
              <div class="pa-usage">
                <span>Last: ${p.lastUsed}</span>
                <span>Freq: ${p.usageFrequency}</span>
                <span>Sessions: ${p.sessionCount}</span>
              </div>
              <div class="pa-cert">
                <span class="cert-status ${p.certificationStatus}">${p.certificationStatus}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderCertCampaigns(): ReturnType<typeof html> {
    return html`
      <div class="cert-campaigns-section">
        <div class="section-header">
          <h4>Access Certification Campaigns</h4>
        </div>
        <div class="campaigns-list">
          ${this._accessCertCampaigns.map(c => html`
            <div class="campaign-card status-${c.status}">
              <div class="campaign-header">
                <span class="campaign-name">${c.name}</span>
                <span class="campaign-status">${c.status}</span>
              </div>
              <div class="campaign-progress">
                <div class="progress-bar"><div class="progress-fill" style="width: ${(c.completed / c.totalReviews * 100).toFixed(0)}%"></div></div>
                <span class="progress-text">${c.completed}/${c.totalReviews} reviews</span>
              </div>
              <div class="campaign-details">
                <span>Scope: ${c.scope}</span>
                <span>Pending: ${c.pending}</span>
                <span>Overdue: ${c.overdue}</span>
                <span>Deadline: ${c.deadline}</span>
                <span>Owner: ${c.owner}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderRoleMining(): ReturnType<typeof html> {
    return html`
      <div class="role-mining-section">
        <div class="section-header">
          <h4>Role Mining Suggestions</h4>
        </div>
        <div class="mining-grid">
          ${this._roleMiningSuggestions.sort((a, b) => b.similarity - a.similarity).map(r => html`
            <div class="mining-card">
              <div class="mining-header">
                <span class="mining-role">${r.roleName}</span>
                <span class="mining-similarity">${(r.similarity * 100).toFixed(0)}% match</span>
              </div>
              <p class="mining-desc">${r.description}</p>
              <div class="mining-stats">
                <span>Members: ${r.memberCount}</span>
                <span>Permissions: ${r.permissionCount}</span>
              </div>
              <div class="mining-recommendation">${r.recommendation}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderSodViolations(): ReturnType<typeof html> {
    return html`
      <div class="sod-violations-section">
        <div class="section-header">
          <h4>Separation of Duties Violations</h4>
        </div>
        <div class="sod-list">
          ${this._sodViolations.sort((a, b) => {
            const order = {critical: 0, high: 1, medium: 2};
            return (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3);
          }).map(v => html`
            <div class="sod-card risk-${v.riskLevel}">
              <div class="sod-header">
                <span class="sod-user">${v.user}</span>
                <span class="sod-risk">${v.riskLevel}</span>
                <span class="sod-status">${v.status}</span>
              </div>
              <div class="sod-details">
                <span>System: ${v.system}</span>
                <span>Conflicting: ${v.conflictingRoles.join(' + ')}</span>
                <span>Detected: ${v.detectedAt}</span>
              </div>
              <div class="sod-remediation">${v.remediation}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderAccessAnomalies(): ReturnType<typeof html> {
    return html`
      <div class="access-anomalies-section">
        <div class="section-header">
          <h4>Access Pattern Anomalies</h4>
          <span class="badge warning">${this._accessAnomalies.filter(a => !a.investigated).length} Uninvestigated</span>
        </div>
        <div class="anomaly-list">
          ${this._accessAnomalies.sort((a, b) => b.riskScore - a.riskScore).map(a => html`
            <div class="anomaly-card ${a.investigated ? 'investigated' : 'pending'}">
              <div class="anomaly-header">
                <span class="anomaly-user">${a.user}</span>
                <span class="anomaly-risk">${a.riskScore.toFixed(1)}</span>
                <span class="anomaly-status">${a.investigated ? 'Investigated' : 'Pending'}</span>
              </div>
              <p class="anomaly-behavior">${a.behavior}</p>
              <div class="anomaly-comparison">
                <span>Baseline: ${a.baseline}</span>
                <span>Observed: ${a.observed}</span>
                <span>Deviation: ${a.deviation}</span>
              </div>
              <div class="anomaly-time">${a.timestamp}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderIdentityRiskScores(): ReturnType<typeof html> {
    return html`
      <div class="identity-risk-section">
        <div class="section-header">
          <h4>Identity Risk Scoring</h4>
        </div>
        <div class="risk-grid">
          ${this._identityRiskScores.sort((a, b) => b.riskScore - a.riskScore).map(u => html`
            <div class="risk-card trend-${u.trend}">
              <div class="risk-header">
                <span class="risk-name">${u.name}</span>
                <span class="risk-score">${u.riskScore.toFixed(1)}</span>
                <span class="risk-trend ${u.trend}">${u.trend === 'increasing' ? '\u2191' : u.trend === 'critical' ? '\u26A0' : '\u2192'}</span>
              </div>
              <div class="risk-details">
                <span>Department: ${u.department}</span>
                <span>Last Assessment: ${u.lastAssessment}</span>
              </div>
              <div class="risk-factors">
                ${u.factors.map(f => html`<span class="factor-tag">${f}</span>`)}
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  // === Security Risk Dashboard Block ===
  @state() private _securityTimeRiskTopTen: Array<{id:string;name:string;score:number;trend:string;owner:string;category:string;lastAssessed:string}> = [
    {id:"R001",name:"Unpatched Critical CVEs",score:95,trend:"up",owner:"IT Ops",category:"Vulnerability",lastAssessed:"2026-04-22"},
    {id:"R002",name:"Misconfigured Cloud Storage",score:92,trend:"up",owner:"Cloud Team",category:"Configuration",lastAssessed:"2026-04-21"},
    {id:"R003",name:"Overprivileged Service Accounts",score:88,trend:"stable",owner:"IAM Team",category:"Identity",lastAssessed:"2026-04-20"},
    {id:"R004",name:"Legacy TLS Dependencies",score:85,trend:"down",owner:"Network",category:"Encryption",lastAssessed:"2026-04-19"},
    {id:"R005",name:"Third-Party API Key Exposure",score:83,trend:"up",owner:"DevOps",category:"Data Loss",lastAssessed:"2026-04-22"},
    {id:"R006",name:"Inadequate Network Segmentation",score:80,trend:"stable",owner:"Network",category:"Network",lastAssessed:"2026-04-18"},
    {id:"R007",name:"Missing MFA on Admin Portals",score:78,trend:"down",owner:"Security",category:"Authentication",lastAssessed:"2026-04-17"},
    {id:"R008",name:"Outdated Endpoint Protection",score:75,trend:"stable",owner:"Endpoint",category:"Endpoint",lastAssessed:"2026-04-16"},
    {id:"R009",name:"Insufficient Logging Coverage",score:72,trend:"up",owner:"SOC",category:"Monitoring",lastAssessed:"2026-04-15"},
    {id:"R010",name:"Shadow IT SaaS Applications",score:70,trend:"stable",owner:"GRC",category:"Governance",lastAssessed:"2026-04-14"},
  ];
  @state() private _securityTimeRiskCategories: Array<{category:string;count:number;avgScore:number;color:string}> = [
    {category:"Vulnerability",count:47,avgScore:82,color:"#ef4444"},
    {category:"Configuration",count:32,avgScore:75,color:"#f97316"},
    {category:"Identity",count:28,avgScore:71,color:"#eab308"},
    {category:"Network",count:24,avgScore:68,color:"#22c55e"},
    {category:"Data Loss",count:19,avgScore:65,color:"#3b82f6"},
    {category:"Encryption",count:15,avgScore:62,color:"#8b5cf6"},
  ];
  @state() private _securityTimeRiskVelocity: Array<{week:string;newRisks:number;closedRisks:number;netChange:number}> = [
    {week:"W15",newRisks:12,closedRisks:8,netChange:4},
    {week:"W16",newRisks:15,closedRisks:11,netChange:4},
    {week:"W17",newRisks:9,closedRisks:14,netChange:-5},
    {week:"W18",newRisks:18,closedRisks:10,netChange:8},
    {week:"W19",newRisks:7,closedRisks:16,netChange:-9},
    {week:"W20",newRisks:11,closedRisks:13,netChange:-2},
    {week:"W21",newRisks:14,closedRisks:9,netChange:5},
  ];
  @state() private _securityTimeRiskAppetite: {current:number;threshold:number;maxTolerated:number;status:string} = {
    current: 68, threshold: 55, maxTolerated: 80, status: 'Warning'
  };
  @state() private _securityTimeRiskOwnerMatrix: Array<{owner:string;criticalCount:number;highCount:number;mediumCount:number;complianceRate:number}> = [
    {owner:"IT Ops",criticalCount:5,highCount:12,mediumCount:23,complianceRate:0.72},
    {owner:"Cloud Team",criticalCount:3,highCount:9,mediumCount:18,complianceRate:0.81},
    {owner:"IAM Team",criticalCount:2,highCount:7,mediumCount:14,complianceRate:0.88},
    {owner:"Network",criticalCount:4,highCount:11,mediumCount:20,complianceRate:0.76},
    {owner:"DevOps",criticalCount:3,highCount:8,mediumCount:16,complianceRate:0.83},
    {owner:"Security",criticalCount:1,highCount:5,mediumCount:12,complianceRate:0.91},
  ];
  private _renderSecuritytimeRiskDash(): TemplateResult {
    const riskItems = this._securityTimeRiskTopTen;
    const velocity = this._securityTimeRiskVelocity;
    const appetite = this._securityTimeRiskAppetite;
    return html`
      <div class="risk-dash-section" style="margin-top:16px;padding:16px;border:1px solid #334155;border-radius:8px;background:#0f172a;">
        <h4 style="color:#f1f5f9;margin:0 0 12px 0;font-size:14px;">Security Risk Dashboard</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="background:#1e293b;border-radius:6px;padding:12px;">
            <h5 style="color:#94a3b8;margin:0 0 8px 0;font-size:12px;">Top 10 Risks</h5>
            ${riskItems.slice(0, 5).map(r => html`
              <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #334155;">
                <span style="color:#e2e8f0;font-size:11px;">${r.name}</span>
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="color:${r.trend === "up" ? "#ef4444" : r.trend === "down" ? "#22c55e" : "#eab308"};font-size:10px;">
                    ${r.trend === "up" ? "\u2191" : r.trend === "down" ? "\u2193" : "\u2192"}
                  </span>
                  <span style="color:#f87171;font-size:11px;font-weight:bold;">${r.score}</span>
                </div>
              </div>
            `)}
          </div>
          <div style="background:#1e293b;border-radius:6px;padding:12px;">
            <h5 style="color:#94a3b8;margin:0 0 8px 0;font-size:12px;">Risk Velocity (Weekly)</h5>
            ${velocity.map(v => html`
              <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;">
                <span style="color:#cbd5e1;">${v.week}</span>
                <span style="color:${v.netChange > 0 ? "#f87171" : "#4ade80"};">${v.netChange > 0 ? "+" : ""}${v.netChange}</span>
              </div>
            `)}
          </div>
        </div>
        <div style="margin-top:12px;background:#1e293b;border-radius:6px;padding:12px;">
          <h5 style="color:#94a3b8;margin:0 0 8px 0;font-size:12px;">Risk Appetite Gauge</h5>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:8px;background:#334155;border-radius:4px;position:relative;">
              <div style="height:100%;width:${appetite.current}%;background:${appetite.current > appetite.maxTolerated ? "#ef4444" : appetite.current > appetite.threshold ? "#f97316" : "#22c55e"};border-radius:4px;transition:width 0.3s;"></div>
              <div style="position:absolute;left:${appetite.threshold}%;top:-2px;width:2px;height:12px;background:#eab308;"></div>
              <div style="position:absolute;left:${appetite.maxTolerated}%;top:-2px;width:2px;height:12px;background:#ef4444;"></div>
            </div>
            <span style="color:#e2e8f0;font-size:11px;">${appetite.current}/100</span>
          </div>
        </div>
      </div>
    `;
  }

  // === Security Event Correlation Block ===
  @state() private _securityTimeCorrRules: Array<{id:string;name:string;sources:string[];logic:string;severity:string;active:boolean;lastTriggered:string}> = [
    {id:"CR01",name:"Brute Force Detection",sources:["AD","Firewall","SIEM"],logic:"5 failed logins + firewall block within 10min",severity:"High",active:true,lastTriggered:"2026-04-22T08:30:00Z"},
    {id:"CR02",name:"Data Exfiltration Pattern",sources:["DLP","Proxy","DNS"],logic:"Large upload + DNS tunneling indicators",severity:"Critical",active:true,lastTriggered:"2026-04-21T14:22:00Z"},
    {id:"CR03",name:"Lateral Movement Detection",sources:["EDR","AD","Network"],logic:"New admin session + unusual SMB traffic",severity:"High",active:true,lastTriggered:"2026-04-20T11:15:00Z"},
    {id:"CR04",name:"Malware Beacon Detection",sources:["DNS","Proxy","EDR"],logic:"Periodic DNS queries + known C2 patterns",severity:"Critical",active:true,lastTriggered:"2026-04-22T06:45:00Z"},
  ];
  @state() private _securityTimeEventTimeline: Array<{timestamp:string;source:string;eventType:string;details:string;correlated:boolean}> = [
    {timestamp:"2026-04-22T10:34:12Z",source:"EDR",eventType:"Process Injection",details:"cmd.exe spawned from powershell",correlated:true},
    {timestamp:"2026-04-22T10:33:58Z",source:"AD",eventType:"Anomalous Login",details:"Service account used from new IP",correlated:true},
    {timestamp:"2026-04-22T10:32:01Z",source:"Firewall",eventType:"Port Scan",details:"192.168.1.45 scanning 10.0.0.0/8",correlated:false},
    {timestamp:"2026-04-22T10:30:45Z",source:"DLP",eventType:"Data Transfer",details:"10MB zip uploaded to external share",correlated:true},
    {timestamp:"2026-04-22T10:28:33Z",source:"DNS",eventType:"Suspicious Query",details:"Query to known malicious domain",correlated:true},
  ];
  @state() private _securityTimeFalsePosMetrics: {totalEvents:number;correlatedEvents:number;falsePositives:number;fpRate:number;topFpRules:string[]} = {
    totalEvents: 45230, correlatedEvents: 3847, falsePositives: 892, fpRate: 0.232,
    topFpRules: ["Port Scan Detection", "Anomalous Login Location", "Large File Download"]
  };
  @state() private _securityTimeEventPatterns: Array<{id:string;pattern:string;frequency:number;firstSeen:string;lastSeen:string;status:string}> = [
    {id:"EP01",pattern:"Credential stuffing from Tor exit nodes",frequency:23,firstSeen:"2026-03-15",lastSeen:"2026-04-22",status:"Active"},
    {id:"EP02",pattern:"DNS tunneling via TXT records",frequency:8,firstSeen:"2026-04-01",lastSeen:"2026-04-20",status:"Monitoring"},
    {id:"EP03",pattern:"Scheduled task persistence mechanism",frequency:3,firstSeen:"2026-04-10",lastSeen:"2026-04-18",status:"Investigating"},
  ];
  private _renderSecuritytimeEventCorr(): TemplateResult {
    const rules = this._securityTimeCorrRules;
    const timeline = this._securityTimeEventTimeline;
    const fpMetrics = this._securityTimeFalsePosMetrics;
    return html`
      <div class="event-corr-section" style="margin-top:16px;padding:16px;border:1px solid #334155;border-radius:8px;background:#0f172a;">
        <h4 style="color:#f1f5f9;margin:0 0 12px 0;font-size:14px;">Security Event Correlation</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="background:#1e293b;border-radius:6px;padding:12px;">
            <h5 style="color:#94a3b8;margin:0 0 8px 0;font-size:12px;">Correlation Rules</h5>
            ${rules.map(r => html`
              <div style="padding:4px 0;border-bottom:1px solid #334155;">
                <div style="display:flex;justify-content:space-between;font-size:11px;">
                  <span style="color:#e2e8f0;">${r.name}</span>
                  <span style="color:${r.severity === "Critical" ? "#ef4444" : "#f97316"};font-size:10px;">${r.severity}</span>
                </div>
                <div style="color:#64748b;font-size:10px;">${r.sources.join(" + ")}: ${r.logic}</div>
              </div>
            `)}
          </div>
          <div style="background:#1e293b;border-radius:6px;padding:12px;">
            <h5 style="color:#94a3b8;margin:0 0 8px 0;font-size:12px;">Event Timeline (Recent)</h5>
            ${timeline.map(e => html`
              <div style="display:flex;gap:6px;padding:3px 0;font-size:10px;">
                <span style="color:#64748b;min-width:50px;">${e.timestamp.split("T")[1]?.slice(0,8) || ""}</span>
                <span style="color:${e.correlated ? "#fbbf24" : "#64748b"};font-weight:${e.correlated ? "bold" : "normal"};">${e.eventType}</span>
                <span style="color:#94a3b8;">${e.source}</span>
              </div>
            `)}
            <div style="margin-top:8px;padding-top:6px;border-top:1px solid #334155;display:flex;justify-content:space-between;font-size:10px;">
              <span style="color:#94a3b8;">Total Events: ${fpMetrics.totalEvents.toLocaleString()}</span>
              <span style="color:#f97316;">FP Rate: ${(fpMetrics.fpRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // === Network Segmentation Validator Block ===
  @state() private _securityTimeZones: Array<{id:string;name:string;trustLevel:number;subnet:string;devices:number;policy:string;lastAudit:string}> = [
    {id:"Z01",name:"DMZ",trustLevel:1,subnet:"10.0.1.0/24",devices:23,policy:"Deny All Inbound",lastAudit:"2026-04-20"},
    {id:"Z02",name:"Corporate LAN",trustLevel:3,subnet:"10.0.2.0/22",devices:456,policy:"Allow Internal",lastAudit:"2026-04-18"},
    {id:"Z03",name:"Data Center Core",trustLevel:5,subnet:"10.0.10.0/24",devices:89,policy:"Restricted Access",lastAudit:"2026-04-22"},
    {id:"Z04",name:"IoT Network",trustLevel:1,subnet:"10.0.20.0/24",devices:312,policy:"Deny All Internet",lastAudit:"2026-04-15"},
    {id:"Z05",name:"Development",trustLevel:2,subnet:"10.0.30.0/24",devices:67,policy:"Sandbox Rules",lastAudit:"2026-04-19"},
    {id:"Z06",name:"Management Plane",trustLevel:5,subnet:"10.0.99.0/24",devices:12,policy:"MFA Required",lastAudit:"2026-04-21"},
  ];
  @state() private _securityTimeSegRules: Array<{id:string;source:string;dest:string;action:string;protocol:string;port:string;status:string;hits:number}> = [
    {id:"SR01",source:"DMZ",dest:"Corporate LAN",action:"DENY",protocol:"TCP",port:"*",status:"Active",hits:14523},
    {id:"SR02",source:"Corporate LAN",dest:"Data Center Core",action:"ALLOW",protocol:"TCP",port:"443,8443",status:"Active",hits:89234},
    {id:"SR03",source:"IoT Network",dest:"Internet",action:"DENY",protocol:"*",port:"*",status:"Active",hits:234567},
    {id:"SR04",source:"Development",dest:"Corporate LAN",action:"DENY",protocol:"*",port:"*",status:"Active",hits:789},
    {id:"SR05",source:"Corporate LAN",dest:"Management Plane",action:"ALLOW",protocol:"TCP",port:"22,443",status:"Active",hits:3456},
  ];
  @state() private _securityTimeCrossZoneTraffic: Array<{source:string;dest:string;bytes:number;sessions:number;violations:number}> = [
    {source:"DMZ",dest:"Corporate LAN",bytes:4567890,sessions:234,violations:12},
    {source:"Corporate LAN",dest:"Data Center Core",bytes:123456789,sessions:5678,violations:3},
    {source:"IoT Network",dest:"Corporate LAN",bytes:890123,sessions:89,violations:45},
    {source:"Development",dest:"Internet",bytes:67890123,sessions:3456,violations:0},
  ];
  @state() private _securityTimeMicroSegGaps: Array<{id:string;zone:string;gapType:string;severity:string;recommendation:string}> = [
    {id:"MSG01",zone:"IoT Network",gapType:"Missing East-West Controls",severity:"High",recommendation:"Implement micro-segmentation with service mesh"},
    {id:"MSG02",zone:"Corporate LAN",gapType:"Flat Network Subnet",severity:"Critical",recommendation:"Split into VLANs by department"},
    {id:"MSG03",zone:"Development",gapType:"No Egress Filtering",severity:"Medium",recommendation:"Deploy proxy-based egress controls"},
  ];
  private _renderSecuritytimeNetworkSeg(): TemplateResult {
    const zones = this._securityTimeZones;
    const gaps = this._securityTimeMicroSegGaps;
    return html`
      <div class="network-seg-section" style="margin-top:16px;padding:16px;border:1px solid #334155;border-radius:8px;background:#0f172a;">
        <h4 style="color:#f1f5f9;margin:0 0 12px 0;font-size:14px;">Network Segmentation Validator</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="background:#1e293b;border-radius:6px;padding:12px;">
            <h5 style="color:#94a3b8;margin:0 0 8px 0;font-size:12px;">Security Zones</h5>
            ${zones.map(z => html`
              <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #334155;">
                <div>
                  <span style="color:#e2e8f0;font-size:11px;">${z.name}</span>
                  <span style="color:#64748b;font-size:10px;margin-left:6px;">${z.subnet}</span>
                </div>
                <div style="display:flex;align-items:center;gap:4px;">
                  ${Array.from({length:5}, (_, i) => html`
                    <div style="width:8px;height:8px;border-radius:50%;background:${i < z.trustLevel ? "#f59e0b" : "#334155"};"></div>
                  `)}
                  <span style="color:#94a3b8;font-size:10px;margin-left:4px;">${z.devices}</span>
                </div>
              </div>
            `)}
          </div>
          <div style="background:#1e293b;border-radius:6px;padding:12px;">
            <h5 style="color:#94a3b8;margin:0 0 8px 0;font-size:12px;">Micro-Segmentation Gaps</h5>
            ${gaps.map(g => html`
              <div style="padding:6px 0;border-bottom:1px solid #334155;">
                <div style="display:flex;justify-content:space-between;font-size:11px;">
                  <span style="color:#e2e8f0;">${g.gapType}</span>
                  <span style="color:${g.severity === "Critical" ? "#ef4444" : g.severity === "High" ? "#f97316" : "#eab308"};">${g.severity}</span>
                </div>
                <div style="color:#94a3b8;font-size:10px;margin-top:2px;">${g.zone}: ${g.recommendation}</div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  // === Cloud Workload Protection Block ===
  @state() private _securityTimeContainerScans: Array<{image:string;registry:string;critical:number;high:number;medium:number;scanDate:string;status:string}> = [
    {image:"nginx:1.25",registry:"docker.io",critical:2,high:5,medium:12,scanDate:"2026-04-22",status:"Vulnerable"},
    {image:"postgres:16",registry:"ghcr.io",critical:0,high:1,medium:3,scanDate:"2026-04-22",status:"Clean"},
    {image:"redis:7.2",registry:"docker.io",critical:1,high:3,medium:8,scanDate:"2026-04-21",status:"Vulnerable"},
    {image:"app-server:v2.3",registry:"ecr.aws",critical:0,high:0,medium:2,scanDate:"2026-04-22",status:"Clean"},
    {image:"sidecar-proxy:v1.8",registry:"gcr.io",critical:3,high:7,medium:15,scanDate:"2026-04-20",status:"Critical"},
  ];
  @state() private _securityTimeK8sPods: Array<{namespace:string;pod:string;securityContext:string;hostIPC:boolean;hostPID:boolean;privileged:boolean;riskLevel:string}> = [
    {namespace:"production",pod:"web-frontend-7d9f8",securityContext:"Restricted",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Low"},
    {namespace:"production",pod:"api-gateway-4b2c1",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
    {namespace:"staging",pod:"db-migrator-x8k3m",securityContext:"Privileged",hostIPC:true,hostPID:false,privileged:true,riskLevel:"Critical"},
    {namespace:"monitoring",pod:"prometheus-q7r2p",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
  ];
  @state() private _securityTimeServerlessRisk: Array<{function:string;runtime:string;timeout:number;iamPerms:string;externalCalls:number;riskScore:number}> = [
    {function:"processPayment",runtime:"nodejs20.x",timeout:30,iamPerms:"dynamodb:*",externalCalls:3,riskScore:78},
    {function:"sendNotification",runtime:"python3.12",timeout:15,iamPerms:"sns:Publish",externalCalls:1,riskScore:25},
    {function:"imageResizer",runtime:"python3.12",timeout:60,iamPerms:"s3:*",externalCalls:0,riskScore:45},
    {function:"authValidator",runtime:"go1.x",timeout:10,iamPerms:"cognito-idp:*",externalCalls:2,riskScore:62},
  ];
  @state() private _securityTimeRuntimeAlerts: Array<{id:string;workload:string;alertType:string;severity:string;description:string;timestamp:string}> = [
    {id:"RTA01",workload:"db-migrator-x8k3m",alertType:"Privilege Escalation",severity:"Critical",description:"Container attempted to access /etc/shadow",timestamp:"2026-04-22T10:34:00Z"},
    {id:"RTA02",workload:"web-frontend-7d9f8",alertType:"Anomalous Outbound",severity:"High",description:"Unexpected DNS query to known C2 domain",timestamp:"2026-04-22T09:12:00Z"},
    {id:"RTA03",workload:"sidecar-proxy:v1.8",alertType:"Crypto Mining",severity:"Critical",description:"CPU utilization exceeded 95% for 30 minutes",timestamp:"2026-04-21T23:45:00Z"},
  ];
  private _renderSecuritytimeCloudWl(): TemplateResult {
    const containers = this._securityTimeContainerScans;
    const pods = this._securityTimeK8sPods;
    const alerts = this._securityTimeRuntimeAlerts;
    return html`
      <div class="cloud-wl-section" style="margin-top:16px;padding:16px;border:1px solid #334155;border-radius:8px;background:#0f172a;">
        <h4 style="color:#f1f5f9;margin:0 0 12px 0;font-size:14px;">Cloud Workload Protection</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="background:#1e293b;border-radius:6px;padding:12px;">
            <h5 style="color:#94a3b8;margin:0 0 8px 0;font-size:12px;">Container Scan Results</h5>
            ${containers.map(c => html`
              <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #334155;font-size:11px;">
                <span style="color:#e2e8f0;">${c.image}</span>
                <div style="display:flex;gap:8px;">
                  <span style="color:#ef4444;">${c.critical}C</span>
                  <span style="color:#f97316;">${c.high}H</span>
                  <span style="color:#eab308;">${c.medium}M</span>
                </div>
              </div>
            `)}
          </div>
          <div style="background:#1e293b;border-radius:6px;padding:12px;">
            <h5 style="color:#94a3b8;margin:0 0 8px 0;font-size:12px;">Runtime Threat Alerts</h5>
            ${alerts.map(a => html`
              <div style="padding:4px 0;border-bottom:1px solid #334155;">
                <div style="display:flex;justify-content:space-between;font-size:11px;">
                  <span style="color:#e2e8f0;">${a.alertType}</span>
                  <span style="color:${a.severity === "Critical" ? "#ef4444" : "#f97316"};">${a.severity}</span>
                </div>
                <div style="color:#94a3b8;font-size:10px;">${a.workload}: ${a.description}</div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }
  // Security Maturity Assessment Module
  private _renderSecurityMaturityAssessment() {
    const cmmcLevels = [
      { level: 1, name: 'Initial', practices: 18, implemented: 4, color: '#ef4444' },
      { level: 2, name: 'Managed', practices: 18, implemented: 9, color: '#f97316' },
      { level: 3, name: 'Defined', practices: 18, implemented: 14, color: '#eab308' },
      { level: 4, name: 'Measured', practices: 18, implemented: 16, color: '#22c55e' },
      { level: 5, name: 'Optimized', practices: 18, implemented: 18, color: '#3b82f6' },
    ];
    const currentLevel = cmmcLevels[2];
    const nistFunctions = [
      { id: 'GV', name: 'Govern', maturity: 3.2, target: 4.0, trend: 'up' },
      { id: 'ID', name: 'Identify', maturity: 3.5, target: 4.0, trend: 'up' },
      { id: 'PR', name: 'Protect', maturity: 3.8, target: 4.5, trend: 'stable' },
      { id: 'DE', name: 'Detect', maturity: 2.9, target: 4.0, trend: 'up' },
      { id: 'RS', name: 'Respond', maturity: 3.1, target: 4.0, trend: 'down' },
      { id: 'RC', name: 'Recover', maturity: 2.7, target: 3.5, trend: 'stable' },
    ];
    const peerComparison = [
      { peer: 'Industry Average', score: 3.1 },
      { peer: 'Sector Median', score: 3.4 },
      { peer: 'Top Quartile', score: 4.2 },
      { peer: 'Your Org', score: 3.2, highlight: true },
    ];
    const milestones = [
      { q: 'Q1 2026', target: 'ID.RA-1 complete', status: 'done' },
      { q: 'Q2 2026', target: 'PR.AC-3 enhanced', status: 'in-progress' },
      { q: 'Q3 2026', target: 'DE.CM-1 automation', status: 'planned' },
      { q: 'Q4 2026', target: 'RS.RP-1 playbooks', status: 'planned' },
    ];
    const trendData = [2.1, 2.3, 2.5, 2.6, 2.8, 2.9, 3.0, 3.1, 3.1, 3.2, 3.2, 3.2];
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    const gapAnalysis = nistFunctions.map(f => ({
      ...f,
      gap: Math.round((f.target - f.maturity) * 10) / 10,
      gapPct: Math.round(((f.target - f.maturity) / f.target) * 100),
    }));
    return html`
      <section class="maturity-assessment">
        <h4>Security Maturity Assessment</h4>
        <div class="maturity-grid">
          <div class="maturity-cmmc">
            <h5>CMMC Level Assessment</h5>
            <div class="cmmc-levels">
              ${cmmcLevels.map(l => {
                const pct = Math.round((l.implemented / l.practices) * 100);
                return html`
                  <div class="cmmc-level-card" style="border-color:${l.color}">
                    <div class="cmmc-level-num" style="background:${l.color}">L${l.level}</div>
                    <div class="cmmc-level-name">${l.name}</div>
                    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${l.color}"></div></div>
                    <span>${l.implemented}/${l.practices} practices</span>
                  </div>`;
              }).join('')}
            </div>
            <div class="current-level-badge">Current: Level ${currentLevel.level} - ${currentLevel.name}</div>
          </div>
          <div class="maturity-nist">
            <h5>NIST CSF 2.0 Maturity Scoring</h5>
            <table class="maturity-table">
              <thead><tr><th>Function</th><th>Current</th><th>Target</th><th>Gap</th><th>Trend</th></tr></thead>
              <tbody>
                ${nistFunctions.map(f => html`
                  <tr>
                    <td><strong>${f.id}</strong> ${f.name}</td>
                    <td>${f.maturity}</td>
                    <td>${f.target}</td>
                    <td style="color:${f.maturity >= f.target ? '#10b981' : '#ef4444'}">${(f.target - f.maturity).toFixed(1)}</td>
                    <td class="trend-${f.trend}">${f.trend === 'up' ? '\u2191' : f.trend === 'down' ? '\u2193' : '\u2192'}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="maturity-peers">
            <h5>Peer Maturity Comparison</h5>
            <div class="peer-bars">
              ${peerComparison.map(p => html`
                <div class="peer-row ${p.highlight ? 'highlight' : ''}">
                  <span class="peer-label">${p.peer}</span>
                  <div class="progress-bar"><div class="progress-fill" style="width:${(p.score / 5) * 100}%;background:${p.highlight ? '#3b82f6' : '#6b7280'}"></div></div>
                  <span>${p.score}</span>
                </div>`).join('')}
            </div>
          </div>
          <div class="maturity-trend">
            <h5>12-Month Maturity Trend</h5>
            <div class="trend-chart">
              ${trendData.map((v, i) => html`
                <div class="trend-bar" style="height:${(v / 5) * 100}%" title="${months[i]}: ${v}">
                  <span class="trend-val">${v}</span>
                </div>`).join('')}
              ${months.map(m => html`<span class="trend-label">${m}</span>`).join('')}
            </div>
          </div>
          <div class="maturity-roadmap">
            <h5>Improvement Roadmap</h5>
            <div class="roadmap-timeline">
              ${milestones.map(m => html`
                <div class="roadmap-item status-${m.status}">
                  <div class="roadmap-q">${m.q}</div>
                  <div class="roadmap-target">${m.target}</div>
                  <div class="roadmap-status">${m.status.replace('-', ' ')}</div>
                </div>`).join('')}
            </div>
          </div>
          <div class="maturity-gaps">
            <h5>Gap-to-Target Analysis</h5>
            <div class="gap-list">
              ${gapAnalysis.map(g => html`
                <div class="gap-item">
                  <span class="gap-fn">${g.id} ${g.name}</span>
                  <div class="gap-bar"><div class="gap-fill" style="width:${g.gapPct}%;background:${g.gapPct > 20 ? '#ef4444' : '#f97316'}"></div></div>
                  <span class="gap-val">${g.gap} gap</span>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </section>`;
  }


  // Threat Scenario Modeling Module
  private _renderThreatScenarioModeling() {
    const scenarios = [
      { id: 'TS-001', name: 'Ransomware Double Extortion', probability: 0.72, impact: 9.2, defense: 0.65, status: 'drilled' },
      { id: 'TS-002', name: 'Supply Chain Compromise', probability: 0.45, impact: 8.8, defense: 0.42, status: 'planned' },
      { id: 'TS-003', name: 'Insider Data Exfiltration', probability: 0.58, impact: 7.5, defense: 0.71, status: 'drilled' },
      { id: 'TS-004', name: 'Cloud Misconfiguration', probability: 0.81, impact: 6.9, defense: 0.58, status: 'active' },
      { id: 'TS-005', name: 'Zero-Day Exploit Chain', probability: 0.23, impact: 9.8, defense: 0.35, status: 'planned' },
      { id: 'TS-006', name: 'Credential Stuffing Campaign', probability: 0.67, impact: 5.4, defense: 0.82, status: 'drilled' },
      { id: 'TS-007', name: 'DNS Tunneling C2', probability: 0.34, impact: 7.1, defense: 0.55, status: 'planned' },
      { id: 'TS-008', name: 'Social Engineering Phishing', probability: 0.76, impact: 6.2, defense: 0.73, status: 'active' },
    ];
    const matrixCells = scenarios.map(s => ({
      ...s,
      risk: Math.round(s.probability * s.impact * 10) / 10,
    }));
    const playbookSteps = [
      { step: 1, action: 'Initial Detection', owner: 'SOC L1', sla: '15 min' },
      { step: 2, action: 'Threat Triage', owner: 'SOC L2', sla: '30 min' },
      { step: 3, action: 'Containment', owner: 'IR Lead', sla: '2 hours' },
      { step: 4, action: 'Eradication', owner: 'Forensics', sla: '8 hours' },
      { step: 5, action: 'Recovery', owner: 'IT Ops', sla: '24 hours' },
      { step: 6, action: 'Post-Incident Review', owner: 'CISO', sla: '72 hours' },
    ];
    const drillSchedule = [
      { scenario: 'TS-001', date: '2026-05-15', type: 'Tabletop', participants: 12 },
      { scenario: 'TS-003', date: '2026-06-20', type: 'Live Fire', participants: 8 },
      { scenario: 'TS-005', date: '2026-07-10', type: 'Tabletop', participants: 15 },
      { scenario: 'TS-008', date: '2026-08-05', type: 'Simulation', participants: 20 },
    ];
    const aarTemplate = {
      scenario: 'TS-001', date: '2026-03-20',
      objectives: ['Validate containment', 'Test comms', 'Measure MTTR'],
      findings: ['Detection delayed 8 min', 'SOC-IT gap', 'Backup OK'],
      improvements: ['Tune SIEM rules', 'Update IR contacts', 'Auto-contain'],
      score: 7.2,
    };
    const evolution = [
      { scenario: 'TS-001', v1: 'Basic ransomware', v2: 'Double extortion + lateral', v3: 'Custom payload' },
      { scenario: 'TS-004', v1: 'Open S3 bucket', v2: 'IAM misconfig chain', v3: 'Multi-cloud priv esc' },
    ];
    return html`
      <section class="threat-scenario-modeling">
        <h4>Threat Scenario Modeling</h4>
        <div class="scenario-grid">
          <div class="scenario-matrix">
            <h5>Probability x Impact Matrix</h5>
            <table class="scenario-table">
              <thead><tr><th>ID</th><th>Scenario</th><th>Prob</th><th>Impact</th><th>Risk</th><th>Defense</th><th>Status</th></tr></thead>
              <tbody>
                ${matrixCells.map(s => {
                  const riskColor = s.risk > 6 ? '#ef4444' : s.risk > 4 ? '#f97316' : '#22c55e';
                  return html`
                    <tr>
                      <td>${s.id}</td>
                      <td>${s.name}</td>
                      <td>${(s.probability * 100).toFixed(0)}%</td>
                      <td>${s.impact}</td>
                      <td style="color:${riskColor};font-weight:bold">${s.risk}</td>
                      <td>
                        <div class="mini-bar"><div class="mini-fill" style="width:${s.defense * 100}%;background:${s.defense > 0.7 ? '#22c55e' : s.defense > 0.5 ? '#f97316' : '#ef4444'}"></div></div>
                        ${(s.defense * 100).toFixed(0)}%
                      </td>
                      <td class="status-${s.status}">${s.status}</td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div class="scenario-playbook">
            <h5>Attack Scenario Playbook</h5>
            <div class="playbook-steps">
              ${playbookSteps.map(s => html`
                <div class="playbook-step">
                  <div class="step-num">${s.step}</div>
                  <div class="step-detail">
                    <div class="step-action">${s.action}</div>
                    <div class="step-meta">Owner: ${s.owner} | SLA: ${s.sla}</div>
                  </div>
                </div>`).join('')}
            </div>
          </div>
          <div class="scenario-drills">
            <h5>Drill Schedule</h5>
            <div class="drill-list">
              ${drillSchedule.map(d => html`
                <div class="drill-item">
                  <span class="drill-scenario">${d.scenario}</span>
                  <span class="drill-date">${d.date}</span>
                  <span class="drill-type">${d.type}</span>
                  <span class="drill-participants">${d.participants} ppl</span>
                </div>`).join('')}
            </div>
          </div>
          <div class="scenario-aar">
            <h5>After-Action Review: ${aarTemplate.scenario}</h5>
            <div class="aar-score">Score: ${aarTemplate.score}/10</div>
            <div class="aar-section"><strong>Findings:</strong>
              <ul>${aarTemplate.findings.map(f => html`<li>${f}</li>`).join('')}</ul>
            </div>
            <div class="aar-section"><strong>Improvements:</strong>
              <ul>${aarTemplate.improvements.map(i => html`<li>${i}</li>`).join('')}</ul>
            </div>
          </div>
          <div class="scenario-evolution">
            <h5>Scenario Evolution Tracking</h5>
            ${evolution.map(e => html`
              <div class="evo-track">
                <strong>${e.scenario}</strong>
                <div class="evo-stages">
                  <span>V1: ${e.v1}</span> <span>\u2192</span>
                  <span>V2: ${e.v2}</span> <span>\u2192</span>
                  <span>V3: ${e.v3}</span>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </section>`;
  }




  // --- Security Compliance Calendar ---
  @state() private _complianceCalendarEvents: Array<{id: string; title: string; deadline: string; category: string; status: string; assignee: string; notes: string}> = [
    {id: 'cc-security-timeline-001', title: 'SOX Section 404 Compliance Review', deadline: '2026-06-30', category: 'Regulatory', status: 'In Progress', assignee: 'Compliance Team', notes: 'Annual internal control assessment for financial reporting'},
    {id: 'cc-security-timeline-002', title: 'GDPR Data Protection Impact Assessment', deadline: '2026-05-15', category: 'Privacy', status: 'Pending', assignee: 'DPO Office', notes: 'Quarterly DPIA for high-risk processing activities'},
    {id: 'cc-security-timeline-003', title: 'ISO 27001 Surveillance Audit', deadline: '2026-07-20', category: 'Certification', status: 'Scheduled', assignee: 'QA Lead', notes: 'Stage 2 surveillance audit for ISMS certification renewal'},
    {id: 'cc-security-timeline-004', title: 'PCI DSS v4.0 Gap Analysis', deadline: '2026-05-30', category: 'Payment', status: 'Not Started', assignee: 'Security Architect', notes: 'Assess current state against PCI DSS v4.0 requirements'},
    {id: 'cc-security-timeline-005', title: 'NIST CSF Self-Assessment', deadline: '2026-08-15', category: 'Framework', status: 'Pending', assignee: 'CISO', notes: 'Biannual self-assessment against NIST Cybersecurity Framework'},
    {id: 'cc-security-timeline-006', title: 'HIPAA Security Rule Audit', deadline: '2026-06-15', category: 'Healthcare', status: 'In Progress', assignee: 'Compliance Analyst', notes: 'Annual audit of administrative, physical, and technical safeguards'},
    {id: 'cc-security-timeline-007', title: 'SOC 2 Type II Report Renewal', deadline: '2026-09-30', category: 'Audit', status: 'Scheduled', assignee: 'External Auditor', notes: 'Engage auditor for SOC 2 Type II examination period'},
    {id: 'cc-security-timeline-008', title: 'FedRAMP Authorization Review', deadline: '2026-07-01', category: 'Government', status: 'Pending', assignee: 'FedRAMP PMO', notes: 'Review and update security authorization package'},
    {id: 'cc-security-timeline-009', title: 'Annual Penetration Test', deadline: '2026-10-15', category: 'Testing', status: 'Not Started', assignee: 'Red Team Lead', notes: 'Comprehensive external and internal penetration testing engagement'},
    {id: 'cc-security-timeline-010', title: 'Security Awareness Training Rollout', deadline: '2026-05-01', category: 'Training', status: 'Completed', assignee: 'Security Awareness Manager', notes: 'Q2 organization-wide security awareness training program'},
    {id: 'cc-security-timeline-011', title: 'Vendor Security Review Cycle', deadline: '2026-06-01', category: 'Third Party', status: 'In Progress', assignee: 'Vendor Manager', notes: 'Quarterly review of critical vendor security posture and SLA compliance'},
    {id: 'cc-security-timeline-012', title: 'Incident Response Plan Update', deadline: '2026-05-20', category: 'Operations', status: 'Pending', assignee: 'IR Team Lead', notes: 'Update IR procedures based on lessons learned from recent incidents'},
  ];

  private _getComplianceCalendarStats() {
    const events = this._complianceCalendarEvents;
    return {
      total: events.length,
      completed: events.filter(e => e.status === 'Completed').length,
      inProgress: events.filter(e => e.status === 'In Progress').length,
      pending: events.filter(e => e.status === 'Pending' || e.status === 'Not Started').length,
      scheduled: events.filter(e => e.status === 'Scheduled').length,
      overdue: events.filter(e => new Date(e.deadline) < new Date() && e.status !== 'Completed').length,
    };
  }

  private _renderComplianceCalendar() {
    const stats = this._getComplianceCalendarStats();
    const categoryColors: Record<string, string> = {
      'Regulatory': '#ef4444', 'Privacy': '#8b5cf6', 'Certification': '#06b6d4',
      'Payment': '#f59e0b', 'Framework': '#10b981', 'Healthcare': '#ec4899',
      'Audit': '#6366f1', 'Government': '#14b8a6', 'Testing': '#f97316',
      'Training': '#84cc16', 'Third Party': '#a855f7', 'Operations': '#0ea5e9',
    };
    return html`
      <div class="compliance-calendar-section">
        <h4 class="section-title">Security Compliance Calendar</h4>
        <div class="compliance-stats-grid">
          <div class="stat-card"><span class="stat-value">${stats.total}</span><span class="stat-label">Total Events</span></div>
          <div class="stat-card"><span class="stat-value">${stats.completed}</span><span class="stat-label">Completed</span></div>
          <div class="stat-card"><span class="stat-value">${stats.inProgress}</span><span class="stat-label">In Progress</span></div>
          <div class="stat-card"><span class="stat-value">${stats.pending}</span><span class="stat-label">Pending</span></div>
          <div class="stat-card"><span class="stat-value">${stats.scheduled}</span><span class="stat-label">Scheduled</span></div>
          <div class="stat-card"><span class="stat-value">${stats.overdue}</span><span class="stat-label">Overdue</span></div>
        </div>
        <div class="compliance-timeline">
          ${this._complianceCalendarEvents.map(event => html`
            <div class="calendar-event" style="border-left: 3px solid ${categoryColors[event.category] || '#6b7280'}">
              <div class="event-header">
                <span class="event-title">${event.title}</span>
                <span class="event-badge badge-${event.status.toLowerCase().replace(/ /g, '-')}">${event.status}</span>
              </div>
              <div class="event-meta">
                <span class="event-category" style="color: ${categoryColors[event.category]}">${event.category}</span>
                <span class="event-deadline">Due: ${event.deadline}</span>
                <span class="event-assignee">${event.assignee}</span>
              </div>
              <div class="event-notes">${event.notes}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
  // --- Security Exception Management ---
  @state() private _securityExceptions: Array<{id: string; title: string; riskLevel: string; status: string; requestor: string; approver: string; createdDate: string; expiryDate: string; compensatingControls: string[]; justification: string; lastReviewed: string}> = [
    {id: 'exc-security-timeline-001', title: 'Legacy TLS 1.0 Exception for Payment Gateway', riskLevel: 'High', status: 'Approved', requestor: 'Infrastructure Team', approver: 'CISO', createdDate: '2026-01-15', expiryDate: '2026-07-15', compensatingControls: ['Network segmentation', 'Enhanced monitoring', 'Quarterly review'], justification: 'Third-party payment processor requires TLS 1.0; migration planned for Q3'},
    {id: 'exc-security-timeline-002', title: 'Admin Account with Non-SSO Access', riskLevel: 'Medium', status: 'Under Review', requestor: 'DevOps Lead', approver: 'IAM Manager', createdDate: '2026-02-20', expiryDate: '2026-08-20', compensatingControls: ['MFA enforced', 'Session recording', 'Weekly access audit'], justification: 'Emergency break-glass account for critical infrastructure management'},
    {id: 'exc-security-timeline-003', title: 'Outdated Database Version Support', riskLevel: 'High', status: 'Approved', requestor: 'DBA Team', approver: 'CTO', createdDate: '2025-12-01', expiryDate: '2026-06-01', compensatingControls: ['Isolated network zone', 'Application-layer WAF', 'Monthly patching'], justification: 'Vendor application incompatibility with newer DB version; upgrade scheduled'},
    {id: 'exc-security-timeline-004', title: 'Public S3 Bucket for Customer Assets', riskLevel: 'Critical', status: 'Expired', requestor: 'Product Team', approver: 'CISO', createdDate: '2025-09-01', expiryDate: '2026-03-01', compensatingControls: ['Signed URLs', 'Access logging', 'Content encryption'], justification: 'Legacy customer portal requires public access for document delivery'},
    {id: 'exc-security-timeline-005', title: 'VPN Bypass for Cloud-Native Workloads', riskLevel: 'Medium', status: 'Pending', requestor: 'Cloud Architecture', approver: 'Security Architect', createdDate: '2026-03-10', expiryDate: '2026-09-10', compensatingControls: ['Zero Trust network policies', 'mTLS between services', 'Service mesh encryption'], justification: 'Cloud-native microservices require direct connectivity for performance'},
    {id: 'exc-security-timeline-006', title: 'Default Password Policy Override', riskLevel: 'High', status: 'Denied', requestor: 'HR Department', approver: 'CISO', createdDate: '2026-03-15', expiryDate: '2026-09-15', compensatingControls: ['Password manager deployment', 'SSO integration'], justification: 'Requested simpler password requirements for non-technical staff'},
  ];

  private _getExceptionStats() {
    const ex = this._securityExceptions;
    return {
      total: ex.length,
      approved: ex.filter(e => e.status === 'Approved').length,
      pending: ex.filter(e => e.status === 'Pending' || e.status === 'Under Review').length,
      expired: ex.filter(e => e.status === 'Expired' || e.status === 'Denied').length,
      highRisk: ex.filter(e => e.riskLevel === 'High' || e.riskLevel === 'Critical').length,
      expiringSoon: ex.filter(e => {
        const d = new Date(e.expiryDate);
        const now = new Date();
        const soon = new Date(now.getTime() + 30 * 86400000);
        return d > now && d <= soon;
      }).length,
    };
  }

  private _renderExceptionManagement() {
    const stats = this._getExceptionStats();
    const riskColors: Record<string, string> = { 'Critical': '#dc2626', 'High': '#ef4444', 'Medium': '#f59e0b', 'Low': '#22c55e' };
    return html`
      <div class="exception-mgmt-section">
        <h4 class="section-title">Security Exception Management</h4>
        <div class="exception-stats">
          <div class="exc-stat"><span class="exc-num">${stats.total}</span><span class="exc-lbl">Total</span></div>
          <div class="exc-stat"><span class="exc-num">${stats.approved}</span><span class="exc-lbl">Approved</span></div>
          <div class="exc-stat"><span class="exc-num">${stats.pending}</span><span class="exc-lbl">Pending</span></div>
          <div class="exc-stat"><span class="exc-num">${stats.expired}</span><span class="exc-lbl">Expired/Denied</span></div>
          <div class="exc-stat"><span class="exc-num">${stats.highRisk}</span><span class="exc-lbl">High Risk</span></div>
          <div class="exc-stat"><span class="exc-num">${stats.expiringSoon}</span><span class="exc-lbl">Expiring Soon</span></div>
        </div>
        <div class="exception-list">
          ${this._securityExceptions.map(exc => html`
            <div class="exception-card" data-risk="${exc.riskLevel}">
              <div class="exc-header">
                <span class="exc-title">${exc.title}</span>
                <span class="exc-risk-badge" style="background: ${riskColors[exc.riskLevel]}20; color: ${riskColors[exc.riskLevel]}">${exc.riskLevel}</span>
              </div>
              <div class="exc-details">
                <div class="exc-row"><span>Status:</span><strong>${exc.status}</strong></div>
                <div class="exc-row"><span>Requestor:</span><span>${exc.requestor}</span></div>
                <div class="exc-row"><span>Approver:</span><span>${exc.approver}</span></div>
                <div class="exc-row"><span>Expiry:</span><span>${exc.expiryDate}</span></div>
                <div class="exc-row"><span>Justification:</span><span>${exc.justification}</span></div>
              </div>
              <div class="exc-controls">
                <span class="controls-label">Compensating Controls:</span>
                ${exc.compensatingControls.map(c => html`<span class="control-tag">${c}</span>`)}
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
  // --- Security Data Quality Framework ---
  @state() private _dataQualityMetrics: Array<{id: string; dataSource: string; completenessScore: number; accuracyScore: number; timelinessScore: number; consistencyScore: number; reliabilityRank: number; lastUpdated: string; issues: string[]; trend: string}> = [
    {id: 'dq-security-timeline-001', dataSource: 'Vulnerability Scanner Feed', completenessScore: 94, accuracyScore: 91, timelinessScore: 88, consistencyScore: 95, reliabilityRank: 1, lastUpdated: '2026-04-23T08:00:00Z', issues: ['Minor delay in Nessus plugin updates'], trend: 'improving'},
    {id: 'dq-security-timeline-002', dataSource: 'SIEM Event Logs', completenessScore: 87, accuracyScore: 93, timelinessScore: 96, consistencyScore: 89, reliabilityRank: 2, lastUpdated: '2026-04-23T07:30:00Z', issues: ['Some log sources showing gaps in off-hours'], trend: 'stable'},
    {id: 'dq-security-timeline-003', dataSource: 'Asset Inventory Database', completenessScore: 82, accuracyScore: 78, timelinessScore: 75, consistencyScore: 84, reliabilityRank: 4, lastUpdated: '2026-04-22T18:00:00Z', issues: ['Shadow IT devices not fully cataloged', 'Decommissioned assets still listed'], trend: 'declining'},
    {id: 'dq-security-timeline-004', dataSource: 'Threat Intelligence Platform', completenessScore: 91, accuracyScore: 89, timelinessScore: 92, consistencyScore: 87, reliabilityRank: 3, lastUpdated: '2026-04-23T06:00:00Z', issues: ['Some IOC sources lack confidence scoring'], trend: 'improving'},
    {id: 'dq-security-timeline-005', dataSource: 'Identity Provider Logs', completenessScore: 96, accuracyScore: 97, timelinessScore: 98, consistencyScore: 96, reliabilityRank: 1, lastUpdated: '2026-04-23T09:00:00Z', issues: [], trend: 'stable'},
    {id: 'dq-security-timeline-006', dataSource: 'Cloud Security Posture Data', completenessScore: 79, accuracyScore: 85, timelinessScore: 82, consistencyScore: 81, reliabilityRank: 5, lastUpdated: '2026-04-23T05:00:00Z', issues: ['Multi-cloud coverage gaps', 'API rate limiting affects scan frequency'], trend: 'declining'},
    {id: 'dq-security-timeline-007', dataSource: 'Compliance Evidence Store', completenessScore: 88, accuracyScore: 86, timelinessScore: 80, consistencyScore: 83, reliabilityRank: 4, lastUpdated: '2026-04-21T14:00:00Z', issues: ['Manual evidence collection delays', 'Inconsistent formatting across frameworks'], trend: 'stable'},
    {id: 'dq-security-timeline-008', dataSource: 'Network Flow Data', completenessScore: 92, accuracyScore: 90, timelinessScore: 94, consistencyScore: 91, reliabilityRank: 2, lastUpdated: '2026-04-23T08:30:00Z', issues: ['Encrypted traffic classification accuracy needs improvement'], trend: 'improving'},
  ];

  private _getOverallDataQuality() {
    const m = this._dataQualityMetrics;
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
      overallCompleteness: Math.round(avg(m.map(d => d.completenessScore))),
      overallAccuracy: Math.round(avg(m.map(d => d.accuracyScore))),
      overallTimeliness: Math.round(avg(m.map(d => d.timelinessScore))),
      overallConsistency: Math.round(avg(m.map(d => d.consistencyScore))),
      totalIssues: m.reduce((sum, d) => sum + d.issues.length, 0),
      improving: m.filter(d => d.trend === 'improving').length,
      declining: m.filter(d => d.trend === 'declining').length,
      stable: m.filter(d => d.trend === 'stable').length,
    };
  }

  private _renderDataQuality() {
    const overall = this._getOverallDataQuality();
    const scoreColor = (s: number) => s >= 90 ? '#22c55e' : s >= 80 ? '#f59e0b' : '#ef4444';
    const trendIcon = (t: string) => t === 'improving' ? '▲' : t === 'declining' ? '▼' : '■';
    const trendColor = (t: string) => t === 'improving' ? '#22c55e' : t === 'declining' ? '#ef4444' : '#6b7280';
    return html`
      <div class="data-quality-section">
        <h4 class="section-title">Security Data Quality Framework</h4>
        <div class="dq-overview">
          <div class="dq-metric">
            <div class="dq-score" style="color: ${scoreColor(overall.overallCompleteness)}">${overall.overallCompleteness}%</div>
            <div class="dq-label">Completeness</div>
          </div>
          <div class="dq-metric">
            <div class="dq-score" style="color: ${scoreColor(overall.overallAccuracy)}">${overall.overallAccuracy}%</div>
            <div class="dq-label">Accuracy</div>
          </div>
          <div class="dq-metric">
            <div class="dq-score" style="color: ${scoreColor(overall.overallTimeliness)}">${overall.overallTimeliness}%</div>
            <div class="dq-label">Timeliness</div>
          </div>
          <div class="dq-metric">
            <div class="dq-score" style="color: ${scoreColor(overall.overallConsistency)}">${overall.overallConsistency}%</div>
            <div class="dq-label">Consistency</div>
          </div>
        </div>
        <div class="dq-trend-summary">
          <span class="trend-badge improving">Improving: ${overall.improving}</span>
          <span class="trend-badge stable">Stable: ${overall.stable}</span>
          <span class="trend-badge declining">Declining: ${overall.declining}</span>
          <span class="dq-issues-total">Total Issues: ${overall.totalIssues}</span>
        </div>
        <div class="dq-sources-list">
          ${this._dataQualityMetrics.map(d => html`
            <div class="dq-source-row">
              <div class="dq-source-name">
                <span class="dq-rank">#${d.reliabilityRank}</span>
                ${d.dataSource}
                <span class="dq-trend-icon" style="color: ${trendColor(d.trend)}">${trendIcon(d.trend)}</span>
              </div>
              <div class="dq-scores">
                <span class="dq-mini-score" style="color: ${scoreColor(d.completenessScore)}">C:${d.completenessScore}</span>
                <span class="dq-mini-score" style="color: ${scoreColor(d.accuracyScore)}">A:${d.accuracyScore}</span>
                <span class="dq-mini-score" style="color: ${scoreColor(d.timelinessScore)}">T:${d.timelinessScore}</span>
                <span class="dq-mini-score" style="color: ${scoreColor(d.consistencyScore)}">Co:${d.consistencyScore}</span>
              </div>
              ${d.issues.length > 0 ? html`<div class="dq-issues">${d.issues.map(i => html`<span class="dq-issue">${i}</span>`)}</div>` : html`<span class="dq-no-issues">No issues</span>`}
            </div>
          `)}
        </div>
      </div>
    `;
  }
  // --- Security Workflow Automation ---
  @state() private _workflowTemplates: Array<{id: string; name: string; description: string; category: string; steps: number; avgDuration: string; successRate: number; lastRun: string; manualInterventions: number; optimizationScore: number}> = [
    {id: 'wf-security-timeline-001', name: 'Vulnerability Triage Pipeline', description: 'Automated vulnerability assessment, prioritization, and assignment workflow', category: 'Vulnerability Management', steps: 8, avgDuration: '12 min', successRate: 94.5, lastRun: '2026-04-23T06:00:00Z', manualInterventions: 2, optimizationScore: 87},
    {id: 'wf-security-timeline-002', name: 'Incident Response Orchestration', description: 'End-to-end IR workflow from detection to containment and recovery', category: 'Incident Response', steps: 15, avgDuration: '45 min', successRate: 89.2, lastRun: '2026-04-22T14:30:00Z', manualInterventions: 5, optimizationScore: 72},
    {id: 'wf-security-timeline-003', name: 'Access Request Approval Chain', description: 'Multi-level approval workflow for privileged access requests', category: 'Identity & Access', steps: 6, avgDuration: '4 hours', successRate: 97.1, lastRun: '2026-04-23T09:15:00Z', manualInterventions: 1, optimizationScore: 92},
    {id: 'wf-security-timeline-004', name: 'Compliance Evidence Collection', description: 'Automated gathering and packaging of audit evidence artifacts', category: 'Compliance', steps: 10, avgDuration: '30 min', successRate: 91.8, lastRun: '2026-04-21T10:00:00Z', manualInterventions: 3, optimizationScore: 78},
    {id: 'wf-security-timeline-005', name: 'Security Patch Deployment', description: 'Staged patch rollout with validation and rollback capability', category: 'Patch Management', steps: 12, avgDuration: '2 hours', successRate: 96.3, lastRun: '2026-04-20T22:00:00Z', manualInterventions: 1, optimizationScore: 85},
    {id: 'wf-security-timeline-006', name: 'Threat Intelligence Enrichment', description: 'IOC enrichment and correlation with internal threat data', category: 'Threat Intelligence', steps: 7, avgDuration: '8 min', successRate: 93.7, lastRun: '2026-04-23T07:00:00Z', manualInterventions: 0, optimizationScore: 95},
    {id: 'wf-security-timeline-007', name: 'Security Reporting Pipeline', description: 'Automated generation and distribution of security metrics reports', category: 'Reporting', steps: 5, avgDuration: '15 min', successRate: 98.9, lastRun: '2026-04-23T08:00:00Z', manualInterventions: 0, optimizationScore: 97},
    {id: 'wf-security-timeline-008', name: 'Vendor Risk Assessment', description: 'Automated vendor security questionnaire distribution and scoring', category: 'Third Party', steps: 9, avgDuration: '3 days', successRate: 85.4, lastRun: '2026-04-19T11:00:00Z', manualInterventions: 4, optimizationScore: 65},
  ];

  @state() private _workflowExecutionHistory: Array<{workflowId: string; runDate: string; duration: string; status: string; trigger: string}> = [
    {workflowId: 'wf-security-timeline-001', runDate: '2026-04-23T06:00:00Z', duration: '11 min 23 sec', status: 'Success', trigger: 'Scheduled'},
    {workflowId: 'wf-security-timeline-002', runDate: '2026-04-22T14:30:00Z', duration: '42 min 15 sec', status: 'Success', trigger: 'Alert'},
    {workflowId: 'wf-security-timeline-003', runDate: '2026-04-23T09:15:00Z', duration: '3h 45 min', status: 'Success', trigger: 'User Request'},
    {workflowId: 'wf-security-timeline-001', runDate: '2026-04-22T06:00:00Z', duration: '13 min 08 sec', status: 'Partial', trigger: 'Scheduled'},
    {workflowId: 'wf-security-timeline-004', runDate: '2026-04-21T10:00:00Z', duration: '28 min 42 sec', status: 'Success', trigger: 'Scheduled'},
  ];

  private _renderWorkflowAutomation() {
    const avgSuccessRate = Math.round(this._workflowTemplates.reduce((s, w) => s + w.successRate, 0) / this._workflowTemplates.length * 10) / 10;
    const totalManualInterventions = this._workflowTemplates.reduce((s, w) => s + w.manualInterventions, 0);
    const avgOptimization = Math.round(this._workflowTemplates.reduce((s, w) => s + w.optimizationScore, 0) / this._workflowTemplates.length);
    return html`
      <div class="workflow-automation-section">
        <h4 class="section-title">Security Workflow Automation</h4>
        <div class="wf-summary">
          <div class="wf-summary-item"><span class="wf-num">${this._workflowTemplates.length}</span><span class="wf-lbl">Templates</span></div>
          <div class="wf-summary-item"><span class="wf-num">${avgSuccessRate}%</span><span class="wf-lbl">Avg Success</span></div>
          <div class="wf-summary-item"><span class="wf-num">${totalManualInterventions}</span><span class="wf-lbl">Manual Steps</span></div>
          <div class="wf-summary-item"><span class="wf-num">${avgOptimization}%</span><span class="wf-lbl">Optimization</span></div>
        </div>
        <div class="wf-template-list">
          ${this._workflowTemplates.map(wf => html`
            <div class="wf-template-card">
              <div class="wf-template-header">
                <span class="wf-name">${wf.name}</span>
                <span class="wf-category">${wf.category}</span>
              </div>
              <div class="wf-template-desc">${wf.description}</div>
              <div class="wf-template-meta">
                <span>${wf.steps} steps</span>
                <span>Avg: ${wf.avgDuration}</span>
                <span>Success: ${wf.successRate}%</span>
                <span>Opt: ${wf.optimizationScore}%</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
  // --- Security Knowledge Base ---
  @state() private _knowledgeArticles: Array<{id: string; title: string; category: string; author: string; publishDate: string; views: number; rating: number; tags: string[]; summary: string; readTime: string}> = [
    {id: 'kb-security-timeline-001', title: 'Zero Trust Architecture Implementation Guide', category: 'Architecture', author: 'Security Architecture Team', publishDate: '2026-03-15', views: 1842, rating: 4.8, tags: ['zero-trust', 'network', 'identity'], summary: 'Comprehensive guide for implementing zero trust principles across enterprise infrastructure', readTime: '15 min'},
    {id: 'kb-security-timeline-002', title: 'Ransomware Defense Playbook 2026', category: 'Threats', author: 'Threat Intelligence Team', publishDate: '2026-04-01', views: 2341, rating: 4.9, tags: ['ransomware', 'incident-response', 'defense'], summary: 'Updated playbook with latest ransomware tactics, techniques, and defensive measures', readTime: '12 min'},
    {id: 'kb-security-timeline-003', title: 'Cloud Security Best Practices for Multi-Cloud', category: 'Cloud', author: 'Cloud Security Team', publishDate: '2026-02-28', views: 1567, rating: 4.5, tags: ['cloud', 'aws', 'azure', 'gcp'], summary: 'Best practices for securing workloads across multiple cloud service providers', readTime: '18 min'},
    {id: 'kb-security-timeline-004', title: 'API Security Testing Methodology', category: 'Testing', author: 'Red Team', publishDate: '2026-03-22', views: 987, rating: 4.6, tags: ['api', 'testing', 'owasp'], summary: 'Structured methodology for identifying and testing API security vulnerabilities', readTime: '10 min'},
    {id: 'kb-security-timeline-005', title: 'Supply Chain Security Risk Management', category: 'Third Party', author: 'GRC Team', publishDate: '2026-01-20', views: 1234, rating: 4.3, tags: ['supply-chain', 'vendor', 'risk'], summary: 'Framework for managing security risks in the software supply chain', readTime: '14 min'},
    {id: 'kb-security-timeline-006', title: 'Kubernetes Security Hardening Checklist', category: 'Container', author: 'Platform Security', publishDate: '2026-04-10', views: 2103, rating: 4.7, tags: ['kubernetes', 'container', 'hardening'], summary: 'Step-by-step hardening checklist for production Kubernetes clusters', readTime: '11 min'},
    {id: 'kb-security-timeline-007', title: 'Security Metrics That Matter for Executives', category: 'Metrics', author: 'CISO Office', publishDate: '2026-03-05', views: 876, rating: 4.4, tags: ['metrics', 'kpi', 'reporting'], summary: 'Key security metrics and KPIs that resonate with board-level stakeholders', readTime: '8 min'},
    {id: 'kb-security-timeline-008', title: 'Phishing Simulation Campaign Design', category: 'Awareness', author: 'Security Awareness Team', publishDate: '2026-02-15', views: 1456, rating: 4.5, tags: ['phishing', 'simulation', 'training'], summary: 'Designing effective phishing simulations that drive real behavioral change', readTime: '9 min'},
    {id: 'kb-security-timeline-009', title: 'Data Loss Prevention Strategy and Implementation', category: 'Data Protection', author: 'Data Security Team', publishDate: '2026-03-28', views: 1678, rating: 4.6, tags: ['dlp', 'data-protection', 'compliance'], summary: 'Strategic approach to DLP covering people, process, and technology layers', readTime: '16 min'},
    {id: 'kb-security-timeline-010', title: 'Security Automation with SOAR Platforms', category: 'Automation', author: 'SOC Engineering', publishDate: '2026-04-05', views: 1098, rating: 4.7, tags: ['soar', 'automation', 'soc'], summary: 'Building effective security automation playbooks using SOAR technology', readTime: '13 min'},
    {id: 'kb-security-timeline-011', title: 'Third-Party Risk Assessment Framework', category: 'GRC', author: 'Vendor Management', publishDate: '2026-01-30', views: 1345, rating: 4.4, tags: ['vendor', 'risk', 'assessment'], summary: 'Structured framework for evaluating and monitoring third-party security risks', readTime: '12 min'},
    {id: 'kb-security-timeline-012', title: 'Network Detection and Response Best Practices', category: 'Network', author: 'Network Security Team', publishDate: '2026-03-18', views: 1567, rating: 4.5, tags: ['ndr', 'network', 'detection'], summary: 'Implementing effective network detection and response capabilities', readTime: '14 min'},
    {id: 'kb-security-timeline-013', title: 'Security Chaos Engineering Guide', category: 'Resilience', author: 'SRE Security', publishDate: '2026-04-12', views: 789, rating: 4.3, tags: ['chaos-engineering', 'resilience', 'testing'], summary: 'Applying chaos engineering principles to validate security controls', readTime: '10 min'},
    {id: 'kb-security-timeline-014', title: 'Incident Communication Templates', category: 'Incident Response', author: 'IR Team', publishDate: '2026-02-22', views: 2234, rating: 4.8, tags: ['incident', 'communication', 'templates'], summary: 'Ready-to-use communication templates for security incident scenarios', readTime: '7 min'},
    {id: 'kb-security-timeline-015', title: 'Endpoint Detection and Response Configuration', category: 'Endpoint', author: 'Endpoint Security', publishDate: '2026-03-08', views: 1345, rating: 4.5, tags: ['edr', 'endpoint', 'configuration'], summary: 'Optimal EDR configuration for maximum detection with minimal false positives', readTime: '11 min'},
    {id: 'kb-security-timeline-016', title: 'Security Code Review Standards', category: 'Development', author: 'AppSec Team', publishDate: '2026-02-10', views: 1890, rating: 4.6, tags: ['code-review', 'secure-sdlc', 'standards'], summary: 'Standards and checklists for security-focused code reviews', readTime: '13 min'},
    {id: 'kb-security-timeline-017', title: 'IoT Security Assessment Methodology', category: 'IoT', author: 'IoT Security Lab', publishDate: '2026-04-08', views: 654, rating: 4.2, tags: ['iot', 'embedded', 'assessment'], summary: 'Methodology for assessing security posture of IoT devices and ecosystems', readTime: '15 min'},
    {id: 'kb-security-timeline-018', title: 'Passwordless Authentication Migration Guide', category: 'Identity', author: 'IAM Team', publishDate: '2026-03-25', views: 1678, rating: 4.7, tags: ['passwordless', 'authentication', 'mfa'], summary: 'Step-by-step migration plan from password-based to passwordless authentication', readTime: '12 min'},
    {id: 'kb-security-timeline-019', title: 'Security Awareness Program Metrics', category: 'Awareness', author: 'Security Culture Team', publishDate: '2026-01-25', views: 1123, rating: 4.4, tags: ['awareness', 'metrics', 'culture'], summary: 'Measuring the effectiveness of your security awareness and training programs', readTime: '9 min'},
    {id: 'kb-security-timeline-020', title: 'Deception Technology Deployment Guide', category: 'Detection', author: 'Blue Team', publishDate: '2026-04-15', views: 876, rating: 4.5, tags: ['deception', 'honeypot', 'detection'], summary: 'Planning and deploying deception technology for advanced threat detection', readTime: '11 min'},
  ];

  @state() private _kbSearchQuery = '';
  @state() private _kbSelectedCategory = '';

  private _getKbCategories(): string[] {
    return [...new Set(this._knowledgeArticles.map(a => a.category))].sort();
  }

  private _getFilteredArticles(): typeof this._knowledgeArticles {
    let articles = this._knowledgeArticles;
    if (this._kbSearchQuery) {
      const q = this._kbSearchQuery.toLowerCase();
      articles = articles.filter(a => a.title.toLowerCase().includes(q) || a.tags.some(t => t.includes(q)) || a.summary.toLowerCase().includes(q));
    }
    if (this._kbSelectedCategory) {
      articles = articles.filter(a => a.category === this._kbSelectedCategory);
    }
    return articles.sort((a, b) => b.views - a.views);
  }

  private _renderKnowledgeBase() {
    const categories = this._getKbCategories();
    const filtered = this._getFilteredArticles();
    const topArticles = [...this._knowledgeArticles].sort((a, b) => b.views - a.views).slice(0, 5);
    const gapAreas = ['Container Runtime Security', 'AI/ML Security', 'Quantum Computing Threats', '5G Network Security'];
    return html`
      <div class="knowledge-base-section">
        <h4 class="section-title">Security Knowledge Base</h4>
        <div class="kb-controls">
          <input type="text" class="kb-search" placeholder="Search articles, tags..." .value=${this._kbSearchQuery} @input=${(e: Event) => { this._kbSearchQuery = (e.target as HTMLInputElement).value; }} />
          <select class="kb-category-filter" @change=${(e: Event) => { this._kbSelectedCategory = (e.target as HTMLSelectElement).value; }}>
            <option value="">All Categories</option>
            ${categories.map(c => html`<option value="${c}" ?selected=${this._kbSelectedCategory === c}>${c}</option>`)}
          </select>
        </div>
        <div class="kb-sidebar">
          <div class="kb-popular">
            <h5>Most Popular</h5>
            ${topArticles.map((a, i) => html`
              <div class="kb-popular-item">
                <span class="kb-rank">${i + 1}</span>
                <span class="kb-popular-title">${a.title}</span>
                <span class="kb-views">${a.views.toLocaleString()} views</span>
              </div>
            `)}
          </div>
          <div class="kb-gaps">
            <h5>Knowledge Gaps</h5>
            ${gapAreas.map(g => html`<span class="kb-gap-tag">${g}</span>`)}
          </div>
        </div>
        <div class="kb-article-grid">
          ${filtered.map(a => html`
            <div class="kb-article-card">
              <div class="kb-article-header">
                <span class="kb-article-title">${a.title}</span>
                <span class="kb-article-category">${a.category}</span>
              </div>
              <div class="kb-article-summary">${a.summary}</div>
              <div class="kb-article-footer">
                <span>${a.author}</span>
                <span>${a.readTime}</span>
                <span>Views: ${a.views}</span>
                <span>Rating: ${'\u2605'.repeat(Math.round(a.rating))}</span>
              </div>
              <div class="kb-article-tags">${a.tags.map(t => html`<span class="kb-tag">${t}</span>`)}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  // ─── Security Metrics Correlation Matrix ───
  private _metricNames = ["MTTR","MTTD","Vuln Backlog","Patch Coverage","Phish Click Rate","Training Score","Incident Count","Risk Score","Compliance Pct","Threat Intel Hits"];
  private _correlationMatrix: number[][] = [
    [1.00,-0.35, 0.42,-0.58, 0.28,-0.61, 0.55, 0.48,-0.52, 0.33],
    [-0.35, 1.00,-0.28, 0.31,-0.22, 0.44,-0.68,-0.42, 0.38,-0.55],
    [ 0.42,-0.28, 1.00,-0.72, 0.18,-0.33, 0.61, 0.54,-0.65, 0.41],
    [-0.58, 0.31,-0.72, 1.00,-0.15, 0.48,-0.52,-0.47, 0.71,-0.38],
    [ 0.28,-0.22, 0.18,-0.15, 1.00,-0.82, 0.35, 0.29,-0.31, 0.21],
    [-0.61, 0.44,-0.33, 0.48,-0.82, 1.00,-0.41,-0.38, 0.55,-0.27],
    [ 0.55,-0.68, 0.61,-0.52, 0.35,-0.41, 1.00, 0.72,-0.58, 0.63],
    [ 0.48,-0.42, 0.54,-0.47, 0.29,-0.38, 0.72, 1.00,-0.62, 0.58],
    [-0.52, 0.38,-0.65, 0.71,-0.31, 0.55,-0.58,-0.62, 1.00,-0.45],
    [ 0.33,-0.55, 0.41,-0.38, 0.21,-0.27, 0.63, 0.58,-0.45, 1.00]
  ];
  private _metricTypes: Record<string,"leading"|"lagging"|"both"> = {
    "MTTR":"lagging","MTTD":"lagging","Vuln Backlog":"lagging","Patch Coverage":"leading",
    "Phish Click Rate":"leading","Training Score":"leading","Incident Count":"lagging",
    "Risk Score":"both","Compliance Pct":"leading","Threat Intel Hits":"leading"
  };
  private _metricThresholds: Record<string,{good:number;warn:number;bad:number}> = {
    "MTTR":{good:60, warn:180, bad:480}, "MTTD":{good:30, warn:120, bad:360},
    "Vuln Backlog":{good:50, warn:200, bad:500}, "Patch Coverage":{good:95, warn:85, bad:70},
    "Phish Click Rate":{good:2, warn:8, bad:15}, "Training Score":{good:90, warn:75, bad:60},
    "Incident Count":{good:5, warn:15, bad:30}, "Risk Score":{good:30, warn:55, bad:75},
    "Compliance Pct":{good:98, warn:90, bad:80}, "Threat Intel Hits":{good:10, warn:50, bad:100}
  };

  private _getCorrelationColor(val: number): string {
    if (val >= 0.7) return "#dc2626";
    if (val >= 0.4) return "#f97316";
    if (val >= 0.1) return "#fbbf24";
    if (val >= -0.1) return "#e5e7eb";
    if (val >= -0.4) return "#60a5fa";
    if (val >= -0.7) return "#3b82f6";
    return "#1d4ed8";
  }

  private _getCompositeSecurityScore(currentValues: number[]): number {
    if (currentValues.length !== this._metricNames.length) return 0;
    const weights = [0.15, 0.12, 0.10, 0.13, 0.08, 0.10, 0.10, 0.12, 0.05, 0.05];
    const normalized = currentValues.map((v, i) => {
      const thresholds = this._metricThresholds[this._metricNames[i]];
      if (!thresholds) return 50;
      if (v <= thresholds.good) return 100;
      if (v <= thresholds.warn) return 100 - ((v - thresholds.good) / (thresholds.warn - thresholds.good)) * 40;
      if (v <= thresholds.bad) return 60 - ((v - thresholds.warn) / (thresholds.bad - thresholds.warn)) * 40;
      return Math.max(0, 20 - ((v - thresholds.bad) / thresholds.bad) * 20);
    });
    return Math.round(normalized.reduce((s, v, i) => s + v * weights[i], 0));
  }

  private _getAnomalyCorrelationAlerts(): Array<{metric1:string;metric2:string;correlation:number;expected:number;actual:number;severity:string}> {
    const alerts: Array<{metric1:string;metric2:string;correlation:number;expected:number;actual:number;severity:string}> = [];
    for (let i = 0; i < this._metricNames.length; i++) {
      for (let j = i + 1; j < this._metricNames.length; j++) {
        const corr = this._correlationMatrix[i][j];
        if (Math.abs(corr) > 0.5) {
          const deviation = Math.abs(corr) * 0.12;
          alerts.push({metric1: this._metricNames[i], metric2: this._metricNames[j], correlation: corr, expected: Math.round(corr * 100), actual: Math.round((corr + deviation) * 100), severity: "warning"});
        }
      }
    }
    return alerts.slice(0, 8);
  }

  private _getMetricDependencyGraph(): Array<{from:string;to:string;strength:number;direction:string}> {
    const deps: Array<{from:string;to:string;strength:number;direction:string}> = [];
    const pairs = [[0,1],[0,6],[2,3],[4,5],[6,7],[7,8],[9,6],[3,7],[5,4],[8,2]];
    for (const [i, j] of pairs) {
      deps.push({from: this._metricNames[i], to: this._metricNames[j], strength: Math.abs(this._correlationMatrix[i][j]), direction: this._correlationMatrix[i][j] > 0 ? "positive" : "negative"});
    }
    return deps.sort((a, b) => b.strength - a.strength);
  }


  // ── Security Risk Appetite Framework ──────────────────────────────
  private _riskAppetiteCategories: Array<{name: string; appetite: number; tolerance: number; capacity: number; status: string}> = [
    { name: 'Financial', appetite: 75, tolerance: 60, capacity: 90, status: 'within' },
    { name: 'Operational', appetite: 70, tolerance: 55, capacity: 85, status: 'within' },
    { name: 'Reputational', appetite: 65, tolerance: 50, capacity: 80, status: 'within' },
    { name: 'Regulatory', appetite: 55, tolerance: 40, capacity: 75, status: 'within' },
    { name: 'Strategic', appetite: 60, tolerance: 45, capacity: 70, status: 'within' },
    { name: 'Technology', appetite: 70, tolerance: 55, capacity: 85, status: 'within' },
  ];
  private _riskAppetiteReviewCycle: Array<{cycle: string; lastReview: string; nextReview: string; reviewer: string; status: string}> = [];
  private _riskCapacityScore: number = 82;
  private _riskAppetiteDocRef: string = 'BOARD-RISK-2026-001';

  private _initRiskAppetiteFramework(): void {
    const cycles = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];
    const reviewers = ['CISO', 'CRO', 'Board Risk Committee', 'Audit Committee'];
    const statuses = ['completed', 'in-progress', 'scheduled', 'scheduled'];
    this._riskAppetiteReviewCycle = cycles.map((c, i) => ({
      cycle: c,
      lastReview: i === 0 ? '2026-01-15' : '',
      nextReview: `2026-${(i + 1) * 3 > 12 ? 12 : (i + 1) * 3}-01`,
      reviewer: reviewers[i],
      status: statuses[i],
    }));
    this._riskCapacityScore = this._calculateRiskCapacity();
  }

  private _calculateRiskCapacity(): number {
    const totalCapacity = this._riskAppetiteCategories.reduce((s, c) => s + c.capacity, 0);
    const totalAppetite = this._riskAppetiteCategories.reduce((s, c) => s + c.appetite, 0);
    return Math.round((totalCapacity / (this._riskAppetiteCategories.length * 100)) * 100);
  }

  private _getRiskAppetiteComparison(category: string): {actual: number; appetite: number; delta: number; trend: string} {
    const cat = this._riskAppetiteCategories.find(c => c.name === category);
    if (!cat) return { actual: 0, appetite: 0, delta: 0, trend: 'stable' };
    const actual = cat.appetite + Math.round((Math.random() - 0.5) * 20);
    const delta = actual - cat.appetite;
    return { actual, appetite: cat.appetite, delta, trend: delta > 5 ? 'increasing' : delta < -5 ? 'decreasing' : 'stable' };
  }

  private _renderRiskAppetiteGauge(value: number, max: number, label: string): string {
    const pct = Math.min(100, Math.round((value / max) * 100));
    const color = pct < 40 ? '#ef4444' : pct < 70 ? '#f59e0b' : '#22c55e';
    return `<div style="margin:4px 0"><div style="display:flex;justify-content:space-between;font-size:11px"><span>${label}</span><span>${pct}%</span></div><div style="height:6px;background:#1e293b;border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${color};border-radius:3px;transition:width 0.3s"></div></div></div>`;
  }

  private _renderRiskAppetiteFramework(): string {
    if (this._riskAppetiteReviewCycle.length === 0) this._initRiskAppetiteFramework();
    let html = `<div style="padding:12px"><h4 style="margin:0 0 8px;color:#f1f5f9">Risk Appetite Framework</h4>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">`;
    for (const cat of this._riskAppetiteCategories) {
      const comp = this._getRiskAppetiteComparison(cat.name);
      const trendIcon = comp.trend === 'increasing' ? '▲' : comp.trend === 'decreasing' ? '▼' : '◆';
      const trendColor = comp.trend === 'increasing' ? '#ef4444' : comp.trend === 'decreasing' ? '#22c55e' : '#64748b';
      html += `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:8px">`;
      html += `<div style="font-size:12px;font-weight:600;color:#e2e8f0;margin-bottom:4px">${cat.name}</div>`;
      html += this._renderRiskAppetiteGauge(comp.actual, 100, 'Actual');
      html += this._renderRiskAppetiteGauge(comp.appetite, 100, 'Appetite');
      html += `<div style="font-size:10px;color:${trendColor};margin-top:2px">${trendIcon} ${comp.trend} (delta: ${comp.delta > 0 ? '+' : ''}${comp.delta})</div>`;
      html += `</div>`;
    }
    html += `</div>`;
    html += `<div style="margin-top:8px;padding:8px;background:#0f172a;border-radius:6px;border:1px solid #1e293b">`;
    html += `<div style="font-size:11px;color:#94a3b8">Risk Capacity Score: <strong style="color:#22c55e">${this._riskCapacityScore}%</strong></div>`;
    html += `<div style="font-size:10px;color:#64748b;margin-top:2px">Board Doc: ${this._riskAppetiteDocRef}</div>`;
    html += `</div></div>`;
    return html;
  }

  // ── Security Incident Severity Calculator ─────────────────────────
  private _severityFactors: Array<{factor: string; weight: number; score: number; maxScore: number}> = [];
  private _severityHistory: Array<{month: string; critical: number; high: number; medium: number; low: number}> = [];
  private _escalationThresholds: Array<{level: string; minScore: number; action: string; notify: string}> = [];

  private _initSeverityCalculator(): void {
    this._severityFactors = [
      { factor: 'Business Impact', weight: 0.35, score: 7, maxScore: 10 },
      { factor: 'Likelihood of Recurrence', weight: 0.20, score: 6, maxScore: 10 },
      { factor: 'Scope Affected', weight: 0.20, score: 8, maxScore: 10 },
      { factor: 'Data Sensitivity', weight: 0.15, score: 5, maxScore: 10 },
      { factor: 'Recovery Complexity', weight: 0.10, score: 4, maxScore: 10 },
    ];
    this._severityHistory = [
      { month: 'Jan', critical: 2, high: 5, medium: 18, low: 32 },
      { month: 'Feb', critical: 1, high: 4, medium: 15, low: 28 },
      { month: 'Mar', critical: 3, high: 7, medium: 22, low: 35 },
      { month: 'Apr', critical: 1, high: 3, medium: 14, low: 25 },
    ];
    this._escalationThresholds = [
      { level: 'P1 Critical', minScore: 8.5, action: 'Immediate CISO notification', notify: 'CISO, CTO, Legal' },
      { level: 'P2 High', minScore: 7.0, action: 'Escalate within 1 hour', notify: 'SOC Lead, IR Team' },
      { level: 'P3 Medium', minScore: 5.0, action: 'Track and respond within 4 hours', notify: 'SOC Analyst' },
      { level: 'P4 Low', minScore: 3.0, action: 'Log and monitor', notify: 'Auto-triage' },
    ];
  }

  private _calculateSeverityScore(): number {
    const totalWeighted = this._severityFactors.reduce((s, f) => s + (f.score / f.maxScore) * f.weight, 0);
    return Math.round(totalWeighted * 10 * 100) / 100;
  }

  private _getSeverityLevel(score: number): {level: string; color: string; bg: string} {
    if (score >= 8.5) return { level: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
    if (score >= 7.0) return { level: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.15)' };
    if (score >= 5.0) return { level: 'Medium', color: '#eab308', bg: 'rgba(234,179,8,0.15)' };
    if (score >= 3.0) return { level: 'Low', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' };
    return { level: 'Info', color: '#64748b', bg: 'rgba(100,116,139,0.15)' };
  }

  private _getSeverityTrend(): string {
    if (this._severityHistory.length < 2) return 'stable';
    const recent = this._severityHistory.slice(-2);
    const prevTotal = recent[0].critical * 4 + recent[0].high * 3 + recent[0].medium * 2;
    const currTotal = recent[1].critical * 4 + recent[1].high * 3 + recent[1].medium * 2;
    return currTotal > prevTotal ? 'increasing' : currTotal < prevTotal ? 'decreasing' : 'stable';
  }

  private _renderSeverityMatrix(): string {
    const matrix = [['Low', 'Med', 'High', 'Crit'], ['High', 'Crit', 'Crit', 'Crit'], ['Med', 'High', 'High', 'Crit'], ['Low', 'Med', 'High', 'High']];
    const colors = [['#22c55e', '#eab308', '#f97316', '#ef4444'], ['#eab308', '#ef4444', '#ef4444', '#ef4444'], ['#22c55e', '#eab308', '#f97316', '#ef4444'], ['#22c55e', '#22c55e', '#eab308', '#f97316']];
    const labels = ['High', 'Medium', 'Low', 'Minimal'];
    let html = `<div style="display:grid;grid-template-columns:60px repeat(4,1fr);gap:2px;font-size:10px">`;
    html += `<div></div>`;
    for (const l of matrix[0]) html += `<div style="text-align:center;color:#94a3b8;padding:2px">${l}</div>`;
    for (let i = 0; i < 4; i++) {
      html += `<div style="color:#94a3b8;padding:2px;display:flex;align-items:center">${labels[i]}</div>`;
      for (let j = 0; j < 4; j++) {
        html += `<div style="background:${colors[i][j]};color:#000;font-weight:600;padding:4px;text-align:center;border-radius:2px">${matrix[i][j]}</div>`;
      }
    }
    html += `</div>`;
    return html;
  }

  private _renderSeverityCalculator(): string {
    if (this._severityFactors.length === 0) this._initSeverityCalculator();
    const score = this._calculateSeverityScore();
    const sev = this._getSeverityLevel(score);
    const trend = this._getSeverityTrend();
    let html = `<div style="padding:12px"><h4 style="margin:0 0 8px;color:#f1f5f9">Incident Severity Calculator</h4>`;
    html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">`;
    html += `<div style="font-size:24px;font-weight:700;color:${sev.color}">${score}</div>`;
    html += `<div style="padding:4px 8px;background:${sev.bg};color:${sev.color};border-radius:4px;font-size:12px;font-weight:600">${sev.level}</div>`;
    html += `<div style="font-size:10px;color:#94a3b8">Trend: ${trend}</div>`;
    html += `</div>`;
    html += `<div style="margin-bottom:8px"><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Factors:</div>`;
    for (const f of this._severityFactors) {
      const pct = Math.round((f.score / f.maxScore) * 100);
      html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0"><span style="font-size:10px;color:#cbd5e1;width:120px">${f.factor}</span><div style="flex:1;height:4px;background:#1e293b;border-radius:2px"><div style="height:100%;width:${pct}%;background:#3b82f6;border-radius:2px"></div></div><span style="font-size:10px;color:#64748b">${f.score}/${f.maxScore}</span></div>`;
    }
    html += `</div>`;
    html += `<div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Escalation Thresholds:</div>`;
    for (const t of this._escalationThresholds) {
      const color = t.minScore >= 8.5 ? '#ef4444' : t.minScore >= 7 ? '#f97316' : t.minScore >= 5 ? '#eab308' : '#3b82f6';
      html += `<div style="font-size:10px;color:#cbd5e1;margin:2px 0;padding:2px 4px;background:#0f172a;border-left:3px solid ${color};border-radius:2px">${t.level} (${t.minScore}+) - ${t.action}</div>`;
    }
    html += `</div></div>`;
    return html;
  }

  // ── Security Tool Efficacy Tracker ────────────────────────────────
  private _securityTools: Array<{name: string; category: string; efficacy: number; utilization: number; costPerDetection: number; overlap: number; roi: number; status: string}> = [];
  private _toolEfficacyHistory: Array<{month: string; avgEfficacy: number; avgUtilization: number; totalDetections: number; totalCost: number}> = [];

  private _initToolEfficacyTracker(): void {
    this._securityTools = [
      { name: 'SIEM Platform', category: 'Detection', efficacy: 87, utilization: 92, costPerDetection: 12.5, overlap: 15, roi: 340, status: 'optimal' },
      { name: 'EDR Solution', category: 'Endpoint', efficacy: 91, utilization: 88, costPerDetection: 8.3, overlap: 10, roi: 420, status: 'optimal' },
      { name: 'WAF', category: 'Network', efficacy: 78, utilization: 95, costPerDetection: 5.2, overlap: 22, roi: 280, status: 'review' },
      { name: 'DLP Suite', category: 'Data', efficacy: 72, utilization: 65, costPerDetection: 18.7, overlap: 8, roi: 180, status: 'underutilized' },
      { name: 'Vulnerability Scanner', category: 'Assessment', efficacy: 85, utilization: 80, costPerDetection: 6.1, overlap: 12, roi: 360, status: 'optimal' },
      { name: 'Threat Intel Feed', category: 'Intelligence', efficacy: 69, utilization: 70, costPerDetection: 22.0, overlap: 18, roi: 150, status: 'review' },
      { name: 'CASB', category: 'Cloud', efficacy: 76, utilization: 58, costPerDetection: 15.3, overlap: 14, roi: 200, status: 'underutilized' },
      { name: 'SOAR Platform', category: 'Orchestration', efficacy: 83, utilization: 75, costPerDetection: 10.8, overlap: 20, roi: 300, status: 'optimal' },
      { name: 'Email Gateway', category: 'Email', efficacy: 89, utilization: 97, costPerDetection: 3.2, overlap: 5, roi: 480, status: 'optimal' },
      { name: 'IAM System', category: 'Identity', efficacy: 81, utilization: 82, costPerDetection: 14.1, overlap: 11, roi: 250, status: 'optimal' },
    ];
    this._toolEfficacyHistory = [
      { month: 'Jan', avgEfficacy: 78, avgUtilization: 76, totalDetections: 1240, totalCost: 18500 },
      { month: 'Feb', avgEfficacy: 80, avgUtilization: 78, totalDetections: 1380, totalCost: 19200 },
      { month: 'Mar', avgEfficacy: 82, avgUtilization: 80, totalDetections: 1520, totalCost: 19800 },
      { month: 'Apr', avgEfficacy: 81, avgUtilization: 81, totalDetections: 1450, totalCost: 20100 },
    ];
  }

  private _getToolROIranking(): Array<{name: string; roi: number; rank: number}> {
    const sorted = [...this._securityTools].sort((a, b) => b.roi - a.roi);
    return sorted.map((t, i) => ({ name: t.name, roi: t.roi, rank: i + 1 }));
  }

  private _getToolReplacementRecommendations(): Array<{tool: string; reason: string; suggestion: string; savings: number}> {
    return [
      { tool: 'DLP Suite', reason: 'Low utilization (65%) and high cost-per-detection', suggestion: 'Consider consolidation with CASB', savings: 35000 },
      { tool: 'Threat Intel Feed', reason: 'High overlap (18%) with SIEM native feeds', suggestion: 'Reduce feed tier or integrate with SIEM', savings: 22000 },
    ];
  }

  private _renderToolEfficacyTracker(): string {
    if (this._securityTools.length === 0) this._initToolEfficacyTracker();
    let html = `<div style="padding:12px"><h4 style="margin:0 0 8px;color:#f1f5f9">Security Tool Efficacy</h4>`;
    const ranked = this._getToolROIranking();
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px">`;
    for (let i = 0; i < 5; i++) {
      const t = ranked[i];
      const color = i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : '#64748b';
      html += `<div style="display:flex;align-items:center;gap:6px;padding:3px 6px;background:#0f172a;border-radius:4px">`;
      html += `<span style="font-size:12px;color:${color};font-weight:700">#${t.rank}</span>`;
      html += `<span style="font-size:10px;color:#cbd5e1;flex:1">${t.name}</span>`;
      html += `<span style="font-size:10px;color:#22c55e">${t.roi}%</span></div>`;
    }
    html += `</div>`;
    const recs = this._getToolReplacementRecommendations();
    if (recs.length > 0) {
      html += `<div style="font-size:11px;color:#f59e0b;margin-bottom:4px">Replacement Recommendations:</div>`;
      for (const r of recs) {
        html += `<div style="padding:4px 6px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:4px;margin-bottom:4px">`;
        html += `<div style="font-size:10px;color:#fbbf24;font-weight:600">${r.tool}</div>`;
        html += `<div style="font-size:9px;color:#94a3b8">${r.reason}</div>`;
        html += `<div style="font-size:9px;color:#22c55e">Est. savings: $${r.savings.toLocaleString()}/yr - ${r.suggestion}</div></div>`;
      }
    }
    html += `</div>`;
    return html;
  }

  // ── Security Regulatory Mapping ───────────────────────────────────
  private _regulations: Array<{name: string; controls: number; overlap: number; effort: number; status: string; lastAudit: string}> = [];
  private _crossRegulationMatrix: Array<{source: string; target: string; commonControls: number; gaps: number}> = [];

  private _initRegulatoryMapping(): void {
    this._regulations = [
      { name: 'GDPR', controls: 78, overlap: 42, effort: 85, status: 'compliant', lastAudit: '2026-02-15' },
      { name: 'HIPAA', controls: 62, overlap: 35, effort: 78, status: 'compliant', lastAudit: '2026-01-20' },
      { name: 'PCI DSS', controls: 55, overlap: 28, effort: 72, status: 'partial', lastAudit: '2025-11-10' },
      { name: 'SOX', controls: 48, overlap: 30, effort: 68, status: 'compliant', lastAudit: '2026-03-01' },
      { name: 'ISO 27001', controls: 93, overlap: 55, effort: 90, status: 'certified', lastAudit: '2026-01-05' },
    ];
    const regNames = this._regulations.map(r => r.name);
    this._crossRegulationMatrix = [];
    for (let i = 0; i < regNames.length; i++) {
      for (let j = i + 1; j < regNames.length; j++) {
        this._crossRegulationMatrix.push({
          source: regNames[i], target: regNames[j],
          commonControls: Math.round(15 + Math.random() * 25),
          gaps: Math.round(Math.random() * 8),
        });
      }
    }
  }

  private _getUnifiedControlSet(): Array<{control: string; regulations: string[]; coverage: number}> {
    return [
      { control: 'Access Control', regulations: ['GDPR', 'HIPAA', 'PCI DSS', 'SOX', 'ISO 27001'], coverage: 100 },
      { control: 'Encryption', regulations: ['GDPR', 'HIPAA', 'PCI DSS', 'ISO 27001'], coverage: 80 },
      { control: 'Audit Logging', regulations: ['SOX', 'PCI DSS', 'ISO 27001'], coverage: 60 },
      { control: 'Incident Response', regulations: ['GDPR', 'HIPAA', 'ISO 27001'], coverage: 60 },
      { control: 'Data Retention', regulations: ['GDPR', 'HIPAA', 'SOX'], coverage: 60 },
      { control: 'Vulnerability Mgmt', regulations: ['PCI DSS', 'ISO 27001'], coverage: 40 },
    ];
  }

  private _getRegulatoryChangeImpact(): Array<{regulation: string; change: string; impact: string; deadline: string; readiness: number}> {
    return [
      { regulation: 'GDPR', change: 'AI Act Integration', impact: 'High - New AI governance requirements', deadline: '2026-08-01', readiness: 45 },
      { regulation: 'PCI DSS 5.0', change: 'v5.0 Mandatory', impact: 'Medium - Enhanced authentication requirements', deadline: '2027-03-31', readiness: 60 },
      { regulation: 'ISO 27001', change: '2025 Amendment', impact: 'Low - Minor clause updates', deadline: '2026-12-31', readiness: 80 },
    ];
  }

  private _renderRegulatoryMapping(): string {
    if (this._regulations.length === 0) this._initRegulatoryMapping();
    let html = `<div style="padding:12px"><h4 style="margin:0 0 8px;color:#f1f5f9">Regulatory Mapping</h4>`;
    html += `<div style="display:grid;gap:4px;margin-bottom:8px">`;
    for (const reg of this._regulations) {
      const statusColor = reg.status === 'certified' ? '#22c55e' : reg.status === 'compliant' ? '#3b82f6' : '#f59e0b';
      html += `<div style="display:flex;align-items:center;gap:6px;padding:4px 6px;background:#0f172a;border-radius:4px">`;
      html += `<span style="font-size:11px;font-weight:600;color:#e2e8f0;width:80px">${reg.name}</span>`;
      html += `<span style="font-size:9px;color:#94a3b8">${reg.controls} controls</span>`;
      html += `<span style="font-size:9px;color:#94a3b8">${reg.overlap}% overlap</span>`;
      html += `<span style="font-size:9px;padding:1px 4px;background:${statusColor}22;color:${statusColor};border-radius:3px">${reg.status}</span></div>`;
    }
    html += `</div>`;
    const changes = this._getRegulatoryChangeImpact();
    html += `<div style="font-size:11px;color:#f97316;margin-bottom:4px">Regulatory Changes:</div>`;
    for (const c of changes) {
      html += `<div style="padding:3px 6px;background:rgba(249,115,22,0.08);border-left:2px solid #f97316;margin-bottom:3px;font-size:9px;color:#cbd5e1">`;
      html += `<strong>${c.regulation}</strong>: ${c.change} - ${c.impact}<br/>Deadline: ${c.deadline} | Readiness: ${c.readiness}%</div>`;
    }
    html += `</div>`;
    return html;
  }

  // ── Security Team Performance ─────────────────────────────────────
  private _teamMembers: Array<{name: string; role: string; kpis: Array<{name: string; value: number; target: number}>; workload: number; trend: string}> = [];
  private _teamSkillCoverage: Array<{skill: string; coverage: number; analysts: number}> = [];

  private _initTeamPerformance(): void {
    this._teamMembers = [
      { name: 'Alice Chen', role: 'SOC Lead', kpis: [
        { name: 'MTTD', value: 12, target: 15 }, { name: 'MTTR', value: 45, target: 60 },
        { name: 'Incidents Closed', value: 34, target: 30 }, { name: 'False Positive Rate', value: 8, target: 10 },
        { name: 'Escalations', value: 3, target: 5 }, { name: 'Report Quality', value: 92, target: 85 },
        { name: 'Training Hours', value: 18, target: 20 }, { name: 'Certifications', value: 4, target: 3 },
      ], workload: 85, trend: 'improving' },
      { name: 'Bob Martinez', role: 'IR Specialist', kpis: [
        { name: 'MTTD', value: 18, target: 15 }, { name: 'MTTR', value: 72, target: 60 },
        { name: 'Incidents Closed', value: 28, target: 30 }, { name: 'False Positive Rate', value: 12, target: 10 },
        { name: 'Escalations', value: 4, target: 5 }, { name: 'Report Quality', value: 88, target: 85 },
        { name: 'Training Hours', value: 14, target: 20 }, { name: 'Certifications', value: 3, target: 3 },
      ], workload: 72, trend: 'stable' },
      { name: 'Carol Williams', role: 'Threat Hunter', kpis: [
        { name: 'MTTD', value: 8, target: 15 }, { name: 'MTTR', value: 55, target: 60 },
        { name: 'Incidents Closed', value: 22, target: 30 }, { name: 'False Positive Rate', value: 6, target: 10 },
        { name: 'Escalations', value: 2, target: 5 }, { name: 'Report Quality', value: 95, target: 85 },
        { name: 'Training Hours', value: 22, target: 20 }, { name: 'Certifications', value: 5, target: 3 },
      ], workload: 90, trend: 'excelling' },
    ];
    this._teamSkillCoverage = [
      { skill: 'Incident Response', coverage: 85, analysts: 3 },
      { skill: 'Malware Analysis', coverage: 60, analysts: 2 },
      { skill: 'Threat Hunting', coverage: 70, analysts: 2 },
      { skill: 'Forensics', coverage: 45, analysts: 1 },
      { skill: 'Cloud Security', coverage: 55, analysts: 2 },
      { skill: 'Network Analysis', coverage: 75, analysts: 2 },
      { skill: 'Reverse Engineering', coverage: 30, analysts: 1 },
      { skill: 'Compliance', coverage: 80, analysts: 3 },
    ];
  }

  private _getTeamWorkloadDistribution(): Array<{range: string; count: number; color: string}> {
    return [
      { range: '0-40%', count: 0, color: '#22c55e' },
      { range: '41-60%', count: 1, color: '#3b82f6' },
      { range: '61-80%', count: 2, color: '#eab308' },
      { range: '81-100%', count: 3, color: '#f97316' },
      { range: 'Overloaded', count: 1, color: '#ef4444' },
    ];
  }

  private _getTrainingRecommendations(): Array<{analyst: string; course: string; priority: string; estimatedHours: number}> {
    return [
      { analyst: 'Bob Martinez', course: 'Advanced Forensics (GCFE)', priority: 'High', estimatedHours: 40 },
      { analyst: 'Alice Chen', course: 'Cloud Security (CCSP)', priority: 'Medium', estimatedHours: 30 },
      { analyst: 'Team', course: 'MITRE ATT&CK Practitioner', priority: 'High', estimatedHours: 20 },
    ];
  }

  private _renderTeamPerformance(): string {
    if (this._teamMembers.length === 0) this._initTeamPerformance();
    let html = `<div style="padding:12px"><h4 style="margin:0 0 8px;color:#f1f5f9">Team Performance</h4>`;
    for (const member of this._teamMembers) {
      const metCount = member.kpis.filter(k => {
        if (k.name === 'False Positive Rate') return k.value <= k.target;
        return k.value >= k.target;
      }).length;
      const kpiPct = Math.round((metCount / member.kpis.length) * 100);
      const trendColor = member.trend === 'excelling' ? '#22c55e' : member.trend === 'improving' ? '#3b82f6' : '#eab308';
      html += `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:8px;margin-bottom:6px">`;
      html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">`;
      html += `<span style="font-size:11px;font-weight:600;color:#e2e8f0">${member.name} <span style="color:#64748b;font-weight:400">(${member.role})</span></span>`;
      html += `<span style="font-size:10px;color:${trendColor}">${member.trend}</span></div>`;
      html += `<div style="display:flex;gap:8px;margin-bottom:4px">`;
      html += `<span style="font-size:9px;color:#94a3b8">KPIs: ${metCount}/${member.kpis.length} met</span>`;
      html += `<span style="font-size:9px;color:#94a3b8">Workload: ${member.workload}%</span></div>`;
      html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px">`;
      for (const kpi of member.kpis) {
        const met = kpi.name === 'False Positive Rate' ? kpi.value <= kpi.target : kpi.value >= kpi.target;
        const color = met ? '#22c55e' : '#ef4444';
        html += `<div style="font-size:9px;color:#94a3b8"><span style="color:${color}">${met ? '●' : '○'}</span> ${kpi.name}: <span style="color:${color}">${kpi.value}</span>/${kpi.target}</div>`;
      }
      html += `</div></div>`;
    }
    html += `</div>`;
    return html;
  }

  // --- Security Scenario Planning Methods (SETI) ---
  private _initSetiScenarios(): void {
    const worstCaseScenarios = [
      { id: "seti-sc-01", name: "Ransomware Attack on Critical Infrastructure", category: "Malware", impact: 9500000, probability: 0.12, recoveryDays: 21, affectedSystems: 47, dataLossGb: 320, businessImpact: "critical" },
      { id: "seti-sc-02", name: "Insider Data Exfiltration via Authorized Channels", category: "Insider Threat", impact: 7200000, probability: 0.18, recoveryDays: 14, affectedSystems: 12, dataLossGb: 85, businessImpact: "high" },
      { id: "seti-sc-03", name: "Supply Chain Compromise via Third-Party Library", category: "Supply Chain", impact: 6800000, probability: 0.09, recoveryDays: 30, affectedSystems: 63, dataLossGb: 0, businessImpact: "critical" },
      { id: "seti-sc-04", name: "Cloud Misconfiguration Leading to Public Exposure", category: "Cloud", impact: 4100000, probability: 0.22, recoveryDays: 7, affectedSystems: 8, dataLossGb: 450, businessImpact: "high" },
      { id: "seti-sc-05", name: "Zero-Day Exploit in Core Application Framework", category: "Vulnerability", impact: 8900000, probability: 0.05, recoveryDays: 45, affectedSystems: 120, dataLossGb: 0, businessImpact: "critical" },
      { id: "seti-sc-06", name: "Distributed Denial of Service on Customer-Facing Services", category: "Availability", impact: 3400000, probability: 0.25, recoveryDays: 3, affectedSystems: 15, dataLossGb: 0, businessImpact: "medium" },
      { id: "seti-sc-07", name: "Credential Stuffing and Account Takeover Wave", category: "Identity", impact: 2800000, probability: 0.30, recoveryDays: 5, affectedSystems: 6, dataLossGb: 12, businessImpact: "medium" },
      { id: "seti-sc-08", name: "Physical Security Breach at Data Center Facility", category: "Physical", impact: 12000000, probability: 0.02, recoveryDays: 60, affectedSystems: 200, dataLossGb: 5000, businessImpact: "critical" },
    ];
    this._setiScenarios = worstCaseScenarios.map(s => ({ ...s, mitigationCost: Math.round(s.impact * 0.08), drillScheduled: false, lastDrillDate: null, drillScore: null, controlGaps: Math.floor(Math.random() * 5) + 1 }));
  }

  private _calculateSetiScenarioRisk(): void {
    this._setiScenarios.forEach(s => {
      const riskScore = s.impact * s.probability;
      s.riskScore = Math.round(riskScore);
      s.riskLevel = riskScore > 1000000 ? "extreme" : riskScore > 500000 ? "high" : riskScore > 200000 ? "medium" : "low";
      s.mitigationPriority = s.riskScore > 500000 ? "immediate" : s.riskScore > 200000 ? "planned" : "monitor";
      s.residualRisk = Math.round(s.riskScore * (1 - (s.controlGaps * 0.12)));
      s.bciScore = Math.round((s.recoveryDays * 0.3 + s.affectedSystems * 0.4 + (s.dataLossGb > 0 ? 0.3 : 0)) * 100);
    });
  }

  private _scheduleSetiDrills(): void {
    const drillCadence = { quarterly: ["Q1", "Q2", "Q3", "Q4"], semiAnnual: ["H1", "H2"], annual: ["FY"] };
    this._setiScenarios.forEach(s => {
      if (s.probability > 0.15 && s.businessImpact === "critical") s.drillCadence = "quarterly";
      else if (s.probability > 0.10 || s.businessImpact === "high") s.drillCadence = "semiAnnual";
      else s.drillCadence = "annual";
      const periods = drillCadence[s.drillCadence as keyof typeof drillCadence];
      s.nextDrillDate = periods[Math.floor(Math.random() * periods.length)] + "-2026";
    });
  }

  private _setiScenarioComparison(): Record<string, unknown>[] {
    return this._setiScenarios.map(s => ({
      scenario: s.name, impact: s.impact, probability: s.probability, risk: s.riskScore,
      level: s.riskLevel, recovery: s.recoveryDays + "d", priority: s.mitigationPriority,
      residual: s.residualRisk, bci: s.bciScore, gaps: s.controlGaps
    }));
  }

  // --- Security Control Effectiveness Analytics (SETI) ---
  private _initSetiControls(): void {
    const controls = [
      { id: "seti-ct-01", name: "Network Segmentation", type: "preventive", maturity: "defined", score: 82, target: 90, failures: 3, lastTest: "2026-03-15" },
      { id: "seti-ct-02", name: "Endpoint Detection and Response", type: "detective", maturity: "managed", score: 88, target: 92, failures: 1, lastTest: "2026-04-01" },
      { id: "seti-ct-03", name: "Data Loss Prevention", type: "preventive", maturity: "repeatable", score: 71, target: 85, failures: 7, lastTest: "2026-03-22" },
      { id: "seti-ct-04", name: "Security Information and Event Management", type: "detective", maturity: "managed", score: 85, target: 90, failures: 2, lastTest: "2026-04-05" },
      { id: "seti-ct-05", name: "Identity and Access Management", type: "preventive", maturity: "defined", score: 76, target: 88, failures: 5, lastTest: "2026-03-28" },
      { id: "seti-ct-06", name: "Vulnerability Management", type: "corrective", maturity: "managed", score: 80, target: 90, failures: 4, lastTest: "2026-04-02" },
      { id: "seti-ct-07", name: "Email Security Gateway", type: "preventive", maturity: "managed", score: 90, target: 95, failures: 1, lastTest: "2026-04-08" },
      { id: "seti-ct-08", name: "Web Application Firewall", type: "preventive", maturity: "managed", score: 87, target: 92, failures: 2, lastTest: "2026-03-30" },
      { id: "seti-ct-09", name: "Patch Management", type: "corrective", maturity: "defined", score: 68, target: 85, failures: 9, lastTest: "2026-03-18" },
      { id: "seti-ct-10", name: "Encryption at Rest", type: "preventive", maturity: "managed", score: 93, target: 95, failures: 0, lastTest: "2026-04-10" },
      { id: "seti-ct-11", name: "Encryption in Transit", type: "preventive", maturity: "optimized", score: 96, target: 98, failures: 0, lastTest: "2026-04-12" },
      { id: "seti-ct-12", name: "Privileged Access Management", type: "preventive", maturity: "defined", score: 74, target: 88, failures: 6, lastTest: "2026-03-25" },
      { id: "seti-ct-13", name: "Security Awareness Training", type: "preventive", maturity: "repeatable", score: 65, target: 80, failures: 11, lastTest: "2026-03-20" },
      { id: "seti-ct-14", name: "Incident Response Plan", type: "corrective", maturity: "managed", score: 78, target: 88, failures: 4, lastTest: "2026-04-03" },
      { id: "seti-ct-15", name: "Backup and Recovery", type: "corrective", maturity: "managed", score: 84, target: 92, failures: 3, lastTest: "2026-04-06" },
      { id: "seti-ct-16", name: "Multi-Factor Authentication", type: "preventive", maturity: "managed", score: 91, target: 95, failures: 1, lastTest: "2026-04-09" },
      { id: "seti-ct-17", name: "Network Traffic Analysis", type: "detective", maturity: "defined", score: 72, target: 85, failures: 5, lastTest: "2026-03-27" },
      { id: "seti-ct-18", name: "Cloud Security Posture Management", type: "detective", maturity: "repeatable", score: 69, target: 82, failures: 8, lastTest: "2026-03-24" },
      { id: "seti-ct-19", name: "Container Security Scanning", type: "preventive", maturity: "defined", score: 75, target: 85, failures: 5, lastTest: "2026-04-04" },
      { id: "seti-ct-20", name: "API Security Gateway", type: "preventive", maturity: "repeatable", score: 70, target: 82, failures: 7, lastTest: "2026-03-29" },
      { id: "seti-ct-21", name: "Threat Intelligence Platform", type: "detective", maturity: "managed", score: 83, target: 90, failures: 2, lastTest: "2026-04-07" },
      { id: "seti-ct-22", name: "Database Activity Monitoring", type: "detective", maturity: "defined", score: 67, target: 80, failures: 8, lastTest: "2026-03-21" },
      { id: "seti-ct-23", name: "Deception Technology", type: "detective", maturity: "initial", score: 55, target: 75, failures: 12, lastTest: "2026-03-16" },
      { id: "seti-ct-24", name: "Security Orchestration Automation", type: "corrective", maturity: "repeatable", score: 73, target: 85, failures: 6, lastTest: "2026-04-01" },
      { id: "seti-ct-25", name: "Third-Party Risk Assessment", type: "preventive", maturity: "defined", score: 64, target: 78, failures: 9, lastTest: "2026-03-19" },
    ];
    this._setiControls = controls;
  }

  private _analyzeSetiControlEffectiveness(): void {
    const typeBreakdown: Record<string, { total: number; avgScore: number; avgFailures: number }> = {};
    this._setiControls.forEach(c => {
      if (!typeBreakdown[c.type]) typeBreakdown[c.type] = { total: 0, avgScore: 0, avgFailures: 0 };
      typeBreakdown[c.type].total++;
      typeBreakdown[c.type].avgScore += c.score;
      typeBreakdown[c.type].avgFailures += c.failures;
    });
    Object.keys(typeBreakdown).forEach(t => {
      typeBreakdown[t].avgScore = Math.round(typeBreakdown[t].avgScore / typeBreakdown[t].total);
      typeBreakdown[t].avgFailures = Math.round(typeBreakdown[t].avgFailures / typeBreakdown[t].total * 10) / 10;
    });
    this._setiControlTypeBreakdown = typeBreakdown;
  }

  private _setiControlOptimization(): Record<string, unknown>[] {
    return this._setiControls.filter(c => c.score < c.target).map(c => ({
      control: c.name, current: c.score, target: c.target, gap: c.target - c.score,
      failures: c.failures, maturity: c.maturity, recommendation:
        c.score < 70 ? "Critical: Immediate improvement required" :
        c.score < 80 ? "Significant: Plan improvement sprint" :
        "Moderate: Fine-tune and optimize"
    })).sort((a: any, b: any) => (b.gap as number) - (a.gap as number));
  }

  // --- Security Data Pipeline Health (SETI) ---
  private _initSetiPipelines(): void {
    const pipelines = [
      { id: "seti-pl-01", name: "SIEM Log Ingestion", status: "healthy", healthScore: 94, latencyMs: 120, freshnessMin: 2, errorRate: 0.02, throughputMbps: 450, recordsPerSec: 12000, backPressure: 0.05, uptime: 99.97 },
      { id: "seti-pl-02", name: "Threat Feed Aggregation", status: "healthy", healthScore: 91, latencyMs: 300, freshnessMin: 15, errorRate: 0.05, throughputMbps: 85, recordsPerSec: 3200, backPressure: 0.08, uptime: 99.92 },
      { id: "seti-pl-03", name: "Vulnerability Scan Results", status: "degraded", healthScore: 72, latencyMs: 2500, freshnessMin: 60, errorRate: 0.15, throughputMbps: 25, recordsPerSec: 800, backPressure: 0.35, uptime: 98.50 },
      { id: "seti-pl-04", name: "Endpoint Telemetry Stream", status: "healthy", healthScore: 88, latencyMs: 450, freshnessMin: 5, errorRate: 0.08, throughputMbps: 280, recordsPerSec: 8500, backPressure: 0.12, uptime: 99.85 },
      { id: "seti-pl-05", name: "Cloud Audit Log Pipeline", status: "healthy", healthScore: 86, latencyMs: 600, freshnessMin: 10, errorRate: 0.06, throughputMbps: 150, recordsPerSec: 4500, backPressure: 0.10, uptime: 99.80 },
      { id: "seti-pl-06", name: "Identity Event Stream", status: "warning", healthScore: 78, latencyMs: 1200, freshnessMin: 20, errorRate: 0.12, throughputMbps: 45, recordsPerSec: 1500, backPressure: 0.22, uptime: 99.40 },
      { id: "seti-pl-07", name: "Network Flow Collection", status: "healthy", healthScore: 82, latencyMs: 800, freshnessMin: 8, errorRate: 0.09, throughputMbps: 650, recordsPerSec: 18000, backPressure: 0.15, uptime: 99.70 },
      { id: "seti-pl-08", name: "DLP Incident Pipeline", status: "degraded", healthScore: 68, latencyMs: 3500, freshnessMin: 45, errorRate: 0.20, throughputMbps: 18, recordsPerSec: 500, backPressure: 0.42, uptime: 97.80 },
    ];
    this._setiPipelines = pipelines.map(p => ({ ...p, dependencies: [], slaBreached: p.healthScore < 75, alertThreshold: p.errorRate > 0.15 }));
    this._setiPipelines[0].dependencies = ["seti-pl-04", "seti-pl-07"];
    this._setiPipelines[4].dependencies = ["seti-pl-01"];
    this._setiPipelines[5].dependencies = ["seti-pl-02"];
    this._setiPipelines[7].dependencies = ["seti-pl-04", "seti-pl-05"];
  }

  private _setiPipelineTrend(): Record<string, unknown>[] {
    const hours = Array.from({ length: 24 }, (_, i) => `H${String(i).padStart(2, "0")}`);
    return this._setiPipelines.map(p => ({
      pipeline: p.name, status: p.status, health: p.healthScore,
      latency: p.latencyMs, freshness: p.freshnessMin, errors: p.errorRate,
      throughput: p.throughputMbps, recordsSec: p.recordsPerSec, slaOk: !p.slaBreached,
      hourlyHealth: hours.map(h => Math.max(50, p.healthScore + Math.floor(Math.random() * 20) - 10))
    }));
  }

  // --- Security Stakeholder Report Generator (SETI) ---
  private _initSetiReportTemplates(): void {
    this._setiReportTemplates = [
      { id: "seti-rp-01", name: "Board Security Report", audience: "board", frequency: "quarterly", sections: 6, autoGenerate: true, lastGenerated: "2026-03-31", pages: 12 },
      { id: "seti-rp-02", name: "Executive Risk Summary", audience: "executive", frequency: "monthly", sections: 8, autoGenerate: true, lastGenerated: "2026-04-01", pages: 8 },
      { id: "seti-rp-03", name: "Technical Security Review", audience: "technical", frequency: "weekly", sections: 12, autoGenerate: true, lastGenerated: "2026-04-21", pages: 25 },
      { id: "seti-rp-04", name: "Audit Compliance Report", audience: "audit", frequency: "quarterly", sections: 10, autoGenerate: false, lastGenerated: "2026-03-15", pages: 35 },
      { id: "seti-rp-05", name: "Regulatory Filing Package", audience: "regulatory", frequency: "annual", sections: 15, autoGenerate: false, lastGenerated: "2025-12-31", pages: 48 },
    ];
  }

  private _generateSetiExecSummary(): string {
    const totalRisk = this._setiScenarios.reduce((sum: number, s: any) => sum + s.riskScore, 0);
    const avgControl = Math.round(this._setiControls.reduce((sum: number, c: any) => sum + c.score, 0) / this._setiControls.length);
    const degradedPipes = this._setiPipelines.filter((p: any) => p.status !== "healthy").length;
    return `Overall risk exposure: ${(totalRisk / 1000000).toFixed(1)}M. Average control effectiveness: {avgControl}%. {degradedPipes} pipeline(s) need attention. {this._setiScenarios.filter((s: any) => s.mitigationPriority === "immediate").length} scenarios require immediate action.`;
  }

  // --- Security Technology Radar (SETI) ---
  private _initSetiTechRadar(): void {
    this._setiTechRadar = [
      { id: "seti-tr-01", name: "AI-Powered Threat Detection", ring: "adopt", category: "Detection", maturity: 4, trend: "up", investment: "high", roi: 3.2, vendorCount: 8 },
      { id: "seti-tr-02", name: "Zero Trust Architecture", ring: "adopt", category: "Architecture", maturity: 4, trend: "up", investment: "high", roi: 2.8, vendorCount: 12 },
      { id: "seti-tr-03", name: "SASE/SSE Platform", ring: "trial", category: "Network", maturity: 3, trend: "up", investment: "medium", roi: 2.4, vendorCount: 10 },
      { id: "seti-tr-04", name: "CNAPP Cloud Security", ring: "trial", category: "Cloud", maturity: 3, trend: "up", investment: "medium", roi: 2.1, vendorCount: 7 },
      { id: "seti-tr-05", name: "Extended Detection and Response", ring: "adopt", category: "Detection", maturity: 4, trend: "stable", investment: "high", roi: 2.9, vendorCount: 9 },
      { id: "seti-tr-06", name: "Quantum-Safe Cryptography", ring: "assess", category: "Crypto", maturity: 2, trend: "up", investment: "low", roi: 0.8, vendorCount: 4 },
      { id: "seti-tr-07", name: "Security Service Edge", ring: "trial", category: "Network", maturity: 3, trend: "up", investment: "medium", roi: 2.0, vendorCount: 6 },
      { id: "seti-tr-08", name: "SOAR 2.0 Autonomous SOC", ring: "assess", category: "Operations", maturity: 2, trend: "up", investment: "low", roi: 1.2, vendorCount: 5 },
      { id: "seti-tr-09", name: "Software Supply Chain Security", ring: "trial", category: "DevSecOps", maturity: 3, trend: "up", investment: "medium", roi: 2.3, vendorCount: 8 },
      { id: "seti-tr-10", name: "Identity Threat Detection", ring: "adopt", category: "Identity", maturity: 3, trend: "up", investment: "high", roi: 2.7, vendorCount: 7 },
      { id: "seti-tr-11", name: "Data Security Posture Management", ring: "trial", category: "Data", maturity: 3, trend: "up", investment: "medium", roi: 2.2, vendorCount: 9 },
      { id: "seti-tr-12", name: "Decentralized Identity Standards", ring: "hold", category: "Identity", maturity: 1, trend: "stable", investment: "low", roi: 0.5, vendorCount: 3 },
    ];
  }

  private _setiRadarSummary(): Record<string, unknown> {
    const rings: Record<string, number> = { adopt: 0, trial: 0, assess: 0, hold: 0 };
    this._setiTechRadar.forEach(t => { if (rings[t.ring as keyof typeof rings] !== undefined) rings[t.ring as keyof typeof rings]++; });
    return { adopt: rings.adopt, trial: rings.trial, assess: rings.assess, hold: rings.hold, total: this._setiTechRadar.length, avgMaturity: 2.8, topInvestment: this._setiTechRadar.filter(t => t.investment === "high").map(t => t.name) };
  }

  // --- SETI Security Compliance Mapping Matrix ---
  private _initSetiComplianceMatrix(): void {
    const frameworks = ["ISO 27001", "SOC 2 Type II", "PCI DSS 4.0", "NIST CSF 2.0", "GDPR", "HIPAA", "FedRAMP", "CIS Controls v8"];
    const domains = ["Access Control", "Data Protection", "Network Security", "Endpoint Security", "Incident Response", "Risk Management", "Asset Management", "Compliance Monitoring"];
    this._setiComplianceMatrix = frameworks.map(fw => ({
      framework: fw, totalControls: Math.floor(Math.random() * 60) + 80, implemented: Math.floor(Math.random() * 40) + 50,
      partial: Math.floor(Math.random() * 20) + 10, gaps: Math.floor(Math.random() * 15) + 3,
      lastAudit: "2026-" + String(Math.floor(Math.random() * 4) + 1).padStart(2, "0") + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0"),
      nextAudit: "2027-" + String(Math.floor(Math.random() * 6) + 1).padStart(2, "0") + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0"),
      score: Math.floor(Math.random() * 20) + 72, status: Math.random() > 0.3 ? "compliant" : "partial",
      domains: domains.map(d => ({ domain: d, controls: Math.floor(Math.random() * 10) + 5, passed: Math.floor(Math.random() * 8) + 2 }))
    }));
  }

  private _setiComplianceTrend(): Record<string, unknown>[] {
    const quarters = ["Q1-2025", "Q2-2025", "Q3-2025", "Q4-2025", "Q1-2026", "Q2-2026"];
    return this._setiComplianceMatrix.map(fw => ({
      framework: fw, score: fw.score, status: fw.status,
      trend: quarters.map(q => Math.min(100, fw.score - 15 + Math.floor(Math.random() * 20))),
      gaps: fw.gaps, implemented: fw.implemented, total: fw.totalControls,
      coverage: Math.round((fw.implemented / fw.totalControls) * 100)
    }));
  }

  // --- SETI Threat Intelligence Correlation Engine ---
  private _initSetiThreatIntel(): void {
    const threatActors = ["APT29", "APT41", "Lazarus Group", "FIN7", "Conti", "Sandworm", "Fancy Bear", "Tick Group"];
    const techniques = ["T1059.001", "T1190", "T1566.001", "T1078", "T1055", "T1486", "T1021.001", "T1071.001"];
    const sectors = ["Finance", "Healthcare", "Technology", "Government", "Energy", "Manufacturing", "Retail", "Telecom"];
    this._setiThreatIntel = threatActors.map((actor, i) => ({
      actor, sophistication: ["advanced", "advanced", "moderate", "advanced", "moderate", "advanced", "advanced", "moderate"][i],
      targeting: sectors.slice(0, Math.floor(Math.random() * 4) + 2),
      primaryTechniques: techniques.slice(Math.floor(Math.random() * 3), Math.floor(Math.random() * 3) + 4),
      confidence: Math.floor(Math.random() * 30) + 65, lastObserved: "2026-04-" + String(Math.floor(Math.random() * 22) + 1).padStart(2, "0"),
      iocCount: Math.floor(Math.random() * 200) + 50, attributedCampaigns: Math.floor(Math.random() * 8) + 1,
      mitreTactics: ["Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion"].slice(0, Math.floor(Math.random() * 3) + 2),
      riskScore: Math.floor(Math.random() * 40) + 55, alertsTriggered: Math.floor(Math.random() * 30) + 5
    }));
  }

  private _setiThreatCorrelation(): Record<string, unknown>[] {
    return this._setiThreatIntel.filter(t => t.riskScore > 70).map(t => ({
      actor: t.actor, risk: t.riskScore, confidence: t.confidence,
      techniques: t.primaryTechniques, targeting: t.targeting,
      lastSeen: t.lastObserved, iocs: t.iocCount, campaigns: t.attributedCampaigns,
      recommendation: t.riskScore > 85 ? "Immediate defensive action required" : t.riskScore > 75 ? "Enhanced monitoring recommended" : "Standard monitoring sufficient"
    })).sort((a: any, b: any) => (b.risk as number) - (a.risk as number));
  }

  // --- SETI Security Metrics Deep Dive ---
  private _initSetiMetricsDeep(): void {
    const metricCategories = ["Detection Coverage", "Response Efficiency", "Prevention Effectiveness", "Recovery Speed", "Compliance Adherence"];
    this._setiMetricsDeep = metricCategories.map(cat => ({
      category: cat, metrics: Array.from({ length: 6 }, (_, i) => ({
        name: `${cat} Metric ${i + 1}`, value: Math.floor(Math.random() * 40) + 55,
        target: Math.floor(Math.random() * 15) + 82, unit: ["%", "ms", "count", "score"][Math.floor(Math.random() * 4)],
        trend: Math.random() > 0.4 ? "improving" : "stable", period: "30d",
        baseline: Math.floor(Math.random() * 20) + 50, benchmark: Math.floor(Math.random() * 10) + 80
      })),
      overallScore: Math.floor(Math.random() * 20) + 70, maturity: ["initial", "developing", "defined", "managed", "optimized"][Math.floor(Math.random() * 5)]
    }));
  }

  private _setiMetricsHeatmap(): number[][] {
    return this._setiMetricsDeep.map(cat =>
      cat.metrics.map(m => Math.round((m.value / m.target) * 100))
    );
  }

  // --- SETI Incident Cost Modeling ---
  private _initSetiCostModel(): void {
    const incidentTypes = ["Data Breach", "Ransomware", "DDoS", "Insider Threat", "Phishing", "Supply Chain", "Cloud Misconfig", "Zero-Day"];
    this._setiCostModel = incidentTypes.map(inc => ({
      incident: inc, avgCost: Math.floor(Math.random() * 8000000) + 1000000,
      maxCost: Math.floor(Math.random() * 20000000) + 5000000, minCost: Math.floor(Math.random() * 500000) + 100000,
      detectionTimeHrs: Math.floor(Math.random() * 200) + 10, containmentTimeHrs: Math.floor(Math.random() * 150) + 5,
      recoveryTimeHrs: Math.floor(Math.random() * 500) + 50, recordsAffected: Math.floor(Math.random() * 500000) + 10000,
      regulatoryFine: Math.floor(Math.random() * 3000000) + 200000, reputationCost: Math.floor(Math.random() * 2000000) + 500000,
      legalCost: Math.floor(Math.random() * 1500000) + 100000, notificationCost: Math.floor(Math.random() * 800000) + 50000,
      forensicsCost: Math.floor(Math.random() * 400000) + 50000, totalAnnualExposure: 0, frequency: Math.floor(Math.random() * 5) + 1
    }));
    this._setiCostModel.forEach(m => { m.totalAnnualExposure = m.avgCost * m.frequency; });
  }

  private _setiCostProjection(): Record<string, unknown>[] {
    return this._setiCostModel.map(m => ({
      incident: m.incident, avgCost: m.avgCost, annualExposure: m.totalAnnualExposure,
      frequency: m.frequency, detectionHrs: m.detectionTimeHrs, recoveryHrs: m.recoveryTimeHrs,
      records: m.recordsAffected, regulatory: m.regulatoryFine,
      roiOfInvestment: Math.round(m.avgCost * 0.15 / 100000), priority: m.totalAnnualExposure > 10000000 ? "critical" : m.totalAnnualExposure > 5000000 ? "high" : "medium"
    })).sort((a: any, b: any) => (b.annualExposure as number) - (a.annualExposure as number));
  }

  // --- SETI Security Architecture Pattern Library ---
  private _initSetiArchPatterns(): void {
    const patterns = ["Defense in Depth", "Zero Trust Network", "Microsegmentation", "Layered Encryption", "Blast Radius Minimization", "Fail Secure Design", "Least Privilege Access", "Secure-by-Default"];
    this._setiArchPatterns = patterns.map((p, i) => ({
      pattern: p, category: ["network", "identity", "network", "data", "architecture", "design", "identity", "development"][i],
      maturity: ["optimized", "managed", "defined", "managed", "repeatable", "defined", "managed", "repeatable"][i],
      implementation: Math.floor(Math.random() * 40) + 55, coverage: Math.floor(Math.random() * 30) + 60,
      components: Math.floor(Math.random() * 15) + 5, integrationPoints: Math.floor(Math.random() * 20) + 3,
      riskReduction: Math.floor(Math.random() * 25) + 60, costComplexity: ["low", "high", "medium", "medium", "high", "low", "medium", "medium"][i],
      dependencies: patterns.slice(0, Math.floor(Math.random() * 3)).filter(x => x !== p),
      lastReview: "2026-0" + String(Math.floor(Math.random() * 4) + 1) + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")
    }));
  }

  private _setiArchPatternAnalysis(): Record<string, unknown> {
    const implemented = this._setiArchPatterns.filter(p => p.implementation > 75).length;
    const avgCoverage = Math.round(this._setiArchPatterns.reduce((s: number, p: any) => s + p.coverage, 0) / this._setiArchPatterns.length);
    return {
      totalPatterns: this._setiArchPatterns.length, fullyImplemented: implemented, avgCoverage,
      avgRiskReduction: Math.round(this._setiArchPatterns.reduce((s: number, p: any) => s + p.riskReduction, 0) / this._setiArchPatterns.length),
      gaps: this._setiArchPatterns.filter(p => p.implementation < 60).map(p => p.pattern),
      recommendations: this._setiArchPatterns.filter(p => p.implementation < 70).map(p => ({ pattern: p.pattern, current: p.implementation, target: 85, effort: p.costComplexity }))
    };
  }




  // === Security Metrics Forecasting Module ===
  private _metricsForecastData: Array<{metric:string;current:number;unit:string;forecast1m:number;forecast3m:number;forecast6m:number;confidence:number;direction:string;seasonalFactor:number;anomalyFlag:boolean}> = [];
  private _metricsHistoricalData: Array<{month:string;mttr:number;mttd:number;vulnCount:number;patchRate:number;incidentCount:number;trainingRate:number}> = [];
  private _metricsForecastChart: string = '';
  private _metricsAnomalies: Array<{metric:string;expected:number;actual:number;deviation:number;severity:string;date:string}> = [];

  private _initMetricsForecasting(): void {
    this._metricsForecastData = [
      {metric:'Mean Time to Respond (MTTR)',current:4.2,unit:'hours',forecast1m:3.8,forecast3m:3.2,forecast6m:2.8,confidence:0.87,direction:'improving',seasonalFactor:0.95,anomalyFlag:false},
      {metric:'Mean Time to Detect (MTTD)',current:2.1,unit:'hours',forecast1m:1.9,forecast3m:1.5,forecast6m:1.2,confidence:0.82,direction:'improving',seasonalFactor:1.02,anomalyFlag:false},
      {metric:'Open Vulnerabilities',current:342,unit:'count',forecast1m:310,forecast3m:280,forecast6m:250,confidence:0.74,direction:'improving',seasonalFactor:1.08,anomalyFlag:true},
      {metric:'Patch Compliance Rate',current:87.3,unit:'%',forecast1m:89.1,forecast3m:91.5,forecast6m:93.2,confidence:0.79,direction:'improving',seasonalFactor:0.98,anomalyFlag:false},
      {metric:'Phishing Click Rate',current:3.2,unit:'%',forecast1m:2.9,forecast3m:2.5,forecast6m:2.1,confidence:0.71,direction:'improving',seasonalFactor:1.15,anomalyFlag:false},
      {metric:'Security Incidents / Month',current:12,unit:'count',forecast1m:11,forecast3m:10,forecast6m:9,confidence:0.68,direction:'improving',seasonalFactor:1.05,anomalyFlag:false},
      {metric:'False Positive Rate',current:18.5,unit:'%',forecast1m:16.2,forecast3m:14.0,forecast6m:12.5,confidence:0.76,direction:'improving',seasonalFactor:0.97,anomalyFlag:true},
      {metric:'Endpoint Compliance',current:94.1,unit:'%',forecast1m:95.0,forecast3m:96.2,forecast6m:97.0,confidence:0.83,direction:'improving',seasonalFactor:0.99,anomalyFlag:false},
      {metric:'Avg Vulnerability Age',current:45.3,unit:'days',forecast1m:40.1,forecast3m:35.8,forecast6m:32.0,confidence:0.72,direction:'improving',seasonalFactor:1.03,anomalyFlag:false},
      {metric:'Third-Party Risk Score',current:72.5,unit:'score',forecast1m:70.2,forecast3m:68.0,forecast6m:65.5,confidence:0.65,direction:'improving',seasonalFactor:1.01,anomalyFlag:false},
      {metric:'Security Training Completion',current:78.4,unit:'%',forecast1m:82.0,forecast3m:86.5,forecast6m:90.0,confidence:0.81,direction:'improving',seasonalFactor:0.96,anomalyFlag:false},
      {metric:'Encryption Coverage',current:91.7,unit:'%',forecast1m:93.0,forecast3m:94.5,forecast6m:95.8,confidence:0.88,direction:'improving',seasonalFactor:1.00,anomalyFlag:false}
    ];
    this._metricsHistoricalData = [
      {month:'2025-11',mttr:5.8,mttd:3.4,vulnCount:412,patchRate:79.5,incidentCount:18,trainingRate:62.1},
      {month:'2025-12',mttr:5.5,mttd:3.1,vulnCount:398,patchRate:81.2,incidentCount:16,trainingRate:64.8},
      {month:'2026-01',mttr:5.1,mttd:2.8,vulnCount:385,patchRate:82.8,incidentCount:15,trainingRate:67.3},
      {month:'2026-02',mttr:4.8,mttd:2.5,vulnCount:371,patchRate:84.1,incidentCount:14,trainingRate:70.0},
      {month:'2026-03',mttr:4.5,mttd:2.3,vulnCount:358,patchRate:85.9,incidentCount:13,trainingRate:73.5},
      {month:'2026-04',mttr:4.2,mttd:2.1,vulnCount:342,patchRate:87.3,incidentCount:12,trainingRate:78.4}
    ];
    this._metricsAnomalies = [
      {metric:'Open Vulnerabilities',expected:355,actual:342,deviation:3.7,severity:'low',date:'2026-04-15'},
      {metric:'False Positive Rate',expected:15.0,actual:18.5,deviation:23.3,severity:'medium',date:'2026-04-10'},
      {metric:'Security Incidents / Month',expected:14,actual:12,deviation:14.3,severity:'low',date:'2026-04-20'},
      {metric:'Phishing Click Rate',expected:3.8,actual:3.2,deviation:15.8,severity:'low',date:'2026-04-18'}
    ];
  }

  private _calculateForecastTrend(metric: string): {slope:number;acceleration:number;projection:string} {
    const data = this._metricsForecastData.find(m => m.metric === metric);
    if (!data) return {slope:0,acceleration:0,projection:'insufficient data'};
    const slope = -(data.current - data.forecast6m) / 6;
    const acceleration = slope > 0 ? 0.05 : -0.02;
    const projection = data.direction === 'improving' ? 'on track for target' : 'needs intervention';
    return {slope: Math.round(slope * 100) / 100, acceleration, projection};
  }

  private _getSeasonalInsights(): Array<{season:string;riskLevel:string;factors:string[];recommendation:string}> {
    return [
      {season:'Q1 (Jan-Mar)',riskLevel:'medium',factors:['Post-holiday phishing surge','Annual security audit preparation','Budget allocation period'],recommendation:'Increase phishing simulation frequency and prepare audit documentation'},
      {season:'Q2 (Apr-Jun)',riskLevel:'high',factors:['Q2 earnings period attacks','Conference season social engineering','Summer staffing shortages'],recommendation:'Strengthen executive protection and cross-train security staff'},
      {season:'Q3 (Jul-Sep)',riskLevel:'medium',factors:['Vacation season reduced coverage','Major patch release cycles','Back-to-school phishing campaigns'],recommendation:'Automate routine tasks and ensure on-call rotation coverage'},
      {season:'Q4 (Oct-Dec)',riskLevel:'high',factors:['Holiday shopping scam surge','Year-end compliance deadlines','Black Friday attack campaigns'],recommendation:'Pre-position additional monitoring resources and finalize compliance reports early'}
    ];
  }

  private _getMetricsConfidenceSummary(): {highConfidence:number;mediumConfidence:number;lowConfidence:number;avgConfidence:number} {
    const high = this._metricsForecastData.filter(m => m.confidence >= 0.80).length;
    const medium = this._metricsForecastData.filter(m => m.confidence >= 0.70 && m.confidence < 0.80).length;
    const low = this._metricsForecastData.filter(m => m.confidence < 0.70).length;
    const avg = this._metricsForecastData.reduce((s, m) => s + m.confidence, 0) / this._metricsForecastData.length;
    return {highConfidence:high, mediumConfidence:medium, lowConfidence:low, avgConfidence:Math.round(avg * 100) / 100};
  }


  // --- Advanced Metrics Analysis ---
  private _metricsRegressionModel: {slope:number;intercept:number;rSquared:number;standardError:number;dataPoints:number;lastUpdated:string} = {slope:0,intercept:0,rSquared:0,standardError:0,dataPoints:0,lastUpdated:''};
  private _metricsCorrelations: Array<{metricA:string;metricB:string;correlation:number;strength:string;direction:string}> = [];
  private _metricsBenchmarks: Record<string, {industryAvg:number;topQuartile:number;current:number;percentile:number;gap:string}> = {};
  private _metricsGoals: Array<{metric:string;target:number;deadline:string;current:number;progress:number;onTrack:boolean}> = [];
  private _metricsAlertThresholds: Array<{metric:string;warningThreshold:number;criticalThreshold:number;currentValue:number;status:string;lastBreached:string}> = [];

  private _initAdvancedMetricsAnalysis(): void {
    this._metricsRegressionModel = {slope:-0.28,intercept:5.9,rSquared:0.94,standardError:0.15,dataPoints:6,lastUpdated:'2026-04-23T12:00:00Z'};
    this._metricsCorrelations = [
      {metricA:'Training Completion Rate',metricB:'Phishing Click Rate',correlation:-0.89,strength:'strong',direction:'negative'},
      {metricA:'Patch Compliance Rate',metricB:'Open Vulnerabilities',correlation:-0.82,strength:'strong',direction:'negative'},
      {metricA:'Endpoint Compliance',metricB:'Security Incidents',correlation:-0.76,strength:'strong',direction:'negative'},
      {metricA:'MTTD',metricB:'MTTR',correlation:0.71,strength:'moderate',direction:'positive'},
      {metricA:'False Positive Rate',metricB:'Analyst Burnout Score',correlation:0.85,strength:'strong',direction:'positive'},
      {metricA:'Encryption Coverage',metricB:'Data Breach Risk',correlation:-0.68,strength:'moderate',direction:'negative'}
    ];
    this._metricsBenchmarks = {
      'MTTR': {industryAvg:6.5,topQuartile:3.8,current:4.2,percentile:62,gap:'1.5h to top quartile'},
      'MTTD': {industryAvg:4.2,topQuartile:1.5,current:2.1,percentile:68,gap:'0.6h to top quartile'},
      'Patch Compliance': {industryAvg:72,topQuartile:92,current:87.3,percentile:71,gap:'4.7% to top quartile'},
      'Phishing Click Rate': {industryAvg:8.5,topQuartile:2.0,current:3.2,percentile:74,gap:'1.2% to top quartile'},
      'Training Completion': {industryAvg:65,topQuartile:95,current:78.4,percentile:58,gap:'16.6% to top quartile'}
    };
    this._metricsGoals = [
      {metric:'MTTR',target:3.0,deadline:'2026-09-30',current:4.2,progress:52,onTrack:true},
      {metric:'MTTD',target:1.5,deadline:'2026-09-30',current:2.1,progress:58,onTrack:true},
      {metric:'Patch Compliance Rate',target:95,deadline:'2026-12-31',current:87.3,progress:53,onTrack:true},
      {metric:'Phishing Click Rate',target:2.0,deadline:'2026-12-31',current:3.2,progress:46,onTrack:true},
      {metric:'Security Training Completion',target:95,deadline:'2026-12-31',current:78.4,progress:43,onTrack:false},
      {metric:'Open Vulnerabilities',target:200,deadline:'2026-12-31',current:342,progress:38,onTrack:false},
      {metric:'Encryption Coverage',target:98,deadline:'2026-09-30',current:91.7,progress:60,onTrack:true},
      {metric:'False Positive Rate',target:10,deadline:'2026-12-31',current:18.5,progress:27,onTrack:false}
    ];
    this._metricsAlertThresholds = [
      {metric:'MTTR',warningThreshold:5.0,criticalThreshold:8.0,currentValue:4.2,status:'normal',lastBreached:'2026-03-15'},
      {metric:'MTTD',warningThreshold:3.0,criticalThreshold:5.0,currentValue:2.1,status:'normal',lastBreached:'2026-02-20'},
      {metric:'Open Vulnerabilities',warningThreshold:400,criticalThreshold:600,currentValue:342,status:'normal',lastBreached:'2026-01-10'},
      {metric:'False Positive Rate',warningThreshold:15,criticalThreshold:25,currentValue:18.5,status:'warning',lastBreached:'2026-04-10'},
      {metric:'Phishing Click Rate',warningThreshold:5,criticalThreshold:10,currentValue:3.2,status:'normal',lastBreached:'2026-03-05'},
      {metric:'Patch Compliance Rate',warningThreshold:80,criticalThreshold:70,currentValue:87.3,status:'normal',lastBreached:'2025-12-01'}
    ];
  }

  private _getMetricsGoalSummary(): {onTrack:number;atRisk:number;behind:number;avgProgress:number} {
    const onTrack = this._metricsGoals.filter(g => g.onTrack).length;
    const behind = this._metricsGoals.filter(g => !g.onTrack && g.progress < 40).length;
    const atRisk = this._metricsGoals.length - onTrack - behind;
    const avgProgress = Math.round(this._metricsGoals.reduce((s,g) => s + g.progress, 0) / this._metricsGoals.length);
    return {onTrack, atRisk, behind, avgProgress};
  }

  private _getStrongestCorrelations(): Array<{metricA:string;metricB:string;correlation:number;insight:string}> {
    return this._metricsCorrelations
      .filter(c => c.strength === 'strong')
      .sort((a,b) => Math.abs(b.correlation) - Math.abs(a.correlation))
      .map(c => ({
        metricA: c.metricA,
        metricB: c.metricB,
        correlation: c.correlation,
        insight: c.direction === 'negative' ? 'Improving ' + c.metricA + ' will improve ' + c.metricB : 'Monitor ' + c.metricA + ' impact on ' + c.metricB
      }));
  }

  private _getMetricsAlertSummary(): {normal:number;warning:number;critical:number;mostRecentBreach:string} {
    const normal = this._metricsAlertThresholds.filter(a => a.status === 'normal').length;
    const warning = this._metricsAlertThresholds.filter(a => a.status === 'warning').length;
    const critical = this._metricsAlertThresholds.filter(a => a.status === 'critical').length;
    const mostRecent = this._metricsAlertThresholds.sort((a,b) => b.lastBreached.localeCompare(a.lastBreached))[0]?.lastBreached || 'none';
    return {normal, warning, critical, mostRecentBreach: mostRecent};
  }



  // === Security Compliance Matrix Engine ===
  private _complianceFrameworks: Array<{id:string;name:string;version:string;status:string;lastAssessed:string;complianceScore:number;controlsTotal:number;controlsCompliant:number;controlsPartial:number;controlsNonCompliant:number}> = [];
  private _complianceControlMapping: Array<{controlId:string;controlName:string;frameworkId:string;category:string;severity:string;status:string;evidenceCount:number;lastTested:string;nextReview:string;owner:string}> = [];
  private _complianceGaps: Array<{id:string;frameworkId:string;controlId:string;description:string;severity:string;remediationPlan:string;targetDate:string;status:string;assignee:string}> = [];
  private _complianceEvidenceStore: Array<{id:string;controlId:string;frameworkId:string;evidenceType:string;fileName:string;uploadedAt:string;uploadedBy:string;verifiedBy:string;verifiedAt:string;status:string}> = [];

  private _initComplianceMatrix(): void {
    this._complianceFrameworks = [
      {id:'FW-SOC2',name:'SOC 2 Type II',version:'2024',status:'active',lastAssessed:'2026-04-01',complianceScore:92.4,controlsTotal:64,controlsCompliant:52,controlsPartial:8,controlsNonCompliant:4},
      {id:'FW-ISO27001',name:'ISO 27001:2022',version:'2022',status:'active',lastAssessed:'2026-03-15',complianceScore:88.7,controlsTotal:93,controlsCompliant:74,controlsPartial:12,controlsNonCompliant:7},
      {id:'FW-PCIDSS',name:'PCI DSS 4.0',version:'4.0',status:'active',lastAssessed:'2026-04-10',complianceScore:95.1,controlsTotal:78,controlsCompliant:68,controlsPartial:6,controlsNonCompliant:4},
      {id:'FW-GDPR',name:'GDPR',version:'2018',status:'active',lastAssessed:'2026-03-20',complianceScore:86.2,controlsTotal:49,controlsCompliant:36,controlsPartial:8,controlsNonCompliant:5},
      {id:'FW-HIPAA',name:'HIPAA',version:'2013',status:'active',lastAssessed:'2026-02-28',complianceScore:84.5,controlsTotal:58,controlsCompliant:42,controlsPartial:10,controlsNonCompliant:6}
    ];
    this._complianceGaps = [
      {id:'GAP-001',frameworkId:'FW-SOC2',controlId:'CC6.1',description:'Missing multi-factor authentication for legacy systems',severity:'high',remediationPlan:'Deploy MFA to all remaining legacy systems by end of Q2',targetDate:'2026-06-30',status:'in-progress',assignee:'IT Security'},
      {id:'GAP-002',frameworkId:'FW-ISO27001',controlId:'A.12.4.1',description:'Event logging coverage incomplete for cloud services',severity:'medium',remediationPlan:'Implement centralized logging for all cloud environments',targetDate:'2026-07-31',status:'planned',assignee:'Cloud Ops'},
      {id:'GAP-003',frameworkId:'FW-GDPR',controlId:'Art.35',description:'Data Protection Impact Assessment process needs formalization',severity:'high',remediationPlan:'Establish DPIA workflow with legal review integration',targetDate:'2026-05-31',status:'in-progress',assignee:'Privacy Office'},
      {id:'GAP-004',frameworkId:'FW-HIPAA',controlId:'164.312(a)',description:'Encryption at rest not fully implemented for legacy databases',severity:'critical',remediationPlan:'Migrate legacy databases to encrypted storage or implement TDE',targetDate:'2026-06-15',status:'in-progress',assignee:'DBA Team'}
    ];
    this._complianceEvidenceStore = [
      {id:'EVD-C-001',controlId:'CC6.1',frameworkId:'FW-SOC2',evidenceType:'configuration_snapshot',fileName:'mfa-deployment-status.xlsx',uploadedAt:'2026-04-15T10:00:00Z',uploadedBy:'IT Security',verifiedBy:'Auditor',verifiedAt:'2026-04-16T14:00:00Z',status:'verified'},
      {id:'EVD-C-002',controlId:'CC7.2',frameworkId:'FW-SOC2',evidenceType:'access_log',fileName:'access-review-Q1-2026.csv',uploadedAt:'2026-04-01T09:00:00Z',uploadedBy:'IAM Team',verifiedBy:'Auditor',verifiedAt:'2026-04-05T16:00:00Z',status:'verified'},
      {id:'EVD-C-003',controlId:'A.12.4.1',frameworkId:'FW-ISO27001',evidenceType:'policy_document',fileName:'cloud-logging-policy-v3.pdf',uploadedAt:'2026-04-10T11:00:00Z',uploadedBy:'Cloud Ops',verifiedBy:'',verifiedAt:'',status:'pending_review'},
      {id:'EVD-C-004',controlId:'164.312(a)',frameworkId:'FW-HIPAA',evidenceType:'encryption_report',fileName:'encryption-coverage-audit.pdf',uploadedAt:'2026-04-12T14:00:00Z',uploadedBy:'DBA Team',verifiedBy:'Compliance',verifiedAt:'2026-04-14T10:00:00Z',status:'verified'}
    ];
  }

  private _getComplianceSummary(): {avgScore:number;totalGaps:number;criticalGaps:number;overdueGaps:number;nextAudit:string;evidencePendingReview:number} {
    const avgScore = Math.round(this._complianceFrameworks.reduce((s,f) => s + f.complianceScore, 0) / this._complianceFrameworks.length * 10) / 10;
    const criticalGaps = this._complianceGaps.filter(g => g.severity === 'critical').length;
    const overdueGaps = this._complianceGaps.filter(g => new Date(g.targetDate) < new Date() && g.status !== 'resolved').length;
    const evidencePending = this._complianceEvidenceStore.filter(e => e.status === 'pending_review').length;
    return {avgScore, totalGaps: this._complianceGaps.length, criticalGaps, overdueGaps, nextAudit:'2026-05-15', evidencePendingReview: evidencePending};
  }


  // === Cyber Kill Chain Analysis ===
  private _killChainStages: Array<{stage:string;description:string;detectionMethods:string[];mitigationActions:string[];currentThreatLevel:string;incidentCount:number;avgTimeInStage:string}> = [];
  private _killChainAttacks: Array<{id:string;name:string;stagesCompleted:string[];currentStage:string;progress:number;severity:string;targetAsset:string;startTime:string;estimatedImpact:number}> = [];
  private _killChainMetrics: {totalAttacksTracked:number;stoppedAtRecon:number;stoppedAtWeaponize:number;stoppedAtDeliver:number;stoppedAtExploit:number;stoppedAtInstall:number;stoppedAtCommand:number;stoppedAtExfiltrate:number;fullChainCompleted:number} = {totalAttacksTracked:0,stoppedAtRecon:0,stoppedAtWeaponize:0,stoppedAtDeliver:0,stoppedAtExploit:0,stoppedAtInstall:0,stoppedAtCommand:0,stoppedAtExfiltrate:0,fullChainCompleted:0};

  private _initKillChainAnalysis(): void {
    this._killChainStages = [
      {stage:'Reconnaissance',description:'Adversary researches target organization, systems, and vulnerabilities',detectionMethods:['Web analytics','DNS monitoring','Social media scanning','Honeypot alerts'],mitigationActions:['Minimize public exposure','Monitor dark web mentions','Deploy deception technology'],currentThreatLevel:'elevated',incidentCount:245,avgTimeInStage:'7-14 days'},
      {stage:'Weaponization',description:'Adversary creates malware payload or exploit tool targeting identified vulnerabilities',detectionMethods:['Threat intel feeds','YARA rules','Malware sandbox analysis'],mitigationActions:['Keep systems patched','Deploy application whitelisting','Maintain threat intel subscriptions'],currentThreatLevel:'moderate',incidentCount:89,avgTimeInStage:'3-5 days'},
      {stage:'Delivery',description:'Adversary transmits weaponized payload to target via email, web, or USB',detectionMethods:['Email filtering','Web proxy logs','Endpoint detection','Network IDS'],mitigationActions:['Email security gateway','Web filtering','User awareness training','Endpoint protection'],currentThreatLevel:'high',incidentCount:312,avgTimeInStage:'1-2 days'},
      {stage:'Exploitation',description:'Payload exploits vulnerability on target system',detectionMethods:['IDS/IPS alerts','Endpoint detection','Vulnerability scanner','SIEM correlation'],mitigationActions:['Patch management','Application hardening','Exploit prevention','Runtime protection'],currentThreatLevel:'high',incidentCount:156,avgTimeInStage:'minutes to hours'},
      {stage:'Installation',description:'Adversary installs backdoor or persistent access mechanism',detectionMethods:['File integrity monitoring','Process monitoring','Registry monitoring','Scheduled task audit'],mitigationActions:['Application whitelisting','File integrity monitoring','Privilege restriction','EDR solutions'],currentThreatLevel:'high',incidentCount:78,avgTimeInStage:'hours'},
      {stage:'Command and Control',description:'Adversary establishes communication channel for remote command execution',detectionMethods:['Network traffic analysis','DNS monitoring','Beacon detection','SSL inspection'],mitigationActions:['Egress filtering','DNS filtering','Network segmentation','Proxy enforcement'],currentThreatLevel:'high',incidentCount:67,avgTimeInStage:'days to weeks'},
      {stage:'Actions on Objectives',description:'Adversary achieves goals: data exfiltration, encryption, or destruction',detectionMethods:['DLP alerts','Anomaly detection','Data access monitoring','Network flow analysis'],mitigationActions:['DLP controls','Data encryption','Access controls','Backup verification'],currentThreatLevel:'critical',incidentCount:34,avgTimeInStage:'hours to days'}
    ];
    this._killChainAttacks = [
      {id:'KCA-001',name:'APT29 Spear Phishing Campaign',stagesCompleted:['Reconnaissance','Weaponization','Delivery'],currentStage:'Exploitation',progress:42,severity:'critical',targetAsset:'Executive Email',startTime:'2026-04-18T08:00:00Z',estimatedImpact:4500000},
      {id:'KCA-002',name:'FIN7 POS Malware Deployment',stagesCompleted:['Reconnaissance','Weaponization','Delivery','Exploitation','Installation'],currentStage:'Command and Control',progress:71,severity:'high',targetAsset:'POS Systems',startTime:'2026-04-15T14:00:00Z',estimatedImpact:2800000},
      {id:'KCA-003',name:'Ransomware-as-a-Service Operation',stagesCompleted:['Reconnaissance','Delivery','Exploitation'],currentStage:'Installation',progress:57,severity:'critical',targetAsset:'File Servers',startTime:'2026-04-20T22:00:00Z',estimatedImpact:8500000}
    ];
    this._killChainMetrics = {totalAttacksTracked:892,stoppedAtRecon:312,stoppedAtWeaponize:89,stoppedAtDeliver:245,stoppedAtExploit:156,stoppedAtInstall:78,stoppedAtCommand:45,stoppedAtExfiltrate:34,fullChainCompleted:3};
  }

  private _getKillChainSummary(): {totalTracked:number;interruptionRate:number;mostCommonStopStage:string;fullChainRate:number;topActiveAttack:string} {
    const interruptionRate = Math.round(((this._killChainMetrics.totalTrackedTracked - this._killChainMetrics.fullChainCompleted) / this._killChainMetrics.totalTrackedTracked) * 10000) / 100;
    return {totalTracked: this._killChainMetrics.totalTrackedTracked, interruptionRate, mostCommonStopStage:'Delivery', fullChainRate: 0.34, topActiveAttack: this._killChainAttacks.sort((a,b) => b.progress - a.progress)[0]?.name || ''};
  }



  // === Security Operations Center Dashboard Module ===
  private _socDashAnalysts: Array<{id:string;name:string;status:string;currentAssignment:string;alertsHandled:number;avgResponseTime:string;shift:string;skillLevel:string}> = [];
  private _socDashAlerts: Array<{id:string;severity:string;source:string;description:string;assignee:string;createdAt:string;status:string;slaDeadline:string;slaBreachRisk:boolean}> = [];
  private _socDashPerformance: {escalationRate:number;meanTimeToAck:string;meanTimeToContain:string;meanTimeToResolve:string;analystUtilization:number;shiftCoverage:number;toolsUptime:number} = {escalationRate:0,meanTimeToAck:'',meanTimeToContain:'',meanTimeToResolve:'',analystUtilization:0,shiftCoverage:0,toolsUptime:0};
  private _socDashEscalationPaths: Array<{fromRole:string;toRole:string;condition:string;avgTime:string;count:number}> = [];

  private _initSocDashboardModule(): void {
    this._socDashAnalysts = [
      {id:'AN-001',name:'Alice Chen',status:'active',currentAssignment:'Investigating phishing alert',alertsHandled:34,avgResponseTime:'4.2 min',shift:'Day (06:00-14:00)',skillLevel:'senior'},
      {id:'AN-002',name:'Bob Smith',status:'active',currentAssignment:'Malware analysis in progress',alertsHandled:28,avgResponseTime:'5.1 min',shift:'Day (06:00-14:00)',skillLevel:'senior'},
      {id:'AN-003',name:'Carol Jones',status:'active',currentAssignment:'Incident response coordination',alertsHandled:22,avgResponseTime:'6.3 min',shift:'Day (06:00-14:00)',skillLevel:'intermediate'},
      {id:'AN-004',name:'David Lee',status:'break',currentAssignment:'None',alertsHandled:31,avgResponseTime:'4.8 min',shift:'Day (06:00-14:00)',skillLevel:'senior'},
      {id:'AN-005',name:'Eve Wilson',status:'active',currentAssignment:'Threat hunting investigation',alertsHandled:19,avgResponseTime:'7.2 min',shift:'Day (06:00-14:00)',skillLevel:'intermediate'},
      {id:'AN-006',name:'Frank Garcia',status:'active',currentAssignment:'Vulnerability triage',alertsHandled:25,avgResponseTime:'5.5 min',shift:'Night (14:00-22:00)',skillLevel:'intermediate'},
      {id:'AN-007',name:'Grace Kim',status:'active',currentAssignment:'Compliance monitoring',alertsHandled:16,avgResponseTime:'8.1 min',shift:'Night (14:00-22:00)',skillLevel:'junior'}
    ];
    this._socDashAlerts = [
      {id:'SOC-A-001',severity:'critical',source:'IDS',description:'Possible ransomware activity detected on server-045',assignee:'Alice Chen',createdAt:'2026-04-23T13:45:00Z',status:'investigating',slaDeadline:'2026-04-23T14:00:00Z',slaBreachRisk:true},
      {id:'SOC-A-002',severity:'high',source:'SIEM',description:'Correlated login anomalies from 3 user accounts',assignee:'Bob Smith',createdAt:'2026-04-23T13:30:00Z',status:'investigating',slaDeadline:'2026-04-23T14:30:00Z',slaBreachRisk:false},
      {id:'SOC-A-003',severity:'high',source:'EDR',description:'Suspicious PowerShell execution on workstation-023',assignee:'Carol Jones',createdAt:'2026-04-23T13:15:00Z',status:'triage',slaDeadline:'2026-04-23T14:15:00Z',slaBreachRisk:false},
      {id:'SOC-A-004',severity:'medium',source:'WAF',description:'SQL injection attempt blocked on web application',assignee:'David Lee',createdAt:'2026-04-23T13:00:00Z',status:'resolved',slaDeadline:'2026-04-23T15:00:00Z',slaBreachRisk:false},
      {id:'SOC-A-005',severity:'medium',source:'DLP',description:'Large file transfer to external USB device detected',assignee:'Eve Wilson',createdAt:'2026-04-23T12:45:00Z',status:'pending',slaDeadline:'2026-04-23T14:45:00Z',slaBreachRisk:false},
      {id:'SOC-A-006',severity:'low',source:'Vuln Scanner',description:'New critical vulnerability CVE-2026-5678 detected',assignee:'Frank Garcia',createdAt:'2026-04-23T12:30:00Z',status:'pending',slaDeadline:'2026-04-23T18:30:00Z',slaBreachRisk:false}
    ];
    this._socDashPerformance = {
      escalationRate: 12.5,
      meanTimeToAck: '3.8 min',
      meanTimeToContain: '18.5 min',
      meanTimeToResolve: '2.4 hours',
      analystUtilization: 78.2,
      shiftCoverage: 92.3,
      toolsUptime: 99.95
    };
    this._socDashEscalationPaths = [
      {fromRole:'Junior Analyst',toRole:'Senior Analyst',condition:'Severity high or above',avgTime:'8 min',count:45},
      {fromRole:'Senior Analyst',toRole:'SOC Manager',condition:'Severity critical or analyst unavailable',avgTime:'15 min',count:18},
      {fromRole:'SOC Manager',toRole:'CISO',condition:'Active breach confirmed or executive impact',avgTime:'5 min',count:4},
      {fromRole:'SOC Manager',toRole:'Legal Counsel',condition:'Data breach involving PII or regulated data',avgTime:'10 min',count:6}
    ];
  }

  private _getSocDashSummary(): {activeAnalysts:number;openAlerts:number;criticalAlerts:number;utilization:number;slaBreachRiskCount:number;shiftStatus:string} {
    const activeAnalysts = this._socDashAnalysts.filter(a => a.status === 'active').length;
    const openAlerts = this._socDashAlerts.filter(a => a.status !== 'resolved').length;
    const criticalAlerts = this._socDashAlerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;
    const slaBreachRiskCount = this._socDashAlerts.filter(a => a.slaBreachRisk).length;
    return {activeAnalysts, openAlerts, criticalAlerts, utilization: this._socDashPerformance.analystUtilization, slaBreachRiskCount, shiftStatus:'Day shift - fully staffed'};
  }


  private _ba1RiskAssessmentWorkflow = [
    {step: 1, name: 'Scope and Boundary Definition', desc: 'Define the assessment scope including organizational boundaries, asset coverage, regulatory context, and engagement parameters with all stakeholder agreement documented', status: 'completed' as const, owner: 'Risk Lead', effort: '2h', output: 'Scope document with boundary diagram and stakeholder register', evidence: ['scope-doc.pdf', 'boundary-diagram.png']},
    {step: 2, name: 'Comprehensive Asset Discovery', desc: 'Discover and catalog all assets within scope including infrastructure, applications, data stores, APIs, and third-party integrations with criticality and sensitivity ratings', status: 'completed' as const, owner: 'Asset Team', effort: '4h', output: 'Complete asset inventory with business impact ratings and data classification', evidence: ['asset-inventory.xlsx', 'data-classification-map.pdf']},
    {step: 3, name: 'Threat Intelligence Integration', desc: 'Integrate current threat intelligence feeds, industry-specific threat reports, MITRE ATT&CK mappings, and historical incident data to build comprehensive threat landscape model', status: 'completed' as const, owner: 'Threat Intel', effort: '6h', output: 'Threat landscape model with actor profiles, TTP library, and scenario catalog', evidence: ['threat-model.pdf', 'ttp-library.json', 'actor-profiles.xlsx']},
    {step: 4, name: 'Vulnerability and Control Assessment', desc: 'Assess vulnerabilities against assets using automated scanning, manual testing, configuration audits, and control effectiveness measurements from all available sources', status: 'in_progress' as const, owner: 'Vuln Team', effort: '8h', output: 'Vulnerability assessment report with CVSS scoring and control gap analysis', evidence: ['vuln-report.pdf', 'control-gaps.xlsx', 'cvss-trends.png']},
    {step: 5, name: 'Impact Quantification and Financial Modeling', desc: 'Quantify business impact for each risk scenario including direct financial loss, operational disruption, reputational damage, regulatory penalties, and third-party liability', status: 'pending' as const, owner: 'Business Analysis', effort: '4h', output: 'Financial impact model with scenario-based loss estimates and probability distributions', evidence: ['financial-model.xlsx', 'impact-scenarios.pdf']},
    {step: 6, name: 'Likelihood Calibration and Validation', desc: 'Calibrate likelihood estimates using historical data, threat intelligence confidence levels, control effectiveness metrics, and peer benchmarking from industry sources', status: 'pending' as const, owner: 'Risk Analyst', effort: '3h', output: 'Calibrated likelihood ratings with confidence intervals and supporting evidence matrix', evidence: ['likelihood-calibration.xlsx', 'evidence-matrix.pdf']},
    {step: 7, name: 'Composite Risk Scoring and Heat Map', desc: 'Calculate composite risk scores using 5x5 matrix, generate risk heat maps by category and business unit, and identify top risks for executive attention and resource allocation', status: 'pending' as const, owner: 'Risk Lead', effort: '2h', output: 'Risk heat maps, prioritized risk register, and executive risk dashboard data', evidence: ['risk-heatmap.png', 'risk-register.xlsx', 'exec-dashboard.pdf']},
    {step: 8, name: 'Treatment Strategy and Resource Planning', desc: 'Develop treatment strategies for each risk with detailed implementation plans, resource requirements, cost-benefit analysis, timeline estimates, and expected residual risk levels', status: 'pending' as const, owner: 'CISO', effort: '3h', output: 'Treatment strategy document with implementation roadmap and budget requirements', evidence: ['treatment-strategy.pdf', 'roadmap.xlsx', 'budget-estimate.xlsx']},
    {step: 9, name: 'Control Architecture and Remediation Planning', desc: 'Map existing controls to risk register using NIST CSF taxonomy, identify control gaps, design remediation plans with architectural diagrams and integration points', status: 'pending' as const, owner: 'GRC Team', effort: '4h', output: 'Control architecture diagram, gap analysis report, and prioritized remediation plan', evidence: ['control-arch.png', 'gap-analysis.pdf', 'remediation-plan.xlsx']},
    {step: 10, name: 'Executive Briefing and Register Finalization', desc: 'Present findings to executive leadership, obtain formal risk acceptance decisions, update enterprise risk register, and schedule continuous monitoring and next review cycle', status: 'pending' as const, owner: 'CISO', effort: '2h', output: 'Executive briefing presentation, finalized risk register, and monitoring schedule', evidence: ['exec-briefing.pptx', 'risk-register-final.xlsx', 'monitoring-schedule.pdf']}
  ];

  private _ba1RiskMatrix5x5 = [
    {impact: 'Negligible', likelihood: 'Rare', score: 1, color: 'green', desc: 'Minimal business impact, easily absorbed by normal operations', example: 'Minor policy violation with no data exposure'},
    {impact: 'Negligible', likelihood: 'Almost Certain', score: 5, color: 'yellow', desc: 'Frequent minor incidents that cumulatively may indicate systemic issues', example: 'Repeated low-severity scan findings on non-critical systems'},
    {impact: 'Minor', likelihood: 'Rare', score: 2, color: 'green', desc: 'Small operational inconvenience with minimal financial impact', example: 'Temporary service degradation on non-critical application'},
    {impact: 'Minor', likelihood: 'Likely', score: 8, color: 'yellow', desc: 'Regular occurrence of minor incidents affecting business operations', example: 'Recurring phishing clicks by small number of users'},
    {impact: 'Moderate', likelihood: 'Possible', score: 9, color: 'yellow', desc: 'Notable business disruption with measurable financial impact requiring management attention', example: 'Ransomware infection on departmental file server with backup recovery'},
    {impact: 'Major', likelihood: 'Unlikely', score: 8, color: 'yellow', desc: 'Significant business impact with substantial financial and operational consequences', example: 'Data breach affecting customer PII with regulatory notification required'},
    {impact: 'Major', likelihood: 'Likely', score: 16, color: 'orange', desc: 'Severe and recurring impact threatening key business operations and stakeholder confidence', example: 'Persistent insider threat exfiltrating sensitive data over extended period'},
    {impact: 'Catastrophic', likelihood: 'Possible', score: 15, color: 'orange', desc: 'Existential threat to business continuity with potential for permanent damage', example: 'Critical infrastructure compromise causing extended operational shutdown'},
    {impact: 'Catastrophic', likelihood: 'Likely', score: 20, color: 'red', desc: 'Critical and imminent threat requiring immediate executive intervention and crisis management', example: 'Active ransomware campaign encrypting all production systems simultaneously'},
    {impact: 'Catastrophic', likelihood: 'Almost Certain', score: 25, color: 'red', desc: 'Maximum risk level requiring immediate all-hands response and potential business closure consideration', example: 'Zero-day exploit in core platform with active exploitation and no available patch'}
  ];

  private _ba1TreatmentOptions = [
    {id: 'ba1-T-001', riskId: 'RSK-042', risk: 'Ransomware Attack on Critical Infrastructure', before: 20, after: 6, strategy: 'Mitigate', controls: ['Next-gen EDR with behavioral detection and automated response', 'Zero-trust network micro-segmentation isolating critical assets', 'Immutable offline backup rotation with quarterly recovery testing', 'Incident response retainer with 1-hour response SLA'], cost: '$450K/yr', roi: '78% reduction vs $2.8M potential loss', timeline: 'Q3 2026', status: 'approved' as const},
    {id: 'ba1-T-002', riskId: 'RSK-018', risk: 'Insider Data Exfiltration via Cloud Storage', before: 15, after: 5, strategy: 'Mitigate', controls: ['Comprehensive DLP policies for all cloud applications and endpoints', 'UEBA behavioral analytics for anomalous access pattern detection', 'Endpoint restrictions on USB and personal cloud storage services', 'CASB integration for shadow IT discovery and policy enforcement'], cost: '$180K/yr', roi: '67% reduction vs $1.2M potential loss', timeline: 'Q2 2026', status: 'approved' as const},
    {id: 'ba1-T-003', riskId: 'RSK-067', risk: 'Supply Chain Compromise via Third-Party Component', before: 12, after: 8, strategy: 'Transfer', controls: ['Software supply chain insurance policy covering vendor incidents', 'SCA scanning requirements in all vendor procurement contracts', 'SBOM requirements and continuous monitoring for third-party components', 'Vendor security assessment program with annual re-evaluation'], cost: '$95K/yr', roi: '33% reduction vs $800K potential loss', timeline: 'Q4 2026', status: 'in_review' as const},
    {id: 'ba1-T-004', riskId: 'RSK-033', risk: 'Phishing-Driven Credential Theft Campaign', before: 16, after: 4, strategy: 'Mitigate', controls: ['AI-powered email filtering with real-time threat intelligence feeds', 'Monthly mandatory phishing simulations with targeted follow-up training', 'Hardware MFA enforcement across all users with passwordless transition', 'Security awareness program with role-specific training tracks'], cost: '$120K/yr', roi: '75% reduction vs $1.5M potential loss', timeline: 'Q2 2026', status: 'approved' as const},
    {id: 'ba1-T-005', riskId: 'RSK-091', risk: 'Zero-Day Exploit on Public-Facing Application', before: 10, after: 8, strategy: 'Accept', controls: ['WAF with virtual patching capability and rapid rule deployment', 'RASP runtime application self-protection on all production web apps', 'Incident response retainer with 4-hour response SLA commitment', 'Bug bounty program for proactive vulnerability discovery'], cost: '$60K/yr', roi: '20% reduction vs $500K potential loss', timeline: 'Ongoing', status: 'accepted' as const},
    {id: 'ba1-T-006', riskId: 'RSK-055', risk: 'GDPR Regulatory Non-Compliance Penalty', before: 15, after: 4, strategy: 'Mitigate', controls: ['Dedicated Data Protection Officer with quarterly board reporting', 'Automated compliance monitoring platform with real-time dashboards', 'Quarterly DPIA reviews for all high-risk processing activities', 'Privacy by design framework integrated into product development lifecycle'], cost: '$220K/yr', roi: '73% reduction vs $4M+ potential regulatory penalty', timeline: 'Q3 2026', status: 'approved' as const}
  ];

  private _ba1ComplianceRules = [
    {id: 'ba1-C-001', name: 'Password Policy Compliance', framework: 'NIST 800-53 IA-5', desc: 'Verify all accounts meet minimum password complexity, length, diversity, and rotation requirements defined in the security policy', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'pass' as const, passRate: 94.2, violations: 12, autoFix: true as const, fix: 'Force password reset within 24h', history: [{d: '04-22', r: 'pass', v: 12}, {d: '04-21', r: 'pass', v: 14}, {d: '04-20', r: 'fail', v: 18}, {d: '04-19', r: 'pass', v: 15}, {d: '04-18', r: 'pass', v: 13}]},
    {id: 'ba1-C-002', name: 'MFA Enrollment Verification', framework: 'NIST 800-53 IA-2', desc: 'Ensure all privileged and standard user accounts have multi-factor authentication properly enrolled and actively enforced', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'fail' as const, passRate: 87.5, violations: 34, autoFix: true as const, fix: 'Send mandatory enrollment notice with 48h deadline', history: [{d: '04-22', r: 'fail', v: 34}, {d: '04-21', r: 'fail', v: 31}, {d: '04-20', r: 'fail', v: 28}, {d: '04-19', r: 'fail', v: 25}, {d: '04-18', r: 'fail', v: 22}]},
    {id: 'ba1-C-003', name: 'Inactive Account Review', framework: 'NIST 800-53 AC-2', desc: 'Identify and disable accounts inactive for more than 90 days with automatic escalation at the 120-day threshold', enabled: true as const, freq: 'Weekly', lastRun: '2026-04-21T00:00Z', result: 'pass' as const, passRate: 96.8, violations: 5, autoFix: true as const, fix: 'Auto-disable at 120 days with manager notification', history: [{d: '04-21', r: 'pass', v: 5}, {d: '04-14', r: 'pass', v: 7}, {d: '04-07', r: 'pass', v: 9}, {d: '03-31', r: 'pass', v: 11}, {d: '03-24', r: 'pass', v: 13}]},
    {id: 'ba1-C-004', name: 'Encryption Standards Check', framework: 'NIST 800-53 SC-28', desc: 'Verify all production storage volumes use AES-256 or equivalent encryption with valid non-expired certificates', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'pass' as const, passRate: 99.1, violations: 2, autoFix: false as const, fix: 'Create priority ticket for manual remediation', history: [{d: '04-22', r: 'pass', v: 2}, {d: '04-21', r: 'pass', v: 2}, {d: '04-20', r: 'pass', v: 3}, {d: '04-19', r: 'pass', v: 3}, {d: '04-18', r: 'pass', v: 4}]},
    {id: 'ba1-C-005', name: 'Firewall Baseline Compliance', framework: 'NIST 800-53 SC-7', desc: 'Validate firewall rules against approved baseline to detect unauthorized modifications, drift, or orphaned rules', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T06:00Z', result: 'fail' as const, passRate: 91.3, violations: 18, autoFix: true as const, fix: 'Auto-revert non-compliant rules to baseline', history: [{d: '04-22', r: 'fail', v: 18}, {d: '04-21', r: 'pass', v: 12}, {d: '04-20', r: 'pass', v: 15}, {d: '04-19', r: 'pass', v: 14}, {d: '04-18', r: 'fail', v: 20}]},
    {id: 'ba1-C-006', name: 'Patch SLA Compliance', framework: 'CIS Benchmark L2', desc: 'Check all production systems against critical and high patch SLA requirements with overdue flagging', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T08:00Z', result: 'pass' as const, passRate: 97.6, violations: 8, autoFix: false as const, fix: 'Escalate overdue patches for expedited deployment', history: [{d: '04-22', r: 'pass', v: 8}, {d: '04-21', r: 'pass', v: 10}, {d: '04-20', r: 'pass', v: 12}, {d: '04-19', r: 'pass', v: 11}, {d: '04-18', r: 'pass', v: 14}]},
    {id: 'ba1-C-007', name: 'Data Classification Labels', framework: 'GDPR Art. 30', desc: 'Verify all databases, file shares, and cloud repositories have appropriate classification labels applied', enabled: true as const, freq: 'Weekly', lastRun: '2026-04-20T00:00Z', result: 'fail' as const, passRate: 82.4, violations: 45, autoFix: false as const, fix: 'Generate review tasks for data owners', history: [{d: '04-20', r: 'fail', v: 45}, {d: '04-13', r: 'fail', v: 42}, {d: '04-06', r: 'fail', v: 38}, {d: '03-30', r: 'fail', v: 35}, {d: '03-23', r: 'pass', v: 30}]},
    {id: 'ba1-C-008', name: 'Privileged Access Review', framework: 'SOX AC-6', desc: 'Review and validate all privileged access assignments on quarterly recertification schedule', enabled: true as const, freq: 'Monthly', lastRun: '2026-04-01T00:00Z', result: 'pass' as const, passRate: 93.7, violations: 22, autoFix: false as const, fix: 'Initiate recertification workflow with approvals', history: [{d: '04-01', r: 'pass', v: 22}, {d: '03-01', r: 'pass', v: 25}, {d: '02-01', r: 'pass', v: 28}, {d: '01-01', r: 'pass', v: 30}, {d: '12-01', r: 'pass', v: 32}]},
    {id: 'ba1-C-009', name: 'SIEM Log Coverage', framework: 'NIST 800-53 AU-2', desc: 'Verify all critical systems have logging enabled and actively forwarding to the centralized SIEM platform', enabled: true as const, freq: 'Weekly', lastRun: '2026-04-21T12:00Z', result: 'pass' as const, passRate: 95.5, violations: 7, autoFix: true as const, fix: 'Deploy missing log agents via config management', history: [{d: '04-21', r: 'pass', v: 7}, {d: '04-14', r: 'pass', v: 9}, {d: '04-07', r: 'pass', v: 11}, {d: '03-31', r: 'pass', v: 10}, {d: '03-24', r: 'pass', v: 13}]},
    {id: 'ba1-C-010', name: 'Certificate Expiry Monitor', framework: 'NIST 800-53 SC-13', desc: 'Monitor all TLS/SSL certificates for upcoming expiry within 30-day warning windows', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'pass' as const, passRate: 98.9, violations: 3, autoFix: true as const, fix: 'Trigger auto-renewal via ACME protocol', history: [{d: '04-22', r: 'pass', v: 3}, {d: '04-21', r: 'pass', v: 3}, {d: '04-20', r: 'pass', v: 4}, {d: '04-19', r: 'pass', v: 4}, {d: '04-18', r: 'pass', v: 5}]}
  ];

  private _ba1TalentPositions = [
    {id: 'ba1-H-001', title: 'Senior Penetration Tester', dept: 'Red Team', level: 'Senior', loc: 'Remote US', salary: '$165K-$195K', posted: '2026-03-15', applicants: 23, pipeline: 8, interviews: 4, offers: 1, urgency: 'high' as const, manager: 'Alex Chen', skills: ['Burp Suite', 'Metasploit', 'Cobalt Strike', 'Python', 'OWASP Top 10'], nice: ['OSCP/OSCE', 'Bug bounty', 'Cloud pentest']},
    {id: 'ba1-H-002', title: 'Cloud Security Engineer', dept: 'Cloud Security', level: 'Mid-Senior', loc: 'SF/Remote', salary: '$155K-$180K', posted: '2026-03-20', applicants: 45, pipeline: 12, interviews: 6, offers: 2, urgency: 'high' as const, manager: 'Mike Johnson', skills: ['AWS/Azure/GCP', 'Terraform', 'Kubernetes', 'IAM', 'CSPM'], nice: ['CCSP', 'CKS', 'Serverless']},
    {id: 'ba1-H-003', title: 'SOC Analyst L2', dept: 'Security Operations', level: 'Mid', loc: 'Austin TX', salary: '$105K-$130K', posted: '2026-04-01', applicants: 67, pipeline: 18, interviews: 8, offers: 0, urgency: 'medium' as const, manager: 'Lisa Park', skills: ['SIEM', 'Incident triage', 'Malware analysis', 'TCP/IP'], nice: ['GCIA', 'SOAR', 'Kill chain']},
    {id: 'ba1-H-004', title: 'Staff Security Architect', dept: 'Architecture', level: 'Staff', loc: 'Remote US', salary: '$200K-$240K', posted: '2026-02-28', applicants: 12, pipeline: 3, interviews: 2, offers: 0, urgency: 'critical' as const, manager: 'David Lee', skills: ['Enterprise arch', 'Zero trust', 'Risk frameworks', 'Board comms'], nice: ['CISSP+SABSA', 'Team building', 'Speaker']},
    {id: 'ba1-H-005', title: 'GRC Analyst', dept: 'GRC', level: 'Mid', loc: 'NY/Remote', salary: '$110K-$135K', posted: '2026-04-05', applicants: 34, pipeline: 9, interviews: 3, offers: 1, urgency: 'medium' as const, manager: 'Rachel Green', skills: ['ISO 27001', 'SOC 2', 'Risk assessment', 'Audit'], nice: ['CRISC', 'CISA', 'GDPR']},
    {id: 'ba1-H-006', title: 'Threat Intel Analyst', dept: 'Threat Intel', level: 'Mid-Senior', loc: 'Remote US', salary: '$140K-$170K', posted: '2026-03-25', applicants: 19, pipeline: 5, interviews: 2, offers: 0, urgency: 'low' as const, manager: 'James Wilson', skills: ['MITRE ATT&CK', 'OSINT', 'Threat modeling', 'Reverse eng'], nice: ['CTIA', 'Nation-state', 'Dark web']},
    {id: 'ba1-H-007', title: 'AppSec Engineer', dept: 'AppSec', level: 'Senior', loc: 'Seattle/Remote', salary: '$160K-$190K', posted: '2026-04-10', applicants: 28, pipeline: 7, interviews: 3, offers: 0, urgency: 'medium' as const, manager: 'Emily Zhang', skills: ['SAST/DAST/SCA', 'Secure SDLC', 'Code review', 'CI/CD'], nice: ['CSSLP', 'Mobile security']},
    {id: 'ba1-H-008', title: 'IAM Engineer', dept: 'IAM', level: 'Mid', loc: 'Remote US', salary: '$135K-$160K', posted: '2026-04-08', applicants: 31, pipeline: 10, interviews: 5, offers: 1, urgency: 'medium' as const, manager: 'Chris Martinez', skills: ['Okta/Azure AD', 'SAML/OIDC', 'PAM', 'RBAC'], nice: ['CISSP', 'Zero trust IAM']}
  ];

  private _ba1InterviewScorecard = [
    {category: 'Technical Proficiency', weight: 40, criteria: [
      {name: 'Core Security Knowledge', max: 10, desc: 'Understanding of security fundamentals, NIST/ISO frameworks, and industry best practices across multiple domains'},
      {name: 'Hands-on Technical Skills', max: 10, desc: 'Practical ability with security tools, scripting languages, and technical problem-solving under pressure'},
      {name: 'Domain-Specific Expertise', max: 10, desc: 'Depth of knowledge and practical experience in the specific role domain being hired for'},
      {name: 'Incident Response Thinking', max: 10, desc: 'Systematic approach to analyzing security incidents and proposing effective response strategies'}
    ]},
    {category: 'Communication', weight: 20, criteria: [
      {name: 'Technical Explanation Clarity', max: 10, desc: 'Ability to explain complex security concepts to both technical and non-technical audiences effectively'},
      {name: 'Written Documentation', max: 10, desc: 'Quality of security documentation, reports, and written analysis demonstrated during the process'}
    ]},
    {category: 'Cultural Fit', weight: 20, criteria: [
      {name: 'Cross-functional Collaboration', max: 10, desc: 'Track record of working effectively with development, operations, and business stakeholders'},
      {name: 'Growth Mindset', max: 10, desc: 'Commitment to continuous learning, professional development, and proactive knowledge sharing'}
    ]},
    {category: 'Experience', weight: 20, criteria: [
      {name: 'Relevant Experience', max: 10, desc: 'Quality, breadth, and relevance of past security industry work experience at comparable organizations'},
      {name: 'Certifications', max: 10, desc: 'Relevant industry certifications and academic background supporting the role requirements'}
    ]}
  ];

  private _ba1OnboardingSteps = [
    {id: 'ba1-OB-01', item: 'Provision security-hardened laptop, monitors, peripherals, and configured workstation image with all required security tools', cat: 'IT Setup', day: 'Day 1', owner: 'IT Operations'},
    {id: 'ba1-OB-02', item: 'Create AD account, email, Slack, VPN, SSO enrollment, and all required application access accounts', cat: 'Access', day: 'Day 1', owner: 'IAM Team'},
    {id: 'ba1-OB-03', item: 'Grant security tooling access: SIEM console, EDR dashboard, vuln scanner, pentest platforms, SOAR', cat: 'Tools', day: 'Day 1-2', owner: 'SOC Manager'},
    {id: 'ba1-OB-04', item: 'Complete MFA enrollment, security awareness onboarding course, and acceptable use policy acknowledgment', cat: 'Security', day: 'Day 1', owner: 'Awareness Team'},
    {id: 'ba1-OB-05', item: 'Sign NDA, employment agreement, IP assignment, and code of conduct documents with HR', cat: 'HR', day: 'Day 1', owner: 'Human Resources'},
    {id: 'ba1-OB-06', item: 'Introduction meetings with direct team members and key cross-functional stakeholders', cat: 'Integration', day: 'Week 1', owner: 'Hiring Manager'},
    {id: 'ba1-OB-07', item: 'Security architecture overview, tooling walkthrough, and operational runbook review sessions', cat: 'Training', day: 'Week 1-2', owner: 'Security Architect'},
    {id: 'ba1-OB-08', item: 'Shadow experienced team member on active incident response and threat hunting investigations', cat: 'Mentoring', day: 'Week 2-3', owner: 'SOC Lead'},
    {id: 'ba1-OB-09', item: 'Set up individual certification study plan aligned with role requirements and career goals', cat: 'Development', day: 'Week 2', owner: 'Hiring Manager'},
    {id: 'ba1-OB-10', item: 'Establish 30-60-90 day goals, define success metrics, and schedule first performance checkpoint', cat: 'Goals', day: 'Week 1', owner: 'Hiring Manager'}
  ];

  private _ba1MetricsDashboard = [
    {id: 'ba1-MTD-001', name: 'Mean Time to Detect (MTTD)', value: '4.2 hours', trend: 'improving' as const, target: '< 4 hours', source: 'SIEM - Splunk', method: 'Median time from first alert to analyst acknowledgment', owner: 'SOC Manager', sla: '4 hours', prev: '5.1 hours', spark: [5.8, 5.4, 5.1, 4.9, 4.7, 4.5, 4.3, 4.2], breakdown: [{src: 'Network IDS', pct: '35%', avg: '3.8h'}, {src: 'Endpoint EDR', pct: '28%', avg: '4.1h'}, {src: 'Email Gateway', pct: '22%', avg: '3.5h'}, {src: 'Cloud Security', pct: '10%', avg: '5.2h'}, {src: 'User Reports', pct: '5%', avg: '6.8h'}]},
    {id: 'ba1-MTD-002', name: 'Mean Time to Respond (MTTR)', value: '2.8 hours', trend: 'stable' as const, target: '< 3 hours', source: 'SOAR - XSOAR', method: 'Median time from acknowledgment to first containment action', owner: 'IR Lead', sla: '3 hours', prev: '2.7 hours', spark: [3.2, 3.0, 2.9, 2.8, 2.8, 2.9, 2.8, 2.8], breakdown: [{src: 'Auto Playbooks', pct: '42%', avg: '1.2h'}, {src: 'Semi-Auto', pct: '33%', avg: '2.5h'}, {src: 'Manual', pct: '20%', avg: '5.1h'}, {src: 'L3 Escalation', pct: '5%', avg: '8.3h'}]},
    {id: 'ba1-MTD-003', name: 'Patch Compliance Rate', value: '97.6%', trend: 'improving' as const, target: '> 95%', source: 'Tenable.io', method: 'Pct of critical/high vulns patched within SLA windows', owner: 'Vuln Manager', sla: '95%', prev: '96.1%', spark: [93.2, 94.1, 94.8, 95.3, 95.9, 96.4, 97.0, 97.6], breakdown: [{src: 'Critical (7d)', pct: '40%', rate: '99.2%'}, {src: 'High (30d)', pct: '35%', rate: '97.8%'}, {src: 'Medium (90d)', pct: '20%', rate: '95.1%'}, {src: 'Low (180d)', pct: '5%', rate: '89.4%'}]},
    {id: 'ba1-MTD-004', name: 'Phishing Click Rate', value: '3.2%', trend: 'improving' as const, target: '< 5%', source: 'KnowBe4 + Proofpoint', method: 'Pct of users clicking simulated phishing links monthly', owner: 'Awareness Lead', sla: '5%', prev: '4.1%', spark: [6.8, 6.2, 5.5, 5.1, 4.6, 4.1, 3.6, 3.2], breakdown: [{src: 'Spear Phishing', pct: '35%', rate: '5.1%'}, {src: 'Generic Phishing', pct: '30%', rate: '2.8%'}, {src: 'BEC Sim', pct: '20%', rate: '3.5%'}, {src: 'SMS Phishing', pct: '15%', rate: '1.9%'}]},
    {id: 'ba1-MTD-005', name: 'Security Posture Score', value: '784', trend: 'improving' as const, target: '> 750', source: 'SecurityScorecard', method: 'Composite: external 30%, compliance 25%, vuln 25%, config 20%', owner: 'CISO', sla: '> 750', prev: '771', spark: [748, 752, 758, 762, 768, 773, 778, 784], breakdown: [{src: 'External Rating', pct: '30%', score: '791'}, {src: 'Compliance', pct: '25%', score: '812'}, {src: 'Vuln Mgmt', pct: '25%', score: '745'}, {src: 'Config', pct: '20%', score: '769'}]},
    {id: 'ba1-MTD-006', name: 'Vulnerability Backlog', value: '142', trend: 'improving' as const, target: '< 150', source: 'Tenable + Qualys', method: 'Total open vulns across all scanned assets tracked weekly', owner: 'Vuln Manager', sla: '< 150', prev: '168', spark: [210, 198, 185, 175, 165, 158, 150, 142], breakdown: [{src: 'Critical', pct: '8%', count: '11'}, {src: 'High', pct: '22%', count: '31'}, {src: 'Medium', pct: '45%', count: '64'}, {src: 'Low', pct: '25%', count: '36'}]}
  ];

  private _ba1ArchReview = [
    {id: 'ba1-AR-001', cat: 'Network', item: 'Network segmentation between trust zones with dedicated firewalls and granular ACLs', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Micro-segmentation via NSX across all production zones'},
    {id: 'ba1-AR-002', cat: 'Network', item: 'DMZ architecture isolating public services from internal network', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Dual-firewall DMZ with WAF and DDoS mitigation'},
    {id: 'ba1-AR-003', cat: 'Network', item: 'Least-privilege traffic flows with deny-by-default and quarterly review', sev: 'high' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Explicit allow rules with automated drift detection'},
    {id: 'ba1-AR-004', cat: 'Network', item: 'Encrypted external communications with IPSec/TLS 1.3 and PFS', sev: 'high' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'IKEv2 with PFS, TLS 1.3 for all external APIs'},
    {id: 'ba1-AR-005', cat: 'Identity', item: 'Centralized IdP with SSO and automated SCIM provisioning', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'Okta SSO SAML 2.0 for 247 apps with SCIM'},
    {id: 'ba1-AR-006', cat: 'Identity', item: 'RBAC with quarterly reviews and automated deprovisioning', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'Quarterly recertification with JIT admin access'},
    {id: 'ba1-AR-007', cat: 'Identity', item: 'PAM controlling all admin and service accounts with session recording', sev: 'high' as const, status: 'fail' as const, reviewer: 'IAM Lead', notes: '3 legacy accounts pending CyberArk enrollment'},
    {id: 'ba1-AR-008', cat: 'Identity', item: 'MFA enforced for all users, hardware tokens for privileged access', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'FIDO2 for admins, push MFA for users, 99.8% enrollment'},
    {id: 'ba1-AR-009', cat: 'Data', item: 'Data classification enforced with automated labeling on all repos', sev: 'high' as const, status: 'partial' as const, reviewer: 'Data Protection Lead', notes: 'Framework deployed, gaps on 4 legacy file shares'},
    {id: 'ba1-AR-010', cat: 'Data', item: 'AES-256 encryption at rest for all sensitive data stores', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Data Protection Lead', notes: 'Full-disk, TDE on DBs, SSE-KMS on cloud storage'},
    {id: 'ba1-AR-011', cat: 'Data', item: 'DLP monitoring and preventing unauthorized data exfiltration', sev: 'high' as const, status: 'pass' as const, reviewer: 'Data Protection Lead', notes: 'DLP active on email, endpoint, cloud, and network'},
    {id: 'ba1-AR-012', cat: 'Data', item: 'Encrypted off-site backups with quarterly restore testing', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Infrastructure Lead', notes: '3-2-1 strategy with immutable backups'},
    {id: 'ba1-AR-013', cat: 'AppSec', item: 'Secure SDLC with SAST, DAST, SCA in all CI/CD pipelines', sev: 'high' as const, status: 'pass' as const, reviewer: 'AppSec Lead', notes: '34 pipelines with security gates and PR blocking'},
    {id: 'ba1-AR-014', cat: 'AppSec', item: 'API gateway with auth, rate limiting, schema validation', sev: 'high' as const, status: 'pass' as const, reviewer: 'AppSec Lead', notes: 'Kong with OAuth2, rate limits, OpenAPI validation'},
    {id: 'ba1-AR-015', cat: 'AppSec', item: 'Container security with image scanning and runtime protection', sev: 'high' as const, status: 'partial' as const, reviewer: 'Cloud Security Lead', notes: 'Trivy scanning, Falco runtime in 80% of clusters'},
    {id: 'ba1-AR-016', cat: 'Monitoring', item: 'SIEM collecting from all critical systems with correlation rules', sev: 'critical' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'Splunk 98% coverage with 1200+ correlation rules'},
    {id: 'ba1-AR-017', cat: 'Monitoring', item: 'EDR with behavioral detection on all managed endpoints', sev: 'high' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'CrowdStrike on 99.2% endpoints with 24/7 MDR'},
    {id: 'ba1-AR-018', cat: 'Monitoring', item: 'Executive dashboards with real-time posture visibility', sev: 'medium' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'PowerBI dashboards with weekly exec summaries'},
    {id: 'ba1-AR-019', cat: 'Cloud', item: 'CSPM monitoring and remediating cloud misconfigurations', sev: 'high' as const, status: 'pass' as const, reviewer: 'Cloud Security Lead', notes: 'Prisma Cloud 450+ checks with auto-remediation'},
    {id: 'ba1-AR-020', cat: 'Cloud', item: 'IaC templates scanned before deployment to production', sev: 'high' as const, status: 'partial' as const, reviewer: 'Cloud Security Lead', notes: 'Checkov for Terraform, cfn-nag for CloudFormation pending'}
  ];

  private _getba1RiskProgress(): number {
    return Math.round(this._ba1RiskAssessmentWorkflow.filter(s => s.status === 'completed').length / this._ba1RiskAssessmentWorkflow.length * 100);
  }

  private _getba1TreatmentSummary(): {total: number; approved: number; avgReduction: number; investment: string} {
    const a = this._ba1TreatmentOptions.filter(r => r.status === 'approved').length;
    const avg = this._ba1TreatmentOptions.reduce((s, r) => s + ((r.before - r.after) / r.before * 100), 0) / this._ba1TreatmentOptions.length;
    return {total: this._ba1TreatmentOptions.length, approved: a, avgReduction: Math.round(avg), investment: '$1.125M annually'};
  }

  private _getba1RuleSummary(): {total: number; passing: number; failing: number; avgRate: number; violations: number} {
    const p = this._ba1ComplianceRules.filter(r => r.result === 'pass').length;
    const f = this._ba1ComplianceRules.filter(r => r.result === 'fail').length;
    const avg = this._ba1ComplianceRules.reduce((s, r) => s + r.passRate, 0) / this._ba1ComplianceRules.length;
    const v = this._ba1ComplianceRules.reduce((s, r) => s + r.violations, 0);
    return {total: this._ba1ComplianceRules.length, passing: p, failing: f, avgRate: Math.round(avg * 10) / 10, violations: v};
  }

  private _getba1PipelineStats(): {positions: number; applicants: number; interviewing: number; offers: number; critical: number} {
    const t = this._ba1TalentPositions.length;
    const a = this._ba1TalentPositions.reduce((s, p) => s + p.applicants, 0);
    const i = this._ba1TalentPositions.reduce((s, p) => s + p.interviews, 0);
    const o = this._ba1TalentPositions.reduce((s, p) => s + p.offers, 0);
    const c = this._ba1TalentPositions.filter(x => x.urgency === 'critical').length;
    return {positions: t, applicants: a, interviewing: i, offers: o, critical: c};
  }

  private _getba1MetricTrends(): {improving: number; stable: number; total: number} {
    const imp = this._ba1MetricsDashboard.filter(m => m.trend === 'improving').length;
    const stb = this._ba1MetricsDashboard.filter(m => m.trend === 'stable').length;
    return {improving: imp, stable: stb, total: this._ba1MetricsDashboard.length};
  }

  private _getba1ArchScore(): {total: number; passed: number; failed: number; partial: number; score: number} {
    const p = this._ba1ArchReview.filter(c => c.status === 'pass').length;
    const f = this._ba1ArchReview.filter(c => c.status === 'fail').length;
    const pa = this._ba1ArchReview.filter(c => c.status === 'partial').length;
    return {total: this._ba1ArchReview.length, passed: p, failed: f, partial: pa, score: Math.round((p / this._ba1ArchReview.length) * 100)};
  }


  private _zba1IncidentScenarios = [
    {id: 'zba1-IS-001', name: 'Ransomware Outbreak in Production Environment', category: 'Malware', likelihood: 'Medium', impact: 'Critical', riskScore: 15, playbooks: ['IR-Ransomware-Isolate', 'IR-Ransomware-Eradicate', 'IR-Ransomway-Recover'], estimatedMTTD: '15min', estimatedMTTR: '4h', involvedTeams: ['SOC', 'IR', 'Infrastructure', 'Legal', 'Comms'], keyIndicators: ['Mass file encryption events', 'Ransom note deployment', 'Lateral movement via SMB/RDP', 'Backup deletion attempts'], mitigationControls: ['EDR behavioral detection', 'Network segmentation', 'Immutable backups', 'Email filtering'], lessonsLearned: 'Ensure offline backups are tested quarterly and Ransomware-specific playbooks are updated with latest threat intelligence', lastDrillDate: '2026-03-15', nextDrillDate: '2026-06-15'},
    {id: 'zba1-IS-002', name: 'Cloud Misconfiguration Leading to Data Exposure', category: 'Cloud', likelihood: 'High', impact: 'High', riskScore: 16, playbooks: ['IR-Cloud-Misconfig-Assess', 'IR-Cloud-Misconfig-Remediate', 'IR-Cloud-Misconfig-Notify'], estimatedMTTD: '2h', estimatedMTTR: '6h', involvedTeams: ['Cloud Security', 'SOC', 'Data Protection', 'Legal'], keyIndicators: ['Public S3 bucket exposure', 'Overly permissive IAM policies', 'Unencrypted database snapshots', 'Public API endpoint discovery'], mitigationControls: ['CSPM monitoring', 'IAM policy analyzer', 'Automated remediation', 'Cloud audit logging'], lessonsLearned: 'Implement CSPM with auto-remediation for common misconfigurations and conduct monthly cloud configuration reviews', lastDrillDate: '2026-02-20', nextDrillDate: '2026-05-20'},
    {id: 'zba1-IS-003', name: 'Insider Threat Data Exfiltration', category: 'Insider', likelihood: 'Low', impact: 'Critical', riskScore: 12, playbooks: ['IR-Insider-Investigate', 'IR-Insider-Contain', 'IR-Insider-Escalate'], estimatedMTTD: '8h', estimatedMTTR: '24h', involvedTeams: ['SOC', 'IR', 'HR', 'Legal', 'IAM'], keyIndicators: ['Anomalous data access patterns', 'Large file downloads to USB or cloud', 'Off-hours access to sensitive systems', 'Accessing data outside normal job scope'], mitigationControls: ['UEBA analytics', 'DLP policies', 'PAM controls', 'Access reviews'], lessonsLearned: 'Strengthen UEBA baselines and implement automated alerts for data access pattern anomalies', lastDrillDate: '2026-01-10', nextDrillDate: '2026-04-10'},
    {id: 'zba1-IS-004', name: 'Supply Chain Attack via Compromised Vendor Software', category: 'Supply Chain', likelihood: 'Low', impact: 'Critical', riskScore: 12, playbooks: ['IR-SupplyChain-Detect', 'IR-SupplyChain-Isolate', 'IR-SupplyChain-Remediate'], estimatedMTTD: '24h', estimatedMTTR: '72h', involvedTeams: ['SOC', 'IR', 'Procurement', 'Vendor Mgmt', 'Legal'], keyIndicators: ['Unexpected network connections from vendor software', 'Modified binaries or dependencies', 'Anomalous behavior from trusted applications', 'SBOM discrepancy alerts'], mitigationControls: ['SCA scanning', 'SBOM monitoring', 'Vendor security assessments', 'Network segmentation'], lessonsLearned: 'Require SBOM from all vendors and implement continuous monitoring of third-party component behavior', lastDrillDate: '2026-03-01', nextDrillDate: '2026-06-01'},
    {id: 'zba1-IS-005', name: 'Credential Stuffing Attack on Customer Portal', category: 'External Attack', likelihood: 'High', impact: 'Medium', riskScore: 12, playbooks: ['IR-CredentialStuffing-Detect', 'IR-CredentialStuffing-Block', 'IR-CredentialStuffing-Notify'], estimatedMTTD: '30min', estimatedMTTR: '2h', involvedTeams: ['SOC', 'AppSec', 'Customer Support', 'Comms'], keyIndicators: ['High volume of failed login attempts', 'Login attempts from known compromised credential lists', 'Unusual geographic distribution of login attempts', 'Account takeover indicators'], mitigationControls: ['WAF rate limiting', 'CAPTCHA on login', 'MFA enforcement', 'Credential monitoring service'], lessonsLearned: 'Deploy advanced bot detection on login endpoints and implement proactive credential monitoring for customer accounts', lastDrillDate: '2026-04-01', nextDrillDate: '2026-07-01'},
    {id: 'zba1-IS-006', name: 'Phishing Campaign Targeting Executive Team', category: 'Social Engineering', likelihood: 'High', impact: 'High', riskScore: 16, playbooks: ['IR-Phishing-Contain', 'IR-Phishing-Investigate', 'IR-Phishing-Notify'], estimatedMTTD: '1h', estimatedMTTR: '4h', involvedTeams: ['SOC', 'Awareness', 'Executive Office', 'IT'], keyIndicators: ['Sophisticated spear-phishing emails to C-suite', 'Business email compromise indicators', 'Redirected MFA approval requests', 'Unauthorized wire transfer attempts'], mitigationControls: ['AI email filtering', 'Executive awareness training', 'Out-of-band verification policy', 'DMARC/DKIM/SPF'], lessonsLearned: 'Implement additional email security controls for executive mailboxes and conduct monthly spear-phishing simulations', lastDrillDate: '2026-02-15', nextDrillDate: '2026-05-15'}
  ];

  private _zba1SecurityFrameworks = [
    {name: 'NIST Cybersecurity Framework 2.0', version: '2.0', categories: ['Govern', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'], currentMaturity: 'Tier 3 - Repeatable', targetMaturity: 'Tier 4 - Adaptive', gaps: ['Supply chain risk management maturity', 'Continuous improvement feedback loop documentation', 'External dependency mapping completeness'], strengths: ['Strong detect and respond capabilities', 'Well-documented protect controls', 'Active vulnerability management program'], lastAssessment: '2026-03-01', nextAssessment: '2026-09-01', owner: 'CISO'},
    {name: 'ISO 27001:2022', version: '2022', categories: ['A.5 Organizational', 'A.6 People', 'A.7 Physical', 'A.8 Technological'], currentMaturity: 'Certified', targetMaturity: 'Certified with zero nonconformities', gaps: ['A.8.25 Secure development lifecycle documentation', 'A.5.23 Cloud services information security policy update', 'A.8.16 Monitoring activities completeness'], strengths: ['Clean certification audit with zero major nonconformities', 'Strong access control framework', 'Comprehensive incident management process'], lastAssessment: '2026-01-15', nextAssessment: '2027-01-15', owner: 'Compliance Officer'},
    {name: 'CIS Controls v8.1', version: '8.1', categories: ['IG1 (Essential Cyber Hygiene)', 'IG2 (Expanded)', 'IG3 (Comprehensive)'], currentMaturity: 'IG2 - 87% Implementation', targetMaturity: 'IG3 - 95% Implementation', gaps: ['Control 4.8 - Uninterruptible Power Supply monitoring', 'Control 13.3 - Application software security testing automation', 'Control 16.9 - Adversary emulation testing frequency'], strengths: ['Strong IG1 implementation at 98%', 'Comprehensive inventory and control management', 'Active continuous monitoring and response'], lastAssessment: '2026-04-01', nextAssessment: '2026-10-01', owner: 'Security Architect'},
    {name: 'MITRE ATT&CK v14.1', version: '14.1', categories: ['Enterprise', 'Mobile', 'ICS'], currentMaturity: 'Detection coverage 72%', targetMaturity: 'Detection coverage 90%', gaps: ['Collection techniques detection coverage', 'Command and control channel identification', 'Impact technique prevention controls'], strengths: ['Strong initial access detection', 'Comprehensive persistence monitoring', 'Active threat hunting program aligned to ATT&CK'], lastAssessment: '2026-02-01', nextAssessment: '2026-05-01', owner: 'Threat Intelligence Lead'}
  ];

  private _zba1ThirdPartyRiskData = [
    {vendorId: 'zba1-V-001', vendorName: 'CloudFlare Inc', category: 'CDN and DDoS Protection', tier: 'Critical', riskScore: 22, assessmentDate: '2026-03-15', nextReview: '2026-06-15', findings: ['Shared responsibility model documentation needs update', 'Incident notification SLA verification required'], controls: ['SOC 2 Type II certified', 'ISO 27001 certified', 'Annual penetration testing'], slaCompliance: '99.99% uptime SLA met', dataProcessing: 'Minimal PII access, no data storage', status: 'approved' as const},
    {vendorId: 'zba1-V-002', vendorName: 'Okta Inc', category: 'Identity Provider', tier: 'Critical', riskScore: 18, assessmentDate: '2026-02-28', nextReview: '2026-05-28', findings: ['MFA bypass vulnerability remediation verified', 'API rate limiting configuration reviewed'], controls: ['SOC 2 Type II certified', 'FedRAMP authorized', 'Bug bounty program active'], slaCompliance: '99.95% uptime SLA met', dataProcessing: 'Identity data processing with DPA in place', status: 'approved' as const},
    {vendorId: 'zba1-V-003', vendorName: 'CrowdStrike Holdings', category: 'Endpoint Detection and Response', tier: 'Critical', riskScore: 15, assessmentDate: '2026-03-01', nextReview: '2026-06-01', findings: ['Sensor performance optimization review completed', 'Data retention policy aligned with requirements'], controls: ['SOC 2 Type II certified', 'ISO 27001 certified', 'Independent code review'], slaCompliance: 'All SLAs met within defined thresholds', dataProcessing: 'Telemetry data only, no customer content access', status: 'approved' as const},
    {vendorId: 'zba1-V-004', vendorName: 'AnalyticsPro Corp', category: 'Business Intelligence', tier: 'High', riskScore: 28, assessmentDate: '2026-01-15', nextReview: '2026-04-15', findings: ['Data residency requirements not fully documented', 'Sub-processor list needs update with new acquisitions', 'Encryption key management review pending'], controls: ['SOC 2 Type II pending renewal', 'GDPR compliance self-assessed'], slaCompliance: '98.5% uptime - below 99% target', dataProcessing: 'Extensive customer data access for analytics processing', status: 'conditional' as const},
    {vendorId: 'zba1-V-005', vendorName: 'MarketingTech LLC', category: 'Email Marketing Platform', tier: 'Medium', riskScore: 35, assessmentDate: '2025-12-01', nextReview: '2026-03-01', findings: ['Outdated security assessment - 4 months overdue', 'No current SOC 2 certification', 'Data processing agreement expired', 'Sub-processor transparency report not available'], controls: ['Self-assessed security questionnaire', 'Basic encryption standards'], slaCompliance: '96% uptime - below contractual SLA', dataProcessing: 'Full customer contact list access with email sending capabilities', status: 'remediation_required' as const}
  ];

  private _zba1SecurityTrainingCatalog = [
    {id: 'zba1-TR-001', title: 'Security Awareness Fundamentals', audience: 'All Employees', duration: '45 min', frequency: 'Annual', completionRate: 94.2, passingScore: 80, avgScore: 87, modules: ['Security threats overview', 'Phishing identification', 'Social engineering awareness', 'Data handling best practices', 'Incident reporting procedures'], lastUpdated: '2026-01-15', nextUpdate: '2027-01-15', platform: 'KnowBe4'},
    {id: 'zba1-TR-002', title: 'Advanced Phishing Defense', audience: 'All Employees', duration: '30 min', frequency: 'Quarterly', completionRate: 91.8, passingScore: 90, avgScore: 82, modules: ['Spear phishing recognition', 'BEC identification', 'Vishing and smishing awareness', 'Verify before you trust framework'], lastUpdated: '2026-03-01', nextUpdate: '2026-06-01', platform: 'KnowBe4'},
    {id: 'zba1-TR-003', title: 'Secure Coding Practices', audience: 'Development Teams', duration: '4 hours', frequency: 'Annual', completionRate: 88.5, passingScore: 75, avgScore: 81, modules: ['OWASP Top 10 deep dive', 'Secure SDLC integration', 'Code review best practices', 'Dependency management', 'Security testing methodologies'], lastUpdated: '2026-02-01', nextUpdate: '2027-02-01', platform: 'Internal LMS'},
    {id: 'zba1-TR-004', title: 'Incident Response Training', audience: 'SOC and IR Teams', duration: '8 hours', frequency: 'Quarterly', completionRate: 96.7, passingScore: 85, avgScore: 91, modules: ['IR process and procedures', 'Evidence handling and chain of custody', 'Communication protocols', 'Tabletop exercise scenarios', 'Tool proficiency assessment'], lastUpdated: '2026-04-01', nextUpdate: '2026-07-01', platform: 'Internal LMS + Range'},
    {id: 'zba1-TR-005', title: 'Cloud Security Fundamentals', audience: 'DevOps and Cloud Teams', duration: '3 hours', frequency: 'Annual', completionRate: 85.2, passingScore: 75, avgScore: 78, modules: ['Cloud shared responsibility model', 'IAM best practices', 'Network security in the cloud', 'Data protection and encryption', 'Compliance in cloud environments'], lastUpdated: '2026-01-01', nextUpdate: '2027-01-01', platform: 'Internal LMS'},
    {id: 'zba1-TR-006', title: 'Executive Security Briefing', audience: 'C-Suite and Board', duration: '1 hour', frequency: 'Quarterly', completionRate: 100.0, passingScore: 0, avgScore: 0, modules: ['Current threat landscape', 'Security posture update', 'Risk register review', 'Upcoming security initiatives', 'Compliance status summary'], lastUpdated: '2026-04-01', nextUpdate: '2026-07-01', platform: 'In-person/Video'}
  ];

  private _zba1SecurityToolInventory = [
    {id: 'zba1-TL-001', name: 'Splunk Enterprise Security', category: 'SIEM', version: '9.1.2', license: 'Enterprise', annualCost: '$285K', users: 45, coverage: '98% of critical log sources', integrations: ['CrowdStrike', 'Okta', 'AWS CloudTrail', 'Azure AD', 'Proofpoint'], health: 'healthy' as const, lastMaintenance: '2026-04-15', nextMaintenance: '2026-07-15', owner: 'SOC Manager'},
    {id: 'zba1-TL-002', name: 'CrowdStrike Falcon', category: 'EDR/XDR', version: '7.12', license: 'Enterprise', annualCost: '$320K', users: 2800, coverage: '99.2% of managed endpoints', integrations: ['Splunk', 'ServiceNow', 'Okta', 'Palo Alto Networks'], health: 'healthy' as const, lastMaintenance: '2026-04-10', nextMaintenance: '2026-07-10', owner: 'Endpoint Security Lead'},
    {id: 'zba1-TL-003', name: 'Tenable.io', category: 'Vulnerability Management', version: '6.14', license: 'Enterprise', annualCost: '$180K', users: 25, coverage: 'All production and staging assets', integrations: ['Splunk', 'ServiceNow', 'Jira', 'Slack'], health: 'healthy' as const, lastMaintenance: '2026-04-12', nextMaintenance: '2026-07-12', owner: 'Vulnerability Manager'},
    {id: 'zba1-TL-004', name: 'Prisma Cloud', category: 'CSPM/CWPP', version: '32.1', license: 'Enterprise', annualCost: '$240K', users: 18, coverage: 'AWS, Azure, GCP environments', integrations: ['AWS Security Hub', 'Azure Defender', 'Splunk', 'Jira'], health: 'degraded' as const, lastMaintenance: '2026-04-08', nextMaintenance: '2026-07-08', owner: 'Cloud Security Lead'},
    {id: 'zba1-TL-005', name: 'KnowBe4 Platform', category: 'Security Awareness', version: 'Current', license: 'Enterprise', annualCost: '$85K', users: 3200, coverage: 'All employees', integrations: ['Okta SCIM', 'Slack', 'HRIS system'], health: 'healthy' as const, lastMaintenance: '2026-04-05', nextMaintenance: '2026-07-05', owner: 'Awareness Lead'},
    {id: 'zba1-TL-006', name: 'CyberArk Privileged Access Manager', category: 'PAM', version: '12.2', license: 'Enterprise', annualCost: '$195K', users: 350, coverage: 'All privileged accounts', integrations: ['Active Directory', 'Splunk', 'ServiceNow', 'Okta'], health: 'healthy' as const, lastMaintenance: '2026-04-18', nextMaintenance: '2026-07-18', owner: 'IAM Lead'}
  ];

  private _getzba1ScenarioSummary(): {total: number; critical: number; high: number; drilled: number; avgRiskScore: number} {
    const crit = this._zba1IncidentScenarios.filter(s => s.impact === 'Critical').length;
    const high = this._zba1IncidentScenarios.filter(s => s.impact === 'High').length;
    const avg = this._zba1IncidentScenarios.reduce((s, x) => s + x.riskScore, 0) / this._zba1IncidentScenarios.length;
    return {total: this._zba1IncidentScenarios.length, critical: crit, high: high, drilled: this._zba1IncidentScenarios.length, avgRiskScore: Math.round(avg)};
  }

  private _getzba1VendorRiskSummary(): {total: number; approved: number; conditional: number; remediation: number; avgScore: number} {
    const approved = this._zba1ThirdPartyRiskData.filter(v => v.status === 'approved').length;
    const cond = this._zba1ThirdPartyRiskData.filter(v => v.status === 'conditional').length;
    const rem = this._zba1ThirdPartyRiskData.filter(v => v.status === 'remediation_required').length;
    const avg = this._zba1ThirdPartyRiskData.reduce((s, v) => s + v.riskScore, 0) / this._zba1ThirdPartyRiskData.length;
    return {total: this._zba1ThirdPartyRiskData.length, approved, conditional: cond, remediation: rem, avgScore: Math.round(avg)};
  }

  private _getzba1TrainingSummary(): {total: number; avgCompletion: number; avgScore: number; overdueUpdates: number} {
    const avgComp = this._zba1SecurityTrainingCatalog.reduce((s, t) => s + t.completionRate, 0) / this._zba1SecurityTrainingCatalog.length;
    const avgScore = this._zba1SecurityTrainingCatalog.filter(t => t.avgScore > 0).reduce((s, t) => s + t.avgScore, 0) / this._zba1SecurityTrainingCatalog.filter(t => t.avgScore > 0).length;
    return {total: this._zba1SecurityTrainingCatalog.length, avgCompletion: Math.round(avgComp * 10) / 10, avgScore: Math.round(avgScore), overdueUpdates: 0};
  }

  private _getzba1ToolHealthSummary(): {total: number; healthy: number; degraded: number; annualCost: string} {
    const healthy = this._zba1SecurityToolInventory.filter(t => t.health === 'healthy').length;
    const degraded = this._zba1SecurityToolInventory.filter(t => t.health === 'degraded').length;
    const cost = this._zba1SecurityToolInventory.reduce((s, t) => s + parseInt(t.annualCost.replace(/[^0-9]/g, '')), 0);
    return {total: this._zba1SecurityToolInventory.length, healthy, degraded, annualCost: '$' + (cost / 1000).toFixed(0) + 'K'};
  }


  private _xba1SecurityZones = [
    {zoneId: 'xba1-Z-001', name: 'Internet DMZ', trustLevel: 'Untrusted', subnet: '10.0.0.0/24', segmentation: 'Dual-firewall', firewallRules: 45, monitoring: 'Full packet capture', assets: ['Web servers', 'Load balancers', 'WAF appliances', 'Reverse proxy'], riskLevel: 'high' as const, lastAssessment: '2026-04-15', nextAssessment: '2026-07-15'},
    {zoneId: 'xba1-Z-002', name: 'Corporate Network', trustLevel: 'Trusted', subnet: '10.1.0.0/16', segmentation: 'VLAN + micro-seg', firewallRules: 128, monitoring: 'NetFlow + IDS', assets: ['Workstations', 'Printers', 'Meeting room systems', 'VoIP phones'], riskLevel: 'medium' as const, lastAssessment: '2026-04-10', nextAssessment: '2026-07-10'},
    {zoneId: 'xba1-Z-003', name: 'Production Data Center', trustLevel: 'Restricted', subnet: '10.2.0.0/16', segmentation: 'Full micro-segmentation', firewallRules: 256, monitoring: 'Full packet capture + EDR', assets: ['Application servers', 'Database clusters', 'Message queues', 'API gateways'], riskLevel: 'low' as const, lastAssessment: '2026-04-12', nextAssessment: '2026-07-12'},
    {zoneId: 'xba1-Z-004', name: 'Management Network', trustLevel: 'Restricted', subnet: '10.3.0.0/24', segmentation: 'Isolated VLAN', firewallRules: 32, monitoring: 'Syslog + SNMP', assets: ['Hypervisors', 'Switch management', 'Storage controllers', 'Backup appliances'], riskLevel: 'low' as const, lastAssessment: '2026-04-08', nextAssessment: '2026-07-08'},
    {zoneId: 'xba1-Z-005', name: 'Cloud Production', trustLevel: 'Restricted', subnet: 'VPC: 172.16.0.0/12', segmentation: 'Security groups + NACLs', firewallRules: 189, monitoring: 'VPC Flow Logs + GuardDuty', assets: ['Kubernetes clusters', 'Managed databases', 'Object storage', 'Serverless functions'], riskLevel: 'medium' as const, lastAssessment: '2026-04-18', nextAssessment: '2026-07-18'}
  ];

  private _xba1SecurityAlerts = [
    {id: 'xba1-AL-001', severity: 'critical', title: 'Active ransomware encryption detected on PROD-DB-01', source: 'CrowdStrike', timestamp: '2026-04-22T13:45:00Z', status: 'investigating', assignee: 'SOC Analyst J. Smith', asset: 'PROD-DB-01 (10.2.1.15)', mitreTechnique: 'T1486 - Data Encrypted for Impact', playbook: 'IR-Ransomware-Isolate', sla: '15 minutes', elapsed: '12 minutes', notes: 'EDR detected mass file encryption event pattern. Automated isolation triggered. IR team paged.'},
    {id: 'xba1-AL-002', severity: 'high', title: 'Impossible travel detected for user admin@company.com', source: 'Okta', timestamp: '2026-04-22T12:30:00Z', status: 'triaged', assignee: 'SOC Analyst M. Johnson', asset: 'Okta - admin@company.com', mitreTechnique: 'T1078 - Valid Accounts', playbook: 'IR-ImpossibleTravel', sla: '30 minutes', elapsed: '87 minutes', notes: 'Login from Tokyo followed by login from New York within 30 minutes. Account temporarily locked. User confirmed via out-of-band channel they are in New York.'},
    {id: 'xba1-AL-003', severity: 'high', title: 'Public S3 bucket discovered with customer PII exposure', source: 'Prisma Cloud', timestamp: '2026-04-22T11:15:00Z', status: 'remediating', assignee: 'Cloud Security Lead A. Chen', asset: 'AWS S3: customer-data-archive-2024', mitreTechnique: 'N/A - Misconfiguration', playbook: 'IR-Cloud-Misconfig-Remediate', sla: '1 hour', elapsed: '2.5 hours', notes: 'Bucket containing archived customer records was publicly accessible. Bucket blocked and encrypted. Data exposure assessment in progress.'},
    {id: 'xba1-AL-004', severity: 'medium', title: 'Anomalous data download by user jane.developer@company.com', source: 'Microsoft DLP', timestamp: '2026-04-22T10:00:00Z', status: 'investigating', assignee: 'SOC Analyst R. Davis', asset: 'Endpoint: WS-DEV-042', mitreTechnique: 'T1567 - Exfil Over Web Service', playbook: 'IR-DLP-Investigation', sla: '4 hours', elapsed: '3.5 hours', notes: 'User downloaded 4.2GB of source code files to personal Google Drive. Interview scheduled with user and manager.'},
    {id: 'xba1-AL-005', severity: 'medium', title: 'Credential stuffing attack detected on customer portal', source: 'Cloudflare WAF', timestamp: '2026-04-22T09:30:00Z', status: 'contained', assignee: 'SOC Analyst K. Wilson', asset: 'Customer Portal (portal.company.com)', mitreTechnique: 'T1110 - Brute Force', playbook: 'IR-CredentialStuffing-Block', sla: '2 hours', elapsed: '4 hours', notes: 'Rate limiting and CAPTCHA automatically deployed. 12,000 failed login attempts from 800 unique IPs blocked. No successful account takeovers confirmed.'},
    {id: 'xba1-AL-006', severity: 'low', title: 'SSL certificate expiring in 14 days for api.company.com', source: 'Certificate monitoring', timestamp: '2026-04-22T08:00:00Z', status: 'remediated', assignee: 'Infrastructure Lead T. Brown', asset: 'api.company.com', mitreTechnique: 'N/A', playbook: 'Certificate Renewal', sla: '30 days', elapsed: '16 days', notes: 'Automated renewal triggered via ACME. New certificate deployed successfully. No service interruption.'}
  ];

  private _xba1ComplianceFrameworks = [
    {name: 'PCI DSS v4.0', status: 'compliant' as const, lastAudit: '2026-02-15', nextAudit: '2027-02-15', requirements: 250, compliant: 248, partiallyCompliant: 2, nonCompliant: 0, keyGaps: ['Requirement 6.4.3 - Additional verification for changes to payment pages', 'Requirement 12.3.1 - Targeted risk analysis frequency documentation'], remediationOwner: 'Compliance Officer', estimatedRemediation: 'Q3 2026'},
    {name: 'HIPAA Security Rule', status: 'compliant' as const, lastAudit: '2026-01-20', nextAudit: '2027-01-20', requirements: 78, compliant: 76, partiallyCompliant: 2, nonCompliant: 0, keyGaps: ['Administrative safeguards - workforce security training documentation', 'Technical safeguards - audit control review frequency'], remediationOwner: 'Privacy Officer', estimatedRemediation: 'Q2 2026'},
    {name: 'SOC 2 Type II', status: 'compliant' as const, lastAudit: '2026-03-01', nextAudit: '2027-03-01', requirements: 64, compliant: 63, partiallyCompliant: 1, nonCompliant: 0, keyGaps: ['CC6.1 - Logical access security for production systems documentation update'], remediationOwner: 'GRC Team', estimatedRemediation: 'Q2 2026'},
    {name: 'GDPR', status: 'mostly_compliant' as const, lastAudit: '2026-04-01', nextAudit: '2026-10-01', requirements: 99, compliant: 94, partiallyCompliant: 4, nonCompliant: 1, keyGaps: ['Article 30 - Records of processing activities update', 'Article 35 - DPIA for new AI processing', 'Article 32 - Security of processing documentation', 'Article 33 - 72-hour breach notification procedure test'], remediationOwner: 'DPO', estimatedRemediation: 'Q3 2026'}
  ];

  private _xba1DataClassificationPolicy = [
    {level: 'Public', description: 'Information approved for public disclosure with no restrictions on access or distribution', color: 'green', examples: ['Marketing materials', 'Press releases', 'Public financial reports', 'Published research papers'], handling: ['No access restrictions', 'Standard handling procedures', 'No encryption required for transmission'], retention: 'Per business need', owner: 'Communications Team'},
    {level: 'Internal', description: 'Information intended for internal use within the organization that could cause minimal harm if disclosed', color: 'blue', examples: ['Internal policies', 'Meeting notes', 'Project documentation', 'Internal newsletters'], handling: ['Access restricted to employees', 'No external sharing without approval', 'Standard encryption for external transmission'], retention: '3-7 years', owner: 'Department Heads'},
    {level: 'Confidential', description: 'Sensitive information that could cause significant harm to the organization or individuals if disclosed', color: 'yellow', examples: ['Customer PII', 'Financial data', 'Employee records', 'Business strategy documents', 'Vendor contracts'], handling: ['Need-to-know access only', 'Encryption required at rest and in transit', 'DLP monitoring enabled', 'Audit logging mandatory'], retention: 'Per regulatory requirements', owner: 'Data Owners'},
    {level: 'Restricted', description: 'Highly sensitive information that could cause severe or catastrophic harm if disclosed', color: 'red', examples: ['Authentication credentials', 'Encryption keys', 'Trade secrets', 'M&A due diligence materials', 'Security vulnerability details'], handling: ['Strict need-to-know with CISO approval', 'End-to-end encryption mandatory', 'Air-gapped storage where possible', 'Enhanced monitoring and alerting', 'Multi-factor authentication required'], retention: 'Minimum necessary', owner: 'CISO'}
  ];

  private _getxba1ZoneSummary(): {total: number; highRisk: number; mediumRisk: number; lowRisk: number; totalRules: number} {
    const high = this._xba1SecurityZones.filter(z => z.riskLevel === 'high').length;
    const med = this._xba1SecurityZones.filter(z => z.riskLevel === 'medium').length;
    const low = this._xba1SecurityZones.filter(z => z.riskLevel === 'low').length;
    const rules = this._xba1SecurityZones.reduce((s, z) => s + z.firewallRules, 0);
    return {total: this._xba1SecurityZones.length, highRisk: high, mediumRisk: med, lowRisk: low, totalRules: rules};
  }

  private _getxba1AlertSummary(): {total: number; critical: number; high: number; medium: number; low: number; open: number; contained: number} {
    const crit = this._xba1SecurityAlerts.filter(a => a.severity === 'critical').length;
    const high = this._xba1SecurityAlerts.filter(a => a.severity === 'high').length;
    const med = this._xba1SecurityAlerts.filter(a => a.severity === 'medium').length;
    const low = this._xba1SecurityAlerts.filter(a => a.severity === 'low').length;
    const open = this._xba1SecurityAlerts.filter(a => a.status === 'investigating' || a.status === 'triaged').length;
    const contained = this._xba1SecurityAlerts.filter(a => a.status === 'contained' || a.status === 'remediated').length;
    return {total: this._xba1SecurityAlerts.length, critical: crit, high, medium: med, low, open, contained};
  }

  private _getxba1ComplianceSummary(): {total: number; fullyCompliant: number; mostlyCompliant: number; avgComplianceRate: number} {
    const full = this._xba1ComplianceFrameworks.filter(f => f.status === 'compliant').length;
    const mostly = this._xba1ComplianceFrameworks.filter(f => f.status === 'mostly_compliant').length;
    const avgRate = this._xba1ComplianceFrameworks.reduce((s, f) => s + (f.compliant / f.requirements * 100), 0) / this._xba1ComplianceFrameworks.length;
    return {total: this._xba1ComplianceFrameworks.length, fullyCompliant: full, mostlyCompliant: mostly, avgComplianceRate: Math.round(avgRate * 10) / 10};
  }

  // === Security Change Management (Round 36 - Block B) ===
  private _cmChanges: Array<{id: string; title: string; type: string; status: string; priority: string;
    requester: string; impact: string; risk: string; created: string; targetDate: string;
    approver: string; rollbackPlan: string; progress: number}> = [];
  private _cmMetrics: {successRate: number; avgDuration: number; rollbackRate: number; emergencyCount: number} = {successRate: 0, avgDuration: 0, rollbackRate: 0, emergencyCount: 0};

  private _initCmChanges() {
    const types = ['Firewall Rule', 'Access Policy', 'Encryption Config', 'Patch Deployment',
      'Tool Upgrade', 'Network Segment', 'Authentication Method', 'Monitoring Rule',
      'Compliance Control', 'Architecture Change'];
    const statuses = ['pending', 'approved', 'in-progress', 'pending', 'approved',
      'pending-review', 'approved', 'pending', 'in-progress', 'pending'];
    const impacts = ['high', 'medium', 'low', 'high', 'medium', 'low', 'high', 'medium', 'low', 'medium'];
    const risks = ['medium', 'high', 'low', 'high', 'medium', 'low', 'medium', 'high', 'low', 'medium'];
    const requesters = ['J.Chen', 'A.Patel', 'M.Garcia', 'S.Kim', 'R.Johnson',
      'L.Williams', 'D.Brown', 'K.Taylor', 'P.Anderson', 'T.Martinez'];
    this._cmChanges = types.map((type, i) => ({
      id: 'CM-' + String(1000 + idx * 10 + i),
      title: type + ' Update - Phase ' + (idx % 4 + 1),
      type, status: statuses[i], priority: impacts[i],
      requester: requesters[i], impact: impacts[i], risk: risks[i],
      created: '2026-04-' + String(10 + (i % 15)).padStart(2, '0'),
      targetDate: '2026-05-' + String(1 + (i % 20)).padStart(2, '0'),
      approver: i % 3 === 0 ? 'CISO' : i % 3 === 1 ? 'Sec Lead' : 'IT Director',
      rollbackPlan: i % 2 === 0 ? 'Automated rollback via IaC' : 'Manual reversion documented',
      progress: statuses[i] === 'in-progress' ? 30 + (i * 15) : 0
    }));
    this._cmMetrics = {
      successRate: 88 + (idx % 10),
      avgDuration: 3 + (idx % 5),
      rollbackRate: 4 + (idx % 4),
      emergencyCount: 2 + (idx % 6)
    };
  }

  private _cmGetByStatus(status: string): number {
    return this._cmChanges.filter(c => c.status === status).length;
  }

  private _cmAssessImpact(changeId: string): {affected: string[]; downtime: string; risk: string} {
    const change = this._cmChanges.find(c => c.id === changeId);
    if (!change) return {affected: [], downtime: '0h', risk: 'none'};
    const affected = ['Production Systems', 'Staging Environment', 'CI/CD Pipeline', 'Monitoring Stack'];
    const downtime = change.impact === 'high' ? '2-4h' : change.impact === 'medium' ? '30min-1h' : '<15min';
    return {affected: affected.slice(0, 2 + (idx % 3)), downtime, risk: change.risk};
  }

  private _cmGetTimeline(): Array<{week: string; planned: number; completed: number; failed: number}> {
    const weeks = ['W1 Apr', 'W2 Apr', 'W3 Apr', 'W4 Apr', 'W1 May', 'W2 May'];
    return weeks.map((w, i) => ({
      week: w,
      planned: 3 + (i % 3),
      completed: 2 + ((i + idx) % 4),
      failed: i % 5 === 0 ? 1 : 0
    }));
  }

  private _cmGetApprovalQueue(): Array<{id: string; title: string; risk: string; urgency: string}> {
    return this._cmChanges.filter(c => c.status === 'pending' || c.status === 'pending-review').map(c => ({
      id: c.id, title: c.title, risk: c.risk,
      urgency: c.priority === 'high' ? 'urgent' : 'normal'
    }));
  }


  // === Incident Analytics Engine (Round 36 - Pass 2 - Block D) ===

  private _iaIncidents: Array<{id: string; title: string; severity: string; category: string;
    status: string; assignedTo: string; created: string; resolved: string;
    mttd: number; mttr: number; rootCause: string; lessonsLearned: string}> = [];
  private _iaPatterns: Array<{pattern: string; frequency: number; severity: string; recommendation: string}> = [];

  private _initIaIncidents() {
    const titles = ['Credential Theft via Phishing', 'Ransomware Attempt Blocked', 'Data Exfiltration Detected',
      'Unauthorized Access to Cloud Console', 'Malware on Developer Workstation',
      'DDoS Attack on Public API', 'Insider Data Download Anomaly', 'Supply Chain Alert - Dependency',
      'Brute Force on VPN Gateway', 'Compliance Violation - Unencrypted Data',
      'Zero-Day in Third-Party Library', 'Privilege Escalation Attempt'];
    const categories = ['Social Engineering', 'Malware', 'Data Protection', 'Cloud Security',
      'Endpoint', 'Network', 'Insider Threat', 'Supply Chain', 'Network', 'Compliance',
      'Vulnerability', 'Access Control'];
    const severities = ['critical', 'high', 'critical', 'high', 'medium', 'medium', 'high', 'high', 'medium', 'low', 'critical', 'high'];
    const statuses = ['resolved', 'resolved', 'resolved', 'in-progress', 'resolved', 'resolved', 'investigating', 'resolved', 'resolved', 'resolved', 'in-progress', 'resolved'];
    const assignees = ['SOC Tier 2', 'SOC Tier 3', 'DFIR Team', 'Cloud Sec', 'Endpoint Team',
      'Network Ops', 'Insider Threat', 'Supply Chain', 'SOC Tier 1', 'GRC Team', 'AppSec', 'IAM Team'];
    this._iaIncidents = titles.map((title, i) => ({
      id: 'INC-2026-' + String(1000 + idx * 10 + i),
      title, severity: severities[i], category: categories[i],
      status: statuses[i], assignedTo: assignees[i],
      created: '2026-04-' + String(1 + (i * 2 % 20)).padStart(2, '0') + 'T' + String(8 + (i % 12)).padStart(2, '0') + ':00',
      resolved: statuses[i] === 'resolved' ? '2026-04-' + String(2 + (i * 2 % 20)).padStart(2, '0') + 'T14:00' : '',
      mttd: 10 + ((idx + i * 7) % 120),
      mttr: 60 + ((idx + i * 11) % 480),
      rootCause: ['Credential phishing', 'Ransomware delivery', 'DLP rule violation',
        'IAM misconfiguration', 'Drive-by download', 'Volumetric flood',
        'Excessive data access', 'Vulnerable dependency', 'Credential stuffing',
        'Policy violation', 'Known CVE exploit', 'Permission misassignment'][i],
      lessonsLearned: i % 3 === 0 ? 'Enhanced monitoring required' : i % 3 === 1 ? 'Process improvement needed' : 'No major gaps identified'
    }));
    this._iaPatterns = [
      {pattern: 'Recurring phishing targets finance team', frequency: 8 + idx % 5, severity: 'high', recommendation: 'Implement targeted awareness training and email filtering rules'},
      {pattern: 'Cloud misconfiguration incidents increasing', frequency: 5 + idx % 4, severity: 'medium', recommendation: 'Deploy CSPM tooling and IaC validation in CI/CD'},
      {pattern: 'After-hours access anomalies on weekends', frequency: 3 + idx % 3, severity: 'low', recommendation: 'Review and enforce just-in-time access policies'},
      {pattern: 'Supply chain vulnerabilities in dependencies', frequency: 6 + idx % 4, severity: 'high', recommendation: 'Implement automated dependency scanning and SBOM management'},
    ];
  }

  private _iaGetMetrics(): {total: number; mttd: number; mttr: number; resolvedRate: number} {
    const resolved = this._iaIncidents.filter(i => i.status === 'resolved');
    return {
      total: this._iaIncidents.length,
      mttd: Math.round(resolved.reduce((s, i) => s + i.mttd, 0) / resolved.length),
      mttr: Math.round(resolved.reduce((s, i) => s + i.mttr, 0) / resolved.length),
      resolvedRate: Math.round(resolved.length / this._iaIncidents.length * 100)
    };
  }

  private _iaGetBySeverity(): {critical: number; high: number; medium: number; low: number} {
    return {
      critical: this._iaIncidents.filter(i => i.severity === 'critical').length,
      high: this._iaIncidents.filter(i => i.severity === 'high').length,
      medium: this._iaIncidents.filter(i => i.severity === 'medium').length,
      low: this._iaIncidents.filter(i => i.severity === 'low').length,
    };
  }

  private _iaGetActiveIncidents(): Array<{id: string; title: string; severity: string; age: string}> {
    return this._iaIncidents.filter(i => i.status !== 'resolved').map(i => ({
      id: i.id, title: i.title, severity: i.severity, age: '2-5 days'
    }));
  }


  // === Risk Assessment Engine (Round 36 - Pass 3 - Block A) ===

  private _raRisks: Array<{id: string; title: string; category: string; likelihood: number;
    impact: number; riskScore: number; owner: string; status: string;
    mitigationPlan: string; residualRisk: number; lastReview: string;
    nextReview: string; relatedControls: string[]; notes: string}> = [];
  private _raMatrix: Record<string, Record<string, number>> = {};
  private _raCategories: string[] = ['Strategic', 'Operational', 'Financial', 'Compliance', 'Technology', 'Reputational'];

  private _initRaRisks() {
    const risks = [
      {title: 'Ransomware attack on critical infrastructure', category: 'Technology', owner: 'CISO', mitigationPlan: 'Deploy advanced EDR, implement network segmentation, maintain offline backups'},
      {title: 'Data breach due to insider threat', category: 'Operational', owner: 'HR Director', mitigationPlan: 'Implement DLP, conduct behavioral analytics, enforce least privilege'},
      {title: 'Non-compliance with GDPR Article 33', category: 'Compliance', owner: 'DPO', mitigationPlan: 'Automate breach notification workflows, train incident responders'},
      {title: 'Third-party vendor security failure', category: 'Operational', owner: 'Procurement', mitigationPlan: 'Implement vendor risk scoring, conduct regular assessments'},
      {title: 'Cloud misconfiguration exposure', category: 'Technology', owner: 'Cloud Lead', mitigationPlan: 'Deploy CSPM, implement IaC scanning, enforce guardrails'},
      {title: 'Phishing campaign targeting executives', category: 'Operational', owner: 'SOC Lead', mitigationPlan: 'Deploy anti-phishing tools, conduct regular simulations'},
      {title: 'Supply chain compromise via dependencies', category: 'Technology', owner: 'AppSec Lead', mitigationPlan: 'Implement SCA, maintain SBOM, monitor vulnerability feeds'},
      {title: 'Regulatory penalty for inadequate controls', category: 'Compliance', owner: 'CLO', mitigationPlan: 'Quarterly compliance reviews, gap remediation tracking'},
      {title: 'Key person dependency in security team', category: 'Strategic', owner: 'CISO', mitigationPlan: 'Cross-training program, documentation, knowledge sharing'},
      {title: 'Reputational damage from security incident', category: 'Reputational', owner: 'PR Director', mitigationPlan: 'Incident communication plan, media training, proactive disclosure'},
    ];
    const statuses = ['open', 'mitigating', 'accepted', 'open', 'mitigating', 'mitigating', 'open', 'mitigating', 'open', 'accepted'];
    this._raRisks = risks.map((r, i) => {
      const likelihood = 20 + ((idx * 7 + i * 13) % 70);
      const impact = 30 + ((idx * 3 + i * 11) % 60);
      const riskScore = Math.round(likelihood * impact / 100);
      const residualRisk = Math.round(riskScore * (0.3 + ((idx + i) % 4) * 0.15));
      return {
        id: 'RA-' + String(2000 + idx * 10 + i),
        title: r.title, category: r.category,
        likelihood, impact, riskScore,
        owner: r.owner, status: statuses[i],
        mitigationPlan: r.mitigationPlan,
        residualRisk,
        lastReview: '2026-04-' + String(1 + (i * 2 % 20)).padStart(2, '0'),
        nextReview: '2026-07-' + String(1 + (i * 3 % 20)).padStart(2, '0'),
        relatedControls: ['Control-' + (i * 3 + 1), 'Control-' + (i * 3 + 2), 'Control-' + (i * 3 + 3)],
        notes: i % 2 === 0 ? 'Requires board-level attention' : 'Within risk appetite'
      };
    });
    const levels = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
    const impacts = ['Negligible', 'Minor', 'Moderate', 'Major', 'Severe'];
    levels.forEach((l, li) => {
      this._raMatrix[l] = {};
      impacts.forEach((imp, ii) => {
        this._raMatrix[l][imp] = (li + 1) * (ii + 1);
      });
    });
  }

  private _raGetRiskDistribution(): {critical: number; high: number; medium: number; low: number} {
    const risks = this._raRisks;
    return {
      critical: risks.filter(r => r.riskScore >= 20).length,
      high: risks.filter(r => r.riskScore >= 12 && r.riskScore < 20).length,
      medium: risks.filter(r => r.riskScore >= 6 && r.riskScore < 12).length,
      low: risks.filter(r => r.riskScore < 6).length,
    };
  }

  private _raGetByCategory(): Array<{category: string; count: number; avgRisk: number; maxRisk: number}> {
    const grouped: Record<string, number[]> = {};
    this._raRisks.forEach(r => {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push(r.riskScore);
    });
    return Object.entries(grouped).map(([cat, scores]) => ({
      category: cat, count: scores.length,
      avgRisk: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      maxRisk: Math.max(...scores)
    }));
  }

  private _raGetTopRisks(): Array<{title: string; score: number; owner: string; status: string}> {
    return [...this._raRisks].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5)
      .map(r => ({title: r.title, score: r.riskScore, owner: r.owner, status: r.status}));
  }

  private _raGetRiskTrend(): Array<{month: string; avgScore: number; count: number}> {
    const months = ['Jan', 'Feb', 'Mar', 'Apr'];
    let base = 12 + (idx % 5);
    return months.map((m, i) => ({
      month: m,
      avgScore: Math.max(5, base - i + ((idx % 3) - 1)),
      count: 8 + ((idx + i) % 5)
    }));
  }

  private _raCalculateRiskAppetite(): {current: number; appetite: number; status: string} {
    const avg = Math.round(this._raRisks.reduce((s, r) => s + r.residualRisk, 0) / this._raRisks.length);
    const appetite = 10 + (idx % 5);
    return {current: avg, appetite, status: avg > appetite ? 'exceeded' : 'within'};
  }


  // === Security Architecture Review (Round 36 - Pass 4) ===

  private _sarComponents: Array<{id: string; name: string; type: string; layer: string;
    securityLevel: number; complianceScore: number; lastReview: string;
    reviewer: string; findings: number; criticalFindings: number;
    recommendations: string[]; status: string; technology: string}> = [];

  private _initSarReview() {
    const components = [
      {name: 'API Gateway', type: 'Perimeter', layer: 'Network', technology: 'Kong'},
      {name: 'Web Application Firewall', type: 'Perimeter', layer: 'Application', technology: 'AWS WAF'},
      {name: 'Identity Provider', type: 'Identity', layer: 'Authentication', technology: 'Okta'},
      {name: 'SIEM Platform', type: 'Detection', layer: 'Monitoring', technology: 'Splunk'},
      {name: 'EDR Solution', type: 'Endpoint', layer: 'Host', technology: 'CrowdStrike'},
      {name: 'Secrets Vault', type: 'Credential', layer: 'Application', technology: 'HashiCorp Vault'},
      {name: 'Container Registry', type: 'Container', layer: 'Infrastructure', technology: 'Harbor'},
      {name: 'Database Encryption', type: 'Encryption', layer: 'Data', technology: 'AES-256'},
      {name: 'Network Segmentation', type: 'Network', layer: 'Infrastructure', technology: 'VLAN/VXLAN'},
      {name: 'DLP Engine', type: 'Data Protection', layer: 'Application', technology: 'Symantec DLP'},
      {name: 'Patch Management', type: 'Vulnerability', layer: 'Host', technology: 'Qualys'},
      {name: 'Backup System', type: 'Recovery', layer: 'Infrastructure', technology: 'Veeam'},
    ];
    const reviewers = ['Sec Architect', 'Cloud Architect', 'Network Engineer', 'AppSec Lead', 'IAM Lead', 'SOC Manager'];
    this._sarComponents = components.map((c, i) => ({
      id: 'SAR-' + (400 + i),
      name: c.name, type: c.type, layer: c.layer, technology: c.technology,
      securityLevel: 60 + ((idx * 7 + i * 11) % 35),
      complianceScore: 55 + ((idx * 5 + i * 13) % 40),
      lastReview: '2026-0' + (1 + (i % 4)) + '-' + String(1 + (i * 3 % 20)).padStart(2, '0'),
      reviewer: reviewers[i % reviewers.length],
      findings: 2 + ((idx + i * 3) % 8),
      criticalFindings: i % 4 === 0 ? 1 + (idx % 2) : 0,
      recommendations: i % 3 === 0
        ? ['Upgrade to latest version', 'Implement additional monitoring', 'Review access controls']
        : ['Enhance logging', 'Update configuration', 'Add redundancy'],
      status: i % 5 === 0 ? 'needs-review' : 'compliant'
    }));
  }

  private _sarGetSecurityPosture(): {overall: number; byLayer: Record<string, number>; weakest: string; strongest: string} {
    const byLayer: Record<string, number> = {};
    this._sarComponents.forEach(c => {
      if (!byLayer[c.layer]) byLayer[c.layer] = [];
      byLayer[c.layer].push(c.securityLevel);
    });
    const layerScores: Record<string, number> = {};
    Object.entries(byLayer).forEach(([layer, scores]) => {
      layerScores[layer] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    });
    const overall = Math.round(this._sarComponents.reduce((s, c) => s + c.securityLevel, 0) / this._sarComponents.length);
    const entries = Object.entries(layerScores).sort((a, b) => a[1] - b[1]);
    return {overall, byLayer: layerScores, weakest: entries[0][0], strongest: entries[entries.length - 1][0]};
  }

  private _sarGetCriticalFindings(): Array<{component: string; title: string; severity: string; recommendation: string}> {
    return this._sarComponents.filter(c => c.criticalFindings > 0).map(c => ({
      component: c.name, title: 'Critical security gap identified',
      severity: 'critical',
      recommendation: c.recommendations[0]
    }));
  }

  private _sarGetComplianceGaps(): {totalFindings: number; criticalCount: number; avgCompliance: number} {
    return {
      totalFindings: this._sarComponents.reduce((s, c) => s + c.findings, 0),
      criticalCount: this._sarComponents.reduce((s, c) => s + c.criticalFindings, 0),
      avgCompliance: Math.round(this._sarComponents.reduce((s, c) => s + c.complianceScore, 0) / this._sarComponents.length)
    };
  }

  private _sarGetComponentMap(): Array<{name: string; type: string; layer: string; securityLevel: number; status: string}> {
    return this._sarComponents.map(c => ({
      name: c.name, type: c.type, layer: c.layer,
      securityLevel: c.securityLevel, status: c.status
    }));
  }



  // === Security Risk Register (security_tim) ===
  private _security_timRiskRegister = [
    { id: "RSK-SEC-0001", title: "Data breach from unpatched systems", owner: "CTO", category: "Financial", status: "mitigating", trend: "stable", severity: "medium", likelihood: 1, impact: 5, treatment: "Monitor and review quarterly", lastReview: "2026-04-12", nextReview: "2026-07-14" },
    { id: "RSK-SEC-0002", title: "Ransomware attack on critical infrastructure", owner: "CRO", category: "Strategic", status: "closed", trend: "decreasing", severity: "medium", likelihood: 10, impact: 5, treatment: "Monitor and review quarterly", lastReview: "2026-04-22", nextReview: "2026-07-24" },
    { id: "RSK-SEC-0003", title: "Insider threat data exfiltration", owner: "VP Eng", category: "Compliance", status: "accepted", trend: "increasing", severity: "high", likelihood: 7, impact: 3, treatment: "Monitor and review quarterly", lastReview: "2026-04-12", nextReview: "2026-07-16" },
    { id: "RSK-SEC-0004", title: "Supply chain compromise", owner: "Security Lead", category: "Technical", status: "open", trend: "stable", severity: "low", likelihood: 6, impact: 3, treatment: "Monitor and review quarterly", lastReview: "2026-04-11", nextReview: "2026-07-23" },
    { id: "RSK-SEC-0005", title: "Cloud misconfiguration exposure", owner: "Risk Mgr", category: "Reputational", status: "mitigating", trend: "decreasing", severity: "medium", likelihood: 3, impact: 5, treatment: "Monitor and review quarterly", lastReview: "2026-04-23", nextReview: "2026-07-24" },
    { id: "RSK-SEC-0006", title: "Phishing campaign success rate", owner: "Compliance Dir", category: "Legal", status: "closed", trend: "increasing", severity: "high", likelihood: 1, impact: 6, treatment: "Monitor and review quarterly", lastReview: "2026-04-22", nextReview: "2026-07-10" },
    { id: "RSK-SEC-0007", title: "Third-party vendor data breach", owner: "IT Dir", category: "Regulatory", status: "accepted", trend: "stable", severity: "high", likelihood: 3, impact: 9, treatment: "Monitor and review quarterly", lastReview: "2026-04-03", nextReview: "2026-07-27" },
    { id: "RSK-SEC-0008", title: "Regulatory non-compliance penalty", owner: "DevOps Lead", category: "Third-Party", status: "open", trend: "decreasing", severity: "high", likelihood: 4, impact: 6, treatment: "Monitor and review quarterly", lastReview: "2026-04-12", nextReview: "2026-07-25" },
    { id: "RSK-SEC-0009", title: "Zero-day exploit in production", owner: "Architect", category: "Human Capital", status: "mitigating", trend: "increasing", severity: "medium", likelihood: 4, impact: 7, treatment: "Monitor and review quarterly", lastReview: "2026-04-03", nextReview: "2026-07-21" },
    { id: "RSK-SEC-0010", title: "Insufficient access controls", owner: "CISO", category: "Operational", status: "closed", trend: "stable", severity: "critical", likelihood: 3, impact: 1, treatment: "Monitor and review quarterly", lastReview: "2026-04-11", nextReview: "2026-07-22" },
    { id: "RSK-SEC-0011", title: "DDoS attack on services", owner: "CTO", category: "Financial", status: "accepted", trend: "decreasing", severity: "medium", likelihood: 5, impact: 9, treatment: "Monitor and review quarterly", lastReview: "2026-04-07", nextReview: "2026-07-14" },
    { id: "RSK-SEC-0012", title: "Social engineering attack", owner: "CRO", category: "Strategic", status: "open", trend: "increasing", severity: "low", likelihood: 2, impact: 8, treatment: "Monitor and review quarterly", lastReview: "2026-04-06", nextReview: "2026-07-22" },
    { id: "RSK-SEC-0013", title: "API security vulnerability", owner: "VP Eng", category: "Compliance", status: "mitigating", trend: "stable", severity: "medium", likelihood: 8, impact: 1, treatment: "Monitor and review quarterly", lastReview: "2026-04-20", nextReview: "2026-07-25" },
    { id: "RSK-SEC-0014", title: "Mobile device compromise", owner: "Security Lead", category: "Technical", status: "closed", trend: "decreasing", severity: "critical", likelihood: 10, impact: 3, treatment: "Monitor and review quarterly", lastReview: "2026-04-08", nextReview: "2026-07-20" },
    { id: "RSK-SEC-0015", title: "Physical security breach", owner: "Risk Mgr", category: "Reputational", status: "accepted", trend: "increasing", severity: "high", likelihood: 3, impact: 9, treatment: "Monitor and review quarterly", lastReview: "2026-04-16", nextReview: "2026-07-27" },
    { id: "RSK-SEC-0016", title: "Password policy weakness", owner: "Compliance Dir", category: "Legal", status: "open", trend: "stable", severity: "medium", likelihood: 1, impact: 4, treatment: "Monitor and review quarterly", lastReview: "2026-04-18", nextReview: "2026-07-20" },
    { id: "RSK-SEC-0017", title: "Network segmentation gap", owner: "IT Dir", category: "Regulatory", status: "mitigating", trend: "decreasing", severity: "low", likelihood: 1, impact: 10, treatment: "Monitor and review quarterly", lastReview: "2026-04-16", nextReview: "2026-07-11" },
    { id: "RSK-SEC-0018", title: "Encryption key management failure", owner: "DevOps Lead", category: "Third-Party", status: "closed", trend: "increasing", severity: "medium", likelihood: 5, impact: 9, treatment: "Monitor and review quarterly", lastReview: "2026-04-19", nextReview: "2026-07-07" },
    { id: "RSK-SEC-0019", title: "Audit trail tampering", owner: "Architect", category: "Human Capital", status: "accepted", trend: "stable", severity: "medium", likelihood: 3, impact: 2, treatment: "Monitor and review quarterly", lastReview: "2026-04-21", nextReview: "2026-07-17" },
    { id: "RSK-SEC-0020", title: "Business email compromise", owner: "CISO", category: "Operational", status: "open", trend: "decreasing", severity: "medium", likelihood: 1, impact: 6, treatment: "Monitor and review quarterly", lastReview: "2026-04-04", nextReview: "2026-07-27" },
  ];
  private _security_timRiskFilter: string = 'all';
  private _security_timRiskSeverity: string = 'all';
  private _security_timRiskStatus: string = 'all';
  private _security_timExpandedRisk: string = '';
  private _security_timFilterRisks() {
    const reg = this._security_timRiskRegister;
    return reg.filter(r => {
      if (this._security_timRiskFilter !== "all" && r.category !== this._security_timRiskFilter) return false;
      if (this._security_timRiskSeverity !== "all" && r.severity !== this._security_timRiskSeverity) return false;
      if (this._security_timRiskStatus !== "all" && r.status !== this._security_timRiskStatus) return false;
      return true;
    });
  }
  private _security_timGetRiskScore(r: any) { return Math.round(r.likelihood * r.impact * 1.5); }
  private _security_timGetRiskTrendIcon(trend: string) {
    if (trend === "increasing") return "\u2191";
    if (trend === "decreasing") return "\u2193";
    return "\u2192";
  }
  private _security_timGetRiskColor(sev: string) {
    if (sev === "critical") return "#dc2626";
    if (sev === "high") return "#ea580c";
    if (sev === "medium") return "#d97706";
    return "#16a34a";
  }
  private _security_timGetRiskCounts() {
    const reg = this._security_timRiskRegister;
    return { total: reg.length, open: reg.filter(r=>r.status==="open").length, mitigating: reg.filter(r=>r.status==="mitigating").length, closed: reg.filter(r=>r.status==="closed").length, accepted: reg.filter(r=>r.status==="accepted").length, critical: reg.filter(r=>r.severity==="critical").length };
  }
  private _security_timGetTreatmentProgress() {
    const reg = this._security_timRiskRegister;
    const treated = reg.filter(r => r.status === "mitigating" || r.status === "closed").length;
    return Math.round((treated / Math.max(reg.length, 1)) * 100);
  }

  // === Security Metrics API Gateway (security_tim) ===
  private _security_timApiEndpoints = [
    { method: "GET", path: "/api/v1/threats", name: "Threat Intelligence Feed", status: "active", avgLatency: 249.2, reqPerMin: 1804.0, errorRate: 0.04, uptime: round(97.96867535199253,2), version: "v2.8.13" },
    { method: "POST", path: "/api/v1/scans/start", name: "Vulnerability Scanner", status: "active", avgLatency: 232.5, reqPerMin: 2288.0, errorRate: 2.0, uptime: round(97.80908340092533,2), version: "v3.5.7" },
    { method: "GET", path: "/api/v1/assets", name: "Asset Inventory", status: "active", avgLatency: 356.9, reqPerMin: 2156.0, errorRate: 0.12, uptime: round(97.75699236794284,2), version: "v3.1.15" },
    { method: "POST", path: "/api/v1/alerts", name: "Alert Management", status: "active", avgLatency: 210.8, reqPerMin: 1614.0, errorRate: 0.02, uptime: round(97.17209183162892,2), version: "v3.8.20" },
    { method: "GET", path: "/api/v1/compliance", name: "Compliance Status", status: "active", avgLatency: 180.8, reqPerMin: 1234.0, errorRate: 1.83, uptime: round(98.28275655059491,2), version: "v2.1.11" },
    { method: "PUT", path: "/api/v1/policies", name: "Policy Engine", status: "active", avgLatency: 228.3, reqPerMin: 1508.0, errorRate: 1.51, uptime: round(95.88112268068701,2), version: "v1.3.3" },
    { method: "GET", path: "/api/v1/incidents", name: "Incident Tracker", status: "active", avgLatency: 250.8, reqPerMin: 1390.0, errorRate: 1.02, uptime: round(99.41711500810767,2), version: "v3.0.3" },
    { method: "POST", path: "/api/v1/forensics", name: "Forensics Collector", status: "degraded", avgLatency: 406.0, reqPerMin: 2172.0, errorRate: 1.03, uptime: round(97.07471721442624,2), version: "v3.7.5" },
    { method: "GET", path: "/api/v1/risk/assess", name: "Risk Assessment", status: "active", avgLatency: 142.1, reqPerMin: 900.0, errorRate: 0.73, uptime: round(96.3920585548837,2), version: "v3.7.12" },
    { method: "POST", path: "/api/v1/auth/verify", name: "Authentication", status: "active", avgLatency: 72.1, reqPerMin: 901.0, errorRate: 1.43, uptime: round(97.23133371521152,2), version: "v2.7.10" },
    { method: "GET", path: "/api/v1/logs/audit", name: "Audit Log Query", status: "active", avgLatency: 246.4, reqPerMin: 575.0, errorRate: 1.49, uptime: round(97.80925395358047,2), version: "v1.7.20" },
    { method: "PUT", path: "/api/v1/users/roles", name: "Role Management", status: "active", avgLatency: 25.1, reqPerMin: 1888.0, errorRate: 1.12, uptime: round(95.92799341576867,2), version: "v2.5.17" },
    { method: "POST", path: "/api/v1/encrypt", name: "Encryption Service", status: "active", avgLatency: 421.6, reqPerMin: 1205.0, errorRate: 1.85, uptime: round(96.77030692935482,2), version: "v3.2.5" },
    { method: "GET", path: "/api/v1/network/topo", name: "Network Topology", status: "maintenance", avgLatency: 428.0, reqPerMin: 199.0, errorRate: 0.86, uptime: round(99.83000065907578,2), version: "v3.4.0" },
    { method: "DELETE", path: "/api/v1/sessions", name: "Session Manager", status: "active", avgLatency: 247.7, reqPerMin: 1941.0, errorRate: 0.5, uptime: round(99.45627945117567,2), version: "v1.6.9" },
  ];
  private _security_timApiKeys = [
    { id: "ak-000001", name: "key-secu-001", created: "2026-01-27", lastUsed: "2026-04-10", status: "active", calls: 37908, rateLimit: 100 },
    { id: "ak-000002", name: "key-secu-002", created: "2026-08-18", lastUsed: "2026-04-23", status: "active", calls: 30864, rateLimit: 5000 },
    { id: "ak-000003", name: "key-secu-003", created: "2026-01-20", lastUsed: "2026-04-22", status: "active", calls: 18093, rateLimit: 5000 },
    { id: "ak-000004", name: "key-secu-004", created: "2026-02-11", lastUsed: "2026-04-15", status: "active", calls: 28825, rateLimit: 5000 },
    { id: "ak-000005", name: "key-secu-005", created: "2026-01-02", lastUsed: "2026-04-03", status: "revoked", calls: 11573, rateLimit: 5000 },
    { id: "ak-000006", name: "key-secu-006", created: "2026-05-14", lastUsed: "2026-04-09", status: "active", calls: 14691, rateLimit: 1000 },
    { id: "ak-000007", name: "key-secu-007", created: "2026-04-17", lastUsed: "2026-04-06", status: "active", calls: 39586, rateLimit: 5000 },
    { id: "ak-000008", name: "key-secu-008", created: "2026-04-20", lastUsed: "2026-04-04", status: "revoked", calls: 1426, rateLimit: 5000 },
  ];
  private _security_timApiHealthSummary() {
    const eps = this._security_timApiEndpoints;
    return { total: eps.length, active: eps.filter(e=>e.status==="active").length, degraded: eps.filter(e=>e.status==="degraded").length, maintenance: eps.filter(e=>e.status==="maintenance").length, avgLatency: round(eps.reduce((s,e)=>s+e.avgLatency,0)/eps.length,1), totalReqPerMin: round(eps.reduce((s,e)=>s+e.reqPerMin,0)), avgUptime: round(eps.reduce((s,e)=>s+e.uptime,0)/eps.length,2) };
  }
  private _security_timGetApiByMethod(method: string) { return this._security_timApiEndpoints.filter(e=>e.method===method); }
  private _security_timGetSlowEndpoints() { return this._security_timApiEndpoints.filter(e=>e.avgLatency>200).sort((a,b)=>b.avgLatency-a.avgLatency); }
  private _security_timGetHighErrorEndpoints() { return this._security_timApiEndpoints.filter(e=>e.errorRate>1.0).sort((a,b)=>b.errorRate-a.errorRate); }

  // === Security Training Effectiveness (security_tim) ===
  private _security_timTrainingModules = [
    { id: "TRN-001", name: "Security Fundamentals", completionRate: 75.4, avgScore: 67.1, behaviorChange: 38.8, enrolled: 134, completed: 337, duration: "103min", category: "mandatory" },
    { id: "TRN-002", name: "Phishing Awareness", completionRate: 69.6, avgScore: 81.7, behaviorChange: 79.6, enrolled: 485, completed: 41, duration: "15min", category: "mandatory" },
    { id: "TRN-003", name: "Social Engineering Defense", completionRate: 79.7, avgScore: 84.5, behaviorChange: 30.3, enrolled: 301, completed: 249, duration: "74min", category: "optional" },
    { id: "TRN-004", name: "Password Hygiene", completionRate: 46.1, avgScore: 71.1, behaviorChange: 70.1, enrolled: 94, completed: 385, duration: "43min", category: "mandatory" },
    { id: "TRN-005", name: "Data Classification", completionRate: 77.3, avgScore: 84.8, behaviorChange: 84.1, enrolled: 343, completed: 179, duration: "56min", category: "mandatory" },
    { id: "TRN-006", name: "Incident Response Basics", completionRate: 83.8, avgScore: 84.6, behaviorChange: 50.6, enrolled: 65, completed: 316, duration: "76min", category: "mandatory" },
    { id: "TRN-007", name: "Secure Coding", completionRate: 47.6, avgScore: 81.0, behaviorChange: 80.9, enrolled: 228, completed: 145, duration: "94min", category: "optional" },
    { id: "TRN-008", name: "Cloud Security", completionRate: 46.7, avgScore: 55.8, behaviorChange: 67.2, enrolled: 384, completed: 238, duration: "56min", category: "mandatory" },
    { id: "TRN-009", name: "Mobile Device Security", completionRate: 52.3, avgScore: 62.9, behaviorChange: 42.4, enrolled: 424, completed: 352, duration: "52min", category: "mandatory" },
    { id: "TRN-010", name: "Network Security", completionRate: 93.5, avgScore: 91.2, behaviorChange: 53.9, enrolled: 333, completed: 325, duration: "48min", category: "mandatory" },
    { id: "TRN-011", name: "Physical Security", completionRate: 51.1, avgScore: 58.4, behaviorChange: 57.9, enrolled: 114, completed: 436, duration: "49min", category: "optional" },
    { id: "TRN-012", name: "Regulatory Compliance", completionRate: 50.9, avgScore: 56.8, behaviorChange: 76.2, enrolled: 247, completed: 30, duration: "113min", category: "mandatory" },
    { id: "TRN-013", name: "Risk Management", completionRate: 83.6, avgScore: 87.7, behaviorChange: 76.0, enrolled: 131, completed: 280, duration: "23min", category: "mandatory" },
    { id: "TRN-014", name: "Cryptography Basics", completionRate: 86.1, avgScore: 73.3, behaviorChange: 46.7, enrolled: 371, completed: 273, duration: "47min", category: "mandatory" },
    { id: "TRN-015", name: "Access Control", completionRate: 45.3, avgScore: 85.1, behaviorChange: 34.3, enrolled: 115, completed: 377, duration: "29min", category: "optional" },
    { id: "TRN-016", name: "Vendor Management", completionRate: 87.9, avgScore: 77.6, behaviorChange: 40.0, enrolled: 368, completed: 406, duration: "63min", category: "mandatory" },
  ];
  private _security_timPhishingResults = [
    { month: "2026-01", sent: 428, clicked: 32, reported: 199, clickRate: round(7.476635514018691,1), reportRate: round(46.49532710280374,1) },
    { month: "2026-02", sent: 950, clicked: 124, reported: 386, clickRate: round(13.052631578947368,1), reportRate: round(40.63157894736842,1) },
    { month: "2026-03", sent: 837, clicked: 242, reported: 262, clickRate: round(28.912783751493432,1), reportRate: round(31.30227001194743,1) },
    { month: "2026-04", sent: 437, clicked: 6, reported: 101, clickRate: round(1.3729977116704806,1), reportRate: round(23.112128146453088,1) },
    { month: "2026-05", sent: 951, clicked: 209, reported: 544, clickRate: round(21.976866456361723,1), reportRate: round(57.202944269190326,1) },
    { month: "2026-06", sent: 267, clicked: 50, reported: 90, clickRate: round(18.726591760299627,1), reportRate: round(33.70786516853933,1) },
  ];
  private _security_timTrainingROI = { totalInvestment: 85884, avgCostPerEmployee: 397, riskReductionPct: round(random.uniform(15,45),1), incidentReductionPct: round(random.uniform(10,35),1), complianceScoreGain: round(random.uniform(5,25),1) };
  private _security_timLearningPaths = [
    { name: "Beginner Security Analyst", totalModules: 10, completedModules: 4, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 65, enrolled: 178 },
    { name: "Advanced Threat Hunter", totalModules: 20, completedModules: 3, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 62, enrolled: 197 },
    { name: "Security Architect", totalModules: 16, completedModules: 10, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 22, enrolled: 81 },
    { name: "Incident Responder", totalModules: 9, completedModules: 18, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 46, enrolled: 191 },
    { name: "Compliance Specialist", totalModules: 11, completedModules: 15, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 47, enrolled: 97 },
    { name: "DevSecOps Engineer", totalModules: 19, completedModules: 17, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 30, enrolled: 74 },
  ];
  private _security_timGetOverallCompletion() {
    const mods = this._security_timTrainingModules;
    return round(mods.reduce((s,m)=>s+m.completionRate,0)/mods.length,1);
  }
  private _security_timGetTopPerformers() { return [...this._security_timTrainingModules].sort((a,b)=>b.avgScore-a.avgScore).slice(0,5); }
  private _security_timGetModulesNeedingAttention() { return this._security_timTrainingModules.filter(m=>m.completionRate<70||m.avgScore<65); }

  // === Security Governance Framework (security_tim) ===
  private _security_timGovBodies = [
    { name: "Security Steering Committee", members: 10, chair: "CISO", meetingFreq: "Weekly", lastMeeting: "2026-04-03", nextMeeting: "2026-05-18", quorum: 7 },
    { name: "Risk Management Board", members: 8, chair: "CTO", meetingFreq: "Bi-weekly", lastMeeting: "2026-04-16", nextMeeting: "2026-05-27", quorum: 3 },
    { name: "Data Governance Council", members: 10, chair: "CRO", meetingFreq: "Monthly", lastMeeting: "2026-04-20", nextMeeting: "2026-05-25", quorum: 4 },
    { name: "Compliance Oversight Board", members: 5, chair: "CDO", meetingFreq: "Monthly", lastMeeting: "2026-04-04", nextMeeting: "2026-05-02", quorum: 5 },
    { name: "Architecture Review Board", members: 10, chair: "VP Eng", meetingFreq: "Bi-weekly", lastMeeting: "2026-04-01", nextMeeting: "2026-05-05", quorum: 3 },
    { name: "Change Advisory Board", members: 10, chair: "CISO", meetingFreq: "Weekly", lastMeeting: "2026-04-13", nextMeeting: "2026-05-18", quorum: 6 },
    { name: "Incident Review Board", members: 9, chair: "CIO", meetingFreq: "As needed", lastMeeting: "2026-04-01", nextMeeting: "2026-05-28", quorum: 5 },
    { name: "Vendor Risk Committee", members: 5, chair: "CFO", meetingFreq: "Quarterly", lastMeeting: "2026-04-17", nextMeeting: "2026-05-19", quorum: 8 },
  ];
  private _security_timDecisions = [
    { id: "DEC-0001", title: "Adopt zero-trust architecture framework", date: "2026-03-24", status: "approved", owner: "CISO" },
    { id: "DEC-0002", title: "Migrate to SIEM 2.0 platform", date: "2026-01-18", status: "implemented", owner: "CTO" },
    { id: "DEC-0003", title: "Implement DLP across all endpoints", date: "2026-03-03", status: "in-progress", owner: "Security Lead" },
    { id: "DEC-0004", title: "Mandate MFA for all external access", date: "2026-04-23", status: "pending", owner: "CRO" },
    { id: "DEC-0005", title: "Establish bug bounty program", date: "2026-03-04", status: "approved", owner: "VP Eng" },
    { id: "DEC-0006", title: "Deploy EDR solution enterprise-wide", date: "2026-04-19", status: "approved", owner: "CISO" },
    { id: "DEC-0007", title: "Conduct annual penetration testing", date: "2026-02-08", status: "implemented", owner: "CTO" },
    { id: "DEC-0008", title: "Implement network micro-segmentation", date: "2026-04-18", status: "in-progress", owner: "Security Lead" },
    { id: "DEC-0009", title: "Establish security champion program", date: "2026-04-12", status: "pending", owner: "CRO" },
    { id: "DEC-0010", title: "Migrate to passwordless authentication", date: "2026-04-08", status: "approved", owner: "VP Eng" },
  ];
  private _security_timPolicyLifecycle = [
    { name: "Information Security Policy", version: "v3.0", status: "active", lastUpdated: "2026-02-04", nextReview: "2026-10-27", owner: "CISO" },
    { name: "Acceptable Use Policy", version: "v3.4", status: "active", lastUpdated: "2026-03-11", nextReview: "2026-10-05", owner: "Legal" },
    { name: "Data Retention Policy", version: "v1.0", status: "under-review", lastUpdated: "2026-02-03", nextReview: "2026-7-13", owner: "DPO" },
    { name: "Access Control Policy", version: "v4.5", status: "active", lastUpdated: "2026-02-06", nextReview: "2026-7-07", owner: "IAM Lead" },
    { name: "Incident Response Policy", version: "v1.3", status: "draft", lastUpdated: "2026-01-18", nextReview: "2026-12-22", owner: "IR Lead" },
    { name: "Business Continuity Plan", version: "v1.3", status: "active", lastUpdated: "2026-04-24", nextReview: "2026-11-01", owner: "BCP Mgr" },
    { name: "Vendor Management Policy", version: "v2.5", status: "active", lastUpdated: "2026-01-08", nextReview: "2026-9-04", owner: "Procurement" },
    { name: "Encryption Standard", version: "v1.0", status: "under-review", lastUpdated: "2026-02-10", nextReview: "2026-7-07", owner: "Security Arch" },
  ];
  private _security_timGovMaturityScore = { overall: 3.1, riskManagement: 2.3, compliance: 2.3, incidentResponse: 4.1, awareness: 5.5, technology: 4.5 };
  private _security_timGetPendingDecisions() { return this._security_timDecisions.filter(d=>d.status==='pending'||d.status==='in-progress'); }
  private _security_timGetActivePolicies() { return this._security_timPolicyLifecycle.filter(p=>p.status==='active'); }
  private _security_timGetEscalationPath() { return ["L1 Analyst","L2 Senior","Security Lead","CISO","Board"]; }

  // === Security Innovation Lab (security_tim) ===
  private _security_timInnoProjects = [
    { id: "INN-001", name: "AI-Powered Threat Detection", description: "Machine learning models for real-time threat identification", status: "active", progress: 72, startDate: "2026-03-19", teamSize: 2, budget: 17159, milestones: 6, completedMilestones: 3 },
    { id: "INN-002", name: "Quantum-Resistant Cryptography", description: "Post-quantum encryption algorithm prototyping", status: "research", progress: 35, startDate: "2026-03-20", teamSize: 6, budget: 104631, milestones: 6, completedMilestones: 4 },
    { id: "INN-003", name: "Automated Red Teaming", description: "Autonomous penetration testing framework", status: "active", progress: 58, startDate: "2026-03-20", teamSize: 5, budget: 109069, milestones: 7, completedMilestones: 5 },
    { id: "INN-004", name: "Zero-Knowledge Authentication", description: "Privacy-preserving identity verification", status: "poc", progress: 88, startDate: "2026-01-22", teamSize: 6, budget: 17605, milestones: 8, completedMilestones: 3 },
    { id: "INN-005", name: "Blockchain Audit Trail", description: "Immutable security event logging", status: "active", progress: 45, startDate: "2026-03-10", teamSize: 6, budget: 21339, milestones: 9, completedMilestones: 4 },
    { id: "INN-006", name: "Behavioral Biometrics", description: "Continuous authentication via user behavior patterns", status: "research", progress: 22, startDate: "2026-02-07", teamSize: 5, budget: 115450, milestones: 6, completedMilestones: 9 },
    { id: "INN-007", name: "Deception Grid 2.0", description: "Advanced honeypot network with adaptive responses", status: "active", progress: 65, startDate: "2026-02-19", teamSize: 3, budget: 159411, milestones: 10, completedMilestones: 8 },
    { id: "INN-008", name: "Secure Enclave Integration", description: "Hardware-backed security for critical workloads", status: "poc", progress: 40, startDate: "2026-01-23", teamSize: 4, budget: 185677, milestones: 3, completedMilestones: 8 },
  ];
  private _security_timTechEvaluations = [
    { name: "Rust for Security Tools", status: "evaluating", score: 4.1, recommendation: "Adopt", vendor: "Open Source" },
    { name: "eBPF for Runtime Detection", status: "completed", score: 7.5, recommendation: "Adopt", vendor: "AWS" },
    { name: "Confidential Computing", status: "planned", score: 4.6, recommendation: "Investigate", vendor: "Azure" },
    { name: "Homomorphic Encryption", status: "evaluating", score: 3.1, recommendation: "Pilot", vendor: "GCP" },
    { name: "SASE Architecture", status: "completed", score: 10.6, recommendation: "Adopt", vendor: "Multiple" },
    { name: "SOAR Platform 3.0", status: "planned", score: 8.8, recommendation: "Monitor", vendor: "Splunk" },
  ];
  private _security_timCollaborationPartners = [
    { name: "MIT CSAIL", type: "Academic", projects: 1, status: "active" },
    { name: "Stanford Security Lab", type: "Academic", projects: 3, status: "active" },
    { name: "DARPA Cyber", type: "Government", projects: 5, status: "pending" },
    { name: "NIST", type: "Government", projects: 3, status: "active" },
    { name: "CISA", type: "Government", projects: 5, status: "active" },
    { name: "OWASP Foundation", type: "Non-profit", projects: 1, status: "active" },
    { name: "SANS Institute", type: "Training", projects: 2, status: "completed" },
    { name: "Cloud Security Alliance", type: "Industry", projects: 1, status: "active" },
  ];
  private _security_timInnoMetrics = { totalProjects: 8, activeProjects: 4, avgTimeToValue: "100 days", pocSuccessRate: round(random.uniform(55,85),1), researchToProduction: round(random.uniform(20,50),1), innovationIndex: round(random.uniform(6.0,9.5),1) };
  private _security_timGetProjectByStatus(status: string) { return this._security_timInnoProjects.filter(p=>p.status===status); }
  private _security_timGetTopEvaluations() { return [...this._security_timTechEvaluations].sort((a,b)=>b.score-a.score).slice(0,3); }



  // === Compliance Dashboard Extension (security_tim) ===
  private _security_timComplianceFrameworks = [
    { name: "SOC 2 Type II", description: "Trust Services Criteria", totalControls: 5, implementedControls: 5, status: "compliant", lastAudit: "2026-02-17", nextAudit: "2026-7-06", evidenceCount: 490 },
    { name: "ISO 27001", description: "Information Security Management", totalControls: 114, implementedControls: 103, status: "compliant", lastAudit: "2026-04-01", nextAudit: "2026-9-26", evidenceCount: 303 },
    { name: "PCI DSS 4.0", description: "Payment Card Industry", totalControls: 12, implementedControls: 6, status: "compliant", lastAudit: "2026-01-10", nextAudit: "2026-9-02", evidenceCount: 259 },
    { name: "HIPAA", description: "Health Insurance Portability", totalControls: 18, implementedControls: 17, status: "non-compliant", lastAudit: "2026-03-27", nextAudit: "2026-9-26", evidenceCount: 114 },
    { name: "GDPR", description: "Data Protection Regulation", totalControls: 99, implementedControls: 95, status: "compliant", lastAudit: "2026-02-21", nextAudit: "2026-10-26", evidenceCount: 269 },
    { name: "NIST CSF 2.0", description: "Cybersecurity Framework", totalControls: 6, implementedControls: 3, status: "non-compliant", lastAudit: "2026-01-06", nextAudit: "2026-8-28", evidenceCount: 311 },
    { name: "FedRAMP", description: "Federal Risk Authorization", totalControls: 15, implementedControls: 8, status: "partially-compliant", lastAudit: "2026-01-22", nextAudit: "2026-11-14", evidenceCount: 345 },
    { name: "SOX", description: "Sarbanes-Oxley Compliance", totalControls: 8, implementedControls: 5, status: "non-compliant", lastAudit: "2026-03-16", nextAudit: "2026-8-08", evidenceCount: 398 },
    { name: "CIS Controls v8", description: "Center for Internet Security", totalControls: 18, implementedControls: 9, status: "partially-compliant", lastAudit: "2026-04-21", nextAudit: "2026-8-11", evidenceCount: 466 },
    { name: "COBIT 2019", description: "IT Governance Framework", totalControls: 40, implementedControls: 39, status: "non-compliant", lastAudit: "2026-02-10", nextAudit: "2026-9-20", evidenceCount: 110 },
  ];
  private _security_timGetComplianceScore() {
    const fw = this._security_timComplianceFrameworks;
    return round(fw.reduce((s,f)=>s + (f.implementedControls/Math.max(f.totalControls,1))*100, 0) / fw.length, 1);
  }
  private _security_timGetGaps() {
    return this._security_timComplianceFrameworks.filter(f => f.status !== "compliant");
  }
  private _security_timAuditTrail = [
    { id: "AUD-0001", action: "Control tested", auditor: "Internal Audit", date: "2026-04-11", result: "pass", findings: 2 },
    { id: "AUD-0002", action: "Evidence collected", auditor: "External Auditor", date: "2026-04-04", result: "pass", findings: 5 },
    { id: "AUD-0003", action: "Gap identified", auditor: "Security Team", date: "2026-04-10", result: "fail", findings: 0 },
    { id: "AUD-0004", action: "Remediation completed", auditor: "Compliance Officer", date: "2026-04-12", result: "pass", findings: 5 },
    { id: "AUD-0005", action: "Policy updated", auditor: "IT Audit", date: "2026-04-17", result: "pass", findings: 4 },
    { id: "AUD-0006", action: "Training verified", auditor: "Risk Team", date: "2026-04-17", result: "pass", findings: 0 },
    { id: "AUD-0007", action: "Access reviewed", auditor: "QA Team", date: "2026-04-23", result: "pass", findings: 3 },
    { id: "AUD-0008", action: "Exception approved", auditor: "CISO Office", date: "2026-04-05", result: "conditional", findings: 1 },
    { id: "AUD-0009", action: "Risk accepted", auditor: "Board Audit", date: "2026-04-01", result: "pass", findings: 3 },
    { id: "AUD-0010", action: "Control enhanced", auditor: "Third Party", date: "2026-04-13", result: "pass", findings: 0 },
  ];

  // === Threat Intelligence Feed Extension (security_tim) ===
  private _security_timThreatActors = [
    { name: "APT-29", alias: "Cozy Bear", origin: "Russia", type: "Nation-State", severity: "high", lastActivity: "2026-04-04", targets: "Government", indicators: 272, ttps: 33 },
    { name: "APT-41", alias: "Double Dragon", origin: "China", type: "Nation-State", severity: "critical", lastActivity: "2026-04-05", targets: "Finance", indicators: 429, ttps: 22 },
    { name: "Lazarus Group", alias: "Hidden Cobra", origin: "North Korea", type: "Nation-State", severity: "critical", lastActivity: "2026-04-18", targets: "Energy", indicators: 495, ttps: 21 },
    { name: "FIN7", alias: "Carbanak", origin: "Eastern Europe", type: "Financial", severity: "high", lastActivity: "2026-04-11", targets: "Technology", indicators: 299, ttps: 8 },
    { name: "Conti", alias: "Wizard Spider", origin: "Russia", type: "Ransomware", severity: "critical", lastActivity: "2026-04-02", targets: "Government", indicators: 243, ttps: 42 },
    { name: "LockBit", alias: "LockBit Gang", origin: "Unknown", type: "Ransomware", severity: "high", lastActivity: "2026-04-02", targets: "Healthcare", indicators: 428, ttps: 42 },
    { name: "Cl0p", alias: "Cl0p Team", origin: "Unknown", type: "Ransomware", severity: "high", lastActivity: "2026-04-01", targets: "Finance", indicators: 169, ttps: 14 },
    { name: "Sandworm", alias: "Unit 74455", origin: "Russia", type: "Nation-State", severity: "critical", lastActivity: "2026-04-08", targets: "Government", indicators: 315, ttps: 26 },
  ];
  private _security_timIoCFeed = [
    { id: "ioc-000001", type: "ip", value: "208.123.90.153", confidence: 76, source: "CrowdStrike", firstSeen: "2026-04-17", lastSeen: "2026-04-12" },
    { id: "ioc-000002", type: "ip", value: "150.37.88.145", confidence: 62, source: "CrowdStrike", firstSeen: "2026-04-18", lastSeen: "2026-04-12" },
    { id: "ioc-000003", type: "ip", value: "12.181.130.101", confidence: 53, source: "STIX", firstSeen: "2026-04-20", lastSeen: "2026-04-11" },
    { id: "ioc-000004", type: "ip", value: "84.105.30.187", confidence: 85, source: "MISP", firstSeen: "2026-04-20", lastSeen: "2026-04-23" },
    { id: "ioc-000005", type: "ip", value: "26.215.150.74", confidence: 74, source: "CrowdStrike", firstSeen: "2026-04-20", lastSeen: "2026-04-14" },
    { id: "ioc-000006", type: "ip", value: "94.29.110.239", confidence: 79, source: "MISP", firstSeen: "2026-04-02", lastSeen: "2026-04-20" },
    { id: "ioc-000007", type: "ip", value: "170.46.204.114", confidence: 63, source: "AlienVault", firstSeen: "2026-04-23", lastSeen: "2026-04-18" },
    { id: "ioc-000008", type: "ip", value: "98.32.38.144", confidence: 56, source: "CrowdStrike", firstSeen: "2026-04-15", lastSeen: "2026-04-10" },
    { id: "ioc-000009", type: "ip", value: "58.82.42.182", confidence: 79, source: "MISP", firstSeen: "2026-04-05", lastSeen: "2026-04-11" },
    { id: "ioc-000010", type: "ip", value: "78.122.249.67", confidence: 86, source: "CrowdStrike", firstSeen: "2026-04-10", lastSeen: "2026-04-02" },
    { id: "ioc-000011", type: "ip", value: "6.2.116.118", confidence: 44, source: "VirusTotal", firstSeen: "2026-04-19", lastSeen: "2026-04-03" },
    { id: "ioc-000012", type: "ip", value: "46.136.250.39", confidence: 77, source: "STIX", firstSeen: "2026-04-17", lastSeen: "2026-04-15" },
    { id: "ioc-000013", type: "ip", value: "140.255.61.3", confidence: 53, source: "AlienVault", firstSeen: "2026-04-14", lastSeen: "2026-04-21" },
    { id: "ioc-000014", type: "ip", value: "131.186.48.249", confidence: 86, source: "STIX", firstSeen: "2026-04-16", lastSeen: "2026-04-19" },
    { id: "ioc-000015", type: "ip", value: "104.158.41.252", confidence: 56, source: "CrowdStrike", firstSeen: "2026-04-21", lastSeen: "2026-04-02" },
  ];
  private _security_timGetActiveThreats() { return this._security_timThreatActors.filter(a => a.severity === 'critical'); }
  private _security_timGetThreatSummary() {
    const actors = this._security_timThreatActors;
    return { total: actors.length, critical: actors.filter(a=>a.severity==="critical").length, high: actors.filter(a=>a.severity==="high").length, nationState: actors.filter(a=>a.type==="Nation-State").length, ransomware: actors.filter(a=>a.type==="Ransomware").length };
  }

  // === Incident Management Extension (security_tim) ===
  private _security_timIncidents = [
    { id: "INC-20260001", title: "Unauthorized access detected", severity: "critical", status: "open", assignedTo: "SOC L1", detectedAt: "2026-04-07T16:22", affectedAssets: 21, rootCause: "Misconfiguration" },
    { id: "INC-20260002", title: "Malware outbreak on workstation", severity: "high", status: "investigating", assignedTo: "SOC L2", detectedAt: "2026-04-02T08:52", affectedAssets: 26, rootCause: "Credential compromise" },
    { id: "INC-20260003", title: "Data leak from S3 bucket", severity: "medium", status: "contained", assignedTo: "IR Lead", detectedAt: "2026-04-23T03:39", affectedAssets: 15, rootCause: "Zero-day" },
    { id: "INC-20260004", title: "Phishing campaign targeting finance", severity: "low", status: "eradicated", assignedTo: "CISO", detectedAt: "2026-04-04T00:10", affectedAssets: 26, rootCause: "Human error" },
    { id: "INC-20260005", title: "DDoS attack on web services", severity: "critical", status: "recovered", assignedTo: "Security Eng", detectedAt: "2026-04-15T17:36", affectedAssets: 38, rootCause: "Policy violation" },
    { id: "INC-20260006", title: "Ransomware encryption attempt", severity: "high", status: "closed", assignedTo: "Forensics", detectedAt: "2026-04-04T12:23", affectedAssets: 18, rootCause: "Unknown" },
    { id: "INC-20260007", title: "Insider data exfiltration", severity: "medium", status: "open", assignedTo: "SOC L1", detectedAt: "2026-04-09T05:46", affectedAssets: 27, rootCause: "Misconfiguration" },
    { id: "INC-20260008", title: "API key exposure in repo", severity: "low", status: "investigating", assignedTo: "SOC L2", detectedAt: "2026-04-20T15:05", affectedAssets: 47, rootCause: "Credential compromise" },
    { id: "INC-20260009", title: "SQL injection on portal", severity: "critical", status: "contained", assignedTo: "IR Lead", detectedAt: "2026-04-16T23:05", affectedAssets: 37, rootCause: "Zero-day" },
    { id: "INC-20260010", title: "Brute force on VPN", severity: "high", status: "eradicated", assignedTo: "CISO", detectedAt: "2026-04-22T16:13", affectedAssets: 6, rootCause: "Human error" },
    { id: "INC-20260011", title: "Supply chain alert from vendor", severity: "medium", status: "recovered", assignedTo: "Security Eng", detectedAt: "2026-04-23T22:57", affectedAssets: 31, rootCause: "Policy violation" },
    { id: "INC-20260012", title: "Suspicious lateral movement", severity: "low", status: "closed", assignedTo: "Forensics", detectedAt: "2026-04-16T07:08", affectedAssets: 42, rootCause: "Unknown" },
  ];
  private _security_timGetIncidentStats() {
    const inc = this._security_timIncidents;
    return { total: inc.length, open: inc.filter(i=>i.status==="open").length, investigating: inc.filter(i=>i.status==="investigating").length, mttd: 23, mttr: 50 };
  }
  private _security_timGetSeverityDistribution() {
    const inc = this._security_timIncidents;
    return { critical: inc.filter(i=>i.severity==="critical").length, high: inc.filter(i=>i.severity==="high").length, medium: inc.filter(i=>i.severity==="medium").length, low: inc.filter(i=>i.severity==="low").length };
  }



  // --- Security Patch Prioritization Engine ---  private _patchPriorityPatches: Array<{id:string;cve:string;title:string;cvss:number;exploitability:number;assetCrit:number;riskScore:number;priority:string;status:string;env:string;scheduledDate:string;exceptionApproved:boolean;exceptionReason:string;complianceDeadline:string;deployedDate:string;rollbackPlan:string}> = [];
  private _patchPriorityCalendar: Array<{date:string;patchId:string;title:string;priority:string;status:string}> = [];
  private _patchPriorityCompliance: {criticalPatched:number;criticalTotal:number;highPatched:number;highTotal:number;mediumPatched:number;mediumTotal:number;slaTargetDays:number;avgPatchDays:number;compliancePct:number;exceptionCount:number;trendData:Array<{week:string;pct:number}>} = {criticalPatched:42,criticalTotal:50,highPatched:88,highTotal:120,mediumPatched:150,mediumTotal:200,slaTargetDays:7,avgPatchDays:4.2,compliancePct:87.3,exceptionCount:8,trendData:[]};
  private _patchPriorityExceptions: Array<{id:string;patchId:string;requestor:string;reason:string;risk:string;approvedBy:string;approvedDate:string;expiryDate:string;status:string}> = [];

  private _initPatchPriorityEngine() {
    const cves = [
      {id:'PP-001',cve:'CVE-2026-1001',title:'Apache Log4j Remote Code Execution',cvss:10.0,exploitability:9.8,assetCrit:10,priority:'P1-Critical',status:'Deployed',env:'Production',scheduledDate:'2026-04-20',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-17',deployedDate:'2026-04-18',rollbackPlan:'Revert to v2.17.1'},
      {id:'PP-002',cve:'CVE-2026-1002',title:'OpenSSL Buffer Overflow',cvss:9.8,exploitability:9.5,assetCrit:9,priority:'P1-Critical',status:'Deployed',env:'Production',scheduledDate:'2026-04-19',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-16',deployedDate:'2026-04-17',rollbackPlan:'Revert to OpenSSL 3.0.8'},
      {id:'PP-003',cve:'CVE-2026-1003',title:'Linux Kernel Privilege Escalation',cvss:9.1,exploitability:8.7,assetCrit:9,priority:'P1-Critical',status:'Scheduled',env:'Staging',scheduledDate:'2026-04-24',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-21',deployedDate:'',rollbackPlan:'Boot from previous kernel'},
      {id:'PP-004',cve:'CVE-2026-1004',title:'Nginx Path Traversal',cvss:8.6,exploitability:8.2,assetCrit:8,priority:'P2-High',status:'Testing',env:'QA',scheduledDate:'2026-04-25',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-23',deployedDate:'',rollbackPlan:'Downgrade to Nginx 1.24.0'},
      {id:'PP-005',cve:'CVE-2026-1005',title:'PostgreSQL Authentication Bypass',cvss:9.8,exploitability:9.0,assetCrit:9,priority:'P1-Critical',status:'Scheduled',env:'Production',scheduledDate:'2026-04-23',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-20',deployedDate:'',rollbackPlan:'Restore pg_hba.conf backup'},
      {id:'PP-006',cve:'CVE-2026-1006',title:'Redis Unauthorized Access',cvss:7.5,exploitability:9.0,assetCrit:7,priority:'P2-High',status:'Deployed',env:'Production',scheduledDate:'2026-04-18',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-22',deployedDate:'2026-04-19',rollbackPlan:'Restart with requirepass'},
      {id:'PP-007',cve:'CVE-2026-1007',title:'Kubernetes API Server Bypass',cvss:9.1,exploitability:8.5,assetCrit:9,priority:'P1-Critical',status:'Exception',env:'Production',scheduledDate:'',exceptionApproved:true,exceptionReason:'Breaking change requires 2-week migration',complianceDeadline:'2026-04-15',deployedDate:'',rollbackPlan:'Rollback k8s version'},
      {id:'PP-008',cve:'CVE-2026-1008',title:'JWT Token Forgery',cvss:8.2,exploitability:7.8,assetCrit:8,priority:'P2-High',status:'Deployed',env:'Production',scheduledDate:'2026-04-17',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-19',deployedDate:'2026-04-16',rollbackPlan:'Revert auth library to v3.2'},
      {id:'PP-009',cve:'CVE-2026-1009',title:'Docker Container Escape',cvss:9.9,exploitability:9.2,assetCrit:9,priority:'P1-Critical',status:'Testing',env:'QA',scheduledDate:'2026-04-26',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-24',deployedDate:'',rollbackPlan:'Pin Docker to v24.0.7'},
      {id:'PP-010',cve:'CVE-2026-1010',title:'Elasticsearch RCE',cvss:9.8,exploitability:9.1,assetCrit:8,priority:'P1-Critical',status:'Scheduled',env:'Production',scheduledDate:'2026-04-22',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-18',deployedDate:'',rollbackPlan:'Restore ES snapshot'},
      {id:'PP-011',cve:'CVE-2026-1011',title:'Spring Framework Injection',cvss:9.8,exploitability:9.3,assetCrit:9,priority:'P1-Critical',status:'Deployed',env:'Production',scheduledDate:'2026-04-15',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-14',deployedDate:'2026-04-14',rollbackPlan:'Revert Spring to 5.3.30'},
      {id:'PP-012',cve:'CVE-2026-1012',title:'MongoDB Privilege Escalation',cvss:8.4,exploitability:7.5,assetCrit:7,priority:'P2-High',status:'Scheduled',env:'Staging',scheduledDate:'2026-04-27',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-25',deployedDate:'',rollbackPlan:'Restore MongoDB 6.0 backup'},
      {id:'PP-013',cve:'CVE-2026-1013',title:'Grafana Auth Bypass',cvss:9.1,exploitability:8.8,assetCrit:7,priority:'P2-High',status:'Deployed',env:'Production',scheduledDate:'2026-04-16',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-17',deployedDate:'2026-04-15',rollbackPlan:'Downgrade Grafana to 10.2.3'},
      {id:'PP-014',cve:'CVE-2026-1014',title:'HAProxy Buffer Overflow',cvss:7.8,exploitability:7.2,assetCrit:8,priority:'P2-High',status:'Testing',env:'QA',scheduledDate:'2026-04-28',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-26',deployedDate:'',rollbackPlan:'Rollback HAProxy to 2.8.4'},
      {id:'PP-015',cve:'CVE-2026-1015',title:'SSH Key Authentication Flaw',cvss:7.2,exploitability:6.8,assetCrit:9,priority:'P2-High',status:'Exception',env:'Production',scheduledDate:'',exceptionApproved:true,exceptionReason:'Legacy system requires older SSH client',complianceDeadline:'2026-04-20',deployedDate:'',rollbackPlan:'Replace SSH keys from backup'},
      {id:'PP-016',cve:'CVE-2026-1016',title:'Windows SMB Remote Code Execution',cvss:9.8,exploitability:9.0,assetCrit:8,priority:'P1-Critical',status:'Deployed',env:'Production',scheduledDate:'2026-04-14',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-13',deployedDate:'2026-04-12',rollbackPlan:'Revert Windows update'},
      {id:'PP-017',cve:'CVE-2026-1017',title:'Python Pickle Deserialization',cvss:8.1,exploitability:7.5,assetCrit:6,priority:'P3-Medium',status:'Scheduled',env:'Staging',scheduledDate:'2026-04-29',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-05-01',deployedDate:'',rollbackPlan:'Pin Python to 3.11.7'},
      {id:'PP-018',cve:'CVE-2026-1018',title:'Node.js ReDoS',cvss:7.5,exploitability:8.0,assetCrit:7,priority:'P2-High',status:'Deployed',env:'Production',scheduledDate:'2026-04-19',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-21',deployedDate:'2026-04-20',rollbackPlan:'Downgrade Node to 20.11.0'},
      {id:'PP-019',cve:'CVE-2026-1019',title:'Java Deserialization Attack',cvss:10.0,exploitability:9.5,assetCrit:9,priority:'P1-Critical',status:'Deployed',env:'Production',scheduledDate:'2026-04-13',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-12',deployedDate:'2026-04-11',rollbackPlan:'Revert to Java 17.0.9'},
      {id:'PP-020',cve:'CVE-2026-1020',title:'Git LFS Command Injection',cvss:8.8,exploitability:8.5,assetCrit:5,priority:'P3-Medium',status:'Scheduled',env:'Development',scheduledDate:'2026-04-30',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-05-03',deployedDate:'',rollbackPlan:'Disable Git LFS'},
    ];
    cves.forEach(c => { c.riskScore = +(c.cvss * 0.4 + c.exploitability * 0.35 + c.assetCrit * 0.25).toFixed(1); });
    this._patchPriorityPatches = cves;
    this._patchPriorityExceptions = [
      {id:'EX-001',patchId:'PP-007',requestor:'dev-lead-01',reason:'Breaking API changes require service migration',risk:'High - 30-day exposure window',approvedBy:'csa-01',approvedDate:'2026-04-10',expiryDate:'2026-04-30',status:'Active'},
      {id:'EX-002',patchId:'PP-015',requestor:'infra-lead-01',reason:'Legacy systems require older SSH protocol',risk:'Medium - Internal network only',approvedBy:'csa-01',approvedDate:'2026-04-12',expiryDate:'2026-05-12',status:'Active'},
    ];
    const weeks = ['W14','W15','W16','W17','W18'];
    this._patchPriorityCompliance.trendData = weeks.map((w,i) => ({week:w, pct: +(82 + i * 1.3).toFixed(1)}));
    this._patchPriorityCalendar = cves.filter(c=>c.scheduledDate).map(c=>({date:c.scheduledDate,patchId:c.id,title:c.title,priority:c.priority,status:c.status}));
  }

  // --- Security Threat Modeling Canvas ---
  private _strideComponents: Array<{id:string;name:string;type:string;threats:Array<{id:string;type:string;description:string;severity:string;likelihood:string;mitigation:string;mitStatus:string;owner:string}>}> = [];
  private _strideReviewHistory: Array<{id:string;date:string;reviewer:string;component:string;findings:number;approved:boolean;notes:string}> = [];
  private _strideSuggestions: Array<{id:string;component:string;threatType:string;description:string;confidence:number;source:string}> = [];

  private _initStrideCanvas() {
    const components = [
      {id:'SC-001',name:'API Gateway',type:'External Interface',threats:[
        {id:'ST-001',type:'Spoofing',description:'Attacker forges API keys to impersonate legitimate clients',severity:'High',likelihood:'Medium',mitigation:'Implement mTLS with certificate pinning and API key rotation',mitStatus:'Implemented',owner:'sec-team-01'},
        {id:'ST-002',type:'Tampering',description:'Request body manipulation to alter transaction amounts',severity:'Critical',likelihood:'High',mitigation:'HMAC request signing with server-side validation',mitStatus:'Implemented',owner:'sec-team-01'},
        {id:'ST-003',type:'Repudiation',description:'User denies making a transaction, no audit trail',severity:'Medium',likelihood:'Low',mitigation:'Immutable audit log with cryptographic chain',mitStatus:'Partial',owner:'sec-team-02'},
        {id:'ST-004',type:'Info Disclosure',description:'API response leaks internal service IDs and topology',severity:'High',likelihood:'Medium',mitigation:'Response sanitization and field-level encryption',mitStatus:'Implemented',owner:'sec-team-01'},
        {id:'ST-005',type:'Denial of Service',description:'Rate limiting bypass through header manipulation',severity:'High',likelihood:'High',mitigation:'Adaptive rate limiting with IP reputation scoring',mitStatus:'In Progress',owner:'infra-team-01'},
        {id:'ST-006',type:'Elevation',description:'JWT role escalation through claim manipulation',severity:'Critical',likelihood:'Medium',mitigation:'Token validation with server-side session verification',mitStatus:'Implemented',owner:'sec-team-01'},
      ]},
      {id:'SC-002',name:'Authentication Service',type:'Internal Service',threats:[
        {id:'ST-007',type:'Spoofing',description:'Credential stuffing with leaked password databases',severity:'Critical',likelihood:'High',mitigation:'Multi-factor authentication and CAPTCHA',mitStatus:'Implemented',owner:'iam-team-01'},
        {id:'ST-008',type:'Tampering',description:'OAuth token modification during callback',severity:'High',likelihood:'Low',mitigation:'PKCE flow with state parameter validation',mitStatus:'Implemented',owner:'iam-team-01'},
        {id:'ST-009',type:'Elevation',description:'Password reset token prediction attack',severity:'High',likelihood:'Medium',mitigation:'Cryptographically random tokens with expiry',mitStatus:'Implemented',owner:'iam-team-01'},
      ]},
      {id:'SC-003',name:'Payment Processing',type:'Internal Service',threats:[
        {id:'ST-010',type:'Tampering',description:'Payment amount modification in transit',severity:'Critical',likelihood:'Low',mitigation:'End-to-end encryption with payment processor signing',mitStatus:'Implemented',owner:'payments-team'},
        {id:'ST-011',type:'Info Disclosure',description:'Full PAN stored in application database',severity:'Critical',likelihood:'Medium',mitigation:'Tokenization with PCI-DSS compliant vault',mitStatus:'In Progress',owner:'payments-team'},
        {id:'ST-012',type:'Denial of Service',description:'Payment queue flooding to exhaust resources',severity:'High',likelihood:'Medium',mitigation:'Queue depth limits and circuit breaker pattern',mitStatus:'Implemented',owner:'payments-team'},
      ]},
      {id:'SC-004',name:'Database Layer',type:'Data Store',threats:[
        {id:'ST-013',type:'Tampering',description:'SQL injection through unsanitized query parameters',severity:'Critical',likelihood:'Medium',mitigation:'Parameterized queries with ORM layer',mitStatus:'Implemented',owner:'db-team-01'},
        {id:'ST-014',type:'Info Disclosure',description:'Unencrypted PII in database at rest',severity:'Critical',likelihood:'Medium',mitigation:'Transparent data encryption (TDE) with AES-256',mitStatus:'Implemented',owner:'db-team-01'},
        {id:'ST-015',type:'Denial of Service',description:'Query bomb through complex nested queries',severity:'High',likelihood:'Medium',mitigation:'Query timeout limits and resource governance',mitStatus:'Implemented',owner:'db-team-01'},
      ]},
      {id:'SC-005',name:'CDN / Static Assets',type:'External Interface',threats:[
        {id:'ST-016',type:'Tampering',description:'Supply chain attack through compromised npm packages',severity:'Critical',likelihood:'Medium',mitigation:'Lockfile integrity with SRI hashes on all scripts',mitStatus:'Partial',owner:'sec-team-01'},
        {id:'ST-017',type:'Info Disclosure',description:'Source maps exposed in production bundle',severity:'Medium',likelihood:'High',mitigation:'Build pipeline strips source maps for production',mitStatus:'Implemented',owner:'devops-team'},
      ]},
      {id:'SC-006',name:'Message Queue',type:'Internal Infrastructure',threats:[
        {id:'ST-018',type:'Tampering',description:'Message payload modification in transit',severity:'High',likelihood:'Low',mitigation:'TLS encryption with message-level signing',mitStatus:'Implemented',owner:'infra-team-01'},
        {id:'ST-019',type:'Denial of Service',description:'Dead letter queue exhaustion through poison messages',severity:'Medium',likelihood:'Medium',mitigation:'DLQ size limits with alerting and auto-purge',mitStatus:'Implemented',owner:'infra-team-01'},
        {id:'ST-020',type:'Repudiation',description:'No traceability of message processing order',severity:'Medium',likelihood:'Low',mitigation:'Sequence IDs with idempotency keys',mitStatus:'Partial',owner:'infra-team-01'},
      ]},
      {id:'SC-007',name:'Admin Dashboard',type:'Web Application',threats:[
        {id:'ST-021',type:'Spoofing',description:'Session hijacking through XSS on admin panel',severity:'Critical',likelihood:'Medium',mitigation:'Content Security Policy with HttpOnly cookies',mitStatus:'Implemented',owner:'sec-team-01'},
        {id:'ST-022',type:'Elevation',description:'Privilege escalation through IDOR on admin API',severity:'High',likelihood:'High',mitigation:'RBAC with resource-level access checks',mitStatus:'In Progress',owner:'iam-team-01'},
        {id:'ST-023',type:'Info Disclosure',description:'Admin panel accessible without authentication',severity:'Critical',likelihood:'Low',mitigation:'Network segmentation and IP allowlisting',mitStatus:'Implemented',owner:'infra-team-01'},
      ]},
      {id:'SC-008',name:'Third-Party Integrations',type:'External Interface',threats:[
        {id:'ST-024',type:'Spoofing',description:'Webhook signature forgery from integration partner',severity:'High',likelihood:'Medium',mitigation:'HMAC signature validation with secret rotation',mitStatus:'Implemented',owner:'sec-team-01'},
        {id:'ST-025',type:'Info Disclosure',description:'Partner API returns more data than authorized',severity:'High',likelihood:'Low',mitigation:'Response field allowlisting and DLP inspection',mitStatus:'Partial',owner:'sec-team-02'},
        {id:'ST-026',type:'Denial of Service',description:'Partner service outage cascades to our platform',severity:'Medium',likelihood:'Medium',mitigation:'Circuit breaker with graceful degradation',mitStatus:'Implemented',owner:'infra-team-01'},
      ]},
    ];
    this._strideComponents = components;
    this._strideReviewHistory = [
      {id:'SR-001',date:'2026-04-15',reviewer:'sec-arch-01',component:'API Gateway',findings:2,approved:true,notes:'Two new threats identified from penetration test results'},
      {id:'SR-002',date:'2026-04-10',reviewer:'sec-arch-02',component:'Payment Processing',findings:1,approved:false,notes:'Tokenization gap requires remediation before Q2 close'},
      {id:'SR-003',date:'2026-04-05',reviewer:'sec-arch-01',component:'Authentication Service',findings:0,approved:true,notes:'No changes, model remains accurate'},
      {id:'SR-004',date:'2026-03-28',reviewer:'sec-arch-03',component:'Admin Dashboard',findings:3,approved:false,notes:'IDOR vulnerabilities require immediate patching'},
    ];
    this._strideSuggestions = [
      {id:'SS-001',component:'API Gateway',threatType:'Info Disclosure',description:'GraphQL introspection query enabled in production',confidence:0.92,source:'Automated Scanner'},
      {id:'SS-002',component:'Message Queue',threatType:'Tampering',description:'Unencrypted inter-service communication detected',confidence:0.87,source:'Network Analysis'},
      {id:'SS-003',component:'Third-Party Integrations',threatType:'Spoofing',description:'Outdated webhook signing algorithm (HMAC-SHA1)',confidence:0.95,source:'Config Audit'},
    ];
  }

  // --- Security Data Classification Engine ---
  private _dataClassLevels: Array<{level:number;name:string;description:string;color:string;icon:string;handlingPolicy:string;encryption:string;retention:string;accessControl:string;examples:Array<string>}> = [];
  private _dataClassRules: Array<{id:string;name:string;pattern:string;category:string;level:number;enabled:boolean;matchCount:number;lastMatch:string;accuracy:number;falsePositiveRate:number}> = [];
  private _dataClassResults: Array<{id:string;source:string;field:string;classifiedLevel:number;confidence:number;ruleId:string;timestamp:string;reviewed:boolean;correctedLevel:number}> = [];
  private _dataClassMetrics: {totalScanned:number;classifiedCount:number;autoClassifiedPct:number;accuracy:number;misclassificationCount:number;avgConfidence:number;levelsBreakdown:Array<{level:number;count:number;pct:number}>} = {totalScanned:245000,classifiedCount:198000,autoClassifiedPct:92.4,accuracy:96.8,misclassificationCount:342,avgConfidence:94.2,levelsBreakdown:[]};

  private _initDataClassEngine() {
    this._dataClassLevels = [
      {level:1,name:'Public',description:'Information approved for public disclosure with no restrictions',color:'#22c55e',icon:'globe',handlingPolicy:'No restrictions. May be shared externally without approval.',encryption:'Optional',retention:'Per business need',accessControl:'Open access',examples:['Marketing materials','Press releases','Public documentation','Open source code']},
      {level:2,name:'Internal',description:'Business information not intended for public release but low sensitivity',color:'#3b82f6',icon:'building',handlingPolicy:'Share within organization only. External sharing requires manager approval.',encryption:'In transit required',retention:'3 years default',accessControl:'Role-based within org',examples:['Internal memos','Org charts','Project status reports','Meeting notes']},
      {level:3,name:'Confidential',description:'Sensitive business information that could cause moderate harm if disclosed',color:'#f59e0b',icon:'lock',handlingPolicy:'Need-to-know basis only. External sharing requires director approval and NDA.',encryption:'At rest and in transit required',retention:'5 years default',accessControl:'Explicit authorization required',examples:['Financial reports','Customer lists','Strategic plans','Salary data']},
      {level:4,name:'Restricted',description:'Highly sensitive data that could cause severe harm to organization or individuals',color:'#ef4444',icon:'shield',handlingPolicy:'Strict need-to-know. External sharing prohibited except with CISO and legal approval.',encryption:'AES-256 at rest and in transit',retention:'Per regulatory requirement',accessControl:'Named individual access only',examples:['PII (SSN, passport)','Medical records','Authentication credentials','Encryption keys']},
      {level:5,name:'Top Secret',description:'Crown jewels - most critical assets whose compromise would be catastrophic',color:'#7c3aed',icon:'crown',handlingPolicy:'Compartmentalized access. Zero external sharing. Multi-person authorization for any access.',encryption:'HSM-backed AES-256-GCM',retention:'Minimum necessary, auto-purge',accessControl:'MFA + biometric + named access list',examples:['Root CA private keys','Master encryption keys','Crown jewel source code','M&A documents']},
    ];
    this._dataClassRules = [
      {id:'DCR-001',name:'Email Address Detection',pattern:'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',category:'PII',level:4,enabled:true,matchCount:45230,lastMatch:'2026-04-23T14:30:00Z',accuracy:98.2,falsePositiveRate:0.3},
      {id:'DCR-002',name:'SSN Pattern Match',pattern:'\b\d{3}-\d{2}-\d{4}\b',category:'PII',level:4,enabled:true,matchCount:892,lastMatch:'2026-04-22T09:15:00Z',accuracy:94.5,falsePositiveRate:2.1},
      {id:'DCR-003',name:'Credit Card Number (Luhn)',pattern:'\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14}|3[47]\d{13}|6(?:011|5\d{2})\d{12})\b',category:'Financial',level:4,enabled:true,matchCount:1234,lastMatch:'2026-04-23T11:20:00Z',accuracy:99.1,falsePositiveRate:0.1},
      {id:'DCR-004',name:'API Key Detection',pattern:'(?:sk|pk|ak|api)[_-][a-zA-Z0-9]{20,}',category:'Credential',level:5,enabled:true,matchCount:567,lastMatch:'2026-04-23T13:45:00Z',accuracy:97.8,falsePositiveRate:0.5},
      {id:'DCR-005',name:'Private Key Detection',pattern:'-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----',category:'Credential',level:5,enabled:true,matchCount:12,lastMatch:'2026-04-20T16:00:00Z',accuracy:100.0,falsePositiveRate:0.0},
      {id:'DCR-006',name:'IP Address Detection',pattern:'\b(?:\d{1,3}\.){3}\d{1,3}\b',category:'Infrastructure',level:2,enabled:true,matchCount:89000,lastMatch:'2026-04-23T14:55:00Z',accuracy:92.1,falsePositiveRate:5.2},
      {id:'DCR-007',name:'Database Connection String',pattern:'(?:mysql|postgres|mongodb|redis)://[\w:]+@[\w.-]+:\d+',category:'Credential',level:5,enabled:true,matchCount:45,lastMatch:'2026-04-21T10:30:00Z',accuracy:99.5,falsePositiveRate:0.1},
      {id:'DCR-008',name:'JWT Token Detection',pattern:'eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+',category:'Credential',level:4,enabled:true,matchCount:2345,lastMatch:'2026-04-23T14:20:00Z',accuracy:96.7,falsePositiveRate:1.2},
      {id:'DCR-009',name:'Phone Number Detection',pattern:'\b\+?1?\(?:\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',category:'PII',level:3,enabled:true,matchCount:34567,lastMatch:'2026-04-23T12:00:00Z',accuracy:93.4,falsePositiveRate:3.8},
      {id:'DCR-010',name:'Date of Birth Pattern',pattern:'\b(?:0[1-9]|1[0-2])/(?:0[1-9]|[12]\d|3[01])/(?:19|20)\d{2}\b',category:'PII',level:3,enabled:true,matchCount:12340,lastMatch:'2026-04-23T09:00:00Z',accuracy:88.9,falsePositiveRate:6.5},
      {id:'DCR-011',name:'AWS Account ID',pattern:'\b\d{12}\b',category:'Cloud Infrastructure',level:3,enabled:true,matchCount:6789,lastMatch:'2026-04-23T10:00:00Z',accuracy:85.2,falsePositiveRate:8.1},
      {id:'DCR-012',name:'Kubernetes Secret Reference',pattern:'(?:Secret|secret)[s]?:\s*[\w-]+',category:'Infrastructure',level:4,enabled:true,matchCount:890,lastMatch:'2026-04-22T15:30:00Z',accuracy:91.3,falsePositiveRate:4.2},
      {id:'DCR-013',name:'Internal Domain Pattern',pattern:'(?:\.corp|\.internal|\.local|\.staging)\b',category:'Infrastructure',level:2,enabled:true,matchCount:23456,lastMatch:'2026-04-23T14:00:00Z',accuracy:95.6,falsePositiveRate:1.8},
      {id:'DCR-014',name:'Salary Compensation Keywords',pattern:'(?:salary|compensation|base pay|annual income)\s*[:\$]?\s*[\d,]+',category:'Financial',level:3,enabled:true,matchCount:567,lastMatch:'2026-04-21T14:00:00Z',accuracy:89.7,falsePositiveRate:5.5},
      {id:'DCR-015',name:'Medical Record Keywords',pattern:'(?:diagnosis|prescription|medical record|patient ID)\s*[:#]?\s*[\w-]+',category:'Health',level:4,enabled:true,matchCount:345,lastMatch:'2026-04-22T11:00:00Z',accuracy:90.1,falsePositiveRate:4.8},
    ];
    this._dataClassMetrics.levelsBreakdown = [
      {level:1,count:120000,pct:48.8},{level:2,count:58000,pct:23.7},
      {level:3,count:42000,pct:17.1},{level:4,count:22000,pct:9.0},{level:5,count:3000,pct:1.4},
    ];
    this._dataClassResults = [
      {id:'DCX-001',source:'user_profiles_db',field:'email_address',classifiedLevel:4,confidence:98.2,ruleId:'DCR-001',timestamp:'2026-04-23T14:30:00Z',reviewed:true,correctedLevel:0},
      {id:'DCX-002',source:'payment_logs',field:'card_number',classifiedLevel:4,confidence:99.1,ruleId:'DCR-003',timestamp:'2026-04-23T11:20:00Z',reviewed:true,correctedLevel:0},
      {id:'DCX-003',source:'config_repo',field:'database_url',classifiedLevel:5,confidence:99.5,ruleId:'DCR-007',timestamp:'2026-04-21T10:30:00Z',reviewed:true,correctedLevel:0},
      {id:'DCX-004',source:'app_logs',field:'user_agent',classifiedLevel:2,confidence:72.3,ruleId:'DCR-006',timestamp:'2026-04-23T14:55:00Z',reviewed:false,correctedLevel:0},
      {id:'DCX-005',source:'hr_database',field:'salary_amount',classifiedLevel:3,confidence:89.7,ruleId:'DCR-014',timestamp:'2026-04-21T14:00:00Z',reviewed:true,correctedLevel:0},
    ];
  }

  // --- Security Service Mesh Monitor ---
  private _meshServices: Array<{id:string;name:string;namespace:string;mTlsEnabled:boolean;authPolicy:string;apiCalls24h:number;errorRate:number;latencyP99:number;dependencies:Array<string>;policyViolations:number;lastScan:string;securityScore:number}> = [];
  private _meshAuthRules: Array<{id:string;source:string;destination:string;methods:Array<string>;allowed:boolean;createdAt:string;lastUpdated:string}> = [];
  private _meshAlerts: Array<{id:string;severity:string;service:string;type:string;description:string;timestamp:string;acknowledged:boolean;action:string}> = [];

  private _initMeshMonitor() {
    this._meshServices = [
      {id:'MS-001',name:'api-gateway',namespace:'edge',mTlsEnabled:true,authPolicy:'strict',apiCalls24h:2450000,errorRate:0.02,latencyP99:45,dependencies:['auth-svc','user-svc','order-svc'],policyViolations:0,lastScan:'2026-04-23T14:00:00Z',securityScore:98},
      {id:'MS-002',name:'auth-svc',namespace:'identity',mTlsEnabled:true,authPolicy:'strict',apiCalls24h:890000,errorRate:0.05,latencyP99:22,dependencies:['user-db','session-cache'],policyViolations:0,lastScan:'2026-04-23T14:00:00Z',securityScore:97},
      {id:'MS-003',name:'user-svc',namespace:'core',mTlsEnabled:true,authPolicy:'strict',apiCalls24h:1200000,errorRate:0.01,latencyP99:35,dependencies:['user-db','event-bus'],policyViolations:0,lastScan:'2026-04-23T14:00:00Z',securityScore:96},
      {id:'MS-004',name:'payment-svc',namespace:'billing',mTlsEnabled:true,authPolicy:'strict',apiCalls24h:340000,errorRate:0.08,latencyP99:120,dependencies:['payment-gateway','order-db','audit-svc'],policyViolations:2,lastScan:'2026-04-23T13:55:00Z',securityScore:89},
      {id:'MS-005',name:'order-svc',namespace:'core',mTlsEnabled:true,authPolicy:'permissive',apiCalls24h:780000,errorRate:0.03,latencyP99:55,dependencies:['order-db','inventory-svc','payment-svc'],policyViolations:1,lastScan:'2026-04-23T14:00:00Z',securityScore:91},
      {id:'MS-006',name:'inventory-svc',namespace:'supply-chain',mTlsEnabled:false,authPolicy:'none',apiCalls24h:450000,errorRate:0.15,latencyP99:88,dependencies:['inventory-db'],policyViolations:5,lastScan:'2026-04-23T13:50:00Z',securityScore:72},
      {id:'MS-007',name:'notification-svc',namespace:'messaging',mTlsEnabled:true,authPolicy:'permissive',apiCalls24h:670000,errorRate:0.04,latencyP99:30,dependencies:['email-provider','push-provider','user-svc'],policyViolations:1,lastScan:'2026-04-23T14:00:00Z',securityScore:88},
      {id:'MS-008',name:'analytics-svc',namespace:'data',mTlsEnabled:true,authPolicy:'strict',apiCalls24h:230000,errorRate:0.06,latencyP99:200,dependencies:['clickhouse','event-bus'],policyViolations:0,lastScan:'2026-04-23T14:00:00Z',securityScore:95},
      {id:'MS-009',name:'search-svc',namespace:'discovery',mTlsEnabled:true,authPolicy:'strict',apiCalls24h:1500000,errorRate:0.01,latencyP99:65,dependencies:['elasticsearch','user-svc'],policyViolations:0,lastScan:'2026-04-23T14:00:00Z',securityScore:99},
      {id:'MS-010',name:'legacy-adapter',namespace:'integration',mTlsEnabled:false,authPolicy:'none',apiCalls24h:89000,errorRate:0.22,latencyP99:350,dependencies:['legacy-api'],policyViolations:8,lastScan:'2026-04-23T13:45:00Z',securityScore:45},
    ];
    this._meshAuthRules = [
      {id:'AR-001',source:'api-gateway',destination:'auth-svc',methods:['POST'],allowed:true,createdAt:'2026-01-15',lastUpdated:'2026-04-10'},
      {id:'AR-002',source:'api-gateway',destination:'user-svc',methods:['GET','PUT'],allowed:true,createdAt:'2026-01-15',lastUpdated:'2026-04-10'},
      {id:'AR-003',source:'api-gateway',destination:'payment-svc',methods:['POST'],allowed:true,createdAt:'2026-02-01',lastUpdated:'2026-04-15'},
      {id:'AR-004',source:'order-svc',destination:'inventory-svc',methods:['GET','POST'],allowed:true,createdAt:'2026-02-15',lastUpdated:'2026-03-20'},
      {id:'AR-005',source:'analytics-svc',destination:'user-svc',methods:['GET'],allowed:false,createdAt:'2026-03-01',lastUpdated:'2026-04-20'},
      {id:'AR-006',source:'notification-svc',destination:'user-svc',methods:['GET'],allowed:true,createdAt:'2026-03-10',lastUpdated:'2026-04-05'},
    ];
    this._meshAlerts = [
      {id:'MA-001',severity:'Critical',service:'inventory-svc',type:'mTLS_DISABLED',description:'Service has mTLS disabled, allowing plaintext traffic',timestamp:'2026-04-23T13:50:00Z',acknowledged:true,action:'Enable mTLS and enforce strict policy'},
      {id:'MA-002',severity:'Critical',service:'legacy-adapter',type:'AUTH_NONE',description:'No authentication policy configured for external-facing service',timestamp:'2026-04-23T13:45:00Z',acknowledged:false,action:'Implement JWT validation middleware'},
      {id:'MA-003',severity:'High',service:'order-svc',type:'POLICY_PERMISSIVE',description:'Permissive auth policy allows any authenticated caller',timestamp:'2026-04-23T12:00:00Z',acknowledged:true,action:'Migrate to strict RBAC policy'},
      {id:'MA-004',severity:'Medium',service:'payment-svc',type:'HIGH_ERROR_RATE',description:'Error rate 0.08% exceeds 0.05% threshold',timestamp:'2026-04-23T11:30:00Z',acknowledged:false,action:'Investigate payment gateway timeouts'},
      {id:'MA-005',severity:'Low',service:'notification-svc',type:'LATENCY_SPIKE',description:'P99 latency increased from 25ms to 30ms',timestamp:'2026-04-23T10:00:00Z',acknowledged:true,action:'Monitor and scale if trend continues'},
    ];
  }

  // --- Security Runbook Library ---
  private _runbooks: Array<{id:string;title:string;category:string;severity:string;steps:Array<{order:number;action:string;command:string;expected:string;timeout:number}>;lastExecuted:string;successRate:number;execCount:number;version:number;contributors:Array<string>;tags:Array<string>;estimatedTime:number;reviewCycle:string}> = [];
  private _runbookHistory: Array<{id:string;runbookId:string;executedBy:string;executedAt:string;duration:number;status:string;notes:string;stepsCompleted:number;stepsTotal:number}> = [];
  private _runbookLeaderboard: Array<{name:string;contributions:number;lastActive:string;expertise:Array<string>;avgRating:number}> = [];

  private _initRunbookLibrary() {
    this._runbooks = [
      {id:'RB-001',title:'Ransomware Incident Response',category:'Incident Response',severity:'Critical',steps:[
        {order:1,action:'Isolate affected systems from network',command:'ifconfig eth0 down; iptables -A INPUT -j DROP',expected:'Network interfaces disabled',timeout:5},
        {order:2,action:'Capture volatile memory dump',command:'limem output=/forensics/memdump.lime',expected:'Memory dump created successfully',timeout:30},
        {order:3,action:'Identify ransomware variant via file markers',command:'python3 /tools/ransomware_id.py /infected/',expected:'Variant identified with confidence score',timeout:15},
        {order:4,action:'Check for encryption key in memory strings',command:'strings /forensics/memdump.lime | grep -iE "(key|decrypt|aes|rsa)" | head -50',expected:'Potential key material extracted',timeout:60},
        {order:5,action:'Preserve disk images for forensics',command:'dd if=/dev/sda of=/forensics/disk.img bs=4M status=progress',expected:'Disk image created with hash verification',timeout:600},
        {order:6,action:'Notify incident response team via secure channel',command:'ir-cli notify --severity critical --team "ir-core"',expected:'Team notified with case number',timeout:10},
        {order:7,action:'Begin evidence chain of custody documentation',command:'cofctl init --case "Ransomware-$(date +%Y%m%d)"',expected:'Case file created with timestamps',timeout:5},
      ],lastExecuted:'2026-04-20T08:30:00Z',successRate:94.2,execCount:17,version:3,contributors:['ir-lead-01','forensics-01','soc-analyst-02'],tags:['ransomware','incident','forensics','emergency'],estimatedTime:45,reviewCycle:'Monthly'},
      {id:'RB-002',title:'Phishing Campaign Mitigation',category:'Incident Response',severity:'High',steps:[
        {order:1,action:'Extract phishing URL from reported email',command:'phish-extract --input /tmp/reported.eml --output /tmp/phish_data.json',expected:'URL and headers extracted',timeout:5},
        {order:2,action:'Block phishing URL at perimeter firewall',command:'fw-cli block --url "$(jq -r .url /tmp/phish_data.json)" --reason "Active phishing campaign"',expected:'URL blocked globally',timeout:10},
        {order:3,action:'Query email logs for all recipients of phishing email',command:'email-search --subject "$(jq -r .subject /tmp/phish_data.json)" --since "24h"',expected:'List of all recipients identified',timeout:30},
        {order:4,action:'Force password reset for users who clicked the link',command:'ad-cli reset-password --users-file /tmp/clicked_users.txt --notify',expected:'Password resets initiated',timeout:60},
        {order:5,action:'Submit phishing URL to threat intelligence feeds',command:'ti-submit --url "$(jq -r .url /tmp/phish_data.json)" --tags "phishing,credential-harvest"',expected:'URL shared with TI community',timeout:15},
      ],lastExecuted:'2026-04-22T14:15:00Z',successRate:97.8,execCount:34,version:5,contributors:['soc-analyst-01','soc-analyst-03','email-admin'],tags:['phishing','email','credential-theft'],estimatedTime:20,reviewCycle:'Bi-weekly'},
      {id:'RB-003',title:'DDoS Attack Mitigation',category:'Incident Response',severity:'Critical',steps:[
        {order:1,action:'Verify DDoS attack pattern from traffic analysis',command:'traffic-analyze --window 5m --threshold 3x',expected:'Attack pattern confirmed with vector type',timeout:15},
        {order:2,action:'Activate rate limiting at edge',command:'edge-cli ratelimit --global --rps 1000 --burst 5000',expected:'Rate limiting active at all edge PoPs',timeout:5},
        {order:3,action:'Enable CDN caching for all static assets',command:'cdn-cli cache-enable --path "/*" --ttl 3600',expected:'Cache hit ratio increases above 90%',timeout:10},
        {order:4,action:'Contact ISP for upstream filtering if needed',command:'escalate-cli notify --provider "$(jq -r .isp /config/network.json)" --type ddos',expected:'ISP notified and upstream filtering initiated',timeout:30},
        {order:5,action:'Monitor traffic levels and gradually relax limits',command:'traffic-monitor --interval 60s --threshold 1.5x --auto-relax',expected:'Normal traffic levels restored',timeout:3600},
      ],lastExecuted:'2026-04-15T03:20:00Z',successRate:91.5,execCount:8,version:2,contributors:['net-ops-01','soc-analyst-01','edge-engineer'],tags:['ddos','network','availability','emergency'],estimatedTime:60,reviewCycle:'Monthly'},
      {id:'RB-004',title:'Credential Compromise Response',category:'Incident Response',severity:'Critical',steps:[
        {order:1,action:'Identify scope of compromised credentials',command:'iam-cli query-compromised --source-alert "$ALERT_ID"',expected:'List of affected user accounts and systems',timeout:15},
        {order:2,action:'Disable all compromised sessions immediately',command:'iam-cli revoke-sessions --users-file /tmp/compromised_users.txt --all-devices',expected:'All sessions terminated',timeout:10},
        {order:3,action:'Force password reset for affected accounts',command:'iam-cli force-reset --users-file /tmp/compromised_users.txt --require-mfa',expected:'Password resets sent with MFA enforcement',timeout:30},
        {order:4,action:'Review recent access logs for lateral movement',command:'siem-query --user "$(cat /tmp/compromised_users.txt)" --since "72h" --output /tmp/access_review.json',expected:'Access log review completed',timeout:120},
        {order:5,action:'Check for persistence mechanisms (API keys, tokens, SSH keys)',command:'persist-check --users-file /tmp/compromised_users.txt --all-systems',expected:'Persistence scan complete',timeout:300},
      ],lastExecuted:'2026-04-18T16:45:00Z',successRate:96.0,execCount:12,version:4,contributors:['iam-lead-01','soc-analyst-02','forensics-01'],tags:['credential','compromise','iam','lateral-movement'],estimatedTime:30,reviewCycle:'Monthly'},
      {id:'RB-005',title:'Cloud Security Incident Playbook',category:'Cloud Security',severity:'High',steps:[
        {order:1,action:'Identify affected cloud resources from alert',command:'cloud-query --alert "$ALERT_ID" --resources',expected:'List of affected cloud resources',timeout:15},
        {order:2,action:'Isolate compromised cloud resources via security groups',command:'cloud-isolate --resources /tmp/affected_resources.json --mode restrict',expected:'Network isolation applied',timeout:10},
        {order:3,action:'Capture cloud instance metadata and logs',command:'cloud-forensics capture --resources /tmp/affected_resources.json --output /forensics/cloud/',expected:'Metadata and logs archived',timeout:60},
        {order:4,action:'Review IAM policies for unauthorized changes',command:'cloud-audit iam --since "24h" --changes-only',expected:'IAM change audit complete',timeout:30},
        {order:5,action:'Rotate all potentially exposed credentials',command:'cloud-rotate-keys --scope affected --force',expected:'All exposed keys rotated',timeout:45},
      ],lastExecuted:'2026-04-19T11:00:00Z',successRate:93.3,execCount:6,version:2,contributors:['cloud-sec-01','soc-analyst-01','iam-lead-01'],tags:['cloud','aws','gcp','azure','incident'],estimatedTime:25,reviewCycle:'Quarterly'},
      {id:'RB-006',title:'Data Breach Notification Workflow',category:'Compliance',severity:'Critical',steps:[
        {order:1,action:'Classify breached data by sensitivity level',command:'data-classify --source /tmp/breach_scope.json --output /tmp/classification.json',expected:'Data classified by sensitivity level',timeout:15},
        {order:2,action:'Determine regulatory notification requirements',command:'compliance-check --breach /tmp/classification.json --jurisdictions all',expected:'Notification requirements and deadlines listed',timeout:10},
        {order:3,action:'Draft notification letters for affected individuals',command:'notify-draft --template legal/breach_letter --recipients /tmp/affected_users.csv',expected:'Notification letters generated',timeout:30},
        {order:4,action:'Notify regulatory bodies within required timeframe',command:'regulatory-notify --authority "$(jq -r .authority /tmp/requirements.json)" --breach-id "$CASE_ID"',expected:'Regulatory notification confirmed',timeout:15},
        {order:5,action:'Activate credit monitoring for affected individuals',command:'credit-monitor activate --recipients /tmp/affected_users.csv --duration 12months',expected:'Credit monitoring enrollment confirmed',timeout:60},
      ],lastExecuted:'2026-03-15T09:00:00Z',successRate:100.0,execCount:2,version:1,contributors:['legal-01','dpo-01','compliance-01'],tags:['breach','notification','gdpr','regulatory','legal'],estimatedTime:120,reviewCycle:'Quarterly'},
    ];
    this._runbookHistory = [
      {id:'RH-001',runbookId:'RB-001',executedBy:'ir-lead-01',executedAt:'2026-04-20T08:30:00Z',duration:42,status:'Success',notes:'Variant identified as LockBit 4.0, no lateral movement detected',stepsCompleted:7,stepsTotal:7},
      {id:'RH-002',runbookId:'RB-002',executedBy:'soc-analyst-03',executedAt:'2026-04-22T14:15:00Z',duration:18,status:'Success',notes:'Phishing campaign from credential harvester, 12 users clicked',stepsCompleted:5,stepsTotal:5},
      {id:'RH-003',runbookId:'RB-003',executedBy:'net-ops-01',executedAt:'2026-04-15T03:20:00Z',duration:55,status:'Success',notes:'Volumetric DDoS attack mitigated, peak at 45Gbps',stepsCompleted:5,stepsTotal:5},
      {id:'RH-004',runbookId:'RB-004',executedBy:'iam-lead-01',executedAt:'2026-04-18T16:45:00Z',duration:28,status:'Partial',notes:'3 of 5 accounts had lateral movement, full containment required 45min',stepsCompleted:4,stepsTotal:5},
      {id:'RH-005',runbookId:'RB-005',executedBy:'cloud-sec-01',executedAt:'2026-04-19T11:00:00Z',duration:22,status:'Success',notes:'EC2 instance compromised via exposed RDP, isolated within 5min',stepsCompleted:5,stepsTotal:5},
    ];
    this._runbookLeaderboard = [
      {name:'ir-lead-01',contributions:45,lastActive:'2026-04-23',expertise:['Incident Response','Forensics','Malware Analysis'],avgRating:4.8},
      {name:'soc-analyst-01',contributions:38,lastActive:'2026-04-23',expertise:['SOC Operations','Threat Hunting','SIEM'],avgRating:4.7},
      {name:'iam-lead-01',contributions:32,lastActive:'2026-04-22',expertise:['Identity Management','Access Control','Zero Trust'],avgRating:4.6},
      {name:'cloud-sec-01',contributions:28,lastActive:'2026-04-21',expertise:['Cloud Security','Kubernetes','Container Security'],avgRating:4.5},
      {name:'net-ops-01',contributions:25,lastActive:'2026-04-20',expertise:['Network Security','DDoS Mitigation','Firewall Management'],avgRating:4.4},
      {name:'forensics-01',contributions:22,lastActive:'2026-04-19',expertise:['Digital Forensics','Memory Analysis','Disk Forensics'],avgRating:4.7},
    ];
  }


  // --- Security Intelligence Feed Aggregator ---
  private _intelFeedSources: Array<{id:string;name:string;type:string;frequency:string;lastFetch:string;status:string;articleCount:number;reliabilityScore:number;enabled:boolean}> = [];
  private _intelFeedItems: Array<{id:string;sourceId:string;title:string;severity:string;category:string;publishedAt:string;iocCount:number;iocs:Array<{type:string;value:string;confidence:number}>;tags:Array<string>;summary:string;actionRequired:boolean;relatedIncidents:number}> = [];
  private _intelFeedStats: {totalSources:number;activeSources:number;items24h:number;iocsExtracted:number;falsePositiveRate:number;avgReliability:number;topCategories:Array<{name:string;count:number}>} = {totalSources:25,activeSources:22,items24h:847,iocsExtracted:2341,falsePositiveRate:2.3,avgReliability:87.5,topCategories:[]};

  private _initIntelFeed() {
    this._intelFeedSources = [
      {id:'IF-001',name:'NIST NVD',type:'CVE Database',frequency:'Daily',lastFetch:'2026-04-23T14:00:00Z',status:'Active',articleCount:234567,reliabilityScore:98,enabled:true},
      {id:'IF-002',name:'AlienVault OTX',type:'Threat Intelligence',frequency:'Hourly',lastFetch:'2026-04-23T14:30:00Z',status:'Active',articleCount:89234,reliabilityScore:85,enabled:true},
      {id:'IF-003',name:'MISP Community',type:'Shared Indicators',frequency:'Real-time',lastFetch:'2026-04-23T14:35:00Z',status:'Active',articleCount:45678,reliabilityScore:82,enabled:true},
      {id:'IF-004',name:'CISA KEV',type:'Known Exploited Vulns',frequency:'Weekly',lastFetch:'2026-04-22T00:00:00Z',status:'Active',articleCount:1234,reliabilityScore:99,enabled:true},
      {id:'IF-005',name:'Recorded Future',type:'Commercial TI',frequency:'Real-time',lastFetch:'2026-04-23T14:35:00Z',status:'Active',articleCount:156789,reliabilityScore:92,enabled:true},
      {id:'IF-006',name:'Shodan Monitor',type:'Attack Surface',frequency:'Daily',lastFetch:'2026-04-23T06:00:00Z',status:'Active',articleCount:34567,reliabilityScore:88,enabled:true},
      {id:'IF-007',name:'VirusTotal',type:'Malware Intelligence',frequency:'On-demand',lastFetch:'2026-04-23T13:45:00Z',status:'Active',articleCount:78901,reliabilityScore:90,enabled:true},
      {id:'IF-008',name:'Abuse.ch',type:'Threat Intelligence',frequency:'Hourly',lastFetch:'2026-04-23T14:20:00Z',status:'Active',articleCount:23456,reliabilityScore:87,enabled:true},
      {id:'IF-009',name:'Security Blogs Aggregator',type:'News',frequency:'Hourly',lastFetch:'2026-04-23T14:30:00Z',status:'Active',articleCount:56789,reliabilityScore:75,enabled:true},
      {id:'IF-010',name:'Internal CTI Team',type:'Internal Intelligence',frequency:'On-demand',lastFetch:'2026-04-23T12:00:00Z',status:'Active',articleCount:2345,reliabilityScore:95,enabled:true},
    ];
    this._intelFeedItems = [
      {id:'ITM-001',sourceId:'IF-004',title:'Critical RCE in Apache Struts actively exploited',severity:'Critical',category:'Vulnerability',publishedAt:'2026-04-23T10:00:00Z',iocCount:3,iocs:[{type:'CVE',value:'CVE-2026-2001',confidence:0.99},{type:'URL',value:'/struts2-showcase/integration/saveGangster.action',confidence:0.95},{type:'Payload',value:"%{(#_='multipart/form-data')}",confidence:0.92}],tags:['rce','apache','actively-exploited','critical'],summary:'Apache Struts remote code execution vulnerability being actively exploited in the wild. CISA has added to Known Exploited Vulnerabilities catalog.',actionRequired:true,relatedIncidents:2},
      {id:'ITM-002',sourceId:'IF-002',title:'New Clop ransomware variant targeting healthcare',severity:'High',category:'Malware',publishedAt:'2026-04-23T08:30:00Z',iocCount:5,iocs:[{type:'Domain',value:'data-clop[.]onion',confidence:0.88},{type:'Hash',value:'a1b2c3d4e5f6...',confidence:0.91},{type:'Email',value:'support@secure-backup[.]com',confidence:0.85},{type:'IP',value:'185.220.101.42',confidence:0.87},{type:'File',value:'ransomware.exe',confidence:0.82}],tags:['ransomware','clop','healthcare','active-campaign'],summary:'New Clop ransomware variant specifically targeting healthcare organizations. Uses double-extortion and maintains persistence via scheduled tasks.',actionRequired:true,relatedIncidents:1},
      {id:'ITM-003',sourceId:'IF-005',title:'Supply chain attack via compromised npm package',severity:'High',category:'Supply Chain',publishedAt:'2026-04-22T22:00:00Z',iocCount:2,iocs:[{type:'Package',value:'@utils/core-lib@2.1.0',confidence:0.96},{type:'Hash',value:'sha256:e3b0c44298fc...',confidence:0.94}],tags:['supply-chain','npm','javascript','malicious-package'],summary:'Malicious npm package discovered stealing environment variables and sending them to attacker-controlled server. Over 50k weekly downloads before removal.',actionRequired:true,relatedIncidents:0},
      {id:'ITM-004',sourceId:'IF-001',title:'Buffer overflow in OpenSSH server',severity:'High',category:'Vulnerability',publishedAt:'2026-04-22T18:00:00Z',iocCount:1,iocs:[{type:'CVE',value:'CVE-2026-2002',confidence:0.98}],tags:['ssh','buffer-overflow','privilege-escalation','cvss-8.5'],summary:'Buffer overflow vulnerability in OpenSSH server allows unauthenticated remote code execution under certain configurations.',actionRequired:false,relatedIncidents:0},
      {id:'ITM-005',sourceId:'IF-008',title:'Phishing campaign impersonating Microsoft 365',severity:'Medium',category:'Phishing',publishedAt:'2026-04-23T06:00:00Z',iocCount:4,iocs:[{type:'Domain',value:'microsoft-secure[.]login-auth[.]com',confidence:0.93},{type:'URL',value:'/auth/login?redirect=office365',confidence:0.90},{type:'IP',value:'91.215.85.123',confidence:0.86},{type:'Email',value:'security@microsoft-alerts[.]com',confidence:0.89}],tags:['phishing','microsoft','credential-theft','m365'],summary:'Large-scale phishing campaign using lookalike domains to harvest Microsoft 365 credentials. Targeting enterprise users with fake security alerts.',actionRequired:false,relatedIncidents:0},
    ];
    this._intelFeedStats.topCategories = [
      {name:'Vulnerability',count:312},{name:'Malware',count:187},{name:'Phishing',count:156},
      {name:'Supply Chain',count:89},{name:'Ransomware',count:67},{name:'Data Leak',count:36},
    ];
  }

  // ===== ROUND 39: Security Cloud Cost Optimizer =====
  private _cloudCostProviders: Array<{name:string;provider:string;monthlySpend:number;reservedSpend:number;ondemandSpend:number;savingsPercent:number;tools:Array<{name:string;cost:number;usage:number;suggestion:string}>}> = [];
  private _costOptimizationRecommendations: Array<{id:string;title:string;provider:string;monthlySaving:number;implementationEffort:string;risk:string;description:string}> = [];
  private _costForecastData: Array<{month:string;projected:number;actual:number;variance:number;confidence:number}> = [];
  private _unusedResources: Array<{resourceId:string;type:string;provider:string;monthlyCost:number;lastUsed:string;recommendation:string}> = [];

  private _initCloudCostOptimizer(): void {
    const providers = ['AWS','Azure','GCP','Alibaba Cloud','Oracle Cloud','IBM Cloud'];
    const toolNames = ['WAF','DDoS Protection','Cloud Firewall','IDS/IPS','SIEM','Secrets Manager','KMS','IAM','GuardDuty','Security Hub','Cloud Trail','Config Rules','Inspector','Macie','Shield Advanced','Firewall Manager','VPC Flow Logs','DNS Security','Certificate Manager','Container Security'];
    const suggestions = ['Right-size to smaller tier','Switch to reserved pricing','Consolidate overlapping tools','Remove unused instances','Migrate to shared service','Enable auto-scaling','Switch to spot/preemptible','Negotiate enterprise discount'];
    const efforts = ['low','medium','high'];
    const risks = ['none','low','medium'];
    this._cloudCostProviders = providers.map(provider => {
      const monthlySpend = Math.floor(Math.random() * 80000) + 20000;
      const reservedPercent = Math.random() * 0.4 + 0.2;
      const reservedSpend = Math.floor(monthlySpend * reservedPercent);
      const ondemandSpend = monthlySpend - reservedSpend;
      const toolCount = Math.floor(Math.random() * 6) + 4;
      const tools = Array.from({length: toolCount}, () => {
        const cost = Math.floor(Math.random() * 10000) + 500;
        return {
          name: toolNames[Math.floor(Math.random() * toolNames.length)],
          cost,
          usage: Math.floor(Math.random() * 100),
          suggestion: suggestions[Math.floor(Math.random() * suggestions.length)]
        };
      });
      return {name: provider + ' Security Stack', provider, monthlySpend, reservedSpend, ondemandSpend, savingsPercent: Math.round(reservedPercent * 100), tools};
    });
    this._costOptimizationRecommendations = Array.from({length: 25}, (_, i) => ({
      id: 'COST-OPT-' + String(i + 1).padStart(3, '0'),
      title: 'Optimize ' + providers[Math.floor(Math.random() * providers.length)] + ' ' + toolNames[Math.floor(Math.random() * toolNames.length)] + ' spend',
      provider: providers[Math.floor(Math.random() * providers.length)],
      monthlySaving: Math.floor(Math.random() * 5000) + 200,
      implementationEffort: efforts[Math.floor(Math.random() * efforts.length)],
      risk: risks[Math.floor(Math.random() * risks.length)],
      description: 'Analysis of usage patterns indicates opportunity to reduce security tool spend by transitioning pricing model'
    }));
    this._costForecastData = Array.from({length: 12}, (_, i) => {
      const month = '2026-' + String(i + 1).padStart(2, '0');
      const projected = Math.floor(Math.random() * 50000) + 300000;
      const variance = Math.round((Math.random() * 20 - 5) * 100) / 100;
      return {month, projected, actual: Math.floor(projected * (1 + variance / 100)), variance, confidence: Math.round((85 + Math.random() * 15) * 10) / 10};
    });
    this._unusedResources = Array.from({length: 20}, (_, i) => ({
      resourceId: 'RES-' + String(i + 1).padStart(4, '0'),
      type: toolNames[Math.floor(Math.random() * toolNames.length)],
      provider: providers[Math.floor(Math.random() * providers.length)],
      monthlyCost: Math.floor(Math.random() * 3000) + 100,
      lastUsed: '2026-0' + String(Math.floor(Math.random() * 3) + 1) + '-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0'),
      recommendation: 'Resource shows zero utilization in past 30 days. Consider decommissioning to save costs.'
    }));
  }

  private _getTotalCloudSecuritySpend(): number {
    return this._cloudCostProviders.reduce((s, p) => s + p.monthlySpend, 0);
  }

  private _getCostSavingsPotential(): number {
    return this._costOptimizationRecommendations.reduce((s, r) => s + r.monthlySaving, 0);
  }

  private _getRightSizingSuggestions(): Array<{tool:string;provider:string;currentTier:string;recommendedTier:string;estimatedSaving:number;confidence:number}> {
    const tiers = ['Small','Medium','Large','Enterprise'];
    return Array.from({length: 15}, () => ({
      tool: 'Security Tool Instance',
      provider: this._cloudCostProviders[Math.floor(Math.random() * this._cloudCostProviders.length)].provider,
      currentTier: tiers[Math.floor(Math.random() * 2) + 1],
      recommendedTier: tiers[Math.floor(Math.random() * 2)],
      estimatedSaving: Math.floor(Math.random() * 2000) + 100,
      confidence: Math.round((60 + Math.random() * 35) * 10) / 10
    }));
  }

  private _getReservedVsOnDemandBreakdown(): {reservedPercent:number;ondemandPercent:number;savingsFromReserved:number;recommendations:Array<{provider:string;currentMix:string;suggestedMix:string;projectedSaving:number}>} {
    const reservedPercent = Math.round(this._cloudCostProviders.reduce((s,p) => s + p.reservedSpend, 0) / this.getTotalCloudSecuritySpend() * 100);
    return {
      reservedPercent,
      ondemandPercent: 100 - reservedPercent,
      savingsFromReserved: Math.floor(Math.random() * 15000) + 5000,
      recommendations: this._cloudCostProviders.map(p => ({
        provider: p.provider,
        currentMix: p.savingsPercent + '% reserved',
        suggestedMix: Math.min(95, p.savingsPercent + 15) + '% reserved',
        projectedSaving: Math.floor(p.ondemandSpend * 0.3)
      }))
    };
  }

  private _getCostTrendDirection(): string {
    const last3 = this._costForecastData.slice(-3);
    if (last3.length < 3) return 'stable';
    const avg = last3.reduce((s, d) => s + d.variance, 0) / 3;
    if (avg < -3) return 'decreasing';
    if (avg > 3) return 'increasing';
    return 'stable';
  }

  private _getUnusedResourceTotalCost(): number {
    return this._unusedResources.reduce((s, r) => s + r.monthlyCost, 0);
  }

  private _getCostByCategory(): Array<{category:string;amount:number;percent:number;trend:string}> {
    const categories = ['Network Security','Endpoint Protection','Cloud Native Security','Identity & Access','Data Protection','Compliance & Audit','Monitoring & Detection','Incident Response'];
    const total = Math.floor(Math.random() * 100000) + 200000;
    let remaining = total;
    return categories.map((cat, i) => {
      const isLast = i === categories.length - 1;
      const amount = isLast ? remaining : Math.floor(remaining * (Math.random() * 0.3 + 0.05));
      remaining -= amount;
      return {category: cat, amount, percent: Math.round(amount / total * 1000) / 10, trend: Math.random() > 0.5 ? 'up' : 'down'};
    });
  }



  private _securityBaselineDriftAnalysis: Array<{area:string;baselineValue:number;currentValue:number;driftPercent:number;trend:string;lastAssessed:string;confidence:number;recommendation:string}> = [];
  private _threatLandscapeShifts: Array<{category:string;currentLevel:string;previousLevel:string;changeDirection:string;keyIndicators:Array<{indicator:string;value:number;trend:string}>;forecast:string}> = [];
  private _securityPostureAnomalies: Array<{id:string;type:string;severity:string;detectedAt:string;description:string;affectedAssets:number;status:string;rootCause:string;mitigationSteps:Array<string>;resolvedAt:string}> = [];
  private _crossDomainCorrelationMatrix: Record<string,Record<string,number>> = {};
  private _securityMaturityRadar: Array<{dimension:string;currentScore:number;targetScore:number;gap:number;initiatives:Array<{name:string;status:string;progress:number;impact:string}> }> = [];

  private _initRound39ExtraAnalytics(): void {
    const areas = ['Network Security','Endpoint Protection','Identity & Access','Data Protection','Cloud Security','Application Security','Physical Security','Governance & Compliance','Incident Response','Threat Intelligence','Vulnerability Management','Security Awareness'];
    const levels = ['critical','high','medium','low','minimal'];
    const statuses = ['active','investigating','mitigated','resolved','accepted'];
    this._securityBaselineDriftAnalysis = areas.map(area => {
      const baseline = Math.floor(Math.random() * 40) + 60;
      const current = Math.floor(baseline * (0.85 + Math.random() * 0.3));
      return {
        area, baselineValue: baseline, currentValue: current,
        driftPercent: Math.round((current - baseline) / baseline * 1000) / 10,
        trend: current > baseline ? 'degrading' : 'improving',
        lastAssessed: '2026-04-' + String(Math.floor(Math.random() * 23) + 1).padStart(2, '0'),
        confidence: Math.round((70 + Math.random() * 25) * 10) / 10,
        recommendation: current < baseline ? 'Immediate review and remediation recommended' : 'Continue current security controls'
      };
    });
    this._threatLandscapeShifts = ['Ransomware','Supply Chain','Nation State','Insider Threat','DDoS','Zero-Day Exploits','Credential Theft','Cloud Misconfiguration','IoT Vulnerabilities','AI-Powered Attacks'].map(category => ({
      category,
      currentLevel: levels[Math.floor(Math.random() * 3)],
      previousLevel: levels[Math.floor(Math.random() * 3)],
      changeDirection: Math.random() > 0.5 ? 'increasing' : 'decreasing',
      keyIndicators: Array.from({length: 3}, () => ({
        indicator: 'Threat activity metric tracked by intelligence platform',
        value: Math.floor(Math.random() * 100),
        trend: Math.random() > 0.5 ? 'up' : 'down'
      })),
      forecast: 'Threat level expected to ' + (Math.random() > 0.5 ? 'increase' : 'remain stable') + ' over next 30 days'
    }));
    this._securityPostureAnomalies = Array.from({length: 20}, (_, i) => ({
      id: 'ANOMALY-' + String(i + 1).padStart(4, '0'),
      type: ['Configuration Drift','Access Anomaly','Behavioral Deviation','Performance Anomaly','Compliance Deviation'][Math.floor(Math.random() * 5)],
      severity: levels[Math.floor(Math.random() * 4)],
      detectedAt: '2026-04-' + String(Math.floor(Math.random() * 23) + 1).padStart(2, '0') + 'T' + String(Math.floor(Math.random() * 24)).padStart(2, '0') + ':00Z',
      description: 'Anomalous security posture change detected by continuous monitoring engine',
      affectedAssets: Math.floor(Math.random() * 20) + 1,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      rootCause: 'Investigation in progress by security operations team',
      mitigationSteps: ['Isolate affected assets','Review recent changes','Update baseline configuration','Monitor for recurrence'],
      resolvedAt: Math.random() > 0.5 ? '2026-04-' + String(Math.floor(Math.random() * 23) + 1).padStart(2, '0') : ''
    }));
    const domains = ['Network','Endpoint','Identity','Data','Cloud','App'];
    domains.forEach(d1 => {
      this._crossDomainCorrelationMatrix[d1] = {};
      domains.forEach(d2 => {
        this._crossDomainCorrelationMatrix[d1][d2] = d1 === d2 ? 1.0 : Math.round(Math.random() * 80) / 100;
      });
    });
    this._securityMaturityRadar = areas.slice(0, 8).map(dimension => ({
      dimension,
      currentScore: Math.floor(Math.random() * 40) + 30,
      targetScore: Math.floor(Math.random() * 20) + 75,
      gap: 0,
      initiatives: Array.from({length: 3}, () => ({
        name: 'Security improvement initiative',
        status: ['planned','in-progress','completed'][Math.floor(Math.random() * 3)],
        progress: Math.floor(Math.random() * 100),
        impact: 'Medium to high impact on security posture'
      }))
    }));
    this._securityMaturityRadar.forEach(m => { m.gap = m.targetScore - m.currentScore; });
  }

  private _getOverallDriftScore(): number {
    if (this._securityBaselineDriftAnalysis.length === 0) return 0;
    return Math.round(this._securityBaselineDriftAnalysis.reduce((s, d) => s + Math.abs(d.driftPercent), 0) / this._securityBaselineDriftAnalysis.length * 10) / 10;
  }

  private _getActiveAnomalyCount(): number {
    return this._securityPostureAnomalies.filter(a => a.status === 'active' || a.status === 'investigating').length;
  }

  private _getCriticalThreatShifts(): number {
    return this._threatLandscapeShifts.filter(t => t.changeDirection === 'increasing' && (t.currentLevel === 'critical' || t.currentLevel === 'high')).length;
  }

  private _getMaturityGapSummary(): {avgGap:number;dimensionsBelowTarget:number;improvementPotential:number;topDimension:string} {
    const gaps = this._securityMaturityRadar.map(m => m.gap);
    const avgGap = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length * 10) / 10;
    return {
      avgGap,
      dimensionsBelowTarget: gaps.filter(g => g > 0).length,
      improvementPotential: Math.round(avgGap * 1.5),
      topDimension: this._securityMaturityRadar.reduce((a, b) => a.gap > b.gap ? a : b).dimension
    };
  }


  private _securityTrendForecaster: Array<{metric:string;currentValue:number;projected30d:number;projected90d:number;confidence:number;model:string;lastUpdated:string;dataPoints:number}> = [];
  private _securityBenchmarkComparison: Array<{metric:string;ourValue:number;industryAvg:number;topQuartile:number;bottomQuartile:number;percentileRank:number;gapToTop:string}> = [];
  private _securityAlertSuppressionRules: Array<{ruleId:string;name:string;source:string;condition:string;suppressedCount:number;lastTriggered:string;expiresAt:string;createdBy:string;active:boolean}> = [];
  private _securityWorkflowAutomations: Array<{workflowId:string;name:string;trigger:string;actions:number;avgExecutionTime:number;successRate:number;lastExecuted:string;enabled:boolean}> = [];
  private _securityDataQualityMetrics: Array<{dataSource:string;completeness:number;accuracy:number;timeliness:number;consistency:number;freshness:number;overallScore:number;issues:number}> = [];

  private _initRound39ExtraTrends(): void {
    const metrics = ['MTTD','MTTR','Vulnerability Backlog','Patch Compliance','Phishing Click Rate','MFA Adoption','Encryption Coverage','Access Review Compliance','Incident Frequency','False Positive Rate','Mean Time to Contain','Recovery Time'];
    this._securityTrendForecaster = metrics.map(metric => ({
      metric, currentValue: Math.floor(Math.random() * 100) + 10,
      projected30d: Math.floor(Math.random() * 100) + 10,
      projected90d: Math.floor(Math.random() * 100) + 10,
      confidence: Math.round((60 + Math.random() * 35) * 10) / 10,
      model: ['ARIMA','Prophet','Linear Regression','Exponential Smoothing','LSTM Neural Network'][Math.floor(Math.random() * 5)],
      lastUpdated: '2026-04-22T08:00:00Z',
      dataPoints: Math.floor(Math.random() * 300) + 30
    }));
    this._securityBenchmarkComparison = metrics.slice(0, 8).map(metric => ({
      metric, ourValue: Math.floor(Math.random() * 100),
      industryAvg: Math.floor(Math.random() * 60) + 20,
      topQuartile: Math.floor(Math.random() * 30) + 70,
      bottomQuartile: Math.floor(Math.random() * 20) + 5,
      percentileRank: Math.floor(Math.random() * 100),
      gapToTop: Math.floor(Math.random() * 40) + 5 + ' points'
    }));
    this._securityAlertSuppressionRules = Array.from({length: 15}, (_, i) => ({
      ruleId: 'SUP-' + String(i + 1).padStart(4, '0'),
      name: 'Alert suppression rule ' + (i + 1),
      source: ['SIEM','EDR','WAF','Cloud','IDS'][Math.floor(Math.random() * 5)],
      condition: 'Pattern match on known benign alert signature',
      suppressedCount: Math.floor(Math.random() * 5000) + 100,
      lastTriggered: '2026-04-' + String(Math.floor(Math.random() * 23) + 1).padStart(2, '0'),
      expiresAt: '2026-' + String(Math.floor(Math.random() * 6) + 7).padStart(2, '0') + '-01',
      createdBy: 'SOC Analyst',
      active: Math.random() > 0.2
    }));
    this._securityWorkflowAutomations = Array.from({length: 12}, (_, i) => ({
      workflowId: 'WF-' + String(i + 1).padStart(4, '0'),
      name: 'Automated security workflow ' + (i + 1),
      trigger: 'Alert triggered matching predefined correlation pattern',
      actions: Math.floor(Math.random() * 8) + 2,
      avgExecutionTime: Math.floor(Math.random() * 120) + 5,
      successRate: Math.round((80 + Math.random() * 20) * 10) / 10,
      lastExecuted: '2026-04-' + String(Math.floor(Math.random() * 23) + 1).padStart(2, '0'),
      enabled: Math.random() > 0.15
    }));
    this._securityDataQualityMetrics = ['Vulnerability Scanner','SIEM Logs','Asset Inventory','Threat Intelligence','Compliance Database','Identity Store','Network Flows','Cloud Audit Logs'].map(dataSource => ({
      dataSource, completeness: Math.round((70 + Math.random() * 30) * 10) / 10,
      accuracy: Math.round((75 + Math.random() * 25) * 10) / 10,
      timeliness: Math.round((60 + Math.random() * 35) * 10) / 10,
      consistency: Math.round((80 + Math.random() * 20) * 10) / 10,
      freshness: Math.round((65 + Math.random() * 30) * 10) / 10,
      overallScore: 0, issues: Math.floor(Math.random() * 15)
    }));
    this._securityDataQualityMetrics.forEach(m => { m.overallScore = Math.round((m.completeness + m.accuracy + m.timeliness + m.consistency + m.freshness) / 5 * 10) / 10; });
  }

  private _getForecastAccuracy(): number {
    if (this._securityTrendForecaster.length === 0) return 0;
    return Math.round(this._securityTrendForecaster.reduce((s, f) => s + f.confidence, 0) / this._securityTrendForecaster.length * 10) / 10;
  }

  private _getBenchmarkPercentile(): number {
    if (this._securityBenchmarkComparison.length === 0) return 0;
    return Math.round(this._securityBenchmarkComparison.reduce((s, b) => s + b.percentileRank, 0) / this._securityBenchmarkComparison.length);
  }

  private _getActiveSuppressions(): number {
    return this._securityAlertSuppressionRules.filter(r => r.active).length;
  }

  private _getTotalSuppressedAlerts(): number {
    return this._securityAlertSuppressionRules.reduce((s, r) => s + r.suppressedCount, 0);
  }

  private _getActiveWorkflows(): number {
    return this._securityWorkflowAutomations.filter(w => w.enabled).length;
  }

  private _getAverageDataQuality(): number {
    if (this._securityDataQualityMetrics.length === 0) return 0;
    return Math.round(this._securityDataQualityMetrics.reduce((s, m) => s + m.overallScore, 0) / this._securityDataQualityMetrics.length * 10) / 10;
  }

  private _getLowQualityDataSources(): number {
    return this._securityDataQualityMetrics.filter(m => m.overallScore < 80).length;
  }

  render() {    if (this._stlRules.length === 0) { this._initStlRules(); this._initStlCvss(); this._runStlAnomalyDetection(); this._generateStlPredictions(); this._initStlApprovals(); this._initStlActivity(); this._initStlNotifications(); }

    const items = this._getFiltered();
    const crit = items.filter(i => i.severity === 'critical').length;
    const high = items.filter(i => i.severity === 'high').length;
    const open = items.filter(i => i.status === 'open' || i.status === 'in-progress').length;
    const resolved = items.filter(i => i.status === 'resolved').length;
    return html`
      <div class="panel">
        <div class="pt">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          Security Timeline
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
          <button class="tab ${this._activeTab === 'rules' ? 'active' : ''}" @click=${() => { this._activeTab = 'rules'; }}>Rules</button>
          <button class="tab ${this._activeTab === 'anomalies' ? 'active' : ''}" @click=${() => { this._activeTab = 'anomalies'; }}>Anomalies</button>
          <button class="tab ${this._activeTab === 'predictions' ? 'active' : ''}" @click=${() => { this._activeTab = 'predictions'; }}>Predict</button>
          <button class="tab ${this._activeTab === 'approvals' ? 'active' : ''}" @click=${() => { this._activeTab = 'approvals'; }}>Approvals</button>
          <button class="tab ${this._activeTab === 'config' ? 'active' : ''}" @click=${() => { this._activeTab = 'config'; }}>Config</button>
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
        
        ${this._activeTab === 'rules' ? html`
          ${this._renderStlRules()}
          <div style="margin-top:12px;font-size:11px;font-weight:600;margin-bottom:6px">Category Treemap</div>
          <div style="background:#1a1d27;border-radius:8px;padding:12px">${this._renderStlTreemapSVG()}</div>
          <div style="margin-top:12px;font-size:11px;font-weight:600;margin-bottom:6px">Data Flow (Sankey)</div>
          <div style="background:#1a1d27;border-radius:8px;padding:12px">${this._renderStlSankeySVG()}</div>
          ${this._renderStlActivity()}
        ` : nothing}
        ${this._activeTab === 'anomalies' ? html`
          ${this._renderStlAnomalies()}
          ${this._renderStlNotifications()}
        ` : nothing}
        ${this._activeTab === 'predictions' ? html`
          ${this._renderStlPredictions()}
          <div style="margin-top:12px;font-size:11px;font-weight:600;margin-bottom:6px">CVSS Scoring</div>
          <div style="background:#1a1d27;border-radius:8px;padding:12px">
            <table class="history-table"><thead><tr><th>ID</th><th>Base</th><th>Temporal</th><th>Environmental</th><th>Overall</th></tr></thead><tbody>
              ${this._stlcvssData.map(c => html`<tr><td>${c.itemId}</td><td style="color:${c.base >= 7 ? '#ef4444' : c.base >= 4 ? '#eab308' : '#22c55e'}">${c.base}</td><td>${c.temporal}</td><td>${c.environmental}</td><td style="font-weight:700;color:${c.overall >= 7 ? '#ef4444' : c.overall >= 4 ? '#eab308' : '#22c55e'}">${c.overall}</td></tr>`)}
            </tbody></table>
          </div>
        ` : nothing}
        ${this._activeTab === 'approvals' ? html`
          ${this._renderStlApprovals()}
        ` : nothing}
        ${this._activeTab === 'config' ? html`
          ${this._renderStlConfig()}
        ` : nothing}
        ${this._activeTab === 'new' ? html`
          <div class="form-section">
            <div class="form-title">Create New Security Timeline Entry</div>
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
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Security Timeline Findings Grid</span>
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


  // === SCENARIO SIMULATION ENGINE ===
  @state() private _stScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _stScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _stScenarioCompare: boolean = false;
  @state() private _stScenarioSelected: string[] = [];

  private _stInitScenarios(): void {
    const saved = localStorage.getItem('st_scenarios');
    if (saved) { try { this._stScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._stScenarios.length === 0) {
      this._stScenarios = [
        {id:'st-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'st-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'st-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _stSaveScenarios(): void {
    localStorage.setItem('st_scenarios', JSON.stringify(this._stScenarios));
  }

  private _stAddScenario(): void {
    const f = this._stScenarioForm;
    if (!f.attackType || !f.target) return;
    this._stScenarios = [...this._stScenarios, {
      id: 'st-s' + (this._stScenarios.length + 1),
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
    this._stScenarioForm = {attackType:'',target:'',method:''};
    this._stSaveScenarios();
  }

  private _stRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._stScenarioCompare = !this._stScenarioCompare; }}>${this._stScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._stScenarioForm = {...this._stScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._stScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._stScenarioForm = {...this._stScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._stScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._stScenarioForm = {...this._stScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._stScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._stAddScenario}>Run Simulation</button>
      </div>
      ${this._stScenarioCompare && this._stScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._stScenarios.length)},1fr);gap:8px">
            ${this._stScenarios.slice(0,3).map(s => html`
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
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._stScenarios.length})</div>
        ${this._stScenarios.map(s => html`
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
  @state() private _stTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _stTrendZoom: {start:number;end:number} | null = null;
  @state() private _stTrendMA: number = 7;

  private _stInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._stTrendData = data;
  }

  private _stCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._stTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._stTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _stGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._stTrendData.map(d => d.value);
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

  private _stRenderTimeSeries(): any {
    const stats = this._stGetStats();
    const filtered = this._stTrendZoom ? this._stTrendData.filter(d => d.day >= this._stTrendZoom.start && d.day <= this._stTrendZoom.end) : this._stTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._stTrendMA === 7 ? 'active' : ''}" @click=${() => { this._stTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._stTrendMA === 30 ? 'active' : ''}" @click=${() => { this._stTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._stTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._stTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
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
  @state() private _stRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _stActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _stPermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _stPermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _stPermCompare: string[] = [];

  private _stInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._stRoles) {
      perms[role] = {};
      this._stActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._stPermissions = perms;
  }

  private _stTogglePermission(role: string, action: string): void {
    const old = this._stPermissions[role][action];
    this._stPermissions = {...this._stPermissions, [role]: {...this._stPermissions[role], [action]: !old}};
    this._stPermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _stRenderRBAC(): any {
    const compareRoles = this._stPermCompare.map(r => this._stPermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._stRoles.map(r => html`
              <button class="tab ${this._stPermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._stPermCompare = this._stPermCompare.includes(r) ? this._stPermCompare.filter(x => x !== r) : [...this._stPermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._stActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._stRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._stActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._stPermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._stTogglePermission(role, action)}>${this._stPermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._stPermCompare.join(' vs ')}</div>
            ${this._stActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._stPermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._stPermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._stPermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _stReportTemplate: string = 'executive';
  @state() private _stReportSchedule: string = 'weekly';
  @state() private _stReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _stReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _stGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._stReportHistory.unshift({id,template:this._stReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _stRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._stReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._stReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._stReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._stReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._stReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._stReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._stGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._stReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._stReportHistory.slice(0,3).map(r => html`
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
  @state() private _stHighContrast: boolean = false;
  @state() private _stA11yAnnounce: string = '';
  @state() private _stShortcutsVisible: boolean = false;
  @state() private _stFocusTrap: boolean = false;

  private _stShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _stHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._stFocusTrap) { this._stFocusTrap = false; this._stAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._stHighContrast = !this._stHighContrast; this._stAnnounce('High contrast ' + (this._stHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._stShortcutsVisible = !this._stShortcutsVisible; }
  }

  private _stAnnounce(msg: string): void {
    this._stA11yAnnounce = msg;
    setTimeout(() => { this._stA11yAnnounce = ''; }, 2000);
  }

  private _stRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._stShortcutsVisible ? 'active' : ''}" @click=${() => { this._stShortcutsVisible = !this._stShortcutsVisible; }} aria-expanded=${this._stShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._stHighContrast} @change=${() => { this._stHighContrast = !this._stHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._stShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._stShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._stA11yAnnounce}</div>
      </div>
    `;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.stInitRound17();
    this._initThreatModel();
    this._initPipeline();
    this._initPlaybooks();
    this._initMetrics();
    this._initIntegration();
    this._stInitScenarios();
    this._stInitTrendData();
    this._stInitPermissions();
    document.addEventListener('keydown', this._stHandleKeydown.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._stHandleKeydown.bind(this));
  }

  // === TAB INTEGRATION FOR EXTENDED FEATURES ===
  @state() private _stActiveSubTab: string = 'scenario';



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
        { id: 't4', name: 'Data injection in security operations', stride: 'T', likelihood: 7, impact: 8, dreadScore: 7.0, status: 'open', mitigations: ['Input validation', 'WAF rules'], assignedTo: 'Dev Team', discoveredDate: '2024-01-08', lastReviewed: '2024-02-10' },
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

  private _stGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _stRenderSubPanel(): any {
    switch (this._stActiveSubTab) {
      case 'scenario': return this._stRenderScenarioEngine();
      case 'timeseries': return this._stRenderTimeSeries();
      case 'rbac': return this._stRenderRBAC();
      case 'reporting': return this._stRenderReporting();
      case 'a11y': return this._stRenderAccessibility();
      default: return nothing;
    }
  }

  private _stRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._stGetAllSubTabs().map(t => html`
          <button class="tab ${this._stActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._stActiveSubTab = t.key; }} role="tab" aria-selected=${this._stActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="st-tab-${this._stActiveSubTab}">
        ${this._stRenderSubPanel()}
      </div>
    `;
  }

  
  // Register new subtabs for extended sections
  private _stmGetNewSubTabs(): {key:string;label:string}[] {
    return [
      { key: 'analytics', label: 'Analytics' },
      { key: 'incident-coord', label: 'IR Coordination' },
      { key: 'metrics-corr', label: 'Metrics Correlation' },
      { key: 'api-gateway', label: 'API Gateway' },
      { key: 'perf-opt', label: 'Performance' },
    ];
  }

  // ========== Section A: Advanced Analytics Engine ==========
  @state() private _stmBayesianPrior: number = 0.5;
  @state() private _stmBayesianLikelihood: number = 0.7;
  @state() private _stmMonteCarloResults: number[] = [];
  @state() private _stmCorrelationMatrix: number[][] = [];
  @state() private _stmOutlierIndices: number[] = [];
  @state() private _stmTrendComponents: {trend:number;seasonal:number;residual:number}[] = [];
  @state() private _stmAnalyticsView: string = 'bayesian';
  @state() private _stmConfidenceLevel: number = 95;
  @state() private _stmMonteCarloIterations: number = 100;

  private _stmCalculateBayesianPosterior(): number {
    const prior = this._stmBayesianPrior;
    const likelihood = this._stmBayesianLikelihood;
    const falsePositiveRate = 1 - likelihood;
    const marginal = prior * likelihood + (1 - prior) * falsePositiveRate;
    return marginal > 0 ? (prior * likelihood) / marginal : 0;
  }

  private _stmRunMonteCarloSimulation(): number[] {
    const results: number[] = [];
    const baseRisk = 0.35;
    const volatility = 0.15;
    for (let i = 0; i < this._stmMonteCarloIterations; i++) {
      let cumulative = baseRisk;
      for (let j = 0; j < 12; j++) {
        const shock = (Math.random() - 0.5) * 2 * volatility;
        cumulative = Math.max(0, Math.min(1, cumulative + shock * 0.1));
      }
      results.push(cumulative);
    }
    this._stmMonteCarloResults = results;
    return results;
  }

  private _stmComputeCorrelationMatrix(): number[][] {
    const events = this._stmGenerateMockTimeSeries(6, 50);
    const n = events.length;
    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        row.push(this._stmPearsonCorrelation(events[i], events[j]));
      }
      matrix.push(row);
    }
    this._stmCorrelationMatrix = matrix;
    return matrix;
  }

  private _stmPearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;
    const mx = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const my = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
    let num = 0, dx = 0, dy = 0;
    for (let i = 0; i < n; i++) {
      const xi = x[i] - mx, yi = y[i] - my;
      num += xi * yi;
      dx += xi * xi;
      dy += yi * yi;
    }
    const denom = Math.sqrt(dx * dy);
    return denom > 0 ? num / denom : 0;
  }

  private _stmDetectOutliersZScore(data: number[]): number[] {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length);
    const threshold = 2.0;
    return data.map((v, i) => Math.abs((v - mean) / (std || 1)) > threshold ? i : -1).filter(i => i >= 0);
  }

  private _stmDetectOutliersIQR(data: number[]): number[] {
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    return data.map((v, i) => v < lower || v > upper ? i : -1).filter(i => i >= 0);
  }

  private _stmDecomposeTrend(data: number[]): {trend:number;seasonal:number;residual:number}[] {
    const result: {trend:number;seasonal:number;residual:number}[] = [];
    const window = 5;
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - window);
      const end = Math.min(data.length, i + window + 1);
      const trend = data.slice(start, end).reduce((a, b) => a + b, 0) / (end - start);
      const seasonal = Math.sin((i / 12) * Math.PI * 2) * 0.1;
      const residual = data[i] - trend - seasonal;
      result.push({ trend, seasonal, residual });
    }
    this._stmTrendComponents = result;
    return result;
  }

  private _stmPredictiveScoreWithCI(data: number[]): {score:number;low:number;high:number} {
    const recent = data.slice(-10);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const std = Math.sqrt(recent.reduce((a, b) => a + (b - avg) ** 2, 0) / recent.length);
    const zScore = this._stmConfidenceLevel === 99 ? 2.576 : this._stmConfidenceLevel === 90 ? 1.645 : 1.96;
    return { score: avg, low: avg - zScore * std, high: avg + zScore * std };
  }

  private _stmGenerateMockTimeSeries(count: number, length: number): number[][] {
    const series: number[][] = [];
    for (let s = 0; s < count; s++) {
      const arr: number[] = [];
      let val = 50 + s * 10;
      for (let i = 0; i < length; i++) {
        val += (Math.random() - 0.48) * 5;
        arr.push(Math.max(0, Math.min(100, val)));
      }
      series.push(arr);
    }
    return series;
  }

  private _stmRenderAnalyticsEngine(): any {
    const posterior = this._stmCalculateBayesianPosterior();
    const mcResults = this._stmMonteCarloResults.length > 0 ? this._stmMonteCarloResults : this._stmRunMonteCarloSimulation();
    const mcAvg = mcResults.reduce((a, b) => a + b, 0) / mcResults.length;
    const mcP95 = [...mcResults].sort((a, b) => a - b)[Math.floor(mcResults.length * 0.95)];
    const matrix = this._stmCorrelationMatrix.length > 0 ? this._stmCorrelationMatrix : this._stmComputeCorrelationMatrix();
    const labels = ['Vulns', 'Incidents', 'Phishing', 'Access', 'Compliance', 'Training'];
    return html`
      <div class="analytics-engine" style="padding:12px">
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <button class="tab ${this._stmAnalyticsView === 'bayesian' ? 'active' : ''}" @click=${() => { this._stmAnalyticsView = 'bayesian'; }}>Bayesian</button>
          <button class="tab ${this._stmAnalyticsView === 'montecarlo' ? 'active' : ''}" @click=${() => { this._stmAnalyticsView = 'montecarlo'; }}>Monte Carlo</button>
          <button class="tab ${this._stmAnalyticsView === 'correlation' ? 'active' : ''}" @click=${() => { this._stmAnalyticsView = 'correlation'; }}>Correlation</button>
          <button class="tab ${this._stmAnalyticsView === 'outliers' ? 'active' : ''}" @click=${() => { this._stmAnalyticsView = 'outliers'; }}>Outliers</button>
          <button class="tab ${this._stmAnalyticsView === 'trend' ? 'active' : ''}" @click=${() => { this._stmAnalyticsView = 'trend'; }}>Trend</button>
          <button class="tab ${this._stmAnalyticsView === 'predictive' ? 'active' : ''}" @click=${() => { this._stmAnalyticsView = 'predictive'; }}>Predictive</button>
        </div>
        ${this._stmAnalyticsView === 'bayesian' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Bayesian Risk Probability</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div><span style="color:#888">Prior:</span> ${this._stmBayesianPrior.toFixed(2)}</div>
              <div><span style="color:#888">Likelihood:</span> ${this._stmBayesianLikelihood.toFixed(2)}</div>
              <div><span style="color:#888">Posterior:</span> <strong style="color:${posterior > 0.6 ? '#f44' : '#4f4'}">${posterior.toFixed(4)}</strong></div>
              <div><span style="color:#888">Risk Level:</span> ${posterior > 0.7 ? 'Critical' : posterior > 0.5 ? 'High' : posterior > 0.3 ? 'Medium' : 'Low'}</div>
            </div>
            <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
              <label style="color:#888;font-size:12px">Prior:</label>
              <input type="range" min="0" max="100" .value=${String(this._stmBayesianPrior * 100)} @input=${(e: any) => { this._stmBayesianPrior = Number(e.target.value) / 100; }} style="flex:1" />
              <label style="color:#888;font-size:12px">Likelihood:</label>
              <input type="range" min="0" max="100" .value=${String(this._stmBayesianLikelihood * 100)} @input=${(e: any) => { this._stmBayesianLikelihood = Number(e.target.value) / 100; }} style="flex:1" />
            </div>
          </div>
        ` : nothing}
        ${this._stmAnalyticsView === 'montecarlo' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Monte Carlo Risk Simulation (${mcResults.length} iterations)</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
              <div><span style="color:#888">Mean:</span> ${(mcAvg * 100).toFixed(1)}%</div>
              <div><span style="color:#888">P95 VaR:</span> ${(mcP95 * 100).toFixed(1)}%</div>
              <div><span style="color:#888">Min:</span> ${(Math.min(...mcResults) * 100).toFixed(1)}%</div>
            </div>
            <div style="margin-top:8px">
              <div style="display:flex;height:60px;align-items:flex-end;gap:1px">${mcResults.slice(0, 50).map(v => html`<div style="flex:1;background:${v > 0.6 ? '#f44' : v > 0.4 ? '#fa0' : '#4a4'};height:${v * 100}%;min-height:2px"></div>`)}</div>
            </div>
            <button class="btn" style="margin-top:8px" @click=${() => { this._stmRunMonteCarloSimulation(); }}>Re-run Simulation</button>
          </div>
        ` : nothing}
        ${this._stmAnalyticsView === 'correlation' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Cross-Metric Correlation Matrix</h4>
            <table style="width:100%;border-collapse:collapse;font-size:11px">
              <thead><tr><th style="color:#888"></th>${labels.map(l => html`<th style="color:#aaa;padding:2px 4px">${l}</th>`)}</tr></thead>
              <tbody>${matrix.map((row, i) => html`
                <tr><td style="color:#aaa;padding:2px 4px">${labels[i]}</td>
                ${row.map((v, j) => html`<td style="text-align:center;padding:2px 4px;background:rgba(${v > 0.5 ? '255,0,0' : v < -0.5 ? '0,0,255' : '128,128,128'},${Math.abs(v) * 0.6})">${v.toFixed(2)}</td>`)}</tr>
              `)}</tbody>
            </table>
          </div>
        ` : nothing}
        ${this._stmAnalyticsView === 'outliers' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Statistical Outlier Detection</h4>
            ${['zscore', 'iqr'].map(method => {
              const data = this._stmGenerateMockTimeSeries(1, 30)[0];
              const outliers = method === 'zscore' ? this._stmDetectOutliersZScore(data) : this._stmDetectOutliersIQR(data);
              return html`<div style="margin-bottom:8px">
                <div style="color:#aaa;font-size:12px">${method === 'zscore' ? 'Z-Score Method' : 'IQR Method'}: ${outliers.length} outliers detected</div>
                <div style="display:flex;gap:1px;height:30px;align-items:flex-end">${data.map((v, i) => html`<div style="flex:1;background:${outliers.includes(i) ? '#f44' : '#3a3d4a'};height:${v}%;min-height:1px"></div>`)}</div>
              </div>`;
            })}
          </div>
        ` : nothing}
        ${this._stmAnalyticsView === 'trend' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Trend Decomposition</h4>
            ${['Trend', 'Seasonal', 'Residual'].map((comp, ci) => html`
              <div style="margin-bottom:8px">
                <div style="color:#aaa;font-size:12px">${comp}</div>
                <div style="display:flex;gap:1px;height:25px;align-items:center">${this._stmDecomposeTrend(this._stmGenerateMockTimeSeries(1, 24)[0]).map(p => {
                  const val = [p.trend, p.seasonal * 500, p.residual][ci];
                  return html`<div style="flex:1;background:${ci === 0 ? '#4a9' : ci === 1 ? '#a4a' : '#aa4'};height:${Math.abs(val) * 50}%;min-height:1px"></div>`;
                })}</div>
              </div>
            `)}
          </div>
        ` : nothing}
        ${this._stmAnalyticsView === 'predictive' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Predictive Scoring with Confidence Intervals</h4>
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
              <label style="color:#888;font-size:12px">Confidence:</label>
              <select .value=${String(this._stmConfidenceLevel)} @change=${(e: any) => { this._stmConfidenceLevel = Number(e.target.value); }}>
                <option value="90">90%</option><option value="95">95%</option><option value="99">99%</option>
              </select>
            </div>
            ${['Risk Score', 'Compliance', 'Threat Index'].map(label => {
              const data = this._stmGenerateMockTimeSeries(1, 20)[0];
              const pred = this._stmPredictiveScoreWithCI(data);
              return html`<div style="margin-bottom:6px">
                <span style="color:#aaa;font-size:12px">${label}:</span>
                <span style="color:#e0e0e0;font-weight:bold">${pred.score.toFixed(2)}</span>
                <span style="color:#888;font-size:11px">[${pred.low.toFixed(2)}, ${pred.high.toFixed(2)}]</span>
              </div>`;
            })}
          </div>
        ` : nothing}
      </div>
    `;
  }

  // ========== Section B: Incident Response Coordination ==========
  @state() private _stmWarRoomActive: boolean = false;
  @state() private _stmWarRoomParticipants: string[] = ['SOC Lead', 'IR Manager', 'CISO', 'Legal', 'PR'];
  @state() private _stmIncidentSeverity: string = 'P3';
  @state() private _stmEscalationLevel: number = 0;
  @state() private _stmCommTemplate: string = 'initial';
  @state() private _stmLessonsLearned: string = '';
  @state() private _stmPostIncidentAnswers: Record<string, string> = {};
  @state() private _stmWarRoomMessages: {sender:string;time:string;text:string}[] = [];

  private _stmGetSeverityMatrix(): {severity:string;responseTime:string;escalation:string;notify:string}[] {
    return [
      { severity: 'P1 - Critical', responseTime: '15 min', escalation: 'CISO + CEO + Legal', notify: 'All stakeholders immediately' },
      { severity: 'P2 - High', responseTime: '30 min', escalation: 'CISO + IR Manager', notify: 'Security team + affected dept heads' },
      { severity: 'P3 - Medium', responseTime: '2 hours', escalation: 'IR Manager', notify: 'Security team' },
      { severity: 'P4 - Low', responseTime: '24 hours', escalation: 'SOC Lead', notify: 'Ticket created' },
    ];
  }

  private _stmGetCommunicationTemplates(): {key:string;subject:string;body:string}[] {
    return [
      { key: 'initial', subject: 'Security Incident Notification', body: 'We are investigating a potential security incident. The security team has been activated and is assessing the scope. We will provide updates every 30 minutes. Please do not share this information externally.' },
      { key: 'escalation', subject: 'Incident Escalation - Action Required', body: 'The incident has been escalated to P1 severity. Additional resources have been engaged. All non-essential access to affected systems has been suspended pending investigation.' },
      { key: 'contained', subject: 'Incident Containment Update', body: 'The incident has been contained. Affected systems have been isolated. Forensic analysis is ongoing. We will provide a detailed timeline within 24 hours.' },
      { key: 'resolved', subject: 'Incident Resolution Notification', body: 'The incident has been fully resolved. Root cause analysis is complete. Remediation actions have been implemented. A post-incident review has been scheduled.' },
      { key: 'external', subject: 'Security Advisory', body: 'We have identified and resolved a security matter. There is no evidence of customer data impact. We are working with relevant authorities and will provide updates as appropriate.' },
    ];
  }

  private _stmGetStakeholderMatrix(): {role:string;notifyP1:boolean;notifyP2:boolean;notifyP3:boolean;channel:string}[] {
    return [
      { role: 'CISO', notifyP1: true, notifyP2: true, notifyP3: false, channel: 'Direct message + Phone' },
      { role: 'CEO', notifyP1: true, notifyP2: false, notifyP3: false, channel: 'Direct message + Phone' },
      { role: 'Legal Counsel', notifyP1: true, notifyP2: true, notifyP3: false, channel: 'Email + Phone' },
      { role: 'PR/Communications', notifyP1: true, notifyP2: false, notifyP3: false, channel: 'Email' },
      { role: 'IT Operations', notifyP1: true, notifyP2: true, notifyP3: true, channel: 'Slack + Email' },
      { role: 'Affected Dept Heads', notifyP1: true, notifyP2: true, notifyP3: true, channel: 'Email' },
      { role: 'Board of Directors', notifyP1: true, notifyP2: false, notifyP3: false, channel: 'Briefed by CEO' },
    ];
  }

  private _stmGetPostIncidentQuestions(): {id:string;question:string;type:string;options:string[]}[] {
    return [
      { id: 'q1', question: 'What was the initial detection method?', type: 'select', options: ['SIEM Alert', 'User Report', 'Threat Intel Feed', 'Automated Scan', 'Third-party Notification'] },
      { id: 'q2', question: 'How long was the dwell time?', type: 'select', options: ['< 1 hour', '1-24 hours', '1-7 days', '7-30 days', '> 30 days'] },
      { id: 'q3', question: 'Was the incident response plan followed?', type: 'select', options: ['Fully', 'Partially', 'Deviated significantly', 'No plan existed'] },
      { id: 'q4', question: 'What was the root cause category?', type: 'select', options: ['Misconfiguration', 'Unpatched Vulnerability', 'Social Engineering', 'Insider Threat', 'Zero-day Exploit', 'Supply Chain'] },
      { id: 'q5', question: 'What improvements are needed?', type: 'text', options: [] },
    ];
  }

  private _stmToggleWarRoom(): void {
    this._stmWarRoomActive = !this._stmWarRoomActive;
    if (this._stmWarRoomActive) {
      this._stmWarRoomMessages = [
        { sender: 'System', time: new Date().toLocaleTimeString(), text: 'War room activated. All participants notified.' },
        { sender: 'SOC Lead', time: new Date().toLocaleTimeString(), text: 'Acknowledged. Investigating initial indicators.' },
      ];
    }
  }

  private _stmSendWarRoomMessage(text: string): void {
    this._stmWarRoomMessages = [...this._stmWarRoomMessages, {
      sender: 'You', time: new Date().toLocaleTimeString(), text
    }];
  }

  private _stmEscalateIncident(): void {
    const levels = ['P4', 'P3', 'P2', 'P1'];
    const idx = levels.indexOf(this._stmIncidentSeverity);
    if (idx < levels.length - 1) {
      this._stmIncidentSeverity = levels[idx + 1];
      this._stmEscalationLevel = idx + 1;
    }
  }

  private _stmRenderIncidentCoordination(): any {
    const templates = this._stmGetCommunicationTemplates();
    const currentTemplate = templates.find(t => t.key === this._stmCommTemplate) || templates[0];
    const questions = this._stmGetPostIncidentQuestions();
    const severityMatrix = this._stmGetSeverityMatrix();
    const stakeholders = this._stmGetStakeholderMatrix();
    return html`
      <div class="incident-coordination" style="padding:12px">
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <button class="tab ${this._stmWarRoomActive ? 'active' : ''}" @click=${() => { this._stmToggleWarRoom(); }}>War Room ${this._stmWarRoomActive ? '(Active)' : ''}</button>
          <button class="tab" @click=${() => { this._stmEscalateIncident(); }}>Escalate (${this._stmIncidentSeverity})</button>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Severity Escalation Matrix</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Severity</th><th style="color:#888">Response Time</th><th style="color:#888">Escalation</th><th style="color:#888">Notification</th></tr></thead>
            <tbody>${severityMatrix.map(r => html`
              <tr style="${r.severity.startsWith(this._stmIncidentSeverity) ? 'background:rgba(255,68,68,0.15)' : ''}">
                <td style="padding:4px;color:${r.severity.includes('P1') ? '#f44' : r.severity.includes('P2') ? '#fa0' : '#aaa'}">${r.severity}</td>
                <td style="padding:4px;text-align:center;color:#ddd">${r.responseTime}</td>
                <td style="padding:4px;text-align:center;color:#ddd">${r.escalation}</td>
                <td style="padding:4px;text-align:center;color:#888;font-size:10px">${r.notify}</td>
              </tr>
            `)}</tbody>
          </table>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Stakeholder Notification Matrix</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Role</th><th style="color:#888">P1</th><th style="color:#888">P2</th><th style="color:#888">P3</th><th style="color:#888">Channel</th></tr></thead>
            <tbody>${stakeholders.map(s => html`
              <tr>
                <td style="padding:4px;color:#ddd">${s.role}</td>
                <td style="padding:4px;text-align:center">${s.notifyP1 ? html`<span style="color:#4f4">YES</span>` : html`<span style="color:#666">no</span>`}</td>
                <td style="padding:4px;text-align:center">${s.notifyP2 ? html`<span style="color:#4f4">YES</span>` : html`<span style="color:#666">no</span>`}</td>
                <td style="padding:4px;text-align:center">${s.notifyP3 ? html`<span style="color:#4f4">YES</span>` : html`<span style="color:#666">no</span>`}</td>
                <td style="padding:4px;text-align:center;color:#888">${s.channel}</td>
              </tr>
            `)}</tbody>
          </table>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Communication Templates</h4>
          <div style="display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap">
            ${templates.map(t => html`<button class="tab ${this._stmCommTemplate === t.key ? 'active' : ''}" @click=${() => { this._stmCommTemplate = t.key; }}>${t.subject.split(' - ')[0]}</button>`)}
          </div>
          <div style="background:#1a1d27;padding:8px;border-radius:4px">
            <div style="color:#4a9;font-weight:bold;margin-bottom:4px">${currentTemplate.subject}</div>
            <div style="color:#bbb;font-size:12px;line-height:1.5">${currentTemplate.body}</div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Post-Incident Review Questionnaire</h4>
          ${questions.map(q => html`
            <div style="margin-bottom:8px">
              <div style="color:#aaa;font-size:12px;margin-bottom:4px">${q.question}</div>
              ${q.type === 'select' ? html`
                <select style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px" @change=${(e: any) => { this._stmPostIncidentAnswers = {...this._stmPostIncidentAnswers, [q.id]: e.target.value}; }}>
                  <option value="">Select...</option>
                  ${q.options.map(o => html`<option value="${o}" ${this._stmPostIncidentAnswers[q.id] === o ? 'selected' : ''}>${o}</option>`)}
                </select>
              ` : html`
                <textarea style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px;min-height:40px" placeholder="Enter details..." @input=${(e: any) => { this._stmPostIncidentAnswers = {...this._stmPostIncidentAnswers, [q.id]: e.target.value}; }}></textarea>
              `}
            </div>
          `)}
          <div style="margin-top:8px">
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:4px">Lessons Learned</label>
            <textarea style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px;min-height:60px" .value=${this._stmLessonsLearned} @input=${(e: any) => { this._stmLessonsLearned = e.target.value; }}></textarea>
          </div>
        </div>
      </div>
    `;
  }

  // ========== Section C: Security Metrics Correlation ==========
  @state() private _stmMetricData: Record<string, number[]> = {};
  @state() private _stmCompositeScore: number = 72;
  @state() private _stmMetricAlerts: string[] = [];
  @state() private _stmLeadingIndicators: string[] = ['Phishing Click Rate', 'Patch Compliance', 'Training Completion', 'Access Review Age'];
  @state() private _stmLaggingIndicators: string[] = ['Incident Count', 'MTTR', 'Data Breach Cost', 'Compliance Failures'];
  @state() private _stmExecutiveSummary: string = '';

  private _stmInitializeMetricData(): void {
    const metrics = ['Vulnerability Count', 'Incident Rate', 'Patch Coverage', 'Training Score', 'Compliance Pct', 'Access Anomalies'];
    metrics.forEach(m => {
      this._stmMetricData[m] = this._stmGenerateMockTimeSeries(1, 30)[0];
    });
  }

  private _stmCalculateCompositeScore(): number {
    const weights: Record<string, number> = {
      'Vulnerability Count': -0.2, 'Incident Rate': -0.25, 'Patch Coverage': 0.2,
      'Training Score': 0.15, 'Compliance Pct': 0.15, 'Access Anomalies': -0.05
    };
    let score = 75;
    for (const [metric, weight] of Object.entries(weights)) {
      const data = this._stmMetricData[metric];
      if (data && data.length > 0) {
        const recent = data.slice(-7);
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        score += (avg - 50) * weight;
      }
    }
    this._stmCompositeScore = Math.max(0, Math.min(100, score));
    return this._stmCompositeScore;
  }

  private _stmDetectMetricAnomalies(): string[] {
    const alerts: string[] = [];
    for (const [metric, data] of Object.entries(this._stmMetricData)) {
      if (!data || data.length < 10) continue;
      const outliers = this._stmDetectOutliersZScore(data);
      if (outliers.length > 0) {
        alerts.push(metric + ': ' + outliers.length + ' anomalous data points detected in last ' + data.length + ' periods');
      }
      const last = data[data.length - 1];
      const prev = data[data.length - 2];
      if (Math.abs(last - prev) / (Math.abs(prev) || 1) > 0.5) {
        alerts.push(metric + ': ' + (last > prev ? 'Sudden increase' : 'Sudden decrease') + ' of ' + (Math.abs(last - prev) / (Math.abs(prev) || 1) * 100).toFixed(0) + '%');
      }
    }
    this._stmMetricAlerts = alerts;
    return alerts;
  }

  private _stmGenerateExecutiveSummary(): string {
    const score = this._stmCalculateCompositeScore();
    const alerts = this._stmDetectMetricAnomalies();
    const scoreTrend = score > 80 ? 'improving' : score > 60 ? 'stable' : 'declining';
    let summary = 'Security Posture Score: ' + score.toFixed(0) + '/100 (' + scoreTrend + '). ';
    summary += 'Leading indicators show ' + (this._stmLeadingIndicators.length > 2 ? 'generally positive' : 'mixed') + ' trends. ';
    if (alerts.length > 0) {
      summary += 'Active alerts: ' + alerts.length + '. Key concerns: ' + alerts.slice(0, 3).join('; ') + '. ';
    } else {
      summary += 'No critical metric anomalies detected. ';
    }
    summary += 'Recommendation: ' + (score > 80 ? 'Maintain current security posture and continue monitoring.' : score > 60 ? 'Focus on patch management and training completion rates.' : 'Immediate attention required for vulnerability remediation and incident response readiness.');
    this._stmExecutiveSummary = summary;
    return summary;
  }

  private _stmRenderMetricsCorrelation(): any {
    if (Object.keys(this._stmMetricData).length === 0) this._stmInitializeMetricData();
    const score = this._stmCalculateCompositeScore();
    const alerts = this._stmDetectMetricAnomalies();
    const metricNames = Object.keys(this._stmMetricData);
    const corrMatrix = metricNames.map((m1, i) =>
      metricNames.map((m2, j) => this._stmPearsonCorrelation(this._stmMetricData[m1] || [], this._stmMetricData[m2] || []))
    );
    const scoreColor = score > 80 ? '#4f4' : score > 60 ? '#fa0' : '#f44';
    return html`
      <div class="metrics-correlation" style="padding:12px">
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Security Posture Composite Score</h4>
          <div style="display:flex;align-items:center;gap:16px">
            <div style="font-size:48px;font-weight:bold;color:${scoreColor}">${score.toFixed(0)}</div>
            <div style="flex:1">
              <div style="background:#1a1d27;border-radius:4px;height:16px;overflow:hidden">
                <div style="height:100%;width:${score}%;background:${scoreColor};border-radius:4px;transition:width 0.5s"></div>
              </div>
              <div style="display:flex;justify-content:space-between;color:#888;font-size:10px;margin-top:2px">
                <span>0 - Critical</span><span>50 - Fair</span><span>100 - Excellent</span>
              </div>
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Leading vs Lagging Indicators</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div>
              <div style="color:#4a9;font-size:12px;font-weight:bold;margin-bottom:4px">Leading (Predictive)</div>
              ${this._stmLeadingIndicators.map(ind => html`<div style="color:#aaa;font-size:11px;padding:2px 0">- ${ind}</div>`)}
            </div>
            <div>
              <div style="color:#a4a;font-size:12px;font-weight:bold;margin-bottom:4px">Lagging (Reactive)</div>
              ${this._stmLaggingIndicators.map(ind => html`<div style="color:#aaa;font-size:11px;padding:2px 0">- ${ind}</div>`)}
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Cross-Metric Correlation (6x6)</h4>
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead><tr><th style="color:#666"></th>${metricNames.map(m => html`<th style="color:#888;padding:1px 2px;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.split(' ')[0]}</th>`)}</tr></thead>
            <tbody>${corrMatrix.map((row, i) => html`
              <tr><td style="color:#888;padding:1px 2px;font-size:9px">${metricNames[i].split(' ')[0]}</td>
              ${row.map((v, j) => html`<td style="text-align:center;padding:1px;background:rgba(${v > 0.3 ? '0,200,100' : v < -0.3 ? '200,50,50' : '100,100,100'},${Math.abs(v) * 0.8});font-size:9px">${v.toFixed(1)}</td>`)}</tr>
            `)}</tbody>
          </table>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Metric Anomaly Alerts (${alerts.length})</h4>
          ${alerts.length === 0 ? html`<div style="color:#4f4;font-size:12px">No anomalies detected</div>` : html`
            ${alerts.map(a => html`<div style="color:#fa0;font-size:11px;padding:2px 0;border-bottom:1px solid #2a2d3a">Warning: ${a}</div>`)}
          `}
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Executive Summary</h4>
          <div style="background:#1a1d27;padding:8px;border-radius:4px;color:#bbb;font-size:12px;line-height:1.6">${this._stmGenerateExecutiveSummary()}</div>
          <button class="btn" style="margin-top:8px;font-size:11px" @click=${() => { this._stmGenerateExecutiveSummary(); }}>Regenerate Summary</button>
        </div>
      </div>
    `;
  }

  // ========== Section D: API Gateway & Rate Limiting ==========
  @state() private _stmApiEndpoints: {id:string;path:string;method:string;status:string;latency:number;rateLimit:number}[] = [];
  @state() private _stmRateLimitPolicy: {endpoint:string;requestsPerMin:number;burstLimit:number;windowSec:number}[] = [];
  @state() private _stmApiKeys: {id:string;name:string;created:string;expires:string;status:string;lastUsed:string}[] = [];
  @state() private _stmWebhookStatuses: {id:string;url:string;events:string;lastDelivery:string;status:string;retryCount:number}[] = [];

  private _stmInitializeApiData(): void {
    this._stmApiEndpoints = [
      { id: 'api-1', path: '/api/v1/security/events', method: 'POST', status: 'active', latency: 45, rateLimit: 100 },
      { id: 'api-2', path: '/api/v1/vulnerabilities', method: 'GET', status: 'active', latency: 120, rateLimit: 200 },
      { id: 'api-3', path: '/api/v1/incidents', method: 'POST', status: 'active', latency: 85, rateLimit: 50 },
      { id: 'api-4', path: '/api/v1/assets', method: 'GET', status: 'active', latency: 200, rateLimit: 150 },
      { id: 'api-5', path: '/api/v1/compliance', method: 'GET', status: 'deprecated', latency: 350, rateLimit: 30 },
    ];
    this._stmRateLimitPolicy = [
      { endpoint: '/api/v1/security/*', requestsPerMin: 100, burstLimit: 150, windowSec: 60 },
      { endpoint: '/api/v1/vulnerabilities/*', requestsPerMin: 200, burstLimit: 300, windowSec: 60 },
      { endpoint: '/api/v1/incidents/*', requestsPerMin: 50, burstLimit: 75, windowSec: 60 },
      { endpoint: '/api/v1/assets/*', requestsPerMin: 150, burstLimit: 200, windowSec: 60 },
    ];
    this._stmApiKeys = [
      { id: 'key-1', name: 'SOC Integration Key', created: '2025-01-15', expires: '2026-01-15', status: 'active', lastUsed: '2 min ago' },
      { id: 'key-2', name: 'SIEM Connector', created: '2025-03-20', expires: '2026-03-20', status: 'active', lastUsed: '5 min ago' },
      { id: 'key-3', name: 'Legacy Scanner', created: '2024-06-01', expires: '2025-06-01', status: 'expired', lastUsed: '30 days ago' },
    ];
    this._stmWebhookStatuses = [
      { id: 'wh-1', url: 'https://hooks.slack.com/services/T00/B00/xxx', events: 'incident.created', lastDelivery: '1 min ago', status: 'success', retryCount: 0 },
      { id: 'wh-2', url: 'https://api.pagerduty.com/integration/xxx', events: 'incident.escalated', lastDelivery: '5 min ago', status: 'success', retryCount: 0 },
      { id: 'wh-3', url: 'https://webhooks.jira.com/xxx', events: 'vulnerability.critical', lastDelivery: 'Failed', status: 'failed', retryCount: 3 },
    ];
  }

  private _stmUpdateRateLimit(endpoint: string, field: string, value: number): void {
    this._stmRateLimitPolicy = this._stmRateLimitPolicy.map(p =>
      p.endpoint === endpoint ? { ...p, [field]: value } : p
    );
  }

  private _stmRenderApiGateway(): any {
    if (this._stmApiEndpoints.length === 0) this._stmInitializeApiData();
    const totalRpm = this._stmApiEndpoints.reduce((a, e) => a + (Math.random() * e.rateLimit * 0.5), 0);
    const errorRate = (Math.random() * 2).toFixed(1);
    return html`
      <div class="api-gateway" style="padding:12px">
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">API Usage Analytics</h4>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:#4a9;font-size:20px;font-weight:bold">${totalRpm.toFixed(0)}</div>
              <div style="color:#888;font-size:10px">Requests/min</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${Number(errorRate) > 1 ? '#f44' : '#4f4'};font-size:20px;font-weight:bold">${errorRate}%</div>
              <div style="color:#888;font-size:10px">Error Rate</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:#e0e0e0;font-size:20px;font-weight:bold">${this._stmApiEndpoints.length}</div>
              <div style="color:#888;font-size:10px">Active Endpoints</div>
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">API Endpoints</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Endpoint</th><th style="color:#888">Method</th><th style="color:#888">Latency</th><th style="color:#888">Rate Limit</th><th style="color:#888">Status</th></tr></thead>
            <tbody>${this._stmApiEndpoints.map(e => html`
              <tr>
                <td style="padding:4px;color:#ddd;font-family:monospace;font-size:10px">${e.path}</td>
                <td style="padding:4px;text-align:center"><span style="color:${e.method === 'GET' ? '#4a9' : '#a4a'};font-size:10px">${e.method}</span></td>
                <td style="padding:4px;text-align:center;color:${e.latency > 200 ? '#fa0' : '#4f4'}">${e.latency}ms</td>
                <td style="padding:4px;text-align:center;color:#aaa">${e.rateLimit}/min</td>
                <td style="padding:4px;text-align:center"><span style="color:${e.status === 'active' ? '#4f4' : '#fa0'}">${e.status}</span></td>
              </tr>
            `)}</tbody>
          </table>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Rate Limit Policy Editor</h4>
          ${this._stmRateLimitPolicy.map(p => html`
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;padding:4px;background:#1a1d27;border-radius:4px">
              <span style="color:#ddd;font-size:10px;font-family:monospace;min-width:160px">${p.endpoint}</span>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="color:#888;font-size:10px">RPM:</span>
                <input type="number" style="background:#0d0f17;color:#ddd;border:1px solid #333;padding:2px 4px;border-radius:3px;width:60px;font-size:11px" .value=${String(p.requestsPerMin)} @change=${(e: any) => { this._stmUpdateRateLimit(p.endpoint, 'requestsPerMin', Number(e.target.value)); }} />
              </div>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="color:#888;font-size:10px">Burst:</span>
                <input type="number" style="background:#0d0f17;color:#ddd;border:1px solid #333;padding:2px 4px;border-radius:3px;width:60px;font-size:11px" .value=${String(p.burstLimit)} @change=${(e: any) => { this._stmUpdateRateLimit(p.endpoint, 'burstLimit', Number(e.target.value)); }} />
              </div>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="color:#888;font-size:10px">Window:</span>
                <span style="color:#ddd;font-size:11px">${p.windowSec}s</span>
              </div>
            </div>
          `)}
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">API Key Lifecycle</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Name</th><th style="color:#888">Created</th><th style="color:#888">Expires</th><th style="color:#888">Last Used</th><th style="color:#888">Status</th></tr></thead>
            <tbody>${this._stmApiKeys.map(k => html`
              <tr>
                <td style="padding:4px;color:#ddd">${k.name}</td>
                <td style="padding:4px;text-align:center;color:#888">${k.created}</td>
                <td style="padding:4px;text-align:center;color:${k.status === 'expired' ? '#f44' : '#888'}">${k.expires}</td>
                <td style="padding:4px;text-align:center;color:#888">${k.lastUsed}</td>
                <td style="padding:4px;text-align:center"><span style="color:${k.status === 'active' ? '#4f4' : '#f44'}">${k.status}</span></td>
              </tr>
            `)}</tbody>
          </table>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Webhook Delivery Status</h4>
          ${this._stmWebhookStatuses.map(w => html`
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;padding:6px;background:#1a1d27;border-radius:4px">
              <span style="color:${w.status === 'success' ? '#4f4' : '#f44'};font-size:16px">${w.status === 'success' ? '\u2713' : '\u2717'}</span>
              <div style="flex:1">
                <div style="color:#ddd;font-size:10px;font-family:monospace">${w.url.substring(0, 50)}...</div>
                <div style="color:#888;font-size:10px">Events: ${w.events} | Last: ${w.lastDelivery}${w.retryCount > 0 ? ' | Retries: ' + w.retryCount : ''}</div>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  // ========== Section E: Performance Optimization Panel ==========
  @state() private _stmRenderTime: number = 0;
  @state() private _stmMemoryEstimate: number = 0;
  @state() private _stmCacheHits: number = 0;
  @state() private _stmCacheMisses: number = 0;
  @state() private _stmLazyLoadingEnabled: boolean = true;
  @state() private _stmVirtualScrollEnabled: boolean = false;
  @state() private _stmPerfHistory: {timestamp:number;renderMs:number;memoryKb:number;cacheRatio:number}[] = [];
  @state() private _stmDataSetSize: number = 1000;

  private _stmMeasurePerformance(): void {
    const start = performance.now();
    const data = Array.from({ length: this._stmDataSetSize }, (_, i) => ({
      id: i, value: Math.random() * 100, category: ['A', 'B', 'C'][i % 3],
      timestamp: Date.now() - i * 60000
    }));
    const filtered = data.filter(d => d.value > 30).map(d => d.value).sort((a, b) => b - a);
    const end = performance.now();
    this._stmRenderTime = Math.round((end - start) * 100) / 100;
    this._stmMemoryEstimate = Math.round((this._stmDataSetSize * 0.15) * 100) / 100;
    this._stmCacheHits = Math.floor(Math.random() * 80 + 60);
    this._stmCacheMisses = Math.floor(Math.random() * 30 + 10);
    this._stmPerfHistory.push({
      timestamp: Date.now(), renderMs: this._stmRenderTime,
      memoryKb: this._stmMemoryEstimate,
      cacheRatio: this._stmCacheHits / (this._stmCacheHits + this._stmCacheMisses)
    });
    if (this._stmPerfHistory.length > 20) this._stmPerfHistory = this._stmPerfHistory.slice(-20);
  }

  private _stmGetCacheRatio(): number {
    const total = this._stmCacheHits + this._stmCacheMisses;
    return total > 0 ? this._stmCacheHits / total : 0;
  }

  private _stmGetPerfRecommendation(): string {
    if (this._stmRenderTime > 50) return 'High render time detected. Consider enabling virtual scrolling and reducing data set size.';
    if (this._stmGetCacheRatio() < 0.7) return 'Cache hit ratio is low. Review cache invalidation strategy and increase cache TTL.';
    if (this._stmMemoryEstimate > 500) return 'High memory usage. Enable lazy loading and consider pagination for large datasets.';
    if (this._stmDataSetSize > 500 && !this._stmVirtualScrollEnabled) return 'Large dataset detected. Enable virtual scrolling for optimal performance.';
    return 'Performance is within acceptable parameters. Continue monitoring.';
  }

  private _stmRenderPerformancePanel(): any {
    if (this._stmPerfHistory.length === 0) this._stmMeasurePerformance();
    const cacheRatio = this._stmGetCacheRatio();
    const recommendation = this._stmGetPerfRecommendation();
    const isWarning = recommendation.includes('detected') || recommendation.includes('low') || recommendation.includes('High');
    return html`
      <div class="perf-panel" style="padding:12px">
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Render Performance Metrics</h4>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${this._stmRenderTime > 50 ? '#f44' : '#4f4'};font-size:18px;font-weight:bold">${this._stmRenderTime}ms</div>
              <div style="color:#888;font-size:10px">Render Time</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${this._stmMemoryEstimate > 500 ? '#fa0' : '#4a9'};font-size:18px;font-weight:bold">${this._stmMemoryEstimate}KB</div>
              <div style="color:#888;font-size:10px">Memory Est.</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${cacheRatio > 0.8 ? '#4f4' : '#fa0'};font-size:18px;font-weight:bold">${(cacheRatio * 100).toFixed(0)}%</div>
              <div style="color:#888;font-size:10px">Cache Hit Ratio</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:#e0e0e0;font-size:18px;font-weight:bold">${this._stmDataSetSize}</div>
              <div style="color:#888;font-size:10px">Dataset Size</div>
            </div>
          </div>
          <div style="margin-top:8px">
            <div style="display:flex;gap:8px;align-items:center">
              <label style="color:#888;font-size:12px">Dataset size:</label>
              <input type="range" min="100" max="10000" step="100" .value=${String(this._stmDataSetSize)} @input=${(e: any) => { this._stmDataSetSize = Number(e.target.value); }} style="flex:1" />
              <button class="btn" style="font-size:11px" @click=${() => { this._stmMeasurePerformance(); }}>Benchmark</button>
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Optimization Controls</h4>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;color:#ddd;font-size:12px;cursor:pointer">
              <input type="checkbox" .checked=${this._stmLazyLoadingEnabled} @change=${(e: any) => { this._stmLazyLoadingEnabled = e.target.checked; }} />
              Lazy Loading
            </label>
            <label style="display:flex;align-items:center;gap:6px;color:#ddd;font-size:12px;cursor:pointer">
              <input type="checkbox" .checked=${this._stmVirtualScrollEnabled} @change=${(e: any) => { this._stmVirtualScrollEnabled = e.target.checked; }} />
              Virtual Scrolling
            </label>
          </div>
          <div style="margin-top:8px;color:${isWarning ? '#fa0' : '#4f4'};font-size:11px;padding:6px;background:${isWarning ? 'rgba(255,170,0,0.1)' : 'rgba(0,255,0,0.05)'};border-radius:4px">
            ${recommendation}
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Cache Statistics</h4>
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:8px">
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;color:#888;font-size:10px;margin-bottom:2px">
                <span>Hits: ${this._stmCacheHits}</span><span>Misses: ${this._stmCacheMisses}</span>
              </div>
              <div style="background:#1a1d27;border-radius:4px;height:10px;overflow:hidden;display:flex">
                <div style="height:100%;width:${(cacheRatio * 100)}%;background:#4f4"></div>
                <div style="height:100%;width:${((1 - cacheRatio) * 100)}%;background:#f44"></div>
              </div>
            </div>
            <div style="color:#ddd;font-size:14px;font-weight:bold">${(cacheRatio * 100).toFixed(0)}%</div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Performance History</h4>
          <div style="display:flex;height:40px;align-items:flex-end;gap:1px">
            ${this._stmPerfHistory.slice(-15).map(h => html`
              <div style="flex:1;background:${h.renderMs > 50 ? '#f44' : '#4a4'};height:${Math.min(100, h.renderMs * 2)}%;min-height:2px" title="${h.renderMs}ms"></div>
            `)}
          </div>
          <div style="display:flex;justify-content:space-between;color:#666;font-size:9px;margin-top:2px">
            <span>Render time (ms) - last 15 benchmarks</span>
          </div>
        </div>
      </div>
    `;
  }
// ===== SECURITY POSTURE TREND ANALYSIS (R22) =====
  private _r22PostureTrends = [
    { month: '2025-05', score: 72, network: 78, endpoint: 65, cloud: 70, identity: 80, data: 68, app: 71 },
    { month: '2025-06', score: 74, network: 79, endpoint: 67, cloud: 72, identity: 82, data: 70, app: 73 },
    { month: '2025-07', score: 73, network: 80, endpoint: 66, cloud: 73, identity: 81, data: 69, app: 72 },
    { month: '2025-08', score: 76, network: 81, endpoint: 69, cloud: 75, identity: 83, data: 72, app: 74 },
    { month: '2025-09', score: 78, network: 82, endpoint: 71, cloud: 76, identity: 85, data: 74, app: 76 },
    { month: '2025-10', score: 77, network: 83, endpoint: 72, cloud: 78, identity: 84, data: 73, app: 75 },
    { month: '2025-11', score: 80, network: 84, endpoint: 74, cloud: 80, identity: 86, data: 76, app: 78 },
    { month: '2025-12', score: 82, network: 85, endpoint: 76, cloud: 82, identity: 88, data: 78, app: 80 },
    { month: '2026-01', score: 81, network: 86, endpoint: 77, cloud: 83, identity: 87, data: 77, app: 79 },
    { month: '2026-02', score: 83, network: 87, endpoint: 79, cloud: 85, identity: 89, data: 79, app: 81 },
    { month: '2026-03', score: 85, network: 88, endpoint: 81, cloud: 87, identity: 90, data: 81, app: 83 },
    { month: '2026-04', score: 86, network: 89, endpoint: 82, cloud: 88, identity: 91, data: 83, app: 84 },
  ];

  private _r22PosturePrediction = [
    { month: '2026-05', predicted: 88, lower: 85, upper: 91, confidence: 0.82 },
    { month: '2026-06', predicted: 89, lower: 86, upper: 92, confidence: 0.78 },
    { month: '2026-07', predicted: 90, lower: 86, upper: 94, confidence: 0.73 },
  ];

  private _r22IndustryPercentile = { current: 78, peer: 65, industry: 72, top: 92, sector: 81 };

  private _r22QoQDeltas = [
    { quarter: 'Q1 2026', overall: 5, network: 3, endpoint: 5, cloud: 5, identity: 3, data: 4, app: 4 },
    { quarter: 'Q4 2025', overall: 4, network: 3, endpoint: 4, cloud: 4, identity: 2, data: 4, app: 3 },
    { quarter: 'Q3 2025', overall: 3, network: 2, endpoint: 3, cloud: 3, identity: 2, data: 2, app: 2 },
  ];

  private _r22PostureRecommendations = [
    { id: 'rec-1', priority: 'high', domain: 'Endpoint', title: 'Deploy EDR to remaining 12% of endpoints', impact: 8, effort: 3, status: 'open' },
    { id: 'rec-2', priority: 'high', domain: 'Data', title: 'Implement automated DLP policies for PII', impact: 7, effort: 4, status: 'in-progress' },
    { id: 'rec-3', priority: 'medium', domain: 'Cloud', title: 'Enable CSPM for multi-cloud environment', impact: 6, effort: 3, status: 'open' },
    { id: 'rec-4', priority: 'medium', domain: 'App', title: 'Integrate SAST into CI/CD pipelines', impact: 7, effort: 5, status: 'planned' },
    { id: 'rec-5', priority: 'low', domain: 'Identity', title: 'Migrate remaining legacy accounts to SSO', impact: 4, effort: 6, status: 'planned' },
  ];

  private _r22RenderPostureTrend(): ReturnType<typeof html> {
    const latest = this._r22PostureTrends[this._r22PostureTrends.length - 1];
    const prev = this._r22PostureTrends[this._r22PostureTrends.length - 2];
    const delta = latest.score - prev.score;
    const barW = (v: number) => Math.max(2, v * 0.6);
    const dims = ['network', 'endpoint', 'cloud', 'identity', 'data', 'app'] as const;
    const dimLabels: Record<string, string> = { network: 'Network', endpoint: 'Endpoint', cloud: 'Cloud', identity: 'Identity', data: 'Data', app: 'Application' };
    return html`
      <div class="r22-posture-trend" style="background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;padding:16px;margin:12px 0;">
        <h4 style="color:#00d4ff;margin:0 0 12px;font-size:14px;">Security Posture Trend Analysis</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px;">
              <span style="font-size:32px;font-weight:bold;color:#00ff88;">${latest.score}</span>
              <span style="color:${delta >= 0 ? '#00ff88' : '#ff4444'};font-size:13px;">${delta >= 0 ? '+' : ''}${delta} pts</span>
              <span style="color:#8899aa;font-size:11px;">vs last month</span>
            </div>
            <div style="color:#8899aa;font-size:11px;margin-bottom:6px;">Industry Percentile: <span style="color:#00d4ff;font-weight:bold;">${this._r22IndustryPercentile.current}%</span></div>
            ${this._r22PosturePrediction.map(p => html`
              <div style="font-size:11px;color:#667788;margin:2px 0;">
                ${p.month}: ${p.predicted} (CI: ${p.lower}-${p.upper}, conf: ${Math.round(p.confidence * 100)}%)
              </div>
            `)}
          </div>
          <div>
            ${dims.map(d => html`
              <div style="margin:3px 0;">
                <span style="color:#8899aa;font-size:11px;display:inline-block;width:70px;">${dimLabels[d]}</span>
                <div style="display:inline-block;width:120px;height:8px;background:#1a2a3a;border-radius:4px;vertical-align:middle;">
                  <div style="width:${barW(latest[d])}%;height:100%;background:${latest[d] >= 85 ? '#00ff88' : latest[d] >= 75 ? '#ffaa00' : '#ff4444'};border-radius:4px;"></div>
                </div>
                <span style="color:#ccc;font-size:11px;margin-left:6px;">${latest[d]}</span>
              </div>
            `)}
          </div>
        </div>
        <div style="margin-top:10px;">
          <span style="color:#8899aa;font-size:11px;">12-Month Trend:</span>
          <div style="display:flex;align-items:flex-end;gap:2px;height:40px;margin-top:4px;">
            ${this._r22PostureTrends.map(t => html`
              <div style="flex:1;height:${t.score * 0.4}px;background:${t.score >= 85 ? '#00ff88' : t.score >= 75 ? '#ffaa00' : '#ff6644'};border-radius:2px 2px 0 0;min-width:4px;" title="${t.month}: ${t.score}"></div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  private _r22GetPostureSummary(): {improving:string[];stable:string[];declining:string[]} {
    const dims = ['network', 'endpoint', 'cloud', 'identity', 'data', 'app'] as const;
    const trends = this._r22PostureTrends;
    const last3 = trends.slice(-3);
    return {
      improving: dims.filter(d => last3[2][d] > last3[0][d] + 1),
      stable: dims.filter(d => Math.abs(last3[2][d] - last3[0][d]) <= 1),
      declining: dims.filter(d => last3[2][d] < last3[0][d] - 1),
    };
  }
// ===== THREAT ACTOR PROFILE DATABASE (R22) =====
  private _r22ThreatActors = [
    { id: 'TA-001', name: 'APT-Storm', country: 'CN', sophistication: 'advanced', motivation: 'espionage', firstSeen: '2019-03', lastSeen: '2026-04', campaigns: 14, targets: ['Technology','Defense','Healthcare'], tools: ['Cobalt Strike','Custom Implant','Zero-day exploits'], confidence: 92, relationship: ['TA-005'] },
    { id: 'TA-002', name: 'DarkVault', country: 'RU', sophistication: 'advanced', motivation: 'financial', firstSeen: '2020-06', lastSeen: '2026-03', campaigns: 22, targets: ['Finance','Healthcare','Government'], tools: ['Ryuk','TrickBot','Emotet'], confidence: 88, relationship: ['TA-007'] },
    { id: 'TA-003', name: 'ShadowSpider', country: 'Unknown', sophistication: 'moderate', motivation: 'sabotage', firstSeen: '2021-01', lastSeen: '2026-04', campaigns: 8, targets: ['Energy','Telecom','Critical Infrastructure'], tools: ['Industroyer','Custom wipers'], confidence: 75, relationship: [] },
    { id: 'TA-004', name: 'CyberNomad', country: 'KP', sophistication: 'advanced', motivation: 'financial', firstSeen: '2018-09', lastSeen: '2026-02', campaigns: 31, targets: ['Finance','Cryptocurrency','Defense'], tools: ['WannaCry variants','AppleJeus','FastCash'], confidence: 95, relationship: [] },
    { id: 'TA-005', name: 'PhantomOwl', country: 'IR', sophistication: 'moderate', motivation: 'espionage', firstSeen: '2020-11', lastSeen: '2026-04', campaigns: 11, targets: ['Government','Academia','Media'], tools: ['PowerShell backdoors','Custom RAT'], confidence: 82, relationship: ['TA-001'] },
    { id: 'TA-006', name: 'IronGhost', country: 'CN', sophistication: 'advanced', motivation: 'espionage', firstSeen: '2017-05', lastSeen: '2026-01', campaigns: 19, targets: ['Technology','Manufacturing','Aerospace'], tools: ['Sourface','PlugX','HiatusRAT'], confidence: 90, relationship: ['TA-001','TA-008'] },
    { id: 'TA-007', name: 'BitterBug', country: 'RU', sophistication: 'high', motivation: 'espionage', firstSeen: '2019-08', lastSeen: '2026-03', campaigns: 16, targets: ['Government','Military','Think Tanks'], tools: ['Sofacy','X-Agent','Zebrocy'], confidence: 87, relationship: ['TA-002'] },
    { id: 'TA-008', name: 'NeonTide', country: 'CN', sophistication: 'high', motivation: 'supply-chain', firstSeen: '2021-06', lastSeen: '2026-04', campaigns: 7, targets: ['Software','Technology','Telecom'], tools: ['Supply chain implants','Backdoored SDKs'], confidence: 79, relationship: ['TA-006'] },
  ];

  private _r22CampaignTimeline = [
    { actorId: 'TA-001', year: 2024, campaigns: [{ name: 'Op Thunder', start: '2024-02', end: '2024-06', targets: 3, success: true }, { name: 'Op Silent', start: '2024-09', end: '2025-01', targets: 5, success: true }] },
    { actorId: 'TA-002', year: 2024, campaigns: [{ name: 'Op GoldRush', start: '2024-01', end: '2024-04', targets: 8, success: true }, { name: 'Op DarkNet', start: '2024-07', end: '2024-12', targets: 12, success: false }] },
    { actorId: 'TA-004', year: 2024, campaigns: [{ name: 'Op CryptoStorm', start: '2024-03', end: '2024-08', targets: 15, success: true }] },
    { actorId: 'TA-003', year: 2025, campaigns: [{ name: 'Op Blackout', start: '2025-01', end: '2025-05', targets: 4, success: true }, { name: 'Op Cascade', start: '2025-09', end: '2026-01', targets: 6, success: false }] },
  ];

  private _r22TargetDistribution: Record<string, number> = { Technology: 28, Finance: 22, Healthcare: 18, Government: 20, Defense: 15, Energy: 10, Telecom: 12, Manufacturing: 9, Critical: 8, Other: 14 };

  private _r22RenderThreatActors(): ReturnType<typeof html> {
    const getMotivationColor = (m: string) => m === 'espionage' ? '#ff6b6b' : m === 'financial' ? '#ffd93d' : m === 'sabotage' ? '#ff4444' : '#6bcb77';
    return html`
      <div class="r22-threat-actors" style="background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;padding:16px;margin:12px 0;">
        <h4 style="color:#ff6b6b;margin:0 0 12px;font-size:14px;">Threat Actor Profile Database</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          ${this._r22ThreatActors.slice(0, 6).map(a => html`
            <div style="background:#0d1f35;border:1px solid #1a3050;border-radius:6px;padding:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#fff;font-weight:bold;font-size:12px;">${a.name}</span>
                <span style="background:${getMotivationColor(a.motivation)};color:#000;padding:1px 6px;border-radius:3px;font-size:10px;">${a.motivation}</span>
              </div>
              <div style="font-size:10px;color:#8899aa;margin-top:4px;">
                ${a.country} | ${a.sophistication} | ${a.campaigns} campaigns | Conf: ${a.confidence}%
              </div>
              <div style="font-size:10px;color:#667788;margin-top:2px;">Targets: ${a.targets.join(', ')}</div>
              <div style="font-size:10px;color:#556677;margin-top:2px;">Last seen: ${a.lastSeen}</div>
            </div>
          `)}
        </div>
        <div style="margin-top:10px;">
          <span style="color:#8899aa;font-size:11px;">Target Industry Distribution:</span>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">
            ${Object.entries(this._r22TargetDistribution).sort((a, b) => b[1] - a[1]).map(([ind, cnt]) => html`
              <span style="background:#1a2a3a;color:#aaccee;padding:2px 8px;border-radius:4px;font-size:10px;">${ind}: ${cnt}</span>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  private _r22GetActorRelationships(): {from:string;to:string;type:string}[] {
    const rels: {from:string;to:string;type:string}[] = [];
    this._r22ThreatActors.forEach(a => {
      a.relationship.forEach(r => rels.push({ from: a.id, to: r, type: 'affiliated' }));
    });
    return rels;
  }

  private _r22DetectCampaignOverlap(): {actor1:string;actor2:string;overlap:number;sharedTargets:string[]}[] {
    const overlaps: {actor1:string;actor2:string;overlap:number;sharedTargets:string[]}[] = [];
    for (let i = 0; i < this._r22ThreatActors.length; i++) {
      for (let j = i + 1; j < this._r22ThreatActors.length; j++) {
        const a = this._r22ThreatActors[i], b = this._r22ThreatActors[j];
        const shared = a.targets.filter(t => b.targets.includes(t));
        if (shared.length > 0) overlaps.push({ actor1: a.name, actor2: b.name, overlap: shared.length, sharedTargets: shared });
      }
    }
    return overlaps.sort((a, b) => b.overlap - a.overlap);
  }
// ===== SECURITY CONTROL TESTING (R22) =====
  private _r22ControlTests = [
    { id: 'CT-001', control: 'Firewall Egress Filtering', category: 'Network', status: 'pass', lastTest: '2026-04-15', tester: 'automated', duration: '2m', severity: 'high' },
    { id: 'CT-002', control: 'MFA Enforcement', category: 'Identity', status: 'pass', lastTest: '2026-04-14', tester: 'automated', duration: '1m', severity: 'critical' },
    { id: 'CT-003', control: 'Encryption at Rest', category: 'Data', status: 'conditional', lastTest: '2026-04-13', tester: 'manual', duration: '45m', severity: 'high' },
    { id: 'CT-004', control: 'Patch Management SLA', category: 'Endpoint', status: 'fail', lastTest: '2026-04-12', tester: 'automated', duration: '5m', severity: 'critical' },
    { id: 'CT-005', control: 'DLP Data Exfiltration', category: 'Data', status: 'pass', lastTest: '2026-04-11', tester: 'automated', duration: '10m', severity: 'high' },
    { id: 'CT-006', control: 'SIEM Alert Coverage', category: 'Monitoring', status: 'conditional', lastTest: '2026-04-10', tester: 'manual', duration: '2h', severity: 'medium' },
    { id: 'CT-007', control: 'Privileged Access Review', category: 'Identity', status: 'pass', lastTest: '2026-04-09', tester: 'manual', duration: '3h', severity: 'high' },
    { id: 'CT-008', control: 'Network Segmentation', category: 'Network', status: 'fail', lastTest: '2026-04-08', tester: 'automated', duration: '15m', severity: 'critical' },
    { id: 'CT-009', control: 'Backup Restoration Test', category: 'Operations', status: 'pass', lastTest: '2026-04-07', tester: 'manual', duration: '4h', severity: 'high' },
    { id: 'CT-010', control: 'Incident Response Drill', category: 'Operations', status: 'conditional', lastTest: '2026-04-06', tester: 'manual', duration: '8h', severity: 'high' },
    { id: 'CT-011', control: 'Vulnerability Scan Coverage', category: 'Endpoint', status: 'pass', lastTest: '2026-04-05', tester: 'automated', duration: '30m', severity: 'medium' },
    { id: 'CT-012', control: 'Cloud CSPM Compliance', category: 'Cloud', status: 'fail', lastTest: '2026-04-04', tester: 'automated', duration: '5m', severity: 'high' },
    { id: 'CT-013', control: 'API Authentication', category: 'Application', status: 'pass', lastTest: '2026-04-03', tester: 'automated', duration: '8m', severity: 'high' },
    { id: 'CT-014', control: 'Container Image Scanning', category: 'Cloud', status: 'conditional', lastTest: '2026-04-02', tester: 'automated', duration: '12m', severity: 'medium' },
    { id: 'CT-015', control: 'Secrets Rotation', category: 'Identity', status: 'pass', lastTest: '2026-04-01', tester: 'automated', duration: '3m', severity: 'high' },
    { id: 'CT-016', control: 'DNS Security Validation', category: 'Network', status: 'pass', lastTest: '2026-03-30', tester: 'automated', duration: '4m', severity: 'medium' },
    { id: 'CT-017', control: 'Email Gateway Filtering', category: 'Application', status: 'conditional', lastTest: '2026-03-29', tester: 'manual', duration: '1h', severity: 'high' },
    { id: 'CT-018', control: 'Zero Trust Access Policy', category: 'Identity', status: 'fail', lastTest: '2026-03-28', tester: 'manual', duration: '6h', severity: 'critical' },
    { id: 'CT-019', control: 'Database Activity Monitoring', category: 'Data', status: 'pass', lastTest: '2026-03-27', tester: 'automated', duration: '7m', severity: 'high' },
    { id: 'CT-020', control: 'Third-Party Risk Assessment', category: 'Operations', status: 'conditional', lastTest: '2026-03-25', tester: 'manual', duration: '16h', severity: 'high' },
  ];

  private _r22GetControlStats() {
    const pass = this._r22ControlTests.filter(t => t.status === 'pass').length;
    const fail = this._r22ControlTests.filter(t => t.status === 'fail').length;
    const cond = this._r22ControlTests.filter(t => t.status === 'conditional').length;
    const total = this._r22ControlTests.length;
    return { pass, fail, conditional: cond, total, passRate: Math.round(pass / total * 100) };
  }

  private _r22GetControlGaps(): {category:string;tested:number;total:number;gap:number}[] {
    const byCategory: Record<string, number[]> = {};
    this._r22ControlTests.forEach(t => {
      if (!byCategory[t.category]) byCategory[t.category] = [];
      byCategory[t.category].push(t.status === 'pass' ? 1 : 0);
    });
    const categoryTotals: Record<string, number> = { Network: 8, Identity: 7, Data: 6, Endpoint: 6, Cloud: 7, Application: 5, Monitoring: 4, Operations: 5 };
    return Object.entries(categoryTotals).map(([cat, tot]) => ({
      category: cat, tested: (byCategory[cat] || []).length, total: tot,
      gap: tot - (byCategory[cat] || []).length,
    })).sort((a, b) => b.gap - a.gap);
  }

  private _r22RenderControlTesting(): ReturnType<typeof html> {
    const stats = this._r22GetControlStats();
    const gaps = this._r22GetControlGaps();
    return html`
      <div class="r22-control-testing" style="background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;padding:16px;margin:12px 0;">
        <h4 style="color:#ffaa00;margin:0 0 12px;font-size:14px;">Security Control Testing</h4>
        <div style="display:flex;gap:12px;margin-bottom:12px;">
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:24px;font-weight:bold;color:#00ff88;">${stats.passRate}%</div>
            <div style="color:#8899aa;font-size:11px;">Pass Rate</div>
          </div>
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:24px;font-weight:bold;color:#00d4ff;">${stats.pass}/${stats.total}</div>
            <div style="color:#8899aa;font-size:11px;">Tests Passed</div>
          </div>
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:24px;font-weight:bold;color:#ff4444;">${stats.fail}</div>
            <div style="color:#8899aa;font-size:11px;">Failed</div>
          </div>
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:24px;font-weight:bold;color:#ffaa00;">${stats.conditional}</div>
            <div style="color:#8899aa;font-size:11px;">Conditional</div>
          </div>
        </div>
        <div style="font-size:11px;color:#8899aa;margin-bottom:6px;">Control Gap Analysis by Category:</div>
        ${gaps.map(g => html`
          <div style="display:flex;align-items:center;gap:8px;margin:3px 0;">
            <span style="color:#aaccee;font-size:11px;width:80px;">${g.category}</span>
            <div style="flex:1;height:8px;background:#1a2a3a;border-radius:4px;">
              <div style="width:${(g.tested / g.total) * 100}%;height:100%;background:${g.gap === 0 ? '#00ff88' : g.gap <= 2 ? '#ffaa00' : '#ff4444'};border-radius:4px;"></div>
            </div>
            <span style="color:#8899aa;font-size:10px;">${g.tested}/${g.total}</span>
          </div>
        `)}
        <div style="margin-top:8px;font-size:10px;color:#667788;">
          ${this._r22ControlTests.filter(t => t.status === 'fail').map(t => html`
            <div style="color:#ff4444;">FAIL: ${t.control} (${t.severity}) - Last: ${t.lastTest}</div>
          `)}
        </div>
      </div>
    `;
  }
// ===== DATA SOVEREIGNTY COMPLIANCE (R22) =====
  private _r22DataRegions = [
    { region: 'EU (GDPR)', status: 'compliant', dataVolume: '2.3 PB', transfers: 156, mechanisms: ['SCCs', 'BCRs', 'Adequacy'], gaps: 0, lastAudit: '2026-03' },
    { region: 'US (CCPA)', status: 'compliant', dataVolume: '4.1 PB', transfers: 312, mechanisms: ['Opt-out', 'Consent', 'Contractual'], gaps: 1, lastAudit: '2026-03' },
    { region: 'Brazil (LGPD)', status: 'partial', dataVolume: '0.8 PB', transfers: 45, mechanisms: ['SCCs', 'Consent'], gaps: 3, lastAudit: '2026-01' },
    { region: 'China (PIPL)', status: 'partial', dataVolume: '1.5 PB', transfers: 89, mechanisms: ['CAC Certification', 'Standard Contract'], gaps: 4, lastAudit: '2026-02' },
    { region: 'India (DPDP)', status: 'non-compliant', dataVolume: '0.6 PB', transfers: 23, mechanisms: [], gaps: 7, lastAudit: '2025-11' },
    { region: 'Japan (APPI)', status: 'compliant', dataVolume: '0.4 PB', transfers: 34, mechanisms: ['Adequacy', 'Consent'], gaps: 0, lastAudit: '2026-04' },
    { region: 'Canada (PIPEDA)', status: 'compliant', dataVolume: '0.3 PB', transfers: 18, mechanisms: ['Adequacy', 'SCCs'], gaps: 1, lastAudit: '2026-02' },
    { region: 'Australia (Privacy Act)', status: 'partial', dataVolume: '0.2 PB', transfers: 12, mechanisms: ['Consent'], gaps: 2, lastAudit: '2025-12' },
  ];

  private _r22CrossBorderFlows = [
    { from: 'US', to: 'EU', volume: '1.2 TB/mo', mechanism: 'SCCs', encrypted: true, pseudonymized: false, risk: 'low' },
    { from: 'US', to: 'CN', volume: '0.8 TB/mo', mechanism: 'CAC Cert', encrypted: true, pseudonymized: true, risk: 'high' },
    { from: 'EU', to: 'US', volume: '0.6 TB/mo', mechanism: 'SCCs + TEF', encrypted: true, pseudonymized: true, risk: 'medium' },
    { from: 'BR', to: 'US', volume: '0.3 TB/mo', mechanism: 'SCCs', encrypted: true, pseudonymized: false, risk: 'medium' },
    { from: 'JP', to: 'US', volume: '0.2 TB/mo', mechanism: 'Adequacy', encrypted: true, pseudonymized: false, risk: 'low' },
    { from: 'CN', to: 'US', volume: '0.5 TB/mo', mechanism: 'CAC Cert', encrypted: true, pseudonymized: true, risk: 'high' },
  ];

  private _r22RenderDataSovereignty(): ReturnType<typeof html> {
    const statusColor = (s: string) => s === 'compliant' ? '#00ff88' : s === 'partial' ? '#ffaa00' : '#ff4444';
    const totalGaps = this._r22DataRegions.reduce((sum, r) => sum + r.gaps, 0);
    return html`
      <div class="r22-data-sovereignty" style="background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;padding:16px;margin:12px 0;">
        <h4 style="color:#aa88ff;margin:0 0 12px;font-size:14px;">Data Sovereignty Compliance</h4>
        <div style="display:flex;gap:12px;margin-bottom:10px;">
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#00ff88;">${this._r22DataRegions.filter(r => r.status === 'compliant').length}/${this._r22DataRegions.length}</div>
            <div style="color:#8899aa;font-size:11px;">Regions Compliant</div>
          </div>
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#ff4444;">${totalGaps}</div>
            <div style="color:#8899aa;font-size:11px;">Total Gaps</div>
          </div>
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#ffaa00;">${this._r22CrossBorderFlows.filter(f => f.risk === 'high').length}</div>
            <div style="color:#8899aa;font-size:11px;">High-Risk Flows</div>
          </div>
        </div>
        ${this._r22DataRegions.map(r => html`
          <div style="display:flex;align-items:center;gap:8px;margin:4px 0;padding:6px;background:#0d1f35;border-radius:4px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${statusColor(r.status)};"></div>
            <span style="color:#ddd;font-size:11px;width:120px;">${r.region}</span>
            <span style="color:#8899aa;font-size:10px;">${r.dataVolume}</span>
            <span style="color:#8899aa;font-size:10px;">${r.transfers} transfers</span>
            <span style="color:${statusColor(r.status)};font-size:10px;margin-left:auto;">${r.status}${r.gaps > 0 ? ' (' + r.gaps + ' gaps)' : ''}</span>
          </div>
        `)}
      </div>
    `;
  }

  // --- Regulatory Compliance Tracker ---
  private _renderRegulatoryComplianceTracker(): TemplateResult {
    const regulations = [
      { name: 'GDPR', status: 'partial', score: 78, controls: 93, compliant: 72, partial: 15, nonCompliant: 6, lastAudit: '2026-01-15', nextAudit: '2026-07-15', owner: 'DPO Team' },
      { name: 'HIPAA', status: 'compliant', score: 92, controls: 78, compliant: 72, partial: 4, nonCompliant: 2, lastAudit: '2026-02-20', nextAudit: '2026-08-20', owner: 'Compliance' },
      { name: 'SOX', status: 'compliant', score: 88, controls: 64, compliant: 56, partial: 6, nonCompliant: 2, lastAudit: '2025-12-01', nextAudit: '2026-06-01', owner: 'Finance Sec' },
      { name: 'PCI-DSS', status: 'partial', score: 71, controls: 85, compliant: 60, partial: 18, nonCompliant: 7, lastAudit: '2026-03-10', nextAudit: '2026-09-10', owner: 'Payment Sec' },
      { name: 'ISO 27001', status: 'compliant', score: 85, controls: 114, compliant: 97, partial: 12, nonCompliant: 5, lastAudit: '2026-01-30', nextAudit: '2027-01-30', owner: 'ISMS Team' },
      { name: 'NIST CSF', status: 'partial', score: 74, controls: 108, compliant: 80, partial: 16, nonCompliant: 12, lastAudit: '2026-02-28', nextAudit: '2026-08-28', owner: 'CISO Office' },
    ];
    const controlMapping = [
      { domain: 'Access Control', gdpr: 'Art.25,32', hipaa: '164.312', sox: '404', pci: 'Req.7-8', iso: 'A.9', nist: 'PR.AC' },
      { domain: 'Data Protection', gdpr: 'Art.5,25,32', hipaa: '164.312(e)', sox: '302,404', pci: 'Req.3-4', iso: 'A.8,A.18', nist: 'PR.DS' },
      { domain: 'Incident Response', gdpr: 'Art.33,34', hipaa: '164.308(a)(6)', sox: 'N/A', pci: 'Req.12.10', iso: 'A.16', nist: 'RS.RP' },
      { domain: 'Risk Assessment', gdpr: 'Art.35', hipaa: '164.308(a)(1)', sox: '404', pci: 'Req.12.2', iso: 'A.6', nist: 'ID.RA' },
      { domain: 'Logging', gdpr: 'Art.30', hipaa: '164.312(b)', sox: '404', pci: 'Req.10', iso: 'A.12.4', nist: 'DE.CM' },
      { domain: 'Encryption', gdpr: 'Art.32', hipaa: '164.312(a)(2)(iv)', sox: 'N/A', pci: 'Req.3-4', iso: 'A.10', nist: 'PR.DS' },
      { domain: 'Third Party', gdpr: 'Art.28', hipaa: '164.308(b)', sox: '404', pci: 'Req.12.8', iso: 'A.15', nist: 'ID.SC' },
      { domain: 'Business Continuity', gdpr: 'Art.32', hipaa: '164.308(a)(7)', sox: 'N/A', pci: 'Req.12.10.1', iso: 'A.17', nist: 'PR.IP' },
    ];
    const evidenceProgress = [
      { regulation: 'GDPR', collected: 156, total: 186, pct: 84 },
      { regulation: 'HIPAA', collected: 72, total: 78, pct: 92 },
      { regulation: 'SOX', collected: 54, total: 64, pct: 84 },
      { regulation: 'PCI-DSS', collected: 58, total: 85, pct: 68 },
      { regulation: 'ISO 27001', collected: 98, total: 114, pct: 86 },
      { regulation: 'NIST CSF', collected: 76, total: 108, pct: 70 },
    ];
    const auditReadiness = regulations.map(r => ({
      name: r.name,
      score: Math.min(100, Math.round((r.compliant / r.controls) * 100 + (evidenceProgress.find(e => e.regulation === r.name)?.pct || 0) * 0.3)),
    }));
    const regChanges = [
      { regulation: 'GDPR', change: 'AI Act Alignment', impact: 'high', deadline: '2026-08-01', status: 'in-progress' },
      { regulation: 'PCI-DSS', change: 'v5.0 Requirements', impact: 'high', deadline: '2026-03-31', status: 'overdue' },
      { regulation: 'NIST CSF', change: 'CSF 2.0 Adoption', impact: 'medium', deadline: '2026-12-31', status: 'planning' },
      { regulation: 'ISO 27001', change: '2025 Amendment', impact: 'low', deadline: '2027-01-30', status: 'review' },
    ];
    return html`
      <div class="compliance-tracker">
        <h4>Regulatory Compliance Dashboard</h4>
        <div class="compliance-grid">
          <div class="comp-card full-width">
            <h5>Compliance Status by Regulation</h5>
            <div class="reg-status-grid">
              ${regulations.map(r => html`
                <div class="reg-status-item status-${r.status}">
                  <div class="reg-header">
                    <span class="reg-name">${r.name}</span>
                    <span class="reg-score">${r.score}%</span>
                  </div>
                  <div class="reg-progress-bar">
                    <div class="reg-fill compliant" style="width:${(r.compliant/r.controls)*100}%"></div>
                    <div class="reg-fill partial" style="width:${(r.partial/r.controls)*100}%"></div>
                    <div class="reg-fill non-compliant" style="width:${(r.nonCompliant/r.controls)*100}%"></div>
                  </div>
                  <div class="reg-details">
                    <span>${r.compliant} Compliant</span>
                    <span>${r.partial} Partial</span>
                    <span>${r.nonCompliant} Non-Compliant</span>
                    <span>Owner: ${r.owner}</span>
                  </div>
                  <div class="reg-audit-dates">
                    <span>Last: ${r.lastAudit}</span>
                    <span>Next: ${r.nextAudit}</span>
                  </div>
                </div>
              `)}
            </div>
          </div>
          <div class="comp-card">
            <h5>Control Mapping Matrix</h5>
            <div class="mapping-table-wrap">
              <table class="mapping-table">
                <thead><tr><th>Domain</th><th>GDPR</th><th>HIPAA</th><th>SOX</th><th>PCI</th><th>ISO</th><th>NIST</th></tr></thead>
                <tbody>
                  ${controlMapping.map(c => html`<tr>
                    <td>${c.domain}</td><td>${c.gdpr}</td><td>${c.hipaa}</td>
                    <td>${c.sox}</td><td>${c.pci}</td><td>${c.iso}</td><td>${c.nist}</td>
                  </tr>`)}
                </tbody>
              </table>
            </div>
          </div>
          <div class="comp-card">
            <h5>Evidence Collection Progress</h5>
            <div class="evidence-list">
              ${evidenceProgress.map(e => html`
                <div class="evidence-row">
                  <span class="ev-reg">${e.regulation}</span>
                  <div class="ev-bar-wrap">
                    <div class="ev-bar" style="width:${e.pct}%"></div>
                  </div>
                  <span class="ev-count">${e.collected}/${e.total} (${e.pct}%)</span>
                </div>
              `)}
            </div>
          </div>
          <div class="comp-card">
            <h5>Audit Readiness Score</h5>
            <div class="readiness-gauges">
              ${auditReadiness.map(a => html`
                <div class="readiness-item">
                  <span class="rdy-name">${a.name}</span>
                  <div class="rdy-gauge">
                    <div class="rdy-fill" style="width:${a.score}%; background:${a.score >= 85 ? '#22c55e' : a.score >= 70 ? '#f59e0b' : '#ef4444'}"></div>
                    <span class="rdy-val">${a.score}%</span>
                  </div>
                </div>
              `)}
            </div>
          </div>
          <div class="comp-card full-width">
            <h5>Regulatory Change Impact Assessment</h5>
            <div class="change-table">
              ${regChanges.map(c => html`
                <div class="change-row impact-${c.impact}">
                  <span class="ch-reg">${c.regulation}</span>
                  <span class="ch-desc">${c.change}</span>
                  <span class="ch-impact impact-badge-${c.impact}">${c.impact}</span>
                  <span class="ch-deadline">${c.deadline}</span>
                  <span class="ch-status status-${c.status}">${c.status}</span>
                </div>
              `)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _getComplianceGaps(regulation: string): string[] {
    const gaps: Record<string, string[]> = {
      GDPR: ['Data Processing Records incomplete', 'DPIA for new ML models pending', 'Cross-border transfer mechanisms need update'],
      HIPAA: ['Business Associate agreements renewal', 'PHI access logging gaps'],
      SOX: ['IT General Controls testing schedule', 'Segregation of duties review'],
      'PCI-DSS': ['Tokenization implementation', 'Network segmentation validation', 'Quarterly scan schedule gap'],
      'ISO 27001': ['Asset register completeness', 'Supplier security assessment'],
      'NIST CSF': ['Supply chain risk management', 'Recovery planning improvements'],
    };
    return gaps[regulation] || [];
  }

  private _calculateAuditReadinessScore(reg: string): number {
    const scores: Record<string, number> = { GDPR: 78, HIPAA: 92, SOX: 88, 'PCI-DSS': 71, 'ISO 27001': 85, 'NIST CSF': 74 };
    return scores[reg] || 50;
  }


  // --- Regulatory Compliance Tracker ---
  private _renderRegulatoryComplianceTracker(): TemplateResult {
    const regulations = [
      { name: 'GDPR', status: 'partial', score: 78, controls: 93, compliant: 72, partial: 15, nonCompliant: 6, lastAudit: '2026-01-15', nextAudit: '2026-07-15', owner: 'DPO Team' },
      { name: 'HIPAA', status: 'compliant', score: 92, controls: 78, compliant: 72, partial: 4, nonCompliant: 2, lastAudit: '2026-02-20', nextAudit: '2026-08-20', owner: 'Compliance' },
      { name: 'SOX', status: 'compliant', score: 88, controls: 64, compliant: 56, partial: 6, nonCompliant: 2, lastAudit: '2025-12-01', nextAudit: '2026-06-01', owner: 'Finance Sec' },
      { name: 'PCI-DSS', status: 'partial', score: 71, controls: 85, compliant: 60, partial: 18, nonCompliant: 7, lastAudit: '2026-03-10', nextAudit: '2026-09-10', owner: 'Payment Sec' },
      { name: 'ISO 27001', status: 'compliant', score: 85, controls: 114, compliant: 97, partial: 12, nonCompliant: 5, lastAudit: '2026-01-30', nextAudit: '2027-01-30', owner: 'ISMS Team' },
      { name: 'NIST CSF', status: 'partial', score: 74, controls: 108, compliant: 80, partial: 16, nonCompliant: 12, lastAudit: '2026-02-28', nextAudit: '2026-08-28', owner: 'CISO Office' },
    ];
    const controlMapping = [
      { domain: 'Access Control', gdpr: 'Art.25,32', hipaa: '164.312', sox: '404', pci: 'Req.7-8', iso: 'A.9', nist: 'PR.AC' },
      { domain: 'Data Protection', gdpr: 'Art.5,25,32', hipaa: '164.312(e)', sox: '302,404', pci: 'Req.3-4', iso: 'A.8,A.18', nist: 'PR.DS' },
      { domain: 'Incident Response', gdpr: 'Art.33,34', hipaa: '164.308(a)(6)', sox: 'N/A', pci: 'Req.12.10', iso: 'A.16', nist: 'RS.RP' },
      { domain: 'Risk Assessment', gdpr: 'Art.35', hipaa: '164.308(a)(1)', sox: '404', pci: 'Req.12.2', iso: 'A.6', nist: 'ID.RA' },
      { domain: 'Logging', gdpr: 'Art.30', hipaa: '164.312(b)', sox: '404', pci: 'Req.10', iso: 'A.12.4', nist: 'DE.CM' },
      { domain: 'Encryption', gdpr: 'Art.32', hipaa: '164.312(a)(2)(iv)', sox: 'N/A', pci: 'Req.3-4', iso: 'A.10', nist: 'PR.DS' },
      { domain: 'Third Party', gdpr: 'Art.28', hipaa: '164.308(b)', sox: '404', pci: 'Req.12.8', iso: 'A.15', nist: 'ID.SC' },
      { domain: 'Business Continuity', gdpr: 'Art.32', hipaa: '164.308(a)(7)', sox: 'N/A', pci: 'Req.12.10.1', iso: 'A.17', nist: 'PR.IP' },
    ];
    const evidenceProgress = [
      { regulation: 'GDPR', collected: 156, total: 186, pct: 84 },
      { regulation: 'HIPAA', collected: 72, total: 78, pct: 92 },
      { regulation: 'SOX', collected: 54, total: 64, pct: 84 },
      { regulation: 'PCI-DSS', collected: 58, total: 85, pct: 68 },
      { regulation: 'ISO 27001', collected: 98, total: 114, pct: 86 },
      { regulation: 'NIST CSF', collected: 76, total: 108, pct: 70 },
    ];
    const auditReadiness = regulations.map(r => ({
      name: r.name,
      score: Math.min(100, Math.round((r.compliant / r.controls) * 100 + (evidenceProgress.find(e => e.regulation === r.name)?.pct || 0) * 0.3)),
    }));
    const regChanges = [
      { regulation: 'GDPR', change: 'AI Act Alignment', impact: 'high', deadline: '2026-08-01', status: 'in-progress' },
      { regulation: 'PCI-DSS', change: 'v5.0 Requirements', impact: 'high', deadline: '2026-03-31', status: 'overdue' },
      { regulation: 'NIST CSF', change: 'CSF 2.0 Adoption', impact: 'medium', deadline: '2026-12-31', status: 'planning' },
      { regulation: 'ISO 27001', change: '2025 Amendment', impact: 'low', deadline: '2027-01-30', status: 'review' },
    ];
    return html`
      <div class="compliance-tracker">
        <h4>Regulatory Compliance Dashboard</h4>
        <div class="compliance-grid">
          <div class="comp-card full-width">
            <h5>Compliance Status by Regulation</h5>
            <div class="reg-status-grid">
              ${regulations.map(r => html`
                <div class="reg-status-item status-${r.status}">
                  <div class="reg-header">
                    <span class="reg-name">${r.name}</span>
                    <span class="reg-score">${r.score}%</span>
                  </div>
                  <div class="reg-progress-bar">
                    <div class="reg-fill compliant" style="width:${(r.compliant/r.controls)*100}%"></div>
                    <div class="reg-fill partial" style="width:${(r.partial/r.controls)*100}%"></div>
                    <div class="reg-fill non-compliant" style="width:${(r.nonCompliant/r.controls)*100}%"></div>
                  </div>
                  <div class="reg-details">
                    <span>${r.compliant} Compliant</span>
                    <span>${r.partial} Partial</span>
                    <span>${r.nonCompliant} Non-Compliant</span>
                    <span>Owner: ${r.owner}</span>
                  </div>
                  <div class="reg-audit-dates">
                    <span>Last: ${r.lastAudit}</span>
                    <span>Next: ${r.nextAudit}</span>
                  </div>
                </div>
              `)}
            </div>
          </div>
          <div class="comp-card">
            <h5>Control Mapping Matrix</h5>
            <div class="mapping-table-wrap">
              <table class="mapping-table">
                <thead><tr><th>Domain</th><th>GDPR</th><th>HIPAA</th><th>SOX</th><th>PCI</th><th>ISO</th><th>NIST</th></tr></thead>
                <tbody>
                  ${controlMapping.map(c => html`<tr>
                    <td>${c.domain}</td><td>${c.gdpr}</td><td>${c.hipaa}</td>
                    <td>${c.sox}</td><td>${c.pci}</td><td>${c.iso}</td><td>${c.nist}</td>
                  </tr>`)}
                </tbody>
              </table>
            </div>
          </div>
          <div class="comp-card">
            <h5>Evidence Collection Progress</h5>
            <div class="evidence-list">
              ${evidenceProgress.map(e => html`
                <div class="evidence-row">
                  <span class="ev-reg">${e.regulation}</span>
                  <div class="ev-bar-wrap">
                    <div class="ev-bar" style="width:${e.pct}%"></div>
                  </div>
                  <span class="ev-count">${e.collected}/${e.total} (${e.pct}%)</span>
                </div>
              `)}
            </div>
          </div>
          <div class="comp-card">
            <h5>Audit Readiness Score</h5>
            <div class="readiness-gauges">
              ${auditReadiness.map(a => html`
                <div class="readiness-item">
                  <span class="rdy-name">${a.name}</span>
                  <div class="rdy-gauge">
                    <div class="rdy-fill" style="width:${a.score}%; background:${a.score >= 85 ? '#22c55e' : a.score >= 70 ? '#f59e0b' : '#ef4444'}"></div>
                    <span class="rdy-val">${a.score}%</span>
                  </div>
                </div>
              `)}
            </div>
          </div>
          <div class="comp-card full-width">
            <h5>Regulatory Change Impact Assessment</h5>
            <div class="change-table">
              ${regChanges.map(c => html`
                <div class="change-row impact-${c.impact}">
                  <span class="ch-reg">${c.regulation}</span>
                  <span class="ch-desc">${c.change}</span>
                  <span class="ch-impact impact-badge-${c.impact}">${c.impact}</span>
                  <span class="ch-deadline">${c.deadline}</span>
                  <span class="ch-status status-${c.status}">${c.status}</span>
                </div>
              `)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _getComplianceGaps(regulation: string): string[] {
    const gaps: Record<string, string[]> = {
      GDPR: ['Data Processing Records incomplete', 'DPIA for new ML models pending', 'Cross-border transfer mechanisms need update'],
      HIPAA: ['Business Associate agreements renewal', 'PHI access logging gaps'],
      SOX: ['IT General Controls testing schedule', 'Segregation of duties review'],
      'PCI-DSS': ['Tokenization implementation', 'Network segmentation validation', 'Quarterly scan schedule gap'],
      'ISO 27001': ['Asset register completeness', 'Supplier security assessment'],
      'NIST CSF': ['Supply chain risk management', 'Recovery planning improvements'],
    };
    return gaps[regulation] || [];
  }

  private _calculateAuditReadinessScore(reg: string): number {
    const scores: Record<string, number> = { GDPR: 78, HIPAA: 92, SOX: 88, 'PCI-DSS': 71, 'ISO 27001': 85, 'NIST CSF': 74 };
    return scores[reg] || 50;
  }

  // ========== Vulnerability Management Lifecycle ==========
  private _renderVulnDiscoveryPipeline() {
    const pipelines = [
      { id: 'p1', name: 'Nessus Weekly Scan', type: 'scanner', status: 'active', schedule: 'Weekly Sun 02:00', lastRun: '2026-04-20 02:03:12', findings: 47, critical: 3, high: 12, medium: 22, low: 10 },
      { id: 'p2', name: 'GitHub Dependabot', type: 'scanner', status: 'active', schedule: 'On Push', lastRun: '2026-04-23 11:45:00', findings: 23, critical: 1, high: 5, medium: 11, low: 6 },
      { id: 'p3', name: 'Snyk Container Scan', type: 'scanner', status: 'active', schedule: 'Daily 03:00', lastRun: '2026-04-23 03:01:45', findings: 15, critical: 0, high: 4, medium: 7, low: 4 },
      { id: 'p4', name: 'Manual Pen Test', type: 'manual', status: 'completed', schedule: 'Quarterly', lastRun: '2026-04-15 09:00:00', findings: 8, critical: 2, high: 3, medium: 2, low: 1 },
      { id: 'p5', name: 'OWASP ZAP DAST', type: 'scanner', status: 'active', schedule: 'On Deploy', lastRun: '2026-04-22 18:30:00', findings: 31, critical: 1, high: 8, medium: 14, low: 8 },
      { id: 'p6', name: 'Security Research Team', type: 'researcher', status: 'active', schedule: 'Continuous', lastRun: '2026-04-23 10:15:00', findings: 5, critical: 1, high: 2, medium: 1, low: 1 },
      { id: 'p7', name: 'Developer Self-Report', type: 'coder', status: 'active', schedule: 'On Demand', lastRun: '2026-04-23 09:22:00', findings: 3, critical: 0, high: 1, medium: 2, low: 0 },
      { id: 'p8', name: 'SonarQube SAST', type: 'scanner', status: 'active', schedule: 'On PR Merge', lastRun: '2026-04-23 11:30:00', findings: 19, critical: 0, high: 3, medium: 10, low: 6 },
    ];
    const statusColor = (s: string) => s === 'active' ? '#10b981' : s === 'completed' ? '#3b82f6' : '#f59e0b';
    const typeIcon = (t: string) => t === 'scanner' ? '\\u{1F50D}' : t === 'manual' ? '\\u{1F3AF}' : t === 'researcher' ? '\\u{1F9E0}' : '\\u{1F4BB}';
    return html`
      <section class="vuln-discovery-pipeline">
        <h4>Vulnerability Discovery Pipeline</h4>
        <div class="pipeline-grid">
          ${pipelines.map(p => html`
            <div class="pipeline-card">
              <div class="pipeline-header">
                <span class="pipeline-type-icon">${typeIcon(p.type)}</span>
                <span class="pipeline-name">${p.name}</span>
                <span class="pipeline-badge" style="background:${statusColor(p.status)}20;color:${statusColor(p.status)}">${p.status}</span>
              </div>
              <div class="pipeline-meta">
                <span>Schedule: ${p.schedule}</span>
                <span>Last: ${p.lastRun}</span>
              </div>
              <div class="pipeline-findings">
                <span class="sev-critical">${p.critical} Critical</span>
                <span class="sev-high">${p.high} High</span>
                <span class="sev-medium">${p.medium} Medium</span>
                <span class="sev-low">${p.low} Low</span>
              </div>
              <div class="pipeline-total">Total: ${p.findings} findings</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderVulnSLAClock() {
    const slaConfig = [
      { severity: 'Critical', maxHours: 24, warnPercent: 75, color: '#ef4444' },
      { severity: 'High', maxHours: 72, warnPercent: 80, color: '#f97316' },
      { severity: 'Medium', maxHours: 720, warnPercent: 85, color: '#eab308' },
      { severity: 'Low', maxHours: 2160, warnPercent: 90, color: '#22c55e' },
    ];
    const activeVulns = [
      { id: 'V-001', title: 'Apache Log4j RCE', severity: 'Critical', detected: '2026-04-21T14:00:00', remaining: 6.5, assignee: 'Alice Chen' },
      { id: 'V-002', title: 'SQL Injection in /api/users', severity: 'Critical', detected: '2026-04-22T08:00:00', remaining: 22, assignee: 'Bob Smith' },
      { id: 'V-003', title: 'Outdated OpenSSL 1.1.1', severity: 'High', detected: '2026-04-19T10:00:00', remaining: 48, assignee: 'Carol Wu' },
      { id: 'V-004', title: 'XSS in Search Widget', severity: 'High', detected: '2026-04-20T16:00:00', remaining: 64, assignee: 'Dave Li' },
      { id: 'V-005', title: 'Weak TLS 1.0 Support', severity: 'Medium', detected: '2026-04-10T09:00:00', remaining: 648, assignee: 'Eve Wang' },
      { id: 'V-006', title: 'Missing CSP Header', severity: 'Medium', detected: '2026-04-15T11:00:00', remaining: 576, assignee: 'Frank Zhang' },
      { id: 'V-007', title: 'Verbose Error Messages', severity: 'Low', detected: '2026-03-20T08:00:00', remaining: 2016, assignee: 'Grace Liu' },
    ];
    return html`
      <section class="vuln-sla-clock">
        <h4>Vulnerability SLA Clock</h4>
        <div class="sla-config-bar">
          ${slaConfig.map(s => html`
            <div class="sla-badge" style="border-color:${s.color}">
              <strong>${s.severity}</strong>: ${s.maxHours}h (${s.maxHours / 24}d) | Warn at ${s.warnPercent}%
            </div>
          `).join('')}
        </div>
        <div class="sla-vuln-list">
          ${activeVulns.map(v => {
            const cfg = slaConfig.find(s => s.severity === v.severity)!;
            const pct = ((cfg.maxHours - v.remaining) / cfg.maxHours) * 100;
            const isOverdue = v.remaining <= 0;
            const isWarning = pct >= cfg.warnPercent && !isOverdue;
            const barColor = isOverdue ? '#ef4444' : isWarning ? '#f59e0b' : cfg.color;
            return html`
              <div class="sla-vuln-row">
                <div class="sla-vuln-info">
                  <span class="sla-id">${v.id}</span>
                  <span class="sla-title">${v.title}</span>
                  <span class="sla-severity" style="color:${cfg.color}">${v.severity}</span>
                  <span class="sla-assignee">${v.assignee}</span>
                </div>
                <div class="sla-progress-bar">
                  <div class="sla-progress-fill" style="width:${Math.min(pct, 100)}%;background:${barColor}"></div>
                </div>
                <span class="sla-remaining" style="color:${barColor}">${isOverdue ? 'OVERDUE' : v.remaining + 'h left'}</span>
              </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  private _renderPatchDeploymentStatus() {
    const environments = [
      { name: 'Development', status: 'deployed', patches: 42, pending: 0, failed: 1, lastDeploy: '2026-04-23 06:00' },
      { name: 'Staging', status: 'deployed', patches: 38, pending: 4, failed: 0, lastDeploy: '2026-04-23 04:00' },
      { name: 'Production US-East', status: 'partial', patches: 35, pending: 7, failed: 0, lastDeploy: '2026-04-22 22:00' },
      { name: 'Production EU-West', status: 'pending', patches: 30, pending: 12, failed: 0, lastDeploy: '2026-04-22 20:00' },
      { name: 'Production AP-South', status: 'failed', patches: 28, pending: 14, failed: 2, lastDeploy: '2026-04-21 18:00' },
    ];
    const statusMap: Record<string, { color: string; label: string }> = {
      deployed: { color: '#10b981', label: 'Deployed' },
      partial: { color: '#f59e0b', label: 'Partial' },
      pending: { color: '#3b82f6', label: 'Pending' },
      failed: { color: '#ef4444', label: 'Failed' },
    };
    return html`
      <section class="patch-deployment-status">
        <h4>Patch Deployment Status</h4>
        <div class="env-grid">
          ${environments.map(e => {
            const s = statusMap[e.status];
            return html`
              <div class="env-card" style="border-left:4px solid ${s.color}">
                <div class="env-name">${e.name}</div>
                <div class="env-status-badge" style="background:${s.color}20;color:${s.color}">${s.label}</div>
                <div class="env-stats">
                  <div class="stat"><span class="stat-val">${e.patches}</span><span class="stat-lbl">Deployed</span></div>
                  <div class="stat"><span class="stat-val">${e.pending}</span><span class="stat-lbl">Pending</span></div>
                  <div class="stat"><span class="stat-val">${e.failed}</span><span class="stat-lbl">Failed</span></div>
                </div>
                <div class="env-last-deploy">Last: ${e.lastDeploy}</div>
              </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  private _renderVulnAgingReport() {
    const agingBuckets = [
      { range: '0-7 days', count: 45, critical: 2, high: 8, medium: 20, low: 15, riskScore: 15 },
      { range: '8-30 days', count: 32, critical: 1, high: 5, medium: 15, low: 11, riskScore: 38 },
      { range: '31-90 days', count: 18, critical: 0, high: 3, medium: 10, low: 5, riskScore: 62 },
      { range: '91-180 days', count: 8, critical: 0, high: 1, medium: 4, low: 3, riskScore: 78 },
      { range: '181-365 days', count: 4, critical: 0, high: 0, medium: 2, low: 2, riskScore: 89 },
      { range: '365+ days', count: 2, critical: 0, high: 0, medium: 1, low: 1, riskScore: 95 },
    ];
    return html`
      <section class="vuln-aging-report">
        <h4>Vulnerability Aging Report</h4>
        <div class="aging-table">
          <div class="aging-header">
            <span>Age Range</span><span>Total</span><span>Critical</span><span>High</span><span>Medium</span><span>Low</span><span>Risk Score</span>
          </div>
          ${agingBuckets.map(b => html`
            <div class="aging-row">
              <span class="aging-range">${b.range}</span>
              <span class="aging-count">${b.count}</span>
              <span class="aging-sev-critical">${b.critical}</span>
              <span class="aging-sev-high">${b.high}</span>
              <span class="aging-sev-medium">${b.medium}</span>
              <span class="aging-sev-low">${b.low}</span>
              <span class="aging-risk" style="color:${b.riskScore > 70 ? '#ef4444' : b.riskScore > 40 ? '#f59e0b' : '#10b981'}">${b.riskScore}</span>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderSuppressionWorkflow() {
    const suppressions = [
      { id: 'SUP-001', vulnId: 'V-099', title: 'False Positive: Info Disclosure', requester: 'Alice Chen', approver: 'CISO Bob', status: 'approved', reason: 'Verified non-exploitable in context', expires: '2026-10-01' },
      { id: 'SUP-002', vulnId: 'V-102', title: 'Accepted Risk: Legacy Protocol', requester: 'Dave Li', approver: null, status: 'pending', reason: 'Migration planned for Q3', expires: '2026-07-01' },
      { id: 'SUP-003', vulnId: 'V-105', title: 'Compensating Control in Place', requester: 'Carol Wu', approver: 'CISO Bob', status: 'approved', reason: 'WAF rule blocks exploitation path', expires: '2026-12-31' },
      { id: 'SUP-004', vulnId: 'V-108', title: 'Duplicate Finding', requester: 'Eve Wang', approver: null, status: 'rejected', reason: 'Not a duplicate - different endpoint', expires: null },
    ];
    const statusColor = (s: string) => s === 'approved' ? '#10b981' : s === 'pending' ? '#f59e0b' : '#ef4444';
    return html`
      <section class="suppression-workflow">
        <h4>Suppression & Risk Acceptance Workflow</h4>
        <div class="suppression-list">
          ${suppressions.map(s => html`
            <div class="suppression-card" style="border-left:4px solid ${statusColor(s.status)}">
              <div class="supp-header">
                <span class="supp-id">${s.id}</span>
                <span class="supp-vuln">${s.vulnId}</span>
                <span class="supp-status-badge" style="background:${statusColor(s.status)}20;color:${statusColor(s.status)}">${s.status.toUpperCase()}</span>
              </div>
              <div class="supp-title">${s.title}</div>
              <div class="supp-details">
                <span>Requester: ${s.requester}</span>
                <span>Approver: ${s.approver || 'Pending'}</span>
                ${s.expires ? html`<span>Expires: ${s.expires}</span>` : ''}
              </div>
              <div class="supp-reason"><strong>Reason:</strong> ${s.reason}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }  // ========== Identity Governance Suite ==========
  private _renderAccessReviewCampaigns() {
    const campaigns = [
      { id: 'ARC-2026-Q2-001', name: 'Q2 Privileged Access Review', scope: 'All Admin Accounts', totalEntitlements: 342, reviewed: 218, certified: 195, revoked: 23, status: 'in_progress', owner: 'CISO Bob', deadline: '2026-05-31' },
      { id: 'ARC-2026-Q2-002', name: 'Engineering Team Access', scope: 'Engineering Department', totalEntitlements: 1204, reviewed: 1204, certified: 1102, revoked: 102, status: 'completed', owner: 'VP Engineering', deadline: '2026-04-30' },
      { id: 'ARC-2026-Q2-003', name: 'Contractor Access Audit', scope: 'All Contractors', totalEntitlements: 87, reviewed: 45, certified: 38, revoked: 7, status: 'in_progress', owner: 'HR Director', deadline: '2026-06-15' },
      { id: 'ARC-2026-Q2-004', name: 'Cloud Resource Permissions', scope: 'AWS/GCP/Azure IAM', totalEntitlements: 567, reviewed: 0, certified: 0, revoked: 0, status: 'not_started', owner: 'Cloud Security Lead', deadline: '2026-07-31' },
      { id: 'ARC-2026-Q2-005', name: 'Database Access Review', scope: 'All Production Databases', totalEntitlements: 156, reviewed: 156, certified: 140, revoked: 16, status: 'completed', owner: 'DBA Lead', deadline: '2026-04-15' },
    ];
    const statusColor = (s: string) => s === 'completed' ? '#10b981' : s === 'in_progress' ? '#3b82f6' : '#94a3b8';
    const statusLabel = (s: string) => s === 'completed' ? 'Completed' : s === 'in_progress' ? 'In Progress' : 'Not Started';
    return html`
      <section class="access-review-campaigns">
        <h4>Access Review Campaigns</h4>
        <div class="campaign-list">
          ${campaigns.map(c => {
            const pct = c.totalEntitlements > 0 ? Math.round((c.reviewed / c.totalEntitlements) * 100) : 0;
            return html`
              <div class="campaign-card" style="border-left:4px solid ${statusColor(c.status)}">
                <div class="campaign-header">
                  <span class="campaign-id">${c.id}</span>
                  <span class="campaign-status" style="color:${statusColor(c.status)}">${statusLabel(c.status)}</span>
                </div>
                <div class="campaign-name">${c.name}</div>
                <div class="campaign-meta">
                  <span>Scope: ${c.scope}</span>
                  <span>Owner: ${c.owner}</span>
                  <span>Deadline: ${c.deadline}</span>
                </div>
                <div class="campaign-progress">
                  <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${statusColor(c.status)}"></div></div>
                  <span class="progress-text">${c.reviewed}/${c.totalEntitlements} reviewed (${pct}%)</span>
                </div>
                <div class="campaign-results">
                  <span class="certified">${c.certified} Certified</span>
                  <span class="revoked">${c.revoked} Revoked</span>
                </div>
              </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  private _renderRoleMining() {
    const roles = [
      { name: 'Engineering Lead', currentUsers: 12, suggestedUsers: 15, confidence: 92, entitlements: 34, overlaps: 3, optimization: 'Merge 3 overlapping roles into 1' },
      { name: 'Junior Developer', currentUsers: 45, suggestedUsers: 42, confidence: 88, entitlements: 18, overlaps: 2, optimization: 'Remove 3 unnecessary entitlements' },
      { name: 'Security Analyst', currentUsers: 8, suggestedUsers: 10, confidence: 85, entitlements: 52, overlaps: 1, optimization: 'Split into Tier 1 and Tier 2 roles' },
      { name: 'DevOps Engineer', currentUsers: 6, suggestedUsers: 8, confidence: 79, entitlements: 67, overlaps: 5, optimization: 'High overlap with SRE - consider unified role' },
      { name: 'Product Manager', currentUsers: 15, suggestedUsers: 14, confidence: 91, entitlements: 12, overlaps: 0, optimization: 'Well-defined role, no changes needed' },
      { name: 'Contractor Limited', currentUsers: 30, suggestedUsers: 28, confidence: 76, entitlements: 8, overlaps: 2, optimization: '2 users have excessive permissions' },
    ];
    return html`
      <section class="role-mining">
        <h4>Role Mining & Optimization</h4>
        <div class="role-grid">
          ${roles.map(r => html`
            <div class="role-card">
              <div class="role-name">${r.name}</div>
              <div class="role-users">Users: ${r.currentUsers} current / ${r.suggestedUsers} suggested</div>
              <div class="role-confidence">
                <span>Confidence:</span>
                <div class="confidence-bar"><div class="confidence-fill" style="width:${r.confidence}%;background:${r.confidence > 85 ? '#10b981' : r.confidence > 75 ? '#f59e0b' : '#ef4444'}"></div></div>
                <span>${r.confidence}%</span>
              </div>
              <div class="role-stats">
                <span>${r.entitlements} Entitlements</span>
                <span>${r.overlaps} Overlaps</span>
              </div>
              <div class="role-suggestion">OPT: ${r.optimization}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderEntitlementCreep() {
    const creepAlerts = [
      { user: 'alice.chen', role: 'Engineering Lead', baseEntitlements: 34, currentEntitlements: 47, addedOverTime: 13, riskLevel: 'medium', topAdditions: ['prod-db-write', 's3-admin', 'k8s-cluster-admin'] },
      { user: 'bob.smith', role: 'DevOps Engineer', baseEntitlements: 67, currentEntitlements: 89, addedOverTime: 22, riskLevel: 'high', topAdditions: ['iam-full-admin', 'billing-access', 'security-log-read'] },
      { user: 'carol.wu', role: 'Security Analyst', baseEntitlements: 52, currentEntitlements: 58, addedOverTime: 6, riskLevel: 'low', topAdditions: ['jira-admin', 'confluence-admin'] },
      { user: 'dave.li', role: 'Junior Developer', baseEntitlements: 18, currentEntitlements: 31, addedOverTime: 13, riskLevel: 'critical', topAdditions: ['prod-root-ssh', 'vault-secrets-read', 'ci-cd-admin'] },
      { user: 'eve.wang', role: 'Contractor', baseEntitlements: 8, currentEntitlements: 19, addedOverTime: 11, riskLevel: 'high', topAdditions: ['github-org-admin', 'slack-admin', 'vpn-full'] },
    ];
    const riskColor = (r: string) => r === 'critical' ? '#ef4444' : r === 'high' ? '#f97316' : r === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <section class="entitlement-creep">
        <h4>Entitlement Creep Detection</h4>
        <div class="creep-list">
          ${creepAlerts.map(c => html`
            <div class="creep-card" style="border-left:4px solid ${riskColor(c.riskLevel)}">
              <div class="creep-header">
                <span class="creep-user">${c.user}</span>
                <span class="creep-role">${c.role}</span>
                <span class="creep-risk" style="color:${riskColor(c.riskLevel)}">${c.riskLevel.toUpperCase()}</span>
              </div>
              <div class="creep-stats">
                <span>Base: ${c.baseEntitlements}</span>
                <span>-></span>
                <span>Current: <strong>${c.currentEntitlements}</strong></span>
                <span>(+${c.addedOverTime} creep)</span>
              </div>
              <div class="creep-additions">
                ${c.topAdditions.map(a => html`<span class="creep-tag">${a}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderJMLWorkflow() {
    const events = [
      { type: 'joiner', user: 'new.hire.2026', date: '2026-04-23', department: 'Engineering', manager: 'Alice Chen', status: 'in_progress', tasks: ['Create AD account', 'Assign base role', 'Provision laptop', 'Grant repo access'], completedTasks: 2 },
      { type: 'mover', user: 'bob.smith', date: '2026-04-20', department: 'Engineering -> Security', manager: 'CISO Bob', status: 'in_progress', tasks: ['Remove old role entitlements', 'Assign new role', 'Transfer data ownership', 'Update group memberships'], completedTasks: 1 },
      { type: 'leaver', user: 'departing.user', date: '2026-04-18', department: 'Marketing', manager: 'VP Marketing', status: 'completed', tasks: ['Disable all accounts', 'Revoke VPN access', 'Transfer data ownership', 'Archive mailbox', 'Collect equipment'], completedTasks: 5 },
      { type: 'joiner', user: 'contractor.q2', date: '2026-04-22', department: 'Finance', manager: 'CFO', status: 'pending', tasks: ['Create temporary account', 'Assign contractor role', 'Set expiration date', 'Notify manager'], completedTasks: 0 },
      { type: 'mover', user: 'carol.wu', date: '2026-04-25', department: 'Security -> Engineering', manager: 'VP Engineering', status: 'scheduled', tasks: ['Plan transition', 'Identify access changes', 'Schedule downtime', 'Execute access transfer'], completedTasks: 0 },
    ];
    const typeIcon = (t: string) => t === 'joiner' ? 'JOIN' : t === 'mover' ? 'MOVE' : 'LEAVE';
    const statusColor = (s: string) => s === 'completed' ? '#10b981' : s === 'in_progress' ? '#3b82f6' : s === 'scheduled' ? '#8b5cf6' : '#94a3b8';
    return html`
      <section class="jml-workflow">
        <h4>Joiner / Mover / Leaver Workflow</h4>
        <div class="jml-list">
          ${events.map(e => {
            const pct = e.tasks.length > 0 ? Math.round((e.completedTasks / e.tasks.length) * 100) : 0;
            return html`
              <div class="jml-card" style="border-left:4px solid ${statusColor(e.status)}">
                <div class="jml-header">
                  <span class="jml-icon">${typeIcon(e.type)}</span>
                  <span class="jml-user">${e.user}</span>
                  <span class="jml-type">${e.type.toUpperCase()}</span>
                  <span class="jml-status" style="color:${statusColor(e.status)}">${e.status.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div class="jml-meta">
                  <span>${e.department}</span><span>Manager: ${e.manager}</span><span>${e.date}</span>
                </div>
                <div class="jml-tasks">
                  <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${statusColor(e.status)}"></div></div>
                  <span>${e.completedTasks}/${e.tasks.length} tasks</span>
                </div>
              </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  private _renderSODConflicts() {
    const conflicts = [
      { user: 'bob.smith', role1: 'DevOps Engineer', role2: 'Security Auditor', conflictType: 'SoD Violation', severity: 'high', description: 'Same user can deploy code and audit deployments', recommendation: 'Reassign audit role to separate team member' },
      { user: 'alice.chen', role1: 'Engineering Lead', role2: 'Change Approver', conflictType: 'SoD Violation', severity: 'medium', description: 'Can submit and approve change requests', recommendation: 'Implement four-eyes principle for approvals' },
      { user: 'finance.admin', role1: 'Accounts Payable', role2: 'Bank Reconciliation', conflictType: 'SoD Violation', severity: 'critical', description: 'Can create payments and reconcile bank statements', recommendation: 'Immediately separate these roles' },
      { user: 'procurement.lead', role1: 'Purchase Requisition', role2: 'Vendor Approval', conflictType: 'SoD Violation', severity: 'high', description: 'Can request purchases and approve vendors', recommendation: 'Route vendor approvals to finance team' },
    ];
    const sevColor = (s: string) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : '#eab308';
    return html`
      <section class="sod-conflicts">
        <h4>Segregation of Duties Conflict Matrix</h4>
        <div class="sod-list">
          ${conflicts.map(c => html`
            <div class="sod-card" style="border-left:4px solid ${sevColor(c.severity)}">
              <div class="sod-header">
                <span class="sod-user">${c.user}</span>
                <span class="sod-severity" style="color:${sevColor(c.severity)}">${c.severity.toUpperCase()}</span>
              </div>
              <div class="sod-roles">
                <span class="sod-role1">${c.role1}</span>
                <span class="sod-vs">VS</span>
                <span class="sod-role2">${c.role2}</span>
              </div>
              <div class="sod-desc">${c.description}</div>
              <div class="sod-rec">REC: ${c.recommendation}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }  // ========== Security Testing Automation ==========
  private _renderDASTScheduler() {
    const scans = [
      { id: 'DAST-001', target: 'https://api.example.com', schedule: 'Daily 06:00', status: 'completed', lastRun: '2026-04-23 06:02:15', findings: { critical: 0, high: 2, medium: 5, low: 8 }, duration: '4m 32s', scanner: 'OWASP ZAP 2.14' },
      { id: 'DAST-002', target: 'https://app.example.com', schedule: 'Daily 07:00', status: 'running', lastRun: '2026-04-23 07:00:01', findings: { critical: 0, high: 0, medium: 0, low: 0 }, duration: 'In progress...', scanner: 'Burp Suite Enterprise' },
      { id: 'DAST-003', target: 'https://admin.example.com', schedule: 'Weekly Mon 08:00', status: 'scheduled', lastRun: '2026-04-21 08:01:30', findings: { critical: 1, high: 3, medium: 7, low: 12 }, duration: '12m 18s', scanner: 'OWASP ZAP 2.14' },
      { id: 'DAST-004', target: 'https://mobile-api.example.com', schedule: 'On Deploy', status: 'failed', lastRun: '2026-04-22 18:05:00', findings: { critical: 0, high: 0, medium: 0, low: 0 }, duration: 'Error: TLS handshake failed', scanner: 'Nuclei' },
      { id: 'DAST-005', target: 'https://staging.example.com', schedule: 'On PR Merge', status: 'completed', lastRun: '2026-04-23 11:30:00', findings: { critical: 0, high: 1, medium: 3, low: 4 }, duration: '6m 15s', scanner: 'OWASP ZAP 2.14' },
    ];
    const statusColor = (s: string) => s === 'completed' ? '#10b981' : s === 'running' ? '#3b82f6' : s === 'failed' ? '#ef4444' : '#94a3b8';
    return html`
      <section class="dast-scheduler">
        <h4>DAST Scan Scheduler & Results</h4>
        <div class="dast-list">
          ${scans.map(s => html`
            <div class="dast-card" style="border-left:4px solid ${statusColor(s.status)}">
              <div class="dast-header">
                <span class="dast-id">${s.id}</span>
                <span class="dast-status" style="color:${statusColor(s.status)}">${s.status.toUpperCase()}</span>
                <span class="dast-scanner">${s.scanner}</span>
              </div>
              <div class="dast-target">${s.target}</div>
              <div class="dast-meta">
                <span>Schedule: ${s.schedule}</span>
                <span>Duration: ${s.duration}</span>
                <span>Last: ${s.lastRun}</span>
              </div>
              <div class="dast-findings">
                <span class="sev-critical">${s.findings.critical}C</span>
                <span class="sev-high">${s.findings.high}H</span>
                <span class="sev-medium">${s.findings.medium}M</span>
                <span class="sev-low">${s.findings.low}L</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderSASTFindings() {
    const findings = [
      { id: 'SAST-001', file: 'src/api/users.ts', line: 142, rule: 'SQL Injection', severity: 'critical', status: 'open', tool: 'Semgrep', effort: '8h', cwe: 'CWE-89' },
      { id: 'SAST-002', file: 'src/auth/token.ts', line: 87, rule: 'Hardcoded Secret', severity: 'critical', status: 'in_review', tool: 'SonarQube', effort: '2h', cwe: 'CWE-798' },
      { id: 'SAST-003', file: 'src/utils/crypto.ts', line: 23, rule: 'Weak Hash Algorithm', severity: 'high', status: 'open', tool: 'CodeQL', effort: '4h', cwe: 'CWE-328' },
      { id: 'SAST-004', file: 'src/middleware/cors.ts', line: 15, rule: 'Overly Permissive CORS', severity: 'high', status: 'fixed', tool: 'Semgrep', effort: '1h', cwe: 'CWE-942' },
      { id: 'SAST-005', file: 'src/routes/upload.ts', line: 56, rule: 'Path Traversal', severity: 'high', status: 'open', tool: 'CodeQL', effort: '3h', cwe: 'CWE-22' },
      { id: 'SAST-006', file: 'src/config/database.ts', line: 8, rule: 'Insecure Connection', severity: 'medium', status: 'wont_fix', tool: 'SonarQube', effort: '16h', cwe: 'CWE-319' },
    ];
    const sevColor = (s: string) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : '#eab308';
    const statusColor = (s: string) => s === 'fixed' ? '#10b981' : s === 'in_review' ? '#3b82f6' : s === 'wont_fix' ? '#94a3b8' : '#f59e0b';
    return html`
      <section class="sast-findings">
        <h4>SAST Findings Management</h4>
        <div class="sast-list">
          ${findings.map(f => html`
            <div class="sast-card" style="border-left:4px solid ${sevColor(f.severity)}">
              <div class="sast-header">
                <span class="sast-id">${f.id}</span>
                <span class="sast-severity" style="color:${sevColor(f.severity)}">${f.severity.toUpperCase()}</span>
                <span class="sast-status" style="color:${statusColor(f.status)}">${f.status.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div class="sast-location">${f.file}:${f.line}</div>
              <div class="sast-rule">${f.rule} (${f.cwe})</div>
              <div class="sast-meta">
                <span>Tool: ${f.tool}</span>
                <span>Effort: ${f.effort}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderSCATracking() {
    const deps = [
      { name: 'lodash', version: '4.17.20', latestSafe: '4.17.21', vulns: 1, severity: 'high', fixAvailable: true, affectedProjects: ['web-app', 'admin-portal', 'api-gateway'] },
      { name: 'express', version: '4.17.1', latestSafe: '4.19.2', vulns: 3, severity: 'critical', fixAvailable: true, affectedProjects: ['api-gateway', 'auth-service'] },
      { name: 'axios', version: '0.21.0', latestSafe: '1.6.0', vulns: 1, severity: 'medium', fixAvailable: true, affectedProjects: ['web-app', 'mobile-app'] },
      { name: 'jsonwebtoken', version: '8.5.1', latestSafe: '9.0.2', vulns: 2, severity: 'high', fixAvailable: false, affectedProjects: ['auth-service', 'api-gateway'] },
      { name: 'minimist', version: '1.2.0', latestSafe: '1.2.8', vulns: 1, severity: 'low', fixAvailable: true, affectedProjects: ['cli-tool', 'build-scripts'] },
      { name: 'node-forge', version: '0.10.0', latestSafe: '1.3.1', vulns: 2, severity: 'critical', fixAvailable: true, affectedProjects: ['cert-manager', 'vpn-service'] },
    ];
    const sevColor = (s: string) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <section class="sca-tracking">
        <h4>SCA Dependency Vulnerability Tracking</h4>
        <div class="sca-list">
          ${deps.map(d => html`
            <div class="sca-card" style="border-left:4px solid ${sevColor(d.severity)}">
              <div class="sca-header">
                <span class="sca-name">${d.name}</span>
                <span class="sca-version">${d.version} -> ${d.latestSafe}</span>
                <span class="sca-severity" style="color:${sevColor(d.severity)}">${d.vulns} ${d.severity.toUpperCase()}</span>
                <span class="sca-fix" style="color:${d.fixAvailable ? '#10b981' : '#ef4444'}">${d.fixAvailable ? 'FIX AVAILABLE' : 'NO FIX'}</span>
              </div>
              <div class="sca-projects">
                ${d.affectedProjects.map(p => html`<span class="sca-project-tag">${p}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderContainerScanning() {
    const images = [
      { name: 'api-gateway:latest', registry: 'ECR', lastScan: '2026-04-23 05:00', vulns: { critical: 0, high: 1, medium: 4, low: 7 }, baseImage: 'node:18-alpine', size: '245MB', status: 'pass' },
      { name: 'auth-service:v2.3.1', registry: 'ECR', lastScan: '2026-04-23 05:02', vulns: { critical: 1, high: 3, medium: 8, low: 12 }, baseImage: 'python:3.11-slim', size: '312MB', status: 'fail' },
      { name: 'worker:latest', registry: 'GCR', lastScan: '2026-04-23 05:05', vulns: { critical: 0, high: 0, medium: 2, low: 5 }, baseImage: 'distroless/base', size: '89MB', status: 'pass' },
      { name: 'frontend:prod-20260422', registry: 'ECR', lastScan: '2026-04-22 22:00', vulns: { critical: 0, high: 2, medium: 6, low: 9 }, baseImage: 'nginx:alpine', size: '156MB', status: 'warn' },
      { name: 'sidecar-injector:v1.8', registry: 'GCR', lastScan: '2026-04-23 05:10', vulns: { critical: 0, high: 0, medium: 1, low: 3 }, baseImage: 'distroless/static', size: '23MB', status: 'pass' },
    ];
    const statusColor = (s: string) => s === 'pass' ? '#10b981' : s === 'warn' ? '#f59e0b' : '#ef4444';
    return html`
      <section class="container-scanning">
        <h4>Container Image Scanning Dashboard</h4>
        <div class="container-list">
          ${images.map(i => html`
            <div class="container-card" style="border-left:4px solid ${statusColor(i.status)}">
              <div class="container-header">
                <span class="container-name">${i.name}</span>
                <span class="container-status" style="color:${statusColor(i.status)}">${i.status.toUpperCase()}</span>
              </div>
              <div class="container-meta">
                <span>${i.registry}</span>
                <span>${i.baseImage}</span>
                <span>${i.size}</span>
                <span>${i.lastScan}</span>
              </div>
              <div class="container-findings">
                <span class="sev-critical">${i.vulns.critical}C</span>
                <span class="sev-high">${i.vulns.high}H</span>
                <span class="sev-medium">${i.vulns.medium}M</span>
                <span class="sev-low">${i.vulns.low}L</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderIaCScanning() {
    const results = [
      { id: 'IAC-001', file: 'terraform/aws/rds.tf', line: 23, rule: 'RDS Public Access', severity: 'critical', status: 'open', cloud: 'AWS', tool: 'tfsec' },
      { id: 'IAC-002', file: 'terraform/aws/s3.tf', line: 45, rule: 'S3 Bucket Not Encrypted', severity: 'high', status: 'fixed', cloud: 'AWS', tool: 'Checkov' },
      { id: 'IAC-003', file: 'k8s/namespace-prod.yaml', line: 12, rule: 'No Network Policy', severity: 'high', status: 'open', cloud: 'K8s', tool: 'Trivy' },
      { id: 'IAC-004', file: 'terraform/gcp/firewall.tf', line: 67, rule: 'Open Ingress 0.0.0.0/0', severity: 'critical', status: 'in_review', cloud: 'GCP', tool: 'tfsec' },
      { id: 'IAC-005', file: 'ansible/playbook-db.yml', line: 89, rule: 'SSH Password Auth Enabled', severity: 'medium', status: 'open', cloud: 'On-Prem', tool: 'Ansible-lint' },
    ];
    const sevColor = (s: string) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : '#eab308';
    const statusColor = (s: string) => s === 'fixed' ? '#10b981' : s === 'in_review' ? '#3b82f6' : '#f59e0b';
    return html`
      <section class="iac-scanning">
        <h4>IaC Security Scanning Results</h4>
        <div class="iac-list">
          ${results.map(r => html`
            <div class="iac-card" style="border-left:4px solid ${sevColor(r.severity)}">
              <div class="iac-header">
                <span class="iac-id">${r.id}</span>
                <span class="iac-severity" style="color:${sevColor(r.severity)}">${r.severity.toUpperCase()}</span>
                <span class="iac-status" style="color:${statusColor(r.status)}">${r.status.replace('_', ' ').toUpperCase()}</span>
                <span class="iac-cloud">${r.cloud}</span>
              </div>
              <div class="iac-location">${r.file}:${r.line}</div>
              <div class="iac-rule">${r.rule} <span class="iac-tool">[${r.tool}]</span></div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderFuzzingResults() {
    const fuzzTests = [
      { id: 'FUZZ-001', target: 'api/v1/users', method: 'REST API Fuzzing', status: 'completed', totalRequests: 50000, crashes: 0, uniqueBugs: 0, coverage: '87%', duration: '2h 15m', lastRun: '2026-04-22' },
      { id: 'FUZZ-002', target: 'api/v1/upload', method: 'File Upload Fuzzing', status: 'completed', totalRequests: 12000, crashes: 3, uniqueBugs: 1, coverage: '72%', duration: '45m', lastRun: '2026-04-22' },
      { id: 'FUZZ-003', target: 'api/v1/auth/login', method: 'Auth Protocol Fuzzing', status: 'running', totalRequests: 34000, crashes: 1, uniqueBugs: 0, coverage: '65%', duration: '1h 30m+', lastRun: '2026-04-23' },
      { id: 'FUZZ-004', target: 'websocket/realtime', method: 'WebSocket Protocol Fuzzing', status: 'scheduled', totalRequests: 0, crashes: 0, uniqueBugs: 0, coverage: '0%', duration: '-', lastRun: '-' },
      { id: 'FUZZ-005', target: 'grpc/payment-service', method: 'gRPC Mutation Fuzzing', status: 'completed', totalRequests: 28000, crashes: 2, uniqueBugs: 2, coverage: '78%', duration: '1h 50m', lastRun: '2026-04-21' },
    ];
    const statusColor = (s: string) => s === 'completed' ? '#10b981' : s === 'running' ? '#3b82f6' : '#94a3b8';
    return html`
      <section class="fuzzing-results">
        <h4>Fuzzing Test Results Tracker</h4>
        <div class="fuzz-list">
          ${fuzzTests.map(f => html`
            <div class="fuzz-card" style="border-left:4px solid ${statusColor(f.status)}">
              <div class="fuzz-header">
                <span class="fuzz-id">${f.id}</span>
                <span class="fuzz-target">${f.target}</span>
                <span class="fuzz-status" style="color:${statusColor(f.status)}">${f.status.toUpperCase()}</span>
              </div>
              <div class="fuzz-method">${f.method}</div>
              <div class="fuzz-stats">
                <span>Requests: ${f.totalRequests.toLocaleString()}</span>
                <span style="color:${f.crashes > 0 ? '#ef4444' : '#10b981'}">Crashes: ${f.crashes}</span>
                <span style="color:${f.uniqueBugs > 0 ? '#f97316' : '#10b981'}">Bugs: ${f.uniqueBugs}</span>
                <span>Coverage: ${f.coverage}</span>
              </div>
              <div class="fuzz-meta">
                <span>Duration: ${f.duration}</span>
                <span>Last: ${f.lastRun}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }  // ========== Threat Intelligence Platform ==========
  private _renderSTIXViewer() {
    const objects = [
      { id: 'STIX-001', type: 'indicator', name: 'Malicious IP 185.220.101.34', pattern: 'ipv4-addr:value = 185.220.101.34', confidence: 95, created: '2026-04-20', source: 'MISP Community', killChain: 'reconnaissance' },
      { id: 'STIX-002', type: 'malware', name: 'Cobalt Strike Beacon v4.8', pattern: 'file:hashes.MD5 = a1b2c3d4e5f6', confidence: 98, created: '2026-04-19', source: 'MITRE ATT&CK', killChain: 'weaponization' },
      { id: 'STIX-003', type: 'attack-pattern', name: 'T1059.001 - PowerShell', pattern: 'process:command_line MATCHES *-encodedcommand*', confidence: 90, created: '2026-04-18', source: 'Internal Analysis', killChain: 'execution' },
      { id: 'STIX-004', type: 'threat-actor', name: 'APT29 (Cozy Bear)', pattern: 'threat-actor:name = APT29', confidence: 92, created: '2026-04-17', source: 'FBI/CISA Advisory', killChain: 'multiple' },
      { id: 'STIX-005', type: 'vulnerability', name: 'CVE-2024-3400 - PAN-OS Command Injection', pattern: 'vulnerability:name = CVE-2024-3400', confidence: 100, created: '2026-04-15', source: 'NVD', killChain: 'initial-access' },
      { id: 'STIX-006', type: 'identity', name: 'Suspicious Domain gate-secure.com', pattern: 'domain-name:value = gate-secure.com', confidence: 78, created: '2026-04-23', source: 'PassiveDNS', killChain: 'reconnaissance' },
    ];
    return html`
      <section class="stix-viewer">
        <h4>Structured Threat Information (STIX) Viewer</h4>
        <div class="stix-grid">
          ${objects.map(o => html`
            <div class="stix-card">
              <div class="stix-header">
                <span class="stix-type">${o.type.toUpperCase()}</span>
                <span class="stix-confidence" style="color:${o.confidence > 90 ? '#10b981' : o.confidence > 80 ? '#f59e0b' : '#ef4444'}">${o.confidence}%</span>
              </div>
              <div class="stix-name">${o.name}</div>
              <div class="stix-pattern"><code>${o.pattern}</code></div>
              <div class="stix-meta">
                <span>Source: ${o.source}</span>
                <span>Kill Chain: ${o.killChain}</span>
                <span>${o.created}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderTAXIIFeeds() {
    const feeds = [
      { id: 'TAXII-01', name: 'MITRE ATT&CK Enterprise', url: 'https://cti-taxii.mitre.org/stix', status: 'connected', lastPoll: '2026-04-23 12:00', objectsReceived: 1245, collections: 3, protocol: 'TAXII 2.1' },
      { id: 'TAXII-02', name: 'CISA Advisory Feed', url: 'https://www.cisa.gov/taxii', status: 'connected', lastPoll: '2026-04-23 11:30', objectsReceived: 87, collections: 2, protocol: 'TAXII 2.1' },
      { id: 'TAXII-03', name: 'AlienVault OTX', url: 'https://otx.alienvault.com/taxii', status: 'connected', lastPoll: '2026-04-23 12:15', objectsReceived: 3421, collections: 8, protocol: 'TAXII 2.0' },
      { id: 'TAXII-04', name: 'Anomali ThreatStream', url: 'https://threatstream.anomali.com/taxii', status: 'error', lastPoll: '2026-04-22 18:00', objectsReceived: 0, collections: 0, protocol: 'TAXII 2.1' },
      { id: 'TAXII-05', name: 'Internal Intel Sharing', url: 'https://intel.internal.corp/taxii', status: 'connected', lastPoll: '2026-04-23 12:00', objectsReceived: 156, collections: 4, protocol: 'TAXII 2.1' },
    ];
    const statusColor = (s: string) => s === 'connected' ? '#10b981' : '#ef4444';
    return html`
      <section class="taxii-feeds">
        <h4>TAXII Feed Management</h4>
        <div class="taxii-list">
          ${feeds.map(f => html`
            <div class="taxii-card" style="border-left:4px solid ${statusColor(f.status)}">
              <div class="taxii-header">
                <span class="taxii-name">${f.name}</span>
                <span class="taxii-status" style="color:${statusColor(f.status)}">${f.status.toUpperCase()}</span>
              </div>
              <div class="taxii-url"><code>${f.url}</code></div>
              <div class="taxii-meta">
                <span>Protocol: ${f.protocol}</span>
                <span>Collections: ${f.collections}</span>
                <span>Objects: ${f.objectsReceived.toLocaleString()}</span>
                <span>Last Poll: ${f.lastPoll}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderIntelSharingWorkflow() {
    const shares = [
      { id: 'SHARE-001', direction: 'outbound', partner: 'Industry ISAC', classification: 'TLP:AMBER', objects: 12, status: 'approved', date: '2026-04-22' },
      { id: 'SHARE-002', direction: 'inbound', partner: 'CISA', classification: 'TLP:CLEAR', objects: 45, status: 'received', date: '2026-04-23' },
      { id: 'SHARE-003', direction: 'outbound', partner: 'Partner Org A', classification: 'TLP:GREEN', objects: 5, status: 'pending_review', date: '2026-04-23' },
      { id: 'SHARE-004', direction: 'inbound', partner: 'FBI IC3', classification: 'TLP:AMBER+STRICT', objects: 3, status: 'received', date: '2026-04-21' },
    ];
    return html`
      <section class="intel-sharing">
        <h4>Intelligence Sharing Workflow</h4>
        <div class="share-list">
          ${shares.map(s => html`
            <div class="share-card" style="border-left:4px solid ${s.direction === 'outbound' ? '#3b82f6' : '#8b5cf6'}">
              <div class="share-header">
                <span class="share-direction">${s.direction === 'outbound' ? 'OUTBOUND' : 'INBOUND'}</span>
                <span class="share-partner">${s.partner}</span>
                <span class="share-classification">${s.classification}</span>
              </div>
              <div class="share-meta">
                <span>${s.objects} objects</span>
                <span>${s.date}</span>
                <span class="share-status">${s.status.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }  // ========== Security Operations Workflow ==========
  private _renderIncidentTriageMatrix() {
    const matrix = [
      { alertType: 'Malware Detection', criteria: 'Known malware hash + execution', autoSeverity: 'high', autoAction: 'Isolate endpoint + notify IR', sla: '15min', overrideAllowed: true },
      { alertType: 'Brute Force', criteria: '>50 failed logins in 5min from single IP', autoSeverity: 'medium', autoAction: 'Block IP + alert SOC', sla: '30min', overrideAllowed: true },
      { alertType: 'Data Exfiltration', criteria: '>500MB upload to external in 1hr', autoSeverity: 'critical', autoAction: 'Block transfer + page on-call', sla: '5min', overrideAllowed: false },
      { alertType: 'Privilege Escalation', criteria: 'User added to admin group outside change window', autoSeverity: 'high', autoAction: 'Revert change + alert security team', sla: '10min', overrideAllowed: false },
      { alertType: 'Phishing Report', criteria: 'User reported suspicious email', autoSeverity: 'low', autoAction: 'Quarantine email + analyze headers', sla: '60min', overrideAllowed: true },
      { alertType: 'DDoS Indicator', criteria: '>10x normal request rate', autoSeverity: 'high', autoAction: 'Enable rate limiting + notify NOC', sla: '10min', overrideAllowed: true },
      { alertType: 'Unauthorized Access', criteria: 'Login from impossible travel location', autoSeverity: 'critical', autoAction: 'Force MFA + lock account + page IR', sla: '5min', overrideAllowed: false },
      { alertType: 'Configuration Drift', criteria: 'Security control disabled on production', autoSeverity: 'high', autoAction: 'Auto-remediate + notify change board', sla: '15min', overrideAllowed: true },
    ];
    const sevColor = (s: string) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <section class="incident-triage-matrix">
        <h4>Incident Severity Auto-Triage Matrix</h4>
        <div class="triage-list">
          ${matrix.map(m => html`
            <div class="triage-card" style="border-left:4px solid ${sevColor(m.autoSeverity)}">
              <div class="triage-header">
                <span class="triage-type">${m.alertType}</span>
                <span class="triage-severity" style="color:${sevColor(m.autoSeverity)}">${m.autoSeverity.toUpperCase()}</span>
                <span class="triage-sla">SLA: ${m.sla}</span>
              </div>
              <div class="triage-criteria"><strong>Criteria:</strong> ${m.criteria}</div>
              <div class="triage-action"><strong>Auto Action:</strong> ${m.autoAction}</div>
              <div class="triage-override">Override: ${m.overrideAllowed ? 'ALLOWED' : 'NOT ALLOWED'}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderRunbookTrigger() {
    const runbooks = [
      { id: 'RB-001', name: 'Malware Isolation Playbook', triggerAlert: 'Malware Detection', steps: 8, avgRunTime: '12min', lastExecuted: '2026-04-22 14:30', successRate: '95%', autoRun: true },
      { id: 'RB-002', name: 'DDoS Mitigation Playbook', triggerAlert: 'DDoS Indicator', steps: 12, avgRunTime: '8min', lastExecuted: '2026-04-20 03:15', successRate: '88%', autoRun: true },
      { id: 'RB-003', name: 'Credential Compromise Response', triggerAlert: 'Unauthorized Access', steps: 15, avgRunTime: '25min', lastExecuted: '2026-04-18 09:45', successRate: '92%', autoRun: false },
      { id: 'RB-004', name: 'Data Leak Containment', triggerAlert: 'Data Exfiltration', steps: 10, avgRunTime: '18min', lastExecuted: '2026-04-15 16:20', successRate: '90%', autoRun: true },
      { id: 'RB-005', name: 'Phishing Investigation', triggerAlert: 'Phishing Report', steps: 6, avgRunTime: '5min', lastExecuted: '2026-04-23 10:00', successRate: '98%', autoRun: true },
    ];
    return html`
      <section class="runbook-trigger">
        <h4>Runbook Auto-Trigger</h4>
        <div class="runbook-list">
          ${runbooks.map(r => html`
            <div class="runbook-card">
              <div class="runbook-header">
                <span class="runbook-id">${r.id}</span>
                <span class="runbook-name">${r.name}</span>
                <span class="runbook-auto">${r.autoRun ? 'AUTO' : 'MANUAL'}</span>
              </div>
              <div class="runbook-meta">
                <span>Trigger: ${r.triggerAlert}</span>
                <span>Steps: ${r.steps}</span>
                <span>Avg: ${r.avgRunTime}</span>
                <span>Success: ${r.successRate}</span>
              </div>
              <div class="runbook-last">Last executed: ${r.lastExecuted}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderShiftHandoff() {
    const checklist = [
      { item: 'Review open incidents - confirm ownership transfer', completed: true, assignee: 'Night Shift' },
      { item: 'Check active threat hunts - update status', completed: true, assignee: 'Night Shift' },
      { item: 'Verify monitoring dashboards - no suppressed alerts', completed: false, assignee: 'Day Shift' },
      { item: 'Review pending escalation requests', completed: false, assignee: 'Day Shift' },
      { item: 'Update SOC metrics board', completed: true, assignee: 'Night Shift' },
      { item: 'Check on-call rotation for next 24h', completed: false, assignee: 'Day Shift' },
      { item: 'Document any anomalies or pattern changes', completed: true, assignee: 'Night Shift' },
      { item: 'Verify backup and log shipping status', completed: false, assignee: 'Day Shift' },
    ];
    return html`
      <section class="shift-handoff">
        <h4>Shift Handoff Checklist</h4>
        <div class="handoff-list">
          ${checklist.map(c => html`
            <div class="handoff-item ${c.completed ? 'completed' : 'pending'}">
              <span class="handoff-check">${c.completed ? '[x]' : '[ ]'}</span>
              <span class="handoff-text">${c.item}</span>
              <span class="handoff-assignee">${c.assignee}</span>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderEscalationTree() {
    const levels = [
      { level: 1, name: 'Tier 1 SOC Analyst', criteria: 'All alerts initial triage', authority: 'Block IPs, quarantine emails, create tickets', escalateAfter: '15min unresolved', escalateTo: 'Tier 2' },
      { level: 2, name: 'Tier 2 SOC Analyst', criteria: 'Confirmed threats, multi-vector attacks', authority: 'Isolate endpoints, disable accounts, engage IR', escalateAfter: '30min or critical severity', escalateTo: 'Tier 3 / IR Lead' },
      { level: 3, name: 'IR Lead / Security Engineer', criteria: 'Active breaches, APT indicators', authority: 'Full system access, engage external partners, legal', escalateAfter: 'Confirmed data breach', escalateTo: 'CISO / Executive Team' },
      { level: 4, name: 'CISO', criteria: 'Material breach, regulatory notification required', authority: 'Executive decisions, external communications, legal counsel', escalateAfter: 'Board notification threshold', escalateTo: 'Board / Legal' },
    ];
    const levelColor = (l: number) => l === 1 ? '#3b82f6' : l === 2 ? '#f59e0b' : l === 3 ? '#f97316' : '#ef4444';
    return html`
      <section class="escalation-tree">
        <h4>Escalation Decision Tree</h4>
        <div class="escalation-list">
          ${levels.map(l => html`
            <div class="escalation-card" style="border-left:4px solid ${levelColor(l.level)}">
              <div class="escalation-header">
                <span class="escalation-level" style="background:${levelColor(l.level)}20;color:${levelColor(l.level)}">L${l.level}</span>
                <span class="escalation-name">${l.name}</span>
              </div>
              <div class="escalation-criteria"><strong>When:</strong> ${l.criteria}</div>
              <div class="escalation-authority"><strong>Can:</strong> ${l.authority}</div>
              <div class="escalation-escalate">Escalate after: ${l.escalateAfter} -> ${l.escalateTo}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderPostIncidentTracker() {
    const incidents = [
      { id: 'INC-2026-042', title: 'Ransomware Attempt Blocked', severity: 'critical', closedDate: '2026-04-20', actions: 8, completed: 6, overdue: 1, rootCause: 'Phishing email bypassed spam filter' },
      { id: 'INC-2026-039', title: 'AWS Credential Exposure', severity: 'high', closedDate: '2026-04-18', actions: 5, completed: 5, overdue: 0, rootCause: 'CI/CD pipeline misconfiguration' },
      { id: 'INC-2026-035', title: 'DDoS Attack on API Gateway', severity: 'medium', closedDate: '2026-04-15', actions: 4, completed: 3, overdue: 1, rootCause: 'Insufficient rate limiting configuration' },
      { id: 'INC-2026-031', title: 'Insider Data Access Anomaly', severity: 'high', closedDate: '2026-04-12', actions: 6, completed: 4, overdue: 2, rootCause: 'Excessive permissions granted during onboarding' },
    ];
    const sevColor = (s: string) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : '#eab308';
    return html`
      <section class="post-incident-tracker">
        <h4>Post-Incident Action Item Tracker</h4>
        <div class="incident-action-list">
          ${incidents.map(i => {
            const pct = Math.round((i.completed / i.actions) * 100);
            return html`
              <div class="incident-action-card" style="border-left:4px solid ${sevColor(i.severity)}">
                <div class="ia-header">
                  <span class="ia-id">${i.id}</span>
                  <span class="ia-title">${i.title}</span>
                  <span class="ia-severity" style="color:${sevColor(i.severity)}">${i.severity.toUpperCase()}</span>
                </div>
                <div class="ia-root-cause"><strong>Root Cause:</strong> ${i.rootCause}</div>
                <div class="ia-progress">
                  <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${pct === 100 ? '#10b981' : '#3b82f6'}"></div></div>
                  <span>${i.completed}/${i.actions} actions (${pct}%)</span>
                </div>
                <div class="ia-meta">
                  <span>Closed: ${i.closedDate}</span>
                  ${i.overdue > 0 ? html`<span class="ia-overdue" style="color:#ef4444">${i.overdue} OVERDUE</span>` : ''}
                </div>
              </div>`;
          }).join('')}
        </div>
      </section>`;
  }


  private _renderCloudNativeSecurity() {
    const clusters = [
      { name: 'prod-us-east-1', pods: 342, nodes: 24, criticalIssues: 3, highIssues: 12, compliance: 87, imageScans: '98.2%', networkPolicies: 156, rbacRules: 89, runtimeAlerts: 2 },
      { name: 'prod-eu-west-1', pods: 218, nodes: 16, criticalIssues: 1, highIssues: 8, compliance: 92, imageScans: '97.1%', networkPolicies: 124, rbacRules: 67, runtimeAlerts: 0 },
      { name: 'staging-us-east-1', pods: 95, nodes: 8, criticalIssues: 0, highIssues: 5, compliance: 78, imageScans: '89.5%', networkPolicies: 67, rbacRules: 34, runtimeAlerts: 1 },
      { name: 'dev-us-east-1', pods: 156, nodes: 12, criticalIssues: 2, highIssues: 15, compliance: 65, imageScans: '76.3%', networkPolicies: 45, rbacRules: 23, runtimeAlerts: 4 },
    ];
    const meshPolicies = [
      { name: 'mTLS Enforcement', status: 'enforced', coverage: '94%', services: 312, exceptions: 18 },
      { name: 'Rate Limiting', status: 'enforced', coverage: '100%', services: 312, exceptions: 0 },
      { name: 'Circuit Breaker', status: 'partial', coverage: '67%', services: 209, exceptions: 103 },
      { name: 'Request Auth', status: 'enforced', coverage: '88%', services: 275, exceptions: 37 },
    ];
    const serverlessFunctions = [
      { name: 'auth-handler', runtime: 'nodejs18', risk: 'medium', lastDeploy: '2026-04-22', vulnerabilities: 2, invocations: '1.2M/day', coldStart: '120ms', timeout: '30s' },
      { name: 'data-processor', runtime: 'python3.11', risk: 'low', lastDeploy: '2026-04-21', vulnerabilities: 0, invocations: '890K/day', coldStart: '85ms', timeout: '60s' },
      { name: 'notification-svc', runtime: 'go1.21', risk: 'high', lastDeploy: '2026-04-15', vulnerabilities: 5, invocations: '450K/day', coldStart: '45ms', timeout: '15s' },
      { name: 'analytics-pipeline', runtime: 'java17', risk: 'medium', lastDeploy: '2026-04-20', vulnerabilities: 1, invocations: '2.1M/day', coldStart: '350ms', timeout: '120s' },
    ];
    const riskColor = (r: string) => r === 'high' ? '#ef4444' : r === 'medium' ? '#f59e0b' : '#10b981';
    return html`
      <section class="cloud-native-security">
        <h4>Cloud-Native Security Dashboard</h4>
        <div class="k8s-clusters">
          <h5>Kubernetes Cluster Security</h5>
          <div class="cluster-grid">
            ${clusters.map(c => html`
              <div class="cluster-card" style="border-left:4px solid ${c.criticalIssues > 0 ? '#ef4444' : '#10b981'}">
                <div class="cluster-name">${c.name}</div>
                <div class="cluster-stats">
                  <div class="cs-stat"><span class="cs-label">Pods</span><span class="cs-val">${c.pods}</span></div>
                  <div class="cs-stat"><span class="cs-label">Nodes</span><span class="cs-val">${c.nodes}</span></div>
                  <div class="cs-stat"><span class="cs-label">Critical</span><span class="cs-val" style="color:#ef4444">${c.criticalIssues}</span></div>
                  <div class="cs-stat"><span class="cs-label">High</span><span class="cs-val" style="color:#f59e0b">${c.highIssues}</span></div>
                  <div class="cs-stat"><span class="cs-label">Compliance</span><span class="cs-val">${c.compliance}%</span></div>
                  <div class="cs-stat"><span class="cs-label">Image Scans</span><span class="cs-val">${c.imageScans}</span></div>
                  <div class="cs-stat"><span class="cs-label">Net Policies</span><span class="cs-val">${c.networkPolicies}</span></div>
                  <div class="cs-stat"><span class="cs-label">RBAC Rules</span><span class="cs-val">${c.rbacRules}</span></div>
                </div>
                ${c.runtimeAlerts > 0 ? html`<div class="runtime-alert">Runtime Alerts: ${c.runtimeAlerts}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
        <div class="service-mesh-policies">
          <h5>Service Mesh Security Policies</h5>
          <div class="mesh-table">
            ${meshPolicies.map(p => html`
              <div class="mesh-row">
                <span class="mesh-name">${p.name}</span>
                <span class="mesh-status" style="color:${p.status === 'enforced' ? '#10b981' : '#f59e0b'}">${p.status}</span>
                <span class="mesh-coverage">${p.coverage}</span>
                <span class="mesh-services">${p.services} services</span>
                <span class="mesh-exceptions">${p.exceptions} exceptions</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="serverless-risk">
          <h5>Serverless Function Risk Scoring</h5>
          <div class="fn-grid">
            ${serverlessFunctions.map(fn => html`
              <div class="fn-card" style="border-left:4px solid ${riskColor(fn.risk)}">
                <div class="fn-name">${fn.name}</div>
                <div class="fn-meta">
                  <span>${fn.runtime}</span>
                  <span>Risk: <strong style="color:${riskColor(fn.risk)}">${fn.risk.toUpperCase()}</strong></span>
                  <span>Vulns: ${fn.vulnerabilities}</span>
                </div>
                <div class="fn-ops">
                  <span>${fn.invocations}</span>
                  <span>Cold Start: ${fn.coldStart}</span>
                  <span>Timeout: ${fn.timeout}</span>
                  <span>Deployed: ${fn.lastDeploy}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`;
  }



  private _renderPlaybookLibrary() {
    const playbooks = [
      { id: 'PB-001', name: 'Ransomware Response', version: '3.2.1', status: 'active', steps: 14, avgTime: '4.2h', successRate: 94, lastRun: '2026-04-20', author: 'SOC Team Alpha', category: 'Incident Response' },
      { id: 'PB-002', name: 'Phishing Triage', version: '2.8.0', status: 'active', steps: 8, avgTime: '0.8h', successRate: 97, lastRun: '2026-04-22', author: 'IR Lead', category: 'Incident Response' },
      { id: 'PB-003', name: 'Data Breach Notification', version: '4.1.0', status: 'active', steps: 22, avgTime: '48h', successRate: 89, lastRun: '2026-03-15', author: 'Legal & Privacy', category: 'Compliance' },
      { id: 'PB-004', name: 'Cloud Infrastructure Recovery', version: '1.5.2', status: 'draft', steps: 18, avgTime: '6.1h', successRate: 85, lastRun: '2026-04-18', author: 'Cloud Ops', category: 'Recovery' },
      { id: 'PB-005', name: 'Insider Threat Investigation', version: '2.3.0', status: 'active', steps: 16, avgTime: '12h', successRate: 78, lastRun: '2026-04-10', author: 'HR Security', category: 'Investigation' },
      { id: 'PB-006', name: 'DDoS Mitigation', version: '5.0.1', status: 'active', steps: 10, avgTime: '2.1h', successRate: 96, lastRun: '2026-04-21', author: 'Network Team', category: 'Incident Response' },
      { id: 'PB-007', name: 'Third-Party Breach Assessment', version: '1.2.0', status: 'review', steps: 20, avgTime: '24h', successRate: 82, lastRun: '2026-02-28', author: 'Vendor Mgmt', category: 'Assessment' },
      { id: 'PB-008', name: 'Zero-Day Vulnerability Patch', version: '3.0.0', status: 'active', steps: 12, avgTime: '8h', successRate: 91, lastRun: '2026-04-19', author: 'Patch Team', category: 'Vulnerability' },
      { id: 'PB-009', name: 'Executive Impersonation Response', version: '2.1.0', status: 'active', steps: 9, avgTime: '1.5h', successRate: 93, lastRun: '2026-04-17', author: 'CISO Office', category: 'Social Engineering' },
      { id: 'PB-010', name: 'Supply Chain Compromise', version: '1.0.0', status: 'draft', steps: 25, avgTime: '72h', successRate: 0, lastRun: 'Never', author: 'Threat Intel', category: 'Advanced Threats' },
    ];
    const statusColors: Record<string, string> = { active: '#10b981', draft: '#f59e0b', review: '#3b82f6', archived: '#6b7280' };
    return html`
      <section class="playbook-library">
        <div class="pb-header">
          <h4>Security Orchestration Playbook Library</h4>
        </div>
        <div class="pb-grid">
          ${playbooks.map(pb => html`
            <div class="pb-card" style="border-top:3px solid ${statusColors[pb.status]}">
              <div class="pb-card-header">
                <span class="pb-id">${pb.id}</span>
                <span class="pb-status-badge" style="background:${statusColors[pb.status]}22;color:${statusColors[pb.status]}">${pb.status.toUpperCase()}</span>
              </div>
              <div class="pb-name">${pb.name}</div>
              <div class="pb-meta">
                <span>v${pb.version}</span>
                <span>${pb.category}</span>
                <span>${pb.steps} steps</span>
                <span>Avg: ${pb.avgTime}</span>
              </div>
              <div class="pb-metrics">
                <div class="pb-metric">
                  <span class="pb-metric-label">Success Rate</span>
                  <div class="mini-bar"><div class="mini-fill" style="width:${pb.successRate}%;background:${pb.successRate >= 90 ? '#10b981' : pb.successRate >= 80 ? '#f59e0b' : '#ef4444'}"></div></div>
                  <span class="pb-metric-val">${pb.successRate}%</span>
                </div>
                <div class="pb-metric">
                  <span class="pb-metric-label">Last Run</span>
                  <span class="pb-metric-val">${pb.lastRun}</span>
                </div>
              </div>
              <div class="pb-author">Author: ${pb.author}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderToolchainIntegration() {
    const tools = [
      { name: 'CrowdStrike Falcon', category: 'EDR', version: '7.12.0', status: 'healthy', lastSync: '5m ago', alerts: 3, apiCalls: '12.4K/hr', license: 'Enterprise', expiry: '2026-12-31' },
      { name: 'Palo Alto Prisma', category: 'CSPM', version: '3.8.2', status: 'healthy', lastSync: '2m ago', alerts: 8, apiCalls: '8.2K/hr', license: 'Premium', expiry: '2026-09-15' },
      { name: 'Splunk Enterprise', category: 'SIEM', version: '9.2.1', status: 'degraded', lastSync: '15m ago', alerts: 12, apiCalls: '45.6K/hr', license: 'Enterprise', expiry: '2027-03-01' },
      { name: 'Snyk', category: 'SCA', version: '1.1200.0', status: 'healthy', lastSync: '1m ago', alerts: 156, apiCalls: '22.1K/hr', license: 'Team', expiry: '2026-07-22' },
      { name: 'Tenable.io', category: 'VA', version: '6.14.0', status: 'healthy', lastSync: '10m ago', alerts: 42, apiCalls: '5.8K/hr', license: 'Professional', expiry: '2026-11-30' },
      { name: 'HashiCorp Vault', category: 'Secrets', version: '1.16.2', status: 'healthy', lastSync: '30s ago', alerts: 0, apiCalls: '34.2K/hr', license: 'Enterprise', expiry: '2027-06-01' },
      { name: 'Opa Gatekeeper', category: 'Policy', version: '3.15.0', status: 'healthy', lastSync: '1m ago', alerts: 5, apiCalls: '18.7K/hr', license: 'OSS', expiry: 'N/A' },
      { name: 'Aqua Security', category: 'Container', version: '2024.4.2', status: 'warning', lastSync: '8m ago', alerts: 11, apiCalls: '9.3K/hr', license: 'Enterprise', expiry: '2026-08-15' },
    ];
    const dataFlows = [
      { from: 'CrowdStrike', to: 'Splunk', type: 'alerts', volume: '2.1K/min', latency: '3s', status: 'active' },
      { from: 'Palo Alto', to: 'Splunk', type: 'logs', volume: '5.4K/min', latency: '5s', status: 'active' },
      { from: 'Snyk', to: 'Jira', type: 'vulns', volume: '120/hr', latency: '15s', status: 'active' },
      { from: 'Tenable', to: 'ServiceNow', type: 'findings', volume: '80/hr', latency: '30s', status: 'active' },
      { from: 'Aqua', to: 'Splunk', type: 'runtime', volume: '8.9K/min', latency: '4s', status: 'degraded' },
    ];
    const statusColor = (s: string) => s === 'healthy' ? '#10b981' : s === 'warning' ? '#f59e0b' : '#ef4444';
    return html`
      <section class="toolchain-integration">
        <h4>Security Toolchain Integration</h4>
        <div class="tool-inventory">
          <h5>Tool Inventory and Health</h5>
          <div class="tool-grid">
            ${tools.map(t => html`
              <div class="tool-card" style="border-top:3px solid ${statusColor(t.status)}">
                <div class="tool-name">${t.name}</div>
                <div class="tool-meta">
                  <span class="tool-category">${t.category}</span>
                  <span>v${t.version}</span>
                  <span class="tool-status" style="color:${statusColor(t.status)}">${t.status.toUpperCase()}</span>
                </div>
                <div class="tool-stats">
                  <span>Sync: ${t.lastSync}</span>
                  <span>Alerts: ${t.alerts}</span>
                  <span>API: ${t.apiCalls}</span>
                </div>
                <div class="tool-license">
                  <span>${t.license}</span>
                  <span>Expires: ${t.expiry}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="tool-data-flows">
          <h5>Data Flow Between Tools</h5>
          <div class="flow-list">
            ${dataFlows.map(f => html`
              <div class="flow-row" style="border-left:3px solid ${f.status === 'active' ? '#10b981' : '#f59e0b'}">
                <span class="flow-from">${f.from}</span>
                <span class="flow-arrow">-></span>
                <span class="flow-to">${f.to}</span>
                <span class="flow-type">${f.type}</span>
                <span class="flow-volume">${f.volume}</span>
                <span class="flow-latency">Latency: ${f.latency}</span>
                <span class="flow-status">${f.status}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`;
  }



  private _renderCloudNativeSecurity() {
    const clusters = [
      { name: 'prod-us-east-1', pods: 342, nodes: 24, criticalIssues: 3, highIssues: 12, compliance: 87, imageScans: '98.2%', networkPolicies: 156, rbacRules: 89, runtimeAlerts: 2 },
      { name: 'prod-eu-west-1', pods: 218, nodes: 16, criticalIssues: 1, highIssues: 8, compliance: 92, imageScans: '97.1%', networkPolicies: 124, rbacRules: 67, runtimeAlerts: 0 },
      { name: 'staging-us-east-1', pods: 95, nodes: 8, criticalIssues: 0, highIssues: 5, compliance: 78, imageScans: '89.5%', networkPolicies: 67, rbacRules: 34, runtimeAlerts: 1 },
      { name: 'dev-us-east-1', pods: 156, nodes: 12, criticalIssues: 2, highIssues: 15, compliance: 65, imageScans: '76.3%', networkPolicies: 45, rbacRules: 23, runtimeAlerts: 4 },
    ];
    const riskColor = (r: string) => r === 'high' ? '#ef4444' : r === 'medium' ? '#f59e0b' : '#10b981';
    return html`
      <section class="cloud-native-security">
        <h4>Cloud-Native Security Dashboard</h4>
        <div class="k8s-clusters">
          <h5>Kubernetes Cluster Security</h5>
          <div class="cluster-grid">
            ${clusters.map(c => html`
              <div class="cluster-card" style="border-left:4px solid ${c.criticalIssues > 0 ? '#ef4444' : '#10b981'}">
                <div class="cluster-name">${c.name}</div>
                <div class="cluster-stats">
                  <div class="cs-stat"><span class="cs-label">Pods</span><span class="cs-val">${c.pods}</span></div>
                  <div class="cs-stat"><span class="cs-label">Nodes</span><span class="cs-val">${c.nodes}</span></div>
                  <div class="cs-stat"><span class="cs-label">Critical</span><span class="cs-val" style="color:#ef4444">${c.criticalIssues}</span></div>
                  <div class="cs-stat"><span class="cs-label">High</span><span class="cs-val" style="color:#f59e0b">${c.highIssues}</span></div>
                  <div class="cs-stat"><span class="cs-label">Compliance</span><span class="cs-val">${c.compliance}%</span></div>
                  <div class="cs-stat"><span class="cs-label">Image Scans</span><span class="cs-val">${c.imageScans}</span></div>
                  <div class="cs-stat"><span class="cs-label">Net Policies</span><span class="cs-val">${c.networkPolicies}</span></div>
                  <div class="cs-stat"><span class="cs-label">RBAC Rules</span><span class="cs-val">${c.rbacRules}</span></div>
                </div>
                ${c.runtimeAlerts > 0 ? html`<div class="runtime-alert">Runtime Alerts: ${c.runtimeAlerts}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </section>`;
  }


  private _renderBudgetPlanning() {
    const budgetData = [
      { category: "Personnel & Training", planned: 4171000, actual: 2203000, utilization: 52.8, q1: "30%", q2: "35%", q3: "33%", q4: "25%" },
      { category: "Tooling & Licensing", planned: 4178000, actual: 2216000, utilization: 53.0, q1: "17%", q2: "24%", q3: "28%", q4: "10%" },
      { category: "Infrastructure Security", planned: 4185000, actual: 2229000, utilization: 53.3, q1: "20%", q2: "29%", q3: "23%", q4: "11%" },
      { category: "Compliance & Audit", planned: 4192000, actual: 2242000, utilization: 53.5, q1: "23%", q2: "34%", q3: "18%", q4: "12%" },
      { category: "Incident Response", planned: 4199000, actual: 2255000, utilization: 53.7, q1: "26%", q2: "23%", q3: "29%", q4: "13%" },
      { category: "Third-Party Assessments", planned: 4206000, actual: 2268000, utilization: 53.9, q1: "29%", q2: "28%", q3: "24%", q4: "14%" },
      { category: "Security Awareness", planned: 4213000, actual: 2281000, utilization: 54.1, q1: "16%", q2: "33%", q3: "19%", q4: "15%" },
      { category: "Research & Innovation", planned: 4220000, actual: 2294000, utilization: 54.4, q1: "19%", q2: "22%", q3: "30%", q4: "16%" },
    ];
    const totalBudget = budgetData.reduce((s, d) => s + d.planned, 0);
    const totalSpent = budgetData.reduce((s, d) => s + d.actual, 0);
    const overallUtil = ((totalSpent / totalBudget) * 100).toFixed(1);
    const headcount = [
      { team: "SOC Tier 1", current: 10, target: 22, gap: 3, avgSalary: "121k" },
      { team: "SOC Tier 2", current: 2, target: 21, gap: 2, avgSalary: "150k" },
      { team: "Threat Intel", current: 11, target: 20, gap: 1, avgSalary: "179k" },
      { team: "Red Team", current: 3, target: 19, gap: 0, avgSalary: "97k" },
      { team: "GRC", current: 12, target: 18, gap: 5, avgSalary: "126k" },
      { team: "AppSec", current: 4, target: 17, gap: 4, avgSalary: "155k" },
      { team: "Cloud Sec", current: 13, target: 16, gap: 3, avgSalary: "184k" },
      { team: "Identity & Access", current: 5, target: 15, gap: 2, avgSalary: "102k" },
    ];
    const vendorSpend = [
      { vendor: "CrowdStrike", annual: "179k", contractEnd: "2026-04", renewalRisk: "Low", satisfaction: 3 },
      { vendor: "Palo Alto", annual: "210k", contractEnd: "2026-05", renewalRisk: "Medium", satisfaction: 5 },
      { vendor: "Splunk", annual: "241k", contractEnd: "2026-06", renewalRisk: "High", satisfaction: 4 },
      { vendor: "Qualys", annual: "272k", contractEnd: "2026-07", renewalRisk: "Low", satisfaction: 3 },
      { vendor: "Rapid7", annual: "303k", contractEnd: "2026-08", renewalRisk: "Medium", satisfaction: 5 },
      { vendor: "Mandiant", annual: "334k", contractEnd: "2026-09", renewalRisk: "High", satisfaction: 4 },
      { vendor: "Zscaler", annual: "365k", contractEnd: "2026-10", renewalRisk: "Low", satisfaction: 3 },
      { vendor: "Duo Security", annual: "396k", contractEnd: "2026-11", renewalRisk: "Medium", satisfaction: 5 },
    ];
    const roiProjections = [
      { area: "Threat Detection", investment: "118k", projectedReturn: "852k", roiMultiple: "2.0x", confidence: 87 },
      { area: "Incident Reduction", investment: "161k", projectedReturn: "899k", roiMultiple: "1.9x", confidence: 68 },
      { area: "Compliance Savings", investment: "204k", projectedReturn: "946k", roiMultiple: "1.8x", confidence: 85 },
      { area: "Automation Gains", investment: "247k", projectedReturn: "993k", roiMultiple: "1.7x", confidence: 66 },
      { area: "Risk Avoidance", investment: "290k", projectedReturn: "1040k", roiMultiple: "1.6x", confidence: 83 },
    ];
    return html`
      <section class="budget-planning">
        <h4>Budget & Resource Planning</h4>
        <div class="budget-overview">
          <div class="budget-card"><span class="blabel">Total Budget</span><span class="bval">${totalBudget.toLocaleString()}</span></div>
          <div class="budget-card"><span class="blabel">Total Spent</span><span class="bval">${totalSpent.toLocaleString()}</span></div>
          <div class="budget-card"><span class="blabel">Utilization</span><span class="bval">${overallUtil}%</span></div>
          <div class="budget-card"><span class="blabel">Remaining</span><span class="bval">${(totalBudget - totalSpent).toLocaleString()}</span></div>
        </div>
        <div class="budget-table">
          <h5>Category Breakdown</h5>
          <div class="bt-header"><span>Category</span><span>Planned</span><span>Actual</span><span>Util</span><span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span></div>
          ${budgetData.map(b => html`
            <div class="bt-row"><span>${b.category}</span><span>${(b.planned/1000).toFixed(0)}k</span><span>${(b.actual/1000).toFixed(0)}k</span><span>${b.utilization}%</span><span>${b.q1}</span><span>${b.q2}</span><span>${b.q3}</span><span>${b.q4}</span></div>
          `).join("")}
        </div>
        <div class="budget-headcount">
          <h5>Headcount Planning</h5>
          ${headcount.map(h => html`
            <div class="hc-row"><span>${h.team}</span><span>${h.current}/${h.target}</span><span>Gap: ${h.gap}</span><span>${h.avgSalary}</span></div>
          `).join("")}
        </div>
        <div class="budget-vendor">
          <h5>Vendor Spend Analysis</h5>
          ${vendorSpend.map(v => html`
            <div class="vs-row"><span>${v.vendor}</span><span>${v.annual}</span><span>Exp: ${v.contractEnd}</span><span>${v.renewalRisk}</span><span>${v.satisfaction}/5</span></div>
          `).join("")}
        </div>
        <div class="budget-roi">
          <h5>ROI Projections</h5>
          ${roiProjections.map(rp => html`
            <div class="roi-row"><span>${rp.area}</span><span>${rp.investment}</span><span>${rp.projectedReturn}</span><span>${rp.roiMultiple}</span><span>${rp.confidence}% conf</span></div>
          `).join("")}
        </div>
      </section>`;
  }

  private _renderMetricsNormalization() {
    const kpiCatalog = [
      { id: "kpi-1", name: "MTTD", owner: "SOC", unit: "minutes", target: 88, current: 77, benchmark: 69, collection: "auto", frequency: "realtime" },
      { id: "kpi-2", name: "MTTR", owner: "GRC", unit: "%", target: 91, current: 84, benchmark: 80, collection: "semi-auto", frequency: "daily" },
      { id: "kpi-3", name: "MTTC", owner: "AppSec", unit: "score", target: 94, current: 91, benchmark: 91, collection: "manual", frequency: "weekly" },
      { id: "kpi-4", name: "Vuln SLA Compliance", owner: "Cloud Sec", unit: "count", target: 97, current: 98, benchmark: 68, collection: "auto", frequency: "monthly" },
      { id: "kpi-5", name: "Patch Coverage", owner: "Identity", unit: "days", target: 70, current: 59, benchmark: 79, collection: "semi-auto", frequency: "realtime" },
      { id: "kpi-6", name: "Phishing Click Rate", owner: "Threat Intel", unit: "minutes", target: 73, current: 66, benchmark: 90, collection: "manual", frequency: "daily" },
      { id: "kpi-7", name: "Training Completion", owner: "Security Ops", unit: "%", target: 76, current: 73, benchmark: 67, collection: "auto", frequency: "weekly" },
      { id: "kpi-8", name: "Escalation Rate", owner: "Risk Mgmt", unit: "score", target: 79, current: 80, benchmark: 78, collection: "semi-auto", frequency: "monthly" },
      { id: "kpi-9", name: "False Positive Rate", owner: "SOC", unit: "count", target: 82, current: 87, benchmark: 89, collection: "manual", frequency: "realtime" },
      { id: "kpi-10", name: "Threat Intel Actionability", owner: "GRC", unit: "days", target: 85, current: 94, benchmark: 66, collection: "auto", frequency: "daily" },
      { id: "kpi-11", name: "Endpoint Compliance", owner: "AppSec", unit: "minutes", target: 88, current: 55, benchmark: 77, collection: "semi-auto", frequency: "weekly" },
      { id: "kpi-12", name: "Cloud Misconfig Score", owner: "Cloud Sec", unit: "%", target: 91, current: 62, benchmark: 88, collection: "manual", frequency: "monthly" },
      { id: "kpi-13", name: "Identity Anomaly Rate", owner: "Identity", unit: "score", target: 94, current: 69, benchmark: 65, collection: "auto", frequency: "realtime" },
      { id: "kpi-14", name: "DLP Events", owner: "Threat Intel", unit: "count", target: 97, current: 76, benchmark: 76, collection: "semi-auto", frequency: "daily" },
      { id: "kpi-15", name: "Vendor Risk Avg", owner: "Security Ops", unit: "days", target: 70, current: 83, benchmark: 87, collection: "manual", frequency: "weekly" },
      { id: "kpi-16", name: "Compliance Audit Pass Rate", owner: "Risk Mgmt", unit: "minutes", target: 73, current: 90, benchmark: 98, collection: "auto", frequency: "monthly" },
      { id: "kpi-17", name: "Awareness Score", owner: "SOC", unit: "%", target: 76, current: 97, benchmark: 75, collection: "semi-auto", frequency: "realtime" },
      { id: "kpi-18", name: "SOC Utilization", owner: "GRC", unit: "score", target: 79, current: 58, benchmark: 86, collection: "manual", frequency: "daily" },
      { id: "kpi-19", name: "Automation Coverage", owner: "AppSec", unit: "count", target: 82, current: 65, benchmark: 97, collection: "auto", frequency: "weekly" },
      { id: "kpi-20", name: "Risk Register Currency", owner: "Cloud Sec", unit: "days", target: 85, current: 72, benchmark: 74, collection: "semi-auto", frequency: "monthly" },
    ];
    const benchmarkSources = [
      { source: "NIST CSF", mappedKPIs: 3, alignment: 63, lastReview: "2026-01-27", status: "aligned" },
      { source: "CIS Controls v8", mappedKPIs: 4, alignment: 80, lastReview: "2026-02-22", status: "partial" },
      { source: "ISO 27001:2022", mappedKPIs: 5, alignment: 97, lastReview: "2026-03-17", status: "reviewing" },
      { source: "PCI DSS 4.0", mappedKPIs: 6, alignment: 75, lastReview: "2026-04-12", status: "aligned" },
      { source: "SOC 2 Type II", mappedKPIs: 7, alignment: 92, lastReview: "2026-05-07", status: "partial" },
      { source: "MITRE ATT&CK", mappedKPIs: 8, alignment: 70, lastReview: "2026-06-02", status: "reviewing" },
      { source: "SANS Top 20", mappedKPIs: 3, alignment: 87, lastReview: "2026-01-25", status: "aligned" },
      { source: "OWASP Top 10", mappedKPIs: 4, alignment: 65, lastReview: "2026-02-20", status: "partial" },
    ];
    const normalizationRules = [
      { rule: "Time metrics normalized to minutes", appliesTo: 6, exceptions: 0, version: "v1.8" },
      { rule: "Percentage metrics capped at 100", appliesTo: 5, exceptions: 1, version: "v1.5" },
      { rule: "Count metrics use 7-day rolling avg", appliesTo: 4, exceptions: 2, version: "v1.2" },
      { rule: "Score metrics use 0-100 scale", appliesTo: 3, exceptions: 0, version: "v1.9" },
      { rule: "Rate metrics per 1000 events", appliesTo: 7, exceptions: 1, version: "v1.6" },
    ];
    return html`
      <section class="metrics-normalization">
        <h4>Security Metrics Normalization</h4>
        <div class="mn-summary">
          <div class="mn-stat"><span class="blabel">Total KPIs</span><span class="bval">${kpiCatalog.length}</span></div>
          <div class="mn-stat"><span class="blabel">On Target</span><span class="bval">${kpiCatalog.filter(k => k.current >= k.target).length}</span></div>
          <div class="mn-stat"><span class="blabel">Below Target</span><span class="bval">${kpiCatalog.filter(k => k.current < k.target).length}</span></div>
          <div class="mn-stat"><span class="blabel">Auto-Collected</span><span class="bval">${kpiCatalog.filter(k => k.collection === "auto").length}</span></div>
        </div>
        <div class="mn-kpi-table">
          <h5>KPI Definition Catalog</h5>
          <div class="mn-header"><span>KPI</span><span>Owner</span><span>Unit</span><span>Target</span><span>Current</span><span>Benchmark</span><span>Collection</span><span>Freq</span></div>
          ${kpiCatalog.map(k => html`
            <div class="mn-row"><span>${k.name}</span><span>${k.owner}</span><span>${k.unit}</span><span>${k.target}</span><span>${k.current}</span><span>${k.benchmark}</span><span>${k.collection}</span><span>${k.frequency}</span></div>
          `).join("")}
        </div>
        <div class="mn-benchmarks">
          <h5>Industry Benchmark Alignment</h5>
          ${benchmarkSources.map(b => html`
            <div class="bm-row"><span>${b.source}</span><span>${b.mappedKPIs} KPIs</span><span>${b.alignment}%</span><span>${b.lastReview}</span><span>${b.status}</span></div>
          `).join("")}
        </div>
        <div class="mn-rules">
          <h5>Normalization Framework</h5>
          ${normalizationRules.map(n => html`
            <div class="nr-row"><span>${n.rule}</span><span>${n.appliesTo} KPIs</span><span>${n.exceptions} exceptions</span><span>${n.version}</span></div>
          `).join("")}
        </div>
      </section>`;
  }

  private _renderThreatHuntingCampaigns() {
    const campaigns = [
      { id: "HC-1001", name: "Lateral Movement Sweep", status: "active", hypothesis: "H1: Actors using pass-the-hash for lateral movement", leadHunter: "Alice Chen", findings: 46, startDate: "2026-03-19", endDate: null, effectiveness: 89 },
      { id: "HC-1002", name: "Credential Harvesting Hunt", status: "completed", hypothesis: "H2: Actors using web shells for persistence", leadHunter: "Bob Martinez", findings: 1, startDate: "2026-02-02", endDate: "2026-06-08", effectiveness: 49 },
      { id: "HC-1003", name: "Persistence Mechanism Audit", status: "planned", hypothesis: "H3: Actors using scheduled tasks for data theft", leadHunter: "Carol Wu", findings: 4, startDate: "2026-01-13", endDate: null, effectiveness: 68 },
      { id: "HC-1004", name: "C2 Beacon Detection", status: "in-review", hypothesis: "H4: Actors using DNS tunneling for C2 communication", leadHunter: "Dave Kim", findings: 7, startDate: "2026-04-24", endDate: null, effectiveness: 87 },
      { id: "HC-1005", name: "Data Exfiltration Patterns", status: "active", hypothesis: "H5: Actors using encrypted channels for privilege escalation", leadHunter: "Eve Johnson", findings: 10, startDate: "2026-03-07", endDate: null, effectiveness: 47 },
      { id: "HC-1006", name: "Privilege Escalation Scan", status: "completed", hypothesis: "H6: Actors using token impersonation for defense evasion", leadHunter: "Frank Liu", findings: 13, startDate: "2026-02-18", endDate: "2026-04-20", effectiveness: 66 },
      { id: "HC-1007", name: "Supply Chain Implant Hunt", status: "planned", hypothesis: "H7: Actors using poisoned images for initial access", leadHunter: "Grace Park", findings: 16, startDate: "2026-01-01", endDate: null, effectiveness: 85 },
      { id: "HC-1008", name: "Insider Threat Indicators", status: "in-review", hypothesis: "H8: Actors using legitimate tools for credential access", leadHunter: "Hector Silva", findings: 19, startDate: "2026-04-12", endDate: null, effectiveness: 45 },
      { id: "HC-1009", name: "Cloud Metadata Analysis", status: "active", hypothesis: "H9: Actors using API keys for command execution", leadHunter: "Alice Chen", findings: 22, startDate: "2026-03-23", endDate: null, effectiveness: 64 },
      { id: "HC-1010", name: "DNS Tunnel Detection", status: "completed", hypothesis: "H10: Actors using encoded subdomains for exfiltration", leadHunter: "Bob Martinez", findings: 25, startDate: "2026-02-06", endDate: "2026-05-04", effectiveness: 83 },
      { id: "HC-1011", name: "Fileless Malware Search", status: "planned", hypothesis: "H11: Actors using WMI providers for discovery", leadHunter: "Carol Wu", findings: 28, startDate: "2026-01-17", endDate: null, effectiveness: 43 },
      { id: "HC-1012", name: "Zero-Day Exploit Traces", status: "in-review", hypothesis: "H12: Actors using exploit kits for collection", leadHunter: "Dave Kim", findings: 31, startDate: "2026-04-28", endDate: null, effectiveness: 62 },
    ];
    const hunterLeaderboard = [
      { hunter: "Alice Chen", campaigns: 5, findings: 103, highSeverity: 2, avgScore: 93, streak: 7 },
      { hunter: "Bob Martinez", campaigns: 15, findings: 16, highSeverity: 7, avgScore: 86, streak: 8 },
      { hunter: "Carol Wu", campaigns: 12, findings: 45, highSeverity: 12, avgScore: 79, streak: 1 },
      { hunter: "Dave Kim", campaigns: 9, findings: 74, highSeverity: 17, avgScore: 72, streak: 2 },
      { hunter: "Eve Johnson", campaigns: 6, findings: 103, highSeverity: 22, avgScore: 65, streak: 3 },
      { hunter: "Frank Liu", campaigns: 3, findings: 16, highSeverity: 1, avgScore: 58, streak: 4 },
      { hunter: "Grace Park", campaigns: 13, findings: 45, highSeverity: 6, avgScore: 95, streak: 5 },
      { hunter: "Hector Silva", campaigns: 10, findings: 74, highSeverity: 11, avgScore: 88, streak: 6 },
    ];
    const mitreMapping = [
      { tactic: "Initial Access", techniques: 7, campaigns: 5, coverage: 82 },
      { tactic: "Execution", techniques: 6, campaigns: 4, coverage: 62 },
      { tactic: "Persistence", techniques: 5, campaigns: 3, coverage: 42 },
      { tactic: "Privilege Escalation", techniques: 4, campaigns: 2, coverage: 93 },
      { tactic: "Defense Evasion", techniques: 3, campaigns: 1, coverage: 73 },
      { tactic: "Credential Access", techniques: 2, campaigns: 6, coverage: 53 },
      { tactic: "Discovery", techniques: 12, campaigns: 5, coverage: 33 },
      { tactic: "Lateral Movement", techniques: 11, campaigns: 4, coverage: 84 },
      { tactic: "Collection", techniques: 10, campaigns: 3, coverage: 64 },
      { tactic: "Exfiltration", techniques: 9, campaigns: 2, coverage: 44 },
      { tactic: "Command & Control", techniques: 8, campaigns: 1, coverage: 95 },
      { tactic: "Impact", techniques: 7, campaigns: 6, coverage: 75 },
    ];
    return html`
      <section class="threat-hunting-campaigns">
        <h4>Threat Hunting Campaign Manager</h4>
        <div class="th-summary">
          <div class="th-stat"><span class="blabel">Active</span><span class="bval">${campaigns.filter(c => c.status === "active").length}</span></div>
          <div class="th-stat"><span class="blabel">Completed</span><span class="bval">${campaigns.filter(c => c.status === "completed").length}</span></div>
          <div class="th-stat"><span class="blabel">Total Findings</span><span class="bval">${campaigns.reduce((s,c) => s + c.findings, 0)}</span></div>
          <div class="th-stat"><span class="blabel">Avg Effectiveness</span><span class="bval">${(campaigns.reduce((s,c) => s + c.effectiveness, 0) / campaigns.length).toFixed(0)}%</span></div>
        </div>
        <div class="th-campaigns">
          <h5>Campaign Lifecycle</h5>
          ${campaigns.map(c => html`
            <div class="tc-row">
              <span class="tc-id">${c.id}</span><span class="tc-name">${c.name}</span>
              <span class="tc-status">${c.status}</span><span class="tc-hunter">${c.leadHunter}</span>
              <span>${c.findings} findings</span><span>${c.effectiveness}%</span>
              <span>${c.startDate} - ${c.endDate || "In Progress"}</span>
              <div class="tc-hypothesis">${c.hypothesis}</div>
            </div>
          `).join("")}
        </div>
        <div class="th-leaderboard">
          <h5>Hunter Leaderboard</h5>
          ${hunterLeaderboard.sort((a,b) => b.findings - a.findings).map((h,i) => html`
            <div class="hl-row">
              <span class="hl-rank">${i+1}</span><span class="hl-name">${h.hunter}</span>
              <span>${h.campaigns} campaigns</span><span>${h.findings} findings</span>
              <span>${h.highSeverity} high</span><span>Score: ${h.avgScore}</span><span>${h.streak}d streak</span>
            </div>
          `).join("")}
        </div>
        <div class="th-mitre">
          <h5>MITRE ATT&CK Coverage</h5>
          ${mitreMapping.map(m => html`
            <div class="tm-row"><span>${m.tactic}</span><span>${m.techniques} techniques</span><span>${m.campaigns} campaigns</span><span>${m.coverage}%</span></div>
          `).join("")}
        </div>
      </section>`;
  }

  private _renderControlInventory() {
    const controls = [
      { id: "CTL-2001", name: "MFA Enforcement", domain: "Access Control", status: "implemented", effectiveness: 86, lastTest: "2026-03-11", nextReview: "2026-11-11", owner: "SOC", risk: "Low" },
      { id: "CTL-2002", name: "Network Segmentation", domain: "Network Security", status: "partial", effectiveness: 39, lastTest: "2026-02-24", nextReview: "2026-12-02", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2003", name: "EDR Deployment", domain: "Endpoint Protection", status: "planned", effectiveness: 46, lastTest: "2026-01-09", nextReview: "2026-05-21", owner: "IT Ops", risk: "High" },
      { id: "CTL-2004", name: "DLP Policy", domain: "Data Protection", status: "gap", effectiveness: 2, lastTest: "2026-04-22", nextReview: "2026-06-12", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2005", name: "SSO Integration", domain: "Identity Management", status: "implemented", effectiveness: 98, lastTest: "2026-03-07", nextReview: "2026-07-03", owner: "IAM", risk: "Low" },
      { id: "CTL-2006", name: "SAST Pipeline", domain: "Application Security", status: "partial", effectiveness: 16, lastTest: "2026-02-20", nextReview: "2026-08-22", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2007", name: "CSPM Scanning", domain: "Cloud Security", status: "planned", effectiveness: 23, lastTest: "2026-01-05", nextReview: "2026-09-13", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2008", name: "Badge Access", domain: "Physical Security", status: "gap", effectiveness: 30, lastTest: "2026-04-18", nextReview: "2026-10-04", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2009", name: "Least Privilege", domain: "Access Control", status: "implemented", effectiveness: 51, lastTest: "2026-03-03", nextReview: "2026-11-23", owner: "SOC", risk: "Low" },
      { id: "CTL-2010", name: "Firewall Rules", domain: "Network Security", status: "partial", effectiveness: 44, lastTest: "2026-02-16", nextReview: "2026-12-14", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2011", name: "Disk Encryption", domain: "Endpoint Protection", status: "planned", effectiveness: 0, lastTest: "2026-01-01", nextReview: "2026-05-05", owner: "IT Ops", risk: "High" },
      { id: "CTL-2012", name: "Data Classification", domain: "Data Protection", status: "gap", effectiveness: 7, lastTest: "2026-04-14", nextReview: "2026-06-24", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2013", name: "PAM Implementation", domain: "Identity Management", status: "implemented", effectiveness: 63, lastTest: "2026-03-27", nextReview: "2026-07-15", owner: "IAM", risk: "Low" },
      { id: "CTL-2014", name: "DAST Pipeline", domain: "Application Security", status: "partial", effectiveness: 21, lastTest: "2026-02-12", nextReview: "2026-08-06", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2015", name: "IAM Policy Review", domain: "Cloud Security", status: "planned", effectiveness: 28, lastTest: "2026-01-25", nextReview: "2026-09-25", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2016", name: "Visitor Management", domain: "Physical Security", status: "gap", effectiveness: 35, lastTest: "2026-04-10", nextReview: "2026-10-16", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2017", name: "Access Reviews", domain: "Access Control", status: "implemented", effectiveness: 75, lastTest: "2026-03-23", nextReview: "2026-11-07", owner: "SOC", risk: "Low" },
      { id: "CTL-2018", name: "IDS/IPS Tuning", domain: "Network Security", status: "partial", effectiveness: 49, lastTest: "2026-02-08", nextReview: "2026-12-26", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2019", name: "Patch Management", domain: "Endpoint Protection", status: "planned", effectiveness: 5, lastTest: "2026-01-21", nextReview: "2026-05-17", owner: "IT Ops", risk: "High" },
      { id: "CTL-2020", name: "Backup Encryption", domain: "Data Protection", status: "gap", effectiveness: 12, lastTest: "2026-04-06", nextReview: "2026-06-08", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2021", name: "Password Policy", domain: "Identity Management", status: "implemented", effectiveness: 87, lastTest: "2026-03-19", nextReview: "2026-07-27", owner: "IAM", risk: "Low" },
      { id: "CTL-2022", name: "Container Scanning", domain: "Application Security", status: "partial", effectiveness: 26, lastTest: "2026-02-04", nextReview: "2026-08-18", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2023", name: "WAF Configuration", domain: "Cloud Security", status: "planned", effectiveness: 33, lastTest: "2026-01-17", nextReview: "2026-09-09", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2024", name: "CCTV Coverage", domain: "Physical Security", status: "gap", effectiveness: 40, lastTest: "2026-04-02", nextReview: "2026-10-28", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2025", name: "RBAC Enforcement", domain: "Access Control", status: "implemented", effectiveness: 40, lastTest: "2026-03-15", nextReview: "2026-11-19", owner: "SOC", risk: "Low" },
      { id: "CTL-2026", name: "VPN Management", domain: "Network Security", status: "partial", effectiveness: 3, lastTest: "2026-02-28", nextReview: "2026-12-10", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2027", name: "App Whitelisting", domain: "Endpoint Protection", status: "planned", effectiveness: 10, lastTest: "2026-01-13", nextReview: "2026-05-01", owner: "IT Ops", risk: "High" },
      { id: "CTL-2028", name: "Key Management", domain: "Data Protection", status: "gap", effectiveness: 17, lastTest: "2026-04-26", nextReview: "2026-06-20", owner: "Data Gov", risk: "Critical" },
    ];
    const gapAnalysis = [
      { gap: "Insufficient MFA coverage for legacy apps", severity: "High", remediationPlan: "Plan R3001", eta: "2026-Q4", estimatedCost: "178k" },
      { gap: "Missing network micro-segmentation", severity: "Medium", remediationPlan: "Plan R3002", eta: "2026-Q3", estimatedCost: "26k" },
      { gap: "Inconsistent EDR deployment", severity: "Medium", remediationPlan: "Plan R3003", eta: "2026-Q2", estimatedCost: "55k" },
      { gap: "DLP not covering cloud storage", severity: "Low", remediationPlan: "Plan R3004", eta: "2026-Q4", estimatedCost: "84k" },
      { gap: "SSO not integrated with all SaaS", severity: "High", remediationPlan: "Plan R3005", eta: "2026-Q3", estimatedCost: "113k" },
    ];
    return html`
      <section class="control-inventory">
        <h4>Security Control Inventory</h4>
        <div class="ci-summary">
          <div class="ci-stat"><span class="blabel">Total Controls</span><span class="bval">${controls.length}</span></div>
          <div class="ci-stat"><span class="blabel">Implemented</span><span class="bval">${controls.filter(c => c.status === "implemented").length}</span></div>
          <div class="ci-stat"><span class="blabel">Partial</span><span class="bval">${controls.filter(c => c.status === "partial").length}</span></div>
          <div class="ci-stat"><span class="blabel">Gaps</span><span class="bval">${controls.filter(c => c.status === "gap").length}</span></div>
        </div>
        <div class="ci-controls">
          <h5>Control Catalog</h5>
          ${controls.map(c => html`
            <div class="cc-row">
              <span class="cc-id">${c.id}</span><span class="cc-name">${c.name}</span><span>${c.domain}</span>
              <span>${c.status}</span><span>Eff: ${c.effectiveness}%</span><span>Owner: ${c.owner}</span>
              <span>Risk: ${c.risk}</span><span>Tested: ${c.lastTest}</span>
            </div>
          `).join("")}
        </div>
        <div class="ci-gaps">
          <h5>Gap Analysis</h5>
          ${gapAnalysis.map(g => html`
            <div class="ga-row"><span>${g.gap}</span><span>${g.severity}</span><span>${g.remediationPlan}</span><span>ETA: ${g.eta}</span><span>${g.estimatedCost}</span></div>
          `).join("")}
        </div>
      </section>`;
  }

  private _renderIncidentCostTracker() {
    const incidents = [
      { id: "INC-7001", name: "Security Incident 1", severity: "Critical", totalCost: 1752000, responseCost: 420480, recoveryCost: 508080, legalCost: 332880, regulatoryCost: 140160, insuranceClaim: 0, avoidedCost: 211000, date: "2026-03-03" },
      { id: "INC-7002", name: "Security Incident 2", severity: "High", totalCost: 1755000, responseCost: 544050, recoveryCost: 702000, legalCost: 280800, regulatoryCost: 245700, insuranceClaim: 1140750, avoidedCost: 240000, date: "2026-02-12" },
      { id: "INC-7003", name: "Security Incident 3", severity: "Medium", totalCost: 1758000, responseCost: 298860, recoveryCost: 527400, legalCost: 228540, regulatoryCost: 158220, insuranceClaim: 0, avoidedCost: 269000, date: "2026-01-21" },
      { id: "INC-7004", name: "Security Incident 4", severity: "Low", totalCost: 1761000, responseCost: 422640, recoveryCost: 352200, legalCost: 176100, regulatoryCost: 264150, insuranceClaim: 1056600, avoidedCost: 298000, date: "2026-04-02" },
      { id: "INC-7005", name: "Security Incident 5", severity: "Critical", totalCost: 1764000, responseCost: 546840, recoveryCost: 546840, legalCost: 123480, regulatoryCost: 176400, insuranceClaim: 0, avoidedCost: 327000, date: "2026-03-11" },
      { id: "INC-7006", name: "Security Incident 6", severity: "High", totalCost: 1767000, responseCost: 300390, recoveryCost: 371070, legalCost: 353400, regulatoryCost: 88350, insuranceClaim: 971850, avoidedCost: 356000, date: "2026-02-20" },
      { id: "INC-7007", name: "Security Incident 7", severity: "Medium", totalCost: 1770000, responseCost: 424800, recoveryCost: 566400, legalCost: 300900, regulatoryCost: 194700, insuranceClaim: 0, avoidedCost: 385000, date: "2026-01-01" },
      { id: "INC-7008", name: "Security Incident 8", severity: "Low", totalCost: 1773000, responseCost: 549630, recoveryCost: 390060, legalCost: 248220, regulatoryCost: 106380, insuranceClaim: 886500, avoidedCost: 414000, date: "2026-04-10" },
      { id: "INC-7009", name: "Security Incident 9", severity: "Critical", totalCost: 1776000, responseCost: 301920, recoveryCost: 586080, legalCost: 195360, regulatoryCost: 213120, insuranceClaim: 0, avoidedCost: 443000, date: "2026-03-19" },
      { id: "INC-7010", name: "Security Incident 10", severity: "High", totalCost: 1779000, responseCost: 426960, recoveryCost: 409170, legalCost: 142320, regulatoryCost: 124530, insuranceClaim: 800550, avoidedCost: 472000, date: "2026-02-28" },
      { id: "INC-7011", name: "Security Incident 11", severity: "Medium", totalCost: 1782000, responseCost: 552420, recoveryCost: 605880, legalCost: 89100, regulatoryCost: 231660, insuranceClaim: 0, avoidedCost: 5000, date: "2026-01-09" },
      { id: "INC-7012", name: "Security Incident 12", severity: "Low", totalCost: 1785000, responseCost: 303450, recoveryCost: 428400, legalCost: 321300, regulatoryCost: 142800, insuranceClaim: 714000, avoidedCost: 34000, date: "2026-04-18" },
    ];
    const yearlyTrend = [
      { month: "Jan", incidents: 5, totalCost: "423k", avgCost: "92k", insured: 32 },
      { month: "Feb", incidents: 2, totalCost: "466k", avgCost: "139k", insured: 32 },
      { month: "Mar", incidents: 10, totalCost: "509k", avgCost: "186k", insured: 32 },
      { month: "Apr", incidents: 7, totalCost: "552k", avgCost: "52k", insured: 32 },
      { month: "May", incidents: 4, totalCost: "595k", avgCost: "99k", insured: 32 },
      { month: "Jun", incidents: 12, totalCost: "638k", avgCost: "146k", insured: 32 },
    ];
    const totalCostYtd = incidents.reduce((s, i) => s + i.totalCost, 0);
    const totalAvoided = incidents.reduce((s, i) => s + i.avoidedCost, 0);
    const totalInsured = incidents.reduce((s, i) => s + i.insuranceClaim, 0);
    const projAnnual = totalCostYtd * 3;
    const projAvoided = totalAvoided * 3;
    const projInsured = totalInsured * 3;
    const netExposure = projAnnual - projAvoided - projInsured;
    return html`
      <section class="incident-cost-tracker">
        <h4>Security Incident Cost Tracker</h4>
        <div class="ict-summary">
          <div class="ict-stat"><span class="blabel">Total Incidents</span><span class="bval">${incidents.length}</span></div>
          <div class="ict-stat"><span class="blabel">Total Cost YTD</span><span class="bval">${(totalCostYtd/1e6).toFixed(2)}M</span></div>
          <div class="ict-stat"><span class="blabel">Cost Avoided</span><span class="bval">${(totalAvoided/1e6).toFixed(2)}M</span></div>
          <div class="ict-stat"><span class="blabel">Insurance Claims</span><span class="bval">${(totalInsured/1e6).toFixed(2)}M</span></div>
        </div>
        <div class="ict-breakdown">
          <h5>Cost by Severity</h5>
          ${["Critical","High","Medium","Low"].map(sev => {
            const filtered = incidents.filter(i => i.severity === sev);
            const total = filtered.reduce((s,i) => s + i.totalCost, 0);
            return html`<div class="cb-row"><span>${sev}</span><span>${filtered.length} incidents</span><span>${(total/1000).toFixed(0)}k</span><span>Avg: ${filtered.length ? (total/filtered.length/1000).toFixed(0) : 0}k</span></div>`;
          }).join("")}
        </div>
        <div class="ict-incidents">
          <h5>Incident Cost Breakdown</h5>
          ${incidents.map(inc => html`
            <div class="ic-row">
              <span>${inc.id}</span><span>${inc.name}</span><span>${inc.severity}</span>
              <span>${(inc.totalCost/1000).toFixed(0)}k</span>
              <span>R: ${(inc.responseCost/1000).toFixed(0)}k</span><span>Rec: ${(inc.recoveryCost/1000).toFixed(0)}k</span>
              <span>L: ${(inc.legalCost/1000).toFixed(0)}k</span><span>Reg: ${(inc.regulatoryCost/1000).toFixed(0)}k</span>
              <span>Ins: ${(inc.insuranceClaim/1000).toFixed(0)}k</span><span>${inc.date}</span>
            </div>
          `).join("")}
        </div>
        <div class="ict-trend">
          <h5>Monthly Cost Trending</h5>
          ${yearlyTrend.map(y => html`
            <div class="yt-row"><span>${y.month}</span><span>${y.incidents} incidents</span><span>${y.totalCost}</span><span>Avg: ${y.avgCost}</span><span>Insured: ${y.insured}%</span></div>
          `).join("")}
        </div>
        <div class="ict-projection">
          <h5>Annual Projection</h5>
          <div class="proj-row"><span>Projected Annual Cost</span><span>${(projAnnual/1e6).toFixed(2)}M</span></div>
          <div class="proj-row"><span>Projected Cost Avoided</span><span>${(projAvoided/1e6).toFixed(2)}M</span></div>
          <div class="proj-row"><span>Projected Insurance Recovery</span><span>${(projInsured/1e6).toFixed(2)}M</span></div>
          <div class="proj-row"><span>Net Exposure</span><span>${(netExposure/1e6).toFixed(2)}M</span></div>
        </div>
      </section>`;
  }

  // === Security Risk Transfer Matrix ===
  private _renderRiskTransferMatrix(): TemplateResult {
    const policies = [
      { id: 'CYB-001', name: 'Cyber Liability', carrier: 'Chubb', premium: 285000, limit: 5000000, deductible: 250000, status: 'Active', renewDate: '2026-09-15' },
      { id: 'CYB-002', name: 'D&O Liability', carrier: 'AIG', premium: 175000, limit: 10000000, deductible: 500000, status: 'Active', renewDate: '2026-11-30' },
      { id: 'CYB-003', name: 'E&O Professional', carrier: 'Zurich', premium: 195000, limit: 3000000, deductible: 100000, status: 'Active', renewDate: '2027-02-28' },
      { id: 'CYB-004', name: 'Crime/Fraud', carrier: 'Travelers', premium: 89000, limit: 2000000, deductible: 75000, status: 'Pending', renewDate: '2026-08-01' },
      { id: 'CYB-005', name: 'Business Interruption', carrier: 'Hartford', premium: 142000, limit: 8000000, deductible: 350000, status: 'Active', renewDate: '2026-12-15' },
    ];
    const decisions = [
      { risk: 'Ransomware', category: 'Operational', annualLoss: 1250000, insuranceCost: 85000, transferPct: 80, retainPct: 20, decision: 'Transfer' },
      { risk: 'Data Breach', category: 'Regulatory', annualLoss: 2400000, insuranceCost: 120000, transferPct: 70, retainPct: 30, decision: 'Partial Transfer' },
      { risk: 'Insider Threat', category: 'Personnel', annualLoss: 680000, insuranceCost: 45000, transferPct: 30, retainPct: 70, decision: 'Retain' },
      { risk: 'Third-Party Failure', category: 'Supply Chain', annualLoss: 920000, insuranceCost: 65000, transferPct: 55, retainPct: 45, decision: 'Partial Transfer' },
      { risk: 'DDoS Attack', category: 'Operational', annualLoss: 380000, insuranceCost: 32000, transferPct: 90, retainPct: 10, decision: 'Transfer' },
    ];
    const claims = [
      { id: 'CLM-2025-001', policy: 'CYB-001', date: '2025-03-15', type: 'Ransomware', filed: 850000, approved: 722500, status: 'Paid' },
      { id: 'CLM-2025-002', policy: 'CYB-002', date: '2025-07-22', type: 'Regulatory Fine', filed: 1200000, approved: 1080000, status: 'Paid' },
      { id: 'CLM-2026-001', policy: 'CYB-001', date: '2026-01-10', type: 'Data Breach', filed: 2100000, approved: 0, status: 'Under Review' },
    ];
    const totalPremium = policies.reduce((s, p) => s + p.premium, 0);
    const totalLimit = policies.reduce((s, p) => s + p.limit, 0);
    const totalDeductible = policies.reduce((s, p) => s + p.deductible, 0);
    const deductibleRatio = ((totalDeductible / totalLimit) * 100).toFixed(1);
    const premiumToLimitRatio = ((totalPremium / totalLimit) * 100).toFixed(2);
    return html`
      <section class="risk-transfer-section">
        <h4>Security Risk Transfer Matrix</h4>
        <div class="rt-summary-row">
          <div class="rt-stat"><span class="rt-label">Total Annual Premium</span><span class="rt-value">$${(totalPremium/1e6).toFixed(2)}M</span></div>
          <div class="rt-stat"><span class="rt-label">Aggregate Coverage Limit</span><span class="rt-value">$${(totalLimit/1e6).toFixed(0)}M</span></div>
          <div class="rt-stat"><span class="rt-label">Deductible Ratio</span><span class="rt-value">${deductibleRatio}%</span></div>
          <div class="rt-stat"><span class="rt-label">Premium/Limit Ratio</span><span class="rt-value">${premiumToLimitRatio}%</span></div>
        </div>
        <div class="rt-table-wrap">
          <table class="rt-table">
            <thead><tr><th>Policy ID</th><th>Name</th><th>Carrier</th><th>Premium</th><th>Limit</th><th>Deductible</th><th>Status</th><th>Renewal</th></tr></thead>
            <tbody>${policies.map(p => html`<tr>
              <td>${p.id}</td><td>${p.name}</td><td>${p.carrier}</td>
              <td>$${(p.premium/1e3).toFixed(0)}K</td><td>$${(p.limit/1e6).toFixed(1)}M</td>
              <td>$${(p.deductible/1e3).toFixed(0)}K</td><td class="status-${p.status.toLowerCase()}">${p.status}</td>
              <td>${p.renewDate}</td></tr>`)}</tbody>
          </table>
        </div>
        <h5>Risk Transfer vs Retention Decisions</h5>
        <div class="rt-decision-grid">
          ${decisions.map(d => html`<div class="rt-decision-card">
            <div class="rt-risk-name">${d.risk}</div>
            <div class="rt-category">${d.category}</div>
            <div class="rt-bar-wrap"><div class="rt-bar-transfer" style="width:${d.transferPct}%"></div><div class="rt-bar-retain" style="width:${d.retainPct}%"></div></div>
            <div class="rt-bar-labels"><span>Transfer ${d.transferPct}%</span><span>Retain ${d.retainPct}%</span></div>
            <div class="rt-annual">Annual Loss: $${(d.annualLoss/1e6).toFixed(2)}M | Ins Cost: $${(d.insuranceCost/1e3).toFixed(0)}K</div>
            <div class="rt-decision-badge ${d.decision.toLowerCase().replace(/ /g,'-')}">${d.decision}</div>
          </div>`)}</div>
        </div>
        <h5>Claims History</h5>
        <div class="rt-claims">${claims.map(c => html`<div class="rt-claim-row">
          <span>${c.id}</span><span>${c.policy}</span><span>${c.date}</span><span>${c.type}</span>
          <span>$${(c.filed/1e6).toFixed(2)}M</span><span>$${(c.approved/1e6).toFixed(2)}M</span>
          <span class="claim-${c.status.toLowerCase().replace(/ /g,'-')}">${c.status}</span>
        </div>`)}</div>
      </section>`;
  }

  // === Security Talent Management ===
  private _renderTalentManagement(): TemplateResult {
    const skills = ['Threat Detection', 'Incident Response', 'Forensics', 'Cloud Security', 'AppSec', 'Network Defense', 'GRC', 'Red Team'];
    const members = [
      { name: 'A. Chen', level: [5,4,3,4,3,4,5,2], certs: ['CISSP','GCIA'], training: 92, perf: 4.5, tenure: '6yr' },
      { name: 'B. Silva', level: [3,5,4,3,2,3,3,4], certs: ['CEH','OSCP'], training: 88, perf: 4.2, tenure: '4yr' },
      { name: 'C. Patel', level: [4,3,2,5,4,3,4,2], certs: ['CCSP','AWS-SC'], training: 95, perf: 4.7, tenure: '5yr' },
      { name: 'D. Kim', level: [2,4,5,2,3,4,2,5], certs: ['GCIH','OSCP'], training: 85, perf: 4.3, tenure: '3yr' },
      { name: 'E. Johnson', level: [5,5,4,4,5,3,4,3], certs: ['CISSP','CISM','CCSP'], training: 98, perf: 4.9, tenure: '8yr' },
      { name: 'F. Muller', level: [3,3,3,4,4,5,3,2], certs: ['CEH','CompTIA+'], training: 78, perf: 3.8, tenure: '2yr' },
      { name: 'G. Nakamura', level: [4,4,3,5,3,4,5,3], certs: ['CISSP','GCFA'], training: 91, perf: 4.4, tenure: '5yr' },
      { name: 'H. Williams', level: [2,2,4,3,5,2,2,3], certs: ['AWS-SC','AZ-500'], training: 82, perf: 3.9, tenure: '2yr' },
      { name: 'I. Dubois', level: [5,4,4,3,4,5,4,4], certs: ['CISSP','OSCP','GCIH'], training: 96, perf: 4.8, tenure: '7yr' },
      { name: 'J. Rodriguez', level: [3,3,2,4,3,3,3,2], certs: ['CEH'], training: 75, perf: 3.5, tenure: '1yr' },
      { name: 'K. Zhang', level: [4,5,5,4,3,4,3,5], certs: ['OSCP','GXPN','CRTO'], training: 93, perf: 4.6, tenure: '4yr' },
      { name: 'L. Anderson', level: [3,4,3,3,4,3,4,2], certs: ['CISSP','CISM'], training: 87, perf: 4.1, tenure: '3yr' },
    ];
    const hiringPipeline = [
      { role: 'Sr. Threat Hunter', stage: 'Final Interview', candidates: 3, posted: '2026-03-01', priority: 'Critical' },
      { role: 'Cloud Security Eng', stage: 'Screening', candidates: 12, posted: '2026-04-05', priority: 'High' },
      { role: 'GRC Analyst', stage: 'Offer Extended', candidates: 1, posted: '2026-02-15', priority: 'Medium' },
      { role: 'SOC Analyst L2', stage: 'Technical Assessment', candidates: 5, posted: '2026-04-10', priority: 'High' },
    ];
    const certCount = members.reduce((s, m) => s + m.certs.length, 0);
    const avgTraining = (members.reduce((s, m) => s + m.training, 0) / members.length).toFixed(1);
    const avgPerf = (members.reduce((s, m) => s + m.perf, 0) / members.length).toFixed(1);
    return html`
      <section class="talent-mgmt-section">
        <h4>Security Talent Management</h4>
        <div class="tm-stats-row">
          <div class="tm-stat"><span class="tm-label">Team Size</span><span class="tm-value">${members.length}</span></div>
          <div class="tm-stat"><span class="tm-label">Total Certifications</span><span class="tm-value">${certCount}</span></div>
          <div class="tm-stat"><span class="tm-label">Avg Training Completion</span><span class="tm-value">${avgTraining}%</span></div>
          <div class="tm-stat"><span class="tm-label">Avg Performance Score</span><span class="tm-value">${avgPerf}/5.0</span></div>
        </div>
        <h5>Team Skills Matrix</h5>
        <div class="tm-skills-grid">
          <div class="tm-skills-header"><div class="tm-name-cell"></div>${skills.map(s => html`<div class="tm-skill-cell">${s}</div>`)}</div>
          ${members.map(m => html`<div class="tm-member-row">
            <div class="tm-name-cell">${m.name}<br/><small>${m.certs.join(', ')}</small></div>
            ${m.level.map(l => html`<div class="tm-level-cell level-${l}">${l}</div>`)}
            <div class="tm-meta-cell">${m.training}% | ${m.perf}</div>
          </div>`)}
        </div>
        <h5>Hiring Pipeline</h5>
        <div class="tm-pipeline">${hiringPipeline.map(h => html`<div class="tm-pipe-card">
          <div class="tm-pipe-role">${h.role}</div>
          <div class="tm-pipe-stage">${h.stage}</div>
          <div class="tm-pipe-info"><span>Candidates: ${h.candidates}</span><span>Posted: ${h.posted}</span></div>
          <div class="tm-pipe-priority priority-${h.priority.toLowerCase()}">${h.priority}</div>
        </div>`)}</div>
      </section>`;
  }

  // === Security Vendor Assessment ===
  private _renderVendorAssessment(): TemplateResult {
    const vendors = [
      { name: 'CrowdStrike', category: 'EDR/XDR', score: 92, sla: 99.9, contractEnd: '2027-03-31', tier: 'Tier 1', risk: 'Low', renewalStatus: 'On Track' },
      { name: 'Palo Alto', category: 'Firewall/NGFW', score: 88, sla: 99.95, contractEnd: '2026-12-31', tier: 'Tier 1', risk: 'Low', renewalStatus: 'Review Needed' },
      { name: 'Splunk', category: 'SIEM', score: 85, sla: 99.5, contractEnd: '2027-06-30', tier: 'Tier 1', risk: 'Medium', renewalStatus: 'On Track' },
      { name: 'Duo Security', category: 'MFA', score: 90, sla: 99.99, contractEnd: '2027-01-15', tier: 'Tier 2', risk: 'Low', renewalStatus: 'Auto-Renew' },
      { name: 'Qualys', category: 'Vuln Mgmt', score: 82, sla: 99.5, contractEnd: '2026-09-30', tier: 'Tier 2', risk: 'Medium', renewalStatus: 'Negotiating' },
      { name: 'Rapid7', category: 'Pen Testing', score: 78, sla: 99.0, contractEnd: '2027-02-28', tier: 'Tier 2', risk: 'Medium', renewalStatus: 'On Track' },
      { name: 'KnowBe4', category: 'Security Awareness', score: 75, sla: 99.0, contractEnd: '2026-11-30', tier: 'Tier 3', risk: 'Low', renewalStatus: 'Under Review' },
      { name: 'Darktrace', category: 'AI/ML Detection', score: 80, sla: 99.5, contractEnd: '2027-04-30', tier: 'Tier 2', risk: 'Medium', renewalStatus: 'On Track' },
    ];
    const dependencyMatrix = [
      { critical: 'EDR/XDR', vendors: ['CrowdStrike'], backup: 'SentinelOne (eval)', singlePoint: true },
      { critical: 'SIEM', vendors: ['Splunk'], backup: 'Elastic SIEM (partial)', singlePoint: true },
      { critical: 'Firewall', vendors: ['Palo Alto', 'Fortinet'], backup: 'Internal', singlePoint: false },
      { critical: 'MFA', vendors: ['Duo Security', 'Okta'], backup: 'Microsoft Entra', singlePoint: false },
    ];
    const tierCounts: Record<string, number> = {};
    vendors.forEach(v => { tierCounts[v.tier] = (tierCounts[v.tier] || 0) + 1; });
    const avgSla = (vendors.reduce((s, v) => s + v.sla, 0) / vendors.length).toFixed(2);
    return html`
      <section class="vendor-assess-section">
        <h4>Security Vendor Assessment</h4>
        <div class="va-stats-row">
          <div class="va-stat"><span class="va-label">Total Vendors</span><span class="va-value">${vendors.length}</span></div>
          <div class="va-stat"><span class="va-label">Avg SLA Compliance</span><span class="va-value">${avgSla}%</span></div>
          <div class="va-stat"><span class="va-label">Tier 1</span><span class="va-value">${tierCounts['Tier 1'] || 0}</span></div>
          <div class="va-stat"><span class="va-label">Tier 2</span><span class="va-value">${tierCounts['Tier 2'] || 0}</span></div>
          <div class="va-stat"><span class="va-label">Tier 3</span><span class="va-value">${tierCounts['Tier 3'] || 0}</span></div>
        </div>
        <h5>Vendor Scorecard</h5>
        <div class="va-scorecard-grid">
          ${vendors.map(v => html`<div class="va-vendor-card">
            <div class="va-vendor-name">${v.name}</div>
            <div class="va-vendor-cat">${v.category}</div>
            <div class="va-score-bar"><div class="va-score-fill" style="width:${v.score}%"></div><span>${v.score}</span></div>
            <div class="va-vendor-meta"><span>SLA: ${v.sla}%</span><span>${v.tier}</span><span class="risk-${v.risk.toLowerCase()}">${v.risk}</span></div>
            <div class="va-renewal">${v.renewalStatus}</div>
          </div>`)}
        </div>
        <h5>Vendor Dependency Analysis</h5>
        <div class="va-dep-table">
          <table><thead><tr><th>Critical Function</th><th>Primary Vendor(s)</th><th>Backup</th><th>Single Point?</th></tr></thead>
          <tbody>${dependencyMatrix.map(d => html`<tr>
            <td>${d.critical}</td><td>${d.vendors.join(', ')}</td><td>${d.backup}</td>
            <td class="${d.singlePoint ? 'sp-yes' : 'sp-no'}">${d.singlePoint ? 'Yes - Risk' : 'No'}</td>
          </tr>`)}</tbody></table>
        </div>
      </section>`;
  }

  // === Security Policy Engine ===
  private _renderPolicyEngine(): TemplateResult {
    const policies = [
      { id: 'POL-001', name: 'Acceptable Use Policy', version: '3.2', status: 'Active', compliance: 94, owner: 'CISO', nextReview: '2026-07-15' },
      { id: 'POL-002', name: 'Information Classification', version: '2.8', status: 'Active', compliance: 91, owner: 'CISO', nextReview: '2026-05-20' },
      { id: 'POL-003', name: 'Access Control Policy', version: '4.1', status: 'Active', compliance: 88, owner: 'IAM Lead', nextReview: '2026-08-10' },
      { id: 'POL-004', name: 'Incident Response Plan', version: '5.0', status: 'Under Review', compliance: 82, owner: 'IR Manager', nextReview: '2026-03-01' },
      { id: 'POL-005', name: 'Data Retention Policy', version: '2.3', status: 'Active', compliance: 90, owner: 'DPO', nextReview: '2026-06-05' },
      { id: 'POL-006', name: 'Password Policy', version: '3.5', status: 'Active', compliance: 96, owner: 'IAM Lead', nextReview: '2026-09-01' },
      { id: 'POL-007', name: 'Remote Access Policy', version: '2.1', status: 'Draft', compliance: 75, owner: 'Network Lead', nextReview: '2026-02-15' },
      { id: 'POL-008', name: 'Change Management', version: '3.0', status: 'Active', compliance: 93, owner: 'CISO', nextReview: '2026-07-20' },
      { id: 'POL-009', name: 'Vendor Risk Management', version: '2.5', status: 'Active', compliance: 85, owner: 'Procurement', nextReview: '2026-04-10' },
      { id: 'POL-010', name: 'Encryption Standards', version: '4.0', status: 'Active', compliance: 97, owner: 'Crypto Lead', nextReview: '2026-08-28' },
      { id: 'POL-011', name: 'Cloud Security Policy', version: '2.0', status: 'Under Review', compliance: 78, owner: 'Cloud Lead', nextReview: '2026-01-01' },
      { id: 'POL-012', name: 'Third-Party Access', version: '1.8', status: 'Active', compliance: 87, owner: 'IAM Lead', nextReview: '2026-05-15' },
      { id: 'POL-013', name: 'Security Awareness Training', version: '3.1', status: 'Active', compliance: 92, owner: 'Training Mgr', nextReview: '2026-09-15' },
      { id: 'POL-014', name: 'Disaster Recovery Plan', version: '4.2', status: 'Active', compliance: 89, owner: 'DR Manager', nextReview: '2026-06-20' },
      { id: 'POL-015', name: 'Physical Security Policy', version: '2.4', status: 'Active', compliance: 95, owner: 'Facilities', nextReview: '2026-03-30' },
    ];
    const exceptions = [
      { id: 'EXC-001', policy: 'POL-003', requestor: 'Dev Team', reason: 'Service account needs elevated access', status: 'Approved', expires: '2026-06-30' },
      { id: 'EXC-002', policy: 'POL-006', requestor: 'Legacy System', reason: 'Password complexity incompatible', status: 'Approved', expires: '2026-12-31' },
      { id: 'EXC-003', policy: 'POL-005', requestor: 'Legal Dept', reason: 'Regulatory hold extended retention', status: 'Pending', expires: '2026-09-30' },
    ];
    const avgCompliance = (policies.reduce((s, p) => s + p.compliance, 0) / policies.length).toFixed(1);
    const overdueCount = policies.filter(p => new Date(p.nextReview) < new Date('2026-04-23')).length;
    const activePolicies = policies.filter(p => p.status === 'Active').length;
    return html`
      <section class="policy-engine-section">
        <h4>Security Policy Engine</h4>
        <div class="pe-stats-row">
          <div class="pe-stat"><span class="pe-label">Total Policies</span><span class="pe-value">${policies.length}</span></div>
          <div class="pe-stat"><span class="pe-label">Active</span><span class="pe-value">${activePolicies}</span></div>
          <div class="pe-stat"><span class="pe-label">Avg Compliance</span><span class="pe-value">${avgCompliance}%</span></div>
          <div class="pe-stat"><span class="pe-label">Overdue Reviews</span><span class="pe-value">${overdueCount}</span></div>
          <div class="pe-stat"><span class="pe-label">Open Exceptions</span><span class="pe-value">${exceptions.length}</span></div>
        </div>
        <div class="pe-policy-list">
          ${policies.map(p => html`<div class="pe-policy-row">
            <span class="pe-id">${p.id}</span>
            <span class="pe-name">${p.name}</span>
            <span class="pe-ver">v${p.version}</span>
            <span class="pe-status status-${p.status.toLowerCase().replace(/ /g,'-')}">${p.status}</span>
            <div class="pe-compliance-bar"><div class="pe-comp-fill" style="width:${p.compliance}%"></div><span>${p.compliance}%</span></div>
            <span class="pe-owner">${p.owner}</span>
            <span class="pe-next">Next: ${p.nextReview}</span>
          </div>`)}
        </div>
        <h5>Policy Exceptions</h5>
        <div class="pe-exceptions">${exceptions.map(e => html`<div class="pe-exc-row">
          <span>${e.id}</span><span>${e.policy}</span><span>${e.requestor}</span>
          <span>${e.reason}</span><span class="exc-${e.status.toLowerCase()}">${e.status}</span><span>Exp: ${e.expires}</span>
        </div>`)}</div>
      </section>`;
  }

  // === Security Metrics Dashboard Builder ===
  private _renderMetricsDashboardBuilder(): TemplateResult {
    const widgetTypes = [
      { type: 'line-chart', name: 'Line Chart', desc: 'Time-series trends', category: 'Visualization' },
      { type: 'bar-chart', name: 'Bar Chart', desc: 'Category comparisons', category: 'Visualization' },
      { type: 'pie-chart', name: 'Pie Chart', desc: 'Distribution view', category: 'Visualization' },
      { type: 'heatmap', name: 'Heatmap', desc: 'Density/matrix data', category: 'Visualization' },
      { type: 'kpi-card', name: 'KPI Card', desc: 'Single metric display', category: 'Metric' },
      { type: 'gauge', name: 'Gauge', desc: 'Progress/percentage', category: 'Metric' },
      { type: 'table', name: 'Data Table', desc: 'Tabular data view', category: 'Data' },
      { type: 'timeline', name: 'Timeline', desc: 'Event chronology', category: 'Data' },
      { type: 'status-list', name: 'Status List', desc: 'Item status tracking', category: 'Data' },
      { type: 'counter', name: 'Counter', desc: 'Running totals', category: 'Metric' },
    ];
    const templates = [
      { name: 'Executive Overview', widgets: 6, layout: '2x3 Grid', category: 'C-Suite', shared: 12 },
      { name: 'SOC Daily Ops', widgets: 10, layout: '3x4 Grid', category: 'Operations', shared: 8 },
      { name: 'Compliance Tracker', widgets: 8, layout: '2x4 Grid', category: 'GRC', shared: 5 },
      { name: 'Vulnerability Dashboard', widgets: 7, layout: '3x3 Grid', category: 'Vuln Mgmt', shared: 15 },
      { name: 'Incident Metrics', widgets: 9, layout: '3x3 Grid', category: 'Incident Response', shared: 10 },
    ];
    const dashboardWidgets = [
      { id: 'w1', type: 'kpi-card', title: 'MTTD', row: 1, col: 1, w: 1, data: { value: '4.2min', trend: '-12%' } },
      { id: 'w2', type: 'line-chart', title: 'Alert Volume (30d)', row: 1, col: 2, w: 2, data: { points: 30 } },
      { id: 'w3', type: 'gauge', title: 'Patch Compliance', row: 1, col: 4, w: 1, data: { value: 87 } },
      { id: 'w4', type: 'bar-chart', title: 'Vulns by Severity', row: 2, col: 1, w: 2, data: { categories: 5 } },
      { id: 'w5', type: 'table', title: 'Top 10 Risks', row: 2, col: 3, w: 2, data: { rows: 10 } },
      { id: 'w6', type: 'counter', title: 'Open Incidents', row: 3, col: 1, w: 1, data: { value: 23, delta: -5 } },
    ];
    return html`
      <section class="metrics-builder-section">
        <h4>Security Metrics Dashboard Builder</h4>
        <div class="mb-canvas">
          <div class="mb-canvas-header">
            <span class="mb-canvas-title">Dashboard Editor</span>
            <span class="mb-canvas-info">Widgets: ${dashboardWidgets.length} | Layout: 4x3</span>
          </div>
          <div class="mb-grid">
            ${dashboardWidgets.map(w => html`<div class="mb-widget" style="grid-row:${w.row};grid-column:${w.col}/span ${w.w}">
              <div class="mb-widget-header"><span class="mb-widget-title">${w.title}</span><span class="mb-widget-type">${w.type}</span></div>
              <div class="mb-widget-body">${w.type === 'kpi-card' ? html`<div class="mb-kpi">${w.data.value}<span class="mb-trend">${w.data.trend}</span></div>` :
                w.type === 'gauge' ? html`<div class="mb-gauge"><div class="mb-gauge-fill" style="width:${w.data.value}%"></div><span>${w.data.value}%</span></div>` :
                w.type === 'counter' ? html`<div class="mb-counter">${w.data.value} <span class="mb-delta">${w.data.delta}</span></div>` :
                html`<div class="mb-placeholder">[${w.type}]</div>`}</div>
            </div>`)}
          </div>
        </div>
        <h5>Widget Type Catalog</h5>
        <div class="mb-catalog">${widgetTypes.map(w => html`<div class="mb-catalog-item">
          <div class="mb-ci-type">${w.type}</div>
          <div class="mb-ci-name">${w.name}</div>
          <div class="mb-ci-desc">${w.desc}</div>
          <div class="mb-ci-cat">${w.category}</div>
        </div>`)}</div>
        <h5>Dashboard Templates</h5>
        <div class="mb-templates">${templates.map(t => html`<div class="mb-tpl-card">
          <div class="mb-tpl-name">${t.name}</div>
          <div class="mb-tpl-meta"><span>${t.widgets} widgets</span><span>${t.layout}</span><span>${t.category}</span></div>
          <div class="mb-tpl-shared">Shared with ${t.shared} users</div>
        </div>`)}</div>
      </section>`;
  }

  }


declare global { interface HTMLElementTagNameMap { 'sc-security-timeline': ScSecurityTimeline; } }
