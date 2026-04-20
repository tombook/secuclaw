/**
 * sc-champions - Security Champions Leaderboard (CISO / SecuClaw Commander)
 * Department leaderboard with badge tiers and training progress
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Champion { dept: string; name: string; score: number; training: number; tasks: number; phishing: number; badge: string; reviews: number; }

@customElement('sc-champions')
export class ScChampions extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 14px; }
    .lb { display: flex; flex-direction: column; gap: 8px; }
    .row { display: grid; grid-template-columns: 30px 1fr 80px 60px 60px 60px; gap: 8px; align-items: center; padding: 10px 12px; background: #1f2937; border: 1px solid #374151; border-radius: 6px; }
    .row.top1 { border-color: #fbbf24; background: linear-gradient(135deg, #1f2937 0%, #2a2006 100%); }
    .row.top2 { border-color: #9ca3af; } .row.top3 { border-color: #b45309; }
    .rank { font-size: 16px; font-weight: 700; text-align: center; }
    .info .name { font-size: 13px; font-weight: 600; } .info .dept { font-size: 11px; color: #94a3b8; }
    .score { font-size: 18px; font-weight: 700; text-align: center; }
    .stat-col { text-align: center; font-size: 11px; }
    .stat-col .val { font-size: 14px; font-weight: 600; }
    .stat-col .lbl { font-size: 9px; color: #6b7280; }
    .badge { font-size: 18px; }
    .hd { display: grid; grid-template-columns: 30px 1fr 80px 60px 60px 60px; gap: 8px; padding: 4px 12px; font-size: 10px; color: #6b7280; }
  `;

  private _champions: Champion[] = [
    { dept: 'Finance', name: 'Wang Jun', score: 95, training: 100, tasks: 12, phishing: 97, badge: '🥇', reviews: 8 },
    { dept: 'Engineering', name: 'Li Wei', score: 92, training: 100, tasks: 14, phishing: 100, badge: '🥇', reviews: 10 },
    { dept: 'Security', name: 'Chen Tao', score: 90, training: 100, tasks: 11, phishing: 95, badge: '🥇', reviews: 9 },
    { dept: 'Product', name: 'Zhang Yan', score: 86, training: 95, tasks: 9, phishing: 90, badge: '🥈', reviews: 7 },
    { dept: 'Sales', name: 'Liu Fang', score: 82, training: 92, tasks: 8, phishing: 88, badge: '🥈', reviews: 5 },
    { dept: 'HR', name: 'Zhao Min', score: 78, training: 85, tasks: 7, phishing: 82, badge: '🥉', reviews: 4 },
    { dept: 'Marketing', name: 'Sun Li', score: 75, training: 88, tasks: 6, phishing: 80, badge: '🥉', reviews: 3 },
    { dept: 'Legal', name: 'Zhou Jing', score: 72, training: 80, tasks: 5, phishing: 78, badge: '🥉', reviews: 2 },
  ];

  render() {
    return html`<div class="panel">
      <div class="pt">🏆 Security Champions Leaderboard</div>
      <div class="hd">
        <span>#</span><span>Champion</span><span>Score</span><span>Training</span><span>Phishing</span><span>Tasks</span>
      </div>
      <div class="lb">${this._champions.map((c, i) => html`
        <div class="row ${i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : ''}">
          <div class="rank">${c.badge}</div>
          <div class="info"><div class="name">${c.name}</div><div class="dept">${c.dept} Dept</div></div>
          <div class="score" style="color:${c.score >= 90 ? '#22c55e' : c.score >= 80 ? '#eab308' : '#f97316'}">${c.score}</div>
          <div class="stat-col"><div class="val">${c.training}%</div><div class="lbl">Training</div></div>
          <div class="stat-col"><div class="val">${c.phishing}%</div><div class="lbl">Phishing</div></div>
          <div class="stat-col"><div class="val">${c.tasks}</div><div class="lbl">Tasks</div></div>
        </div>
      `)}</div>
    </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-champions': ScChampions; } }
