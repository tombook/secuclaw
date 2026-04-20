/**
 * sc-purple-team - Purple Team Exercise (SecuClaw Commander)
 * Red/Blue dual-column with gap analysis
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Exercise { name: string; red: string[]; blue: string[]; detected: boolean[]; status: string; risk: string; }

@customElement('sc-purple-team')
export class ScPurpleTeam extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 14px; }
    .exs { display: flex; flex-direction: column; gap: 14px; }
    .ex { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 14px; }
    .ex-head { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .ex-name { font-size: 14px; font-weight: 600; }
    .cols { display: grid; grid-template-columns: 1fr 60px 1fr; gap: 0; font-size: 11px; }
    .col-head { font-weight: 700; font-size: 12px; padding: 6px 8px; text-align: center; }
    .red-h { background: #450a0a; color: #fca5a5; border-radius: 4px 0 0 0; }
    .gap-h { background: #1f2937; color: #6b7280; }
    .blue-h { background: #172554; color: #93c5fd; border-radius: 0 4px 0 0; }
    .red-c { background: #2a0a0a; padding: 5px 8px; border-bottom: 1px solid #1f2937; }
    .gap-c { background: #111827; display: flex; align-items: center; justify-content: center; border-bottom: 1px solid #1f2937; }
    .blue-c { background: #0a1628; padding: 5px 8px; border-bottom: 1px solid #1f2937; }
    .det-yes { color: #22c55e; font-size: 14px; } .det-no { color: #ef4444; font-size: 14px; }
    .badge { font-size: 10px; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
    .c { background: #450a0a; color: #fca5a5; } .h { background: #431407; color: #fdba74; } .m { background: #422006; color: #fde047; }
  `;

  private _exercises: Exercise[] = [
    { name: 'APT29 Emulation (Caldera)', red: ['Spear phishing', 'Macro execution', 'C2 beacon', 'Lateral SMB', 'DCSync', 'Data staging', 'DNS exfil', 'Persistence'],
      blue: ['Email gateway alert', 'AMSI detection', 'Network beacon alert', '— MISSED —', 'LSASS alert', 'DLP alert', 'DNS anomaly', 'Autoruns alert'],
      detected: [true, true, true, false, true, true, true, true], status: 'active', risk: 'critical' },
    { name: 'Ransomware Simulation', red: ['Phishing link', 'Payload drop', 'Reconnaissance', 'Lateral RDP', 'Encryption start'],
      blue: ['URL sandbox alert', 'EDR detection', '— DELAYED 8min —', 'Network alert', 'EDR containment'],
      detected: [true, true, false, true, true], status: 'completed', risk: 'high' },
    { name: 'Insider Data Theft', red: ['USB connect', 'File copy', 'Cloud upload', 'Email external', 'Clear tracks'],
      blue: ['USB policy alert', '— MISSED —', 'Cloud DLP alert', 'Email DLP block', 'Log integrity alert'],
      detected: [true, false, true, true, true], status: 'completed', risk: 'high' },
  ];

  render() {
    return html`<div class="panel">
      <div class="pt">🔴🔵 Purple Team Exercises</div>
      <div class="exs">${this._exercises.map(ex => html`
        <div class="ex">
          <div class="ex-head">
            <span class="ex-name">${ex.name}</span>
            <span><span class="badge ${ex.risk === 'critical' ? 'c' : 'h'}">${ex.risk}</span> <span style="font-size:11px;color:#94a3b8">${ex.status}</span></span>
          </div>
          <div class="cols">
            <div class="col-head red-h">🔴 Red Team</div><div class="col-head gap-h">Gap</div><div class="col-head blue-h">🔵 Blue Team</div>
            ${ex.red.map((r, i) => html`
              <div class="red-c">${r}</div>
              <div class="gap-c"><span class="${ex.detected[i] ? 'det-yes' : 'det-no'}">${ex.detected[i] ? '✓' : '✗'}</span></div>
              <div class="blue-c" style="${!ex.detected[i] ? 'color:#ef4444' : ''}">${ex.blue[i]}</div>
            `)}
          </div>
          <div style="margin-top:8px;font-size:11px;color:#94a3b8">
            Detection rate: ${ex.detected.filter(d => d).length}/${ex.detected.length} (${Math.round(ex.detected.filter(d => d).length / ex.detected.length * 100)}%) |
            Gaps: ${ex.detected.filter(d => !d).length} action items for blue team improvement
          </div>
        </div>
      `)}</div>
    </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-purple-team': ScPurpleTeam; } }
