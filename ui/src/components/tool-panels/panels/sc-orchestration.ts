/**
 * sc-orchestration - Security Orchestration (SecuClaw Commander)
 * SOAR workflow cards with step progress bars
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Workflow { name: string; steps: string[]; autoPct: number; avgTime: string; successRate: number; lastRun: string; status: string; risk: string; }

@customElement('sc-orchestration')
export class ScOrchestration extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 14px; }
    .wfs { display: flex; flex-direction: column; gap: 12px; }
    .wf { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 14px; }
    .wf-head { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .wf-name { font-size: 14px; font-weight: 600; }
    .wf-meta { font-size: 11px; color: #94a3b8; display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
    .steps { display: flex; gap: 0; align-items: center; margin-bottom: 6px; }
    .step { flex: 1; text-align: center; padding: 6px 2px; font-size: 10px; background: #0a0e17; border-right: 1px solid #1f2937; }
    .step.done { background: #052e16; color: #86efac; }
    .step.active { background: #422006; color: #fde047; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
    .arrow { color: #374151; font-size: 12px; margin: 0 1px; }
    .bar { height: 6px; border-radius: 3px; background: #0a0e17; overflow: hidden; margin-top: 6px; }
    .bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .badge { font-size: 10px; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
    .c { background: #450a0a; color: #fca5a5; } .h { background: #431407; color: #fdba74; } .m { background: #422006; color: #fde047; }
  `;

  @state() private _expanded = -1;

  private _wfs: Workflow[] = [
    { name: 'Phishing Auto-Response', steps: ['Detect', 'Analyze', 'Block', 'Quarantine', 'Notify', 'Log'], autoPct: 80, avgTime: '3min', successRate: 94, lastRun: '2h ago', status: 'active', risk: 'high' },
    { name: 'Malware Containment', steps: ['Detect', 'Isolate', 'Kill', 'Collect', 'Submit', 'Scan', 'Restore', 'Report'], autoPct: 65, avgTime: '12min', successRate: 89, lastRun: '1d ago', status: 'active', risk: 'critical' },
    { name: 'Brute Force Block', steps: ['Detect', 'Block IP', 'Disable Acct', 'Alert SOC'], autoPct: 95, avgTime: '30s', successRate: 98, lastRun: '4h ago', status: 'active', risk: 'medium' },
    { name: 'Data Exfiltration Stop', steps: ['Alert', 'Block Dest', 'Quarantine', 'Collect', 'Notify DPO', 'Image Disk', 'Report'], autoPct: 50, avgTime: '8min', successRate: 85, lastRun: '3d ago', status: 'active', risk: 'critical' },
  ];

  render() {
    return html`<div class="panel">
      <div class="pt">⚡ Security Orchestration (SOAR)</div>
      <div class="wfs">${this._wfs.map((wf, wi) => html`
        <div class="wf" @click=${() => { this._expanded = this._expanded === wi ? -1 : wi; }} style="cursor:pointer">
          <div class="wf-head">
            <span class="wf-name">${wf.name}</span>
            <span class="badge ${wf.risk === 'critical' ? 'c' : wf.risk === 'high' ? 'h' : 'm'}">${wf.risk}</span>
          </div>
          <div class="wf-meta">
            <span>🤖 Auto: ${wf.autoPct}%</span><span>⏱️ Avg: ${wf.avgTime}</span>
            <span>✅ Success: ${wf.successRate}%</span><span>🕐 Last: ${wf.lastRun}</span>
          </div>
          <div class="steps">${wf.steps.map((s, si) => html`
            <div class="step ${si < Math.floor(wf.steps.length * wf.autoPct / 100) ? 'done' : si === Math.floor(wf.steps.length * wf.autoPct / 100) ? 'active' : ''}">${s}</div>
          `)}</div>
          <div class="bar"><div class="bar-fill" style="width:${wf.autoPct}%;background:${wf.autoPct > 80 ? '#22c55e' : wf.autoPct > 60 ? '#eab308' : '#ef4444'}"></div></div>
          ${this._expanded === wi ? html`<div style="margin-top:10px;font-size:12px;color:#94a3b8">
            <div><strong>Steps detail:</strong> ${wf.steps.join(' → ')}</div>
            <div style="margin-top:4px">Automation coverage: ${wf.autoPct}% | Manual steps: ${wf.steps.length - Math.floor(wf.steps.length * wf.autoPct / 100)}</div>
          </div>` : nothing}
        </div>
      `)}</div>
    </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-orchestration': ScOrchestration; } }
