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



  // === Round 17: Risk Quantification Framework ===
  @state() private _bsFairModel: any = null;
  @state() private _bsRiskHeatMap: any = null;
  @state() private _bsRiskAppetite: any = null;
  @state() private _bsMonteCarlo: any = null;
  @state() private _bsRiskRegister: any = null;
  @state() private _bsRiskTrend: any = null;

  private bsInitRiskQuant() {
    this._bsFairModel = {
      scenarios: [
        { name: "Ransomware Attack", lef: 0.15, primaryLoss: 2500000, secondaryLoss: 800000, productivityLoss: 120000 },
        { name: "Data Breach (PII)", lef: 0.25, primaryLoss: 4800000, secondaryLoss: 1500000, productivityLoss: 200000 },
        { name: "Insider Threat", lef: 0.08, primaryLoss: 1800000, secondaryLoss: 600000, productivityLoss: 90000 },
        { name: "Supply Chain Compromise", lef: 0.05, primaryLoss: 3200000, secondaryLoss: 1100000, productivityLoss: 300000 },
        { name: "Cloud Misconfiguration", lef: 0.35, primaryLoss: 900000, secondaryLoss: 300000, productivityLoss: 60000 },
        { name: "Phishing Campaign", lef: 0.45, primaryLoss: 500000, secondaryLoss: 150000, productivityLoss: 40000 },
        { name: "Zero-Day Exploit", lef: 0.02, primaryLoss: 5500000, secondaryLoss: 2000000, productivityLoss: 500000 },
        { name: "DDoS Attack", lef: 0.20, primaryLoss: 700000, secondaryLoss: 200000, productivityLoss: 80000 }
      ],
      totalAlec: 8750000,
      riskCapacity: 12000000,
      toleranceThreshold: 75
    };
    this._bsRiskHeatMap = ((): any[] => {
      const grid: any[] = [];
      const labels = ["Rare","Unlikely","Possible","Likely","Almost Certain"];
      const impacts = ["Negligible","Minor","Moderate","Major","Catastrophic"];
      const data = [
        [1,2,3,4,5],[2,4,6,8,10],[3,6,9,12,15],[4,8,12,16,20],[5,10,15,20,25]
      ];
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          const score = data[i][j];
          grid.push({ likelihood: labels[i], impact: impacts[j], score, risk: score <= 4 ? "Low" : score <= 9 ? "Medium" : score <= 15 ? "High" : "Critical", color: score <= 4 ? "#4caf50" : score <= 9 ? "#ff9800" : score <= 15 ? "#f44336" : "#9c27b0" });
        }
      }
      return grid;
    })();
    this._bsRiskAppetite = {
      maxAcceptable: 5000000,
      boardApproved: 8000000,
      currentExposure: 6200000,
      categories: [
        { category: "Financial", appetite: 3000000, exposure: 2100000 },
        { category: "Reputational", appetite: 2000000, exposure: 1500000 },
        { category: "Operational", appetite: 1500000, exposure: 1200000 },
        { category: "Regulatory", appetite: 1000000, exposure: 800000 },
        { category: "Legal", appetite: 500000, exposure: 600000 }
      ]
    };
    this._bsMonteCarlo = ((): any[] => {
      const results: any[] = [];
      for (let i = 0; i < 20; i++) {
        const seed = (i + 1) * 7919;
        const r1 = ((seed * 16807) % 2147483647) / 2147483647;
        const r2 = ((seed * 48271) % 2147483647) / 2147483647;
        const baseLoss = 2000000 + r1 * 6000000;
        const variance = baseLoss * (r2 - 0.5) * 0.4;
        results.push({ iteration: i + 1, loss: Math.round(baseLoss + variance), percentile: 0 });
      }
      results.sort((a, b) => a.loss - b.loss);
      results.forEach((r, i) => { r.percentile = Math.round(((i + 1) / results.length) * 100); });
      return results;
    })();
    this._bsRiskRegister = [
      { id: "RSK-001", name: "Credential Stuffing", owner: "IAM Team", likelihood: 4, impact: 3, score: 12, status: "Mitigating", trend: "improving" },
      { id: "RSK-002", name: "Cloud Data Exposure", owner: "Cloud Sec", likelihood: 3, impact: 5, score: 15, status: "Open", trend: "stable" },
      { id: "RSK-003", name: "Third-Party Breach", owner: "GRC Team", likelihood: 3, impact: 4, score: 12, status: "Mitigating", trend: "worsening" },
      { id: "RSK-004", name: "Insider Data Theft", owner: "HR + SecOps", likelihood: 2, impact: 4, score: 8, status: "Monitoring", trend: "stable" },
      { id: "RSK-005", name: "Ransomware", owner: "SecOps", likelihood: 4, impact: 5, score: 20, status: "Mitigating", trend: "improving" },
      { id: "RSK-006", name: "API Security Flaw", owner: "AppSec", likelihood: 3, impact: 3, score: 9, status: "Open", trend: "worsening" },
      { id: "RSK-007", name: "Compliance Violation", owner: "GRC Team", likelihood: 2, impact: 5, score: 10, status: "Mitigating", trend: "improving" },
      { id: "RSK-008", name: "Social Engineering", owner: "SecAwareness", likelihood: 5, impact: 2, score: 10, status: "Monitoring", trend: "stable" }
    ];
    this._bsRiskTrend = [
      { month: "Oct", critical: 3, high: 8, medium: 15, low: 22 },
      { month: "Nov", critical: 2, high: 7, medium: 14, low: 24 },
      { month: "Dec", critical: 4, high: 9, medium: 16, low: 20 },
      { month: "Jan", critical: 3, high: 8, medium: 13, low: 21 },
      { month: "Feb", critical: 2, high: 6, medium: 12, low: 23 },
      { month: "Mar", critical: 1, high: 5, medium: 11, low: 25 }
    ];
  }

  private bsRenderRiskQuant() {
    const fm = this._bsFairModel;
    if (!fm) return nothing;
    const fmt = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : (n / 1000).toFixed(0) + "K";
    const sevColor = (s: number) => s <= 4 ? "#4caf50" : s <= 9 ? "#ff9800" : s <= 15 ? "#f44336" : "#9c27b0";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Risk Quantification Framework (FAIR)</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div style="background:#1a1d27;border-radius:4px;padding:8px">
            <div style="color:#aaa;font-size:9px;margin-bottom:4px">Annual Loss Expectancy</div>
            <div style="color:#48f;font-size:18px;font-weight:bold">${fmt(fm.totalAlec)}</div>
            <div style="color:#888;font-size:8px">Capacity: ${fmt(fm.riskCapacity)}</div>
          </div>
          <div style="background:#1a1d27;border-radius:4px;padding:8px">
            <div style="color:#aaa;font-size:9px;margin-bottom:4px">Risk Tolerance</div>
            <div style="color:#f84;font-size:18px;font-weight:bold">${fm.toleranceThreshold}%</div>
            <div style="background:#1a1d27;border-radius:3px;height:6px;margin-top:4px;overflow:hidden">
              <div style="height:100%;width:${Math.round((fm.totalAlec / fm.riskCapacity) * 100)}%;background:${fm.totalAlec / fm.riskCapacity > 0.75 ? "#f44" : "#48f"}"></div>
            </div>
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:6px">FAIR Model Scenarios</div>
        ${fm.scenarios.map((s: any) => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:9px">
            <span style="color:#ccc;width:130px;flex-shrink:0">${s.name}</span>
            <span style="color:#888;width:40px">LEF ${(s.lef * 100).toFixed(0)}%</span>
            <div style="flex:1;background:#1a1d27;border-radius:3px;height:5px;overflow:hidden">
              <div style="height:100%;width:${Math.min(100, (s.primaryLoss / 6000000) * 100)}%;background:${s.primaryLoss > 3000000 ? "#f44" : s.primaryLoss > 1500000 ? "#f84" : "#4caf50"}"></div>
            </div>
            <span style="color:#ddd;width:50px;text-align:right">${fmt(s.primaryLoss)}</span>
          </div>`)}
        <div style="color:#aaa;font-size:10px;margin:8px 0 6px">Risk Heat Map (5x5)</div>
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:2px;font-size:8px">
          ${this._bsRiskHeatMap.map((c: any) => html`<div style="background:${c.color}22;border:1px solid ${c.color}44;border-radius:2px;padding:3px;text-align:center;color:${c.color}">
              <div>${c.score}</div>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Monte Carlo Simulation (20 iterations)</div>
            ${this._bsMonteCarlo.slice(0, 10).map((r: any) => html`<div style="display:flex;gap:4px;font-size:8px;margin-bottom:1px">
                <span style="color:#888;width:20px">#${r.iteration}</span>
                <div style="flex:1;background:#1a1d27;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(r.loss / 8000000) * 100}%;background:${r.loss > 5000000 ? "#f44" : r.loss > 3000000 ? "#f84" : "#4caf50"}"></div>
                </div>
                <span style="color:#ccc;width:40px;text-align:right">${fmt(r.loss)}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Risk Register (Top 8)</div>
            ${this._bsRiskRegister.map((r: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
                <span style="color:${sevColor(r.score)};font-weight:bold;width:16px">${r.score}</span>
                <span style="color:#ccc;flex:1">${r.name}</span>
                <span style="color:${r.trend === "improving" ? "#4caf50" : r.trend === "worsening" ? "#f44" : "#888"};font-size:7px">${r.trend}</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:8px 0 4px">Risk Trend (6 months)</div>
        <div style="display:flex;gap:4px;align-items:flex-end;height:50px">
          ${this._bsRiskTrend.map((t: any) => html`<div style="flex:1;display:flex;flex-direction:column;gap:1px;align-items:center">
              <div style="display:flex;gap:1px;align-items:flex-end;height:40px">
                <div style="width:8px;height:${(t.critical / 25) * 40}px;background:#f44;border-radius:1px"></div>
                <div style="width:8px;height:${(t.high / 25) * 40}px;background:#f84;border-radius:1px"></div>
                <div style="width:8px;height:${(t.medium / 25) * 40}px;background:#ff8;border-radius:1px"></div>
                <div style="width:8px;height:${(t.low / 25) * 40}px;background:#4caf50;border-radius:1px"></div>
              </div>
              <span style="color:#888;font-size:7px">${t.month}</span>
            </div>`)}
        </div>
      </div>`;
  }

  // === Round 17: Security Program Management ===
  @state() private _bsOkrs: any = null;
  @state() private _bsInitiatives: any = null;
  @state() private _bsResourceAlloc: any = null;
  @state() private _bsHeadcount: any = null;
  @state() private _bsMilestones: any = null;
  @state() private _bsBudget: any = null;

  private bsInitSecProgram() {
    this._bsOkrs = [
      { objective: "Reduce Mean Time to Detect", keyResults: [{ kr: "MTTD < 24 hours", progress: 72 }, { kr: "Deploy EDR to 100% endpoints", progress: 89 }, { kr: "SIEM coverage 95%+", progress: 81 }], overallProgress: 81 },
      { objective: "Eliminate Critical Vulnerabilities in 7 days", keyResults: [{ kr: "Patch SLA compliance > 95%", progress: 67 }, { kr: "Zero critical vulns > 30 days", progress: 45 }, { kr: "Automated patching 80%+", progress: 58 }], overallProgress: 57 },
      { objective: "Achieve Zero Trust Architecture", keyResults: [{ kr: "Micro-segment 90% workloads", progress: 63 }, { kr: "ZTNA adoption 100%", progress: 78 }, { kr: "Continuous verification deployed", progress: 54 }], overallProgress: 65 },
      { objective: "Build Security-First Culture", keyResults: [{ kr: "Phishing click rate < 3%", progress: 85 }, { kr: "Security training 100%", progress: 92 }, { kr: "DevSecOps maturity L3+", progress: 48 }], overallProgress: 75 }
    ];
    this._bsInitiatives = [
      { name: "Zero Trust Migration", phase: "Phase 2", status: "On Track", owner: "ZT Program", budget: 1200000, spent: 680000, completion: 45, priority: "P0" },
      { name: "Cloud Security Posture", phase: "Phase 3", status: "At Risk", owner: "Cloud Sec", budget: 800000, spent: 750000, completion: 72, priority: "P0" },
      { name: "SOC Modernization", phase: "Phase 2", status: "On Track", owner: "SOC Lead", budget: 1500000, spent: 520000, completion: 35, priority: "P0" },
      { name: "AppSec Program", phase: "Phase 1", status: "On Track", owner: "AppSec Lead", budget: 600000, spent: 180000, completion: 25, priority: "P1" },
      { name: "Identity Governance", phase: "Phase 2", status: "Delayed", owner: "IAM Team", budget: 400000, spent: 380000, completion: 60, priority: "P1" },
      { name: "Threat Intelligence", phase: "Phase 1", status: "On Track", owner: "CTI Team", budget: 350000, spent: 120000, completion: 30, priority: "P1" },
      { name: "Vendor Risk Program", phase: "Phase 1", status: "On Track", owner: "GRC Team", budget: 250000, spent: 80000, completion: 20, priority: "P2" },
      { name: "Data Classification", phase: "Phase 2", status: "At Risk", owner: "Data Sec", budget: 300000, spent: 220000, completion: 55, priority: "P1" },
      { name: "Security Automation", phase: "Phase 2", status: "On Track", owner: "SecOps", budget: 500000, spent: 280000, completion: 40, priority: "P0" },
      { name: "Incident Response Upgrade", phase: "Phase 1", status: "On Track", owner: "IR Lead", budget: 200000, spent: 60000, completion: 22, priority: "P1" },
      { name: "Compliance Automation", phase: "Phase 1", status: "Delayed", owner: "GRC Team", budget: 450000, spent: 200000, completion: 35, priority: "P2" },
      { name: "Security Metrics Platform", phase: "Phase 1", status: "On Track", owner: "SecEng", budget: 300000, spent: 90000, completion: 28, priority: "P1" }
    ];
    this._bsResourceAlloc = [
      { domain: "Security Operations", allocated: 35, used: 31, budget: 2800000 },
      { domain: "Identity & Access", allocated: 12, used: 11, budget: 960000 },
      { domain: "Application Security", allocated: 10, used: 8, budget: 800000 },
      { domain: "Cloud Security", allocated: 8, used: 9, budget: 640000 },
      { domain: "GRC & Compliance", allocated: 8, used: 7, budget: 640000 },
      { domain: "Threat Intelligence", allocated: 5, used: 4, budget: 400000 },
      { domain: "Security Engineering", allocated: 7, used: 6, budget: 560000 }
    ];
    this._bsHeadcount = {
      total: 85, filled: 72, open: 13, budget: 10200000,
      byLevel: [{ level: "L3 (Senior)", count: 28, target: 32 }, { level: "L4 (Staff)", count: 18, target: 20 }, { level: "L5 (Principal)", count: 8, target: 10 }, { level: "L2 (Mid)", count: 14, target: 15 }, { level: "L1 (Junior)", count: 4, target: 8 }],
      criticalRoles: ["Cloud Security Architect", "Senior Threat Hunter", "AppSec Engineer", "SOC Analyst L2"]
    };
    this._bsMilestones = [
      { initiative: "Zero Trust", milestone: "Micro-seg Phase 2 complete", due: "2026-03-31", status: "On Track", rag: "green" },
      { initiative: "SOC Mod", milestone: "SOAR platform deployed", due: "2026-04-15", status: "At Risk", rag: "amber" },
      { initiative: "Cloud Sec", milestone: "CSPM full coverage", due: "2026-05-01", status: "Behind", rag: "red" },
      { initiative: "AppSec", milestone: "SAST in all CI/CD", due: "2026-06-30", status: "On Track", rag: "green" },
      { initiative: "IAM", milestone: "PAM deployment complete", due: "2026-04-30", status: "Delayed", rag: "red" },
      { initiative: "Automation", milestone: "50% alert triage automated", due: "2026-05-15", status: "On Track", rag: "green" }
    ];
    this._bsBudget = {
      total: 10200000, allocated: 9650000, spent: 5480000, remaining: 4170000,
      quarterly: [{ q: "Q1", allocated: 2412500, spent: 2412500 }, { q: "Q2", allocated: 2412500, spent: 1950000 }, { q: "Q3", allocated: 2412500, spent: 1117500 }, { q: "Q4", allocated: 2412500, spent: 0 }],
      byCategory: [{ cat: "Personnel", pct: 68 }, { cat: "Tools & Licenses", pct: 18 }, { cat: "Services", pct: 9 }, { cat: "Training", pct: 5 }]
    };
  }

  private bsRenderSecProgram() {
    const okrs = this._bsOkrs;
    if (!okrs) return nothing;
    const fmt = (n: number) => n >= 1000000 ? (n / 1000000).toFixed(1) + "M" : (n / 1000).toFixed(0) + "K";
    const ragColor = (r: string) => r === "green" ? "#4caf50" : r === "amber" ? "#ff9800" : "#f44";
    const statusColor = (s: string) => s === "On Track" ? "#4caf50" : s === "At Risk" ? "#ff9800" : "#f44";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Security Program Management</h4>
        <div style="color:#aaa;font-size:10px;margin-bottom:6px">OKR Tracking</div>
        ${okrs.map((o: any) => html`<div style="margin-bottom:8px;background:#1a1d27;border-radius:4px;padding:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="color:#e0e0e0;font-size:10px;font-weight:bold">${o.objective}</span>
              <span style="color:${o.overallProgress >= 75 ? "#4caf50" : o.overallProgress >= 50 ? "#ff9800" : "#f44"};font-size:10px;font-weight:bold">${o.overallProgress}%</span>
            </div>
            <div style="background:#111;border-radius:3px;height:6px;overflow:hidden;margin-bottom:4px">
              <div style="height:100%;width:${o.overallProgress}%;background:${o.overallProgress >= 75 ? "#4caf50" : o.overallProgress >= 50 ? "#ff9800" : "#f44"};transition:width 0.3s"></div>
            </div>
            ${o.keyResults.map((kr: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#888;width:12px">${kr.progress >= 75 ? "\u2713" : kr.progress >= 50 ? "\u25CB" : "\u25CB"}</span>
                <span style="color:#bbb;flex:1">${kr.kr}</span>
                <span style="color:#aaa;width:24px;text-align:right">${kr.progress}%</span>
              </div>`)}
          </div>`)}
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">Initiative Roadmap (12 initiatives)</div>
        <div style="max-height:120px;overflow-y:auto">
          ${this._bsInitiatives.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
              <span style="color:${i.priority === "P0" ? "#f44" : i.priority === "P1" ? "#f84" : "#888"};font-weight:bold;width:16px">${i.priority}</span>
              <span style="color:#ccc;flex:1">${i.name}</span>
              <span style="color:${statusColor(i.status)};width:50px">${i.status}</span>
              <span style="color:#888;width:24px;text-align:right">${i.completion}%</span>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Resource Allocation</div>
            ${this._bsResourceAlloc.slice(0, 5).map((r: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:90px">${r.domain}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(r.used / r.allocated) * 100}%;background:${r.used > r.allocated ? "#f44" : "#48f"}"></div>
                </div>
                <span style="color:#888">${r.used}/${r.allocated}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Budget Utilization</div>
            <div style="font-size:9px;color:#ccc;margin-bottom:4px">Total: ${fmt(this._bsBudget.total)} | Spent: ${fmt(this._bsBudget.spent)}</div>
            ${this._bsBudget.quarterly.map((q: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#888;width:16px">${q.q}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(q.spent / q.allocated) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#aaa">${fmt(q.spent)}</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">Milestone Tracker</div>
        ${this._bsMilestones.map((m: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <div style="width:6px;height:6px;border-radius:50%;background:${ragColor(m.rag)}"></div>
            <span style="color:#ccc;width:60px">${m.initiative}</span>
            <span style="color:#bbb;flex:1">${m.milestone}</span>
            <span style="color:#888">${m.due}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Third-Party Risk Assessment ===
  @state() private _bsVendorTiers: any = null;
  @state() private _bsDueDiligence: any = null;
  @state() private _bsContractClauses: any = null;
  @state() private _bsVendorScorecard: any = null;
  @state() private _bsSubProcessors: any = null;
  @state() private _bsVendorIncidents: any = null;

  private bsInitThirdParty() {
    this._bsVendorTiers = [
      { tier: "Critical", count: 8, vendors: ["AWS", "Azure AD", "CrowdStrike", "Okta", "ServiceNow", "Salesforce", "Workday", "Datadog"] },
      { tier: "High", count: 14, vendors: ["Slack", "GitHub", "Jenkins", "Terraform", "Artifactory", "Snyk", "Palo Alto", "Zscaler"] },
      { tier: "Medium", count: 32, vendors: ["Figma", "Confluence", "Zoom", "Dropbox", "Notion", "Linear"] },
      { tier: "Low", count: 67, vendors: ["Various SaaS tools", "Utilities", "Dev tools"] }
    ];
    this._bsDueDiligence = [
      { item: "SOC 2 Type II Report", required: true, passRate: 0.78 },
      { item: "ISO 27001 Certification", required: true, passRate: 0.65 },
      { item: "Penetration Test Results", required: true, passRate: 0.72 },
      { item: "Data Processing Agreement", required: true, passRate: 0.91 },
      { item: "Sub-processor List", required: true, passRate: 0.85 },
      { item: "Incident Response Plan", required: true, passRate: 0.68 },
      { item: "Business Continuity Plan", required: false, passRate: 0.58 },
      { item: "Encryption Standards", required: true, passRate: 0.88 },
      { item: "Access Control Policy", required: true, passRate: 0.76 },
      { item: "Vulnerability Management", required: true, passRate: 0.71 },
      { item: "Data Retention Policy", required: false, passRate: 0.64 },
      { item: "Privacy Impact Assessment", required: false, passRate: 0.52 },
      { item: "Insurance Coverage", required: true, passRate: 0.45 },
      { item: "Right to Audit Clause", required: true, passRate: 0.82 },
      { item: "Breach Notification SLA", required: true, passRate: 0.90 }
    ];
    this._bsContractClauses = [
      { clause: "Data Breach Notification", vendors: 98, compliant: 89, gap: 9 },
      { clause: "Right to Audit", vendors: 85, compliant: 72, gap: 13 },
      { clause: "Data Return on Termination", vendors: 92, compliant: 78, gap: 14 },
      { clause: "Liability Cap", vendors: 90, compliant: 65, gap: 25 },
      { clause: "Sub-processor Restrictions", vendors: 88, compliant: 80, gap: 8 },
      { clause: "Encryption Requirements", vendors: 95, compliant: 91, gap: 4 },
      { clause: "Incident Response SLA", vendors: 86, compliant: 74, gap: 12 },
      { clause: "Data Residency", vendors: 78, compliant: 62, gap: 16 }
    ];
    this._bsVendorScorecard = [
      { vendor: "AWS", security: 92, compliance: 95, reliability: 98, risk: "Low", overall: 95 },
      { vendor: "CrowdStrike", security: 94, compliance: 90, reliability: 96, risk: "Low", overall: 93 },
      { vendor: "Okta", security: 85, compliance: 92, reliability: 90, risk: "Low", overall: 89 },
      { vendor: "GitHub", security: 82, compliance: 78, reliability: 94, risk: "Medium", overall: 85 },
      { vendor: "Slack", security: 78, compliance: 80, reliability: 92, risk: "Medium", overall: 83 },
      { vendor: "Figma", security: 75, compliance: 72, reliability: 88, risk: "Medium", overall: 78 },
      { vendor: "Linear", security: 70, compliance: 65, reliability: 90, risk: "Medium", overall: 75 },
      { vendor: "StartupAI Inc", security: 55, compliance: 48, reliability: 72, risk: "High", overall: 58 }
    ];
    this._bsSubProcessors = [
      { vendor: "AWS", subProcessors: ["CloudFront", "S3 (US-East)", "DynamoDB", "Lambda"], reviewed: "2026-01" },
      { vendor: "CrowdStrike", subProcessors: ["AWS (hosting)", "Snowflake (analytics)"], reviewed: "2026-02" },
      { vendor: "Okta", subProcessors: ["AWS", "MongoDB Atlas"], reviewed: "2026-01" },
      { vendor: "Salesforce", subProcessors: ["AWS", "Heroku", "MuleSoft"], reviewed: "2025-11" },
      { vendor: "Datadog", subProcessors: ["GCP", "AWS"], reviewed: "2026-03" }
    ];
    this._bsVendorIncidents = [
      { vendor: "Okta", date: "2026-01-15", severity: "Medium", description: "Support access breach", resolved: true, ourImpact: "None" },
      { vendor: "Cloudflare", date: "2026-02-20", severity: "Low", description: "Config exposure", resolved: true, ourImpact: "Minimal" },
      { vendor: "GitHub", date: "2026-03-05", severity: "Low", description: "Dependency confusion", resolved: true, ourImpact: "None" },
      { vendor: "StartupAI Inc", date: "2026-03-18", severity: "High", description: "Data exposure incident", resolved: false, ourImpact: "Under review" }
    ];
  }

  private bsRenderThirdParty() {
    const tiers = this._bsVendorTiers;
    if (!tiers) return nothing;
    const tierColor = (t: string) => t === "Critical" ? "#f44" : t === "High" ? "#f84" : t === "Medium" ? "#ff8" : "#888";
    const sevColor = (s: string) => s === "High" ? "#f44" : s === "Medium" ? "#f84" : "#888";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Third-Party Risk Assessment</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
          ${tiers.map((t: any) => html`<div style="background:#1a1d27;border-radius:4px;padding:8px;text-align:center;border-top:2px solid ${tierColor(t.tier)}">
              <div style="color:${tierColor(t.tier)};font-size:18px;font-weight:bold">${t.count}</div>
              <div style="color:#aaa;font-size:9px">${t.tier}</div>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Due Diligence Pass Rate</div>
            ${this._bsDueDiligence.slice(0, 8).map((d: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:${d.required ? "#f44" : "#888"};width:8px">${d.required ? "*" : ""}</span>
                <span style="color:#ccc;flex:1">${d.item}</span>
                <div style="width:40px;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${d.passRate * 100}%;background:${d.passRate > 0.8 ? "#4caf50" : d.passRate > 0.6 ? "#ff9800" : "#f44"}"></div>
                </div>
                <span style="color:#888;width:28px;text-align:right">${(d.passRate * 100).toFixed(0)}%</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Contract Clause Compliance</div>
            ${this._bsContractClauses.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;flex:1">${c.clause}</span>
                <span style="color:${c.gap > 15 ? "#f44" : c.gap > 8 ? "#f84" : "#4caf50"};width:28px;text-align:right">${c.gap} gap</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">Vendor Security Scorecard</div>
        ${this._bsVendorScorecard.map((v: any) => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:8px">
            <span style="color:#ccc;width:80px;flex-shrink:0">${v.vendor}</span>
            <div style="display:flex;gap:2px;flex:1">
              <div title="Security" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.security}%;background:#48f"></div></div>
              <div title="Compliance" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.compliance}%;background:#4caf50"></div></div>
              <div title="Reliability" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.reliability}%;background:#ff9800"></div></div>
            </div>
            <span style="color:${tierColor(v.risk)};font-weight:bold;width:40px;text-align:right">${v.overall}</span>
          </div>`)}
        <div style="color:#aaa;font-size:10px;margin:8px 0 4px">Vendor Incidents (Recent)</div>
        ${this._bsVendorIncidents.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <div style="width:6px;height:6px;border-radius:50%;background:${sevColor(i.severity)}"></div>
            <span style="color:#ccc;width:70px">${i.vendor}</span>
            <span style="color:#bbb;flex:1">${i.description}</span>
            <span style="color:${i.resolved ? "#4caf50" : "#f44"}">${i.resolved ? "Resolved" : "Open"}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Data Loss Prevention ===
  @state() private _bsDlpRules: any = null;
  @state() private _bsDataMovement: any = null;
  @state() private _bsDataDiscovery: any = null;
  @state() private _bsDlpIncidents: any = null;
  @state() private _bsEncryptionMatrix: any = null;

  private bsInitDLP() {
    this._bsDlpRules = [
      { rule: "PII Detection (SSN)", type: "Content", channel: "Email+Cloud", enabled: true, matches: 234, blocked: 218, severity: "Critical" },
      { rule: "Credit Card Numbers", type: "Pattern", channel: "All", enabled: true, matches: 156, blocked: 148, severity: "Critical" },
      { rule: "Source Code Export", type: "Fingerprint", channel: "USB+Cloud", enabled: true, matches: 89, blocked: 85, severity: "High" },
      { rule: "Healthcare Records", type: "Content", channel: "Email", enabled: true, matches: 45, blocked: 42, severity: "Critical" },
      { rule: "Financial Reports", type: "Label", channel: "Email+Cloud", enabled: true, matches: 178, blocked: 165, severity: "High" },
      { rule: "API Key Detection", type: "Pattern", channel: "All", enabled: true, matches: 312, blocked: 301, severity: "High" },
      { rule: "Bulk Data Transfer", type: "Behavioral", channel: "Network", enabled: true, matches: 67, blocked: 58, severity: "Medium" },
      { rule: "Credential in Code", type: "Pattern", channel: "Git+Chat", enabled: true, matches: 445, blocked: 438, severity: "High" },
      { rule: "Encrypted Archive Upload", type: "Behavioral", channel: "Cloud", enabled: false, matches: 23, blocked: 0, severity: "Medium" },
      { rule: "Off-hours Data Access", type: "Behavioral", channel: "All", enabled: true, matches: 92, blocked: 78, severity: "Medium" }
    ];
    this._bsDataMovement = {
      totalEvents: 15847, monitored: 12456, blocked: 1533, allowed: 10923,
      byChannel: [{ channel: "Email", events: 5234, blocked: 892 }, { channel: "Cloud Upload", events: 4123, blocked: 345 }, { channel: "USB", events: 1234, blocked: 198 }, { channel: "Network", events: 3890, blocked: 67 }, { channel: "Print", events: 1366, blocked: 31 }],
      bySensitivity: [{ level: "Confidential", pct: 35 }, { level: "Internal", pct: 45 }, { level: "Public", pct: 20 }]
    };
    this._bsDataDiscovery = [
      { location: "SharePoint", total: 245000, sensitive: 12300, unclassified: 45000, lastScan: "2026-04-20" },
      { location: "S3 Buckets", total: 189000, sensitive: 8900, unclassified: 32000, lastScan: "2026-04-21" },
      { location: "Database Servers", total: 3400, sensitive: 2100, unclassified: 800, lastScan: "2026-04-19" },
      { location: "File Shares", total: 156000, sensitive: 6700, unclassified: 28000, lastScan: "2026-04-18" },
      { location: "Endpoints", total: 89000, sensitive: 3400, unclassified: 15000, lastScan: "2026-04-21" }
    ];
    this._bsDlpIncidents = [
      { id: "DLP-001", type: "PII Exposure", status: "Resolved", severity: "Critical", assignee: "SecOps", time: "2h" },
      { id: "DLP-002", type: "Source Code Leak", status: "Investigating", severity: "High", assignee: "AppSec", time: "4h" },
      { id: "DLP-003", type: "Credential Commit", status: "Resolved", severity: "High", assignee: "DevSecOps", time: "1h" },
      { id: "DLP-004", type: "Bulk Export", status: "Monitoring", severity: "Medium", assignee: "SOC", time: "8h" },
      { id: "DLP-005", type: "API Key in Log", status: "Resolved", severity: "Medium", assignee: "SecOps", time: "30m" }
    ];
    this._bsEncryptionMatrix = [
      { data: "PII at Rest", algorithm: "AES-256-GCM", coverage: 98, keyMgmt: "KMS" },
      { data: "PII in Transit", algorithm: "TLS 1.3", coverage: 100, keyMgmt: "Auto" },
      { data: "Source Code", algorithm: "AES-256-CBC", coverage: 85, keyMgmt: "Git Crypt" },
      { data: "Database", algorithm: "AES-256", coverage: 95, keyMgmt: "KMS" },
      { data: "Backups", algorithm: "AES-256-GCM", coverage: 92, keyMgmt: "KMS" },
      { data: "Email", algorithm: "TLS 1.2+", coverage: 88, keyMgmt: "S/MIME" },
      { data: "File Shares", algorithm: "BitLocker", coverage: 76, keyMgmt: "AD CS" },
      { data: "Cloud Storage", algorithm: "SSE-KMS", coverage: 94, keyMgmt: "Cloud KMS" }
    ];
  }

  private bsRenderDLP() {
    const rules = this._bsDlpRules;
    if (!rules) return nothing;
    const sevColor = (s: string) => s === "Critical" ? "#f44" : s === "High" ? "#f84" : "#ff8";
    const statusColor = (s: string) => s === "Resolved" ? "#4caf50" : s === "Investigating" ? "#f84" : "#ff8";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Data Loss Prevention</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
          ${[["Monitored",this._bsDataMovement.monitored.toLocaleString(),"#48f"],["Blocked",this._bsDataMovement.blocked.toLocaleString(),"#f44"],["Rules",rules.length,"#ff8"],["Incidents",this._bsDlpIncidents.length,"#f84"]].map(([l,v,c]) => html`<div style="background:#1a1d27;border-radius:4px;padding:6px;text-align:center">
              <div style="color:${c};font-size:16px;font-weight:bold">${v}</div>
              <div style="color:#888;font-size:8px">${l}</div>
            </div>`)}
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">DLP Policy Rules (10 active)</div>
        ${rules.slice(0, 6).map((r: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <div style="width:6px;height:6px;border-radius:50%;background:${r.enabled ? "#4f4" : "#666"}"></div>
            <span style="color:#ccc;flex:1">${r.rule}</span>
            <span style="color:${sevColor(r.severity)};width:40px;text-align:right">${r.blocked}/${r.matches}</span>
          </div>`)}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Data Movement by Channel</div>
            ${this._bsDataMovement.byChannel.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:60px">${c.channel}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(c.events / 5500) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#888;width:30px;text-align:right">${c.blocked}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Encryption Coverage</div>
            ${this._bsEncryptionMatrix.map((e: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:60px">${e.data}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${e.coverage}%;background:${e.coverage >= 95 ? "#4caf50" : e.coverage >= 85 ? "#ff9800" : "#f44"}"></div>
                </div>
                <span style="color:#888;width:28px;text-align:right">${e.coverage}%</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">DLP Incident Response</div>
        ${this._bsDlpIncidents.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <span style="color:${statusColor(i.status)};width:70px">${i.status}</span>
            <span style="color:#ccc;flex:1">${i.type}</span>
            <span style="color:${sevColor(i.severity)}">${i.severity}</span>
            <span style="color:#888">${i.time}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Security Automation Metrics ===
  @state() private _bsAutoMetrics: any = null;
  @state() private _bsAutoTimeSaved: any = null;
  @state() private _bsAutoReliability: any = null;
  @state() private _bsAutoComparison: any = null;
  @state() private _bsAutoROI: any = null;
  @state() private _bsAutoCandidates: any = null;

  private bsInitAutomation() {
    this._bsAutoMetrics = {
      totalPlaybooks: 48, activePlaybooks: 42, triggered: 12847, successful: 12156, failed: 691,
      coverage: 67, targetCoverage: 85, mttrReduction: 58, falsePositiveRate: 3.2
    };
    this._bsAutoTimeSaved = [
      { task: "Alert Triage", manualMin: 15, autoMin: 0.5, daily: 120, savedHours: 2920 },
      { task: "Vuln Scanning", manualMin: 60, autoMin: 5, daily: 8, savedHours: 2730 },
      { task: "Patch Deployment", manualMin: 45, autoMin: 10, daily: 15, savedHours: 2555 },
      { task: "User Provisioning", manualMin: 30, autoMin: 2, daily: 25, savedHours: 1825 },
      { task: "Compliance Reporting", manualMin: 120, autoMin: 15, daily: 1, savedHours: 639 },
      { task: "Incident Escalation", manualMin: 10, autoMin: 1, daily: 45, savedHours: 2737 },
      { task: "Log Analysis", manualMin: 90, autoMin: 8, daily: 3, savedHours: 1277 },
      { task: "Threat Intel Enrichment", manualMin: 20, autoMin: 3, daily: 60, savedHours: 1972 }
    ];
    this._bsAutoReliability = [
      { playbook: "Phishing Auto-Block", success: 98.5, executions: 4521, avgTime: "1.2s" },
      { playbook: "Vuln Auto-Scan", success: 97.2, executions: 2340, avgTime: "4.5m" },
      { playbook: "User Offboard", success: 99.1, executions: 156, avgTime: "30s" },
      { playbook: "Alert Enrichment", success: 96.8, executions: 8945, avgTime: "3.1s" },
      { playbook: "Malware Isolate", success: 95.4, executions: 89, avgTime: "8.2s" },
      { playbook: "Compliance Check", success: 94.7, executions: 365, avgTime: "2.1m" }
    ];
    this._bsAutoComparison = [
      { process: "Vulnerability Management", manual: 45, automated: 12, reduction: 73 },
      { process: "Incident Response", manual: 180, automated: 65, reduction: 64 },
      { process: "Access Reviews", manual: 30, automated: 5, reduction: 83 },
      { process: "Compliance Audits", manual: 120, automated: 45, reduction: 63 },
      { process: "Threat Detection", manual: 60, automated: 8, reduction: 87 },
      { process: "Configuration Drift", manual: 40, automated: 10, reduction: 75 }
    ];
    this._bsAutoROI = {
      investment: 850000, annualSavings: 2100000, roi: 147,
      costAvoidance: 1200000, efficiencyGain: 900000, headcountSaved: 4.5
    };
    this._bsAutoCandidates = [
      { task: "Security Questionnaire Response", complexity: "Medium", savings: "120 hrs/yr", priority: "High" },
      { task: "Certificate Rotation", complexity: "Low", savings: "80 hrs/yr", priority: "High" },
      { task: "Firewall Rule Review", complexity: "High", savings: "200 hrs/yr", priority: "Medium" },
      { task: "Data Classification Tagging", complexity: "Medium", savings: "150 hrs/yr", priority: "High" },
      { task: "Vendor Risk Scoring", complexity: "Medium", savings: "90 hrs/yr", priority: "Medium" },
      { task: "Security Awareness Campaigns", complexity: "Low", savings: "60 hrs/yr", priority: "Low" }
    ];
  }

  private bsRenderAutomation() {
    const m = this._bsAutoMetrics;
    if (!m) return nothing;
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Security Automation Metrics</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
          ${[["Coverage",m.coverage + "%","#48f"],["Playbooks",m.activePlaybooks,"#4caf50"],["MTTR Reduction",m.mttrReduction + "%","#f84"],["False + Rate",m.falsePositiveRate + "%","#ff8"]].map(([l,v,c]) => html`<div style="background:#1a1d27;border-radius:4px;padding:6px;text-align:center">
              <div style="color:${c};font-size:16px;font-weight:bold">${v}</div>
              <div style="color:#888;font-size:8px">${l}</div>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Time Saved by Task (annual hours)</div>
            ${this._bsAutoTimeSaved.slice(0, 5).map((t: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:90px">${t.task}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(t.savedHours / 3000) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#888;width:40px;text-align:right">${t.savedHours}h</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Playbook Reliability</div>
            ${this._bsAutoReliability.map((p: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:90px">${p.playbook}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${p.success}%;background:${p.success >= 97 ? "#4caf50" : p.success >= 95 ? "#ff9800" : "#f44"}"></div>
                </div>
                <span style="color:#888;width:35px;text-align:right">${p.success}%</span>
              </div>`)}
          </div>
        </div>
        <div style="background:#1a1d27;border-radius:4px;padding:8px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="color:#aaa;font-size:9px">Automation ROI</div>
              <div style="color:#4caf50;font-size:16px;font-weight:bold">${this._bsAutoROI.roi}%</div>
            </div>
            <div style="text-align:center">
              <div style="color:#aaa;font-size:9px">Annual Savings</div>
              <div style="color:#48f;font-size:16px;font-weight:bold">${(this._bsAutoROI.annualSavings / 1000000).toFixed(1)}M</div>
            </div>
            <div style="text-align:center">
              <div style="color:#aaa;font-size:9px">Headcount Saved</div>
              <div style="color:#ff8;font-size:16px;font-weight:bold">${this._bsAutoROI.headcountSaved}</div>
            </div>
            <div style="text-align:right">
              <div style="color:#aaa;font-size:9px">Investment</div>
              <div style="color:#ccc;font-size:16px;font-weight:bold">${(this._bsAutoROI.investment / 1000).toFixed(0)}K</div>
            </div>
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">Manual vs Automated (hours/process)</div>
        ${this._bsAutoComparison.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
            <span style="color:#ccc;width:90px">${c.process}</span>
            <span style="color:#f84;width:30px;text-align:right">${c.manual}h</span>
            <span style="color:#888;width:15px;text-align:center">\u2192</span>
            <span style="color:#4caf50;width:30px;text-align:right">${c.automated}h</span>
            <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
              <div style="height:100%;width:${c.reduction}%;background:#48f"></div>
            </div>
            <span style="color:#888;width:30px;text-align:right">-${c.reduction}%</span>
          </div>`)}
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">Next Automation Candidates</div>
        ${this._bsAutoCandidates.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <span style="color:${c.priority === "High" ? "#f44" : c.priority === "Medium" ? "#f84" : "#888"};font-weight:bold;width:40px">${c.priority}</span>
            <span style="color:#ccc;flex:1">${c.task}</span>
            <span style="color:#888">${c.savings}</span>
          </div>`)}
      </div>`;
  }

  // Round 17 initialization
  private bsInitRound17() {
    this.bsInitRiskQuant();
    this.bsInitSecProgram();
    this.bsInitThirdParty();
    this.bsInitDLP();
    this.bsInitAutomation();
  }

  private bsRenderRound17() {
    return html`${this.bsRenderRiskQuant()}${this.bsRenderSecProgram()}${this.bsRenderThirdParty()}${this.bsRenderDLP()}${this.bsRenderAutomation()}`;
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
  render() {
    const openFindings = this._findings.filter(f => f.status === 'open');
    const criticalOpen = openFindings.filter(f => f.severity === 'critical').length;
    const highOpen = openFindings.filter(f => f.severity === 'high').length;
    const avgScore = Math.round(this._benchmarks.reduce((s, b) => s + b.score, 0) / this._benchmarks.length);
    const filtered = this._getFilteredFindings();

    return html`${this.bsRenderRound17()}
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
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Baseline Scan Findings Grid</span>
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
  @state() private _bsScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _bsScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _bsScenarioCompare: boolean = false;
  @state() private _bsScenarioSelected: string[] = [];

  private _bsInitScenarios(): void {
    const saved = localStorage.getItem('bs_scenarios');
    if (saved) { try { this._bsScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._bsScenarios.length === 0) {
      this._bsScenarios = [
        {id:'bs-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'bs-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'bs-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _bsSaveScenarios(): void {
    localStorage.setItem('bs_scenarios', JSON.stringify(this._bsScenarios));
  }

  private _bsAddScenario(): void {
    const f = this._bsScenarioForm;
    if (!f.attackType || !f.target) return;
    this._bsScenarios = [...this._bsScenarios, {
      id: 'bs-s' + (this._bsScenarios.length + 1),
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
    this._bsScenarioForm = {attackType:'',target:'',method:''};
    this._bsSaveScenarios();
  }

  private _bsRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._bsScenarioCompare = !this._bsScenarioCompare; }}>${this._bsScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._bsScenarioForm = {...this._bsScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._bsScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._bsScenarioForm = {...this._bsScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._bsScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._bsScenarioForm = {...this._bsScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._bsScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._bsAddScenario}>Run Simulation</button>
      </div>
      ${this._bsScenarioCompare && this._bsScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._bsScenarios.length)},1fr);gap:8px">
            ${this._bsScenarios.slice(0,3).map(s => html`
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
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._bsScenarios.length})</div>
        ${this._bsScenarios.map(s => html`
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
  @state() private _bsTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _bsTrendZoom: {start:number;end:number} | null = null;
  @state() private _bsTrendMA: number = 7;

  private _bsInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._bsTrendData = data;
  }

  private _bsCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._bsTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._bsTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _bsGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._bsTrendData.map(d => d.value);
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

  private _bsRenderTimeSeries(): any {
    const stats = this._bsGetStats();
    const filtered = this._bsTrendZoom ? this._bsTrendData.filter(d => d.day >= this._bsTrendZoom.start && d.day <= this._bsTrendZoom.end) : this._bsTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._bsTrendMA === 7 ? 'active' : ''}" @click=${() => { this._bsTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._bsTrendMA === 30 ? 'active' : ''}" @click=${() => { this._bsTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._bsTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._bsTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
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
  @state() private _bsRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _bsActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _bsPermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _bsPermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _bsPermCompare: string[] = [];

  private _bsInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._bsRoles) {
      perms[role] = {};
      this._bsActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._bsPermissions = perms;
  }

  private _bsTogglePermission(role: string, action: string): void {
    const old = this._bsPermissions[role][action];
    this._bsPermissions = {...this._bsPermissions, [role]: {...this._bsPermissions[role], [action]: !old}};
    this._bsPermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _bsRenderRBAC(): any {
    const compareRoles = this._bsPermCompare.map(r => this._bsPermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._bsRoles.map(r => html`
              <button class="tab ${this._bsPermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._bsPermCompare = this._bsPermCompare.includes(r) ? this._bsPermCompare.filter(x => x !== r) : [...this._bsPermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._bsActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._bsRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._bsActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._bsPermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._bsTogglePermission(role, action)}>${this._bsPermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._bsPermCompare.join(' vs ')}</div>
            ${this._bsActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._bsPermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._bsPermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._bsPermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _bsReportTemplate: string = 'executive';
  @state() private _bsReportSchedule: string = 'weekly';
  @state() private _bsReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _bsReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _bsGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._bsReportHistory.unshift({id,template:this._bsReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _bsRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._bsReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._bsReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._bsReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._bsReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._bsReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._bsReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._bsGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._bsReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._bsReportHistory.slice(0,3).map(r => html`
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
  @state() private _bsHighContrast: boolean = false;
  @state() private _bsA11yAnnounce: string = '';
  @state() private _bsShortcutsVisible: boolean = false;
  @state() private _bsFocusTrap: boolean = false;

  private _bsShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _bsHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._bsFocusTrap) { this._bsFocusTrap = false; this._bsAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._bsHighContrast = !this._bsHighContrast; this._bsAnnounce('High contrast ' + (this._bsHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._bsShortcutsVisible = !this._bsShortcutsVisible; }
  }

  private _bsAnnounce(msg: string): void {
    this._bsA11yAnnounce = msg;
    setTimeout(() => { this._bsA11yAnnounce = ''; }, 2000);
  }

  private _bsRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._bsShortcutsVisible ? 'active' : ''}" @click=${() => { this._bsShortcutsVisible = !this._bsShortcutsVisible; }} aria-expanded=${this._bsShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._bsHighContrast} @change=${() => { this._bsHighContrast = !this._bsHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._bsShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._bsShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._bsA11yAnnounce}</div>
      </div>
    `;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.bsInitRound17();
    this._bsInitScenarios();
    this._bsInitTrendData();
    this._bsInitPermissions();
    document.addEventListener('keydown', this._bsHandleKeydown.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._bsHandleKeydown.bind(this));
  }

  
  // === MACHINE LEARNING FEATURES ===
  @state() private _bsMlActiveView: string = 'importance';
  @state() private _bsMlModelVersion: string = 'v3.2.1';
  @state() private _bsMlFeatureImportance: {name:string;importance:number;color:string}[] = [];
  @state() private _bsMlMetrics: {accuracy:number;precision:number;recall:number;f1:number;auc:number} = {accuracy:0.945,precision:0.931,recall:0.952,f1:0.941,auc:0.973};
  @state() private _bsMlConfusionMatrix: number[][] = [];
  @state() private _bsMlTrainingHistory: {epoch:number;loss:number;valLoss:number;accuracy:number;valAccuracy:number}[] = [];
  @state() private _bsMlConfidenceBins: {range:string;count:number;color:string}[] = [];
  @state() private _bsMlVersionHistory: {version:string;date:string;accuracy:number;f1:number;notes:string}[] = [];
  @state() private _bsMlSelectedVersion: string = 'v3.2.1';

  private _bsInitMlData(): void {
    this._bsMlFeatureImportance = [
      {name:'Request Rate',importance:0.234,color:'#f97316'},
      {name:'Payload Size',importance:0.198,color:'#3b82f6'},
      {name:'Time of Day',importance:0.167,color:'#8b5cf6'},
      {name:'Source IP Reputation',importance:0.145,color:'#10b981'},
      {name:'User Behavior Score',importance:0.112,color:'#ef4444'},
      {name:'Endpoint Type',importance:0.089,color:'#06b6d4'},
      {name:'Protocol Anomaly',importance:0.055,color:'#f59e0b'},
    ];
    this._bsMlConfusionMatrix = [
      [142, 3, 1],
      [2, 98, 4],
      [0, 5, 45],
    ];
    this._bsMlTrainingHistory = Array.from({length:20}, (_,i) => ({
      epoch: i+1,
      loss: Math.max(0.02, 0.8 * Math.exp(-0.15*i) + 0.02 + Math.random()*0.01),
      valLoss: Math.max(0.03, 0.85 * Math.exp(-0.14*i) + 0.03 + Math.random()*0.015),
      accuracy: Math.min(0.99, 0.6 + 0.39 * (1 - Math.exp(-0.18*i)) + Math.random()*0.005),
      valAccuracy: Math.min(0.98, 0.58 + 0.38 * (1 - Math.exp(-0.16*i)) + Math.random()*0.008),
    }));
    this._bsMlConfidenceBins = [
      {range:'0-10%',count:12,color:'#ef4444'},
      {range:'10-30%',count:34,color:'#f97316'},
      {range:'30-50%',count:67,color:'#f59e0b'},
      {range:'50-70%',count:128,color:'#eab308'},
      {range:'70-90%',count:245,color:'#22c55e'},
      {range:'90-100%',count:514,color:'#10b981'},
    ];
    this._bsMlVersionHistory = [
      {version:'v1.0.0',date:'2025-01-15',accuracy:0.812,f1:0.789,notes:'Initial model with basic features'},
      {version:'v2.0.0',date:'2025-04-20',accuracy:0.887,f1:0.874,notes:'Added behavioral analysis features'},
      {version:'v2.5.0',date:'2025-08-10',accuracy:0.912,f1:0.901,notes:'Improved temporal pattern detection'},
      {version:'v3.0.0',date:'2025-11-30',accuracy:0.931,f1:0.922,notes:'Neural network architecture upgrade'},
      {version:'v3.2.1',date:'2026-03-15',accuracy:0.945,f1:0.941,notes:'Fine-tuned on recent threat data'},
    ];
  }

  private _bsRenderMlFeatures(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Machine Learning Features">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Machine Learning Analysis</span>
          <div style="display:flex;gap:4px">
            ${['importance','metrics','matrix','training','confidence','versions'].map(v => html`
              <button class="tab ${this._bsMlActiveView === v ? 'active' : ''}" @click=${() => { this._bsMlActiveView = v; }}>${v.charAt(0).toUpperCase() + v.slice(1)}</button>
            `)}
          </div>
        </div>
        ${this._bsMlActiveView === 'importance' ? this._bsRenderFeatureImportance() : nothing}
        ${this._bsMlActiveView === 'metrics' ? this._bsRenderModelMetrics() : nothing}
        ${this._bsMlActiveView === 'matrix' ? this._bsRenderConfusionMatrix() : nothing}
        ${this._bsMlActiveView === 'training' ? this._bsRenderTrainingHistory() : nothing}
        ${this._bsMlActiveView === 'confidence' ? this._bsRenderConfidenceDist() : nothing}
        ${this._bsMlActiveView === 'versions' ? this._bsRenderVersionHistory() : nothing}
      </div>
    `;
  }

  private _bsRenderFeatureImportance(): any {
    const maxImp = Math.max(...this._bsMlFeatureImportance.map(f => f.importance));
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Feature Importance Ranking (Model ${this._bsMlModelVersion})</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${this._bsMlFeatureImportance.map((f, i) => html`
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

  private _bsRenderModelMetrics(): any {
    const m = this._bsMlMetrics;
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

  private _bsRenderConfusionMatrix(): any {
    const labels = ['Benign','Suspicious','Malicious'];
    const cm = this._bsMlConfusionMatrix;
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

  private _bsRenderTrainingHistory(): any {
    const data = this._bsMlTrainingHistory;
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

  private _bsRenderConfidenceDist(): any {
    const bins = this._bsMlConfidenceBins;
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

  private _bsRenderVersionHistory(): any {
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Model Version Comparison</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${this._bsMlVersionHistory.map(v => html`
          <div style="background:${v.version === this._bsMlSelectedVersion ? '#1e293b' : '#1a1d2e'};border-radius:6px;padding:10px;border-left:3px solid ${v.version === this._bsMlSelectedVersion ? '#3b82f6' : '#374151'};cursor:pointer" @click=${() => { this._bsMlSelectedVersion = v.version; }}>
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
  @state() private _bsCompActiveFramework: string = 'nist';
  @state() private _bsNistCategories: {id:string;name:string;status:'implemented'|'partial'|'not-started';priority:number;progress:number}[] = [];
  @state() private _bsCisControls: {number:number;name:string;implementation:number;maturity:string;owner:string}[] = [];
  @state() private _bsIsoClauses: {clause:string;title:string;status:string;evidence:number;gap:string}[] = [];
  @state() private _bsGdprArticles: {article:string;title:string;compliant:boolean;notes:string}[] = [];
  @state() private _bsSoc2Criteria: {criteria:string;category:string;status:string;score:number}[] = [];
  @state() private _bsCompGapFilter: string = 'all';

  private _bsInitComplianceData(): void {
    this._bsNistCategories = [
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
    this._bsCisControls = [
      {number:1,name:'Inventory and Control of Enterprise Assets',implementation:82,maturity:'Defined',owner:'IT Ops'},
      {number:2,name:'Inventory and Control of Software Assets',implementation:75,maturity:'Managed',owner:'SecOps'},
      {number:3,name:'Data Protection',implementation:90,maturity:'Defined',owner:'DPO'},
      {number:4,name:'Secure Configuration of Enterprise Assets',implementation:68,maturity:'Managed',owner:'IT Ops'},
      {number:5,name:'Account Management',implementation:85,maturity:'Defined',owner:'IAM Team'},
      {number:6,name:'Access Control Management',implementation:88,maturity:'Defined',owner:'IAM Team'},
      {number:7,name:'Continuous Vulnerability Management',implementation:72,maturity:'Managed',owner:'SecOps'},
      {number:8,name:'Audit Log Management',implementation:80,maturity:'Defined',owner:'SecOps'},
    ];
    this._bsIsoClauses = [
      {clause:'A.5.1',title:'Policies for Information Security',status:'Compliant',evidence:12,gap:'None'},
      {clause:'A.5.9',title:'Inventory of Information Assets',status:'Compliant',evidence:8,gap:'None'},
      {clause:'A.6.1',title:'Screening of Candidates',status:'Partial',evidence:5,gap:'Background check process not documented for contractors'},
      {clause:'A.7.1',title:'Before Using Information',status:'Compliant',evidence:10,gap:'None'},
      {clause:'A.8.1',title:'User Endpoint Devices',status:'Partial',evidence:4,gap:'MDM coverage at 78%, target 95%'},
      {clause:'A.8.9',title:'Configuration Management',status:'Partial',evidence:6,gap:'Automated config drift detection missing'},
      {clause:'A.8.16',title:'Monitoring Activities',status:'Compliant',evidence:9,gap:'None'},
      {clause:'A.8.23',title:'Web Filtering',status:'Not Started',evidence:0,gap:'No web filtering solution deployed'},
    ];
    this._bsGdprArticles = [
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
    this._bsSoc2Criteria = [
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

  private _bsRenderComplianceDeepDive(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Compliance Framework Deep Dive">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Compliance Framework</span>
          <div style="display:flex;gap:4px">
            ${['nist','cis','iso','gdpr','soc2'].map(fw => html`
              <button class="tab ${this._bsCompActiveFramework === fw ? 'active' : ''}" @click=${() => { this._bsCompActiveFramework = fw; }}>${fw.toUpperCase()}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:10px">
          ${['all','implemented','partial','not-started'].map(f => html`
            <button class="tab ${this._bsCompGapFilter === f ? 'active' : ''}" @click=${() => { this._bsCompGapFilter = f; }} style="font-size:10px">${f === 'all' ? 'All' : f === 'not-started' ? 'Not Started' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
          `)}
        </div>
        ${this._bsCompActiveFramework === 'nist' ? this._bsRenderNistCsf() : nothing}
        ${this._bsCompActiveFramework === 'cis' ? this._bsRenderCisControls() : nothing}
        ${this._bsCompActiveFramework === 'iso' ? this._bsRenderIso27001() : nothing}
        ${this._bsCompActiveFramework === 'gdpr' ? this._bsRenderGdprChecklist() : nothing}
        ${this._bsCompActiveFramework === 'soc2' ? this._bsRenderSoc2Criteria() : nothing}
      </div>
    `;
  }

  private _bsRenderNistCsf(): any {
    const filtered = this._bsCompGapFilter === 'all' ? this._bsNistCategories : this._bsNistCategories.filter(c => c.status === this._bsCompGapFilter);
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

  private _bsRenderCisControls(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">CIS Controls v8 Implementation Tracking</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._bsCisControls.map(c => html`
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

  private _bsRenderIso27001(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">ISO 27001 Clause Coverage Matrix</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._bsIsoClauses.map(c => html`
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

  private _bsRenderGdprChecklist(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">GDPR Article Compliance Checklist</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._bsGdprArticles.map(a => html`
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

  private _bsRenderSoc2Criteria(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">SOC 2 Trust Service Criteria Mapping</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._bsSoc2Criteria.map(c => html`
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
  @state() private _bsNetNodes: {id:string;label:string;type:string;segment:string;x:number;y:number;status:string}[] = [];
  @state() private _bsNetEdges: {from:string;to:string;weight:number;traffic:number;type:string}[] = [];
  @state() private _bsNetSelectedNode: string = '';
  @state() private _bsNetPathStart: string = '';
  @state() private _bsNetPathEnd: string = '';
  @state() private _bsNetPathResult: string[] = [];
  @state() private _bsNetSegmentFilter: string = 'all';
  @state() private _bsNetTrafficOverlay: boolean = false;
  @state() private _bsNetZoom: number = 1;

  private _bsInitNetworkData(): void {
    this._bsNetNodes = [
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
    this._bsNetEdges = [
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

  private _bsFindPath(start: string, end: string): string[] {
    const adj = new Map<string, string[]>();
    for (const e of this._bsNetEdges) {
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

  private _bsRenderNetworkMap(): any {
    const filteredNodes = this._bsNetSegmentFilter === 'all' ? this._bsNetNodes : this._bsNetNodes.filter(n => n.segment === this._bsNetSegmentFilter);
    const nodeMap = new Map(this._bsNetNodes.map(n => [n.id, n]));
    const filteredEdges = this._bsNetEdges.filter(e => filteredNodes.some(n => n.id === e.from) && filteredNodes.some(n => n.id === e.to));
    const typeColor: Record<string,string> = {firewall:'#ef4444',network:'#3b82f6',server:'#10b981',gateway:'#8b5cf6',database:'#f97316',cache:'#eab308',auth:'#06b6d4',monitoring:'#ec4899'};
    const pathSet = new Set(this._bsNetPathResult);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Interactive Network Map">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Network Topology</span>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            ${['all','dmz','frontend','backend','data','services'].map(s => html`
              <button class="tab ${this._bsNetSegmentFilter === s ? 'active' : ''}" @click=${() => { this._bsNetSegmentFilter = s; }} style="font-size:10px">${s.charAt(0).toUpperCase() + s.slice(1)}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap">
          <select style="background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:4px;padding:4px 8px;font-size:11px" @change=${(e: any) => { this._bsNetPathStart = e.target.value; }}>
            <option value="">Path Start...</option>
            ${this._bsNetNodes.map(n => html`<option value=${n.id}>${n.label}</option>`)}
          </select>
          <span style="color:#6b7280;font-size:12px">→</span>
          <select style="background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:4px;padding:4px 8px;font-size:11px" @change=${(e: any) => { this._bsNetPathEnd = e.target.value; }}>
            <option value="">Path End...</option>
            ${this._bsNetNodes.map(n => html`<option value=${n.id}>${n.label}</option>`)}
          </select>
          <button class="tab active" @click=${() => { if (this._bsNetPathStart && this._bsNetPathEnd) this._bsNetPathResult = this._bsFindPath(this._bsNetPathStart, this._bsNetPathEnd); }} style="font-size:10px">Trace Path</button>
          <label style="display:flex;align-items:center;gap:4px;font-size:10px;color:#9ca3af;cursor:pointer">
            <input type="checkbox" .checked=${this._bsNetTrafficOverlay} @change=${() => { this._bsNetTrafficOverlay = !this._bsNetTrafficOverlay; }}> Traffic Overlay
          </label>
        </div>
        <svg viewBox="0 0 650 540" style="width:100%;max-height:400px;background:#0a0c14;border-radius:6px;border:1px solid #1e293b">
          ${filteredEdges.map(e => {
            const from = nodeMap.get(e.from);
            const to = nodeMap.get(e.to);
            if (!from || !to) return nothing;
            const isPath = pathSet.has(e.from) && pathSet.has(e.to) && Math.abs(pathSet.indexOf(e.from) - pathSet.indexOf(e.to)) === 1;
            const strokeWidth = Math.max(1, e.weight / 10);
            const opacity = this._bsNetTrafficOverlay ? Math.min(1, e.traffic / 500) : 0.6;
            return html`<line x1=${from.x} y1=${from.y} x2=${to.x} y2=${to.y} stroke=${isPath ? '#fbbf24' : '#374151'} stroke-width=${isPath ? strokeWidth + 2 : strokeWidth} opacity=${opacity} ${isPath ? 'stroke-dasharray="6"' : ''}/>`;
          })}
          ${filteredNodes.map(n => html`
            <g @click=${() => { this._bsNetSelectedNode = n.id; }}>
              <circle cx=${n.x} cy=${n.y} r="16" fill=${typeColor[n.type] || '#6b7280'} opacity=${n.status === 'inactive' ? 0.3 : n.status === 'warning' ? 0.7 : 1} stroke=${this._bsNetSelectedNode === n.id ? '#fbbf24' : 'none'} stroke-width="2"/>
              <text x=${n.x} y=${n.y + 1} text-anchor="middle" fill="white" font-size="7" font-weight="600">${n.type.charAt(0).toUpperCase()}</text>
              <text x=${n.x} y=${n.y + 28} text-anchor="middle" fill="#9ca3af" font-size="8">${n.label}</text>
              ${this._bsNetTrafficOverlay ? html`<text x=${n.x} y=${n.y - 20} text-anchor="middle" fill="#60a5fa" font-size="7">${this._bsNetEdges.filter(e => e.from === n.id || e.to === n.id).reduce((s,e) => s + e.traffic, 0)} Mbps</text>` : nothing}
            </g>
          `)}
        </svg>
        ${this._bsNetPathResult.length > 0 ? html`
          <div style="margin-top:8px;background:#1a1d2e;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:4px">Traced Path (${this._bsNetPathResult.length} hops):</div>
            <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
              ${this._bsNetPathResult.map((id, i) => {
                const node = nodeMap.get(id);
                return html`
                  <span style="background:#fbbf2422;color:#fbbf24;font-size:10px;padding:2px 8px;border-radius:3px;font-weight:600">${node?.label || id}</span>
                  ${i < this._bsNetPathResult.length - 1 ? html`<span style="color:#6b7280">→</span>` : nothing}
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
  @state() private _bsSearchQuery: string = '';
  @state() private _bsSearchResults: {id:string;title:string;relevance:number;type:string;date:string;preview:string}[] = [];
  @state() private _bsSavedSearches: {id:string;query:string;createdAt:string;runCount:number}[] = [];
  @state() private _bsRecentSearches: string[] = [];
  @state() private _bsSearchFilters: {field:string;operator:string;value:string;logic:'and'|'or'|'not'}[] = [];
  @state() private _bsSearchActiveFilterIdx: number = -1;
  @state() private _bsSearchPreset: string = 'none';
  @state() private _bsSearchIsRunning: boolean = false;

  private _bsInitSearchData(): void {
    this._bsSavedSearches = [
      {id:'s1',query:'severity:critical status:open',createdAt:'2026-04-20',runCount:12},
      {id:'s2',query:'type:intrusion network:internal',createdAt:'2026-04-18',runCount:8},
      {id:'s3',query:'policy:DLP destination:cloud',createdAt:'2026-04-15',runCount:5},
    ];
    this._bsRecentSearches = ['critical vulnerabilities','failed login attempts','data exfiltration','phishing reports'];
  }

  private _bsExecuteSearch(): void {
    if (!this._bsSearchQuery.trim()) return;
    this._bsSearchIsRunning = true;
    this._bsRecentSearches = [this._bsSearchQuery, ...this._bsRecentSearches.filter(s => s !== this._bsSearchQuery)].slice(0, 10);
    setTimeout(() => {
      const q = this._bsSearchQuery.toLowerCase();
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
      this._bsSearchResults = mockData.filter(r => r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || r.preview.toLowerCase().includes(q) || q.length < 3);
      this._bsSearchIsRunning = false;
    }, 300);
  }

  private _bsAddSearchFilter(): void {
    this._bsSearchFilters.push({field:'',operator:'contains',value:'',logic:'and'});
    this._bsSearchActiveFilterIdx = this._bsSearchFilters.length - 1;
  }

  private _bsRemoveSearchFilter(idx: number): void {
    this._bsSearchFilters = this._bsSearchFilters.filter((_, i) => i !== idx);
    if (this._bsSearchActiveFilterIdx >= this._bsSearchFilters.length) this._bsSearchActiveFilterIdx = -1;
  }

  private _bsApplySearchPreset(preset: string): void {
    this._bsSearchPreset = preset;
    if (preset === 'critical') this._bsSearchQuery = 'severity:critical status:open';
    else if (preset === 'recent') this._bsSearchQuery = 'date:>2026-04-20 type:*';
    else if (preset === 'failed') this._bsSearchQuery = 'status:failed action:blocked';
    this._bsExecuteSearch();
  }

  private _bsRenderAdvancedSearch(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Advanced Search and Filter">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Advanced Search</span>
          <div style="display:flex;gap:4px">
            ${['none','critical','recent','failed'].map(p => html`
              <button class="tab ${this._bsSearchPreset === p ? 'active' : ''}" @click=${() => this._bsApplySearchPreset(p)} style="font-size:10px">${p === 'none' ? 'Presets' : p.charAt(0).toUpperCase() + p.slice(1)}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <div style="flex:1;position:relative">
            <input type="text" placeholder="Search across all data types..." value=${this._bsSearchQuery} @input=${(e: any) => { this._bsSearchQuery = e.target.value; }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._bsExecuteSearch(); }} style="width:100%;background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:6px;padding:8px 12px;font-size:12px;outline:none" aria-label="Search input"/>
          </div>
          <button class="tab active" @click=${() => this._bsExecuteSearch()} style="padding:8px 16px" ?disabled=${this._bsSearchIsRunning}>${this._bsSearchIsRunning ? '...' : 'Search'}</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap">
          <span style="font-size:10px;color:#6b7280">Filters:</span>
          <button class="tab" @click=${() => this._bsAddSearchFilter()} style="font-size:10px">+ Add Filter</button>
          ${this._bsSearchFilters.map((f, i) => html`
            <div style="display:flex;gap:4px;align-items:center;background:#1a1d2e;border-radius:4px;padding:4px 8px">
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._bsSearchFilters[i].field = e.target.value; }}>
                <option value="">Field</option>
                <option value="severity">Severity</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
                <option value="date">Date</option>
                <option value="source">Source</option>
              </select>
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._bsSearchFilters[i].operator = e.target.value; }}>
                <option value="contains">Contains</option>
                <option value="equals">Equals</option>
                <option value="starts">Starts with</option>
                <option value="gt">Greater than</option>
                <option value="lt">Less than</option>
              </select>
              <input type="text" placeholder="Value" style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 6px;font-size:10px;width:80px" @input=${(e: any) => { this._bsSearchFilters[i].value = e.target.value; }}/>
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._bsSearchFilters[i].logic = e.target.value; }}>
                <option value="and">AND</option>
                <option value="or">OR</option>
                <option value="not">NOT</option>
              </select>
              <button @click=${() => this._bsRemoveSearchFilter(i)} style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:12px;padding:0 2px">✕</button>
            </div>
          `)}
        </div>
        ${this._bsSearchResults.length > 0 ? html`
          <div style="margin-bottom:8px;font-size:10px;color:#9ca3af">${this._bsSearchResults.length} results found</div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto">
            ${this._bsSearchResults.map(r => html`
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
        ${this._bsRecentSearches.length > 0 && this._bsSearchResults.length === 0 ? html`
          <div style="margin-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Recent Searches:</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              ${this._bsRecentSearches.map(s => html`
                <button class="tab" @click=${() => { this._bsSearchQuery = s; this._bsExecuteSearch(); }} style="font-size:10px">${s}</button>
              `)}
            </div>
          </div>
        ` : nothing}
        ${this._bsSavedSearches.length > 0 ? html`
          <div style="margin-top:8px;border-top:1px solid #1e293b;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Saved Searches:</div>
            <div style="display:flex;flex-direction:column;gap:3px">
              ${this._bsSavedSearches.map(s => html`
                <div style="display:flex;justify-content:space-between;align-items:center;background:#1a1d2e;border-radius:4px;padding:4px 8px;cursor:pointer" @click=${() => { this._bsSearchQuery = s.query; this._bsExecuteSearch(); }}>
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
  @state() private _bsUndoStack: {id:number;action:string;timestamp:string;snapshot:string}[] = [];
  @state() private _bsRedoStack: {id:number;action:string;timestamp:string;snapshot:string}[] = [];
  @state() private _bsHistoryCounter: number = 0;
  @state() private _bsHistoryVisible: boolean = false;
  @state() private _bsDiffViewActive: boolean = false;
  @state() private _bsDiffFromId: number = -1;
  @state() private _bsDiffToId: number = -1;
  @state() private _bsCurrentSnapshot: string = '';

  private _bsPushHistory(action: string): void {
    this._bsHistoryCounter++;
    const entry = {
      id: this._bsHistoryCounter,
      action,
      timestamp: new Date().toISOString(),
      snapshot: JSON.stringify({searchQuery: this._bsSearchQuery, filters: this._bsSearchFilters, compFramework: this._bsCompActiveFramework, mlView: this._bsMlActiveView}),
    };
    this._bsUndoStack.push(entry);
    this._bsRedoStack = [];
    this._bsCurrentSnapshot = entry.snapshot;
  }

  private _bsUndo(): void {
    if (this._bsUndoStack.length <= 1) return;
    const current = this._bsUndoStack.pop()!;
    this._bsRedoStack.push(current);
    const prev = this._bsUndoStack[this._bsUndoStack.length - 1];
    this._bsCurrentSnapshot = prev.snapshot;
    try {
      const data = JSON.parse(prev.snapshot);
      if (data.searchQuery !== undefined) this._bsSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._bsSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._bsCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._bsMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _bsRedo(): void {
    if (this._bsRedoStack.length === 0) return;
    const entry = this._bsRedoStack.pop()!;
    this._bsUndoStack.push(entry);
    this._bsCurrentSnapshot = entry.snapshot;
    try {
      const data = JSON.parse(entry.snapshot);
      if (data.searchQuery !== undefined) this._bsSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._bsSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._bsCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._bsMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _bsJumpToHistory(id: number): void {
    const idx = this._bsUndoStack.findIndex(e => e.id === id);
    if (idx < 0) return;
    const removed = this._bsUndoStack.splice(idx + 1);
    this._bsRedoStack.push(...removed.reverse());
    const target = this._bsUndoStack[this._bsUndoStack.length - 1];
    this._bsCurrentSnapshot = target.snapshot;
    try {
      const data = JSON.parse(target.snapshot);
      if (data.searchQuery !== undefined) this._bsSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._bsSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._bsCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._bsMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _bsGetDiff(fromId: number, toId: number): {field:string;from:string;to:string}[] {
    const fromEntry = this._bsUndoStack.find(e => e.id === fromId);
    const toEntry = this._bsUndoStack.find(e => e.id === toId);
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

  private _bsRenderUndoRedo(): any {
    const allHistory = [...this._bsUndoStack];
    const diffs = this._bsDiffViewActive && this._bsDiffFromId >= 0 && this._bsDiffToId >= 0 ? this._bsGetDiff(this._bsDiffFromId, this._bsDiffToId) : [];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Undo Redo History">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Action History</span>
          <div style="display:flex;gap:4px">
            <button class="tab" @click=${() => this._bsUndo()} ?disabled=${this._bsUndoStack.length <= 1} style="font-size:10px">↩ Undo</button>
            <button class="tab" @click=${() => this._bsRedo()} ?disabled=${this._bsRedoStack.length === 0} style="font-size:10px">Redo ↪</button>
            <button class="tab ${this._bsHistoryVisible ? 'active' : ''}" @click=${() => { this._bsHistoryVisible = !this._bsHistoryVisible; }} style="font-size:10px">Timeline</button>
            <button class="tab ${this._bsDiffViewActive ? 'active' : ''}" @click=${() => { this._bsDiffViewActive = !this._bsDiffViewActive; }} style="font-size:10px">Diff</button>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;font-size:10px;color:#6b7280">
          <span>Undo: ${this._bsUndoStack.length}</span>
          <span>|</span>
          <span>Redo: ${this._bsRedoStack.length}</span>
          <span>|</span>
          <span>Total Actions: ${this._bsHistoryCounter}</span>
        </div>
        ${this._bsHistoryVisible ? html`
          <div style="background:#1a1d2e;border-radius:6px;padding:8px;max-height:200px;overflow-y:auto;margin-bottom:8px">
            ${allHistory.map((entry, i) => html`
              <div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #0f1117;cursor:pointer;opacity:${i === allHistory.length - 1 ? 1 : 0.6}" @click=${() => this._bsJumpToHistory(entry.id)}>
                <div style="width:12px;height:12px;border-radius:50%;background:${i === allHistory.length - 1 ? '#3b82f6' : '#374151'};flex-shrink:0"></div>
                <span style="font-size:10px;color:#e2e8f0;flex:1">${entry.action}</span>
                <span style="font-size:9px;color:#6b7280">${new Date(entry.timestamp).toLocaleTimeString()}</span>
                ${this._bsDiffViewActive ? html`
                  <input type="radio" name="diff-from" style="accent-color:#3b82f6" @change=${() => { this._bsDiffFromId = entry.id; }}/>
                  <input type="radio" name="diff-to" style="accent-color:#f97316" @change=${() => { this._bsDiffToId = entry.id; }}/>
                ` : nothing}
              </div>
            `)}
          </div>
        ` : nothing}
        ${this._bsDiffViewActive ? html`
          <div style="background:#1a1d2e;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:6px">${diffs.length > 0 ? 'Differences found:' : this._bsDiffFromId >= 0 && this._bsDiffToId >= 0 ? 'No differences' : 'Select two points in timeline to compare'}</div>
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
  @state() private _bsActiveSubTab: string = 'scenario';

  private _bsGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _bsRenderSubPanel(): any {
    switch (this._bsActiveSubTab) {
      case 'scenario': return this._bsRenderScenarioEngine();
      case 'timeseries': return this._bsRenderTimeSeries();
      case 'rbac': return this._bsRenderRBAC();
      case 'reporting': return this._bsRenderReporting();
      case 'a11y': return this._bsRenderAccessibility();
      default: return nothing;
    }
  }

  private _bsRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._bsGetAllSubTabs().map(t => html`
          <button class="tab ${this._bsActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._bsActiveSubTab = t.key; }} role="tab" aria-selected=${this._bsActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="bs-tab-${this._bsActiveSubTab}">
        ${this._bsRenderSubPanel()}
      </div>
    `;
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


  // === Zero Trust Architecture Module ===
  @state() private _ztMaturityLevel: number = 3;
  @state() private _ztMaturityLevels = [
    { level: 1, name: 'Initial', desc: 'Ad-hoc security, no formal ZT policy', color: '#ef4444', score: 15 },
    { level: 2, name: 'Developing', desc: 'Basic identity verification, perimeter-focused', color: '#f97316', score: 35 },
    { level: 3, name: 'Defined', desc: 'Micro-segmentation pilot, policy-based access', color: '#f59e0b', score: 55 },
    { level: 4, name: 'Managed', desc: 'Continuous verification, adaptive policies', color: '#22c55e', score: 78 },
    { level: 5, name: 'Optimized', desc: 'Full ZT maturity, AI-driven trust decisions', color: '#06b6d4', score: 95 },
  ];
  @state() private _ztEntities: Array<{ id: string; name: string; type: 'user' | 'device' | 'service' | 'network'; trustScore: number; lastVerified: string; riskFactors: string[]; policies: string[] }> = [
    { id: 'zt-e001', name: 'admin@corp.com', type: 'user', trustScore: 92, lastVerified: '2026-04-23T09:45:00Z', riskFactors: ['privileged'], policies: ['mfa-required', 'session-timeout-30m', 'ip-whitelist'] },
    { id: 'zt-e002', name: 'laptop-alice', type: 'device', trustScore: 78, lastVerified: '2026-04-23T09:30:00Z', riskFactors: [' BYOD', 'os-outdated'], policies: ['eds-check', 'disk-encryption', 'vpn-required'] },
    { id: 'zt-e003', name: 'api-gateway-prod', type: 'service', trustScore: 95, lastVerified: '2026-04-23T09:50:00Z', riskFactors: [], policies: ['mtls', 'rate-limit', 'jwt-validation'] },
    { id: 'zt-e004', name: '10.0.0.0/8', type: 'network', trustScore: 65, lastVerified: '2026-04-23T08:00:00Z', riskFactors: ['flat-network', 'legacy-systems'], policies: ['micro-seg-pilot', 'east-west-firewall'] },
    { id: 'zt-e005', name: 'contractor@vendor.com', type: 'user', trustScore: 42, lastVerified: '2026-04-22T18:00:00Z', riskFactors: ['external', 'shared-creds', 'no-mfa'], policies: ['restrict-data-access', 'session-record'] },
  ];
  @state() private _ztFilterType: string = 'all';
  @state() private _ztExceptions: Array<{ id: string; entity: string; reason: string; approvedBy: string; expiresAt: string; status: 'active' | 'expired' | 'revoked' }> = [
    { id: 'zt-x001', entity: 'legacy-db-01', reason: 'Cannot support mTLS, migration planned Q3', approvedBy: 'ciso@corp.com', expiresAt: '2026-09-30T23:59:59Z', status: 'active' },
    { id: 'zt-x002', entity: 'svc-batch-etl', reason: 'Long-running job exceeds session timeout', approvedBy: 'sec-lead@corp.com', expiresAt: '2026-06-15T23:59:59Z', status: 'active' },
  ];

  private _renderZeroTrustModule(): any {
    const currentLevel = this._ztMaturityLevels[this._ztMaturityLevel - 1];
    const filteredEntities = this._ztEntities.filter(e => this._ztFilterType === 'all' || e.type === this._ztFilterType);
    const entityTypes = ['user', 'device', 'service', 'network'] as const;
    const typeIcons: Record<string, string> = { user: '\u{1F464}', device: '\u{1F4BB}', service: '\u{2699}\uFE0F', network: '\u{1F310}' };
    return html`
      <div style="padding:12px;background:#0a0c10;border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">\u{1F6E1}\uFE0F Zero Trust Architecture</span>
          <span style="font-size:9px;color:${currentLevel.color};background:${currentLevel.color}18;padding:2px 8px;border-radius:10px">Level ${currentLevel.level}: ${currentLevel.name}</span>
        </div>
        <div style="display:flex;gap:4px;margin-bottom:10px">
          ${this._ztMaturityLevels.map(l => html`
            <div style="flex:1;text-align:center;padding:4px 2px;background:${l.level === this._ztMaturityLevel ? l.color + '22' : '#111827'};border-radius:4px;border:1px solid ${l.level === this._ztMaturityLevel ? l.color + '55' : '#1f2937'};cursor:pointer" @click=${() => { this._ztMaturityLevel = l.level; }}>
              <div style="font-size:10px;font-weight:700;color:${l.color}">L${l.level}</div>
              <div style="font-size:7px;color:#9ca3af">${l.name}</div>
              <div style="font-size:8px;color:#6b7280;margin-top:2px">${l.score}%</div>
            </div>
          `)}
        </div>
        <div style="font-size:9px;color:#9ca3af;margin-bottom:8px;padding:4px 8px;background:#111827;border-radius:4px">${currentLevel.desc}</div>
        <div style="display:flex;gap:3px;margin-bottom:8px;flex-wrap:wrap">
          <button class="btn btn-sm" style="font-size:8px;padding:2px 5px;background:${this._ztFilterType === 'all' ? '#1e3a5f' : '#111827'};color:${this._ztFilterType === 'all' ? '#60a5fa' : '#6b7280'}" @click=${() => { this._ztFilterType = 'all'; }}>All (${this._ztEntities.length})</button>
          ${entityTypes.map(t => html`
            <button class="btn btn-sm" style="font-size:8px;padding:2px 5px;background:${this._ztFilterType === t ? '#1e3a5f' : '#111827'};color:${this._ztFilterType === t ? '#60a5fa' : '#6b7280'}" @click=${() => { this._ztFilterType = t; }}>${typeIcons[t]} ${t} (${this._ztEntities.filter(e => e.type === t).length})</button>
          `)}
        </div>
        ${filteredEntities.map(e => html`
          <div style="padding:5px 8px;background:#111827;border-radius:4px;margin-bottom:3px;display:flex;justify-content:space-between;align-items:center">
            <div style="display:flex;align-items:center;gap:4px">
              <span style="font-size:11px">${typeIcons[e.type]}</span>
              <div>
                <div style="font-weight:600;color:#e2e8f0;font-size:10px">${e.name}</div>
                <div style="font-size:8px;color:#6b7280">${e.riskFactors.length > 0 ? e.riskFactors.join(', ') : 'No risk factors'}</div>
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-size:10px;font-weight:700;color:${e.trustScore >= 80 ? '#22c55e' : e.trustScore >= 60 ? '#f59e0b' : '#ef4444'}">${e.trustScore}/100</div>
              <div style="font-size:7px;color:#4b5563">${e.lastVerified.split('T')[1]?.slice(0, 5) || ''}</div>
            </div>
          </div>
        `)}
        <div style="margin-top:8px;padding:6px 8px;background:#111827;border-radius:4px">
          <div style="font-size:10px;font-weight:600;color:#e2e8f0;margin-bottom:4px">Policy Exceptions (${this._ztExceptions.filter(x => x.status === 'active').length})</div>
          ${this._ztExceptions.filter(x => x.status === 'active').map(x => html`
            <div style="padding:3px 6px;background:#0a0c10;border-radius:3px;margin-bottom:2px;font-size:8px;color:#9ca3af;border-left:2px solid #f59e0b">
              ${x.entity}: ${x.reason} | Approved: ${x.approvedBy} | Expires: ${x.expiresAt.split('T')[0]}
            </div>
          `)}
        </div>
      </div>`;
  }


  // === Cloud Security Posture Module ===
  @state() private _cloudProviders: Array<{ id: string; name: string; icon: string; resources: number; compliant: number; nonCompliant: number; severity: { critical: number; high: number; medium: number; low: number }; lastScan: string }> = [
    { id: 'aws', name: 'AWS', icon: '\u2601', resources: 1847, compliant: 1623, nonCompliant: 224, severity: { critical: 12, high: 45, medium: 98, low: 69 }, lastScan: '2026-04-23T09:00:00Z' },
    { id: 'azure', name: 'Azure', icon: '\u{1F4A1}', resources: 923, compliant: 845, nonCompliant: 78, severity: { critical: 5, high: 18, medium: 32, low: 23 }, lastScan: '2026-04-23T08:45:00Z' },
    { id: 'gcp', name: 'GCP', icon: '\u{1F535}', resources: 412, compliant: 389, nonCompliant: 23, severity: { critical: 2, high: 7, medium: 9, low: 5 }, lastScan: '2026-04-23T08:30:00Z' },
  ];
  @state() private _cloudSelectedProvider: string = 'aws';
  @state() private _cloudFindings: Array<{ id: string; provider: string; resource: string; region: string; finding: string; severity: 'critical' | 'high' | 'medium' | 'low'; status: 'open' | 'remediating' | 'resolved'; remediation: string; detectedAt: string }> = [
    { id: 'cf-001', provider: 'aws', resource: 's3-prod-data-bucket', region: 'us-east-1', finding: 'S3 Bucket allows public read access', severity: 'critical', status: 'open', remediation: 'Apply bucket policy to deny public access', detectedAt: '2026-04-22T14:30:00Z' },
    { id: 'cf-002', provider: 'aws', resource: 'rds-prod-postgres', region: 'us-east-1', finding: 'RDS instance not encrypted at rest', severity: 'high', status: 'remediating', remediation: 'Enable encryption via snapshot restore', detectedAt: '2026-04-22T12:00:00Z' },
    { id: 'cf-003', provider: 'aws', resource: 'ec2-prod-web-01', region: 'us-west-2', finding: 'Security group allows SSH from 0.0.0.0/0', severity: 'high', status: 'open', remediation: 'Restrict SSH source to bastion IP', detectedAt: '2026-04-21T09:00:00Z' },
    { id: 'cf-004', provider: 'aws', resource: 'iam-role-lambda-prod', region: 'us-east-1', finding: 'IAM role has excessive permissions (AdministratorAccess)', severity: 'critical', status: 'open', remediation: 'Apply least-privilege policy', detectedAt: '2026-04-20T16:00:00Z' },
    { id: 'cf-005', provider: 'aws', resource: 'vpc-prod-default', region: 'us-east-1', finding: 'VPC flow logs disabled', severity: 'medium', status: 'remediating', remediation: 'Enable VPC flow logs to CloudWatch', detectedAt: '2026-04-19T11:00:00Z' },
    { id: 'cf-006', provider: 'azure', resource: 'storage-acct-prod', region: 'eastus', finding: 'Storage account allows HTTP traffic', severity: 'high', status: 'open', remediation: 'Enable HTTPS-only transfer', detectedAt: '2026-04-22T10:00:00Z' },
    { id: 'cf-007', provider: 'gcp', resource: 'gke-prod-cluster', region: 'us-central1', finding: 'Workload Identity not enabled', severity: 'medium', status: 'open', remediation: 'Enable Workload Identity and migrate service accounts', detectedAt: '2026-04-21T15:00:00Z' },
  ];
  @state() private _cloudDriftAlerts: Array<{ id: string; resource: string; field: string; expected: string; actual: string; detectedAt: string }> = [
    { id: 'cd-001', resource: 'sg-prod-api', field: 'ingress.0.cidr', expected: '10.0.0.0/16', actual: '0.0.0.0/0', detectedAt: '2026-04-23T08:15:00Z' },
    { id: 'cd-002', resource: 's3-config-bucket', field: 'versioning', expected: 'Enabled', actual: 'Suspended', detectedAt: '2026-04-23T07:30:00Z' },
  ];

  private _renderCloudPostureModule(): any {
    const selected = this._cloudProviders.find(p => p.id === this._cloudSelectedProvider) || this._cloudProviders[0];
    const findings = this._cloudFindings.filter(f => f.provider === this._cloudSelectedProvider);
    const driftAlerts = this._cloudDriftAlerts.filter(d => findings.some(f => f.resource === d.resource));
    const sevColors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#6b7280' };
    return html`
      <div style="padding:12px;background:#0a0c10;border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">\u2601 Cloud Security Posture</span>
          <div style="display:flex;gap:3px">
            ${this._cloudProviders.map(p => html`
              <button class="btn btn-sm" style="font-size:8px;padding:3px 6px;background:${this._cloudSelectedProvider === p.id ? '#1e3a5f' : '#111827'};color:${this._cloudSelectedProvider === p.id ? '#60a5fa' : '#6b7280'};border:1px solid ${this._cloudSelectedProvider === p.id ? '#1e3a5f' : '#1f2937'}" @click=${() => { this._cloudSelectedProvider = p.id; }}>
                ${p.icon} ${p.name} (${p.nonCompliant})
              </button>
            `)}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:8px">
          <div style="padding:6px;background:#111827;border-radius:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#e2e8f0">${selected.resources}</div><div style="font-size:7px;color:#6b7280">Resources</div></div>
          <div style="padding:6px;background:#111827;border-radius:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#22c55e">${selected.compliant}</div><div style="font-size:7px;color:#6b7280">Compliant</div></div>
          <div style="padding:6px;background:#111827;border-radius:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#ef4444">${selected.nonCompliant}</div><div style="font-size:7px;color:#6b7280">Non-Compliant</div></div>
          <div style="padding:6px;background:#111827;border-radius:4px;text-align:center"><div style="font-size:14px;font-weight:700;color:#f59e0b">${Math.round(selected.compliant / selected.resources * 100)}%</div><div style="font-size:7px;color:#6b7280">Compliance</div></div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:8px">
          ${Object.entries(selected.severity).map(([sev, count]) => html`
            <div style="display:flex;align-items:center;gap:3px;font-size:8px"><div style="width:6px;height:6px;border-radius:50%;background:${sevColors[sev]}"></div><span style="color:#9ca3af;text-transform:uppercase">${sev}:</span><span style="color:#e2e8f0;font-weight:600">${count}</span></div>
          `)}
        </div>
        ${findings.map(f => html`
          <div style="padding:5px 8px;background:#111827;border-radius:4px;margin-bottom:3px;border-left:3px solid ${sevColors[f.severity]}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:600;color:#e2e8f0;font-size:10px">${f.finding}</span>
              <span style="font-size:8px;padding:1px 5px;border-radius:3px;background:${f.status === 'open' ? '#ef444422' : '#3b82f622'};color:${f.status === 'open' ? '#ef4444' : '#3b82f6'}">${f.status}</span>
            </div>
            <div style="font-size:8px;color:#6b7280;margin-top:2px">${f.resource} (${f.region}) | ${f.remediation}</div>
          </div>
        `)}
        ${driftAlerts.length > 0 ? html`
          <div style="margin-top:6px;padding:6px 8px;background:#1a0a0a;border-radius:4px;border:1px solid #ef444433">
            <div style="font-size:10px;font-weight:600;color:#ef4444;margin-bottom:4px">\u26A0 Configuration Drift Detected (${driftAlerts.length})</div>
            ${driftAlerts.map(d => html`
              <div style="font-size:8px;color:#9ca3af;padding:2px 0">${d.resource}: ${d.field} expected="${d.expected}" actual="${d.actual}"</div>
            `)}
          </div>
        ` : nothing}
      </div>`;
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

  @state() private _bsAle: number = 0;
  @state() private _bsSroi: number = 0;
  @state() private _bsCpi: number = 0;
  @state() private _bsBudgetAlloc: number = 0;
  @state() private _bsCostBenefit: number = 0;

  // Security Economics Calculator
  private bsInitEconomics() {
    this._bsAle = Math.round(2850000 + Math.random() * 4500000);
    this._bsSroi = Math.round(180 + Math.random() * 320);
    this._bsCpi = Math.round(45000 + Math.random() * 120000);
    this._bsBudgetAlloc = Math.round(2500000 + Math.random() * 3000000);
    this._bsCostBenefit = Math.round(220 + Math.random() * 180);
  }

  private _bsCalcAle(): { annual: number; perIncident: number; byCategory: Array<{name: string; value: number}> } {
    const base = this._bsAle;
    const categories = [
      { name: "Data Breach", value: Math.round(base * 0.35) },
      { name: "Ransomware", value: Math.round(base * 0.25) },
      { name: "Insider Threat", value: Math.round(base * 0.18) },
      { name: "Business Disruption", value: Math.round(base * 0.12) },
      { name: "Regulatory Fines", value: Math.round(base * 0.10) }
    ];
    return { annual: base, perIncident: Math.round(base / (3 + Math.floor(Math.random() * 8))), byCategory: categories };
  }

  private _bsCalcSroi(): Array<{year: number; investment: number; savings: number; roi: number}> {
    const baseInv = this._bsSroi * 10000;
    const projections: Array<{year: number; investment: number; savings: number; roi: number}> = [];
    for (let i = 1; i <= 5; i++) {
      const inv = Math.round(baseInv * (1 + 0.08 * i));
      const savings = Math.round(inv * (0.6 + i * 0.25));
      projections.push({ year: 2026 + i, investment: inv, savings, roi: Math.round((savings - inv) / inv * 100) });
    }
    return projections;
  }

  private _bsGetBudgetAlloc(): Array<{category: string; amount: number; pct: number; trend: string}> {
    const total = this._bsBudgetAlloc;
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

  private _bsGetCostBenefit(): Array<{control: string; cost: number; benefit: number; ratio: number; priority: string}> {
    const base = this._bsCostBenefit;
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

  private _bsRenderEconomics() {
    const ale = this._bsCalcAle();
    const roi = this._bsCalcSroi();
    const budget = this._bsGetBudgetAlloc();
    const cb = this._bsGetCostBenefit();
    const cpi = this._bsCpi;
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

  @state() private _bsThreatLevel: any = null;
  @state() private _bsEmergingThreats: any = null;
  @state() private _bsThreatTrends: any = null;
  @state() private _bsSectorRadar: any = null;
  @state() private _bsActorActivity: any = null;

  // Threat Landscape Intelligence
  private bsInitThreatIntel() {
    this._bsThreatLevel = {
      americas: Math.round(50 + Math.random() * 40),
      europe: Math.round(40 + Math.random() * 45),
      asiaPacific: Math.round(55 + Math.random() * 35),
      middleEast: Math.round(45 + Math.random() * 50),
      africa: Math.round(30 + Math.random() * 40)
    };
    this._bsEmergingThreats = [
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
    this._bsThreatTrends = [
      { month: "Jan", phishing: 142, malware: 89, ransomware: 34 },
      { month: "Feb", phishing: 158, malware: 95, ransomware: 38 },
      { month: "Mar", phishing: 175, malware: 102, ransomware: 42 },
      { month: "Apr", phishing: 163, malware: 98, ransomware: 39 }
    ];
    this._bsSectorRadar = [
      { sector: "Financial", risk: 82, trend: "up" },
      { sector: "Healthcare", risk: 78, trend: "up" },
      { sector: "Technology", risk: 71, trend: "stable" },
      { sector: "Government", risk: 85, trend: "up" },
      { sector: "Energy", risk: 68, trend: "down" }
    ];
    this._bsActorActivity = [
      { actor: "APT-29", country: "Russia", activity: 85, targets: "Government" },
      { actor: "Lazarus", country: "DPRK", activity: 72, targets: "Financial" },
      { actor: "APT-41", country: "China", activity: 68, targets: "Technology" },
      { actor: "Fancy Bear", country: "Russia", activity: 64, targets: "Healthcare" },
      { actor: "Charming Kitten", country: "Iran", activity: 58, targets: "Energy" }
    ];
  }

  private _bsRenderThreatIntel() {
    const tl = this._bsThreatLevel;
    const et = this._bsEmergingThreats;
    const sr = this._bsSectorRadar;
    const aa = this._bsActorActivity;
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

  @state() private _bsPolicies: any = null;
  @state() private _bsExceptions: any = null;
  @state() private _bsRiskRegister: any = null;
  @state() private _bsMeetings: any = null;
  @state() private _bsDeadlines: any = null;

  // Security Governance Dashboard
  private bsInitGovernance() {
    this._bsPolicies = [
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
    this._bsExceptions = [
      { id: "EXC-001", policy: "Access Control", reason: "Legacy system", risk: "Medium", expiry: "2026-06-30" },
      { id: "EXC-002", policy: "Encryption", reason: "Performance", risk: "High", expiry: "2026-05-15" },
      { id: "EXC-003", policy: "Password Policy", reason: "Vendor req", risk: "Low", expiry: "2026-08-01" }
    ];
    this._bsRiskRegister = [
      { id: "RSK-001", desc: "Unpatched Exchange", likelihood: 4, impact: 5, owner: "IT Ops" },
      { id: "RSK-002", desc: "Shadow IT SaaS", likelihood: 3, impact: 4, owner: "CISO" },
      { id: "RSK-003", desc: "Privileged Access Creep", likelihood: 3, impact: 5, owner: "IAM Team" },
      { id: "RSK-004", desc: "DR Plan Gaps", likelihood: 2, impact: 5, owner: "BCP Lead" },
      { id: "RSK-005", desc: "Vendor Data Sharing", likelihood: 3, impact: 3, owner: "Legal" }
    ];
    this._bsMeetings = [
      { name: "Security Steering", date: "2026-04-25", attendees: 8, status: "Scheduled" },
      { name: "Risk Committee", date: "2026-04-18", attendees: 6, status: "Completed" },
      { name: "Audit Review", date: "2026-05-02", attendees: 5, status: "Pending" }
    ];
    this._bsDeadlines = [
      { regulation: "SOC 2 Type II", deadline: "2026-06-15", daysLeft: 53, status: "On Track" },
      { regulation: "GDPR Annual Review", deadline: "2026-05-25", daysLeft: 32, status: "At Risk" },
      { regulation: "ISO 27001 Audit", deadline: "2026-07-20", daysLeft: 88, status: "On Track" },
      { regulation: "PCI DSS v4.0", deadline: "2026-08-30", daysLeft: 129, status: "Planning" }
    ];
  }

  private _bsRenderGovernance() {
    const policies = this._bsPolicies;
    const risks = this._bsRiskRegister;
    const deadlines = this._bsDeadlines;
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

  @state() private _bsCriticalAssets: any = null;
  @state() private _bsAssetDeps: any = null;
  @state() private _bsEolAssets: any = null;
  @state() private _bsAssetRisk: any = null;

  // Asset Intelligence
  private bsInitAssetIntel() {
    this._bsCriticalAssets = [
      { name: "Core Banking DB", type: "Database", impact: "Critical", risk: 85, owner: "DBA Team" },
      { name: "Customer API Gateway", type: "Service", impact: "Critical", risk: 72, owner: "Platform" },
      { name: "Active Directory", type: "Infrastructure", impact: "Critical", risk: 68, owner: "IAM" },
      { name: "Data Warehouse", type: "Database", impact: "High", risk: 55, owner: "Analytics" },
      { name: "Email Server", type: "Application", impact: "High", risk: 48, owner: "IT Ops" },
      { name: "CI/CD Pipeline", type: "DevOps", impact: "High", risk: 62, owner: "DevOps" },
      { name: "Payment Processor", type: "Service", impact: "Critical", risk: 78, owner: "Finance IT" }
    ];
    this._bsAssetDeps = [
      { from: "Web App", to: "API Gateway", type: "depends" },
      { from: "API Gateway", to: "Core Banking DB", type: "depends" },
      { from: "API Gateway", to: "Auth Service", type: "depends" },
      { from: "Auth Service", to: "Active Directory", type: "depends" },
      { from: "Payment Processor", to: "Core Banking DB", type: "depends" },
      { from: "Mobile App", to: "API Gateway", type: "depends" }
    ];
    this._bsEolAssets = [
      { name: "Windows Server 2012 R2", count: 12, eolDate: "2023-10-10", risk: "Critical" },
      { name: "Oracle 11g", count: 3, eolDate: "2025-12-31", risk: "High" },
      { name: "Cisco ASA 5505", count: 8, eolDate: "2024-07-15", risk: "High" },
      { name: "CentOS 7", count: 25, eolDate: "2024-06-30", risk: "Medium" }
    ];
    this._bsAssetRisk = { critical: 7, high: 23, medium: 45, low: 128, total: 203 };
  }

  private _bsRenderAssetIntel() {
    const assets = this._bsCriticalAssets;
    const eol = this._bsEolAssets;
    const ar = this._bsAssetRisk;
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

  @state() private _bsUserBaseline: any = null;
  @state() private _bsAnomalyRules: any = null;
  @state() private _bsDataAccess: any = null;
  @state() private _bsInsiderRisk: any = null;

  // Insider Threat Detection
  private bsInitInsiderThreat() {
    this._bsUserBaseline = [
      { user: "admin_jdoe", avgLogins: 18, avgFiles: 45, avgNetwork: 2.3, riskScore: 12 },
      { user: "dev_ssmith", avgLogins: 22, avgFiles: 120, avgNetwork: 5.1, riskScore: 25 },
      { user: "mgr_jchen", avgLogins: 8, avgFiles: 30, avgNetwork: 1.2, riskScore: 8 },
      { user: "analyst_mlee", avgLogins: 15, avgFiles: 85, avgNetwork: 3.4, riskScore: 18 },
      { user: "contractor_abrown", avgLogins: 12, avgFiles: 200, avgNetwork: 8.7, riskScore: 42 }
    ];
    this._bsAnomalyRules = [
      { rule: "After-hours access", enabled: true, triggers: 3, severity: "Medium" },
      { rule: "Mass download detection", enabled: true, triggers: 1, severity: "Critical" },
      { rule: "Privilege escalation", enabled: true, triggers: 0, severity: "High" },
      { rule: "Unusual data transfer", enabled: true, triggers: 5, severity: "High" },
      { rule: "Account sharing pattern", enabled: false, triggers: 2, severity: "Medium" },
      { rule: "Departure data spike", enabled: true, triggers: 0, severity: "Critical" }
    ];
    this._bsDataAccess = [
      { resource: "Customer PII DB", accesses: 1245, anomalous: 18, trend: "up" },
      { resource: "Financial Reports", accesses: 832, anomalous: 5, trend: "stable" },
      { resource: "Source Code Repo", accesses: 2100, anomalous: 32, trend: "up" },
      { resource: "Trade Secrets", accesses: 156, anomalous: 8, trend: "up" }
    ];
    this._bsInsiderRisk = { totalUsers: 2847, monitored: 342, flagged: 18, investigated: 5, confirmed: 1 };
  }

  private _bsRenderInsiderThreat() {
    const baseline = this._bsUserBaseline;
    const rules = this._bsAnomalyRules;
    const ir = this._bsInsiderRisk;
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
        </div>
      </div>`;
  }

  }
declare global { interface HTMLElementTagNameMap { 'sc-baseline-scan': ScBaselineScan; } }
