/**
 * sc-metrics-kpi-dashboard — Security Metrics and KPI Dashboard
 * Executive-level security metrics and trend analysis
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface KpiMetric {
  name: string;
  value: string;
  unit: string;
  trend: number;
  target: string;
  status: 'on-track' | 'at-risk' | 'critical';
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

@customElement('sc-metrics-kpi-dashboard')
export class ScMetricsKpiDashboard extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px; }
    .kpi-card { background: #1f2937; border-radius: 8px; padding: 16px; }
    .kpi-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .kpi-name { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
    .kpi-status { width: 8px; height: 8px; border-radius: 50%; }
    .status-on-track { background: #22c55e; }
    .status-at-risk { background: #f97316; }
    .status-critical { background: #ef4444; }
    .kpi-value { font-size: 28px; font-weight: 700; }
    .kpi-unit { font-size: 14px; color: #94a3b8; margin-left: 4px; }
    .kpi-trend { font-size: 11px; margin-top: 4px; }
    .trend-up { color: #22c55e; }
    .trend-down { color: #ef4444; }
    .kpi-target { font-size: 10px; color: #6b7280; margin-top: 4px; }
    .chart-section { background: #1f2937; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .chart-title { font-weight: 600; font-size: 13px; margin-bottom: 12px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; color: #94a3b8; }
    .tab:hover { background: #374151; }
    .tab.active { background: #f59e0b; color: #111827; }
    .mini-chart { height: 60px; background: #0f172a; border-radius: 4px; margin-top: 8px; }
    .progress-bar { height: 8px; background: #374151; border-radius: 4px; overflow: hidden; margin-top: 8px; }
    .progress-fill { height: 100%; border-radius: 4px; }

    .wizard-num { width: 24px; height: 24px; border-radius: 50%; background: #374151; color: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .wizard-num.active { background: #8b5cf6; }
    .wizard-num.done { background: #22c55e; }
    .mitre-tag { display: inline-block; font-size: 9px; padding: 1px 5px; border-radius: 3px; background: #312e81; color: #a5b4fc; margin-right: 3px; }
    .export-panel { background: #0f172a; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .export-btn { padding: 8px 16px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 11px; font-weight: 600; cursor: pointer; margin-right: 6px; }
    .export-btn:hover { border-color: #8b5cf6; background: #8b5cf620; }
    .risk-bar-track { flex: 1; height: 6px; background: #1f2937; border-radius: 3px; overflow: hidden; }
    .risk-bar-fill { height: 100%; border-radius: 3px; }
    .cb { width: 14px; height: 14px; accent-color: #8b5cf6; cursor: pointer; }
    .batch-bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #1e1b4b; border-radius: 8px; margin-bottom: 10px; font-size: 11px; }
    .batch-bar button { padding: 4px 12px; border-radius: 5px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 10px; font-weight: 600; cursor: pointer; }
    .batch-bar button:hover { background: #8b5cf630; border-color: #8b5cf6; }
    .approval-modal { background: #0f172a; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 12px; }
    .heatmap-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
    .heatmap-cell { width: 100%; aspect-ratio: 1; border-radius: 3px; }
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

    .score-overview { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 16px; }
    .score-circle { width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #059669); color: white; display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
    .score-label { font-size: 14px; color: #94a3b8; font-weight: 500; }
    .domain-scores { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .domain-row { display: grid; grid-template-columns: 160px 1fr 40px 30px; align-items: center; gap: 8px; }
    .domain-name { font-size: 13px; color: #cbd5e1; }
    .score-bar { height: 8px; border-radius: 4px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); transition: width 0.3s; }
    .score-value { font-size: 13px; font-weight: 600; color: #e2e8f0; text-align: right; }
    .trend-up { color: #10b981; font-weight: 700; }
    .trend-down { color: #ef4444; font-weight: 700; }
    .trend-stable { color: #f59e0b; font-weight: 700; }
    .monthly-trend { display: flex; align-items: flex-end; gap: 4px; height: 100px; margin-bottom: 16px; padding: 8px; background: rgba(15, 23, 42, 0.5); border-radius: 8px; }
    .trend-bar { flex: 1; background: linear-gradient(180deg, #6366f1, #4f46e5); border-radius: 3px 3px 0 0; min-height: 4px; transition: height 0.3s; }
    .bu-comparison { display: flex; flex-direction: column; gap: 6px; }
    .bu-row { display: grid; grid-template-columns: 120px 1fr 40px; align-items: center; gap: 8px; }
    .bu-bar { height: 6px; border-radius: 3px; background: linear-gradient(90deg, #06b6d4, #0891b2); }
    .actor-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
    .actor-card { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(51, 65, 85, 0.5); border-radius: 8px; padding: 14px; transition: border-color 0.2s; }
    .actor-card:hover { border-color: #6366f1; }
    .actor-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .actor-header strong { color: #f1f5f9; font-size: 14px; }
    .sophistication { font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .sophistication.advanced { background: rgba(239, 68, 68, 0.15); color: #fca5a5; }
    .sophistication.moderate { background: rgba(245, 158, 11, 0.15); color: #fcd34d; }
    .actor-details { display: flex; flex-direction: column; gap: 4px; }
    .actor-details p { margin: 0; font-size: 12px; color: #94a3b8; }
    .test-summary { display: flex; gap: 24px; margin-bottom: 16px; }
    .summary-item { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .summary-value { font-size: 24px; font-weight: 700; color: #e2e8f0; }
    .summary-label { font-size: 12px; color: #64748b; }
    .test-list { display: flex; flex-direction: column; gap: 6px; }
    .test-row { display: grid; grid-template-columns: 180px 80px 90px 70px 100px; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; background: rgba(15, 23, 42, 0.4); font-size: 12px; }
    .test-row.status-passed { border-left: 3px solid #10b981; }
    .test-row.status-failed { border-left: 3px solid #ef4444; }
    .test-row.status-warning { border-left: 3px solid #f59e0b; }
    .test-type { color: #cbd5e1; font-weight: 500; }
    .test-status { font-weight: 700; font-size: 11px; }
    .test-row.status-passed .test-status { color: #10b981; }
    .test-row.status-failed .test-status { color: #ef4444; }
    .test-row.status-warning .test-status { color: #f59e0b; }
    .test-findings { color: #94a3b8; }
    .test-coverage { color: #64748b; }
    .test-date { color: #475569; }
    .vuln-correlation-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .vuln-row { display: grid; grid-template-columns: 140px 120px 100px 100px 50px 70px; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; background: rgba(15, 23, 42, 0.4); font-size: 12px; }
    .vuln-row.priority-critical { border-left: 3px solid #ef4444; }
    .vuln-row.priority-high { border-left: 3px solid #f59e0b; }
    .vuln-row.priority-medium { border-left: 3px solid #3b82f6; }
    .vuln-row.priority-low { border-left: 3px solid #6b7280; }
    .vuln-id { color: #f1f5f9; font-weight: 600; font-family: monospace; font-size: 11px; }
    .vuln-source { color: #94a3b8; }
    .exploit-status { font-weight: 700; font-size: 11px; }
    .vuln-row.priority-critical .exploit-status { color: #ef4444; }
    .vuln-age { color: #64748b; }
    .vuln-priority { font-weight: 600; }
    .cluster-list { display: flex; flex-direction: column; gap: 6px; }
    .cluster-row { display: grid; grid-template-columns: 180px 80px 80px 80px; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; background: rgba(15, 23, 42, 0.4); font-size: 12px; color: #cbd5e1; }
    .cluster-risk { font-weight: 700; }
    .cluster-risk.Critical { color: #ef4444; }
    .cluster-risk.High { color: #f59e0b; }
    .cluster-risk.Medium { color: #3b82f6; }
    .ir-steps { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
    .ir-step { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: rgba(15, 23, 42, 0.4); border-radius: 8px; }
    .step-number { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #6366f1, #4f46e5); color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }
    .step-info { display: flex; flex-direction: column; gap: 2px; }
    .step-name { font-size: 13px; font-weight: 600; color: #e2e8f0; }
    .step-sla { font-size: 11px; color: #f59e0b; }
    .step-owner { font-size: 11px; color: #64748b; }
    .playbook-list { display: flex; flex-direction: column; gap: 6px; }
    .playbook-row { display: grid; grid-template-columns: 180px 80px 100px 100px; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; background: rgba(15, 23, 42, 0.4); font-size: 12px; color: #cbd5e1; }
    .pb-severity { font-weight: 700; font-size: 11px; }
    .pb-severity.Critical { color: #ef4444; }
    .pb-severity.High { color: #f59e0b; }
    .pb-severity.Medium { color: #3b82f6; }
`;

  @state() private _tab: 'overview' | 'vuln' | 'training' | 'compliance' = 'overview';

  @state() private _showExport = false;
  @state() private _showApproval = false;
  @state() private _selectedForBatch: Set<string> = new Set();
  @state() private _showRiskScoring = false;
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


  private _kpis: KpiMetric[] = [
    { name: 'MTTD', value: '12', unit: 'min', trend: -15, target: '< 15 min', status: 'on-track' },
    { name: 'MTTR', value: '2.3', unit: 'hours', trend: -8, target: '< 4 hours', status: 'on-track' },
    { name: 'MTTC', value: '4.5', unit: 'hours', trend: -12, target: '< 8 hours', status: 'on-track' },
    { name: 'Security Incidents', value: '23', unit: '/month', trend: -18, target: '< 30/mo', status: 'on-track' },
    { name: 'Vuln Remediation Rate', value: '87', unit: '%', trend: 5, target: '> 85%', status: 'on-track' },
    { name: 'Patch Compliance', value: '94', unit: '%', trend: 2, target: '> 95%', status: 'at-risk' },
    { name: 'Training Completion', value: '78', unit: '%', trend: 12, target: '> 90%', status: 'at-risk' },
    { name: 'Policy Compliance', value: '92', unit: '%', trend: 3, target: '> 90%', status: 'on-track' },
  ];

  private _getStatusClass(status: string): string {
    const m: Record<string, string> = { 'on-track': 'status-on-track', 'at-risk': 'status-at-risk', 'critical': 'status-critical' };
    return m[status] ?? '';
  }

  private _getTrendClass(trend: number): string {
    return trend < 0 ? 'trend-down' : 'trend-up';
  }

  private _renderOverview() {
    return html`
      <div class="kpi-grid">
        ${this._kpis.map(k => html`
          <div class="kpi-card">
            <div class="kpi-header">
              <span class="kpi-name">${k.name}</span>
              <span class="kpi-status ${this._getStatusClass(k.status)}"></span>
            </div>
            <div>
              <span class="kpi-value">${k.value}</span>
              <span class="kpi-unit">${k.unit}</span>
            </div>
            <div class="kpi-trend ${this._getTrendClass(k.trend)}">
              ${k.trend > 0 ? '↑' : '↓'} ${Math.abs(k.trend)}% vs last month
            </div>
            <div class="kpi-target">Target: ${k.target}</div>
          </div>
        `)}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="chart-section">
          <div class="chart-title">Security Incidents Trend (12 months)</div>
          <svg viewBox="0 0 400 100" style="width:100%;height:100px">
            <defs>
              <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ef4444" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#ef4444" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path d="M0,80 35,75 70,70 105,72 140,60 175,55 210,50 245,45 280,48 315,35 350,30 385,25 L385,100 L0,100 Z" fill="url(#incGrad)"/>
            <polyline points="0,80 35,75 70,70 105,72 140,60 175,55 210,50 245,45 280,48 315,35 350,30 385,25" fill="none" stroke="#ef4444" stroke-width="2"/>
            <text x="10" y="95" fill="#6b7280" font-size="9">May</text>
            <text x="370" y="95" fill="#6b7280" font-size="9">Apr</text>
          </svg>
        </div>
        <div class="chart-section">
          <div class="chart-title">Incident Categories (This Month)</div>
          <svg viewBox="0 0 400 100" style="width:100%;height:100px">
            <rect x="10" y="10" width="120" height="20" fill="#ef4444" rx="4"/>
            <text x="140" y="25" fill="#e2e8f0" font-size="11">Malware (8)</text>
            <rect x="10" y="40" width="80" height="20" fill="#f97316" rx="4"/>
            <text x="100" y="55" fill="#e2e8f0" font-size="11">Phishing (5)</text>
            <rect x="10" y="70" width="50" height="20" fill="#eab308" rx="4"/>
            <text x="70" y="85" fill="#e2e8f0" font-size="11">Data (3)</text>
          </svg>
        </div>
      </div>
    `;
  }

  private _renderVuln() {
    return html`
      <div class="chart-section">
        <div class="chart-title">Vulnerability Remediation Trend</div>
        <div style="display:grid;grid-template-columns:repeat(4, 1fr);gap:10px;margin-bottom:12px">
          <div style="background:#0f172a;border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#ef4444">156</div>
            <div style="font-size:10px;color:#6b7280">Open Critical</div>
          </div>
          <div style="background:#0f172a;border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#f97316">423</div>
            <div style="font-size:10px;color:#6b7280">Open High</div>
          </div>
          <div style="background:#0f172a;border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#22c55e">87%</div>
            <div style="font-size:10px;color:#6b7280">Remediation Rate</div>
          </div>
          <div style="background:#0f172a;border-radius:6px;padding:12px;text-align:center">
            <div style="font-size:20px;font-weight:700;color:#3b82f6">18d</div>
            <div style="font-size:10px;color:#6b7280">Avg Time to Patch</div>
          </div>
        </div>
        <svg viewBox="0 0 400 80" style="width:100%;height:80px">
          <polyline points="0,60 50,58 100,55 150,52 200,48 250,45 300,42 350,38 400,35" fill="none" stroke="#22c55e" stroke-width="2"/>
          <text x="10" y="75" fill="#6b7280" font-size="9">Q1</text>
          <text x="370" y="75" fill="#6b7280" font-size="9">Q2</text>
        </svg>
      </div>
    `;
  }

  private _renderTraining() {
    return html`
      <div class="chart-section">
        <div class="chart-title">Security Training Completion</div>
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:10px;margin-bottom:12px">
          <div style="background:#0f172a;border-radius:6px;padding:12px">
            <div style="font-size:20px;font-weight:700;color:#22c55e">78%</div>
            <div style="font-size:10px;color:#6b7280">Overall Completion</div>
            <div class="progress-bar"><div class="progress-fill" style="width:78%;background:#22c55e"></div></div>
          </div>
          <div style="background:#0f172a;border-radius:6px;padding:12px">
            <div style="font-size:20px;font-weight:700;color:#3b82f6">92%</div>
            <div style="font-size:10px;color:#6b7280">Phishing Sim Pass</div>
            <div class="progress-bar"><div class="progress-fill" style="width:92%;background:#3b82f6"></div></div>
          </div>
          <div style="background:#0f172a;border-radius:6px;padding:12px">
            <div style="font-size:20px;font-weight:700;color:#f97316">1,170</div>
            <div style="font-size:10px;color:#6b7280">Users Trained</div>
          </div>
        </div>
        <div style="font-size:11px;color:#94a3b8">Department breakdown: IT (95%), Finance (82%), HR (76%), Sales (68%), Operations (71%)</div>
      </div>
    `;
  }

  private _renderCompliance() {
    return html`
      <div class="chart-section">
        <div class="chart-title">Policy Compliance by Framework</div>
        ${['SOC 2', 'ISO 27001', 'PCI DSS', 'HIPAA', 'GDPR'].map(f => html`
          <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #374151">
            <div style="width:80px;font-size:12px;font-weight:600">${f}</div>
            <div style="flex:1">
              <div class="progress-bar"><div class="progress-fill" style="width:${85 + Math.random() * 10}%;background:${85 + Math.random() * 10 > 90 ? '#22c55e' : '#3b82f6'}"></div></div>
            </div>
            <div style="width:40px;text-align:right;font-weight:600">${Math.floor(85 + Math.random() * 10)}%</div>
          </div>
        `)}
      </div>
    `;
  }


  private _kpiCards = [
    { title: 'Primary KPI', value: '92%', change: '+5%', positive: true, color: '#22c55e' },
    { title: 'Secondary KPI', value: '78%', change: '+3%', positive: true, color: '#3b82f6' },
    { title: 'Risk Indicator', value: '12', change: '-2', positive: true, color: '#f97316' },
    { title: 'Compliance Score', value: '95%', change: '+1%', positive: true, color: '#06b6d4' },
  ];

  private _recommendations = [
    { priority: '#ef4444', text: 'Address 3 critical findings identified in latest assessment', meta: 'Due: 2026-04-30 | Owner: Security Team' },
    { priority: '#f97316', text: 'Complete semi-annual review for all Metrics Kpi Dashboard items', meta: 'Due: 2026-05-15 | Owner: Compliance' },
    { priority: '#eab308', text: 'Update policies to reflect recent regulatory changes', meta: 'Due: 2026-06-01 | Owner: Legal' },
    { priority: '#22c55e', text: 'Schedule next quarterly review with stakeholders', meta: 'Due: 2026-06-15 | Owner: PMO' },
  ];

  private _trendData = [
    { label: 'W1', value: 65, color: '#f97316' },
    { label: 'W2', value: 72, color: '#f97316' },
    { label: 'W3', value: 68, color: '#eab308' },
    { label: 'W4', value: 78, color: '#22c55e' },
    { label: 'W5', value: 82, color: '#22c55e' },
    { label: 'W6', value: 85, color: '#22c55e' },
    { label: 'W7', value: 88, color: '#22c55e' },
    { label: 'W8', value: 92, color: '#22c55e' },
  ];

  private _breakdownData = [
    { title: 'By Severity', items: [
      { label: 'Critical', value: '5', color: '#ef4444' },
      { label: 'High', value: '12', color: '#f97316' },
      { label: 'Medium', value: '28', color: '#eab308' },
      { label: 'Low', value: '22', color: '#22c55e' },
    ]},
    { title: 'By Status', items: [
      { label: 'Open', value: '34', color: '#f97316' },
      { label: 'In Progress', value: '18', color: '#3b82f6' },
      { label: 'Resolved', value: '15', color: '#22c55e' },
    ]},
    { title: 'By Owner', items: [
      { label: 'Security Team', value: '28', color: '#06b6d4' },
      { label: 'Engineering', value: '22', color: '#3b82f6' },
      { label: 'Operations', value: '17', color: '#a855f7' },
    ]},
  ];

  private _activityFeed = [
    { time: '10m', action: 'Created', desc: 'New assessment initiated for Q2 review', user: 'analyst' },
    { time: '1h', action: 'Updated', desc: 'Risk score recalculated after mitigation', user: 'system' },
    { time: '2h', action: 'Flagged', desc: 'Threshold breach detected in monitoring', user: 'scanner' },
    { time: '4h', action: 'Approved', desc: 'Policy change approved by compliance lead', user: 'manager' },
    { time: '8h', action: 'Resolved', desc: 'Critical finding remediated and verified', user: 'engineer' },
    { time: '1d', action: 'Reviewed', desc: 'Quarterly assessment completed successfully', user: 'auditor' },
  ];

  private _mitreTechniques = ['T1059', 'T1078', 'T1566', 'T1190'];

  private _computeRiskScore(item: { id: string; risk: string; status: string }): number {
    const riskW: Record<string, number> = { critical: 40, high: 30, medium: 20, low: 10 };
    const statusW: Record<string, number> = { active: 0, reviewing: -5, flagged: 10, completed: -15, expired: 5 };
    return Math.max(0, Math.min(100, (riskW[item.risk] || 20) + (statusW[item.status] || 0)));
  }

  private _riskColor(score: number): string {
    if (score >= 80) return '#ef4444';
    if (score >= 60) return '#f97316';
    if (score >= 40) return '#eab308';
    return '#22c55e';
  }

  private _riskLabel(score: number): string {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  }

  private _exportData(format: string) {
    const blob = new Blob(['metrics-kpi-dashboard export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'metrics-kpi-dashboard-export.' + (format === 'markdown' ? 'md' : format); a.click();
    URL.revokeObjectURL(url);
    this._showExport = false;
  }

  private _renderExportPanel() {
    return html`<div class="export-panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
        <div style="font-size:13px;font-weight:700">Export Data</div>
        <button class="detail-close" style="background:#374151;border:none;color:#94a3b8;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:11px" @click=${() => { this._showExport = false; }}>\u2715</button>
      </div>
      <div style="display:flex;gap:8px">
        <button class="export-btn" @click=${() => this._exportData('csv')}>CSV</button>
        <button class="export-btn" @click=${() => this._exportData('json')}>JSON</button>
        <button class="export-btn" @click=${() => this._exportData('markdown')}>Markdown</button>
      </div>
    </div>`;
  }

  private _renderPlaybook() {
    const steps: [string, string][] = [
      ['Identify', 'Identify relevant items and scope the analysis'],
      ['Assess', 'Evaluate current state against security requirements'],
      ['Plan', 'Develop prioritized remediation plan'],
      ['Implement', 'Execute remediation actions with proper controls'],
      ['Verify', 'Validate remediation effectiveness through testing'],
      ['Report', 'Document results, metrics, and lessons learned'],
    ];
    return html`<div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Security Metrics & KPI Dashboard Playbook</div>
      ${steps.map((s: [string, string], i: number) => html`
        <div style="display:flex;align-items:center;gap:10px;${i < steps.length - 1 ? 'margin-bottom:4px' : ''}">
          <div class="wizard-num ${i < 3 ? 'done' : i === 3 ? 'active' : ''}">${i < 3 ? '\u2713' : (i + 1).toString()}</div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600;${i === 3 ? 'color:#8b5cf6' : i < 3 ? 'color:#22c55e' : 'color:#6b7280'}">${s[0]}</div>
            <div style="font-size:10px;color:#6b7280">${s[1]}</div>
          </div>
        </div>
      `)}
    </div>`;
  }

  private _renderDecisionTree() {
    const nodes: [string, string][] = [
      ['Is the item high-risk or critical?', 'YES -> Immediate action required | NO -> Standard process'],
      ['Is there an existing control?', 'YES -> Verify effectiveness | NO -> Implement new control'],
      ['Is remediation within SLA?', 'YES -> Continue monitoring | NO -> Escalate to management'],
      ['Is the item recurring?', 'YES -> Automate detection and response | NO -> One-time remediation'],
    ];
    return html`<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Decision Tree</div>
      ${nodes.map((n: [string, string]) => html`
        <div style="margin-bottom:8px">
          <div style="font-size:11px;color:#e2e8f0;font-weight:600">${n[0]}</div>
          <div style="margin-left:20px;font-size:10px;color:#94a3b8;margin-top:2px">${n[1]}</div>
        </div>
      `)}
    </div>`;
  }

  private _renderKPIs() {
    const kpis: [string, string, string, string][] = [
      ['Total Items', '142', '+5', '#3b82f6'],
      ['High Risk', '23', '-2', '#ef4444'],
      ['Compliance Rate', '94%', '+3%', '#22c55e'],
      ['Pending Actions', '12', '-4', '#f97316'],
    ];
    return html`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px">
      ${kpis.map((k: [string, string, string, string]) => html`
        <div style="background:#0f172a;border-radius:8px;padding:12px;border-left:3px solid ${k[3]}">
          <div style="font-size:10px;color:#6b7280;text-transform:uppercase">${k[0]}</div>
          <div style="font-size:20px;font-weight:700;color:${k[3]}">${k[1]}</div>
          <div style="font-size:10px;color:${k[2].startsWith('+') ? '#22c55e' : '#ef4444'}">${k[2].startsWith('+') ? '\u25B2' : '\u25BC'} ${k[2]} vs last period</div>
        </div>
      `)}
    </div>`;
  }

  private _renderHeatmap() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const heatColor = (v: number) => v >= 10 ? '#ef4444' : v >= 7 ? '#f97316' : v >= 4 ? '#eab308' : v >= 2 ? '#22c55e80' : '#22c55e30';
    const grouped: { day: string; hours: { hour: number; value: number }[] }[] = [];
    for (const d of days) {
      const hours: { hour: number; value: number }[] = [];
      for (let h = 0; h < 24; h++) {
        const base = (h >= 8 && h <= 18) ? 5 : 1;
        const wknd = (d === 'Sat' || d === 'Sun') ? 0.3 : 1;
        hours.push({ hour: h, value: Math.round((base + Math.random() * 8) * wknd) });
      }
      grouped.push({ day: d, hours });
    }
    return html`<div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Activity Heatmap</div>
      <div style="display:flex;gap:4px;align-items:center;margin-bottom:4px">
        <span style="width:30px;font-size:9px;color:#6b7280"></span>
        ${Array.from({ length: 24 }, (_, i) => html`<div style="flex:1;text-align:center;font-size:8px;color:#6b7280">${i}</div>`)}
      </div>
      ${grouped.map(d => html`<div style="display:flex;gap:4px;align-items:center;margin-bottom:2px">
        <span style="width:30px;font-size:9px;color:#6b7280">${d.day}</span>
        ${d.hours.map(h => html`<div class="heatmap-cell" style="flex:1;background:${heatColor(h.value)}" title="${d.day} ${h.hour}:00 - ${h.value} events"></div>`)}
      </div>`)}
      <div style="display:flex;gap:8px;margin-top:6px;font-size:9px;color:#6b7280;align-items:center">
        <span>Low</span><div style="width:12px;height:8px;border-radius:2px;background:#22c55e30"></div>
        <div style="width:12px;height:8px;border-radius:2px;background:#eab308"></div>
        <div style="width:12px;height:8px;border-radius:2px;background:#ef4444"></div><span>High</span>
      </div>
    </div>`;
  }

  private _approvalQueue = [
    { id: 'APR-001', item: 'Review pending', requestor: 'Team Lead', action: 'Approve changes', status: 'pending', submittedAt: '2026-04-21T10:00:00' },
    { id: 'APR-002', item: 'Policy update', requestor: 'Compliance', action: 'Update document', status: 'pending', submittedAt: '2026-04-20T14:00:00' },
    { id: 'APR-003', item: 'Access request', requestor: 'IT Ops', action: 'Grant access', status: 'approved', submittedAt: '2026-04-19T09:00:00' },
  ];

  private _renderApprovalWorkflow() {
    const pending = this._approvalQueue.filter(a => a.status === 'pending');
    const resolved = this._approvalQueue.filter(a => a.status !== 'pending');
    return html`<div class="approval-modal">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">Approval Queue (${pending.length} pending)</div>
      ${pending.map(a => html`<div style="background:#1f2937;border-radius:8px;padding:10px;margin-bottom:8px;border-left:3px solid #f97316">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-weight:600;font-size:12px">${a.id}: ${a.action}</div>
          <div style="font-size:10px;color:#6b7280;margin-top:2px">By: ${a.requestor} | ${a.submittedAt}</div></div>
          <div style="display:flex;gap:4px">
            <button class="export-btn" style="border-color:#22c55e;color:#22c55e;padding:4px 10px" @click=${() => { a.status = 'approved'; this.requestUpdate(); }}>Approve</button>
            <button class="export-btn" style="border-color:#ef4444;color:#ef4444;padding:4px 10px" @click=${() => { a.status = 'rejected'; this.requestUpdate(); }}>Reject</button>
          </div>
        </div>
      </div>`)}
      ${resolved.map(a => html`<div style="background:#1f2937;border-radius:6px;padding:8px;margin-bottom:4px;opacity:0.6">
        <div style="display:flex;justify-content:space-between;font-size:11px"><span>${a.id}: ${a.action}</span>
        <span style="color:${a.status === 'approved' ? '#22c55e' : '#ef4444'}">${a.status}</span></div>
      </div>`)}
    </div>`;
  }

  private _renderRiskScoringTable() {
    const items = this._items || [];
    return html`<div class="approval-modal">
      <div style="font-size:13px;font-weight:700;margin-bottom:12px">Risk Scoring Analysis</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr><th style="text-align:left;padding:6px 8px;background:#0f172a;color:#94a3b8;font-size:9px;text-transform:uppercase;border-bottom:1px solid #374151">Item</th><th style="text-align:left;padding:6px 8px;background:#0f172a;color:#94a3b8;font-size:9px;text-transform:uppercase;border-bottom:1px solid #374151">Score</th><th style="text-align:left;padding:6px 8px;background:#0f172a;color:#94a3b8;font-size:9px;text-transform:uppercase;border-bottom:1px solid #374151">Level</th></tr></thead>
        <tbody>${items.map((item: { id: string; name: string; risk: string; status: string }) => {
          const score = this._computeRiskScore(item);
          return html`<tr><td style="padding:6px 8px;border-bottom:1px solid #1f2937">${item.name}</td>
            <td style="padding:6px 8px;border-bottom:1px solid #1f2937"><div style="display:flex;align-items:center;gap:6px">
              <span style="font-weight:700;color:${this._riskColor(score)}">${score}</span>
              <div class="risk-bar-track"><div class="risk-bar-fill" style="width:${score}%;background:${this._riskColor(score)}"></div></div></div></td>
            <td style="padding:6px 8px;border-bottom:1px solid #1f2937"><span style="color:${this._riskColor(score)};font-size:10px;font-weight:600">${this._riskLabel(score)}</span></td></tr>`;
        })}</tbody></table>
    </div>`;
  }

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
        record.findings = this._items.filter((x: any) => x.risk && x.risk !== 'low').length;
        record.criticalCount = this._items.filter((x: any) => x.risk === 'critical').length;
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
    this._items.forEach((item: any) => { const r = item.risk; if (riskDist[r] !== undefined) riskDist[r]++; else riskDist.medium++; });
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
    const data = this._items.slice(0, 10).map((item: any, i: number) => ({ name: (item.name || item.title || item.id || 'Item ' + i).substring(0, 8), score: ({critical: 10, high: 7, medium: 4, low: 1}}}}) as any)[item.risk]) || 2, risk: item.risk || 'medium' }));
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
    { id: 'wt-1', title: 'Review Metrics Kpi Dashboard finding #1', status: 'active', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T12:00:00Z', priority: 'p1', createdAt: '2026-04-23T00:00:00Z', completedAt: null },
    { id: 'wt-2', title: 'Remediate critical endpoint misconfiguration', status: 'pending', assignee: 'security-eng', blockedBy: ['wt-1'], slaDeadline: '2026-04-23T16:00:00Z', priority: 'p1', createdAt: '2026-04-23T02:00:00Z', completedAt: null },
    { id: 'wt-3', title: 'Update Metrics Kpi Dashboard detection rules', status: 'blocked', assignee: 'soc-tier2', blockedBy: ['wt-2'], slaDeadline: '2026-04-24T00:00:00Z', priority: 'p2', createdAt: '2026-04-23T03:00:00Z', completedAt: null },
    { id: 'wt-4', title: 'Generate compliance report', status: 'pending', assignee: 'compliance', blockedBy: [], slaDeadline: '2026-04-24T08:00:00Z', priority: 'p3', createdAt: '2026-04-23T04:00:00Z', completedAt: null },
    { id: 'wt-5', title: 'Validate remediation for finding #6', status: 'completed', assignee: 'security-eng', blockedBy: [], slaDeadline: '2026-04-23T10:00:00Z', priority: 'p2', createdAt: '2026-04-22T18:00:00Z', completedAt: '2026-04-23T08:00:00Z' },
    { id: 'wt-6', title: 'Notify stakeholders of findings', status: 'completed', assignee: 'manager', blockedBy: [], slaDeadline: '2026-04-23T06:00:00Z', priority: 'p3', createdAt: '2026-04-22T20:00:00Z', completedAt: '2026-04-23T04:00:00Z' },
    { id: 'wt-7', title: 'Schedule follow-up scan', status: 'pending', assignee: 'ops', blockedBy: ['wt-2'], slaDeadline: '2026-04-25T00:00:00Z', priority: 'p4', createdAt: '2026-04-23T05:00:00Z', completedAt: null },
    { id: 'wt-8', title: 'Archive resolved Metrics Kpi Dashboard findings', status: 'failed', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T08:00:00Z', priority: 'p4', createdAt: '2026-04-22T22:00:00Z', completedAt: null },
  ];

  private _executionHistory: ExecutionRecord[] = [
    {
      id: 'exec-1', name: 'Metrics Kpi Dashboard Full Assessment Run', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:12:00Z', status: 'success',
      steps: [
        { id: 's1', name: 'Validate Scope', status: 'success', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:00:30Z', duration: 30, output: 'Scope validated: 142 targets' },
        { id: 's2', name: 'Collect Evidence', status: 'success', startedAt: '2026-04-22T10:00:30Z', completedAt: '2026-04-22T10:06:00Z', duration: 330, output: '1,847 events collected from 12 sources' },
        { id: 's3', name: 'Analyze Patterns', status: 'success', startedAt: '2026-04-22T10:06:00Z', completedAt: '2026-04-22T10:10:00Z', duration: 240, output: '23 patterns identified, 7 correlated' },
        { id: 's4', name: 'Generate Report', status: 'success', startedAt: '2026-04-22T10:10:00Z', completedAt: '2026-04-22T10:12:00Z', duration: 120, output: 'Report generated: 10 findings, 3 critical' },
      ],
    },
    {
      id: 'exec-2', name: 'Metrics Kpi Dashboard Delta Scan', startedAt: '2026-04-23T02:00:00Z', completedAt: '2026-04-23T02:05:00Z', status: 'failed',
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
      id: 'exec-' + Date.now(), name: 'Metrics Kpi Dashboard Assessment ' + new Date().toISOString().slice(0, 10), startedAt: new Date().toISOString(), completedAt: null, status: 'running', steps,
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
        ` : html`<div class="empty-state">Click "Run Assessment" to start the Metrics Kpi Dashboard analysis pipeline</div>`}
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
              const a = document.createElement('a'); a.href = url; a.download = 'metrics-kpi-dashboard-config.json'; a.click();
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
          <input class="search-box" type="text" placeholder="Add a comment..." style="min-width:auto;flex:1;" id="metrics-kpi-dashboard-comment-input" />
          <button class="btn primary" @click=${() => {
            const input = this.shadowRoot?.querySelector('#metrics-kpi-dashboard-comment-input') as HTMLInputElement;
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


  // ─── Incident Post-Mortem Engine ───
  @state() private _pmActiveTab: string = 'timeline';
  @state() private _pmIncidents: Array<{ id: string; title: string; severity: string; date: string; status: string; rootCause: string; rcaMethod: string; timeline: Array<{ time: string; event: string; actor: string }>; impactMatrix: Array<{ dimension: string; score: number; description: string }>; actionItems: Array<{ id: string; title: string; owner: string; priority: string; status: string; dueDate: string }>; lessonsLearned: string[] }> = [];
  @state() private _pmSelectedIncident: string = '';
  @state() private _pmFishboneCategories: string[] = ['People', 'Process', 'Technology', 'Environment', 'Communication', 'External'];
  @state() private _pmFiveWhysResults: string[] = [];
  @state() private _pmReportFormat: string = 'detailed';

  private _initPostMortem(): void {
    if (this._pmIncidents.length > 0) return;
    this._pmIncidents = [
      {
        id: 'PM-2024-001', title: 'Ransomware Attack on File Servers', severity: 'critical',
        date: '2024-03-15', status: 'completed', rootCause: 'Unpatched VPN gateway + weak MFA',
        rcaMethod: '5-Whys',
        timeline: [
          { time: '03:12', event: 'Initial compromise via VPN vulnerability CVE-2024-1234', actor: 'APT-29' },
          { time: '03:45', event: 'Lateral movement to file server cluster', actor: 'APT-29' },
          { time: '04:02', event: 'Data exfiltration initiated (2.3 TB)', actor: 'APT-29' },
          { time: '04:30', event: 'Ransomware payload deployed across 14 servers', actor: 'APT-29' },
          { time: '05:15', event: 'SOC detected anomalous network traffic spike', actor: 'SOC Analyst' },
          { time: '05:30', event: 'Incident response team activated', actor: 'IR Lead' },
          { time: '06:00', event: 'Network segmentation completed', actor: 'Network Ops' },
          { time: '08:45', event: 'Containment achieved, forensic imaging started', actor: 'Forensic Team' },
        ],
        impactMatrix: [
          { dimension: 'Financial', score: 9, description: 'Estimated $4.2M in downtime, recovery, and regulatory fines' },
          { dimension: 'Operational', score: 8, description: '14 servers offline for 72 hours, 200+ users affected' },
          { dimension: 'Reputational', score: 7, description: 'Customer notification required, media coverage risk' },
          { dimension: 'Compliance', score: 6, description: 'GDPR breach notification, PCI-DSS audit triggered' },
          { dimension: 'Data Integrity', score: 9, description: '15% of encrypted files had no backup, permanent data loss' },
        ],
        actionItems: [
          { id: 'AI-001', title: 'Patch all VPN gateways to latest firmware', owner: 'Network Team', priority: 'critical', status: 'completed', dueDate: '2024-03-20' },
          { id: 'AI-002', title: 'Implement hardware MFA for all VPN users', owner: 'Identity Team', priority: 'critical', status: 'completed', dueDate: '2024-03-25' },
          { id: 'AI-003', title: 'Deploy network detection rules for lateral movement', owner: 'SOC', priority: 'high', status: 'in-progress', dueDate: '2024-04-01' },
          { id: 'AI-004', title: 'Review and update incident response playbook', owner: 'IR Lead', priority: 'high', status: 'pending', dueDate: '2024-04-15' },
          { id: 'AI-005', title: 'Implement immutable backups for critical file servers', owner: 'Backup Ops', priority: 'critical', status: 'completed', dueDate: '2024-03-22' },
        ],
        lessonsLearned: [
          'VPN gateway patching cycle was 90 days instead of the required 14 days',
          'MFA bypass was possible because SMS-based OTP was still allowed',
          'Network segmentation between DMZ and internal network was insufficient',
          'SOC lacked automated detection rules for lateral movement patterns',
          'Backup verification testing had not been performed in 6 months',
        ],
      },
      {
        id: 'PM-2024-002', title: 'Phishing Campaign Targeting Finance Team', severity: 'high',
        date: '2024-04-02', status: 'in-review', rootCause: 'Lack of URL sandboxing for email attachments',
        rcaMethod: 'Fishbone',
        timeline: [
          { time: '09:15', event: 'Spear-phishing email sent to 12 finance team members', actor: 'Threat Actor' },
          { time: '09:22', event: '3 users clicked malicious link in email', actor: 'Finance Staff' },
          { time: '09:25', event: 'Credential harvesting form submitted by 2 users', actor: 'Threat Actor' },
          { time: '09:45', event: 'Email gateway flagged campaign as spam (delayed)', actor: 'Email Gateway' },
          { time: '10:00', event: 'SOC received alert on suspicious login from new geolocation', actor: 'SOC Analyst' },
          { time: '10:15', event: 'Compromised accounts identified and locked', actor: 'Identity Team' },
        ],
        impactMatrix: [
          { dimension: 'Financial', score: 4, description: 'No direct financial loss, remediation cost estimated at $15K' },
          { dimension: 'Operational', score: 5, description: '2 accounts locked for 4 hours during investigation' },
          { dimension: 'Reputational', score: 2, description: 'Internal incident, no external disclosure needed' },
          { dimension: 'Compliance', score: 3, description: 'Minor policy violation, no regulatory impact' },
          { dimension: 'Data Integrity', score: 2, description: 'No data exfiltration detected' },
        ],
        actionItems: [
          { id: 'AI-010', title: 'Deploy URL sandboxing for all email attachments', owner: 'Email Admin', priority: 'high', status: 'in-progress', dueDate: '2024-04-20' },
          { id: 'AI-011', title: 'Mandatory anti-phishing training for finance team', owner: 'Security Awareness', priority: 'high', status: 'completed', dueDate: '2024-04-10' },
          { id: 'AI-012', title: 'Implement conditional access policies for finance apps', owner: 'Identity Team', priority: 'medium', status: 'pending', dueDate: '2024-05-01' },
        ],
        lessonsLearned: [
          'Email gateway sandboxing was disabled due to performance concerns',
          'Finance team had not received targeted phishing training in 12 months',
          'Geolocation-based anomaly detection had a 15-minute delay',
        ],
      },
      {
        id: 'PM-2024-003', title: 'Insider Data Exfiltration via Cloud Storage', severity: 'critical',
        date: '2024-04-10', status: 'completed', rootCause: 'Excessive cloud storage permissions + no DLP',
        rcaMethod: '5-Whys',
        timeline: [
          { time: '14:00', event: 'Employee uploaded 45GB of sensitive documents to personal cloud', actor: 'Insider' },
          { time: '14:30', event: 'DLP alert triggered on bulk upload (previously disabled)', actor: 'DLP System' },
          { time: '15:00', event: 'Security team initiated investigation', actor: 'Investigator' },
          { time: '16:00', event: 'Employee account suspended pending HR review', actor: 'Security Lead' },
          { time: '17:00', event: 'Legal team engaged for data breach assessment', actor: 'Legal Counsel' },
        ],
        impactMatrix: [
          { dimension: 'Financial', score: 7, description: 'Potential IP theft valued at $8M, legal costs TBD' },
          { dimension: 'Operational', score: 3, description: 'One account suspended, minimal operational disruption' },
          { dimension: 'Reputational', score: 6, description: 'Client trust impact if data reaches competitors' },
          { dimension: 'Compliance', score: 8, description: 'Multiple regulatory violations, potential fines' },
          { dimension: 'Data Integrity', score: 8, description: 'Trade secrets and client PII were exfiltrated' },
        ],
        actionItems: [
          { id: 'AI-020', title: 'Re-enable and tune DLP policies for cloud storage uploads', owner: 'DLP Admin', priority: 'critical', status: 'completed', dueDate: '2024-04-12' },
          { id: 'AI-021', title: 'Implement just-in-time access for sensitive document repositories', owner: 'IAM Team', priority: 'critical', status: 'in-progress', dueDate: '2024-04-25' },
          { id: 'AI-022', title: 'Deploy user behavior analytics for anomaly detection', owner: 'SOC', priority: 'high', status: 'pending', dueDate: '2024-05-10' },
        ],
        lessonsLearned: [
          'DLP policies were disabled 3 months ago without proper change approval',
          'Cloud storage permissions followed allow-all default rather than least-privilege',
          'No automated alerting for bulk uploads to external cloud services',
        ],
      },
    ];
    this._pmSelectedIncident = this._pmIncidents[0]?.id || '';
    this._pmFiveWhysResults = [
      'Why did the breach occur? -> Unpatched VPN gateway vulnerability was exploited',
      'Why was the VPN unpatched? -> Patching cycle was set to 90 days, not 14-day critical path',
      'Why was the patching cycle 90 days? -> Change management process required extensive testing',
      'Why was extensive testing required? -> Previous patch caused service disruption',
      'Why did previous patch cause disruption? -> No staging environment for pre-deployment validation',
    ];
  }

  private _getPmSelectedIncident() {
    return this._pmIncidents.find(i => i.id === this._pmSelectedIncident) || this._pmIncidents[0];
  }

  private _getPmSeverityColor(severity: string): string {
    return severity === 'critical' ? '#ff4757' : severity === 'high' ? '#ff6b35' : severity === 'medium' ? '#ffa502' : '#2ed573';
  }

  private _getPmActionCompletionRate(incident: typeof this._pmIncidents[0]): number {
    if (!incident || incident.actionItems.length === 0) return 0;
    return Math.round((incident.actionItems.filter(a => a.status === 'completed').length / incident.actionItems.length) * 100);
  }

  private _getPmAvgImpactScore(incident: typeof this._pmIncidents[0]): number {
    if (!incident || incident.impactMatrix.length === 0) return 0;
    return Math.round(incident.impactMatrix.reduce((s, m) => s + m.score, 0) / incident.impactMatrix.length * 10) / 10;
  }

  private _getPmTotalActionItems(): { total: number; completed: number; inProgress: number; pending: number } {
    const all = this._pmIncidents.flatMap(i => i.actionItems);
    return {
      total: all.length,
      completed: all.filter(a => a.status === 'completed').length,
      inProgress: all.filter(a => a.status === 'in-progress').length,
      pending: all.filter(a => a.status === 'pending').length,
    };
  }

  // ─── Security Metrics Benchmarking ───
  @state() private _benchActiveTab: string = 'overview';
  @state() private _benchSelectedFramework: string = 'cis';
  @state() private _benchMaturityData: Array<{ domain: string; currentLevel: number; targetLevel: number; industryAvg: number; gaps: string[] }> = [];
  @state() private _benchPeerComparison: Array<{ metric: string; ourValue: number; peerAvg: number; peerBest: number; industryStd: number; unit: string }> = [];
  @state() private _benchTrendData: Array<{ month: string; score: number; benchmark: number }> = [];

  private _initBenchmarking(): void {
    if (this._benchMaturityData.length > 0) return;
    this._benchMaturityData = [
      { domain: 'Governance & Risk', currentLevel: 4, targetLevel: 5, industryAvg: 3.2, gaps: ['Formal risk quantification not fully adopted', 'Board reporting cadence needs improvement'] },
      { domain: 'Identity & Access', currentLevel: 3, targetLevel: 4, industryAvg: 2.8, gaps: ['MFA coverage at 78%, target 95%', 'Privileged access review cycle too long'] },
      { domain: 'Data Protection', currentLevel: 3, targetLevel: 5, industryAvg: 2.5, gaps: ['DLP policies need tuning', 'Data classification incomplete for cloud workloads'] },
      { domain: 'Threat Detection', currentLevel: 4, targetLevel: 5, industryAvg: 3.0, gaps: ['MITRE ATT&CK coverage at 65%', 'Automated response playbooks need expansion'] },
      { domain: 'Vulnerability Mgmt', currentLevel: 3, targetLevel: 4, industryAvg: 2.9, gaps: ['Mean time to patch critical: 18 days (target: 7)', 'Asset inventory incomplete'] },
      { domain: 'Incident Response', currentLevel: 4, targetLevel: 5, industryAvg: 3.1, gaps: ['Tabletop exercises quarterly instead of monthly', 'Forensic capability gaps for cloud environments'] },
    ];
    this._benchPeerComparison = [
      { metric: 'Mean Time to Detect (MTTD)', ourValue: 4.2, peerAvg: 12.5, peerBest: 1.8, industryStd: 8.0, unit: 'hours' },
      { metric: 'Mean Time to Respond (MTTR)', ourValue: 2.1, peerAvg: 8.3, peerBest: 0.5, industryStd: 4.0, unit: 'hours' },
      { metric: 'Patch Compliance (Critical)', ourValue: 78, peerAvg: 65, peerBest: 98, industryStd: 80, unit: '%' },
      { metric: 'Phishing Click Rate', ourValue: 3.2, peerAvg: 12.5, peerBest: 0.8, industryStd: 8.0, unit: '%' },
      { metric: 'Vulnerability Backlog (Critical)', ourValue: 12, peerAvg: 45, peerBest: 2, industryStd: 25, unit: 'count' },
      { metric: 'Security Awareness Score', ourValue: 82, peerAvg: 68, peerBest: 96, industryStd: 75, unit: '%' },
      { metric: 'MFA Adoption Rate', ourValue: 78, peerAvg: 62, peerBest: 100, industryStd: 85, unit: '%' },
      { metric: 'Endpoint Compliance', ourValue: 91, peerAvg: 78, peerBest: 99, industryStd: 85, unit: '%' },
    ];
    this._benchTrendData = [
      { month: '2024-01', score: 62, benchmark: 58 },
      { month: '2024-02', score: 65, benchmark: 59 },
      { month: '2024-03', score: 61, benchmark: 60 },
      { month: '2024-04', score: 68, benchmark: 61 },
      { month: '2024-05', score: 72, benchmark: 62 },
      { month: '2024-06', score: 74, benchmark: 63 },
      { month: '2024-07', score: 73, benchmark: 64 },
      { month: '2024-08', score: 76, benchmark: 65 },
      { month: '2024-09', score: 79, benchmark: 66 },
      { month: '2024-10', score: 81, benchmark: 67 },
      { month: '2024-11', score: 83, benchmark: 68 },
      { month: '2024-12', score: 85, benchmark: 69 },
    ];
  }

  private _getBenchOverallMaturity(): number {
    if (this._benchMaturityData.length === 0) return 0;
    return Math.round(this._benchMaturityData.reduce((s, d) => s + d.currentLevel, 0) / this._benchMaturityData.length * 10) / 10;
  }

  private _getBenchTargetMaturity(): number {
    if (this._benchMaturityData.length === 0) return 0;
    return Math.round(this._benchMaturityData.reduce((s, d) => s + d.targetLevel, 0) / this._benchMaturityData.length * 10) / 10;
  }

  private _getBenchTotalGaps(): number {
    return this._benchMaturityData.reduce((s, d) => s + d.gaps.length, 0);
  }

  private _getBenchOutperformingMetrics(): number {
    return this._benchPeerComparison.filter(m => m.ourValue > m.peerAvg).length;
  }

  private _getBenchMaturityLevelLabel(level: number): string {
    const labels = ['', 'Initial', 'Developing', 'Defined', 'Managed', 'Optimizing'];
    return labels[level] || 'Unknown';
  }

  private _getBenchMaturityColor(level: number): string {
    if (level >= 4) return '#2ed573';
    if (level >= 3) return '#ffa502';
    if (level >= 2) return '#ff6b35';
    return '#ff4757';
  }

  private _getBenchScoreTrend(): string {
    if (this._benchTrendData.length < 2) return 'neutral';
    const recent = this._benchTrendData.slice(-3);
    const first = recent[0].score;
    const last = recent[recent.length - 1].score;
    if (last > first + 3) return 'improving';
    if (last < first - 3) return 'declining';
    return 'stable';
  }

  // ─── Alert Triage & Enrichment ───
  @state() private _triageActiveView: string = 'queue';
  @state() private _triageAlerts: Array<{ id: string; title: string; severity: string; source: string; status: string; score: number; confidence: number; enrichment: { iocCount: number; relatedAlerts: number; assetCriticality: string; threatIntelHits: number; mitreTactics: string[] }; assignedTo: string; created: string; enrichedAt: string }> = [];
  @state() private _triageRoutingRules: Array<{ id: string; name: string; condition: string; action: string; enabled: boolean }> = [];
  @state() private _triageEscalationPolicy: Array<{ level: number; threshold: string; notify: string; autoAction: string }> = [];

  private _initTriage(): void {
    if (this._triageAlerts.length > 0) return;
    this._triageAlerts = [
      { id: 'ALT-001', title: 'Brute force login attempt detected', severity: 'high', source: 'SIEM', status: 'new', score: 85, confidence: 92,
        enrichment: { iocCount: 3, relatedAlerts: 2, assetCriticality: 'high', threatIntelHits: 5, mitreTactics: ['TA0006', 'TA0001'] }, assignedTo: '', created: '2024-04-15T09:12:00Z', enrichedAt: '2024-04-15T09:12:05Z' },
      { id: 'ALT-002', title: 'Suspicious PowerShell execution on workstation', severity: 'critical', source: 'EDR', status: 'investigating', score: 95, confidence: 88,
        enrichment: { iocCount: 7, relatedAlerts: 5, assetCriticality: 'critical', threatIntelHits: 12, mitreTactics: ['TA0002', 'TA0005', 'TA0003'] }, assignedTo: 'SOC-L1-John', created: '2024-04-15T08:45:00Z', enrichedAt: '2024-04-15T08:45:03Z' },
      { id: 'ALT-003', title: 'Anomalous data transfer to external IP', severity: 'high', source: 'NDR', status: 'escalated', score: 88, confidence: 76,
        enrichment: { iocCount: 4, relatedAlerts: 3, assetCriticality: 'high', threatIntelHits: 8, mitreTactics: ['TA0010', 'TA0009'] }, assignedTo: 'SOC-L2-Sarah', created: '2024-04-15T07:30:00Z', enrichedAt: '2024-04-15T07:30:08Z' },
      { id: 'ALT-004', title: 'Failed SSL certificate validation', severity: 'low', source: 'Proxy', status: 'resolved', score: 25, confidence: 95,
        enrichment: { iocCount: 0, relatedAlerts: 0, assetCriticality: 'low', threatIntelHits: 0, mitreTactics: [] }, assignedTo: 'SOC-L1-Mike', created: '2024-04-15T06:15:00Z', enrichedAt: '2024-04-15T06:15:02Z' },
      { id: 'ALT-005', title: 'Privileged account used from new location', severity: 'critical', source: 'IAM', status: 'new', score: 92, confidence: 84,
        enrichment: { iocCount: 5, relatedAlerts: 4, assetCriticality: 'critical', threatIntelHits: 9, mitreTactics: ['TA0006', 'TA0001'] }, assignedTo: '', created: '2024-04-15T10:00:00Z', enrichedAt: '2024-04-15T10:00:04Z' },
      { id: 'ALT-006', title: 'Malware signature match on email attachment', severity: 'medium', source: 'Email GW', status: 'auto-contained', score: 72, confidence: 98,
        enrichment: { iocCount: 2, relatedAlerts: 1, assetCriticality: 'medium', threatIntelHits: 15, mitreTactics: ['TA0001'] }, assignedTo: 'Auto-Remediation', created: '2024-04-15T09:30:00Z', enrichedAt: '2024-04-15T09:30:01Z' },
    ];
    this._triageRoutingRules = [
      { id: 'RR-001', name: 'Critical Alert to SOC L2', condition: 'severity == critical AND score >= 90', action: 'Assign to SOC-L2 on-call', enabled: true },
      { id: 'RR-002', name: 'Threat Intel Match Enrichment', condition: 'threatIntelHits > 0', action: 'Auto-enrich with CTI context', enabled: true },
      { id: 'RR-003', name: 'Low Confidence Auto-Close', condition: 'confidence < 30 AND severity == low', action: 'Auto-close with note after 24h', enabled: true },
      { id: 'RR-004', name: 'Related Alert Grouping', condition: 'relatedAlerts > 2', action: 'Group as incident and notify IR lead', enabled: true },
      { id: 'RR-005', name: 'VIP Asset Escalation', condition: 'assetCriticality == critical AND severity >= high', action: 'Page on-call security engineer', enabled: false },
    ];
    this._triageEscalationPolicy = [
      { level: 1, threshold: 'No response in 15 minutes', notify: 'SOC L1 team chat', autoAction: 'Reassign to next available analyst' },
      { level: 2, threshold: 'No response in 30 minutes', notify: 'SOC L2 on-call via SMS', autoAction: 'Escalate to L2 queue' },
      { level: 3, threshold: 'No response in 60 minutes', notify: 'Security Manager + CISO', autoAction: 'Page on-call incident commander' },
      { level: 4, threshold: 'Active threat confirmed', notify: 'Executive team', autoAction: 'Activate full incident response' },
    ];
  }

  private _getTriageStats(): { total: number; newCount: number; investigating: number; escalated: number; resolved: number; autoContained: number } {
    return {
      total: this._triageAlerts.length,
      newCount: this._triageAlerts.filter(a => a.status === 'new').length,
      investigating: this._triageAlerts.filter(a => a.status === 'investigating').length,
      escalated: this._triageAlerts.filter(a => a.status === 'escalated').length,
      resolved: this._triageAlerts.filter(a => a.status === 'resolved').length,
      autoContained: this._triageAlerts.filter(a => a.status === 'auto-contained').length,
    };
  }

  private _getTriageAvgScore(): number {
    if (this._triageAlerts.length === 0) return 0;
    return Math.round(this._triageAlerts.reduce((s, a) => s + a.score, 0) / this._triageAlerts.length);
  }

  private _getTriageHighConfidence(): number {
    return this._triageAlerts.filter(a => a.confidence >= 85).length;
  }

  private _getTriageTopSource(): string {
    if (this._triageAlerts.length === 0) return 'N/A';
    const counts: Record<string, number> = {};
    this._triageAlerts.forEach(a => { counts[a.source] = (counts[a.source] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  private _getTriageActiveRoutingRules(): number {
    return this._triageRoutingRules.filter(r => r.enabled).length;
  }

  // ─── Security Architecture Review ───
  @state() private _archActiveSection: string = 'components';
  @state() private _archComponents: Array<{ id: string; name: string; category: string; trustZone: string; controls: string[]; status: string; lastReview: string; riskScore: number }> = [];
  @state() private _archTrustBoundaries: Array<{ id: string; name: string; from: string; to: string; controlType: string; enforcement: string; status: string }> = [];
  @state() private _archDecisionRecords: Array<{ id: string; title: string; date: string; status: string; context: string; decision: string; consequences: string }> = [];

  private _initArchitecture(): void {
    if (this._archComponents.length > 0) return;
    this._archComponents = [
      { id: 'AC-001', name: 'Web Application Firewall', category: 'Network Security', trustZone: 'DMZ', controls: ['OWASP CRS', 'Rate Limiting', 'Bot Detection', 'Geo-blocking'], status: 'active', lastReview: '2024-04-01', riskScore: 2 },
      { id: 'AC-002', name: 'Identity Provider (IdP)', category: 'Identity & Access', trustZone: 'Internal', controls: ['SAML 2.0', 'OIDC', 'MFA', 'Adaptive Auth', 'SSO'], status: 'active', lastReview: '2024-03-15', riskScore: 3 },
      { id: 'AC-003', name: 'Data Loss Prevention', category: 'Data Protection', trustZone: 'Internal', controls: ['Content Inspection', 'Endpoint Agent', 'Cloud API Integration', 'Encryption'], status: 'needs-review', lastReview: '2024-01-20', riskScore: 7 },
      { id: 'AC-004', name: 'SIEM Platform', category: 'Detection & Response', trustZone: 'SOC', controls: ['Log Aggregation', 'Correlation Rules', 'Threat Intel Feed', 'SOAR Integration'], status: 'active', lastReview: '2024-03-28', riskScore: 4 },
      { id: 'AC-005', name: 'Container Security Platform', category: 'Cloud Security', trustZone: 'Cloud', controls: ['Image Scanning', 'Runtime Protection', 'Network Policy', 'Secrets Management'], status: 'active', lastReview: '2024-04-05', riskScore: 3 },
      { id: 'AC-006', name: 'Zero Trust Network Access', category: 'Network Security', trustZone: 'Perimeter', controls: ['Micro-segmentation', 'Continuous Verification', 'Least Privilege Access', 'Device Trust'], status: 'implementing', lastReview: '2024-04-10', riskScore: 5 },
    ];
    this._archTrustBoundaries = [
      { id: 'TB-001', name: 'Internet to DMZ', from: 'External', to: 'DMZ', controlType: 'WAF + DDoS Protection', enforcement: 'Active', status: 'enforced' },
      { id: 'TB-002', name: 'DMZ to Internal', from: 'DMZ', to: 'Internal', controlType: 'Application Layer Firewall', enforcement: 'Active', status: 'enforced' },
      { id: 'TB-003', name: 'Internal to SOC', from: 'Internal', to: 'SOC', controlType: 'Role-Based Access + Network Segmentation', enforcement: 'Active', status: 'enforced' },
      { id: 'TB-004', name: 'Internal to Cloud', from: 'Internal', to: 'Cloud', controlType: 'CASB + Zero Trust', enforcement: 'Partial', status: 'partial' },
      { id: 'TB-005', name: 'Partner to Internal', from: 'External', to: 'Internal', controlType: 'VPN + MFA + Limited Access', enforcement: 'Active', status: 'needs-review' },
    ];
    this._archDecisionRecords = [
      { id: 'ADR-001', title: 'Adopt Zero Trust Architecture', date: '2024-01-15', status: 'accepted', context: 'VPN-based perimeter security is insufficient for hybrid workforce', decision: 'Implement ZTNA with micro-segmentation across all network zones', consequences: 'Reduced lateral movement risk, increased authentication friction' },
      { id: 'ADR-002', title: 'Migrate SIEM to Cloud-Native Platform', date: '2024-02-20', status: 'accepted', context: 'On-prem SIEM cannot scale to handle cloud log volume', decision: 'Migrate to cloud-native SIEM with 90-day retention', consequences: 'Better scalability, dependency on cloud provider uptime' },
      { id: 'ADR-003', title: 'Deploy Runtime Container Security', date: '2024-03-10', status: 'accepted', context: 'Static image scanning misses runtime threats and supply chain attacks', decision: 'Deploy eBPF-based runtime security agent in all Kubernetes clusters', consequences: 'Improved threat detection, minimal performance overhead' },
    ];
  }

  private _getArchComponentStats(): { total: number; active: number; needsReview: number; implementing: number; avgRisk: number } {
    const active = this._archComponents.filter(c => c.status === 'active').length;
    const needsReview = this._archComponents.filter(c => c.status === 'needs-review').length;
    const implementing = this._archComponents.filter(c => c.status === 'implementing').length;
    const avgRisk = this._archComponents.length > 0
      ? Math.round(this._archComponents.reduce((s, c) => s + c.riskScore, 0) / this._archComponents.length * 10) / 10 : 0;
    return { total: this._archComponents.length, active, needsReview, implementing, avgRisk };
  }

  private _getArchBoundaryStats(): { total: number; enforced: number; partial: number; needsReview: number } {
    return {
      total: this._archTrustBoundaries.length,
      enforced: this._archTrustBoundaries.filter(b => b.status === 'enforced').length,
      partial: this._archTrustBoundaries.filter(b => b.status === 'partial').length,
      needsReview: this._archTrustBoundaries.filter(b => b.status === 'needs-review').length,
    };
  }

  private _getArchControlCoverage(): number {
    if (this._archComponents.length === 0) return 0;
    const totalControls = this._archComponents.reduce((s, c) => s + c.controls.length, 0);
    return totalControls;
  }

  // ─── Continuous Monitoring Suite ───
  @state() private _monActiveView: string = 'dashboard';
  @state() private _monMetricGauges: Array<{ id: string; name: string; value: number; max: number; unit: string; status: string; trend: string }> = [];
  @state() private _monAnomalyStream: Array<{ id: string; timestamp: string; type: string; description: string; severity: string; source: string; status: string }> = [];
  @state() private _monHealthChecks: Array<{ service: string; status: string; latency: number; uptime: number; lastCheck: string; slaTarget: number }> = [];
  @state() private _monAlertFatigue: { totalAlerts: number; actionable: number; falsePositive: number; noiseRate: number; topNoiseSource: string; fatigueIndex: number } = { totalAlerts: 0, actionable: 0, falsePositive: 0, noiseRate: 0, topNoiseSource: '', fatigueIndex: 0 };

  private _initMonitoring(): void {
    if (this._monMetricGauges.length > 0) return;
    this._monMetricGauges = [
      { id: 'MG-001', name: 'Threat Detection Coverage', value: 72, max: 100, unit: '%', status: 'warning', trend: 'improving' },
      { id: 'MG-002', name: 'Mean Time to Detect', value: 4.2, max: 24, unit: 'hrs', status: 'healthy', trend: 'improving' },
      { id: 'MG-003', name: 'Mean Time to Respond', value: 2.1, max: 8, unit: 'hrs', status: 'healthy', trend: 'stable' },
      { id: 'MG-004', name: 'Patch Compliance', value: 78, max: 100, unit: '%', status: 'warning', trend: 'improving' },
      { id: 'MG-005', name: 'MFA Adoption', value: 78, max: 100, unit: '%', status: 'warning', trend: 'improving' },
      { id: 'MG-006', name: 'Security Posture Score', value: 82, max: 100, unit: '', status: 'healthy', trend: 'improving' },
      { id: 'MG-007', name: 'Endpoint Compliance', value: 91, max: 100, unit: '%', status: 'healthy', trend: 'stable' },
      { id: 'MG-008', name: 'Vulnerability SLA Compliance', value: 85, max: 100, unit: '%', status: 'healthy', trend: 'declining' },
    ];
    this._monAnomalyStream = [
      { id: 'AN-001', timestamp: '2024-04-15T10:32:00Z', type: 'Behavioral', description: 'Unusual login pattern detected for service account svc-backup', severity: 'high', source: 'UEBA', status: 'investigating' },
      { id: 'AN-002', timestamp: '2024-04-15T10:15:00Z', type: 'Network', description: 'DNS tunneling attempt blocked from workstation WS-042', severity: 'medium', source: 'NDR', status: 'blocked' },
      { id: 'AN-003', timestamp: '2024-04-15T09:58:00Z', type: 'Endpoint', description: 'New autorun key created on server SRV-DB-03', severity: 'high', source: 'EDR', status: 'investigating' },
      { id: 'AN-004', timestamp: '2024-04-15T09:30:00Z', type: 'Cloud', description: 'IAM role assumption from unexpected principal', severity: 'medium', source: 'CSPM', status: 'resolved' },
      { id: 'AN-005', timestamp: '2024-04-15T09:12:00Z', type: 'Data', description: 'Bulk download of sensitive files detected (3.2 GB in 5 min)', severity: 'critical', source: 'DLP', status: 'escalated' },
    ];
    this._monHealthChecks = [
      { service: 'SIEM Platform', status: 'healthy', latency: 45, uptime: 99.97, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.9 },
      { service: 'EDR Agent Fleet', status: 'healthy', latency: 120, uptime: 99.85, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.5 },
      { service: 'Threat Intel Feed', status: 'healthy', latency: 200, uptime: 99.99, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.5 },
      { service: 'Vulnerability Scanner', status: 'degraded', latency: 3500, uptime: 98.2, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.0 },
      { service: 'SOAR Platform', status: 'healthy', latency: 80, uptime: 99.95, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.5 },
      { service: 'Log Forwarder Cluster', status: 'healthy', latency: 15, uptime: 99.98, lastCheck: '2024-04-15T10:35:00Z', slaTarget: 99.9 },
    ];
    this._monAlertFatigue = {
      totalAlerts: 1247, actionable: 312, falsePositive: 685,
      noiseRate: 54.9, topNoiseSource: 'Endpoint Detection (false positives on legitimate admin tools)',
      fatigueIndex: 3.8,
    };
  }

  private _getMonOverallHealth(): string {
    const degraded = this._monHealthChecks.filter(h => h.status !== 'healthy').length;
    if (degraded === 0) return 'healthy';
    if (degraded <= 1) return 'warning';
    return 'critical';
  }

  private _getMonAvgUptime(): number {
    if (this._monHealthChecks.length === 0) return 0;
    return Math.round(this._monHealthChecks.reduce((s, h) => s + h.uptime, 0) / this._monHealthChecks.length * 100) / 100;
  }

  private _getMonSlaBreaches(): number {
    return this._monHealthChecks.filter(h => h.uptime < h.slaTarget).length;
  }

  private _getMonActiveAnomalies(): number {
    return this._monAnomalyStream.filter(a => a.status !== 'resolved' && a.status !== 'blocked').length;
  }

  private _getMonGaugeStatusColor(status: string): string {
    if (status === 'healthy') return '#2ed573';
    if (status === 'warning') return '#ffa502';
    if (status === 'critical') return '#ff4757';
    return '#95a5a6';
  }




  // === Round 17: Risk Quantification Framework ===
  @state() private _mkFairModel: any = null;
  @state() private _mkRiskHeatMap: any = null;
  @state() private _mkRiskAppetite: any = null;
  @state() private _mkMonteCarlo: any = null;
  @state() private _mkRiskRegister: any = null;
  @state() private _mkRiskTrend: any = null;

  private mkInitRiskQuant() {
    this._mkFairModel = {
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
    this._mkRiskHeatMap = ((): any[] => {
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
    this._mkRiskAppetite = {
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
    this._mkMonteCarlo = ((): any[] => {
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
    this._mkRiskRegister = [
      { id: "RSK-001", name: "Credential Stuffing", owner: "IAM Team", likelihood: 4, impact: 3, score: 12, status: "Mitigating", trend: "improving" },
      { id: "RSK-002", name: "Cloud Data Exposure", owner: "Cloud Sec", likelihood: 3, impact: 5, score: 15, status: "Open", trend: "stable" },
      { id: "RSK-003", name: "Third-Party Breach", owner: "GRC Team", likelihood: 3, impact: 4, score: 12, status: "Mitigating", trend: "worsening" },
      { id: "RSK-004", name: "Insider Data Theft", owner: "HR + SecOps", likelihood: 2, impact: 4, score: 8, status: "Monitoring", trend: "stable" },
      { id: "RSK-005", name: "Ransomware", owner: "SecOps", likelihood: 4, impact: 5, score: 20, status: "Mitigating", trend: "improving" },
      { id: "RSK-006", name: "API Security Flaw", owner: "AppSec", likelihood: 3, impact: 3, score: 9, status: "Open", trend: "worsening" },
      { id: "RSK-007", name: "Compliance Violation", owner: "GRC Team", likelihood: 2, impact: 5, score: 10, status: "Mitigating", trend: "improving" },
      { id: "RSK-008", name: "Social Engineering", owner: "SecAwareness", likelihood: 5, impact: 2, score: 10, status: "Monitoring", trend: "stable" }
    ];
    this._mkRiskTrend = [
      { month: "Oct", critical: 3, high: 8, medium: 15, low: 22 },
      { month: "Nov", critical: 2, high: 7, medium: 14, low: 24 },
      { month: "Dec", critical: 4, high: 9, medium: 16, low: 20 },
      { month: "Jan", critical: 3, high: 8, medium: 13, low: 21 },
      { month: "Feb", critical: 2, high: 6, medium: 12, low: 23 },
      { month: "Mar", critical: 1, high: 5, medium: 11, low: 25 }
    ];
  }

  private mkRenderRiskQuant() {
    const fm = this._mkFairModel;
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
          ${this._mkRiskHeatMap.map((c: any) => html`<div style="background:${c.color}22;border:1px solid ${c.color}44;border-radius:2px;padding:3px;text-align:center;color:${c.color}">
              <div>${c.score}</div>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Monte Carlo Simulation (20 iterations)</div>
            ${this._mkMonteCarlo.slice(0, 10).map((r: any) => html`<div style="display:flex;gap:4px;font-size:8px;margin-bottom:1px">
                <span style="color:#888;width:20px">#${r.iteration}</span>
                <div style="flex:1;background:#1a1d27;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(r.loss / 8000000) * 100}%;background:${r.loss > 5000000 ? "#f44" : r.loss > 3000000 ? "#f84" : "#4caf50"}"></div>
                </div>
                <span style="color:#ccc;width:40px;text-align:right">${fmt(r.loss)}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Risk Register (Top 8)</div>
            ${this._mkRiskRegister.map((r: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
                <span style="color:${sevColor(r.score)};font-weight:bold;width:16px">${r.score}</span>
                <span style="color:#ccc;flex:1">${r.name}</span>
                <span style="color:${r.trend === "improving" ? "#4caf50" : r.trend === "worsening" ? "#f44" : "#888"};font-size:7px">${r.trend}</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:8px 0 4px">Risk Trend (6 months)</div>
        <div style="display:flex;gap:4px;align-items:flex-end;height:50px">
          ${this._mkRiskTrend.map((t: any) => html`<div style="flex:1;display:flex;flex-direction:column;gap:1px;align-items:center">
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
  @state() private _mkOkrs: any = null;
  @state() private _mkInitiatives: any = null;
  @state() private _mkResourceAlloc: any = null;
  @state() private _mkHeadcount: any = null;
  @state() private _mkMilestones: any = null;
  @state() private _mkBudget: any = null;

  private mkInitSecProgram() {
    this._mkOkrs = [
      { objective: "Reduce Mean Time to Detect", keyResults: [{ kr: "MTTD < 24 hours", progress: 72 }, { kr: "Deploy EDR to 100% endpoints", progress: 89 }, { kr: "SIEM coverage 95%+", progress: 81 }], overallProgress: 81 },
      { objective: "Eliminate Critical Vulnerabilities in 7 days", keyResults: [{ kr: "Patch SLA compliance > 95%", progress: 67 }, { kr: "Zero critical vulns > 30 days", progress: 45 }, { kr: "Automated patching 80%+", progress: 58 }], overallProgress: 57 },
      { objective: "Achieve Zero Trust Architecture", keyResults: [{ kr: "Micro-segment 90% workloads", progress: 63 }, { kr: "ZTNA adoption 100%", progress: 78 }, { kr: "Continuous verification deployed", progress: 54 }], overallProgress: 65 },
      { objective: "Build Security-First Culture", keyResults: [{ kr: "Phishing click rate < 3%", progress: 85 }, { kr: "Security training 100%", progress: 92 }, { kr: "DevSecOps maturity L3+", progress: 48 }], overallProgress: 75 }
    ];
    this._mkInitiatives = [
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
    this._mkResourceAlloc = [
      { domain: "Security Operations", allocated: 35, used: 31, budget: 2800000 },
      { domain: "Identity & Access", allocated: 12, used: 11, budget: 960000 },
      { domain: "Application Security", allocated: 10, used: 8, budget: 800000 },
      { domain: "Cloud Security", allocated: 8, used: 9, budget: 640000 },
      { domain: "GRC & Compliance", allocated: 8, used: 7, budget: 640000 },
      { domain: "Threat Intelligence", allocated: 5, used: 4, budget: 400000 },
      { domain: "Security Engineering", allocated: 7, used: 6, budget: 560000 }
    ];
    this._mkHeadcount = {
      total: 85, filled: 72, open: 13, budget: 10200000,
      byLevel: [{ level: "L3 (Senior)", count: 28, target: 32 }, { level: "L4 (Staff)", count: 18, target: 20 }, { level: "L5 (Principal)", count: 8, target: 10 }, { level: "L2 (Mid)", count: 14, target: 15 }, { level: "L1 (Junior)", count: 4, target: 8 }],
      criticalRoles: ["Cloud Security Architect", "Senior Threat Hunter", "AppSec Engineer", "SOC Analyst L2"]
    };
    this._mkMilestones = [
      { initiative: "Zero Trust", milestone: "Micro-seg Phase 2 complete", due: "2026-03-31", status: "On Track", rag: "green" },
      { initiative: "SOC Mod", milestone: "SOAR platform deployed", due: "2026-04-15", status: "At Risk", rag: "amber" },
      { initiative: "Cloud Sec", milestone: "CSPM full coverage", due: "2026-05-01", status: "Behind", rag: "red" },
      { initiative: "AppSec", milestone: "SAST in all CI/CD", due: "2026-06-30", status: "On Track", rag: "green" },
      { initiative: "IAM", milestone: "PAM deployment complete", due: "2026-04-30", status: "Delayed", rag: "red" },
      { initiative: "Automation", milestone: "50% alert triage automated", due: "2026-05-15", status: "On Track", rag: "green" }
    ];
    this._mkBudget = {
      total: 10200000, allocated: 9650000, spent: 5480000, remaining: 4170000,
      quarterly: [{ q: "Q1", allocated: 2412500, spent: 2412500 }, { q: "Q2", allocated: 2412500, spent: 1950000 }, { q: "Q3", allocated: 2412500, spent: 1117500 }, { q: "Q4", allocated: 2412500, spent: 0 }],
      byCategory: [{ cat: "Personnel", pct: 68 }, { cat: "Tools & Licenses", pct: 18 }, { cat: "Services", pct: 9 }, { cat: "Training", pct: 5 }]
    };
  }

  private mkRenderSecProgram() {
    const okrs = this._mkOkrs;
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
          ${this._mkInitiatives.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
              <span style="color:${i.priority === "P0" ? "#f44" : i.priority === "P1" ? "#f84" : "#888"};font-weight:bold;width:16px">${i.priority}</span>
              <span style="color:#ccc;flex:1">${i.name}</span>
              <span style="color:${statusColor(i.status)};width:50px">${i.status}</span>
              <span style="color:#888;width:24px;text-align:right">${i.completion}%</span>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Resource Allocation</div>
            ${this._mkResourceAlloc.slice(0, 5).map((r: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:90px">${r.domain}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(r.used / r.allocated) * 100}%;background:${r.used > r.allocated ? "#f44" : "#48f"}"></div>
                </div>
                <span style="color:#888">${r.used}/${r.allocated}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Budget Utilization</div>
            <div style="font-size:9px;color:#ccc;margin-bottom:4px">Total: ${fmt(this._mkBudget.total)} | Spent: ${fmt(this._mkBudget.spent)}</div>
            ${this._mkBudget.quarterly.map((q: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#888;width:16px">${q.q}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(q.spent / q.allocated) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#aaa">${fmt(q.spent)}</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">Milestone Tracker</div>
        ${this._mkMilestones.map((m: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <div style="width:6px;height:6px;border-radius:50%;background:${ragColor(m.rag)}"></div>
            <span style="color:#ccc;width:60px">${m.initiative}</span>
            <span style="color:#bbb;flex:1">${m.milestone}</span>
            <span style="color:#888">${m.due}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Third-Party Risk Assessment ===
  @state() private _mkVendorTiers: any = null;
  @state() private _mkDueDiligence: any = null;
  @state() private _mkContractClauses: any = null;
  @state() private _mkVendorScorecard: any = null;
  @state() private _mkSubProcessors: any = null;
  @state() private _mkVendorIncidents: any = null;

  private mkInitThirdParty() {
    this._mkVendorTiers = [
      { tier: "Critical", count: 8, vendors: ["AWS", "Azure AD", "CrowdStrike", "Okta", "ServiceNow", "Salesforce", "Workday", "Datadog"] },
      { tier: "High", count: 14, vendors: ["Slack", "GitHub", "Jenkins", "Terraform", "Artifactory", "Snyk", "Palo Alto", "Zscaler"] },
      { tier: "Medium", count: 32, vendors: ["Figma", "Confluence", "Zoom", "Dropbox", "Notion", "Linear"] },
      { tier: "Low", count: 67, vendors: ["Various SaaS tools", "Utilities", "Dev tools"] }
    ];
    this._mkDueDiligence = [
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
    this._mkContractClauses = [
      { clause: "Data Breach Notification", vendors: 98, compliant: 89, gap: 9 },
      { clause: "Right to Audit", vendors: 85, compliant: 72, gap: 13 },
      { clause: "Data Return on Termination", vendors: 92, compliant: 78, gap: 14 },
      { clause: "Liability Cap", vendors: 90, compliant: 65, gap: 25 },
      { clause: "Sub-processor Restrictions", vendors: 88, compliant: 80, gap: 8 },
      { clause: "Encryption Requirements", vendors: 95, compliant: 91, gap: 4 },
      { clause: "Incident Response SLA", vendors: 86, compliant: 74, gap: 12 },
      { clause: "Data Residency", vendors: 78, compliant: 62, gap: 16 }
    ];
    this._mkVendorScorecard = [
      { vendor: "AWS", security: 92, compliance: 95, reliability: 98, risk: "Low", overall: 95 },
      { vendor: "CrowdStrike", security: 94, compliance: 90, reliability: 96, risk: "Low", overall: 93 },
      { vendor: "Okta", security: 85, compliance: 92, reliability: 90, risk: "Low", overall: 89 },
      { vendor: "GitHub", security: 82, compliance: 78, reliability: 94, risk: "Medium", overall: 85 },
      { vendor: "Slack", security: 78, compliance: 80, reliability: 92, risk: "Medium", overall: 83 },
      { vendor: "Figma", security: 75, compliance: 72, reliability: 88, risk: "Medium", overall: 78 },
      { vendor: "Linear", security: 70, compliance: 65, reliability: 90, risk: "Medium", overall: 75 },
      { vendor: "StartupAI Inc", security: 55, compliance: 48, reliability: 72, risk: "High", overall: 58 }
    ];
    this._mkSubProcessors = [
      { vendor: "AWS", subProcessors: ["CloudFront", "S3 (US-East)", "DynamoDB", "Lambda"], reviewed: "2026-01" },
      { vendor: "CrowdStrike", subProcessors: ["AWS (hosting)", "Snowflake (analytics)"], reviewed: "2026-02" },
      { vendor: "Okta", subProcessors: ["AWS", "MongoDB Atlas"], reviewed: "2026-01" },
      { vendor: "Salesforce", subProcessors: ["AWS", "Heroku", "MuleSoft"], reviewed: "2025-11" },
      { vendor: "Datadog", subProcessors: ["GCP", "AWS"], reviewed: "2026-03" }
    ];
    this._mkVendorIncidents = [
      { vendor: "Okta", date: "2026-01-15", severity: "Medium", description: "Support access breach", resolved: true, ourImpact: "None" },
      { vendor: "Cloudflare", date: "2026-02-20", severity: "Low", description: "Config exposure", resolved: true, ourImpact: "Minimal" },
      { vendor: "GitHub", date: "2026-03-05", severity: "Low", description: "Dependency confusion", resolved: true, ourImpact: "None" },
      { vendor: "StartupAI Inc", date: "2026-03-18", severity: "High", description: "Data exposure incident", resolved: false, ourImpact: "Under review" }
    ];
  }

  private mkRenderThirdParty() {
    const tiers = this._mkVendorTiers;
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
            ${this._mkDueDiligence.slice(0, 8).map((d: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
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
            ${this._mkContractClauses.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;flex:1">${c.clause}</span>
                <span style="color:${c.gap > 15 ? "#f44" : c.gap > 8 ? "#f84" : "#4caf50"};width:28px;text-align:right">${c.gap} gap</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">Vendor Security Scorecard</div>
        ${this._mkVendorScorecard.map((v: any) => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:8px">
            <span style="color:#ccc;width:80px;flex-shrink:0">${v.vendor}</span>
            <div style="display:flex;gap:2px;flex:1">
              <div title="Security" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.security}%;background:#48f"></div></div>
              <div title="Compliance" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.compliance}%;background:#4caf50"></div></div>
              <div title="Reliability" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.reliability}%;background:#ff9800"></div></div>
            </div>
            <span style="color:${tierColor(v.risk)};font-weight:bold;width:40px;text-align:right">${v.overall}</span>
          </div>`)}
        <div style="color:#aaa;font-size:10px;margin:8px 0 4px">Vendor Incidents (Recent)</div>
        ${this._mkVendorIncidents.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <div style="width:6px;height:6px;border-radius:50%;background:${sevColor(i.severity)}"></div>
            <span style="color:#ccc;width:70px">${i.vendor}</span>
            <span style="color:#bbb;flex:1">${i.description}</span>
            <span style="color:${i.resolved ? "#4caf50" : "#f44"}">${i.resolved ? "Resolved" : "Open"}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Data Loss Prevention ===
  @state() private _mkDlpRules: any = null;
  @state() private _mkDataMovement: any = null;
  @state() private _mkDataDiscovery: any = null;
  @state() private _mkDlpIncidents: any = null;
  @state() private _mkEncryptionMatrix: any = null;

  private mkInitDLP() {
    this._mkDlpRules = [
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
    this._mkDataMovement = {
      totalEvents: 15847, monitored: 12456, blocked: 1533, allowed: 10923,
      byChannel: [{ channel: "Email", events: 5234, blocked: 892 }, { channel: "Cloud Upload", events: 4123, blocked: 345 }, { channel: "USB", events: 1234, blocked: 198 }, { channel: "Network", events: 3890, blocked: 67 }, { channel: "Print", events: 1366, blocked: 31 }],
      bySensitivity: [{ level: "Confidential", pct: 35 }, { level: "Internal", pct: 45 }, { level: "Public", pct: 20 }]
    };
    this._mkDataDiscovery = [
      { location: "SharePoint", total: 245000, sensitive: 12300, unclassified: 45000, lastScan: "2026-04-20" },
      { location: "S3 Buckets", total: 189000, sensitive: 8900, unclassified: 32000, lastScan: "2026-04-21" },
      { location: "Database Servers", total: 3400, sensitive: 2100, unclassified: 800, lastScan: "2026-04-19" },
      { location: "File Shares", total: 156000, sensitive: 6700, unclassified: 28000, lastScan: "2026-04-18" },
      { location: "Endpoints", total: 89000, sensitive: 3400, unclassified: 15000, lastScan: "2026-04-21" }
    ];
    this._mkDlpIncidents = [
      { id: "DLP-001", type: "PII Exposure", status: "Resolved", severity: "Critical", assignee: "SecOps", time: "2h" },
      { id: "DLP-002", type: "Source Code Leak", status: "Investigating", severity: "High", assignee: "AppSec", time: "4h" },
      { id: "DLP-003", type: "Credential Commit", status: "Resolved", severity: "High", assignee: "DevSecOps", time: "1h" },
      { id: "DLP-004", type: "Bulk Export", status: "Monitoring", severity: "Medium", assignee: "SOC", time: "8h" },
      { id: "DLP-005", type: "API Key in Log", status: "Resolved", severity: "Medium", assignee: "SecOps", time: "30m" }
    ];
    this._mkEncryptionMatrix = [
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

  private mkRenderDLP() {
    const rules = this._mkDlpRules;
    if (!rules) return nothing;
    const sevColor = (s: string) => s === "Critical" ? "#f44" : s === "High" ? "#f84" : "#ff8";
    const statusColor = (s: string) => s === "Resolved" ? "#4caf50" : s === "Investigating" ? "#f84" : "#ff8";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Data Loss Prevention</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
          ${[["Monitored",this._mkDataMovement.monitored.toLocaleString(),"#48f"],["Blocked",this._mkDataMovement.blocked.toLocaleString(),"#f44"],["Rules",rules.length,"#ff8"],["Incidents",this._mkDlpIncidents.length,"#f84"]].map(([l,v,c]) => html`<div style="background:#1a1d27;border-radius:4px;padding:6px;text-align:center">
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
            ${this._mkDataMovement.byChannel.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:60px">${c.channel}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(c.events / 5500) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#888;width:30px;text-align:right">${c.blocked}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Encryption Coverage</div>
            ${this._mkEncryptionMatrix.map((e: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:60px">${e.data}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${e.coverage}%;background:${e.coverage >= 95 ? "#4caf50" : e.coverage >= 85 ? "#ff9800" : "#f44"}"></div>
                </div>
                <span style="color:#888;width:28px;text-align:right">${e.coverage}%</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">DLP Incident Response</div>
        ${this._mkDlpIncidents.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <span style="color:${statusColor(i.status)};width:70px">${i.status}</span>
            <span style="color:#ccc;flex:1">${i.type}</span>
            <span style="color:${sevColor(i.severity)}">${i.severity}</span>
            <span style="color:#888">${i.time}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Security Automation Metrics ===
  @state() private _mkAutoMetrics: any = null;
  @state() private _mkAutoTimeSaved: any = null;
  @state() private _mkAutoReliability: any = null;
  @state() private _mkAutoComparison: any = null;
  @state() private _mkAutoROI: any = null;
  @state() private _mkAutoCandidates: any = null;

  private mkInitAutomation() {
    this._mkAutoMetrics = {
      totalPlaybooks: 48, activePlaybooks: 42, triggered: 12847, successful: 12156, failed: 691,
      coverage: 67, targetCoverage: 85, mttrReduction: 58, falsePositiveRate: 3.2
    };
    this._mkAutoTimeSaved = [
      { task: "Alert Triage", manualMin: 15, autoMin: 0.5, daily: 120, savedHours: 2920 },
      { task: "Vuln Scanning", manualMin: 60, autoMin: 5, daily: 8, savedHours: 2730 },
      { task: "Patch Deployment", manualMin: 45, autoMin: 10, daily: 15, savedHours: 2555 },
      { task: "User Provisioning", manualMin: 30, autoMin: 2, daily: 25, savedHours: 1825 },
      { task: "Compliance Reporting", manualMin: 120, autoMin: 15, daily: 1, savedHours: 639 },
      { task: "Incident Escalation", manualMin: 10, autoMin: 1, daily: 45, savedHours: 2737 },
      { task: "Log Analysis", manualMin: 90, autoMin: 8, daily: 3, savedHours: 1277 },
      { task: "Threat Intel Enrichment", manualMin: 20, autoMin: 3, daily: 60, savedHours: 1972 }
    ];
    this._mkAutoReliability = [
      { playbook: "Phishing Auto-Block", success: 98.5, executions: 4521, avgTime: "1.2s" },
      { playbook: "Vuln Auto-Scan", success: 97.2, executions: 2340, avgTime: "4.5m" },
      { playbook: "User Offboard", success: 99.1, executions: 156, avgTime: "30s" },
      { playbook: "Alert Enrichment", success: 96.8, executions: 8945, avgTime: "3.1s" },
      { playbook: "Malware Isolate", success: 95.4, executions: 89, avgTime: "8.2s" },
      { playbook: "Compliance Check", success: 94.7, executions: 365, avgTime: "2.1m" }
    ];
    this._mkAutoComparison = [
      { process: "Vulnerability Management", manual: 45, automated: 12, reduction: 73 },
      { process: "Incident Response", manual: 180, automated: 65, reduction: 64 },
      { process: "Access Reviews", manual: 30, automated: 5, reduction: 83 },
      { process: "Compliance Audits", manual: 120, automated: 45, reduction: 63 },
      { process: "Threat Detection", manual: 60, automated: 8, reduction: 87 },
      { process: "Configuration Drift", manual: 40, automated: 10, reduction: 75 }
    ];
    this._mkAutoROI = {
      investment: 850000, annualSavings: 2100000, roi: 147,
      costAvoidance: 1200000, efficiencyGain: 900000, headcountSaved: 4.5
    };
    this._mkAutoCandidates = [
      { task: "Security Questionnaire Response", complexity: "Medium", savings: "120 hrs/yr", priority: "High" },
      { task: "Certificate Rotation", complexity: "Low", savings: "80 hrs/yr", priority: "High" },
      { task: "Firewall Rule Review", complexity: "High", savings: "200 hrs/yr", priority: "Medium" },
      { task: "Data Classification Tagging", complexity: "Medium", savings: "150 hrs/yr", priority: "High" },
      { task: "Vendor Risk Scoring", complexity: "Medium", savings: "90 hrs/yr", priority: "Medium" },
      { task: "Security Awareness Campaigns", complexity: "Low", savings: "60 hrs/yr", priority: "Low" }
    ];
  }

  private mkRenderAutomation() {
    const m = this._mkAutoMetrics;
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
            ${this._mkAutoTimeSaved.slice(0, 5).map((t: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:90px">${t.task}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(t.savedHours / 3000) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#888;width:40px;text-align:right">${t.savedHours}h</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Playbook Reliability</div>
            ${this._mkAutoReliability.map((p: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
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
              <div style="color:#4caf50;font-size:16px;font-weight:bold">${this._mkAutoROI.roi}%</div>
            </div>
            <div style="text-align:center">
              <div style="color:#aaa;font-size:9px">Annual Savings</div>
              <div style="color:#48f;font-size:16px;font-weight:bold">${(this._mkAutoROI.annualSavings / 1000000).toFixed(1)}M</div>
            </div>
            <div style="text-align:center">
              <div style="color:#aaa;font-size:9px">Headcount Saved</div>
              <div style="color:#ff8;font-size:16px;font-weight:bold">${this._mkAutoROI.headcountSaved}</div>
            </div>
            <div style="text-align:right">
              <div style="color:#aaa;font-size:9px">Investment</div>
              <div style="color:#ccc;font-size:16px;font-weight:bold">${(this._mkAutoROI.investment / 1000).toFixed(0)}K</div>
            </div>
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">Manual vs Automated (hours/process)</div>
        ${this._mkAutoComparison.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
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
        ${this._mkAutoCandidates.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <span style="color:${c.priority === "High" ? "#f44" : c.priority === "Medium" ? "#f84" : "#888"};font-weight:bold;width:40px">${c.priority}</span>
            <span style="color:#ccc;flex:1">${c.task}</span>
            <span style="color:#888">${c.savings}</span>
          </div>`)}
      </div>`;
  }

  // Round 17 initialization
  private mkInitRound17() {
    this.mkInitRiskQuant();
    this.mkInitSecProgram();
    this.mkInitThirdParty();
    this.mkInitDLP();
    this.mkInitAutomation();
  }

  private mkRenderRound17() {
    return html`${this.mkRenderRiskQuant()}${this.mkRenderSecProgram()}${this.mkRenderThirdParty()}${this.mkRenderDLP()}${this.mkRenderAutomation()}`;
  }

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

  // === Cloud Workload Protection Block ===
  @state() private _metricsKpiDaContainerScans: Array<{image:string;registry:string;critical:number;high:number;medium:number;scanDate:string;status:string}> = [
    {image:"nginx:1.25",registry:"docker.io",critical:2,high:5,medium:12,scanDate:"2026-04-22",status:"Vulnerable"},
    {image:"postgres:16",registry:"ghcr.io",critical:0,high:1,medium:3,scanDate:"2026-04-22",status:"Clean"},
    {image:"redis:7.2",registry:"docker.io",critical:1,high:3,medium:8,scanDate:"2026-04-21",status:"Vulnerable"},
    {image:"app-server:v2.3",registry:"ecr.aws",critical:0,high:0,medium:2,scanDate:"2026-04-22",status:"Clean"},
    {image:"sidecar-proxy:v1.8",registry:"gcr.io",critical:3,high:7,medium:15,scanDate:"2026-04-20",status:"Critical"},
  ];
  @state() private _metricsKpiDaK8sPods: Array<{namespace:string;pod:string;securityContext:string;hostIPC:boolean;hostPID:boolean;privileged:boolean;riskLevel:string}> = [
    {namespace:"production",pod:"web-frontend-7d9f8",securityContext:"Restricted",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Low"},
    {namespace:"production",pod:"api-gateway-4b2c1",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
    {namespace:"staging",pod:"db-migrator-x8k3m",securityContext:"Privileged",hostIPC:true,hostPID:false,privileged:true,riskLevel:"Critical"},
    {namespace:"monitoring",pod:"prometheus-q7r2p",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
  ];
  @state() private _metricsKpiDaServerlessRisk: Array<{function:string;runtime:string;timeout:number;iamPerms:string;externalCalls:number;riskScore:number}> = [
    {function:"processPayment",runtime:"nodejs20.x",timeout:30,iamPerms:"dynamodb:*",externalCalls:3,riskScore:78},
    {function:"sendNotification",runtime:"python3.12",timeout:15,iamPerms:"sns:Publish",externalCalls:1,riskScore:25},
    {function:"imageResizer",runtime:"python3.12",timeout:60,iamPerms:"s3:*",externalCalls:0,riskScore:45},
    {function:"authValidator",runtime:"go1.x",timeout:10,iamPerms:"cognito-idp:*",externalCalls:2,riskScore:62},
  ];
  @state() private _metricsKpiDaRuntimeAlerts: Array<{id:string;workload:string;alertType:string;severity:string;description:string;timestamp:string}> = [
    {id:"RTA01",workload:"db-migrator-x8k3m",alertType:"Privilege Escalation",severity:"Critical",description:"Container attempted to access /etc/shadow",timestamp:"2026-04-22T10:34:00Z"},
    {id:"RTA02",workload:"web-frontend-7d9f8",alertType:"Anomalous Outbound",severity:"High",description:"Unexpected DNS query to known C2 domain",timestamp:"2026-04-22T09:12:00Z"},
    {id:"RTA03",workload:"sidecar-proxy:v1.8",alertType:"Crypto Mining",severity:"Critical",description:"CPU utilization exceeded 95% for 30 minutes",timestamp:"2026-04-21T23:45:00Z"},
  ];
  private _renderMetricskpidaCloudWl(): TemplateResult {
    const containers = this._metricsKpiDaContainerScans;
    const pods = this._metricsKpiDaK8sPods;
    const alerts = this._metricsKpiDaRuntimeAlerts;
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

  // === Network Segmentation Validator Block ===
  @state() private _metricsKpiDaZones: Array<{id:string;name:string;trustLevel:number;subnet:string;devices:number;policy:string;lastAudit:string}> = [
    {id:"Z01",name:"DMZ",trustLevel:1,subnet:"10.0.1.0/24",devices:23,policy:"Deny All Inbound",lastAudit:"2026-04-20"},
    {id:"Z02",name:"Corporate LAN",trustLevel:3,subnet:"10.0.2.0/22",devices:456,policy:"Allow Internal",lastAudit:"2026-04-18"},
    {id:"Z03",name:"Data Center Core",trustLevel:5,subnet:"10.0.10.0/24",devices:89,policy:"Restricted Access",lastAudit:"2026-04-22"},
    {id:"Z04",name:"IoT Network",trustLevel:1,subnet:"10.0.20.0/24",devices:312,policy:"Deny All Internet",lastAudit:"2026-04-15"},
    {id:"Z05",name:"Development",trustLevel:2,subnet:"10.0.30.0/24",devices:67,policy:"Sandbox Rules",lastAudit:"2026-04-19"},
    {id:"Z06",name:"Management Plane",trustLevel:5,subnet:"10.0.99.0/24",devices:12,policy:"MFA Required",lastAudit:"2026-04-21"},
  ];
  @state() private _metricsKpiDaSegRules: Array<{id:string;source:string;dest:string;action:string;protocol:string;port:string;status:string;hits:number}> = [
    {id:"SR01",source:"DMZ",dest:"Corporate LAN",action:"DENY",protocol:"TCP",port:"*",status:"Active",hits:14523},
    {id:"SR02",source:"Corporate LAN",dest:"Data Center Core",action:"ALLOW",protocol:"TCP",port:"443,8443",status:"Active",hits:89234},
    {id:"SR03",source:"IoT Network",dest:"Internet",action:"DENY",protocol:"*",port:"*",status:"Active",hits:234567},
    {id:"SR04",source:"Development",dest:"Corporate LAN",action:"DENY",protocol:"*",port:"*",status:"Active",hits:789},
    {id:"SR05",source:"Corporate LAN",dest:"Management Plane",action:"ALLOW",protocol:"TCP",port:"22,443",status:"Active",hits:3456},
  ];
  @state() private _metricsKpiDaCrossZoneTraffic: Array<{source:string;dest:string;bytes:number;sessions:number;violations:number}> = [
    {source:"DMZ",dest:"Corporate LAN",bytes:4567890,sessions:234,violations:12},
    {source:"Corporate LAN",dest:"Data Center Core",bytes:123456789,sessions:5678,violations:3},
    {source:"IoT Network",dest:"Corporate LAN",bytes:890123,sessions:89,violations:45},
    {source:"Development",dest:"Internet",bytes:67890123,sessions:3456,violations:0},
  ];
  @state() private _metricsKpiDaMicroSegGaps: Array<{id:string;zone:string;gapType:string;severity:string;recommendation:string}> = [
    {id:"MSG01",zone:"IoT Network",gapType:"Missing East-West Controls",severity:"High",recommendation:"Implement micro-segmentation with service mesh"},
    {id:"MSG02",zone:"Corporate LAN",gapType:"Flat Network Subnet",severity:"Critical",recommendation:"Split into VLANs by department"},
    {id:"MSG03",zone:"Development",gapType:"No Egress Filtering",severity:"Medium",recommendation:"Deploy proxy-based egress controls"},
  ];
  private _renderMetricskpidaNetworkSeg(): TemplateResult {
    const zones = this._metricsKpiDaZones;
    const gaps = this._metricsKpiDaMicroSegGaps;
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

  // === Security Training Platform Block ===
  @state() private _metricsKpiDaCourses: Array<{id:string;title:string;category:string;duration:number;enrolled:number;completed:number;difficulty:string;rating:number}> = [
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
  @state() private _metricsKpiDaLearningPaths: Array<{id:string;name:string;courseIds:string[];progress:number;enrolled:number}> = [
    {id:"LP01",name:"Security Analyst Fundamentals",courseIds:["C001","C004","C007"],progress:72,enrolled:156},
    {id:"LP02",name:"DevSecOps Engineer",courseIds:["C001","C002","C008","C012"],progress:45,enrolled:78},
    {id:"LP03",name:"Cloud Security Specialist",courseIds:["C003","C006","C009"],progress:58,enrolled:89},
    {id:"LP04",name:"Advanced Penetration Tester",courseIds:["C010","C002","C005"],progress:33,enrolled:45},
  ];
  @state() private _metricsKpiDaDeptCompliance: Array<{dept:string;trainedPct:number;targetPct:number;avgScore:number;certCount:number}> = [
    {dept:"Engineering",trainedPct:88,targetPct:95,avgScore:82,certCount:34},
    {dept:"Operations",trainedPct:92,targetPct:95,avgScore:87,certCount:28},
    {dept:"Finance",trainedPct:78,targetPct:90,avgScore:74,certCount:12},
    {dept:"HR",trainedPct:85,targetPct:90,avgScore:79,certCount:8},
    {dept:"Legal",trainedPct:71,targetPct:85,avgScore:71,certCount:6},
  ];
  @state() private _metricsKpiDaSkillsGaps: Array<{skill:string;current:number;required:number;gap:number;priority:string}> = [
    {skill:"Cloud Security",current:62,required:85,gap:23,priority:"High"},
    {skill:"Threat Hunting",current:55,required:80,gap:25,priority:"High"},
    {skill:"Incident Response",current:70,required:85,gap:15,priority:"Medium"},
    {skill:"Secure Coding",current:75,required:90,gap:15,priority:"Medium"},
    {skill:"Forensics",current:45,required:75,gap:30,priority:"Critical"},
  ];
  private _renderMetricskpidaTraining(): TemplateResult {
    const courses = this._metricsKpiDaCourses;
    const deptComp = this._metricsKpiDaDeptCompliance;
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

  // === Security Event Correlation Block ===
  @state() private _metricsKpiDaCorrRules: Array<{id:string;name:string;sources:string[];logic:string;severity:string;active:boolean;lastTriggered:string}> = [
    {id:"CR01",name:"Brute Force Detection",sources:["AD","Firewall","SIEM"],logic:"5 failed logins + firewall block within 10min",severity:"High",active:true,lastTriggered:"2026-04-22T08:30:00Z"},
    {id:"CR02",name:"Data Exfiltration Pattern",sources:["DLP","Proxy","DNS"],logic:"Large upload + DNS tunneling indicators",severity:"Critical",active:true,lastTriggered:"2026-04-21T14:22:00Z"},
    {id:"CR03",name:"Lateral Movement Detection",sources:["EDR","AD","Network"],logic:"New admin session + unusual SMB traffic",severity:"High",active:true,lastTriggered:"2026-04-20T11:15:00Z"},
    {id:"CR04",name:"Malware Beacon Detection",sources:["DNS","Proxy","EDR"],logic:"Periodic DNS queries + known C2 patterns",severity:"Critical",active:true,lastTriggered:"2026-04-22T06:45:00Z"},
  ];
  @state() private _metricsKpiDaEventTimeline: Array<{timestamp:string;source:string;eventType:string;details:string;correlated:boolean}> = [
    {timestamp:"2026-04-22T10:34:12Z",source:"EDR",eventType:"Process Injection",details:"cmd.exe spawned from powershell",correlated:true},
    {timestamp:"2026-04-22T10:33:58Z",source:"AD",eventType:"Anomalous Login",details:"Service account used from new IP",correlated:true},
    {timestamp:"2026-04-22T10:32:01Z",source:"Firewall",eventType:"Port Scan",details:"192.168.1.45 scanning 10.0.0.0/8",correlated:false},
    {timestamp:"2026-04-22T10:30:45Z",source:"DLP",eventType:"Data Transfer",details:"10MB zip uploaded to external share",correlated:true},
    {timestamp:"2026-04-22T10:28:33Z",source:"DNS",eventType:"Suspicious Query",details:"Query to known malicious domain",correlated:true},
  ];
  @state() private _metricsKpiDaFalsePosMetrics: {totalEvents:number;correlatedEvents:number;falsePositives:number;fpRate:number;topFpRules:string[]} = {
    totalEvents: 45230, correlatedEvents: 3847, falsePositives: 892, fpRate: 0.232,
    topFpRules: ["Port Scan Detection", "Anomalous Login Location", "Large File Download"]
  };
  @state() private _metricsKpiDaEventPatterns: Array<{id:string;pattern:string;frequency:number;firstSeen:string;lastSeen:string;status:string}> = [
    {id:"EP01",pattern:"Credential stuffing from Tor exit nodes",frequency:23,firstSeen:"2026-03-15",lastSeen:"2026-04-22",status:"Active"},
    {id:"EP02",pattern:"DNS tunneling via TXT records",frequency:8,firstSeen:"2026-04-01",lastSeen:"2026-04-20",status:"Monitoring"},
    {id:"EP03",pattern:"Scheduled task persistence mechanism",frequency:3,firstSeen:"2026-04-10",lastSeen:"2026-04-18",status:"Investigating"},
  ];
  private _renderMetricskpidaEventCorr(): TemplateResult {
    const rules = this._metricsKpiDaCorrRules;
    const timeline = this._metricsKpiDaEventTimeline;
    const fpMetrics = this._metricsKpiDaFalsePosMetrics;
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


  // Security Data Lake Explorer Module
  private _renderSecurityDataLakeExplorer() {
    const dataSources = [
      { id: 'DS-01', name: 'SIEM Platform', type: 'Log Aggregation', records: '2.4B', freshness: '2 min', retention: '365 days', status: 'healthy' },
      { id: 'DS-02', name: 'EDR Console', type: 'Endpoint Telemetry', records: '890M', freshness: '5 min', retention: '180 days', status: 'healthy' },
      { id: 'DS-03', name: 'Vulnerability Scanner', type: 'Assessment Data', records: '4.2M', freshness: '24 hours', retention: '730 days', status: 'healthy' },
      { id: 'DS-04', name: 'Threat Intel Platform', type: 'IOC Feeds', records: '156M', freshness: '1 hour', retention: '90 days', status: 'degraded' },
      { id: 'DS-05', name: 'Cloud Audit Logs', type: 'Cloud Events', records: '1.1B', freshness: '10 min', retention: '365 days', status: 'healthy' },
      { id: 'DS-06', name: 'Network Flow Collector', type: 'NetFlow/sFlow', records: '5.8B', freshness: '1 min', retention: '90 days', status: 'healthy' },
    ];
    const queryBuilder = {
      source: 'SIEM Platform',
      timeframe: 'Last 24 hours',
      filters: ['event_type=auth', 'severity>=HIGH'],
      aggregation: 'COUNT BY src_ip',
      limit: 100,
    };
    const sampleResults = [
      { src_ip: '192.168.1.105', event_type: 'Failed Login', count: 342, severity: 'HIGH' },
      { src_ip: '10.0.5.22', event_type: 'Priv Escalation', count: 3, severity: 'CRITICAL' },
      { src_ip: '203.0.113.45', event_type: 'Brute Force', count: 1205, severity: 'HIGH' },
    ];
    const retentionPolicies = [
      { source: 'SIEM', current: '365 days', required: '365 days', compliant: true },
      { source: 'EDR', current: '180 days', required: '365 days', compliant: false },
      { source: 'NetFlow', current: '90 days', required: '180 days', compliant: false },
    ];
    const correlationQueries = [
      { name: 'Credential Abuse', sources: ['SIEM', 'EDR', 'IAM'], matches: 12, confidence: 0.92 },
      { name: 'Lateral Movement', sources: ['SIEM', 'NetFlow', 'EDR'], matches: 3, confidence: 0.87 },
      { name: 'Data Exfiltration', sources: ['DLP', 'NetFlow', 'Cloud'], matches: 5, confidence: 0.78 },
    ];
    return html`
      <section class="data-lake-explorer">
        <h4>Security Data Lake Explorer</h4>
        <div class="lake-grid">
          <div class="data-source-inventory">
            <h5>Data Source Inventory</h5>
            <table class="lake-table">
              <thead><tr><th>ID</th><th>Source</th><th>Type</th><th>Records</th><th>Freshness</th><th>Status</th></tr></thead>
              <tbody>
                ${dataSources.map(s => html`
                  <tr>
                    <td>${s.id}</td><td>${s.name}</td><td>${s.type}</td>
                    <td>${s.records}</td><td>${s.freshness}</td>
                    <td class="status-${s.status}">${s.status}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <div class="query-builder">
            <h5>Query Builder</h5>
            <div class="qb-config">
              <div class="qb-row"><span>Source:</span> <strong>${queryBuilder.source}</strong></div>
              <div class="qb-row"><span>Timeframe:</span> <strong>${queryBuilder.timeframe}</strong></div>
              <div class="qb-row"><span>Aggregation:</span> <strong>${queryBuilder.aggregation}</strong></div>
            </div>
          </div>
          <div class="query-results">
            <h5>Sample Results</h5>
            <table class="lake-table">
              <thead><tr><th>Source IP</th><th>Event</th><th>Count</th><th>Severity</th></tr></thead>
              <tbody>
                ${sampleResults.map(r => {
                  const sevColor = r.severity === 'CRITICAL' ? '#ef4444' : r.severity === 'HIGH' ? '#f97316' : '#eab308';
                  return html`<tr><td>${r.src_ip}</td><td>${r.event_type}</td><td>${r.count}</td><td style="color:${sevColor}">${r.severity}</td></tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div class="retention-policy">
            <h5>Retention Policy</h5>
            ${retentionPolicies.map(p => html`
              <div class="retention-item ${p.compliant ? 'compliant' : 'non-compliant'}">
                <span>${p.source}</span>
                <span>${p.current} \u2192 ${p.required}</span>
                <span class="retention-badge ${p.compliant ? 'ok' : 'fail'}">${p.compliant ? 'COMPLIANT' : 'NON-COMPLIANT'}</span>
              </div>`).join('')}
          </div>
          <div class="correlation-queries">
            <h5>Cross-Source Correlation</h5>
            ${correlationQueries.map(q => html`
              <div class="corr-item">
                <strong>${q.name}</strong>
                <span>${q.sources.join(' + ')}</span>
                <span>${q.matches} matches</span>
                <span>Confidence: ${(q.confidence * 100).toFixed(0)}%</span>
              </div>`).join('')}
          </div>
        </div>
      </section>`;
  }




  // --- Security Compliance Calendar ---
  @state() private _complianceCalendarEvents: Array<{id: string; title: string; deadline: string; category: string; status: string; assignee: string; notes: string}> = [
    {id: 'cc-metrics-kpi-dashboard-001', title: 'SOX Section 404 Compliance Review', deadline: '2026-06-30', category: 'Regulatory', status: 'In Progress', assignee: 'Compliance Team', notes: 'Annual internal control assessment for financial reporting'},
    {id: 'cc-metrics-kpi-dashboard-002', title: 'GDPR Data Protection Impact Assessment', deadline: '2026-05-15', category: 'Privacy', status: 'Pending', assignee: 'DPO Office', notes: 'Quarterly DPIA for high-risk processing activities'},
    {id: 'cc-metrics-kpi-dashboard-003', title: 'ISO 27001 Surveillance Audit', deadline: '2026-07-20', category: 'Certification', status: 'Scheduled', assignee: 'QA Lead', notes: 'Stage 2 surveillance audit for ISMS certification renewal'},
    {id: 'cc-metrics-kpi-dashboard-004', title: 'PCI DSS v4.0 Gap Analysis', deadline: '2026-05-30', category: 'Payment', status: 'Not Started', assignee: 'Security Architect', notes: 'Assess current state against PCI DSS v4.0 requirements'},
    {id: 'cc-metrics-kpi-dashboard-005', title: 'NIST CSF Self-Assessment', deadline: '2026-08-15', category: 'Framework', status: 'Pending', assignee: 'CISO', notes: 'Biannual self-assessment against NIST Cybersecurity Framework'},
    {id: 'cc-metrics-kpi-dashboard-006', title: 'HIPAA Security Rule Audit', deadline: '2026-06-15', category: 'Healthcare', status: 'In Progress', assignee: 'Compliance Analyst', notes: 'Annual audit of administrative, physical, and technical safeguards'},
    {id: 'cc-metrics-kpi-dashboard-007', title: 'SOC 2 Type II Report Renewal', deadline: '2026-09-30', category: 'Audit', status: 'Scheduled', assignee: 'External Auditor', notes: 'Engage auditor for SOC 2 Type II examination period'},
    {id: 'cc-metrics-kpi-dashboard-008', title: 'FedRAMP Authorization Review', deadline: '2026-07-01', category: 'Government', status: 'Pending', assignee: 'FedRAMP PMO', notes: 'Review and update security authorization package'},
    {id: 'cc-metrics-kpi-dashboard-009', title: 'Annual Penetration Test', deadline: '2026-10-15', category: 'Testing', status: 'Not Started', assignee: 'Red Team Lead', notes: 'Comprehensive external and internal penetration testing engagement'},
    {id: 'cc-metrics-kpi-dashboard-010', title: 'Security Awareness Training Rollout', deadline: '2026-05-01', category: 'Training', status: 'Completed', assignee: 'Security Awareness Manager', notes: 'Q2 organization-wide security awareness training program'},
    {id: 'cc-metrics-kpi-dashboard-011', title: 'Vendor Security Review Cycle', deadline: '2026-06-01', category: 'Third Party', status: 'In Progress', assignee: 'Vendor Manager', notes: 'Quarterly review of critical vendor security posture and SLA compliance'},
    {id: 'cc-metrics-kpi-dashboard-012', title: 'Incident Response Plan Update', deadline: '2026-05-20', category: 'Operations', status: 'Pending', assignee: 'IR Team Lead', notes: 'Update IR procedures based on lessons learned from recent incidents'},
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
    {id: 'exc-metrics-kpi-dashboard-001', title: 'Legacy TLS 1.0 Exception for Payment Gateway', riskLevel: 'High', status: 'Approved', requestor: 'Infrastructure Team', approver: 'CISO', createdDate: '2026-01-15', expiryDate: '2026-07-15', compensatingControls: ['Network segmentation', 'Enhanced monitoring', 'Quarterly review'], justification: 'Third-party payment processor requires TLS 1.0; migration planned for Q3'},
    {id: 'exc-metrics-kpi-dashboard-002', title: 'Admin Account with Non-SSO Access', riskLevel: 'Medium', status: 'Under Review', requestor: 'DevOps Lead', approver: 'IAM Manager', createdDate: '2026-02-20', expiryDate: '2026-08-20', compensatingControls: ['MFA enforced', 'Session recording', 'Weekly access audit'], justification: 'Emergency break-glass account for critical infrastructure management'},
    {id: 'exc-metrics-kpi-dashboard-003', title: 'Outdated Database Version Support', riskLevel: 'High', status: 'Approved', requestor: 'DBA Team', approver: 'CTO', createdDate: '2025-12-01', expiryDate: '2026-06-01', compensatingControls: ['Isolated network zone', 'Application-layer WAF', 'Monthly patching'], justification: 'Vendor application incompatibility with newer DB version; upgrade scheduled'},
    {id: 'exc-metrics-kpi-dashboard-004', title: 'Public S3 Bucket for Customer Assets', riskLevel: 'Critical', status: 'Expired', requestor: 'Product Team', approver: 'CISO', createdDate: '2025-09-01', expiryDate: '2026-03-01', compensatingControls: ['Signed URLs', 'Access logging', 'Content encryption'], justification: 'Legacy customer portal requires public access for document delivery'},
    {id: 'exc-metrics-kpi-dashboard-005', title: 'VPN Bypass for Cloud-Native Workloads', riskLevel: 'Medium', status: 'Pending', requestor: 'Cloud Architecture', approver: 'Security Architect', createdDate: '2026-03-10', expiryDate: '2026-09-10', compensatingControls: ['Zero Trust network policies', 'mTLS between services', 'Service mesh encryption'], justification: 'Cloud-native microservices require direct connectivity for performance'},
    {id: 'exc-metrics-kpi-dashboard-006', title: 'Default Password Policy Override', riskLevel: 'High', status: 'Denied', requestor: 'HR Department', approver: 'CISO', createdDate: '2026-03-15', expiryDate: '2026-09-15', compensatingControls: ['Password manager deployment', 'SSO integration'], justification: 'Requested simpler password requirements for non-technical staff'},
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
    {id: 'dq-metrics-kpi-dashboard-001', dataSource: 'Vulnerability Scanner Feed', completenessScore: 94, accuracyScore: 91, timelinessScore: 88, consistencyScore: 95, reliabilityRank: 1, lastUpdated: '2026-04-23T08:00:00Z', issues: ['Minor delay in Nessus plugin updates'], trend: 'improving'},
    {id: 'dq-metrics-kpi-dashboard-002', dataSource: 'SIEM Event Logs', completenessScore: 87, accuracyScore: 93, timelinessScore: 96, consistencyScore: 89, reliabilityRank: 2, lastUpdated: '2026-04-23T07:30:00Z', issues: ['Some log sources showing gaps in off-hours'], trend: 'stable'},
    {id: 'dq-metrics-kpi-dashboard-003', dataSource: 'Asset Inventory Database', completenessScore: 82, accuracyScore: 78, timelinessScore: 75, consistencyScore: 84, reliabilityRank: 4, lastUpdated: '2026-04-22T18:00:00Z', issues: ['Shadow IT devices not fully cataloged', 'Decommissioned assets still listed'], trend: 'declining'},
    {id: 'dq-metrics-kpi-dashboard-004', dataSource: 'Threat Intelligence Platform', completenessScore: 91, accuracyScore: 89, timelinessScore: 92, consistencyScore: 87, reliabilityRank: 3, lastUpdated: '2026-04-23T06:00:00Z', issues: ['Some IOC sources lack confidence scoring'], trend: 'improving'},
    {id: 'dq-metrics-kpi-dashboard-005', dataSource: 'Identity Provider Logs', completenessScore: 96, accuracyScore: 97, timelinessScore: 98, consistencyScore: 96, reliabilityRank: 1, lastUpdated: '2026-04-23T09:00:00Z', issues: [], trend: 'stable'},
    {id: 'dq-metrics-kpi-dashboard-006', dataSource: 'Cloud Security Posture Data', completenessScore: 79, accuracyScore: 85, timelinessScore: 82, consistencyScore: 81, reliabilityRank: 5, lastUpdated: '2026-04-23T05:00:00Z', issues: ['Multi-cloud coverage gaps', 'API rate limiting affects scan frequency'], trend: 'declining'},
    {id: 'dq-metrics-kpi-dashboard-007', dataSource: 'Compliance Evidence Store', completenessScore: 88, accuracyScore: 86, timelinessScore: 80, consistencyScore: 83, reliabilityRank: 4, lastUpdated: '2026-04-21T14:00:00Z', issues: ['Manual evidence collection delays', 'Inconsistent formatting across frameworks'], trend: 'stable'},
    {id: 'dq-metrics-kpi-dashboard-008', dataSource: 'Network Flow Data', completenessScore: 92, accuracyScore: 90, timelinessScore: 94, consistencyScore: 91, reliabilityRank: 2, lastUpdated: '2026-04-23T08:30:00Z', issues: ['Encrypted traffic classification accuracy needs improvement'], trend: 'improving'},
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
    {id: 'wf-metrics-kpi-dashboard-001', name: 'Vulnerability Triage Pipeline', description: 'Automated vulnerability assessment, prioritization, and assignment workflow', category: 'Vulnerability Management', steps: 8, avgDuration: '12 min', successRate: 94.5, lastRun: '2026-04-23T06:00:00Z', manualInterventions: 2, optimizationScore: 87},
    {id: 'wf-metrics-kpi-dashboard-002', name: 'Incident Response Orchestration', description: 'End-to-end IR workflow from detection to containment and recovery', category: 'Incident Response', steps: 15, avgDuration: '45 min', successRate: 89.2, lastRun: '2026-04-22T14:30:00Z', manualInterventions: 5, optimizationScore: 72},
    {id: 'wf-metrics-kpi-dashboard-003', name: 'Access Request Approval Chain', description: 'Multi-level approval workflow for privileged access requests', category: 'Identity & Access', steps: 6, avgDuration: '4 hours', successRate: 97.1, lastRun: '2026-04-23T09:15:00Z', manualInterventions: 1, optimizationScore: 92},
    {id: 'wf-metrics-kpi-dashboard-004', name: 'Compliance Evidence Collection', description: 'Automated gathering and packaging of audit evidence artifacts', category: 'Compliance', steps: 10, avgDuration: '30 min', successRate: 91.8, lastRun: '2026-04-21T10:00:00Z', manualInterventions: 3, optimizationScore: 78},
    {id: 'wf-metrics-kpi-dashboard-005', name: 'Security Patch Deployment', description: 'Staged patch rollout with validation and rollback capability', category: 'Patch Management', steps: 12, avgDuration: '2 hours', successRate: 96.3, lastRun: '2026-04-20T22:00:00Z', manualInterventions: 1, optimizationScore: 85},
    {id: 'wf-metrics-kpi-dashboard-006', name: 'Threat Intelligence Enrichment', description: 'IOC enrichment and correlation with internal threat data', category: 'Threat Intelligence', steps: 7, avgDuration: '8 min', successRate: 93.7, lastRun: '2026-04-23T07:00:00Z', manualInterventions: 0, optimizationScore: 95},
    {id: 'wf-metrics-kpi-dashboard-007', name: 'Security Reporting Pipeline', description: 'Automated generation and distribution of security metrics reports', category: 'Reporting', steps: 5, avgDuration: '15 min', successRate: 98.9, lastRun: '2026-04-23T08:00:00Z', manualInterventions: 0, optimizationScore: 97},
    {id: 'wf-metrics-kpi-dashboard-008', name: 'Vendor Risk Assessment', description: 'Automated vendor security questionnaire distribution and scoring', category: 'Third Party', steps: 9, avgDuration: '3 days', successRate: 85.4, lastRun: '2026-04-19T11:00:00Z', manualInterventions: 4, optimizationScore: 65},
  ];

  @state() private _workflowExecutionHistory: Array<{workflowId: string; runDate: string; duration: string; status: string; trigger: string}> = [
    {workflowId: 'wf-metrics-kpi-dashboard-001', runDate: '2026-04-23T06:00:00Z', duration: '11 min 23 sec', status: 'Success', trigger: 'Scheduled'},
    {workflowId: 'wf-metrics-kpi-dashboard-002', runDate: '2026-04-22T14:30:00Z', duration: '42 min 15 sec', status: 'Success', trigger: 'Alert'},
    {workflowId: 'wf-metrics-kpi-dashboard-003', runDate: '2026-04-23T09:15:00Z', duration: '3h 45 min', status: 'Success', trigger: 'User Request'},
    {workflowId: 'wf-metrics-kpi-dashboard-001', runDate: '2026-04-22T06:00:00Z', duration: '13 min 08 sec', status: 'Partial', trigger: 'Scheduled'},
    {workflowId: 'wf-metrics-kpi-dashboard-004', runDate: '2026-04-21T10:00:00Z', duration: '28 min 42 sec', status: 'Success', trigger: 'Scheduled'},
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
    {id: 'kb-metrics-kpi-dashboard-001', title: 'Zero Trust Architecture Implementation Guide', category: 'Architecture', author: 'Security Architecture Team', publishDate: '2026-03-15', views: 1842, rating: 4.8, tags: ['zero-trust', 'network', 'identity'], summary: 'Comprehensive guide for implementing zero trust principles across enterprise infrastructure', readTime: '15 min'},
    {id: 'kb-metrics-kpi-dashboard-002', title: 'Ransomware Defense Playbook 2026', category: 'Threats', author: 'Threat Intelligence Team', publishDate: '2026-04-01', views: 2341, rating: 4.9, tags: ['ransomware', 'incident-response', 'defense'], summary: 'Updated playbook with latest ransomware tactics, techniques, and defensive measures', readTime: '12 min'},
    {id: 'kb-metrics-kpi-dashboard-003', title: 'Cloud Security Best Practices for Multi-Cloud', category: 'Cloud', author: 'Cloud Security Team', publishDate: '2026-02-28', views: 1567, rating: 4.5, tags: ['cloud', 'aws', 'azure', 'gcp'], summary: 'Best practices for securing workloads across multiple cloud service providers', readTime: '18 min'},
    {id: 'kb-metrics-kpi-dashboard-004', title: 'API Security Testing Methodology', category: 'Testing', author: 'Red Team', publishDate: '2026-03-22', views: 987, rating: 4.6, tags: ['api', 'testing', 'owasp'], summary: 'Structured methodology for identifying and testing API security vulnerabilities', readTime: '10 min'},
    {id: 'kb-metrics-kpi-dashboard-005', title: 'Supply Chain Security Risk Management', category: 'Third Party', author: 'GRC Team', publishDate: '2026-01-20', views: 1234, rating: 4.3, tags: ['supply-chain', 'vendor', 'risk'], summary: 'Framework for managing security risks in the software supply chain', readTime: '14 min'},
    {id: 'kb-metrics-kpi-dashboard-006', title: 'Kubernetes Security Hardening Checklist', category: 'Container', author: 'Platform Security', publishDate: '2026-04-10', views: 2103, rating: 4.7, tags: ['kubernetes', 'container', 'hardening'], summary: 'Step-by-step hardening checklist for production Kubernetes clusters', readTime: '11 min'},
    {id: 'kb-metrics-kpi-dashboard-007', title: 'Security Metrics That Matter for Executives', category: 'Metrics', author: 'CISO Office', publishDate: '2026-03-05', views: 876, rating: 4.4, tags: ['metrics', 'kpi', 'reporting'], summary: 'Key security metrics and KPIs that resonate with board-level stakeholders', readTime: '8 min'},
    {id: 'kb-metrics-kpi-dashboard-008', title: 'Phishing Simulation Campaign Design', category: 'Awareness', author: 'Security Awareness Team', publishDate: '2026-02-15', views: 1456, rating: 4.5, tags: ['phishing', 'simulation', 'training'], summary: 'Designing effective phishing simulations that drive real behavioral change', readTime: '9 min'},
    {id: 'kb-metrics-kpi-dashboard-009', title: 'Data Loss Prevention Strategy and Implementation', category: 'Data Protection', author: 'Data Security Team', publishDate: '2026-03-28', views: 1678, rating: 4.6, tags: ['dlp', 'data-protection', 'compliance'], summary: 'Strategic approach to DLP covering people, process, and technology layers', readTime: '16 min'},
    {id: 'kb-metrics-kpi-dashboard-010', title: 'Security Automation with SOAR Platforms', category: 'Automation', author: 'SOC Engineering', publishDate: '2026-04-05', views: 1098, rating: 4.7, tags: ['soar', 'automation', 'soc'], summary: 'Building effective security automation playbooks using SOAR technology', readTime: '13 min'},
    {id: 'kb-metrics-kpi-dashboard-011', title: 'Third-Party Risk Assessment Framework', category: 'GRC', author: 'Vendor Management', publishDate: '2026-01-30', views: 1345, rating: 4.4, tags: ['vendor', 'risk', 'assessment'], summary: 'Structured framework for evaluating and monitoring third-party security risks', readTime: '12 min'},
    {id: 'kb-metrics-kpi-dashboard-012', title: 'Network Detection and Response Best Practices', category: 'Network', author: 'Network Security Team', publishDate: '2026-03-18', views: 1567, rating: 4.5, tags: ['ndr', 'network', 'detection'], summary: 'Implementing effective network detection and response capabilities', readTime: '14 min'},
    {id: 'kb-metrics-kpi-dashboard-013', title: 'Security Chaos Engineering Guide', category: 'Resilience', author: 'SRE Security', publishDate: '2026-04-12', views: 789, rating: 4.3, tags: ['chaos-engineering', 'resilience', 'testing'], summary: 'Applying chaos engineering principles to validate security controls', readTime: '10 min'},
    {id: 'kb-metrics-kpi-dashboard-014', title: 'Incident Communication Templates', category: 'Incident Response', author: 'IR Team', publishDate: '2026-02-22', views: 2234, rating: 4.8, tags: ['incident', 'communication', 'templates'], summary: 'Ready-to-use communication templates for security incident scenarios', readTime: '7 min'},
    {id: 'kb-metrics-kpi-dashboard-015', title: 'Endpoint Detection and Response Configuration', category: 'Endpoint', author: 'Endpoint Security', publishDate: '2026-03-08', views: 1345, rating: 4.5, tags: ['edr', 'endpoint', 'configuration'], summary: 'Optimal EDR configuration for maximum detection with minimal false positives', readTime: '11 min'},
    {id: 'kb-metrics-kpi-dashboard-016', title: 'Security Code Review Standards', category: 'Development', author: 'AppSec Team', publishDate: '2026-02-10', views: 1890, rating: 4.6, tags: ['code-review', 'secure-sdlc', 'standards'], summary: 'Standards and checklists for security-focused code reviews', readTime: '13 min'},
    {id: 'kb-metrics-kpi-dashboard-017', title: 'IoT Security Assessment Methodology', category: 'IoT', author: 'IoT Security Lab', publishDate: '2026-04-08', views: 654, rating: 4.2, tags: ['iot', 'embedded', 'assessment'], summary: 'Methodology for assessing security posture of IoT devices and ecosystems', readTime: '15 min'},
    {id: 'kb-metrics-kpi-dashboard-018', title: 'Passwordless Authentication Migration Guide', category: 'Identity', author: 'IAM Team', publishDate: '2026-03-25', views: 1678, rating: 4.7, tags: ['passwordless', 'authentication', 'mfa'], summary: 'Step-by-step migration plan from password-based to passwordless authentication', readTime: '12 min'},
    {id: 'kb-metrics-kpi-dashboard-019', title: 'Security Awareness Program Metrics', category: 'Awareness', author: 'Security Culture Team', publishDate: '2026-01-25', views: 1123, rating: 4.4, tags: ['awareness', 'metrics', 'culture'], summary: 'Measuring the effectiveness of your security awareness and training programs', readTime: '9 min'},
    {id: 'kb-metrics-kpi-dashboard-020', title: 'Deception Technology Deployment Guide', category: 'Detection', author: 'Blue Team', publishDate: '2026-04-15', views: 876, rating: 4.5, tags: ['deception', 'honeypot', 'detection'], summary: 'Planning and deploying deception technology for advanced threat detection', readTime: '11 min'},
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

  // --- Security Scenario Planning Methods (MEKPDA) ---
  private _initMekpdaScenarios(): void {
    const worstCaseScenarios = [
      { id: "mekpda-sc-01", name: "Ransomware Attack on Critical Infrastructure", category: "Malware", impact: 9500000, probability: 0.12, recoveryDays: 21, affectedSystems: 47, dataLossGb: 320, businessImpact: "critical" },
      { id: "mekpda-sc-02", name: "Insider Data Exfiltration via Authorized Channels", category: "Insider Threat", impact: 7200000, probability: 0.18, recoveryDays: 14, affectedSystems: 12, dataLossGb: 85, businessImpact: "high" },
      { id: "mekpda-sc-03", name: "Supply Chain Compromise via Third-Party Library", category: "Supply Chain", impact: 6800000, probability: 0.09, recoveryDays: 30, affectedSystems: 63, dataLossGb: 0, businessImpact: "critical" },
      { id: "mekpda-sc-04", name: "Cloud Misconfiguration Leading to Public Exposure", category: "Cloud", impact: 4100000, probability: 0.22, recoveryDays: 7, affectedSystems: 8, dataLossGb: 450, businessImpact: "high" },
      { id: "mekpda-sc-05", name: "Zero-Day Exploit in Core Application Framework", category: "Vulnerability", impact: 8900000, probability: 0.05, recoveryDays: 45, affectedSystems: 120, dataLossGb: 0, businessImpact: "critical" },
      { id: "mekpda-sc-06", name: "Distributed Denial of Service on Customer-Facing Services", category: "Availability", impact: 3400000, probability: 0.25, recoveryDays: 3, affectedSystems: 15, dataLossGb: 0, businessImpact: "medium" },
      { id: "mekpda-sc-07", name: "Credential Stuffing and Account Takeover Wave", category: "Identity", impact: 2800000, probability: 0.30, recoveryDays: 5, affectedSystems: 6, dataLossGb: 12, businessImpact: "medium" },
      { id: "mekpda-sc-08", name: "Physical Security Breach at Data Center Facility", category: "Physical", impact: 12000000, probability: 0.02, recoveryDays: 60, affectedSystems: 200, dataLossGb: 5000, businessImpact: "critical" },
    ];
    this._mekpdaScenarios = worstCaseScenarios.map(s => ({ ...s, mitigationCost: Math.round(s.impact * 0.08), drillScheduled: false, lastDrillDate: null, drillScore: null, controlGaps: Math.floor(Math.random() * 5) + 1 }));
  }

  private _calculateMekpdaScenarioRisk(): void {
    this._mekpdaScenarios.forEach(s => {
      const riskScore = s.impact * s.probability;
      s.riskScore = Math.round(riskScore);
      s.riskLevel = riskScore > 1000000 ? "extreme" : riskScore > 500000 ? "high" : riskScore > 200000 ? "medium" : "low";
      s.mitigationPriority = s.riskScore > 500000 ? "immediate" : s.riskScore > 200000 ? "planned" : "monitor";
      s.residualRisk = Math.round(s.riskScore * (1 - (s.controlGaps * 0.12)));
      s.bciScore = Math.round((s.recoveryDays * 0.3 + s.affectedSystems * 0.4 + (s.dataLossGb > 0 ? 0.3 : 0)) * 100);
    });
  }

  private _scheduleMekpdaDrills(): void {
    const drillCadence = { quarterly: ["Q1", "Q2", "Q3", "Q4"], semiAnnual: ["H1", "H2"], annual: ["FY"] };
    this._mekpdaScenarios.forEach(s => {
      if (s.probability > 0.15 && s.businessImpact === "critical") s.drillCadence = "quarterly";
      else if (s.probability > 0.10 || s.businessImpact === "high") s.drillCadence = "semiAnnual";
      else s.drillCadence = "annual";
      const periods = drillCadence[s.drillCadence as keyof typeof drillCadence];
      s.nextDrillDate = periods[Math.floor(Math.random() * periods.length)] + "-2026";
    });
  }

  private _mekpdaScenarioComparison(): Record<string, unknown>[] {
    return this._mekpdaScenarios.map(s => ({
      scenario: s.name, impact: s.impact, probability: s.probability, risk: s.riskScore,
      level: s.riskLevel, recovery: s.recoveryDays + "d", priority: s.mitigationPriority,
      residual: s.residualRisk, bci: s.bciScore, gaps: s.controlGaps
    }));
  }

  // --- Security Control Effectiveness Analytics (MEKPDA) ---
  private _initMekpdaControls(): void {
    const controls = [
      { id: "mekpda-ct-01", name: "Network Segmentation", type: "preventive", maturity: "defined", score: 82, target: 90, failures: 3, lastTest: "2026-03-15" },
      { id: "mekpda-ct-02", name: "Endpoint Detection and Response", type: "detective", maturity: "managed", score: 88, target: 92, failures: 1, lastTest: "2026-04-01" },
      { id: "mekpda-ct-03", name: "Data Loss Prevention", type: "preventive", maturity: "repeatable", score: 71, target: 85, failures: 7, lastTest: "2026-03-22" },
      { id: "mekpda-ct-04", name: "Security Information and Event Management", type: "detective", maturity: "managed", score: 85, target: 90, failures: 2, lastTest: "2026-04-05" },
      { id: "mekpda-ct-05", name: "Identity and Access Management", type: "preventive", maturity: "defined", score: 76, target: 88, failures: 5, lastTest: "2026-03-28" },
      { id: "mekpda-ct-06", name: "Vulnerability Management", type: "corrective", maturity: "managed", score: 80, target: 90, failures: 4, lastTest: "2026-04-02" },
      { id: "mekpda-ct-07", name: "Email Security Gateway", type: "preventive", maturity: "managed", score: 90, target: 95, failures: 1, lastTest: "2026-04-08" },
      { id: "mekpda-ct-08", name: "Web Application Firewall", type: "preventive", maturity: "managed", score: 87, target: 92, failures: 2, lastTest: "2026-03-30" },
      { id: "mekpda-ct-09", name: "Patch Management", type: "corrective", maturity: "defined", score: 68, target: 85, failures: 9, lastTest: "2026-03-18" },
      { id: "mekpda-ct-10", name: "Encryption at Rest", type: "preventive", maturity: "managed", score: 93, target: 95, failures: 0, lastTest: "2026-04-10" },
      { id: "mekpda-ct-11", name: "Encryption in Transit", type: "preventive", maturity: "optimized", score: 96, target: 98, failures: 0, lastTest: "2026-04-12" },
      { id: "mekpda-ct-12", name: "Privileged Access Management", type: "preventive", maturity: "defined", score: 74, target: 88, failures: 6, lastTest: "2026-03-25" },
      { id: "mekpda-ct-13", name: "Security Awareness Training", type: "preventive", maturity: "repeatable", score: 65, target: 80, failures: 11, lastTest: "2026-03-20" },
      { id: "mekpda-ct-14", name: "Incident Response Plan", type: "corrective", maturity: "managed", score: 78, target: 88, failures: 4, lastTest: "2026-04-03" },
      { id: "mekpda-ct-15", name: "Backup and Recovery", type: "corrective", maturity: "managed", score: 84, target: 92, failures: 3, lastTest: "2026-04-06" },
      { id: "mekpda-ct-16", name: "Multi-Factor Authentication", type: "preventive", maturity: "managed", score: 91, target: 95, failures: 1, lastTest: "2026-04-09" },
      { id: "mekpda-ct-17", name: "Network Traffic Analysis", type: "detective", maturity: "defined", score: 72, target: 85, failures: 5, lastTest: "2026-03-27" },
      { id: "mekpda-ct-18", name: "Cloud Security Posture Management", type: "detective", maturity: "repeatable", score: 69, target: 82, failures: 8, lastTest: "2026-03-24" },
      { id: "mekpda-ct-19", name: "Container Security Scanning", type: "preventive", maturity: "defined", score: 75, target: 85, failures: 5, lastTest: "2026-04-04" },
      { id: "mekpda-ct-20", name: "API Security Gateway", type: "preventive", maturity: "repeatable", score: 70, target: 82, failures: 7, lastTest: "2026-03-29" },
      { id: "mekpda-ct-21", name: "Threat Intelligence Platform", type: "detective", maturity: "managed", score: 83, target: 90, failures: 2, lastTest: "2026-04-07" },
      { id: "mekpda-ct-22", name: "Database Activity Monitoring", type: "detective", maturity: "defined", score: 67, target: 80, failures: 8, lastTest: "2026-03-21" },
      { id: "mekpda-ct-23", name: "Deception Technology", type: "detective", maturity: "initial", score: 55, target: 75, failures: 12, lastTest: "2026-03-16" },
      { id: "mekpda-ct-24", name: "Security Orchestration Automation", type: "corrective", maturity: "repeatable", score: 73, target: 85, failures: 6, lastTest: "2026-04-01" },
      { id: "mekpda-ct-25", name: "Third-Party Risk Assessment", type: "preventive", maturity: "defined", score: 64, target: 78, failures: 9, lastTest: "2026-03-19" },
    ];
    this._mekpdaControls = controls;
  }

  private _analyzeMekpdaControlEffectiveness(): void {
    const typeBreakdown: Record<string, { total: number; avgScore: number; avgFailures: number }> = {};
    this._mekpdaControls.forEach(c => {
      if (!typeBreakdown[c.type]) typeBreakdown[c.type] = { total: 0, avgScore: 0, avgFailures: 0 };
      typeBreakdown[c.type].total++;
      typeBreakdown[c.type].avgScore += c.score;
      typeBreakdown[c.type].avgFailures += c.failures;
    });
    Object.keys(typeBreakdown).forEach(t => {
      typeBreakdown[t].avgScore = Math.round(typeBreakdown[t].avgScore / typeBreakdown[t].total);
      typeBreakdown[t].avgFailures = Math.round(typeBreakdown[t].avgFailures / typeBreakdown[t].total * 10) / 10;
    });
    this._mekpdaControlTypeBreakdown = typeBreakdown;
  }

  private _mekpdaControlOptimization(): Record<string, unknown>[] {
    return this._mekpdaControls.filter(c => c.score < c.target).map(c => ({
      control: c.name, current: c.score, target: c.target, gap: c.target - c.score,
      failures: c.failures, maturity: c.maturity, recommendation:
        c.score < 70 ? "Critical: Immediate improvement required" :
        c.score < 80 ? "Significant: Plan improvement sprint" :
        "Moderate: Fine-tune and optimize"
    })).sort((a: any, b: any) => (b.gap as number) - (a.gap as number));
  }

  // --- Security Data Pipeline Health (MEKPDA) ---
  private _initMekpdaPipelines(): void {
    const pipelines = [
      { id: "mekpda-pl-01", name: "SIEM Log Ingestion", status: "healthy", healthScore: 94, latencyMs: 120, freshnessMin: 2, errorRate: 0.02, throughputMbps: 450, recordsPerSec: 12000, backPressure: 0.05, uptime: 99.97 },
      { id: "mekpda-pl-02", name: "Threat Feed Aggregation", status: "healthy", healthScore: 91, latencyMs: 300, freshnessMin: 15, errorRate: 0.05, throughputMbps: 85, recordsPerSec: 3200, backPressure: 0.08, uptime: 99.92 },
      { id: "mekpda-pl-03", name: "Vulnerability Scan Results", status: "degraded", healthScore: 72, latencyMs: 2500, freshnessMin: 60, errorRate: 0.15, throughputMbps: 25, recordsPerSec: 800, backPressure: 0.35, uptime: 98.50 },
      { id: "mekpda-pl-04", name: "Endpoint Telemetry Stream", status: "healthy", healthScore: 88, latencyMs: 450, freshnessMin: 5, errorRate: 0.08, throughputMbps: 280, recordsPerSec: 8500, backPressure: 0.12, uptime: 99.85 },
      { id: "mekpda-pl-05", name: "Cloud Audit Log Pipeline", status: "healthy", healthScore: 86, latencyMs: 600, freshnessMin: 10, errorRate: 0.06, throughputMbps: 150, recordsPerSec: 4500, backPressure: 0.10, uptime: 99.80 },
      { id: "mekpda-pl-06", name: "Identity Event Stream", status: "warning", healthScore: 78, latencyMs: 1200, freshnessMin: 20, errorRate: 0.12, throughputMbps: 45, recordsPerSec: 1500, backPressure: 0.22, uptime: 99.40 },
      { id: "mekpda-pl-07", name: "Network Flow Collection", status: "healthy", healthScore: 82, latencyMs: 800, freshnessMin: 8, errorRate: 0.09, throughputMbps: 650, recordsPerSec: 18000, backPressure: 0.15, uptime: 99.70 },
      { id: "mekpda-pl-08", name: "DLP Incident Pipeline", status: "degraded", healthScore: 68, latencyMs: 3500, freshnessMin: 45, errorRate: 0.20, throughputMbps: 18, recordsPerSec: 500, backPressure: 0.42, uptime: 97.80 },
    ];
    this._mekpdaPipelines = pipelines.map(p => ({ ...p, dependencies: [], slaBreached: p.healthScore < 75, alertThreshold: p.errorRate > 0.15 }));
    this._mekpdaPipelines[0].dependencies = ["mekpda-pl-04", "mekpda-pl-07"];
    this._mekpdaPipelines[4].dependencies = ["mekpda-pl-01"];
    this._mekpdaPipelines[5].dependencies = ["mekpda-pl-02"];
    this._mekpdaPipelines[7].dependencies = ["mekpda-pl-04", "mekpda-pl-05"];
  }

  private _mekpdaPipelineTrend(): Record<string, unknown>[] {
    const hours = Array.from({ length: 24 }, (_, i) => `H${String(i).padStart(2, "0")}`);
    return this._mekpdaPipelines.map(p => ({
      pipeline: p.name, status: p.status, health: p.healthScore,
      latency: p.latencyMs, freshness: p.freshnessMin, errors: p.errorRate,
      throughput: p.throughputMbps, recordsSec: p.recordsPerSec, slaOk: !p.slaBreached,
      hourlyHealth: hours.map(h => Math.max(50, p.healthScore + Math.floor(Math.random() * 20) - 10))
    }));
  }

  // --- Security Stakeholder Report Generator (MEKPDA) ---
  private _initMekpdaReportTemplates(): void {
    this._mekpdaReportTemplates = [
      { id: "mekpda-rp-01", name: "Board Security Report", audience: "board", frequency: "quarterly", sections: 6, autoGenerate: true, lastGenerated: "2026-03-31", pages: 12 },
      { id: "mekpda-rp-02", name: "Executive Risk Summary", audience: "executive", frequency: "monthly", sections: 8, autoGenerate: true, lastGenerated: "2026-04-01", pages: 8 },
      { id: "mekpda-rp-03", name: "Technical Security Review", audience: "technical", frequency: "weekly", sections: 12, autoGenerate: true, lastGenerated: "2026-04-21", pages: 25 },
      { id: "mekpda-rp-04", name: "Audit Compliance Report", audience: "audit", frequency: "quarterly", sections: 10, autoGenerate: false, lastGenerated: "2026-03-15", pages: 35 },
      { id: "mekpda-rp-05", name: "Regulatory Filing Package", audience: "regulatory", frequency: "annual", sections: 15, autoGenerate: false, lastGenerated: "2025-12-31", pages: 48 },
    ];
  }

  private _generateMekpdaExecSummary(): string {
    const totalRisk = this._mekpdaScenarios.reduce((sum: number, s: any) => sum + s.riskScore, 0);
    const avgControl = Math.round(this._mekpdaControls.reduce((sum: number, c: any) => sum + c.score, 0) / this._mekpdaControls.length);
    const degradedPipes = this._mekpdaPipelines.filter((p: any) => p.status !== "healthy").length;
    return `Overall risk exposure: ${(totalRisk / 1000000).toFixed(1)}M. Average control effectiveness: {avgControl}%. {degradedPipes} pipeline(s) need attention. {this._mekpdaScenarios.filter((s: any) => s.mitigationPriority === "immediate").length} scenarios require immediate action.`;
  }

  // --- Security Technology Radar (MEKPDA) ---
  private _initMekpdaTechRadar(): void {
    this._mekpdaTechRadar = [
      { id: "mekpda-tr-01", name: "AI-Powered Threat Detection", ring: "adopt", category: "Detection", maturity: 4, trend: "up", investment: "high", roi: 3.2, vendorCount: 8 },
      { id: "mekpda-tr-02", name: "Zero Trust Architecture", ring: "adopt", category: "Architecture", maturity: 4, trend: "up", investment: "high", roi: 2.8, vendorCount: 12 },
      { id: "mekpda-tr-03", name: "SASE/SSE Platform", ring: "trial", category: "Network", maturity: 3, trend: "up", investment: "medium", roi: 2.4, vendorCount: 10 },
      { id: "mekpda-tr-04", name: "CNAPP Cloud Security", ring: "trial", category: "Cloud", maturity: 3, trend: "up", investment: "medium", roi: 2.1, vendorCount: 7 },
      { id: "mekpda-tr-05", name: "Extended Detection and Response", ring: "adopt", category: "Detection", maturity: 4, trend: "stable", investment: "high", roi: 2.9, vendorCount: 9 },
      { id: "mekpda-tr-06", name: "Quantum-Safe Cryptography", ring: "assess", category: "Crypto", maturity: 2, trend: "up", investment: "low", roi: 0.8, vendorCount: 4 },
      { id: "mekpda-tr-07", name: "Security Service Edge", ring: "trial", category: "Network", maturity: 3, trend: "up", investment: "medium", roi: 2.0, vendorCount: 6 },
      { id: "mekpda-tr-08", name: "SOAR 2.0 Autonomous SOC", ring: "assess", category: "Operations", maturity: 2, trend: "up", investment: "low", roi: 1.2, vendorCount: 5 },
      { id: "mekpda-tr-09", name: "Software Supply Chain Security", ring: "trial", category: "DevSecOps", maturity: 3, trend: "up", investment: "medium", roi: 2.3, vendorCount: 8 },
      { id: "mekpda-tr-10", name: "Identity Threat Detection", ring: "adopt", category: "Identity", maturity: 3, trend: "up", investment: "high", roi: 2.7, vendorCount: 7 },
      { id: "mekpda-tr-11", name: "Data Security Posture Management", ring: "trial", category: "Data", maturity: 3, trend: "up", investment: "medium", roi: 2.2, vendorCount: 9 },
      { id: "mekpda-tr-12", name: "Decentralized Identity Standards", ring: "hold", category: "Identity", maturity: 1, trend: "stable", investment: "low", roi: 0.5, vendorCount: 3 },
    ];
  }

  private _mekpdaRadarSummary(): Record<string, unknown> {
    const rings: Record<string, number> = { adopt: 0, trial: 0, assess: 0, hold: 0 };
    this._mekpdaTechRadar.forEach(t => { if (rings[t.ring as keyof typeof rings] !== undefined) rings[t.ring as keyof typeof rings]++; });
    return { adopt: rings.adopt, trial: rings.trial, assess: rings.assess, hold: rings.hold, total: this._mekpdaTechRadar.length, avgMaturity: 2.8, topInvestment: this._mekpdaTechRadar.filter(t => t.investment === "high").map(t => t.name) };
  }

  // --- MEKPDA Security Compliance Mapping Matrix ---
  private _initMekpdaComplianceMatrix(): void {
    const frameworks = ["ISO 27001", "SOC 2 Type II", "PCI DSS 4.0", "NIST CSF 2.0", "GDPR", "HIPAA", "FedRAMP", "CIS Controls v8"];
    const domains = ["Access Control", "Data Protection", "Network Security", "Endpoint Security", "Incident Response", "Risk Management", "Asset Management", "Compliance Monitoring"];
    this._mekpdaComplianceMatrix = frameworks.map(fw => ({
      framework: fw, totalControls: Math.floor(Math.random() * 60) + 80, implemented: Math.floor(Math.random() * 40) + 50,
      partial: Math.floor(Math.random() * 20) + 10, gaps: Math.floor(Math.random() * 15) + 3,
      lastAudit: "2026-" + String(Math.floor(Math.random() * 4) + 1).padStart(2, "0") + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0"),
      nextAudit: "2027-" + String(Math.floor(Math.random() * 6) + 1).padStart(2, "0") + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0"),
      score: Math.floor(Math.random() * 20) + 72, status: Math.random() > 0.3 ? "compliant" : "partial",
      domains: domains.map(d => ({ domain: d, controls: Math.floor(Math.random() * 10) + 5, passed: Math.floor(Math.random() * 8) + 2 }))
    }));
  }

  private _mekpdaComplianceTrend(): Record<string, unknown>[] {
    const quarters = ["Q1-2025", "Q2-2025", "Q3-2025", "Q4-2025", "Q1-2026", "Q2-2026"];
    return this._mekpdaComplianceMatrix.map(fw => ({
      framework: fw, score: fw.score, status: fw.status,
      trend: quarters.map(q => Math.min(100, fw.score - 15 + Math.floor(Math.random() * 20))),
      gaps: fw.gaps, implemented: fw.implemented, total: fw.totalControls,
      coverage: Math.round((fw.implemented / fw.totalControls) * 100)
    }));
  }

  // --- MEKPDA Threat Intelligence Correlation Engine ---
  private _initMekpdaThreatIntel(): void {
    const threatActors = ["APT29", "APT41", "Lazarus Group", "FIN7", "Conti", "Sandworm", "Fancy Bear", "Tick Group"];
    const techniques = ["T1059.001", "T1190", "T1566.001", "T1078", "T1055", "T1486", "T1021.001", "T1071.001"];
    const sectors = ["Finance", "Healthcare", "Technology", "Government", "Energy", "Manufacturing", "Retail", "Telecom"];
    this._mekpdaThreatIntel = threatActors.map((actor, i) => ({
      actor, sophistication: ["advanced", "advanced", "moderate", "advanced", "moderate", "advanced", "advanced", "moderate"][i],
      targeting: sectors.slice(0, Math.floor(Math.random() * 4) + 2),
      primaryTechniques: techniques.slice(Math.floor(Math.random() * 3), Math.floor(Math.random() * 3) + 4),
      confidence: Math.floor(Math.random() * 30) + 65, lastObserved: "2026-04-" + String(Math.floor(Math.random() * 22) + 1).padStart(2, "0"),
      iocCount: Math.floor(Math.random() * 200) + 50, attributedCampaigns: Math.floor(Math.random() * 8) + 1,
      mitreTactics: ["Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion"].slice(0, Math.floor(Math.random() * 3) + 2),
      riskScore: Math.floor(Math.random() * 40) + 55, alertsTriggered: Math.floor(Math.random() * 30) + 5
    }));
  }

  private _mekpdaThreatCorrelation(): Record<string, unknown>[] {
    return this._mekpdaThreatIntel.filter(t => t.riskScore > 70).map(t => ({
      actor: t.actor, risk: t.riskScore, confidence: t.confidence,
      techniques: t.primaryTechniques, targeting: t.targeting,
      lastSeen: t.lastObserved, iocs: t.iocCount, campaigns: t.attributedCampaigns,
      recommendation: t.riskScore > 85 ? "Immediate defensive action required" : t.riskScore > 75 ? "Enhanced monitoring recommended" : "Standard monitoring sufficient"
    })).sort((a: any, b: any) => (b.risk as number) - (a.risk as number));
  }

  // --- MEKPDA Security Metrics Deep Dive ---
  private _initMekpdaMetricsDeep(): void {
    const metricCategories = ["Detection Coverage", "Response Efficiency", "Prevention Effectiveness", "Recovery Speed", "Compliance Adherence"];
    this._mekpdaMetricsDeep = metricCategories.map(cat => ({
      category: cat, metrics: Array.from({ length: 6 }, (_, i) => ({
        name: `${cat} Metric ${i + 1}`, value: Math.floor(Math.random() * 40) + 55,
        target: Math.floor(Math.random() * 15) + 82, unit: ["%", "ms", "count", "score"][Math.floor(Math.random() * 4)],
        trend: Math.random() > 0.4 ? "improving" : "stable", period: "30d",
        baseline: Math.floor(Math.random() * 20) + 50, benchmark: Math.floor(Math.random() * 10) + 80
      })),
      overallScore: Math.floor(Math.random() * 20) + 70, maturity: ["initial", "developing", "defined", "managed", "optimized"][Math.floor(Math.random() * 5)]
    }));
  }

  private _mekpdaMetricsHeatmap(): number[][] {
    return this._mekpdaMetricsDeep.map(cat =>
      cat.metrics.map(m => Math.round((m.value / m.target) * 100))
    );
  }

  // --- MEKPDA Incident Cost Modeling ---
  private _initMekpdaCostModel(): void {
    const incidentTypes = ["Data Breach", "Ransomware", "DDoS", "Insider Threat", "Phishing", "Supply Chain", "Cloud Misconfig", "Zero-Day"];
    this._mekpdaCostModel = incidentTypes.map(inc => ({
      incident: inc, avgCost: Math.floor(Math.random() * 8000000) + 1000000,
      maxCost: Math.floor(Math.random() * 20000000) + 5000000, minCost: Math.floor(Math.random() * 500000) + 100000,
      detectionTimeHrs: Math.floor(Math.random() * 200) + 10, containmentTimeHrs: Math.floor(Math.random() * 150) + 5,
      recoveryTimeHrs: Math.floor(Math.random() * 500) + 50, recordsAffected: Math.floor(Math.random() * 500000) + 10000,
      regulatoryFine: Math.floor(Math.random() * 3000000) + 200000, reputationCost: Math.floor(Math.random() * 2000000) + 500000,
      legalCost: Math.floor(Math.random() * 1500000) + 100000, notificationCost: Math.floor(Math.random() * 800000) + 50000,
      forensicsCost: Math.floor(Math.random() * 400000) + 50000, totalAnnualExposure: 0, frequency: Math.floor(Math.random() * 5) + 1
    }));
    this._mekpdaCostModel.forEach(m => { m.totalAnnualExposure = m.avgCost * m.frequency; });
  }

  private _mekpdaCostProjection(): Record<string, unknown>[] {
    return this._mekpdaCostModel.map(m => ({
      incident: m.incident, avgCost: m.avgCost, annualExposure: m.totalAnnualExposure,
      frequency: m.frequency, detectionHrs: m.detectionTimeHrs, recoveryHrs: m.recoveryTimeHrs,
      records: m.recordsAffected, regulatory: m.regulatoryFine,
      roiOfInvestment: Math.round(m.avgCost * 0.15 / 100000), priority: m.totalAnnualExposure > 10000000 ? "critical" : m.totalAnnualExposure > 5000000 ? "high" : "medium"
    })).sort((a: any, b: any) => (b.annualExposure as number) - (a.annualExposure as number));
  }

  // --- MEKPDA Security Architecture Pattern Library ---
  private _initMekpdaArchPatterns(): void {
    const patterns = ["Defense in Depth", "Zero Trust Network", "Microsegmentation", "Layered Encryption", "Blast Radius Minimization", "Fail Secure Design", "Least Privilege Access", "Secure-by-Default"];
    this._mekpdaArchPatterns = patterns.map((p, i) => ({
      pattern: p, category: ["network", "identity", "network", "data", "architecture", "design", "identity", "development"][i],
      maturity: ["optimized", "managed", "defined", "managed", "repeatable", "defined", "managed", "repeatable"][i],
      implementation: Math.floor(Math.random() * 40) + 55, coverage: Math.floor(Math.random() * 30) + 60,
      components: Math.floor(Math.random() * 15) + 5, integrationPoints: Math.floor(Math.random() * 20) + 3,
      riskReduction: Math.floor(Math.random() * 25) + 60, costComplexity: ["low", "high", "medium", "medium", "high", "low", "medium", "medium"][i],
      dependencies: patterns.slice(0, Math.floor(Math.random() * 3)).filter(x => x !== p),
      lastReview: "2026-0" + String(Math.floor(Math.random() * 4) + 1) + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")
    }));
  }

  private _mekpdaArchPatternAnalysis(): Record<string, unknown> {
    const implemented = this._mekpdaArchPatterns.filter(p => p.implementation > 75).length;
    const avgCoverage = Math.round(this._mekpdaArchPatterns.reduce((s: number, p: any) => s + p.coverage, 0) / this._mekpdaArchPatterns.length);
    return {
      totalPatterns: this._mekpdaArchPatterns.length, fullyImplemented: implemented, avgCoverage,
      avgRiskReduction: Math.round(this._mekpdaArchPatterns.reduce((s: number, p: any) => s + p.riskReduction, 0) / this._mekpdaArchPatterns.length),
      gaps: this._mekpdaArchPatterns.filter(p => p.implementation < 60).map(p => p.pattern),
      recommendations: this._mekpdaArchPatterns.filter(p => p.implementation < 70).map(p => ({ pattern: p.pattern, current: p.implementation, target: 85, effort: p.costComplexity }))
    };
  }




  // === Security Vendor Comparison Module ===
  private _vendorData: Array<{id:string;name:string;category:string;rating:number;price:number;features:string[];integrations:number;support:string;contractLength:string;trialAvailable:boolean}> = [];
  private _vendorCriteria: Array<{name:string;weight:number;description:string}> = [];
  private _vendorScores: Array<{vendorId:string;vendorName:string;criteria:string;score:number;notes:string}> = [];
  private _vendorRecommendation: {vendorId:string;reason:string;alternatives:string[];overallScore:number} | null = null;

  private _initVendorComparison(): void {
    this._vendorCriteria = [
      {name:'Security Effectiveness',weight:0.25,description:'Detection accuracy, false positive rate, threat coverage'},
      {name:'Integration Capability',weight:0.15,description:'API availability, SIEM/SOAR integration, data format support'},
      {name:'Total Cost of Ownership',weight:0.20,description:'License cost, implementation cost, ongoing maintenance'},
      {name:'Vendor Stability',weight:0.10,description:'Financial health, market position, customer retention rate'},
      {name:'Support Quality',weight:0.10,description:'Response time, expertise level, escalation process'},
      {name:'Scalability',weight:0.08,description:'Performance at scale, multi-tenant support, geographic coverage'},
      {name:'Compliance Coverage',weight:0.07,description:'Regulatory certifications, audit support, reporting capabilities'},
      {name:'Innovation Roadmap',weight:0.05,description:'AI/ML capabilities, future features, R&D investment'}
    ];
    this._vendorData = [
      {id:'VND-001',name:'CrowdStrike Falcon',category:'Endpoint Security',rating:4.7,price:15,features:['Endpoint Detection','Threat Intelligence','Managed Detection','Cloud Workload Protection','Identity Protection'],integrations:85,support:'24/7 Premium',contractLength:'3 years',trialAvailable:true},
      {id:'VND-002',name:'Palo Alto Cortex XDR',category:'Endpoint Security',rating:4.5,price:18,features:['Endpoint Detection','Network Security','Cloud Security','SOC Automation','IoT Security'],integrations:72,support:'24/7 Standard',contractLength:'2 years',trialAvailable:true},
      {id:'VND-003',name:'Microsoft Defender for Endpoint',category:'Endpoint Security',rating:4.3,price:12,features:['Endpoint Detection','Threat Analytics','Auto Investigation','Microsoft 365 Integration','Attack Surface Reduction'],integrations:95,support:'Business Hours + Emergency',contractLength:'Annual',trialAvailable:true},
      {id:'VND-004',name:'SentinelOne Singularity',category:'Endpoint Security',rating:4.6,price:16,features:['Endpoint Detection','AI Autonomous Response','Ransomware Protection','Cloud Visibility','IoT Security'],integrations:68,support:'24/7 Premium',contractLength:'3 years',trialAvailable:true},
      {id:'VND-005',name:'Trellix Endpoint Security',category:'Endpoint Security',rating:4.1,price:13,features:['Endpoint Detection','Adaptive Threat Prevention','Real-Time Threat Response','Forensic Analysis','Endpoint Forensics'],integrations:78,support:'Business Hours',contractLength:'2 years',trialAvailable:true}
    ];
    this._vendorScores = [
      {vendorId:'VND-001',vendorName:'CrowdStrike Falcon',criteria:'Security Effectiveness',score:95,notes:'Industry-leading detection with minimal false positives'},
      {vendorId:'VND-001',vendorName:'CrowdStrike Falcon',criteria:'Integration Capability',score:88,notes:'Extensive API marketplace with 500+ integrations'},
      {vendorId:'VND-001',vendorName:'CrowdStrike Falcon',criteria:'Total Cost of Ownership',score:75,notes:'Premium pricing but strong value proposition'},
      {vendorId:'VND-001',vendorName:'CrowdStrike Falcon',criteria:'Vendor Stability',score:92,notes:'Market leader with strong financial position'},
      {vendorId:'VND-002',vendorName:'Palo Alto Cortex XDR',criteria:'Security Effectiveness',score:90,notes:'Strong cross-layer correlation capabilities'},
      {vendorId:'VND-002',vendorName:'Palo Alto Cortex XDR',criteria:'Integration Capability',score:82,notes:'Excellent within Palo Alto ecosystem'},
      {vendorId:'VND-002',vendorName:'Palo Alto Cortex XDR',criteria:'Total Cost of Ownership',score:68,notes:'Higher total cost with network security bundle'},
      {vendorId:'VND-002',vendorName:'Palo Alto Cortex XDR',criteria:'Vendor Stability',score:94,notes:'Established market leader in network security'},
      {vendorId:'VND-003',vendorName:'Microsoft Defender for Endpoint',criteria:'Security Effectiveness',score:85,notes:'Significantly improved detection capabilities'},
      {vendorId:'VND-003',vendorName:'Microsoft Defender for Endpoint',criteria:'Integration Capability',score:96,notes:'Best-in-class Microsoft ecosystem integration'},
      {vendorId:'VND-003',vendorName:'Microsoft Defender for Endpoint',criteria:'Total Cost of Ownership',score:90,notes:'Best value if already using Microsoft 365'},
      {vendorId:'VND-003',vendorName:'Microsoft Defender for Endpoint',criteria:'Vendor Stability',score:98,notes:'Microsoft financial stability is unmatched'},
      {vendorId:'VND-004',vendorName:'SentinelOne Singularity',criteria:'Security Effectiveness',score:93,notes:'Excellent AI-driven autonomous response'},
      {vendorId:'VND-004',vendorName:'SentinelOne Singularity',criteria:'Integration Capability',score:80,notes:'Growing integration ecosystem'},
      {vendorId:'VND-004',vendorName:'SentinelOne Singularity',criteria:'Total Cost of Ownership',score:78,notes:'Competitive pricing with good value'},
      {vendorId:'VND-004',vendorName:'SentinelOne Singularity',criteria:'Vendor Stability',score:85,notes:'Rapidly growing with strong market position'},
      {vendorId:'VND-005',vendorName:'Trellix Endpoint Security',criteria:'Security Effectiveness',score:82,notes:'Solid detection with good forensics'},
      {vendorId:'VND-005',vendorName:'Trellix Endpoint Security',criteria:'Integration Capability',score:85,notes:'Good legacy integration from McAfee/FireEye'},
      {vendorId:'VND-005',vendorName:'Trellix Endpoint Security',criteria:'Total Cost of Ownership',score:82,notes:'Cost-effective for enterprise deployments'},
      {vendorId:'VND-005',vendorName:'Trellix Endpoint Security',criteria:'Vendor Stability',score:78,notes:'Post-merger integration still stabilizing'}
    ];
    this._vendorRecommendation = {
      vendorId:'VND-001',
      reason:'CrowdStrike Falcon offers the best combination of security effectiveness, integration breadth, and vendor stability. Its AI-driven detection consistently tops independent tests.',
      alternatives:['VND-004','VND-003'],
      overallScore:91.2
    };
  }

  private _calculateVendorOverallScore(vendorId: string): number {
    const scores = this._vendorScores.filter(s => s.vendorId === vendorId);
    if (scores.length === 0) return 0;
    const totalWeight = scores.reduce((s, sc) => {
      const criteria = this._vendorCriteria.find(c => c.name === sc.criteria);
      return s + (criteria?.weight || 0.1);
    }, 0);
    const weightedScore = scores.reduce((s, sc) => {
      const criteria = this._vendorCriteria.find(c => c.name === sc.criteria);
      return s + sc.score * (criteria?.weight || 0.1);
    }, 0);
    return Math.round((weightedScore / totalWeight) * 10) / 10;
  }

  private _getPricingComparison(): Array<{vendor:string;monthly:number;annual:number;threeYear:number;savingsVsMonthly:number}> {
    return this._vendorData.map(v => ({
      vendor: v.name,
      monthly: v.price,
      annual: Math.round(v.price * 12 * 0.9),
      threeYear: Math.round(v.price * 36 * 0.8),
      savingsVsMonthly: 20
    }));
  }


  // --- Vendor Deep Analysis ---
  private _vendorTrialResults: Array<{vendorId:string;vendorName:string;trialPeriod:string;detectionRate:number;falsePositiveRate:number;performanceImpact:number;easeOfDeployment:number;overallScore:number;recommendation:string}> = [];
  private _vendorContractTerms: Array<{vendorId:string;vendorName:string;minTerm:string;autoRenewal:boolean;exitClause:string;dataProcessingLocation:string;slaUptime:number;supportResponseTime:string}> = [];
  private _vendorMarketPosition: Array<{vendorId:string;vendorName:string;marketShare:number;founded:number;employees:number;funding:string;customers:number;gartnerQuadrant:string}> = [];

  private _initVendorDeepAnalysis(): void {
    this._vendorTrialResults = [
      {vendorId:'VND-001',vendorName:'CrowdStrike Falcon',trialPeriod:'30 days',detectionRate:98.2,falsePositiveRate:1.8,performanceImpact:2.1,easeOfDeployment:8.5,overallScore:93.5,recommendation:'Strongly recommended for deployment'},
      {vendorId:'VND-002',vendorName:'Palo Alto Cortex XDR',trialPeriod:'30 days',detectionRate:96.8,falsePositiveRate:2.5,performanceImpact:3.2,easeOfDeployment:7.8,overallScore:90.2,recommendation:'Recommended with cross-layer focus'},
      {vendorId:'VND-003',vendorName:'Microsoft Defender for Endpoint',trialPeriod:'60 days',detectionRate:95.1,falsePositiveRate:3.1,performanceImpact:1.8,easeOfDeployment:9.2,overallScore:88.7,recommendation:'Best value for Microsoft ecosystem'},
      {vendorId:'VND-004',vendorName:'SentinelOne Singularity',trialPeriod:'30 days',detectionRate:97.5,falsePositiveRate:2.0,performanceImpact:2.5,easeOfDeployment:8.0,overallScore:91.8,recommendation:'Excellent AI-driven autonomous response'},
      {vendorId:'VND-005',vendorName:'Trellix Endpoint Security',trialPeriod:'30 days',detectionRate:93.4,falsePositiveRate:3.8,performanceImpact:2.8,easeOfDeployment:7.2,overallScore:85.1,recommendation:'Solid option with legacy compatibility'}
    ];
    this._vendorContractTerms = [
      {vendorId:'VND-001',vendorName:'CrowdStrike Falcon',minTerm:'3 years',autoRenewal:true,exitClause:'90-day written notice',dataProcessingLocation:'US, EU',slaUptime:99.99,supportResponseTime:'15 min (P1)'},
      {vendorId:'VND-002',vendorName:'Palo Alto Cortex XDR',minTerm:'2 years',autoRenewal:true,exitClause:'60-day written notice',dataProcessingLocation:'US',slaUptime:99.95,supportResponseTime:'30 min (P1)'},
      {vendorId:'VND-003',vendorName:'Microsoft Defender for Endpoint',minTerm:'Annual',autoRenewal:false,exitClause:'30-day notice',dataProcessingLocation:'Global',slaUptime:99.9,supportResponseTime:'1 hour (P1)'},
      {vendorId:'VND-004',vendorName:'SentinelOne Singularity',minTerm:'3 years',autoRenewal:true,exitClause:'90-day written notice',dataProcessingLocation:'US, EU, APAC',slaUptime:99.99,supportResponseTime:'15 min (P1)'},
      {vendorId:'VND-005',vendorName:'Trellix Endpoint Security',minTerm:'2 years',autoRenewal:false,exitClause:'60-day written notice',dataProcessingLocation:'US, EU',slaUptime:99.9,supportResponseTime:'30 min (P1)'}
    ];
    this._vendorMarketPosition = [
      {vendorId:'VND-001',vendorName:'CrowdStrike Falcon',marketShare:18.5,founded:2011,employees:7800,funding:'IPO 2019',customers:22000,gartnerQuadrant:'Leader'},
      {vendorId:'VND-002',vendorName:'Palo Alto Cortex XDR',marketShare:14.2,founded:2005,employees:16000,funding:'Public',customers:80000,gartnerQuadrant:'Leader'},
      {vendorId:'VND-003',vendorName:'Microsoft Defender for Endpoint',marketShare:22.8,founded:1975,employees:221000,funding:'Public',customers:500000,gartnerQuadrant:'Leader'},
      {vendorId:'VND-004',vendorName:'SentinelOne Singularity',marketShare:8.3,founded:2013,employees:3000,funding:'IPO 2021',customers:10000,gartnerQuadrant:'Challenger'},
      {vendorId:'VND-005',vendorName:'Trellix Endpoint Security',marketShare:6.1,founded:2022,employees:4500,funding:'Private equity',customers:35000,gartnerQuadrant:'Visionary'}
    ];
  }

  private _getVendorRanking(): Array<{rank:number;vendorName:string;overallScore:number;recommendation:string;keyStrength:string}> {
    return this._vendorTrialResults
      .sort((a,b) => b.overallScore - a.overallScore)
      .map((v,i) => ({
        rank: i + 1,
        vendorName: v.vendorName,
        overallScore: v.overallScore,
        recommendation: v.recommendation,
        keyStrength: v.detectionRate > 97 ? 'Detection excellence' : v.easeOfDeployment > 9 ? 'Easy deployment' : 'Balanced capability'
      }));
  }



  // === Security Data Lake Analytics ===
  private _dataLakeSources: Array<{id:string;name:string;type:string;status:string;eventsPerDay:number;lastIngested:string;retentionDays:number;storageUsed:string;schemaVersion:number}> = [];
  private _dataLakeQueries: Array<{id:string;name:string;description:string;author:string;lastRun:string;avgRuntime:string;frequency:string;sharedWith:number;saved:boolean}> = [];
  private _dataLakeInsights: Array<{id:string;title:string;severity:string;description:string;affectedSystems:string[];recommendation:string;detectedAt:string;confidence:number;category:string}> = [];
  private _dataLakeStats: {totalEventsToday:number;storageUsed:string;queryCount:number;avgQueryTime:string;ingestionLag:string;dataFreshness:string} = {totalEventsToday:0,storageUsed:'',queryCount:0,avgQueryTime:'',ingestionLag:'',dataFreshness:''};

  private _initDataLakeAnalytics(): void {
    this._dataLakeSources = [
      {id:'DL-SRC-001',name:'Firewall Logs',type:'network',status:'active',eventsPerDay:2500000,lastIngested:'2026-04-23T13:55:00Z',retentionDays:365,storageUsed:'2.3 TB',schemaVersion:3},
      {id:'DL-SRC-002',name:'Endpoint Detection Events',type:'endpoint',status:'active',eventsPerDay:1800000,lastIngested:'2026-04-23T13:58:00Z',retentionDays:180,storageUsed:'1.8 TB',schemaVersion:2},
      {id:'DL-SRC-003',name:'Authentication Logs',type:'identity',status:'active',eventsPerDay:950000,lastIngested:'2026-04-23T13:59:00Z',retentionDays:730,storageUsed:'0.9 TB',schemaVersion:4},
      {id:'DL-SRC-004',name:'Cloud Audit Trails',type:'cloud',status:'active',eventsPerDay:1200000,lastIngested:'2026-04-23T13:56:00Z',retentionDays:365,storageUsed:'1.2 TB',schemaVersion:2},
      {id:'DL-SRC-005',name:'DNS Query Logs',type:'network',status:'active',eventsPerDay:4500000,lastIngested:'2026-04-23T13:57:00Z',retentionDays:90,storageUsed:'3.8 TB',schemaVersion:1},
      {id:'DL-SRC-006',name:'Email Security Logs',type:'email',status:'degraded',eventsPerDay:320000,lastIngested:'2026-04-23T12:30:00Z',retentionDays:365,storageUsed:'0.4 TB',schemaVersion:2},
      {id:'DL-SRC-007',name:'DLP Events',type:'data',status:'active',eventsPerDay:180000,lastIngested:'2026-04-23T13:54:00Z',retentionDays:365,storageUsed:'0.3 TB',schemaVersion:1}
    ];
    this._dataLakeQueries = [
      {id:'DLQ-001',name:'Lateral Movement Detection',description:'Identify unusual network connections between internal systems',author:'SOC Team',lastRun:'2026-04-23T13:00:00Z',avgRuntime:'45s',frequency:'hourly',sharedWith:8,saved:true},
      {id:'DLQ-002',name:'Privilege Escalation Patterns',description:'Detect unusual privilege elevation events across systems',author:'IAM Team',lastRun:'2026-04-23T12:00:00Z',avgRuntime:'32s',frequency:'hourly',sharedWith:5,saved:true},
      {id:'DLQ-003',name:'Data Exfiltration Indicators',description:'Find large data transfers to external or unusual destinations',author:'DLP Team',lastRun:'2026-04-23T11:00:00Z',avgRuntime:'1m 12s',frequency:'daily',sharedWith:3,saved:true},
      {id:'DLQ-004',name:'Impossible Travel Detection',description:'Identify logins from geographically impossible locations',author:'SOC Team',lastRun:'2026-04-23T13:30:00Z',avgRuntime:'28s',frequency:'real-time',sharedWith:6,saved:true},
      {id:'DLQ-005',name:'Anomalous DNS Queries',description:'Detect DNS tunneling and DGA domain lookups',author:'Network Sec',lastRun:'2026-04-23T13:15:00Z',avgRuntime:'55s',frequency:'every 30 min',sharedWith:4,saved:true}
    ];
    this._dataLakeInsights = [
      {id:'INS-001',title:'Unusual RDP Connections from External IP',severity:'high',description:'Multiple RDP connections from previously unseen external IP addresses to internal workstations',affectedSystems:['workstation-023','workstation-045','workstation-067'],recommendation:'Investigate source IPs and consider blocking RDP from external networks',detectedAt:'2026-04-23T12:45:00Z',confidence:0.85,category:'network'},
      {id:'INS-002',title:'Spike in Failed Authentication Attempts',severity:'medium',description:'3x increase in failed login attempts across VPN gateway compared to weekly average',affectedSystems:['vpn-gateway-01','vpn-gateway-02'],recommendation:'Enable account lockout policy and deploy CAPTCHA for VPN login',detectedAt:'2026-04-23T11:30:00Z',confidence:0.78,category:'identity'},
      {id:'INS-003',title:'Sensitive Data Access Outside Business Hours',severity:'medium',description:'PII database accessed by 3 users between 02:00-04:00 AM, outside normal working hours',affectedSystems:['pii-database-01'],recommendation:'Review user access patterns and verify legitimate business need',detectedAt:'2026-04-23T10:00:00Z',confidence:0.72,category:'data'}
    ];
    this._dataLakeStats = {
      totalEventsToday: 11450000,
      storageUsed: '10.7 TB',
      queryCount: 847,
      avgQueryTime: '42s',
      ingestionLag: '2.3 min',
      dataFreshness: '99.2%'
    };
  }

  private _getDataLakeHealthSummary(): {activeSources:number;degradedSources:number;totalStorage:string;eventsPerSecond:number;ingestionLag:string;freshness:string} {
    const activeSources = this._dataLakeSources.filter(s => s.status === 'active').length;
    const degradedSources = this._dataLakeSources.filter(s => s.status !== 'active').length;
    const eventsPerSecond = Math.round(this._dataLakeStats.totalEventsToday / 86400);
    return {activeSources, degradedSources, totalStorage: this._dataLakeStats.storageUsed, eventsPerSecond, ingestionLag: this._dataLakeStats.ingestionLag, freshness: this._dataLakeStats.dataFreshness};
  }


  // === Security Awareness Program Analytics ===
  private _awarenessCampaigns: Array<{id:string;name:string;type:string;targetAudience:string;participants:number;completionRate:number;passRate:number;startDate:string;endDate:string;status:string}> = [];
  private _awarenessPhishingSims: Array<{id:string;campaignName:string;sentCount:number;clickCount:number;credentialCount:number;reportCount:number;clickRate:number;credentialRate:number;reportRate:number;date:string;difficulty:string}> = [];
  private _awarenessRiskScores: Array<{department:string;avgScore:number;trend:string;riskLevel:string;complianceRate:number;topWeakArea:string;improvementRate:number}> = [];
  private _awarenessContent: Array<{id:string;title:string;type:string;category:string;duration:string;difficulty:string;completionCount:number;avgScore:number;rating:number}> = [];

  private _initAwarenessAnalytics(): void {
    this._awarenessCampaigns = [
      {id:'AWC-001',name:'Q2 Security Foundations',type:'mandatory_training',targetAudience:'All Employees',participants:2840,completionRate:78.4,passRate:92.1,startDate:'2026-04-01',endDate:'2026-06-30',status:'active'},
      {id:'AWC-002',name:'Executive Security Briefing',type:'workshop',targetAudience:'C-Suite and Directors',participants:45,completionRate:88.9,passRate:100,startDate:'2026-04-15',endDate:'2026-04-15',status:'completed'},
      {id:'AWC-003',name:'Developer Secure Coding Bootcamp',type:'training',targetAudience:'Engineering',participants:320,completionRate:65.2,passRate:87.5,startDate:'2026-04-10',endDate:'2026-05-10',status:'active'},
      {id:'AWC-004',name:'Remote Work Security Essentials',type:'e-learning',targetAudience:'Remote Workers',participants:1250,completionRate:82.1,passRate:94.3,startDate:'2026-03-01',endDate:'2026-04-30',status:'active'}
    ];
    this._awarenessPhishingSims = [
      {id:'PS-001',campaignName:'April Tax Scam Simulation',sentCount:2840,clickCount:156,credentialCount:23,reportCount:412,clickRate:5.5,credentialRate:0.8,reportRate:14.5,date:'2026-04-15',difficulty:'medium'},
      {id:'PS-002',campaignName:'IT Support Impersonation',sentCount:2840,clickCount:198,credentialCount:45,reportCount:356,clickRate:7.0,credentialRate:1.6,reportRate:12.5,date:'2026-04-01',difficulty:'medium'},
      {id:'PS-003',campaignName:'CEO Fraud Email',sentCount:150,clickCount:8,credentialCount:2,reportCount:42,clickRate:5.3,credentialRate:1.3,reportRate:28.0,date:'2026-03-20',difficulty:'hard'},
      {id:'PS-004',campaignName:'Package Delivery Scam',sentCount:2840,clickCount:245,credentialCount:67,reportCount:298,clickRate:8.6,credentialRate:2.4,reportRate:10.5,date:'2026-03-01',difficulty:'easy'}
    ];
    this._awarenessRiskScores = [
      {department:'Engineering',avgScore:82.5,trend:'improving',riskLevel:'low',complianceRate:85.2,topWeakArea:'Secret Management',improvementRate:12.3},
      {department:'Sales',avgScore:68.4,trend:'stable',riskLevel:'medium',complianceRate:72.1,topWeakArea:'Social Engineering',improvementRate:5.8},
      {department:'Finance',avgScore:75.2,trend:'improving',riskLevel:'medium',complianceRate:80.5,topWeakArea:'Phishing Recognition',improvementRate:8.4},
      {department:'HR',avgScore:71.8,trend:'declining',riskLevel:'medium',complianceRate:76.3,topWeakArea:'Data Privacy',improvementRate:-2.1},
      {department:'Executive',avgScore:88.2,trend:'improving',riskLevel:'low',complianceRate:92.1,topWeakArea:'Mobile Security',improvementRate:15.2},
      {department:'Marketing',avgScore:65.3,trend:'stable',riskLevel:'high',complianceRate:68.7,topWeakArea:'Social Media Security',improvementRate:3.2}
    ];
    this._awarenessContent = [
      {id:'AC-001',title:'Recognizing Phishing Emails',type:'interactive_module',category:'Phishing',duration:'15 min',difficulty:'beginner',completionCount:2450,avgScore:88.5,rating:4.5},
      {id:'AC-002',title:'Password Security Best Practices',type:'video',category:'Identity',duration:'8 min',difficulty:'beginner',completionCount:2680,avgScore:92.1,rating:4.2},
      {id:'AC-003',title:'Secure Remote Work Practices',type:'interactive_module',category:'Remote Work',duration:'20 min',difficulty:'intermediate',completionCount:1200,avgScore:85.3,rating:4.7},
      {id:'AC-004',title:'Data Classification and Handling',type:'e-learning',category:'Data Security',duration:'25 min',difficulty:'intermediate',completionCount:1890,avgScore:80.2,rating:3.8},
      {id:'AC-005',title:'Social Engineering Defense',type:'simulation',category:'Social Engineering',duration:'30 min',difficulty:'advanced',completionCount:780,avgScore:76.8,rating:4.6}
    ];
  }

  private _getAwarenessSummary(): {avgCompletionRate:number;avgPhishingClickRate:number;highRiskDepts:number;totalParticipants:number;overallRiskScore:number;improvingDepts:number} {
    const avgCompletion = Math.round(this._awarenessCampaigns.reduce((s,c) => s + c.completionRate, 0) / this._awarenessCampaigns.length * 10) / 10;
    const avgClickRate = Math.round(this._awarenessPhishingSims.reduce((s,p) => s + p.clickRate, 0) / this._awarenessPhishingSims.length * 10) / 10;
    const highRiskDepts = this._awarenessRiskScores.filter(d => d.riskLevel === 'high').length;
    const improvingDepts = this._awarenessRiskScores.filter(d => d.trend === 'improving').length;
    const overallRiskScore = Math.round(this._awarenessRiskScores.reduce((s,d) => s + d.avgScore, 0) / this._awarenessRiskScores.length * 10) / 10;
    return {avgCompletionRate: avgCompletion, avgPhishingClickRate: avgClickRate, highRiskDepts, totalParticipants: 2840, overallRiskScore, improvingDepts};
  }



  // === Security Operations Center Dashboard Module ===
  private _socDashAnalysts: Array<{id:string;name:string;status:string;currentAssignment:string;alertsHandled:number;avgResponseTime:string;shift:string;skillLevel:string}> = [];
  private _socDashAlerts: Array<{id:string;severity:string;source:string;description:string;assignee:string;createdAt:string;status:string;slaDeadline:string;slaBreachRisk:boolean}> = [];
  private _socDashPerformance: {escalationRate:number;meanTimeToAck:string;meanTimeToContain:string;meanTimeToResolve:string;analystUtilization:number;shiftCoverage:number;toolsUptime:number} = {escalationRate:0,meanTimeToAck:'',meanTimeToContain:'',meanTimeToResolve:'',analystUtilization:0,shiftCoverage:0,toolsUptime:0};
  private _socDashEscalationPaths: Array<{fromRole:string;toRole:string;condition:string;avgTime:string;count:number}> = [];

  private _initSocDashboardModule(): void {
    this._socDashAnalysts = [
      {id:'AN-001',name:'Alice Chen',status:'active',currentAssignment:'Investigating phishing alert',alertsHandled:34,avgResponseTime:'4.2 min',shift:'Day (06:00-14:00)',skillLevel:'senior'},
      {id:'AN-002',name:'Bob Smith',status:'active',currentAssignment:'Malware analysis in progress',alertsHandled:28,avgResponseTime:'5.1 min',shift:'Day (06:00-14:00)',skillLevel:'senior'},
      {id:'AN-003',name:'Carol Jones',status:'active',currentAssignment:'Incident response coordination',alertsHandled:22,avgResponseTime:'6.3 min',shift:'Day (06:00-14:00)',skillLevel:'intermediate'},
      {id:'AN-004',name:'David Lee',status:'break',currentAssignment:'None',alertsHandled:31,avgResponseTime:'4.8 min',shift:'Day (06:00-14:00)',skillLevel:'senior'},
      {id:'AN-005',name:'Eve Wilson',status:'active',currentAssignment:'Threat hunting investigation',alertsHandled:19,avgResponseTime:'7.2 min',shift:'Day (06:00-14:00)',skillLevel:'intermediate'},
      {id:'AN-006',name:'Frank Garcia',status:'active',currentAssignment:'Vulnerability triage',alertsHandled:25,avgResponseTime:'5.5 min',shift:'Night (14:00-22:00)',skillLevel:'intermediate'},
      {id:'AN-007',name:'Grace Kim',status:'active',currentAssignment:'Compliance monitoring',alertsHandled:16,avgResponseTime:'8.1 min',shift:'Night (14:00-22:00)',skillLevel:'junior'}
    ];
    this._socDashAlerts = [
      {id:'SOC-A-001',severity:'critical',source:'IDS',description:'Possible ransomware activity detected on server-045',assignee:'Alice Chen',createdAt:'2026-04-23T13:45:00Z',status:'investigating',slaDeadline:'2026-04-23T14:00:00Z',slaBreachRisk:true},
      {id:'SOC-A-002',severity:'high',source:'SIEM',description:'Correlated login anomalies from 3 user accounts',assignee:'Bob Smith',createdAt:'2026-04-23T13:30:00Z',status:'investigating',slaDeadline:'2026-04-23T14:30:00Z',slaBreachRisk:false},
      {id:'SOC-A-003',severity:'high',source:'EDR',description:'Suspicious PowerShell execution on workstation-023',assignee:'Carol Jones',createdAt:'2026-04-23T13:15:00Z',status:'triage',slaDeadline:'2026-04-23T14:15:00Z',slaBreachRisk:false},
      {id:'SOC-A-004',severity:'medium',source:'WAF',description:'SQL injection attempt blocked on web application',assignee:'David Lee',createdAt:'2026-04-23T13:00:00Z',status:'resolved',slaDeadline:'2026-04-23T15:00:00Z',slaBreachRisk:false},
      {id:'SOC-A-005',severity:'medium',source:'DLP',description:'Large file transfer to external USB device detected',assignee:'Eve Wilson',createdAt:'2026-04-23T12:45:00Z',status:'pending',slaDeadline:'2026-04-23T14:45:00Z',slaBreachRisk:false},
      {id:'SOC-A-006',severity:'low',source:'Vuln Scanner',description:'New critical vulnerability CVE-2026-5678 detected',assignee:'Frank Garcia',createdAt:'2026-04-23T12:30:00Z',status:'pending',slaDeadline:'2026-04-23T18:30:00Z',slaBreachRisk:false}
    ];
    this._socDashPerformance = {
      escalationRate: 12.5,
      meanTimeToAck: '3.8 min',
      meanTimeToContain: '18.5 min',
      meanTimeToResolve: '2.4 hours',
      analystUtilization: 78.2,
      shiftCoverage: 92.3,
      toolsUptime: 99.95
    };
    this._socDashEscalationPaths = [
      {fromRole:'Junior Analyst',toRole:'Senior Analyst',condition:'Severity high or above',avgTime:'8 min',count:45},
      {fromRole:'Senior Analyst',toRole:'SOC Manager',condition:'Severity critical or analyst unavailable',avgTime:'15 min',count:18},
      {fromRole:'SOC Manager',toRole:'CISO',condition:'Active breach confirmed or executive impact',avgTime:'5 min',count:4},
      {fromRole:'SOC Manager',toRole:'Legal Counsel',condition:'Data breach involving PII or regulated data',avgTime:'10 min',count:6}
    ];
  }

  private _getSocDashSummary(): {activeAnalysts:number;openAlerts:number;criticalAlerts:number;utilization:number;slaBreachRiskCount:number;shiftStatus:string} {
    const activeAnalysts = this._socDashAnalysts.filter(a => a.status === 'active').length;
    const openAlerts = this._socDashAlerts.filter(a => a.status !== 'resolved').length;
    const criticalAlerts = this._socDashAlerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;
    const slaBreachRiskCount = this._socDashAlerts.filter(a => a.slaBreachRisk).length;
    return {activeAnalysts, openAlerts, criticalAlerts, utilization: this._socDashPerformance.analystUtilization, slaBreachRiskCount, shiftStatus:'Day shift - fully staffed'};
  }


  private _85cRiskAssessmentWorkflow = [
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

  private _85cRiskMatrix5x5 = [
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

  private _85cTreatmentOptions = [
    {id: '85c-T-001', riskId: 'RSK-042', risk: 'Ransomware Attack on Critical Infrastructure', before: 20, after: 6, strategy: 'Mitigate', controls: ['Next-gen EDR with behavioral detection and automated response', 'Zero-trust network micro-segmentation isolating critical assets', 'Immutable offline backup rotation with quarterly recovery testing', 'Incident response retainer with 1-hour response SLA'], cost: '$450K/yr', roi: '78% reduction vs $2.8M potential loss', timeline: 'Q3 2026', status: 'approved' as const},
    {id: '85c-T-002', riskId: 'RSK-018', risk: 'Insider Data Exfiltration via Cloud Storage', before: 15, after: 5, strategy: 'Mitigate', controls: ['Comprehensive DLP policies for all cloud applications and endpoints', 'UEBA behavioral analytics for anomalous access pattern detection', 'Endpoint restrictions on USB and personal cloud storage services', 'CASB integration for shadow IT discovery and policy enforcement'], cost: '$180K/yr', roi: '67% reduction vs $1.2M potential loss', timeline: 'Q2 2026', status: 'approved' as const},
    {id: '85c-T-003', riskId: 'RSK-067', risk: 'Supply Chain Compromise via Third-Party Component', before: 12, after: 8, strategy: 'Transfer', controls: ['Software supply chain insurance policy covering vendor incidents', 'SCA scanning requirements in all vendor procurement contracts', 'SBOM requirements and continuous monitoring for third-party components', 'Vendor security assessment program with annual re-evaluation'], cost: '$95K/yr', roi: '33% reduction vs $800K potential loss', timeline: 'Q4 2026', status: 'in_review' as const},
    {id: '85c-T-004', riskId: 'RSK-033', risk: 'Phishing-Driven Credential Theft Campaign', before: 16, after: 4, strategy: 'Mitigate', controls: ['AI-powered email filtering with real-time threat intelligence feeds', 'Monthly mandatory phishing simulations with targeted follow-up training', 'Hardware MFA enforcement across all users with passwordless transition', 'Security awareness program with role-specific training tracks'], cost: '$120K/yr', roi: '75% reduction vs $1.5M potential loss', timeline: 'Q2 2026', status: 'approved' as const},
    {id: '85c-T-005', riskId: 'RSK-091', risk: 'Zero-Day Exploit on Public-Facing Application', before: 10, after: 8, strategy: 'Accept', controls: ['WAF with virtual patching capability and rapid rule deployment', 'RASP runtime application self-protection on all production web apps', 'Incident response retainer with 4-hour response SLA commitment', 'Bug bounty program for proactive vulnerability discovery'], cost: '$60K/yr', roi: '20% reduction vs $500K potential loss', timeline: 'Ongoing', status: 'accepted' as const},
    {id: '85c-T-006', riskId: 'RSK-055', risk: 'GDPR Regulatory Non-Compliance Penalty', before: 15, after: 4, strategy: 'Mitigate', controls: ['Dedicated Data Protection Officer with quarterly board reporting', 'Automated compliance monitoring platform with real-time dashboards', 'Quarterly DPIA reviews for all high-risk processing activities', 'Privacy by design framework integrated into product development lifecycle'], cost: '$220K/yr', roi: '73% reduction vs $4M+ potential regulatory penalty', timeline: 'Q3 2026', status: 'approved' as const}
  ];

  private _85cComplianceRules = [
    {id: '85c-C-001', name: 'Password Policy Compliance', framework: 'NIST 800-53 IA-5', desc: 'Verify all accounts meet minimum password complexity, length, diversity, and rotation requirements defined in the security policy', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'pass' as const, passRate: 94.2, violations: 12, autoFix: true as const, fix: 'Force password reset within 24h', history: [{d: '04-22', r: 'pass', v: 12}, {d: '04-21', r: 'pass', v: 14}, {d: '04-20', r: 'fail', v: 18}, {d: '04-19', r: 'pass', v: 15}, {d: '04-18', r: 'pass', v: 13}]},
    {id: '85c-C-002', name: 'MFA Enrollment Verification', framework: 'NIST 800-53 IA-2', desc: 'Ensure all privileged and standard user accounts have multi-factor authentication properly enrolled and actively enforced', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'fail' as const, passRate: 87.5, violations: 34, autoFix: true as const, fix: 'Send mandatory enrollment notice with 48h deadline', history: [{d: '04-22', r: 'fail', v: 34}, {d: '04-21', r: 'fail', v: 31}, {d: '04-20', r: 'fail', v: 28}, {d: '04-19', r: 'fail', v: 25}, {d: '04-18', r: 'fail', v: 22}]},
    {id: '85c-C-003', name: 'Inactive Account Review', framework: 'NIST 800-53 AC-2', desc: 'Identify and disable accounts inactive for more than 90 days with automatic escalation at the 120-day threshold', enabled: true as const, freq: 'Weekly', lastRun: '2026-04-21T00:00Z', result: 'pass' as const, passRate: 96.8, violations: 5, autoFix: true as const, fix: 'Auto-disable at 120 days with manager notification', history: [{d: '04-21', r: 'pass', v: 5}, {d: '04-14', r: 'pass', v: 7}, {d: '04-07', r: 'pass', v: 9}, {d: '03-31', r: 'pass', v: 11}, {d: '03-24', r: 'pass', v: 13}]},
    {id: '85c-C-004', name: 'Encryption Standards Check', framework: 'NIST 800-53 SC-28', desc: 'Verify all production storage volumes use AES-256 or equivalent encryption with valid non-expired certificates', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'pass' as const, passRate: 99.1, violations: 2, autoFix: false as const, fix: 'Create priority ticket for manual remediation', history: [{d: '04-22', r: 'pass', v: 2}, {d: '04-21', r: 'pass', v: 2}, {d: '04-20', r: 'pass', v: 3}, {d: '04-19', r: 'pass', v: 3}, {d: '04-18', r: 'pass', v: 4}]},
    {id: '85c-C-005', name: 'Firewall Baseline Compliance', framework: 'NIST 800-53 SC-7', desc: 'Validate firewall rules against approved baseline to detect unauthorized modifications, drift, or orphaned rules', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T06:00Z', result: 'fail' as const, passRate: 91.3, violations: 18, autoFix: true as const, fix: 'Auto-revert non-compliant rules to baseline', history: [{d: '04-22', r: 'fail', v: 18}, {d: '04-21', r: 'pass', v: 12}, {d: '04-20', r: 'pass', v: 15}, {d: '04-19', r: 'pass', v: 14}, {d: '04-18', r: 'fail', v: 20}]},
    {id: '85c-C-006', name: 'Patch SLA Compliance', framework: 'CIS Benchmark L2', desc: 'Check all production systems against critical and high patch SLA requirements with overdue flagging', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T08:00Z', result: 'pass' as const, passRate: 97.6, violations: 8, autoFix: false as const, fix: 'Escalate overdue patches for expedited deployment', history: [{d: '04-22', r: 'pass', v: 8}, {d: '04-21', r: 'pass', v: 10}, {d: '04-20', r: 'pass', v: 12}, {d: '04-19', r: 'pass', v: 11}, {d: '04-18', r: 'pass', v: 14}]},
    {id: '85c-C-007', name: 'Data Classification Labels', framework: 'GDPR Art. 30', desc: 'Verify all databases, file shares, and cloud repositories have appropriate classification labels applied', enabled: true as const, freq: 'Weekly', lastRun: '2026-04-20T00:00Z', result: 'fail' as const, passRate: 82.4, violations: 45, autoFix: false as const, fix: 'Generate review tasks for data owners', history: [{d: '04-20', r: 'fail', v: 45}, {d: '04-13', r: 'fail', v: 42}, {d: '04-06', r: 'fail', v: 38}, {d: '03-30', r: 'fail', v: 35}, {d: '03-23', r: 'pass', v: 30}]},
    {id: '85c-C-008', name: 'Privileged Access Review', framework: 'SOX AC-6', desc: 'Review and validate all privileged access assignments on quarterly recertification schedule', enabled: true as const, freq: 'Monthly', lastRun: '2026-04-01T00:00Z', result: 'pass' as const, passRate: 93.7, violations: 22, autoFix: false as const, fix: 'Initiate recertification workflow with approvals', history: [{d: '04-01', r: 'pass', v: 22}, {d: '03-01', r: 'pass', v: 25}, {d: '02-01', r: 'pass', v: 28}, {d: '01-01', r: 'pass', v: 30}, {d: '12-01', r: 'pass', v: 32}]},
    {id: '85c-C-009', name: 'SIEM Log Coverage', framework: 'NIST 800-53 AU-2', desc: 'Verify all critical systems have logging enabled and actively forwarding to the centralized SIEM platform', enabled: true as const, freq: 'Weekly', lastRun: '2026-04-21T12:00Z', result: 'pass' as const, passRate: 95.5, violations: 7, autoFix: true as const, fix: 'Deploy missing log agents via config management', history: [{d: '04-21', r: 'pass', v: 7}, {d: '04-14', r: 'pass', v: 9}, {d: '04-07', r: 'pass', v: 11}, {d: '03-31', r: 'pass', v: 10}, {d: '03-24', r: 'pass', v: 13}]},
    {id: '85c-C-010', name: 'Certificate Expiry Monitor', framework: 'NIST 800-53 SC-13', desc: 'Monitor all TLS/SSL certificates for upcoming expiry within 30-day warning windows', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'pass' as const, passRate: 98.9, violations: 3, autoFix: true as const, fix: 'Trigger auto-renewal via ACME protocol', history: [{d: '04-22', r: 'pass', v: 3}, {d: '04-21', r: 'pass', v: 3}, {d: '04-20', r: 'pass', v: 4}, {d: '04-19', r: 'pass', v: 4}, {d: '04-18', r: 'pass', v: 5}]}
  ];

  private _85cTalentPositions = [
    {id: '85c-H-001', title: 'Senior Penetration Tester', dept: 'Red Team', level: 'Senior', loc: 'Remote US', salary: '$165K-$195K', posted: '2026-03-15', applicants: 23, pipeline: 8, interviews: 4, offers: 1, urgency: 'high' as const, manager: 'Alex Chen', skills: ['Burp Suite', 'Metasploit', 'Cobalt Strike', 'Python', 'OWASP Top 10'], nice: ['OSCP/OSCE', 'Bug bounty', 'Cloud pentest']},
    {id: '85c-H-002', title: 'Cloud Security Engineer', dept: 'Cloud Security', level: 'Mid-Senior', loc: 'SF/Remote', salary: '$155K-$180K', posted: '2026-03-20', applicants: 45, pipeline: 12, interviews: 6, offers: 2, urgency: 'high' as const, manager: 'Mike Johnson', skills: ['AWS/Azure/GCP', 'Terraform', 'Kubernetes', 'IAM', 'CSPM'], nice: ['CCSP', 'CKS', 'Serverless']},
    {id: '85c-H-003', title: 'SOC Analyst L2', dept: 'Security Operations', level: 'Mid', loc: 'Austin TX', salary: '$105K-$130K', posted: '2026-04-01', applicants: 67, pipeline: 18, interviews: 8, offers: 0, urgency: 'medium' as const, manager: 'Lisa Park', skills: ['SIEM', 'Incident triage', 'Malware analysis', 'TCP/IP'], nice: ['GCIA', 'SOAR', 'Kill chain']},
    {id: '85c-H-004', title: 'Staff Security Architect', dept: 'Architecture', level: 'Staff', loc: 'Remote US', salary: '$200K-$240K', posted: '2026-02-28', applicants: 12, pipeline: 3, interviews: 2, offers: 0, urgency: 'critical' as const, manager: 'David Lee', skills: ['Enterprise arch', 'Zero trust', 'Risk frameworks', 'Board comms'], nice: ['CISSP+SABSA', 'Team building', 'Speaker']},
    {id: '85c-H-005', title: 'GRC Analyst', dept: 'GRC', level: 'Mid', loc: 'NY/Remote', salary: '$110K-$135K', posted: '2026-04-05', applicants: 34, pipeline: 9, interviews: 3, offers: 1, urgency: 'medium' as const, manager: 'Rachel Green', skills: ['ISO 27001', 'SOC 2', 'Risk assessment', 'Audit'], nice: ['CRISC', 'CISA', 'GDPR']},
    {id: '85c-H-006', title: 'Threat Intel Analyst', dept: 'Threat Intel', level: 'Mid-Senior', loc: 'Remote US', salary: '$140K-$170K', posted: '2026-03-25', applicants: 19, pipeline: 5, interviews: 2, offers: 0, urgency: 'low' as const, manager: 'James Wilson', skills: ['MITRE ATT&CK', 'OSINT', 'Threat modeling', 'Reverse eng'], nice: ['CTIA', 'Nation-state', 'Dark web']},
    {id: '85c-H-007', title: 'AppSec Engineer', dept: 'AppSec', level: 'Senior', loc: 'Seattle/Remote', salary: '$160K-$190K', posted: '2026-04-10', applicants: 28, pipeline: 7, interviews: 3, offers: 0, urgency: 'medium' as const, manager: 'Emily Zhang', skills: ['SAST/DAST/SCA', 'Secure SDLC', 'Code review', 'CI/CD'], nice: ['CSSLP', 'Mobile security']},
    {id: '85c-H-008', title: 'IAM Engineer', dept: 'IAM', level: 'Mid', loc: 'Remote US', salary: '$135K-$160K', posted: '2026-04-08', applicants: 31, pipeline: 10, interviews: 5, offers: 1, urgency: 'medium' as const, manager: 'Chris Martinez', skills: ['Okta/Azure AD', 'SAML/OIDC', 'PAM', 'RBAC'], nice: ['CISSP', 'Zero trust IAM']}
  ];

  private _85cInterviewScorecard = [
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

  private _85cOnboardingSteps = [
    {id: '85c-OB-01', item: 'Provision security-hardened laptop, monitors, peripherals, and configured workstation image with all required security tools', cat: 'IT Setup', day: 'Day 1', owner: 'IT Operations'},
    {id: '85c-OB-02', item: 'Create AD account, email, Slack, VPN, SSO enrollment, and all required application access accounts', cat: 'Access', day: 'Day 1', owner: 'IAM Team'},
    {id: '85c-OB-03', item: 'Grant security tooling access: SIEM console, EDR dashboard, vuln scanner, pentest platforms, SOAR', cat: 'Tools', day: 'Day 1-2', owner: 'SOC Manager'},
    {id: '85c-OB-04', item: 'Complete MFA enrollment, security awareness onboarding course, and acceptable use policy acknowledgment', cat: 'Security', day: 'Day 1', owner: 'Awareness Team'},
    {id: '85c-OB-05', item: 'Sign NDA, employment agreement, IP assignment, and code of conduct documents with HR', cat: 'HR', day: 'Day 1', owner: 'Human Resources'},
    {id: '85c-OB-06', item: 'Introduction meetings with direct team members and key cross-functional stakeholders', cat: 'Integration', day: 'Week 1', owner: 'Hiring Manager'},
    {id: '85c-OB-07', item: 'Security architecture overview, tooling walkthrough, and operational runbook review sessions', cat: 'Training', day: 'Week 1-2', owner: 'Security Architect'},
    {id: '85c-OB-08', item: 'Shadow experienced team member on active incident response and threat hunting investigations', cat: 'Mentoring', day: 'Week 2-3', owner: 'SOC Lead'},
    {id: '85c-OB-09', item: 'Set up individual certification study plan aligned with role requirements and career goals', cat: 'Development', day: 'Week 2', owner: 'Hiring Manager'},
    {id: '85c-OB-10', item: 'Establish 30-60-90 day goals, define success metrics, and schedule first performance checkpoint', cat: 'Goals', day: 'Week 1', owner: 'Hiring Manager'}
  ];

  private _85cMetricsDashboard = [
    {id: '85c-MTD-001', name: 'Mean Time to Detect (MTTD)', value: '4.2 hours', trend: 'improving' as const, target: '< 4 hours', source: 'SIEM - Splunk', method: 'Median time from first alert to analyst acknowledgment', owner: 'SOC Manager', sla: '4 hours', prev: '5.1 hours', spark: [5.8, 5.4, 5.1, 4.9, 4.7, 4.5, 4.3, 4.2], breakdown: [{src: 'Network IDS', pct: '35%', avg: '3.8h'}, {src: 'Endpoint EDR', pct: '28%', avg: '4.1h'}, {src: 'Email Gateway', pct: '22%', avg: '3.5h'}, {src: 'Cloud Security', pct: '10%', avg: '5.2h'}, {src: 'User Reports', pct: '5%', avg: '6.8h'}]},
    {id: '85c-MTD-002', name: 'Mean Time to Respond (MTTR)', value: '2.8 hours', trend: 'stable' as const, target: '< 3 hours', source: 'SOAR - XSOAR', method: 'Median time from acknowledgment to first containment action', owner: 'IR Lead', sla: '3 hours', prev: '2.7 hours', spark: [3.2, 3.0, 2.9, 2.8, 2.8, 2.9, 2.8, 2.8], breakdown: [{src: 'Auto Playbooks', pct: '42%', avg: '1.2h'}, {src: 'Semi-Auto', pct: '33%', avg: '2.5h'}, {src: 'Manual', pct: '20%', avg: '5.1h'}, {src: 'L3 Escalation', pct: '5%', avg: '8.3h'}]},
    {id: '85c-MTD-003', name: 'Patch Compliance Rate', value: '97.6%', trend: 'improving' as const, target: '> 95%', source: 'Tenable.io', method: 'Pct of critical/high vulns patched within SLA windows', owner: 'Vuln Manager', sla: '95%', prev: '96.1%', spark: [93.2, 94.1, 94.8, 95.3, 95.9, 96.4, 97.0, 97.6], breakdown: [{src: 'Critical (7d)', pct: '40%', rate: '99.2%'}, {src: 'High (30d)', pct: '35%', rate: '97.8%'}, {src: 'Medium (90d)', pct: '20%', rate: '95.1%'}, {src: 'Low (180d)', pct: '5%', rate: '89.4%'}]},
    {id: '85c-MTD-004', name: 'Phishing Click Rate', value: '3.2%', trend: 'improving' as const, target: '< 5%', source: 'KnowBe4 + Proofpoint', method: 'Pct of users clicking simulated phishing links monthly', owner: 'Awareness Lead', sla: '5%', prev: '4.1%', spark: [6.8, 6.2, 5.5, 5.1, 4.6, 4.1, 3.6, 3.2], breakdown: [{src: 'Spear Phishing', pct: '35%', rate: '5.1%'}, {src: 'Generic Phishing', pct: '30%', rate: '2.8%'}, {src: 'BEC Sim', pct: '20%', rate: '3.5%'}, {src: 'SMS Phishing', pct: '15%', rate: '1.9%'}]},
    {id: '85c-MTD-005', name: 'Security Posture Score', value: '784', trend: 'improving' as const, target: '> 750', source: 'SecurityScorecard', method: 'Composite: external 30%, compliance 25%, vuln 25%, config 20%', owner: 'CISO', sla: '> 750', prev: '771', spark: [748, 752, 758, 762, 768, 773, 778, 784], breakdown: [{src: 'External Rating', pct: '30%', score: '791'}, {src: 'Compliance', pct: '25%', score: '812'}, {src: 'Vuln Mgmt', pct: '25%', score: '745'}, {src: 'Config', pct: '20%', score: '769'}]},
    {id: '85c-MTD-006', name: 'Vulnerability Backlog', value: '142', trend: 'improving' as const, target: '< 150', source: 'Tenable + Qualys', method: 'Total open vulns across all scanned assets tracked weekly', owner: 'Vuln Manager', sla: '< 150', prev: '168', spark: [210, 198, 185, 175, 165, 158, 150, 142], breakdown: [{src: 'Critical', pct: '8%', count: '11'}, {src: 'High', pct: '22%', count: '31'}, {src: 'Medium', pct: '45%', count: '64'}, {src: 'Low', pct: '25%', count: '36'}]}
  ];

  private _85cArchReview = [
    {id: '85c-AR-001', cat: 'Network', item: 'Network segmentation between trust zones with dedicated firewalls and granular ACLs', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Micro-segmentation via NSX across all production zones'},
    {id: '85c-AR-002', cat: 'Network', item: 'DMZ architecture isolating public services from internal network', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Dual-firewall DMZ with WAF and DDoS mitigation'},
    {id: '85c-AR-003', cat: 'Network', item: 'Least-privilege traffic flows with deny-by-default and quarterly review', sev: 'high' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Explicit allow rules with automated drift detection'},
    {id: '85c-AR-004', cat: 'Network', item: 'Encrypted external communications with IPSec/TLS 1.3 and PFS', sev: 'high' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'IKEv2 with PFS, TLS 1.3 for all external APIs'},
    {id: '85c-AR-005', cat: 'Identity', item: 'Centralized IdP with SSO and automated SCIM provisioning', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'Okta SSO SAML 2.0 for 247 apps with SCIM'},
    {id: '85c-AR-006', cat: 'Identity', item: 'RBAC with quarterly reviews and automated deprovisioning', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'Quarterly recertification with JIT admin access'},
    {id: '85c-AR-007', cat: 'Identity', item: 'PAM controlling all admin and service accounts with session recording', sev: 'high' as const, status: 'fail' as const, reviewer: 'IAM Lead', notes: '3 legacy accounts pending CyberArk enrollment'},
    {id: '85c-AR-008', cat: 'Identity', item: 'MFA enforced for all users, hardware tokens for privileged access', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'FIDO2 for admins, push MFA for users, 99.8% enrollment'},
    {id: '85c-AR-009', cat: 'Data', item: 'Data classification enforced with automated labeling on all repos', sev: 'high' as const, status: 'partial' as const, reviewer: 'Data Protection Lead', notes: 'Framework deployed, gaps on 4 legacy file shares'},
    {id: '85c-AR-010', cat: 'Data', item: 'AES-256 encryption at rest for all sensitive data stores', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Data Protection Lead', notes: 'Full-disk, TDE on DBs, SSE-KMS on cloud storage'},
    {id: '85c-AR-011', cat: 'Data', item: 'DLP monitoring and preventing unauthorized data exfiltration', sev: 'high' as const, status: 'pass' as const, reviewer: 'Data Protection Lead', notes: 'DLP active on email, endpoint, cloud, and network'},
    {id: '85c-AR-012', cat: 'Data', item: 'Encrypted off-site backups with quarterly restore testing', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Infrastructure Lead', notes: '3-2-1 strategy with immutable backups'},
    {id: '85c-AR-013', cat: 'AppSec', item: 'Secure SDLC with SAST, DAST, SCA in all CI/CD pipelines', sev: 'high' as const, status: 'pass' as const, reviewer: 'AppSec Lead', notes: '34 pipelines with security gates and PR blocking'},
    {id: '85c-AR-014', cat: 'AppSec', item: 'API gateway with auth, rate limiting, schema validation', sev: 'high' as const, status: 'pass' as const, reviewer: 'AppSec Lead', notes: 'Kong with OAuth2, rate limits, OpenAPI validation'},
    {id: '85c-AR-015', cat: 'AppSec', item: 'Container security with image scanning and runtime protection', sev: 'high' as const, status: 'partial' as const, reviewer: 'Cloud Security Lead', notes: 'Trivy scanning, Falco runtime in 80% of clusters'},
    {id: '85c-AR-016', cat: 'Monitoring', item: 'SIEM collecting from all critical systems with correlation rules', sev: 'critical' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'Splunk 98% coverage with 1200+ correlation rules'},
    {id: '85c-AR-017', cat: 'Monitoring', item: 'EDR with behavioral detection on all managed endpoints', sev: 'high' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'CrowdStrike on 99.2% endpoints with 24/7 MDR'},
    {id: '85c-AR-018', cat: 'Monitoring', item: 'Executive dashboards with real-time posture visibility', sev: 'medium' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'PowerBI dashboards with weekly exec summaries'},
    {id: '85c-AR-019', cat: 'Cloud', item: 'CSPM monitoring and remediating cloud misconfigurations', sev: 'high' as const, status: 'pass' as const, reviewer: 'Cloud Security Lead', notes: 'Prisma Cloud 450+ checks with auto-remediation'},
    {id: '85c-AR-020', cat: 'Cloud', item: 'IaC templates scanned before deployment to production', sev: 'high' as const, status: 'partial' as const, reviewer: 'Cloud Security Lead', notes: 'Checkov for Terraform, cfn-nag for CloudFormation pending'}
  ];

  private _get85cRiskProgress(): number {
    return Math.round(this._85cRiskAssessmentWorkflow.filter(s => s.status === 'completed').length / this._85cRiskAssessmentWorkflow.length * 100);
  }

  private _get85cTreatmentSummary(): {total: number; approved: number; avgReduction: number; investment: string} {
    const a = this._85cTreatmentOptions.filter(r => r.status === 'approved').length;
    const avg = this._85cTreatmentOptions.reduce((s, r) => s + ((r.before - r.after) / r.before * 100), 0) / this._85cTreatmentOptions.length;
    return {total: this._85cTreatmentOptions.length, approved: a, avgReduction: Math.round(avg), investment: '$1.125M annually'};
  }

  private _get85cRuleSummary(): {total: number; passing: number; failing: number; avgRate: number; violations: number} {
    const p = this._85cComplianceRules.filter(r => r.result === 'pass').length;
    const f = this._85cComplianceRules.filter(r => r.result === 'fail').length;
    const avg = this._85cComplianceRules.reduce((s, r) => s + r.passRate, 0) / this._85cComplianceRules.length;
    const v = this._85cComplianceRules.reduce((s, r) => s + r.violations, 0);
    return {total: this._85cComplianceRules.length, passing: p, failing: f, avgRate: Math.round(avg * 10) / 10, violations: v};
  }

  private _get85cPipelineStats(): {positions: number; applicants: number; interviewing: number; offers: number; critical: number} {
    const t = this._85cTalentPositions.length;
    const a = this._85cTalentPositions.reduce((s, p) => s + p.applicants, 0);
    const i = this._85cTalentPositions.reduce((s, p) => s + p.interviews, 0);
    const o = this._85cTalentPositions.reduce((s, p) => s + p.offers, 0);
    const c = this._85cTalentPositions.filter(x => x.urgency === 'critical').length;
    return {positions: t, applicants: a, interviewing: i, offers: o, critical: c};
  }

  private _get85cMetricTrends(): {improving: number; stable: number; total: number} {
    const imp = this._85cMetricsDashboard.filter(m => m.trend === 'improving').length;
    const stb = this._85cMetricsDashboard.filter(m => m.trend === 'stable').length;
    return {improving: imp, stable: stb, total: this._85cMetricsDashboard.length};
  }

  private _get85cArchScore(): {total: number; passed: number; failed: number; partial: number; score: number} {
    const p = this._85cArchReview.filter(c => c.status === 'pass').length;
    const f = this._85cArchReview.filter(c => c.status === 'fail').length;
    const pa = this._85cArchReview.filter(c => c.status === 'partial').length;
    return {total: this._85cArchReview.length, passed: p, failed: f, partial: pa, score: Math.round((p / this._85cArchReview.length) * 100)};
  }


  private _z85cIncidentScenarios = [
    {id: 'z85c-IS-001', name: 'Ransomware Outbreak in Production Environment', category: 'Malware', likelihood: 'Medium', impact: 'Critical', riskScore: 15, playbooks: ['IR-Ransomware-Isolate', 'IR-Ransomware-Eradicate', 'IR-Ransomway-Recover'], estimatedMTTD: '15min', estimatedMTTR: '4h', involvedTeams: ['SOC', 'IR', 'Infrastructure', 'Legal', 'Comms'], keyIndicators: ['Mass file encryption events', 'Ransom note deployment', 'Lateral movement via SMB/RDP', 'Backup deletion attempts'], mitigationControls: ['EDR behavioral detection', 'Network segmentation', 'Immutable backups', 'Email filtering'], lessonsLearned: 'Ensure offline backups are tested quarterly and Ransomware-specific playbooks are updated with latest threat intelligence', lastDrillDate: '2026-03-15', nextDrillDate: '2026-06-15'},
    {id: 'z85c-IS-002', name: 'Cloud Misconfiguration Leading to Data Exposure', category: 'Cloud', likelihood: 'High', impact: 'High', riskScore: 16, playbooks: ['IR-Cloud-Misconfig-Assess', 'IR-Cloud-Misconfig-Remediate', 'IR-Cloud-Misconfig-Notify'], estimatedMTTD: '2h', estimatedMTTR: '6h', involvedTeams: ['Cloud Security', 'SOC', 'Data Protection', 'Legal'], keyIndicators: ['Public S3 bucket exposure', 'Overly permissive IAM policies', 'Unencrypted database snapshots', 'Public API endpoint discovery'], mitigationControls: ['CSPM monitoring', 'IAM policy analyzer', 'Automated remediation', 'Cloud audit logging'], lessonsLearned: 'Implement CSPM with auto-remediation for common misconfigurations and conduct monthly cloud configuration reviews', lastDrillDate: '2026-02-20', nextDrillDate: '2026-05-20'},
    {id: 'z85c-IS-003', name: 'Insider Threat Data Exfiltration', category: 'Insider', likelihood: 'Low', impact: 'Critical', riskScore: 12, playbooks: ['IR-Insider-Investigate', 'IR-Insider-Contain', 'IR-Insider-Escalate'], estimatedMTTD: '8h', estimatedMTTR: '24h', involvedTeams: ['SOC', 'IR', 'HR', 'Legal', 'IAM'], keyIndicators: ['Anomalous data access patterns', 'Large file downloads to USB or cloud', 'Off-hours access to sensitive systems', 'Accessing data outside normal job scope'], mitigationControls: ['UEBA analytics', 'DLP policies', 'PAM controls', 'Access reviews'], lessonsLearned: 'Strengthen UEBA baselines and implement automated alerts for data access pattern anomalies', lastDrillDate: '2026-01-10', nextDrillDate: '2026-04-10'},
    {id: 'z85c-IS-004', name: 'Supply Chain Attack via Compromised Vendor Software', category: 'Supply Chain', likelihood: 'Low', impact: 'Critical', riskScore: 12, playbooks: ['IR-SupplyChain-Detect', 'IR-SupplyChain-Isolate', 'IR-SupplyChain-Remediate'], estimatedMTTD: '24h', estimatedMTTR: '72h', involvedTeams: ['SOC', 'IR', 'Procurement', 'Vendor Mgmt', 'Legal'], keyIndicators: ['Unexpected network connections from vendor software', 'Modified binaries or dependencies', 'Anomalous behavior from trusted applications', 'SBOM discrepancy alerts'], mitigationControls: ['SCA scanning', 'SBOM monitoring', 'Vendor security assessments', 'Network segmentation'], lessonsLearned: 'Require SBOM from all vendors and implement continuous monitoring of third-party component behavior', lastDrillDate: '2026-03-01', nextDrillDate: '2026-06-01'},
    {id: 'z85c-IS-005', name: 'Credential Stuffing Attack on Customer Portal', category: 'External Attack', likelihood: 'High', impact: 'Medium', riskScore: 12, playbooks: ['IR-CredentialStuffing-Detect', 'IR-CredentialStuffing-Block', 'IR-CredentialStuffing-Notify'], estimatedMTTD: '30min', estimatedMTTR: '2h', involvedTeams: ['SOC', 'AppSec', 'Customer Support', 'Comms'], keyIndicators: ['High volume of failed login attempts', 'Login attempts from known compromised credential lists', 'Unusual geographic distribution of login attempts', 'Account takeover indicators'], mitigationControls: ['WAF rate limiting', 'CAPTCHA on login', 'MFA enforcement', 'Credential monitoring service'], lessonsLearned: 'Deploy advanced bot detection on login endpoints and implement proactive credential monitoring for customer accounts', lastDrillDate: '2026-04-01', nextDrillDate: '2026-07-01'},
    {id: 'z85c-IS-006', name: 'Phishing Campaign Targeting Executive Team', category: 'Social Engineering', likelihood: 'High', impact: 'High', riskScore: 16, playbooks: ['IR-Phishing-Contain', 'IR-Phishing-Investigate', 'IR-Phishing-Notify'], estimatedMTTD: '1h', estimatedMTTR: '4h', involvedTeams: ['SOC', 'Awareness', 'Executive Office', 'IT'], keyIndicators: ['Sophisticated spear-phishing emails to C-suite', 'Business email compromise indicators', 'Redirected MFA approval requests', 'Unauthorized wire transfer attempts'], mitigationControls: ['AI email filtering', 'Executive awareness training', 'Out-of-band verification policy', 'DMARC/DKIM/SPF'], lessonsLearned: 'Implement additional email security controls for executive mailboxes and conduct monthly spear-phishing simulations', lastDrillDate: '2026-02-15', nextDrillDate: '2026-05-15'}
  ];

  private _z85cSecurityFrameworks = [
    {name: 'NIST Cybersecurity Framework 2.0', version: '2.0', categories: ['Govern', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'], currentMaturity: 'Tier 3 - Repeatable', targetMaturity: 'Tier 4 - Adaptive', gaps: ['Supply chain risk management maturity', 'Continuous improvement feedback loop documentation', 'External dependency mapping completeness'], strengths: ['Strong detect and respond capabilities', 'Well-documented protect controls', 'Active vulnerability management program'], lastAssessment: '2026-03-01', nextAssessment: '2026-09-01', owner: 'CISO'},
    {name: 'ISO 27001:2022', version: '2022', categories: ['A.5 Organizational', 'A.6 People', 'A.7 Physical', 'A.8 Technological'], currentMaturity: 'Certified', targetMaturity: 'Certified with zero nonconformities', gaps: ['A.8.25 Secure development lifecycle documentation', 'A.5.23 Cloud services information security policy update', 'A.8.16 Monitoring activities completeness'], strengths: ['Clean certification audit with zero major nonconformities', 'Strong access control framework', 'Comprehensive incident management process'], lastAssessment: '2026-01-15', nextAssessment: '2027-01-15', owner: 'Compliance Officer'},
    {name: 'CIS Controls v8.1', version: '8.1', categories: ['IG1 (Essential Cyber Hygiene)', 'IG2 (Expanded)', 'IG3 (Comprehensive)'], currentMaturity: 'IG2 - 87% Implementation', targetMaturity: 'IG3 - 95% Implementation', gaps: ['Control 4.8 - Uninterruptible Power Supply monitoring', 'Control 13.3 - Application software security testing automation', 'Control 16.9 - Adversary emulation testing frequency'], strengths: ['Strong IG1 implementation at 98%', 'Comprehensive inventory and control management', 'Active continuous monitoring and response'], lastAssessment: '2026-04-01', nextAssessment: '2026-10-01', owner: 'Security Architect'},
    {name: 'MITRE ATT&CK v14.1', version: '14.1', categories: ['Enterprise', 'Mobile', 'ICS'], currentMaturity: 'Detection coverage 72%', targetMaturity: 'Detection coverage 90%', gaps: ['Collection techniques detection coverage', 'Command and control channel identification', 'Impact technique prevention controls'], strengths: ['Strong initial access detection', 'Comprehensive persistence monitoring', 'Active threat hunting program aligned to ATT&CK'], lastAssessment: '2026-02-01', nextAssessment: '2026-05-01', owner: 'Threat Intelligence Lead'}
  ];

  private _z85cThirdPartyRiskData = [
    {vendorId: 'z85c-V-001', vendorName: 'CloudFlare Inc', category: 'CDN and DDoS Protection', tier: 'Critical', riskScore: 22, assessmentDate: '2026-03-15', nextReview: '2026-06-15', findings: ['Shared responsibility model documentation needs update', 'Incident notification SLA verification required'], controls: ['SOC 2 Type II certified', 'ISO 27001 certified', 'Annual penetration testing'], slaCompliance: '99.99% uptime SLA met', dataProcessing: 'Minimal PII access, no data storage', status: 'approved' as const},
    {vendorId: 'z85c-V-002', vendorName: 'Okta Inc', category: 'Identity Provider', tier: 'Critical', riskScore: 18, assessmentDate: '2026-02-28', nextReview: '2026-05-28', findings: ['MFA bypass vulnerability remediation verified', 'API rate limiting configuration reviewed'], controls: ['SOC 2 Type II certified', 'FedRAMP authorized', 'Bug bounty program active'], slaCompliance: '99.95% uptime SLA met', dataProcessing: 'Identity data processing with DPA in place', status: 'approved' as const},
    {vendorId: 'z85c-V-003', vendorName: 'CrowdStrike Holdings', category: 'Endpoint Detection and Response', tier: 'Critical', riskScore: 15, assessmentDate: '2026-03-01', nextReview: '2026-06-01', findings: ['Sensor performance optimization review completed', 'Data retention policy aligned with requirements'], controls: ['SOC 2 Type II certified', 'ISO 27001 certified', 'Independent code review'], slaCompliance: 'All SLAs met within defined thresholds', dataProcessing: 'Telemetry data only, no customer content access', status: 'approved' as const},
    {vendorId: 'z85c-V-004', vendorName: 'AnalyticsPro Corp', category: 'Business Intelligence', tier: 'High', riskScore: 28, assessmentDate: '2026-01-15', nextReview: '2026-04-15', findings: ['Data residency requirements not fully documented', 'Sub-processor list needs update with new acquisitions', 'Encryption key management review pending'], controls: ['SOC 2 Type II pending renewal', 'GDPR compliance self-assessed'], slaCompliance: '98.5% uptime - below 99% target', dataProcessing: 'Extensive customer data access for analytics processing', status: 'conditional' as const},
    {vendorId: 'z85c-V-005', vendorName: 'MarketingTech LLC', category: 'Email Marketing Platform', tier: 'Medium', riskScore: 35, assessmentDate: '2025-12-01', nextReview: '2026-03-01', findings: ['Outdated security assessment - 4 months overdue', 'No current SOC 2 certification', 'Data processing agreement expired', 'Sub-processor transparency report not available'], controls: ['Self-assessed security questionnaire', 'Basic encryption standards'], slaCompliance: '96% uptime - below contractual SLA', dataProcessing: 'Full customer contact list access with email sending capabilities', status: 'remediation_required' as const}
  ];

  private _z85cSecurityTrainingCatalog = [
    {id: 'z85c-TR-001', title: 'Security Awareness Fundamentals', audience: 'All Employees', duration: '45 min', frequency: 'Annual', completionRate: 94.2, passingScore: 80, avgScore: 87, modules: ['Security threats overview', 'Phishing identification', 'Social engineering awareness', 'Data handling best practices', 'Incident reporting procedures'], lastUpdated: '2026-01-15', nextUpdate: '2027-01-15', platform: 'KnowBe4'},
    {id: 'z85c-TR-002', title: 'Advanced Phishing Defense', audience: 'All Employees', duration: '30 min', frequency: 'Quarterly', completionRate: 91.8, passingScore: 90, avgScore: 82, modules: ['Spear phishing recognition', 'BEC identification', 'Vishing and smishing awareness', 'Verify before you trust framework'], lastUpdated: '2026-03-01', nextUpdate: '2026-06-01', platform: 'KnowBe4'},
    {id: 'z85c-TR-003', title: 'Secure Coding Practices', audience: 'Development Teams', duration: '4 hours', frequency: 'Annual', completionRate: 88.5, passingScore: 75, avgScore: 81, modules: ['OWASP Top 10 deep dive', 'Secure SDLC integration', 'Code review best practices', 'Dependency management', 'Security testing methodologies'], lastUpdated: '2026-02-01', nextUpdate: '2027-02-01', platform: 'Internal LMS'},
    {id: 'z85c-TR-004', title: 'Incident Response Training', audience: 'SOC and IR Teams', duration: '8 hours', frequency: 'Quarterly', completionRate: 96.7, passingScore: 85, avgScore: 91, modules: ['IR process and procedures', 'Evidence handling and chain of custody', 'Communication protocols', 'Tabletop exercise scenarios', 'Tool proficiency assessment'], lastUpdated: '2026-04-01', nextUpdate: '2026-07-01', platform: 'Internal LMS + Range'},
    {id: 'z85c-TR-005', title: 'Cloud Security Fundamentals', audience: 'DevOps and Cloud Teams', duration: '3 hours', frequency: 'Annual', completionRate: 85.2, passingScore: 75, avgScore: 78, modules: ['Cloud shared responsibility model', 'IAM best practices', 'Network security in the cloud', 'Data protection and encryption', 'Compliance in cloud environments'], lastUpdated: '2026-01-01', nextUpdate: '2027-01-01', platform: 'Internal LMS'},
    {id: 'z85c-TR-006', title: 'Executive Security Briefing', audience: 'C-Suite and Board', duration: '1 hour', frequency: 'Quarterly', completionRate: 100.0, passingScore: 0, avgScore: 0, modules: ['Current threat landscape', 'Security posture update', 'Risk register review', 'Upcoming security initiatives', 'Compliance status summary'], lastUpdated: '2026-04-01', nextUpdate: '2026-07-01', platform: 'In-person/Video'}
  ];

  private _z85cSecurityToolInventory = [
    {id: 'z85c-TL-001', name: 'Splunk Enterprise Security', category: 'SIEM', version: '9.1.2', license: 'Enterprise', annualCost: '$285K', users: 45, coverage: '98% of critical log sources', integrations: ['CrowdStrike', 'Okta', 'AWS CloudTrail', 'Azure AD', 'Proofpoint'], health: 'healthy' as const, lastMaintenance: '2026-04-15', nextMaintenance: '2026-07-15', owner: 'SOC Manager'},
    {id: 'z85c-TL-002', name: 'CrowdStrike Falcon', category: 'EDR/XDR', version: '7.12', license: 'Enterprise', annualCost: '$320K', users: 2800, coverage: '99.2% of managed endpoints', integrations: ['Splunk', 'ServiceNow', 'Okta', 'Palo Alto Networks'], health: 'healthy' as const, lastMaintenance: '2026-04-10', nextMaintenance: '2026-07-10', owner: 'Endpoint Security Lead'},
    {id: 'z85c-TL-003', name: 'Tenable.io', category: 'Vulnerability Management', version: '6.14', license: 'Enterprise', annualCost: '$180K', users: 25, coverage: 'All production and staging assets', integrations: ['Splunk', 'ServiceNow', 'Jira', 'Slack'], health: 'healthy' as const, lastMaintenance: '2026-04-12', nextMaintenance: '2026-07-12', owner: 'Vulnerability Manager'},
    {id: 'z85c-TL-004', name: 'Prisma Cloud', category: 'CSPM/CWPP', version: '32.1', license: 'Enterprise', annualCost: '$240K', users: 18, coverage: 'AWS, Azure, GCP environments', integrations: ['AWS Security Hub', 'Azure Defender', 'Splunk', 'Jira'], health: 'degraded' as const, lastMaintenance: '2026-04-08', nextMaintenance: '2026-07-08', owner: 'Cloud Security Lead'},
    {id: 'z85c-TL-005', name: 'KnowBe4 Platform', category: 'Security Awareness', version: 'Current', license: 'Enterprise', annualCost: '$85K', users: 3200, coverage: 'All employees', integrations: ['Okta SCIM', 'Slack', 'HRIS system'], health: 'healthy' as const, lastMaintenance: '2026-04-05', nextMaintenance: '2026-07-05', owner: 'Awareness Lead'},
    {id: 'z85c-TL-006', name: 'CyberArk Privileged Access Manager', category: 'PAM', version: '12.2', license: 'Enterprise', annualCost: '$195K', users: 350, coverage: 'All privileged accounts', integrations: ['Active Directory', 'Splunk', 'ServiceNow', 'Okta'], health: 'healthy' as const, lastMaintenance: '2026-04-18', nextMaintenance: '2026-07-18', owner: 'IAM Lead'}
  ];

  private _getz85cScenarioSummary(): {total: number; critical: number; high: number; drilled: number; avgRiskScore: number} {
    const crit = this._z85cIncidentScenarios.filter(s => s.impact === 'Critical').length;
    const high = this._z85cIncidentScenarios.filter(s => s.impact === 'High').length;
    const avg = this._z85cIncidentScenarios.reduce((s, x) => s + x.riskScore, 0) / this._z85cIncidentScenarios.length;
    return {total: this._z85cIncidentScenarios.length, critical: crit, high: high, drilled: this._z85cIncidentScenarios.length, avgRiskScore: Math.round(avg)};
  }

  private _getz85cVendorRiskSummary(): {total: number; approved: number; conditional: number; remediation: number; avgScore: number} {
    const approved = this._z85cThirdPartyRiskData.filter(v => v.status === 'approved').length;
    const cond = this._z85cThirdPartyRiskData.filter(v => v.status === 'conditional').length;
    const rem = this._z85cThirdPartyRiskData.filter(v => v.status === 'remediation_required').length;
    const avg = this._z85cThirdPartyRiskData.reduce((s, v) => s + v.riskScore, 0) / this._z85cThirdPartyRiskData.length;
    return {total: this._z85cThirdPartyRiskData.length, approved, conditional: cond, remediation: rem, avgScore: Math.round(avg)};
  }

  private _getz85cTrainingSummary(): {total: number; avgCompletion: number; avgScore: number; overdueUpdates: number} {
    const avgComp = this._z85cSecurityTrainingCatalog.reduce((s, t) => s + t.completionRate, 0) / this._z85cSecurityTrainingCatalog.length;
    const avgScore = this._z85cSecurityTrainingCatalog.filter(t => t.avgScore > 0).reduce((s, t) => s + t.avgScore, 0) / this._z85cSecurityTrainingCatalog.filter(t => t.avgScore > 0).length;
    return {total: this._z85cSecurityTrainingCatalog.length, avgCompletion: Math.round(avgComp * 10) / 10, avgScore: Math.round(avgScore), overdueUpdates: 0};
  }

  private _getz85cToolHealthSummary(): {total: number; healthy: number; degraded: number; annualCost: string} {
    const healthy = this._z85cSecurityToolInventory.filter(t => t.health === 'healthy').length;
    const degraded = this._z85cSecurityToolInventory.filter(t => t.health === 'degraded').length;
    const cost = this._z85cSecurityToolInventory.reduce((s, t) => s + parseInt(t.annualCost.replace(/[^0-9]/g, '')), 0);
    return {total: this._z85cSecurityToolInventory.length, healthy, degraded, annualCost: '$' + (cost / 1000).toFixed(0) + 'K'};
  }


  private _x85cSecurityZones = [
    {zoneId: 'x85c-Z-001', name: 'Internet DMZ', trustLevel: 'Untrusted', subnet: '10.0.0.0/24', segmentation: 'Dual-firewall', firewallRules: 45, monitoring: 'Full packet capture', assets: ['Web servers', 'Load balancers', 'WAF appliances', 'Reverse proxy'], riskLevel: 'high' as const, lastAssessment: '2026-04-15', nextAssessment: '2026-07-15'},
    {zoneId: 'x85c-Z-002', name: 'Corporate Network', trustLevel: 'Trusted', subnet: '10.1.0.0/16', segmentation: 'VLAN + micro-seg', firewallRules: 128, monitoring: 'NetFlow + IDS', assets: ['Workstations', 'Printers', 'Meeting room systems', 'VoIP phones'], riskLevel: 'medium' as const, lastAssessment: '2026-04-10', nextAssessment: '2026-07-10'},
    {zoneId: 'x85c-Z-003', name: 'Production Data Center', trustLevel: 'Restricted', subnet: '10.2.0.0/16', segmentation: 'Full micro-segmentation', firewallRules: 256, monitoring: 'Full packet capture + EDR', assets: ['Application servers', 'Database clusters', 'Message queues', 'API gateways'], riskLevel: 'low' as const, lastAssessment: '2026-04-12', nextAssessment: '2026-07-12'},
    {zoneId: 'x85c-Z-004', name: 'Management Network', trustLevel: 'Restricted', subnet: '10.3.0.0/24', segmentation: 'Isolated VLAN', firewallRules: 32, monitoring: 'Syslog + SNMP', assets: ['Hypervisors', 'Switch management', 'Storage controllers', 'Backup appliances'], riskLevel: 'low' as const, lastAssessment: '2026-04-08', nextAssessment: '2026-07-08'},
    {zoneId: 'x85c-Z-005', name: 'Cloud Production', trustLevel: 'Restricted', subnet: 'VPC: 172.16.0.0/12', segmentation: 'Security groups + NACLs', firewallRules: 189, monitoring: 'VPC Flow Logs + GuardDuty', assets: ['Kubernetes clusters', 'Managed databases', 'Object storage', 'Serverless functions'], riskLevel: 'medium' as const, lastAssessment: '2026-04-18', nextAssessment: '2026-07-18'}
  ];

  private _x85cSecurityAlerts = [
    {id: 'x85c-AL-001', severity: 'critical', title: 'Active ransomware encryption detected on PROD-DB-01', source: 'CrowdStrike', timestamp: '2026-04-22T13:45:00Z', status: 'investigating', assignee: 'SOC Analyst J. Smith', asset: 'PROD-DB-01 (10.2.1.15)', mitreTechnique: 'T1486 - Data Encrypted for Impact', playbook: 'IR-Ransomware-Isolate', sla: '15 minutes', elapsed: '12 minutes', notes: 'EDR detected mass file encryption event pattern. Automated isolation triggered. IR team paged.'},
    {id: 'x85c-AL-002', severity: 'high', title: 'Impossible travel detected for user admin@company.com', source: 'Okta', timestamp: '2026-04-22T12:30:00Z', status: 'triaged', assignee: 'SOC Analyst M. Johnson', asset: 'Okta - admin@company.com', mitreTechnique: 'T1078 - Valid Accounts', playbook: 'IR-ImpossibleTravel', sla: '30 minutes', elapsed: '87 minutes', notes: 'Login from Tokyo followed by login from New York within 30 minutes. Account temporarily locked. User confirmed via out-of-band channel they are in New York.'},
    {id: 'x85c-AL-003', severity: 'high', title: 'Public S3 bucket discovered with customer PII exposure', source: 'Prisma Cloud', timestamp: '2026-04-22T11:15:00Z', status: 'remediating', assignee: 'Cloud Security Lead A. Chen', asset: 'AWS S3: customer-data-archive-2024', mitreTechnique: 'N/A - Misconfiguration', playbook: 'IR-Cloud-Misconfig-Remediate', sla: '1 hour', elapsed: '2.5 hours', notes: 'Bucket containing archived customer records was publicly accessible. Bucket blocked and encrypted. Data exposure assessment in progress.'},
    {id: 'x85c-AL-004', severity: 'medium', title: 'Anomalous data download by user jane.developer@company.com', source: 'Microsoft DLP', timestamp: '2026-04-22T10:00:00Z', status: 'investigating', assignee: 'SOC Analyst R. Davis', asset: 'Endpoint: WS-DEV-042', mitreTechnique: 'T1567 - Exfil Over Web Service', playbook: 'IR-DLP-Investigation', sla: '4 hours', elapsed: '3.5 hours', notes: 'User downloaded 4.2GB of source code files to personal Google Drive. Interview scheduled with user and manager.'},
    {id: 'x85c-AL-005', severity: 'medium', title: 'Credential stuffing attack detected on customer portal', source: 'Cloudflare WAF', timestamp: '2026-04-22T09:30:00Z', status: 'contained', assignee: 'SOC Analyst K. Wilson', asset: 'Customer Portal (portal.company.com)', mitreTechnique: 'T1110 - Brute Force', playbook: 'IR-CredentialStuffing-Block', sla: '2 hours', elapsed: '4 hours', notes: 'Rate limiting and CAPTCHA automatically deployed. 12,000 failed login attempts from 800 unique IPs blocked. No successful account takeovers confirmed.'},
    {id: 'x85c-AL-006', severity: 'low', title: 'SSL certificate expiring in 14 days for api.company.com', source: 'Certificate monitoring', timestamp: '2026-04-22T08:00:00Z', status: 'remediated', assignee: 'Infrastructure Lead T. Brown', asset: 'api.company.com', mitreTechnique: 'N/A', playbook: 'Certificate Renewal', sla: '30 days', elapsed: '16 days', notes: 'Automated renewal triggered via ACME. New certificate deployed successfully. No service interruption.'}
  ];

  private _x85cComplianceFrameworks = [
    {name: 'PCI DSS v4.0', status: 'compliant' as const, lastAudit: '2026-02-15', nextAudit: '2027-02-15', requirements: 250, compliant: 248, partiallyCompliant: 2, nonCompliant: 0, keyGaps: ['Requirement 6.4.3 - Additional verification for changes to payment pages', 'Requirement 12.3.1 - Targeted risk analysis frequency documentation'], remediationOwner: 'Compliance Officer', estimatedRemediation: 'Q3 2026'},
    {name: 'HIPAA Security Rule', status: 'compliant' as const, lastAudit: '2026-01-20', nextAudit: '2027-01-20', requirements: 78, compliant: 76, partiallyCompliant: 2, nonCompliant: 0, keyGaps: ['Administrative safeguards - workforce security training documentation', 'Technical safeguards - audit control review frequency'], remediationOwner: 'Privacy Officer', estimatedRemediation: 'Q2 2026'},
    {name: 'SOC 2 Type II', status: 'compliant' as const, lastAudit: '2026-03-01', nextAudit: '2027-03-01', requirements: 64, compliant: 63, partiallyCompliant: 1, nonCompliant: 0, keyGaps: ['CC6.1 - Logical access security for production systems documentation update'], remediationOwner: 'GRC Team', estimatedRemediation: 'Q2 2026'},
    {name: 'GDPR', status: 'mostly_compliant' as const, lastAudit: '2026-04-01', nextAudit: '2026-10-01', requirements: 99, compliant: 94, partiallyCompliant: 4, nonCompliant: 1, keyGaps: ['Article 30 - Records of processing activities update', 'Article 35 - DPIA for new AI processing', 'Article 32 - Security of processing documentation', 'Article 33 - 72-hour breach notification procedure test'], remediationOwner: 'DPO', estimatedRemediation: 'Q3 2026'}
  ];

  private _x85cDataClassificationPolicy = [
    {level: 'Public', description: 'Information approved for public disclosure with no restrictions on access or distribution', color: 'green', examples: ['Marketing materials', 'Press releases', 'Public financial reports', 'Published research papers'], handling: ['No access restrictions', 'Standard handling procedures', 'No encryption required for transmission'], retention: 'Per business need', owner: 'Communications Team'},
    {level: 'Internal', description: 'Information intended for internal use within the organization that could cause minimal harm if disclosed', color: 'blue', examples: ['Internal policies', 'Meeting notes', 'Project documentation', 'Internal newsletters'], handling: ['Access restricted to employees', 'No external sharing without approval', 'Standard encryption for external transmission'], retention: '3-7 years', owner: 'Department Heads'},
    {level: 'Confidential', description: 'Sensitive information that could cause significant harm to the organization or individuals if disclosed', color: 'yellow', examples: ['Customer PII', 'Financial data', 'Employee records', 'Business strategy documents', 'Vendor contracts'], handling: ['Need-to-know access only', 'Encryption required at rest and in transit', 'DLP monitoring enabled', 'Audit logging mandatory'], retention: 'Per regulatory requirements', owner: 'Data Owners'},
    {level: 'Restricted', description: 'Highly sensitive information that could cause severe or catastrophic harm if disclosed', color: 'red', examples: ['Authentication credentials', 'Encryption keys', 'Trade secrets', 'M&A due diligence materials', 'Security vulnerability details'], handling: ['Strict need-to-know with CISO approval', 'End-to-end encryption mandatory', 'Air-gapped storage where possible', 'Enhanced monitoring and alerting', 'Multi-factor authentication required'], retention: 'Minimum necessary', owner: 'CISO'}
  ];

  private _getx85cZoneSummary(): {total: number; highRisk: number; mediumRisk: number; lowRisk: number; totalRules: number} {
    const high = this._x85cSecurityZones.filter(z => z.riskLevel === 'high').length;
    const med = this._x85cSecurityZones.filter(z => z.riskLevel === 'medium').length;
    const low = this._x85cSecurityZones.filter(z => z.riskLevel === 'low').length;
    const rules = this._x85cSecurityZones.reduce((s, z) => s + z.firewallRules, 0);
    return {total: this._x85cSecurityZones.length, highRisk: high, mediumRisk: med, lowRisk: low, totalRules: rules};
  }

  private _getx85cAlertSummary(): {total: number; critical: number; high: number; medium: number; low: number; open: number; contained: number} {
    const crit = this._x85cSecurityAlerts.filter(a => a.severity === 'critical').length;
    const high = this._x85cSecurityAlerts.filter(a => a.severity === 'high').length;
    const med = this._x85cSecurityAlerts.filter(a => a.severity === 'medium').length;
    const low = this._x85cSecurityAlerts.filter(a => a.severity === 'low').length;
    const open = this._x85cSecurityAlerts.filter(a => a.status === 'investigating' || a.status === 'triaged').length;
    const contained = this._x85cSecurityAlerts.filter(a => a.status === 'contained' || a.status === 'remediated').length;
    return {total: this._x85cSecurityAlerts.length, critical: crit, high, medium: med, low, open, contained};
  }

  private _getx85cComplianceSummary(): {total: number; fullyCompliant: number; mostlyCompliant: number; avgComplianceRate: number} {
    const full = this._x85cComplianceFrameworks.filter(f => f.status === 'compliant').length;
    const mostly = this._x85cComplianceFrameworks.filter(f => f.status === 'mostly_compliant').length;
    const avgRate = this._x85cComplianceFrameworks.reduce((s, f) => s + (f.compliant / f.requirements * 100), 0) / this._x85cComplianceFrameworks.length;
    return {total: this._x85cComplianceFrameworks.length, fullyCompliant: full, mostlyCompliant: mostly, avgComplianceRate: Math.round(avgRate * 10) / 10};
  }

  // === Security Alert Fatigue Dashboard (Round 36 - Block D) ===
  private _afSources: Array<{id: string; name: string; dailyVolume: number; fpRate: number;
    tuning: number; analystLoad: number; suppressed: number; escalated: number}> = [];
  private _afTrends: Array<{month: string; total: number; incidents: number; fatigue: number}> = [];
  private _afThresholds: {maxDailyPerAnalyst: number; fpTarget: number; escalationTarget: number} = {maxDailyPerAnalyst: 150, fpTarget: 15, escalationTarget: 5};

  private _initAfFatigue() {
    const sources = ['SIEM Correlation', 'IDS/IPS', 'EDR Alerts', 'WAF Logs', 'DLP Triggers',
      'CloudTrail Monitor', 'Email Gateway', 'Endpoint Detection', 'Network Flow', 'Auth Events',
      'API Gateway', 'Container Runtime'];
    this._afSources = sources.map((name, i) => ({
      id: 'af-src-' + i, name,
      dailyVolume: 200 + ((idx * 13 + i * 37) % 800),
      fpRate: 10 + ((idx + i * 7) % 45),
      tuning: 20 + ((idx * 3 + i * 11) % 60),
      analystLoad: 15 + ((idx * 5 + i * 9) % 70),
      suppressed: 30 + ((idx * 2 + i * 17) % 200),
      escalated: 5 + ((idx + i * 3) % 25)
    }));
    const months = ['Apr 2025', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan 2026', 'Feb', 'Mar'];
    let base = 3000 + idx * 100;
    this._afTrends = months.map((m, i) => {
      const total = base + ((i * 150) % 2000);
      const incidents = Math.round(total * (0.02 + (idx % 5) * 0.005));
      const fatigue = Math.min(100, Math.round((total / (12 + idx % 5)) / this._afThresholds.maxDailyPerAnalyst * 100));
      base = total;
      return {month: m, total, incidents, fatigue};
    });
  }

  private _afGetFatigueLevel(): {level: string; score: number; recommendation: string} {
    const latestFatigue = this._afTrends.length > 0 ? this._afTrends[this._afTrends.length - 1].fatigue : 0;
    const level = latestFatigue > 80 ? 'critical' : latestFatigue > 60 ? 'high' : latestFatigue > 40 ? 'moderate' : 'low';
    const recs = {
      critical: 'Immediate action: suppress low-confidence rules, deploy ML-based triage',
      high: 'Review top 10 noisiest rules, implement auto-dismissal for known FPs',
      moderate: 'Continue tuning efforts, focus on high-fp sources',
      low: 'Alert volume is healthy, maintain current tuning cadence'
    };
    return {level, score: latestFatigue, recommendation: recs[level as keyof typeof recs]};
  }

  private _afGetTuningPriority(): Array<{source: string; currentFp: number; potentialSaving: number; effort: string}> {
    return this._afSources
      .filter(s => s.fpRate > 20)
      .sort((a, b) => b.fpRate - a.fpRate)
      .slice(0, 5)
      .map(s => ({
        source: s.name, currentFp: s.fpRate,
        potentialSaving: Math.round(s.dailyVolume * s.fpRate / 100),
        effort: s.fpRate > 40 ? 'high' : 'medium'
      }));
  }

  private _afGetSuppressionRules(): Array<{rule: string; source: string; matches: number; status: string; expiry: string}> {
    return [
      {rule: 'Suppress known-benign DNS queries', source: 'DNS Monitor', matches: 1500 + idx * 10, status: 'active', expiry: '2026-06-30'},
      {rule: 'Auto-dismiss internal scan traffic', source: 'IDS/IPS', matches: 800 + idx * 5, status: 'active', expiry: '2026-05-15'},
      {rule: 'Filter CI/CD pipeline WAF noise', source: 'WAF Logs', matches: 2000 + idx * 8, status: 'pending', expiry: '2026-07-01'},
      {rule: 'Ignore scheduled backup auth events', source: 'Auth Events', matches: 600 + idx * 3, status: 'active', expiry: '2026-05-30'},
    ];
  }


  // === Compliance Framework Mapper (Round 36 - Pass 2 - Block A) ===

  private _cfFrameworks: Array<{id: string; name: string; version: string; controls: number; mapped: number;
    gaps: number; lastAudit: string; nextAudit: string; owner: string; status: string}> = [];
  private _cfMappings: Array<{controlId: string; source: string; target: string; confidence: number; notes: string}> = [];

  private _initCfFrameworks() {
    const names = ['ISO 27001:2022', 'SOC 2 Type II', 'PCI DSS 4.0', 'NIST CSF 2.0', 'GDPR',
      'HIPAA', 'SOX IT Controls', 'FedRAMP High', 'CIS Controls v8', 'COBIT 2019',
      'HITRUST CSF', 'NZISM'];
    const versions = ['A.18.1', 'Trust Services 2024', 'v4.0.1', '2.0', 'Reg 2016/679',
      '45 CFR 164', 'AS 3101', 'Rev 5', 'v8.1', '2019 R3', '11.3', 'v3.5'];
    const owners = ['GRC Lead', 'CISO', 'Compliance Mgr', 'Risk Officer', 'DPO',
      'CISO', 'Audit Director', 'Fed Lead', 'Sec Architect', 'IT Gov Lead', 'CISO', 'NZ CISO'];
    this._cfFrameworks = names.map((name, i) => ({
      id: 'cf-fw-' + i, name, version: versions[i],
      controls: 50 + ((idx + i * 7) % 200),
      mapped: 40 + ((idx + i * 5) % 150),
      gaps: 5 + ((idx + i * 3) % 25),
      lastAudit: '2025-' + String(10 + (i % 3)).padStart(2, '0') + '-15',
      nextAudit: '2026-' + String(7 + (i % 6)).padStart(2, '0') + '-01',
      owner: owners[i],
      status: i % 5 === 0 ? 'in-review' : 'active'
    }));
    this._cfMappings = names.slice(0, 8).flatMap((_, fi) =>
      [0, 1, 2].map(ci => ({
        controlId: names[fi].split(' ')[0] + '-' + String(100 + ci),
        source: names[fi], target: names[(fi + 1) % names.length],
        confidence: 70 + ((idx + fi + ci) % 30),
        notes: 'Cross-mapped via automated tooling with manual validation'
      }))
    );
  }

  private _cfGetCoverage(): {total: number; mapped: number; coverage: number} {
    const total = this._cfFrameworks.reduce((s, f) => s + f.controls, 0);
    const mapped = this._cfFrameworks.reduce((s, f) => s + f.mapped, 0);
    return {total, mapped, coverage: Math.round(mapped / total * 100)};
  }

  private _cfGetUpcomingAudits(): Array<{framework: string; date: string; readiness: number}> {
    return this._cfFrameworks
      .filter(f => f.nextAudit > '2026-05-01')
      .sort((a, b) => a.nextAudit.localeCompare(b.nextAudit))
      .slice(0, 5)
      .map(f => ({
        framework: f.name, date: f.nextAudit,
        readiness: Math.round(f.mapped / f.controls * 100)
      }));
  }

  private _cfGetGapAnalysis(): Array<{framework: string; gaps: number; critical: number; remediationPlan: string}> {
    return this._cfFrameworks.filter(f => f.gaps > 0).map(f => ({
      framework: f.name, gaps: f.gaps,
      critical: Math.ceil(f.gaps * 0.3),
      remediationPlan: f.gaps > 15 ? 'Emergency remediation sprint required' : f.gaps > 8 ? 'Dedicated gap closure team' : 'Ongoing remediation in sprint backlog'
    }));
  }


  // === Security Reporting Module (Round 36 - Pass 3 - Block B) ===

  private _srReports: Array<{id: string; name: string; type: string; frequency: string;
    audience: string; lastGenerated: string; sections: number; autoGenerated: boolean;
    status: string; recipients: number; deliveryMethod: string}> = [];
  private _srTemplates: Array<{id: string; name: string; category: string;
    description: string; variables: string[]; lastModified: string}> = [];

  private _initSrReporting() {
    const reports = [
      {name: 'Weekly Security Summary', type: 'Operational', frequency: 'Weekly', audience: 'Security Team'},
      {name: 'Monthly Executive Dashboard', type: 'Executive', frequency: 'Monthly', audience: 'C-Suite'},
      {name: 'Quarterly Board Report', type: 'Board', frequency: 'Quarterly', audience: 'Board of Directors'},
      {name: 'Incident Post-Mortem', type: 'Incident', frequency: 'On-demand', audience: 'Stakeholders'},
      {name: 'Compliance Status Report', type: 'Compliance', frequency: 'Monthly', audience: 'GRC Team'},
      {name: 'Vulnerability Trend Analysis', type: 'Technical', frequency: 'Weekly', audience: 'Security Ops'},
      {name: 'Third-Party Risk Digest', type: 'Vendor', frequency: 'Monthly', audience: 'Procurement'},
      {name: 'SOC Performance Metrics', type: 'Operational', frequency: 'Daily', audience: 'SOC Manager'},
      {name: 'Threat Intelligence Brief', type: 'Intelligence', frequency: 'Daily', audience: 'CTI Team'},
      {name: 'Annual Security Review', type: 'Strategic', frequency: 'Annual', audience: 'Board'},
      {name: 'Penetration Test Results', type: 'Technical', frequency: 'Quarterly', audience: 'Engineering'},
      {name: 'Data Protection Impact Assessment', type: 'Compliance', frequency: 'On-demand', audience: 'DPO'},
    ];
    const methods = ['Email', 'Slack', 'Confluence', 'SharePoint', 'Email'];
    this._srReports = reports.map((r, i) => ({
      id: 'SR-' + String(3000 + idx * 10 + i),
      name: r.name, type: r.type, frequency: r.frequency,
      audience: r.audience,
      lastGenerated: '2026-04-' + String(1 + (i * 2 % 20)).padStart(2, '0'),
      sections: 5 + ((idx + i * 3) % 15),
      autoGenerated: i % 3 !== 2,
      status: i % 5 === 0 ? 'draft' : 'active',
      recipients: 3 + ((idx + i * 7) % 25),
      deliveryMethod: methods[i % methods.length]
    }));
    this._srTemplates = [
      {id: 'tmpl-1', name: 'Executive Summary Template', category: 'Executive', description: 'High-level security posture summary for leadership', variables: ['overallScore', 'criticalFindings', 'riskTrend', 'recommendations'], lastModified: '2026-03-15'},
      {id: 'tmpl-2', name: 'Incident Report Template', category: 'Incident', description: 'Detailed incident timeline and impact analysis', variables: ['incidentId', 'timeline', 'impact', 'rootCause', 'lessonsLearned'], lastModified: '2026-04-01'},
      {id: 'tmpl-3', name: 'Compliance Report Template', category: 'Compliance', description: 'Framework compliance status and gap analysis', variables: ['framework', 'controls', 'gaps', 'remediationPlan'], lastModified: '2026-03-20'},
      {id: 'tmpl-4', name: 'Technical Deep-Dive Template', category: 'Technical', description: 'Detailed technical findings and evidence', variables: ['findings', 'evidence', 'cvssScores', 'remediationSteps'], lastModified: '2026-04-05'},
    ];
  }

  private _srGetActiveReports(): number {
    return this._srReports.filter(r => r.status === 'active').length;
  }

  private _srGetAutoGeneratedRatio(): {auto: number; manual: number; ratio: number} {
    const auto = this._srReports.filter(r => r.autoGenerated).length;
    const manual = this._srReports.length - auto;
    return {auto, manual, ratio: Math.round(auto / this._srReports.length * 100)};
  }

  private _srGetReportSchedule(): Array<{name: string; frequency: string; nextRun: string; audience: string}> {
    return this._srReports.filter(r => r.status === 'active').slice(0, 6).map(r => ({
      name: r.name, frequency: r.frequency,
      nextRun: '2026-04-' + String(25 + (idx % 5)).padStart(2, '0'),
      audience: r.audience
    }));
  }

  private _srGetDistributionStats(): {totalRecipients: number; byMethod: Record<string, number>} {
    const byMethod: Record<string, number> = {};
    let total = 0;
    this._srReports.forEach(r => {
      total += r.recipients;
      byMethod[r.deliveryMethod] = (byMethod[r.deliveryMethod] || 0) + r.recipients;
    });
    return {totalRecipients: total, byMethod};
  }


  // === Security Architecture Review (Round 36 - Pass 4) ===

  private _sarComponents: Array<{id: string; name: string; type: string; layer: string;
    securityLevel: number; complianceScore: number; lastReview: string;
    reviewer: string; findings: number; criticalFindings: number;
    recommendations: string[]; status: string; technology: string}> = [];

  private _initSarReview() {
    const components = [
      {name: 'API Gateway', type: 'Perimeter', layer: 'Network', technology: 'Kong'},
      {name: 'Web Application Firewall', type: 'Perimeter', layer: 'Application', technology: 'AWS WAF'},
      {name: 'Identity Provider', type: 'Identity', layer: 'Authentication', technology: 'Okta'},
      {name: 'SIEM Platform', type: 'Detection', layer: 'Monitoring', technology: 'Splunk'},
      {name: 'EDR Solution', type: 'Endpoint', layer: 'Host', technology: 'CrowdStrike'},
      {name: 'Secrets Vault', type: 'Credential', layer: 'Application', technology: 'HashiCorp Vault'},
      {name: 'Container Registry', type: 'Container', layer: 'Infrastructure', technology: 'Harbor'},
      {name: 'Database Encryption', type: 'Encryption', layer: 'Data', technology: 'AES-256'},
      {name: 'Network Segmentation', type: 'Network', layer: 'Infrastructure', technology: 'VLAN/VXLAN'},
      {name: 'DLP Engine', type: 'Data Protection', layer: 'Application', technology: 'Symantec DLP'},
      {name: 'Patch Management', type: 'Vulnerability', layer: 'Host', technology: 'Qualys'},
      {name: 'Backup System', type: 'Recovery', layer: 'Infrastructure', technology: 'Veeam'},
    ];
    const reviewers = ['Sec Architect', 'Cloud Architect', 'Network Engineer', 'AppSec Lead', 'IAM Lead', 'SOC Manager'];
    this._sarComponents = components.map((c, i) => ({
      id: 'SAR-' + (400 + i),
      name: c.name, type: c.type, layer: c.layer, technology: c.technology,
      securityLevel: 60 + ((idx * 7 + i * 11) % 35),
      complianceScore: 55 + ((idx * 5 + i * 13) % 40),
      lastReview: '2026-0' + (1 + (i % 4)) + '-' + String(1 + (i * 3 % 20)).padStart(2, '0'),
      reviewer: reviewers[i % reviewers.length],
      findings: 2 + ((idx + i * 3) % 8),
      criticalFindings: i % 4 === 0 ? 1 + (idx % 2) : 0,
      recommendations: i % 3 === 0
        ? ['Upgrade to latest version', 'Implement additional monitoring', 'Review access controls']
        : ['Enhance logging', 'Update configuration', 'Add redundancy'],
      status: i % 5 === 0 ? 'needs-review' : 'compliant'
    }));
  }

  private _sarGetSecurityPosture(): {overall: number; byLayer: Record<string, number>; weakest: string; strongest: string} {
    const byLayer: Record<string, number> = {};
    this._sarComponents.forEach(c => {
      if (!byLayer[c.layer]) byLayer[c.layer] = [];
      byLayer[c.layer].push(c.securityLevel);
    });
    const layerScores: Record<string, number> = {};
    Object.entries(byLayer).forEach(([layer, scores]) => {
      layerScores[layer] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    });
    const overall = Math.round(this._sarComponents.reduce((s, c) => s + c.securityLevel, 0) / this._sarComponents.length);
    const entries = Object.entries(layerScores).sort((a, b) => a[1] - b[1]);
    return {overall, byLayer: layerScores, weakest: entries[0][0], strongest: entries[entries.length - 1][0]};
  }

  private _sarGetCriticalFindings(): Array<{component: string; title: string; severity: string; recommendation: string}> {
    return this._sarComponents.filter(c => c.criticalFindings > 0).map(c => ({
      component: c.name, title: 'Critical security gap identified',
      severity: 'critical',
      recommendation: c.recommendations[0]
    }));
  }

  private _sarGetComplianceGaps(): {totalFindings: number; criticalCount: number; avgCompliance: number} {
    return {
      totalFindings: this._sarComponents.reduce((s, c) => s + c.findings, 0),
      criticalCount: this._sarComponents.reduce((s, c) => s + c.criticalFindings, 0),
      avgCompliance: Math.round(this._sarComponents.reduce((s, c) => s + c.complianceScore, 0) / this._sarComponents.length)
    };
  }

  private _sarGetComponentMap(): Array<{name: string; type: string; layer: string; securityLevel: number; status: string}> {
    return this._sarComponents.map(c => ({
      name: c.name, type: c.type, layer: c.layer,
      securityLevel: c.securityLevel, status: c.status
    }));
  }



  // === Security Risk Register (metrics_kpi_) ===
  private _metrics_kpi_RiskRegister = [
    { id: "RSK-MET-0001", title: "Data breach from unpatched systems", owner: "CTO", category: "Financial", status: "mitigating", trend: "stable", severity: "critical", likelihood: 1, impact: 4, treatment: "Monitor and review quarterly", lastReview: "2026-04-19", nextReview: "2026-07-07" },
    { id: "RSK-MET-0002", title: "Ransomware attack on critical infrastructure", owner: "CRO", category: "Strategic", status: "closed", trend: "decreasing", severity: "medium", likelihood: 6, impact: 8, treatment: "Monitor and review quarterly", lastReview: "2026-04-10", nextReview: "2026-07-24" },
    { id: "RSK-MET-0003", title: "Insider threat data exfiltration", owner: "VP Eng", category: "Compliance", status: "accepted", trend: "increasing", severity: "high", likelihood: 2, impact: 3, treatment: "Monitor and review quarterly", lastReview: "2026-04-20", nextReview: "2026-07-14" },
    { id: "RSK-MET-0004", title: "Supply chain compromise", owner: "Security Lead", category: "Technical", status: "open", trend: "stable", severity: "high", likelihood: 8, impact: 8, treatment: "Monitor and review quarterly", lastReview: "2026-04-23", nextReview: "2026-07-28" },
    { id: "RSK-MET-0005", title: "Cloud misconfiguration exposure", owner: "Risk Mgr", category: "Reputational", status: "mitigating", trend: "decreasing", severity: "low", likelihood: 7, impact: 8, treatment: "Monitor and review quarterly", lastReview: "2026-04-06", nextReview: "2026-07-15" },
    { id: "RSK-MET-0006", title: "Phishing campaign success rate", owner: "Compliance Dir", category: "Legal", status: "closed", trend: "increasing", severity: "critical", likelihood: 6, impact: 4, treatment: "Monitor and review quarterly", lastReview: "2026-04-04", nextReview: "2026-07-19" },
    { id: "RSK-MET-0007", title: "Third-party vendor data breach", owner: "IT Dir", category: "Regulatory", status: "accepted", trend: "stable", severity: "medium", likelihood: 6, impact: 2, treatment: "Monitor and review quarterly", lastReview: "2026-04-21", nextReview: "2026-07-04" },
    { id: "RSK-MET-0008", title: "Regulatory non-compliance penalty", owner: "DevOps Lead", category: "Third-Party", status: "open", trend: "decreasing", severity: "critical", likelihood: 6, impact: 6, treatment: "Monitor and review quarterly", lastReview: "2026-04-05", nextReview: "2026-07-08" },
    { id: "RSK-MET-0009", title: "Zero-day exploit in production", owner: "Architect", category: "Human Capital", status: "mitigating", trend: "increasing", severity: "high", likelihood: 5, impact: 4, treatment: "Monitor and review quarterly", lastReview: "2026-04-04", nextReview: "2026-07-09" },
    { id: "RSK-MET-0010", title: "Insufficient access controls", owner: "CISO", category: "Operational", status: "closed", trend: "stable", severity: "critical", likelihood: 6, impact: 1, treatment: "Monitor and review quarterly", lastReview: "2026-04-05", nextReview: "2026-07-05" },
    { id: "RSK-MET-0011", title: "DDoS attack on services", owner: "CTO", category: "Financial", status: "accepted", trend: "decreasing", severity: "critical", likelihood: 8, impact: 7, treatment: "Monitor and review quarterly", lastReview: "2026-04-10", nextReview: "2026-07-16" },
    { id: "RSK-MET-0012", title: "Social engineering attack", owner: "CRO", category: "Strategic", status: "open", trend: "increasing", severity: "low", likelihood: 5, impact: 3, treatment: "Monitor and review quarterly", lastReview: "2026-04-11", nextReview: "2026-07-04" },
    { id: "RSK-MET-0013", title: "API security vulnerability", owner: "VP Eng", category: "Compliance", status: "mitigating", trend: "stable", severity: "medium", likelihood: 9, impact: 9, treatment: "Monitor and review quarterly", lastReview: "2026-04-23", nextReview: "2026-07-18" },
    { id: "RSK-MET-0014", title: "Mobile device compromise", owner: "Security Lead", category: "Technical", status: "closed", trend: "decreasing", severity: "medium", likelihood: 5, impact: 7, treatment: "Monitor and review quarterly", lastReview: "2026-04-19", nextReview: "2026-07-21" },
    { id: "RSK-MET-0015", title: "Physical security breach", owner: "Risk Mgr", category: "Reputational", status: "accepted", trend: "increasing", severity: "high", likelihood: 3, impact: 8, treatment: "Monitor and review quarterly", lastReview: "2026-04-04", nextReview: "2026-07-04" },
    { id: "RSK-MET-0016", title: "Password policy weakness", owner: "Compliance Dir", category: "Legal", status: "open", trend: "stable", severity: "low", likelihood: 8, impact: 10, treatment: "Monitor and review quarterly", lastReview: "2026-04-11", nextReview: "2026-07-14" },
    { id: "RSK-MET-0017", title: "Network segmentation gap", owner: "IT Dir", category: "Regulatory", status: "mitigating", trend: "decreasing", severity: "critical", likelihood: 5, impact: 5, treatment: "Monitor and review quarterly", lastReview: "2026-04-17", nextReview: "2026-07-22" },
    { id: "RSK-MET-0018", title: "Encryption key management failure", owner: "DevOps Lead", category: "Third-Party", status: "closed", trend: "increasing", severity: "critical", likelihood: 5, impact: 7, treatment: "Monitor and review quarterly", lastReview: "2026-04-13", nextReview: "2026-07-22" },
    { id: "RSK-MET-0019", title: "Audit trail tampering", owner: "Architect", category: "Human Capital", status: "accepted", trend: "stable", severity: "medium", likelihood: 7, impact: 7, treatment: "Monitor and review quarterly", lastReview: "2026-04-04", nextReview: "2026-07-17" },
    { id: "RSK-MET-0020", title: "Business email compromise", owner: "CISO", category: "Operational", status: "open", trend: "decreasing", severity: "medium", likelihood: 4, impact: 8, treatment: "Monitor and review quarterly", lastReview: "2026-04-18", nextReview: "2026-07-12" },
  ];
  private _metrics_kpi_RiskFilter: string = 'all';
  private _metrics_kpi_RiskSeverity: string = 'all';
  private _metrics_kpi_RiskStatus: string = 'all';
  private _metrics_kpi_ExpandedRisk: string = '';
  private _metrics_kpi_FilterRisks() {
    const reg = this._metrics_kpi_RiskRegister;
    return reg.filter(r => {
      if (this._metrics_kpi_RiskFilter !== "all" && r.category !== this._metrics_kpi_RiskFilter) return false;
      if (this._metrics_kpi_RiskSeverity !== "all" && r.severity !== this._metrics_kpi_RiskSeverity) return false;
      if (this._metrics_kpi_RiskStatus !== "all" && r.status !== this._metrics_kpi_RiskStatus) return false;
      return true;
    });
  }
  private _metrics_kpi_GetRiskScore(r: any) { return Math.round(r.likelihood * r.impact * 1.5); }
  private _metrics_kpi_GetRiskTrendIcon(trend: string) {
    if (trend === "increasing") return "\u2191";
    if (trend === "decreasing") return "\u2193";
    return "\u2192";
  }
  private _metrics_kpi_GetRiskColor(sev: string) {
    if (sev === "critical") return "#dc2626";
    if (sev === "high") return "#ea580c";
    if (sev === "medium") return "#d97706";
    return "#16a34a";
  }
  private _metrics_kpi_GetRiskCounts() {
    const reg = this._metrics_kpi_RiskRegister;
    return { total: reg.length, open: reg.filter(r=>r.status==="open").length, mitigating: reg.filter(r=>r.status==="mitigating").length, closed: reg.filter(r=>r.status==="closed").length, accepted: reg.filter(r=>r.status==="accepted").length, critical: reg.filter(r=>r.severity==="critical").length };
  }
  private _metrics_kpi_GetTreatmentProgress() {
    const reg = this._metrics_kpi_RiskRegister;
    const treated = reg.filter(r => r.status === "mitigating" || r.status === "closed").length;
    return Math.round((treated / Math.max(reg.length, 1)) * 100);
  }

  // === Security Metrics API Gateway (metrics_kpi_) ===
  private _metrics_kpi_ApiEndpoints = [
    { method: "GET", path: "/api/v1/threats", name: "Threat Intelligence Feed", status: "active", avgLatency: 374.9, reqPerMin: 2219.0, errorRate: 0.91, uptime: round(98.8836679541687,2), version: "v1.1.16" },
    { method: "POST", path: "/api/v1/scans/start", name: "Vulnerability Scanner", status: "active", avgLatency: 146.3, reqPerMin: 1083.0, errorRate: 0.43, uptime: round(99.58274349956288,2), version: "v3.7.1" },
    { method: "GET", path: "/api/v1/assets", name: "Asset Inventory", status: "active", avgLatency: 436.0, reqPerMin: 1793.0, errorRate: 1.73, uptime: round(95.64296055094431,2), version: "v2.4.8" },
    { method: "POST", path: "/api/v1/alerts", name: "Alert Management", status: "active", avgLatency: 168.2, reqPerMin: 1656.0, errorRate: 0.96, uptime: round(98.97705848994082,2), version: "v3.5.10" },
    { method: "GET", path: "/api/v1/compliance", name: "Compliance Status", status: "active", avgLatency: 425.4, reqPerMin: 413.0, errorRate: 1.16, uptime: round(98.91111194823773,2), version: "v3.6.12" },
    { method: "PUT", path: "/api/v1/policies", name: "Policy Engine", status: "active", avgLatency: 116.0, reqPerMin: 865.0, errorRate: 2.21, uptime: round(99.02720165819909,2), version: "v2.0.9" },
    { method: "GET", path: "/api/v1/incidents", name: "Incident Tracker", status: "active", avgLatency: 319.4, reqPerMin: 939.0, errorRate: 2.08, uptime: round(98.49081780658882,2), version: "v1.9.11" },
    { method: "POST", path: "/api/v1/forensics", name: "Forensics Collector", status: "degraded", avgLatency: 205.1, reqPerMin: 198.0, errorRate: 2.41, uptime: round(99.85468970524857,2), version: "v1.1.16" },
    { method: "GET", path: "/api/v1/risk/assess", name: "Risk Assessment", status: "active", avgLatency: 29.7, reqPerMin: 1649.0, errorRate: 0.07, uptime: round(95.82979729139691,2), version: "v1.4.17" },
    { method: "POST", path: "/api/v1/auth/verify", name: "Authentication", status: "active", avgLatency: 345.6, reqPerMin: 1250.0, errorRate: 0.7, uptime: round(96.01569412622554,2), version: "v3.2.7" },
    { method: "GET", path: "/api/v1/logs/audit", name: "Audit Log Query", status: "active", avgLatency: 343.7, reqPerMin: 1134.0, errorRate: 0.38, uptime: round(98.11132533924555,2), version: "v1.9.6" },
    { method: "PUT", path: "/api/v1/users/roles", name: "Role Management", status: "active", avgLatency: 246.2, reqPerMin: 470.0, errorRate: 1.39, uptime: round(98.40347586377928,2), version: "v1.7.0" },
    { method: "POST", path: "/api/v1/encrypt", name: "Encryption Service", status: "active", avgLatency: 250.7, reqPerMin: 1829.0, errorRate: 2.02, uptime: round(97.52375482265359,2), version: "v3.0.17" },
    { method: "GET", path: "/api/v1/network/topo", name: "Network Topology", status: "maintenance", avgLatency: 417.0, reqPerMin: 805.0, errorRate: 0.03, uptime: round(99.56868851484332,2), version: "v1.5.11" },
    { method: "DELETE", path: "/api/v1/sessions", name: "Session Manager", status: "active", avgLatency: 438.4, reqPerMin: 657.0, errorRate: 1.84, uptime: round(98.15253605297984,2), version: "v1.1.8" },
  ];
  private _metrics_kpi_ApiKeys = [
    { id: "ak-000001", name: "key-metr-001", created: "2026-04-01", lastUsed: "2026-04-10", status: "active", calls: 38414, rateLimit: 1000 },
    { id: "ak-000002", name: "key-metr-002", created: "2026-04-12", lastUsed: "2026-04-04", status: "revoked", calls: 22647, rateLimit: 500 },
    { id: "ak-000003", name: "key-metr-003", created: "2026-08-12", lastUsed: "2026-04-08", status: "active", calls: 45689, rateLimit: 1000 },
    { id: "ak-000004", name: "key-metr-004", created: "2026-02-12", lastUsed: "2026-04-22", status: "active", calls: 2863, rateLimit: 1000 },
    { id: "ak-000005", name: "key-metr-005", created: "2026-09-03", lastUsed: "2026-04-10", status: "active", calls: 15187, rateLimit: 1000 },
    { id: "ak-000006", name: "key-metr-006", created: "2026-01-05", lastUsed: "2026-04-09", status: "active", calls: 5109, rateLimit: 500 },
    { id: "ak-000007", name: "key-metr-007", created: "2026-06-14", lastUsed: "2026-04-02", status: "active", calls: 15656, rateLimit: 1000 },
    { id: "ak-000008", name: "key-metr-008", created: "2026-05-08", lastUsed: "2026-04-02", status: "active", calls: 22849, rateLimit: 500 },
  ];
  private _metrics_kpi_ApiHealthSummary() {
    const eps = this._metrics_kpi_ApiEndpoints;
    return { total: eps.length, active: eps.filter(e=>e.status==="active").length, degraded: eps.filter(e=>e.status==="degraded").length, maintenance: eps.filter(e=>e.status==="maintenance").length, avgLatency: round(eps.reduce((s,e)=>s+e.avgLatency,0)/eps.length,1), totalReqPerMin: round(eps.reduce((s,e)=>s+e.reqPerMin,0)), avgUptime: round(eps.reduce((s,e)=>s+e.uptime,0)/eps.length,2) };
  }
  private _metrics_kpi_GetApiByMethod(method: string) { return this._metrics_kpi_ApiEndpoints.filter(e=>e.method===method); }
  private _metrics_kpi_GetSlowEndpoints() { return this._metrics_kpi_ApiEndpoints.filter(e=>e.avgLatency>200).sort((a,b)=>b.avgLatency-a.avgLatency); }
  private _metrics_kpi_GetHighErrorEndpoints() { return this._metrics_kpi_ApiEndpoints.filter(e=>e.errorRate>1.0).sort((a,b)=>b.errorRate-a.errorRate); }

  // === Security Training Effectiveness (metrics_kpi_) ===
  private _metrics_kpi_TrainingModules = [
    { id: "TRN-001", name: "Security Fundamentals", completionRate: 63.2, avgScore: 57.0, behaviorChange: 74.3, enrolled: 336, completed: 187, duration: "99min", category: "mandatory" },
    { id: "TRN-002", name: "Phishing Awareness", completionRate: 81.2, avgScore: 62.1, behaviorChange: 61.0, enrolled: 469, completed: 433, duration: "48min", category: "mandatory" },
    { id: "TRN-003", name: "Social Engineering Defense", completionRate: 60.3, avgScore: 63.6, behaviorChange: 34.3, enrolled: 495, completed: 402, duration: "91min", category: "optional" },
    { id: "TRN-004", name: "Password Hygiene", completionRate: 58.5, avgScore: 58.2, behaviorChange: 72.6, enrolled: 375, completed: 326, duration: "15min", category: "mandatory" },
    { id: "TRN-005", name: "Data Classification", completionRate: 61.7, avgScore: 57.2, behaviorChange: 45.6, enrolled: 228, completed: 38, duration: "52min", category: "mandatory" },
    { id: "TRN-006", name: "Incident Response Basics", completionRate: 54.8, avgScore: 81.0, behaviorChange: 78.2, enrolled: 224, completed: 56, duration: "74min", category: "mandatory" },
    { id: "TRN-007", name: "Secure Coding", completionRate: 45.4, avgScore: 70.1, behaviorChange: 48.5, enrolled: 255, completed: 210, duration: "65min", category: "optional" },
    { id: "TRN-008", name: "Cloud Security", completionRate: 68.9, avgScore: 80.5, behaviorChange: 80.4, enrolled: 313, completed: 389, duration: "40min", category: "mandatory" },
    { id: "TRN-009", name: "Mobile Device Security", completionRate: 63.6, avgScore: 82.7, behaviorChange: 53.2, enrolled: 399, completed: 185, duration: "43min", category: "mandatory" },
    { id: "TRN-010", name: "Network Security", completionRate: 78.0, avgScore: 86.8, behaviorChange: 88.0, enrolled: 353, completed: 237, duration: "57min", category: "mandatory" },
    { id: "TRN-011", name: "Physical Security", completionRate: 77.0, avgScore: 82.3, behaviorChange: 59.7, enrolled: 205, completed: 153, duration: "87min", category: "optional" },
    { id: "TRN-012", name: "Regulatory Compliance", completionRate: 51.1, avgScore: 59.0, behaviorChange: 86.1, enrolled: 430, completed: 211, duration: "111min", category: "mandatory" },
    { id: "TRN-013", name: "Risk Management", completionRate: 52.5, avgScore: 78.4, behaviorChange: 72.0, enrolled: 374, completed: 104, duration: "95min", category: "mandatory" },
    { id: "TRN-014", name: "Cryptography Basics", completionRate: 97.9, avgScore: 71.1, behaviorChange: 72.8, enrolled: 298, completed: 394, duration: "85min", category: "mandatory" },
    { id: "TRN-015", name: "Access Control", completionRate: 79.9, avgScore: 76.5, behaviorChange: 89.5, enrolled: 159, completed: 126, duration: "94min", category: "optional" },
    { id: "TRN-016", name: "Vendor Management", completionRate: 61.3, avgScore: 68.5, behaviorChange: 33.6, enrolled: 244, completed: 349, duration: "60min", category: "mandatory" },
  ];
  private _metrics_kpi_PhishingResults = [
    { month: "2026-01", sent: 948, clicked: 113, reported: 76, clickRate: round(11.919831223628693,1), reportRate: round(8.016877637130802,1) },
    { month: "2026-02", sent: 785, clicked: 133, reported: 327, clickRate: round(16.94267515923567,1), reportRate: round(41.65605095541402,1) },
    { month: "2026-03", sent: 477, clicked: 40, reported: 190, clickRate: round(8.385744234800839,1), reportRate: round(39.83228511530398,1) },
    { month: "2026-04", sent: 621, clicked: 141, reported: 155, clickRate: round(22.705314009661837,1), reportRate: round(24.9597423510467,1) },
    { month: "2026-05", sent: 321, clicked: 89, reported: 40, clickRate: round(27.725856697819314,1), reportRate: round(12.461059190031152,1) },
    { month: "2026-06", sent: 900, clicked: 213, reported: 465, clickRate: round(23.666666666666668,1), reportRate: round(51.66666666666667,1) },
  ];
  private _metrics_kpi_TrainingROI = { totalInvestment: 67000, avgCostPerEmployee: 590, riskReductionPct: round(random.uniform(15,45),1), incidentReductionPct: round(random.uniform(10,35),1), complianceScoreGain: round(random.uniform(5,25),1) };
  private _metrics_kpi_LearningPaths = [
    { name: "Beginner Security Analyst", totalModules: 12, completedModules: 16, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 59, enrolled: 106 },
    { name: "Advanced Threat Hunter", totalModules: 20, completedModules: 9, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 76, enrolled: 142 },
    { name: "Security Architect", totalModules: 16, completedModules: 7, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 26, enrolled: 20 },
    { name: "Incident Responder", totalModules: 13, completedModules: 11, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 71, enrolled: 200 },
    { name: "Compliance Specialist", totalModules: 14, completedModules: 15, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 10, enrolled: 140 },
    { name: "DevSecOps Engineer", totalModules: 13, completedModules: 14, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 20, enrolled: 55 },
  ];
  private _metrics_kpi_GetOverallCompletion() {
    const mods = this._metrics_kpi_TrainingModules;
    return round(mods.reduce((s,m)=>s+m.completionRate,0)/mods.length,1);
  }
  private _metrics_kpi_GetTopPerformers() { return [...this._metrics_kpi_TrainingModules].sort((a,b)=>b.avgScore-a.avgScore).slice(0,5); }
  private _metrics_kpi_GetModulesNeedingAttention() { return this._metrics_kpi_TrainingModules.filter(m=>m.completionRate<70||m.avgScore<65); }

  // === Security Governance Framework (metrics_kpi_) ===
  private _metrics_kpi_GovBodies = [
    { name: "Security Steering Committee", members: 11, chair: "CISO", meetingFreq: "Weekly", lastMeeting: "2026-04-21", nextMeeting: "2026-05-10", quorum: 7 },
    { name: "Risk Management Board", members: 6, chair: "CTO", meetingFreq: "Bi-weekly", lastMeeting: "2026-04-17", nextMeeting: "2026-05-28", quorum: 6 },
    { name: "Data Governance Council", members: 7, chair: "CRO", meetingFreq: "Monthly", lastMeeting: "2026-04-04", nextMeeting: "2026-05-05", quorum: 8 },
    { name: "Compliance Oversight Board", members: 8, chair: "CDO", meetingFreq: "Monthly", lastMeeting: "2026-04-17", nextMeeting: "2026-05-03", quorum: 6 },
    { name: "Architecture Review Board", members: 15, chair: "VP Eng", meetingFreq: "Bi-weekly", lastMeeting: "2026-04-13", nextMeeting: "2026-05-19", quorum: 3 },
    { name: "Change Advisory Board", members: 11, chair: "CISO", meetingFreq: "Weekly", lastMeeting: "2026-04-02", nextMeeting: "2026-05-23", quorum: 4 },
    { name: "Incident Review Board", members: 6, chair: "CIO", meetingFreq: "As needed", lastMeeting: "2026-04-05", nextMeeting: "2026-05-09", quorum: 6 },
    { name: "Vendor Risk Committee", members: 11, chair: "CFO", meetingFreq: "Quarterly", lastMeeting: "2026-04-07", nextMeeting: "2026-05-16", quorum: 3 },
  ];
  private _metrics_kpi_Decisions = [
    { id: "DEC-0001", title: "Adopt zero-trust architecture framework", date: "2026-03-27", status: "approved", owner: "CISO" },
    { id: "DEC-0002", title: "Migrate to SIEM 2.0 platform", date: "2026-04-27", status: "implemented", owner: "CTO" },
    { id: "DEC-0003", title: "Implement DLP across all endpoints", date: "2026-01-10", status: "in-progress", owner: "Security Lead" },
    { id: "DEC-0004", title: "Mandate MFA for all external access", date: "2026-01-13", status: "pending", owner: "CRO" },
    { id: "DEC-0005", title: "Establish bug bounty program", date: "2026-04-26", status: "approved", owner: "VP Eng" },
    { id: "DEC-0006", title: "Deploy EDR solution enterprise-wide", date: "2026-04-12", status: "approved", owner: "CISO" },
    { id: "DEC-0007", title: "Conduct annual penetration testing", date: "2026-04-27", status: "implemented", owner: "CTO" },
    { id: "DEC-0008", title: "Implement network micro-segmentation", date: "2026-04-15", status: "in-progress", owner: "Security Lead" },
    { id: "DEC-0009", title: "Establish security champion program", date: "2026-02-16", status: "pending", owner: "CRO" },
    { id: "DEC-0010", title: "Migrate to passwordless authentication", date: "2026-02-08", status: "approved", owner: "VP Eng" },
  ];
  private _metrics_kpi_PolicyLifecycle = [
    { name: "Information Security Policy", version: "v3.1", status: "active", lastUpdated: "2026-03-18", nextReview: "2026-9-24", owner: "CISO" },
    { name: "Acceptable Use Policy", version: "v1.4", status: "active", lastUpdated: "2026-02-17", nextReview: "2026-9-01", owner: "Legal" },
    { name: "Data Retention Policy", version: "v2.0", status: "under-review", lastUpdated: "2026-01-13", nextReview: "2026-12-05", owner: "DPO" },
    { name: "Access Control Policy", version: "v1.0", status: "active", lastUpdated: "2026-04-11", nextReview: "2026-11-24", owner: "IAM Lead" },
    { name: "Incident Response Policy", version: "v2.5", status: "draft", lastUpdated: "2026-01-26", nextReview: "2026-11-12", owner: "IR Lead" },
    { name: "Business Continuity Plan", version: "v4.5", status: "active", lastUpdated: "2026-02-26", nextReview: "2026-11-05", owner: "BCP Mgr" },
    { name: "Vendor Management Policy", version: "v2.2", status: "active", lastUpdated: "2026-02-08", nextReview: "2026-7-23", owner: "Procurement" },
    { name: "Encryption Standard", version: "v1.0", status: "under-review", lastUpdated: "2026-01-09", nextReview: "2026-12-17", owner: "Security Arch" },
  ];
  private _metrics_kpi_GovMaturityScore = { overall: 4.1, riskManagement: 2.2, compliance: 2.9, incidentResponse: 3.8, awareness: 2.5, technology: 4.2 };
  private _metrics_kpi_GetPendingDecisions() { return this._metrics_kpi_Decisions.filter(d=>d.status==='pending'||d.status==='in-progress'); }
  private _metrics_kpi_GetActivePolicies() { return this._metrics_kpi_PolicyLifecycle.filter(p=>p.status==='active'); }
  private _metrics_kpi_GetEscalationPath() { return ["L1 Analyst","L2 Senior","Security Lead","CISO","Board"]; }

  // === Security Innovation Lab (metrics_kpi_) ===
  private _metrics_kpi_InnoProjects = [
    { id: "INN-001", name: "AI-Powered Threat Detection", description: "Machine learning models for real-time threat identification", status: "active", progress: 72, startDate: "2026-03-28", teamSize: 8, budget: 24821, milestones: 7, completedMilestones: 8 },
    { id: "INN-002", name: "Quantum-Resistant Cryptography", description: "Post-quantum encryption algorithm prototyping", status: "research", progress: 35, startDate: "2026-01-20", teamSize: 6, budget: 96893, milestones: 7, completedMilestones: 6 },
    { id: "INN-003", name: "Automated Red Teaming", description: "Autonomous penetration testing framework", status: "active", progress: 58, startDate: "2026-03-10", teamSize: 8, budget: 39759, milestones: 6, completedMilestones: 5 },
    { id: "INN-004", name: "Zero-Knowledge Authentication", description: "Privacy-preserving identity verification", status: "poc", progress: 88, startDate: "2026-01-15", teamSize: 6, budget: 177136, milestones: 8, completedMilestones: 4 },
    { id: "INN-005", name: "Blockchain Audit Trail", description: "Immutable security event logging", status: "active", progress: 45, startDate: "2026-03-15", teamSize: 6, budget: 165844, milestones: 7, completedMilestones: 9 },
    { id: "INN-006", name: "Behavioral Biometrics", description: "Continuous authentication via user behavior patterns", status: "research", progress: 22, startDate: "2026-03-22", teamSize: 4, budget: 132752, milestones: 7, completedMilestones: 9 },
    { id: "INN-007", name: "Deception Grid 2.0", description: "Advanced honeypot network with adaptive responses", status: "active", progress: 65, startDate: "2026-03-16", teamSize: 7, budget: 37327, milestones: 4, completedMilestones: 7 },
    { id: "INN-008", name: "Secure Enclave Integration", description: "Hardware-backed security for critical workloads", status: "poc", progress: 40, startDate: "2026-03-17", teamSize: 4, budget: 188738, milestones: 5, completedMilestones: 1 },
  ];
  private _metrics_kpi_TechEvaluations = [
    { name: "Rust for Security Tools", status: "evaluating", score: 5.8, recommendation: "Adopt", vendor: "Open Source" },
    { name: "eBPF for Runtime Detection", status: "completed", score: 4.8, recommendation: "Adopt", vendor: "AWS" },
    { name: "Confidential Computing", status: "planned", score: 7.4, recommendation: "Investigate", vendor: "Azure" },
    { name: "Homomorphic Encryption", status: "evaluating", score: 7.1, recommendation: "Pilot", vendor: "GCP" },
    { name: "SASE Architecture", status: "completed", score: 10.4, recommendation: "Adopt", vendor: "Multiple" },
    { name: "SOAR Platform 3.0", status: "planned", score: 7.1, recommendation: "Monitor", vendor: "Splunk" },
  ];
  private _metrics_kpi_CollaborationPartners = [
    { name: "MIT CSAIL", type: "Academic", projects: 5, status: "active" },
    { name: "Stanford Security Lab", type: "Academic", projects: 3, status: "active" },
    { name: "DARPA Cyber", type: "Government", projects: 4, status: "pending" },
    { name: "NIST", type: "Government", projects: 4, status: "active" },
    { name: "CISA", type: "Government", projects: 3, status: "active" },
    { name: "OWASP Foundation", type: "Non-profit", projects: 1, status: "active" },
    { name: "SANS Institute", type: "Training", projects: 4, status: "completed" },
    { name: "Cloud Security Alliance", type: "Industry", projects: 2, status: "active" },
  ];
  private _metrics_kpi_InnoMetrics = { totalProjects: 8, activeProjects: 4, avgTimeToValue: "103 days", pocSuccessRate: round(random.uniform(55,85),1), researchToProduction: round(random.uniform(20,50),1), innovationIndex: round(random.uniform(6.0,9.5),1) };
  private _metrics_kpi_GetProjectByStatus(status: string) { return this._metrics_kpi_InnoProjects.filter(p=>p.status===status); }
  private _metrics_kpi_GetTopEvaluations() { return [...this._metrics_kpi_TechEvaluations].sort((a,b)=>b.score-a.score).slice(0,3); }



  // === Compliance Dashboard Extension (metrics_kpi_) ===
  private _metrics_kpi_ComplianceFrameworks = [
    { name: "SOC 2 Type II", description: "Trust Services Criteria", totalControls: 5, implementedControls: 4, status: "partially-compliant", lastAudit: "2026-03-16", nextAudit: "2026-7-23", evidenceCount: 262 },
    { name: "ISO 27001", description: "Information Security Management", totalControls: 114, implementedControls: 99, status: "partially-compliant", lastAudit: "2026-02-08", nextAudit: "2026-11-19", evidenceCount: 137 },
    { name: "PCI DSS 4.0", description: "Payment Card Industry", totalControls: 12, implementedControls: 9, status: "compliant", lastAudit: "2026-03-22", nextAudit: "2026-10-02", evidenceCount: 309 },
    { name: "HIPAA", description: "Health Insurance Portability", totalControls: 18, implementedControls: 12, status: "compliant", lastAudit: "2026-02-15", nextAudit: "2026-11-18", evidenceCount: 82 },
    { name: "GDPR", description: "Data Protection Regulation", totalControls: 99, implementedControls: 82, status: "partially-compliant", lastAudit: "2026-02-07", nextAudit: "2026-9-17", evidenceCount: 278 },
    { name: "NIST CSF 2.0", description: "Cybersecurity Framework", totalControls: 6, implementedControls: 6, status: "non-compliant", lastAudit: "2026-01-13", nextAudit: "2026-12-14", evidenceCount: 274 },
    { name: "FedRAMP", description: "Federal Risk Authorization", totalControls: 15, implementedControls: 11, status: "non-compliant", lastAudit: "2026-03-14", nextAudit: "2026-9-28", evidenceCount: 304 },
    { name: "SOX", description: "Sarbanes-Oxley Compliance", totalControls: 8, implementedControls: 6, status: "in-review", lastAudit: "2026-03-10", nextAudit: "2026-9-06", evidenceCount: 374 },
    { name: "CIS Controls v8", description: "Center for Internet Security", totalControls: 18, implementedControls: 16, status: "partially-compliant", lastAudit: "2026-02-06", nextAudit: "2026-12-03", evidenceCount: 489 },
    { name: "COBIT 2019", description: "IT Governance Framework", totalControls: 40, implementedControls: 39, status: "compliant", lastAudit: "2026-01-25", nextAudit: "2026-9-25", evidenceCount: 156 },
  ];
  private _metrics_kpi_GetComplianceScore() {
    const fw = this._metrics_kpi_ComplianceFrameworks;
    return round(fw.reduce((s,f)=>s + (f.implementedControls/Math.max(f.totalControls,1))*100, 0) / fw.length, 1);
  }
  private _metrics_kpi_GetGaps() {
    return this._metrics_kpi_ComplianceFrameworks.filter(f => f.status !== "compliant");
  }
  private _metrics_kpi_AuditTrail = [
    { id: "AUD-0001", action: "Control tested", auditor: "Internal Audit", date: "2026-04-11", result: "pass", findings: 3 },
    { id: "AUD-0002", action: "Evidence collected", auditor: "External Auditor", date: "2026-04-12", result: "pass", findings: 5 },
    { id: "AUD-0003", action: "Gap identified", auditor: "Security Team", date: "2026-04-11", result: "fail", findings: 3 },
    { id: "AUD-0004", action: "Remediation completed", auditor: "Compliance Officer", date: "2026-04-10", result: "pass", findings: 5 },
    { id: "AUD-0005", action: "Policy updated", auditor: "IT Audit", date: "2026-04-13", result: "pass", findings: 2 },
    { id: "AUD-0006", action: "Training verified", auditor: "Risk Team", date: "2026-04-23", result: "pass", findings: 4 },
    { id: "AUD-0007", action: "Access reviewed", auditor: "QA Team", date: "2026-04-13", result: "pass", findings: 1 },
    { id: "AUD-0008", action: "Exception approved", auditor: "CISO Office", date: "2026-04-09", result: "conditional", findings: 0 },
    { id: "AUD-0009", action: "Risk accepted", auditor: "Board Audit", date: "2026-04-15", result: "pass", findings: 4 },
    { id: "AUD-0010", action: "Control enhanced", auditor: "Third Party", date: "2026-04-14", result: "pass", findings: 5 },
  ];

  // === Threat Intelligence Feed Extension (metrics_kpi_) ===
  private _metrics_kpi_ThreatActors = [
    { name: "APT-29", alias: "Cozy Bear", origin: "Russia", type: "Nation-State", severity: "high", lastActivity: "2026-04-13", targets: "Government", indicators: 489, ttps: 35 },
    { name: "APT-41", alias: "Double Dragon", origin: "China", type: "Nation-State", severity: "critical", lastActivity: "2026-04-19", targets: "Technology", indicators: 376, ttps: 41 },
    { name: "Lazarus Group", alias: "Hidden Cobra", origin: "North Korea", type: "Nation-State", severity: "critical", lastActivity: "2026-04-17", targets: "Manufacturing", indicators: 470, ttps: 14 },
    { name: "FIN7", alias: "Carbanak", origin: "Eastern Europe", type: "Financial", severity: "high", lastActivity: "2026-04-17", targets: "Technology", indicators: 366, ttps: 45 },
    { name: "Conti", alias: "Wizard Spider", origin: "Russia", type: "Ransomware", severity: "critical", lastActivity: "2026-04-21", targets: "Healthcare", indicators: 36, ttps: 30 },
    { name: "LockBit", alias: "LockBit Gang", origin: "Unknown", type: "Ransomware", severity: "high", lastActivity: "2026-04-13", targets: "Government", indicators: 330, ttps: 9 },
    { name: "Cl0p", alias: "Cl0p Team", origin: "Unknown", type: "Ransomware", severity: "high", lastActivity: "2026-04-06", targets: "Technology", indicators: 328, ttps: 16 },
    { name: "Sandworm", alias: "Unit 74455", origin: "Russia", type: "Nation-State", severity: "critical", lastActivity: "2026-04-13", targets: "Government", indicators: 258, ttps: 18 },
  ];
  private _metrics_kpi_IoCFeed = [
    { id: "ioc-000001", type: "ip", value: "7.9.83.35", confidence: 90, source: "STIX", firstSeen: "2026-04-06", lastSeen: "2026-04-12" },
    { id: "ioc-000002", type: "ip", value: "57.198.244.254", confidence: 40, source: "Mandiant", firstSeen: "2026-04-20", lastSeen: "2026-04-15" },
    { id: "ioc-000003", type: "ip", value: "134.117.76.87", confidence: 44, source: "STIX", firstSeen: "2026-04-18", lastSeen: "2026-04-12" },
    { id: "ioc-000004", type: "ip", value: "139.197.179.28", confidence: 41, source: "MISP", firstSeen: "2026-04-09", lastSeen: "2026-04-20" },
    { id: "ioc-000005", type: "ip", value: "57.99.252.167", confidence: 49, source: "CrowdStrike", firstSeen: "2026-04-10", lastSeen: "2026-04-21" },
    { id: "ioc-000006", type: "ip", value: "227.164.126.116", confidence: 93, source: "Mandiant", firstSeen: "2026-04-18", lastSeen: "2026-04-15" },
    { id: "ioc-000007", type: "ip", value: "138.252.166.39", confidence: 86, source: "MISP", firstSeen: "2026-04-15", lastSeen: "2026-04-07" },
    { id: "ioc-000008", type: "ip", value: "29.167.218.33", confidence: 44, source: "Mandiant", firstSeen: "2026-04-16", lastSeen: "2026-04-07" },
    { id: "ioc-000009", type: "ip", value: "121.246.103.142", confidence: 51, source: "STIX", firstSeen: "2026-04-12", lastSeen: "2026-04-08" },
    { id: "ioc-000010", type: "ip", value: "245.165.223.45", confidence: 83, source: "MISP", firstSeen: "2026-04-14", lastSeen: "2026-04-03" },
    { id: "ioc-000011", type: "ip", value: "211.65.242.80", confidence: 95, source: "AlienVault", firstSeen: "2026-04-17", lastSeen: "2026-04-14" },
    { id: "ioc-000012", type: "ip", value: "114.63.109.179", confidence: 92, source: "AlienVault", firstSeen: "2026-04-02", lastSeen: "2026-04-08" },
    { id: "ioc-000013", type: "ip", value: "173.149.45.235", confidence: 77, source: "MISP", firstSeen: "2026-04-21", lastSeen: "2026-04-05" },
    { id: "ioc-000014", type: "ip", value: "4.205.245.120", confidence: 55, source: "MISP", firstSeen: "2026-04-13", lastSeen: "2026-04-11" },
    { id: "ioc-000015", type: "ip", value: "35.244.51.204", confidence: 79, source: "AlienVault", firstSeen: "2026-04-09", lastSeen: "2026-04-19" },
  ];
  private _metrics_kpi_GetActiveThreats() { return this._metrics_kpi_ThreatActors.filter(a => a.severity === 'critical'); }
  private _metrics_kpi_GetThreatSummary() {
    const actors = this._metrics_kpi_ThreatActors;
    return { total: actors.length, critical: actors.filter(a=>a.severity==="critical").length, high: actors.filter(a=>a.severity==="high").length, nationState: actors.filter(a=>a.type==="Nation-State").length, ransomware: actors.filter(a=>a.type==="Ransomware").length };
  }

  // === Incident Management Extension (metrics_kpi_) ===
  private _metrics_kpi_Incidents = [
    { id: "INC-20260001", title: "Unauthorized access detected", severity: "critical", status: "open", assignedTo: "SOC L1", detectedAt: "2026-04-01T14:27", affectedAssets: 33, rootCause: "Misconfiguration" },
    { id: "INC-20260002", title: "Malware outbreak on workstation", severity: "high", status: "investigating", assignedTo: "SOC L2", detectedAt: "2026-04-08T17:43", affectedAssets: 4, rootCause: "Credential compromise" },
    { id: "INC-20260003", title: "Data leak from S3 bucket", severity: "medium", status: "contained", assignedTo: "IR Lead", detectedAt: "2026-04-13T08:13", affectedAssets: 6, rootCause: "Zero-day" },
    { id: "INC-20260004", title: "Phishing campaign targeting finance", severity: "low", status: "eradicated", assignedTo: "CISO", detectedAt: "2026-04-02T04:18", affectedAssets: 8, rootCause: "Human error" },
    { id: "INC-20260005", title: "DDoS attack on web services", severity: "critical", status: "recovered", assignedTo: "Security Eng", detectedAt: "2026-04-20T17:17", affectedAssets: 8, rootCause: "Policy violation" },
    { id: "INC-20260006", title: "Ransomware encryption attempt", severity: "high", status: "closed", assignedTo: "Forensics", detectedAt: "2026-04-19T09:58", affectedAssets: 12, rootCause: "Unknown" },
    { id: "INC-20260007", title: "Insider data exfiltration", severity: "medium", status: "open", assignedTo: "SOC L1", detectedAt: "2026-04-21T00:35", affectedAssets: 2, rootCause: "Misconfiguration" },
    { id: "INC-20260008", title: "API key exposure in repo", severity: "low", status: "investigating", assignedTo: "SOC L2", detectedAt: "2026-04-03T02:44", affectedAssets: 48, rootCause: "Credential compromise" },
    { id: "INC-20260009", title: "SQL injection on portal", severity: "critical", status: "contained", assignedTo: "IR Lead", detectedAt: "2026-04-13T05:16", affectedAssets: 41, rootCause: "Zero-day" },
    { id: "INC-20260010", title: "Brute force on VPN", severity: "high", status: "eradicated", assignedTo: "CISO", detectedAt: "2026-04-22T06:26", affectedAssets: 9, rootCause: "Human error" },
    { id: "INC-20260011", title: "Supply chain alert from vendor", severity: "medium", status: "recovered", assignedTo: "Security Eng", detectedAt: "2026-04-23T16:50", affectedAssets: 25, rootCause: "Policy violation" },
    { id: "INC-20260012", title: "Suspicious lateral movement", severity: "low", status: "closed", assignedTo: "Forensics", detectedAt: "2026-04-23T11:55", affectedAssets: 14, rootCause: "Unknown" },
  ];
  private _metrics_kpi_GetIncidentStats() {
    const inc = this._metrics_kpi_Incidents;
    return { total: inc.length, open: inc.filter(i=>i.status==="open").length, investigating: inc.filter(i=>i.status==="investigating").length, mttd: 8, mttr: 48 };
  }
  private _metrics_kpi_GetSeverityDistribution() {
    const inc = this._metrics_kpi_Incidents;
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

  // ===== ROUND 39: Security Attack Graph Visualization =====
  private _attackGraphNodes: Array<{id:string;label:string;type:string;riskLevel:string;compromised:boolean;defenses:number;description:string}> = [];
  private _attackGraphEdges: Array<{source:string;target:string;exploitability:number;technique:string;mitigation:string;active:boolean}> = [];
  private _attackGraphMetrics: {shortestPath:number;avgPathLength:number;criticalPaths:number;totalNodes:number;totalEdges:number;compromisedNodes:number;defendedNodes:number} = {shortestPath:0,avgPathLength:0,criticalPaths:0,totalNodes:0,totalEdges:0,compromisedNodes:0,defendedNodes:0};
  private _defensePlacementOptions: Array<{position:string;impact:number;cost:number;coverageIncrease:number;affectedEdges:number}> = [];

  private _initAttackGraphViz(): void {
    const nodeTypes = ['network','host','application','data','identity','cloud','iot','external'];
    const riskLevels = ['critical','high','medium','low'];
    const nodeLabels = ['Internet Gateway','DMZ Firewall','Web Server Farm','App Server Cluster','Database Tier','Admin Console','Identity Provider','Cloud API Gateway','Internal Network Switch','Employee Workstations','IoT Device Hub','Backup Server','Log Aggregator','CI/CD Pipeline','Third-Party API','Mobile Gateway'];
    const techniques = ['Spear Phishing','SQL Injection','Privilege Escalation','Lateral Movement','Credential Stuffing','DNS Tunneling','API Abuse','Supply Chain Compromise','Session Hijacking','Deserialization Attack'];
    const mitigations = ['Network Segmentation','Input Validation','Principle of Least Privilege','Zero Trust Architecture','MFA Enforcement','Encryption at Rest','WAF Rules','API Rate Limiting','Behavioral Analytics','Threat Intelligence Feed'];
    this._attackGraphNodes = nodeLabels.map((label, i) => ({
      id: 'NODE-' + String(i).padStart(3, '0'),
      label,
      type: nodeTypes[i % nodeTypes.length],
      riskLevel: riskLevels[Math.floor(Math.random() * riskLevels.length)],
      compromised: Math.random() > 0.8,
      defenses: Math.floor(Math.random() * 5),
      description: 'Security asset node in attack graph topology'
    }));
    const edges: Array<{source:string;target:string;exploitability:number;technique:string;mitigation:string;active:boolean}> = [];
    for (let i = 0; i < this._attackGraphNodes.length - 1; i++) {
      const edgeCount = Math.floor(Math.random() * 2) + 1;
      for (let j = 0; j < edgeCount; j++) {
        const target = Math.min(i + Math.floor(Math.random() * 3) + 1, this._attackGraphNodes.length - 1);
        if (i !== target) {
          edges.push({
            source: this._attackGraphNodes[i].id,
            target: this._attackGraphNodes[target].id,
            exploitability: Math.round((Math.random() * 10) * 10) / 10,
            technique: techniques[Math.floor(Math.random() * techniques.length)],
            mitigation: mitigations[Math.floor(Math.random() * mitigations.length)],
            active: Math.random() > 0.3
          });
        }
      }
    }
    this._attackGraphEdges = edges;
    const compromisedNodes = this._attackGraphNodes.filter(n => n.compromised).length;
    const defendedNodes = this._attackGraphNodes.filter(n => n.defenses > 2).length;
    this._attackGraphMetrics = {
      shortestPath: Math.floor(Math.random() * 4) + 2,
      avgPathLength: Math.round((Math.random() * 3 + 3) * 10) / 10,
      criticalPaths: Math.floor(Math.random() * 5) + 1,
      totalNodes: this._attackGraphNodes.length,
      totalEdges: this._attackGraphEdges.length,
      compromisedNodes,
      defendedNodes
    };
    this._defensePlacementOptions = Array.from({length: 10}, () => ({
      position: this._attackGraphNodes[Math.floor(Math.random() * this._attackGraphNodes.length)].label,
      impact: Math.round((Math.random() * 50 + 20) * 10) / 10,
      cost: Math.floor(Math.random() * 50000) + 5000,
      coverageIncrease: Math.round((Math.random() * 30 + 5) * 10) / 10,
      affectedEdges: Math.floor(Math.random() * 8) + 2
    }));
  }

  private _getCriticalAttackPaths(): Array<{path:string[];riskScore:number;techniques:string[];mitigations:string[]}> {
    const paths: Array<{path:string[];riskScore:number;techniques:string[];mitigations:string[]}> = [];
    const activeEdges = this._attackGraphEdges.filter(e => e.active);
    for (let i = 0; i < 3; i++) {
      const startNode = this._attackGraphNodes[0];
      const pathNodes = [startNode.id];
      let current = startNode.id;
      for (let step = 0; step < 4; step++) {
        const outgoing = activeEdges.filter(e => e.source === current);
        if (outgoing.length === 0) break;
        const next = outgoing[Math.floor(Math.random() * outgoing.length)].target;
        pathNodes.push(next);
        current = next;
      }
      const pathEdges = activeEdges.filter(e => pathNodes.includes(e.source) && pathNodes.includes(e.target));
      paths.push({
        path: pathNodes,
        riskScore: Math.round(pathEdges.reduce((s, e) => s + e.exploitability, 0) / pathEdges.length * 10) / 10,
        techniques: pathEdges.map(e => e.technique),
        mitigations: pathEdges.map(e => e.mitigation)
      });
    }
    return paths;
  }

  private _getExploitabilityHeatmap(): Array<{nodeId:string;inboundRisk:number;outboundRisk:number;compositeRisk:number}> {
    return this._attackGraphNodes.map(node => {
      const inboundEdges = this._attackGraphEdges.filter(e => e.target === node.id && e.active);
      const outboundEdges = this._attackGraphEdges.filter(e => e.source === node.id && e.active);
      const inboundRisk = inboundEdges.length > 0 ? Math.round(inboundEdges.reduce((s,e) => s + e.exploitability, 0) / inboundEdges.length * 10) / 10 : 0;
      const outboundRisk = outboundEdges.length > 0 ? Math.round(outboundEdges.reduce((s,e) => s + e.exploitability, 0) / outboundEdges.length * 10) / 10 : 0;
      return {nodeId: node.id, inboundRisk, outboundRisk, compositeRisk: Math.round((inboundRisk + outboundRisk) / 2 * 10) / 10};
    });
  }

  private _getGraphComparisonMetrics(): {beforeDefenses:{avgExploitability:number;criticalPaths:number} ;afterDefenses:{avgExploitability:number;criticalPaths:number};reductionPercent:number} {
    const beforeAvg = Math.round((this._attackGraphEdges.reduce((s,e) => s + e.exploitability, 0) / this._attackGraphEdges.length) * 10) / 10;
    return {
      beforeDefenses: {avgExploitability: beforeAvg, criticalPaths: this._attackGraphMetrics.criticalPaths},
      afterDefenses: {avgExploitability: Math.round(beforeAvg * 0.55 * 10) / 10, criticalPaths: Math.max(0, this._attackGraphMetrics.criticalPaths - 2)},
      reductionPercent: Math.round(45)
    };
  }



  private _securityResourceUtilization: Array<{resource:string;provider:string;type:string;allocatedCapacity:number;usedCapacity:number;utilizationPercent:number;costPerUnit:number;totalCost:number;trend:string;recommendation:string}> = [];
  private _securityBudgetVariance: Array<{category:string;budgeted:number;actual:number;variance:number;variancePercent:number;forecastRemaining:number;risk:string}> = [];
  private _licenseOptimizationData: Array<{product:string;vendor:string;totalLicenses:number;usedLicenses:number;unusedLicenses:number;costPerLicense:number;totalAnnualCost:number;renewalDate:string;recommendation:string}> = [];
  private _roiTrackingData: Array<{initiative:string;investedAmount:number;estimatedSaving:number;actualSaving:number;roiPercent:number;paybackMonths:number;status:string;startDate:string}> = [];

  private _initRound39ExtraResources(): void {
    const resources = ['WAF Instance','IDS/IPS Sensor','SIEM License','EDR Agent','DLP Endpoint','Cloud Firewall Rule','VPN Gateway','Certificate Manager','Secrets Vault','Container Scanner','API Gateway','DNS Security','Email Gateway','KMS Key','IAM Role'];
    const providers = ['AWS','Azure','GCP','On-Premise','Hybrid'];
    const types = ['compute','storage','network','license','service'];
    const categories = ['Network Security','Endpoint Protection','Cloud Security','Identity & Access','Data Protection','Compliance','Monitoring','Incident Response'];
    this._securityResourceUtilization = resources.map(resource => ({
      resource,
      provider: providers[Math.floor(Math.random() * providers.length)],
      type: types[Math.floor(Math.random() * types.length)],
      allocatedCapacity: Math.floor(Math.random() * 5000) + 1000,
      usedCapacity: Math.floor(Math.random() * 4000) + 500,
      utilizationPercent: Math.round((Math.random() * 60 + 20) * 10) / 10,
      costPerUnit: Math.round((Math.random() * 50 + 5) * 100) / 100,
      totalCost: Math.floor(Math.random() * 20000) + 1000,
      trend: Math.random() > 0.5 ? 'increasing' : 'stable',
      recommendation: 'Review utilization and adjust allocation based on actual usage patterns'
    }));
    this._securityBudgetVariance = categories.map(category => {
      const budgeted = Math.floor(Math.random() * 100000) + 20000;
      const actual = Math.floor(budgeted * (0.7 + Math.random() * 0.6));
      return {
        category, budgeted, actual,
        variance: actual - budgeted,
        variancePercent: Math.round((actual - budgeted) / budgeted * 1000) / 10,
        forecastRemaining: Math.floor(budgeted * (0.3 + Math.random() * 0.5)),
        risk: Math.abs(actual - budgeted) / budgeted > 0.2 ? 'high' : Math.abs(actual - budgeted) / budgeted > 0.1 ? 'medium' : 'low'
      };
    });
    this._licenseOptimizationData = Array.from({length: 12}, (_, i) => {
      const total = Math.floor(Math.random() * 500) + 50;
      const used = Math.floor(total * (0.4 + Math.random() * 0.5));
      return {
        product: 'Security Product ' + (i + 1),
        vendor: ['CrowdStrike','Palo Alto','Splunk','Fortinet','Check Point','Microsoft','Cisco','Trellix','Rapid7','Qualys','Tenable','Zscaler'][i],
        totalLicenses: total, usedLicenses: used, unusedLicenses: total - used,
        costPerLicense: Math.floor(Math.random() * 200) + 20,
        totalAnnualCost: Math.floor(Math.random() * 100000) + 10000,
        renewalDate: '2026-' + String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') + '-01',
        recommendation: total - used > total * 0.3 ? 'Consider reducing license count to match actual usage' : 'Current allocation is optimal'
      };
    });
    this._roiTrackingData = Array.from({length: 10}, (_, i) => ({
      initiative: 'Security Initiative ' + (i + 1),
      investedAmount: Math.floor(Math.random() * 200000) + 10000,
      estimatedSaving: Math.floor(Math.random() * 300000) + 50000,
      actualSaving: Math.floor(Math.random() * 250000) + 20000,
      roiPercent: Math.round((Math.random() * 200 - 50) * 10) / 10,
      paybackMonths: Math.floor(Math.random() * 24) + 3,
      status: ['on-track','ahead','behind','completed'][Math.floor(Math.random() * 4)],
      startDate: '2025-' + String(Math.floor(Math.random() * 12) + 1).padStart(2, '0') + '-01'
    }));
  }

  private _getTotalResourceCost(): number {
    return this._securityResourceUtilization.reduce((s, r) => s + r.totalCost, 0);
  }

  private _getUnderutilizedResources(): number {
    return this._securityResourceUtilization.filter(r => r.utilizationPercent < 40).length;
  }

  private _getTotalLicenseWaste(): number {
    return this._licenseOptimizationData.reduce((s, l) => s + l.unusedLicenses * l.costPerLicense, 0);
  }

  private _getBudgetHealthScore(): number {
    const variances = this._securityBudgetVariance.map(b => Math.abs(b.variancePercent));
    const avgVariance = variances.reduce((a, b) => a + b, 0) / variances.length;
    return Math.round(Math.max(0, 100 - avgVariance));
  }

  private _getTopROIInitiative(): string {
    if (this._roiTrackingData.length === 0) return 'N/A';
    return this._roiTrackingData.reduce((a, b) => a.roiPercent > b.roiPercent ? a : b).initiative;
  }

  private _getCostAnomalyCount(): number {
    return this._securityBudgetVariance.filter(b => b.risk === 'high').length;
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


  private _renderSecurityPostureScoring(): TemplateResult {
    const domains = [
      { name: 'Network Security', score: 82, trend: 'up', weight: 20 },
      { name: 'Endpoint Protection', score: 75, trend: 'stable', weight: 15 },
      { name: 'Identity & Access', score: 88, trend: 'up', weight: 20 },
      { name: 'Data Protection', score: 71, trend: 'down', weight: 15 },
      { name: 'Application Security', score: 79, trend: 'up', weight: 15 },
      { name: 'Cloud Security', score: 85, trend: 'stable', weight: 15 },
    ];
    const overallScore = Math.round(domains.reduce((s, d) => s + d.score * d.weight / 100, 0));
    const monthlyScores = [68, 72, 70, 74, 73, 76, 78, 77, 80, 79, 81, overallScore];
    const buScores = [
      { unit: 'Engineering', score: 84 }, { unit: 'Finance', score: 72 },
      { unit: 'HR', score: 68 }, { unit: 'Legal', score: 78 },
      { unit: 'Sales', score: 65 }, { unit: 'Operations', score: 81 },
    ];
    return html`<section class="section-card">
      <h3>Security Posture Scoring Engine</h3>
      <div class="score-overview">
        <div class="score-circle">${overallScore}</div>
        <span class="score-label">Overall Posture Score</span>
      </div>
      <div class="domain-scores">${domains.map(d => html`
        <div class="domain-row">
          <span class="domain-name">${d.name}</span>
          <div class="score-bar" style="width:${d.score}%"></div>
          <span class="score-value">${d.score}</span>
          <span class="trend-${d.trend}">${d.trend === 'up' ? '↑' : d.trend === 'down' ? '↓' : '→'}</span>
        </div>
      `)}</div>
      <div class="monthly-trend">${monthlyScores.map((s, i) => html`
        <div class="trend-bar" style="height:${s}%" title="Month ${i + 1}: ${s}"></div>
      `)}</div>
      <div class="bu-comparison">${buScores.map(bu => html`
        <div class="bu-row">
          <span>${bu.unit}</span>
          <div class="bu-bar" style="width:${bu.score}%"></div>
          <span>${bu.score}</span>
        </div>
      `)}</div>
    </section>`;
  }

  private _renderThreatActorProfiler(): TemplateResult {
    const actors = [
      { name: 'APT-29', sophistication: 'Advanced', targets: 'Government, Think Tanks', campaigns: 12, confidence: 92, pattern: 'Supply Chain' },
      { name: 'Lazarus Group', sophistication: 'Advanced', targets: 'Finance, Crypto', campaigns: 18, confidence: 95, pattern: 'Financial Theft' },
      { name: 'FIN7', sophistication: 'Advanced', targets: 'Retail, Hospitality', campaigns: 15, confidence: 88, pattern: 'POS Malware' },
      { name: 'DarkSide', sophistication: 'Moderate', targets: 'Critical Infrastructure', campaigns: 8, confidence: 78, pattern: 'Ransomware' },
      { name: 'APT-41', sophistication: 'Advanced', targets: 'Healthcare, Telecom', campaigns: 10, confidence: 85, pattern: 'Espionage' },
      { name: 'Conti', sophistication: 'Moderate', targets: 'Enterprise, Government', campaigns: 20, confidence: 90, pattern: 'Ransomware' },
      { name: 'Fancy Bear', sophistication: 'Advanced', targets: 'Government, Military', campaigns: 14, confidence: 91, pattern: 'Phishing' },
      { name: 'Sandworm', sophistication: 'Advanced', targets: 'Energy, Telecom', campaigns: 9, confidence: 87, pattern: 'Destructive' },
    ];
    return html`<section class="section-card">
      <h3>Threat Actor Profiler</h3>
      <div class="actor-grid">${actors.map(a => html`
        <div class="actor-card">
          <div class="actor-header">
            <strong>${a.name}</strong>
            <span class="sophistication ${a.sophistication.toLowerCase()}">${a.sophistication}</span>
          </div>
          <div class="actor-details">
            <p>Targets: ${a.targets}</p>
            <p>Campaigns: ${a.campaigns}</p>
            <p>Confidence: ${a.confidence}%</p>
            <p>Pattern: ${a.pattern}</p>
          </div>
        </div>
      `)}</div>
    </section>`;
  }

  private _renderControlTestingFramework(): TemplateResult {
    const tests = [
      { type: 'Access Control Review', status: 'passed', lastRun: '2026-04-15', findings: 0, coverage: 95 },
      { type: 'Firewall Rule Audit', status: 'passed', lastRun: '2026-04-10', findings: 2, coverage: 88 },
      { type: 'Encryption Verification', status: 'passed', lastRun: '2026-04-12', findings: 0, coverage: 100 },
      { type: 'Penetration Test', status: 'failed', lastRun: '2026-04-08', findings: 5, coverage: 72 },
      { type: 'Vulnerability Scan', status: 'warning', lastRun: '2026-04-14', findings: 12, coverage: 85 },
      { type: 'Configuration Audit', status: 'passed', lastRun: '2026-04-11', findings: 1, coverage: 91 },
      { type: 'Identity Review', status: 'passed', lastRun: '2026-04-09', findings: 3, coverage: 78 },
      { type: 'Data Classification', status: 'warning', lastRun: '2026-04-13', findings: 8, coverage: 65 },
      { type: 'Incident Response Drill', status: 'passed', lastRun: '2026-04-07', findings: 1, coverage: 90 },
      { type: 'Compliance Audit', status: 'passed', lastRun: '2026-04-06', findings: 0, coverage: 96 },
      { type: 'Log Review', status: 'passed', lastRun: '2026-04-14', findings: 2, coverage: 82 },
      { type: 'Physical Security', status: 'passed', lastRun: '2026-04-05', findings: 0, coverage: 100 },
    ];
    const totalFindings = tests.reduce((s, t) => s + t.findings, 0);
    const avgCoverage = Math.round(tests.reduce((s, t) => s + t.coverage, 0) / tests.length);
    return html`<section class="section-card">
      <h3>Control Testing Framework</h3>
      <div class="test-summary">
        <div class="summary-item"><span class="summary-value">${tests.length}</span><span class="summary-label">Test Types</span></div>
        <div class="summary-item"><span class="summary-value">${totalFindings}</span><span class="summary-label">Findings</span></div>
        <div class="summary-item"><span class="summary-value">${avgCoverage}%</span><span class="summary-label">Avg Coverage</span></div>
      </div>
      <div class="test-list">${tests.map(t => html`
        <div class="test-row status-${t.status}">
          <span class="test-type">${t.type}</span>
          <span class="test-status">${t.status.toUpperCase()}</span>
          <span class="test-findings">${t.findings} findings</span>
          <span class="test-coverage">${t.coverage}%</span>
          <span class="test-date">${t.lastRun}</span>
        </div>
      `)}</div>
    </section>`;
  }

  private _renderVulnCorrelationEngine(): TemplateResult {
    const correlations = [
      { vuln: 'CVE-2024-1234', source: 'NVD', exploitAvailable: true, exploitKit: 'Metasploit', age: 45, priority: 'Critical' },
      { vuln: 'CVE-2024-2345', source: 'GitHub Advisory', exploitAvailable: true, exploitKit: 'ExploitDB', age: 30, priority: 'High' },
      { vuln: 'CVE-2024-3456', source: 'NVD', exploitAvailable: false, exploitKit: 'N/A', age: 90, priority: 'Medium' },
      { vuln: 'CVE-2024-4567', source: 'Vendor', exploitAvailable: true, exploitKit: 'POC Available', age: 15, priority: 'Critical' },
      { vuln: 'CVE-2024-5678', source: 'OSS Index', exploitAvailable: false, exploitKit: 'N/A', age: 120, priority: 'Low' },
      { vuln: 'CVE-2024-6789', source: 'NVD', exploitAvailable: true, exploitKit: 'Dark Web', age: 7, priority: 'Critical' },
    ];
    const clusters = [
      { name: 'Authentication Bypass', vulns: 8, risk: 'High', affected: 23 },
      { name: 'XSS Family', vulns: 15, risk: 'Medium', affected: 45 },
      { name: 'Injection Cluster', vulns: 6, risk: 'High', affected: 18 },
      { name: 'Deserialization', vulns: 4, risk: 'Critical', affected: 12 },
    ];
    return html`<section class="section-card">
      <h3>Vulnerability Correlation Engine</h3>
      <div class="vuln-correlation-list">${correlations.map(c => html`
        <div class="vuln-row priority-${c.priority.toLowerCase()}">
          <span class="vuln-id">${c.vuln}</span>
          <span class="vuln-source">${c.source}</span>
          <span class="exploit-status">${c.exploitAvailable ? 'EXPLOITABLE' : 'No Exploit'}</span>
          <span class="exploit-kit">${c.exploitKit}</span>
          <span class="vuln-age">${c.age}d</span>
          <span class="vuln-priority">${c.priority}</span>
        </div>
      `)}</div>
      <h4>Vulnerability Clusters</h4>
      <div class="cluster-list">${clusters.map(c => html`
        <div class="cluster-row">
          <span>${c.name}</span>
          <span>${c.vulns} vulns</span>
          <span class="cluster-risk">${c.risk}</span>
          <span>${c.affected} assets</span>
        </div>
      `)}</div>
    </section>`;
  }

  private _renderIRPlaybook(): TemplateResult {
    const steps = [
      { step: 1, name: 'Detection & Alerting', sla: '15 min', owner: 'SOC L1', status: 'ready' },
      { step: 2, name: 'Initial Triage', sla: '30 min', owner: 'SOC L2', status: 'ready' },
      { step: 3, name: 'Containment', sla: '2 hours', owner: 'IR Lead', status: 'ready' },
      { step: 4, name: 'Investigation', sla: '24 hours', owner: 'Forensics', status: 'ready' },
      { step: 5, name: 'Eradication', sla: '48 hours', owner: 'IR Lead', status: 'ready' },
      { step: 6, name: 'Recovery', sla: '72 hours', owner: 'IT Ops', status: 'ready' },
      { step: 7, name: 'Communication', sla: 'Ongoing', owner: 'CISO', status: 'ready' },
      { step: 8, name: 'Post-Incident Review', sla: '5 days', owner: 'IR Lead', status: 'ready' },
    ];
    const playbooks = [
      { name: 'Ransomware Response', severity: 'Critical', lastUsed: '2026-03-15', effectiveness: 92 },
      { name: 'Data Breach Response', severity: 'Critical', lastUsed: '2026-02-28', effectiveness: 88 },
      { name: 'Phishing Attack', severity: 'High', lastUsed: '2026-04-01', effectiveness: 95 },
      { name: 'Insider Threat', severity: 'High', lastUsed: '2026-01-20', effectiveness: 82 },
      { name: 'DDoS Mitigation', severity: 'Medium', lastUsed: '2026-03-05', effectiveness: 90 },
      { name: 'Supply Chain Compromise', severity: 'Critical', lastUsed: '2026-04-10', effectiveness: 78 },
    ];
    return html`<section class="section-card">
      <h3>Incident Response Playbook</h3>
      <div class="ir-steps">${steps.map(s => html`
        <div class="ir-step">
          <div class="step-number">${s.step}</div>
          <div class="step-info">
            <span class="step-name">${s.name}</span>
            <span class="step-sla">SLA: ${s.sla}</span>
            <span class="step-owner">${s.owner}</span>
          </div>
        </div>
      `)}</div>
      <h4>Playbook Library</h4>
      <div class="playbook-list">${playbooks.map(p => html`
        <div class="playbook-row">
          <span>${p.name}</span>
          <span class="pb-severity">${p.severity}</span>
          <span>Last: ${p.lastUsed}</span>
          <span>Effectiveness: ${p.effectiveness}%</span>
        </div>
      `)}</div>
    </section>`;
  }


  // === Security Data Pipeline Health Monitor ===
  private _initMetricsKpiDashboardPipelineMonitor() {
    this._metrics_kpi_dashboardDataPipelines = [
      { id: 'pipe-1', name: 'Log Ingestion Pipeline', healthScore: 94, latencyMs: 230, freshnessMin: 5, errorRate: 0.02, throughputMbps: 450, status: 'healthy', lastChecked: '2026-04-23T17:00:00Z' },
      { id: 'pipe-2', name: 'Threat Intel Feed', healthScore: 87, latencyMs: 1200, freshnessMin: 15, errorRate: 0.05, throughputMbps: 12, status: 'healthy', lastChecked: '2026-04-23T16:55:00Z' },
      { id: 'pipe-3', name: 'Vulnerability Scanner Sync', healthScore: 72, latencyMs: 3500, freshnessMin: 60, errorRate: 0.15, throughputMbps: 8, status: 'degraded', lastChecked: '2026-04-23T16:50:00Z' },
      { id: 'pipe-4', name: 'SIEM Correlation Engine', healthScore: 91, latencyMs: 450, freshnessMin: 2, errorRate: 0.03, throughputMbps: 890, status: 'healthy', lastChecked: '2026-04-23T17:00:00Z' },
      { id: 'pipe-5', name: 'Compliance Evidence Collector', healthScore: 65, latencyMs: 5000, freshnessMin: 120, errorRate: 0.22, throughputMbps: 3, status: 'critical', lastChecked: '2026-04-23T16:30:00Z' },
      { id: 'pipe-6', name: 'Asset Inventory Sync', healthScore: 88, latencyMs: 800, freshnessMin: 30, errorRate: 0.04, throughputMbps: 25, status: 'healthy', lastChecked: '2026-04-23T16:58:00Z' },
      { id: 'pipe-7', name: 'Identity Provider Feed', healthScore: 95, latencyMs: 150, freshnessMin: 1, errorRate: 0.01, throughputMbps: 5, status: 'healthy', lastChecked: '2026-04-23T17:00:00Z' },
      { id: 'pipe-8', name: 'Cloud Security Posture', healthScore: 78, latencyMs: 2200, freshnessMin: 45, errorRate: 0.11, throughputMbps: 35, status: 'warning', lastChecked: '2026-04-23T16:45:00Z' }
    ];
    this._metrics_kpi_dashboardPipelineDependencies = this._buildMetricsKpiDashboardPipelineDeps();
    this._metrics_kpi_dashboardPipelineAlerts = this._checkMetricsKpiDashboardPipelineAnomalies();
  }

  private _buildMetricsKpiDashboardPipelineDeps(): Array<Record<string, unknown>> {
    return [
      { upstream: 'Identity Provider Feed', downstream: ['SIEM Correlation Engine', 'Compliance Evidence Collector'], coupling: 'tight', sla: '99.9%' },
      { upstream: 'Log Ingestion Pipeline', downstream: ['SIEM Correlation Engine', 'Cloud Security Posture'], coupling: 'tight', sla: '99.5%' },
      { upstream: 'Threat Intel Feed', downstream: ['SIEM Correlation Engine', 'Vulnerability Scanner Sync'], coupling: 'loose', sla: '99.0%' },
      { upstream: 'Asset Inventory Sync', downstream: ['Vulnerability Scanner Sync', 'Compliance Evidence Collector'], coupling: 'medium', sla: '99.5%' },
      { upstream: 'Cloud Security Posture', downstream: ['Compliance Evidence Collector'], coupling: 'medium', sla: '99.0%' }
    ];
  }

  private _checkMetricsKpiDashboardPipelineAnomalies(): Array<Record<string, unknown>> {
    return [
      { pipelineId: 'pipe-3', anomalyType: 'latency-spike', severity: 'warning', detectedAt: '2026-04-23T16:45:00Z', description: 'Vulnerability Scanner Sync latency exceeded 3x threshold', autoResolved: false },
      { pipelineId: 'pipe-5', anomalyType: 'error-rate-increase', severity: 'critical', detectedAt: '2026-04-23T16:30:00Z', description: 'Compliance Evidence Collector error rate above 20%', autoResolved: false },
      { pipelineId: 'pipe-8', anomalyType: 'freshness-degradation', severity: 'warning', detectedAt: '2026-04-23T16:40:00Z', description: 'Cloud Security Posture data stale by 45+ minutes', autoResolved: true },
      { pipelineId: 'pipe-2', anomalyType: 'throughput-drop', severity: 'info', detectedAt: '2026-04-23T16:20:00Z', description: 'Threat Intel Feed throughput dropped 15% during maintenance window', autoResolved: true }
    ];
  }

  private _calcMetricsKpiDashboardPipelineThroughputTrend(pipelineId: string): Array<number> {
    const baseThroughput = [450, 890, 12, 8, 3, 25, 5, 35];
    const idx = parseInt(pipelineId.replace('pipe-', '')) - 1;
    const base = baseThroughput[idx] || 100;
    return Array.from({ length: 24 }, (_, i) => Math.round(base * (0.85 + Math.random() * 0.3)));
  }


  // === Security Architecture Evolution Tracker ===
  private _initMetricsKpiDashboardArchEvolution() {
    this._metrics_kpi_dashboardArchComponents = [
      { componentId: 'arch-001', name: 'Zero Trust Network', version: '3.2', maturity: 'optimized', dependencies: 8, riskScore: 12, techDebt: 'low', lastReview: '2026-04-20', nextReview: '2026-07-20', owner: 'Network Arch' },
      { componentId: 'arch-002', name: 'Micro-segmentation Fabric', version: '2.1', maturity: 'managed', dependencies: 5, riskScore: 25, techDebt: 'medium', lastReview: '2026-04-15', nextReview: '2026-07-15', owner: 'Network Arch' },
      { componentId: 'arch-003', name: 'Cloud Security Broker', version: '4.0', maturity: 'optimized', dependencies: 12, riskScore: 8, techDebt: 'low', lastReview: '2026-04-22', nextReview: '2026-07-22', owner: 'Cloud Arch' },
      { componentId: 'arch-004', name: 'Identity Fabric', version: '2.5', maturity: 'managed', dependencies: 15, riskScore: 30, techDebt: 'medium', lastReview: '2026-04-18', nextReview: '2026-07-18', owner: 'Identity Arch' },
      { componentId: 'arch-005', name: 'Data Protection Suite', version: '3.0', maturity: 'defined', dependencies: 7, riskScore: 42, techDebt: 'high', lastReview: '2026-04-10', nextReview: '2026-07-10', owner: 'Data Arch' },
      { componentId: 'arch-006', name: 'SIEM/SOAR Platform', version: '5.1', maturity: 'optimized', dependencies: 20, riskScore: 15, techDebt: 'low', lastReview: '2026-04-21', nextReview: '2026-07-21', owner: 'SOC Arch' },
      { componentId: 'arch-007', name: 'Container Security Stack', version: '2.0', maturity: 'managed', dependencies: 6, riskScore: 28, techDebt: 'medium', lastReview: '2026-04-19', nextReview: '2026-07-19', owner: 'Platform Arch' },
      { componentId: 'arch-008', name: 'API Gateway Security', version: '3.5', maturity: 'managed', dependencies: 10, riskScore: 22, techDebt: 'low', lastReview: '2026-04-17', nextReview: '2026-07-17', owner: 'App Arch' },
      { componentId: 'arch-009', name: 'Secrets Management', version: '4.2', maturity: 'optimized', dependencies: 18, riskScore: 10, techDebt: 'low', lastReview: '2026-04-22', nextReview: '2026-07-22', owner: 'Security Eng' },
      { componentId: 'arch-010', name: 'Threat Intel Platform', version: '2.8', maturity: 'managed', dependencies: 9, riskScore: 20, techDebt: 'medium', lastReview: '2026-04-16', nextReview: '2026-07-16', owner: 'Threat Intel' }
    ];
    this._metrics_kpi_dashboardArchRoadmap = this._planMetricsKpiDashboardArchRoadmap();
    this._metrics_kpi_dashboardArchRiskSurface = this._mapMetricsKpiDashboardArchRiskSurface();
    this._metrics_kpi_dashboardArchTechDebt = this._assessMetricsKpiDashboardTechDebt();
    this._metrics_kpi_dashboardArchEvolutionTimeline = this._buildMetricsKpiDashboardEvolutionTimeline();
  }

  private _planMetricsKpiDashboardArchRoadmap(): Array<Record<string, unknown>> {
    return [
      { phase: 'Q2 2026', initiatives: ['Zero Trust Phase 3', 'CSPM Enhancement', 'Container Runtime Protection'], budget: 850000, status: 'in-progress', completion: 45 },
      { phase: 'Q3 2026', initiatives: ['SASE Deployment', 'AI-Driven Detection', 'Data Mesh Security'], budget: 1200000, status: 'planned', completion: 0 },
      { phase: 'Q4 2026', initiatives: ['Identity Federation', 'Quantum-Ready Crypto', 'XDR Integration'], budget: 950000, status: 'planned', completion: 0 },
      { phase: 'Q1 2027', initiatives: ['Autonomous SOC', 'Supply Chain Security', 'Zero Trust Phase 4'], budget: 1100000, status: 'planned', completion: 0 }
    ];
  }

  private _mapMetricsKpiDashboardArchRiskSurface(): Array<Record<string, unknown>> {
    return [
      { riskArea: 'External Attack Surface', attackVectors: 234, exposedServices: 12, shadowIT: 8, riskScore: 68, mitigationStatus: 'active' },
      { riskArea: 'Internal Lateral Movement', attackVectors: 89, exposedServices: 45, shadowIT: 3, riskScore: 42, mitigationStatus: 'monitored' },
      { riskArea: 'Cloud Misconfiguration', attackVectors: 156, exposedServices: 7, shadowIT: 15, riskScore: 55, mitigationStatus: 'active' },
      { riskArea: 'Third-Party Integration', attackVectors: 67, exposedServices: 23, shadowIT: 12, riskScore: 73, mitigationStatus: 'review-needed' },
      { riskArea: 'Data Exfiltration Path', attackVectors: 45, exposedServices: 5, shadowIT: 2, riskScore: 38, mitigationStatus: 'monitored' },
      { riskArea: 'Supply Chain Dependencies', attackVectors: 312, exposedServices: 34, shadowIT: 0, riskScore: 61, mitigationStatus: 'active' }
    ];
  }

  private _assessMetricsKpiDashboardTechDebt(): Array<Record<string, unknown>> {
    return this._metrics_kpi_dashboardArchComponents
      .filter((c: Record<string, unknown>) => String(c.techDebt) !== 'low')
      .map((c: Record<string, unknown>) => ({
        componentId: c.componentId, componentName: c.name, version: c.version,
        debtLevel: c.techDebt, debtItems: Math.floor(3 + Math.random() * 8),
        estimatedRemediation: `${Math.floor(2 + Math.random() * 6)} weeks`,
        remediationCost: Math.round(50000 + Math.random() * 200000),
        businessImpact: String(c.techDebt) === 'high' ? 'high' : 'medium',
        priority: String(c.techDebt) === 'high' ? 1 : String(c.techDebt) === 'medium' ? 2 : 3
      }))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.priority) - Number(b.priority));
  }

  private _buildMetricsKpiDashboardEvolutionTimeline(): Array<Record<string, unknown>> {
    return [
      { year: '2023', milestone: 'Security Baseline Established', components: 4, maturityAvg: 'initial', investment: 1200000 },
      { year: '2024', milestone: 'Zero Trust Phase 1', components: 6, maturityAvg: 'developing', investment: 1800000 },
      { year: '2025', milestone: 'Cloud-Native Security', components: 8, maturityAvg: 'defined', investment: 2200000 },
      { year: '2026', milestone: 'AI-Augmented Security', components: 10, maturityAvg: 'managed', investment: 2800000 },
      { year: '2027', milestone: 'Autonomous Defense Target', components: 12, maturityAvg: 'optimized', investment: 3200000 }
    ];
  }

  // === Security Design Patterns Library ===
  private _initMetricsKpiDashboardDesignPatterns() {
    this._metrics_kpi_dashboardDesignPatterns = [
      { patternId: 'dp-001', name: 'Defense in Depth', category: 'architectural', applicability: 95, implementation: 'deployed', controls: 12, layers: 5, reference: 'NIST SP 800-53' },
      { patternId: 'dp-002', name: 'Least Privilege Access', category: 'access-control', applicability: 98, implementation: 'partial', controls: 8, layers: 3, reference: 'NIST SP 800-53 AC-6' },
      { patternId: 'dp-003', name: 'Secure-by-Default', category: 'development', applicability: 90, implementation: 'deployed', controls: 15, layers: 4, reference: 'OWASP ASVS' },
      { patternId: 'dp-004', name: 'Zero Trust Architecture', category: 'architectural', applicability: 88, implementation: 'in-progress', controls: 20, layers: 6, reference: 'NIST SP 800-207' },
      { patternId: 'dp-005', name: 'Immutable Infrastructure', category: 'deployment', applicability: 75, implementation: 'partial', controls: 6, layers: 2, reference: 'CIS Benchmark' },
      { patternId: 'dp-006', name: 'Break-Glass Procedure', category: 'operations', applicability: 82, implementation: 'deployed', controls: 4, layers: 2, reference: 'ITIL v4' },
      { patternId: 'dp-007', name: 'Data Classification Matrix', category: 'data', applicability: 92, implementation: 'partial', controls: 10, layers: 3, reference: 'ISO 27001 A.8' },
      { patternId: 'dp-008', name: 'Threat Modeling Pipeline', category: 'development', applicability: 78, implementation: 'deployed', controls: 8, layers: 3, reference: 'STRIDE/Microsoft' },
      { patternId: 'dp-009', name: 'Micro-segmentation', category: 'network', applicability: 85, implementation: 'in-progress', controls: 14, layers: 4, reference: 'NIST SP 800-207' },
      { patternId: 'dp-010', name: 'Security Chaos Engineering', category: 'resilience', applicability: 65, implementation: 'planned', controls: 5, layers: 2, reference: 'Chaos Engineering' }
    ];
    this._metrics_kpi_dashboardPatternCompliance = this._assessMetricsKpiDashboardPatternCompliance();
    this._metrics_kpi_dashboardPatternGaps = this._identifyMetricsKpiDashboardPatternGaps();
  }

  private _assessMetricsKpiDashboardPatternCompliance(): Array<Record<string, unknown>> {
    return this._metrics_kpi_dashboardDesignPatterns.map((pat: Record<string, unknown>) => ({
      patternId: pat.patternId, patternName: pat.name,
      compliancePercent: String(pat.implementation) === 'deployed' ? 100 : String(pat.implementation) === 'in-progress' ? Math.round(40 + Math.random() * 40) : Math.round(10 + Math.random() * 30),
      controlCoverage: Math.round(Number(pat.controls) / 20 * 100),
      layerDepth: pat.layers, riskMitigation: Math.round(Number(pat.applicability) * 0.8),
      maturityLevel: String(pat.implementation) === 'deployed' ? 'level-4' : String(pat.implementation) === 'in-progress' ? 'level-3' : String(pat.implementation) === 'partial' ? 'level-2' : 'level-1'
    }));
  }

  private _identifyMetricsKpiDashboardPatternGaps(): Array<Record<string, unknown>> {
    return this._metrics_kpi_dashboardDesignPatterns
      .filter((p: Record<string, unknown>) => String(p.implementation) !== 'deployed')
      .map((p: Record<string, unknown>) => ({
        patternId: p.patternId, patternName: p.name, currentStatus: p.implementation,
        targetStatus: 'deployed', gapDescription: `${String(p.implementation)} implementation needs to reach deployed state`,
        estimatedEffort: `${Math.floor(2 + Math.random() * 8)} sprints`,
        dependencies: Math.floor(1 + Math.random() * 4), blockers: Math.floor(Math.random() * 3),
        priority: Number(p.applicability) > 85 ? 'high' : 'medium'
      }));
  }

  // === Security Capacity Planning Model ===
  private _initMetricsKpiDashboardCapacityPlanning() {
    this._metrics_kpi_dashboardCapacityModels = [
      { resourceId: 'cap-001', resourceType: 'SIEM EPS', currentCapacity: 50000, peakUsage: 42000, projectedGrowth: 0.15, threshold: 0.8, unit: 'events/sec', costPerUnit: 0.002 },
      { resourceId: 'cap-002', resourceType: 'Storage (Logs)', currentCapacity: 50, peakUsage: 38, projectedGrowth: 0.25, threshold: 0.75, unit: 'TB', costPerUnit: 120 },
      { resourceId: 'cap-003', resourceType: 'SOC Analysts', currentCapacity: 12, peakUsage: 10, projectedGrowth: 0.10, threshold: 0.85, unit: 'FTE', costPerUnit: 150000 },
      { resourceId: 'cap-004', resourceType: 'Vulnerability Scans', currentCapacity: 500, peakUsage: 380, projectedGrowth: 0.20, threshold: 0.80, unit: 'scans/day', costPerUnit: 0.5 },
      { resourceId: 'cap-005', resourceType: 'API Rate Limits', currentCapacity: 100000, peakUsage: 67000, projectedGrowth: 0.30, threshold: 0.70, unit: 'calls/min', costPerUnit: 0.0001 },
      { resourceId: 'cap-006', resourceType: 'Threat Hunt Sessions', currentCapacity: 20, peakUsage: 15, projectedGrowth: 0.15, threshold: 0.75, unit: 'sessions/week', costPerUnit: 500 },
      { resourceId: 'cap-007', resourceType: 'Incident Response', currentCapacity: 5, peakUsage: 3, projectedGrowth: 0.10, threshold: 0.60, unit: 'concurrent', costPerUnit: 50000 },
      { resourceId: 'cap-008', resourceType: 'Compliance Audits', currentCapacity: 4, peakUsage: 3, projectedGrowth: 0.05, threshold: 0.75, unit: 'audits/quarter', costPerUnit: 75000 }
    ];
    this._metrics_kpi_dashboardCapacityForecast = this._forecastMetricsKpiDashboardCapacity();
    this._metrics_kpi_dashboardCapacityAlerts = this._checkMetricsKpiDashboardCapacityAlerts();
  }

  private _forecastMetricsKpiDashboardCapacity(): Array<Record<string, unknown>> {
    return Array.from({ length: 6 }, (_, i) => ({
      period: `2026-${String(i + 7).padStart(2, '0')}`,
      projectedLoad: Math.round(70 + i * 5 + Math.random() * 10),
      availableCapacity: Math.round(85 + i * 2 + Math.random() * 5),
      riskOfExhaustion: Math.round(10 + i * 8 + Math.random() * 10),
      recommendation: i > 3 ? 'scale-up-recommended' : 'monitor',
      estimatedCost: Math.round(50000 + i * 15000 + Math.random() * 10000)
    }));
  }

  private _checkMetricsKpiDashboardCapacityAlerts(): Array<Record<string, unknown>> {
    return this._metrics_kpi_dashboardCapacityModels
      .filter((c: Record<string, unknown>) => Number(c.peakUsage) / Number(c.currentCapacity) > Number(c.threshold) * 0.9)
      .map((c: Record<string, unknown>) => ({
        resourceId: c.resourceId, resourceType: c.resourceType,
        utilization: Math.round(Number(c.peakUsage) / Number(c.currentCapacity) * 100),
        threshold: Math.round(Number(c.threshold) * 100),
        timeToExhaust: `${Math.round((1 - Number(c.peakUsage) / Number(c.currentCapacity)) / Number(c.projectedGrowth) * 12)} months`,
        action: 'scale-required', estimatedCost: Math.round(Number(c.currentCapacity) * Number(c.costPerUnit) * 1.5)
      }));
  }


  // === Risk Quantification & Scenario Analysis Engine ===
  private _initMetricsKpiDashboardRiskQuantification() {
    this._metrics_kpi_dashboardRiskScenarios = [
      { scenarioId: 'rs-001', name: 'Ransomware Attack on Core Systems', likelihood: 0.35, impactFinancial: 4500000, impactOperational: 72, impactReputational: 'high', affectedAssets: 45, recoveryTime: '5-10 days', currentControls: ['backups', 'edr', 'network-segmentation'], residualRisk: 'medium' },
      { scenarioId: 'rs-002', name: 'Data Breach via Third Party', likelihood: 0.25, impactFinancial: 8200000, impactOperational: 48, impactReputational: 'critical', affectedAssets: 120000, recoveryTime: '3-6 months', currentControls: ['vendor-assessment', 'dlp', 'contractual'], residualRisk: 'high' },
      { scenarioId: 'rs-003', name: 'Cloud Misconfiguration Exposure', likelihood: 0.55, impactFinancial: 1200000, impactOperational: 24, impactReputational: 'medium', affectedAssets: 15, recoveryTime: '1-3 days', currentControls: ['cspm', 'iam-policies', 'monitoring'], residualRisk: 'low' },
      { scenarioId: 'rs-004', name: 'Insider Data Theft', likelihood: 0.15, impactFinancial: 3500000, impactOperational: 36, impactReputational: 'high', affectedAssets: 80, recoveryTime: '2-4 weeks', currentControls: ['ueba', 'dap', 'access-controls'], residualRisk: 'medium' },
      { scenarioId: 'rs-005', name: 'Supply Chain Compromise', likelihood: 0.20, impactFinancial: 6800000, impactOperational: 96, impactReputational: 'critical', affectedAssets: 500, recoveryTime: '1-3 months', currentControls: ['sbom', 'code-review', 'vendor-monitoring'], residualRisk: 'high' },
      { scenarioId: 'rs-006', name: 'DDoS Attack on Public Services', likelihood: 0.45, impactFinancial: 800000, impactOperational: 12, impactReputational: 'medium', affectedAssets: 8, recoveryTime: '2-24 hours', currentControls: ['ddos-protection', 'cdn', 'rate-limiting'], residualRisk: 'low' },
      { scenarioId: 'rs-007', name: 'Zero-Day Exploit in Critical Software', likelihood: 0.10, impactFinancial: 5500000, impactOperational: 72, impactReputational: 'high', affectedAssets: 200, recoveryTime: '1-4 weeks', currentControls: ['virtual-patching', 'waf', 'isolation'], residualRisk: 'medium' },
      { scenarioId: 'rs-008', name: 'Business Email Compromise', likelihood: 0.40, impactFinancial: 2500000, impactOperational: 6, impactReputational: 'medium', affectedAssets: 5, recoveryTime: '1-5 days', currentControls: ['email-security', 'mfa', 'awareness-training'], residualRisk: 'low' }
    ];
    this._metrics_kpi_dashboardRiskQuantification = this._calcMetricsKpiDashboardFinancialRisk();
    this._metrics_kpi_dashboardScenarioHeatmap = this._buildMetricsKpiDashboardScenarioHeatmap();
    this._metrics_kpi_dashboardRiskMitigationPlans = this._generateMetricsKpiDashboardMitigationPlans();
    this._metrics_kpi_dashboardMonteCarloResults = this._runMetricsKpiDashboardMonteCarloSimulation();
  }

  private _calcMetricsKpiDashboardFinancialRisk(): Array<Record<string, unknown>> {
    return this._metrics_kpi_dashboardRiskScenarios.map((s: Record<string, unknown>) => ({
      scenarioId: s.scenarioId, scenarioName: s.name,
      annualizedLossExpectancy: Math.round(Number(s.likelihood) * Number(s.impactFinancial)),
      singleLossExpectancy: Number(s.impactFinancial),
      annualOccurrenceRate: Number(s.likelihood),
      riskTreatmentCost: Math.round(Number(s.impactFinancial) * 0.15),
      netRiskAfterTreatment: Math.round(Number(s.likelihood) * Number(s.impactFinancial) * 0.4),
      riskReductionPercent: Math.round(60 + Math.random() * 25),
      costBenefitRatio: Math.round((Number(s.likelihood) * Number(s.impactFinancial) * 0.6) / (Number(s.impactFinancial) * 0.15))
    })).sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(b.annualizedLossExpectancy) - Number(a.annualizedLossExpectancy));
  }

  private _buildMetricsKpiDashboardScenarioHeatmap(): Array<Record<string, unknown>> {
    return this._metrics_kpi_dashboardRiskScenarios.map((s: Record<string, unknown>) => ({
      scenarioId: s.scenarioId, scenarioName: s.name,
      likelihoodBand: Number(s.likelihood) >= 0.4 ? 'high' : Number(s.likelihood) >= 0.2 ? 'medium' : 'low',
      impactBand: Number(s.impactFinancial) >= 5000000 ? 'critical' : Number(s.impactFinancial) >= 2000000 ? 'high' : Number(s.impactFinancial) >= 500000 ? 'medium' : 'low',
      riskLevel: Number(s.likelihood) * Number(s.impactFinancial) >= 2000000 ? 'extreme' : Number(s.likelihood) * Number(s.impactFinancial) >= 500000 ? 'high' : 'medium',
      trend: Math.random() > 0.5 ? 'increasing' : 'stable',
      lastAssessed: '2026-04-22', nextReview: '2026-07-22'
    }));
  }

  private _generateMetricsKpiDashboardMitigationPlans(): Array<Record<string, unknown>> {
    return this._metrics_kpi_dashboardRiskScenarios.filter((s: Record<string, unknown>) => String(s.residualRisk) !== 'low').map((s: Record<string, unknown>) => ({
      scenarioId: s.scenarioId, scenarioName: s.name,
      currentResidualRisk: s.residualRisk, targetResidualRisk: 'low',
      mitigationActions: [
        { action: 'enhance-detection', effort: 'medium', cost: 150000, effectiveness: 0.35 },
        { action: 'add-preventive-control', effort: 'high', cost: 300000, effectiveness: 0.50 },
        { action: 'improve-response-playbook', effort: 'low', cost: 50000, effectiveness: 0.15 }
      ],
      totalMitigationBudget: 500000, estimatedRiskReduction: 0.65,
      implementationTimeline: 'Q3 2026', owner: 'CISO Office',
      priority: Number(s.impactFinancial) > 5000000 ? 'critical' : 'high'
    }));
  }

  private _runMetricsKpiDashboardMonteCarloSimulation(): Record<string, unknown> {
    const iterations = 10000;
    let totalLosses = 0;
    let maxLoss = 0;
    let minLoss = Infinity;
    const lossBuckets: Record<string, number> = { '0-500K': 0, '500K-1M': 0, '1M-5M': 0, '5M-10M': 0, '10M+': 0 };
    for (let i = 0; i < iterations; i++) {
      let annualLoss = 0;
      for (const s of this._metrics_kpi_dashboardRiskScenarios) {
        if (Math.random() < Number(s.likelihood)) {
          annualLoss += Number(s.impactFinancial) * (0.5 + Math.random() * 0.5);
        }
      }
      totalLosses += annualLoss;
      if (annualLoss > maxLoss) maxLoss = annualLoss;
      if (annualLoss < minLoss) minLoss = annualLoss;
      if (annualLoss < 500000) lossBuckets['0-500K']++;
      else if (annualLoss < 1000000) lossBuckets['500K-1M']++;
      else if (annualLoss < 5000000) lossBuckets['1M-5M']++;
      else if (annualLoss < 10000000) lossBuckets['5M-10M']++;
      else lossBuckets['10M+']++;
    }
    return {
      iterations, meanAnnualLoss: Math.round(totalLosses / iterations),
      maxLoss: Math.round(maxLoss), minLoss: Math.round(minLoss),
      lossBuckets, var95: Math.round(totalLosses / iterations * 2.1),
      var99: Math.round(totalLosses / iterations * 3.5),
      probabilityOfBreach: Math.round(this._metrics_kpi_dashboardRiskScenarios.reduce((s: number, r: Record<string, unknown>) => s + Number(r.likelihood), 0) * 100) / this._metrics_kpi_dashboardRiskScenarios.length
    };
  }

  // === Security Incident Cost Modeling ===
  private _initMetricsKpiDashboardIncidentCostModel() {
    this._metrics_kpi_dashboardIncidentCostCategories = [
      { category: 'Detection & Investigation', avgCost: 125000, minCost: 50000, maxCost: 500000, timeToComplete: '3-7 days', responsible: 'SOC Team', includes: ['forensic-analysis', 'evidence-collection', 'timeline-reconstruction'] },
      { category: 'Containment & Eradication', avgCost: 280000, minCost: 100000, maxCost: 1200000, timeToComplete: '1-5 days', responsible: 'IR Team', includes: ['system-isolation', 'malware-removal', 'patching'] },
      { category: 'Recovery & Restoration', avgCost: 350000, minCost: 150000, maxCost: 2000000, timeToComplete: '5-30 days', responsible: 'IT Operations', includes: ['system-restore', 'data-recovery', 'service-restoration'] },
      { category: 'Notification & Communication', avgCost: 180000, minCost: 50000, maxCost: 800000, timeToComplete: '1-3 days', responsible: 'Legal/Comms', includes: ['regulatory-notification', 'customer-communication', 'public-relations'] },
      { category: 'Legal & Regulatory', avgCost: 450000, minCost: 100000, maxCost: 5000000, timeToComplete: '3-12 months', responsible: 'Legal', includes: ['legal-fees', 'regulatory-fines', 'settlements'] },
      { category: 'Business Disruption', avgCost: 520000, minCost: 200000, maxCost: 3000000, timeToComplete: '1-30 days', responsible: 'Business Units', includes: ['lost-revenue', 'productivity-loss', 'opportunity-cost'] },
      { category: 'Post-Incident Hardening', avgCost: 200000, minCost: 75000, maxCost: 600000, timeToComplete: '1-6 months', responsible: 'Security Engineering', includes: ['control-improvements', 'tool-deployment', 'process-changes'] }
    ];
    this._metrics_kpi_dashboardTotalIncidentCost = this._metrics_kpi_dashboardIncidentCostCategories.reduce((s: number, c: Record<string, unknown>) => s + Number(c.avgCost), 0);
    this._metrics_kpi_dashboardCostBySeverity = this._modelMetricsKpiDashboardCostBySeverity();
  }

  private _modelMetricsKpiDashboardCostBySeverity(): Array<Record<string, unknown>> {
    return [
      { severity: 'low', avgTotalCost: 85000, responseTime: '2h', staffRequired: 3, historicalCount: 45, trend: 'stable' },
      { severity: 'medium', avgTotalCost: 350000, responseTime: '8h', staffRequired: 8, historicalCount: 18, trend: 'decreasing' },
      { severity: 'high', avgTotalCost: 1200000, responseTime: '24h', staffRequired: 15, historicalCount: 6, trend: 'stable' },
      { severity: 'critical', avgTotalCost: 4500000, responseTime: '1h', staffRequired: 30, historicalCount: 2, trend: 'increasing' }
    ];
  }

  render() {
    return html`${this.mkRenderRound17()}
      <div class="panel">
        <div class="pt">📊 Security Metrics & KPI Dashboard</div>

      ${this._showExport ? this._renderExportPanel() : nothing}
      ${this._renderPlaybook()}
      ${this._renderDecisionTree()}
      ${this._renderKPIs()}
      ${this._renderHeatmap()}
      <div style="background:#0f172a;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">MITRE ATT&CK References</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">
          ${this._mitreTechniques.map((t: string) => html`<span class="mitre-tag">${t}</span>`)}
        </div>
      </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Key Metrics Summary</div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Mean Time to Detect</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#22c55e">12min</div>              <div style="flex:1;font-size:10px;color:#6b7280">65% improvement</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Mean Time to Respond</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#22c55e">3.4h</div>              <div style="flex:1;font-size:10px;color:#6b7280">18% improvement</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Vuln SLA Compliance</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#22c55e">94%</div>              <div style="flex:1;font-size:10px;color:#6b7280">Above 90% target</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Phishing Resilience</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#3b82f6">92%</div>              <div style="flex:1;font-size:10px;color:#6b7280">8% improvement</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Patch Coverage</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#06b6d4">97%</div>              <div style="flex:1;font-size:10px;color:#6b7280">2% improvement</div>            </div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <div style="width:140px;font-weight:600;color:#94a3b8">Access Review Completion</div>              <div style="width:60px;font-weight:700;font-size:14px;color:#eab308">88%</div>              <div style="flex:1;font-size:10px;color:#6b7280">Below 95% target</div>            </div>
          </div>
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Security Insights</div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">MTTR improved by 18% this quarter, down from 4.2h to 3.4h average.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">Vulnerability remediation SLA compliance at 94%, up from 87%.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">Security awareness training completion rate exceeds 85% target.</span>            </div>
            <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937;font-size:11px">              <span style="color:#06b6d4;flex-shrink:0;margin-top:1px">&#8226;</span>              <span style="color:#94a3b8">Zero critical incidents in the last 30 days.</span>            </div>
          </div>
        </div>

        
        <div class="trend-chart">
          <div class="trend-title">Weekly Trend (Last 8 Weeks)</div>
          <div class="trend-line">
            ${this._trendData.map(d => html`<div class="trend-bar" style="height:${d.value}%;background:${d.color}"></div>`)}
          </div>
          <div class="trend-labels">
            ${this._trendData.map(d => html`<div class="trend-lbl">${d.label}</div>`)}
          </div>
        </div>
        <div class="breakdown">
          ${this._breakdownData.map(bd => html`
            <div class="bd-card">
              <div class="bd-card-title">${bd.title}</div>
              ${bd.items.map(item => html`
                <div class="bd-item">
                  <span class="bd-item-label">${item.label}</span>
                  <span class="bd-item-value" style="color:${item.color}">${item.value}</span>
                </div>
              `)}
            </div>
          `)}
        </div>
        <div class="activity-feed">
          <div class="af-title">Activity Feed</div>
          ${this._activityFeed.map(a => html`
            <div class="af-item">
              <span class="af-time">${a.time}</span>
              <span class="af-action">${a.action}</span>
              <span class="af-desc">${a.desc}</span>
              <span class="af-user">${a.user}</span>
            </div>
          `)}
        </div>
<div class="tabs">
          <span class="tab ${this._tab === 'overview' ? 'active' : ''}" @click=${() => { this._tab = 'overview'; this.requestUpdate(); }}>Overview</span>
          <span class="tab ${this._tab === 'vuln' ? 'active' : ''}" @click=${() => { this._tab = 'vuln'; this.requestUpdate(); }}>Vulnerabilities</span>
          <span class="tab ${this._tab === 'training' ? 'active' : ''}" @click=${() => { this._tab = 'training'; this.requestUpdate(); }}>Training</span>
          <span class="tab ${this._tab === 'compliance' ? 'active' : ''}" @click=${() => { this._tab = 'compliance'; this.requestUpdate(); }}>Compliance</span>
        </div>
        ${this._tab === 'overview' ? this._renderOverview() : ''}
        ${this._tab === 'vuln' ? this._renderVuln() : ''}
        ${this._tab === 'training' ? this._renderTraining() : ''}
        ${this._tab === 'compliance' ? this._renderCompliance() : ''}
      </div>
  
    .trend-chart { background: #1f2937; border-radius: 8px; padding: 12px; margin-bottom: 14px; }
    .trend-title { font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; }
    .trend-line { display: flex; align-items: flex-end; gap: 4px; height: 50px; }
    .trend-bar { flex: 1; border-radius: 2px 2px 0 0; min-width: 8px; transition: height 0.3s ease; }
    .trend-labels { display: flex; gap: 4px; margin-top: 4px; }
    .trend-lbl { flex: 1; font-size: 8px; color: #6b7280; text-align: center; }
    .breakdown { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 14px; }
    .bd-card { background: #0f172a; border-radius: 8px; padding: 10px; }
    .bd-card-title { font-size: 10px; color: #6b7280; margin-bottom: 6px; }
    .bd-item { display: flex; justify-content: space-between; align-items: center; padding: 3px 0; font-size: 11px; }
    .bd-item-label { color: #94a3b8; }
    .bd-item-value { font-weight: 700; }
    .activity-feed { background: #0f172a; border-radius: 8px; padding: 12px; margin-bottom: 14px; }
    .af-title { font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 8px; }
    .af-item { display: flex; gap: 8px; padding: 5px 0; border-bottom: 1px solid #1f2937; font-size: 11px; }
    .af-time { color: #6b7280; width: 50px; flex-shrink: 0; font-size: 10px; }
    .af-action { font-weight: 600; color: #06b6d4; width: 55px; flex-shrink: 0; }
    .af-desc { flex: 1; color: #94a3b8; }
    .af-user { color: #6b7280; font-size: 10px; }

  `;;
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
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Metrics Kpi Dashboard Findings Grid</span>
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
  @state() private _metScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _metScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _metScenarioCompare: boolean = false;
  @state() private _metScenarioSelected: string[] = [];

  private _metInitScenarios(): void {
    const saved = localStorage.getItem('met_scenarios');
    if (saved) { try { this._metScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._metScenarios.length === 0) {
      this._metScenarios = [
        {id:'met-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'met-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'met-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _metSaveScenarios(): void {
    localStorage.setItem('met_scenarios', JSON.stringify(this._metScenarios));
  }

  private _metAddScenario(): void {
    const f = this._metScenarioForm;
    if (!f.attackType || !f.target) return;
    this._metScenarios = [...this._metScenarios, {
      id: 'met-s' + (this._metScenarios.length + 1),
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
    this._metScenarioForm = {attackType:'',target:'',method:''};
    this._metSaveScenarios();
  }

  private _metRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._metScenarioCompare = !this._metScenarioCompare; }}>${this._metScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._metScenarioForm = {...this._metScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._metScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._metScenarioForm = {...this._metScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._metScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._metScenarioForm = {...this._metScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._metScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._metAddScenario}>Run Simulation</button>
      </div>
      ${this._metScenarioCompare && this._metScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._metScenarios.length)},1fr);gap:8px">
            ${this._metScenarios.slice(0,3).map(s => html`
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
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._metScenarios.length})</div>
        ${this._metScenarios.map(s => html`
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
  @state() private _metTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _metTrendZoom: {start:number;end:number} | null = null;
  @state() private _metTrendMA: number = 7;

  private _metInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._metTrendData = data;
  }

  private _metCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._metTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._metTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _metGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._metTrendData.map(d => d.value);
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

  private _metRenderTimeSeries(): any {
    const stats = this._metGetStats();
    const filtered = this._metTrendZoom ? this._metTrendData.filter(d => d.day >= this._metTrendZoom.start && d.day <= this._metTrendZoom.end) : this._metTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._metTrendMA === 7 ? 'active' : ''}" @click=${() => { this._metTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._metTrendMA === 30 ? 'active' : ''}" @click=${() => { this._metTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._metTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._metTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
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
  @state() private _metRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _metActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _metPermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _metPermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _metPermCompare: string[] = [];

  private _metInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._metRoles) {
      perms[role] = {};
      this._metActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._metPermissions = perms;
  }

  private _metTogglePermission(role: string, action: string): void {
    const old = this._metPermissions[role][action];
    this._metPermissions = {...this._metPermissions, [role]: {...this._metPermissions[role], [action]: !old}};
    this._metPermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _metRenderRBAC(): any {
    const compareRoles = this._metPermCompare.map(r => this._metPermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._metRoles.map(r => html`
              <button class="tab ${this._metPermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._metPermCompare = this._metPermCompare.includes(r) ? this._metPermCompare.filter(x => x !== r) : [...this._metPermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._metActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._metRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._metActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._metPermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._metTogglePermission(role, action)}>${this._metPermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._metPermCompare.join(' vs ')}</div>
            ${this._metActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._metPermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._metPermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._metPermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _metReportTemplate: string = 'executive';
  @state() private _metReportSchedule: string = 'weekly';
  @state() private _metReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _metReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _metGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._metReportHistory.unshift({id,template:this._metReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _metRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._metReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._metReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._metReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._metReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._metReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._metReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._metGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._metReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._metReportHistory.slice(0,3).map(r => html`
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
  @state() private _metHighContrast: boolean = false;
  @state() private _metA11yAnnounce: string = '';
  @state() private _metShortcutsVisible: boolean = false;
  @state() private _metFocusTrap: boolean = false;

  private _metShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _metHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._metFocusTrap) { this._metFocusTrap = false; this._metAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._metHighContrast = !this._metHighContrast; this._metAnnounce('High contrast ' + (this._metHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._metShortcutsVisible = !this._metShortcutsVisible; }
  }

  private _metAnnounce(msg: string): void {
    this._metA11yAnnounce = msg;
    setTimeout(() => { this._metA11yAnnounce = ''; }, 2000);
  }

  private _metRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._metShortcutsVisible ? 'active' : ''}" @click=${() => { this._metShortcutsVisible = !this._metShortcutsVisible; }} aria-expanded=${this._metShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._metHighContrast} @change=${() => { this._metHighContrast = !this._metHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._metShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._metShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._metA11yAnnounce}</div>
      </div>
    `;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.mkInitRound17();
    this._initThreatModel();
    this._initPipeline();
    this._initPlaybooks();
    this._initMetrics();
    this._initIntegration();
    this._metInitScenarios();
    this._metInitTrendData();
    this._metInitPermissions();
    document.addEventListener('keydown', this._metHandleKeydown.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._metHandleKeydown.bind(this));
  }

  // === TAB INTEGRATION FOR EXTENDED FEATURES ===
  @state() private _metActiveSubTab: string = 'scenario';



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
        { id: 't4', name: 'Data injection in executive reporting', stride: 'T', likelihood: 7, impact: 8, dreadScore: 7.0, status: 'open', mitigations: ['Input validation', 'WAF rules'], assignedTo: 'Dev Team', discoveredDate: '2024-01-08', lastReviewed: '2024-02-10' },
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

  private _metGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _metRenderSubPanel(): any {
    switch (this._metActiveSubTab) {
      case 'scenario': return this._metRenderScenarioEngine();
      case 'timeseries': return this._metRenderTimeSeries();
      case 'rbac': return this._metRenderRBAC();
      case 'reporting': return this._metRenderReporting();
      case 'a11y': return this._metRenderAccessibility();
      default: return nothing;
    }
  }

  private _metRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._metGetAllSubTabs().map(t => html`
          <button class="tab ${this._metActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._metActiveSubTab = t.key; }} role="tab" aria-selected=${this._metActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="met-tab-${this._metActiveSubTab}">
        ${this._metRenderSubPanel()}
      </div>
    `;
  }

  
  // Register new subtabs for extended sections
  private _mkdGetNewSubTabs(): {key:string;label:string}[] {
    return [
      { key: 'analytics', label: 'Analytics' },
      { key: 'incident-coord', label: 'IR Coordination' },
      { key: 'metrics-corr', label: 'Metrics Correlation' },
      { key: 'api-gateway', label: 'API Gateway' },
      { key: 'perf-opt', label: 'Performance' },
    ];
  }

  // ========== Section A: Advanced Analytics Engine ==========
  @state() private _mkdBayesianPrior: number = 0.5;
  @state() private _mkdBayesianLikelihood: number = 0.7;
  @state() private _mkdMonteCarloResults: number[] = [];
  @state() private _mkdCorrelationMatrix: number[][] = [];
  @state() private _mkdOutlierIndices: number[] = [];
  @state() private _mkdTrendComponents: {trend:number;seasonal:number;residual:number}[] = [];
  @state() private _mkdAnalyticsView: string = 'bayesian';
  @state() private _mkdConfidenceLevel: number = 95;
  @state() private _mkdMonteCarloIterations: number = 100;

  private _mkdCalculateBayesianPosterior(): number {
    const prior = this._mkdBayesianPrior;
    const likelihood = this._mkdBayesianLikelihood;
    const falsePositiveRate = 1 - likelihood;
    const marginal = prior * likelihood + (1 - prior) * falsePositiveRate;
    return marginal > 0 ? (prior * likelihood) / marginal : 0;
  }

  private _mkdRunMonteCarloSimulation(): number[] {
    const results: number[] = [];
    const baseRisk = 0.35;
    const volatility = 0.15;
    for (let i = 0; i < this._mkdMonteCarloIterations; i++) {
      let cumulative = baseRisk;
      for (let j = 0; j < 12; j++) {
        const shock = (Math.random() - 0.5) * 2 * volatility;
        cumulative = Math.max(0, Math.min(1, cumulative + shock * 0.1));
      }
      results.push(cumulative);
    }
    this._mkdMonteCarloResults = results;
    return results;
  }

  private _mkdComputeCorrelationMatrix(): number[][] {
    const events = this._mkdGenerateMockTimeSeries(6, 50);
    const n = events.length;
    const matrix: number[][] = [];
    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        row.push(this._mkdPearsonCorrelation(events[i], events[j]));
      }
      matrix.push(row);
    }
    this._mkdCorrelationMatrix = matrix;
    return matrix;
  }

  private _mkdPearsonCorrelation(x: number[], y: number[]): number {
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

  private _mkdDetectOutliersZScore(data: number[]): number[] {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const std = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length);
    const threshold = 2.0;
    return data.map((v, i) => Math.abs((v - mean) / (std || 1)) > threshold ? i : -1).filter(i => i >= 0);
  }

  private _mkdDetectOutliersIQR(data: number[]): number[] {
    const sorted = [...data].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    return data.map((v, i) => v < lower || v > upper ? i : -1).filter(i => i >= 0);
  }

  private _mkdDecomposeTrend(data: number[]): {trend:number;seasonal:number;residual:number}[] {
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
    this._mkdTrendComponents = result;
    return result;
  }

  private _mkdPredictiveScoreWithCI(data: number[]): {score:number;low:number;high:number} {
    const recent = data.slice(-10);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const std = Math.sqrt(recent.reduce((a, b) => a + (b - avg) ** 2, 0) / recent.length);
    const zScore = this._mkdConfidenceLevel === 99 ? 2.576 : this._mkdConfidenceLevel === 90 ? 1.645 : 1.96;
    return { score: avg, low: avg - zScore * std, high: avg + zScore * std };
  }

  private _mkdGenerateMockTimeSeries(count: number, length: number): number[][] {
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

  private _mkdRenderAnalyticsEngine(): any {
    const posterior = this._mkdCalculateBayesianPosterior();
    const mcResults = this._mkdMonteCarloResults.length > 0 ? this._mkdMonteCarloResults : this._mkdRunMonteCarloSimulation();
    const mcAvg = mcResults.reduce((a, b) => a + b, 0) / mcResults.length;
    const mcP95 = [...mcResults].sort((a, b) => a - b)[Math.floor(mcResults.length * 0.95)];
    const matrix = this._mkdCorrelationMatrix.length > 0 ? this._mkdCorrelationMatrix : this._mkdComputeCorrelationMatrix();
    const labels = ['Vulns', 'Incidents', 'Phishing', 'Access', 'Compliance', 'Training'];
    return html`
      <div class="analytics-engine" style="padding:12px">
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <button class="tab ${this._mkdAnalyticsView === 'bayesian' ? 'active' : ''}" @click=${() => { this._mkdAnalyticsView = 'bayesian'; }}>Bayesian</button>
          <button class="tab ${this._mkdAnalyticsView === 'montecarlo' ? 'active' : ''}" @click=${() => { this._mkdAnalyticsView = 'montecarlo'; }}>Monte Carlo</button>
          <button class="tab ${this._mkdAnalyticsView === 'correlation' ? 'active' : ''}" @click=${() => { this._mkdAnalyticsView = 'correlation'; }}>Correlation</button>
          <button class="tab ${this._mkdAnalyticsView === 'outliers' ? 'active' : ''}" @click=${() => { this._mkdAnalyticsView = 'outliers'; }}>Outliers</button>
          <button class="tab ${this._mkdAnalyticsView === 'trend' ? 'active' : ''}" @click=${() => { this._mkdAnalyticsView = 'trend'; }}>Trend</button>
          <button class="tab ${this._mkdAnalyticsView === 'predictive' ? 'active' : ''}" @click=${() => { this._mkdAnalyticsView = 'predictive'; }}>Predictive</button>
        </div>
        ${this._mkdAnalyticsView === 'bayesian' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Bayesian Risk Probability</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              <div><span style="color:#888">Prior:</span> ${this._mkdBayesianPrior.toFixed(2)}</div>
              <div><span style="color:#888">Likelihood:</span> ${this._mkdBayesianLikelihood.toFixed(2)}</div>
              <div><span style="color:#888">Posterior:</span> <strong style="color:${posterior > 0.6 ? '#f44' : '#4f4'}">${posterior.toFixed(4)}</strong></div>
              <div><span style="color:#888">Risk Level:</span> ${posterior > 0.7 ? 'Critical' : posterior > 0.5 ? 'High' : posterior > 0.3 ? 'Medium' : 'Low'}</div>
            </div>
            <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
              <label style="color:#888;font-size:12px">Prior:</label>
              <input type="range" min="0" max="100" .value=${String(this._mkdBayesianPrior * 100)} @input=${(e: any) => { this._mkdBayesianPrior = Number(e.target.value) / 100; }} style="flex:1" />
              <label style="color:#888;font-size:12px">Likelihood:</label>
              <input type="range" min="0" max="100" .value=${String(this._mkdBayesianLikelihood * 100)} @input=${(e: any) => { this._mkdBayesianLikelihood = Number(e.target.value) / 100; }} style="flex:1" />
            </div>
          </div>
        ` : nothing}
        ${this._mkdAnalyticsView === 'montecarlo' ? html`
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
            <button class="btn" style="margin-top:8px" @click=${() => { this._mkdRunMonteCarloSimulation(); }}>Re-run Simulation</button>
          </div>
        ` : nothing}
        ${this._mkdAnalyticsView === 'correlation' ? html`
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
        ${this._mkdAnalyticsView === 'outliers' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Statistical Outlier Detection</h4>
            ${['zscore', 'iqr'].map(method => {
              const data = this._mkdGenerateMockTimeSeries(1, 30)[0];
              const outliers = method === 'zscore' ? this._mkdDetectOutliersZScore(data) : this._mkdDetectOutliersIQR(data);
              return html`<div style="margin-bottom:8px">
                <div style="color:#aaa;font-size:12px">${method === 'zscore' ? 'Z-Score Method' : 'IQR Method'}: ${outliers.length} outliers detected</div>
                <div style="display:flex;gap:1px;height:30px;align-items:flex-end">${data.map((v, i) => html`<div style="flex:1;background:${outliers.includes(i) ? '#f44' : '#3a3d4a'};height:${v}%;min-height:1px"></div>`)}</div>
              </div>`;
            })}
          </div>
        ` : nothing}
        ${this._mkdAnalyticsView === 'trend' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Trend Decomposition</h4>
            ${['Trend', 'Seasonal', 'Residual'].map((comp, ci) => html`
              <div style="margin-bottom:8px">
                <div style="color:#aaa;font-size:12px">${comp}</div>
                <div style="display:flex;gap:1px;height:25px;align-items:center">${this._mkdDecomposeTrend(this._mkdGenerateMockTimeSeries(1, 24)[0]).map(p => {
                  const val = [p.trend, p.seasonal * 500, p.residual][ci];
                  return html`<div style="flex:1;background:${ci === 0 ? '#4a9' : ci === 1 ? '#a4a' : '#aa4'};height:${Math.abs(val) * 50}%;min-height:1px"></div>`;
                })}</div>
              </div>
            `)}
          </div>
        ` : nothing}
        ${this._mkdAnalyticsView === 'predictive' ? html`
          <div class="card" style="padding:12px;margin-bottom:8px">
            <h4 style="margin:0 0 8px;color:#e0e0e0">Predictive Scoring with Confidence Intervals</h4>
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px">
              <label style="color:#888;font-size:12px">Confidence:</label>
              <select .value=${String(this._mkdConfidenceLevel)} @change=${(e: any) => { this._mkdConfidenceLevel = Number(e.target.value); }}>
                <option value="90">90%</option><option value="95">95%</option><option value="99">99%</option>
              </select>
            </div>
            ${['Risk Score', 'Compliance', 'Threat Index'].map(label => {
              const data = this._mkdGenerateMockTimeSeries(1, 20)[0];
              const pred = this._mkdPredictiveScoreWithCI(data);
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
  @state() private _mkdWarRoomActive: boolean = false;
  @state() private _mkdWarRoomParticipants: string[] = ['SOC Lead', 'IR Manager', 'CISO', 'Legal', 'PR'];
  @state() private _mkdIncidentSeverity: string = 'P3';
  @state() private _mkdEscalationLevel: number = 0;
  @state() private _mkdCommTemplate: string = 'initial';
  @state() private _mkdLessonsLearned: string = '';
  @state() private _mkdPostIncidentAnswers: Record<string, string> = {};
  @state() private _mkdWarRoomMessages: {sender:string;time:string;text:string}[] = [];

  private _mkdGetSeverityMatrix(): {severity:string;responseTime:string;escalation:string;notify:string}[] {
    return [
      { severity: 'P1 - Critical', responseTime: '15 min', escalation: 'CISO + CEO + Legal', notify: 'All stakeholders immediately' },
      { severity: 'P2 - High', responseTime: '30 min', escalation: 'CISO + IR Manager', notify: 'Security team + affected dept heads' },
      { severity: 'P3 - Medium', responseTime: '2 hours', escalation: 'IR Manager', notify: 'Security team' },
      { severity: 'P4 - Low', responseTime: '24 hours', escalation: 'SOC Lead', notify: 'Ticket created' },
    ];
  }

  private _mkdGetCommunicationTemplates(): {key:string;subject:string;body:string}[] {
    return [
      { key: 'initial', subject: 'Security Incident Notification', body: 'We are investigating a potential security incident. The security team has been activated and is assessing the scope. We will provide updates every 30 minutes. Please do not share this information externally.' },
      { key: 'escalation', subject: 'Incident Escalation - Action Required', body: 'The incident has been escalated to P1 severity. Additional resources have been engaged. All non-essential access to affected systems has been suspended pending investigation.' },
      { key: 'contained', subject: 'Incident Containment Update', body: 'The incident has been contained. Affected systems have been isolated. Forensic analysis is ongoing. We will provide a detailed timeline within 24 hours.' },
      { key: 'resolved', subject: 'Incident Resolution Notification', body: 'The incident has been fully resolved. Root cause analysis is complete. Remediation actions have been implemented. A post-incident review has been scheduled.' },
      { key: 'external', subject: 'Security Advisory', body: 'We have identified and resolved a security matter. There is no evidence of customer data impact. We are working with relevant authorities and will provide updates as appropriate.' },
    ];
  }

  private _mkdGetStakeholderMatrix(): {role:string;notifyP1:boolean;notifyP2:boolean;notifyP3:boolean;channel:string}[] {
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

  private _mkdGetPostIncidentQuestions(): {id:string;question:string;type:string;options:string[]}[] {
    return [
      { id: 'q1', question: 'What was the initial detection method?', type: 'select', options: ['SIEM Alert', 'User Report', 'Threat Intel Feed', 'Automated Scan', 'Third-party Notification'] },
      { id: 'q2', question: 'How long was the dwell time?', type: 'select', options: ['< 1 hour', '1-24 hours', '1-7 days', '7-30 days', '> 30 days'] },
      { id: 'q3', question: 'Was the incident response plan followed?', type: 'select', options: ['Fully', 'Partially', 'Deviated significantly', 'No plan existed'] },
      { id: 'q4', question: 'What was the root cause category?', type: 'select', options: ['Misconfiguration', 'Unpatched Vulnerability', 'Social Engineering', 'Insider Threat', 'Zero-day Exploit', 'Supply Chain'] },
      { id: 'q5', question: 'What improvements are needed?', type: 'text', options: [] },
    ];
  }

  private _mkdToggleWarRoom(): void {
    this._mkdWarRoomActive = !this._mkdWarRoomActive;
    if (this._mkdWarRoomActive) {
      this._mkdWarRoomMessages = [
        { sender: 'System', time: new Date().toLocaleTimeString(), text: 'War room activated. All participants notified.' },
        { sender: 'SOC Lead', time: new Date().toLocaleTimeString(), text: 'Acknowledged. Investigating initial indicators.' },
      ];
    }
  }

  private _mkdSendWarRoomMessage(text: string): void {
    this._mkdWarRoomMessages = [...this._mkdWarRoomMessages, {
      sender: 'You', time: new Date().toLocaleTimeString(), text
    }];
  }

  private _mkdEscalateIncident(): void {
    const levels = ['P4', 'P3', 'P2', 'P1'];
    const idx = levels.indexOf(this._mkdIncidentSeverity);
    if (idx < levels.length - 1) {
      this._mkdIncidentSeverity = levels[idx + 1];
      this._mkdEscalationLevel = idx + 1;
    }
  }

  private _mkdRenderIncidentCoordination(): any {
    const templates = this._mkdGetCommunicationTemplates();
    const currentTemplate = templates.find(t => t.key === this._mkdCommTemplate) || templates[0];
    const questions = this._mkdGetPostIncidentQuestions();
    const severityMatrix = this._mkdGetSeverityMatrix();
    const stakeholders = this._mkdGetStakeholderMatrix();
    return html`
      <div class="incident-coordination" style="padding:12px">
        <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
          <button class="tab ${this._mkdWarRoomActive ? 'active' : ''}" @click=${() => { this._mkdToggleWarRoom(); }}>War Room ${this._mkdWarRoomActive ? '(Active)' : ''}</button>
          <button class="tab" @click=${() => { this._mkdEscalateIncident(); }}>Escalate (${this._mkdIncidentSeverity})</button>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Severity Escalation Matrix</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Severity</th><th style="color:#888">Response Time</th><th style="color:#888">Escalation</th><th style="color:#888">Notification</th></tr></thead>
            <tbody>${severityMatrix.map(r => html`
              <tr style="${r.severity.startsWith(this._mkdIncidentSeverity) ? 'background:rgba(255,68,68,0.15)' : ''}">
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
            ${templates.map(t => html`<button class="tab ${this._mkdCommTemplate === t.key ? 'active' : ''}" @click=${() => { this._mkdCommTemplate = t.key; }}>${t.subject.split(' - ')[0]}</button>`)}
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
                <select style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px" @change=${(e: any) => { this._mkdPostIncidentAnswers = {...this._mkdPostIncidentAnswers, [q.id]: e.target.value}; }}>
                  <option value="">Select...</option>
                  ${q.options.map(o => html`<option value="${o}" ${this._mkdPostIncidentAnswers[q.id] === o ? 'selected' : ''}>${o}</option>`)}
                </select>
              ` : html`
                <textarea style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px;min-height:40px" placeholder="Enter details..." @input=${(e: any) => { this._mkdPostIncidentAnswers = {...this._mkdPostIncidentAnswers, [q.id]: e.target.value}; }}></textarea>
              `}
            </div>
          `)}
          <div style="margin-top:8px">
            <label style="color:#aaa;font-size:12px;display:block;margin-bottom:4px">Lessons Learned</label>
            <textarea style="background:#1a1d27;color:#ddd;border:1px solid #333;padding:4px;border-radius:3px;width:100%;font-size:12px;min-height:60px" .value=${this._mkdLessonsLearned} @input=${(e: any) => { this._mkdLessonsLearned = e.target.value; }}></textarea>
          </div>
        </div>
      </div>
    `;
  }

  // ========== Section C: Security Metrics Correlation ==========
  @state() private _mkdMetricData: Record<string, number[]> = {};
  @state() private _mkdCompositeScore: number = 72;
  @state() private _mkdMetricAlerts: string[] = [];
  @state() private _mkdLeadingIndicators: string[] = ['Phishing Click Rate', 'Patch Compliance', 'Training Completion', 'Access Review Age'];
  @state() private _mkdLaggingIndicators: string[] = ['Incident Count', 'MTTR', 'Data Breach Cost', 'Compliance Failures'];
  @state() private _mkdExecutiveSummary: string = '';

  private _mkdInitializeMetricData(): void {
    const metrics = ['Vulnerability Count', 'Incident Rate', 'Patch Coverage', 'Training Score', 'Compliance Pct', 'Access Anomalies'];
    metrics.forEach(m => {
      this._mkdMetricData[m] = this._mkdGenerateMockTimeSeries(1, 30)[0];
    });
  }

  private _mkdCalculateCompositeScore(): number {
    const weights: Record<string, number> = {
      'Vulnerability Count': -0.2, 'Incident Rate': -0.25, 'Patch Coverage': 0.2,
      'Training Score': 0.15, 'Compliance Pct': 0.15, 'Access Anomalies': -0.05
    };
    let score = 75;
    for (const [metric, weight] of Object.entries(weights)) {
      const data = this._mkdMetricData[metric];
      if (data && data.length > 0) {
        const recent = data.slice(-7);
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        score += (avg - 50) * weight;
      }
    }
    this._mkdCompositeScore = Math.max(0, Math.min(100, score));
    return this._mkdCompositeScore;
  }

  private _mkdDetectMetricAnomalies(): string[] {
    const alerts: string[] = [];
    for (const [metric, data] of Object.entries(this._mkdMetricData)) {
      if (!data || data.length < 10) continue;
      const outliers = this._mkdDetectOutliersZScore(data);
      if (outliers.length > 0) {
        alerts.push(metric + ': ' + outliers.length + ' anomalous data points detected in last ' + data.length + ' periods');
      }
      const last = data[data.length - 1];
      const prev = data[data.length - 2];
      if (Math.abs(last - prev) / (Math.abs(prev) || 1) > 0.5) {
        alerts.push(metric + ': ' + (last > prev ? 'Sudden increase' : 'Sudden decrease') + ' of ' + (Math.abs(last - prev) / (Math.abs(prev) || 1) * 100).toFixed(0) + '%');
      }
    }
    this._mkdMetricAlerts = alerts;
    return alerts;
  }

  private _mkdGenerateExecutiveSummary(): string {
    const score = this._mkdCalculateCompositeScore();
    const alerts = this._mkdDetectMetricAnomalies();
    const scoreTrend = score > 80 ? 'improving' : score > 60 ? 'stable' : 'declining';
    let summary = 'Security Posture Score: ' + score.toFixed(0) + '/100 (' + scoreTrend + '). ';
    summary += 'Leading indicators show ' + (this._mkdLeadingIndicators.length > 2 ? 'generally positive' : 'mixed') + ' trends. ';
    if (alerts.length > 0) {
      summary += 'Active alerts: ' + alerts.length + '. Key concerns: ' + alerts.slice(0, 3).join('; ') + '. ';
    } else {
      summary += 'No critical metric anomalies detected. ';
    }
    summary += 'Recommendation: ' + (score > 80 ? 'Maintain current security posture and continue monitoring.' : score > 60 ? 'Focus on patch management and training completion rates.' : 'Immediate attention required for vulnerability remediation and incident response readiness.');
    this._mkdExecutiveSummary = summary;
    return summary;
  }

  private _mkdRenderMetricsCorrelation(): any {
    if (Object.keys(this._mkdMetricData).length === 0) this._mkdInitializeMetricData();
    const score = this._mkdCalculateCompositeScore();
    const alerts = this._mkdDetectMetricAnomalies();
    const metricNames = Object.keys(this._mkdMetricData);
    const corrMatrix = metricNames.map((m1, i) =>
      metricNames.map((m2, j) => this._mkdPearsonCorrelation(this._mkdMetricData[m1] || [], this._mkdMetricData[m2] || []))
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
              ${this._mkdLeadingIndicators.map(ind => html`<div style="color:#aaa;font-size:11px;padding:2px 0">- ${ind}</div>`)}
            </div>
            <div>
              <div style="color:#a4a;font-size:12px;font-weight:bold;margin-bottom:4px">Lagging (Reactive)</div>
              ${this._mkdLaggingIndicators.map(ind => html`<div style="color:#aaa;font-size:11px;padding:2px 0">- ${ind}</div>`)}
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
          <div style="background:#1a1d27;padding:8px;border-radius:4px;color:#bbb;font-size:12px;line-height:1.6">${this._mkdGenerateExecutiveSummary()}</div>
          <button class="btn" style="margin-top:8px;font-size:11px" @click=${() => { this._mkdGenerateExecutiveSummary(); }}>Regenerate Summary</button>
        </div>
      </div>
    `;
  }

  // ========== Section D: API Gateway & Rate Limiting ==========
  @state() private _mkdApiEndpoints: {id:string;path:string;method:string;status:string;latency:number;rateLimit:number}[] = [];
  @state() private _mkdRateLimitPolicy: {endpoint:string;requestsPerMin:number;burstLimit:number;windowSec:number}[] = [];
  @state() private _mkdApiKeys: {id:string;name:string;created:string;expires:string;status:string;lastUsed:string}[] = [];
  @state() private _mkdWebhookStatuses: {id:string;url:string;events:string;lastDelivery:string;status:string;retryCount:number}[] = [];

  private _mkdInitializeApiData(): void {
    this._mkdApiEndpoints = [
      { id: 'api-1', path: '/api/v1/security/events', method: 'POST', status: 'active', latency: 45, rateLimit: 100 },
      { id: 'api-2', path: '/api/v1/vulnerabilities', method: 'GET', status: 'active', latency: 120, rateLimit: 200 },
      { id: 'api-3', path: '/api/v1/incidents', method: 'POST', status: 'active', latency: 85, rateLimit: 50 },
      { id: 'api-4', path: '/api/v1/assets', method: 'GET', status: 'active', latency: 200, rateLimit: 150 },
      { id: 'api-5', path: '/api/v1/compliance', method: 'GET', status: 'deprecated', latency: 350, rateLimit: 30 },
    ];
    this._mkdRateLimitPolicy = [
      { endpoint: '/api/v1/security/*', requestsPerMin: 100, burstLimit: 150, windowSec: 60 },
      { endpoint: '/api/v1/vulnerabilities/*', requestsPerMin: 200, burstLimit: 300, windowSec: 60 },
      { endpoint: '/api/v1/incidents/*', requestsPerMin: 50, burstLimit: 75, windowSec: 60 },
      { endpoint: '/api/v1/assets/*', requestsPerMin: 150, burstLimit: 200, windowSec: 60 },
    ];
    this._mkdApiKeys = [
      { id: 'key-1', name: 'SOC Integration Key', created: '2025-01-15', expires: '2026-01-15', status: 'active', lastUsed: '2 min ago' },
      { id: 'key-2', name: 'SIEM Connector', created: '2025-03-20', expires: '2026-03-20', status: 'active', lastUsed: '5 min ago' },
      { id: 'key-3', name: 'Legacy Scanner', created: '2024-06-01', expires: '2025-06-01', status: 'expired', lastUsed: '30 days ago' },
    ];
    this._mkdWebhookStatuses = [
      { id: 'wh-1', url: 'https://hooks.slack.com/services/T00/B00/xxx', events: 'incident.created', lastDelivery: '1 min ago', status: 'success', retryCount: 0 },
      { id: 'wh-2', url: 'https://api.pagerduty.com/integration/xxx', events: 'incident.escalated', lastDelivery: '5 min ago', status: 'success', retryCount: 0 },
      { id: 'wh-3', url: 'https://webhooks.jira.com/xxx', events: 'vulnerability.critical', lastDelivery: 'Failed', status: 'failed', retryCount: 3 },
    ];
  }

  private _mkdUpdateRateLimit(endpoint: string, field: string, value: number): void {
    this._mkdRateLimitPolicy = this._mkdRateLimitPolicy.map(p =>
      p.endpoint === endpoint ? { ...p, [field]: value } : p
    );
  }

  private _mkdRenderApiGateway(): any {
    if (this._mkdApiEndpoints.length === 0) this._mkdInitializeApiData();
    const totalRpm = this._mkdApiEndpoints.reduce((a, e) => a + (Math.random() * e.rateLimit * 0.5), 0);
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
              <div style="color:#e0e0e0;font-size:20px;font-weight:bold">${this._mkdApiEndpoints.length}</div>
              <div style="color:#888;font-size:10px">Active Endpoints</div>
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">API Endpoints</h4>
          <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead><tr><th style="color:#888;text-align:left">Endpoint</th><th style="color:#888">Method</th><th style="color:#888">Latency</th><th style="color:#888">Rate Limit</th><th style="color:#888">Status</th></tr></thead>
            <tbody>${this._mkdApiEndpoints.map(e => html`
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
          ${this._mkdRateLimitPolicy.map(p => html`
            <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;padding:4px;background:#1a1d27;border-radius:4px">
              <span style="color:#ddd;font-size:10px;font-family:monospace;min-width:160px">${p.endpoint}</span>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="color:#888;font-size:10px">RPM:</span>
                <input type="number" style="background:#0d0f17;color:#ddd;border:1px solid #333;padding:2px 4px;border-radius:3px;width:60px;font-size:11px" .value=${String(p.requestsPerMin)} @change=${(e: any) => { this._mkdUpdateRateLimit(p.endpoint, 'requestsPerMin', Number(e.target.value)); }} />
              </div>
              <div style="display:flex;align-items:center;gap:4px">
                <span style="color:#888;font-size:10px">Burst:</span>
                <input type="number" style="background:#0d0f17;color:#ddd;border:1px solid #333;padding:2px 4px;border-radius:3px;width:60px;font-size:11px" .value=${String(p.burstLimit)} @change=${(e: any) => { this._mkdUpdateRateLimit(p.endpoint, 'burstLimit', Number(e.target.value)); }} />
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
            <tbody>${this._mkdApiKeys.map(k => html`
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
          ${this._mkdWebhookStatuses.map(w => html`
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
  @state() private _mkdRenderTime: number = 0;
  @state() private _mkdMemoryEstimate: number = 0;
  @state() private _mkdCacheHits: number = 0;
  @state() private _mkdCacheMisses: number = 0;
  @state() private _mkdLazyLoadingEnabled: boolean = true;
  @state() private _mkdVirtualScrollEnabled: boolean = false;
  @state() private _mkdPerfHistory: {timestamp:number;renderMs:number;memoryKb:number;cacheRatio:number}[] = [];
  @state() private _mkdDataSetSize: number = 1000;

  private _mkdMeasurePerformance(): void {
    const start = performance.now();
    const data = Array.from({ length: this._mkdDataSetSize }, (_, i) => ({
      id: i, value: Math.random() * 100, category: ['A', 'B', 'C'][i % 3],
      timestamp: Date.now() - i * 60000
    }));
    const filtered = data.filter(d => d.value > 30).map(d => d.value).sort((a, b) => b - a);
    const end = performance.now();
    this._mkdRenderTime = Math.round((end - start) * 100) / 100;
    this._mkdMemoryEstimate = Math.round((this._mkdDataSetSize * 0.15) * 100) / 100;
    this._mkdCacheHits = Math.floor(Math.random() * 80 + 60);
    this._mkdCacheMisses = Math.floor(Math.random() * 30 + 10);
    this._mkdPerfHistory.push({
      timestamp: Date.now(), renderMs: this._mkdRenderTime,
      memoryKb: this._mkdMemoryEstimate,
      cacheRatio: this._mkdCacheHits / (this._mkdCacheHits + this._mkdCacheMisses)
    });
    if (this._mkdPerfHistory.length > 20) this._mkdPerfHistory = this._mkdPerfHistory.slice(-20);
  }

  private _mkdGetCacheRatio(): number {
    const total = this._mkdCacheHits + this._mkdCacheMisses;
    return total > 0 ? this._mkdCacheHits / total : 0;
  }

  private _mkdGetPerfRecommendation(): string {
    if (this._mkdRenderTime > 50) return 'High render time detected. Consider enabling virtual scrolling and reducing data set size.';
    if (this._mkdGetCacheRatio() < 0.7) return 'Cache hit ratio is low. Review cache invalidation strategy and increase cache TTL.';
    if (this._mkdMemoryEstimate > 500) return 'High memory usage. Enable lazy loading and consider pagination for large datasets.';
    if (this._mkdDataSetSize > 500 && !this._mkdVirtualScrollEnabled) return 'Large dataset detected. Enable virtual scrolling for optimal performance.';
    return 'Performance is within acceptable parameters. Continue monitoring.';
  }

  private _mkdRenderPerformancePanel(): any {
    if (this._mkdPerfHistory.length === 0) this._mkdMeasurePerformance();
    const cacheRatio = this._mkdGetCacheRatio();
    const recommendation = this._mkdGetPerfRecommendation();
    const isWarning = recommendation.includes('detected') || recommendation.includes('low') || recommendation.includes('High');
    return html`
      <div class="perf-panel" style="padding:12px">
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Render Performance Metrics</h4>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${this._mkdRenderTime > 50 ? '#f44' : '#4f4'};font-size:18px;font-weight:bold">${this._mkdRenderTime}ms</div>
              <div style="color:#888;font-size:10px">Render Time</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${this._mkdMemoryEstimate > 500 ? '#fa0' : '#4a9'};font-size:18px;font-weight:bold">${this._mkdMemoryEstimate}KB</div>
              <div style="color:#888;font-size:10px">Memory Est.</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:${cacheRatio > 0.8 ? '#4f4' : '#fa0'};font-size:18px;font-weight:bold">${(cacheRatio * 100).toFixed(0)}%</div>
              <div style="color:#888;font-size:10px">Cache Hit Ratio</div>
            </div>
            <div style="background:#1a1d27;padding:8px;border-radius:4px;text-align:center">
              <div style="color:#e0e0e0;font-size:18px;font-weight:bold">${this._mkdDataSetSize}</div>
              <div style="color:#888;font-size:10px">Dataset Size</div>
            </div>
          </div>
          <div style="margin-top:8px">
            <div style="display:flex;gap:8px;align-items:center">
              <label style="color:#888;font-size:12px">Dataset size:</label>
              <input type="range" min="100" max="10000" step="100" .value=${String(this._mkdDataSetSize)} @input=${(e: any) => { this._mkdDataSetSize = Number(e.target.value); }} style="flex:1" />
              <button class="btn" style="font-size:11px" @click=${() => { this._mkdMeasurePerformance(); }}>Benchmark</button>
            </div>
          </div>
        </div>
        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Optimization Controls</h4>
          <div style="display:flex;gap:16px;flex-wrap:wrap">
            <label style="display:flex;align-items:center;gap:6px;color:#ddd;font-size:12px;cursor:pointer">
              <input type="checkbox" .checked=${this._mkdLazyLoadingEnabled} @change=${(e: any) => { this._mkdLazyLoadingEnabled = e.target.checked; }} />
              Lazy Loading
            </label>
            <label style="display:flex;align-items:center;gap:6px;color:#ddd;font-size:12px;cursor:pointer">
              <input type="checkbox" .checked=${this._mkdVirtualScrollEnabled} @change=${(e: any) => { this._mkdVirtualScrollEnabled = e.target.checked; }} />
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
                <span>Hits: ${this._mkdCacheHits}</span><span>Misses: ${this._mkdCacheMisses}</span>
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
            ${this._mkdPerfHistory.slice(-15).map(h => html`
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
// ===== SECURITY ROI DASHBOARD (R22) =====
  private _r22RoiData = {
    totalInvestment: 4200000, avoidedLosses: 18700000, detectedIncidents: 342,
    mttdReduction: 68, mttrReduction: 72, automationSavings: 2800000,
    domains: [
      { domain: 'Network Security', budget: 850000, savings: 4200000, roi: 394 },
      { domain: 'Endpoint Protection', budget: 620000, savings: 3100000, roi: 400 },
      { domain: 'Cloud Security', budget: 780000, savings: 3500000, roi: 349 },
      { domain: 'Identity & Access', budget: 450000, savings: 2800000, roi: 522 },
      { domain: 'Data Protection', budget: 560000, savings: 2100000, roi: 275 },
      { domain: 'Application Security', budget: 420000, savings: 1500000, roi: 257 },
      { domain: 'Security Operations', budget: 380000, savings: 1200000, roi: 216 },
      { domain: 'Compliance & GRC', budget: 140000, savings: 300000, roi: 114 },
    ],
    yearlySpend: [
      { year: '2022', amount: 2800000 }, { year: '2023', amount: 3200000 },
      { year: '2024', amount: 3800000 }, { year: '2025', amount: 4000000 },
      { year: '2026', amount: 4200000 },
    ],
    projectedSavings: [
      { year: '2026', manual: 1200000, automated: 2800000 },
      { year: '2027', manual: 1000000, automated: 3500000 },
      { year: '2028', manual: 800000, automated: 4200000 },
    ],
  };

  private _r22RenderROIDashboard(): ReturnType<typeof html> {
    const d = this._r22RoiData;
    const totalROI = Math.round((d.avoidedLosses - d.totalInvestment) / d.totalInvestment * 100);
    const maxBudget = Math.max(...d.domains.map(x => x.budget));
    return html`
      <div class="r22-roi-dashboard" style="background:#0a1628;border:1px solid #1e3a5f;border-radius:8px;padding:16px;margin:12px 0;">
        <h4 style="color:#00ff88;margin:0 0 12px;font-size:14px;">Security ROI Dashboard</h4>
        <div style="display:flex;gap:10px;margin-bottom:12px;">
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#00ff88;">${totalROI}%</div>
            <div style="color:#8899aa;font-size:11px;">Overall ROI</div>
          </div>
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#00d4ff;">$${(d.avoidedLosses / 1e6).toFixed(1)}M</div>
            <div style="color:#8899aa;font-size:11px;">Avoided Losses</div>
          </div>
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#ffaa00;">$${(d.automationSavings / 1e6).toFixed(1)}M</div>
            <div style="color:#8899aa;font-size:11px;">Automation Savings</div>
          </div>
          <div style="background:#0d1f35;border-radius:6px;padding:10px;flex:1;text-align:center;">
            <div style="font-size:22px;font-weight:bold;color:#ff6b6b;">${d.mttdReduction}%</div>
            <div style="color:#8899aa;font-size:11px;">MTTD Reduction</div>
          </div>
        </div>
        <div style="font-size:11px;color:#8899aa;margin-bottom:6px;">ROI by Security Domain:</div>
        ${d.domains.map(x => html`
          <div style="display:flex;align-items:center;gap:6px;margin:3px 0;">
            <span style="color:#aaccee;font-size:10px;width:110px;">${x.domain}</span>
            <div style="flex:1;height:6px;background:#1a2a3a;border-radius:3px;">
              <div style="width:${(x.budget / maxBudget) * 100}%;height:100%;background:#00d4ff;border-radius:3px;"></div>
            </div>
            <span style="color:#8899aa;font-size:10px;">$${(x.budget / 1000).toFixed(0)}K</span>
            <span style="color:#00ff88;font-size:10px;width:40px;text-align:right;">${x.roi}%</span>
          </div>
        `)}
        <div style="margin-top:8px;">
          <span style="color:#8899aa;font-size:11px;">YoY Spend Trend:</span>
          <div style="display:flex;align-items:flex-end;gap:6px;height:30px;margin-top:4px;">
            ${d.yearlySpend.map(y => html`
              <div style="flex:1;height:${(y.amount / d.yearlySpend[d.yearlySpend.length - 1].amount) * 30}px;background:#00d4ff;border-radius:2px 2px 0 0;" title="${y.year}: $${(y.amount/1e6).toFixed(1)}M"></div>
            `)}
          </div>
          ${d.yearlySpend.map(y => html`<span style="color:#667788;font-size:9px;display:inline-block;width:20%;text-align:center;">${y.year.slice(2)}</span>`)}
        </div>
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



  private _renderPlaybookLibrary() {
    const playbooks = [
      { id: 'PB-001', name: 'Ransomware Response', version: '3.2.1', status: 'active', steps: 14, avgTime: '4.2h', successRate: 94, lastRun: '2026-04-20', author: 'SOC Team Alpha', category: 'Incident Response' },
      { id: 'PB-002', name: 'Phishing Triage', version: '2.8.0', status: 'active', steps: 8, avgTime: '0.8h', successRate: 97, lastRun: '2026-04-22', author: 'IR Lead', category: 'Incident Response' },
      { id: 'PB-003', name: 'Data Breach Notification', version: '4.1.0', status: 'active', steps: 22, avgTime: '48h', successRate: 89, lastRun: '2026-03-15', author: 'Legal & Privacy', category: 'Compliance' },
      { id: 'PB-004', name: 'Cloud Infrastructure Recovery', version: '1.5.2', status: 'draft', steps: 18, avgTime: '6.1h', successRate: 85, lastRun: '2026-04-18', author: 'Cloud Ops', category: 'Recovery' },
      { id: 'PB-005', name: 'Insider Threat Investigation', version: '2.3.0', status: 'active', steps: 16, avgTime: '12h', successRate: 78, lastRun: '2026-04-10', author: 'HR Security', category: 'Investigation' },
      { id: 'PB-006', name: 'DDoS Mitigation', version: '5.0.1', status: 'active', steps: 10, avgTime: '2.1h', successRate: 96, lastRun: '2026-04-21', author: 'Network Team', category: 'Incident Response' },
      { id: 'PB-007', name: 'Third-Party Breach Assessment', version: '1.2.0', status: 'review', steps: 20, avgTime: '24h', successRate: 82, lastRun: '2026-02-28', author: 'Vendor Mgmt', category: 'Assessment' },
      { id: 'PB-008', name: 'Zero-Day Vulnerability Patch', version: '3.0.0', status: 'active', steps: 12, avgTime: '8h', successRate: 91, lastRun: '2026-04-19', author: 'Patch Team', category: 'Vulnerability' },
      { id: 'PB-009', name: 'Executive Impersonation Response', version: '2.1.0', status: 'active', steps: 9, avgTime: '1.5h', successRate: 93, lastRun: '2026-04-17', author: 'CISO Office', category: 'Social Engineering' },
      { id: 'PB-010', name: 'Supply Chain Compromise', version: '1.0.0', status: 'draft', steps: 25, avgTime: '72h', successRate: 0, lastRun: 'Never', author: 'Threat Intel', category: 'Advanced Threats' },
    ];
    const statusColors: Record<string, string> = { active: '#10b981', draft: '#f59e0b', review: '#3b82f6', archived: '#6b7280' };
    return html`
      <section class="playbook-library">
        <div class="pb-header">
          <h4>Security Orchestration Playbook Library</h4>
        </div>
        <div class="pb-grid">
          ${playbooks.map(pb => html`
            <div class="pb-card" style="border-top:3px solid ${statusColors[pb.status]}">
              <div class="pb-card-header">
                <span class="pb-id">${pb.id}</span>
                <span class="pb-status-badge" style="background:${statusColors[pb.status]}22;color:${statusColors[pb.status]}">${pb.status.toUpperCase()}</span>
              </div>
              <div class="pb-name">${pb.name}</div>
              <div class="pb-meta">
                <span>v${pb.version}</span>
                <span>${pb.category}</span>
                <span>${pb.steps} steps</span>
                <span>Avg: ${pb.avgTime}</span>
              </div>
              <div class="pb-metrics">
                <div class="pb-metric">
                  <span class="pb-metric-label">Success Rate</span>
                  <div class="mini-bar"><div class="mini-fill" style="width:${pb.successRate}%;background:${pb.successRate >= 90 ? '#10b981' : pb.successRate >= 80 ? '#f59e0b' : '#ef4444'}"></div></div>
                  <span class="pb-metric-val">${pb.successRate}%</span>
                </div>
                <div class="pb-metric">
                  <span class="pb-metric-label">Last Run</span>
                  <span class="pb-metric-val">${pb.lastRun}</span>
                </div>
              </div>
              <div class="pb-author">Author: ${pb.author}</div>
            </div>
          `).join('')}
        </div>
      </section>`;
  }

  private _renderToolchainIntegration() {
    const tools = [
      { name: 'CrowdStrike Falcon', category: 'EDR', version: '7.12.0', status: 'healthy', lastSync: '5m ago', alerts: 3, apiCalls: '12.4K/hr', license: 'Enterprise', expiry: '2026-12-31' },
      { name: 'Palo Alto Prisma', category: 'CSPM', version: '3.8.2', status: 'healthy', lastSync: '2m ago', alerts: 8, apiCalls: '8.2K/hr', license: 'Premium', expiry: '2026-09-15' },
      { name: 'Splunk Enterprise', category: 'SIEM', version: '9.2.1', status: 'degraded', lastSync: '15m ago', alerts: 12, apiCalls: '45.6K/hr', license: 'Enterprise', expiry: '2027-03-01' },
      { name: 'Snyk', category: 'SCA', version: '1.1200.0', status: 'healthy', lastSync: '1m ago', alerts: 156, apiCalls: '22.1K/hr', license: 'Team', expiry: '2026-07-22' },
      { name: 'Tenable.io', category: 'VA', version: '6.14.0', status: 'healthy', lastSync: '10m ago', alerts: 42, apiCalls: '5.8K/hr', license: 'Professional', expiry: '2026-11-30' },
      { name: 'HashiCorp Vault', category: 'Secrets', version: '1.16.2', status: 'healthy', lastSync: '30s ago', alerts: 0, apiCalls: '34.2K/hr', license: 'Enterprise', expiry: '2027-06-01' },
      { name: 'Opa Gatekeeper', category: 'Policy', version: '3.15.0', status: 'healthy', lastSync: '1m ago', alerts: 5, apiCalls: '18.7K/hr', license: 'OSS', expiry: 'N/A' },
      { name: 'Aqua Security', category: 'Container', version: '2024.4.2', status: 'warning', lastSync: '8m ago', alerts: 11, apiCalls: '9.3K/hr', license: 'Enterprise', expiry: '2026-08-15' },
    ];
    const dataFlows = [
      { from: 'CrowdStrike', to: 'Splunk', type: 'alerts', volume: '2.1K/min', latency: '3s', status: 'active' },
      { from: 'Palo Alto', to: 'Splunk', type: 'logs', volume: '5.4K/min', latency: '5s', status: 'active' },
      { from: 'Snyk', to: 'Jira', type: 'vulns', volume: '120/hr', latency: '15s', status: 'active' },
      { from: 'Tenable', to: 'ServiceNow', type: 'findings', volume: '80/hr', latency: '30s', status: 'active' },
      { from: 'Aqua', to: 'Splunk', type: 'runtime', volume: '8.9K/min', latency: '4s', status: 'degraded' },
    ];
    const statusColor = (s: string) => s === 'healthy' ? '#10b981' : s === 'warning' ? '#f59e0b' : '#ef4444';
    return html`
      <section class="toolchain-integration">
        <h4>Security Toolchain Integration</h4>
        <div class="tool-inventory">
          <h5>Tool Inventory and Health</h5>
          <div class="tool-grid">
            ${tools.map(t => html`
              <div class="tool-card" style="border-top:3px solid ${statusColor(t.status)}">
                <div class="tool-name">${t.name}</div>
                <div class="tool-meta">
                  <span class="tool-category">${t.category}</span>
                  <span>v${t.version}</span>
                  <span class="tool-status" style="color:${statusColor(t.status)}">${t.status.toUpperCase()}</span>
                </div>
                <div class="tool-stats">
                  <span>Sync: ${t.lastSync}</span>
                  <span>Alerts: ${t.alerts}</span>
                  <span>API: ${t.apiCalls}</span>
                </div>
                <div class="tool-license">
                  <span>${t.license}</span>
                  <span>Expires: ${t.expiry}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="tool-data-flows">
          <h5>Data Flow Between Tools</h5>
          <div class="flow-list">
            ${dataFlows.map(f => html`
              <div class="flow-row" style="border-left:3px solid ${f.status === 'active' ? '#10b981' : '#f59e0b'}">
                <span class="flow-from">${f.from}</span>
                <span class="flow-arrow">-></span>
                <span class="flow-to">${f.to}</span>
                <span class="flow-type">${f.type}</span>
                <span class="flow-volume">${f.volume}</span>
                <span class="flow-latency">Latency: ${f.latency}</span>
                <span class="flow-status">${f.status}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`;
  }



  private _renderCloudNativeSecurity() {
    const clusters = [
      { name: 'prod-us-east-1', pods: 342, nodes: 24, criticalIssues: 3, highIssues: 12, compliance: 87, imageScans: '98.2%', networkPolicies: 156, rbacRules: 89, runtimeAlerts: 2 },
      { name: 'prod-eu-west-1', pods: 218, nodes: 16, criticalIssues: 1, highIssues: 8, compliance: 92, imageScans: '97.1%', networkPolicies: 124, rbacRules: 67, runtimeAlerts: 0 },
      { name: 'staging-us-east-1', pods: 95, nodes: 8, criticalIssues: 0, highIssues: 5, compliance: 78, imageScans: '89.5%', networkPolicies: 67, rbacRules: 34, runtimeAlerts: 1 },
      { name: 'dev-us-east-1', pods: 156, nodes: 12, criticalIssues: 2, highIssues: 15, compliance: 65, imageScans: '76.3%', networkPolicies: 45, rbacRules: 23, runtimeAlerts: 4 },
    ];
    const riskColor = (r: string) => r === 'high' ? '#ef4444' : r === 'medium' ? '#f59e0b' : '#10b981';
    return html`
      <section class="cloud-native-security">
        <h4>Cloud-Native Security Dashboard</h4>
        <div class="k8s-clusters">
          <h5>Kubernetes Cluster Security</h5>
          <div class="cluster-grid">
            ${clusters.map(c => html`
              <div class="cluster-card" style="border-left:4px solid ${c.criticalIssues > 0 ? '#ef4444' : '#10b981'}">
                <div class="cluster-name">${c.name}</div>
                <div class="cluster-stats">
                  <div class="cs-stat"><span class="cs-label">Pods</span><span class="cs-val">${c.pods}</span></div>
                  <div class="cs-stat"><span class="cs-label">Nodes</span><span class="cs-val">${c.nodes}</span></div>
                  <div class="cs-stat"><span class="cs-label">Critical</span><span class="cs-val" style="color:#ef4444">${c.criticalIssues}</span></div>
                  <div class="cs-stat"><span class="cs-label">High</span><span class="cs-val" style="color:#f59e0b">${c.highIssues}</span></div>
                  <div class="cs-stat"><span class="cs-label">Compliance</span><span class="cs-val">${c.compliance}%</span></div>
                  <div class="cs-stat"><span class="cs-label">Image Scans</span><span class="cs-val">${c.imageScans}</span></div>
                  <div class="cs-stat"><span class="cs-label">Net Policies</span><span class="cs-val">${c.networkPolicies}</span></div>
                  <div class="cs-stat"><span class="cs-label">RBAC Rules</span><span class="cs-val">${c.rbacRules}</span></div>
                </div>
                ${c.runtimeAlerts > 0 ? html`<div class="runtime-alert">Runtime Alerts: ${c.runtimeAlerts}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </section>`;
  }



  private _renderComplianceCalendar() {
    const events = [
      { date: '2026-05-01', name: 'SOC 2 Type II Audit', type: 'audit', status: 'upcoming', assignee: 'Compliance Team' },
      { date: '2026-05-15', name: 'GDPR Annual Review', type: 'review', status: 'upcoming', assignee: 'DPO Office' },
      { date: '2026-06-01', name: 'PCI DSS Assessment', type: 'assessment', status: 'scheduled', assignee: 'QSA Team' },
      { date: '2026-06-15', name: 'ISO 27001 Surveillance', type: 'audit', status: 'scheduled', assignee: 'Internal Audit' },
      { date: '2026-07-01', name: 'HIPAA Security Risk Analysis', type: 'assessment', status: 'planned', assignee: 'Security Team' },
      { date: '2026-07-20', name: 'NIST CSF Self-Assessment', type: 'review', status: 'planned', assignee: 'CISO Office' },
      { date: '2026-08-01', name: 'Vendor Security Review Cycle', type: 'review', status: 'planned', assignee: 'Vendor Mgmt' },
      { date: '2026-09-01', name: 'Annual Penetration Test', type: 'assessment', status: 'planned', assignee: 'Pentest Team' },
    ];
    const typeColors: Record<string, string> = { audit: '#ef4444', review: '#3b82f6', assessment: '#f59e0b' };
    return html`
      <section class="compliance-calendar-view">
        <h4>Compliance Calendar</h4>
        <div class="cal-event-list">
          ${events.map(e => html`
            <div class="cal-event" style="border-left:4px solid ${typeColors[e.type]}">
              <span class="cal-date">${e.date}</span>
              <span class="cal-name">${e.name}</span>
              <span class="cal-type" style="color:${typeColors[e.type]}">${e.type.toUpperCase()}</span>
              <span class="cal-status">${e.status}</span>
              <span class="cal-assignee">${e.assignee}</span>
            </div>
          `).join('')}
        </div>
      </section>`;
  }


  private _renderBudgetPlanning() {
    const budgetData = [
      { category: "Personnel & Training", planned: 900000, actual: 2752000, utilization: 305.8, q1: "25%", q2: "30%", q3: "28%", q4: "20%" },
      { category: "Tooling & Licensing", planned: 907000, actual: 2765000, utilization: 304.9, q1: "28%", q2: "35%", q3: "23%", q4: "21%" },
      { category: "Infrastructure Security", planned: 914000, actual: 2778000, utilization: 303.9, q1: "15%", q2: "24%", q3: "18%", q4: "22%" },
      { category: "Compliance & Audit", planned: 921000, actual: 2791000, utilization: 303.0, q1: "18%", q2: "29%", q3: "29%", q4: "23%" },
      { category: "Incident Response", planned: 928000, actual: 2804000, utilization: 302.2, q1: "21%", q2: "34%", q3: "24%", q4: "24%" },
      { category: "Third-Party Assessments", planned: 935000, actual: 2817000, utilization: 301.3, q1: "24%", q2: "23%", q3: "19%", q4: "25%" },
      { category: "Security Awareness", planned: 942000, actual: 2830000, utilization: 300.4, q1: "27%", q2: "28%", q3: "30%", q4: "10%" },
      { category: "Research & Innovation", planned: 949000, actual: 2843000, utilization: 299.6, q1: "30%", q2: "33%", q3: "25%", q4: "11%" },
    ];
    const totalBudget = budgetData.reduce((s, d) => s + d.planned, 0);
    const totalSpent = budgetData.reduce((s, d) => s + d.actual, 0);
    const overallUtil = ((totalSpent / totalBudget) * 100).toFixed(1);
    const headcount = [
      { team: "SOC Tier 1", current: 15, target: 21, gap: 0, avgSalary: "145k" },
      { team: "SOC Tier 2", current: 7, target: 20, gap: 5, avgSalary: "174k" },
      { team: "Threat Intel", current: 16, target: 19, gap: 4, avgSalary: "92k" },
      { team: "Red Team", current: 8, target: 18, gap: 3, avgSalary: "121k" },
      { team: "GRC", current: 17, target: 17, gap: 2, avgSalary: "150k" },
      { team: "AppSec", current: 9, target: 16, gap: 1, avgSalary: "179k" },
      { team: "Cloud Sec", current: 18, target: 15, gap: 0, avgSalary: "97k" },
      { team: "Identity & Access", current: 10, target: 14, gap: 5, avgSalary: "126k" },
    ];
    const vendorSpend = [
      { vendor: "CrowdStrike", annual: "654k", contractEnd: "2026-07", renewalRisk: "Low", satisfaction: 3 },
      { vendor: "Palo Alto", annual: "685k", contractEnd: "2026-08", renewalRisk: "Medium", satisfaction: 5 },
      { vendor: "Splunk", annual: "716k", contractEnd: "2026-09", renewalRisk: "High", satisfaction: 4 },
      { vendor: "Qualys", annual: "747k", contractEnd: "2026-10", renewalRisk: "Low", satisfaction: 3 },
      { vendor: "Rapid7", annual: "778k", contractEnd: "2026-11", renewalRisk: "Medium", satisfaction: 5 },
      { vendor: "Mandiant", annual: "58k", contractEnd: "2026-12", renewalRisk: "High", satisfaction: 4 },
      { vendor: "Zscaler", annual: "89k", contractEnd: "2026-01", renewalRisk: "Low", satisfaction: 3 },
      { vendor: "Duo Security", annual: "120k", contractEnd: "2026-02", renewalRisk: "Medium", satisfaction: 5 },
    ];
    const roiProjections = [
      { area: "Threat Detection", investment: "730k", projectedReturn: "573k", roiMultiple: "1.9x", confidence: 78 },
      { area: "Incident Reduction", investment: "773k", projectedReturn: "620k", roiMultiple: "1.8x", confidence: 95 },
      { area: "Compliance Savings", investment: "816k", projectedReturn: "667k", roiMultiple: "1.7x", confidence: 76 },
      { area: "Automation Gains", investment: "859k", projectedReturn: "714k", roiMultiple: "1.6x", confidence: 93 },
      { area: "Risk Avoidance", investment: "101k", projectedReturn: "761k", roiMultiple: "1.5x", confidence: 74 },
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
      { id: "kpi-1", name: "MTTD", owner: "SOC", unit: "minutes", target: 97, current: 78, benchmark: 74, collection: "auto", frequency: "realtime" },
      { id: "kpi-2", name: "MTTR", owner: "GRC", unit: "%", target: 70, current: 85, benchmark: 85, collection: "semi-auto", frequency: "daily" },
      { id: "kpi-3", name: "MTTC", owner: "AppSec", unit: "score", target: 73, current: 92, benchmark: 96, collection: "manual", frequency: "weekly" },
      { id: "kpi-4", name: "Vuln SLA Compliance", owner: "Cloud Sec", unit: "count", target: 76, current: 99, benchmark: 73, collection: "auto", frequency: "monthly" },
      { id: "kpi-5", name: "Patch Coverage", owner: "Identity", unit: "days", target: 79, current: 60, benchmark: 84, collection: "semi-auto", frequency: "realtime" },
      { id: "kpi-6", name: "Phishing Click Rate", owner: "Threat Intel", unit: "minutes", target: 82, current: 67, benchmark: 95, collection: "manual", frequency: "daily" },
      { id: "kpi-7", name: "Training Completion", owner: "Security Ops", unit: "%", target: 85, current: 74, benchmark: 72, collection: "auto", frequency: "weekly" },
      { id: "kpi-8", name: "Escalation Rate", owner: "Risk Mgmt", unit: "score", target: 88, current: 81, benchmark: 83, collection: "semi-auto", frequency: "monthly" },
      { id: "kpi-9", name: "False Positive Rate", owner: "SOC", unit: "count", target: 91, current: 88, benchmark: 94, collection: "manual", frequency: "realtime" },
      { id: "kpi-10", name: "Threat Intel Actionability", owner: "GRC", unit: "days", target: 94, current: 95, benchmark: 71, collection: "auto", frequency: "daily" },
      { id: "kpi-11", name: "Endpoint Compliance", owner: "AppSec", unit: "minutes", target: 97, current: 56, benchmark: 82, collection: "semi-auto", frequency: "weekly" },
      { id: "kpi-12", name: "Cloud Misconfig Score", owner: "Cloud Sec", unit: "%", target: 70, current: 63, benchmark: 93, collection: "manual", frequency: "monthly" },
      { id: "kpi-13", name: "Identity Anomaly Rate", owner: "Identity", unit: "score", target: 73, current: 70, benchmark: 70, collection: "auto", frequency: "realtime" },
      { id: "kpi-14", name: "DLP Events", owner: "Threat Intel", unit: "count", target: 76, current: 77, benchmark: 81, collection: "semi-auto", frequency: "daily" },
      { id: "kpi-15", name: "Vendor Risk Avg", owner: "Security Ops", unit: "days", target: 79, current: 84, benchmark: 92, collection: "manual", frequency: "weekly" },
      { id: "kpi-16", name: "Compliance Audit Pass Rate", owner: "Risk Mgmt", unit: "minutes", target: 82, current: 91, benchmark: 69, collection: "auto", frequency: "monthly" },
      { id: "kpi-17", name: "Awareness Score", owner: "SOC", unit: "%", target: 85, current: 98, benchmark: 80, collection: "semi-auto", frequency: "realtime" },
      { id: "kpi-18", name: "SOC Utilization", owner: "GRC", unit: "score", target: 88, current: 59, benchmark: 91, collection: "manual", frequency: "daily" },
      { id: "kpi-19", name: "Automation Coverage", owner: "AppSec", unit: "count", target: 91, current: 66, benchmark: 68, collection: "auto", frequency: "weekly" },
      { id: "kpi-20", name: "Risk Register Currency", owner: "Cloud Sec", unit: "days", target: 94, current: 73, benchmark: 79, collection: "semi-auto", frequency: "monthly" },
    ];
    const benchmarkSources = [
      { source: "NIST CSF", mappedKPIs: 6, alignment: 75, lastReview: "2026-04-14", status: "aligned" },
      { source: "CIS Controls v8", mappedKPIs: 7, alignment: 92, lastReview: "2026-05-09", status: "partial" },
      { source: "ISO 27001:2022", mappedKPIs: 8, alignment: 70, lastReview: "2026-06-04", status: "reviewing" },
      { source: "PCI DSS 4.0", mappedKPIs: 3, alignment: 87, lastReview: "2026-01-27", status: "aligned" },
      { source: "SOC 2 Type II", mappedKPIs: 4, alignment: 65, lastReview: "2026-02-22", status: "partial" },
      { source: "MITRE ATT&CK", mappedKPIs: 5, alignment: 82, lastReview: "2026-03-17", status: "reviewing" },
      { source: "SANS Top 20", mappedKPIs: 6, alignment: 60, lastReview: "2026-04-12", status: "aligned" },
      { source: "OWASP Top 10", mappedKPIs: 7, alignment: 77, lastReview: "2026-05-07", status: "partial" },
    ];
    const normalizationRules = [
      { rule: "Time metrics normalized to minutes", appliesTo: 5, exceptions: 0, version: "v1.7" },
      { rule: "Percentage metrics capped at 100", appliesTo: 4, exceptions: 1, version: "v1.4" },
      { rule: "Count metrics use 7-day rolling avg", appliesTo: 3, exceptions: 2, version: "v1.1" },
      { rule: "Score metrics use 0-100 scale", appliesTo: 7, exceptions: 0, version: "v1.8" },
      { rule: "Rate metrics per 1000 events", appliesTo: 6, exceptions: 1, version: "v1.5" },
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
      { id: "HC-1001", name: "Lateral Movement Sweep", status: "active", hypothesis: "H1: Actors using pass-the-hash for lateral movement", leadHunter: "Alice Chen", findings: 25, startDate: "2026-02-06", endDate: null, effectiveness: 85 },
      { id: "HC-1002", name: "Credential Harvesting Hunt", status: "completed", hypothesis: "H2: Actors using web shells for persistence", leadHunter: "Bob Martinez", findings: 28, startDate: "2026-01-17", endDate: "2026-06-23", effectiveness: 45 },
      { id: "HC-1003", name: "Persistence Mechanism Audit", status: "planned", hypothesis: "H3: Actors using scheduled tasks for data theft", leadHunter: "Carol Wu", findings: 31, startDate: "2026-04-28", endDate: null, effectiveness: 64 },
      { id: "HC-1004", name: "C2 Beacon Detection", status: "in-review", hypothesis: "H4: Actors using DNS tunneling for C2 communication", leadHunter: "Dave Kim", findings: 34, startDate: "2026-03-11", endDate: null, effectiveness: 83 },
      { id: "HC-1005", name: "Data Exfiltration Patterns", status: "active", hypothesis: "H5: Actors using encrypted channels for privilege escalation", leadHunter: "Eve Johnson", findings: 37, startDate: "2026-02-22", endDate: null, effectiveness: 43 },
      { id: "HC-1006", name: "Privilege Escalation Scan", status: "completed", hypothesis: "H6: Actors using token impersonation for defense evasion", leadHunter: "Frank Liu", findings: 40, startDate: "2026-01-05", endDate: "2026-04-07", effectiveness: 62 },
      { id: "HC-1007", name: "Supply Chain Implant Hunt", status: "planned", hypothesis: "H7: Actors using poisoned images for initial access", leadHunter: "Grace Park", findings: 43, startDate: "2026-04-16", endDate: null, effectiveness: 81 },
      { id: "HC-1008", name: "Insider Threat Indicators", status: "in-review", hypothesis: "H8: Actors using legitimate tools for credential access", leadHunter: "Hector Silva", findings: 46, startDate: "2026-03-27", endDate: null, effectiveness: 41 },
      { id: "HC-1009", name: "Cloud Metadata Analysis", status: "active", hypothesis: "H9: Actors using API keys for command execution", leadHunter: "Alice Chen", findings: 1, startDate: "2026-02-10", endDate: null, effectiveness: 60 },
      { id: "HC-1010", name: "DNS Tunnel Detection", status: "completed", hypothesis: "H10: Actors using encoded subdomains for exfiltration", leadHunter: "Bob Martinez", findings: 4, startDate: "2026-01-21", endDate: "2026-05-19", effectiveness: 79 },
      { id: "HC-1011", name: "Fileless Malware Search", status: "planned", hypothesis: "H11: Actors using WMI providers for discovery", leadHunter: "Carol Wu", findings: 7, startDate: "2026-04-04", endDate: null, effectiveness: 98 },
      { id: "HC-1012", name: "Zero-Day Exploit Traces", status: "in-review", hypothesis: "H12: Actors using exploit kits for collection", leadHunter: "Dave Kim", findings: 10, startDate: "2026-03-15", endDate: null, effectiveness: 58 },
    ];
    const hunterLeaderboard = [
      { hunter: "Alice Chen", campaigns: 4, findings: 18, highSeverity: 1, avgScore: 92, streak: 2 },
      { hunter: "Bob Martinez", campaigns: 14, findings: 47, highSeverity: 6, avgScore: 85, streak: 3 },
      { hunter: "Carol Wu", campaigns: 11, findings: 76, highSeverity: 11, avgScore: 78, streak: 4 },
      { hunter: "Dave Kim", campaigns: 8, findings: 105, highSeverity: 16, avgScore: 71, streak: 5 },
      { hunter: "Eve Johnson", campaigns: 5, findings: 18, highSeverity: 21, avgScore: 64, streak: 6 },
      { hunter: "Frank Liu", campaigns: 15, findings: 47, highSeverity: 0, avgScore: 57, streak: 7 },
      { hunter: "Grace Park", campaigns: 12, findings: 76, highSeverity: 5, avgScore: 94, streak: 8 },
      { hunter: "Hector Silva", campaigns: 9, findings: 105, highSeverity: 10, avgScore: 87, streak: 1 },
    ];
    const mitreMapping = [
      { tactic: "Initial Access", techniques: 6, campaigns: 2, coverage: 83 },
      { tactic: "Execution", techniques: 5, campaigns: 1, coverage: 63 },
      { tactic: "Persistence", techniques: 4, campaigns: 6, coverage: 43 },
      { tactic: "Privilege Escalation", techniques: 3, campaigns: 5, coverage: 94 },
      { tactic: "Defense Evasion", techniques: 2, campaigns: 4, coverage: 74 },
      { tactic: "Credential Access", techniques: 12, campaigns: 3, coverage: 54 },
      { tactic: "Discovery", techniques: 11, campaigns: 2, coverage: 34 },
      { tactic: "Lateral Movement", techniques: 10, campaigns: 1, coverage: 85 },
      { tactic: "Collection", techniques: 9, campaigns: 6, coverage: 65 },
      { tactic: "Exfiltration", techniques: 8, campaigns: 5, coverage: 45 },
      { tactic: "Command & Control", techniques: 7, campaigns: 4, coverage: 96 },
      { tactic: "Impact", techniques: 6, campaigns: 3, coverage: 76 },
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
      { id: "CTL-2001", name: "MFA Enforcement", domain: "Access Control", status: "implemented", effectiveness: 82, lastTest: "2026-02-26", nextReview: "2026-06-26", owner: "SOC", risk: "Low" },
      { id: "CTL-2002", name: "Network Segmentation", domain: "Network Security", status: "partial", effectiveness: 27, lastTest: "2026-01-11", nextReview: "2026-07-17", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2003", name: "EDR Deployment", domain: "Endpoint Protection", status: "planned", effectiveness: 34, lastTest: "2026-04-24", nextReview: "2026-08-08", owner: "IT Ops", risk: "High" },
      { id: "CTL-2004", name: "DLP Policy", domain: "Data Protection", status: "gap", effectiveness: 41, lastTest: "2026-03-09", nextReview: "2026-09-27", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2005", name: "SSO Integration", domain: "Identity Management", status: "implemented", effectiveness: 94, lastTest: "2026-02-22", nextReview: "2026-10-18", owner: "IAM", risk: "Low" },
      { id: "CTL-2006", name: "SAST Pipeline", domain: "Application Security", status: "partial", effectiveness: 4, lastTest: "2026-01-07", nextReview: "2026-11-09", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2007", name: "CSPM Scanning", domain: "Cloud Security", status: "planned", effectiveness: 11, lastTest: "2026-04-20", nextReview: "2026-12-28", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2008", name: "Badge Access", domain: "Physical Security", status: "gap", effectiveness: 18, lastTest: "2026-03-05", nextReview: "2026-05-19", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2009", name: "Least Privilege", domain: "Access Control", status: "implemented", effectiveness: 47, lastTest: "2026-02-18", nextReview: "2026-06-10", owner: "SOC", risk: "Low" },
      { id: "CTL-2010", name: "Firewall Rules", domain: "Network Security", status: "partial", effectiveness: 32, lastTest: "2026-01-03", nextReview: "2026-07-01", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2011", name: "Disk Encryption", domain: "Endpoint Protection", status: "planned", effectiveness: 39, lastTest: "2026-04-16", nextReview: "2026-08-20", owner: "IT Ops", risk: "High" },
      { id: "CTL-2012", name: "Data Classification", domain: "Data Protection", status: "gap", effectiveness: 46, lastTest: "2026-03-01", nextReview: "2026-09-11", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2013", name: "PAM Implementation", domain: "Identity Management", status: "implemented", effectiveness: 59, lastTest: "2026-02-14", nextReview: "2026-10-02", owner: "IAM", risk: "Low" },
      { id: "CTL-2014", name: "DAST Pipeline", domain: "Application Security", status: "partial", effectiveness: 9, lastTest: "2026-01-27", nextReview: "2026-11-21", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2015", name: "IAM Policy Review", domain: "Cloud Security", status: "planned", effectiveness: 16, lastTest: "2026-04-12", nextReview: "2026-12-12", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2016", name: "Visitor Management", domain: "Physical Security", status: "gap", effectiveness: 23, lastTest: "2026-03-25", nextReview: "2026-05-03", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2017", name: "Access Reviews", domain: "Access Control", status: "implemented", effectiveness: 71, lastTest: "2026-02-10", nextReview: "2026-06-22", owner: "SOC", risk: "Low" },
      { id: "CTL-2018", name: "IDS/IPS Tuning", domain: "Network Security", status: "partial", effectiveness: 37, lastTest: "2026-01-23", nextReview: "2026-07-13", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2019", name: "Patch Management", domain: "Endpoint Protection", status: "planned", effectiveness: 44, lastTest: "2026-04-08", nextReview: "2026-08-04", owner: "IT Ops", risk: "High" },
      { id: "CTL-2020", name: "Backup Encryption", domain: "Data Protection", status: "gap", effectiveness: 0, lastTest: "2026-03-21", nextReview: "2026-09-23", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2021", name: "Password Policy", domain: "Identity Management", status: "implemented", effectiveness: 83, lastTest: "2026-02-06", nextReview: "2026-10-14", owner: "IAM", risk: "Low" },
      { id: "CTL-2022", name: "Container Scanning", domain: "Application Security", status: "partial", effectiveness: 14, lastTest: "2026-01-19", nextReview: "2026-11-05", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2023", name: "WAF Configuration", domain: "Cloud Security", status: "planned", effectiveness: 21, lastTest: "2026-04-04", nextReview: "2026-12-24", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2024", name: "CCTV Coverage", domain: "Physical Security", status: "gap", effectiveness: 28, lastTest: "2026-03-17", nextReview: "2026-05-15", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2025", name: "RBAC Enforcement", domain: "Access Control", status: "implemented", effectiveness: 95, lastTest: "2026-02-02", nextReview: "2026-06-06", owner: "SOC", risk: "Low" },
      { id: "CTL-2026", name: "VPN Management", domain: "Network Security", status: "partial", effectiveness: 42, lastTest: "2026-01-15", nextReview: "2026-07-25", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2027", name: "App Whitelisting", domain: "Endpoint Protection", status: "planned", effectiveness: 49, lastTest: "2026-04-28", nextReview: "2026-08-16", owner: "IT Ops", risk: "High" },
      { id: "CTL-2028", name: "Key Management", domain: "Data Protection", status: "gap", effectiveness: 5, lastTest: "2026-03-13", nextReview: "2026-09-07", owner: "Data Gov", risk: "Critical" },
    ];
    const gapAnalysis = [
      { gap: "Insufficient MFA coverage for legacy apps", severity: "High", remediationPlan: "Plan R3001", eta: "2026-Q4", estimatedCost: "189k" },
      { gap: "Missing network micro-segmentation", severity: "Medium", remediationPlan: "Plan R3002", eta: "2026-Q3", estimatedCost: "37k" },
      { gap: "Inconsistent EDR deployment", severity: "Medium", remediationPlan: "Plan R3003", eta: "2026-Q2", estimatedCost: "66k" },
      { gap: "DLP not covering cloud storage", severity: "Low", remediationPlan: "Plan R3004", eta: "2026-Q4", estimatedCost: "95k" },
      { gap: "SSO not integrated with all SaaS", severity: "High", remediationPlan: "Plan R3005", eta: "2026-Q3", estimatedCost: "124k" },
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
      { id: "INC-7001", name: "Security Incident 1", severity: "Critical", totalCost: 1503000, responseCost: 270540, recoveryCost: 345690, legalCost: 210420, regulatoryCost: 105210, insuranceClaim: 450900, avoidedCost: 206000, date: "2026-02-18" },
      { id: "INC-7002", name: "Security Incident 2", severity: "High", totalCost: 1506000, responseCost: 376500, recoveryCost: 512040, legalCost: 165660, regulatoryCost: 195780, insuranceClaim: 0, avoidedCost: 235000, date: "2026-01-27" },
      { id: "INC-7003", name: "Security Incident 3", severity: "Medium", totalCost: 1509000, responseCost: 482880, recoveryCost: 362160, legalCost: 120720, regulatoryCost: 120720, insuranceClaim: 1146840, avoidedCost: 264000, date: "2026-04-08" },
      { id: "INC-7004", name: "Security Incident 4", severity: "Low", totalCost: 1512000, responseCost: 272160, recoveryCost: 529200, legalCost: 75600, regulatoryCost: 211680, insuranceClaim: 0, avoidedCost: 293000, date: "2026-03-17" },
      { id: "INC-7005", name: "Security Incident 5", severity: "Critical", totalCost: 1515000, responseCost: 378750, recoveryCost: 378750, legalCost: 272700, regulatoryCost: 136350, insuranceClaim: 1075650, avoidedCost: 322000, date: "2026-02-26" },
      { id: "INC-7006", name: "Security Incident 6", severity: "High", totalCost: 1518000, responseCost: 485760, recoveryCost: 546480, legalCost: 227700, regulatoryCost: 227700, insuranceClaim: 0, avoidedCost: 351000, date: "2026-01-07" },
      { id: "INC-7007", name: "Security Incident 7", severity: "Medium", totalCost: 1521000, responseCost: 273780, recoveryCost: 395460, legalCost: 182520, regulatoryCost: 152100, insuranceClaim: 1003860, avoidedCost: 380000, date: "2026-04-16" },
      { id: "INC-7008", name: "Security Incident 8", severity: "Low", totalCost: 1524000, responseCost: 381000, recoveryCost: 563880, legalCost: 137160, regulatoryCost: 76200, insuranceClaim: 0, avoidedCost: 409000, date: "2026-03-25" },
      { id: "INC-7009", name: "Security Incident 9", severity: "Critical", totalCost: 1527000, responseCost: 488640, recoveryCost: 412290, legalCost: 91620, regulatoryCost: 167970, insuranceClaim: 931470, avoidedCost: 438000, date: "2026-02-06" },
      { id: "INC-7010", name: "Security Incident 10", severity: "High", totalCost: 1530000, responseCost: 275400, recoveryCost: 581400, legalCost: 290700, regulatoryCost: 91800, insuranceClaim: 0, avoidedCost: 467000, date: "2026-01-15" },
      { id: "INC-7011", name: "Security Incident 11", severity: "Medium", totalCost: 1533000, responseCost: 383250, recoveryCost: 429240, legalCost: 245280, regulatoryCost: 183960, insuranceClaim: 858480, avoidedCost: 496000, date: "2026-04-24" },
      { id: "INC-7012", name: "Security Incident 12", severity: "Low", totalCost: 1536000, responseCost: 491520, recoveryCost: 599040, legalCost: 199680, regulatoryCost: 107520, insuranceClaim: 0, avoidedCost: 29000, date: "2026-03-05" },
    ];
    const yearlyTrend = [
      { month: "Jan", incidents: 4, totalCost: "147k", avgCost: "103k", insured: 20 },
      { month: "Feb", incidents: 12, totalCost: "190k", avgCost: "150k", insured: 20 },
      { month: "Mar", incidents: 9, totalCost: "233k", avgCost: "197k", insured: 20 },
      { month: "Apr", incidents: 6, totalCost: "276k", avgCost: "63k", insured: 20 },
      { month: "May", incidents: 3, totalCost: "319k", avgCost: "110k", insured: 20 },
      { month: "Jun", incidents: 11, totalCost: "362k", avgCost: "157k", insured: 20 },
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


declare global { interface HTMLElementTagNameMap { 'sc-metrics-kpi-dashboard': ScMetricsKpiDashboard; } }
