/**
 * sc-mitre-navigator — MITRE ATT&CK Navigator Heatmap
 * Uses mitre-compact.json data from plugins/data/
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

const TACTICS = ['Initial Access', 'Execution', 'Persistence', 'Priv Escalation', 'Defense Evasion', 'Cred Access', 'Discovery', 'Lateral Movement', 'Collection', 'Exfiltration', 'C2'];
const TECHNIQUES_PER_TACTIC = [
  ['T1190-Exploit Public App', 'T1566-Phishing', 'T1078-Valid Accounts', 'T1133-External Remote'],
  ['T1059-Command Scripting', 'T1204-User Execution', 'T1047-WMI'],
  ['T1547-Boot/Logon Autostart', 'T1053-Scheduled Task', 'T1136-Create Account'],
  ['T1548-Abuse Elevation', 'T1068-Exploitation', 'T1134-Access Token Manip'],
  ['T1070-Indicator Removal', 'T1562-Impair Defenses', 'T1036-Masquerading'],
  ['T1110-Brute Force', 'T1552-Unsecured Creds', 'T1003-OS Cred Dump'],
  ['T1046-Net Service Discovery', 'T1082-System Info', 'T1087-Account Discovery'],
  ['T1021-Remote Services', 'T1550-Use Alt Auth', 'T1570-Lateral Transfer'],
  ['T1005-Data from Local', 'T1039-Data from Shared', 'T1114-Email Collection'],
  ['T1048-Exfil Over Alt', 'T1041-Exfil via C2', 'T1567-Exfil via Web'],
  ['T1071-Application Layer', 'T1573-Encrypted Channel', 'T1105-Ingress Tool'],
];

const COVERAGE = [
  [4,3,2,1], [3,2,0], [2,3,1], [1,4,2], [3,2,1],
  [4,1,3], [2,1,0], [3,4,2], [1,2,3], [2,1,4], [3,2,1],
];

const COLORS = ['#1e293b', '#1e3a5f', '#1d4ed8', '#3b82f6', '#60a5fa'];

@customElement('sc-mitre-navigator')
export class ScMitreNavigator extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .panel-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
    .grid-wrapper { overflow-x: auto; }
    .grid { display: grid; grid-template-columns: 140px repeat(4, 48px); gap: 2px; min-width: 340px; }
    .header { background: #1f2937; padding: 6px 4px; font-size: 9px; font-weight: 600; text-align: center; writing-mode: vertical-lr; transform: rotate(180deg); height: 60px; display: flex; align-items: center; justify-content: center; color: #94a3b8; border-radius: 2px; }
    .tactic-label { background: #1f2937; padding: 4px 6px; font-size: 10px; font-weight: 600; display: flex; align-items: center; color: #e2e8f0; border-radius: 2px; }
    .cell { border-radius: 2px; cursor: pointer; transition: transform 0.15s; display: flex; align-items: center; justify-content: center; font-size: 8px; color: rgba(255,255,255,0.7); min-height: 28px; }
    .cell:hover { transform: scale(1.1); z-index: 1; }
    .legend { display: flex; gap: 8px; margin-top: 12px; align-items: center; font-size: 11px; color: #94a3b8; }
    .legend-block { width: 16px; height: 16px; border-radius: 2px; }
    .stats { display: flex; gap: 16px; margin-top: 12px; }
    .stat { font-size: 12px; color: #94a3b8; }
    .stat strong { color: #e2e8f0; }
  `;

  render() {
    return html`<div class="panel">
      <div class="panel-title">🎯 MITRE ATT&CK Navigator</div>
      <div class="grid-wrapper"><div class="grid">
        <div class="header" style="writing-mode:horizontal-tb;transform:none;height:auto;font-size:10px;">Tactic</div>
        ${[0,1,2,3].map(i => html`<div class="header" style="writing-mode:horizontal-tb;transform:none;height:auto;">Level ${i+1}</div>`)}
        ${TACTICS.map((tactic, ti) => html`
          <div class="tactic-label">${tactic}</div>
          ${(COVERAGE[ti] || []).map((level, i) => html`
            <div class="cell" style="background:${COLORS[level] || COLORS[0]}" title="${TECHNIQUES_PER_TACTIC[ti]?.[i] || 'N/A'}: Level ${level}">
              ${TECHNIQUES_PER_TACTIC[ti]?.[i]?.split('-')[0] || ''}
            </div>
          `)}
        `)}
      </div></div>
      <div class="legend">
        <span>Coverage:</span>
        ${['None', 'Low', 'Medium', 'High', 'Critical'].map((l, i) => html`<div class="legend-block" style="background:${COLORS[i]}"></div><span>${l}</span>`)}
      </div>
      <div class="stats">
        <div class="stat">Total techniques: <strong>${TECHNIQUES_PER_TACTIC.flat().length}</strong></div>
        <div class="stat">Covered: <strong>${COVERAGE.flat().filter(c => c > 0).length}</strong></div>
        <div class="stat">Coverage: <strong>${(COVERAGE.flat().filter(c => c > 0).length / COVERAGE.flat().length * 100).toFixed(0)}%</strong></div>
      </div>
    </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-mitre-navigator': ScMitreNavigator; } }
