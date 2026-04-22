/**
 * SecuClaw Red Team Scoring Component
 * Attack simulation scoring, objective tracking, and team performance
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-red-team-scoring')
export class ScRedTeamScoring extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #111827); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 16px; }
    .title { font-size: 16px; font-weight: 700; }
    .score-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .score-card { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 14px; text-align: center; }
    .score-value { font-size: 28px; font-weight: 700; }
    .score-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
    .operation-section { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
    .objectives { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 14px; }
    .obj-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .obj-title { font-size: 13px; font-weight: 600; }
    .obj-progress { font-size: 12px; color: #94a3b8; }
    .progress-bar { height: 6px; background: #1e293b; border-radius: 3px; overflow: hidden; margin-bottom: 12px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #ef4444, #f97316); border-radius: 3px; }
    .obj-item { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #374151; }
    .obj-item:last-child { border-bottom: none; }
    .obj-status { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; margin-top: 2px; }
    .obj-status.complete { background: #22c55e; }
    .obj-status.active { background: #f97316; animation: pulse 2s infinite; }
    .obj-status.pending { background: #374151; }
    .obj-info { flex: 1; }
    .obj-name { font-size: 12px; font-weight: 600; }
    .obj-desc { font-size: 10px; color: #94a3b8; margin-top: 2px; }
    .obj-points { font-size: 11px; color: #22c55e; font-weight: 600; }
    .team-panel { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 14px; }
    .team-title { font-size: 13px; font-weight: 600; margin-bottom: 12px; }
    .team-member { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #374151; align-items: center; }
    .member-avatar { width: 36px; height: 36px; border-radius: 50%; background: #3b82f6; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; }
    .member-info { flex: 1; }
    .member-name { font-size: 12px; font-weight: 600; }
    .member-role { font-size: 10px; color: #94a3b8; }
    .member-score { text-align: right; }
    .member-points { font-size: 14px; font-weight: 700; color: #22c55e; }
    .member-kills { font-size: 10px; color: #94a3b8; }
    .timeline { margin-top: 16px; }
    .timeline-title { font-size: 13px; font-weight: 600; margin-bottom: 10px; }
    .timeline-item { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #374151; }
    .timeline-time { width: 50px; font-size: 10px; color: #94a3b8; flex-shrink: 0; }
    .timeline-content { flex: 1; }
    .timeline-event { font-size: 12px; }
    .timeline-detail { font-size: 10px; color: #94a3b8; }
    .btn { padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #374151; background: var(--bg-secondary, #1f2937); color: #e2e8f0; }
    .btn.danger { background: #dc2626; border-color: #dc2626; color: white; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; }
    .badge-red { background: #450a0a; color: #fca5a5; }
    .badge-blue { background: #172554; color: #93c5fd; }
    .badge-green { background: #052e16; color: #86efac; }
    @media (max-width: 900px) { .operation-section { grid-template-columns: 1fr; } }
  `;

  @state() private operationProgress = 67;

  private objectives = [
    { id: 1, name: 'Initial Access', desc: 'Gain foothold via phishing/exploit', points: 100, status: 'complete' },
    { id: 2, name: 'Internal Recon', desc: 'Map network and identify assets', points: 50, status: 'complete' },
    { id: 3, name: 'Credential Access', desc: 'Dump hashes and escalate privileges', points: 150, status: 'active' },
    { id: 4, name: 'Lateral Movement', desc: 'Move to critical systems', points: 100, status: 'active' },
    { id: 5, name: 'Data Exfiltration', desc: 'Extract sensitive data', points: 200, status: 'pending' },
    { id: 6, name: 'Persistence', desc: 'Establish persistent access', points: 75, status: 'complete' },
    { id: 7, name: 'Impact', desc: 'Execute destructive actions', points: 250, status: 'pending' },
  ];

  private teamMembers = [
    { name: 'Alex "Zero" Chen', role: 'Team Lead', points: 2450, kills: 12, avatar: 'A' },
    { name: 'Sam "Ghost" Wilson', role: 'Operator', points: 1820, kills: 8, avatar: 'S' },
    { name: 'Jordan "Shell" Lee', role: 'Specialist', points: 1680, kills: 6, avatar: 'J' },
    { name: 'Casey "Hash" Brown', role: 'Analyst', points: 1420, kills: 4, avatar: 'C' },
  ];

  private timeline = [
    { time: '14:32', event: 'Objective Complete', detail: 'Initial Access via phishing campaign', type: 'success' },
    { time: '14:15', event: 'Beacon Established', detail: 'C2 connection confirmed on 3 endpoints', type: 'info' },
    { time: '13:58', event: 'Phishing Emails Sent', detail: '50 emails delivered, 12 opened, 3 clicked', type: 'info' },
    { time: '13:45', event: 'Operation Started', detail: 'Red Team operation "Project Phoenix" initiated', type: 'info' },
  ];

  private getTotalPoints(): number {
    return this.objectives.filter(o => o.status !== 'pending').reduce((sum, o) => sum + o.points, 0);
  }

  private getMaxPoints(): number {
    return this.objectives.reduce((sum, o) => sum + o.points, 0);
  }

  render() {
    const completedPoints = this.getTotalPoints();
    const maxPoints = this.getMaxPoints();
    const totalKills = this.teamMembers.reduce((sum, m) => sum + m.kills, 0);

    return html`
      <div class="panel">
        <div class="header">
          <h2 class="title">🎯 Red Team Operations</h2>
          <div style="display: flex; gap: 8px;">
            <button class="btn" @click=${() => {}}>📊 View Report</button>
            <button class="btn danger" @click=${() => {}}>⏹️ End Operation</button>
          </div>
        </div>

        <div class="score-grid">
          <div class="score-card">
            <div class="score-value" style="color: #22c55e">${completedPoints}</div>
            <div class="score-label">Points Earned</div>
          </div>
          <div class="score-card">
            <div class="score-value">${maxPoints}</div>
            <div class="score-label">Max Points</div>
          </div>
          <div class="score-card">
            <div class="score-value">${totalKills}</div>
            <div class="score-label">Objectives Complete</div>
          </div>
          <div class="score-card">
            <div class="score-value" style="color: #ef4444">${this.operationProgress}%</div>
            <div class="score-label">Operation Progress</div>
          </div>
        </div>

        <div class="operation-section">
          <div class="objectives">
            <div class="obj-header">
              <span class="obj-title">🎯 Operation Objectives</span>
              <span class="obj-progress">${this.objectives.filter(o => o.status === 'complete').length}/${this.objectives.length} complete</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width: ${this.operationProgress}%"></div></div>
            ${this.objectives.map(obj => html`
              <div class="obj-item">
                <div class="obj-status ${obj.status}">${obj.status === 'complete' ? '✓' : obj.status === 'active' ? '→' : '○'}</div>
                <div class="obj-info">
                  <div class="obj-name">${obj.name} <span class="badge ${obj.status === 'complete' ? 'badge-green' : obj.status === 'active' ? 'badge-red' : 'badge-blue'}">${obj.status}</span></div>
                  <div class="obj-desc">${obj.desc}</div>
                </div>
                <div class="obj-points">+${obj.points} pts</div>
              </div>
            `)}
          </div>

          <div>
            <div class="team-panel">
              <div class="team-title">👥 Red Team</div>
              ${this.teamMembers.map(member => html`
                <div class="team-member">
                  <div class="member-avatar">${member.avatar}</div>
                  <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-role">${member.role}</div>
                  </div>
                  <div class="member-score">
                    <div class="member-points">${member.points}</div>
                    <div class="member-kills">${member.kills} objectives</div>
                  </div>
                </div>
              `)}
            </div>

            <div class="timeline">
              <div class="timeline-title">📜 Activity Log</div>
              ${this.timeline.map(t => html`
                <div class="timeline-item">
                  <div class="timeline-time">${t.time}</div>
                  <div class="timeline-content">
                    <div class="timeline-event">${t.event}</div>
                    <div class="timeline-detail">${t.detail}</div>
                  </div>
                </div>
              `)}
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-red-team-scoring': ScRedTeamScoring; } }
