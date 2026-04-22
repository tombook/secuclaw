/**
 * sc-security-training-tracker - Security Training Tracker Dashboard
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-security-training-tracker')
export class ScSecurityTrainingTracker extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; --bg-primary: #0f172a; --bg-secondary: #1e293b; --bg-tertiary: #0a0e17; --text-primary: #f8fafc; --text-secondary: #94a3b8; --border: #334155; --success: #22c55e; --warning: #f59e0b; --danger: #ef4444; --info: #3b82f6; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .title { font-size: 18px; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
    .title-icon { width: 32px; height: 32px; background: linear-gradient(135deg, var(--info), #8b5cf6); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: white; font-size: 12px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--bg-secondary); border-radius: 8px; padding: 20px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: 700; }
    .stat-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; margin-top: 4px; }
    .stat-bar { width: 100%; height: 6px; background: var(--bg-tertiary); border-radius: 3px; margin-top: 8px; overflow: hidden; }
    .stat-bar-fill { height: 100%; border-radius: 3px; }
    .content-grid { display: grid; grid-template-columns: 1fr 350px; gap: 20px; }
    .card { background: var(--bg-secondary); border-radius: 8px; padding: 20px; margin-bottom: 16px; }
    .card-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 16px; }
    .course-list { max-height: 350px; overflow-y: auto; }
    .course-item { display: flex; gap: 12px; padding: 12px; background: var(--bg-tertiary); border-radius: 6px; margin-bottom: 8px; }
    .course-icon { width: 48px; height: 48px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .course-content { flex: 1; }
    .course-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .course-meta { font-size: 11px; color: var(--text-secondary); margin-top: 2px; }
    .course-progress { margin-top: 8px; }
    .progress-bar { width: 100%; height: 6px; background: var(--bg-primary); border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .progress-text { font-size: 10px; color: var(--text-secondary); margin-top: 4px; }
    .course-status { font-size: 10px; padding: 4px 8px; border-radius: 4px; font-weight: 600; white-space: nowrap; }
    .status-complete { background: rgba(34,197,94,0.2); color: var(--success); }
    .status-in-progress { background: rgba(245,158,11,0.2); color: var(--warning); }
    .status-overdue { background: rgba(239,68,68,0.2); color: var(--danger); }
    .status-not-started { background: rgba(107,114,128,0.2); color: var(--text-secondary); }
    .dept-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .dept-card { background: var(--bg-tertiary); border-radius: 6px; padding: 16px; text-align: center; }
    .dept-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .dept-completion { font-size: 24px; font-weight: 700; margin-top: 8px; }
    .dept-users { font-size: 11px; color: var(--text-secondary); margin-top: 4px; }
    .phishing-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 12px; }
    .phish-stat { background: var(--bg-tertiary); border-radius: 6px; padding: 12px; text-align: center; }
    .phish-value { font-size: 24px; font-weight: 700; }
    .phish-label { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; margin-top: 4px; }
    .leaderboard { max-height: 250px; overflow-y: auto; }
    .leader-item { display: flex; align-items: center; gap: 12px; padding: 10px; background: var(--bg-tertiary); border-radius: 6px; margin-bottom: 6px; }
    .leader-rank { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
    .rank-1 { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #000; }
    .rank-2 { background: linear-gradient(135deg, #9ca3af, #6b7280); color: #fff; }
    .rank-3 { background: linear-gradient(135deg, #d97706, #b45309); color: #fff; }
    .rank-other { background: var(--bg-primary); color: var(--text-secondary); }
    .leader-info { flex: 1; }
    .leader-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .leader-dept { font-size: 11px; color: var(--text-secondary); }
    .leader-score { font-size: 16px; font-weight: 700; color: var(--success); }
    .quiz-chart { display: flex; align-items: flex-end; gap: 8px; height: 100px; padding-top: 20px; }
    .quiz-bar { flex: 1; border-radius: 4px 4px 0 0; transition: height 0.3s; }
    .btn { padding: 8px 16px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; font-weight: 500; cursor: pointer; }
    .btn-primary { background: var(--info); border-color: var(--info); color: white; }
  `;

  private stats = [
    { label: 'Overall Completion', value: '87%', color: 'var(--success)', progress: 87 },
    { label: 'Phishing Resilience', value: '94%', color: 'var(--success)', progress: 94 },
    { label: 'Avg Quiz Score', value: '82%', color: 'var(--warning)', progress: 82 },
    { label: 'Certifications', value: '156', color: 'var(--info)', progress: 0 },
  ];

  private courses = [
    { name: 'Security Awareness Fundamentals', category: 'Required', completion: 100, status: 'complete', users: 423, duration: '45 min' },
    { name: 'Phishing Detection Mastery', category: 'Required', completion: 87, status: 'in-progress', users: 412, duration: '30 min' },
    { name: 'GDPR & Data Privacy', category: 'Compliance', completion: 92, status: 'in-progress', users: 389, duration: '60 min' },
    { name: 'Secure Coding Practices', category: 'Role-based', completion: 65, status: 'in-progress', users: 156, duration: '90 min' },
    { name: 'Incident Response Basics', category: 'Required', completion: 0, status: 'not-started', users: 0, duration: '45 min' },
    { name: 'Cloud Security Essentials', category: 'Role-based', completion: 0, status: 'overdue', users: 0, duration: '60 min' },
  ];

  private departments = [
    { name: 'Engineering', completion: 92, users: 156 },
    { name: 'Finance', completion: 88, users: 45 },
    { name: 'Sales', completion: 85, users: 78 },
    { name: 'HR', completion: 97, users: 23 },
    { name: 'IT', completion: 94, users: 34 },
    { name: 'Marketing', completion: 82, users: 67 },
  ];

  private phishingStats = [
    { label: 'Tests Sent', value: '1,247', color: 'var(--info)' },
    { label: 'Clicked', value: '4.2%', color: 'var(--success)' },
    { label: 'Reported', value: '67%', color: 'var(--success)' },
  ];

  private leaderboard = [
    { rank: 1, name: 'Sarah Chen', dept: 'Engineering', score: 98 },
    { rank: 2, name: 'Mike Johnson', dept: 'IT', score: 95 },
    { rank: 3, name: 'Emily Davis', dept: 'Finance', score: 93 },
    { rank: 4, name: 'Alex Turner', dept: 'Engineering', score: 91 },
    { rank: 5, name: 'Lisa Wang', dept: 'HR', score: 89 },
  ];

  private quizData = [72, 78, 85, 82, 88, 92, 87, 90, 94, 88, 85, 82];

  render() {
    const max = Math.max(...this.quizData);

    return html`
      <div class="panel" role="region" aria-label="Security Training Tracker">
        <div class="header">
          <h2 class="title"><span class="title-icon">ST</span> Security Training Tracker</h2>
          <div style="display: flex; gap: 8px;">
            <button class="btn">Assign Training</button>
            <button class="btn btn-primary">Launch Phishing Test</button>
          </div>
        </div>

        <div class="stats-grid" role="status">
          ${this.stats.map(s => html`
            <div class="stat-card">
              <div class="stat-value" style="color: ${s.color}">${s.value}</div>
              <div class="stat-label">${s.label}</div>
              ${s.progress > 0 ? html`
                <div class="stat-bar"><div class="stat-bar-fill" style="width: ${s.progress}%; background: ${s.color}"></div></div>
              ` : ''}
            </div>
          `)}
        </div>

        <div class="content-grid">
          <div>
            <div class="card">
              <div class="card-title">Training Courses</div>
              <div class="course-list">
                ${this.courses.map(c => html`
                  <div class="course-item">
                    <div class="course-icon" style="background: ${c.status === 'complete' ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)'}">
                      ${c.category === 'Required' ? 'R' : c.category === 'Compliance' ? 'C' : 'S'}
                    </div>
                    <div class="course-content">
                      <div class="course-name">${c.name}</div>
                      <div class="course-meta">${c.category} - ${c.duration} - ${c.users} enrolled</div>
                      ${c.completion > 0 ? html`
                        <div class="course-progress">
                          <div class="progress-bar"><div class="progress-fill" style="width: ${c.completion}%; background: ${c.completion === 100 ? 'var(--success)' : 'var(--info)'}"></div></div>
                          <div class="progress-text">${c.completion}% complete</div>
                        </div>
                      ` : ''}
                    </div>
                    <span class="course-status status-${c.status}">${c.status.replace('-', ' ')}</span>
                  </div>
                `)}
              </div>
            </div>

            <div class="card">
              <div class="card-title">Monthly Quiz Scores</div>
              <div class="quiz-chart">
                ${this.quizData.map((val, i) => html`
                  <div class="quiz-bar" style="height: ${(val / max) * 100}%; background: ${val >= 90 ? 'var(--success)' : val >= 80 ? 'var(--info)' : 'var(--warning)'}"></div>
                `)}
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 10px; color: var(--text-secondary);">
                <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span>
              </div>
            </div>
          </div>

          <div>
            <div class="card">
              <div class="card-title">Department Completion</div>
              <div class="dept-grid">
                ${this.departments.map(d => html`
                  <div class="dept-card">
                    <div class="dept-name">${d.name}</div>
                    <div class="dept-completion" style="color: ${d.completion >= 90 ? 'var(--success)' : d.completion >= 80 ? 'var(--warning)' : 'var(--danger)'}">${d.completion}%</div>
                    <div class="dept-users">${d.users} users</div>
                  </div>
                `)}
              </div>
            </div>

            <div class="card">
              <div class="card-title">Phishing Simulation Stats</div>
              <div class="phishing-stats">
                ${this.phishingStats.map(p => html`
                  <div class="phish-stat">
                    <div class="phish-value" style="color: ${p.color}">${p.value}</div>
                    <div class="phish-label">${p.label}</div>
                  </div>
                `)}
              </div>
            </div>

            <div class="card">
              <div class="card-title">Top Performers</div>
              <div class="leaderboard">
                ${this.leaderboard.map(l => html`
                  <div class="leader-item">
                    <div class="leader-rank ${l.rank <= 3 ? 'rank-' + l.rank : 'rank-other'}">${l.rank}</div>
                    <div class="leader-info">
                      <div class="leader-name">${l.name}</div>
                      <div class="leader-dept">${l.dept}</div>
                    </div>
                    <div class="leader-score">${l.score}%</div>
                  </div>
                `)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-security-training-tracker': ScSecurityTrainingTracker; } }
