/**
 * sc-purple-team - Purple Team
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

@customElement('sc-purple-team')
export class ScPurpleTeam extends LitElement {

  // --- PurpleTeam Risk Scoring Engine ---
  @state() private _ptriskScore = 0;
  @state() private _ptriskLevel = 'low';
  private _ptriskFactors: Record<string, { weight: number; label: string }> = {
    factor1: { weight: 0.25, label: 'Primary Factor' },
    factor2: { weight: 0.20, label: 'Secondary Factor' },
    factor3: { weight: 0.20, label: 'Tertiary Factor' },
    factor4: { weight: 0.15, label: 'Quaternary Factor' },
    factor5: { weight: 0.20, label: 'Quinary Factor' },
  };

  private _computePurpleTeamRisk(): { score: number; level: string; factors: { name: string; score: number; label: string }[] } {
    const factors: { name: string; score: number; label: string }[] = Object.entries(this._ptriskFactors).map(([name, f]) => ({
      name, score: Math.floor(Math.random() * 60) + 20, label: f.label,
    }));
    const score = Math.round(factors.reduce((s, f) => s + f.score * (this._ptriskFactors[f.name]?.weight || 0.15), 0));
    const level = score > 75 ? 'critical' : score > 50 ? 'high' : score > 25 ? 'medium' : 'low';
    this._ptriskScore = score;
    this._ptriskLevel = level;
    return { score, level, factors };
  }

  // --- MITRE ATT&CK Correlation ---
  private _ptmitreMap: Record<string, { techniqueId: string; techniqueName: string; tactic: string }> = {
    'phishing': { techniqueId: 'T1566', techniqueName: 'Phishing', tactic: 'Initial Access' },
    'valid-accounts': { techniqueId: 'T1078', techniqueName: 'Valid Accounts', tactic: 'Initial Access' },
    'command-exec': { techniqueId: 'T1059', techniqueName: 'Command Interpreter', tactic: 'Execution' },
    'credential-dump': { techniqueId: 'T1003', techniqueName: 'Credential Dumping', tactic: 'Credential Access' },
    'lateral-movement': { techniqueId: 'T1021', techniqueName: 'Remote Services', tactic: 'Lateral Movement' },
    'defense-evasion': { techniqueId: 'T1070', techniqueName: 'Indicator Removal', tactic: 'Defense Evasion' },
  };

  private _correlatePurpleTeamMitre(): { tactic: string; techniques: { id: string; name: string; count: number }[] }[] {
    const tacticMap: Record<string, { id: string; name: string; count: number }[]> = {};
    for (const [key, mitre] of Object.entries(this._ptmitreMap)) {
      if (!tacticMap[mitre.tactic]) tacticMap[mitre.tactic] = [];
      tacticMap[mitre.tactic].push({ id: mitre.techniqueId, name: mitre.techniqueName, count: Math.floor(Math.random() * 5) + 1 });
    }
    return Object.entries(tacticMap).map(([tactic, techniques]) => ({ tactic, techniques }));
  }

  // --- Radar Chart SVG ---
  private _ptradarSVG(): string {
    const dims = Object.values(this._ptriskFactors).map(f => f.label);
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
  private _ptheatmapSVG(): string {
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
  @state() private _ptteam: { id: string; name: string; role: string; status: string }[] = [
    { id: 'pt1', name: 'Team Lead', role: 'Management', status: 'online' },
    { id: 'pt2', name: 'Analyst', role: 'Operations', status: 'online' },
    { id: 'pt3', name: 'Engineer', role: 'Technical', status: 'busy' },
  ];
  @state() private _ptcomments: { id: string; userId: string; text: string; timestamp: string }[] = [];
  @state() private _ptcommentText = '';

  private _addPurpleTeamComment() {
    if (!this._ptcommentText.trim()) return;
    this._ptcomments = [{ id: 'ptc' + Date.now(), userId: 'You', text: this._ptcommentText.trim(), timestamp: new Date().toISOString() }, ...this._ptcomments].slice(0, 30);
    this._ptcommentText = '';
  }

  private _renderPurpleTeamCollab(): any {
    return html`
      <div style="margin-top:16px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Team Discussion</div>
        ${
          this._ptteam.map(m => html`
            <div style="display:flex;align-items:center;gap:4px;background:#1f2937;border-radius:4px;padding:3px 8px;font-size:10px">
              <div style="width:6px;height:6px;border-radius:50%;background:${m.status === 'online' ? '#22c55e' : '#eab308'}"></div>
              <span style="font-weight:600">${m.name}</span>
            </div>
          `)
        }
        ${
          this._ptcomments.length > 0 ? html`
            <div style="max-height:60px;overflow-y:auto;margin-bottom:6px">
              ${
                this._ptcomments.slice(0, 5).map(c => html`<div style="font-size:10px;padding:3px 0;border-bottom:1px solid #1f2937"><span style="font-weight:600;color:#e2e8f0">${c.userId}</span><span style="color:#9ca3af">: ${c.text}</span></div>`)
              }
            </div>
          ` : nothing
        }
        <div style="display:flex;gap:6px">
          <input style="flex:1;background:#0f172a;border:1px solid #374151;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:10px" placeholder="Comment..." .value=${this._ptcommentText} @input=${(e: any) => this._ptcommentText = e.target.value}>
          <button style="background:#f59e0b;color:#111827;border:none;border-radius:4px;padding:4px 10px;font-size:10px;font-weight:600;cursor:pointer" @click=${this._addPurpleTeamComment}>Post</button>
        </div>
      </div>
    `;
  }

  // --- Auto-Insights ---
  private _generatePurpleTeamInsights(): { icon: string; text: string; severity: string }[] {
    const insights: { icon: string; text: string; severity: string }[] = [];
    const risk = this._computePurpleTeamRisk();
    if (risk.score > 75) insights.push({ icon: '\u26A0\uFE0F', text: 'PurpleTeam risk score is ' + risk.score + '/100. Immediate attention required.', severity: 'critical' });
    else if (risk.score > 50) insights.push({ icon: '\uD83D\uDD04', text: 'PurpleTeam risk is elevated at ' + risk.score + '/100.', severity: 'high' });
    return insights.length > 0 ? insights : [{ icon: '\u2705', text: 'PurpleTeam status is normal.', severity: 'low' }];
  }

  private _renderPurpleTeamInsights(): any {
    const insights = this._generatePurpleTeamInsights();
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
  @state() private _ptconfig: { showRadar: boolean; showHeatmap: boolean; showCollab: boolean; autoRefresh: boolean } = { showRadar: true, showHeatmap: true, showCollab: true, autoRefresh: false };

  private _renderPurpleTeamConfig(): any {
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Configuration</div>
        ${
          Object.entries(this._ptconfig).map(([key, val]) => html`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1f2937">
              <span style="font-size:10px;color:#9ca3af">${key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <div style="width:32px;height:18px;border-radius:9px;background:${val ? '#22c55e' : '#374151'};cursor:pointer;position:relative" @click=${() => { this._ptconfig = { ...this._ptconfig, [key]: !val }; }}>
                <div style="width:14px;height:14px;border-radius:50%;background:white;position:absolute;top:2px;left:${val ? '16px' : '2px'};transition:left 0.2s"></div>
              </div>
            </div>
          `)
        }
      </div>
    `;
  }

  // --- Anomaly Detection ---
  private _detectPurpleTeamAnomalies(): { type: string; description: string; severity: string }[] {
    const anomalies: { type: string; description: string; severity: string }[] = [];
    const risk = this._computePurpleTeamRisk();
    if (risk.score > 80) anomalies.push({ type: 'Critical Risk', description: 'PurpleTeam risk exceeds 80 threshold.', severity: 'critical' });
    return anomalies;
  }

  private _renderPurpleTeamAnomalies(): any {
    const anomalies = this._detectPurpleTeamAnomalies();
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
  private _predictPurpleTeamTrend(): { direction: string; confidence: number; reason: string } {
    const risk = this._computePurpleTeamRisk();
    if (risk.score > 60) return { direction: 'INCREASING', confidence: 0.7, reason: 'Risk indicators trending upward' };
    return { direction: 'STABLE', confidence: 0.6, reason: 'Risk within normal parameters' };
  }

  private _renderPurpleTeamTrend(): any {
    const trend = this._predictPurpleTeamTrend();
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
  private _ptcomplianceRules: { rule: string; standard: string; status: 'pass' | 'fail' | 'warning' }[] = [
    { rule: 'Security controls documented', standard: 'ISO 27001 A.5.1', status: 'pass' },
    { rule: 'Regular assessments performed', standard: 'NIST 800-53 CA-2', status: 'pass' },
    { rule: 'Risk acceptance criteria defined', standard: 'ISO 27001 A.6.1', status: 'warning' },
    { rule: 'Remediation tracking active', standard: 'NIST 800-53 RA-5', status: 'fail' },
    { rule: 'Stakeholder reporting current', standard: 'SOC2 CC4.1', status: 'pass' },
  ];

  private _renderPurpleTeamCompliance(): any {
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Compliance</div>
        ${
          this._ptcomplianceRules.map(r => html`
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
            "id": "purple-team-1",
            "title": "Purple Team Finding #1",
            "severity": "low",
            "status": "open",
            "category": "Security",
            "source": "SIEM",
            "description": "Automated purple team assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-15T00:00:00Z",
            "assignee": "soc-tier1",
            "tags": [
                  "purple-team",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 15,
            "stepsTaken": []
      },
      {
            "id": "purple-team-2",
            "title": "Purple Team Finding #2",
            "severity": "medium",
            "status": "open",
            "category": "Network",
            "source": "EDR",
            "description": "Automated purple team assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-16T02:00:00Z",
            "assignee": "soc-tier2",
            "tags": [
                  "purple-team",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 30,
            "stepsTaken": []
      },
      {
            "id": "purple-team-3",
            "title": "Purple Team Finding #3",
            "severity": "high",
            "status": "open",
            "category": "Access",
            "source": "Scanner",
            "description": "Automated purple team assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-17T04:00:00Z",
            "assignee": "security-eng",
            "tags": [
                  "purple-team",
                  "automated"
            ],
            "priority": "p3",
            "slaMinutes": 60,
            "stepsTaken": []
      },
      {
            "id": "purple-team-4",
            "title": "Purple Team Finding #4",
            "severity": "low",
            "status": "open",
            "category": "Compliance",
            "source": "Audit",
            "description": "Automated purple team assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-18T06:00:00Z",
            "assignee": "compliance",
            "tags": [
                  "purple-team",
                  "automated"
            ],
            "priority": "p4",
            "slaMinutes": 120,
            "stepsTaken": []
      },
      {
            "id": "purple-team-5",
            "title": "Purple Team Finding #5",
            "severity": "medium",
            "status": "open",
            "category": "Operations",
            "source": "Manual",
            "description": "Automated purple team assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-19T08:00:00Z",
            "assignee": "ops",
            "tags": [
                  "purple-team",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 240,
            "stepsTaken": []
      },
      {
            "id": "purple-team-6",
            "title": "Purple Team Finding #6",
            "severity": "high",
            "status": "open",
            "category": "Security",
            "source": "SIEM",
            "description": "Automated purple team assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-20T10:00:00Z",
            "assignee": "soc-tier1",
            "tags": [
                  "purple-team",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 15,
            "stepsTaken": []
      },
      {
            "id": "purple-team-7",
            "title": "Purple Team Finding #7",
            "severity": "low",
            "status": "open",
            "category": "Network",
            "source": "EDR",
            "description": "Automated purple team assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-21T12:00:00Z",
            "assignee": "soc-tier2",
            "tags": [
                  "purple-team",
                  "automated"
            ],
            "priority": "p3",
            "slaMinutes": 30,
            "stepsTaken": []
      },
      {
            "id": "purple-team-8",
            "title": "Purple Team Finding #8",
            "severity": "medium",
            "status": "open",
            "category": "Access",
            "source": "Scanner",
            "description": "Automated purple team assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-22T14:00:00Z",
            "assignee": "security-eng",
            "tags": [
                  "purple-team",
                  "automated"
            ],
            "priority": "p4",
            "slaMinutes": 60,
            "stepsTaken": []
      },
      {
            "id": "purple-team-9",
            "title": "Purple Team Finding #9",
            "severity": "high",
            "status": "open",
            "category": "Compliance",
            "source": "Audit",
            "description": "Automated purple team assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-23T16:00:00Z",
            "assignee": "compliance",
            "tags": [
                  "purple-team",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 120,
            "stepsTaken": []
      },
      {
            "id": "purple-team-10",
            "title": "Purple Team Finding #10",
            "severity": "low",
            "status": "open",
            "category": "Operations",
            "source": "Manual",
            "description": "Automated purple team assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-24T18:00:00Z",
            "assignee": "ops",
            "tags": [
                  "purple-team",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 240,
            "stepsTaken": []
      }
];

  private _history: HistoryEntry[] = [
    { timestamp: '2026-04-23 04:15', action: 'Auto-correlated', user: 'system', details: 'Grouped related findings from Purple Team analysis' },
    { timestamp: '2026-04-23 03:00', action: 'Created', user: 'scanner', details: 'New Purple Team finding detected by automated assessment' },
    { timestamp: '2026-04-23 02:30', action: 'Escalated', user: 'soc-tier1', details: 'Escalated critical finding to tier 2 for investigation' },
    { timestamp: '2026-04-23 01:00', action: 'Updated', user: 'soc-tier2', details: 'Added investigation notes and IOC indicators' },
    { timestamp: '2026-04-22 22:00', action: 'Resolved', user: 'security-eng', details: 'Remediation applied and verified for Purple Team finding' },
    { timestamp: '2026-04-22 18:00', action: 'Created', user: 'audit', details: 'Compliance audit identified Purple Team gap requiring remediation' },
    { timestamp: '2026-04-22 14:00', action: 'Acknowledged', user: 'ops-team', details: 'Operations team acknowledged finding and created remediation task' },
    { timestamp: '2026-04-22 10:00', action: 'Assigned', user: 'manager', details: 'Finding assigned to security engineering team for resolution' },
    { timestamp: '2026-04-21 16:00', action: 'Resolved', user: 'soc-tier1', details: 'False positive confirmed - benign activity flagged by Purple Team scan' },
    { timestamp: '2026-04-21 12:00', action: 'Exported', user: 'compliance', details: 'Exported Purple Team findings for Q1 compliance report' },
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
    const a = document.createElement('a'); a.href = url; a.download = 'sc-purple-team-data.json'; a.click();
    URL.revokeObjectURL(url);
  }

  private _exportCSV() {
    const items = this._getFiltered();
    const header = 'ID,Title,Severity,Status,Category,Source,Assignee,Priority,Created\n';
    const rows = items.map(i => `"${i.id}","${i.title}","${i.severity}","${i.status}","${i.category}","${i.source}","${i.assignee}","${i.priority}","${i.createdAt}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sc-purple-team-data.csv'; a.click();
    URL.revokeObjectURL(url);
  }


  // --- Domain Rules Engine ---
  @state() private _ptRules: { id: string; name: string; category: string; severity: Severity; enabled: boolean; lastEval: string; passRate: number }[] = [];
  private _initPtRules() {
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
    this._ptRules = rules;
  }
  private _evaluatePtRules(): { passed: number; failed: number; skipped: number; total: number } {
    let passed = 0, failed = 0, skipped = 0;
    this._ptRules.forEach(r => { if (!r.enabled) { skipped++; } else if (r.passRate >= 80) { passed++; } else { failed++; } });
    return { passed, failed, skipped, total: this._ptRules.length };
  }

  // --- CVSS Scoring ---
  @state() private _ptcvssData: { itemId: string; vector: string; base: number; temporal: number; environmental: number; overall: number }[] = [];
  private _initPtCvss() {
    const vectors = ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:A/AC:H/PR:L/UI:R/S:C/C:L/I:L/A:N', 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N', 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:N/I:L/A:N'];
    this._ptcvssData = vectors.map((v, i) => {
      const base = parseFloat((Math.random() * 6 + 3).toFixed(1));
      const temporal = parseFloat((base * (0.7 + Math.random() * 0.3)).toFixed(1));
      const environmental = parseFloat((temporal * (0.8 + Math.random() * 0.2)).toFixed(1));
      return { itemId: 'V-' + String(i + 1).padStart(3, '0'), vector: v, base, temporal, environmental, overall: environmental };
    });
  }

  // --- Anomaly Detection ---
  @state() private _ptanomalies: { id: string; type: string; severity: Severity; description: string; detected: string; confidence: number; affected: string[] }[] = [];
  private _runPtAnomalyDetection() {
    const types = [
      { type: 'Spike in violation rate', severity: 'high' as Severity, desc: 'Detected 280% increase in violations over the last 24 hours', affected: ['Core', 'Operations'] },
      { type: 'SLA breach pattern', severity: 'critical' as Severity, desc: 'Recurring SLA breaches on weekends indicating staffing gaps', affected: ['SLA', 'Staffing'] },
      { type: 'Baseline drift detected', severity: 'medium' as Severity, desc: 'Score drifted 10 points below established baseline over 7 days', affected: ['Metrics', 'Baseline'] },
      { type: 'Unusual escalation volume', severity: 'high' as Severity, desc: 'Escalation rate 2.5x above normal in infrastructure controls', affected: ['Infrastructure', 'Controls'] },
      { type: 'Stale findings accumulation', severity: 'low' as Severity, desc: '18 findings older than 90 days without status change', affected: ['Maintenance'] },
    ];
    this._ptanomalies = types.map((a, i) => ({
      id: 'ANO-' + String(i + 1).padStart(3, '0'), type: a.type, severity: a.severity,
      description: a.desc, detected: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(2)), affected: a.affected,
    }));
  }

  // --- Trend Prediction ---
  @state() private _ptpredictions: { horizon: string; metric: string; current: number; predicted: number; direction: 'up' | 'down' | 'stable'; confidence: number }[] = [];
  private _generatePtPredictions() {
    this._ptpredictions = [
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
  @state() private _ptApprovals: { id: string; title: string; requester: string; status: 'pending' | 'approved' | 'rejected' | 'expired'; createdAt: string; priority: Priority; type: string }[] = [];
  private _initPtApprovals() {
    this._ptApprovals = [
      { id: 'APR-001', title: 'Emergency exception request for critical finding', requester: 'Alice Chen', status: 'pending', createdAt: '2026-04-23T07:00:00Z', priority: 'p1', type: 'Exception' },
      { id: 'APR-002', title: 'Extend compliance deadline for quarterly audit', requester: 'Bob Martinez', status: 'pending', createdAt: '2026-04-22T18:00:00Z', priority: 'p2', type: 'Extension' },
      { id: 'APR-003', title: 'Disable security control for system migration', requester: 'Carol Wu', status: 'rejected', createdAt: '2026-04-22T14:00:00Z', priority: 'p1', type: 'Policy Change' },
      { id: 'APR-004', title: 'New assessment approval for third-party vendor', requester: 'Dave Kim', status: 'approved', createdAt: '2026-04-21T10:00:00Z', priority: 'p3', type: 'Vendor' },
      { id: 'APR-005', title: 'Network rule change for partner integration', requester: 'Eve Johnson', status: 'expired', createdAt: '2026-04-19T08:00:00Z', priority: 'p2', type: 'Network' },
    ];
  }
  private _approvePtItem(id: string) { const item = this._ptApprovals.find(a => a.id === id); if (item) item.status = 'approved'; this.requestUpdate(); }
  private _rejectPtItem(id: string) { const item = this._ptApprovals.find(a => a.id === id); if (item) item.status = 'rejected'; this.requestUpdate(); }

  // --- Activity Feed ---
  @state() private _ptActivity: { id: string; action: string; user: string; target: string; timestamp: string }[] = [];
  private _initPtActivity() {
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
    this._ptActivity = actions.map((a, i) => ({ id: 'ACT-' + String(i + 1).padStart(3, '0'), ...a, timestamp: new Date(Date.now() - i * 3600000).toISOString() }));
  }

  // --- Notification System ---
  @state() private _ptNotifications: { id: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; read: boolean; timestamp: string }[] = [];
  private _initPtNotifications() {
    this._ptNotifications = [
      { id: 'NTF-001', message: 'Score dropped below threshold', type: 'warning', read: false, timestamp: new Date().toISOString() },
      { id: 'NTF-002', message: '3 items approaching SLA deadline within 24h', type: 'error', read: false, timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: 'NTF-003', message: 'Weekly report generated successfully', type: 'success', read: true, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'NTF-004', message: 'New framework mapped to existing controls', type: 'info', read: true, timestamp: new Date(Date.now() - 14400000).toISOString() },
    ];
  }
  private _markPtNotifRead(id: string) { const n = this._ptNotifications.find(x => x.id === id); if (n) n.read = true; this.requestUpdate(); }

  // --- Panel Configuration ---
  @state() private _ptConfig: { layout: 'compact' | 'default' | 'expanded'; theme: 'dark' | 'midnight' | 'slate'; showAnomalies: boolean; showPredictions: boolean; autoRefresh: boolean; refreshInterval: number } = {
    layout: 'default', theme: 'dark', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60,
  };
  private _ptPresets: { name: string; config: typeof this._ptConfig }[] = [
    { name: 'Analyst View', config: { layout: 'expanded', theme: 'dark', showAnomalies: true, showPredictions: false, autoRefresh: true, refreshInterval: 30 } },
    { name: 'Executive Summary', config: { layout: 'compact', theme: 'slate', showAnomalies: false, showPredictions: true, autoRefresh: false, refreshInterval: 300 } },
    { name: 'Audit Mode', config: { layout: 'expanded', theme: 'midnight', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60 } },
  ];
  private _applyPtPreset(preset: typeof this._ptPresets[0]) { this._ptConfig = { ...preset.config }; this.requestUpdate(); }

  private _renderPtTreemapSVG(): string {
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

  private _renderPtSankeySVG(): string {
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
  private _renderPtRules(): any {
    const ev = this._evaluatePtRules();
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
          $${this._ptRules.map(r => html`
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
  private _renderPtAnomalies(): any {
    const sc = (s: Severity) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Anomaly Detection</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._ptanomalies.map(a => html`
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
  private _renderPtPredictions(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Trend Predictions</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          $${this._ptpredictions.map(pr => html`
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
  private _renderPtApprovals(): any {
    const stc = (s: string) => s === 'pending' ? '#eab308' : s === 'approved' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#6b7280';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Approval Workflow</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._ptApprovals.map(a => html`
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
                  <button class="btn success" style="padding:2px 8px;font-size:9px" @click=$${() => this._approvePtItem(a.id)}>Approve</button>
                  <button class="btn error" style="padding:2px 8px;font-size:9px" @click=$${() => this._rejectPtItem(a.id)}>Reject</button>
                </div>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Activity Feed ---
  private _renderPtActivity(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Activity Feed</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto">
          $${this._ptActivity.map(a => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <div style="width:20px;height:20px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;font-size:9px">•</div>
              <div style="flex:1"><span style="font-weight:600">$${a.user}</span> $${a.action}</div>
              <span style="font-size:8px;color:#6b7280">$${new Date(a.timestamp).toLocaleTimeString()}</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Notifications ---
  private _renderPtNotifications(): any {
    const tc = (t: string) => t === 'error' ? '#ef4444' : t === 'warning' ? '#eab308' : t === 'success' ? '#22c55e' : '#3b82f6';
    const unread = this._ptNotifications.filter(n => !n.read).length;
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Notifications $${unread > 0 ? html`<span class="badge badge-error">$${unread} new</span>` : nothing}</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:120px;overflow-y:auto">
          $${this._ptNotifications.map(n => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:$${n.read ? '#1f2937' : '#252a36'};border-radius:4px;font-size:10px;opacity:$${n.read ? '0.6' : '1'};cursor:pointer" @click=$${() => this._markPtNotifRead(n.id)}>
              <span style="width:8px;height:8px;border-radius:50%;background:$${tc(n.type)}"></span>
              <span style="flex:1">$${n.message}</span>
              $${!n.read ? html`<span style="width:6px;height:6px;border-radius:50%;background:#3b82f6"></span>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Panel Config ---
  private _renderPtConfig(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Panel Configuration</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Layout</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._ptConfig.layout = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="compact" ?selected=$${this._ptConfig.layout === 'compact'}>Compact</option>
              <option value="default" ?selected=$${this._ptConfig.layout === 'default'}>Default</option>
              <option value="expanded" ?selected=$${this._ptConfig.layout === 'expanded'}>Expanded</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Theme</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._ptConfig.theme = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="dark" ?selected=$${this._ptConfig.theme === 'dark'}>Dark</option>
              <option value="midnight" ?selected=$${this._ptConfig.theme === 'midnight'}>Midnight</option>
              <option value="slate" ?selected=$${this._ptConfig.theme === 'slate'}>Slate</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Auto Refresh</span>
            <input type="checkbox" ?checked=$${this._ptConfig.autoRefresh} @change=$${() => { this._ptConfig.autoRefresh = !this._ptConfig.autoRefresh; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Anomalies</span>
            <input type="checkbox" ?checked=$${this._ptConfig.showAnomalies} @change=$${() => { this._ptConfig.showAnomalies = !this._ptConfig.showAnomalies; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Predictions</span>
            <input type="checkbox" ?checked=$${this._ptConfig.showPredictions} @change=$${() => { this._ptConfig.showPredictions = !this._ptConfig.showPredictions; this.requestUpdate(); }}/>
          </div>
          <div style="margin-top:6px;font-weight:600">Presets</div>
          <div style="display:flex;gap:4px">
            $${this._ptPresets.map(ps => html`<button class="btn" style="padding:2px 8px;font-size:9px" @click=$${() => this._applyPtPreset(ps)}>$${ps.name}</button>`)}
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
  @state() private _ptFairModel: any = null;
  @state() private _ptRiskHeatMap: any = null;
  @state() private _ptRiskAppetite: any = null;
  @state() private _ptMonteCarlo: any = null;
  @state() private _ptRiskRegister: any = null;
  @state() private _ptRiskTrend: any = null;

  private ptInitRiskQuant() {
    this._ptFairModel = {
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
    this._ptRiskHeatMap = ((): any[] => {
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
    this._ptRiskAppetite = {
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
    this._ptMonteCarlo = ((): any[] => {
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
    this._ptRiskRegister = [
      { id: "RSK-001", name: "Credential Stuffing", owner: "IAM Team", likelihood: 4, impact: 3, score: 12, status: "Mitigating", trend: "improving" },
      { id: "RSK-002", name: "Cloud Data Exposure", owner: "Cloud Sec", likelihood: 3, impact: 5, score: 15, status: "Open", trend: "stable" },
      { id: "RSK-003", name: "Third-Party Breach", owner: "GRC Team", likelihood: 3, impact: 4, score: 12, status: "Mitigating", trend: "worsening" },
      { id: "RSK-004", name: "Insider Data Theft", owner: "HR + SecOps", likelihood: 2, impact: 4, score: 8, status: "Monitoring", trend: "stable" },
      { id: "RSK-005", name: "Ransomware", owner: "SecOps", likelihood: 4, impact: 5, score: 20, status: "Mitigating", trend: "improving" },
      { id: "RSK-006", name: "API Security Flaw", owner: "AppSec", likelihood: 3, impact: 3, score: 9, status: "Open", trend: "worsening" },
      { id: "RSK-007", name: "Compliance Violation", owner: "GRC Team", likelihood: 2, impact: 5, score: 10, status: "Mitigating", trend: "improving" },
      { id: "RSK-008", name: "Social Engineering", owner: "SecAwareness", likelihood: 5, impact: 2, score: 10, status: "Monitoring", trend: "stable" }
    ];
    this._ptRiskTrend = [
      { month: "Oct", critical: 3, high: 8, medium: 15, low: 22 },
      { month: "Nov", critical: 2, high: 7, medium: 14, low: 24 },
      { month: "Dec", critical: 4, high: 9, medium: 16, low: 20 },
      { month: "Jan", critical: 3, high: 8, medium: 13, low: 21 },
      { month: "Feb", critical: 2, high: 6, medium: 12, low: 23 },
      { month: "Mar", critical: 1, high: 5, medium: 11, low: 25 }
    ];
  }

  private ptRenderRiskQuant() {
    const fm = this._ptFairModel;
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
          ${this._ptRiskHeatMap.map((c: any) => html`<div style="background:${c.color}22;border:1px solid ${c.color}44;border-radius:2px;padding:3px;text-align:center;color:${c.color}">
              <div>${c.score}</div>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Monte Carlo Simulation (20 iterations)</div>
            ${this._ptMonteCarlo.slice(0, 10).map((r: any) => html`<div style="display:flex;gap:4px;font-size:8px;margin-bottom:1px">
                <span style="color:#888;width:20px">#${r.iteration}</span>
                <div style="flex:1;background:#1a1d27;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(r.loss / 8000000) * 100}%;background:${r.loss > 5000000 ? "#f44" : r.loss > 3000000 ? "#f84" : "#4caf50"}"></div>
                </div>
                <span style="color:#ccc;width:40px;text-align:right">${fmt(r.loss)}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Risk Register (Top 8)</div>
            ${this._ptRiskRegister.map((r: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
                <span style="color:${sevColor(r.score)};font-weight:bold;width:16px">${r.score}</span>
                <span style="color:#ccc;flex:1">${r.name}</span>
                <span style="color:${r.trend === "improving" ? "#4caf50" : r.trend === "worsening" ? "#f44" : "#888"};font-size:7px">${r.trend}</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:8px 0 4px">Risk Trend (6 months)</div>
        <div style="display:flex;gap:4px;align-items:flex-end;height:50px">
          ${this._ptRiskTrend.map((t: any) => html`<div style="flex:1;display:flex;flex-direction:column;gap:1px;align-items:center">
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
  @state() private _ptOkrs: any = null;
  @state() private _ptInitiatives: any = null;
  @state() private _ptResourceAlloc: any = null;
  @state() private _ptHeadcount: any = null;
  @state() private _ptMilestones: any = null;
  @state() private _ptBudget: any = null;

  private ptInitSecProgram() {
    this._ptOkrs = [
      { objective: "Reduce Mean Time to Detect", keyResults: [{ kr: "MTTD < 24 hours", progress: 72 }, { kr: "Deploy EDR to 100% endpoints", progress: 89 }, { kr: "SIEM coverage 95%+", progress: 81 }], overallProgress: 81 },
      { objective: "Eliminate Critical Vulnerabilities in 7 days", keyResults: [{ kr: "Patch SLA compliance > 95%", progress: 67 }, { kr: "Zero critical vulns > 30 days", progress: 45 }, { kr: "Automated patching 80%+", progress: 58 }], overallProgress: 57 },
      { objective: "Achieve Zero Trust Architecture", keyResults: [{ kr: "Micro-segment 90% workloads", progress: 63 }, { kr: "ZTNA adoption 100%", progress: 78 }, { kr: "Continuous verification deployed", progress: 54 }], overallProgress: 65 },
      { objective: "Build Security-First Culture", keyResults: [{ kr: "Phishing click rate < 3%", progress: 85 }, { kr: "Security training 100%", progress: 92 }, { kr: "DevSecOps maturity L3+", progress: 48 }], overallProgress: 75 }
    ];
    this._ptInitiatives = [
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
    this._ptResourceAlloc = [
      { domain: "Security Operations", allocated: 35, used: 31, budget: 2800000 },
      { domain: "Identity & Access", allocated: 12, used: 11, budget: 960000 },
      { domain: "Application Security", allocated: 10, used: 8, budget: 800000 },
      { domain: "Cloud Security", allocated: 8, used: 9, budget: 640000 },
      { domain: "GRC & Compliance", allocated: 8, used: 7, budget: 640000 },
      { domain: "Threat Intelligence", allocated: 5, used: 4, budget: 400000 },
      { domain: "Security Engineering", allocated: 7, used: 6, budget: 560000 }
    ];
    this._ptHeadcount = {
      total: 85, filled: 72, open: 13, budget: 10200000,
      byLevel: [{ level: "L3 (Senior)", count: 28, target: 32 }, { level: "L4 (Staff)", count: 18, target: 20 }, { level: "L5 (Principal)", count: 8, target: 10 }, { level: "L2 (Mid)", count: 14, target: 15 }, { level: "L1 (Junior)", count: 4, target: 8 }],
      criticalRoles: ["Cloud Security Architect", "Senior Threat Hunter", "AppSec Engineer", "SOC Analyst L2"]
    };
    this._ptMilestones = [
      { initiative: "Zero Trust", milestone: "Micro-seg Phase 2 complete", due: "2026-03-31", status: "On Track", rag: "green" },
      { initiative: "SOC Mod", milestone: "SOAR platform deployed", due: "2026-04-15", status: "At Risk", rag: "amber" },
      { initiative: "Cloud Sec", milestone: "CSPM full coverage", due: "2026-05-01", status: "Behind", rag: "red" },
      { initiative: "AppSec", milestone: "SAST in all CI/CD", due: "2026-06-30", status: "On Track", rag: "green" },
      { initiative: "IAM", milestone: "PAM deployment complete", due: "2026-04-30", status: "Delayed", rag: "red" },
      { initiative: "Automation", milestone: "50% alert triage automated", due: "2026-05-15", status: "On Track", rag: "green" }
    ];
    this._ptBudget = {
      total: 10200000, allocated: 9650000, spent: 5480000, remaining: 4170000,
      quarterly: [{ q: "Q1", allocated: 2412500, spent: 2412500 }, { q: "Q2", allocated: 2412500, spent: 1950000 }, { q: "Q3", allocated: 2412500, spent: 1117500 }, { q: "Q4", allocated: 2412500, spent: 0 }],
      byCategory: [{ cat: "Personnel", pct: 68 }, { cat: "Tools & Licenses", pct: 18 }, { cat: "Services", pct: 9 }, { cat: "Training", pct: 5 }]
    };
  }

  private ptRenderSecProgram() {
    const okrs = this._ptOkrs;
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
          ${this._ptInitiatives.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
              <span style="color:${i.priority === "P0" ? "#f44" : i.priority === "P1" ? "#f84" : "#888"};font-weight:bold;width:16px">${i.priority}</span>
              <span style="color:#ccc;flex:1">${i.name}</span>
              <span style="color:${statusColor(i.status)};width:50px">${i.status}</span>
              <span style="color:#888;width:24px;text-align:right">${i.completion}%</span>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Resource Allocation</div>
            ${this._ptResourceAlloc.slice(0, 5).map((r: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:90px">${r.domain}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(r.used / r.allocated) * 100}%;background:${r.used > r.allocated ? "#f44" : "#48f"}"></div>
                </div>
                <span style="color:#888">${r.used}/${r.allocated}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Budget Utilization</div>
            <div style="font-size:9px;color:#ccc;margin-bottom:4px">Total: ${fmt(this._ptBudget.total)} | Spent: ${fmt(this._ptBudget.spent)}</div>
            ${this._ptBudget.quarterly.map((q: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#888;width:16px">${q.q}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(q.spent / q.allocated) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#aaa">${fmt(q.spent)}</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">Milestone Tracker</div>
        ${this._ptMilestones.map((m: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <div style="width:6px;height:6px;border-radius:50%;background:${ragColor(m.rag)}"></div>
            <span style="color:#ccc;width:60px">${m.initiative}</span>
            <span style="color:#bbb;flex:1">${m.milestone}</span>
            <span style="color:#888">${m.due}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Third-Party Risk Assessment ===
  @state() private _ptVendorTiers: any = null;
  @state() private _ptDueDiligence: any = null;
  @state() private _ptContractClauses: any = null;
  @state() private _ptVendorScorecard: any = null;
  @state() private _ptSubProcessors: any = null;
  @state() private _ptVendorIncidents: any = null;

  private ptInitThirdParty() {
    this._ptVendorTiers = [
      { tier: "Critical", count: 8, vendors: ["AWS", "Azure AD", "CrowdStrike", "Okta", "ServiceNow", "Salesforce", "Workday", "Datadog"] },
      { tier: "High", count: 14, vendors: ["Slack", "GitHub", "Jenkins", "Terraform", "Artifactory", "Snyk", "Palo Alto", "Zscaler"] },
      { tier: "Medium", count: 32, vendors: ["Figma", "Confluence", "Zoom", "Dropbox", "Notion", "Linear"] },
      { tier: "Low", count: 67, vendors: ["Various SaaS tools", "Utilities", "Dev tools"] }
    ];
    this._ptDueDiligence = [
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
    this._ptContractClauses = [
      { clause: "Data Breach Notification", vendors: 98, compliant: 89, gap: 9 },
      { clause: "Right to Audit", vendors: 85, compliant: 72, gap: 13 },
      { clause: "Data Return on Termination", vendors: 92, compliant: 78, gap: 14 },
      { clause: "Liability Cap", vendors: 90, compliant: 65, gap: 25 },
      { clause: "Sub-processor Restrictions", vendors: 88, compliant: 80, gap: 8 },
      { clause: "Encryption Requirements", vendors: 95, compliant: 91, gap: 4 },
      { clause: "Incident Response SLA", vendors: 86, compliant: 74, gap: 12 },
      { clause: "Data Residency", vendors: 78, compliant: 62, gap: 16 }
    ];
    this._ptVendorScorecard = [
      { vendor: "AWS", security: 92, compliance: 95, reliability: 98, risk: "Low", overall: 95 },
      { vendor: "CrowdStrike", security: 94, compliance: 90, reliability: 96, risk: "Low", overall: 93 },
      { vendor: "Okta", security: 85, compliance: 92, reliability: 90, risk: "Low", overall: 89 },
      { vendor: "GitHub", security: 82, compliance: 78, reliability: 94, risk: "Medium", overall: 85 },
      { vendor: "Slack", security: 78, compliance: 80, reliability: 92, risk: "Medium", overall: 83 },
      { vendor: "Figma", security: 75, compliance: 72, reliability: 88, risk: "Medium", overall: 78 },
      { vendor: "Linear", security: 70, compliance: 65, reliability: 90, risk: "Medium", overall: 75 },
      { vendor: "StartupAI Inc", security: 55, compliance: 48, reliability: 72, risk: "High", overall: 58 }
    ];
    this._ptSubProcessors = [
      { vendor: "AWS", subProcessors: ["CloudFront", "S3 (US-East)", "DynamoDB", "Lambda"], reviewed: "2026-01" },
      { vendor: "CrowdStrike", subProcessors: ["AWS (hosting)", "Snowflake (analytics)"], reviewed: "2026-02" },
      { vendor: "Okta", subProcessors: ["AWS", "MongoDB Atlas"], reviewed: "2026-01" },
      { vendor: "Salesforce", subProcessors: ["AWS", "Heroku", "MuleSoft"], reviewed: "2025-11" },
      { vendor: "Datadog", subProcessors: ["GCP", "AWS"], reviewed: "2026-03" }
    ];
    this._ptVendorIncidents = [
      { vendor: "Okta", date: "2026-01-15", severity: "Medium", description: "Support access breach", resolved: true, ourImpact: "None" },
      { vendor: "Cloudflare", date: "2026-02-20", severity: "Low", description: "Config exposure", resolved: true, ourImpact: "Minimal" },
      { vendor: "GitHub", date: "2026-03-05", severity: "Low", description: "Dependency confusion", resolved: true, ourImpact: "None" },
      { vendor: "StartupAI Inc", date: "2026-03-18", severity: "High", description: "Data exposure incident", resolved: false, ourImpact: "Under review" }
    ];
  }

  private ptRenderThirdParty() {
    const tiers = this._ptVendorTiers;
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
            ${this._ptDueDiligence.slice(0, 8).map((d: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
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
            ${this._ptContractClauses.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;flex:1">${c.clause}</span>
                <span style="color:${c.gap > 15 ? "#f44" : c.gap > 8 ? "#f84" : "#4caf50"};width:28px;text-align:right">${c.gap} gap</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">Vendor Security Scorecard</div>
        ${this._ptVendorScorecard.map((v: any) => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:8px">
            <span style="color:#ccc;width:80px;flex-shrink:0">${v.vendor}</span>
            <div style="display:flex;gap:2px;flex:1">
              <div title="Security" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.security}%;background:#48f"></div></div>
              <div title="Compliance" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.compliance}%;background:#4caf50"></div></div>
              <div title="Reliability" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.reliability}%;background:#ff9800"></div></div>
            </div>
            <span style="color:${tierColor(v.risk)};font-weight:bold;width:40px;text-align:right">${v.overall}</span>
          </div>`)}
        <div style="color:#aaa;font-size:10px;margin:8px 0 4px">Vendor Incidents (Recent)</div>
        ${this._ptVendorIncidents.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <div style="width:6px;height:6px;border-radius:50%;background:${sevColor(i.severity)}"></div>
            <span style="color:#ccc;width:70px">${i.vendor}</span>
            <span style="color:#bbb;flex:1">${i.description}</span>
            <span style="color:${i.resolved ? "#4caf50" : "#f44"}">${i.resolved ? "Resolved" : "Open"}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Data Loss Prevention ===
  @state() private _ptDlpRules: any = null;
  @state() private _ptDataMovement: any = null;
  @state() private _ptDataDiscovery: any = null;
  @state() private _ptDlpIncidents: any = null;
  @state() private _ptEncryptionMatrix: any = null;

  private ptInitDLP() {
    this._ptDlpRules = [
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
    this._ptDataMovement = {
      totalEvents: 15847, monitored: 12456, blocked: 1533, allowed: 10923,
      byChannel: [{ channel: "Email", events: 5234, blocked: 892 }, { channel: "Cloud Upload", events: 4123, blocked: 345 }, { channel: "USB", events: 1234, blocked: 198 }, { channel: "Network", events: 3890, blocked: 67 }, { channel: "Print", events: 1366, blocked: 31 }],
      bySensitivity: [{ level: "Confidential", pct: 35 }, { level: "Internal", pct: 45 }, { level: "Public", pct: 20 }]
    };
    this._ptDataDiscovery = [
      { location: "SharePoint", total: 245000, sensitive: 12300, unclassified: 45000, lastScan: "2026-04-20" },
      { location: "S3 Buckets", total: 189000, sensitive: 8900, unclassified: 32000, lastScan: "2026-04-21" },
      { location: "Database Servers", total: 3400, sensitive: 2100, unclassified: 800, lastScan: "2026-04-19" },
      { location: "File Shares", total: 156000, sensitive: 6700, unclassified: 28000, lastScan: "2026-04-18" },
      { location: "Endpoints", total: 89000, sensitive: 3400, unclassified: 15000, lastScan: "2026-04-21" }
    ];
    this._ptDlpIncidents = [
      { id: "DLP-001", type: "PII Exposure", status: "Resolved", severity: "Critical", assignee: "SecOps", time: "2h" },
      { id: "DLP-002", type: "Source Code Leak", status: "Investigating", severity: "High", assignee: "AppSec", time: "4h" },
      { id: "DLP-003", type: "Credential Commit", status: "Resolved", severity: "High", assignee: "DevSecOps", time: "1h" },
      { id: "DLP-004", type: "Bulk Export", status: "Monitoring", severity: "Medium", assignee: "SOC", time: "8h" },
      { id: "DLP-005", type: "API Key in Log", status: "Resolved", severity: "Medium", assignee: "SecOps", time: "30m" }
    ];
    this._ptEncryptionMatrix = [
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

  private ptRenderDLP() {
    const rules = this._ptDlpRules;
    if (!rules) return nothing;
    const sevColor = (s: string) => s === "Critical" ? "#f44" : s === "High" ? "#f84" : "#ff8";
    const statusColor = (s: string) => s === "Resolved" ? "#4caf50" : s === "Investigating" ? "#f84" : "#ff8";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Data Loss Prevention</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
          ${[["Monitored",this._ptDataMovement.monitored.toLocaleString(),"#48f"],["Blocked",this._ptDataMovement.blocked.toLocaleString(),"#f44"],["Rules",rules.length,"#ff8"],["Incidents",this._ptDlpIncidents.length,"#f84"]].map(([l,v,c]) => html`<div style="background:#1a1d27;border-radius:4px;padding:6px;text-align:center">
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
            ${this._ptDataMovement.byChannel.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:60px">${c.channel}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(c.events / 5500) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#888;width:30px;text-align:right">${c.blocked}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Encryption Coverage</div>
            ${this._ptEncryptionMatrix.map((e: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:60px">${e.data}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${e.coverage}%;background:${e.coverage >= 95 ? "#4caf50" : e.coverage >= 85 ? "#ff9800" : "#f44"}"></div>
                </div>
                <span style="color:#888;width:28px;text-align:right">${e.coverage}%</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">DLP Incident Response</div>
        ${this._ptDlpIncidents.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <span style="color:${statusColor(i.status)};width:70px">${i.status}</span>
            <span style="color:#ccc;flex:1">${i.type}</span>
            <span style="color:${sevColor(i.severity)}">${i.severity}</span>
            <span style="color:#888">${i.time}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Security Automation Metrics ===
  @state() private _ptAutoMetrics: any = null;
  @state() private _ptAutoTimeSaved: any = null;
  @state() private _ptAutoReliability: any = null;
  @state() private _ptAutoComparison: any = null;
  @state() private _ptAutoROI: any = null;
  @state() private _ptAutoCandidates: any = null;

  private ptInitAutomation() {
    this._ptAutoMetrics = {
      totalPlaybooks: 48, activePlaybooks: 42, triggered: 12847, successful: 12156, failed: 691,
      coverage: 67, targetCoverage: 85, mttrReduction: 58, falsePositiveRate: 3.2
    };
    this._ptAutoTimeSaved = [
      { task: "Alert Triage", manualMin: 15, autoMin: 0.5, daily: 120, savedHours: 2920 },
      { task: "Vuln Scanning", manualMin: 60, autoMin: 5, daily: 8, savedHours: 2730 },
      { task: "Patch Deployment", manualMin: 45, autoMin: 10, daily: 15, savedHours: 2555 },
      { task: "User Provisioning", manualMin: 30, autoMin: 2, daily: 25, savedHours: 1825 },
      { task: "Compliance Reporting", manualMin: 120, autoMin: 15, daily: 1, savedHours: 639 },
      { task: "Incident Escalation", manualMin: 10, autoMin: 1, daily: 45, savedHours: 2737 },
      { task: "Log Analysis", manualMin: 90, autoMin: 8, daily: 3, savedHours: 1277 },
      { task: "Threat Intel Enrichment", manualMin: 20, autoMin: 3, daily: 60, savedHours: 1972 }
    ];
    this._ptAutoReliability = [
      { playbook: "Phishing Auto-Block", success: 98.5, executions: 4521, avgTime: "1.2s" },
      { playbook: "Vuln Auto-Scan", success: 97.2, executions: 2340, avgTime: "4.5m" },
      { playbook: "User Offboard", success: 99.1, executions: 156, avgTime: "30s" },
      { playbook: "Alert Enrichment", success: 96.8, executions: 8945, avgTime: "3.1s" },
      { playbook: "Malware Isolate", success: 95.4, executions: 89, avgTime: "8.2s" },
      { playbook: "Compliance Check", success: 94.7, executions: 365, avgTime: "2.1m" }
    ];
    this._ptAutoComparison = [
      { process: "Vulnerability Management", manual: 45, automated: 12, reduction: 73 },
      { process: "Incident Response", manual: 180, automated: 65, reduction: 64 },
      { process: "Access Reviews", manual: 30, automated: 5, reduction: 83 },
      { process: "Compliance Audits", manual: 120, automated: 45, reduction: 63 },
      { process: "Threat Detection", manual: 60, automated: 8, reduction: 87 },
      { process: "Configuration Drift", manual: 40, automated: 10, reduction: 75 }
    ];
    this._ptAutoROI = {
      investment: 850000, annualSavings: 2100000, roi: 147,
      costAvoidance: 1200000, efficiencyGain: 900000, headcountSaved: 4.5
    };
    this._ptAutoCandidates = [
      { task: "Security Questionnaire Response", complexity: "Medium", savings: "120 hrs/yr", priority: "High" },
      { task: "Certificate Rotation", complexity: "Low", savings: "80 hrs/yr", priority: "High" },
      { task: "Firewall Rule Review", complexity: "High", savings: "200 hrs/yr", priority: "Medium" },
      { task: "Data Classification Tagging", complexity: "Medium", savings: "150 hrs/yr", priority: "High" },
      { task: "Vendor Risk Scoring", complexity: "Medium", savings: "90 hrs/yr", priority: "Medium" },
      { task: "Security Awareness Campaigns", complexity: "Low", savings: "60 hrs/yr", priority: "Low" }
    ];
  }

  private ptRenderAutomation() {
    const m = this._ptAutoMetrics;
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
            ${this._ptAutoTimeSaved.slice(0, 5).map((t: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:90px">${t.task}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(t.savedHours / 3000) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#888;width:40px;text-align:right">${t.savedHours}h</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Playbook Reliability</div>
            ${this._ptAutoReliability.map((p: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
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
              <div style="color:#4caf50;font-size:16px;font-weight:bold">${this._ptAutoROI.roi}%</div>
            </div>
            <div style="text-align:center">
              <div style="color:#aaa;font-size:9px">Annual Savings</div>
              <div style="color:#48f;font-size:16px;font-weight:bold">${(this._ptAutoROI.annualSavings / 1000000).toFixed(1)}M</div>
            </div>
            <div style="text-align:center">
              <div style="color:#aaa;font-size:9px">Headcount Saved</div>
              <div style="color:#ff8;font-size:16px;font-weight:bold">${this._ptAutoROI.headcountSaved}</div>
            </div>
            <div style="text-align:right">
              <div style="color:#aaa;font-size:9px">Investment</div>
              <div style="color:#ccc;font-size:16px;font-weight:bold">${(this._ptAutoROI.investment / 1000).toFixed(0)}K</div>
            </div>
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">Manual vs Automated (hours/process)</div>
        ${this._ptAutoComparison.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
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
        ${this._ptAutoCandidates.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <span style="color:${c.priority === "High" ? "#f44" : c.priority === "Medium" ? "#f84" : "#888"};font-weight:bold;width:40px">${c.priority}</span>
            <span style="color:#ccc;flex:1">${c.task}</span>
            <span style="color:#888">${c.savings}</span>
          </div>`)}
      </div>`;
  }

  // Round 17 initialization
  private ptInitRound17() {
    this.ptInitRiskQuant();
    this.ptInitSecProgram();
    this.ptInitThirdParty();
    this.ptInitDLP();
    this.ptInitAutomation();
  }

  private ptRenderRound17() {
    return html`${this.ptRenderRiskQuant()}${this.ptRenderSecProgram()}${this.ptRenderThirdParty()}${this.ptRenderDLP()}${this.ptRenderAutomation()}`;
  }

  // === Threat Intelligence Correlation Engine Module ===
  private _threatIntelFeeds: Array<{feedId: string; name: string; source: string; type: string; freshness: string; iocCount: number; confidence: number; lastSync: string; status: string}> = [];
  private _correlatedThreats: Array<{id: string; name: string; sources: string[]; confidence: number; severity: string; iocs: string[]; actor: string; campaign: string; firstSeen: string; lastSeen: string; description: string}> = [];
  private _threatActors: Array<{actorId: string; name: string; alias: string; country: string; motivation: string; sophistication: string; campaigns: number; activeIocs: number; lastActivity: string; ttps: string[]}> = [];
  private _iocStalenessData: Array<{ioc: string; type: string; firstSeen: string; lastSeen: string; feedCount: number; confidence: number; isStale: boolean; ageDays: number}> = [];
  private _threatLandscapeRadar: Array<{category: string; threatLevel: number; trend: string; topActor: string; keyIndicators: string[]; recentIncidents: number}> = [];
  private _threatBriefs: Array<{id: string; title: string; generatedAt: string; scope: string; summary: string; keyFindings: string[]; iocHighlights: string[]; recommendedActions: string[]}> = [];

  private _initThreatIntelEngine(): void {
    this._threatIntelFeeds = [
      {feedId: 'feed-001', name: 'MISP Community', source: 'MISP', type: 'Open Source', freshness: '1h', iocCount: 284756, confidence: 0.72, lastSync: '2024-12-16T08:00:00Z', status: 'active'},
      {feedId: 'feed-002', name: 'AlienVault OTX', source: 'AlienVault', type: 'Open Source', freshness: '30m', iocCount: 456123, confidence: 0.68, lastSync: '2024-12-16T08:30:00Z', status: 'active'},
      {feedId: 'feed-003', name: 'CrowdStrike Intel', source: 'CrowdStrike', type: 'Commercial', freshness: '15m', iocCount: 89234, confidence: 0.91, lastSync: '2024-12-16T08:45:00Z', status: 'active'},
      {feedId: 'feed-004', name: 'Mandiant Threat Intel', source: 'Mandiant', type: 'Commercial', freshness: '1h', iocCount: 67891, confidence: 0.93, lastSync: '2024-12-16T08:00:00Z', status: 'active'},
      {feedId: 'feed-005', name: 'Recorded Future', source: 'Recorded Future', type: 'Commercial', freshness: '5m', iocCount: 1245678, confidence: 0.87, lastSync: '2024-12-16T08:55:00Z', status: 'active'},
    ];
    this._correlatedThreats = [
      {id: 'corr-001', name: 'Cobalt Strike Beacon Variant', sources: ['CrowdStrike', 'Mandiant'], confidence: 0.95, severity: 'critical', iocs: ['C2: evil-c2[.]example[.]com', 'Hash: a1b2c3d4e5f6', 'Mutex: Global\\CS_Mutex_0x41'], actor: 'APT29', campaign: 'Operation Midnight Eclipse', firstSeen: '2024-12-10', lastSeen: '2024-12-16', description: 'New Cobalt Strike variant with enhanced evasion capabilities targeting financial sector'},
      {id: 'corr-002', name: 'Supply Chain Backdoor', sources: ['Recorded Future', 'Mandiant'], confidence: 0.88, severity: 'critical', iocs: ['Domain: update-service[.]cdn[.]net', 'IP: 198.51.100.23', 'Cert: CN=UpdateService'], actor: 'APT41', campaign: 'Soft Supply', firstSeen: '2024-12-08', lastSeen: '2024-12-15', description: 'Software supply chain compromise via trojanized update mechanism'},
      {id: 'corr-003', name: 'Phishing Kit Evolution', sources: ['AlienVault', 'MISP'], confidence: 0.76, severity: 'high', iocs: ['URL: login-secure[.]cloud[.]auth', 'Email: noreply@secure-verify[.]com'], actor: 'UNC2452', campaign: 'Credential Harvest Q4', firstSeen: '2024-12-05', lastSeen: '2024-12-16', description: 'Advanced phishing kit with real-time MFA bypass using adversary-in-the-middle proxy'},
      {id: 'corr-004', name: 'Ransomware-as-a-Service', sources: ['CrowdStrike', 'Recorded Future'], confidence: 0.82, severity: 'high', iocs: ['Hash: f7e8d9c0b1a2', 'Extension: .encrypted', 'Note: README_DECRYPT.txt'], actor: 'LockBit 4.0', campaign: 'Winter Storm', firstSeen: '2024-11-28', lastSeen: '2024-12-16', description: 'New LockBit variant targeting healthcare and education sectors with double extortion'},
      {id: 'corr-005', name: 'Zero-Day Exploit Chain', sources: ['Mandiant', 'CrowdStrike'], confidence: 0.91, severity: 'critical', iocs: ['CVE-2024-XXXX (Chrome)', 'CVE-2024-YYYY (Windows)', 'Payload: shellcode.bin'], actor: 'APT0', campaign: 'Chain Reaction', firstSeen: '2024-12-12', lastSeen: '2024-12-16', description: 'Chained zero-day exploits targeting browser and OS kernel for initial access'},
    ];
    this._threatActors = [
      {actorId: 'ta-001', name: 'APT29', alias: 'Cozy Bear, The Dukes', country: 'Russia', motivation: 'Espionage', sophistication: 'advanced', campaigns: 23, activeIocs: 1847, lastActivity: '2024-12-16', ttps: ['T1059.001', 'T1003', 'T1071.001', 'T1566.001']},
      {actorId: 'ta-002', name: 'APT41', alias: 'Double Dragon, Winnti', country: 'China', motivation: 'Financial/Espionage', sophistication: 'advanced', campaigns: 18, activeIocs: 2341, lastActivity: '2024-12-15', ttps: ['T1059.003', 'T1027', 'T1105', 'T1566.002']},
      {actorId: 'ta-003', name: 'LockBit', alias: 'LockBitSupp', country: 'Unknown', motivation: 'Financial', sophistication: 'high', campaigns: 45, activeIocs: 5623, lastActivity: '2024-12-16', ttps: ['T1486', 'T1490', 'T1059.003', 'T1027']},
      {actorId: 'ta-004', name: 'UNC2452', alias: 'Nobelium', country: 'Russia', motivation: 'Espionage', sophistication: 'advanced', campaigns: 12, activeIocs: 987, lastActivity: '2024-12-14', ttps: ['T1078', 'T1098', 'T1550.001', 'T1053.005']},
      {actorId: 'ta-005', name: 'Scattered Spider', alias: 'UNC3944, 0ktapus', country: 'USA/UK', motivation: 'Financial', sophistication: 'moderate', campaigns: 31, activeIocs: 3456, lastActivity: '2024-12-16', ttps: ['T1566.001', 'T1078.004', 'T1111', 'T1078.002']},
    ];
    this._iocStalenessData = [
      {ioc: '192.168.1.100', type: 'IPv4', firstSeen: '2024-06-01', lastSeen: '2024-12-15', feedCount: 5, confidence: 0.92, isStale: false, ageDays: 198},
      {ioc: 'evil-domain[.]com', type: 'Domain', firstSeen: '2024-03-15', lastSeen: '2024-08-20', feedCount: 3, confidence: 0.45, isStale: true, ageDays: 276},
      {ioc: 'a1b2c3d4e5f6', type: 'Hash', firstSeen: '2024-09-01', lastSeen: '2024-12-16', feedCount: 7, confidence: 0.88, isStale: false, ageDays: 107},
      {ioc: 'phish-login[.]secure[.]xyz', type: 'URL', firstSeen: '2024-01-10', lastSeen: '2024-04-05', feedCount: 2, confidence: 0.21, isStale: true, ageDays: 341},
      {ioc: ' trojan@malware[.]exe', type: 'File', firstSeen: '2024-11-01', lastSeen: '2024-12-14', feedCount: 4, confidence: 0.79, isStale: false, ageDays: 46},
      {ioc: '10.0.0.55', type: 'IPv4', firstSeen: '2024-05-20', lastSeen: '2024-07-15', feedCount: 1, confidence: 0.15, isStale: true, ageDays: 210},
    ];
    this._threatLandscapeRadar = [
      {category: 'Ransomware', threatLevel: 9, trend: 'increasing', topActor: 'LockBit 4.0', keyIndicators: ['Double extortion', 'RaaS expansion', 'Healthcare targeting'], recentIncidents: 47},
      {category: 'Supply Chain', threatLevel: 8, trend: 'increasing', topActor: 'APT41', keyIndicators: ['Dependency confusion', 'Trojanized packages', 'CI/CD compromise'], recentIncidents: 12},
      {category: 'Phishing', threatLevel: 7, trend: 'stable', topActor: 'Scattered Spider', keyIndicators: ['AiTM proxy', 'Vishing campaigns', 'Deepfake audio'], recentIncidents: 156},
      {category: 'Zero-Day', threatLevel: 8, trend: 'increasing', topActor: 'APT0', keyIndicators: ['Browser exploits', 'Mobile zero-days', 'IoT vulnerabilities'], recentIncidents: 8},
      {category: 'Insider Threat', threatLevel: 5, trend: 'stable', topActor: 'Various', keyIndicators: ['Data exfiltration', 'Credential abuse', 'Privilege escalation'], recentIncidents: 23},
      {category: 'Cloud Attacks', threatLevel: 7, trend: 'increasing', topActor: 'APT29', keyIndicators: ['Identity abuse', 'SaaS compromise', 'Container escape'], recentIncidents: 34},
    ];
    this._threatBriefs = [
      {id: 'brief-001', title: 'Daily Threat Intelligence Brief', generatedAt: '2024-12-16T09:00:00Z', scope: 'daily', summary: 'Critical: New Cobalt Strike variant detected targeting financial sector. High: LockBit 4.0 campaign expansion observed. 5 new zero-days reported in Chrome and Windows.', keyFindings: ['APT29 using new C2 infrastructure', 'LockBit 4.0 targeting healthcare', 'Supply chain compromise in npm packages'], iocHighlights: ['47 new malicious domains', '12 new C2 IPs', '3 new malware hashes'], recommendedActions: ['Update Chrome immediately', 'Block identified IoCs', 'Review supply chain dependencies']},
      {id: 'brief-002', title: 'Weekly Threat Landscape Report', generatedAt: '2024-12-15T18:00:00Z', scope: 'weekly', summary: 'This week saw a 23% increase in ransomware attacks globally. Supply chain attacks remain elevated. Phishing campaigns leveraging AI-generated content increased by 45%.', keyFindings: ['Ransomware attacks up 23%', 'AI-generated phishing up 45%', '3 major supply chain incidents', '2 zero-days exploited in wild'], iocHighlights: ['156 new malicious IPs', '89 new phishing domains', '34 new malware hashes', '12 new C2 certificates'], recommendedActions: ['Patch all critical CVEs', 'Enhance email filtering rules', 'Review third-party access', 'Update endpoint detection signatures']},
    ];
  }

  private _renderThreatIntelFeeds(): ReturnType<typeof html> {
    return html`
      <div class="threat-feeds-section">
        <div class="section-header">
          <h4>Intelligence Feed Status</h4>
        </div>
        <div class="feeds-grid">
          ${this._threatIntelFeeds.map(f => html`
            <div class="feed-card status-${f.status}">
              <div class="feed-header">
                <span class="feed-name">${f.name}</span>
                <span class="feed-type">${f.type}</span>
              </div>
              <div class="feed-stats">
                <span>IOCs: ${f.iocCount.toLocaleString()}</span>
                <span>Confidence: ${(f.confidence * 100).toFixed(0)}%</span>
                <span>Freshness: ${f.freshness}</span>
              </div>
              <div class="feed-sync">Last sync: ${f.lastSync}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderCorrelatedThreats(): ReturnType<typeof html> {
    return html`
      <div class="correlated-threats-section">
        <div class="section-header">
          <h4>Multi-Source Correlated Threats</h4>
        </div>
        <div class="threats-list">
          ${this._correlatedThreats.map(t => html`
            <div class="threat-card severity-${t.severity}">
              <div class="threat-header">
                <span class="threat-name">${t.name}</span>
                <span class="confidence-badge">${(t.confidence * 100).toFixed(0)}%</span>
                <span class="severity-badge ${t.severity}">${t.severity}</span>
              </div>
              <p class="threat-desc">${t.description}</p>
              <div class="threat-meta">
                <span>Actor: ${t.actor}</span>
                <span>Campaign: ${t.campaign}</span>
                <span>Sources: ${t.sources.join(', ')}</span>
              </div>
              <div class="threat-iocs">
                ${t.iocs.map(ioc => html`<span class="ioc-tag">${ioc}</span>`)}
              </div>
              <div class="threat-timeline">
                <span>First: ${t.firstSeen}</span>
                <span>Last: ${t.lastSeen}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderThreatActors(): ReturnType<typeof html> {
    return html`
      <div class="threat-actors-section">
        <div class="section-header">
          <h4>Threat Actor Campaign Tracking</h4>
        </div>
        <div class="actors-grid">
          ${this._threatActors.map(a => html`
            <div class="actor-card sophistication-${a.sophistication}">
              <div class="actor-header">
                <span class="actor-name">${a.name}</span>
                <span class="actor-country">${a.country}</span>
                <span class="actor-motivation">${a.motivation}</span>
              </div>
              <div class="actor-alias">${a.alias}</div>
              <div class="actor-stats">
                <span>Campaigns: ${a.campaigns}</span>
                <span>Active IOCs: ${a.activeIocs}</span>
                <span>Last Activity: ${a.lastActivity}</span>
              </div>
              <div class="actor-ttps">
                ${a.ttps.map(t => html`<span class="ttp-tag">${t}</span>`)}
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderIocStaleness(): ReturnType<typeof html> {
    const stale = this._iocStalenessData.filter(i => i.isStale);
    const fresh = this._iocStalenessData.filter(i => !i.isStale);
    return html`
      <div class="ioc-staleness-section">
        <div class="section-header">
          <h4>IOC Staleness Detection</h4>
          <span class="badge warning">${stale.length} Stale</span>
          <span class="badge success">${fresh.length} Fresh</span>
        </div>
        <div class="ioc-list">
          ${this._iocStalenessData.map(i => html`
            <div class="ioc-item ${i.isStale ? 'stale' : 'fresh'}">
              <div class="ioc-header">
                <span class="ioc-value">${i.ioc}</span>
                <span class="ioc-type">${i.type}</span>
                <span class="ioc-status ${i.isStale ? 'stale' : 'fresh'}">${i.isStale ? 'STALE' : 'FRESH'}</span>
              </div>
              <div class="ioc-meta">
                <span>Age: ${i.ageDays} days</span>
                <span>Feeds: ${i.feedCount}</span>
                <span>Confidence: ${(i.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderThreatRadar(): ReturnType<typeof html> {
    return html`
      <div class="threat-radar-section">
        <div class="section-header">
          <h4>Threat Landscape Radar</h4>
        </div>
        <div class="radar-grid">
          ${this._threatLandscapeRadar.map(r => html`
            <div class="radar-card threat-${r.threatLevel >= 8 ? 'critical' : r.threatLevel >= 6 ? 'high' : 'medium'}">
              <div class="radar-header">
                <span class="radar-category">${r.category}</span>
                <span class="radar-level">${r.threatLevel}/10</span>
                <span class="radar-trend ${r.trend}">${r.trend === 'increasing' ? '\u2191' : r.trend === 'stable' ? '\u2192' : '\u2193'}</span>
              </div>
              <div class="radar-details">
                <span>Top Actor: ${r.topActor}</span>
                <span>Recent Incidents: ${r.recentIncidents}</span>
              </div>
              <div class="radar-indicators">
                ${r.keyIndicators.map(ind => html`<span class="indicator-tag">${ind}</span>`)}
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderThreatBriefs(): ReturnType<typeof html> {
    return html`
      <div class="threat-briefs-section">
        <div class="section-header">
          <h4>Automated Threat Briefs</h4>
        </div>
        <div class="briefs-list">
          ${this._threatBriefs.map(b => html`
            <div class="brief-card">
              <div class="brief-header">
                <span class="brief-title">${b.title}</span>
                <span class="brief-scope">${b.scope}</span>
                <span class="brief-time">${b.generatedAt}</span>
              </div>
              <p class="brief-summary">${b.summary}</p>
              <div class="brief-findings">
                <h5>Key Findings</h5>
                <ul>${b.keyFindings.map(f => html`<li>${f}</li>`)}</ul>
              </div>
              <div class="brief-iocs">
                <h5>IOC Highlights</h5>
                ${b.iocHighlights.map(i => html`<span class="ioc-tag">${i}</span>`)}
              </div>
              <div class="brief-actions">
                <h5>Recommended Actions</h5>
                <ul>${b.recommendedActions.map(a => html`<li>${a}</li>`)}</ul>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  // === Network Segmentation Validator Block ===
  @state() private _purpleTeamZones: Array<{id:string;name:string;trustLevel:number;subnet:string;devices:number;policy:string;lastAudit:string}> = [
    {id:"Z01",name:"DMZ",trustLevel:1,subnet:"10.0.1.0/24",devices:23,policy:"Deny All Inbound",lastAudit:"2026-04-20"},
    {id:"Z02",name:"Corporate LAN",trustLevel:3,subnet:"10.0.2.0/22",devices:456,policy:"Allow Internal",lastAudit:"2026-04-18"},
    {id:"Z03",name:"Data Center Core",trustLevel:5,subnet:"10.0.10.0/24",devices:89,policy:"Restricted Access",lastAudit:"2026-04-22"},
    {id:"Z04",name:"IoT Network",trustLevel:1,subnet:"10.0.20.0/24",devices:312,policy:"Deny All Internet",lastAudit:"2026-04-15"},
    {id:"Z05",name:"Development",trustLevel:2,subnet:"10.0.30.0/24",devices:67,policy:"Sandbox Rules",lastAudit:"2026-04-19"},
    {id:"Z06",name:"Management Plane",trustLevel:5,subnet:"10.0.99.0/24",devices:12,policy:"MFA Required",lastAudit:"2026-04-21"},
  ];
  @state() private _purpleTeamSegRules: Array<{id:string;source:string;dest:string;action:string;protocol:string;port:string;status:string;hits:number}> = [
    {id:"SR01",source:"DMZ",dest:"Corporate LAN",action:"DENY",protocol:"TCP",port:"*",status:"Active",hits:14523},
    {id:"SR02",source:"Corporate LAN",dest:"Data Center Core",action:"ALLOW",protocol:"TCP",port:"443,8443",status:"Active",hits:89234},
    {id:"SR03",source:"IoT Network",dest:"Internet",action:"DENY",protocol:"*",port:"*",status:"Active",hits:234567},
    {id:"SR04",source:"Development",dest:"Corporate LAN",action:"DENY",protocol:"*",port:"*",status:"Active",hits:789},
    {id:"SR05",source:"Corporate LAN",dest:"Management Plane",action:"ALLOW",protocol:"TCP",port:"22,443",status:"Active",hits:3456},
  ];
  @state() private _purpleTeamCrossZoneTraffic: Array<{source:string;dest:string;bytes:number;sessions:number;violations:number}> = [
    {source:"DMZ",dest:"Corporate LAN",bytes:4567890,sessions:234,violations:12},
    {source:"Corporate LAN",dest:"Data Center Core",bytes:123456789,sessions:5678,violations:3},
    {source:"IoT Network",dest:"Corporate LAN",bytes:890123,sessions:89,violations:45},
    {source:"Development",dest:"Internet",bytes:67890123,sessions:3456,violations:0},
  ];
  @state() private _purpleTeamMicroSegGaps: Array<{id:string;zone:string;gapType:string;severity:string;recommendation:string}> = [
    {id:"MSG01",zone:"IoT Network",gapType:"Missing East-West Controls",severity:"High",recommendation:"Implement micro-segmentation with service mesh"},
    {id:"MSG02",zone:"Corporate LAN",gapType:"Flat Network Subnet",severity:"Critical",recommendation:"Split into VLANs by department"},
    {id:"MSG03",zone:"Development",gapType:"No Egress Filtering",severity:"Medium",recommendation:"Deploy proxy-based egress controls"},
  ];
  private _renderPurpleteamNetworkSeg(): TemplateResult {
    const zones = this._purpleTeamZones;
    const gaps = this._purpleTeamMicroSegGaps;
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

  // === Security Training Platform Block ===
  @state() private _purpleTeamCourses: Array<{id:string;title:string;category:string;duration:number;enrolled:number;completed:number;difficulty:string;rating:number}> = [
    {id:"C001",title:"Secure Coding Fundamentals",category:"Development",duration:4,enrolled:156,completed:134,difficulty:"Beginner",rating:4.7},
    {id:"C002",title:"OWASP Top 10 Deep Dive",category:"Application Security",duration:6,enrolled:203,completed:178,difficulty:"Intermediate",rating:4.8},
    {id:"C003",title:"Cloud Security Architecture",category:"Cloud",duration:8,enrolled:89,completed:67,difficulty:"Advanced",rating:4.5},
    {id:"C004",title:"Incident Response Procedures",category:"Operations",duration:3,enrolled:245,completed:221,difficulty:"Beginner",rating:4.6},
    {id:"C005",title:"Network Forensics Mastery",category:"Forensics",duration:10,enrolled:67,completed:48,difficulty:"Advanced",rating:4.9},
    {id:"C006",title:"Zero Trust Implementation",category:"Architecture",duration:5,enrolled:112,completed:98,difficulty:"Intermediate",rating:4.4},
    {id:"C007",title:"Phishing Awareness Advanced",category:"Awareness",duration:2,enrolled:312,completed:289,difficulty:"Beginner",rating:4.3},
    {id:"C008",title:"Container Security Best Practices",category:"DevSecOps",duration:6,enrolled:78,completed:61,difficulty:"Intermediate",rating:4.7},
    {id:"C009",title:"GDPR Data Protection",category:"Compliance",duration:4,enrolled:187,completed:163,difficulty:"Intermediate",rating:4.2},
    {id:"C010",title:"Red Team Methodology",category:"Offensive",duration:12,enrolled:45,completed:32,difficulty:"Expert",rating:4.8},
    {id:"C011",title:"Threat Modeling with STRIDE",category:"Architecture",duration:5,enrolled:98,completed:85,difficulty:"Intermediate",rating:4.6},
    {id:"C012",title:"SIEM Operations and Tuning",category:"Operations",duration:7,enrolled:134,completed:112,difficulty:"Advanced",rating:4.5},
  ];
  @state() private _purpleTeamLearningPaths: Array<{id:string;name:string;courseIds:string[];progress:number;enrolled:number}> = [
    {id:"LP01",name:"Security Analyst Fundamentals",courseIds:["C001","C004","C007"],progress:72,enrolled:156},
    {id:"LP02",name:"DevSecOps Engineer",courseIds:["C001","C002","C008","C012"],progress:45,enrolled:78},
    {id:"LP03",name:"Cloud Security Specialist",courseIds:["C003","C006","C009"],progress:58,enrolled:89},
    {id:"LP04",name:"Advanced Penetration Tester",courseIds:["C010","C002","C005"],progress:33,enrolled:45},
  ];
  @state() private _purpleTeamDeptCompliance: Array<{dept:string;trainedPct:number;targetPct:number;avgScore:number;certCount:number}> = [
    {dept:"Engineering",trainedPct:88,targetPct:95,avgScore:82,certCount:34},
    {dept:"Operations",trainedPct:92,targetPct:95,avgScore:87,certCount:28},
    {dept:"Finance",trainedPct:78,targetPct:90,avgScore:74,certCount:12},
    {dept:"HR",trainedPct:85,targetPct:90,avgScore:79,certCount:8},
    {dept:"Legal",trainedPct:71,targetPct:85,avgScore:71,certCount:6},
  ];
  @state() private _purpleTeamSkillsGaps: Array<{skill:string;current:number;required:number;gap:number;priority:string}> = [
    {skill:"Cloud Security",current:62,required:85,gap:23,priority:"High"},
    {skill:"Threat Hunting",current:55,required:80,gap:25,priority:"High"},
    {skill:"Incident Response",current:70,required:85,gap:15,priority:"Medium"},
    {skill:"Secure Coding",current:75,required:90,gap:15,priority:"Medium"},
    {skill:"Forensics",current:45,required:75,gap:30,priority:"Critical"},
  ];
  private _renderPurpleteamTraining(): TemplateResult {
    const courses = this._purpleTeamCourses;
    const deptComp = this._purpleTeamDeptCompliance;
    return html`
      <div class="training-section" style="margin-top:16px;padding:16px;border:1px solid #334155;border-radius:8px;background:#0f172a;">
        <h4 style="color:#f1f5f9;margin:0 0 12px 0;font-size:14px;">Security Training Platform</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="background:#1e293b;border-radius:6px;padding:12px;">
            <h5 style="color:#94a3b8;margin:0 0 8px 0;font-size:12px;">Active Courses (12)</h5>
            ${courses.slice(0, 5).map(c => html`
              <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #334155;font-size:11px;">
                <span style="color:#e2e8f0;">${c.title}</span>
                <span style="color:${c.difficulty === "Advanced" || c.difficulty === "Expert" ? "#f87171" : "#4ade80"};">${c.difficulty}</span>
              </div>
              <div style="display:flex;gap:12px;padding:2px 0;font-size:10px;color:#94a3b8;">
                <span>${c.enrolled} enrolled</span>
                <span>${c.completed} completed</span>
                <span>\u2605 ${c.rating}</span>
              </div>
            `)}
          </div>
          <div style="background:#1e293b;border-radius:6px;padding:12px;">
            <h5 style="color:#94a3b8;margin:0 0 8px 0;font-size:12px;">Department Compliance</h5>
            ${deptComp.map(d => html`
              <div style="padding:4px 0;border-bottom:1px solid #334155;">
                <div style="display:flex;justify-content:space-between;font-size:11px;">
                  <span style="color:#e2e8f0;">${d.dept}</span>
                  <span style="color:${d.trainedPct >= d.targetPct ? "#4ade80" : "#fbbf24"};">${d.trainedPct}%</span>
                </div>
                <div style="height:4px;background:#334155;border-radius:2px;margin-top:3px;">
                  <div style="height:100%;width:${d.trainedPct}%;background:${d.trainedPct >= d.targetPct ? "#22c55e" : "#f59e0b"};border-radius:2px;"></div>
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  // === Security Risk Dashboard Block ===
  @state() private _purpleTeamRiskTopTen: Array<{id:string;name:string;score:number;trend:string;owner:string;category:string;lastAssessed:string}> = [
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
  @state() private _purpleTeamRiskCategories: Array<{category:string;count:number;avgScore:number;color:string}> = [
    {category:"Vulnerability",count:47,avgScore:82,color:"#ef4444"},
    {category:"Configuration",count:32,avgScore:75,color:"#f97316"},
    {category:"Identity",count:28,avgScore:71,color:"#eab308"},
    {category:"Network",count:24,avgScore:68,color:"#22c55e"},
    {category:"Data Loss",count:19,avgScore:65,color:"#3b82f6"},
    {category:"Encryption",count:15,avgScore:62,color:"#8b5cf6"},
  ];
  @state() private _purpleTeamRiskVelocity: Array<{week:string;newRisks:number;closedRisks:number;netChange:number}> = [
    {week:"W15",newRisks:12,closedRisks:8,netChange:4},
    {week:"W16",newRisks:15,closedRisks:11,netChange:4},
    {week:"W17",newRisks:9,closedRisks:14,netChange:-5},
    {week:"W18",newRisks:18,closedRisks:10,netChange:8},
    {week:"W19",newRisks:7,closedRisks:16,netChange:-9},
    {week:"W20",newRisks:11,closedRisks:13,netChange:-2},
    {week:"W21",newRisks:14,closedRisks:9,netChange:5},
  ];
  @state() private _purpleTeamRiskAppetite: {current:number;threshold:number;maxTolerated:number;status:string} = {
    current: 68, threshold: 55, maxTolerated: 80, status: 'Warning'
  };
  @state() private _purpleTeamRiskOwnerMatrix: Array<{owner:string;criticalCount:number;highCount:number;mediumCount:number;complianceRate:number}> = [
    {owner:"IT Ops",criticalCount:5,highCount:12,mediumCount:23,complianceRate:0.72},
    {owner:"Cloud Team",criticalCount:3,highCount:9,mediumCount:18,complianceRate:0.81},
    {owner:"IAM Team",criticalCount:2,highCount:7,mediumCount:14,complianceRate:0.88},
    {owner:"Network",criticalCount:4,highCount:11,mediumCount:20,complianceRate:0.76},
    {owner:"DevOps",criticalCount:3,highCount:8,mediumCount:16,complianceRate:0.83},
    {owner:"Security",criticalCount:1,highCount:5,mediumCount:12,complianceRate:0.91},
  ];
  private _renderPurpleteamRiskDash(): TemplateResult {
    const riskItems = this._purpleTeamRiskTopTen;
    const velocity = this._purpleTeamRiskVelocity;
    const appetite = this._purpleTeamRiskAppetite;
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

  // === Cloud Workload Protection Block ===
  @state() private _purpleTeamContainerScans: Array<{image:string;registry:string;critical:number;high:number;medium:number;scanDate:string;status:string}> = [
    {image:"nginx:1.25",registry:"docker.io",critical:2,high:5,medium:12,scanDate:"2026-04-22",status:"Vulnerable"},
    {image:"postgres:16",registry:"ghcr.io",critical:0,high:1,medium:3,scanDate:"2026-04-22",status:"Clean"},
    {image:"redis:7.2",registry:"docker.io",critical:1,high:3,medium:8,scanDate:"2026-04-21",status:"Vulnerable"},
    {image:"app-server:v2.3",registry:"ecr.aws",critical:0,high:0,medium:2,scanDate:"2026-04-22",status:"Clean"},
    {image:"sidecar-proxy:v1.8",registry:"gcr.io",critical:3,high:7,medium:15,scanDate:"2026-04-20",status:"Critical"},
  ];
  @state() private _purpleTeamK8sPods: Array<{namespace:string;pod:string;securityContext:string;hostIPC:boolean;hostPID:boolean;privileged:boolean;riskLevel:string}> = [
    {namespace:"production",pod:"web-frontend-7d9f8",securityContext:"Restricted",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Low"},
    {namespace:"production",pod:"api-gateway-4b2c1",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
    {namespace:"staging",pod:"db-migrator-x8k3m",securityContext:"Privileged",hostIPC:true,hostPID:false,privileged:true,riskLevel:"Critical"},
    {namespace:"monitoring",pod:"prometheus-q7r2p",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
  ];
  @state() private _purpleTeamServerlessRisk: Array<{function:string;runtime:string;timeout:number;iamPerms:string;externalCalls:number;riskScore:number}> = [
    {function:"processPayment",runtime:"nodejs20.x",timeout:30,iamPerms:"dynamodb:*",externalCalls:3,riskScore:78},
    {function:"sendNotification",runtime:"python3.12",timeout:15,iamPerms:"sns:Publish",externalCalls:1,riskScore:25},
    {function:"imageResizer",runtime:"python3.12",timeout:60,iamPerms:"s3:*",externalCalls:0,riskScore:45},
    {function:"authValidator",runtime:"go1.x",timeout:10,iamPerms:"cognito-idp:*",externalCalls:2,riskScore:62},
  ];
  @state() private _purpleTeamRuntimeAlerts: Array<{id:string;workload:string;alertType:string;severity:string;description:string;timestamp:string}> = [
    {id:"RTA01",workload:"db-migrator-x8k3m",alertType:"Privilege Escalation",severity:"Critical",description:"Container attempted to access /etc/shadow",timestamp:"2026-04-22T10:34:00Z"},
    {id:"RTA02",workload:"web-frontend-7d9f8",alertType:"Anomalous Outbound",severity:"High",description:"Unexpected DNS query to known C2 domain",timestamp:"2026-04-22T09:12:00Z"},
    {id:"RTA03",workload:"sidecar-proxy:v1.8",alertType:"Crypto Mining",severity:"Critical",description:"CPU utilization exceeded 95% for 30 minutes",timestamp:"2026-04-21T23:45:00Z"},
  ];
  private _renderPurpleteamCloudWl(): TemplateResult {
    const containers = this._purpleTeamContainerScans;
    const pods = this._purpleTeamK8sPods;
    const alerts = this._purpleTeamRuntimeAlerts;
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

  render() {    if (this._ptRules.length === 0) { this._initPtRules(); this._initPtCvss(); this._runPtAnomalyDetection(); this._generatePtPredictions(); this._initPtApprovals(); this._initPtActivity(); this._initPtNotifications(); }

    const items = this._getFiltered();
    const crit = items.filter(i => i.severity === 'critical').length;
    const high = items.filter(i => i.severity === 'high').length;
    const open = items.filter(i => i.status === 'open' || i.status === 'in-progress').length;
    const resolved = items.filter(i => i.status === 'resolved').length;
    return html`
      <div class="panel">
        <div class="pt">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          Purple Team
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
          ${this._renderPtRules()}
          <div style="margin-top:12px;font-size:11px;font-weight:600;margin-bottom:6px">Category Treemap</div>
          <div style="background:#1a1d27;border-radius:8px;padding:12px">${this._renderPtTreemapSVG()}</div>
          <div style="margin-top:12px;font-size:11px;font-weight:600;margin-bottom:6px">Data Flow (Sankey)</div>
          <div style="background:#1a1d27;border-radius:8px;padding:12px">${this._renderPtSankeySVG()}</div>
          ${this._renderPtActivity()}
        ` : nothing}
        ${this._activeTab === 'anomalies' ? html`
          ${this._renderPtAnomalies()}
          ${this._renderPtNotifications()}
        ` : nothing}
        ${this._activeTab === 'predictions' ? html`
          ${this._renderPtPredictions()}
          <div style="margin-top:12px;font-size:11px;font-weight:600;margin-bottom:6px">CVSS Scoring</div>
          <div style="background:#1a1d27;border-radius:8px;padding:12px">
            <table class="history-table"><thead><tr><th>ID</th><th>Base</th><th>Temporal</th><th>Environmental</th><th>Overall</th></tr></thead><tbody>
              ${this._ptcvssData.map(c => html`<tr><td>${c.itemId}</td><td style="color:${c.base >= 7 ? '#ef4444' : c.base >= 4 ? '#eab308' : '#22c55e'}">${c.base}</td><td>${c.temporal}</td><td>${c.environmental}</td><td style="font-weight:700;color:${c.overall >= 7 ? '#ef4444' : c.overall >= 4 ? '#eab308' : '#22c55e'}">${c.overall}</td></tr>`)}
            </tbody></table>
          </div>
        ` : nothing}
        ${this._activeTab === 'approvals' ? html`
          ${this._renderPtApprovals()}
        ` : nothing}
        ${this._activeTab === 'config' ? html`
          ${this._renderPtConfig()}
        ` : nothing}
        ${this._activeTab === 'new' ? html`
          <div class="form-section">
            <div class="form-title">Create New Purple Team Entry</div>
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
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Purple Team Findings Grid</span>
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
  @state() private _ptScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _ptScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _ptScenarioCompare: boolean = false;
  @state() private _ptScenarioSelected: string[] = [];

  private _ptInitScenarios(): void {
    const saved = localStorage.getItem('pt_scenarios');
    if (saved) { try { this._ptScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._ptScenarios.length === 0) {
      this._ptScenarios = [
        {id:'pt-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'pt-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'pt-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _ptSaveScenarios(): void {
    localStorage.setItem('pt_scenarios', JSON.stringify(this._ptScenarios));
  }

  private _ptAddScenario(): void {
    const f = this._ptScenarioForm;
    if (!f.attackType || !f.target) return;
    this._ptScenarios = [...this._ptScenarios, {
      id: 'pt-s' + (this._ptScenarios.length + 1),
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
    this._ptScenarioForm = {attackType:'',target:'',method:''};
    this._ptSaveScenarios();
  }

  private _ptRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._ptScenarioCompare = !this._ptScenarioCompare; }}>${this._ptScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._ptScenarioForm = {...this._ptScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._ptScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._ptScenarioForm = {...this._ptScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._ptScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._ptScenarioForm = {...this._ptScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._ptScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._ptAddScenario}>Run Simulation</button>
      </div>
      ${this._ptScenarioCompare && this._ptScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._ptScenarios.length)},1fr);gap:8px">
            ${this._ptScenarios.slice(0,3).map(s => html`
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
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._ptScenarios.length})</div>
        ${this._ptScenarios.map(s => html`
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
  @state() private _ptTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _ptTrendZoom: {start:number;end:number} | null = null;
  @state() private _ptTrendMA: number = 7;

  private _ptInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._ptTrendData = data;
  }

  private _ptCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._ptTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._ptTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _ptGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._ptTrendData.map(d => d.value);
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

  private _ptRenderTimeSeries(): any {
    const stats = this._ptGetStats();
    const filtered = this._ptTrendZoom ? this._ptTrendData.filter(d => d.day >= this._ptTrendZoom.start && d.day <= this._ptTrendZoom.end) : this._ptTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._ptTrendMA === 7 ? 'active' : ''}" @click=${() => { this._ptTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._ptTrendMA === 30 ? 'active' : ''}" @click=${() => { this._ptTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._ptTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._ptTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
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
  @state() private _ptRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _ptActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _ptPermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _ptPermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _ptPermCompare: string[] = [];

  private _ptInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._ptRoles) {
      perms[role] = {};
      this._ptActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._ptPermissions = perms;
  }

  private _ptTogglePermission(role: string, action: string): void {
    const old = this._ptPermissions[role][action];
    this._ptPermissions = {...this._ptPermissions, [role]: {...this._ptPermissions[role], [action]: !old}};
    this._ptPermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _ptRenderRBAC(): any {
    const compareRoles = this._ptPermCompare.map(r => this._ptPermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._ptRoles.map(r => html`
              <button class="tab ${this._ptPermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._ptPermCompare = this._ptPermCompare.includes(r) ? this._ptPermCompare.filter(x => x !== r) : [...this._ptPermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._ptActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._ptRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._ptActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._ptPermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._ptTogglePermission(role, action)}>${this._ptPermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._ptPermCompare.join(' vs ')}</div>
            ${this._ptActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._ptPermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._ptPermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._ptPermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _ptReportTemplate: string = 'executive';
  @state() private _ptReportSchedule: string = 'weekly';
  @state() private _ptReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _ptReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _ptGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._ptReportHistory.unshift({id,template:this._ptReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _ptRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._ptReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._ptReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._ptReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._ptReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._ptReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._ptReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._ptGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._ptReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._ptReportHistory.slice(0,3).map(r => html`
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
  @state() private _ptHighContrast: boolean = false;
  @state() private _ptA11yAnnounce: string = '';
  @state() private _ptShortcutsVisible: boolean = false;
  @state() private _ptFocusTrap: boolean = false;

  private _ptShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _ptHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._ptFocusTrap) { this._ptFocusTrap = false; this._ptAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._ptHighContrast = !this._ptHighContrast; this._ptAnnounce('High contrast ' + (this._ptHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._ptShortcutsVisible = !this._ptShortcutsVisible; }
  }

  private _ptAnnounce(msg: string): void {
    this._ptA11yAnnounce = msg;
    setTimeout(() => { this._ptA11yAnnounce = ''; }, 2000);
  }

  private _ptRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._ptShortcutsVisible ? 'active' : ''}" @click=${() => { this._ptShortcutsVisible = !this._ptShortcutsVisible; }} aria-expanded=${this._ptShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._ptHighContrast} @change=${() => { this._ptHighContrast = !this._ptHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._ptShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._ptShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._ptA11yAnnounce}</div>
      </div>
    `;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.ptInitRound17();
    this._initThreatModel();
    this._initPipeline();
    this._initPlaybooks();
    this._initMetrics();
    this._initIntegration();
    this._ptInitScenarios();
    this._ptInitTrendData();
    this._ptInitPermissions();
    document.addEventListener('keydown', this._ptHandleKeydown.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._ptHandleKeydown.bind(this));
  }

  // === TAB INTEGRATION FOR EXTENDED FEATURES ===
  @state() private _ptActiveSubTab: string = 'scenario';



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

  private _ptGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _ptRenderSubPanel(): any {
    switch (this._ptActiveSubTab) {
      case 'scenario': return this._ptRenderScenarioEngine();
      case 'timeseries': return this._ptRenderTimeSeries();
      case 'rbac': return this._ptRenderRBAC();
      case 'reporting': return this._ptRenderReporting();
      case 'a11y': return this._ptRenderAccessibility();
      default: return nothing;
    }
  }

  private _ptRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._ptGetAllSubTabs().map(t => html`
          <button class="tab ${this._ptActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._ptActiveSubTab = t.key; }} role="tab" aria-selected=${this._ptActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="pt-tab-${this._ptActiveSubTab}">
        ${this._ptRenderSubPanel()}
      </div>
    `;
  }

  
  // Register new subtabs for extended sections
  private _ptGetNewSubTabs(): {key:string;label:string}[] {
    return [
      { key: 'analytics', label: 'Analytics' },
      { key: 'incident-coord', label: 'IR Coordination' },
      { key: 'metrics-corr', label: 'Metrics Correlation' },
      { key: 'api-gateway', label: 'API Gateway' },
      { key: 'perf-opt', label: 'Performance' },
    ];
  }

  // ========== Section A: Advanced Analytics Engine ==========
  @state() private _ptBayesianPrior: number = 0.5;
  @state() private _ptBayesianLikelihood: number = 0.7;
  @state() private _ptMonteCarloResults: number[] = [];
  @state() private _ptCorrelationMatrix: number[][] = [];
  @state() private _ptOutlierIndices: number[] = [];
  @state() private _ptTrendComponents: {trend:number;seasonal:number;residual:number}[] = [];
  @state() private _ptAnalyticsView: string = 'bayesian';
  @state() private _ptConfidenceLevel: number = 95;
  @state() private _ptMonteCarloIterations: number = 100;

  private _ptCalculateBayesianPosterior(): number {
    const prior = this._ptBayesianPrior;
    const likelihood = this._ptBayesianLikelihood;
    const falsePositiveRate = 1 - likelihood;
    const marginal = prior * likelihood + (1 - prior) * falsePositiveRate;
    return marginal > 0 ? (prior * likelihood) / marginal : 0;
  }

  private _ptRunMonteCarloSimulation(): number[] {
    const results: number[] = [];
    const baseRisk = 0.35;
    const volatility = 0.15;
    for (let i = 0; i < this._ptMonteCarloIterations; i++) {
      let cumulative = baseRisk;
      for (let j = 0; j < 12; j++) {
        const shock = (Math.random() - 0.5) * 2 * volatility;
        cumulative = Math.max(0, Math.min(1, cumulative + shock * 0.1));
      }
      results.push(cumulative);
    }
    this._ptMonteCarloResults = results;
    return results;
  }

  private _ptComputeCorrelationMatrix(): number[][] {
    const events = this._ptGenerateMockTimeSeries(6, 50);
    const n = events.length;
    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        row.push(this._ptPearsonCorrelation(events[i], events[j]));
      }
      matrix.push(row);
    }
    this._ptCorrelationMatrix = matrix;
    return matrix;
  }

  private _ptPearsonCorrelation(x: number[], y: number[]): number {
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

  private _ptDetectOutliersZScore(data: number[]): number[] {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length);
    const threshold = 2.0;
    return data.map((v, i) => Math.abs((v - mean) / (std || 1)) > threshold ? i : -1).filter(i => i >= 0);
  }

  private _ptDetectOutliersIQR(data: number[]): number[] {
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    return data.map((v, i) => v < lower || v > upper ? i : -1).filter(i => i >= 0);
  }

  private _ptDecomposeTrend(data: number[]): {trend:number;seasonal:number;residual:number}[] {
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
    this._ptTrendComponents = result;
    return result;
  }

  private _ptPredictiveScoreWithCI(data: number[]): {score:number;low:number;high:number} {
    const recent = data.slice(-10);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const std = Math.sqrt(recent.reduce((a, b) => a + (b - avg) ** 2, 0) / recent.length);
    const zScore = this._ptConfidenceLevel === 99 ? 2.576 : this._ptConfidenceLevel === 90 ? 1.645 : 1.96;
    return { score: avg, low: avg - zScore * std, high: avg + zScore * std };
  }

  private _ptGenerateMockTimeSeries(count: number, length: number): number[][] {
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

  private _ptRenderAnalyticsEngine(): any {
    const posterior = this._ptCalculateBayesianPosterior();
    const mcResults = this._ptMonteCarloResults.length > 0 ? this._ptMonteCarloResults : this._ptRunMonteCarloSimulation();
    const mcAvg = mcResults.reduce((a, b) => a + b, 0) / mcResults.length;
    const mcP95 = [...mcResults].sort((a, b) => a - b)[Math.floor(mcResults.length * 0.95)];
    const matrix = this._ptCorrelationMatrix.length > 0 ? this._ptCorrelationMatrix : this._ptComputeCorrelationMatrix();
    const labels = ['Vulns', 'Incidents', 'Phishing', 'Access', 'Compliance', 'Training'];
    return html`
      <div class="analytics-engine" style="padding:12px">
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <button class="tab ${this._ptAnalyticsView === 'bayesian' ? 'active' : ''}" @click=${() => { this._ptAnalyticsView = 'bayesian'; }}>Bayesian</button>
          <button class="tab ${this._ptAnalyticsView === 'montecarlo' ? 'active' : ''}" @click=${() => { this._ptAnalyticsView = 'montecarlo'; }}>Monte Carlo</button>
          <button class="tab ${this._ptAnalyticsView === 'correlation' ? 'active' : ''}" @click=${() => { this._ptAnalyticsView = 'correlation'; }}>Correlation</button>
          <button class="tab ${this._ptAnalyticsView === 'outliers' ? 'active' : ''}" @click=${() => { this._ptAnalyticsView = 'outliers'; }}>Outliers</button>
          <button class="tab ${this._ptAnalyticsView === 'trend' ? 'active' : ''}" @click=${() => { this._ptAnalyticsView = 'trend'; }}>Trend</button>
          <button class="tab ${this._ptAnalyticsView === 'predictive' ? 'active' : ''}" @click=${() => { this._ptAnalyticsView = 'predictive'; }}>Predictive</button>
        </div>
        ${this._ptAnalyticsView === 'bayesian' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Bayesian Risk Probability</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div><span style="color:#888">Prior:</span> ${this._ptBayesianPrior.toFixed(2)}</div>
              <div><span style="color:#888">Likelihood:</span> ${this._ptBayesianLikelihood.toFixed(2)}</div>
              <div><span style="color:#888">Posterior:</span> <strong style="color:${posterior > 0.6 ? '#f44' : '#4f4'}">${posterior.toFixed(4)}</strong></div>
              <div><span style="color:#888">Risk Level:</span> ${posterior > 0.7 ? 'Critical' : posterior > 0.5 ? 'High' : posterior > 0.3 ? 'Medium' : 'Low'}</div>
            </div>
            <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
              <label style="color:#888;font-size:12px">Prior:</label>
              <input type="range" min="0" max="100" .value=${String(this._ptBayesianPrior * 100)} @input=${(e: any) => { this._ptBayesianPrior = Number(e.target.value) / 100; }} style="flex:1" />
              <label style="color:#888;font-size:12px">Likelihood:</label>
              <input type="range" min="0" max="100" .value=${String(this._ptBayesianLikelihood * 100)} @input=${(e: any) => { this._ptBayesianLikelihood = Number(e.target.value) / 100; }} style="flex:1" />
            </div>
          </div>
        ` : nothing}
        ${this._ptAnalyticsView === 'montecarlo' ? html`
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
            <button class="btn" style="margin-top:8px" @click=${() => { this._ptRunMonteCarloSimulation(); }}>Re-run Simulation</button>
          </div>
        ` : nothing}
        ${this._ptAnalyticsView === 'correlation' ? html`
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
        ${this._ptAnalyticsView === 'outliers' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Statistical Outlier Detection</h4>
            ${['zscore', 'iqr'].map(method => {
              const data = this._ptGenerateMockTimeSeries(1, 30)[0];
              const outliers = method === 'zscore' ? this._ptDetectOutliersZScore(data) : this._ptDetectOutliersIQR(data);
              return html`<div style="margin-bottom:8px">
                <div style="color:#aaa;font-size:12px">${method === 'zscore' ? 'Z-Score Method' : 'IQR Method'}: ${outliers.length} outliers detected</div>
                <div style="display:flex;gap:1px;height:30px;align-items:flex-end">${data.map((v, i) => html`<div style="flex:1;background:${outliers.includes(i) ? '#f44' : '#3a3d4a'};height:${v}%;min-height:1px"></div>`)}</div>
              </div>`;
            })}
          </div>
        ` : nothing}
        ${this._ptAnalyticsView === 'trend' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Trend Decomposition</h4>
            ${['Trend', 'Seasonal', 'Residual'].map((comp, ci) => html`
              <div style="margin-bottom:8px">
                <div style="color:#aaa;font-size:12px">${comp}</div>
                <div style="display:flex;gap:1px;height:25px;align-items:center">${this._ptDecomposeTrend(this._ptGenerateMockTimeSeries(1, 24)[0]).map(p => {
                  const val = [p.trend, p.seasonal * 500, p.residual][ci];
                  return html`<div style="flex:1;background:${ci === 0 ? '#4a9' : ci === 1 ? '#a4a' : '#aa4'};height:${Math.abs(val) * 50}%;min-height:1px"></div>`;
                })}</div>
              </div>
            `)}
          </div>
        ` : nothing}
        ${this._ptAnalyticsView === 'predictive' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Predictive Scoring with Confidence Intervals</h4>
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
              <label style="color:#888;font-size:12px">Confidence:</label>
              <select .value=${String(this._ptConfidenceLevel)} @change=${(e: any) => { this._ptConfidenceLevel = Number(e.target.value); }}>
                <option value="90">90%</option><option value="95">95%</option><option value="99">99%</option>
              </select>
            </div>
            ${['Risk Score', 'Compliance', 'Threat Index'].map(label => {
              const data = this._ptGenerateMockTimeSeries(1, 20)[0];
              const pred = this._ptPredictiveScoreWithCI(data);
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
  @state() private _ptWarRoomActive: boolean = false;
  @state() private _ptWarRoomParticipants: string[] = ['SOC Lead', 'IR Manager', 'CISO', 'Legal', 'PR'];
  @state() private _ptIncidentSeverity: string = 'P3';
  @state() private _ptEscalationLevel: number = 0;
  @state() private _ptCommTemplate: string = 'initial';
  @state() private _ptLessonsLearned: string = '';
  @state() private _ptPostIncidentAnswers: Record<string, string> = {};
  @state() private _ptWarRoomMessages: {sender:string;time:string;text:string}[] = [];

  private _ptGetSeverityMatrix(): {severity:string;responseTime:string;escalation:string;notify:string}[] {
    return [
      { severity: 'P1 - Critical', responseTime: '15 min', escalation: 'CISO + CEO + Legal', notify: 'All stakeholders immediately' },
      { severity: 'P2 - High', responseTime: '30 min', escalation: 'CISO + IR Manager', notify: 'Security team + affected dept heads' },
      { severity: 'P3 - Medium', responseTime: '2 hours', escalation: 'IR Manager', notify: 'Security team' },
      { severity: 'P4 - Low', responseTime: '24 hours', escalation: 'SOC Lead', notify: 'Ticket created' },
    ];
  }

  private _ptGetCommunicationTemplates(): {key:string;subject:string;body:string}[] {
    return [
      { key: 'initial', subject: 'Security Incident Notification', body: 'We are investigating a potential security incident. The security team has been activated and is assessing the scope. We will provide updates every 30 minutes. Please do not share this information externally.' },
      { key: 'escalation', subject: 'Incident Escalation - Action Required', body: 'The incident has been escalated to P1 severity. Additional resources have been engaged. All non-essential access to affected systems has been suspended pending investigation.' },
      { key: 'contained', subject: 'Incident Containment Update', body: 'The incident has been contained. Affected systems have been isolated. Forensic analysis is ongoing. We will provide a detailed timeline within 24 hours.' },
      { key: 'resolved', subject: 'Incident Resolution Notification', body: 'The incident has been fully resolved. Root cause analysis is complete. Remediation actions have been implemented. A post-incident review has been scheduled.' },
      { key: 'external', subject: 'Security Advisory', body: 'We have identified and resolved a security matter. There is no evidence of customer data impact. We are working with relevant authorities and will provide updates as appropriate.' },
    ];
  }

  private _ptGetStakeholderMatrix(): {role:string;notifyP1:boolean;notifyP2:boolean;notifyP3:boolean;channel:string}[] {
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

  private _ptGetPostIncidentQuestions(): {id:string;question:string;type:string;options:string[]}[] {
    return [
      { id: 'q1', question: 'What was the initial detection method?', type: 'select', options: ['SIEM Alert', 'User Report', 'Threat Intel Feed', 'Automated Scan', 'Third-party Notification'] },
      { id: 'q2', question: 'How long was the dwell time?', type: 'select', options: ['< 1 hour', '1-24 hours', '1-7 days', '7-30 days', '> 30 days'] },
      { id: 'q3', question: 'Was the incident response plan followed?', type: 'select', options: ['Fully', 'Partially', 'Deviated significantly', 'No plan existed'] },
      { id: 'q4', question: 'What was the root cause category?', type: 'select', options: ['Misconfiguration', 'Unpatched Vulnerability', 'Social Engineering', 'Insider Threat', 'Zero-day Exploit', 'Supply Chain'] },
      { id: 'q5', question: 'What improvements are needed?', type: 'text', options: [] },
    ];
  }

  private _ptToggleWarRoom(): void {
    this._ptWarRoomActive = !this._ptWarRoomActive;
    if (this._ptWarRoomActive) {
      this._ptWarRoomMessages = [
        { sender: 'System', time: new Date().toLocaleTimeString(), text: 'War room activated. All participants notified.' },
        { sender: 'SOC Lead', time: new Date().toLocaleTimeString(), text: 'Acknowledged. Investigating initial indicators.' },
      ];
    }
  }

  private _ptSendWarRoomMessage(text: string): void {
    this._ptWarRoomMessages = [...this._ptWarRoomMessages, {
      sender: 'You', time: new Date().toLocaleTimeString(), text
    }];
  }

  private _ptEscalateIncident(): void {
    const levels = ['P4', 'P3', 'P2', 'P1'];
    const idx = levels.indexOf(this._ptIncidentSeverity);
    if (idx < levels.length - 1) {
      this._ptIncidentSeverity = levels[idx + 1];
      this._ptEscalationLevel = idx + 1;
    }
  }

  private _ptRenderIncidentCoordination(): any {
    const templates = this._ptGetCommunicationTemplates();
    const currentTemplate = templates.find(t => t.key === this._ptCommTemplate) || templates[0];
    const questions = this._ptGetPostIncidentQuestions();
    const severityMatrix = this._ptGetSeverityMatrix();
    const stakeholders = this._ptGetStakeholderMatrix();
    return html`
      <div class="incident-coordination" style="padding:12px">
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <button class="tab ${this._ptWarRoomActive ? 'active' : ''}" @click=${() => { this._ptToggleWarRoom(); }}>War Room ${this._ptWarRoomActive ? '(Active)' : ''}</button>
          <button class="tab" @click=${() => { this._ptEscalateIncident(); }}>Escalate (${this._ptIncidentSeverity})</button>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Severity Escalation Matrix</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Severity</th><th style="color:#888">Response Time</th><th style="color:#888">Escalation</th><th style="color:#888">Notification</th></tr></thead>
            <tbody>${severityMatrix.map(r => html`
              <tr style="${r.severity.startsWith(this._ptIncidentSeverity) ? 'background:rgba(255,68,68,0.15)' : ''}">
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
            ${templates.map(t => html`<button class="tab ${this._ptCommTemplate === t.key ? 'active' : ''}" @click=${() => { this._ptCommTemplate = t.key; }}>${t.subject.split(' - ')[0]}</button>`)}
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
                <select style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px" @change=${(e: any) => { this._ptPostIncidentAnswers = {...this._ptPostIncidentAnswers, [q.id]: e.target.value}; }}>
                  <option value="">Select...</option>
                  ${q.options.map(o => html`<option value="${o}" ${this._ptPostIncidentAnswers[q.id] === o ? 'selected' : ''}>${o}</option>`)}
                </select>
              ` : html`
                <textarea style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px;min-height:40px" placeholder="Enter details..." @input=${(e: any) => { this._ptPostIncidentAnswers = {...this._ptPostIncidentAnswers, [q.id]: e.target.value}; }}></textarea>
              `}
            </div>
          `)}
          <div style="margin-top:8px">
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:4px">Lessons Learned</label>
            <textarea style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px;min-height:60px" .value=${this._ptLessonsLearned} @input=${(e: any) => { this._ptLessonsLearned = e.target.value; }}></textarea>
          </div>
        </div>
      </div>
    `;
  }

  // ========== Section C: Security Metrics Correlation ==========
  @state() private _ptMetricData: Record<string, number[]> = {};
  @state() private _ptCompositeScore: number = 72;
  @state() private _ptMetricAlerts: string[] = [];
  @state() private _ptLeadingIndicators: string[] = ['Phishing Click Rate', 'Patch Compliance', 'Training Completion', 'Access Review Age'];
  @state() private _ptLaggingIndicators: string[] = ['Incident Count', 'MTTR', 'Data Breach Cost', 'Compliance Failures'];
  @state() private _ptExecutiveSummary: string = '';

  private _ptInitializeMetricData(): void {
    const metrics = ['Vulnerability Count', 'Incident Rate', 'Patch Coverage', 'Training Score', 'Compliance Pct', 'Access Anomalies'];
    metrics.forEach(m => {
      this._ptMetricData[m] = this._ptGenerateMockTimeSeries(1, 30)[0];
    });
  }

  private _ptCalculateCompositeScore(): number {
    const weights: Record<string, number> = {
      'Vulnerability Count': -0.2, 'Incident Rate': -0.25, 'Patch Coverage': 0.2,
      'Training Score': 0.15, 'Compliance Pct': 0.15, 'Access Anomalies': -0.05
    };
    let score = 75;
    for (const [metric, weight] of Object.entries(weights)) {
      const data = this._ptMetricData[metric];
      if (data && data.length > 0) {
        const recent = data.slice(-7);
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        score += (avg - 50) * weight;
      }
    }
    this._ptCompositeScore = Math.max(0, Math.min(100, score));
    return this._ptCompositeScore;
  }

  private _ptDetectMetricAnomalies(): string[] {
    const alerts: string[] = [];
    for (const [metric, data] of Object.entries(this._ptMetricData)) {
      if (!data || data.length < 10) continue;
      const outliers = this._ptDetectOutliersZScore(data);
      if (outliers.length > 0) {
        alerts.push(metric + ': ' + outliers.length + ' anomalous data points detected in last ' + data.length + ' periods');
      }
      const last = data[data.length - 1];
      const prev = data[data.length - 2];
      if (Math.abs(last - prev) / (Math.abs(prev) || 1) > 0.5) {
        alerts.push(metric + ': ' + (last > prev ? 'Sudden increase' : 'Sudden decrease') + ' of ' + (Math.abs(last - prev) / (Math.abs(prev) || 1) * 100).toFixed(0) + '%');
      }
    }
    this._ptMetricAlerts = alerts;
    return alerts;
  }

  private _ptGenerateExecutiveSummary(): string {
    const score = this._ptCalculateCompositeScore();
    const alerts = this._ptDetectMetricAnomalies();
    const scoreTrend = score > 80 ? 'improving' : score > 60 ? 'stable' : 'declining';
    let summary = 'Security Posture Score: ' + score.toFixed(0) + '/100 (' + scoreTrend + '). ';
    summary += 'Leading indicators show ' + (this._ptLeadingIndicators.length > 2 ? 'generally positive' : 'mixed') + ' trends. ';
    if (alerts.length > 0) {
      summary += 'Active alerts: ' + alerts.length + '. Key concerns: ' + alerts.slice(0, 3).join('; ') + '. ';
    } else {
      summary += 'No critical metric anomalies detected. ';
    }
    summary += 'Recommendation: ' + (score > 80 ? 'Maintain current security posture and continue monitoring.' : score > 60 ? 'Focus on patch management and training completion rates.' : 'Immediate attention required for vulnerability remediation and incident response readiness.');
    this._ptExecutiveSummary = summary;
    return summary;
  }

  private _ptRenderMetricsCorrelation(): any {
    if (Object.keys(this._ptMetricData).length === 0) this._ptInitializeMetricData();
    const score = this._ptCalculateCompositeScore();
    const alerts = this._ptDetectMetricAnomalies();
    const metricNames = Object.keys(this._ptMetricData);
    const corrMatrix = metricNames.map((m1, i) =>
      metricNames.map((m2, j) => this._ptPearsonCorrelation(this._ptMetricData[m1] || [], this._ptMetricData[m2] || []))
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
              ${this._ptLeadingIndicators.map(ind => html`<div style="color:#aaa;font-size:11px;padding:2px 0">- ${ind}</div>`)}
            </div>
            <div>
              <div style="color:#a4a;font-size:12px;font-weight:bold;margin-bottom:4px">Lagging (Reactive)</div>
              ${this._ptLaggingIndicators.map(ind => html`<div style="color:#aaa;font-size:11px;padding:2px 0">- ${ind}</div>`)}
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
          <div style="background:#1a1d27;padding:8px;border-radius:4px;color:#bbb;font-size:12px;line-height:1.6">${this._ptGenerateExecutiveSummary()}</div>
          <button class="btn" style="margin-top:8px;font-size:11px" @click=${() => { this._ptGenerateExecutiveSummary(); }}>Regenerate Summary</button>
        </div>
      </div>
    `;
  }

  // ========== Section D: API Gateway & Rate Limiting ==========
  @state() private _ptApiEndpoints: {id:string;path:string;method:string;status:string;latency:number;rateLimit:number}[] = [];
  @state() private _ptRateLimitPolicy: {endpoint:string;requestsPerMin:number;burstLimit:number;windowSec:number}[] = [];
  @state() private _ptApiKeys: {id:string;name:string;created:string;expires:string;status:string;lastUsed:string}[] = [];
  @state() private _ptWebhookStatuses: {id:string;url:string;events:string;lastDelivery:string;status:string;retryCount:number}[] = [];

  private _ptInitializeApiData(): void {
    this._ptApiEndpoints = [
      { id: 'api-1', path: '/api/v1/security/events', method: 'POST', status: 'active', latency: 45, rateLimit: 100 },
      { id: 'api-2', path: '/api/v1/vulnerabilities', method: 'GET', status: 'active', latency: 120, rateLimit: 200 },
      { id: 'api-3', path: '/api/v1/incidents', method: 'POST', status: 'active', latency: 85, rateLimit: 50 },
      { id: 'api-4', path: '/api/v1/assets', method: 'GET', status: 'active', latency: 200, rateLimit: 150 },
      { id: 'api-5', path: '/api/v1/compliance', method: 'GET', status: 'deprecated', latency: 350, rateLimit: 30 },
    ];
    this._ptRateLimitPolicy = [
      { endpoint: '/api/v1/security/*', requestsPerMin: 100, burstLimit: 150, windowSec: 60 },
      { endpoint: '/api/v1/vulnerabilities/*', requestsPerMin: 200, burstLimit: 300, windowSec: 60 },
      { endpoint: '/api/v1/incidents/*', requestsPerMin: 50, burstLimit: 75, windowSec: 60 },
      { endpoint: '/api/v1/assets/*', requestsPerMin: 150, burstLimit: 200, windowSec: 60 },
    ];
    this._ptApiKeys = [
      { id: 'key-1', name: 'SOC Integration Key', created: '2025-01-15', expires: '2026-01-15', status: 'active', lastUsed: '2 min ago' },
      { id: 'key-2', name: 'SIEM Connector', created: '2025-03-20', expires: '2026-03-20', status: 'active', lastUsed: '5 min ago' },
      { id: 'key-3', name: 'Legacy Scanner', created: '2024-06-01', expires: '2025-06-01', status: 'expired', lastUsed: '30 days ago' },
    ];
    this._ptWebhookStatuses = [
      { id: 'wh-1', url: 'https://hooks.slack.com/services/T00/B00/xxx', events: 'incident.created', lastDelivery: '1 min ago', status: 'success', retryCount: 0 },
      { id: 'wh-2', url: 'https://api.pagerduty.com/integration/xxx', events: 'incident.escalated', lastDelivery: '5 min ago', status: 'success', retryCount: 0 },
      { id: 'wh-3', url: 'https://webhooks.jira.com/xxx', events: 'vulnerability.critical', lastDelivery: 'Failed', status: 'failed', retryCount: 3 },
    ];
  }

  private _ptUpdateRateLimit(endpoint: string, field: string, value: number): void {
    this._ptRateLimitPolicy = this._ptRateLimitPolicy.map(p =>
      p.endpoint === endpoint ? { ...p, [field]: value } : p
    );
  }

  private _ptRenderApiGateway(): any {
    if (this._ptApiEndpoints.length === 0) this._ptInitializeApiData();
    const totalRpm = this._ptApiEndpoints.reduce((a, e) => a + (Math.random() * e.rateLimit * 0.5), 0);
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
              <div style="color:#e0e0e0;font-size:20px;font-weight:bold">${this._ptApiEndpoints.length}</div>
              <div style="color:#888;font-size:10px">Active Endpoints</div>
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">API Endpoints</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Endpoint</th><th style="color:#888">Method</th><th style="color:#888">Latency</th><th style="color:#888">Rate Limit</th><th style="color:#888">Status</th></tr></thead>
            <tbody>${this._ptApiEndpoints.map(e => html`
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
          ${this._ptRateLimitPolicy.map(p => html`
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;padding:4px;background:#1a1d27;border-radius:4px">
              <span style="color:#ddd;font-size:10px;font-family:monospace;min-width:160px">${p.endpoint}</span>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="color:#888;font-size:10px">RPM:</span>
                <input type="number" style="background:#0d0f17;color:#ddd;border:1px solid #333;padding:2px 4px;border-radius:3px;width:60px;font-size:11px" .value=${String(p.requestsPerMin)} @change=${(e: any) => { this._ptUpdateRateLimit(p.endpoint, 'requestsPerMin', Number(e.target.value)); }} />
              </div>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="color:#888;font-size:10px">Burst:</span>
                <input type="number" style="background:#0d0f17;color:#ddd;border:1px solid #333;padding:2px 4px;border-radius:3px;width:60px;font-size:11px" .value=${String(p.burstLimit)} @change=${(e: any) => { this._ptUpdateRateLimit(p.endpoint, 'burstLimit', Number(e.target.value)); }} />
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
            <tbody>${this._ptApiKeys.map(k => html`
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
          ${this._ptWebhookStatuses.map(w => html`
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
  @state() private _ptRenderTime: number = 0;
  @state() private _ptMemoryEstimate: number = 0;
  @state() private _ptCacheHits: number = 0;
  @state() private _ptCacheMisses: number = 0;
  @state() private _ptLazyLoadingEnabled: boolean = true;
  @state() private _ptVirtualScrollEnabled: boolean = false;
  @state() private _ptPerfHistory: {timestamp:number;renderMs:number;memoryKb:number;cacheRatio:number}[] = [];
  @state() private _ptDataSetSize: number = 1000;

  private _ptMeasurePerformance(): void {
    const start = performance.now();
    const data = Array.from({ length: this._ptDataSetSize }, (_, i) => ({
      id: i, value: Math.random() * 100, category: ['A', 'B', 'C'][i % 3],
      timestamp: Date.now() - i * 60000
    }));
    const filtered = data.filter(d => d.value > 30).map(d => d.value).sort((a, b) => b - a);
    const end = performance.now();
    this._ptRenderTime = Math.round((end - start) * 100) / 100;
    this._ptMemoryEstimate = Math.round((this._ptDataSetSize * 0.15) * 100) / 100;
    this._ptCacheHits = Math.floor(Math.random() * 80 + 60);
    this._ptCacheMisses = Math.floor(Math.random() * 30 + 10);
    this._ptPerfHistory.push({
      timestamp: Date.now(), renderMs: this._ptRenderTime,
      memoryKb: this._ptMemoryEstimate,
      cacheRatio: this._ptCacheHits / (this._ptCacheHits + this._ptCacheMisses)
    });
    if (this._ptPerfHistory.length > 20) this._ptPerfHistory = this._ptPerfHistory.slice(-20);
  }

  private _ptGetCacheRatio(): number {
    const total = this._ptCacheHits + this._ptCacheMisses;
    return total > 0 ? this._ptCacheHits / total : 0;
  }

  private _ptGetPerfRecommendation(): string {
    if (this._ptRenderTime > 50) return 'High render time detected. Consider enabling virtual scrolling and reducing data set size.';
    if (this._ptGetCacheRatio() < 0.7) return 'Cache hit ratio is low. Review cache invalidation strategy and increase cache TTL.';
    if (this._ptMemoryEstimate > 500) return 'High memory usage. Enable lazy loading and consider pagination for large datasets.';
    if (this._ptDataSetSize > 500 && !this._ptVirtualScrollEnabled) return 'Large dataset detected. Enable virtual scrolling for optimal performance.';
    return 'Performance is within acceptable parameters. Continue monitoring.';
  }

  private _ptRenderPerformancePanel(): any {
    if (this._ptPerfHistory.length === 0) this._ptMeasurePerformance();
    const cacheRatio = this._ptGetCacheRatio();
    const recommendation = this._ptGetPerfRecommendation();
    const isWarning = recommendation.includes('detected') || recommendation.includes('low') || recommendation.includes('High');
    return html`
      <div class="perf-panel" style="padding:12px">
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Render Performance Metrics</h4>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${this._ptRenderTime > 50 ? '#f44' : '#4f4'};font-size:18px;font-weight:bold">${this._ptRenderTime}ms</div>
              <div style="color:#888;font-size:10px">Render Time</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${this._ptMemoryEstimate > 500 ? '#fa0' : '#4a9'};font-size:18px;font-weight:bold">${this._ptMemoryEstimate}KB</div>
              <div style="color:#888;font-size:10px">Memory Est.</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${cacheRatio > 0.8 ? '#4f4' : '#fa0'};font-size:18px;font-weight:bold">${(cacheRatio * 100).toFixed(0)}%</div>
              <div style="color:#888;font-size:10px">Cache Hit Ratio</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:#e0e0e0;font-size:18px;font-weight:bold">${this._ptDataSetSize}</div>
              <div style="color:#888;font-size:10px">Dataset Size</div>
            </div>
          </div>
          <div style="margin-top:8px">
            <div style="display:flex;gap:8px;align-items:center">
              <label style="color:#888;font-size:12px">Dataset size:</label>
              <input type="range" min="100" max="10000" step="100" .value=${String(this._ptDataSetSize)} @input=${(e: any) => { this._ptDataSetSize = Number(e.target.value); }} style="flex:1" />
              <button class="btn" style="font-size:11px" @click=${() => { this._ptMeasurePerformance(); }}>Benchmark</button>
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Optimization Controls</h4>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;color:#ddd;font-size:12px;cursor:pointer">
              <input type="checkbox" .checked=${this._ptLazyLoadingEnabled} @change=${(e: any) => { this._ptLazyLoadingEnabled = e.target.checked; }} />
              Lazy Loading
            </label>
            <label style="display:flex;align-items:center;gap:6px;color:#ddd;font-size:12px;cursor:pointer">
              <input type="checkbox" .checked=${this._ptVirtualScrollEnabled} @change=${(e: any) => { this._ptVirtualScrollEnabled = e.target.checked; }} />
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
                <span>Hits: ${this._ptCacheHits}</span><span>Misses: ${this._ptCacheMisses}</span>
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
            ${this._ptPerfHistory.slice(-15).map(h => html`
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

  // --- Cyber Risk Quantification ---
  private _renderCyberRiskQuantification(): TemplateResult {
    const aleByCategory = [
      { category: 'Data Breach', ale: 4200000, maxLoss: 12000000, prob: 35, controls: 12, residual: 1800000 },
      { category: 'Ransomware', ale: 3100000, maxLoss: 8500000, prob: 37, controls: 8, residual: 2100000 },
      { category: 'Insider Threat', ale: 1800000, maxLoss: 5000000, prob: 36, controls: 6, residual: 1200000 },
      { category: 'DDoS', ale: 950000, maxLoss: 3000000, prob: 32, controls: 9, residual: 400000 },
      { category: 'Supply Chain', ale: 2400000, maxLoss: 7000000, prob: 34, controls: 5, residual: 1900000 },
      { category: 'Phishing/Social', ale: 1200000, maxLoss: 3500000, prob: 34, controls: 10, residual: 500000 },
      { category: 'Cloud Misconfig', ale: 800000, maxLoss: 2500000, prob: 32, controls: 7, residual: 350000 },
      { category: 'Zero-Day Exploit', ale: 1500000, maxLoss: 10000000, prob: 15, controls: 3, residual: 1200000 },
    ];
    const totalALE = aleByCategory.reduce((s, c) => s + c.ale, 0);
    const totalResidual = aleByCategory.reduce((s, c) => s + c.residual, 0);
    const treatmentOptions = [
      { risk: 'Data Breach', action: 'Implement DLP + Encryption at Rest', cost: 450000, reduction: 1200000, roi: 2.67, priority: 'high' },
      { risk: 'Ransomware', action: 'Deploy EDR + Immutable Backups', cost: 380000, reduction: 1400000, roi: 3.68, priority: 'high' },
      { risk: 'Supply Chain', action: 'Third-Party Risk Platform', cost: 280000, reduction: 800000, roi: 2.86, priority: 'medium' },
      { risk: 'Insider Threat', action: 'UEBA + Data Access Monitoring', cost: 320000, reduction: 900000, roi: 2.81, priority: 'medium' },
      { risk: 'Cloud Misconfig', action: 'CSPM Automation + Policy-as-Code', cost: 150000, reduction: 550000, roi: 3.67, priority: 'high' },
    ];
    const insuranceAssessment = {
      coverage: 15000000, premium: 420000, deductible: 500000,
      gaps: ['State-sponsored attacks excluded', 'Systemic risk sublimit: $5M', '30-day waiting period for BI'],
      adequacy: 72, recommendation: 'Increase coverage to $20M, add nation-state rider',
    };
    const riskAggregation = [
      { scenario: 'Simultaneous Breach + Ransomware', probability: 8, loss: 18000000, mitigation: 'Incident response retainer + cyber insurance' },
      { scenario: 'Supply Chain Compromise Cascade', probability: 12, loss: 12000000, mitigation: 'Vendor diversification + monitoring' },
      { scenario: 'Cloud Provider Outage + Data Loss', probability: 5, loss: 8000000, mitigation: 'Multi-cloud strategy + geo-redundancy' },
    ];
    const decisionMatrix = [
      { risk: 'Data Breach', transfer: 60, retain: 40, action: 'Transfer via insurance, retain residual' },
      { risk: 'Ransomware', transfer: 45, retain: 55, action: 'Invest in prevention, limited insurance' },
      { risk: 'DDoS', transfer: 70, retain: 30, action: 'DDoS protection service + insurance' },
      { risk: 'Insider Threat', transfer: 20, retain: 80, action: 'Invest in detection and training' },
      { risk: 'Zero-Day', transfer: 50, retain: 50, action: 'Bug bounty + insurance + threat intel' },
    ];
    const fmt = (n: number) => '$' + (n / 1000000).toFixed(1) + 'M';
    return html`
      <div class="cyber-risk-quant">
        <h4>Cyber Risk Quantification Dashboard</h4>
        <div class="crq-grid">
          <div class="crq-card full-width">
            <h5>Annual Loss Expectancy by Risk Category</h5>
            <div class="ale-chart">
              ${aleByCategory.map(c => html`
                <div class="ale-row">
                  <span class="ale-cat">${c.category}</span>
                  <div class="ale-bar-wrap">
                    <div class="ale-bar inherent" style="width:${(c.ale / 5000000) * 100}%" title="ALE: ${fmt(c.ale)}"></div>
                    <div class="ale-bar residual" style="width:${(c.residual / 5000000) * 100}%" title="Residual: ${fmt(c.residual)}"></div>
                  </div>
                  <span class="ale-val">${fmt(c.ale)}</span>
                  <span class="ale-res">${fmt(c.residual)} residual</span>
                </div>
              `)}
            </div>
            <div class="ale-summary">
              <div class="ale-total">Total ALE: <strong>${fmt(totalALE)}</strong></div>
              <div class="ale-res-total">Total Residual: <strong>${fmt(totalResidual)}</strong></div>
              <div class="ale-reduction">Risk Reduction: <strong>${fmt(totalALE - totalResidual)}</strong> (${Math.round((1 - totalResidual / totalALE) * 100)}%)</div>
            </div>
          </div>
          <div class="crq-card">
            <h5>Risk Treatment Cost-Benefit</h5>
            <div class="treatment-list">
              ${treatmentOptions.map(t => html`
                <div class="treat-item priority-${t.priority}">
                  <div class="treat-header">
                    <span class="treat-risk">${t.risk}</span>
                    <span class="treat-roi">ROI: ${t.roi}x</span>
                  </div>
                  <div class="treat-action">${t.action}</div>
                  <div class="treat-metrics">
                    <span>Cost: ${fmt(t.cost)}</span>
                    <span>Reduction: ${fmt(t.reduction)}</span>
                  </div>
                </div>
              `)}
            </div>
          </div>
          <div class="crq-card">
            <h5>Insurance Adequacy Assessment</h5>
            <div class="insurance-panel">
              <div class="ins-row"><span>Coverage</span><span>${fmt(insuranceAssessment.coverage)}</span></div>
              <div class="ins-row"><span>Annual Premium</span><span>${fmt(insuranceAssessment.premium)}</span></div>
              <div class="ins-row"><span>Deductible</span><span>${fmt(insuranceAssessment.deductible)}</span></div>
              <div class="ins-adequacy">
                <span>Adequacy Score: ${insuranceAssessment.adequacy}%</span>
                <div class="adequacy-bar" style="width:${insuranceAssessment.adequacy}%"></div>
              </div>
              <div class="ins-gaps">
                <h6>Coverage Gaps:</h6>
                ${insuranceAssessment.gaps.map(g => html`<span class="gap-item">${g}</span>`)}
              </div>
              <div class="ins-rec">${insuranceAssessment.recommendation}</div>
            </div>
          </div>
          <div class="crq-card">
            <h5>Risk Aggregation Analysis</h5>
            <div class="aggregation-list">
              ${riskAggregation.map(r => html`
                <div class="agg-item">
                  <div class="agg-header">
                    <span class="agg-scenario">${r.scenario}</span>
                    <span class="agg-prob">${r.probability}% probability</span>
                  </div>
                  <div class="agg-loss">Potential loss: ${fmt(r.loss)}</div>
                  <div class="agg-mitigation">Mitigation: ${r.mitigation}</div>
                </div>
              `)}
            </div>
          </div>
          <div class="crq-card">
            <h5>Risk Transfer vs Retain Decision</h5>
            <div class="decision-list">
              ${decisionMatrix.map(d => html`
                <div class="decision-row">
                  <span class="dec-risk">${d.risk}</span>
                  <div class="dec-bars">
                    <div class="dec-bar transfer" style="width:${d.transfer * 1.5}px" title="Transfer: ${d.transfer}%"></div>
                    <div class="dec-bar retain" style="width:${d.retain * 1.5}px" title="Retain: ${d.retain}%"></div>
                  </div>
                  <span class="dec-action">${d.action}</span>
                </div>
              `)}
            </div>
          </div>
          <div class="crq-card full-width">
            <h5>Board-Level Risk Summary</h5>
            <div class="board-summary">
              <div class="bs-metric"><span class="bs-label">Total Cyber Risk Exposure</span><span class="bs-value">${fmt(totalALE)}</span></div>
              <div class="bs-metric"><span class="bs-label">Residual Risk After Controls</span><span class="bs-value">${fmt(totalResidual)}</span></div>
              <div class="bs-metric"><span class="bs-label">Risk Treatment Budget</span><span class="bs-value">${fmt(treatmentOptions.reduce((s, t) => s + t.cost, 0))}</span></div>
              <div class="bs-metric"><span class="bs-label">Expected ROI of Treatments</span><span class="bs-value">${(treatmentOptions.reduce((s, t) => s + t.reduction, 0) / treatmentOptions.reduce((s, t) => s + t.cost, 0)).toFixed(1)}x</span></div>
              <div class="bs-metric"><span class="bs-label">Insurance Coverage Ratio</span><span class="bs-value">${Math.round(insuranceAssessment.coverage / totalALE * 100)}%</span></div>
              <div class="bs-metric"><span class="bs-label">Top Concern</span><span class="bs-value">Breach + Ransomware (${fmt(18000000)})</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _calculateALE(maxLoss: number, probability: number): number {
    return Math.round(maxLoss * (probability / 100));
  }

  private _assessRiskTransferRecommendation(ale: number, coverage: number): string {
    const ratio = coverage / ale;
    if (ratio >= 1.5) return 'Adequate - maintain current coverage';
    if (ratio >= 1.0) return 'Marginal - consider increasing coverage';
    return 'Insufficient - immediate coverage increase recommended';
  }


  // --- Cyber Risk Quantification ---
  private _renderCyberRiskQuantification(): TemplateResult {
    const aleByCategory = [
      { category: 'Data Breach', ale: 4200000, maxLoss: 12000000, prob: 35, controls: 12, residual: 1800000 },
      { category: 'Ransomware', ale: 3100000, maxLoss: 8500000, prob: 37, controls: 8, residual: 2100000 },
      { category: 'Insider Threat', ale: 1800000, maxLoss: 5000000, prob: 36, controls: 6, residual: 1200000 },
      { category: 'DDoS', ale: 950000, maxLoss: 3000000, prob: 32, controls: 9, residual: 400000 },
      { category: 'Supply Chain', ale: 2400000, maxLoss: 7000000, prob: 34, controls: 5, residual: 1900000 },
      { category: 'Phishing/Social', ale: 1200000, maxLoss: 3500000, prob: 34, controls: 10, residual: 500000 },
      { category: 'Cloud Misconfig', ale: 800000, maxLoss: 2500000, prob: 32, controls: 7, residual: 350000 },
      { category: 'Zero-Day Exploit', ale: 1500000, maxLoss: 10000000, prob: 15, controls: 3, residual: 1200000 },
    ];
    const totalALE = aleByCategory.reduce((s, c) => s + c.ale, 0);
    const totalResidual = aleByCategory.reduce((s, c) => s + c.residual, 0);
    const treatmentOptions = [
      { risk: 'Data Breach', action: 'Implement DLP + Encryption at Rest', cost: 450000, reduction: 1200000, roi: 2.67, priority: 'high' },
      { risk: 'Ransomware', action: 'Deploy EDR + Immutable Backups', cost: 380000, reduction: 1400000, roi: 3.68, priority: 'high' },
      { risk: 'Supply Chain', action: 'Third-Party Risk Platform', cost: 280000, reduction: 800000, roi: 2.86, priority: 'medium' },
      { risk: 'Insider Threat', action: 'UEBA + Data Access Monitoring', cost: 320000, reduction: 900000, roi: 2.81, priority: 'medium' },
      { risk: 'Cloud Misconfig', action: 'CSPM Automation + Policy-as-Code', cost: 150000, reduction: 550000, roi: 3.67, priority: 'high' },
    ];
    const insuranceAssessment = {
      coverage: 15000000, premium: 420000, deductible: 500000,
      gaps: ['State-sponsored attacks excluded', 'Systemic risk sublimit: $5M', '30-day waiting period for BI'],
      adequacy: 72, recommendation: 'Increase coverage to $20M, add nation-state rider',
    };
    const riskAggregation = [
      { scenario: 'Simultaneous Breach + Ransomware', probability: 8, loss: 18000000, mitigation: 'Incident response retainer + cyber insurance' },
      { scenario: 'Supply Chain Compromise Cascade', probability: 12, loss: 12000000, mitigation: 'Vendor diversification + monitoring' },
      { scenario: 'Cloud Provider Outage + Data Loss', probability: 5, loss: 8000000, mitigation: 'Multi-cloud strategy + geo-redundancy' },
    ];
    const decisionMatrix = [
      { risk: 'Data Breach', transfer: 60, retain: 40, action: 'Transfer via insurance, retain residual' },
      { risk: 'Ransomware', transfer: 45, retain: 55, action: 'Invest in prevention, limited insurance' },
      { risk: 'DDoS', transfer: 70, retain: 30, action: 'DDoS protection service + insurance' },
      { risk: 'Insider Threat', transfer: 20, retain: 80, action: 'Invest in detection and training' },
      { risk: 'Zero-Day', transfer: 50, retain: 50, action: 'Bug bounty + insurance + threat intel' },
    ];
    const fmt = (n: number) => '$' + (n / 1000000).toFixed(1) + 'M';
    return html`
      <div class="cyber-risk-quant">
        <h4>Cyber Risk Quantification Dashboard</h4>
        <div class="crq-grid">
          <div class="crq-card full-width">
            <h5>Annual Loss Expectancy by Risk Category</h5>
            <div class="ale-chart">
              ${aleByCategory.map(c => html`
                <div class="ale-row">
                  <span class="ale-cat">${c.category}</span>
                  <div class="ale-bar-wrap">
                    <div class="ale-bar inherent" style="width:${(c.ale / 5000000) * 100}%" title="ALE: ${fmt(c.ale)}"></div>
                    <div class="ale-bar residual" style="width:${(c.residual / 5000000) * 100}%" title="Residual: ${fmt(c.residual)}"></div>
                  </div>
                  <span class="ale-val">${fmt(c.ale)}</span>
                  <span class="ale-res">${fmt(c.residual)} residual</span>
                </div>
              `)}
            </div>
            <div class="ale-summary">
              <div class="ale-total">Total ALE: <strong>${fmt(totalALE)}</strong></div>
              <div class="ale-res-total">Total Residual: <strong>${fmt(totalResidual)}</strong></div>
              <div class="ale-reduction">Risk Reduction: <strong>${fmt(totalALE - totalResidual)}</strong> (${Math.round((1 - totalResidual / totalALE) * 100)}%)</div>
            </div>
          </div>
          <div class="crq-card">
            <h5>Risk Treatment Cost-Benefit</h5>
            <div class="treatment-list">
              ${treatmentOptions.map(t => html`
                <div class="treat-item priority-${t.priority}">
                  <div class="treat-header">
                    <span class="treat-risk">${t.risk}</span>
                    <span class="treat-roi">ROI: ${t.roi}x</span>
                  </div>
                  <div class="treat-action">${t.action}</div>
                  <div class="treat-metrics">
                    <span>Cost: ${fmt(t.cost)}</span>
                    <span>Reduction: ${fmt(t.reduction)}</span>
                  </div>
                </div>
              `)}
            </div>
          </div>
          <div class="crq-card">
            <h5>Insurance Adequacy Assessment</h5>
            <div class="insurance-panel">
              <div class="ins-row"><span>Coverage</span><span>${fmt(insuranceAssessment.coverage)}</span></div>
              <div class="ins-row"><span>Annual Premium</span><span>${fmt(insuranceAssessment.premium)}</span></div>
              <div class="ins-row"><span>Deductible</span><span>${fmt(insuranceAssessment.deductible)}</span></div>
              <div class="ins-adequacy">
                <span>Adequacy Score: ${insuranceAssessment.adequacy}%</span>
                <div class="adequacy-bar" style="width:${insuranceAssessment.adequacy}%"></div>
              </div>
              <div class="ins-gaps">
                <h6>Coverage Gaps:</h6>
                ${insuranceAssessment.gaps.map(g => html`<span class="gap-item">${g}</span>`)}
              </div>
              <div class="ins-rec">${insuranceAssessment.recommendation}</div>
            </div>
          </div>
          <div class="crq-card">
            <h5>Risk Aggregation Analysis</h5>
            <div class="aggregation-list">
              ${riskAggregation.map(r => html`
                <div class="agg-item">
                  <div class="agg-header">
                    <span class="agg-scenario">${r.scenario}</span>
                    <span class="agg-prob">${r.probability}% probability</span>
                  </div>
                  <div class="agg-loss">Potential loss: ${fmt(r.loss)}</div>
                  <div class="agg-mitigation">Mitigation: ${r.mitigation}</div>
                </div>
              `)}
            </div>
          </div>
          <div class="crq-card">
            <h5>Risk Transfer vs Retain Decision</h5>
            <div class="decision-list">
              ${decisionMatrix.map(d => html`
                <div class="decision-row">
                  <span class="dec-risk">${d.risk}</span>
                  <div class="dec-bars">
                    <div class="dec-bar transfer" style="width:${d.transfer * 1.5}px" title="Transfer: ${d.transfer}%"></div>
                    <div class="dec-bar retain" style="width:${d.retain * 1.5}px" title="Retain: ${d.retain}%"></div>
                  </div>
                  <span class="dec-action">${d.action}</span>
                </div>
              `)}
            </div>
          </div>
          <div class="crq-card full-width">
            <h5>Board-Level Risk Summary</h5>
            <div class="board-summary">
              <div class="bs-metric"><span class="bs-label">Total Cyber Risk Exposure</span><span class="bs-value">${fmt(totalALE)}</span></div>
              <div class="bs-metric"><span class="bs-label">Residual Risk After Controls</span><span class="bs-value">${fmt(totalResidual)}</span></div>
              <div class="bs-metric"><span class="bs-label">Risk Treatment Budget</span><span class="bs-value">${fmt(treatmentOptions.reduce((s, t) => s + t.cost, 0))}</span></div>
              <div class="bs-metric"><span class="bs-label">Expected ROI of Treatments</span><span class="bs-value">${(treatmentOptions.reduce((s, t) => s + t.reduction, 0) / treatmentOptions.reduce((s, t) => s + t.cost, 0)).toFixed(1)}x</span></div>
              <div class="bs-metric"><span class="bs-label">Insurance Coverage Ratio</span><span class="bs-value">${Math.round(insuranceAssessment.coverage / totalALE * 100)}%</span></div>
              <div class="bs-metric"><span class="bs-label">Top Concern</span><span class="bs-value">Breach + Ransomware (${fmt(18000000)})</span></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _calculateALE(maxLoss: number, probability: number): number {
    return Math.round(maxLoss * (probability / 100));
  }

  private _assessRiskTransferRecommendation(ale: number, coverage: number): string {
    const ratio = coverage / ale;
    if (ratio >= 1.5) return 'Adequate - maintain current coverage';
    if (ratio >= 1.0) return 'Marginal - consider increasing coverage';
    return 'Insufficient - immediate coverage increase recommended';
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
  }


declare global { interface HTMLElementTagNameMap { 'sc-purple-team': ScPurpleTeam; } }
