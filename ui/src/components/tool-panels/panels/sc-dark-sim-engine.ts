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

interface WorkflowTask {
  id: string;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'failed' | 'blocked';
  assignee: string;
  blockedBy: string[];
  slaDeadline: string;
  priority: Priority;
  createdAt: string;
  completedAt: string | null;
}

interface ExecutionStep {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'success' | 'error';
  startedAt: string | null;
  completedAt: string | null;
  duration: number;
  output: string;
}

interface ExecutionRecord {
  id: string;
  name: string;
  startedAt: string;
  completedAt: string | null;
  steps: ExecutionStep[];
  status: 'running' | 'success' | 'failed';
}

interface ChampionConfig {
  autoEscalationEnabled: boolean;
  escalationThresholdHours: number;
  criticalSlaMinutes: number;
  highSlaMinutes: number;
  mediumSlaMinutes: number;
  autoAssignEnabled: boolean;
  notificationChannels: string[];
  reportSchedule: string;
  maxConcurrentTasks: number;
}

interface CommentEntry {
  id: string;
  author: string;
  timestamp: string;
  text: string;
}

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
    .sla-bar { height: 6px; border-radius: 3px; background: #1e293b; overflow: hidden; margin-top: 4px; }
    .sla-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .sla-expired { background: #ef4444; }
    .sla-warning { background: #f97316; }
    .sla-ok { background: #22c55e; }
    .workflow-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .workflow-table th { text-align: left; padding: 8px 10px; border-bottom: 1px solid #374151; color: #94a3b8; font-weight: 600; font-size: 11px; cursor: pointer; user-select: none; white-space: nowrap; }
    .workflow-table th:hover { color: #f59e0b; }
    .workflow-table td { padding: 8px 10px; border-bottom: 1px solid #1e293b; }
    .workflow-table tr:hover td { background: #1f2937; }
    .workflow-table tr.selected td { background: #1e3a8a; }
    .workflow-table .checkbox-cell { width: 30px; text-align: center; }
    .pagination { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 12px; }
    .pagination button { padding: 4px 10px; border-radius: 4px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; cursor: pointer; font-size: 11px; }
    .pagination button:hover { border-color: #f59e0b; }
    .pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
    .pagination .page-info { color: #94a3b8; }
    .pipeline-steps { display: flex; gap: 2px; margin-bottom: 12px; }
    .pipeline-step { flex: 1; padding: 10px 8px; border-radius: 6px; text-align: center; font-size: 11px; font-weight: 600; border: 1px solid #374151; background: #0a0e17; }
    .pipeline-step.running { border-color: #3b82f6; background: #172554; color: #93c5fd; }
    .pipeline-step.success { border-color: #22c55e; background: #052e16; color: #86efac; }
    .pipeline-step.error { border-color: #ef4444; background: #450a0a; color: #fca5a5; }
    .pipeline-step.idle { color: #6b7280; }
    .progress-track { height: 8px; border-radius: 4px; background: #1e293b; overflow: hidden; margin: 8px 0; }
    .progress-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #3b82f6, #22c55e); transition: width 0.5s; }
    .exec-history { max-height: 300px; overflow-y: auto; }
    .comment-thread { border-left: 2px solid #374151; padding-left: 12px; margin-top: 8px; }
    .comment-item { margin-bottom: 8px; }
    .comment-author { font-size: 11px; font-weight: 700; color: #93c5fd; }
    .comment-time { font-size: 10px; color: #6b7280; margin-left: 8px; }
    .comment-text { font-size: 12px; color: #cbd5e1; margin-top: 2px; }
    .settings-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .settings-card { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 16px; }
    .settings-card h4 { font-size: 13px; font-weight: 700; margin-bottom: 10px; color: #f59e0b; }
    .settings-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 12px; }
    .settings-row label { color: #94a3b8; }
    .settings-row input[type="number"] { width: 70px; padding: 4px 8px; border-radius: 4px; border: 1px solid #374151; background: #0a0e17; color: #e2e8f0; font-size: 12px; }
    .settings-row input[type="checkbox"] { width: 16px; height: 16px; accent-color: #f59e0b; }
    .settings-row select { padding: 4px 8px; border-radius: 4px; border: 1px solid #374151; background: #0a0e17; color: #e2e8f0; font-size: 12px; }
    .batch-toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #1e3a8a; border-radius: 6px; margin-bottom: 8px; font-size: 12px; }
    .batch-toolbar .count { font-weight: 700; color: #93c5fd; }
  `;

  /* ─── State ──────────────────────────────────── */

  @state() private _selectedRole = '';
  @state() private _selectedScenario = '';
  @state() private _runState: SimRunState | null = null;
  @state() private _running = false;
  @state() private _showResult = false;
  @state() private _tablePage = 1;
  @state() private _tablePageSize = 10;
  @state() private _selectedRows = new Set<string>();
  @state() private _workflowSortField: 'status' | 'priority' | 'slaDeadline' | 'title' = 'priority';
  @state() private _workflowSortAsc = true;
  @state() private _executionRunning = false;
  @state() private _currentExecution: ExecutionRecord | null = null;
  @state() private _config: ChampionConfig = {
    autoEscalationEnabled: true,
    escalationThresholdHours: 4,
    criticalSlaMinutes: 15,
    highSlaMinutes: 60,
    mediumSlaMinutes: 240,
    autoAssignEnabled: true,
    notificationChannels: ['slack', 'email'],
    reportSchedule: 'daily',
    maxConcurrentTasks: 5,
  };
  @state() private _comments: CommentEntry[] = [
    { id: 'c1', author: 'soc-tier1', timestamp: '2026-04-23 04:00', text: 'Initial assessment started for Dark Sim Engine finding #1' },
    { id: 'c2', author: 'security-eng', timestamp: '2026-04-23 04:15', text: 'Confirmed this is related to the endpoint detection rule update' },
    { id: 'c3', author: 'manager', timestamp: '2026-04-23 05:00', text: 'Prioritize resolution - potential compliance impact' },
  ];

  private _items: PanelItem[] = [
      {
            "id": "dark-sim-engine-1",
            "title": "Dark Sim Engine Finding #1",
            "severity": "low",
            "status": "open",
            "category": "Security",
            "source": "SIEM",
            "description": "Automated dark-sim-engine assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-15T00:00:00Z",
            "assignee": "soc-tier1",
            "tags": [
                  "dark-sim-engine",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 15,
            "stepsTaken": []
      },
      {
            "id": "dark-sim-engine-2",
            "title": "Dark Sim Engine Finding #2",
            "severity": "medium",
            "status": "open",
            "category": "Network",
            "source": "EDR",
            "description": "Automated dark-sim-engine assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-16T02:00:00Z",
            "assignee": "soc-tier2",
            "tags": [
                  "dark-sim-engine",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 30,
            "stepsTaken": []
      },
      {
            "id": "dark-sim-engine-3",
            "title": "Dark Sim Engine Finding #3",
            "severity": "high",
            "status": "open",
            "category": "Access",
            "source": "Scanner",
            "description": "Automated dark-sim-engine assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-17T04:00:00Z",
            "assignee": "security-eng",
            "tags": [
                  "dark-sim-engine",
                  "automated"
            ],
            "priority": "p3",
            "slaMinutes": 60,
            "stepsTaken": []
      },
      {
            "id": "dark-sim-engine-4",
            "title": "Dark Sim Engine Finding #4",
            "severity": "low",
            "status": "open",
            "category": "Compliance",
            "source": "Audit",
            "description": "Automated dark-sim-engine assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-18T06:00:00Z",
            "assignee": "compliance",
            "tags": [
                  "dark-sim-engine",
                  "automated"
            ],
            "priority": "p4",
            "slaMinutes": 120,
            "stepsTaken": []
      },
      {
            "id": "dark-sim-engine-5",
            "title": "Dark Sim Engine Finding #5",
            "severity": "medium",
            "status": "open",
            "category": "Operations",
            "source": "Manual",
            "description": "Automated dark-sim-engine assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-19T08:00:00Z",
            "assignee": "ops",
            "tags": [
                  "dark-sim-engine",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 240,
            "stepsTaken": []
      },
      {
            "id": "dark-sim-engine-6",
            "title": "Dark Sim Engine Finding #6",
            "severity": "high",
            "status": "open",
            "category": "Security",
            "source": "SIEM",
            "description": "Automated dark-sim-engine assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-20T10:00:00Z",
            "assignee": "soc-tier1",
            "tags": [
                  "dark-sim-engine",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 15,
            "stepsTaken": []
      },
      {
            "id": "dark-sim-engine-7",
            "title": "Dark Sim Engine Finding #7",
            "severity": "low",
            "status": "open",
            "category": "Network",
            "source": "EDR",
            "description": "Automated dark-sim-engine assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-21T12:00:00Z",
            "assignee": "soc-tier2",
            "tags": [
                  "dark-sim-engine",
                  "automated"
            ],
            "priority": "p3",
            "slaMinutes": 30,
            "stepsTaken": []
      },
      {
            "id": "dark-sim-engine-8",
            "title": "Dark Sim Engine Finding #8",
            "severity": "medium",
            "status": "open",
            "category": "Access",
            "source": "Scanner",
            "description": "Automated dark-sim-engine assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-22T14:00:00Z",
            "assignee": "security-eng",
            "tags": [
                  "dark-sim-engine",
                  "automated"
            ],
            "priority": "p4",
            "slaMinutes": 60,
            "stepsTaken": []
      },
      {
            "id": "dark-sim-engine-9",
            "title": "Dark Sim Engine Finding #9",
            "severity": "high",
            "status": "open",
            "category": "Compliance",
            "source": "Audit",
            "description": "Automated dark-sim-engine assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-23T16:00:00Z",
            "assignee": "compliance",
            "tags": [
                  "dark-sim-engine",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 120,
            "stepsTaken": []
      },
      {
            "id": "dark-sim-engine-10",
            "title": "Dark Sim Engine Finding #10",
            "severity": "low",
            "status": "open",
            "category": "Operations",
            "source": "Manual",
            "description": "Automated dark-sim-engine assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-24T18:00:00Z",
            "assignee": "ops",
            "tags": [
                  "dark-sim-engine",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 240,
            "stepsTaken": []
      }
];

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

  private _workflowTasks: WorkflowTask[] = [
    { id: 'wt-1', title: 'Review Dark Sim Engine finding #1', status: 'active', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T12:00:00Z', priority: 'p1', createdAt: '2026-04-23T00:00:00Z', completedAt: null },
    { id: 'wt-2', title: 'Remediate critical endpoint misconfiguration', status: 'pending', assignee: 'security-eng', blockedBy: ['wt-1'], slaDeadline: '2026-04-23T16:00:00Z', priority: 'p1', createdAt: '2026-04-23T02:00:00Z', completedAt: null },
    { id: 'wt-3', title: 'Update Dark Sim Engine detection rules', status: 'blocked', assignee: 'soc-tier2', blockedBy: ['wt-2'], slaDeadline: '2026-04-24T00:00:00Z', priority: 'p2', createdAt: '2026-04-23T03:00:00Z', completedAt: null },
    { id: 'wt-4', title: 'Generate compliance report', status: 'pending', assignee: 'compliance', blockedBy: [], slaDeadline: '2026-04-24T08:00:00Z', priority: 'p3', createdAt: '2026-04-23T04:00:00Z', completedAt: null },
    { id: 'wt-5', title: 'Validate remediation for finding #6', status: 'completed', assignee: 'security-eng', blockedBy: [], slaDeadline: '2026-04-23T10:00:00Z', priority: 'p2', createdAt: '2026-04-22T18:00:00Z', completedAt: '2026-04-23T08:00:00Z' },
    { id: 'wt-6', title: 'Notify stakeholders of findings', status: 'completed', assignee: 'manager', blockedBy: [], slaDeadline: '2026-04-23T06:00:00Z', priority: 'p3', createdAt: '2026-04-22T20:00:00Z', completedAt: '2026-04-23T04:00:00Z' },
    { id: 'wt-7', title: 'Schedule follow-up scan', status: 'pending', assignee: 'ops', blockedBy: ['wt-2'], slaDeadline: '2026-04-25T00:00:00Z', priority: 'p4', createdAt: '2026-04-23T05:00:00Z', completedAt: null },
    { id: 'wt-8', title: 'Archive resolved Dark Sim Engine findings', status: 'failed', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T08:00:00Z', priority: 'p4', createdAt: '2026-04-22T22:00:00Z', completedAt: null },
  ];

  private _executionHistory: ExecutionRecord[] = [
    {
      id: 'exec-1', name: 'Dark Sim Engine Full Assessment Run', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:12:00Z', status: 'success',
      steps: [
        { id: 's1', name: 'Validate Scope', status: 'success', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:00:30Z', duration: 30, output: 'Scope validated: 142 targets' },
        { id: 's2', name: 'Collect Evidence', status: 'success', startedAt: '2026-04-22T10:00:30Z', completedAt: '2026-04-22T10:06:00Z', duration: 330, output: '1,847 events collected from 12 sources' },
        { id: 's3', name: 'Analyze Patterns', status: 'success', startedAt: '2026-04-22T10:06:00Z', completedAt: '2026-04-22T10:10:00Z', duration: 240, output: '23 patterns identified, 7 correlated' },
        { id: 's4', name: 'Generate Report', status: 'success', startedAt: '2026-04-22T10:10:00Z', completedAt: '2026-04-22T10:12:00Z', duration: 120, output: 'Report generated: 10 findings, 3 critical' },
      ],
    },
    {
      id: 'exec-2', name: 'Dark Sim Engine Delta Scan', startedAt: '2026-04-23T02:00:00Z', completedAt: '2026-04-23T02:05:00Z', status: 'failed',
      steps: [
        { id: 's5', name: 'Validate Scope', status: 'success', startedAt: '2026-04-23T02:00:00Z', completedAt: '2026-04-23T02:00:15Z', duration: 15, output: 'Delta scope: 23 changed targets' },
        { id: 's6', name: 'Collect Evidence', status: 'error', startedAt: '2026-04-23T02:00:15Z', completedAt: '2026-04-23T02:05:00Z', duration: 285, output: 'Timeout: EDR connector unreachable after 5m' },
        { id: 's7', name: 'Analyze Patterns', status: 'idle', startedAt: null, completedAt: null, duration: 0, output: '' },
        { id: 's8', name: 'Generate Report', status: 'idle', startedAt: null, completedAt: null, duration: 0, output: '' },
      ],
    },
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

  private _getSlaStatus(deadline: string): { remaining: number; status: 'expired' | 'warning' | 'ok' } {
    const now = Date.now();
    const end = new Date(deadline).getTime();
    const diff = end - now;
    if (diff < 0) return { remaining: 0, status: 'expired' };
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return { remaining: minutes, status: 'warning' };
    return { remaining: minutes, status: 'ok' };
  }

  private _formatSla(minutes: number): string {
    if (minutes >= 1440) return Math.floor(minutes / 1440) + 'd ' + Math.floor((minutes % 1440) / 60) + 'h';
    if (minutes >= 60) return Math.floor(minutes / 60) + 'h ' + (minutes % 60) + 'm';
    return minutes + 'm';
  }

  private _getPagedItems(items: PanelItem[]): { page: PanelItem[]; total: number; pages: number } {
    const total = items.length;
    const pages = Math.ceil(total / this._tablePageSize) || 1;
    const start = (this._tablePage - 1) * this._tablePageSize;
    return { page: items.slice(start, start + this._tablePageSize), total, pages };
  }

  private _toggleRowSelect(id: string) {
    const next = new Set(this._selectedRows);
    if (next.has(id)) next.delete(id); else next.add(id);
    this._selectedRows = next;
  }

  private _selectAllRows(items: PanelItem[]) {
    if (this._selectedRows.size === items.length) {
      this._selectedRows = new Set();
    } else {
      this._selectedRows = new Set(items.map(i => i.id));
    }
  }

  private _getSortedWorkflow(): WorkflowTask[] {
    const prioOrder: Record<string, number> = { p1: 0, p2: 1, p3: 2, p4: 3, p5: 4 };
    const statusOrder: Record<string, number> = { blocked: 0, pending: 1, active: 2, completed: 3, failed: 4 };
    return [...this._workflowTasks].sort((a, b) => {
      let cmp = 0;
      if (this._workflowSortField === 'status') cmp = statusOrder[a.status] - statusOrder[b.status];
      else if (this._workflowSortField === 'priority') cmp = prioOrder[a.priority] - prioOrder[b.priority];
      else if (this._workflowSortField === 'slaDeadline') cmp = a.slaDeadline.localeCompare(b.slaDeadline);
      else cmp = a.title.localeCompare(b.title);
      return this._workflowSortAsc ? cmp : -cmp;
    });
  }

  private _runExecution() {
    if (this._executionRunning) return;
    this._executionRunning = true;
    const steps: ExecutionStep[] = [
      { id: 'ns1', name: 'Validate Scope', status: 'idle', startedAt: null, completedAt: null, duration: 0, output: '' },
      { id: 'ns2', name: 'Collect Evidence', status: 'idle', startedAt: null, completedAt: null, duration: 0, output: '' },
      { id: 'ns3', name: 'Analyze Patterns', status: 'idle', startedAt: null, completedAt: null, duration: 0, output: '' },
      { id: 'ns4', name: 'Generate Report', status: 'idle', startedAt: null, completedAt: null, duration: 0, output: '' },
    ];
    const exec: ExecutionRecord = {
      id: 'exec-' + Date.now(), name: 'Dark Sim Engine Assessment ' + new Date().toISOString().slice(0, 10), startedAt: new Date().toISOString(), completedAt: null, status: 'running', steps,
    };
    this._currentExecution = exec;
    let stepIdx = 0;
    const outputs = ['Scope validated: 156 targets', '2,103 events collected from 14 sources', '31 patterns identified, 11 correlated', 'Report generated: 12 findings, 4 critical'];
    const durations = [25, 280, 195, 85];
    const runNext = () => {
      if (stepIdx >= steps.length) {
        exec.completedAt = new Date().toISOString();
        exec.status = 'success';
        this._executionRunning = false;
        this.requestUpdate();
        return;
      }
      const s = steps[stepIdx];
      s.status = 'running';
      s.startedAt = new Date().toISOString();
      this.requestUpdate();
      setTimeout(() => {
        s.status = 'success';
        s.completedAt = new Date().toISOString();
        s.duration = durations[stepIdx];
        s.output = outputs[stepIdx];
        stepIdx++;
        this.requestUpdate();
        runNext();
      }, 600 + Math.random() * 800);
    };
    runNext();
  }

  private _renderWorkflowTable(): unknown {
    const tasks = this._getSortedWorkflow();
    const sortArrow = (field: string) => field === this._workflowSortField ? (this._workflowSortAsc ? ' \u25B2' : ' \u25BC') : '';
    return html`
      <div class="form-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div class="form-title" style="margin-bottom:0;">Workflow Task Queue</div>
          <div style="display:flex;gap:6px;">
            <span class="badge badge-active">${tasks.filter(t => t.status === 'active').length} Active</span>
            <span class="badge badge-pending">${tasks.filter(t => t.status === 'pending').length} Pending</span>
            <span class="badge badge-blocked">${tasks.filter(t => t.status === 'blocked').length} Blocked</span>
            <span class="badge badge-completed">${tasks.filter(t => t.status === 'completed').length} Done</span>
          </div>
        </div>
        <div style="overflow-x:auto;">
          <table class="workflow-table">
            <thead>
              <tr>
                <th class="checkbox-cell"><input type="checkbox" ?checked=${this._selectedRows.size === tasks.length && tasks.length > 0} @change=${() => this._selectAllRows(tasks)} /></th>
                <th @click=${() => { this._workflowSortField = 'title'; this._workflowSortAsc = !this._workflowSortAsc; }}>Task${sortArrow('title')}</th>
                <th @click=${() => { this._workflowSortField = 'status'; this._workflowSortAsc = !this._workflowSortAsc; }}>Status${sortArrow('status')}</th>
                <th @click=${() => { this._workflowSortField = 'priority'; this._workflowSortAsc = !this._workflowSortAsc; }}>Priority${sortArrow('priority')}</th>
                <th>Assignee</th>
                <th>Dependencies</th>
                <th @click=${() => { this._workflowSortField = 'slaDeadline'; this._workflowSortAsc = !this._workflowSortAsc; }}>SLA${sortArrow('slaDeadline')}</th>
              </tr>
            </thead>
            <tbody>
              ${tasks.map(t => {
                const sla = this._getSlaStatus(t.slaDeadline);
                return html`
                  <tr class=${this._selectedRows.has(t.id) ? 'selected' : ''}>
                    <td class="checkbox-cell"><input type="checkbox" ?checked=${this._selectedRows.has(t.id)} @change=${() => this._toggleRowSelect(t.id)} /></td>
                    <td style="font-weight:600;">${t.title}</td>
                    <td><span class="badge badge-${t.status}">${t.status}</span></td>
                    <td><span class="badge badge-${t.priority}">${t.priority.toUpperCase()}</span></td>
                    <td>${t.assignee}</td>
                    <td>${t.blockedBy.length ? t.blockedBy.map(b => html`<span style="font-size:10px;color:#f97316;margin-right:4px;">${b}</span>`) : html`<span style="color:#6b7280;">-</span>`}</td>
                    <td>
                      <div style="font-size:11px;color:#94a3b8;">${this._formatSla(sla.remaining)}</div>
                      <div class="sla-bar"><div class="sla-bar-fill sla-${sla.status}" style="width:${Math.min(sla.remaining / 480 * 100, 100)}%"></div></div>
                    </td>
                  </tr>`;
              })}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  private _renderExecutionPanel(): unknown {
    const running = this._currentExecution;
    const completedSteps = running ? running.steps.filter(s => s.status === 'success').length : 0;
    const totalSteps = running ? running.steps.length : 0;
    const pct = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;
    return html`
      <div class="form-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div class="form-title" style="margin-bottom:0;">Execution Pipeline</div>
          <button class="btn primary" ?disabled=${this._executionRunning} @click=${() => this._runExecution()}>
            ${this._executionRunning ? 'Running...' : 'Run Assessment'}
          </button>
        </div>
        ${running ? html`
          <div class="pipeline-steps">
            ${running.steps.map(s => html`
              <div class="pipeline-step ${s.status}">
                <div style="font-size:13px;margin-bottom:2px;">${s.name}</div>
                <div style="font-size:10px;opacity:0.8;">${s.status === 'idle' ? 'Waiting' : s.status === 'running' ? 'Processing...' : s.status === 'success' ? s.duration + 'ms' : 'Error'}</div>
              </div>
            `)}
          </div>
          <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
          <div style="font-size:12px;color:#94a3b8;margin-bottom:12px;">Progress: ${pct}% (${completedSteps}/${totalSteps} steps)</div>
          <div style="font-size:11px;color:#6b7280;margin-bottom:6px;">Step Output:</div>
          <div style="background:#0a0e17;border-radius:6px;padding:10px;font-size:11px;font-family:monospace;color:#94a3b8;max-height:120px;overflow-y:auto;">
            ${running.steps.filter(s => s.output).map(s => html`<div style="margin-bottom:4px;"><span style="color:#f59e0b;">[${s.status.toUpperCase()}]</span> ${s.name}: ${s.output}</div>`)}
          </div>
        ` : html`<div class="empty-state">Click "Run Assessment" to start the Dark Sim Engine analysis pipeline</div>`}
      </div>
      <div class="form-section">
        <div class="form-title">Execution History</div>
        <div class="exec-history">
          ${this._executionHistory.map(ex => html`
            <div style="padding:8px 0;border-bottom:1px solid #1e293b;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:12px;font-weight:600;">${ex.name}</span>
                <span class="badge badge-${ex.status === 'success' ? 'completed' : 'failed'}">${ex.status}</span>
              </div>
              <div style="font-size:10px;color:#6b7280;margin-top:2px;">
                Started: ${new Date(ex.startedAt).toLocaleString()} | Completed: ${ex.completedAt ? new Date(ex.completedAt).toLocaleString() : 'N/A'}
              </div>
              <div style="display:flex;gap:4px;margin-top:4px;">
                ${ex.steps.map(s => html`<span style="font-size:9px;padding:1px 6px;border-radius:3px;background:${s.status === 'success' ? '#052e16' : s.status === 'error' ? '#450a0a' : '#1e293b'};color:${s.status === 'success' ? '#86efac' : s.status === 'error' ? '#fca5a5' : '#6b7280'};">${s.name}: ${s.duration || '-'}ms</span>`)}
              </div>
            </div>
          `)}
        </div>
      </div>`;
  }

  private _renderSettingsTab(): unknown {
    const c = this._config;
    return html`
      <div class="settings-grid">
        <div class="settings-card">
          <h4>SLA Configuration</h4>
          <div class="settings-row"><label>Critical SLA (min)</label><input type="number" .value=${String(c.criticalSlaMinutes)} @input=${(e: Event) => { c.criticalSlaMinutes = Number((e.target as HTMLInputElement).value); this.requestUpdate(); }} /></div>
          <div class="settings-row"><label>High SLA (min)</label><input type="number" .value=${String(c.highSlaMinutes)} @input=${(e: Event) => { c.highSlaMinutes = Number((e.target as HTMLInputElement).value); this.requestUpdate(); }} /></div>
          <div class="settings-row"><label>Medium SLA (min)</label><input type="number" .value=${String(c.mediumSlaMinutes)} @input=${(e: Event) => { c.mediumSlaMinutes = Number((e.target as HTMLInputElement).value); this.requestUpdate(); }} /></div>
        </div>
        <div class="settings-card">
          <h4>Escalation Rules</h4>
          <div class="settings-row"><label>Auto Escalation</label><input type="checkbox" ?checked=${c.autoEscalationEnabled} @change=${(e: Event) => { c.autoEscalationEnabled = (e.target as HTMLInputElement).checked; this.requestUpdate(); }} /></div>
          <div class="settings-row"><label>Threshold (hours)</label><input type="number" .value=${String(c.escalationThresholdHours)} @input=${(e: Event) => { c.escalationThresholdHours = Number((e.target as HTMLInputElement).value); this.requestUpdate(); }} /></div>
          <div class="settings-row"><label>Auto Assign</label><input type="checkbox" ?checked=${c.autoAssignEnabled} @change=${(e: Event) => { c.autoAssignEnabled = (e.target as HTMLInputElement).checked; this.requestUpdate(); }} /></div>
        </div>
        <div class="settings-card">
          <h4>Notifications</h4>
          <div class="settings-row"><label>Report Schedule</label>
            <select .value=${c.reportSchedule} @change=${(e: Event) => { c.reportSchedule = (e.target as HTMLSelectElement).value; this.requestUpdate(); }}>
              <option value="hourly">Hourly</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
            </select>
          </div>
          <div class="settings-row"><label>Max Concurrent Tasks</label><input type="number" .value=${String(c.maxConcurrentTasks)} @input=${(e: Event) => { c.maxConcurrentTasks = Number((e.target as HTMLInputElement).value); this.requestUpdate(); }} /></div>
          <div class="settings-row"><label>Channels</label><span style="font-size:11px;color:#94a3b8;">${c.notificationChannels.join(', ')}</span></div>
        </div>
        <div class="settings-card">
          <h4>Import / Export Config</h4>
          <div style="display:flex;gap:8px;margin-top:4px;">
            <button class="btn primary" @click=${() => {
              const blob = new Blob([JSON.stringify(c, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = 'dark-sim-engine-config.json'; a.click();
              URL.revokeObjectURL(url);
            }}>Export</button>
            <button class="btn" @click=${() => { alert('Import: paste JSON config in console'); }}>Import</button>
          </div>
        </div>
      </div>`;
  }

  private _renderCommentThread(): unknown {
    return html`
      <div style="margin-top:12px;">
        <div style="font-size:12px;font-weight:700;margin-bottom:8px;">Discussion (${this._comments.length})</div>
        <div class="comment-thread">
          ${this._comments.map(c => html`
            <div class="comment-item">
              <span class="comment-author">${c.author}</span>
              <span class="comment-time">${c.timestamp}</span>
              <div class="comment-text">${c.text}</div>
            </div>
          `)}
        </div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <input class="search-box" type="text" placeholder="Add a comment..." style="min-width:auto;flex:1;" id="dark-sim-engine-comment-input" />
          <button class="btn primary" @click=${() => {
            const input = this.shadowRoot?.querySelector('#dark-sim-engine-comment-input') as HTMLInputElement;
            if (input && input.value.trim()) {
              this._comments = [...this._comments, { id: 'c' + Date.now(), author: 'current-user', timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '), text: input.value.trim() }];
              input.value = '';
            }
          }}>Post</button>
        </div>
      </div>`;
  }

  private _renderPaginatedTable(items: PanelItem[]): unknown {
    const { page, total, pages } = this._getPagedItems(items);
    const sortArrow = (field: string) => field === this._sortField ? (this._sortAsc ? ' \u25B2' : ' \u25BC') : '';
    return html`
      <div>
        ${this._selectedRows.size > 0 ? html`
          <div class="batch-toolbar">
            <span class="count">${this._selectedRows.size}</span> selected
            <button class="btn success" @click=${() => { this._selectedRows = new Set(); }}>Resolve Selected</button>
            <button class="btn" @click=${() => { this._selectedRows = new Set(); }}>Reassign</button>
            <button class="btn danger" @click=${() => { this._selectedRows = new Set(); }}>Dismiss Selected</button>
          </div>
        ` : nothing}
        <div style="overflow-x:auto;">
          <table class="workflow-table">
            <thead>
              <tr>
                <th class="checkbox-cell"><input type="checkbox" ?checked=${this._selectedRows.size === page.length && page.length > 0} @change=${() => this._selectAllRows(page)} /></th>
                <th @click=${() => { this._sortField = 'title'; this._sortAsc = !this._sortAsc; }}>Title${sortArrow('title')}</th>
                <th @click=${() => { this._sortField = 'severity'; this._sortAsc = !this._sortAsc; }}>Severity${sortArrow('severity')}</th>
                <th>Status</th>
                <th @click=${() => { this._sortField = 'priority'; this._sortAsc = !this._sortAsc; }}>Priority${sortArrow('priority')}</th>
                <th @click=${() => { this._sortField = 'assignee'; this._sortAsc = !this._sortAsc; }}>Assignee${sortArrow('assignee')}</th>
                <th @click=${() => { this._sortField = 'date'; this._sortAsc = !this._sortAsc; }}>Created${sortArrow('date')}</th>
              </tr>
            </thead>
            <tbody>
              ${page.map(i => html`
                <tr class=${this._selectedRows.has(i.id) ? 'selected' : ''} @click=${() => this._toggle(i.id)} style="cursor:pointer;">
                  <td class="checkbox-cell" @click=${(e: Event) => { e.stopPropagation(); this._toggleRowSelect(i.id); }}><input type="checkbox" ?checked=${this._selectedRows.has(i.id)} /></td>
                  <td style="font-weight:600;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${i.title}</td>
                  <td><span class="badge ${this._getSevBadge(i.severity)}">${i.severity}</span></td>
                  <td><span class="badge ${this._getSevBadge(i.status)}">${i.status}</span></td>
                  <td><span class="badge ${this._getSevBadge(i.priority)}">${i.priority.toUpperCase()}</span></td>
                  <td>${i.assignee}</td>
                  <td style="font-size:11px;color:#94a3b8;">${new Date(i.createdAt).toLocaleDateString()}</td>
                </tr>
                ${this._expandedId === i.id ? html`
                  <tr><td colspan="7" style="padding:0;border-bottom:1px solid #f59e0b;">
                    <div style="padding:12px;background:#1a2332;">
                      <div style="font-size:12px;color:#cbd5e1;line-height:1.6;margin-bottom:8px;">${i.description}</div>
                      <div class="detail-grid">
                        <div class="score-card"><div class="score-val" style="font-size:13px;">${i.category}</div><div class="score-lbl">Category</div></div>
                        <div class="score-card"><div class="score-val" style="font-size:13px;">${i.source}</div><div class="score-lbl">Source</div></div>
                        <div class="score-card"><div class="score-val" style="font-size:13px;">${i.slaMinutes}m</div><div class="score-lbl">SLA</div></div>
                        <div class="score-card"><div class="score-val" style="font-size:13px;">${i.tags.join(', ')}</div><div class="score-lbl">Tags</div></div>
                      </div>
                      ${this._renderCommentThread()}
                      <div style="display:flex;gap:6px;margin-top:10px;">
                        <button class="btn success" @click=${(e: Event) => { e.stopPropagation(); }}>Resolve</button>
                        <button class="btn" @click=${(e: Event) => { e.stopPropagation(); }}>Escalate</button>
                        <button class="btn danger" @click=${(e: Event) => { e.stopPropagation(); }}>Dismiss</button>
                      </div>
                    </div>
                  </td></tr>
                ` : nothing}
              `)}
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button ?disabled=${this._tablePage <= 1} @click=${() => { this._tablePage--; }}>Prev</button>
          <span class="page-info">Page ${this._tablePage} of ${pages} (${total} items)</span>
          <select class="filter-select" style="padding:3px 6px;font-size:11px;" @change=${(e: Event) => { this._tablePageSize = Number((e.target as HTMLSelectElement).value); this._tablePage = 1; }}>
            <option value="5">5</option><option value="10">10</option><option value="20">20</option><option value="50">50</option>
          </select>
          <button ?disabled=${this._tablePage >= pages} @click=${() => { this._tablePage++; }}>Next</button>
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

  // === Threat Modeling Automation Module ===
  @state() private _threatModels = [
    { id: 'TM-A001', name: 'Payment Processing System', version: '2.3', status: 'approved',
      components: 24, dataFlows: 38, trustBoundaries: 6, threats: 45, mitigations: 42,
      lastUpdated: '2026-01-15', riskScore: 72, owner: 'Security Architecture Team' },
    { id: 'TM-A002', name: 'Customer Identity Platform', version: '1.8', status: 'review',
      components: 18, dataFlows: 25, trustBoundaries: 4, threats: 32, mitigations: 28,
      lastUpdated: '2026-01-10', riskScore: 85, owner: 'IAM Team' },
    { id: 'TM-A003', name: 'API Gateway Layer', version: '3.1', status: 'approved',
      components: 12, dataFlows: 20, trustBoundaries: 3, threats: 28, mitigations: 27,
      lastUpdated: '2026-01-20', riskScore: 58, owner: 'Platform Engineering' },
    { id: 'TM-A004', name: 'Data Analytics Pipeline', version: '1.2', status: 'draft',
      components: 15, dataFlows: 30, trustBoundaries: 5, threats: 22, mitigations: 15,
      lastUpdated: '2026-01-18', riskScore: 68, owner: 'Data Engineering' },
    { id: 'TM-A005', name: 'Microservices Mesh', version: '2.0', status: 'review',
      components: 42, dataFlows: 65, trustBoundaries: 8, threats: 58, mitigations: 48,
      lastUpdated: '2026-01-22', riskScore: 91, owner: 'Cloud Infrastructure' },
  ] as any[];
  @state() private _threatPatternLibrary = [
    { pattern: 'STRIDE-Spoofing', category: 'Authentication', severity: 'high', applicableTo: ['web', 'api', 'mobile'], mitigation: 'MFA + Certificate Pinning' },
    { pattern: 'STRIDE-Tampering', category: 'Integrity', severity: 'high', applicableTo: ['data', 'api', 'file'], mitigation: 'Digital Signatures + HMAC' },
    { pattern: 'STRIDE-Repudiation', category: 'Non-repudiation', severity: 'medium', applicableTo: ['transaction', 'audit', 'log'], mitigation: 'Immutable Audit Trail' },
    { pattern: 'STRIDE-InfoDisclosure', category: 'Confidentiality', severity: 'critical', applicableTo: ['data', 'network', 'storage'], mitigation: 'Encryption at Rest + TLS' },
    { pattern: 'STRIDE-DenialOfService', category: 'Availability', severity: 'high', applicableTo: ['network', 'api', 'service'], mitigation: 'Rate Limiting + Circuit Breaker' },
    { pattern: 'STRIDE-ElevationOfPrivilege', category: 'Authorization', severity: 'critical', applicableTo: ['auth', 'admin', 'api'], mitigation: 'RBAC + Least Privilege' },
    { pattern: 'CWE-89-SQLInjection', category: 'Injection', severity: 'critical', applicableTo: ['database', 'api', 'web'], mitigation: 'Parameterized Queries + WAF' },
    { pattern: 'CWE-79-XSS', category: 'Injection', severity: 'high', applicableTo: ['web', 'browser', 'email'], mitigation: 'Output Encoding + CSP Headers' },
    { pattern: 'CWE-22-PathTraversal', category: 'File System', severity: 'high', applicableTo: ['file', 'storage', 'upload'], mitigation: 'Input Validation + Chroot' },
    { pattern: 'CWE-261-WeakCrypto', category: 'Cryptography', severity: 'critical', applicableTo: ['auth', 'data', 'communication'], mitigation: 'AES-256 + TLS 1.3' },
  ] as any[];
  @state() private _threatSelectedModel: string | null = null;
  @state() private _threatSensitivityLevels = ['Public', 'Internal', 'Confidential', 'Restricted', 'Top Secret'] as string[];

  private _detectTrustBoundaries(components: number, dataFlows: number): number {
    return Math.max(1, Math.round(Math.sqrt(components * dataFlows) / 4));
  }

  private _classifyDataFlowSensitivity(flowType: string): string {
    const mapping: Record<string, string> = {
      'auth-token': 'Restricted', 'pii-data': 'Confidential', 'financial': 'Restricted',
      'public-content': 'Public', 'internal-api': 'Internal', 'audit-log': 'Confidential',
      'health-data': 'Restricted', 'session-state': 'Internal', 'config-data': 'Internal',
    };
    return mapping[flowType] || 'Internal';
  }

  private _matchThreatPatterns(componentType: string): any[] {
    return this._threatPatternLibrary.filter(p => p.applicableTo.includes(componentType));
  }

  private _generateMitigationSuggestions(threatCount: number, mitigationCount: number): any[] {
    const gap = threatCount - mitigationCount;
    if (gap <= 0) return [{ priority: 'low', suggestion: 'All threats have mitigations. Schedule periodic review.' }];
    const suggestions = [
      { priority: 'critical', suggestion: gap + ' unmitigated threats require immediate attention' },
      { priority: 'high', suggestion: 'Review threat model for completeness - missing mitigations detected' },
      { priority: 'medium', suggestion: 'Consider automated threat detection for identified gaps' },
    ];
    return suggestions.slice(0, Math.min(gap, 3));
  }

  private _computeThreatModelDiff(before: any, after: any): any[] {
    const changes: any[] = [];
    if (before.components !== after.components) changes.push({ field: 'Components', before: before.components, after: after.components });
    if (before.threats !== after.threats) changes.push({ field: 'Threats', before: before.threats, after: after.threats });
    if (before.mitigations !== after.mitigations) changes.push({ field: 'Mitigations', before: before.mitigations, after: after.mitigations });
    if (before.riskScore !== after.riskScore) changes.push({ field: 'Risk Score', before: before.riskScore, after: after.riskScore });
    return changes;
  }

  // === Security Intelligence Correlation Module ===
  @state() private _intelFeedAggregation = {
    activeFeeds: 12, totalIOCs: 45820, enrichedToday: 342, falsePositiveRate: 0.08,
    feedHealth: [
      { name: 'AlienVault OTX', status: 'healthy', lastSync: '5min ago', iocCount: 15200, freshness: 'real-time' },
      { name: 'MITRE ATT&CK', status: 'healthy', lastSync: '1h ago', iocCount: 8500, freshness: 'daily' },
      { name: 'VirusTotal', status: 'degraded', lastSync: '15min ago', iocCount: 12000, freshness: 'real-time' },
      { name: 'AbuseIPDB', status: 'healthy', lastSync: '10min ago', iocCount: 5400, freshness: 'real-time' },
      { name: 'CISA KEV', status: 'healthy', lastSync: '6h ago', iocCount: 2800, freshness: 'daily' },
      { name: 'Shodan', status: 'maintenance', lastSync: '2h ago', iocCount: 1920, freshness: 'weekly' },
    ] as any[],
  } as any;
  @state() private _intelCorrelationRules = [
    { id: 'CR-001', name: 'IP Reputation Match', type: 'ioc', severity: 'high',
      conditions: ['source_ip in threat_feed', 'destination_port in [22,3389,445]'],
      action: 'block_and_alert', enabled: true, matchCount: 125, fpRate: 0.05 },
    { id: 'CR-002', name: 'Domain Age + Behavior', type: 'composite', severity: 'medium',
      conditions: ['domain_age < 7 days', 'request_volume > 100/hour', 'geo_mismatch = true'],
      action: 'alert_and_quarantine', enabled: true, matchCount: 45, fpRate: 0.12 },
    { id: 'CR-003', name: 'User Behavior Anomaly', type: 'ueba', severity: 'high',
      conditions: ['login_deviation > 3sigma', 'access_pattern_change > 80%', 'off_hours_activity = true'],
      action: 'alert_and_mfa_challenge', enabled: true, matchCount: 18, fpRate: 0.15 },
    { id: 'CR-004', name: 'Lateral Movement Detection', type: 'composite', severity: 'critical',
      conditions: ['authentication_target_count > 5', 'time_window < 30min', 'privilege_change = true'],
      action: 'block_and_escalate', enabled: true, matchCount: 3, fpRate: 0.02 },
    { id: 'CR-005', name: 'Data Exfiltration Pattern', type: 'ueba', severity: 'critical',
      conditions: ['egress_volume > baseline_5x', 'encryption_ratio > 95%', 'destination_external = true'],
      action: 'block_and_investigate', enabled: true, matchCount: 7, fpRate: 0.04 },
    { id: 'CR-006', name: 'Supply Chain Risk', type: 'ioc', severity: 'medium',
      conditions: ['dependency_in_known_vuln_list', 'version_behind_latest > 2'],
      action: 'alert_and_prioritize', enabled: true, matchCount: 89, fpRate: 0.08 },
  ] as any[];
  @state() private _intelThreatActors = [
    { id: 'TA-001', name: 'APT-29', aliases: ['Cozy Bear', 'The Dukes'], sophistication: 'advanced',
      targeting: ['Government', 'Think Tanks', 'Technology'], recentActivity: '2026-01-18',
      associatedIOCs: 450, ttps: ['T1190', 'T1059', 'T1003', 'T1071'] },
    { id: 'TA-002', name: 'APT-41', aliases: ['Double Dragon', 'Winnti'], sophistication: 'advanced',
      targeting: ['Healthcare', 'Telecom', 'Supply Chain'], recentActivity: '2026-01-15',
      associatedIOCs: 380, ttps: ['T1053', 'T1027', 'T1055', 'T1566'] },
    { id: 'TA-003', name: 'FIN7', aliases: ['Carbanak', 'Cobalt Goblin'], sophistication: 'advanced',
      targeting: ['Financial', 'Retail', 'Hospitality'], recentActivity: '2026-01-20',
      associatedIOCs: 520, ttps: ['T1566', 'T1059', 'T1003', 'T1083'] },
    { id: 'TA-004', name: 'Lazarus Group', aliases: ['Hidden Cobra', 'Zinc'], sophistication: 'advanced',
      targeting: ['Financial', 'Cryptocurrency', 'Defense'], recentActivity: '2026-01-22',
      associatedIOCs: 680, ttps: ['T1059', 'T1105', 'T1003', 'T1562'] },
  ] as any[];
  @state() private _intelKPIs = {
    detectionCoverage: 87.5, mtti: 4.2, iocEnrichmentRate: 94, threatIntelSharing: 12,
    proactiveHunts: 8, reactiveInvestigations: 23, blockedThreats: 1247, falsePositiveReduction: 15,
  } as any;

  private _calculateThreatLandscapeScore(): number {
    const feedHealth = this._intelFeedAggregation.feedHealth.filter(f => f.status === 'healthy').length;
    const feedScore = (feedHealth / this._intelFeedAggregation.feedHealth.length) * 40;
    const coverageScore = this._intelKPIs.detectionCoverage * 0.4;
    const enrichmentScore = this._intelKPIs.iocEnrichmentRate * 0.2;
    return Math.round(feedScore + coverageScore + enrichmentScore);
  }

  private _correlateEventsWithActors(events: any[]): any[] {
    const correlations: any[] = [];
    for (const actor of this._intelThreatActors) {
      const matchingEvents = events.filter(e => actor.ttps.some((t: string) => e.technique && e.technique.includes(t)));
      if (matchingEvents.length > 0) {
        correlations.push({ actor: actor.name, confidence: Math.min(95, matchingEvents.length * 15), eventCount: matchingEvents.length });
      }
    }
    return correlations.sort((a, b) => b.confidence - a.confidence);
  }

  private _assessFeedCoverage(): { gaps: string[]; recommendations: string[] } {
    const gaps: string[] = [];
    const recs: string[] = [];
    for (const feed of this._intelFeedAggregation.feedHealth) {
      if (feed.status === 'degraded') gaps.push(feed.name + ' is degraded - IOC freshness at risk');
      if (feed.status === 'maintenance') gaps.push(feed.name + ' is under maintenance');
    }
    if (this._intelKPIs.detectionCoverage < 90) recs.push('Add additional threat feeds to improve detection coverage');
    if (this._intelKPIs.mtti > 5) recs.push('Optimize IOC ingestion pipeline to reduce mean time to ingest');
    return { gaps, recommendations: recs };
  }

  private _calculateRuleEffectiveness(): any[] {
    return this._intelCorrelationRules.map(r => ({
      rule: r.name, matches: r.matchCount, falsePositiveRate: Math.round(r.fpRate * 100),
      effectiveness: r.matchCount > 0 ? Math.round((1 - r.fpRate) * 100) : 0,
      recommendation: r.fpRate > 0.1 ? 'Tune conditions to reduce false positives' : 'Operating within acceptable range',
    }));
  }

  private _generateWeeklyIntelBrief(): { summary: string; topThreats: string[]; actions: string[] } {
    const activeActors = this._intelThreatActors.filter(a => {
      const daysSinceActivity = (Date.now() - new Date(a.recentActivity).getTime()) / 86400000;
      return daysSinceActivity <= 14;
    });
    const topThreats = activeActors.map(a => a.name + ' (' + a.aliases[0] + ') - last active ' + a.recentActivity);
    const actions = [
      'Review and update correlation rules based on latest threat intelligence',
      'Investigate ' + this._intelKPIs.proactiveHunts + ' proactive hunt findings',
      'Tune ' + this._intelCorrelationRules.filter(r => r.fpRate > 0.1).length + ' rules with high false positive rates',
    ];
    return {
      summary: activeActors.length + ' threat actors active in the last 14 days. ' + this._intelKPIs.blockedThreats + ' threats blocked this week.',
      topThreats, actions,
    };
  }

  // === Security Posture Monitoring Extended Module ===
@state() private _spmNetworkSegment1 = { id: "NET-001", name: "Segment 1", subnet: "10.1.0.0/16", criticality: "high", deviceCount: 13, vulnerabilityCount: 3, lastScan: "2026-01-11" } as any;
@state() private _spmComplianceCheck2 = { id: "CHK-002", control: "Control 2", framework: "NIST 800-53", status: "pass", evidenceCount: 5, lastAudit: "2026-01-07", nextAudit: "2026-04-07", findings: 2 } as any;
@state() private _spmRiskRegister3 = { id: "RSK-003", title: "Risk Item 3", category: "operational", likelihood: 4, impact: "high", owner: "Security Team", status: "open", mitigation: "Implement compensating controls", targetDate: "2026-02-13" } as any;
  private _spmAnalyzeSegment3(): { riskLevel: string; recommendations: string[] } {
    const segment = this._spmNetworkSegment3;
    const vulnDensity = segment.vulnerabilityCount / Math.max(1, segment.deviceCount);
    const riskLevel = vulnDensity > 0.5 ? "critical" : vulnDensity > 0.2 ? "high" : vulnDensity > 0.1 ? "medium" : "low";
    const recommendations: string[] = [];
    if (vulnDensity > 0.2) recommendations.push("Prioritize patching for segment " + segment.name);
    if (segment.criticality === "high" && segment.vulnerabilityCount > 5) recommendations.push("Increase scan frequency for critical segment");
    if (segment.lastScan < "2026-01-15") recommendations.push("Schedule immediate scan - last scan overdue");
    return { riskLevel, recommendations };
  }

  // === Security Metrics Auto-Reporting Module ===
  private _reportSchedules: Array<{id: string; name: string; frequency: string; recipients: string[]; lastRun: string; nextRun: string; status: string; template: string; format: string}> = [];
  private _executiveSummaries: Array<{id: string; title: string; period: string; generatedAt: string; riskScore: number; keyMetrics: Array<{label: string; value: string; trend: string}>; highlights: string[]; concerns: string[]}> = [];
  private _trendAnalysis: Array<{metric: string; current: number; previous: number; delta: number; direction: string; period: string}> = [];
  private _reportTemplates: Array<{id: string; name: string; sections: string[]; isDefault: boolean; lastModified: string}> = [];
  private _deliveryTracking: Array<{reportId: string; reportName: string; sentAt: string; recipients: number; delivered: number; failed: number; opened: number}> = [];

  private _initMetricsReporting(): void {
    this._reportSchedules = [
      {id: 'sched-001', name: 'Daily Security Digest', frequency: 'daily', recipients: ['soc-team@company.com', 'ciso@company.com'], lastRun: '2024-12-16T08:00:00Z', nextRun: '2024-12-17T08:00:00Z', status: 'active', template: 'daily-digest', format: 'pdf'},
      {id: 'sched-002', name: 'Weekly Threat Landscape', frequency: 'weekly', recipients: ['security-team@company.com', 'exec-team@company.com'], lastRun: '2024-12-15T09:00:00Z', nextRun: '2024-12-22T09:00:00Z', status: 'active', template: 'weekly-threat', format: 'html'},
      {id: 'sched-003', name: 'Monthly Executive Report', frequency: 'monthly', recipients: ['board@company.com', 'ciso@company.com', 'cto@company.com'], lastRun: '2024-12-01T10:00:00Z', nextRun: '2025-01-01T10:00:00Z', status: 'active', template: 'executive-summary', format: 'pdf'},
      {id: 'sched-004', name: 'Quarterly Compliance Report', frequency: 'quarterly', recipients: ['compliance@company.com', 'legal@company.com', 'board@company.com'], lastRun: '2024-10-01T10:00:00Z', nextRun: '2025-01-01T10:00:00Z', status: 'active', template: 'compliance-report', format: 'pdf'},
      {id: 'sched-005', name: 'Incident Post-Mortem', frequency: 'on-demand', recipients: ['ir-team@company.com'], lastRun: '2024-12-14T14:00:00Z', nextRun: 'N/A', status: 'on-demand', template: 'post-mortem', format: 'docx'},
    ];
    this._executiveSummaries = [
      {id: 'exec-001', title: 'December 2024 Security Posture', period: '2024-12', generatedAt: '2024-12-16T10:00:00Z', riskScore: 72,
        keyMetrics: [
          {label: 'MTTR', value: '24 min', trend: 'down'},
          {label: 'MTTD', value: '3.2 min', trend: 'down'},
          {label: 'False Positive Rate', value: '4.2%', trend: 'down'},
          {label: 'Patch Compliance', value: '94%', trend: 'up'},
          {label: 'Critical Vulns Open', value: '3', trend: 'down'},
          {label: 'Phishing Click Rate', value: '2.1%', trend: 'down'},
        ],
        highlights: ['SOC achieved 99.7% uptime', 'Zero critical data breaches', 'Automated triage reduced analyst workload by 30%', 'Completed 15 penetration tests'],
        concerns: ['3 critical vulnerabilities past SLA', 'Night shift understaffed', 'Supply chain attack surface increasing', 'Zero-day response time needs improvement'],
      },
      {id: 'exec-002', title: 'Q4 2024 Security Quarterly', period: '2024-Q4', generatedAt: '2024-12-15T10:00:00Z', riskScore: 68,
        keyMetrics: [
          {label: 'Total Incidents', value: '847', trend: 'up'},
          {label: 'Critical Incidents', value: '12', trend: 'down'},
          {label: 'Mean Time to Contain', value: '4.2 hrs', trend: 'down'},
          {label: 'Vulnerability Backlog', value: '23', trend: 'down'},
          {label: 'Security Awareness Score', value: '87%', trend: 'up'},
          {label: 'Compliance Score', value: '96%', trend: 'up'},
        ],
        highlights: ['Reduced critical incidents by 25% QoQ', 'Deployed zero-trust architecture phase 2', 'Security awareness training completion: 95%', 'SOC maturity level improved to 3'],
        concerns: ['Cloud misconfiguration incidents increased 15%', 'Third-party vendor risk score elevated', 'Insider threat indicators detected in 3 cases'],
      },
    ];
    this._trendAnalysis = [
      {metric: 'Total Alerts', current: 12456, previous: 11234, delta: 10.9, direction: 'up', period: 'monthly'},
      {metric: 'False Positives', current: 523, previous: 612, delta: -14.5, direction: 'down', period: 'monthly'},
      {metric: 'Mean Resolution Time', current: 24, previous: 31, delta: -22.6, direction: 'down', period: 'monthly'},
      {metric: 'Escalation Rate', current: 8.5, previous: 11.2, delta: -24.1, direction: 'down', period: 'monthly'},
      {metric: 'Phishing Susceptibility', current: 2.1, previous: 3.8, delta: -44.7, direction: 'down', period: 'monthly'},
      {metric: 'Patch Compliance', current: 94, previous: 89, delta: 5.6, direction: 'up', period: 'monthly'},
      {metric: 'Endpoint Coverage', current: 98.2, previous: 97.1, delta: 1.1, direction: 'up', period: 'monthly'},
      {metric: 'MFA Adoption', current: 96, previous: 91, delta: 5.5, direction: 'up', period: 'monthly'},
    ];
    this._reportTemplates = [
      {id: 'tmpl-001', name: 'Daily Digest', sections: ['Alert Summary', 'Top Threats', 'Incident Status', 'Quick Stats'], isDefault: true, lastModified: '2024-11-01'},
      {id: 'tmpl-002', name: 'Weekly Threat', sections: ['Threat Landscape', 'New IOCs', 'Campaign Updates', 'Risk Assessment', 'Recommendations'], isDefault: true, lastModified: '2024-10-15'},
      {id: 'tmpl-003', name: 'Executive Summary', sections: ['Risk Score', 'KPI Dashboard', 'Trend Analysis', 'Budget Summary', 'Strategic Recommendations'], isDefault: true, lastModified: '2024-09-20'},
      {id: 'tmpl-004', name: 'Compliance Report', sections: ['Framework Status', 'Control Mapping', 'Gap Analysis', 'Remediation Progress', 'Audit Readiness'], isDefault: false, lastModified: '2024-12-01'},
    ];
    this._deliveryTracking = [
      {reportId: 'del-001', reportName: 'Daily Security Digest', sentAt: '2024-12-16T08:00:00Z', recipients: 12, delivered: 12, failed: 0, opened: 9},
      {reportId: 'del-002', reportName: 'Weekly Threat Landscape', sentAt: '2024-12-15T09:00:00Z', recipients: 25, delivered: 24, failed: 1, opened: 18},
      {reportId: 'del-003', reportName: 'Monthly Executive Report', sentAt: '2024-12-01T10:00:00Z', recipients: 8, delivered: 8, failed: 0, opened: 7},
      {reportId: 'del-004', reportName: 'Incident Post-Mortem INC-2840', sentAt: '2024-12-14T14:00:00Z', recipients: 6, delivered: 6, failed: 0, opened: 5},
    ];
  }

  private _renderReportSchedules(): ReturnType<typeof html> {
    return html`
      <div class="report-schedules-section">
        <div class="section-header">
          <h4>Report Schedules</h4>
        </div>
        <div class="schedules-list">
          ${this._reportSchedules.map(s => html`
            <div class="schedule-card status-${s.status}">
              <div class="schedule-header">
                <span class="schedule-name">${s.name}</span>
                <span class="schedule-freq">${s.frequency}</span>
              </div>
              <div class="schedule-details">
                <span>Template: ${s.template}</span>
                <span>Format: ${s.format}</span>
                <span>Recipients: ${s.recipients.length}</span>
              </div>
              <div class="schedule-timing">
                <span>Last: ${s.lastRun}</span>
                <span>Next: ${s.nextRun}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderExecutiveSummary(): ReturnType<typeof html> {
    return html`
      <div class="exec-summary-section">
        <div class="section-header">
          <h4>Executive Summary Auto-Generation</h4>
        </div>
        ${this._executiveSummaries.map(e => html`
          <div class="exec-card">
            <div class="exec-header">
              <span class="exec-title">${e.title}</span>
              <span class="exec-period">${e.period}</span>
              <span class="risk-score ${e.riskScore >= 80 ? 'critical' : e.riskScore >= 60 ? 'high' : 'medium'}">${e.riskScore}/100</span>
            </div>
            <div class="exec-metrics">
              ${e.keyMetrics.map(m => html`
                <div class="exec-metric">
                  <span class="metric-label">${m.label}</span>
                  <span class="metric-value">${m.value}</span>
                  <span class="metric-trend ${m.trend}">${m.trend === 'up' ? '\u2191' : '\u2193'}</span>
                </div>
              `)}
            </div>
            <div class="exec-highlights">
              <h5>Highlights</h5>
              <ul>${e.highlights.map(h => html`<li class="positive">${h}</li>`)}</ul>
            </div>
            <div class="exec-concerns">
              <h5>Concerns</h5>
              <ul>${e.concerns.map(c => html`<li class="negative">${c}</li>`)}</ul>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private _renderTrendAnalysis(): ReturnType<typeof html> {
    return html`
      <div class="trend-analysis-section">
        <div class="section-header">
          <h4>Trend Analysis with Deltas</h4>
        </div>
        <div class="trend-grid">
          ${this._trendAnalysis.map(t => html`
            <div class="trend-card ${t.direction}">
              <div class="trend-label">${t.metric}</div>
              <div class="trend-current">${typeof t.current === 'number' && t.current > 100 ? t.current.toLocaleString() : t.current}${typeof t.current === 'number' && t.current <= 100 && t.metric.includes('Rate') ? '%' : t.metric.includes('Coverage') || t.metric.includes('Adoption') || t.metric.includes('Compliance') || t.metric.includes('Score') ? '%' : ''}</div>
              <div class="trend-delta ${t.direction}">
                ${t.direction === 'up' ? '\u2191' : '\u2193'} ${Math.abs(t.delta).toFixed(1)}%
              </div>
              <div class="trend-period">${t.period}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderReportTemplates(): ReturnType<typeof html> {
    return html`
      <div class="report-templates-section">
        <div class="section-header">
          <h4>Report Templates</h4>
        </div>
        <div class="templates-grid">
          ${this._reportTemplates.map(t => html`
            <div class="template-card ${t.isDefault ? 'default' : 'custom'}">
              <div class="template-header">
                <span class="template-name">${t.name}</span>
                ${t.isDefault ? html`<span class="default-badge">Default</span>` : ''}
              </div>
              <div class="template-sections">
                ${t.sections.map(s => html`<span class="section-tag">${s}</span>`)}
              </div>
              <div class="template-meta">Last modified: ${t.lastModified}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderDeliveryTracking(): ReturnType<typeof html> {
    return html`
      <div class="delivery-tracking-section">
        <div class="section-header">
          <h4>Report Delivery Tracking</h4>
        </div>
        <div class="delivery-list">
          ${this._deliveryTracking.map(d => html`
            <div class="delivery-card ${d.failed > 0 ? 'has-failures' : 'all-delivered'}">
              <div class="delivery-header">
                <span class="delivery-name">${d.reportName}</span>
                <span class="delivery-time">${d.sentAt}</span>
              </div>
              <div class="delivery-stats">
                <span>Recipients: ${d.recipients}</span>
                <span class="delivered">Delivered: ${d.delivered}</span>
                ${d.failed > 0 ? html`<span class="failed">Failed: ${d.failed}</span>` : ''}
                <span>Opened: ${d.opened}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  // === Security Operations Center Analytics Module ===
  private _socShiftHandoffItems: Array<{id: string; category: string; description: string; status: string; assignedTo: string; priority: string; notes: string}> = [];
  private _socAnalystMetrics: Array<{analystId: string; name: string; ticketsResolved: number; avgResolutionMin: number; escalationRate: number; accuracy: number; shift: string; streak: number}> = [];
  private _socAlertVolumeHeatmap: Array<{hour: number; shift: string; critical: number; high: number; medium: number; low: number; total: number}> = [];
  private _socCapacityPlan: {analystsNeeded: number; analystsAvailable: number; coveragePercent: number; gapAnalysis: string[]; recommendedActions: string[]} = {analystsNeeded: 0, analystsAvailable: 0, coveragePercent: 0, gapAnalysis: [], recommendedActions: []};
  private _socEscalationPaths: Array<{level: number; name: string; criteria: string; contact: string; avgResponseMin: number; escalationRate: number}> = [];
  private _socShiftCalendar: Array<{date: string; shift: string; primaryAnalyst: string; secondaryAnalyst: string; backupAnalyst: string; status: string; notes: string}> = [];
  private _socIncidentBacklog: Array<{id: string; ageHours: number; severity: string; category: string; assignedTo: string; slaRemaining: number}> = [];
  private _socKpiTargets: {mttrTarget: number; mttdTarget: number; falsePositiveRate: number; escalationRate: number; coverageTarget: number} = {mttrTarget: 30, mttdTarget: 5, falsePositiveRate: 0.05, escalationRate: 0.1, coverageTarget: 0.95};

  private _initSocAnalytics(): void {
    this._socShiftHandoffItems = [
      {id: 'soh-001', category: 'Active Incident', description: 'APT lateral movement detected in finance subnet - investigation ongoing', status: 'in-progress', assignedTo: 'analyst-03', priority: 'critical', notes: 'Requires forensics team coordination by EOD'},
      {id: 'soh-002', category: 'Pending Escalation', description: 'Phishing campaign targeting executive staff - 12 payloads identified', status: 'pending', assignedTo: 'analyst-01', priority: 'high', notes: 'Block IoC set deployed, user notification pending'},
      {id: 'soh-003', category: 'Watch Item', description: 'Unusual DNS tunneling pattern from workstation WS-2847', status: 'monitoring', assignedTo: 'analyst-02', priority: 'medium', notes: 'Pattern consistent with data exfiltration tool - monitoring'},
      {id: 'soh-004', category: 'System Note', description: 'SIEM correlation rule update deployed - new detection for living-off-the-land', status: 'completed', assignedTo: 'analyst-04', priority: 'low', notes: 'Tune false positive rate over next 48 hours'},
      {id: 'soh-005', category: 'Active Incident', description: 'Ransomware encryption attempt blocked on file server FS-PROD-01', status: 'in-progress', assignedTo: 'analyst-05', priority: 'critical', notes: 'Isolated host, malware sample quarantined for analysis'},
      {id: 'soh-006', category: 'Pending Review', description: 'Vulnerability scan identified 3 critical CVEs in web application cluster', status: 'pending', assignedTo: 'analyst-01', priority: 'high', notes: 'CVE-2024-XXXX, CVE-2024-YYYY, CVE-2024-ZZZZ'},
      {id: 'soh-007', category: 'Compliance', description: 'Quarterly access review deadline in 5 business days', status: 'pending', assignedTo: 'analyst-03', priority: 'medium', notes: '42% complete, need to accelerate reviews'},
      {id: 'soh-008', category: 'Tooling', description: 'EDR agent upgrade scheduled for graveyard shift', status: 'scheduled', assignedTo: 'analyst-04', priority: 'low', notes: 'Coordinate with IT ops for maintenance window'},
    ];
    this._socAnalystMetrics = [
      {analystId: 'analyst-01', name: 'Sarah Chen', ticketsResolved: 47, avgResolutionMin: 22, escalationRate: 0.08, accuracy: 0.96, shift: 'Day', streak: 14},
      {analystId: 'analyst-02', name: 'Marcus Johnson', ticketsResolved: 39, avgResolutionMin: 28, escalationRate: 0.12, accuracy: 0.93, shift: 'Day', streak: 9},
      {analystId: 'analyst-03', name: 'Aisha Patel', ticketsResolved: 52, avgResolutionMin: 18, escalationRate: 0.06, accuracy: 0.98, shift: 'Swing', streak: 21},
      {analystId: 'analyst-04', name: 'Dmitri Volkov', ticketsResolved: 41, avgResolutionMin: 25, escalationRate: 0.10, accuracy: 0.94, shift: 'Swing', streak: 7},
      {analystId: 'analyst-05', name: 'Lisa Wong', ticketsResolved: 55, avgResolutionMin: 15, escalationRate: 0.04, accuracy: 0.99, shift: 'Night', streak: 18},
      {analystId: 'analyst-06', name: 'James Rodriguez', ticketsResolved: 33, avgResolutionMin: 32, escalationRate: 0.15, accuracy: 0.91, shift: 'Night', streak: 5},
    ];
    const shifts = ['Night', 'Night', 'Night', 'Night', 'Night', 'Night', 'Night', 'Night', 'Day', 'Day', 'Day', 'Day', 'Day', 'Day', 'Day', 'Day', 'Swing', 'Swing', 'Swing', 'Swing', 'Swing', 'Swing', 'Swing', 'Swing'];
    this._socAlertVolumeHeatmap = shifts.map((shift, hour) => {
      const base = shift === 'Day' ? 45 : shift === 'Swing' ? 32 : 18;
      const variance = Math.floor(Math.random() * 15) - 7;
      const total = Math.max(5, base + variance);
      return {
        hour: hour,
        shift: shift,
        critical: Math.floor(total * 0.08),
        high: Math.floor(total * 0.22),
        medium: Math.floor(total * 0.40),
        low: Math.floor(total * 0.30),
        total: total,
      };
    });
    this._socCapacityPlan = {
      analystsNeeded: 8,
      analystsAvailable: 6,
      coveragePercent: 75.0,
      gapAnalysis: ['Night shift under-staffed by 1 analyst', 'No backup for forensics specialization', 'Weekend coverage requires 2 additional analysts'],
      recommendedActions: ['Hire 2 Tier-2 analysts with forensics experience', 'Cross-train 3 existing analysts on IR procedures', 'Implement auto-triage to reduce analyst workload by 30%'],
    };
    this._socEscalationPaths = [
      {level: 1, name: 'Tier 1 Triage', criteria: 'All incoming alerts', contact: 'SOC Team Lead', avgResponseMin: 5, escalationRate: 0.35},
      {level: 2, name: 'Tier 2 Analysis', criteria: 'Confirmed threats, complex incidents', contact: 'Senior Analyst', avgResponseMin: 15, escalationRate: 0.12},
      {level: 3, name: 'IR Commander', criteria: 'Active breaches, data exfiltration', contact: 'CISO Office', avgResponseMin: 30, escalationRate: 0.03},
      {level: 4, name: 'Executive Notification', criteria: 'Critical incidents affecting operations', contact: 'CTO / CEO', avgResponseMin: 60, escalationRate: 0.005},
    ];
    this._socShiftCalendar = [
      {date: '2024-12-16', shift: 'Day', primaryAnalyst: 'Sarah Chen', secondaryAnalyst: 'Marcus Johnson', backupAnalyst: 'Aisha Patel', status: 'confirmed', notes: ''},
      {date: '2024-12-16', shift: 'Swing', primaryAnalyst: 'Aisha Patel', secondaryAnalyst: 'Dmitri Volkov', backupAnalyst: 'Lisa Wong', status: 'confirmed', notes: ''},
      {date: '2024-12-16', shift: 'Night', primaryAnalyst: 'Lisa Wong', secondaryAnalyst: 'James Rodriguez', backupAnalyst: 'Sarah Chen', status: 'confirmed', notes: 'James on probation - extra review'},
      {date: '2024-12-17', shift: 'Day', primaryAnalyst: 'Marcus Johnson', secondaryAnalyst: 'Sarah Chen', backupAnalyst: 'Dmitri Volkov', status: 'confirmed', notes: ''},
      {date: '2024-12-17', shift: 'Swing', primaryAnalyst: 'Dmitri Volkov', secondaryAnalyst: 'Lisa Wong', backupAnalyst: 'James Rodriguez', status: 'tentative', notes: 'Dmitri requested PTO - pending approval'},
      {date: '2024-12-17', shift: 'Night', primaryAnalyst: 'James Rodriguez', secondaryAnalyst: 'Aisha Patel', backupAnalyst: 'Marcus Johnson', status: 'confirmed', notes: ''},
    ];
    this._socIncidentBacklog = [
      {id: 'INC-2847', ageHours: 2, severity: 'critical', category: 'malware', assignedTo: 'analyst-05', slaRemaining: 58},
      {id: 'INC-2846', ageHours: 5, severity: 'high', category: 'phishing', assignedTo: 'analyst-01', slaRemaining: 115},
      {id: 'INC-2843', ageHours: 12, severity: 'medium', category: 'policy-violation', assignedTo: 'analyst-02', slaRemaining: 228},
      {id: 'INC-2840', ageHours: 18, severity: 'low', category: 'configuration', assignedTo: 'analyst-04', slaRemaining: 342},
      {id: 'INC-2838', ageHours: 24, severity: 'high', category: 'network', assignedTo: 'analyst-03', slaRemaining: 96},
    ];
  }

  private _renderSocShiftHandoff(): ReturnType<typeof html> {
    const pending = this._socShiftHandoffItems.filter(i => i.status !== 'completed');
    const critical = pending.filter(i => i.priority === 'critical');
    return html`
      <div class="soc-handoff-section">
        <div class="section-header">
          <h4>SOC Shift Handoff Checklist</h4>
          <span class="badge critical">${critical.length} Critical</span>
          <span class="badge info">${pending.length} Pending</span>
        </div>
        <div class="handoff-grid">
          ${pending.map(item => html`
            <div class="handoff-card priority-${item.priority}">
              <div class="handoff-header">
                <span class="handoff-id">${item.id}</span>
                <span class="handoff-category">${item.category}</span>
                <span class="priority-badge ${item.priority}">${item.priority}</span>
              </div>
              <p class="handoff-desc">${item.description}</p>
              <div class="handoff-meta">
                <span>Assigned: ${item.assignedTo}</span>
                <span>Status: ${item.status}</span>
              </div>
              ${item.notes ? html`<p class="handoff-notes">${item.notes}</p>` : ''}
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderSocAnalystMetrics(): ReturnType<typeof html> {
    const sorted = [...this._socAnalystMetrics].sort((a, b) => b.ticketsResolved - a.ticketsResolved);
    return html`
      <div class="soc-metrics-section">
        <div class="section-header">
          <h4>Analyst Performance Metrics</h4>
        </div>
        <div class="metrics-grid">
          ${sorted.map(a => html`
            <div class="analyst-card">
              <div class="analyst-header">
                <span class="analyst-name">${a.name}</span>
                <span class="analyst-shift">${a.shift} Shift</span>
              </div>
              <div class="metric-bar">
                <div class="metric-label">Resolved</div>
                <div class="metric-value">${a.ticketsResolved}</div>
              </div>
              <div class="metric-bar">
                <div class="metric-label">Avg Resolution</div>
                <div class="metric-value">${a.avgResolutionMin} min</div>
              </div>
              <div class="metric-bar">
                <div class="metric-label">Escalation Rate</div>
                <div class="metric-value">${(a.escalationRate * 100).toFixed(1)}%</div>
              </div>
              <div class="metric-bar">
                <div class="metric-label">Accuracy</div>
                <div class="metric-value">${(a.accuracy * 100).toFixed(1)}%</div>
              </div>
              <div class="analyst-streak">${a.streak} day streak</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderSocAlertHeatmap(): ReturnType<typeof html> {
    return html`
      <div class="soc-heatmap-section">
        <div class="section-header">
          <h4>Alert Volume by Hour/Shift</h4>
        </div>
        <div class="heatmap-grid">
          ${this._socAlertVolumeHeatmap.map(h => html`
            <div class="heatmap-cell shift-${h.shift.toLowerCase()}" style="--intensity: ${h.total / 60}" title="Hour ${h.hour}: ${h.total} alerts (C:${h.critical} H:${h.high} M:${h.medium} L:${h.low})">
              <span class="heatmap-hour">${String(h.hour).padStart(2, '0')}</span>
              <span class="heatmap-total">${h.total}</span>
            </div>
          `)}
        </div>
        <div class="heatmap-legend">
          <span class="legend-item night">Night (22-06)</span>
          <span class="legend-item day">Day (06-14)</span>
          <span class="legend-item swing">Swing (14-22)</span>
        </div>
      </div>
    `;
  }

  private _renderSocCapacity(): ReturnType<typeof html> {
    const gap = this._socCapacityPlan.analystsNeeded - this._socCapacityPlan.analystsAvailable;
    return html`
      <div class="soc-capacity-section">
        <div class="section-header">
          <h4>SOC Capacity Planning</h4>
          <span class="badge ${gap > 0 ? 'warning' : 'success'}">${gap > 0 ? gap + ' Short' : 'Fully Staffed'}</span>
        </div>
        <div class="capacity-overview">
          <div class="capacity-stat">
            <span class="stat-value">${this._socCapacityPlan.analystsAvailable}</span>
            <span class="stat-label">Available</span>
          </div>
          <div class="capacity-stat">
            <span class="stat-value">${this._socCapacityPlan.analystsNeeded}</span>
            <span class="stat-label">Needed</span>
          </div>
          <div class="capacity-stat">
            <span class="stat-value">${this._socCapacityPlan.coveragePercent}%</span>
            <span class="stat-label">Coverage</span>
          </div>
        </div>
        <div class="capacity-gaps">
          <h5>Gap Analysis</h5>
          <ul>${this._socCapacityPlan.gapAnalysis.map(g => html`<li>${g}</li>`)}</ul>
        </div>
        <div class="capacity-actions">
          <h5>Recommended Actions</h5>
          <ul>${this._socCapacityPlan.recommendedActions.map(a => html`<li>${a}</li>`)}</ul>
        </div>
      </div>
    `;
  }

  private _renderSocEscalation(): ReturnType<typeof html> {
    return html`
      <div class="soc-escalation-section">
        <div class="section-header">
          <h4>Escalation Path Visualization</h4>
        </div>
        <div class="escalation-chain">
          ${this._socEscalationPaths.map((ep, i) => html`
            <div class="escalation-level level-${ep.level}">
              <div class="level-header">
                <span class="level-number">L${ep.level}</span>
                <span class="level-name">${ep.name}</span>
              </div>
              <div class="level-details">
                <p><strong>Criteria:</strong> ${ep.criteria}</p>
                <p><strong>Contact:</strong> ${ep.contact}</p>
                <p><strong>Avg Response:</strong> ${ep.avgResponseMin} min</p>
                <p><strong>Escalation Rate:</strong> ${(ep.escalationRate * 100).toFixed(1)}%</p>
              </div>
              ${i < this._socEscalationPaths.length - 1 ? html`<div class="escalation-arrow">\u2193</div>` : ''}
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderSocShiftCalendar(): ReturnType<typeof html> {
    return html`
      <div class="soc-calendar-section">
        <div class="section-header">
          <h4>Shift Coverage Calendar</h4>
        </div>
        <div class="calendar-grid">
          ${this._socShiftCalendar.map(s => html`
            <div class="calendar-entry status-${s.status}">
              <div class="cal-date">${s.date}</div>
              <div class="cal-shift">${s.shift}</div>
              <div class="cal-primary">${s.primaryAnalyst}</div>
              <div class="cal-secondary">+${s.secondaryAnalyst}</div>
              ${s.notes ? html`<div class="cal-notes">${s.notes}</div>` : ''}
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderSocIncidentBacklog(): ReturnType<typeof html> {
    const sorted = [...this._socIncidentBacklog].sort((a, b) => a.slaRemaining - b.slaRemaining);
    return html`
      <div class="soc-backlog-section">
        <div class="section-header">
          <h4>Incident Backlog</h4>
        </div>
        <div class="backlog-list">
          ${sorted.map(inc => html`
            <div class="backlog-item severity-${inc.severity}">
              <span class="backlog-id">${inc.id}</span>
              <span class="backlog-age">${inc.ageHours}h old</span>
              <span class="backlog-category">${inc.category}</span>
              <span class="backlog-analyst">${inc.assignedTo}</span>
              <span class="backlog-sla ${inc.slaRemaining < 60 ? 'warning' : ''}">${inc.slaRemaining}m SLA</span>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderSocKpiTargets(): ReturnType<typeof html> {
    return html`
      <div class="soc-kpi-section">
        <div class="section-header">
          <h4>SOC KPI Targets vs Actual</h4>
        </div>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">MTTR Target</div>
            <div class="kpi-value">${this._socKpiTargets.mttrTarget} min</div>
            <div class="kpi-actual">Actual: 24 min</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">MTTD Target</div>
            <div class="kpi-value">${this._socKpiTargets.mttdTarget} min</div>
            <div class="kpi-actual">Actual: 3.2 min</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">False Positive Rate</div>
            <div class="kpi-value">${(this._socKpiTargets.falsePositiveRate * 100).toFixed(1)}%</div>
            <div class="kpi-actual">Actual: 4.2%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Escalation Rate</div>
            <div class="kpi-value">${(this._socKpiTargets.escalationRate * 100).toFixed(1)}%</div>
            <div class="kpi-actual">Actual: 8.5%</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Coverage Target</div>
            <div class="kpi-value">${(this._socKpiTargets.coverageTarget * 100).toFixed(0)}%</div>
            <div class="kpi-actual">Actual: 87%</div>
          </div>
        </div>
      </div>
    `;
  }






  // === Security Event Correlation Block ===
  @state() private _darkSimEnginCorrRules: Array<{id:string;name:string;sources:string[];logic:string;severity:string;active:boolean;lastTriggered:string}> = [
    {id:"CR01",name:"Brute Force Detection",sources:["AD","Firewall","SIEM"],logic:"5 failed logins + firewall block within 10min",severity:"High",active:true,lastTriggered:"2026-04-22T08:30:00Z"},
    {id:"CR02",name:"Data Exfiltration Pattern",sources:["DLP","Proxy","DNS"],logic:"Large upload + DNS tunneling indicators",severity:"Critical",active:true,lastTriggered:"2026-04-21T14:22:00Z"},
    {id:"CR03",name:"Lateral Movement Detection",sources:["EDR","AD","Network"],logic:"New admin session + unusual SMB traffic",severity:"High",active:true,lastTriggered:"2026-04-20T11:15:00Z"},
    {id:"CR04",name:"Malware Beacon Detection",sources:["DNS","Proxy","EDR"],logic:"Periodic DNS queries + known C2 patterns",severity:"Critical",active:true,lastTriggered:"2026-04-22T06:45:00Z"},
  ];
  @state() private _darkSimEnginEventTimeline: Array<{timestamp:string;source:string;eventType:string;details:string;correlated:boolean}> = [
    {timestamp:"2026-04-22T10:34:12Z",source:"EDR",eventType:"Process Injection",details:"cmd.exe spawned from powershell",correlated:true},
    {timestamp:"2026-04-22T10:33:58Z",source:"AD",eventType:"Anomalous Login",details:"Service account used from new IP",correlated:true},
    {timestamp:"2026-04-22T10:32:01Z",source:"Firewall",eventType:"Port Scan",details:"192.168.1.45 scanning 10.0.0.0/8",correlated:false},
    {timestamp:"2026-04-22T10:30:45Z",source:"DLP",eventType:"Data Transfer",details:"10MB zip uploaded to external share",correlated:true},
    {timestamp:"2026-04-22T10:28:33Z",source:"DNS",eventType:"Suspicious Query",details:"Query to known malicious domain",correlated:true},
  ];
  @state() private _darkSimEnginFalsePosMetrics: {totalEvents:number;correlatedEvents:number;falsePositives:number;fpRate:number;topFpRules:string[]} = {
    totalEvents: 45230, correlatedEvents: 3847, falsePositives: 892, fpRate: 0.232,
    topFpRules: ["Port Scan Detection", "Anomalous Login Location", "Large File Download"]
  };
  @state() private _darkSimEnginEventPatterns: Array<{id:string;pattern:string;frequency:number;firstSeen:string;lastSeen:string;status:string}> = [
    {id:"EP01",pattern:"Credential stuffing from Tor exit nodes",frequency:23,firstSeen:"2026-03-15",lastSeen:"2026-04-22",status:"Active"},
    {id:"EP02",pattern:"DNS tunneling via TXT records",frequency:8,firstSeen:"2026-04-01",lastSeen:"2026-04-20",status:"Monitoring"},
    {id:"EP03",pattern:"Scheduled task persistence mechanism",frequency:3,firstSeen:"2026-04-10",lastSeen:"2026-04-18",status:"Investigating"},
  ];
  private _renderDarksimenginEventCorr(): TemplateResult {
    const rules = this._darkSimEnginCorrRules;
    const timeline = this._darkSimEnginEventTimeline;
    const fpMetrics = this._darkSimEnginFalsePosMetrics;
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
  @state() private _darkSimEnginZones: Array<{id:string;name:string;trustLevel:number;subnet:string;devices:number;policy:string;lastAudit:string}> = [
    {id:"Z01",name:"DMZ",trustLevel:1,subnet:"10.0.1.0/24",devices:23,policy:"Deny All Inbound",lastAudit:"2026-04-20"},
    {id:"Z02",name:"Corporate LAN",trustLevel:3,subnet:"10.0.2.0/22",devices:456,policy:"Allow Internal",lastAudit:"2026-04-18"},
    {id:"Z03",name:"Data Center Core",trustLevel:5,subnet:"10.0.10.0/24",devices:89,policy:"Restricted Access",lastAudit:"2026-04-22"},
    {id:"Z04",name:"IoT Network",trustLevel:1,subnet:"10.0.20.0/24",devices:312,policy:"Deny All Internet",lastAudit:"2026-04-15"},
    {id:"Z05",name:"Development",trustLevel:2,subnet:"10.0.30.0/24",devices:67,policy:"Sandbox Rules",lastAudit:"2026-04-19"},
    {id:"Z06",name:"Management Plane",trustLevel:5,subnet:"10.0.99.0/24",devices:12,policy:"MFA Required",lastAudit:"2026-04-21"},
  ];
  @state() private _darkSimEnginSegRules: Array<{id:string;source:string;dest:string;action:string;protocol:string;port:string;status:string;hits:number}> = [
    {id:"SR01",source:"DMZ",dest:"Corporate LAN",action:"DENY",protocol:"TCP",port:"*",status:"Active",hits:14523},
    {id:"SR02",source:"Corporate LAN",dest:"Data Center Core",action:"ALLOW",protocol:"TCP",port:"443,8443",status:"Active",hits:89234},
    {id:"SR03",source:"IoT Network",dest:"Internet",action:"DENY",protocol:"*",port:"*",status:"Active",hits:234567},
    {id:"SR04",source:"Development",dest:"Corporate LAN",action:"DENY",protocol:"*",port:"*",status:"Active",hits:789},
    {id:"SR05",source:"Corporate LAN",dest:"Management Plane",action:"ALLOW",protocol:"TCP",port:"22,443",status:"Active",hits:3456},
  ];
  @state() private _darkSimEnginCrossZoneTraffic: Array<{source:string;dest:string;bytes:number;sessions:number;violations:number}> = [
    {source:"DMZ",dest:"Corporate LAN",bytes:4567890,sessions:234,violations:12},
    {source:"Corporate LAN",dest:"Data Center Core",bytes:123456789,sessions:5678,violations:3},
    {source:"IoT Network",dest:"Corporate LAN",bytes:890123,sessions:89,violations:45},
    {source:"Development",dest:"Internet",bytes:67890123,sessions:3456,violations:0},
  ];
  @state() private _darkSimEnginMicroSegGaps: Array<{id:string;zone:string;gapType:string;severity:string;recommendation:string}> = [
    {id:"MSG01",zone:"IoT Network",gapType:"Missing East-West Controls",severity:"High",recommendation:"Implement micro-segmentation with service mesh"},
    {id:"MSG02",zone:"Corporate LAN",gapType:"Flat Network Subnet",severity:"Critical",recommendation:"Split into VLANs by department"},
    {id:"MSG03",zone:"Development",gapType:"No Egress Filtering",severity:"Medium",recommendation:"Deploy proxy-based egress controls"},
  ];
  private _renderDarksimenginNetworkSeg(): TemplateResult {
    const zones = this._darkSimEnginZones;
    const gaps = this._darkSimEnginMicroSegGaps;
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
  @state() private _darkSimEnginContainerScans: Array<{image:string;registry:string;critical:number;high:number;medium:number;scanDate:string;status:string}> = [
    {image:"nginx:1.25",registry:"docker.io",critical:2,high:5,medium:12,scanDate:"2026-04-22",status:"Vulnerable"},
    {image:"postgres:16",registry:"ghcr.io",critical:0,high:1,medium:3,scanDate:"2026-04-22",status:"Clean"},
    {image:"redis:7.2",registry:"docker.io",critical:1,high:3,medium:8,scanDate:"2026-04-21",status:"Vulnerable"},
    {image:"app-server:v2.3",registry:"ecr.aws",critical:0,high:0,medium:2,scanDate:"2026-04-22",status:"Clean"},
    {image:"sidecar-proxy:v1.8",registry:"gcr.io",critical:3,high:7,medium:15,scanDate:"2026-04-20",status:"Critical"},
  ];
  @state() private _darkSimEnginK8sPods: Array<{namespace:string;pod:string;securityContext:string;hostIPC:boolean;hostPID:boolean;privileged:boolean;riskLevel:string}> = [
    {namespace:"production",pod:"web-frontend-7d9f8",securityContext:"Restricted",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Low"},
    {namespace:"production",pod:"api-gateway-4b2c1",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
    {namespace:"staging",pod:"db-migrator-x8k3m",securityContext:"Privileged",hostIPC:true,hostPID:false,privileged:true,riskLevel:"Critical"},
    {namespace:"monitoring",pod:"prometheus-q7r2p",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
  ];
  @state() private _darkSimEnginServerlessRisk: Array<{function:string;runtime:string;timeout:number;iamPerms:string;externalCalls:number;riskScore:number}> = [
    {function:"processPayment",runtime:"nodejs20.x",timeout:30,iamPerms:"dynamodb:*",externalCalls:3,riskScore:78},
    {function:"sendNotification",runtime:"python3.12",timeout:15,iamPerms:"sns:Publish",externalCalls:1,riskScore:25},
    {function:"imageResizer",runtime:"python3.12",timeout:60,iamPerms:"s3:*",externalCalls:0,riskScore:45},
    {function:"authValidator",runtime:"go1.x",timeout:10,iamPerms:"cognito-idp:*",externalCalls:2,riskScore:62},
  ];
  @state() private _darkSimEnginRuntimeAlerts: Array<{id:string;workload:string;alertType:string;severity:string;description:string;timestamp:string}> = [
    {id:"RTA01",workload:"db-migrator-x8k3m",alertType:"Privilege Escalation",severity:"Critical",description:"Container attempted to access /etc/shadow",timestamp:"2026-04-22T10:34:00Z"},
    {id:"RTA02",workload:"web-frontend-7d9f8",alertType:"Anomalous Outbound",severity:"High",description:"Unexpected DNS query to known C2 domain",timestamp:"2026-04-22T09:12:00Z"},
    {id:"RTA03",workload:"sidecar-proxy:v1.8",alertType:"Crypto Mining",severity:"Critical",description:"CPU utilization exceeded 95% for 30 minutes",timestamp:"2026-04-21T23:45:00Z"},
  ];
  private _renderDarksimenginCloudWl(): TemplateResult {
    const containers = this._darkSimEnginContainerScans;
    const pods = this._darkSimEnginK8sPods;
    const alerts = this._darkSimEnginRuntimeAlerts;
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

  // === Security Training Platform Block ===
  @state() private _darkSimEnginCourses: Array<{id:string;title:string;category:string;duration:number;enrolled:number;completed:number;difficulty:string;rating:number}> = [
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
  @state() private _darkSimEnginLearningPaths: Array<{id:string;name:string;courseIds:string[];progress:number;enrolled:number}> = [
    {id:"LP01",name:"Security Analyst Fundamentals",courseIds:["C001","C004","C007"],progress:72,enrolled:156},
    {id:"LP02",name:"DevSecOps Engineer",courseIds:["C001","C002","C008","C012"],progress:45,enrolled:78},
    {id:"LP03",name:"Cloud Security Specialist",courseIds:["C003","C006","C009"],progress:58,enrolled:89},
    {id:"LP04",name:"Advanced Penetration Tester",courseIds:["C010","C002","C005"],progress:33,enrolled:45},
  ];
  @state() private _darkSimEnginDeptCompliance: Array<{dept:string;trainedPct:number;targetPct:number;avgScore:number;certCount:number}> = [
    {dept:"Engineering",trainedPct:88,targetPct:95,avgScore:82,certCount:34},
    {dept:"Operations",trainedPct:92,targetPct:95,avgScore:87,certCount:28},
    {dept:"Finance",trainedPct:78,targetPct:90,avgScore:74,certCount:12},
    {dept:"HR",trainedPct:85,targetPct:90,avgScore:79,certCount:8},
    {dept:"Legal",trainedPct:71,targetPct:85,avgScore:71,certCount:6},
  ];
  @state() private _darkSimEnginSkillsGaps: Array<{skill:string;current:number;required:number;gap:number;priority:string}> = [
    {skill:"Cloud Security",current:62,required:85,gap:23,priority:"High"},
    {skill:"Threat Hunting",current:55,required:80,gap:25,priority:"High"},
    {skill:"Incident Response",current:70,required:85,gap:15,priority:"Medium"},
    {skill:"Secure Coding",current:75,required:90,gap:15,priority:"Medium"},
    {skill:"Forensics",current:45,required:75,gap:30,priority:"Critical"},
  ];
  private _renderDarksimenginTraining(): TemplateResult {
    const courses = this._darkSimEnginCourses;
    const deptComp = this._darkSimEnginDeptCompliance;
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
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Dark Sim Engine Findings Grid</span>
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
  @state() private _darScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _darScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _darScenarioCompare: boolean = false;
  @state() private _darScenarioSelected: string[] = [];

  private _darInitScenarios(): void {
    const saved = localStorage.getItem('dar_scenarios');
    if (saved) { try { this._darScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._darScenarios.length === 0) {
      this._darScenarios = [
        {id:'dar-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'dar-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'dar-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _darSaveScenarios(): void {
    localStorage.setItem('dar_scenarios', JSON.stringify(this._darScenarios));
  }

  private _darAddScenario(): void {
    const f = this._darScenarioForm;
    if (!f.attackType || !f.target) return;
    this._darScenarios = [...this._darScenarios, {
      id: 'dar-s' + (this._darScenarios.length + 1),
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
    this._darScenarioForm = {attackType:'',target:'',method:''};
    this._darSaveScenarios();
  }

  private _darRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._darScenarioCompare = !this._darScenarioCompare; }}>${this._darScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._darScenarioForm = {...this._darScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._darScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._darScenarioForm = {...this._darScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._darScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._darScenarioForm = {...this._darScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._darScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._darAddScenario}>Run Simulation</button>
      </div>
      ${this._darScenarioCompare && this._darScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._darScenarios.length)},1fr);gap:8px">
            ${this._darScenarios.slice(0,3).map(s => html`
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
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._darScenarios.length})</div>
        ${this._darScenarios.map(s => html`
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
  @state() private _darTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _darTrendZoom: {start:number;end:number} | null = null;
  @state() private _darTrendMA: number = 7;

  private _darInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._darTrendData = data;
  }

  private _darCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._darTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._darTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _darGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._darTrendData.map(d => d.value);
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

  private _darRenderTimeSeries(): any {
    const stats = this._darGetStats();
    const filtered = this._darTrendZoom ? this._darTrendData.filter(d => d.day >= this._darTrendZoom.start && d.day <= this._darTrendZoom.end) : this._darTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._darTrendMA === 7 ? 'active' : ''}" @click=${() => { this._darTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._darTrendMA === 30 ? 'active' : ''}" @click=${() => { this._darTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._darTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._darTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
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
  @state() private _darRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _darActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _darPermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _darPermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _darPermCompare: string[] = [];

  private _darInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._darRoles) {
      perms[role] = {};
      this._darActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._darPermissions = perms;
  }

  private _darTogglePermission(role: string, action: string): void {
    const old = this._darPermissions[role][action];
    this._darPermissions = {...this._darPermissions, [role]: {...this._darPermissions[role], [action]: !old}};
    this._darPermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _darRenderRBAC(): any {
    const compareRoles = this._darPermCompare.map(r => this._darPermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._darRoles.map(r => html`
              <button class="tab ${this._darPermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._darPermCompare = this._darPermCompare.includes(r) ? this._darPermCompare.filter(x => x !== r) : [...this._darPermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._darActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._darRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._darActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._darPermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._darTogglePermission(role, action)}>${this._darPermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._darPermCompare.join(' vs ')}</div>
            ${this._darActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._darPermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._darPermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._darPermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _darReportTemplate: string = 'executive';
  @state() private _darReportSchedule: string = 'weekly';
  @state() private _darReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _darReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _darGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._darReportHistory.unshift({id,template:this._darReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _darRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._darReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._darReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._darReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._darReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._darReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._darReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._darGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._darReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._darReportHistory.slice(0,3).map(r => html`
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
  @state() private _darHighContrast: boolean = false;
  @state() private _darA11yAnnounce: string = '';
  @state() private _darShortcutsVisible: boolean = false;
  @state() private _darFocusTrap: boolean = false;

  private _darShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _darHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._darFocusTrap) { this._darFocusTrap = false; this._darAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._darHighContrast = !this._darHighContrast; this._darAnnounce('High contrast ' + (this._darHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._darShortcutsVisible = !this._darShortcutsVisible; }
  }

  private _darAnnounce(msg: string): void {
    this._darA11yAnnounce = msg;
    setTimeout(() => { this._darA11yAnnounce = ''; }, 2000);
  }

  private _darRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._darShortcutsVisible ? 'active' : ''}" @click=${() => { this._darShortcutsVisible = !this._darShortcutsVisible; }} aria-expanded=${this._darShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._darHighContrast} @change=${() => { this._darHighContrast = !this._darHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._darShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._darShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._darA11yAnnounce}</div>
      </div>
    `;
  }


  
  // === MACHINE LEARNING FEATURES ===
  @state() private _darMlActiveView: string = 'importance';
  @state() private _darMlModelVersion: string = 'v3.2.1';
  @state() private _darMlFeatureImportance: {name:string;importance:number;color:string}[] = [];
  @state() private _darMlMetrics: {accuracy:number;precision:number;recall:number;f1:number;auc:number} = {accuracy:0.945,precision:0.931,recall:0.952,f1:0.941,auc:0.973};
  @state() private _darMlConfusionMatrix: number[][] = [];
  @state() private _darMlTrainingHistory: {epoch:number;loss:number;valLoss:number;accuracy:number;valAccuracy:number}[] = [];
  @state() private _darMlConfidenceBins: {range:string;count:number;color:string}[] = [];
  @state() private _darMlVersionHistory: {version:string;date:string;accuracy:number;f1:number;notes:string}[] = [];
  @state() private _darMlSelectedVersion: string = 'v3.2.1';

  private _darInitMlData(): void {
    this._darMlFeatureImportance = [
      {name:'Request Rate',importance:0.234,color:'#f97316'},
      {name:'Payload Size',importance:0.198,color:'#3b82f6'},
      {name:'Time of Day',importance:0.167,color:'#8b5cf6'},
      {name:'Source IP Reputation',importance:0.145,color:'#10b981'},
      {name:'User Behavior Score',importance:0.112,color:'#ef4444'},
      {name:'Endpoint Type',importance:0.089,color:'#06b6d4'},
      {name:'Protocol Anomaly',importance:0.055,color:'#f59e0b'},
    ];
    this._darMlConfusionMatrix = [
      [142, 3, 1],
      [2, 98, 4],
      [0, 5, 45],
    ];
    this._darMlTrainingHistory = Array.from({length:20}, (_,i) => ({
      epoch: i+1,
      loss: Math.max(0.02, 0.8 * Math.exp(-0.15*i) + 0.02 + Math.random()*0.01),
      valLoss: Math.max(0.03, 0.85 * Math.exp(-0.14*i) + 0.03 + Math.random()*0.015),
      accuracy: Math.min(0.99, 0.6 + 0.39 * (1 - Math.exp(-0.18*i)) + Math.random()*0.005),
      valAccuracy: Math.min(0.98, 0.58 + 0.38 * (1 - Math.exp(-0.16*i)) + Math.random()*0.008),
    }));
    this._darMlConfidenceBins = [
      {range:'0-10%',count:12,color:'#ef4444'},
      {range:'10-30%',count:34,color:'#f97316'},
      {range:'30-50%',count:67,color:'#f59e0b'},
      {range:'50-70%',count:128,color:'#eab308'},
      {range:'70-90%',count:245,color:'#22c55e'},
      {range:'90-100%',count:514,color:'#10b981'},
    ];
    this._darMlVersionHistory = [
      {version:'v1.0.0',date:'2025-01-15',accuracy:0.812,f1:0.789,notes:'Initial model with basic features'},
      {version:'v2.0.0',date:'2025-04-20',accuracy:0.887,f1:0.874,notes:'Added behavioral analysis features'},
      {version:'v2.5.0',date:'2025-08-10',accuracy:0.912,f1:0.901,notes:'Improved temporal pattern detection'},
      {version:'v3.0.0',date:'2025-11-30',accuracy:0.931,f1:0.922,notes:'Neural network architecture upgrade'},
      {version:'v3.2.1',date:'2026-03-15',accuracy:0.945,f1:0.941,notes:'Fine-tuned on recent threat data'},
    ];
  }

  private _darRenderMlFeatures(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Machine Learning Features">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Machine Learning Analysis</span>
          <div style="display:flex;gap:4px">
            ${['importance','metrics','matrix','training','confidence','versions'].map(v => html`
              <button class="tab ${this._darMlActiveView === v ? 'active' : ''}" @click=${() => { this._darMlActiveView = v; }}>${v.charAt(0).toUpperCase() + v.slice(1)}</button>
            `)}
          </div>
        </div>
        ${this._darMlActiveView === 'importance' ? this._darRenderFeatureImportance() : nothing}
        ${this._darMlActiveView === 'metrics' ? this._darRenderModelMetrics() : nothing}
        ${this._darMlActiveView === 'matrix' ? this._darRenderConfusionMatrix() : nothing}
        ${this._darMlActiveView === 'training' ? this._darRenderTrainingHistory() : nothing}
        ${this._darMlActiveView === 'confidence' ? this._darRenderConfidenceDist() : nothing}
        ${this._darMlActiveView === 'versions' ? this._darRenderVersionHistory() : nothing}
      </div>
    `;
  }

  private _darRenderFeatureImportance(): any {
    const maxImp = Math.max(...this._darMlFeatureImportance.map(f => f.importance));
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Feature Importance Ranking (Model ${this._darMlModelVersion})</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${this._darMlFeatureImportance.map((f, i) => html`
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:18px;font-size:10px;color:#6b7280;text-align:right">${i+1}</span>
            <span style="width:140px;font-size:11px;color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${f.name}</span>
            <div style="flex:1;height:20px;background:#1a1d2e;border-radius:4px;overflow:hidden;position:relative">
              <div style="height:100%;width:${(f.importance/maxImp*100).toFixed(1)}%;background:${f.color};border-radius:4px;transition:width 0.3s"></div>
            </div>
            <span style="width:50px;font-size:10px;color:#9ca3af;text-align:right">${(f.importance*100).toFixed(1)}%</span>
          </div>
        `)}
      </div>
    `;
  }

  private _darRenderModelMetrics(): any {
    const m = this._darMlMetrics;
    const metrics = [
      {label:'Accuracy',value:m.accuracy,color:'#10b981'},
      {label:'Precision',value:m.precision,color:'#3b82f6'},
      {label:'Recall',value:m.recall,color:'#8b5cf6'},
      {label:'F1 Score',value:m.f1,color:'#f97316'},
      {label:'AUC-ROC',value:m.auc,color:'#06b6d4'},
    ];
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Model Performance Metrics</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
        ${metrics.map(mt => html`
          <div style="background:#1a1d2e;border-radius:8px;padding:12px;text-align:center;border-left:3px solid ${mt.color}">
            <div style="font-size:22px;font-weight:700;color:${mt.color}">${(mt.value*100).toFixed(1)}%</div>
            <div style="font-size:11px;color:#9ca3af;margin-top:4px">${mt.label}</div>
            <div style="margin-top:6px;height:4px;background:#0f1117;border-radius:2px">
              <div style="height:100%;width:${(mt.value*100).toFixed(0)}%;background:${mt.color};border-radius:2px"></div>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private _darRenderConfusionMatrix(): any {
    const labels = ['Benign','Suspicious','Malicious'];
    const cm = this._darMlConfusionMatrix;
    const total = cm.flat().reduce((a,b)=>a+b,0);
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Confusion Matrix (3x3 Classification)</div>
      <div style="display:inline-grid;grid-template-columns:60px repeat(3,1fr);gap:2px;font-size:11px">
        <div></div>
        ${labels.map(l => html`<div style="text-align:center;color:#9ca3af;font-weight:600;padding:4px">${l}</div>`)}
        ${cm.map((row,ri) => html`
          <div style="display:flex;align-items:center;color:#9ca3af;font-weight:600;padding-right:8px">${labels[ri]}</div>
          ${row.map((val,ci) => {
            const intensity = val / Math.max(...cm.flat());
            const bgColor = ri === ci ? 'rgba(16,185,129,' + (0.2 + intensity*0.6) + ')' : 'rgba(239,68,68,' + (0.15 + intensity*0.5) + ')';
            return html`<div style="background:${bgColor};text-align:center;padding:10px 4px;border-radius:4px;color:#e2e8f0;font-weight:600">${val}<div style="font-size:9px;color:#9ca3af;font-weight:400">${(val/total*100).toFixed(1)}%</div></div>`;
          })}
        `)}
      </div>
    `;
  }

  private _darRenderTrainingHistory(): any {
    const data = this._darMlTrainingHistory;
    const maxEpoch = data.length;
    const maxLoss = Math.max(...data.map(d => Math.max(d.loss, d.valLoss)));
    const w = 400, h = 160;
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Training History: Loss & Accuracy Curves</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="background:#1a1d2e;border-radius:6px;padding:8px">
          <div style="font-size:10px;color:#9ca3af;margin-bottom:4px;text-align:center">Loss Curves</div>
          <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto">
            ${data.map((d,i) => {
              const x1 = (i/maxEpoch*w).toFixed(1);
              const x2 = ((i+1)/maxEpoch*w).toFixed(1);
              const y1l = (h - d.loss/maxLoss*h*0.9 - 10).toFixed(1);
              const y2l = (h - data[i+1]?.loss/maxLoss*h*0.9 - 10 || h - 10).toFixed(1);
              const y1v = (h - d.valLoss/maxLoss*h*0.9 - 10).toFixed(1);
              const y2v = (h - data[i+1]?.valLoss/maxLoss*h*0.9 - 10 || h - 10).toFixed(1);
              if (i < data.length - 1) return html`<line x1=${x1} y1=${y1l} x2=${x2} y2=${y2l} stroke="#3b82f6" stroke-width="1.5"/><line x1=${x1} y1=${y1v} x2=${x2} y2=${y2v} stroke="#f97316" stroke-width="1.5" stroke-dasharray="4"/>`;
              return nothing;
            })}
            <text x="5" y="10" fill="#3b82f6" font-size="9">Train</text>
            <text x="45" y="10" fill="#f97316" font-size="9">Val</text>
          </svg>
        </div>
        <div style="background:#1a1d2e;border-radius:6px;padding:8px">
          <div style="font-size:10px;color:#9ca3af;margin-bottom:4px;text-align:center">Accuracy Curves</div>
          <svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto">
            ${data.map((d,i) => {
              const x1 = (i/maxEpoch*w).toFixed(1);
              const x2 = ((i+1)/maxEpoch*w).toFixed(1);
              const y1a = (h - d.accuracy*h*0.9 - 10).toFixed(1);
              const y2a = (h - (data[i+1]?.accuracy||d.accuracy)*h*0.9 - 10).toFixed(1);
              const y1va = (h - d.valAccuracy*h*0.9 - 10).toFixed(1);
              const y2va = (h - (data[i+1]?.valAccuracy||d.valAccuracy)*h*0.9 - 10).toFixed(1);
              if (i < data.length - 1) return html`<line x1=${x1} y1=${y1a} x2=${x2} y2=${y2a} stroke="#10b981" stroke-width="1.5"/><line x1=${x1} y1=${y1va} x2=${x2} y2=${y2va} stroke="#8b5cf6" stroke-width="1.5" stroke-dasharray="4"/>`;
              return nothing;
            })}
            <text x="5" y="10" fill="#10b981" font-size="9">Train</text>
            <text x="45" y="10" fill="#8b5cf6" font-size="9">Val</text>
          </svg>
        </div>
      </div>
    `;
  }

  private _darRenderConfidenceDist(): any {
    const bins = this._darMlConfidenceBins;
    const maxCount = Math.max(...bins.map(b => b.count));
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Prediction Confidence Distribution</div>
      <div style="display:flex;align-items:flex-end;gap:6px;height:120px;padding:0 4px">
        ${bins.map(b => html`
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
            <span style="font-size:9px;color:#9ca3af">${b.count}</span>
            <div style="width:100%;height:${(b.count/maxCount*100).toFixed(0)}%;background:${b.color};border-radius:4px 4px 0 0;min-height:4px;transition:height 0.3s"></div>
            <span style="font-size:8px;color:#6b7280;text-align:center;white-space:nowrap">${b.range}</span>
          </div>
        `)}
      </div>
    `;
  }

  private _darRenderVersionHistory(): any {
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Model Version Comparison</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${this._darMlVersionHistory.map(v => html`
          <div style="background:${v.version === this._darMlSelectedVersion ? '#1e293b' : '#1a1d2e'};border-radius:6px;padding:10px;border-left:3px solid ${v.version === this._darMlSelectedVersion ? '#3b82f6' : '#374151'};cursor:pointer" @click=${() => { this._darMlSelectedVersion = v.version; }}>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <span style="font-weight:600;font-size:12px;color:#e2e8f0">${v.version}</span>
                <span style="margin-left:8px;font-size:10px;color:#6b7280">${v.date}</span>
              </div>
              <div style="display:flex;gap:12px;font-size:10px">
                <span style="color:#10b981">Acc: ${(v.accuracy*100).toFixed(1)}%</span>
                <span style="color:#f97316">F1: ${(v.f1*100).toFixed(1)}%</span>
              </div>
            </div>
            <div style="font-size:10px;color:#9ca3af;margin-top:4px">${v.notes}</div>
          </div>
        `)}
      </div>
    `;
  }

  // === COMPLIANCE FRAMEWORK DEEP DIVE ===
  @state() private _darCompActiveFramework: string = 'nist';
  @state() private _darNistCategories: {id:string;name:string;status:'implemented'|'partial'|'not-started';priority:number;progress:number}[] = [];
  @state() private _darCisControls: {number:number;name:string;implementation:number;maturity:string;owner:string}[] = [];
  @state() private _darIsoClauses: {clause:string;title:string;status:string;evidence:number;gap:string}[] = [];
  @state() private _darGdprArticles: {article:string;title:string;compliant:boolean;notes:string}[] = [];
  @state() private _darSoc2Criteria: {criteria:string;category:string;status:string;score:number}[] = [];
  @state() private _darCompGapFilter: string = 'all';

  private _darInitComplianceData(): void {
    this._darNistCategories = [
      {id:'ID.AM-1',name:'Asset Inventory Management',status:'implemented',priority:1,progress:95},
      {id:'ID.AM-2',name:'Software Platform Inventory',status:'implemented',priority:1,progress:88},
      {id:'ID.RA-1',name:'Risk Assessment Strategy',status:'partial',priority:2,progress:72},
      {id:'ID.RA-2',name:'Asset Vulnerability Assessment',status:'partial',priority:2,progress:65},
      {id:'PR.AC-1',name:'Identity Management',status:'implemented',priority:1,progress:92},
      {id:'PR.AC-3',name:'Access Authentication',status:'implemented',priority:1,progress:90},
      {id:'PR.DS-1',name:'Data-at-Rest Protection',status:'implemented',priority:1,progress:97},
      {id:'PR.DS-5',name:'Protection Against Malicious Code',status:'partial',priority:2,progress:78},
      {id:'DE.CM-1',name:'Security Monitoring',status:'implemented',priority:1,progress:85},
      {id:'DE.AE-2',name:'Incident Response Automation',status:'not-started',priority:3,progress:20},
      {id:'RS.AN-1',name:'Response Plan Execution',status:'partial',priority:2,progress:60},
      {id:'RC.CO-1',name:'Recovery Plan Execution',status:'partial',priority:2,progress:55},
    ];
    this._darCisControls = [
      {number:1,name:'Inventory and Control of Enterprise Assets',implementation:82,maturity:'Defined',owner:'IT Ops'},
      {number:2,name:'Inventory and Control of Software Assets',implementation:75,maturity:'Managed',owner:'SecOps'},
      {number:3,name:'Data Protection',implementation:90,maturity:'Defined',owner:'DPO'},
      {number:4,name:'Secure Configuration of Enterprise Assets',implementation:68,maturity:'Managed',owner:'IT Ops'},
      {number:5,name:'Account Management',implementation:85,maturity:'Defined',owner:'IAM Team'},
      {number:6,name:'Access Control Management',implementation:88,maturity:'Defined',owner:'IAM Team'},
      {number:7,name:'Continuous Vulnerability Management',implementation:72,maturity:'Managed',owner:'SecOps'},
      {number:8,name:'Audit Log Management',implementation:80,maturity:'Defined',owner:'SecOps'},
    ];
    this._darIsoClauses = [
      {clause:'A.5.1',title:'Policies for Information Security',status:'Compliant',evidence:12,gap:'None'},
      {clause:'A.5.9',title:'Inventory of Information Assets',status:'Compliant',evidence:8,gap:'None'},
      {clause:'A.6.1',title:'Screening of Candidates',status:'Partial',evidence:5,gap:'Background check process not documented for contractors'},
      {clause:'A.7.1',title:'Before Using Information',status:'Compliant',evidence:10,gap:'None'},
      {clause:'A.8.1',title:'User Endpoint Devices',status:'Partial',evidence:4,gap:'MDM coverage at 78%, target 95%'},
      {clause:'A.8.9',title:'Configuration Management',status:'Partial',evidence:6,gap:'Automated config drift detection missing'},
      {clause:'A.8.16',title:'Monitoring Activities',status:'Compliant',evidence:9,gap:'None'},
      {clause:'A.8.23',title:'Web Filtering',status:'Not Started',evidence:0,gap:'No web filtering solution deployed'},
    ];
    this._darGdprArticles = [
      {article:'Art. 5',title:'Principles of Processing',compliant:true,notes:'Data minimization and purpose limitation verified'},
      {article:'Art. 6',title:'Lawfulness of Processing',compliant:true,notes:'All processing activities have valid legal basis documented'},
      {article:'Art. 13',title:'Information to Data Subjects',compliant:true,notes:'Privacy notices updated and published'},
      {article:'Art. 15',title:'Right of Access',compliant:false,notes:'DSAR response time averaging 38 days, SLA is 30 days'},
      {article:'Art. 17',title:'Right to Erasure',compliant:true,notes:'Automated deletion workflows in place'},
      {article:'Art. 20',title:'Data Portability',compliant:false,notes:'Machine-readable export not yet available for legacy systems'},
      {article:'Art. 25',title:'Data Protection by Design',compliant:true,notes:'Privacy impact assessments mandatory for new features'},
      {article:'Art. 32',title:'Security of Processing',compliant:true,notes:'Encryption, access controls, and logging implemented'},
      {article:'Art. 33',title:'Breach Notification',compliant:true,notes:'72-hour notification process tested quarterly'},
      {article:'Art. 35',title:'Impact Assessment',compliant:false,notes:'DPIA backlog: 3 assessments pending review'},
    ];
    this._darSoc2Criteria = [
      {criteria:'CC6.1',category:'Security',status:'Compliant',score:92},
      {criteria:'CC6.2',category:'Security',status:'Compliant',score:88},
      {criteria:'CC6.3',category:'Security',status:'Partial',score:74},
      {criteria:'A1.1',category:'Availability',status:'Compliant',score:95},
      {criteria:'A1.2',category:'Availability',status:'Compliant',score:90},
      {criteria:'A1.3',category:'Availability',status:'Partial',score:68},
      {criteria:'C1.1',category:'Confidentiality',status:'Compliant',score:91},
      {criteria:'C1.2',category:'Confidentiality',status:'Compliant',score:87},
      {criteria:'P1.1',category:'Privacy',status:'Partial',score:72},
      {criteria:'P1.2',category:'Privacy',status:'Not Started',score:35},
    ];
  }

  private _darRenderComplianceDeepDive(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Compliance Framework Deep Dive">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Compliance Framework</span>
          <div style="display:flex;gap:4px">
            ${['nist','cis','iso','gdpr','soc2'].map(fw => html`
              <button class="tab ${this._darCompActiveFramework === fw ? 'active' : ''}" @click=${() => { this._darCompActiveFramework = fw; }}>${fw.toUpperCase()}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:10px">
          ${['all','implemented','partial','not-started'].map(f => html`
            <button class="tab ${this._darCompGapFilter === f ? 'active' : ''}" @click=${() => { this._darCompGapFilter = f; }} style="font-size:10px">${f === 'all' ? 'All' : f === 'not-started' ? 'Not Started' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
          `)}
        </div>
        ${this._darCompActiveFramework === 'nist' ? this._darRenderNistCsf() : nothing}
        ${this._darCompActiveFramework === 'cis' ? this._darRenderCisControls() : nothing}
        ${this._darCompActiveFramework === 'iso' ? this._darRenderIso27001() : nothing}
        ${this._darCompActiveFramework === 'gdpr' ? this._darRenderGdprChecklist() : nothing}
        ${this._darCompActiveFramework === 'soc2' ? this._darRenderSoc2Criteria() : nothing}
      </div>
    `;
  }

  private _darRenderNistCsf(): any {
    const filtered = this._darCompGapFilter === 'all' ? this._darNistCategories : this._darNistCategories.filter(c => c.status === this._darCompGapFilter);
    const statusColor = (s: string) => s === 'implemented' ? '#10b981' : s === 'partial' ? '#f59e0b' : '#ef4444';
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">NIST CSF 2.0 Subcategory Mapping</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${filtered.map(c => html`
          <div style="display:flex;align-items:center;gap:8px;background:#1a1d2e;border-radius:4px;padding:8px">
            <span style="width:60px;font-size:10px;color:#6b7280;font-family:monospace">${c.id}</span>
            <span style="flex:1;font-size:11px;color:#e2e8f0">${c.name}</span>
            <div style="width:80px;height:6px;background:#0f1117;border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${c.progress}%;background:${statusColor(c.status)};border-radius:3px"></div>
            </div>
            <span style="width:35px;font-size:10px;text-align:right;color:${statusColor(c.status)}">${c.progress}%</span>
            <span style="width:70px;font-size:9px;text-align:center;color:${statusColor(c.status)};background:${statusColor(c.status)}22;padding:2px 4px;border-radius:3px">${c.status}</span>
          </div>
        `)}
      </div>
    `;
  }

  private _darRenderCisControls(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">CIS Controls v8 Implementation Tracking</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._darCisControls.map(c => html`
          <div style="background:#1a1d2e;border-radius:4px;padding:10px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="background:#3b82f6;color:white;font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px">${c.number}</span>
                <span style="font-size:11px;color:#e2e8f0">${c.name}</span>
              </div>
              <span style="font-size:9px;color:#9ca3af">${c.owner}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
              <div style="flex:1;height:6px;background:#0f1117;border-radius:3px;overflow:hidden">
                <div style="height:100%;width:${c.implementation}%;background:${c.implementation >= 80 ? '#10b981' : c.implementation >= 60 ? '#f59e0b' : '#ef4444'};border-radius:3px"></div>
              </div>
              <span style="width:35px;font-size:10px;color:#e2e8f0;text-align:right">${c.implementation}%</span>
              <span style="font-size:9px;color:#8b5cf6;background:#8b5cf622;padding:2px 6px;border-radius:3px">${c.maturity}</span>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private _darRenderIso27001(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">ISO 27001 Clause Coverage Matrix</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._darIsoClauses.map(c => html`
          <div style="background:#1a1d2e;border-radius:4px;padding:8px;border-left:3px solid ${c.status === 'Compliant' ? '#10b981' : c.status === 'Partial' ? '#f59e0b' : '#ef4444'}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <span style="font-weight:600;font-size:11px;color:#e2e8f0">${c.clause}</span>
                <span style="margin-left:6px;font-size:11px;color:#9ca3af">${c.title}</span>
              </div>
              <span style="font-size:10px;color:${c.status === 'Compliant' ? '#10b981' : c.status === 'Partial' ? '#f59e0b' : '#ef4444'}">${c.status}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:10px">
              <span style="color:#6b7280">Evidence: ${c.evidence} items</span>
              ${c.gap !== 'None' ? html`<span style="color:#f59e0b">Gap: ${c.gap}</span>` : html`<span style="color:#10b981">No gaps</span>`}
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private _darRenderGdprChecklist(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">GDPR Article Compliance Checklist</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._darGdprArticles.map(a => html`
          <div style="background:#1a1d2e;border-radius:4px;padding:8px;display:flex;align-items:flex-start;gap:8px">
            <div style="width:18px;height:18px;border-radius:50%;background:${a.compliant ? '#10b981' : '#ef4444'};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">
              <span style="color:white;font-size:10px">${a.compliant ? '✓' : '✗'}</span>
            </div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-weight:600;font-size:11px;color:#e2e8f0">${a.article}</span>
                <span style="font-size:11px;color:#9ca3af">${a.title}</span>
              </div>
              <div style="font-size:10px;color:#6b7280;margin-top:2px">${a.notes}</div>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private _darRenderSoc2Criteria(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">SOC 2 Trust Service Criteria Mapping</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._darSoc2Criteria.map(c => html`
          <div style="background:#1a1d2e;border-radius:4px;padding:8px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="display:flex;align-items:center;gap:6px">
                <span style="font-size:10px;color:#8b5cf6;background:#8b5cf622;padding:2px 6px;border-radius:3px">${c.category}</span>
                <span style="font-weight:600;font-size:11px;color:#e2e8f0">${c.criteria}</span>
              </div>
              <span style="font-size:11px;font-weight:600;color:${c.score >= 80 ? '#10b981' : c.score >= 50 ? '#f59e0b' : '#ef4444'}">${c.score}%</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
              <div style="flex:1;height:4px;background:#0f1117;border-radius:2px;overflow:hidden">
                <div style="height:100%;width:${c.score}%;background:${c.score >= 80 ? '#10b981' : c.score >= 50 ? '#f59e0b' : '#ef4444'};border-radius:2px"></div>
              </div>
              <span style="font-size:9px;color:${c.status === 'Compliant' ? '#10b981' : c.status === 'Partial' ? '#f59e0b' : '#ef4444'}">${c.status}</span>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  // === INTERACTIVE NETWORK MAP ===
  @state() private _darNetNodes: {id:string;label:string;type:string;segment:string;x:number;y:number;status:string}[] = [];
  @state() private _darNetEdges: {from:string;to:string;weight:number;traffic:number;type:string}[] = [];
  @state() private _darNetSelectedNode: string = '';
  @state() private _darNetPathStart: string = '';
  @state() private _darNetPathEnd: string = '';
  @state() private _darNetPathResult: string[] = [];
  @state() private _darNetSegmentFilter: string = 'all';
  @state() private _darNetTrafficOverlay: boolean = false;
  @state() private _darNetZoom: number = 1;

  private _darInitNetworkData(): void {
    this._darNetNodes = [
      {id:'fw1',label:'Edge Firewall',type:'firewall',segment:'dmz',x:200,y:60,status:'active'},
      {id:'waf1',label:'Web App Firewall',type:'firewall',segment:'dmz',x:350,y:60,status:'active'},
      {id:'lb1',label:'Load Balancer',type:'network',segment:'dmz',x:275,y:130,status:'active'},
      {id:'web1',label:'Web Server 1',type:'server',segment:'frontend',x:150,y:220,status:'active'},
      {id:'web2',label:'Web Server 2',type:'server',segment:'frontend',x:300,y:220,status:'warning'},
      {id:'web3',label:'Web Server 3',type:'server',segment:'frontend',x:450,y:220,status:'active'},
      {id:'api1',label:'API Gateway',type:'gateway',segment:'backend',x:200,y:320,status:'active'},
      {id:'app1',label:'App Server 1',type:'server',segment:'backend',x:350,y:320,status:'active'},
      {id:'app2',label:'App Server 2',type:'server',segment:'backend',x:500,y:320,status:'inactive'},
      {id:'db1',label:'Primary DB',type:'database',segment:'data',x:200,y:420,status:'active'},
      {id:'db2',label:'Replica DB',type:'database',segment:'data',x:400,y:420,status:'active'},
      {id:'cache1',label:'Redis Cache',type:'cache',segment:'data',x:300,y:480,status:'active'},
      {id:'ldap1',label:'LDAP Server',type:'auth',segment:'services',x:500,y:180,status:'active'},
      {id:'log1',label:'Log Server',type:'monitoring',segment:'services',x:550,y:420,status:'active'},
      {id:'siem1',label:'SIEM',type:'monitoring',segment:'services',x:550,y:320,status:'active'},
    ];
    this._darNetEdges = [
      {from:'fw1',to:'lb1',weight:80,traffic:1200,type:'primary'},
      {from:'waf1',to:'lb1',weight:60,traffic:800,type:'primary'},
      {from:'lb1',to:'web1',weight:30,traffic:400,type:'primary'},
      {from:'lb1',to:'web2',weight:30,traffic:380,type:'primary'},
      {from:'lb1',to:'web3',weight:25,traffic:350,type:'primary'},
      {from:'web1',to:'api1',weight:20,traffic:250,type:'api'},
      {from:'web2',to:'api1',weight:18,traffic:220,type:'api'},
      {from:'web3',to:'api1',weight:15,traffic:180,type:'api'},
      {from:'api1',to:'app1',weight:25,traffic:300,type:'internal'},
      {from:'api1',to:'app2',weight:10,traffic:50,type:'internal'},
      {from:'app1',to:'db1',weight:35,traffic:500,type:'database'},
      {from:'app1',to:'db2',weight:20,traffic:200,type:'database'},
      {from:'app2',to:'db2',weight:15,traffic:100,type:'database'},
      {from:'app1',to:'cache1',weight:25,traffic:400,type:'cache'},
      {from:'web1',to:'ldap1',weight:5,traffic:20,type:'auth'},
      {from:'web2',to:'ldap1',weight:5,traffic:18,type:'auth'},
      {from:'api1',to:'log1',weight:10,traffic:150,type:'logging'},
      {from:'api1',to:'siem1',weight:8,traffic:120,type:'monitoring'},
      {from:'log1',to:'siem1',weight:10,traffic:130,type:'monitoring'},
    ];
  }

  private _darFindPath(start: string, end: string): string[] {
    const adj = new Map<string, string[]>();
    for (const e of this._darNetEdges) {
      if (!adj.has(e.from)) adj.set(e.from, []);
      if (!adj.has(e.to)) adj.set(e.to, []);
      adj.get(e.from)!.push(e.to);
      adj.get(e.to)!.push(e.from);
    }
    const queue = [start];
    const visited = new Set([start]);
    const parent = new Map<string, string>();
    while (queue.length > 0) {
      const node = queue.shift()!;
      if (node === end) break;
      for (const neighbor of (adj.get(node) || [])) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, node);
          queue.push(neighbor);
        }
      }
    }
    const path: string[] = [];
    let cur = end;
    while (cur && parent.has(cur)) {
      path.unshift(cur);
      cur = parent.get(cur)!;
    }
    if (cur === start) path.unshift(start);
    return path;
  }

  private _darRenderNetworkMap(): any {
    const filteredNodes = this._darNetSegmentFilter === 'all' ? this._darNetNodes : this._darNetNodes.filter(n => n.segment === this._darNetSegmentFilter);
    const nodeMap = new Map(this._darNetNodes.map(n => [n.id, n]));
    const filteredEdges = this._darNetEdges.filter(e => filteredNodes.some(n => n.id === e.from) && filteredNodes.some(n => n.id === e.to));
    const typeColor: Record<string,string> = {firewall:'#ef4444',network:'#3b82f6',server:'#10b981',gateway:'#8b5cf6',database:'#f97316',cache:'#eab308',auth:'#06b6d4',monitoring:'#ec4899'};
    const pathSet = new Set(this._darNetPathResult);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Interactive Network Map">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Network Topology</span>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            ${['all','dmz','frontend','backend','data','services'].map(s => html`
              <button class="tab ${this._darNetSegmentFilter === s ? 'active' : ''}" @click=${() => { this._darNetSegmentFilter = s; }} style="font-size:10px">${s.charAt(0).toUpperCase() + s.slice(1)}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap">
          <select style="background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:4px;padding:4px 8px;font-size:11px" @change=${(e: any) => { this._darNetPathStart = e.target.value; }}>
            <option value="">Path Start...</option>
            ${this._darNetNodes.map(n => html`<option value=${n.id}>${n.label}</option>`)}
          </select>
          <span style="color:#6b7280;font-size:12px">→</span>
          <select style="background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:4px;padding:4px 8px;font-size:11px" @change=${(e: any) => { this._darNetPathEnd = e.target.value; }}>
            <option value="">Path End...</option>
            ${this._darNetNodes.map(n => html`<option value=${n.id}>${n.label}</option>`)}
          </select>
          <button class="tab active" @click=${() => { if (this._darNetPathStart && this._darNetPathEnd) this._darNetPathResult = this._darFindPath(this._darNetPathStart, this._darNetPathEnd); }} style="font-size:10px">Trace Path</button>
          <label style="display:flex;align-items:center;gap:4px;font-size:10px;color:#9ca3af;cursor:pointer">
            <input type="checkbox" .checked=${this._darNetTrafficOverlay} @change=${() => { this._darNetTrafficOverlay = !this._darNetTrafficOverlay; }}> Traffic Overlay
          </label>
        </div>
        <svg viewBox="0 0 650 540" style="width:100%;max-height:400px;background:#0a0c14;border-radius:6px;border:1px solid #1e293b">
          ${filteredEdges.map(e => {
            const from = nodeMap.get(e.from);
            const to = nodeMap.get(e.to);
            if (!from || !to) return nothing;
            const isPath = pathSet.has(e.from) && pathSet.has(e.to) && Math.abs(pathSet.indexOf(e.from) - pathSet.indexOf(e.to)) === 1;
            const strokeWidth = Math.max(1, e.weight / 10);
            const opacity = this._darNetTrafficOverlay ? Math.min(1, e.traffic / 500) : 0.6;
            return html`<line x1=${from.x} y1=${from.y} x2=${to.x} y2=${to.y} stroke=${isPath ? '#fbbf24' : '#374151'} stroke-width=${isPath ? strokeWidth + 2 : strokeWidth} opacity=${opacity} ${isPath ? 'stroke-dasharray="6"' : ''}/>`;
          })}
          ${filteredNodes.map(n => html`
            <g @click=${() => { this._darNetSelectedNode = n.id; }}>
              <circle cx=${n.x} cy=${n.y} r="16" fill=${typeColor[n.type] || '#6b7280'} opacity=${n.status === 'inactive' ? 0.3 : n.status === 'warning' ? 0.7 : 1} stroke=${this._darNetSelectedNode === n.id ? '#fbbf24' : 'none'} stroke-width="2"/>
              <text x=${n.x} y=${n.y + 1} text-anchor="middle" fill="white" font-size="7" font-weight="600">${n.type.charAt(0).toUpperCase()}</text>
              <text x=${n.x} y=${n.y + 28} text-anchor="middle" fill="#9ca3af" font-size="8">${n.label}</text>
              ${this._darNetTrafficOverlay ? html`<text x=${n.x} y=${n.y - 20} text-anchor="middle" fill="#60a5fa" font-size="7">${this._darNetEdges.filter(e => e.from === n.id || e.to === n.id).reduce((s,e) => s + e.traffic, 0)} Mbps</text>` : nothing}
            </g>
          `)}
        </svg>
        ${this._darNetPathResult.length > 0 ? html`
          <div style="margin-top:8px;background:#1a1d2e;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:4px">Traced Path (${this._darNetPathResult.length} hops):</div>
            <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
              ${this._darNetPathResult.map((id, i) => {
                const node = nodeMap.get(id);
                return html`
                  <span style="background:#fbbf2422;color:#fbbf24;font-size:10px;padding:2px 8px;border-radius:3px;font-weight:600">${node?.label || id}</span>
                  ${i < this._darNetPathResult.length - 1 ? html`<span style="color:#6b7280">→</span>` : nothing}
                `;
              })}
            </div>
          </div>
        ` : nothing}
        <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap">
          ${Object.entries(typeColor).map(([type, color]) => html`
            <div style="display:flex;align-items:center;gap:4px;font-size:9px;color:#9ca3af">
              <div style="width:8px;height:8px;border-radius:50%;background:${color}"></div>
              ${type}
            </div>
          `)}
        </div>
      </div>
    `;
  }

  // === ADVANCED SEARCH & FILTER ===
  @state() private _darSearchQuery: string = '';
  @state() private _darSearchResults: {id:string;title:string;relevance:number;type:string;date:string;preview:string}[] = [];
  @state() private _darSavedSearches: {id:string;query:string;createdAt:string;runCount:number}[] = [];
  @state() private _darRecentSearches: string[] = [];
  @state() private _darSearchFilters: {field:string;operator:string;value:string;logic:'and'|'or'|'not'}[] = [];
  @state() private _darSearchActiveFilterIdx: number = -1;
  @state() private _darSearchPreset: string = 'none';
  @state() private _darSearchIsRunning: boolean = false;

  private _darInitSearchData(): void {
    this._darSavedSearches = [
      {id:'s1',query:'severity:critical status:open',createdAt:'2026-04-20',runCount:12},
      {id:'s2',query:'type:intrusion network:internal',createdAt:'2026-04-18',runCount:8},
      {id:'s3',query:'policy:DLP destination:cloud',createdAt:'2026-04-15',runCount:5},
    ];
    this._darRecentSearches = ['critical vulnerabilities','failed login attempts','data exfiltration','phishing reports'];
  }

  private _darExecuteSearch(): void {
    if (!this._darSearchQuery.trim()) return;
    this._darSearchIsRunning = true;
    this._darRecentSearches = [this._darSearchQuery, ...this._darRecentSearches.filter(s => s !== this._darSearchQuery)].slice(0, 10);
    setTimeout(() => {
      const q = this._darSearchQuery.toLowerCase();
      const mockData = [
        {id:'r1',title:'Critical SQL Injection in Payment API',relevance:0.95,type:'Vulnerability',date:'2026-04-22',preview:'A critical SQL injection vulnerability was detected in the payment processing API endpoint...'},
        {id:'r2',title:'Unauthorized Access Attempt from External IP',relevance:0.88,type:'Incident',date:'2026-04-21',preview:'Multiple unauthorized access attempts detected from IP range 203.0.113.0/24 targeting...'},
        {id:'r3',title:'DLP Policy Violation - Cloud Upload',relevance:0.82,type:'DLP',date:'2026-04-21',preview:'Sensitive data (PII) upload to cloud storage service detected and blocked by DLP policy...'},
        {id:'r4',title:'Firewall Rule Change - Port 445',relevance:0.75,type:'Change',date:'2026-04-20',preview:'Firewall rule modification detected: new inbound rule allowing TCP 445 from segment DMZ...'},
        {id:'r5',title:'Privilege Escalation - Service Account',relevance:0.71,type:'IAM',date:'2026-04-20',preview:'Service account svc-backup granted domain admin privileges without approval workflow...'},
        {id:'r6',title:'Malware Detection - Emotet Variant',relevance:0.68,type:'Threat',date:'2026-04-19',preview:'Endpoint detection system identified a new Emotet variant in email attachment from...'},
        {id:'r7',title:'Compliance Gap - GDPR Data Retention',relevance:0.62,type:'Compliance',date:'2026-04-19',preview:'Audit identified personal data retained beyond the 30-day policy limit in 3 systems...'},
        {id:'r8',title:'Network Anomaly - DNS Tunneling',relevance:0.58,type:'Network',date:'2026-04-18',preview:'Unusual DNS query pattern detected suggesting possible DNS tunneling activity from...'},
      ];
      this._darSearchResults = mockData.filter(r => r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || r.preview.toLowerCase().includes(q) || q.length < 3);
      this._darSearchIsRunning = false;
    }, 300);
  }

  private _darAddSearchFilter(): void {
    this._darSearchFilters.push({field:'',operator:'contains',value:'',logic:'and'});
    this._darSearchActiveFilterIdx = this._darSearchFilters.length - 1;
  }

  private _darRemoveSearchFilter(idx: number): void {
    this._darSearchFilters = this._darSearchFilters.filter((_, i) => i !== idx);
    if (this._darSearchActiveFilterIdx >= this._darSearchFilters.length) this._darSearchActiveFilterIdx = -1;
  }

  private _darApplySearchPreset(preset: string): void {
    this._darSearchPreset = preset;
    if (preset === 'critical') this._darSearchQuery = 'severity:critical status:open';
    else if (preset === 'recent') this._darSearchQuery = 'date:>2026-04-20 type:*';
    else if (preset === 'failed') this._darSearchQuery = 'status:failed action:blocked';
    this._darExecuteSearch();
  }

  private _darRenderAdvancedSearch(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Advanced Search and Filter">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Advanced Search</span>
          <div style="display:flex;gap:4px">
            ${['none','critical','recent','failed'].map(p => html`
              <button class="tab ${this._darSearchPreset === p ? 'active' : ''}" @click=${() => this._darApplySearchPreset(p)} style="font-size:10px">${p === 'none' ? 'Presets' : p.charAt(0).toUpperCase() + p.slice(1)}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <div style="flex:1;position:relative">
            <input type="text" placeholder="Search across all data types..." value=${this._darSearchQuery} @input=${(e: any) => { this._darSearchQuery = e.target.value; }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._darExecuteSearch(); }} style="width:100%;background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:6px;padding:8px 12px;font-size:12px;outline:none" aria-label="Search input"/>
          </div>
          <button class="tab active" @click=${() => this._darExecuteSearch()} style="padding:8px 16px" ?disabled=${this._darSearchIsRunning}>${this._darSearchIsRunning ? '...' : 'Search'}</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap">
          <span style="font-size:10px;color:#6b7280">Filters:</span>
          <button class="tab" @click=${() => this._darAddSearchFilter()} style="font-size:10px">+ Add Filter</button>
          ${this._darSearchFilters.map((f, i) => html`
            <div style="display:flex;gap:4px;align-items:center;background:#1a1d2e;border-radius:4px;padding:4px 8px">
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._darSearchFilters[i].field = e.target.value; }}>
                <option value="">Field</option>
                <option value="severity">Severity</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
                <option value="date">Date</option>
                <option value="source">Source</option>
              </select>
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._darSearchFilters[i].operator = e.target.value; }}>
                <option value="contains">Contains</option>
                <option value="equals">Equals</option>
                <option value="starts">Starts with</option>
                <option value="gt">Greater than</option>
                <option value="lt">Less than</option>
              </select>
              <input type="text" placeholder="Value" style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 6px;font-size:10px;width:80px" @input=${(e: any) => { this._darSearchFilters[i].value = e.target.value; }}/>
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._darSearchFilters[i].logic = e.target.value; }}>
                <option value="and">AND</option>
                <option value="or">OR</option>
                <option value="not">NOT</option>
              </select>
              <button @click=${() => this._darRemoveSearchFilter(i)} style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:12px;padding:0 2px">✕</button>
            </div>
          `)}
        </div>
        ${this._darSearchResults.length > 0 ? html`
          <div style="margin-bottom:8px;font-size:10px;color:#9ca3af">${this._darSearchResults.length} results found</div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto">
            ${this._darSearchResults.map(r => html`
              <div style="background:#1a1d2e;border-radius:4px;padding:8px;border-left:3px solid ${r.relevance > 0.85 ? '#10b981' : r.relevance > 0.7 ? '#3b82f6' : '#6b7280'}">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:12px;font-weight:600;color:#e2e8f0">${r.title}</span>
                  <div style="display:flex;gap:6px;align-items:center">
                    <span style="font-size:9px;color:#6b7280">${r.date}</span>
                    <span style="font-size:9px;color:#3b82f6;background:#3b82f622;padding:1px 6px;border-radius:3px">${r.type}</span>
                    <span style="font-size:9px;color:#9ca3af">${(r.relevance*100).toFixed(0)}%</span>
                  </div>
                </div>
                <div style="font-size:10px;color:#6b7280;margin-top:4px;line-height:1.4">${r.preview}</div>
              </div>
            `)}
          </div>
        ` : nothing}
        ${this._darRecentSearches.length > 0 && this._darSearchResults.length === 0 ? html`
          <div style="margin-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Recent Searches:</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              ${this._darRecentSearches.map(s => html`
                <button class="tab" @click=${() => { this._darSearchQuery = s; this._darExecuteSearch(); }} style="font-size:10px">${s}</button>
              `)}
            </div>
          </div>
        ` : nothing}
        ${this._darSavedSearches.length > 0 ? html`
          <div style="margin-top:8px;border-top:1px solid #1e293b;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Saved Searches:</div>
            <div style="display:flex;flex-direction:column;gap:3px">
              ${this._darSavedSearches.map(s => html`
                <div style="display:flex;justify-content:space-between;align-items:center;background:#1a1d2e;border-radius:4px;padding:4px 8px;cursor:pointer" @click=${() => { this._darSearchQuery = s.query; this._darExecuteSearch(); }}>
                  <span style="font-size:11px;color:#e2e8f0;font-family:monospace">${s.query}</span>
                  <span style="font-size:9px;color:#6b7280">${s.runCount} runs</span>
                </div>
              `)}
            </div>
          </div>
        ` : nothing}
      </div>
    `;
  }

  // === UNDO/REDO & HISTORY ===
  @state() private _darUndoStack: {id:number;action:string;timestamp:string;snapshot:string}[] = [];
  @state() private _darRedoStack: {id:number;action:string;timestamp:string;snapshot:string}[] = [];
  @state() private _darHistoryCounter: number = 0;
  @state() private _darHistoryVisible: boolean = false;
  @state() private _darDiffViewActive: boolean = false;
  @state() private _darDiffFromId: number = -1;
  @state() private _darDiffToId: number = -1;
  @state() private _darCurrentSnapshot: string = '';

  private _darPushHistory(action: string): void {
    this._darHistoryCounter++;
    const entry = {
      id: this._darHistoryCounter,
      action,
      timestamp: new Date().toISOString(),
      snapshot: JSON.stringify({searchQuery: this._darSearchQuery, filters: this._darSearchFilters, compFramework: this._darCompActiveFramework, mlView: this._darMlActiveView}),
    };
    this._darUndoStack.push(entry);
    this._darRedoStack = [];
    this._darCurrentSnapshot = entry.snapshot;
  }

  private _darUndo(): void {
    if (this._darUndoStack.length <= 1) return;
    const current = this._darUndoStack.pop()!;
    this._darRedoStack.push(current);
    const prev = this._darUndoStack[this._darUndoStack.length - 1];
    this._darCurrentSnapshot = prev.snapshot;
    try {
      const data = JSON.parse(prev.snapshot);
      if (data.searchQuery !== undefined) this._darSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._darSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._darCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._darMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _darRedo(): void {
    if (this._darRedoStack.length === 0) return;
    const entry = this._darRedoStack.pop()!;
    this._darUndoStack.push(entry);
    this._darCurrentSnapshot = entry.snapshot;
    try {
      const data = JSON.parse(entry.snapshot);
      if (data.searchQuery !== undefined) this._darSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._darSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._darCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._darMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _darJumpToHistory(id: number): void {
    const idx = this._darUndoStack.findIndex(e => e.id === id);
    if (idx < 0) return;
    const removed = this._darUndoStack.splice(idx + 1);
    this._darRedoStack.push(...removed.reverse());
    const target = this._darUndoStack[this._darUndoStack.length - 1];
    this._darCurrentSnapshot = target.snapshot;
    try {
      const data = JSON.parse(target.snapshot);
      if (data.searchQuery !== undefined) this._darSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._darSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._darCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._darMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _darGetDiff(fromId: number, toId: number): {field:string;from:string;to:string}[] {
    const fromEntry = this._darUndoStack.find(e => e.id === fromId);
    const toEntry = this._darUndoStack.find(e => e.id === toId);
    if (!fromEntry || !toEntry) return [];
    try {
      const fromData = JSON.parse(fromEntry.snapshot);
      const toData = JSON.parse(toEntry.snapshot);
      const diffs: {field:string;from:string;to:string}[] = [];
      const allKeys = new Set([...Object.keys(fromData), ...Object.keys(toData)]);
      for (const key of allKeys) {
        const fromVal = JSON.stringify(fromData[key] ?? 'undefined');
        const toVal = JSON.stringify(toData[key] ?? 'undefined');
        if (fromVal !== toVal) diffs.push({field: key, from: fromVal, to: toVal});
      }
      return diffs;
    } catch(_e) { return []; }
  }

  private _darRenderUndoRedo(): any {
    const allHistory = [...this._darUndoStack];
    const diffs = this._darDiffViewActive && this._darDiffFromId >= 0 && this._darDiffToId >= 0 ? this._darGetDiff(this._darDiffFromId, this._darDiffToId) : [];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Undo Redo History">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Action History</span>
          <div style="display:flex;gap:4px">
            <button class="tab" @click=${() => this._darUndo()} ?disabled=${this._darUndoStack.length <= 1} style="font-size:10px">↩ Undo</button>
            <button class="tab" @click=${() => this._darRedo()} ?disabled=${this._darRedoStack.length === 0} style="font-size:10px">Redo ↪</button>
            <button class="tab ${this._darHistoryVisible ? 'active' : ''}" @click=${() => { this._darHistoryVisible = !this._darHistoryVisible; }} style="font-size:10px">Timeline</button>
            <button class="tab ${this._darDiffViewActive ? 'active' : ''}" @click=${() => { this._darDiffViewActive = !this._darDiffViewActive; }} style="font-size:10px">Diff</button>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;font-size:10px;color:#6b7280">
          <span>Undo: ${this._darUndoStack.length}</span>
          <span>|</span>
          <span>Redo: ${this._darRedoStack.length}</span>
          <span>|</span>
          <span>Total Actions: ${this._darHistoryCounter}</span>
        </div>
        ${this._darHistoryVisible ? html`
          <div style="background:#1a1d2e;border-radius:6px;padding:8px;max-height:200px;overflow-y:auto;margin-bottom:8px">
            ${allHistory.map((entry, i) => html`
              <div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #0f1117;cursor:pointer;opacity:${i === allHistory.length - 1 ? 1 : 0.6}" @click=${() => this._darJumpToHistory(entry.id)}>
                <div style="width:12px;height:12px;border-radius:50%;background:${i === allHistory.length - 1 ? '#3b82f6' : '#374151'};flex-shrink:0"></div>
                <span style="font-size:10px;color:#e2e8f0;flex:1">${entry.action}</span>
                <span style="font-size:9px;color:#6b7280">${new Date(entry.timestamp).toLocaleTimeString()}</span>
                ${this._darDiffViewActive ? html`
                  <input type="radio" name="diff-from" style="accent-color:#3b82f6" @change=${() => { this._darDiffFromId = entry.id; }}/>
                  <input type="radio" name="diff-to" style="accent-color:#f97316" @change=${() => { this._darDiffToId = entry.id; }}/>
                ` : nothing}
              </div>
            `)}
          </div>
        ` : nothing}
        ${this._darDiffViewActive ? html`
          <div style="background:#1a1d2e;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:6px">${diffs.length > 0 ? 'Differences found:' : this._darDiffFromId >= 0 && this._darDiffToId >= 0 ? 'No differences' : 'Select two points in timeline to compare'}</div>
            ${diffs.map(d => html`
              <div style="display:grid;grid-template-columns:80px 1fr 1fr;gap:4px;font-size:10px;padding:4px 0;border-bottom:1px solid #0f1117">
                <span style="color:#9ca3af;font-weight:600">${d.field}</span>
                <span style="color:#ef4444;background:#ef444411;padding:2px 4px;border-radius:3px;word-break:break-all">${d.from}</span>
                <span style="color:#10b981;background:#10b98111;padding:2px 4px;border-radius:3px;word-break:break-all">${d.to}</span>
              </div>
            `)}
          </div>
        ` : nothing}
      </div>
    `;
  }


  // === TAB INTEGRATION FOR EXTENDED FEATURES ===
  @state() private _darActiveSubTab: string = 'scenario';

  private _darGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _darRenderSubPanel(): any {
    switch (this._darActiveSubTab) {
      case 'scenario': return this._darRenderScenarioEngine();
      case 'timeseries': return this._darRenderTimeSeries();
      case 'rbac': return this._darRenderRBAC();
      case 'reporting': return this._darRenderReporting();
      case 'a11y': return this._darRenderAccessibility();
      default: return nothing;
    }
  }

  private _darRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._darGetAllSubTabs().map(t => html`
          <button class="tab ${this._darActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._darActiveSubTab = t.key; }} role="tab" aria-selected=${this._darActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="dar-tab-${this._darActiveSubTab}">
        ${this._darRenderSubPanel()}
      </div>
    `;
  }


  // === Data Classification Engine ===
  @state() private _dataClassificationLevels = [
    { level: 'public', label: 'Public', color: '#22c55e', icon: '\u{1F7E2}', desc: 'No restrictions, freely distributable', count: 2847 },
    { level: 'internal', label: 'Internal', color: '#3b82f6', icon: '\u{1F535}', desc: 'Internal use only, not for external sharing', count: 1523 },
    { level: 'confidential', label: 'Confidential', color: '#f59e0b', icon: '\u{1F7E1}', desc: 'Restricted to authorized personnel with NDA', count: 389 },
    { level: 'restricted', label: 'Restricted', color: '#ef4444', icon: '\u{1F534}', desc: 'Highly sensitive, need-to-know basis only', count: 67 },
  ];
  @state() private _dlpRules: Array<{ id: string; name: string; condition: string; action: 'block' | 'alert' | 'encrypt' | 'quarantine'; enabled: boolean; matchCount: number; lastTriggered: string }> = [
    { id: 'dlp-001', name: 'SSN Pattern Detection', condition: 'regex: \b\d{3}-\d{2}-\d{4}\b', action: 'block', enabled: true, matchCount: 23, lastTriggered: '2026-04-22T16:30:00Z' },
    { id: 'dlp-002', name: 'Credit Card Numbers', condition: 'regex: \b4\d{12}(?:\d{3})?\b', action: 'block', enabled: true, matchCount: 15, lastTriggered: '2026-04-22T14:15:00Z' },
    { id: 'dlp-003', name: 'Source Code Exfil', condition: 'extension: .java,.py,.go AND size > 5MB', action: 'quarantine', enabled: true, matchCount: 3, lastTriggered: '2026-04-21T09:00:00Z' },
    { id: 'dlp-004', name: 'PII in Email Subject', condition: 'email-subject contains SSN or DOB pattern', action: 'alert', enabled: true, matchCount: 8, lastTriggered: '2026-04-23T08:00:00Z' },
    { id: 'dlp-005', name: 'Healthcare Data (HIPAA)', condition: 'content matches ICD-10 codes or patient IDs', action: 'encrypt', enabled: true, matchCount: 12, lastTriggered: '2026-04-22T11:00:00Z' },
  ];
  @state() private _dataFlows: Array<{ id: string; source: string; dest: string; dataClass: string; volume: string; encrypted: boolean; compliant: boolean }> = [
    { id: 'df-001', source: 'CRM System', dest: 'Analytics DW', dataClass: 'confidential', volume: '2.3 GB/day', encrypted: true, compliant: true },
    { id: 'df-002', source: 'HR Database', dest: 'Payroll SaaS', dataClass: 'restricted', volume: '150 MB/day', encrypted: true, compliant: false },
    { id: 'df-003', source: 'Customer Portal', dest: 'Support Ticketing', dataClass: 'internal', volume: '800 MB/day', encrypted: true, compliant: true },
    { id: 'df-004', source: 'Dev Environment', dest: 'External API', dataClass: 'public', volume: '50 MB/day', encrypted: false, compliant: true },
  ];
  @state() private _retentionPolicies: Array<{ id: string; dataClass: string; retentionMonths: number; storageLocation: string; autoDelete: boolean; lastAudit: string }> = [
    { id: 'rp-001', dataClass: 'public', retentionMonths: 36, storageLocation: 'Standard S3', autoDelete: true, lastAudit: '2026-04-15' },
    { id: 'rp-002', dataClass: 'internal', retentionMonths: 24, storageLocation: 'Standard S3', autoDelete: true, lastAudit: '2026-04-15' },
    { id: 'rp-003', dataClass: 'confidential', retentionMonths: 12, storageLocation: 'Encrypted Vault', autoDelete: false, lastAudit: '2026-04-15' },
    { id: 'rp-004', dataClass: 'restricted', retentionMonths: 6, storageLocation: 'HSM-Backed Vault', autoDelete: true, lastAudit: '2026-04-15' },
  ];

  private _renderDataClassificationModule(): any {
    const classColors: Record<string, string> = { public: '#22c55e', internal: '#3b82f6', confidential: '#f59e0b', restricted: '#ef4444' };
    const totalItems = this._dataClassificationLevels.reduce((s, l) => s + l.count, 0);
    return html`
      <div style="padding:12px;background:#0a0c10;border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">\u{1F4CA} Data Classification Engine</span>
          <span style="font-size:9px;color:#6b7280">${totalItems.toLocaleString()} total data items</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:8px">
          ${this._dataClassificationLevels.map(l => html`
            <div style="padding:6px;background:#111827;border-radius:4px;text-align:center;border-top:2px solid ${l.color}">
              <div style="font-size:14px;font-weight:700;color:${l.color}">${l.count.toLocaleString()}</div>
              <div style="font-size:8px;color:#e2e8f0;font-weight:600">${l.icon} ${l.label}</div>
              <div style="font-size:7px;color:#6b7280;margin-top:1px">${Math.round(l.count / totalItems * 100)}%</div>
            </div>
          `)}
        </div>
        <div style="font-size:10px;font-weight:600;color:#e2e8f0;margin-bottom:4px">DLP Policy Rules (${this._dlpRules.filter(r => r.enabled).length}/${this._dlpRules.length})</div>
        ${this._dlpRules.map(r => html`
          <div style="padding:4px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center">
            <div>
              <span style="font-weight:600;color:#e2e8f0;font-size:9px">${r.name}</span>
              <span style="font-size:7px;color:#6b7280;margin-left:4px">${r.condition.slice(0, 40)}...</span>
            </div>
            <div style="display:flex;gap:4px;align-items:center">
              <span style="font-size:7px;padding:1px 4px;border-radius:2px;background:${r.action === 'block' ? '#ef444422' : r.action === 'quarantine' ? '#f59e0b22' : '#3b82f622'};color:${r.action === 'block' ? '#ef4444' : r.action === 'quarantine' ? '#f59e0b' : '#3b82f6'}">${r.action}</span>
              <span style="font-size:7px;color:#6b7280">${r.matchCount} hits</span>
            </div>
          </div>
        `)}
        <div style="margin-top:6px;font-size:10px;font-weight:600;color:#e2e8f0;margin-bottom:4px">Data Flow Map</div>
        ${this._dataFlows.map(f => html`
          <div style="padding:4px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;align-items:center;gap:4px;font-size:8px">
            <span style="color:#e2e8f0">${f.source}</span>
            <span style="color:#6b7280">\u2192</span>
            <span style="color:#e2e8f0">${f.dest}</span>
            <span style="padding:1px 4px;border-radius:2px;background:${classColors[f.dataClass]}22;color:${classColors[f.dataClass]};font-size:7px">${f.dataClass}</span>
            <span style="color:#6b7280">${f.volume}</span>
            <span style="color:${f.encrypted ? '#22c55e' : '#ef4444'}">${f.encrypted ? '\u{1F512}' : '\u26A0'}</span>
            ${!f.compliant ? html`<span style="color:#ef4444;font-weight:700">NON-COMPLIANT</span>` : nothing}
          </div>
        `)}
        <div style="margin-top:6px;font-size:10px;font-weight:600;color:#e2e8f0;margin-bottom:4px">Retention Policies</div>
        ${this._retentionPolicies.map(rp => html`
          <div style="padding:4px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="padding:1px 4px;border-radius:2px;background:${classColors[rp.dataClass]}22;color:${classColors[rp.dataClass]}">${rp.dataClass}</span>
              <span style="color:#e2e8f0">${rp.retentionMonths} months</span>
              <span style="color:#6b7280">${rp.storageLocation}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px">
              <span style="color:${rp.autoDelete ? '#22c55e' : '#f59e0b'}">${rp.autoDelete ? 'Auto-delete' : 'Manual'}</span>
              <span style="color:#4b5563">Audit: ${rp.lastAudit}</span>
            </div>
          </div>
        `)}
      </div>`;
  }


  // === Security Awareness & Training Module ===
  @state() private _trainingModules: Array<{ id: string; name: string; category: string; duration: string; difficulty: 'beginner' | 'intermediate' | 'advanced'; enrolled: number; completed: number; avgScore: number; passRate: number }> = [
    { id: 'tm-001', name: 'Phishing Awareness', category: 'Social Engineering', duration: '30 min', difficulty: 'beginner', enrolled: 342, completed: 298, avgScore: 87.3, passRate: 94.2 },
    { id: 'tm-002', name: 'Password Hygiene', category: 'Credential Security', duration: '20 min', difficulty: 'beginner', enrolled: 310, completed: 285, avgScore: 91.5, passRate: 97.1 },
    { id: 'tm-003', name: 'Data Handling Procedures', category: 'Data Protection', duration: '45 min', difficulty: 'intermediate', enrolled: 245, completed: 198, avgScore: 82.1, passRate: 88.5 },
    { id: 'tm-004', name: 'Incident Reporting', category: 'Incident Response', duration: '25 min', difficulty: 'beginner', enrolled: 320, completed: 301, avgScore: 89.7, passRate: 96.3 },
    { id: 'tm-005', name: 'Physical Security', category: 'Facilities', duration: '15 min', difficulty: 'beginner', enrolled: 180, completed: 165, avgScore: 93.2, passRate: 98.5 },
    { id: 'tm-006', name: 'Secure Coding Basics', category: 'Development', duration: '60 min', difficulty: 'advanced', enrolled: 89, completed: 62, avgScore: 74.8, passRate: 78.4 },
    { id: 'tm-007', name: 'Regulatory Compliance (GDPR)', category: 'Compliance', duration: '40 min', difficulty: 'intermediate', enrolled: 210, completed: 178, avgScore: 80.5, passRate: 85.2 },
    { id: 'tm-008', name: 'Social Engineering Defense', category: 'Social Engineering', duration: '35 min', difficulty: 'intermediate', enrolled: 276, completed: 234, avgScore: 85.9, passRate: 90.8 },
  ];
  @state() private _phishingSimResults: Array<{ id: string; campaign: string; sentCount: number; clickRate: number; reportRate: number; credentialRate: number; date: string }> = [
    { id: 'ps-001', campaign: 'Q1 CEO Fraud', sentCount: 350, clickRate: 8.2, reportRate: 42.1, credentialRate: 1.4, date: '2026-03-15' },
    { id: 'ps-002', campaign: 'Q1 IT Helpdesk', sentCount: 340, clickRate: 12.5, reportRate: 35.3, credentialRate: 2.8, date: '2026-03-20' },
    { id: 'ps-003', campaign: 'Q2 Doc Share', sentCount: 345, clickRate: 6.1, reportRate: 51.8, credentialRate: 0.9, date: '2026-04-10' },
  ];
  @state() private _deptScores: Array<{ dept: string; complianceScore: number; trainingCompletion: number; phishingResilience: number; trend: 'up' | 'down' | 'stable' }> = [
    { dept: 'Engineering', complianceScore: 92, trainingCompletion: 88, phishingResilience: 94, trend: 'up' },
    { dept: 'Marketing', complianceScore: 78, trainingCompletion: 72, phishingResilience: 71, trend: 'down' },
    { dept: 'Finance', complianceScore: 95, trainingCompletion: 96, phishingResilience: 91, trend: 'stable' },
    { dept: 'HR', complianceScore: 88, trainingCompletion: 91, phishingResilience: 82, trend: 'up' },
    { dept: 'Sales', complianceScore: 71, trainingCompletion: 65, phishingResilience: 68, trend: 'down' },
  ];
  @state() private _selectedTrainingModule: string = '';

  private _renderTrainingModule(): any {
    const diffColors: Record<string, string> = { beginner: '#22c55e', intermediate: '#f59e0b', advanced: '#ef4444' };
    const trendIcons: Record<string, string> = { up: '\u2191', down: '\u2193', stable: '\u2192' };
    return html`
      <div style="padding:12px;background:#0a0c10;border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">\u{1F393} Security Awareness & Training</span>
          <span style="font-size:9px;color:#6b7280">${this._trainingModules.length} modules available</span>
        </div>
        <div style="font-size:10px;font-weight:600;color:#e2e8f0;margin-bottom:4px">Training Catalog</div>
        ${this._trainingModules.map(m => html`
          <div style="padding:5px 8px;background:#111827;border-radius:4px;margin-bottom:3px;cursor:pointer;border:1px solid ${this._selectedTrainingModule === m.id ? '#1e3a5f' : 'transparent'}" @click=${() => { this._selectedTrainingModule = this._selectedTrainingModule === m.id ? '' : m.id; }}>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="display:flex;align-items:center;gap:4px">
                <span style="padding:1px 4px;border-radius:2px;background:${diffColors[m.difficulty]}22;color:${diffColors[m.difficulty]};font-size:7px">${m.difficulty}</span>
                <span style="font-weight:600;color:#e2e8f0;font-size:10px">${m.name}</span>
              </div>
              <span style="font-size:8px;color:#6b7280">${m.duration}</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:3px;font-size:8px">
              <span style="color:#60a5fa">${m.completed}/${m.enrolled} completed</span>
              <span style="color:#22c55e">Avg: ${m.avgScore}%</span>
              <span style="color:#f59e0b">Pass: ${m.passRate}%</span>
            </div>
          </div>
        `)}
        <div style="margin-top:6px;font-size:10px;font-weight:600;color:#e2e8f0;margin-bottom:4px">Phishing Simulation Results</div>
        ${this._phishingSimResults.map(ps => html`
          <div style="padding:4px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div>
              <span style="color:#e2e8f0;font-weight:600">${ps.campaign}</span>
              <span style="color:#6b7280;margin-left:4px">${ps.date}</span>
            </div>
            <div style="display:flex;gap:6px">
              <span style="color:${ps.clickRate < 10 ? '#22c55e' : '#ef4444'}">Click: ${ps.clickRate}%</span>
              <span style="color:#3b82f6">Report: ${ps.reportRate}%</span>
              <span style="color:${ps.credentialRate < 2 ? '#22c55e' : '#ef4444'}">Creds: ${ps.credentialRate}%</span>
            </div>
          </div>
        `)}
        <div style="margin-top:6px;font-size:10px;font-weight:600;color:#e2e8f0;margin-bottom:4px">Department Compliance Scorecard</div>
        ${this._deptScores.map(d => html`
          <div style="padding:4px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <span style="color:#e2e8f0;font-weight:600;min-width:80px">${d.dept}</span>
            <div style="display:flex;gap:8px;flex:1;justify-content:center">
              <span style="color:#60a5fa">Compliance: ${d.complianceScore}%</span>
              <span style="color:#22c55e">Training: ${d.trainingCompletion}%</span>
              <span style="color:#f59e0b">Phishing: ${d.phishingResilience}%</span>
            </div>
            <span style="color:${d.trend === 'up' ? '#22c55e' : d.trend === 'down' ? '#ef4444' : '#6b7280'}">${trendIcons[d.trend]} ${d.trend}</span>
          </div>
        `)}
      </div>`;
  }


  // === DevSecOps Pipeline Module ===
  @state() private _pipelineStages: Array<{ name: string; status: 'passed' | 'failed' | 'running' | 'skipped'; duration: string; tools: string[] }> = [
    { name: 'Source Checkout', status: 'passed', duration: '3s', tools: ['Git'] },
    { name: 'Dependency Scan (SCA)', status: 'passed', duration: '45s', tools: ['OWASP Dep-Check', 'Snyk'] },
    { name: 'SAST Analysis', status: 'failed', duration: '2m 15s', tools: ['SonarQube', 'Semgrep'] },
    { name: 'Secret Detection', status: 'passed', duration: '12s', tools: ['TruffleHog', 'GitLeaks'] },
    { name: 'Container Build', status: 'passed', duration: '1m 30s', tools: ['Docker', 'Buildkit'] },
    { name: 'Image Scan', status: 'running', duration: '...', tools: ['Trivy', 'Grype'] },
    { name: 'DAST Scan', status: 'skipped', duration: '-', tools: ['OWASP ZAP'] },
    { name: 'IaC Security Check', status: 'passed', duration: '28s', tools: ['Checkov', 'tfsec'] },
    { name: 'License Compliance', status: 'passed', duration: '8s', tools: ['FOSSA'] },
    { name: 'Deploy to Staging', status: 'skipped', duration: '-', tools: ['ArgoCD'] },
  ];
  @state() private _sastFindings: Array<{ id: string; file: string; line: number; rule: string; severity: 'critical' | 'high' | 'medium' | 'low'; status: 'open' | 'fixed' }> = [
    { id: 'sast-001', file: 'auth/handler.go', line: 142, rule: 'SQL Injection (G101)', severity: 'critical', status: 'open' },
    { id: 'sast-002', file: 'api/middleware.go', line: 87, rule: 'Hardcoded Secret (G101)', severity: 'critical', status: 'open' },
    { id: 'sast-003', file: 'utils/crypto.go', line: 23, rule: 'Weak Encryption (G401)', severity: 'high', status: 'fixed' },
    { id: 'sast-004', file: 'config/config.go', line: 56, rule: 'Insecure TLS Config (G402)', severity: 'high', status: 'open' },
    { id: 'sast-005', file: 'handlers/upload.go', line: 198, rule: 'Path Traversal (G304)', severity: 'high', status: 'fixed' },
  ];
  @state() private _secretsFound: Array<{ id: string; file: string; type: string; masked: string; status: 'open' | 'revoked' }> = [
    { id: 'sec-001', file: '.env.example', type: 'AWS Access Key', masked: 'AKIA****7H3X', status: 'open' },
    { id: 'sec-002', file: 'docker-compose.yml', type: 'Database Password', masked: 'postgres****123', status: 'revoked' },
    { id: 'sec-003', file: 'scripts/deploy.sh', type: 'API Token', masked: 'ghp_****a8kF', status: 'open' },
  ];
  @state() private _securityDebt: Array<{ id: string; title: string; priority: 'p0' | 'p1' | 'p2'; age: string; effort: string; assignee: string }> = [
    { id: 'sd-001', title: 'Upgrade all deps to non-vulnerable versions', priority: 'p0', age: '14 days', effort: '3 days', assignee: 'platform-team' },
    { id: 'sd-002', title: 'Implement CSP headers on all endpoints', priority: 'p1', age: '30 days', effort: '1 day', assignee: 'web-team' },
    { id: 'sd-003', title: 'Migrate from SHA1 to SHA256 signing', priority: 'p1', age: '45 days', effort: '2 days', assignee: 'crypto-team' },
  ];

  private _renderDevSecOpsPipeline(): any {
    const statusColors: Record<string, string> = { passed: '#22c55e', failed: '#ef4444', running: '#3b82f6', skipped: '#6b7280' };
    const sevColors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#6b7280' };
    const priColors: Record<string, string> = { p0: '#ef4444', p1: '#f97316', p2: '#f59e0b' };
    return html`
      <div style="padding:12px;background:#0a0c10;border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">\u{1F6E0}\uFE0F DevSecOps Pipeline</span>
          <span style="font-size:9px;color:#3b82f6">Build #4821 | main branch</span>
        </div>
        <div style="font-size:10px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Pipeline Stages</div>
        <div style="display:flex;flex-wrap:wrap;gap:3px;margin-bottom:8px">
          ${this._pipelineStages.map(s => html`
            <div style="padding:4px 8px;background:#111827;border-radius:4px;border-left:3px solid ${statusColors[s.status]};font-size:8px;min-width:100px">
              <div style="color:#e2e8f0;font-weight:600">${s.name}</div>
              <div style="display:flex;justify-content:space-between;margin-top:2px">
                <span style="color:${statusColors[s.status]};text-transform:uppercase">${s.status}</span>
                <span style="color:#6b7280">${s.duration}</span>
              </div>
              <div style="color:#4b5563;margin-top:1px">${s.tools.join(', ')}</div>
            </div>
          `)}
        </div>
        <div style="font-size:10px;font-weight:600;color:#e2e8f0;margin-bottom:4px">SAST Findings (${this._sastFindings.filter(f => f.status === 'open').length} open)</div>
        ${this._sastFindings.map(f => html`
          <div style="padding:3px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px;border-left:2px solid ${sevColors[f.severity]}">
            <div>
              <span style="color:${sevColors[f.severity]};font-weight:600;text-transform:uppercase">${f.severity}</span>
              <span style="color:#e2e8f0;margin-left:4px">${f.rule}</span>
              <span style="color:#6b7280;margin-left:4px">${f.file}:${f.line}</span>
            </div>
            <span style="color:${f.status === 'fixed' ? '#22c55e' : '#ef4444'}">${f.status}</span>
          </div>
        `)}
        <div style="margin-top:6px;font-size:10px;font-weight:600;color:#e2e8f0;margin-bottom:4px">Secrets Detected (${this._secretsFound.filter(s => s.status === 'open').length} open)</div>
        ${this._secretsFound.map(s => html`
          <div style="padding:3px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div><span style="color:#e2e8f0">${s.type}</span><span style="color:#6b7280;margin-left:4px">${s.file}</span><span style="color:#4b5563;margin-left:4px;font-family:monospace">${s.masked}</span></div>
            <span style="color:${s.status === 'revoked' ? '#22c55e' : '#ef4444'}">${s.status}</span>
          </div>
        `)}
        <div style="margin-top:6px;font-size:10px;font-weight:600;color:#e2e8f0;margin-bottom:4px">Security Debt Backlog</div>
        ${this._securityDebt.map(d => html`
          <div style="padding:3px 8px;background:#111827;border-radius:3px;margin-bottom:2px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
            <div><span style="color:${priColors[d.priority]};font-weight:700">${d.priority.toUpperCase()}</span><span style="color:#e2e8f0;margin-left:4px">${d.title}</span></div>
            <div style="display:flex;gap:6px;color:#6b7280"><span>${d.age}</span><span>${d.effort}</span><span>${d.assignee}</span></div>
          </div>
        `)}
      </div>`;
  }
  @state() private _dseAle: number = 0;
  @state() private _dseSroi: number = 0;
  @state() private _dseCpi: number = 0;
  @state() private _dseBudgetAlloc: number = 0;
  @state() private _dseCostBenefit: number = 0;

  // Security Economics Calculator
  private dseInitEconomics() {
    this._dseAle = Math.round(2850000 + Math.random() * 4500000);
    this._dseSroi = Math.round(180 + Math.random() * 320);
    this._dseCpi = Math.round(45000 + Math.random() * 120000);
    this._dseBudgetAlloc = Math.round(2500000 + Math.random() * 3000000);
    this._dseCostBenefit = Math.round(220 + Math.random() * 180);
  }

  private _dseCalcAle(): { annual: number; perIncident: number; byCategory: Array<{name: string; value: number}> } {
    const base = this._dseAle;
    const categories = [
      { name: "Data Breach", value: Math.round(base * 0.35) },
      { name: "Ransomware", value: Math.round(base * 0.25) },
      { name: "Insider Threat", value: Math.round(base * 0.18) },
      { name: "Business Disruption", value: Math.round(base * 0.12) },
      { name: "Regulatory Fines", value: Math.round(base * 0.10) }
    ];
    return { annual: base, perIncident: Math.round(base / (3 + Math.floor(Math.random() * 8))), byCategory: categories };
  }

  private _dseCalcSroi(): Array<{year: number; investment: number; savings: number; roi: number}> {
    const baseInv = this._dseSroi * 10000;
    const projections: Array<{year: number; investment: number; savings: number; roi: number}> = [];
    for (let i = 1; i <= 5; i++) {
      const inv = Math.round(baseInv * (1 + 0.08 * i));
      const savings = Math.round(inv * (0.6 + i * 0.25));
      projections.push({ year: 2026 + i, investment: inv, savings, roi: Math.round((savings - inv) / inv * 100) });
    }
    return projections;
  }

  private _dseGetBudgetAlloc(): Array<{category: string; amount: number; pct: number; trend: string}> {
    const total = this._dseBudgetAlloc;
    const items = [
      { category: "Detection & Monitoring", pct: 28, trend: "up" },
      { category: "Endpoint Protection", pct: 22, trend: "stable" },
      { category: "Identity & Access", pct: 18, trend: "up" },
      { category: "Incident Response", pct: 15, trend: "up" },
      { category: "Training & Awareness", pct: 10, trend: "stable" },
      { category: "GRC & Compliance", pct: 7, trend: "down" }
    ];
    return items.map(it => ({ ...it, amount: Math.round(total * it.pct / 100) }));
  }

  private _dseGetCostBenefit(): Array<{control: string; cost: number; benefit: number; ratio: number; priority: string}> {
    const base = this._dseCostBenefit;
    const controls = [
      { control: "SIEM Upgrade", costMul: 0.15, benMul: 0.30 },
      { control: "Zero Trust Network", costMul: 0.22, benMul: 0.35 },
      { control: "EDR Deployment", costMul: 0.12, benMul: 0.25 },
      { control: "Security Training", costMul: 0.06, benMul: 0.18 },
      { control: "Pen Testing", costMul: 0.08, benMul: 0.20 },
      { control: "Cloud Security Posture", costMul: 0.10, benMul: 0.28 }
    ];
    return controls.map(c => {
      const cost = Math.round(base * 10000 * c.costMul);
      const benefit = Math.round(base * 10000 * c.benMul);
      const ratio = Math.round((benefit / cost) * 100) / 100;
      return { ...c, control: c.control, cost, benefit, ratio, priority: ratio > 2.5 ? "High" : ratio > 1.8 ? "Medium" : "Low" };
    });
  }

  private _dseRenderEconomics() {
    const ale = this._dseCalcAle();
    const roi = this._dseCalcSroi();
    const budget = this._dseGetBudgetAlloc();
    const cb = this._dseGetCostBenefit();
    const cpi = this._dseCpi;
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Security Economics Calculator</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
          <div style="background:#1a1d27;border-radius:6px;padding:10px;text-align:center">
            <div style="color:#888;font-size:9px">Annual Loss Expectancy</div>
            <div style="color:#f44;font-size:18px;font-weight:bold">${ale.annual.toLocaleString()}</div>
            <div style="color:#666;font-size:9px">${ale.perIncident.toLocaleString()} per incident</div>
          </div>
          <div style="background:#1a1d27;border-radius:6px;padding:10px;text-align:center">
            <div style="color:#888;font-size:9px">Security ROI (5yr)</div>
            <div style="color:#4f4;font-size:18px;font-weight:bold">${roi[4]?.roi || 0}%</div>
            <div style="color:#666;font-size:9px">Net: ${(roi[4]?.savings - roi[4]?.investment || 0).toLocaleString()}</div>
          </div>
          <div style="background:#1a1d27;border-radius:6px;padding:10px;text-align:center">
            <div style="color:#888;font-size:9px">Cost Per Incident</div>
            <div style="color:#ff8;font-size:18px;font-weight:bold">${cpi.toLocaleString()}</div>
            <div style="color:#666;font-size:9px">Insurance offset: ${Math.round(cpi * 0.35).toLocaleString()}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Budget Allocation</div>
            ${budget.map(b => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span style="color:#888;font-size:9px;width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.category}</span>
                <div style="flex:1;background:#1a1d27;border-radius:3px;height:8px;overflow:hidden">
                  <div style="height:100%;width:${b.pct}%;background:${b.trend === "up" ? "#4f4" : b.trend === "down" ? "#f84" : "#48f"}"></div>
                </div>
                <span style="color:#ddd;font-size:9px;width:50px;text-align:right">${b.pct}%</span>
              </div>`)}</div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Cost-Benefit Analysis</div>
            ${cb.map(c => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span style="color:#888;font-size:9px;width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${c.control}</span>
                <span style="color:${c.priority === "High" ? "#4f4" : c.priority === "Medium" ? "#ff8" : "#f84"};font-size:9px;width:40px">${c.priority}</span>
                <span style="color:#ddd;font-size:9px">${c.ratio}x</span>
              </div>`)}</div>
        </div>
      </div>`;
  }

  @state() private _dseThreatLevel: any = null;
  @state() private _dseEmergingThreats: any = null;
  @state() private _dseThreatTrends: any = null;
  @state() private _dseSectorRadar: any = null;
  @state() private _dseActorActivity: any = null;

  // Threat Landscape Intelligence
  private dseInitThreatIntel() {
    this._dseThreatLevel = {
      americas: Math.round(50 + Math.random() * 40),
      europe: Math.round(40 + Math.random() * 45),
      asiaPacific: Math.round(55 + Math.random() * 35),
      middleEast: Math.round(45 + Math.random() * 50),
      africa: Math.round(30 + Math.random() * 40)
    };
    this._dseEmergingThreats = [
      { name: "AI-Powered Phishing", severity: "Critical", region: "Global", trend: "up" },
      { name: "RaaS Evolution", severity: "High", region: "Americas", trend: "up" },
      { name: "Supply Chain Compromise", severity: "Critical", region: "APAC", trend: "stable" },
      { name: "Zero-Day Exploitation", severity: "High", region: "Europe", trend: "up" },
      { name: "Cloud Misconfiguration", severity: "Medium", region: "Global", trend: "up" },
      { name: "IoT Botnet Expansion", severity: "Medium", region: "APAC", trend: "stable" },
      { name: "Deepfake Social Eng.", severity: "High", region: "Europe", trend: "up" },
      { name: "Cryptojacking Surge", severity: "Low", region: "Americas", trend: "down" },
      { name: "State-Sponsored APT", severity: "Critical", region: "ME", trend: "stable" },
      { name: "Insider Data Theft", severity: "High", region: "Global", trend: "up" }
    ];
    this._dseThreatTrends = [
      { month: "Jan", phishing: 142, malware: 89, ransomware: 34 },
      { month: "Feb", phishing: 158, malware: 95, ransomware: 38 },
      { month: "Mar", phishing: 175, malware: 102, ransomware: 42 },
      { month: "Apr", phishing: 163, malware: 98, ransomware: 39 }
    ];
    this._dseSectorRadar = [
      { sector: "Financial", risk: 82, trend: "up" },
      { sector: "Healthcare", risk: 78, trend: "up" },
      { sector: "Technology", risk: 71, trend: "stable" },
      { sector: "Government", risk: 85, trend: "up" },
      { sector: "Energy", risk: 68, trend: "down" }
    ];
    this._dseActorActivity = [
      { actor: "APT-29", country: "Russia", activity: 85, targets: "Government" },
      { actor: "Lazarus", country: "DPRK", activity: 72, targets: "Financial" },
      { actor: "APT-41", country: "China", activity: 68, targets: "Technology" },
      { actor: "Fancy Bear", country: "Russia", activity: 64, targets: "Healthcare" },
      { actor: "Charming Kitten", country: "Iran", activity: 58, targets: "Energy" }
    ];
  }

  private _dseRenderThreatIntel() {
    const tl = this._dseThreatLevel;
    const et = this._dseEmergingThreats;
    const sr = this._dseSectorRadar;
    const aa = this._dseActorActivity;
    const sevColor = (s: string) => s === "Critical" ? "#f44" : s === "High" ? "#f84" : s === "Medium" ? "#ff8" : "#4f4";
    const regions = ["americas","europe","asiaPacific","middleEast","africa"] as const;
    const regionLabels: Record<string,string> = {americas:"Americas",europe:"Europe",asiaPacific:"APAC",middleEast:"Middle East",africa:"Africa"};
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Threat Landscape Intelligence</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Global Threat Levels</div>
            ${regions.map(r => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span style="color:#888;font-size:9px;width:80px">${regionLabels[r]}</span>
                <div style="flex:1;background:#1a1d27;border-radius:3px;height:8px;overflow:hidden">
                  <div style="height:100%;width:${tl[r]}%;background:${tl[r] > 75 ? "#f44" : tl[r] > 50 ? "#f84" : "#4f4"}"></div>
                </div>
                <span style="color:#ddd;font-size:9px;width:24px;text-align:right">${tl[r]}</span>
              </div>`)}</div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Emerging Threats</div>
            ${et.slice(0, 6).map(t => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                <div style="width:6px;height:6px;border-radius:50%;background:${sevColor(t.severity)}"></div>
                <span style="color:#ccc;font-size:9px;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.name}</span>
                <span style="color:${t.trend === "up" ? "#f44" : t.trend === "down" ? "#4f4" : "#888"};font-size:9px">${t.trend === "up" ? "^" : t.trend === "down" ? "v" : "-"}</span>
              </div>`)}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Sector Threat Radar</div>
            ${sr.map(s => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span style="color:#888;font-size:9px;width:70px">${s.sector}</span>
                <div style="flex:1;background:#1a1d27;border-radius:3px;height:8px;overflow:hidden">
                  <div style="height:100%;width:${s.risk}%;background:${s.risk > 80 ? "#f44" : s.risk > 65 ? "#f84" : "#ff8"}"></div>
                </div>
                <span style="color:#ddd;font-size:9px;width:24px;text-align:right">${s.risk}</span>
              </div>`)}</div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Threat Actor Activity</div>
            ${aa.map(a => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span style="color:#ccc;font-size:9px;width:80px">${a.actor}</span>
                <span style="color:#666;font-size:9px;width:50px">${a.country}</span>
                <div style="flex:1;background:#1a1d27;border-radius:3px;height:6px;overflow:hidden">
                  <div style="height:100%;width:${a.activity}%;background:#f84"></div>
                </div>
                <span style="color:#888;font-size:9px">${a.activity}</span>
              </div>`)}</div>
        </div>
      </div>`;
  }

  @state() private _dsePolicies: any = null;
  @state() private _dseExceptions: any = null;
  @state() private _dseRiskRegister: any = null;
  @state() private _dseMeetings: any = null;
  @state() private _dseDeadlines: any = null;

  // Security Governance Dashboard
  private dseInitGovernance() {
    this._dsePolicies = [
      { name: "Information Security", compliance: 92, lastReview: "2026-03-15", status: "Active" },
      { name: "Access Control", compliance: 88, lastReview: "2026-03-01", status: "Active" },
      { name: "Data Protection", compliance: 95, lastReview: "2026-04-01", status: "Active" },
      { name: "Incident Response", compliance: 78, lastReview: "2026-02-20", status: "Review" },
      { name: "Change Management", compliance: 85, lastReview: "2026-03-10", status: "Active" },
      { name: "Vendor Management", compliance: 72, lastReview: "2026-02-28", status: "Overdue" },
      { name: "Business Continuity", compliance: 81, lastReview: "2026-03-05", status: "Active" },
      { name: "Cryptography", compliance: 90, lastReview: "2026-03-20", status: "Active" },
      { name: "Physical Security", compliance: 87, lastReview: "2026-02-15", status: "Review" },
      { name: "Network Security", compliance: 93, lastReview: "2026-04-05", status: "Active" },
      { name: "Cloud Security", compliance: 76, lastReview: "2026-02-10", status: "Overdue" },
      { name: "Third-Party Risk", compliance: 70, lastReview: "2026-01-30", status: "Overdue" }
    ];
    this._dseExceptions = [
      { id: "EXC-001", policy: "Access Control", reason: "Legacy system", risk: "Medium", expiry: "2026-06-30" },
      { id: "EXC-002", policy: "Encryption", reason: "Performance", risk: "High", expiry: "2026-05-15" },
      { id: "EXC-003", policy: "Password Policy", reason: "Vendor req", risk: "Low", expiry: "2026-08-01" }
    ];
    this._dseRiskRegister = [
      { id: "RSK-001", desc: "Unpatched Exchange", likelihood: 4, impact: 5, owner: "IT Ops" },
      { id: "RSK-002", desc: "Shadow IT SaaS", likelihood: 3, impact: 4, owner: "CISO" },
      { id: "RSK-003", desc: "Privileged Access Creep", likelihood: 3, impact: 5, owner: "IAM Team" },
      { id: "RSK-004", desc: "DR Plan Gaps", likelihood: 2, impact: 5, owner: "BCP Lead" },
      { id: "RSK-005", desc: "Vendor Data Sharing", likelihood: 3, impact: 3, owner: "Legal" }
    ];
    this._dseMeetings = [
      { name: "Security Steering", date: "2026-04-25", attendees: 8, status: "Scheduled" },
      { name: "Risk Committee", date: "2026-04-18", attendees: 6, status: "Completed" },
      { name: "Audit Review", date: "2026-05-02", attendees: 5, status: "Pending" }
    ];
    this._dseDeadlines = [
      { regulation: "SOC 2 Type II", deadline: "2026-06-15", daysLeft: 53, status: "On Track" },
      { regulation: "GDPR Annual Review", deadline: "2026-05-25", daysLeft: 32, status: "At Risk" },
      { regulation: "ISO 27001 Audit", deadline: "2026-07-20", daysLeft: 88, status: "On Track" },
      { regulation: "PCI DSS v4.0", deadline: "2026-08-30", daysLeft: 129, status: "Planning" }
    ];
  }

  private _dseRenderGovernance() {
    const policies = this._dsePolicies;
    const risks = this._dseRiskRegister;
    const deadlines = this._dseDeadlines;
    const statusColor = (s: string) => s === "Active" ? "#4f4" : s === "Overdue" ? "#f44" : "#ff8";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Security Governance Dashboard</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Policy Compliance (12 policies)</div>
            ${policies.slice(0, 6).map(pol => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                <div style="width:6px;height:6px;border-radius:50%;background:${statusColor(pol.status)}"></div>
                <span style="color:#ccc;font-size:9px;flex:1">${pol.name}</span>
                <span style="color:${pol.compliance >= 85 ? "#4f4" : pol.compliance >= 75 ? "#ff8" : "#f44"};font-size:9px">${pol.compliance}%</span>
              </div>`)}</div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Risk Register Heat Map</div>
            ${risks.map(r => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span style="color:#ccc;font-size:9px;flex:1">${r.desc}</span>
                <span style="color:#888;font-size:8px">L${r.likelihood}/I${r.impact}</span>
                <div style="width:24px;height:12px;border-radius:2px;background:${(r.likelihood * r.impact) >= 15 ? "#f44" : (r.likelihood * r.impact) >= 10 ? "#f84" : "#ff8"};opacity:0.8"></div>
              </div>`)}</div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">Regulatory Deadline Countdown</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px">
          ${deadlines.map(d => html`<div style="background:#1a1d27;border-radius:4px;padding:8px;text-align:center">
              <div style="color:#888;font-size:8px">${d.regulation}</div>
              <div style="color:${d.daysLeft < 40 ? "#f44" : d.daysLeft < 90 ? "#ff8" : "#4f4"};font-size:16px;font-weight:bold">${d.daysLeft}d</div>
              <div style="color:#666;font-size:8px">${d.status}</div>
            </div>`)}</div>
      </div>`;
  }

  @state() private _dseCriticalAssets: any = null;
  @state() private _dseAssetDeps: any = null;
  @state() private _dseEolAssets: any = null;
  @state() private _dseAssetRisk: any = null;

  // Asset Intelligence
  private dseInitAssetIntel() {
    this._dseCriticalAssets = [
      { name: "Core Banking DB", type: "Database", impact: "Critical", risk: 85, owner: "DBA Team" },
      { name: "Customer API Gateway", type: "Service", impact: "Critical", risk: 72, owner: "Platform" },
      { name: "Active Directory", type: "Infrastructure", impact: "Critical", risk: 68, owner: "IAM" },
      { name: "Data Warehouse", type: "Database", impact: "High", risk: 55, owner: "Analytics" },
      { name: "Email Server", type: "Application", impact: "High", risk: 48, owner: "IT Ops" },
      { name: "CI/CD Pipeline", type: "DevOps", impact: "High", risk: 62, owner: "DevOps" },
      { name: "Payment Processor", type: "Service", impact: "Critical", risk: 78, owner: "Finance IT" }
    ];
    this._dseAssetDeps = [
      { from: "Web App", to: "API Gateway", type: "depends" },
      { from: "API Gateway", to: "Core Banking DB", type: "depends" },
      { from: "API Gateway", to: "Auth Service", type: "depends" },
      { from: "Auth Service", to: "Active Directory", type: "depends" },
      { from: "Payment Processor", to: "Core Banking DB", type: "depends" },
      { from: "Mobile App", to: "API Gateway", type: "depends" }
    ];
    this._dseEolAssets = [
      { name: "Windows Server 2012 R2", count: 12, eolDate: "2023-10-10", risk: "Critical" },
      { name: "Oracle 11g", count: 3, eolDate: "2025-12-31", risk: "High" },
      { name: "Cisco ASA 5505", count: 8, eolDate: "2024-07-15", risk: "High" },
      { name: "CentOS 7", count: 25, eolDate: "2024-06-30", risk: "Medium" }
    ];
    this._dseAssetRisk = { critical: 7, high: 23, medium: 45, low: 128, total: 203 };
  }

  private _dseRenderAssetIntel() {
    const assets = this._dseCriticalAssets;
    const eol = this._dseEolAssets;
    const ar = this._dseAssetRisk;
    const impactColor = (i: string) => i === "Critical" ? "#f44" : i === "High" ? "#f84" : "#ff8";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Asset Intelligence</h4>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          ${[["Critical",ar.critical,"#f44"],["High",ar.high,"#f84"],["Medium",ar.medium,"#ff8"],["Low",ar.low,"#4f4"]].map(([l,v,c]) => html`<div style="flex:1;background:#1a1d27;border-radius:4px;padding:6px;text-align:center">
              <div style="color:${c};font-size:16px;font-weight:bold">${v}</div>
              <div style="color:#888;font-size:8px">${l}</div>
            </div>`)}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Critical Assets</div>
            ${assets.slice(0, 5).map(a => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                <div style="width:6px;height:6px;border-radius:50%;background:${impactColor(a.impact)}"></div>
                <span style="color:#ccc;font-size:9px;flex:1">${a.name}</span>
                <span style="color:#888;font-size:8px">R${a.risk}</span>
              </div>`)}</div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">End-of-Life Assets</div>
            ${eol.map(e => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span style="color:#ccc;font-size:9px;flex:1">${e.name}</span>
                <span style="color:#f84;font-size:9px">${e.count} units</span>
                <div style="padding:1px 4px;border-radius:2px;background:${e.risk === "Critical" ? "#f44" : e.risk === "High" ? "#f84" : "#ff8"};color:#000;font-size:7px">${e.risk}</div>
              </div>`)}</div>
        </div>
      </div>`;
  }

  @state() private _dseUserBaseline: any = null;
  @state() private _dseAnomalyRules: any = null;
  @state() private _dseDataAccess: any = null;
  @state() private _dseInsiderRisk: any = null;
  @state() private _darksir15Timeline: Array<{id:string;time:string;event:string;severity:string;actor:string}> = [
    {id:'t1',time:'2026-01-15 08:23',event:'Anomalous login detected from external IP',severity:'high',actor:'unknown'},
    {id:'t2',time:'2026-01-15 08:45',event:'Privilege escalation via misconfigured service account',severity:'critical',actor:'SA-deploy-01'},
    {id:'t3',time:'2026-01-15 09:12',event:'Data exfiltration to external cloud storage',severity:'critical',actor:'SA-deploy-01'},
    {id:'t4',time:'2026-01-15 09:30',event:'Incident response team notified',severity:'medium',actor:'SOC Team'},
    {id:'t5',time:'2026-01-15 10:15',event:'Affected service account disabled',severity:'low',actor:'IR Lead'},
  ];
  @state() private _darksir15RootCauses: Array<{why:string;answer:string}> = [
    {why:'Why was the login anomalous?',answer:'Credentials leaked via phishing email to IT admin'},
    {why:'Why was the phishing successful?',answer:'Email filter rules were too permissive for internal domains'},
    {why:'Why were rules misconfigured?',answer:'Change review process skipped for emergency rule update'},
    {why:'Why was the review skipped?',answer:'No automated enforcement of review policy for rule changes'},
    {why:'Why no automated enforcement?',answer:'Policy-as-code implementation backlog for 6 months'},
  ];
  @state() private _darksir15ImpactMatrix: Array<{system:string;users:number;data:string;revenue:string;status:string}> = [
    {system:'Customer Database',users:12400,data:'PII of all customers',revenue:'$2.4M/day',status:'contained'},
    {system:'Payment Gateway',users:8900,data:'Tokenized payment records',revenue:'$1.8M/day',status:'unaffected'},
    {system:'HR Portal',users:3200,data:'Employee PII and payroll',revenue:'N/A',status:'investigating'},
    {system:'API Gateway',users:45000,data:'Auth tokens and API keys',revenue:'$5.1M/day',status:'contained'},
  ];
  @state() private _darksir15Actions: Array<{id:string;item:string;owner:string;deadline:string;priority:string;status:string}> = [
    {id:'a1',item:'Rotate all service account credentials',owner:'DevOps Team',deadline:'2026-01-18',priority:'critical',status:'in_progress'},
    {id:'a2',item:'Implement email filter policy-as-code',owner:'Email Admin',deadline:'2026-01-22',priority:'high',status:'pending'},
    {id:'a3',item:'Deploy automated change review enforcement',owner:'Platform Team',deadline:'2026-01-25',priority:'high',status:'pending'},
    {id:'a4',item:'Conduct phishing awareness refresher',owner:'Security Awareness',deadline:'2026-01-20',priority:'medium',status:'assigned'},
    {id:'a5',item:'Review and update incident response playbook',owner:'IR Team',deadline:'2026-01-30',priority:'low',status:'pending'},
  ];
  @state() private _darksir15Lessons: Array<{id:string;lesson:string;category:string;severity:string;applies_to:string}> = [
    {id:'l1',lesson:'Service accounts must have MFA enabled regardless of automation needs',category:'Identity',severity:'high',applies_to:'All service accounts'},
    {id:'l2',lesson:'Emergency changes still require post-incident review within 24 hours',category:'Process',severity:'high',applies_to:'All infrastructure changes'},
    {id:'l3',lesson:'Email filter rules must be version controlled and peer reviewed',category:'Email Security',severity:'medium',applies_to:'Email infrastructure'},
    {id:'l4',lesson:'Data exfiltration detection latency must be under 5 minutes',category:'Monitoring',severity:'medium',applies_to:'DLP systems'},
  ];
  @state() private _darksir15ActiveTab: string = 'timeline';
  @state() private _darksir15Benchmarks: Array<{metric:string;current:number;industry:number;target:number;unit:string;source:string}> = [
    {metric:'Mean Time to Detect',current:4.2,industry:6.8,target:3.0,unit:'hours',source:'SANS 2026'},
    {metric:'Mean Time to Respond',current:2.1,industry:4.5,target:1.0,unit:'hours',source:'SANS 2026'},
    {metric:'Patch Compliance',current:87,industry:72,target:95,unit:'%',source:'CIS Benchmark'},
    {metric:'Vuln Remediation SLA',current:78,industry:65,target:90,unit:'%',source:'Gartner'},
    {metric:'Phishing Click Rate',current:3.2,industry:12.5,target:2.0,unit:'%',source:'KnowBe4'},
    {metric:'MFA Coverage',current:94,industry:68,target:100,unit:'%',source:'CIS Controls'},
  ];
  @state() private _darksir15MaturityLevels: Array<{domain:string;current:number;target:number;description:string}> = [
    {domain:'Identity and Access',current:4,target:5,description:'Strong MFA, automated provisioning, JIT access'},
    {domain:'Network Security',current:3,target:4,description:'Micro-segmentation partial, ZTNA in progress'},
    {domain:'Data Protection',current:3,target:4,description:'DLP deployed, encryption at rest in progress'},
    {domain:'Vulnerability Mgmt',current:4,target:5,description:'Automated scanning, risk-based prioritization'},
    {domain:'Incident Response',current:3,target:4,description:'Playbooks defined, automation growing'},
    {domain:'Governance and Risk',current:3,target:4,description:'Framework aligned, continuous monitoring building'},
  ];
  @state() private _darksir15QuarterlyData: Array<{quarter:string;score:number;improvement:number}> = [
    {quarter:'Q1 2025',score:62,improvement:0},{quarter:'Q2 2025',score:67,improvement:5},
    {quarter:'Q3 2025',score:71,improvement:4},{quarter:'Q4 2025',score:74,improvement:3},
    {quarter:'Q1 2026',score:78,improvement:4},
  ];
  @state() private _darksir15SelectedDomain: string = 'all';
  @state() private _darksir15Alerts: Array<{id:string;name:string;severity:number;confidence:number;assetCrit:number;score:number;enriched:boolean;group:string;status:string;enrichData:Array<{key:string;value:string}>}> = [
    {id:'al1',name:'Brute force login attempt on prod-db',severity:5,confidence:0.9,assetCrit:5,score:0,enriched:true,group:'auth',status:'triaged',enrichData:[{key:'Source IP',value:'203.0.113.42'},{key:'Country',value:'Russia'},{key:'Threat Intel',value:'Known APT IP'}]},
    {id:'al2',name:'Unusual data transfer to external endpoint',severity:4,confidence:0.7,assetCrit:4,score:0,enriched:true,group:'exfil',status:'escalated',enrichData:[{key:'Destination',value:'s3-eu-west.amazonaws.com'},{key:'Volume',value:'2.4 GB in 30 min'},{key:'Reputation',value:'Neutral'}]},
    {id:'al3',name:'Privilege escalation attempt detected',severity:5,confidence:0.85,assetCrit:5,score:0,enriched:false,group:'auth',status:'new',enrichData:[]},
    {id:'al4',name:'Suspicious PowerShell execution',severity:3,confidence:0.5,assetCrit:3,score:0,enriched:false,group:'host',status:'new',enrichData:[]},
    {id:'al5',name:'Failed SSL certificate validation',severity:2,confidence:0.95,assetCrit:2,score:0,enriched:true,group:'net',status:'dismissed',enrichData:[{key:'Host',value:'api.internal.corp'},{key:'Expiry',value:'2026-01-10'}]},
  ];
  @state() private _darksir15QualityMetrics: {fpRate:number;enrichSuccess:number;avgTriageTime:number;enrichedCount:number;totalCount:number} = {fpRate:0.12, enrichSuccess:0.78, avgTriageTime:4.5, enrichedCount:3, totalCount:5};
  @state() private _darksir15RoutingRules: Array<{name:string;condition:string;channel:string;active:boolean}> = [
    {name:'Critical Asset Alert',condition:'asset_criticality >= 5 && severity >= 4',channel:'SOC Phone Bridge',active:true},
    {name:'Data Exfiltration',condition:'group == exfil && severity >= 3',channel:'IR Slack Channel',active:true},
    {name:'Authentication Anomaly',condition:'group == auth && confidence >= 0.8',channel:'SOC Dashboard',active:true},
    {name:'Low Priority Host',condition:'severity <= 2 && asset_criticality <= 2',channel:'Email Digest',active:false},
  ];
  @state() private _darksir15Shapes: Array<{id:string;type:string;label:string;controls:string[]}> = [
    {id:'sh1',type:'server',label:'Web Server',controls:['WAF','TLS','Rate Limit']},
    {id:'sh2',type:'database',label:'User DB',controls:['Encryption','Access Control','Audit Log']},
    {id:'sh3',type:'service',label:'Auth Service',controls:['MFA','OAuth2','RBAC']},
    {id:'sh4',type:'firewall',label:'Perimeter FW',controls:['IDS/IPS','Geo-block','DDoS Protection']},
    {id:'sh5',type:'cloud',label:'Cloud API',controls:['API Gateway','Throttling','Input Validation']},
    {id:'sh6',type:'user',label:'End Users',controls:['Device Mgmt','Policy Enforcement','ZTNA']},
    {id:'sh7',type:'process',label:'CI/CD Pipeline',controls:['SAST','DAST','SCA','Container Scan']},
    {id:'sh8',type:'storage',label:'Object Storage',controls:['KMS','Versioning','Lifecycle Policy']},
    {id:'sh9',type:'network',label:'Internal Network',controls:['Micro-seg','DNS Security','NAC']},
    {id:'sh10',type:'monitor',label:'SIEM',controls:['Log Collection','Correlation','Alerting','Forensics']},
  ];
  @state() private _darksir15TrustBoundaries: Array<{from:string;to:string;label:string;strength:string}> = [
    {from:'sh1',to:'sh4',label:'External Boundary',strength:'strong'},
    {from:'sh2',to:'sh5',label:'Data Boundary',strength:'strong'},
    {from:'sh3',to:'sh6',label:'Identity Boundary',strength:'medium'},
    {from:'sh7',to:'sh8',label:'Build Boundary',strength:'weak'},
  ];
  @state() private _darksir15ADRs: Array<{id:string;title:string;status:string;date:string;decision:string}> = [
    {id:'adr-001',title:'Adopt Zero Trust Network Architecture',status:'accepted',date:'2025-11-15',decision:'Replace VPN with ZTNA for all remote access'},
    {id:'adr-002',title:'Implement Service Mesh for East-West Traffic',status:'proposed',date:'2026-01-10',decision:'Deploy Istio with mTLS for all internal service communication'},
    {id:'adr-003',title:'Consolidate SIEM to Single Platform',status:'accepted',date:'2025-09-20',decision:'Migrate from Splunk+QRadar to unified Elastic SIEM'},
    {id:'adr-004',title:'Enforce Policy-as-Code for All Infrastructure',status:'in_review',date:'2026-02-01',decision:'Use Open Policy Agent for admission control and compliance checks'},
  ];
  @state() private _darksir15SelectedShape: string = '';
  @state() private _darksir15Gauges: Array<{name:string;value:number;max:number;unit:string;status:string;color:string}> = [
    {name:'API Response Time',value:142,max:500,unit:'ms',status:'healthy',color:'#4f4'},
    {name:'Error Rate',value:0.3,max:5,unit:'%',status:'healthy',color:'#4f4'},
    {name:'CPU Utilization',value:67,max:100,unit:'%',status:'warning',color:'#fa0'},
    {name:'Memory Usage',value:4.2,max:8,unit:'GB',status:'healthy',color:'#4f4'},
    {name:'Active Connections',value:1247,max:2000,unit:'',status:'healthy',color:'#4f4'},
    {name:'Queue Depth',value:342,max:500,unit:'',status:'warning',color:'#fa0'},
  ];
  @state() private _darksir15Anomalies: Array<{id:string;time:string;description:string;severity:string;acknowledged:boolean}> = [
    {id:'an1',time:'10:42:15',description:'Spike in failed authentication attempts from 10.0.0.0/8',severity:'high',acknowledged:false},
    {id:'an2',time:'10:38:22',description:'Unusual data transfer volume on DB replication channel',severity:'medium',acknowledged:true},
    {id:'an3',time:'10:25:07',description:'Certificate expiry warning for api.internal.corp (7 days)',severity:'low',acknowledged:false},
    {id:'an4',time:'10:12:44',description:'DNS query pattern matches DGA domain characteristics',severity:'high',acknowledged:false},
  ];
  @state() private _darksir15Integrations: Array<{name:string;status:string;uptime:number;lastCheck:string;latency:number}> = [
    {name:'SIEM Connector',status:'online',uptime:99.97,lastCheck:'10:45:00',latency:12},
    {name:'EDR Feed',status:'online',uptime:99.95,lastCheck:'10:45:00',latency:45},
    {name:'Threat Intel API',status:'degraded',uptime:98.2,lastCheck:'10:44:30',latency:230},
    {name:'Cloud Provider API',status:'online',uptime:99.99,lastCheck:'10:45:00',latency:8},
    {name:'Email Gateway',status:'online',uptime:99.98,lastCheck:'10:45:00',latency:15},
  ];
  @state() private _darksir15AlertFatigue: Array<{analyst:string;alertsPerDay:number;escalated:number;dismissed:number;avgResponseMin:number}> = [
    {analyst:'Alice Chen',alertsPerDay:45,escalated:8,dismissed:12,avgResponseMin:3.2},
    {analyst:'Bob Martinez',alertsPerDay:62,escalated:11,dismissed:18,avgResponseMin:5.1},
    {analyst:'Carol Kim',alertsPerDay:38,escalated:5,dismissed:10,avgResponseMin:2.8},
    {analyst:'Dave Wilson',alertsPerDay:71,escalated:14,dismissed:22,avgResponseMin:6.4},
  ];
  @state() private _darksir15SlaTarget: number = 99.9;

  // Insider Threat Detection
  private dseInitInsiderThreat() {
    this._dseUserBaseline = [
      { user: "admin_jdoe", avgLogins: 18, avgFiles: 45, avgNetwork: 2.3, riskScore: 12 },
      { user: "dev_ssmith", avgLogins: 22, avgFiles: 120, avgNetwork: 5.1, riskScore: 25 },
      { user: "mgr_jchen", avgLogins: 8, avgFiles: 30, avgNetwork: 1.2, riskScore: 8 },
      { user: "analyst_mlee", avgLogins: 15, avgFiles: 85, avgNetwork: 3.4, riskScore: 18 },
      { user: "contractor_abrown", avgLogins: 12, avgFiles: 200, avgNetwork: 8.7, riskScore: 42 }
    ];
    this._dseAnomalyRules = [
      { rule: "After-hours access", enabled: true, triggers: 3, severity: "Medium" },
      { rule: "Mass download detection", enabled: true, triggers: 1, severity: "Critical" },
      { rule: "Privilege escalation", enabled: true, triggers: 0, severity: "High" },
      { rule: "Unusual data transfer", enabled: true, triggers: 5, severity: "High" },
      { rule: "Account sharing pattern", enabled: false, triggers: 2, severity: "Medium" },
      { rule: "Departure data spike", enabled: true, triggers: 0, severity: "Critical" }
    ];
    this._dseDataAccess = [
      { resource: "Customer PII DB", accesses: 1245, anomalous: 18, trend: "up" },
      { resource: "Financial Reports", accesses: 832, anomalous: 5, trend: "stable" },
      { resource: "Source Code Repo", accesses: 2100, anomalous: 32, trend: "up" },
      { resource: "Trade Secrets", accesses: 156, anomalous: 8, trend: "up" }
    ];
    this._dseInsiderRisk = { totalUsers: 2847, monitored: 342, flagged: 18, investigated: 5, confirmed: 1 };
  }

  private _dseRenderInsiderThreat() {
    const baseline = this._dseUserBaseline;
    const rules = this._dseAnomalyRules;
    const ir = this._dseInsiderRisk;
    const sevColor = (s: string) => s === "Critical" ? "#f44" : s === "High" ? "#f84" : "#ff8";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Insider Threat Detection</h4>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          ${[["Monitored",ir.monitored,"#48f"],["Flagged",ir.flagged,"#f84"],["Investigated",ir.investigated,"#ff8"],["Confirmed",ir.confirmed,"#f44"]].map(([l,v,c]) => html`<div style="flex:1;background:#1a1d27;border-radius:4px;padding:6px;text-align:center">
              <div style="color:${c};font-size:16px;font-weight:bold">${v}</div>
              <div style="color:#888;font-size:8px">${l}</div>
            </div>`)}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Anomaly Detection Rules</div>
            ${rules.map(r => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                <div style="width:6px;height:6px;border-radius:50%;background:${r.enabled ? "#4f4" : "#666"}"></div>
                <span style="color:#ccc;font-size:9px;flex:1">${r.rule}</span>
                <span style="color:${sevColor(r.severity)};font-size:8px">${r.triggers}</span>
              </div>`)}</div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">User Behavior Risk Scores</div>
            ${baseline.sort((a: any, b: any) => b.riskScore - a.riskScore).slice(0, 5).map(u => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
                <span style="color:#ccc;font-size:9px;flex:1">${u.user}</span>
                <div style="width:40px;background:#1a1d27;border-radius:3px;height:6px;overflow:hidden">
                  <div style="height:100%;width:${Math.min(100, u.riskScore * 2)}%;background:${u.riskScore > 30 ? "#f44" : u.riskScore > 15 ? "#f84" : "#4f4"}"></div>
                </div>
                <span style="color:#ddd;font-size:9px">${u.riskScore}</span>
              </div>`)}</div>
        
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Incident Post-Mortem Engine</h4>
          <div style="display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap">
            ${['timeline','rootcause','impact','actions','lessons'].map(t => html`
              <button class="btn ${this._darksir15ActiveTab === t ? 'btn-primary' : ''}" style="font-size:10px;padding:3px 8px" @click=${() => { this._darksir15ActiveTab = t; }}>${t.charAt(0).toUpperCase() + t.slice(1)}</button>
            `)}
          </div>
          ${this._darksir15ActiveTab === 'timeline' ? html`
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._darksir15Timeline.map(e => html`
                <div style="display:flex;gap:8px;align-items:flex-start;padding:6px;background:#1a1d27;border-radius:4px;border-left:3px solid ${e.severity === 'critical' ? '#f44' : e.severity === 'high' ? '#fa0' : e.severity === 'medium' ? '#ff0' : '#4f4'}">
                  <span style="color:#888;font-size:10px;min-width:110px">${e.time}</span>
                  <span style="color:#ddd;font-size:11px;flex:1">${e.event}</span>
                  <span style="color:#888;font-size:10px">${e.actor}</span>
                </div>
              `)}
            </div>
          ` : this._darksir15ActiveTab === 'rootcause' ? html`
            <div style="margin-bottom:8px">${{__html: this._darksir15RenderFishbone()}}</div>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._darksir15RootCauses.map((rc, i) => html`
                <div style="display:flex;gap:8px;align-items:flex-start;padding:6px;background:#1a1d27;border-radius:4px">
                  <span style="color:#4a9eff;font-size:10px;min-width:20px">${i + 1}.</span>
                  <div style="flex:1"><div style="color:#aaa;font-size:10px">${rc.why}</div><div style="color:#ddd;font-size:11px">${rc.answer}</div></div>
                </div>
              `)}
            </div>
          ` : this._darksir15ActiveTab === 'impact' ? html`
            <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:10px">
              <thead><tr style="color:#888"><th style="text-align:left;padding:4px">System</th><th style="padding:4px">Users</th><th style="text-align:left;padding:4px">Data</th><th style="padding:4px">Revenue</th><th style="padding:4px">Status</th></tr></thead>
              <tbody>${this._darksir15ImpactMatrix.map(imp => html`
                <tr style="border-top:1px solid #2a2d37"><td style="padding:4px;color:#ddd">${imp.system}</td><td style="padding:4px;color:#aaa;text-align:center">${imp.users.toLocaleString()}</td><td style="padding:4px;color:#aaa">${imp.data}</td><td style="padding:4px;color:#fa0;text-align:center">${imp.revenue}</td><td style="padding:4px"><span style="color:${imp.status === 'contained' ? '#4f4' : imp.status === 'investigating' ? '#fa0' : '#f44'};font-size:9px;padding:2px 6px;background:${imp.status === 'contained' ? 'rgba(0,255,0,0.1)' : imp.status === 'investigating' ? 'rgba(255,170,0,0.1)' : 'rgba(255,0,0,0.1)'};border-radius:3px">${imp.status}</span></td></tr>
              `)}</tbody>
            </table></div>
          ` : this._darksir15ActiveTab === 'actions' ? html`
            <div style="display:flex;gap:12px;margin-bottom:8px;font-size:10px;color:#888">
              ${Object.entries(this._darksir15GetActionStats()).map(([k,v]) => html`<span>${k}: <b style="color:#ddd">${v}</b></span>`)}
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._darksir15Actions.map(a => html`
                <div style="display:flex;gap:8px;align-items:center;padding:6px;background:#1a1d27;border-radius:4px;cursor:pointer" @click=${() => this._darksir15ToggleAction(a.id)}>
                  <span style="color:${a.status === 'completed' ? '#4f4' : a.status === 'in_progress' ? '#4a9eff' : '#888'};font-size:12px">${a.status === 'completed' ? '\u2713' : '\u25CB'}</span>
                  <span style="color:${a.status === 'completed' ? '#666' : '#ddd'};font-size:11px;flex:1;${a.status === 'completed' ? 'text-decoration:line-through' : ''}">${a.item}</span>
                  <span style="color:#888;font-size:9px">${a.owner}</span>
                  <span style="color:#888;font-size:9px">${a.deadline}</span>
                  <span style="color:${a.priority === 'critical' ? '#f44' : a.priority === 'high' ? '#fa0' : '#888'};font-size:9px">${a.priority}</span>
                </div>
              `)}
            </div>
          ` : html`
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._darksir15Lessons.map(l => html`
                <div style="padding:8px;background:#1a1d27;border-radius:4px;border-left:3px solid ${l.severity === 'high' ? '#fa0' : '#4a9eff'}">
                  <div style="display:flex;gap:6px;margin-bottom:4px"><span style="color:#4a9eff;font-size:9px;padding:1px 4px;background:rgba(74,158,255,0.1);border-radius:2px">${l.category}</span><span style="color:${l.severity === 'high' ? '#fa0' : '#888'};font-size:9px">${l.severity}</span></div>
                  <div style="color:#ddd;font-size:11px">${l.lesson}</div>
                  <div style="color:#888;font-size:9px;margin-top:3px">Applies to: ${l.applies_to}</div>
                </div>
              `)}
            </div>
          `}
        </div>

        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Security Metrics Benchmarking</h4>
          <div style="display:flex;gap:4px;margin-bottom:10px;flex-wrap:wrap">
            ${['all', ...this._darksir15MaturityLevels.map(m => m.domain)].map(d => html`
              <button class="btn ${this._darksir15SelectedDomain === d ? 'btn-primary' : ''}" style="font-size:9px;padding:2px 6px" @click=${() => { this._darksir15SelectedDomain = d; }}>${d}</button>
            `)}
          </div>
          <div style="display:flex;gap:16px;margin-bottom:10px">
            <div style="text-align:center"><div style="color:#e0e0e0;font-size:20px;font-weight:bold">${this._darksir15GetOverallMaturity()}/5</div><div style="color:#888;font-size:10px">Maturity Level</div></div>
            <div style="text-align:center"><div style="color:#4f4;font-size:20px;font-weight:bold">${this._darksir15GetGapAnalysis().filter(g => g.isAbove).length}/${this._darksir15Benchmarks.length}</div><div style="color:#888;font-size:10px">Above Industry</div></div>
          </div>
          <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead><tr style="color:#888"><th style="text-align:left;padding:3px">Metric</th><th style="padding:3px">Current</th><th style="padding:3px">Industry</th><th style="padding:3px">Target</th><th style="padding:3px">Gap</th><th style="padding:3px">Source</th></tr></thead>
            <tbody>${this._darksir15GetGapAnalysis().map(b => html`
              <tr style="border-top:1px solid #2a2d37"><td style="padding:3px;color:#ddd">${b.metric}</td><td style="padding:3px;color:#e0e0e0;text-align:center;font-weight:bold">${b.current}${b.unit}</td><td style="padding:3px;color:#888;text-align:center">${b.industry}${b.unit}</td><td style="padding:3px;color:#4a9eff;text-align:center">${b.target}${b.unit}</td><td style="padding:3px;text-align:center;color:${b.isAbove ? '#4f4' : '#fa0'}">${b.isAbove ? '+' : ''}${b.gap.toFixed(1)}</td><td style="padding:3px;color:#666;font-size:9px">${b.source}</td></tr>
            `)}</tbody>
          </table></div>
          <div style="margin-top:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Maturity by Domain</div>
            ${this._darksir15MaturityLevels.filter(m => this._darksir15SelectedDomain === 'all' || m.domain === this._darksir15SelectedDomain).map(m => html`
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
                <span style="color:#aaa;font-size:10px;min-width:100px">${m.domain}</span>
                <div style="flex:1;background:#1a1d27;border-radius:3px;height:8px;overflow:hidden"><div style="height:100%;width:${m.current * 20}%;background:${m.current >= 4 ? '#4f4' : m.current >= 3 ? '#fa0' : '#f44'};border-radius:3px"></div></div>
                <span style="color:#ddd;font-size:10px;min-width:40px">${m.current}/5</span>
              </div>
            `)}
          </div>
          <div style="margin-top:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Quarterly Trend</div>
            <div style="display:flex;height:40px;align-items:flex-end;gap:4px">
              ${this._darksir15QuarterlyData.map(q => html`<div style="flex:1;text-align:center"><div style="background:#4a9eff;height:${q.score * 0.5}px;border-radius:2px 2px 0 0" title="${q.score}"></div><div style="color:#666;font-size:8px;margin-top:2px">${q.quarter}</div></div>`)}
            </div>
          </div>
        </div>

        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Alert Triage and Enrichment</h4>
          <div style="display:flex;gap:12px;margin-bottom:8px;font-size:10px">
            <div style="display:flex;gap:4px;flex-wrap:wrap">${this._darksir15GroupAlerts().map(g => html`<span style="color:#888;padding:2px 6px;background:#1a1d27;border-radius:3px">${g.group}: ${g.count}</span>`)}</div>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:8px;font-size:10px;color:#888">
            <span>FP Rate: <b style="color:${this._darksir15QualityMetrics.fpRate > 0.15 ? '#f44' : '#4f4'}">${(this._darksir15QualityMetrics.fpRate * 100).toFixed(1)}%</b></span>
            <span>Enrich: <b style="color:#4a9eff">${(this._darksir15QualityMetrics.enrichSuccess * 100).toFixed(0)}%</b></span>
            <span>Avg Triage: <b style="color:#ddd">${this._darksir15QualityMetrics.avgTriageTime}m</b></span>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto">
            ${this._darksir15Alerts.sort((a, b) => this._darksir15CalcScore(b) - this._darksir15CalcScore(a)).map(a => {
              const score = this._darksir15CalcScore(a);
              return html`
                <div style="padding:6px;background:#1a1d27;border-radius:4px;border-left:3px solid ${a.severity >= 4 ? '#f44' : a.severity >= 3 ? '#fa0' : '#4a9eff'}">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="color:#ddd;font-size:11px;flex:1">${a.name}</span>
                    <span style="color:#e0e0e0;font-size:12px;font-weight:bold;min-width:40px;text-align:center">${score.toFixed(1)}</span>
                    <button class="btn" style="font-size:9px;padding:1px 6px;margin-left:4px" @click=${() => this._darksir15EnrichAlert(a.id)}>${a.enriched ? 'Re-enrich' : 'Enrich'}</button>
                  </div>
                  ${a.enriched && a.enrichData && a.enrichData.length > 0 ? html`
                    <div style="display:flex;gap:8px;margin-top:4px;flex-wrap:wrap">
                      ${a.enrichData.map(ed => html`<span style="color:#888;font-size:9px">${ed.key}: <b style="color:#aaa">${ed.value}</b></span>`)}
                    </div>
                  ` : ''}
                  <div style="display:flex;gap:6px;margin-top:3px">
                    <span style="color:#666;font-size:9px">Sev:${a.severity}</span>
                    <span style="color:#666;font-size:9px">Conf:${(a.confidence * 100).toFixed(0)}%</span>
                    <span style="color:#666;font-size:9px">Crit:${a.assetCrit}</span>
                    <span style="color:${a.status === 'escalated' ? '#f44' : a.status === 'triaged' ? '#4a9eff' : a.status === 'dismissed' ? '#888' : '#fa0'};font-size:9px">${a.status}</span>
                  </div>
                </div>`;
            })}
          </div>
          <div style="margin-top:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Routing Rules</div>
            ${this._darksir15RoutingRules.map(r => html`
              <div style="display:flex;gap:6px;align-items:center;padding:3px;background:#1a1d27;border-radius:3px;margin-bottom:2px;font-size:9px">
                <span style="color:${r.active ? '#4f4' : '#f44'}">${r.active ? '\u25CF' : '\u25CB'}</span>
                <span style="color:#ddd">${r.name}</span>
                <span style="color:#888;flex:1">${r.condition}</span>
                <span style="color:#4a9eff">${r.channel}</span>
              </div>
            `)}
          </div>
        </div>

        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Security Architecture Review</h4>
          <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
            ${this._darksir15Shapes.map(s => {
              const v = this._darksir15ValidateControl(s.id);
              return html`<div style="padding:4px 8px;background:#1a1d27;border-radius:3px;cursor:pointer;border:1px solid ${this._darksir15SelectedShape === s.id ? '#4a9eff' : '#2a2d37'}" @click=${() => { this._darksir15SelectedShape = this._darksir15SelectedShape === s.id ? '' : s.id; }}>
                <div style="display:flex;align-items:center;gap:4px"><span style="color:${v.valid ? '#4f4' : '#f44'};font-size:10px">${v.valid ? '\u2713' : '\u2717'}</span><span style="color:#ddd;font-size:10px">${s.label}</span></div>
                <div style="color:#888;font-size:8px">${s.controls.length} controls</div>
              </div>`;
            })}
          </div>
          ${this._darksir15SelectedShape ? html`
            ${(() => {
              const shape = this._darksir15Shapes.find(s => s.id === this._darksir15SelectedShape);
              const v = this._darksir15ValidateControl(this._darksir15SelectedShape);
              return shape ? html`
                <div style="padding:8px;background:#1a1d27;border-radius:4px;margin-bottom:8px">
                  <div style="color:#e0e0e0;font-size:12px;font-weight:bold;margin-bottom:4px">${shape.label}</div>
                  <div style="color:#888;font-size:10px;margin-bottom:4px">Controls: ${shape.controls.join(', ')}</div>
                  ${!v.valid ? html`<div style="color:#f44;font-size:10px">Missing: ${v.missing.join(', ')}</div>` : html`<div style="color:#4f4;font-size:10px">All required controls present</div>`}
                </div>
              ` : '';
            })()}
          ` : ''}
          <div style="margin-bottom:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Trust Boundaries</div>
            ${this._darksir15TrustBoundaries.map(tb => html`
              <div style="display:flex;gap:6px;align-items:center;padding:3px;background:#1a1d27;border-radius:3px;margin-bottom:2px;font-size:9px">
                <span style="color:#ddd">${this._darksir15Shapes.find(s => s.id === tb.from)?.label || tb.from}</span>
                <span style="color:#4a9eff">\u2194</span>
                <span style="color:#ddd">${this._darksir15Shapes.find(s => s.id === tb.to)?.label || tb.to}</span>
                <span style="flex:1"></span>
                <span style="color:#888">${tb.label}</span>
                <span style="color:${tb.strength === 'strong' ? '#4f4' : tb.strength === 'medium' ? '#fa0' : '#f44'};font-size:9px;padding:1px 4px;border-radius:2px;background:${tb.strength === 'strong' ? 'rgba(0,255,0,0.1)' : tb.strength === 'medium' ? 'rgba(255,170,0,0.1)' : 'rgba(255,0,0,0.1)'}">${tb.strength}</span>
              </div>
            `)}
          </div>
          <div><div style="color:#888;font-size:10px;margin-bottom:4px">Architecture Decision Records</div>
            ${this._darksir15ADRs.map(adr => html`
              <div style="padding:4px;background:#1a1d27;border-radius:3px;margin-bottom:2px">
                <div style="display:flex;gap:6px;align-items:center">
                  <span style="color:#4a9eff;font-size:9px">${adr.id}</span>
                  <span style="color:#ddd;font-size:10px">${adr.title}</span>
                  <span style="color:${adr.status === 'accepted' ? '#4f4' : adr.status === 'proposed' ? '#fa0' : '#888'};font-size:9px">${adr.status}</span>
                </div>
                <div style="color:#888;font-size:9px;margin-top:2px">${adr.decision}</div>
              </div>
            `)}
          </div>
        </div>

        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Continuous Monitoring Suite</h4>
          <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap">
            ${this._darksir15Gauges.map(g => html`
              <div style="flex:1;min-width:100px;padding:6px;background:#1a1d27;border-radius:4px;text-align:center">
                <div style="color:#888;font-size:9px;margin-bottom:2px">${g.name}</div>
                <div style="color:${g.status === 'healthy' ? '#4f4' : g.status === 'warning' ? '#fa0' : '#f44'};font-size:18px;font-weight:bold">${g.value}${g.unit}</div>
                <div style="background:#2a2d37;border-radius:3px;height:4px;margin-top:4px;overflow:hidden"><div style="height:100%;width:${(g.value / g.max * 100)}%;background:${g.color};border-radius:3px"></div></div>
              </div>
            `)}
          </div>
          <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
            <span style="color:#888;font-size:10px">System Health:</span>
            <span style="color:${this._darksir15GetOverallHealth().score >= 99 ? '#4f4' : '#fa0'};font-size:12px;font-weight:bold">${this._darksir15GetOverallHealth().score}%</span>
            <span style="color:#888;font-size:10px">(Target: ${this._darksir15SlaTarget}%)</span>
            <span style="color:#4f4;font-size:10px">${this._darksir15GetOverallHealth().healthy} healthy</span>
            <span style="color:#fa0;font-size:10px">${this._darksir15GetOverallHealth().degraded} degraded</span>
          </div>
          <div style="margin-bottom:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Anomaly Stream</div>
            ${this._darksir15Anomalies.slice(0, 3).map(a => html`
              <div style="display:flex;gap:6px;align-items:center;padding:4px;background:#1a1d27;border-radius:3px;margin-bottom:2px;opacity:${a.acknowledged ? 0.5 : 1}">
                <span style="color:#888;font-size:9px;min-width:50px">${a.time}</span>
                <span style="color:${a.severity === 'high' ? '#f44' : a.severity === 'medium' ? '#fa0' : '#888'};font-size:9px;min-width:30px">${a.severity.toUpperCase()}</span>
                <span style="color:#ddd;font-size:10px;flex:1">${a.description}</span>
                ${!a.acknowledged ? html`<button class="btn" style="font-size:8px;padding:1px 4px" @click=${() => this._darksir15AckAnomaly(a.id)}>ACK</button>` : html`<span style="color:#4f4;font-size:9px">ACK'd</span>`}
              </div>
            `)}
          </div>
          <div style="margin-bottom:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Integration Health</div>
            ${this._darksir15Integrations.map(i => html`
              <div style="display:flex;gap:6px;align-items:center;padding:3px;background:#1a1d27;border-radius:3px;margin-bottom:2px;font-size:9px">
                <span style="color:${i.status === 'online' ? '#4f4' : i.status === 'degraded' ? '#fa0' : '#f44'};font-size:10px">${i.status === 'online' ? '\u25CF' : i.status === 'degraded' ? '\u25D0' : '\u25A0'}</span>
                <span style="color:#ddd;min-width:110px">${i.name}</span>
                <span style="color:#888">${i.uptime}%</span>
                <span style="color:#888">${i.latency}ms</span>
                <span style="color:#666">${i.lastCheck}</span>
              </div>
            `)}
          </div>
          <div><div style="color:#888;font-size:10px;margin-bottom:4px">Alert Fatigue Analysis</div>
            <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:9px">
              <thead><tr style="color:#888"><th style="text-align:left;padding:3px">Analyst</th><th style="padding:3px">Alerts/Day</th><th style="padding:3px">Escalated</th><th style="padding:3px">Dismissed</th><th style="padding:3px">Avg Response</th><th style="padding:3px">Fatigue Risk</th></tr></thead>
              <tbody>${this._darksir15AlertFatigue.map(af => html`
                <tr style="border-top:1px solid #2a2d37"><td style="padding:3px;color:#ddd">${af.analyst}</td><td style="padding:3px;color:${af.alertsPerDay > 60 ? '#f44' : af.alertsPerDay > 40 ? '#fa0' : '#4f4'};text-align:center">${af.alertsPerDay}</td><td style="padding:3px;color:#aaa;text-align:center">${af.escalated}</td><td style="padding:3px;color:#888;text-align:center">${af.dismissed}</td><td style="padding:3px;color:#aaa;text-align:center">${af.avgResponseMin}m</td><td style="padding:3px;text-align:center;color:${af.alertsPerDay > 60 ? '#f44' : af.alertsPerDay > 40 ? '#fa0' : '#4f4'}">${af.alertsPerDay > 60 ? 'HIGH' : af.alertsPerDay > 40 ? 'MEDIUM' : 'LOW'}</td></tr>
              `)}</tbody>
            </table></div>
          </div>
        </div>
</div>
      </div>`;
  }

  private _darksir15RenderFishbone(): string {
    const categories = ['People','Process','Technology','Environment','Communication','Policy'];
    const bones = categories.map((cat, i) => {
      const angle = 30 + i * 20;
      return '<line x1="200" y1="150" x2="' + (200 + Math.cos(angle * Math.PI / 180) * 140) + '" y2="' + (150 - Math.sin(angle * Math.PI / 180) * 140) + '" stroke="#4a9eff" stroke-width="1.5"/><text x="' + (200 + Math.cos(angle * Math.PI / 180) * 145) + '" y="' + (150 - Math.sin(angle * Math.PI / 180) * 145) + '" fill="#e0e0e0" font-size="9" text-anchor="middle">' + cat + '</text>';
    }).join('');
    return '<svg width="400" height="300" viewBox="0 0 400 300"><line x1="60" y1="150" x2="340" y2="150" stroke="#e0e0e0" stroke-width="2"/><line x1="200" y1="30" x2="200" y2="270" stroke="#e0e0e0" stroke-width="2"/><text x="200" y="290" fill="#fa0" font-size="11" text-anchor="middle" font-weight="bold">Service Account Compromise</text>' + bones + '</svg>';
  }

  private _darksir15ToggleAction(id: string) {
    this._darksir15Actions = this._darksir15Actions.map(a => a.id === id ? {...a, status: a.status === 'pending' ? 'in_progress' : a.status === 'in_progress' ? 'completed' : 'pending'} : a);
  }

  private _darksir15GetActionStats() {
    const total = this._darksir15Actions.length;
    const done = this._darksir15Actions.filter(a => a.status === 'completed').length;
    const inProg = this._darksir15Actions.filter(a => a.status === 'in_progress').length;
    return { total, done, inProg, pending: total - done - inProg };
  }

  private _darksir15GetOverallMaturity(): number {
    if (this._darksir15SelectedDomain === 'all') {
      return Math.round(this._darksir15MaturityLevels.reduce((s, m) => s + m.current, 0) / this._darksir15MaturityLevels.length * 10) / 10;
    }
    const d = this._darksir15MaturityLevels.find(m => m.domain === this._darksir15SelectedDomain);
    return d ? d.current : 0;
  }

  private _darksir15GetGapAnalysis() {
    return this._darksir15Benchmarks.map(b => {
      const gap = b.current - b.industry;
      const targetGap = b.target - b.current;
      const isAbove = gap > 0;
      return { ...b, gap, targetGap, isAbove, status: isAbove ? 'exceeds' : targetGap > 0 ? 'improving' : 'on_track' };
    });
  }

  private _darksir15CalcScore(alert: any): number {
    return Math.round(alert.severity * alert.confidence * alert.assetCrit * 100) / 100;
  }

  private _darksir15EnrichAlert(id: string) {
    this._darksir15Alerts = this._darksir15Alerts.map(a => {
      if (a.id !== id) return a;
      const score = this._darksir15CalcScore(a);
      return { ...a, enriched: true, score, enrichData: a.enrichData.length > 0 ? a.enrichData : [{key:'Auto-Enriched',value:'Simulated at ' + new Date().toLocaleTimeString()},{key:'Reputation',value: Math.random() > 0.5 ? 'Malicious' : 'Neutral'},{key:'Geo',value: 'US-EAST'}] };
    });
  }

  private _darksir15GroupAlerts() {
    const groups: Record<string, number> = {};
    this._darksir15Alerts.forEach(a => { groups[a.group] = (groups[a.group] || 0) + 1; });
    return Object.entries(groups).map(([g, c]) => ({group: g, count: c}));
  }

  private _darksir15ValidateControl(shapeId: string): {valid:boolean;missing:string[]} {
    const shape = this._darksir15Shapes.find(s => s.id === shapeId);
    if (!shape) return {valid: false, missing: ['Unknown component']};
    const required: Record<string, string[]> = {
      server: ['TLS'], database: ['Encryption','Access Control'], service: ['MFA'],
      firewall: ['IDS/IPS'], cloud: ['API Gateway'], user: ['ZTNA'],
      process: ['SAST','DAST'], storage: ['KMS'], network: ['Micro-seg'], monitor: ['Log Collection','Alerting']
    };
    const req = required[shape.type] || [];
    const missing = req.filter(c => !shape.controls.includes(c));
    return { valid: missing.length === 0, missing };
  }

  private _darksir15GetOverallHealth(): {healthy:number;degraded:number;down:number;score:number} {
    const online = this._darksir15Integrations.filter(i => i.status === 'online').length;
    const degraded = this._darksir15Integrations.filter(i => i.status === 'degraded').length;
    const total = this._darksir15Integrations.length;
    return { healthy: online, degraded, down: total - online - degraded, score: Math.round(online / total * 100) };
  }

  private _darksir15AckAnomaly(id: string) {
    this._darksir15Anomalies = this._darksir15Anomalies.map(a => a.id === id ? {...a, acknowledged: true} : a);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-dark-sim-engine': ScDarkSimEngine;
  }
}
