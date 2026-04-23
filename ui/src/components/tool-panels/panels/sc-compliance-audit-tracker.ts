/**
 * sc-compliance-audit-tracker — Compliance Audit Tracker
 * Multi-framework compliance management with evidence tracking
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Control {
  id: string;
  name: string;
  framework: string;
  category: string;
  status: 'implemented' | 'partial' | 'not-implemented' | 'na';
  evidence: string;
  lastReviewed: string;
  owner: string;
}

interface AuditFinding {
  id: string;
  title: string;
  framework: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'remediating' | 'closed';
  dueDate: string;
  owner: string;
}

interface RemediationTask {
  id: string;
  findingId: string;
  title: string;
  assignee: string;
  status: 'not-started' | 'in-progress' | 'testing' | 'completed';
  priority: 'critical' | 'high' | 'medium' | 'low';
  progress: number;
  dueDate: string;
  evidence: string[];
  notes: string;
}

interface EvidenceItem {
  id: string;
  controlId: string;
  title: string;
  type: 'document' | 'screenshot' | 'log' | 'config' | 'policy';
  uploadedAt: string;
  uploadedBy: string;
  status: 'approved' | 'pending-review' | 'rejected';
  size: string;
}

interface PolicyMapping {
  regulation: string;
  controlRef: string;
  title: string;
  mappedTo: string[];
  status: 'mapped' | 'partial' | 'gap';
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

@customElement('sc-compliance-audit-tracker')
export class ScComplianceAuditTracker extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px; }
    .stat { background: #1f2937; border-radius: 8px; padding: 12px; text-align: center; }
    .sv { font-size: 20px; font-weight: 700; }
    .sl { font-size: 9px; color: #94a3b8; margin-top: 2px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; flex-wrap: wrap; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; color: #94a3b8; }
    .tab:hover { background: #374151; }
    .tab.active { background: #f59e0b; color: #111827; }
    .badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .b-implemented { background: #052e16; color: #86efac; }
    .b-partial { background: #422006; color: #fde047; }
    .b-not-implemented { background: #450a0a; color: #fca5a5; }
    .b-na { background: #1f2937; color: #6b7280; }
    .b-open { background: #450a0a; color: #fca5a5; }
    .b-remediating { background: #422006; color: #fde047; }
    .b-closed { background: #052e16; color: #86efac; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
    .tbl th { text-align: left; padding: 8px; background: #0f172a; color: #94a3b8; font-weight: 600; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #374151; }
    .tbl td { padding: 10px 8px; border-bottom: 1px solid #1f2937; }
    .tbl tr:hover td { background: #1f2937; }
    .compliance-card { background: #1f2937; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .comp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .comp-name { font-weight: 700; font-size: 14px; }
    .comp-score { font-size: 28px; font-weight: 700; }
    .progress-bar { height: 8px; background: #374151; border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .progress-fill { height: 100%; border-radius: 4px; }
    .calendar { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
    .cal-day { aspect-ratio: 1; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; cursor: pointer; }
    .cal-audit { background: #3b82f6; color: white; }
    .cal-review { background: #22c55e; color: white; }
    .cal-today { border: 2px solid #f59e0b; }
    .cal-header { font-size: 9px; color: #6b7280; text-align: center; padding: 4px; }
    .finding-row { background: #0f172a; border-radius: 6px; padding: 10px; margin-bottom: 6px; border-left: 3px solid; }
    .finding-row.critical { border-color: #ef4444; }
    .finding-row.high { border-color: #f97316; }
    .finding-row.medium { border-color: #eab308; }
    .finding-row.low { border-color: #22c55e; }
    .finding-title { font-weight: 600; font-size: 12px; margin-bottom: 4px; }
    .finding-meta { display: flex; gap: 12px; font-size: 10px; color: #6b7280; }
    .rem-task { background: #0f172a; border-radius: 6px; padding: 10px; margin-bottom: 6px; border-left: 3px solid; }
    .rem-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .rem-title { font-weight: 600; font-size: 12px; }
    .rem-meta { display: flex; gap: 10px; font-size: 10px; color: #6b7280; flex-wrap: wrap; }
    .evidence-card { background: #0f172a; border-radius: 6px; padding: 10px; margin-bottom: 6px; display: flex; align-items: center; gap: 10px; }
    .evidence-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
    .evidence-info { flex: 1; }
    .evidence-title { font-size: 12px; font-weight: 600; }
    .evidence-meta { font-size: 10px; color: #6b7280; }
    .mapping-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: #0f172a; border-radius: 6px; margin-bottom: 4px; font-size: 11px; }
    .mapping-reg { width: 70px; font-weight: 700; font-size: 10px; }
    .mapping-ctrl { width: 80px; font-family: monospace; color: #94a3b8; }
    .mapping-arrow { color: #6b7280; }
    .mapping-target { flex: 1; color: #e2e8f0; }
    .timeline-item { display: flex; gap: 12px; padding: 8px 0; position: relative; }
    .timeline-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 3px; }
    .timeline-line { position: absolute; left: 4px; top: 22px; bottom: -8px; width: 2px; background: #374151; }
    .timeline-content { flex: 1; }
    .timeline-title { font-size: 12px; font-weight: 600; }
    .timeline-date { font-size: 10px; color: #6b7280; }
    .approval-row { background: #0f172a; border-radius: 8px; padding: 14px; margin-bottom: 8px; }
    .approval-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .approval-actions { display: flex; gap: 6px; margin-top: 8px; }
    .btn { padding: 6px 14px; border-radius: 6px; border: none; font-size: 11px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #f59e0b; color: #111827; }
    .btn-success { background: #22c55e; color: white; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-secondary { background: #374151; color: #e2e8f0; }
    .form-input { width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #374151; border-radius: 6px; color: #e2e8f0; font-size: 12px; outline: none; }
    .form-input:focus { border-color: #f59e0b; }
    .form-group { margin-bottom: 10px; }
    .form-label { display: block; font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 4px; }
    .heatmap-grid { display: grid; grid-template-columns: 80px repeat(5, 1fr); gap: 2px; font-size: 9px; }
    .heatmap-cell { padding: 6px 4px; text-align: center; border-radius: 3px; font-weight: 600; }
    .sla-bar { display: flex; align-items: center; gap: 12px; background: #1f2937; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
    .sla-indicator { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  
    .risk-transfer-section, .talent-mgmt-section, .vendor-assess-section,
    .policy-engine-section, .metrics-builder-section {
      margin-top: 1.5rem; padding: 1rem; border: 1px solid #2a3a5c; border-radius: 8px;
      background: rgba(15, 23, 42, 0.6);
    }
    .risk-transfer-section h4, .talent-mgmt-section h4, .vendor-assess-section h4,
    .policy-engine-section h4, .metrics-builder-section h4 {
      margin: 0 0 0.75rem; font-size: 0.95rem; color: #60a5fa; border-bottom: 1px solid #1e3a5f; padding-bottom: 0.4rem;
    }
    .risk-transfer-section h5, .talent-mgmt-section h5, .vendor-assess-section h5,
    .policy-engine-section h5, .metrics-builder-section h5 {
      margin: 1rem 0 0.5rem; font-size: 0.85rem; color: #93c5fd;
    }
    .rt-summary-row, .tm-stats-row, .va-stats-row, .pe-stats-row, .mb-canvas-header {
      display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 0.75rem;
    }
    .rt-stat, .tm-stat, .va-stat, .pe-stat { flex: 1; min-width: 120px; padding: 0.5rem; background: rgba(30, 58, 95, 0.5); border-radius: 6px; text-align: center; }
    .rt-label, .tm-label, .va-label, .pe-label { display: block; font-size: 0.7rem; color: #94a3b8; margin-bottom: 0.25rem; }
    .rt-value, .tm-value, .va-value, .pe-value { display: block; font-size: 1.1rem; font-weight: 700; color: #e2e8f0; }
    .rt-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
    .rt-table th, .rt-table td { padding: 0.35rem 0.5rem; border: 1px solid #1e3a5f; text-align: left; }
    .rt-table th { background: #1e3a5f; color: #93c5fd; }
    .status-active { color: #34d399; } .status-pending { color: #fbbf24; } .status-draft { color: #f97316; }
    .status-under-review { color: #60a5fa; }
    .rt-decision-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 0.75rem; }
    .rt-decision-card { padding: 0.6rem; background: rgba(30, 58, 95, 0.4); border-radius: 6px; border: 1px solid #1e3a5f; }
    .rt-risk-name { font-weight: 600; color: #e2e8f0; font-size: 0.8rem; } .rt-category { font-size: 0.7rem; color: #94a3b8; }
    .rt-bar-wrap { display: flex; height: 8px; border-radius: 4px; overflow: hidden; margin: 0.3rem 0; }
    .rt-bar-transfer { background: #3b82f6; } .rt-bar-retain { background: #f59e0b; }
    .rt-bar-labels { display: flex; justify-content: space-between; font-size: 0.65rem; color: #94a3b8; }
    .rt-decision-badge { display: inline-block; padding: 0.15rem 0.5rem; border-radius: 10px; font-size: 0.65rem; font-weight: 600; margin-top: 0.3rem; }
    .rt-decision-badge.transfer { background: rgba(59,130,246,0.2); color: #60a5fa; }
    .rt-decision-badge.partial-transfer { background: rgba(168,85,247,0.2); color: #c084fc; }
    .rt-decision-badge.retain { background: rgba(245,158,11,0.2); color: #fbbf24; }
    .tm-skills-grid { overflow-x: auto; }
    .tm-skills-header, .tm-member-row { display: flex; align-items: center; min-width: 900px; }
    .tm-name-cell { width: 140px; min-width: 140px; padding: 0.3rem; font-size: 0.7rem; color: #e2e8f0; }
    .tm-name-cell small { color: #64748b; }
    .tm-skill-cell, .tm-level-cell { width: 80px; min-width: 80px; text-align: center; padding: 0.3rem; font-size: 0.65rem; border: 1px solid #1e3a5f; }
    .tm-skill-cell { background: #1e3a5f; color: #93c5fd; font-weight: 600; }
    .tm-level-cell { background: rgba(30, 58, 95, 0.3); }
    .level-5 { background: rgba(16,185,129,0.4) !important; color: #34d399; font-weight: 700; }
    .level-4 { background: rgba(59,130,246,0.3) !important; color: #60a5fa; font-weight: 600; }
    .level-3 { background: rgba(168,85,247,0.2) !important; color: #c084fc; }
    .level-2 { background: rgba(245,158,11,0.2) !important; color: #fbbf24; }
    .level-1 { background: rgba(239,68,68,0.2) !important; color: #f87171; }
    .tm-meta-cell { width: 90px; min-width: 90px; text-align: center; font-size: 0.65rem; color: #94a3b8; padding: 0.3rem; }
    .tm-pipeline { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.5rem; }
    .tm-pipe-card { padding: 0.5rem; background: rgba(30,58,95,0.4); border-radius: 6px; border: 1px solid #1e3a5f; }
    .tm-pipe-role { font-weight: 600; font-size: 0.8rem; color: #e2e8f0; }
    .tm-pipe-stage { font-size: 0.7rem; color: #60a5fa; margin: 0.2rem 0; }
    .tm-pipe-info { display: flex; justify-content: space-between; font-size: 0.65rem; color: #94a3b8; }
    .tm-pipe-priority { display: inline-block; padding: 0.1rem 0.4rem; border-radius: 8px; font-size: 0.6rem; font-weight: 600; margin-top: 0.2rem; }
    .priority-critical { background: rgba(239,68,68,0.3); color: #f87171; }
    .priority-high { background: rgba(245,158,11,0.3); color: #fbbf24; }
    .priority-medium { background: rgba(59,130,246,0.3); color: #60a5fa; }
    .va-scorecard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
    .va-vendor-card { padding: 0.6rem; background: rgba(30,58,95,0.4); border-radius: 6px; border: 1px solid #1e3a5f; }
    .va-vendor-name { font-weight: 700; font-size: 0.85rem; color: #e2e8f0; }
    .va-vendor-cat { font-size: 0.7rem; color: #94a3b8; }
    .va-score-bar { position: relative; height: 8px; background: #1e293b; border-radius: 4px; margin: 0.4rem 0; }
    .va-score-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 4px; }
    .va-score-bar span { position: absolute; right: 4px; top: -1px; font-size: 0.65rem; color: #e2e8f0; }
    .va-vendor-meta { display: flex; gap: 0.5rem; font-size: 0.65rem; color: #94a3b8; flex-wrap: wrap; }
    .risk-low { color: #34d399; } .risk-medium { color: #fbbf24; } .risk-high { color: #f87171; }
    .va-renewal { font-size: 0.65rem; color: #60a5fa; margin-top: 0.2rem; }
    .va-dep-table { overflow-x: auto; }
    .va-dep-table table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
    .va-dep-table th, .va-dep-table td { padding: 0.35rem 0.5rem; border: 1px solid #1e3a5f; }
    .va-dep-table th { background: #1e3a5f; color: #93c5fd; }
    .sp-yes { color: #f87171; font-weight: 600; } .sp-no { color: #34d399; }
    .pe-policy-list { max-height: 400px; overflow-y: auto; }
    .pe-policy-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem; border-bottom: 1px solid #1e293b; font-size: 0.7rem; flex-wrap: wrap; }
    .pe-id { color: #64748b; width: 60px; } .pe-name { color: #e2e8f0; width: 180px; font-weight: 600; }
    .pe-ver { color: #94a3b8; width: 40px; } .pe-owner { color: #94a3b8; width: 80px; }
    .pe-next { color: #fbbf24; font-size: 0.65rem; width: 100px; }
    .pe-compliance-bar { position: relative; width: 80px; height: 6px; background: #1e293b; border-radius: 3px; }
    .pe-comp-fill { height: 100%; background: #3b82f6; border-radius: 3px; }
    .pe-compliance-bar span { position: absolute; right: 2px; top: -2px; font-size: 0.6rem; color: #e2e8f0; }
    .pe-exceptions { margin-top: 0.5rem; }
    .pe-exc-row { display: flex; gap: 0.5rem; padding: 0.3rem; border-bottom: 1px solid #1e293b; font-size: 0.7rem; flex-wrap: wrap; }
    .exc-approved { color: #34d399; } .exc-pending { color: #fbbf24; }
    .mb-grid { display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(3, 120px); gap: 0.5rem; margin-bottom: 1rem; }
    .mb-widget { background: rgba(30,58,95,0.5); border: 1px solid #1e3a5f; border-radius: 6px; padding: 0.5rem; display: flex; flex-direction: column; }
    .mb-widget-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.3rem; }
    .mb-widget-title { font-size: 0.7rem; font-weight: 600; color: #e2e8f0; }
    .mb-widget-type { font-size: 0.6rem; color: #64748b; background: rgba(100,116,139,0.2); padding: 0.1rem 0.3rem; border-radius: 4px; }
    .mb-widget-body { flex: 1; display: flex; align-items: center; justify-content: center; }
    .mb-kpi { font-size: 1.5rem; font-weight: 700; color: #60a5fa; }
    .mb-trend { font-size: 0.75rem; color: #34d399; margin-left: 0.3rem; }
    .mb-gauge { width: 80%; height: 10px; background: #1e293b; border-radius: 5px; position: relative; }
    .mb-gauge-fill { height: 100%; background: linear-gradient(90deg, #f59e0b, #3b82f6); border-radius: 5px; }
    .mb-gauge span { position: absolute; right: -30px; top: -2px; font-size: 0.7rem; color: #e2e8f0; }
    .mb-counter { font-size: 2rem; font-weight: 700; color: #e2e8f0; }
    .mb-delta { font-size: 0.8rem; color: #34d399; }
    .mb-placeholder { color: #475569; font-size: 0.75rem; font-style: italic; }
    .mb-catalog { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.4rem; }
    .mb-catalog-item { padding: 0.4rem; background: rgba(30,58,95,0.3); border-radius: 4px; border: 1px solid #1e293b; cursor: grab; }
    .mb-ci-type { font-size: 0.6rem; color: #64748b; } .mb-ci-name { font-size: 0.75rem; color: #e2e8f0; font-weight: 600; }
    .mb-ci-desc { font-size: 0.65rem; color: #94a3b8; } .mb-ci-cat { font-size: 0.6rem; color: #60a5fa; margin-top: 0.1rem; }
    .mb-templates { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
    .mb-tpl-card { padding: 0.5rem; background: rgba(30,58,95,0.3); border-radius: 6px; border: 1px solid #1e3a5f; }
    .mb-tpl-name { font-weight: 600; font-size: 0.8rem; color: #e2e8f0; }
    .mb-tpl-meta { display: flex; gap: 0.5rem; font-size: 0.65rem; color: #94a3b8; }
    .mb-tpl-shared { font-size: 0.65rem; color: #64748b; margin-top: 0.2rem; }
`;

  @state() private _tab: 'overview' | 'soc2' | 'iso' | 'pci' | 'calendar' | 'remediation' | 'evidence' | 'mapping' = 'overview';
  @state() private _searchQuery = '';
  @state() private _selectedFinding: string | null = null;
  @state() private _approvalComment = '';
  @state() private _newEvidenceTitle = '';
  @state() private _newEvidenceType: 'document' | 'screenshot' | 'log' | 'config' | 'policy' = 'document';
  // Enhanced features
  @state() private _auditTrail: Array<{id:string;timestamp:string;action:string;user:string;details:string;category:string}> = [];
  @state() private _auditFilter = 'all';
  @state() private _execHistory: Array<{id:string;timestamp:string;itemsScanned:number;findings:number;criticalCount:number;duration:number;status:string}> = [];
  @state() private _execRunning = false;
  @state() private _execProgress = 0;
  @state() private _settingsTab: string = 'general';
  @state() private _autoInterval = 24;
  @state() private _criticalThreshold = 3;
  @state() private _escalationEmail = '';
  @state() private _webhookUrl = '';
  @state() private _slaTargetHours = 72;
  @state() private _tablePage = 0;
  @state() private _tablePageSize = 10;
  @state() private _showEnhanced = false;


  private _remediationTasks: RemediationTask[] = [
    { id: 'rt-1', findingId: 'f2', title: 'Implement comprehensive logging for payment processing', assignee: 'Payment Team', status: 'in-progress', priority: 'critical', progress: 60, dueDate: '2026-04-30', evidence: ['Logging config draft'], notes: 'Working with Splunk team for SIEM integration' },
    { id: 'rt-2', findingId: 'f1', title: 'Enforce password policy on legacy systems', assignee: 'IT Ops', status: 'in-progress', priority: 'high', progress: 40, dueDate: '2026-05-15', evidence: [], notes: 'Legacy AD domain requires schema update first' },
    { id: 'rt-3', findingId: 'f3', title: 'Document all third-party vendor access', assignee: 'Vendor Mgmt', status: 'not-started', priority: 'medium', progress: 0, dueDate: '2026-06-01', evidence: [], notes: 'Need to coordinate with procurement team' },
    { id: 'rt-4', findingId: 'f2', title: 'Deploy file integrity monitoring on payment servers', assignee: 'Security Ops', status: 'testing', priority: 'critical', progress: 85, dueDate: '2026-04-28', evidence: ['FIM deployment report'], notes: 'OSSEC agents deployed, pending validation' },
    { id: 'rt-5', findingId: 'f1', title: 'Deploy MFA on all legacy system access points', assignee: 'IT Security', status: 'not-started', priority: 'high', progress: 0, dueDate: '2026-05-30', evidence: [], notes: 'RADIUS integration required' },
  ];

  private _evidenceItems: EvidenceItem[] = [
    { id: 'ev-1', controlId: 'c1', title: 'Access Control Policy v3.2', type: 'policy', uploadedAt: '2026-04-10', uploadedBy: 'IT Security', status: 'approved', size: '2.4 MB' },
    { id: 'ev-2', controlId: 'c2', title: 'AWS KMS Configuration Export', type: 'config', uploadedAt: '2026-04-12', uploadedBy: 'Cloud Team', status: 'approved', size: '156 KB' },
    { id: 'ev-3', controlId: 'c3', title: 'Incident Response Plan Draft', type: 'document', uploadedAt: '2026-04-15', uploadedBy: 'SOC Lead', status: 'pending-review', size: '1.8 MB' },
    { id: 'ev-4', controlId: 'c4', title: 'Nessus Scan Report - Q1 2026', type: 'log', uploadedAt: '2026-04-10', uploadedBy: 'Vuln Mgmt', status: 'approved', size: '4.2 MB' },
    { id: 'ev-5', controlId: 'c5', title: 'Pentest Report - Web Application', type: 'document', uploadedAt: '2026-03-28', uploadedBy: 'Red Team', status: 'approved', size: '8.1 MB' },
    { id: 'ev-6', controlId: 'c2', title: 'Encryption Key Rotation Logs', type: 'log', uploadedAt: '2026-04-18', uploadedBy: 'Cloud Team', status: 'pending-review', size: '89 KB' },
  ];

  private _policyMappings: PolicyMapping[] = [
    { regulation: 'GDPR', controlRef: 'Art. 32', title: 'Security of Processing', mappedTo: ['SOC 2 CC6.1', 'ISO 27001 A.10.1'], status: 'mapped' },
    { regulation: 'GDPR', controlRef: 'Art. 33', title: 'Breach Notification', mappedTo: ['SOC 2 CC7.3'], status: 'partial' },
    { regulation: 'HIPAA', controlRef: '164.312(a)', title: 'Access Control', mappedTo: ['SOC 2 CC6.1', 'ISO 27001 A.9.1'], status: 'mapped' },
    { regulation: 'HIPAA', controlRef: '164.312(e)', title: 'Transmission Security', mappedTo: ['ISO 27001 A.10.1'], status: 'mapped' },
    { regulation: 'PCI DSS', controlRef: 'Req 1', title: 'Network Segmentation', mappedTo: ['SOC 2 CC6.6'], status: 'mapped' },
    { regulation: 'PCI DSS', controlRef: 'Req 10', title: 'Audit Logging', mappedTo: ['SOC 2 CC7.2', 'ISO 27001 A.12.4'], status: 'mapped' },
    { regulation: 'NIST CSF', controlRef: 'PR.DS-1', title: 'Data-at-Rest Protection', mappedTo: ['SOC 2 CC6.1', 'ISO 27001 A.10.1'], status: 'mapped' },
    { regulation: 'NIST CSF', controlRef: 'DE.CM-8', title: 'Vulnerability Scanning', mappedTo: ['SOC 2 CC7.1'], status: 'gap' },
  ];

  private _auditTimeline = [
    { date: '2026-01-15', title: 'SOC 2 Type II Kickoff Meeting', color: '#3b82f6' },
    { date: '2026-02-28', title: 'Internal Gap Assessment Completed', color: '#22c55e' },
    { date: '2026-03-15', title: 'Evidence Collection Phase Started', color: '#f59e0b' },
    { date: '2026-04-10', title: 'Remediation Sprint #1 Completed', color: '#22c55e' },
    { date: '2026-04-25', title: 'SOC 2 External Audit (Upcoming)', color: '#ef4444' },
    { date: '2026-05-10', title: 'ISO 27001 Surveillance Audit', color: '#3b82f6' },
    { date: '2026-05-20', title: 'PCI DSS QSA Assessment', color: '#a855f7' },
  ];

  private _frameworks = [
    { name: 'SOC 2', score: 87, implemented: 78, partial: 8, total: 90 },
    { name: 'ISO 27001', score: 92, implemented: 112, partial: 6, total: 125 },
    { name: 'PCI DSS', score: 95, implemented: 42, partial: 2, total: 47 },
    { name: 'HIPAA', score: 88, implemented: 35, partial: 3, total: 40 },
    { name: 'GDPR', score: 82, implemented: 48, partial: 7, total: 60 },
  ];

  private _controls: Control[] = [
    { id: 'c1', name: 'Access Control Policy', framework: 'SOC 2', category: 'Access Control', status: 'implemented', evidence: 'Policy document uploaded', lastReviewed: '2026-03-15', owner: 'IT Security' },
    { id: 'c2', name: 'Encryption at Rest', framework: 'SOC 2', category: 'Data Protection', status: 'implemented', evidence: 'AWS KMS configuration', lastReviewed: '2026-03-20', owner: 'Cloud Team' },
    { id: 'c3', name: 'Incident Response Plan', framework: 'SOC 2', category: 'IR', status: 'partial', evidence: 'Draft in progress', lastReviewed: '2026-04-01', owner: 'SOC Lead' },
    { id: 'c4', name: 'Vulnerability Scanning', framework: 'ISO 27001', category: 'Technical', status: 'implemented', evidence: 'Nessus scan reports', lastReviewed: '2026-04-10', owner: 'Vuln Mgmt' },
    { id: 'c5', name: 'Penetration Testing', framework: 'PCI DSS', category: 'Technical', status: 'implemented', evidence: 'Pentest report Q1 2026', lastReviewed: '2026-03-01', owner: 'Red Team' },
  ];

  private _findings: AuditFinding[] = [
    { id: 'f1', title: 'Password policy not enforced on legacy systems', framework: 'SOC 2', severity: 'high', status: 'remediating', dueDate: '2026-05-15', owner: 'IT Ops' },
    { id: 'f2', title: 'Logging gaps in payment processing system', framework: 'PCI DSS', severity: 'critical', status: 'open', dueDate: '2026-04-30', owner: 'Payment Team' },
    { id: 'f3', title: 'Third-party vendor access not documented', framework: 'ISO 27001', severity: 'medium', status: 'open', dueDate: '2026-06-01', owner: 'Vendor Mgmt' },
    { id: 'f4', title: 'Data retention policy not updated', framework: 'GDPR', severity: 'medium', status: 'closed', dueDate: '2026-04-15', owner: 'Legal' },
  ];

  private _auditCalendar = [
    { date: '2026-04-25', type: 'audit', name: 'SOC 2 External Audit' },
    { date: '2026-05-10', type: 'review', name: 'ISO 27001 Surveillance' },
    { date: '2026-05-20', type: 'audit', name: 'PCI DSS QSA Assessment' },
  ];

  private _getStatusClass(status: string): string {
    return `b-${status}`;
  }

  private _renderOverview() {
    return html`
      <div class="stats">
        <div class="stat"><div class="sv" style="color:#22c55e">89%</div><div class="sl">Avg Compliance</div></div>
        <div class="stat"><div class="sv">315</div><div class="sl">Controls Total</div></div>
        <div class="stat"><div class="sv" style="color:#22c55e">278</div><div class="sl">Implemented</div></div>
        <div class="stat"><div class="sv" style="color:#f97316">${this._findings.filter(f => f.status !== 'closed').length}</div><div class="sl">Open Findings</div></div>
        <div class="stat"><div class="sv" style="color:#ef4444">${this._findings.filter(f => f.severity === 'critical' && f.status !== 'closed').length}</div><div class="sl">Critical</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        ${this._frameworks.map(f => html`
          <div class="compliance-card">
            <div class="comp-header">
              <span class="comp-name">${f.name}</span>
              <span class="comp-score" style="color:${f.score > 90 ? '#22c55e' : f.score > 80 ? '#3b82f6' : '#f97316'}">${f.score}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${f.score}%;background:${f.score > 90 ? '#22c55e' : '#3b82f6'}"></div>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:10px;color:#6b7280;margin-top:6px">
              <span>${f.implemented} implemented</span>
              <span>${f.partial} partial</span>
              <span>${f.total - f.implemented - f.partial} pending</span>
            </div>
          </div>
        `)}
      </div>
      <div class="compliance-card" style="margin-top:12px">
        <div style="font-weight:600;margin-bottom:10px">Recent Audit Findings</div>
        ${this._findings.slice(0, 3).map(f => html`
          <div class="finding-row ${f.severity}">
            <div class="finding-title">${f.title} <span class="badge b-${f.framework.toLowerCase().replace(' ', '-')}">${f.framework}</span></div>
            <div class="finding-meta">
              <span>Severity: ${f.severity}</span>
              <span>Status: ${f.status}</span>
              <span>Due: ${f.dueDate}</span>
              <span>Owner: ${f.owner}</span>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private _renderFrameworkControls(framework: string) {
    const filtered = this._controls.filter(c => c.framework === framework);
    return html`
      <div class="tbl">
        <thead>
          <tr><th>Control</th><th>Category</th><th>Status</th><th>Evidence</th><th>Last Reviewed</th><th>Owner</th></tr>
        </thead>
        <tbody>
          ${filtered.map(c => html`
            <tr>
              <td style="font-weight:600">${c.name}</td>
              <td style="color:#94a3b8">${c.category}</td>
              <td><span class="badge b-${c.status}">${c.status}</span></td>
              <td style="color:#94a3b8;font-size:11px">${c.evidence}</td>
              <td style="color:#6b7280;font-size:11px">${c.lastReviewed}</td>
              <td>${c.owner}</td>
            </tr>
          `)}
        </tbody>
      </div>
      ${filtered.length === 0 ? html`<div style="text-align:center;padding:40px;color:#6b7280">No controls found for ${framework}</div>` : nothing}
    `;
  }

  private _renderCalendar() {
    return html`
      <div style="background:#1f2937;border-radius:8px;padding:16px">
        <div style="font-weight:600;margin-bottom:12px">April 2026 Audit Calendar</div>
        <div class="calendar" style="margin-bottom:12px">
          ${['S','M','T','W','T','F','S'].map(d => html`<div class="cal-header">${d}</div>`)}
          ${Array.from({length: 30}, (_, i) => {
            const day = i + 1;
            const event = this._auditCalendar.find(a => new Date(a.date).getDate() === day);
            return html`<div class="cal-day ${event ? (event.type === 'audit' ? 'cal-audit' : 'cal-review') : ''} ${day === 21 ? 'cal-today' : ''}">${day}</div>`;
          })}
        </div>
        <div style="display:flex;gap:16px;font-size:11px">
          <span><span style="background:#3b82f6;padding:2px 6px;border-radius:3px;color:white">■</span> External Audit</span>
          <span><span style="background:#22c55e;padding:2px 6px;border-radius:3px;color:white">■</span> Internal Review</span>
          <span><span style="border:2px solid #f59e0b;padding:2px 6px;border-radius:3px">■</span> Today</span>
        </div>
      </div>
      <div class="compliance-card" style="margin-top:12px">
        <div style="font-weight:600;margin-bottom:10px">Audit Timeline</div>
        ${this._auditTimeline.map((t, i) => html`<div class="timeline-item">
          ${i < this._auditTimeline.length - 1 ? html`<div class="timeline-line"></div>` : nothing}
          <div class="timeline-dot" style="background:${t.color}"></div>
          <div class="timeline-content">
            <div class="timeline-title">${t.title}</div>
            <div class="timeline-date">${t.date}</div>
          </div>
        </div>`)}
      </div>
    `;
  }

  private _renderRemediation() {
    const tasks = this._searchQuery ? this._remediationTasks.filter(t => t.title.toLowerCase().includes(this._searchQuery.toLowerCase())) : this._remediationTasks;
    const notStarted = this._remediationTasks.filter(t => t.status === 'not-started').length;
    const inProgress = this._remediationTasks.filter(t => t.status === 'in-progress').length;
    const testing = this._remediationTasks.filter(t => t.status === 'testing').length;
    const completed = this._remediationTasks.filter(t => t.status === 'completed').length;
    const total = this._remediationTasks.length || 1;
    return html`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="stitle">Remediation Tracker</div>
        <div style="display:flex;gap:6px">
          <span class="badge b-not-implemented">Not Started: ${notStarted}</span>
          <span class="badge b-remediating">In Progress: ${inProgress}</span>
          <span class="badge b-partial">Testing: ${testing}</span>
          <span class="badge b-implemented">Completed: ${completed}</span>
        </div>
      </div>
      <div class="progress-bar" style="margin-bottom:14px"><div class="progress-fill" style="width:${(completed / total) * 100}%;background:#22c55e"></div></div>
      <div style="display:flex;gap:4px;margin-bottom:12px">
        <input class="form-input" style="flex:1" type="text" placeholder="Search remediation tasks..." .value=${this._searchQuery} @input=${(e: Event) => { this._searchQuery = (e.target as HTMLInputElement).value; }}>
      </div>
      ${tasks.map(t => {
        const statusColor = t.status === 'completed' ? '#22c55e' : t.status === 'in-progress' ? '#3b82f6' : t.status === 'testing' ? '#f59e0b' : '#6b7280';
        const prioColor = t.priority === 'critical' ? '#ef4444' : t.priority === 'high' ? '#f97316' : t.priority === 'medium' ? '#eab308' : '#22c55e';
        return html`<div class="rem-task" style="border-left-color:${prioColor}">
          <div class="rem-header">
            <span class="rem-title">${t.title}</span>
            <span class="badge" style="background:${statusColor}20;color:${statusColor}">${t.status.replace('-', ' ')}</span>
          </div>
          <div class="rem-meta">
            <span>Assignee: ${t.assignee}</span><span>Due: ${t.dueDate}</span><span>Finding: ${t.findingId}</span>
          </div>
          <div style="margin:6px 0"><div class="progress-bar"><div class="progress-fill" style="width:${t.progress}%;background:${statusColor}"></div></div><div style="font-size:9px;color:#6b7280;margin-top:2px">${t.progress}%</div></div>
          ${t.notes ? html`<div style="font-size:10px;color:#94a3b8;font-style:italic;margin-top:4px">${t.notes}</div>` : nothing}
          ${t.evidence.length > 0 ? html`<div style="font-size:10px;color:#6b7280;margin-top:4px">Evidence: ${t.evidence.join(', ')}</div>` : nothing}
        </div>`;
      })}
      <div class="compliance-card" style="margin-top:12px">
        <div style="font-weight:600;margin-bottom:8px">Approval Queue</div>
        ${this._remediationTasks.filter(t => t.status === 'testing').map(t => html`<div class="approval-row">
          <div class="approval-header">
            <div><div style="font-size:12px;font-weight:600">${t.title}</div><div style="font-size:10px;color:#6b7280">Assignee: ${t.assignee} | Due: ${t.dueDate}</div></div>
          </div>
          <div class="form-group"><label class="form-label">Review Comment</label><input class="form-input" type="text" placeholder="Add review comments..." .value=${this._approvalComment} @input=${(e: Event) => { this._approvalComment = (e.target as HTMLInputElement).value; }}></div>
          <div class="approval-actions">
            <button class="btn btn-success" @click=${() => { this._remediationTasks = this._remediationTasks.map(r => r.id === t.id ? { ...r, status: 'completed' as const, progress: 100 } : r); }}>Approve</button>
            <button class="btn btn-secondary" @click=${() => { this._remediationTasks = this._remediationTasks.map(r => r.id === t.id ? { ...r, status: 'in-progress' as const } : r); }}>Request Changes</button>
          </div>
        </div>`)}
        ${this._remediationTasks.filter(t => t.status === 'testing').length === 0 ? html`<div style="text-align:center;padding:20px;color:#6b7280;font-size:12px">No items pending approval</div>` : nothing}
      </div>
    `;
  }

  private _renderEvidence() {
    const typeIcons: Record<string, string> = { document: '\uD83D\uDCC4', screenshot: '\uD83D\uDCF7', log: '\uD83D\uDDC2', config: '\u2699\uFE0F', policy: '\uD83D\uDCDC' };
    const typeColors: Record<string, string> = { document: '#3b82f6', screenshot: '#a855f7', log: '#f97316', config: '#06b6d4', policy: '#22c55e' };
    const approved = this._evidenceItems.filter(e => e.status === 'approved').length;
    const pending = this._evidenceItems.filter(e => e.status === 'pending-review').length;
    return html`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div class="stitle">Evidence Repository (${this._evidenceItems.length} items)</div>
        <div style="display:flex;gap:6px">
          <span class="badge b-implemented">Approved: ${approved}</span>
          <span class="badge b-remediating">Pending: ${pending}</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <input class="form-input" style="flex:1" type="text" placeholder="Title..." .value=${this._newEvidenceTitle} @input=${(e: Event) => { this._newEvidenceTitle = (e.target as HTMLInputElement).value; }}>
        <select class="form-input" style="width:120px" .value=${this._newEvidenceType} @change=${(e: Event) => { this._newEvidenceType = (e.target as HTMLSelectElement).value as EvidenceItem['type']; }}>
          <option value="document">Document</option><option value="screenshot">Screenshot</option><option value="log">Log</option><option value="config">Config</option><option value="policy">Policy</option>
        </select>
        <button class="btn btn-primary" @click=${() => { if (this._newEvidenceTitle.trim()) { this._evidenceItems = [{ id: 'ev-' + Date.now(), controlId: 'c1', title: this._newEvidenceTitle.trim(), type: this._newEvidenceType, uploadedAt: new Date().toISOString().split('T')[0], uploadedBy: 'Current User', status: 'pending-review', size: '0 KB' }, ...this._evidenceItems]; this._newEvidenceTitle = ''; } }>Upload</button>
      </div>
      ${this._evidenceItems.map(e => html`<div class="evidence-card">
        <div class="evidence-icon" style="background:${typeColors[e.type]}20;color:${typeColors[e.type]}">${typeIcons[e.type]}</div>
        <div class="evidence-info">
          <div class="evidence-title">${e.title}</div>
          <div class="evidence-meta">Control: ${e.controlId} | ${e.uploadedBy} | ${e.uploadedAt} | ${e.size}</div>
        </div>
        <span class="badge ${e.status === 'approved' ? 'b-implemented' : e.status === 'pending-review' ? 'b-remediating' : 'b-not-implemented'}">${e.status.replace('-', ' ')}</span>
      </div>`)}
    `;
  }

  private _renderMapping() {
    const frameworks = ['GDPR', 'HIPAA', 'PCI DSS', 'NIST CSF'];
    const fwColors: Record<string, string> = { 'GDPR': '#3b82f6', 'HIPAA': '#22c55e', 'PCI DSS': '#ef4444', 'NIST CSF': '#a855f7' };
    return html`
      <div class="stitle" style="margin-bottom:12px">Cross-Framework Policy Mapping</div>
      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
        ${frameworks.map(fw => html`<span class="badge" style="background:${fwColors[fw]}20;color:${fwColors[fw]}">${fw}: ${this._policyMappings.filter(m => m.regulation === fw).length} controls</span>`)}
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:14px">
        <div class="heatmap-grid" style="margin-bottom:8px">
          <div style="font-weight:600;color:#94a3b8">Regulation</div>
          <div style="text-align:center;font-weight:600;color:#94a3b8">SOC 2</div>
          <div style="text-align:center;font-weight:600;color:#94a3b8">ISO 27001</div>
          <div style="text-align:center;font-weight:600;color:#94a3b8">PCI DSS</div>
          <div style="text-align:center;font-weight:600;color:#94a3b8">HIPAA</div>
          <div style="text-align:center;font-weight:600;color:#94a3b8">NIST</div>
          ${this._policyMappings.map(m => {
            const soc = m.mappedTo.some(t => t.startsWith('SOC')) ? 'mapped' : m.status === 'partial' ? 'partial' : 'gap';
            const iso = m.mappedTo.some(t => t.startsWith('ISO')) ? 'mapped' : m.status === 'partial' ? 'partial' : 'gap';
            const pci = m.mappedTo.some(t => t.startsWith('PCI')) ? 'mapped' : 'gap';
            const hip = m.mappedTo.some(t => t.startsWith('HIPAA')) ? 'mapped' : 'gap';
            const nist = m.mappedTo.some(t => t.startsWith('NIST')) ? 'mapped' : 'gap';
            const cellColor = (s: string) => s === 'mapped' ? '#052e16' : s === 'partial' ? '#422006' : '#450a0a';
            const textColor = (s: string) => s === 'mapped' ? '#86efac' : s === 'partial' ? '#fde047' : '#fca5a5';
            return html`<div class="mapping-reg" style="color:${fwColors[m.regulation]}">${m.regulation}</div>
              <div class="heatmap-cell" style="background:${cellColor(soc)};color:${textColor(soc)}">${soc === 'mapped' ? '\u2713' : soc === 'partial' ? '~' : '\u2717'}</div>
              <div class="heatmap-cell" style="background:${cellColor(iso)};color:${textColor(iso)}">${iso === 'mapped' ? '\u2713' : iso === 'partial' ? '~' : '\u2717'}</div>
              <div class="heatmap-cell" style="background:${cellColor(pci)};color:${textColor(pci)}">${pci === 'mapped' ? '\u2713' : pci === 'partial' ? '~' : '\u2717'}</div>
              <div class="heatmap-cell" style="background:${cellColor(hip)};color:${textColor(hip)}">${hip === 'mapped' ? '\u2713' : hip === 'partial' ? '~' : '\u2717'}</div>
              <div class="heatmap-cell" style="background:${cellColor(nist)};color:${textColor(nist)}">${nist === 'mapped' ? '\u2713' : nist === 'partial' ? '~' : '\u2717'}</div>`;
          })}
        </div>
        <div style="display:flex;gap:12px;font-size:9px;color:#6b7280;margin-top:8px">
          <span style="color:#86efac">\u2713 Mapped</span><span style="color:#fde047">~ Partial</span><span style="color:#fca5a5">\u2717 Gap</span>
        </div>
      </div>
      <div class="compliance-card" style="margin-top:12px">
        <div style="font-weight:600;margin-bottom:8px">Detailed Mappings</div>
        ${this._policyMappings.map(m => html`<div class="mapping-row">
          <span class="mapping-reg" style="color:${fwColors[m.regulation]}">${m.regulation}</span>
          <span class="mapping-ctrl">${m.controlRef}</span>
          <span style="flex:1;color:#e2e8f0;font-size:10px">${m.title}</span>
          <span class="mapping-arrow">\u2192</span>
          <span class="mapping-target">${m.mappedTo.join(', ')}</span>
          <span class="badge ${m.status === 'mapped' ? 'b-implemented' : m.status === 'partial' ? 'b-partial' : 'b-not-implemented'}">${m.status}</span>
        </div>`)}
      </div>
    `;
  }

  private _renderExportButton() {
    return html`<div style="display:flex;gap:6px;margin-bottom:12px">
      <button class="btn btn-secondary" @click=${() => { const data = { controls: this._controls, findings: this._findings, tasks: this._remediationTasks, evidence: this._evidenceItems }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'compliance-export.json'; a.click(); URL.revokeObjectURL(url); }}>Export JSON</button>
      <button class="btn btn-secondary" @click=${() => { const headers = ['ID','Name','Framework','Category','Status','Evidence','Owner']; const rows = this._controls.map(c => [c.id,c.name,c.framework,c.category,c.status,c.evidence,c.owner]); const csv = [headers.join(','),...rows.map(r=>r.map(v=>'"'+v+'"').join(','))].join('\n'); const blob = new Blob([csv],{type:'text/csv'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='compliance-controls.csv'; a.click(); URL.revokeObjectURL(url); }}>Export CSV</button>
    </div>`;
  }


    .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; }
    .kpi-card { background: #0f172a; border-radius: 8px; padding: 12px; border-left: 3px solid; }
    .kpi-card-title { font-size: 10px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; }
    .kpi-card-value { font-size: 20px; font-weight: 700; }
    .kpi-card-change { font-size: 10px; margin-top: 4px; }
    .kpi-change-up { color: #22c55e; }
    .kpi-change-down { color: #ef4444; }
    .rec-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; }
    .rec-priority { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .rec-text { flex: 1; font-size: 11px; }
    .rec-meta { font-size: 10px; color: #6b7280; }
    .status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 4px; }
  `;

  private _kpiCards = [
    { title: 'Primary KPI', value: '92%', change: '+5%', positive: true, color: '#22c55e' },
    { title: 'Secondary KPI', value: '78%', change: '+3%', positive: true, color: '#3b82f6' },
    { title: 'Risk Indicator', value: '12', change: '-2', positive: true, color: '#f97316' },
    { title: 'Compliance Score', value: '95%', change: '+1%', positive: true, color: '#06b6d4' },
  ];

  private _recommendations = [
    { priority: '#ef4444', text: 'Address 3 critical findings identified in latest assessment', meta: 'Due: 2026-04-30 | Owner: Security Team' },
    { priority: '#f97316', text: 'Complete semi-annual review for all Compliance Audit Tracker items', meta: 'Due: 2026-05-15 | Owner: Compliance' },
    { priority: '#eab308', text: 'Update policies to reflect recent regulatory changes', meta: 'Due: 2026-06-01 | Owner: Legal' },
    { priority: '#22c55e', text: 'Schedule next quarterly review with stakeholders', meta: 'Due: 2026-06-15 | Owner: PMO' },
  ];
  private _addAudit(category: string, details: string): void {
    this._auditTrail = [{ id: 'a-' + Date.now(), timestamp: new Date().toISOString(), action: category, user: 'Current User', details, category }, ...this._auditTrail].slice(0, 50);
  }

  private _runScanWithHistory(): void {
    this._execRunning = true;
    this._execProgress = 0;
    this._addAudit('scan', 'Starting analysis');
    const record: any = { id: 'ex-' + Date.now(), timestamp: new Date().toISOString(), itemsScanned: 0, findings: 0, criticalCount: 0, duration: 0, status: 'running' };
    const start = Date.now();
    const iv = setInterval(() => {
      this._execProgress = Math.min(this._execProgress + 12, 100);
      record.duration = Math.round((Date.now() - start) / 1000);
      if (this._execProgress >= 100) {
        clearInterval(iv);
        record.status = 'success';
        record.itemsScanned = this._items.length;
        record.findings = this._items.filter((x: any) => x.severity && x.severity !== 'low').length;
        record.criticalCount = this._items.filter((x: any) => x.severity === 'critical').length;
        this._execHistory = [record, ...this._execHistory].slice(0, 20);
        this._execRunning = false;
        this._addAudit('scan', 'Scan completed: ' + record.findings + ' findings');
      }
    }, 200);
  }

  private _renderAuditPanel(): any {
    const filtered = this._auditFilter === 'all' ? this._auditTrail : this._auditTrail.filter((e: any) => e.category === this._auditFilter);
    return html`<div>
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
        ${['all', 'scan', 'review', 'config', 'export'].map((f: string) => html`<button class="btn btn-sm ${this._auditFilter === f ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._auditFilter = f; }}>${f}</button>`)}
      </div>
      <div style="max-height:400px;overflow-y:auto">
        ${filtered.map((e: any) => html`<div style="display:flex;gap:10px;padding:8px 10px;background:#0f172a;border-radius:6px;margin-bottom:4px;font-size:12px">
          <span style="padding:2px 6px;border-radius:3px;font-size:9px;font-weight:600;background:${((({scan:'#3b82f6',review:'#f59e0b',config:'#8b5cf6',export:'#22c55e'}}) as any)[e.category]) || '#374151'}20;color:${((({scan:'#60a5fa',review:'#fbbf24',config:'#a78bfa',export:'#34d399'}}) as any)[e.category]) || '#9ca3af'}">${e.category}</span>
          <div style="flex:1"><div style="color:#e2e8f0;font-weight:500">${e.details}</div><div style="font-size:10px;color:#6b7280;margin-top:2px">${e.user} | ${new Date(e.timestamp).toLocaleString()}</div></div>
        </div>`)}
      </div>
    </div>`;
  }

  private _renderExecHistory(): any {
    if (this._execHistory.length === 0) return html`<div class="empty-state"><div>No scan history</div></div>`;
    const sorted = [...this._execHistory].sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));
    const totalPages = Math.max(1, Math.ceil(sorted.length / this._tablePageSize));
    const start = this._tablePage * this._tablePageSize;
    const records = sorted.slice(start, start + this._tablePageSize);
    return html`<div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px">
        <span style="font-weight:600;font-size:12px;color:#94a3b8">History (${this._execHistory.length})</span>
        <select style="background:#1f2937;border:1px solid #374151;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:11px" .value=${String(this._tablePageSize)} @change=${(e: Event) => { this._tablePageSize = parseInt((e.target as HTMLSelectElement).value); this._tablePage = 0; }}>
          <option value="5">5/page</option><option value="10">10/page</option><option value="25">25/page</option>
        </select>
      </div>
      ${this._execRunning ? html`<div class="progress-bar"><div class="progress-fill" style="width:${this._execProgress}%"></div></div>` : nothing}
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Time</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Items</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Findings</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Duration</th><th style="text-align:left;padding:8px;background:#0f172a;color:#94a3b8;border-bottom:1px solid #374151">Status</th></tr></thead>
        <tbody>${records.map((r: any) => html`<tr style="border-bottom:1px solid #1f2937">
          <td style="padding:7px 8px;font-size:11px;color:#6b7280">${new Date(r.timestamp).toLocaleString()}</td>
          <td style="padding:7px 8px">${r.itemsScanned}</td>
          <td style="padding:7px 8px;color:#f59e0b;font-weight:700">${r.findings}</td>
          <td style="padding:7px 8px">${r.duration}s</td>
          <td style="padding:7px 8px"><span style="font-size:10px;padding:2px 8px;border-radius:4px;font-weight:600;background:${r.status === 'success' ? '#22c55e20' : '#ef444420'};color:${r.status === 'success' ? '#34d399' : '#f87171'}">${r.status}</span></td>
        </tr>`)}</tbody>
      </table>
      ${totalPages > 1 ? html`<div style="display:flex;gap:4px;justify-content:center;margin-top:8px">${Array.from({ length: totalPages }, (_: any, i: number) => html`<button class="btn btn-sm ${this._tablePage === i ? 'btn-primary' : 'btn-secondary'}" style="padding:4px 10px" @click=${() => { this._tablePage = i; }}>${i + 1}</button>`)}
      </div>` : nothing}
    </div>`;
  }

  private _renderSettingsPanel(): any {
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px">
      <div style="font-weight:700;font-size:14px;margin-bottom:12px">Settings</div>
      <div style="display:flex;gap:4px;margin-bottom:12px">
        ${['general', 'thresholds', 'integrations'].map((t: string) => html`<button class="btn btn-sm ${this._settingsTab === t ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = t; }}>${t}</button>`)}
      </div>
      ${this._settingsTab === 'general' ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Auto-scan Interval</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="168" .value=${String(this._autoInterval)} @input=${(e: Event) => { this._autoInterval = parseInt((e.target as HTMLInputElement).value); } style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._autoInterval}h</span></div></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">SLA Target</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="720" .value=${String(this._slaTargetHours)} @input=${(e: Event) => { this._slaTargetHours = parseInt((e.target as HTMLInputElement).value); } style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._slaTargetHours}h</span></div></div>
      </div>` : nothing}
      ${this._settingsTab === 'thresholds' ? html`<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Critical Threshold</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="20" .value=${String(this._criticalThreshold)} @input=${(e: Event) => { this._criticalThreshold = parseInt((e.target as HTMLInputElement).value); } style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._criticalThreshold}</span></div></div>` : nothing}
      ${this._settingsTab === 'integrations' ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Escalation Email</div><input type="email" .value=${this._escalationEmail} @input=${(e: Event) => { this._escalationEmail = (e.target as HTMLInputElement).value; } style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Webhook URL</div><input type="url" .value=${this._webhookUrl} @input=${(e: Event) => { this._webhookUrl = (e.target as HTMLInputElement).value; } style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
        <div style="grid-column:1/-1;display:flex;gap:8px;margin-top:8px">
          <button class="btn btn-primary btn-sm" @click=${() => { this._addAudit('config', 'Settings saved'); }}>Save</button>
          <button class="btn btn-secondary btn-sm" @click=${() => { this._addAudit('config', 'Config exported'); }}>Export</button>
        </div>
      </div>` : nothing}
    </div>`;
  }

  private _renderRiskGauge(): any {
    const riskDist: any = { critical: 0, high: 0, medium: 0, low: 0 };
    this._items.forEach((item: any) => { const r = item.severity; if (riskDist[r] !== undefined) riskDist[r]++; else riskDist.medium++; });
    const total = this._items.length || 1;
    const score = Math.round(((riskDist.critical * 10 + riskDist.high * 7 + riskDist.medium * 4 + riskDist.low * 1) / (total * 10)) * 100);
    const scoreColor = score >= 70 ? '#ef4444' : score >= 40 ? '#f59e0b' : '#22c55e';
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Risk Overview</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:${scoreColor}">${score}</div><div style="font-size:9px;color:#6b7280">Risk Score</div></div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:#ef4444">${riskDist.critical}</div><div style="font-size:9px;color:#6b7280">Critical</div></div>
        <div style="background:#0f172a;border-radius:8px;padding:10px;text-align:center"><div style="font-size:22px;font-weight:700;color:#f59e0b">${riskDist.high}</div><div style="font-size:9px;color:#6b7280">High Risk</div></div>
      </div>
      <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;gap:1px;margin-bottom:6px">
        <div style="width:${(riskDist.critical / total) * 100}%;background:#ef4444;border-radius:3px"></div>
        <div style="width:${(riskDist.high / total) * 100}%;background:#f97316"></div>
        <div style="width:${(riskDist.medium / total) * 100}%;background:#eab308"></div>
        <div style="width:${(riskDist.low / total) * 100}%;background:#22c55e;border-radius:3px"></div>
      </div>
      <div style="display:flex;gap:12px;font-size:9px;color:#6b7280">
        <span><span style="display:inline-block;width:8px;height:8px;background:#ef4444;border-radius:2px;margin-right:3px"></span>Critical</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:#f97316;border-radius:2px;margin-right:3px"></span>High</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:#eab308;border-radius:2px;margin-right:3px"></span>Medium</span>
        <span><span style="display:inline-block;width:8px;height:8px;background:#22c55e;border-radius:2px;margin-right:3px"></span>Low</span>
      </div>
    </div>`;
  }

  private _renderBarChart(): any {
    const data = this._items.slice(0, 10).map((item: any, i: number) => ({ name: (item.name || item.title || item.id || 'Item ' + i).substring(0, 8), score: ({critical: 10, high: 7, medium: 4, low: 1}}}} as any)[item.severity] || 2, risk: item.severity || 'medium' }));
    const w = 380, h = 160;
    const bw = Math.max(18, Math.floor((w - 50) / data.length) - 4);
    const colors: any = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Score Chart</div>
      <svg width="100%" viewBox="0 0 ${w} ${h}" style="max-width:440px">
        ${[0,5,10].map(v => html`<line x1="35" y1="${h - 20 - (v / 10) * (h - 45)}" x2="${w - 10}" y2="${h - 20 - (v / 10) * (h - 45)}" stroke="#1f2937" stroke-width="0.5"/><text x="30" y="${h - 18 - (v / 10) * (h - 45)}" text-anchor="end" fill="#6b7280" font-size="7">${v}</text>`)}
        ${data.map((d: any, i: number) => html`<g><rect x="${40 + i * (bw + 4)}" y="${h - 20 - (d.score / 10) * (h - 45)}" width="${bw}" height="${(d.score / 10) * (h - 45)}" fill="${(colors[d.risk] || '#8b5cf6')}60" rx="2" stroke="${colors[d.risk] || '#8b5cf6'}" stroke-width="0.5"/><text x="${40 + i * (bw + 4) + bw / 2}" y="${h - 6}" text-anchor="middle" fill="#6b7280" font-size="6" transform="rotate(-25, ${40 + i * (bw + 4) + bw / 2}, ${h - 6})">${d.name}</text></g>`)}
        <line x1="35" y1="${h - 20}" x2="${w - 10}" y2="${h - 20}" stroke="#374151" stroke-width="1"/>
      </svg>
    </div>`;
  }

  private _renderEnhancedSection(): any {
    if (!this._showEnhanced) return nothing;
    return html`<div style="margin-top:16px;border-top:1px solid #374151;padding-top:16px">
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #374151;padding-bottom:8px">
        <button class="btn btn-sm ${this._settingsTab === 'audit' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'audit'; }}>Audit</button>
        <button class="btn btn-sm ${this._settingsTab === 'history' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'history'; }}>History</button>
        <button class="btn btn-sm ${this._settingsTab === 'settings' ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._settingsTab = 'settings'; }}>Settings</button>
      </div>
      ${this._settingsTab === 'audit' ? this._renderAuditPanel() : ''}
      ${this._settingsTab === 'history' ? this._renderExecHistory() : ''}
      ${this._settingsTab === 'settings' ? this._renderSettingsPanel() : ''}
      <div style="margin-top:12px">
        ${this._renderRiskGauge()}
        ${this._renderBarChart()}
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <div style="flex:1;padding:8px;border-radius:6px;border:1px solid #374151;background:#1f2937;color:#94a3b8;font-size:11px;cursor:pointer;text-align:center" @click=${() => { this._addAudit('export', 'Report exported'); }}>Export Report</div>
        <div style="flex:1;padding:8px;border-radius:6px;border:1px solid #374151;background:#1f2937;color:#94a3b8;font-size:11px;cursor:pointer;text-align:center" @click=${this._runScanWithHistory}>Run Analysis</div>
      </div>
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid #374151;display:flex;justify-content:space-between;font-size:10px;color:#6b7280">
        <span>Last scan: ${this._execHistory.length > 0 ? new Date(this._execHistory[0].timestamp).toLocaleString() : 'Never'}</span>
        <span>${this._items.length} items | ${this._auditTrail.length} audit entries</span>
      </div>
    </div>`;
  }


  private _workflowTasks: WorkflowTask[] = [
    { id: 'wt-1', title: 'Review Compliance Audit Tracker finding #1', status: 'active', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T12:00:00Z', priority: 'p1', createdAt: '2026-04-23T00:00:00Z', completedAt: null },
    { id: 'wt-2', title: 'Remediate critical endpoint misconfiguration', status: 'pending', assignee: 'security-eng', blockedBy: ['wt-1'], slaDeadline: '2026-04-23T16:00:00Z', priority: 'p1', createdAt: '2026-04-23T02:00:00Z', completedAt: null },
    { id: 'wt-3', title: 'Update Compliance Audit Tracker detection rules', status: 'blocked', assignee: 'soc-tier2', blockedBy: ['wt-2'], slaDeadline: '2026-04-24T00:00:00Z', priority: 'p2', createdAt: '2026-04-23T03:00:00Z', completedAt: null },
    { id: 'wt-4', title: 'Generate compliance report', status: 'pending', assignee: 'compliance', blockedBy: [], slaDeadline: '2026-04-24T08:00:00Z', priority: 'p3', createdAt: '2026-04-23T04:00:00Z', completedAt: null },
    { id: 'wt-5', title: 'Validate remediation for finding #6', status: 'completed', assignee: 'security-eng', blockedBy: [], slaDeadline: '2026-04-23T10:00:00Z', priority: 'p2', createdAt: '2026-04-22T18:00:00Z', completedAt: '2026-04-23T08:00:00Z' },
    { id: 'wt-6', title: 'Notify stakeholders of findings', status: 'completed', assignee: 'manager', blockedBy: [], slaDeadline: '2026-04-23T06:00:00Z', priority: 'p3', createdAt: '2026-04-22T20:00:00Z', completedAt: '2026-04-23T04:00:00Z' },
    { id: 'wt-7', title: 'Schedule follow-up scan', status: 'pending', assignee: 'ops', blockedBy: ['wt-2'], slaDeadline: '2026-04-25T00:00:00Z', priority: 'p4', createdAt: '2026-04-23T05:00:00Z', completedAt: null },
    { id: 'wt-8', title: 'Archive resolved Compliance Audit Tracker findings', status: 'failed', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T08:00:00Z', priority: 'p4', createdAt: '2026-04-22T22:00:00Z', completedAt: null },
  ];

  private _executionHistory: ExecutionRecord[] = [
    {
      id: 'exec-1', name: 'Compliance Audit Tracker Full Assessment Run', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:12:00Z', status: 'success',
      steps: [
        { id: 's1', name: 'Validate Scope', status: 'success', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:00:30Z', duration: 30, output: 'Scope validated: 142 targets' },
        { id: 's2', name: 'Collect Evidence', status: 'success', startedAt: '2026-04-22T10:00:30Z', completedAt: '2026-04-22T10:06:00Z', duration: 330, output: '1,847 events collected from 12 sources' },
        { id: 's3', name: 'Analyze Patterns', status: 'success', startedAt: '2026-04-22T10:06:00Z', completedAt: '2026-04-22T10:10:00Z', duration: 240, output: '23 patterns identified, 7 correlated' },
        { id: 's4', name: 'Generate Report', status: 'success', startedAt: '2026-04-22T10:10:00Z', completedAt: '2026-04-22T10:12:00Z', duration: 120, output: 'Report generated: 10 findings, 3 critical' },
      ],
    },
    {
      id: 'exec-2', name: 'Compliance Audit Tracker Delta Scan', startedAt: '2026-04-23T02:00:00Z', completedAt: '2026-04-23T02:05:00Z', status: 'failed',
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
      id: 'exec-' + Date.now(), name: 'Compliance Audit Tracker Assessment ' + new Date().toISOString().slice(0, 10), startedAt: new Date().toISOString(), completedAt: null, status: 'running', steps,
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
        ` : html`<div class="empty-state">Click "Run Assessment" to start the Compliance Audit Tracker analysis pipeline</div>`}
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
              const a = document.createElement('a'); a.href = url; a.download = 'compliance-audit-tracker-config.json'; a.click();
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
          <input class="search-box" type="text" placeholder="Add a comment..." style="min-width:auto;flex:1;" id="compliance-audit-tracker-comment-input" />
          <button class="btn primary" @click=${() => {
            const input = this.shadowRoot?.querySelector('#compliance-audit-tracker-comment-input') as HTMLInputElement;
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

  // === Compliance Evidence Manager Module ===
  @state() private _evidenceControls = [
    { id: 'EC-001', control: 'AC-01 Access Control Policy', framework: 'NIST 800-53',
      status: 'compliant', evidenceCount: 5, lastReview: '2026-01-10', nextReview: '2026-04-10',
      evidenceItems: [
        { id: 'EV-001a', name: 'Access Control Policy Document', type: 'document', status: 'approved', expiry: '2027-01-10' },
        { id: 'EV-001b', name: 'RBAC Configuration Export', type: 'config', status: 'approved', expiry: '2026-04-10' },
        { id: 'EV-001c', name: 'Access Review Report Q4', type: 'report', status: 'pending', expiry: '2026-04-10' },
        { id: 'EV-001d', name: 'MFA Enrollment Evidence', type: 'screenshot', status: 'approved', expiry: '2026-07-10' },
        { id: 'EV-001e', name: 'Privileged Access Log Sample', type: 'log', status: 'approved', expiry: '2026-04-10' },
      ] as any[] },
    { id: 'EC-002', control: 'SC-08 Transmission Protection', framework: 'NIST 800-53',
      status: 'partial', evidenceCount: 3, lastReview: '2026-01-05', nextReview: '2026-04-05',
      evidenceItems: [
        { id: 'EV-002a', name: 'TLS Configuration Scan Report', type: 'report', status: 'approved', expiry: '2026-04-05' },
        { id: 'EV-002b', name: 'Certificate Inventory', type: 'document', status: 'approved', expiry: '2026-04-05' },
        { id: 'EV-002c', name: 'Encryption-at-Rest Evidence', type: 'config', status: 'missing', expiry: '2026-04-05' },
      ] as any[] },
    { id: 'EC-003', control: 'AU-02 Audit Logging', framework: 'NIST 800-53',
      status: 'compliant', evidenceCount: 4, lastReview: '2026-01-12', nextReview: '2026-04-12',
      evidenceItems: [
        { id: 'EV-003a', name: 'Audit Log Policy', type: 'document', status: 'approved', expiry: '2027-01-12' },
        { id: 'EV-003b', name: 'Log Retention Configuration', type: 'config', status: 'approved', expiry: '2026-04-12' },
        { id: 'EV-003c', name: 'SIEM Coverage Report', type: 'report', status: 'approved', expiry: '2026-04-12' },
        { id: 'EV-003d', name: 'Log Integrity Verification', type: 'report', status: 'pending', expiry: '2026-04-12' },
      ] as any[] },
    { id: 'EC-004', control: 'IA-05 Identification/Auth', framework: 'NIST 800-53',
      status: 'non-compliant', evidenceCount: 2, lastReview: '2025-12-15', nextReview: '2026-03-15',
      evidenceItems: [
        { id: 'EV-004a', name: 'MFA Deployment Report', type: 'report', status: 'approved', expiry: '2026-03-15' },
        { id: 'EV-004b', name: 'Password Policy Compliance', type: 'report', status: 'expired', expiry: '2025-12-15' },
      ] as any[] },
    { id: 'EC-005', control: 'CM-03 Configuration Mgmt', framework: 'NIST 800-53',
      status: 'compliant', evidenceCount: 4, lastReview: '2026-01-08', nextReview: '2026-04-08',
      evidenceItems: [
        { id: 'EV-005a', name: 'Baseline Config Documentation', type: 'document', status: 'approved', expiry: '2027-01-08' },
        { id: 'EV-005b', name: 'Change Control Log', type: 'log', status: 'approved', expiry: '2026-04-08' },
        { id: 'EV-005c', name: 'Configuration Drift Report', type: 'report', status: 'approved', expiry: '2026-04-08' },
        { id: 'EV-005d', name: 'IaC Scan Results', type: 'report', status: 'pending', expiry: '2026-04-08' },
      ] as any[] },
  ] as any[];
  @state() private _evidenceSelectedControl: string | null = null;
  @state() private _crossFrameworkMapping = { 'NIST 800-53': ['ISO 27001', 'SOC 2', 'PCI DSS'], 'ISO 27001': ['NIST 800-53', 'SOC 2'], 'SOC 2': ['NIST 800-53', 'ISO 27001', 'PCI DSS'], 'PCI DSS': ['NIST 800-53', 'SOC 2'] } as Record<string, string[]>;

  private _calculateEvidenceCompleteness(control: any): number {
    if (!control.evidenceItems || control.evidenceItems.length === 0) return 0;
    const approved = control.evidenceItems.filter((e: any) => e.status === 'approved').length;
    return Math.round((approved / control.evidenceItems.length) * 100);
  }

  private _getExpiringEvidence(control: any, daysThreshold: number = 30): any[] {
    const now = new Date();
    const threshold = new Date(now.getTime() + daysThreshold * 86400000);
    return control.evidenceItems.filter((e: any) => new Date(e.expiry) <= threshold && e.status !== 'expired');
  }

  private _mapCrossFramework(controlFramework: string): string[] {
    return this._crossFrameworkMapping[controlFramework] || [];
  }

  private _getEvidenceGatheringStatus(): { automated: number; manual: number; missing: number } {
    let automated = 0, manual = 0, missing = 0;
    for (const ctrl of this._evidenceControls) {
      for (const ev of ctrl.evidenceItems) {
        if (ev.status === 'missing') missing++;
        else if (ev.type === 'config' || ev.type === 'log') automated++;
        else manual++;
      }
    }
    return { automated, manual, missing };
  }

  private _renderComplianceEvidenceSection(): TemplateResult {
    const selected = this._evidenceControls.find(c => c.id === this._evidenceSelectedControl);
    const gathering = this._getEvidenceGatheringStatus();
    return html`
      <div class="section-card">
        <div class="section-header">
          <h3>Compliance Evidence Manager</h3>
          <div class="header-actions">
            <span class="metric-badge success">Auto: ${gathering.automated}</span>
            <span class="metric-badge info">Manual: ${gathering.manual}</span>
            <span class="metric-badge danger">Missing: ${gathering.missing}</span>
          </div>
        </div>
        <div class="evidence-grid">
          <div class="control-list">
            ${this._evidenceControls.map(c => html`
              <div class="control-card ${this._evidenceSelectedControl === c.id ? 'selected' : ''} ${c.status}" @click=${() => { this._evidenceSelectedControl = c.id; }}>
                <div class="control-header">
                  <span class="control-id">${c.id}</span>
                  <span class="status-badge ${c.status}">${c.status}</span>
                </div>
                <div class="control-name">${c.control}</div>
                <div class="control-meta">
                  <span>${c.framework}</span>
                  <span>${c.evidenceCount} items</span>
                  <span>${this._calculateEvidenceCompleteness(c)}% complete</span>
                </div>
                <div class="completeness-bar"><div class="completeness-fill" style="width: ${this._calculateEvidenceCompleteness(c)}%"></div></div>
              </div>
            `)}
          </div>
          ${selected ? html`
            <div class="evidence-detail">
              <h4>${selected.control}</h4>
              <div class="detail-grid">
                <div class="detail-item"><label>Framework</label><span>${selected.framework}</span></div>
                <div class="detail-item"><label>Last Review</label><span>${selected.lastReview}</span></div>
                <div class="detail-item"><label>Next Review</label><span>${selected.nextReview}</span></div>
                <div class="detail-item"><label>Completeness</label><span>${this._calculateEvidenceCompleteness(selected)}%</span></div>
              </div>
              <h5>Cross-Framework Mapping</h5>
              <div class="framework-mapping">
                ${this._mapCrossFramework(selected.framework).map(f => html`<span class="framework-tag">${f}</span>`)}
              </div>
              <h5>Evidence Items</h5>
              <div class="evidence-items">
                ${selected.evidenceItems.map((ev: any) => html`
                  <div class="evidence-item ${ev.status}">
                    <span class="ev-id">${ev.id}</span>
                    <span class="ev-name">${ev.name}</span>
                    <span class="ev-type">${ev.type}</span>
                    <span class="ev-status ${ev.status}">${ev.status}</span>
                    <span class="ev-expiry">Exp: ${ev.expiry}</span>
                  </div>
                `)}
              </div>
              ${this._getExpiringEvidence(selected).length > 0 ? html`
                <h5>Expiring Soon (30 days)</h5>
                ${this._getExpiringEvidence(selected).map((ev: any) => html`
                  <div class="expiring-item"><span>${ev.id}: ${ev.name}</span><span>Expires: ${ev.expiry}</span></div>
                `)}
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
@state() private _spmRiskRegister7 = { id: "RSK-007", title: "Risk Item 7", category: "operational", likelihood: 3, impact: "high", owner: "Security Team", status: "open", mitigation: "Implement compensating controls", targetDate: "2026-02-17" } as any;

  // === Vulnerability Prioritization Engine Module ===
  private _vulnEpssScores: Array<{vulnId: string; cve: string; cvss: number; epss: number; combinedScore: number; assetCriticality: number; exposure: number; businessWeight: number; exploitAvailable: boolean; exploitPrediction: number}> = [];
  private _vulnPatchSchedule: Array<{patchId: string; cve: string; component: string; version: string; patchVersion: string; scheduledDate: string; window: string; riskIfUnpatched: string; status: string}> = [];
  private _vulnAgingAlerts: Array<{vulnId: string; cve: string; ageDays: number; severity: string; slaDays: number; overdueDays: number; owner: string; reason: string}> = [];
  private _zeroDayWorkflows: Array<{workflowId: string; cve: string; description: string; status: string; detectedAt: string; vendorNotified: boolean; patchAvailable: boolean; workaround: string; riskScore: number; nextAction: string; nextActionDate: string}> = [];
  private _vulnBusinessContext: Array<{assetId: string; assetName: string; businessUnit: string; dataClassification: string; internetFacing: boolean; regulatoryImpact: string[]; criticalityScore: number; vulnCount: number; topVuln: string}> = [];

  private _initVulnPriorityEngine(): void {
    this._vulnEpssScores = [
      {vulnId: 'vuln-001', cve: 'CVE-2024-XXXX', cvss: 9.8, epss: 0.974, combinedScore: 96.8, assetCriticality: 10, exposure: 9, businessWeight: 1.5, exploitAvailable: true, exploitPrediction: 0.98},
      {vulnId: 'vuln-002', cve: 'CVE-2024-YYYY', cvss: 8.6, epss: 0.891, combinedScore: 85.2, assetCriticality: 8, exposure: 7, businessWeight: 1.3, exploitAvailable: true, exploitPrediction: 0.92},
      {vulnId: 'vuln-003', cve: 'CVE-2024-ZZZZ', cvss: 7.5, epss: 0.654, combinedScore: 68.1, assetCriticality: 6, exposure: 5, businessWeight: 1.1, exploitAvailable: false, exploitPrediction: 0.71},
      {vulnId: 'vuln-004', cve: 'CVE-2024-AAAA', cvss: 9.1, epss: 0.823, combinedScore: 82.7, assetCriticality: 9, exposure: 8, businessWeight: 1.4, exploitAvailable: true, exploitPrediction: 0.88},
      {vulnId: 'vuln-005', cve: 'CVE-2024-BBBB', cvss: 6.5, epss: 0.412, combinedScore: 45.3, assetCriticality: 4, exposure: 3, businessWeight: 1.0, exploitAvailable: false, exploitPrediction: 0.48},
      {vulnId: 'vuln-006', cve: 'CVE-2024-CCCC', cvss: 8.2, epss: 0.756, combinedScore: 73.9, assetCriticality: 7, exposure: 6, businessWeight: 1.2, exploitAvailable: true, exploitPrediction: 0.81},
    ];
    this._vulnPatchSchedule = [
      {patchId: 'patch-001', cve: 'CVE-2024-XXXX', component: 'Apache Log4j', version: '2.14.1', patchVersion: '2.17.1', scheduledDate: '2024-12-17', window: '02:00-04:00 UTC', riskIfUnpatched: 'Critical - RCE', status: 'approved'},
      {patchId: 'patch-002', cve: 'CVE-2024-YYYY', component: 'OpenSSL', version: '1.1.1k', patchVersion: '1.1.1w', scheduledDate: '2024-12-18', window: '03:00-05:00 UTC', riskIfUnpatched: 'High - Data Leak', status: 'scheduled'},
      {patchId: 'patch-003', cve: 'CVE-2024-ZZZZ', component: 'Microsoft Exchange', version: '2016 CU23', patchVersion: 'CU24', scheduledDate: '2024-12-20', window: 'Saturday 01:00-06:00 UTC', riskIfUnpatched: 'High - Privilege Escalation', status: 'pending-approval'},
      {patchId: 'patch-004', cve: 'CVE-2024-AAAA', component: 'Linux Kernel', version: '5.15.0-88', patchVersion: '5.15.0-91', scheduledDate: '2024-12-19', window: 'Sunday 02:00-04:00 UTC', riskIfUnpatched: 'Critical - LPE', status: 'testing'},
      {patchId: 'patch-005', cve: 'CVE-2024-CCCC', component: 'Chrome Browser', version: '119.0.6045.159', patchVersion: '120.0.6099.62', scheduledDate: '2024-12-16', window: 'Automatic', riskIfUnpatched: 'High - Sandbox Escape', status: 'deploying'},
    ];
    this._vulnAgingAlerts = [
      {vulnId: 'aging-001', cve: 'CVE-2023-44487', ageDays: 95, severity: 'critical', slaDays: 7, overdueDays: 88, owner: 'platform-team', reason: 'Dependency conflict with legacy system'},
      {vulnId: 'aging-002', cve: 'CVE-2023-38545', ageDays: 72, severity: 'high', slaDays: 14, overdueDays: 58, owner: 'security-team', reason: 'Patch testing blocked by Q4 release freeze'},
      {vulnId: 'aging-003', cve: 'CVE-2023-46604', ageDays: 45, severity: 'critical', slaDays: 7, overdueDays: 38, owner: 'middleware-team', reason: 'Requires architecture change for permanent fix'},
      {vulnId: 'aging-004', cve: 'CVE-2023-22515', ageDays: 60, severity: 'critical', slaDays: 7, overdueDays: 53, owner: 'atlassian-team', reason: 'Vendor patch introduced regression - awaiting hotfix'},
      {vulnId: 'aging-005', cve: 'CVE-2023-20198', ageDays: 38, severity: 'high', slaDays: 14, overdueDays: 24, owner: 'network-team', reason: 'Hardware replacement needed - procurement delayed'},
    ];
    this._zeroDayWorkflows = [
      {workflowId: 'zd-001', cve: 'CVE-2024-XXXX-ZD', description: 'Chrome V8 type confusion leading to RCE', status: 'active-investigation', detectedAt: '2024-12-15T14:30:00Z', vendorNotified: true, patchAvailable: false, workaround: 'Disable JavaScript in Chrome until patched', riskScore: 9.5, nextAction: 'Apply vendor workaround', nextActionDate: '2024-12-16'},
      {workflowId: 'zd-002', cve: 'CVE-2024-YYYY-ZD', description: 'Windows Kernel memory corruption via malformed USB device descriptor', status: 'mitigation-applied', detectedAt: '2024-12-10T09:15:00Z', vendorNotified: true, patchAvailable: true, workaround: 'Block USB mass storage devices via GPO', riskScore: 8.7, nextAction: 'Schedule patch deployment', nextActionDate: '2024-12-17'},
      {workflowId: 'zd-003', cve: 'CVE-2024-ZZZZ-ZD', description: 'Cisco IOS XE web UI implant active exploitation', status: 'patch-deployed', detectedAt: '2024-12-08T16:45:00Z', vendorNotified: true, patchAvailable: true, workaround: 'Disable web UI on affected devices', riskScore: 9.8, nextAction: 'Verify patch deployment completion', nextActionDate: '2024-12-16'},
    ];
    this._vulnBusinessContext = [
      {assetId: 'asset-001', assetName: 'Core Banking Platform', businessUnit: 'Finance', dataClassification: 'confidential', internetFacing: true, regulatoryImpact: ['PCI-DSS', 'SOX', 'GDPR'], criticalityScore: 10, vulnCount: 12, topVuln: 'CVE-2024-XXXX'},
      {assetId: 'asset-002', assetName: 'Customer Portal', businessUnit: 'Sales', dataClassification: 'internal', internetFacing: true, regulatoryImpact: ['CCPA', 'GDPR'], criticalityScore: 8, vulnCount: 8, topVuln: 'CVE-2024-YYYY'},
      {assetId: 'asset-003', assetName: 'HR Management System', businessUnit: 'Human Resources', dataClassification: 'confidential', internetFacing: false, regulatoryImpact: ['GDPR', 'HIPAA'], criticalityScore: 7, vulnCount: 5, topVuln: 'CVE-2024-ZZZZ'},
      {assetId: 'asset-004', assetName: 'Dev CI/CD Pipeline', businessUnit: 'Engineering', dataClassification: 'internal', internetFacing: true, regulatoryImpact: ['SOC2'], criticalityScore: 6, vulnCount: 15, topVuln: 'CVE-2024-CCCC'},
      {assetId: 'asset-005', assetName: 'Executive Email Gateway', businessUnit: 'IT', dataClassification: 'confidential', internetFacing: true, regulatoryImpact: ['SOX', 'GDPR'], criticalityScore: 9, vulnCount: 3, topVuln: 'CVE-2024-AAAA'},
    ];
  }

  private _renderVulnEpssScoring(): ReturnType<typeof html> {
    const sorted = [...this._vulnEpssScores].sort((a, b) => b.combinedScore - a.combinedScore);
    return html`
      <div class="epss-scoring-section">
        <div class="section-header">
          <h4>EPSS + CVSS Combined Scoring</h4>
        </div>
        <div class="epss-grid">
          ${sorted.map(v => html`
            <div class="epss-card score-${v.combinedScore >= 80 ? 'critical' : v.combinedScore >= 60 ? 'high' : 'medium'}">
              <div class="epss-header">
                <span class="epss-cve">${v.cve}</span>
                <span class="epss-combined">${v.combinedScore.toFixed(1)}</span>
              </div>
              <div class="epss-breakdown">
                <div class="score-row"><span>CVSS</span><div class="score-bar"><div class="score-fill" style="width: ${v.cvss * 10}%"></div></div><span>${v.cvss}</span></div>
                <div class="score-row"><span>EPSS</span><div class="score-bar"><div class="score-fill epss" style="width: ${v.epss * 100}%"></div></div><span>${(v.epss * 100).toFixed(1)}%</span></div>
                <div class="score-row"><span>Exploit Pred.</span><div class="score-bar"><div class="score-fill prediction" style="width: ${v.exploitPrediction * 100}%"></div></div><span>${(v.exploitPrediction * 100).toFixed(0)}%</span></div>
                <div class="score-row"><span>Business Wt.</span><span class="weight-badge">x${v.businessWeight}</span></div>
              </div>
              <div class="epss-meta">
                <span>Asset Criticality: ${v.assetCriticality}/10</span>
                <span>Exposure: ${v.exposure}/10</span>
                <span>Exploit: ${v.exploitAvailable ? 'YES' : 'No'}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderVulnPatchSchedule(): ReturnType<typeof html> {
    return html`
      <div class="patch-schedule-section">
        <div class="section-header">
          <h4>Patch Deployment Schedule</h4>
        </div>
        <div class="patch-list">
          ${this._vulnPatchSchedule.map(p => html`
            <div class="patch-card status-${p.status}">
              <div class="patch-header">
                <span class="patch-cve">${p.cve}</span>
                <span class="patch-status">${p.status}</span>
              </div>
              <div class="patch-details">
                <span>${p.component} ${p.version} -> ${p.patchVersion}</span>
                <span>Scheduled: ${p.scheduledDate} (${p.window})</span>
                <span>Risk: ${p.riskIfUnpatched}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderVulnAgingAlerts(): ReturnType<typeof html> {
    return html`
      <div class="aging-alerts-section">
        <div class="section-header">
          <h4>Vulnerability Aging Alerts</h4>
          <span class="badge critical">${this._vulnAgingAlerts.filter(a => a.overdueDays > 60).length} Critical Overdue</span>
        </div>
        <div class="aging-list">
          ${this._vulnAgingAlerts.sort((a, b) => b.overdueDays - a.overdueDays).map(a => html`
            <div class="aging-card severity-${a.severity}">
              <div class="aging-header">
                <span class="aging-cve">${a.cve}</span>
                <span class="aging-days overdue">${a.overdueDays}d overdue</span>
              </div>
              <div class="aging-details">
                <span>Age: ${a.ageDays} days (SLA: ${a.slaDays}d)</span>
                <span>Owner: ${a.owner}</span>
                <span>Reason: ${a.reason}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderZeroDayWorkflows(): ReturnType<typeof html> {
    return html`
      <div class="zeroday-section">
        <div class="section-header">
          <h4>Zero-Day Response Workflows</h4>
        </div>
        <div class="zeroday-list">
          ${this._zeroDayWorkflows.map(zd => html`
            <div class="zeroday-card status-${zd.status}">
              <div class="zd-header">
                <span class="zd-cve">${zd.cve}</span>
                <span class="zd-status">${zd.status}</span>
                <span class="zd-risk">Risk: ${zd.riskScore}/10</span>
              </div>
              <p class="zd-desc">${zd.description}</p>
              <div class="zd-details">
                <span>Detected: ${zd.detectedAt}</span>
                <span>Vendor Notified: ${zd.vendorNotified ? 'Yes' : 'No'}</span>
                <span>Patch: ${zd.patchAvailable ? 'Available' : 'Pending'}</span>
              </div>
              ${zd.workaround ? html`<div class="zd-workaround"><strong>Workaround:</strong> ${zd.workaround}</div>` : ''}
              <div class="zd-next-action">
                <strong>Next:</strong> ${zd.nextAction} (by ${zd.nextActionDate})
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderVulnBusinessContext(): ReturnType<typeof html> {
    return html`
      <div class="vuln-biz-section">
        <div class="section-header">
          <h4>Business Context Weighting</h4>
        </div>
        <div class="biz-grid">
          ${this._vulnBusinessContext.sort((a, b) => b.criticalityScore - a.criticalityScore).map(b => html`
            <div class="biz-card">
              <div class="biz-header">
                <span class="biz-asset">${b.assetName}</span>
                <span class="biz-criticality">${b.criticalityScore}/10</span>
              </div>
              <div class="biz-details">
                <span>BU: ${b.businessUnit}</span>
                <span>Data: ${b.dataClassification}</span>
                <span>Internet: ${b.internetFacing ? 'Yes' : 'No'}</span>
                <span>Vulns: ${b.vulnCount}</span>
              </div>
              <div class="biz-regulatory">
                ${b.regulatoryImpact.map(r => html`<span class="reg-tag">${r}</span>`)}
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
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







  // === Security Risk Dashboard Block ===
  @state() private _complianceAuRiskTopTen: Array<{id:string;name:string;score:number;trend:string;owner:string;category:string;lastAssessed:string}> = [
    {id:"R001",name:"Unpatched Critical CVEs",score:95,trend:"up",owner:"IT Ops",category:"Vulnerability",lastAssessed:"2026-04-22"},
    {id:"R002",name:"Misconfigured Cloud Storage",score:92,trend:"up",owner:"Cloud Team",category:"Configuration",lastAssessed:"2026-04-21"},
    {id:"R003",name:"Overprivileged Service Accounts",score:88,trend:"stable",owner:"IAM Team",category:"Identity",lastAssessed:"2026-04-20"},
    {id:"R004",name:"Legacy TLS Dependencies",score:85,trend:"down",owner:"Network",category:"Encryption",lastAssessed:"2026-04-19"},
    {id:"R005",name:"Third-Party API Key Exposure",score:83,trend:"up",owner:"DevOps",category:"Data Loss",lastAssessed:"2026-04-22"},
    {id:"R006",name:"Inadequate Network Segmentation",score:80,trend:"stable",owner:"Network",category:"Network",lastAssessed:"2026-04-18"},
    {id:"R007",name:"Missing MFA on Admin Portals",score:78,trend:"down",owner:"Security",category:"Authentication",lastAssessed:"2026-04-17"},
    {id:"R008",name:"Outdated Endpoint Protection",score:75,trend:"stable",owner:"Endpoint",category:"Endpoint",lastAssessed:"2026-04-16"},
    {id:"R009",name:"Insufficient Logging Coverage",score:72,trend:"up",owner:"SOC",category:"Monitoring",lastAssessed:"2026-04-15"},
    {id:"R010",name:"Shadow IT SaaS Applications",score:70,trend:"stable",owner:"GRC",category:"Governance",lastAssessed:"2026-04-14"},
  ];
  @state() private _complianceAuRiskCategories: Array<{category:string;count:number;avgScore:number;color:string}> = [
    {category:"Vulnerability",count:47,avgScore:82,color:"#ef4444"},
    {category:"Configuration",count:32,avgScore:75,color:"#f97316"},
    {category:"Identity",count:28,avgScore:71,color:"#eab308"},
    {category:"Network",count:24,avgScore:68,color:"#22c55e"},
    {category:"Data Loss",count:19,avgScore:65,color:"#3b82f6"},
    {category:"Encryption",count:15,avgScore:62,color:"#8b5cf6"},
  ];
  @state() private _complianceAuRiskVelocity: Array<{week:string;newRisks:number;closedRisks:number;netChange:number}> = [
    {week:"W15",newRisks:12,closedRisks:8,netChange:4},
    {week:"W16",newRisks:15,closedRisks:11,netChange:4},
    {week:"W17",newRisks:9,closedRisks:14,netChange:-5},
    {week:"W18",newRisks:18,closedRisks:10,netChange:8},
    {week:"W19",newRisks:7,closedRisks:16,netChange:-9},
    {week:"W20",newRisks:11,closedRisks:13,netChange:-2},
    {week:"W21",newRisks:14,closedRisks:9,netChange:5},
  ];
  @state() private _complianceAuRiskAppetite: {current:number;threshold:number;maxTolerated:number;status:string} = {
    current: 68, threshold: 55, maxTolerated: 80, status: 'Warning'
  };
  @state() private _complianceAuRiskOwnerMatrix: Array<{owner:string;criticalCount:number;highCount:number;mediumCount:number;complianceRate:number}> = [
    {owner:"IT Ops",criticalCount:5,highCount:12,mediumCount:23,complianceRate:0.72},
    {owner:"Cloud Team",criticalCount:3,highCount:9,mediumCount:18,complianceRate:0.81},
    {owner:"IAM Team",criticalCount:2,highCount:7,mediumCount:14,complianceRate:0.88},
    {owner:"Network",criticalCount:4,highCount:11,mediumCount:20,complianceRate:0.76},
    {owner:"DevOps",criticalCount:3,highCount:8,mediumCount:16,complianceRate:0.83},
    {owner:"Security",criticalCount:1,highCount:5,mediumCount:12,complianceRate:0.91},
  ];
  private _renderComplianceauRiskDash(): TemplateResult {
    const riskItems = this._complianceAuRiskTopTen;
    const velocity = this._complianceAuRiskVelocity;
    const appetite = this._complianceAuRiskAppetite;
    return html`
      <div class="risk-dash-section" style="margin-top:16px;padding:16px;border:1px solid #334155;border-radius:8px;background:#0f172a;">
        <h4 style="color:#f1f5f9;margin:0 0 12px 0;font-size:14px;">Security Risk Dashboard</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div style="background:#1e293b;border-radius:6px;padding:12px;">
            <h5 style="color:#94a3b8;margin:0 0 8px 0;font-size:12px;">Top 10 Risks</h5>
            ${riskItems.slice(0, 5).map(r => html`
              <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid #334155;">
                <span style="color:#e2e8f0;font-size:11px;">${r.name}</span>
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="color:${r.trend === "up" ? "#ef4444" : r.trend === "down" ? "#22c55e" : "#eab308"};font-size:10px;">
                    ${r.trend === "up" ? "\u2191" : r.trend === "down" ? "\u2193" : "\u2192"}
                  </span>
                  <span style="color:#f87171;font-size:11px;font-weight:bold;">${r.score}</span>
                </div>
              </div>
            `)}
          </div>
          <div style="background:#1e293b;border-radius:6px;padding:12px;">
            <h5 style="color:#94a3b8;margin:0 0 8px 0;font-size:12px;">Risk Velocity (Weekly)</h5>
            ${velocity.map(v => html`
              <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:11px;">
                <span style="color:#cbd5e1;">${v.week}</span>
                <span style="color:${v.netChange > 0 ? "#f87171" : "#4ade80"};">${v.netChange > 0 ? "+" : ""}${v.netChange}</span>
              </div>
            `)}
          </div>
        </div>
        <div style="margin-top:12px;background:#1e293b;border-radius:6px;padding:12px;">
          <h5 style="color:#94a3b8;margin:0 0 8px 0;font-size:12px;">Risk Appetite Gauge</h5>
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="flex:1;height:8px;background:#334155;border-radius:4px;position:relative;">
              <div style="height:100%;width:${appetite.current}%;background:${appetite.current > appetite.maxTolerated ? "#ef4444" : appetite.current > appetite.threshold ? "#f97316" : "#22c55e"};border-radius:4px;transition:width 0.3s;"></div>
              <div style="position:absolute;left:${appetite.threshold}%;top:-2px;width:2px;height:12px;background:#eab308;"></div>
              <div style="position:absolute;left:${appetite.maxTolerated}%;top:-2px;width:2px;height:12px;background:#ef4444;"></div>
            </div>
            <span style="color:#e2e8f0;font-size:11px;">${appetite.current}/100</span>
          </div>
        </div>
      </div>
    `;
  }

  // === Security Event Correlation Block ===
  @state() private _complianceAuCorrRules: Array<{id:string;name:string;sources:string[];logic:string;severity:string;active:boolean;lastTriggered:string}> = [
    {id:"CR01",name:"Brute Force Detection",sources:["AD","Firewall","SIEM"],logic:"5 failed logins + firewall block within 10min",severity:"High",active:true,lastTriggered:"2026-04-22T08:30:00Z"},
    {id:"CR02",name:"Data Exfiltration Pattern",sources:["DLP","Proxy","DNS"],logic:"Large upload + DNS tunneling indicators",severity:"Critical",active:true,lastTriggered:"2026-04-21T14:22:00Z"},
    {id:"CR03",name:"Lateral Movement Detection",sources:["EDR","AD","Network"],logic:"New admin session + unusual SMB traffic",severity:"High",active:true,lastTriggered:"2026-04-20T11:15:00Z"},
    {id:"CR04",name:"Malware Beacon Detection",sources:["DNS","Proxy","EDR"],logic:"Periodic DNS queries + known C2 patterns",severity:"Critical",active:true,lastTriggered:"2026-04-22T06:45:00Z"},
  ];
  @state() private _complianceAuEventTimeline: Array<{timestamp:string;source:string;eventType:string;details:string;correlated:boolean}> = [
    {timestamp:"2026-04-22T10:34:12Z",source:"EDR",eventType:"Process Injection",details:"cmd.exe spawned from powershell",correlated:true},
    {timestamp:"2026-04-22T10:33:58Z",source:"AD",eventType:"Anomalous Login",details:"Service account used from new IP",correlated:true},
    {timestamp:"2026-04-22T10:32:01Z",source:"Firewall",eventType:"Port Scan",details:"192.168.1.45 scanning 10.0.0.0/8",correlated:false},
    {timestamp:"2026-04-22T10:30:45Z",source:"DLP",eventType:"Data Transfer",details:"10MB zip uploaded to external share",correlated:true},
    {timestamp:"2026-04-22T10:28:33Z",source:"DNS",eventType:"Suspicious Query",details:"Query to known malicious domain",correlated:true},
  ];
  @state() private _complianceAuFalsePosMetrics: {totalEvents:number;correlatedEvents:number;falsePositives:number;fpRate:number;topFpRules:string[]} = {
    totalEvents: 45230, correlatedEvents: 3847, falsePositives: 892, fpRate: 0.232,
    topFpRules: ["Port Scan Detection", "Anomalous Login Location", "Large File Download"]
  };
  @state() private _complianceAuEventPatterns: Array<{id:string;pattern:string;frequency:number;firstSeen:string;lastSeen:string;status:string}> = [
    {id:"EP01",pattern:"Credential stuffing from Tor exit nodes",frequency:23,firstSeen:"2026-03-15",lastSeen:"2026-04-22",status:"Active"},
    {id:"EP02",pattern:"DNS tunneling via TXT records",frequency:8,firstSeen:"2026-04-01",lastSeen:"2026-04-20",status:"Monitoring"},
    {id:"EP03",pattern:"Scheduled task persistence mechanism",frequency:3,firstSeen:"2026-04-10",lastSeen:"2026-04-18",status:"Investigating"},
  ];
  private _renderComplianceauEventCorr(): TemplateResult {
    const rules = this._complianceAuCorrRules;
    const timeline = this._complianceAuEventTimeline;
    const fpMetrics = this._complianceAuFalsePosMetrics;
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

  // === Security Training Platform Block ===
  @state() private _complianceAuCourses: Array<{id:string;title:string;category:string;duration:number;enrolled:number;completed:number;difficulty:string;rating:number}> = [
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
  @state() private _complianceAuLearningPaths: Array<{id:string;name:string;courseIds:string[];progress:number;enrolled:number}> = [
    {id:"LP01",name:"Security Analyst Fundamentals",courseIds:["C001","C004","C007"],progress:72,enrolled:156},
    {id:"LP02",name:"DevSecOps Engineer",courseIds:["C001","C002","C008","C012"],progress:45,enrolled:78},
    {id:"LP03",name:"Cloud Security Specialist",courseIds:["C003","C006","C009"],progress:58,enrolled:89},
    {id:"LP04",name:"Advanced Penetration Tester",courseIds:["C010","C002","C005"],progress:33,enrolled:45},
  ];
  @state() private _complianceAuDeptCompliance: Array<{dept:string;trainedPct:number;targetPct:number;avgScore:number;certCount:number}> = [
    {dept:"Engineering",trainedPct:88,targetPct:95,avgScore:82,certCount:34},
    {dept:"Operations",trainedPct:92,targetPct:95,avgScore:87,certCount:28},
    {dept:"Finance",trainedPct:78,targetPct:90,avgScore:74,certCount:12},
    {dept:"HR",trainedPct:85,targetPct:90,avgScore:79,certCount:8},
    {dept:"Legal",trainedPct:71,targetPct:85,avgScore:71,certCount:6},
  ];
  @state() private _complianceAuSkillsGaps: Array<{skill:string;current:number;required:number;gap:number;priority:string}> = [
    {skill:"Cloud Security",current:62,required:85,gap:23,priority:"High"},
    {skill:"Threat Hunting",current:55,required:80,gap:25,priority:"High"},
    {skill:"Incident Response",current:70,required:85,gap:15,priority:"Medium"},
    {skill:"Secure Coding",current:75,required:90,gap:15,priority:"Medium"},
    {skill:"Forensics",current:45,required:75,gap:30,priority:"Critical"},
  ];
  private _renderComplianceauTraining(): TemplateResult {
    const courses = this._complianceAuCourses;
    const deptComp = this._complianceAuDeptCompliance;
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

  // === Cloud Workload Protection Block ===
  @state() private _complianceAuContainerScans: Array<{image:string;registry:string;critical:number;high:number;medium:number;scanDate:string;status:string}> = [
    {image:"nginx:1.25",registry:"docker.io",critical:2,high:5,medium:12,scanDate:"2026-04-22",status:"Vulnerable"},
    {image:"postgres:16",registry:"ghcr.io",critical:0,high:1,medium:3,scanDate:"2026-04-22",status:"Clean"},
    {image:"redis:7.2",registry:"docker.io",critical:1,high:3,medium:8,scanDate:"2026-04-21",status:"Vulnerable"},
    {image:"app-server:v2.3",registry:"ecr.aws",critical:0,high:0,medium:2,scanDate:"2026-04-22",status:"Clean"},
    {image:"sidecar-proxy:v1.8",registry:"gcr.io",critical:3,high:7,medium:15,scanDate:"2026-04-20",status:"Critical"},
  ];
  @state() private _complianceAuK8sPods: Array<{namespace:string;pod:string;securityContext:string;hostIPC:boolean;hostPID:boolean;privileged:boolean;riskLevel:string}> = [
    {namespace:"production",pod:"web-frontend-7d9f8",securityContext:"Restricted",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Low"},
    {namespace:"production",pod:"api-gateway-4b2c1",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
    {namespace:"staging",pod:"db-migrator-x8k3m",securityContext:"Privileged",hostIPC:true,hostPID:false,privileged:true,riskLevel:"Critical"},
    {namespace:"monitoring",pod:"prometheus-q7r2p",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
  ];
  @state() private _complianceAuServerlessRisk: Array<{function:string;runtime:string;timeout:number;iamPerms:string;externalCalls:number;riskScore:number}> = [
    {function:"processPayment",runtime:"nodejs20.x",timeout:30,iamPerms:"dynamodb:*",externalCalls:3,riskScore:78},
    {function:"sendNotification",runtime:"python3.12",timeout:15,iamPerms:"sns:Publish",externalCalls:1,riskScore:25},
    {function:"imageResizer",runtime:"python3.12",timeout:60,iamPerms:"s3:*",externalCalls:0,riskScore:45},
    {function:"authValidator",runtime:"go1.x",timeout:10,iamPerms:"cognito-idp:*",externalCalls:2,riskScore:62},
  ];
  @state() private _complianceAuRuntimeAlerts: Array<{id:string;workload:string;alertType:string;severity:string;description:string;timestamp:string}> = [
    {id:"RTA01",workload:"db-migrator-x8k3m",alertType:"Privilege Escalation",severity:"Critical",description:"Container attempted to access /etc/shadow",timestamp:"2026-04-22T10:34:00Z"},
    {id:"RTA02",workload:"web-frontend-7d9f8",alertType:"Anomalous Outbound",severity:"High",description:"Unexpected DNS query to known C2 domain",timestamp:"2026-04-22T09:12:00Z"},
    {id:"RTA03",workload:"sidecar-proxy:v1.8",alertType:"Crypto Mining",severity:"Critical",description:"CPU utilization exceeded 95% for 30 minutes",timestamp:"2026-04-21T23:45:00Z"},
  ];
  private _renderComplianceauCloudWl(): TemplateResult {
    const containers = this._complianceAuContainerScans;
    const pods = this._complianceAuK8sPods;
    const alerts = this._complianceAuRuntimeAlerts;
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
  // Security Maturity Assessment Module
  private _renderSecurityMaturityAssessment() {
    const cmmcLevels = [
      { level: 1, name: 'Initial', practices: 18, implemented: 4, color: '#ef4444' },
      { level: 2, name: 'Managed', practices: 18, implemented: 9, color: '#f97316' },
      { level: 3, name: 'Defined', practices: 18, implemented: 14, color: '#eab308' },
      { level: 4, name: 'Measured', practices: 18, implemented: 16, color: '#22c55e' },
      { level: 5, name: 'Optimized', practices: 18, implemented: 18, color: '#3b82f6' },
    ];
    const currentLevel = cmmcLevels[2];
    const nistFunctions = [
      { id: 'GV', name: 'Govern', maturity: 3.2, target: 4.0, trend: 'up' },
      { id: 'ID', name: 'Identify', maturity: 3.5, target: 4.0, trend: 'up' },
      { id: 'PR', name: 'Protect', maturity: 3.8, target: 4.5, trend: 'stable' },
      { id: 'DE', name: 'Detect', maturity: 2.9, target: 4.0, trend: 'up' },
      { id: 'RS', name: 'Respond', maturity: 3.1, target: 4.0, trend: 'down' },
      { id: 'RC', name: 'Recover', maturity: 2.7, target: 3.5, trend: 'stable' },
    ];
    const peerComparison = [
      { peer: 'Industry Average', score: 3.1 },
      { peer: 'Sector Median', score: 3.4 },
      { peer: 'Top Quartile', score: 4.2 },
      { peer: 'Your Org', score: 3.2, highlight: true },
    ];
    const milestones = [
      { q: 'Q1 2026', target: 'ID.RA-1 complete', status: 'done' },
      { q: 'Q2 2026', target: 'PR.AC-3 enhanced', status: 'in-progress' },
      { q: 'Q3 2026', target: 'DE.CM-1 automation', status: 'planned' },
      { q: 'Q4 2026', target: 'RS.RP-1 playbooks', status: 'planned' },
    ];
    const trendData = [2.1, 2.3, 2.5, 2.6, 2.8, 2.9, 3.0, 3.1, 3.1, 3.2, 3.2, 3.2];
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    const gapAnalysis = nistFunctions.map(f => ({
      ...f,
      gap: Math.round((f.target - f.maturity) * 10) / 10,
      gapPct: Math.round(((f.target - f.maturity) / f.target) * 100),
    }));
    return html`
      <section class="maturity-assessment">
        <h4>Security Maturity Assessment</h4>
        <div class="maturity-grid">
          <div class="maturity-cmmc">
            <h5>CMMC Level Assessment</h5>
            <div class="cmmc-levels">
              ${cmmcLevels.map(l => {
                const pct = Math.round((l.implemented / l.practices) * 100);
                return html`
                  <div class="cmmc-level-card" style="border-color:${l.color}">
                    <div class="cmmc-level-num" style="background:${l.color}">L${l.level}</div>
                    <div class="cmmc-level-name">${l.name}</div>
                    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${l.color}"></div></div>
                    <span>${l.implemented}/${l.practices} practices</span>
                  </div>`;
              }).join('')}
            </div>
            <div class="current-level-badge">Current: Level ${currentLevel.level} - ${currentLevel.name}</div>
          </div>
          <div class="maturity-nist">
            <h5>NIST CSF 2.0 Maturity Scoring</h5>
            <table class="maturity-table">
              <thead><tr><th>Function</th><th>Current</th><th>Target</th><th>Gap</th><th>Trend</th></tr></thead>
              <tbody>
                ${nistFunctions.map(f => html`
                  <tr>
                    <td><strong>${f.id}</strong> ${f.name}</td>
                    <td>${f.maturity}</td>
                    <td>${f.target}</td>
                    <td style="color:${f.maturity >= f.target ? '#10b981' : '#ef4444'}">${(f.target - f.maturity).toFixed(1)}</td>
                    <td class="trend-${f.trend}">${f.trend === 'up' ? '\u2191' : f.trend === 'down' ? '\u2193' : '\u2192'}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="maturity-peers">
            <h5>Peer Maturity Comparison</h5>
            <div class="peer-bars">
              ${peerComparison.map(p => html`
                <div class="peer-row ${p.highlight ? 'highlight' : ''}">
                  <span class="peer-label">${p.peer}</span>
                  <div class="progress-bar"><div class="progress-fill" style="width:${(p.score / 5) * 100}%;background:${p.highlight ? '#3b82f6' : '#6b7280'}"></div></div>
                  <span>${p.score}</span>
                </div>`).join('')}
            </div>
          </div>
          <div class="maturity-trend">
            <h5>12-Month Maturity Trend</h5>
            <div class="trend-chart">
              ${trendData.map((v, i) => html`
                <div class="trend-bar" style="height:${(v / 5) * 100}%" title="${months[i]}: ${v}">
                  <span class="trend-val">${v}</span>
                </div>`).join('')}
              ${months.map(m => html`<span class="trend-label">${m}</span>`).join('')}
            </div>
          </div>
          <div class="maturity-roadmap">
            <h5>Improvement Roadmap</h5>
            <div class="roadmap-timeline">
              ${milestones.map(m => html`
                <div class="roadmap-item status-${m.status}">
                  <div class="roadmap-q">${m.q}</div>
                  <div class="roadmap-target">${m.target}</div>
                  <div class="roadmap-status">${m.status.replace('-', ' ')}</div>
                </div>`).join('')}
            </div>
          </div>
          <div class="maturity-gaps">
            <h5>Gap-to-Target Analysis</h5>
            <div class="gap-list">
              ${gapAnalysis.map(g => html`
                <div class="gap-item">
                  <span class="gap-fn">${g.id} ${g.name}</span>
                  <div class="gap-bar"><div class="gap-fill" style="width:${g.gapPct}%;background:${g.gapPct > 20 ? '#ef4444' : '#f97316'}"></div></div>
                  <span class="gap-val">${g.gap} gap</span>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </section>`;
  }


  // Threat Scenario Modeling Module
  private _renderThreatScenarioModeling() {
    const scenarios = [
      { id: 'TS-001', name: 'Ransomware Double Extortion', probability: 0.72, impact: 9.2, defense: 0.65, status: 'drilled' },
      { id: 'TS-002', name: 'Supply Chain Compromise', probability: 0.45, impact: 8.8, defense: 0.42, status: 'planned' },
      { id: 'TS-003', name: 'Insider Data Exfiltration', probability: 0.58, impact: 7.5, defense: 0.71, status: 'drilled' },
      { id: 'TS-004', name: 'Cloud Misconfiguration', probability: 0.81, impact: 6.9, defense: 0.58, status: 'active' },
      { id: 'TS-005', name: 'Zero-Day Exploit Chain', probability: 0.23, impact: 9.8, defense: 0.35, status: 'planned' },
      { id: 'TS-006', name: 'Credential Stuffing Campaign', probability: 0.67, impact: 5.4, defense: 0.82, status: 'drilled' },
      { id: 'TS-007', name: 'DNS Tunneling C2', probability: 0.34, impact: 7.1, defense: 0.55, status: 'planned' },
      { id: 'TS-008', name: 'Social Engineering Phishing', probability: 0.76, impact: 6.2, defense: 0.73, status: 'active' },
    ];
    const matrixCells = scenarios.map(s => ({
      ...s,
      risk: Math.round(s.probability * s.impact * 10) / 10,
    }));
    const playbookSteps = [
      { step: 1, action: 'Initial Detection', owner: 'SOC L1', sla: '15 min' },
      { step: 2, action: 'Threat Triage', owner: 'SOC L2', sla: '30 min' },
      { step: 3, action: 'Containment', owner: 'IR Lead', sla: '2 hours' },
      { step: 4, action: 'Eradication', owner: 'Forensics', sla: '8 hours' },
      { step: 5, action: 'Recovery', owner: 'IT Ops', sla: '24 hours' },
      { step: 6, action: 'Post-Incident Review', owner: 'CISO', sla: '72 hours' },
    ];
    const drillSchedule = [
      { scenario: 'TS-001', date: '2026-05-15', type: 'Tabletop', participants: 12 },
      { scenario: 'TS-003', date: '2026-06-20', type: 'Live Fire', participants: 8 },
      { scenario: 'TS-005', date: '2026-07-10', type: 'Tabletop', participants: 15 },
      { scenario: 'TS-008', date: '2026-08-05', type: 'Simulation', participants: 20 },
    ];
    const aarTemplate = {
      scenario: 'TS-001', date: '2026-03-20',
      objectives: ['Validate containment', 'Test comms', 'Measure MTTR'],
      findings: ['Detection delayed 8 min', 'SOC-IT gap', 'Backup OK'],
      improvements: ['Tune SIEM rules', 'Update IR contacts', 'Auto-contain'],
      score: 7.2,
    };
    const evolution = [
      { scenario: 'TS-001', v1: 'Basic ransomware', v2: 'Double extortion + lateral', v3: 'Custom payload' },
      { scenario: 'TS-004', v1: 'Open S3 bucket', v2: 'IAM misconfig chain', v3: 'Multi-cloud priv esc' },
    ];
    return html`
      <section class="threat-scenario-modeling">
        <h4>Threat Scenario Modeling</h4>
        <div class="scenario-grid">
          <div class="scenario-matrix">
            <h5>Probability x Impact Matrix</h5>
            <table class="scenario-table">
              <thead><tr><th>ID</th><th>Scenario</th><th>Prob</th><th>Impact</th><th>Risk</th><th>Defense</th><th>Status</th></tr></thead>
              <tbody>
                ${matrixCells.map(s => {
                  const riskColor = s.risk > 6 ? '#ef4444' : s.risk > 4 ? '#f97316' : '#22c55e';
                  return html`
                    <tr>
                      <td>${s.id}</td>
                      <td>${s.name}</td>
                      <td>${(s.probability * 100).toFixed(0)}%</td>
                      <td>${s.impact}</td>
                      <td style="color:${riskColor};font-weight:bold">${s.risk}</td>
                      <td>
                        <div class="mini-bar"><div class="mini-fill" style="width:${s.defense * 100}%;background:${s.defense > 0.7 ? '#22c55e' : s.defense > 0.5 ? '#f97316' : '#ef4444'}"></div></div>
                        ${(s.defense * 100).toFixed(0)}%
                      </td>
                      <td class="status-${s.status}">${s.status}</td>
                    </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div class="scenario-playbook">
            <h5>Attack Scenario Playbook</h5>
            <div class="playbook-steps">
              ${playbookSteps.map(s => html`
                <div class="playbook-step">
                  <div class="step-num">${s.step}</div>
                  <div class="step-detail">
                    <div class="step-action">${s.action}</div>
                    <div class="step-meta">Owner: ${s.owner} | SLA: ${s.sla}</div>
                  </div>
                </div>`).join('')}
            </div>
          </div>
          <div class="scenario-drills">
            <h5>Drill Schedule</h5>
            <div class="drill-list">
              ${drillSchedule.map(d => html`
                <div class="drill-item">
                  <span class="drill-scenario">${d.scenario}</span>
                  <span class="drill-date">${d.date}</span>
                  <span class="drill-type">${d.type}</span>
                  <span class="drill-participants">${d.participants} ppl</span>
                </div>`).join('')}
            </div>
          </div>
          <div class="scenario-aar">
            <h5>After-Action Review: ${aarTemplate.scenario}</h5>
            <div class="aar-score">Score: ${aarTemplate.score}/10</div>
            <div class="aar-section"><strong>Findings:</strong>
              <ul>${aarTemplate.findings.map(f => html`<li>${f}</li>`).join('')}</ul>
            </div>
            <div class="aar-section"><strong>Improvements:</strong>
              <ul>${aarTemplate.improvements.map(i => html`<li>${i}</li>`).join('')}</ul>
            </div>
          </div>
          <div class="scenario-evolution">
            <h5>Scenario Evolution Tracking</h5>
            ${evolution.map(e => html`
              <div class="evo-track">
                <strong>${e.scenario}</strong>
                <div class="evo-stages">
                  <span>V1: ${e.v1}</span> <span>\u2192</span>
                  <span>V2: ${e.v2}</span> <span>\u2192</span>
                  <span>V3: ${e.v3}</span>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </section>`;
  }




  // --- Security Compliance Calendar ---
  @state() private _complianceCalendarEvents: Array<{id: string; title: string; deadline: string; category: string; status: string; assignee: string; notes: string}> = [
    {id: 'cc-compliance-audit-tracker-001', title: 'SOX Section 404 Compliance Review', deadline: '2026-06-30', category: 'Regulatory', status: 'In Progress', assignee: 'Compliance Team', notes: 'Annual internal control assessment for financial reporting'},
    {id: 'cc-compliance-audit-tracker-002', title: 'GDPR Data Protection Impact Assessment', deadline: '2026-05-15', category: 'Privacy', status: 'Pending', assignee: 'DPO Office', notes: 'Quarterly DPIA for high-risk processing activities'},
    {id: 'cc-compliance-audit-tracker-003', title: 'ISO 27001 Surveillance Audit', deadline: '2026-07-20', category: 'Certification', status: 'Scheduled', assignee: 'QA Lead', notes: 'Stage 2 surveillance audit for ISMS certification renewal'},
    {id: 'cc-compliance-audit-tracker-004', title: 'PCI DSS v4.0 Gap Analysis', deadline: '2026-05-30', category: 'Payment', status: 'Not Started', assignee: 'Security Architect', notes: 'Assess current state against PCI DSS v4.0 requirements'},
    {id: 'cc-compliance-audit-tracker-005', title: 'NIST CSF Self-Assessment', deadline: '2026-08-15', category: 'Framework', status: 'Pending', assignee: 'CISO', notes: 'Biannual self-assessment against NIST Cybersecurity Framework'},
    {id: 'cc-compliance-audit-tracker-006', title: 'HIPAA Security Rule Audit', deadline: '2026-06-15', category: 'Healthcare', status: 'In Progress', assignee: 'Compliance Analyst', notes: 'Annual audit of administrative, physical, and technical safeguards'},
    {id: 'cc-compliance-audit-tracker-007', title: 'SOC 2 Type II Report Renewal', deadline: '2026-09-30', category: 'Audit', status: 'Scheduled', assignee: 'External Auditor', notes: 'Engage auditor for SOC 2 Type II examination period'},
    {id: 'cc-compliance-audit-tracker-008', title: 'FedRAMP Authorization Review', deadline: '2026-07-01', category: 'Government', status: 'Pending', assignee: 'FedRAMP PMO', notes: 'Review and update security authorization package'},
    {id: 'cc-compliance-audit-tracker-009', title: 'Annual Penetration Test', deadline: '2026-10-15', category: 'Testing', status: 'Not Started', assignee: 'Red Team Lead', notes: 'Comprehensive external and internal penetration testing engagement'},
    {id: 'cc-compliance-audit-tracker-010', title: 'Security Awareness Training Rollout', deadline: '2026-05-01', category: 'Training', status: 'Completed', assignee: 'Security Awareness Manager', notes: 'Q2 organization-wide security awareness training program'},
    {id: 'cc-compliance-audit-tracker-011', title: 'Vendor Security Review Cycle', deadline: '2026-06-01', category: 'Third Party', status: 'In Progress', assignee: 'Vendor Manager', notes: 'Quarterly review of critical vendor security posture and SLA compliance'},
    {id: 'cc-compliance-audit-tracker-012', title: 'Incident Response Plan Update', deadline: '2026-05-20', category: 'Operations', status: 'Pending', assignee: 'IR Team Lead', notes: 'Update IR procedures based on lessons learned from recent incidents'},
  ];

  private _getComplianceCalendarStats() {
    const events = this._complianceCalendarEvents;
    return {
      total: events.length,
      completed: events.filter(e => e.status === 'Completed').length,
      inProgress: events.filter(e => e.status === 'In Progress').length,
      pending: events.filter(e => e.status === 'Pending' || e.status === 'Not Started').length,
      scheduled: events.filter(e => e.status === 'Scheduled').length,
      overdue: events.filter(e => new Date(e.deadline) < new Date() && e.status !== 'Completed').length,
    };
  }

  private _renderComplianceCalendar() {
    const stats = this._getComplianceCalendarStats();
    const categoryColors: Record<string, string> = {
      'Regulatory': '#ef4444', 'Privacy': '#8b5cf6', 'Certification': '#06b6d4',
      'Payment': '#f59e0b', 'Framework': '#10b981', 'Healthcare': '#ec4899',
      'Audit': '#6366f1', 'Government': '#14b8a6', 'Testing': '#f97316',
      'Training': '#84cc16', 'Third Party': '#a855f7', 'Operations': '#0ea5e9',
    };
    return html`
      <div class="compliance-calendar-section">
        <h4 class="section-title">Security Compliance Calendar</h4>
        <div class="compliance-stats-grid">
          <div class="stat-card"><span class="stat-value">${stats.total}</span><span class="stat-label">Total Events</span></div>
          <div class="stat-card"><span class="stat-value">${stats.completed}</span><span class="stat-label">Completed</span></div>
          <div class="stat-card"><span class="stat-value">${stats.inProgress}</span><span class="stat-label">In Progress</span></div>
          <div class="stat-card"><span class="stat-value">${stats.pending}</span><span class="stat-label">Pending</span></div>
          <div class="stat-card"><span class="stat-value">${stats.scheduled}</span><span class="stat-label">Scheduled</span></div>
          <div class="stat-card"><span class="stat-value">${stats.overdue}</span><span class="stat-label">Overdue</span></div>
        </div>
        <div class="compliance-timeline">
          ${this._complianceCalendarEvents.map(event => html`
            <div class="calendar-event" style="border-left: 3px solid ${categoryColors[event.category] || '#6b7280'}">
              <div class="event-header">
                <span class="event-title">${event.title}</span>
                <span class="event-badge badge-${event.status.toLowerCase().replace(/ /g, '-')}">${event.status}</span>
              </div>
              <div class="event-meta">
                <span class="event-category" style="color: ${categoryColors[event.category]}">${event.category}</span>
                <span class="event-deadline">Due: ${event.deadline}</span>
                <span class="event-assignee">${event.assignee}</span>
              </div>
              <div class="event-notes">${event.notes}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
  // --- Security Exception Management ---
  @state() private _securityExceptions: Array<{id: string; title: string; riskLevel: string; status: string; requestor: string; approver: string; createdDate: string; expiryDate: string; compensatingControls: string[]; justification: string; lastReviewed: string}> = [
    {id: 'exc-compliance-audit-tracker-001', title: 'Legacy TLS 1.0 Exception for Payment Gateway', riskLevel: 'High', status: 'Approved', requestor: 'Infrastructure Team', approver: 'CISO', createdDate: '2026-01-15', expiryDate: '2026-07-15', compensatingControls: ['Network segmentation', 'Enhanced monitoring', 'Quarterly review'], justification: 'Third-party payment processor requires TLS 1.0; migration planned for Q3'},
    {id: 'exc-compliance-audit-tracker-002', title: 'Admin Account with Non-SSO Access', riskLevel: 'Medium', status: 'Under Review', requestor: 'DevOps Lead', approver: 'IAM Manager', createdDate: '2026-02-20', expiryDate: '2026-08-20', compensatingControls: ['MFA enforced', 'Session recording', 'Weekly access audit'], justification: 'Emergency break-glass account for critical infrastructure management'},
    {id: 'exc-compliance-audit-tracker-003', title: 'Outdated Database Version Support', riskLevel: 'High', status: 'Approved', requestor: 'DBA Team', approver: 'CTO', createdDate: '2025-12-01', expiryDate: '2026-06-01', compensatingControls: ['Isolated network zone', 'Application-layer WAF', 'Monthly patching'], justification: 'Vendor application incompatibility with newer DB version; upgrade scheduled'},
    {id: 'exc-compliance-audit-tracker-004', title: 'Public S3 Bucket for Customer Assets', riskLevel: 'Critical', status: 'Expired', requestor: 'Product Team', approver: 'CISO', createdDate: '2025-09-01', expiryDate: '2026-03-01', compensatingControls: ['Signed URLs', 'Access logging', 'Content encryption'], justification: 'Legacy customer portal requires public access for document delivery'},
    {id: 'exc-compliance-audit-tracker-005', title: 'VPN Bypass for Cloud-Native Workloads', riskLevel: 'Medium', status: 'Pending', requestor: 'Cloud Architecture', approver: 'Security Architect', createdDate: '2026-03-10', expiryDate: '2026-09-10', compensatingControls: ['Zero Trust network policies', 'mTLS between services', 'Service mesh encryption'], justification: 'Cloud-native microservices require direct connectivity for performance'},
    {id: 'exc-compliance-audit-tracker-006', title: 'Default Password Policy Override', riskLevel: 'High', status: 'Denied', requestor: 'HR Department', approver: 'CISO', createdDate: '2026-03-15', expiryDate: '2026-09-15', compensatingControls: ['Password manager deployment', 'SSO integration'], justification: 'Requested simpler password requirements for non-technical staff'},
  ];

  private _getExceptionStats() {
    const ex = this._securityExceptions;
    return {
      total: ex.length,
      approved: ex.filter(e => e.status === 'Approved').length,
      pending: ex.filter(e => e.status === 'Pending' || e.status === 'Under Review').length,
      expired: ex.filter(e => e.status === 'Expired' || e.status === 'Denied').length,
      highRisk: ex.filter(e => e.riskLevel === 'High' || e.riskLevel === 'Critical').length,
      expiringSoon: ex.filter(e => {
        const d = new Date(e.expiryDate);
        const now = new Date();
        const soon = new Date(now.getTime() + 30 * 86400000);
        return d > now && d <= soon;
      }).length,
    };
  }

  private _renderExceptionManagement() {
    const stats = this._getExceptionStats();
    const riskColors: Record<string, string> = { 'Critical': '#dc2626', 'High': '#ef4444', 'Medium': '#f59e0b', 'Low': '#22c55e' };
    return html`
      <div class="exception-mgmt-section">
        <h4 class="section-title">Security Exception Management</h4>
        <div class="exception-stats">
          <div class="exc-stat"><span class="exc-num">${stats.total}</span><span class="exc-lbl">Total</span></div>
          <div class="exc-stat"><span class="exc-num">${stats.approved}</span><span class="exc-lbl">Approved</span></div>
          <div class="exc-stat"><span class="exc-num">${stats.pending}</span><span class="exc-lbl">Pending</span></div>
          <div class="exc-stat"><span class="exc-num">${stats.expired}</span><span class="exc-lbl">Expired/Denied</span></div>
          <div class="exc-stat"><span class="exc-num">${stats.highRisk}</span><span class="exc-lbl">High Risk</span></div>
          <div class="exc-stat"><span class="exc-num">${stats.expiringSoon}</span><span class="exc-lbl">Expiring Soon</span></div>
        </div>
        <div class="exception-list">
          ${this._securityExceptions.map(exc => html`
            <div class="exception-card" data-risk="${exc.riskLevel}">
              <div class="exc-header">
                <span class="exc-title">${exc.title}</span>
                <span class="exc-risk-badge" style="background: ${riskColors[exc.riskLevel]}20; color: ${riskColors[exc.riskLevel]}">${exc.riskLevel}</span>
              </div>
              <div class="exc-details">
                <div class="exc-row"><span>Status:</span><strong>${exc.status}</strong></div>
                <div class="exc-row"><span>Requestor:</span><span>${exc.requestor}</span></div>
                <div class="exc-row"><span>Approver:</span><span>${exc.approver}</span></div>
                <div class="exc-row"><span>Expiry:</span><span>${exc.expiryDate}</span></div>
                <div class="exc-row"><span>Justification:</span><span>${exc.justification}</span></div>
              </div>
              <div class="exc-controls">
                <span class="controls-label">Compensating Controls:</span>
                ${exc.compensatingControls.map(c => html`<span class="control-tag">${c}</span>`)}
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
  // --- Security Data Quality Framework ---
  @state() private _dataQualityMetrics: Array<{id: string; dataSource: string; completenessScore: number; accuracyScore: number; timelinessScore: number; consistencyScore: number; reliabilityRank: number; lastUpdated: string; issues: string[]; trend: string}> = [
    {id: 'dq-compliance-audit-tracker-001', dataSource: 'Vulnerability Scanner Feed', completenessScore: 94, accuracyScore: 91, timelinessScore: 88, consistencyScore: 95, reliabilityRank: 1, lastUpdated: '2026-04-23T08:00:00Z', issues: ['Minor delay in Nessus plugin updates'], trend: 'improving'},
    {id: 'dq-compliance-audit-tracker-002', dataSource: 'SIEM Event Logs', completenessScore: 87, accuracyScore: 93, timelinessScore: 96, consistencyScore: 89, reliabilityRank: 2, lastUpdated: '2026-04-23T07:30:00Z', issues: ['Some log sources showing gaps in off-hours'], trend: 'stable'},
    {id: 'dq-compliance-audit-tracker-003', dataSource: 'Asset Inventory Database', completenessScore: 82, accuracyScore: 78, timelinessScore: 75, consistencyScore: 84, reliabilityRank: 4, lastUpdated: '2026-04-22T18:00:00Z', issues: ['Shadow IT devices not fully cataloged', 'Decommissioned assets still listed'], trend: 'declining'},
    {id: 'dq-compliance-audit-tracker-004', dataSource: 'Threat Intelligence Platform', completenessScore: 91, accuracyScore: 89, timelinessScore: 92, consistencyScore: 87, reliabilityRank: 3, lastUpdated: '2026-04-23T06:00:00Z', issues: ['Some IOC sources lack confidence scoring'], trend: 'improving'},
    {id: 'dq-compliance-audit-tracker-005', dataSource: 'Identity Provider Logs', completenessScore: 96, accuracyScore: 97, timelinessScore: 98, consistencyScore: 96, reliabilityRank: 1, lastUpdated: '2026-04-23T09:00:00Z', issues: [], trend: 'stable'},
    {id: 'dq-compliance-audit-tracker-006', dataSource: 'Cloud Security Posture Data', completenessScore: 79, accuracyScore: 85, timelinessScore: 82, consistencyScore: 81, reliabilityRank: 5, lastUpdated: '2026-04-23T05:00:00Z', issues: ['Multi-cloud coverage gaps', 'API rate limiting affects scan frequency'], trend: 'declining'},
    {id: 'dq-compliance-audit-tracker-007', dataSource: 'Compliance Evidence Store', completenessScore: 88, accuracyScore: 86, timelinessScore: 80, consistencyScore: 83, reliabilityRank: 4, lastUpdated: '2026-04-21T14:00:00Z', issues: ['Manual evidence collection delays', 'Inconsistent formatting across frameworks'], trend: 'stable'},
    {id: 'dq-compliance-audit-tracker-008', dataSource: 'Network Flow Data', completenessScore: 92, accuracyScore: 90, timelinessScore: 94, consistencyScore: 91, reliabilityRank: 2, lastUpdated: '2026-04-23T08:30:00Z', issues: ['Encrypted traffic classification accuracy needs improvement'], trend: 'improving'},
  ];

  private _getOverallDataQuality() {
    const m = this._dataQualityMetrics;
    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
      overallCompleteness: Math.round(avg(m.map(d => d.completenessScore))),
      overallAccuracy: Math.round(avg(m.map(d => d.accuracyScore))),
      overallTimeliness: Math.round(avg(m.map(d => d.timelinessScore))),
      overallConsistency: Math.round(avg(m.map(d => d.consistencyScore))),
      totalIssues: m.reduce((sum, d) => sum + d.issues.length, 0),
      improving: m.filter(d => d.trend === 'improving').length,
      declining: m.filter(d => d.trend === 'declining').length,
      stable: m.filter(d => d.trend === 'stable').length,
    };
  }

  private _renderDataQuality() {
    const overall = this._getOverallDataQuality();
    const scoreColor = (s: number) => s >= 90 ? '#22c55e' : s >= 80 ? '#f59e0b' : '#ef4444';
    const trendIcon = (t: string) => t === 'improving' ? '▲' : t === 'declining' ? '▼' : '■';
    const trendColor = (t: string) => t === 'improving' ? '#22c55e' : t === 'declining' ? '#ef4444' : '#6b7280';
    return html`
      <div class="data-quality-section">
        <h4 class="section-title">Security Data Quality Framework</h4>
        <div class="dq-overview">
          <div class="dq-metric">
            <div class="dq-score" style="color: ${scoreColor(overall.overallCompleteness)}">${overall.overallCompleteness}%</div>
            <div class="dq-label">Completeness</div>
          </div>
          <div class="dq-metric">
            <div class="dq-score" style="color: ${scoreColor(overall.overallAccuracy)}">${overall.overallAccuracy}%</div>
            <div class="dq-label">Accuracy</div>
          </div>
          <div class="dq-metric">
            <div class="dq-score" style="color: ${scoreColor(overall.overallTimeliness)}">${overall.overallTimeliness}%</div>
            <div class="dq-label">Timeliness</div>
          </div>
          <div class="dq-metric">
            <div class="dq-score" style="color: ${scoreColor(overall.overallConsistency)}">${overall.overallConsistency}%</div>
            <div class="dq-label">Consistency</div>
          </div>
        </div>
        <div class="dq-trend-summary">
          <span class="trend-badge improving">Improving: ${overall.improving}</span>
          <span class="trend-badge stable">Stable: ${overall.stable}</span>
          <span class="trend-badge declining">Declining: ${overall.declining}</span>
          <span class="dq-issues-total">Total Issues: ${overall.totalIssues}</span>
        </div>
        <div class="dq-sources-list">
          ${this._dataQualityMetrics.map(d => html`
            <div class="dq-source-row">
              <div class="dq-source-name">
                <span class="dq-rank">#${d.reliabilityRank}</span>
                ${d.dataSource}
                <span class="dq-trend-icon" style="color: ${trendColor(d.trend)}">${trendIcon(d.trend)}</span>
              </div>
              <div class="dq-scores">
                <span class="dq-mini-score" style="color: ${scoreColor(d.completenessScore)}">C:${d.completenessScore}</span>
                <span class="dq-mini-score" style="color: ${scoreColor(d.accuracyScore)}">A:${d.accuracyScore}</span>
                <span class="dq-mini-score" style="color: ${scoreColor(d.timelinessScore)}">T:${d.timelinessScore}</span>
                <span class="dq-mini-score" style="color: ${scoreColor(d.consistencyScore)}">Co:${d.consistencyScore}</span>
              </div>
              ${d.issues.length > 0 ? html`<div class="dq-issues">${d.issues.map(i => html`<span class="dq-issue">${i}</span>`)}</div>` : html`<span class="dq-no-issues">No issues</span>`}
            </div>
          `)}
        </div>
      </div>
    `;
  }
  // --- Security Workflow Automation ---
  @state() private _workflowTemplates: Array<{id: string; name: string; description: string; category: string; steps: number; avgDuration: string; successRate: number; lastRun: string; manualInterventions: number; optimizationScore: number}> = [
    {id: 'wf-compliance-audit-tracker-001', name: 'Vulnerability Triage Pipeline', description: 'Automated vulnerability assessment, prioritization, and assignment workflow', category: 'Vulnerability Management', steps: 8, avgDuration: '12 min', successRate: 94.5, lastRun: '2026-04-23T06:00:00Z', manualInterventions: 2, optimizationScore: 87},
    {id: 'wf-compliance-audit-tracker-002', name: 'Incident Response Orchestration', description: 'End-to-end IR workflow from detection to containment and recovery', category: 'Incident Response', steps: 15, avgDuration: '45 min', successRate: 89.2, lastRun: '2026-04-22T14:30:00Z', manualInterventions: 5, optimizationScore: 72},
    {id: 'wf-compliance-audit-tracker-003', name: 'Access Request Approval Chain', description: 'Multi-level approval workflow for privileged access requests', category: 'Identity & Access', steps: 6, avgDuration: '4 hours', successRate: 97.1, lastRun: '2026-04-23T09:15:00Z', manualInterventions: 1, optimizationScore: 92},
    {id: 'wf-compliance-audit-tracker-004', name: 'Compliance Evidence Collection', description: 'Automated gathering and packaging of audit evidence artifacts', category: 'Compliance', steps: 10, avgDuration: '30 min', successRate: 91.8, lastRun: '2026-04-21T10:00:00Z', manualInterventions: 3, optimizationScore: 78},
    {id: 'wf-compliance-audit-tracker-005', name: 'Security Patch Deployment', description: 'Staged patch rollout with validation and rollback capability', category: 'Patch Management', steps: 12, avgDuration: '2 hours', successRate: 96.3, lastRun: '2026-04-20T22:00:00Z', manualInterventions: 1, optimizationScore: 85},
    {id: 'wf-compliance-audit-tracker-006', name: 'Threat Intelligence Enrichment', description: 'IOC enrichment and correlation with internal threat data', category: 'Threat Intelligence', steps: 7, avgDuration: '8 min', successRate: 93.7, lastRun: '2026-04-23T07:00:00Z', manualInterventions: 0, optimizationScore: 95},
    {id: 'wf-compliance-audit-tracker-007', name: 'Security Reporting Pipeline', description: 'Automated generation and distribution of security metrics reports', category: 'Reporting', steps: 5, avgDuration: '15 min', successRate: 98.9, lastRun: '2026-04-23T08:00:00Z', manualInterventions: 0, optimizationScore: 97},
    {id: 'wf-compliance-audit-tracker-008', name: 'Vendor Risk Assessment', description: 'Automated vendor security questionnaire distribution and scoring', category: 'Third Party', steps: 9, avgDuration: '3 days', successRate: 85.4, lastRun: '2026-04-19T11:00:00Z', manualInterventions: 4, optimizationScore: 65},
  ];

  @state() private _workflowExecutionHistory: Array<{workflowId: string; runDate: string; duration: string; status: string; trigger: string}> = [
    {workflowId: 'wf-compliance-audit-tracker-001', runDate: '2026-04-23T06:00:00Z', duration: '11 min 23 sec', status: 'Success', trigger: 'Scheduled'},
    {workflowId: 'wf-compliance-audit-tracker-002', runDate: '2026-04-22T14:30:00Z', duration: '42 min 15 sec', status: 'Success', trigger: 'Alert'},
    {workflowId: 'wf-compliance-audit-tracker-003', runDate: '2026-04-23T09:15:00Z', duration: '3h 45 min', status: 'Success', trigger: 'User Request'},
    {workflowId: 'wf-compliance-audit-tracker-001', runDate: '2026-04-22T06:00:00Z', duration: '13 min 08 sec', status: 'Partial', trigger: 'Scheduled'},
    {workflowId: 'wf-compliance-audit-tracker-004', runDate: '2026-04-21T10:00:00Z', duration: '28 min 42 sec', status: 'Success', trigger: 'Scheduled'},
  ];

  private _renderWorkflowAutomation() {
    const avgSuccessRate = Math.round(this._workflowTemplates.reduce((s, w) => s + w.successRate, 0) / this._workflowTemplates.length * 10) / 10;
    const totalManualInterventions = this._workflowTemplates.reduce((s, w) => s + w.manualInterventions, 0);
    const avgOptimization = Math.round(this._workflowTemplates.reduce((s, w) => s + w.optimizationScore, 0) / this._workflowTemplates.length);
    return html`
      <div class="workflow-automation-section">
        <h4 class="section-title">Security Workflow Automation</h4>
        <div class="wf-summary">
          <div class="wf-summary-item"><span class="wf-num">${this._workflowTemplates.length}</span><span class="wf-lbl">Templates</span></div>
          <div class="wf-summary-item"><span class="wf-num">${avgSuccessRate}%</span><span class="wf-lbl">Avg Success</span></div>
          <div class="wf-summary-item"><span class="wf-num">${totalManualInterventions}</span><span class="wf-lbl">Manual Steps</span></div>
          <div class="wf-summary-item"><span class="wf-num">${avgOptimization}%</span><span class="wf-lbl">Optimization</span></div>
        </div>
        <div class="wf-template-list">
          ${this._workflowTemplates.map(wf => html`
            <div class="wf-template-card">
              <div class="wf-template-header">
                <span class="wf-name">${wf.name}</span>
                <span class="wf-category">${wf.category}</span>
              </div>
              <div class="wf-template-desc">${wf.description}</div>
              <div class="wf-template-meta">
                <span>${wf.steps} steps</span>
                <span>Avg: ${wf.avgDuration}</span>
                <span>Success: ${wf.successRate}%</span>
                <span>Opt: ${wf.optimizationScore}%</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
  // --- Security Knowledge Base ---
  @state() private _knowledgeArticles: Array<{id: string; title: string; category: string; author: string; publishDate: string; views: number; rating: number; tags: string[]; summary: string; readTime: string}> = [
    {id: 'kb-compliance-audit-tracker-001', title: 'Zero Trust Architecture Implementation Guide', category: 'Architecture', author: 'Security Architecture Team', publishDate: '2026-03-15', views: 1842, rating: 4.8, tags: ['zero-trust', 'network', 'identity'], summary: 'Comprehensive guide for implementing zero trust principles across enterprise infrastructure', readTime: '15 min'},
    {id: 'kb-compliance-audit-tracker-002', title: 'Ransomware Defense Playbook 2026', category: 'Threats', author: 'Threat Intelligence Team', publishDate: '2026-04-01', views: 2341, rating: 4.9, tags: ['ransomware', 'incident-response', 'defense'], summary: 'Updated playbook with latest ransomware tactics, techniques, and defensive measures', readTime: '12 min'},
    {id: 'kb-compliance-audit-tracker-003', title: 'Cloud Security Best Practices for Multi-Cloud', category: 'Cloud', author: 'Cloud Security Team', publishDate: '2026-02-28', views: 1567, rating: 4.5, tags: ['cloud', 'aws', 'azure', 'gcp'], summary: 'Best practices for securing workloads across multiple cloud service providers', readTime: '18 min'},
    {id: 'kb-compliance-audit-tracker-004', title: 'API Security Testing Methodology', category: 'Testing', author: 'Red Team', publishDate: '2026-03-22', views: 987, rating: 4.6, tags: ['api', 'testing', 'owasp'], summary: 'Structured methodology for identifying and testing API security vulnerabilities', readTime: '10 min'},
    {id: 'kb-compliance-audit-tracker-005', title: 'Supply Chain Security Risk Management', category: 'Third Party', author: 'GRC Team', publishDate: '2026-01-20', views: 1234, rating: 4.3, tags: ['supply-chain', 'vendor', 'risk'], summary: 'Framework for managing security risks in the software supply chain', readTime: '14 min'},
    {id: 'kb-compliance-audit-tracker-006', title: 'Kubernetes Security Hardening Checklist', category: 'Container', author: 'Platform Security', publishDate: '2026-04-10', views: 2103, rating: 4.7, tags: ['kubernetes', 'container', 'hardening'], summary: 'Step-by-step hardening checklist for production Kubernetes clusters', readTime: '11 min'},
    {id: 'kb-compliance-audit-tracker-007', title: 'Security Metrics That Matter for Executives', category: 'Metrics', author: 'CISO Office', publishDate: '2026-03-05', views: 876, rating: 4.4, tags: ['metrics', 'kpi', 'reporting'], summary: 'Key security metrics and KPIs that resonate with board-level stakeholders', readTime: '8 min'},
    {id: 'kb-compliance-audit-tracker-008', title: 'Phishing Simulation Campaign Design', category: 'Awareness', author: 'Security Awareness Team', publishDate: '2026-02-15', views: 1456, rating: 4.5, tags: ['phishing', 'simulation', 'training'], summary: 'Designing effective phishing simulations that drive real behavioral change', readTime: '9 min'},
    {id: 'kb-compliance-audit-tracker-009', title: 'Data Loss Prevention Strategy and Implementation', category: 'Data Protection', author: 'Data Security Team', publishDate: '2026-03-28', views: 1678, rating: 4.6, tags: ['dlp', 'data-protection', 'compliance'], summary: 'Strategic approach to DLP covering people, process, and technology layers', readTime: '16 min'},
    {id: 'kb-compliance-audit-tracker-010', title: 'Security Automation with SOAR Platforms', category: 'Automation', author: 'SOC Engineering', publishDate: '2026-04-05', views: 1098, rating: 4.7, tags: ['soar', 'automation', 'soc'], summary: 'Building effective security automation playbooks using SOAR technology', readTime: '13 min'},
    {id: 'kb-compliance-audit-tracker-011', title: 'Third-Party Risk Assessment Framework', category: 'GRC', author: 'Vendor Management', publishDate: '2026-01-30', views: 1345, rating: 4.4, tags: ['vendor', 'risk', 'assessment'], summary: 'Structured framework for evaluating and monitoring third-party security risks', readTime: '12 min'},
    {id: 'kb-compliance-audit-tracker-012', title: 'Network Detection and Response Best Practices', category: 'Network', author: 'Network Security Team', publishDate: '2026-03-18', views: 1567, rating: 4.5, tags: ['ndr', 'network', 'detection'], summary: 'Implementing effective network detection and response capabilities', readTime: '14 min'},
    {id: 'kb-compliance-audit-tracker-013', title: 'Security Chaos Engineering Guide', category: 'Resilience', author: 'SRE Security', publishDate: '2026-04-12', views: 789, rating: 4.3, tags: ['chaos-engineering', 'resilience', 'testing'], summary: 'Applying chaos engineering principles to validate security controls', readTime: '10 min'},
    {id: 'kb-compliance-audit-tracker-014', title: 'Incident Communication Templates', category: 'Incident Response', author: 'IR Team', publishDate: '2026-02-22', views: 2234, rating: 4.8, tags: ['incident', 'communication', 'templates'], summary: 'Ready-to-use communication templates for security incident scenarios', readTime: '7 min'},
    {id: 'kb-compliance-audit-tracker-015', title: 'Endpoint Detection and Response Configuration', category: 'Endpoint', author: 'Endpoint Security', publishDate: '2026-03-08', views: 1345, rating: 4.5, tags: ['edr', 'endpoint', 'configuration'], summary: 'Optimal EDR configuration for maximum detection with minimal false positives', readTime: '11 min'},
    {id: 'kb-compliance-audit-tracker-016', title: 'Security Code Review Standards', category: 'Development', author: 'AppSec Team', publishDate: '2026-02-10', views: 1890, rating: 4.6, tags: ['code-review', 'secure-sdlc', 'standards'], summary: 'Standards and checklists for security-focused code reviews', readTime: '13 min'},
    {id: 'kb-compliance-audit-tracker-017', title: 'IoT Security Assessment Methodology', category: 'IoT', author: 'IoT Security Lab', publishDate: '2026-04-08', views: 654, rating: 4.2, tags: ['iot', 'embedded', 'assessment'], summary: 'Methodology for assessing security posture of IoT devices and ecosystems', readTime: '15 min'},
    {id: 'kb-compliance-audit-tracker-018', title: 'Passwordless Authentication Migration Guide', category: 'Identity', author: 'IAM Team', publishDate: '2026-03-25', views: 1678, rating: 4.7, tags: ['passwordless', 'authentication', 'mfa'], summary: 'Step-by-step migration plan from password-based to passwordless authentication', readTime: '12 min'},
    {id: 'kb-compliance-audit-tracker-019', title: 'Security Awareness Program Metrics', category: 'Awareness', author: 'Security Culture Team', publishDate: '2026-01-25', views: 1123, rating: 4.4, tags: ['awareness', 'metrics', 'culture'], summary: 'Measuring the effectiveness of your security awareness and training programs', readTime: '9 min'},
    {id: 'kb-compliance-audit-tracker-020', title: 'Deception Technology Deployment Guide', category: 'Detection', author: 'Blue Team', publishDate: '2026-04-15', views: 876, rating: 4.5, tags: ['deception', 'honeypot', 'detection'], summary: 'Planning and deploying deception technology for advanced threat detection', readTime: '11 min'},
  ];

  @state() private _kbSearchQuery = '';
  @state() private _kbSelectedCategory = '';

  private _getKbCategories(): string[] {
    return [...new Set(this._knowledgeArticles.map(a => a.category))].sort();
  }

  private _getFilteredArticles(): typeof this._knowledgeArticles {
    let articles = this._knowledgeArticles;
    if (this._kbSearchQuery) {
      const q = this._kbSearchQuery.toLowerCase();
      articles = articles.filter(a => a.title.toLowerCase().includes(q) || a.tags.some(t => t.includes(q)) || a.summary.toLowerCase().includes(q));
    }
    if (this._kbSelectedCategory) {
      articles = articles.filter(a => a.category === this._kbSelectedCategory);
    }
    return articles.sort((a, b) => b.views - a.views);
  }

  private _renderKnowledgeBase() {
    const categories = this._getKbCategories();
    const filtered = this._getFilteredArticles();
    const topArticles = [...this._knowledgeArticles].sort((a, b) => b.views - a.views).slice(0, 5);
    const gapAreas = ['Container Runtime Security', 'AI/ML Security', 'Quantum Computing Threats', '5G Network Security'];
    return html`
      <div class="knowledge-base-section">
        <h4 class="section-title">Security Knowledge Base</h4>
        <div class="kb-controls">
          <input type="text" class="kb-search" placeholder="Search articles, tags..." .value=${this._kbSearchQuery} @input=${(e: Event) => { this._kbSearchQuery = (e.target as HTMLInputElement).value; }} />
          <select class="kb-category-filter" @change=${(e: Event) => { this._kbSelectedCategory = (e.target as HTMLSelectElement).value; }}>
            <option value="">All Categories</option>
            ${categories.map(c => html`<option value="${c}" ?selected=${this._kbSelectedCategory === c}>${c}</option>`)}
          </select>
        </div>
        <div class="kb-sidebar">
          <div class="kb-popular">
            <h5>Most Popular</h5>
            ${topArticles.map((a, i) => html`
              <div class="kb-popular-item">
                <span class="kb-rank">${i + 1}</span>
                <span class="kb-popular-title">${a.title}</span>
                <span class="kb-views">${a.views.toLocaleString()} views</span>
              </div>
            `)}
          </div>
          <div class="kb-gaps">
            <h5>Knowledge Gaps</h5>
            ${gapAreas.map(g => html`<span class="kb-gap-tag">${g}</span>`)}
          </div>
        </div>
        <div class="kb-article-grid">
          ${filtered.map(a => html`
            <div class="kb-article-card">
              <div class="kb-article-header">
                <span class="kb-article-title">${a.title}</span>
                <span class="kb-article-category">${a.category}</span>
              </div>
              <div class="kb-article-summary">${a.summary}</div>
              <div class="kb-article-footer">
                <span>${a.author}</span>
                <span>${a.readTime}</span>
                <span>Views: ${a.views}</span>
                <span>Rating: ${'\u2605'.repeat(Math.round(a.rating))}</span>
              </div>
              <div class="kb-article-tags">${a.tags.map(t => html`<span class="kb-tag">${t}</span>`)}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }


  // ─── Security Communication Hub ───
  private _stakeholders = [
    {id:"sh-01",name:"Board of Directors",role:"Governance",channel:"Quarterly Report",frequency:"quarterly",lastContact:"2024-06-15",engagement:85},
    {id:"sh-02",name:"C-Suite Executives",role:"Strategic Oversight",channel:"Monthly Briefing",frequency:"monthly",lastContact:"2024-07-01",engagement:92},
    {id:"sh-03",name:"Engineering Leadership",role:"Technical Decisions",channel:"Bi-weekly Sync",frequency:"biweekly",lastContact:"2024-07-08",engagement:88},
    {id:"sh-04",name:"Dev Teams",role:"Implementation",channel:"Slack + Wiki",frequency:"continuous",lastContact:"2024-07-10",engagement:72},
    {id:"sh-05",name:"Legal & Compliance",role:"Regulatory",channel:"Monthly Review",frequency:"monthly",lastContact:"2024-07-05",engagement:78},
    {id:"sh-06",name:"HR Department",role:"Policy Enforcement",channel:"Email Digest",frequency:"monthly",lastContact:"2024-07-03",engagement:65},
    {id:"sh-07",name:"External Auditors",role:"Assessment",channel:"Formal Reports",frequency:"quarterly",lastContact:"2024-06-20",engagement:90},
    {id:"sh-08",name:"Third-Party Vendors",role:"Supply Chain",channel:"Portal + Email",frequency:"asneeded",lastContact:"2024-07-09",engagement:55}
  ];

  private _commTemplates = [
    {id:"tpl-01",name:"Security Incident Notification",type:"incident",lastUsed:"2024-07-08",usageCount:12,avgResponseTime:"4.2h"},
    {id:"tpl-02",name:"Monthly Security Report",type:"report",lastUsed:"2024-07-01",usageCount:6,avgResponseTime:"24h"},
    {id:"tpl-03",name:"Vulnerability Advisory",type:"advisory",lastUsed:"2024-07-10",usageCount:34,avgResponseTime:"2.1h"},
    {id:"tpl-04",name:"Policy Update Announcement",type:"policy",lastUsed:"2024-06-28",usageCount:8,avgResponseTime:"48h"},
    {id:"tpl-05",name:"Training Completion Reminder",type:"training",lastUsed:"2024-07-05",usageCount:15,avgResponseTime:"72h"},
    {id:"tpl-06",name:"Audit Preparation Checklist",type:"compliance",lastUsed:"2024-06-15",usageCount:3,avgResponseTime:"168h"},
    {id:"tpl-07",name:"Executive Risk Summary",type:"executive",lastUsed:"2024-07-01",usageCount:6,avgResponseTime:"12h"},
    {id:"tpl-08",name:"Vendor Security Assessment Request",type:"vendor",lastUsed:"2024-07-09",usageCount:22,avgResponseTime:"336h"}
  ];

  private _getCommEffectivenessMetrics(): Record<string,number> {
    const avgEngagement = Math.round(this._stakeholders.reduce((s, sh) => s + sh.engagement, 0) / this._stakeholders.length);
    const totalCommunications = this._commTemplates.reduce((s, t) => s + t.usageCount, 0);
    const templateUtilization = this._commTemplates.filter(t => t.usageCount > 5).length / this._commTemplates.length * 100;
    const responseRate = Math.round(85 + Math.random() * 10);
    return {avgEngagement, totalCommunications, templateUtilization: Math.round(templateUtilization), responseRate};
  }

  private _getUpcomingCommunications(): Array<{date:string;type:string;audience:string;template:string;status:string}> {
    return [
      {date:"2024-07-15",type:"Monthly Security Report",audience:"C-Suite",template:"Monthly Security Report",status:"scheduled"},
      {date:"2024-07-18",type:"Vulnerability Patch Advisory",audience:"Engineering",template:"Vulnerability Advisory",status:"draft"},
      {date:"2024-07-22",type:"Q3 Compliance Review",audience:"Legal & Compliance",template:"Audit Preparation Checklist",status:"pending"},
      {date:"2024-07-25",type:"Security Training Push",audience:"All Staff",template:"Training Completion Reminder",status:"scheduled"},
      {date:"2024-08-01",type:"Board Security Brief",audience:"Board",template:"Executive Risk Summary",status:"planning"}
    ];
  }

  private _getFeedbackSummary(): Array<{category:string;positive:number;neutral:number;negative:number;avgScore:number}> {
    return [
      {category:"Report Clarity",positive:42,neutral:8,negative:3,avgScore:4.2},
      {category:"Timeliness",positive:35,neutral:12,negative:6,avgScore:3.8},
      {category:"Actionability",positive:28,neutral:15,negative:10,avgScore:3.5},
      {category:"Completeness",positive:38,neutral:10,negative:5,avgScore:4.0},
      {category:"Format Preference",positive:30,neutral:18,negative:5,avgScore:3.9}
    ];
  }



  // ── Security Risk Appetite Framework ──────────────────────────────
  private _riskAppetiteCategories: Array<{name: string; appetite: number; tolerance: number; capacity: number; status: string}> = [
    { name: 'Financial', appetite: 75, tolerance: 60, capacity: 90, status: 'within' },
    { name: 'Operational', appetite: 70, tolerance: 55, capacity: 85, status: 'within' },
    { name: 'Reputational', appetite: 65, tolerance: 50, capacity: 80, status: 'within' },
    { name: 'Regulatory', appetite: 55, tolerance: 40, capacity: 75, status: 'within' },
    { name: 'Strategic', appetite: 60, tolerance: 45, capacity: 70, status: 'within' },
    { name: 'Technology', appetite: 70, tolerance: 55, capacity: 85, status: 'within' },
  ];
  private _riskAppetiteReviewCycle: Array<{cycle: string; lastReview: string; nextReview: string; reviewer: string; status: string}> = [];
  private _riskCapacityScore: number = 82;
  private _riskAppetiteDocRef: string = 'BOARD-RISK-2026-001';

  private _initRiskAppetiteFramework(): void {
    const cycles = ['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'];
    const reviewers = ['CISO', 'CRO', 'Board Risk Committee', 'Audit Committee'];
    const statuses = ['completed', 'in-progress', 'scheduled', 'scheduled'];
    this._riskAppetiteReviewCycle = cycles.map((c, i) => ({
      cycle: c,
      lastReview: i === 0 ? '2026-01-15' : '',
      nextReview: `2026-${(i + 1) * 3 > 12 ? 12 : (i + 1) * 3}-01`,
      reviewer: reviewers[i],
      status: statuses[i],
    }));
    this._riskCapacityScore = this._calculateRiskCapacity();
  }

  private _calculateRiskCapacity(): number {
    const totalCapacity = this._riskAppetiteCategories.reduce((s, c) => s + c.capacity, 0);
    const totalAppetite = this._riskAppetiteCategories.reduce((s, c) => s + c.appetite, 0);
    return Math.round((totalCapacity / (this._riskAppetiteCategories.length * 100)) * 100);
  }

  private _getRiskAppetiteComparison(category: string): {actual: number; appetite: number; delta: number; trend: string} {
    const cat = this._riskAppetiteCategories.find(c => c.name === category);
    if (!cat) return { actual: 0, appetite: 0, delta: 0, trend: 'stable' };
    const actual = cat.appetite + Math.round((Math.random() - 0.5) * 20);
    const delta = actual - cat.appetite;
    return { actual, appetite: cat.appetite, delta, trend: delta > 5 ? 'increasing' : delta < -5 ? 'decreasing' : 'stable' };
  }

  private _renderRiskAppetiteGauge(value: number, max: number, label: string): string {
    const pct = Math.min(100, Math.round((value / max) * 100));
    const color = pct < 40 ? '#ef4444' : pct < 70 ? '#f59e0b' : '#22c55e';
    return `<div style="margin:4px 0"><div style="display:flex;justify-content:space-between;font-size:11px"><span>${label}</span><span>${pct}%</span></div><div style="height:6px;background:#1e293b;border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${color};border-radius:3px;transition:width 0.3s"></div></div></div>`;
  }

  private _renderRiskAppetiteFramework(): string {
    if (this._riskAppetiteReviewCycle.length === 0) this._initRiskAppetiteFramework();
    let html = `<div style="padding:12px"><h4 style="margin:0 0 8px;color:#f1f5f9">Risk Appetite Framework</h4>`;
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">`;
    for (const cat of this._riskAppetiteCategories) {
      const comp = this._getRiskAppetiteComparison(cat.name);
      const trendIcon = comp.trend === 'increasing' ? '▲' : comp.trend === 'decreasing' ? '▼' : '◆';
      const trendColor = comp.trend === 'increasing' ? '#ef4444' : comp.trend === 'decreasing' ? '#22c55e' : '#64748b';
      html += `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:8px">`;
      html += `<div style="font-size:12px;font-weight:600;color:#e2e8f0;margin-bottom:4px">${cat.name}</div>`;
      html += this._renderRiskAppetiteGauge(comp.actual, 100, 'Actual');
      html += this._renderRiskAppetiteGauge(comp.appetite, 100, 'Appetite');
      html += `<div style="font-size:10px;color:${trendColor};margin-top:2px">${trendIcon} ${comp.trend} (delta: ${comp.delta > 0 ? '+' : ''}${comp.delta})</div>`;
      html += `</div>`;
    }
    html += `</div>`;
    html += `<div style="margin-top:8px;padding:8px;background:#0f172a;border-radius:6px;border:1px solid #1e293b">`;
    html += `<div style="font-size:11px;color:#94a3b8">Risk Capacity Score: <strong style="color:#22c55e">${this._riskCapacityScore}%</strong></div>`;
    html += `<div style="font-size:10px;color:#64748b;margin-top:2px">Board Doc: ${this._riskAppetiteDocRef}</div>`;
    html += `</div></div>`;
    return html;
  }

  // ── Security Incident Severity Calculator ─────────────────────────
  private _severityFactors: Array<{factor: string; weight: number; score: number; maxScore: number}> = [];
  private _severityHistory: Array<{month: string; critical: number; high: number; medium: number; low: number}> = [];
  private _escalationThresholds: Array<{level: string; minScore: number; action: string; notify: string}> = [];

  private _initSeverityCalculator(): void {
    this._severityFactors = [
      { factor: 'Business Impact', weight: 0.35, score: 7, maxScore: 10 },
      { factor: 'Likelihood of Recurrence', weight: 0.20, score: 6, maxScore: 10 },
      { factor: 'Scope Affected', weight: 0.20, score: 8, maxScore: 10 },
      { factor: 'Data Sensitivity', weight: 0.15, score: 5, maxScore: 10 },
      { factor: 'Recovery Complexity', weight: 0.10, score: 4, maxScore: 10 },
    ];
    this._severityHistory = [
      { month: 'Jan', critical: 2, high: 5, medium: 18, low: 32 },
      { month: 'Feb', critical: 1, high: 4, medium: 15, low: 28 },
      { month: 'Mar', critical: 3, high: 7, medium: 22, low: 35 },
      { month: 'Apr', critical: 1, high: 3, medium: 14, low: 25 },
    ];
    this._escalationThresholds = [
      { level: 'P1 Critical', minScore: 8.5, action: 'Immediate CISO notification', notify: 'CISO, CTO, Legal' },
      { level: 'P2 High', minScore: 7.0, action: 'Escalate within 1 hour', notify: 'SOC Lead, IR Team' },
      { level: 'P3 Medium', minScore: 5.0, action: 'Track and respond within 4 hours', notify: 'SOC Analyst' },
      { level: 'P4 Low', minScore: 3.0, action: 'Log and monitor', notify: 'Auto-triage' },
    ];
  }

  private _calculateSeverityScore(): number {
    const totalWeighted = this._severityFactors.reduce((s, f) => s + (f.score / f.maxScore) * f.weight, 0);
    return Math.round(totalWeighted * 10 * 100) / 100;
  }

  private _getSeverityLevel(score: number): {level: string; color: string; bg: string} {
    if (score >= 8.5) return { level: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
    if (score >= 7.0) return { level: 'High', color: '#f97316', bg: 'rgba(249,115,22,0.15)' };
    if (score >= 5.0) return { level: 'Medium', color: '#eab308', bg: 'rgba(234,179,8,0.15)' };
    if (score >= 3.0) return { level: 'Low', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' };
    return { level: 'Info', color: '#64748b', bg: 'rgba(100,116,139,0.15)' };
  }

  private _getSeverityTrend(): string {
    if (this._severityHistory.length < 2) return 'stable';
    const recent = this._severityHistory.slice(-2);
    const prevTotal = recent[0].critical * 4 + recent[0].high * 3 + recent[0].medium * 2;
    const currTotal = recent[1].critical * 4 + recent[1].high * 3 + recent[1].medium * 2;
    return currTotal > prevTotal ? 'increasing' : currTotal < prevTotal ? 'decreasing' : 'stable';
  }

  private _renderSeverityMatrix(): string {
    const matrix = [['Low', 'Med', 'High', 'Crit'], ['High', 'Crit', 'Crit', 'Crit'], ['Med', 'High', 'High', 'Crit'], ['Low', 'Med', 'High', 'High']];
    const colors = [['#22c55e', '#eab308', '#f97316', '#ef4444'], ['#eab308', '#ef4444', '#ef4444', '#ef4444'], ['#22c55e', '#eab308', '#f97316', '#ef4444'], ['#22c55e', '#22c55e', '#eab308', '#f97316']];
    const labels = ['High', 'Medium', 'Low', 'Minimal'];
    let html = `<div style="display:grid;grid-template-columns:60px repeat(4,1fr);gap:2px;font-size:10px">`;
    html += `<div></div>`;
    for (const l of matrix[0]) html += `<div style="text-align:center;color:#94a3b8;padding:2px">${l}</div>`;
    for (let i = 0; i < 4; i++) {
      html += `<div style="color:#94a3b8;padding:2px;display:flex;align-items:center">${labels[i]}</div>`;
      for (let j = 0; j < 4; j++) {
        html += `<div style="background:${colors[i][j]};color:#000;font-weight:600;padding:4px;text-align:center;border-radius:2px">${matrix[i][j]}</div>`;
      }
    }
    html += `</div>`;
    return html;
  }

  private _renderSeverityCalculator(): string {
    if (this._severityFactors.length === 0) this._initSeverityCalculator();
    const score = this._calculateSeverityScore();
    const sev = this._getSeverityLevel(score);
    const trend = this._getSeverityTrend();
    let html = `<div style="padding:12px"><h4 style="margin:0 0 8px;color:#f1f5f9">Incident Severity Calculator</h4>`;
    html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">`;
    html += `<div style="font-size:24px;font-weight:700;color:${sev.color}">${score}</div>`;
    html += `<div style="padding:4px 8px;background:${sev.bg};color:${sev.color};border-radius:4px;font-size:12px;font-weight:600">${sev.level}</div>`;
    html += `<div style="font-size:10px;color:#94a3b8">Trend: ${trend}</div>`;
    html += `</div>`;
    html += `<div style="margin-bottom:8px"><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Factors:</div>`;
    for (const f of this._severityFactors) {
      const pct = Math.round((f.score / f.maxScore) * 100);
      html += `<div style="display:flex;align-items:center;gap:6px;margin:2px 0"><span style="font-size:10px;color:#cbd5e1;width:120px">${f.factor}</span><div style="flex:1;height:4px;background:#1e293b;border-radius:2px"><div style="height:100%;width:${pct}%;background:#3b82f6;border-radius:2px"></div></div><span style="font-size:10px;color:#64748b">${f.score}/${f.maxScore}</span></div>`;
    }
    html += `</div>`;
    html += `<div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Escalation Thresholds:</div>`;
    for (const t of this._escalationThresholds) {
      const color = t.minScore >= 8.5 ? '#ef4444' : t.minScore >= 7 ? '#f97316' : t.minScore >= 5 ? '#eab308' : '#3b82f6';
      html += `<div style="font-size:10px;color:#cbd5e1;margin:2px 0;padding:2px 4px;background:#0f172a;border-left:3px solid ${color};border-radius:2px">${t.level} (${t.minScore}+) - ${t.action}</div>`;
    }
    html += `</div></div>`;
    return html;
  }

  // ── Security Tool Efficacy Tracker ────────────────────────────────
  private _securityTools: Array<{name: string; category: string; efficacy: number; utilization: number; costPerDetection: number; overlap: number; roi: number; status: string}> = [];
  private _toolEfficacyHistory: Array<{month: string; avgEfficacy: number; avgUtilization: number; totalDetections: number; totalCost: number}> = [];

  private _initToolEfficacyTracker(): void {
    this._securityTools = [
      { name: 'SIEM Platform', category: 'Detection', efficacy: 87, utilization: 92, costPerDetection: 12.5, overlap: 15, roi: 340, status: 'optimal' },
      { name: 'EDR Solution', category: 'Endpoint', efficacy: 91, utilization: 88, costPerDetection: 8.3, overlap: 10, roi: 420, status: 'optimal' },
      { name: 'WAF', category: 'Network', efficacy: 78, utilization: 95, costPerDetection: 5.2, overlap: 22, roi: 280, status: 'review' },
      { name: 'DLP Suite', category: 'Data', efficacy: 72, utilization: 65, costPerDetection: 18.7, overlap: 8, roi: 180, status: 'underutilized' },
      { name: 'Vulnerability Scanner', category: 'Assessment', efficacy: 85, utilization: 80, costPerDetection: 6.1, overlap: 12, roi: 360, status: 'optimal' },
      { name: 'Threat Intel Feed', category: 'Intelligence', efficacy: 69, utilization: 70, costPerDetection: 22.0, overlap: 18, roi: 150, status: 'review' },
      { name: 'CASB', category: 'Cloud', efficacy: 76, utilization: 58, costPerDetection: 15.3, overlap: 14, roi: 200, status: 'underutilized' },
      { name: 'SOAR Platform', category: 'Orchestration', efficacy: 83, utilization: 75, costPerDetection: 10.8, overlap: 20, roi: 300, status: 'optimal' },
      { name: 'Email Gateway', category: 'Email', efficacy: 89, utilization: 97, costPerDetection: 3.2, overlap: 5, roi: 480, status: 'optimal' },
      { name: 'IAM System', category: 'Identity', efficacy: 81, utilization: 82, costPerDetection: 14.1, overlap: 11, roi: 250, status: 'optimal' },
    ];
    this._toolEfficacyHistory = [
      { month: 'Jan', avgEfficacy: 78, avgUtilization: 76, totalDetections: 1240, totalCost: 18500 },
      { month: 'Feb', avgEfficacy: 80, avgUtilization: 78, totalDetections: 1380, totalCost: 19200 },
      { month: 'Mar', avgEfficacy: 82, avgUtilization: 80, totalDetections: 1520, totalCost: 19800 },
      { month: 'Apr', avgEfficacy: 81, avgUtilization: 81, totalDetections: 1450, totalCost: 20100 },
    ];
  }

  private _getToolROIranking(): Array<{name: string; roi: number; rank: number}> {
    const sorted = [...this._securityTools].sort((a, b) => b.roi - a.roi);
    return sorted.map((t, i) => ({ name: t.name, roi: t.roi, rank: i + 1 }));
  }

  private _getToolReplacementRecommendations(): Array<{tool: string; reason: string; suggestion: string; savings: number}> {
    return [
      { tool: 'DLP Suite', reason: 'Low utilization (65%) and high cost-per-detection', suggestion: 'Consider consolidation with CASB', savings: 35000 },
      { tool: 'Threat Intel Feed', reason: 'High overlap (18%) with SIEM native feeds', suggestion: 'Reduce feed tier or integrate with SIEM', savings: 22000 },
    ];
  }

  private _renderToolEfficacyTracker(): string {
    if (this._securityTools.length === 0) this._initToolEfficacyTracker();
    let html = `<div style="padding:12px"><h4 style="margin:0 0 8px;color:#f1f5f9">Security Tool Efficacy</h4>`;
    const ranked = this._getToolROIranking();
    html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px">`;
    for (let i = 0; i < 5; i++) {
      const t = ranked[i];
      const color = i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : '#64748b';
      html += `<div style="display:flex;align-items:center;gap:6px;padding:3px 6px;background:#0f172a;border-radius:4px">`;
      html += `<span style="font-size:12px;color:${color};font-weight:700">#${t.rank}</span>`;
      html += `<span style="font-size:10px;color:#cbd5e1;flex:1">${t.name}</span>`;
      html += `<span style="font-size:10px;color:#22c55e">${t.roi}%</span></div>`;
    }
    html += `</div>`;
    const recs = this._getToolReplacementRecommendations();
    if (recs.length > 0) {
      html += `<div style="font-size:11px;color:#f59e0b;margin-bottom:4px">Replacement Recommendations:</div>`;
      for (const r of recs) {
        html += `<div style="padding:4px 6px;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:4px;margin-bottom:4px">`;
        html += `<div style="font-size:10px;color:#fbbf24;font-weight:600">${r.tool}</div>`;
        html += `<div style="font-size:9px;color:#94a3b8">${r.reason}</div>`;
        html += `<div style="font-size:9px;color:#22c55e">Est. savings: $${r.savings.toLocaleString()}/yr - ${r.suggestion}</div></div>`;
      }
    }
    html += `</div>`;
    return html;
  }

  // ── Security Regulatory Mapping ───────────────────────────────────
  private _regulations: Array<{name: string; controls: number; overlap: number; effort: number; status: string; lastAudit: string}> = [];
  private _crossRegulationMatrix: Array<{source: string; target: string; commonControls: number; gaps: number}> = [];

  private _initRegulatoryMapping(): void {
    this._regulations = [
      { name: 'GDPR', controls: 78, overlap: 42, effort: 85, status: 'compliant', lastAudit: '2026-02-15' },
      { name: 'HIPAA', controls: 62, overlap: 35, effort: 78, status: 'compliant', lastAudit: '2026-01-20' },
      { name: 'PCI DSS', controls: 55, overlap: 28, effort: 72, status: 'partial', lastAudit: '2025-11-10' },
      { name: 'SOX', controls: 48, overlap: 30, effort: 68, status: 'compliant', lastAudit: '2026-03-01' },
      { name: 'ISO 27001', controls: 93, overlap: 55, effort: 90, status: 'certified', lastAudit: '2026-01-05' },
    ];
    const regNames = this._regulations.map(r => r.name);
    this._crossRegulationMatrix = [];
    for (let i = 0; i < regNames.length; i++) {
      for (let j = i + 1; j < regNames.length; j++) {
        this._crossRegulationMatrix.push({
          source: regNames[i], target: regNames[j],
          commonControls: Math.round(15 + Math.random() * 25),
          gaps: Math.round(Math.random() * 8),
        });
      }
    }
  }

  private _getUnifiedControlSet(): Array<{control: string; regulations: string[]; coverage: number}> {
    return [
      { control: 'Access Control', regulations: ['GDPR', 'HIPAA', 'PCI DSS', 'SOX', 'ISO 27001'], coverage: 100 },
      { control: 'Encryption', regulations: ['GDPR', 'HIPAA', 'PCI DSS', 'ISO 27001'], coverage: 80 },
      { control: 'Audit Logging', regulations: ['SOX', 'PCI DSS', 'ISO 27001'], coverage: 60 },
      { control: 'Incident Response', regulations: ['GDPR', 'HIPAA', 'ISO 27001'], coverage: 60 },
      { control: 'Data Retention', regulations: ['GDPR', 'HIPAA', 'SOX'], coverage: 60 },
      { control: 'Vulnerability Mgmt', regulations: ['PCI DSS', 'ISO 27001'], coverage: 40 },
    ];
  }

  private _getRegulatoryChangeImpact(): Array<{regulation: string; change: string; impact: string; deadline: string; readiness: number}> {
    return [
      { regulation: 'GDPR', change: 'AI Act Integration', impact: 'High - New AI governance requirements', deadline: '2026-08-01', readiness: 45 },
      { regulation: 'PCI DSS 5.0', change: 'v5.0 Mandatory', impact: 'Medium - Enhanced authentication requirements', deadline: '2027-03-31', readiness: 60 },
      { regulation: 'ISO 27001', change: '2025 Amendment', impact: 'Low - Minor clause updates', deadline: '2026-12-31', readiness: 80 },
    ];
  }

  private _renderRegulatoryMapping(): string {
    if (this._regulations.length === 0) this._initRegulatoryMapping();
    let html = `<div style="padding:12px"><h4 style="margin:0 0 8px;color:#f1f5f9">Regulatory Mapping</h4>`;
    html += `<div style="display:grid;gap:4px;margin-bottom:8px">`;
    for (const reg of this._regulations) {
      const statusColor = reg.status === 'certified' ? '#22c55e' : reg.status === 'compliant' ? '#3b82f6' : '#f59e0b';
      html += `<div style="display:flex;align-items:center;gap:6px;padding:4px 6px;background:#0f172a;border-radius:4px">`;
      html += `<span style="font-size:11px;font-weight:600;color:#e2e8f0;width:80px">${reg.name}</span>`;
      html += `<span style="font-size:9px;color:#94a3b8">${reg.controls} controls</span>`;
      html += `<span style="font-size:9px;color:#94a3b8">${reg.overlap}% overlap</span>`;
      html += `<span style="font-size:9px;padding:1px 4px;background:${statusColor}22;color:${statusColor};border-radius:3px">${reg.status}</span></div>`;
    }
    html += `</div>`;
    const changes = this._getRegulatoryChangeImpact();
    html += `<div style="font-size:11px;color:#f97316;margin-bottom:4px">Regulatory Changes:</div>`;
    for (const c of changes) {
      html += `<div style="padding:3px 6px;background:rgba(249,115,22,0.08);border-left:2px solid #f97316;margin-bottom:3px;font-size:9px;color:#cbd5e1">`;
      html += `<strong>${c.regulation}</strong>: ${c.change} - ${c.impact}<br/>Deadline: ${c.deadline} | Readiness: ${c.readiness}%</div>`;
    }
    html += `</div>`;
    return html;
  }

  // ── Security Team Performance ─────────────────────────────────────
  private _teamMembers: Array<{name: string; role: string; kpis: Array<{name: string; value: number; target: number}>; workload: number; trend: string}> = [];
  private _teamSkillCoverage: Array<{skill: string; coverage: number; analysts: number}> = [];

  private _initTeamPerformance(): void {
    this._teamMembers = [
      { name: 'Alice Chen', role: 'SOC Lead', kpis: [
        { name: 'MTTD', value: 12, target: 15 }, { name: 'MTTR', value: 45, target: 60 },
        { name: 'Incidents Closed', value: 34, target: 30 }, { name: 'False Positive Rate', value: 8, target: 10 },
        { name: 'Escalations', value: 3, target: 5 }, { name: 'Report Quality', value: 92, target: 85 },
        { name: 'Training Hours', value: 18, target: 20 }, { name: 'Certifications', value: 4, target: 3 },
      ], workload: 85, trend: 'improving' },
      { name: 'Bob Martinez', role: 'IR Specialist', kpis: [
        { name: 'MTTD', value: 18, target: 15 }, { name: 'MTTR', value: 72, target: 60 },
        { name: 'Incidents Closed', value: 28, target: 30 }, { name: 'False Positive Rate', value: 12, target: 10 },
        { name: 'Escalations', value: 4, target: 5 }, { name: 'Report Quality', value: 88, target: 85 },
        { name: 'Training Hours', value: 14, target: 20 }, { name: 'Certifications', value: 3, target: 3 },
      ], workload: 72, trend: 'stable' },
      { name: 'Carol Williams', role: 'Threat Hunter', kpis: [
        { name: 'MTTD', value: 8, target: 15 }, { name: 'MTTR', value: 55, target: 60 },
        { name: 'Incidents Closed', value: 22, target: 30 }, { name: 'False Positive Rate', value: 6, target: 10 },
        { name: 'Escalations', value: 2, target: 5 }, { name: 'Report Quality', value: 95, target: 85 },
        { name: 'Training Hours', value: 22, target: 20 }, { name: 'Certifications', value: 5, target: 3 },
      ], workload: 90, trend: 'excelling' },
    ];
    this._teamSkillCoverage = [
      { skill: 'Incident Response', coverage: 85, analysts: 3 },
      { skill: 'Malware Analysis', coverage: 60, analysts: 2 },
      { skill: 'Threat Hunting', coverage: 70, analysts: 2 },
      { skill: 'Forensics', coverage: 45, analysts: 1 },
      { skill: 'Cloud Security', coverage: 55, analysts: 2 },
      { skill: 'Network Analysis', coverage: 75, analysts: 2 },
      { skill: 'Reverse Engineering', coverage: 30, analysts: 1 },
      { skill: 'Compliance', coverage: 80, analysts: 3 },
    ];
  }

  private _getTeamWorkloadDistribution(): Array<{range: string; count: number; color: string}> {
    return [
      { range: '0-40%', count: 0, color: '#22c55e' },
      { range: '41-60%', count: 1, color: '#3b82f6' },
      { range: '61-80%', count: 2, color: '#eab308' },
      { range: '81-100%', count: 3, color: '#f97316' },
      { range: 'Overloaded', count: 1, color: '#ef4444' },
    ];
  }

  private _getTrainingRecommendations(): Array<{analyst: string; course: string; priority: string; estimatedHours: number}> {
    return [
      { analyst: 'Bob Martinez', course: 'Advanced Forensics (GCFE)', priority: 'High', estimatedHours: 40 },
      { analyst: 'Alice Chen', course: 'Cloud Security (CCSP)', priority: 'Medium', estimatedHours: 30 },
      { analyst: 'Team', course: 'MITRE ATT&CK Practitioner', priority: 'High', estimatedHours: 20 },
    ];
  }

  private _renderTeamPerformance(): string {
    if (this._teamMembers.length === 0) this._initTeamPerformance();
    let html = `<div style="padding:12px"><h4 style="margin:0 0 8px;color:#f1f5f9">Team Performance</h4>`;
    for (const member of this._teamMembers) {
      const metCount = member.kpis.filter(k => {
        if (k.name === 'False Positive Rate') return k.value <= k.target;
        return k.value >= k.target;
      }).length;
      const kpiPct = Math.round((metCount / member.kpis.length) * 100);
      const trendColor = member.trend === 'excelling' ? '#22c55e' : member.trend === 'improving' ? '#3b82f6' : '#eab308';
      html += `<div style="background:#0f172a;border:1px solid #1e293b;border-radius:6px;padding:8px;margin-bottom:6px">`;
      html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">`;
      html += `<span style="font-size:11px;font-weight:600;color:#e2e8f0">${member.name} <span style="color:#64748b;font-weight:400">(${member.role})</span></span>`;
      html += `<span style="font-size:10px;color:${trendColor}">${member.trend}</span></div>`;
      html += `<div style="display:flex;gap:8px;margin-bottom:4px">`;
      html += `<span style="font-size:9px;color:#94a3b8">KPIs: ${metCount}/${member.kpis.length} met</span>`;
      html += `<span style="font-size:9px;color:#94a3b8">Workload: ${member.workload}%</span></div>`;
      html += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:2px">`;
      for (const kpi of member.kpis) {
        const met = kpi.name === 'False Positive Rate' ? kpi.value <= kpi.target : kpi.value >= kpi.target;
        const color = met ? '#22c55e' : '#ef4444';
        html += `<div style="font-size:9px;color:#94a3b8"><span style="color:${color}">${met ? '●' : '○'}</span> ${kpi.name}: <span style="color:${color}">${kpi.value}</span>/${kpi.target}</div>`;
      }
      html += `</div></div>`;
    }
    html += `</div>`;
    return html;
  }

  // --- Security Scenario Planning Methods (COAUTR) ---
  private _initCoautrScenarios(): void {
    const worstCaseScenarios = [
      { id: "coautr-sc-01", name: "Ransomware Attack on Critical Infrastructure", category: "Malware", impact: 9500000, probability: 0.12, recoveryDays: 21, affectedSystems: 47, dataLossGb: 320, businessImpact: "critical" },
      { id: "coautr-sc-02", name: "Insider Data Exfiltration via Authorized Channels", category: "Insider Threat", impact: 7200000, probability: 0.18, recoveryDays: 14, affectedSystems: 12, dataLossGb: 85, businessImpact: "high" },
      { id: "coautr-sc-03", name: "Supply Chain Compromise via Third-Party Library", category: "Supply Chain", impact: 6800000, probability: 0.09, recoveryDays: 30, affectedSystems: 63, dataLossGb: 0, businessImpact: "critical" },
      { id: "coautr-sc-04", name: "Cloud Misconfiguration Leading to Public Exposure", category: "Cloud", impact: 4100000, probability: 0.22, recoveryDays: 7, affectedSystems: 8, dataLossGb: 450, businessImpact: "high" },
      { id: "coautr-sc-05", name: "Zero-Day Exploit in Core Application Framework", category: "Vulnerability", impact: 8900000, probability: 0.05, recoveryDays: 45, affectedSystems: 120, dataLossGb: 0, businessImpact: "critical" },
      { id: "coautr-sc-06", name: "Distributed Denial of Service on Customer-Facing Services", category: "Availability", impact: 3400000, probability: 0.25, recoveryDays: 3, affectedSystems: 15, dataLossGb: 0, businessImpact: "medium" },
      { id: "coautr-sc-07", name: "Credential Stuffing and Account Takeover Wave", category: "Identity", impact: 2800000, probability: 0.30, recoveryDays: 5, affectedSystems: 6, dataLossGb: 12, businessImpact: "medium" },
      { id: "coautr-sc-08", name: "Physical Security Breach at Data Center Facility", category: "Physical", impact: 12000000, probability: 0.02, recoveryDays: 60, affectedSystems: 200, dataLossGb: 5000, businessImpact: "critical" },
    ];
    this._coautrScenarios = worstCaseScenarios.map(s => ({ ...s, mitigationCost: Math.round(s.impact * 0.08), drillScheduled: false, lastDrillDate: null, drillScore: null, controlGaps: Math.floor(Math.random() * 5) + 1 }));
  }

  private _calculateCoautrScenarioRisk(): void {
    this._coautrScenarios.forEach(s => {
      const riskScore = s.impact * s.probability;
      s.riskScore = Math.round(riskScore);
      s.riskLevel = riskScore > 1000000 ? "extreme" : riskScore > 500000 ? "high" : riskScore > 200000 ? "medium" : "low";
      s.mitigationPriority = s.riskScore > 500000 ? "immediate" : s.riskScore > 200000 ? "planned" : "monitor";
      s.residualRisk = Math.round(s.riskScore * (1 - (s.controlGaps * 0.12)));
      s.bciScore = Math.round((s.recoveryDays * 0.3 + s.affectedSystems * 0.4 + (s.dataLossGb > 0 ? 0.3 : 0)) * 100);
    });
  }

  private _scheduleCoautrDrills(): void {
    const drillCadence = { quarterly: ["Q1", "Q2", "Q3", "Q4"], semiAnnual: ["H1", "H2"], annual: ["FY"] };
    this._coautrScenarios.forEach(s => {
      if (s.probability > 0.15 && s.businessImpact === "critical") s.drillCadence = "quarterly";
      else if (s.probability > 0.10 || s.businessImpact === "high") s.drillCadence = "semiAnnual";
      else s.drillCadence = "annual";
      const periods = drillCadence[s.drillCadence as keyof typeof drillCadence];
      s.nextDrillDate = periods[Math.floor(Math.random() * periods.length)] + "-2026";
    });
  }

  private _coautrScenarioComparison(): Record<string, unknown>[] {
    return this._coautrScenarios.map(s => ({
      scenario: s.name, impact: s.impact, probability: s.probability, risk: s.riskScore,
      level: s.riskLevel, recovery: s.recoveryDays + "d", priority: s.mitigationPriority,
      residual: s.residualRisk, bci: s.bciScore, gaps: s.controlGaps
    }));
  }

  // --- Security Control Effectiveness Analytics (COAUTR) ---
  private _initCoautrControls(): void {
    const controls = [
      { id: "coautr-ct-01", name: "Network Segmentation", type: "preventive", maturity: "defined", score: 82, target: 90, failures: 3, lastTest: "2026-03-15" },
      { id: "coautr-ct-02", name: "Endpoint Detection and Response", type: "detective", maturity: "managed", score: 88, target: 92, failures: 1, lastTest: "2026-04-01" },
      { id: "coautr-ct-03", name: "Data Loss Prevention", type: "preventive", maturity: "repeatable", score: 71, target: 85, failures: 7, lastTest: "2026-03-22" },
      { id: "coautr-ct-04", name: "Security Information and Event Management", type: "detective", maturity: "managed", score: 85, target: 90, failures: 2, lastTest: "2026-04-05" },
      { id: "coautr-ct-05", name: "Identity and Access Management", type: "preventive", maturity: "defined", score: 76, target: 88, failures: 5, lastTest: "2026-03-28" },
      { id: "coautr-ct-06", name: "Vulnerability Management", type: "corrective", maturity: "managed", score: 80, target: 90, failures: 4, lastTest: "2026-04-02" },
      { id: "coautr-ct-07", name: "Email Security Gateway", type: "preventive", maturity: "managed", score: 90, target: 95, failures: 1, lastTest: "2026-04-08" },
      { id: "coautr-ct-08", name: "Web Application Firewall", type: "preventive", maturity: "managed", score: 87, target: 92, failures: 2, lastTest: "2026-03-30" },
      { id: "coautr-ct-09", name: "Patch Management", type: "corrective", maturity: "defined", score: 68, target: 85, failures: 9, lastTest: "2026-03-18" },
      { id: "coautr-ct-10", name: "Encryption at Rest", type: "preventive", maturity: "managed", score: 93, target: 95, failures: 0, lastTest: "2026-04-10" },
      { id: "coautr-ct-11", name: "Encryption in Transit", type: "preventive", maturity: "optimized", score: 96, target: 98, failures: 0, lastTest: "2026-04-12" },
      { id: "coautr-ct-12", name: "Privileged Access Management", type: "preventive", maturity: "defined", score: 74, target: 88, failures: 6, lastTest: "2026-03-25" },
      { id: "coautr-ct-13", name: "Security Awareness Training", type: "preventive", maturity: "repeatable", score: 65, target: 80, failures: 11, lastTest: "2026-03-20" },
      { id: "coautr-ct-14", name: "Incident Response Plan", type: "corrective", maturity: "managed", score: 78, target: 88, failures: 4, lastTest: "2026-04-03" },
      { id: "coautr-ct-15", name: "Backup and Recovery", type: "corrective", maturity: "managed", score: 84, target: 92, failures: 3, lastTest: "2026-04-06" },
      { id: "coautr-ct-16", name: "Multi-Factor Authentication", type: "preventive", maturity: "managed", score: 91, target: 95, failures: 1, lastTest: "2026-04-09" },
      { id: "coautr-ct-17", name: "Network Traffic Analysis", type: "detective", maturity: "defined", score: 72, target: 85, failures: 5, lastTest: "2026-03-27" },
      { id: "coautr-ct-18", name: "Cloud Security Posture Management", type: "detective", maturity: "repeatable", score: 69, target: 82, failures: 8, lastTest: "2026-03-24" },
      { id: "coautr-ct-19", name: "Container Security Scanning", type: "preventive", maturity: "defined", score: 75, target: 85, failures: 5, lastTest: "2026-04-04" },
      { id: "coautr-ct-20", name: "API Security Gateway", type: "preventive", maturity: "repeatable", score: 70, target: 82, failures: 7, lastTest: "2026-03-29" },
      { id: "coautr-ct-21", name: "Threat Intelligence Platform", type: "detective", maturity: "managed", score: 83, target: 90, failures: 2, lastTest: "2026-04-07" },
      { id: "coautr-ct-22", name: "Database Activity Monitoring", type: "detective", maturity: "defined", score: 67, target: 80, failures: 8, lastTest: "2026-03-21" },
      { id: "coautr-ct-23", name: "Deception Technology", type: "detective", maturity: "initial", score: 55, target: 75, failures: 12, lastTest: "2026-03-16" },
      { id: "coautr-ct-24", name: "Security Orchestration Automation", type: "corrective", maturity: "repeatable", score: 73, target: 85, failures: 6, lastTest: "2026-04-01" },
      { id: "coautr-ct-25", name: "Third-Party Risk Assessment", type: "preventive", maturity: "defined", score: 64, target: 78, failures: 9, lastTest: "2026-03-19" },
    ];
    this._coautrControls = controls;
  }

  private _analyzeCoautrControlEffectiveness(): void {
    const typeBreakdown: Record<string, { total: number; avgScore: number; avgFailures: number }> = {};
    this._coautrControls.forEach(c => {
      if (!typeBreakdown[c.type]) typeBreakdown[c.type] = { total: 0, avgScore: 0, avgFailures: 0 };
      typeBreakdown[c.type].total++;
      typeBreakdown[c.type].avgScore += c.score;
      typeBreakdown[c.type].avgFailures += c.failures;
    });
    Object.keys(typeBreakdown).forEach(t => {
      typeBreakdown[t].avgScore = Math.round(typeBreakdown[t].avgScore / typeBreakdown[t].total);
      typeBreakdown[t].avgFailures = Math.round(typeBreakdown[t].avgFailures / typeBreakdown[t].total * 10) / 10;
    });
    this._coautrControlTypeBreakdown = typeBreakdown;
  }

  private _coautrControlOptimization(): Record<string, unknown>[] {
    return this._coautrControls.filter(c => c.score < c.target).map(c => ({
      control: c.name, current: c.score, target: c.target, gap: c.target - c.score,
      failures: c.failures, maturity: c.maturity, recommendation:
        c.score < 70 ? "Critical: Immediate improvement required" :
        c.score < 80 ? "Significant: Plan improvement sprint" :
        "Moderate: Fine-tune and optimize"
    })).sort((a: any, b: any) => (b.gap as number) - (a.gap as number));
  }

  // --- Security Data Pipeline Health (COAUTR) ---
  private _initCoautrPipelines(): void {
    const pipelines = [
      { id: "coautr-pl-01", name: "SIEM Log Ingestion", status: "healthy", healthScore: 94, latencyMs: 120, freshnessMin: 2, errorRate: 0.02, throughputMbps: 450, recordsPerSec: 12000, backPressure: 0.05, uptime: 99.97 },
      { id: "coautr-pl-02", name: "Threat Feed Aggregation", status: "healthy", healthScore: 91, latencyMs: 300, freshnessMin: 15, errorRate: 0.05, throughputMbps: 85, recordsPerSec: 3200, backPressure: 0.08, uptime: 99.92 },
      { id: "coautr-pl-03", name: "Vulnerability Scan Results", status: "degraded", healthScore: 72, latencyMs: 2500, freshnessMin: 60, errorRate: 0.15, throughputMbps: 25, recordsPerSec: 800, backPressure: 0.35, uptime: 98.50 },
      { id: "coautr-pl-04", name: "Endpoint Telemetry Stream", status: "healthy", healthScore: 88, latencyMs: 450, freshnessMin: 5, errorRate: 0.08, throughputMbps: 280, recordsPerSec: 8500, backPressure: 0.12, uptime: 99.85 },
      { id: "coautr-pl-05", name: "Cloud Audit Log Pipeline", status: "healthy", healthScore: 86, latencyMs: 600, freshnessMin: 10, errorRate: 0.06, throughputMbps: 150, recordsPerSec: 4500, backPressure: 0.10, uptime: 99.80 },
      { id: "coautr-pl-06", name: "Identity Event Stream", status: "warning", healthScore: 78, latencyMs: 1200, freshnessMin: 20, errorRate: 0.12, throughputMbps: 45, recordsPerSec: 1500, backPressure: 0.22, uptime: 99.40 },
      { id: "coautr-pl-07", name: "Network Flow Collection", status: "healthy", healthScore: 82, latencyMs: 800, freshnessMin: 8, errorRate: 0.09, throughputMbps: 650, recordsPerSec: 18000, backPressure: 0.15, uptime: 99.70 },
      { id: "coautr-pl-08", name: "DLP Incident Pipeline", status: "degraded", healthScore: 68, latencyMs: 3500, freshnessMin: 45, errorRate: 0.20, throughputMbps: 18, recordsPerSec: 500, backPressure: 0.42, uptime: 97.80 },
    ];
    this._coautrPipelines = pipelines.map(p => ({ ...p, dependencies: [], slaBreached: p.healthScore < 75, alertThreshold: p.errorRate > 0.15 }));
    this._coautrPipelines[0].dependencies = ["coautr-pl-04", "coautr-pl-07"];
    this._coautrPipelines[4].dependencies = ["coautr-pl-01"];
    this._coautrPipelines[5].dependencies = ["coautr-pl-02"];
    this._coautrPipelines[7].dependencies = ["coautr-pl-04", "coautr-pl-05"];
  }

  private _coautrPipelineTrend(): Record<string, unknown>[] {
    const hours = Array.from({ length: 24 }, (_, i) => `H${String(i).padStart(2, "0")}`);
    return this._coautrPipelines.map(p => ({
      pipeline: p.name, status: p.status, health: p.healthScore,
      latency: p.latencyMs, freshness: p.freshnessMin, errors: p.errorRate,
      throughput: p.throughputMbps, recordsSec: p.recordsPerSec, slaOk: !p.slaBreached,
      hourlyHealth: hours.map(h => Math.max(50, p.healthScore + Math.floor(Math.random() * 20) - 10))
    }));
  }

  // --- Security Stakeholder Report Generator (COAUTR) ---
  private _initCoautrReportTemplates(): void {
    this._coautrReportTemplates = [
      { id: "coautr-rp-01", name: "Board Security Report", audience: "board", frequency: "quarterly", sections: 6, autoGenerate: true, lastGenerated: "2026-03-31", pages: 12 },
      { id: "coautr-rp-02", name: "Executive Risk Summary", audience: "executive", frequency: "monthly", sections: 8, autoGenerate: true, lastGenerated: "2026-04-01", pages: 8 },
      { id: "coautr-rp-03", name: "Technical Security Review", audience: "technical", frequency: "weekly", sections: 12, autoGenerate: true, lastGenerated: "2026-04-21", pages: 25 },
      { id: "coautr-rp-04", name: "Audit Compliance Report", audience: "audit", frequency: "quarterly", sections: 10, autoGenerate: false, lastGenerated: "2026-03-15", pages: 35 },
      { id: "coautr-rp-05", name: "Regulatory Filing Package", audience: "regulatory", frequency: "annual", sections: 15, autoGenerate: false, lastGenerated: "2025-12-31", pages: 48 },
    ];
  }

  private _generateCoautrExecSummary(): string {
    const totalRisk = this._coautrScenarios.reduce((sum: number, s: any) => sum + s.riskScore, 0);
    const avgControl = Math.round(this._coautrControls.reduce((sum: number, c: any) => sum + c.score, 0) / this._coautrControls.length);
    const degradedPipes = this._coautrPipelines.filter((p: any) => p.status !== "healthy").length;
    return `Overall risk exposure: ${(totalRisk / 1000000).toFixed(1)}M. Average control effectiveness: {avgControl}%. {degradedPipes} pipeline(s) need attention. {this._coautrScenarios.filter((s: any) => s.mitigationPriority === "immediate").length} scenarios require immediate action.`;
  }

  // --- Security Technology Radar (COAUTR) ---
  private _initCoautrTechRadar(): void {
    this._coautrTechRadar = [
      { id: "coautr-tr-01", name: "AI-Powered Threat Detection", ring: "adopt", category: "Detection", maturity: 4, trend: "up", investment: "high", roi: 3.2, vendorCount: 8 },
      { id: "coautr-tr-02", name: "Zero Trust Architecture", ring: "adopt", category: "Architecture", maturity: 4, trend: "up", investment: "high", roi: 2.8, vendorCount: 12 },
      { id: "coautr-tr-03", name: "SASE/SSE Platform", ring: "trial", category: "Network", maturity: 3, trend: "up", investment: "medium", roi: 2.4, vendorCount: 10 },
      { id: "coautr-tr-04", name: "CNAPP Cloud Security", ring: "trial", category: "Cloud", maturity: 3, trend: "up", investment: "medium", roi: 2.1, vendorCount: 7 },
      { id: "coautr-tr-05", name: "Extended Detection and Response", ring: "adopt", category: "Detection", maturity: 4, trend: "stable", investment: "high", roi: 2.9, vendorCount: 9 },
      { id: "coautr-tr-06", name: "Quantum-Safe Cryptography", ring: "assess", category: "Crypto", maturity: 2, trend: "up", investment: "low", roi: 0.8, vendorCount: 4 },
      { id: "coautr-tr-07", name: "Security Service Edge", ring: "trial", category: "Network", maturity: 3, trend: "up", investment: "medium", roi: 2.0, vendorCount: 6 },
      { id: "coautr-tr-08", name: "SOAR 2.0 Autonomous SOC", ring: "assess", category: "Operations", maturity: 2, trend: "up", investment: "low", roi: 1.2, vendorCount: 5 },
      { id: "coautr-tr-09", name: "Software Supply Chain Security", ring: "trial", category: "DevSecOps", maturity: 3, trend: "up", investment: "medium", roi: 2.3, vendorCount: 8 },
      { id: "coautr-tr-10", name: "Identity Threat Detection", ring: "adopt", category: "Identity", maturity: 3, trend: "up", investment: "high", roi: 2.7, vendorCount: 7 },
      { id: "coautr-tr-11", name: "Data Security Posture Management", ring: "trial", category: "Data", maturity: 3, trend: "up", investment: "medium", roi: 2.2, vendorCount: 9 },
      { id: "coautr-tr-12", name: "Decentralized Identity Standards", ring: "hold", category: "Identity", maturity: 1, trend: "stable", investment: "low", roi: 0.5, vendorCount: 3 },
    ];
  }

  private _coautrRadarSummary(): Record<string, unknown> {
    const rings: Record<string, number> = { adopt: 0, trial: 0, assess: 0, hold: 0 };
    this._coautrTechRadar.forEach(t => { if (rings[t.ring as keyof typeof rings] !== undefined) rings[t.ring as keyof typeof rings]++; });
    return { adopt: rings.adopt, trial: rings.trial, assess: rings.assess, hold: rings.hold, total: this._coautrTechRadar.length, avgMaturity: 2.8, topInvestment: this._coautrTechRadar.filter(t => t.investment === "high").map(t => t.name) };
  }

  // --- COAUTR Security Compliance Mapping Matrix ---
  private _initCoautrComplianceMatrix(): void {
    const frameworks = ["ISO 27001", "SOC 2 Type II", "PCI DSS 4.0", "NIST CSF 2.0", "GDPR", "HIPAA", "FedRAMP", "CIS Controls v8"];
    const domains = ["Access Control", "Data Protection", "Network Security", "Endpoint Security", "Incident Response", "Risk Management", "Asset Management", "Compliance Monitoring"];
    this._coautrComplianceMatrix = frameworks.map(fw => ({
      framework: fw, totalControls: Math.floor(Math.random() * 60) + 80, implemented: Math.floor(Math.random() * 40) + 50,
      partial: Math.floor(Math.random() * 20) + 10, gaps: Math.floor(Math.random() * 15) + 3,
      lastAudit: "2026-" + String(Math.floor(Math.random() * 4) + 1).padStart(2, "0") + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0"),
      nextAudit: "2027-" + String(Math.floor(Math.random() * 6) + 1).padStart(2, "0") + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0"),
      score: Math.floor(Math.random() * 20) + 72, status: Math.random() > 0.3 ? "compliant" : "partial",
      domains: domains.map(d => ({ domain: d, controls: Math.floor(Math.random() * 10) + 5, passed: Math.floor(Math.random() * 8) + 2 }))
    }));
  }

  private _coautrComplianceTrend(): Record<string, unknown>[] {
    const quarters = ["Q1-2025", "Q2-2025", "Q3-2025", "Q4-2025", "Q1-2026", "Q2-2026"];
    return this._coautrComplianceMatrix.map(fw => ({
      framework: fw, score: fw.score, status: fw.status,
      trend: quarters.map(q => Math.min(100, fw.score - 15 + Math.floor(Math.random() * 20))),
      gaps: fw.gaps, implemented: fw.implemented, total: fw.totalControls,
      coverage: Math.round((fw.implemented / fw.totalControls) * 100)
    }));
  }

  // --- COAUTR Threat Intelligence Correlation Engine ---
  private _initCoautrThreatIntel(): void {
    const threatActors = ["APT29", "APT41", "Lazarus Group", "FIN7", "Conti", "Sandworm", "Fancy Bear", "Tick Group"];
    const techniques = ["T1059.001", "T1190", "T1566.001", "T1078", "T1055", "T1486", "T1021.001", "T1071.001"];
    const sectors = ["Finance", "Healthcare", "Technology", "Government", "Energy", "Manufacturing", "Retail", "Telecom"];
    this._coautrThreatIntel = threatActors.map((actor, i) => ({
      actor, sophistication: ["advanced", "advanced", "moderate", "advanced", "moderate", "advanced", "advanced", "moderate"][i],
      targeting: sectors.slice(0, Math.floor(Math.random() * 4) + 2),
      primaryTechniques: techniques.slice(Math.floor(Math.random() * 3), Math.floor(Math.random() * 3) + 4),
      confidence: Math.floor(Math.random() * 30) + 65, lastObserved: "2026-04-" + String(Math.floor(Math.random() * 22) + 1).padStart(2, "0"),
      iocCount: Math.floor(Math.random() * 200) + 50, attributedCampaigns: Math.floor(Math.random() * 8) + 1,
      mitreTactics: ["Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion"].slice(0, Math.floor(Math.random() * 3) + 2),
      riskScore: Math.floor(Math.random() * 40) + 55, alertsTriggered: Math.floor(Math.random() * 30) + 5
    }));
  }

  private _coautrThreatCorrelation(): Record<string, unknown>[] {
    return this._coautrThreatIntel.filter(t => t.riskScore > 70).map(t => ({
      actor: t.actor, risk: t.riskScore, confidence: t.confidence,
      techniques: t.primaryTechniques, targeting: t.targeting,
      lastSeen: t.lastObserved, iocs: t.iocCount, campaigns: t.attributedCampaigns,
      recommendation: t.riskScore > 85 ? "Immediate defensive action required" : t.riskScore > 75 ? "Enhanced monitoring recommended" : "Standard monitoring sufficient"
    })).sort((a: any, b: any) => (b.risk as number) - (a.risk as number));
  }

  // --- COAUTR Security Metrics Deep Dive ---
  private _initCoautrMetricsDeep(): void {
    const metricCategories = ["Detection Coverage", "Response Efficiency", "Prevention Effectiveness", "Recovery Speed", "Compliance Adherence"];
    this._coautrMetricsDeep = metricCategories.map(cat => ({
      category: cat, metrics: Array.from({ length: 6 }, (_, i) => ({
        name: `${cat} Metric ${i + 1}`, value: Math.floor(Math.random() * 40) + 55,
        target: Math.floor(Math.random() * 15) + 82, unit: ["%", "ms", "count", "score"][Math.floor(Math.random() * 4)],
        trend: Math.random() > 0.4 ? "improving" : "stable", period: "30d",
        baseline: Math.floor(Math.random() * 20) + 50, benchmark: Math.floor(Math.random() * 10) + 80
      })),
      overallScore: Math.floor(Math.random() * 20) + 70, maturity: ["initial", "developing", "defined", "managed", "optimized"][Math.floor(Math.random() * 5)]
    }));
  }

  private _coautrMetricsHeatmap(): number[][] {
    return this._coautrMetricsDeep.map(cat =>
      cat.metrics.map(m => Math.round((m.value / m.target) * 100))
    );
  }

  // --- COAUTR Incident Cost Modeling ---
  private _initCoautrCostModel(): void {
    const incidentTypes = ["Data Breach", "Ransomware", "DDoS", "Insider Threat", "Phishing", "Supply Chain", "Cloud Misconfig", "Zero-Day"];
    this._coautrCostModel = incidentTypes.map(inc => ({
      incident: inc, avgCost: Math.floor(Math.random() * 8000000) + 1000000,
      maxCost: Math.floor(Math.random() * 20000000) + 5000000, minCost: Math.floor(Math.random() * 500000) + 100000,
      detectionTimeHrs: Math.floor(Math.random() * 200) + 10, containmentTimeHrs: Math.floor(Math.random() * 150) + 5,
      recoveryTimeHrs: Math.floor(Math.random() * 500) + 50, recordsAffected: Math.floor(Math.random() * 500000) + 10000,
      regulatoryFine: Math.floor(Math.random() * 3000000) + 200000, reputationCost: Math.floor(Math.random() * 2000000) + 500000,
      legalCost: Math.floor(Math.random() * 1500000) + 100000, notificationCost: Math.floor(Math.random() * 800000) + 50000,
      forensicsCost: Math.floor(Math.random() * 400000) + 50000, totalAnnualExposure: 0, frequency: Math.floor(Math.random() * 5) + 1
    }));
    this._coautrCostModel.forEach(m => { m.totalAnnualExposure = m.avgCost * m.frequency; });
  }

  private _coautrCostProjection(): Record<string, unknown>[] {
    return this._coautrCostModel.map(m => ({
      incident: m.incident, avgCost: m.avgCost, annualExposure: m.totalAnnualExposure,
      frequency: m.frequency, detectionHrs: m.detectionTimeHrs, recoveryHrs: m.recoveryTimeHrs,
      records: m.recordsAffected, regulatory: m.regulatoryFine,
      roiOfInvestment: Math.round(m.avgCost * 0.15 / 100000), priority: m.totalAnnualExposure > 10000000 ? "critical" : m.totalAnnualExposure > 5000000 ? "high" : "medium"
    })).sort((a: any, b: any) => (b.annualExposure as number) - (a.annualExposure as number));
  }

  // --- COAUTR Security Architecture Pattern Library ---
  private _initCoautrArchPatterns(): void {
    const patterns = ["Defense in Depth", "Zero Trust Network", "Microsegmentation", "Layered Encryption", "Blast Radius Minimization", "Fail Secure Design", "Least Privilege Access", "Secure-by-Default"];
    this._coautrArchPatterns = patterns.map((p, i) => ({
      pattern: p, category: ["network", "identity", "network", "data", "architecture", "design", "identity", "development"][i],
      maturity: ["optimized", "managed", "defined", "managed", "repeatable", "defined", "managed", "repeatable"][i],
      implementation: Math.floor(Math.random() * 40) + 55, coverage: Math.floor(Math.random() * 30) + 60,
      components: Math.floor(Math.random() * 15) + 5, integrationPoints: Math.floor(Math.random() * 20) + 3,
      riskReduction: Math.floor(Math.random() * 25) + 60, costComplexity: ["low", "high", "medium", "medium", "high", "low", "medium", "medium"][i],
      dependencies: patterns.slice(0, Math.floor(Math.random() * 3)).filter(x => x !== p),
      lastReview: "2026-0" + String(Math.floor(Math.random() * 4) + 1) + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")
    }));
  }

  private _coautrArchPatternAnalysis(): Record<string, unknown> {
    const implemented = this._coautrArchPatterns.filter(p => p.implementation > 75).length;
    const avgCoverage = Math.round(this._coautrArchPatterns.reduce((s: number, p: any) => s + p.coverage, 0) / this._coautrArchPatterns.length);
    return {
      totalPatterns: this._coautrArchPatterns.length, fullyImplemented: implemented, avgCoverage,
      avgRiskReduction: Math.round(this._coautrArchPatterns.reduce((s: number, p: any) => s + p.riskReduction, 0) / this._coautrArchPatterns.length),
      gaps: this._coautrArchPatterns.filter(p => p.implementation < 60).map(p => p.pattern),
      recommendations: this._coautrArchPatterns.filter(p => p.implementation < 70).map(p => ({ pattern: p.pattern, current: p.implementation, target: 85, effort: p.costComplexity }))
    };
  }



  render() {
    return html`
      <div class="panel">
        <div class="pt">✅ Compliance Audit Tracker</div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Key Metrics Summary</div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Open Findings</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#f97316">18</div>              <div style="flex:1;font-size:10px;color:#6b7280">4 critical, 14 major</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Remediated (Q1)</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#22c55e">32</div>              <div style="flex:1;font-size:10px;color:#6b7280">85% closure rate</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Audit Score</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#22c55e">94%</div>              <div style="flex:1;font-size:10px;color:#6b7280">Above 90% target</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Frameworks Active</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#3b82f6">5</div>              <div style="flex:1;font-size:10px;color:#6b7280">SOC2, ISO, GDPR, PCI, HIPAA</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Evidence Items</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#06b6d4">245</div>              <div style="flex:1;font-size:10px;color:#6b7280">98% collection rate</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Next Audit</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#eab308">45d</div>              <div style="flex:1;font-size:10px;color:#6b7280">SOC2 Type II</div>            </div>
          </div>
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Security Insights</div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">SOC2 Type II audit scheduled for Q3 2026 with no open critical findings.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">ISO 27001 surveillance audit completed with 2 minor non-conformities.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">GDPR data mapping exercise 78% complete across all business units.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">PCI DSS v4.0 migration assessment on track for December deadline.</span>            </div>
          </div>
        </div>

        
        <div class="kpi-grid">
          ${this._kpiCards.map(k => html`
            <div class="kpi-card" style="border-left-color:${k.color}">
              <div class="kpi-card-title">${k.title}</div>
              <div class="kpi-card-value" style="color:${k.color}">${k.value}</div>
              <div class="kpi-card-change ${k.positive ? 'kpi-change-up' : 'kpi-change-down'}">${k.positive ? '&#9650;' : '&#9660;'} ${k.change} vs last period</div>
            </div>
          `)}
        </div>
        <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:14px">
          <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Recommendations</div>
          ${this._recommendations.map(r => html`
            <div class="rec-row">
              <div class="rec-priority" style="background:${r.priority}"></div>
              <div style="flex:1">
                <div class="rec-text">${r.text}</div>
                <div class="rec-meta">${r.meta}</div>
              </div>
            </div>
          `)}
        </div>
<div class="tabs">
          <span class="tab ${this._tab === 'overview' ? 'active' : ''}" @click=${() => { this._tab = 'overview'; this._searchQuery = ''; }}>Overview</span>
          <span class="tab ${this._tab === 'soc2' ? 'active' : ''}" @click=${() => { this._tab = 'soc2'; this._searchQuery = ''; }}>SOC 2</span>
          <span class="tab ${this._tab === 'iso' ? 'active' : ''}" @click=${() => { this._tab = 'iso'; this._searchQuery = ''; }}>ISO 27001</span>
          <span class="tab ${this._tab === 'pci' ? 'active' : ''}" @click=${() => { this._tab = 'pci'; this._searchQuery = ''; }}>PCI DSS</span>
          <span class="tab ${this._tab === 'remediation' ? 'active' : ''}" @click=${() => { this._tab = 'remediation'; this._searchQuery = ''; }}>Remediation</span>
          <span class="tab ${this._tab === 'evidence' ? 'active' : ''}" @click=${() => { this._tab = 'evidence'; this._searchQuery = ''; }}>Evidence</span>
          <span class="tab ${this._tab === 'mapping' ? 'active' : ''}" @click=${() => { this._tab = 'mapping'; this._searchQuery = ''; }}>Mapping</span>
          <span class="tab ${this._tab === 'calendar' ? 'active' : ''}" @click=${() => { this._tab = 'calendar'; this._searchQuery = ''; }}>Calendar</span>
        </div>
        ${this._tab === 'overview' ? this._renderOverview() : ''}
        ${this._tab === 'soc2' ? html`${this._renderExportButton()}${this._renderFrameworkControls('SOC 2')}` : ''}
        ${this._tab === 'iso' ? html`${this._renderExportButton()}${this._renderFrameworkControls('ISO 27001')}` : ''}
        ${this._tab === 'pci' ? html`${this._renderExportButton()}${this._renderFrameworkControls('PCI DSS')}` : ''}
        ${this._tab === 'remediation' ? this._renderRemediation() : ''}
        ${this._tab === 'evidence' ? this._renderEvidence() : ''}
        ${this._tab === 'mapping' ? this._renderMapping() : ''}
        ${this._tab === 'calendar' ? this._renderCalendar() : ''}
      </div>
  
    .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; }
    .kpi-card { background: #0f172a; border-radius: 8px; padding: 12px; border-left: 3px solid; }
    .kpi-card-title { font-size: 10px; color: #6b7280; margin-bottom: 4px; text-transform: uppercase; }
    .kpi-card-value { font-size: 20px; font-weight: 700; }
    .kpi-card-change { font-size: 10px; margin-top: 4px; }
    .kpi-change-up { color: #22c55e; }
    .kpi-change-down { color: #ef4444; }
    .rec-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; }
    .rec-priority { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .rec-text { flex: 1; font-size: 11px; }
    .rec-meta { font-size: 10px; color: #6b7280; }
    .status-dot { display: inline-block; width: 6px; height: 6px; border-radius: 50%; margin-right: 4px; }  `;
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
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Compliance Audit Tracker Findings Grid</span>
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
  @state() private _comScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _comScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _comScenarioCompare: boolean = false;
  @state() private _comScenarioSelected: string[] = [];

  private _comInitScenarios(): void {
    const saved = localStorage.getItem('com_scenarios');
    if (saved) { try { this._comScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._comScenarios.length === 0) {
      this._comScenarios = [
        {id:'com-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'com-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'com-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _comSaveScenarios(): void {
    localStorage.setItem('com_scenarios', JSON.stringify(this._comScenarios));
  }

  private _comAddScenario(): void {
    const f = this._comScenarioForm;
    if (!f.attackType || !f.target) return;
    this._comScenarios = [...this._comScenarios, {
      id: 'com-s' + (this._comScenarios.length + 1),
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
    this._comScenarioForm = {attackType:'',target:'',method:''};
    this._comSaveScenarios();
  }

  private _comRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._comScenarioCompare = !this._comScenarioCompare; }}>${this._comScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._comScenarioForm = {...this._comScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._comScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._comScenarioForm = {...this._comScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._comScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._comScenarioForm = {...this._comScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._comScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._comAddScenario}>Run Simulation</button>
      </div>
      ${this._comScenarioCompare && this._comScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._comScenarios.length)},1fr);gap:8px">
            ${this._comScenarios.slice(0,3).map(s => html`
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
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._comScenarios.length})</div>
        ${this._comScenarios.map(s => html`
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
  @state() private _comTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _comTrendZoom: {start:number;end:number} | null = null;
  @state() private _comTrendMA: number = 7;

  private _comInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._comTrendData = data;
  }

  private _comCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._comTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._comTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _comGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._comTrendData.map(d => d.value);
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

  private _comRenderTimeSeries(): any {
    const stats = this._comGetStats();
    const filtered = this._comTrendZoom ? this._comTrendData.filter(d => d.day >= this._comTrendZoom.start && d.day <= this._comTrendZoom.end) : this._comTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._comTrendMA === 7 ? 'active' : ''}" @click=${() => { this._comTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._comTrendMA === 30 ? 'active' : ''}" @click=${() => { this._comTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._comTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._comTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
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
  @state() private _comRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _comActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _comPermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _comPermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _comPermCompare: string[] = [];

  private _comInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._comRoles) {
      perms[role] = {};
      this._comActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._comPermissions = perms;
  }

  private _comTogglePermission(role: string, action: string): void {
    const old = this._comPermissions[role][action];
    this._comPermissions = {...this._comPermissions, [role]: {...this._comPermissions[role], [action]: !old}};
    this._comPermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _comRenderRBAC(): any {
    const compareRoles = this._comPermCompare.map(r => this._comPermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._comRoles.map(r => html`
              <button class="tab ${this._comPermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._comPermCompare = this._comPermCompare.includes(r) ? this._comPermCompare.filter(x => x !== r) : [...this._comPermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._comActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._comRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._comActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._comPermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._comTogglePermission(role, action)}>${this._comPermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._comPermCompare.join(' vs ')}</div>
            ${this._comActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._comPermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._comPermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._comPermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _comReportTemplate: string = 'executive';
  @state() private _comReportSchedule: string = 'weekly';
  @state() private _comReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _comReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _comGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._comReportHistory.unshift({id,template:this._comReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _comRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._comReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._comReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._comReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._comReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._comReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._comReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._comGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._comReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._comReportHistory.slice(0,3).map(r => html`
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
  @state() private _comHighContrast: boolean = false;
  @state() private _comA11yAnnounce: string = '';
  @state() private _comShortcutsVisible: boolean = false;
  @state() private _comFocusTrap: boolean = false;

  private _comShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _comHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._comFocusTrap) { this._comFocusTrap = false; this._comAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._comHighContrast = !this._comHighContrast; this._comAnnounce('High contrast ' + (this._comHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._comShortcutsVisible = !this._comShortcutsVisible; }
  }

  private _comAnnounce(msg: string): void {
    this._comA11yAnnounce = msg;
    setTimeout(() => { this._comA11yAnnounce = ''; }, 2000);
  }

  private _comRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._comShortcutsVisible ? 'active' : ''}" @click=${() => { this._comShortcutsVisible = !this._comShortcutsVisible; }} aria-expanded=${this._comShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._comHighContrast} @change=${() => { this._comHighContrast = !this._comHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._comShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._comShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._comA11yAnnounce}</div>
      </div>
    `;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._comInitScenarios();
    this._comInitTrendData();
    this._comInitPermissions();
    document.addEventListener('keydown', this._comHandleKeydown.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._comHandleKeydown.bind(this));
  }

  
  // === MACHINE LEARNING FEATURES ===
  @state() private _comMlActiveView: string = 'importance';
  @state() private _comMlModelVersion: string = 'v3.2.1';
  @state() private _comMlFeatureImportance: {name:string;importance:number;color:string}[] = [];
  @state() private _comMlMetrics: {accuracy:number;precision:number;recall:number;f1:number;auc:number} = {accuracy:0.945,precision:0.931,recall:0.952,f1:0.941,auc:0.973};
  @state() private _comMlConfusionMatrix: number[][] = [];
  @state() private _comMlTrainingHistory: {epoch:number;loss:number;valLoss:number;accuracy:number;valAccuracy:number}[] = [];
  @state() private _comMlConfidenceBins: {range:string;count:number;color:string}[] = [];
  @state() private _comMlVersionHistory: {version:string;date:string;accuracy:number;f1:number;notes:string}[] = [];
  @state() private _comMlSelectedVersion: string = 'v3.2.1';

  private _comInitMlData(): void {
    this._comMlFeatureImportance = [
      {name:'Request Rate',importance:0.234,color:'#f97316'},
      {name:'Payload Size',importance:0.198,color:'#3b82f6'},
      {name:'Time of Day',importance:0.167,color:'#8b5cf6'},
      {name:'Source IP Reputation',importance:0.145,color:'#10b981'},
      {name:'User Behavior Score',importance:0.112,color:'#ef4444'},
      {name:'Endpoint Type',importance:0.089,color:'#06b6d4'},
      {name:'Protocol Anomaly',importance:0.055,color:'#f59e0b'},
    ];
    this._comMlConfusionMatrix = [
      [142, 3, 1],
      [2, 98, 4],
      [0, 5, 45],
    ];
    this._comMlTrainingHistory = Array.from({length:20}, (_,i) => ({
      epoch: i+1,
      loss: Math.max(0.02, 0.8 * Math.exp(-0.15*i) + 0.02 + Math.random()*0.01),
      valLoss: Math.max(0.03, 0.85 * Math.exp(-0.14*i) + 0.03 + Math.random()*0.015),
      accuracy: Math.min(0.99, 0.6 + 0.39 * (1 - Math.exp(-0.18*i)) + Math.random()*0.005),
      valAccuracy: Math.min(0.98, 0.58 + 0.38 * (1 - Math.exp(-0.16*i)) + Math.random()*0.008),
    }));
    this._comMlConfidenceBins = [
      {range:'0-10%',count:12,color:'#ef4444'},
      {range:'10-30%',count:34,color:'#f97316'},
      {range:'30-50%',count:67,color:'#f59e0b'},
      {range:'50-70%',count:128,color:'#eab308'},
      {range:'70-90%',count:245,color:'#22c55e'},
      {range:'90-100%',count:514,color:'#10b981'},
    ];
    this._comMlVersionHistory = [
      {version:'v1.0.0',date:'2025-01-15',accuracy:0.812,f1:0.789,notes:'Initial model with basic features'},
      {version:'v2.0.0',date:'2025-04-20',accuracy:0.887,f1:0.874,notes:'Added behavioral analysis features'},
      {version:'v2.5.0',date:'2025-08-10',accuracy:0.912,f1:0.901,notes:'Improved temporal pattern detection'},
      {version:'v3.0.0',date:'2025-11-30',accuracy:0.931,f1:0.922,notes:'Neural network architecture upgrade'},
      {version:'v3.2.1',date:'2026-03-15',accuracy:0.945,f1:0.941,notes:'Fine-tuned on recent threat data'},
    ];
  }

  private _comRenderMlFeatures(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Machine Learning Features">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Machine Learning Analysis</span>
          <div style="display:flex;gap:4px">
            ${['importance','metrics','matrix','training','confidence','versions'].map(v => html`
              <button class="tab ${this._comMlActiveView === v ? 'active' : ''}" @click=${() => { this._comMlActiveView = v; }}>${v.charAt(0).toUpperCase() + v.slice(1)}</button>
            `)}
          </div>
        </div>
        ${this._comMlActiveView === 'importance' ? this._comRenderFeatureImportance() : nothing}
        ${this._comMlActiveView === 'metrics' ? this._comRenderModelMetrics() : nothing}
        ${this._comMlActiveView === 'matrix' ? this._comRenderConfusionMatrix() : nothing}
        ${this._comMlActiveView === 'training' ? this._comRenderTrainingHistory() : nothing}
        ${this._comMlActiveView === 'confidence' ? this._comRenderConfidenceDist() : nothing}
        ${this._comMlActiveView === 'versions' ? this._comRenderVersionHistory() : nothing}
      </div>
    `;
  }

  private _comRenderFeatureImportance(): any {
    const maxImp = Math.max(...this._comMlFeatureImportance.map(f => f.importance));
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Feature Importance Ranking (Model ${this._comMlModelVersion})</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${this._comMlFeatureImportance.map((f, i) => html`
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

  private _comRenderModelMetrics(): any {
    const m = this._comMlMetrics;
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

  private _comRenderConfusionMatrix(): any {
    const labels = ['Benign','Suspicious','Malicious'];
    const cm = this._comMlConfusionMatrix;
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

  private _comRenderTrainingHistory(): any {
    const data = this._comMlTrainingHistory;
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

  private _comRenderConfidenceDist(): any {
    const bins = this._comMlConfidenceBins;
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

  private _comRenderVersionHistory(): any {
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Model Version Comparison</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${this._comMlVersionHistory.map(v => html`
          <div style="background:${v.version === this._comMlSelectedVersion ? '#1e293b' : '#1a1d2e'};border-radius:6px;padding:10px;border-left:3px solid ${v.version === this._comMlSelectedVersion ? '#3b82f6' : '#374151'};cursor:pointer" @click=${() => { this._comMlSelectedVersion = v.version; }}>
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
  @state() private _comCompActiveFramework: string = 'nist';
  @state() private _comNistCategories: {id:string;name:string;status:'implemented'|'partial'|'not-started';priority:number;progress:number}[] = [];
  @state() private _comCisControls: {number:number;name:string;implementation:number;maturity:string;owner:string}[] = [];
  @state() private _comIsoClauses: {clause:string;title:string;status:string;evidence:number;gap:string}[] = [];
  @state() private _comGdprArticles: {article:string;title:string;compliant:boolean;notes:string}[] = [];
  @state() private _comSoc2Criteria: {criteria:string;category:string;status:string;score:number}[] = [];
  @state() private _comCompGapFilter: string = 'all';

  private _comInitComplianceData(): void {
    this._comNistCategories = [
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
    this._comCisControls = [
      {number:1,name:'Inventory and Control of Enterprise Assets',implementation:82,maturity:'Defined',owner:'IT Ops'},
      {number:2,name:'Inventory and Control of Software Assets',implementation:75,maturity:'Managed',owner:'SecOps'},
      {number:3,name:'Data Protection',implementation:90,maturity:'Defined',owner:'DPO'},
      {number:4,name:'Secure Configuration of Enterprise Assets',implementation:68,maturity:'Managed',owner:'IT Ops'},
      {number:5,name:'Account Management',implementation:85,maturity:'Defined',owner:'IAM Team'},
      {number:6,name:'Access Control Management',implementation:88,maturity:'Defined',owner:'IAM Team'},
      {number:7,name:'Continuous Vulnerability Management',implementation:72,maturity:'Managed',owner:'SecOps'},
      {number:8,name:'Audit Log Management',implementation:80,maturity:'Defined',owner:'SecOps'},
    ];
    this._comIsoClauses = [
      {clause:'A.5.1',title:'Policies for Information Security',status:'Compliant',evidence:12,gap:'None'},
      {clause:'A.5.9',title:'Inventory of Information Assets',status:'Compliant',evidence:8,gap:'None'},
      {clause:'A.6.1',title:'Screening of Candidates',status:'Partial',evidence:5,gap:'Background check process not documented for contractors'},
      {clause:'A.7.1',title:'Before Using Information',status:'Compliant',evidence:10,gap:'None'},
      {clause:'A.8.1',title:'User Endpoint Devices',status:'Partial',evidence:4,gap:'MDM coverage at 78%, target 95%'},
      {clause:'A.8.9',title:'Configuration Management',status:'Partial',evidence:6,gap:'Automated config drift detection missing'},
      {clause:'A.8.16',title:'Monitoring Activities',status:'Compliant',evidence:9,gap:'None'},
      {clause:'A.8.23',title:'Web Filtering',status:'Not Started',evidence:0,gap:'No web filtering solution deployed'},
    ];
    this._comGdprArticles = [
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
    this._comSoc2Criteria = [
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

  private _comRenderComplianceDeepDive(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Compliance Framework Deep Dive">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Compliance Framework</span>
          <div style="display:flex;gap:4px">
            ${['nist','cis','iso','gdpr','soc2'].map(fw => html`
              <button class="tab ${this._comCompActiveFramework === fw ? 'active' : ''}" @click=${() => { this._comCompActiveFramework = fw; }}>${fw.toUpperCase()}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:10px">
          ${['all','implemented','partial','not-started'].map(f => html`
            <button class="tab ${this._comCompGapFilter === f ? 'active' : ''}" @click=${() => { this._comCompGapFilter = f; }} style="font-size:10px">${f === 'all' ? 'All' : f === 'not-started' ? 'Not Started' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
          `)}
        </div>
        ${this._comCompActiveFramework === 'nist' ? this._comRenderNistCsf() : nothing}
        ${this._comCompActiveFramework === 'cis' ? this._comRenderCisControls() : nothing}
        ${this._comCompActiveFramework === 'iso' ? this._comRenderIso27001() : nothing}
        ${this._comCompActiveFramework === 'gdpr' ? this._comRenderGdprChecklist() : nothing}
        ${this._comCompActiveFramework === 'soc2' ? this._comRenderSoc2Criteria() : nothing}
      </div>
    `;
  }

  private _comRenderNistCsf(): any {
    const filtered = this._comCompGapFilter === 'all' ? this._comNistCategories : this._comNistCategories.filter(c => c.status === this._comCompGapFilter);
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

  private _comRenderCisControls(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">CIS Controls v8 Implementation Tracking</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._comCisControls.map(c => html`
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

  private _comRenderIso27001(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">ISO 27001 Clause Coverage Matrix</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._comIsoClauses.map(c => html`
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

  private _comRenderGdprChecklist(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">GDPR Article Compliance Checklist</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._comGdprArticles.map(a => html`
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

  private _comRenderSoc2Criteria(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">SOC 2 Trust Service Criteria Mapping</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._comSoc2Criteria.map(c => html`
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
  @state() private _comNetNodes: {id:string;label:string;type:string;segment:string;x:number;y:number;status:string}[] = [];
  @state() private _comNetEdges: {from:string;to:string;weight:number;traffic:number;type:string}[] = [];
  @state() private _comNetSelectedNode: string = '';
  @state() private _comNetPathStart: string = '';
  @state() private _comNetPathEnd: string = '';
  @state() private _comNetPathResult: string[] = [];
  @state() private _comNetSegmentFilter: string = 'all';
  @state() private _comNetTrafficOverlay: boolean = false;
  @state() private _comNetZoom: number = 1;

  private _comInitNetworkData(): void {
    this._comNetNodes = [
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
    this._comNetEdges = [
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

  private _comFindPath(start: string, end: string): string[] {
    const adj = new Map<string, string[]>();
    for (const e of this._comNetEdges) {
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

  private _comRenderNetworkMap(): any {
    const filteredNodes = this._comNetSegmentFilter === 'all' ? this._comNetNodes : this._comNetNodes.filter(n => n.segment === this._comNetSegmentFilter);
    const nodeMap = new Map(this._comNetNodes.map(n => [n.id, n]));
    const filteredEdges = this._comNetEdges.filter(e => filteredNodes.some(n => n.id === e.from) && filteredNodes.some(n => n.id === e.to));
    const typeColor: Record<string,string> = {firewall:'#ef4444',network:'#3b82f6',server:'#10b981',gateway:'#8b5cf6',database:'#f97316',cache:'#eab308',auth:'#06b6d4',monitoring:'#ec4899'};
    const pathSet = new Set(this._comNetPathResult);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Interactive Network Map">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Network Topology</span>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            ${['all','dmz','frontend','backend','data','services'].map(s => html`
              <button class="tab ${this._comNetSegmentFilter === s ? 'active' : ''}" @click=${() => { this._comNetSegmentFilter = s; }} style="font-size:10px">${s.charAt(0).toUpperCase() + s.slice(1)}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap">
          <select style="background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:4px;padding:4px 8px;font-size:11px" @change=${(e: any) => { this._comNetPathStart = e.target.value; }}>
            <option value="">Path Start...</option>
            ${this._comNetNodes.map(n => html`<option value=${n.id}>${n.label}</option>`)}
          </select>
          <span style="color:#6b7280;font-size:12px">→</span>
          <select style="background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:4px;padding:4px 8px;font-size:11px" @change=${(e: any) => { this._comNetPathEnd = e.target.value; }}>
            <option value="">Path End...</option>
            ${this._comNetNodes.map(n => html`<option value=${n.id}>${n.label}</option>`)}
          </select>
          <button class="tab active" @click=${() => { if (this._comNetPathStart && this._comNetPathEnd) this._comNetPathResult = this._comFindPath(this._comNetPathStart, this._comNetPathEnd); }} style="font-size:10px">Trace Path</button>
          <label style="display:flex;align-items:center;gap:4px;font-size:10px;color:#9ca3af;cursor:pointer">
            <input type="checkbox" .checked=${this._comNetTrafficOverlay} @change=${() => { this._comNetTrafficOverlay = !this._comNetTrafficOverlay; }}> Traffic Overlay
          </label>
        </div>
        <svg viewBox="0 0 650 540" style="width:100%;max-height:400px;background:#0a0c14;border-radius:6px;border:1px solid #1e293b">
          ${filteredEdges.map(e => {
            const from = nodeMap.get(e.from);
            const to = nodeMap.get(e.to);
            if (!from || !to) return nothing;
            const isPath = pathSet.has(e.from) && pathSet.has(e.to) && Math.abs(pathSet.indexOf(e.from) - pathSet.indexOf(e.to)) === 1;
            const strokeWidth = Math.max(1, e.weight / 10);
            const opacity = this._comNetTrafficOverlay ? Math.min(1, e.traffic / 500) : 0.6;
            return html`<line x1=${from.x} y1=${from.y} x2=${to.x} y2=${to.y} stroke=${isPath ? '#fbbf24' : '#374151'} stroke-width=${isPath ? strokeWidth + 2 : strokeWidth} opacity=${opacity} ${isPath ? 'stroke-dasharray="6"' : ''}/>`;
          })}
          ${filteredNodes.map(n => html`
            <g @click=${() => { this._comNetSelectedNode = n.id; }}>
              <circle cx=${n.x} cy=${n.y} r="16" fill=${typeColor[n.type] || '#6b7280'} opacity=${n.status === 'inactive' ? 0.3 : n.status === 'warning' ? 0.7 : 1} stroke=${this._comNetSelectedNode === n.id ? '#fbbf24' : 'none'} stroke-width="2"/>
              <text x=${n.x} y=${n.y + 1} text-anchor="middle" fill="white" font-size="7" font-weight="600">${n.type.charAt(0).toUpperCase()}</text>
              <text x=${n.x} y=${n.y + 28} text-anchor="middle" fill="#9ca3af" font-size="8">${n.label}</text>
              ${this._comNetTrafficOverlay ? html`<text x=${n.x} y=${n.y - 20} text-anchor="middle" fill="#60a5fa" font-size="7">${this._comNetEdges.filter(e => e.from === n.id || e.to === n.id).reduce((s,e) => s + e.traffic, 0)} Mbps</text>` : nothing}
            </g>
          `)}
        </svg>
        ${this._comNetPathResult.length > 0 ? html`
          <div style="margin-top:8px;background:#1a1d2e;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:4px">Traced Path (${this._comNetPathResult.length} hops):</div>
            <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
              ${this._comNetPathResult.map((id, i) => {
                const node = nodeMap.get(id);
                return html`
                  <span style="background:#fbbf2422;color:#fbbf24;font-size:10px;padding:2px 8px;border-radius:3px;font-weight:600">${node?.label || id}</span>
                  ${i < this._comNetPathResult.length - 1 ? html`<span style="color:#6b7280">→</span>` : nothing}
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
  @state() private _comSearchQuery: string = '';
  @state() private _comSearchResults: {id:string;title:string;relevance:number;type:string;date:string;preview:string}[] = [];
  @state() private _comSavedSearches: {id:string;query:string;createdAt:string;runCount:number}[] = [];
  @state() private _comRecentSearches: string[] = [];
  @state() private _comSearchFilters: {field:string;operator:string;value:string;logic:'and'|'or'|'not'}[] = [];
  @state() private _comSearchActiveFilterIdx: number = -1;
  @state() private _comSearchPreset: string = 'none';
  @state() private _comSearchIsRunning: boolean = false;

  private _comInitSearchData(): void {
    this._comSavedSearches = [
      {id:'s1',query:'severity:critical status:open',createdAt:'2026-04-20',runCount:12},
      {id:'s2',query:'type:intrusion network:internal',createdAt:'2026-04-18',runCount:8},
      {id:'s3',query:'policy:DLP destination:cloud',createdAt:'2026-04-15',runCount:5},
    ];
    this._comRecentSearches = ['critical vulnerabilities','failed login attempts','data exfiltration','phishing reports'];
  }

  private _comExecuteSearch(): void {
    if (!this._comSearchQuery.trim()) return;
    this._comSearchIsRunning = true;
    this._comRecentSearches = [this._comSearchQuery, ...this._comRecentSearches.filter(s => s !== this._comSearchQuery)].slice(0, 10);
    setTimeout(() => {
      const q = this._comSearchQuery.toLowerCase();
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
      this._comSearchResults = mockData.filter(r => r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || r.preview.toLowerCase().includes(q) || q.length < 3);
      this._comSearchIsRunning = false;
    }, 300);
  }

  private _comAddSearchFilter(): void {
    this._comSearchFilters.push({field:'',operator:'contains',value:'',logic:'and'});
    this._comSearchActiveFilterIdx = this._comSearchFilters.length - 1;
  }

  private _comRemoveSearchFilter(idx: number): void {
    this._comSearchFilters = this._comSearchFilters.filter((_, i) => i !== idx);
    if (this._comSearchActiveFilterIdx >= this._comSearchFilters.length) this._comSearchActiveFilterIdx = -1;
  }

  private _comApplySearchPreset(preset: string): void {
    this._comSearchPreset = preset;
    if (preset === 'critical') this._comSearchQuery = 'severity:critical status:open';
    else if (preset === 'recent') this._comSearchQuery = 'date:>2026-04-20 type:*';
    else if (preset === 'failed') this._comSearchQuery = 'status:failed action:blocked';
    this._comExecuteSearch();
  }

  private _comRenderAdvancedSearch(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Advanced Search and Filter">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Advanced Search</span>
          <div style="display:flex;gap:4px">
            ${['none','critical','recent','failed'].map(p => html`
              <button class="tab ${this._comSearchPreset === p ? 'active' : ''}" @click=${() => this._comApplySearchPreset(p)} style="font-size:10px">${p === 'none' ? 'Presets' : p.charAt(0).toUpperCase() + p.slice(1)}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <div style="flex:1;position:relative">
            <input type="text" placeholder="Search across all data types..." value=${this._comSearchQuery} @input=${(e: any) => { this._comSearchQuery = e.target.value; }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._comExecuteSearch(); }} style="width:100%;background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:6px;padding:8px 12px;font-size:12px;outline:none" aria-label="Search input"/>
          </div>
          <button class="tab active" @click=${() => this._comExecuteSearch()} style="padding:8px 16px" ?disabled=${this._comSearchIsRunning}>${this._comSearchIsRunning ? '...' : 'Search'}</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap">
          <span style="font-size:10px;color:#6b7280">Filters:</span>
          <button class="tab" @click=${() => this._comAddSearchFilter()} style="font-size:10px">+ Add Filter</button>
          ${this._comSearchFilters.map((f, i) => html`
            <div style="display:flex;gap:4px;align-items:center;background:#1a1d2e;border-radius:4px;padding:4px 8px">
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._comSearchFilters[i].field = e.target.value; }}>
                <option value="">Field</option>
                <option value="severity">Severity</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
                <option value="date">Date</option>
                <option value="source">Source</option>
              </select>
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._comSearchFilters[i].operator = e.target.value; }}>
                <option value="contains">Contains</option>
                <option value="equals">Equals</option>
                <option value="starts">Starts with</option>
                <option value="gt">Greater than</option>
                <option value="lt">Less than</option>
              </select>
              <input type="text" placeholder="Value" style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 6px;font-size:10px;width:80px" @input=${(e: any) => { this._comSearchFilters[i].value = e.target.value; }}/>
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._comSearchFilters[i].logic = e.target.value; }}>
                <option value="and">AND</option>
                <option value="or">OR</option>
                <option value="not">NOT</option>
              </select>
              <button @click=${() => this._comRemoveSearchFilter(i)} style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:12px;padding:0 2px">✕</button>
            </div>
          `)}
        </div>
        ${this._comSearchResults.length > 0 ? html`
          <div style="margin-bottom:8px;font-size:10px;color:#9ca3af">${this._comSearchResults.length} results found</div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto">
            ${this._comSearchResults.map(r => html`
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
        ${this._comRecentSearches.length > 0 && this._comSearchResults.length === 0 ? html`
          <div style="margin-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Recent Searches:</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              ${this._comRecentSearches.map(s => html`
                <button class="tab" @click=${() => { this._comSearchQuery = s; this._comExecuteSearch(); }} style="font-size:10px">${s}</button>
              `)}
            </div>
          </div>
        ` : nothing}
        ${this._comSavedSearches.length > 0 ? html`
          <div style="margin-top:8px;border-top:1px solid #1e293b;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Saved Searches:</div>
            <div style="display:flex;flex-direction:column;gap:3px">
              ${this._comSavedSearches.map(s => html`
                <div style="display:flex;justify-content:space-between;align-items:center;background:#1a1d2e;border-radius:4px;padding:4px 8px;cursor:pointer" @click=${() => { this._comSearchQuery = s.query; this._comExecuteSearch(); }}>
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
  @state() private _comUndoStack: {id:number;action:string;timestamp:string;snapshot:string}[] = [];
  @state() private _comRedoStack: {id:number;action:string;timestamp:string;snapshot:string}[] = [];
  @state() private _comHistoryCounter: number = 0;
  @state() private _comHistoryVisible: boolean = false;
  @state() private _comDiffViewActive: boolean = false;
  @state() private _comDiffFromId: number = -1;
  @state() private _comDiffToId: number = -1;
  @state() private _comCurrentSnapshot: string = '';

  private _comPushHistory(action: string): void {
    this._comHistoryCounter++;
    const entry = {
      id: this._comHistoryCounter,
      action,
      timestamp: new Date().toISOString(),
      snapshot: JSON.stringify({searchQuery: this._comSearchQuery, filters: this._comSearchFilters, compFramework: this._comCompActiveFramework, mlView: this._comMlActiveView}),
    };
    this._comUndoStack.push(entry);
    this._comRedoStack = [];
    this._comCurrentSnapshot = entry.snapshot;
  }

  private _comUndo(): void {
    if (this._comUndoStack.length <= 1) return;
    const current = this._comUndoStack.pop()!;
    this._comRedoStack.push(current);
    const prev = this._comUndoStack[this._comUndoStack.length - 1];
    this._comCurrentSnapshot = prev.snapshot;
    try {
      const data = JSON.parse(prev.snapshot);
      if (data.searchQuery !== undefined) this._comSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._comSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._comCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._comMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _comRedo(): void {
    if (this._comRedoStack.length === 0) return;
    const entry = this._comRedoStack.pop()!;
    this._comUndoStack.push(entry);
    this._comCurrentSnapshot = entry.snapshot;
    try {
      const data = JSON.parse(entry.snapshot);
      if (data.searchQuery !== undefined) this._comSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._comSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._comCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._comMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _comJumpToHistory(id: number): void {
    const idx = this._comUndoStack.findIndex(e => e.id === id);
    if (idx < 0) return;
    const removed = this._comUndoStack.splice(idx + 1);
    this._comRedoStack.push(...removed.reverse());
    const target = this._comUndoStack[this._comUndoStack.length - 1];
    this._comCurrentSnapshot = target.snapshot;
    try {
      const data = JSON.parse(target.snapshot);
      if (data.searchQuery !== undefined) this._comSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._comSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._comCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._comMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _comGetDiff(fromId: number, toId: number): {field:string;from:string;to:string}[] {
    const fromEntry = this._comUndoStack.find(e => e.id === fromId);
    const toEntry = this._comUndoStack.find(e => e.id === toId);
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

  private _comRenderUndoRedo(): any {
    const allHistory = [...this._comUndoStack];
    const diffs = this._comDiffViewActive && this._comDiffFromId >= 0 && this._comDiffToId >= 0 ? this._comGetDiff(this._comDiffFromId, this._comDiffToId) : [];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Undo Redo History">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Action History</span>
          <div style="display:flex;gap:4px">
            <button class="tab" @click=${() => this._comUndo()} ?disabled=${this._comUndoStack.length <= 1} style="font-size:10px">↩ Undo</button>
            <button class="tab" @click=${() => this._comRedo()} ?disabled=${this._comRedoStack.length === 0} style="font-size:10px">Redo ↪</button>
            <button class="tab ${this._comHistoryVisible ? 'active' : ''}" @click=${() => { this._comHistoryVisible = !this._comHistoryVisible; }} style="font-size:10px">Timeline</button>
            <button class="tab ${this._comDiffViewActive ? 'active' : ''}" @click=${() => { this._comDiffViewActive = !this._comDiffViewActive; }} style="font-size:10px">Diff</button>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;font-size:10px;color:#6b7280">
          <span>Undo: ${this._comUndoStack.length}</span>
          <span>|</span>
          <span>Redo: ${this._comRedoStack.length}</span>
          <span>|</span>
          <span>Total Actions: ${this._comHistoryCounter}</span>
        </div>
        ${this._comHistoryVisible ? html`
          <div style="background:#1a1d2e;border-radius:6px;padding:8px;max-height:200px;overflow-y:auto;margin-bottom:8px">
            ${allHistory.map((entry, i) => html`
              <div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #0f1117;cursor:pointer;opacity:${i === allHistory.length - 1 ? 1 : 0.6}" @click=${() => this._comJumpToHistory(entry.id)}>
                <div style="width:12px;height:12px;border-radius:50%;background:${i === allHistory.length - 1 ? '#3b82f6' : '#374151'};flex-shrink:0"></div>
                <span style="font-size:10px;color:#e2e8f0;flex:1">${entry.action}</span>
                <span style="font-size:9px;color:#6b7280">${new Date(entry.timestamp).toLocaleTimeString()}</span>
                ${this._comDiffViewActive ? html`
                  <input type="radio" name="diff-from" style="accent-color:#3b82f6" @change=${() => { this._comDiffFromId = entry.id; }}/>
                  <input type="radio" name="diff-to" style="accent-color:#f97316" @change=${() => { this._comDiffToId = entry.id; }}/>
                ` : nothing}
              </div>
            `)}
          </div>
        ` : nothing}
        ${this._comDiffViewActive ? html`
          <div style="background:#1a1d2e;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:6px">${diffs.length > 0 ? 'Differences found:' : this._comDiffFromId >= 0 && this._comDiffToId >= 0 ? 'No differences' : 'Select two points in timeline to compare'}</div>
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
  @state() private _comActiveSubTab: string = 'scenario';

  private _comGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _comRenderSubPanel(): any {
    switch (this._comActiveSubTab) {
      case 'scenario': return this._comRenderScenarioEngine();
      case 'timeseries': return this._comRenderTimeSeries();
      case 'rbac': return this._comRenderRBAC();
      case 'reporting': return this._comRenderReporting();
      case 'a11y': return this._comRenderAccessibility();
      default: return nothing;
    }
  }

  private _comRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._comGetAllSubTabs().map(t => html`
          <button class="tab ${this._comActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._comActiveSubTab = t.key; }} role="tab" aria-selected=${this._comActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="com-tab-${this._comActiveSubTab}">
        ${this._comRenderSubPanel()}
      </div>
    `;
  }

  
  // Register new subtabs for extended sections
  private _catGetNewSubTabs(): {key:string;label:string}[] {
    return [
      { key: 'analytics', label: 'Analytics' },
      { key: 'incident-coord', label: 'IR Coordination' },
      { key: 'metrics-corr', label: 'Metrics Correlation' },
      { key: 'api-gateway', label: 'API Gateway' },
      { key: 'perf-opt', label: 'Performance' },
    ];
  }

  // ========== Section A: Advanced Analytics Engine ==========
  @state() private _catBayesianPrior: number = 0.5;
  @state() private _catBayesianLikelihood: number = 0.7;
  @state() private _catMonteCarloResults: number[] = [];
  @state() private _catCorrelationMatrix: number[][] = [];
  @state() private _catOutlierIndices: number[] = [];
  @state() private _catTrendComponents: {trend:number;seasonal:number;residual:number}[] = [];
  @state() private _catAnalyticsView: string = 'bayesian';
  @state() private _catConfidenceLevel: number = 95;
  @state() private _catMonteCarloIterations: number = 100;

  private _catCalculateBayesianPosterior(): number {
    const prior = this._catBayesianPrior;
    const likelihood = this._catBayesianLikelihood;
    const falsePositiveRate = 1 - likelihood;
    const marginal = prior * likelihood + (1 - prior) * falsePositiveRate;
    return marginal > 0 ? (prior * likelihood) / marginal : 0;
  }

  private _catRunMonteCarloSimulation(): number[] {
    const results: number[] = [];
    const baseRisk = 0.35;
    const volatility = 0.15;
    for (let i = 0; i < this._catMonteCarloIterations; i++) {
      let cumulative = baseRisk;
      for (let j = 0; j < 12; j++) {
        const shock = (Math.random() - 0.5) * 2 * volatility;
        cumulative = Math.max(0, Math.min(1, cumulative + shock * 0.1));
      }
      results.push(cumulative);
    }
    this._catMonteCarloResults = results;
    return results;
  }

  private _catComputeCorrelationMatrix(): number[][] {
    const events = this._catGenerateMockTimeSeries(6, 50);
    const n = events.length;
    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        row.push(this._catPearsonCorrelation(events[i], events[j]));
      }
      matrix.push(row);
    }
    this._catCorrelationMatrix = matrix;
    return matrix;
  }

  private _catPearsonCorrelation(x: number[], y: number[]): number {
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

  private _catDetectOutliersZScore(data: number[]): number[] {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length);
    const threshold = 2.0;
    return data.map((v, i) => Math.abs((v - mean) / (std || 1)) > threshold ? i : -1).filter(i => i >= 0);
  }

  private _catDetectOutliersIQR(data: number[]): number[] {
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    return data.map((v, i) => v < lower || v > upper ? i : -1).filter(i => i >= 0);
  }

  private _catDecomposeTrend(data: number[]): {trend:number;seasonal:number;residual:number}[] {
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
    this._catTrendComponents = result;
    return result;
  }

  private _catPredictiveScoreWithCI(data: number[]): {score:number;low:number;high:number} {
    const recent = data.slice(-10);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const std = Math.sqrt(recent.reduce((a, b) => a + (b - avg) ** 2, 0) / recent.length);
    const zScore = this._catConfidenceLevel === 99 ? 2.576 : this._catConfidenceLevel === 90 ? 1.645 : 1.96;
    return { score: avg, low: avg - zScore * std, high: avg + zScore * std };
  }

  private _catGenerateMockTimeSeries(count: number, length: number): number[][] {
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

  private _catRenderAnalyticsEngine(): any {
    const posterior = this._catCalculateBayesianPosterior();
    const mcResults = this._catMonteCarloResults.length > 0 ? this._catMonteCarloResults : this._catRunMonteCarloSimulation();
    const mcAvg = mcResults.reduce((a, b) => a + b, 0) / mcResults.length;
    const mcP95 = [...mcResults].sort((a, b) => a - b)[Math.floor(mcResults.length * 0.95)];
    const matrix = this._catCorrelationMatrix.length > 0 ? this._catCorrelationMatrix : this._catComputeCorrelationMatrix();
    const labels = ['Vulns', 'Incidents', 'Phishing', 'Access', 'Compliance', 'Training'];
    return html`
      <div class="analytics-engine" style="padding:12px">
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <button class="tab ${this._catAnalyticsView === 'bayesian' ? 'active' : ''}" @click=${() => { this._catAnalyticsView = 'bayesian'; }}>Bayesian</button>
          <button class="tab ${this._catAnalyticsView === 'montecarlo' ? 'active' : ''}" @click=${() => { this._catAnalyticsView = 'montecarlo'; }}>Monte Carlo</button>
          <button class="tab ${this._catAnalyticsView === 'correlation' ? 'active' : ''}" @click=${() => { this._catAnalyticsView = 'correlation'; }}>Correlation</button>
          <button class="tab ${this._catAnalyticsView === 'outliers' ? 'active' : ''}" @click=${() => { this._catAnalyticsView = 'outliers'; }}>Outliers</button>
          <button class="tab ${this._catAnalyticsView === 'trend' ? 'active' : ''}" @click=${() => { this._catAnalyticsView = 'trend'; }}>Trend</button>
          <button class="tab ${this._catAnalyticsView === 'predictive' ? 'active' : ''}" @click=${() => { this._catAnalyticsView = 'predictive'; }}>Predictive</button>
        </div>
        ${this._catAnalyticsView === 'bayesian' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Bayesian Risk Probability</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div><span style="color:#888">Prior:</span> ${this._catBayesianPrior.toFixed(2)}</div>
              <div><span style="color:#888">Likelihood:</span> ${this._catBayesianLikelihood.toFixed(2)}</div>
              <div><span style="color:#888">Posterior:</span> <strong style="color:${posterior > 0.6 ? '#f44' : '#4f4'}">${posterior.toFixed(4)}</strong></div>
              <div><span style="color:#888">Risk Level:</span> ${posterior > 0.7 ? 'Critical' : posterior > 0.5 ? 'High' : posterior > 0.3 ? 'Medium' : 'Low'}</div>
            </div>
            <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
              <label style="color:#888;font-size:12px">Prior:</label>
              <input type="range" min="0" max="100" .value=${String(this._catBayesianPrior * 100)} @input=${(e: any) => { this._catBayesianPrior = Number(e.target.value) / 100; }} style="flex:1" />
              <label style="color:#888;font-size:12px">Likelihood:</label>
              <input type="range" min="0" max="100" .value=${String(this._catBayesianLikelihood * 100)} @input=${(e: any) => { this._catBayesianLikelihood = Number(e.target.value) / 100; }} style="flex:1" />
            </div>
          </div>
        ` : nothing}
        ${this._catAnalyticsView === 'montecarlo' ? html`
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
            <button class="btn" style="margin-top:8px" @click=${() => { this._catRunMonteCarloSimulation(); }}>Re-run Simulation</button>
          </div>
        ` : nothing}
        ${this._catAnalyticsView === 'correlation' ? html`
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
        ${this._catAnalyticsView === 'outliers' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Statistical Outlier Detection</h4>
            ${['zscore', 'iqr'].map(method => {
              const data = this._catGenerateMockTimeSeries(1, 30)[0];
              const outliers = method === 'zscore' ? this._catDetectOutliersZScore(data) : this._catDetectOutliersIQR(data);
              return html`<div style="margin-bottom:8px">
                <div style="color:#aaa;font-size:12px">${method === 'zscore' ? 'Z-Score Method' : 'IQR Method'}: ${outliers.length} outliers detected</div>
                <div style="display:flex;gap:1px;height:30px;align-items:flex-end">${data.map((v, i) => html`<div style="flex:1;background:${outliers.includes(i) ? '#f44' : '#3a3d4a'};height:${v}%;min-height:1px"></div>`)}</div>
              </div>`;
            })}
          </div>
        ` : nothing}
        ${this._catAnalyticsView === 'trend' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Trend Decomposition</h4>
            ${['Trend', 'Seasonal', 'Residual'].map((comp, ci) => html`
              <div style="margin-bottom:8px">
                <div style="color:#aaa;font-size:12px">${comp}</div>
                <div style="display:flex;gap:1px;height:25px;align-items:center">${this._catDecomposeTrend(this._catGenerateMockTimeSeries(1, 24)[0]).map(p => {
                  const val = [p.trend, p.seasonal * 500, p.residual][ci];
                  return html`<div style="flex:1;background:${ci === 0 ? '#4a9' : ci === 1 ? '#a4a' : '#aa4'};height:${Math.abs(val) * 50}%;min-height:1px"></div>`;
                })}</div>
              </div>
            `)}
          </div>
        ` : nothing}
        ${this._catAnalyticsView === 'predictive' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Predictive Scoring with Confidence Intervals</h4>
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
              <label style="color:#888;font-size:12px">Confidence:</label>
              <select .value=${String(this._catConfidenceLevel)} @change=${(e: any) => { this._catConfidenceLevel = Number(e.target.value); }}>
                <option value="90">90%</option><option value="95">95%</option><option value="99">99%</option>
              </select>
            </div>
            ${['Risk Score', 'Compliance', 'Threat Index'].map(label => {
              const data = this._catGenerateMockTimeSeries(1, 20)[0];
              const pred = this._catPredictiveScoreWithCI(data);
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
  @state() private _catWarRoomActive: boolean = false;
  @state() private _catWarRoomParticipants: string[] = ['SOC Lead', 'IR Manager', 'CISO', 'Legal', 'PR'];
  @state() private _catIncidentSeverity: string = 'P3';
  @state() private _catEscalationLevel: number = 0;
  @state() private _catCommTemplate: string = 'initial';
  @state() private _catLessonsLearned: string = '';
  @state() private _catPostIncidentAnswers: Record<string, string> = {};
  @state() private _catWarRoomMessages: {sender:string;time:string;text:string}[] = [];

  private _catGetSeverityMatrix(): {severity:string;responseTime:string;escalation:string;notify:string}[] {
    return [
      { severity: 'P1 - Critical', responseTime: '15 min', escalation: 'CISO + CEO + Legal', notify: 'All stakeholders immediately' },
      { severity: 'P2 - High', responseTime: '30 min', escalation: 'CISO + IR Manager', notify: 'Security team + affected dept heads' },
      { severity: 'P3 - Medium', responseTime: '2 hours', escalation: 'IR Manager', notify: 'Security team' },
      { severity: 'P4 - Low', responseTime: '24 hours', escalation: 'SOC Lead', notify: 'Ticket created' },
    ];
  }

  private _catGetCommunicationTemplates(): {key:string;subject:string;body:string}[] {
    return [
      { key: 'initial', subject: 'Security Incident Notification', body: 'We are investigating a potential security incident. The security team has been activated and is assessing the scope. We will provide updates every 30 minutes. Please do not share this information externally.' },
      { key: 'escalation', subject: 'Incident Escalation - Action Required', body: 'The incident has been escalated to P1 severity. Additional resources have been engaged. All non-essential access to affected systems has been suspended pending investigation.' },
      { key: 'contained', subject: 'Incident Containment Update', body: 'The incident has been contained. Affected systems have been isolated. Forensic analysis is ongoing. We will provide a detailed timeline within 24 hours.' },
      { key: 'resolved', subject: 'Incident Resolution Notification', body: 'The incident has been fully resolved. Root cause analysis is complete. Remediation actions have been implemented. A post-incident review has been scheduled.' },
      { key: 'external', subject: 'Security Advisory', body: 'We have identified and resolved a security matter. There is no evidence of customer data impact. We are working with relevant authorities and will provide updates as appropriate.' },
    ];
  }

  private _catGetStakeholderMatrix(): {role:string;notifyP1:boolean;notifyP2:boolean;notifyP3:boolean;channel:string}[] {
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

  private _catGetPostIncidentQuestions(): {id:string;question:string;type:string;options:string[]}[] {
    return [
      { id: 'q1', question: 'What was the initial detection method?', type: 'select', options: ['SIEM Alert', 'User Report', 'Threat Intel Feed', 'Automated Scan', 'Third-party Notification'] },
      { id: 'q2', question: 'How long was the dwell time?', type: 'select', options: ['< 1 hour', '1-24 hours', '1-7 days', '7-30 days', '> 30 days'] },
      { id: 'q3', question: 'Was the incident response plan followed?', type: 'select', options: ['Fully', 'Partially', 'Deviated significantly', 'No plan existed'] },
      { id: 'q4', question: 'What was the root cause category?', type: 'select', options: ['Misconfiguration', 'Unpatched Vulnerability', 'Social Engineering', 'Insider Threat', 'Zero-day Exploit', 'Supply Chain'] },
      { id: 'q5', question: 'What improvements are needed?', type: 'text', options: [] },
    ];
  }

  private _catToggleWarRoom(): void {
    this._catWarRoomActive = !this._catWarRoomActive;
    if (this._catWarRoomActive) {
      this._catWarRoomMessages = [
        { sender: 'System', time: new Date().toLocaleTimeString(), text: 'War room activated. All participants notified.' },
        { sender: 'SOC Lead', time: new Date().toLocaleTimeString(), text: 'Acknowledged. Investigating initial indicators.' },
      ];
    }
  }

  private _catSendWarRoomMessage(text: string): void {
    this._catWarRoomMessages = [...this._catWarRoomMessages, {
      sender: 'You', time: new Date().toLocaleTimeString(), text
    }];
  }

  private _catEscalateIncident(): void {
    const levels = ['P4', 'P3', 'P2', 'P1'];
    const idx = levels.indexOf(this._catIncidentSeverity);
    if (idx < levels.length - 1) {
      this._catIncidentSeverity = levels[idx + 1];
      this._catEscalationLevel = idx + 1;
    }
  }

  private _catRenderIncidentCoordination(): any {
    const templates = this._catGetCommunicationTemplates();
    const currentTemplate = templates.find(t => t.key === this._catCommTemplate) || templates[0];
    const questions = this._catGetPostIncidentQuestions();
    const severityMatrix = this._catGetSeverityMatrix();
    const stakeholders = this._catGetStakeholderMatrix();
    return html`
      <div class="incident-coordination" style="padding:12px">
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <button class="tab ${this._catWarRoomActive ? 'active' : ''}" @click=${() => { this._catToggleWarRoom(); }}>War Room ${this._catWarRoomActive ? '(Active)' : ''}</button>
          <button class="tab" @click=${() => { this._catEscalateIncident(); }}>Escalate (${this._catIncidentSeverity})</button>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Severity Escalation Matrix</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Severity</th><th style="color:#888">Response Time</th><th style="color:#888">Escalation</th><th style="color:#888">Notification</th></tr></thead>
            <tbody>${severityMatrix.map(r => html`
              <tr style="${r.severity.startsWith(this._catIncidentSeverity) ? 'background:rgba(255,68,68,0.15)' : ''}">
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
            ${templates.map(t => html`<button class="tab ${this._catCommTemplate === t.key ? 'active' : ''}" @click=${() => { this._catCommTemplate = t.key; }}>${t.subject.split(' - ')[0]}</button>`)}
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
                <select style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px" @change=${(e: any) => { this._catPostIncidentAnswers = {...this._catPostIncidentAnswers, [q.id]: e.target.value}; }}>
                  <option value="">Select...</option>
                  ${q.options.map(o => html`<option value="${o}" ${this._catPostIncidentAnswers[q.id] === o ? 'selected' : ''}>${o}</option>`)}
                </select>
              ` : html`
                <textarea style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px;min-height:40px" placeholder="Enter details..." @input=${(e: any) => { this._catPostIncidentAnswers = {...this._catPostIncidentAnswers, [q.id]: e.target.value}; }}></textarea>
              `}
            </div>
          `)}
          <div style="margin-top:8px">
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:4px">Lessons Learned</label>
            <textarea style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px;min-height:60px" .value=${this._catLessonsLearned} @input=${(e: any) => { this._catLessonsLearned = e.target.value; }}></textarea>
          </div>
        </div>
      </div>
    `;
  }

  // ========== Section C: Security Metrics Correlation ==========
  @state() private _catMetricData: Record<string, number[]> = {};
  @state() private _catCompositeScore: number = 72;
  @state() private _catMetricAlerts: string[] = [];
  @state() private _catLeadingIndicators: string[] = ['Phishing Click Rate', 'Patch Compliance', 'Training Completion', 'Access Review Age'];
  @state() private _catLaggingIndicators: string[] = ['Incident Count', 'MTTR', 'Data Breach Cost', 'Compliance Failures'];
  @state() private _catExecutiveSummary: string = '';

  private _catInitializeMetricData(): void {
    const metrics = ['Vulnerability Count', 'Incident Rate', 'Patch Coverage', 'Training Score', 'Compliance Pct', 'Access Anomalies'];
    metrics.forEach(m => {
      this._catMetricData[m] = this._catGenerateMockTimeSeries(1, 30)[0];
    });
  }

  private _catCalculateCompositeScore(): number {
    const weights: Record<string, number> = {
      'Vulnerability Count': -0.2, 'Incident Rate': -0.25, 'Patch Coverage': 0.2,
      'Training Score': 0.15, 'Compliance Pct': 0.15, 'Access Anomalies': -0.05
    };
    let score = 75;
    for (const [metric, weight] of Object.entries(weights)) {
      const data = this._catMetricData[metric];
      if (data && data.length > 0) {
        const recent = data.slice(-7);
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        score += (avg - 50) * weight;
      }
    }
    this._catCompositeScore = Math.max(0, Math.min(100, score));
    return this._catCompositeScore;
  }

  private _catDetectMetricAnomalies(): string[] {
    const alerts: string[] = [];
    for (const [metric, data] of Object.entries(this._catMetricData)) {
      if (!data || data.length < 10) continue;
      const outliers = this._catDetectOutliersZScore(data);
      if (outliers.length > 0) {
        alerts.push(metric + ': ' + outliers.length + ' anomalous data points detected in last ' + data.length + ' periods');
      }
      const last = data[data.length - 1];
      const prev = data[data.length - 2];
      if (Math.abs(last - prev) / (Math.abs(prev) || 1) > 0.5) {
        alerts.push(metric + ': ' + (last > prev ? 'Sudden increase' : 'Sudden decrease') + ' of ' + (Math.abs(last - prev) / (Math.abs(prev) || 1) * 100).toFixed(0) + '%');
      }
    }
    this._catMetricAlerts = alerts;
    return alerts;
  }

  private _catGenerateExecutiveSummary(): string {
    const score = this._catCalculateCompositeScore();
    const alerts = this._catDetectMetricAnomalies();
    const scoreTrend = score > 80 ? 'improving' : score > 60 ? 'stable' : 'declining';
    let summary = 'Security Posture Score: ' + score.toFixed(0) + '/100 (' + scoreTrend + '). ';
    summary += 'Leading indicators show ' + (this._catLeadingIndicators.length > 2 ? 'generally positive' : 'mixed') + ' trends. ';
    if (alerts.length > 0) {
      summary += 'Active alerts: ' + alerts.length + '. Key concerns: ' + alerts.slice(0, 3).join('; ') + '. ';
    } else {
      summary += 'No critical metric anomalies detected. ';
    }
    summary += 'Recommendation: ' + (score > 80 ? 'Maintain current security posture and continue monitoring.' : score > 60 ? 'Focus on patch management and training completion rates.' : 'Immediate attention required for vulnerability remediation and incident response readiness.');
    this._catExecutiveSummary = summary;
    return summary;
  }

  private _catRenderMetricsCorrelation(): any {
    if (Object.keys(this._catMetricData).length === 0) this._catInitializeMetricData();
    const score = this._catCalculateCompositeScore();
    const alerts = this._catDetectMetricAnomalies();
    const metricNames = Object.keys(this._catMetricData);
    const corrMatrix = metricNames.map((m1, i) =>
      metricNames.map((m2, j) => this._catPearsonCorrelation(this._catMetricData[m1] || [], this._catMetricData[m2] || []))
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
              ${this._catLeadingIndicators.map(ind => html`<div style="color:#aaa;font-size:11px;padding:2px 0">- ${ind}</div>`)}
            </div>
            <div>
              <div style="color:#a4a;font-size:12px;font-weight:bold;margin-bottom:4px">Lagging (Reactive)</div>
              ${this._catLaggingIndicators.map(ind => html`<div style="color:#aaa;font-size:11px;padding:2px 0">- ${ind}</div>`)}
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
          <div style="background:#1a1d27;padding:8px;border-radius:4px;color:#bbb;font-size:12px;line-height:1.6">${this._catGenerateExecutiveSummary()}</div>
          <button class="btn" style="margin-top:8px;font-size:11px" @click=${() => { this._catGenerateExecutiveSummary(); }}>Regenerate Summary</button>
        </div>
      </div>
    `;
  }

  // ========== Section D: API Gateway & Rate Limiting ==========
  @state() private _catApiEndpoints: {id:string;path:string;method:string;status:string;latency:number;rateLimit:number}[] = [];
  @state() private _catRateLimitPolicy: {endpoint:string;requestsPerMin:number;burstLimit:number;windowSec:number}[] = [];
  @state() private _catApiKeys: {id:string;name:string;created:string;expires:string;status:string;lastUsed:string}[] = [];
  @state() private _catWebhookStatuses: {id:string;url:string;events:string;lastDelivery:string;status:string;retryCount:number}[] = [];

  private _catInitializeApiData(): void {
    this._catApiEndpoints = [
      { id: 'api-1', path: '/api/v1/security/events', method: 'POST', status: 'active', latency: 45, rateLimit: 100 },
      { id: 'api-2', path: '/api/v1/vulnerabilities', method: 'GET', status: 'active', latency: 120, rateLimit: 200 },
      { id: 'api-3', path: '/api/v1/incidents', method: 'POST', status: 'active', latency: 85, rateLimit: 50 },
      { id: 'api-4', path: '/api/v1/assets', method: 'GET', status: 'active', latency: 200, rateLimit: 150 },
      { id: 'api-5', path: '/api/v1/compliance', method: 'GET', status: 'deprecated', latency: 350, rateLimit: 30 },
    ];
    this._catRateLimitPolicy = [
      { endpoint: '/api/v1/security/*', requestsPerMin: 100, burstLimit: 150, windowSec: 60 },
      { endpoint: '/api/v1/vulnerabilities/*', requestsPerMin: 200, burstLimit: 300, windowSec: 60 },
      { endpoint: '/api/v1/incidents/*', requestsPerMin: 50, burstLimit: 75, windowSec: 60 },
      { endpoint: '/api/v1/assets/*', requestsPerMin: 150, burstLimit: 200, windowSec: 60 },
    ];
    this._catApiKeys = [
      { id: 'key-1', name: 'SOC Integration Key', created: '2025-01-15', expires: '2026-01-15', status: 'active', lastUsed: '2 min ago' },
      { id: 'key-2', name: 'SIEM Connector', created: '2025-03-20', expires: '2026-03-20', status: 'active', lastUsed: '5 min ago' },
      { id: 'key-3', name: 'Legacy Scanner', created: '2024-06-01', expires: '2025-06-01', status: 'expired', lastUsed: '30 days ago' },
    ];
    this._catWebhookStatuses = [
      { id: 'wh-1', url: 'https://hooks.slack.com/services/T00/B00/xxx', events: 'incident.created', lastDelivery: '1 min ago', status: 'success', retryCount: 0 },
      { id: 'wh-2', url: 'https://api.pagerduty.com/integration/xxx', events: 'incident.escalated', lastDelivery: '5 min ago', status: 'success', retryCount: 0 },
      { id: 'wh-3', url: 'https://webhooks.jira.com/xxx', events: 'vulnerability.critical', lastDelivery: 'Failed', status: 'failed', retryCount: 3 },
    ];
  }

  private _catUpdateRateLimit(endpoint: string, field: string, value: number): void {
    this._catRateLimitPolicy = this._catRateLimitPolicy.map(p =>
      p.endpoint === endpoint ? { ...p, [field]: value } : p
    );
  }

  private _catRenderApiGateway(): any {
    if (this._catApiEndpoints.length === 0) this._catInitializeApiData();
    const totalRpm = this._catApiEndpoints.reduce((a, e) => a + (Math.random() * e.rateLimit * 0.5), 0);
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
              <div style="color:#e0e0e0;font-size:20px;font-weight:bold">${this._catApiEndpoints.length}</div>
              <div style="color:#888;font-size:10px">Active Endpoints</div>
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">API Endpoints</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Endpoint</th><th style="color:#888">Method</th><th style="color:#888">Latency</th><th style="color:#888">Rate Limit</th><th style="color:#888">Status</th></tr></thead>
            <tbody>${this._catApiEndpoints.map(e => html`
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
          ${this._catRateLimitPolicy.map(p => html`
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;padding:4px;background:#1a1d27;border-radius:4px">
              <span style="color:#ddd;font-size:10px;font-family:monospace;min-width:160px">${p.endpoint}</span>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="color:#888;font-size:10px">RPM:</span>
                <input type="number" style="background:#0d0f17;color:#ddd;border:1px solid #333;padding:2px 4px;border-radius:3px;width:60px;font-size:11px" .value=${String(p.requestsPerMin)} @change=${(e: any) => { this._catUpdateRateLimit(p.endpoint, 'requestsPerMin', Number(e.target.value)); }} />
              </div>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="color:#888;font-size:10px">Burst:</span>
                <input type="number" style="background:#0d0f17;color:#ddd;border:1px solid #333;padding:2px 4px;border-radius:3px;width:60px;font-size:11px" .value=${String(p.burstLimit)} @change=${(e: any) => { this._catUpdateRateLimit(p.endpoint, 'burstLimit', Number(e.target.value)); }} />
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
            <tbody>${this._catApiKeys.map(k => html`
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
          ${this._catWebhookStatuses.map(w => html`
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
  @state() private _catRenderTime: number = 0;
  @state() private _catMemoryEstimate: number = 0;
  @state() private _catCacheHits: number = 0;
  @state() private _catCacheMisses: number = 0;
  @state() private _catLazyLoadingEnabled: boolean = true;
  @state() private _catVirtualScrollEnabled: boolean = false;
  @state() private _catPerfHistory: {timestamp:number;renderMs:number;memoryKb:number;cacheRatio:number}[] = [];
  @state() private _catDataSetSize: number = 1000;

  private _catMeasurePerformance(): void {
    const start = performance.now();
    const data = Array.from({ length: this._catDataSetSize }, (_, i) => ({
      id: i, value: Math.random() * 100, category: ['A', 'B', 'C'][i % 3],
      timestamp: Date.now() - i * 60000
    }));
    const filtered = data.filter(d => d.value > 30).map(d => d.value).sort((a, b) => b - a);
    const end = performance.now();
    this._catRenderTime = Math.round((end - start) * 100) / 100;
    this._catMemoryEstimate = Math.round((this._catDataSetSize * 0.15) * 100) / 100;
    this._catCacheHits = Math.floor(Math.random() * 80 + 60);
    this._catCacheMisses = Math.floor(Math.random() * 30 + 10);
    this._catPerfHistory.push({
      timestamp: Date.now(), renderMs: this._catRenderTime,
      memoryKb: this._catMemoryEstimate,
      cacheRatio: this._catCacheHits / (this._catCacheHits + this._catCacheMisses)
    });
    if (this._catPerfHistory.length > 20) this._catPerfHistory = this._catPerfHistory.slice(-20);
  }

  private _catGetCacheRatio(): number {
    const total = this._catCacheHits + this._catCacheMisses;
    return total > 0 ? this._catCacheHits / total : 0;
  }

  private _catGetPerfRecommendation(): string {
    if (this._catRenderTime > 50) return 'High render time detected. Consider enabling virtual scrolling and reducing data set size.';
    if (this._catGetCacheRatio() < 0.7) return 'Cache hit ratio is low. Review cache invalidation strategy and increase cache TTL.';
    if (this._catMemoryEstimate > 500) return 'High memory usage. Enable lazy loading and consider pagination for large datasets.';
    if (this._catDataSetSize > 500 && !this._catVirtualScrollEnabled) return 'Large dataset detected. Enable virtual scrolling for optimal performance.';
    return 'Performance is within acceptable parameters. Continue monitoring.';
  }

  private _catRenderPerformancePanel(): any {
    if (this._catPerfHistory.length === 0) this._catMeasurePerformance();
    const cacheRatio = this._catGetCacheRatio();
    const recommendation = this._catGetPerfRecommendation();
    const isWarning = recommendation.includes('detected') || recommendation.includes('low') || recommendation.includes('High');
    return html`
      <div class="perf-panel" style="padding:12px">
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Render Performance Metrics</h4>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${this._catRenderTime > 50 ? '#f44' : '#4f4'};font-size:18px;font-weight:bold">${this._catRenderTime}ms</div>
              <div style="color:#888;font-size:10px">Render Time</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${this._catMemoryEstimate > 500 ? '#fa0' : '#4a9'};font-size:18px;font-weight:bold">${this._catMemoryEstimate}KB</div>
              <div style="color:#888;font-size:10px">Memory Est.</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${cacheRatio > 0.8 ? '#4f4' : '#fa0'};font-size:18px;font-weight:bold">${(cacheRatio * 100).toFixed(0)}%</div>
              <div style="color:#888;font-size:10px">Cache Hit Ratio</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:#e0e0e0;font-size:18px;font-weight:bold">${this._catDataSetSize}</div>
              <div style="color:#888;font-size:10px">Dataset Size</div>
            </div>
          </div>
          <div style="margin-top:8px">
            <div style="display:flex;gap:8px;align-items:center">
              <label style="color:#888;font-size:12px">Dataset size:</label>
              <input type="range" min="100" max="10000" step="100" .value=${String(this._catDataSetSize)} @input=${(e: any) => { this._catDataSetSize = Number(e.target.value); }} style="flex:1" />
              <button class="btn" style="font-size:11px" @click=${() => { this._catMeasurePerformance(); }}>Benchmark</button>
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Optimization Controls</h4>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;color:#ddd;font-size:12px;cursor:pointer">
              <input type="checkbox" .checked=${this._catLazyLoadingEnabled} @change=${(e: any) => { this._catLazyLoadingEnabled = e.target.checked; }} />
              Lazy Loading
            </label>
            <label style="display:flex;align-items:center;gap:6px;color:#ddd;font-size:12px;cursor:pointer">
              <input type="checkbox" .checked=${this._catVirtualScrollEnabled} @change=${(e: any) => { this._catVirtualScrollEnabled = e.target.checked; }} />
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
                <span>Hits: ${this._catCacheHits}</span><span>Misses: ${this._catCacheMisses}</span>
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
            ${this._catPerfHistory.slice(-15).map(h => html`
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
  @state() private _catAle: number = 0;
  @state() private _catSroi: number = 0;
  @state() private _catCpi: number = 0;
  @state() private _catBudgetAlloc: number = 0;
  @state() private _catCostBenefit: number = 0;

  // Security Economics Calculator
  private catInitEconomics() {
    this._catAle = Math.round(2850000 + Math.random() * 4500000);
    this._catSroi = Math.round(180 + Math.random() * 320);
    this._catCpi = Math.round(45000 + Math.random() * 120000);
    this._catBudgetAlloc = Math.round(2500000 + Math.random() * 3000000);
    this._catCostBenefit = Math.round(220 + Math.random() * 180);
  }

  private _catCalcAle(): { annual: number; perIncident: number; byCategory: Array<{name: string; value: number}> } {
    const base = this._catAle;
    const categories = [
      { name: "Data Breach", value: Math.round(base * 0.35) },
      { name: "Ransomware", value: Math.round(base * 0.25) },
      { name: "Insider Threat", value: Math.round(base * 0.18) },
      { name: "Business Disruption", value: Math.round(base * 0.12) },
      { name: "Regulatory Fines", value: Math.round(base * 0.10) }
    ];
    return { annual: base, perIncident: Math.round(base / (3 + Math.floor(Math.random() * 8))), byCategory: categories };
  }

  private _catCalcSroi(): Array<{year: number; investment: number; savings: number; roi: number}> {
    const baseInv = this._catSroi * 10000;
    const projections: Array<{year: number; investment: number; savings: number; roi: number}> = [];
    for (let i = 1; i <= 5; i++) {
      const inv = Math.round(baseInv * (1 + 0.08 * i));
      const savings = Math.round(inv * (0.6 + i * 0.25));
      projections.push({ year: 2026 + i, investment: inv, savings, roi: Math.round((savings - inv) / inv * 100) });
    }
    return projections;
  }

  private _catGetBudgetAlloc(): Array<{category: string; amount: number; pct: number; trend: string}> {
    const total = this._catBudgetAlloc;
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

  private _catGetCostBenefit(): Array<{control: string; cost: number; benefit: number; ratio: number; priority: string}> {
    const base = this._catCostBenefit;
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

  private _catRenderEconomics() {
    const ale = this._catCalcAle();
    const roi = this._catCalcSroi();
    const budget = this._catGetBudgetAlloc();
    const cb = this._catGetCostBenefit();
    const cpi = this._catCpi;
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

  @state() private _catThreatLevel: any = null;
  @state() private _catEmergingThreats: any = null;
  @state() private _catThreatTrends: any = null;
  @state() private _catSectorRadar: any = null;
  @state() private _catActorActivity: any = null;

  // Threat Landscape Intelligence
  private catInitThreatIntel() {
    this._catThreatLevel = {
      americas: Math.round(50 + Math.random() * 40),
      europe: Math.round(40 + Math.random() * 45),
      asiaPacific: Math.round(55 + Math.random() * 35),
      middleEast: Math.round(45 + Math.random() * 50),
      africa: Math.round(30 + Math.random() * 40)
    };
    this._catEmergingThreats = [
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
    this._catThreatTrends = [
      { month: "Jan", phishing: 142, malware: 89, ransomware: 34 },
      { month: "Feb", phishing: 158, malware: 95, ransomware: 38 },
      { month: "Mar", phishing: 175, malware: 102, ransomware: 42 },
      { month: "Apr", phishing: 163, malware: 98, ransomware: 39 }
    ];
    this._catSectorRadar = [
      { sector: "Financial", risk: 82, trend: "up" },
      { sector: "Healthcare", risk: 78, trend: "up" },
      { sector: "Technology", risk: 71, trend: "stable" },
      { sector: "Government", risk: 85, trend: "up" },
      { sector: "Energy", risk: 68, trend: "down" }
    ];
    this._catActorActivity = [
      { actor: "APT-29", country: "Russia", activity: 85, targets: "Government" },
      { actor: "Lazarus", country: "DPRK", activity: 72, targets: "Financial" },
      { actor: "APT-41", country: "China", activity: 68, targets: "Technology" },
      { actor: "Fancy Bear", country: "Russia", activity: 64, targets: "Healthcare" },
      { actor: "Charming Kitten", country: "Iran", activity: 58, targets: "Energy" }
    ];
  }

  private _catRenderThreatIntel() {
    const tl = this._catThreatLevel;
    const et = this._catEmergingThreats;
    const sr = this._catSectorRadar;
    const aa = this._catActorActivity;
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

  @state() private _catPolicies: any = null;
  @state() private _catExceptions: any = null;
  @state() private _catRiskRegister: any = null;
  @state() private _catMeetings: any = null;
  @state() private _catDeadlines: any = null;

  // Security Governance Dashboard
  private catInitGovernance() {
    this._catPolicies = [
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
    this._catExceptions = [
      { id: "EXC-001", policy: "Access Control", reason: "Legacy system", risk: "Medium", expiry: "2026-06-30" },
      { id: "EXC-002", policy: "Encryption", reason: "Performance", risk: "High", expiry: "2026-05-15" },
      { id: "EXC-003", policy: "Password Policy", reason: "Vendor req", risk: "Low", expiry: "2026-08-01" }
    ];
    this._catRiskRegister = [
      { id: "RSK-001", desc: "Unpatched Exchange", likelihood: 4, impact: 5, owner: "IT Ops" },
      { id: "RSK-002", desc: "Shadow IT SaaS", likelihood: 3, impact: 4, owner: "CISO" },
      { id: "RSK-003", desc: "Privileged Access Creep", likelihood: 3, impact: 5, owner: "IAM Team" },
      { id: "RSK-004", desc: "DR Plan Gaps", likelihood: 2, impact: 5, owner: "BCP Lead" },
      { id: "RSK-005", desc: "Vendor Data Sharing", likelihood: 3, impact: 3, owner: "Legal" }
    ];
    this._catMeetings = [
      { name: "Security Steering", date: "2026-04-25", attendees: 8, status: "Scheduled" },
      { name: "Risk Committee", date: "2026-04-18", attendees: 6, status: "Completed" },
      { name: "Audit Review", date: "2026-05-02", attendees: 5, status: "Pending" }
    ];
    this._catDeadlines = [
      { regulation: "SOC 2 Type II", deadline: "2026-06-15", daysLeft: 53, status: "On Track" },
      { regulation: "GDPR Annual Review", deadline: "2026-05-25", daysLeft: 32, status: "At Risk" },
      { regulation: "ISO 27001 Audit", deadline: "2026-07-20", daysLeft: 88, status: "On Track" },
      { regulation: "PCI DSS v4.0", deadline: "2026-08-30", daysLeft: 129, status: "Planning" }
    ];
  }

  private _catRenderGovernance() {
    const policies = this._catPolicies;
    const risks = this._catRiskRegister;
    const deadlines = this._catDeadlines;
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

  @state() private _catCriticalAssets: any = null;
  @state() private _catAssetDeps: any = null;
  @state() private _catEolAssets: any = null;
  @state() private _catAssetRisk: any = null;

  // Asset Intelligence
  private catInitAssetIntel() {
    this._catCriticalAssets = [
      { name: "Core Banking DB", type: "Database", impact: "Critical", risk: 85, owner: "DBA Team" },
      { name: "Customer API Gateway", type: "Service", impact: "Critical", risk: 72, owner: "Platform" },
      { name: "Active Directory", type: "Infrastructure", impact: "Critical", risk: 68, owner: "IAM" },
      { name: "Data Warehouse", type: "Database", impact: "High", risk: 55, owner: "Analytics" },
      { name: "Email Server", type: "Application", impact: "High", risk: 48, owner: "IT Ops" },
      { name: "CI/CD Pipeline", type: "DevOps", impact: "High", risk: 62, owner: "DevOps" },
      { name: "Payment Processor", type: "Service", impact: "Critical", risk: 78, owner: "Finance IT" }
    ];
    this._catAssetDeps = [
      { from: "Web App", to: "API Gateway", type: "depends" },
      { from: "API Gateway", to: "Core Banking DB", type: "depends" },
      { from: "API Gateway", to: "Auth Service", type: "depends" },
      { from: "Auth Service", to: "Active Directory", type: "depends" },
      { from: "Payment Processor", to: "Core Banking DB", type: "depends" },
      { from: "Mobile App", to: "API Gateway", type: "depends" }
    ];
    this._catEolAssets = [
      { name: "Windows Server 2012 R2", count: 12, eolDate: "2023-10-10", risk: "Critical" },
      { name: "Oracle 11g", count: 3, eolDate: "2025-12-31", risk: "High" },
      { name: "Cisco ASA 5505", count: 8, eolDate: "2024-07-15", risk: "High" },
      { name: "CentOS 7", count: 25, eolDate: "2024-06-30", risk: "Medium" }
    ];
    this._catAssetRisk = { critical: 7, high: 23, medium: 45, low: 128, total: 203 };
  }

  private _catRenderAssetIntel() {
    const assets = this._catCriticalAssets;
    const eol = this._catEolAssets;
    const ar = this._catAssetRisk;
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

  @state() private _catUserBaseline: any = null;
  @state() private _catAnomalyRules: any = null;
  @state() private _catDataAccess: any = null;
  @state() private _catInsiderRisk: any = null;
  @state() private _complir15Timeline: Array<{id:string;time:string;event:string;severity:string;actor:string}> = [
    {id:'t1',time:'2026-01-15 08:23',event:'Anomalous login detected from external IP',severity:'high',actor:'unknown'},
    {id:'t2',time:'2026-01-15 08:45',event:'Privilege escalation via misconfigured service account',severity:'critical',actor:'SA-deploy-01'},
    {id:'t3',time:'2026-01-15 09:12',event:'Data exfiltration to external cloud storage',severity:'critical',actor:'SA-deploy-01'},
    {id:'t4',time:'2026-01-15 09:30',event:'Incident response team notified',severity:'medium',actor:'SOC Team'},
    {id:'t5',time:'2026-01-15 10:15',event:'Affected service account disabled',severity:'low',actor:'IR Lead'},
  ];
  @state() private _complir15RootCauses: Array<{why:string;answer:string}> = [
    {why:'Why was the login anomalous?',answer:'Credentials leaked via phishing email to IT admin'},
    {why:'Why was the phishing successful?',answer:'Email filter rules were too permissive for internal domains'},
    {why:'Why were rules misconfigured?',answer:'Change review process skipped for emergency rule update'},
    {why:'Why was the review skipped?',answer:'No automated enforcement of review policy for rule changes'},
    {why:'Why no automated enforcement?',answer:'Policy-as-code implementation backlog for 6 months'},
  ];
  @state() private _complir15ImpactMatrix: Array<{system:string;users:number;data:string;revenue:string;status:string}> = [
    {system:'Customer Database',users:12400,data:'PII of all customers',revenue:'$2.4M/day',status:'contained'},
    {system:'Payment Gateway',users:8900,data:'Tokenized payment records',revenue:'$1.8M/day',status:'unaffected'},
    {system:'HR Portal',users:3200,data:'Employee PII and payroll',revenue:'N/A',status:'investigating'},
    {system:'API Gateway',users:45000,data:'Auth tokens and API keys',revenue:'$5.1M/day',status:'contained'},
  ];
  @state() private _complir15Actions: Array<{id:string;item:string;owner:string;deadline:string;priority:string;status:string}> = [
    {id:'a1',item:'Rotate all service account credentials',owner:'DevOps Team',deadline:'2026-01-18',priority:'critical',status:'in_progress'},
    {id:'a2',item:'Implement email filter policy-as-code',owner:'Email Admin',deadline:'2026-01-22',priority:'high',status:'pending'},
    {id:'a3',item:'Deploy automated change review enforcement',owner:'Platform Team',deadline:'2026-01-25',priority:'high',status:'pending'},
    {id:'a4',item:'Conduct phishing awareness refresher',owner:'Security Awareness',deadline:'2026-01-20',priority:'medium',status:'assigned'},
    {id:'a5',item:'Review and update incident response playbook',owner:'IR Team',deadline:'2026-01-30',priority:'low',status:'pending'},
  ];
  @state() private _complir15Lessons: Array<{id:string;lesson:string;category:string;severity:string;applies_to:string}> = [
    {id:'l1',lesson:'Service accounts must have MFA enabled regardless of automation needs',category:'Identity',severity:'high',applies_to:'All service accounts'},
    {id:'l2',lesson:'Emergency changes still require post-incident review within 24 hours',category:'Process',severity:'high',applies_to:'All infrastructure changes'},
    {id:'l3',lesson:'Email filter rules must be version controlled and peer reviewed',category:'Email Security',severity:'medium',applies_to:'Email infrastructure'},
    {id:'l4',lesson:'Data exfiltration detection latency must be under 5 minutes',category:'Monitoring',severity:'medium',applies_to:'DLP systems'},
  ];
  @state() private _complir15ActiveTab: string = 'timeline';
  @state() private _complir15Benchmarks: Array<{metric:string;current:number;industry:number;target:number;unit:string;source:string}> = [
    {metric:'Mean Time to Detect',current:4.2,industry:6.8,target:3.0,unit:'hours',source:'SANS 2026'},
    {metric:'Mean Time to Respond',current:2.1,industry:4.5,target:1.0,unit:'hours',source:'SANS 2026'},
    {metric:'Patch Compliance',current:87,industry:72,target:95,unit:'%',source:'CIS Benchmark'},
    {metric:'Vuln Remediation SLA',current:78,industry:65,target:90,unit:'%',source:'Gartner'},
    {metric:'Phishing Click Rate',current:3.2,industry:12.5,target:2.0,unit:'%',source:'KnowBe4'},
    {metric:'MFA Coverage',current:94,industry:68,target:100,unit:'%',source:'CIS Controls'},
  ];
  @state() private _complir15MaturityLevels: Array<{domain:string;current:number;target:number;description:string}> = [
    {domain:'Identity and Access',current:4,target:5,description:'Strong MFA, automated provisioning, JIT access'},
    {domain:'Network Security',current:3,target:4,description:'Micro-segmentation partial, ZTNA in progress'},
    {domain:'Data Protection',current:3,target:4,description:'DLP deployed, encryption at rest in progress'},
    {domain:'Vulnerability Mgmt',current:4,target:5,description:'Automated scanning, risk-based prioritization'},
    {domain:'Incident Response',current:3,target:4,description:'Playbooks defined, automation growing'},
    {domain:'Governance and Risk',current:3,target:4,description:'Framework aligned, continuous monitoring building'},
  ];
  @state() private _complir15QuarterlyData: Array<{quarter:string;score:number;improvement:number}> = [
    {quarter:'Q1 2025',score:62,improvement:0},{quarter:'Q2 2025',score:67,improvement:5},
    {quarter:'Q3 2025',score:71,improvement:4},{quarter:'Q4 2025',score:74,improvement:3},
    {quarter:'Q1 2026',score:78,improvement:4},
  ];
  @state() private _complir15SelectedDomain: string = 'all';
  @state() private _complir15Alerts: Array<{id:string;name:string;severity:number;confidence:number;assetCrit:number;score:number;enriched:boolean;group:string;status:string;enrichData:Array<{key:string;value:string}>}> = [
    {id:'al1',name:'Brute force login attempt on prod-db',severity:5,confidence:0.9,assetCrit:5,score:0,enriched:true,group:'auth',status:'triaged',enrichData:[{key:'Source IP',value:'203.0.113.42'},{key:'Country',value:'Russia'},{key:'Threat Intel',value:'Known APT IP'}]},
    {id:'al2',name:'Unusual data transfer to external endpoint',severity:4,confidence:0.7,assetCrit:4,score:0,enriched:true,group:'exfil',status:'escalated',enrichData:[{key:'Destination',value:'s3-eu-west.amazonaws.com'},{key:'Volume',value:'2.4 GB in 30 min'},{key:'Reputation',value:'Neutral'}]},
    {id:'al3',name:'Privilege escalation attempt detected',severity:5,confidence:0.85,assetCrit:5,score:0,enriched:false,group:'auth',status:'new',enrichData:[]},
    {id:'al4',name:'Suspicious PowerShell execution',severity:3,confidence:0.5,assetCrit:3,score:0,enriched:false,group:'host',status:'new',enrichData:[]},
    {id:'al5',name:'Failed SSL certificate validation',severity:2,confidence:0.95,assetCrit:2,score:0,enriched:true,group:'net',status:'dismissed',enrichData:[{key:'Host',value:'api.internal.corp'},{key:'Expiry',value:'2026-01-10'}]},
  ];
  @state() private _complir15QualityMetrics: {fpRate:number;enrichSuccess:number;avgTriageTime:number;enrichedCount:number;totalCount:number} = {fpRate:0.12, enrichSuccess:0.78, avgTriageTime:4.5, enrichedCount:3, totalCount:5};
  @state() private _complir15RoutingRules: Array<{name:string;condition:string;channel:string;active:boolean}> = [
    {name:'Critical Asset Alert',condition:'asset_criticality >= 5 && severity >= 4',channel:'SOC Phone Bridge',active:true},
    {name:'Data Exfiltration',condition:'group == exfil && severity >= 3',channel:'IR Slack Channel',active:true},
    {name:'Authentication Anomaly',condition:'group == auth && confidence >= 0.8',channel:'SOC Dashboard',active:true},
    {name:'Low Priority Host',condition:'severity <= 2 && asset_criticality <= 2',channel:'Email Digest',active:false},
  ];
  @state() private _complir15Shapes: Array<{id:string;type:string;label:string;controls:string[]}> = [
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
  @state() private _complir15TrustBoundaries: Array<{from:string;to:string;label:string;strength:string}> = [
    {from:'sh1',to:'sh4',label:'External Boundary',strength:'strong'},
    {from:'sh2',to:'sh5',label:'Data Boundary',strength:'strong'},
    {from:'sh3',to:'sh6',label:'Identity Boundary',strength:'medium'},
    {from:'sh7',to:'sh8',label:'Build Boundary',strength:'weak'},
  ];
  @state() private _complir15ADRs: Array<{id:string;title:string;status:string;date:string;decision:string}> = [
    {id:'adr-001',title:'Adopt Zero Trust Network Architecture',status:'accepted',date:'2025-11-15',decision:'Replace VPN with ZTNA for all remote access'},
    {id:'adr-002',title:'Implement Service Mesh for East-West Traffic',status:'proposed',date:'2026-01-10',decision:'Deploy Istio with mTLS for all internal service communication'},
    {id:'adr-003',title:'Consolidate SIEM to Single Platform',status:'accepted',date:'2025-09-20',decision:'Migrate from Splunk+QRadar to unified Elastic SIEM'},
    {id:'adr-004',title:'Enforce Policy-as-Code for All Infrastructure',status:'in_review',date:'2026-02-01',decision:'Use Open Policy Agent for admission control and compliance checks'},
  ];
  @state() private _complir15SelectedShape: string = '';
  @state() private _complir15Gauges: Array<{name:string;value:number;max:number;unit:string;status:string;color:string}> = [
    {name:'API Response Time',value:142,max:500,unit:'ms',status:'healthy',color:'#4f4'},
    {name:'Error Rate',value:0.3,max:5,unit:'%',status:'healthy',color:'#4f4'},
    {name:'CPU Utilization',value:67,max:100,unit:'%',status:'warning',color:'#fa0'},
    {name:'Memory Usage',value:4.2,max:8,unit:'GB',status:'healthy',color:'#4f4'},
    {name:'Active Connections',value:1247,max:2000,unit:'',status:'healthy',color:'#4f4'},
    {name:'Queue Depth',value:342,max:500,unit:'',status:'warning',color:'#fa0'},
  ];
  @state() private _complir15Anomalies: Array<{id:string;time:string;description:string;severity:string;acknowledged:boolean}> = [
    {id:'an1',time:'10:42:15',description:'Spike in failed authentication attempts from 10.0.0.0/8',severity:'high',acknowledged:false},
    {id:'an2',time:'10:38:22',description:'Unusual data transfer volume on DB replication channel',severity:'medium',acknowledged:true},
    {id:'an3',time:'10:25:07',description:'Certificate expiry warning for api.internal.corp (7 days)',severity:'low',acknowledged:false},
    {id:'an4',time:'10:12:44',description:'DNS query pattern matches DGA domain characteristics',severity:'high',acknowledged:false},
  ];
  @state() private _complir15Integrations: Array<{name:string;status:string;uptime:number;lastCheck:string;latency:number}> = [
    {name:'SIEM Connector',status:'online',uptime:99.97,lastCheck:'10:45:00',latency:12},
    {name:'EDR Feed',status:'online',uptime:99.95,lastCheck:'10:45:00',latency:45},
    {name:'Threat Intel API',status:'degraded',uptime:98.2,lastCheck:'10:44:30',latency:230},
    {name:'Cloud Provider API',status:'online',uptime:99.99,lastCheck:'10:45:00',latency:8},
    {name:'Email Gateway',status:'online',uptime:99.98,lastCheck:'10:45:00',latency:15},
  ];
  @state() private _complir15AlertFatigue: Array<{analyst:string;alertsPerDay:number;escalated:number;dismissed:number;avgResponseMin:number}> = [
    {analyst:'Alice Chen',alertsPerDay:45,escalated:8,dismissed:12,avgResponseMin:3.2},
    {analyst:'Bob Martinez',alertsPerDay:62,escalated:11,dismissed:18,avgResponseMin:5.1},
    {analyst:'Carol Kim',alertsPerDay:38,escalated:5,dismissed:10,avgResponseMin:2.8},
    {analyst:'Dave Wilson',alertsPerDay:71,escalated:14,dismissed:22,avgResponseMin:6.4},
  ];
  @state() private _complir15SlaTarget: number = 99.9;

  // Insider Threat Detection
  private catInitInsiderThreat() {
    this._catUserBaseline = [
      { user: "admin_jdoe", avgLogins: 18, avgFiles: 45, avgNetwork: 2.3, riskScore: 12 },
      { user: "dev_ssmith", avgLogins: 22, avgFiles: 120, avgNetwork: 5.1, riskScore: 25 },
      { user: "mgr_jchen", avgLogins: 8, avgFiles: 30, avgNetwork: 1.2, riskScore: 8 },
      { user: "analyst_mlee", avgLogins: 15, avgFiles: 85, avgNetwork: 3.4, riskScore: 18 },
      { user: "contractor_abrown", avgLogins: 12, avgFiles: 200, avgNetwork: 8.7, riskScore: 42 }
    ];
    this._catAnomalyRules = [
      { rule: "After-hours access", enabled: true, triggers: 3, severity: "Medium" },
      { rule: "Mass download detection", enabled: true, triggers: 1, severity: "Critical" },
      { rule: "Privilege escalation", enabled: true, triggers: 0, severity: "High" },
      { rule: "Unusual data transfer", enabled: true, triggers: 5, severity: "High" },
      { rule: "Account sharing pattern", enabled: false, triggers: 2, severity: "Medium" },
      { rule: "Departure data spike", enabled: true, triggers: 0, severity: "Critical" }
    ];
    this._catDataAccess = [
      { resource: "Customer PII DB", accesses: 1245, anomalous: 18, trend: "up" },
      { resource: "Financial Reports", accesses: 832, anomalous: 5, trend: "stable" },
      { resource: "Source Code Repo", accesses: 2100, anomalous: 32, trend: "up" },
      { resource: "Trade Secrets", accesses: 156, anomalous: 8, trend: "up" }
    ];
    this._catInsiderRisk = { totalUsers: 2847, monitored: 342, flagged: 18, investigated: 5, confirmed: 1 };
  }

  private _catRenderInsiderThreat() {
    const baseline = this._catUserBaseline;
    const rules = this._catAnomalyRules;
    const ir = this._catInsiderRisk;
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
              <button class="btn ${this._complir15ActiveTab === t ? 'btn-primary' : ''}" style="font-size:10px;padding:3px 8px" @click=${() => { this._complir15ActiveTab = t; }}>${t.charAt(0).toUpperCase() + t.slice(1)}</button>
            `)}
          </div>
          ${this._complir15ActiveTab === 'timeline' ? html`
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._complir15Timeline.map(e => html`
                <div style="display:flex;gap:8px;align-items:flex-start;padding:6px;background:#1a1d27;border-radius:4px;border-left:3px solid ${e.severity === 'critical' ? '#f44' : e.severity === 'high' ? '#fa0' : e.severity === 'medium' ? '#ff0' : '#4f4'}">
                  <span style="color:#888;font-size:10px;min-width:110px">${e.time}</span>
                  <span style="color:#ddd;font-size:11px;flex:1">${e.event}</span>
                  <span style="color:#888;font-size:10px">${e.actor}</span>
                </div>
              `)}
            </div>
          ` : this._complir15ActiveTab === 'rootcause' ? html`
            <div style="margin-bottom:8px">${{__html: this._complir15RenderFishbone()}}</div>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._complir15RootCauses.map((rc, i) => html`
                <div style="display:flex;gap:8px;align-items:flex-start;padding:6px;background:#1a1d27;border-radius:4px">
                  <span style="color:#4a9eff;font-size:10px;min-width:20px">${i + 1}.</span>
                  <div style="flex:1"><div style="color:#aaa;font-size:10px">${rc.why}</div><div style="color:#ddd;font-size:11px">${rc.answer}</div></div>
                </div>
              `)}
            </div>
          ` : this._complir15ActiveTab === 'impact' ? html`
            <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:10px">
              <thead><tr style="color:#888"><th style="text-align:left;padding:4px">System</th><th style="padding:4px">Users</th><th style="text-align:left;padding:4px">Data</th><th style="padding:4px">Revenue</th><th style="padding:4px">Status</th></tr></thead>
              <tbody>${this._complir15ImpactMatrix.map(imp => html`
                <tr style="border-top:1px solid #2a2d37"><td style="padding:4px;color:#ddd">${imp.system}</td><td style="padding:4px;color:#aaa;text-align:center">${imp.users.toLocaleString()}</td><td style="padding:4px;color:#aaa">${imp.data}</td><td style="padding:4px;color:#fa0;text-align:center">${imp.revenue}</td><td style="padding:4px"><span style="color:${imp.status === 'contained' ? '#4f4' : imp.status === 'investigating' ? '#fa0' : '#f44'};font-size:9px;padding:2px 6px;background:${imp.status === 'contained' ? 'rgba(0,255,0,0.1)' : imp.status === 'investigating' ? 'rgba(255,170,0,0.1)' : 'rgba(255,0,0,0.1)'};border-radius:3px">${imp.status}</span></td></tr>
              `)}</tbody>
            </table></div>
          ` : this._complir15ActiveTab === 'actions' ? html`
            <div style="display:flex;gap:12px;margin-bottom:8px;font-size:10px;color:#888">
              ${Object.entries(this._complir15GetActionStats()).map(([k,v]) => html`<span>${k}: <b style="color:#ddd">${v}</b></span>`)}
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._complir15Actions.map(a => html`
                <div style="display:flex;gap:8px;align-items:center;padding:6px;background:#1a1d27;border-radius:4px;cursor:pointer" @click=${() => this._complir15ToggleAction(a.id)}>
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
              ${this._complir15Lessons.map(l => html`
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
            ${['all', ...this._complir15MaturityLevels.map(m => m.domain)].map(d => html`
              <button class="btn ${this._complir15SelectedDomain === d ? 'btn-primary' : ''}" style="font-size:9px;padding:2px 6px" @click=${() => { this._complir15SelectedDomain = d; }}>${d}</button>
            `)}
          </div>
          <div style="display:flex;gap:16px;margin-bottom:10px">
            <div style="text-align:center"><div style="color:#e0e0e0;font-size:20px;font-weight:bold">${this._complir15GetOverallMaturity()}/5</div><div style="color:#888;font-size:10px">Maturity Level</div></div>
            <div style="text-align:center"><div style="color:#4f4;font-size:20px;font-weight:bold">${this._complir15GetGapAnalysis().filter(g => g.isAbove).length}/${this._complir15Benchmarks.length}</div><div style="color:#888;font-size:10px">Above Industry</div></div>
          </div>
          <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead><tr style="color:#888"><th style="text-align:left;padding:3px">Metric</th><th style="padding:3px">Current</th><th style="padding:3px">Industry</th><th style="padding:3px">Target</th><th style="padding:3px">Gap</th><th style="padding:3px">Source</th></tr></thead>
            <tbody>${this._complir15GetGapAnalysis().map(b => html`
              <tr style="border-top:1px solid #2a2d37"><td style="padding:3px;color:#ddd">${b.metric}</td><td style="padding:3px;color:#e0e0e0;text-align:center;font-weight:bold">${b.current}${b.unit}</td><td style="padding:3px;color:#888;text-align:center">${b.industry}${b.unit}</td><td style="padding:3px;color:#4a9eff;text-align:center">${b.target}${b.unit}</td><td style="padding:3px;text-align:center;color:${b.isAbove ? '#4f4' : '#fa0'}">${b.isAbove ? '+' : ''}${b.gap.toFixed(1)}</td><td style="padding:3px;color:#666;font-size:9px">${b.source}</td></tr>
            `)}</tbody>
          </table></div>
          <div style="margin-top:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Maturity by Domain</div>
            ${this._complir15MaturityLevels.filter(m => this._complir15SelectedDomain === 'all' || m.domain === this._complir15SelectedDomain).map(m => html`
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
                <span style="color:#aaa;font-size:10px;min-width:100px">${m.domain}</span>
                <div style="flex:1;background:#1a1d27;border-radius:3px;height:8px;overflow:hidden"><div style="height:100%;width:${m.current * 20}%;background:${m.current >= 4 ? '#4f4' : m.current >= 3 ? '#fa0' : '#f44'};border-radius:3px"></div></div>
                <span style="color:#ddd;font-size:10px;min-width:40px">${m.current}/5</span>
              </div>
            `)}
          </div>
          <div style="margin-top:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Quarterly Trend</div>
            <div style="display:flex;height:40px;align-items:flex-end;gap:4px">
              ${this._complir15QuarterlyData.map(q => html`<div style="flex:1;text-align:center"><div style="background:#4a9eff;height:${q.score * 0.5}px;border-radius:2px 2px 0 0" title="${q.score}"></div><div style="color:#666;font-size:8px;margin-top:2px">${q.quarter}</div></div>`)}
            </div>
          </div>
        </div>

        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Alert Triage and Enrichment</h4>
          <div style="display:flex;gap:12px;margin-bottom:8px;font-size:10px">
            <div style="display:flex;gap:4px;flex-wrap:wrap">${this._complir15GroupAlerts().map(g => html`<span style="color:#888;padding:2px 6px;background:#1a1d27;border-radius:3px">${g.group}: ${g.count}</span>`)}</div>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:8px;font-size:10px;color:#888">
            <span>FP Rate: <b style="color:${this._complir15QualityMetrics.fpRate > 0.15 ? '#f44' : '#4f4'}">${(this._complir15QualityMetrics.fpRate * 100).toFixed(1)}%</b></span>
            <span>Enrich: <b style="color:#4a9eff">${(this._complir15QualityMetrics.enrichSuccess * 100).toFixed(0)}%</b></span>
            <span>Avg Triage: <b style="color:#ddd">${this._complir15QualityMetrics.avgTriageTime}m</b></span>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto">
            ${this._complir15Alerts.sort((a, b) => this._complir15CalcScore(b) - this._complir15CalcScore(a)).map(a => {
              const score = this._complir15CalcScore(a);
              return html`
                <div style="padding:6px;background:#1a1d27;border-radius:4px;border-left:3px solid ${a.severity >= 4 ? '#f44' : a.severity >= 3 ? '#fa0' : '#4a9eff'}">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="color:#ddd;font-size:11px;flex:1">${a.name}</span>
                    <span style="color:#e0e0e0;font-size:12px;font-weight:bold;min-width:40px;text-align:center">${score.toFixed(1)}</span>
                    <button class="btn" style="font-size:9px;padding:1px 6px;margin-left:4px" @click=${() => this._complir15EnrichAlert(a.id)}>${a.enriched ? 'Re-enrich' : 'Enrich'}</button>
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
            ${this._complir15RoutingRules.map(r => html`
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
            ${this._complir15Shapes.map(s => {
              const v = this._complir15ValidateControl(s.id);
              return html`<div style="padding:4px 8px;background:#1a1d27;border-radius:3px;cursor:pointer;border:1px solid ${this._complir15SelectedShape === s.id ? '#4a9eff' : '#2a2d37'}" @click=${() => { this._complir15SelectedShape = this._complir15SelectedShape === s.id ? '' : s.id; }}>
                <div style="display:flex;align-items:center;gap:4px"><span style="color:${v.valid ? '#4f4' : '#f44'};font-size:10px">${v.valid ? '\u2713' : '\u2717'}</span><span style="color:#ddd;font-size:10px">${s.label}</span></div>
                <div style="color:#888;font-size:8px">${s.controls.length} controls</div>
              </div>`;
            })}
          </div>
          ${this._complir15SelectedShape ? html`
            ${(() => {
              const shape = this._complir15Shapes.find(s => s.id === this._complir15SelectedShape);
              const v = this._complir15ValidateControl(this._complir15SelectedShape);
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
            ${this._complir15TrustBoundaries.map(tb => html`
              <div style="display:flex;gap:6px;align-items:center;padding:3px;background:#1a1d27;border-radius:3px;margin-bottom:2px;font-size:9px">
                <span style="color:#ddd">${this._complir15Shapes.find(s => s.id === tb.from)?.label || tb.from}</span>
                <span style="color:#4a9eff">\u2194</span>
                <span style="color:#ddd">${this._complir15Shapes.find(s => s.id === tb.to)?.label || tb.to}</span>
                <span style="flex:1"></span>
                <span style="color:#888">${tb.label}</span>
                <span style="color:${tb.strength === 'strong' ? '#4f4' : tb.strength === 'medium' ? '#fa0' : '#f44'};font-size:9px;padding:1px 4px;border-radius:2px;background:${tb.strength === 'strong' ? 'rgba(0,255,0,0.1)' : tb.strength === 'medium' ? 'rgba(255,170,0,0.1)' : 'rgba(255,0,0,0.1)'}">${tb.strength}</span>
              </div>
            `)}
          </div>
          <div><div style="color:#888;font-size:10px;margin-bottom:4px">Architecture Decision Records</div>
            ${this._complir15ADRs.map(adr => html`
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
            ${this._complir15Gauges.map(g => html`
              <div style="flex:1;min-width:100px;padding:6px;background:#1a1d27;border-radius:4px;text-align:center">
                <div style="color:#888;font-size:9px;margin-bottom:2px">${g.name}</div>
                <div style="color:${g.status === 'healthy' ? '#4f4' : g.status === 'warning' ? '#fa0' : '#f44'};font-size:18px;font-weight:bold">${g.value}${g.unit}</div>
                <div style="background:#2a2d37;border-radius:3px;height:4px;margin-top:4px;overflow:hidden"><div style="height:100%;width:${(g.value / g.max * 100)}%;background:${g.color};border-radius:3px"></div></div>
              </div>
            `)}
          </div>
          <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
            <span style="color:#888;font-size:10px">System Health:</span>
            <span style="color:${this._complir15GetOverallHealth().score >= 99 ? '#4f4' : '#fa0'};font-size:12px;font-weight:bold">${this._complir15GetOverallHealth().score}%</span>
            <span style="color:#888;font-size:10px">(Target: ${this._complir15SlaTarget}%)</span>
            <span style="color:#4f4;font-size:10px">${this._complir15GetOverallHealth().healthy} healthy</span>
            <span style="color:#fa0;font-size:10px">${this._complir15GetOverallHealth().degraded} degraded</span>
          </div>
          <div style="margin-bottom:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Anomaly Stream</div>
            ${this._complir15Anomalies.slice(0, 3).map(a => html`
              <div style="display:flex;gap:6px;align-items:center;padding:4px;background:#1a1d27;border-radius:3px;margin-bottom:2px;opacity:${a.acknowledged ? 0.5 : 1}">
                <span style="color:#888;font-size:9px;min-width:50px">${a.time}</span>
                <span style="color:${a.severity === 'high' ? '#f44' : a.severity === 'medium' ? '#fa0' : '#888'};font-size:9px;min-width:30px">${a.severity.toUpperCase()}</span>
                <span style="color:#ddd;font-size:10px;flex:1">${a.description}</span>
                ${!a.acknowledged ? html`<button class="btn" style="font-size:8px;padding:1px 4px" @click=${() => this._complir15AckAnomaly(a.id)}>ACK</button>` : html`<span style="color:#4f4;font-size:9px">ACK'd</span>`}
              </div>
            `)}
          </div>
          <div style="margin-bottom:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Integration Health</div>
            ${this._complir15Integrations.map(i => html`
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
              <tbody>${this._complir15AlertFatigue.map(af => html`
                <tr style="border-top:1px solid #2a2d37"><td style="padding:3px;color:#ddd">${af.analyst}</td><td style="padding:3px;color:${af.alertsPerDay > 60 ? '#f44' : af.alertsPerDay > 40 ? '#fa0' : '#4f4'};text-align:center">${af.alertsPerDay}</td><td style="padding:3px;color:#aaa;text-align:center">${af.escalated}</td><td style="padding:3px;color:#888;text-align:center">${af.dismissed}</td><td style="padding:3px;color:#aaa;text-align:center">${af.avgResponseMin}m</td><td style="padding:3px;text-align:center;color:${af.alertsPerDay > 60 ? '#f44' : af.alertsPerDay > 40 ? '#fa0' : '#4f4'}">${af.alertsPerDay > 60 ? 'HIGH' : af.alertsPerDay > 40 ? 'MEDIUM' : 'LOW'}</td></tr>
              `)}</tbody>
            </table></div>
          </div>
        </div>
</div>
      </div>`;
  }



  private _complir15RenderFishbone(): string {
    const categories = ['People','Process','Technology','Environment','Communication','Policy'];
    const bones = categories.map((cat, i) => {
      const angle = 30 + i * 20;
      return '<line x1="200" y1="150" x2="' + (200 + Math.cos(angle * Math.PI / 180) * 140) + '" y2="' + (150 - Math.sin(angle * Math.PI / 180) * 140) + '" stroke="#4a9eff" stroke-width="1.5"/><text x="' + (200 + Math.cos(angle * Math.PI / 180) * 145) + '" y="' + (150 - Math.sin(angle * Math.PI / 180) * 145) + '" fill="#e0e0e0" font-size="9" text-anchor="middle">' + cat + '</text>';
    }).join('');
    return '<svg width="400" height="300" viewBox="0 0 400 300"><line x1="60" y1="150" x2="340" y2="150" stroke="#e0e0e0" stroke-width="2"/><line x1="200" y1="30" x2="200" y2="270" stroke="#e0e0e0" stroke-width="2"/><text x="200" y="290" fill="#fa0" font-size="11" text-anchor="middle" font-weight="bold">Service Account Compromise</text>' + bones + '</svg>';
  }

  private _complir15ToggleAction(id: string) {
    this._complir15Actions = this._complir15Actions.map(a => a.id === id ? {...a, status: a.status === 'pending' ? 'in_progress' : a.status === 'in_progress' ? 'completed' : 'pending'} : a);
  }

  private _complir15GetActionStats() {
    const total = this._complir15Actions.length;
    const done = this._complir15Actions.filter(a => a.status === 'completed').length;
    const inProg = this._complir15Actions.filter(a => a.status === 'in_progress').length;
    return { total, done, inProg, pending: total - done - inProg };
  }

  private _complir15GetOverallMaturity(): number {
    if (this._complir15SelectedDomain === 'all') {
      return Math.round(this._complir15MaturityLevels.reduce((s, m) => s + m.current, 0) / this._complir15MaturityLevels.length * 10) / 10;
    }
    const d = this._complir15MaturityLevels.find(m => m.domain === this._complir15SelectedDomain);
    return d ? d.current : 0;
  }

  private _complir15GetGapAnalysis() {
    return this._complir15Benchmarks.map(b => {
      const gap = b.current - b.industry;
      const targetGap = b.target - b.current;
      const isAbove = gap > 0;
      return { ...b, gap, targetGap, isAbove, status: isAbove ? 'exceeds' : targetGap > 0 ? 'improving' : 'on_track' };
    });
  }

  private _complir15CalcScore(alert: any): number {
    return Math.round(alert.severity * alert.confidence * alert.assetCrit * 100) / 100;
  }

  private _complir15EnrichAlert(id: string) {
    this._complir15Alerts = this._complir15Alerts.map(a => {
      if (a.id !== id) return a;
      const score = this._complir15CalcScore(a);
      return { ...a, enriched: true, score, enrichData: a.enrichData.length > 0 ? a.enrichData : [{key:'Auto-Enriched',value:'Simulated at ' + new Date().toLocaleTimeString()},{key:'Reputation',value: Math.random() > 0.5 ? 'Malicious' : 'Neutral'},{key:'Geo',value: 'US-EAST'}] };
    });
  }

  private _complir15GroupAlerts() {
    const groups: Record<string, number> = {};
    this._complir15Alerts.forEach(a => { groups[a.group] = (groups[a.group] || 0) + 1; });
    return Object.entries(groups).map(([g, c]) => ({group: g, count: c}));
  }

  private _complir15ValidateControl(shapeId: string): {valid:boolean;missing:string[]} {
    const shape = this._complir15Shapes.find(s => s.id === shapeId);
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

  private _complir15GetOverallHealth(): {healthy:number;degraded:number;down:number;score:number} {
    const online = this._complir15Integrations.filter(i => i.status === 'online').length;
    const degraded = this._complir15Integrations.filter(i => i.status === 'degraded').length;
    const total = this._complir15Integrations.length;
    return { healthy: online, degraded, down: total - online - degraded, score: Math.round(online / total * 100) };
  }

  private _complir15AckAnomaly(id: string) {
    this._complir15Anomalies = this._complir15Anomalies.map(a => a.id === id ? {...a, acknowledged: true} : a);
  }
// ===== SECURITY POSTURE TREND ANALYSIS (R22) =====
  private _r22PostureTrends = [
    { month: '2025-05', score: 72, network: 78, endpoint: 65, cloud: 70, identity: 80, data: 68, app: 71 },
    { month: '2025-06', score: 74, network: 79, endpoint: 67, cloud: 72, identity: 82, data: 70, app: 73 },
    { month: '2025-07', score: 73, network: 80, endpoint: 66, cloud: 73, identity: 81, data: 69, app: 72 },
    { month: '2025-08', score: 76, network: 81, endpoint: 69, cloud: 75, identity: 83, data: 72, app: 74 },
    { month: '2025-09', score: 78, network: 82, endpoint: 71, cloud: 76, identity: 85, data: 74, app: 76 },
    { month: '2025-10', score: 77, network: 83, endpoint: 72, cloud: 78, identity: 84, data: 73, app: 75 },
    { month: '2025-11', score: 80, network: 84, endpoint: 74, cloud: 80, identity: 86, data: 76, app: 78 },
    { month: '2025-12', score: 82, network: 85, endpoint: 76, cloud: 82, identity: 88, data: 78, app: 80 },
    { month: '2026-01', score: 81, network: 86, endpoint: 77, cloud: 83, identity: 87, data: 77, app: 79 },
    { month: '2026-02', score: 83, network: 87, endpoint: 79, cloud: 85, identity: 89, data: 79, app: 81 },
    { month: '2026-03', score: 85, network: 88, endpoint: 81, cloud: 87, identity: 90, data: 81, app: 83 },
    { month: '2026-04', score: 86, network: 89, endpoint: 82, cloud: 88, identity: 91, data: 83, app: 84 },
  ];

  private _r22PosturePrediction = [
    { month: '2026-05', predicted: 88, lower: 85, upper: 91, confidence: 0.82 },
    { month: '2026-06', predicted: 89, lower: 86, upper: 92, confidence: 0.78 },
    { month: '2026-07', predicted: 90, lower: 86, upper: 94, confidence: 0.73 },
  ];

  private _r22IndustryPercentile = { current: 78, peer: 65, industry: 72, top: 92, sector: 81 };

  private _r22QoQDeltas = [
    { quarter: 'Q1 2026', overall: 5, network: 3, endpoint: 5, cloud: 5, identity: 3, data: 4, app: 4 },
    { quarter: 'Q4 2025', overall: 4, network: 3, endpoint: 4, cloud: 4, identity: 2, data: 4, app: 3 },
    { quarter: 'Q3 2025', overall: 3, network: 2, endpoint: 3, cloud: 3, identity: 2, data: 2, app: 2 },
  ];

  private _r22PostureRecommendations = [
    { id: 'rec-1', priority: 'high', domain: 'Endpoint', title: 'Deploy EDR to remaining 12% of endpoints', impact: 8, effort: 3, status: 'open' },
    { id: 'rec-2', priority: 'high', domain: 'Data', title: 'Implement automated DLP policies for PII', impact: 7, effort: 4, status: 'in-progress' },
    { id: 'rec-3', priority: 'medium', domain: 'Cloud', title: 'Enable CSPM for multi-cloud environment', impact: 6, effort: 3, status: 'open' },
    { id: 'rec-4', priority: 'medium', domain: 'App', title: 'Integrate SAST into CI/CD pipelines', impact: 7, effort: 5, status: 'planned' },
    { id: 'rec-5', priority: 'low', domain: 'Identity', title: 'Migrate remaining legacy accounts to SSO', impact: 4, effort: 6, status: 'planned' },
  ];

  private _r22RenderPostureTrend(): ReturnType<typeof html> {
    const latest = this._r22PostureTrends[this._r22PostureTrends.length - 1];
    const prev = this._r22PostureTrends[this._r22PostureTrends.length - 2];
    const delta = latest.score - prev.score;
    const barW = (v: number) => Math.max(2, v * 0.6);
    const dims = ['network', 'endpoint', 'cloud', 'identity', 'data', 'app'] as const;
    const dimLabels: Record<string, string> = { network: 'Network', endpoint: 'Endpoint', cloud: 'Cloud', identity: 'Identity', data: 'Data', app: 'Application' };
    return html`
      <div class="r22-posture-trend" style="background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;padding:16px;margin:12px 0;">
        <h4 style="color:#00d4ff;margin:0 0 12px;font-size:14px;">Security Posture Trend Analysis</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px;">
              <span style="font-size:32px;font-weight:bold;color:#00ff88;">${latest.score}</span>
              <span style="color:${delta >= 0 ? '#00ff88' : '#ff4444'};font-size:13px;">${delta >= 0 ? '+' : ''}${delta} pts</span>
              <span style="color:#8899aa;font-size:11px;">vs last month</span>
            </div>
            <div style="color:#8899aa;font-size:11px;margin-bottom:6px;">Industry Percentile: <span style="color:#00d4ff;font-weight:bold;">${this._r22IndustryPercentile.current}%</span></div>
            ${this._r22PosturePrediction.map(p => html`
              <div style="font-size:11px;color:#667788;margin:2px 0;">
                ${p.month}: ${p.predicted} (CI: ${p.lower}-${p.upper}, conf: ${Math.round(p.confidence * 100)}%)
              </div>
            `)}
          </div>
          <div>
            ${dims.map(d => html`
              <div style="margin:3px 0;">
                <span style="color:#8899aa;font-size:11px;display:inline-block;width:70px;">${dimLabels[d]}</span>
                <div style="display:inline-block;width:120px;height:8px;background:#1a2a3a;border-radius:4px;vertical-align:middle;">
                  <div style="width:${barW(latest[d])}%;height:100%;background:${latest[d] >= 85 ? '#00ff88' : latest[d] >= 75 ? '#ffaa00' : '#ff4444'};border-radius:4px;"></div>
                </div>
                <span style="color:#ccc;font-size:11px;margin-left:6px;">${latest[d]}</span>
              </div>
            `)}
          </div>
        </div>
        <div style="margin-top:10px;">
          <span style="color:#8899aa;font-size:11px;">12-Month Trend:</span>
          <div style="display:flex;align-items:flex-end;gap:2px;height:40px;margin-top:4px;">
            ${this._r22PostureTrends.map(t => html`
              <div style="flex:1;height:${t.score * 0.4}px;background:${t.score >= 85 ? '#00ff88' : t.score >= 75 ? '#ffaa00' : '#ff6644'};border-radius:2px 2px 0 0;min-width:4px;" title="${t.month}: ${t.score}"></div>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  private _r22GetPostureSummary(): {improving:string[];stable:string[];declining:string[]} {
    const dims = ['network', 'endpoint', 'cloud', 'identity', 'data', 'app'] as const;
    const trends = this._r22PostureTrends;
    const last3 = trends.slice(-3);
    return {
      improving: dims.filter(d => last3[2][d] > last3[0][d] + 1),
      stable: dims.filter(d => Math.abs(last3[2][d] - last3[0][d]) <= 1),
      declining: dims.filter(d => last3[2][d] < last3[0][d] - 1),
    };
  }
// ===== THREAT ACTOR PROFILE DATABASE (R22) =====
  private _r22ThreatActors = [
    { id: 'TA-001', name: 'APT-Storm', country: 'CN', sophistication: 'advanced', motivation: 'espionage', firstSeen: '2019-03', lastSeen: '2026-04', campaigns: 14, targets: ['Technology','Defense','Healthcare'], tools: ['Cobalt Strike','Custom Implant','Zero-day exploits'], confidence: 92, relationship: ['TA-005'] },
    { id: 'TA-002', name: 'DarkVault', country: 'RU', sophistication: 'advanced', motivation: 'financial', firstSeen: '2020-06', lastSeen: '2026-03', campaigns: 22, targets: ['Finance','Healthcare','Government'], tools: ['Ryuk','TrickBot','Emotet'], confidence: 88, relationship: ['TA-007'] },
    { id: 'TA-003', name: 'ShadowSpider', country: 'Unknown', sophistication: 'moderate', motivation: 'sabotage', firstSeen: '2021-01', lastSeen: '2026-04', campaigns: 8, targets: ['Energy','Telecom','Critical Infrastructure'], tools: ['Industroyer','Custom wipers'], confidence: 75, relationship: [] },
    { id: 'TA-004', name: 'CyberNomad', country: 'KP', sophistication: 'advanced', motivation: 'financial', firstSeen: '2018-09', lastSeen: '2026-02', campaigns: 31, targets: ['Finance','Cryptocurrency','Defense'], tools: ['WannaCry variants','AppleJeus','FastCash'], confidence: 95, relationship: [] },
    { id: 'TA-005', name: 'PhantomOwl', country: 'IR', sophistication: 'moderate', motivation: 'espionage', firstSeen: '2020-11', lastSeen: '2026-04', campaigns: 11, targets: ['Government','Academia','Media'], tools: ['PowerShell backdoors','Custom RAT'], confidence: 82, relationship: ['TA-001'] },
    { id: 'TA-006', name: 'IronGhost', country: 'CN', sophistication: 'advanced', motivation: 'espionage', firstSeen: '2017-05', lastSeen: '2026-01', campaigns: 19, targets: ['Technology','Manufacturing','Aerospace'], tools: ['Sourface','PlugX','HiatusRAT'], confidence: 90, relationship: ['TA-001','TA-008'] },
    { id: 'TA-007', name: 'BitterBug', country: 'RU', sophistication: 'high', motivation: 'espionage', firstSeen: '2019-08', lastSeen: '2026-03', campaigns: 16, targets: ['Government','Military','Think Tanks'], tools: ['Sofacy','X-Agent','Zebrocy'], confidence: 87, relationship: ['TA-002'] },
    { id: 'TA-008', name: 'NeonTide', country: 'CN', sophistication: 'high', motivation: 'supply-chain', firstSeen: '2021-06', lastSeen: '2026-04', campaigns: 7, targets: ['Software','Technology','Telecom'], tools: ['Supply chain implants','Backdoored SDKs'], confidence: 79, relationship: ['TA-006'] },
  ];

  private _r22CampaignTimeline = [
    { actorId: 'TA-001', year: 2024, campaigns: [{ name: 'Op Thunder', start: '2024-02', end: '2024-06', targets: 3, success: true }, { name: 'Op Silent', start: '2024-09', end: '2025-01', targets: 5, success: true }] },
    { actorId: 'TA-002', year: 2024, campaigns: [{ name: 'Op GoldRush', start: '2024-01', end: '2024-04', targets: 8, success: true }, { name: 'Op DarkNet', start: '2024-07', end: '2024-12', targets: 12, success: false }] },
    { actorId: 'TA-004', year: 2024, campaigns: [{ name: 'Op CryptoStorm', start: '2024-03', end: '2024-08', targets: 15, success: true }] },
    { actorId: 'TA-003', year: 2025, campaigns: [{ name: 'Op Blackout', start: '2025-01', end: '2025-05', targets: 4, success: true }, { name: 'Op Cascade', start: '2025-09', end: '2026-01', targets: 6, success: false }] },
  ];

  private _r22TargetDistribution: Record<string, number> = { Technology: 28, Finance: 22, Healthcare: 18, Government: 20, Defense: 15, Energy: 10, Telecom: 12, Manufacturing: 9, Critical: 8, Other: 14 };

  private _r22RenderThreatActors(): ReturnType<typeof html> {
    const getMotivationColor = (m: string) => m === 'espionage' ? '#ff6b6b' : m === 'financial' ? '#ffd93d' : m === 'sabotage' ? '#ff4444' : '#6bcb77';
    return html`
      <div class="r22-threat-actors" style="background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;padding:16px;margin:12px 0;">
        <h4 style="color:#ff6b6b;margin:0 0 12px;font-size:14px;">Threat Actor Profile Database</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
          ${this._r22ThreatActors.slice(0, 6).map(a => html`
            <div style="background:#0d1f35;border:1px solid #1a3050;border-radius:6px;padding:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#fff;font-weight:bold;font-size:12px;">${a.name}</span>
                <span style="background:${getMotivationColor(a.motivation)};color:#000;padding:1px 6px;border-radius:3px;font-size:10px;">${a.motivation}</span>
              </div>
              <div style="font-size:10px;color:#8899aa;margin-top:4px;">
                ${a.country} | ${a.sophistication} | ${a.campaigns} campaigns | Conf: ${a.confidence}%
              </div>
              <div style="font-size:10px;color:#667788;margin-top:2px;">Targets: ${a.targets.join(', ')}</div>
              <div style="font-size:10px;color:#556677;margin-top:2px;">Last seen: ${a.lastSeen}</div>
            </div>
          `)}
        </div>
        <div style="margin-top:10px;">
          <span style="color:#8899aa;font-size:11px;">Target Industry Distribution:</span>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">
            ${Object.entries(this._r22TargetDistribution).sort((a, b) => b[1] - a[1]).map(([ind, cnt]) => html`
              <span style="background:#1a2a3a;color:#aaccee;padding:2px 8px;border-radius:4px;font-size:10px;">${ind}: ${cnt}</span>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  private _r22GetActorRelationships(): {from:string;to:string;type:string}[] {
    const rels: {from:string;to:string;type:string}[] = [];
    this._r22ThreatActors.forEach(a => {
      a.relationship.forEach(r => rels.push({ from: a.id, to: r, type: 'affiliated' }));
    });
    return rels;
  }

  private _r22DetectCampaignOverlap(): {actor1:string;actor2:string;overlap:number;sharedTargets:string[]}[] {
    const overlaps: {actor1:string;actor2:string;overlap:number;sharedTargets:string[]}[] = [];
    for (let i = 0; i < this._r22ThreatActors.length; i++) {
      for (let j = i + 1; j < this._r22ThreatActors.length; j++) {
        const a = this._r22ThreatActors[i], b = this._r22ThreatActors[j];
        const shared = a.targets.filter(t => b.targets.includes(t));
        if (shared.length > 0) overlaps.push({ actor1: a.name, actor2: b.name, overlap: shared.length, sharedTargets: shared });
      }
    }
    return overlaps.sort((a, b) => b.overlap - a.overlap);
  }
// ===== SECURITY CONTROL TESTING (R22) =====
  private _r22ControlTests = [
    { id: 'CT-001', control: 'Firewall Egress Filtering', category: 'Network', status: 'pass', lastTest: '2026-04-15', tester: 'automated', duration: '2m', severity: 'high' },
    { id: 'CT-002', control: 'MFA Enforcement', category: 'Identity', status: 'pass', lastTest: '2026-04-14', tester: 'automated', duration: '1m', severity: 'critical' },
    { id: 'CT-003', control: 'Encryption at Rest', category: 'Data', status: 'conditional', lastTest: '2026-04-13', tester: 'manual', duration: '45m', severity: 'high' },
    { id: 'CT-004', control: 'Patch Management SLA', category: 'Endpoint', status: 'fail', lastTest: '2026-04-12', tester: 'automated', duration: '5m', severity: 'critical' },
    { id: 'CT-005', control: 'DLP Data Exfiltration', category: 'Data', status: 'pass', lastTest: '2026-04-11', tester: 'automated', duration: '10m', severity: 'high' },
    { id: 'CT-006', control: 'SIEM Alert Coverage', category: 'Monitoring', status: 'conditional', lastTest: '2026-04-10', tester: 'manual', duration: '2h', severity: 'medium' },
    { id: 'CT-007', control: 'Privileged Access Review', category: 'Identity', status: 'pass', lastTest: '2026-04-09', tester: 'manual', duration: '3h', severity: 'high' },
    { id: 'CT-008', control: 'Network Segmentation', category: 'Network', status: 'fail', lastTest: '2026-04-08', tester: 'automated', duration: '15m', severity: 'critical' },
    { id: 'CT-009', control: 'Backup Restoration Test', category: 'Operations', status: 'pass', lastTest: '2026-04-07', tester: 'manual', duration: '4h', severity: 'high' },
    { id: 'CT-010', control: 'Incident Response Drill', category: 'Operations', status: 'conditional', lastTest: '2026-04-06', tester: 'manual', duration: '8h', severity: 'high' },
    { id: 'CT-011', control: 'Vulnerability Scan Coverage', category: 'Endpoint', status: 'pass', lastTest: '2026-04-05', tester: 'automated', duration: '30m', severity: 'medium' },
    { id: 'CT-012', control: 'Cloud CSPM Compliance', category: 'Cloud', status: 'fail', lastTest: '2026-04-04', tester: 'automated', duration: '5m', severity: 'high' },
    { id: 'CT-013', control: 'API Authentication', category: 'Application', status: 'pass', lastTest: '2026-04-03', tester: 'automated', duration: '8m', severity: 'high' },
    { id: 'CT-014', control: 'Container Image Scanning', category: 'Cloud', status: 'conditional', lastTest: '2026-04-02', tester: 'automated', duration: '12m', severity: 'medium' },
    { id: 'CT-015', control: 'Secrets Rotation', category: 'Identity', status: 'pass', lastTest: '2026-04-01', tester: 'automated', duration: '3m', severity: 'high' },
    { id: 'CT-016', control: 'DNS Security Validation', category: 'Network', status: 'pass', lastTest: '2026-03-30', tester: 'automated', duration: '4m', severity: 'medium' },
    { id: 'CT-017', control: 'Email Gateway Filtering', category: 'Application', status: 'conditional', lastTest: '2026-03-29', tester: 'manual', duration: '1h', severity: 'high' },
    { id: 'CT-018', control: 'Zero Trust Access Policy', category: 'Identity', status: 'fail', lastTest: '2026-03-28', tester: 'manual', duration: '6h', severity: 'critical' },
    { id: 'CT-019', control: 'Database Activity Monitoring', category: 'Data', status: 'pass', lastTest: '2026-03-27', tester: 'automated', duration: '7m', severity: 'high' },
    { id: 'CT-020', control: 'Third-Party Risk Assessment', category: 'Operations', status: 'conditional', lastTest: '2026-03-25', tester: 'manual', duration: '16h', severity: 'high' },
  ];

  private _r22GetControlStats() {
    const pass = this._r22ControlTests.filter(t => t.status === 'pass').length;
    const fail = this._r22ControlTests.filter(t => t.status === 'fail').length;
    const cond = this._r22ControlTests.filter(t => t.status === 'conditional').length;
    const total = this._r22ControlTests.length;
    return { pass, fail, conditional: cond, total, passRate: Math.round(pass / total * 100) };
  }

  private _r22GetControlGaps(): {category:string;tested:number;total:number;gap:number}[] {
    const byCategory: Record<string, number[]> = {};
    this._r22ControlTests.forEach(t => {
      if (!byCategory[t.category]) byCategory[t.category] = [];
      byCategory[t.category].push(t.status === 'pass' ? 1 : 0);
    });
    const categoryTotals: Record<string, number> = { Network: 8, Identity: 7, Data: 6, Endpoint: 6, Cloud: 7, Application: 5, Monitoring: 4, Operations: 5 };
    return Object.entries(categoryTotals).map(([cat, tot]) => ({
      category: cat, tested: (byCategory[cat] || []).length, total: tot,
      gap: tot - (byCategory[cat] || []).length,
    })).sort((a, b) => b.gap - a.gap);
  }

  private _r22RenderControlTesting(): ReturnType<typeof html> {
    const stats = this._r22GetControlStats();
    const gaps = this._r22GetControlGaps();
    return html`
      <div class="r22-control-testing" style="background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;padding:16px;margin:12px 0;">
        <h4 style="color:#ffaa00;margin:0 0 12px;font-size:14px;">Security Control Testing</h4>
        <div style="display:flex;gap:12px;margin-bottom:12px;">
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:24px;font-weight:bold;color:#00ff88;">${stats.passRate}%</div>
            <div style="color:#8899aa;font-size:11px;">Pass Rate</div>
          </div>
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:24px;font-weight:bold;color:#00d4ff;">${stats.pass}/${stats.total}</div>
            <div style="color:#8899aa;font-size:11px;">Tests Passed</div>
          </div>
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:24px;font-weight:bold;color:#ff4444;">${stats.fail}</div>
            <div style="color:#8899aa;font-size:11px;">Failed</div>
          </div>
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:24px;font-weight:bold;color:#ffaa00;">${stats.conditional}</div>
            <div style="color:#8899aa;font-size:11px;">Conditional</div>
          </div>
        </div>
        <div style="font-size:11px;color:#8899aa;margin-bottom:6px;">Control Gap Analysis by Category:</div>
        ${gaps.map(g => html`
          <div style="display:flex;align-items:center;gap:8px;margin:3px 0;">
            <span style="color:#aaccee;font-size:11px;width:80px;">${g.category}</span>
            <div style="flex:1;height:8px;background:#1a2a3a;border-radius:4px;">
              <div style="width:${(g.tested / g.total) * 100}%;height:100%;background:${g.gap === 0 ? '#00ff88' : g.gap <= 2 ? '#ffaa00' : '#ff4444'};border-radius:4px;"></div>
            </div>
            <span style="color:#8899aa;font-size:10px;">${g.tested}/${g.total}</span>
          </div>
        `)}
        <div style="margin-top:8px;font-size:10px;color:#667788;">
          ${this._r22ControlTests.filter(t => t.status === 'fail').map(t => html`
            <div style="color:#ff4444;">FAIL: ${t.control} (${t.severity}) - Last: ${t.lastTest}</div>
          `)}
        </div>
      </div>
    `;
  }
// ===== DATA SOVEREIGNTY COMPLIANCE (R22) =====
  private _r22DataRegions = [
    { region: 'EU (GDPR)', status: 'compliant', dataVolume: '2.3 PB', transfers: 156, mechanisms: ['SCCs', 'BCRs', 'Adequacy'], gaps: 0, lastAudit: '2026-03' },
    { region: 'US (CCPA)', status: 'compliant', dataVolume: '4.1 PB', transfers: 312, mechanisms: ['Opt-out', 'Consent', 'Contractual'], gaps: 1, lastAudit: '2026-03' },
    { region: 'Brazil (LGPD)', status: 'partial', dataVolume: '0.8 PB', transfers: 45, mechanisms: ['SCCs', 'Consent'], gaps: 3, lastAudit: '2026-01' },
    { region: 'China (PIPL)', status: 'partial', dataVolume: '1.5 PB', transfers: 89, mechanisms: ['CAC Certification', 'Standard Contract'], gaps: 4, lastAudit: '2026-02' },
    { region: 'India (DPDP)', status: 'non-compliant', dataVolume: '0.6 PB', transfers: 23, mechanisms: [], gaps: 7, lastAudit: '2025-11' },
    { region: 'Japan (APPI)', status: 'compliant', dataVolume: '0.4 PB', transfers: 34, mechanisms: ['Adequacy', 'Consent'], gaps: 0, lastAudit: '2026-04' },
    { region: 'Canada (PIPEDA)', status: 'compliant', dataVolume: '0.3 PB', transfers: 18, mechanisms: ['Adequacy', 'SCCs'], gaps: 1, lastAudit: '2026-02' },
    { region: 'Australia (Privacy Act)', status: 'partial', dataVolume: '0.2 PB', transfers: 12, mechanisms: ['Consent'], gaps: 2, lastAudit: '2025-12' },
  ];

  private _r22CrossBorderFlows = [
    { from: 'US', to: 'EU', volume: '1.2 TB/mo', mechanism: 'SCCs', encrypted: true, pseudonymized: false, risk: 'low' },
    { from: 'US', to: 'CN', volume: '0.8 TB/mo', mechanism: 'CAC Cert', encrypted: true, pseudonymized: true, risk: 'high' },
    { from: 'EU', to: 'US', volume: '0.6 TB/mo', mechanism: 'SCCs + TEF', encrypted: true, pseudonymized: true, risk: 'medium' },
    { from: 'BR', to: 'US', volume: '0.3 TB/mo', mechanism: 'SCCs', encrypted: true, pseudonymized: false, risk: 'medium' },
    { from: 'JP', to: 'US', volume: '0.2 TB/mo', mechanism: 'Adequacy', encrypted: true, pseudonymized: false, risk: 'low' },
    { from: 'CN', to: 'US', volume: '0.5 TB/mo', mechanism: 'CAC Cert', encrypted: true, pseudonymized: true, risk: 'high' },
  ];

  private _r22RenderDataSovereignty(): ReturnType<typeof html> {
    const statusColor = (s: string) => s === 'compliant' ? '#00ff88' : s === 'partial' ? '#ffaa00' : '#ff4444';
    const totalGaps = this._r22DataRegions.reduce((sum, r) => sum + r.gaps, 0);
    return html`
      <div class="r22-data-sovereignty" style="background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;padding:16px;margin:12px 0;">
        <h4 style="color:#aa88ff;margin:0 0 12px;font-size:14px;">Data Sovereignty Compliance</h4>
        <div style="display:flex;gap:12px;margin-bottom:10px;">
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#00ff88;">${this._r22DataRegions.filter(r => r.status === 'compliant').length}/${this._r22DataRegions.length}</div>
            <div style="color:#8899aa;font-size:11px;">Regions Compliant</div>
          </div>
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#ff4444;">${totalGaps}</div>
            <div style="color:#8899aa;font-size:11px;">Total Gaps</div>
          </div>
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#ffaa00;">${this._r22CrossBorderFlows.filter(f => f.risk === 'high').length}</div>
            <div style="color:#8899aa;font-size:11px;">High-Risk Flows</div>
          </div>
        </div>
        ${this._r22DataRegions.map(r => html`
          <div style="display:flex;align-items:center;gap:8px;margin:4px 0;padding:6px;background:#0d1f35;border-radius:4px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${statusColor(r.status)};"></div>
            <span style="color:#ddd;font-size:11px;width:120px;">${r.region}</span>
            <span style="color:#8899aa;font-size:10px;">${r.dataVolume}</span>
            <span style="color:#8899aa;font-size:10px;">${r.transfers} transfers</span>
            <span style="color:${statusColor(r.status)};font-size:10px;margin-left:auto;">${r.status}${r.gaps > 0 ? ' (' + r.gaps + ' gaps)' : ''}</span>
          </div>
        `)}
      </div>
    `;
  }

  // --- Security Alert Analytics ---
  private _renderAlertAnalytics(): TemplateResult {
    const hourlyVolume = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      volume: h >= 8 && h <= 18 ? Math.floor(80 + Math.random() * 120) : Math.floor(10 + Math.random() * 30),
    }));
    const classification = [
      { type: 'Malware Detection', count: 8420, pct: 26.3 },
      { type: 'Network Intrusion', count: 6210, pct: 19.4 },
      { type: 'Unauthorized Access', count: 5340, pct: 16.7 },
      { type: 'Data Exfiltration', count: 4120, pct: 12.9 },
      { type: 'Policy Violation', count: 3890, pct: 12.1 },
      { type: 'Phishing', count: 2340, pct: 7.3 },
      { type: 'DDoS Attempt', count: 1680, pct: 5.3 },
    ];
    const topSources = [
      { source: 'IDS/IPS (Snort)', count: 12450, trend: 'up' },
      { source: 'SIEM Correlation', count: 8320, trend: 'stable' },
      { source: 'EDR Platform', count: 6780, trend: 'up' },
      { source: 'WAF Rules', count: 4560, trend: 'down' },
      { source: 'DLP Engine', count: 3210, trend: 'stable' },
      { source: 'Email Gateway', count: 2890, trend: 'up' },
      { source: 'Cloud CSPM', count: 2340, trend: 'up' },
      { source: 'Threat Intel Feed', count: 1890, trend: 'down' },
    ];
    const responseTimes = [
      { range: '< 5 min', count: 4200, pct: 35.2 },
      { range: '5-15 min', count: 3100, pct: 26.0 },
      { range: '15-30 min', count: 2400, pct: 20.1 },
      { range: '30-60 min', count: 1300, pct: 10.9 },
      { range: '1-4 hours', count: 650, pct: 5.4 },
      { range: '> 4 hours', count: 280, pct: 2.4 },
    ];
    const agingAlerts = [
      { age: '< 1 day', count: 890, color: '#22c55e' },
      { age: '1-3 days', count: 456, color: '#22c55e' },
      { age: '3-7 days', count: 234, color: '#f59e0b' },
      { age: '7-14 days', count: 128, color: '#f59e0b' },
      { age: '14-30 days', count: 67, color: '#ef4444' },
      { age: '> 30 days', count: 23, color: '#ef4444' },
    ];
    const qualityTrend = [
      { week: 'W1', score: 62, tp: 3120, fp: 1890 },
      { week: 'W2', score: 65, tp: 3340, fp: 1780 },
      { week: 'W3', score: 68, tp: 3560, fp: 1670 },
      { week: 'W4', score: 72, tp: 3890, fp: 1510 },
      { week: 'W5', score: 74, tp: 4020, fp: 1410 },
      { week: 'W6', score: 78, tp: 4280, fp: 1200 },
    ];
    return html`
      <div class="alert-analytics">
        <h4>Security Alert Analytics</h4>
        <div class="analytics-grid">
          <div class="aa-card">
            <h5>Alert Volume Trend (Hourly)</h5>
            <div class="hourly-chart">
              ${hourlyVolume.map(h => html`
                <div class="hour-bar" style="height:${h.volume * 1.5}px" title="${h.hour}:00 - ${h.volume} alerts">
                  <span class="hv-val">${h.volume}</span>
                </div>
              `)}
            </div>
            <div class="hour-labels">
              ${Array.from({length:24}, (_, i) => html`<span>${i}h</span>`)}
            </div>
          </div>
          <div class="aa-card">
            <h5>Alert Classification Distribution</h5>
            <div class="classification-chart">
              ${classification.map((c, i) => {
                const colors = ['#ef4444','#f97316','#f59e0b','#22c55e','#3b82f6','#8b5cf6','#06b6d4'];
                return html`
                  <div class="class-row">
                    <span class="class-color" style="background:${colors[i]}"></span>
                    <span class="class-type">${c.type}</span>
                    <div class="class-bar-wrap">
                      <div class="class-bar" style="width:${c.pct * 3}px; background:${colors[i]}"></div>
                    </div>
                    <span class="class-count">${c.count.toLocaleString()}</span>
                    <span class="class-pct">${c.pct}%</span>
                  </div>
                `;
              })}
            </div>
          </div>
          <div class="aa-card">
            <h5>Top Alert Sources</h5>
            <div class="source-rank">
              ${topSources.map((s, i) => html`
                <div class="source-row">
                  <span class="src-rank">#${i + 1}</span>
                  <span class="src-name">${s.source}</span>
                  <div class="src-bar-wrap">
                    <div class="src-bar" style="width:${(s.count / topSources[0].count) * 100}%"></div>
                  </div>
                  <span class="src-count">${s.count.toLocaleString()}</span>
                  <span class="src-trend trend-${s.trend}">${s.trend === 'up' ? 'up' : s.trend === 'down' ? 'down' : 'stable'}</span>
                </div>
              `)}
            </div>
          </div>
          <div class="aa-card">
            <h5>Alert Response Time Distribution</h5>
            <div class="response-dist">
              ${responseTimes.map(r => html`
                <div class="resp-row">
                  <span class="resp-range">${r.range}</span>
                  <div class="resp-bar-wrap">
                    <div class="resp-bar" style="width:${r.pct * 2.5}px"></div>
                  </div>
                  <span class="resp-count">${r.count.toLocaleString()}</span>
                  <span class="resp-pct">${r.pct}%</span>
                </div>
              `)}
            </div>
          </div>
          <div class="aa-card">
            <h5>Alert Aging Analysis (Unresolved)</h5>
            <div class="aging-chart">
              ${agingAlerts.map(a => html`
                <div class="aging-row">
                  <span class="age-label">${a.age}</span>
                  <div class="age-bar" style="width:${a.count * 0.6}px; background:${a.color}"></div>
                  <span class="age-count">${a.count}</span>
                </div>
              `)}
            </div>
            <div class="aging-total">Total unresolved: ${agingAlerts.reduce((s, a) => s + a.count, 0)}</div>
          </div>
          <div class="aa-card">
            <h5>Alert Quality Score Trend</h5>
            <div class="quality-chart">
              ${qualityTrend.map(q => html`
                <div class="quality-point">
                  <div class="qp-bar" style="height:${q.score * 1.8}px">
                    <span>${q.score}</span>
                  </div>
                  <span class="qp-label">${q.week}</span>
                  <span class="qp-detail">TP:${q.tp} FP:${q.fp}</span>
                </div>
              `)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _getAlertVolumeByPeriod(period: string): { label: string; volume: number }[] {
    if (period === 'hourly') return Array.from({ length: 24 }, (_, i) => ({ label: i + 'h', volume: Math.floor(20 + Math.random() * 100) }));
    if (period === 'daily') return Array.from({ length: 30 }, (_, i) => ({ label: 'D' + (i + 1), volume: Math.floor(500 + Math.random() * 800) }));
    return Array.from({ length: 12 }, (_, i) => ({ label: 'W' + (i + 1), volume: Math.floor(3500 + Math.random() * 5000) }));
  }

  private _calculateAlertQualityScore(tp: number, fp: number): number {
    return Math.round((tp / (tp + fp)) * 100);
  }


  // --- Security Alert Analytics ---
  private _renderAlertAnalytics(): TemplateResult {
    const hourlyVolume = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      volume: h >= 8 && h <= 18 ? Math.floor(80 + Math.random() * 120) : Math.floor(10 + Math.random() * 30),
    }));
    const classification = [
      { type: 'Malware Detection', count: 8420, pct: 26.3 },
      { type: 'Network Intrusion', count: 6210, pct: 19.4 },
      { type: 'Unauthorized Access', count: 5340, pct: 16.7 },
      { type: 'Data Exfiltration', count: 4120, pct: 12.9 },
      { type: 'Policy Violation', count: 3890, pct: 12.1 },
      { type: 'Phishing', count: 2340, pct: 7.3 },
      { type: 'DDoS Attempt', count: 1680, pct: 5.3 },
    ];
    const topSources = [
      { source: 'IDS/IPS (Snort)', count: 12450, trend: 'up' },
      { source: 'SIEM Correlation', count: 8320, trend: 'stable' },
      { source: 'EDR Platform', count: 6780, trend: 'up' },
      { source: 'WAF Rules', count: 4560, trend: 'down' },
      { source: 'DLP Engine', count: 3210, trend: 'stable' },
      { source: 'Email Gateway', count: 2890, trend: 'up' },
      { source: 'Cloud CSPM', count: 2340, trend: 'up' },
      { source: 'Threat Intel Feed', count: 1890, trend: 'down' },
    ];
    const responseTimes = [
      { range: '< 5 min', count: 4200, pct: 35.2 },
      { range: '5-15 min', count: 3100, pct: 26.0 },
      { range: '15-30 min', count: 2400, pct: 20.1 },
      { range: '30-60 min', count: 1300, pct: 10.9 },
      { range: '1-4 hours', count: 650, pct: 5.4 },
      { range: '> 4 hours', count: 280, pct: 2.4 },
    ];
    const agingAlerts = [
      { age: '< 1 day', count: 890, color: '#22c55e' },
      { age: '1-3 days', count: 456, color: '#22c55e' },
      { age: '3-7 days', count: 234, color: '#f59e0b' },
      { age: '7-14 days', count: 128, color: '#f59e0b' },
      { age: '14-30 days', count: 67, color: '#ef4444' },
      { age: '> 30 days', count: 23, color: '#ef4444' },
    ];
    const qualityTrend = [
      { week: 'W1', score: 62, tp: 3120, fp: 1890 },
      { week: 'W2', score: 65, tp: 3340, fp: 1780 },
      { week: 'W3', score: 68, tp: 3560, fp: 1670 },
      { week: 'W4', score: 72, tp: 3890, fp: 1510 },
      { week: 'W5', score: 74, tp: 4020, fp: 1410 },
      { week: 'W6', score: 78, tp: 4280, fp: 1200 },
    ];
    return html`
      <div class="alert-analytics">
        <h4>Security Alert Analytics</h4>
        <div class="analytics-grid">
          <div class="aa-card">
            <h5>Alert Volume Trend (Hourly)</h5>
            <div class="hourly-chart">
              ${hourlyVolume.map(h => html`
                <div class="hour-bar" style="height:${h.volume * 1.5}px" title="${h.hour}:00 - ${h.volume} alerts">
                  <span class="hv-val">${h.volume}</span>
                </div>
              `)}
            </div>
            <div class="hour-labels">
              ${Array.from({length:24}, (_, i) => html`<span>${i}h</span>`)}
            </div>
          </div>
          <div class="aa-card">
            <h5>Alert Classification Distribution</h5>
            <div class="classification-chart">
              ${classification.map((c, i) => {
                const colors = ['#ef4444','#f97316','#f59e0b','#22c55e','#3b82f6','#8b5cf6','#06b6d4'];
                return html`
                  <div class="class-row">
                    <span class="class-color" style="background:${colors[i]}"></span>
                    <span class="class-type">${c.type}</span>
                    <div class="class-bar-wrap">
                      <div class="class-bar" style="width:${c.pct * 3}px; background:${colors[i]}"></div>
                    </div>
                    <span class="class-count">${c.count.toLocaleString()}</span>
                    <span class="class-pct">${c.pct}%</span>
                  </div>
                `;
              })}
            </div>
          </div>
          <div class="aa-card">
            <h5>Top Alert Sources</h5>
            <div class="source-rank">
              ${topSources.map((s, i) => html`
                <div class="source-row">
                  <span class="src-rank">#${i + 1}</span>
                  <span class="src-name">${s.source}</span>
                  <div class="src-bar-wrap">
                    <div class="src-bar" style="width:${(s.count / topSources[0].count) * 100}%"></div>
                  </div>
                  <span class="src-count">${s.count.toLocaleString()}</span>
                  <span class="src-trend trend-${s.trend}">${s.trend === 'up' ? 'up' : s.trend === 'down' ? 'down' : 'stable'}</span>
                </div>
              `)}
            </div>
          </div>
          <div class="aa-card">
            <h5>Alert Response Time Distribution</h5>
            <div class="response-dist">
              ${responseTimes.map(r => html`
                <div class="resp-row">
                  <span class="resp-range">${r.range}</span>
                  <div class="resp-bar-wrap">
                    <div class="resp-bar" style="width:${r.pct * 2.5}px"></div>
                  </div>
                  <span class="resp-count">${r.count.toLocaleString()}</span>
                  <span class="resp-pct">${r.pct}%</span>
                </div>
              `)}
            </div>
          </div>
          <div class="aa-card">
            <h5>Alert Aging Analysis (Unresolved)</h5>
            <div class="aging-chart">
              ${agingAlerts.map(a => html`
                <div class="aging-row">
                  <span class="age-label">${a.age}</span>
                  <div class="age-bar" style="width:${a.count * 0.6}px; background:${a.color}"></div>
                  <span class="age-count">${a.count}</span>
                </div>
              `)}
            </div>
            <div class="aging-total">Total unresolved: ${agingAlerts.reduce((s, a) => s + a.count, 0)}</div>
          </div>
          <div class="aa-card">
            <h5>Alert Quality Score Trend</h5>
            <div class="quality-chart">
              ${qualityTrend.map(q => html`
                <div class="quality-point">
                  <div class="qp-bar" style="height:${q.score * 1.8}px">
                    <span>${q.score}</span>
                  </div>
                  <span class="qp-label">${q.week}</span>
                  <span class="qp-detail">TP:${q.tp} FP:${q.fp}</span>
                </div>
              `)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _getAlertVolumeByPeriod(period: string): { label: string; volume: number }[] {
    if (period === 'hourly') return Array.from({ length: 24 }, (_, i) => ({ label: i + 'h', volume: Math.floor(20 + Math.random() * 100) }));
    if (period === 'daily') return Array.from({ length: 30 }, (_, i) => ({ label: 'D' + (i + 1), volume: Math.floor(500 + Math.random() * 800) }));
    return Array.from({ length: 12 }, (_, i) => ({ label: 'W' + (i + 1), volume: Math.floor(3500 + Math.random() * 5000) }));
  }

  private _calculateAlertQualityScore(tp: number, fp: number): number {
    return Math.round((tp / (tp + fp)) * 100);
  }

  // ========== Vulnerability Management Lifecycle ==========
  private _renderVulnDiscoveryPipeline() {
    const pipelines = [
      { id: 'p1', name: 'Nessus Weekly Scan', type: 'scanner', status: 'active', schedule: 'Weekly Sun 02:00', lastRun: '2026-04-20 02:03:12', findings: 47, critical: 3, high: 12, medium: 22, low: 10 },
      { id: 'p2', name: 'GitHub Dependabot', type: 'scanner', status: 'active', schedule: 'On Push', lastRun: '2026-04-23 11:45:00', findings: 23, critical: 1, high: 5, medium: 11, low: 6 },
      { id: 'p3', name: 'Snyk Container Scan', type: 'scanner', status: 'active', schedule: 'Daily 03:00', lastRun: '2026-04-23 03:01:45', findings: 15, critical: 0, high: 4, medium: 7, low: 4 },
      { id: 'p4', name: 'Manual Pen Test', type: 'manual', status: 'completed', schedule: 'Quarterly', lastRun: '2026-04-15 09:00:00', findings: 8, critical: 2, high: 3, medium: 2, low: 1 },
      { id: 'p5', name: 'OWASP ZAP DAST', type: 'scanner', status: 'active', schedule: 'On Deploy', lastRun: '2026-04-22 18:30:00', findings: 31, critical: 1, high: 8, medium: 14, low: 8 },
      { id: 'p6', name: 'Security Research Team', type: 'researcher', status: 'active', schedule: 'Continuous', lastRun: '2026-04-23 10:15:00', findings: 5, critical: 1, high: 2, medium: 1, low: 1 },
      { id: 'p7', name: 'Developer Self-Report', type: 'coder', status: 'active', schedule: 'On Demand', lastRun: '2026-04-23 09:22:00', findings: 3, critical: 0, high: 1, medium: 2, low: 0 },
      { id: 'p8', name: 'SonarQube SAST', type: 'scanner', status: 'active', schedule: 'On PR Merge', lastRun: '2026-04-23 11:30:00', findings: 19, critical: 0, high: 3, medium: 10, low: 6 },
    ];
    const statusColor = (s: string) => s === 'active' ? '#10b981' : s === 'completed' ? '#3b82f6' : '#f59e0b';
    const typeIcon = (t: string) => t === 'scanner' ? '\\u{1F50D}' : t === 'manual' ? '\\u{1F3AF}' : t === 'researcher' ? '\\u{1F9E0}' : '\\u{1F4BB}';
    return html`
      <section class="vuln-discovery-pipeline">
        <h4>Vulnerability Discovery Pipeline</h4>
        <div class="pipeline-grid">
          ${pipelines.map(p => html`
            <div class="pipeline-card">
              <div class="pipeline-header">
                <span class="pipeline-type-icon">${typeIcon(p.type)}</span>
                <span class="pipeline-name">${p.name}</span>
                <span class="pipeline-badge" style="background:${statusColor(p.status)}20;color:${statusColor(p.status)}">${p.status}</span>
              </div>
              <div class="pipeline-meta">
                <span>Schedule: ${p.schedule}</span>
                <span>Last: ${p.lastRun}</span>
              </div>
              <div class="pipeline-findings">
                <span class="sev-critical">${p.critical} Critical</span>
                <span class="sev-high">${p.high} High</span>
                <span class="sev-medium">${p.medium} Medium</span>
                <span class="sev-low">${p.low} Low</span>
              </div>
              <div class="pipeline-total">Total: ${p.findings} findings</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderVulnSLAClock() {
    const slaConfig = [
      { severity: 'Critical', maxHours: 24, warnPercent: 75, color: '#ef4444' },
      { severity: 'High', maxHours: 72, warnPercent: 80, color: '#f97316' },
      { severity: 'Medium', maxHours: 720, warnPercent: 85, color: '#eab308' },
      { severity: 'Low', maxHours: 2160, warnPercent: 90, color: '#22c55e' },
    ];
    const activeVulns = [
      { id: 'V-001', title: 'Apache Log4j RCE', severity: 'Critical', detected: '2026-04-21T14:00:00', remaining: 6.5, assignee: 'Alice Chen' },
      { id: 'V-002', title: 'SQL Injection in /api/users', severity: 'Critical', detected: '2026-04-22T08:00:00', remaining: 22, assignee: 'Bob Smith' },
      { id: 'V-003', title: 'Outdated OpenSSL 1.1.1', severity: 'High', detected: '2026-04-19T10:00:00', remaining: 48, assignee: 'Carol Wu' },
      { id: 'V-004', title: 'XSS in Search Widget', severity: 'High', detected: '2026-04-20T16:00:00', remaining: 64, assignee: 'Dave Li' },
      { id: 'V-005', title: 'Weak TLS 1.0 Support', severity: 'Medium', detected: '2026-04-10T09:00:00', remaining: 648, assignee: 'Eve Wang' },
      { id: 'V-006', title: 'Missing CSP Header', severity: 'Medium', detected: '2026-04-15T11:00:00', remaining: 576, assignee: 'Frank Zhang' },
      { id: 'V-007', title: 'Verbose Error Messages', severity: 'Low', detected: '2026-03-20T08:00:00', remaining: 2016, assignee: 'Grace Liu' },
    ];
    return html`
      <section class="vuln-sla-clock">
        <h4>Vulnerability SLA Clock</h4>
        <div class="sla-config-bar">
          ${slaConfig.map(s => html`
            <div class="sla-badge" style="border-color:${s.color}">
              <strong>${s.severity}</strong>: ${s.maxHours}h (${s.maxHours / 24}d) | Warn at ${s.warnPercent}%
            </div>
          `).join('')}
        </div>
        <div class="sla-vuln-list">
          ${activeVulns.map(v => {
            const cfg = slaConfig.find(s => s.severity === v.severity)!;
            const pct = ((cfg.maxHours - v.remaining) / cfg.maxHours) * 100;
            const isOverdue = v.remaining <= 0;
            const isWarning = pct >= cfg.warnPercent && !isOverdue;
            const barColor = isOverdue ? '#ef4444' : isWarning ? '#f59e0b' : cfg.color;
            return html`
              <div class="sla-vuln-row">
                <div class="sla-vuln-info">
                  <span class="sla-id">${v.id}</span>
                  <span class="sla-title">${v.title}</span>
                  <span class="sla-severity" style="color:${cfg.color}">${v.severity}</span>
                  <span class="sla-assignee">${v.assignee}</span>
                </div>
                <div class="sla-progress-bar">
                  <div class="sla-progress-fill" style="width:${Math.min(pct, 100)}%;background:${barColor}"></div>
                </div>
                <span class="sla-remaining" style="color:${barColor}">${isOverdue ? 'OVERDUE' : v.remaining + 'h left'}</span>
              </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  private _renderPatchDeploymentStatus() {
    const environments = [
      { name: 'Development', status: 'deployed', patches: 42, pending: 0, failed: 1, lastDeploy: '2026-04-23 06:00' },
      { name: 'Staging', status: 'deployed', patches: 38, pending: 4, failed: 0, lastDeploy: '2026-04-23 04:00' },
      { name: 'Production US-East', status: 'partial', patches: 35, pending: 7, failed: 0, lastDeploy: '2026-04-22 22:00' },
      { name: 'Production EU-West', status: 'pending', patches: 30, pending: 12, failed: 0, lastDeploy: '2026-04-22 20:00' },
      { name: 'Production AP-South', status: 'failed', patches: 28, pending: 14, failed: 2, lastDeploy: '2026-04-21 18:00' },
    ];
    const statusMap: Record<string, { color: string; label: string }> = {
      deployed: { color: '#10b981', label: 'Deployed' },
      partial: { color: '#f59e0b', label: 'Partial' },
      pending: { color: '#3b82f6', label: 'Pending' },
      failed: { color: '#ef4444', label: 'Failed' },
    };
    return html`
      <section class="patch-deployment-status">
        <h4>Patch Deployment Status</h4>
        <div class="env-grid">
          ${environments.map(e => {
            const s = statusMap[e.status];
            return html`
              <div class="env-card" style="border-left:4px solid ${s.color}">
                <div class="env-name">${e.name}</div>
                <div class="env-status-badge" style="background:${s.color}20;color:${s.color}">${s.label}</div>
                <div class="env-stats">
                  <div class="stat"><span class="stat-val">${e.patches}</span><span class="stat-lbl">Deployed</span></div>
                  <div class="stat"><span class="stat-val">${e.pending}</span><span class="stat-lbl">Pending</span></div>
                  <div class="stat"><span class="stat-val">${e.failed}</span><span class="stat-lbl">Failed</span></div>
                </div>
                <div class="env-last-deploy">Last: ${e.lastDeploy}</div>
              </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  private _renderVulnAgingReport() {
    const agingBuckets = [
      { range: '0-7 days', count: 45, critical: 2, high: 8, medium: 20, low: 15, riskScore: 15 },
      { range: '8-30 days', count: 32, critical: 1, high: 5, medium: 15, low: 11, riskScore: 38 },
      { range: '31-90 days', count: 18, critical: 0, high: 3, medium: 10, low: 5, riskScore: 62 },
      { range: '91-180 days', count: 8, critical: 0, high: 1, medium: 4, low: 3, riskScore: 78 },
      { range: '181-365 days', count: 4, critical: 0, high: 0, medium: 2, low: 2, riskScore: 89 },
      { range: '365+ days', count: 2, critical: 0, high: 0, medium: 1, low: 1, riskScore: 95 },
    ];
    return html`
      <section class="vuln-aging-report">
        <h4>Vulnerability Aging Report</h4>
        <div class="aging-table">
          <div class="aging-header">
            <span>Age Range</span><span>Total</span><span>Critical</span><span>High</span><span>Medium</span><span>Low</span><span>Risk Score</span>
          </div>
          ${agingBuckets.map(b => html`
            <div class="aging-row">
              <span class="aging-range">${b.range}</span>
              <span class="aging-count">${b.count}</span>
              <span class="aging-sev-critical">${b.critical}</span>
              <span class="aging-sev-high">${b.high}</span>
              <span class="aging-sev-medium">${b.medium}</span>
              <span class="aging-sev-low">${b.low}</span>
              <span class="aging-risk" style="color:${b.riskScore > 70 ? '#ef4444' : b.riskScore > 40 ? '#f59e0b' : '#10b981'}">${b.riskScore}</span>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderSuppressionWorkflow() {
    const suppressions = [
      { id: 'SUP-001', vulnId: 'V-099', title: 'False Positive: Info Disclosure', requester: 'Alice Chen', approver: 'CISO Bob', status: 'approved', reason: 'Verified non-exploitable in context', expires: '2026-10-01' },
      { id: 'SUP-002', vulnId: 'V-102', title: 'Accepted Risk: Legacy Protocol', requester: 'Dave Li', approver: null, status: 'pending', reason: 'Migration planned for Q3', expires: '2026-07-01' },
      { id: 'SUP-003', vulnId: 'V-105', title: 'Compensating Control in Place', requester: 'Carol Wu', approver: 'CISO Bob', status: 'approved', reason: 'WAF rule blocks exploitation path', expires: '2026-12-31' },
      { id: 'SUP-004', vulnId: 'V-108', title: 'Duplicate Finding', requester: 'Eve Wang', approver: null, status: 'rejected', reason: 'Not a duplicate - different endpoint', expires: null },
    ];
    const statusColor = (s: string) => s === 'approved' ? '#10b981' : s === 'pending' ? '#f59e0b' : '#ef4444';
    return html`
      <section class="suppression-workflow">
        <h4>Suppression & Risk Acceptance Workflow</h4>
        <div class="suppression-list">
          ${suppressions.map(s => html`
            <div class="suppression-card" style="border-left:4px solid ${statusColor(s.status)}">
              <div class="supp-header">
                <span class="supp-id">${s.id}</span>
                <span class="supp-vuln">${s.vulnId}</span>
                <span class="supp-status-badge" style="background:${statusColor(s.status)}20;color:${statusColor(s.status)}">${s.status.toUpperCase()}</span>
              </div>
              <div class="supp-title">${s.title}</div>
              <div class="supp-details">
                <span>Requester: ${s.requester}</span>
                <span>Approver: ${s.approver || 'Pending'}</span>
                ${s.expires ? html`<span>Expires: ${s.expires}</span>` : ''}
              </div>
              <div class="supp-reason"><strong>Reason:</strong> ${s.reason}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }  // ========== Identity Governance Suite ==========
  private _renderAccessReviewCampaigns() {
    const campaigns = [
      { id: 'ARC-2026-Q2-001', name: 'Q2 Privileged Access Review', scope: 'All Admin Accounts', totalEntitlements: 342, reviewed: 218, certified: 195, revoked: 23, status: 'in_progress', owner: 'CISO Bob', deadline: '2026-05-31' },
      { id: 'ARC-2026-Q2-002', name: 'Engineering Team Access', scope: 'Engineering Department', totalEntitlements: 1204, reviewed: 1204, certified: 1102, revoked: 102, status: 'completed', owner: 'VP Engineering', deadline: '2026-04-30' },
      { id: 'ARC-2026-Q2-003', name: 'Contractor Access Audit', scope: 'All Contractors', totalEntitlements: 87, reviewed: 45, certified: 38, revoked: 7, status: 'in_progress', owner: 'HR Director', deadline: '2026-06-15' },
      { id: 'ARC-2026-Q2-004', name: 'Cloud Resource Permissions', scope: 'AWS/GCP/Azure IAM', totalEntitlements: 567, reviewed: 0, certified: 0, revoked: 0, status: 'not_started', owner: 'Cloud Security Lead', deadline: '2026-07-31' },
      { id: 'ARC-2026-Q2-005', name: 'Database Access Review', scope: 'All Production Databases', totalEntitlements: 156, reviewed: 156, certified: 140, revoked: 16, status: 'completed', owner: 'DBA Lead', deadline: '2026-04-15' },
    ];
    const statusColor = (s: string) => s === 'completed' ? '#10b981' : s === 'in_progress' ? '#3b82f6' : '#94a3b8';
    const statusLabel = (s: string) => s === 'completed' ? 'Completed' : s === 'in_progress' ? 'In Progress' : 'Not Started';
    return html`
      <section class="access-review-campaigns">
        <h4>Access Review Campaigns</h4>
        <div class="campaign-list">
          ${campaigns.map(c => {
            const pct = c.totalEntitlements > 0 ? Math.round((c.reviewed / c.totalEntitlements) * 100) : 0;
            return html`
              <div class="campaign-card" style="border-left:4px solid ${statusColor(c.status)}">
                <div class="campaign-header">
                  <span class="campaign-id">${c.id}</span>
                  <span class="campaign-status" style="color:${statusColor(c.status)}">${statusLabel(c.status)}</span>
                </div>
                <div class="campaign-name">${c.name}</div>
                <div class="campaign-meta">
                  <span>Scope: ${c.scope}</span>
                  <span>Owner: ${c.owner}</span>
                  <span>Deadline: ${c.deadline}</span>
                </div>
                <div class="campaign-progress">
                  <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${statusColor(c.status)}"></div></div>
                  <span class="progress-text">${c.reviewed}/${c.totalEntitlements} reviewed (${pct}%)</span>
                </div>
                <div class="campaign-results">
                  <span class="certified">${c.certified} Certified</span>
                  <span class="revoked">${c.revoked} Revoked</span>
                </div>
              </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  private _renderRoleMining() {
    const roles = [
      { name: 'Engineering Lead', currentUsers: 12, suggestedUsers: 15, confidence: 92, entitlements: 34, overlaps: 3, optimization: 'Merge 3 overlapping roles into 1' },
      { name: 'Junior Developer', currentUsers: 45, suggestedUsers: 42, confidence: 88, entitlements: 18, overlaps: 2, optimization: 'Remove 3 unnecessary entitlements' },
      { name: 'Security Analyst', currentUsers: 8, suggestedUsers: 10, confidence: 85, entitlements: 52, overlaps: 1, optimization: 'Split into Tier 1 and Tier 2 roles' },
      { name: 'DevOps Engineer', currentUsers: 6, suggestedUsers: 8, confidence: 79, entitlements: 67, overlaps: 5, optimization: 'High overlap with SRE - consider unified role' },
      { name: 'Product Manager', currentUsers: 15, suggestedUsers: 14, confidence: 91, entitlements: 12, overlaps: 0, optimization: 'Well-defined role, no changes needed' },
      { name: 'Contractor Limited', currentUsers: 30, suggestedUsers: 28, confidence: 76, entitlements: 8, overlaps: 2, optimization: '2 users have excessive permissions' },
    ];
    return html`
      <section class="role-mining">
        <h4>Role Mining & Optimization</h4>
        <div class="role-grid">
          ${roles.map(r => html`
            <div class="role-card">
              <div class="role-name">${r.name}</div>
              <div class="role-users">Users: ${r.currentUsers} current / ${r.suggestedUsers} suggested</div>
              <div class="role-confidence">
                <span>Confidence:</span>
                <div class="confidence-bar"><div class="confidence-fill" style="width:${r.confidence}%;background:${r.confidence > 85 ? '#10b981' : r.confidence > 75 ? '#f59e0b' : '#ef4444'}"></div></div>
                <span>${r.confidence}%</span>
              </div>
              <div class="role-stats">
                <span>${r.entitlements} Entitlements</span>
                <span>${r.overlaps} Overlaps</span>
              </div>
              <div class="role-suggestion">OPT: ${r.optimization}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderEntitlementCreep() {
    const creepAlerts = [
      { user: 'alice.chen', role: 'Engineering Lead', baseEntitlements: 34, currentEntitlements: 47, addedOverTime: 13, riskLevel: 'medium', topAdditions: ['prod-db-write', 's3-admin', 'k8s-cluster-admin'] },
      { user: 'bob.smith', role: 'DevOps Engineer', baseEntitlements: 67, currentEntitlements: 89, addedOverTime: 22, riskLevel: 'high', topAdditions: ['iam-full-admin', 'billing-access', 'security-log-read'] },
      { user: 'carol.wu', role: 'Security Analyst', baseEntitlements: 52, currentEntitlements: 58, addedOverTime: 6, riskLevel: 'low', topAdditions: ['jira-admin', 'confluence-admin'] },
      { user: 'dave.li', role: 'Junior Developer', baseEntitlements: 18, currentEntitlements: 31, addedOverTime: 13, riskLevel: 'critical', topAdditions: ['prod-root-ssh', 'vault-secrets-read', 'ci-cd-admin'] },
      { user: 'eve.wang', role: 'Contractor', baseEntitlements: 8, currentEntitlements: 19, addedOverTime: 11, riskLevel: 'high', topAdditions: ['github-org-admin', 'slack-admin', 'vpn-full'] },
    ];
    const riskColor = (r: string) => r === 'critical' ? '#ef4444' : r === 'high' ? '#f97316' : r === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <section class="entitlement-creep">
        <h4>Entitlement Creep Detection</h4>
        <div class="creep-list">
          ${creepAlerts.map(c => html`
            <div class="creep-card" style="border-left:4px solid ${riskColor(c.riskLevel)}">
              <div class="creep-header">
                <span class="creep-user">${c.user}</span>
                <span class="creep-role">${c.role}</span>
                <span class="creep-risk" style="color:${riskColor(c.riskLevel)}">${c.riskLevel.toUpperCase()}</span>
              </div>
              <div class="creep-stats">
                <span>Base: ${c.baseEntitlements}</span>
                <span>-></span>
                <span>Current: <strong>${c.currentEntitlements}</strong></span>
                <span>(+${c.addedOverTime} creep)</span>
              </div>
              <div class="creep-additions">
                ${c.topAdditions.map(a => html`<span class="creep-tag">${a}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderJMLWorkflow() {
    const events = [
      { type: 'joiner', user: 'new.hire.2026', date: '2026-04-23', department: 'Engineering', manager: 'Alice Chen', status: 'in_progress', tasks: ['Create AD account', 'Assign base role', 'Provision laptop', 'Grant repo access'], completedTasks: 2 },
      { type: 'mover', user: 'bob.smith', date: '2026-04-20', department: 'Engineering -> Security', manager: 'CISO Bob', status: 'in_progress', tasks: ['Remove old role entitlements', 'Assign new role', 'Transfer data ownership', 'Update group memberships'], completedTasks: 1 },
      { type: 'leaver', user: 'departing.user', date: '2026-04-18', department: 'Marketing', manager: 'VP Marketing', status: 'completed', tasks: ['Disable all accounts', 'Revoke VPN access', 'Transfer data ownership', 'Archive mailbox', 'Collect equipment'], completedTasks: 5 },
      { type: 'joiner', user: 'contractor.q2', date: '2026-04-22', department: 'Finance', manager: 'CFO', status: 'pending', tasks: ['Create temporary account', 'Assign contractor role', 'Set expiration date', 'Notify manager'], completedTasks: 0 },
      { type: 'mover', user: 'carol.wu', date: '2026-04-25', department: 'Security -> Engineering', manager: 'VP Engineering', status: 'scheduled', tasks: ['Plan transition', 'Identify access changes', 'Schedule downtime', 'Execute access transfer'], completedTasks: 0 },
    ];
    const typeIcon = (t: string) => t === 'joiner' ? 'JOIN' : t === 'mover' ? 'MOVE' : 'LEAVE';
    const statusColor = (s: string) => s === 'completed' ? '#10b981' : s === 'in_progress' ? '#3b82f6' : s === 'scheduled' ? '#8b5cf6' : '#94a3b8';
    return html`
      <section class="jml-workflow">
        <h4>Joiner / Mover / Leaver Workflow</h4>
        <div class="jml-list">
          ${events.map(e => {
            const pct = e.tasks.length > 0 ? Math.round((e.completedTasks / e.tasks.length) * 100) : 0;
            return html`
              <div class="jml-card" style="border-left:4px solid ${statusColor(e.status)}">
                <div class="jml-header">
                  <span class="jml-icon">${typeIcon(e.type)}</span>
                  <span class="jml-user">${e.user}</span>
                  <span class="jml-type">${e.type.toUpperCase()}</span>
                  <span class="jml-status" style="color:${statusColor(e.status)}">${e.status.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div class="jml-meta">
                  <span>${e.department}</span><span>Manager: ${e.manager}</span><span>${e.date}</span>
                </div>
                <div class="jml-tasks">
                  <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${statusColor(e.status)}"></div></div>
                  <span>${e.completedTasks}/${e.tasks.length} tasks</span>
                </div>
              </div>`;
          }).join('')}
        </div>
      </section>`;
  }

  private _renderSODConflicts() {
    const conflicts = [
      { user: 'bob.smith', role1: 'DevOps Engineer', role2: 'Security Auditor', conflictType: 'SoD Violation', severity: 'high', description: 'Same user can deploy code and audit deployments', recommendation: 'Reassign audit role to separate team member' },
      { user: 'alice.chen', role1: 'Engineering Lead', role2: 'Change Approver', conflictType: 'SoD Violation', severity: 'medium', description: 'Can submit and approve change requests', recommendation: 'Implement four-eyes principle for approvals' },
      { user: 'finance.admin', role1: 'Accounts Payable', role2: 'Bank Reconciliation', conflictType: 'SoD Violation', severity: 'critical', description: 'Can create payments and reconcile bank statements', recommendation: 'Immediately separate these roles' },
      { user: 'procurement.lead', role1: 'Purchase Requisition', role2: 'Vendor Approval', conflictType: 'SoD Violation', severity: 'high', description: 'Can request purchases and approve vendors', recommendation: 'Route vendor approvals to finance team' },
    ];
    const sevColor = (s: string) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : '#eab308';
    return html`
      <section class="sod-conflicts">
        <h4>Segregation of Duties Conflict Matrix</h4>
        <div class="sod-list">
          ${conflicts.map(c => html`
            <div class="sod-card" style="border-left:4px solid ${sevColor(c.severity)}">
              <div class="sod-header">
                <span class="sod-user">${c.user}</span>
                <span class="sod-severity" style="color:${sevColor(c.severity)}">${c.severity.toUpperCase()}</span>
              </div>
              <div class="sod-roles">
                <span class="sod-role1">${c.role1}</span>
                <span class="sod-vs">VS</span>
                <span class="sod-role2">${c.role2}</span>
              </div>
              <div class="sod-desc">${c.description}</div>
              <div class="sod-rec">REC: ${c.recommendation}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }  // ========== Security Testing Automation ==========
  private _renderDASTScheduler() {
    const scans = [
      { id: 'DAST-001', target: 'https://api.example.com', schedule: 'Daily 06:00', status: 'completed', lastRun: '2026-04-23 06:02:15', findings: { critical: 0, high: 2, medium: 5, low: 8 }, duration: '4m 32s', scanner: 'OWASP ZAP 2.14' },
      { id: 'DAST-002', target: 'https://app.example.com', schedule: 'Daily 07:00', status: 'running', lastRun: '2026-04-23 07:00:01', findings: { critical: 0, high: 0, medium: 0, low: 0 }, duration: 'In progress...', scanner: 'Burp Suite Enterprise' },
      { id: 'DAST-003', target: 'https://admin.example.com', schedule: 'Weekly Mon 08:00', status: 'scheduled', lastRun: '2026-04-21 08:01:30', findings: { critical: 1, high: 3, medium: 7, low: 12 }, duration: '12m 18s', scanner: 'OWASP ZAP 2.14' },
      { id: 'DAST-004', target: 'https://mobile-api.example.com', schedule: 'On Deploy', status: 'failed', lastRun: '2026-04-22 18:05:00', findings: { critical: 0, high: 0, medium: 0, low: 0 }, duration: 'Error: TLS handshake failed', scanner: 'Nuclei' },
      { id: 'DAST-005', target: 'https://staging.example.com', schedule: 'On PR Merge', status: 'completed', lastRun: '2026-04-23 11:30:00', findings: { critical: 0, high: 1, medium: 3, low: 4 }, duration: '6m 15s', scanner: 'OWASP ZAP 2.14' },
    ];
    const statusColor = (s: string) => s === 'completed' ? '#10b981' : s === 'running' ? '#3b82f6' : s === 'failed' ? '#ef4444' : '#94a3b8';
    return html`
      <section class="dast-scheduler">
        <h4>DAST Scan Scheduler & Results</h4>
        <div class="dast-list">
          ${scans.map(s => html`
            <div class="dast-card" style="border-left:4px solid ${statusColor(s.status)}">
              <div class="dast-header">
                <span class="dast-id">${s.id}</span>
                <span class="dast-status" style="color:${statusColor(s.status)}">${s.status.toUpperCase()}</span>
                <span class="dast-scanner">${s.scanner}</span>
              </div>
              <div class="dast-target">${s.target}</div>
              <div class="dast-meta">
                <span>Schedule: ${s.schedule}</span>
                <span>Duration: ${s.duration}</span>
                <span>Last: ${s.lastRun}</span>
              </div>
              <div class="dast-findings">
                <span class="sev-critical">${s.findings.critical}C</span>
                <span class="sev-high">${s.findings.high}H</span>
                <span class="sev-medium">${s.findings.medium}M</span>
                <span class="sev-low">${s.findings.low}L</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderSASTFindings() {
    const findings = [
      { id: 'SAST-001', file: 'src/api/users.ts', line: 142, rule: 'SQL Injection', severity: 'critical', status: 'open', tool: 'Semgrep', effort: '8h', cwe: 'CWE-89' },
      { id: 'SAST-002', file: 'src/auth/token.ts', line: 87, rule: 'Hardcoded Secret', severity: 'critical', status: 'in_review', tool: 'SonarQube', effort: '2h', cwe: 'CWE-798' },
      { id: 'SAST-003', file: 'src/utils/crypto.ts', line: 23, rule: 'Weak Hash Algorithm', severity: 'high', status: 'open', tool: 'CodeQL', effort: '4h', cwe: 'CWE-328' },
      { id: 'SAST-004', file: 'src/middleware/cors.ts', line: 15, rule: 'Overly Permissive CORS', severity: 'high', status: 'fixed', tool: 'Semgrep', effort: '1h', cwe: 'CWE-942' },
      { id: 'SAST-005', file: 'src/routes/upload.ts', line: 56, rule: 'Path Traversal', severity: 'high', status: 'open', tool: 'CodeQL', effort: '3h', cwe: 'CWE-22' },
      { id: 'SAST-006', file: 'src/config/database.ts', line: 8, rule: 'Insecure Connection', severity: 'medium', status: 'wont_fix', tool: 'SonarQube', effort: '16h', cwe: 'CWE-319' },
    ];
    const sevColor = (s: string) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : '#eab308';
    const statusColor = (s: string) => s === 'fixed' ? '#10b981' : s === 'in_review' ? '#3b82f6' : s === 'wont_fix' ? '#94a3b8' : '#f59e0b';
    return html`
      <section class="sast-findings">
        <h4>SAST Findings Management</h4>
        <div class="sast-list">
          ${findings.map(f => html`
            <div class="sast-card" style="border-left:4px solid ${sevColor(f.severity)}">
              <div class="sast-header">
                <span class="sast-id">${f.id}</span>
                <span class="sast-severity" style="color:${sevColor(f.severity)}">${f.severity.toUpperCase()}</span>
                <span class="sast-status" style="color:${statusColor(f.status)}">${f.status.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div class="sast-location">${f.file}:${f.line}</div>
              <div class="sast-rule">${f.rule} (${f.cwe})</div>
              <div class="sast-meta">
                <span>Tool: ${f.tool}</span>
                <span>Effort: ${f.effort}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderSCATracking() {
    const deps = [
      { name: 'lodash', version: '4.17.20', latestSafe: '4.17.21', vulns: 1, severity: 'high', fixAvailable: true, affectedProjects: ['web-app', 'admin-portal', 'api-gateway'] },
      { name: 'express', version: '4.17.1', latestSafe: '4.19.2', vulns: 3, severity: 'critical', fixAvailable: true, affectedProjects: ['api-gateway', 'auth-service'] },
      { name: 'axios', version: '0.21.0', latestSafe: '1.6.0', vulns: 1, severity: 'medium', fixAvailable: true, affectedProjects: ['web-app', 'mobile-app'] },
      { name: 'jsonwebtoken', version: '8.5.1', latestSafe: '9.0.2', vulns: 2, severity: 'high', fixAvailable: false, affectedProjects: ['auth-service', 'api-gateway'] },
      { name: 'minimist', version: '1.2.0', latestSafe: '1.2.8', vulns: 1, severity: 'low', fixAvailable: true, affectedProjects: ['cli-tool', 'build-scripts'] },
      { name: 'node-forge', version: '0.10.0', latestSafe: '1.3.1', vulns: 2, severity: 'critical', fixAvailable: true, affectedProjects: ['cert-manager', 'vpn-service'] },
    ];
    const sevColor = (s: string) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <section class="sca-tracking">
        <h4>SCA Dependency Vulnerability Tracking</h4>
        <div class="sca-list">
          ${deps.map(d => html`
            <div class="sca-card" style="border-left:4px solid ${sevColor(d.severity)}">
              <div class="sca-header">
                <span class="sca-name">${d.name}</span>
                <span class="sca-version">${d.version} -> ${d.latestSafe}</span>
                <span class="sca-severity" style="color:${sevColor(d.severity)}">${d.vulns} ${d.severity.toUpperCase()}</span>
                <span class="sca-fix" style="color:${d.fixAvailable ? '#10b981' : '#ef4444'}">${d.fixAvailable ? 'FIX AVAILABLE' : 'NO FIX'}</span>
              </div>
              <div class="sca-projects">
                ${d.affectedProjects.map(p => html`<span class="sca-project-tag">${p}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderContainerScanning() {
    const images = [
      { name: 'api-gateway:latest', registry: 'ECR', lastScan: '2026-04-23 05:00', vulns: { critical: 0, high: 1, medium: 4, low: 7 }, baseImage: 'node:18-alpine', size: '245MB', status: 'pass' },
      { name: 'auth-service:v2.3.1', registry: 'ECR', lastScan: '2026-04-23 05:02', vulns: { critical: 1, high: 3, medium: 8, low: 12 }, baseImage: 'python:3.11-slim', size: '312MB', status: 'fail' },
      { name: 'worker:latest', registry: 'GCR', lastScan: '2026-04-23 05:05', vulns: { critical: 0, high: 0, medium: 2, low: 5 }, baseImage: 'distroless/base', size: '89MB', status: 'pass' },
      { name: 'frontend:prod-20260422', registry: 'ECR', lastScan: '2026-04-22 22:00', vulns: { critical: 0, high: 2, medium: 6, low: 9 }, baseImage: 'nginx:alpine', size: '156MB', status: 'warn' },
      { name: 'sidecar-injector:v1.8', registry: 'GCR', lastScan: '2026-04-23 05:10', vulns: { critical: 0, high: 0, medium: 1, low: 3 }, baseImage: 'distroless/static', size: '23MB', status: 'pass' },
    ];
    const statusColor = (s: string) => s === 'pass' ? '#10b981' : s === 'warn' ? '#f59e0b' : '#ef4444';
    return html`
      <section class="container-scanning">
        <h4>Container Image Scanning Dashboard</h4>
        <div class="container-list">
          ${images.map(i => html`
            <div class="container-card" style="border-left:4px solid ${statusColor(i.status)}">
              <div class="container-header">
                <span class="container-name">${i.name}</span>
                <span class="container-status" style="color:${statusColor(i.status)}">${i.status.toUpperCase()}</span>
              </div>
              <div class="container-meta">
                <span>${i.registry}</span>
                <span>${i.baseImage}</span>
                <span>${i.size}</span>
                <span>${i.lastScan}</span>
              </div>
              <div class="container-findings">
                <span class="sev-critical">${i.vulns.critical}C</span>
                <span class="sev-high">${i.vulns.high}H</span>
                <span class="sev-medium">${i.vulns.medium}M</span>
                <span class="sev-low">${i.vulns.low}L</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderIaCScanning() {
    const results = [
      { id: 'IAC-001', file: 'terraform/aws/rds.tf', line: 23, rule: 'RDS Public Access', severity: 'critical', status: 'open', cloud: 'AWS', tool: 'tfsec' },
      { id: 'IAC-002', file: 'terraform/aws/s3.tf', line: 45, rule: 'S3 Bucket Not Encrypted', severity: 'high', status: 'fixed', cloud: 'AWS', tool: 'Checkov' },
      { id: 'IAC-003', file: 'k8s/namespace-prod.yaml', line: 12, rule: 'No Network Policy', severity: 'high', status: 'open', cloud: 'K8s', tool: 'Trivy' },
      { id: 'IAC-004', file: 'terraform/gcp/firewall.tf', line: 67, rule: 'Open Ingress 0.0.0.0/0', severity: 'critical', status: 'in_review', cloud: 'GCP', tool: 'tfsec' },
      { id: 'IAC-005', file: 'ansible/playbook-db.yml', line: 89, rule: 'SSH Password Auth Enabled', severity: 'medium', status: 'open', cloud: 'On-Prem', tool: 'Ansible-lint' },
    ];
    const sevColor = (s: string) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : '#eab308';
    const statusColor = (s: string) => s === 'fixed' ? '#10b981' : s === 'in_review' ? '#3b82f6' : '#f59e0b';
    return html`
      <section class="iac-scanning">
        <h4>IaC Security Scanning Results</h4>
        <div class="iac-list">
          ${results.map(r => html`
            <div class="iac-card" style="border-left:4px solid ${sevColor(r.severity)}">
              <div class="iac-header">
                <span class="iac-id">${r.id}</span>
                <span class="iac-severity" style="color:${sevColor(r.severity)}">${r.severity.toUpperCase()}</span>
                <span class="iac-status" style="color:${statusColor(r.status)}">${r.status.replace('_', ' ').toUpperCase()}</span>
                <span class="iac-cloud">${r.cloud}</span>
              </div>
              <div class="iac-location">${r.file}:${r.line}</div>
              <div class="iac-rule">${r.rule} <span class="iac-tool">[${r.tool}]</span></div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderFuzzingResults() {
    const fuzzTests = [
      { id: 'FUZZ-001', target: 'api/v1/users', method: 'REST API Fuzzing', status: 'completed', totalRequests: 50000, crashes: 0, uniqueBugs: 0, coverage: '87%', duration: '2h 15m', lastRun: '2026-04-22' },
      { id: 'FUZZ-002', target: 'api/v1/upload', method: 'File Upload Fuzzing', status: 'completed', totalRequests: 12000, crashes: 3, uniqueBugs: 1, coverage: '72%', duration: '45m', lastRun: '2026-04-22' },
      { id: 'FUZZ-003', target: 'api/v1/auth/login', method: 'Auth Protocol Fuzzing', status: 'running', totalRequests: 34000, crashes: 1, uniqueBugs: 0, coverage: '65%', duration: '1h 30m+', lastRun: '2026-04-23' },
      { id: 'FUZZ-004', target: 'websocket/realtime', method: 'WebSocket Protocol Fuzzing', status: 'scheduled', totalRequests: 0, crashes: 0, uniqueBugs: 0, coverage: '0%', duration: '-', lastRun: '-' },
      { id: 'FUZZ-005', target: 'grpc/payment-service', method: 'gRPC Mutation Fuzzing', status: 'completed', totalRequests: 28000, crashes: 2, uniqueBugs: 2, coverage: '78%', duration: '1h 50m', lastRun: '2026-04-21' },
    ];
    const statusColor = (s: string) => s === 'completed' ? '#10b981' : s === 'running' ? '#3b82f6' : '#94a3b8';
    return html`
      <section class="fuzzing-results">
        <h4>Fuzzing Test Results Tracker</h4>
        <div class="fuzz-list">
          ${fuzzTests.map(f => html`
            <div class="fuzz-card" style="border-left:4px solid ${statusColor(f.status)}">
              <div class="fuzz-header">
                <span class="fuzz-id">${f.id}</span>
                <span class="fuzz-target">${f.target}</span>
                <span class="fuzz-status" style="color:${statusColor(f.status)}">${f.status.toUpperCase()}</span>
              </div>
              <div class="fuzz-method">${f.method}</div>
              <div class="fuzz-stats">
                <span>Requests: ${f.totalRequests.toLocaleString()}</span>
                <span style="color:${f.crashes > 0 ? '#ef4444' : '#10b981'}">Crashes: ${f.crashes}</span>
                <span style="color:${f.uniqueBugs > 0 ? '#f97316' : '#10b981'}">Bugs: ${f.uniqueBugs}</span>
                <span>Coverage: ${f.coverage}</span>
              </div>
              <div class="fuzz-meta">
                <span>Duration: ${f.duration}</span>
                <span>Last: ${f.lastRun}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }  // ========== Threat Intelligence Platform ==========
  private _renderSTIXViewer() {
    const objects = [
      { id: 'STIX-001', type: 'indicator', name: 'Malicious IP 185.220.101.34', pattern: 'ipv4-addr:value = 185.220.101.34', confidence: 95, created: '2026-04-20', source: 'MISP Community', killChain: 'reconnaissance' },
      { id: 'STIX-002', type: 'malware', name: 'Cobalt Strike Beacon v4.8', pattern: 'file:hashes.MD5 = a1b2c3d4e5f6', confidence: 98, created: '2026-04-19', source: 'MITRE ATT&CK', killChain: 'weaponization' },
      { id: 'STIX-003', type: 'attack-pattern', name: 'T1059.001 - PowerShell', pattern: 'process:command_line MATCHES *-encodedcommand*', confidence: 90, created: '2026-04-18', source: 'Internal Analysis', killChain: 'execution' },
      { id: 'STIX-004', type: 'threat-actor', name: 'APT29 (Cozy Bear)', pattern: 'threat-actor:name = APT29', confidence: 92, created: '2026-04-17', source: 'FBI/CISA Advisory', killChain: 'multiple' },
      { id: 'STIX-005', type: 'vulnerability', name: 'CVE-2024-3400 - PAN-OS Command Injection', pattern: 'vulnerability:name = CVE-2024-3400', confidence: 100, created: '2026-04-15', source: 'NVD', killChain: 'initial-access' },
      { id: 'STIX-006', type: 'identity', name: 'Suspicious Domain gate-secure.com', pattern: 'domain-name:value = gate-secure.com', confidence: 78, created: '2026-04-23', source: 'PassiveDNS', killChain: 'reconnaissance' },
    ];
    return html`
      <section class="stix-viewer">
        <h4>Structured Threat Information (STIX) Viewer</h4>
        <div class="stix-grid">
          ${objects.map(o => html`
            <div class="stix-card">
              <div class="stix-header">
                <span class="stix-type">${o.type.toUpperCase()}</span>
                <span class="stix-confidence" style="color:${o.confidence > 90 ? '#10b981' : o.confidence > 80 ? '#f59e0b' : '#ef4444'}">${o.confidence}%</span>
              </div>
              <div class="stix-name">${o.name}</div>
              <div class="stix-pattern"><code>${o.pattern}</code></div>
              <div class="stix-meta">
                <span>Source: ${o.source}</span>
                <span>Kill Chain: ${o.killChain}</span>
                <span>${o.created}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderTAXIIFeeds() {
    const feeds = [
      { id: 'TAXII-01', name: 'MITRE ATT&CK Enterprise', url: 'https://cti-taxii.mitre.org/stix', status: 'connected', lastPoll: '2026-04-23 12:00', objectsReceived: 1245, collections: 3, protocol: 'TAXII 2.1' },
      { id: 'TAXII-02', name: 'CISA Advisory Feed', url: 'https://www.cisa.gov/taxii', status: 'connected', lastPoll: '2026-04-23 11:30', objectsReceived: 87, collections: 2, protocol: 'TAXII 2.1' },
      { id: 'TAXII-03', name: 'AlienVault OTX', url: 'https://otx.alienvault.com/taxii', status: 'connected', lastPoll: '2026-04-23 12:15', objectsReceived: 3421, collections: 8, protocol: 'TAXII 2.0' },
      { id: 'TAXII-04', name: 'Anomali ThreatStream', url: 'https://threatstream.anomali.com/taxii', status: 'error', lastPoll: '2026-04-22 18:00', objectsReceived: 0, collections: 0, protocol: 'TAXII 2.1' },
      { id: 'TAXII-05', name: 'Internal Intel Sharing', url: 'https://intel.internal.corp/taxii', status: 'connected', lastPoll: '2026-04-23 12:00', objectsReceived: 156, collections: 4, protocol: 'TAXII 2.1' },
    ];
    const statusColor = (s: string) => s === 'connected' ? '#10b981' : '#ef4444';
    return html`
      <section class="taxii-feeds">
        <h4>TAXII Feed Management</h4>
        <div class="taxii-list">
          ${feeds.map(f => html`
            <div class="taxii-card" style="border-left:4px solid ${statusColor(f.status)}">
              <div class="taxii-header">
                <span class="taxii-name">${f.name}</span>
                <span class="taxii-status" style="color:${statusColor(f.status)}">${f.status.toUpperCase()}</span>
              </div>
              <div class="taxii-url"><code>${f.url}</code></div>
              <div class="taxii-meta">
                <span>Protocol: ${f.protocol}</span>
                <span>Collections: ${f.collections}</span>
                <span>Objects: ${f.objectsReceived.toLocaleString()}</span>
                <span>Last Poll: ${f.lastPoll}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderIntelSharingWorkflow() {
    const shares = [
      { id: 'SHARE-001', direction: 'outbound', partner: 'Industry ISAC', classification: 'TLP:AMBER', objects: 12, status: 'approved', date: '2026-04-22' },
      { id: 'SHARE-002', direction: 'inbound', partner: 'CISA', classification: 'TLP:CLEAR', objects: 45, status: 'received', date: '2026-04-23' },
      { id: 'SHARE-003', direction: 'outbound', partner: 'Partner Org A', classification: 'TLP:GREEN', objects: 5, status: 'pending_review', date: '2026-04-23' },
      { id: 'SHARE-004', direction: 'inbound', partner: 'FBI IC3', classification: 'TLP:AMBER+STRICT', objects: 3, status: 'received', date: '2026-04-21' },
    ];
    return html`
      <section class="intel-sharing">
        <h4>Intelligence Sharing Workflow</h4>
        <div class="share-list">
          ${shares.map(s => html`
            <div class="share-card" style="border-left:4px solid ${s.direction === 'outbound' ? '#3b82f6' : '#8b5cf6'}">
              <div class="share-header">
                <span class="share-direction">${s.direction === 'outbound' ? 'OUTBOUND' : 'INBOUND'}</span>
                <span class="share-partner">${s.partner}</span>
                <span class="share-classification">${s.classification}</span>
              </div>
              <div class="share-meta">
                <span>${s.objects} objects</span>
                <span>${s.date}</span>
                <span class="share-status">${s.status.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }  // ========== Security Operations Workflow ==========
  private _renderIncidentTriageMatrix() {
    const matrix = [
      { alertType: 'Malware Detection', criteria: 'Known malware hash + execution', autoSeverity: 'high', autoAction: 'Isolate endpoint + notify IR', sla: '15min', overrideAllowed: true },
      { alertType: 'Brute Force', criteria: '>50 failed logins in 5min from single IP', autoSeverity: 'medium', autoAction: 'Block IP + alert SOC', sla: '30min', overrideAllowed: true },
      { alertType: 'Data Exfiltration', criteria: '>500MB upload to external in 1hr', autoSeverity: 'critical', autoAction: 'Block transfer + page on-call', sla: '5min', overrideAllowed: false },
      { alertType: 'Privilege Escalation', criteria: 'User added to admin group outside change window', autoSeverity: 'high', autoAction: 'Revert change + alert security team', sla: '10min', overrideAllowed: false },
      { alertType: 'Phishing Report', criteria: 'User reported suspicious email', autoSeverity: 'low', autoAction: 'Quarantine email + analyze headers', sla: '60min', overrideAllowed: true },
      { alertType: 'DDoS Indicator', criteria: '>10x normal request rate', autoSeverity: 'high', autoAction: 'Enable rate limiting + notify NOC', sla: '10min', overrideAllowed: true },
      { alertType: 'Unauthorized Access', criteria: 'Login from impossible travel location', autoSeverity: 'critical', autoAction: 'Force MFA + lock account + page IR', sla: '5min', overrideAllowed: false },
      { alertType: 'Configuration Drift', criteria: 'Security control disabled on production', autoSeverity: 'high', autoAction: 'Auto-remediate + notify change board', sla: '15min', overrideAllowed: true },
    ];
    const sevColor = (s: string) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <section class="incident-triage-matrix">
        <h4>Incident Severity Auto-Triage Matrix</h4>
        <div class="triage-list">
          ${matrix.map(m => html`
            <div class="triage-card" style="border-left:4px solid ${sevColor(m.autoSeverity)}">
              <div class="triage-header">
                <span class="triage-type">${m.alertType}</span>
                <span class="triage-severity" style="color:${sevColor(m.autoSeverity)}">${m.autoSeverity.toUpperCase()}</span>
                <span class="triage-sla">SLA: ${m.sla}</span>
              </div>
              <div class="triage-criteria"><strong>Criteria:</strong> ${m.criteria}</div>
              <div class="triage-action"><strong>Auto Action:</strong> ${m.autoAction}</div>
              <div class="triage-override">Override: ${m.overrideAllowed ? 'ALLOWED' : 'NOT ALLOWED'}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderRunbookTrigger() {
    const runbooks = [
      { id: 'RB-001', name: 'Malware Isolation Playbook', triggerAlert: 'Malware Detection', steps: 8, avgRunTime: '12min', lastExecuted: '2026-04-22 14:30', successRate: '95%', autoRun: true },
      { id: 'RB-002', name: 'DDoS Mitigation Playbook', triggerAlert: 'DDoS Indicator', steps: 12, avgRunTime: '8min', lastExecuted: '2026-04-20 03:15', successRate: '88%', autoRun: true },
      { id: 'RB-003', name: 'Credential Compromise Response', triggerAlert: 'Unauthorized Access', steps: 15, avgRunTime: '25min', lastExecuted: '2026-04-18 09:45', successRate: '92%', autoRun: false },
      { id: 'RB-004', name: 'Data Leak Containment', triggerAlert: 'Data Exfiltration', steps: 10, avgRunTime: '18min', lastExecuted: '2026-04-15 16:20', successRate: '90%', autoRun: true },
      { id: 'RB-005', name: 'Phishing Investigation', triggerAlert: 'Phishing Report', steps: 6, avgRunTime: '5min', lastExecuted: '2026-04-23 10:00', successRate: '98%', autoRun: true },
    ];
    return html`
      <section class="runbook-trigger">
        <h4>Runbook Auto-Trigger</h4>
        <div class="runbook-list">
          ${runbooks.map(r => html`
            <div class="runbook-card">
              <div class="runbook-header">
                <span class="runbook-id">${r.id}</span>
                <span class="runbook-name">${r.name}</span>
                <span class="runbook-auto">${r.autoRun ? 'AUTO' : 'MANUAL'}</span>
              </div>
              <div class="runbook-meta">
                <span>Trigger: ${r.triggerAlert}</span>
                <span>Steps: ${r.steps}</span>
                <span>Avg: ${r.avgRunTime}</span>
                <span>Success: ${r.successRate}</span>
              </div>
              <div class="runbook-last">Last executed: ${r.lastExecuted}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderShiftHandoff() {
    const checklist = [
      { item: 'Review open incidents - confirm ownership transfer', completed: true, assignee: 'Night Shift' },
      { item: 'Check active threat hunts - update status', completed: true, assignee: 'Night Shift' },
      { item: 'Verify monitoring dashboards - no suppressed alerts', completed: false, assignee: 'Day Shift' },
      { item: 'Review pending escalation requests', completed: false, assignee: 'Day Shift' },
      { item: 'Update SOC metrics board', completed: true, assignee: 'Night Shift' },
      { item: 'Check on-call rotation for next 24h', completed: false, assignee: 'Day Shift' },
      { item: 'Document any anomalies or pattern changes', completed: true, assignee: 'Night Shift' },
      { item: 'Verify backup and log shipping status', completed: false, assignee: 'Day Shift' },
    ];
    return html`
      <section class="shift-handoff">
        <h4>Shift Handoff Checklist</h4>
        <div class="handoff-list">
          ${checklist.map(c => html`
            <div class="handoff-item ${c.completed ? 'completed' : 'pending'}">
              <span class="handoff-check">${c.completed ? '[x]' : '[ ]'}</span>
              <span class="handoff-text">${c.item}</span>
              <span class="handoff-assignee">${c.assignee}</span>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderEscalationTree() {
    const levels = [
      { level: 1, name: 'Tier 1 SOC Analyst', criteria: 'All alerts initial triage', authority: 'Block IPs, quarantine emails, create tickets', escalateAfter: '15min unresolved', escalateTo: 'Tier 2' },
      { level: 2, name: 'Tier 2 SOC Analyst', criteria: 'Confirmed threats, multi-vector attacks', authority: 'Isolate endpoints, disable accounts, engage IR', escalateAfter: '30min or critical severity', escalateTo: 'Tier 3 / IR Lead' },
      { level: 3, name: 'IR Lead / Security Engineer', criteria: 'Active breaches, APT indicators', authority: 'Full system access, engage external partners, legal', escalateAfter: 'Confirmed data breach', escalateTo: 'CISO / Executive Team' },
      { level: 4, name: 'CISO', criteria: 'Material breach, regulatory notification required', authority: 'Executive decisions, external communications, legal counsel', escalateAfter: 'Board notification threshold', escalateTo: 'Board / Legal' },
    ];
    const levelColor = (l: number) => l === 1 ? '#3b82f6' : l === 2 ? '#f59e0b' : l === 3 ? '#f97316' : '#ef4444';
    return html`
      <section class="escalation-tree">
        <h4>Escalation Decision Tree</h4>
        <div class="escalation-list">
          ${levels.map(l => html`
            <div class="escalation-card" style="border-left:4px solid ${levelColor(l.level)}">
              <div class="escalation-header">
                <span class="escalation-level" style="background:${levelColor(l.level)}20;color:${levelColor(l.level)}">L${l.level}</span>
                <span class="escalation-name">${l.name}</span>
              </div>
              <div class="escalation-criteria"><strong>When:</strong> ${l.criteria}</div>
              <div class="escalation-authority"><strong>Can:</strong> ${l.authority}</div>
              <div class="escalation-escalate">Escalate after: ${l.escalateAfter} -> ${l.escalateTo}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderPostIncidentTracker() {
    const incidents = [
      { id: 'INC-2026-042', title: 'Ransomware Attempt Blocked', severity: 'critical', closedDate: '2026-04-20', actions: 8, completed: 6, overdue: 1, rootCause: 'Phishing email bypassed spam filter' },
      { id: 'INC-2026-039', title: 'AWS Credential Exposure', severity: 'high', closedDate: '2026-04-18', actions: 5, completed: 5, overdue: 0, rootCause: 'CI/CD pipeline misconfiguration' },
      { id: 'INC-2026-035', title: 'DDoS Attack on API Gateway', severity: 'medium', closedDate: '2026-04-15', actions: 4, completed: 3, overdue: 1, rootCause: 'Insufficient rate limiting configuration' },
      { id: 'INC-2026-031', title: 'Insider Data Access Anomaly', severity: 'high', closedDate: '2026-04-12', actions: 6, completed: 4, overdue: 2, rootCause: 'Excessive permissions granted during onboarding' },
    ];
    const sevColor = (s: string) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : '#eab308';
    return html`
      <section class="post-incident-tracker">
        <h4>Post-Incident Action Item Tracker</h4>
        <div class="incident-action-list">
          ${incidents.map(i => {
            const pct = Math.round((i.completed / i.actions) * 100);
            return html`
              <div class="incident-action-card" style="border-left:4px solid ${sevColor(i.severity)}">
                <div class="ia-header">
                  <span class="ia-id">${i.id}</span>
                  <span class="ia-title">${i.title}</span>
                  <span class="ia-severity" style="color:${sevColor(i.severity)}">${i.severity.toUpperCase()}</span>
                </div>
                <div class="ia-root-cause"><strong>Root Cause:</strong> ${i.rootCause}</div>
                <div class="ia-progress">
                  <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${pct === 100 ? '#10b981' : '#3b82f6'}"></div></div>
                  <span>${i.completed}/${i.actions} actions (${pct}%)</span>
                </div>
                <div class="ia-meta">
                  <span>Closed: ${i.closedDate}</span>
                  ${i.overdue > 0 ? html`<span class="ia-overdue" style="color:#ef4444">${i.overdue} OVERDUE</span>` : ''}
                </div>
              </div>`;
          }).join('')}
        </div>
      </section>`;
  }


  private _renderGamification() {
    const leaderboard = [
      { rank: 1, name: 'Sarah Chen', dept: 'Engineering', score: 9850, badges: 24, streak: 45, level: 'Platinum Guardian', avatar: 'SC' },
      { rank: 2, name: 'Mike Rodriguez', dept: 'Operations', score: 9420, badges: 21, streak: 38, level: 'Platinum Guardian', avatar: 'MR' },
      { rank: 3, name: 'Aisha Patel', dept: 'Finance', score: 8910, badges: 19, streak: 52, level: 'Gold Defender', avatar: 'AP' },
      { rank: 4, name: 'James Wilson', dept: 'Engineering', score: 8750, badges: 18, streak: 30, level: 'Gold Defender', avatar: 'JW' },
      { rank: 5, name: 'Lisa Kim', dept: 'HR', score: 8320, badges: 17, streak: 28, level: 'Gold Defender', avatar: 'LK' },
      { rank: 6, name: 'David Brown', dept: 'Legal', score: 7890, badges: 15, streak: 22, level: 'Silver Sentinel', avatar: 'DB' },
      { rank: 7, name: 'Emma Zhang', dept: 'Marketing', score: 7650, badges: 14, streak: 19, level: 'Silver Sentinel', avatar: 'EZ' },
      { rank: 8, name: 'Tom Anderson', dept: 'Engineering', score: 7200, badges: 13, streak: 15, level: 'Silver Sentinel', avatar: 'TA' },
    ];
    const achievements = [
      { name: 'Eagle Eye', desc: 'Reported 10 phishing emails', icon: 'eagle', unlocked: 45, total: 120 },
      { name: 'Patch Master', desc: 'All systems patched within SLA', icon: 'patch', unlocked: 8, total: 8 },
      { name: 'Zero Breach Quarter', desc: 'No security incidents in 90 days', icon: 'shield', unlocked: 2, total: 4 },
      { name: 'Quiz Champion', desc: 'Scored 100% on monthly quiz', icon: 'brain', unlocked: 34, total: 120 },
      { name: 'Incident Hero', desc: 'Resolved 5 critical incidents', icon: 'hero', unlocked: 12, total: 120 },
      { name: 'Social Guardian', desc: 'Completed all social engineering modules', icon: 'people', unlocked: 67, total: 120 },
    ];
    const teamScores = [
      { team: 'Engineering', score: 38500, members: 42, avgScore: 917, completion: 94 },
      { team: 'Operations', score: 31200, members: 35, avgScore: 891, completion: 88 },
      { team: 'Finance', score: 22800, members: 28, avgScore: 814, completion: 82 },
      { team: 'Legal', score: 18900, members: 22, avgScore: 859, completion: 91 },
      { team: 'HR', score: 15600, members: 18, avgScore: 867, completion: 85 },
      { team: 'Marketing', score: 12400, members: 15, avgScore: 827, completion: 78 },
    ];
    const rankColors = ['#fbbf24', '#94a3b8', '#cd7f32'];
    return html`
      <section class="gamification">
        <h4>Security Awareness Gamification</h4>
        <div class="gamification-grid">
          <div class="gam-leaderboard">
            <h5>Security Champion Leaderboard</h5>
            ${leaderboard.map(p => html`
              <div class="gam-player" style="border-left:4px solid ${p.rank <= 3 ? rankColors[p.rank - 1] : '#6b7280'}">
                <span class="gam-rank" style="color:${p.rank <= 3 ? rankColors[p.rank - 1] : '#6b7280'}">${p.rank}</span>
                <div class="gam-avatar">${p.avatar}</div>
                <div class="gam-info">
                  <span class="gam-name">${p.name}</span>
                  <span class="gam-dept">${p.dept} | ${p.level}</span>
                </div>
                <div class="gam-stats">
                  <span>${p.score.toLocaleString()} pts</span>
                  <span>${p.badges} badges</span>
                  <span class="gam-streak">${p.streak}d streak</span>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="gam-achievements">
            <h5>Achievement Badges</h5>
            ${achievements.map(a => html`
              <div class="gam-badge-card">
                <span class="badge-icon">${a.icon}</span>
                <div class="badge-info">
                  <span class="badge-name">${a.name}</span>
                  <span class="badge-desc">${a.desc}</span>
                  <div class="badge-progress">
                    <div class="badge-bar"><div class="badge-fill" style="width:${(a.unlocked / a.total) * 100}%"></div></div>
                    <span>${a.unlocked}/${a.total} unlocked</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="gam-teams">
            <h5>Team Competition Scores</h5>
            ${teamScores.map(t => html`
              <div class="gam-team-row">
                <span class="gam-team-name">${t.team}</span>
                <span class="gam-team-score">${t.score.toLocaleString()}</span>
                <span class="gam-team-members">${t.members} members</span>
                <span class="gam-team-avg">Avg: ${t.avgScore}</span>
                <div class="gam-team-comp"><div class="gam-team-fill" style="width:${t.completion}%"></div></div>
                <span class="gam-team-pct">${t.completion}%</span>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`;
  }



  private _renderIncidentAnalytics() {
    const months = ['May 25', 'Jun 25', 'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26'];
    const incidentCounts = [42, 38, 55, 47, 36, 44, 51, 39, 33, 41, 37, 28];
    const categories = [
      { name: 'Malware/Ransomware', count: 87, pct: 24, avgMttd: 32, avgMttr: 195, trend: 'decreasing', color: '#ef4444' },
      { name: 'Phishing/Social Eng.', count: 72, pct: 20, avgMttd: 18, avgMttr: 45, trend: 'stable', color: '#f59e0b' },
      { name: 'Unauthorized Access', count: 58, pct: 16, avgMttd: 55, avgMttr: 240, trend: 'increasing', color: '#8b5cf6' },
      { name: 'Data Exfiltration', count: 45, pct: 12, avgMttd: 72, avgMttr: 180, trend: 'decreasing', color: '#ec4899' },
      { name: 'DDoS', count: 38, pct: 11, avgMttd: 8, avgMttr: 90, trend: 'stable', color: '#3b82f6' },
      { name: 'Insider Threat', count: 28, pct: 8, avgMttd: 120, avgMttr: 480, trend: 'increasing', color: '#14b8a6' },
      { name: 'Supply Chain', count: 18, pct: 5, avgMttd: 96, avgMttr: 720, trend: 'increasing', color: '#f97316' },
      { name: 'Cloud Misconfig', count: 22, pct: 4, avgMttd: 15, avgMttr: 60, trend: 'decreasing', color: '#06b6d4' },
    ];
    const severityDist = [
      { level: 'Critical', count: 18, pct: 5, avgCost: 850000, color: '#dc2626' },
      { level: 'High', count: 67, pct: 19, avgCost: 320000, color: '#ef4444' },
      { level: 'Medium', count: 142, pct: 39, avgCost: 85000, color: '#f59e0b' },
      { level: 'Low', count: 133, pct: 37, avgCost: 15000, color: '#10b981' },
    ];
    const maxVal = Math.max(...incidentCounts);
    return html`
      <section class="incident-analytics">
        <h4>Security Incident Analytics (12-Month View)</h4>
        <div class="ia-trend-chart">
          <h5>Incident Trend Analysis</h5>
          <div class="trend-bars">
            ${months.map((m, i) => {
              const h = Math.round((incidentCounts[i] / maxVal) * 100);
              return html`
                <div class="trend-col">
                  <div class="trend-bar" style="height:${h}%" title="${incidentCounts[i]} incidents"></div>
                  <span class="trend-label">${m}</span>
                  <span class="trend-val">${incidentCounts[i]}</span>
                </div>`;
            }).join('')}
          </div>
        </div>
        <div class="ia-category-matrix">
          <h5>Incident Categorization Matrix</h5>
          <div class="cat-table">
            <div class="cat-row cat-header">
              <span>Category</span><span>Count</span><span>Share</span><span>Avg MTTD</span><span>Avg MTTR</span><span>Trend</span>
            </div>
            ${categories.map(c => html`
              <div class="cat-row">
                <span style="color:${c.color}">${c.name}</span>
                <span>${c.count}</span>
                <span>${c.pct}%</span>
                <span>${c.avgMttd}min</span>
                <span>${c.avgMttr}min</span>
                <span class="cat-trend" style="color:${c.trend === 'decreasing' ? '#10b981' : c.trend === 'increasing' ? '#ef4444' : '#6b7280'}">${c.trend}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="ia-severity-dist">
          <h5>Impact Severity Distribution</h5>
          <div class="sev-bars">
            ${severityDist.map(s => html`
              <div class="sev-row">
                <span class="sev-level" style="color:${s.color}">${s.level}</span>
                <div class="sev-bar-bg"><div class="sev-bar-fill" style="width:${s.pct * 2.5}%;background:${s.color}"></div></div>
                <span class="sev-count">${s.count}</span>
                <span class="sev-pct">${s.pct}%</span>
                <span class="sev-cost">$${(s.avgCost / 1000).toFixed(0)}K avg cost</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="ia-metrics-summary">
          <div class="ia-metric-card">
            <span class="iam-label">Avg MTTD (Current)</span>
            <span class="iam-value" style="color:#3b82f6">24 min</span>
            <span class="iam-delta" style="color:#10b981">-23% vs prior month</span>
          </div>
          <div class="ia-metric-card">
            <span class="iam-label">Avg MTTR (Current)</span>
            <span class="iam-value" style="color:#8b5cf6">110 min</span>
            <span class="iam-delta" style="color:#10b981">-19% vs prior month</span>
          </div>
          <div class="ia-metric-card">
            <span class="iam-label">Forecast (Next Month)</span>
            <span class="iam-value" style="color:#f59e0b">~25 incidents</span>
            <span class="iam-delta" style="color:#10b981">-11% projected decrease</span>
          </div>
        </div>
      </section>`;
  }

  private _renderGamification() {
    const leaderboard = [
      { rank: 1, name: 'Sarah Chen', dept: 'Engineering', score: 9850, badges: 24, streak: 45, level: 'Platinum Guardian', avatar: 'SC' },
      { rank: 2, name: 'Mike Rodriguez', dept: 'Operations', score: 9420, badges: 21, streak: 38, level: 'Platinum Guardian', avatar: 'MR' },
      { rank: 3, name: 'Aisha Patel', dept: 'Finance', score: 8910, badges: 19, streak: 52, level: 'Gold Defender', avatar: 'AP' },
      { rank: 4, name: 'James Wilson', dept: 'Engineering', score: 8750, badges: 18, streak: 30, level: 'Gold Defender', avatar: 'JW' },
      { rank: 5, name: 'Lisa Kim', dept: 'HR', score: 8320, badges: 17, streak: 28, level: 'Gold Defender', avatar: 'LK' },
      { rank: 6, name: 'David Brown', dept: 'Legal', score: 7890, badges: 15, streak: 22, level: 'Silver Sentinel', avatar: 'DB' },
      { rank: 7, name: 'Emma Zhang', dept: 'Marketing', score: 7650, badges: 14, streak: 19, level: 'Silver Sentinel', avatar: 'EZ' },
      { rank: 8, name: 'Tom Anderson', dept: 'Engineering', score: 7200, badges: 13, streak: 15, level: 'Silver Sentinel', avatar: 'TA' },
    ];
    const achievements = [
      { name: 'Eagle Eye', desc: 'Reported 10 phishing emails', unlocked: 45, total: 120 },
      { name: 'Patch Master', desc: 'All systems patched within SLA', unlocked: 8, total: 8 },
      { name: 'Zero Breach Quarter', desc: 'No security incidents in 90 days', unlocked: 2, total: 4 },
      { name: 'Quiz Champion', desc: 'Scored 100% on monthly quiz', unlocked: 34, total: 120 },
      { name: 'Incident Hero', desc: 'Resolved 5 critical incidents', unlocked: 12, total: 120 },
      { name: 'Social Guardian', desc: 'Completed all social engineering modules', unlocked: 67, total: 120 },
    ];
    const teamScores = [
      { team: 'Engineering', score: 38500, members: 42, avgScore: 917, completion: 94 },
      { team: 'Operations', score: 31200, members: 35, avgScore: 891, completion: 88 },
      { team: 'Finance', score: 22800, members: 28, avgScore: 814, completion: 82 },
      { team: 'Legal', score: 18900, members: 22, avgScore: 859, completion: 91 },
      { team: 'HR', score: 15600, members: 18, avgScore: 867, completion: 85 },
      { team: 'Marketing', score: 12400, members: 15, avgScore: 827, completion: 78 },
    ];
    const rankColors = ['#fbbf24', '#94a3b8', '#cd7f32'];
    return html`
      <section class="gamification">
        <h4>Security Awareness Gamification</h4>
        <div class="gamification-grid">
          <div class="gam-leaderboard">
            <h5>Security Champion Leaderboard</h5>
            ${leaderboard.map(p => html`
              <div class="gam-player" style="border-left:4px solid ${p.rank <= 3 ? rankColors[p.rank - 1] : '#6b7280'}">
                <span class="gam-rank" style="color:${p.rank <= 3 ? rankColors[p.rank - 1] : '#6b7280'}">${p.rank}</span>
                <div class="gam-avatar">${p.avatar}</div>
                <div class="gam-info">
                  <span class="gam-name">${p.name}</span>
                  <span class="gam-dept">${p.dept} | ${p.level}</span>
                </div>
                <div class="gam-stats">
                  <span>${p.score.toLocaleString()} pts</span>
                  <span>${p.badges} badges</span>
                  <span class="gam-streak">${p.streak}d streak</span>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="gam-achievements">
            <h5>Achievement Badges</h5>
            ${achievements.map(a => html`
              <div class="gam-badge-card">
                <div class="badge-info">
                  <span class="badge-name">${a.name}</span>
                  <span class="badge-desc">${a.desc}</span>
                  <div class="badge-progress">
                    <div class="badge-bar"><div class="badge-fill" style="width:${(a.unlocked / a.total) * 100}%"></div></div>
                    <span>${a.unlocked}/${a.total} unlocked</span>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="gam-teams">
            <h5>Team Competition Scores</h5>
            ${teamScores.map(t => html`
              <div class="gam-team-row">
                <span class="gam-team-name">${t.team}</span>
                <span class="gam-team-score">${t.score.toLocaleString()}</span>
                <span class="gam-team-members">${t.members} members</span>
                <span class="gam-team-avg">Avg: ${t.avgScore}</span>
                <div class="gam-team-comp"><div class="gam-team-fill" style="width:${t.completion}%"></div></div>
                <span class="gam-team-pct">${t.completion}%</span>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`;
  }


  private _renderBudgetPlanning() {
    const budgetData = [
      { category: "Personnel & Training", planned: 3839000, actual: 2565000, utilization: 66.8, q1: "27%", q2: "32%", q3: "30%", q4: "22%" },
      { category: "Tooling & Licensing", planned: 3846000, actual: 2578000, utilization: 67.0, q1: "30%", q2: "21%", q3: "25%", q4: "23%" },
      { category: "Infrastructure Security", planned: 3853000, actual: 2591000, utilization: 67.2, q1: "17%", q2: "26%", q3: "20%", q4: "24%" },
      { category: "Compliance & Audit", planned: 3860000, actual: 2604000, utilization: 67.5, q1: "20%", q2: "31%", q3: "31%", q4: "25%" },
      { category: "Incident Response", planned: 3867000, actual: 2617000, utilization: 67.7, q1: "23%", q2: "20%", q3: "26%", q4: "10%" },
      { category: "Third-Party Assessments", planned: 3874000, actual: 2630000, utilization: 67.9, q1: "26%", q2: "25%", q3: "21%", q4: "11%" },
      { category: "Security Awareness", planned: 3881000, actual: 2643000, utilization: 68.1, q1: "29%", q2: "30%", q3: "32%", q4: "12%" },
      { category: "Research & Innovation", planned: 3888000, actual: 2656000, utilization: 68.3, q1: "16%", q2: "35%", q3: "27%", q4: "13%" },
    ];
    const totalBudget = budgetData.reduce((s, d) => s + d.planned, 0);
    const totalSpent = budgetData.reduce((s, d) => s + d.actual, 0);
    const overallUtil = ((totalSpent / totalBudget) * 100).toFixed(1);
    const headcount = [
      { team: "SOC Tier 1", current: 5, target: 7, gap: 2, avgSalary: "126k" },
      { team: "SOC Tier 2", current: 14, target: 6, gap: 1, avgSalary: "155k" },
      { team: "Threat Intel", current: 6, target: 5, gap: 0, avgSalary: "184k" },
      { team: "Red Team", current: 15, target: 4, gap: 5, avgSalary: "102k" },
      { team: "GRC", current: 7, target: 3, gap: 4, avgSalary: "131k" },
      { team: "AppSec", current: 16, target: 22, gap: 3, avgSalary: "160k" },
      { team: "Cloud Sec", current: 8, target: 21, gap: 2, avgSalary: "189k" },
      { team: "Identity & Access", current: 17, target: 20, gap: 1, avgSalary: "107k" },
    ];
    const vendorSpend = [
      { vendor: "CrowdStrike", annual: "738k", contractEnd: "2026-09", renewalRisk: "Low", satisfaction: 5 },
      { vendor: "Palo Alto", annual: "769k", contractEnd: "2026-10", renewalRisk: "Medium", satisfaction: 4 },
      { vendor: "Splunk", annual: "800k", contractEnd: "2026-11", renewalRisk: "High", satisfaction: 3 },
      { vendor: "Qualys", annual: "80k", contractEnd: "2026-12", renewalRisk: "Low", satisfaction: 5 },
      { vendor: "Rapid7", annual: "111k", contractEnd: "2026-01", renewalRisk: "Medium", satisfaction: 4 },
      { vendor: "Mandiant", annual: "142k", contractEnd: "2026-02", renewalRisk: "High", satisfaction: 3 },
      { vendor: "Zscaler", annual: "173k", contractEnd: "2026-03", renewalRisk: "Low", satisfaction: 5 },
      { vendor: "Duo Security", annual: "204k", contractEnd: "2026-04", renewalRisk: "Medium", satisfaction: 4 },
    ];
    const roiProjections = [
      { area: "Threat Detection", investment: "783k", projectedReturn: "2308k", roiMultiple: "2.3x", confidence: 68 },
      { area: "Incident Reduction", investment: "826k", projectedReturn: "2355k", roiMultiple: "2.2x", confidence: 85 },
      { area: "Compliance Savings", investment: "869k", projectedReturn: "2402k", roiMultiple: "2.1x", confidence: 66 },
      { area: "Automation Gains", investment: "111k", projectedReturn: "2449k", roiMultiple: "2.0x", confidence: 83 },
      { area: "Risk Avoidance", investment: "154k", projectedReturn: "2496k", roiMultiple: "1.9x", confidence: 64 },
    ];
    return html`
      <section class="budget-planning">
        <h4>Budget & Resource Planning</h4>
        <div class="budget-overview">
          <div class="budget-card"><span class="blabel">Total Budget</span><span class="bval">${totalBudget.toLocaleString()}</span></div>
          <div class="budget-card"><span class="blabel">Total Spent</span><span class="bval">${totalSpent.toLocaleString()}</span></div>
          <div class="budget-card"><span class="blabel">Utilization</span><span class="bval">${overallUtil}%</span></div>
          <div class="budget-card"><span class="blabel">Remaining</span><span class="bval">${(totalBudget - totalSpent).toLocaleString()}</span></div>
        </div>
        <div class="budget-table">
          <h5>Category Breakdown</h5>
          <div class="bt-header"><span>Category</span><span>Planned</span><span>Actual</span><span>Util</span><span>Q1</span><span>Q2</span><span>Q3</span><span>Q4</span></div>
          ${budgetData.map(b => html`
            <div class="bt-row"><span>${b.category}</span><span>${(b.planned/1000).toFixed(0)}k</span><span>${(b.actual/1000).toFixed(0)}k</span><span>${b.utilization}%</span><span>${b.q1}</span><span>${b.q2}</span><span>${b.q3}</span><span>${b.q4}</span></div>
          `).join("")}
        </div>
        <div class="budget-headcount">
          <h5>Headcount Planning</h5>
          ${headcount.map(h => html`
            <div class="hc-row"><span>${h.team}</span><span>${h.current}/${h.target}</span><span>Gap: ${h.gap}</span><span>${h.avgSalary}</span></div>
          `).join("")}
        </div>
        <div class="budget-vendor">
          <h5>Vendor Spend Analysis</h5>
          ${vendorSpend.map(v => html`
            <div class="vs-row"><span>${v.vendor}</span><span>${v.annual}</span><span>Exp: ${v.contractEnd}</span><span>${v.renewalRisk}</span><span>${v.satisfaction}/5</span></div>
          `).join("")}
        </div>
        <div class="budget-roi">
          <h5>ROI Projections</h5>
          ${roiProjections.map(rp => html`
            <div class="roi-row"><span>${rp.area}</span><span>${rp.investment}</span><span>${rp.projectedReturn}</span><span>${rp.roiMultiple}</span><span>${rp.confidence}% conf</span></div>
          `).join("")}
        </div>
      </section>`;
  }

  private _renderMetricsNormalization() {
    const kpiCatalog = [
      { id: "kpi-1", name: "MTTD", owner: "SOC", unit: "minutes", target: 93, current: 94, benchmark: 98, collection: "auto", frequency: "realtime" },
      { id: "kpi-2", name: "MTTR", owner: "GRC", unit: "%", target: 96, current: 55, benchmark: 75, collection: "semi-auto", frequency: "daily" },
      { id: "kpi-3", name: "MTTC", owner: "AppSec", unit: "score", target: 99, current: 62, benchmark: 86, collection: "manual", frequency: "weekly" },
      { id: "kpi-4", name: "Vuln SLA Compliance", owner: "Cloud Sec", unit: "count", target: 72, current: 69, benchmark: 97, collection: "auto", frequency: "monthly" },
      { id: "kpi-5", name: "Patch Coverage", owner: "Identity", unit: "days", target: 75, current: 76, benchmark: 74, collection: "semi-auto", frequency: "realtime" },
      { id: "kpi-6", name: "Phishing Click Rate", owner: "Threat Intel", unit: "minutes", target: 78, current: 83, benchmark: 85, collection: "manual", frequency: "daily" },
      { id: "kpi-7", name: "Training Completion", owner: "Security Ops", unit: "%", target: 81, current: 90, benchmark: 96, collection: "auto", frequency: "weekly" },
      { id: "kpi-8", name: "Escalation Rate", owner: "Risk Mgmt", unit: "score", target: 84, current: 97, benchmark: 73, collection: "semi-auto", frequency: "monthly" },
      { id: "kpi-9", name: "False Positive Rate", owner: "SOC", unit: "count", target: 87, current: 58, benchmark: 84, collection: "manual", frequency: "realtime" },
      { id: "kpi-10", name: "Threat Intel Actionability", owner: "GRC", unit: "days", target: 90, current: 65, benchmark: 95, collection: "auto", frequency: "daily" },
      { id: "kpi-11", name: "Endpoint Compliance", owner: "AppSec", unit: "minutes", target: 93, current: 72, benchmark: 72, collection: "semi-auto", frequency: "weekly" },
      { id: "kpi-12", name: "Cloud Misconfig Score", owner: "Cloud Sec", unit: "%", target: 96, current: 79, benchmark: 83, collection: "manual", frequency: "monthly" },
      { id: "kpi-13", name: "Identity Anomaly Rate", owner: "Identity", unit: "score", target: 99, current: 86, benchmark: 94, collection: "auto", frequency: "realtime" },
      { id: "kpi-14", name: "DLP Events", owner: "Threat Intel", unit: "count", target: 72, current: 93, benchmark: 71, collection: "semi-auto", frequency: "daily" },
      { id: "kpi-15", name: "Vendor Risk Avg", owner: "Security Ops", unit: "days", target: 75, current: 100, benchmark: 82, collection: "manual", frequency: "weekly" },
      { id: "kpi-16", name: "Compliance Audit Pass Rate", owner: "Risk Mgmt", unit: "minutes", target: 78, current: 61, benchmark: 93, collection: "auto", frequency: "monthly" },
      { id: "kpi-17", name: "Awareness Score", owner: "SOC", unit: "%", target: 81, current: 68, benchmark: 70, collection: "semi-auto", frequency: "realtime" },
      { id: "kpi-18", name: "SOC Utilization", owner: "GRC", unit: "score", target: 84, current: 75, benchmark: 81, collection: "manual", frequency: "daily" },
      { id: "kpi-19", name: "Automation Coverage", owner: "AppSec", unit: "count", target: 87, current: 82, benchmark: 92, collection: "auto", frequency: "weekly" },
      { id: "kpi-20", name: "Risk Register Currency", owner: "Cloud Sec", unit: "days", target: 90, current: 89, benchmark: 69, collection: "semi-auto", frequency: "monthly" },
    ];
    const benchmarkSources = [
      { source: "NIST CSF", mappedKPIs: 8, alignment: 92, lastReview: "2026-06-08", status: "aligned" },
      { source: "CIS Controls v8", mappedKPIs: 3, alignment: 70, lastReview: "2026-01-03", status: "partial" },
      { source: "ISO 27001:2022", mappedKPIs: 4, alignment: 87, lastReview: "2026-02-26", status: "reviewing" },
      { source: "PCI DSS 4.0", mappedKPIs: 5, alignment: 65, lastReview: "2026-03-21", status: "aligned" },
      { source: "SOC 2 Type II", mappedKPIs: 6, alignment: 82, lastReview: "2026-04-16", status: "partial" },
      { source: "MITRE ATT&CK", mappedKPIs: 7, alignment: 60, lastReview: "2026-05-11", status: "reviewing" },
      { source: "SANS Top 20", mappedKPIs: 8, alignment: 77, lastReview: "2026-06-06", status: "aligned" },
      { source: "OWASP Top 10", mappedKPIs: 3, alignment: 94, lastReview: "2026-01-01", status: "partial" },
    ];
    const normalizationRules = [
      { rule: "Time metrics normalized to minutes", appliesTo: 6, exceptions: 2, version: "v3.3" },
      { rule: "Percentage metrics capped at 100", appliesTo: 5, exceptions: 0, version: "v3.0" },
      { rule: "Count metrics use 7-day rolling avg", appliesTo: 4, exceptions: 1, version: "v3.7" },
      { rule: "Score metrics use 0-100 scale", appliesTo: 3, exceptions: 2, version: "v3.4" },
      { rule: "Rate metrics per 1000 events", appliesTo: 7, exceptions: 0, version: "v3.1" },
    ];
    return html`
      <section class="metrics-normalization">
        <h4>Security Metrics Normalization</h4>
        <div class="mn-summary">
          <div class="mn-stat"><span class="blabel">Total KPIs</span><span class="bval">${kpiCatalog.length}</span></div>
          <div class="mn-stat"><span class="blabel">On Target</span><span class="bval">${kpiCatalog.filter(k => k.current >= k.target).length}</span></div>
          <div class="mn-stat"><span class="blabel">Below Target</span><span class="bval">${kpiCatalog.filter(k => k.current < k.target).length}</span></div>
          <div class="mn-stat"><span class="blabel">Auto-Collected</span><span class="bval">${kpiCatalog.filter(k => k.collection === "auto").length}</span></div>
        </div>
        <div class="mn-kpi-table">
          <h5>KPI Definition Catalog</h5>
          <div class="mn-header"><span>KPI</span><span>Owner</span><span>Unit</span><span>Target</span><span>Current</span><span>Benchmark</span><span>Collection</span><span>Freq</span></div>
          ${kpiCatalog.map(k => html`
            <div class="mn-row"><span>${k.name}</span><span>${k.owner}</span><span>${k.unit}</span><span>${k.target}</span><span>${k.current}</span><span>${k.benchmark}</span><span>${k.collection}</span><span>${k.frequency}</span></div>
          `).join("")}
        </div>
        <div class="mn-benchmarks">
          <h5>Industry Benchmark Alignment</h5>
          ${benchmarkSources.map(b => html`
            <div class="bm-row"><span>${b.source}</span><span>${b.mappedKPIs} KPIs</span><span>${b.alignment}%</span><span>${b.lastReview}</span><span>${b.status}</span></div>
          `).join("")}
        </div>
        <div class="mn-rules">
          <h5>Normalization Framework</h5>
          ${normalizationRules.map(n => html`
            <div class="nr-row"><span>${n.rule}</span><span>${n.appliesTo} KPIs</span><span>${n.exceptions} exceptions</span><span>${n.version}</span></div>
          `).join("")}
        </div>
      </section>`;
  }

  private _renderThreatHuntingCampaigns() {
    const campaigns = [
      { id: "HC-1001", name: "Lateral Movement Sweep", status: "active", hypothesis: "H1: Actors using pass-the-hash for lateral movement", leadHunter: "Alice Chen", findings: 27, startDate: "2026-04-28", endDate: null, effectiveness: 41 },
      { id: "HC-1002", name: "Credential Harvesting Hunt", status: "completed", hypothesis: "H2: Actors using web shells for persistence", leadHunter: "Bob Martinez", findings: 30, startDate: "2026-03-11", endDate: "2026-05-17", effectiveness: 60 },
      { id: "HC-1003", name: "Persistence Mechanism Audit", status: "planned", hypothesis: "H3: Actors using scheduled tasks for data theft", leadHunter: "Carol Wu", findings: 33, startDate: "2026-02-22", endDate: null, effectiveness: 79 },
      { id: "HC-1004", name: "C2 Beacon Detection", status: "in-review", hypothesis: "H4: Actors using DNS tunneling for C2 communication", leadHunter: "Dave Kim", findings: 36, startDate: "2026-01-05", endDate: null, effectiveness: 98 },
      { id: "HC-1005", name: "Data Exfiltration Patterns", status: "active", hypothesis: "H5: Actors using encrypted channels for privilege escalation", leadHunter: "Eve Johnson", findings: 39, startDate: "2026-04-16", endDate: null, effectiveness: 58 },
      { id: "HC-1006", name: "Privilege Escalation Scan", status: "completed", hypothesis: "H6: Actors using token impersonation for defense evasion", leadHunter: "Frank Liu", findings: 42, startDate: "2026-03-27", endDate: "2026-06-01", effectiveness: 77 },
      { id: "HC-1007", name: "Supply Chain Implant Hunt", status: "planned", hypothesis: "H7: Actors using poisoned images for initial access", leadHunter: "Grace Park", findings: 45, startDate: "2026-02-10", endDate: null, effectiveness: 96 },
      { id: "HC-1008", name: "Insider Threat Indicators", status: "in-review", hypothesis: "H8: Actors using legitimate tools for credential access", leadHunter: "Hector Silva", findings: 0, startDate: "2026-01-21", endDate: null, effectiveness: 56 },
      { id: "HC-1009", name: "Cloud Metadata Analysis", status: "active", hypothesis: "H9: Actors using API keys for command execution", leadHunter: "Alice Chen", findings: 3, startDate: "2026-04-04", endDate: null, effectiveness: 75 },
      { id: "HC-1010", name: "DNS Tunnel Detection", status: "completed", hypothesis: "H10: Actors using encoded subdomains for exfiltration", leadHunter: "Bob Martinez", findings: 6, startDate: "2026-03-15", endDate: "2026-04-13", effectiveness: 94 },
      { id: "HC-1011", name: "Fileless Malware Search", status: "planned", hypothesis: "H11: Actors using WMI providers for discovery", leadHunter: "Carol Wu", findings: 9, startDate: "2026-02-26", endDate: null, effectiveness: 54 },
      { id: "HC-1012", name: "Zero-Day Exploit Traces", status: "in-review", hypothesis: "H12: Actors using exploit kits for collection", leadHunter: "Dave Kim", findings: 12, startDate: "2026-01-09", endDate: null, effectiveness: 73 },
    ];
    const hunterLeaderboard = [
      { hunter: "Alice Chen", campaigns: 8, findings: 108, highSeverity: 5, avgScore: 86, streak: 4 },
      { hunter: "Bob Martinez", campaigns: 5, findings: 21, highSeverity: 10, avgScore: 79, streak: 5 },
      { hunter: "Carol Wu", campaigns: 15, findings: 50, highSeverity: 15, avgScore: 72, streak: 6 },
      { hunter: "Dave Kim", campaigns: 12, findings: 79, highSeverity: 20, avgScore: 65, streak: 7 },
      { hunter: "Eve Johnson", campaigns: 9, findings: 108, highSeverity: 25, avgScore: 58, streak: 8 },
      { hunter: "Frank Liu", campaigns: 6, findings: 21, highSeverity: 4, avgScore: 95, streak: 1 },
      { hunter: "Grace Park", campaigns: 3, findings: 50, highSeverity: 9, avgScore: 88, streak: 2 },
      { hunter: "Hector Silva", campaigns: 13, findings: 79, highSeverity: 14, avgScore: 81, streak: 3 },
    ];
    const mitreMapping = [
      { tactic: "Initial Access", techniques: 11, campaigns: 4, coverage: 36 },
      { tactic: "Execution", techniques: 10, campaigns: 3, coverage: 87 },
      { tactic: "Persistence", techniques: 9, campaigns: 2, coverage: 67 },
      { tactic: "Privilege Escalation", techniques: 8, campaigns: 1, coverage: 47 },
      { tactic: "Defense Evasion", techniques: 7, campaigns: 6, coverage: 98 },
      { tactic: "Credential Access", techniques: 6, campaigns: 5, coverage: 78 },
      { tactic: "Discovery", techniques: 5, campaigns: 4, coverage: 58 },
      { tactic: "Lateral Movement", techniques: 4, campaigns: 3, coverage: 38 },
      { tactic: "Collection", techniques: 3, campaigns: 2, coverage: 89 },
      { tactic: "Exfiltration", techniques: 2, campaigns: 1, coverage: 69 },
      { tactic: "Command & Control", techniques: 12, campaigns: 6, coverage: 49 },
      { tactic: "Impact", techniques: 11, campaigns: 5, coverage: 100 },
    ];
    return html`
      <section class="threat-hunting-campaigns">
        <h4>Threat Hunting Campaign Manager</h4>
        <div class="th-summary">
          <div class="th-stat"><span class="blabel">Active</span><span class="bval">${campaigns.filter(c => c.status === "active").length}</span></div>
          <div class="th-stat"><span class="blabel">Completed</span><span class="bval">${campaigns.filter(c => c.status === "completed").length}</span></div>
          <div class="th-stat"><span class="blabel">Total Findings</span><span class="bval">${campaigns.reduce((s,c) => s + c.findings, 0)}</span></div>
          <div class="th-stat"><span class="blabel">Avg Effectiveness</span><span class="bval">${(campaigns.reduce((s,c) => s + c.effectiveness, 0) / campaigns.length).toFixed(0)}%</span></div>
        </div>
        <div class="th-campaigns">
          <h5>Campaign Lifecycle</h5>
          ${campaigns.map(c => html`
            <div class="tc-row">
              <span class="tc-id">${c.id}</span><span class="tc-name">${c.name}</span>
              <span class="tc-status">${c.status}</span><span class="tc-hunter">${c.leadHunter}</span>
              <span>${c.findings} findings</span><span>${c.effectiveness}%</span>
              <span>${c.startDate} - ${c.endDate || "In Progress"}</span>
              <div class="tc-hypothesis">${c.hypothesis}</div>
            </div>
          `).join("")}
        </div>
        <div class="th-leaderboard">
          <h5>Hunter Leaderboard</h5>
          ${hunterLeaderboard.sort((a,b) => b.findings - a.findings).map((h,i) => html`
            <div class="hl-row">
              <span class="hl-rank">${i+1}</span><span class="hl-name">${h.hunter}</span>
              <span>${h.campaigns} campaigns</span><span>${h.findings} findings</span>
              <span>${h.highSeverity} high</span><span>Score: ${h.avgScore}</span><span>${h.streak}d streak</span>
            </div>
          `).join("")}
        </div>
        <div class="th-mitre">
          <h5>MITRE ATT&CK Coverage</h5>
          ${mitreMapping.map(m => html`
            <div class="tm-row"><span>${m.tactic}</span><span>${m.techniques} techniques</span><span>${m.campaigns} campaigns</span><span>${m.coverage}%</span></div>
          `).join("")}
        </div>
      </section>`;
  }

  private _renderControlInventory() {
    const controls = [
      { id: "CTL-2001", name: "MFA Enforcement", domain: "Access Control", status: "implemented", effectiveness: 97, lastTest: "2026-04-20", nextReview: "2026-08-20", owner: "SOC", risk: "Low" },
      { id: "CTL-2002", name: "Network Segmentation", domain: "Network Security", status: "partial", effectiveness: 17, lastTest: "2026-03-05", nextReview: "2026-09-11", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2003", name: "EDR Deployment", domain: "Endpoint Protection", status: "planned", effectiveness: 24, lastTest: "2026-02-18", nextReview: "2026-10-02", owner: "IT Ops", risk: "High" },
      { id: "CTL-2004", name: "DLP Policy", domain: "Data Protection", status: "gap", effectiveness: 31, lastTest: "2026-01-03", nextReview: "2026-11-21", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2005", name: "SSO Integration", domain: "Identity Management", status: "implemented", effectiveness: 50, lastTest: "2026-04-16", nextReview: "2026-12-12", owner: "IAM", risk: "Low" },
      { id: "CTL-2006", name: "SAST Pipeline", domain: "Application Security", status: "partial", effectiveness: 45, lastTest: "2026-03-01", nextReview: "2026-05-03", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2007", name: "CSPM Scanning", domain: "Cloud Security", status: "planned", effectiveness: 1, lastTest: "2026-02-14", nextReview: "2026-06-22", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2008", name: "Badge Access", domain: "Physical Security", status: "gap", effectiveness: 8, lastTest: "2026-01-27", nextReview: "2026-07-13", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2009", name: "Least Privilege", domain: "Access Control", status: "implemented", effectiveness: 62, lastTest: "2026-04-12", nextReview: "2026-08-04", owner: "SOC", risk: "Low" },
      { id: "CTL-2010", name: "Firewall Rules", domain: "Network Security", status: "partial", effectiveness: 22, lastTest: "2026-03-25", nextReview: "2026-09-23", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2011", name: "Disk Encryption", domain: "Endpoint Protection", status: "planned", effectiveness: 29, lastTest: "2026-02-10", nextReview: "2026-10-14", owner: "IT Ops", risk: "High" },
      { id: "CTL-2012", name: "Data Classification", domain: "Data Protection", status: "gap", effectiveness: 36, lastTest: "2026-01-23", nextReview: "2026-11-05", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2013", name: "PAM Implementation", domain: "Identity Management", status: "implemented", effectiveness: 74, lastTest: "2026-04-08", nextReview: "2026-12-24", owner: "IAM", risk: "Low" },
      { id: "CTL-2014", name: "DAST Pipeline", domain: "Application Security", status: "partial", effectiveness: 50, lastTest: "2026-03-21", nextReview: "2026-05-15", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2015", name: "IAM Policy Review", domain: "Cloud Security", status: "planned", effectiveness: 6, lastTest: "2026-02-06", nextReview: "2026-06-06", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2016", name: "Visitor Management", domain: "Physical Security", status: "gap", effectiveness: 13, lastTest: "2026-01-19", nextReview: "2026-07-25", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2017", name: "Access Reviews", domain: "Access Control", status: "implemented", effectiveness: 86, lastTest: "2026-04-04", nextReview: "2026-08-16", owner: "SOC", risk: "Low" },
      { id: "CTL-2018", name: "IDS/IPS Tuning", domain: "Network Security", status: "partial", effectiveness: 27, lastTest: "2026-03-17", nextReview: "2026-09-07", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2019", name: "Patch Management", domain: "Endpoint Protection", status: "planned", effectiveness: 34, lastTest: "2026-02-02", nextReview: "2026-10-26", owner: "IT Ops", risk: "High" },
      { id: "CTL-2020", name: "Backup Encryption", domain: "Data Protection", status: "gap", effectiveness: 41, lastTest: "2026-01-15", nextReview: "2026-11-17", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2021", name: "Password Policy", domain: "Identity Management", status: "implemented", effectiveness: 98, lastTest: "2026-04-28", nextReview: "2026-12-08", owner: "IAM", risk: "Low" },
      { id: "CTL-2022", name: "Container Scanning", domain: "Application Security", status: "partial", effectiveness: 4, lastTest: "2026-03-13", nextReview: "2026-05-27", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2023", name: "WAF Configuration", domain: "Cloud Security", status: "planned", effectiveness: 11, lastTest: "2026-02-26", nextReview: "2026-06-18", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2024", name: "CCTV Coverage", domain: "Physical Security", status: "gap", effectiveness: 18, lastTest: "2026-01-11", nextReview: "2026-07-09", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2025", name: "RBAC Enforcement", domain: "Access Control", status: "implemented", effectiveness: 51, lastTest: "2026-04-24", nextReview: "2026-08-28", owner: "SOC", risk: "Low" },
      { id: "CTL-2026", name: "VPN Management", domain: "Network Security", status: "partial", effectiveness: 32, lastTest: "2026-03-09", nextReview: "2026-09-19", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2027", name: "App Whitelisting", domain: "Endpoint Protection", status: "planned", effectiveness: 39, lastTest: "2026-02-22", nextReview: "2026-10-10", owner: "IT Ops", risk: "High" },
      { id: "CTL-2028", name: "Key Management", domain: "Data Protection", status: "gap", effectiveness: 46, lastTest: "2026-01-07", nextReview: "2026-11-01", owner: "Data Gov", risk: "Critical" },
    ];
    const gapAnalysis = [
      { gap: "Insufficient MFA coverage for legacy apps", severity: "High", remediationPlan: "Plan R3001", eta: "2026-Q3", estimatedCost: "175k" },
      { gap: "Missing network micro-segmentation", severity: "Medium", remediationPlan: "Plan R3002", eta: "2026-Q2", estimatedCost: "23k" },
      { gap: "Inconsistent EDR deployment", severity: "Medium", remediationPlan: "Plan R3003", eta: "2026-Q4", estimatedCost: "52k" },
      { gap: "DLP not covering cloud storage", severity: "Low", remediationPlan: "Plan R3004", eta: "2026-Q3", estimatedCost: "81k" },
      { gap: "SSO not integrated with all SaaS", severity: "High", remediationPlan: "Plan R3005", eta: "2026-Q2", estimatedCost: "110k" },
    ];
    return html`
      <section class="control-inventory">
        <h4>Security Control Inventory</h4>
        <div class="ci-summary">
          <div class="ci-stat"><span class="blabel">Total Controls</span><span class="bval">${controls.length}</span></div>
          <div class="ci-stat"><span class="blabel">Implemented</span><span class="bval">${controls.filter(c => c.status === "implemented").length}</span></div>
          <div class="ci-stat"><span class="blabel">Partial</span><span class="bval">${controls.filter(c => c.status === "partial").length}</span></div>
          <div class="ci-stat"><span class="blabel">Gaps</span><span class="bval">${controls.filter(c => c.status === "gap").length}</span></div>
        </div>
        <div class="ci-controls">
          <h5>Control Catalog</h5>
          ${controls.map(c => html`
            <div class="cc-row">
              <span class="cc-id">${c.id}</span><span class="cc-name">${c.name}</span><span>${c.domain}</span>
              <span>${c.status}</span><span>Eff: ${c.effectiveness}%</span><span>Owner: ${c.owner}</span>
              <span>Risk: ${c.risk}</span><span>Tested: ${c.lastTest}</span>
            </div>
          `).join("")}
        </div>
        <div class="ci-gaps">
          <h5>Gap Analysis</h5>
          ${gapAnalysis.map(g => html`
            <div class="ga-row"><span>${g.gap}</span><span>${g.severity}</span><span>${g.remediationPlan}</span><span>ETA: ${g.eta}</span><span>${g.estimatedCost}</span></div>
          `).join("")}
        </div>
      </section>`;
  }

  private _renderIncidentCostTracker() {
    const incidents = [
      { id: "INC-7001", name: "Security Incident 1", severity: "Critical", totalCost: 845000, responseCost: 219700, recoveryCost: 261950, legalCost: 135200, regulatoryCost: 101400, insuranceClaim: 599950, avoidedCost: 304000, date: "2026-04-12" },
      { id: "INC-7002", name: "Security Incident 2", severity: "High", totalCost: 848000, responseCost: 279840, recoveryCost: 178080, legalCost: 110240, regulatoryCost: 59360, insuranceClaim: 0, avoidedCost: 333000, date: "2026-03-21" },
      { id: "INC-7003", name: "Security Incident 3", severity: "Medium", totalCost: 851000, responseCost: 161690, recoveryCost: 272320, legalCost: 85100, regulatoryCost: 110630, insuranceClaim: 561660, avoidedCost: 362000, date: "2026-02-02" },
      { id: "INC-7004", name: "Security Incident 4", severity: "Low", totalCost: 854000, responseCost: 222040, recoveryCost: 187880, legalCost: 59780, regulatoryCost: 68320, insuranceClaim: 0, avoidedCost: 391000, date: "2026-01-11" },
      { id: "INC-7005", name: "Security Incident 5", severity: "Critical", totalCost: 857000, responseCost: 282810, recoveryCost: 282810, legalCost: 171400, regulatoryCost: 119980, insuranceClaim: 522770, avoidedCost: 420000, date: "2026-04-20" },
      { id: "INC-7006", name: "Security Incident 6", severity: "High", totalCost: 860000, responseCost: 163400, recoveryCost: 197800, legalCost: 146200, regulatoryCost: 77400, insuranceClaim: 0, avoidedCost: 449000, date: "2026-03-01" },
      { id: "INC-7007", name: "Security Incident 7", severity: "Medium", totalCost: 863000, responseCost: 224380, recoveryCost: 293420, legalCost: 120820, regulatoryCost: 129450, insuranceClaim: 483280, avoidedCost: 478000, date: "2026-02-10" },
      { id: "INC-7008", name: "Security Incident 8", severity: "Low", totalCost: 866000, responseCost: 285780, recoveryCost: 207840, legalCost: 95260, regulatoryCost: 86600, insuranceClaim: 0, avoidedCost: 11000, date: "2026-01-19" },
      { id: "INC-7009", name: "Security Incident 9", severity: "Critical", totalCost: 869000, responseCost: 165110, recoveryCost: 304150, legalCost: 69520, regulatoryCost: 43450, insuranceClaim: 443190, avoidedCost: 40000, date: "2026-04-28" },
      { id: "INC-7010", name: "Security Incident 10", severity: "High", totalCost: 872000, responseCost: 226720, recoveryCost: 218000, legalCost: 43600, regulatoryCost: 95920, insuranceClaim: 0, avoidedCost: 69000, date: "2026-03-09" },
      { id: "INC-7011", name: "Security Incident 11", severity: "Medium", totalCost: 875000, responseCost: 288750, recoveryCost: 315000, legalCost: 157500, regulatoryCost: 52500, insuranceClaim: 402500, avoidedCost: 98000, date: "2026-02-18" },
      { id: "INC-7012", name: "Security Incident 12", severity: "Low", totalCost: 878000, responseCost: 166820, recoveryCost: 228280, legalCost: 131700, regulatoryCost: 105360, insuranceClaim: 0, avoidedCost: 127000, date: "2026-01-27" },
    ];
    const yearlyTrend = [
      { month: "Jan", incidents: 9, totalCost: "231k", avgCost: "89k", insured: 61 },
      { month: "Feb", incidents: 6, totalCost: "274k", avgCost: "136k", insured: 61 },
      { month: "Mar", incidents: 3, totalCost: "317k", avgCost: "183k", insured: 61 },
      { month: "Apr", incidents: 11, totalCost: "360k", avgCost: "49k", insured: 61 },
      { month: "May", incidents: 8, totalCost: "403k", avgCost: "96k", insured: 61 },
      { month: "Jun", incidents: 5, totalCost: "446k", avgCost: "143k", insured: 61 },
    ];
    const totalCostYtd = incidents.reduce((s, i) => s + i.totalCost, 0);
    const totalAvoided = incidents.reduce((s, i) => s + i.avoidedCost, 0);
    const totalInsured = incidents.reduce((s, i) => s + i.insuranceClaim, 0);
    const projAnnual = totalCostYtd * 3;
    const projAvoided = totalAvoided * 3;
    const projInsured = totalInsured * 3;
    const netExposure = projAnnual - projAvoided - projInsured;
    return html`
      <section class="incident-cost-tracker">
        <h4>Security Incident Cost Tracker</h4>
        <div class="ict-summary">
          <div class="ict-stat"><span class="blabel">Total Incidents</span><span class="bval">${incidents.length}</span></div>
          <div class="ict-stat"><span class="blabel">Total Cost YTD</span><span class="bval">${(totalCostYtd/1e6).toFixed(2)}M</span></div>
          <div class="ict-stat"><span class="blabel">Cost Avoided</span><span class="bval">${(totalAvoided/1e6).toFixed(2)}M</span></div>
          <div class="ict-stat"><span class="blabel">Insurance Claims</span><span class="bval">${(totalInsured/1e6).toFixed(2)}M</span></div>
        </div>
        <div class="ict-breakdown">
          <h5>Cost by Severity</h5>
          ${["Critical","High","Medium","Low"].map(sev => {
            const filtered = incidents.filter(i => i.severity === sev);
            const total = filtered.reduce((s,i) => s + i.totalCost, 0);
            return html`<div class="cb-row"><span>${sev}</span><span>${filtered.length} incidents</span><span>${(total/1000).toFixed(0)}k</span><span>Avg: ${filtered.length ? (total/filtered.length/1000).toFixed(0) : 0}k</span></div>`;
          }).join("")}
        </div>
        <div class="ict-incidents">
          <h5>Incident Cost Breakdown</h5>
          ${incidents.map(inc => html`
            <div class="ic-row">
              <span>${inc.id}</span><span>${inc.name}</span><span>${inc.severity}</span>
              <span>${(inc.totalCost/1000).toFixed(0)}k</span>
              <span>R: ${(inc.responseCost/1000).toFixed(0)}k</span><span>Rec: ${(inc.recoveryCost/1000).toFixed(0)}k</span>
              <span>L: ${(inc.legalCost/1000).toFixed(0)}k</span><span>Reg: ${(inc.regulatoryCost/1000).toFixed(0)}k</span>
              <span>Ins: ${(inc.insuranceClaim/1000).toFixed(0)}k</span><span>${inc.date}</span>
            </div>
          `).join("")}
        </div>
        <div class="ict-trend">
          <h5>Monthly Cost Trending</h5>
          ${yearlyTrend.map(y => html`
            <div class="yt-row"><span>${y.month}</span><span>${y.incidents} incidents</span><span>${y.totalCost}</span><span>Avg: ${y.avgCost}</span><span>Insured: ${y.insured}%</span></div>
          `).join("")}
        </div>
        <div class="ict-projection">
          <h5>Annual Projection</h5>
          <div class="proj-row"><span>Projected Annual Cost</span><span>${(projAnnual/1e6).toFixed(2)}M</span></div>
          <div class="proj-row"><span>Projected Cost Avoided</span><span>${(projAvoided/1e6).toFixed(2)}M</span></div>
          <div class="proj-row"><span>Projected Insurance Recovery</span><span>${(projInsured/1e6).toFixed(2)}M</span></div>
          <div class="proj-row"><span>Net Exposure</span><span>${(netExposure/1e6).toFixed(2)}M</span></div>
        </div>
      </section>`;
  }

  // === Security Risk Transfer Matrix ===
  private _renderRiskTransferMatrix(): TemplateResult {
    const policies = [
      { id: 'CYB-001', name: 'Cyber Liability', carrier: 'Chubb', premium: 285000, limit: 5000000, deductible: 250000, status: 'Active', renewDate: '2026-09-15' },
      { id: 'CYB-002', name: 'D&O Liability', carrier: 'AIG', premium: 175000, limit: 10000000, deductible: 500000, status: 'Active', renewDate: '2026-11-30' },
      { id: 'CYB-003', name: 'E&O Professional', carrier: 'Zurich', premium: 195000, limit: 3000000, deductible: 100000, status: 'Active', renewDate: '2027-02-28' },
      { id: 'CYB-004', name: 'Crime/Fraud', carrier: 'Travelers', premium: 89000, limit: 2000000, deductible: 75000, status: 'Pending', renewDate: '2026-08-01' },
      { id: 'CYB-005', name: 'Business Interruption', carrier: 'Hartford', premium: 142000, limit: 8000000, deductible: 350000, status: 'Active', renewDate: '2026-12-15' },
    ];
    const decisions = [
      { risk: 'Ransomware', category: 'Operational', annualLoss: 1250000, insuranceCost: 85000, transferPct: 80, retainPct: 20, decision: 'Transfer' },
      { risk: 'Data Breach', category: 'Regulatory', annualLoss: 2400000, insuranceCost: 120000, transferPct: 70, retainPct: 30, decision: 'Partial Transfer' },
      { risk: 'Insider Threat', category: 'Personnel', annualLoss: 680000, insuranceCost: 45000, transferPct: 30, retainPct: 70, decision: 'Retain' },
      { risk: 'Third-Party Failure', category: 'Supply Chain', annualLoss: 920000, insuranceCost: 65000, transferPct: 55, retainPct: 45, decision: 'Partial Transfer' },
      { risk: 'DDoS Attack', category: 'Operational', annualLoss: 380000, insuranceCost: 32000, transferPct: 90, retainPct: 10, decision: 'Transfer' },
    ];
    const claims = [
      { id: 'CLM-2025-001', policy: 'CYB-001', date: '2025-03-15', type: 'Ransomware', filed: 850000, approved: 722500, status: 'Paid' },
      { id: 'CLM-2025-002', policy: 'CYB-002', date: '2025-07-22', type: 'Regulatory Fine', filed: 1200000, approved: 1080000, status: 'Paid' },
      { id: 'CLM-2026-001', policy: 'CYB-001', date: '2026-01-10', type: 'Data Breach', filed: 2100000, approved: 0, status: 'Under Review' },
    ];
    const totalPremium = policies.reduce((s, p) => s + p.premium, 0);
    const totalLimit = policies.reduce((s, p) => s + p.limit, 0);
    const totalDeductible = policies.reduce((s, p) => s + p.deductible, 0);
    const deductibleRatio = ((totalDeductible / totalLimit) * 100).toFixed(1);
    const premiumToLimitRatio = ((totalPremium / totalLimit) * 100).toFixed(2);
    return html`
      <section class="risk-transfer-section">
        <h4>Security Risk Transfer Matrix</h4>
        <div class="rt-summary-row">
          <div class="rt-stat"><span class="rt-label">Total Annual Premium</span><span class="rt-value">$${(totalPremium/1e6).toFixed(2)}M</span></div>
          <div class="rt-stat"><span class="rt-label">Aggregate Coverage Limit</span><span class="rt-value">$${(totalLimit/1e6).toFixed(0)}M</span></div>
          <div class="rt-stat"><span class="rt-label">Deductible Ratio</span><span class="rt-value">${deductibleRatio}%</span></div>
          <div class="rt-stat"><span class="rt-label">Premium/Limit Ratio</span><span class="rt-value">${premiumToLimitRatio}%</span></div>
        </div>
        <div class="rt-table-wrap">
          <table class="rt-table">
            <thead><tr><th>Policy ID</th><th>Name</th><th>Carrier</th><th>Premium</th><th>Limit</th><th>Deductible</th><th>Status</th><th>Renewal</th></tr></thead>
            <tbody>${policies.map(p => html`<tr>
              <td>${p.id}</td><td>${p.name}</td><td>${p.carrier}</td>
              <td>$${(p.premium/1e3).toFixed(0)}K</td><td>$${(p.limit/1e6).toFixed(1)}M</td>
              <td>$${(p.deductible/1e3).toFixed(0)}K</td><td class="status-${p.status.toLowerCase()}">${p.status}</td>
              <td>${p.renewDate}</td></tr>`)}</tbody>
          </table>
        </div>
        <h5>Risk Transfer vs Retention Decisions</h5>
        <div class="rt-decision-grid">
          ${decisions.map(d => html`<div class="rt-decision-card">
            <div class="rt-risk-name">${d.risk}</div>
            <div class="rt-category">${d.category}</div>
            <div class="rt-bar-wrap"><div class="rt-bar-transfer" style="width:${d.transferPct}%"></div><div class="rt-bar-retain" style="width:${d.retainPct}%"></div></div>
            <div class="rt-bar-labels"><span>Transfer ${d.transferPct}%</span><span>Retain ${d.retainPct}%</span></div>
            <div class="rt-annual">Annual Loss: $${(d.annualLoss/1e6).toFixed(2)}M | Ins Cost: $${(d.insuranceCost/1e3).toFixed(0)}K</div>
            <div class="rt-decision-badge ${d.decision.toLowerCase().replace(/ /g,'-')}">${d.decision}</div>
          </div>`)}</div>
        </div>
        <h5>Claims History</h5>
        <div class="rt-claims">${claims.map(c => html`<div class="rt-claim-row">
          <span>${c.id}</span><span>${c.policy}</span><span>${c.date}</span><span>${c.type}</span>
          <span>$${(c.filed/1e6).toFixed(2)}M</span><span>$${(c.approved/1e6).toFixed(2)}M</span>
          <span class="claim-${c.status.toLowerCase().replace(/ /g,'-')}">${c.status}</span>
        </div>`)}</div>
      </section>`;
  }

  // === Security Talent Management ===
  private _renderTalentManagement(): TemplateResult {
    const skills = ['Threat Detection', 'Incident Response', 'Forensics', 'Cloud Security', 'AppSec', 'Network Defense', 'GRC', 'Red Team'];
    const members = [
      { name: 'A. Chen', level: [5,4,3,4,3,4,5,2], certs: ['CISSP','GCIA'], training: 92, perf: 4.5, tenure: '6yr' },
      { name: 'B. Silva', level: [3,5,4,3,2,3,3,4], certs: ['CEH','OSCP'], training: 88, perf: 4.2, tenure: '4yr' },
      { name: 'C. Patel', level: [4,3,2,5,4,3,4,2], certs: ['CCSP','AWS-SC'], training: 95, perf: 4.7, tenure: '5yr' },
      { name: 'D. Kim', level: [2,4,5,2,3,4,2,5], certs: ['GCIH','OSCP'], training: 85, perf: 4.3, tenure: '3yr' },
      { name: 'E. Johnson', level: [5,5,4,4,5,3,4,3], certs: ['CISSP','CISM','CCSP'], training: 98, perf: 4.9, tenure: '8yr' },
      { name: 'F. Muller', level: [3,3,3,4,4,5,3,2], certs: ['CEH','CompTIA+'], training: 78, perf: 3.8, tenure: '2yr' },
      { name: 'G. Nakamura', level: [4,4,3,5,3,4,5,3], certs: ['CISSP','GCFA'], training: 91, perf: 4.4, tenure: '5yr' },
      { name: 'H. Williams', level: [2,2,4,3,5,2,2,3], certs: ['AWS-SC','AZ-500'], training: 82, perf: 3.9, tenure: '2yr' },
      { name: 'I. Dubois', level: [5,4,4,3,4,5,4,4], certs: ['CISSP','OSCP','GCIH'], training: 96, perf: 4.8, tenure: '7yr' },
      { name: 'J. Rodriguez', level: [3,3,2,4,3,3,3,2], certs: ['CEH'], training: 75, perf: 3.5, tenure: '1yr' },
      { name: 'K. Zhang', level: [4,5,5,4,3,4,3,5], certs: ['OSCP','GXPN','CRTO'], training: 93, perf: 4.6, tenure: '4yr' },
      { name: 'L. Anderson', level: [3,4,3,3,4,3,4,2], certs: ['CISSP','CISM'], training: 87, perf: 4.1, tenure: '3yr' },
    ];
    const hiringPipeline = [
      { role: 'Sr. Threat Hunter', stage: 'Final Interview', candidates: 3, posted: '2026-03-01', priority: 'Critical' },
      { role: 'Cloud Security Eng', stage: 'Screening', candidates: 12, posted: '2026-04-05', priority: 'High' },
      { role: 'GRC Analyst', stage: 'Offer Extended', candidates: 1, posted: '2026-02-15', priority: 'Medium' },
      { role: 'SOC Analyst L2', stage: 'Technical Assessment', candidates: 5, posted: '2026-04-10', priority: 'High' },
    ];
    const certCount = members.reduce((s, m) => s + m.certs.length, 0);
    const avgTraining = (members.reduce((s, m) => s + m.training, 0) / members.length).toFixed(1);
    const avgPerf = (members.reduce((s, m) => s + m.perf, 0) / members.length).toFixed(1);
    return html`
      <section class="talent-mgmt-section">
        <h4>Security Talent Management</h4>
        <div class="tm-stats-row">
          <div class="tm-stat"><span class="tm-label">Team Size</span><span class="tm-value">${members.length}</span></div>
          <div class="tm-stat"><span class="tm-label">Total Certifications</span><span class="tm-value">${certCount}</span></div>
          <div class="tm-stat"><span class="tm-label">Avg Training Completion</span><span class="tm-value">${avgTraining}%</span></div>
          <div class="tm-stat"><span class="tm-label">Avg Performance Score</span><span class="tm-value">${avgPerf}/5.0</span></div>
        </div>
        <h5>Team Skills Matrix</h5>
        <div class="tm-skills-grid">
          <div class="tm-skills-header"><div class="tm-name-cell"></div>${skills.map(s => html`<div class="tm-skill-cell">${s}</div>`)}</div>
          ${members.map(m => html`<div class="tm-member-row">
            <div class="tm-name-cell">${m.name}<br/><small>${m.certs.join(', ')}</small></div>
            ${m.level.map(l => html`<div class="tm-level-cell level-${l}">${l}</div>`)}
            <div class="tm-meta-cell">${m.training}% | ${m.perf}</div>
          </div>`)}
        </div>
        <h5>Hiring Pipeline</h5>
        <div class="tm-pipeline">${hiringPipeline.map(h => html`<div class="tm-pipe-card">
          <div class="tm-pipe-role">${h.role}</div>
          <div class="tm-pipe-stage">${h.stage}</div>
          <div class="tm-pipe-info"><span>Candidates: ${h.candidates}</span><span>Posted: ${h.posted}</span></div>
          <div class="tm-pipe-priority priority-${h.priority.toLowerCase()}">${h.priority}</div>
        </div>`)}</div>
      </section>`;
  }

  // === Security Vendor Assessment ===
  private _renderVendorAssessment(): TemplateResult {
    const vendors = [
      { name: 'CrowdStrike', category: 'EDR/XDR', score: 92, sla: 99.9, contractEnd: '2027-03-31', tier: 'Tier 1', risk: 'Low', renewalStatus: 'On Track' },
      { name: 'Palo Alto', category: 'Firewall/NGFW', score: 88, sla: 99.95, contractEnd: '2026-12-31', tier: 'Tier 1', risk: 'Low', renewalStatus: 'Review Needed' },
      { name: 'Splunk', category: 'SIEM', score: 85, sla: 99.5, contractEnd: '2027-06-30', tier: 'Tier 1', risk: 'Medium', renewalStatus: 'On Track' },
      { name: 'Duo Security', category: 'MFA', score: 90, sla: 99.99, contractEnd: '2027-01-15', tier: 'Tier 2', risk: 'Low', renewalStatus: 'Auto-Renew' },
      { name: 'Qualys', category: 'Vuln Mgmt', score: 82, sla: 99.5, contractEnd: '2026-09-30', tier: 'Tier 2', risk: 'Medium', renewalStatus: 'Negotiating' },
      { name: 'Rapid7', category: 'Pen Testing', score: 78, sla: 99.0, contractEnd: '2027-02-28', tier: 'Tier 2', risk: 'Medium', renewalStatus: 'On Track' },
      { name: 'KnowBe4', category: 'Security Awareness', score: 75, sla: 99.0, contractEnd: '2026-11-30', tier: 'Tier 3', risk: 'Low', renewalStatus: 'Under Review' },
      { name: 'Darktrace', category: 'AI/ML Detection', score: 80, sla: 99.5, contractEnd: '2027-04-30', tier: 'Tier 2', risk: 'Medium', renewalStatus: 'On Track' },
    ];
    const dependencyMatrix = [
      { critical: 'EDR/XDR', vendors: ['CrowdStrike'], backup: 'SentinelOne (eval)', singlePoint: true },
      { critical: 'SIEM', vendors: ['Splunk'], backup: 'Elastic SIEM (partial)', singlePoint: true },
      { critical: 'Firewall', vendors: ['Palo Alto', 'Fortinet'], backup: 'Internal', singlePoint: false },
      { critical: 'MFA', vendors: ['Duo Security', 'Okta'], backup: 'Microsoft Entra', singlePoint: false },
    ];
    const tierCounts: Record<string, number> = {};
    vendors.forEach(v => { tierCounts[v.tier] = (tierCounts[v.tier] || 0) + 1; });
    const avgSla = (vendors.reduce((s, v) => s + v.sla, 0) / vendors.length).toFixed(2);
    return html`
      <section class="vendor-assess-section">
        <h4>Security Vendor Assessment</h4>
        <div class="va-stats-row">
          <div class="va-stat"><span class="va-label">Total Vendors</span><span class="va-value">${vendors.length}</span></div>
          <div class="va-stat"><span class="va-label">Avg SLA Compliance</span><span class="va-value">${avgSla}%</span></div>
          <div class="va-stat"><span class="va-label">Tier 1</span><span class="va-value">${tierCounts['Tier 1'] || 0}</span></div>
          <div class="va-stat"><span class="va-label">Tier 2</span><span class="va-value">${tierCounts['Tier 2'] || 0}</span></div>
          <div class="va-stat"><span class="va-label">Tier 3</span><span class="va-value">${tierCounts['Tier 3'] || 0}</span></div>
        </div>
        <h5>Vendor Scorecard</h5>
        <div class="va-scorecard-grid">
          ${vendors.map(v => html`<div class="va-vendor-card">
            <div class="va-vendor-name">${v.name}</div>
            <div class="va-vendor-cat">${v.category}</div>
            <div class="va-score-bar"><div class="va-score-fill" style="width:${v.score}%"></div><span>${v.score}</span></div>
            <div class="va-vendor-meta"><span>SLA: ${v.sla}%</span><span>${v.tier}</span><span class="risk-${v.risk.toLowerCase()}">${v.risk}</span></div>
            <div class="va-renewal">${v.renewalStatus}</div>
          </div>`)}
        </div>
        <h5>Vendor Dependency Analysis</h5>
        <div class="va-dep-table">
          <table><thead><tr><th>Critical Function</th><th>Primary Vendor(s)</th><th>Backup</th><th>Single Point?</th></tr></thead>
          <tbody>${dependencyMatrix.map(d => html`<tr>
            <td>${d.critical}</td><td>${d.vendors.join(', ')}</td><td>${d.backup}</td>
            <td class="${d.singlePoint ? 'sp-yes' : 'sp-no'}">${d.singlePoint ? 'Yes - Risk' : 'No'}</td>
          </tr>`)}</tbody></table>
        </div>
      </section>`;
  }

  // === Security Policy Engine ===
  private _renderPolicyEngine(): TemplateResult {
    const policies = [
      { id: 'POL-001', name: 'Acceptable Use Policy', version: '3.2', status: 'Active', compliance: 94, owner: 'CISO', nextReview: '2026-07-15' },
      { id: 'POL-002', name: 'Information Classification', version: '2.8', status: 'Active', compliance: 91, owner: 'CISO', nextReview: '2026-05-20' },
      { id: 'POL-003', name: 'Access Control Policy', version: '4.1', status: 'Active', compliance: 88, owner: 'IAM Lead', nextReview: '2026-08-10' },
      { id: 'POL-004', name: 'Incident Response Plan', version: '5.0', status: 'Under Review', compliance: 82, owner: 'IR Manager', nextReview: '2026-03-01' },
      { id: 'POL-005', name: 'Data Retention Policy', version: '2.3', status: 'Active', compliance: 90, owner: 'DPO', nextReview: '2026-06-05' },
      { id: 'POL-006', name: 'Password Policy', version: '3.5', status: 'Active', compliance: 96, owner: 'IAM Lead', nextReview: '2026-09-01' },
      { id: 'POL-007', name: 'Remote Access Policy', version: '2.1', status: 'Draft', compliance: 75, owner: 'Network Lead', nextReview: '2026-02-15' },
      { id: 'POL-008', name: 'Change Management', version: '3.0', status: 'Active', compliance: 93, owner: 'CISO', nextReview: '2026-07-20' },
      { id: 'POL-009', name: 'Vendor Risk Management', version: '2.5', status: 'Active', compliance: 85, owner: 'Procurement', nextReview: '2026-04-10' },
      { id: 'POL-010', name: 'Encryption Standards', version: '4.0', status: 'Active', compliance: 97, owner: 'Crypto Lead', nextReview: '2026-08-28' },
      { id: 'POL-011', name: 'Cloud Security Policy', version: '2.0', status: 'Under Review', compliance: 78, owner: 'Cloud Lead', nextReview: '2026-01-01' },
      { id: 'POL-012', name: 'Third-Party Access', version: '1.8', status: 'Active', compliance: 87, owner: 'IAM Lead', nextReview: '2026-05-15' },
      { id: 'POL-013', name: 'Security Awareness Training', version: '3.1', status: 'Active', compliance: 92, owner: 'Training Mgr', nextReview: '2026-09-15' },
      { id: 'POL-014', name: 'Disaster Recovery Plan', version: '4.2', status: 'Active', compliance: 89, owner: 'DR Manager', nextReview: '2026-06-20' },
      { id: 'POL-015', name: 'Physical Security Policy', version: '2.4', status: 'Active', compliance: 95, owner: 'Facilities', nextReview: '2026-03-30' },
    ];
    const exceptions = [
      { id: 'EXC-001', policy: 'POL-003', requestor: 'Dev Team', reason: 'Service account needs elevated access', status: 'Approved', expires: '2026-06-30' },
      { id: 'EXC-002', policy: 'POL-006', requestor: 'Legacy System', reason: 'Password complexity incompatible', status: 'Approved', expires: '2026-12-31' },
      { id: 'EXC-003', policy: 'POL-005', requestor: 'Legal Dept', reason: 'Regulatory hold extended retention', status: 'Pending', expires: '2026-09-30' },
    ];
    const avgCompliance = (policies.reduce((s, p) => s + p.compliance, 0) / policies.length).toFixed(1);
    const overdueCount = policies.filter(p => new Date(p.nextReview) < new Date('2026-04-23')).length;
    const activePolicies = policies.filter(p => p.status === 'Active').length;
    return html`
      <section class="policy-engine-section">
        <h4>Security Policy Engine</h4>
        <div class="pe-stats-row">
          <div class="pe-stat"><span class="pe-label">Total Policies</span><span class="pe-value">${policies.length}</span></div>
          <div class="pe-stat"><span class="pe-label">Active</span><span class="pe-value">${activePolicies}</span></div>
          <div class="pe-stat"><span class="pe-label">Avg Compliance</span><span class="pe-value">${avgCompliance}%</span></div>
          <div class="pe-stat"><span class="pe-label">Overdue Reviews</span><span class="pe-value">${overdueCount}</span></div>
          <div class="pe-stat"><span class="pe-label">Open Exceptions</span><span class="pe-value">${exceptions.length}</span></div>
        </div>
        <div class="pe-policy-list">
          ${policies.map(p => html`<div class="pe-policy-row">
            <span class="pe-id">${p.id}</span>
            <span class="pe-name">${p.name}</span>
            <span class="pe-ver">v${p.version}</span>
            <span class="pe-status status-${p.status.toLowerCase().replace(/ /g,'-')}">${p.status}</span>
            <div class="pe-compliance-bar"><div class="pe-comp-fill" style="width:${p.compliance}%"></div><span>${p.compliance}%</span></div>
            <span class="pe-owner">${p.owner}</span>
            <span class="pe-next">Next: ${p.nextReview}</span>
          </div>`)}
        </div>
        <h5>Policy Exceptions</h5>
        <div class="pe-exceptions">${exceptions.map(e => html`<div class="pe-exc-row">
          <span>${e.id}</span><span>${e.policy}</span><span>${e.requestor}</span>
          <span>${e.reason}</span><span class="exc-${e.status.toLowerCase()}">${e.status}</span><span>Exp: ${e.expires}</span>
        </div>`)}</div>
      </section>`;
  }

  // === Security Metrics Dashboard Builder ===
  private _renderMetricsDashboardBuilder(): TemplateResult {
    const widgetTypes = [
      { type: 'line-chart', name: 'Line Chart', desc: 'Time-series trends', category: 'Visualization' },
      { type: 'bar-chart', name: 'Bar Chart', desc: 'Category comparisons', category: 'Visualization' },
      { type: 'pie-chart', name: 'Pie Chart', desc: 'Distribution view', category: 'Visualization' },
      { type: 'heatmap', name: 'Heatmap', desc: 'Density/matrix data', category: 'Visualization' },
      { type: 'kpi-card', name: 'KPI Card', desc: 'Single metric display', category: 'Metric' },
      { type: 'gauge', name: 'Gauge', desc: 'Progress/percentage', category: 'Metric' },
      { type: 'table', name: 'Data Table', desc: 'Tabular data view', category: 'Data' },
      { type: 'timeline', name: 'Timeline', desc: 'Event chronology', category: 'Data' },
      { type: 'status-list', name: 'Status List', desc: 'Item status tracking', category: 'Data' },
      { type: 'counter', name: 'Counter', desc: 'Running totals', category: 'Metric' },
    ];
    const templates = [
      { name: 'Executive Overview', widgets: 6, layout: '2x3 Grid', category: 'C-Suite', shared: 12 },
      { name: 'SOC Daily Ops', widgets: 10, layout: '3x4 Grid', category: 'Operations', shared: 8 },
      { name: 'Compliance Tracker', widgets: 8, layout: '2x4 Grid', category: 'GRC', shared: 5 },
      { name: 'Vulnerability Dashboard', widgets: 7, layout: '3x3 Grid', category: 'Vuln Mgmt', shared: 15 },
      { name: 'Incident Metrics', widgets: 9, layout: '3x3 Grid', category: 'Incident Response', shared: 10 },
    ];
    const dashboardWidgets = [
      { id: 'w1', type: 'kpi-card', title: 'MTTD', row: 1, col: 1, w: 1, data: { value: '4.2min', trend: '-12%' } },
      { id: 'w2', type: 'line-chart', title: 'Alert Volume (30d)', row: 1, col: 2, w: 2, data: { points: 30 } },
      { id: 'w3', type: 'gauge', title: 'Patch Compliance', row: 1, col: 4, w: 1, data: { value: 87 } },
      { id: 'w4', type: 'bar-chart', title: 'Vulns by Severity', row: 2, col: 1, w: 2, data: { categories: 5 } },
      { id: 'w5', type: 'table', title: 'Top 10 Risks', row: 2, col: 3, w: 2, data: { rows: 10 } },
      { id: 'w6', type: 'counter', title: 'Open Incidents', row: 3, col: 1, w: 1, data: { value: 23, delta: -5 } },
    ];
    return html`
      <section class="metrics-builder-section">
        <h4>Security Metrics Dashboard Builder</h4>
        <div class="mb-canvas">
          <div class="mb-canvas-header">
            <span class="mb-canvas-title">Dashboard Editor</span>
            <span class="mb-canvas-info">Widgets: ${dashboardWidgets.length} | Layout: 4x3</span>
          </div>
          <div class="mb-grid">
            ${dashboardWidgets.map(w => html`<div class="mb-widget" style="grid-row:${w.row};grid-column:${w.col}/span ${w.w}">
              <div class="mb-widget-header"><span class="mb-widget-title">${w.title}</span><span class="mb-widget-type">${w.type}</span></div>
              <div class="mb-widget-body">${w.type === 'kpi-card' ? html`<div class="mb-kpi">${w.data.value}<span class="mb-trend">${w.data.trend}</span></div>` :
                w.type === 'gauge' ? html`<div class="mb-gauge"><div class="mb-gauge-fill" style="width:${w.data.value}%"></div><span>${w.data.value}%</span></div>` :
                w.type === 'counter' ? html`<div class="mb-counter">${w.data.value} <span class="mb-delta">${w.data.delta}</span></div>` :
                html`<div class="mb-placeholder">[${w.type}]</div>`}</div>
            </div>`)}
          </div>
        </div>
        <h5>Widget Type Catalog</h5>
        <div class="mb-catalog">${widgetTypes.map(w => html`<div class="mb-catalog-item">
          <div class="mb-ci-type">${w.type}</div>
          <div class="mb-ci-name">${w.name}</div>
          <div class="mb-ci-desc">${w.desc}</div>
          <div class="mb-ci-cat">${w.category}</div>
        </div>`)}</div>
        <h5>Dashboard Templates</h5>
        <div class="mb-templates">${templates.map(t => html`<div class="mb-tpl-card">
          <div class="mb-tpl-name">${t.name}</div>
          <div class="mb-tpl-meta"><span>${t.widgets} widgets</span><span>${t.layout}</span><span>${t.category}</span></div>
          <div class="mb-tpl-shared">Shared with ${t.shared} users</div>
        </div>`)}</div>
      </section>`;
  }

  }


declare global { interface HTMLElementTagNameMap { 'sc-compliance-audit-tracker': ScComplianceAuditTracker; } }
