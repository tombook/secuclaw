/**
 * sc-champions - Champions
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

@customElement('sc-champions')
export class ScChampions extends LitElement {
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
    .sla-bar { height: 6px; border-radius: 3px; background: #1e293b; overflow: hidden; margin-top: 4px; }
    .sla-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .sla-expired { background: #ef4444; }
    .sla-warning { background: #f97316; }
    .sla-ok { background: #22c55e; }
    .workflow-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .workflow-table th { text-align: left; padding: 8px 10px; border-bottom: 1px solid #374151; color: #94a3b8; font-weight: 600; font-size: 11px; cursor: pointer; user-select: none; white-space: nowrap; }
    .workflow-table th:hover { color: #f59e0b; }
    .workflow-table th .sort-arrow { margin-left: 4px; font-size: 10px; }
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
    .pipeline-connector { display: flex; align-items: center; color: #374151; font-size: 16px; }
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
    .sparkline-cell { display: inline-block; vertical-align: middle; }

  `;

  @state() private _searchQuery = '';
  @state() private _severityFilter: Severity | 'all' = 'all';
  @state() private _statusFilter: Status | 'all' = 'all';
  @state() private _activeTab: 'overview' | 'details' | 'trends' | 'history' | 'new' | 'workflow' | 'execute' | 'settings' = 'overview';
  @state() private _expandedId: string | null = null;
  @state() private _sortField: 'severity' | 'date' | 'title' | 'assignee' | 'priority' = 'date';
  @state() private _sortAsc = false;
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
    { id: 'c1', author: 'soc-tier1', timestamp: '2026-04-23 04:00', text: 'Initial assessment started for Champions finding #1' },
    { id: 'c2', author: 'security-eng', timestamp: '2026-04-23 04:15', text: 'Confirmed this is related to the endpoint detection rule update' },
    { id: 'c3', author: 'manager', timestamp: '2026-04-23 05:00', text: 'Prioritize resolution - potential compliance impact' },
  ];

  private _items: PanelItem[] = [
      {
            "id": "champions-1",
            "title": "Champions Finding #1",
            "severity": "low",
            "status": "open",
            "category": "Security",
            "source": "SIEM",
            "description": "Automated champions assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-15T00:00:00Z",
            "assignee": "soc-tier1",
            "tags": [
                  "champions",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 15,
            "stepsTaken": []
      },
      {
            "id": "champions-2",
            "title": "Champions Finding #2",
            "severity": "medium",
            "status": "open",
            "category": "Network",
            "source": "EDR",
            "description": "Automated champions assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-16T02:00:00Z",
            "assignee": "soc-tier2",
            "tags": [
                  "champions",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 30,
            "stepsTaken": []
      },
      {
            "id": "champions-3",
            "title": "Champions Finding #3",
            "severity": "high",
            "status": "open",
            "category": "Access",
            "source": "Scanner",
            "description": "Automated champions assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-17T04:00:00Z",
            "assignee": "security-eng",
            "tags": [
                  "champions",
                  "automated"
            ],
            "priority": "p3",
            "slaMinutes": 60,
            "stepsTaken": []
      },
      {
            "id": "champions-4",
            "title": "Champions Finding #4",
            "severity": "low",
            "status": "open",
            "category": "Compliance",
            "source": "Audit",
            "description": "Automated champions assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-18T06:00:00Z",
            "assignee": "compliance",
            "tags": [
                  "champions",
                  "automated"
            ],
            "priority": "p4",
            "slaMinutes": 120,
            "stepsTaken": []
      },
      {
            "id": "champions-5",
            "title": "Champions Finding #5",
            "severity": "medium",
            "status": "open",
            "category": "Operations",
            "source": "Manual",
            "description": "Automated champions assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-19T08:00:00Z",
            "assignee": "ops",
            "tags": [
                  "champions",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 240,
            "stepsTaken": []
      },
      {
            "id": "champions-6",
            "title": "Champions Finding #6",
            "severity": "high",
            "status": "open",
            "category": "Security",
            "source": "SIEM",
            "description": "Automated champions assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-20T10:00:00Z",
            "assignee": "soc-tier1",
            "tags": [
                  "champions",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 15,
            "stepsTaken": []
      },
      {
            "id": "champions-7",
            "title": "Champions Finding #7",
            "severity": "low",
            "status": "open",
            "category": "Network",
            "source": "EDR",
            "description": "Automated champions assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-21T12:00:00Z",
            "assignee": "soc-tier2",
            "tags": [
                  "champions",
                  "automated"
            ],
            "priority": "p3",
            "slaMinutes": 30,
            "stepsTaken": []
      },
      {
            "id": "champions-8",
            "title": "Champions Finding #8",
            "severity": "medium",
            "status": "open",
            "category": "Access",
            "source": "Scanner",
            "description": "Automated champions assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-22T14:00:00Z",
            "assignee": "security-eng",
            "tags": [
                  "champions",
                  "automated"
            ],
            "priority": "p4",
            "slaMinutes": 60,
            "stepsTaken": []
      },
      {
            "id": "champions-9",
            "title": "Champions Finding #9",
            "severity": "high",
            "status": "open",
            "category": "Compliance",
            "source": "Audit",
            "description": "Automated champions assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-23T16:00:00Z",
            "assignee": "compliance",
            "tags": [
                  "champions",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 120,
            "stepsTaken": []
      },
      {
            "id": "champions-10",
            "title": "Champions Finding #10",
            "severity": "low",
            "status": "open",
            "category": "Operations",
            "source": "Manual",
            "description": "Automated champions assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-24T18:00:00Z",
            "assignee": "ops",
            "tags": [
                  "champions",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 240,
            "stepsTaken": []
      }
];

  private _history: HistoryEntry[] = [
    { timestamp: '2026-04-23 04:15', action: 'Auto-correlated', user: 'system', details: 'Grouped related findings from Champions analysis' },
    { timestamp: '2026-04-23 03:00', action: 'Created', user: 'scanner', details: 'New Champions finding detected by automated assessment' },
    { timestamp: '2026-04-23 02:30', action: 'Escalated', user: 'soc-tier1', details: 'Escalated critical finding to tier 2 for investigation' },
    { timestamp: '2026-04-23 01:00', action: 'Updated', user: 'soc-tier2', details: 'Added investigation notes and IOC indicators' },
    { timestamp: '2026-04-22 22:00', action: 'Resolved', user: 'security-eng', details: 'Remediation applied and verified for Champions finding' },
    { timestamp: '2026-04-22 18:00', action: 'Created', user: 'audit', details: 'Compliance audit identified Champions gap requiring remediation' },
    { timestamp: '2026-04-22 14:00', action: 'Acknowledged', user: 'ops-team', details: 'Operations team acknowledged finding and created remediation task' },
    { timestamp: '2026-04-22 10:00', action: 'Assigned', user: 'manager', details: 'Finding assigned to security engineering team for resolution' },
    { timestamp: '2026-04-21 16:00', action: 'Resolved', user: 'soc-tier1', details: 'False positive confirmed - benign activity flagged by Champions scan' },
    { timestamp: '2026-04-21 12:00', action: 'Exported', user: 'compliance', details: 'Exported Champions findings for Q1 compliance report' },
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

  private _workflowTasks: WorkflowTask[] = [
    { id: 'wt-1', title: 'Review Champions finding #1', status: 'active', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T12:00:00Z', priority: 'p1', createdAt: '2026-04-23T00:00:00Z', completedAt: null },
    { id: 'wt-2', title: 'Remediate critical endpoint misconfiguration', status: 'pending', assignee: 'security-eng', blockedBy: ['wt-1'], slaDeadline: '2026-04-23T16:00:00Z', priority: 'p1', createdAt: '2026-04-23T02:00:00Z', completedAt: null },
    { id: 'wt-3', title: 'Update Champions detection rules', status: 'blocked', assignee: 'soc-tier2', blockedBy: ['wt-2'], slaDeadline: '2026-04-24T00:00:00Z', priority: 'p2', createdAt: '2026-04-23T03:00:00Z', completedAt: null },
    { id: 'wt-4', title: 'Generate compliance report', status: 'pending', assignee: 'compliance', blockedBy: [], slaDeadline: '2026-04-24T08:00:00Z', priority: 'p3', createdAt: '2026-04-23T04:00:00Z', completedAt: null },
    { id: 'wt-5', title: 'Validate remediation for finding #6', status: 'completed', assignee: 'security-eng', blockedBy: [], slaDeadline: '2026-04-23T10:00:00Z', priority: 'p2', createdAt: '2026-04-22T18:00:00Z', completedAt: '2026-04-23T08:00:00Z' },
    { id: 'wt-6', title: 'Notify stakeholders of findings', status: 'completed', assignee: 'manager', blockedBy: [], slaDeadline: '2026-04-23T06:00:00Z', priority: 'p3', createdAt: '2026-04-22T20:00:00Z', completedAt: '2026-04-23T04:00:00Z' },
    { id: 'wt-7', title: 'Schedule follow-up scan', status: 'pending', assignee: 'ops', blockedBy: ['wt-2'], slaDeadline: '2026-04-25T00:00:00Z', priority: 'p4', createdAt: '2026-04-23T05:00:00Z', completedAt: null },
    { id: 'wt-8', title: 'Archive resolved Champions findings', status: 'failed', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T08:00:00Z', priority: 'p4', createdAt: '2026-04-22T22:00:00Z', completedAt: null },
  ];

  private _executionHistory: ExecutionRecord[] = [
    {
      id: 'exec-1', name: 'Champions Full Assessment Run', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:12:00Z', status: 'success',
      steps: [
        { id: 's1', name: 'Validate Scope', status: 'success', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:00:30Z', duration: 30, output: 'Scope validated: 142 targets' },
        { id: 's2', name: 'Collect Evidence', status: 'success', startedAt: '2026-04-22T10:00:30Z', completedAt: '2026-04-22T10:06:00Z', duration: 330, output: '1,847 events collected from 12 sources' },
        { id: 's3', name: 'Analyze Patterns', status: 'success', startedAt: '2026-04-22T10:06:00Z', completedAt: '2026-04-22T10:10:00Z', duration: 240, output: '23 patterns identified, 7 correlated' },
        { id: 's4', name: 'Generate Report', status: 'success', startedAt: '2026-04-22T10:10:00Z', completedAt: '2026-04-22T10:12:00Z', duration: 120, output: 'Report generated: 10 findings, 3 critical' },
      ],
    },
    {
      id: 'exec-2', name: 'Champions Delta Scan', startedAt: '2026-04-23T02:00:00Z', completedAt: '2026-04-23T02:05:00Z', status: 'failed',
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
      id: 'exec-' + Date.now(), name: 'Champions Assessment ' + new Date().toISOString().slice(0, 10), startedAt: new Date().toISOString(), completedAt: null, status: 'running', steps,
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
        ` : html`<div class="empty-state">Click "Run Assessment" to start the Champions analysis pipeline</div>`}
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
              const a = document.createElement('a'); a.href = url; a.download = 'champions-config.json'; a.click();
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
          <input class="search-box" type="text" placeholder="Add a comment..." style="min-width:auto;flex:1;" id="champions-comment-input" />
          <button class="btn primary" @click=${() => {
            const input = this.shadowRoot?.querySelector('#champions-comment-input') as HTMLInputElement;
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

  private _exportJSON() {
    const blob = new Blob([JSON.stringify(this._getFiltered(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sc-champions-data.json'; a.click();
    URL.revokeObjectURL(url);
  }

  private _exportCSV() {
    const items = this._getFiltered();
    const header = 'ID,Title,Severity,Status,Category,Source,Assignee,Priority,Created\n';
    const rows = items.map(i => `"${i.id}","${i.title}","${i.severity}","${i.status}","${i.category}","${i.source}","${i.assignee}","${i.priority}","${i.createdAt}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sc-champions-data.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  // === Security Chaos Engineering Module ===
  @state() private _chaosExperiments = [
    { id: 'CE-001', name: 'Network Partition Injection', type: 'network', severity: 'high',
      blastRadius: 0.7, duration: '15min', hypothesis: 'Service degradation < 10%',
      status: 'ready', lastRun: null, successRate: 0.85, category: 'resilience' },
    { id: 'CE-002', name: 'API Rate Limit Removal', type: 'api', severity: 'medium',
      blastRadius: 0.4, duration: '30min', hypothesis: 'No cascading failures',
      status: 'ready', lastRun: null, successRate: 0.92, category: 'availability' },
    { id: 'CE-003', name: 'Auth Service Latency Spike', type: 'latency', severity: 'high',
      blastRadius: 0.8, duration: '10min', hypothesis: 'Fallback auth works within 5s',
      status: 'ready', lastRun: null, successRate: 0.78, category: 'authentication' },
    { id: 'CE-004', name: 'Database Connection Pool Exhaustion', type: 'resource', severity: 'critical',
      blastRadius: 0.9, duration: '20min', hypothesis: 'Queue-based requests succeed',
      status: 'ready', lastRun: null, successRate: 0.65, category: 'data' },
    { id: 'CE-005', name: 'Certificate Expiry Simulation', type: 'crypto', severity: 'medium',
      blastRadius: 0.3, duration: '5min', hypothesis: 'Auto-renewal triggers correctly',
      status: 'ready', lastRun: null, successRate: 0.95, category: 'compliance' },
    { id: 'CE-006', name: 'DNS Resolution Failure', type: 'network', severity: 'high',
      blastRadius: 0.6, duration: '10min', hypothesis: 'DNS failover activates < 2s',
      status: 'ready', lastRun: null, successRate: 0.88, category: 'infrastructure' },
    { id: 'CE-007', name: 'Memory Pressure Injection', type: 'resource', severity: 'critical',
      blastRadius: 0.85, duration: '25min', hypothesis: 'OOM killer targets correct process',
      status: 'ready', lastRun: null, successRate: 0.72, category: 'availability' },
    { id: 'CE-008', name: 'Firewall Rule Randomization', type: 'network', severity: 'medium',
      blastRadius: 0.5, duration: '15min', hypothesis: 'Default-deny policy holds',
      status: 'ready', lastRun: null, successRate: 0.91, category: 'perimeter' },
  ] as any[];
  @state() private _chaosSelectedExperiment: string | null = null;
  @state() private _chaosTimeline: any[] = [];
  @state() private _chaosResilienceScore = 78.5;
  @state() private _chaosSteadyStateMetrics = { rps: 5000, latencyP99: 120, errorRate: 0.02, cpuUsage: 45 };

  private _calculateBlastRadius(exp: any): number {
    const factors = { network: 0.3, api: 0.2, latency: 0.25, resource: 0.35, crypto: 0.15 };
    const base = factors[exp.type] || 0.2;
    const severityMult = { low: 0.5, medium: 0.75, high: 1.0, critical: 1.5 };
    return Math.min(1.0, base * (severityMult[exp.severity] || 1.0) * exp.blastRadius);
  }

  private _validateSteadyState(metrics: any): { passed: boolean; details: string[] } {
    const details: string[] = [];
    const checks = [
      { name: 'RPS', actual: metrics.rps, threshold: 4000, op: 'gte' },
      { name: 'P99 Latency', actual: metrics.latencyP99, threshold: 200, op: 'lte' },
      { name: 'Error Rate', actual: metrics.errorRate, threshold: 0.05, op: 'lte' },
      { name: 'CPU Usage', actual: metrics.cpuUsage, threshold: 80, op: 'lte' },
    ];
    let allPassed = true;
    for (const check of checks) {
      const passed = check.op === 'gte' ? check.actual >= check.threshold : check.actual <= check.threshold;
      details.push(`${check.name}: ${passed ? 'PASS' : 'FAIL'} (${check.actual} vs ${check.threshold})`);
      if (!passed) allPassed = false;
    }
    return { passed: allPassed, details };
  }

  private _analyzeFailureModes(exp: any): string[] {
    const modes: Record<string, string[]> = {
      network: ['Connection timeout', 'Packet loss cascade', 'DNS lookup failure', 'Load balancer failover'],
      api: ['Rate limit bypass', 'Schema validation failure', 'Payload size overflow', 'Timeout cascade'],
      latency: ['Thread pool exhaustion', 'Circuit breaker trigger', 'Cache stampede', 'Queue buildup'],
      resource: ['OOM kill', 'GC pressure spike', 'File descriptor exhaustion', 'Socket leak'],
      crypto: ['Handshake timeout', 'Certificate chain break', 'HSM unavailability', 'Key rotation failure'],
    };
    return modes[exp.type] || ['Unknown failure mode', 'Unexpected behavior', 'Service degradation', 'Data corruption'];
  }

  private _trackResilienceScore(results: any[]): void {
    if (results.length === 0) return;
    const recentResults = results.slice(-10);
    const avgSuccess = recentResults.reduce((sum: number, r: any) => sum + (r.passed ? 1 : 0), 0) / recentResults.length;
    this._chaosResilienceScore = Math.round(avgSuccess * 100 * 10) / 10;
  }

  private _generateChaosTimeline(experimentId: string): any[] {
    const phases = [
      { phase: 'Initiation', duration: '0-30s', status: 'pending', description: 'Injecting chaos condition' },
      { phase: 'Steady State', duration: '30s-2min', status: 'monitoring', description: 'Observing system behavior' },
      { phase: 'Degradation', duration: '2min-5min', status: 'active', description: 'Measuring impact metrics' },
      { phase: 'Recovery', duration: '5min-10min', status: 'recovering', description: 'Testing recovery mechanisms' },
      { phase: 'Validation', duration: '10min-15min', status: 'validating', description: 'Verifying steady state restored' },
      { phase: 'Cleanup', duration: '15min+', status: 'complete', description: 'Removing chaos injection artifacts' },
    ];
    return phases.map((p, i) => ({ ...p, experimentId, order: i, timestamp: new Date().toISOString() }));
  }

  private _renderChaosEngineeringSection(): TemplateResult {
    const selected = this._chaosExperiments.find(e => e.id === this._chaosSelectedExperiment);
    return html`
      <div class="section-card">
        <div class="section-header">
          <h3>Security Chaos Engineering</h3>
          <div class="header-actions">
            <span class="metric-badge success">Resilience: ${this._chaosResilienceScore}%</span>
            <button class="btn btn-sm btn-primary" @click=${() => { this._chaosTimeline = this._generateChaosTimeline(this._chaosSelectedExperiment || 'CE-001'); }}>Run Experiment</button>
          </div>
        </div>
        <div class="chaos-grid">
          <div class="chaos-catalog">
            ${this._chaosExperiments.map(exp => html`
              <div class="chaos-experiment-card ${this._chaosSelectedExperiment === exp.id ? 'selected' : ''}" @click=${() => { this._chaosSelectedExperiment = exp.id; }}>
                <div class="exp-header">
                  <span class="exp-id">${exp.id}</span>
                  <span class="severity-badge ${exp.severity}">${exp.severity}</span>
                </div>
                <div class="exp-name">${exp.name}</div>
                <div class="exp-meta">
                  <span>Blast: ${Math.round(this._calculateBlastRadius(exp) * 100)}%</span>
                  <span>Duration: ${exp.duration}</span>
                  <span>Success: ${Math.round(exp.successRate * 100)}%</span>
                </div>
                <div class="exp-hypothesis">H: ${exp.hypothesis}</div>
              </div>
            `)}
          </div>
          ${selected ? html`
            <div class="chaos-detail">
              <h4>${selected.name} - Detail</h4>
              <div class="detail-row"><span>Type:</span><span>${selected.type}</span></div>
              <div class="detail-row"><span>Category:</span><span>${selected.category}</span></div>
              <div class="detail-row"><span>Blast Radius:</span><span>${Math.round(this._calculateBlastRadius(selected) * 100)}%</span></div>
              <div class="detail-row"><span>Failure Modes:</span>
                <ul>${this._analyzeFailureModes(selected).map(m => html`<li>${m}</li>`)}</ul>
              </div>
              <h5>Steady State Validation</h5>
              ${this._validateSteadyState(this._chaosSteadyStateMetrics).details.map(d => html`<div class="validation-item">${d}</div>`)}
              ${this._chaosTimeline.length > 0 ? html`
                <h5>Execution Timeline</h5>
                <div class="timeline">${this._chaosTimeline.map(t => html`
                  <div class="timeline-phase ${t.status}">
                    <span class="phase-name">${t.phase}</span>
                    <span class="phase-duration">${t.duration}</span>
                    <span class="phase-desc">${t.description}</span>
                  </div>
                `)}</div>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>`;
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
@state() private _spmAssetGroup4 = { id: "AST-004", name: "Asset Group 4", type: "infrastructure", criticality: "medium", assetCount: 40, complianceScore: 88, riskScore: 72, lastAssessment: "2026-01-09" } as any;
@state() private _spmNetworkSegment5 = { id: "NET-005", name: "Segment 5", subnet: "10.5.0.0/16", criticality: "high", deviceCount: 25, vulnerabilityCount: 7, lastScan: "2026-01-15" } as any;
@state() private _spmComplianceCheck6 = { id: "CHK-006", control: "Control 6", framework: "NIST 800-53", status: "pass", evidenceCount: 4, lastAudit: "2026-01-11", nextAudit: "2026-04-11", findings: 2 } as any;
  private _spmValidateCheck6(): { valid: boolean; issues: string[] } {
    const check = this._spmComplianceCheck6;
    const issues: string[] = [];
    if (check.evidenceCount < 3) issues.push("Insufficient evidence for " + check.control);
    if (check.status === "fail") issues.push("Control failure requires remediation");
    const daysToNextAudit = Math.max(0, (new Date(check.nextAudit).getTime() - Date.now()) / 86400000);
    if (daysToNextAudit < 30) issues.push("Upcoming audit in " + Math.round(daysToNextAudit) + " days");
    return { valid: issues.length === 0, issues };
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

  // === Security Compliance Automation Module ===
  private _complianceAutoChecks: Array<{checkId: string; framework: string; control: string; status: string; lastRun: string; nextRun: string; result: string; severity: string; autoRemediated: boolean; remediationAction: string}> = [];
  private _policyViolationTracker: Array<{violationId: string; policy: string; resource: string; severity: string; detectedAt: string; owner: string; status: string; remediationDeadline: string; autoFixAvailable: boolean}> = [];
  private _auditTrailAnalyzer: Array<{eventId: string; timestamp: string; user: string; action: string; resource: string; outcome: string; riskFlag: boolean; category: string; sessionId: string}> = [];
  private _complianceDriftDetector: Array<{driftId: string; baseline: string; currentState: string; driftType: string; severity: string; detectedAt: string; autoCorrected: boolean; approvalRequired: boolean}> = [];
  private _regulatoryDeadlineTracker: Array<{deadlineId: string; regulation: string; requirement: string; dueDate: string; status: string; progress: number; owner: string; riskIfMissed: string; dependencies: string[]}> = [];
  private _complianceScorecard: Array<{category: string; score: number; maxScore: number; trend: string; lastAssessment: string; gaps: number; remediationPlan: string}> = [];

  private _initComplianceAutomation(): void {
    this._complianceAutoChecks = [
      {checkId: 'chk-001', framework: 'SOC2', control: 'CC6.1', status: 'passed', lastRun: '2024-12-16T06:00:00Z', nextRun: '2024-12-17T06:00:00Z', result: 'All MFA policies enforced', severity: 'high', autoRemediated: false, remediationAction: ''},
      {checkId: 'chk-002', framework: 'PCI-DSS', control: 'REQ-8', status: 'failed', lastRun: '2024-12-16T06:00:00Z', nextRun: '2024-12-16T12:00:00Z', result: '3 accounts without MFA', severity: 'critical', autoRemediated: true, remediationAction: 'MFA enforced on 3 accounts'},
      {checkId: 'chk-003', framework: 'ISO27001', control: 'A.9.2', status: 'passed', lastRun: '2024-12-16T06:00:00Z', nextRun: '2024-12-17T06:00:00Z', result: 'Access reviews current', severity: 'medium', autoRemediated: false, remediationAction: ''},
      {checkId: 'chk-004', framework: 'GDPR', control: 'Art.32', status: 'warning', lastRun: '2024-12-16T06:00:00Z', nextRun: '2024-12-16T18:00:00Z', result: 'Encryption key rotation overdue by 5 days', severity: 'high', autoRemediated: true, remediationAction: 'Key rotation scheduled'},
      {checkId: 'chk-005', framework: 'HIPAA', control: '164.312', status: 'passed', lastRun: '2024-12-16T06:00:00Z', nextRun: '2024-12-17T06:00:00Z', result: 'PHI access logging active', severity: 'critical', autoRemediated: false, remediationAction: ''},
      {checkId: 'chk-006', framework: 'NIST CSF', control: 'PR.AC-1', status: 'failed', lastRun: '2024-12-16T06:00:00Z', nextRun: '2024-12-16T12:00:00Z', result: '12 dormant accounts found', severity: 'medium', autoRemediated: true, remediationAction: 'Disabled 12 dormant accounts'},
    ];
    this._policyViolationTracker = [
      {violationId: 'viol-001', policy: 'Password Policy', resource: 'AD Domain', severity: 'high', detectedAt: '2024-12-15T10:00:00Z', owner: 'IAM Team', status: 'remediated', remediationDeadline: '2024-12-20', autoFixAvailable: true},
      {violationId: 'viol-002', policy: 'Network Segmentation', resource: 'Prod VLAN 100', severity: 'critical', detectedAt: '2024-12-14T15:30:00Z', owner: 'Network Team', status: 'in-progress', remediationDeadline: '2024-12-18', autoFixAvailable: false},
      {violationId: 'viol-003', policy: 'Data Classification', resource: 'SharePoint Site HR', severity: 'medium', detectedAt: '2024-12-13T09:00:00Z', owner: 'Data Governance', status: 'pending-review', remediationDeadline: '2024-12-25', autoFixAvailable: true},
      {violationId: 'viol-004', policy: 'Encryption Standard', resource: 'S3 Bucket logs-raw', severity: 'critical', detectedAt: '2024-12-12T14:00:00Z', owner: 'Cloud Team', status: 'remediated', remediationDeadline: '2024-12-16', autoFixAvailable: true},
      {violationId: 'viol-005', policy: 'Access Control', resource: 'K8s Cluster Prod', severity: 'high', detectedAt: '2024-12-11T11:00:00Z', owner: 'Platform Team', status: 'in-progress', remediationDeadline: '2024-12-22', autoFixAvailable: false},
    ];
    this._auditTrailAnalyzer = [
      {eventId: 'evt-001', timestamp: '2024-12-16T08:30:00Z', user: 'admin@company.com', action: 'Privilege Escalation', resource: 'AD Domain Admin', outcome: 'success', riskFlag: true, category: 'privileged-access', sessionId: 'sess-a1b2'},
      {eventId: 'evt-002', timestamp: '2024-12-16T08:25:00Z', user: 'svc-deploy@company.com', action: 'Secret Access', resource: 'Vault/Prod/DB', outcome: 'success', riskFlag: false, category: 'automation', sessionId: 'sess-c3d4'},
      {eventId: 'evt-003', timestamp: '2024-12-16T08:20:00Z', user: 'unknown@external.com', action: 'Login Attempt', resource: 'VPN Gateway', outcome: 'denied', riskFlag: true, category: 'authentication', sessionId: 'sess-e5f6'},
      {eventId: 'evt-004', timestamp: '2024-12-16T08:15:00Z', user: 'bob@company.com', action: 'Mass Download', resource: 'SharePoint/Finance', outcome: 'success', riskFlag: true, category: 'data-access', sessionId: 'sess-g7h8'},
      {eventId: 'evt-005', timestamp: '2024-12-16T08:10:00Z', user: 'alice@company.com', action: 'Config Change', resource: 'Firewall Rule 42', outcome: 'success', riskFlag: false, category: 'configuration', sessionId: 'sess-i9j0'},
      {eventId: 'evt-006', timestamp: '2024-12-16T08:05:00Z', user: 'system', action: 'Auto-Remediation', resource: 'IAM Policy Violation', outcome: 'success', riskFlag: false, category: 'automation', sessionId: 'auto-k1l2'},
    ];
    this._complianceDriftDetector = [
      {driftId: 'drift-001', baseline: 'SOC2 CC6.1 (MFA Required)', currentState: '3 accounts without MFA', driftType: 'configuration', severity: 'critical', detectedAt: '2024-12-16T06:00:00Z', autoCorrected: true, approvalRequired: false},
      {driftId: 'drift-002', baseline: 'NIST AC-2 (Account Management)', currentState: '12 dormant accounts active', driftType: 'access', severity: 'high', detectedAt: '2024-12-16T06:00:00Z', autoCorrected: true, approvalRequired: false},
      {driftId: 'drift-003', baseline: 'PCI-DSS REQ-1 (Firewall Rules)', currentState: 'Rule 42 modified without review', driftType: 'configuration', severity: 'high', detectedAt: '2024-12-16T07:00:00Z', autoCorrected: false, approvalRequired: true},
      {driftId: 'drift-004', baseline: 'ISO27001 A.12.4 (Logging)', currentState: 'Log forwarding paused on 2 hosts', driftType: 'operational', severity: 'medium', detectedAt: '2024-12-16T05:00:00Z', autoCorrected: true, approvalRequired: false},
      {driftId: 'drift-005', baseline: 'GDPR Art.25 (Data Protection by Design)', currentState: 'New form collects SSN without consent', driftType: 'privacy', severity: 'critical', detectedAt: '2024-12-15T16:00:00Z', autoCorrected: false, approvalRequired: true},
    ];
    this._regulatoryDeadlineTracker = [
      {deadlineId: 'reg-001', regulation: 'GDPR', requirement: 'Annual DPA Review', dueDate: '2025-01-15', status: 'on-track', progress: 75, owner: 'Legal', riskIfMissed: 'Regulatory fine up to 4% global revenue', dependencies: ['Vendor DPA responses', 'Internal review']},
      {deadlineId: 'reg-002', regulation: 'SOC2', requirement: 'Type II Audit Evidence Collection', dueDate: '2024-12-31', status: 'at-risk', progress: 60, owner: 'GRC Team', riskIfMissed: 'Audit qualification failure', dependencies: ['Control testing', 'Evidence gathering']},
      {deadlineId: 'reg-003', regulation: 'PCI-DSS', requirement: 'Quarterly ASV Scan', dueDate: '2024-12-20', status: 'on-track', progress: 90, owner: 'Security Ops', riskIfMissed: 'PCI compliance lapse', dependencies: ['Scan scheduling']},
      {deadlineId: 'reg-004', regulation: 'HIPAA', requirement: 'BAA Review with Vendors', dueDate: '2025-02-28', status: 'on-track', progress: 40, owner: 'Compliance', riskIfMissed: 'OCR enforcement action', dependencies: ['Vendor responses', 'Legal review']},
      {deadlineId: 'reg-005', regulation: 'SOX', requirement: 'IT General Controls Testing', dueDate: '2025-01-31', status: 'at-risk', progress: 35, owner: 'Internal Audit', riskIfMissed: 'Material weakness disclosure', dependencies: ['Control inventory', 'Test plan']},
    ];
    this._complianceScorecard = [
      {category: 'Access Control', score: 87, maxScore: 100, trend: 'up', lastAssessment: '2024-12-16', gaps: 3, remediationPlan: 'Remediate 3 MFA gaps by Dec 20'},
      {category: 'Data Protection', score: 92, maxScore: 100, trend: 'stable', lastAssessment: '2024-12-16', gaps: 1, remediationPlan: 'Fix encryption key rotation'},
      {category: 'Network Security', score: 78, maxScore: 100, trend: 'down', lastAssessment: '2024-12-15', gaps: 5, remediationPlan: 'Review and fix 5 firewall rule violations'},
      {category: 'Endpoint Security', score: 95, maxScore: 100, trend: 'up', lastAssessment: '2024-12-16', gaps: 1, remediationPlan: 'Update 1 outdated EDR agent'},
      {category: 'Incident Response', score: 85, maxScore: 100, trend: 'up', lastAssessment: '2024-12-14', gaps: 2, remediationPlan: 'Complete IR tabletop exercise'},
      {category: 'Vendor Management', score: 71, maxScore: 100, trend: 'down', lastAssessment: '2024-12-13', gaps: 7, remediationPlan: 'Complete 7 overdue vendor assessments'},
    ];
  }

  private _renderComplianceAutoChecks(): ReturnType<typeof html> {
    const failed = this._complianceAutoChecks.filter(c => c.status === 'failed');
    const autoRemediated = this._complianceAutoChecks.filter(c => c.autoRemediated);
    return html`
      <div class="compliance-auto-section">
        <div class="section-header">
          <h4>Automated Compliance Checks</h4>
          <span class="badge critical">${failed.length} Failed</span>
          <span class="badge success">${autoRemediated.length} Auto-Fixed</span>
        </div>
        <div class="checks-grid">
          ${this._complianceAutoChecks.map(c => html`
            <div class="check-card status-${c.status}">
              <div class="check-header">
                <span class="check-framework">${c.framework}</span>
                <span class="check-control">${c.control}</span>
                <span class="check-status ${c.status}">${c.status}</span>
              </div>
              <div class="check-result">${c.result}</div>
              <div class="check-meta">
                <span>Severity: ${c.severity}</span>
                <span>Last: ${c.lastRun}</span>
                <span>Next: ${c.nextRun}</span>
              </div>
              ${c.autoRemediated ? html`<div class="auto-remediation">Auto-remediated: ${c.remediationAction}</div>` : ''}
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderPolicyViolations(): ReturnType<typeof html> {
    return html`
      <div class="policy-violations-section">
        <div class="section-header">
          <h4>Policy Violation Tracker</h4>
        </div>
        <div class="violations-list">
          ${this._policyViolationTracker.sort((a, b) => {
            const order = {critical: 0, high: 1, medium: 2};
            return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
          }).map(v => html`
            <div class="violation-card severity-${v.severity}">
              <div class="violation-header">
                <span class="violation-policy">${v.policy}</span>
                <span class="violation-resource">${v.resource}</span>
                <span class="violation-status ${v.status}">${v.status}</span>
                ${v.autoFixAvailable ? html`<span class="auto-fix-badge">Auto-Fix Available</span>` : ''}
              </div>
              <div class="violation-meta">
                <span>Owner: ${v.owner}</span>
                <span>Detected: ${v.detectedAt}</span>
                <span>Deadline: ${v.remediationDeadline}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderAuditTrailAnalysis(): ReturnType<typeof html> {
    const flagged = this._auditTrailAnalyzer.filter(e => e.riskFlag);
    return html`
      <div class="audit-trail-section">
        <div class="section-header">
          <h4>Audit Trail Analysis</h4>
          <span class="badge warning">${flagged.length} Risk Flags</span>
        </div>
        <div class="audit-list">
          ${this._auditTrailAnalyzer.map(e => html`
            <div class="audit-card ${e.riskFlag ? 'flagged' : 'normal'}">
              <div class="audit-header">
                <span class="audit-timestamp">${e.timestamp}</span>
                <span class="audit-user">${e.user}</span>
                <span class="audit-action">${e.action}</span>
                ${e.riskFlag ? html`<span class="risk-flag">RISK</span>` : ''}
              </div>
              <div class="audit-details">
                <span>Resource: ${e.resource}</span>
                <span>Outcome: ${e.outcome}</span>
                <span>Category: ${e.category}</span>
                <span>Session: ${e.sessionId}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderComplianceDrift(): ReturnType<typeof html> {
    return html`
      <div class="drift-section">
        <div class="section-header">
          <h4>Compliance Drift Detection</h4>
          <span class="badge warning">${this._complianceDriftDetector.filter(d => !d.autoCorrected).length} Manual Fix Required</span>
        </div>
        <div class="drift-list">
          ${this._complianceDriftDetector.sort((a, b) => {
            const order = {critical: 0, high: 1, medium: 2};
            return (order[a.severity] ?? 3) - (order[b.severity] ?? 3);
          }).map(d => html`
            <div class="drift-card severity-${d.severity}">
              <div class="drift-header">
                <span class="drift-type">${d.driftType}</span>
                <span class="drift-severity">${d.severity}</span>
                <span class="drift-corrected ${d.autoCorrected}">${d.autoCorrected ? 'Auto-Corrected' : 'Manual Fix'}</span>
              </div>
              <div class="drift-baseline">Baseline: ${d.baseline}</div>
              <div class="drift-current">Current: ${d.currentState}</div>
              <div class="drift-meta">
                <span>Detected: ${d.detectedAt}</span>
                ${d.approvalRequired ? html`<span class="approval-needed">Approval Required</span>` : ''}
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderRegulatoryDeadlines(): ReturnType<typeof html> {
    return html`
      <div class="deadlines-section">
        <div class="section-header">
          <h4>Regulatory Deadline Tracker</h4>
        </div>
        <div class="deadlines-list">
          ${this._regulatoryDeadlineTracker.sort((a, b) => {
            const order = {critical: 0, 'at-risk': 1, 'on-track': 2};
            return (order[a.status] ?? 3) - (order[b.status] ?? 3);
          }).map(d => html`
            <div class="deadline-card status-${d.status}">
              <div class="deadline-header">
                <span class="deadline-reg">${d.regulation}</span>
                <span class="deadline-req">${d.requirement}</span>
                <span class="deadline-status">${d.status}</span>
              </div>
              <div class="deadline-progress">
                <div class="progress-bar"><div class="progress-fill" style="width: ${d.progress}%"></div></div>
                <span class="progress-text">${d.progress}%</span>
              </div>
              <div class="deadline-meta">
                <span>Due: ${d.dueDate}</span>
                <span>Owner: ${d.owner}</span>
              </div>
              <div class="deadline-risk">${d.riskIfMissed}</div>
              <div class="deadline-deps">
                ${d.dependencies.map(dep => html`<span class="dep-tag">${dep}</span>`)}
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderComplianceScorecard(): ReturnType<typeof html> {
    return html`
      <div class="scorecard-section">
        <div class="section-header">
          <h4>Compliance Scorecard</h4>
        </div>
        <div class="scorecard-grid">
          ${this._complianceScorecard.sort((a, b) => a.score - b.score).map(s => html`
            <div class="score-card trend-${s.trend}">
              <div class="score-header">
                <span class="score-category">${s.category}</span>
                <span class="score-value">${s.score}/${s.maxScore}</span>
                <span class="score-trend">${s.trend === 'up' ? '\u2191' : s.trend === 'down' ? '\u2193' : '\u2192'}</span>
              </div>
              <div class="score-bar"><div class="score-fill" style="width: ${s.score}%"></div></div>
              <div class="score-meta">
                <span>Gaps: ${s.gaps}</span>
                <span>Assessed: ${s.lastAssessment}</span>
              </div>
              <div class="score-plan">${s.remediationPlan}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }




  render() {
    const items = this._getFiltered();
    const crit = items.filter(i => i.severity === 'critical').length;
    const high = items.filter(i => i.severity === 'high').length;
    const open = items.filter(i => i.status === 'open' || i.status === 'in-progress').length;
    const resolved = items.filter(i => i.status === 'resolved').length;
    return html`
      <div class="panel">
        <div class="pt">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          Champions
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
          <button class="tab ${this._activeTab === 'workflow' ? 'active' : ''}" @click=${() => { this._activeTab = 'workflow'; }}>Workflow</button>
          <button class="tab ${this._activeTab === 'execute' ? 'active' : ''}" @click=${() => { this._activeTab = 'execute'; }}>Execute</button>
          <button class="tab ${this._activeTab === 'trends' ? 'active' : ''}" @click=${() => { this._activeTab = 'trends'; }}>Trends</button>
          <button class="tab ${this._activeTab === 'history' ? 'active' : ''}" @click=${() => { this._activeTab = 'history'; }}>History</button>
          <button class="tab ${this._activeTab === 'settings' ? 'active' : ''}" @click=${() => { this._activeTab = 'settings'; }}>Settings</button>
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
          ${this._renderPaginatedTable(items)}
        ` : nothing}
        ${this._activeTab === 'workflow' ? html`
          ${this._renderWorkflowTable()}
        ` : nothing}
        ${this._activeTab === 'execute' ? html`
          ${this._renderExecutionPanel()}
        ` : nothing}
        ${this._activeTab === 'settings' ? html`
          ${this._renderSettingsTab()}
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
        ${this._activeTab === 'new' ? html`
          <div class="form-section">
            <div class="form-title">Create New Champions Entry</div>
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

  // --- Champions Risk Scoring Engine ---
  private _champRiskFactors: Record<string, { weight: number; label: string }> = {
    engagementScore: { weight: 0.25, label: 'Engagement Score' },
    knowledgeLevel: { weight: 0.20, label: 'Knowledge Level' },
    reportRate: { weight: 0.20, label: 'Phishing Report Rate' },
    trainingCompletion: { weight: 0.15, label: 'Training Completion' },
    peerInfluence: { weight: 0.10, label: 'Peer Influence' },
    activityRecency: { weight: 0.10, label: 'Activity Recency' },
  };

  private _computeChampionRisk(): { score: number; level: string; factors: { name: string; score: number; label: string }[] } {
    const totalChamps = this._champions.length || 1;
    const avgEngagement = this._champions.reduce((s: number, c: any) => s + (c.engagement || 50), 0) / totalChamps;
    const avgTraining = this._champions.reduce((s: number, c: any) => s + (c.trainingComplete ? 100 : 0), 0) / totalChamps;
    const factors = [
      { name: 'engagementScore', score: avgEngagement, label: this._champRiskFactors.engagementScore.label },
      { name: 'knowledgeLevel', score: Math.min(100, avgEngagement * 1.2), label: this._champRiskFactors.knowledgeLevel.label },
      { name: 'reportRate', score: Math.min(100, this._champions.filter((c: any) => c.reports > 5).length * 25), label: this._champRiskFactors.reportRate.label },
      { name: 'trainingCompletion', score: avgTraining, label: this._champRiskFactors.trainingCompletion.label },
      { name: 'peerInfluence', score: Math.min(100, totalChamps * 8), label: this._champRiskFactors.peerInfluence.label },
      { name: 'activityRecency', score: Math.min(100, this._champions.filter((c: any) => (Date.now() - new Date(c.lastActive).getTime()) < 604800000).length * 15), label: this._champRiskFactors.activityRecency.label },
    ];
    const score = Math.round(factors.reduce((s, f) => s + f.score * (this._champRiskFactors[f.name]?.weight || 0.15), 0));
    const level = score > 75 ? 'excellent' : score > 50 ? 'good' : score > 25 ? 'developing' : 'needs-improvement';
    return { score, level, factors };
  }

  // --- MITRE ATT&CK Awareness Mapping ---
  private _mitreChampMap: Record<string, { techniqueId: string; techniqueName: string; tactic: string }> = {
    'phishing': { techniqueId: 'T1566', techniqueName: 'Phishing', tactic: 'Initial Access' },
    'social-engineering': { techniqueId: 'T1598', techniqueName: 'Phishing for Information', tactic: 'Reconnaissance' },
    'pretexting': { techniqueId: 'T1598.003', techniqueName: 'Spear-phishing Link', tactic: 'Initial Access' },
    'vishing': { techniqueId: 'T1566.002', techniqueName: 'Spearphishing Voice', tactic: 'Initial Access' },
    'smishing': { techniqueId: 'T1566.001', techniqueName: 'Spearphishing Attachment', tactic: 'Initial Access' },
    'impersonation': { techniqueId: 'T1656', techniqueName: 'Impersonation', tactic: 'Social Engineering' },
  };

  private _correlateChampMitre(): { tactic: string; techniques: { id: string; name: string; reportCount: number }[] }[] {
    const tacticMap: Record<string, { id: string; name: string; reportCount: number }[]> = {};
    this._champions.forEach((c: any) => {
      for (const [key, mitre] of Object.entries(this._mitreChampMap)) {
        if (c.specialties?.includes(key) || c.reports?.some((r: any) => r.type?.includes(key))) {
          if (!tacticMap[mitre.tactic]) tacticMap[mitre.tactic] = [];
          const ex = tacticMap[mitre.tactic].find(t => t.id === mitre.techniqueId);
          if (ex) ex.reportCount += c.reports || 0; else tacticMap[mitre.tactic].push({ id: mitre.techniqueId, name: mitre.techniqueName, reportCount: c.reports || 0 });
        }
      }
    });
    return Object.entries(tacticMap).map(([tactic, techniques]) => ({ tactic, techniques }));
  }

  // --- Champion Leaderboard SVG ---
  private _leaderboardSVG(): string {
    const w = 500, h = 250;
    const top = this._champions.slice(0, 8).sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
    const maxScore = Math.max(...top.map((c: any) => c.score || 0), 1);
    const barH = 22, gap = 4, startY = 30;
    let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<text x="${w / 2}" y="18" fill="#e2e8f0" font-size="10" text-anchor="middle" font-weight="700">Champion Leaderboard</text>`;
    top.forEach((c: any, i) => {
      const y = startY + i * (barH + gap);
      const score = c.score || 0;
      const barW = (score / maxScore) * (w - 160);
      const color = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#b45309' : '#374151';
      svg += `<text x="${5}" y="${y + barH / 2 + 3}" fill="#9ca3af" font-size="9" text-anchor="start">${i + 1}. ${c.name || c.id}</text>`;
      svg += `<rect x="140" y="${y}" width="${barW}" height="${barH}" rx="4" fill="${color}" opacity="0.6"/>`;
      svg += `<text x="${145 + barW}" y="${y + barH / 2 + 3}" fill="#e2e8f0" font-size="9">${score}</text>`;
    });
    svg += `</svg>`;
    return svg;
  }

  // --- Champion Radar SVG ---
  private _champRadarSVG(): string {
    const dims = ['Reporting', 'Training', 'Knowledge', 'Influence', 'Engagement', 'Mentoring'];
    const values = [0.7, 0.6, 0.8, 0.5, 0.9, 0.4];
    const cx = 100, cy = 100, r = 70, n = dims.length;
    let svg = `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">`;
    for (let ring = 1; ring <= 4; ring++) {
      const rr = (ring / 4) * r;
      const pts = dims.map((_, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return `${cx + rr * Math.cos(a)},${cy + rr * Math.sin(a)}`; }).join(' ');
      svg += `<polygon points="${pts}" fill="none" stroke="#374151" stroke-width="0.5"/>`;
    }
    dims.forEach((_, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; svg += `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(a)}" y2="${cy + r * Math.sin(a)}" stroke="#374151" stroke-width="0.5"/>`; });
    const dataPts = values.map((v, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return `${cx + v * r * Math.cos(a)},${cy + v * r * Math.sin(a)}`; }).join(' ');
    svg += `<polygon points="${dataPts}" fill="#22c55e" fill-opacity="0.2" stroke="#22c55e" stroke-width="1.5"/>`;
    dims.forEach((d, i) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; const lx = cx + (r + 18) * Math.cos(a), ly = cy + (r + 18) * Math.sin(a); svg += `<text x="${lx}" y="${ly}" fill="#9ca3af" font-size="7" text-anchor="middle" dominant-baseline="middle">${d}</text>`; });
    svg += `</svg>`;
    return svg;
  }

  // --- Collaboration ---
  @state() private _champTeamNotes: { id: string; userId: string; text: string; timestamp: string }[] = [];
  @state() private _champNoteText = '';

  private _addChampNote() {
    if (!this._champNoteText.trim()) return;
    this._champTeamNotes = [{ id: 'cn' + Date.now(), userId: 'You', text: this._champNoteText.trim(), timestamp: new Date().toISOString() }, ...this._champTeamNotes].slice(0, 30);
    this._champNoteText = '';
  }

  private _renderChampCollab(): any {
    return html`
      <div style="margin-top:16px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Team Notes</div>
        ${this._champTeamNotes.length > 0 ? html`
          <div style="max-height:60px;overflow-y:auto;margin-bottom:6px">
            ${this._champTeamNotes.slice(0, 5).map(c => html`<div style="font-size:10px;padding:3px 0;border-bottom:1px solid #1f2937"><span style="font-weight:600;color:#e2e8f0">${c.userId}</span><span style="color:#9ca3af">: ${c.text}</span></div>`)}
          </div>
        ` : ''}
        <div style="display:flex;gap:6px">
          <input style="flex:1;background:#0f172a;border:1px solid #374151;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:10px" placeholder="Add note..." .value=${this._champNoteText} @input=${(e: any) => this._champNoteText = e.target.value}>
          <button style="background:#f59e0b;color:#111827;border:none;border-radius:4px;padding:4px 10px;font-size:10px;font-weight:600;cursor:pointer" @click=${this._addChampNote}>Post</button>
        </div>
      </div>
    `;
  }

  // --- Auto-Insights ---
  private _generateChampInsights(): { icon: string; text: string; severity: string }[] {
    const insights: { icon: string; text: string; severity: string }[] = [];
    const risk = this._computeChampionRisk();
    if (risk.score < 30) insights.push({ icon: '\u26A0\uFE0F', text: 'Overall champion engagement is low. Program may need revitalization.', severity: 'high' });
    if (risk.score > 70) insights.push({ icon: '\uD83C\uDFC6', text: 'Strong champion program performance. Consider expanding to other departments.', severity: 'low' });
    const inactive = this._champions.filter((c: any) => (Date.now() - new Date(c.lastActive).getTime()) > 2592000000);
    if (inactive.length > 0) insights.push({ icon: '\uD83D\uDCC5', text: `${inactive.length} champions inactive for 30+ days. Re-engagement recommended.`, severity: 'medium' });
    return insights.length > 0 ? insights : [{ icon: '\u2705', text: 'Champion program is performing well.', severity: 'low' }];
  }

  private _renderChampInsights(): any {
    const insights = this._generateChampInsights();
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Auto-Insights</div>
        ${insights.map(i => html`<div style="display:flex;gap:6px;padding:5px;margin-bottom:3px;background:#1f2937;border-radius:4px;font-size:10px;border-left:3px solid ${i.severity === 'high' ? '#ef4444' : i.severity === 'medium' ? '#eab308' : '#22c55e'}"><span>${i.icon}</span><span style="color:#e2e8f0">${i.text}</span></div>`)}
      </div>
    `;
  }

  // --- Panel Config ---
  @state() private _champConfig: { showLeaderboard: boolean; showRadar: boolean; showCollab: boolean; autoRefresh: boolean } = { showLeaderboard: true, showRadar: true, showCollab: true, autoRefresh: false };

  private _renderChampConfig(): any {
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Configuration</div>
        ${Object.entries(this._champConfig).map(([key, val]) => html`
          <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #1f2937">
            <span style="font-size:10px;color:#9ca3af">${key.replace(/([A-Z])/g, ' $1').trim()}</span>
            <div style="width:32px;height:18px;border-radius:9px;background:${val ? '#22c55e' : '#374151'};cursor:pointer;position:relative" @click=${() => { this._champConfig = { ...this._champConfig, [key]: !val }; }}><div style="width:14px;height:14px;border-radius:50%;background:white;position:absolute;top:2px;left:${val ? '16px' : '2px'};transition:left 0.2s"></div></div>
          </div>
        `)}
      </div>
    `;
  }

  // --- Trend Prediction ---
  private _predictChampTrend(): { direction: string; confidence: number; reason: string } {
    const risk = this._computeChampionRisk();
    if (risk.score > 60) return { direction: 'IMPROVING', confidence: 0.7, reason: 'Engagement metrics trending upward' };
    return { direction: 'DECLINING', confidence: 0.6, reason: 'Participation rates decreasing' };
  }

  private _renderChampTrend(): any {
    const trend = this._predictChampTrend();
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Trend Prediction</div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:20px">${trend.direction === 'IMPROVING' ? '\uD83D\uDD3D' : '\uD83D\uDD3C'}</div>
          <div><div style="font-size:11px;font-weight:600;color:${trend.direction === 'IMPROVING' ? '#22c55e' : '#ef4444'}">${trend.direction}</div><div style="font-size:10px;color:#9ca3af">${trend.reason}</div><div style="font-size:9px;color:#6b7280">Confidence: ${Math.round(trend.confidence * 100)}%</div></div>
        </div>
      </div>
    `;
  }

  // --- Anomaly Detection ---
  private _detectChampAnomalies(): { type: string; description: string; severity: string }[] {
    const anomalies: { type: string; description: string; severity: string }[] = [];
    const topReporters = this._champions.filter((c: any) => (c.reports || 0) > 50);
    if (topReporters.length > 0) anomalies.push({ type: 'Super Reporter', description: `${topReporters.length} champions with 50+ reports may need recognition or workload review`, severity: 'low' });
    return anomalies;
  }

  private _renderChampAnomalies(): any {
    const anomalies = this._detectChampAnomalies();
    if (anomalies.length === 0) return nothing;
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px;color:#f59e0b">Highlights (${anomalies.length})</div>
        ${anomalies.map(a => html`<div style="background:#1f2937;border-radius:4px;padding:6px;margin-bottom:4px;border-left:3px solid #22c55e"><div style="font-size:11px;font-weight:600;color:#e2e8f0">${a.type}</div><div style="font-size:10px;color:#9ca3af">${a.description}</div></div>`)}
      </div>
    `;
  }

  // --- Compliance ---
  private _champComplianceRules: { rule: string; standard: string; status: 'pass' | 'fail' | 'warning' }[] = [
    { rule: 'Annual security awareness training', standard: 'PCI-DSS 12.6', status: 'warning' },
    { rule: 'Phishing simulation participation > 80%', standard: 'NIST 800-50', status: 'pass' },
    { rule: 'Incident reporting procedure documented', standard: 'ISO 27001 A.16.1', status: 'pass' },
    { rule: 'Champion program metrics tracked', standard: 'SOC2 CC4.1', status: 'pass' },
    { rule: 'Regular program effectiveness review', standard: 'NIST 800-53 AT-2', status: 'fail' },
  ];

  private _renderChampCompliance(): any {
    return html`
      <div style="margin-top:12px;background:#1a1d27;border-radius:8px;padding:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Compliance</div>
        ${this._champComplianceRules.map(r => html`
          <div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #1f2937;font-size:10px">
            <div style="width:8px;height:8px;border-radius:50%;background:${r.status === 'pass' ? '#22c55e' : r.status === 'fail' ? '#ef4444' : '#eab308'}"></div>
            <span style="flex:1;color:#e2e8f0">${r.rule}</span>
            <span style="color:#6b7280;font-size:9px">${r.standard}</span>
          </div>
        `)}
      </div>
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
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Champions Findings Grid</span>
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
  @state() private _cScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _cScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _cScenarioCompare: boolean = false;
  @state() private _cScenarioSelected: string[] = [];

  private _cInitScenarios(): void {
    const saved = localStorage.getItem('c_scenarios');
    if (saved) { try { this._cScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._cScenarios.length === 0) {
      this._cScenarios = [
        {id:'c-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'c-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'c-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _cSaveScenarios(): void {
    localStorage.setItem('c_scenarios', JSON.stringify(this._cScenarios));
  }

  private _cAddScenario(): void {
    const f = this._cScenarioForm;
    if (!f.attackType || !f.target) return;
    this._cScenarios = [...this._cScenarios, {
      id: 'c-s' + (this._cScenarios.length + 1),
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
    this._cScenarioForm = {attackType:'',target:'',method:''};
    this._cSaveScenarios();
  }

  private _cRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._cScenarioCompare = !this._cScenarioCompare; }}>${this._cScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._cScenarioForm = {...this._cScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._cScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._cScenarioForm = {...this._cScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._cScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._cScenarioForm = {...this._cScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._cScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._cAddScenario}>Run Simulation</button>
      </div>
      ${this._cScenarioCompare && this._cScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._cScenarios.length)},1fr);gap:8px">
            ${this._cScenarios.slice(0,3).map(s => html`
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
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._cScenarios.length})</div>
        ${this._cScenarios.map(s => html`
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
  @state() private _cTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _cTrendZoom: {start:number;end:number} | null = null;
  @state() private _cTrendMA: number = 7;

  private _cInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._cTrendData = data;
  }

  private _cCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._cTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._cTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _cGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._cTrendData.map(d => d.value);
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

  private _cRenderTimeSeries(): any {
    const stats = this._cGetStats();
    const filtered = this._cTrendZoom ? this._cTrendData.filter(d => d.day >= this._cTrendZoom.start && d.day <= this._cTrendZoom.end) : this._cTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._cTrendMA === 7 ? 'active' : ''}" @click=${() => { this._cTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._cTrendMA === 30 ? 'active' : ''}" @click=${() => { this._cTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._cTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._cTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
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
  @state() private _cRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _cActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _cPermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _cPermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _cPermCompare: string[] = [];

  private _cInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._cRoles) {
      perms[role] = {};
      this._cActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._cPermissions = perms;
  }

  private _cTogglePermission(role: string, action: string): void {
    const old = this._cPermissions[role][action];
    this._cPermissions = {...this._cPermissions, [role]: {...this._cPermissions[role], [action]: !old}};
    this._cPermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _cRenderRBAC(): any {
    const compareRoles = this._cPermCompare.map(r => this._cPermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._cRoles.map(r => html`
              <button class="tab ${this._cPermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._cPermCompare = this._cPermCompare.includes(r) ? this._cPermCompare.filter(x => x !== r) : [...this._cPermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._cActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._cRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._cActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._cPermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._cTogglePermission(role, action)}>${this._cPermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._cPermCompare.join(' vs ')}</div>
            ${this._cActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._cPermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._cPermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._cPermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _cReportTemplate: string = 'executive';
  @state() private _cReportSchedule: string = 'weekly';
  @state() private _cReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _cReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _cGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._cReportHistory.unshift({id,template:this._cReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _cRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._cReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._cReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._cReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._cReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._cReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._cReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._cGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._cReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._cReportHistory.slice(0,3).map(r => html`
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
  @state() private _cHighContrast: boolean = false;
  @state() private _cA11yAnnounce: string = '';
  @state() private _cShortcutsVisible: boolean = false;
  @state() private _cFocusTrap: boolean = false;

  private _cShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _cHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._cFocusTrap) { this._cFocusTrap = false; this._cAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._cHighContrast = !this._cHighContrast; this._cAnnounce('High contrast ' + (this._cHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._cShortcutsVisible = !this._cShortcutsVisible; }
  }

  private _cAnnounce(msg: string): void {
    this._cA11yAnnounce = msg;
    setTimeout(() => { this._cA11yAnnounce = ''; }, 2000);
  }

  private _cRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._cShortcutsVisible ? 'active' : ''}" @click=${() => { this._cShortcutsVisible = !this._cShortcutsVisible; }} aria-expanded=${this._cShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._cHighContrast} @change=${() => { this._cHighContrast = !this._cHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._cShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._cShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._cA11yAnnounce}</div>
      </div>
    `;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._cInitScenarios();
    this._cInitTrendData();
    this._cInitPermissions();
    document.addEventListener('keydown', this._cHandleKeydown.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._cHandleKeydown.bind(this));
  }

  
  // === MACHINE LEARNING FEATURES ===
  @state() private _cMlActiveView: string = 'importance';
  @state() private _cMlModelVersion: string = 'v3.2.1';
  @state() private _cMlFeatureImportance: {name:string;importance:number;color:string}[] = [];
  @state() private _cMlMetrics: {accuracy:number;precision:number;recall:number;f1:number;auc:number} = {accuracy:0.945,precision:0.931,recall:0.952,f1:0.941,auc:0.973};
  @state() private _cMlConfusionMatrix: number[][] = [];
  @state() private _cMlTrainingHistory: {epoch:number;loss:number;valLoss:number;accuracy:number;valAccuracy:number}[] = [];
  @state() private _cMlConfidenceBins: {range:string;count:number;color:string}[] = [];
  @state() private _cMlVersionHistory: {version:string;date:string;accuracy:number;f1:number;notes:string}[] = [];
  @state() private _cMlSelectedVersion: string = 'v3.2.1';

  private _cInitMlData(): void {
    this._cMlFeatureImportance = [
      {name:'Request Rate',importance:0.234,color:'#f97316'},
      {name:'Payload Size',importance:0.198,color:'#3b82f6'},
      {name:'Time of Day',importance:0.167,color:'#8b5cf6'},
      {name:'Source IP Reputation',importance:0.145,color:'#10b981'},
      {name:'User Behavior Score',importance:0.112,color:'#ef4444'},
      {name:'Endpoint Type',importance:0.089,color:'#06b6d4'},
      {name:'Protocol Anomaly',importance:0.055,color:'#f59e0b'},
    ];
    this._cMlConfusionMatrix = [
      [142, 3, 1],
      [2, 98, 4],
      [0, 5, 45],
    ];
    this._cMlTrainingHistory = Array.from({length:20}, (_,i) => ({
      epoch: i+1,
      loss: Math.max(0.02, 0.8 * Math.exp(-0.15*i) + 0.02 + Math.random()*0.01),
      valLoss: Math.max(0.03, 0.85 * Math.exp(-0.14*i) + 0.03 + Math.random()*0.015),
      accuracy: Math.min(0.99, 0.6 + 0.39 * (1 - Math.exp(-0.18*i)) + Math.random()*0.005),
      valAccuracy: Math.min(0.98, 0.58 + 0.38 * (1 - Math.exp(-0.16*i)) + Math.random()*0.008),
    }));
    this._cMlConfidenceBins = [
      {range:'0-10%',count:12,color:'#ef4444'},
      {range:'10-30%',count:34,color:'#f97316'},
      {range:'30-50%',count:67,color:'#f59e0b'},
      {range:'50-70%',count:128,color:'#eab308'},
      {range:'70-90%',count:245,color:'#22c55e'},
      {range:'90-100%',count:514,color:'#10b981'},
    ];
    this._cMlVersionHistory = [
      {version:'v1.0.0',date:'2025-01-15',accuracy:0.812,f1:0.789,notes:'Initial model with basic features'},
      {version:'v2.0.0',date:'2025-04-20',accuracy:0.887,f1:0.874,notes:'Added behavioral analysis features'},
      {version:'v2.5.0',date:'2025-08-10',accuracy:0.912,f1:0.901,notes:'Improved temporal pattern detection'},
      {version:'v3.0.0',date:'2025-11-30',accuracy:0.931,f1:0.922,notes:'Neural network architecture upgrade'},
      {version:'v3.2.1',date:'2026-03-15',accuracy:0.945,f1:0.941,notes:'Fine-tuned on recent threat data'},
    ];
  }

  private _cRenderMlFeatures(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Machine Learning Features">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Machine Learning Analysis</span>
          <div style="display:flex;gap:4px">
            ${['importance','metrics','matrix','training','confidence','versions'].map(v => html`
              <button class="tab ${this._cMlActiveView === v ? 'active' : ''}" @click=${() => { this._cMlActiveView = v; }}>${v.charAt(0).toUpperCase() + v.slice(1)}</button>
            `)}
          </div>
        </div>
        ${this._cMlActiveView === 'importance' ? this._cRenderFeatureImportance() : nothing}
        ${this._cMlActiveView === 'metrics' ? this._cRenderModelMetrics() : nothing}
        ${this._cMlActiveView === 'matrix' ? this._cRenderConfusionMatrix() : nothing}
        ${this._cMlActiveView === 'training' ? this._cRenderTrainingHistory() : nothing}
        ${this._cMlActiveView === 'confidence' ? this._cRenderConfidenceDist() : nothing}
        ${this._cMlActiveView === 'versions' ? this._cRenderVersionHistory() : nothing}
      </div>
    `;
  }

  private _cRenderFeatureImportance(): any {
    const maxImp = Math.max(...this._cMlFeatureImportance.map(f => f.importance));
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Feature Importance Ranking (Model ${this._cMlModelVersion})</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${this._cMlFeatureImportance.map((f, i) => html`
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

  private _cRenderModelMetrics(): any {
    const m = this._cMlMetrics;
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

  private _cRenderConfusionMatrix(): any {
    const labels = ['Benign','Suspicious','Malicious'];
    const cm = this._cMlConfusionMatrix;
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

  private _cRenderTrainingHistory(): any {
    const data = this._cMlTrainingHistory;
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

  private _cRenderConfidenceDist(): any {
    const bins = this._cMlConfidenceBins;
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

  private _cRenderVersionHistory(): any {
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Model Version Comparison</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${this._cMlVersionHistory.map(v => html`
          <div style="background:${v.version === this._cMlSelectedVersion ? '#1e293b' : '#1a1d2e'};border-radius:6px;padding:10px;border-left:3px solid ${v.version === this._cMlSelectedVersion ? '#3b82f6' : '#374151'};cursor:pointer" @click=${() => { this._cMlSelectedVersion = v.version; }}>
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
  @state() private _cCompActiveFramework: string = 'nist';
  @state() private _cNistCategories: {id:string;name:string;status:'implemented'|'partial'|'not-started';priority:number;progress:number}[] = [];
  @state() private _cCisControls: {number:number;name:string;implementation:number;maturity:string;owner:string}[] = [];
  @state() private _cIsoClauses: {clause:string;title:string;status:string;evidence:number;gap:string}[] = [];
  @state() private _cGdprArticles: {article:string;title:string;compliant:boolean;notes:string}[] = [];
  @state() private _cSoc2Criteria: {criteria:string;category:string;status:string;score:number}[] = [];
  @state() private _cCompGapFilter: string = 'all';

  private _cInitComplianceData(): void {
    this._cNistCategories = [
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
    this._cCisControls = [
      {number:1,name:'Inventory and Control of Enterprise Assets',implementation:82,maturity:'Defined',owner:'IT Ops'},
      {number:2,name:'Inventory and Control of Software Assets',implementation:75,maturity:'Managed',owner:'SecOps'},
      {number:3,name:'Data Protection',implementation:90,maturity:'Defined',owner:'DPO'},
      {number:4,name:'Secure Configuration of Enterprise Assets',implementation:68,maturity:'Managed',owner:'IT Ops'},
      {number:5,name:'Account Management',implementation:85,maturity:'Defined',owner:'IAM Team'},
      {number:6,name:'Access Control Management',implementation:88,maturity:'Defined',owner:'IAM Team'},
      {number:7,name:'Continuous Vulnerability Management',implementation:72,maturity:'Managed',owner:'SecOps'},
      {number:8,name:'Audit Log Management',implementation:80,maturity:'Defined',owner:'SecOps'},
    ];
    this._cIsoClauses = [
      {clause:'A.5.1',title:'Policies for Information Security',status:'Compliant',evidence:12,gap:'None'},
      {clause:'A.5.9',title:'Inventory of Information Assets',status:'Compliant',evidence:8,gap:'None'},
      {clause:'A.6.1',title:'Screening of Candidates',status:'Partial',evidence:5,gap:'Background check process not documented for contractors'},
      {clause:'A.7.1',title:'Before Using Information',status:'Compliant',evidence:10,gap:'None'},
      {clause:'A.8.1',title:'User Endpoint Devices',status:'Partial',evidence:4,gap:'MDM coverage at 78%, target 95%'},
      {clause:'A.8.9',title:'Configuration Management',status:'Partial',evidence:6,gap:'Automated config drift detection missing'},
      {clause:'A.8.16',title:'Monitoring Activities',status:'Compliant',evidence:9,gap:'None'},
      {clause:'A.8.23',title:'Web Filtering',status:'Not Started',evidence:0,gap:'No web filtering solution deployed'},
    ];
    this._cGdprArticles = [
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
    this._cSoc2Criteria = [
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

  private _cRenderComplianceDeepDive(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Compliance Framework Deep Dive">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Compliance Framework</span>
          <div style="display:flex;gap:4px">
            ${['nist','cis','iso','gdpr','soc2'].map(fw => html`
              <button class="tab ${this._cCompActiveFramework === fw ? 'active' : ''}" @click=${() => { this._cCompActiveFramework = fw; }}>${fw.toUpperCase()}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:10px">
          ${['all','implemented','partial','not-started'].map(f => html`
            <button class="tab ${this._cCompGapFilter === f ? 'active' : ''}" @click=${() => { this._cCompGapFilter = f; }} style="font-size:10px">${f === 'all' ? 'All' : f === 'not-started' ? 'Not Started' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
          `)}
        </div>
        ${this._cCompActiveFramework === 'nist' ? this._cRenderNistCsf() : nothing}
        ${this._cCompActiveFramework === 'cis' ? this._cRenderCisControls() : nothing}
        ${this._cCompActiveFramework === 'iso' ? this._cRenderIso27001() : nothing}
        ${this._cCompActiveFramework === 'gdpr' ? this._cRenderGdprChecklist() : nothing}
        ${this._cCompActiveFramework === 'soc2' ? this._cRenderSoc2Criteria() : nothing}
      </div>
    `;
  }

  private _cRenderNistCsf(): any {
    const filtered = this._cCompGapFilter === 'all' ? this._cNistCategories : this._cNistCategories.filter(c => c.status === this._cCompGapFilter);
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

  private _cRenderCisControls(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">CIS Controls v8 Implementation Tracking</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._cCisControls.map(c => html`
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

  private _cRenderIso27001(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">ISO 27001 Clause Coverage Matrix</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._cIsoClauses.map(c => html`
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

  private _cRenderGdprChecklist(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">GDPR Article Compliance Checklist</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._cGdprArticles.map(a => html`
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

  private _cRenderSoc2Criteria(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">SOC 2 Trust Service Criteria Mapping</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._cSoc2Criteria.map(c => html`
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
  @state() private _cNetNodes: {id:string;label:string;type:string;segment:string;x:number;y:number;status:string}[] = [];
  @state() private _cNetEdges: {from:string;to:string;weight:number;traffic:number;type:string}[] = [];
  @state() private _cNetSelectedNode: string = '';
  @state() private _cNetPathStart: string = '';
  @state() private _cNetPathEnd: string = '';
  @state() private _cNetPathResult: string[] = [];
  @state() private _cNetSegmentFilter: string = 'all';
  @state() private _cNetTrafficOverlay: boolean = false;
  @state() private _cNetZoom: number = 1;

  private _cInitNetworkData(): void {
    this._cNetNodes = [
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
    this._cNetEdges = [
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

  private _cFindPath(start: string, end: string): string[] {
    const adj = new Map<string, string[]>();
    for (const e of this._cNetEdges) {
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

  private _cRenderNetworkMap(): any {
    const filteredNodes = this._cNetSegmentFilter === 'all' ? this._cNetNodes : this._cNetNodes.filter(n => n.segment === this._cNetSegmentFilter);
    const nodeMap = new Map(this._cNetNodes.map(n => [n.id, n]));
    const filteredEdges = this._cNetEdges.filter(e => filteredNodes.some(n => n.id === e.from) && filteredNodes.some(n => n.id === e.to));
    const typeColor: Record<string,string> = {firewall:'#ef4444',network:'#3b82f6',server:'#10b981',gateway:'#8b5cf6',database:'#f97316',cache:'#eab308',auth:'#06b6d4',monitoring:'#ec4899'};
    const pathSet = new Set(this._cNetPathResult);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Interactive Network Map">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Network Topology</span>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            ${['all','dmz','frontend','backend','data','services'].map(s => html`
              <button class="tab ${this._cNetSegmentFilter === s ? 'active' : ''}" @click=${() => { this._cNetSegmentFilter = s; }} style="font-size:10px">${s.charAt(0).toUpperCase() + s.slice(1)}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap">
          <select style="background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:4px;padding:4px 8px;font-size:11px" @change=${(e: any) => { this._cNetPathStart = e.target.value; }}>
            <option value="">Path Start...</option>
            ${this._cNetNodes.map(n => html`<option value=${n.id}>${n.label}</option>`)}
          </select>
          <span style="color:#6b7280;font-size:12px">→</span>
          <select style="background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:4px;padding:4px 8px;font-size:11px" @change=${(e: any) => { this._cNetPathEnd = e.target.value; }}>
            <option value="">Path End...</option>
            ${this._cNetNodes.map(n => html`<option value=${n.id}>${n.label}</option>`)}
          </select>
          <button class="tab active" @click=${() => { if (this._cNetPathStart && this._cNetPathEnd) this._cNetPathResult = this._cFindPath(this._cNetPathStart, this._cNetPathEnd); }} style="font-size:10px">Trace Path</button>
          <label style="display:flex;align-items:center;gap:4px;font-size:10px;color:#9ca3af;cursor:pointer">
            <input type="checkbox" .checked=${this._cNetTrafficOverlay} @change=${() => { this._cNetTrafficOverlay = !this._cNetTrafficOverlay; }}> Traffic Overlay
          </label>
        </div>
        <svg viewBox="0 0 650 540" style="width:100%;max-height:400px;background:#0a0c14;border-radius:6px;border:1px solid #1e293b">
          ${filteredEdges.map(e => {
            const from = nodeMap.get(e.from);
            const to = nodeMap.get(e.to);
            if (!from || !to) return nothing;
            const isPath = pathSet.has(e.from) && pathSet.has(e.to) && Math.abs(pathSet.indexOf(e.from) - pathSet.indexOf(e.to)) === 1;
            const strokeWidth = Math.max(1, e.weight / 10);
            const opacity = this._cNetTrafficOverlay ? Math.min(1, e.traffic / 500) : 0.6;
            return html`<line x1=${from.x} y1=${from.y} x2=${to.x} y2=${to.y} stroke=${isPath ? '#fbbf24' : '#374151'} stroke-width=${isPath ? strokeWidth + 2 : strokeWidth} opacity=${opacity} ${isPath ? 'stroke-dasharray="6"' : ''}/>`;
          })}
          ${filteredNodes.map(n => html`
            <g @click=${() => { this._cNetSelectedNode = n.id; }}>
              <circle cx=${n.x} cy=${n.y} r="16" fill=${typeColor[n.type] || '#6b7280'} opacity=${n.status === 'inactive' ? 0.3 : n.status === 'warning' ? 0.7 : 1} stroke=${this._cNetSelectedNode === n.id ? '#fbbf24' : 'none'} stroke-width="2"/>
              <text x=${n.x} y=${n.y + 1} text-anchor="middle" fill="white" font-size="7" font-weight="600">${n.type.charAt(0).toUpperCase()}</text>
              <text x=${n.x} y=${n.y + 28} text-anchor="middle" fill="#9ca3af" font-size="8">${n.label}</text>
              ${this._cNetTrafficOverlay ? html`<text x=${n.x} y=${n.y - 20} text-anchor="middle" fill="#60a5fa" font-size="7">${this._cNetEdges.filter(e => e.from === n.id || e.to === n.id).reduce((s,e) => s + e.traffic, 0)} Mbps</text>` : nothing}
            </g>
          `)}
        </svg>
        ${this._cNetPathResult.length > 0 ? html`
          <div style="margin-top:8px;background:#1a1d2e;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:4px">Traced Path (${this._cNetPathResult.length} hops):</div>
            <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
              ${this._cNetPathResult.map((id, i) => {
                const node = nodeMap.get(id);
                return html`
                  <span style="background:#fbbf2422;color:#fbbf24;font-size:10px;padding:2px 8px;border-radius:3px;font-weight:600">${node?.label || id}</span>
                  ${i < this._cNetPathResult.length - 1 ? html`<span style="color:#6b7280">→</span>` : nothing}
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
  @state() private _cSearchQuery: string = '';
  @state() private _cSearchResults: {id:string;title:string;relevance:number;type:string;date:string;preview:string}[] = [];
  @state() private _cSavedSearches: {id:string;query:string;createdAt:string;runCount:number}[] = [];
  @state() private _cRecentSearches: string[] = [];
  @state() private _cSearchFilters: {field:string;operator:string;value:string;logic:'and'|'or'|'not'}[] = [];
  @state() private _cSearchActiveFilterIdx: number = -1;
  @state() private _cSearchPreset: string = 'none';
  @state() private _cSearchIsRunning: boolean = false;

  private _cInitSearchData(): void {
    this._cSavedSearches = [
      {id:'s1',query:'severity:critical status:open',createdAt:'2026-04-20',runCount:12},
      {id:'s2',query:'type:intrusion network:internal',createdAt:'2026-04-18',runCount:8},
      {id:'s3',query:'policy:DLP destination:cloud',createdAt:'2026-04-15',runCount:5},
    ];
    this._cRecentSearches = ['critical vulnerabilities','failed login attempts','data exfiltration','phishing reports'];
  }

  private _cExecuteSearch(): void {
    if (!this._cSearchQuery.trim()) return;
    this._cSearchIsRunning = true;
    this._cRecentSearches = [this._cSearchQuery, ...this._cRecentSearches.filter(s => s !== this._cSearchQuery)].slice(0, 10);
    setTimeout(() => {
      const q = this._cSearchQuery.toLowerCase();
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
      this._cSearchResults = mockData.filter(r => r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || r.preview.toLowerCase().includes(q) || q.length < 3);
      this._cSearchIsRunning = false;
    }, 300);
  }

  private _cAddSearchFilter(): void {
    this._cSearchFilters.push({field:'',operator:'contains',value:'',logic:'and'});
    this._cSearchActiveFilterIdx = this._cSearchFilters.length - 1;
  }

  private _cRemoveSearchFilter(idx: number): void {
    this._cSearchFilters = this._cSearchFilters.filter((_, i) => i !== idx);
    if (this._cSearchActiveFilterIdx >= this._cSearchFilters.length) this._cSearchActiveFilterIdx = -1;
  }

  private _cApplySearchPreset(preset: string): void {
    this._cSearchPreset = preset;
    if (preset === 'critical') this._cSearchQuery = 'severity:critical status:open';
    else if (preset === 'recent') this._cSearchQuery = 'date:>2026-04-20 type:*';
    else if (preset === 'failed') this._cSearchQuery = 'status:failed action:blocked';
    this._cExecuteSearch();
  }

  private _cRenderAdvancedSearch(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Advanced Search and Filter">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Advanced Search</span>
          <div style="display:flex;gap:4px">
            ${['none','critical','recent','failed'].map(p => html`
              <button class="tab ${this._cSearchPreset === p ? 'active' : ''}" @click=${() => this._cApplySearchPreset(p)} style="font-size:10px">${p === 'none' ? 'Presets' : p.charAt(0).toUpperCase() + p.slice(1)}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <div style="flex:1;position:relative">
            <input type="text" placeholder="Search across all data types..." value=${this._cSearchQuery} @input=${(e: any) => { this._cSearchQuery = e.target.value; }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._cExecuteSearch(); }} style="width:100%;background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:6px;padding:8px 12px;font-size:12px;outline:none" aria-label="Search input"/>
          </div>
          <button class="tab active" @click=${() => this._cExecuteSearch()} style="padding:8px 16px" ?disabled=${this._cSearchIsRunning}>${this._cSearchIsRunning ? '...' : 'Search'}</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap">
          <span style="font-size:10px;color:#6b7280">Filters:</span>
          <button class="tab" @click=${() => this._cAddSearchFilter()} style="font-size:10px">+ Add Filter</button>
          ${this._cSearchFilters.map((f, i) => html`
            <div style="display:flex;gap:4px;align-items:center;background:#1a1d2e;border-radius:4px;padding:4px 8px">
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._cSearchFilters[i].field = e.target.value; }}>
                <option value="">Field</option>
                <option value="severity">Severity</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
                <option value="date">Date</option>
                <option value="source">Source</option>
              </select>
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._cSearchFilters[i].operator = e.target.value; }}>
                <option value="contains">Contains</option>
                <option value="equals">Equals</option>
                <option value="starts">Starts with</option>
                <option value="gt">Greater than</option>
                <option value="lt">Less than</option>
              </select>
              <input type="text" placeholder="Value" style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 6px;font-size:10px;width:80px" @input=${(e: any) => { this._cSearchFilters[i].value = e.target.value; }}/>
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._cSearchFilters[i].logic = e.target.value; }}>
                <option value="and">AND</option>
                <option value="or">OR</option>
                <option value="not">NOT</option>
              </select>
              <button @click=${() => this._cRemoveSearchFilter(i)} style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:12px;padding:0 2px">✕</button>
            </div>
          `)}
        </div>
        ${this._cSearchResults.length > 0 ? html`
          <div style="margin-bottom:8px;font-size:10px;color:#9ca3af">${this._cSearchResults.length} results found</div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto">
            ${this._cSearchResults.map(r => html`
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
        ${this._cRecentSearches.length > 0 && this._cSearchResults.length === 0 ? html`
          <div style="margin-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Recent Searches:</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              ${this._cRecentSearches.map(s => html`
                <button class="tab" @click=${() => { this._cSearchQuery = s; this._cExecuteSearch(); }} style="font-size:10px">${s}</button>
              `)}
            </div>
          </div>
        ` : nothing}
        ${this._cSavedSearches.length > 0 ? html`
          <div style="margin-top:8px;border-top:1px solid #1e293b;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Saved Searches:</div>
            <div style="display:flex;flex-direction:column;gap:3px">
              ${this._cSavedSearches.map(s => html`
                <div style="display:flex;justify-content:space-between;align-items:center;background:#1a1d2e;border-radius:4px;padding:4px 8px;cursor:pointer" @click=${() => { this._cSearchQuery = s.query; this._cExecuteSearch(); }}>
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
  @state() private _cUndoStack: {id:number;action:string;timestamp:string;snapshot:string}[] = [];
  @state() private _cRedoStack: {id:number;action:string;timestamp:string;snapshot:string}[] = [];
  @state() private _cHistoryCounter: number = 0;
  @state() private _cHistoryVisible: boolean = false;
  @state() private _cDiffViewActive: boolean = false;
  @state() private _cDiffFromId: number = -1;
  @state() private _cDiffToId: number = -1;
  @state() private _cCurrentSnapshot: string = '';

  private _cPushHistory(action: string): void {
    this._cHistoryCounter++;
    const entry = {
      id: this._cHistoryCounter,
      action,
      timestamp: new Date().toISOString(),
      snapshot: JSON.stringify({searchQuery: this._cSearchQuery, filters: this._cSearchFilters, compFramework: this._cCompActiveFramework, mlView: this._cMlActiveView}),
    };
    this._cUndoStack.push(entry);
    this._cRedoStack = [];
    this._cCurrentSnapshot = entry.snapshot;
  }

  private _cUndo(): void {
    if (this._cUndoStack.length <= 1) return;
    const current = this._cUndoStack.pop()!;
    this._cRedoStack.push(current);
    const prev = this._cUndoStack[this._cUndoStack.length - 1];
    this._cCurrentSnapshot = prev.snapshot;
    try {
      const data = JSON.parse(prev.snapshot);
      if (data.searchQuery !== undefined) this._cSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._cSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._cCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._cMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _cRedo(): void {
    if (this._cRedoStack.length === 0) return;
    const entry = this._cRedoStack.pop()!;
    this._cUndoStack.push(entry);
    this._cCurrentSnapshot = entry.snapshot;
    try {
      const data = JSON.parse(entry.snapshot);
      if (data.searchQuery !== undefined) this._cSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._cSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._cCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._cMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _cJumpToHistory(id: number): void {
    const idx = this._cUndoStack.findIndex(e => e.id === id);
    if (idx < 0) return;
    const removed = this._cUndoStack.splice(idx + 1);
    this._cRedoStack.push(...removed.reverse());
    const target = this._cUndoStack[this._cUndoStack.length - 1];
    this._cCurrentSnapshot = target.snapshot;
    try {
      const data = JSON.parse(target.snapshot);
      if (data.searchQuery !== undefined) this._cSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._cSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._cCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._cMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _cGetDiff(fromId: number, toId: number): {field:string;from:string;to:string}[] {
    const fromEntry = this._cUndoStack.find(e => e.id === fromId);
    const toEntry = this._cUndoStack.find(e => e.id === toId);
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

  private _cRenderUndoRedo(): any {
    const allHistory = [...this._cUndoStack];
    const diffs = this._cDiffViewActive && this._cDiffFromId >= 0 && this._cDiffToId >= 0 ? this._cGetDiff(this._cDiffFromId, this._cDiffToId) : [];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Undo Redo History">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Action History</span>
          <div style="display:flex;gap:4px">
            <button class="tab" @click=${() => this._cUndo()} ?disabled=${this._cUndoStack.length <= 1} style="font-size:10px">↩ Undo</button>
            <button class="tab" @click=${() => this._cRedo()} ?disabled=${this._cRedoStack.length === 0} style="font-size:10px">Redo ↪</button>
            <button class="tab ${this._cHistoryVisible ? 'active' : ''}" @click=${() => { this._cHistoryVisible = !this._cHistoryVisible; }} style="font-size:10px">Timeline</button>
            <button class="tab ${this._cDiffViewActive ? 'active' : ''}" @click=${() => { this._cDiffViewActive = !this._cDiffViewActive; }} style="font-size:10px">Diff</button>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;font-size:10px;color:#6b7280">
          <span>Undo: ${this._cUndoStack.length}</span>
          <span>|</span>
          <span>Redo: ${this._cRedoStack.length}</span>
          <span>|</span>
          <span>Total Actions: ${this._cHistoryCounter}</span>
        </div>
        ${this._cHistoryVisible ? html`
          <div style="background:#1a1d2e;border-radius:6px;padding:8px;max-height:200px;overflow-y:auto;margin-bottom:8px">
            ${allHistory.map((entry, i) => html`
              <div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #0f1117;cursor:pointer;opacity:${i === allHistory.length - 1 ? 1 : 0.6}" @click=${() => this._cJumpToHistory(entry.id)}>
                <div style="width:12px;height:12px;border-radius:50%;background:${i === allHistory.length - 1 ? '#3b82f6' : '#374151'};flex-shrink:0"></div>
                <span style="font-size:10px;color:#e2e8f0;flex:1">${entry.action}</span>
                <span style="font-size:9px;color:#6b7280">${new Date(entry.timestamp).toLocaleTimeString()}</span>
                ${this._cDiffViewActive ? html`
                  <input type="radio" name="diff-from" style="accent-color:#3b82f6" @change=${() => { this._cDiffFromId = entry.id; }}/>
                  <input type="radio" name="diff-to" style="accent-color:#f97316" @change=${() => { this._cDiffToId = entry.id; }}/>
                ` : nothing}
              </div>
            `)}
          </div>
        ` : nothing}
        ${this._cDiffViewActive ? html`
          <div style="background:#1a1d2e;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:6px">${diffs.length > 0 ? 'Differences found:' : this._cDiffFromId >= 0 && this._cDiffToId >= 0 ? 'No differences' : 'Select two points in timeline to compare'}</div>
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
  @state() private _cActiveSubTab: string = 'scenario';

  private _cGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _cRenderSubPanel(): any {
    switch (this._cActiveSubTab) {
      case 'scenario': return this._cRenderScenarioEngine();
      case 'timeseries': return this._cRenderTimeSeries();
      case 'rbac': return this._cRenderRBAC();
      case 'reporting': return this._cRenderReporting();
      case 'a11y': return this._cRenderAccessibility();
      default: return nothing;
    }
  }

  private _cRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._cGetAllSubTabs().map(t => html`
          <button class="tab ${this._cActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._cActiveSubTab = t.key; }} role="tab" aria-selected=${this._cActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="c-tab-${this._cActiveSubTab}">
        ${this._cRenderSubPanel()}
      </div>
    `;
  }

  
  // Register new subtabs for extended sections
  private _champGetNewSubTabs(): {key:string;label:string}[] {
    return [
      { key: 'analytics', label: 'Analytics' },
      { key: 'incident-coord', label: 'IR Coordination' },
      { key: 'metrics-corr', label: 'Metrics Correlation' },
      { key: 'api-gateway', label: 'API Gateway' },
      { key: 'perf-opt', label: 'Performance' },
    ];
  }

  // ========== Section A: Advanced Analytics Engine ==========
  @state() private _champBayesianPrior: number = 0.5;
  @state() private _champBayesianLikelihood: number = 0.7;
  @state() private _champMonteCarloResults: number[] = [];
  @state() private _champCorrelationMatrix: number[][] = [];
  @state() private _champOutlierIndices: number[] = [];
  @state() private _champTrendComponents: {trend:number;seasonal:number;residual:number}[] = [];
  @state() private _champAnalyticsView: string = 'bayesian';
  @state() private _champConfidenceLevel: number = 95;
  @state() private _champMonteCarloIterations: number = 100;

  private _champCalculateBayesianPosterior(): number {
    const prior = this._champBayesianPrior;
    const likelihood = this._champBayesianLikelihood;
    const falsePositiveRate = 1 - likelihood;
    const marginal = prior * likelihood + (1 - prior) * falsePositiveRate;
    return marginal > 0 ? (prior * likelihood) / marginal : 0;
  }

  private _champRunMonteCarloSimulation(): number[] {
    const results: number[] = [];
    const baseRisk = 0.35;
    const volatility = 0.15;
    for (let i = 0; i < this._champMonteCarloIterations; i++) {
      let cumulative = baseRisk;
      for (let j = 0; j < 12; j++) {
        const shock = (Math.random() - 0.5) * 2 * volatility;
        cumulative = Math.max(0, Math.min(1, cumulative + shock * 0.1));
      }
      results.push(cumulative);
    }
    this._champMonteCarloResults = results;
    return results;
  }

  private _champComputeCorrelationMatrix(): number[][] {
    const events = this._champGenerateMockTimeSeries(6, 50);
    const n = events.length;
    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        row.push(this._champPearsonCorrelation(events[i], events[j]));
      }
      matrix.push(row);
    }
    this._champCorrelationMatrix = matrix;
    return matrix;
  }

  private _champPearsonCorrelation(x: number[], y: number[]): number {
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

  private _champDetectOutliersZScore(data: number[]): number[] {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length);
    const threshold = 2.0;
    return data.map((v, i) => Math.abs((v - mean) / (std || 1)) > threshold ? i : -1).filter(i => i >= 0);
  }

  private _champDetectOutliersIQR(data: number[]): number[] {
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    return data.map((v, i) => v < lower || v > upper ? i : -1).filter(i => i >= 0);
  }

  private _champDecomposeTrend(data: number[]): {trend:number;seasonal:number;residual:number}[] {
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
    this._champTrendComponents = result;
    return result;
  }

  private _champPredictiveScoreWithCI(data: number[]): {score:number;low:number;high:number} {
    const recent = data.slice(-10);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const std = Math.sqrt(recent.reduce((a, b) => a + (b - avg) ** 2, 0) / recent.length);
    const zScore = this._champConfidenceLevel === 99 ? 2.576 : this._champConfidenceLevel === 90 ? 1.645 : 1.96;
    return { score: avg, low: avg - zScore * std, high: avg + zScore * std };
  }

  private _champGenerateMockTimeSeries(count: number, length: number): number[][] {
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

  private _champRenderAnalyticsEngine(): any {
    const posterior = this._champCalculateBayesianPosterior();
    const mcResults = this._champMonteCarloResults.length > 0 ? this._champMonteCarloResults : this._champRunMonteCarloSimulation();
    const mcAvg = mcResults.reduce((a, b) => a + b, 0) / mcResults.length;
    const mcP95 = [...mcResults].sort((a, b) => a - b)[Math.floor(mcResults.length * 0.95)];
    const matrix = this._champCorrelationMatrix.length > 0 ? this._champCorrelationMatrix : this._champComputeCorrelationMatrix();
    const labels = ['Vulns', 'Incidents', 'Phishing', 'Access', 'Compliance', 'Training'];
    return html`
      <div class="analytics-engine" style="padding:12px">
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <button class="tab ${this._champAnalyticsView === 'bayesian' ? 'active' : ''}" @click=${() => { this._champAnalyticsView = 'bayesian'; }}>Bayesian</button>
          <button class="tab ${this._champAnalyticsView === 'montecarlo' ? 'active' : ''}" @click=${() => { this._champAnalyticsView = 'montecarlo'; }}>Monte Carlo</button>
          <button class="tab ${this._champAnalyticsView === 'correlation' ? 'active' : ''}" @click=${() => { this._champAnalyticsView = 'correlation'; }}>Correlation</button>
          <button class="tab ${this._champAnalyticsView === 'outliers' ? 'active' : ''}" @click=${() => { this._champAnalyticsView = 'outliers'; }}>Outliers</button>
          <button class="tab ${this._champAnalyticsView === 'trend' ? 'active' : ''}" @click=${() => { this._champAnalyticsView = 'trend'; }}>Trend</button>
          <button class="tab ${this._champAnalyticsView === 'predictive' ? 'active' : ''}" @click=${() => { this._champAnalyticsView = 'predictive'; }}>Predictive</button>
        </div>
        ${this._champAnalyticsView === 'bayesian' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Bayesian Risk Probability</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div><span style="color:#888">Prior:</span> ${this._champBayesianPrior.toFixed(2)}</div>
              <div><span style="color:#888">Likelihood:</span> ${this._champBayesianLikelihood.toFixed(2)}</div>
              <div><span style="color:#888">Posterior:</span> <strong style="color:${posterior > 0.6 ? '#f44' : '#4f4'}">${posterior.toFixed(4)}</strong></div>
              <div><span style="color:#888">Risk Level:</span> ${posterior > 0.7 ? 'Critical' : posterior > 0.5 ? 'High' : posterior > 0.3 ? 'Medium' : 'Low'}</div>
            </div>
            <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
              <label style="color:#888;font-size:12px">Prior:</label>
              <input type="range" min="0" max="100" .value=${String(this._champBayesianPrior * 100)} @input=${(e: any) => { this._champBayesianPrior = Number(e.target.value) / 100; }} style="flex:1" />
              <label style="color:#888;font-size:12px">Likelihood:</label>
              <input type="range" min="0" max="100" .value=${String(this._champBayesianLikelihood * 100)} @input=${(e: any) => { this._champBayesianLikelihood = Number(e.target.value) / 100; }} style="flex:1" />
            </div>
          </div>
        ` : nothing}
        ${this._champAnalyticsView === 'montecarlo' ? html`
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
            <button class="btn" style="margin-top:8px" @click=${() => { this._champRunMonteCarloSimulation(); }}>Re-run Simulation</button>
          </div>
        ` : nothing}
        ${this._champAnalyticsView === 'correlation' ? html`
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
        ${this._champAnalyticsView === 'outliers' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Statistical Outlier Detection</h4>
            ${['zscore', 'iqr'].map(method => {
              const data = this._champGenerateMockTimeSeries(1, 30)[0];
              const outliers = method === 'zscore' ? this._champDetectOutliersZScore(data) : this._champDetectOutliersIQR(data);
              return html`<div style="margin-bottom:8px">
                <div style="color:#aaa;font-size:12px">${method === 'zscore' ? 'Z-Score Method' : 'IQR Method'}: ${outliers.length} outliers detected</div>
                <div style="display:flex;gap:1px;height:30px;align-items:flex-end">${data.map((v, i) => html`<div style="flex:1;background:${outliers.includes(i) ? '#f44' : '#3a3d4a'};height:${v}%;min-height:1px"></div>`)}</div>
              </div>`;
            })}
          </div>
        ` : nothing}
        ${this._champAnalyticsView === 'trend' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Trend Decomposition</h4>
            ${['Trend', 'Seasonal', 'Residual'].map((comp, ci) => html`
              <div style="margin-bottom:8px">
                <div style="color:#aaa;font-size:12px">${comp}</div>
                <div style="display:flex;gap:1px;height:25px;align-items:center">${this._champDecomposeTrend(this._champGenerateMockTimeSeries(1, 24)[0]).map(p => {
                  const val = [p.trend, p.seasonal * 500, p.residual][ci];
                  return html`<div style="flex:1;background:${ci === 0 ? '#4a9' : ci === 1 ? '#a4a' : '#aa4'};height:${Math.abs(val) * 50}%;min-height:1px"></div>`;
                })}</div>
              </div>
            `)}
          </div>
        ` : nothing}
        ${this._champAnalyticsView === 'predictive' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Predictive Scoring with Confidence Intervals</h4>
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
              <label style="color:#888;font-size:12px">Confidence:</label>
              <select .value=${String(this._champConfidenceLevel)} @change=${(e: any) => { this._champConfidenceLevel = Number(e.target.value); }}>
                <option value="90">90%</option><option value="95">95%</option><option value="99">99%</option>
              </select>
            </div>
            ${['Risk Score', 'Compliance', 'Threat Index'].map(label => {
              const data = this._champGenerateMockTimeSeries(1, 20)[0];
              const pred = this._champPredictiveScoreWithCI(data);
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
  @state() private _champWarRoomActive: boolean = false;
  @state() private _champWarRoomParticipants: string[] = ['SOC Lead', 'IR Manager', 'CISO', 'Legal', 'PR'];
  @state() private _champIncidentSeverity: string = 'P3';
  @state() private _champEscalationLevel: number = 0;
  @state() private _champCommTemplate: string = 'initial';
  @state() private _champLessonsLearned: string = '';
  @state() private _champPostIncidentAnswers: Record<string, string> = {};
  @state() private _champWarRoomMessages: {sender:string;time:string;text:string}[] = [];

  private _champGetSeverityMatrix(): {severity:string;responseTime:string;escalation:string;notify:string}[] {
    return [
      { severity: 'P1 - Critical', responseTime: '15 min', escalation: 'CISO + CEO + Legal', notify: 'All stakeholders immediately' },
      { severity: 'P2 - High', responseTime: '30 min', escalation: 'CISO + IR Manager', notify: 'Security team + affected dept heads' },
      { severity: 'P3 - Medium', responseTime: '2 hours', escalation: 'IR Manager', notify: 'Security team' },
      { severity: 'P4 - Low', responseTime: '24 hours', escalation: 'SOC Lead', notify: 'Ticket created' },
    ];
  }

  private _champGetCommunicationTemplates(): {key:string;subject:string;body:string}[] {
    return [
      { key: 'initial', subject: 'Security Incident Notification', body: 'We are investigating a potential security incident. The security team has been activated and is assessing the scope. We will provide updates every 30 minutes. Please do not share this information externally.' },
      { key: 'escalation', subject: 'Incident Escalation - Action Required', body: 'The incident has been escalated to P1 severity. Additional resources have been engaged. All non-essential access to affected systems has been suspended pending investigation.' },
      { key: 'contained', subject: 'Incident Containment Update', body: 'The incident has been contained. Affected systems have been isolated. Forensic analysis is ongoing. We will provide a detailed timeline within 24 hours.' },
      { key: 'resolved', subject: 'Incident Resolution Notification', body: 'The incident has been fully resolved. Root cause analysis is complete. Remediation actions have been implemented. A post-incident review has been scheduled.' },
      { key: 'external', subject: 'Security Advisory', body: 'We have identified and resolved a security matter. There is no evidence of customer data impact. We are working with relevant authorities and will provide updates as appropriate.' },
    ];
  }

  private _champGetStakeholderMatrix(): {role:string;notifyP1:boolean;notifyP2:boolean;notifyP3:boolean;channel:string}[] {
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

  private _champGetPostIncidentQuestions(): {id:string;question:string;type:string;options:string[]}[] {
    return [
      { id: 'q1', question: 'What was the initial detection method?', type: 'select', options: ['SIEM Alert', 'User Report', 'Threat Intel Feed', 'Automated Scan', 'Third-party Notification'] },
      { id: 'q2', question: 'How long was the dwell time?', type: 'select', options: ['< 1 hour', '1-24 hours', '1-7 days', '7-30 days', '> 30 days'] },
      { id: 'q3', question: 'Was the incident response plan followed?', type: 'select', options: ['Fully', 'Partially', 'Deviated significantly', 'No plan existed'] },
      { id: 'q4', question: 'What was the root cause category?', type: 'select', options: ['Misconfiguration', 'Unpatched Vulnerability', 'Social Engineering', 'Insider Threat', 'Zero-day Exploit', 'Supply Chain'] },
      { id: 'q5', question: 'What improvements are needed?', type: 'text', options: [] },
    ];
  }

  private _champToggleWarRoom(): void {
    this._champWarRoomActive = !this._champWarRoomActive;
    if (this._champWarRoomActive) {
      this._champWarRoomMessages = [
        { sender: 'System', time: new Date().toLocaleTimeString(), text: 'War room activated. All participants notified.' },
        { sender: 'SOC Lead', time: new Date().toLocaleTimeString(), text: 'Acknowledged. Investigating initial indicators.' },
      ];
    }
  }

  private _champSendWarRoomMessage(text: string): void {
    this._champWarRoomMessages = [...this._champWarRoomMessages, {
      sender: 'You', time: new Date().toLocaleTimeString(), text
    }];
  }

  private _champEscalateIncident(): void {
    const levels = ['P4', 'P3', 'P2', 'P1'];
    const idx = levels.indexOf(this._champIncidentSeverity);
    if (idx < levels.length - 1) {
      this._champIncidentSeverity = levels[idx + 1];
      this._champEscalationLevel = idx + 1;
    }
  }

  private _champRenderIncidentCoordination(): any {
    const templates = this._champGetCommunicationTemplates();
    const currentTemplate = templates.find(t => t.key === this._champCommTemplate) || templates[0];
    const questions = this._champGetPostIncidentQuestions();
    const severityMatrix = this._champGetSeverityMatrix();
    const stakeholders = this._champGetStakeholderMatrix();
    return html`
      <div class="incident-coordination" style="padding:12px">
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <button class="tab ${this._champWarRoomActive ? 'active' : ''}" @click=${() => { this._champToggleWarRoom(); }}>War Room ${this._champWarRoomActive ? '(Active)' : ''}</button>
          <button class="tab" @click=${() => { this._champEscalateIncident(); }}>Escalate (${this._champIncidentSeverity})</button>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Severity Escalation Matrix</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Severity</th><th style="color:#888">Response Time</th><th style="color:#888">Escalation</th><th style="color:#888">Notification</th></tr></thead>
            <tbody>${severityMatrix.map(r => html`
              <tr style="${r.severity.startsWith(this._champIncidentSeverity) ? 'background:rgba(255,68,68,0.15)' : ''}">
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
            ${templates.map(t => html`<button class="tab ${this._champCommTemplate === t.key ? 'active' : ''}" @click=${() => { this._champCommTemplate = t.key; }}>${t.subject.split(' - ')[0]}</button>`)}
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
                <select style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px" @change=${(e: any) => { this._champPostIncidentAnswers = {...this._champPostIncidentAnswers, [q.id]: e.target.value}; }}>
                  <option value="">Select...</option>
                  ${q.options.map(o => html`<option value="${o}" ${this._champPostIncidentAnswers[q.id] === o ? 'selected' : ''}>${o}</option>`)}
                </select>
              ` : html`
                <textarea style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px;min-height:40px" placeholder="Enter details..." @input=${(e: any) => { this._champPostIncidentAnswers = {...this._champPostIncidentAnswers, [q.id]: e.target.value}; }}></textarea>
              `}
            </div>
          `)}
          <div style="margin-top:8px">
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:4px">Lessons Learned</label>
            <textarea style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px;min-height:60px" .value=${this._champLessonsLearned} @input=${(e: any) => { this._champLessonsLearned = e.target.value; }}></textarea>
          </div>
        </div>
      </div>
    `;
  }

  // ========== Section C: Security Metrics Correlation ==========
  @state() private _champMetricData: Record<string, number[]> = {};
  @state() private _champCompositeScore: number = 72;
  @state() private _champMetricAlerts: string[] = [];
  @state() private _champLeadingIndicators: string[] = ['Phishing Click Rate', 'Patch Compliance', 'Training Completion', 'Access Review Age'];
  @state() private _champLaggingIndicators: string[] = ['Incident Count', 'MTTR', 'Data Breach Cost', 'Compliance Failures'];
  @state() private _champExecutiveSummary: string = '';

  private _champInitializeMetricData(): void {
    const metrics = ['Vulnerability Count', 'Incident Rate', 'Patch Coverage', 'Training Score', 'Compliance Pct', 'Access Anomalies'];
    metrics.forEach(m => {
      this._champMetricData[m] = this._champGenerateMockTimeSeries(1, 30)[0];
    });
  }

  private _champCalculateCompositeScore(): number {
    const weights: Record<string, number> = {
      'Vulnerability Count': -0.2, 'Incident Rate': -0.25, 'Patch Coverage': 0.2,
      'Training Score': 0.15, 'Compliance Pct': 0.15, 'Access Anomalies': -0.05
    };
    let score = 75;
    for (const [metric, weight] of Object.entries(weights)) {
      const data = this._champMetricData[metric];
      if (data && data.length > 0) {
        const recent = data.slice(-7);
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        score += (avg - 50) * weight;
      }
    }
    this._champCompositeScore = Math.max(0, Math.min(100, score));
    return this._champCompositeScore;
  }

  private _champDetectMetricAnomalies(): string[] {
    const alerts: string[] = [];
    for (const [metric, data] of Object.entries(this._champMetricData)) {
      if (!data || data.length < 10) continue;
      const outliers = this._champDetectOutliersZScore(data);
      if (outliers.length > 0) {
        alerts.push(metric + ': ' + outliers.length + ' anomalous data points detected in last ' + data.length + ' periods');
      }
      const last = data[data.length - 1];
      const prev = data[data.length - 2];
      if (Math.abs(last - prev) / (Math.abs(prev) || 1) > 0.5) {
        alerts.push(metric + ': ' + (last > prev ? 'Sudden increase' : 'Sudden decrease') + ' of ' + (Math.abs(last - prev) / (Math.abs(prev) || 1) * 100).toFixed(0) + '%');
      }
    }
    this._champMetricAlerts = alerts;
    return alerts;
  }

  private _champGenerateExecutiveSummary(): string {
    const score = this._champCalculateCompositeScore();
    const alerts = this._champDetectMetricAnomalies();
    const scoreTrend = score > 80 ? 'improving' : score > 60 ? 'stable' : 'declining';
    let summary = 'Security Posture Score: ' + score.toFixed(0) + '/100 (' + scoreTrend + '). ';
    summary += 'Leading indicators show ' + (this._champLeadingIndicators.length > 2 ? 'generally positive' : 'mixed') + ' trends. ';
    if (alerts.length > 0) {
      summary += 'Active alerts: ' + alerts.length + '. Key concerns: ' + alerts.slice(0, 3).join('; ') + '. ';
    } else {
      summary += 'No critical metric anomalies detected. ';
    }
    summary += 'Recommendation: ' + (score > 80 ? 'Maintain current security posture and continue monitoring.' : score > 60 ? 'Focus on patch management and training completion rates.' : 'Immediate attention required for vulnerability remediation and incident response readiness.');
    this._champExecutiveSummary = summary;
    return summary;
  }

  private _champRenderMetricsCorrelation(): any {
    if (Object.keys(this._champMetricData).length === 0) this._champInitializeMetricData();
    const score = this._champCalculateCompositeScore();
    const alerts = this._champDetectMetricAnomalies();
    const metricNames = Object.keys(this._champMetricData);
    const corrMatrix = metricNames.map((m1, i) =>
      metricNames.map((m2, j) => this._champPearsonCorrelation(this._champMetricData[m1] || [], this._champMetricData[m2] || []))
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
              ${this._champLeadingIndicators.map(ind => html`<div style="color:#aaa;font-size:11px;padding:2px 0">- ${ind}</div>`)}
            </div>
            <div>
              <div style="color:#a4a;font-size:12px;font-weight:bold;margin-bottom:4px">Lagging (Reactive)</div>
              ${this._champLaggingIndicators.map(ind => html`<div style="color:#aaa;font-size:11px;padding:2px 0">- ${ind}</div>`)}
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
          <div style="background:#1a1d27;padding:8px;border-radius:4px;color:#bbb;font-size:12px;line-height:1.6">${this._champGenerateExecutiveSummary()}</div>
          <button class="btn" style="margin-top:8px;font-size:11px" @click=${() => { this._champGenerateExecutiveSummary(); }}>Regenerate Summary</button>
        </div>
      </div>
    `;
  }

  // ========== Section D: API Gateway & Rate Limiting ==========
  @state() private _champApiEndpoints: {id:string;path:string;method:string;status:string;latency:number;rateLimit:number}[] = [];
  @state() private _champRateLimitPolicy: {endpoint:string;requestsPerMin:number;burstLimit:number;windowSec:number}[] = [];
  @state() private _champApiKeys: {id:string;name:string;created:string;expires:string;status:string;lastUsed:string}[] = [];
  @state() private _champWebhookStatuses: {id:string;url:string;events:string;lastDelivery:string;status:string;retryCount:number}[] = [];

  private _champInitializeApiData(): void {
    this._champApiEndpoints = [
      { id: 'api-1', path: '/api/v1/security/events', method: 'POST', status: 'active', latency: 45, rateLimit: 100 },
      { id: 'api-2', path: '/api/v1/vulnerabilities', method: 'GET', status: 'active', latency: 120, rateLimit: 200 },
      { id: 'api-3', path: '/api/v1/incidents', method: 'POST', status: 'active', latency: 85, rateLimit: 50 },
      { id: 'api-4', path: '/api/v1/assets', method: 'GET', status: 'active', latency: 200, rateLimit: 150 },
      { id: 'api-5', path: '/api/v1/compliance', method: 'GET', status: 'deprecated', latency: 350, rateLimit: 30 },
    ];
    this._champRateLimitPolicy = [
      { endpoint: '/api/v1/security/*', requestsPerMin: 100, burstLimit: 150, windowSec: 60 },
      { endpoint: '/api/v1/vulnerabilities/*', requestsPerMin: 200, burstLimit: 300, windowSec: 60 },
      { endpoint: '/api/v1/incidents/*', requestsPerMin: 50, burstLimit: 75, windowSec: 60 },
      { endpoint: '/api/v1/assets/*', requestsPerMin: 150, burstLimit: 200, windowSec: 60 },
    ];
    this._champApiKeys = [
      { id: 'key-1', name: 'SOC Integration Key', created: '2025-01-15', expires: '2026-01-15', status: 'active', lastUsed: '2 min ago' },
      { id: 'key-2', name: 'SIEM Connector', created: '2025-03-20', expires: '2026-03-20', status: 'active', lastUsed: '5 min ago' },
      { id: 'key-3', name: 'Legacy Scanner', created: '2024-06-01', expires: '2025-06-01', status: 'expired', lastUsed: '30 days ago' },
    ];
    this._champWebhookStatuses = [
      { id: 'wh-1', url: 'https://hooks.slack.com/services/T00/B00/xxx', events: 'incident.created', lastDelivery: '1 min ago', status: 'success', retryCount: 0 },
      { id: 'wh-2', url: 'https://api.pagerduty.com/integration/xxx', events: 'incident.escalated', lastDelivery: '5 min ago', status: 'success', retryCount: 0 },
      { id: 'wh-3', url: 'https://webhooks.jira.com/xxx', events: 'vulnerability.critical', lastDelivery: 'Failed', status: 'failed', retryCount: 3 },
    ];
  }

  private _champUpdateRateLimit(endpoint: string, field: string, value: number): void {
    this._champRateLimitPolicy = this._champRateLimitPolicy.map(p =>
      p.endpoint === endpoint ? { ...p, [field]: value } : p
    );
  }

  private _champRenderApiGateway(): any {
    if (this._champApiEndpoints.length === 0) this._champInitializeApiData();
    const totalRpm = this._champApiEndpoints.reduce((a, e) => a + (Math.random() * e.rateLimit * 0.5), 0);
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
              <div style="color:#e0e0e0;font-size:20px;font-weight:bold">${this._champApiEndpoints.length}</div>
              <div style="color:#888;font-size:10px">Active Endpoints</div>
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">API Endpoints</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Endpoint</th><th style="color:#888">Method</th><th style="color:#888">Latency</th><th style="color:#888">Rate Limit</th><th style="color:#888">Status</th></tr></thead>
            <tbody>${this._champApiEndpoints.map(e => html`
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
          ${this._champRateLimitPolicy.map(p => html`
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;padding:4px;background:#1a1d27;border-radius:4px">
              <span style="color:#ddd;font-size:10px;font-family:monospace;min-width:160px">${p.endpoint}</span>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="color:#888;font-size:10px">RPM:</span>
                <input type="number" style="background:#0d0f17;color:#ddd;border:1px solid #333;padding:2px 4px;border-radius:3px;width:60px;font-size:11px" .value=${String(p.requestsPerMin)} @change=${(e: any) => { this._champUpdateRateLimit(p.endpoint, 'requestsPerMin', Number(e.target.value)); }} />
              </div>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="color:#888;font-size:10px">Burst:</span>
                <input type="number" style="background:#0d0f17;color:#ddd;border:1px solid #333;padding:2px 4px;border-radius:3px;width:60px;font-size:11px" .value=${String(p.burstLimit)} @change=${(e: any) => { this._champUpdateRateLimit(p.endpoint, 'burstLimit', Number(e.target.value)); }} />
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
            <tbody>${this._champApiKeys.map(k => html`
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
          ${this._champWebhookStatuses.map(w => html`
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
  @state() private _champRenderTime: number = 0;
  @state() private _champMemoryEstimate: number = 0;
  @state() private _champCacheHits: number = 0;
  @state() private _champCacheMisses: number = 0;
  @state() private _champLazyLoadingEnabled: boolean = true;
  @state() private _champVirtualScrollEnabled: boolean = false;
  @state() private _champPerfHistory: {timestamp:number;renderMs:number;memoryKb:number;cacheRatio:number}[] = [];
  @state() private _champDataSetSize: number = 1000;

  private _champMeasurePerformance(): void {
    const start = performance.now();
    const data = Array.from({ length: this._champDataSetSize }, (_, i) => ({
      id: i, value: Math.random() * 100, category: ['A', 'B', 'C'][i % 3],
      timestamp: Date.now() - i * 60000
    }));
    const filtered = data.filter(d => d.value > 30).map(d => d.value).sort((a, b) => b - a);
    const end = performance.now();
    this._champRenderTime = Math.round((end - start) * 100) / 100;
    this._champMemoryEstimate = Math.round((this._champDataSetSize * 0.15) * 100) / 100;
    this._champCacheHits = Math.floor(Math.random() * 80 + 60);
    this._champCacheMisses = Math.floor(Math.random() * 30 + 10);
    this._champPerfHistory.push({
      timestamp: Date.now(), renderMs: this._champRenderTime,
      memoryKb: this._champMemoryEstimate,
      cacheRatio: this._champCacheHits / (this._champCacheHits + this._champCacheMisses)
    });
    if (this._champPerfHistory.length > 20) this._champPerfHistory = this._champPerfHistory.slice(-20);
  }

  private _champGetCacheRatio(): number {
    const total = this._champCacheHits + this._champCacheMisses;
    return total > 0 ? this._champCacheHits / total : 0;
  }

  private _champGetPerfRecommendation(): string {
    if (this._champRenderTime > 50) return 'High render time detected. Consider enabling virtual scrolling and reducing data set size.';
    if (this._champGetCacheRatio() < 0.7) return 'Cache hit ratio is low. Review cache invalidation strategy and increase cache TTL.';
    if (this._champMemoryEstimate > 500) return 'High memory usage. Enable lazy loading and consider pagination for large datasets.';
    if (this._champDataSetSize > 500 && !this._champVirtualScrollEnabled) return 'Large dataset detected. Enable virtual scrolling for optimal performance.';
    return 'Performance is within acceptable parameters. Continue monitoring.';
  }

  private _champRenderPerformancePanel(): any {
    if (this._champPerfHistory.length === 0) this._champMeasurePerformance();
    const cacheRatio = this._champGetCacheRatio();
    const recommendation = this._champGetPerfRecommendation();
    const isWarning = recommendation.includes('detected') || recommendation.includes('low') || recommendation.includes('High');
    return html`
      <div class="perf-panel" style="padding:12px">
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Render Performance Metrics</h4>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${this._champRenderTime > 50 ? '#f44' : '#4f4'};font-size:18px;font-weight:bold">${this._champRenderTime}ms</div>
              <div style="color:#888;font-size:10px">Render Time</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${this._champMemoryEstimate > 500 ? '#fa0' : '#4a9'};font-size:18px;font-weight:bold">${this._champMemoryEstimate}KB</div>
              <div style="color:#888;font-size:10px">Memory Est.</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${cacheRatio > 0.8 ? '#4f4' : '#fa0'};font-size:18px;font-weight:bold">${(cacheRatio * 100).toFixed(0)}%</div>
              <div style="color:#888;font-size:10px">Cache Hit Ratio</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:#e0e0e0;font-size:18px;font-weight:bold">${this._champDataSetSize}</div>
              <div style="color:#888;font-size:10px">Dataset Size</div>
            </div>
          </div>
          <div style="margin-top:8px">
            <div style="display:flex;gap:8px;align-items:center">
              <label style="color:#888;font-size:12px">Dataset size:</label>
              <input type="range" min="100" max="10000" step="100" .value=${String(this._champDataSetSize)} @input=${(e: any) => { this._champDataSetSize = Number(e.target.value); }} style="flex:1" />
              <button class="btn" style="font-size:11px" @click=${() => { this._champMeasurePerformance(); }}>Benchmark</button>
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Optimization Controls</h4>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;color:#ddd;font-size:12px;cursor:pointer">
              <input type="checkbox" .checked=${this._champLazyLoadingEnabled} @change=${(e: any) => { this._champLazyLoadingEnabled = e.target.checked; }} />
              Lazy Loading
            </label>
            <label style="display:flex;align-items:center;gap:6px;color:#ddd;font-size:12px;cursor:pointer">
              <input type="checkbox" .checked=${this._champVirtualScrollEnabled} @change=${(e: any) => { this._champVirtualScrollEnabled = e.target.checked; }} />
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
                <span>Hits: ${this._champCacheHits}</span><span>Misses: ${this._champCacheMisses}</span>
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
            ${this._champPerfHistory.slice(-15).map(h => html`
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
  @state() private _chaAle: number = 0;
  @state() private _chaSroi: number = 0;
  @state() private _chaCpi: number = 0;
  @state() private _chaBudgetAlloc: number = 0;
  @state() private _chaCostBenefit: number = 0;

  // Security Economics Calculator
  private chaInitEconomics() {
    this._chaAle = Math.round(2850000 + Math.random() * 4500000);
    this._chaSroi = Math.round(180 + Math.random() * 320);
    this._chaCpi = Math.round(45000 + Math.random() * 120000);
    this._chaBudgetAlloc = Math.round(2500000 + Math.random() * 3000000);
    this._chaCostBenefit = Math.round(220 + Math.random() * 180);
  }

  private _chaCalcAle(): { annual: number; perIncident: number; byCategory: Array<{name: string; value: number}> } {
    const base = this._chaAle;
    const categories = [
      { name: "Data Breach", value: Math.round(base * 0.35) },
      { name: "Ransomware", value: Math.round(base * 0.25) },
      { name: "Insider Threat", value: Math.round(base * 0.18) },
      { name: "Business Disruption", value: Math.round(base * 0.12) },
      { name: "Regulatory Fines", value: Math.round(base * 0.10) }
    ];
    return { annual: base, perIncident: Math.round(base / (3 + Math.floor(Math.random() * 8))), byCategory: categories };
  }

  private _chaCalcSroi(): Array<{year: number; investment: number; savings: number; roi: number}> {
    const baseInv = this._chaSroi * 10000;
    const projections: Array<{year: number; investment: number; savings: number; roi: number}> = [];
    for (let i = 1; i <= 5; i++) {
      const inv = Math.round(baseInv * (1 + 0.08 * i));
      const savings = Math.round(inv * (0.6 + i * 0.25));
      projections.push({ year: 2026 + i, investment: inv, savings, roi: Math.round((savings - inv) / inv * 100) });
    }
    return projections;
  }

  private _chaGetBudgetAlloc(): Array<{category: string; amount: number; pct: number; trend: string}> {
    const total = this._chaBudgetAlloc;
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

  private _chaGetCostBenefit(): Array<{control: string; cost: number; benefit: number; ratio: number; priority: string}> {
    const base = this._chaCostBenefit;
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

  private _chaRenderEconomics() {
    const ale = this._chaCalcAle();
    const roi = this._chaCalcSroi();
    const budget = this._chaGetBudgetAlloc();
    const cb = this._chaGetCostBenefit();
    const cpi = this._chaCpi;
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

  @state() private _chaThreatLevel: any = null;
  @state() private _chaEmergingThreats: any = null;
  @state() private _chaThreatTrends: any = null;
  @state() private _chaSectorRadar: any = null;
  @state() private _chaActorActivity: any = null;

  // Threat Landscape Intelligence
  private chaInitThreatIntel() {
    this._chaThreatLevel = {
      americas: Math.round(50 + Math.random() * 40),
      europe: Math.round(40 + Math.random() * 45),
      asiaPacific: Math.round(55 + Math.random() * 35),
      middleEast: Math.round(45 + Math.random() * 50),
      africa: Math.round(30 + Math.random() * 40)
    };
    this._chaEmergingThreats = [
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
    this._chaThreatTrends = [
      { month: "Jan", phishing: 142, malware: 89, ransomware: 34 },
      { month: "Feb", phishing: 158, malware: 95, ransomware: 38 },
      { month: "Mar", phishing: 175, malware: 102, ransomware: 42 },
      { month: "Apr", phishing: 163, malware: 98, ransomware: 39 }
    ];
    this._chaSectorRadar = [
      { sector: "Financial", risk: 82, trend: "up" },
      { sector: "Healthcare", risk: 78, trend: "up" },
      { sector: "Technology", risk: 71, trend: "stable" },
      { sector: "Government", risk: 85, trend: "up" },
      { sector: "Energy", risk: 68, trend: "down" }
    ];
    this._chaActorActivity = [
      { actor: "APT-29", country: "Russia", activity: 85, targets: "Government" },
      { actor: "Lazarus", country: "DPRK", activity: 72, targets: "Financial" },
      { actor: "APT-41", country: "China", activity: 68, targets: "Technology" },
      { actor: "Fancy Bear", country: "Russia", activity: 64, targets: "Healthcare" },
      { actor: "Charming Kitten", country: "Iran", activity: 58, targets: "Energy" }
    ];
  }

  private _chaRenderThreatIntel() {
    const tl = this._chaThreatLevel;
    const et = this._chaEmergingThreats;
    const sr = this._chaSectorRadar;
    const aa = this._chaActorActivity;
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

  @state() private _chaPolicies: any = null;
  @state() private _chaExceptions: any = null;
  @state() private _chaRiskRegister: any = null;
  @state() private _chaMeetings: any = null;
  @state() private _chaDeadlines: any = null;

  // Security Governance Dashboard
  private chaInitGovernance() {
    this._chaPolicies = [
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
    this._chaExceptions = [
      { id: "EXC-001", policy: "Access Control", reason: "Legacy system", risk: "Medium", expiry: "2026-06-30" },
      { id: "EXC-002", policy: "Encryption", reason: "Performance", risk: "High", expiry: "2026-05-15" },
      { id: "EXC-003", policy: "Password Policy", reason: "Vendor req", risk: "Low", expiry: "2026-08-01" }
    ];
    this._chaRiskRegister = [
      { id: "RSK-001", desc: "Unpatched Exchange", likelihood: 4, impact: 5, owner: "IT Ops" },
      { id: "RSK-002", desc: "Shadow IT SaaS", likelihood: 3, impact: 4, owner: "CISO" },
      { id: "RSK-003", desc: "Privileged Access Creep", likelihood: 3, impact: 5, owner: "IAM Team" },
      { id: "RSK-004", desc: "DR Plan Gaps", likelihood: 2, impact: 5, owner: "BCP Lead" },
      { id: "RSK-005", desc: "Vendor Data Sharing", likelihood: 3, impact: 3, owner: "Legal" }
    ];
    this._chaMeetings = [
      { name: "Security Steering", date: "2026-04-25", attendees: 8, status: "Scheduled" },
      { name: "Risk Committee", date: "2026-04-18", attendees: 6, status: "Completed" },
      { name: "Audit Review", date: "2026-05-02", attendees: 5, status: "Pending" }
    ];
    this._chaDeadlines = [
      { regulation: "SOC 2 Type II", deadline: "2026-06-15", daysLeft: 53, status: "On Track" },
      { regulation: "GDPR Annual Review", deadline: "2026-05-25", daysLeft: 32, status: "At Risk" },
      { regulation: "ISO 27001 Audit", deadline: "2026-07-20", daysLeft: 88, status: "On Track" },
      { regulation: "PCI DSS v4.0", deadline: "2026-08-30", daysLeft: 129, status: "Planning" }
    ];
  }

  private _chaRenderGovernance() {
    const policies = this._chaPolicies;
    const risks = this._chaRiskRegister;
    const deadlines = this._chaDeadlines;
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

  @state() private _chaCriticalAssets: any = null;
  @state() private _chaAssetDeps: any = null;
  @state() private _chaEolAssets: any = null;
  @state() private _chaAssetRisk: any = null;

  // Asset Intelligence
  private chaInitAssetIntel() {
    this._chaCriticalAssets = [
      { name: "Core Banking DB", type: "Database", impact: "Critical", risk: 85, owner: "DBA Team" },
      { name: "Customer API Gateway", type: "Service", impact: "Critical", risk: 72, owner: "Platform" },
      { name: "Active Directory", type: "Infrastructure", impact: "Critical", risk: 68, owner: "IAM" },
      { name: "Data Warehouse", type: "Database", impact: "High", risk: 55, owner: "Analytics" },
      { name: "Email Server", type: "Application", impact: "High", risk: 48, owner: "IT Ops" },
      { name: "CI/CD Pipeline", type: "DevOps", impact: "High", risk: 62, owner: "DevOps" },
      { name: "Payment Processor", type: "Service", impact: "Critical", risk: 78, owner: "Finance IT" }
    ];
    this._chaAssetDeps = [
      { from: "Web App", to: "API Gateway", type: "depends" },
      { from: "API Gateway", to: "Core Banking DB", type: "depends" },
      { from: "API Gateway", to: "Auth Service", type: "depends" },
      { from: "Auth Service", to: "Active Directory", type: "depends" },
      { from: "Payment Processor", to: "Core Banking DB", type: "depends" },
      { from: "Mobile App", to: "API Gateway", type: "depends" }
    ];
    this._chaEolAssets = [
      { name: "Windows Server 2012 R2", count: 12, eolDate: "2023-10-10", risk: "Critical" },
      { name: "Oracle 11g", count: 3, eolDate: "2025-12-31", risk: "High" },
      { name: "Cisco ASA 5505", count: 8, eolDate: "2024-07-15", risk: "High" },
      { name: "CentOS 7", count: 25, eolDate: "2024-06-30", risk: "Medium" }
    ];
    this._chaAssetRisk = { critical: 7, high: 23, medium: 45, low: 128, total: 203 };
  }

  private _chaRenderAssetIntel() {
    const assets = this._chaCriticalAssets;
    const eol = this._chaEolAssets;
    const ar = this._chaAssetRisk;
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

  @state() private _chaUserBaseline: any = null;
  @state() private _chaAnomalyRules: any = null;
  @state() private _chaDataAccess: any = null;
  @state() private _chaInsiderRisk: any = null;
  @state() private _champir15Timeline: Array<{id:string;time:string;event:string;severity:string;actor:string}> = [
    {id:'t1',time:'2026-01-15 08:23',event:'Anomalous login detected from external IP',severity:'high',actor:'unknown'},
    {id:'t2',time:'2026-01-15 08:45',event:'Privilege escalation via misconfigured service account',severity:'critical',actor:'SA-deploy-01'},
    {id:'t3',time:'2026-01-15 09:12',event:'Data exfiltration to external cloud storage',severity:'critical',actor:'SA-deploy-01'},
    {id:'t4',time:'2026-01-15 09:30',event:'Incident response team notified',severity:'medium',actor:'SOC Team'},
    {id:'t5',time:'2026-01-15 10:15',event:'Affected service account disabled',severity:'low',actor:'IR Lead'},
  ];
  @state() private _champir15RootCauses: Array<{why:string;answer:string}> = [
    {why:'Why was the login anomalous?',answer:'Credentials leaked via phishing email to IT admin'},
    {why:'Why was the phishing successful?',answer:'Email filter rules were too permissive for internal domains'},
    {why:'Why were rules misconfigured?',answer:'Change review process skipped for emergency rule update'},
    {why:'Why was the review skipped?',answer:'No automated enforcement of review policy for rule changes'},
    {why:'Why no automated enforcement?',answer:'Policy-as-code implementation backlog for 6 months'},
  ];
  @state() private _champir15ImpactMatrix: Array<{system:string;users:number;data:string;revenue:string;status:string}> = [
    {system:'Customer Database',users:12400,data:'PII of all customers',revenue:'$2.4M/day',status:'contained'},
    {system:'Payment Gateway',users:8900,data:'Tokenized payment records',revenue:'$1.8M/day',status:'unaffected'},
    {system:'HR Portal',users:3200,data:'Employee PII and payroll',revenue:'N/A',status:'investigating'},
    {system:'API Gateway',users:45000,data:'Auth tokens and API keys',revenue:'$5.1M/day',status:'contained'},
  ];
  @state() private _champir15Actions: Array<{id:string;item:string;owner:string;deadline:string;priority:string;status:string}> = [
    {id:'a1',item:'Rotate all service account credentials',owner:'DevOps Team',deadline:'2026-01-18',priority:'critical',status:'in_progress'},
    {id:'a2',item:'Implement email filter policy-as-code',owner:'Email Admin',deadline:'2026-01-22',priority:'high',status:'pending'},
    {id:'a3',item:'Deploy automated change review enforcement',owner:'Platform Team',deadline:'2026-01-25',priority:'high',status:'pending'},
    {id:'a4',item:'Conduct phishing awareness refresher',owner:'Security Awareness',deadline:'2026-01-20',priority:'medium',status:'assigned'},
    {id:'a5',item:'Review and update incident response playbook',owner:'IR Team',deadline:'2026-01-30',priority:'low',status:'pending'},
  ];
  @state() private _champir15Lessons: Array<{id:string;lesson:string;category:string;severity:string;applies_to:string}> = [
    {id:'l1',lesson:'Service accounts must have MFA enabled regardless of automation needs',category:'Identity',severity:'high',applies_to:'All service accounts'},
    {id:'l2',lesson:'Emergency changes still require post-incident review within 24 hours',category:'Process',severity:'high',applies_to:'All infrastructure changes'},
    {id:'l3',lesson:'Email filter rules must be version controlled and peer reviewed',category:'Email Security',severity:'medium',applies_to:'Email infrastructure'},
    {id:'l4',lesson:'Data exfiltration detection latency must be under 5 minutes',category:'Monitoring',severity:'medium',applies_to:'DLP systems'},
  ];
  @state() private _champir15ActiveTab: string = 'timeline';
  @state() private _champir15Benchmarks: Array<{metric:string;current:number;industry:number;target:number;unit:string;source:string}> = [
    {metric:'Mean Time to Detect',current:4.2,industry:6.8,target:3.0,unit:'hours',source:'SANS 2026'},
    {metric:'Mean Time to Respond',current:2.1,industry:4.5,target:1.0,unit:'hours',source:'SANS 2026'},
    {metric:'Patch Compliance',current:87,industry:72,target:95,unit:'%',source:'CIS Benchmark'},
    {metric:'Vuln Remediation SLA',current:78,industry:65,target:90,unit:'%',source:'Gartner'},
    {metric:'Phishing Click Rate',current:3.2,industry:12.5,target:2.0,unit:'%',source:'KnowBe4'},
    {metric:'MFA Coverage',current:94,industry:68,target:100,unit:'%',source:'CIS Controls'},
  ];
  @state() private _champir15MaturityLevels: Array<{domain:string;current:number;target:number;description:string}> = [
    {domain:'Identity and Access',current:4,target:5,description:'Strong MFA, automated provisioning, JIT access'},
    {domain:'Network Security',current:3,target:4,description:'Micro-segmentation partial, ZTNA in progress'},
    {domain:'Data Protection',current:3,target:4,description:'DLP deployed, encryption at rest in progress'},
    {domain:'Vulnerability Mgmt',current:4,target:5,description:'Automated scanning, risk-based prioritization'},
    {domain:'Incident Response',current:3,target:4,description:'Playbooks defined, automation growing'},
    {domain:'Governance and Risk',current:3,target:4,description:'Framework aligned, continuous monitoring building'},
  ];
  @state() private _champir15QuarterlyData: Array<{quarter:string;score:number;improvement:number}> = [
    {quarter:'Q1 2025',score:62,improvement:0},{quarter:'Q2 2025',score:67,improvement:5},
    {quarter:'Q3 2025',score:71,improvement:4},{quarter:'Q4 2025',score:74,improvement:3},
    {quarter:'Q1 2026',score:78,improvement:4},
  ];
  @state() private _champir15SelectedDomain: string = 'all';
  @state() private _champir15Alerts: Array<{id:string;name:string;severity:number;confidence:number;assetCrit:number;score:number;enriched:boolean;group:string;status:string;enrichData:Array<{key:string;value:string}>}> = [
    {id:'al1',name:'Brute force login attempt on prod-db',severity:5,confidence:0.9,assetCrit:5,score:0,enriched:true,group:'auth',status:'triaged',enrichData:[{key:'Source IP',value:'203.0.113.42'},{key:'Country',value:'Russia'},{key:'Threat Intel',value:'Known APT IP'}]},
    {id:'al2',name:'Unusual data transfer to external endpoint',severity:4,confidence:0.7,assetCrit:4,score:0,enriched:true,group:'exfil',status:'escalated',enrichData:[{key:'Destination',value:'s3-eu-west.amazonaws.com'},{key:'Volume',value:'2.4 GB in 30 min'},{key:'Reputation',value:'Neutral'}]},
    {id:'al3',name:'Privilege escalation attempt detected',severity:5,confidence:0.85,assetCrit:5,score:0,enriched:false,group:'auth',status:'new',enrichData:[]},
    {id:'al4',name:'Suspicious PowerShell execution',severity:3,confidence:0.5,assetCrit:3,score:0,enriched:false,group:'host',status:'new',enrichData:[]},
    {id:'al5',name:'Failed SSL certificate validation',severity:2,confidence:0.95,assetCrit:2,score:0,enriched:true,group:'net',status:'dismissed',enrichData:[{key:'Host',value:'api.internal.corp'},{key:'Expiry',value:'2026-01-10'}]},
  ];
  @state() private _champir15QualityMetrics: {fpRate:number;enrichSuccess:number;avgTriageTime:number;enrichedCount:number;totalCount:number} = {fpRate:0.12, enrichSuccess:0.78, avgTriageTime:4.5, enrichedCount:3, totalCount:5};
  @state() private _champir15RoutingRules: Array<{name:string;condition:string;channel:string;active:boolean}> = [
    {name:'Critical Asset Alert',condition:'asset_criticality >= 5 && severity >= 4',channel:'SOC Phone Bridge',active:true},
    {name:'Data Exfiltration',condition:'group == exfil && severity >= 3',channel:'IR Slack Channel',active:true},
    {name:'Authentication Anomaly',condition:'group == auth && confidence >= 0.8',channel:'SOC Dashboard',active:true},
    {name:'Low Priority Host',condition:'severity <= 2 && asset_criticality <= 2',channel:'Email Digest',active:false},
  ];
  @state() private _champir15Shapes: Array<{id:string;type:string;label:string;controls:string[]}> = [
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
  @state() private _champir15TrustBoundaries: Array<{from:string;to:string;label:string;strength:string}> = [
    {from:'sh1',to:'sh4',label:'External Boundary',strength:'strong'},
    {from:'sh2',to:'sh5',label:'Data Boundary',strength:'strong'},
    {from:'sh3',to:'sh6',label:'Identity Boundary',strength:'medium'},
    {from:'sh7',to:'sh8',label:'Build Boundary',strength:'weak'},
  ];
  @state() private _champir15ADRs: Array<{id:string;title:string;status:string;date:string;decision:string}> = [
    {id:'adr-001',title:'Adopt Zero Trust Network Architecture',status:'accepted',date:'2025-11-15',decision:'Replace VPN with ZTNA for all remote access'},
    {id:'adr-002',title:'Implement Service Mesh for East-West Traffic',status:'proposed',date:'2026-01-10',decision:'Deploy Istio with mTLS for all internal service communication'},
    {id:'adr-003',title:'Consolidate SIEM to Single Platform',status:'accepted',date:'2025-09-20',decision:'Migrate from Splunk+QRadar to unified Elastic SIEM'},
    {id:'adr-004',title:'Enforce Policy-as-Code for All Infrastructure',status:'in_review',date:'2026-02-01',decision:'Use Open Policy Agent for admission control and compliance checks'},
  ];
  @state() private _champir15SelectedShape: string = '';
  @state() private _champir15Gauges: Array<{name:string;value:number;max:number;unit:string;status:string;color:string}> = [
    {name:'API Response Time',value:142,max:500,unit:'ms',status:'healthy',color:'#4f4'},
    {name:'Error Rate',value:0.3,max:5,unit:'%',status:'healthy',color:'#4f4'},
    {name:'CPU Utilization',value:67,max:100,unit:'%',status:'warning',color:'#fa0'},
    {name:'Memory Usage',value:4.2,max:8,unit:'GB',status:'healthy',color:'#4f4'},
    {name:'Active Connections',value:1247,max:2000,unit:'',status:'healthy',color:'#4f4'},
    {name:'Queue Depth',value:342,max:500,unit:'',status:'warning',color:'#fa0'},
  ];
  @state() private _champir15Anomalies: Array<{id:string;time:string;description:string;severity:string;acknowledged:boolean}> = [
    {id:'an1',time:'10:42:15',description:'Spike in failed authentication attempts from 10.0.0.0/8',severity:'high',acknowledged:false},
    {id:'an2',time:'10:38:22',description:'Unusual data transfer volume on DB replication channel',severity:'medium',acknowledged:true},
    {id:'an3',time:'10:25:07',description:'Certificate expiry warning for api.internal.corp (7 days)',severity:'low',acknowledged:false},
    {id:'an4',time:'10:12:44',description:'DNS query pattern matches DGA domain characteristics',severity:'high',acknowledged:false},
  ];
  @state() private _champir15Integrations: Array<{name:string;status:string;uptime:number;lastCheck:string;latency:number}> = [
    {name:'SIEM Connector',status:'online',uptime:99.97,lastCheck:'10:45:00',latency:12},
    {name:'EDR Feed',status:'online',uptime:99.95,lastCheck:'10:45:00',latency:45},
    {name:'Threat Intel API',status:'degraded',uptime:98.2,lastCheck:'10:44:30',latency:230},
    {name:'Cloud Provider API',status:'online',uptime:99.99,lastCheck:'10:45:00',latency:8},
    {name:'Email Gateway',status:'online',uptime:99.98,lastCheck:'10:45:00',latency:15},
  ];
  @state() private _champir15AlertFatigue: Array<{analyst:string;alertsPerDay:number;escalated:number;dismissed:number;avgResponseMin:number}> = [
    {analyst:'Alice Chen',alertsPerDay:45,escalated:8,dismissed:12,avgResponseMin:3.2},
    {analyst:'Bob Martinez',alertsPerDay:62,escalated:11,dismissed:18,avgResponseMin:5.1},
    {analyst:'Carol Kim',alertsPerDay:38,escalated:5,dismissed:10,avgResponseMin:2.8},
    {analyst:'Dave Wilson',alertsPerDay:71,escalated:14,dismissed:22,avgResponseMin:6.4},
  ];
  @state() private _champir15SlaTarget: number = 99.9;

  // Insider Threat Detection
  private chaInitInsiderThreat() {
    this._chaUserBaseline = [
      { user: "admin_jdoe", avgLogins: 18, avgFiles: 45, avgNetwork: 2.3, riskScore: 12 },
      { user: "dev_ssmith", avgLogins: 22, avgFiles: 120, avgNetwork: 5.1, riskScore: 25 },
      { user: "mgr_jchen", avgLogins: 8, avgFiles: 30, avgNetwork: 1.2, riskScore: 8 },
      { user: "analyst_mlee", avgLogins: 15, avgFiles: 85, avgNetwork: 3.4, riskScore: 18 },
      { user: "contractor_abrown", avgLogins: 12, avgFiles: 200, avgNetwork: 8.7, riskScore: 42 }
    ];
    this._chaAnomalyRules = [
      { rule: "After-hours access", enabled: true, triggers: 3, severity: "Medium" },
      { rule: "Mass download detection", enabled: true, triggers: 1, severity: "Critical" },
      { rule: "Privilege escalation", enabled: true, triggers: 0, severity: "High" },
      { rule: "Unusual data transfer", enabled: true, triggers: 5, severity: "High" },
      { rule: "Account sharing pattern", enabled: false, triggers: 2, severity: "Medium" },
      { rule: "Departure data spike", enabled: true, triggers: 0, severity: "Critical" }
    ];
    this._chaDataAccess = [
      { resource: "Customer PII DB", accesses: 1245, anomalous: 18, trend: "up" },
      { resource: "Financial Reports", accesses: 832, anomalous: 5, trend: "stable" },
      { resource: "Source Code Repo", accesses: 2100, anomalous: 32, trend: "up" },
      { resource: "Trade Secrets", accesses: 156, anomalous: 8, trend: "up" }
    ];
    this._chaInsiderRisk = { totalUsers: 2847, monitored: 342, flagged: 18, investigated: 5, confirmed: 1 };
  }

  private _chaRenderInsiderThreat() {
    const baseline = this._chaUserBaseline;
    const rules = this._chaAnomalyRules;
    const ir = this._chaInsiderRisk;
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
              <button class="btn ${this._champir15ActiveTab === t ? 'btn-primary' : ''}" style="font-size:10px;padding:3px 8px" @click=${() => { this._champir15ActiveTab = t; }}>${t.charAt(0).toUpperCase() + t.slice(1)}</button>
            `)}
          </div>
          ${this._champir15ActiveTab === 'timeline' ? html`
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._champir15Timeline.map(e => html`
                <div style="display:flex;gap:8px;align-items:flex-start;padding:6px;background:#1a1d27;border-radius:4px;border-left:3px solid ${e.severity === 'critical' ? '#f44' : e.severity === 'high' ? '#fa0' : e.severity === 'medium' ? '#ff0' : '#4f4'}">
                  <span style="color:#888;font-size:10px;min-width:110px">${e.time}</span>
                  <span style="color:#ddd;font-size:11px;flex:1">${e.event}</span>
                  <span style="color:#888;font-size:10px">${e.actor}</span>
                </div>
              `)}
            </div>
          ` : this._champir15ActiveTab === 'rootcause' ? html`
            <div style="margin-bottom:8px">${{__html: this._champir15RenderFishbone()}}</div>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._champir15RootCauses.map((rc, i) => html`
                <div style="display:flex;gap:8px;align-items:flex-start;padding:6px;background:#1a1d27;border-radius:4px">
                  <span style="color:#4a9eff;font-size:10px;min-width:20px">${i + 1}.</span>
                  <div style="flex:1"><div style="color:#aaa;font-size:10px">${rc.why}</div><div style="color:#ddd;font-size:11px">${rc.answer}</div></div>
                </div>
              `)}
            </div>
          ` : this._champir15ActiveTab === 'impact' ? html`
            <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:10px">
              <thead><tr style="color:#888"><th style="text-align:left;padding:4px">System</th><th style="padding:4px">Users</th><th style="text-align:left;padding:4px">Data</th><th style="padding:4px">Revenue</th><th style="padding:4px">Status</th></tr></thead>
              <tbody>${this._champir15ImpactMatrix.map(imp => html`
                <tr style="border-top:1px solid #2a2d37"><td style="padding:4px;color:#ddd">${imp.system}</td><td style="padding:4px;color:#aaa;text-align:center">${imp.users.toLocaleString()}</td><td style="padding:4px;color:#aaa">${imp.data}</td><td style="padding:4px;color:#fa0;text-align:center">${imp.revenue}</td><td style="padding:4px"><span style="color:${imp.status === 'contained' ? '#4f4' : imp.status === 'investigating' ? '#fa0' : '#f44'};font-size:9px;padding:2px 6px;background:${imp.status === 'contained' ? 'rgba(0,255,0,0.1)' : imp.status === 'investigating' ? 'rgba(255,170,0,0.1)' : 'rgba(255,0,0,0.1)'};border-radius:3px">${imp.status}</span></td></tr>
              `)}</tbody>
            </table></div>
          ` : this._champir15ActiveTab === 'actions' ? html`
            <div style="display:flex;gap:12px;margin-bottom:8px;font-size:10px;color:#888">
              ${Object.entries(this._champir15GetActionStats()).map(([k,v]) => html`<span>${k}: <b style="color:#ddd">${v}</b></span>`)}
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._champir15Actions.map(a => html`
                <div style="display:flex;gap:8px;align-items:center;padding:6px;background:#1a1d27;border-radius:4px;cursor:pointer" @click=${() => this._champir15ToggleAction(a.id)}>
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
              ${this._champir15Lessons.map(l => html`
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
            ${['all', ...this._champir15MaturityLevels.map(m => m.domain)].map(d => html`
              <button class="btn ${this._champir15SelectedDomain === d ? 'btn-primary' : ''}" style="font-size:9px;padding:2px 6px" @click=${() => { this._champir15SelectedDomain = d; }}>${d}</button>
            `)}
          </div>
          <div style="display:flex;gap:16px;margin-bottom:10px">
            <div style="text-align:center"><div style="color:#e0e0e0;font-size:20px;font-weight:bold">${this._champir15GetOverallMaturity()}/5</div><div style="color:#888;font-size:10px">Maturity Level</div></div>
            <div style="text-align:center"><div style="color:#4f4;font-size:20px;font-weight:bold">${this._champir15GetGapAnalysis().filter(g => g.isAbove).length}/${this._champir15Benchmarks.length}</div><div style="color:#888;font-size:10px">Above Industry</div></div>
          </div>
          <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead><tr style="color:#888"><th style="text-align:left;padding:3px">Metric</th><th style="padding:3px">Current</th><th style="padding:3px">Industry</th><th style="padding:3px">Target</th><th style="padding:3px">Gap</th><th style="padding:3px">Source</th></tr></thead>
            <tbody>${this._champir15GetGapAnalysis().map(b => html`
              <tr style="border-top:1px solid #2a2d37"><td style="padding:3px;color:#ddd">${b.metric}</td><td style="padding:3px;color:#e0e0e0;text-align:center;font-weight:bold">${b.current}${b.unit}</td><td style="padding:3px;color:#888;text-align:center">${b.industry}${b.unit}</td><td style="padding:3px;color:#4a9eff;text-align:center">${b.target}${b.unit}</td><td style="padding:3px;text-align:center;color:${b.isAbove ? '#4f4' : '#fa0'}">${b.isAbove ? '+' : ''}${b.gap.toFixed(1)}</td><td style="padding:3px;color:#666;font-size:9px">${b.source}</td></tr>
            `)}</tbody>
          </table></div>
          <div style="margin-top:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Maturity by Domain</div>
            ${this._champir15MaturityLevels.filter(m => this._champir15SelectedDomain === 'all' || m.domain === this._champir15SelectedDomain).map(m => html`
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
                <span style="color:#aaa;font-size:10px;min-width:100px">${m.domain}</span>
                <div style="flex:1;background:#1a1d27;border-radius:3px;height:8px;overflow:hidden"><div style="height:100%;width:${m.current * 20}%;background:${m.current >= 4 ? '#4f4' : m.current >= 3 ? '#fa0' : '#f44'};border-radius:3px"></div></div>
                <span style="color:#ddd;font-size:10px;min-width:40px">${m.current}/5</span>
              </div>
            `)}
          </div>
          <div style="margin-top:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Quarterly Trend</div>
            <div style="display:flex;height:40px;align-items:flex-end;gap:4px">
              ${this._champir15QuarterlyData.map(q => html`<div style="flex:1;text-align:center"><div style="background:#4a9eff;height:${q.score * 0.5}px;border-radius:2px 2px 0 0" title="${q.score}"></div><div style="color:#666;font-size:8px;margin-top:2px">${q.quarter}</div></div>`)}
            </div>
          </div>
        </div>

        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Alert Triage and Enrichment</h4>
          <div style="display:flex;gap:12px;margin-bottom:8px;font-size:10px">
            <div style="display:flex;gap:4px;flex-wrap:wrap">${this._champir15GroupAlerts().map(g => html`<span style="color:#888;padding:2px 6px;background:#1a1d27;border-radius:3px">${g.group}: ${g.count}</span>`)}</div>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:8px;font-size:10px;color:#888">
            <span>FP Rate: <b style="color:${this._champir15QualityMetrics.fpRate > 0.15 ? '#f44' : '#4f4'}">${(this._champir15QualityMetrics.fpRate * 100).toFixed(1)}%</b></span>
            <span>Enrich: <b style="color:#4a9eff">${(this._champir15QualityMetrics.enrichSuccess * 100).toFixed(0)}%</b></span>
            <span>Avg Triage: <b style="color:#ddd">${this._champir15QualityMetrics.avgTriageTime}m</b></span>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto">
            ${this._champir15Alerts.sort((a, b) => this._champir15CalcScore(b) - this._champir15CalcScore(a)).map(a => {
              const score = this._champir15CalcScore(a);
              return html`
                <div style="padding:6px;background:#1a1d27;border-radius:4px;border-left:3px solid ${a.severity >= 4 ? '#f44' : a.severity >= 3 ? '#fa0' : '#4a9eff'}">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="color:#ddd;font-size:11px;flex:1">${a.name}</span>
                    <span style="color:#e0e0e0;font-size:12px;font-weight:bold;min-width:40px;text-align:center">${score.toFixed(1)}</span>
                    <button class="btn" style="font-size:9px;padding:1px 6px;margin-left:4px" @click=${() => this._champir15EnrichAlert(a.id)}>${a.enriched ? 'Re-enrich' : 'Enrich'}</button>
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
            ${this._champir15RoutingRules.map(r => html`
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
            ${this._champir15Shapes.map(s => {
              const v = this._champir15ValidateControl(s.id);
              return html`<div style="padding:4px 8px;background:#1a1d27;border-radius:3px;cursor:pointer;border:1px solid ${this._champir15SelectedShape === s.id ? '#4a9eff' : '#2a2d37'}" @click=${() => { this._champir15SelectedShape = this._champir15SelectedShape === s.id ? '' : s.id; }}>
                <div style="display:flex;align-items:center;gap:4px"><span style="color:${v.valid ? '#4f4' : '#f44'};font-size:10px">${v.valid ? '\u2713' : '\u2717'}</span><span style="color:#ddd;font-size:10px">${s.label}</span></div>
                <div style="color:#888;font-size:8px">${s.controls.length} controls</div>
              </div>`;
            })}
          </div>
          ${this._champir15SelectedShape ? html`
            ${(() => {
              const shape = this._champir15Shapes.find(s => s.id === this._champir15SelectedShape);
              const v = this._champir15ValidateControl(this._champir15SelectedShape);
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
            ${this._champir15TrustBoundaries.map(tb => html`
              <div style="display:flex;gap:6px;align-items:center;padding:3px;background:#1a1d27;border-radius:3px;margin-bottom:2px;font-size:9px">
                <span style="color:#ddd">${this._champir15Shapes.find(s => s.id === tb.from)?.label || tb.from}</span>
                <span style="color:#4a9eff">\u2194</span>
                <span style="color:#ddd">${this._champir15Shapes.find(s => s.id === tb.to)?.label || tb.to}</span>
                <span style="flex:1"></span>
                <span style="color:#888">${tb.label}</span>
                <span style="color:${tb.strength === 'strong' ? '#4f4' : tb.strength === 'medium' ? '#fa0' : '#f44'};font-size:9px;padding:1px 4px;border-radius:2px;background:${tb.strength === 'strong' ? 'rgba(0,255,0,0.1)' : tb.strength === 'medium' ? 'rgba(255,170,0,0.1)' : 'rgba(255,0,0,0.1)'}">${tb.strength}</span>
              </div>
            `)}
          </div>
          <div><div style="color:#888;font-size:10px;margin-bottom:4px">Architecture Decision Records</div>
            ${this._champir15ADRs.map(adr => html`
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
            ${this._champir15Gauges.map(g => html`
              <div style="flex:1;min-width:100px;padding:6px;background:#1a1d27;border-radius:4px;text-align:center">
                <div style="color:#888;font-size:9px;margin-bottom:2px">${g.name}</div>
                <div style="color:${g.status === 'healthy' ? '#4f4' : g.status === 'warning' ? '#fa0' : '#f44'};font-size:18px;font-weight:bold">${g.value}${g.unit}</div>
                <div style="background:#2a2d37;border-radius:3px;height:4px;margin-top:4px;overflow:hidden"><div style="height:100%;width:${(g.value / g.max * 100)}%;background:${g.color};border-radius:3px"></div></div>
              </div>
            `)}
          </div>
          <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
            <span style="color:#888;font-size:10px">System Health:</span>
            <span style="color:${this._champir15GetOverallHealth().score >= 99 ? '#4f4' : '#fa0'};font-size:12px;font-weight:bold">${this._champir15GetOverallHealth().score}%</span>
            <span style="color:#888;font-size:10px">(Target: ${this._champir15SlaTarget}%)</span>
            <span style="color:#4f4;font-size:10px">${this._champir15GetOverallHealth().healthy} healthy</span>
            <span style="color:#fa0;font-size:10px">${this._champir15GetOverallHealth().degraded} degraded</span>
          </div>
          <div style="margin-bottom:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Anomaly Stream</div>
            ${this._champir15Anomalies.slice(0, 3).map(a => html`
              <div style="display:flex;gap:6px;align-items:center;padding:4px;background:#1a1d27;border-radius:3px;margin-bottom:2px;opacity:${a.acknowledged ? 0.5 : 1}">
                <span style="color:#888;font-size:9px;min-width:50px">${a.time}</span>
                <span style="color:${a.severity === 'high' ? '#f44' : a.severity === 'medium' ? '#fa0' : '#888'};font-size:9px;min-width:30px">${a.severity.toUpperCase()}</span>
                <span style="color:#ddd;font-size:10px;flex:1">${a.description}</span>
                ${!a.acknowledged ? html`<button class="btn" style="font-size:8px;padding:1px 4px" @click=${() => this._champir15AckAnomaly(a.id)}>ACK</button>` : html`<span style="color:#4f4;font-size:9px">ACK'd</span>`}
              </div>
            `)}
          </div>
          <div style="margin-bottom:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Integration Health</div>
            ${this._champir15Integrations.map(i => html`
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
              <tbody>${this._champir15AlertFatigue.map(af => html`
                <tr style="border-top:1px solid #2a2d37"><td style="padding:3px;color:#ddd">${af.analyst}</td><td style="padding:3px;color:${af.alertsPerDay > 60 ? '#f44' : af.alertsPerDay > 40 ? '#fa0' : '#4f4'};text-align:center">${af.alertsPerDay}</td><td style="padding:3px;color:#aaa;text-align:center">${af.escalated}</td><td style="padding:3px;color:#888;text-align:center">${af.dismissed}</td><td style="padding:3px;color:#aaa;text-align:center">${af.avgResponseMin}m</td><td style="padding:3px;text-align:center;color:${af.alertsPerDay > 60 ? '#f44' : af.alertsPerDay > 40 ? '#fa0' : '#4f4'}">${af.alertsPerDay > 60 ? 'HIGH' : af.alertsPerDay > 40 ? 'MEDIUM' : 'LOW'}</td></tr>
              `)}</tbody>
            </table></div>
          </div>
        </div>
</div>
      </div>`;
  }



  private _champir15RenderFishbone(): string {
    const categories = ['People','Process','Technology','Environment','Communication','Policy'];
    const bones = categories.map((cat, i) => {
      const angle = 30 + i * 20;
      return '<line x1="200" y1="150" x2="' + (200 + Math.cos(angle * Math.PI / 180) * 140) + '" y2="' + (150 - Math.sin(angle * Math.PI / 180) * 140) + '" stroke="#4a9eff" stroke-width="1.5"/><text x="' + (200 + Math.cos(angle * Math.PI / 180) * 145) + '" y="' + (150 - Math.sin(angle * Math.PI / 180) * 145) + '" fill="#e0e0e0" font-size="9" text-anchor="middle">' + cat + '</text>';
    }).join('');
    return '<svg width="400" height="300" viewBox="0 0 400 300"><line x1="60" y1="150" x2="340" y2="150" stroke="#e0e0e0" stroke-width="2"/><line x1="200" y1="30" x2="200" y2="270" stroke="#e0e0e0" stroke-width="2"/><text x="200" y="290" fill="#fa0" font-size="11" text-anchor="middle" font-weight="bold">Service Account Compromise</text>' + bones + '</svg>';
  }

  private _champir15ToggleAction(id: string) {
    this._champir15Actions = this._champir15Actions.map(a => a.id === id ? {...a, status: a.status === 'pending' ? 'in_progress' : a.status === 'in_progress' ? 'completed' : 'pending'} : a);
  }

  private _champir15GetActionStats() {
    const total = this._champir15Actions.length;
    const done = this._champir15Actions.filter(a => a.status === 'completed').length;
    const inProg = this._champir15Actions.filter(a => a.status === 'in_progress').length;
    return { total, done, inProg, pending: total - done - inProg };
  }

  private _champir15GetOverallMaturity(): number {
    if (this._champir15SelectedDomain === 'all') {
      return Math.round(this._champir15MaturityLevels.reduce((s, m) => s + m.current, 0) / this._champir15MaturityLevels.length * 10) / 10;
    }
    const d = this._champir15MaturityLevels.find(m => m.domain === this._champir15SelectedDomain);
    return d ? d.current : 0;
  }

  private _champir15GetGapAnalysis() {
    return this._champir15Benchmarks.map(b => {
      const gap = b.current - b.industry;
      const targetGap = b.target - b.current;
      const isAbove = gap > 0;
      return { ...b, gap, targetGap, isAbove, status: isAbove ? 'exceeds' : targetGap > 0 ? 'improving' : 'on_track' };
    });
  }

  private _champir15CalcScore(alert: any): number {
    return Math.round(alert.severity * alert.confidence * alert.assetCrit * 100) / 100;
  }

  private _champir15EnrichAlert(id: string) {
    this._champir15Alerts = this._champir15Alerts.map(a => {
      if (a.id !== id) return a;
      const score = this._champir15CalcScore(a);
      return { ...a, enriched: true, score, enrichData: a.enrichData.length > 0 ? a.enrichData : [{key:'Auto-Enriched',value:'Simulated at ' + new Date().toLocaleTimeString()},{key:'Reputation',value: Math.random() > 0.5 ? 'Malicious' : 'Neutral'},{key:'Geo',value: 'US-EAST'}] };
    });
  }

  private _champir15GroupAlerts() {
    const groups: Record<string, number> = {};
    this._champir15Alerts.forEach(a => { groups[a.group] = (groups[a.group] || 0) + 1; });
    return Object.entries(groups).map(([g, c]) => ({group: g, count: c}));
  }

  private _champir15ValidateControl(shapeId: string): {valid:boolean;missing:string[]} {
    const shape = this._champir15Shapes.find(s => s.id === shapeId);
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

  private _champir15GetOverallHealth(): {healthy:number;degraded:number;down:number;score:number} {
    const online = this._champir15Integrations.filter(i => i.status === 'online').length;
    const degraded = this._champir15Integrations.filter(i => i.status === 'degraded').length;
    const total = this._champir15Integrations.length;
    return { healthy: online, degraded, down: total - online - degraded, score: Math.round(online / total * 100) };
  }

  private _champir15AckAnomaly(id: string) {
    this._champir15Anomalies = this._champir15Anomalies.map(a => a.id === id ? {...a, acknowledged: true} : a);
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-champions': ScChampions; } }
