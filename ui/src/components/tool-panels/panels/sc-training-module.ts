/**
 * sc-training-module - Training Module
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

@customElement('sc-training-module')
export class ScTrainingModule extends LitElement {
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

  @state() private _searchQuery = '';
  @state() private _severityFilter: Severity | 'all' = 'all';
  @state() private _statusFilter: Status | 'all' = 'all';
  @state() private _activeTab: 'overview' | 'details' | 'trends' | 'history' | 'new' = 'overview';
  @state() private _expandedId: string | null = null;
  @state() private _sortField: 'severity' | 'date' | 'title' = 'date';
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
    { id: 'c1', author: 'soc-tier1', timestamp: '2026-04-23 04:00', text: 'Initial assessment started for Training Module finding #1' },
    { id: 'c2', author: 'security-eng', timestamp: '2026-04-23 04:15', text: 'Confirmed this is related to the endpoint detection rule update' },
    { id: 'c3', author: 'manager', timestamp: '2026-04-23 05:00', text: 'Prioritize resolution - potential compliance impact' },
  ];

  private _items: PanelItem[] = [
      {
            "id": "training-module-1",
            "title": "Phishing Awareness 2026",
            "severity": "high",
            "status": "open",
            "category": "Security",
            "source": "SIEM",
            "description": "Duration: 30min | Completion: 82% | Quiz pass rate: 89% | Content: 12 scenarios + 5 quizzes",
            "createdAt": "2026-04-20T00:00:00Z",
            "assignee": "soc-tier1",
            "tags": [
                  "training-module",
                  "security"
            ],
            "priority": "p1",
            "slaMinutes": 15,
            "stepsTaken": [
                  "Initial triage completed",
                  "Source identified",
                  "Notification sent"
            ]
      },
      {
            "id": "training-module-2",
            "title": "Password Security Best Practices",
            "severity": "medium",
            "status": "in-progress",
            "category": "Network",
            "source": "EDR",
            "description": "Duration: 15min | Completion: 95% | Quiz pass rate: 94% | Content: MFA setup + password managers",
            "createdAt": "2026-04-21T03:00:00Z",
            "assignee": "soc-tier2",
            "tags": [
                  "training-module",
                  "security"
            ],
            "priority": "p2",
            "slaMinutes": 30,
            "stepsTaken": [
                  "Initial triage completed",
                  "Source identified",
                  "Notification sent"
            ]
      },
      {
            "id": "training-module-3",
            "title": "Data Handling & Classification",
            "severity": "high",
            "status": "resolved",
            "category": "Access",
            "source": "Scanner",
            "description": "Duration: 25min | Completion: 71% | Quiz pass rate: 85% | Content: Classification levels + handling rules",
            "createdAt": "2026-04-22T06:00:00Z",
            "assignee": "security-eng",
            "tags": [
                  "training-module",
                  "security"
            ],
            "priority": "p3",
            "slaMinutes": 60,
            "stepsTaken": [
                  "Initial triage completed",
                  "Source identified",
                  "Notification sent"
            ]
      },
      {
            "id": "training-module-4",
            "title": "Social Engineering Defense",
            "severity": "medium",
            "status": "open",
            "category": "Compliance",
            "source": "Audit",
            "description": "Duration: 20min | Completion: 45% | Quiz pass rate: N/A | Content: Pretexting, baiting, tailgating",
            "createdAt": "2026-04-23T09:00:00Z",
            "assignee": "compliance",
            "tags": [
                  "training-module",
                  "security"
            ],
            "priority": "p4",
            "slaMinutes": 120,
            "stepsTaken": []
      },
      {
            "id": "training-module-5",
            "title": "Training Module Finding #5",
            "severity": "medium",
            "status": "open",
            "category": "Operations",
            "source": "Manual",
            "description": "Automated training module assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-19T08:00:00Z",
            "assignee": "ops",
            "tags": [
                  "training-module",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 240,
            "stepsTaken": []
      },
      {
            "id": "training-module-6",
            "title": "Training Module Finding #6",
            "severity": "high",
            "status": "open",
            "category": "Security",
            "source": "SIEM",
            "description": "Automated training module assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-20T10:00:00Z",
            "assignee": "soc-tier1",
            "tags": [
                  "training-module",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 15,
            "stepsTaken": []
      },
      {
            "id": "training-module-7",
            "title": "Training Module Finding #7",
            "severity": "low",
            "status": "open",
            "category": "Network",
            "source": "EDR",
            "description": "Automated training module assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-21T12:00:00Z",
            "assignee": "soc-tier2",
            "tags": [
                  "training-module",
                  "automated"
            ],
            "priority": "p3",
            "slaMinutes": 30,
            "stepsTaken": []
      },
      {
            "id": "training-module-8",
            "title": "Training Module Finding #8",
            "severity": "medium",
            "status": "open",
            "category": "Access",
            "source": "Scanner",
            "description": "Automated training module assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-22T14:00:00Z",
            "assignee": "security-eng",
            "tags": [
                  "training-module",
                  "automated"
            ],
            "priority": "p4",
            "slaMinutes": 60,
            "stepsTaken": []
      },
      {
            "id": "training-module-9",
            "title": "Training Module Finding #9",
            "severity": "high",
            "status": "open",
            "category": "Compliance",
            "source": "Audit",
            "description": "Automated training module assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-23T16:00:00Z",
            "assignee": "compliance",
            "tags": [
                  "training-module",
                  "automated"
            ],
            "priority": "p1",
            "slaMinutes": 120,
            "stepsTaken": []
      },
      {
            "id": "training-module-10",
            "title": "Training Module Finding #10",
            "severity": "low",
            "status": "open",
            "category": "Operations",
            "source": "Manual",
            "description": "Automated training module assessment finding detected during routine scan of infrastructure component. Review and remediation recommended.",
            "createdAt": "2026-04-24T18:00:00Z",
            "assignee": "ops",
            "tags": [
                  "training-module",
                  "automated"
            ],
            "priority": "p2",
            "slaMinutes": 240,
            "stepsTaken": []
      }
];

  private _history: HistoryEntry[] = [
    { timestamp: '2026-04-23 04:15', action: 'Auto-correlated', user: 'system', details: 'Grouped related findings from Training Module analysis' },
    { timestamp: '2026-04-23 03:00', action: 'Created', user: 'scanner', details: 'New Training Module finding detected by automated assessment' },
    { timestamp: '2026-04-23 02:30', action: 'Escalated', user: 'soc-tier1', details: 'Escalated critical finding to tier 2 for investigation' },
    { timestamp: '2026-04-23 01:00', action: 'Updated', user: 'soc-tier2', details: 'Added investigation notes and IOC indicators' },
    { timestamp: '2026-04-22 22:00', action: 'Resolved', user: 'security-eng', details: 'Remediation applied and verified for Training Module finding' },
    { timestamp: '2026-04-22 18:00', action: 'Created', user: 'audit', details: 'Compliance audit identified Training Module gap requiring remediation' },
    { timestamp: '2026-04-22 14:00', action: 'Acknowledged', user: 'ops-team', details: 'Operations team acknowledged finding and created remediation task' },
    { timestamp: '2026-04-22 10:00', action: 'Assigned', user: 'manager', details: 'Finding assigned to security engineering team for resolution' },
    { timestamp: '2026-04-21 16:00', action: 'Resolved', user: 'soc-tier1', details: 'False positive confirmed - benign activity flagged by Training Module scan' },
    { timestamp: '2026-04-21 12:00', action: 'Exported', user: 'compliance', details: 'Exported Training Module findings for Q1 compliance report' },
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
    { id: 'wt-1', title: 'Review Training Module finding #1', status: 'active', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T12:00:00Z', priority: 'p1', createdAt: '2026-04-23T00:00:00Z', completedAt: null },
    { id: 'wt-2', title: 'Remediate critical endpoint misconfiguration', status: 'pending', assignee: 'security-eng', blockedBy: ['wt-1'], slaDeadline: '2026-04-23T16:00:00Z', priority: 'p1', createdAt: '2026-04-23T02:00:00Z', completedAt: null },
    { id: 'wt-3', title: 'Update Training Module detection rules', status: 'blocked', assignee: 'soc-tier2', blockedBy: ['wt-2'], slaDeadline: '2026-04-24T00:00:00Z', priority: 'p2', createdAt: '2026-04-23T03:00:00Z', completedAt: null },
    { id: 'wt-4', title: 'Generate compliance report', status: 'pending', assignee: 'compliance', blockedBy: [], slaDeadline: '2026-04-24T08:00:00Z', priority: 'p3', createdAt: '2026-04-23T04:00:00Z', completedAt: null },
    { id: 'wt-5', title: 'Validate remediation for finding #6', status: 'completed', assignee: 'security-eng', blockedBy: [], slaDeadline: '2026-04-23T10:00:00Z', priority: 'p2', createdAt: '2026-04-22T18:00:00Z', completedAt: '2026-04-23T08:00:00Z' },
    { id: 'wt-6', title: 'Notify stakeholders of findings', status: 'completed', assignee: 'manager', blockedBy: [], slaDeadline: '2026-04-23T06:00:00Z', priority: 'p3', createdAt: '2026-04-22T20:00:00Z', completedAt: '2026-04-23T04:00:00Z' },
    { id: 'wt-7', title: 'Schedule follow-up scan', status: 'pending', assignee: 'ops', blockedBy: ['wt-2'], slaDeadline: '2026-04-25T00:00:00Z', priority: 'p4', createdAt: '2026-04-23T05:00:00Z', completedAt: null },
    { id: 'wt-8', title: 'Archive resolved Training Module findings', status: 'failed', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T08:00:00Z', priority: 'p4', createdAt: '2026-04-22T22:00:00Z', completedAt: null },
  ];

private _executionHistory: ExecutionRecord[] = [
    {
      id: 'exec-1', name: 'Training Module Full Assessment Run', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:12:00Z', status: 'success',
      steps: [
        { id: 's1', name: 'Validate Scope', status: 'success', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:00:30Z', duration: 30, output: 'Scope validated: 142 targets' },
        { id: 's2', name: 'Collect Evidence', status: 'success', startedAt: '2026-04-22T10:00:30Z', completedAt: '2026-04-22T10:06:00Z', duration: 330, output: '1,847 events collected from 12 sources' },
        { id: 's3', name: 'Analyze Patterns', status: 'success', startedAt: '2026-04-22T10:06:00Z', completedAt: '2026-04-22T10:10:00Z', duration: 240, output: '23 patterns identified, 7 correlated' },
        { id: 's4', name: 'Generate Report', status: 'success', startedAt: '2026-04-22T10:10:00Z', completedAt: '2026-04-22T10:12:00Z', duration: 120, output: 'Report generated: 10 findings, 3 critical' },
      ],
    },
    {
      id: 'exec-2', name: 'Training Module Delta Scan', startedAt: '2026-04-23T02:00:00Z', completedAt: '2026-04-23T02:05:00Z', status: 'failed',
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
      id: 'exec-' + Date.now(), name: 'Training Module Assessment ' + new Date().toISOString().slice(0, 10), startedAt: new Date().toISOString(), completedAt: null, status: 'running', steps,
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
        ` : html`<div class="empty-state">Click "Run Assessment" to start the Training Module analysis pipeline</div>`}
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
              const a = document.createElement('a'); a.href = url; a.download = 'training-module-config.json'; a.click();
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
          <input class="search-box" type="text" placeholder="Add a comment..." style="min-width:auto;flex:1;" id="training-module-comment-input" />
          <button class="btn primary" @click=${() => {
            const input = this.shadowRoot?.querySelector('#training-module-comment-input') as HTMLInputElement;
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
    const a = document.createElement('a'); a.href = url; a.download = 'sc-training-module-data.json'; a.click();
    URL.revokeObjectURL(url);
  }

  private _exportCSV() {
    const items = this._getFiltered();
    const header = 'ID,Title,Severity,Status,Category,Source,Assignee,Priority,Created\n';
    const rows = items.map(i => `"${i.id}","${i.title}","${i.severity}","${i.status}","${i.category}","${i.source}","${i.assignee}","${i.priority}","${i.createdAt}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'sc-training-module-data.csv'; a.click();
    URL.revokeObjectURL(url);
  }


  // --- Domain Rules Engine ---
  @state() private _tmRules: { id: string; name: string; category: string; severity: Severity; enabled: boolean; lastEval: string; passRate: number }[] = [];
  private _initTmRules() {
    const rules = [
      { id: 'R-001', name: 'Primary Compliance Check', category: 'Core', severity: 'critical' as Severity, enabled: true, lastEval: '2026-04-23T08:00:00Z', passRate: 88 },
      { id: 'R-002', name: 'Secondary Validation', category: 'Operations', severity: 'high' as Severity, enabled: true, lastEval: '2026-04-23T07:30:00Z', passRate: 74 },
      { id: 'R-003', name: 'Tertiary Assessment', category: 'Infrastructure', severity: 'medium' as Severity, enabled: true, lastEval: '2026-04-23T06:00:00Z', passRate: 82 },
      { id: 'R-004', name: 'Quaternary Audit', category: 'Security', severity: 'critical' as Severity, enabled: true, lastEval: '2026-04-23T05:00:00Z', passRate: 65 },
      { id: 'R-005', name: 'Quinary Review', category: 'Governance', severity: 'high' as Severity, enabled: true, lastEval: '2026-04-23T04:00:00Z', passRate: 91 },
      { id: 'R-006', name: 'Senary Inspection', category: 'Access Control', severity: 'medium' as Severity, enabled: false, lastEval: '2026-04-22T20:00:00Z', passRate: 53 },
      { id: 'R-007', name: 'Septenary Check', category: 'Data Protection', severity: 'high' as Severity, enabled: true, lastEval: '2026-04-22T18:00:00Z', passRate: 78 },
      { id: 'R-008', name: 'Octenary Scan', category: 'Network', severity: 'critical' as Severity, enabled: true, lastEval: '2026-04-22T14:00:00Z', passRate: 96 },
    ];
    this._tmRules = rules;
  }
  private _evaluateTmRules(): { passed: number; failed: number; skipped: number; total: number } {
    let passed = 0, failed = 0, skipped = 0;
    this._tmRules.forEach(r => { if (!r.enabled) { skipped++; } else if (r.passRate >= 80) { passed++; } else { failed++; } });
    return { passed, failed, skipped, total: this._tmRules.length };
  }

  // --- CVSS Scoring ---
  @state() private _tmcvssData: { itemId: string; vector: string; base: number; temporal: number; environmental: number; overall: number }[] = [];
  private _initTmCvss() {
    const vectors = ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:A/AC:H/PR:L/UI:R/S:C/C:L/I:L/A:N', 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N', 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:N/I:L/A:N'];
    this._tmcvssData = vectors.map((v, i) => {
      const base = parseFloat((Math.random() * 6 + 3).toFixed(1));
      const temporal = parseFloat((base * (0.7 + Math.random() * 0.3)).toFixed(1));
      const environmental = parseFloat((temporal * (0.8 + Math.random() * 0.2)).toFixed(1));
      return { itemId: 'V-' + String(i + 1).padStart(3, '0'), vector: v, base, temporal, environmental, overall: environmental };
    });
  }

  // --- Anomaly Detection ---
  @state() private _tmanomalies: { id: string; type: string; severity: Severity; description: string; detected: string; confidence: number; affected: string[] }[] = [];
  private _runTmAnomalyDetection() {
    const types = [
      { type: 'Spike in violation rate', severity: 'high' as Severity, desc: 'Detected 280% increase in violations over the last 24 hours', affected: ['Core', 'Operations'] },
      { type: 'SLA breach pattern', severity: 'critical' as Severity, desc: 'Recurring SLA breaches on weekends indicating staffing gaps', affected: ['SLA', 'Staffing'] },
      { type: 'Baseline drift detected', severity: 'medium' as Severity, desc: 'Score drifted 10 points below established baseline over 7 days', affected: ['Metrics', 'Baseline'] },
      { type: 'Unusual escalation volume', severity: 'high' as Severity, desc: 'Escalation rate 2.5x above normal in infrastructure controls', affected: ['Infrastructure', 'Controls'] },
      { type: 'Stale findings accumulation', severity: 'low' as Severity, desc: '18 findings older than 90 days without status change', affected: ['Maintenance'] },
    ];
    this._tmanomalies = types.map((a, i) => ({
      id: 'ANO-' + String(i + 1).padStart(3, '0'), type: a.type, severity: a.severity,
      description: a.desc, detected: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(2)), affected: a.affected,
    }));
  }

  // --- Trend Prediction ---
  @state() private _tmpredictions: { horizon: string; metric: string; current: number; predicted: number; direction: 'up' | 'down' | 'stable'; confidence: number }[] = [];
  private _generateTmPredictions() {
    this._tmpredictions = [
      { horizon: '7 days', metric: 'Compliance Score', current: 78, predicted: 75, direction: 'down' as const, confidence: 0.82 },
      { horizon: '7 days', metric: 'Open Critical Items', current: 12, predicted: 15, direction: 'up' as const, confidence: 0.71 },
      { horizon: '30 days', metric: 'Overall Score', current: 78, predicted: 82, direction: 'up' as const, confidence: 0.64 },
      { horizon: '30 days', metric: 'SLA Rate', current: 88, predicted: 91, direction: 'up' as const, confidence: 0.73 },
      { horizon: '30 days', metric: 'Readiness', current: 72, predicted: 68, direction: 'down' as const, confidence: 0.59 },
      { horizon: '90 days', metric: 'Risk Score', current: 45, predicted: 38, direction: 'down' as const, confidence: 0.51 },
      { horizon: '90 days', metric: 'Maturity Level', current: 3.2, predicted: 3.5, direction: 'up' as const, confidence: 0.47 },
    ];
  }

  // --- Approval Workflow ---
  @state() private _tmApprovals: { id: string; title: string; requester: string; status: 'pending' | 'approved' | 'rejected' | 'expired'; createdAt: string; priority: Priority; type: string }[] = [];
  private _initTmApprovals() {
    this._tmApprovals = [
      { id: 'APR-001', title: 'Emergency exception request for critical finding', requester: 'Alice Chen', status: 'pending', createdAt: '2026-04-23T07:00:00Z', priority: 'p1', type: 'Exception' },
      { id: 'APR-002', title: 'Extend compliance deadline for quarterly audit', requester: 'Bob Martinez', status: 'pending', createdAt: '2026-04-22T18:00:00Z', priority: 'p2', type: 'Extension' },
      { id: 'APR-003', title: 'Disable security control for system migration', requester: 'Carol Wu', status: 'rejected', createdAt: '2026-04-22T14:00:00Z', priority: 'p1', type: 'Policy Change' },
      { id: 'APR-004', title: 'New assessment approval for third-party vendor', requester: 'Dave Kim', status: 'approved', createdAt: '2026-04-21T10:00:00Z', priority: 'p3', type: 'Vendor' },
      { id: 'APR-005', title: 'Network rule change for partner integration', requester: 'Eve Johnson', status: 'expired', createdAt: '2026-04-19T08:00:00Z', priority: 'p2', type: 'Network' },
    ];
  }
  private _approveTmItem(id: string) { const item = this._tmApprovals.find(a => a.id === id); if (item) item.status = 'approved'; this.requestUpdate(); }
  private _rejectTmItem(id: string) { const item = this._tmApprovals.find(a => a.id === id); if (item) item.status = 'rejected'; this.requestUpdate(); }

  // --- Activity Feed ---
  @state() private _tmActivity: { id: string; action: string; user: string; target: string; timestamp: string }[] = [];
  private _initTmActivity() {
    const actions = [
      { action: 'Updated compliance rule R-003', user: 'Alice Chen', target: 'Policy Update' },
      { action: 'Approved exception APR-004', user: 'Bob Martinez', target: 'Vendor Assessment' },
      { action: 'Created new finding F-1024', user: 'Carol Wu', target: 'Cloud Misconfiguration' },
      { action: 'Resolved finding F-0987', user: 'Dave Kim', target: 'Unencrypted Storage' },
      { action: 'Escalated finding F-1015 to P1', user: 'Eve Johnson', target: 'Exposed Credentials' },
      { action: 'Ran automated scan', user: 'System', target: 'Full Infrastructure' },
      { action: 'Updated risk score for asset A-2048', user: 'Alice Chen', target: 'Database Server' },
      { action: 'Rejected policy change request', user: 'Bob Martinez', target: 'Encryption Policy' },
    ];
    this._tmActivity = actions.map((a, i) => ({ id: 'ACT-' + String(i + 1).padStart(3, '0'), ...a, timestamp: new Date(Date.now() - i * 3600000).toISOString() }));
  }

  // --- Notification System ---
  @state() private _tmNotifications: { id: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; read: boolean; timestamp: string }[] = [];
  private _initTmNotifications() {
    this._tmNotifications = [
      { id: 'NTF-001', message: 'Score dropped below threshold', type: 'warning', read: false, timestamp: new Date().toISOString() },
      { id: 'NTF-002', message: '3 items approaching SLA deadline within 24h', type: 'error', read: false, timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: 'NTF-003', message: 'Weekly report generated successfully', type: 'success', read: true, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'NTF-004', message: 'New framework mapped to existing controls', type: 'info', read: true, timestamp: new Date(Date.now() - 14400000).toISOString() },
    ];
  }
  private _markTmNotifRead(id: string) { const n = this._tmNotifications.find(x => x.id === id); if (n) n.read = true; this.requestUpdate(); }

  // --- Panel Configuration ---
  @state() private _tmConfig: { layout: 'compact' | 'default' | 'expanded'; theme: 'dark' | 'midnight' | 'slate'; showAnomalies: boolean; showPredictions: boolean; autoRefresh: boolean; refreshInterval: number } = {
    layout: 'default', theme: 'dark', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60,
  };
  private _tmPresets: { name: string; config: typeof this._tmConfig }[] = [
    { name: 'Analyst View', config: { layout: 'expanded', theme: 'dark', showAnomalies: true, showPredictions: false, autoRefresh: true, refreshInterval: 30 } },
    { name: 'Executive Summary', config: { layout: 'compact', theme: 'slate', showAnomalies: false, showPredictions: true, autoRefresh: false, refreshInterval: 300 } },
    { name: 'Audit Mode', config: { layout: 'expanded', theme: 'midnight', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60 } },
  ];
  private _applyTmPreset(preset: typeof this._tmPresets[0]) { this._tmConfig = { ...preset.config }; this.requestUpdate(); }

  private _renderTmTreemapSVG(): string {
    const categories = [
      { name: 'Critical', value: 28, color: '#ef4444' },
      { name: 'High', value: 22, color: '#f97316' },
      { name: 'Medium', value: 18, color: '#eab308' },
      { name: 'Low', value: 14, color: '#22c55e' },
      { name: 'Info', value: 10, color: '#3b82f6' },
      { name: 'Monitoring', value: 8, color: '#8b5cf6' },
    ];
    const total = categories.reduce((s, c) => s + c.value, 0);
    const w = 480, h = 200;
    let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">';
    let x = 0, rowH = h, rowStart = 0, rowSum = 0;
    for (let i = 0; i < categories.length; i++) {
      const c = categories[i];
      if (rowSum + c.value > total * 0.55 && rowStart < i) {
        const rw = (rowSum / total) * w;
        let ry = 0;
        for (let j = rowStart; j < i; j++) {
          const ch = (categories[j].value / rowSum) * rowH;
          svg += '<rect x="' + x + '" y="' + ry + '" width="' + rw + '" height="' + ch + '" rx="3" fill="' + categories[j].color + '" opacity="0.35" stroke="' + categories[j].color + '" stroke-width="0.5"/>';
          svg += '<text x="' + (x + rw / 2) + '" y="' + (ry + ch / 2) + '" fill="#e2e8f0" font-size="8" text-anchor="middle" dominant-baseline="middle">' + categories[j].name + ' (' + categories[j].value + ')</text>';
          ry += ch;
        }
        x += rw; rowH = h; rowStart = i; rowSum = c.value;
      } else { rowSum += c.value; }
    }
    if (rowStart < categories.length) {
      const rw = w - x; let ry = 0;
      for (let j = rowStart; j < categories.length; j++) {
        const ch = (categories[j].value / rowSum) * rowH;
        svg += '<rect x="' + x + '" y="' + ry + '" width="' + rw + '" height="' + ch + '" rx="3" fill="' + categories[j].color + '" opacity="0.35" stroke="' + categories[j].color + '" stroke-width="0.5"/>';
        svg += '<text x="' + (x + rw / 2) + '" y="' + (ry + ch / 2) + '" fill="#e2e8f0" font-size="8" text-anchor="middle" dominant-baseline="middle">' + categories[j].name + ' (' + categories[j].value + ')</text>';
        ry += ch;
      }
    }
    svg += '</svg>';
    return svg;
  }

  private _renderTmSankeySVG(): string {
    const sources = ['Source A', 'Source B', 'Source C'];
    const targets = ['Target 1', 'Target 2', 'Target 3', 'Target 4'];
    const links: { s: number; t: number; v: number }[] = [
      { s: 0, t: 0, v: 14 }, { s: 0, t: 1, v: 8 }, { s: 0, t: 3, v: 5 },
      { s: 1, t: 1, v: 10 }, { s: 1, t: 2, v: 12 },
      { s: 2, t: 0, v: 6 }, { s: 2, t: 2, v: 9 }, { s: 2, t: 3, v: 7 },
    ];
    const w = 520, h = 180, lx = 20, rx = 400, nodeW = 14;
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];
    const targetH: number[] = targets.map(() => 0);
    links.forEach(l => { targetH[l.t] += l.v; });
    const maxH = Math.max(...targets.map((_, i) => targetH[i]));
    const scaleY = (h - 10) / maxH;
    let svg = '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">';
    sources.forEach((s, i) => { const sy = 10 + i * (h - 10) / sources.length; svg += '<rect x="' + lx + '" y="' + sy + '" width="' + nodeW + '" height="12" rx="2" fill="#6366f1"/>'; svg += '<text x="' + (lx - 2) + '" y="' + (sy + 7) + '" fill="#9ca3af" font-size="7" text-anchor="end">' + s + '</text>'; });
    targets.forEach((t, i) => {
      const ty = (h - targetH[i] * scaleY) / 2;
      svg += '<rect x="' + rx + '" y="' + ty + '" width="' + nodeW + '" height="' + (targetH[i] * scaleY) + '" rx="2" fill="' + colors[i] + '"/>';
      svg += '<text x="' + (rx + nodeW + 3) + '" y="' + (ty + targetH[i] * scaleY / 2) + '" fill="#9ca3af" font-size="7">' + t + '</text>';
    });
    links.forEach(l => {
      const sx = lx + nodeW; const sy = 10 + l.s * (h - 10) / sources.length + 4;
      const tx = rx; const targetOffset = links.filter(ll => ll.t === l.t && ll.s < l.s).reduce((s, ll) => s + ll.v, 0);
      const ty = (h - targetH[l.t] * scaleY) / 2 + targetOffset * scaleY;
      const sw = l.v * 0.6; const tw = l.v * scaleY;
      const mx = (sx + tx) / 2;
      svg += '<path d="M' + sx + ' ' + (sy - sw / 2) + ' C' + mx + ' ' + (sy - sw / 2) + ' ' + mx + ' ' + ty + ' ' + tx + ' ' + ty + '" fill="' + colors[l.t] + '" opacity="0.25"/>';
      svg += '<path d="M' + sx + ' ' + (sy + sw / 2) + ' C' + mx + ' ' + (sy + sw / 2) + ' ' + mx + ' ' + (ty + tw) + ' ' + tx + ' ' + (ty + tw) + '" fill="' + colors[l.t] + '" opacity="0.25"/>';
    });
    svg += '</svg>';
    return svg;
  }

  // --- Render: Rules Engine ---
  private _renderTmRules(): any {
    const ev = this._evaluateTmRules();
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Rules Engine</div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <span class="badge badge-success">$${ev.passed} Passed</span>
          <span class="badge badge-error">$${ev.failed} Failed</span>
          <span class="badge" style="background:#374151">$${ev.skipped} Skipped</span>
          <span class="badge" style="background:#1f2937">$${ev.total} Total</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto">
          $${this._tmRules.map(r => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <span style="width:8px;height:8px;border-radius:50%;background:$${r.passRate >= 80 ? '#22c55e' : '#ef4444'}"></span>
              <span style="flex:1;font-weight:600">$${r.name}</span>
              <span style="color:#9ca3af">$${r.category}</span>
              <span class="badge badge-$${r.severity === 'critical' ? 'error' : r.severity === 'high' ? 'warning' : 'info'}">$${r.severity}</span>
              <span style="font-weight:700;color:$${r.passRate >= 80 ? '#22c55e' : '#ef4444'}">$${r.passRate}%</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Anomaly Panel ---
  private _renderTmAnomalies(): any {
    const sc = (s: Severity) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Anomaly Detection</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._tmanomalies.map(a => html`
            <div style="padding:6px 8px;background:#1f2937;border-radius:4px;border-left:3px solid $${sc(a.severity)}">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span class="badge badge-$${a.severity === 'critical' ? 'error' : a.severity === 'high' ? 'warning' : 'info'}">$${a.severity}</span>
                <span style="font-weight:600;font-size:10px">$${a.type}</span>
                <span style="margin-left:auto;font-size:9px;color:#9ca3af">$${(a.confidence * 100).toFixed(0)}%</span>
              </div>
              <div style="font-size:9px;color:#9ca3af;margin-bottom:3px">$${a.description}</div>
              <div style="display:flex;gap:4px">$${a.affected.map(af => html`<span class="badge" style="background:#374151;font-size:8px">$${af}</span>`)}</div>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Predictions ---
  private _renderTmPredictions(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Trend Predictions</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          $${this._tmpredictions.map(pr => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <span class="badge" style="background:#374151">$${pr.horizon}</span>
              <span style="flex:1">$${pr.metric}</span>
              <span style="color:#9ca3af">$${pr.current}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="$${pr.direction === 'up' ? '#22c55e' : pr.direction === 'down' ? '#ef4444' : '#eab308'}" stroke-width="2"><path d="$${pr.direction === 'up' ? 'M12 19V5M5 12l7-7 7 7' : pr.direction === 'down' ? 'M12 5v14M19 12l-7 7-7-7' : 'M5 12h14'}"/></svg>
              <span style="font-weight:700;color:$${pr.direction === 'up' ? '#22c55e' : pr.direction === 'down' ? '#ef4444' : '#eab308'}">$${pr.predicted}</span>
              <span style="font-size:8px;color:#6b7280">$${(pr.confidence * 100).toFixed(0)}%</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Approvals ---
  private _renderTmApprovals(): any {
    const stc = (s: string) => s === 'pending' ? '#eab308' : s === 'approved' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#6b7280';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Approval Workflow</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._tmApprovals.map(a => html`
            <div style="padding:6px 8px;background:#1f2937;border-radius:4px">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span style="width:8px;height:8px;border-radius:50%;background:$${stc(a.status)}"></span>
                <span style="font-weight:600;font-size:10px;flex:1">$${a.title}</span>
                <span class="badge badge-$${a.priority === 'p1' ? 'error' : a.priority === 'p2' ? 'warning' : 'info'}">$${a.priority}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px;font-size:9px;color:#9ca3af;margin-bottom:3px">
                <span>By $${a.requester}</span><span>Type: $${a.type}</span>
                <span>Status: <span style="color:$${stc(a.status)};text-transform:capitalize">$${a.status}</span></span>
              </div>
              $${a.status === 'pending' ? html`
                <div style="display:flex;gap:4px;margin-top:4px">
                  <button class="btn success" style="padding:2px 8px;font-size:9px" @click=$${() => this._approveTmItem(a.id)}>Approve</button>
                  <button class="btn error" style="padding:2px 8px;font-size:9px" @click=$${() => this._rejectTmItem(a.id)}>Reject</button>
                </div>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Activity Feed ---
  private _renderTmActivity(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Activity Feed</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto">
          $${this._tmActivity.map(a => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <div style="width:20px;height:20px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;font-size:9px">•</div>
              <div style="flex:1"><span style="font-weight:600">$${a.user}</span> $${a.action}</div>
              <span style="font-size:8px;color:#6b7280">$${new Date(a.timestamp).toLocaleTimeString()}</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Notifications ---
  private _renderTmNotifications(): any {
    const tc = (t: string) => t === 'error' ? '#ef4444' : t === 'warning' ? '#eab308' : t === 'success' ? '#22c55e' : '#3b82f6';
    const unread = this._tmNotifications.filter(n => !n.read).length;
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Notifications $${unread > 0 ? html`<span class="badge badge-error">$${unread} new</span>` : nothing}</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:120px;overflow-y:auto">
          $${this._tmNotifications.map(n => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:$${n.read ? '#1f2937' : '#252a36'};border-radius:4px;font-size:10px;opacity:$${n.read ? '0.6' : '1'};cursor:pointer" @click=$${() => this._markTmNotifRead(n.id)}>
              <span style="width:8px;height:8px;border-radius:50%;background:$${tc(n.type)}"></span>
              <span style="flex:1">$${n.message}</span>
              $${!n.read ? html`<span style="width:6px;height:6px;border-radius:50%;background:#3b82f6"></span>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Panel Config ---
  private _renderTmConfig(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Panel Configuration</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Layout</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._tmConfig.layout = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="compact" ?selected=$${this._tmConfig.layout === 'compact'}>Compact</option>
              <option value="default" ?selected=$${this._tmConfig.layout === 'default'}>Default</option>
              <option value="expanded" ?selected=$${this._tmConfig.layout === 'expanded'}>Expanded</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Theme</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._tmConfig.theme = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="dark" ?selected=$${this._tmConfig.theme === 'dark'}>Dark</option>
              <option value="midnight" ?selected=$${this._tmConfig.theme === 'midnight'}>Midnight</option>
              <option value="slate" ?selected=$${this._tmConfig.theme === 'slate'}>Slate</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Auto Refresh</span>
            <input type="checkbox" ?checked=$${this._tmConfig.autoRefresh} @change=$${() => { this._tmConfig.autoRefresh = !this._tmConfig.autoRefresh; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Anomalies</span>
            <input type="checkbox" ?checked=$${this._tmConfig.showAnomalies} @change=$${() => { this._tmConfig.showAnomalies = !this._tmConfig.showAnomalies; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Predictions</span>
            <input type="checkbox" ?checked=$${this._tmConfig.showPredictions} @change=$${() => { this._tmConfig.showPredictions = !this._tmConfig.showPredictions; this.requestUpdate(); }}/>
          </div>
          <div style="margin-top:6px;font-weight:600">Presets</div>
          <div style="display:flex;gap:4px">
            $${this._tmPresets.map(ps => html`<button class="btn" style="padding:2px 8px;font-size:9px" @click=$${() => this._applyTmPreset(ps)}>$${ps.name}</button>`)}
          </div>
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

  // === Extended Security Operations Analytics Module ===
  @state() private _opsAnalyticsConfig = {
    refreshInterval: 30000,
    retentionDays: 90,
    aggregationWindow: '1h',
    anomalyThreshold: 2.5,
    trendWindow: 7,
    baselinePeriod: 30,
  } as any;
  @state() private _opsMetricDefinitions = [
    { id: 'OM-001', name: 'Mean Time To Detect', unit: 'minutes', category: 'incident-response',
      target: 15, current: 22, trend: 'improving', weight: 0.2, source: 'siem' },
    { id: 'OM-002', name: 'Mean Time To Respond', unit: 'minutes', category: 'incident-response',
      target: 30, current: 45, trend: 'stable', weight: 0.15, source: 'ticketing' },
    { id: 'OM-003', name: 'Mean Time To Contain', unit: 'hours', category: 'incident-response',
      target: 2, current: 3.5, trend: 'improving', weight: 0.2, source: 'soar' },
    { id: 'OM-004', name: 'Mean Time To Recover', unit: 'hours', category: 'business-continuity',
      target: 4, current: 6.2, trend: 'stable', weight: 0.15, source: 'monitoring' },
    { id: 'OM-005', name: 'Vulnerability Remediation SLA', unit: 'days', category: 'vulnerability',
      target: 30, current: 42, trend: 'worsening', weight: 0.15, source: 'vuln-mgmt' },
    { id: 'OM-006', name: 'False Positive Rate', unit: 'percent', category: 'detection',
      target: 5, current: 8.3, trend: 'improving', weight: 0.1, source: 'siem' },
    { id: 'OM-007', name: 'Patch Coverage', unit: 'percent', category: 'patching',
      target: 95, current: 88.5, trend: 'improving', weight: 0.05, source: 'endpoint' },
  ] as any[];
  @state() private _opsIncidentCategories = [
    { category: 'Phishing', count: 142, severity: 'medium', mttr: 0.5, trend: -12,
      topIndicators: ['Suspicious sender domain', 'Urgent language', 'Unexpected attachment'] },
    { category: 'Malware', count: 38, severity: 'high', mttr: 4.2, trend: -8,
      topIndicators: ['Unknown executable', 'Lateral movement', 'Data exfiltration attempt'] },
    { category: 'Unauthorized Access', count: 25, severity: 'high', mttr: 2.1, trend: -15,
      topIndicators: ['Anomalous login location', 'Privilege escalation', 'Off-hours access'] },
    { category: 'Data Leak', count: 12, severity: 'critical', mttr: 8.5, trend: -5,
      topIndicators: ['Large data transfer', 'Unusual destination', 'Encrypted traffic spike'] },
    { category: 'DDoS', count: 8, severity: 'high', mttr: 1.2, trend: 3,
      topIndicators: ['Traffic volume spike', 'Request pattern anomaly', 'GeoIP distribution'] },
    { category: 'Insider Threat', count: 5, severity: 'critical', mttr: 24.0, trend: 0,
      topIndicators: ['Access pattern deviation', 'Data access anomaly', 'Policy violation'] },
  ] as any[];
  @state() private _opsResponsePlaybooks = [
    { id: 'PB-001', name: 'Phishing Response', triggers: ['phishing-email-detected'], steps: 12,
      avgExecTime: '15min', successRate: 0.95, lastUsed: '2026-01-22', autoExec: true },
    { id: 'PB-002', name: 'Malware Containment', triggers: ['malware-detected', 'ransomware-suspected'], steps: 18,
      avgExecTime: '45min', successRate: 0.88, lastUsed: '2026-01-20', autoExec: false },
    { id: 'PB-003', name: 'Data Breach Response', triggers: ['data-exfil-detected', 'breach-confirmed'], steps: 25,
      avgExecTime: '4h', successRate: 0.72, lastUsed: '2026-01-15', autoExec: false },
    { id: 'PB-004', name: 'DDoS Mitigation', triggers: ['ddos-attack-detected'], steps: 8,
      avgExecTime: '10min', successRate: 0.92, lastUsed: '2026-01-18', autoExec: true },
    { id: 'PB-005', name: 'Account Compromise', triggers: ['account-takeover', 'credential-leak'], steps: 15,
      avgExecTime: '30min', successRate: 0.90, lastUsed: '2026-01-21', autoExec: true },
  ] as any[];
  @state() private _opsTeamPerformance = [
    { team: 'SOC Tier 1', members: 8, activeAlerts: 15, resolvedToday: 42, avgHandleTime: '12min',
      escalationRate: 0.15, satisfaction: 4.2 },
    { team: 'SOC Tier 2', members: 5, activeAlerts: 8, resolvedToday: 18, avgHandleTime: '45min',
      escalationRate: 0.08, satisfaction: 4.5 },
    { team: 'Threat Hunt', members: 3, activeAlerts: 3, resolvedToday: 5, avgHandleTime: '2h',
      escalationRate: 0.0, satisfaction: 4.7 },
    { team: 'Incident Response', members: 4, activeAlerts: 2, resolvedToday: 3, avgHandleTime: '4h',
      escalationRate: 0.25, satisfaction: 4.3 },
  ] as any[];
  @state() private _opsAutomationMetrics = {
    totalAutomations: 47, activeAutomations: 38, successRate: 0.94, avgExecutionTime: '3.2s',
    timeSavedDaily: '12.5h', errorRate: 0.03, lastFailure: '2026-01-19T08:30:00Z',
    topAutomations: [
      { name: 'Phishing Triage', executions: 1250, timeSaved: '4.2h/day' },
      { name: 'Alert Enrichment', executions: 3800, timeSaved: '3.1h/day' },
      { name: 'IOC Block Propagation', executions: 85, timeSaved: '2.8h/day' },
      { name: 'User Notification', executions: 450, timeSaved: '1.5h/day' },
    ],
  } as any;

  private _calculateOpsHealthScore(): number {
    let score = 0;
    for (const metric of this._opsMetricDefinitions) {
      const ratio = metric.target / metric.current;
      score += ratio * metric.weight * 100;
    }
    return Math.round(Math.min(100, score));
  }

  private _identifyMetricAnomalies(): any[] {
    const anomalies: any[] = [];
    for (const metric of this._opsMetricDefinitions) {
      const deviation = Math.abs(metric.current - metric.target) / metric.target;
      if (deviation > this._opsAnalyticsConfig.anomalyThreshold / 100) {
        anomalies.push({ metric: metric.name, expected: metric.target, actual: metric.current, deviation: Math.round(deviation * 100) });
      }
    }
    return anomalies;
  }

  private _calculateTeamWorkload(team: any): { utilization: number; risk: string } {
    const maxAlertsPerMember = 8;
    const utilization = Math.round((team.activeAlerts / (team.members * maxAlertsPerMember)) * 100);
    const risk = utilization > 90 ? 'overloaded' : utilization > 70 ? 'high' : utilization > 40 ? 'normal' : 'underutilized';
    return { utilization, risk };
  }

  private _predictIncidentVolume(): { nextWeek: number; nextMonth: number; confidence: number } {
    const recentIncidents = this._opsIncidentCategories.reduce((s: number, c: any) => s + c.count, 0);
    const avgWeeklyTrend = this._opsIncidentCategories.reduce((s: number, c: any) => s + c.trend, 0) / this._opsIncidentCategories.length;
    const nextWeek = Math.round(recentIncidents * (1 + avgWeeklyTrend / 100));
    const nextMonth = Math.round(recentIncidents * 4 * (1 + avgWeeklyTrend * 2 / 100));
    return { nextWeek, nextMonth, confidence: Math.round(Math.abs(85 - Math.abs(avgWeeklyTrend) * 5)) };
  }

  private _calculateMTTA(): number {
    const mttMetric = this._opsMetricDefinitions.find(m => m.name === 'Mean Time To Detect');
    return mttMetric ? mttMetric.current : 0;
  }

  private _getTopEscalationReasons(): string[] {
    return ['Insufficient context for triage', 'Multiple systems affected', 'Executive communication required', 'Legal/compliance involvement needed'];
  }

  private _calculateAutomationROI(): { investment: number; savings: number; roi: number } {
    const annualCost = 180000;
    const hourlyRate = 75;
    const dailyHours = 12.5;
    const annualSavings = hourlyRate * dailyHours * 260;
    const roi = Math.round(((annualSavings - annualCost) / annualCost) * 100);
    return { investment: annualCost, savings: annualSavings, roi };
  }

  private _generateOpsDashboardSummary(): { health: number; criticalAlerts: number; automationUptime: number; teamReadiness: string } {
    const health = this._calculateOpsHealthScore();
    const criticalAlerts = this._opsIncidentCategories.filter(c => c.severity === 'critical').reduce((s: number, c: any) => s + c.count, 0);
    const automationUptime = Math.round(this._opsAutomationMetrics.successRate * 100);
    const overloadedTeams = this._opsTeamPerformance.filter(t => this._calculateTeamWorkload(t).risk === 'overloaded').length;
    const teamReadiness = overloadedTeams > 0 ? overloadedTeams + ' team(s) overloaded' : 'All teams operational';
    return { health, criticalAlerts, automationUptime, teamReadiness };
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

  // === Identity & Access Intelligence Module ===
  private _privilegedAccessInventory: Array<{id: string; identity: string; accountType: string; system: string; privilegeLevel: string; lastUsed: string; usageFrequency: string; riskScore: number; certificationStatus: string; sessionCount: number; avgSessionDuration: string}> = [];
  private _accessCertCampaigns: Array<{id: string; name: string; scope: string; totalReviews: number; completed: number; pending: number; overdue: number; deadline: string; owner: string; status: string}> = [];
  private _roleMiningSuggestions: Array<{suggestionId: string; roleName: string; description: string; memberCount: number; permissionCount: number; similarity: number; recommendation: string}> = [];
  private _sodViolations: Array<{violationId: string; user: string; conflictingRoles: string[]; system: string; riskLevel: string; detectedAt: string; status: string; remediation: string}> = [];
  private _accessAnomalies: Array<{anomalyId: string; user: string; behavior: string; baseline: string; observed: string; deviation: string; riskScore: number; timestamp: string; investigated: boolean}> = [];
  private _identityRiskScores: Array<{userId: string; name: string; department: string; riskScore: number; factors: string[]; lastAssessment: string; trend: string}> = [];

  private _initIdentityAccessIntel(): void {
    this._privilegedAccessInventory = [
      {id: 'pa-001', identity: 'admin-john', accountType: 'domain-admin', system: 'Active Directory', privilegeLevel: 'full', lastUsed: '2024-12-16T07:30:00Z', usageFrequency: 'daily', riskScore: 9.2, certificationStatus: 'current', sessionCount: 156, avgSessionDuration: '2.3 hrs'},
      {id: 'pa-002', identity: 'svc-deploy-bot', accountType: 'service-account', system: 'Kubernetes', privilegeLevel: 'cluster-admin', lastUsed: '2024-12-16T06:15:00Z', usageFrequency: 'hourly', riskScore: 8.7, certificationStatus: 'expired', sessionCount: 8923, avgSessionDuration: '0.1 hrs'},
      {id: 'pa-003', identity: 'dba-sarah', accountType: 'database-admin', system: 'Oracle RAC', privilegeLevel: 'sysdba', lastUsed: '2024-12-15T22:00:00Z', usageFrequency: 'weekly', riskScore: 7.8, certificationStatus: 'current', sessionCount: 45, avgSessionDuration: '1.5 hrs'},
      {id: 'pa-004', identity: 'root-prod-web', accountType: 'shared-root', system: 'Linux (prod)', privilegeLevel: 'root', lastUsed: '2024-12-14T03:00:00Z', usageFrequency: 'monthly', riskScore: 9.5, certificationStatus: 'overdue', sessionCount: 12, avgSessionDuration: '0.5 hrs'},
      {id: 'pa-005', identity: 'api-gateway-key', accountType: 'api-key', system: 'API Gateway', privilegeLevel: 'admin', lastUsed: '2024-12-16T08:00:00Z', usageFrequency: 'continuous', riskScore: 6.3, certificationStatus: 'current', sessionCount: 45000, avgSessionDuration: 'N/A'},
      {id: 'pa-006', identity: 'cloud-admin-alice', accountType: 'cloud-admin', system: 'AWS', privilegeLevel: 'full', lastUsed: '2024-12-16T09:00:00Z', usageFrequency: 'daily', riskScore: 8.9, certificationStatus: 'current', sessionCount: 234, avgSessionDuration: '3.1 hrs'},
    ];
    this._accessCertCampaigns = [
      {id: 'cert-001', name: 'Q4 2024 Privileged Access Review', scope: 'All Domain Admins', totalReviews: 24, completed: 15, pending: 7, overdue: 2, deadline: '2024-12-20', owner: 'IAM Team', status: 'in-progress'},
      {id: 'cert-002', name: 'Annual Service Account Cleanup', scope: 'All Service Accounts', totalReviews: 156, completed: 89, pending: 45, overdue: 22, deadline: '2024-12-31', owner: 'Platform Team', status: 'in-progress'},
      {id: 'cert-003', name: 'Cloud IAM Permissions Audit', scope: 'AWS/Azure/GCP Admins', totalReviews: 42, completed: 42, pending: 0, overdue: 0, deadline: '2024-12-15', owner: 'Cloud Security', status: 'completed'},
      {id: 'cert-004', name: 'Database Admin Access Review', scope: 'All DBA Accounts', totalReviews: 18, completed: 12, pending: 4, overdue: 2, deadline: '2024-12-18', owner: 'DBA Team', status: 'in-progress'},
    ];
    this._roleMiningSuggestions = [
      {suggestionId: 'rm-001', roleName: 'Junior Developer', description: 'Users with identical read-only access to dev repos and staging environments', memberCount: 15, permissionCount: 8, similarity: 0.94, recommendation: 'Create formal role to reduce permission sprawl'},
      {suggestionId: 'rm-002', roleName: 'Finance Read-Only', description: 'Finance team members with identical read access to financial systems', memberCount: 22, permissionCount: 12, similarity: 0.91, recommendation: 'Consolidate into single role with MFA requirement'},
      {suggestionId: 'rm-003', roleName: 'Contractor Limited', description: 'Contractors with similar restricted access patterns', memberCount: 8, permissionCount: 5, similarity: 0.88, recommendation: 'Create time-limited role with auto-expiration'},
      {suggestionId: 'rm-004', roleName: 'Incident Responder', description: 'Security team members with overlapping IR tool access', memberCount: 6, permissionCount: 15, similarity: 0.85, recommendation: 'Formalize IR role with just-in-time elevation'},
    ];
    this._sodViolations = [
      {violationId: 'sod-001', user: 'john.smith', conflictingRoles: ['procurement-approver', 'vendor-admin'], system: 'ERP', riskLevel: 'high', detectedAt: '2024-12-10T14:00:00Z', status: 'remediation-in-progress', remediation: 'Remove vendor-admin role, assign to separate user'},
      {violationId: 'sod-002', user: 'jane.doe', conflictingRoles: ['code-reviewer', 'deploy-approver'], system: 'CI/CD', riskLevel: 'medium', detectedAt: '2024-12-08T09:30:00Z', status: 'accepted-risk', remediation: 'Documented exception - team size constraint'},
      {violationId: 'sod-003', user: 'bob.wilson', conflictingRoles: ['auditor', 'sysadmin'], system: 'Active Directory', riskLevel: 'critical', detectedAt: '2024-12-05T11:00:00Z', status: 'remediated', remediation: 'Removed sysadmin role, assigned to IT ops'},
    ];
    this._accessAnomalies = [
      {anomalyId: 'anom-001', user: 'alice.johnson', behavior: 'Off-hours VPN access from unusual location', baseline: 'Business hours, office IP', observed: '03:00 AM, foreign IP (Russia)', deviation: 'High', riskScore: 8.9, timestamp: '2024-12-16T03:00:00Z', investigated: false},
      {anomalyId: 'anom-002', user: 'charlie.brown', behavior: 'Mass file download from SharePoint', baseline: '50 files/day avg', observed: '2,340 files in 1 hour', deviation: 'Extreme', riskScore: 9.5, timestamp: '2024-12-15T14:30:00Z', investigated: true},
      {anomalyId: 'anom-003', user: 'diana.ross', behavior: 'Privilege escalation attempt on production DB', baseline: 'Read-only queries', observed: 'GRANT statement execution', deviation: 'Critical', riskScore: 10.0, timestamp: '2024-12-15T16:00:00Z', investigated: true},
      {anomalyId: 'anom-004', user: 'eve.davis', behavior: 'Multiple failed MFA attempts followed by success', baseline: '<3 failures/month', observed: '12 failures then success', deviation: 'High', riskScore: 7.8, timestamp: '2024-12-14T22:15:00Z', investigated: false},
      {anomalyId: 'anom-005', user: 'frank.miller', behavior: 'Access to sensitive folder never accessed before', baseline: 'No access in 2 years', observed: 'Full folder browse + download', deviation: 'Medium', riskScore: 6.5, timestamp: '2024-12-14T10:00:00Z', investigated: false},
    ];
    this._identityRiskScores = [
      {userId: 'usr-001', name: 'Alice Johnson', department: 'Engineering', riskScore: 8.9, factors: ['Off-hours access', 'Unusual location', 'New device'], lastAssessment: '2024-12-16', trend: 'increasing'},
      {userId: 'usr-002', name: 'Charlie Brown', department: 'Marketing', riskScore: 9.5, factors: ['Mass download', 'Data exfiltration indicator', 'Policy violation'], lastAssessment: '2024-12-15', trend: 'increasing'},
      {userId: 'usr-003', name: 'Diana Ross', department: 'DBA Team', riskScore: 10.0, factors: ['Privilege escalation', 'Unauthorized access attempt', 'Critical system'], lastAssessment: '2024-12-15', trend: 'critical'},
      {userId: 'usr-004', name: 'Bob Wilson', department: 'IT Ops', riskScore: 3.2, factors: ['SOD violation (remediated)'], lastAssessment: '2024-12-05', trend: 'stable'},
      {userId: 'usr-005', name: 'Eve Davis', department: 'Sales', riskScore: 7.8, factors: ['MFA fatigue attack indicator', 'Credential stuffing pattern'], lastAssessment: '2024-12-14', trend: 'increasing'},
      {userId: 'usr-006', name: 'Frank Miller', department: 'HR', riskScore: 6.5, factors: ['Access to sensitive data', 'First-time access pattern'], lastAssessment: '2024-12-14', trend: 'stable'},
    ];
  }

  private _renderPrivilegedAccess(): ReturnType<typeof html> {
    return html`
      <div class="privileged-access-section">
        <div class="section-header">
          <h4>Privileged Access Inventory</h4>
          <span class="badge warning">${this._privilegedAccessInventory.filter(p => p.certificationStatus !== 'current').length} Need Review</span>
        </div>
        <div class="pa-grid">
          ${this._privilegedAccessInventory.sort((a, b) => b.riskScore - a.riskScore).map(p => html`
            <div class="pa-card cert-${p.certificationStatus}">
              <div class="pa-header">
                <span class="pa-identity">${p.identity}</span>
                <span class="pa-risk">${p.riskScore.toFixed(1)}</span>
              </div>
              <div class="pa-details">
                <span>Type: ${p.accountType}</span>
                <span>System: ${p.system}</span>
                <span>Level: ${p.privilegeLevel}</span>
              </div>
              <div class="pa-usage">
                <span>Last: ${p.lastUsed}</span>
                <span>Freq: ${p.usageFrequency}</span>
                <span>Sessions: ${p.sessionCount}</span>
              </div>
              <div class="pa-cert">
                <span class="cert-status ${p.certificationStatus}">${p.certificationStatus}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderCertCampaigns(): ReturnType<typeof html> {
    return html`
      <div class="cert-campaigns-section">
        <div class="section-header">
          <h4>Access Certification Campaigns</h4>
        </div>
        <div class="campaigns-list">
          ${this._accessCertCampaigns.map(c => html`
            <div class="campaign-card status-${c.status}">
              <div class="campaign-header">
                <span class="campaign-name">${c.name}</span>
                <span class="campaign-status">${c.status}</span>
              </div>
              <div class="campaign-progress">
                <div class="progress-bar"><div class="progress-fill" style="width: ${(c.completed / c.totalReviews * 100).toFixed(0)}%"></div></div>
                <span class="progress-text">${c.completed}/${c.totalReviews} reviews</span>
              </div>
              <div class="campaign-details">
                <span>Scope: ${c.scope}</span>
                <span>Pending: ${c.pending}</span>
                <span>Overdue: ${c.overdue}</span>
                <span>Deadline: ${c.deadline}</span>
                <span>Owner: ${c.owner}</span>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderRoleMining(): ReturnType<typeof html> {
    return html`
      <div class="role-mining-section">
        <div class="section-header">
          <h4>Role Mining Suggestions</h4>
        </div>
        <div class="mining-grid">
          ${this._roleMiningSuggestions.sort((a, b) => b.similarity - a.similarity).map(r => html`
            <div class="mining-card">
              <div class="mining-header">
                <span class="mining-role">${r.roleName}</span>
                <span class="mining-similarity">${(r.similarity * 100).toFixed(0)}% match</span>
              </div>
              <p class="mining-desc">${r.description}</p>
              <div class="mining-stats">
                <span>Members: ${r.memberCount}</span>
                <span>Permissions: ${r.permissionCount}</span>
              </div>
              <div class="mining-recommendation">${r.recommendation}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderSodViolations(): ReturnType<typeof html> {
    return html`
      <div class="sod-violations-section">
        <div class="section-header">
          <h4>Separation of Duties Violations</h4>
        </div>
        <div class="sod-list">
          ${this._sodViolations.sort((a, b) => {
            const order = {critical: 0, high: 1, medium: 2};
            return (order[a.riskLevel] ?? 3) - (order[b.riskLevel] ?? 3);
          }).map(v => html`
            <div class="sod-card risk-${v.riskLevel}">
              <div class="sod-header">
                <span class="sod-user">${v.user}</span>
                <span class="sod-risk">${v.riskLevel}</span>
                <span class="sod-status">${v.status}</span>
              </div>
              <div class="sod-details">
                <span>System: ${v.system}</span>
                <span>Conflicting: ${v.conflictingRoles.join(' + ')}</span>
                <span>Detected: ${v.detectedAt}</span>
              </div>
              <div class="sod-remediation">${v.remediation}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderAccessAnomalies(): ReturnType<typeof html> {
    return html`
      <div class="access-anomalies-section">
        <div class="section-header">
          <h4>Access Pattern Anomalies</h4>
          <span class="badge warning">${this._accessAnomalies.filter(a => !a.investigated).length} Uninvestigated</span>
        </div>
        <div class="anomaly-list">
          ${this._accessAnomalies.sort((a, b) => b.riskScore - a.riskScore).map(a => html`
            <div class="anomaly-card ${a.investigated ? 'investigated' : 'pending'}">
              <div class="anomaly-header">
                <span class="anomaly-user">${a.user}</span>
                <span class="anomaly-risk">${a.riskScore.toFixed(1)}</span>
                <span class="anomaly-status">${a.investigated ? 'Investigated' : 'Pending'}</span>
              </div>
              <p class="anomaly-behavior">${a.behavior}</p>
              <div class="anomaly-comparison">
                <span>Baseline: ${a.baseline}</span>
                <span>Observed: ${a.observed}</span>
                <span>Deviation: ${a.deviation}</span>
              </div>
              <div class="anomaly-time">${a.timestamp}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  private _renderIdentityRiskScores(): ReturnType<typeof html> {
    return html`
      <div class="identity-risk-section">
        <div class="section-header">
          <h4>Identity Risk Scoring</h4>
        </div>
        <div class="risk-grid">
          ${this._identityRiskScores.sort((a, b) => b.riskScore - a.riskScore).map(u => html`
            <div class="risk-card trend-${u.trend}">
              <div class="risk-header">
                <span class="risk-name">${u.name}</span>
                <span class="risk-score">${u.riskScore.toFixed(1)}</span>
                <span class="risk-trend ${u.trend}">${u.trend === 'increasing' ? '\u2191' : u.trend === 'critical' ? '\u26A0' : '\u2192'}</span>
              </div>
              <div class="risk-details">
                <span>Department: ${u.department}</span>
                <span>Last Assessment: ${u.lastAssessment}</span>
              </div>
              <div class="risk-factors">
                ${u.factors.map(f => html`<span class="factor-tag">${f}</span>`)}
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





  // === Network Segmentation Validator Block ===
  @state() private _trainingModuZones: Array<{id:string;name:string;trustLevel:number;subnet:string;devices:number;policy:string;lastAudit:string}> = [
    {id:"Z01",name:"DMZ",trustLevel:1,subnet:"10.0.1.0/24",devices:23,policy:"Deny All Inbound",lastAudit:"2026-04-20"},
    {id:"Z02",name:"Corporate LAN",trustLevel:3,subnet:"10.0.2.0/22",devices:456,policy:"Allow Internal",lastAudit:"2026-04-18"},
    {id:"Z03",name:"Data Center Core",trustLevel:5,subnet:"10.0.10.0/24",devices:89,policy:"Restricted Access",lastAudit:"2026-04-22"},
    {id:"Z04",name:"IoT Network",trustLevel:1,subnet:"10.0.20.0/24",devices:312,policy:"Deny All Internet",lastAudit:"2026-04-15"},
    {id:"Z05",name:"Development",trustLevel:2,subnet:"10.0.30.0/24",devices:67,policy:"Sandbox Rules",lastAudit:"2026-04-19"},
    {id:"Z06",name:"Management Plane",trustLevel:5,subnet:"10.0.99.0/24",devices:12,policy:"MFA Required",lastAudit:"2026-04-21"},
  ];
  @state() private _trainingModuSegRules: Array<{id:string;source:string;dest:string;action:string;protocol:string;port:string;status:string;hits:number}> = [
    {id:"SR01",source:"DMZ",dest:"Corporate LAN",action:"DENY",protocol:"TCP",port:"*",status:"Active",hits:14523},
    {id:"SR02",source:"Corporate LAN",dest:"Data Center Core",action:"ALLOW",protocol:"TCP",port:"443,8443",status:"Active",hits:89234},
    {id:"SR03",source:"IoT Network",dest:"Internet",action:"DENY",protocol:"*",port:"*",status:"Active",hits:234567},
    {id:"SR04",source:"Development",dest:"Corporate LAN",action:"DENY",protocol:"*",port:"*",status:"Active",hits:789},
    {id:"SR05",source:"Corporate LAN",dest:"Management Plane",action:"ALLOW",protocol:"TCP",port:"22,443",status:"Active",hits:3456},
  ];
  @state() private _trainingModuCrossZoneTraffic: Array<{source:string;dest:string;bytes:number;sessions:number;violations:number}> = [
    {source:"DMZ",dest:"Corporate LAN",bytes:4567890,sessions:234,violations:12},
    {source:"Corporate LAN",dest:"Data Center Core",bytes:123456789,sessions:5678,violations:3},
    {source:"IoT Network",dest:"Corporate LAN",bytes:890123,sessions:89,violations:45},
    {source:"Development",dest:"Internet",bytes:67890123,sessions:3456,violations:0},
  ];
  @state() private _trainingModuMicroSegGaps: Array<{id:string;zone:string;gapType:string;severity:string;recommendation:string}> = [
    {id:"MSG01",zone:"IoT Network",gapType:"Missing East-West Controls",severity:"High",recommendation:"Implement micro-segmentation with service mesh"},
    {id:"MSG02",zone:"Corporate LAN",gapType:"Flat Network Subnet",severity:"Critical",recommendation:"Split into VLANs by department"},
    {id:"MSG03",zone:"Development",gapType:"No Egress Filtering",severity:"Medium",recommendation:"Deploy proxy-based egress controls"},
  ];
  private _renderTrainingmoduNetworkSeg(): TemplateResult {
    const zones = this._trainingModuZones;
    const gaps = this._trainingModuMicroSegGaps;
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

  // === Security Event Correlation Block ===
  @state() private _trainingModuCorrRules: Array<{id:string;name:string;sources:string[];logic:string;severity:string;active:boolean;lastTriggered:string}> = [
    {id:"CR01",name:"Brute Force Detection",sources:["AD","Firewall","SIEM"],logic:"5 failed logins + firewall block within 10min",severity:"High",active:true,lastTriggered:"2026-04-22T08:30:00Z"},
    {id:"CR02",name:"Data Exfiltration Pattern",sources:["DLP","Proxy","DNS"],logic:"Large upload + DNS tunneling indicators",severity:"Critical",active:true,lastTriggered:"2026-04-21T14:22:00Z"},
    {id:"CR03",name:"Lateral Movement Detection",sources:["EDR","AD","Network"],logic:"New admin session + unusual SMB traffic",severity:"High",active:true,lastTriggered:"2026-04-20T11:15:00Z"},
    {id:"CR04",name:"Malware Beacon Detection",sources:["DNS","Proxy","EDR"],logic:"Periodic DNS queries + known C2 patterns",severity:"Critical",active:true,lastTriggered:"2026-04-22T06:45:00Z"},
  ];
  @state() private _trainingModuEventTimeline: Array<{timestamp:string;source:string;eventType:string;details:string;correlated:boolean}> = [
    {timestamp:"2026-04-22T10:34:12Z",source:"EDR",eventType:"Process Injection",details:"cmd.exe spawned from powershell",correlated:true},
    {timestamp:"2026-04-22T10:33:58Z",source:"AD",eventType:"Anomalous Login",details:"Service account used from new IP",correlated:true},
    {timestamp:"2026-04-22T10:32:01Z",source:"Firewall",eventType:"Port Scan",details:"192.168.1.45 scanning 10.0.0.0/8",correlated:false},
    {timestamp:"2026-04-22T10:30:45Z",source:"DLP",eventType:"Data Transfer",details:"10MB zip uploaded to external share",correlated:true},
    {timestamp:"2026-04-22T10:28:33Z",source:"DNS",eventType:"Suspicious Query",details:"Query to known malicious domain",correlated:true},
  ];
  @state() private _trainingModuFalsePosMetrics: {totalEvents:number;correlatedEvents:number;falsePositives:number;fpRate:number;topFpRules:string[]} = {
    totalEvents: 45230, correlatedEvents: 3847, falsePositives: 892, fpRate: 0.232,
    topFpRules: ["Port Scan Detection", "Anomalous Login Location", "Large File Download"]
  };
  @state() private _trainingModuEventPatterns: Array<{id:string;pattern:string;frequency:number;firstSeen:string;lastSeen:string;status:string}> = [
    {id:"EP01",pattern:"Credential stuffing from Tor exit nodes",frequency:23,firstSeen:"2026-03-15",lastSeen:"2026-04-22",status:"Active"},
    {id:"EP02",pattern:"DNS tunneling via TXT records",frequency:8,firstSeen:"2026-04-01",lastSeen:"2026-04-20",status:"Monitoring"},
    {id:"EP03",pattern:"Scheduled task persistence mechanism",frequency:3,firstSeen:"2026-04-10",lastSeen:"2026-04-18",status:"Investigating"},
  ];
  private _renderTrainingmoduEventCorr(): TemplateResult {
    const rules = this._trainingModuCorrRules;
    const timeline = this._trainingModuEventTimeline;
    const fpMetrics = this._trainingModuFalsePosMetrics;
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

  // === Cloud Workload Protection Block ===
  @state() private _trainingModuContainerScans: Array<{image:string;registry:string;critical:number;high:number;medium:number;scanDate:string;status:string}> = [
    {image:"nginx:1.25",registry:"docker.io",critical:2,high:5,medium:12,scanDate:"2026-04-22",status:"Vulnerable"},
    {image:"postgres:16",registry:"ghcr.io",critical:0,high:1,medium:3,scanDate:"2026-04-22",status:"Clean"},
    {image:"redis:7.2",registry:"docker.io",critical:1,high:3,medium:8,scanDate:"2026-04-21",status:"Vulnerable"},
    {image:"app-server:v2.3",registry:"ecr.aws",critical:0,high:0,medium:2,scanDate:"2026-04-22",status:"Clean"},
    {image:"sidecar-proxy:v1.8",registry:"gcr.io",critical:3,high:7,medium:15,scanDate:"2026-04-20",status:"Critical"},
  ];
  @state() private _trainingModuK8sPods: Array<{namespace:string;pod:string;securityContext:string;hostIPC:boolean;hostPID:boolean;privileged:boolean;riskLevel:string}> = [
    {namespace:"production",pod:"web-frontend-7d9f8",securityContext:"Restricted",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Low"},
    {namespace:"production",pod:"api-gateway-4b2c1",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
    {namespace:"staging",pod:"db-migrator-x8k3m",securityContext:"Privileged",hostIPC:true,hostPID:false,privileged:true,riskLevel:"Critical"},
    {namespace:"monitoring",pod:"prometheus-q7r2p",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
  ];
  @state() private _trainingModuServerlessRisk: Array<{function:string;runtime:string;timeout:number;iamPerms:string;externalCalls:number;riskScore:number}> = [
    {function:"processPayment",runtime:"nodejs20.x",timeout:30,iamPerms:"dynamodb:*",externalCalls:3,riskScore:78},
    {function:"sendNotification",runtime:"python3.12",timeout:15,iamPerms:"sns:Publish",externalCalls:1,riskScore:25},
    {function:"imageResizer",runtime:"python3.12",timeout:60,iamPerms:"s3:*",externalCalls:0,riskScore:45},
    {function:"authValidator",runtime:"go1.x",timeout:10,iamPerms:"cognito-idp:*",externalCalls:2,riskScore:62},
  ];
  @state() private _trainingModuRuntimeAlerts: Array<{id:string;workload:string;alertType:string;severity:string;description:string;timestamp:string}> = [
    {id:"RTA01",workload:"db-migrator-x8k3m",alertType:"Privilege Escalation",severity:"Critical",description:"Container attempted to access /etc/shadow",timestamp:"2026-04-22T10:34:00Z"},
    {id:"RTA02",workload:"web-frontend-7d9f8",alertType:"Anomalous Outbound",severity:"High",description:"Unexpected DNS query to known C2 domain",timestamp:"2026-04-22T09:12:00Z"},
    {id:"RTA03",workload:"sidecar-proxy:v1.8",alertType:"Crypto Mining",severity:"Critical",description:"CPU utilization exceeded 95% for 30 minutes",timestamp:"2026-04-21T23:45:00Z"},
  ];
  private _renderTrainingmoduCloudWl(): TemplateResult {
    const containers = this._trainingModuContainerScans;
    const pods = this._trainingModuK8sPods;
    const alerts = this._trainingModuRuntimeAlerts;
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
  @state() private _trainingModuCourses: Array<{id:string;title:string;category:string;duration:number;enrolled:number;completed:number;difficulty:string;rating:number}> = [
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
  @state() private _trainingModuLearningPaths: Array<{id:string;name:string;courseIds:string[];progress:number;enrolled:number}> = [
    {id:"LP01",name:"Security Analyst Fundamentals",courseIds:["C001","C004","C007"],progress:72,enrolled:156},
    {id:"LP02",name:"DevSecOps Engineer",courseIds:["C001","C002","C008","C012"],progress:45,enrolled:78},
    {id:"LP03",name:"Cloud Security Specialist",courseIds:["C003","C006","C009"],progress:58,enrolled:89},
    {id:"LP04",name:"Advanced Penetration Tester",courseIds:["C010","C002","C005"],progress:33,enrolled:45},
  ];
  @state() private _trainingModuDeptCompliance: Array<{dept:string;trainedPct:number;targetPct:number;avgScore:number;certCount:number}> = [
    {dept:"Engineering",trainedPct:88,targetPct:95,avgScore:82,certCount:34},
    {dept:"Operations",trainedPct:92,targetPct:95,avgScore:87,certCount:28},
    {dept:"Finance",trainedPct:78,targetPct:90,avgScore:74,certCount:12},
    {dept:"HR",trainedPct:85,targetPct:90,avgScore:79,certCount:8},
    {dept:"Legal",trainedPct:71,targetPct:85,avgScore:71,certCount:6},
  ];
  @state() private _trainingModuSkillsGaps: Array<{skill:string;current:number;required:number;gap:number;priority:string}> = [
    {skill:"Cloud Security",current:62,required:85,gap:23,priority:"High"},
    {skill:"Threat Hunting",current:55,required:80,gap:25,priority:"High"},
    {skill:"Incident Response",current:70,required:85,gap:15,priority:"Medium"},
    {skill:"Secure Coding",current:75,required:90,gap:15,priority:"Medium"},
    {skill:"Forensics",current:45,required:75,gap:30,priority:"Critical"},
  ];
  private _renderTrainingmoduTraining(): TemplateResult {
    const courses = this._trainingModuCourses;
    const deptComp = this._trainingModuDeptCompliance;
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
    {id: 'cc-training-module-001', title: 'SOX Section 404 Compliance Review', deadline: '2026-06-30', category: 'Regulatory', status: 'In Progress', assignee: 'Compliance Team', notes: 'Annual internal control assessment for financial reporting'},
    {id: 'cc-training-module-002', title: 'GDPR Data Protection Impact Assessment', deadline: '2026-05-15', category: 'Privacy', status: 'Pending', assignee: 'DPO Office', notes: 'Quarterly DPIA for high-risk processing activities'},
    {id: 'cc-training-module-003', title: 'ISO 27001 Surveillance Audit', deadline: '2026-07-20', category: 'Certification', status: 'Scheduled', assignee: 'QA Lead', notes: 'Stage 2 surveillance audit for ISMS certification renewal'},
    {id: 'cc-training-module-004', title: 'PCI DSS v4.0 Gap Analysis', deadline: '2026-05-30', category: 'Payment', status: 'Not Started', assignee: 'Security Architect', notes: 'Assess current state against PCI DSS v4.0 requirements'},
    {id: 'cc-training-module-005', title: 'NIST CSF Self-Assessment', deadline: '2026-08-15', category: 'Framework', status: 'Pending', assignee: 'CISO', notes: 'Biannual self-assessment against NIST Cybersecurity Framework'},
    {id: 'cc-training-module-006', title: 'HIPAA Security Rule Audit', deadline: '2026-06-15', category: 'Healthcare', status: 'In Progress', assignee: 'Compliance Analyst', notes: 'Annual audit of administrative, physical, and technical safeguards'},
    {id: 'cc-training-module-007', title: 'SOC 2 Type II Report Renewal', deadline: '2026-09-30', category: 'Audit', status: 'Scheduled', assignee: 'External Auditor', notes: 'Engage auditor for SOC 2 Type II examination period'},
    {id: 'cc-training-module-008', title: 'FedRAMP Authorization Review', deadline: '2026-07-01', category: 'Government', status: 'Pending', assignee: 'FedRAMP PMO', notes: 'Review and update security authorization package'},
    {id: 'cc-training-module-009', title: 'Annual Penetration Test', deadline: '2026-10-15', category: 'Testing', status: 'Not Started', assignee: 'Red Team Lead', notes: 'Comprehensive external and internal penetration testing engagement'},
    {id: 'cc-training-module-010', title: 'Security Awareness Training Rollout', deadline: '2026-05-01', category: 'Training', status: 'Completed', assignee: 'Security Awareness Manager', notes: 'Q2 organization-wide security awareness training program'},
    {id: 'cc-training-module-011', title: 'Vendor Security Review Cycle', deadline: '2026-06-01', category: 'Third Party', status: 'In Progress', assignee: 'Vendor Manager', notes: 'Quarterly review of critical vendor security posture and SLA compliance'},
    {id: 'cc-training-module-012', title: 'Incident Response Plan Update', deadline: '2026-05-20', category: 'Operations', status: 'Pending', assignee: 'IR Team Lead', notes: 'Update IR procedures based on lessons learned from recent incidents'},
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
    {id: 'exc-training-module-001', title: 'Legacy TLS 1.0 Exception for Payment Gateway', riskLevel: 'High', status: 'Approved', requestor: 'Infrastructure Team', approver: 'CISO', createdDate: '2026-01-15', expiryDate: '2026-07-15', compensatingControls: ['Network segmentation', 'Enhanced monitoring', 'Quarterly review'], justification: 'Third-party payment processor requires TLS 1.0; migration planned for Q3'},
    {id: 'exc-training-module-002', title: 'Admin Account with Non-SSO Access', riskLevel: 'Medium', status: 'Under Review', requestor: 'DevOps Lead', approver: 'IAM Manager', createdDate: '2026-02-20', expiryDate: '2026-08-20', compensatingControls: ['MFA enforced', 'Session recording', 'Weekly access audit'], justification: 'Emergency break-glass account for critical infrastructure management'},
    {id: 'exc-training-module-003', title: 'Outdated Database Version Support', riskLevel: 'High', status: 'Approved', requestor: 'DBA Team', approver: 'CTO', createdDate: '2025-12-01', expiryDate: '2026-06-01', compensatingControls: ['Isolated network zone', 'Application-layer WAF', 'Monthly patching'], justification: 'Vendor application incompatibility with newer DB version; upgrade scheduled'},
    {id: 'exc-training-module-004', title: 'Public S3 Bucket for Customer Assets', riskLevel: 'Critical', status: 'Expired', requestor: 'Product Team', approver: 'CISO', createdDate: '2025-09-01', expiryDate: '2026-03-01', compensatingControls: ['Signed URLs', 'Access logging', 'Content encryption'], justification: 'Legacy customer portal requires public access for document delivery'},
    {id: 'exc-training-module-005', title: 'VPN Bypass for Cloud-Native Workloads', riskLevel: 'Medium', status: 'Pending', requestor: 'Cloud Architecture', approver: 'Security Architect', createdDate: '2026-03-10', expiryDate: '2026-09-10', compensatingControls: ['Zero Trust network policies', 'mTLS between services', 'Service mesh encryption'], justification: 'Cloud-native microservices require direct connectivity for performance'},
    {id: 'exc-training-module-006', title: 'Default Password Policy Override', riskLevel: 'High', status: 'Denied', requestor: 'HR Department', approver: 'CISO', createdDate: '2026-03-15', expiryDate: '2026-09-15', compensatingControls: ['Password manager deployment', 'SSO integration'], justification: 'Requested simpler password requirements for non-technical staff'},
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
    {id: 'dq-training-module-001', dataSource: 'Vulnerability Scanner Feed', completenessScore: 94, accuracyScore: 91, timelinessScore: 88, consistencyScore: 95, reliabilityRank: 1, lastUpdated: '2026-04-23T08:00:00Z', issues: ['Minor delay in Nessus plugin updates'], trend: 'improving'},
    {id: 'dq-training-module-002', dataSource: 'SIEM Event Logs', completenessScore: 87, accuracyScore: 93, timelinessScore: 96, consistencyScore: 89, reliabilityRank: 2, lastUpdated: '2026-04-23T07:30:00Z', issues: ['Some log sources showing gaps in off-hours'], trend: 'stable'},
    {id: 'dq-training-module-003', dataSource: 'Asset Inventory Database', completenessScore: 82, accuracyScore: 78, timelinessScore: 75, consistencyScore: 84, reliabilityRank: 4, lastUpdated: '2026-04-22T18:00:00Z', issues: ['Shadow IT devices not fully cataloged', 'Decommissioned assets still listed'], trend: 'declining'},
    {id: 'dq-training-module-004', dataSource: 'Threat Intelligence Platform', completenessScore: 91, accuracyScore: 89, timelinessScore: 92, consistencyScore: 87, reliabilityRank: 3, lastUpdated: '2026-04-23T06:00:00Z', issues: ['Some IOC sources lack confidence scoring'], trend: 'improving'},
    {id: 'dq-training-module-005', dataSource: 'Identity Provider Logs', completenessScore: 96, accuracyScore: 97, timelinessScore: 98, consistencyScore: 96, reliabilityRank: 1, lastUpdated: '2026-04-23T09:00:00Z', issues: [], trend: 'stable'},
    {id: 'dq-training-module-006', dataSource: 'Cloud Security Posture Data', completenessScore: 79, accuracyScore: 85, timelinessScore: 82, consistencyScore: 81, reliabilityRank: 5, lastUpdated: '2026-04-23T05:00:00Z', issues: ['Multi-cloud coverage gaps', 'API rate limiting affects scan frequency'], trend: 'declining'},
    {id: 'dq-training-module-007', dataSource: 'Compliance Evidence Store', completenessScore: 88, accuracyScore: 86, timelinessScore: 80, consistencyScore: 83, reliabilityRank: 4, lastUpdated: '2026-04-21T14:00:00Z', issues: ['Manual evidence collection delays', 'Inconsistent formatting across frameworks'], trend: 'stable'},
    {id: 'dq-training-module-008', dataSource: 'Network Flow Data', completenessScore: 92, accuracyScore: 90, timelinessScore: 94, consistencyScore: 91, reliabilityRank: 2, lastUpdated: '2026-04-23T08:30:00Z', issues: ['Encrypted traffic classification accuracy needs improvement'], trend: 'improving'},
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
    {id: 'wf-training-module-001', name: 'Vulnerability Triage Pipeline', description: 'Automated vulnerability assessment, prioritization, and assignment workflow', category: 'Vulnerability Management', steps: 8, avgDuration: '12 min', successRate: 94.5, lastRun: '2026-04-23T06:00:00Z', manualInterventions: 2, optimizationScore: 87},
    {id: 'wf-training-module-002', name: 'Incident Response Orchestration', description: 'End-to-end IR workflow from detection to containment and recovery', category: 'Incident Response', steps: 15, avgDuration: '45 min', successRate: 89.2, lastRun: '2026-04-22T14:30:00Z', manualInterventions: 5, optimizationScore: 72},
    {id: 'wf-training-module-003', name: 'Access Request Approval Chain', description: 'Multi-level approval workflow for privileged access requests', category: 'Identity & Access', steps: 6, avgDuration: '4 hours', successRate: 97.1, lastRun: '2026-04-23T09:15:00Z', manualInterventions: 1, optimizationScore: 92},
    {id: 'wf-training-module-004', name: 'Compliance Evidence Collection', description: 'Automated gathering and packaging of audit evidence artifacts', category: 'Compliance', steps: 10, avgDuration: '30 min', successRate: 91.8, lastRun: '2026-04-21T10:00:00Z', manualInterventions: 3, optimizationScore: 78},
    {id: 'wf-training-module-005', name: 'Security Patch Deployment', description: 'Staged patch rollout with validation and rollback capability', category: 'Patch Management', steps: 12, avgDuration: '2 hours', successRate: 96.3, lastRun: '2026-04-20T22:00:00Z', manualInterventions: 1, optimizationScore: 85},
    {id: 'wf-training-module-006', name: 'Threat Intelligence Enrichment', description: 'IOC enrichment and correlation with internal threat data', category: 'Threat Intelligence', steps: 7, avgDuration: '8 min', successRate: 93.7, lastRun: '2026-04-23T07:00:00Z', manualInterventions: 0, optimizationScore: 95},
    {id: 'wf-training-module-007', name: 'Security Reporting Pipeline', description: 'Automated generation and distribution of security metrics reports', category: 'Reporting', steps: 5, avgDuration: '15 min', successRate: 98.9, lastRun: '2026-04-23T08:00:00Z', manualInterventions: 0, optimizationScore: 97},
    {id: 'wf-training-module-008', name: 'Vendor Risk Assessment', description: 'Automated vendor security questionnaire distribution and scoring', category: 'Third Party', steps: 9, avgDuration: '3 days', successRate: 85.4, lastRun: '2026-04-19T11:00:00Z', manualInterventions: 4, optimizationScore: 65},
  ];

  @state() private _workflowExecutionHistory: Array<{workflowId: string; runDate: string; duration: string; status: string; trigger: string}> = [
    {workflowId: 'wf-training-module-001', runDate: '2026-04-23T06:00:00Z', duration: '11 min 23 sec', status: 'Success', trigger: 'Scheduled'},
    {workflowId: 'wf-training-module-002', runDate: '2026-04-22T14:30:00Z', duration: '42 min 15 sec', status: 'Success', trigger: 'Alert'},
    {workflowId: 'wf-training-module-003', runDate: '2026-04-23T09:15:00Z', duration: '3h 45 min', status: 'Success', trigger: 'User Request'},
    {workflowId: 'wf-training-module-001', runDate: '2026-04-22T06:00:00Z', duration: '13 min 08 sec', status: 'Partial', trigger: 'Scheduled'},
    {workflowId: 'wf-training-module-004', runDate: '2026-04-21T10:00:00Z', duration: '28 min 42 sec', status: 'Success', trigger: 'Scheduled'},
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
    {id: 'kb-training-module-001', title: 'Zero Trust Architecture Implementation Guide', category: 'Architecture', author: 'Security Architecture Team', publishDate: '2026-03-15', views: 1842, rating: 4.8, tags: ['zero-trust', 'network', 'identity'], summary: 'Comprehensive guide for implementing zero trust principles across enterprise infrastructure', readTime: '15 min'},
    {id: 'kb-training-module-002', title: 'Ransomware Defense Playbook 2026', category: 'Threats', author: 'Threat Intelligence Team', publishDate: '2026-04-01', views: 2341, rating: 4.9, tags: ['ransomware', 'incident-response', 'defense'], summary: 'Updated playbook with latest ransomware tactics, techniques, and defensive measures', readTime: '12 min'},
    {id: 'kb-training-module-003', title: 'Cloud Security Best Practices for Multi-Cloud', category: 'Cloud', author: 'Cloud Security Team', publishDate: '2026-02-28', views: 1567, rating: 4.5, tags: ['cloud', 'aws', 'azure', 'gcp'], summary: 'Best practices for securing workloads across multiple cloud service providers', readTime: '18 min'},
    {id: 'kb-training-module-004', title: 'API Security Testing Methodology', category: 'Testing', author: 'Red Team', publishDate: '2026-03-22', views: 987, rating: 4.6, tags: ['api', 'testing', 'owasp'], summary: 'Structured methodology for identifying and testing API security vulnerabilities', readTime: '10 min'},
    {id: 'kb-training-module-005', title: 'Supply Chain Security Risk Management', category: 'Third Party', author: 'GRC Team', publishDate: '2026-01-20', views: 1234, rating: 4.3, tags: ['supply-chain', 'vendor', 'risk'], summary: 'Framework for managing security risks in the software supply chain', readTime: '14 min'},
    {id: 'kb-training-module-006', title: 'Kubernetes Security Hardening Checklist', category: 'Container', author: 'Platform Security', publishDate: '2026-04-10', views: 2103, rating: 4.7, tags: ['kubernetes', 'container', 'hardening'], summary: 'Step-by-step hardening checklist for production Kubernetes clusters', readTime: '11 min'},
    {id: 'kb-training-module-007', title: 'Security Metrics That Matter for Executives', category: 'Metrics', author: 'CISO Office', publishDate: '2026-03-05', views: 876, rating: 4.4, tags: ['metrics', 'kpi', 'reporting'], summary: 'Key security metrics and KPIs that resonate with board-level stakeholders', readTime: '8 min'},
    {id: 'kb-training-module-008', title: 'Phishing Simulation Campaign Design', category: 'Awareness', author: 'Security Awareness Team', publishDate: '2026-02-15', views: 1456, rating: 4.5, tags: ['phishing', 'simulation', 'training'], summary: 'Designing effective phishing simulations that drive real behavioral change', readTime: '9 min'},
    {id: 'kb-training-module-009', title: 'Data Loss Prevention Strategy and Implementation', category: 'Data Protection', author: 'Data Security Team', publishDate: '2026-03-28', views: 1678, rating: 4.6, tags: ['dlp', 'data-protection', 'compliance'], summary: 'Strategic approach to DLP covering people, process, and technology layers', readTime: '16 min'},
    {id: 'kb-training-module-010', title: 'Security Automation with SOAR Platforms', category: 'Automation', author: 'SOC Engineering', publishDate: '2026-04-05', views: 1098, rating: 4.7, tags: ['soar', 'automation', 'soc'], summary: 'Building effective security automation playbooks using SOAR technology', readTime: '13 min'},
    {id: 'kb-training-module-011', title: 'Third-Party Risk Assessment Framework', category: 'GRC', author: 'Vendor Management', publishDate: '2026-01-30', views: 1345, rating: 4.4, tags: ['vendor', 'risk', 'assessment'], summary: 'Structured framework for evaluating and monitoring third-party security risks', readTime: '12 min'},
    {id: 'kb-training-module-012', title: 'Network Detection and Response Best Practices', category: 'Network', author: 'Network Security Team', publishDate: '2026-03-18', views: 1567, rating: 4.5, tags: ['ndr', 'network', 'detection'], summary: 'Implementing effective network detection and response capabilities', readTime: '14 min'},
    {id: 'kb-training-module-013', title: 'Security Chaos Engineering Guide', category: 'Resilience', author: 'SRE Security', publishDate: '2026-04-12', views: 789, rating: 4.3, tags: ['chaos-engineering', 'resilience', 'testing'], summary: 'Applying chaos engineering principles to validate security controls', readTime: '10 min'},
    {id: 'kb-training-module-014', title: 'Incident Communication Templates', category: 'Incident Response', author: 'IR Team', publishDate: '2026-02-22', views: 2234, rating: 4.8, tags: ['incident', 'communication', 'templates'], summary: 'Ready-to-use communication templates for security incident scenarios', readTime: '7 min'},
    {id: 'kb-training-module-015', title: 'Endpoint Detection and Response Configuration', category: 'Endpoint', author: 'Endpoint Security', publishDate: '2026-03-08', views: 1345, rating: 4.5, tags: ['edr', 'endpoint', 'configuration'], summary: 'Optimal EDR configuration for maximum detection with minimal false positives', readTime: '11 min'},
    {id: 'kb-training-module-016', title: 'Security Code Review Standards', category: 'Development', author: 'AppSec Team', publishDate: '2026-02-10', views: 1890, rating: 4.6, tags: ['code-review', 'secure-sdlc', 'standards'], summary: 'Standards and checklists for security-focused code reviews', readTime: '13 min'},
    {id: 'kb-training-module-017', title: 'IoT Security Assessment Methodology', category: 'IoT', author: 'IoT Security Lab', publishDate: '2026-04-08', views: 654, rating: 4.2, tags: ['iot', 'embedded', 'assessment'], summary: 'Methodology for assessing security posture of IoT devices and ecosystems', readTime: '15 min'},
    {id: 'kb-training-module-018', title: 'Passwordless Authentication Migration Guide', category: 'Identity', author: 'IAM Team', publishDate: '2026-03-25', views: 1678, rating: 4.7, tags: ['passwordless', 'authentication', 'mfa'], summary: 'Step-by-step migration plan from password-based to passwordless authentication', readTime: '12 min'},
    {id: 'kb-training-module-019', title: 'Security Awareness Program Metrics', category: 'Awareness', author: 'Security Culture Team', publishDate: '2026-01-25', views: 1123, rating: 4.4, tags: ['awareness', 'metrics', 'culture'], summary: 'Measuring the effectiveness of your security awareness and training programs', readTime: '9 min'},
    {id: 'kb-training-module-020', title: 'Deception Technology Deployment Guide', category: 'Detection', author: 'Blue Team', publishDate: '2026-04-15', views: 876, rating: 4.5, tags: ['deception', 'honeypot', 'detection'], summary: 'Planning and deploying deception technology for advanced threat detection', readTime: '11 min'},
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

  // ─── Security Process Optimization Engine ───
  private _processSteps = [
    {id:"ps-01",name:"Vulnerability Assessment",avgDuration:4.2,throughput:28,targetDuration:3.0,automationLevel:45,owner:"Scanner Team",sla:24,backlog:42},
    {id:"ps-02",name:"Vulnerability Triage",avgDuration:2.1,throughput:55,targetDuration:1.5,automationLevel:60,owner:"SOC L1",sla:8,backlog:18},
    {id:"ps-03",name:"Remediation Planning",avgDuration:6.8,throughput:12,targetDuration:4.0,automationLevel:20,owner:"Dev Teams",sla:72,backlog:35},
    {id:"ps-04",name:"Patch Development",avgDuration:8.5,throughput:8,targetDuration:5.0,automationLevel:15,owner:"Engineering",sla:168,backlog:52},
    {id:"ps-05",name:"Patch Testing",avgDuration:3.2,throughput:18,targetDuration:2.0,automationLevel:55,owner:"QA Team",sla:48,backlog:28},
    {id:"ps-06",name:"Patch Deployment",avgDuration:1.8,throughput:42,targetDuration:1.0,automationLevel:70,owner:"SRE Team",sla:24,backlog:15},
    {id:"ps-07",name:"Verification Scan",avgDuration:2.5,throughput:32,targetDuration:1.5,automationLevel:75,owner:"Scanner Team",sla:24,backlog:22},
    {id:"ps-08",name:"Incident Detection",avgDuration:0.3,throughput:180,targetDuration:0.1,automationLevel:85,owner:"SOC L1",sla:0.25,backlog:5},
    {id:"ps-09",name:"Incident Analysis",avgDuration:3.5,throughput:22,targetDuration:2.0,automationLevel:35,owner:"SOC L2",sla:4,backlog:14},
    {id:"ps-10",name:"Incident Containment",avgDuration:1.2,throughput:48,targetDuration:0.5,automationLevel:40,owner:"SOC L2",sla:2,backlog:8},
    {id:"ps-11",name:"Compliance Check",avgDuration:5.0,throughput:15,targetDuration:3.0,automationLevel:50,owner:"GRC Team",sla:72,backlog:38},
    {id:"ps-12",name:"Report Generation",avgDuration:2.0,throughput:35,targetDuration:1.0,automationLevel:65,owner:"GRC Team",sla:48,backlog:20}
  ];

  private _getProcessBottlenecks(): Array<{step:string;waitTime:number;utilization:number;bottleneckScore:number;recommendation:string}> {
    return this._processSteps.map(s => {
      const waitTime = s.backlog / s.throughput * 24;
      const utilization = (s.avgDuration / s.sla) * 100;
      const bottleneckScore = Math.round(waitTime * 0.4 + (utilization > 100 ? (utilization - 100) * 0.6 : 0));
      let recommendation = "Monitor";
      if (bottleneckScore > 50) recommendation = "Critical: Add resources or automate";
      else if (bottleneckScore > 25) recommendation = "Warning: Optimize workflow";
      else if (bottleneckScore > 10) recommendation = "Review: Minor improvements needed";
      return {step: s.name, waitTime: Math.round(waitTime * 10) / 10, utilization: Math.round(utilization), bottleneckScore, recommendation};
    }).sort((a, b) => b.bottleneckScore - a.bottleneckScore);
  }

  private _getProcessEfficiencyScores(): Array<{process:string;efficiency:number;trend:string;target:number;gap:number}> {
    return this._processSteps.map(s => {
      const efficiency = Math.round((s.targetDuration / s.avgDuration) * 100);
      const trend = efficiency > 70 ? "improving" : efficiency > 40 ? "stable" : "declining";
      return {process: s.name, efficiency, trend, target: 100, gap: 100 - efficiency};
    }).sort((a, b) => a.efficiency - b.efficiency);
  }

  private _getAutomationOpportunities(): Array<{process:string;currentAuto:number;potentialAuto:number;effort:string;impact:string;roi:number}> {
    return this._processSteps.map(s => {
      const potential = Math.min(95, s.automationLevel + 30 + Math.floor(Math.random() * 20));
      const effort = potential - s.automationLevel > 40 ? "high" : potential - s.automationLevel > 20 ? "medium" : "low";
      const impact = s.throughput < 15 ? "high" : s.throughput < 30 ? "medium" : "low";
      const hoursSaved = Math.round((s.avgDuration * s.throughput * (potential - s.automationLevel) / 100) * 52 / 12);
      const cost = effort === "high" ? 40000 : effort === "medium" ? 15000 : 5000;
      const roi = Math.round((hoursSaved * 75 / cost) * 100);
      return {process: s.name, currentAuto: s.automationLevel, potentialAuto: potential, effort, impact, roi};
    }).sort((a, b) => b.roi - a.roi).slice(0, 8);
  }

  private _getImprovementRoadmap(): Array<{phase:string;actions:string[];timeline:string;expectedGain:number}> {
    return [
      {phase:"Quick Wins",actions:["Automate verification scan reporting","Enable auto-triage for known CVE patterns","Deploy pre-approved patch catalog"],timeline:"Month 1-2",expectedGain:15},
      {phase:"Process Redesign",actions:["Implement parallel patch testing tracks","Add risk-based prioritization to triage","Streamline compliance evidence collection"],timeline:"Month 3-4",expectedGain:25},
      {phase:"Advanced Automation",actions:["AI-assisted remediation planning","Automated containment playbooks","Continuous compliance monitoring"],timeline:"Month 5-8",expectedGain:35},
      {phase:"Optimization",actions:["Predictive bottleneck detection","Self-healing security controls","Fully automated patch lifecycle"],timeline:"Month 9-12",expectedGain:45}
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

  // --- Security Scenario Planning Methods (TRMO) ---
  private _initTrmoScenarios(): void {
    const worstCaseScenarios = [
      { id: "trmo-sc-01", name: "Ransomware Attack on Critical Infrastructure", category: "Malware", impact: 9500000, probability: 0.12, recoveryDays: 21, affectedSystems: 47, dataLossGb: 320, businessImpact: "critical" },
      { id: "trmo-sc-02", name: "Insider Data Exfiltration via Authorized Channels", category: "Insider Threat", impact: 7200000, probability: 0.18, recoveryDays: 14, affectedSystems: 12, dataLossGb: 85, businessImpact: "high" },
      { id: "trmo-sc-03", name: "Supply Chain Compromise via Third-Party Library", category: "Supply Chain", impact: 6800000, probability: 0.09, recoveryDays: 30, affectedSystems: 63, dataLossGb: 0, businessImpact: "critical" },
      { id: "trmo-sc-04", name: "Cloud Misconfiguration Leading to Public Exposure", category: "Cloud", impact: 4100000, probability: 0.22, recoveryDays: 7, affectedSystems: 8, dataLossGb: 450, businessImpact: "high" },
      { id: "trmo-sc-05", name: "Zero-Day Exploit in Core Application Framework", category: "Vulnerability", impact: 8900000, probability: 0.05, recoveryDays: 45, affectedSystems: 120, dataLossGb: 0, businessImpact: "critical" },
      { id: "trmo-sc-06", name: "Distributed Denial of Service on Customer-Facing Services", category: "Availability", impact: 3400000, probability: 0.25, recoveryDays: 3, affectedSystems: 15, dataLossGb: 0, businessImpact: "medium" },
      { id: "trmo-sc-07", name: "Credential Stuffing and Account Takeover Wave", category: "Identity", impact: 2800000, probability: 0.30, recoveryDays: 5, affectedSystems: 6, dataLossGb: 12, businessImpact: "medium" },
      { id: "trmo-sc-08", name: "Physical Security Breach at Data Center Facility", category: "Physical", impact: 12000000, probability: 0.02, recoveryDays: 60, affectedSystems: 200, dataLossGb: 5000, businessImpact: "critical" },
    ];
    this._trmoScenarios = worstCaseScenarios.map(s => ({ ...s, mitigationCost: Math.round(s.impact * 0.08), drillScheduled: false, lastDrillDate: null, drillScore: null, controlGaps: Math.floor(Math.random() * 5) + 1 }));
  }

  private _calculateTrmoScenarioRisk(): void {
    this._trmoScenarios.forEach(s => {
      const riskScore = s.impact * s.probability;
      s.riskScore = Math.round(riskScore);
      s.riskLevel = riskScore > 1000000 ? "extreme" : riskScore > 500000 ? "high" : riskScore > 200000 ? "medium" : "low";
      s.mitigationPriority = s.riskScore > 500000 ? "immediate" : s.riskScore > 200000 ? "planned" : "monitor";
      s.residualRisk = Math.round(s.riskScore * (1 - (s.controlGaps * 0.12)));
      s.bciScore = Math.round((s.recoveryDays * 0.3 + s.affectedSystems * 0.4 + (s.dataLossGb > 0 ? 0.3 : 0)) * 100);
    });
  }

  private _scheduleTrmoDrills(): void {
    const drillCadence = { quarterly: ["Q1", "Q2", "Q3", "Q4"], semiAnnual: ["H1", "H2"], annual: ["FY"] };
    this._trmoScenarios.forEach(s => {
      if (s.probability > 0.15 && s.businessImpact === "critical") s.drillCadence = "quarterly";
      else if (s.probability > 0.10 || s.businessImpact === "high") s.drillCadence = "semiAnnual";
      else s.drillCadence = "annual";
      const periods = drillCadence[s.drillCadence as keyof typeof drillCadence];
      s.nextDrillDate = periods[Math.floor(Math.random() * periods.length)] + "-2026";
    });
  }

  private _trmoScenarioComparison(): Record<string, unknown>[] {
    return this._trmoScenarios.map(s => ({
      scenario: s.name, impact: s.impact, probability: s.probability, risk: s.riskScore,
      level: s.riskLevel, recovery: s.recoveryDays + "d", priority: s.mitigationPriority,
      residual: s.residualRisk, bci: s.bciScore, gaps: s.controlGaps
    }));
  }

  // --- Security Control Effectiveness Analytics (TRMO) ---
  private _initTrmoControls(): void {
    const controls = [
      { id: "trmo-ct-01", name: "Network Segmentation", type: "preventive", maturity: "defined", score: 82, target: 90, failures: 3, lastTest: "2026-03-15" },
      { id: "trmo-ct-02", name: "Endpoint Detection and Response", type: "detective", maturity: "managed", score: 88, target: 92, failures: 1, lastTest: "2026-04-01" },
      { id: "trmo-ct-03", name: "Data Loss Prevention", type: "preventive", maturity: "repeatable", score: 71, target: 85, failures: 7, lastTest: "2026-03-22" },
      { id: "trmo-ct-04", name: "Security Information and Event Management", type: "detective", maturity: "managed", score: 85, target: 90, failures: 2, lastTest: "2026-04-05" },
      { id: "trmo-ct-05", name: "Identity and Access Management", type: "preventive", maturity: "defined", score: 76, target: 88, failures: 5, lastTest: "2026-03-28" },
      { id: "trmo-ct-06", name: "Vulnerability Management", type: "corrective", maturity: "managed", score: 80, target: 90, failures: 4, lastTest: "2026-04-02" },
      { id: "trmo-ct-07", name: "Email Security Gateway", type: "preventive", maturity: "managed", score: 90, target: 95, failures: 1, lastTest: "2026-04-08" },
      { id: "trmo-ct-08", name: "Web Application Firewall", type: "preventive", maturity: "managed", score: 87, target: 92, failures: 2, lastTest: "2026-03-30" },
      { id: "trmo-ct-09", name: "Patch Management", type: "corrective", maturity: "defined", score: 68, target: 85, failures: 9, lastTest: "2026-03-18" },
      { id: "trmo-ct-10", name: "Encryption at Rest", type: "preventive", maturity: "managed", score: 93, target: 95, failures: 0, lastTest: "2026-04-10" },
      { id: "trmo-ct-11", name: "Encryption in Transit", type: "preventive", maturity: "optimized", score: 96, target: 98, failures: 0, lastTest: "2026-04-12" },
      { id: "trmo-ct-12", name: "Privileged Access Management", type: "preventive", maturity: "defined", score: 74, target: 88, failures: 6, lastTest: "2026-03-25" },
      { id: "trmo-ct-13", name: "Security Awareness Training", type: "preventive", maturity: "repeatable", score: 65, target: 80, failures: 11, lastTest: "2026-03-20" },
      { id: "trmo-ct-14", name: "Incident Response Plan", type: "corrective", maturity: "managed", score: 78, target: 88, failures: 4, lastTest: "2026-04-03" },
      { id: "trmo-ct-15", name: "Backup and Recovery", type: "corrective", maturity: "managed", score: 84, target: 92, failures: 3, lastTest: "2026-04-06" },
      { id: "trmo-ct-16", name: "Multi-Factor Authentication", type: "preventive", maturity: "managed", score: 91, target: 95, failures: 1, lastTest: "2026-04-09" },
      { id: "trmo-ct-17", name: "Network Traffic Analysis", type: "detective", maturity: "defined", score: 72, target: 85, failures: 5, lastTest: "2026-03-27" },
      { id: "trmo-ct-18", name: "Cloud Security Posture Management", type: "detective", maturity: "repeatable", score: 69, target: 82, failures: 8, lastTest: "2026-03-24" },
      { id: "trmo-ct-19", name: "Container Security Scanning", type: "preventive", maturity: "defined", score: 75, target: 85, failures: 5, lastTest: "2026-04-04" },
      { id: "trmo-ct-20", name: "API Security Gateway", type: "preventive", maturity: "repeatable", score: 70, target: 82, failures: 7, lastTest: "2026-03-29" },
      { id: "trmo-ct-21", name: "Threat Intelligence Platform", type: "detective", maturity: "managed", score: 83, target: 90, failures: 2, lastTest: "2026-04-07" },
      { id: "trmo-ct-22", name: "Database Activity Monitoring", type: "detective", maturity: "defined", score: 67, target: 80, failures: 8, lastTest: "2026-03-21" },
      { id: "trmo-ct-23", name: "Deception Technology", type: "detective", maturity: "initial", score: 55, target: 75, failures: 12, lastTest: "2026-03-16" },
      { id: "trmo-ct-24", name: "Security Orchestration Automation", type: "corrective", maturity: "repeatable", score: 73, target: 85, failures: 6, lastTest: "2026-04-01" },
      { id: "trmo-ct-25", name: "Third-Party Risk Assessment", type: "preventive", maturity: "defined", score: 64, target: 78, failures: 9, lastTest: "2026-03-19" },
    ];
    this._trmoControls = controls;
  }

  private _analyzeTrmoControlEffectiveness(): void {
    const typeBreakdown: Record<string, { total: number; avgScore: number; avgFailures: number }> = {};
    this._trmoControls.forEach(c => {
      if (!typeBreakdown[c.type]) typeBreakdown[c.type] = { total: 0, avgScore: 0, avgFailures: 0 };
      typeBreakdown[c.type].total++;
      typeBreakdown[c.type].avgScore += c.score;
      typeBreakdown[c.type].avgFailures += c.failures;
    });
    Object.keys(typeBreakdown).forEach(t => {
      typeBreakdown[t].avgScore = Math.round(typeBreakdown[t].avgScore / typeBreakdown[t].total);
      typeBreakdown[t].avgFailures = Math.round(typeBreakdown[t].avgFailures / typeBreakdown[t].total * 10) / 10;
    });
    this._trmoControlTypeBreakdown = typeBreakdown;
  }

  private _trmoControlOptimization(): Record<string, unknown>[] {
    return this._trmoControls.filter(c => c.score < c.target).map(c => ({
      control: c.name, current: c.score, target: c.target, gap: c.target - c.score,
      failures: c.failures, maturity: c.maturity, recommendation:
        c.score < 70 ? "Critical: Immediate improvement required" :
        c.score < 80 ? "Significant: Plan improvement sprint" :
        "Moderate: Fine-tune and optimize"
    })).sort((a: any, b: any) => (b.gap as number) - (a.gap as number));
  }

  // --- Security Data Pipeline Health (TRMO) ---
  private _initTrmoPipelines(): void {
    const pipelines = [
      { id: "trmo-pl-01", name: "SIEM Log Ingestion", status: "healthy", healthScore: 94, latencyMs: 120, freshnessMin: 2, errorRate: 0.02, throughputMbps: 450, recordsPerSec: 12000, backPressure: 0.05, uptime: 99.97 },
      { id: "trmo-pl-02", name: "Threat Feed Aggregation", status: "healthy", healthScore: 91, latencyMs: 300, freshnessMin: 15, errorRate: 0.05, throughputMbps: 85, recordsPerSec: 3200, backPressure: 0.08, uptime: 99.92 },
      { id: "trmo-pl-03", name: "Vulnerability Scan Results", status: "degraded", healthScore: 72, latencyMs: 2500, freshnessMin: 60, errorRate: 0.15, throughputMbps: 25, recordsPerSec: 800, backPressure: 0.35, uptime: 98.50 },
      { id: "trmo-pl-04", name: "Endpoint Telemetry Stream", status: "healthy", healthScore: 88, latencyMs: 450, freshnessMin: 5, errorRate: 0.08, throughputMbps: 280, recordsPerSec: 8500, backPressure: 0.12, uptime: 99.85 },
      { id: "trmo-pl-05", name: "Cloud Audit Log Pipeline", status: "healthy", healthScore: 86, latencyMs: 600, freshnessMin: 10, errorRate: 0.06, throughputMbps: 150, recordsPerSec: 4500, backPressure: 0.10, uptime: 99.80 },
      { id: "trmo-pl-06", name: "Identity Event Stream", status: "warning", healthScore: 78, latencyMs: 1200, freshnessMin: 20, errorRate: 0.12, throughputMbps: 45, recordsPerSec: 1500, backPressure: 0.22, uptime: 99.40 },
      { id: "trmo-pl-07", name: "Network Flow Collection", status: "healthy", healthScore: 82, latencyMs: 800, freshnessMin: 8, errorRate: 0.09, throughputMbps: 650, recordsPerSec: 18000, backPressure: 0.15, uptime: 99.70 },
      { id: "trmo-pl-08", name: "DLP Incident Pipeline", status: "degraded", healthScore: 68, latencyMs: 3500, freshnessMin: 45, errorRate: 0.20, throughputMbps: 18, recordsPerSec: 500, backPressure: 0.42, uptime: 97.80 },
    ];
    this._trmoPipelines = pipelines.map(p => ({ ...p, dependencies: [], slaBreached: p.healthScore < 75, alertThreshold: p.errorRate > 0.15 }));
    this._trmoPipelines[0].dependencies = ["trmo-pl-04", "trmo-pl-07"];
    this._trmoPipelines[4].dependencies = ["trmo-pl-01"];
    this._trmoPipelines[5].dependencies = ["trmo-pl-02"];
    this._trmoPipelines[7].dependencies = ["trmo-pl-04", "trmo-pl-05"];
  }

  private _trmoPipelineTrend(): Record<string, unknown>[] {
    const hours = Array.from({ length: 24 }, (_, i) => `H${String(i).padStart(2, "0")}`);
    return this._trmoPipelines.map(p => ({
      pipeline: p.name, status: p.status, health: p.healthScore,
      latency: p.latencyMs, freshness: p.freshnessMin, errors: p.errorRate,
      throughput: p.throughputMbps, recordsSec: p.recordsPerSec, slaOk: !p.slaBreached,
      hourlyHealth: hours.map(h => Math.max(50, p.healthScore + Math.floor(Math.random() * 20) - 10))
    }));
  }

  // --- Security Stakeholder Report Generator (TRMO) ---
  private _initTrmoReportTemplates(): void {
    this._trmoReportTemplates = [
      { id: "trmo-rp-01", name: "Board Security Report", audience: "board", frequency: "quarterly", sections: 6, autoGenerate: true, lastGenerated: "2026-03-31", pages: 12 },
      { id: "trmo-rp-02", name: "Executive Risk Summary", audience: "executive", frequency: "monthly", sections: 8, autoGenerate: true, lastGenerated: "2026-04-01", pages: 8 },
      { id: "trmo-rp-03", name: "Technical Security Review", audience: "technical", frequency: "weekly", sections: 12, autoGenerate: true, lastGenerated: "2026-04-21", pages: 25 },
      { id: "trmo-rp-04", name: "Audit Compliance Report", audience: "audit", frequency: "quarterly", sections: 10, autoGenerate: false, lastGenerated: "2026-03-15", pages: 35 },
      { id: "trmo-rp-05", name: "Regulatory Filing Package", audience: "regulatory", frequency: "annual", sections: 15, autoGenerate: false, lastGenerated: "2025-12-31", pages: 48 },
    ];
  }

  private _generateTrmoExecSummary(): string {
    const totalRisk = this._trmoScenarios.reduce((sum: number, s: any) => sum + s.riskScore, 0);
    const avgControl = Math.round(this._trmoControls.reduce((sum: number, c: any) => sum + c.score, 0) / this._trmoControls.length);
    const degradedPipes = this._trmoPipelines.filter((p: any) => p.status !== "healthy").length;
    return `Overall risk exposure: ${(totalRisk / 1000000).toFixed(1)}M. Average control effectiveness: {avgControl}%. {degradedPipes} pipeline(s) need attention. {this._trmoScenarios.filter((s: any) => s.mitigationPriority === "immediate").length} scenarios require immediate action.`;
  }

  // --- Security Technology Radar (TRMO) ---
  private _initTrmoTechRadar(): void {
    this._trmoTechRadar = [
      { id: "trmo-tr-01", name: "AI-Powered Threat Detection", ring: "adopt", category: "Detection", maturity: 4, trend: "up", investment: "high", roi: 3.2, vendorCount: 8 },
      { id: "trmo-tr-02", name: "Zero Trust Architecture", ring: "adopt", category: "Architecture", maturity: 4, trend: "up", investment: "high", roi: 2.8, vendorCount: 12 },
      { id: "trmo-tr-03", name: "SASE/SSE Platform", ring: "trial", category: "Network", maturity: 3, trend: "up", investment: "medium", roi: 2.4, vendorCount: 10 },
      { id: "trmo-tr-04", name: "CNAPP Cloud Security", ring: "trial", category: "Cloud", maturity: 3, trend: "up", investment: "medium", roi: 2.1, vendorCount: 7 },
      { id: "trmo-tr-05", name: "Extended Detection and Response", ring: "adopt", category: "Detection", maturity: 4, trend: "stable", investment: "high", roi: 2.9, vendorCount: 9 },
      { id: "trmo-tr-06", name: "Quantum-Safe Cryptography", ring: "assess", category: "Crypto", maturity: 2, trend: "up", investment: "low", roi: 0.8, vendorCount: 4 },
      { id: "trmo-tr-07", name: "Security Service Edge", ring: "trial", category: "Network", maturity: 3, trend: "up", investment: "medium", roi: 2.0, vendorCount: 6 },
      { id: "trmo-tr-08", name: "SOAR 2.0 Autonomous SOC", ring: "assess", category: "Operations", maturity: 2, trend: "up", investment: "low", roi: 1.2, vendorCount: 5 },
      { id: "trmo-tr-09", name: "Software Supply Chain Security", ring: "trial", category: "DevSecOps", maturity: 3, trend: "up", investment: "medium", roi: 2.3, vendorCount: 8 },
      { id: "trmo-tr-10", name: "Identity Threat Detection", ring: "adopt", category: "Identity", maturity: 3, trend: "up", investment: "high", roi: 2.7, vendorCount: 7 },
      { id: "trmo-tr-11", name: "Data Security Posture Management", ring: "trial", category: "Data", maturity: 3, trend: "up", investment: "medium", roi: 2.2, vendorCount: 9 },
      { id: "trmo-tr-12", name: "Decentralized Identity Standards", ring: "hold", category: "Identity", maturity: 1, trend: "stable", investment: "low", roi: 0.5, vendorCount: 3 },
    ];
  }

  private _trmoRadarSummary(): Record<string, unknown> {
    const rings: Record<string, number> = { adopt: 0, trial: 0, assess: 0, hold: 0 };
    this._trmoTechRadar.forEach(t => { if (rings[t.ring as keyof typeof rings] !== undefined) rings[t.ring as keyof typeof rings]++; });
    return { adopt: rings.adopt, trial: rings.trial, assess: rings.assess, hold: rings.hold, total: this._trmoTechRadar.length, avgMaturity: 2.8, topInvestment: this._trmoTechRadar.filter(t => t.investment === "high").map(t => t.name) };
  }

  // --- TRMO Security Compliance Mapping Matrix ---
  private _initTrmoComplianceMatrix(): void {
    const frameworks = ["ISO 27001", "SOC 2 Type II", "PCI DSS 4.0", "NIST CSF 2.0", "GDPR", "HIPAA", "FedRAMP", "CIS Controls v8"];
    const domains = ["Access Control", "Data Protection", "Network Security", "Endpoint Security", "Incident Response", "Risk Management", "Asset Management", "Compliance Monitoring"];
    this._trmoComplianceMatrix = frameworks.map(fw => ({
      framework: fw, totalControls: Math.floor(Math.random() * 60) + 80, implemented: Math.floor(Math.random() * 40) + 50,
      partial: Math.floor(Math.random() * 20) + 10, gaps: Math.floor(Math.random() * 15) + 3,
      lastAudit: "2026-" + String(Math.floor(Math.random() * 4) + 1).padStart(2, "0") + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0"),
      nextAudit: "2027-" + String(Math.floor(Math.random() * 6) + 1).padStart(2, "0") + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0"),
      score: Math.floor(Math.random() * 20) + 72, status: Math.random() > 0.3 ? "compliant" : "partial",
      domains: domains.map(d => ({ domain: d, controls: Math.floor(Math.random() * 10) + 5, passed: Math.floor(Math.random() * 8) + 2 }))
    }));
  }

  private _trmoComplianceTrend(): Record<string, unknown>[] {
    const quarters = ["Q1-2025", "Q2-2025", "Q3-2025", "Q4-2025", "Q1-2026", "Q2-2026"];
    return this._trmoComplianceMatrix.map(fw => ({
      framework: fw, score: fw.score, status: fw.status,
      trend: quarters.map(q => Math.min(100, fw.score - 15 + Math.floor(Math.random() * 20))),
      gaps: fw.gaps, implemented: fw.implemented, total: fw.totalControls,
      coverage: Math.round((fw.implemented / fw.totalControls) * 100)
    }));
  }

  // --- TRMO Threat Intelligence Correlation Engine ---
  private _initTrmoThreatIntel(): void {
    const threatActors = ["APT29", "APT41", "Lazarus Group", "FIN7", "Conti", "Sandworm", "Fancy Bear", "Tick Group"];
    const techniques = ["T1059.001", "T1190", "T1566.001", "T1078", "T1055", "T1486", "T1021.001", "T1071.001"];
    const sectors = ["Finance", "Healthcare", "Technology", "Government", "Energy", "Manufacturing", "Retail", "Telecom"];
    this._trmoThreatIntel = threatActors.map((actor, i) => ({
      actor, sophistication: ["advanced", "advanced", "moderate", "advanced", "moderate", "advanced", "advanced", "moderate"][i],
      targeting: sectors.slice(0, Math.floor(Math.random() * 4) + 2),
      primaryTechniques: techniques.slice(Math.floor(Math.random() * 3), Math.floor(Math.random() * 3) + 4),
      confidence: Math.floor(Math.random() * 30) + 65, lastObserved: "2026-04-" + String(Math.floor(Math.random() * 22) + 1).padStart(2, "0"),
      iocCount: Math.floor(Math.random() * 200) + 50, attributedCampaigns: Math.floor(Math.random() * 8) + 1,
      mitreTactics: ["Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion"].slice(0, Math.floor(Math.random() * 3) + 2),
      riskScore: Math.floor(Math.random() * 40) + 55, alertsTriggered: Math.floor(Math.random() * 30) + 5
    }));
  }

  private _trmoThreatCorrelation(): Record<string, unknown>[] {
    return this._trmoThreatIntel.filter(t => t.riskScore > 70).map(t => ({
      actor: t.actor, risk: t.riskScore, confidence: t.confidence,
      techniques: t.primaryTechniques, targeting: t.targeting,
      lastSeen: t.lastObserved, iocs: t.iocCount, campaigns: t.attributedCampaigns,
      recommendation: t.riskScore > 85 ? "Immediate defensive action required" : t.riskScore > 75 ? "Enhanced monitoring recommended" : "Standard monitoring sufficient"
    })).sort((a: any, b: any) => (b.risk as number) - (a.risk as number));
  }

  // --- TRMO Security Metrics Deep Dive ---
  private _initTrmoMetricsDeep(): void {
    const metricCategories = ["Detection Coverage", "Response Efficiency", "Prevention Effectiveness", "Recovery Speed", "Compliance Adherence"];
    this._trmoMetricsDeep = metricCategories.map(cat => ({
      category: cat, metrics: Array.from({ length: 6 }, (_, i) => ({
        name: `${cat} Metric ${i + 1}`, value: Math.floor(Math.random() * 40) + 55,
        target: Math.floor(Math.random() * 15) + 82, unit: ["%", "ms", "count", "score"][Math.floor(Math.random() * 4)],
        trend: Math.random() > 0.4 ? "improving" : "stable", period: "30d",
        baseline: Math.floor(Math.random() * 20) + 50, benchmark: Math.floor(Math.random() * 10) + 80
      })),
      overallScore: Math.floor(Math.random() * 20) + 70, maturity: ["initial", "developing", "defined", "managed", "optimized"][Math.floor(Math.random() * 5)]
    }));
  }

  private _trmoMetricsHeatmap(): number[][] {
    return this._trmoMetricsDeep.map(cat =>
      cat.metrics.map(m => Math.round((m.value / m.target) * 100))
    );
  }

  // --- TRMO Incident Cost Modeling ---
  private _initTrmoCostModel(): void {
    const incidentTypes = ["Data Breach", "Ransomware", "DDoS", "Insider Threat", "Phishing", "Supply Chain", "Cloud Misconfig", "Zero-Day"];
    this._trmoCostModel = incidentTypes.map(inc => ({
      incident: inc, avgCost: Math.floor(Math.random() * 8000000) + 1000000,
      maxCost: Math.floor(Math.random() * 20000000) + 5000000, minCost: Math.floor(Math.random() * 500000) + 100000,
      detectionTimeHrs: Math.floor(Math.random() * 200) + 10, containmentTimeHrs: Math.floor(Math.random() * 150) + 5,
      recoveryTimeHrs: Math.floor(Math.random() * 500) + 50, recordsAffected: Math.floor(Math.random() * 500000) + 10000,
      regulatoryFine: Math.floor(Math.random() * 3000000) + 200000, reputationCost: Math.floor(Math.random() * 2000000) + 500000,
      legalCost: Math.floor(Math.random() * 1500000) + 100000, notificationCost: Math.floor(Math.random() * 800000) + 50000,
      forensicsCost: Math.floor(Math.random() * 400000) + 50000, totalAnnualExposure: 0, frequency: Math.floor(Math.random() * 5) + 1
    }));
    this._trmoCostModel.forEach(m => { m.totalAnnualExposure = m.avgCost * m.frequency; });
  }

  private _trmoCostProjection(): Record<string, unknown>[] {
    return this._trmoCostModel.map(m => ({
      incident: m.incident, avgCost: m.avgCost, annualExposure: m.totalAnnualExposure,
      frequency: m.frequency, detectionHrs: m.detectionTimeHrs, recoveryHrs: m.recoveryTimeHrs,
      records: m.recordsAffected, regulatory: m.regulatoryFine,
      roiOfInvestment: Math.round(m.avgCost * 0.15 / 100000), priority: m.totalAnnualExposure > 10000000 ? "critical" : m.totalAnnualExposure > 5000000 ? "high" : "medium"
    })).sort((a: any, b: any) => (b.annualExposure as number) - (a.annualExposure as number));
  }

  // --- TRMO Security Architecture Pattern Library ---
  private _initTrmoArchPatterns(): void {
    const patterns = ["Defense in Depth", "Zero Trust Network", "Microsegmentation", "Layered Encryption", "Blast Radius Minimization", "Fail Secure Design", "Least Privilege Access", "Secure-by-Default"];
    this._trmoArchPatterns = patterns.map((p, i) => ({
      pattern: p, category: ["network", "identity", "network", "data", "architecture", "design", "identity", "development"][i],
      maturity: ["optimized", "managed", "defined", "managed", "repeatable", "defined", "managed", "repeatable"][i],
      implementation: Math.floor(Math.random() * 40) + 55, coverage: Math.floor(Math.random() * 30) + 60,
      components: Math.floor(Math.random() * 15) + 5, integrationPoints: Math.floor(Math.random() * 20) + 3,
      riskReduction: Math.floor(Math.random() * 25) + 60, costComplexity: ["low", "high", "medium", "medium", "high", "low", "medium", "medium"][i],
      dependencies: patterns.slice(0, Math.floor(Math.random() * 3)).filter(x => x !== p),
      lastReview: "2026-0" + String(Math.floor(Math.random() * 4) + 1) + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")
    }));
  }

  private _trmoArchPatternAnalysis(): Record<string, unknown> {
    const implemented = this._trmoArchPatterns.filter(p => p.implementation > 75).length;
    const avgCoverage = Math.round(this._trmoArchPatterns.reduce((s: number, p: any) => s + p.coverage, 0) / this._trmoArchPatterns.length);
    return {
      totalPatterns: this._trmoArchPatterns.length, fullyImplemented: implemented, avgCoverage,
      avgRiskReduction: Math.round(this._trmoArchPatterns.reduce((s: number, p: any) => s + p.riskReduction, 0) / this._trmoArchPatterns.length),
      gaps: this._trmoArchPatterns.filter(p => p.implementation < 60).map(p => p.pattern),
      recommendations: this._trmoArchPatterns.filter(p => p.implementation < 70).map(p => ({ pattern: p.pattern, current: p.implementation, target: 85, effort: p.costComplexity }))
    };
  }




  // === Security Investment Prioritization Module ===
  private _investmentProposals: Array<{id:string;title:string;category:string;estimatedCost:number;annualSavings:number;roi:number;riskReduction:number;complexity:string;timeline:string;resources:number;status:string;score:number;priority:number}> = [];
  private _investmentCategories: Array<{name:string;budget:number;allocated:number;remaining:number;color:string}> = [];
  private _investmentRoadmap: Array<{quarter:string;proposals:string[];totalBudget:number;expectedRiskReduction:number}> = [];

  private _initInvestmentPrioritization(): void {
    this._investmentProposals = [
      {id:'INV-001',title:'Zero Trust Network Architecture',category:'Infrastructure',estimatedCost:450000,annualSavings:280000,roi:62.2,riskReduction:28,complexity:'high',timeline:'Q2-Q4 2026',resources:8,status:'approved',score:94,priority:1},
      {id:'INV-002',title:'AI-Powered Threat Detection Platform',category:'Detection',estimatedCost:320000,annualSavings:210000,roi:65.6,riskReduction:24,complexity:'medium',timeline:'Q2-Q3 2026',resources:5,status:'approved',score:91,priority:2},
      {id:'INV-003',title:'Cloud Security Posture Management',category:'Cloud',estimatedCost:180000,annualSavings:150000,roi:83.3,riskReduction:18,complexity:'low',timeline:'Q2 2026',resources:3,status:'in-progress',score:89,priority:3},
      {id:'INV-004',title:'Security Awareness Training Platform',category:'People',estimatedCost:120000,annualSavings:95000,roi:79.2,riskReduction:15,complexity:'low',timeline:'Q2 2026',resources:2,status:'approved',score:85,priority:4},
      {id:'INV-005',title:'Endpoint Detection and Response Upgrade',category:'Endpoint',estimatedCost:250000,annualSavings:175000,roi:70.0,riskReduction:22,complexity:'medium',timeline:'Q3 2026',resources:4,status:'planned',score:83,priority:5},
      {id:'INV-006',title:'Data Loss Prevention Enhancement',category:'Data',estimatedCost:200000,annualSavings:140000,roi:70.0,riskReduction:20,complexity:'medium',timeline:'Q3 2026',resources:4,status:'planned',score:81,priority:6},
      {id:'INV-007',title:'Vulnerability Management Automation',category:'Vulnerability',estimatedCost:150000,annualSavings:120000,roi:80.0,riskReduction:16,complexity:'low',timeline:'Q2-Q3 2026',resources:3,status:'in-progress',score:80,priority:7},
      {id:'INV-008',title:'Security Orchestration and Automation',category:'Operations',estimatedCost:280000,annualSavings:200000,roi:71.4,riskReduction:14,complexity:'high',timeline:'Q3-Q4 2026',resources:6,status:'planned',score:78,priority:8},
      {id:'INV-009',title:'Identity and Access Management Modernization',category:'Identity',estimatedCost:350000,annualSavings:220000,roi:62.9,riskReduction:25,complexity:'high',timeline:'Q3-Q4 2026',resources:7,status:'evaluation',score:76,priority:9},
      {id:'INV-010',title:'Third-Party Risk Management Platform',category:'Vendor',estimatedCost:90000,annualSavings:70000,roi:77.8,riskReduction:12,complexity:'low',timeline:'Q2 2026',resources:2,status:'approved',score:74,priority:10},
      {id:'INV-011',title:'Security Metrics and Reporting Dashboard',category:'Governance',estimatedCost:75000,annualSavings:50000,roi:66.7,riskReduction:8,complexity:'low',timeline:'Q2 2026',resources:2,status:'in-progress',score:72,priority:11},
      {id:'INV-012',title:'Incident Response Retainer Expansion',category:'Services',estimatedCost:200000,annualSavings:100000,roi:50.0,riskReduction:10,complexity:'low',timeline:'Q2 2026',resources:1,status:'approved',score:70,priority:12}
    ];
    this._investmentCategories = [
      {name:'Infrastructure',budget:500000,allocated:450000,remaining:50000,color:'#4CAF50'},
      {name:'Detection',budget:400000,allocated:320000,remaining:80000,color:'#2196F3'},
      {name:'Cloud',budget:250000,allocated:180000,remaining:70000,color:'#FF9800'},
      {name:'People',budget:200000,allocated:120000,remaining:80000,color:'#9C27B0'},
      {name:'Endpoint',budget:300000,allocated:250000,remaining:50000,color:'#F44336'},
      {name:'Data',budget:250000,allocated:200000,remaining:50000,color:'#00BCD4'},
      {name:'Vulnerability',budget:200000,allocated:150000,remaining:50000,color:'#795548'},
      {name:'Operations',budget:350000,allocated:280000,remaining:70000,color:'#607D8B'},
      {name:'Identity',budget:400000,allocated:350000,remaining:50000,color:'#E91E63'},
      {name:'Vendor',budget:150000,allocated:90000,remaining:60000,color:'#3F51B5'},
      {name:'Governance',budget:100000,allocated:75000,remaining:25000,color:'#009688'},
      {name:'Services',budget:250000,allocated:200000,remaining:50000,color:'#FF5722'}
    ];
    this._investmentRoadmap = [
      {quarter:'Q2 2026',proposals:['INV-003','INV-004','INV-010','INV-011','INV-012'],totalBudget:665000,expectedRiskReduction:15},
      {quarter:'Q3 2026',proposals:['INV-002','INV-005','INV-006','INV-007'],totalBudget:1000000,expectedRiskReduction:22},
      {quarter:'Q4 2026',proposals:['INV-001','INV-008','INV-009'],totalBudget:1080000,expectedRiskReduction:18}
    ];
  }

  private _getInvestmentSummary(): {totalBudget:number;totalAllocated:number;totalSavings:number;avgRoi:number;topPriority:string} {
    const totalBudget = this._investmentCategories.reduce((s,c) => s + c.budget, 0);
    const totalAllocated = this._investmentCategories.reduce((s,c) => s + c.allocated, 0);
    const totalSavings = this._investmentProposals.reduce((s,p) => s + p.annualSavings, 0);
    const avgRoi = this._investmentProposals.reduce((s,p) => s + p.roi, 0) / this._investmentProposals.length;
    const topPriority = this._investmentProposals[0]?.title || '';
    return {totalBudget, totalAllocated, totalSavings, avgRoi: Math.round(avgRoi * 10) / 10, topPriority};
  }

  private _getComplexityBreakdown(): {low:number;medium:number;high:number} {
    return {
      low: this._investmentProposals.filter(p => p.complexity === 'low').length,
      medium: this._investmentProposals.filter(p => p.complexity === 'medium').length,
      high: this._investmentProposals.filter(p => p.complexity === 'high').length
    };
  }


  // --- Investment Risk-Return Analysis ---
  private _investmentRiskMatrix: Array<{id:string;title:string;riskLevel:string;returnLevel:string;quadrant:string;riskFactors:string[];returnDrivers:string[]}> = [];
  private _investmentBudgetUtilization: {totalAllocated:number;totalSpent:number;totalCommitted:number;available:number;burnRate:number;runwayMonths:number} = {totalAllocated:0,totalSpent:0,totalCommitted:0,available:0,burnRate:0,runwayMonths:0};
  private _investmentDependencies: Array<{from:string;to:string;type:string;description:string;status:string}> = [];
  private _investmentStakeholderFeedback: Array<{proposalId:string;stakeholder:string;role:string;sentiment:string;comments:string;rating:number}> = [];

  private _initInvestmentRiskReturn(): void {
    this._investmentRiskMatrix = [
      {id:'INV-001',title:'Zero Trust Network Architecture',riskLevel:'high',returnLevel:'high',quadrant:'Q1-Strategic',riskFactors:['Complex migration','Potential disruption','Skill gap','Vendor lock-in'],returnDrivers:['Reduced attack surface','Compliance alignment','Long-term cost savings']},
      {id:'INV-002',title:'AI-Powered Threat Detection',riskLevel:'medium',returnLevel:'high',quadrant:'Q2-Opportunistic',riskFactors:['Model accuracy','Integration complexity','Training data quality'],returnDrivers:['Faster detection','Reduced false positives','Automation of routine tasks']},
      {id:'INV-003',title:'Cloud Security Posture Management',riskLevel:'low',returnLevel:'medium',quadrant:'Q3-Efficiency',riskFactors:['Multi-cloud complexity','API rate limits'],returnDrivers:['Misconfiguration prevention','Compliance automation','Visibility improvement']},
      {id:'INV-004',title:'Security Awareness Training',riskLevel:'low',returnLevel:'medium',quadrant:'Q3-Efficiency',riskFactors:['Employee engagement','Content freshness'],returnDrivers:['Reduced phishing susceptibility','Culture improvement','Compliance requirement']},
      {id:'INV-005',title:'EDR Upgrade',riskLevel:'medium',returnLevel:'medium',quadrant:'Q2-Opportunistic',riskFactors:['Deployment disruption','Agent compatibility'],returnDrivers:['Better endpoint visibility','Automated response','Reduced incident impact']}
    ];
    this._investmentBudgetUtilization = {
      totalAllocated: 3450000,
      totalSpent: 890000,
      totalCommitted: 1250000,
      available: 1310000,
      burnRate: 285000,
      runwayMonths: 4.6
    };
    this._investmentDependencies = [
      {from:'INV-001',to:'INV-008',type:'enables',description:'Zero Trust architecture enables better SOAR automation',status:'pending'},
      {from:'INV-002',to:'INV-005',type:'enhances',description:'AI detection improves EDR correlation capabilities',status:'pending'},
      {from:'INV-003',to:'INV-001',type:'prerequisite',description:'Cloud security posture must be assessed before Zero Trust migration',status:'active'},
      {from:'INV-004',to:'INV-002',type:'supports',description:'Trained users reduce noise in AI detection system',status:'active'},
      {from:'INV-009',to:'INV-001',type:'complements',description:'Modern IAM complements Zero Trust network segmentation',status:'planned'}
    ];
    this._investmentStakeholderFeedback = [
      {proposalId:'INV-001',stakeholder:'CISO',role:'Executive Sponsor',sentiment:'positive',comments:'Critical for our security posture transformation',rating:5},
      {proposalId:'INV-001',stakeholder:'CTO',role:'Technical Lead',sentiment:'cautious',comments:'Migration timeline is aggressive, recommend phased approach',rating:3},
      {proposalId:'INV-002',stakeholder:'SOC Manager',role:'User',sentiment:'very positive',comments:'This would significantly reduce our analyst workload',rating:5},
      {proposalId:'INV-003',stakeholder:'Cloud Architect',role:'Technical Lead',sentiment:'positive',comments:'Essential for our multi-cloud strategy',rating:4},
      {proposalId:'INV-004',stakeholder:'HR Director',role:'Business Partner',sentiment:'positive',comments:'Strong support for improving security culture',rating:4},
      {proposalId:'INV-009',stakeholder:'IT Director',role:'Technical Lead',sentiment:'cautious',comments:'Concerned about user experience impact during transition',rating:3}
    ];
  }

  private _getInvestmentRiskSummary(): {highRisk:number;mediumRisk:number;lowRisk:number;avgStakeholderRating:number;topDependency:string} {
    const highRisk = this._investmentRiskMatrix.filter(r => r.riskLevel === 'high').length;
    const mediumRisk = this._investmentRiskMatrix.filter(r => r.riskLevel === 'medium').length;
    const avgRating = this._investmentStakeholderFeedback.reduce((s,f) => s + f.rating, 0) / this._investmentStakeholderFeedback.length;
    const topDep = this._investmentDependencies.find(d => d.type === 'prerequisite' && d.status === 'active')?.description || 'none';
    return {highRisk, mediumRisk, lowRisk: this._investmentRiskMatrix.filter(r => r.riskLevel === 'low').length, avgStakeholderRating: Math.round(avgRating * 10) / 10, topDependency: topDep};
  }



  // === Security Orchestration Playbook Engine ===
  private _playbookDefinitions: Array<{id:string;name:string;category:string;triggerType:string;steps:number;avgExecutionTime:string;successRate:number;lastExecuted:string;version:number;author:string}> = [];
  private _playbookExecutions: Array<{id:string;playbookId:string;triggeredBy:string;startTime:string;endTime:string;status:string;duration:string;stepsCompleted:number;stepsTotal:number;error:string|null}> = [];
  private _playbookActions: Array<{id:string;name:string;type:string;integration:string;parameters:Record<string,string>;timeoutSec:number;retryCount:number;fallbackAction:string|null}> = [];
  private _playbookSchedules: Array<{id:string;playbookId:string;schedule:string;lastRun:string;nextRun:string;enabled:boolean;timezone:string}> = [];

  private _initPlaybookEngine(): void {
    this._playbookDefinitions = [
      {id:'PB-001',name:'Phishing Triage and Response',category:'Email Security',triggerType:'alert',steps:12,avgExecutionTime:'3.5 min',successRate:97.2,lastExecuted:'2026-04-23T12:30:00Z',version:4,author:'SOC Team'},
      {id:'PB-002',name:'Malware Containment Procedure',category:'Endpoint Security',triggerType:'alert',steps:18,avgExecutionTime:'8.2 min',successRate:94.8,lastExecuted:'2026-04-23T10:15:00Z',version:6,author:'Forensics Team'},
      {id:'PB-003',name:'Vulnerability Auto-Remediation',category:'Vulnerability Management',triggerType:'scheduled',steps:8,avgExecutionTime:'15.0 min',successRate:89.5,lastExecuted:'2026-04-23T06:00:00Z',version:3,author:'Patch Team'},
      {id:'PB-004',name:'User Account Lockout Investigation',category:'Identity',triggerType:'alert',steps:10,avgExecutionTime:'2.8 min',successRate:98.1,lastExecuted:'2026-04-23T13:05:00Z',version:5,author:'IAM Team'},
      {id:'PB-005',name:'Data Exfiltration Response',category:'Data Security',triggerType:'alert',steps:22,avgExecutionTime:'12.5 min',successRate:91.3,lastExecuted:'2026-04-22T22:30:00Z',version:7,author:'DLP Team'},
      {id:'PB-006',name:'Cloud Misconfiguration Remediation',category:'Cloud Security',triggerType:'scheduled',steps:14,avgExecutionTime:'6.8 min',successRate:86.7,lastExecuted:'2026-04-23T04:00:00Z',version:2,author:'Cloud SecOps'}
    ];
    this._playbookExecutions = [
      {id:'PE-001',playbookId:'PB-001',triggeredBy:'Alert: Phishing Email Detected',startTime:'2026-04-23T12:30:00Z',endTime:'2026-04-23T12:33:30Z',status:'completed',duration:'3m 30s',stepsCompleted:12,stepsTotal:12,error:null},
      {id:'PE-002',playbookId:'PB-002',triggeredBy:'Alert: Malware Signature Match',startTime:'2026-04-23T10:15:00Z',endTime:'2026-04-23T10:23:12Z',status:'completed',duration:'8m 12s',stepsCompleted:18,stepsTotal:18,error:null},
      {id:'PE-003',playbookId:'PB-003',triggeredBy:'Scheduled: Daily Vulnerability Scan',startTime:'2026-04-23T06:00:00Z',endTime:'2026-04-23T06:14:45Z',status:'completed',duration:'14m 45s',stepsCompleted:8,stepsTotal:8,error:null},
      {id:'PE-004',playbookId:'PB-004',triggeredBy:'Alert: Multiple Failed Logins',startTime:'2026-04-23T13:05:00Z',endTime:'2026-04-23T13:07:48Z',status:'completed',duration:'2m 48s',stepsCompleted:10,stepsTotal:10,error:null},
      {id:'PE-005',playbookId:'PB-005',triggeredBy:'Alert: Unusual Data Transfer',startTime:'2026-04-22T22:30:00Z',endTime:'2026-04-22T22:38:15Z',status:'completed',duration:'8m 15s',stepsCompleted:20,stepsTotal:22,error:'DLP agent timeout on workstation-089'}
    ];
    this._playbookActions = [
      {id:'ACT-PB-001',name:'Quarantine Email',type:'email_action',integration:'Microsoft 365',parameters:{action:'quarantine',sender_match:'true',notify_recipient:'true'},timeoutSec:30,retryCount:3,fallbackAction:'Move to Junk'},
      {id:'ACT-PB-002',name:'Isolate Endpoint',type:'endpoint_action',integration:'CrowdStrike Falcon',parameters:{action:'network_isolation',preserve_state:'true'},timeoutSec:60,retryCount:2,fallbackAction:'Block via Firewall'},
      {id:'ACT-PB-003',name:'Disable User Account',type:'identity_action',integration:'Azure AD',parameters:{action:'disable',revoke_sessions:'true',notify_manager:'true'},timeoutSec:30,retryCount:3,fallbackAction:'Block via IAM Policy'},
      {id:'ACT-PB-004',name:'Create JIRA Ticket',type:'ticket_action',integration:'JIRA Cloud',parameters:{project:'SEC',issue_type:'Task',priority:'High'},timeoutSec:45,retryCount:2,fallbackAction:'Send Slack Notification'},
      {id:'ACT-PB-005',name:'Enrich IOC with Threat Intel',type:'intel_action',integration:'VirusTotal API',parameters:{resource_type:'auto',include_reputation:'true'},timeoutSec:120,retryCount:1,fallbackAction:'Manual Enrichment'}
    ];
    this._playbookSchedules = [
      {id:'SCH-001',playbookId:'PB-003',schedule:'0 6 * * *',lastRun:'2026-04-23T06:00:00Z',nextRun:'2026-04-24T06:00:00Z',enabled:true,timezone:'UTC'},
      {id:'SCH-002',playbookId:'PB-006',schedule:'0 4 * * *',lastRun:'2026-04-23T04:00:00Z',nextRun:'2026-04-24T04:00:00Z',enabled:true,timezone:'UTC'},
      {id:'SCH-003',playbookId:'PB-001',schedule:'*/15 * * * *',lastRun:'2026-04-23T13:45:00Z',nextRun:'2026-04-23T14:00:00Z',enabled:true,timezone:'UTC'}
    ];
  }

  private _getPlaybookStats(): {totalPlaybooks:number;activeSchedules:number;avgSuccessRate:number;totalExecutionsToday:number;avgExecutionTime:string;needsAttention:number} {
    const avgSuccess = Math.round(this._playbookDefinitions.reduce((s,p) => s + p.successRate, 0) / this._playbookDefinitions.length * 10) / 10;
    const needsAttention = this._playbookDefinitions.filter(p => p.successRate < 90).length;
    return {totalPlaybooks: this._playbookDefinitions.length, activeSchedules: this._playbookSchedules.filter(s => s.enabled).length, avgSuccessRate: avgSuccess, totalExecutionsToday: this._playbookExecutions.length, avgExecutionTime: '7.9 min', needsAttention};
  }


  // === Cyber Kill Chain Analysis ===
  private _killChainStages: Array<{stage:string;description:string;detectionMethods:string[];mitigationActions:string[];currentThreatLevel:string;incidentCount:number;avgTimeInStage:string}> = [];
  private _killChainAttacks: Array<{id:string;name:string;stagesCompleted:string[];currentStage:string;progress:number;severity:string;targetAsset:string;startTime:string;estimatedImpact:number}> = [];
  private _killChainMetrics: {totalAttacksTracked:number;stoppedAtRecon:number;stoppedAtWeaponize:number;stoppedAtDeliver:number;stoppedAtExploit:number;stoppedAtInstall:number;stoppedAtCommand:number;stoppedAtExfiltrate:number;fullChainCompleted:number} = {totalAttacksTracked:0,stoppedAtRecon:0,stoppedAtWeaponize:0,stoppedAtDeliver:0,stoppedAtExploit:0,stoppedAtInstall:0,stoppedAtCommand:0,stoppedAtExfiltrate:0,fullChainCompleted:0};

  private _initKillChainAnalysis(): void {
    this._killChainStages = [
      {stage:'Reconnaissance',description:'Adversary researches target organization, systems, and vulnerabilities',detectionMethods:['Web analytics','DNS monitoring','Social media scanning','Honeypot alerts'],mitigationActions:['Minimize public exposure','Monitor dark web mentions','Deploy deception technology'],currentThreatLevel:'elevated',incidentCount:245,avgTimeInStage:'7-14 days'},
      {stage:'Weaponization',description:'Adversary creates malware payload or exploit tool targeting identified vulnerabilities',detectionMethods:['Threat intel feeds','YARA rules','Malware sandbox analysis'],mitigationActions:['Keep systems patched','Deploy application whitelisting','Maintain threat intel subscriptions'],currentThreatLevel:'moderate',incidentCount:89,avgTimeInStage:'3-5 days'},
      {stage:'Delivery',description:'Adversary transmits weaponized payload to target via email, web, or USB',detectionMethods:['Email filtering','Web proxy logs','Endpoint detection','Network IDS'],mitigationActions:['Email security gateway','Web filtering','User awareness training','Endpoint protection'],currentThreatLevel:'high',incidentCount:312,avgTimeInStage:'1-2 days'},
      {stage:'Exploitation',description:'Payload exploits vulnerability on target system',detectionMethods:['IDS/IPS alerts','Endpoint detection','Vulnerability scanner','SIEM correlation'],mitigationActions:['Patch management','Application hardening','Exploit prevention','Runtime protection'],currentThreatLevel:'high',incidentCount:156,avgTimeInStage:'minutes to hours'},
      {stage:'Installation',description:'Adversary installs backdoor or persistent access mechanism',detectionMethods:['File integrity monitoring','Process monitoring','Registry monitoring','Scheduled task audit'],mitigationActions:['Application whitelisting','File integrity monitoring','Privilege restriction','EDR solutions'],currentThreatLevel:'high',incidentCount:78,avgTimeInStage:'hours'},
      {stage:'Command and Control',description:'Adversary establishes communication channel for remote command execution',detectionMethods:['Network traffic analysis','DNS monitoring','Beacon detection','SSL inspection'],mitigationActions:['Egress filtering','DNS filtering','Network segmentation','Proxy enforcement'],currentThreatLevel:'high',incidentCount:67,avgTimeInStage:'days to weeks'},
      {stage:'Actions on Objectives',description:'Adversary achieves goals: data exfiltration, encryption, or destruction',detectionMethods:['DLP alerts','Anomaly detection','Data access monitoring','Network flow analysis'],mitigationActions:['DLP controls','Data encryption','Access controls','Backup verification'],currentThreatLevel:'critical',incidentCount:34,avgTimeInStage:'hours to days'}
    ];
    this._killChainAttacks = [
      {id:'KCA-001',name:'APT29 Spear Phishing Campaign',stagesCompleted:['Reconnaissance','Weaponization','Delivery'],currentStage:'Exploitation',progress:42,severity:'critical',targetAsset:'Executive Email',startTime:'2026-04-18T08:00:00Z',estimatedImpact:4500000},
      {id:'KCA-002',name:'FIN7 POS Malware Deployment',stagesCompleted:['Reconnaissance','Weaponization','Delivery','Exploitation','Installation'],currentStage:'Command and Control',progress:71,severity:'high',targetAsset:'POS Systems',startTime:'2026-04-15T14:00:00Z',estimatedImpact:2800000},
      {id:'KCA-003',name:'Ransomware-as-a-Service Operation',stagesCompleted:['Reconnaissance','Delivery','Exploitation'],currentStage:'Installation',progress:57,severity:'critical',targetAsset:'File Servers',startTime:'2026-04-20T22:00:00Z',estimatedImpact:8500000}
    ];
    this._killChainMetrics = {totalAttacksTracked:892,stoppedAtRecon:312,stoppedAtWeaponize:89,stoppedAtDeliver:245,stoppedAtExploit:156,stoppedAtInstall:78,stoppedAtCommand:45,stoppedAtExfiltrate:34,fullChainCompleted:3};
  }

  private _getKillChainSummary(): {totalTracked:number;interruptionRate:number;mostCommonStopStage:string;fullChainRate:number;topActiveAttack:string} {
    const interruptionRate = Math.round(((this._killChainMetrics.totalTrackedTracked - this._killChainMetrics.fullChainCompleted) / this._killChainMetrics.totalTrackedTracked) * 10000) / 100;
    return {totalTracked: this._killChainMetrics.totalTrackedTracked, interruptionRate, mostCommonStopStage:'Delivery', fullChainRate: 0.34, topActiveAttack: this._killChainAttacks.sort((a,b) => b.progress - a.progress)[0]?.name || ''};
  }


  private _060RiskAssessmentWorkflow = [
    {step: 1, name: 'Scope and Boundary Definition', desc: 'Define the assessment scope including organizational boundaries, asset coverage, regulatory context, and engagement parameters with all stakeholder agreement documented', status: 'completed' as const, owner: 'Risk Lead', effort: '2h', output: 'Scope document with boundary diagram and stakeholder register', evidence: ['scope-doc.pdf', 'boundary-diagram.png']},
    {step: 2, name: 'Comprehensive Asset Discovery', desc: 'Discover and catalog all assets within scope including infrastructure, applications, data stores, APIs, and third-party integrations with criticality and sensitivity ratings', status: 'completed' as const, owner: 'Asset Team', effort: '4h', output: 'Complete asset inventory with business impact ratings and data classification', evidence: ['asset-inventory.xlsx', 'data-classification-map.pdf']},
    {step: 3, name: 'Threat Intelligence Integration', desc: 'Integrate current threat intelligence feeds, industry-specific threat reports, MITRE ATT&CK mappings, and historical incident data to build comprehensive threat landscape model', status: 'completed' as const, owner: 'Threat Intel', effort: '6h', output: 'Threat landscape model with actor profiles, TTP library, and scenario catalog', evidence: ['threat-model.pdf', 'ttp-library.json', 'actor-profiles.xlsx']},
    {step: 4, name: 'Vulnerability and Control Assessment', desc: 'Assess vulnerabilities against assets using automated scanning, manual testing, configuration audits, and control effectiveness measurements from all available sources', status: 'in_progress' as const, owner: 'Vuln Team', effort: '8h', output: 'Vulnerability assessment report with CVSS scoring and control gap analysis', evidence: ['vuln-report.pdf', 'control-gaps.xlsx', 'cvss-trends.png']},
    {step: 5, name: 'Impact Quantification and Financial Modeling', desc: 'Quantify business impact for each risk scenario including direct financial loss, operational disruption, reputational damage, regulatory penalties, and third-party liability', status: 'pending' as const, owner: 'Business Analysis', effort: '4h', output: 'Financial impact model with scenario-based loss estimates and probability distributions', evidence: ['financial-model.xlsx', 'impact-scenarios.pdf']},
    {step: 6, name: 'Likelihood Calibration and Validation', desc: 'Calibrate likelihood estimates using historical data, threat intelligence confidence levels, control effectiveness metrics, and peer benchmarking from industry sources', status: 'pending' as const, owner: 'Risk Analyst', effort: '3h', output: 'Calibrated likelihood ratings with confidence intervals and supporting evidence matrix', evidence: ['likelihood-calibration.xlsx', 'evidence-matrix.pdf']},
    {step: 7, name: 'Composite Risk Scoring and Heat Map', desc: 'Calculate composite risk scores using 5x5 matrix, generate risk heat maps by category and business unit, and identify top risks for executive attention and resource allocation', status: 'pending' as const, owner: 'Risk Lead', effort: '2h', output: 'Risk heat maps, prioritized risk register, and executive risk dashboard data', evidence: ['risk-heatmap.png', 'risk-register.xlsx', 'exec-dashboard.pdf']},
    {step: 8, name: 'Treatment Strategy and Resource Planning', desc: 'Develop treatment strategies for each risk with detailed implementation plans, resource requirements, cost-benefit analysis, timeline estimates, and expected residual risk levels', status: 'pending' as const, owner: 'CISO', effort: '3h', output: 'Treatment strategy document with implementation roadmap and budget requirements', evidence: ['treatment-strategy.pdf', 'roadmap.xlsx', 'budget-estimate.xlsx']},
    {step: 9, name: 'Control Architecture and Remediation Planning', desc: 'Map existing controls to risk register using NIST CSF taxonomy, identify control gaps, design remediation plans with architectural diagrams and integration points', status: 'pending' as const, owner: 'GRC Team', effort: '4h', output: 'Control architecture diagram, gap analysis report, and prioritized remediation plan', evidence: ['control-arch.png', 'gap-analysis.pdf', 'remediation-plan.xlsx']},
    {step: 10, name: 'Executive Briefing and Register Finalization', desc: 'Present findings to executive leadership, obtain formal risk acceptance decisions, update enterprise risk register, and schedule continuous monitoring and next review cycle', status: 'pending' as const, owner: 'CISO', effort: '2h', output: 'Executive briefing presentation, finalized risk register, and monitoring schedule', evidence: ['exec-briefing.pptx', 'risk-register-final.xlsx', 'monitoring-schedule.pdf']}
  ];

  private _060RiskMatrix5x5 = [
    {impact: 'Negligible', likelihood: 'Rare', score: 1, color: 'green', desc: 'Minimal business impact, easily absorbed by normal operations', example: 'Minor policy violation with no data exposure'},
    {impact: 'Negligible', likelihood: 'Almost Certain', score: 5, color: 'yellow', desc: 'Frequent minor incidents that cumulatively may indicate systemic issues', example: 'Repeated low-severity scan findings on non-critical systems'},
    {impact: 'Minor', likelihood: 'Rare', score: 2, color: 'green', desc: 'Small operational inconvenience with minimal financial impact', example: 'Temporary service degradation on non-critical application'},
    {impact: 'Minor', likelihood: 'Likely', score: 8, color: 'yellow', desc: 'Regular occurrence of minor incidents affecting business operations', example: 'Recurring phishing clicks by small number of users'},
    {impact: 'Moderate', likelihood: 'Possible', score: 9, color: 'yellow', desc: 'Notable business disruption with measurable financial impact requiring management attention', example: 'Ransomware infection on departmental file server with backup recovery'},
    {impact: 'Major', likelihood: 'Unlikely', score: 8, color: 'yellow', desc: 'Significant business impact with substantial financial and operational consequences', example: 'Data breach affecting customer PII with regulatory notification required'},
    {impact: 'Major', likelihood: 'Likely', score: 16, color: 'orange', desc: 'Severe and recurring impact threatening key business operations and stakeholder confidence', example: 'Persistent insider threat exfiltrating sensitive data over extended period'},
    {impact: 'Catastrophic', likelihood: 'Possible', score: 15, color: 'orange', desc: 'Existential threat to business continuity with potential for permanent damage', example: 'Critical infrastructure compromise causing extended operational shutdown'},
    {impact: 'Catastrophic', likelihood: 'Likely', score: 20, color: 'red', desc: 'Critical and imminent threat requiring immediate executive intervention and crisis management', example: 'Active ransomware campaign encrypting all production systems simultaneously'},
    {impact: 'Catastrophic', likelihood: 'Almost Certain', score: 25, color: 'red', desc: 'Maximum risk level requiring immediate all-hands response and potential business closure consideration', example: 'Zero-day exploit in core platform with active exploitation and no available patch'}
  ];

  private _060TreatmentOptions = [
    {id: '060-T-001', riskId: 'RSK-042', risk: 'Ransomware Attack on Critical Infrastructure', before: 20, after: 6, strategy: 'Mitigate', controls: ['Next-gen EDR with behavioral detection and automated response', 'Zero-trust network micro-segmentation isolating critical assets', 'Immutable offline backup rotation with quarterly recovery testing', 'Incident response retainer with 1-hour response SLA'], cost: '$450K/yr', roi: '78% reduction vs $2.8M potential loss', timeline: 'Q3 2026', status: 'approved' as const},
    {id: '060-T-002', riskId: 'RSK-018', risk: 'Insider Data Exfiltration via Cloud Storage', before: 15, after: 5, strategy: 'Mitigate', controls: ['Comprehensive DLP policies for all cloud applications and endpoints', 'UEBA behavioral analytics for anomalous access pattern detection', 'Endpoint restrictions on USB and personal cloud storage services', 'CASB integration for shadow IT discovery and policy enforcement'], cost: '$180K/yr', roi: '67% reduction vs $1.2M potential loss', timeline: 'Q2 2026', status: 'approved' as const},
    {id: '060-T-003', riskId: 'RSK-067', risk: 'Supply Chain Compromise via Third-Party Component', before: 12, after: 8, strategy: 'Transfer', controls: ['Software supply chain insurance policy covering vendor incidents', 'SCA scanning requirements in all vendor procurement contracts', 'SBOM requirements and continuous monitoring for third-party components', 'Vendor security assessment program with annual re-evaluation'], cost: '$95K/yr', roi: '33% reduction vs $800K potential loss', timeline: 'Q4 2026', status: 'in_review' as const},
    {id: '060-T-004', riskId: 'RSK-033', risk: 'Phishing-Driven Credential Theft Campaign', before: 16, after: 4, strategy: 'Mitigate', controls: ['AI-powered email filtering with real-time threat intelligence feeds', 'Monthly mandatory phishing simulations with targeted follow-up training', 'Hardware MFA enforcement across all users with passwordless transition', 'Security awareness program with role-specific training tracks'], cost: '$120K/yr', roi: '75% reduction vs $1.5M potential loss', timeline: 'Q2 2026', status: 'approved' as const},
    {id: '060-T-005', riskId: 'RSK-091', risk: 'Zero-Day Exploit on Public-Facing Application', before: 10, after: 8, strategy: 'Accept', controls: ['WAF with virtual patching capability and rapid rule deployment', 'RASP runtime application self-protection on all production web apps', 'Incident response retainer with 4-hour response SLA commitment', 'Bug bounty program for proactive vulnerability discovery'], cost: '$60K/yr', roi: '20% reduction vs $500K potential loss', timeline: 'Ongoing', status: 'accepted' as const},
    {id: '060-T-006', riskId: 'RSK-055', risk: 'GDPR Regulatory Non-Compliance Penalty', before: 15, after: 4, strategy: 'Mitigate', controls: ['Dedicated Data Protection Officer with quarterly board reporting', 'Automated compliance monitoring platform with real-time dashboards', 'Quarterly DPIA reviews for all high-risk processing activities', 'Privacy by design framework integrated into product development lifecycle'], cost: '$220K/yr', roi: '73% reduction vs $4M+ potential regulatory penalty', timeline: 'Q3 2026', status: 'approved' as const}
  ];

  private _060ComplianceRules = [
    {id: '060-C-001', name: 'Password Policy Compliance', framework: 'NIST 800-53 IA-5', desc: 'Verify all accounts meet minimum password complexity, length, diversity, and rotation requirements defined in the security policy', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'pass' as const, passRate: 94.2, violations: 12, autoFix: true as const, fix: 'Force password reset within 24h', history: [{d: '04-22', r: 'pass', v: 12}, {d: '04-21', r: 'pass', v: 14}, {d: '04-20', r: 'fail', v: 18}, {d: '04-19', r: 'pass', v: 15}, {d: '04-18', r: 'pass', v: 13}]},
    {id: '060-C-002', name: 'MFA Enrollment Verification', framework: 'NIST 800-53 IA-2', desc: 'Ensure all privileged and standard user accounts have multi-factor authentication properly enrolled and actively enforced', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'fail' as const, passRate: 87.5, violations: 34, autoFix: true as const, fix: 'Send mandatory enrollment notice with 48h deadline', history: [{d: '04-22', r: 'fail', v: 34}, {d: '04-21', r: 'fail', v: 31}, {d: '04-20', r: 'fail', v: 28}, {d: '04-19', r: 'fail', v: 25}, {d: '04-18', r: 'fail', v: 22}]},
    {id: '060-C-003', name: 'Inactive Account Review', framework: 'NIST 800-53 AC-2', desc: 'Identify and disable accounts inactive for more than 90 days with automatic escalation at the 120-day threshold', enabled: true as const, freq: 'Weekly', lastRun: '2026-04-21T00:00Z', result: 'pass' as const, passRate: 96.8, violations: 5, autoFix: true as const, fix: 'Auto-disable at 120 days with manager notification', history: [{d: '04-21', r: 'pass', v: 5}, {d: '04-14', r: 'pass', v: 7}, {d: '04-07', r: 'pass', v: 9}, {d: '03-31', r: 'pass', v: 11}, {d: '03-24', r: 'pass', v: 13}]},
    {id: '060-C-004', name: 'Encryption Standards Check', framework: 'NIST 800-53 SC-28', desc: 'Verify all production storage volumes use AES-256 or equivalent encryption with valid non-expired certificates', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'pass' as const, passRate: 99.1, violations: 2, autoFix: false as const, fix: 'Create priority ticket for manual remediation', history: [{d: '04-22', r: 'pass', v: 2}, {d: '04-21', r: 'pass', v: 2}, {d: '04-20', r: 'pass', v: 3}, {d: '04-19', r: 'pass', v: 3}, {d: '04-18', r: 'pass', v: 4}]},
    {id: '060-C-005', name: 'Firewall Baseline Compliance', framework: 'NIST 800-53 SC-7', desc: 'Validate firewall rules against approved baseline to detect unauthorized modifications, drift, or orphaned rules', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T06:00Z', result: 'fail' as const, passRate: 91.3, violations: 18, autoFix: true as const, fix: 'Auto-revert non-compliant rules to baseline', history: [{d: '04-22', r: 'fail', v: 18}, {d: '04-21', r: 'pass', v: 12}, {d: '04-20', r: 'pass', v: 15}, {d: '04-19', r: 'pass', v: 14}, {d: '04-18', r: 'fail', v: 20}]},
    {id: '060-C-006', name: 'Patch SLA Compliance', framework: 'CIS Benchmark L2', desc: 'Check all production systems against critical and high patch SLA requirements with overdue flagging', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T08:00Z', result: 'pass' as const, passRate: 97.6, violations: 8, autoFix: false as const, fix: 'Escalate overdue patches for expedited deployment', history: [{d: '04-22', r: 'pass', v: 8}, {d: '04-21', r: 'pass', v: 10}, {d: '04-20', r: 'pass', v: 12}, {d: '04-19', r: 'pass', v: 11}, {d: '04-18', r: 'pass', v: 14}]},
    {id: '060-C-007', name: 'Data Classification Labels', framework: 'GDPR Art. 30', desc: 'Verify all databases, file shares, and cloud repositories have appropriate classification labels applied', enabled: true as const, freq: 'Weekly', lastRun: '2026-04-20T00:00Z', result: 'fail' as const, passRate: 82.4, violations: 45, autoFix: false as const, fix: 'Generate review tasks for data owners', history: [{d: '04-20', r: 'fail', v: 45}, {d: '04-13', r: 'fail', v: 42}, {d: '04-06', r: 'fail', v: 38}, {d: '03-30', r: 'fail', v: 35}, {d: '03-23', r: 'pass', v: 30}]},
    {id: '060-C-008', name: 'Privileged Access Review', framework: 'SOX AC-6', desc: 'Review and validate all privileged access assignments on quarterly recertification schedule', enabled: true as const, freq: 'Monthly', lastRun: '2026-04-01T00:00Z', result: 'pass' as const, passRate: 93.7, violations: 22, autoFix: false as const, fix: 'Initiate recertification workflow with approvals', history: [{d: '04-01', r: 'pass', v: 22}, {d: '03-01', r: 'pass', v: 25}, {d: '02-01', r: 'pass', v: 28}, {d: '01-01', r: 'pass', v: 30}, {d: '12-01', r: 'pass', v: 32}]},
    {id: '060-C-009', name: 'SIEM Log Coverage', framework: 'NIST 800-53 AU-2', desc: 'Verify all critical systems have logging enabled and actively forwarding to the centralized SIEM platform', enabled: true as const, freq: 'Weekly', lastRun: '2026-04-21T12:00Z', result: 'pass' as const, passRate: 95.5, violations: 7, autoFix: true as const, fix: 'Deploy missing log agents via config management', history: [{d: '04-21', r: 'pass', v: 7}, {d: '04-14', r: 'pass', v: 9}, {d: '04-07', r: 'pass', v: 11}, {d: '03-31', r: 'pass', v: 10}, {d: '03-24', r: 'pass', v: 13}]},
    {id: '060-C-010', name: 'Certificate Expiry Monitor', framework: 'NIST 800-53 SC-13', desc: 'Monitor all TLS/SSL certificates for upcoming expiry within 30-day warning windows', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'pass' as const, passRate: 98.9, violations: 3, autoFix: true as const, fix: 'Trigger auto-renewal via ACME protocol', history: [{d: '04-22', r: 'pass', v: 3}, {d: '04-21', r: 'pass', v: 3}, {d: '04-20', r: 'pass', v: 4}, {d: '04-19', r: 'pass', v: 4}, {d: '04-18', r: 'pass', v: 5}]}
  ];

  private _060TalentPositions = [
    {id: '060-H-001', title: 'Senior Penetration Tester', dept: 'Red Team', level: 'Senior', loc: 'Remote US', salary: '$165K-$195K', posted: '2026-03-15', applicants: 23, pipeline: 8, interviews: 4, offers: 1, urgency: 'high' as const, manager: 'Alex Chen', skills: ['Burp Suite', 'Metasploit', 'Cobalt Strike', 'Python', 'OWASP Top 10'], nice: ['OSCP/OSCE', 'Bug bounty', 'Cloud pentest']},
    {id: '060-H-002', title: 'Cloud Security Engineer', dept: 'Cloud Security', level: 'Mid-Senior', loc: 'SF/Remote', salary: '$155K-$180K', posted: '2026-03-20', applicants: 45, pipeline: 12, interviews: 6, offers: 2, urgency: 'high' as const, manager: 'Mike Johnson', skills: ['AWS/Azure/GCP', 'Terraform', 'Kubernetes', 'IAM', 'CSPM'], nice: ['CCSP', 'CKS', 'Serverless']},
    {id: '060-H-003', title: 'SOC Analyst L2', dept: 'Security Operations', level: 'Mid', loc: 'Austin TX', salary: '$105K-$130K', posted: '2026-04-01', applicants: 67, pipeline: 18, interviews: 8, offers: 0, urgency: 'medium' as const, manager: 'Lisa Park', skills: ['SIEM', 'Incident triage', 'Malware analysis', 'TCP/IP'], nice: ['GCIA', 'SOAR', 'Kill chain']},
    {id: '060-H-004', title: 'Staff Security Architect', dept: 'Architecture', level: 'Staff', loc: 'Remote US', salary: '$200K-$240K', posted: '2026-02-28', applicants: 12, pipeline: 3, interviews: 2, offers: 0, urgency: 'critical' as const, manager: 'David Lee', skills: ['Enterprise arch', 'Zero trust', 'Risk frameworks', 'Board comms'], nice: ['CISSP+SABSA', 'Team building', 'Speaker']},
    {id: '060-H-005', title: 'GRC Analyst', dept: 'GRC', level: 'Mid', loc: 'NY/Remote', salary: '$110K-$135K', posted: '2026-04-05', applicants: 34, pipeline: 9, interviews: 3, offers: 1, urgency: 'medium' as const, manager: 'Rachel Green', skills: ['ISO 27001', 'SOC 2', 'Risk assessment', 'Audit'], nice: ['CRISC', 'CISA', 'GDPR']},
    {id: '060-H-006', title: 'Threat Intel Analyst', dept: 'Threat Intel', level: 'Mid-Senior', loc: 'Remote US', salary: '$140K-$170K', posted: '2026-03-25', applicants: 19, pipeline: 5, interviews: 2, offers: 0, urgency: 'low' as const, manager: 'James Wilson', skills: ['MITRE ATT&CK', 'OSINT', 'Threat modeling', 'Reverse eng'], nice: ['CTIA', 'Nation-state', 'Dark web']},
    {id: '060-H-007', title: 'AppSec Engineer', dept: 'AppSec', level: 'Senior', loc: 'Seattle/Remote', salary: '$160K-$190K', posted: '2026-04-10', applicants: 28, pipeline: 7, interviews: 3, offers: 0, urgency: 'medium' as const, manager: 'Emily Zhang', skills: ['SAST/DAST/SCA', 'Secure SDLC', 'Code review', 'CI/CD'], nice: ['CSSLP', 'Mobile security']},
    {id: '060-H-008', title: 'IAM Engineer', dept: 'IAM', level: 'Mid', loc: 'Remote US', salary: '$135K-$160K', posted: '2026-04-08', applicants: 31, pipeline: 10, interviews: 5, offers: 1, urgency: 'medium' as const, manager: 'Chris Martinez', skills: ['Okta/Azure AD', 'SAML/OIDC', 'PAM', 'RBAC'], nice: ['CISSP', 'Zero trust IAM']}
  ];

  private _060InterviewScorecard = [
    {category: 'Technical Proficiency', weight: 40, criteria: [
      {name: 'Core Security Knowledge', max: 10, desc: 'Understanding of security fundamentals, NIST/ISO frameworks, and industry best practices across multiple domains'},
      {name: 'Hands-on Technical Skills', max: 10, desc: 'Practical ability with security tools, scripting languages, and technical problem-solving under pressure'},
      {name: 'Domain-Specific Expertise', max: 10, desc: 'Depth of knowledge and practical experience in the specific role domain being hired for'},
      {name: 'Incident Response Thinking', max: 10, desc: 'Systematic approach to analyzing security incidents and proposing effective response strategies'}
    ]},
    {category: 'Communication', weight: 20, criteria: [
      {name: 'Technical Explanation Clarity', max: 10, desc: 'Ability to explain complex security concepts to both technical and non-technical audiences effectively'},
      {name: 'Written Documentation', max: 10, desc: 'Quality of security documentation, reports, and written analysis demonstrated during the process'}
    ]},
    {category: 'Cultural Fit', weight: 20, criteria: [
      {name: 'Cross-functional Collaboration', max: 10, desc: 'Track record of working effectively with development, operations, and business stakeholders'},
      {name: 'Growth Mindset', max: 10, desc: 'Commitment to continuous learning, professional development, and proactive knowledge sharing'}
    ]},
    {category: 'Experience', weight: 20, criteria: [
      {name: 'Relevant Experience', max: 10, desc: 'Quality, breadth, and relevance of past security industry work experience at comparable organizations'},
      {name: 'Certifications', max: 10, desc: 'Relevant industry certifications and academic background supporting the role requirements'}
    ]}
  ];

  private _060OnboardingSteps = [
    {id: '060-OB-01', item: 'Provision security-hardened laptop, monitors, peripherals, and configured workstation image with all required security tools', cat: 'IT Setup', day: 'Day 1', owner: 'IT Operations'},
    {id: '060-OB-02', item: 'Create AD account, email, Slack, VPN, SSO enrollment, and all required application access accounts', cat: 'Access', day: 'Day 1', owner: 'IAM Team'},
    {id: '060-OB-03', item: 'Grant security tooling access: SIEM console, EDR dashboard, vuln scanner, pentest platforms, SOAR', cat: 'Tools', day: 'Day 1-2', owner: 'SOC Manager'},
    {id: '060-OB-04', item: 'Complete MFA enrollment, security awareness onboarding course, and acceptable use policy acknowledgment', cat: 'Security', day: 'Day 1', owner: 'Awareness Team'},
    {id: '060-OB-05', item: 'Sign NDA, employment agreement, IP assignment, and code of conduct documents with HR', cat: 'HR', day: 'Day 1', owner: 'Human Resources'},
    {id: '060-OB-06', item: 'Introduction meetings with direct team members and key cross-functional stakeholders', cat: 'Integration', day: 'Week 1', owner: 'Hiring Manager'},
    {id: '060-OB-07', item: 'Security architecture overview, tooling walkthrough, and operational runbook review sessions', cat: 'Training', day: 'Week 1-2', owner: 'Security Architect'},
    {id: '060-OB-08', item: 'Shadow experienced team member on active incident response and threat hunting investigations', cat: 'Mentoring', day: 'Week 2-3', owner: 'SOC Lead'},
    {id: '060-OB-09', item: 'Set up individual certification study plan aligned with role requirements and career goals', cat: 'Development', day: 'Week 2', owner: 'Hiring Manager'},
    {id: '060-OB-10', item: 'Establish 30-60-90 day goals, define success metrics, and schedule first performance checkpoint', cat: 'Goals', day: 'Week 1', owner: 'Hiring Manager'}
  ];

  private _060MetricsDashboard = [
    {id: '060-MTD-001', name: 'Mean Time to Detect (MTTD)', value: '4.2 hours', trend: 'improving' as const, target: '< 4 hours', source: 'SIEM - Splunk', method: 'Median time from first alert to analyst acknowledgment', owner: 'SOC Manager', sla: '4 hours', prev: '5.1 hours', spark: [5.8, 5.4, 5.1, 4.9, 4.7, 4.5, 4.3, 4.2], breakdown: [{src: 'Network IDS', pct: '35%', avg: '3.8h'}, {src: 'Endpoint EDR', pct: '28%', avg: '4.1h'}, {src: 'Email Gateway', pct: '22%', avg: '3.5h'}, {src: 'Cloud Security', pct: '10%', avg: '5.2h'}, {src: 'User Reports', pct: '5%', avg: '6.8h'}]},
    {id: '060-MTD-002', name: 'Mean Time to Respond (MTTR)', value: '2.8 hours', trend: 'stable' as const, target: '< 3 hours', source: 'SOAR - XSOAR', method: 'Median time from acknowledgment to first containment action', owner: 'IR Lead', sla: '3 hours', prev: '2.7 hours', spark: [3.2, 3.0, 2.9, 2.8, 2.8, 2.9, 2.8, 2.8], breakdown: [{src: 'Auto Playbooks', pct: '42%', avg: '1.2h'}, {src: 'Semi-Auto', pct: '33%', avg: '2.5h'}, {src: 'Manual', pct: '20%', avg: '5.1h'}, {src: 'L3 Escalation', pct: '5%', avg: '8.3h'}]},
    {id: '060-MTD-003', name: 'Patch Compliance Rate', value: '97.6%', trend: 'improving' as const, target: '> 95%', source: 'Tenable.io', method: 'Pct of critical/high vulns patched within SLA windows', owner: 'Vuln Manager', sla: '95%', prev: '96.1%', spark: [93.2, 94.1, 94.8, 95.3, 95.9, 96.4, 97.0, 97.6], breakdown: [{src: 'Critical (7d)', pct: '40%', rate: '99.2%'}, {src: 'High (30d)', pct: '35%', rate: '97.8%'}, {src: 'Medium (90d)', pct: '20%', rate: '95.1%'}, {src: 'Low (180d)', pct: '5%', rate: '89.4%'}]},
    {id: '060-MTD-004', name: 'Phishing Click Rate', value: '3.2%', trend: 'improving' as const, target: '< 5%', source: 'KnowBe4 + Proofpoint', method: 'Pct of users clicking simulated phishing links monthly', owner: 'Awareness Lead', sla: '5%', prev: '4.1%', spark: [6.8, 6.2, 5.5, 5.1, 4.6, 4.1, 3.6, 3.2], breakdown: [{src: 'Spear Phishing', pct: '35%', rate: '5.1%'}, {src: 'Generic Phishing', pct: '30%', rate: '2.8%'}, {src: 'BEC Sim', pct: '20%', rate: '3.5%'}, {src: 'SMS Phishing', pct: '15%', rate: '1.9%'}]},
    {id: '060-MTD-005', name: 'Security Posture Score', value: '784', trend: 'improving' as const, target: '> 750', source: 'SecurityScorecard', method: 'Composite: external 30%, compliance 25%, vuln 25%, config 20%', owner: 'CISO', sla: '> 750', prev: '771', spark: [748, 752, 758, 762, 768, 773, 778, 784], breakdown: [{src: 'External Rating', pct: '30%', score: '791'}, {src: 'Compliance', pct: '25%', score: '812'}, {src: 'Vuln Mgmt', pct: '25%', score: '745'}, {src: 'Config', pct: '20%', score: '769'}]},
    {id: '060-MTD-006', name: 'Vulnerability Backlog', value: '142', trend: 'improving' as const, target: '< 150', source: 'Tenable + Qualys', method: 'Total open vulns across all scanned assets tracked weekly', owner: 'Vuln Manager', sla: '< 150', prev: '168', spark: [210, 198, 185, 175, 165, 158, 150, 142], breakdown: [{src: 'Critical', pct: '8%', count: '11'}, {src: 'High', pct: '22%', count: '31'}, {src: 'Medium', pct: '45%', count: '64'}, {src: 'Low', pct: '25%', count: '36'}]}
  ];

  private _060ArchReview = [
    {id: '060-AR-001', cat: 'Network', item: 'Network segmentation between trust zones with dedicated firewalls and granular ACLs', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Micro-segmentation via NSX across all production zones'},
    {id: '060-AR-002', cat: 'Network', item: 'DMZ architecture isolating public services from internal network', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Dual-firewall DMZ with WAF and DDoS mitigation'},
    {id: '060-AR-003', cat: 'Network', item: 'Least-privilege traffic flows with deny-by-default and quarterly review', sev: 'high' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Explicit allow rules with automated drift detection'},
    {id: '060-AR-004', cat: 'Network', item: 'Encrypted external communications with IPSec/TLS 1.3 and PFS', sev: 'high' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'IKEv2 with PFS, TLS 1.3 for all external APIs'},
    {id: '060-AR-005', cat: 'Identity', item: 'Centralized IdP with SSO and automated SCIM provisioning', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'Okta SSO SAML 2.0 for 247 apps with SCIM'},
    {id: '060-AR-006', cat: 'Identity', item: 'RBAC with quarterly reviews and automated deprovisioning', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'Quarterly recertification with JIT admin access'},
    {id: '060-AR-007', cat: 'Identity', item: 'PAM controlling all admin and service accounts with session recording', sev: 'high' as const, status: 'fail' as const, reviewer: 'IAM Lead', notes: '3 legacy accounts pending CyberArk enrollment'},
    {id: '060-AR-008', cat: 'Identity', item: 'MFA enforced for all users, hardware tokens for privileged access', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'FIDO2 for admins, push MFA for users, 99.8% enrollment'},
    {id: '060-AR-009', cat: 'Data', item: 'Data classification enforced with automated labeling on all repos', sev: 'high' as const, status: 'partial' as const, reviewer: 'Data Protection Lead', notes: 'Framework deployed, gaps on 4 legacy file shares'},
    {id: '060-AR-010', cat: 'Data', item: 'AES-256 encryption at rest for all sensitive data stores', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Data Protection Lead', notes: 'Full-disk, TDE on DBs, SSE-KMS on cloud storage'},
    {id: '060-AR-011', cat: 'Data', item: 'DLP monitoring and preventing unauthorized data exfiltration', sev: 'high' as const, status: 'pass' as const, reviewer: 'Data Protection Lead', notes: 'DLP active on email, endpoint, cloud, and network'},
    {id: '060-AR-012', cat: 'Data', item: 'Encrypted off-site backups with quarterly restore testing', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Infrastructure Lead', notes: '3-2-1 strategy with immutable backups'},
    {id: '060-AR-013', cat: 'AppSec', item: 'Secure SDLC with SAST, DAST, SCA in all CI/CD pipelines', sev: 'high' as const, status: 'pass' as const, reviewer: 'AppSec Lead', notes: '34 pipelines with security gates and PR blocking'},
    {id: '060-AR-014', cat: 'AppSec', item: 'API gateway with auth, rate limiting, schema validation', sev: 'high' as const, status: 'pass' as const, reviewer: 'AppSec Lead', notes: 'Kong with OAuth2, rate limits, OpenAPI validation'},
    {id: '060-AR-015', cat: 'AppSec', item: 'Container security with image scanning and runtime protection', sev: 'high' as const, status: 'partial' as const, reviewer: 'Cloud Security Lead', notes: 'Trivy scanning, Falco runtime in 80% of clusters'},
    {id: '060-AR-016', cat: 'Monitoring', item: 'SIEM collecting from all critical systems with correlation rules', sev: 'critical' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'Splunk 98% coverage with 1200+ correlation rules'},
    {id: '060-AR-017', cat: 'Monitoring', item: 'EDR with behavioral detection on all managed endpoints', sev: 'high' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'CrowdStrike on 99.2% endpoints with 24/7 MDR'},
    {id: '060-AR-018', cat: 'Monitoring', item: 'Executive dashboards with real-time posture visibility', sev: 'medium' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'PowerBI dashboards with weekly exec summaries'},
    {id: '060-AR-019', cat: 'Cloud', item: 'CSPM monitoring and remediating cloud misconfigurations', sev: 'high' as const, status: 'pass' as const, reviewer: 'Cloud Security Lead', notes: 'Prisma Cloud 450+ checks with auto-remediation'},
    {id: '060-AR-020', cat: 'Cloud', item: 'IaC templates scanned before deployment to production', sev: 'high' as const, status: 'partial' as const, reviewer: 'Cloud Security Lead', notes: 'Checkov for Terraform, cfn-nag for CloudFormation pending'}
  ];

  private _get060RiskProgress(): number {
    return Math.round(this._060RiskAssessmentWorkflow.filter(s => s.status === 'completed').length / this._060RiskAssessmentWorkflow.length * 100);
  }

  private _get060TreatmentSummary(): {total: number; approved: number; avgReduction: number; investment: string} {
    const a = this._060TreatmentOptions.filter(r => r.status === 'approved').length;
    const avg = this._060TreatmentOptions.reduce((s, r) => s + ((r.before - r.after) / r.before * 100), 0) / this._060TreatmentOptions.length;
    return {total: this._060TreatmentOptions.length, approved: a, avgReduction: Math.round(avg), investment: '$1.125M annually'};
  }

  private _get060RuleSummary(): {total: number; passing: number; failing: number; avgRate: number; violations: number} {
    const p = this._060ComplianceRules.filter(r => r.result === 'pass').length;
    const f = this._060ComplianceRules.filter(r => r.result === 'fail').length;
    const avg = this._060ComplianceRules.reduce((s, r) => s + r.passRate, 0) / this._060ComplianceRules.length;
    const v = this._060ComplianceRules.reduce((s, r) => s + r.violations, 0);
    return {total: this._060ComplianceRules.length, passing: p, failing: f, avgRate: Math.round(avg * 10) / 10, violations: v};
  }

  private _get060PipelineStats(): {positions: number; applicants: number; interviewing: number; offers: number; critical: number} {
    const t = this._060TalentPositions.length;
    const a = this._060TalentPositions.reduce((s, p) => s + p.applicants, 0);
    const i = this._060TalentPositions.reduce((s, p) => s + p.interviews, 0);
    const o = this._060TalentPositions.reduce((s, p) => s + p.offers, 0);
    const c = this._060TalentPositions.filter(x => x.urgency === 'critical').length;
    return {positions: t, applicants: a, interviewing: i, offers: o, critical: c};
  }

  private _get060MetricTrends(): {improving: number; stable: number; total: number} {
    const imp = this._060MetricsDashboard.filter(m => m.trend === 'improving').length;
    const stb = this._060MetricsDashboard.filter(m => m.trend === 'stable').length;
    return {improving: imp, stable: stb, total: this._060MetricsDashboard.length};
  }

  private _get060ArchScore(): {total: number; passed: number; failed: number; partial: number; score: number} {
    const p = this._060ArchReview.filter(c => c.status === 'pass').length;
    const f = this._060ArchReview.filter(c => c.status === 'fail').length;
    const pa = this._060ArchReview.filter(c => c.status === 'partial').length;
    return {total: this._060ArchReview.length, passed: p, failed: f, partial: pa, score: Math.round((p / this._060ArchReview.length) * 100)};
  }


  private _z060IncidentScenarios = [
    {id: 'z060-IS-001', name: 'Ransomware Outbreak in Production Environment', category: 'Malware', likelihood: 'Medium', impact: 'Critical', riskScore: 15, playbooks: ['IR-Ransomware-Isolate', 'IR-Ransomware-Eradicate', 'IR-Ransomway-Recover'], estimatedMTTD: '15min', estimatedMTTR: '4h', involvedTeams: ['SOC', 'IR', 'Infrastructure', 'Legal', 'Comms'], keyIndicators: ['Mass file encryption events', 'Ransom note deployment', 'Lateral movement via SMB/RDP', 'Backup deletion attempts'], mitigationControls: ['EDR behavioral detection', 'Network segmentation', 'Immutable backups', 'Email filtering'], lessonsLearned: 'Ensure offline backups are tested quarterly and Ransomware-specific playbooks are updated with latest threat intelligence', lastDrillDate: '2026-03-15', nextDrillDate: '2026-06-15'},
    {id: 'z060-IS-002', name: 'Cloud Misconfiguration Leading to Data Exposure', category: 'Cloud', likelihood: 'High', impact: 'High', riskScore: 16, playbooks: ['IR-Cloud-Misconfig-Assess', 'IR-Cloud-Misconfig-Remediate', 'IR-Cloud-Misconfig-Notify'], estimatedMTTD: '2h', estimatedMTTR: '6h', involvedTeams: ['Cloud Security', 'SOC', 'Data Protection', 'Legal'], keyIndicators: ['Public S3 bucket exposure', 'Overly permissive IAM policies', 'Unencrypted database snapshots', 'Public API endpoint discovery'], mitigationControls: ['CSPM monitoring', 'IAM policy analyzer', 'Automated remediation', 'Cloud audit logging'], lessonsLearned: 'Implement CSPM with auto-remediation for common misconfigurations and conduct monthly cloud configuration reviews', lastDrillDate: '2026-02-20', nextDrillDate: '2026-05-20'},
    {id: 'z060-IS-003', name: 'Insider Threat Data Exfiltration', category: 'Insider', likelihood: 'Low', impact: 'Critical', riskScore: 12, playbooks: ['IR-Insider-Investigate', 'IR-Insider-Contain', 'IR-Insider-Escalate'], estimatedMTTD: '8h', estimatedMTTR: '24h', involvedTeams: ['SOC', 'IR', 'HR', 'Legal', 'IAM'], keyIndicators: ['Anomalous data access patterns', 'Large file downloads to USB or cloud', 'Off-hours access to sensitive systems', 'Accessing data outside normal job scope'], mitigationControls: ['UEBA analytics', 'DLP policies', 'PAM controls', 'Access reviews'], lessonsLearned: 'Strengthen UEBA baselines and implement automated alerts for data access pattern anomalies', lastDrillDate: '2026-01-10', nextDrillDate: '2026-04-10'},
    {id: 'z060-IS-004', name: 'Supply Chain Attack via Compromised Vendor Software', category: 'Supply Chain', likelihood: 'Low', impact: 'Critical', riskScore: 12, playbooks: ['IR-SupplyChain-Detect', 'IR-SupplyChain-Isolate', 'IR-SupplyChain-Remediate'], estimatedMTTD: '24h', estimatedMTTR: '72h', involvedTeams: ['SOC', 'IR', 'Procurement', 'Vendor Mgmt', 'Legal'], keyIndicators: ['Unexpected network connections from vendor software', 'Modified binaries or dependencies', 'Anomalous behavior from trusted applications', 'SBOM discrepancy alerts'], mitigationControls: ['SCA scanning', 'SBOM monitoring', 'Vendor security assessments', 'Network segmentation'], lessonsLearned: 'Require SBOM from all vendors and implement continuous monitoring of third-party component behavior', lastDrillDate: '2026-03-01', nextDrillDate: '2026-06-01'},
    {id: 'z060-IS-005', name: 'Credential Stuffing Attack on Customer Portal', category: 'External Attack', likelihood: 'High', impact: 'Medium', riskScore: 12, playbooks: ['IR-CredentialStuffing-Detect', 'IR-CredentialStuffing-Block', 'IR-CredentialStuffing-Notify'], estimatedMTTD: '30min', estimatedMTTR: '2h', involvedTeams: ['SOC', 'AppSec', 'Customer Support', 'Comms'], keyIndicators: ['High volume of failed login attempts', 'Login attempts from known compromised credential lists', 'Unusual geographic distribution of login attempts', 'Account takeover indicators'], mitigationControls: ['WAF rate limiting', 'CAPTCHA on login', 'MFA enforcement', 'Credential monitoring service'], lessonsLearned: 'Deploy advanced bot detection on login endpoints and implement proactive credential monitoring for customer accounts', lastDrillDate: '2026-04-01', nextDrillDate: '2026-07-01'},
    {id: 'z060-IS-006', name: 'Phishing Campaign Targeting Executive Team', category: 'Social Engineering', likelihood: 'High', impact: 'High', riskScore: 16, playbooks: ['IR-Phishing-Contain', 'IR-Phishing-Investigate', 'IR-Phishing-Notify'], estimatedMTTD: '1h', estimatedMTTR: '4h', involvedTeams: ['SOC', 'Awareness', 'Executive Office', 'IT'], keyIndicators: ['Sophisticated spear-phishing emails to C-suite', 'Business email compromise indicators', 'Redirected MFA approval requests', 'Unauthorized wire transfer attempts'], mitigationControls: ['AI email filtering', 'Executive awareness training', 'Out-of-band verification policy', 'DMARC/DKIM/SPF'], lessonsLearned: 'Implement additional email security controls for executive mailboxes and conduct monthly spear-phishing simulations', lastDrillDate: '2026-02-15', nextDrillDate: '2026-05-15'}
  ];

  private _z060SecurityFrameworks = [
    {name: 'NIST Cybersecurity Framework 2.0', version: '2.0', categories: ['Govern', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'], currentMaturity: 'Tier 3 - Repeatable', targetMaturity: 'Tier 4 - Adaptive', gaps: ['Supply chain risk management maturity', 'Continuous improvement feedback loop documentation', 'External dependency mapping completeness'], strengths: ['Strong detect and respond capabilities', 'Well-documented protect controls', 'Active vulnerability management program'], lastAssessment: '2026-03-01', nextAssessment: '2026-09-01', owner: 'CISO'},
    {name: 'ISO 27001:2022', version: '2022', categories: ['A.5 Organizational', 'A.6 People', 'A.7 Physical', 'A.8 Technological'], currentMaturity: 'Certified', targetMaturity: 'Certified with zero nonconformities', gaps: ['A.8.25 Secure development lifecycle documentation', 'A.5.23 Cloud services information security policy update', 'A.8.16 Monitoring activities completeness'], strengths: ['Clean certification audit with zero major nonconformities', 'Strong access control framework', 'Comprehensive incident management process'], lastAssessment: '2026-01-15', nextAssessment: '2027-01-15', owner: 'Compliance Officer'},
    {name: 'CIS Controls v8.1', version: '8.1', categories: ['IG1 (Essential Cyber Hygiene)', 'IG2 (Expanded)', 'IG3 (Comprehensive)'], currentMaturity: 'IG2 - 87% Implementation', targetMaturity: 'IG3 - 95% Implementation', gaps: ['Control 4.8 - Uninterruptible Power Supply monitoring', 'Control 13.3 - Application software security testing automation', 'Control 16.9 - Adversary emulation testing frequency'], strengths: ['Strong IG1 implementation at 98%', 'Comprehensive inventory and control management', 'Active continuous monitoring and response'], lastAssessment: '2026-04-01', nextAssessment: '2026-10-01', owner: 'Security Architect'},
    {name: 'MITRE ATT&CK v14.1', version: '14.1', categories: ['Enterprise', 'Mobile', 'ICS'], currentMaturity: 'Detection coverage 72%', targetMaturity: 'Detection coverage 90%', gaps: ['Collection techniques detection coverage', 'Command and control channel identification', 'Impact technique prevention controls'], strengths: ['Strong initial access detection', 'Comprehensive persistence monitoring', 'Active threat hunting program aligned to ATT&CK'], lastAssessment: '2026-02-01', nextAssessment: '2026-05-01', owner: 'Threat Intelligence Lead'}
  ];

  private _z060ThirdPartyRiskData = [
    {vendorId: 'z060-V-001', vendorName: 'CloudFlare Inc', category: 'CDN and DDoS Protection', tier: 'Critical', riskScore: 22, assessmentDate: '2026-03-15', nextReview: '2026-06-15', findings: ['Shared responsibility model documentation needs update', 'Incident notification SLA verification required'], controls: ['SOC 2 Type II certified', 'ISO 27001 certified', 'Annual penetration testing'], slaCompliance: '99.99% uptime SLA met', dataProcessing: 'Minimal PII access, no data storage', status: 'approved' as const},
    {vendorId: 'z060-V-002', vendorName: 'Okta Inc', category: 'Identity Provider', tier: 'Critical', riskScore: 18, assessmentDate: '2026-02-28', nextReview: '2026-05-28', findings: ['MFA bypass vulnerability remediation verified', 'API rate limiting configuration reviewed'], controls: ['SOC 2 Type II certified', 'FedRAMP authorized', 'Bug bounty program active'], slaCompliance: '99.95% uptime SLA met', dataProcessing: 'Identity data processing with DPA in place', status: 'approved' as const},
    {vendorId: 'z060-V-003', vendorName: 'CrowdStrike Holdings', category: 'Endpoint Detection and Response', tier: 'Critical', riskScore: 15, assessmentDate: '2026-03-01', nextReview: '2026-06-01', findings: ['Sensor performance optimization review completed', 'Data retention policy aligned with requirements'], controls: ['SOC 2 Type II certified', 'ISO 27001 certified', 'Independent code review'], slaCompliance: 'All SLAs met within defined thresholds', dataProcessing: 'Telemetry data only, no customer content access', status: 'approved' as const},
    {vendorId: 'z060-V-004', vendorName: 'AnalyticsPro Corp', category: 'Business Intelligence', tier: 'High', riskScore: 28, assessmentDate: '2026-01-15', nextReview: '2026-04-15', findings: ['Data residency requirements not fully documented', 'Sub-processor list needs update with new acquisitions', 'Encryption key management review pending'], controls: ['SOC 2 Type II pending renewal', 'GDPR compliance self-assessed'], slaCompliance: '98.5% uptime - below 99% target', dataProcessing: 'Extensive customer data access for analytics processing', status: 'conditional' as const},
    {vendorId: 'z060-V-005', vendorName: 'MarketingTech LLC', category: 'Email Marketing Platform', tier: 'Medium', riskScore: 35, assessmentDate: '2025-12-01', nextReview: '2026-03-01', findings: ['Outdated security assessment - 4 months overdue', 'No current SOC 2 certification', 'Data processing agreement expired', 'Sub-processor transparency report not available'], controls: ['Self-assessed security questionnaire', 'Basic encryption standards'], slaCompliance: '96% uptime - below contractual SLA', dataProcessing: 'Full customer contact list access with email sending capabilities', status: 'remediation_required' as const}
  ];

  private _z060SecurityTrainingCatalog = [
    {id: 'z060-TR-001', title: 'Security Awareness Fundamentals', audience: 'All Employees', duration: '45 min', frequency: 'Annual', completionRate: 94.2, passingScore: 80, avgScore: 87, modules: ['Security threats overview', 'Phishing identification', 'Social engineering awareness', 'Data handling best practices', 'Incident reporting procedures'], lastUpdated: '2026-01-15', nextUpdate: '2027-01-15', platform: 'KnowBe4'},
    {id: 'z060-TR-002', title: 'Advanced Phishing Defense', audience: 'All Employees', duration: '30 min', frequency: 'Quarterly', completionRate: 91.8, passingScore: 90, avgScore: 82, modules: ['Spear phishing recognition', 'BEC identification', 'Vishing and smishing awareness', 'Verify before you trust framework'], lastUpdated: '2026-03-01', nextUpdate: '2026-06-01', platform: 'KnowBe4'},
    {id: 'z060-TR-003', title: 'Secure Coding Practices', audience: 'Development Teams', duration: '4 hours', frequency: 'Annual', completionRate: 88.5, passingScore: 75, avgScore: 81, modules: ['OWASP Top 10 deep dive', 'Secure SDLC integration', 'Code review best practices', 'Dependency management', 'Security testing methodologies'], lastUpdated: '2026-02-01', nextUpdate: '2027-02-01', platform: 'Internal LMS'},
    {id: 'z060-TR-004', title: 'Incident Response Training', audience: 'SOC and IR Teams', duration: '8 hours', frequency: 'Quarterly', completionRate: 96.7, passingScore: 85, avgScore: 91, modules: ['IR process and procedures', 'Evidence handling and chain of custody', 'Communication protocols', 'Tabletop exercise scenarios', 'Tool proficiency assessment'], lastUpdated: '2026-04-01', nextUpdate: '2026-07-01', platform: 'Internal LMS + Range'},
    {id: 'z060-TR-005', title: 'Cloud Security Fundamentals', audience: 'DevOps and Cloud Teams', duration: '3 hours', frequency: 'Annual', completionRate: 85.2, passingScore: 75, avgScore: 78, modules: ['Cloud shared responsibility model', 'IAM best practices', 'Network security in the cloud', 'Data protection and encryption', 'Compliance in cloud environments'], lastUpdated: '2026-01-01', nextUpdate: '2027-01-01', platform: 'Internal LMS'},
    {id: 'z060-TR-006', title: 'Executive Security Briefing', audience: 'C-Suite and Board', duration: '1 hour', frequency: 'Quarterly', completionRate: 100.0, passingScore: 0, avgScore: 0, modules: ['Current threat landscape', 'Security posture update', 'Risk register review', 'Upcoming security initiatives', 'Compliance status summary'], lastUpdated: '2026-04-01', nextUpdate: '2026-07-01', platform: 'In-person/Video'}
  ];

  private _z060SecurityToolInventory = [
    {id: 'z060-TL-001', name: 'Splunk Enterprise Security', category: 'SIEM', version: '9.1.2', license: 'Enterprise', annualCost: '$285K', users: 45, coverage: '98% of critical log sources', integrations: ['CrowdStrike', 'Okta', 'AWS CloudTrail', 'Azure AD', 'Proofpoint'], health: 'healthy' as const, lastMaintenance: '2026-04-15', nextMaintenance: '2026-07-15', owner: 'SOC Manager'},
    {id: 'z060-TL-002', name: 'CrowdStrike Falcon', category: 'EDR/XDR', version: '7.12', license: 'Enterprise', annualCost: '$320K', users: 2800, coverage: '99.2% of managed endpoints', integrations: ['Splunk', 'ServiceNow', 'Okta', 'Palo Alto Networks'], health: 'healthy' as const, lastMaintenance: '2026-04-10', nextMaintenance: '2026-07-10', owner: 'Endpoint Security Lead'},
    {id: 'z060-TL-003', name: 'Tenable.io', category: 'Vulnerability Management', version: '6.14', license: 'Enterprise', annualCost: '$180K', users: 25, coverage: 'All production and staging assets', integrations: ['Splunk', 'ServiceNow', 'Jira', 'Slack'], health: 'healthy' as const, lastMaintenance: '2026-04-12', nextMaintenance: '2026-07-12', owner: 'Vulnerability Manager'},
    {id: 'z060-TL-004', name: 'Prisma Cloud', category: 'CSPM/CWPP', version: '32.1', license: 'Enterprise', annualCost: '$240K', users: 18, coverage: 'AWS, Azure, GCP environments', integrations: ['AWS Security Hub', 'Azure Defender', 'Splunk', 'Jira'], health: 'degraded' as const, lastMaintenance: '2026-04-08', nextMaintenance: '2026-07-08', owner: 'Cloud Security Lead'},
    {id: 'z060-TL-005', name: 'KnowBe4 Platform', category: 'Security Awareness', version: 'Current', license: 'Enterprise', annualCost: '$85K', users: 3200, coverage: 'All employees', integrations: ['Okta SCIM', 'Slack', 'HRIS system'], health: 'healthy' as const, lastMaintenance: '2026-04-05', nextMaintenance: '2026-07-05', owner: 'Awareness Lead'},
    {id: 'z060-TL-006', name: 'CyberArk Privileged Access Manager', category: 'PAM', version: '12.2', license: 'Enterprise', annualCost: '$195K', users: 350, coverage: 'All privileged accounts', integrations: ['Active Directory', 'Splunk', 'ServiceNow', 'Okta'], health: 'healthy' as const, lastMaintenance: '2026-04-18', nextMaintenance: '2026-07-18', owner: 'IAM Lead'}
  ];

  private _getz060ScenarioSummary(): {total: number; critical: number; high: number; drilled: number; avgRiskScore: number} {
    const crit = this._z060IncidentScenarios.filter(s => s.impact === 'Critical').length;
    const high = this._z060IncidentScenarios.filter(s => s.impact === 'High').length;
    const avg = this._z060IncidentScenarios.reduce((s, x) => s + x.riskScore, 0) / this._z060IncidentScenarios.length;
    return {total: this._z060IncidentScenarios.length, critical: crit, high: high, drilled: this._z060IncidentScenarios.length, avgRiskScore: Math.round(avg)};
  }

  private _getz060VendorRiskSummary(): {total: number; approved: number; conditional: number; remediation: number; avgScore: number} {
    const approved = this._z060ThirdPartyRiskData.filter(v => v.status === 'approved').length;
    const cond = this._z060ThirdPartyRiskData.filter(v => v.status === 'conditional').length;
    const rem = this._z060ThirdPartyRiskData.filter(v => v.status === 'remediation_required').length;
    const avg = this._z060ThirdPartyRiskData.reduce((s, v) => s + v.riskScore, 0) / this._z060ThirdPartyRiskData.length;
    return {total: this._z060ThirdPartyRiskData.length, approved, conditional: cond, remediation: rem, avgScore: Math.round(avg)};
  }

  private _getz060TrainingSummary(): {total: number; avgCompletion: number; avgScore: number; overdueUpdates: number} {
    const avgComp = this._z060SecurityTrainingCatalog.reduce((s, t) => s + t.completionRate, 0) / this._z060SecurityTrainingCatalog.length;
    const avgScore = this._z060SecurityTrainingCatalog.filter(t => t.avgScore > 0).reduce((s, t) => s + t.avgScore, 0) / this._z060SecurityTrainingCatalog.filter(t => t.avgScore > 0).length;
    return {total: this._z060SecurityTrainingCatalog.length, avgCompletion: Math.round(avgComp * 10) / 10, avgScore: Math.round(avgScore), overdueUpdates: 0};
  }

  private _getz060ToolHealthSummary(): {total: number; healthy: number; degraded: number; annualCost: string} {
    const healthy = this._z060SecurityToolInventory.filter(t => t.health === 'healthy').length;
    const degraded = this._z060SecurityToolInventory.filter(t => t.health === 'degraded').length;
    const cost = this._z060SecurityToolInventory.reduce((s, t) => s + parseInt(t.annualCost.replace(/[^0-9]/g, '')), 0);
    return {total: this._z060SecurityToolInventory.length, healthy, degraded, annualCost: '$' + (cost / 1000).toFixed(0) + 'K'};
  }


  private _x060SecurityZones = [
    {zoneId: 'x060-Z-001', name: 'Internet DMZ', trustLevel: 'Untrusted', subnet: '10.0.0.0/24', segmentation: 'Dual-firewall', firewallRules: 45, monitoring: 'Full packet capture', assets: ['Web servers', 'Load balancers', 'WAF appliances', 'Reverse proxy'], riskLevel: 'high' as const, lastAssessment: '2026-04-15', nextAssessment: '2026-07-15'},
    {zoneId: 'x060-Z-002', name: 'Corporate Network', trustLevel: 'Trusted', subnet: '10.1.0.0/16', segmentation: 'VLAN + micro-seg', firewallRules: 128, monitoring: 'NetFlow + IDS', assets: ['Workstations', 'Printers', 'Meeting room systems', 'VoIP phones'], riskLevel: 'medium' as const, lastAssessment: '2026-04-10', nextAssessment: '2026-07-10'},
    {zoneId: 'x060-Z-003', name: 'Production Data Center', trustLevel: 'Restricted', subnet: '10.2.0.0/16', segmentation: 'Full micro-segmentation', firewallRules: 256, monitoring: 'Full packet capture + EDR', assets: ['Application servers', 'Database clusters', 'Message queues', 'API gateways'], riskLevel: 'low' as const, lastAssessment: '2026-04-12', nextAssessment: '2026-07-12'},
    {zoneId: 'x060-Z-004', name: 'Management Network', trustLevel: 'Restricted', subnet: '10.3.0.0/24', segmentation: 'Isolated VLAN', firewallRules: 32, monitoring: 'Syslog + SNMP', assets: ['Hypervisors', 'Switch management', 'Storage controllers', 'Backup appliances'], riskLevel: 'low' as const, lastAssessment: '2026-04-08', nextAssessment: '2026-07-08'},
    {zoneId: 'x060-Z-005', name: 'Cloud Production', trustLevel: 'Restricted', subnet: 'VPC: 172.16.0.0/12', segmentation: 'Security groups + NACLs', firewallRules: 189, monitoring: 'VPC Flow Logs + GuardDuty', assets: ['Kubernetes clusters', 'Managed databases', 'Object storage', 'Serverless functions'], riskLevel: 'medium' as const, lastAssessment: '2026-04-18', nextAssessment: '2026-07-18'}
  ];

  private _x060SecurityAlerts = [
    {id: 'x060-AL-001', severity: 'critical', title: 'Active ransomware encryption detected on PROD-DB-01', source: 'CrowdStrike', timestamp: '2026-04-22T13:45:00Z', status: 'investigating', assignee: 'SOC Analyst J. Smith', asset: 'PROD-DB-01 (10.2.1.15)', mitreTechnique: 'T1486 - Data Encrypted for Impact', playbook: 'IR-Ransomware-Isolate', sla: '15 minutes', elapsed: '12 minutes', notes: 'EDR detected mass file encryption event pattern. Automated isolation triggered. IR team paged.'},
    {id: 'x060-AL-002', severity: 'high', title: 'Impossible travel detected for user admin@company.com', source: 'Okta', timestamp: '2026-04-22T12:30:00Z', status: 'triaged', assignee: 'SOC Analyst M. Johnson', asset: 'Okta - admin@company.com', mitreTechnique: 'T1078 - Valid Accounts', playbook: 'IR-ImpossibleTravel', sla: '30 minutes', elapsed: '87 minutes', notes: 'Login from Tokyo followed by login from New York within 30 minutes. Account temporarily locked. User confirmed via out-of-band channel they are in New York.'},
    {id: 'x060-AL-003', severity: 'high', title: 'Public S3 bucket discovered with customer PII exposure', source: 'Prisma Cloud', timestamp: '2026-04-22T11:15:00Z', status: 'remediating', assignee: 'Cloud Security Lead A. Chen', asset: 'AWS S3: customer-data-archive-2024', mitreTechnique: 'N/A - Misconfiguration', playbook: 'IR-Cloud-Misconfig-Remediate', sla: '1 hour', elapsed: '2.5 hours', notes: 'Bucket containing archived customer records was publicly accessible. Bucket blocked and encrypted. Data exposure assessment in progress.'},
    {id: 'x060-AL-004', severity: 'medium', title: 'Anomalous data download by user jane.developer@company.com', source: 'Microsoft DLP', timestamp: '2026-04-22T10:00:00Z', status: 'investigating', assignee: 'SOC Analyst R. Davis', asset: 'Endpoint: WS-DEV-042', mitreTechnique: 'T1567 - Exfil Over Web Service', playbook: 'IR-DLP-Investigation', sla: '4 hours', elapsed: '3.5 hours', notes: 'User downloaded 4.2GB of source code files to personal Google Drive. Interview scheduled with user and manager.'},
    {id: 'x060-AL-005', severity: 'medium', title: 'Credential stuffing attack detected on customer portal', source: 'Cloudflare WAF', timestamp: '2026-04-22T09:30:00Z', status: 'contained', assignee: 'SOC Analyst K. Wilson', asset: 'Customer Portal (portal.company.com)', mitreTechnique: 'T1110 - Brute Force', playbook: 'IR-CredentialStuffing-Block', sla: '2 hours', elapsed: '4 hours', notes: 'Rate limiting and CAPTCHA automatically deployed. 12,000 failed login attempts from 800 unique IPs blocked. No successful account takeovers confirmed.'},
    {id: 'x060-AL-006', severity: 'low', title: 'SSL certificate expiring in 14 days for api.company.com', source: 'Certificate monitoring', timestamp: '2026-04-22T08:00:00Z', status: 'remediated', assignee: 'Infrastructure Lead T. Brown', asset: 'api.company.com', mitreTechnique: 'N/A', playbook: 'Certificate Renewal', sla: '30 days', elapsed: '16 days', notes: 'Automated renewal triggered via ACME. New certificate deployed successfully. No service interruption.'}
  ];

  private _x060ComplianceFrameworks = [
    {name: 'PCI DSS v4.0', status: 'compliant' as const, lastAudit: '2026-02-15', nextAudit: '2027-02-15', requirements: 250, compliant: 248, partiallyCompliant: 2, nonCompliant: 0, keyGaps: ['Requirement 6.4.3 - Additional verification for changes to payment pages', 'Requirement 12.3.1 - Targeted risk analysis frequency documentation'], remediationOwner: 'Compliance Officer', estimatedRemediation: 'Q3 2026'},
    {name: 'HIPAA Security Rule', status: 'compliant' as const, lastAudit: '2026-01-20', nextAudit: '2027-01-20', requirements: 78, compliant: 76, partiallyCompliant: 2, nonCompliant: 0, keyGaps: ['Administrative safeguards - workforce security training documentation', 'Technical safeguards - audit control review frequency'], remediationOwner: 'Privacy Officer', estimatedRemediation: 'Q2 2026'},
    {name: 'SOC 2 Type II', status: 'compliant' as const, lastAudit: '2026-03-01', nextAudit: '2027-03-01', requirements: 64, compliant: 63, partiallyCompliant: 1, nonCompliant: 0, keyGaps: ['CC6.1 - Logical access security for production systems documentation update'], remediationOwner: 'GRC Team', estimatedRemediation: 'Q2 2026'},
    {name: 'GDPR', status: 'mostly_compliant' as const, lastAudit: '2026-04-01', nextAudit: '2026-10-01', requirements: 99, compliant: 94, partiallyCompliant: 4, nonCompliant: 1, keyGaps: ['Article 30 - Records of processing activities update', 'Article 35 - DPIA for new AI processing', 'Article 32 - Security of processing documentation', 'Article 33 - 72-hour breach notification procedure test'], remediationOwner: 'DPO', estimatedRemediation: 'Q3 2026'}
  ];

  private _x060DataClassificationPolicy = [
    {level: 'Public', description: 'Information approved for public disclosure with no restrictions on access or distribution', color: 'green', examples: ['Marketing materials', 'Press releases', 'Public financial reports', 'Published research papers'], handling: ['No access restrictions', 'Standard handling procedures', 'No encryption required for transmission'], retention: 'Per business need', owner: 'Communications Team'},
    {level: 'Internal', description: 'Information intended for internal use within the organization that could cause minimal harm if disclosed', color: 'blue', examples: ['Internal policies', 'Meeting notes', 'Project documentation', 'Internal newsletters'], handling: ['Access restricted to employees', 'No external sharing without approval', 'Standard encryption for external transmission'], retention: '3-7 years', owner: 'Department Heads'},
    {level: 'Confidential', description: 'Sensitive information that could cause significant harm to the organization or individuals if disclosed', color: 'yellow', examples: ['Customer PII', 'Financial data', 'Employee records', 'Business strategy documents', 'Vendor contracts'], handling: ['Need-to-know access only', 'Encryption required at rest and in transit', 'DLP monitoring enabled', 'Audit logging mandatory'], retention: 'Per regulatory requirements', owner: 'Data Owners'},
    {level: 'Restricted', description: 'Highly sensitive information that could cause severe or catastrophic harm if disclosed', color: 'red', examples: ['Authentication credentials', 'Encryption keys', 'Trade secrets', 'M&A due diligence materials', 'Security vulnerability details'], handling: ['Strict need-to-know with CISO approval', 'End-to-end encryption mandatory', 'Air-gapped storage where possible', 'Enhanced monitoring and alerting', 'Multi-factor authentication required'], retention: 'Minimum necessary', owner: 'CISO'}
  ];

  private _getx060ZoneSummary(): {total: number; highRisk: number; mediumRisk: number; lowRisk: number; totalRules: number} {
    const high = this._x060SecurityZones.filter(z => z.riskLevel === 'high').length;
    const med = this._x060SecurityZones.filter(z => z.riskLevel === 'medium').length;
    const low = this._x060SecurityZones.filter(z => z.riskLevel === 'low').length;
    const rules = this._x060SecurityZones.reduce((s, z) => s + z.firewallRules, 0);
    return {total: this._x060SecurityZones.length, highRisk: high, mediumRisk: med, lowRisk: low, totalRules: rules};
  }

  private _getx060AlertSummary(): {total: number; critical: number; high: number; medium: number; low: number; open: number; contained: number} {
    const crit = this._x060SecurityAlerts.filter(a => a.severity === 'critical').length;
    const high = this._x060SecurityAlerts.filter(a => a.severity === 'high').length;
    const med = this._x060SecurityAlerts.filter(a => a.severity === 'medium').length;
    const low = this._x060SecurityAlerts.filter(a => a.severity === 'low').length;
    const open = this._x060SecurityAlerts.filter(a => a.status === 'investigating' || a.status === 'triaged').length;
    const contained = this._x060SecurityAlerts.filter(a => a.status === 'contained' || a.status === 'remediated').length;
    return {total: this._x060SecurityAlerts.length, critical: crit, high, medium: med, low, open, contained};
  }

  private _getx060ComplianceSummary(): {total: number; fullyCompliant: number; mostlyCompliant: number; avgComplianceRate: number} {
    const full = this._x060ComplianceFrameworks.filter(f => f.status === 'compliant').length;
    const mostly = this._x060ComplianceFrameworks.filter(f => f.status === 'mostly_compliant').length;
    const avgRate = this._x060ComplianceFrameworks.reduce((s, f) => s + (f.compliant / f.requirements * 100), 0) / this._x060ComplianceFrameworks.length;
    return {total: this._x060ComplianceFrameworks.length, fullyCompliant: full, mostlyCompliant: mostly, avgComplianceRate: Math.round(avgRate * 10) / 10};
  }

  // === Security Capacity Planning (Round 36 - Block C) ===
  private _cpTeams: Array<{id: string; name: string; headcount: number; allocated: number; utilization: number;
    skills: string[]; gapSkills: string[]; hiringPlan: number; trainingHours: number}> = [];
  private _cpBudget: {current: number; projected: number; tools: number; personnel: number; services: number} = {current: 0, projected: 0, tools: 0, personnel: 0, services: 0};
  private _cpLicenses: Array<{tool: string; total: number; used: number; expiring: number; cost: number}> = [];

  private _initCpCapacity() {
    const teams = ['SOC Operations', 'Threat Intelligence', 'Penetration Testing', 'GRC',
      'Cloud Security', 'Application Security', 'Identity & Access', 'Security Architecture'];
    const skills = [
      ['SIEM', 'EDR', 'Threat Hunting', 'DFIR'],
      ['OSINT', 'Malware Analysis', 'CTI Platforms', 'IOC Management'],
      ['Web App Testing', 'Network Pentesting', 'Red Team', 'Social Engineering'],
      ['ISO 27001', 'SOC 2', 'GDPR', 'Risk Assessment'],
      ['AWS Security', 'Azure Security', 'Kubernetes', 'Terraform'],
      ['SAST', 'DAST', 'Code Review', 'DevSecOps'],
      ['PAM', 'SSO', 'LDAP', 'Zero Trust'],
      ['Network Design', 'Microsegmentation', 'Cloud Architecture', 'Security Patterns']
    ];
    const gapSkills = [
      ['Cloud Forensics', 'AI/ML Detection'],
      ['Dark Web Monitoring', 'Threat Modeling'],
      ['Mobile Pentesting', 'IoT Security'],
      ['Privacy Engineering', 'AI Governance'],
      ['Serverless Security', 'Service Mesh'],
      ['API Security Testing', 'Supply Chain Security'],
      ['Passwordless Auth', 'Identity Analytics'],
      ['SASE Architecture', 'Zero Trust Networks']
    ];
    this._cpTeams = teams.map((name, i) => ({
      id: 'cp-team-' + i, name,
      headcount: 5 + ((idx + i * 3) % 12),
      allocated: 4 + ((idx + i * 2) % 10),
      utilization: 65 + ((idx * 7 + i * 13) % 30),
      skills: skills[i], gapSkills: gapSkills[i],
      hiringPlan: i % 3 === 0 ? 2 : i % 2 === 0 ? 1 : 0,
      trainingHours: 20 + ((idx + i) % 30)
    }));
    this._cpBudget = {
      current: 2500000 + idx * 50000,
      projected: 2800000 + idx * 75000,
      tools: 600000 + idx * 20000,
      personnel: 1500000 + idx * 30000,
      services: 400000 + idx * 10000
    };
    const tools = ['CrowdStrike', 'Splunk', 'Qualys', 'Veracode', 'Zscaler', 'Okta', 'Prisma Cloud', 'Wiz'];
    this._cpLicenses = tools.map((tool, i) => ({
      tool, total: 50 + ((idx + i * 7) % 100),
      used: 40 + ((idx + i * 5) % 80),
      expiring: i % 4 === 0 ? 5 + (idx % 3) : 0,
      cost: 50000 + ((idx + i * 11) % 150000)
    }));
  }

  private _cpGetUtilizationAvg(): number {
    return Math.round(this._cpTeams.reduce((s, t) => s + t.utilization, 0) / this._cpTeams.length);
  }

  private _cpGetTotalGaps(): number {
    return this._cpTeams.reduce((s, t) => s + t.gapSkills.length, 0);
  }

  private _cpGetHiringForecast(): Array<{quarter: string; planned: number; budget: number}> {
    return ['Q2 2026', 'Q3 2026', 'Q4 2026'].map((q, i) => ({
      quarter: q,
      planned: 2 + ((idx + i) % 4),
      budget: 180000 + (i * 20000) + (idx % 3) * 10000
    }));
  }

  private _cpGetLicenseUtilization(): {totalTools: number; overUtilized: number; underUtilized: number; renewalCost: number} {
    const over = this._cpLicenses.filter(l => (l.used / l.total) > 0.9).length;
    const under = this._cpLicenses.filter(l => (l.used / l.total) < 0.5).length;
    const renewal = this._cpLicenses.reduce((s, l) => s + (l.expiring > 0 ? l.cost : 0), 0);
    return {totalTools: this._cpLicenses.length, overUtilized: over, underUtilized: under, renewalCost: renewal};
  }


  // === Security Automation Engine (Round 36 - Pass 2 - Block E) ===

  private _saPlaybooks: Array<{id: string; name: string; category: string; triggers: number;
    autoActions: number; manualSteps: number; avgRuntime: number; successRate: number;
    lastRun: string; status: string}> = [];
  private _saWorkflows: Array<{id: string; name: string; steps: number; automated: number;
    integrations: string[]; schedule: string; enabled: boolean}> = [];

  private _initSaAutomation() {
    const playbooks = [
      {name: 'Phishing Triage & Response', category: 'SOC', triggers: ['Email Alert', 'User Report']},
      {name: 'Malware Containment', category: 'Endpoint', triggers: ['EDR Alert', 'AV Detection']},
      {name: 'Vulnerability Auto-Remediation', category: 'Vuln Mgmt', triggers: ['Qualys Scan', 'Tenable Alert']},
      {name: 'Cloud Security Incident', category: 'Cloud', triggers: ['GuardDuty', 'CloudTrail']},
      {name: 'Access Review Automation', category: 'IAM', triggers: ['Scheduled', 'HR Event']},
      {name: 'Compliance Evidence Collection', category: 'GRC', triggers: ['Scheduled', 'Audit Request']},
      {name: 'DDoS Mitigation', category: 'Network', triggers: ['Traffic Threshold', 'WAF Alert']},
      {name: 'Data Loss Prevention', category: 'DLP', triggers: ['DLP Alert', 'File Transfer']},
      {name: 'Threat Intelligence Enrichment', category: 'CTI', triggers: ['IOC Match', 'Feed Update']},
      {name: 'Incident Communication', category: 'Comms', triggers: ['Severity Threshold', 'Manual']},
    ];
    const integrations = [
      ['Email Gateway', 'Ticketing System', 'SIEM'],
      ['EDR Platform', 'Network Isolation', 'Forensics Tool'],
      ['Patch Manager', 'CMDB', 'Change Management'],
      ['AWS API', 'Azure API', 'GCP API'],
      ['IdP API', 'HR System', 'Ticketing'],
      ['GRC Platform', 'Document Store', 'SIEM'],
      ['CDN API', 'Firewall', 'Traffic Analyzer'],
      ['DLP Engine', 'File Share', 'Email Gateway'],
      ['MISP', 'VirusTotal', 'Shodan'],
      ['Slack', 'Email', 'Status Page'],
    ];
    this._saPlaybooks = playbooks.map((pb, i) => ({
      id: 'sa-pb-' + i, name: pb.name, category: pb.category,
      triggers: 50 + ((idx * 7 + i * 13) % 200),
      autoActions: 3 + ((idx + i * 3) % 8),
      manualSteps: 1 + ((idx + i) % 4),
      avgRuntime: 5 + ((idx * 2 + i * 7) % 55),
      successRate: 85 + ((idx + i * 5) % 14),
      lastRun: '2026-04-' + String(1 + (i * 2 % 20)).padStart(2, '0') + 'T10:00',
      status: i % 8 === 0 ? 'draft' : 'active'
    }));
    this._saWorkflows = playbooks.slice(0, 8).map((pb, i) => ({
      id: 'sa-wf-' + i, name: pb.name + ' Workflow',
      steps: 5 + ((idx + i * 3) % 10),
      automated: 3 + ((idx + i * 2) % 7),
      integrations: integrations[i],
      schedule: i % 3 === 0 ? 'Daily 02:00' : i % 3 === 1 ? 'On-demand' : 'Weekly Monday 06:00',
      enabled: i % 7 !== 0
    }));
  }

  private _saGetAutomationCoverage(): {automated: number; semiAutomated: number; manual: number} {
    const auto = this._saPlaybooks.filter(p => p.autoActions > p.manualSteps * 2).length;
    const semi = this._saPlaybooks.filter(p => p.autoActions > p.manualSteps).length - auto;
    const manual = this._saPlaybooks.length - auto - semi;
    return {automated: auto, semiAutomated: semi, manual};
  }

  private _saGetTopPlaybooks(): Array<{name: string; triggers: number; successRate: number; efficiency: number}> {
    return this._saPlaybooks
      .sort((a, b) => b.triggers - a.triggers)
      .slice(0, 5)
      .map(p => ({name: p.name, triggers: p.triggers, successRate: p.successRate,
        efficiency: Math.round(p.autoActions / (p.autoActions + p.manualSteps) * 100)}));
  }

  private _saGetIntegrationHealth(): Array<{name: string; status: string; latency: string; errorRate: number}> {
    return this._saWorkflows.flatMap(w => w.integrations).filter((v, i, a) => a.indexOf(v) === i).map((name, i) => ({
      name, status: i % 5 === 0 ? 'degraded' : 'healthy',
      latency: (50 + (idx + i * 20) % 200) + 'ms',
      errorRate: i % 5 === 0 ? 2 + (idx % 3) : 0.1 + (idx % 2) * 0.5
    }));
  }


  // === Security Training Platform (Round 36 - Pass 3 - Block C) ===

  private _tpCourses: Array<{id: string; title: string; category: string; difficulty: string;
    duration: number; enrolled: number; completed: number; avgScore: number;
    passRate: number; rating: number; lastUpdated: string; mandatory: boolean;
    modules: number; prerequisites: string[]}> = [];
  private _tpLearners: Array<{id: string; name: string; department: string;
    completedCourses: number; inProgress: number; avgScore: number;
    lastActivity: string; riskLevel: string; certificationCount: number}> = [];

  private _initTpTraining() {
    const courses = [
      {title: 'Security Fundamentals 101', category: 'Foundation', difficulty: 'beginner', mandatory: true, modules: 8},
      {title: 'Phishing Awareness & Prevention', category: 'Awareness', difficulty: 'beginner', mandatory: true, modules: 5},
      {title: 'Secure Coding Practices', category: 'Developer', difficulty: 'intermediate', mandatory: false, modules: 12},
      {title: 'Cloud Security Architecture', category: 'Cloud', difficulty: 'advanced', mandatory: false, modules: 10},
      {title: 'Incident Response Procedures', category: 'Operations', difficulty: 'intermediate', mandatory: true, modules: 7},
      {title: 'GDPR & Data Privacy', category: 'Compliance', difficulty: 'intermediate', mandatory: true, modules: 6},
      {title: 'Network Security Deep Dive', category: 'Technical', difficulty: 'advanced', mandatory: false, modules: 15},
      {title: 'Identity & Access Management', category: 'IAM', difficulty: 'intermediate', mandatory: false, modules: 9},
      {title: 'Red Team Methodology', category: 'Offensive', difficulty: 'advanced', mandatory: false, modules: 11},
      {title: 'SOC Analyst Certification Prep', category: 'Career', difficulty: 'intermediate', mandatory: false, modules: 14},
      {title: 'Container Security', category: 'DevSecOps', difficulty: 'intermediate', mandatory: false, modules: 8},
      {title: 'Executive Security Briefing', category: 'Leadership', difficulty: 'beginner', mandatory: true, modules: 4},
    ];
    const prereqs: string[][] = [[], ['Security Fundamentals 101'], ['Security Fundamentals 101'],
      ['Cloud Security Architecture'], ['Security Fundamentals 101', 'Phishing Awareness & Prevention'],
      [], ['Network Security Deep Dive'], ['Security Fundamentals 101'],
      ['Incident Response Procedures', 'Network Security Deep Dive'],
      ['Incident Response Procedures'], ['Secure Coding Practices'], []];
    this._tpCourses = courses.map((c, i) => ({
      id: 'TP-C-' + (100 + i),
      title: c.title, category: c.category, difficulty: c.difficulty,
      duration: 30 + ((idx + i * 20) % 120),
      enrolled: 20 + ((idx * 3 + i * 7) % 80),
      completed: 15 + ((idx * 2 + i * 5) % 60),
      avgScore: 65 + ((idx + i * 4) % 30),
      passRate: 75 + ((idx + i * 3) % 20),
      rating: 3.5 + ((idx + i) % 15) / 10,
      lastUpdated: '2026-0' + (1 + (i % 4)) + '-' + String(1 + (i * 2 % 20)).padStart(2, '0'),
      mandatory: c.mandatory, modules: c.modules,
      prerequisites: prereqs[i]
    }));
    const depts = ['Engineering', 'Finance', 'HR', 'Legal', 'Marketing', 'Operations', 'Sales', 'Executive'];
    this._tpLearners = depts.map((dept, i) => ({
      id: 'TP-L-' + (200 + i), name: 'Learner ' + (i + 1), department: dept,
      completedCourses: 3 + ((idx + i * 3) % 8),
      inProgress: 1 + ((idx + i) % 3),
      avgScore: 60 + ((idx * 5 + i * 7) % 35),
      lastActivity: '2026-04-' + String(1 + (i * 2 % 20)).padStart(2, '0'),
      riskLevel: i % 4 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
      certificationCount: i % 3 === 0 ? 2 + (idx % 3) : 0
    }));
  }

  private _tpGetCompletionRate(): {overall: number; mandatory: number; voluntary: number} {
    const mand = this._tpCourses.filter(c => c.mandatory);
    const vol = this._tpCourses.filter(c => !c.mandatory);
    const overall = this._tpCourses.reduce((s, c) => s + c.completed / c.enrolled, 0) / this._tpCourses.length;
    const mandRate = mand.reduce((s, c) => s + c.completed / c.enrolled, 0) / Math.max(1, mand.length);
    const volRate = vol.reduce((s, c) => s + c.completed / c.enrolled, 0) / Math.max(1, vol.length);
    return {overall: Math.round(overall * 100), mandatory: Math.round(mandRate * 100), voluntary: Math.round(volRate * 100)};
  }

  private _tpGetAtRiskLearners(): Array<{name: string; department: string; risk: string; missedCourses: number}> {
    return this._tpLearners.filter(l => l.riskLevel === 'high').map(l => ({
      name: l.name, department: l.department, risk: l.riskLevel,
      missedCourses: this._tpCourses.filter(c => c.mandatory).length - l.completedCourses
    }));
  }

  private _tpGetTopCourses(): Array<{title: string; enrolled: number; avgScore: number; rating: number}> {
    return [...this._tpCourses].sort((a, b) => b.enrolled - a.enrolled).slice(0, 5)
      .map(c => ({title: c.title, enrolled: c.enrolled, avgScore: c.avgScore, rating: c.rating}));
  }

  private _tpGetSkillGaps(): Array<{department: string; missingSkills: string[]; recommendedCourses: string[]}> {
    return this._tpLearners.filter(l => l.riskLevel !== 'low').slice(0, 5).map(l => ({
      department: l.department,
      missingSkills: ['Secure Coding', 'Cloud Security', 'Incident Response'].slice(0, 1 + (idx % 3)),
      recommendedCourses: this._tpCourses.filter(c => !c.mandatory).slice(0, 2).map(c => c.title)
    }));
  }


  // === Security Operations Center Analytics (Round 36 - Pass 4) ===

  private _socQueue: Array<{id: string; alertId: string; source: string; severity: string;
    status: string; assignedTo: string; created: string; slaDeadline: string;
    slaRemaining: number; notes: string; enrichment: string[]}> = [];
  private _socShifts: Array<{name: string; analysts: number; activeAlerts: number;
    escalated: number; resolved: number; startTime: string; performance: number}> = [];

  private _initSocCenter() {
    const sources = ['SIEM', 'EDR', 'IDS/IPS', 'WAF', 'DLP', 'CloudTrail', 'Email GW', 'Auth Logs'];
    const severities = ['critical', 'high', 'medium', 'low', 'critical', 'high', 'medium', 'low'];
    const analysts = ['J.Smith', 'A.Johnson', 'M.Williams', 'R.Brown', 'K.Davis', 'S.Miller', 'T.Wilson', 'L.Moore'];
    this._socQueue = Array.from({length: 12}, (_, i) => ({
      id: 'SOC-Q-' + (500 + idx + i),
      alertId: 'ALR-' + String(20000 + idx * 100 + i * 7),
      source: sources[i % sources.length],
      severity: severities[i % severities.length],
      status: i % 4 === 0 ? 'investigating' : i % 3 === 0 ? 'escalated' : 'pending',
      assignedTo: analysts[i % analysts.length],
      created: '2026-04-23T' + String(8 + (i % 12)).padStart(2, '0') + ':00',
      slaDeadline: '2026-04-23T' + String(10 + (i % 8)).padStart(2, '0') + ':30',
      slaRemaining: 30 + ((idx + i * 17) % 180),
      notes: i % 3 === 0 ? 'Potential false positive, requires validation' : '',
      enrichment: i % 2 === 0 ? ['IOC matched', 'Threat intel enriched', 'Asset correlated'] : ['Asset identified']
    }));
    this._socShifts = ['Morning', 'Afternoon', 'Night'].map((shift, i) => ({
      name: shift + ' Shift',
      analysts: 3 + ((idx + i) % 4),
      activeAlerts: 5 + ((idx * 3 + i * 7) % 20),
      escalated: 1 + ((idx + i * 2) % 5),
      resolved: 10 + ((idx * 5 + i * 11) % 25),
      startTime: ['06:00', '14:00', '22:00'][i],
      performance: 70 + ((idx * 7 + i * 13) % 25)
    }));
  }

  private _socGetQueueMetrics(): {total: number; investigating: number; escalated: number; pending: number; criticalCount: number} {
    return {
      total: this._socQueue.length,
      investigating: this._socQueue.filter(a => a.status === 'investigating').length,
      escalated: this._socQueue.filter(a => a.status === 'escalated').length,
      pending: this._socQueue.filter(a => a.status === 'pending').length,
      criticalCount: this._socQueue.filter(a => a.severity === 'critical').length,
    };
  }

  private _socGetSlaCompliance(): {inSla: number; atRisk: number; breached: number} {
    const inSla = this._socQueue.filter(a => a.slaRemaining > 60).length;
    const atRisk = this._socQueue.filter(a => a.slaRemaining > 15 && a.slaRemaining <= 60).length;
    const breached = this._socQueue.filter(a => a.slaRemaining <= 15).length;
    return {inSla, atRisk, breached};
  }

  private _socGetShiftPerformance(): {bestShift: string; worstShift: string; avgPerformance: number} {
    const sorted = [...this._socShifts].sort((a, b) => b.performance - a.performance);
    const avg = Math.round(this._socShifts.reduce((s, sh) => s + sh.performance, 0) / this._socShifts.length);
    return {bestShift: sorted[0].name, worstShift: sorted[sorted.length - 1].name, avgPerformance: avg};
  }

  private _socGetSourceDistribution(): Array<{source: string; count: number; percentage: number}> {
    const dist: Record<string, number> = {};
    this._socQueue.forEach(a => { dist[a.source] = (dist[a.source] || 0) + 1; });
    const total = this._socQueue.length;
    return Object.entries(dist).map(([source, count]) => ({
      source, count, percentage: Math.round(count / total * 100)
    })).sort((a, b) => b.count - a.count);
  }



  // === Security Risk Register (training_mod) ===
  private _training_modRiskRegister = [
    { id: "RSK-TRA-0001", title: "Data breach from unpatched systems", owner: "CTO", category: "Financial", status: "mitigating", trend: "stable", severity: "medium", likelihood: 7, impact: 9, treatment: "Monitor and review quarterly", lastReview: "2026-04-13", nextReview: "2026-07-28" },
    { id: "RSK-TRA-0002", title: "Ransomware attack on critical infrastructure", owner: "CRO", category: "Strategic", status: "closed", trend: "decreasing", severity: "medium", likelihood: 8, impact: 8, treatment: "Monitor and review quarterly", lastReview: "2026-04-01", nextReview: "2026-07-10" },
    { id: "RSK-TRA-0003", title: "Insider threat data exfiltration", owner: "VP Eng", category: "Compliance", status: "accepted", trend: "increasing", severity: "high", likelihood: 4, impact: 4, treatment: "Monitor and review quarterly", lastReview: "2026-04-01", nextReview: "2026-07-02" },
    { id: "RSK-TRA-0004", title: "Supply chain compromise", owner: "Security Lead", category: "Technical", status: "open", trend: "stable", severity: "medium", likelihood: 7, impact: 9, treatment: "Monitor and review quarterly", lastReview: "2026-04-16", nextReview: "2026-07-22" },
    { id: "RSK-TRA-0005", title: "Cloud misconfiguration exposure", owner: "Risk Mgr", category: "Reputational", status: "mitigating", trend: "decreasing", severity: "high", likelihood: 7, impact: 2, treatment: "Monitor and review quarterly", lastReview: "2026-04-01", nextReview: "2026-07-22" },
    { id: "RSK-TRA-0006", title: "Phishing campaign success rate", owner: "Compliance Dir", category: "Legal", status: "closed", trend: "increasing", severity: "critical", likelihood: 2, impact: 8, treatment: "Monitor and review quarterly", lastReview: "2026-04-21", nextReview: "2026-07-06" },
    { id: "RSK-TRA-0007", title: "Third-party vendor data breach", owner: "IT Dir", category: "Regulatory", status: "accepted", trend: "stable", severity: "medium", likelihood: 7, impact: 9, treatment: "Monitor and review quarterly", lastReview: "2026-04-11", nextReview: "2026-07-02" },
    { id: "RSK-TRA-0008", title: "Regulatory non-compliance penalty", owner: "DevOps Lead", category: "Third-Party", status: "open", trend: "decreasing", severity: "high", likelihood: 4, impact: 5, treatment: "Monitor and review quarterly", lastReview: "2026-04-18", nextReview: "2026-07-02" },
    { id: "RSK-TRA-0009", title: "Zero-day exploit in production", owner: "Architect", category: "Human Capital", status: "mitigating", trend: "increasing", severity: "low", likelihood: 8, impact: 9, treatment: "Monitor and review quarterly", lastReview: "2026-04-06", nextReview: "2026-07-23" },
    { id: "RSK-TRA-0010", title: "Insufficient access controls", owner: "CISO", category: "Operational", status: "closed", trend: "stable", severity: "low", likelihood: 9, impact: 1, treatment: "Monitor and review quarterly", lastReview: "2026-04-06", nextReview: "2026-07-02" },
    { id: "RSK-TRA-0011", title: "DDoS attack on services", owner: "CTO", category: "Financial", status: "accepted", trend: "decreasing", severity: "high", likelihood: 2, impact: 8, treatment: "Monitor and review quarterly", lastReview: "2026-04-18", nextReview: "2026-07-18" },
    { id: "RSK-TRA-0012", title: "Social engineering attack", owner: "CRO", category: "Strategic", status: "open", trend: "increasing", severity: "critical", likelihood: 1, impact: 1, treatment: "Monitor and review quarterly", lastReview: "2026-04-22", nextReview: "2026-07-02" },
    { id: "RSK-TRA-0013", title: "API security vulnerability", owner: "VP Eng", category: "Compliance", status: "mitigating", trend: "stable", severity: "high", likelihood: 2, impact: 7, treatment: "Monitor and review quarterly", lastReview: "2026-04-13", nextReview: "2026-07-15" },
    { id: "RSK-TRA-0014", title: "Mobile device compromise", owner: "Security Lead", category: "Technical", status: "closed", trend: "decreasing", severity: "high", likelihood: 4, impact: 5, treatment: "Monitor and review quarterly", lastReview: "2026-04-16", nextReview: "2026-07-15" },
    { id: "RSK-TRA-0015", title: "Physical security breach", owner: "Risk Mgr", category: "Reputational", status: "accepted", trend: "increasing", severity: "high", likelihood: 2, impact: 4, treatment: "Monitor and review quarterly", lastReview: "2026-04-06", nextReview: "2026-07-01" },
    { id: "RSK-TRA-0016", title: "Password policy weakness", owner: "Compliance Dir", category: "Legal", status: "open", trend: "stable", severity: "critical", likelihood: 2, impact: 1, treatment: "Monitor and review quarterly", lastReview: "2026-04-17", nextReview: "2026-07-27" },
    { id: "RSK-TRA-0017", title: "Network segmentation gap", owner: "IT Dir", category: "Regulatory", status: "mitigating", trend: "decreasing", severity: "critical", likelihood: 9, impact: 5, treatment: "Monitor and review quarterly", lastReview: "2026-04-01", nextReview: "2026-07-23" },
    { id: "RSK-TRA-0018", title: "Encryption key management failure", owner: "DevOps Lead", category: "Third-Party", status: "closed", trend: "increasing", severity: "low", likelihood: 2, impact: 8, treatment: "Monitor and review quarterly", lastReview: "2026-04-09", nextReview: "2026-07-09" },
    { id: "RSK-TRA-0019", title: "Audit trail tampering", owner: "Architect", category: "Human Capital", status: "accepted", trend: "stable", severity: "low", likelihood: 3, impact: 9, treatment: "Monitor and review quarterly", lastReview: "2026-04-21", nextReview: "2026-07-12" },
    { id: "RSK-TRA-0020", title: "Business email compromise", owner: "CISO", category: "Operational", status: "open", trend: "decreasing", severity: "low", likelihood: 6, impact: 1, treatment: "Monitor and review quarterly", lastReview: "2026-04-17", nextReview: "2026-07-10" },
  ];
  private _training_modRiskFilter: string = 'all';
  private _training_modRiskSeverity: string = 'all';
  private _training_modRiskStatus: string = 'all';
  private _training_modExpandedRisk: string = '';
  private _training_modFilterRisks() {
    const reg = this._training_modRiskRegister;
    return reg.filter(r => {
      if (this._training_modRiskFilter !== "all" && r.category !== this._training_modRiskFilter) return false;
      if (this._training_modRiskSeverity !== "all" && r.severity !== this._training_modRiskSeverity) return false;
      if (this._training_modRiskStatus !== "all" && r.status !== this._training_modRiskStatus) return false;
      return true;
    });
  }
  private _training_modGetRiskScore(r: any) { return Math.round(r.likelihood * r.impact * 1.5); }
  private _training_modGetRiskTrendIcon(trend: string) {
    if (trend === "increasing") return "\u2191";
    if (trend === "decreasing") return "\u2193";
    return "\u2192";
  }
  private _training_modGetRiskColor(sev: string) {
    if (sev === "critical") return "#dc2626";
    if (sev === "high") return "#ea580c";
    if (sev === "medium") return "#d97706";
    return "#16a34a";
  }
  private _training_modGetRiskCounts() {
    const reg = this._training_modRiskRegister;
    return { total: reg.length, open: reg.filter(r=>r.status==="open").length, mitigating: reg.filter(r=>r.status==="mitigating").length, closed: reg.filter(r=>r.status==="closed").length, accepted: reg.filter(r=>r.status==="accepted").length, critical: reg.filter(r=>r.severity==="critical").length };
  }
  private _training_modGetTreatmentProgress() {
    const reg = this._training_modRiskRegister;
    const treated = reg.filter(r => r.status === "mitigating" || r.status === "closed").length;
    return Math.round((treated / Math.max(reg.length, 1)) * 100);
  }

  // === Security Metrics API Gateway (training_mod) ===
  private _training_modApiEndpoints = [
    { method: "GET", path: "/api/v1/threats", name: "Threat Intelligence Feed", status: "active", avgLatency: 263.5, reqPerMin: 997.0, errorRate: 1.53, uptime: round(97.91257778808361,2), version: "v2.9.4" },
    { method: "POST", path: "/api/v1/scans/start", name: "Vulnerability Scanner", status: "active", avgLatency: 76.6, reqPerMin: 1651.0, errorRate: 0.38, uptime: round(98.6510889343276,2), version: "v2.9.1" },
    { method: "GET", path: "/api/v1/assets", name: "Asset Inventory", status: "active", avgLatency: 283.9, reqPerMin: 2201.0, errorRate: 1.72, uptime: round(99.32984813872572,2), version: "v2.2.20" },
    { method: "POST", path: "/api/v1/alerts", name: "Alert Management", status: "active", avgLatency: 90.6, reqPerMin: 1063.0, errorRate: 2.11, uptime: round(96.25547279461458,2), version: "v3.6.7" },
    { method: "GET", path: "/api/v1/compliance", name: "Compliance Status", status: "active", avgLatency: 144.1, reqPerMin: 1670.0, errorRate: 0.63, uptime: round(96.3629395612392,2), version: "v3.2.13" },
    { method: "PUT", path: "/api/v1/policies", name: "Policy Engine", status: "active", avgLatency: 447.7, reqPerMin: 93.0, errorRate: 0.86, uptime: round(96.35878435697258,2), version: "v1.7.15" },
    { method: "GET", path: "/api/v1/incidents", name: "Incident Tracker", status: "active", avgLatency: 225.9, reqPerMin: 1238.0, errorRate: 1.69, uptime: round(95.93104398556726,2), version: "v1.4.14" },
    { method: "POST", path: "/api/v1/forensics", name: "Forensics Collector", status: "degraded", avgLatency: 59.1, reqPerMin: 2065.0, errorRate: 0.54, uptime: round(95.30205315726315,2), version: "v3.8.2" },
    { method: "GET", path: "/api/v1/risk/assess", name: "Risk Assessment", status: "active", avgLatency: 72.4, reqPerMin: 1475.0, errorRate: 1.94, uptime: round(99.25997938072005,2), version: "v3.5.11" },
    { method: "POST", path: "/api/v1/auth/verify", name: "Authentication", status: "active", avgLatency: 190.9, reqPerMin: 146.0, errorRate: 0.96, uptime: round(95.32560499993845,2), version: "v1.6.3" },
    { method: "GET", path: "/api/v1/logs/audit", name: "Audit Log Query", status: "active", avgLatency: 415.4, reqPerMin: 534.0, errorRate: 1.44, uptime: round(98.19806291527581,2), version: "v3.3.4" },
    { method: "PUT", path: "/api/v1/users/roles", name: "Role Management", status: "active", avgLatency: 101.5, reqPerMin: 722.0, errorRate: 2.43, uptime: round(99.69207942822013,2), version: "v3.7.15" },
    { method: "POST", path: "/api/v1/encrypt", name: "Encryption Service", status: "active", avgLatency: 385.0, reqPerMin: 1074.0, errorRate: 1.22, uptime: round(96.52278619397747,2), version: "v3.1.16" },
    { method: "GET", path: "/api/v1/network/topo", name: "Network Topology", status: "maintenance", avgLatency: 65.2, reqPerMin: 1612.0, errorRate: 0.06, uptime: round(99.31135754275206,2), version: "v1.7.15" },
    { method: "DELETE", path: "/api/v1/sessions", name: "Session Manager", status: "active", avgLatency: 102.1, reqPerMin: 1504.0, errorRate: 2.02, uptime: round(98.31607791260025,2), version: "v3.4.16" },
  ];
  private _training_modApiKeys = [
    { id: "ak-000001", name: "key-trai-001", created: "2026-01-14", lastUsed: "2026-04-03", status: "revoked", calls: 19882, rateLimit: 100 },
    { id: "ak-000002", name: "key-trai-002", created: "2026-05-03", lastUsed: "2026-04-10", status: "active", calls: 25521, rateLimit: 100 },
    { id: "ak-000003", name: "key-trai-003", created: "2026-06-23", lastUsed: "2026-04-06", status: "active", calls: 10167, rateLimit: 100 },
    { id: "ak-000004", name: "key-trai-004", created: "2026-07-26", lastUsed: "2026-04-01", status: "active", calls: 39075, rateLimit: 1000 },
    { id: "ak-000005", name: "key-trai-005", created: "2026-07-05", lastUsed: "2026-04-12", status: "active", calls: 11993, rateLimit: 500 },
    { id: "ak-000006", name: "key-trai-006", created: "2026-09-08", lastUsed: "2026-04-13", status: "active", calls: 31675, rateLimit: 100 },
    { id: "ak-000007", name: "key-trai-007", created: "2026-09-07", lastUsed: "2026-04-10", status: "active", calls: 39480, rateLimit: 500 },
    { id: "ak-000008", name: "key-trai-008", created: "2026-07-07", lastUsed: "2026-04-16", status: "revoked", calls: 35496, rateLimit: 1000 },
  ];
  private _training_modApiHealthSummary() {
    const eps = this._training_modApiEndpoints;
    return { total: eps.length, active: eps.filter(e=>e.status==="active").length, degraded: eps.filter(e=>e.status==="degraded").length, maintenance: eps.filter(e=>e.status==="maintenance").length, avgLatency: round(eps.reduce((s,e)=>s+e.avgLatency,0)/eps.length,1), totalReqPerMin: round(eps.reduce((s,e)=>s+e.reqPerMin,0)), avgUptime: round(eps.reduce((s,e)=>s+e.uptime,0)/eps.length,2) };
  }
  private _training_modGetApiByMethod(method: string) { return this._training_modApiEndpoints.filter(e=>e.method===method); }
  private _training_modGetSlowEndpoints() { return this._training_modApiEndpoints.filter(e=>e.avgLatency>200).sort((a,b)=>b.avgLatency-a.avgLatency); }
  private _training_modGetHighErrorEndpoints() { return this._training_modApiEndpoints.filter(e=>e.errorRate>1.0).sort((a,b)=>b.errorRate-a.errorRate); }

  // === Security Training Effectiveness (training_mod) ===
  private _training_modTrainingModules = [
    { id: "TRN-001", name: "Security Fundamentals", completionRate: 97.2, avgScore: 89.7, behaviorChange: 61.4, enrolled: 297, completed: 166, duration: "88min", category: "mandatory" },
    { id: "TRN-002", name: "Phishing Awareness", completionRate: 96.1, avgScore: 78.7, behaviorChange: 67.7, enrolled: 185, completed: 206, duration: "88min", category: "mandatory" },
    { id: "TRN-003", name: "Social Engineering Defense", completionRate: 86.9, avgScore: 66.6, behaviorChange: 71.4, enrolled: 293, completed: 291, duration: "82min", category: "optional" },
    { id: "TRN-004", name: "Password Hygiene", completionRate: 64.7, avgScore: 87.1, behaviorChange: 77.6, enrolled: 335, completed: 414, duration: "96min", category: "mandatory" },
    { id: "TRN-005", name: "Data Classification", completionRate: 58.5, avgScore: 87.9, behaviorChange: 45.5, enrolled: 386, completed: 365, duration: "93min", category: "mandatory" },
    { id: "TRN-006", name: "Incident Response Basics", completionRate: 64.0, avgScore: 61.1, behaviorChange: 51.3, enrolled: 153, completed: 390, duration: "85min", category: "mandatory" },
    { id: "TRN-007", name: "Secure Coding", completionRate: 81.5, avgScore: 80.6, behaviorChange: 43.1, enrolled: 426, completed: 288, duration: "78min", category: "optional" },
    { id: "TRN-008", name: "Cloud Security", completionRate: 51.9, avgScore: 74.1, behaviorChange: 73.7, enrolled: 434, completed: 151, duration: "44min", category: "mandatory" },
    { id: "TRN-009", name: "Mobile Device Security", completionRate: 61.3, avgScore: 58.3, behaviorChange: 81.2, enrolled: 92, completed: 314, duration: "53min", category: "mandatory" },
    { id: "TRN-010", name: "Network Security", completionRate: 91.0, avgScore: 75.3, behaviorChange: 82.2, enrolled: 176, completed: 114, duration: "118min", category: "mandatory" },
    { id: "TRN-011", name: "Physical Security", completionRate: 51.3, avgScore: 87.1, behaviorChange: 87.0, enrolled: 358, completed: 179, duration: "108min", category: "optional" },
    { id: "TRN-012", name: "Regulatory Compliance", completionRate: 63.0, avgScore: 80.9, behaviorChange: 55.8, enrolled: 384, completed: 349, duration: "29min", category: "mandatory" },
    { id: "TRN-013", name: "Risk Management", completionRate: 50.2, avgScore: 56.9, behaviorChange: 53.0, enrolled: 264, completed: 380, duration: "52min", category: "mandatory" },
    { id: "TRN-014", name: "Cryptography Basics", completionRate: 91.0, avgScore: 72.6, behaviorChange: 56.1, enrolled: 451, completed: 87, duration: "107min", category: "mandatory" },
    { id: "TRN-015", name: "Access Control", completionRate: 79.3, avgScore: 93.4, behaviorChange: 52.3, enrolled: 322, completed: 398, duration: "33min", category: "optional" },
    { id: "TRN-016", name: "Vendor Management", completionRate: 76.6, avgScore: 86.8, behaviorChange: 46.2, enrolled: 454, completed: 354, duration: "77min", category: "mandatory" },
  ];
  private _training_modPhishingResults = [
    { month: "2026-01", sent: 874, clicked: 141, reported: 363, clickRate: round(16.132723112128147,1), reportRate: round(41.53318077803203,1) },
    { month: "2026-02", sent: 827, clicked: 68, reported: 251, clickRate: round(8.222490931076178,1), reportRate: round(30.350665054413543,1) },
    { month: "2026-03", sent: 635, clicked: 188, reported: 328, clickRate: round(29.606299212598426,1), reportRate: round(51.653543307086615,1) },
    { month: "2026-04", sent: 287, clicked: 19, reported: 156, clickRate: round(6.620209059233449,1), reportRate: round(54.35540069686411,1) },
    { month: "2026-05", sent: 357, clicked: 65, reported: 121, clickRate: round(18.207282913165265,1), reportRate: round(33.89355742296919,1) },
    { month: "2026-06", sent: 902, clicked: 100, reported: 489, clickRate: round(11.086474501108649,1), reportRate: round(54.212860310421284,1) },
  ];
  private _training_modTrainingROI = { totalInvestment: 105572, avgCostPerEmployee: 558, riskReductionPct: round(random.uniform(15,45),1), incidentReductionPct: round(random.uniform(10,35),1), complianceScoreGain: round(random.uniform(5,25),1) };
  private _training_modLearningPaths = [
    { name: "Beginner Security Analyst", totalModules: 20, completedModules: 9, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 74, enrolled: 170 },
    { name: "Advanced Threat Hunter", totalModules: 8, completedModules: 8, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 63, enrolled: 119 },
    { name: "Security Architect", totalModules: 17, completedModules: 9, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 59, enrolled: 99 },
    { name: "Incident Responder", totalModules: 17, completedModules: 7, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 22, enrolled: 101 },
    { name: "Compliance Specialist", totalModules: 18, completedModules: 4, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 74, enrolled: 92 },
    { name: "DevSecOps Engineer", totalModules: 18, completedModules: 9, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 46, enrolled: 185 },
  ];
  private _training_modGetOverallCompletion() {
    const mods = this._training_modTrainingModules;
    return round(mods.reduce((s,m)=>s+m.completionRate,0)/mods.length,1);
  }
  private _training_modGetTopPerformers() { return [...this._training_modTrainingModules].sort((a,b)=>b.avgScore-a.avgScore).slice(0,5); }
  private _training_modGetModulesNeedingAttention() { return this._training_modTrainingModules.filter(m=>m.completionRate<70||m.avgScore<65); }

  // === Security Governance Framework (training_mod) ===
  private _training_modGovBodies = [
    { name: "Security Steering Committee", members: 14, chair: "CISO", meetingFreq: "Weekly", lastMeeting: "2026-04-21", nextMeeting: "2026-05-10", quorum: 6 },
    { name: "Risk Management Board", members: 8, chair: "CTO", meetingFreq: "Bi-weekly", lastMeeting: "2026-04-05", nextMeeting: "2026-05-26", quorum: 6 },
    { name: "Data Governance Council", members: 5, chair: "CRO", meetingFreq: "Monthly", lastMeeting: "2026-04-02", nextMeeting: "2026-05-12", quorum: 5 },
    { name: "Compliance Oversight Board", members: 9, chair: "CDO", meetingFreq: "Monthly", lastMeeting: "2026-04-09", nextMeeting: "2026-05-02", quorum: 4 },
    { name: "Architecture Review Board", members: 12, chair: "VP Eng", meetingFreq: "Bi-weekly", lastMeeting: "2026-04-02", nextMeeting: "2026-05-17", quorum: 6 },
    { name: "Change Advisory Board", members: 12, chair: "CISO", meetingFreq: "Weekly", lastMeeting: "2026-04-05", nextMeeting: "2026-05-26", quorum: 8 },
    { name: "Incident Review Board", members: 15, chair: "CIO", meetingFreq: "As needed", lastMeeting: "2026-04-15", nextMeeting: "2026-05-10", quorum: 8 },
    { name: "Vendor Risk Committee", members: 8, chair: "CFO", meetingFreq: "Quarterly", lastMeeting: "2026-04-14", nextMeeting: "2026-05-24", quorum: 6 },
  ];
  private _training_modDecisions = [
    { id: "DEC-0001", title: "Adopt zero-trust architecture framework", date: "2026-02-06", status: "approved", owner: "CISO" },
    { id: "DEC-0002", title: "Migrate to SIEM 2.0 platform", date: "2026-03-09", status: "implemented", owner: "CTO" },
    { id: "DEC-0003", title: "Implement DLP across all endpoints", date: "2026-04-15", status: "in-progress", owner: "Security Lead" },
    { id: "DEC-0004", title: "Mandate MFA for all external access", date: "2026-04-02", status: "pending", owner: "CRO" },
    { id: "DEC-0005", title: "Establish bug bounty program", date: "2026-01-03", status: "approved", owner: "VP Eng" },
    { id: "DEC-0006", title: "Deploy EDR solution enterprise-wide", date: "2026-03-07", status: "approved", owner: "CISO" },
    { id: "DEC-0007", title: "Conduct annual penetration testing", date: "2026-02-14", status: "implemented", owner: "CTO" },
    { id: "DEC-0008", title: "Implement network micro-segmentation", date: "2026-03-12", status: "in-progress", owner: "Security Lead" },
    { id: "DEC-0009", title: "Establish security champion program", date: "2026-01-16", status: "pending", owner: "CRO" },
    { id: "DEC-0010", title: "Migrate to passwordless authentication", date: "2026-04-23", status: "approved", owner: "VP Eng" },
  ];
  private _training_modPolicyLifecycle = [
    { name: "Information Security Policy", version: "v1.2", status: "active", lastUpdated: "2026-02-13", nextReview: "2026-10-20", owner: "CISO" },
    { name: "Acceptable Use Policy", version: "v3.4", status: "active", lastUpdated: "2026-03-25", nextReview: "2026-7-13", owner: "Legal" },
    { name: "Data Retention Policy", version: "v1.2", status: "under-review", lastUpdated: "2026-04-27", nextReview: "2026-11-12", owner: "DPO" },
    { name: "Access Control Policy", version: "v3.2", status: "active", lastUpdated: "2026-03-23", nextReview: "2026-12-09", owner: "IAM Lead" },
    { name: "Incident Response Policy", version: "v1.0", status: "draft", lastUpdated: "2026-02-22", nextReview: "2026-9-04", owner: "IR Lead" },
    { name: "Business Continuity Plan", version: "v2.1", status: "active", lastUpdated: "2026-04-20", nextReview: "2026-11-01", owner: "BCP Mgr" },
    { name: "Vendor Management Policy", version: "v4.4", status: "active", lastUpdated: "2026-02-02", nextReview: "2026-7-07", owner: "Procurement" },
    { name: "Encryption Standard", version: "v4.3", status: "under-review", lastUpdated: "2026-01-23", nextReview: "2026-12-19", owner: "Security Arch" },
  ];
  private _training_modGovMaturityScore = { overall: 3.7, riskManagement: 5.3, compliance: 3.6, incidentResponse: 5.6, awareness: 2.6, technology: 5.7 };
  private _training_modGetPendingDecisions() { return this._training_modDecisions.filter(d=>d.status==='pending'||d.status==='in-progress'); }
  private _training_modGetActivePolicies() { return this._training_modPolicyLifecycle.filter(p=>p.status==='active'); }
  private _training_modGetEscalationPath() { return ["L1 Analyst","L2 Senior","Security Lead","CISO","Board"]; }

  // === Security Innovation Lab (training_mod) ===
  private _training_modInnoProjects = [
    { id: "INN-001", name: "AI-Powered Threat Detection", description: "Machine learning models for real-time threat identification", status: "active", progress: 72, startDate: "2026-02-10", teamSize: 4, budget: 94457, milestones: 8, completedMilestones: 9 },
    { id: "INN-002", name: "Quantum-Resistant Cryptography", description: "Post-quantum encryption algorithm prototyping", status: "research", progress: 35, startDate: "2026-01-12", teamSize: 4, budget: 30973, milestones: 4, completedMilestones: 7 },
    { id: "INN-003", name: "Automated Red Teaming", description: "Autonomous penetration testing framework", status: "active", progress: 58, startDate: "2026-02-27", teamSize: 2, budget: 86226, milestones: 4, completedMilestones: 9 },
    { id: "INN-004", name: "Zero-Knowledge Authentication", description: "Privacy-preserving identity verification", status: "poc", progress: 88, startDate: "2026-01-08", teamSize: 3, budget: 128262, milestones: 9, completedMilestones: 1 },
    { id: "INN-005", name: "Blockchain Audit Trail", description: "Immutable security event logging", status: "active", progress: 45, startDate: "2026-02-03", teamSize: 5, budget: 36145, milestones: 9, completedMilestones: 7 },
    { id: "INN-006", name: "Behavioral Biometrics", description: "Continuous authentication via user behavior patterns", status: "research", progress: 22, startDate: "2026-03-04", teamSize: 8, budget: 152986, milestones: 10, completedMilestones: 8 },
    { id: "INN-007", name: "Deception Grid 2.0", description: "Advanced honeypot network with adaptive responses", status: "active", progress: 65, startDate: "2026-03-03", teamSize: 8, budget: 146067, milestones: 10, completedMilestones: 1 },
    { id: "INN-008", name: "Secure Enclave Integration", description: "Hardware-backed security for critical workloads", status: "poc", progress: 40, startDate: "2026-02-09", teamSize: 4, budget: 181619, milestones: 9, completedMilestones: 5 },
  ];
  private _training_modTechEvaluations = [
    { name: "Rust for Security Tools", status: "evaluating", score: 10.4, recommendation: "Adopt", vendor: "Open Source" },
    { name: "eBPF for Runtime Detection", status: "completed", score: 6.8, recommendation: "Adopt", vendor: "AWS" },
    { name: "Confidential Computing", status: "planned", score: 9.4, recommendation: "Investigate", vendor: "Azure" },
    { name: "Homomorphic Encryption", status: "evaluating", score: 9.2, recommendation: "Pilot", vendor: "GCP" },
    { name: "SASE Architecture", status: "completed", score: 9.1, recommendation: "Adopt", vendor: "Multiple" },
    { name: "SOAR Platform 3.0", status: "planned", score: 9.3, recommendation: "Monitor", vendor: "Splunk" },
  ];
  private _training_modCollaborationPartners = [
    { name: "MIT CSAIL", type: "Academic", projects: 4, status: "active" },
    { name: "Stanford Security Lab", type: "Academic", projects: 1, status: "active" },
    { name: "DARPA Cyber", type: "Government", projects: 5, status: "pending" },
    { name: "NIST", type: "Government", projects: 3, status: "active" },
    { name: "CISA", type: "Government", projects: 4, status: "active" },
    { name: "OWASP Foundation", type: "Non-profit", projects: 5, status: "active" },
    { name: "SANS Institute", type: "Training", projects: 2, status: "completed" },
    { name: "Cloud Security Alliance", type: "Industry", projects: 3, status: "active" },
  ];
  private _training_modInnoMetrics = { totalProjects: 8, activeProjects: 4, avgTimeToValue: "134 days", pocSuccessRate: round(random.uniform(55,85),1), researchToProduction: round(random.uniform(20,50),1), innovationIndex: round(random.uniform(6.0,9.5),1) };
  private _training_modGetProjectByStatus(status: string) { return this._training_modInnoProjects.filter(p=>p.status===status); }
  private _training_modGetTopEvaluations() { return [...this._training_modTechEvaluations].sort((a,b)=>b.score-a.score).slice(0,3); }



  // === Compliance Dashboard Extension (training_mod) ===
  private _training_modComplianceFrameworks = [
    { name: "SOC 2 Type II", description: "Trust Services Criteria", totalControls: 5, implementedControls: 4, status: "partially-compliant", lastAudit: "2026-01-07", nextAudit: "2026-7-25", evidenceCount: 110 },
    { name: "ISO 27001", description: "Information Security Management", totalControls: 114, implementedControls: 69, status: "partially-compliant", lastAudit: "2026-04-18", nextAudit: "2026-10-18", evidenceCount: 394 },
    { name: "PCI DSS 4.0", description: "Payment Card Industry", totalControls: 12, implementedControls: 9, status: "in-review", lastAudit: "2026-02-04", nextAudit: "2026-10-21", evidenceCount: 190 },
    { name: "HIPAA", description: "Health Insurance Portability", totalControls: 18, implementedControls: 16, status: "compliant", lastAudit: "2026-04-25", nextAudit: "2026-12-22", evidenceCount: 332 },
    { name: "GDPR", description: "Data Protection Regulation", totalControls: 99, implementedControls: 85, status: "non-compliant", lastAudit: "2026-04-14", nextAudit: "2026-12-02", evidenceCount: 94 },
    { name: "NIST CSF 2.0", description: "Cybersecurity Framework", totalControls: 6, implementedControls: 5, status: "in-review", lastAudit: "2026-01-13", nextAudit: "2026-7-26", evidenceCount: 411 },
    { name: "FedRAMP", description: "Federal Risk Authorization", totalControls: 15, implementedControls: 10, status: "partially-compliant", lastAudit: "2026-04-07", nextAudit: "2026-10-07", evidenceCount: 102 },
    { name: "SOX", description: "Sarbanes-Oxley Compliance", totalControls: 8, implementedControls: 6, status: "non-compliant", lastAudit: "2026-01-15", nextAudit: "2026-12-11", evidenceCount: 51 },
    { name: "CIS Controls v8", description: "Center for Internet Security", totalControls: 18, implementedControls: 9, status: "non-compliant", lastAudit: "2026-01-14", nextAudit: "2026-11-19", evidenceCount: 296 },
    { name: "COBIT 2019", description: "IT Governance Framework", totalControls: 40, implementedControls: 25, status: "in-review", lastAudit: "2026-03-21", nextAudit: "2026-10-12", evidenceCount: 275 },
  ];
  private _training_modGetComplianceScore() {
    const fw = this._training_modComplianceFrameworks;
    return round(fw.reduce((s,f)=>s + (f.implementedControls/Math.max(f.totalControls,1))*100, 0) / fw.length, 1);
  }
  private _training_modGetGaps() {
    return this._training_modComplianceFrameworks.filter(f => f.status !== "compliant");
  }
  private _training_modAuditTrail = [
    { id: "AUD-0001", action: "Control tested", auditor: "Internal Audit", date: "2026-04-02", result: "pass", findings: 3 },
    { id: "AUD-0002", action: "Evidence collected", auditor: "External Auditor", date: "2026-04-05", result: "pass", findings: 5 },
    { id: "AUD-0003", action: "Gap identified", auditor: "Security Team", date: "2026-04-20", result: "fail", findings: 2 },
    { id: "AUD-0004", action: "Remediation completed", auditor: "Compliance Officer", date: "2026-04-03", result: "pass", findings: 5 },
    { id: "AUD-0005", action: "Policy updated", auditor: "IT Audit", date: "2026-04-21", result: "pass", findings: 0 },
    { id: "AUD-0006", action: "Training verified", auditor: "Risk Team", date: "2026-04-08", result: "pass", findings: 0 },
    { id: "AUD-0007", action: "Access reviewed", auditor: "QA Team", date: "2026-04-10", result: "pass", findings: 3 },
    { id: "AUD-0008", action: "Exception approved", auditor: "CISO Office", date: "2026-04-03", result: "conditional", findings: 0 },
    { id: "AUD-0009", action: "Risk accepted", auditor: "Board Audit", date: "2026-04-11", result: "pass", findings: 0 },
    { id: "AUD-0010", action: "Control enhanced", auditor: "Third Party", date: "2026-04-13", result: "pass", findings: 4 },
  ];

  // === Threat Intelligence Feed Extension (training_mod) ===
  private _training_modThreatActors = [
    { name: "APT-29", alias: "Cozy Bear", origin: "Russia", type: "Nation-State", severity: "high", lastActivity: "2026-04-02", targets: "Energy", indicators: 199, ttps: 24 },
    { name: "APT-41", alias: "Double Dragon", origin: "China", type: "Nation-State", severity: "critical", lastActivity: "2026-04-15", targets: "Healthcare", indicators: 453, ttps: 45 },
    { name: "Lazarus Group", alias: "Hidden Cobra", origin: "North Korea", type: "Nation-State", severity: "critical", lastActivity: "2026-04-13", targets: "Healthcare", indicators: 25, ttps: 30 },
    { name: "FIN7", alias: "Carbanak", origin: "Eastern Europe", type: "Financial", severity: "high", lastActivity: "2026-04-11", targets: "Technology", indicators: 351, ttps: 17 },
    { name: "Conti", alias: "Wizard Spider", origin: "Russia", type: "Ransomware", severity: "critical", lastActivity: "2026-04-01", targets: "Energy", indicators: 436, ttps: 43 },
    { name: "LockBit", alias: "LockBit Gang", origin: "Unknown", type: "Ransomware", severity: "high", lastActivity: "2026-04-05", targets: "Energy", indicators: 64, ttps: 12 },
    { name: "Cl0p", alias: "Cl0p Team", origin: "Unknown", type: "Ransomware", severity: "high", lastActivity: "2026-04-09", targets: "Technology", indicators: 85, ttps: 31 },
    { name: "Sandworm", alias: "Unit 74455", origin: "Russia", type: "Nation-State", severity: "critical", lastActivity: "2026-04-04", targets: "Energy", indicators: 289, ttps: 24 },
  ];
  private _training_modIoCFeed = [
    { id: "ioc-000001", type: "ip", value: "177.129.228.38", confidence: 59, source: "CrowdStrike", firstSeen: "2026-04-13", lastSeen: "2026-04-10" },
    { id: "ioc-000002", type: "ip", value: "237.68.208.36", confidence: 64, source: "AlienVault", firstSeen: "2026-04-06", lastSeen: "2026-04-13" },
    { id: "ioc-000003", type: "ip", value: "195.112.9.249", confidence: 88, source: "STIX", firstSeen: "2026-04-17", lastSeen: "2026-04-08" },
    { id: "ioc-000004", type: "ip", value: "144.73.183.155", confidence: 40, source: "VirusTotal", firstSeen: "2026-04-08", lastSeen: "2026-04-02" },
    { id: "ioc-000005", type: "ip", value: "206.177.2.194", confidence: 95, source: "MISP", firstSeen: "2026-04-04", lastSeen: "2026-04-13" },
    { id: "ioc-000006", type: "ip", value: "5.60.44.186", confidence: 76, source: "MISP", firstSeen: "2026-04-19", lastSeen: "2026-04-15" },
    { id: "ioc-000007", type: "ip", value: "83.251.229.89", confidence: 53, source: "CrowdStrike", firstSeen: "2026-04-09", lastSeen: "2026-04-15" },
    { id: "ioc-000008", type: "ip", value: "71.180.12.75", confidence: 70, source: "Mandiant", firstSeen: "2026-04-07", lastSeen: "2026-04-17" },
    { id: "ioc-000009", type: "ip", value: "190.113.23.27", confidence: 77, source: "MISP", firstSeen: "2026-04-14", lastSeen: "2026-04-04" },
    { id: "ioc-000010", type: "ip", value: "62.65.118.179", confidence: 66, source: "VirusTotal", firstSeen: "2026-04-01", lastSeen: "2026-04-10" },
    { id: "ioc-000011", type: "ip", value: "117.102.70.165", confidence: 56, source: "AlienVault", firstSeen: "2026-04-03", lastSeen: "2026-04-19" },
    { id: "ioc-000012", type: "ip", value: "161.101.14.79", confidence: 77, source: "Mandiant", firstSeen: "2026-04-13", lastSeen: "2026-04-05" },
    { id: "ioc-000013", type: "ip", value: "203.41.51.163", confidence: 62, source: "MISP", firstSeen: "2026-04-21", lastSeen: "2026-04-04" },
    { id: "ioc-000014", type: "ip", value: "220.100.236.252", confidence: 46, source: "VirusTotal", firstSeen: "2026-04-05", lastSeen: "2026-04-19" },
    { id: "ioc-000015", type: "ip", value: "83.241.208.4", confidence: 56, source: "AlienVault", firstSeen: "2026-04-15", lastSeen: "2026-04-18" },
  ];
  private _training_modGetActiveThreats() { return this._training_modThreatActors.filter(a => a.severity === 'critical'); }
  private _training_modGetThreatSummary() {
    const actors = this._training_modThreatActors;
    return { total: actors.length, critical: actors.filter(a=>a.severity==="critical").length, high: actors.filter(a=>a.severity==="high").length, nationState: actors.filter(a=>a.type==="Nation-State").length, ransomware: actors.filter(a=>a.type==="Ransomware").length };
  }

  // === Incident Management Extension (training_mod) ===
  private _training_modIncidents = [
    { id: "INC-20260001", title: "Unauthorized access detected", severity: "critical", status: "open", assignedTo: "SOC L1", detectedAt: "2026-04-20T13:11", affectedAssets: 26, rootCause: "Misconfiguration" },
    { id: "INC-20260002", title: "Malware outbreak on workstation", severity: "high", status: "investigating", assignedTo: "SOC L2", detectedAt: "2026-04-19T02:48", affectedAssets: 5, rootCause: "Credential compromise" },
    { id: "INC-20260003", title: "Data leak from S3 bucket", severity: "medium", status: "contained", assignedTo: "IR Lead", detectedAt: "2026-04-13T15:46", affectedAssets: 36, rootCause: "Zero-day" },
    { id: "INC-20260004", title: "Phishing campaign targeting finance", severity: "low", status: "eradicated", assignedTo: "CISO", detectedAt: "2026-04-14T19:27", affectedAssets: 40, rootCause: "Human error" },
    { id: "INC-20260005", title: "DDoS attack on web services", severity: "critical", status: "recovered", assignedTo: "Security Eng", detectedAt: "2026-04-23T08:37", affectedAssets: 12, rootCause: "Policy violation" },
    { id: "INC-20260006", title: "Ransomware encryption attempt", severity: "high", status: "closed", assignedTo: "Forensics", detectedAt: "2026-04-13T21:50", affectedAssets: 41, rootCause: "Unknown" },
    { id: "INC-20260007", title: "Insider data exfiltration", severity: "medium", status: "open", assignedTo: "SOC L1", detectedAt: "2026-04-21T22:27", affectedAssets: 18, rootCause: "Misconfiguration" },
    { id: "INC-20260008", title: "API key exposure in repo", severity: "low", status: "investigating", assignedTo: "SOC L2", detectedAt: "2026-04-23T21:52", affectedAssets: 24, rootCause: "Credential compromise" },
    { id: "INC-20260009", title: "SQL injection on portal", severity: "critical", status: "contained", assignedTo: "IR Lead", detectedAt: "2026-04-17T07:46", affectedAssets: 39, rootCause: "Zero-day" },
    { id: "INC-20260010", title: "Brute force on VPN", severity: "high", status: "eradicated", assignedTo: "CISO", detectedAt: "2026-04-06T06:12", affectedAssets: 30, rootCause: "Human error" },
    { id: "INC-20260011", title: "Supply chain alert from vendor", severity: "medium", status: "recovered", assignedTo: "Security Eng", detectedAt: "2026-04-19T23:54", affectedAssets: 2, rootCause: "Policy violation" },
    { id: "INC-20260012", title: "Suspicious lateral movement", severity: "low", status: "closed", assignedTo: "Forensics", detectedAt: "2026-04-09T23:33", affectedAssets: 29, rootCause: "Unknown" },
  ];
  private _training_modGetIncidentStats() {
    const inc = this._training_modIncidents;
    return { total: inc.length, open: inc.filter(i=>i.status==="open").length, investigating: inc.filter(i=>i.status==="investigating").length, mttd: 6, mttr: 86 };
  }
  private _training_modGetSeverityDistribution() {
    const inc = this._training_modIncidents;
    return { critical: inc.filter(i=>i.severity==="critical").length, high: inc.filter(i=>i.severity==="high").length, medium: inc.filter(i=>i.severity==="medium").length, low: inc.filter(i=>i.severity==="low").length };
  }



  // --- Security Patch Prioritization Engine ---  private _patchPriorityPatches: Array<{id:string;cve:string;title:string;cvss:number;exploitability:number;assetCrit:number;riskScore:number;priority:string;status:string;env:string;scheduledDate:string;exceptionApproved:boolean;exceptionReason:string;complianceDeadline:string;deployedDate:string;rollbackPlan:string}> = [];
  private _patchPriorityCalendar: Array<{date:string;patchId:string;title:string;priority:string;status:string}> = [];
  private _patchPriorityCompliance: {criticalPatched:number;criticalTotal:number;highPatched:number;highTotal:number;mediumPatched:number;mediumTotal:number;slaTargetDays:number;avgPatchDays:number;compliancePct:number;exceptionCount:number;trendData:Array<{week:string;pct:number}>} = {criticalPatched:42,criticalTotal:50,highPatched:88,highTotal:120,mediumPatched:150,mediumTotal:200,slaTargetDays:7,avgPatchDays:4.2,compliancePct:87.3,exceptionCount:8,trendData:[]};
  private _patchPriorityExceptions: Array<{id:string;patchId:string;requestor:string;reason:string;risk:string;approvedBy:string;approvedDate:string;expiryDate:string;status:string}> = [];

  private _initPatchPriorityEngine() {
    const cves = [
      {id:'PP-001',cve:'CVE-2026-1001',title:'Apache Log4j Remote Code Execution',cvss:10.0,exploitability:9.8,assetCrit:10,priority:'P1-Critical',status:'Deployed',env:'Production',scheduledDate:'2026-04-20',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-17',deployedDate:'2026-04-18',rollbackPlan:'Revert to v2.17.1'},
      {id:'PP-002',cve:'CVE-2026-1002',title:'OpenSSL Buffer Overflow',cvss:9.8,exploitability:9.5,assetCrit:9,priority:'P1-Critical',status:'Deployed',env:'Production',scheduledDate:'2026-04-19',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-16',deployedDate:'2026-04-17',rollbackPlan:'Revert to OpenSSL 3.0.8'},
      {id:'PP-003',cve:'CVE-2026-1003',title:'Linux Kernel Privilege Escalation',cvss:9.1,exploitability:8.7,assetCrit:9,priority:'P1-Critical',status:'Scheduled',env:'Staging',scheduledDate:'2026-04-24',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-21',deployedDate:'',rollbackPlan:'Boot from previous kernel'},
      {id:'PP-004',cve:'CVE-2026-1004',title:'Nginx Path Traversal',cvss:8.6,exploitability:8.2,assetCrit:8,priority:'P2-High',status:'Testing',env:'QA',scheduledDate:'2026-04-25',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-23',deployedDate:'',rollbackPlan:'Downgrade to Nginx 1.24.0'},
      {id:'PP-005',cve:'CVE-2026-1005',title:'PostgreSQL Authentication Bypass',cvss:9.8,exploitability:9.0,assetCrit:9,priority:'P1-Critical',status:'Scheduled',env:'Production',scheduledDate:'2026-04-23',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-20',deployedDate:'',rollbackPlan:'Restore pg_hba.conf backup'},
      {id:'PP-006',cve:'CVE-2026-1006',title:'Redis Unauthorized Access',cvss:7.5,exploitability:9.0,assetCrit:7,priority:'P2-High',status:'Deployed',env:'Production',scheduledDate:'2026-04-18',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-22',deployedDate:'2026-04-19',rollbackPlan:'Restart with requirepass'},
      {id:'PP-007',cve:'CVE-2026-1007',title:'Kubernetes API Server Bypass',cvss:9.1,exploitability:8.5,assetCrit:9,priority:'P1-Critical',status:'Exception',env:'Production',scheduledDate:'',exceptionApproved:true,exceptionReason:'Breaking change requires 2-week migration',complianceDeadline:'2026-04-15',deployedDate:'',rollbackPlan:'Rollback k8s version'},
      {id:'PP-008',cve:'CVE-2026-1008',title:'JWT Token Forgery',cvss:8.2,exploitability:7.8,assetCrit:8,priority:'P2-High',status:'Deployed',env:'Production',scheduledDate:'2026-04-17',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-19',deployedDate:'2026-04-16',rollbackPlan:'Revert auth library to v3.2'},
      {id:'PP-009',cve:'CVE-2026-1009',title:'Docker Container Escape',cvss:9.9,exploitability:9.2,assetCrit:9,priority:'P1-Critical',status:'Testing',env:'QA',scheduledDate:'2026-04-26',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-24',deployedDate:'',rollbackPlan:'Pin Docker to v24.0.7'},
      {id:'PP-010',cve:'CVE-2026-1010',title:'Elasticsearch RCE',cvss:9.8,exploitability:9.1,assetCrit:8,priority:'P1-Critical',status:'Scheduled',env:'Production',scheduledDate:'2026-04-22',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-18',deployedDate:'',rollbackPlan:'Restore ES snapshot'},
      {id:'PP-011',cve:'CVE-2026-1011',title:'Spring Framework Injection',cvss:9.8,exploitability:9.3,assetCrit:9,priority:'P1-Critical',status:'Deployed',env:'Production',scheduledDate:'2026-04-15',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-14',deployedDate:'2026-04-14',rollbackPlan:'Revert Spring to 5.3.30'},
      {id:'PP-012',cve:'CVE-2026-1012',title:'MongoDB Privilege Escalation',cvss:8.4,exploitability:7.5,assetCrit:7,priority:'P2-High',status:'Scheduled',env:'Staging',scheduledDate:'2026-04-27',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-25',deployedDate:'',rollbackPlan:'Restore MongoDB 6.0 backup'},
      {id:'PP-013',cve:'CVE-2026-1013',title:'Grafana Auth Bypass',cvss:9.1,exploitability:8.8,assetCrit:7,priority:'P2-High',status:'Deployed',env:'Production',scheduledDate:'2026-04-16',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-17',deployedDate:'2026-04-15',rollbackPlan:'Downgrade Grafana to 10.2.3'},
      {id:'PP-014',cve:'CVE-2026-1014',title:'HAProxy Buffer Overflow',cvss:7.8,exploitability:7.2,assetCrit:8,priority:'P2-High',status:'Testing',env:'QA',scheduledDate:'2026-04-28',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-26',deployedDate:'',rollbackPlan:'Rollback HAProxy to 2.8.4'},
      {id:'PP-015',cve:'CVE-2026-1015',title:'SSH Key Authentication Flaw',cvss:7.2,exploitability:6.8,assetCrit:9,priority:'P2-High',status:'Exception',env:'Production',scheduledDate:'',exceptionApproved:true,exceptionReason:'Legacy system requires older SSH client',complianceDeadline:'2026-04-20',deployedDate:'',rollbackPlan:'Replace SSH keys from backup'},
      {id:'PP-016',cve:'CVE-2026-1016',title:'Windows SMB Remote Code Execution',cvss:9.8,exploitability:9.0,assetCrit:8,priority:'P1-Critical',status:'Deployed',env:'Production',scheduledDate:'2026-04-14',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-13',deployedDate:'2026-04-12',rollbackPlan:'Revert Windows update'},
      {id:'PP-017',cve:'CVE-2026-1017',title:'Python Pickle Deserialization',cvss:8.1,exploitability:7.5,assetCrit:6,priority:'P3-Medium',status:'Scheduled',env:'Staging',scheduledDate:'2026-04-29',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-05-01',deployedDate:'',rollbackPlan:'Pin Python to 3.11.7'},
      {id:'PP-018',cve:'CVE-2026-1018',title:'Node.js ReDoS',cvss:7.5,exploitability:8.0,assetCrit:7,priority:'P2-High',status:'Deployed',env:'Production',scheduledDate:'2026-04-19',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-21',deployedDate:'2026-04-20',rollbackPlan:'Downgrade Node to 20.11.0'},
      {id:'PP-019',cve:'CVE-2026-1019',title:'Java Deserialization Attack',cvss:10.0,exploitability:9.5,assetCrit:9,priority:'P1-Critical',status:'Deployed',env:'Production',scheduledDate:'2026-04-13',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-04-12',deployedDate:'2026-04-11',rollbackPlan:'Revert to Java 17.0.9'},
      {id:'PP-020',cve:'CVE-2026-1020',title:'Git LFS Command Injection',cvss:8.8,exploitability:8.5,assetCrit:5,priority:'P3-Medium',status:'Scheduled',env:'Development',scheduledDate:'2026-04-30',exceptionApproved:false,exceptionReason:'',complianceDeadline:'2026-05-03',deployedDate:'',rollbackPlan:'Disable Git LFS'},
    ];
    cves.forEach(c => { c.riskScore = +(c.cvss * 0.4 + c.exploitability * 0.35 + c.assetCrit * 0.25).toFixed(1); });
    this._patchPriorityPatches = cves;
    this._patchPriorityExceptions = [
      {id:'EX-001',patchId:'PP-007',requestor:'dev-lead-01',reason:'Breaking API changes require service migration',risk:'High - 30-day exposure window',approvedBy:'csa-01',approvedDate:'2026-04-10',expiryDate:'2026-04-30',status:'Active'},
      {id:'EX-002',patchId:'PP-015',requestor:'infra-lead-01',reason:'Legacy systems require older SSH protocol',risk:'Medium - Internal network only',approvedBy:'csa-01',approvedDate:'2026-04-12',expiryDate:'2026-05-12',status:'Active'},
    ];
    const weeks = ['W14','W15','W16','W17','W18'];
    this._patchPriorityCompliance.trendData = weeks.map((w,i) => ({week:w, pct: +(82 + i * 1.3).toFixed(1)}));
    this._patchPriorityCalendar = cves.filter(c=>c.scheduledDate).map(c=>({date:c.scheduledDate,patchId:c.id,title:c.title,priority:c.priority,status:c.status}));
  }

  // --- Security Threat Modeling Canvas ---
  private _strideComponents: Array<{id:string;name:string;type:string;threats:Array<{id:string;type:string;description:string;severity:string;likelihood:string;mitigation:string;mitStatus:string;owner:string}>}> = [];
  private _strideReviewHistory: Array<{id:string;date:string;reviewer:string;component:string;findings:number;approved:boolean;notes:string}> = [];
  private _strideSuggestions: Array<{id:string;component:string;threatType:string;description:string;confidence:number;source:string}> = [];

  private _initStrideCanvas() {
    const components = [
      {id:'SC-001',name:'API Gateway',type:'External Interface',threats:[
        {id:'ST-001',type:'Spoofing',description:'Attacker forges API keys to impersonate legitimate clients',severity:'High',likelihood:'Medium',mitigation:'Implement mTLS with certificate pinning and API key rotation',mitStatus:'Implemented',owner:'sec-team-01'},
        {id:'ST-002',type:'Tampering',description:'Request body manipulation to alter transaction amounts',severity:'Critical',likelihood:'High',mitigation:'HMAC request signing with server-side validation',mitStatus:'Implemented',owner:'sec-team-01'},
        {id:'ST-003',type:'Repudiation',description:'User denies making a transaction, no audit trail',severity:'Medium',likelihood:'Low',mitigation:'Immutable audit log with cryptographic chain',mitStatus:'Partial',owner:'sec-team-02'},
        {id:'ST-004',type:'Info Disclosure',description:'API response leaks internal service IDs and topology',severity:'High',likelihood:'Medium',mitigation:'Response sanitization and field-level encryption',mitStatus:'Implemented',owner:'sec-team-01'},
        {id:'ST-005',type:'Denial of Service',description:'Rate limiting bypass through header manipulation',severity:'High',likelihood:'High',mitigation:'Adaptive rate limiting with IP reputation scoring',mitStatus:'In Progress',owner:'infra-team-01'},
        {id:'ST-006',type:'Elevation',description:'JWT role escalation through claim manipulation',severity:'Critical',likelihood:'Medium',mitigation:'Token validation with server-side session verification',mitStatus:'Implemented',owner:'sec-team-01'},
      ]},
      {id:'SC-002',name:'Authentication Service',type:'Internal Service',threats:[
        {id:'ST-007',type:'Spoofing',description:'Credential stuffing with leaked password databases',severity:'Critical',likelihood:'High',mitigation:'Multi-factor authentication and CAPTCHA',mitStatus:'Implemented',owner:'iam-team-01'},
        {id:'ST-008',type:'Tampering',description:'OAuth token modification during callback',severity:'High',likelihood:'Low',mitigation:'PKCE flow with state parameter validation',mitStatus:'Implemented',owner:'iam-team-01'},
        {id:'ST-009',type:'Elevation',description:'Password reset token prediction attack',severity:'High',likelihood:'Medium',mitigation:'Cryptographically random tokens with expiry',mitStatus:'Implemented',owner:'iam-team-01'},
      ]},
      {id:'SC-003',name:'Payment Processing',type:'Internal Service',threats:[
        {id:'ST-010',type:'Tampering',description:'Payment amount modification in transit',severity:'Critical',likelihood:'Low',mitigation:'End-to-end encryption with payment processor signing',mitStatus:'Implemented',owner:'payments-team'},
        {id:'ST-011',type:'Info Disclosure',description:'Full PAN stored in application database',severity:'Critical',likelihood:'Medium',mitigation:'Tokenization with PCI-DSS compliant vault',mitStatus:'In Progress',owner:'payments-team'},
        {id:'ST-012',type:'Denial of Service',description:'Payment queue flooding to exhaust resources',severity:'High',likelihood:'Medium',mitigation:'Queue depth limits and circuit breaker pattern',mitStatus:'Implemented',owner:'payments-team'},
      ]},
      {id:'SC-004',name:'Database Layer',type:'Data Store',threats:[
        {id:'ST-013',type:'Tampering',description:'SQL injection through unsanitized query parameters',severity:'Critical',likelihood:'Medium',mitigation:'Parameterized queries with ORM layer',mitStatus:'Implemented',owner:'db-team-01'},
        {id:'ST-014',type:'Info Disclosure',description:'Unencrypted PII in database at rest',severity:'Critical',likelihood:'Medium',mitigation:'Transparent data encryption (TDE) with AES-256',mitStatus:'Implemented',owner:'db-team-01'},
        {id:'ST-015',type:'Denial of Service',description:'Query bomb through complex nested queries',severity:'High',likelihood:'Medium',mitigation:'Query timeout limits and resource governance',mitStatus:'Implemented',owner:'db-team-01'},
      ]},
      {id:'SC-005',name:'CDN / Static Assets',type:'External Interface',threats:[
        {id:'ST-016',type:'Tampering',description:'Supply chain attack through compromised npm packages',severity:'Critical',likelihood:'Medium',mitigation:'Lockfile integrity with SRI hashes on all scripts',mitStatus:'Partial',owner:'sec-team-01'},
        {id:'ST-017',type:'Info Disclosure',description:'Source maps exposed in production bundle',severity:'Medium',likelihood:'High',mitigation:'Build pipeline strips source maps for production',mitStatus:'Implemented',owner:'devops-team'},
      ]},
      {id:'SC-006',name:'Message Queue',type:'Internal Infrastructure',threats:[
        {id:'ST-018',type:'Tampering',description:'Message payload modification in transit',severity:'High',likelihood:'Low',mitigation:'TLS encryption with message-level signing',mitStatus:'Implemented',owner:'infra-team-01'},
        {id:'ST-019',type:'Denial of Service',description:'Dead letter queue exhaustion through poison messages',severity:'Medium',likelihood:'Medium',mitigation:'DLQ size limits with alerting and auto-purge',mitStatus:'Implemented',owner:'infra-team-01'},
        {id:'ST-020',type:'Repudiation',description:'No traceability of message processing order',severity:'Medium',likelihood:'Low',mitigation:'Sequence IDs with idempotency keys',mitStatus:'Partial',owner:'infra-team-01'},
      ]},
      {id:'SC-007',name:'Admin Dashboard',type:'Web Application',threats:[
        {id:'ST-021',type:'Spoofing',description:'Session hijacking through XSS on admin panel',severity:'Critical',likelihood:'Medium',mitigation:'Content Security Policy with HttpOnly cookies',mitStatus:'Implemented',owner:'sec-team-01'},
        {id:'ST-022',type:'Elevation',description:'Privilege escalation through IDOR on admin API',severity:'High',likelihood:'High',mitigation:'RBAC with resource-level access checks',mitStatus:'In Progress',owner:'iam-team-01'},
        {id:'ST-023',type:'Info Disclosure',description:'Admin panel accessible without authentication',severity:'Critical',likelihood:'Low',mitigation:'Network segmentation and IP allowlisting',mitStatus:'Implemented',owner:'infra-team-01'},
      ]},
      {id:'SC-008',name:'Third-Party Integrations',type:'External Interface',threats:[
        {id:'ST-024',type:'Spoofing',description:'Webhook signature forgery from integration partner',severity:'High',likelihood:'Medium',mitigation:'HMAC signature validation with secret rotation',mitStatus:'Implemented',owner:'sec-team-01'},
        {id:'ST-025',type:'Info Disclosure',description:'Partner API returns more data than authorized',severity:'High',likelihood:'Low',mitigation:'Response field allowlisting and DLP inspection',mitStatus:'Partial',owner:'sec-team-02'},
        {id:'ST-026',type:'Denial of Service',description:'Partner service outage cascades to our platform',severity:'Medium',likelihood:'Medium',mitigation:'Circuit breaker with graceful degradation',mitStatus:'Implemented',owner:'infra-team-01'},
      ]},
    ];
    this._strideComponents = components;
    this._strideReviewHistory = [
      {id:'SR-001',date:'2026-04-15',reviewer:'sec-arch-01',component:'API Gateway',findings:2,approved:true,notes:'Two new threats identified from penetration test results'},
      {id:'SR-002',date:'2026-04-10',reviewer:'sec-arch-02',component:'Payment Processing',findings:1,approved:false,notes:'Tokenization gap requires remediation before Q2 close'},
      {id:'SR-003',date:'2026-04-05',reviewer:'sec-arch-01',component:'Authentication Service',findings:0,approved:true,notes:'No changes, model remains accurate'},
      {id:'SR-004',date:'2026-03-28',reviewer:'sec-arch-03',component:'Admin Dashboard',findings:3,approved:false,notes:'IDOR vulnerabilities require immediate patching'},
    ];
    this._strideSuggestions = [
      {id:'SS-001',component:'API Gateway',threatType:'Info Disclosure',description:'GraphQL introspection query enabled in production',confidence:0.92,source:'Automated Scanner'},
      {id:'SS-002',component:'Message Queue',threatType:'Tampering',description:'Unencrypted inter-service communication detected',confidence:0.87,source:'Network Analysis'},
      {id:'SS-003',component:'Third-Party Integrations',threatType:'Spoofing',description:'Outdated webhook signing algorithm (HMAC-SHA1)',confidence:0.95,source:'Config Audit'},
    ];
  }

  // --- Security Data Classification Engine ---
  private _dataClassLevels: Array<{level:number;name:string;description:string;color:string;icon:string;handlingPolicy:string;encryption:string;retention:string;accessControl:string;examples:Array<string>}> = [];
  private _dataClassRules: Array<{id:string;name:string;pattern:string;category:string;level:number;enabled:boolean;matchCount:number;lastMatch:string;accuracy:number;falsePositiveRate:number}> = [];
  private _dataClassResults: Array<{id:string;source:string;field:string;classifiedLevel:number;confidence:number;ruleId:string;timestamp:string;reviewed:boolean;correctedLevel:number}> = [];
  private _dataClassMetrics: {totalScanned:number;classifiedCount:number;autoClassifiedPct:number;accuracy:number;misclassificationCount:number;avgConfidence:number;levelsBreakdown:Array<{level:number;count:number;pct:number}>} = {totalScanned:245000,classifiedCount:198000,autoClassifiedPct:92.4,accuracy:96.8,misclassificationCount:342,avgConfidence:94.2,levelsBreakdown:[]};

  private _initDataClassEngine() {
    this._dataClassLevels = [
      {level:1,name:'Public',description:'Information approved for public disclosure with no restrictions',color:'#22c55e',icon:'globe',handlingPolicy:'No restrictions. May be shared externally without approval.',encryption:'Optional',retention:'Per business need',accessControl:'Open access',examples:['Marketing materials','Press releases','Public documentation','Open source code']},
      {level:2,name:'Internal',description:'Business information not intended for public release but low sensitivity',color:'#3b82f6',icon:'building',handlingPolicy:'Share within organization only. External sharing requires manager approval.',encryption:'In transit required',retention:'3 years default',accessControl:'Role-based within org',examples:['Internal memos','Org charts','Project status reports','Meeting notes']},
      {level:3,name:'Confidential',description:'Sensitive business information that could cause moderate harm if disclosed',color:'#f59e0b',icon:'lock',handlingPolicy:'Need-to-know basis only. External sharing requires director approval and NDA.',encryption:'At rest and in transit required',retention:'5 years default',accessControl:'Explicit authorization required',examples:['Financial reports','Customer lists','Strategic plans','Salary data']},
      {level:4,name:'Restricted',description:'Highly sensitive data that could cause severe harm to organization or individuals',color:'#ef4444',icon:'shield',handlingPolicy:'Strict need-to-know. External sharing prohibited except with CISO and legal approval.',encryption:'AES-256 at rest and in transit',retention:'Per regulatory requirement',accessControl:'Named individual access only',examples:['PII (SSN, passport)','Medical records','Authentication credentials','Encryption keys']},
      {level:5,name:'Top Secret',description:'Crown jewels - most critical assets whose compromise would be catastrophic',color:'#7c3aed',icon:'crown',handlingPolicy:'Compartmentalized access. Zero external sharing. Multi-person authorization for any access.',encryption:'HSM-backed AES-256-GCM',retention:'Minimum necessary, auto-purge',accessControl:'MFA + biometric + named access list',examples:['Root CA private keys','Master encryption keys','Crown jewel source code','M&A documents']},
    ];
    this._dataClassRules = [
      {id:'DCR-001',name:'Email Address Detection',pattern:'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',category:'PII',level:4,enabled:true,matchCount:45230,lastMatch:'2026-04-23T14:30:00Z',accuracy:98.2,falsePositiveRate:0.3},
      {id:'DCR-002',name:'SSN Pattern Match',pattern:'\b\d{3}-\d{2}-\d{4}\b',category:'PII',level:4,enabled:true,matchCount:892,lastMatch:'2026-04-22T09:15:00Z',accuracy:94.5,falsePositiveRate:2.1},
      {id:'DCR-003',name:'Credit Card Number (Luhn)',pattern:'\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14}|3[47]\d{13}|6(?:011|5\d{2})\d{12})\b',category:'Financial',level:4,enabled:true,matchCount:1234,lastMatch:'2026-04-23T11:20:00Z',accuracy:99.1,falsePositiveRate:0.1},
      {id:'DCR-004',name:'API Key Detection',pattern:'(?:sk|pk|ak|api)[_-][a-zA-Z0-9]{20,}',category:'Credential',level:5,enabled:true,matchCount:567,lastMatch:'2026-04-23T13:45:00Z',accuracy:97.8,falsePositiveRate:0.5},
      {id:'DCR-005',name:'Private Key Detection',pattern:'-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----',category:'Credential',level:5,enabled:true,matchCount:12,lastMatch:'2026-04-20T16:00:00Z',accuracy:100.0,falsePositiveRate:0.0},
      {id:'DCR-006',name:'IP Address Detection',pattern:'\b(?:\d{1,3}\.){3}\d{1,3}\b',category:'Infrastructure',level:2,enabled:true,matchCount:89000,lastMatch:'2026-04-23T14:55:00Z',accuracy:92.1,falsePositiveRate:5.2},
      {id:'DCR-007',name:'Database Connection String',pattern:'(?:mysql|postgres|mongodb|redis)://[\w:]+@[\w.-]+:\d+',category:'Credential',level:5,enabled:true,matchCount:45,lastMatch:'2026-04-21T10:30:00Z',accuracy:99.5,falsePositiveRate:0.1},
      {id:'DCR-008',name:'JWT Token Detection',pattern:'eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+',category:'Credential',level:4,enabled:true,matchCount:2345,lastMatch:'2026-04-23T14:20:00Z',accuracy:96.7,falsePositiveRate:1.2},
      {id:'DCR-009',name:'Phone Number Detection',pattern:'\b\+?1?\(?:\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',category:'PII',level:3,enabled:true,matchCount:34567,lastMatch:'2026-04-23T12:00:00Z',accuracy:93.4,falsePositiveRate:3.8},
      {id:'DCR-010',name:'Date of Birth Pattern',pattern:'\b(?:0[1-9]|1[0-2])/(?:0[1-9]|[12]\d|3[01])/(?:19|20)\d{2}\b',category:'PII',level:3,enabled:true,matchCount:12340,lastMatch:'2026-04-23T09:00:00Z',accuracy:88.9,falsePositiveRate:6.5},
      {id:'DCR-011',name:'AWS Account ID',pattern:'\b\d{12}\b',category:'Cloud Infrastructure',level:3,enabled:true,matchCount:6789,lastMatch:'2026-04-23T10:00:00Z',accuracy:85.2,falsePositiveRate:8.1},
      {id:'DCR-012',name:'Kubernetes Secret Reference',pattern:'(?:Secret|secret)[s]?:\s*[\w-]+',category:'Infrastructure',level:4,enabled:true,matchCount:890,lastMatch:'2026-04-22T15:30:00Z',accuracy:91.3,falsePositiveRate:4.2},
      {id:'DCR-013',name:'Internal Domain Pattern',pattern:'(?:\.corp|\.internal|\.local|\.staging)\b',category:'Infrastructure',level:2,enabled:true,matchCount:23456,lastMatch:'2026-04-23T14:00:00Z',accuracy:95.6,falsePositiveRate:1.8},
      {id:'DCR-014',name:'Salary Compensation Keywords',pattern:'(?:salary|compensation|base pay|annual income)\s*[:\$]?\s*[\d,]+',category:'Financial',level:3,enabled:true,matchCount:567,lastMatch:'2026-04-21T14:00:00Z',accuracy:89.7,falsePositiveRate:5.5},
      {id:'DCR-015',name:'Medical Record Keywords',pattern:'(?:diagnosis|prescription|medical record|patient ID)\s*[:#]?\s*[\w-]+',category:'Health',level:4,enabled:true,matchCount:345,lastMatch:'2026-04-22T11:00:00Z',accuracy:90.1,falsePositiveRate:4.8},
    ];
    this._dataClassMetrics.levelsBreakdown = [
      {level:1,count:120000,pct:48.8},{level:2,count:58000,pct:23.7},
      {level:3,count:42000,pct:17.1},{level:4,count:22000,pct:9.0},{level:5,count:3000,pct:1.4},
    ];
    this._dataClassResults = [
      {id:'DCX-001',source:'user_profiles_db',field:'email_address',classifiedLevel:4,confidence:98.2,ruleId:'DCR-001',timestamp:'2026-04-23T14:30:00Z',reviewed:true,correctedLevel:0},
      {id:'DCX-002',source:'payment_logs',field:'card_number',classifiedLevel:4,confidence:99.1,ruleId:'DCR-003',timestamp:'2026-04-23T11:20:00Z',reviewed:true,correctedLevel:0},
      {id:'DCX-003',source:'config_repo',field:'database_url',classifiedLevel:5,confidence:99.5,ruleId:'DCR-007',timestamp:'2026-04-21T10:30:00Z',reviewed:true,correctedLevel:0},
      {id:'DCX-004',source:'app_logs',field:'user_agent',classifiedLevel:2,confidence:72.3,ruleId:'DCR-006',timestamp:'2026-04-23T14:55:00Z',reviewed:false,correctedLevel:0},
      {id:'DCX-005',source:'hr_database',field:'salary_amount',classifiedLevel:3,confidence:89.7,ruleId:'DCR-014',timestamp:'2026-04-21T14:00:00Z',reviewed:true,correctedLevel:0},
    ];
  }

  // --- Security Service Mesh Monitor ---
  private _meshServices: Array<{id:string;name:string;namespace:string;mTlsEnabled:boolean;authPolicy:string;apiCalls24h:number;errorRate:number;latencyP99:number;dependencies:Array<string>;policyViolations:number;lastScan:string;securityScore:number}> = [];
  private _meshAuthRules: Array<{id:string;source:string;destination:string;methods:Array<string>;allowed:boolean;createdAt:string;lastUpdated:string}> = [];
  private _meshAlerts: Array<{id:string;severity:string;service:string;type:string;description:string;timestamp:string;acknowledged:boolean;action:string}> = [];

  private _initMeshMonitor() {
    this._meshServices = [
      {id:'MS-001',name:'api-gateway',namespace:'edge',mTlsEnabled:true,authPolicy:'strict',apiCalls24h:2450000,errorRate:0.02,latencyP99:45,dependencies:['auth-svc','user-svc','order-svc'],policyViolations:0,lastScan:'2026-04-23T14:00:00Z',securityScore:98},
      {id:'MS-002',name:'auth-svc',namespace:'identity',mTlsEnabled:true,authPolicy:'strict',apiCalls24h:890000,errorRate:0.05,latencyP99:22,dependencies:['user-db','session-cache'],policyViolations:0,lastScan:'2026-04-23T14:00:00Z',securityScore:97},
      {id:'MS-003',name:'user-svc',namespace:'core',mTlsEnabled:true,authPolicy:'strict',apiCalls24h:1200000,errorRate:0.01,latencyP99:35,dependencies:['user-db','event-bus'],policyViolations:0,lastScan:'2026-04-23T14:00:00Z',securityScore:96},
      {id:'MS-004',name:'payment-svc',namespace:'billing',mTlsEnabled:true,authPolicy:'strict',apiCalls24h:340000,errorRate:0.08,latencyP99:120,dependencies:['payment-gateway','order-db','audit-svc'],policyViolations:2,lastScan:'2026-04-23T13:55:00Z',securityScore:89},
      {id:'MS-005',name:'order-svc',namespace:'core',mTlsEnabled:true,authPolicy:'permissive',apiCalls24h:780000,errorRate:0.03,latencyP99:55,dependencies:['order-db','inventory-svc','payment-svc'],policyViolations:1,lastScan:'2026-04-23T14:00:00Z',securityScore:91},
      {id:'MS-006',name:'inventory-svc',namespace:'supply-chain',mTlsEnabled:false,authPolicy:'none',apiCalls24h:450000,errorRate:0.15,latencyP99:88,dependencies:['inventory-db'],policyViolations:5,lastScan:'2026-04-23T13:50:00Z',securityScore:72},
      {id:'MS-007',name:'notification-svc',namespace:'messaging',mTlsEnabled:true,authPolicy:'permissive',apiCalls24h:670000,errorRate:0.04,latencyP99:30,dependencies:['email-provider','push-provider','user-svc'],policyViolations:1,lastScan:'2026-04-23T14:00:00Z',securityScore:88},
      {id:'MS-008',name:'analytics-svc',namespace:'data',mTlsEnabled:true,authPolicy:'strict',apiCalls24h:230000,errorRate:0.06,latencyP99:200,dependencies:['clickhouse','event-bus'],policyViolations:0,lastScan:'2026-04-23T14:00:00Z',securityScore:95},
      {id:'MS-009',name:'search-svc',namespace:'discovery',mTlsEnabled:true,authPolicy:'strict',apiCalls24h:1500000,errorRate:0.01,latencyP99:65,dependencies:['elasticsearch','user-svc'],policyViolations:0,lastScan:'2026-04-23T14:00:00Z',securityScore:99},
      {id:'MS-010',name:'legacy-adapter',namespace:'integration',mTlsEnabled:false,authPolicy:'none',apiCalls24h:89000,errorRate:0.22,latencyP99:350,dependencies:['legacy-api'],policyViolations:8,lastScan:'2026-04-23T13:45:00Z',securityScore:45},
    ];
    this._meshAuthRules = [
      {id:'AR-001',source:'api-gateway',destination:'auth-svc',methods:['POST'],allowed:true,createdAt:'2026-01-15',lastUpdated:'2026-04-10'},
      {id:'AR-002',source:'api-gateway',destination:'user-svc',methods:['GET','PUT'],allowed:true,createdAt:'2026-01-15',lastUpdated:'2026-04-10'},
      {id:'AR-003',source:'api-gateway',destination:'payment-svc',methods:['POST'],allowed:true,createdAt:'2026-02-01',lastUpdated:'2026-04-15'},
      {id:'AR-004',source:'order-svc',destination:'inventory-svc',methods:['GET','POST'],allowed:true,createdAt:'2026-02-15',lastUpdated:'2026-03-20'},
      {id:'AR-005',source:'analytics-svc',destination:'user-svc',methods:['GET'],allowed:false,createdAt:'2026-03-01',lastUpdated:'2026-04-20'},
      {id:'AR-006',source:'notification-svc',destination:'user-svc',methods:['GET'],allowed:true,createdAt:'2026-03-10',lastUpdated:'2026-04-05'},
    ];
    this._meshAlerts = [
      {id:'MA-001',severity:'Critical',service:'inventory-svc',type:'mTLS_DISABLED',description:'Service has mTLS disabled, allowing plaintext traffic',timestamp:'2026-04-23T13:50:00Z',acknowledged:true,action:'Enable mTLS and enforce strict policy'},
      {id:'MA-002',severity:'Critical',service:'legacy-adapter',type:'AUTH_NONE',description:'No authentication policy configured for external-facing service',timestamp:'2026-04-23T13:45:00Z',acknowledged:false,action:'Implement JWT validation middleware'},
      {id:'MA-003',severity:'High',service:'order-svc',type:'POLICY_PERMISSIVE',description:'Permissive auth policy allows any authenticated caller',timestamp:'2026-04-23T12:00:00Z',acknowledged:true,action:'Migrate to strict RBAC policy'},
      {id:'MA-004',severity:'Medium',service:'payment-svc',type:'HIGH_ERROR_RATE',description:'Error rate 0.08% exceeds 0.05% threshold',timestamp:'2026-04-23T11:30:00Z',acknowledged:false,action:'Investigate payment gateway timeouts'},
      {id:'MA-005',severity:'Low',service:'notification-svc',type:'LATENCY_SPIKE',description:'P99 latency increased from 25ms to 30ms',timestamp:'2026-04-23T10:00:00Z',acknowledged:true,action:'Monitor and scale if trend continues'},
    ];
  }

  // --- Security Runbook Library ---
  private _runbooks: Array<{id:string;title:string;category:string;severity:string;steps:Array<{order:number;action:string;command:string;expected:string;timeout:number}>;lastExecuted:string;successRate:number;execCount:number;version:number;contributors:Array<string>;tags:Array<string>;estimatedTime:number;reviewCycle:string}> = [];
  private _runbookHistory: Array<{id:string;runbookId:string;executedBy:string;executedAt:string;duration:number;status:string;notes:string;stepsCompleted:number;stepsTotal:number}> = [];
  private _runbookLeaderboard: Array<{name:string;contributions:number;lastActive:string;expertise:Array<string>;avgRating:number}> = [];

  private _initRunbookLibrary() {
    this._runbooks = [
      {id:'RB-001',title:'Ransomware Incident Response',category:'Incident Response',severity:'Critical',steps:[
        {order:1,action:'Isolate affected systems from network',command:'ifconfig eth0 down; iptables -A INPUT -j DROP',expected:'Network interfaces disabled',timeout:5},
        {order:2,action:'Capture volatile memory dump',command:'limem output=/forensics/memdump.lime',expected:'Memory dump created successfully',timeout:30},
        {order:3,action:'Identify ransomware variant via file markers',command:'python3 /tools/ransomware_id.py /infected/',expected:'Variant identified with confidence score',timeout:15},
        {order:4,action:'Check for encryption key in memory strings',command:'strings /forensics/memdump.lime | grep -iE "(key|decrypt|aes|rsa)" | head -50',expected:'Potential key material extracted',timeout:60},
        {order:5,action:'Preserve disk images for forensics',command:'dd if=/dev/sda of=/forensics/disk.img bs=4M status=progress',expected:'Disk image created with hash verification',timeout:600},
        {order:6,action:'Notify incident response team via secure channel',command:'ir-cli notify --severity critical --team "ir-core"',expected:'Team notified with case number',timeout:10},
        {order:7,action:'Begin evidence chain of custody documentation',command:'cofctl init --case "Ransomware-$(date +%Y%m%d)"',expected:'Case file created with timestamps',timeout:5},
      ],lastExecuted:'2026-04-20T08:30:00Z',successRate:94.2,execCount:17,version:3,contributors:['ir-lead-01','forensics-01','soc-analyst-02'],tags:['ransomware','incident','forensics','emergency'],estimatedTime:45,reviewCycle:'Monthly'},
      {id:'RB-002',title:'Phishing Campaign Mitigation',category:'Incident Response',severity:'High',steps:[
        {order:1,action:'Extract phishing URL from reported email',command:'phish-extract --input /tmp/reported.eml --output /tmp/phish_data.json',expected:'URL and headers extracted',timeout:5},
        {order:2,action:'Block phishing URL at perimeter firewall',command:'fw-cli block --url "$(jq -r .url /tmp/phish_data.json)" --reason "Active phishing campaign"',expected:'URL blocked globally',timeout:10},
        {order:3,action:'Query email logs for all recipients of phishing email',command:'email-search --subject "$(jq -r .subject /tmp/phish_data.json)" --since "24h"',expected:'List of all recipients identified',timeout:30},
        {order:4,action:'Force password reset for users who clicked the link',command:'ad-cli reset-password --users-file /tmp/clicked_users.txt --notify',expected:'Password resets initiated',timeout:60},
        {order:5,action:'Submit phishing URL to threat intelligence feeds',command:'ti-submit --url "$(jq -r .url /tmp/phish_data.json)" --tags "phishing,credential-harvest"',expected:'URL shared with TI community',timeout:15},
      ],lastExecuted:'2026-04-22T14:15:00Z',successRate:97.8,execCount:34,version:5,contributors:['soc-analyst-01','soc-analyst-03','email-admin'],tags:['phishing','email','credential-theft'],estimatedTime:20,reviewCycle:'Bi-weekly'},
      {id:'RB-003',title:'DDoS Attack Mitigation',category:'Incident Response',severity:'Critical',steps:[
        {order:1,action:'Verify DDoS attack pattern from traffic analysis',command:'traffic-analyze --window 5m --threshold 3x',expected:'Attack pattern confirmed with vector type',timeout:15},
        {order:2,action:'Activate rate limiting at edge',command:'edge-cli ratelimit --global --rps 1000 --burst 5000',expected:'Rate limiting active at all edge PoPs',timeout:5},
        {order:3,action:'Enable CDN caching for all static assets',command:'cdn-cli cache-enable --path "/*" --ttl 3600',expected:'Cache hit ratio increases above 90%',timeout:10},
        {order:4,action:'Contact ISP for upstream filtering if needed',command:'escalate-cli notify --provider "$(jq -r .isp /config/network.json)" --type ddos',expected:'ISP notified and upstream filtering initiated',timeout:30},
        {order:5,action:'Monitor traffic levels and gradually relax limits',command:'traffic-monitor --interval 60s --threshold 1.5x --auto-relax',expected:'Normal traffic levels restored',timeout:3600},
      ],lastExecuted:'2026-04-15T03:20:00Z',successRate:91.5,execCount:8,version:2,contributors:['net-ops-01','soc-analyst-01','edge-engineer'],tags:['ddos','network','availability','emergency'],estimatedTime:60,reviewCycle:'Monthly'},
      {id:'RB-004',title:'Credential Compromise Response',category:'Incident Response',severity:'Critical',steps:[
        {order:1,action:'Identify scope of compromised credentials',command:'iam-cli query-compromised --source-alert "$ALERT_ID"',expected:'List of affected user accounts and systems',timeout:15},
        {order:2,action:'Disable all compromised sessions immediately',command:'iam-cli revoke-sessions --users-file /tmp/compromised_users.txt --all-devices',expected:'All sessions terminated',timeout:10},
        {order:3,action:'Force password reset for affected accounts',command:'iam-cli force-reset --users-file /tmp/compromised_users.txt --require-mfa',expected:'Password resets sent with MFA enforcement',timeout:30},
        {order:4,action:'Review recent access logs for lateral movement',command:'siem-query --user "$(cat /tmp/compromised_users.txt)" --since "72h" --output /tmp/access_review.json',expected:'Access log review completed',timeout:120},
        {order:5,action:'Check for persistence mechanisms (API keys, tokens, SSH keys)',command:'persist-check --users-file /tmp/compromised_users.txt --all-systems',expected:'Persistence scan complete',timeout:300},
      ],lastExecuted:'2026-04-18T16:45:00Z',successRate:96.0,execCount:12,version:4,contributors:['iam-lead-01','soc-analyst-02','forensics-01'],tags:['credential','compromise','iam','lateral-movement'],estimatedTime:30,reviewCycle:'Monthly'},
      {id:'RB-005',title:'Cloud Security Incident Playbook',category:'Cloud Security',severity:'High',steps:[
        {order:1,action:'Identify affected cloud resources from alert',command:'cloud-query --alert "$ALERT_ID" --resources',expected:'List of affected cloud resources',timeout:15},
        {order:2,action:'Isolate compromised cloud resources via security groups',command:'cloud-isolate --resources /tmp/affected_resources.json --mode restrict',expected:'Network isolation applied',timeout:10},
        {order:3,action:'Capture cloud instance metadata and logs',command:'cloud-forensics capture --resources /tmp/affected_resources.json --output /forensics/cloud/',expected:'Metadata and logs archived',timeout:60},
        {order:4,action:'Review IAM policies for unauthorized changes',command:'cloud-audit iam --since "24h" --changes-only',expected:'IAM change audit complete',timeout:30},
        {order:5,action:'Rotate all potentially exposed credentials',command:'cloud-rotate-keys --scope affected --force',expected:'All exposed keys rotated',timeout:45},
      ],lastExecuted:'2026-04-19T11:00:00Z',successRate:93.3,execCount:6,version:2,contributors:['cloud-sec-01','soc-analyst-01','iam-lead-01'],tags:['cloud','aws','gcp','azure','incident'],estimatedTime:25,reviewCycle:'Quarterly'},
      {id:'RB-006',title:'Data Breach Notification Workflow',category:'Compliance',severity:'Critical',steps:[
        {order:1,action:'Classify breached data by sensitivity level',command:'data-classify --source /tmp/breach_scope.json --output /tmp/classification.json',expected:'Data classified by sensitivity level',timeout:15},
        {order:2,action:'Determine regulatory notification requirements',command:'compliance-check --breach /tmp/classification.json --jurisdictions all',expected:'Notification requirements and deadlines listed',timeout:10},
        {order:3,action:'Draft notification letters for affected individuals',command:'notify-draft --template legal/breach_letter --recipients /tmp/affected_users.csv',expected:'Notification letters generated',timeout:30},
        {order:4,action:'Notify regulatory bodies within required timeframe',command:'regulatory-notify --authority "$(jq -r .authority /tmp/requirements.json)" --breach-id "$CASE_ID"',expected:'Regulatory notification confirmed',timeout:15},
        {order:5,action:'Activate credit monitoring for affected individuals',command:'credit-monitor activate --recipients /tmp/affected_users.csv --duration 12months',expected:'Credit monitoring enrollment confirmed',timeout:60},
      ],lastExecuted:'2026-03-15T09:00:00Z',successRate:100.0,execCount:2,version:1,contributors:['legal-01','dpo-01','compliance-01'],tags:['breach','notification','gdpr','regulatory','legal'],estimatedTime:120,reviewCycle:'Quarterly'},
    ];
    this._runbookHistory = [
      {id:'RH-001',runbookId:'RB-001',executedBy:'ir-lead-01',executedAt:'2026-04-20T08:30:00Z',duration:42,status:'Success',notes:'Variant identified as LockBit 4.0, no lateral movement detected',stepsCompleted:7,stepsTotal:7},
      {id:'RH-002',runbookId:'RB-002',executedBy:'soc-analyst-03',executedAt:'2026-04-22T14:15:00Z',duration:18,status:'Success',notes:'Phishing campaign from credential harvester, 12 users clicked',stepsCompleted:5,stepsTotal:5},
      {id:'RH-003',runbookId:'RB-003',executedBy:'net-ops-01',executedAt:'2026-04-15T03:20:00Z',duration:55,status:'Success',notes:'Volumetric DDoS attack mitigated, peak at 45Gbps',stepsCompleted:5,stepsTotal:5},
      {id:'RH-004',runbookId:'RB-004',executedBy:'iam-lead-01',executedAt:'2026-04-18T16:45:00Z',duration:28,status:'Partial',notes:'3 of 5 accounts had lateral movement, full containment required 45min',stepsCompleted:4,stepsTotal:5},
      {id:'RH-005',runbookId:'RB-005',executedBy:'cloud-sec-01',executedAt:'2026-04-19T11:00:00Z',duration:22,status:'Success',notes:'EC2 instance compromised via exposed RDP, isolated within 5min',stepsCompleted:5,stepsTotal:5},
    ];
    this._runbookLeaderboard = [
      {name:'ir-lead-01',contributions:45,lastActive:'2026-04-23',expertise:['Incident Response','Forensics','Malware Analysis'],avgRating:4.8},
      {name:'soc-analyst-01',contributions:38,lastActive:'2026-04-23',expertise:['SOC Operations','Threat Hunting','SIEM'],avgRating:4.7},
      {name:'iam-lead-01',contributions:32,lastActive:'2026-04-22',expertise:['Identity Management','Access Control','Zero Trust'],avgRating:4.6},
      {name:'cloud-sec-01',contributions:28,lastActive:'2026-04-21',expertise:['Cloud Security','Kubernetes','Container Security'],avgRating:4.5},
      {name:'net-ops-01',contributions:25,lastActive:'2026-04-20',expertise:['Network Security','DDoS Mitigation','Firewall Management'],avgRating:4.4},
      {name:'forensics-01',contributions:22,lastActive:'2026-04-19',expertise:['Digital Forensics','Memory Analysis','Disk Forensics'],avgRating:4.7},
    ];
  }


  // --- Security Intelligence Feed Aggregator ---
  private _intelFeedSources: Array<{id:string;name:string;type:string;frequency:string;lastFetch:string;status:string;articleCount:number;reliabilityScore:number;enabled:boolean}> = [];
  private _intelFeedItems: Array<{id:string;sourceId:string;title:string;severity:string;category:string;publishedAt:string;iocCount:number;iocs:Array<{type:string;value:string;confidence:number}>;tags:Array<string>;summary:string;actionRequired:boolean;relatedIncidents:number}> = [];
  private _intelFeedStats: {totalSources:number;activeSources:number;items24h:number;iocsExtracted:number;falsePositiveRate:number;avgReliability:number;topCategories:Array<{name:string;count:number}>} = {totalSources:25,activeSources:22,items24h:847,iocsExtracted:2341,falsePositiveRate:2.3,avgReliability:87.5,topCategories:[]};

  private _initIntelFeed() {
    this._intelFeedSources = [
      {id:'IF-001',name:'NIST NVD',type:'CVE Database',frequency:'Daily',lastFetch:'2026-04-23T14:00:00Z',status:'Active',articleCount:234567,reliabilityScore:98,enabled:true},
      {id:'IF-002',name:'AlienVault OTX',type:'Threat Intelligence',frequency:'Hourly',lastFetch:'2026-04-23T14:30:00Z',status:'Active',articleCount:89234,reliabilityScore:85,enabled:true},
      {id:'IF-003',name:'MISP Community',type:'Shared Indicators',frequency:'Real-time',lastFetch:'2026-04-23T14:35:00Z',status:'Active',articleCount:45678,reliabilityScore:82,enabled:true},
      {id:'IF-004',name:'CISA KEV',type:'Known Exploited Vulns',frequency:'Weekly',lastFetch:'2026-04-22T00:00:00Z',status:'Active',articleCount:1234,reliabilityScore:99,enabled:true},
      {id:'IF-005',name:'Recorded Future',type:'Commercial TI',frequency:'Real-time',lastFetch:'2026-04-23T14:35:00Z',status:'Active',articleCount:156789,reliabilityScore:92,enabled:true},
      {id:'IF-006',name:'Shodan Monitor',type:'Attack Surface',frequency:'Daily',lastFetch:'2026-04-23T06:00:00Z',status:'Active',articleCount:34567,reliabilityScore:88,enabled:true},
      {id:'IF-007',name:'VirusTotal',type:'Malware Intelligence',frequency:'On-demand',lastFetch:'2026-04-23T13:45:00Z',status:'Active',articleCount:78901,reliabilityScore:90,enabled:true},
      {id:'IF-008',name:'Abuse.ch',type:'Threat Intelligence',frequency:'Hourly',lastFetch:'2026-04-23T14:20:00Z',status:'Active',articleCount:23456,reliabilityScore:87,enabled:true},
      {id:'IF-009',name:'Security Blogs Aggregator',type:'News',frequency:'Hourly',lastFetch:'2026-04-23T14:30:00Z',status:'Active',articleCount:56789,reliabilityScore:75,enabled:true},
      {id:'IF-010',name:'Internal CTI Team',type:'Internal Intelligence',frequency:'On-demand',lastFetch:'2026-04-23T12:00:00Z',status:'Active',articleCount:2345,reliabilityScore:95,enabled:true},
    ];
    this._intelFeedItems = [
      {id:'ITM-001',sourceId:'IF-004',title:'Critical RCE in Apache Struts actively exploited',severity:'Critical',category:'Vulnerability',publishedAt:'2026-04-23T10:00:00Z',iocCount:3,iocs:[{type:'CVE',value:'CVE-2026-2001',confidence:0.99},{type:'URL',value:'/struts2-showcase/integration/saveGangster.action',confidence:0.95},{type:'Payload',value:"%{(#_='multipart/form-data')}",confidence:0.92}],tags:['rce','apache','actively-exploited','critical'],summary:'Apache Struts remote code execution vulnerability being actively exploited in the wild. CISA has added to Known Exploited Vulnerabilities catalog.',actionRequired:true,relatedIncidents:2},
      {id:'ITM-002',sourceId:'IF-002',title:'New Clop ransomware variant targeting healthcare',severity:'High',category:'Malware',publishedAt:'2026-04-23T08:30:00Z',iocCount:5,iocs:[{type:'Domain',value:'data-clop[.]onion',confidence:0.88},{type:'Hash',value:'a1b2c3d4e5f6...',confidence:0.91},{type:'Email',value:'support@secure-backup[.]com',confidence:0.85},{type:'IP',value:'185.220.101.42',confidence:0.87},{type:'File',value:'ransomware.exe',confidence:0.82}],tags:['ransomware','clop','healthcare','active-campaign'],summary:'New Clop ransomware variant specifically targeting healthcare organizations. Uses double-extortion and maintains persistence via scheduled tasks.',actionRequired:true,relatedIncidents:1},
      {id:'ITM-003',sourceId:'IF-005',title:'Supply chain attack via compromised npm package',severity:'High',category:'Supply Chain',publishedAt:'2026-04-22T22:00:00Z',iocCount:2,iocs:[{type:'Package',value:'@utils/core-lib@2.1.0',confidence:0.96},{type:'Hash',value:'sha256:e3b0c44298fc...',confidence:0.94}],tags:['supply-chain','npm','javascript','malicious-package'],summary:'Malicious npm package discovered stealing environment variables and sending them to attacker-controlled server. Over 50k weekly downloads before removal.',actionRequired:true,relatedIncidents:0},
      {id:'ITM-004',sourceId:'IF-001',title:'Buffer overflow in OpenSSH server',severity:'High',category:'Vulnerability',publishedAt:'2026-04-22T18:00:00Z',iocCount:1,iocs:[{type:'CVE',value:'CVE-2026-2002',confidence:0.98}],tags:['ssh','buffer-overflow','privilege-escalation','cvss-8.5'],summary:'Buffer overflow vulnerability in OpenSSH server allows unauthenticated remote code execution under certain configurations.',actionRequired:false,relatedIncidents:0},
      {id:'ITM-005',sourceId:'IF-008',title:'Phishing campaign impersonating Microsoft 365',severity:'Medium',category:'Phishing',publishedAt:'2026-04-23T06:00:00Z',iocCount:4,iocs:[{type:'Domain',value:'microsoft-secure[.]login-auth[.]com',confidence:0.93},{type:'URL',value:'/auth/login?redirect=office365',confidence:0.90},{type:'IP',value:'91.215.85.123',confidence:0.86},{type:'Email',value:'security@microsoft-alerts[.]com',confidence:0.89}],tags:['phishing','microsoft','credential-theft','m365'],summary:'Large-scale phishing campaign using lookalike domains to harvest Microsoft 365 credentials. Targeting enterprise users with fake security alerts.',actionRequired:false,relatedIncidents:0},
    ];
    this._intelFeedStats.topCategories = [
      {name:'Vulnerability',count:312},{name:'Malware',count:187},{name:'Phishing',count:156},
      {name:'Supply Chain',count:89},{name:'Ransomware',count:67},{name:'Data Leak',count:36},
    ];
  }


  // --- Security Compliance Scanner ---
  private _complianceScannerFrameworks: Array<{id:string;name:string;version:string;controlsTotal:number;controlsPassed:number;controlsFailed:number;controlsPending:number;lastScan:string;nextScan:string;status:string}> = [];
  private _complianceScannerFindings: Array<{id:string;frameworkId:string;controlId:string;severity:string;title:string;description:string;remediation:string;evidence:string;status:string;assignee:string;dueDate:string}> = [];

  private _initComplianceScanner() {
    this._complianceScannerFrameworks = [
      {id:'CF-001',name:'SOC 2 Type II',version:'2024.1',controlsTotal:234,controlsPassed:198,controlsFailed:18,controlsPending:18,lastScan:'2026-04-20',nextScan:'2026-05-20',status:'Active'},
      {id:'CF-002',name:'ISO 27001:2022',version:'3.0',controlsTotal:114,controlsPassed:102,controlsFailed:8,controlsPending:4,lastScan:'2026-04-15',nextScan:'2026-07-15',status:'Active'},
      {id:'CF-003',name:'PCI DSS 4.0',version:'4.0.1',controlsTotal:250,controlsPassed:225,controlsFailed:15,controlsPending:10,lastScan:'2026-04-10',nextScan:'2026-10-10',status:'Active'},
      {id:'CF-004',name:'NIST CSF 2.0',version:'2.0',controlsTotal:106,controlsPassed:89,controlsFailed:12,controlsPending:5,lastScan:'2026-04-18',nextScan:'2026-07-18',status:'Active'},
      {id:'CF-005',name:'HIPAA Security Rule',version:'2013',controlsTotal:78,controlsPassed:72,controlsFailed:4,controlsPending:2,lastScan:'2026-04-12',nextScan:'2026-10-12',status:'Active'},
    ];
    this._complianceScannerFindings = [
      {id:'CSF-001',frameworkId:'CF-001',controlId:'CC6.1',severity:'High',title:'Incomplete encryption at rest for backup data',description:'Three backup storage locations lack AES-256 encryption',remediation:'Enable TDE on all backup databases',evidence:'Backup audit report Q1-2026',status:'Open',assignee:'db-team-01',dueDate:'2026-05-15'},
      {id:'CSF-002',frameworkId:'CF-002',controlId:'A.8.9',severity:'Medium',title:'Configuration management not fully documented',description:'System configuration changes lack formal documentation',remediation:'Implement IaC with GitOps workflow',evidence:'Config audit findings',status:'In Progress',assignee:'devops-team',dueDate:'2026-06-01'},
      {id:'CSF-003',frameworkId:'CF-003',controlId:'REQ.3',severity:'Critical',title:'Default passwords on network devices',description:'Four network devices still using factory default credentials',remediation:'Change all default passwords and implement credential rotation',evidence:'Network scan report',status:'Open',assignee:'net-ops-01',dueDate:'2026-04-30'},
    ];
  }

  // ===== ROUND 39: Security Compliance Evidence Collector =====
  private _complianceFrameworks: Array<{id:string;name:string;version:string;controlsTotal:number;controlsMapped:number;evidenceCollected:number;evidenceQuality:number;lastAssessment:string;status:string}> = [];
  private _evidenceCollectionStatus: Array<{controlId:string;controlName:string;framework:string;evidenceType:string;status:string;lastCollected:string;qualityScore:number;collector:string;notes:string}> = [];
  private _evidenceGapAnalysis: Array<{framework:string;controlArea:string;gapType:string;severity:string;affectedControls:number;remediationPlan:string;targetDate:string}> = [];

  private _initComplianceEvidenceCollector(): void {
    const frameworks = [
      {id:'ISO27001',name:'ISO 27001',version:'2022',controlsTotal:93},
      {id:'SOC2',name:'SOC 2 Type II',version:'2017',controlsTotal:64},
      {id:'NIST80053',name:'NIST SP 800-53 Rev5',version:'5.1',controlsTotal:1082},
      {id:'PCI-DSS',name:'PCI DSS v4.0',version:'4.0',controlsTotal:78},
      {id:'HIPAA',name:'HIPAA Security Rule',version:'2013',controlsTotal:78},
      {id:'GDPR',name:'GDPR',version:'2016',controlsTotal:45},
      {id:'CSA-STAR',name:'CSA STAR',version:'2.0',controlsTotal:197},
      {id:'CIS-Benchmark',name:'CIS Controls v8',version:'8.1',controlsTotal:56},
      {id:'NIST-CSF',name:'NIST CSF 2.0',version:'2.0',controlsTotal:106},
      {id:'FedRAMP',name:'FedRAMP High',version:'Rev 5',controlsTotal:425}
    ];
    const evidenceTypes = ['Automated Scan','Manual Review','Policy Document','Configuration Snapshot','Interview Record','Screen Capture','Log Export','Assessment Report','Vendor Attestation','Penetration Test Report'];
    const statuses = ['collected','partial','missing','expired','pending_review','approved'];
    const collectors = ['Automated Scanner','GRC Platform','Manual Auditor','API Integration','Third-Party Tool'];
    const controlAreas = ['Access Control','Encryption','Network Security','Logging & Monitoring','Incident Response','Data Protection','Identity Management','Physical Security','Change Management','Vendor Management'];
    const gapTypes = ['Missing Evidence','Insufficient Evidence Quality','Expired Evidence','Incomplete Coverage','Manual Process Gap','Tool Integration Gap'];
    this._complianceFrameworks = frameworks.map(fw => {
      const mapped = Math.floor(fw.controlsTotal * (0.6 + Math.random() * 0.35));
      const collected = Math.floor(mapped * (0.5 + Math.random() * 0.45));
      return {
        ...fw,
        controlsMapped: mapped,
        evidenceCollected: collected,
        evidenceQuality: Math.round((60 + Math.random() * 35) * 10) / 10,
        lastAssessment: '2026-04-' + String(Math.floor(Math.random() * 20) + 1).padStart(2, '0'),
        status: collected / mapped > 0.8 ? 'compliant' : collected / mapped > 0.5 ? 'partial' : 'non-compliant'
      };
    });
    this._evidenceCollectionStatus = Array.from({length: 50}, (_, i) => ({
      controlId: controlAreas[i % controlAreas.length].substring(0,3).toUpperCase() + '-' + String(i + 1).padStart(3, '0'),
      controlName: controlAreas[i % controlAreas.length] + ' Control ' + (i + 1),
      framework: frameworks[Math.floor(Math.random() * frameworks.length)].name,
      evidenceType: evidenceTypes[Math.floor(Math.random() * evidenceTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      lastCollected: '2026-04-' + String(Math.floor(Math.random() * 20) + 1).padStart(2, '0'),
      qualityScore: Math.round((40 + Math.random() * 60) * 10) / 10,
      collector: collectors[Math.floor(Math.random() * collectors.length)],
      notes: 'Evidence artifact collected via automated compliance pipeline'
    }));
    this._evidenceGapAnalysis = Array.from({length: 25}, () => ({
      framework: frameworks[Math.floor(Math.random() * frameworks.length)].name,
      controlArea: controlAreas[Math.floor(Math.random() * controlAreas.length)],
      gapType: gapTypes[Math.floor(Math.random() * gapTypes.length)],
      severity: ['critical','high','medium','low'][Math.floor(Math.random() * 4)],
      affectedControls: Math.floor(Math.random() * 10) + 1,
      remediationPlan: 'Implement automated evidence collection and quality validation pipeline',
      targetDate: '2026-' + String(Math.floor(Math.random() * 6) + 5).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')
    }));
  }

  private _getOverallComplianceScore(): number {
    if (this._complianceFrameworks.length === 0) return 0;
    const scores = this._complianceFrameworks.map(fw => fw.evidenceCollected / fw.controlsMapped * fw.evidenceQuality / 100);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 100);
  }

  private _getEvidenceQualityBreakdown(): {excellent:number;good:number;fair:number;poor:number} {
    const items = this._evidenceCollectionStatus;
    return {
      excellent: items.filter(e => e.qualityScore >= 85).length,
      good: items.filter(e => e.qualityScore >= 70 && e.qualityScore < 85).length,
      fair: items.filter(e => e.qualityScore >= 50 && e.qualityScore < 70).length,
      poor: items.filter(e => e.qualityScore < 50).length
    };
  }

  private _getAuditReadinessScore(): number {
    const total = this._evidenceCollectionStatus.length;
    if (total === 0) return 0;
    const approved = this._evidenceCollectionStatus.filter(e => e.status === 'approved' || e.status === 'collected').length;
    return Math.round(approved / total * 100);
  }

  private _generateEvidencePackage(frameworkId: string): Array<{controlId:string;evidenceCount:number;artifacts:Array<{name:string;type:string;size:number;hash:string}>;status:string}> {
    return Array.from({length: 10}, (_, i) => ({
      controlId: 'CTL-' + String(i + 1).padStart(3, '0'),
      evidenceCount: Math.floor(Math.random() * 5) + 1,
      artifacts: Array.from({length: Math.floor(Math.random() * 3) + 1}, () => ({
        name: 'evidence_artifact_' + (i + 1) + '_' + Math.floor(Math.random() * 100) + '.pdf',
        type: 'document',
        size: Math.floor(Math.random() * 5000) + 100,
        hash: 'sha256:' + Math.random().toString(36).substring(2, 18)
      })),
      status: 'ready'
    }));
  }

  private _getCriticalGaps(): Array<typeof this._evidenceGapAnalysis[0]> {
    return this._evidenceGapAnalysis.filter(g => g.severity === 'critical' || g.severity === 'high');
  }

  private _getEvidenceCollectionTrend(): Array<{week:string;collected:number;approved:number;rejected:number;pending:number}> {
    return Array.from({length: 8}, (_, i) => ({
      week: '2026-W' + String(14 + i).padStart(2, '0'),
      collected: Math.floor(Math.random() * 50) + 20,
      approved: Math.floor(Math.random() * 40) + 10,
      rejected: Math.floor(Math.random() * 10),
      pending: Math.floor(Math.random() * 15) + 5
    }));
  }



  private _automatedComplianceChecks: Array<{checkId:string;name:string;framework:string;frequency:string;lastRun:string;result:string;duration:number;exceptions:number;nextRun:string}> = [];
  private _complianceTrainingStatus: Array<{department:string;totalEmployees:number;completedTraining:number;compliancePercent:number;overdueCount:number;avgScore:number;nextTrainingDue:string}> = [];
  private _regulatoryChangeTracker: Array<{regulation:string;jurisdiction:string;changeDescription:string;effectiveDate:string;impactLevel:string;affectedControls:number;readinessPercent:number;owner:string;status:string}> = [];
  private _thirdPartyComplianceAttestations: Array<{vendor:string;framework:string;attestationDate:string;expiryDate:string;status:string;score:number;findings:number;nextReview:string}> = [];

  private _initRound39ExtraCompliance(): void {
    const frameworks = ['ISO 27001','SOC 2','NIST 800-53','PCI DSS','HIPAA','GDPR','CIS Controls','NIST CSF','FedRAMP','SOX'];
    const frequencies = ['Daily','Weekly','Monthly','Quarterly','Annually'];
    const results = ['pass','fail','warning','error','skipped'];
    const departments = ['Engineering','Finance','HR','Legal','Marketing','Operations','Sales','Executive'];
    const jurisdictions = ['US','EU','UK','APAC','Global'];
    this._automatedComplianceChecks = Array.from({length: 30}, (_, i) => ({
      checkId: 'CHK-' + String(i + 1).padStart(4, '0'),
      name: 'Automated compliance validation check ' + (i + 1),
      framework: frameworks[Math.floor(Math.random() * frameworks.length)],
      frequency: frequencies[Math.floor(Math.random() * frequencies.length)],
      lastRun: '2026-04-' + String(Math.floor(Math.random() * 23) + 1).padStart(2, '0') + 'T06:00:00Z',
      result: results[Math.floor(Math.random() * results.length)],
      duration: Math.floor(Math.random() * 300) + 10,
      exceptions: Math.floor(Math.random() * 5),
      nextRun: '2026-04-' + String(Math.floor(Math.random() * 10) + 24).padStart(2, '0') + 'T06:00:00Z'
    }));
    this._complianceTrainingStatus = departments.map(dept => {
      const total = Math.floor(Math.random() * 100) + 20;
      const completed = Math.floor(total * (0.6 + Math.random() * 0.35));
      return {
        department: dept, totalEmployees: total, completedTraining: completed,
        compliancePercent: Math.round(completed / total * 1000) / 10,
        overdueCount: Math.floor((total - completed) * 0.3),
        avgScore: Math.round((65 + Math.random() * 30) * 10) / 10,
        nextTrainingDue: '2026-05-' + String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')
      };
    });
    this._regulatoryChangeTracker = Array.from({length: 15}, (_, i) => ({
      regulation: frameworks[Math.floor(Math.random() * frameworks.length)],
      jurisdiction: jurisdictions[Math.floor(Math.random() * jurisdictions.length)],
      changeDescription: 'Regulatory update requiring security control modifications',
      effectiveDate: '2026-' + String(Math.floor(Math.random() * 6) + 7).padStart(2, '0') + '-01',
      impactLevel: ['critical','high','medium','low'][Math.floor(Math.random() * 4)],
      affectedControls: Math.floor(Math.random() * 15) + 1,
      readinessPercent: Math.floor(Math.random() * 80) + 10,
      owner: departments[Math.floor(Math.random() * departments.length)] + ' Compliance Lead',
      status: ['preparing','in-progress','ready','implemented'][Math.floor(Math.random() * 4)]
    }));
    this._thirdPartyComplianceAttestations = Array.from({length: 12}, (_, i) => ({
      vendor: 'Third Party Vendor ' + (i + 1),
      framework: frameworks[Math.floor(Math.random() * frameworks.length)],
      attestationDate: '2025-' + String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') + '-01',
      expiryDate: '2026-' + String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') + '-01',
      status: ['valid','expiring','expired','pending'][Math.floor(Math.random() * 4)],
      score: Math.round((60 + Math.random() * 35) * 10) / 10,
      findings: Math.floor(Math.random() * 10),
      nextReview: '2026-' + String(Math.floor(Math.random() * 6) + 7).padStart(2, '0') + '-01'
    }));
  }

  private _getComplianceCheckPassRate(): number {
    if (this._automatedComplianceChecks.length === 0) return 0;
    const passed = this._automatedComplianceChecks.filter(c => c.result === 'pass').length;
    return Math.round(passed / this._automatedComplianceChecks.length * 1000) / 10;
  }

  private _getTrainingComplianceScore(): number {
    if (this._complianceTrainingStatus.length === 0) return 0;
    return Math.round(this._complianceTrainingStatus.reduce((s, d) => s + d.compliancePercent, 0) / this._complianceTrainingStatus.length * 10) / 10;
  }

  private _getRegulatoryReadinessScore(): number {
    if (this._regulatoryChangeTracker.length === 0) return 0;
    return Math.round(this._regulatoryChangeTracker.reduce((s, r) => s + r.readinessPercent, 0) / this._regulatoryChangeTracker.length * 10) / 10;
  }

  private _getExpiringAttestations(): number {
    return this._thirdPartyComplianceAttestations.filter(a => a.status === 'expiring' || a.status === 'expired').length;
  }

  private _getHighImpactChanges(): number {
    return this._regulatoryChangeTracker.filter(r => r.impactLevel === 'critical' || r.impactLevel === 'high').length;
  }


  private _securityTrendForecaster: Array<{metric:string;currentValue:number;projected30d:number;projected90d:number;confidence:number;model:string;lastUpdated:string;dataPoints:number}> = [];
  private _securityBenchmarkComparison: Array<{metric:string;ourValue:number;industryAvg:number;topQuartile:number;bottomQuartile:number;percentileRank:number;gapToTop:string}> = [];
  private _securityAlertSuppressionRules: Array<{ruleId:string;name:string;source:string;condition:string;suppressedCount:number;lastTriggered:string;expiresAt:string;createdBy:string;active:boolean}> = [];
  private _securityWorkflowAutomations: Array<{workflowId:string;name:string;trigger:string;actions:number;avgExecutionTime:number;successRate:number;lastExecuted:string;enabled:boolean}> = [];
  private _securityDataQualityMetrics: Array<{dataSource:string;completeness:number;accuracy:number;timeliness:number;consistency:number;freshness:number;overallScore:number;issues:number}> = [];

  private _initRound39ExtraTrends(): void {
    const metrics = ['MTTD','MTTR','Vulnerability Backlog','Patch Compliance','Phishing Click Rate','MFA Adoption','Encryption Coverage','Access Review Compliance','Incident Frequency','False Positive Rate','Mean Time to Contain','Recovery Time'];
    this._securityTrendForecaster = metrics.map(metric => ({
      metric, currentValue: Math.floor(Math.random() * 100) + 10,
      projected30d: Math.floor(Math.random() * 100) + 10,
      projected90d: Math.floor(Math.random() * 100) + 10,
      confidence: Math.round((60 + Math.random() * 35) * 10) / 10,
      model: ['ARIMA','Prophet','Linear Regression','Exponential Smoothing','LSTM Neural Network'][Math.floor(Math.random() * 5)],
      lastUpdated: '2026-04-22T08:00:00Z',
      dataPoints: Math.floor(Math.random() * 300) + 30
    }));
    this._securityBenchmarkComparison = metrics.slice(0, 8).map(metric => ({
      metric, ourValue: Math.floor(Math.random() * 100),
      industryAvg: Math.floor(Math.random() * 60) + 20,
      topQuartile: Math.floor(Math.random() * 30) + 70,
      bottomQuartile: Math.floor(Math.random() * 20) + 5,
      percentileRank: Math.floor(Math.random() * 100),
      gapToTop: Math.floor(Math.random() * 40) + 5 + ' points'
    }));
    this._securityAlertSuppressionRules = Array.from({length: 15}, (_, i) => ({
      ruleId: 'SUP-' + String(i + 1).padStart(4, '0'),
      name: 'Alert suppression rule ' + (i + 1),
      source: ['SIEM','EDR','WAF','Cloud','IDS'][Math.floor(Math.random() * 5)],
      condition: 'Pattern match on known benign alert signature',
      suppressedCount: Math.floor(Math.random() * 5000) + 100,
      lastTriggered: '2026-04-' + String(Math.floor(Math.random() * 23) + 1).padStart(2, '0'),
      expiresAt: '2026-' + String(Math.floor(Math.random() * 6) + 7).padStart(2, '0') + '-01',
      createdBy: 'SOC Analyst',
      active: Math.random() > 0.2
    }));
    this._securityWorkflowAutomations = Array.from({length: 12}, (_, i) => ({
      workflowId: 'WF-' + String(i + 1).padStart(4, '0'),
      name: 'Automated security workflow ' + (i + 1),
      trigger: 'Alert triggered matching predefined correlation pattern',
      actions: Math.floor(Math.random() * 8) + 2,
      avgExecutionTime: Math.floor(Math.random() * 120) + 5,
      successRate: Math.round((80 + Math.random() * 20) * 10) / 10,
      lastExecuted: '2026-04-' + String(Math.floor(Math.random() * 23) + 1).padStart(2, '0'),
      enabled: Math.random() > 0.15
    }));
    this._securityDataQualityMetrics = ['Vulnerability Scanner','SIEM Logs','Asset Inventory','Threat Intelligence','Compliance Database','Identity Store','Network Flows','Cloud Audit Logs'].map(dataSource => ({
      dataSource, completeness: Math.round((70 + Math.random() * 30) * 10) / 10,
      accuracy: Math.round((75 + Math.random() * 25) * 10) / 10,
      timeliness: Math.round((60 + Math.random() * 35) * 10) / 10,
      consistency: Math.round((80 + Math.random() * 20) * 10) / 10,
      freshness: Math.round((65 + Math.random() * 30) * 10) / 10,
      overallScore: 0, issues: Math.floor(Math.random() * 15)
    }));
    this._securityDataQualityMetrics.forEach(m => { m.overallScore = Math.round((m.completeness + m.accuracy + m.timeliness + m.consistency + m.freshness) / 5 * 10) / 10; });
  }

  private _getForecastAccuracy(): number {
    if (this._securityTrendForecaster.length === 0) return 0;
    return Math.round(this._securityTrendForecaster.reduce((s, f) => s + f.confidence, 0) / this._securityTrendForecaster.length * 10) / 10;
  }

  private _getBenchmarkPercentile(): number {
    if (this._securityBenchmarkComparison.length === 0) return 0;
    return Math.round(this._securityBenchmarkComparison.reduce((s, b) => s + b.percentileRank, 0) / this._securityBenchmarkComparison.length);
  }

  private _getActiveSuppressions(): number {
    return this._securityAlertSuppressionRules.filter(r => r.active).length;
  }

  private _getTotalSuppressedAlerts(): number {
    return this._securityAlertSuppressionRules.reduce((s, r) => s + r.suppressedCount, 0);
  }

  private _getActiveWorkflows(): number {
    return this._securityWorkflowAutomations.filter(w => w.enabled).length;
  }

  private _getAverageDataQuality(): number {
    if (this._securityDataQualityMetrics.length === 0) return 0;
    return Math.round(this._securityDataQualityMetrics.reduce((s, m) => s + m.overallScore, 0) / this._securityDataQualityMetrics.length * 10) / 10;
  }

  private _getLowQualityDataSources(): number {
    return this._securityDataQualityMetrics.filter(m => m.overallScore < 80).length;
  }


  private _securityKpiHistory: Array<{date:string;score:number;target:number;category:string}> = [];
  private _securityIncidentLessonsLearned: Array<{id:string;incidentId:string;lesson:string;category:string;severity:string;appliedCount:number;status:string;owner:string}> = [];
  private _securityToolIntegrationMap: Record<string,Array<{tool:string;direction:string;protocol:string;status:string}>> = {};

  private _initRound39ExtraSmall(): void {
    this._securityKpiHistory = Array.from({length: 30}, (_, i) => ({
      date: '2026-03-' + String(i + 1).padStart(2, '0'),
      score: Math.floor(Math.random() * 30) + 70,
      target: 90,
      category: 'Overall Security Posture'
    }));
    this._securityIncidentLessonsLearned = Array.from({length: 8}, (_, i) => ({
      id: 'LL-' + String(i + 1).padStart(3, '0'),
      incidentId: 'INC-2026-' + String(Math.floor(Math.random() * 200) + 1).padStart(4, '0'),
      lesson: 'Security lesson learned from incident response post-mortem review',
      category: ['Detection','Response','Prevention','Recovery'][Math.floor(Math.random() * 4)],
      severity: ['critical','high','medium'][Math.floor(Math.random() * 3)],
      appliedCount: Math.floor(Math.random() * 5),
      status: ['applied','pending','deferred'][Math.floor(Math.random() * 3)],
      owner: 'Security Operations Team'
    }));
    const tools = ['SIEM','EDR','NIDS','WAF','DLP','SOAR','TIP','Vuln Scanner'];
    const protocols = ['syslog','CEF','REST API','Webhook','SNMP','SC4RE'];
    const directions = ['inbound','outbound','bidirectional'];
    tools.forEach(tool => {
      this._securityToolIntegrationMap[tool] = Array.from({length: 3}, () => ({
        tool: tools[Math.floor(Math.random() * tools.length)],
        direction: directions[Math.floor(Math.random() * directions.length)],
        protocol: protocols[Math.floor(Math.random() * protocols.length)],
        status: Math.random() > 0.2 ? 'active' : 'inactive'
      }));
    });
  }

  private _getKpiTrendDirection(): string {
    if (this._securityKpiHistory.length < 7) return 'stable';
    const recent = this._securityKpiHistory.slice(-7);
    const avg = recent.reduce((s, k) => s + k.score, 0) / recent.length;
    const older = this._securityKpiHistory.slice(-14, -7);
    const olderAvg = older.reduce((s, k) => s + k.score, 0) / older.length;
    return avg > olderAvg + 2 ? 'improving' : avg < olderAvg - 2 ? 'declining' : 'stable';
  }

  private _getAppliedLessonsCount(): number {
    return this._securityIncidentLessonsLearned.filter(l => l.status === 'applied').length;
  }

  private _getActiveIntegrations(): number {
    let count = 0;
    Object.values(this._securityToolIntegrationMap).forEach(integrations => {
      count += integrations.filter(i => i.status === 'active').length;
    });
    return count;
  }

  private _getPendingLessons(): number {
    return this._securityIncidentLessonsLearned.filter(l => l.status === 'pending').length;
  }

  private _getAvgKpiScore(): number {
    if (this._securityKpiHistory.length === 0) return 0;
    return Math.round(this._securityKpiHistory.reduce((s, k) => s + k.score, 0) / this._securityKpiHistory.length * 10) / 10;
  }

  // === SECTION A: Security Metrics Benchmarking Hub ===
  private _bmIndustryMetrics: Array<{name: string; current: number; benchmark: number; bestInClass: number; peerAvg: number; gap: number; trend: string; source: string}> = [];
  private _bmPeerOrgs: Array<{name: string; overallScore: number; riskPosture: number; maturityLevel: number; industry: string; size: string}> = [];
  private _bmHistoricalTrends: Array<{month: string; mtd: number; mtt: number; mtp: number; mta: number; vulnerabilityCoverage: number; patchCompliance: number; incidentResponse: number}> = [];
  private _bmGapAnalysis: Array<{metric: string; currentGap: number; targetGap: number; projectedClose: string; actionPlan: string; owner: string; priority: string; estimatedROI: number}> = [];
  private _bmSelectedBenchmark: string = 'nist_csf';
  private _bmTimeRange: string = '12m';
  private _bmComparisonMode: string = 'industry';

  private _initBmIndustryMetrics() {
    const benchmarks = {
      nist_csf: { mtd: 85, mtt: 72, mtp: 78, mta: 82, vc: 90, pc: 88, ir: 76, sa: 70 },
      iso27001: { mtd: 80, mtt: 68, mtp: 82, mta: 78, vc: 88, pc: 85, ir: 80, sa: 72 },
      cis_controls: { mtd: 88, mtt: 75, mtp: 80, mta: 85, vc: 92, pc: 90, ir: 78, sa: 68 },
      soc2: { mtd: 82, mtt: 70, mtp: 76, mta: 80, vc: 86, pc: 84, ir: 74, sa: 66 },
    };
    const selected = benchmarks[this._bmSelectedBenchmark] || benchmarks.nist_csf;
    this._bmIndustryMetrics = [
      { name: 'Mean Time to Detect (MTD)', current: 68, benchmark: selected.mtd, bestInClass: selected.mtd + 12, peerAvg: selected.mtd - 8, gap: selected.mtd - 68, trend: 'improving', source: 'NIST CSF Benchmark 2025' },
      { name: 'Mean Time to Triage (MTT)', current: 45, benchmark: selected.mtt, bestInClass: selected.mtt + 10, peerAvg: selected.mtt - 6, gap: selected.mtt - 45, trend: 'stable', source: 'SANS IR Survey 2025' },
      { name: 'Mean Time to Patch (MTP)', current: 62, benchmark: selected.mtp, bestInClass: selected.mtp + 8, peerAvg: selected.mtp - 10, gap: selected.mtp - 62, trend: 'improving', source: 'Patch Management Benchmark' },
      { name: 'Mean Time to Acknowledge (MTA)', current: 15, benchmark: selected.mta, bestInClass: selected.mta + 5, peerAvg: selected.mta - 3, gap: selected.mta - 15, trend: 'improving', source: 'SOC Performance Metrics' },
      { name: 'Vulnerability Coverage', current: 82, benchmark: selected.vc, bestInClass: selected.vc + 6, peerAvg: selected.vc - 8, gap: selected.vc - 82, trend: 'improving', source: 'Vulnerability Mgmt Benchmark' },
      { name: 'Patch Compliance Rate', current: 78, benchmark: selected.pc, bestInClass: selected.pc + 7, peerAvg: selected.pc - 12, gap: selected.pc - 78, trend: 'stable', source: 'Configuration Mgmt Benchmark' },
      { name: 'Incident Response Score', current: 65, benchmark: selected.ir, bestInClass: selected.ir + 15, peerAvg: selected.ir - 10, gap: selected.ir - 65, trend: 'declining', source: 'IR Capability Assessment' },
      { name: 'Security Awareness Score', current: 58, benchmark: selected.sa, bestInClass: selected.sa + 18, peerAvg: selected.sa - 5, gap: selected.sa - 58, trend: 'stable', source: 'Security Awareness Benchmark' },
    ];
  }

  private _initBmPeerOrganizations() {
    this._bmPeerOrgs = [
      { name: 'TechCorp Global', overallScore: 82, riskPosture: 78, maturityLevel: 4, industry: 'Technology', size: 'Enterprise' },
      { name: 'FinanceFirst Inc', overallScore: 88, riskPosture: 85, maturityLevel: 5, industry: 'Financial Services', size: 'Enterprise' },
      { name: 'HealthSecure Ltd', overallScore: 75, riskPosture: 70, maturityLevel: 3, industry: 'Healthcare', size: 'Mid-Market' },
      { name: 'CloudNet Systems', overallScore: 85, riskPosture: 82, maturityLevel: 4, industry: 'Technology', size: 'Enterprise' },
      { name: 'RetailGuard Corp', overallScore: 72, riskPosture: 68, maturityLevel: 3, industry: 'Retail', size: 'Mid-Market' },
      { name: 'ManufacturaSafe', overallScore: 70, riskPosture: 65, maturityLevel: 2, industry: 'Manufacturing', size: 'Enterprise' },
      { name: 'GovShield Agency', overallScore: 90, riskPosture: 88, maturityLevel: 5, industry: 'Government', size: 'Large' },
      { name: 'EduProtect Uni', overallScore: 68, riskPosture: 62, maturityLevel: 2, industry: 'Education', size: 'Mid-Market' },
    ];
  }

  private _initBmHistoricalTrends() {
    const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10', '2025-11', '2025-12'];
    this._bmHistoricalTrends = months.map((month, i) => ({
      month, mtd: 45 + i * 2.5 + Math.floor(Math.random() * 5), mtt: 30 + i * 1.8 + Math.floor(Math.random() * 3),
      mtp: 40 + i * 2.2 + Math.floor(Math.random() * 4), mta: 10 + i * 0.5 + Math.floor(Math.random() * 2),
      vulnerabilityCoverage: 65 + i * 1.8 + Math.floor(Math.random() * 3), patchCompliance: 55 + i * 2.1 + Math.floor(Math.random() * 4),
      incidentResponse: 50 + i * 1.5 + Math.floor(Math.random() * 3), sa: 40 + i * 1.6 + Math.floor(Math.random() * 2),
    }));
  }

  private _initBmGapAnalysis() {
    this._bmGapAnalysis = [
      { metric: 'MTD', currentGap: 17, targetGap: 0, projectedClose: '2026-Q2', actionPlan: 'Deploy EDR with automated detection rules', owner: 'SOC Team Lead', priority: 'High', estimatedROI: 250000 },
      { metric: 'Patch Compliance', currentGap: 10, targetGap: 0, projectedClose: '2026-Q3', actionPlan: 'Implement automated patch management pipeline', owner: 'IT Ops Manager', priority: 'High', estimatedROI: 180000 },
      { metric: 'IR Score', currentGap: 11, targetGap: 5, projectedClose: '2026-Q4', actionPlan: 'Conduct tabletop exercises and update playbooks', owner: 'IR Manager', priority: 'Critical', estimatedROI: 320000 },
      { metric: 'Security Awareness', currentGap: 12, targetGap: 3, projectedClose: '2026-Q3', actionPlan: 'Launch gamified training program with monthly phishing sims', owner: 'CISO', priority: 'Medium', estimatedROI: 150000 },
    ];
  }

  private _renderBmIndustryComparison() {
    const headerStyle = 'display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 80px;gap:4px;padding:6px 8px;background:#1a2332;border-radius:6px 6px 0 0;font-weight:600;font-size:12px;color:#8899aa;';
    const rowStyle = 'display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr 80px;gap:4px;padding:5px 8px;border-bottom:1px solid #1e2d3d;font-size:12px;align-items:center;';
    return html`
      <div style="margin-top:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-weight:600;font-size:14px;color:#e0e0e0;">Industry Benchmark Comparison</span>
          <select style="background:#1a2332;color:#c0c0c0;border:1px solid #2a3a4a;border-radius:4px;padding:3px 8px;font-size:11px;" .value=${this._bmSelectedBenchmark} @change=${this._onBmBenchmarkChange}>
            <option value="nist_csf">NIST CSF</option><option value="iso27001">ISO 27001</option>
            <option value="cis_controls">CIS Controls</option><option value="soc2">SOC 2</option>
          </select>
        </div>
        <div style="${headerStyle}"><span>Metric</span><span>Current</span><span>Benchmark</span><span>Best-in-Class</span><span>Peer Avg</span><span>Trend</span></div>
        ${this._bmIndustryMetrics.map(m => html`
          <div style="${rowStyle}">
            <span style="color:#c0c0c0;">${m.name}</span>
            <span style="color:${m.current >= m.benchmark ? '#4caf50' : '#ff9800'};">${m.current}%</span>
            <span style="color:#8899aa;">${m.benchmark}%</span>
            <span style="color:#64b5f6;">${m.bestInClass}%</span>
            <span style="color:#8899aa;">${m.peerAvg}%</span>
            <span style="color:${m.trend === 'improving' ? '#4caf50' : m.trend === 'declining' ? '#f44336' : '#ff9800'};font-size:11px;">${m.trend}</span>
          </div>
        `)}
      </div>`;
  }

  private _renderBmPeerComparison() {
    const cardStyle = 'background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;padding:10px;min-width:180px;';
    return html`
      <div style="margin-top:16px;">
        <span style="font-weight:600;font-size:14px;color:#e0e0e0;">Peer Organization Comparison</span>
        <div style="display:flex;gap:10px;overflow-x:auto;padding:10px 0;">
          ${this._bmPeerOrgs.map(p => html`
            <div style="${cardStyle}">
              <div style="font-weight:600;color:#e0e0e0;font-size:12px;margin-bottom:6px;">${p.name}</div>
              <div style="font-size:11px;color:#8899aa;margin-bottom:4px;">${p.industry} | ${p.size}</div>
              <div style="display:flex;justify-content:space-between;font-size:11px;">
                <span style="color:#4caf50;">Score: ${p.overallScore}</span>
                <span style="color:#64b5f6;">ML: ${p.maturityLevel}</span>
              </div>
              <div style="margin-top:4px;height:4px;background:#0d1520;border-radius:2px;">
                <div style="height:100%;width:${p.riskPosture}%;background:${p.riskPosture > 80 ? '#4caf50' : p.riskPosture > 60 ? '#ff9800' : '#f44336'};border-radius:2px;"></div>
              </div>
            </div>
          `)}
        </div>
      </div>`;
  }

  private _renderBmGapAnalysis() {
    return html`
      <div style="margin-top:16px;">
        <span style="font-weight:600;font-size:14px;color:#e0e0e0;">Gap-to-Benchmark Analysis</span>
        <div style="margin-top:8px;">
          ${this._bmGapAnalysis.map(g => html`
            <div style="background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;padding:10px;margin-bottom:6px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;color:#e0e0e0;font-size:12px;">${g.metric} Gap Analysis</span>
                <span style="padding:2px 8px;border-radius:10px;font-size:10px;background:${g.priority === 'Critical' ? '#f44336' : g.priority === 'High' ? '#ff9800' : '#2196f3'};color:white;">${g.priority}</span>
              </div>
              <div style="display:flex;gap:20px;margin-top:6px;font-size:11px;">
                <span style="color:#ff9800;">Current Gap: ${g.currentGap}%</span>
                <span style="color:#4caf50;">Target: ${g.targetGap}%</span>
                <span style="color:#64b5f6;">Close: ${g.projectedClose}</span>
                <span style="color:#e0e0e0;">ROI: $${g.estimatedROI.toLocaleString()}</span>
              </div>
              <div style="font-size:11px;color:#8899aa;margin-top:4px;">${g.actionPlan} (Owner: ${g.owner})</div>
            </div>
          `)}
        </div>
      </div>`;
  }

  // === SECTION B: Security Third-Party Risk Dashboard ===
  private _tprVendors: Array<{id: string; name: string; category: string; riskScore: number; tier: string; assessmentDue: string; questionnaireStatus: string; incidents: number; slaCompliance: number; lastReview: string; dataAccess: string; criticality: string}> = [];
  private _tprSelectedVendor: string = '';
  private _tprFilterTier: string = 'all';
  private _tprSortField: string = 'riskScore';
  private _tprIncidentHistory: Array<{vendorId: string; date: string; type: string; severity: string; status: string; description: string}> = [];
  private _tprMitigationActions: Array<{id: string; vendorId: string; action: string; priority: string; dueDate: string; status: string; assignee: string}> = [];

  private _initTprVendors() {
    this._tprVendors = [
      { id: 'v001', name: 'CloudFlare CDN', category: 'Infrastructure', riskScore: 22, tier: 'Low', assessmentDue: '2026-06-15', questionnaireStatus: 'Complete', incidents: 0, slaCompliance: 99.8, lastReview: '2026-01-10', dataAccess: 'Traffic metadata only', criticality: 'Operational' },
      { id: 'v002', name: 'AWS Cloud Services', category: 'Cloud Provider', riskScore: 35, tier: 'Medium', assessmentDue: '2026-05-20', questionnaireStatus: 'Complete', incidents: 1, slaCompliance: 99.5, lastReview: '2026-02-15', dataAccess: 'Full infrastructure access', criticality: 'Critical' },
      { id: 'v003', name: 'Okta IAM Platform', category: 'Identity', riskScore: 28, tier: 'Low', assessmentDue: '2026-07-01', questionnaireStatus: 'In Progress', incidents: 0, slaCompliance: 99.9, lastReview: '2026-01-20', dataAccess: 'Identity data, SSO tokens', criticality: 'Critical' },
      { id: 'v004', name: 'Datadog Monitoring', category: 'Observability', riskScore: 30, tier: 'Medium', assessmentDue: '2026-04-30', questionnaireStatus: 'Complete', incidents: 2, slaCompliance: 99.2, lastReview: '2025-12-15', dataAccess: 'Application logs, metrics', criticality: 'High' },
      { id: 'v005', name: 'CrowdStrike EDR', category: 'Endpoint Security', riskScore: 18, tier: 'Low', assessmentDue: '2026-08-10', questionnaireStatus: 'Complete', incidents: 0, slaCompliance: 99.7, lastReview: '2026-03-01', dataAccess: 'Endpoint telemetry', criticality: 'High' },
      { id: 'v006', name: 'Jira Service Desk', category: 'IT Service', riskScore: 40, tier: 'High', assessmentDue: '2026-04-15', questionnaireStatus: 'Overdue', incidents: 3, slaCompliance: 98.5, lastReview: '2025-11-20', dataAccess: 'Project data, tickets', criticality: 'Operational' },
      { id: 'v007', name: 'GitHub Enterprise', category: 'Development', riskScore: 32, tier: 'Medium', assessmentDue: '2026-05-01', questionnaireStatus: 'In Progress', incidents: 1, slaCompliance: 99.3, lastReview: '2026-02-01', dataAccess: 'Source code, CI/CD pipelines', criticality: 'Critical' },
      { id: 'v008', name: 'Salesforce CRM', category: 'Business App', riskScore: 55, tier: 'Critical', assessmentDue: '2026-04-10', questionnaireStatus: 'Overdue', incidents: 5, slaCompliance: 97.2, lastReview: '2025-10-15', dataAccess: 'Customer PII, revenue data', criticality: 'Critical' },
      { id: 'v009', name: 'Slack Communications', category: 'Collaboration', riskScore: 45, tier: 'High', assessmentDue: '2026-04-25', questionnaireStatus: 'In Progress', incidents: 2, slaCompliance: 98.8, lastReview: '2025-12-01', dataAccess: 'Internal communications, files', criticality: 'High' },
      { id: 'v010', name: 'Workday HR Platform', category: 'HR Systems', riskScore: 50, tier: 'Critical', assessmentDue: '2026-04-05', questionnaireStatus: 'Overdue', incidents: 4, slaCompliance: 97.8, lastReview: '2025-09-20', dataAccess: 'Employee PII, payroll data', criticality: 'Critical' },
      { id: 'v011', name: 'Terraform Cloud', category: 'Infrastructure', riskScore: 25, tier: 'Low', assessmentDue: '2026-06-30', questionnaireStatus: 'Complete', incidents: 0, slaCompliance: 99.6, lastReview: '2026-01-25', dataAccess: 'Infrastructure configs', criticality: 'High' },
      { id: 'v012', name: 'Zoom Video Conferencing', category: 'Collaboration', riskScore: 38, tier: 'Medium', assessmentDue: '2026-05-15', questionnaireStatus: 'Complete', incidents: 1, slaCompliance: 99.1, lastReview: '2026-02-20', dataAccess: 'Meeting metadata, recordings', criticality: 'Operational' },
    ];
    this._tprIncidentHistory = [
      { vendorId: 'v008', date: '2026-03-15', type: 'Data Breach', severity: 'High', status: 'Investigating', description: 'Unauthorized access to customer records via API misconfiguration' },
      { vendorId: 'v010', date: '2026-02-28', type: 'Compliance Violation', severity: 'Medium', status: 'Remediated', description: 'GDPR data retention policy violation detected in HR module' },
      { vendorId: 'v006', date: '2026-02-10', type: 'Service Outage', severity: 'Medium', status: 'Resolved', description: 'Extended downtime affecting ticket processing for 8 hours' },
      { vendorId: 'v009', date: '2026-01-20', type: 'Data Exposure', severity: 'High', status: 'Remediated', description: 'Shared channel configuration exposed files to unauthorized workspace' },
      { vendorId: 'v002', date: '2026-01-05', type: 'Configuration Issue', severity: 'Low', status: 'Resolved', description: 'S3 bucket policy misconfiguration detected and corrected' },
    ];
    this._tprMitigationActions = [
      { id: 'ma001', vendorId: 'v008', action: 'Complete SIG Lite assessment and review data handling practices', priority: 'Critical', dueDate: '2026-04-20', status: 'In Progress', assignee: 'Vendor Risk Manager' },
      { id: 'ma002', vendorId: 'v010', action: 'Audit data retention policies and implement automated compliance checks', priority: 'Critical', dueDate: '2026-04-15', status: 'Pending', assignee: 'Privacy Officer' },
      { id: 'ma003', vendorId: 'v006', action: 'Review SLA terms and establish backup service desk procedures', priority: 'High', dueDate: '2026-05-01', status: 'Pending', assignee: 'IT Operations Lead' },
      { id: 'ma004', vendorId: 'v009', action: 'Implement DLP controls for sensitive file sharing and review channel configs', priority: 'High', dueDate: '2026-04-30', status: 'In Progress', assignee: 'Security Architect' },
      { id: 'ma005', vendorId: 'v007', action: 'Review supply chain security and validate dependency scanning coverage', priority: 'Medium', dueDate: '2026-05-15', status: 'Pending', assignee: 'DevSecOps Lead' },
    ];
  }

  private _renderTprVendorList() {
    const filtered = this._tprFilterTier === 'all' ? this._tprVendors : this._tprVendors.filter(v => v.tier === this._tprFilterTier);
    const sorted = [...filtered].sort((a: any, b: any) => b[this._tprSortField] - a[this._tprSortField]);
    const tierColor = (t: string) => t === 'Critical' ? '#f44336' : t === 'High' ? '#ff9800' : t === 'Medium' ? '#2196f3' : '#4caf50';
    const qsColor = (s: string) => s === 'Complete' ? '#4caf50' : s === 'In Progress' ? '#2196f3' : '#f44336';
    return html`
      <div style="margin-top:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-weight:600;font-size:14px;color:#e0e0e0;">Third-Party Vendor Risk Dashboard</span>
          <div style="display:flex;gap:8px;">
            <select style="background:#1a2332;color:#c0c0c0;border:1px solid #2a3a4a;border-radius:4px;padding:3px 8px;font-size:11px;" .value=${this._tprFilterTier} @change=${this._onTprFilterChange}>
              <option value="all">All Tiers</option><option value="Critical">Critical</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
            </select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px;">
          ${sorted.map(v => html`
            <div style="background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;padding:10px;cursor:pointer;border-left:3px solid ${tierColor(v.tier)};" @click=${() => { this._tprSelectedVendor = v.id; this.requestUpdate(); }}>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-weight:600;color:#e0e0e0;font-size:12px;">${v.name}</span>
                <span style="padding:2px 6px;border-radius:10px;font-size:9px;background:${tierColor(v.tier)};color:white;">${v.tier}</span>
              </div>
              <div style="font-size:11px;color:#8899aa;margin-top:4px;">${v.category} | Risk Score: <span style="color:${v.riskScore > 45 ? '#f44336' : v.riskScore > 30 ? '#ff9800' : '#4caf50'};">${v.riskScore}</span></div>
              <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:10px;">
                <span style="color:${qsColor(v.questionnaireStatus)};">${v.questionnaireStatus}</span>
                <span style="color:#8899aa;">Due: ${v.assessmentDue}</span>
                <span style="color:#8899aa;">Incidents: ${v.incidents}</span>
              </div>
            </div>
          `)}
        </div>
      </div>`;
  }

  private _renderTprMitigationActions() {
    const statusColor = (s: string) => s === 'In Progress' ? '#2196f3' : s === 'Pending' ? '#ff9800' : '#4caf50';
    const prioColor = (p: string) => p === 'Critical' ? '#f44336' : p === 'High' ? '#ff9800' : '#2196f3';
    return html`
      <div style="margin-top:16px;">
        <span style="font-weight:600;font-size:14px;color:#e0e0e0;">Risk Mitigation Action Items</span>
        <div style="margin-top:8px;">
          ${this._tprMitigationActions.map(a => html`
            <div style="background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;padding:10px;margin-bottom:6px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#e0e0e0;font-size:12px;">${a.action}</span>
                <div style="display:flex;gap:6px;">
                  <span style="padding:2px 6px;border-radius:10px;font-size:9px;background:${prioColor(a.priority)};color:white;">${a.priority}</span>
                  <span style="padding:2px 6px;border-radius:10px;font-size:9px;background:${statusColor(a.status)};color:white;">${a.status}</span>
                </div>
              </div>
              <div style="display:flex;gap:16px;margin-top:4px;font-size:10px;color:#8899aa;">
                <span>Vendor: ${this._tprVendors.find(v => v.id === a.vendorId)?.name || a.vendorId}</span>
                <span>Due: ${a.dueDate}</span>
                <span>Assignee: ${a.assignee}</span>
              </div>
            </div>
          `)}
        </div>
      </div>`;
  }

  // === SECTION C: Security Automation ROI Tracker ===
  private _autoProcesses: Array<{id: string; name: string; category: string; manualHours: number; automatedHours: number; costSaved: number; fteSaved: number; coverage: number; roi: number; status: string; implemented: string; nextUpgrade: string}> = [];
  private _autoRoadmap: Array<{phase: string; name: string; priority: string; estimatedSavings: number; targetDate: string; dependencies: string; progress: number}> = [];
  private _autoCoverageByCategory: Array<{category: string; total: number; automated: number; coverage: number; potential: number}> = [];

  private _initAutoProcesses() {
    this._autoProcesses = [
      { id: 'ap001', name: 'Vulnerability Scanning', category: 'Detection', manualHours: 160, automatedHours: 8, costSaved: 76000, fteSaved: 0.88, coverage: 95, roi: 850, status: 'Active', implemented: '2025-06-15', nextUpgrade: '2026-06-01' },
      { id: 'ap002', name: 'Patch Deployment', category: 'Remediation', manualHours: 200, automatedHours: 20, costSaved: 90000, fteSaved: 1.0, coverage: 82, roi: 720, status: 'Active', implemented: '2025-07-01', nextUpgrade: '2026-07-15' },
      { id: 'ap003', name: 'Log Analysis & SIEM Alerting', category: 'Detection', manualHours: 320, automatedHours: 40, costSaved: 140000, fteSaved: 1.6, coverage: 88, roi: 680, status: 'Active', implemented: '2025-05-10', nextUpgrade: '2026-05-20' },
      { id: 'ap004', name: 'User Provisioning/Deprovisioning', category: 'IAM', manualHours: 120, automatedHours: 5, costSaved: 57500, fteSaved: 0.65, coverage: 92, roi: 920, status: 'Active', implemented: '2025-08-01', nextUpgrade: '2026-08-10' },
      { id: 'ap005', name: 'Compliance Evidence Collection', category: 'Compliance', manualHours: 240, automatedHours: 30, costSaved: 105000, fteSaved: 1.2, coverage: 78, roi: 620, status: 'Active', implemented: '2025-09-15', nextUpgrade: '2026-09-01' },
      { id: 'ap006', name: 'Phishing Campaign Execution', category: 'Awareness', manualHours: 80, automatedHours: 12, costSaved: 34000, fteSaved: 0.38, coverage: 70, roi: 480, status: 'Active', implemented: '2025-10-01', nextUpgrade: '2026-10-15' },
      { id: 'ap007', name: 'Incident Triage & Classification', category: 'Response', manualHours: 280, automatedHours: 56, costSaved: 112000, fteSaved: 1.28, coverage: 75, roi: 550, status: 'Active', implemented: '2025-11-01', nextUpgrade: '2026-11-10' },
      { id: 'ap008', name: 'Security Report Generation', category: 'Reporting', manualHours: 60, automatedHours: 4, costSaved: 28000, fteSaved: 0.32, coverage: 90, roi: 1050, status: 'Active', implemented: '2025-12-01', nextUpgrade: '2026-12-15' },
      { id: 'ap009', name: 'Firewall Rule Management', category: 'Network', manualHours: 100, automatedHours: 15, costSaved: 42500, fteSaved: 0.48, coverage: 65, roi: 520, status: 'Partial', implemented: '2026-01-15', nextUpgrade: '2026-07-01' },
      { id: 'ap010', name: 'Secrets Rotation', category: 'Security', manualHours: 40, automatedHours: 2, costSaved: 19000, fteSaved: 0.22, coverage: 85, roi: 1200, status: 'Active', implemented: '2026-02-01', nextUpgrade: '2027-02-01' },
    ];
    this._autoRoadmap = [
      { phase: 'Phase 1', name: 'Automated Incident Response Playbooks', priority: 'Critical', estimatedSavings: 180000, targetDate: '2026-Q2', dependencies: 'SIEM integration complete', progress: 45 },
      { phase: 'Phase 2', name: 'AI-Powered Threat Detection', priority: 'High', estimatedSavings: 250000, targetDate: '2026-Q3', dependencies: 'ML model training complete', progress: 20 },
      { phase: 'Phase 3', name: 'Automated Compliance Auditing', priority: 'High', estimatedSavings: 150000, targetDate: '2026-Q3', dependencies: 'Policy engine deployment', progress: 30 },
      { phase: 'Phase 4', name: 'Self-Healing Infrastructure', priority: 'Medium', estimatedSavings: 200000, targetDate: '2026-Q4', dependencies: 'IaC maturity level 4', progress: 10 },
      { phase: 'Phase 5', name: 'Zero-Trust Policy Automation', priority: 'Medium', estimatedSavings: 120000, targetDate: '2027-Q1', dependencies: 'ZT architecture phase 2', progress: 5 },
    ];
    this._autoCoverageByCategory = [
      { category: 'Detection', total: 480, automated: 48, coverage: 90, potential: 430 },
      { category: 'Remediation', total: 200, automated: 20, coverage: 82, potential: 175 },
      { category: 'IAM', total: 120, automated: 5, coverage: 92, potential: 110 },
      { category: 'Compliance', total: 240, automated: 30, coverage: 78, potential: 200 },
      { category: 'Response', total: 280, automated: 56, coverage: 75, potential: 220 },
      { category: 'Reporting', total: 60, automated: 4, coverage: 90, potential: 55 },
    ];
  }

  private _renderAutoRoiTracker() {
    const totalSaved = this._autoProcesses.reduce((s, p) => s + p.costSaved, 0);
    const totalFTE = this._autoProcesses.reduce((s, p) => s + p.fteSaved, 0);
    const avgROI = Math.round(this._autoProcesses.reduce((s, p) => s + p.roi, 0) / this._autoProcesses.length);
    return html`
      <div style="margin-top:16px;">
        <span style="font-weight:600;font-size:14px;color:#e0e0e0;">Automation ROI Tracker</span>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px;">
          <div style="background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;padding:10px;text-align:center;">
            <div style="font-size:20px;font-weight:700;color:#4caf50;">$${totalSaved.toLocaleString()}</div>
            <div style="font-size:11px;color:#8899aa;">Annual Cost Savings</div>
          </div>
          <div style="background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;padding:10px;text-align:center;">
            <div style="font-size:20px;font-weight:700;color:#64b5f6;">${totalFTE.toFixed(1)} FTE</div>
            <div style="font-size:11px;color:#8899aa;">Equivalent Saved</div>
          </div>
          <div style="background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;padding:10px;text-align:center;">
            <div style="font-size:20px;font-weight:700;color:#ff9800;">${avgROI}%</div>
            <div style="font-size:11px;color:#8899aa;">Average ROI</div>
          </div>
        </div>
        <div style="margin-top:12px;">
          ${this._autoProcesses.map(p => html`
            <div style="background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;padding:8px;margin-bottom:4px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#e0e0e0;font-size:12px;font-weight:600;">${p.name}</span>
                <span style="color:#4caf50;font-size:11px;">${p.roi}% ROI</span>
              </div>
              <div style="display:flex;gap:16px;margin-top:4px;font-size:10px;color:#8899aa;">
                <span>Manual: ${p.manualHours}h/mo</span>
                <span>Auto: ${p.automatedHours}h/mo</span>
                <span>Saved: ${p.fteSaved} FTE</span>
                <span>Coverage: ${p.coverage}%</span>
                <span style="color:#4caf50;">$${p.costSaved.toLocaleString()}/yr</span>
              </div>
              <div style="margin-top:4px;height:3px;background:#0d1520;border-radius:2px;">
                <div style="height:100%;width:${p.coverage}%;background:${p.coverage > 85 ? '#4caf50' : p.coverage > 70 ? '#2196f3' : '#ff9800'};border-radius:2px;"></div>
              </div>
            </div>
          `)}
        </div>
      </div>`;
  }

  private _renderAutoRoadmap() {
    return html`
      <div style="margin-top:16px;">
        <span style="font-weight:600;font-size:14px;color:#e0e0e0;">Automation Roadmap</span>
        <div style="margin-top:8px;">
          ${this._autoRoadmap.map(r => html`
            <div style="background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;padding:10px;margin-bottom:6px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <span style="color:#8899aa;font-size:10px;">${r.phase}</span>
                  <span style="color:#e0e0e0;font-size:12px;font-weight:600;margin-left:8px;">${r.name}</span>
                </div>
                <span style="color:#4caf50;font-size:11px;">$${r.estimatedSavings.toLocaleString()}/yr</span>
              </div>
              <div style="display:flex;gap:16px;margin-top:4px;font-size:10px;color:#8899aa;">
                <span>Target: ${r.targetDate}</span><span>Dep: ${r.dependencies}</span>
              </div>
              <div style="margin-top:6px;height:6px;background:#0d1520;border-radius:3px;">
                <div style="height:100%;width:${r.progress}%;background:linear-gradient(90deg,#2196f3,#4caf50);border-radius:3px;transition:width 0.3s;"></div>
              </div>
              <div style="font-size:10px;color:#8899aa;margin-top:2px;">${r.progress}% complete</div>
            </div>
          `)}
        </div>
      </div>`;
  }

  // === SECTION D: Security Knowledge Graph Explorer ===
  private _kgNodes: Array<{id: string; label: string; type: string; risk: number; connections: number; lastUpdated: string; status: string}> = [];
  private _kgEdges: Array<{source: string; target: string; type: string; strength: number; discovered: string}> = [];
  private _kgStats: {totalNodes: number; totalEdges: number; avgConnectivity: number; graphHealth: number; isolatedNodes: number; criticalPaths: number} = { totalNodes: 0, totalEdges: 0, avgConnectivity: 0, graphHealth: 0, isolatedNodes: 0, criticalPaths: 0 };
  private _kgQueryInput: string = '';
  private _kgQueryResults: Array<{query: string; resultNodes: number; resultEdges: number; executionTime: string}> = [];
  private _kgSelectedEntityType: string = 'all';
  private _kgPathStart: string = '';
  private _kgPathEnd: string = '';
  private _kgPathResult: Array<string> = [];

  private _initKnowledgeGraph() {
    this._kgNodes = [
      { id: 'n001', label: 'APT29 Cozy Bear', type: 'threat', risk: 95, connections: 18, lastUpdated: '2026-04-22', status: 'active' },
      { id: 'n002', label: 'SolarWinds Orion', type: 'vulnerability', risk: 90, connections: 12, lastUpdated: '2026-04-20', status: 'patched' },
      { id: 'n003', label: 'Active Directory', type: 'asset', risk: 78, connections: 25, lastUpdated: '2026-04-22', status: 'monitored' },
      { id: 'n004', label: 'Admin User Group', type: 'user', risk: 85, connections: 15, lastUpdated: '2026-04-21', status: 'active' },
      { id: 'n005', label: 'MFA Implementation', type: 'control', risk: 20, connections: 22, lastUpdated: '2026-04-22', status: 'enforced' },
      { id: 'n006', label: 'Lateral Movement Tactic', type: 'threat', risk: 88, connections: 14, lastUpdated: '2026-04-19', status: 'active' },
      { id: 'n007', label: 'Email Gateway', type: 'asset', risk: 45, connections: 10, lastUpdated: '2026-04-22', status: 'monitored' },
      { id: 'n008', label: 'Phishing Simulation', type: 'control', risk: 15, connections: 8, lastUpdated: '2026-04-18', status: 'active' },
      { id: 'n009', label: 'Ransomware-as-a-Service', type: 'threat', risk: 92, connections: 20, lastUpdated: '2026-04-22', status: 'active' },
      { id: 'n010', label: 'Cloud Infrastructure', type: 'asset', risk: 65, connections: 18, lastUpdated: '2026-04-21', status: 'monitored' },
      { id: 'n011', label: 'SOC Analyst Team', type: 'user', risk: 10, connections: 12, lastUpdated: '2026-04-22', status: 'active' },
      { id: 'n012', label: 'Network Segmentation', type: 'control', risk: 25, connections: 16, lastUpdated: '2026-04-20', status: 'enforced' },
    ];
    this._kgEdges = [
      { source: 'n001', target: 'n002', type: 'exploits', strength: 95, discovered: '2025-12-15' },
      { source: 'n001', target: 'n003', type: 'targets', strength: 85, discovered: '2026-01-10' },
      { source: 'n001', target: 'n006', type: 'uses', strength: 90, discovered: '2026-01-15' },
      { source: 'n003', target: 'n004', type: 'contains', strength: 80, discovered: '2025-10-01' },
      { source: 'n005', target: 'n003', type: 'protects', strength: 75, discovered: '2025-11-01' },
      { source: 'n006', target: 'n003', type: 'targets', strength: 88, discovered: '2026-01-20' },
      { source: 'n009', target: 'n010', type: 'targets', strength: 82, discovered: '2026-02-15' },
      { source: 'n008', target: 'n007', type: 'protects', strength: 70, discovered: '2026-01-25' },
      { source: 'n012', target: 'n010', type: 'protects', strength: 72, discovered: '2026-02-01' },
      { source: 'n011', target: 'n005', type: 'manages', strength: 60, discovered: '2026-01-05' },
      { source: 'n009', target: 'n006', type: 'uses', strength: 78, discovered: '2026-03-01' },
      { source: 'n002', target: 'n010', type: 'affects', strength: 88, discovered: '2026-01-12' },
    ];
    this._kgStats = {
      totalNodes: this._kgNodes.length, totalEdges: this._kgEdges.length,
      avgConnectivity: Math.round(this._kgNodes.reduce((s, n) => s + n.connections, 0) / this._kgNodes.length),
      graphHealth: 82, isolatedNodes: 0, criticalPaths: 5,
    };
    this._kgQueryResults = [
      { query: 'threats targeting Active Directory', resultNodes: 3, resultEdges: 4, executionTime: '45ms' },
      { query: 'controls protecting cloud assets', resultNodes: 2, resultEdges: 2, executionTime: '32ms' },
      { query: 'attack paths to admin access', resultNodes: 4, resultEdges: 5, executionTime: '67ms' },
    ];
  }

  private _renderKgExplorer() {
    const typeColor = (t: string) => t === 'threat' ? '#f44336' : t === 'asset' ? '#2196f3' : t === 'control' ? '#4caf50' : t === 'user' ? '#ff9800' : '#9c27b0';
    const riskColor = (r: number) => r > 80 ? '#f44336' : r > 50 ? '#ff9800' : '#4caf50';
    const filtered = this._kgSelectedEntityType === 'all' ? this._kgNodes : this._kgNodes.filter(n => n.type === this._kgSelectedEntityType);
    return html`
      <div style="margin-top:16px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-weight:600;font-size:14px;color:#e0e0e0;">Knowledge Graph Explorer</span>
          <div style="display:flex;gap:6px;">
            ${['all', 'threat', 'asset', 'control', 'user'].map(t => html`
              <button style="padding:3px 10px;border-radius:12px;font-size:10px;border:1px solid ${this._kgSelectedEntityType === t ? typeColor(t) : '#2a3a4a'};background:${this._kgSelectedEntityType === t ? typeColor(t) + '22' : 'transparent'};color:${this._kgSelectedEntityType === t ? typeColor(t) : '#8899aa'};cursor:pointer;" @click=${() => this._setKgEntityType(t)}>${t}</button>
            `)}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">
          <div style="background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;padding:8px;text-align:center;">
            <div style="font-size:18px;font-weight:700;color:#64b5f6;">${this._kgStats.totalNodes}</div>
            <div style="font-size:10px;color:#8899aa;">Total Nodes</div>
          </div>
          <div style="background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;padding:8px;text-align:center;">
            <div style="font-size:18px;font-weight:700;color:#4caf50;">${this._kgStats.totalEdges}</div>
            <div style="font-size:10px;color:#8899aa;">Total Edges</div>
          </div>
          <div style="background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;padding:8px;text-align:center;">
            <div style="font-size:18px;font-weight:700;color:#ff9800;">${this._kgStats.avgConnectivity}</div>
            <div style="font-size:10px;color:#8899aa;">Avg Connectivity</div>
          </div>
          <div style="background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;padding:8px;text-align:center;">
            <div style="font-size:18px;font-weight:700;color:#e0e0e0;">${this._kgStats.graphHealth}%</div>
            <div style="font-size:10px;color:#8899aa;">Graph Health</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:6px;">
          ${filtered.map(n => html`
            <div style="background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;padding:8px;border-left:3px solid ${typeColor(n.type)};">
              <div style="display:flex;justify-content:space-between;">
                <span style="color:#e0e0e0;font-size:11px;font-weight:600;">${n.label}</span>
                <span style="font-size:9px;padding:1px 6px;border-radius:8px;background:${typeColor(n.type)};color:white;">${n.type}</span>
              </div>
              <div style="display:flex;gap:12px;margin-top:4px;font-size:10px;">
                <span style="color:${riskColor(n.risk)};">Risk: ${n.risk}</span>
                <span style="color:#8899aa;">Links: ${n.connections}</span>
                <span style="color:#8899aa;">${n.status}</span>
              </div>
            </div>
          `)}
        </div>
      </div>`;
  }

  private _renderKgQueryHistory() {
    return html`
      <div style="margin-top:12px;">
        <span style="font-weight:600;font-size:13px;color:#e0e0e0;">Recent Graph Queries</span>
        <div style="margin-top:6px;">
          ${this._kgQueryResults.map(q => html`
            <div style="display:flex;justify-content:space-between;align-items:center;background:#1a2332;border:1px solid #2a3a4a;border-radius:4px;padding:6px 10px;margin-bottom:4px;font-size:11px;">
              <span style="color:#c0c0c0;">"${q.query}"</span>
              <div style="display:flex;gap:10px;">
                <span style="color:#64b5f6;">${q.resultNodes} nodes</span>
                <span style="color:#4caf50;">${q.resultEdges} edges</span>
                <span style="color:#8899aa;">${q.executionTime}</span>
              </div>
            </div>
          `)}
        </div>
      </div>`;
  }

  // === SECTION E: Security Executive Briefing Generator ===
  private _ebTemplates: Array<{id: string; name: string; description: string; audience: string; sections: number; lastUsed: string; usageCount: number}> = [];
  private _ebGeneratedBriefing: {title: string; date: string; sections: Array<{heading: string; content: string; priority: string; metrics: string[]; }>; } = { title: '', date: '', sections: [] };
  private _ebSelectedTemplate: string = '';
  private _ebSchedule: Array<{date: string; type: string; audience: string; status: string; presenter: string}> = [];
  private _ebKeyRisks: Array<{risk: string; severity: string; trend: string; owner: string; mitigation: string; deadline: string}> = [];
  private _ebTrends: Array<{area: string; direction: string; change: number; period: string; impact: string}> = [];

  private _initEbBriefingGenerator() {
    this._ebTemplates = [
      { id: 't001', name: 'Monthly Security Posture Report', description: 'Comprehensive overview of security posture, key metrics, and strategic initiatives for senior leadership.', audience: 'C-Suite', sections: 8, lastUsed: '2026-03-28', usageCount: 12 },
      { id: 't002', name: 'Quarterly Board Security Briefing', description: 'Board-level summary of cybersecurity risk, compliance status, and investment recommendations.', audience: 'Board of Directors', sections: 6, lastUsed: '2026-03-15', usageCount: 4 },
      { id: 't003', name: 'Incident Response Summary', description: 'Post-incident analysis with timeline, impact assessment, root cause, and lessons learned.', audience: 'Executive Team', sections: 7, lastUsed: '2026-04-10', usageCount: 8 },
      { id: 't004', name: 'Risk Committee Update', description: 'Focused risk assessment update with heat map, trend analysis, and mitigation progress.', audience: 'Risk Committee', sections: 5, lastUsed: '2026-04-05', usageCount: 6 },
      { id: 't005', name: 'Compliance Status Report', description: 'Regulatory compliance dashboard with audit findings, remediation progress, and upcoming deadlines.', audience: 'Legal & Compliance', sections: 9, lastUsed: '2026-04-01', usageCount: 10 },
    ];
    this._ebSchedule = [
      { date: '2026-04-25', type: 'Monthly Posture', audience: 'C-Suite', status: 'Scheduled', presenter: 'CISO' },
      { date: '2026-05-15', type: 'Board Briefing', audience: 'Board of Directors', status: 'Draft', presenter: 'CISO + CTO' },
      { date: '2026-06-25', type: 'Monthly Posture', audience: 'C-Suite', status: 'Pending', presenter: 'CISO' },
      { date: '2026-07-15', type: 'Board Briefing', audience: 'Board of Directors', status: 'Pending', presenter: 'CISO + CTO' },
    ];
    this._ebKeyRisks = [
      { risk: 'Ransomware attack on critical infrastructure', severity: 'Critical', trend: 'Increasing', owner: 'CISO', mitigation: 'Deploy advanced EDR, implement network segmentation, enhance backup strategy', deadline: '2026-Q2' },
      { risk: 'Third-party vendor data breach', severity: 'High', trend: 'Stable', owner: 'Vendor Risk Manager', mitigation: 'Complete vendor assessments, implement continuous monitoring, enforce DPA requirements', deadline: '2026-Q3' },
      { risk: 'Insider threat from privileged accounts', severity: 'High', trend: 'Increasing', owner: 'IAM Lead', mitigation: 'Implement PAM solution, enhance UEBA capabilities, quarterly access reviews', deadline: '2026-Q2' },
      { risk: 'Cloud misconfiguration exposure', severity: 'Medium', trend: 'Decreasing', owner: 'Cloud Security Lead', mitigation: 'Deploy CSPM tools, automate compliance checks, infrastructure-as-code validation', deadline: '2026-Q2' },
    ];
    this._ebTrends = [
      { area: 'Phishing Attacks', direction: 'up', change: 23, period: 'Q1 2026', impact: 'High' },
      { area: 'Vulnerability Remediation', direction: 'down', change: 15, period: 'Q1 2026', impact: 'Positive' },
      { area: 'Security Awareness Score', direction: 'up', change: 8, period: 'Q1 2026', impact: 'Positive' },
      { area: 'Mean Time to Detect', direction: 'down', change: 18, period: 'Q1 2026', impact: 'Positive' },
      { area: 'Third-Party Incidents', direction: 'up', change: 12, period: 'Q1 2026', impact: 'High' },
    ];
    this._ebGeneratedBriefing = {
      title: 'April 2026 Security Executive Briefing',
      date: '2026-04-23',
      sections: [
        { heading: 'Executive Summary', content: 'Overall security posture improved by 12% this quarter. Key achievements include EDR deployment completion and automated patch management launch. Two critical risks require immediate attention.', priority: 'Critical', metrics: ['Posture Score: 78/100', 'MTTD improved 18%', 'Zero critical breaches'] },
        { heading: 'Top Risk Summary', content: 'Four key risks identified with ransomware and insider threats requiring priority action. Third-party vendor risk remains elevated with two overdue assessments.', priority: 'Critical', metrics: ['4 active risks', '2 critical', '1 high', '1 medium'] },
        { heading: 'Key Metrics Dashboard', content: 'All primary KPIs trending positively. MTTD reduced from 68 to 52 minutes. Patch compliance at 82%, target 90% by Q3.', priority: 'High', metrics: ['MTTD: 52min', 'MTTR: 4.2h', 'Patch: 82%', 'Phishing Click Rate: 3.2%'] },
        { heading: 'Action Items & Recommendations', content: 'Five priority actions recommended for next quarter. Budget allocation of $450K requested for automation initiatives.', priority: 'High', metrics: ['5 actions', '$450K requested', '3 owners assigned'] },
      ],
    };
  }

  private _renderEbBriefingGenerator() {
    const severityColor = (s: string) => s === 'Critical' ? '#f44336' : s === 'High' ? '#ff9800' : '#2196f3';
    const dirColor = (d: string) => d === 'up' ? '#f44336' : '#4caf50';
    return html`
      <div style="margin-top:16px;">
        <span style="font-weight:600;font-size:14px;color:#e0e0e0;">Executive Briefing Generator</span>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin-top:8px;">
          ${this._ebTemplates.map(t => html`
            <div style="background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;padding:10px;cursor:pointer;${this._ebSelectedTemplate === t.id ? 'border-color:#4caf50;' : ''}" @click=${() => { this._ebSelectedTemplate = t.id; this.requestUpdate(); }}>
              <div style="font-weight:600;color:#e0e0e0;font-size:11px;">${t.name}</div>
              <div style="font-size:10px;color:#8899aa;margin-top:4px;">${t.audience} | ${t.sections} sections</div>
              <div style="font-size:9px;color:#666;margin-top:2px;">Used ${t.usageCount}x | Last: ${t.lastUsed}</div>
            </div>
          `)}
        </div>
        ${this._ebSelectedTemplate ? html`
          <div style="margin-top:12px;background:#0d1520;border:1px solid #1e2d3d;border-radius:8px;padding:16px;">
            <div style="font-size:16px;font-weight:700;color:#e0e0e0;margin-bottom:4px;">${this._ebGeneratedBriefing.title}</div>
            <div style="font-size:11px;color:#8899aa;margin-bottom:12px;">Generated: ${this._ebGeneratedBriefing.date}</div>
            ${this._ebGeneratedBriefing.sections.map(s => html`
              <div style="background:#1a2332;border-radius:6px;padding:12px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <span style="font-weight:600;color:#e0e0e0;font-size:13px;">${s.heading}</span>
                  <span style="padding:2px 8px;border-radius:10px;font-size:9px;background:${severityColor(s.priority)};color:white;">${s.priority}</span>
                </div>
                <p style="font-size:11px;color:#c0c0c0;margin:6px 0 4px 0;line-height:1.5;">${s.content}</p>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                  ${s.metrics.map(m => html`<span style="font-size:10px;padding:2px 8px;background:#0d1520;border-radius:10px;color:#64b5f6;">${m}</span>`)}
                </div>
              </div>
            `)}
          </div>
        ` : ''}
      </div>`;
  }

  private _renderEbRiskTrends() {
    const dirColor = (d: string) => d === 'up' ? '#f44336' : '#4caf50';
    return html`
      <div style="margin-top:16px;">
        <span style="font-weight:600;font-size:14px;color:#e0e0e0;">Risk Trends & Key Risks</span>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:8px;">
          <div>
            <div style="font-size:12px;color:#8899aa;margin-bottom:6px;">Trending Indicators</div>
            ${this._ebTrends.map(t => html`
              <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 8px;background:#1a2332;border-radius:4px;margin-bottom:3px;">
                <span style="color:#c0c0c0;font-size:11px;">${t.area}</span>
                <div style="display:flex;align-items:center;gap:6px;">
                  <span style="color:${dirColor(t.direction)};font-size:11px;">${t.direction === 'up' ? '&#9650;' : '&#9660;'} ${t.change}%</span>
                  <span style="font-size:10px;color:#8899aa;">${t.period}</span>
                </div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:12px;color:#8899aa;margin-bottom:6px;">Key Risks</div>
            ${this._ebKeyRisks.map(r => html`
              <div style="background:#1a2332;border-radius:4px;padding:6px 8px;margin-bottom:3px;border-left:3px solid ${r.severity === 'Critical' ? '#f44336' : r.severity === 'High' ? '#ff9800' : '#2196f3'};">
                <div style="display:flex;justify-content:space-between;">
                  <span style="color:#e0e0e0;font-size:11px;">${r.risk}</span>
                  <span style="color:#8899aa;font-size:10px;">${r.owner}</span>
                </div>
                <div style="font-size:10px;color:#8899aa;margin-top:2px;">Deadline: ${r.deadline}</div>
              </div>
            `)}
          </div>
        </div>
      </div>`;
  }

  private _renderEbSchedule() {
    const statusColor = (s: string) => s === 'Scheduled' ? '#4caf50' : s === 'Draft' ? '#2196f3' : '#ff9800';
    return html`
      <div style="margin-top:16px;">
        <span style="font-weight:600;font-size:14px;color:#e0e0e0;">Briefing Schedule</span>
        <div style="margin-top:8px;">
          ${this._ebSchedule.map(s => html`
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:#1a2332;border:1px solid #2a3a4a;border-radius:6px;margin-bottom:4px;">
              <div>
                <span style="color:#e0e0e0;font-size:12px;font-weight:600;">${s.type}</span>
                <span style="color:#8899aa;font-size:11px;margin-left:8px;">${s.audience}</span>
              </div>
              <div style="display:flex;gap:12px;align-items:center;">
                <span style="color:#8899aa;font-size:11px;">${s.date}</span>
                <span style="padding:2px 8px;border-radius:10px;font-size:9px;background:${statusColor(s.status)};color:white;">${s.status}</span>
                <span style="color:#c0c0c0;font-size:10px;">${s.presenter}</span>
              </div>
            </div>
          `)}
        </div>
      </div>`;
  }


  private _onBmBenchmarkChange(e: Event) {
    this._bmSelectedBenchmark = (e.target as HTMLSelectElement).value;
    this._initBmIndustryMetrics();
    this.requestUpdate();
  }

  private _onTprFilterChange(e: Event) {
    this._tprFilterTier = (e.target as HTMLSelectElement).value;
    this.requestUpdate();
  }

  private _setKgEntityType(t: string) {
    this._kgSelectedEntityType = t;
    this.requestUpdate();
  }

  render() {    if (this._tmRules.length === 0) { this._initTmRules(); this._initTmCvss(); this._runTmAnomalyDetection(); this._generateTmPredictions(); this._initTmApprovals(); this._initTmActivity(); this._initTmNotifications(); }

    const items = this._getFiltered();
    const crit = items.filter(i => i.severity === 'critical').length;
    const high = items.filter(i => i.severity === 'high').length;
    const open = items.filter(i => i.status === 'open' || i.status === 'in-progress').length;
    const resolved = items.filter(i => i.status === 'resolved').length;
    return html`
      <div class="panel">
        <div class="pt">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
          Training Module
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
          <button class="tab ${this._activeTab === 'rules' ? 'active' : ''}" @click=${() => { this._activeTab = 'rules'; }}>Rules</button>
          <button class="tab ${this._activeTab === 'anomalies' ? 'active' : ''}" @click=${() => { this._activeTab = 'anomalies'; }}>Anomalies</button>
          <button class="tab ${this._activeTab === 'predictions' ? 'active' : ''}" @click=${() => { this._activeTab = 'predictions'; }}>Predict</button>
          <button class="tab ${this._activeTab === 'approvals' ? 'active' : ''}" @click=${() => { this._activeTab = 'approvals'; }}>Approvals</button>
          <button class="tab ${this._activeTab === 'config' ? 'active' : ''}" @click=${() => { this._activeTab = 'config'; }}>Config</button>
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
          <div class="list">
            ${items.map(i => html`
              <div class="item ${this._expandedId === i.id ? 'expanded' : ''}" @click=${() => this._toggle(i.id)}>
                <div class="item-header"><div class="item-title">${i.title}</div><div class="badges"><span class="badge ${this._getSevBadge(i.severity)}">${i.severity}</span><span class="badge ${this._getSevBadge(i.status)}">${i.status}</span><span class="badge ${this._getSevBadge(i.priority)}">${i.priority}</span></div></div>
                <div class="item-meta">${i.description.substring(0, 120)}${i.description.length > 120 ? '...' : ''}</div>
                ${this._expandedId === i.id ? html`
                  <div class="item-detail">
                    <div style="font-size:12px;color:#cbd5e1;line-height:1.6;margin-bottom:10px;">${i.description}</div>
                    <div class="detail-grid">
                      <div class="score-card"><div class="score-val" style="font-size:14px;">${i.category}</div><div class="score-lbl">Category</div></div>
                      <div class="score-card"><div class="score-val" style="font-size:14px;">${i.source}</div><div class="score-lbl">Source</div></div>
                      <div class="score-card"><div class="score-val" style="font-size:14px;">${i.assignee}</div><div class="score-lbl">Assignee</div></div>
                      <div class="score-card"><div class="score-val" style="font-size:14px;">${i.slaMinutes}m</div><div class="score-lbl">SLA</div></div>
                    </div>
                    <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;">Created: ${new Date(i.createdAt).toLocaleString()} | Tags: ${i.tags.join(', ')}</div>
                    ${i.stepsTaken.length ? html`<div style="margin-bottom:8px;font-size:12px;font-weight:600;">Steps Taken:</div>${i.stepsTaken.map(s => html`<div style="font-size:11px;color:#94a3b8;padding:2px 0;">- ${s}</div>`)}` : nothing}
                    <div style="margin-top:10px;display:flex;gap:6px;">
                      <button class="btn success" @click=${(e: Event) => { e.stopPropagation(); }}>Resolve</button>
                      <button class="btn" @click=${(e: Event) => { e.stopPropagation(); }}>Escalate</button>
                      <button class="btn" @click=${(e: Event) => { e.stopPropagation(); }}>Reassign</button>
                      <button class="btn danger" @click=${(e: Event) => { e.stopPropagation(); }}>Dismiss</button>
                    </div>
                  </div>
                ` : nothing}
              </div>
            `)}
            ${items.length === 0 ? html`<div class="empty-state">No items match the current filters</div>` : nothing}
          </div>
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
        
        ${this._activeTab === 'rules' ? html`
          ${this._renderTmRules()}
          <div style="margin-top:12px;font-size:11px;font-weight:600;margin-bottom:6px">Category Treemap</div>
          <div style="background:#1a1d27;border-radius:8px;padding:12px">${this._renderTmTreemapSVG()}</div>
          <div style="margin-top:12px;font-size:11px;font-weight:600;margin-bottom:6px">Data Flow (Sankey)</div>
          <div style="background:#1a1d27;border-radius:8px;padding:12px">${this._renderTmSankeySVG()}</div>
          ${this._renderTmActivity()}
        ` : nothing}
        ${this._activeTab === 'anomalies' ? html`
          ${this._renderTmAnomalies()}
          ${this._renderTmNotifications()}
        ` : nothing}
        ${this._activeTab === 'predictions' ? html`
          ${this._renderTmPredictions()}
          <div style="margin-top:12px;font-size:11px;font-weight:600;margin-bottom:6px">CVSS Scoring</div>
          <div style="background:#1a1d27;border-radius:8px;padding:12px">
            <table class="history-table"><thead><tr><th>ID</th><th>Base</th><th>Temporal</th><th>Environmental</th><th>Overall</th></tr></thead><tbody>
              ${this._tmcvssData.map(c => html`<tr><td>${c.itemId}</td><td style="color:${c.base >= 7 ? '#ef4444' : c.base >= 4 ? '#eab308' : '#22c55e'}">${c.base}</td><td>${c.temporal}</td><td>${c.environmental}</td><td style="font-weight:700;color:${c.overall >= 7 ? '#ef4444' : c.overall >= 4 ? '#eab308' : '#22c55e'}">${c.overall}</td></tr>`)}
            </tbody></table>
          </div>
        ` : nothing}
        ${this._activeTab === 'approvals' ? html`
          ${this._renderTmApprovals()}
        ` : nothing}
        ${this._activeTab === 'config' ? html`
          ${this._renderTmConfig()}
        ` : nothing}
        ${this._activeTab === 'new' ? html`
          <div class="form-section">
            <div class="form-title">Create New Training Module Entry</div>
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


  // === SCENARIO SIMULATION ENGINE ===
  @state() private _tmScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _tmScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _tmScenarioCompare: boolean = false;
  @state() private _tmScenarioSelected: string[] = [];

  private _tmInitScenarios(): void {
    const saved = localStorage.getItem('tm_scenarios');
    if (saved) { try { this._tmScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._tmScenarios.length === 0) {
      this._tmScenarios = [
        {id:'tm-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'tm-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'tm-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _tmSaveScenarios(): void {
    localStorage.setItem('tm_scenarios', JSON.stringify(this._tmScenarios));
  }

  private _tmAddScenario(): void {
    const f = this._tmScenarioForm;
    if (!f.attackType || !f.target) return;
    this._tmScenarios = [...this._tmScenarios, {
      id: 'tm-s' + (this._tmScenarios.length + 1),
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
    this._tmScenarioForm = {attackType:'',target:'',method:''};
    this._tmSaveScenarios();
  }

  private _tmRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._tmScenarioCompare = !this._tmScenarioCompare; }}>${this._tmScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._tmScenarioForm = {...this._tmScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._tmScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._tmScenarioForm = {...this._tmScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._tmScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._tmScenarioForm = {...this._tmScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._tmScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._tmAddScenario}>Run Simulation</button>
      </div>
      ${this._tmScenarioCompare && this._tmScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._tmScenarios.length)},1fr);gap:8px">
            ${this._tmScenarios.slice(0,3).map(s => html`
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
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._tmScenarios.length})</div>
        ${this._tmScenarios.map(s => html`
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
  @state() private _tmTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _tmTrendZoom: {start:number;end:number} | null = null;
  @state() private _tmTrendMA: number = 7;

  private _tmInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._tmTrendData = data;
  }

  private _tmCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._tmTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._tmTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _tmGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._tmTrendData.map(d => d.value);
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

  private _tmRenderTimeSeries(): any {
    const stats = this._tmGetStats();
    const filtered = this._tmTrendZoom ? this._tmTrendData.filter(d => d.day >= this._tmTrendZoom.start && d.day <= this._tmTrendZoom.end) : this._tmTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._tmTrendMA === 7 ? 'active' : ''}" @click=${() => { this._tmTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._tmTrendMA === 30 ? 'active' : ''}" @click=${() => { this._tmTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._tmTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._tmTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
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
  @state() private _tmRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _tmActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _tmPermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _tmPermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _tmPermCompare: string[] = [];

  private _tmInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._tmRoles) {
      perms[role] = {};
      this._tmActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._tmPermissions = perms;
  }

  private _tmTogglePermission(role: string, action: string): void {
    const old = this._tmPermissions[role][action];
    this._tmPermissions = {...this._tmPermissions, [role]: {...this._tmPermissions[role], [action]: !old}};
    this._tmPermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _tmRenderRBAC(): any {
    const compareRoles = this._tmPermCompare.map(r => this._tmPermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._tmRoles.map(r => html`
              <button class="tab ${this._tmPermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._tmPermCompare = this._tmPermCompare.includes(r) ? this._tmPermCompare.filter(x => x !== r) : [...this._tmPermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._tmActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._tmRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._tmActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._tmPermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._tmTogglePermission(role, action)}>${this._tmPermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._tmPermCompare.join(' vs ')}</div>
            ${this._tmActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._tmPermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._tmPermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._tmPermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _tmReportTemplate: string = 'executive';
  @state() private _tmReportSchedule: string = 'weekly';
  @state() private _tmReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _tmReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _tmGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._tmReportHistory.unshift({id,template:this._tmReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _tmRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._tmReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._tmReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._tmReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._tmReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._tmReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._tmReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._tmGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._tmReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._tmReportHistory.slice(0,3).map(r => html`
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
  @state() private _tmHighContrast: boolean = false;
  @state() private _tmA11yAnnounce: string = '';
  @state() private _tmShortcutsVisible: boolean = false;
  @state() private _tmFocusTrap: boolean = false;

  private _tmShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _tmHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._tmFocusTrap) { this._tmFocusTrap = false; this._tmAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._tmHighContrast = !this._tmHighContrast; this._tmAnnounce('High contrast ' + (this._tmHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._tmShortcutsVisible = !this._tmShortcutsVisible; }
  }

  private _tmAnnounce(msg: string): void {
    this._tmA11yAnnounce = msg;
    setTimeout(() => { this._tmA11yAnnounce = ''; }, 2000);
  }

  private _tmRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._tmShortcutsVisible ? 'active' : ''}" @click=${() => { this._tmShortcutsVisible = !this._tmShortcutsVisible; }} aria-expanded=${this._tmShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._tmHighContrast} @change=${() => { this._tmHighContrast = !this._tmHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._tmShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._tmShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._tmA11yAnnounce}</div>
      </div>
    `;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._initThreatModel();
    this._initPipeline();
    this._initPlaybooks();
    this._initMetrics();
    this._initIntegration();
    this._tmInitScenarios();
    this._tmInitTrendData();
    this._tmInitPermissions();
    document.addEventListener('keydown', this._tmHandleKeydown.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._tmHandleKeydown.bind(this));
  }

  // === TAB INTEGRATION FOR EXTENDED FEATURES ===
  @state() private _tmActiveSubTab: string = 'scenario';



  // === Advanced Threat Modeling (STRIDE/DREAD/Attack Tree) ===
  @state() private _threatModelEnabled = false;
  @state() private _threatCategories: Array<{
    id: string;
    category: string;
    threats: Array<{
      id: string;
      name: string;
      stride: string;
      likelihood: number;
      impact: number;
      dreadScore: number;
      status: string;
      mitigations: string[];
      assignedTo: string;
      discoveredDate: string;
      lastReviewed: string;
    }>;
    totalCount: number;
    criticalCount: number;
    mitigatedCount: number;
  }> = [];
  @state() private _selectedThreatCategory = '';
  @state() private _threatViewMode: 'matrix' | 'tree' | 'canvas' | 'comparison' = 'matrix';
  @state() private _threatModelVersion = 'v1.0';
  @state() private _threatModelHistory: Array<{ version: string; date: string; changes: string; author: string }> = [];

  private _initThreatModel() {
    const categories = [
      { id: 'tc1', category: 'Spoofing', threats: [
        { id: 't1', name: 'Credential theft via phishing', stride: 'S', likelihood: 8, impact: 9, dreadScore: 7.2, status: 'open', mitigations: ['MFA enforcement', 'Security awareness training'], assignedTo: 'Security Team', discoveredDate: '2024-01-10', lastReviewed: '2024-02-15' },
        { id: 't2', name: 'Session hijacking', stride: 'S', likelihood: 6, impact: 8, dreadScore: 6.5, status: 'mitigated', mitigations: ['Session rotation', 'Binding tokens'], assignedTo: 'Platform Team', discoveredDate: '2024-01-12', lastReviewed: '2024-02-20' },
        { id: 't3', name: 'Token forgery attack', stride: 'S', likelihood: 4, impact: 9, dreadScore: 5.8, status: 'in-progress', mitigations: ['Token signing', 'Short TTL'], assignedTo: 'Auth Team', discoveredDate: '2024-01-15', lastReviewed: '2024-02-18' },
      ], totalCount: 3, criticalCount: 1, mitigatedCount: 1 },
      { id: 'tc2', category: 'Tampering', threats: [
        { id: 't4', name: 'Data injection in security training', stride: 'T', likelihood: 7, impact: 8, dreadScore: 7.0, status: 'open', mitigations: ['Input validation', 'WAF rules'], assignedTo: 'Dev Team', discoveredDate: '2024-01-08', lastReviewed: '2024-02-10' },
        { id: 't5', name: 'Configuration drift', stride: 'T', likelihood: 5, impact: 6, dreadScore: 5.2, status: 'mitigated', mitigations: ['Config management', 'Drift detection'], assignedTo: 'SRE Team', discoveredDate: '2024-01-20', lastReviewed: '2024-02-22' },
      ], totalCount: 2, criticalCount: 1, mitigatedCount: 1 },
      { id: 'tc3', category: 'Repudiation', threats: [
        { id: 't6', name: 'Log tampering evidence loss', stride: 'R', likelihood: 5, impact: 7, dreadScore: 5.8, status: 'in-progress', mitigations: ['Immutable logs', 'Log forwarding'], assignedTo: 'SOC Team', discoveredDate: '2024-01-22', lastReviewed: '2024-02-25' },
      ], totalCount: 1, criticalCount: 0, mitigatedCount: 0 },
      { id: 'tc4', category: 'Info Disclosure', threats: [
        { id: 't7', name: 'Sensitive data exposure in API', stride: 'I', likelihood: 8, impact: 9, dreadScore: 8.2, status: 'open', mitigations: ['Data masking', 'Field-level encryption'], assignedTo: 'API Team', discoveredDate: '2024-01-05', lastReviewed: '2024-02-12' },
        { id: 't8', name: 'Cloud storage misconfiguration', stride: 'I', likelihood: 6, impact: 8, dreadScore: 6.8, status: 'mitigated', mitigations: ['Storage policies', 'Access reviews'], assignedTo: 'Cloud Team', discoveredDate: '2024-01-18', lastReviewed: '2024-02-20' },
        { id: 't9', name: 'Error message information leak', stride: 'I', likelihood: 7, impact: 4, dreadScore: 5.0, status: 'mitigated', mitigations: ['Generic error pages', 'Stack trace filter'], assignedTo: 'Dev Team', discoveredDate: '2024-01-25', lastReviewed: '2024-02-28' },
      ], totalCount: 3, criticalCount: 1, mitigatedCount: 2 },
      { id: 'tc5', category: 'Denial of Service', threats: [
        { id: 't10', name: 'Resource exhaustion attack', stride: 'D', likelihood: 7, impact: 8, dreadScore: 7.2, status: 'open', mitigations: ['Rate limiting', 'Circuit breaker'], assignedTo: 'Infra Team', discoveredDate: '2024-01-14', lastReviewed: '2024-02-16' },
        { id: 't11', name: 'API abuse amplification', stride: 'D', likelihood: 5, impact: 6, dreadScore: 5.4, status: 'in-progress', mitigations: ['API gateway throttling', 'Request quotas'], assignedTo: 'API Team', discoveredDate: '2024-01-28', lastReviewed: '2024-03-01' },
      ], totalCount: 2, criticalCount: 1, mitigatedCount: 0 },
      { id: 'tc6', category: 'Elevation of Privilege', threats: [
        { id: 't12', name: 'Privilege escalation via misconfig', stride: 'E', likelihood: 6, impact: 10, dreadScore: 7.8, status: 'open', mitigations: ['Least privilege', 'RBAC audit'], assignedTo: 'IAM Team', discoveredDate: '2024-01-06', lastReviewed: '2024-02-08' },
        { id: 't13', name: 'Container breakout exploit', stride: 'E', likelihood: 3, impact: 10, dreadScore: 5.8, status: 'mitigated', mitigations: ['Runtime security', 'Seccomp profiles'], assignedTo: 'Platform Team', discoveredDate: '2024-01-30', lastReviewed: '2024-03-02' },
      ], totalCount: 2, criticalCount: 1, mitigatedCount: 1 },
      { id: 'tc7', category: 'Supply Chain', threats: [
        { id: 't14', name: 'Dependency compromise', stride: 'E', likelihood: 5, impact: 8, dreadScore: 6.2, status: 'in-progress', mitigations: ['SBOM scanning', 'Lock files'], assignedTo: 'DevSecOps', discoveredDate: '2024-02-01', lastReviewed: '2024-03-05' },
      ], totalCount: 1, criticalCount: 1, mitigatedCount: 0 },
      { id: 'tc8', category: 'Physical / Social', threats: [
        { id: 't15', name: 'Tailgating access breach', stride: 'S', likelihood: 4, impact: 7, dreadScore: 5.2, status: 'open', mitigations: ['Badge access', 'Security cameras'], assignedTo: 'Physical Security', discoveredDate: '2024-02-03', lastReviewed: '2024-03-08' },
      ], totalCount: 1, criticalCount: 0, mitigatedCount: 0 },
    ];
    this._threatCategories = categories;
    this._threatModelHistory = [
      { version: 'v1.0', date: '2024-01-01', changes: 'Initial threat model created', author: 'Security Lead' },
      { version: 'v1.1', date: '2024-02-01', changes: 'Added supply chain threats, updated DREAD scores', author: 'Security Analyst' },
    ];
    this._threatModelEnabled = true;
  }

  private _getThreatColor(score: number): string {
    if (score >= 7) return '#f87171';
    if (score >= 5) return '#fbbf24';
    if (score >= 3) return '#34d399';
    return '#60a5fa';
  }

  private _renderThreatModelPanel(): any {
    if (!this._threatModelEnabled) return nothing;
    const totalThreats = this._threatCategories.reduce((s, c) => s + c.totalCount, 0);
    const criticalThreats = this._threatCategories.reduce((s, c) => s + c.criticalCount, 0);
    const mitigatedThreats = this._threatCategories.reduce((s, c) => s + c.mitigatedCount, 0);
    return html`
      <div style="margin-top:12px;padding:12px;background:#111827;border:1px solid #374151;border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-weight:700;font-size:13px;color:#f9fafb">Threat Model (STRIDE/DREAD)</div>
          <div style="display:flex;gap:6px">
            ${['matrix', 'tree', 'canvas', 'comparison'].map(m => html`
              <button class="btn btn-sm" style="padding:3px 10px;font-size:10px;${this._threatViewMode === m ? 'background:#1e40af;color:#fff' : 'background:#1f2937;color:#9ca3af'}" @click=${() => { this._threatViewMode = m as any; }}>${m.charAt(0).toUpperCase() + m.slice(1)}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <div style="flex:1;padding:8px;background:#1f2937;border-radius:6px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#f9fafb">${totalThreats}</div>
            <div style="font-size:10px;color:#9ca3af">Total Threats</div>
          </div>
          <div style="flex:1;padding:8px;background:#1f2937;border-radius:6px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#f87171">${criticalThreats}</div>
            <div style="font-size:10px;color:#9ca3af">Critical</div>
          </div>
          <div style="flex:1;padding:8px;background:#1f2937;border-radius:6px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#34d399">${mitigatedThreats}</div>
            <div style="font-size:10px;color:#9ca3af">Mitigated</div>
          </div>
          <div style="flex:1;padding:8px;background:#1f2937;border-radius:6px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#fbbf24">${this._threatModelVersion}</div>
            <div style="font-size:10px;color:#9ca3af">Version</div>
          </div>
        </div>
        ${this._threatViewMode === 'matrix' ? html`
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:4px;font-size:10px;margin-bottom:8px">
            <div style="padding:4px;text-align:center;color:#6b7280;border-bottom:1px solid #374151">Low Impact</div>
            <div style="padding:4px;text-align:center;color:#6b7280;border-bottom:1px solid #374151">Medium Impact</div>
            <div style="padding:4px;text-align:center;color:#6b7280;border-bottom:1px solid #374151">High Impact</div>
            <div style="padding:4px;text-align:center;color:#6b7280;border-bottom:1px solid #374151">Critical Impact</div>
            ${[0,1,2,3].map(row => html`
              <div style="padding:4px;text-align:center;color:#6b7280;background:#111827">${row === 0 ? 'Unlikely' : row === 1 ? 'Possible' : row === 2 ? 'Likely' : 'Almost Certain'}</div>
              ${[0,1,2,3].map(col => {
                const impact = (col + 1) * 2.5;
                const likelihood = (row + 1) * 2.5;
                const threats = this._threatCategories.flatMap(c => c.threats).filter(t => t.likelihood >= likelihood - 1.25 && t.likelihood < likelihood + 1.25 && t.impact >= impact - 1.25 && t.impact < impact + 1.25);
                const bgColor = (row + col) >= 4 ? 'rgba(239,68,68,0.15)' : (row + col) >= 2 ? 'rgba(251,191,36,0.15)' : 'rgba(52,211,153,0.15)';
                return html`<div style="padding:4px;text-align:center;background:${bgColor};border-radius:4px;cursor:pointer;font-size:9px;color:#d1d5db" title="${threats.map(t => t.name).join(', ')}">${threats.length}</div>`;
              })}
            `)}
          </div>
        ` : this._threatViewMode === 'canvas' ? html`
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:8px">
            ${this._threatCategories.map(cat => html`
              <div style="padding:8px;background:#1f2937;border-radius:6px;border-left:3px solid ${this._getThreatColor(cat.threats.reduce((s, t) => s + t.dreadScore, 0) / cat.totalCount)}">
                <div style="font-size:11px;font-weight:600;color:#f9fafb;margin-bottom:4px">${cat.category}</div>
                <div style="font-size:9px;color:#9ca3af">${cat.totalCount} threats (span style="color:#f87171">${cat.criticalCount} critical</span>)</div>
                <div style="margin-top:6px">${cat.threats.slice(0, 2).map(t => html`
                  <div style="display:flex;justify-content:space-between;padding:2px 0;font-size:9px">
                    <span style="color:#d1d5db">${t.name.substring(0, 20)}</span>
                    <span style="color:${this._getThreatColor(t.dreadScore)}">${t.dreadScore}</span>
                  </div>
                `)}</div>
              </div>
            `)}
          </div>
        ` : this._threatViewMode === 'tree' ? html`
          <div style="max-height:200px;overflow-y:auto">
            ${this._threatCategories.map(cat => html`
              <div style="margin-bottom:6px">
                <div style="padding:4px 8px;background:#1e3a5f;border-radius:4px 4px 0 0;font-size:11px;font-weight:600;color:#60a5fa">${cat.category} (${cat.totalCount})</div>
                ${cat.threats.map(t => html`
                  <div style="display:flex;align-items:center;padding:3px 8px 3px 24px;background:#111827;border-left:2px solid #374151;font-size:10px">
                    <span style="flex:1;color:#d1d5db">${t.name}</span>
                    <span style="color:${this._getThreatColor(t.dreadScore)};font-weight:600;margin-right:8px">${t.dreadScore}</span>
                    <span style="padding:1px 6px;border-radius:3px;font-size:8px;background:${t.status === 'mitigated' ? '#064e3b' : t.status === 'in-progress' ? '#78350f' : '#7f1d1d'};color:${t.status === 'mitigated' ? '#34d399' : t.status === 'in-progress' ? '#fbbf24' : '#f87171'}">${t.status}</span>
                  </div>
                `)}
              </div>
            `)}
          </div>
        ` : html`
          <div style="font-size:10px;color:#9ca3af;padding:8px;text-align:center">
            <div style="font-weight:600;color:#d1d5db;margin-bottom:6px">Threat Model Version History</div>
            ${this._threatModelHistory.map(h => html`
              <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #1f2937">
                <span style="color:#60a5fa">${h.version}</span>
                <span>${h.date}</span>
                <span style="color:#d1d5db">${h.author}</span>
                <span style="color:#9ca3af">${h.changes}</span>
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }


  // === Data Pipeline Visualization (DAG) ===
  @state() private _pipelineEnabled = false;
  @state() private _pipelineStages: Array<{
    id: string;
    name: string;
    type: string;
    status: 'running' | 'completed' | 'failed' | 'pending' | 'warning';
    inputRecords: number;
    outputRecords: number;
    errorRate: number;
    latencyMs: number;
    throughput: number;
    qualityScore: number;
    startTime: string;
    endTime: string;
    dependencies: string[];
    bottlenecks: string[];
  }> = [];
  @state() private _pipelineViewMode: 'dag' | 'timeline' | 'metrics' = 'dag';
  @state() private _pipelineSelectedStage = '';
  @state() private _pipelineAutoRefresh = false;

  private _initPipeline() {
    this._pipelineStages = [
      { id: 's1', name: 'Data Ingestion', type: 'source', status: 'completed', inputRecords: 0, outputRecords: 125000, errorRate: 0.01, latencyMs: 120, throughput: 5200, qualityScore: 98.5, startTime: '00:00:00', endTime: '00:00:48', dependencies: [], bottlenecks: [] },
      { id: 's2', name: 'Schema Validation', type: 'transform', status: 'completed', inputRecords: 125000, outputRecords: 124500, errorRate: 0.4, latencyMs: 85, throughput: 4800, qualityScore: 99.6, startTime: '00:00:48', endTime: '00:01:14', dependencies: ['s1'], bottlenecks: [] },
      { id: 's3', name: 'Enrichment Engine', type: 'enrichment', status: 'running', inputRecords: 124500, outputRecords: 98200, errorRate: 2.1, latencyMs: 340, throughput: 2900, qualityScore: 92.3, startTime: '00:01:14', endTime: '', dependencies: ['s2'], bottlenecks: ['High latency on geolocation lookup', 'External API rate limiting'] },
      { id: 's4', name: 'Deduplication', type: 'transform', status: 'pending', inputRecords: 98200, outputRecords: 0, errorRate: 0, latencyMs: 0, throughput: 0, qualityScore: 0, startTime: '', endTime: '', dependencies: ['s3'], bottlenecks: [] },
      { id: 's5', name: 'Threat Correlation', type: 'analysis', status: 'pending', inputRecords: 0, outputRecords: 0, errorRate: 0, latencyMs: 0, throughput: 0, qualityScore: 0, startTime: '', endTime: '', dependencies: ['s3', 's4'], bottlenecks: [] },
      { id: 's6', name: 'Scoring Engine', type: 'scoring', status: 'pending', inputRecords: 0, outputRecords: 0, errorRate: 0, latencyMs: 0, throughput: 0, qualityScore: 0, startTime: '', endTime: '', dependencies: ['s5'], bottlenecks: [] },
      { id: 's7', name: 'Alert Generation', type: 'sink', status: 'pending', inputRecords: 0, outputRecords: 0, errorRate: 0, latencyMs: 0, throughput: 0, qualityScore: 0, startTime: '', endTime: '', dependencies: ['s6'], bottlenecks: [] },
      { id: 's8', name: 'Archive Storage', type: 'sink', status: 'pending', inputRecords: 0, outputRecords: 0, errorRate: 0, latencyMs: 0, throughput: 0, qualityScore: 0, startTime: '', endTime: '', dependencies: ['s6'], bottlenecks: [] },
    ];
    this._pipelineEnabled = true;
  }

  private _getPipelineStatusColor(status: string): string {
    switch (status) {
      case 'completed': return '#34d399';
      case 'running': return '#60a5fa';
      case 'failed': return '#f87171';
      case 'warning': return '#fbbf24';
      default: return '#6b7280';
    }
  }

  private _getPipelineStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✓';
      case 'running': return '●';
      case 'failed': return '✗';
      case 'warning': return '⚠';
      default: return '○';
    }
  }

  private _renderPipelineVisualization(): any {
    if (!this._pipelineEnabled) return nothing;
    const completedCount = this._pipelineStages.filter(s => s.status === 'completed').length;
    const runningCount = this._pipelineStages.filter(s => s.status === 'running').length;
    const totalRecords = this._pipelineStages.reduce((s, p) => s + p.outputRecords, 0);
    return html`
      <div style="margin-top:12px;padding:12px;background:#111827;border:1px solid #374151;border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-weight:700;font-size:13px;color:#f9fafb">Data Pipeline (DAG)</div>
          <div style="display:flex;gap:6px;align-items:center">
            <span style="font-size:10px;color:#9ca3af">${completedCount}/${this._pipelineStages.length} stages</span>
            <span style="font-size:10px;color:#60a5fa">${totalRecords.toLocaleString()} records</span>
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:10px">
          ${['dag', 'timeline', 'metrics'].map(v => html`
            <button class="btn btn-sm" style="padding:3px 10px;font-size:10px;${this._pipelineViewMode === v ? 'background:#1e40af;color:#fff' : 'background:#1f2937;color:#9ca3af'}" @click=${() => { this._pipelineViewMode = v as any; }}>${v === 'dag' ? 'Flow Graph' : v === 'timeline' ? 'Timeline' : 'Metrics'}</button>
          `)}
        </div>
        ${this._pipelineViewMode === 'dag' ? html`
          <div style="position:relative;padding:8px">
            ${this._pipelineStages.map((stage, i) => html`
              <div style="display:flex;align-items:center;margin-bottom:4px;position:relative">
                <div style="width:16px;height:16px;border-radius:50%;background:${this._getPipelineStatusColor(stage.status)};display:flex;align-items:center;justify-content:center;font-size:8px;color:#111827;font-weight:700;z-index:1;flex-shrink:0">${this._getPipelineStatusIcon(stage.status)}</div>
                ${i < this._pipelineStages.length - 1 ? html`<div style="position:absolute;left:7px;top:16px;width:2px;height:20px;background:#374151"></div>` : nothing}
                <div style="margin-left:12px;flex:1;padding:6px 10px;background:#1f2937;border-radius:6px;border-left:3px solid ${this._getPipelineStatusColor(stage.status)};cursor:pointer" @click=${() => { this._pipelineSelectedStage = this._pipelineSelectedStage === stage.id ? '' : stage.id; }}>
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:11px;font-weight:600;color:#f9fafb">${stage.name}</span>
                    <span style="font-size:9px;color:#9ca3af">${stage.type}</span>
                  </div>
                  ${this._pipelineSelectedStage === stage.id ? html`
                    <div style="margin-top:6px;display:grid;grid-template-columns:repeat(3, 1fr);gap:4px;font-size:9px">
                      <div style="color:#9ca3af">In: <span style="color:#60a5fa">${stage.inputRecords.toLocaleString()}</span></div>
                      <div style="color:#9ca3af">Out: <span style="color:#34d399">${stage.outputRecords.toLocaleString()}</span></div>
                      <div style="color:#9ca3af">Errors: <span style="color:${stage.errorRate > 1 ? '#f87171' : '#fbbf24'}">${stage.errorRate}%</span></div>
                      <div style="color:#9ca3af">Latency: <span style="color:#d1d5db">${stage.latencyMs}ms</span></div>
                      <div style="color:#9ca3af">Throughput: <span style="color:#d1d5db">${stage.throughput}/s</span></div>
                      <div style="color:#9ca3af">Quality: <span style="color:${stage.qualityScore >= 95 ? '#34d399' : stage.qualityScore >= 80 ? '#fbbf24' : '#f87171'}">${stage.qualityScore}%</span></div>
                    </div>
                    ${stage.bottlenecks.length > 0 ? html`
                      <div style="margin-top:4px;padding:4px 6px;background:#7f1d1d;border-radius:4px;font-size:9px;color:#fca5a5">
                        Bottleneck: ${stage.bottlenecks.join('; ')}
                      </div>
                    ` : nothing}
                  ` : html`
                    <div style="font-size:9px;color:#6b7280;margin-top:2px">${stage.status === 'running' ? `Processing... ${stage.outputRecords.toLocaleString()} records` : stage.status === 'completed' ? `${stage.outputRecords.toLocaleString()} records processed` : 'Waiting for dependencies'}</div>
                  `}
                </div>
              </div>
            `)}
          </div>
        ` : this._pipelineViewMode === 'timeline' ? html`
          <div style="overflow-x:auto">
            <div style="display:flex;gap:2px;min-width:600px">
              ${this._pipelineStages.map(stage => {
                const totalSpan = 300;
                const startOffset = stage.startTime ? this._timeToOffset(stage.startTime) : 0;
                const endOffset = stage.endTime ? this._timeToOffset(stage.endTime) : this._timeToOffset('00:02:30');
                const width = Math.max(endOffset - startOffset, 8);
                return html`
                  <div style="flex-shrink:0;width:${width}px;margin-left:${startOffset}px;padding:4px;background:${this._getPipelineStatusColor(stage.status)}22;border:1px solid ${this._getPipelineStatusColor(stage.status)}44;border-radius:3px;font-size:8px;color:#d1d5db;overflow:hidden">
                    <div style="font-weight:600;white-space:nowrap">${stage.name}</div>
                    <div style="color:#9ca3af">${stage.startTime} - ${stage.endTime || '...'}</div>
                  </div>
                `;
              })}
            </div>
            <div style="display:flex;justify-content:space-between;font-size:8px;color:#6b7280;margin-top:4px">
              <span>00:00</span><span>00:30</span><span>01:00</span><span>01:30</span><span>02:00</span><span>02:30</span>
            </div>
          </div>
        ` : html`
          <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:6px">
            ${this._pipelineStages.filter(s => s.status !== 'pending').map(stage => html`
              <div style="padding:8px;background:#1f2937;border-radius:6px;text-align:center">
                <div style="font-size:10px;font-weight:600;color:#f9fafb;margin-bottom:4px">${stage.name}</div>
                <div style="font-size:16px;font-weight:700;color:${this._getPipelineStatusColor(stage.status)}">${stage.qualityScore}%</div>
                <div style="font-size:8px;color:#9ca3af">Quality Score</div>
                <div style="margin-top:4px;height:3px;background:#374151;border-radius:2px;overflow:hidden">
                  <div style="height:100%;width:${stage.qualityScore}%;background:${this._getPipelineStatusColor(stage.status)};border-radius:2px"></div>
                </div>
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }

  private _timeToOffset(time: string): number {
    const parts = time.split(':').map(Number);
    return Math.round((parts[0] * 3600 + parts[1] * 60 + parts[2]) / 5);
  }


  // === Playbook System (Runbooks) ===
  @state() private _playbookEnabled = false;
  @state() private _playbooks: Array<{
    id: string;
    name: string;
    type: 'incident-response' | 'containment' | 'eradication' | 'recovery' | 'forensic' | 'communication';
    severity: string;
    steps: Array<{
      id: string;
      title: string;
      description: string;
      condition?: string;
      completed: boolean;
      assignedTo: string;
      estimatedMinutes: number;
      tools: string[];
    }>;
    totalSteps: number;
    completedSteps: number;
    status: 'not-started' | 'in-progress' | 'completed' | 'paused';
    startedAt: string;
    estimatedDuration: number;
    currentStepIndex: number;
    version: string;
    lastModified: string;
  }> = [];
  @state() private _activePlaybookId = '';
  @state() private _playbookTimer = 0;
  @state() private _playbookTimerInterval: ReturnType<typeof setInterval> | null = null;

  private _initPlaybooks() {
    this._playbooks = [
      { id: 'pb1', name: 'Ransomware Incident Response', type: 'incident-response', severity: 'critical', steps: [
        { id: 's1', title: 'Isolate affected systems', description: 'Immediately disconnect compromised systems from the network to prevent lateral movement', completed: true, assignedTo: 'SOC Tier 2', estimatedMinutes: 5, tools: ['EDR Console', 'Network ACLs'] },
        { id: 's2', title: 'Preserve volatile evidence', description: 'Capture memory dumps and running process lists before shutdown', completed: true, assignedTo: 'Forensic Team', estimatedMinutes: 15, tools: ['Volatility', 'FTK Imager'] },
        { id: 's3', title: 'Identify ransomware variant', description: 'Analyze ransom note, encrypted file extensions, and behavioral indicators', completed: false, assignedTo: 'Malware Analyst', estimatedMinutes: 30, tools: ['VirusTotal', 'IDA Pro', 'ANY.RUN'] },
        { id: 's4', title: 'Check for data exfiltration', description: 'Review network logs for outbound data transfers during the attack window', completed: false, assignedTo: 'SOC Analyst', estimatedMinutes: 20, tools: ['SIEM', 'NetFlow Analyzer'] },
        { id: 's5', title: 'Assess backup integrity', description: 'Verify that clean backups exist and are not encrypted', condition: 'If backups are available', completed: false, assignedTo: 'Backup Admin', estimatedMinutes: 10, tools: ['Veeam', 'Backup Dashboard'] },
        { id: 's6', title: 'Report to leadership', description: 'Notify CISO and executive team with initial assessment and timeline', completed: false, assignedTo: 'Incident Commander', estimatedMinutes: 15, tools: ['Slack', 'Email'] },
        { id: 's7', title: 'Engage legal counsel', description: 'Contact legal team for regulatory notification requirements', completed: false, assignedTo: 'Legal Team', estimatedMinutes: 10, tools: ['Phone', 'Secure Email'] },
      ], totalSteps: 7, completedSteps: 2, status: 'in-progress', startedAt: '2024-02-15T14:30:00', estimatedDuration: 105, currentStepIndex: 2, version: 'v2.3', lastModified: '2024-02-10' },
      { id: 'pb2', name: 'Credential Compromise Containment', type: 'containment', severity: 'high', steps: [
        { id: 's1', title: 'Force password reset for affected users', description: 'Initiate password reset for all accounts with detected compromise indicators', completed: false, assignedTo: 'IAM Team', estimatedMinutes: 10, tools: ['ADUC', 'Okta Admin'] },
        { id: 's2', title: 'Revoke active sessions', description: 'Terminate all active sessions for compromised accounts across all systems', completed: false, assignedTo: 'IAM Team', estimatedMinutes: 5, tools: ['Session Manager', 'WAF'] },
        { id: 's3', title: 'Enable enhanced monitoring', description: 'Add additional logging and alerting for affected accounts', completed: false, assignedTo: 'SOC Team', estimatedMinutes: 15, tools: ['SIEM', 'UEBA'] },
        { id: 's4', title: 'Review privileged access', description: 'Audit any privilege escalation that occurred during compromise', completed: false, assignedTo: 'Security Architect', estimatedMinutes: 30, tools: ['PAM Console', 'Audit Logs'] },
        { id: 's5', title: 'Update firewall rules', description: 'Block known malicious IPs associated with the credential abuse', completed: false, assignedTo: 'Network Team', estimatedMinutes: 10, tools: ['Firewall Manager', 'Threat Intel'] },
      ], totalSteps: 5, completedSteps: 0, status: 'not-started', startedAt: '', estimatedDuration: 70, currentStepIndex: 0, version: 'v1.5', lastModified: '2024-02-08' },
      { id: 'pb3', name: 'Data Breach Eradication', type: 'eradication', severity: 'critical', steps: [
        { id: 's1', title: 'Identify all compromised endpoints', description: 'Scan entire fleet for indicators of compromise', completed: false, assignedTo: 'EDR Team', estimatedMinutes: 20, tools: ['CrowdStrike', 'SentinelOne'] },
        { id: 's2', title: 'Remove malicious persistence', description: 'Erase backdoors, scheduled tasks, and registry modifications', completed: false, assignedTo: 'Incident Response', estimatedMinutes: 30, tools: ['Autoruns', 'YARA'] },
        { id: 's3', title: 'Patch exploited vulnerabilities', description: 'Apply security patches for all known entry points', completed: false, assignedTo: 'Patch Team', estimatedMinutes: 45, tools: ['WSUS', 'Chef'] },
        { id: 's4', title: 'Rotate all compromised credentials', description: 'Systematic rotation of all potentially exposed secrets', completed: false, assignedTo: 'Secrets Team', estimatedMinutes: 25, tools: ['Vault', 'Key Management'] },
      ], totalSteps: 4, completedSteps: 0, status: 'not-started', startedAt: '', estimatedDuration: 120, currentStepIndex: 0, version: 'v1.2', lastModified: '2024-01-28' },
      { id: 'pb4', name: 'Service Recovery Procedure', type: 'recovery', severity: 'medium', steps: [
        { id: 's1', title: 'Restore from clean backup', description: 'Restore affected systems from verified clean backups', completed: false, assignedTo: 'Backup Team', estimatedMinutes: 60, tools: ['Veeam', 'AWS Backup'] },
        { id: 's2', title: 'Validate system integrity', description: 'Run baseline scans to confirm clean state', completed: false, assignedTo: 'Security Team', estimatedMinutes: 30, tools: ['Baseline Scanner', 'FIM'] },
        { id: 's3', title: 'Gradual service restoration', description: 'Bring systems online in phases with monitoring', completed: false, assignedTo: 'SRE Team', estimatedMinutes: 45, tools: ['Load Balancer', 'Monitoring'] },
      ], totalSteps: 3, completedSteps: 0, status: 'not-started', startedAt: '', estimatedDuration: 135, currentStepIndex: 0, version: 'v1.0', lastModified: '2024-02-01' },
      { id: 'pb5', name: 'Phishing Triage and Response', type: 'incident-response', severity: 'low', steps: [
        { id: 's1', title: 'Collect phishing report details', description: 'Document the phishing email headers, body, and attachments', completed: false, assignedTo: 'SOC Tier 1', estimatedMinutes: 5, tools: ['Ticket System'] },
        { id: 's2', title: 'Identify all recipients', description: 'Search mail logs for all users who received the phishing email', completed: false, assignedTo: 'Email Admin', estimatedMinutes: 10, tools: ['Exchange Admin', 'Google Workspace'] },
        { id: 's3', title: 'Block sender and URLs', description: 'Add malicious sender and URLs to blocklists', completed: false, assignedTo: 'Security Ops', estimatedMinutes: 5, tools: ['Email Gateway', 'Web Proxy'] },
        { id: 's4', title: 'Notify affected users', description: 'Send security advisory to all recipients', completed: false, assignedTo: 'Communications', estimatedMinutes: 10, tools: ['Email', 'Slack'] },
      ], totalSteps: 4, completedSteps: 0, status: 'not-started', startedAt: '', estimatedDuration: 30, currentStepIndex: 0, version: 'v3.1', lastModified: '2024-02-12' },
    ];
    this._playbookEnabled = true;
  }

  private _renderPlaybookSystem(): any {
    if (!this._playbookEnabled) return nothing;
    return html`
      <div style="margin-top:12px;padding:12px;background:#111827;border:1px solid #374151;border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-weight:700;font-size:13px;color:#f9fafb">Playbooks & Runbooks</div>
          <div style="display:flex;gap:4px;font-size:9px;color:#9ca3af">
            <span>${this._playbooks.filter(p => p.status === 'in-progress').length} active</span>
            <span>|</span>
            <span>${this._playbooks.filter(p => p.status === 'completed').length} done</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:280px;overflow-y:auto">
          ${this._playbooks.map(pb => {
            const progress = pb.totalSteps > 0 ? Math.round((pb.completedSteps / pb.totalSteps) * 100) : 0;
            const statusColor = pb.status === 'completed' ? '#34d399' : pb.status === 'in-progress' ? '#60a5fa' : pb.status === 'paused' ? '#fbbf24' : '#6b7280';
            const severityColor = pb.severity === 'critical' ? '#f87171' : pb.severity === 'high' ? '#fb923c' : '#fbbf24';
            return html`
              <div style="padding:8px;background:#1f2937;border-radius:6px;border-left:3px solid ${statusColor};cursor:pointer" @click=${() => { this._activePlaybookId = this._activePlaybookId === pb.id ? '' : pb.id; }}>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                  <span style="font-size:11px;font-weight:600;color:#f9fafb">${pb.name}</span>
                  <span style="display:flex;gap:4px;align-items:center">
                    <span style="padding:1px 6px;border-radius:3px;font-size:8px;background:${severityColor}22;color:${severityColor}">${pb.severity}</span>
                    <span style="font-size:9px;color:#9ca3af">${pb.version}</span>
                  </span>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <div style="flex:1;height:4px;background:#374151;border-radius:2px;overflow:hidden">
                    <div style="height:100%;width:${progress}%;background:${statusColor};border-radius:2px;transition:width 0.3s"></div>
                  </div>
                  <span style="font-size:9px;color:#9ca3af">${pb.completedSteps}/${pb.totalSteps} (${progress}%)</span>
                  <span style="font-size:9px;color:#6b7280">${pb.estimatedDuration}min</span>
                </div>
                ${this._activePlaybookId === pb.id ? html`
                  <div style="margin-top:8px;padding-top:8px;border-top:1px solid #374151">
                    ${pb.steps.map((step, i) => html`
                      <div style="display:flex;align-items:flex-start;gap:8px;padding:4px 0;${i < pb.steps.length - 1 ? 'border-bottom:1px solid #111827' : ''}">
                        <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${step.completed ? '#34d399' : i === pb.currentStepIndex ? '#60a5fa' : '#374151'};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;background:${step.completed ? '#34d399' : 'transparent'}">
                          ${step.completed ? html`<span style="font-size:9px;color:#111827">✓</span>` : i === pb.currentStepIndex ? html`<div style="width:6px;height:6px;border-radius:50%;background:#60a5fa"></div>` : nothing}
                        </div>
                        <div style="flex:1">
                          <div style="font-size:10px;font-weight:${step.completed ? '400' : '600'};color:${step.completed ? '#6b7280' : '#f9fafb'};${step.completed ? 'text-decoration:line-through' : ''}">${step.title}</div>
                          <div style="font-size:9px;color:#6b7280;margin-top:1px">${step.description.substring(0, 60)}${step.description.length > 60 ? '...' : ''}</div>
                          ${step.condition ? html`<div style="font-size:8px;color:#fbbf24;margin-top:2px;font-style:italic">${step.condition}</div>` : nothing}
                          <div style="font-size:8px;color:#4b5563;margin-top:2px">${step.assignedTo} · ${step.estimatedMinutes}min · ${step.tools.join(', ')}</div>
                        </div>
                      </div>
                    `)}
                  </div>
                ` : nothing}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }


  // === Metrics Dashboard (KPIs) ===
  @state() private _metricsEnabled = false;
  @state() private _kpis: Array<{
    id: string;
    name: string;
    value: number;
    previousValue: number;
    unit: string;
    threshold: { warning: number; critical: number; direction: 'above' | 'below' };
    trend: Array<number>;
    status: 'normal' | 'warning' | 'critical';
    alertEnabled: boolean;
    category: string;
  }> = [];
  @state() private _metricsPeriod: '1h' | '6h' | '24h' | '7d' = '24h';
  @state() private _metricsAutoRefresh = true;

  private _initMetrics() {
    const genTrend = (base: number, variance: number, len: number = 12): number[] =>
      Array.from({ length: len }, (_, i) => Math.round(base + (Math.random() - 0.5) * variance * 2));
    this._kpis = [
      { id: 'k1', name: 'MTTD (Mean Time to Detect)', value: 4.2, previousValue: 5.1, unit: 'min', threshold: { warning: 10, critical: 15, direction: 'above' }, trend: genTrend(4.5, 1.2), status: 'normal', alertEnabled: true, category: 'Detection' },
      { id: 'k2', name: 'MTTR (Mean Time to Respond)', value: 12.8, previousValue: 14.2, unit: 'min', threshold: { warning: 20, critical: 30, direction: 'above' }, trend: genTrend(13, 3), status: 'normal', alertEnabled: true, category: 'Response' },
      { id: 'k3', name: 'False Positive Rate', value: 8.3, previousValue: 9.1, unit: '%', threshold: { warning: 10, critical: 15, direction: 'above' }, trend: genTrend(8.5, 2), status: 'normal', alertEnabled: true, category: 'Accuracy' },
      { id: 'k4', name: 'Threat Coverage', value: 94.7, previousValue: 92.3, unit: '%', threshold: { warning: 85, critical: 75, direction: 'below' }, trend: genTrend(93, 3), status: 'normal', alertEnabled: true, category: 'Coverage' },
      { id: 'k5', name: 'Patch Compliance', value: 87.2, previousValue: 84.5, unit: '%', threshold: { warning: 90, critical: 80, direction: 'below' }, trend: genTrend(86, 4), status: 'warning', alertEnabled: true, category: 'Compliance' },
      { id: 'k6', name: 'Active Incidents', value: 3, previousValue: 5, unit: '', threshold: { warning: 5, critical: 10, direction: 'above' }, trend: genTrend(4, 2), status: 'normal', alertEnabled: true, category: 'Operations' },
      { id: 'k7', name: 'Vulnerability Backlog', value: 127, previousValue: 145, unit: '', threshold: { warning: 100, critical: 200, direction: 'above' }, trend: genTrend(130, 20), status: 'warning', alertEnabled: true, category: 'Risk' },
      { id: 'k8', name: 'Security Score', value: 82, previousValue: 79, unit: '/100', threshold: { warning: 70, critical: 50, direction: 'below' }, trend: genTrend(80, 5), status: 'normal', alertEnabled: true, category: 'Overall' },
    ];
    this._metricsEnabled = true;
  }

  private _getKpiStatus(kpi: any): string {
    if (kpi.threshold.direction === 'above') {
      if (kpi.value >= kpi.threshold.critical) return 'critical';
      if (kpi.value >= kpi.threshold.warning) return 'warning';
    } else {
      if (kpi.value <= kpi.threshold.critical) return 'critical';
      if (kpi.value <= kpi.threshold.warning) return 'warning';
    }
    return 'normal';
  }

  private _getKpiColor(status: string): string {
    switch (status) {
      case 'critical': return '#f87171';
      case 'warning': return '#fbbf24';
      default: return '#34d399';
    }
  }

  private _renderSparkline(data: number[], width: number = 60, height: number = 20): string {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const pts: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const x = ((i / (data.length - 1)) * width).toFixed(1);
      const y = (height - ((data[i] - min) / range) * height).toFixed(1);
      pts.push(x + ',' + y);
    }
    const points = pts.join(' ');
    return '<svg width="' + width + '" height="' + height + '" style="display:block"><polyline points="' + points + '" fill="none" stroke="#60a5fa" stroke-width="1.5" vector-effect="non-scaling-stroke"/></svg>';
  }

  private _renderMetricsDashboard(): any {
    if (!this._metricsEnabled) return nothing;
    return html`
      <div style="margin-top:12px;padding:12px;background:#111827;border:1px solid #374151;border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="font-weight:700;font-size:13px;color:#f9fafb">Security KPIs</div>
          <div style="display:flex;gap:4px">
            ${(['1h', '6h', '24h', '7d'] as const).map(p => html`
              <button class="btn btn-sm" style="padding:2px 8px;font-size:9px;${this._metricsPeriod === p ? 'background:#1e40af;color:#fff' : 'background:#1f2937;color:#9ca3af'}" @click=${() => { this._metricsPeriod = p; }}>${p}</button>
            `)}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:6px">
          ${this._kpis.map(kpi => {
            const status = this._getKpiStatus(kpi);
            const color = this._getKpiColor(status);
            const change = kpi.previousValue > 0 ? (((kpi.value - kpi.previousValue) / kpi.previousValue) * 100).toFixed(1) : '0';
            const changePositive = kpi.name.includes('Backlog') || kpi.name.includes('Time') ? parseFloat(change) < 0 : parseFloat(change) > 0;
            return html`
              <div style="padding:8px;background:#1f2937;border-radius:6px;border-top:2px solid ${color}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start">
                  <div style="font-size:9px;color:#9ca3af;text-transform:uppercase">${kpi.name}</div>
                  <div style="display:flex;align-items:center;gap:2px;font-size:8px;color:${changePositive ? '#34d399' : '#f87171'}">
                    ${parseFloat(change) > 0 ? html`▲` : html`▼`} ${Math.abs(parseFloat(change))}%
                  </div>
                </div>
                <div style="font-size:22px;font-weight:700;color:#f9fafb;margin:4px 0">${kpi.value}<span style="font-size:10px;color:#6b7280;font-weight:400">${kpi.unit}</span></div>
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <span style="font-size:8px;color:#6b7280">Prev: ${kpi.previousValue}${kpi.unit}</span>
                  <span innerHTML=${this._renderSparkline(kpi.trend, 50, 16)}></span>
                </div>
                <div style="margin-top:4px;display:flex;justify-content:space-between;align-items:center;font-size:8px">
                  <span style="color:#6b7280">${kpi.category}</span>
                  <span style="padding:1px 4px;border-radius:2px;background:${color}22;color:${color}">${status}</span>
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }


  // === Cross-Panel Integration (Event Bus) ===
  @state() private _integrationEnabled = false;
  @state() private _eventLog: Array<{
    id: string;
    source: string;
    target: string;
    eventType: string;
    payload: string;
    timestamp: string;
    status: 'delivered' | 'pending' | 'failed';
  }> = [];
  @state() private _sharedStateKeys: string[] = [];
  @state() private _integrationNavLinks: Array<{
    panel: string;
    label: string;
    description: string;
    icon: string;
  }> = [];

  private _initIntegration() {
    this._sharedStateKeys = [
      'selectedThreats', 'activeIncidentId', 'riskScore',
      'complianceStatus', 'assetFilter', 'timeRange',
      'userContext', 'severityFilter', 'teamAssignments',
      'pipelineStatus', 'alertCorrelationId', 'vulnerabilityScope',
    ];
    this._integrationNavLinks = [
      { panel: 'threat-model', label: 'Threat Model', description: 'View STRIDE analysis', icon: '🛡' },
      { panel: 'incident-response', label: 'Incident Timeline', description: 'Active incidents', icon: '📅' },
      { panel: 'vulnerability-mgmt', label: 'Vulnerability Scanner', description: 'Scan results', icon: '🔍' },
      { panel: 'compliance-dashboard', label: 'Compliance Map', description: 'Framework coverage', icon: '✅' },
      { panel: 'soc-workflow', label: 'SOC Workflow', description: 'Analyst queue', icon: '📋' },
      { panel: 'risk-dashboard', label: 'Risk Register', description: 'Risk assessment', icon: '⚠' },
    ];
    this._eventLog = [
      { id: 'e1', source: 'Alert System', target: 'Incident Timeline', eventType: 'alert.created', payload: 'New critical alert detected', timestamp: '2024-02-15T14:32:00', status: 'delivered' },
      { id: 'e2', source: 'Threat Intel', target: 'Alert Correlation', eventType: 'ioc.matched', payload: '3 IOCs matched active alerts', timestamp: '2024-02-15T14:31:00', status: 'delivered' },
      { id: 'e3', source: 'Vulnerability Scanner', target: 'Risk Dashboard', eventType: 'vuln.critical', payload: 'New CVE-2024-XXXX detected', timestamp: '2024-02-15T14:30:00', status: 'pending' },
      { id: 'e4', source: 'Pipeline', target: 'Metrics Dashboard', eventType: 'pipeline.completed', payload: 'Data ingestion pipeline completed', timestamp: '2024-02-15T14:28:00', status: 'delivered' },
      { id: 'e5', source: 'Compliance Check', target: 'Board Report', eventType: 'compliance.drift', payload: 'CIS benchmark drift detected', timestamp: '2024-02-15T14:25:00', status: 'failed' },
    ];
    this._integrationEnabled = true;
  }

  private _publishEvent(source: string, target: string, eventType: string, payload: string) {
    const event = {
      id: 'e' + (this._eventLog.length + 1),
      source, target, eventType, payload,
      timestamp: new Date().toISOString(),
      status: 'delivered' as const,
    };
    this._eventLog = [event, ...this._eventLog].slice(0, 20);
  }

  private _renderIntegrationPanel(): any {
    if (!this._integrationEnabled) return nothing;
    return html`
      <div style="margin-top:12px;padding:12px;background:#111827;border:1px solid #374151;border-radius:8px">
        <div style="font-weight:700;font-size:13px;color:#f9fafb;margin-bottom:10px">Cross-Panel Integration</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="padding:8px;background:#1f2937;border-radius:6px">
            <div style="font-size:10px;font-weight:600;color:#60a5fa;margin-bottom:6px">Navigation Links</div>
            ${this._integrationNavLinks.map(link => html`
              <div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:10px;cursor:pointer" @click=${() => this._publishEvent(this.panelId, link.panel, 'nav.requested', link.description)}>
                <span>${link.icon}</span>
                <div>
                  <div style="color:#f9fafb;font-weight:500">${link.label}</div>
                  <div style="color:#6b7280;font-size:8px">${link.description}</div>
                </div>
              </div>
            `)}
          </div>
          <div style="padding:8px;background:#1f2937;border-radius:6px">
            <div style="font-size:10px;font-weight:600;color:#60a5fa;margin-bottom:6px">Event Stream</div>
            ${this._eventLog.slice(0, 5).map(ev => html`
              <div style="display:flex;align-items:center;gap:4px;padding:3px 0;border-bottom:1px solid #111827;font-size:9px">
                <span style="width:6px;height:6px;border-radius:50%;background:${ev.status === 'delivered' ? '#34d399' : ev.status === 'pending' ? '#fbbf24' : '#f87171'}"></span>
                <span style="color:#60a5fa">${ev.source}</span>
                <span style="color:#4b5563">→</span>
                <span style="color:#d1d5db">${ev.target}</span>
                <span style="color:#6b7280;margin-left:auto">${ev.eventType}</span>
              </div>
            `)}
          </div>
        </div>
        <div style="margin-top:8px;padding:6px;background:#1f2937;border-radius:6px">
          <div style="font-size:10px;font-weight:600;color:#60a5fa;margin-bottom:4px">Shared State (${this._sharedStateKeys.length} keys)</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">
            ${this._sharedStateKeys.map(key => html`
              <span style="padding:2px 8px;background:#111827;border-radius:4px;font-size:8px;color:#9ca3af;border:1px solid #374151">${key}</span>
            `)}
          </div>
        </div>
      </div>
    `;
  }

  private _tmGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _tmRenderSubPanel(): any {
    switch (this._tmActiveSubTab) {
      case 'scenario': return this._tmRenderScenarioEngine();
      case 'timeseries': return this._tmRenderTimeSeries();
      case 'rbac': return this._tmRenderRBAC();
      case 'reporting': return this._tmRenderReporting();
      case 'a11y': return this._tmRenderAccessibility();
      default: return nothing;
    }
  }

  private _tmRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._tmGetAllSubTabs().map(t => html`
          <button class="tab ${this._tmActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._tmActiveSubTab = t.key; }} role="tab" aria-selected=${this._tmActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="tm-tab-${this._tmActiveSubTab}">
        ${this._tmRenderSubPanel()}
      </div>
    `;
  }

  // === SECTION F: SOAR Playbook Automation ===
  @state() private _soarPlaybooks: Array<{
    id: string; name: string; status: 'active' | 'draft' | 'disabled' | 'running';
    steps: Array<{ id: string; action: string; condition?: string; order: number; type: 'scan' | 'analyze' | 'alert' | 'contain' | 'remediate' | 'notify'; enabled: boolean; executedAt?: string; result?: string; duration?: number }>;
    triggerType: 'threat-level' | 'ioc-match' | 'schedule' | 'manual' | 'vuln-scan';
    triggerThreshold: number; totalRuns: number; lastRun: string;
    autoResolved: number; manualOverrides: number; avgDuration: number;
    created: string; author: string; tags: string[];
  }> = [
    {
      id: 'pb-soar-001', name: 'Training Module Auto Response', status: 'active',
      steps: [
        { id: 's1', action: 'Scan for indicators', type: 'scan', order: 1, enabled: true, executedAt: '2026-04-22T08:00:00Z', result: '12 indicators found', duration: 4.2 },
        { id: 's2', action: 'Analyze severity', condition: 'if threat_level > 7 then proceed', type: 'analyze', order: 2, enabled: true, executedAt: '2026-04-22T08:01:00Z', result: 'Critical severity detected', duration: 2.1 },
        { id: 's3', action: 'Alert SOC team', type: 'alert', order: 3, enabled: true, executedAt: '2026-04-22T08:02:00Z', result: 'Alert sent to 5 analysts', duration: 0.5 },
        { id: 's4', action: 'Contain threat', type: 'contain', order: 4, enabled: true, executedAt: '2026-04-22T08:05:00Z', result: 'Isolated 3 hosts', duration: 12.8 },
        { id: 's5', action: 'Remediate findings', condition: 'if auto_resolve_enabled then auto_fix', type: 'remediate', order: 5, enabled: true, executedAt: '2026-04-22T08:10:00Z', result: '8 of 12 findings resolved', duration: 25.3 },
        { id: 's6', action: 'Notify stakeholders', type: 'notify', order: 6, enabled: true, executedAt: '2026-04-22T08:15:00Z', result: 'Email sent to CISO', duration: 0.3 },
      ],
      triggerType: 'threat-level', triggerThreshold: 7, totalRuns: 342, lastRun: '2026-04-22T08:15:00Z',
      autoResolved: 218, manualOverrides: 124, avgDuration: 45.2,
      created: '2026-01-15T10:00:00Z', author: 'SOC Automation', tags: ['automated', 'critical', 'response'],
    },
    {
      id: 'pb-soar-002', name: 'Training Module Investigation Workflow', status: 'active',
      steps: [
        { id: 's1', action: 'Collect evidence', type: 'scan', order: 1, enabled: true, executedAt: '2026-04-21T14:00:00Z', result: 'Evidence collected from 7 sources', duration: 8.5 },
        { id: 's2', action: 'Correlate events', type: 'analyze', order: 2, enabled: true, executedAt: '2026-04-21T14:05:00Z', result: '23 events correlated', duration: 5.2 },
        { id: 's3', action: 'Escalate if needed', condition: 'if confidence > 85 then escalate', type: 'alert', order: 3, enabled: true },
        { id: 's4', action: 'Document findings', type: 'remediate', order: 4, enabled: true, executedAt: '2026-04-21T14:20:00Z', result: 'Report generated', duration: 3.1 },
      ],
      triggerType: 'ioc-match', triggerThreshold: 3, totalRuns: 156, lastRun: '2026-04-21T14:20:00Z',
      autoResolved: 89, manualOverrides: 67, avgDuration: 28.7,
      created: '2026-02-01T09:00:00Z', author: 'Threat Intel Team', tags: ['investigation', 'forensics'],
    },
    {
      id: 'pb-soar-003', name: 'Training Module Compliance Scan', status: 'draft',
      steps: [
        { id: 's1', action: 'Run compliance checks', type: 'scan', order: 1, enabled: true },
        { id: 's2', action: 'Map to controls', type: 'analyze', order: 2, enabled: true },
        { id: 's3', action: 'Generate compliance report', type: 'notify', order: 3, enabled: true },
      ],
      triggerType: 'schedule', triggerThreshold: 0, totalRuns: 0, lastRun: 'N/A',
      autoResolved: 0, manualOverrides: 0, avgDuration: 0,
      created: '2026-04-20T16:00:00Z', author: 'GRC Team', tags: ['compliance', 'audit', 'scheduled'],
    },
  ];
  @state() private _soarSelectedPlaybook: string = '';
  @state() private _soarMetrics: {
    actionsPerHour: number; autoResolveRate: number; avgResponseTime: number;
    activePlaybooks: number; totalActionsToday: number; errorRate: number;
    manualInterventions: number; escalationRate: number;
  } = {
    actionsPerHour: 47.3, autoResolveRate: 73.8, avgResponseTime: 12.4,
    activePlaybooks: 3, totalActionsToday: 284, errorRate: 2.1,
    manualInterventions: 18, escalationRate: 8.5,
  };
  @state() private _soarDragStep: string | null = null;

  private _renderSoarPlaybookBuilder(): any {
    const selected = this._soarPlaybooks.find(p => p.id === this._soarSelectedPlaybook);
    return html`
      <div style="padding:12px;background:#0a0c10;border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">SOAR Playbook Automation</span>
          <div style="display:flex;gap:6px;align-items:center">
            <span class="tag" style="background:#1e3a5f;color:#60a5fa;font-size:9px">${this._soarMetrics.actionsPerHour} actions/hr</span>
            <span class="tag" style="background:#14532d;color:#22c55e;font-size:9px">${this._soarMetrics.autoResolveRate}% auto-resolved</span>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
          <div style="background:#111827;border-radius:6px;padding:8px;text-align:center">
            <div style="font-size:18px;font-weight:700;color:#60a5fa">${this._soarMetrics.totalActionsToday}</div>
            <div style="font-size:9px;color:#6b7280">Actions Today</div>
          </div>
          <div style="background:#111827;border-radius:6px;padding:8px;text-align:center">
            <div style="font-size:18px;font-weight:700;color:#22c55e">${this._soarMetrics.avgResponseTime}s</div>
            <div style="font-size:9px;color:#6b7280">Avg Response</div>
          </div>
          <div style="background:#111827;border-radius:6px;padding:8px;text-align:center">
            <div style="font-size:18px;font-weight:700;color:#f59e0b">${this._soarMetrics.errorRate}%</div>
            <div style="font-size:9px;color:#6b7280">Error Rate</div>
          </div>
          <div style="background:#111827;border-radius:6px;padding:8px;text-align:center">
            <div style="font-size:18px;font-weight:700;color:#ef4444">${this._soarMetrics.escalationRate}%</div>
            <div style="font-size:9px;color:#6b7280">Escalation Rate</div>
          </div>
        </div>
        <div style="font-weight:600;font-size:11px;color:#9ca3af;text-transform:uppercase;margin-bottom:6px">Playbooks</div>
        ${this._soarPlaybooks.map(pb => html`
          <div style="display:flex;align-items:center;gap:8px;padding:6px;background:#111827;border-radius:4px;margin-bottom:3px;cursor:pointer;border:1px solid ${selected?.id === pb.id ? '#3b82f6' : 'transparent'}"
               @click=${() => { this._soarSelectedPlaybook = selected?.id === pb.id ? '' : pb.id; }}
               @dragover=${(e: any) => { e.preventDefault(); this._soarDragStep = pb.id; }}
               @dragleave=${() => { this._soarDragStep = null; }}
               @drop=${(e: any) => { e.preventDefault(); this._soarDragStep = null; }}>
            <span style="color:${pb.status === 'active' ? '#22c55e' : pb.status === 'running' ? '#3b82f6' : pb.status === 'draft' ? '#f59e0b' : '#6b7280'}">${pb.status === 'active' ? '●' : pb.status === 'running' ? '◉' : pb.status === 'draft' ? '◐' : '○'}</span>
            <span style="flex:1;color:#e2e8f0;font-size:10px">${pb.name}</span>
            <span class="tag" style="font-size:8px">${pb.triggerType}</span>
            <span style="color:#6b7280;font-size:9px">${pb.totalRuns} runs</span>
            <span style="color:#22c55e;font-size:9px">${pb.autoResolved}% auto</span>
          </div>
        `)}
        ${selected ? html`
          <div style="margin-top:10px;background:#111827;border-radius:6px;padding:10px">
            <div style="font-weight:600;font-size:11px;color:#e2e8f0;margin-bottom:8px">${selected.name} - Steps (drag to reorder)</div>
            ${selected.steps.sort((a, b) => a.order - b.order).map((step, idx) => html`
              <div style="display:flex;align-items:center;gap:6px;padding:6px;background:#0a0c10;border-radius:4px;margin-bottom:3px;font-size:10px;cursor:grab;border-left:3px solid ${step.type === 'scan' ? '#3b82f6' : step.type === 'analyze' ? '#8b5cf6' : step.type === 'alert' ? '#f59e0b' : step.type === 'contain' ? '#ef4444' : step.type === 'remediate' ? '#22c55e' : '#06b6d4'}"
                   draggable="true"
                   @dragstart=${(e: any) => { e.dataTransfer.setData('text/plain', step.id); }}
                   @drop=${(e: any) => { e.preventDefault(); const fromId = e.dataTransfer.getData('text/plain'); if (fromId && fromId !== step.id) { const pb = this._soarPlaybooks.find(p => p.id === selected.id); if (pb) { const fromIdx = pb.steps.findIndex(s => s.id === fromId); if (fromIdx >= 0) { const temp = pb.steps[fromIdx].order; pb.steps[fromIdx].order = step.order; step.order = temp; this.requestUpdate(); }} } }}>
                <span style="color:#6b7280;font-weight:700">${idx + 1}</span>
                <span style="color:${step.enabled ? '#22c55e' : '#6b7280'}">${step.enabled ? '✓' : '○'}</span>
                <span style="flex:1;color:#e2e8f0">${step.action}</span>
                ${step.condition ? html`<span style="color:#f59e0b;font-size:8px;font-style:italic">${step.condition}</span>` : nothing}
                ${step.duration ? html`<span style="color:#6b7280">${step.duration}s</span>` : nothing}
                <button class="btn btn-sm" style="font-size:8px">Override</button>
              </div>
            `)}
            <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:1px solid #1f2937">
              <span style="font-size:9px;color:#6b7280">Avg duration: ${selected.avgDuration}s | Manual overrides: ${selected.manualOverrides}</span>
              <button class="btn btn-sm" style="font-size:9px;background:#1e3a5f">Execute Playbook</button>
            </div>
          </div>
        ` : nothing}
      </div>`;
  }

  // === SECTION G: Threat Intelligence Feed ===
  @state() private _tiFeeds: Array<{
    id: string; name: string; status: 'healthy' | 'degraded' | 'down'; type: 'STIX' | 'TAXII' | 'CSV' | 'API' | 'RSS';
    iocsPerHour: number; lastPoll: string; totalIndicators: number;
    reliability: number; coverage: string;
  }> = [
    { id: 'tf-001', name: 'MITRE ATT&CK Feed', status: 'healthy', type: 'STIX', iocsPerHour: 23.5, lastPoll: '2026-04-22T09:30:00Z', totalIndicators: 245000, reliability: 98.2, coverage: 'TTPs, Software, Groups' },
    { id: 'tf-002', name: 'AlienVault OTX', status: 'healthy', type: 'API', iocsPerHour: 145.7, lastPoll: '2026-04-22T09:29:00Z', totalIndicators: 1820000, reliability: 85.4, coverage: 'IPs, Domains, Hashes, URLs' },
    { id: 'tf-003', name: 'AbuseIPDB', status: 'degraded', type: 'API', iocsPerHour: 89.3, lastPoll: '2026-04-22T09:25:00Z', totalIndicators: 560000, reliability: 91.7, coverage: 'IPs, ASN' },
    { id: 'tf-004', name: 'MISP Community', status: 'healthy', type: 'TAXII', iocsPerHour: 67.8, lastPoll: '2026-04-22T09:28:00Z', totalIndicators: 890000, reliability: 88.9, coverage: 'Composite IOCs, Malware' },
    { id: 'tf-005', name: 'VirusTotal Live', status: 'down', type: 'API', iocsPerHour: 0, lastPoll: '2026-04-22T08:00:00Z', totalIndicators: 0, reliability: 0, coverage: 'Hashes, URLs, Domains' },
  ];
  @state() private _tiIndicators: Array<{
    id: string; value: string; type: 'ip' | 'domain' | 'hash' | 'email' | 'url';
    severity: 'critical' | 'high' | 'medium' | 'low'; lifecycle: 'new' | 'verified' | 'aging' | 'expired';
    source: string; firstSeen: string; lastSeen: string; confidence: number;
    tags: string[]; description: string; hitCount: number;
  }> = [
    { id: 'ioc-001', value: '192.168.45.102', type: 'ip', severity: 'critical', lifecycle: 'verified', source: 'MITRE ATT&CK', firstSeen: '2026-04-15T06:00:00Z', lastSeen: '2026-04-22T08:30:00Z', confidence: 95, tags: ['c2', 'apt28'], description: 'Known APT28 command and control server', hitCount: 342 },
    { id: 'ioc-002', value: 'evil-phishing-login.com', type: 'domain', severity: 'high', lifecycle: 'new', source: 'AlienVault OTX', firstSeen: '2026-04-22T07:00:00Z', lastSeen: '2026-04-22T09:00:00Z', confidence: 82, tags: ['phishing', 'credential-theft'], description: 'Credential harvesting domain mimicking corporate login', hitCount: 56 },
    { id: 'ioc-003', value: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', type: 'hash', severity: 'critical', lifecycle: 'verified', source: 'VirusTotal', firstSeen: '2026-03-01T12:00:00Z', lastSeen: '2026-04-20T15:00:00Z', confidence: 99, tags: ['ransomware', 'lockbit'], description: 'LockBit 4.0 ransomware payload', hitCount: 1287 },
    { id: 'ioc-004', value: 'attacker@evilcorp.net', type: 'email', severity: 'medium', lifecycle: 'aging', source: 'MISP', firstSeen: '2026-02-10T09:00:00Z', lastSeen: '2026-03-15T14:00:00Z', confidence: 71, tags: ['spear-phishing', 'social-engineering'], description: 'Spear phishing sender address linked to Evil Corp', hitCount: 23 },
    { id: 'ioc-005', value: 'https://malware-distribution.ru/payload.exe', type: 'url', severity: 'critical', lifecycle: 'new', source: 'AbuseIPDB', firstSeen: '2026-04-22T01:00:00Z', lastSeen: '2026-04-22T09:00:00Z', confidence: 88, tags: ['malware', 'drive-by'], description: 'Active malware distribution URL serving Cobalt Strike beacon', hitCount: 189 },
    { id: 'ioc-006', value: '10.0.15.200', type: 'ip', severity: 'low', lifecycle: 'expired', source: 'Internal', firstSeen: '2026-01-05T08:00:00Z', lastSeen: '2026-02-28T18:00:00Z', confidence: 45, tags: ['internal', 'resolved'], description: 'Previously compromised internal host, now remediated', hitCount: 0 },
  ];
  @state() private _tiActors: Array<{
    id: string; name: string; aliases: string[]; sophistication: 'advanced' | 'intermediate' | 'basic';
    motivation: string; origin: string; ttpCount: number; activeSince: string;
    associatedIocs: number; lastActivity: string; description: string;
  }> = [
    { id: 'ta-001', name: 'APT28 (Fancy Bear)', aliases: ['Sofacy', 'Sednit', 'Strontium'], sophistication: 'advanced', motivation: 'Espionage', origin: 'Russia', ttpCount: 42, activeSince: '2007', associatedIocs: 1250, lastActivity: '2026-04-22T08:00:00Z', description: 'Russian GRU-linked group targeting government and military organizations' },
    { id: 'ta-002', name: 'Lazarus Group', aliases: ['Hidden Cobra', 'Diamond Sleet'], sophistication: 'advanced', motivation: 'Financial', origin: 'DPRK', ttpCount: 38, activeSince: '2009', associatedIocs: 980, lastActivity: '2026-04-21T16:00:00Z', description: 'North Korean state-sponsored group targeting financial institutions and cryptocurrency' },
  ];
  @state() private _tiFilterType: string = 'all';
  @state() private _tiFilterLifecycle: string = 'all';

  private _renderThreatIntelFeed(): any {
    const filtered = this._tiIndicators.filter(i => {
      if (this._tiFilterType !== 'all' && i.type !== this._tiFilterType) return false;
      if (this._tiFilterLifecycle !== 'all' && i.lifecycle !== this._tiFilterLifecycle) return false;
      return true;
    });
    return html`
      <div style="padding:12px;background:#0a0c10;border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Threat Intelligence Feed</span>
          <div style="display:flex;gap:4px">
            <select style="background:#111827;border:1px solid #374151;color:#9ca3af;font-size:9px;padding:2px 4px;border-radius:3px" @change=${(e: any) => { this._tiFilterType = e.target.value; }}>
              <option value="all">All Types</option>
              <option value="ip">IP</option><option value="domain">Domain</option><option value="hash">Hash</option>
              <option value="email">Email</option><option value="url">URL</option>
            </select>
            <select style="background:#111827;border:1px solid #374151;color:#9ca3af;font-size:9px;padding:2px 4px;border-radius:3px" @change=${(e: any) => { this._tiFilterLifecycle = e.target.value; }}>
              <option value="all">All Lifecycle</option>
              <option value="new">New</option><option value="verified">Verified</option>
              <option value="aging">Aging</option><option value="expired">Expired</option>
            </select>
          </div>
        </div>
        <div style="font-weight:600;font-size:11px;color:#9ca3af;text-transform:uppercase;margin-bottom:6px">Feed Health (STIX/TAXII)</div>
        ${this._tiFeeds.map(feed => html`
          <div style="display:flex;align-items:center;gap:6px;padding:4px 6px;background:#111827;border-radius:3px;margin-bottom:2px;font-size:9px">
            <span style="color:${feed.status === 'healthy' ? '#22c55e' : feed.status === 'degraded' ? '#f59e0b' : '#ef4444'}">${feed.status === 'healthy' ? '●' : feed.status === 'degraded' ? '◐' : '✕'}</span>
            <span style="flex:1;color:#e2e8f0">${feed.name}</span>
            <span class="tag" style="font-size:7px">${feed.type}</span>
            <span style="color:#6b7280">${feed.iocsPerHour} IOC/hr</span>
            <span style="color:#6b7280">${feed.reliability}%</span>
          </div>
        `)}
        <div style="font-weight:600;font-size:11px;color:#9ca3af;text-transform:uppercase;margin:10px 0 6px">IOC Indicators (${filtered.length})</div>
        ${filtered.slice(0, 6).map(ioc => html`
          <div style="display:flex;align-items:center;gap:6px;padding:4px 6px;background:#111827;border-radius:3px;margin-bottom:2px;font-size:9px">
            <span class="tag" style="font-size:7px;background:${ioc.type === 'ip' ? '#1e3a5f' : ioc.type === 'domain' ? '#3b1f4a' : ioc.type === 'hash' ? '#1a3a2a' : ioc.type === 'email' ? '#3a2a1a' : '#1a2a3a'};color:${ioc.type === 'ip' ? '#60a5fa' : ioc.type === 'domain' ? '#a78bfa' : ioc.type === 'hash' ? '#22c55e' : ioc.type === 'email' ? '#f59e0b' : '#06b6d4'}">${ioc.type}</span>
            <span style="flex:1;color:#e2e8f0;font-family:monospace;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ioc.value}</span>
            <span style="color:${ioc.lifecycle === 'new' ? '#22c55e' : ioc.lifecycle === 'verified' ? '#60a5fa' : ioc.lifecycle === 'aging' ? '#f59e0b' : '#6b7280'};font-size:8px">${ioc.lifecycle}</span>
            <span style="color:${ioc.severity === 'critical' ? '#ef4444' : ioc.severity === 'high' ? '#f59e0b' : '#6b7280'};font-size:8px">${ioc.confidence}%</span>
            <span style="color:#6b7280">${ioc.hitCount} hits</span>
          </div>
        `)}
        <div style="font-weight:600;font-size:11px;color:#9ca3af;text-transform:uppercase;margin:10px 0 6px">Threat Actors</div>
        ${this._tiActors.map(actor => html`
          <div style="padding:6px;background:#111827;border-radius:4px;margin-bottom:3px;border-left:3px solid ${actor.sophistication === 'advanced' ? '#ef4444' : actor.sophistication === 'intermediate' ? '#f59e0b' : '#22c55e'}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:600;color:#e2e8f0;font-size:10px">${actor.name}</span>
              <span class="tag" style="font-size:8px;background:#3b1f2a;color:#f87171">${actor.sophistication}</span>
            </div>
            <div style="font-size:9px;color:#6b7280;margin-top:2px">${actor.aliases.join(', ')} | ${actor.origin} | ${actor.motivation}</div>
            <div style="font-size:9px;color:#9ca3af;margin-top:2px">${actor.description}</div>
            <div style="display:flex;gap:8px;margin-top:3px;font-size:8px;color:#6b7280">
              <span>${actor.ttpCount} TTPs</span>
              <span>${actor.associatedIocs} IOCs</span>
              <span>Since ${actor.activeSince}</span>
              <span>Last: ${actor.lastActivity.split('T')[0]}</span>
            </div>
          </div>
        `)}
      </div>`;
  }

  // === SECTION H: Vulnerability Lifecycle Pipeline ===
  @state() private _vulnPipeline: Array<{
    id: string; title: string; severity: 'critical' | 'high' | 'medium' | 'low';
    stage: 'discovery' | 'triage' | 'patch' | 'verify' | 'closed';
    cvssBase: number; cvssTemporal: number; cvssEnvironmental: number;
    cve: string; component: string; discovered: string; daysOpen: number;
    slaDeadline: string; patchProgress: number; environments: Array<{ name: string; status: 'pending' | 'patching' | 'verified' | 'failed'; progress: number }>;
    recurrence: number; assignee: string; notes: string;
  }> = [
    { id: 'vl-001', title: 'Apache Log4j RCE', severity: 'critical', stage: 'verify', cvssBase: 10.0, cvssTemporal: 9.8, cvssEnvironmental: 9.5, cve: 'CVE-2026-44228', component: 'log4j-core 2.14.1', discovered: '2026-04-10T08:00:00Z', daysOpen: 12, slaDeadline: '2026-04-17T08:00:00Z', patchProgress: 75, environments: [{ name: 'dev', status: 'verified', progress: 100 }, { name: 'staging', status: 'patching', progress: 80 }, { name: 'prod', status: 'pending', progress: 0 }], recurrence: 0, assignee: 'Alice Chen', notes: 'Critical RCE in logging library, all environments must be patched' },
    { id: 'vl-002', title: 'Spring4Shell Path Traversal', severity: 'high', stage: 'patch', cvssBase: 9.8, cvssTemporal: 9.0, cvssEnvironmental: 8.7, cve: 'CVE-2026-22965', component: 'spring-web 5.3.18', discovered: '2026-04-15T12:00:00Z', daysOpen: 7, slaDeadline: '2026-04-22T12:00:00Z', patchProgress: 40, environments: [{ name: 'dev', status: 'patching', progress: 60 }, { name: 'staging', status: 'pending', progress: 0 }, { name: 'prod', status: 'pending', progress: 0 }], recurrence: 1, assignee: 'Bob Smith', notes: 'Second occurrence of this vulnerability class' },
    { id: 'vl-003', title: 'JWT Secret Weakness', severity: 'medium', stage: 'triage', cvssBase: 7.5, cvssTemporal: 7.0, cvssEnvironmental: 6.8, cve: 'CVE-2026-31001', component: 'jsonwebtoken 8.5.1', discovered: '2026-04-20T09:00:00Z', daysOpen: 2, slaDeadline: '2026-04-27T09:00:00Z', patchProgress: 0, environments: [{ name: 'dev', status: 'pending', progress: 0 }, { name: 'staging', status: 'pending', progress: 0 }, { name: 'prod', status: 'pending', progress: 0 }], recurrence: 0, assignee: 'Carol Wu', notes: 'Algorithm confusion allows token forgery' },
    { id: 'vl-004', title: 'Outdated OpenSSL Version', severity: 'high', stage: 'discovery', cvssBase: 8.1, cvssTemporal: 7.8, cvssEnvironmental: 7.5, cve: 'CVE-2026-38000', component: 'openssl 1.1.1k', discovered: '2026-04-22T06:00:00Z', daysOpen: 0, slaDeadline: '2026-04-29T06:00:00Z', patchProgress: 0, environments: [{ name: 'dev', status: 'pending', progress: 0 }, { name: 'staging', status: 'pending', progress: 0 }, { name: 'prod', status: 'pending', progress: 0 }], recurrence: 2, assignee: 'Unassigned', notes: 'Multiple known vulnerabilities in current version' },
    { id: 'vl-005', title: 'XSS in User Dashboard', severity: 'low', stage: 'closed', cvssBase: 4.3, cvssTemporal: 4.0, cvssEnvironmental: 3.8, cve: 'CVE-2026-40123', component: 'dashboard-ui 3.2.0', discovered: '2026-04-01T14:00:00Z', daysOpen: 21, slaDeadline: '2026-04-15T14:00:00Z', patchProgress: 100, environments: [{ name: 'dev', status: 'verified', progress: 100 }, { name: 'staging', status: 'verified', progress: 100 }, { name: 'prod', status: 'verified', progress: 100 }], recurrence: 0, assignee: 'Dave Park', notes: 'Reflected XSS via unsanitized user input, fixed with input validation' },
  ];
  @state() private _vulnFilterStage: string = 'all';

  private _renderVulnLifecyclePipeline(): any {
    const stages = ['discovery', 'triage', 'patch', 'verify', 'closed'] as const;
    const stageColors: Record<string, string> = { discovery: '#f59e0b', triage: '#3b82f6', patch: '#8b5cf6', verify: '#06b6d4', closed: '#22c55e' };
    const filtered = this._vulnPipeline.filter(v => this._vulnFilterStage === 'all' || v.stage === this._vulnFilterStage);
    return html`
      <div style="padding:12px;background:#0a0c10;border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Vulnerability Lifecycle Pipeline</span>
          <div style="display:flex;gap:4px">
            ${stages.map(s => html`
              <button class="btn btn-sm" style="font-size:8px;background:${this._vulnFilterStage === s ? stageColors[s] : '#111827'};color:${this._vulnFilterStage === s ? '#000' : '#9ca3af'};border:1px solid ${stageColors[s]}"
                      @click=${() => { this._vulnFilterStage = this._vulnFilterStage === s ? 'all' : s; }}
              >${s} (${this._vulnPipeline.filter(v => v.stage === s).length})</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:4px;margin-bottom:10px;align-items:center">
          ${stages.map((s, i) => html`
            <span style="flex:1;text-align:center;font-size:8px;font-weight:600;color:${stageColors[s]};text-transform:uppercase;padding:3px;background:${stageColors[s]}22;border-radius:3px">${s}</span>
            ${i < stages.length - 1 ? html`<span style="color:#374151">→</span>` : nothing}
          `)}
        </div>
        ${filtered.map(v => html`
          <div style="padding:8px;background:#111827;border-radius:6px;margin-bottom:4px;border-left:3px solid ${stageColors[v.stage]}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div>
                <span style="font-weight:600;color:#e2e8f0;font-size:10px">${v.title}</span>
                <span style="color:#6b7280;font-size:9px;margin-left:6px">${v.cve}</span>
              </div>
              <div style="display:flex;gap:4px;align-items:center">
                <span class="tag" style="font-size:8px;background:${v.severity === 'critical' ? '#3b1f2a' : v.severity === 'high' ? '#3b2a1a' : v.severity === 'medium' ? '#3b3a1a' : '#1a3a2a'};color:${v.severity === 'critical' ? '#f87171' : v.severity === 'high' ? '#f59e0b' : v.severity === 'medium' ? '#fbbf24' : '#22c55e'}">${v.severity}</span>
                <span style="color:#6b7280;font-size:9px">${v.daysOpen}d open</span>
              </div>
            </div>
            <div style="font-size:9px;color:#6b7280;margin-top:3px">${v.component} | ${v.assignee}</div>
            <div style="display:flex;gap:6px;margin-top:4px;font-size:9px">
              <span style="color:#9ca3af">CVSS: <span style="color:#e2e8f0">${v.cvssBase}</span> / <span style="color:#60a5fa">${v.cvssTemporal}</span> / <span style="color:#22c55e">${v.cvssEnvironmental}</span></span>
              <span style="color:#6b7280">SLA: ${v.slaDeadline.split('T')[0]}</span>
              ${v.recurrence > 0 ? html`<span style="color:#f59e0b">Recurrence: ${v.recurrence}x</span>` : nothing}
            </div>
            <div style="display:flex;gap:4px;margin-top:4px">
              ${v.environments.map(env => html`
                <div style="flex:1;padding:3px;background:#0a0c10;border-radius:3px;text-align:center;font-size:8px">
                  <div style="color:#6b7280">${env.name}</div>
                  <div style="margin-top:2px;height:3px;background:#1f2937;border-radius:2px;overflow:hidden">
                    <div style="height:100%;width:${env.progress}%;background:${env.status === 'verified' ? '#22c55e' : env.status === 'patching' ? '#3b82f6' : env.status === 'failed' ? '#ef4444' : '#374151'};border-radius:2px"></div>
                  </div>
                  <div style="color:${env.status === 'verified' ? '#22c55e' : env.status === 'patching' ? '#3b82f6' : env.status === 'failed' ? '#ef4444' : '#6b7280'};margin-top:1px">${env.status}</div>
                </div>
              `)}
            </div>
          </div>
        `)}
      </div>`;
  }

  // === SECTION I: Custom Widget Builder ===
  @state() private _widgetBuilderOpen = false;
  @state() private _customWidgets: Array<{
    id: string; name: string; type: 'chart' | 'table' | 'metric' | 'status';
    dataSource: string; config: Record<string, any>; layout: string;
    shared: boolean; sharedWith: string[]; createdAt: string; updatedAt: string;
  }> = [
    { id: 'cw-001', name: 'Risk Trend Widget', type: 'chart', dataSource: 'risk-assessment', config: { chartType: 'line', xField: 'date', yField: 'score', colorScheme: 'red-to-green' }, layout: 'top-left', shared: true, sharedWith: ['risk-team', 'ciso-dashboard'], createdAt: '2026-03-15T10:00:00Z', updatedAt: '2026-04-20T14:00:00Z' },
    { id: 'cw-002', name: 'Alert Summary', type: 'metric', dataSource: 'alerts', config: { metric: 'count', aggregation: 'sum', threshold: 100, warningAt: 80 }, layout: 'top-right', shared: false, sharedWith: [], createdAt: '2026-03-20T09:00:00Z', updatedAt: '2026-04-22T08:00:00Z' },
    { id: 'cw-003', name: 'Compliance Status', type: 'status', dataSource: 'compliance', config: { controls: ['access-control', 'encryption', 'logging'], showPercentage: true }, layout: 'bottom-left', shared: true, sharedWith: ['compliance-team'], createdAt: '2026-04-01T11:00:00Z', updatedAt: '2026-04-21T16:00:00Z' },
    { id: 'cw-004', name: 'Finding Details Table', type: 'table', dataSource: 'findings', config: { columns: ['id', 'title', 'severity', 'status', 'assignee'], sortable: true, filterable: true, pageSize: 10 }, layout: 'bottom-right', shared: false, sharedWith: [], createdAt: '2026-04-10T13:00:00Z', updatedAt: '2026-04-22T09:00:00Z' },
  ];
  @state() private _widgetLayout: string = '2x2';
  @state() private _widgetPreviewId: string | null = null;
  @state() private _widgetNewType: string = 'chart';
  @state() private _widgetNewSource: string = '';
  @state() private _widgetNewName: string = '';

  private _renderCustomWidgetBuilder(): any {
    const layouts = ['2x2', '3x3', '1x4', 'freeform'];
    const typeIcons: Record<string, string> = { chart: '📈', table: '📊', metric: '🔢', status: '✅' };
    return html`
      <div style="padding:12px;background:#0a0c10;border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Custom Widget Builder</span>
          <div style="display:flex;gap:6px">
            <div style="display:flex;gap:2px">${layouts.map(l => html`
              <button class="btn btn-sm" style="font-size:8px;padding:2px 6px;background:${this._widgetLayout === l ? '#1e3a5f' : '#111827'};color:${this._widgetLayout === l ? '#60a5fa' : '#6b7280'};border:1px solid ${this._widgetLayout === l ? '#3b82f6' : '#374151'}"
                      @click=${() => { this._widgetLayout = l; }}>${l}</button>
            `)}</div>
            <button class="btn btn-sm" style="font-size:9px;background:#14532d;color:#22c55e" @click=${() => { this._widgetBuilderOpen = !this._widgetBuilderOpen; }}>+ New Widget</button>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2, 1fr);gap:6px;margin-bottom:8px">
          ${this._customWidgets.map(w => html`
            <div style="background:#111827;border-radius:6px;padding:8px;cursor:pointer;border:1px solid ${this._widgetPreviewId === w.id ? '#3b82f6' : '#1f2937'};min-height:80px"
                 @click=${() => { this._widgetPreviewId = this._widgetPreviewId === w.id ? null : w.id; }}>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-size:14px">${typeIcons[w.type] || '📦'}</span>
                <div style="display:flex;gap:3px">
                  ${w.shared ? html`<span style="color:#3b82f6;font-size:8px">↗ shared</span>` : nothing}
                  <button class="btn btn-sm" style="font-size:7px;padding:1px 4px">Edit</button>
                </div>
              </div>
              <div style="font-weight:600;color:#e2e8f0;font-size:10px">${w.name}</div>
              <div style="font-size:8px;color:#6b7280;margin-top:2px">${w.type} | ${w.dataSource} | ${w.layout}</div>
              ${this._widgetPreviewId === w.id ? html`
                <div style="margin-top:6px;padding-top:6px;border-top:1px solid #1f2937;font-size:8px;color:#9ca3af">
                  <div>Config: ${JSON.stringify(w.config).slice(0, 60)}...</div>
                  <div style="margin-top:2px">Created: ${w.createdAt.split('T')[0]} | Updated: ${w.updatedAt.split('T')[0]}</div>
                  ${w.shared && w.sharedWith.length > 0 ? html`<div style="margin-top:2px;color:#3b82f6">Shared with: ${w.sharedWith.join(', ')}</div>` : nothing}
                </div>
              ` : nothing}
            </div>
          `)}
        </div>
        ${this._widgetBuilderOpen ? html`
          <div style="background:#111827;border-radius:6px;padding:10px;border:1px solid #3b82f6">
            <div style="font-weight:600;font-size:11px;color:#e2e8f0;margin-bottom:8px">Create New Widget</div>
            <div style="display:flex;gap:8px;margin-bottom:6px">
              <input type="text" placeholder="Widget name" style="flex:1;background:#0a0c10;border:1px solid #374151;color:#e2e8f0;font-size:10px;padding:4px 6px;border-radius:3px"
                     .value=${this._widgetNewName} @input=${(e: any) => { this._widgetNewName = e.target.value; }} />
              <select style="background:#0a0c10;border:1px solid #374151;color:#9ca3af;font-size:10px;padding:4px 6px;border-radius:3px"
                      @change=${(e: any) => { this._widgetNewType = e.target.value; }}>
                <option value="chart">Chart</option><option value="table">Table</option>
                <option value="metric">Metric</option><option value="status">Status</option>
              </select>
            </div>
            <div style="margin-bottom:6px">
              <input type="text" placeholder="Data source (e.g., alerts, risk-assessment, compliance)" style="width:100%;background:#0a0c10;border:1px solid #374151;color:#e2e8f0;font-size:10px;padding:4px 6px;border-radius:3px"
                     .value=${this._widgetNewSource} @input=${(e: any) => { this._widgetNewSource = e.target.value; }} />
            </div>
            <div style="display:flex;gap:6px;justify-content:flex-end">
              <button class="btn btn-sm" style="font-size:9px" @click=${() => { this._widgetBuilderOpen = false; }} >Cancel</button>
              <button class="btn btn-sm" style="font-size:9px;background:#1e3a5f;color:#60a5fa" @click=${() => {
                if (this._widgetNewName && this._widgetNewSource) {
                  this._customWidgets.push({
                    id: 'cw-' + String(this._customWidgets.length + 1).padStart(3, '0'),
                    name: this._widgetNewName, type: this._widgetNewType as any,
                    dataSource: this._widgetNewSource, config: {},
                    layout: 'freeform', shared: false, sharedWith: [],
                    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
                  });
                  this._widgetNewName = ''; this._widgetNewSource = '';
                  this._widgetBuilderOpen = false;
                }
              }}>Create</button>
            </div>
          </div>
        ` : nothing}
      </div>`;
  }

  // === SECTION J: Audit & Compliance Trail ===
  @state() private _auditEntries: Array<{
    id: string; timestamp: string; action: string; category: 'policy-change' | 'access-grant' | 'config-modify' | 'incident-response' | 'compliance-check';
    user: string; resource: string; details: string; severity: 'info' | 'warning' | 'critical';
    previousHash: string; currentHash: string; verified: boolean;
    evidence: Array<{ type: string; reference: string; collectedAt: string }>;
    remediation: { status: 'open' | 'in-progress' | 'completed' | 'accepted-risk'; assignee: string; dueDate: string; notes: string } | null;
  }> = [
    { id: 'ae-001', timestamp: '2026-04-22T09:00:00Z', action: 'Firewall rule modified', category: 'config-modify', user: 'alice@corp.com', resource: 'fw-prod-01', details: 'Added allow rule for 10.0.0.0/8 to port 443', severity: 'warning', previousHash: 'a1b2c3d4', currentHash: 'e5f6g7h8', verified: true, evidence: [{ type: 'screenshot', reference: 'fw-rule-001.png', collectedAt: '2026-04-22T09:01:00Z' }, { type: 'log', reference: 'fw-audit-2026-04-22.log', collectedAt: '2026-04-22T09:02:00Z' }], remediation: { status: 'completed', assignee: 'alice@corp.com', dueDate: '2026-04-22T18:00:00Z', notes: 'Change approved by security lead' } },
    { id: 'ae-002', timestamp: '2026-04-22T08:30:00Z', action: 'Admin access granted', category: 'access-grant', user: 'admin@corp.com', resource: 'prod-database', details: 'Temporary admin access granted for incident investigation', severity: 'critical', previousHash: 'b2c3d4e5', currentHash: 'f6g7h8i9', verified: true, evidence: [{ type: 'ticket', reference: 'INC-2026-0442', collectedAt: '2026-04-22T08:25:00Z' }], remediation: { status: 'in-progress', assignee: 'bob@corp.com', dueDate: '2026-04-23T08:30:00Z', notes: 'Access to be revoked after investigation completes' } },
    { id: 'ae-003', timestamp: '2026-04-22T08:00:00Z', action: 'Compliance check passed', category: 'compliance-check', user: 'system', resource: 'soc2-controls', details: 'Quarterly SOC2 Type II controls assessment completed', severity: 'info', previousHash: 'c3d4e5f6', currentHash: 'g7h8i9j0', verified: true, evidence: [{ type: 'report', reference: 'soc2-q2-2026.pdf', collectedAt: '2026-04-22T08:05:00Z' }, { type: 'evidence-package', reference: 'evidence-soc2-q2.zip', collectedAt: '2026-04-22T08:10:00Z' }], remediation: null },
    { id: 'ae-004', timestamp: '2026-04-21T16:00:00Z', action: 'Security policy updated', category: 'policy-change', user: 'ciso@corp.com', resource: 'password-policy', details: 'Minimum password length increased from 12 to 14 characters', severity: 'info', previousHash: 'd4e5f6g7', currentHash: 'h8i9j0k1', verified: true, evidence: [{ type: 'diff', reference: 'policy-diff-2026-04-21.txt', collectedAt: '2026-04-21T16:05:00Z' }], remediation: { status: 'completed', assignee: 'ciso@corp.com', dueDate: '2026-04-21T18:00:00Z', notes: 'Policy approved by board' } },
  ];
  @state() private _auditFilterCategory: string = 'all';
  @state() private _auditHashChainValid = true;

  private _renderAuditComplianceTrail(): any {
    const categories = ['policy-change', 'access-grant', 'config-modify', 'incident-response', 'compliance-check'] as const;
    const catIcons: Record<string, string> = { 'policy-change': '📋', 'access-grant': '🔑', 'config-modify': '⚙️', 'incident-response': '🚨', 'compliance-check': '✅' };
    const filtered = this._auditEntries.filter(e => this._auditFilterCategory === 'all' || e.category === this._auditFilterCategory);
    return html`
      <div style="padding:12px;background:#0a0c10;border-radius:8px;margin-bottom:8px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Audit & Compliance Trail</span>
          <div style="display:flex;gap:4px;align-items:center">
            <span style="font-size:9px;color:${this._auditHashChainValid ? '#22c55e' : '#ef4444'}">${this._auditHashChainValid ? '● Chain Valid' : '✕ Chain Broken'}</span>
            <button class="btn btn-sm" style="font-size:8px;background:#1e3a5f;color:#60a5fa">Generate Report</button>
          </div>
        </div>
        <div style="display:flex;gap:3px;margin-bottom:8px;flex-wrap:wrap">
          <button class="btn btn-sm" style="font-size:8px;padding:2px 5px;background:${this._auditFilterCategory === 'all' ? '#1e3a5f' : '#111827'};color:${this._auditFilterCategory === 'all' ? '#60a5fa' : '#6b7280'}"
                  @click=${() => { this._auditFilterCategory = 'all'; }}>All (${this._auditEntries.length})</button>
          ${categories.map(c => html`
            <button class="btn btn-sm" style="font-size:8px;padding:2px 5px;background:${this._auditFilterCategory === c ? '#1e3a5f' : '#111827'};color:${this._auditFilterCategory === c ? '#60a5fa' : '#6b7280'}"
                    @click=${() => { this._auditFilterCategory = this._auditFilterCategory === c ? 'all' : c; }}>${catIcons[c]} ${c} (${this._auditEntries.filter(e => e.category === c).length})</button>
          `)}
        </div>
        ${filtered.map(entry => html`
          <div style="padding:6px 8px;background:#111827;border-radius:4px;margin-bottom:3px;border-left:3px solid ${entry.severity === 'critical' ? '#ef4444' : entry.severity === 'warning' ? '#f59e0b' : '#374151'}">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <div style="display:flex;align-items:center;gap:4px">
                <span style="font-size:11px">${catIcons[entry.category]}</span>
                <span style="font-weight:600;color:#e2e8f0;font-size:10px">${entry.action}</span>
              </div>
              <span style="color:#6b7280;font-size:8px">${entry.timestamp.split('T')[1]?.slice(0, 5) || ''}</span>
            </div>
            <div style="font-size:9px;color:#6b7280;margin-top:2px">${entry.user} → ${entry.resource} | ${entry.details}</div>
            <div style="display:flex;gap:8px;margin-top:3px;font-size:8px;align-items:center">
              <span style="color:${entry.verified ? '#22c55e' : '#ef4444'}">${entry.verified ? '✓ Verified' : '✕ Unverified'}</span>
              <span style="color:#4b5563;font-family:monospace">hash: ${entry.currentHash}</span>
              <span style="color:#6b7280">${entry.evidence.length} evidence items</span>
            </div>
            ${entry.remediation ? html`
              <div style="margin-top:3px;padding:3px 6px;background:#0a0c10;border-radius:3px;font-size:8px">
                <span style="color:${entry.remediation.status === 'completed' ? '#22c55e' : entry.remediation.status === 'in-progress' ? '#3b82f6' : entry.remediation.status === 'accepted-risk' ? '#f59e0b' : '#ef4444'}">Remediation: ${entry.remediation.status}</span>
                <span style="color:#6b7280;margin-left:6px">${entry.remediation.assignee} | Due: ${entry.remediation.dueDate.split('T')[0]}</span>
                <span style="color:#9ca3af;margin-left:6px">${entry.remediation.notes}</span>
              </div>
            ` : nothing}
          </div>
        `)}
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
  @state() private _tmAle: number = 0;
  @state() private _tmSroi: number = 0;
  @state() private _tmCpi: number = 0;
  @state() private _tmBudgetAlloc: number = 0;
  @state() private _tmCostBenefit: number = 0;

  // Security Economics Calculator
  private tmInitEconomics() {
    this._tmAle = Math.round(2850000 + Math.random() * 4500000);
    this._tmSroi = Math.round(180 + Math.random() * 320);
    this._tmCpi = Math.round(45000 + Math.random() * 120000);
    this._tmBudgetAlloc = Math.round(2500000 + Math.random() * 3000000);
    this._tmCostBenefit = Math.round(220 + Math.random() * 180);
  }

  private _tmCalcAle(): { annual: number; perIncident: number; byCategory: Array<{name: string; value: number}> } {
    const base = this._tmAle;
    const categories = [
      { name: "Data Breach", value: Math.round(base * 0.35) },
      { name: "Ransomware", value: Math.round(base * 0.25) },
      { name: "Insider Threat", value: Math.round(base * 0.18) },
      { name: "Business Disruption", value: Math.round(base * 0.12) },
      { name: "Regulatory Fines", value: Math.round(base * 0.10) }
    ];
    return { annual: base, perIncident: Math.round(base / (3 + Math.floor(Math.random() * 8))), byCategory: categories };
  }

  private _tmCalcSroi(): Array<{year: number; investment: number; savings: number; roi: number}> {
    const baseInv = this._tmSroi * 10000;
    const projections: Array<{year: number; investment: number; savings: number; roi: number}> = [];
    for (let i = 1; i <= 5; i++) {
      const inv = Math.round(baseInv * (1 + 0.08 * i));
      const savings = Math.round(inv * (0.6 + i * 0.25));
      projections.push({ year: 2026 + i, investment: inv, savings, roi: Math.round((savings - inv) / inv * 100) });
    }
    return projections;
  }

  private _tmGetBudgetAlloc(): Array<{category: string; amount: number; pct: number; trend: string}> {
    const total = this._tmBudgetAlloc;
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

  private _tmGetCostBenefit(): Array<{control: string; cost: number; benefit: number; ratio: number; priority: string}> {
    const base = this._tmCostBenefit;
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

  private _tmRenderEconomics() {
    const ale = this._tmCalcAle();
    const roi = this._tmCalcSroi();
    const budget = this._tmGetBudgetAlloc();
    const cb = this._tmGetCostBenefit();
    const cpi = this._tmCpi;
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

  @state() private _tmThreatLevel: any = null;
  @state() private _tmEmergingThreats: any = null;
  @state() private _tmThreatTrends: any = null;
  @state() private _tmSectorRadar: any = null;
  @state() private _tmActorActivity: any = null;

  // Threat Landscape Intelligence
  private tmInitThreatIntel() {
    this._tmThreatLevel = {
      americas: Math.round(50 + Math.random() * 40),
      europe: Math.round(40 + Math.random() * 45),
      asiaPacific: Math.round(55 + Math.random() * 35),
      middleEast: Math.round(45 + Math.random() * 50),
      africa: Math.round(30 + Math.random() * 40)
    };
    this._tmEmergingThreats = [
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
    this._tmThreatTrends = [
      { month: "Jan", phishing: 142, malware: 89, ransomware: 34 },
      { month: "Feb", phishing: 158, malware: 95, ransomware: 38 },
      { month: "Mar", phishing: 175, malware: 102, ransomware: 42 },
      { month: "Apr", phishing: 163, malware: 98, ransomware: 39 }
    ];
    this._tmSectorRadar = [
      { sector: "Financial", risk: 82, trend: "up" },
      { sector: "Healthcare", risk: 78, trend: "up" },
      { sector: "Technology", risk: 71, trend: "stable" },
      { sector: "Government", risk: 85, trend: "up" },
      { sector: "Energy", risk: 68, trend: "down" }
    ];
    this._tmActorActivity = [
      { actor: "APT-29", country: "Russia", activity: 85, targets: "Government" },
      { actor: "Lazarus", country: "DPRK", activity: 72, targets: "Financial" },
      { actor: "APT-41", country: "China", activity: 68, targets: "Technology" },
      { actor: "Fancy Bear", country: "Russia", activity: 64, targets: "Healthcare" },
      { actor: "Charming Kitten", country: "Iran", activity: 58, targets: "Energy" }
    ];
  }

  private _tmRenderThreatIntel() {
    const tl = this._tmThreatLevel;
    const et = this._tmEmergingThreats;
    const sr = this._tmSectorRadar;
    const aa = this._tmActorActivity;
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

  @state() private _tmPolicies: any = null;
  @state() private _tmExceptions: any = null;
  @state() private _tmRiskRegister: any = null;
  @state() private _tmMeetings: any = null;
  @state() private _tmDeadlines: any = null;

  // Security Governance Dashboard
  private tmInitGovernance() {
    this._tmPolicies = [
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
    this._tmExceptions = [
      { id: "EXC-001", policy: "Access Control", reason: "Legacy system", risk: "Medium", expiry: "2026-06-30" },
      { id: "EXC-002", policy: "Encryption", reason: "Performance", risk: "High", expiry: "2026-05-15" },
      { id: "EXC-003", policy: "Password Policy", reason: "Vendor req", risk: "Low", expiry: "2026-08-01" }
    ];
    this._tmRiskRegister = [
      { id: "RSK-001", desc: "Unpatched Exchange", likelihood: 4, impact: 5, owner: "IT Ops" },
      { id: "RSK-002", desc: "Shadow IT SaaS", likelihood: 3, impact: 4, owner: "CISO" },
      { id: "RSK-003", desc: "Privileged Access Creep", likelihood: 3, impact: 5, owner: "IAM Team" },
      { id: "RSK-004", desc: "DR Plan Gaps", likelihood: 2, impact: 5, owner: "BCP Lead" },
      { id: "RSK-005", desc: "Vendor Data Sharing", likelihood: 3, impact: 3, owner: "Legal" }
    ];
    this._tmMeetings = [
      { name: "Security Steering", date: "2026-04-25", attendees: 8, status: "Scheduled" },
      { name: "Risk Committee", date: "2026-04-18", attendees: 6, status: "Completed" },
      { name: "Audit Review", date: "2026-05-02", attendees: 5, status: "Pending" }
    ];
    this._tmDeadlines = [
      { regulation: "SOC 2 Type II", deadline: "2026-06-15", daysLeft: 53, status: "On Track" },
      { regulation: "GDPR Annual Review", deadline: "2026-05-25", daysLeft: 32, status: "At Risk" },
      { regulation: "ISO 27001 Audit", deadline: "2026-07-20", daysLeft: 88, status: "On Track" },
      { regulation: "PCI DSS v4.0", deadline: "2026-08-30", daysLeft: 129, status: "Planning" }
    ];
  }

  private _tmRenderGovernance() {
    const policies = this._tmPolicies;
    const risks = this._tmRiskRegister;
    const deadlines = this._tmDeadlines;
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

  @state() private _tmCriticalAssets: any = null;
  @state() private _tmAssetDeps: any = null;
  @state() private _tmEolAssets: any = null;
  @state() private _tmAssetRisk: any = null;

  // Asset Intelligence
  private tmInitAssetIntel() {
    this._tmCriticalAssets = [
      { name: "Core Banking DB", type: "Database", impact: "Critical", risk: 85, owner: "DBA Team" },
      { name: "Customer API Gateway", type: "Service", impact: "Critical", risk: 72, owner: "Platform" },
      { name: "Active Directory", type: "Infrastructure", impact: "Critical", risk: 68, owner: "IAM" },
      { name: "Data Warehouse", type: "Database", impact: "High", risk: 55, owner: "Analytics" },
      { name: "Email Server", type: "Application", impact: "High", risk: 48, owner: "IT Ops" },
      { name: "CI/CD Pipeline", type: "DevOps", impact: "High", risk: 62, owner: "DevOps" },
      { name: "Payment Processor", type: "Service", impact: "Critical", risk: 78, owner: "Finance IT" }
    ];
    this._tmAssetDeps = [
      { from: "Web App", to: "API Gateway", type: "depends" },
      { from: "API Gateway", to: "Core Banking DB", type: "depends" },
      { from: "API Gateway", to: "Auth Service", type: "depends" },
      { from: "Auth Service", to: "Active Directory", type: "depends" },
      { from: "Payment Processor", to: "Core Banking DB", type: "depends" },
      { from: "Mobile App", to: "API Gateway", type: "depends" }
    ];
    this._tmEolAssets = [
      { name: "Windows Server 2012 R2", count: 12, eolDate: "2023-10-10", risk: "Critical" },
      { name: "Oracle 11g", count: 3, eolDate: "2025-12-31", risk: "High" },
      { name: "Cisco ASA 5505", count: 8, eolDate: "2024-07-15", risk: "High" },
      { name: "CentOS 7", count: 25, eolDate: "2024-06-30", risk: "Medium" }
    ];
    this._tmAssetRisk = { critical: 7, high: 23, medium: 45, low: 128, total: 203 };
  }

  private _tmRenderAssetIntel() {
    const assets = this._tmCriticalAssets;
    const eol = this._tmEolAssets;
    const ar = this._tmAssetRisk;
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

  @state() private _tmUserBaseline: any = null;
  @state() private _tmAnomalyRules: any = null;
  @state() private _tmDataAccess: any = null;
  @state() private _tmInsiderRisk: any = null;
  @state() private _trainir15Timeline: Array<{id:string;time:string;event:string;severity:string;actor:string}> = [
    {id:'t1',time:'2026-01-15 08:23',event:'Anomalous login detected from external IP',severity:'high',actor:'unknown'},
    {id:'t2',time:'2026-01-15 08:45',event:'Privilege escalation via misconfigured service account',severity:'critical',actor:'SA-deploy-01'},
    {id:'t3',time:'2026-01-15 09:12',event:'Data exfiltration to external cloud storage',severity:'critical',actor:'SA-deploy-01'},
    {id:'t4',time:'2026-01-15 09:30',event:'Incident response team notified',severity:'medium',actor:'SOC Team'},
    {id:'t5',time:'2026-01-15 10:15',event:'Affected service account disabled',severity:'low',actor:'IR Lead'},
  ];
  @state() private _trainir15RootCauses: Array<{why:string;answer:string}> = [
    {why:'Why was the login anomalous?',answer:'Credentials leaked via phishing email to IT admin'},
    {why:'Why was the phishing successful?',answer:'Email filter rules were too permissive for internal domains'},
    {why:'Why were rules misconfigured?',answer:'Change review process skipped for emergency rule update'},
    {why:'Why was the review skipped?',answer:'No automated enforcement of review policy for rule changes'},
    {why:'Why no automated enforcement?',answer:'Policy-as-code implementation backlog for 6 months'},
  ];
  @state() private _trainir15ImpactMatrix: Array<{system:string;users:number;data:string;revenue:string;status:string}> = [
    {system:'Customer Database',users:12400,data:'PII of all customers',revenue:'$2.4M/day',status:'contained'},
    {system:'Payment Gateway',users:8900,data:'Tokenized payment records',revenue:'$1.8M/day',status:'unaffected'},
    {system:'HR Portal',users:3200,data:'Employee PII and payroll',revenue:'N/A',status:'investigating'},
    {system:'API Gateway',users:45000,data:'Auth tokens and API keys',revenue:'$5.1M/day',status:'contained'},
  ];
  @state() private _trainir15Actions: Array<{id:string;item:string;owner:string;deadline:string;priority:string;status:string}> = [
    {id:'a1',item:'Rotate all service account credentials',owner:'DevOps Team',deadline:'2026-01-18',priority:'critical',status:'in_progress'},
    {id:'a2',item:'Implement email filter policy-as-code',owner:'Email Admin',deadline:'2026-01-22',priority:'high',status:'pending'},
    {id:'a3',item:'Deploy automated change review enforcement',owner:'Platform Team',deadline:'2026-01-25',priority:'high',status:'pending'},
    {id:'a4',item:'Conduct phishing awareness refresher',owner:'Security Awareness',deadline:'2026-01-20',priority:'medium',status:'assigned'},
    {id:'a5',item:'Review and update incident response playbook',owner:'IR Team',deadline:'2026-01-30',priority:'low',status:'pending'},
  ];
  @state() private _trainir15Lessons: Array<{id:string;lesson:string;category:string;severity:string;applies_to:string}> = [
    {id:'l1',lesson:'Service accounts must have MFA enabled regardless of automation needs',category:'Identity',severity:'high',applies_to:'All service accounts'},
    {id:'l2',lesson:'Emergency changes still require post-incident review within 24 hours',category:'Process',severity:'high',applies_to:'All infrastructure changes'},
    {id:'l3',lesson:'Email filter rules must be version controlled and peer reviewed',category:'Email Security',severity:'medium',applies_to:'Email infrastructure'},
    {id:'l4',lesson:'Data exfiltration detection latency must be under 5 minutes',category:'Monitoring',severity:'medium',applies_to:'DLP systems'},
  ];
  @state() private _trainir15ActiveTab: string = 'timeline';
  @state() private _trainir15Benchmarks: Array<{metric:string;current:number;industry:number;target:number;unit:string;source:string}> = [
    {metric:'Mean Time to Detect',current:4.2,industry:6.8,target:3.0,unit:'hours',source:'SANS 2026'},
    {metric:'Mean Time to Respond',current:2.1,industry:4.5,target:1.0,unit:'hours',source:'SANS 2026'},
    {metric:'Patch Compliance',current:87,industry:72,target:95,unit:'%',source:'CIS Benchmark'},
    {metric:'Vuln Remediation SLA',current:78,industry:65,target:90,unit:'%',source:'Gartner'},
    {metric:'Phishing Click Rate',current:3.2,industry:12.5,target:2.0,unit:'%',source:'KnowBe4'},
    {metric:'MFA Coverage',current:94,industry:68,target:100,unit:'%',source:'CIS Controls'},
  ];
  @state() private _trainir15MaturityLevels: Array<{domain:string;current:number;target:number;description:string}> = [
    {domain:'Identity and Access',current:4,target:5,description:'Strong MFA, automated provisioning, JIT access'},
    {domain:'Network Security',current:3,target:4,description:'Micro-segmentation partial, ZTNA in progress'},
    {domain:'Data Protection',current:3,target:4,description:'DLP deployed, encryption at rest in progress'},
    {domain:'Vulnerability Mgmt',current:4,target:5,description:'Automated scanning, risk-based prioritization'},
    {domain:'Incident Response',current:3,target:4,description:'Playbooks defined, automation growing'},
    {domain:'Governance and Risk',current:3,target:4,description:'Framework aligned, continuous monitoring building'},
  ];
  @state() private _trainir15QuarterlyData: Array<{quarter:string;score:number;improvement:number}> = [
    {quarter:'Q1 2025',score:62,improvement:0},{quarter:'Q2 2025',score:67,improvement:5},
    {quarter:'Q3 2025',score:71,improvement:4},{quarter:'Q4 2025',score:74,improvement:3},
    {quarter:'Q1 2026',score:78,improvement:4},
  ];
  @state() private _trainir15SelectedDomain: string = 'all';
  @state() private _trainir15Alerts: Array<{id:string;name:string;severity:number;confidence:number;assetCrit:number;score:number;enriched:boolean;group:string;status:string;enrichData:Array<{key:string;value:string}>}> = [
    {id:'al1',name:'Brute force login attempt on prod-db',severity:5,confidence:0.9,assetCrit:5,score:0,enriched:true,group:'auth',status:'triaged',enrichData:[{key:'Source IP',value:'203.0.113.42'},{key:'Country',value:'Russia'},{key:'Threat Intel',value:'Known APT IP'}]},
    {id:'al2',name:'Unusual data transfer to external endpoint',severity:4,confidence:0.7,assetCrit:4,score:0,enriched:true,group:'exfil',status:'escalated',enrichData:[{key:'Destination',value:'s3-eu-west.amazonaws.com'},{key:'Volume',value:'2.4 GB in 30 min'},{key:'Reputation',value:'Neutral'}]},
    {id:'al3',name:'Privilege escalation attempt detected',severity:5,confidence:0.85,assetCrit:5,score:0,enriched:false,group:'auth',status:'new',enrichData:[]},
    {id:'al4',name:'Suspicious PowerShell execution',severity:3,confidence:0.5,assetCrit:3,score:0,enriched:false,group:'host',status:'new',enrichData:[]},
    {id:'al5',name:'Failed SSL certificate validation',severity:2,confidence:0.95,assetCrit:2,score:0,enriched:true,group:'net',status:'dismissed',enrichData:[{key:'Host',value:'api.internal.corp'},{key:'Expiry',value:'2026-01-10'}]},
  ];
  @state() private _trainir15QualityMetrics: {fpRate:number;enrichSuccess:number;avgTriageTime:number;enrichedCount:number;totalCount:number} = {fpRate:0.12, enrichSuccess:0.78, avgTriageTime:4.5, enrichedCount:3, totalCount:5};
  @state() private _trainir15RoutingRules: Array<{name:string;condition:string;channel:string;active:boolean}> = [
    {name:'Critical Asset Alert',condition:'asset_criticality >= 5 && severity >= 4',channel:'SOC Phone Bridge',active:true},
    {name:'Data Exfiltration',condition:'group == exfil && severity >= 3',channel:'IR Slack Channel',active:true},
    {name:'Authentication Anomaly',condition:'group == auth && confidence >= 0.8',channel:'SOC Dashboard',active:true},
    {name:'Low Priority Host',condition:'severity <= 2 && asset_criticality <= 2',channel:'Email Digest',active:false},
  ];
  @state() private _trainir15Shapes: Array<{id:string;type:string;label:string;controls:string[]}> = [
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
  @state() private _trainir15TrustBoundaries: Array<{from:string;to:string;label:string;strength:string}> = [
    {from:'sh1',to:'sh4',label:'External Boundary',strength:'strong'},
    {from:'sh2',to:'sh5',label:'Data Boundary',strength:'strong'},
    {from:'sh3',to:'sh6',label:'Identity Boundary',strength:'medium'},
    {from:'sh7',to:'sh8',label:'Build Boundary',strength:'weak'},
  ];
  @state() private _trainir15ADRs: Array<{id:string;title:string;status:string;date:string;decision:string}> = [
    {id:'adr-001',title:'Adopt Zero Trust Network Architecture',status:'accepted',date:'2025-11-15',decision:'Replace VPN with ZTNA for all remote access'},
    {id:'adr-002',title:'Implement Service Mesh for East-West Traffic',status:'proposed',date:'2026-01-10',decision:'Deploy Istio with mTLS for all internal service communication'},
    {id:'adr-003',title:'Consolidate SIEM to Single Platform',status:'accepted',date:'2025-09-20',decision:'Migrate from Splunk+QRadar to unified Elastic SIEM'},
    {id:'adr-004',title:'Enforce Policy-as-Code for All Infrastructure',status:'in_review',date:'2026-02-01',decision:'Use Open Policy Agent for admission control and compliance checks'},
  ];
  @state() private _trainir15SelectedShape: string = '';
  @state() private _trainir15Gauges: Array<{name:string;value:number;max:number;unit:string;status:string;color:string}> = [
    {name:'API Response Time',value:142,max:500,unit:'ms',status:'healthy',color:'#4f4'},
    {name:'Error Rate',value:0.3,max:5,unit:'%',status:'healthy',color:'#4f4'},
    {name:'CPU Utilization',value:67,max:100,unit:'%',status:'warning',color:'#fa0'},
    {name:'Memory Usage',value:4.2,max:8,unit:'GB',status:'healthy',color:'#4f4'},
    {name:'Active Connections',value:1247,max:2000,unit:'',status:'healthy',color:'#4f4'},
    {name:'Queue Depth',value:342,max:500,unit:'',status:'warning',color:'#fa0'},
  ];
  @state() private _trainir15Anomalies: Array<{id:string;time:string;description:string;severity:string;acknowledged:boolean}> = [
    {id:'an1',time:'10:42:15',description:'Spike in failed authentication attempts from 10.0.0.0/8',severity:'high',acknowledged:false},
    {id:'an2',time:'10:38:22',description:'Unusual data transfer volume on DB replication channel',severity:'medium',acknowledged:true},
    {id:'an3',time:'10:25:07',description:'Certificate expiry warning for api.internal.corp (7 days)',severity:'low',acknowledged:false},
    {id:'an4',time:'10:12:44',description:'DNS query pattern matches DGA domain characteristics',severity:'high',acknowledged:false},
  ];
  @state() private _trainir15Integrations: Array<{name:string;status:string;uptime:number;lastCheck:string;latency:number}> = [
    {name:'SIEM Connector',status:'online',uptime:99.97,lastCheck:'10:45:00',latency:12},
    {name:'EDR Feed',status:'online',uptime:99.95,lastCheck:'10:45:00',latency:45},
    {name:'Threat Intel API',status:'degraded',uptime:98.2,lastCheck:'10:44:30',latency:230},
    {name:'Cloud Provider API',status:'online',uptime:99.99,lastCheck:'10:45:00',latency:8},
    {name:'Email Gateway',status:'online',uptime:99.98,lastCheck:'10:45:00',latency:15},
  ];
  @state() private _trainir15AlertFatigue: Array<{analyst:string;alertsPerDay:number;escalated:number;dismissed:number;avgResponseMin:number}> = [
    {analyst:'Alice Chen',alertsPerDay:45,escalated:8,dismissed:12,avgResponseMin:3.2},
    {analyst:'Bob Martinez',alertsPerDay:62,escalated:11,dismissed:18,avgResponseMin:5.1},
    {analyst:'Carol Kim',alertsPerDay:38,escalated:5,dismissed:10,avgResponseMin:2.8},
    {analyst:'Dave Wilson',alertsPerDay:71,escalated:14,dismissed:22,avgResponseMin:6.4},
  ];
  @state() private _trainir15SlaTarget: number = 99.9;

  // Insider Threat Detection
  private tmInitInsiderThreat() {
    this._tmUserBaseline = [
      { user: "admin_jdoe", avgLogins: 18, avgFiles: 45, avgNetwork: 2.3, riskScore: 12 },
      { user: "dev_ssmith", avgLogins: 22, avgFiles: 120, avgNetwork: 5.1, riskScore: 25 },
      { user: "mgr_jchen", avgLogins: 8, avgFiles: 30, avgNetwork: 1.2, riskScore: 8 },
      { user: "analyst_mlee", avgLogins: 15, avgFiles: 85, avgNetwork: 3.4, riskScore: 18 },
      { user: "contractor_abrown", avgLogins: 12, avgFiles: 200, avgNetwork: 8.7, riskScore: 42 }
    ];
    this._tmAnomalyRules = [
      { rule: "After-hours access", enabled: true, triggers: 3, severity: "Medium" },
      { rule: "Mass download detection", enabled: true, triggers: 1, severity: "Critical" },
      { rule: "Privilege escalation", enabled: true, triggers: 0, severity: "High" },
      { rule: "Unusual data transfer", enabled: true, triggers: 5, severity: "High" },
      { rule: "Account sharing pattern", enabled: false, triggers: 2, severity: "Medium" },
      { rule: "Departure data spike", enabled: true, triggers: 0, severity: "Critical" }
    ];
    this._tmDataAccess = [
      { resource: "Customer PII DB", accesses: 1245, anomalous: 18, trend: "up" },
      { resource: "Financial Reports", accesses: 832, anomalous: 5, trend: "stable" },
      { resource: "Source Code Repo", accesses: 2100, anomalous: 32, trend: "up" },
      { resource: "Trade Secrets", accesses: 156, anomalous: 8, trend: "up" }
    ];
    this._tmInsiderRisk = { totalUsers: 2847, monitored: 342, flagged: 18, investigated: 5, confirmed: 1 };
  }

  private _tmRenderInsiderThreat() {
    const baseline = this._tmUserBaseline;
    const rules = this._tmAnomalyRules;
    const ir = this._tmInsiderRisk;
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
              <button class="btn ${this._trainir15ActiveTab === t ? 'btn-primary' : ''}" style="font-size:10px;padding:3px 8px" @click=${() => { this._trainir15ActiveTab = t; }}>${t.charAt(0).toUpperCase() + t.slice(1)}</button>
            `)}
          </div>
          ${this._trainir15ActiveTab === 'timeline' ? html`
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._trainir15Timeline.map(e => html`
                <div style="display:flex;gap:8px;align-items:flex-start;padding:6px;background:#1a1d27;border-radius:4px;border-left:3px solid ${e.severity === 'critical' ? '#f44' : e.severity === 'high' ? '#fa0' : e.severity === 'medium' ? '#ff0' : '#4f4'}">
                  <span style="color:#888;font-size:10px;min-width:110px">${e.time}</span>
                  <span style="color:#ddd;font-size:11px;flex:1">${e.event}</span>
                  <span style="color:#888;font-size:10px">${e.actor}</span>
                </div>
              `)}
            </div>
          ` : this._trainir15ActiveTab === 'rootcause' ? html`
            <div style="margin-bottom:8px">${{__html: this._trainir15RenderFishbone()}}</div>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._trainir15RootCauses.map((rc, i) => html`
                <div style="display:flex;gap:8px;align-items:flex-start;padding:6px;background:#1a1d27;border-radius:4px">
                  <span style="color:#4a9eff;font-size:10px;min-width:20px">${i + 1}.</span>
                  <div style="flex:1"><div style="color:#aaa;font-size:10px">${rc.why}</div><div style="color:#ddd;font-size:11px">${rc.answer}</div></div>
                </div>
              `)}
            </div>
          ` : this._trainir15ActiveTab === 'impact' ? html`
            <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:10px">
              <thead><tr style="color:#888"><th style="text-align:left;padding:4px">System</th><th style="padding:4px">Users</th><th style="text-align:left;padding:4px">Data</th><th style="padding:4px">Revenue</th><th style="padding:4px">Status</th></tr></thead>
              <tbody>${this._trainir15ImpactMatrix.map(imp => html`
                <tr style="border-top:1px solid #2a2d37"><td style="padding:4px;color:#ddd">${imp.system}</td><td style="padding:4px;color:#aaa;text-align:center">${imp.users.toLocaleString()}</td><td style="padding:4px;color:#aaa">${imp.data}</td><td style="padding:4px;color:#fa0;text-align:center">${imp.revenue}</td><td style="padding:4px"><span style="color:${imp.status === 'contained' ? '#4f4' : imp.status === 'investigating' ? '#fa0' : '#f44'};font-size:9px;padding:2px 6px;background:${imp.status === 'contained' ? 'rgba(0,255,0,0.1)' : imp.status === 'investigating' ? 'rgba(255,170,0,0.1)' : 'rgba(255,0,0,0.1)'};border-radius:3px">${imp.status}</span></td></tr>
              `)}</tbody>
            </table></div>
          ` : this._trainir15ActiveTab === 'actions' ? html`
            <div style="display:flex;gap:12px;margin-bottom:8px;font-size:10px;color:#888">
              ${Object.entries(this._trainir15GetActionStats()).map(([k,v]) => html`<span>${k}: <b style="color:#ddd">${v}</b></span>`)}
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._trainir15Actions.map(a => html`
                <div style="display:flex;gap:8px;align-items:center;padding:6px;background:#1a1d27;border-radius:4px;cursor:pointer" @click=${() => this._trainir15ToggleAction(a.id)}>
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
              ${this._trainir15Lessons.map(l => html`
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
            ${['all', ...this._trainir15MaturityLevels.map(m => m.domain)].map(d => html`
              <button class="btn ${this._trainir15SelectedDomain === d ? 'btn-primary' : ''}" style="font-size:9px;padding:2px 6px" @click=${() => { this._trainir15SelectedDomain = d; }}>${d}</button>
            `)}
          </div>
          <div style="display:flex;gap:16px;margin-bottom:10px">
            <div style="text-align:center"><div style="color:#e0e0e0;font-size:20px;font-weight:bold">${this._trainir15GetOverallMaturity()}/5</div><div style="color:#888;font-size:10px">Maturity Level</div></div>
            <div style="text-align:center"><div style="color:#4f4;font-size:20px;font-weight:bold">${this._trainir15GetGapAnalysis().filter(g => g.isAbove).length}/${this._trainir15Benchmarks.length}</div><div style="color:#888;font-size:10px">Above Industry</div></div>
          </div>
          <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead><tr style="color:#888"><th style="text-align:left;padding:3px">Metric</th><th style="padding:3px">Current</th><th style="padding:3px">Industry</th><th style="padding:3px">Target</th><th style="padding:3px">Gap</th><th style="padding:3px">Source</th></tr></thead>
            <tbody>${this._trainir15GetGapAnalysis().map(b => html`
              <tr style="border-top:1px solid #2a2d37"><td style="padding:3px;color:#ddd">${b.metric}</td><td style="padding:3px;color:#e0e0e0;text-align:center;font-weight:bold">${b.current}${b.unit}</td><td style="padding:3px;color:#888;text-align:center">${b.industry}${b.unit}</td><td style="padding:3px;color:#4a9eff;text-align:center">${b.target}${b.unit}</td><td style="padding:3px;text-align:center;color:${b.isAbove ? '#4f4' : '#fa0'}">${b.isAbove ? '+' : ''}${b.gap.toFixed(1)}</td><td style="padding:3px;color:#666;font-size:9px">${b.source}</td></tr>
            `)}</tbody>
          </table></div>
          <div style="margin-top:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Maturity by Domain</div>
            ${this._trainir15MaturityLevels.filter(m => this._trainir15SelectedDomain === 'all' || m.domain === this._trainir15SelectedDomain).map(m => html`
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
                <span style="color:#aaa;font-size:10px;min-width:100px">${m.domain}</span>
                <div style="flex:1;background:#1a1d27;border-radius:3px;height:8px;overflow:hidden"><div style="height:100%;width:${m.current * 20}%;background:${m.current >= 4 ? '#4f4' : m.current >= 3 ? '#fa0' : '#f44'};border-radius:3px"></div></div>
                <span style="color:#ddd;font-size:10px;min-width:40px">${m.current}/5</span>
              </div>
            `)}
          </div>
          <div style="margin-top:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Quarterly Trend</div>
            <div style="display:flex;height:40px;align-items:flex-end;gap:4px">
              ${this._trainir15QuarterlyData.map(q => html`<div style="flex:1;text-align:center"><div style="background:#4a9eff;height:${q.score * 0.5}px;border-radius:2px 2px 0 0" title="${q.score}"></div><div style="color:#666;font-size:8px;margin-top:2px">${q.quarter}</div></div>`)}
            </div>
          </div>
        </div>

        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Alert Triage and Enrichment</h4>
          <div style="display:flex;gap:12px;margin-bottom:8px;font-size:10px">
            <div style="display:flex;gap:4px;flex-wrap:wrap">${this._trainir15GroupAlerts().map(g => html`<span style="color:#888;padding:2px 6px;background:#1a1d27;border-radius:3px">${g.group}: ${g.count}</span>`)}</div>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:8px;font-size:10px;color:#888">
            <span>FP Rate: <b style="color:${this._trainir15QualityMetrics.fpRate > 0.15 ? '#f44' : '#4f4'}">${(this._trainir15QualityMetrics.fpRate * 100).toFixed(1)}%</b></span>
            <span>Enrich: <b style="color:#4a9eff">${(this._trainir15QualityMetrics.enrichSuccess * 100).toFixed(0)}%</b></span>
            <span>Avg Triage: <b style="color:#ddd">${this._trainir15QualityMetrics.avgTriageTime}m</b></span>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto">
            ${this._trainir15Alerts.sort((a, b) => this._trainir15CalcScore(b) - this._trainir15CalcScore(a)).map(a => {
              const score = this._trainir15CalcScore(a);
              return html`
                <div style="padding:6px;background:#1a1d27;border-radius:4px;border-left:3px solid ${a.severity >= 4 ? '#f44' : a.severity >= 3 ? '#fa0' : '#4a9eff'}">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="color:#ddd;font-size:11px;flex:1">${a.name}</span>
                    <span style="color:#e0e0e0;font-size:12px;font-weight:bold;min-width:40px;text-align:center">${score.toFixed(1)}</span>
                    <button class="btn" style="font-size:9px;padding:1px 6px;margin-left:4px" @click=${() => this._trainir15EnrichAlert(a.id)}>${a.enriched ? 'Re-enrich' : 'Enrich'}</button>
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
            ${this._trainir15RoutingRules.map(r => html`
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
            ${this._trainir15Shapes.map(s => {
              const v = this._trainir15ValidateControl(s.id);
              return html`<div style="padding:4px 8px;background:#1a1d27;border-radius:3px;cursor:pointer;border:1px solid ${this._trainir15SelectedShape === s.id ? '#4a9eff' : '#2a2d37'}" @click=${() => { this._trainir15SelectedShape = this._trainir15SelectedShape === s.id ? '' : s.id; }}>
                <div style="display:flex;align-items:center;gap:4px"><span style="color:${v.valid ? '#4f4' : '#f44'};font-size:10px">${v.valid ? '\u2713' : '\u2717'}</span><span style="color:#ddd;font-size:10px">${s.label}</span></div>
                <div style="color:#888;font-size:8px">${s.controls.length} controls</div>
              </div>`;
            })}
          </div>
          ${this._trainir15SelectedShape ? html`
            ${(() => {
              const shape = this._trainir15Shapes.find(s => s.id === this._trainir15SelectedShape);
              const v = this._trainir15ValidateControl(this._trainir15SelectedShape);
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
            ${this._trainir15TrustBoundaries.map(tb => html`
              <div style="display:flex;gap:6px;align-items:center;padding:3px;background:#1a1d27;border-radius:3px;margin-bottom:2px;font-size:9px">
                <span style="color:#ddd">${this._trainir15Shapes.find(s => s.id === tb.from)?.label || tb.from}</span>
                <span style="color:#4a9eff">\u2194</span>
                <span style="color:#ddd">${this._trainir15Shapes.find(s => s.id === tb.to)?.label || tb.to}</span>
                <span style="flex:1"></span>
                <span style="color:#888">${tb.label}</span>
                <span style="color:${tb.strength === 'strong' ? '#4f4' : tb.strength === 'medium' ? '#fa0' : '#f44'};font-size:9px;padding:1px 4px;border-radius:2px;background:${tb.strength === 'strong' ? 'rgba(0,255,0,0.1)' : tb.strength === 'medium' ? 'rgba(255,170,0,0.1)' : 'rgba(255,0,0,0.1)'}">${tb.strength}</span>
              </div>
            `)}
          </div>
          <div><div style="color:#888;font-size:10px;margin-bottom:4px">Architecture Decision Records</div>
            ${this._trainir15ADRs.map(adr => html`
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
            ${this._trainir15Gauges.map(g => html`
              <div style="flex:1;min-width:100px;padding:6px;background:#1a1d27;border-radius:4px;text-align:center">
                <div style="color:#888;font-size:9px;margin-bottom:2px">${g.name}</div>
                <div style="color:${g.status === 'healthy' ? '#4f4' : g.status === 'warning' ? '#fa0' : '#f44'};font-size:18px;font-weight:bold">${g.value}${g.unit}</div>
                <div style="background:#2a2d37;border-radius:3px;height:4px;margin-top:4px;overflow:hidden"><div style="height:100%;width:${(g.value / g.max * 100)}%;background:${g.color};border-radius:3px"></div></div>
              </div>
            `)}
          </div>
          <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
            <span style="color:#888;font-size:10px">System Health:</span>
            <span style="color:${this._trainir15GetOverallHealth().score >= 99 ? '#4f4' : '#fa0'};font-size:12px;font-weight:bold">${this._trainir15GetOverallHealth().score}%</span>
            <span style="color:#888;font-size:10px">(Target: ${this._trainir15SlaTarget}%)</span>
            <span style="color:#4f4;font-size:10px">${this._trainir15GetOverallHealth().healthy} healthy</span>
            <span style="color:#fa0;font-size:10px">${this._trainir15GetOverallHealth().degraded} degraded</span>
          </div>
          <div style="margin-bottom:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Anomaly Stream</div>
            ${this._trainir15Anomalies.slice(0, 3).map(a => html`
              <div style="display:flex;gap:6px;align-items:center;padding:4px;background:#1a1d27;border-radius:3px;margin-bottom:2px;opacity:${a.acknowledged ? 0.5 : 1}">
                <span style="color:#888;font-size:9px;min-width:50px">${a.time}</span>
                <span style="color:${a.severity === 'high' ? '#f44' : a.severity === 'medium' ? '#fa0' : '#888'};font-size:9px;min-width:30px">${a.severity.toUpperCase()}</span>
                <span style="color:#ddd;font-size:10px;flex:1">${a.description}</span>
                ${!a.acknowledged ? html`<button class="btn" style="font-size:8px;padding:1px 4px" @click=${() => this._trainir15AckAnomaly(a.id)}>ACK</button>` : html`<span style="color:#4f4;font-size:9px">ACK'd</span>`}
              </div>
            `)}
          </div>
          <div style="margin-bottom:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Integration Health</div>
            ${this._trainir15Integrations.map(i => html`
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
              <tbody>${this._trainir15AlertFatigue.map(af => html`
                <tr style="border-top:1px solid #2a2d37"><td style="padding:3px;color:#ddd">${af.analyst}</td><td style="padding:3px;color:${af.alertsPerDay > 60 ? '#f44' : af.alertsPerDay > 40 ? '#fa0' : '#4f4'};text-align:center">${af.alertsPerDay}</td><td style="padding:3px;color:#aaa;text-align:center">${af.escalated}</td><td style="padding:3px;color:#888;text-align:center">${af.dismissed}</td><td style="padding:3px;color:#aaa;text-align:center">${af.avgResponseMin}m</td><td style="padding:3px;text-align:center;color:${af.alertsPerDay > 60 ? '#f44' : af.alertsPerDay > 40 ? '#fa0' : '#4f4'}">${af.alertsPerDay > 60 ? 'HIGH' : af.alertsPerDay > 40 ? 'MEDIUM' : 'LOW'}</td></tr>
              `)}</tbody>
            </table></div>
          </div>
        </div>
</div>
      </div>`;
  }


  

  private _trainir15RenderFishbone(): string {
    const categories = ['People','Process','Technology','Environment','Communication','Policy'];
    const bones = categories.map((cat, i) => {
      const angle = 30 + i * 20;
      return '<line x1="200" y1="150" x2="' + (200 + Math.cos(angle * Math.PI / 180) * 140) + '" y2="' + (150 - Math.sin(angle * Math.PI / 180) * 140) + '" stroke="#4a9eff" stroke-width="1.5"/><text x="' + (200 + Math.cos(angle * Math.PI / 180) * 145) + '" y="' + (150 - Math.sin(angle * Math.PI / 180) * 145) + '" fill="#e0e0e0" font-size="9" text-anchor="middle">' + cat + '</text>';
    }).join('');
    return '<svg width="400" height="300" viewBox="0 0 400 300"><line x1="60" y1="150" x2="340" y2="150" stroke="#e0e0e0" stroke-width="2"/><line x1="200" y1="30" x2="200" y2="270" stroke="#e0e0e0" stroke-width="2"/><text x="200" y="290" fill="#fa0" font-size="11" text-anchor="middle" font-weight="bold">Service Account Compromise</text>' + bones + '</svg>';
  }

  private _trainir15ToggleAction(id: string) {
    this._trainir15Actions = this._trainir15Actions.map(a => a.id === id ? {...a, status: a.status === 'pending' ? 'in_progress' : a.status === 'in_progress' ? 'completed' : 'pending'} : a);
  }

  private _trainir15GetActionStats() {
    const total = this._trainir15Actions.length;
    const done = this._trainir15Actions.filter(a => a.status === 'completed').length;
    const inProg = this._trainir15Actions.filter(a => a.status === 'in_progress').length;
    return { total, done, inProg, pending: total - done - inProg };
  }

  private _trainir15GetOverallMaturity(): number {
    if (this._trainir15SelectedDomain === 'all') {
      return Math.round(this._trainir15MaturityLevels.reduce((s, m) => s + m.current, 0) / this._trainir15MaturityLevels.length * 10) / 10;
    }
    const d = this._trainir15MaturityLevels.find(m => m.domain === this._trainir15SelectedDomain);
    return d ? d.current : 0;
  }

  private _trainir15GetGapAnalysis() {
    return this._trainir15Benchmarks.map(b => {
      const gap = b.current - b.industry;
      const targetGap = b.target - b.current;
      const isAbove = gap > 0;
      return { ...b, gap, targetGap, isAbove, status: isAbove ? 'exceeds' : targetGap > 0 ? 'improving' : 'on_track' };
    });
  }

  private _trainir15CalcScore(alert: any): number {
    return Math.round(alert.severity * alert.confidence * alert.assetCrit * 100) / 100;
  }

  private _trainir15EnrichAlert(id: string) {
    this._trainir15Alerts = this._trainir15Alerts.map(a => {
      if (a.id !== id) return a;
      const score = this._trainir15CalcScore(a);
      return { ...a, enriched: true, score, enrichData: a.enrichData.length > 0 ? a.enrichData : [{key:'Auto-Enriched',value:'Simulated at ' + new Date().toLocaleTimeString()},{key:'Reputation',value: Math.random() > 0.5 ? 'Malicious' : 'Neutral'},{key:'Geo',value: 'US-EAST'}] };
    });
  }

  private _trainir15GroupAlerts() {
    const groups: Record<string, number> = {};
    this._trainir15Alerts.forEach(a => { groups[a.group] = (groups[a.group] || 0) + 1; });
    return Object.entries(groups).map(([g, c]) => ({group: g, count: c}));
  }

  private _trainir15ValidateControl(shapeId: string): {valid:boolean;missing:string[]} {
    const shape = this._trainir15Shapes.find(s => s.id === shapeId);
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

  private _trainir15GetOverallHealth(): {healthy:number;degraded:number;down:number;score:number} {
    const online = this._trainir15Integrations.filter(i => i.status === 'online').length;
    const degraded = this._trainir15Integrations.filter(i => i.status === 'degraded').length;
    const total = this._trainir15Integrations.length;
    return { healthy: online, degraded, down: total - online - degraded, score: Math.round(online / total * 100) };
  }

  private _trainir15AckAnomaly(id: string) {
    this._trainir15Anomalies = this._trainir15Anomalies.map(a => a.id === id ? {...a, acknowledged: true} : a);
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

  // --- Attack Surface Analysis ---
  private _renderAttackSurfaceAnalysis(): TemplateResult {
    const externalAssets = [
      { type: 'Web Application', count: 47, exposed: 38, critical: 5, high: 12, medium: 18, low: 3 },
      { type: 'API Endpoint', count: 156, exposed: 142, critical: 3, high: 22, medium: 67, low: 50 },
      { type: 'DNS Records', count: 234, exposed: 234, critical: 1, high: 8, medium: 45, low: 180 },
      { type: 'IP Addresses', count: 89, exposed: 89, critical: 2, high: 11, medium: 34, low: 42 },
      { type: 'Cloud Storage', count: 23, exposed: 19, critical: 4, high: 6, medium: 7, low: 2 },
      { type: 'Email Servers', count: 8, exposed: 8, critical: 1, high: 2, medium: 3, low: 2 },
      { type: 'VPN Gateways', count: 5, exposed: 5, critical: 0, high: 1, medium: 2, low: 2 },
      { type: 'IoT Devices', count: 34, exposed: 28, critical: 3, high: 8, medium: 12, low: 5 },
    ];
    const exposureFactors = [
      { factor: 'Internet Exposure', weight: 15, score: 82, desc: 'Percentage of assets directly internet-facing' },
      { factor: 'Open Ports', weight: 12, score: 65, desc: 'Number of open ports across external IPs' },
      { factor: 'Unpatched Services', weight: 15, score: 71, desc: 'Services with known CVEs unpatched' },
      { factor: 'Weak Encryption', weight: 10, score: 38, desc: 'Use of deprecated TLS/SSL versions' },
      { factor: 'Default Credentials', weight: 12, score: 22, desc: 'Devices with factory/default credentials' },
      { factor: 'Shadow IT', weight: 10, score: 45, desc: 'Unmanaged cloud services and SaaS apps' },
      { factor: 'Data Exposure', weight: 13, score: 58, desc: 'Sensitive data accessible without auth' },
      { factor: 'Third-Party Risk', weight: 8, score: 62, desc: 'Vendor-supplied components with vulnerabilities' },
      { factor: 'Misconfigurations', weight: 5, score: 48, desc: 'Cloud and infrastructure misconfigurations' },
    ];
    const totalExposure = Math.round(exposureFactors.reduce((s, f) => s + f.score * f.weight, 0) / exposureFactors.reduce((s, f) => s + f.weight, 0));
    const attackVectors = [
      { vector: 'SQL Injection', assets: 12, severity: 'critical', trend: 'decreasing', count: 3 },
      { vector: 'XSS', assets: 28, severity: 'high', trend: 'stable', count: 8 },
      { vector: 'CSRF', assets: 15, severity: 'medium', trend: 'decreasing', count: 4 },
      { vector: 'Broken Auth', assets: 8, severity: 'critical', trend: 'stable', count: 5 },
      { vector: 'SSRF', assets: 6, severity: 'high', trend: 'increasing', count: 7 },
      { vector: 'API Abuse', assets: 22, severity: 'high', trend: 'increasing', count: 14 },
      { vector: 'Phishing Entry', assets: 3, severity: 'high', trend: 'stable', count: 9 },
      { vector: 'RCE', assets: 4, severity: 'critical', trend: 'decreasing', count: 1 },
    ];
    const shadowIT = [
      { app: 'Trello Boards', users: 45, risk: 'medium', data: 'Project plans' },
      { app: 'Google Drive Shared', users: 128, risk: 'high', data: 'Documents, spreadsheets' },
      { app: 'Slack External Channels', users: 89, risk: 'low', data: 'Communication' },
      { app: 'Notion Workspaces', users: 34, risk: 'medium', data: 'Technical docs' },
      { app: 'Dropbox Personal', users: 22, risk: 'high', data: 'Mixed content' },
      { app: 'GitHub Private Repos', users: 67, risk: 'medium', data: 'Source code' },
    ];
    const reductionTracking = [
      { month: 'Jan', surface: 582, reduction: 0, target: 580 },
      { month: 'Feb', surface: 564, reduction: 18, target: 560 },
      { month: 'Mar', surface: 548, reduction: 34, target: 540 },
      { month: 'Apr', surface: 531, reduction: 51, target: 520 },
      { month: 'May', surface: 519, reduction: 63, target: 500 },
      { month: 'Jun', surface: 508, reduction: 74, target: 480 },
    ];
    return html`
      <div class="attack-surface-analysis">
        <h4>External Attack Surface Analysis</h4>
        <div class="as-grid">
          <div class="as-card">
            <h5>Exposure Score: ${totalExposure}/100</h5>
            <div class="exposure-factors">
              ${exposureFactors.map(f => html`
                <div class="factor-row">
                  <span class="factor-name">${f.factor}</span>
                  <div class="factor-bar-wrap">
                    <div class="factor-bar" style="width:${f.score}%; background:${f.score > 70 ? '#ef4444' : f.score > 50 ? '#f59e0b' : '#22c55e'}"></div>
                  </div>
                  <span class="factor-score">${f.score}</span>
                  <span class="factor-weight">(w:${f.weight})</span>
                </div>
              `)}
            </div>
          </div>
          <div class="as-card">
            <h5>External Asset Inventory</h5>
            <table class="asset-table">
              <thead><tr><th>Type</th><th>Total</th><th>Exposed</th><th>Crit</th><th>High</th><th>Med</th><th>Low</th></tr></thead>
              <tbody>
                ${externalAssets.map(a => html`<tr>
                  <td>${a.type}</td><td>${a.count}</td><td>${a.exposed}</td>
                  <td class="sev-critical">${a.critical}</td><td class="sev-high">${a.high}</td>
                  <td class="sev-medium">${a.medium}</td><td class="sev-low">${a.low}</td>
                </tr>`)}
              </tbody>
            </table>
          </div>
          <div class="as-card">
            <h5>Attack Vector Mapping</h5>
            <div class="vector-list">
              ${attackVectors.map(v => html`
                <div class="vector-item sev-${v.severity}">
                  <span class="vec-name">${v.vector}</span>
                  <span class="vec-assets">${v.assets} assets</span>
                  <span class="vec-trend trend-${v.trend}">${v.trend}</span>
                  <span class="vec-count">${v.count} findings</span>
                </div>
              `)}
            </div>
          </div>
          <div class="as-card">
            <h5>Shadow IT Detection Alerts</h5>
            <div class="shadow-list">
              ${shadowIT.map(s => html`
                <div class="shadow-item risk-${s.risk}">
                  <span class="sh-app">${s.app}</span>
                  <span class="sh-users">${s.users} users</span>
                  <span class="sh-risk risk-badge-${s.risk}">${s.risk}</span>
                  <span class="sh-data">${s.data}</span>
                </div>
              `)}
            </div>
          </div>
          <div class="as-card full-width">
            <h5>Attack Surface Reduction Tracking</h5>
            <div class="reduction-chart">
              ${reductionTracking.map(r => html`
                <div class="red-bar-group">
                  <div class="red-bar actual" style="height:${r.surface * 0.15}px">
                    <span>${r.surface}</span>
                  </div>
                  <div class="red-bar target" style="height:${r.target * 0.15}px">
                    <span>${r.target}</span>
                  </div>
                  <span class="red-label">${r.month}</span>
                </div>
              `)}
            </div>
            <div class="reduction-summary">
              <span>Total reduction: ${reductionTracking[reductionTracking.length - 1].reduction} assets</span>
              <span>Avg monthly reduction: ${Math.round(74 / 6)} assets</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _calculateExposureScore(factors: { weight: number; score: number }[]): number {
    const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
    const weightedSum = factors.reduce((s, f) => s + f.score * f.weight, 0);
    return Math.round(weightedSum / totalWeight);
  }

  private _getShadowITAlerts(): { app: string; users: number; risk: string }[] {
    return [
      { app: 'Unregistered SaaS', users: 12, risk: 'high' },
      { app: 'Personal Cloud Storage', users: 8, risk: 'medium' },
    ];
  }


  // --- Attack Surface Analysis ---
  private _renderAttackSurfaceAnalysis(): TemplateResult {
    const externalAssets = [
      { type: 'Web Application', count: 47, exposed: 38, critical: 5, high: 12, medium: 18, low: 3 },
      { type: 'API Endpoint', count: 156, exposed: 142, critical: 3, high: 22, medium: 67, low: 50 },
      { type: 'DNS Records', count: 234, exposed: 234, critical: 1, high: 8, medium: 45, low: 180 },
      { type: 'IP Addresses', count: 89, exposed: 89, critical: 2, high: 11, medium: 34, low: 42 },
      { type: 'Cloud Storage', count: 23, exposed: 19, critical: 4, high: 6, medium: 7, low: 2 },
      { type: 'Email Servers', count: 8, exposed: 8, critical: 1, high: 2, medium: 3, low: 2 },
      { type: 'VPN Gateways', count: 5, exposed: 5, critical: 0, high: 1, medium: 2, low: 2 },
      { type: 'IoT Devices', count: 34, exposed: 28, critical: 3, high: 8, medium: 12, low: 5 },
    ];
    const exposureFactors = [
      { factor: 'Internet Exposure', weight: 15, score: 82, desc: 'Percentage of assets directly internet-facing' },
      { factor: 'Open Ports', weight: 12, score: 65, desc: 'Number of open ports across external IPs' },
      { factor: 'Unpatched Services', weight: 15, score: 71, desc: 'Services with known CVEs unpatched' },
      { factor: 'Weak Encryption', weight: 10, score: 38, desc: 'Use of deprecated TLS/SSL versions' },
      { factor: 'Default Credentials', weight: 12, score: 22, desc: 'Devices with factory/default credentials' },
      { factor: 'Shadow IT', weight: 10, score: 45, desc: 'Unmanaged cloud services and SaaS apps' },
      { factor: 'Data Exposure', weight: 13, score: 58, desc: 'Sensitive data accessible without auth' },
      { factor: 'Third-Party Risk', weight: 8, score: 62, desc: 'Vendor-supplied components with vulnerabilities' },
      { factor: 'Misconfigurations', weight: 5, score: 48, desc: 'Cloud and infrastructure misconfigurations' },
    ];
    const totalExposure = Math.round(exposureFactors.reduce((s, f) => s + f.score * f.weight, 0) / exposureFactors.reduce((s, f) => s + f.weight, 0));
    const attackVectors = [
      { vector: 'SQL Injection', assets: 12, severity: 'critical', trend: 'decreasing', count: 3 },
      { vector: 'XSS', assets: 28, severity: 'high', trend: 'stable', count: 8 },
      { vector: 'CSRF', assets: 15, severity: 'medium', trend: 'decreasing', count: 4 },
      { vector: 'Broken Auth', assets: 8, severity: 'critical', trend: 'stable', count: 5 },
      { vector: 'SSRF', assets: 6, severity: 'high', trend: 'increasing', count: 7 },
      { vector: 'API Abuse', assets: 22, severity: 'high', trend: 'increasing', count: 14 },
      { vector: 'Phishing Entry', assets: 3, severity: 'high', trend: 'stable', count: 9 },
      { vector: 'RCE', assets: 4, severity: 'critical', trend: 'decreasing', count: 1 },
    ];
    const shadowIT = [
      { app: 'Trello Boards', users: 45, risk: 'medium', data: 'Project plans' },
      { app: 'Google Drive Shared', users: 128, risk: 'high', data: 'Documents, spreadsheets' },
      { app: 'Slack External Channels', users: 89, risk: 'low', data: 'Communication' },
      { app: 'Notion Workspaces', users: 34, risk: 'medium', data: 'Technical docs' },
      { app: 'Dropbox Personal', users: 22, risk: 'high', data: 'Mixed content' },
      { app: 'GitHub Private Repos', users: 67, risk: 'medium', data: 'Source code' },
    ];
    const reductionTracking = [
      { month: 'Jan', surface: 582, reduction: 0, target: 580 },
      { month: 'Feb', surface: 564, reduction: 18, target: 560 },
      { month: 'Mar', surface: 548, reduction: 34, target: 540 },
      { month: 'Apr', surface: 531, reduction: 51, target: 520 },
      { month: 'May', surface: 519, reduction: 63, target: 500 },
      { month: 'Jun', surface: 508, reduction: 74, target: 480 },
    ];
    return html`
      <div class="attack-surface-analysis">
        <h4>External Attack Surface Analysis</h4>
        <div class="as-grid">
          <div class="as-card">
            <h5>Exposure Score: ${totalExposure}/100</h5>
            <div class="exposure-factors">
              ${exposureFactors.map(f => html`
                <div class="factor-row">
                  <span class="factor-name">${f.factor}</span>
                  <div class="factor-bar-wrap">
                    <div class="factor-bar" style="width:${f.score}%; background:${f.score > 70 ? '#ef4444' : f.score > 50 ? '#f59e0b' : '#22c55e'}"></div>
                  </div>
                  <span class="factor-score">${f.score}</span>
                  <span class="factor-weight">(w:${f.weight})</span>
                </div>
              `)}
            </div>
          </div>
          <div class="as-card">
            <h5>External Asset Inventory</h5>
            <table class="asset-table">
              <thead><tr><th>Type</th><th>Total</th><th>Exposed</th><th>Crit</th><th>High</th><th>Med</th><th>Low</th></tr></thead>
              <tbody>
                ${externalAssets.map(a => html`<tr>
                  <td>${a.type}</td><td>${a.count}</td><td>${a.exposed}</td>
                  <td class="sev-critical">${a.critical}</td><td class="sev-high">${a.high}</td>
                  <td class="sev-medium">${a.medium}</td><td class="sev-low">${a.low}</td>
                </tr>`)}
              </tbody>
            </table>
          </div>
          <div class="as-card">
            <h5>Attack Vector Mapping</h5>
            <div class="vector-list">
              ${attackVectors.map(v => html`
                <div class="vector-item sev-${v.severity}">
                  <span class="vec-name">${v.vector}</span>
                  <span class="vec-assets">${v.assets} assets</span>
                  <span class="vec-trend trend-${v.trend}">${v.trend}</span>
                  <span class="vec-count">${v.count} findings</span>
                </div>
              `)}
            </div>
          </div>
          <div class="as-card">
            <h5>Shadow IT Detection Alerts</h5>
            <div class="shadow-list">
              ${shadowIT.map(s => html`
                <div class="shadow-item risk-${s.risk}">
                  <span class="sh-app">${s.app}</span>
                  <span class="sh-users">${s.users} users</span>
                  <span class="sh-risk risk-badge-${s.risk}">${s.risk}</span>
                  <span class="sh-data">${s.data}</span>
                </div>
              `)}
            </div>
          </div>
          <div class="as-card full-width">
            <h5>Attack Surface Reduction Tracking</h5>
            <div class="reduction-chart">
              ${reductionTracking.map(r => html`
                <div class="red-bar-group">
                  <div class="red-bar actual" style="height:${r.surface * 0.15}px">
                    <span>${r.surface}</span>
                  </div>
                  <div class="red-bar target" style="height:${r.target * 0.15}px">
                    <span>${r.target}</span>
                  </div>
                  <span class="red-label">${r.month}</span>
                </div>
              `)}
            </div>
            <div class="reduction-summary">
              <span>Total reduction: ${reductionTracking[reductionTracking.length - 1].reduction} assets</span>
              <span>Avg monthly reduction: ${Math.round(74 / 6)} assets</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _calculateExposureScore(factors: { weight: number; score: number }[]): number {
    const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
    const weightedSum = factors.reduce((s, f) => s + f.score * f.weight, 0);
    return Math.round(weightedSum / totalWeight);
  }

  private _getShadowITAlerts(): { app: string; users: number; risk: string }[] {
    return [
      { app: 'Unregistered SaaS', users: 12, risk: 'high' },
      { app: 'Personal Cloud Storage', users: 8, risk: 'medium' },
    ];
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
    const trendIcon = (t: string) => t === 'decreasing' ? 'downarrow' : t === 'increasing' ? 'uparrow' : 'rightarrow';
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
                <span class="cat-trend" style="color:${c.trend === 'decreasing' ? '#10b981' : c.trend === 'increasing' ? '#ef4444' : '#6b7280'}">${trendIcon(c.trend)} ${c.trend}</span>
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
      { category: "Personnel & Training", planned: 3141000, actual: 1228000, utilization: 39.1, q1: "29%", q2: "34%", q3: "32%", q4: "24%" },
      { category: "Tooling & Licensing", planned: 3148000, actual: 1241000, utilization: 39.4, q1: "16%", q2: "23%", q3: "27%", q4: "25%" },
      { category: "Infrastructure Security", planned: 3155000, actual: 1254000, utilization: 39.7, q1: "19%", q2: "28%", q3: "22%", q4: "10%" },
      { category: "Compliance & Audit", planned: 3162000, actual: 1267000, utilization: 40.1, q1: "22%", q2: "33%", q3: "33%", q4: "11%" },
      { category: "Incident Response", planned: 3169000, actual: 1280000, utilization: 40.4, q1: "25%", q2: "22%", q3: "28%", q4: "12%" },
      { category: "Third-Party Assessments", planned: 3176000, actual: 1293000, utilization: 40.7, q1: "28%", q2: "27%", q3: "23%", q4: "13%" },
      { category: "Security Awareness", planned: 3183000, actual: 1306000, utilization: 41.0, q1: "15%", q2: "32%", q3: "18%", q4: "14%" },
      { category: "Research & Innovation", planned: 3190000, actual: 1319000, utilization: 41.3, q1: "18%", q2: "21%", q3: "29%", q4: "15%" },
    ];
    const totalBudget = budgetData.reduce((s, d) => s + d.planned, 0);
    const totalSpent = budgetData.reduce((s, d) => s + d.actual, 0);
    const overallUtil = ((totalSpent / totalBudget) * 100).toFixed(1);
    const headcount = [
      { team: "SOC Tier 1", current: 11, target: 13, gap: 0, avgSalary: "163k" },
      { team: "SOC Tier 2", current: 3, target: 12, gap: 5, avgSalary: "192k" },
      { team: "Threat Intel", current: 12, target: 11, gap: 4, avgSalary: "110k" },
      { team: "Red Team", current: 4, target: 10, gap: 3, avgSalary: "139k" },
      { team: "GRC", current: 13, target: 9, gap: 2, avgSalary: "168k" },
      { team: "AppSec", current: 5, target: 8, gap: 1, avgSalary: "86k" },
      { team: "Cloud Sec", current: 14, target: 7, gap: 0, avgSalary: "115k" },
      { team: "Identity & Access", current: 6, target: 6, gap: 5, avgSalary: "144k" },
    ];
    const vendorSpend = [
      { vendor: "CrowdStrike", annual: "279k", contractEnd: "2026-07", renewalRisk: "Low", satisfaction: 3 },
      { vendor: "Palo Alto", annual: "310k", contractEnd: "2026-08", renewalRisk: "Medium", satisfaction: 5 },
      { vendor: "Splunk", annual: "341k", contractEnd: "2026-09", renewalRisk: "High", satisfaction: 4 },
      { vendor: "Qualys", annual: "372k", contractEnd: "2026-10", renewalRisk: "Low", satisfaction: 3 },
      { vendor: "Rapid7", annual: "403k", contractEnd: "2026-11", renewalRisk: "Medium", satisfaction: 5 },
      { vendor: "Mandiant", annual: "434k", contractEnd: "2026-12", renewalRisk: "High", satisfaction: 4 },
      { vendor: "Zscaler", annual: "465k", contractEnd: "2026-01", renewalRisk: "Low", satisfaction: 3 },
      { vendor: "Duo Security", annual: "496k", contractEnd: "2026-02", renewalRisk: "Medium", satisfaction: 5 },
    ];
    const roiProjections = [
      { area: "Threat Detection", investment: "271k", projectedReturn: "1743k", roiMultiple: "2.5x", confidence: 78 },
      { area: "Incident Reduction", investment: "314k", projectedReturn: "1790k", roiMultiple: "2.4x", confidence: 95 },
      { area: "Compliance Savings", investment: "357k", projectedReturn: "1837k", roiMultiple: "2.3x", confidence: 76 },
      { area: "Automation Gains", investment: "400k", projectedReturn: "1884k", roiMultiple: "2.2x", confidence: 93 },
      { area: "Risk Avoidance", investment: "443k", projectedReturn: "1931k", roiMultiple: "2.1x", confidence: 74 },
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
      { id: "kpi-1", name: "MTTD", owner: "SOC", unit: "minutes", target: 79, current: 64, benchmark: 70, collection: "auto", frequency: "realtime" },
      { id: "kpi-2", name: "MTTR", owner: "GRC", unit: "%", target: 82, current: 71, benchmark: 81, collection: "semi-auto", frequency: "daily" },
      { id: "kpi-3", name: "MTTC", owner: "AppSec", unit: "score", target: 85, current: 78, benchmark: 92, collection: "manual", frequency: "weekly" },
      { id: "kpi-4", name: "Vuln SLA Compliance", owner: "Cloud Sec", unit: "count", target: 88, current: 85, benchmark: 69, collection: "auto", frequency: "monthly" },
      { id: "kpi-5", name: "Patch Coverage", owner: "Identity", unit: "days", target: 91, current: 92, benchmark: 80, collection: "semi-auto", frequency: "realtime" },
      { id: "kpi-6", name: "Phishing Click Rate", owner: "Threat Intel", unit: "minutes", target: 94, current: 99, benchmark: 91, collection: "manual", frequency: "daily" },
      { id: "kpi-7", name: "Training Completion", owner: "Security Ops", unit: "%", target: 97, current: 60, benchmark: 68, collection: "auto", frequency: "weekly" },
      { id: "kpi-8", name: "Escalation Rate", owner: "Risk Mgmt", unit: "score", target: 70, current: 67, benchmark: 79, collection: "semi-auto", frequency: "monthly" },
      { id: "kpi-9", name: "False Positive Rate", owner: "SOC", unit: "count", target: 73, current: 74, benchmark: 90, collection: "manual", frequency: "realtime" },
      { id: "kpi-10", name: "Threat Intel Actionability", owner: "GRC", unit: "days", target: 76, current: 81, benchmark: 67, collection: "auto", frequency: "daily" },
      { id: "kpi-11", name: "Endpoint Compliance", owner: "AppSec", unit: "minutes", target: 79, current: 88, benchmark: 78, collection: "semi-auto", frequency: "weekly" },
      { id: "kpi-12", name: "Cloud Misconfig Score", owner: "Cloud Sec", unit: "%", target: 82, current: 95, benchmark: 89, collection: "manual", frequency: "monthly" },
      { id: "kpi-13", name: "Identity Anomaly Rate", owner: "Identity", unit: "score", target: 85, current: 56, benchmark: 66, collection: "auto", frequency: "realtime" },
      { id: "kpi-14", name: "DLP Events", owner: "Threat Intel", unit: "count", target: 88, current: 63, benchmark: 77, collection: "semi-auto", frequency: "daily" },
      { id: "kpi-15", name: "Vendor Risk Avg", owner: "Security Ops", unit: "days", target: 91, current: 70, benchmark: 88, collection: "manual", frequency: "weekly" },
      { id: "kpi-16", name: "Compliance Audit Pass Rate", owner: "Risk Mgmt", unit: "minutes", target: 94, current: 77, benchmark: 65, collection: "auto", frequency: "monthly" },
      { id: "kpi-17", name: "Awareness Score", owner: "SOC", unit: "%", target: 97, current: 84, benchmark: 76, collection: "semi-auto", frequency: "realtime" },
      { id: "kpi-18", name: "SOC Utilization", owner: "GRC", unit: "score", target: 70, current: 91, benchmark: 87, collection: "manual", frequency: "daily" },
      { id: "kpi-19", name: "Automation Coverage", owner: "AppSec", unit: "count", target: 73, current: 98, benchmark: 98, collection: "auto", frequency: "weekly" },
      { id: "kpi-20", name: "Risk Register Currency", owner: "Cloud Sec", unit: "days", target: 76, current: 59, benchmark: 75, collection: "semi-auto", frequency: "monthly" },
    ];
    const benchmarkSources = [
      { source: "NIST CSF", mappedKPIs: 6, alignment: 81, lastReview: "2026-04-02", status: "aligned" },
      { source: "CIS Controls v8", mappedKPIs: 7, alignment: 98, lastReview: "2026-05-25", status: "partial" },
      { source: "ISO 27001:2022", mappedKPIs: 8, alignment: 76, lastReview: "2026-06-20", status: "reviewing" },
      { source: "PCI DSS 4.0", mappedKPIs: 3, alignment: 93, lastReview: "2026-01-15", status: "aligned" },
      { source: "SOC 2 Type II", mappedKPIs: 4, alignment: 71, lastReview: "2026-02-10", status: "partial" },
      { source: "MITRE ATT&CK", mappedKPIs: 5, alignment: 88, lastReview: "2026-03-05", status: "reviewing" },
      { source: "SANS Top 20", mappedKPIs: 6, alignment: 66, lastReview: "2026-04-28", status: "aligned" },
      { source: "OWASP Top 10", mappedKPIs: 7, alignment: 83, lastReview: "2026-05-23", status: "partial" },
    ];
    const normalizationRules = [
      { rule: "Time metrics normalized to minutes", appliesTo: 7, exceptions: 0, version: "v1.9" },
      { rule: "Percentage metrics capped at 100", appliesTo: 6, exceptions: 1, version: "v1.6" },
      { rule: "Count metrics use 7-day rolling avg", appliesTo: 5, exceptions: 2, version: "v1.3" },
      { rule: "Score metrics use 0-100 scale", appliesTo: 4, exceptions: 0, version: "v1.0" },
      { rule: "Rate metrics per 1000 events", appliesTo: 3, exceptions: 1, version: "v1.7" },
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
      { id: "HC-1001", name: "Lateral Movement Sweep", status: "active", hypothesis: "H1: Actors using pass-the-hash for lateral movement", leadHunter: "Alice Chen", findings: 13, startDate: "2026-02-22", endDate: null, effectiveness: 80 },
      { id: "HC-1002", name: "Credential Harvesting Hunt", status: "completed", hypothesis: "H2: Actors using web shells for persistence", leadHunter: "Bob Martinez", findings: 16, startDate: "2026-01-05", endDate: "2026-06-11", effectiveness: 40 },
      { id: "HC-1003", name: "Persistence Mechanism Audit", status: "planned", hypothesis: "H3: Actors using scheduled tasks for data theft", leadHunter: "Carol Wu", findings: 19, startDate: "2026-04-16", endDate: null, effectiveness: 59 },
      { id: "HC-1004", name: "C2 Beacon Detection", status: "in-review", hypothesis: "H4: Actors using DNS tunneling for C2 communication", leadHunter: "Dave Kim", findings: 22, startDate: "2026-03-27", endDate: null, effectiveness: 78 },
      { id: "HC-1005", name: "Data Exfiltration Patterns", status: "active", hypothesis: "H5: Actors using encrypted channels for privilege escalation", leadHunter: "Eve Johnson", findings: 25, startDate: "2026-02-10", endDate: null, effectiveness: 97 },
      { id: "HC-1006", name: "Privilege Escalation Scan", status: "completed", hypothesis: "H6: Actors using token impersonation for defense evasion", leadHunter: "Frank Liu", findings: 28, startDate: "2026-01-21", endDate: "2026-04-23", effectiveness: 57 },
      { id: "HC-1007", name: "Supply Chain Implant Hunt", status: "planned", hypothesis: "H7: Actors using poisoned images for initial access", leadHunter: "Grace Park", findings: 31, startDate: "2026-04-04", endDate: null, effectiveness: 76 },
      { id: "HC-1008", name: "Insider Threat Indicators", status: "in-review", hypothesis: "H8: Actors using legitimate tools for credential access", leadHunter: "Hector Silva", findings: 34, startDate: "2026-03-15", endDate: null, effectiveness: 95 },
      { id: "HC-1009", name: "Cloud Metadata Analysis", status: "active", hypothesis: "H9: Actors using API keys for command execution", leadHunter: "Alice Chen", findings: 37, startDate: "2026-02-26", endDate: null, effectiveness: 55 },
      { id: "HC-1010", name: "DNS Tunnel Detection", status: "completed", hypothesis: "H10: Actors using encoded subdomains for exfiltration", leadHunter: "Bob Martinez", findings: 40, startDate: "2026-01-09", endDate: "2026-05-07", effectiveness: 74 },
      { id: "HC-1011", name: "Fileless Malware Search", status: "planned", hypothesis: "H11: Actors using WMI providers for discovery", leadHunter: "Carol Wu", findings: 43, startDate: "2026-04-20", endDate: null, effectiveness: 93 },
      { id: "HC-1012", name: "Zero-Day Exploit Traces", status: "in-review", hypothesis: "H12: Actors using exploit kits for collection", leadHunter: "Dave Kim", findings: 46, startDate: "2026-03-03", endDate: null, effectiveness: 53 },
    ];
    const hunterLeaderboard = [
      { hunter: "Alice Chen", campaigns: 10, findings: 82, highSeverity: 7, avgScore: 76, streak: 6 },
      { hunter: "Bob Martinez", campaigns: 7, findings: 111, highSeverity: 12, avgScore: 69, streak: 7 },
      { hunter: "Carol Wu", campaigns: 4, findings: 24, highSeverity: 17, avgScore: 62, streak: 8 },
      { hunter: "Dave Kim", campaigns: 14, findings: 53, highSeverity: 22, avgScore: 55, streak: 1 },
      { hunter: "Eve Johnson", campaigns: 11, findings: 82, highSeverity: 1, avgScore: 92, streak: 2 },
      { hunter: "Frank Liu", campaigns: 8, findings: 111, highSeverity: 6, avgScore: 85, streak: 3 },
      { hunter: "Grace Park", campaigns: 5, findings: 24, highSeverity: 11, avgScore: 78, streak: 4 },
      { hunter: "Hector Silva", campaigns: 15, findings: 53, highSeverity: 16, avgScore: 71, streak: 5 },
    ];
    const mitreMapping = [
      { tactic: "Initial Access", techniques: 12, campaigns: 2, coverage: 43 },
      { tactic: "Execution", techniques: 11, campaigns: 1, coverage: 94 },
      { tactic: "Persistence", techniques: 10, campaigns: 6, coverage: 74 },
      { tactic: "Privilege Escalation", techniques: 9, campaigns: 5, coverage: 54 },
      { tactic: "Defense Evasion", techniques: 8, campaigns: 4, coverage: 34 },
      { tactic: "Credential Access", techniques: 7, campaigns: 3, coverage: 85 },
      { tactic: "Discovery", techniques: 6, campaigns: 2, coverage: 65 },
      { tactic: "Lateral Movement", techniques: 5, campaigns: 1, coverage: 45 },
      { tactic: "Collection", techniques: 4, campaigns: 6, coverage: 96 },
      { tactic: "Exfiltration", techniques: 3, campaigns: 5, coverage: 76 },
      { tactic: "Command & Control", techniques: 2, campaigns: 4, coverage: 56 },
      { tactic: "Impact", techniques: 12, campaigns: 3, coverage: 36 },
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
      { id: "CTL-2001", name: "MFA Enforcement", domain: "Access Control", status: "implemented", effectiveness: 77, lastTest: "2026-02-14", nextReview: "2026-10-14", owner: "SOC", risk: "Low" },
      { id: "CTL-2002", name: "Network Segmentation", domain: "Network Security", status: "partial", effectiveness: 6, lastTest: "2026-01-27", nextReview: "2026-11-05", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2003", name: "EDR Deployment", domain: "Endpoint Protection", status: "planned", effectiveness: 13, lastTest: "2026-04-12", nextReview: "2026-12-24", owner: "IT Ops", risk: "High" },
      { id: "CTL-2004", name: "DLP Policy", domain: "Data Protection", status: "gap", effectiveness: 20, lastTest: "2026-03-25", nextReview: "2026-05-15", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2005", name: "SSO Integration", domain: "Identity Management", status: "implemented", effectiveness: 89, lastTest: "2026-02-10", nextReview: "2026-06-06", owner: "IAM", risk: "Low" },
      { id: "CTL-2006", name: "SAST Pipeline", domain: "Application Security", status: "partial", effectiveness: 34, lastTest: "2026-01-23", nextReview: "2026-07-25", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2007", name: "CSPM Scanning", domain: "Cloud Security", status: "planned", effectiveness: 41, lastTest: "2026-04-08", nextReview: "2026-08-16", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2008", name: "Badge Access", domain: "Physical Security", status: "gap", effectiveness: 48, lastTest: "2026-03-21", nextReview: "2026-09-07", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2009", name: "Least Privilege", domain: "Access Control", status: "implemented", effectiveness: 42, lastTest: "2026-02-06", nextReview: "2026-10-26", owner: "SOC", risk: "Low" },
      { id: "CTL-2010", name: "Firewall Rules", domain: "Network Security", status: "partial", effectiveness: 11, lastTest: "2026-01-19", nextReview: "2026-11-17", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2011", name: "Disk Encryption", domain: "Endpoint Protection", status: "planned", effectiveness: 18, lastTest: "2026-04-04", nextReview: "2026-12-08", owner: "IT Ops", risk: "High" },
      { id: "CTL-2012", name: "Data Classification", domain: "Data Protection", status: "gap", effectiveness: 25, lastTest: "2026-03-17", nextReview: "2026-05-27", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2013", name: "PAM Implementation", domain: "Identity Management", status: "implemented", effectiveness: 54, lastTest: "2026-02-02", nextReview: "2026-06-18", owner: "IAM", risk: "Low" },
      { id: "CTL-2014", name: "DAST Pipeline", domain: "Application Security", status: "partial", effectiveness: 39, lastTest: "2026-01-15", nextReview: "2026-07-09", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2015", name: "IAM Policy Review", domain: "Cloud Security", status: "planned", effectiveness: 46, lastTest: "2026-04-28", nextReview: "2026-08-28", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2016", name: "Visitor Management", domain: "Physical Security", status: "gap", effectiveness: 2, lastTest: "2026-03-13", nextReview: "2026-09-19", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2017", name: "Access Reviews", domain: "Access Control", status: "implemented", effectiveness: 66, lastTest: "2026-02-26", nextReview: "2026-10-10", owner: "SOC", risk: "Low" },
      { id: "CTL-2018", name: "IDS/IPS Tuning", domain: "Network Security", status: "partial", effectiveness: 16, lastTest: "2026-01-11", nextReview: "2026-11-01", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2019", name: "Patch Management", domain: "Endpoint Protection", status: "planned", effectiveness: 23, lastTest: "2026-04-24", nextReview: "2026-12-20", owner: "IT Ops", risk: "High" },
      { id: "CTL-2020", name: "Backup Encryption", domain: "Data Protection", status: "gap", effectiveness: 30, lastTest: "2026-03-09", nextReview: "2026-05-11", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2021", name: "Password Policy", domain: "Identity Management", status: "implemented", effectiveness: 78, lastTest: "2026-02-22", nextReview: "2026-06-02", owner: "IAM", risk: "Low" },
      { id: "CTL-2022", name: "Container Scanning", domain: "Application Security", status: "partial", effectiveness: 44, lastTest: "2026-01-07", nextReview: "2026-07-21", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2023", name: "WAF Configuration", domain: "Cloud Security", status: "planned", effectiveness: 0, lastTest: "2026-04-20", nextReview: "2026-08-12", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2024", name: "CCTV Coverage", domain: "Physical Security", status: "gap", effectiveness: 7, lastTest: "2026-03-05", nextReview: "2026-09-03", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2025", name: "RBAC Enforcement", domain: "Access Control", status: "implemented", effectiveness: 90, lastTest: "2026-02-18", nextReview: "2026-10-22", owner: "SOC", risk: "Low" },
      { id: "CTL-2026", name: "VPN Management", domain: "Network Security", status: "partial", effectiveness: 21, lastTest: "2026-01-03", nextReview: "2026-11-13", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2027", name: "App Whitelisting", domain: "Endpoint Protection", status: "planned", effectiveness: 28, lastTest: "2026-04-16", nextReview: "2026-12-04", owner: "IT Ops", risk: "High" },
      { id: "CTL-2028", name: "Key Management", domain: "Data Protection", status: "gap", effectiveness: 35, lastTest: "2026-03-01", nextReview: "2026-05-23", owner: "Data Gov", risk: "Critical" },
    ];
    const gapAnalysis = [
      { gap: "Insufficient MFA coverage for legacy apps", severity: "High", remediationPlan: "Plan R3001", eta: "2026-Q4", estimatedCost: "20k" },
      { gap: "Missing network micro-segmentation", severity: "Medium", remediationPlan: "Plan R3002", eta: "2026-Q3", estimatedCost: "49k" },
      { gap: "Inconsistent EDR deployment", severity: "Medium", remediationPlan: "Plan R3003", eta: "2026-Q2", estimatedCost: "78k" },
      { gap: "DLP not covering cloud storage", severity: "Low", remediationPlan: "Plan R3004", eta: "2026-Q4", estimatedCost: "107k" },
      { gap: "SSO not integrated with all SaaS", severity: "High", remediationPlan: "Plan R3005", eta: "2026-Q3", estimatedCost: "136k" },
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
      { id: "INC-7001", name: "Security Incident 1", severity: "Critical", totalCost: 940000, responseCost: 253800, recoveryCost: 300800, legalCost: 169200, regulatoryCost: 122200, insuranceClaim: 564000, avoidedCost: 210000, date: "2026-02-06" },
      { id: "INC-7002", name: "Security Incident 2", severity: "High", totalCost: 943000, responseCost: 320620, recoveryCost: 207460, legalCost: 141450, regulatoryCost: 75440, insuranceClaim: 0, avoidedCost: 239000, date: "2026-01-15" },
      { id: "INC-7003", name: "Security Incident 3", severity: "Medium", totalCost: 946000, responseCost: 189200, recoveryCost: 312180, legalCost: 113520, regulatoryCost: 132440, insuranceClaim: 520300, avoidedCost: 268000, date: "2026-04-24" },
      { id: "INC-7004", name: "Security Incident 4", severity: "Low", totalCost: 949000, responseCost: 256230, recoveryCost: 218270, legalCost: 85410, regulatoryCost: 85410, insuranceClaim: 0, avoidedCost: 297000, date: "2026-03-05" },
      { id: "INC-7005", name: "Security Incident 5", severity: "Critical", totalCost: 952000, responseCost: 323680, recoveryCost: 323680, legalCost: 57120, regulatoryCost: 142800, insuranceClaim: 476000, avoidedCost: 326000, date: "2026-02-14" },
      { id: "INC-7006", name: "Security Incident 6", severity: "High", totalCost: 955000, responseCost: 191000, recoveryCost: 229200, legalCost: 181450, regulatoryCost: 95500, insuranceClaim: 0, avoidedCost: 355000, date: "2026-01-23" },
      { id: "INC-7007", name: "Security Incident 7", severity: "Medium", totalCost: 958000, responseCost: 258660, recoveryCost: 335300, legalCost: 153280, regulatoryCost: 47900, insuranceClaim: 431100, avoidedCost: 384000, date: "2026-04-04" },
      { id: "INC-7008", name: "Security Incident 8", severity: "Low", totalCost: 961000, responseCost: 326740, recoveryCost: 240250, legalCost: 124930, regulatoryCost: 105710, insuranceClaim: 0, avoidedCost: 413000, date: "2026-03-13" },
      { id: "INC-7009", name: "Security Incident 9", severity: "Critical", totalCost: 964000, responseCost: 192800, recoveryCost: 347040, legalCost: 96400, regulatoryCost: 57840, insuranceClaim: 385600, avoidedCost: 442000, date: "2026-02-22" },
      { id: "INC-7010", name: "Security Incident 10", severity: "High", totalCost: 967000, responseCost: 261090, recoveryCost: 251420, legalCost: 67690, regulatoryCost: 116040, insuranceClaim: 0, avoidedCost: 471000, date: "2026-01-03" },
      { id: "INC-7011", name: "Security Incident 11", severity: "Medium", totalCost: 970000, responseCost: 329800, recoveryCost: 358900, legalCost: 194000, regulatoryCost: 67900, insuranceClaim: 339500, avoidedCost: 500000, date: "2026-04-12" },
      { id: "INC-7012", name: "Security Incident 12", severity: "Low", totalCost: 973000, responseCost: 194600, recoveryCost: 262710, legalCost: 165410, regulatoryCost: 126490, insuranceClaim: 0, avoidedCost: 33000, date: "2026-03-21" },
    ];
    const yearlyTrend = [
      { month: "Jan", incidents: 10, totalCost: "523k", avgCost: "115k", insured: 50 },
      { month: "Feb", incidents: 7, totalCost: "566k", avgCost: "162k", insured: 50 },
      { month: "Mar", incidents: 4, totalCost: "609k", avgCost: "28k", insured: 50 },
      { month: "Apr", incidents: 12, totalCost: "652k", avgCost: "75k", insured: 50 },
      { month: "May", incidents: 9, totalCost: "695k", avgCost: "122k", insured: 50 },
      { month: "Jun", incidents: 6, totalCost: "738k", avgCost: "169k", insured: 50 },
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


declare global { interface HTMLElementTagNameMap { 'sc-training-module': ScTrainingModule; } }
