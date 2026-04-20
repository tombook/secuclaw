/**
 * sc-dark-sim-engine — Dark Mode 交互式攻击模拟引擎
 * 
 * 基于 SKILL.md dark_tools 定义，为每个角色提供可交互的攻击模拟面板。
 * 用户可以：选择攻击场景 → 查看攻击阶段 → 触发模拟 → 查看发现 → 生成报告
 * 
 * Phase 2 进化：从静态标签升级为可交互的模拟引擎
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { DarkSimulation, DarkSimFinding } from '../../../stores/dark-simulations';
import { DARK_SIMULATIONS } from '../../../stores/dark-simulations';

/* ─── Types ──────────────────────────────────────── */

interface SimRunState {
  scenarioKey: string;
  currentPhaseIdx: number;
  phaseStatuses: Array<'pending' | 'running' | 'pass' | 'warn' | 'fail'>;
  findings: DarkSimFinding[];
  completed: boolean;
}

/* ─── Component ──────────────────────────────────── */

@customElement('sc-dark-sim-engine')
export class ScDarkSimEngine extends LitElement {

  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      --sim-bg: #0a0e17;
      --sim-card: #111827;
      --sim-border: #1e293b;
      --sim-text: #e2e8f0;
      --sim-muted: #94a3b8;
      --sim-accent: #f59e0b;
      --sim-danger: #ef4444;
      --sim-success: #22c55e;
      --sim-warn: #eab308;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .sim-engine {
      background: var(--sim-bg);
      color: var(--sim-text);
      border-radius: 12px;
      padding: 24px;
      min-height: 500px;
    }

    /* Header */
    .sim-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--sim-border);
    }
    .sim-header h3 {
      font-size: 18px;
      font-weight: 700;
      color: var(--sim-accent);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .sim-header .badge-dark {
      background: linear-gradient(135deg, #dc2626, #7c3aed);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }

    /* Scenario Selector */
    .scenario-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 12px;
      margin-bottom: 24px;
    }
    .scenario-card {
      background: var(--sim-card);
      border: 1px solid var(--sim-border);
      border-radius: 8px;
      padding: 14px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      overflow: hidden;
    }
    .scenario-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: var(--sim-border);
      transition: background 0.2s;
    }
    .scenario-card:hover { border-color: var(--sim-accent); transform: translateY(-1px); }
    .scenario-card:hover::before { background: var(--sim-accent); }
    .scenario-card.selected { border-color: var(--sim-accent); background: #1a1f2e; }
    .scenario-card.selected::before { background: var(--sim-accent); }
    .scenario-card .sc-name {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .scenario-card .sc-desc {
      font-size: 12px;
      color: var(--sim-muted);
      line-height: 1.4;
    }
    .scenario-card .sc-badge {
      display: inline-block;
      margin-top: 6px;
      font-size: 10px;
      padding: 1px 6px;
      border-radius: 3px;
      background: #1e293b;
      color: var(--sim-muted);
    }

    /* Phase Pipeline */
    .phase-pipeline {
      display: flex;
      align-items: center;
      gap: 0;
      margin-bottom: 24px;
      padding: 16px 0;
      overflow-x: auto;
    }
    .phase-step {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      white-space: nowrap;
      transition: all 0.3s;
      position: relative;
    }
    .phase-step.pending { color: var(--sim-muted); background: transparent; }
    .phase-step.running { color: var(--sim-accent); background: #1c1917; animation: pulse-border 1.5s infinite; }
    .phase-step.pass { color: var(--sim-success); background: #052e16; }
    .phase-step.warn { color: var(--sim-warn); background: #1c1917; }
    .phase-step.fail { color: var(--sim-danger); background: #1c0a0a; }
    .phase-step .phase-icon { font-size: 16px; }
    .phase-connector {
      width: 24px;
      height: 2px;
      background: var(--sim-border);
      flex-shrink: 0;
    }
    .phase-connector.active { background: var(--sim-accent); }

    @keyframes pulse-border {
      0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.3); }
      50% { box-shadow: 0 0 0 4px rgba(245,158,11,0.1); }
    }

    /* Impact Bars */
    .impact-section {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .impact-item {
      background: var(--sim-card);
      border-radius: 8px;
      padding: 12px;
    }
    .impact-item .ii-label {
      font-size: 11px;
      color: var(--sim-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .impact-item .ii-value {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .impact-item .ii-bar {
      height: 4px;
      background: var(--sim-border);
      border-radius: 2px;
      overflow: hidden;
    }
    .impact-item .ii-bar-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.6s ease;
    }

    /* Findings */
    .findings-section { margin-bottom: 24px; }
    .findings-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .finding-item {
      background: var(--sim-card);
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 8px;
      border-left: 3px solid transparent;
    }
    .finding-item.critical { border-left-color: #dc2626; }
    .finding-item.high { border-left-color: #f97316; }
    .finding-item.medium { border-left-color: #eab308; }
    .finding-item.low { border-left-color: #22c55e; }
    .finding-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .finding-severity {
      font-size: 10px;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 3px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .finding-severity.critical { background: #450a0a; color: #fca5a5; }
    .finding-severity.high { background: #431407; color: #fdba74; }
    .finding-severity.medium { background: #422006; color: #fde047; }
    .finding-severity.low { background: #052e16; color: #86efac; }
    .finding-title { font-size: 14px; font-weight: 600; }
    .finding-detail { font-size: 12px; color: var(--sim-muted); line-height: 1.5; margin-top: 4px; }

    /* MITRE Tags */
    .mitre-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 20px;
    }
    .mitre-tag {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      background: #1e293b;
      color: #60a5fa;
      font-family: 'JetBrains Mono', monospace;
    }

    /* Actions */
    .sim-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: var(--sim-accent); color: #000; }
    .btn-primary:hover:not(:disabled) { background: #d97706; }
    .btn-danger { background: var(--sim-danger); color: #fff; }
    .btn-danger:hover:not(:disabled) { background: #dc2626; }
    .btn-outline { background: transparent; border: 1px solid var(--sim-border); color: var(--sim-text); }
    .btn-outline:hover:not(:disabled) { border-color: var(--sim-accent); }

    /* Result */
    .sim-result {
      background: var(--sim-card);
      border: 1px solid var(--sim-accent);
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
    }
    .sim-result-title { font-size: 14px; font-weight: 600; color: var(--sim-accent); margin-bottom: 8px; }
    .sim-result-text { font-size: 13px; color: var(--sim-text); line-height: 1.6; }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: var(--sim-muted);
    }
    .empty-state .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-state .empty-text { font-size: 14px; }

    .role-selector {
      margin-bottom: 20px;
    }
    .role-selector label {
      font-size: 12px;
      color: var(--sim-muted);
      display: block;
      margin-bottom: 6px;
    }
    .role-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .role-tab {
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid var(--sim-border);
      background: transparent;
      color: var(--sim-text);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .role-tab:hover { border-color: var(--sim-accent); }
    .role-tab.active { background: var(--sim-accent); color: #000; border-color: var(--sim-accent); font-weight: 600; }
  `;

  /* ─── State ──────────────────────────────────── */

  @state() private _selectedRole = '';
  @state() private _selectedScenario = '';
  @state() private _runState: SimRunState | null = null;
  @state() private _running = false;
  @state() private _showResult = false;

  private _allRoles: string[] = [];

  connectedCallback() {
    super.connectedCallback();
    this._allRoles = Object.keys(DARK_SIMULATIONS);
    if (this._allRoles.length > 0) {
      this._selectedRole = this._allRoles[0];
    }
  }

  /* ─── Getters ────────────────────────────────── */

  private get _scenarios(): Record<string, DarkSimulation> {
    if (!this._selectedRole) return {};
    return (DARK_SIMULATIONS as Record<string, Record<string, DarkSimulation>>)[this._selectedRole] ?? {};
  }

  private get _selectedSim(): DarkSimulation | null {
    if (!this._selectedScenario) return null;
    return this._scenarios[this._selectedScenario] ?? null;
  }

  /* ─── Handlers ───────────────────────────────── */

  private _selectRole(role: string) {
    this._selectedRole = role;
    this._selectedScenario = '';
    this._runState = null;
    this._showResult = false;
  }

  private _selectScenario(key: string) {
    this._selectedScenario = key;
    this._runState = null;
    this._showResult = false;
  }

  private async _startSimulation() {
    const sim = this._selectedSim;
    if (!sim) return;

    this._running = true;
    const phaseStatuses = sim.phases.map(() => 'pending' as const);
    phaseStatuses[0] = 'running';
    this._runState = {
      scenarioKey: this._selectedScenario,
      currentPhaseIdx: 0,
      phaseStatuses,
      findings: [],
      completed: false,
    };
    this._showResult = false;

    // Animate through phases
    for (let i = 0; i < sim.phases.length; i++) {
      await this._delay(600 + Math.random() * 400);
      const originalStatus = sim.phases[i].status;
      this._runState!.phaseStatuses[i] = originalStatus;

      // Add findings progressively
      if (originalStatus === 'fail' || originalStatus === 'warn') {
        const relFindings = sim.findings.filter(f => {
          const idx = sim.findings.indexOf(f);
          return idx < sim.findings.length && Math.random() > 0.3;
        }).slice(0, 2);
        for (const f of relFindings) {
          if (!this._runState!.findings.includes(f)) {
            this._runState!.findings = [...this._runState!.findings, f];
          }
        }
      }

      if (i < sim.phases.length - 1) {
        this._runState!.currentPhaseIdx = i + 1;
        this._runState!.phaseStatuses[i + 1] = 'running';
      }
      this.requestUpdate();
    }

    // Complete — add all remaining findings
    this._runState!.findings = [...sim.findings];
    this._runState!.completed = true;
    this._running = false;
    this._showResult = true;
    this.requestUpdate();
  }

  private _resetSimulation() {
    this._runState = null;
    this._showResult = false;
  }

  private _delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private _impactColor(val: number): string {
    if (val >= 80) return '#ef4444';
    if (val >= 60) return '#f97316';
    if (val >= 40) return '#eab308';
    return '#22c55e';
  }

  /* ─── Render ─────────────────────────────────── */

  render() {
    return html`
      <div class="sim-engine">
        ${this._renderHeader()}
        ${this._renderRoleSelector()}
        ${this._selectedRole ? this._renderScenarioGrid() : nothing}
        ${this._selectedSim ? this._renderSimContent() : this._renderEmpty()}
      </div>
    `;
  }

  private _renderHeader() {
    return html`
      <div class="sim-header">
        <h3>🔴 Dark Mode Attack Simulation</h3>
        <span class="badge-dark">INTERACTIVE</span>
      </div>
    `;
  }

  private _renderRoleSelector() {
    return html`
      <div class="role-selector">
        <label>Select Role to Simulate</label>
        <div class="role-tabs">
          ${this._allRoles.map(role => html`
            <button
              class="role-tab ${this._selectedRole === role ? 'active' : ''}"
              @click=${() => this._selectRole(role)}
            >${role}</button>
          `)}
        </div>
      </div>
    `;
  }

  private _renderScenarioGrid() {
    const scenarios = this._scenarios;
    if (!Object.keys(scenarios).length) {
      return html`<div class="empty-state"><div class="empty-text">No dark scenarios defined for this role</div></div>`;
    }

    return html`
      <div class="scenario-grid">
        ${Object.entries(scenarios).map(([key, sim]) => html`
          <div
            class="scenario-card ${this._selectedScenario === key ? 'selected' : ''}"
            @click=${() => this._selectScenario(key)}
          >
            <div class="sc-name">${sim.name}</div>
            <div class="sc-desc">${sim.desc}</div>
            <span class="sc-badge">${sim.mitre.length} MITRE</span>
          </div>
        `)}
      </div>
    `;
  }

  private _renderEmpty() {
    return html`
      <div class="empty-state">
        <div class="empty-icon">🎯</div>
        <div class="empty-text">Select a scenario to begin attack simulation</div>
      </div>
    `;
  }

  private _renderSimContent() {
    const sim = this._selectedSim!;
    const runState = this._runState;

    return html`
      <!-- Phase Pipeline -->
      <div class="phase-pipeline">
        ${sim.phases.map((phase, i) => {
          const status = runState?.phaseStatuses[i] ?? 'pending';
          return html`
            <div class="phase-step ${status}">
              <span class="phase-icon">${phase.icon}</span>
              <span>${phase.label}</span>
              ${status === 'running' ? html`<span style="animation:blink 1s infinite">⏳</span>` : nothing}
            </div>
            ${i < sim.phases.length - 1 ? html`<div class="phase-connector ${status !== 'pending' ? 'active' : ''}"></div>` : nothing}
          `;
        })}
      </div>

      <!-- Impact Section -->
      ${sim.impact ? html`
        <div class="impact-section">
          <div class="impact-item">
            <div class="ii-label">Confidentiality</div>
            <div class="ii-value" style="color:${this._impactColor(sim.impact.confidentiality)}">${sim.impact.confidentiality}%</div>
            <div class="ii-bar"><div class="ii-bar-fill" style="width:${sim.impact.confidentiality}%;background:${this._impactColor(sim.impact.confidentiality)}"></div></div>
          </div>
          <div class="impact-item">
            <div class="ii-label">Integrity</div>
            <div class="ii-value" style="color:${this._impactColor(sim.impact.integrity)}">${sim.impact.integrity}%</div>
            <div class="ii-bar"><div class="ii-bar-fill" style="width:${sim.impact.integrity}%;background:${this._impactColor(sim.impact.integrity)}"></div></div>
          </div>
          <div class="impact-item">
            <div class="ii-label">Availability</div>
            <div class="ii-value" style="color:${this._impactColor(sim.impact.availability)}">${sim.impact.availability}%</div>
            <div class="ii-bar"><div class="ii-bar-fill" style="width:${sim.impact.availability}%;background:${this._impactColor(sim.impact.availability)}"></div></div>
          </div>
        </div>
      ` : nothing}

      <!-- MITRE Tags -->
      <div class="mitre-tags">
        ${sim.mitre.map(m => html`<span class="mitre-tag">${m}</span>`)}
      </div>

      <!-- Findings (live) -->
      ${runState && runState.findings.length > 0 ? html`
        <div class="findings-section">
          <div class="findings-title">🔍 Findings (${runState.findings.length})</div>
          ${runState.findings.map(f => html`
            <div class="finding-item ${f.severity}">
              <div class="finding-header">
                <span class="finding-severity ${f.severity}">${f.severity}</span>
                <span class="finding-title">${f.title}</span>
              </div>
              <div class="finding-detail">${f.detail}</div>
            </div>
          `)}
        </div>
      ` : nothing}

      <!-- Actions -->
      <div class="sim-actions">
        ${!runState ? html`
          <button class="btn btn-danger" @click=${this._startSimulation} ?disabled=${this._running}>
            ⚔️ Launch Attack Simulation
          </button>
        ` : nothing}
        ${runState?.completed ? html`
          <button class="btn btn-outline" @click=${this._resetSimulation}>🔄 Reset</button>
          <button class="btn btn-primary" @click=${() => this._showResult = true}>📋 View Full Report</button>
        ` : nothing}
      </div>

      <!-- Result -->
      ${this._showResult && sim.mockResult ? html`
        <div class="sim-result">
          <div class="sim-result-title">📊 Simulation Report</div>
          <div class="sim-result-text">${sim.mockResult}</div>
        </div>
      ` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-dark-sim-engine': ScDarkSimEngine;
  }
}
