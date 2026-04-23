/**
 * sc-baseline-scan - Security Baseline Configuration Scanner
 * CIS/NIST/STIG benchmark scanning, compliance gap analysis, drift detection, remediation tracking
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
type ScanStatus = 'idle' | 'scanning' | 'completed' | 'failed' | 'scheduled';
type BenchmarkType = 'cis' | 'nist' | 'stig' | 'hipaa' | 'pci-dss' | 'iso27001';
type ComplianceState = 'compliant' | 'non-compliant' | 'partial' | 'not-assessed';
type RemediationPriority = 'immediate' | 'high' | 'normal' | 'low';

interface BenchmarkProfile {
  id: string;
  name: string;
  type: BenchmarkType;
  version: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  score: number;
  lastScan: string;
  targetSystem: string;
  osVersion: string;
}

interface ScanFinding {
  id: string;
  benchmarkId: string;
  ruleId: string;
  title: string;
  severity: SeverityLevel;
  status: 'open' | 'remediated' | 'accepted-risk' | 'false-positive' | 'in-progress';
  category: string;
  description: string;
  currentConfig: string;
  expectedConfig: string;
  remediation: string;
  remediationComplexity: 'low' | 'medium' | 'high';
  cveReferences: string[];
  discoveredAt: string;
  remediatedAt?: string;
  assignedTo?: string;
  notes?: string;
}

interface DriftEvent {
  id: string;
  findingId: string;
  timestamp: string;
  previousValue: string;
  newValue: string;
  changedBy: string;
  changeSource: 'manual' | 'automation' | 'package-update' | 'policy-change' | 'unknown';
  approved: boolean;
}

interface ScanSchedule {
  id: string;
  name: string;
  benchmarkType: BenchmarkType;
  targets: string[];
  cronExpression: string;
  enabled: boolean;
  lastRun: string;
  nextRun: string;
  notifications: boolean;
}

interface ComplianceSummary {
  benchmarkType: BenchmarkType;
  totalProfiles: number;
  compliantCount: number;
  nonCompliantCount: number;
  partialCount: number;
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
}

interface TrendDataPoint {
  date: string;
  score: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
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

@customElement('sc-baseline-scan')
export class ScBaselineScan extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .controls-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
    .search-box { padding: 8px 12px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 13px; flex: 1; min-width: 200px; outline: none; }
    .search-box:focus { border-color: #f59e0b; }
    .filter-select { padding: 8px 12px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 13px; outline: none; cursor: pointer; }
    .filter-select:focus { border-color: #f59e0b; }
    .btn { padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; transition: all 0.2s; }
    .btn:hover { border-color: #f59e0b; }
    .btn.primary { background: #1e40af; border-color: #3b82f6; color: white; }
    .btn.primary:hover { background: #2563eb; }
    .btn.danger { background: #450a0a; border-color: #7f1d1d; color: #fca5a5; }
    .btn.success { background: #052e16; border-color: #166534; color: #86efac; }
    .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .score-card { background: #0a0e17; border-radius: 8px; padding: 12px; text-align: center; border: 1px solid #1e293b; }
    .score-val { font-size: 26px; font-weight: 700; }
    .score-lbl { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 600; margin-top: 2px; }
    .tabs { display: flex; gap: 0; margin-bottom: 12px; border-bottom: 1px solid #374151; }
    .tab { padding: 8px 16px; font-size: 12px; font-weight: 600; border: none; background: transparent; color: #94a3b8; cursor: pointer; border-bottom: 2px solid transparent; }
    .tab.active { color: #f59e0b; border-bottom-color: #f59e0b; }
    .tab:hover { color: #e2e8f0; }
    .bench-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 10px; margin-bottom: 16px; }
    .bench-card { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.2s; }
    .bench-card:hover { border-color: #4b5563; transform: translateY(-1px); }
    .bench-card.selected { border-color: #f59e0b; box-shadow: 0 0 0 1px #f59e0b; }
    .bench-name { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
    .bench-meta { font-size: 11px; color: #94a3b8; margin-bottom: 8px; display: flex; gap: 10px; }
    .bench-score-bar { height: 6px; background: #0a0e17; border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
    .bench-score-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .bench-stats { display: flex; justify-content: space-between; font-size: 10px; }
    .findings-list { display: flex; flex-direction: column; gap: 6px; max-height: 500px; overflow-y: auto; }
    .finding-item { background: #1f2937; border: 1px solid #374151; border-radius: 6px; padding: 12px; cursor: pointer; transition: all 0.2s; }
    .finding-item:hover { border-color: #4b5563; }
    .finding-item.expanded { border-color: #f59e0b; }
    .finding-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
    .finding-title { font-size: 13px; font-weight: 600; flex: 1; }
    .finding-badges { display: flex; gap: 4px; flex-shrink: 0; }
    .badge { font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .badge-critical { background: #450a0a; color: #fca5a5; }
    .badge-high { background: #431407; color: #fdba74; }
    .badge-medium { background: #422006; color: #fde047; }
    .badge-low { background: #052e16; color: #86efac; }
    .badge-info { background: #172554; color: #93c5fd; }
    .badge-open { background: #1e293b; color: #94a3b8; }
    .badge-remediated { background: #052e16; color: #86efac; }
    .badge-in-progress { background: #1e3a8a; color: #93c5fd; }
    .finding-meta { font-size: 11px; color: #94a3b8; margin-top: 4px; }
    .finding-detail { margin-top: 10px; padding-top: 10px; border-top: 1px solid #374151; display: none; }
    .finding-item.expanded .finding-detail { display: block; }
    .finding-desc { font-size: 12px; color: #cbd5e1; line-height: 1.5; margin-bottom: 8px; }
    .config-diff { background: #0a0e17; border-radius: 6px; padding: 10px; margin-bottom: 8px; font-family: monospace; font-size: 12px; }
    .config-current { color: #fca5a5; }
    .config-expected { color: #86efac; }
    .remediation-box { background: #052e16; border: 1px solid #166534; border-radius: 6px; padding: 10px; font-size: 12px; }
    .remediation-box strong { color: #86efac; }
    .drift-timeline { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
    .drift-item { display: flex; gap: 10px; align-items: flex-start; font-size: 11px; }
    .drift-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 3px; flex-shrink: 0; }
    .drift-dot.approved { background: #22c55e; }
    .drift-dot.unapproved { background: #ef4444; }
    .chart-container { background: #0a0e17; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .chart-title { font-size: 13px; font-weight: 700; margin-bottom: 12px; }
    .svg-chart { width: 100%; }
    .form-section { background: #1f2937; border: 1px solid #374151; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .form-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
    .form-field { display: flex; flex-direction: column; gap: 4px; }
    .form-label { font-size: 11px; font-weight: 600; color: #94a3b8; }
    .form-input { padding: 8px 10px; border-radius: 6px; border: 1px solid #374151; background: #0a0e17; color: #e2e8f0; font-size: 13px; outline: none; }
    .form-input:focus { border-color: #f59e0b; }
    .form-actions { display: flex; gap: 8px; margin-top: 12px; }
    .history-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .history-table th { text-align: left; padding: 8px 10px; border-bottom: 1px solid #374151; color: #94a3b8; font-weight: 600; font-size: 11px; }
    .history-table td { padding: 8px 10px; border-bottom: 1px solid #1e293b; }
    .history-table tr:hover td { background: #1f2937; }
    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    .export-btn { position: relative; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .scanning { animation: pulse 1.5s infinite; }
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

  @state() private _searchQuery = '';
  @state() private _severityFilter: SeverityLevel | 'all' = 'all';
  @state() private _statusFilter = 'all';
  @state() private _activeTab: 'benchmarks' | 'findings' | 'drift' | 'schedule' | 'export' = 'benchmarks';
  @state() private _expandedFinding: string | null = null;
  @state() private _scanStatus: ScanStatus = 'idle';
  @state() private _selectedBenchmark: string | null = null;
  @state() private _showNewScheduleForm = false;
  @state() private _historyPage = 0;
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
    { id: 'c1', author: 'soc-tier1', timestamp: '2026-04-23 04:00', text: 'Initial assessment started for Baseline Scan finding #1' },
    { id: 'c2', author: 'security-eng', timestamp: '2026-04-23 04:15', text: 'Confirmed this is related to the endpoint detection rule update' },
    { id: 'c3', author: 'manager', timestamp: '2026-04-23 05:00', text: 'Prioritize resolution - potential compliance impact' },
  ];

  private _items: PanelItem[] = [
      {
            "id": "baseline-scan-1",
            "title": "Baseline Scan Finding #1",
            "severity": "low",
            "status": "open",
            "category": "Security",
            "source": "SIEM",
            "description": "Automated baseline-scan assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-15T00:00:00Z",
            "assignee": "soc-tier1",
            "tags": [
                  "baseline-scan",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 15,
            "stepsTaken": []
      },
      {
            "id": "baseline-scan-2",
            "title": "Baseline Scan Finding #2",
            "severity": "medium",
            "status": "open",
            "category": "Network",
            "source": "EDR",
            "description": "Automated baseline-scan assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-16T02:00:00Z",
            "assignee": "soc-tier2",
            "tags": [
                  "baseline-scan",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 30,
            "stepsTaken": []
      },
      {
            "id": "baseline-scan-3",
            "title": "Baseline Scan Finding #3",
            "severity": "high",
            "status": "open",
            "category": "Access",
            "source": "Scanner",
            "description": "Automated baseline-scan assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-17T04:00:00Z",
            "assignee": "security-eng",
            "tags": [
                  "baseline-scan",
                  "automated"
            ],
            "priority": "p3",
            "slaMinutes": 60,
            "stepsTaken": []
      },
      {
            "id": "baseline-scan-4",
            "title": "Baseline Scan Finding #4",
            "severity": "low",
            "status": "open",
            "category": "Compliance",
            "source": "Audit",
            "description": "Automated baseline-scan assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-18T06:00:00Z",
            "assignee": "compliance",
            "tags": [
                  "baseline-scan",
                  "automated"
            ],
            "priority": "p4",
            "slaMinutes": 120,
            "stepsTaken": []
      },
      {
            "id": "baseline-scan-5",
            "title": "Baseline Scan Finding #5",
            "severity": "medium",
            "status": "open",
            "category": "Operations",
            "source": "Manual",
            "description": "Automated baseline-scan assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-19T08:00:00Z",
            "assignee": "ops",
            "tags": [
                  "baseline-scan",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 240,
            "stepsTaken": []
      },
      {
            "id": "baseline-scan-6",
            "title": "Baseline Scan Finding #6",
            "severity": "high",
            "status": "open",
            "category": "Security",
            "source": "SIEM",
            "description": "Automated baseline-scan assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-20T10:00:00Z",
            "assignee": "soc-tier1",
            "tags": [
                  "baseline-scan",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 15,
            "stepsTaken": []
      },
      {
            "id": "baseline-scan-7",
            "title": "Baseline Scan Finding #7",
            "severity": "low",
            "status": "open",
            "category": "Network",
            "source": "EDR",
            "description": "Automated baseline-scan assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-21T12:00:00Z",
            "assignee": "soc-tier2",
            "tags": [
                  "baseline-scan",
                  "automated"
            ],
            "priority": "p3",
            "slaMinutes": 30,
            "stepsTaken": []
      },
      {
            "id": "baseline-scan-8",
            "title": "Baseline Scan Finding #8",
            "severity": "medium",
            "status": "open",
            "category": "Access",
            "source": "Scanner",
            "description": "Automated baseline-scan assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-22T14:00:00Z",
            "assignee": "security-eng",
            "tags": [
                  "baseline-scan",
                  "automated"
            ],
            "priority": "p4",
            "slaMinutes": 60,
            "stepsTaken": []
      },
      {
            "id": "baseline-scan-9",
            "title": "Baseline Scan Finding #9",
            "severity": "high",
            "status": "open",
            "category": "Compliance",
            "source": "Audit",
            "description": "Automated baseline-scan assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-23T16:00:00Z",
            "assignee": "compliance",
            "tags": [
                  "baseline-scan",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 120,
            "stepsTaken": []
      },
      {
            "id": "baseline-scan-10",
            "title": "Baseline Scan Finding #10",
            "severity": "low",
            "status": "open",
            "category": "Operations",
            "source": "Manual",
            "description": "Automated baseline-scan assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-24T18:00:00Z",
            "assignee": "ops",
            "tags": [
                  "baseline-scan",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 240,
            "stepsTaken": []
      }
];

  private _benchmarks: BenchmarkProfile[] = [
    { id: 'b1', name: 'CIS Benchmark: Windows Server 2022', type: 'cis', version: '2.3.0', totalChecks: 387, passedChecks: 289, failedChecks: 72, warningChecks: 26, score: 75, lastScan: '2026-04-22T14:30:00Z', targetSystem: 'PROD-WIN-01', osVersion: 'Windows Server 2022 21H2' },
    { id: 'b2', name: 'CIS Benchmark: Ubuntu 22.04 LTS', type: 'cis', version: '1.1.0', totalChecks: 215, passedChecks: 178, failedChecks: 24, warningChecks: 13, score: 83, lastScan: '2026-04-22T10:15:00Z', targetSystem: 'PROD-LNX-01', osVersion: 'Ubuntu 22.04.3 LTS' },
    { id: 'b3', name: 'CIS Benchmark: Kubernetes v1.28', type: 'cis', version: '1.8.0', totalChecks: 168, passedChecks: 112, failedChecks: 42, warningChecks: 14, score: 67, lastScan: '2026-04-21T18:00:00Z', targetSystem: 'k8s-cluster-prod', osVersion: 'Kubernetes 1.28.5' },
    { id: 'b4', name: 'NIST SP 800-53 Rev5', type: 'nist', version: 'Rev5', totalChecks: 520, passedChecks: 416, failedChecks: 68, warningChecks: 36, score: 80, lastScan: '2026-04-20T09:00:00Z', targetSystem: 'Enterprise-wide', osVersion: 'Multi-platform' },
    { id: 'b5', name: 'DISA STIG: RHEL 9', type: 'stig', version: 'V1R5', totalChecks: 298, passedChecks: 232, failedChecks: 48, warningChecks: 18, score: 78, lastScan: '2026-04-22T06:00:00Z', targetSystem: 'PROD-RHEL-01', osVersion: 'RHEL 9.3' },
    { id: 'b6', name: 'PCI DSS v4.0', type: 'pci-dss', version: '4.0.1', totalChecks: 250, passedChecks: 215, failedChecks: 22, warningChecks: 13, score: 86, lastScan: '2026-04-19T12:00:00Z', targetSystem: 'Payment Gateway', osVersion: 'CentOS 8 + PostgreSQL 15' },
    { id: 'b7', name: 'HIPAA Security Rule', type: 'hipaa', version: '2023', totalChecks: 180, passedChecks: 148, failedChecks: 19, warningChecks: 13, score: 82, lastScan: '2026-04-21T15:00:00Z', targetSystem: 'EHR Systems', osVersion: 'Windows Server 2019' },
    { id: 'b8', name: 'CIS Benchmark: Docker CE', type: 'cis', version: '1.4.0', totalChecks: 78, passedChecks: 55, failedChecks: 16, warningChecks: 7, score: 71, lastScan: '2026-04-22T11:30:00Z', targetSystem: 'Docker Host PROD', osVersion: 'Docker 24.0.7' },
  ];

  private _findings: ScanFinding[] = [
    { id: 'f1', benchmarkId: 'b1', ruleId: '2.3.1.1', title: 'Ensure Windows Firewall is enabled', severity: 'critical', status: 'open', category: 'Network Security', description: 'Windows Firewall is currently disabled on all profiles (Domain, Private, Public). This exposes the system to unauthorized network access.', currentConfig: 'EnableFirewall=0 (all profiles)', expectedConfig: 'EnableFirewall=1 (all profiles)', remediation: 'Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True', remediationComplexity: 'low', cveReferences: ['CVE-2024-21351'], discoveredAt: '2026-04-22T14:30:00Z', assignedTo: 'sysops-team' },
    { id: 'f2', benchmarkId: 'b1', ruleId: '2.2.34', title: 'Ensure LAPS is installed and enabled', severity: 'high', status: 'in-progress', category: 'Access Control', description: 'Local Administrator Password Solution (LAPS) is not installed. Local admin passwords are not being rotated.', currentConfig: 'LAPS: Not Installed', expectedConfig: 'LAPS: Installed, AdmPwd GPO deployed', remediation: 'Install LAPS via Server Manager, configure GPO for password rotation', remediationComplexity: 'medium', cveReferences: [], discoveredAt: '2026-04-22T14:30:00Z', assignedTo: 'ad-team' },
    { id: 'f3', benchmarkId: 'b3', ruleId: '5.2.6', title: 'Ensure kubelet anonymous auth is disabled', severity: 'critical', status: 'open', category: 'Kubernetes Security', description: 'Kubelet anonymous authentication is enabled, allowing unauthenticated access to the kubelet API.', currentConfig: 'anonymous-auth=true', expectedConfig: 'anonymous-auth=false', remediation: 'Edit /etc/kubernetes/kubelet.conf and set --anonymous-auth=false, then restart kubelet', remediationComplexity: 'low', cveReferences: ['CVE-2023-2727'], discoveredAt: '2026-04-21T18:00:00Z', assignedTo: 'k8s-team' },
    { id: 'f4', benchmarkId: 'b3', ruleId: '5.3.2', title: 'Ensure TLS encryption for etcd is configured', severity: 'high', status: 'remediated', category: 'Kubernetes Security', description: 'etcd communications are not encrypted with TLS. Data in transit between etcd peers is unencrypted.', currentConfig: 'peer-cert-file="" (not set)', expectedConfig: 'peer-cert-file=/etc/kubernetes/pki/etcd/peer.crt', remediation: 'Generate TLS certs and configure etcd with --peer-client-cert-auth=true', remediationComplexity: 'high', cveReferences: [], discoveredAt: '2026-04-15T10:00:00Z', remediatedAt: '2026-04-20T14:00:00Z', assignedTo: 'k8s-team' },
    { id: 'f5', benchmarkId: 'b2', ruleId: '1.4.1', title: 'Ensure permissions on bootloader config are configured', severity: 'high', status: 'open', category: 'File System', description: 'Bootloader configuration file (grub.cfg) is world-readable, allowing potential boot parameter tampering.', currentConfig: '/boot/grub/grub.cfg: 644 (world-readable)', expectedConfig: '/boot/grub/grub.cfg: 400 (owner-read-only)', remediation: 'chmod 400 /boot/grub/grub.cfg && chown root:root /boot/grub/grub.cfg', remediationComplexity: 'low', cveReferences: [], discoveredAt: '2026-04-22T10:15:00Z', assignedTo: 'sysops-team' },
    { id: 'f6', benchmarkId: 'b2', ruleId: '3.1.2', title: 'Ensure wireless interfaces are disabled', severity: 'medium', status: 'accepted-risk', category: 'Network Security', description: 'Wireless network interfaces are active on a production server.', currentConfig: 'wlan0: UP, RUNNING', expectedConfig: 'wlan0: DOWN or removed', remediation: 'nmcli radio wifi off; echo "blacklist wl" >> /etc/modprobe.d/blacklist.conf', remediationComplexity: 'low', cveReferences: [], discoveredAt: '2026-04-22T10:15:00Z', notes: 'Accepted: physical isolation, no wireless AP in datacenter' },
    { id: 'f7', benchmarkId: 'b5', ruleId: 'RHEL-09-252030', title: 'Ensure SSH root login is disabled', severity: 'critical', status: 'remediated', category: 'Access Control', description: 'SSH direct root login is permitted, increasing brute-force attack surface.', currentConfig: 'PermitRootLogin yes', expectedConfig: 'PermitRootLogin no', remediation: 'Edit /etc/ssh/sshd_config: set PermitRootLogin no, restart sshd', remediationComplexity: 'low', cveReferences: [], discoveredAt: '2026-04-18T06:00:00Z', remediatedAt: '2026-04-19T09:00:00Z', assignedTo: 'sysops-team' },
    { id: 'f8', benchmarkId: 'b8', ruleId: '4.1', title: 'Ensure a user for the container has been created', severity: 'high', status: 'open', category: 'Container Security', description: 'Docker containers are running as root user. Containers should run as non-root users.', currentConfig: 'USER: root (default)', expectedConfig: 'USER appuser (non-privileged)', remediation: 'Add USER directive in Dockerfile after FROM statement', remediationComplexity: 'low', cveReferences: [], discoveredAt: '2026-04-22T11:30:00Z', assignedTo: 'devops-team' },
    { id: 'f9', benchmarkId: 'b4', ruleId: 'AC-2(7)', title: 'Ensure unsuccessful login attempts are monitored', severity: 'medium', status: 'open', category: 'Audit & Monitoring', description: 'No monitoring or alerting configured for repeated failed login attempts across the enterprise.', currentConfig: 'Failed login monitoring: Not configured', expectedConfig: 'SIEM rule: >5 failed logins in 5min triggers alert', remediation: 'Configure SIEM correlation rule for failed auth events, enable email/SMS alerts', remediationComplexity: 'medium', cveReferences: [], discoveredAt: '2026-04-20T09:00:00Z', assignedTo: 'soc-team' },
    { id: 'f10', benchmarkId: 'b6', ruleId: 'Req-2.2', title: 'Ensure system components are patched', severity: 'high', status: 'in-progress', category: 'Patch Management', description: '3 critical security patches are pending on the payment gateway server (last patched 45 days ago).', currentConfig: 'Last patch: 2026-03-08, 3 critical pending', expectedConfig: 'All critical patches applied within 30 days', remediation: 'Schedule maintenance window, apply 3 critical patches, reboot, verify services', remediationComplexity: 'medium', cveReferences: ['CVE-2024-3094', 'CVE-2024-27198'], discoveredAt: '2026-04-19T12:00:00Z', assignedTo: 'patch-team' },
    { id: 'f11', benchmarkId: 'b1', ruleId: '17.1.1', title: 'Ensure audit log retention is configured', severity: 'medium', status: 'open', category: 'Audit', description: 'Windows Security Event Log retention is set to overwrite as needed instead of a specific retention period.', currentConfig: 'Retention: Overwrite as needed', expectedConfig: 'Retention: 180 days minimum', remediation: 'wevtutil sl Security /rt:true /ms:104857600', remediationComplexity: 'low', cveReferences: [], discoveredAt: '2026-04-22T14:30:00Z', assignedTo: 'sysops-team' },
    { id: 'f12', benchmarkId: 'b7', ruleId: '164.308(a)(1)', title: 'Ensure security management process is documented', severity: 'low', status: 'open', category: 'Compliance', description: 'Security management process documentation is outdated (last review: 2025-09). Annual review required.', currentConfig: 'Last review: 2025-09-15', expectedConfig: 'Review within last 12 months', remediation: 'Schedule and complete annual security management process review with CISO', remediationComplexity: 'low', cveReferences: [], discoveredAt: '2026-04-21T15:00:00Z', assignedTo: 'compliance-team' },
  ];

  private _driftEvents: DriftEvent[] = [
    { id: 'd1', findingId: 'f7', timestamp: '2026-04-18T06:05:00Z', previousValue: 'PermitRootLogin no', newValue: 'PermitRootLogin yes', changedBy: 'admin_john', changeSource: 'manual', approved: false },
    { id: 'd2', findingId: 'f1', timestamp: '2026-04-20T09:30:00Z', previousValue: 'EnableFirewall=1', newValue: 'EnableFirewall=0', changedBy: 'system', changeSource: 'automation', approved: false },
    { id: 'd3', findingId: 'f3', timestamp: '2026-04-21T16:00:00Z', previousValue: 'anonymous-auth=false', newValue: 'anonymous-auth=true', changedBy: 'deploy_pipeline', changeSource: 'automation', approved: false },
    { id: 'd4', findingId: 'f4', timestamp: '2026-04-20T14:30:00Z', previousValue: 'peer-cert-file=""', newValue: 'peer-cert-file=/etc/kubernetes/pki/etcd/peer.crt', changedBy: 'k8s_admin', changeSource: 'manual', approved: true },
    { id: 'd5', findingId: 'f5', timestamp: '2026-04-22T08:00:00Z', previousValue: '/boot/grub/grub.cfg: 400', newValue: '/boot/grub/grub.cfg: 644', changedBy: 'system', changeSource: 'package-update', approved: false },
  ];

  private _schedules: ScanSchedule[] = [
    { id: 's1', name: 'Daily CIS Windows Scan', benchmarkType: 'cis', targets: ['PROD-WIN-01', 'PROD-WIN-02'], cronExpression: '0 2 * * *', enabled: true, lastRun: '2026-04-22T02:00:00Z', nextRun: '2026-04-23T02:00:00Z', notifications: true },
    { id: 's2', name: 'Weekly CIS Linux Scan', benchmarkType: 'cis', targets: ['PROD-LNX-01', 'PROD-RHEL-01'], cronExpression: '0 3 * * 1', enabled: true, lastRun: '2026-04-21T03:00:00Z', nextRun: '2026-04-28T03:00:00Z', notifications: true },
    { id: 's3', name: 'Monthly K8s CIS Scan', benchmarkType: 'cis', targets: ['k8s-cluster-prod'], cronExpression: '0 4 1 * *', enabled: true, lastRun: '2026-04-01T04:00:00Z', nextRun: '2026-05-01T04:00:00Z', notifications: true },
    { id: 's4', name: 'Quarterly PCI DSS Scan', benchmarkType: 'pci-dss', targets: ['Payment Gateway'], cronExpression: '0 0 1 1,4,7,10 *', enabled: true, lastRun: '2026-04-01T00:00:00Z', nextRun: '2026-07-01T00:00:00Z', notifications: true },
  ];

  private _trendData: TrendDataPoint[] = [
    { date: '2026-01', score: 68, critical: 18, high: 32, medium: 45, low: 28 },
    { date: '2026-02', score: 71, critical: 15, high: 29, medium: 42, low: 30 },
    { date: '2026-03', score: 74, critical: 12, high: 27, medium: 40, low: 32 },
    { date: '2026-04', score: 78, critical: 8, high: 24, medium: 38, low: 35 },
  ];

  private _getScoreColor(score: number): string {
    if (score >= 90) return '#22c55e';
    if (score >= 80) return '#84cc16';
    if (score >= 70) return '#eab308';
    if (score >= 60) return '#f97316';
    return '#ef4444';
  }

  private _getSeverityBadgeClass(sev: SeverityLevel): string {
    const map: Record<SeverityLevel, string> = { critical: 'badge-critical', high: 'badge-high', medium: 'badge-medium', low: 'badge-low', info: 'badge-info' };
    return map[sev] || 'badge-info';
  }

  private _renderTrendChart(): unknown {
    const w = 500, h = 140, pad = 30;
    const maxScore = 100;
    const points = this._trendData;
    const barW = (w - pad * 2) / points.length - 8;
    return html`
      <div class="chart-container">
        <div class="chart-title">Compliance Score Trend</div>
        <svg class="svg-chart" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
          ${points.map((p, i) => {
            const x = pad + i * (barW + 8) + barW / 2;
            const barH = (p.score / maxScore) * (h - pad - 20);
            const y = h - pad - barH;
            return html`
              <rect x="${x - barW / 2}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${this._getScoreColor(p.score)}" opacity="0.8"/>
              <text x="${x}" y="${y - 4}" text-anchor="middle" fill="#e2e8f0" font-size="10" font-weight="700">${p.score}</text>
              <text x="${x}" y="${h - 8}" text-anchor="middle" fill="#94a3b8" font-size="9">${p.date}</text>
            `;
          })}
        </svg>
      </div>`;
  }

  private _renderSeverityDonut(): unknown {
    const crit = this._findings.filter(f => f.severity === 'critical' && f.status === 'open').length;
    const high = this._findings.filter(f => f.severity === 'high' && f.status === 'open').length;
    const med = this._findings.filter(f => f.severity === 'medium' && f.status === 'open').length;
    const low = this._findings.filter(f => f.severity === 'low' && f.status === 'open').length;
    const total = crit + high + med + low || 1;
    const data = [
      { label: 'Critical', val: crit, color: '#ef4444' },
      { label: 'High', val: high, color: '#f97316' },
      { label: 'Medium', val: med, color: '#eab308' },
      { label: 'Low', val: low, color: '#22c55e' },
    ];
    const cx = 60, cy = 60, r = 40, sw = 14;
    let cumAngle = -90;
    return html`
      <div class="chart-container">
        <div class="chart-title">Open Findings by Severity</div>
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <svg viewBox="0 0 120 120" width="120" height="120">
            ${data.filter(d => d.val > 0).map(d => {
              const angle = (d.val / total) * 360;
              const startAngle = cumAngle;
              const endAngle = cumAngle + angle;
              cumAngle = endAngle;
              const s = (startAngle * Math.PI) / 180;
              const e = (endAngle * Math.PI) / 180;
              const largeArc = angle > 180 ? 1 : 0;
              const x1 = cx + r * Math.cos(s);
              const y1 = cy + r * Math.sin(s);
              const x2 = cx + r * Math.cos(e);
              const y2 = cy + r * Math.sin(e);
              return html`<path d="M${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2}" fill="none" stroke="${d.color}" stroke-width="${sw}" stroke-linecap="round"/>`;
            })}
            <text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="#e2e8f0" font-size="18" font-weight="700">${total}</text>
          </svg>
          <div style="display:flex;flex-direction:column;gap:4px;">
            ${data.map(d => html`<div style="display:flex;align-items:center;gap:6px;font-size:12px;">
              <span style="width:10px;height:10px;border-radius:2px;background:${d.color};flex-shrink:0;"></span>
              <span style="color:#94a3b8;">${d.label}:</span>
              <span style="font-weight:700;">${d.val}</span>
            </div>`)}
          </div>
        </div>
      </div>`;
  }

  private _toggleFinding(id: string) {
    this._expandedFinding = this._expandedFinding === id ? null : id;
  }

  private _getFilteredFindings(): ScanFinding[] {
    let result = this._findings;
    if (this._selectedBenchmark) result = result.filter(f => f.benchmarkId === this._selectedBenchmark);
    if (this._severityFilter !== 'all') result = result.filter(f => f.severity === this._severityFilter);
    if (this._statusFilter !== 'all') result = result.filter(f => f.status === this._statusFilter);
    if (this._searchQuery) {
      const q = this._searchQuery.toLowerCase();
      result = result.filter(f => f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.ruleId.toLowerCase().includes(q) || f.category.toLowerCase().includes(q));
    }
    return result;
  }

  private _startScan() {
    this._scanStatus = 'scanning';
    setTimeout(() => { this._scanStatus = 'completed'; }, 3000);
  }

  private _exportData(format: 'json' | 'csv') {
    const data = this._getFilteredFindings().map(f => ({
      ruleId: f.ruleId, title: f.title, severity: f.severity, status: f.status,
      category: f.category, benchmarkId: f.benchmarkId, remediation: f.remediation
    }));
    const blob = new Blob(
      [format === 'json' ? JSON.stringify(data, null, 2) : 'Rule ID,Title,Severity,Status,Category,Remediation\n' + data.map(r => `"${r.ruleId}","${r.title}","${r.severity}","${r.status}","${r.category}","${r.remediation}"`).join('\n')],
      { type: format === 'json' ? 'application/json' : 'text/csv' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `baseline-findings.${format}`; a.click();
    URL.revokeObjectURL(url);
  }

  private _workflowTasks: WorkflowTask[] = [
    { id: 'wt-1', title: 'Review Baseline Scan finding #1', status: 'active', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T12:00:00Z', priority: 'p1', createdAt: '2026-04-23T00:00:00Z', completedAt: null },
    { id: 'wt-2', title: 'Remediate critical endpoint misconfiguration', status: 'pending', assignee: 'security-eng', blockedBy: ['wt-1'], slaDeadline: '2026-04-23T16:00:00Z', priority: 'p1', createdAt: '2026-04-23T02:00:00Z', completedAt: null },
    { id: 'wt-3', title: 'Update Baseline Scan detection rules', status: 'blocked', assignee: 'soc-tier2', blockedBy: ['wt-2'], slaDeadline: '2026-04-24T00:00:00Z', priority: 'p2', createdAt: '2026-04-23T03:00:00Z', completedAt: null },
    { id: 'wt-4', title: 'Generate compliance report', status: 'pending', assignee: 'compliance', blockedBy: [], slaDeadline: '2026-04-24T08:00:00Z', priority: 'p3', createdAt: '2026-04-23T04:00:00Z', completedAt: null },
    { id: 'wt-5', title: 'Validate remediation for finding #6', status: 'completed', assignee: 'security-eng', blockedBy: [], slaDeadline: '2026-04-23T10:00:00Z', priority: 'p2', createdAt: '2026-04-22T18:00:00Z', completedAt: '2026-04-23T08:00:00Z' },
    { id: 'wt-6', title: 'Notify stakeholders of findings', status: 'completed', assignee: 'manager', blockedBy: [], slaDeadline: '2026-04-23T06:00:00Z', priority: 'p3', createdAt: '2026-04-22T20:00:00Z', completedAt: '2026-04-23T04:00:00Z' },
    { id: 'wt-7', title: 'Schedule follow-up scan', status: 'pending', assignee: 'ops', blockedBy: ['wt-2'], slaDeadline: '2026-04-25T00:00:00Z', priority: 'p4', createdAt: '2026-04-23T05:00:00Z', completedAt: null },
    { id: 'wt-8', title: 'Archive resolved Baseline Scan findings', status: 'failed', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T08:00:00Z', priority: 'p4', createdAt: '2026-04-22T22:00:00Z', completedAt: null },
  ];

  private _executionHistory: ExecutionRecord[] = [
    {
      id: 'exec-1', name: 'Baseline Scan Full Assessment Run', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:12:00Z', status: 'success',
      steps: [
        { id: 's1', name: 'Validate Scope', status: 'success', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:00:30Z', duration: 30, output: 'Scope validated: 142 targets' },
        { id: 's2', name: 'Collect Evidence', status: 'success', startedAt: '2026-04-22T10:00:30Z', completedAt: '2026-04-22T10:06:00Z', duration: 330, output: '1,847 events collected from 12 sources' },
        { id: 's3', name: 'Analyze Patterns', status: 'success', startedAt: '2026-04-22T10:06:00Z', completedAt: '2026-04-22T10:10:00Z', duration: 240, output: '23 patterns identified, 7 correlated' },
        { id: 's4', name: 'Generate Report', status: 'success', startedAt: '2026-04-22T10:10:00Z', completedAt: '2026-04-22T10:12:00Z', duration: 120, output: 'Report generated: 10 findings, 3 critical' },
      ],
    },
    {
      id: 'exec-2', name: 'Baseline Scan Delta Scan', startedAt: '2026-04-23T02:00:00Z', completedAt: '2026-04-23T02:05:00Z', status: 'failed',
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
      id: 'exec-' + Date.now(), name: 'Baseline Scan Assessment ' + new Date().toISOString().slice(0, 10), startedAt: new Date().toISOString(), completedAt: null, status: 'running', steps,
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
        ` : html`<div class="empty-state">Click "Run Assessment" to start the Baseline Scan analysis pipeline</div>`}
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
              const a = document.createElement('a'); a.href = url; a.download = 'baseline-scan-config.json'; a.click();
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
          <input class="search-box" type="text" placeholder="Add a comment..." style="min-width:auto;flex:1;" id="baseline-scan-comment-input" />
          <button class="btn primary" @click=${() => {
            const input = this.shadowRoot?.querySelector('#baseline-scan-comment-input') as HTMLInputElement;
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



  render() {
    const openFindings = this._findings.filter(f => f.status === 'open');
    const criticalOpen = openFindings.filter(f => f.severity === 'critical').length;
    const highOpen = openFindings.filter(f => f.severity === 'high').length;
    const avgScore = Math.round(this._benchmarks.reduce((s, b) => s + b.score, 0) / this._benchmarks.length);
    const filtered = this._getFilteredFindings();

    return html`
      <div class="panel">
        <div class="pt">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
          Security Baseline Scanner
        </div>

        <div class="score-grid">
          <div class="score-card">
            <div class="score-val" style="color:${this._getScoreColor(avgScore)}">${avgScore}%</div>
            <div class="score-lbl">Avg Compliance</div>
          </div>
          <div class="score-card">
            <div class="score-val" style="color:#ef4444">${criticalOpen}</div>
            <div class="score-lbl">Critical Open</div>
          </div>
          <div class="score-card">
            <div class="score-val" style="color:#f97316">${highOpen}</div>
            <div class="score-lbl">High Open</div>
          </div>
          <div class="score-card">
            <div class="score-val">${this._benchmarks.length}</div>
            <div class="score-lbl">Benchmarks</div>
          </div>
          <div class="score-card">
            <div class="score-val">${this._findings.filter(f => f.status === 'remediated').length}</div>
            <div class="score-lbl">Remediated</div>
          </div>
        </div>

        <div class="controls-row">
          <input class="search-box" type="text" placeholder="Search findings by rule, title, category..." .value=${this._searchQuery} @input=${(e: Event) => { this._searchQuery = (e.target as HTMLInputElement).value; }}/>
          <select class="filter-select" @change=${(e: Event) => { this._severityFilter = (e.target as HTMLSelectElement).value as SeverityLevel | 'all'; }}>
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select class="filter-select" @change=${(e: Event) => { this._statusFilter = (e.target as HTMLSelectElement).value; }}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="remediated">Remediated</option>
            <option value="accepted-risk">Accepted Risk</option>
          </select>
          <button class="btn primary" @click=${() => this._startScan()}>${this._scanStatus === 'scanning' ? html`<span class="scanning">Scanning...</span>` : 'Run Scan'}</button>
          <button class="btn" @click=${() => this._exportData('json')}>Export JSON</button>
          <button class="btn" @click=${() => this._exportData('csv')}>Export CSV</button>
        </div>

        <div class="tabs">
          <button class="tab ${this._activeTab === 'benchmarks' ? 'active' : ''}" @click=${() => { this._activeTab = 'benchmarks'; }}>Benchmarks</button>
          <button class="tab ${this._activeTab === 'findings' ? 'active' : ''}" @click=${() => { this._activeTab = 'findings'; }}>Findings (${filtered.length})</button>
          <button class="tab ${this._activeTab === 'drift' ? 'active' : ''}" @click=${() => { this._activeTab = 'drift'; }}>Config Drift</button>
          <button class="tab ${this._activeTab === 'schedule' ? 'active' : ''}" @click=${() => { this._activeTab = 'schedule'; }}>Schedules</button>
          <button class="tab ${this._activeTab === 'export' ? 'active' : ''}" @click=${() => { this._activeTab = 'export'; }}>History</button>
        </div>

        ${this._activeTab === 'benchmarks' ? html`
          ${this._renderSeverityDonut()}
          ${this._renderTrendChart()}
          <div class="bench-grid">
            ${this._benchmarks.map(b => html`
              <div class="bench-card ${this._selectedBenchmark === b.id ? 'selected' : ''}" @click=${() => { this._selectedBenchmark = this._selectedBenchmark === b.id ? null : b.id; }}>
                <div class="bench-name">${b.name}</div>
                <div class="bench-meta">
                  <span>v${b.version}</span>
                  <span>${b.targetSystem}</span>
                </div>
                <div class="bench-score-bar">
                  <div class="bench-score-fill" style="width:${b.score}%;background:${this._getScoreColor(b.score)};"></div>
                </div>
                <div class="bench-stats">
                  <span style="color:#86efac">${b.passedChecks} passed</span>
                  <span style="color:#fca5a5">${b.failedChecks} failed</span>
                  <span style="color:#fde047">${b.warningChecks} warn</span>
                </div>
              </div>
            `)}
          </div>
        ` : nothing}

        ${this._activeTab === 'findings' ? html`
          <div class="findings-list">
            ${filtered.map(f => html`
              <div class="finding-item ${this._expandedFinding === f.id ? 'expanded' : ''}" @click=${() => this._toggleFinding(f.id)}>
                <div class="finding-header">
                  <div class="finding-title">[${f.ruleId}] ${f.title}</div>
                  <div class="finding-badges">
                    <span class="badge ${this._getSeverityBadgeClass(f.severity)}">${f.severity}</span>
                    <span class="badge badge-${f.status === 'remediated' ? 'remediated' : f.status === 'in-progress' ? 'in-progress' : 'open'}">${f.status.replace('-', ' ')}</span>
                  </div>
                </div>
                <div class="finding-meta">${f.category} | ${f.benchmarkId.toUpperCase()} | Discovered: ${new Date(f.discoveredAt).toLocaleDateString()} ${f.assignedTo ? '| Assigned: ' + f.assignedTo : ''}</div>
                ${this._expandedFinding === f.id ? html`
                  <div class="finding-detail">
                    <div class="finding-desc">${f.description}</div>
                    <div class="config-diff">
                      <div class="config-current">Current: ${f.currentConfig}</div>
                      <div class="config-expected">Expected: ${f.expectedConfig}</div>
                    </div>
                    <div class="remediation-box">
                      <strong>Remediation (${f.remediationComplexity}):</strong><br/>
                      ${f.remediation}
                    </div>
                    ${f.cveReferences.length ? html`<div style="margin-top:8px;font-size:11px;color:#94a3b8;">CVE: ${f.cveReferences.map(c => html`<span style="color:#fca5a5;margin-right:8px;">${c}</span>`).join('')}</div>` : nothing}
                    ${f.notes ? html`<div style="margin-top:8px;font-size:11px;color:#94a3b8;font-style:italic;">Note: ${f.notes}</div>` : nothing}
                    <div style="margin-top:10px;display:flex;gap:6px;">
                      <button class="btn success" @click=${(e: Event) => { e.stopPropagation(); }}>Mark Remediated</button>
                      <button class="btn" @click=${(e: Event) => { e.stopPropagation(); }}>Accept Risk</button>
                      <button class="btn" @click=${(e: Event) => { e.stopPropagation(); }}>Assign</button>
                    </div>
                  </div>
                ` : nothing}
              </div>
            `)}
            ${filtered.length === 0 ? html`<div class="empty-state">No findings match the current filters</div>` : nothing}
          </div>
        ` : nothing}

        ${this._activeTab === 'drift' ? html`
          <div style="margin-bottom:12px;font-size:13px;color:#94a3b8;">Configuration drift events detected across monitored systems:</div>
          <div class="drift-timeline">
            ${this._driftEvents.map(d => html`
              <div class="finding-item" style="padding:10px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                  <span style="font-size:13px;font-weight:600;">Finding: ${d.findingId}</span>
                  <span class="badge ${d.approved ? 'badge-remediated' : 'badge-critical'}">${d.approved ? 'Approved' : 'Unauthorized'}</span>
                </div>
                <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">${new Date(d.timestamp).toLocaleString()} | Changed by: ${d.changedBy} | Source: ${d.changeSource.replace('-', ' ')}</div>
                <div class="config-diff" style="font-size:11px;">
                  <div class="config-current">Before: ${d.previousValue}</div>
                  <div class="config-expected">After: ${d.newValue}</div>
                </div>
              </div>
            `)}
          </div>
        ` : nothing}

        ${this._activeTab === 'schedule' ? html`
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:13px;color:#94a3b8;">Scheduled baseline scans</span>
            <button class="btn primary" @click=${() => { this._showNewScheduleForm = !this._showNewScheduleForm; }}>
              ${this._showNewScheduleForm ? 'Cancel' : 'New Schedule'}
            </button>
          </div>
          ${this._showNewScheduleForm ? html`
            <div class="form-section">
              <div class="form-title">Create Scan Schedule</div>
              <div class="form-grid">
                <div class="form-field">
                  <label class="form-label">Schedule Name</label>
                  <input class="form-input" type="text" placeholder="e.g., Daily CIS Scan"/>
                </div>
                <div class="form-field">
                  <label class="form-label">Benchmark Type</label>
                  <select class="form-input">
                    <option value="cis">CIS</option><option value="nist">NIST 800-53</option>
                    <option value="stig">STIG</option><option value="pci-dss">PCI DSS</option>
                    <option value="hipaa">HIPAA</option><option value="iso27001">ISO 27001</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="form-label">Cron Expression</label>
                  <input class="form-input" type="text" placeholder="0 2 * * *"/>
                </div>
                <div class="form-field">
                  <label class="form-label">Target Systems</label>
                  <input class="form-input" type="text" placeholder="Comma-separated hostnames"/>
                </div>
              </div>
              <div class="form-actions">
                <button class="btn success">Create Schedule</button>
                <button class="btn" @click=${() => { this._showNewScheduleForm = false; }}>Cancel</button>
              </div>
            </div>
          ` : nothing}
          <div class="findings-list">
            ${this._schedules.map(s => html`
              <div class="finding-item" style="padding:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <div style="font-size:13px;font-weight:600;">${s.name}</div>
                    <div style="font-size:11px;color:#94a3b8;margin-top:4px;">
                      ${s.benchmarkType.toUpperCase()} | Cron: ${s.cronExpression} | Targets: ${s.targets.join(', ')}
                    </div>
                    <div style="font-size:10px;color:#6b7280;margin-top:2px;">
                      Last: ${new Date(s.lastRun).toLocaleDateString()} | Next: ${new Date(s.nextRun).toLocaleDateString()}
                    </div>
                  </div>
                  <div style="display:flex;gap:6px;">
                    <span class="badge ${s.enabled ? 'badge-remediated' : 'badge-open'}">${s.enabled ? 'Enabled' : 'Disabled'}</span>
                    <button class="btn" style="font-size:10px;">Edit</button>
                  </div>
                </div>
              </div>
            `)}
          </div>
        ` : nothing}

        ${this._activeTab === 'export' ? html`
          <div style="margin-bottom:12px;font-size:13px;color:#94a3b8;">Scan execution history</div>
          <table class="history-table">
            <thead>
              <tr><th>Date</th><th>Benchmark</th><th>Target</th><th>Score</th><th>Findings</th><th>Duration</th><th>Status</th></tr>
            </thead>
            <tbody>
              <tr><td>Apr 22, 2026</td><td>CIS Windows Server</td><td>PROD-WIN-01</td><td style="color:#eab308">75%</td><td>72</td><td>4m 32s</td><td><span class="badge badge-remediated">Complete</span></td></tr>
              <tr><td>Apr 22, 2026</td><td>CIS Ubuntu 22.04</td><td>PROD-LNX-01</td><td style="color:#84cc16">83%</td><td>24</td><td>2m 15s</td><td><span class="badge badge-remediated">Complete</span></td></tr>
              <tr><td>Apr 22, 2026</td><td>CIS Docker</td><td>Docker Host PROD</td><td style="color:#eab308">71%</td><td>16</td><td>1m 48s</td><td><span class="badge badge-remediated">Complete</span></td></tr>
              <tr><td>Apr 21, 2026</td><td>CIS Kubernetes</td><td>k8s-cluster-prod</td><td style="color:#f97316">67%</td><td>42</td><td>6m 10s</td><td><span class="badge badge-remediated">Complete</span></td></tr>
              <tr><td>Apr 21, 2026</td><td>HIPAA</td><td>EHR Systems</td><td style="color:#84cc16">82%</td><td>19</td><td>3m 55s</td><td><span class="badge badge-remediated">Complete</span></td></tr>
              <tr><td>Apr 20, 2026</td><td>NIST 800-53</td><td>Enterprise-wide</td><td style="color:#84cc16">80%</td><td>68</td><td>12m 40s</td><td><span class="badge badge-remediated">Complete</span></td></tr>
              <tr><td>Apr 19, 2026</td><td>PCI DSS v4.0</td><td>Payment Gateway</td><td style="color:#84cc16">86%</td><td>22</td><td>5m 20s</td><td><span class="badge badge-remediated">Complete</span></td></tr>
            </tbody>
          </table>
        ` : nothing}
      </div>`;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-baseline-scan': ScBaselineScan; } }
