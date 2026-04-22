/**
 * sc-security-posture-score - Security Posture Scoring Dashboard
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-security-posture-score')
export class ScSecurityPostureScore extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; --bg-primary: #0f172a; --bg-secondary: #1e293b; --bg-tertiary: #0a0e17; --text-primary: #f8fafc; --text-secondary: #94a3b8; --border: #334155; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; --info: #3b82f6; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .title { font-size: 18px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
    .title-icon { width: 32px; height: 32px; background: linear-gradient(135deg, var(--success), var(--info)); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 12px; }
    .score-section { display: grid; grid-template-columns: 200px 1fr; gap: 24px; margin-bottom: 24px; }
    .main-score { text-align: center; padding: 30px; background: var(--bg-secondary); border-radius: 12px; }
    .score-ring { width: 150px; height: 150px; margin: 0 auto 16px; position: relative; }
    .score-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .score-bg { fill: none; stroke: var(--bg-tertiary); stroke-width: 12; }
    .score-fill { fill: none; stroke-width: 12; stroke-linecap: round; transition: stroke-dashoffset 1s ease; }
    .score-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; }
    .score-number { font-size: 48px; font-weight: 700; }
    .score-label { font-size: 14px; color: var(--text-secondary); }
    .score-trend { display: flex; justify-content: center; gap: 8px; margin-top: 12px; font-size: 13px; }
    .trend-up { color: var(--success); }
    .dimension-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .dim-card { background: var(--bg-secondary); border-radius: 8px; padding: 16px; text-align: center; transition: all 0.2s; }
    .dim-card:hover { transform: translateY(-2px); }
    .dim-icon { width: 40px; height: 40px; border-radius: 8px; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: bold; }
    .dim-value { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .dim-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; }
    .dim-change { font-size: 11px; margin-top: 4px; }
    .chart-area { background: var(--bg-secondary); border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .chart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .chart-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .period-btn { padding: 6px 12px; border-radius: 6px; border: none; background: var(--bg-tertiary); color: var(--text-secondary); font-size: 12px; cursor: pointer; }
    .period-btn.active { background: var(--info); color: white; }
    .chart-bars { display: flex; align-items: flex-end; justify-content: space-between; height: 150px; padding-top: 20px; }
    .bar-group { display: flex; flex-direction: column; align-items: center; flex: 1; }
    .bar { width: 24px; border-radius: 4px 4px 0 0; transition: height 0.5s ease; }
    .bar-label { font-size: 10px; color: var(--text-secondary); margin-top: 8px; }
    .controls-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
    .control-card { background: var(--bg-secondary); border-radius: 8px; padding: 16px; }
    .control-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .control-title { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .control-status { font-size: 11px; padding: 4px 8px; border-radius: 4px; font-weight: 600; }
    .status-pass { background: rgba(34,197,94,0.2); color: var(--success); }
    .status-fail { background: rgba(239,68,68,0.2); color: var(--danger); }
    .status-warn { background: rgba(245,158,11,0.2); color: var(--warning); }
    .progress-bar { height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
    .control-meta { display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: var(--text-secondary); }
    .rec-section { background: var(--bg-secondary); border-radius: 12px; padding: 20px; }
    .rec-item { display: flex; gap: 12px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px; border-left: 3px solid; margin-bottom: 12px; }
    .rec-icon { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-weight: bold; }
    .rec-content { flex: 1; }
    .rec-title-text { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
    .rec-desc { font-size: 12px; color: var(--text-secondary); }
    .rec-impact { font-size: 11px; padding: 4px 8px; border-radius: 4px; font-weight: 600; white-space: nowrap; }
    .impact-high { background: rgba(239,68,68,0.2); color: var(--danger); }
    .impact-medium { background: rgba(245,158,11,0.2); color: var(--warning); }
    .impact-low { background: rgba(34,197,94,0.2); color: var(--success); }
    .btn { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-primary { background: var(--info); border-color: var(--info); color: white; }
  `;

  @state() private period: '7d' | '30d' | '90d' = '30d';

  private dimensions = [
    { label: 'Identity', icon: 'ID', value: 85, change: '+3', color: '#3b82f6' },
    { label: 'Data', icon: 'DT', value: 72, change: '-2', color: '#8b5cf6' },
    { label: 'Apps', icon: 'AP', value: 68, change: '+5', color: '#06b6d4' },
    { label: 'Infra', icon: 'IF', value: 91, change: '+1', color: '#10b981' },
    { label: 'Endpoint', icon: 'EP', value: 78, change: '-4', color: '#f59e0b' },
    { label: 'Network', icon: 'NW', value: 82, change: '+2', color: '#ec4899' },
  ];

  private controls = [
    { name: 'MFA Implementation', category: 'Identity', score: 92, status: 'pass', assets: 1250, coverage: '96%' },
    { name: 'Data Encryption', category: 'Data', score: 78, status: 'warn', assets: 340, coverage: '82%' },
    { name: 'Patch Management', category: 'Infrastructure', score: 65, status: 'fail', assets: 890, coverage: '71%' },
    { name: 'Network Segmentation', category: 'Network', score: 88, status: 'pass', assets: 156, coverage: '94%' },
  ];

  private trendData = { '7d': [72, 73, 74, 73, 75, 74, 76], '30d': [70, 72, 73, 74, 73, 75, 76, 77, 76, 78], '90d': [55, 58, 62, 65, 68, 70, 72, 74, 76, 78] };
  private recommendations = [
    { title: 'Implement passwordless authentication', desc: 'Deploy FIDO2/WebAuthn for privileged accounts', category: 'Identity', impact: 'high', icon: 'P', color: '#3b82f6' },
    { title: 'Deploy EDR on remaining endpoints', desc: 'Install protection on 156 unprotected endpoints', category: 'Endpoint', impact: 'high', icon: 'E', color: '#f59e0b' },
    { title: 'Enable database encryption', desc: 'Encrypt 89 tables containing sensitive data', category: 'Data', impact: 'medium', icon: 'D', color: '#10b981' },
  ];

  private getScoreColor(score: number): string { return score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--danger)'; }
  private getStatusClass(status: string): string { return status === 'pass' ? 'status-pass' : status === 'fail' ? 'status-fail' : 'status-warn'; }

  render() {
    const overallScore = 79;
    const circumference = 2 * Math.PI * 60;
    const offset = circumference - (overallScore / 100) * circumference;
    const color = this.getScoreColor(overallScore);
    const data = this.trendData[this.period];
    const max = Math.max(...data);
    const min = Math.min(...data);

    return html`
      <div class="panel" role="region" aria-label="Security Posture Score Dashboard">
        <div class="header">
          <h2 class="title"><span class="title-icon">SP</span> Security Posture Score</h2>
          <div style="display: flex; gap: 8px;">
            <button class="btn">Export</button>
            <button class="btn btn-primary">Details</button>
          </div>
        </div>

        <div class="score-section">
          <div class="main-score">
            <div class="score-ring">
              <svg viewBox="0 0 150 150">
                <circle class="score-bg" cx="75" cy="75" r="60" />
                <circle class="score-fill" cx="75" cy="75" r="60" stroke="${color}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" />
              </svg>
              <div class="score-value">
                <div class="score-number" style="color: ${color}">${overallScore}</div>
                <div class="score-label">out of 100</div>
              </div>
            </div>
            <div class="score-trend"><span class="trend-up">+7 points</span> vs last month</div>
          </div>
          <div class="dimension-cards">
            ${this.dimensions.map(d => html`
              <div class="dim-card">
                <div class="dim-icon" style="background: ${d.color}20; color: ${d.color}">${d.icon}</div>
                <div class="dim-value" style="color: ${this.getScoreColor(d.value)}">${d.value}</div>
                <div class="dim-label">${d.label}</div>
                <div class="dim-change" style="color: ${d.change.startsWith('+') ? 'var(--success)' : 'var(--danger)'}">${d.change} pts</div>
              </div>
            `)}
          </div>
        </div>

        <div class="chart-area">
          <div class="chart-header">
            <span class="chart-title">Posture Score Trend</span>
            <div style="display: flex; gap: 4px;">
              <button class="period-btn ${this.period === '7d' ? 'active' : ''}" @click=${() => this.period = '7d'}>7D</button>
              <button class="period-btn ${this.period === '30d' ? 'active' : ''}" @click=${() => this.period = '30d'}>30D</button>
              <button class="period-btn ${this.period === '90d' ? 'active' : ''}" @click=${() => this.period = '90d'}>90D</button>
            </div>
          </div>
          <div class="chart-bars">
            ${data.map((val, i) => {
              const height = ((val - min + 5) / (max - min + 10)) * 100;
              const labels = this.period === '7d' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : this.period === '30d' ? ['W1', 'W2', 'W3', 'W4'] : ['Q1', 'Q2', 'Q3'];
              const labelIndex = this.period === '7d' ? i : this.period === '30d' ? Math.floor(i / 3) : i;
              return html`<div class="bar-group"><div class="bar" style="height: ${height}%; background: ${this.getScoreColor(val)}"></div><div class="bar-label">${labels[labelIndex] || ''}</div></div>`;
            })}
          </div>
        </div>

        <div class="controls-grid">
          ${this.controls.map(c => html`
            <div class="control-card">
              <div class="control-header">
                <span class="control-title">${c.name}</span>
                <span class="control-status ${this.getStatusClass(c.status)}">${c.status}</span>
              </div>
              <div class="progress-bar"><div class="progress-fill" style="width: ${c.score}%; background: ${this.getScoreColor(c.score)}"></div></div>
              <div class="control-meta"><span>${c.assets} assets</span><span>${c.coverage}</span></div>
            </div>
          `)}
        </div>

        <div class="rec-section">
          <div class="chart-header" style="margin-bottom: 16px;">
            <span class="chart-title">Top Recommendations</span>
            <button class="btn">View All</button>
          </div>
          ${this.recommendations.map(r => html`
            <div class="rec-item" style="border-color: ${r.color}">
              <div class="rec-icon" style="background: ${r.color}20; color: ${r.color}">${r.icon}</div>
              <div class="rec-content">
                <div class="rec-title-text">${r.title}</div>
                <div class="rec-desc">${r.desc}</div>
              </div>
              <span class="rec-impact impact-${r.impact}">${r.impact}</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-security-posture-score': ScSecurityPostureScore; } }
