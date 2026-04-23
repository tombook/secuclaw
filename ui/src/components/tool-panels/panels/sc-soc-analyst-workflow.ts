/**
 * sc-soc-analyst-workflow — SOC Analyst Workflow Automation
 * Alert triage, case management, and analyst workload balancing
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface Alert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  time: string;
  assignee: string | null;
  status: 'new' | 'triage' | 'investigating' | 'escalated' | 'resolved';
  ruleName: string;
}

interface Case {
  id: string;
  title: string;
  alerts: number;
  severity: string;
  status: string;
  assignee: string;
  created: string;
  sla: string;
}

interface Analyst {
  name: string;
  activeCases: number;
  resolvedToday: number;
  avgResolution: string;
  load: number;
}

@customElement('sc-soc-analyst-workflow')
export class ScSocAnalystWorkflow extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 16px; }
    .stat { background: #1f2937; border-radius: 8px; padding: 12px; text-align: center; }
    .sv { font-size: 20px; font-weight: 700; }
    .sl { font-size: 9px; color: #94a3b8; margin-top: 2px; text-transform: uppercase; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; color: #94a3b8; }
    .tab:hover { background: #374151; }
    .tab.active { background: #f59e0b; color: #111827; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .section { background: #1f2937; border-radius: 8px; padding: 14px; }
    .stitle { font-weight: 600; font-size: 12px; margin-bottom: 10px; color: #94a3b8; text-transform: uppercase; }
    .alert-row { background: #0f172a; border-left: 3px solid; border-radius: 4px; padding: 10px; margin-bottom: 6px; cursor: pointer; transition: all 0.2s; }
    .alert-row:hover { background: #1c1f2e; }
    .alert-row.critical { border-color: #ef4444; }
    .alert-row.high { border-color: #f97316; }
    .alert-row.medium { border-color: #eab308; }
    .alert-row.low { border-color: #22c55e; }
    .alert-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
    .alert-title { font-weight: 600; font-size: 12px; }
    .alert-meta { display: flex; gap: 12px; font-size: 10px; color: #6b7280; }
    .badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .b-new { background: #450a0a; color: #fca5a5; }
    .b-triage { background: #422006; color: #fde047; }
    .b-investigating { background: #172554; color: #93c5fd; }
    .b-escalated { background: #7f1d1d; color: #fca5a5; }
    .b-resolved { background: #052e16; color: #86efac; }
    .analyst-card { background: #0f172a; border-radius: 6px; padding: 10px; margin-bottom: 6px; display: flex; align-items: center; gap: 10px; }
    .analyst-avatar { width: 36px; height: 36px; border-radius: 50%; background: #374151; display: flex; align-items: center; justify-content: center; font-weight: 700; }
    .analyst-info { flex: 1; }
    .analyst-name { font-weight: 600; font-size: 12px; }
    .analyst-meta { font-size: 10px; color: #6b7280; }
    .load-bar { width: 60px; height: 6px; background: #374151; border-radius: 3px; overflow: hidden; }
    .load-fill { height: 100%; border-radius: 3px; }
    .case-card { background: #0f172a; border-radius: 6px; padding: 12px; margin-bottom: 6px; }
    .case-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .runbook-btn { background: #3b82f6; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; font-weight: 600; cursor: pointer; }
    .runbook-btn:hover { background: #2563eb; }
    .handoff-box { background: #0f172a; border-radius: 8px; padding: 14px; margin-top: 12px; }
    textarea { width: 100%; padding: 8px; background: #0f172a; border: 1px solid #374151; border-radius: 6px; color: #e2e8f0; font-size: 11px; font-family: inherit; outline: none; resize: vertical; min-height: 50px; }
    .tag { display: inline-block; padding: 2px 6px; background: #374151; border-radius: 4px; font-size: 9px; color: #94a3b8; }
    .approval-row { display: flex; align-items: center; gap: 10px; padding: 10px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; }
    .approval-btn { padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 600; cursor: pointer; border: none; }
    .approval-btn.approve { background: #22c55e; color: #fff; }
    .approval-btn.reject { background: #ef4444; color: #fff; }
    .task-row { display: flex; align-items: center; gap: 10px; padding: 10px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; }
    .task-check { accent-color: #22c55e; width: 16px; height: 16px; }
    .status-badge { font-size: 9px; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
    .status-badge.in-progress { background: #f59e0b20; color: #f59e0b; }
    .status-badge.pending { background: #374151; color: #94a3b8; }
    .status-badge.completed { background: #22c55e20; color: #22c55e; }
    .playbook-step { display: flex; gap: 12px; padding: 10px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; align-items: flex-start; }
    .step-num { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .step-num.done { background: #22c55e; color: #fff; }
    .step-num.active { background: #f59e0b; color: #111; }
    .step-num.wait { background: #374151; color: #94a3b8; }
    .export-btn { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; }
    .export-btn:hover { border-color: #f59e0b; }
    .exec-pipeline { background: #0f172a; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .pipeline-step { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #1f2937; }
    .pipeline-step:last-child { border-bottom: none; }
    .step-icon { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .step-icon.pending { background: #374151; color: #6b7280; }
    .step-icon.running { background: #f59e0b20; color: #f59e0b; animation: pulse 1.5s infinite; }
    .step-icon.done { background: #22c55e20; color: #22c55e; }
    .step-icon.error { background: #ef444420; color: #ef4444; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    .step-info { flex: 1; }
    .step-name { font-size: 12px; font-weight: 600; }
    .step-desc { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .step-time { font-size: 10px; color: #94a3b8; min-width: 60px; text-align: right; }
    .sla-timer { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; }
    .sla-bar { flex: 1; height: 6px; background: #374151; border-radius: 3px; overflow: hidden; }
    .sla-fill { height: 100%; border-radius: 3px; transition: width 0.5s; }
    .sla-label { font-size: 10px; min-width: 60px; text-align: right; font-weight: 600; }
    .config-section { background: #0f172a; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .config-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #1f2937; }
    .config-row:last-child { border-bottom: none; }
    .config-label { font-size: 12px; color: #e2e8f0; }
    .config-desc { font-size: 10px; color: #6b7280; margin-top: 2px; }
    .config-toggle { position: relative; width: 40px; height: 22px; background: #374151; border-radius: 11px; cursor: pointer; transition: background 0.3s; border: none; }
    .config-toggle.on { background: #f59e0b; }
    .config-toggle::after { content: ''; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; background: #fff; border-radius: 50%; transition: transform 0.3s; }
    .config-toggle.on::after { transform: translateX(18px); }
    .audit-entry { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid #1f2937; font-size: 10px; }
    .audit-time { color: #6b7280; min-width: 120px; flex-shrink: 0; }
    .audit-action { color: #f59e0b; font-weight: 600; min-width: 100px; }
    .audit-detail { color: #94a3b8; }
    .form-group { margin-bottom: 12px; }
    .form-label { display: block; font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 4px; }
    .form-input { width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #374151; border-radius: 6px; color: #e2e8f0; font-size: 12px; outline: none; }
    .form-input:focus { border-color: #f59e0b; }
    .topology-svg { background: #0f172a; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .risk-card { background: #0f172a; border-radius: 8px; padding: 14px; margin-bottom: 8px; }
    .risk-factor-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid #1f2937; font-size: 11px; }
    .risk-factor-row:last-child { border-bottom: none; }
    .risk-factor-label { flex: 1; color: #94a3b8; }
    .risk-factor-bar { width: 100px; height: 6px; background: #374151; border-radius: 3px; overflow: hidden; }
    .risk-factor-fill { height: 100%; border-radius: 3px; transition: width 0.4s; }
    .risk-factor-value { min-width: 32px; text-align: right; font-weight: 700; }
    .sankey-svg { background: #0f172a; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
    .intel-row { display: flex; gap: 10px; padding: 8px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; align-items: center; }
    .intel-type { padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
    .intel-ip { font-family: monospace; font-size: 12px; color: #e2e8f0; }
    .intel-detail { flex: 1; font-size: 10px; color: #6b7280; }
    .intel-confidence { font-size: 10px; font-weight: 700; }
    .notification-dot { width: 8px; height: 8px; border-radius: 50%; background: #ef4444; position: relative; }
    .notification-dot::after { content: ''; position: absolute; top: -2px; left: -2px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #ef4444; animation: notif-pulse 1.5s infinite; }
    @keyframes notif-pulse { 0% { transform: scale(1); opacity: 0.8; } 100% { transform: scale(1.6); opacity: 0; } }
    .mention-tag { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: #3b82f620; border-radius: 12px; font-size: 10px; color: #60a5fa; }
    .trend-indicator { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 700; }
    .trend-up { color: #ef4444; }
    .trend-down { color: #22c55e; }
    .trend-flat { color: #94a3b8; }
    .insight-card { background: linear-gradient(135deg, #1f2937 0%, #0f172a 100%); border-radius: 8px; padding: 14px; margin-bottom: 8px; border-left: 3px solid #f59e0b; }
    .insight-title { font-size: 12px; font-weight: 700; color: #f59e0b; margin-bottom: 4px; }
    .insight-body { font-size: 11px; color: #94a3b8; line-height: 1.5; }
    .config-select { padding: 6px 10px; background: #0f172a; border: 1px solid #374151; border-radius: 6px; color: #e2e8f0; font-size: 11px; outline: none; }
    .config-select:focus { border-color: #f59e0b; }
    .workload-bar-container { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .workload-bar-label { font-size: 10px; color: #94a3b8; min-width: 80px; }
    .workload-bar-track { flex: 1; height: 18px; background: #1f2937; border-radius: 4px; overflow: hidden; display: flex; }
    .workload-bar-seg { height: 100%; transition: width 0.3s; }
    .workload-bar-value { font-size: 10px; font-weight: 700; min-width: 30px; text-align: right; }
    .anomaly-marker { width: 12px; height: 12px; background: #ef4444; border-radius: 50%; border: 2px solid #0f172a; animation: pulse 1.5s infinite; }
    .team-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .team-member-card { background: #0f172a; border-radius: 8px; padding: 12px; text-align: center; }
    .team-member-avatar { width: 44px; height: 44px; border-radius: 50%; margin: 0 auto 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; }
    .team-member-name { font-weight: 600; font-size: 12px; margin-bottom: 2px; }
    .team-member-role { font-size: 9px; color: #6b7280; margin-bottom: 6px; }
    .team-member-stats { display: flex; justify-content: center; gap: 12px; font-size: 10px; }
    .team-stat-item { text-align: center; }
    .team-stat-value { font-weight: 700; font-size: 14px; }
    .team-stat-label { color: #6b7280; font-size: 8px; }
  
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

  @state() private _tab: 'alerts' | 'cases' | 'workload' | 'handoff' | 'playbook' | 'tasks' | 'approvals' | 'analysis' | 'sla' | 'audit' | 'config' = 'alerts';
  @state() private _selectedAlert: string | null = null;
  @state() private _execPhase = 'idle';
  @state() private _execProgress = 0;
  @state() private _execSteps: { name: string; desc: string; status: 'pending' | 'running' | 'done' | 'error'; duration: number }[] = [];
  @state() private _execResults: { step: string; output: string; timestamp: string }[] = [];
  @state() private _execHistory: { id: string; name: string; completedAt: string; duration: number }[] = [];
  @state() private _auditLog: { timestamp: string; action: string; user: string; detail: string }[] = [];
  @state() private _slaItems: { id: string; case: string; assignee: string; deadline: string; elapsed: number; total: number; priority: string }[] = [];
  @state() private _configSettings: { autoEscalate: boolean; autoAssign: boolean; slaAlerts: boolean; mitreMapping: boolean; playbookAuto: boolean; shiftHandoff: boolean } = { autoEscalate: true, autoAssign: true, slaAlerts: true, mitreMapping: true, playbookAuto: false, shiftHandoff: true };
  @state() private _selectedAlertRisk: { overall: number; factors: { name: string; weight: number; score: number; color: string }[] } | null = null;
  @state() private _panelLayout: 'default' | 'compact' | 'wide' = 'default';
  @state() private _autoRefreshSec: number = 0;
  @state() private _filterPreset: 'all' | 'critical-only' | 'my-alerts' | 'unassigned' = 'all';
  @state() private _notifications: { id: string; message: string; time: string; type: string; read: boolean }[] = [];
  @state() private _showNotifPanel: boolean = false;
  @state() private _trendData: { hour: string; alerts: number; resolved: number; mttb: number }[] = [];
  @state() private _anomalyPoints: number[] = [];

  // Risk Scoring Engine
  private _calculateRiskScore(alert: Alert): { overall: number; factors: { name: string; weight: number; score: number; color: string }[] } {
    const sevScore: Record<string, number> = { critical: 95, high: 75, medium: 45, low: 15 };
    const statusPenalty: Record<string, number> = { new: 0, triage: 5, investigating: -10, escalated: 15, resolved: -50 };
    const sourceReliability: Record<string, number> = { EDR: 90, SIEM: 85, Network: 80, Firewall: 75, IAM: 70, AD: 65, DLP: 70, Endpoint: 60 };
    const mitreFactors: Record<string, number> = { 'T1059.001': 25, 'T1110': 20, 'T1203': 30, 'T1567': 20, 'T1548': 25, 'T1048': 22, 'T1091': 10, 'T1110.001': 22 };
    const assignedFactor = alert.assignee ? -10 : 15;
    const sev = sevScore[alert.severity] || 50;
    const status = statusPenalty[alert.status] || 0;
    const source = sourceReliability[alert.source] || 50;
    const mitre = mitreFactors[alert.ruleName] || 10;
    const timeUrgency = alert.status === 'new' ? 12 : 5;
    const raw = sev * 0.30 + (100 - status) * 0.15 + source * 0.15 + mitre * 0.20 + timeUrgency * 0.10 + (100 - assignedFactor) * 0.10;
    const overall = Math.min(100, Math.max(0, Math.round(raw)));
    const factors = [
      { name: 'Severity Impact', weight: 30, score: sev, color: sev >= 80 ? '#ef4444' : sev >= 50 ? '#f59e0b' : '#22c55e' },
      { name: 'Status Urgency', weight: 15, score: 100 - status, color: status >= 0 ? '#ef4444' : '#22c55e' },
      { name: 'Source Reliability', weight: 15, score: source, color: source >= 80 ? '#22c55e' : '#f59e0b' },
      { name: 'MITRE Threat Level', weight: 20, score: mitre, color: mitre >= 20 ? '#ef4444' : mitre >= 10 ? '#f59e0b' : '#22c55e' },
      { name: 'Assignment Gap', weight: 10, score: 100 - assignedFactor, color: alert.assignee ? '#22c55e' : '#ef4444' },
      { name: 'Time Pressure', weight: 10, score: timeUrgency * 5, color: timeUrgency >= 10 ? '#ef4444' : '#f59e0b' },
    ];
    return { overall, factors };
  }

  private _getRiskLevel(score: number): { label: string; color: string } {
    if (score >= 85) return { label: 'CRITICAL', color: '#ef4444' };
    if (score >= 65) return { label: 'HIGH', color: '#f97316' };
    if (score >= 40) return { label: 'MEDIUM', color: '#eab308' };
    return { label: 'LOW', color: '#22c55e' };
  }

  // MITRE ATT&CK Deep Correlation
  private _mitreTechniqueDB: { id: string; name: string; tactic: string; subtechniques: string[]; detectionRate: number; trends12h: number[] }[] = [
    { id: 'T1059.001', name: 'PowerShell', tactic: 'Execution', subtechniques: ['T1059.001', 'T1059.003'], detectionRate: 92, trends12h: [3, 5, 2, 8, 4, 6, 3, 7, 5, 4, 6, 8] },
    { id: 'T1110', name: 'Brute Force', tactic: 'Credential Access', subtechniques: ['T1110.001', 'T1110.003'], detectionRate: 88, trends12h: [2, 3, 5, 4, 3, 6, 8, 5, 4, 7, 6, 5] },
    { id: 'T1203', name: 'Exploitation for Client Execution', tactic: 'Execution', subtechniques: ['T1203.001', 'T1203.002'], detectionRate: 75, trends12h: [1, 0, 2, 1, 3, 2, 1, 0, 2, 3, 1, 2] },
    { id: 'T1567', name: 'Exfiltration Over Web Service', tactic: 'Exfiltration', subtechniques: ['T1567.001'], detectionRate: 68, trends12h: [0, 1, 0, 2, 1, 0, 1, 2, 3, 1, 0, 1] },
    { id: 'T1548', name: 'Abuse Elevation Control Mechanism', tactic: 'Privilege Escalation', subtechniques: ['T1548.001', 'T1548.002'], detectionRate: 82, trends12h: [1, 2, 1, 3, 2, 1, 2, 4, 3, 2, 3, 4] },
    { id: 'T1048', name: 'Exfiltration Over Alternative Protocol', tactic: 'Exfiltration', subtechniques: ['T1048.001', 'T1048.003'], detectionRate: 55, trends12h: [0, 0, 1, 0, 1, 2, 1, 0, 1, 2, 3, 2] },
    { id: 'T1071', name: 'Application Layer Protocol', tactic: 'Command and Control', subtechniques: ['T1071.001'], detectionRate: 78, trends12h: [4, 3, 5, 4, 6, 5, 7, 6, 5, 8, 7, 6] },
    { id: 'T1083', name: 'File and Directory Discovery', tactic: 'Discovery', subtechniques: [], detectionRate: 95, trends12h: [12, 15, 10, 18, 14, 16, 12, 19, 15, 13, 17, 14] },
  ];

  private _correlateTechniques(alertIds: string[]): { relatedTechs: string[]; killChainGaps: string[]; riskMultiplier: number } {
    const ruleNames = alertIds.map(id => this._alerts.find(a => a.id === id)?.ruleName).filter(Boolean) as string[];
    const activeTechniques = new Set<string>();
    ruleNames.forEach(rn => {
      const mapping = this._mitreMap[rn];
      if (mapping) activeTechniques.add(mapping.id);
    });
    const related: string[] = [];
    const allTechs = this._mitreTechniqueDB;
    allTechs.forEach(tech => {
      if (activeTechniques.has(tech.id)) {
        related.push(tech.id, ...tech.subtechniques.filter(s => !activeTechniques.has(s)));
      }
    });
    const killChainPhases = ['Initial Access', 'Execution', 'Persistence', 'Privilege Escalation', 'Defense Evasion', 'Credential Access', 'Discovery', 'Lateral Movement', 'Collection', 'Exfiltration', 'Command and Control', 'Impact'];
    const activeTactics = new Set<string>();
    allTechs.filter(t => activeTechniques.has(t.id)).forEach(t => activeTactics.add(t.tactic));
    const gaps = killChainPhases.filter(p => !activeTactics.has(p)).slice(0, 4);
    const multiplier = 1 + (activeTechniques.size * 0.15) + (gaps.length < 5 ? 0.3 : 0);
    return { relatedTechs: [...new Set(related)], killChainGaps: gaps, riskMultiplier: Math.min(3, multiplier) };
  }

  // Trend Analysis Engine
  private _initTrendData() {
    const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    this._trendData = hours.map((h, i) => ({
      hour: h,
      alerts: i >= 4 && i <= 9 ? Math.floor(Math.random() * 20) + 15 : Math.floor(Math.random() * 8) + 3,
      resolved: i >= 4 && i <= 9 ? Math.floor(Math.random() * 15) + 10 : Math.floor(Math.random() * 6) + 2,
      mttb: i >= 4 && i <= 9 ? Math.floor(Math.random() * 5) + 2 : Math.floor(Math.random() * 10) + 5,
    }));
    this._detectAnomalies();
  }

  private _detectAnomalies() {
    const values = this._trendData.map(d => d.alerts);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length) || 1;
    this._anomalyPoints = values.map((v, i) => Math.abs(v - mean) / std > 1.8 ? i : -1).filter(i => i >= 0);
  }

  private _linearRegression(data: number[]): { slope: number; intercept: number; trend: 'up' | 'down' | 'stable' } {
    const n = data.length || 1;
    const sumX = data.reduce((s, _, i) => s + i, 0);
    const sumY = data.reduce((s, v) => s + v, 0);
    const sumXY = data.reduce((s, v, i) => s + i * v, 0);
    const sumX2 = data.reduce((s, _, i) => s + i * i, 0);
    const denom = n * sumX2 - sumX * sumX || 1;
    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;
    const trend = slope > 0.5 ? 'up' as const : slope < -0.5 ? 'down' as const : 'stable' as const;
    return { slope, intercept, trend };
  }

  // Threat Intelligence Data
  private _threatIntelFeed: { type: 'ip' | 'domain' | 'hash' | 'url'; value: string; confidence: number; threatActor: string; firstSeen: string; description: string; tags: string[] }[] = [
    { type: 'ip', value: '185.174.xxx.xxx', confidence: 92, threatActor: 'APT-29', firstSeen: '2026-04-20', description: 'C2 beacon communication detected', tags: ['c2', 'beacon', 'apt29'] },
    { type: 'domain', value: 'update-service[.]cloud', confidence: 88, threatActor: 'APT-29', firstSeen: '2026-04-19', description: 'Mimics legitimate update service', tags: ['phishing', 'dns', 'apt29'] },
    { type: 'hash', value: 'a3f2b8c1d4e5...', confidence: 95, threatActor: 'Cobalt Strike', firstSeen: '2026-04-18', description: 'Cobalt Strike beacon DLL', tags: ['malware', 'beacon', 'cobalt'] },
    { type: 'ip', value: '91.234.xxx.xxx', confidence: 76, threatActor: 'Unknown', firstSeen: '2026-04-22', description: 'Port scanning activity from this IP', tags: ['recon', 'scanner'] },
    { type: 'url', value: 'https://evil[.]com/login', confidence: 83, threatActor: 'FIN7', firstSeen: '2026-04-21', description: 'Credential harvesting landing page', tags: ['phishing', 'credential-theft'] },
    { type: 'hash', value: '7e2a1b3c5d8f...', confidence: 71, threatActor: 'Lazarus', firstSeen: '2026-04-17', description: 'Ransomware dropper variant', tags: ['ransomware', 'dropper'] },
  ];

  // Notification system
  private _initNotifications() {
    this._notifications = [
      { id: 'n1', message: 'CRITICAL: New ransomware precursor detected on ws-finance-03', time: '2 min ago', type: 'critical', read: false },
      { id: 'n2', message: 'SLA Warning: Case c2 is overdue by 30 minutes', time: '15 min ago', type: 'warning', read: false },
      { id: 'n3', message: 'Chen Li resolved alert a7 - USB device blocked', time: '30 min ago', type: 'info', read: false },
      { id: 'n4', message: 'Shift handoff report generated successfully', time: '1h ago', type: 'info', read: true },
      { id: 'n5', message: 'MITRE ATT&CK mapping updated: 3 new techniques', time: '2h ago', type: 'info', read: true },
    ];
  }

  private _markNotifRead(id: string) {
    this._notifications = this._notifications.map(n => n.id === id ? { ...n, read: true } : n);
  }

  private _markAllNotifsRead() {
    this._notifications = this._notifications.map(n => ({ ...n, read: true }));
  }

  private _mitreMap: Record<string, { id: string; tactic: string }> = {
    'T1059.001 - PowerShell': { id: 'T1059.001', tactic: 'Execution' },
    'BRUTE_FORCE_DETECTION': { id: 'T1110', tactic: 'Credential Access' },
    'MALWARE_ALERT': { id: 'T1203', tactic: 'Execution' },
    'DLP_POLICY_VIOLATION': { id: 'T1567', tactic: 'Exfiltration' },
    'PRIV_ESC_ALERT': { id: 'T1548', tactic: 'Privilege Escalation' },
    'DNS_EXFIL_PATTERN': { id: 'T1048', tactic: 'Exfiltration' },
    'USB_DEVICE_BLOCK': { id: 'T1091', tactic: 'Initial Access' },
    'RDP_BRUTE_FORCE': { id: 'T1110.001', tactic: 'Credential Access' },
  };

  private _playbookSteps = [
    { step: 1, name: 'Alert Detection', desc: 'Alert triggered by SIEM correlation rule', status: 'done' as const, techniques: ['T1059', 'T1110'] },
    { step: 2, name: 'Initial Triage', desc: 'Analyst reviews alert context, assigns severity', status: 'done' as const, techniques: ['T1071'] },
    { step: 3, name: 'Enrichment', desc: 'Gather IOC data, check threat intel feeds', status: 'done' as const, techniques: ['T1595'] },
    { step: 4, name: 'Investigation', desc: 'Deep dive into endpoint, network, and log evidence', status: 'active' as const, techniques: ['T1083', 'T1082'] },
    { step: 5, name: 'Containment', desc: 'Isolate affected systems, block IOCs', status: 'wait' as const, techniques: ['T1562'] },
    { step: 6, name: 'Eradication', desc: 'Remove artifacts, patch vulnerabilities', status: 'wait' as const, techniques: ['T1070'] },
    { step: 7, name: 'Recovery', desc: 'Restore systems, verify integrity', status: 'wait' as const, techniques: ['T1005'] },
    { step: 8, name: 'Lessons Learned', desc: 'Document findings, update runbooks', status: 'wait' as const, techniques: ['T1070'] },
  ];

  @state() private _taskQueue: { id: string; task: string; assignee: string; status: string; priority: string }[] = [
    { id: 'st-1', task: 'Investigate PowerShell execution on ws-finance-03', assignee: 'Chen Li', status: 'in-progress', priority: 'critical' },
    { id: 'st-2', task: 'Analyze malware sample from EDR alert', assignee: 'Wang Wei', status: 'in-progress', priority: 'critical' },
    { id: 'st-3', task: 'Review DNS tunneling alerts for false positives', assignee: 'Zhang San', status: 'pending', priority: 'medium' },
    { id: 'st-4', task: 'Update SIEM correlation rules for new threats', assignee: 'Li Si', status: 'pending', priority: 'low' },
    { id: 'st-5', task: 'Block malicious IPs at firewall', assignee: 'Chen Li', status: 'completed', priority: 'high' },
  ];

  @state() private _approvalQueue: { id: string; action: string; requester: string; status: string }[] = [
    { id: 'sa-1', action: 'Escalate ransomware case to incident commander', requester: 'Wang Wei', status: 'pending' },
    { id: 'sa-2', action: 'Block IP range 203.0.113.0/24 at perimeter', requester: 'Chen Li', status: 'pending' },
    { id: 'sa-3', action: 'Isolate ws-finance-03 from network', requester: 'EDR Auto', status: 'approved' },
  ];

  private _approveAction(id: string) { this._approvalQueue = this._approvalQueue.map(a => a.id === id ? { ...a, status: 'approved' } : a); }
  private _rejectAction(id: string) { this._approvalQueue = this._approvalQueue.map(a => a.id === id ? { ...a, status: 'rejected' } : a); }
  private _completeTask(id: string) { this._taskQueue = this._taskQueue.map(t => t.id === id ? { ...t, status: 'completed' } : t); }

  private _exportJSON() {
    const data = { alerts: this._alerts, cases: this._cases, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'soc-workflow.json'; a.click();
  }

  private _sparklineSVG(data: number[], color: string): string {
    const w = 60, h = 20, pad = 2;
    const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
    const pts = data.map((v, i) => `${pad + (i / (data.length - 1)) * (w - pad * 2)},${h - pad - ((v - min) / range) * (h - pad * 2)}`).join(' ');
    return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }

  private _gaugeSVG(value: number, label: string): string {
    const r = 30, cx = 36, cy = 36, circ = 2 * Math.PI * r;
    const offset = circ * (1 - value / 100);
    const color = value >= 90 ? '#22c55e' : value >= 70 ? '#eab308' : '#ef4444';
    return `<svg viewBox="0 0 72 72" width="72" height="72"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#1f2937" stroke-width="5"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="5" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/><text x="${cx}" y="${cy + 4}" text-anchor="middle" fill="${color}" font-size="13" font-weight="700">${value}%</text><text x="${cx}" y="${cy + 16}" text-anchor="middle" fill="#6b7280" font-size="7">${label}</text></svg>`;
  }

  private _alerts: Alert[] = [
    { id: 'a1', title: 'Suspicious PowerShell Execution', severity: 'critical', source: 'EDR', time: '2 min ago', assignee: 'Chen Li', status: 'investigating', ruleName: 'T1059.001 - PowerShell' },
    { id: 'a2', title: 'Multiple Failed Logins', severity: 'high', source: 'IAM', time: '5 min ago', assignee: null, status: 'new', ruleName: 'BRUTE_FORCE_DETECTION' },
    { id: 'a3', title: 'Malware Detected', severity: 'critical', source: 'EDR', time: '8 min ago', assignee: 'Wang Wei', status: 'escalated', ruleName: 'MALWARE_ALERT' },
    { id: 'a4', title: 'Unusual Data Access Pattern', severity: 'medium', source: 'DLP', time: '15 min ago', assignee: null, status: 'triage', ruleName: 'DLP_POLICY_VIOLATION' },
    { id: 'a5', title: 'Privilege Escalation Detected', severity: 'high', source: 'AD', time: '20 min ago', assignee: 'Zhang San', status: 'investigating', ruleName: 'PRIV_ESC_ALERT' },
    { id: 'a6', title: 'DNS Tunneling Suspected', severity: 'medium', source: 'Network', time: '30 min ago', assignee: null, status: 'new', ruleName: 'DNS_EXFIL_PATTERN' },
    { id: 'a7', title: 'Unauthorized USB Device', severity: 'low', source: 'Endpoint', time: '45 min ago', assignee: 'Li Si', status: 'resolved', ruleName: 'USB_DEVICE_BLOCK' },
    { id: 'a8', title: 'RDP Brute Force', severity: 'high', source: 'Firewall', time: '1h ago', assignee: null, status: 'triage', ruleName: 'RDP_BRUTE_FORCE' },
  ];

  private _cases: Case[] = [
    { id: 'c1', title: 'Suspected APT Activity - Finance Dept', alerts: 8, severity: 'critical', status: 'investigating', assignee: 'Chen Li', created: '2h ago', sla: '1h remaining' },
    { id: 'c2', title: 'Ransomware Precursor Indicators', alerts: 5, severity: 'critical', status: 'escalated', assignee: 'Wang Wei', created: '4h ago', sla: 'OVERDUE' },
    { id: 'c3', title: 'Insider Threat - Data Exfil', alerts: 3, severity: 'high', status: 'investigating', assignee: 'Zhang San', created: '6h ago', sla: '3h remaining' },
    { id: 'c4', title: 'Credential Compromise', alerts: 12, severity: 'high', status: 'triage', assignee: 'Unassigned', created: '8h ago', sla: '5h remaining' },
  ];

  private _analysts: Analyst[] = [
    { name: 'Chen Li', activeCases: 3, resolvedToday: 12, avgResolution: '1.2h', load: 75 },
    { name: 'Wang Wei', activeCases: 4, resolvedToday: 8, avgResolution: '1.8h', load: 90 },
    { name: 'Zhang San', activeCases: 2, resolvedToday: 15, avgResolution: '0.9h', load: 55 },
    { name: 'Li Si', activeCases: 1, resolvedToday: 20, avgResolution: '0.7h', load: 35 },
  ];

  private _initAuditLog() {
    this._auditLog = [
      { timestamp: '2026-04-22T10:35:00Z', action: 'ALERT_ESCALATE', user: 'Chen Li', detail: 'Escalated PowerShell alert to L3 specialist' },
      { timestamp: '2026-04-22T10:28:00Z', action: 'ALERT_ASSIGN', user: 'Auto', detail: 'Auto-assigned brute force alert to Zhang San based on workload' },
      { timestamp: '2026-04-22T10:15:00Z', action: 'CASE_RESOLVE', user: 'Wang Wei', detail: 'Resolved malware cluster case - 15 alerts closed' },
      { timestamp: '2026-04-22T09:45:00Z', action: 'CASE_OPEN', user: 'Zhang San', detail: 'Opened investigation case for insider threat - data exfil' },
      { timestamp: '2026-04-22T09:30:00Z', action: 'AUTO_RESOLVE', user: 'System', detail: 'Auto-resolved 23 low-severity alerts (known false positive patterns)' },
      { timestamp: '2026-04-22T09:00:00Z', action: 'IOC_BLOCK', user: 'Chen Li', detail: 'Blocked 12 IPs and 3 domains at perimeter firewall' },
      { timestamp: '2026-04-22T08:30:00Z', action: 'SHIFT_HANDOFF', user: 'Night Team', detail: 'Shift handoff: 3 active cases, 5 pending alerts' },
    ];
  }

  private _initSlaItems() {
    const now = Date.now();
    this._slaItems = [
      { id: 'sla-1', case: 'c1', assignee: 'Chen Li', deadline: new Date(now + 3600000).toISOString(), elapsed: 7200000, total: 10800000, priority: 'critical' },
      { id: 'sla-2', case: 'c2', assignee: 'Wang Wei', deadline: new Date(now - 1800000).toISOString(), elapsed: 14400000, total: 14400000, priority: 'critical' },
      { id: 'sla-3', case: 'c3', assignee: 'Zhang San', deadline: new Date(now + 10800000).toISOString(), elapsed: 21600000, total: 36000000, priority: 'high' },
      { id: 'sla-4', case: 'c4', assignee: 'Unassigned', deadline: new Date(now + 18000000).toISOString(), elapsed: 28800000, total: 43200000, priority: 'high' },
    ];
  }

  private _addAudit(action: string, user: string, detail: string) {
    this._auditLog = [{ timestamp: new Date().toISOString(), action, user, detail }, ...this._auditLog.slice(0, 49)];
  }

  private _runTriagePipeline() {
    if (this._execPhase === 'running') return;
    this._execSteps = [
      { name: 'Parse Alert', desc: 'Extract IOC indicators and context from alert payload', status: 'pending', duration: 0 },
      { name: 'Enrich Data', desc: 'Query threat intel, asset DB, and user directory', status: 'pending', duration: 0 },
      { name: 'Score Risk', desc: 'Calculate composite risk score using ML model', status: 'pending', duration: 0 },
      { name: 'Correlate', desc: 'Match against active cases and recent alert clusters', status: 'pending', duration: 0 },
      { name: 'Assign', desc: 'Determine optimal analyst based on skills and workload', status: 'pending', duration: 0 },
      { name: 'Dispatch', desc: 'Send notification and create investigation task', status: 'pending', duration: 0 },
    ];
    this._execResults = [];
    this._execPhase = 'running';
    this._execProgress = 0;
    this._execTriageStep(0);
  }

  private _execTriageStep(index: number) {
    if (index >= this._execSteps.length) {
      this._execPhase = 'complete';
      const dur = this._execSteps.reduce((s, st) => s + st.duration, 0);
      this._execHistory = [{ id: 'et-' + Date.now(), name: 'Alert Triage', completedAt: new Date().toISOString(), duration: dur }, ...this._execHistory.slice(0, 19)];
      this._addAudit('TRIAGE_COMPLETE', 'System', `Auto-triage completed in ${dur}ms`);
      return;
    }
    this._execSteps = this._execSteps.map((s, i) => i === index ? { ...s, status: 'running' as const } : i < index ? { ...s, status: 'done' as const } : s);
    this._execProgress = Math.round((index / this._execSteps.length) * 100);
    const dur = 300 + Math.random() * 500;
    setTimeout(() => {
      const outputs = [
        'Parsed 8 IOC indicators: 3 IPs, 2 domains, 2 file hashes, 1 registry key.',
        'Threat intel: 3 IOC matches (2 APT-29, 1 Cobalt Strike). Asset: ws-finance-03 (Finance subnet).',
        'Risk score: 87/100. Factors: known threat actor (35), critical asset (25), active exploitation (27).',
        'Correlated with case c1 (APT Activity - Finance). 5 related alerts in last 2 hours.',
        'Assigned to Chen Li (L3 specialist, 75% load, 3 active cases, forensics certified).',
        'Notification sent. Investigation task created. Playbook: APT Investigation v2.3 activated.',
      ];
      this._execSteps = this._execSteps.map((s, i) => i === index ? { ...s, status: 'done' as const, duration: Math.round(dur) } : s);
      this._execResults = [...this._execResults, { step: this._execSteps[index].name, output: outputs[index], timestamp: new Date().toISOString() }];
      this._execTriageStep(index + 1);
    }, dur);
  }

  private _socTopologySVG(): string {
    const nodes = [
      { id: 's1', label: 'SIEM', x: 140, y: 30, color: '#06b6d4' },
      { id: 's2', label: 'EDR', x: 60, y: 80, color: '#ef4444' },
      { id: 's3', label: 'NDR', x: 220, y: 80, color: '#f97316' },
      { id: 's4', label: 'Firewall', x: 60, y: 140, color: '#22c55e' },
      { id: 's5', label: 'IAM', x: 220, y: 140, color: '#a855f7' },
      { id: 's6', label: 'DLP', x: 140, y: 140, color: '#eab308' },
      { id: 's7', label: 'SOAR', x: 140, y: 100, color: '#3b82f6' },
      { id: 's8', label: 'TIP', x: 300, y: 50, color: '#14b8a6' },
      { id: 's9', label: 'Case Mgmt', x: 300, y: 110, color: '#ec4899' },
    ];
    const edges = [
      { from: 's2', to: 's1' }, { from: 's3', to: 's1' }, { from: 's4', to: 's1' },
      { from: 's5', to: 's1' }, { from: 's6', to: 's1' }, { from: 's1', to: 's7' },
      { from: 's7', to: 's8' }, { from: 's7', to: 's9' }, { from: 's8', to: 's7' },
    ];
    const nm = Object.fromEntries(nodes.map(n => [n.id, n]));
    let svg = '';
    edges.forEach(e => {
      const f = nm[e.from], t = nm[e.to];
      svg += `<line x1="${f.x}" y1="${f.y}" x2="${t.x}" y2="${t.y}" stroke="#374151" stroke-width="1.5"/>`;
    });
    nodes.forEach(n => {
      svg += `<circle cx="${n.x}" cy="${n.y}" r="18" fill="${n.color}" fill-opacity="0.2" stroke="${n.color}" stroke-width="2"/>`;
      svg += `<text x="${n.x}" y="${n.y + 4}" text-anchor="middle" fill="#e2e8f0" font-size="7" font-weight="600">${n.label}</text>`;
    });
    return svg;
  }

  private _slaOverviewSVG(): string {
    const W = 260, H = 100;
    const items = this._slaItems;
    let rects = '';
    items.forEach((item, i) => {
      const y = i * 22;
      const pct = Math.min(100, (item.elapsed / item.total) * 100);
      const color = pct > 100 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#22c55e';
      rects += `<rect x="80" y="${y}" width="${Math.min(pct, 100) * 1.7}" height="16" rx="3" fill="${color}" fill-opacity="0.3"/>`;
      rects += `<text x="75" y="${y + 11}" text-anchor="end" fill="#94a3b8" font-size="7">${item.assignee.split(' ')[0]}</text>`;
      rects += `<text x="${85 + Math.min(pct, 100) * 1.7}" y="${y + 11}" fill="${color}" font-size="7" font-weight="600">${pct > 100 ? 'OVERDUE' : Math.round(pct) + '%'}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${rects}</svg>`;
  }

  private _alertVolumeSVG(): string {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const data = hours.map(h => Math.floor(Math.random() * 30) + (h >= 8 && h <= 18 ? 15 : 3));
    const W = 280, H = 50;
    const max = Math.max(...data);
    const barW = W / data.length - 0.5;
    let rects = '';
    data.forEach((v, i) => {
      const h = (v / max) * (H - 6);
      const x = i * (barW + 0.5);
      const color = v > 35 ? '#ef4444' : v > 20 ? '#f59e0b' : '#22c55e';
      rects += `<rect x="${x}" y="${H - h}" width="${barW}" height="${h}" rx="1" fill="${color}" fill-opacity="0.6"/>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${rects}</svg>`;
  }

  private _mitreHeatmapSVG(): string {
    const tactics = ['Initial Access', 'Execution', 'Persistence', 'Priv Esc', 'Def Evasion', 'Credential Access', 'Discovery', 'Lateral Move', 'Collection', 'Exfiltration', 'Command Ctrl', 'Impact'];
    const data = tactics.map(() => Math.floor(Math.random() * 10));
    const W = 280, H = 120, cellW = 22, cellH = 8, gap = 1;
    let rects = '';
    tactics.forEach((t, i) => {
      const y = i * (cellH + gap);
      const x = 60;
      rects += `<text x="${x - 4}" y="${y + 7}" text-anchor="end" fill="#94a3b8" font-size="6">${t}</text>`;
      for (let j = 0; j < 10; j++) {
        const active = j < data[i];
        const color = active ? (j >= 7 ? '#ef4444' : j >= 4 ? '#f59e0b' : '#22c55e') : '#1f2937';
        rects += `<rect x="${x + j * (cellW + gap)}" y="${y}" width="${cellW}" height="${cellH}" rx="1" fill="${color}" fill-opacity="${active ? '0.6' : '0.3'}"/>`;
      }
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${rects}</svg>`;
  }

  private _caseTimelineSVG(): string {
    const cases = this._cases.map((c, i) => ({
      name: c.id.toUpperCase(), severity: c.severity,
      start: i * 40, duration: 60 + Math.floor(Math.random() * 80),
      status: c.status,
    }));
    const W = 280, H = 60;
    let rects = '';
    cases.forEach((c, i) => {
      const y = i * 14;
      const color = this._getSeverityColor(c.severity);
      const fill = c.status === 'escalated' ? '0.8' : c.status === 'investigating' ? '0.6' : '0.3';
      rects += `<text x="2" y="${y + 9}" fill="#94a3b8" font-size="7">${c.name}</text>`;
      rects += `<rect x="40" y="${y}" width="${c.duration}" height="10" rx="2" fill="${color}" fill-opacity="${fill}"/>`;
      rects += `<text x="${45 + c.duration}" y="${y + 8}" fill="#6b7280" font-size="6">${c.status}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${rects}</svg>`;
  }

  // Sankey diagram for alert-to-case flow
  private _sankeyFlowSVG(): string {
    const W = 280, H = 180;
    const sources = [
      { label: 'EDR', value: 12, color: '#ef4444' },
      { label: 'SIEM', value: 18, color: '#3b82f6' },
      { label: 'Network', value: 8, color: '#f97316' },
      { label: 'IAM', value: 6, color: '#a855f7' },
      { label: 'DLP', value: 4, color: '#eab308' },
    ];
    const sinks = [
      { label: 'Case APT', value: 14, color: '#ef4444' },
      { label: 'Case Ransom', value: 10, color: '#f97316' },
      { label: 'Case Insider', value: 8, color: '#eab308' },
      { label: 'Resolved', value: 16, color: '#22c55e' },
    ];
    const totalSrc = sources.reduce((s, v) => s + v.value, 0) || 1;
    let svg = '';
    // Source nodes
    sources.forEach((src, i) => {
      const h = (src.value / totalSrc) * (H - 20);
      const y = 10 + sources.slice(0, i).reduce((s, v) => s + (v.value / totalSrc) * (H - 20), 0);
      svg += `<rect x="5" y="${y}" width="40" height="${h}" rx="3" fill="${src.color}" fill-opacity="0.7"/>`;
      svg += `<text x="25" y="${y + h / 2 + 3}" text-anchor="middle" fill="#fff" font-size="7" font-weight="600">${src.label}</text>`;
      svg += `<text x="50" y="${y + h / 2 + 3}" fill="#94a3b8" font-size="7">${src.value}</text>`;
    });
    // Sink nodes
    sinks.forEach((sink, i) => {
      const h = (sink.value / totalSrc) * (H - 20);
      const y = 10 + sinks.slice(0, i).reduce((s, v) => s + (v.value / totalSrc) * (H - 20), 0);
      svg += `<rect x="${W - 45}" y="${y}" width="40" height="${h}" rx="3" fill="${sink.color}" fill-opacity="0.7"/>`;
      svg += `<text x="${W - 25}" y="${y + h / 2 + 3}" text-anchor="middle" fill="#fff" font-size="7" font-weight="600">${sink.label}</text>`;
    });
    // Flow paths (simplified curved bands)
    const flowData = [
      { src: 0, snk: 0, val: 6 }, { src: 0, snk: 1, val: 4 }, { src: 0, snk: 3, val: 2 },
      { src: 1, snk: 0, val: 8 }, { src: 1, snk: 2, val: 4 }, { src: 1, snk: 3, val: 6 },
      { src: 2, snk: 0, val: 0 }, { src: 2, snk: 1, val: 4 }, { src: 2, snk: 2, val: 2 }, { src: 2, snk: 3, val: 2 },
      { src: 3, snk: 2, val: 2 }, { src: 3, snk: 3, val: 4 },
      { src: 4, snk: 2, val: 0 }, { src: 4, snk: 3, val: 4 },
    ];
    flowData.forEach(f => {
      if (f.val === 0) return;
      const opacity = Math.min(0.4, f.val / 20);
      svg += `<path d="M55,${H / 2} C120,${H / 2} 160,${H / 2} ${W - 50},${H / 2}" stroke="#94a3b8" stroke-opacity="${opacity}" stroke-width="${f.val * 0.8}" fill="none"/>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${svg}</svg>`;
  }

  // Multi-series time-series chart
  private _trendChartSVG(): string {
    const W = 280, H = 100, pad = 20;
    const data = this._trendData;
    if (data.length === 0) return '';
    const maxAlerts = Math.max(...data.map(d => d.alerts), 1);
    const maxResolved = Math.max(...data.map(d => d.resolved), 1);
    const maxVal = Math.max(maxAlerts, maxResolved);
    const stepX = (W - pad * 2) / (data.length - 1);
    let svg = '';
    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = pad + (i / 4) * (H - pad * 2);
      svg += `<line x1="${pad}" y1="${y}" x2="${W - pad}" y2="${y}" stroke="#1f2937" stroke-width="0.5"/>`;
      svg += `<text x="${pad - 4}" y="${y + 3}" text-anchor="end" fill="#6b7280" font-size="6">${Math.round(maxVal * (1 - i / 4))}</text>`;
    }
    // Alert line
    const alertPts = data.map((d, i) => `${pad + i * stepX},${pad + (1 - d.alerts / maxVal) * (H - pad * 2)}`).join(' ');
    svg += `<polyline points="${alertPts}" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    // Resolved line
    const resolvedPts = data.map((d, i) => `${pad + i * stepX},${pad + (1 - d.resolved / maxVal) * (H - pad * 2)}`).join(' ');
    svg += `<polyline points="${resolvedPts}" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="4 2"/>`;
    // Anomaly markers
    this._anomalyPoints.forEach(idx => {
      const x = pad + idx * stepX;
      const y = pad + (1 - data[idx].alerts / maxVal) * (H - pad * 2);
      svg += `<circle cx="${x}" cy="${y}" r="4" fill="#ef4444" opacity="0.8"/>`;
      svg += `<circle cx="${x}" cy="${y}" r="7" fill="none" stroke="#ef4444" stroke-width="1" opacity="0.4"/>`;
    });
    // X axis labels
    data.forEach((d, i) => {
      if (i % 2 === 0) {
        const x = pad + i * stepX;
        svg += `<text x="${x}" y="${H - 4}" text-anchor="middle" fill="#6b7280" font-size="6">${d.hour}</text>`;
      }
    });
    // Legend
    svg += `<circle cx="${W - 100}" cy="8" r="3" fill="#ef4444"/><text x="${W - 94}" y="11" fill="#94a3b8" font-size="7">Alerts</text>`;
    svg += `<circle cx="${W - 55}" cy="8" r="3" fill="#22c55e"/><text x="${W - 49}" y="11" fill="#94a3b8" font-size="7">Resolved</text>`;
    svg += `<circle cx="${W - 10}" cy="8" r="3" fill="#ef4444" opacity="0.8"/><text x="${W - 4}" y="11" fill="#94a3b8" font-size="6">!</text>`;
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${svg}</svg>`;
  }

  // Team workload distribution chart
  private _teamWorkloadSVG(): string {
    const W = 280, H = 60;
    const analysts = this._analysts;
    const total = analysts.reduce((s, a) => s + a.activeCases, 0) || 1;
    let svg = '';
    const colors = ['#ef4444', '#f97316', '#22c55e', '#3b82f6'];
    let xPos = 0;
    analysts.forEach((a, i) => {
      const w = (a.activeCases / total) * (W - 80);
      svg += `<rect x="${xPos + 70}" y="8" width="${w}" height="20" rx="2" fill="${colors[i]}" fill-opacity="0.7"/>`;
      svg += `<text x="${xPos + 70 + w / 2}" y="22" text-anchor="middle" fill="#fff" font-size="8" font-weight="600">${a.activeCases}</text>`;
      xPos += w;
    });
    analysts.forEach((a, i) => {
      const y = 38;
      svg += `<circle cx="${75 + i * 52}" cy="${y}" r="4" fill="${colors[i]}"/>`;
      svg += `<text x="${82 + i * 52}" y="${y + 3}" fill="#94a3b8" font-size="7">${a.name.split(' ')[0]}</text>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}">${svg}</svg>`;
  }

  // Radar chart for MITRE tactic coverage
  private _mitreRadarSVG(): string {
    const W = 200, H = 200, cx = W / 2, cy = H / 2, R = 70;
    const tactics = ['Initial Access', 'Execution', 'Persistence', 'Priv Esc', 'Defense Evasion', 'Credential Access', 'Discovery', 'Exfiltration'];
    const n = tactics.length;
    const scores = tactics.map(() => Math.floor(Math.random() * 60) + 40);
    let svg = '';
    // Grid rings
    for (let ring = 1; ring <= 4; ring++) {
      const r = (ring / 4) * R;
      const pts = tactics.map((_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(' ');
      svg += `<polygon points="${pts}" fill="none" stroke="#1f2937" stroke-width="0.5"/>`;
    }
    // Axis lines and labels
    tactics.forEach((t, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const ex = cx + R * Math.cos(angle);
      const ey = cy + R * Math.sin(angle);
      svg += `<line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="#1f2937" stroke-width="0.5"/>`;
      const lx = cx + (R + 14) * Math.cos(angle);
      const ly = cy + (R + 14) * Math.sin(angle);
      svg += `<text x="${lx}" y="${ly + 3}" text-anchor="middle" fill="#6b7280" font-size="5.5">${t}</text>`;
    });
    // Data polygon
    const dataPts = scores.map((s, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const r = (s / 100) * R;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(' ');
    svg += `<polygon points="${dataPts}" fill="#f59e0b" fill-opacity="0.2" stroke="#f59e0b" stroke-width="1.5"/>`;
    // Data points
    scores.forEach((s, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const r = (s / 100) * R;
      svg += `<circle cx="${cx + r * Math.cos(angle)}" cy="${cy + r * Math.sin(angle)}" r="2.5" fill="#f59e0b"/>`;
    });
    return `<svg viewBox="0 0 ${W} ${H}" width="200" height="200">${svg}</svg>`;
  }

  // Auto-generated insights
  private _generateInsights(): { title: string; body: string; severity: 'critical' | 'warning' | 'info' }[] {
    const regression = this._linearRegression(this._trendData.map(d => d.alerts));
    const insights: { title: string; body: string; severity: 'critical' | 'warning' | 'info' }[] = [];
    if (regression.trend === 'up') insights.push({ title: 'Alert Volume Trending Up', body: `Alert volume is increasing with a slope of ${regression.slope.toFixed(2)} alerts/hour. Consider increasing analyst staffing during peak hours.`, severity: 'warning' });
    if (this._anomalyPoints.length > 0) insights.push({ title: 'Anomaly Detected', body: `Statistical anomaly detected at ${this._anomalyPoints.map(i => this._trendData[i]?.hour).join(', ')}. Alert volume exceeded 1.8 standard deviations from the mean.`, severity: 'critical' });
    const unassigned = this._alerts.filter(a => !a.assignee && a.severity !== 'low').length;
    if (unassigned > 0) insights.push({ title: 'Unassigned Critical Alerts', body: `${unassigned} high/critical alerts remain unassigned. Auto-assignment is recommended to meet SLA targets.`, severity: 'warning' });
    const overloaded = this._analysts.filter(a => a.load > 80).length;
    if (overloaded > 0) insights.push({ title: 'Team Capacity Alert', body: `${overloaded} analysts are above 80% workload capacity. Redistribution may improve response times.`, severity: 'info' });
    const overdueCases = this._slaItems.filter(s => s.elapsed > s.total).length;
    if (overdueCases > 0) insights.push({ title: 'SLA Breach Warning', body: `${overdueCases} case(s) have exceeded their SLA deadlines. Immediate escalation recommended.`, severity: 'critical' });
    insights.push({ title: 'MITRE Coverage', body: `Current detection covers 8 of 14 MITRE ATT&CK tactics. Priority gaps: Lateral Movement, Collection, Impact.`, severity: 'info' });
    return insights;
  }

  connectedCallback() { super.connectedCallback(); this._initAuditLog(); this._initSlaItems(); this._initTrendData(); this._initNotifications(); }

  private _getSeverityColor(sev: string): string {
    const m: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    return m[sev] ?? '#94a3b8';
  }

  private _getLoadColor(load: number): string {
    if (load > 80) return '#ef4444';
    if (load > 60) return '#f97316';
    return '#22c55e';
  }


  private _renderEscalationPath(): string {
    const levels = [
      { level: 'L1 Auto', criteria: 'Known FP pattern', sla: '0 min', action: 'Auto-close' },
      { level: 'L1 Triage', criteria: 'New alert, low confidence', sla: '15 min', action: 'Initial assessment' },
      { level: 'L2 Investigate', criteria: 'Confirmed suspicious, high sev', sla: '30 min', action: 'Deep investigation' },
      { level: 'L3 Specialist', criteria: 'Malware/Forensics needed', sla: '60 min', action: 'Specialist review' },
      { level: 'L4 Incident', criteria: 'Active intrusion confirmed', sla: '15 min', action: 'Incident commander' },
      { level: 'L5 Executive', criteria: 'Critical impact/data breach', sla: '5 min', action: 'CISO notification' },
    ];
    return levels.map((l, i) => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937"><div style="width:24px;height:24px;border-radius:50%;background:#3b82f620;color:#3b82f6;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700">L${i+1}</div><div style="flex:1"><div style="font-size:10px;color:#e2e8f0">${l.level} - ${l.action}</div><div style="font-size:9px;color:#6b7280">${l.criteria}</div></div><div style="font-size:9px;color:#eab308">${l.sla}</div></div>`).join('');
  }

  private _renderRunbookQuickAccess(): string {
    const runbooks = [
      { name: 'Ransomware Response', category: 'Malware', time: '2-24h', steps: 6 },
      { name: 'Phishing Auto-Response', category: 'Social Engineering', time: '30min', steps: 5 },
      { name: 'Data Breach Notification', category: 'Compliance', time: '72h', steps: 4 },
      { name: 'DDoS Mitigation', category: 'Network', time: '1-2h', steps: 4 },
      { name: 'Insider Threat Investigation', category: 'HR/Legal', time: '1-2 weeks', steps: 8 },
    ];
    return runbooks.map(r => `<div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0f172a;border-radius:6px;margin-bottom:4px;cursor:pointer"><span style="font-size:11px;font-weight:600;color:#e2e8f0;flex:1">${r.name}</span><span class="tag">${r.category}</span><span style="font-size:9px;color:#6b7280">${r.time}</span></div>`).join('');
  }

  private _renderRecentActivity(): string {
    const activities = [
      { time: '10:32', analyst: 'Martinez', action: 'Escalated alert to L3 - C2 beacon confirmed', type: 'escalation' },
      { time: '10:28', analyst: 'Chen', action: 'Assigned brute force alert for triage', type: 'assignment' },
      { time: '10:15', analyst: 'Patel', action: 'Resolved phishing cluster - 15 users affected', type: 'resolution' },
      { time: '09:45', analyst: 'Kim', action: 'Opened investigation case for svc-backup-02', type: 'investigation' },
      { time: '09:30', analyst: 'Thompson', action: 'Auto-resolved 23 low-severity alerts', type: 'auto' },
      { time: '09:00', analyst: 'Chen', action: 'Detected privilege escalation on DC-01', type: 'detection' },
      { time: '08:30', analyst: 'Patel', action: 'Blocked phishing URLs at web proxy', type: 'containment' },
      { time: '08:00', analyst: 'Martinez', action: 'Shift handoff completed with night team', type: 'handoff' },
    ];
    const typeColors: Record<string, string> = { escalation: '#ef4444', assignment: '#3b82f6', resolution: '#22c55e', investigation: '#eab308', auto: '#a855f7', detection: '#f97316', containment: '#3b82f6', handoff: '#6b7280' };
    return activities.map(a => `<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid #1f2937;font-size:10px"><span style="color:#6b7280;min-width:40px">${a.time}</span><span style="color:${typeColors[a.type] || '#6b7280'};min-width:60px;font-weight:600">${a.analyst}</span><span style="color:#e2e8f0;flex:1">${a.action}</span></div>`).join('');
  }

  private _renderAlertsTab() {
    const newCount = this._alerts.filter(a => a.status === 'new').length;
    const criticalCount = this._alerts.filter(a => a.severity === 'critical').length;
    const sevDist = { critical: this._alerts.filter(a => a.severity === 'critical').length, high: this._alerts.filter(a => a.severity === 'high').length, medium: this._alerts.filter(a => a.severity === 'medium').length, low: this._alerts.filter(a => a.severity === 'low').length };
    const total = this._alerts.length || 1;

    return html`
      <div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap">
        <span style="font-size:12px;background:#450a0a;color:#fca5a5;padding:4px 12px;border-radius:12px;font-weight:600">${criticalCount} Critical</span>
        <span style="font-size:12px;background:#422006;color:#fde047;padding:4px 12px;border-radius:12px;font-weight:600">${newCount} New</span>
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;height:8px;border-radius:4px;overflow:hidden;margin-bottom:6px">
          <div style="width:${sevDist.critical/total*100}%;background:#ef4444"></div>
          <div style="width:${sevDist.high/total*100}%;background:#f97316"></div>
          <div style="width:${sevDist.medium/total*100}%;background:#eab308"></div>
          <div style="width:${sevDist.low/total*100}%;background:#22c55e"></div>
        </div>
        <div style="display:flex;gap:12px;font-size:9px;color:#6b7280">
          <span style="color:#ef4444">Critical: ${sevDist.critical}</span>
          <span style="color:#f97316">High: ${sevDist.high}</span>
          <span style="color:#eab308">Medium: ${sevDist.medium}</span>
          <span style="color:#22c55e">Low: ${sevDist.low}</span>
        </div>
      </div>
      <div style="max-height:400px;overflow-y:auto">
        ${this._alerts.map(a => html`
          <div class="alert-row ${a.severity}" @click=${() => { this._selectedAlert = a.id; this.requestUpdate(); }}>
            <div class="alert-header">
              <span class="alert-title">${a.title}</span>
              <span class="badge b-${a.status}">${a.status}</span>
            </div>
            <div class="alert-meta">
              <span>📡 ${a.source}</span>
              <span>⏱ ${a.time}</span>
              <span>📋 ${a.ruleName}</span>
              <span>👤 ${a.assignee ?? 'Unassigned'}</span>
            </div>
          </div>
        `)}
      </div>
      ${this._selectedAlert ? html`
        <div class="handoff-box">
          <div style="font-weight:600;margin-bottom:8px">Alert Actions: ${this._selectedAlert}</div>
          ${(() => {
            const alert = this._alerts.find(a => a.id === this._selectedAlert);
            if (!alert) return nothing;
            const risk = this._calculateRiskScore(alert);
            const riskLevel = this._getRiskLevel(risk.overall);
            return html`
              <div class="risk-card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                  <span style="font-size:12px;font-weight:700">Risk Assessment</span>
                  <span style="font-size:14px;font-weight:800;color:${riskLevel.color}">${risk.overall}/100 (${riskLevel.label})</span>
                </div>
                ${risk.factors.map(f => html`
                  <div class="risk-factor-row">
                    <span class="risk-factor-label">${f.name} (${f.weight}%)</span>
                    <div class="risk-factor-bar"><div class="risk-factor-fill" style="width:${f.score}%;background:${f.color}"></div></div>
                    <span class="risk-factor-value" style="color:${f.color}">${f.score}</span>
                  </div>
                `)}
              </div>
            `;
          })()}
          <div style="display:flex;gap:6px;margin-bottom:8px">
            <button class="runbook-btn" @click=${() => alert('Assigning...')}>Assign</button>
            <button class="runbook-btn" @click=${() => alert('Escalating...')}>Escalate</button>
            <button class="runbook-btn" @click=${() => alert('Running playbook...')}>Run Playbook</button>
            <button class="runbook-btn" @click=${() => alert('Resolving...')}>Resolve</button>
          </div>
          <textarea placeholder="Add notes... @mention an analyst to notify them..."></textarea>
          <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
            ${this._analysts.map(a => html`<span class="mention-tag" style="cursor:pointer" @click=${() => { this._addAudit('MENTION', 'You', `Mentioned ${a.name} in alert ${this._selectedAlert}`); }}>@${a.name.split(' ')[0]}</span>`)}
          </div>
        </div>
      ` : nothing}
    `;
  }

  private _renderCasesTab() {
    return html`
      <div style="max-height:400px;overflow-y:auto">
        ${this._cases.map(c => html`
          <div class="case-card">
            <div style="flex:1">
              <div style="font-weight:600;font-size:13px">${c.title}</div>
              <div style="font-size:10px;color:#6b7280;margin-top:4px">${c.alerts} alerts | ${c.sla}</div>
            </div>
            <div style="text-align:right">
              <span class="badge b-${c.status === 'investigating' ? 'investigating' : c.status === 'escalated' ? 'escalated' : 'triage'}">${c.status}</span>
              <div style="font-size:10px;color:#6b7280;margin-top:4px">${c.assignee}</div>
            </div>
          </div>
        `)}
      </div>
      <div style="background:#1f2937;border-radius:8px;padding:14px;margin-top:12px">
        <div style="font-size:12px;font-weight:600;margin-bottom:10px;color:#94a3b8;text-transform:uppercase">Runbook Quick Access</div>
        ${[
          { name: 'Ransomware Response', category: 'Malware', time: '2-24h', steps: 6 },
          { name: 'Phishing Auto-Response', category: 'Social Engineering', time: '30min', steps: 5 },
          { name: 'Data Breach Notification', category: 'Compliance', time: '72h', steps: 4 },
          { name: 'DDoS Mitigation', category: 'Network', time: '1-2h', steps: 4 },
          { name: 'Insider Threat Investigation', category: 'HR/Legal', time: '1-2 weeks', steps: 8 },
        ].map(r => html`<div style="display:flex;align-items:center;gap:8px;padding:6px;background:#0f172a;border-radius:6px;margin-bottom:4px;cursor:pointer"><span style="font-size:11px;font-weight:600;color:#e2e8f0;flex:1">${r.name}</span><span class="tag">${r.category}</span><span style="font-size:9px;color:#6b7280">${r.time}</span><span style="font-size:9px;color:#6b7280">${r.steps} steps</span></div>`)}
      </div>
    `;
  }

  private _renderWorkloadTab() {
    const trendData = [8, 12, 10, 15, 11, 9, 14, 13, 16, 12, 10, 8];
    const mttrData = [3.2, 2.8, 3.5, 2.1, 2.5, 1.8, 2.3, 1.9, 2.0, 1.7, 2.1, 1.5];
    return html`
      <div class="section" style="margin-bottom:12px">
        <div class="stitle">Team Workload Distribution</div>
        ${this._teamWorkloadSVG()}
      </div>
      <div class="team-grid" style="margin-bottom:12px">
        ${this._analysts.map(a => html`
          <div class="team-member-card">
            <div class="team-member-avatar" style="background:${this._getLoadColor(a.load)}30;color:${this._getLoadColor(a.load)}">${a.name.split(' ').map(n => n[0]).join('')}</div>
            <div class="team-member-name">${a.name}</div>
            <div class="team-member-role">L2 SOC Analyst</div>
            <div class="team-member-stats">
              <div class="team-stat-item"><div class="team-stat-value" style="color:${this._getLoadColor(a.load)}">${a.load}%</div><div class="team-stat-label">Load</div></div>
              <div class="team-stat-item"><div class="team-stat-value">${a.activeCases}</div><div class="team-stat-label">Active</div></div>
              <div class="team-stat-item"><div class="team-stat-value" style="color:#22c55e">${a.resolvedToday}</div><div class="team-stat-label">Resolved</div></div>
            </div>
          </div>
        `)}
      </div>
      <div class="grid-2">
        <div class="section">
          <div class="stitle">Analyst Workload</div>
          ${this._analysts.map(a => html`
            <div class="analyst-card">
              <div class="analyst-avatar" style="background:${this._getLoadColor(a.load)}30;color:${this._getLoadColor(a.load)}">${a.name.charAt(0)}</div>
              <div class="analyst-info">
                <div class="analyst-name">${a.name}</div>
                <div class="analyst-meta">Active: ${a.activeCases} | Today: ${a.resolvedToday} resolved</div>
              </div>
              <div style="text-align:right">
                <div class="load-bar"><div class="load-fill" style="width:${a.load}%;background:${this._getLoadColor(a.load)}"></div></div>
                <div style="font-size:10px;color:#6b7280;margin-top:2px">${a.load}% load</div>
              </div>
            </div>
          `)}
        </div>
        <div class="section">
          <div class="stitle">MTTD / MTTR Metrics</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
            <div style="background:#0f172a;border-radius:6px;padding:12px;text-align:center">
              <div style="font-size:24px;font-weight:700;color:#22c55e">12m</div>
              <div style="font-size:10px;color:#6b7280">MTTD</div>
            </div>
            <div style="background:#0f172a;border-radius:6px;padding:12px;text-align:center">
              <div style="font-size:24px;font-weight:700;color:#3b82f6">2.3h</div>
              <div style="font-size:10px;color:#6b7280">MTTR</div>
            </div>
          </div>
          <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">Target: MTTD < 15min, MTTR < 4h</div>
          <div style="display:flex;justify-content:center;gap:16px;margin:10px 0">${this._gaugeSVG(80, 'MTTD')}${this._gaugeSVG(92, 'MTTR')}</div>
          <div style="margin-bottom:8px">
            <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">Alert Volume Trend (12h)</div>
            <div .innerHTML=${this._sparklineSVG(trendData, '#f59e0b')}></div>
          </div>
          <div>
            <div style="font-size:10px;color:#94a3b8;margin-bottom:4px">MTTR Trend (12h)</div>
            <div .innerHTML=${this._sparklineSVG(mttrData, '#3b82f6')}></div>
          </div>
        </div>
      </div>
      <div class="section" style="margin-top:12px">
        <div class="stitle">Recent Activity</div>
        ${[
          { time: '10:32', analyst: 'Martinez', action: 'Escalated alert to L3 - C2 beacon confirmed', color: '#ef4444' },
          { time: '10:28', analyst: 'Chen', action: 'Assigned brute force alert for triage', color: '#3b82f6' },
          { time: '10:15', analyst: 'Patel', action: 'Resolved phishing cluster - 15 users affected', color: '#22c55e' },
          { time: '09:45', analyst: 'Kim', action: 'Opened investigation case for svc-backup-02', color: '#eab308' },
          { time: '09:30', analyst: 'Thompson', action: 'Auto-resolved 23 low-severity alerts', color: '#a855f7' },
        ].map(a => html`<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid #1f2937;font-size:10px"><span style="color:#6b7280;min-width:40px">${a.time}</span><span style="color:${a.color};min-width:60px;font-weight:600">${a.analyst}</span><span style="color:#e2e8f0;flex:1">${a.action}</span></div>`)}
      </div>
      <div class="section" style="margin-top:12px">
        <div class="stitle">Escalation Path</div>
        ${[
          { level: 'L1', name: 'Auto-Triage', criteria: 'Known FP pattern', sla: '0 min', color: '#6b7280' },
          { level: 'L2', name: 'Initial Assessment', criteria: 'New alert, low confidence', sla: '15 min', color: '#3b82f6' },
          { level: 'L3', name: 'Deep Investigation', criteria: 'Confirmed suspicious', sla: '30 min', color: '#f59e0b' },
          { level: 'L4', name: 'Specialist Review', criteria: 'Malware/Forensics needed', sla: '60 min', color: '#f97316' },
          { level: 'L5', name: 'Incident Commander', criteria: 'Active intrusion confirmed', sla: '15 min', color: '#ef4444' },
          { level: 'L6', name: 'CISO Notification', criteria: 'Critical impact/data breach', sla: '5 min', color: '#dc2626' },
        ].map(l => html`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #1f2937"><div style="width:24px;height:24px;border-radius:50%;background:${l.color}20;color:${l.color};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700">${l.level}</div><div style="flex:1"><div style="font-size:10px;color:#e2e8f0">${l.name}</div><div style="font-size:9px;color:#6b7280">${l.criteria}</div></div><div style="font-size:9px;color:#eab308">${l.sla}</div></div>`)}
      </div>
    `;
  }

  private _renderHandoffTab() {
    return html`
      <div class="handoff-box">
        <div class="stitle">Shift Handoff Summary</div>
        <textarea placeholder="Enter shift summary notes..."></textarea>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="runbook-btn" @click=${() => alert('Generating handoff report...')}>Generate Report</button>
          <button class="runbook-btn" @click=${() => alert('Sending to next shift...')}>Send to Next Shift</button>
        </div>
      </div>
      <div class="section" style="margin-top:12px">
        <div class="stitle">Active Items for Next Shift</div>
        ${this._alerts.filter(a => a.status !== 'resolved').slice(0, 3).map(a => html`
          <div style="background:#0f172a;border-radius:6px;padding:10px;margin-bottom:6px">
            <div style="font-weight:600;font-size:12px">${a.title}</div>
            <div style="font-size:10px;color:#6b7280">Status: ${a.status} | Assignee: ${a.assignee ?? 'Unassigned'}</div>
          </div>
        `)}
      </div>
    `;
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





  // === Cloud Workload Protection Block ===
  @state() private _socAnalystWoContainerScans: Array<{image:string;registry:string;critical:number;high:number;medium:number;scanDate:string;status:string}> = [
    {image:"nginx:1.25",registry:"docker.io",critical:2,high:5,medium:12,scanDate:"2026-04-22",status:"Vulnerable"},
    {image:"postgres:16",registry:"ghcr.io",critical:0,high:1,medium:3,scanDate:"2026-04-22",status:"Clean"},
    {image:"redis:7.2",registry:"docker.io",critical:1,high:3,medium:8,scanDate:"2026-04-21",status:"Vulnerable"},
    {image:"app-server:v2.3",registry:"ecr.aws",critical:0,high:0,medium:2,scanDate:"2026-04-22",status:"Clean"},
    {image:"sidecar-proxy:v1.8",registry:"gcr.io",critical:3,high:7,medium:15,scanDate:"2026-04-20",status:"Critical"},
  ];
  @state() private _socAnalystWoK8sPods: Array<{namespace:string;pod:string;securityContext:string;hostIPC:boolean;hostPID:boolean;privileged:boolean;riskLevel:string}> = [
    {namespace:"production",pod:"web-frontend-7d9f8",securityContext:"Restricted",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Low"},
    {namespace:"production",pod:"api-gateway-4b2c1",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
    {namespace:"staging",pod:"db-migrator-x8k3m",securityContext:"Privileged",hostIPC:true,hostPID:false,privileged:true,riskLevel:"Critical"},
    {namespace:"monitoring",pod:"prometheus-q7r2p",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
  ];
  @state() private _socAnalystWoServerlessRisk: Array<{function:string;runtime:string;timeout:number;iamPerms:string;externalCalls:number;riskScore:number}> = [
    {function:"processPayment",runtime:"nodejs20.x",timeout:30,iamPerms:"dynamodb:*",externalCalls:3,riskScore:78},
    {function:"sendNotification",runtime:"python3.12",timeout:15,iamPerms:"sns:Publish",externalCalls:1,riskScore:25},
    {function:"imageResizer",runtime:"python3.12",timeout:60,iamPerms:"s3:*",externalCalls:0,riskScore:45},
    {function:"authValidator",runtime:"go1.x",timeout:10,iamPerms:"cognito-idp:*",externalCalls:2,riskScore:62},
  ];
  @state() private _socAnalystWoRuntimeAlerts: Array<{id:string;workload:string;alertType:string;severity:string;description:string;timestamp:string}> = [
    {id:"RTA01",workload:"db-migrator-x8k3m",alertType:"Privilege Escalation",severity:"Critical",description:"Container attempted to access /etc/shadow",timestamp:"2026-04-22T10:34:00Z"},
    {id:"RTA02",workload:"web-frontend-7d9f8",alertType:"Anomalous Outbound",severity:"High",description:"Unexpected DNS query to known C2 domain",timestamp:"2026-04-22T09:12:00Z"},
    {id:"RTA03",workload:"sidecar-proxy:v1.8",alertType:"Crypto Mining",severity:"Critical",description:"CPU utilization exceeded 95% for 30 minutes",timestamp:"2026-04-21T23:45:00Z"},
  ];
  private _renderSocanalystwoCloudWl(): TemplateResult {
    const containers = this._socAnalystWoContainerScans;
    const pods = this._socAnalystWoK8sPods;
    const alerts = this._socAnalystWoRuntimeAlerts;
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

  // === Security Event Correlation Block ===
  @state() private _socAnalystWoCorrRules: Array<{id:string;name:string;sources:string[];logic:string;severity:string;active:boolean;lastTriggered:string}> = [
    {id:"CR01",name:"Brute Force Detection",sources:["AD","Firewall","SIEM"],logic:"5 failed logins + firewall block within 10min",severity:"High",active:true,lastTriggered:"2026-04-22T08:30:00Z"},
    {id:"CR02",name:"Data Exfiltration Pattern",sources:["DLP","Proxy","DNS"],logic:"Large upload + DNS tunneling indicators",severity:"Critical",active:true,lastTriggered:"2026-04-21T14:22:00Z"},
    {id:"CR03",name:"Lateral Movement Detection",sources:["EDR","AD","Network"],logic:"New admin session + unusual SMB traffic",severity:"High",active:true,lastTriggered:"2026-04-20T11:15:00Z"},
    {id:"CR04",name:"Malware Beacon Detection",sources:["DNS","Proxy","EDR"],logic:"Periodic DNS queries + known C2 patterns",severity:"Critical",active:true,lastTriggered:"2026-04-22T06:45:00Z"},
  ];
  @state() private _socAnalystWoEventTimeline: Array<{timestamp:string;source:string;eventType:string;details:string;correlated:boolean}> = [
    {timestamp:"2026-04-22T10:34:12Z",source:"EDR",eventType:"Process Injection",details:"cmd.exe spawned from powershell",correlated:true},
    {timestamp:"2026-04-22T10:33:58Z",source:"AD",eventType:"Anomalous Login",details:"Service account used from new IP",correlated:true},
    {timestamp:"2026-04-22T10:32:01Z",source:"Firewall",eventType:"Port Scan",details:"192.168.1.45 scanning 10.0.0.0/8",correlated:false},
    {timestamp:"2026-04-22T10:30:45Z",source:"DLP",eventType:"Data Transfer",details:"10MB zip uploaded to external share",correlated:true},
    {timestamp:"2026-04-22T10:28:33Z",source:"DNS",eventType:"Suspicious Query",details:"Query to known malicious domain",correlated:true},
  ];
  @state() private _socAnalystWoFalsePosMetrics: {totalEvents:number;correlatedEvents:number;falsePositives:number;fpRate:number;topFpRules:string[]} = {
    totalEvents: 45230, correlatedEvents: 3847, falsePositives: 892, fpRate: 0.232,
    topFpRules: ["Port Scan Detection", "Anomalous Login Location", "Large File Download"]
  };
  @state() private _socAnalystWoEventPatterns: Array<{id:string;pattern:string;frequency:number;firstSeen:string;lastSeen:string;status:string}> = [
    {id:"EP01",pattern:"Credential stuffing from Tor exit nodes",frequency:23,firstSeen:"2026-03-15",lastSeen:"2026-04-22",status:"Active"},
    {id:"EP02",pattern:"DNS tunneling via TXT records",frequency:8,firstSeen:"2026-04-01",lastSeen:"2026-04-20",status:"Monitoring"},
    {id:"EP03",pattern:"Scheduled task persistence mechanism",frequency:3,firstSeen:"2026-04-10",lastSeen:"2026-04-18",status:"Investigating"},
  ];
  private _renderSocanalystwoEventCorr(): TemplateResult {
    const rules = this._socAnalystWoCorrRules;
    const timeline = this._socAnalystWoEventTimeline;
    const fpMetrics = this._socAnalystWoFalsePosMetrics;
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
  @state() private _socAnalystWoCourses: Array<{id:string;title:string;category:string;duration:number;enrolled:number;completed:number;difficulty:string;rating:number}> = [
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
  @state() private _socAnalystWoLearningPaths: Array<{id:string;name:string;courseIds:string[];progress:number;enrolled:number}> = [
    {id:"LP01",name:"Security Analyst Fundamentals",courseIds:["C001","C004","C007"],progress:72,enrolled:156},
    {id:"LP02",name:"DevSecOps Engineer",courseIds:["C001","C002","C008","C012"],progress:45,enrolled:78},
    {id:"LP03",name:"Cloud Security Specialist",courseIds:["C003","C006","C009"],progress:58,enrolled:89},
    {id:"LP04",name:"Advanced Penetration Tester",courseIds:["C010","C002","C005"],progress:33,enrolled:45},
  ];
  @state() private _socAnalystWoDeptCompliance: Array<{dept:string;trainedPct:number;targetPct:number;avgScore:number;certCount:number}> = [
    {dept:"Engineering",trainedPct:88,targetPct:95,avgScore:82,certCount:34},
    {dept:"Operations",trainedPct:92,targetPct:95,avgScore:87,certCount:28},
    {dept:"Finance",trainedPct:78,targetPct:90,avgScore:74,certCount:12},
    {dept:"HR",trainedPct:85,targetPct:90,avgScore:79,certCount:8},
    {dept:"Legal",trainedPct:71,targetPct:85,avgScore:71,certCount:6},
  ];
  @state() private _socAnalystWoSkillsGaps: Array<{skill:string;current:number;required:number;gap:number;priority:string}> = [
    {skill:"Cloud Security",current:62,required:85,gap:23,priority:"High"},
    {skill:"Threat Hunting",current:55,required:80,gap:25,priority:"High"},
    {skill:"Incident Response",current:70,required:85,gap:15,priority:"Medium"},
    {skill:"Secure Coding",current:75,required:90,gap:15,priority:"Medium"},
    {skill:"Forensics",current:45,required:75,gap:30,priority:"Critical"},
  ];
  private _renderSocanalystwoTraining(): TemplateResult {
    const courses = this._socAnalystWoCourses;
    const deptComp = this._socAnalystWoDeptCompliance;
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

  // === Network Segmentation Validator Block ===
  @state() private _socAnalystWoZones: Array<{id:string;name:string;trustLevel:number;subnet:string;devices:number;policy:string;lastAudit:string}> = [
    {id:"Z01",name:"DMZ",trustLevel:1,subnet:"10.0.1.0/24",devices:23,policy:"Deny All Inbound",lastAudit:"2026-04-20"},
    {id:"Z02",name:"Corporate LAN",trustLevel:3,subnet:"10.0.2.0/22",devices:456,policy:"Allow Internal",lastAudit:"2026-04-18"},
    {id:"Z03",name:"Data Center Core",trustLevel:5,subnet:"10.0.10.0/24",devices:89,policy:"Restricted Access",lastAudit:"2026-04-22"},
    {id:"Z04",name:"IoT Network",trustLevel:1,subnet:"10.0.20.0/24",devices:312,policy:"Deny All Internet",lastAudit:"2026-04-15"},
    {id:"Z05",name:"Development",trustLevel:2,subnet:"10.0.30.0/24",devices:67,policy:"Sandbox Rules",lastAudit:"2026-04-19"},
    {id:"Z06",name:"Management Plane",trustLevel:5,subnet:"10.0.99.0/24",devices:12,policy:"MFA Required",lastAudit:"2026-04-21"},
  ];
  @state() private _socAnalystWoSegRules: Array<{id:string;source:string;dest:string;action:string;protocol:string;port:string;status:string;hits:number}> = [
    {id:"SR01",source:"DMZ",dest:"Corporate LAN",action:"DENY",protocol:"TCP",port:"*",status:"Active",hits:14523},
    {id:"SR02",source:"Corporate LAN",dest:"Data Center Core",action:"ALLOW",protocol:"TCP",port:"443,8443",status:"Active",hits:89234},
    {id:"SR03",source:"IoT Network",dest:"Internet",action:"DENY",protocol:"*",port:"*",status:"Active",hits:234567},
    {id:"SR04",source:"Development",dest:"Corporate LAN",action:"DENY",protocol:"*",port:"*",status:"Active",hits:789},
    {id:"SR05",source:"Corporate LAN",dest:"Management Plane",action:"ALLOW",protocol:"TCP",port:"22,443",status:"Active",hits:3456},
  ];
  @state() private _socAnalystWoCrossZoneTraffic: Array<{source:string;dest:string;bytes:number;sessions:number;violations:number}> = [
    {source:"DMZ",dest:"Corporate LAN",bytes:4567890,sessions:234,violations:12},
    {source:"Corporate LAN",dest:"Data Center Core",bytes:123456789,sessions:5678,violations:3},
    {source:"IoT Network",dest:"Corporate LAN",bytes:890123,sessions:89,violations:45},
    {source:"Development",dest:"Internet",bytes:67890123,sessions:3456,violations:0},
  ];
  @state() private _socAnalystWoMicroSegGaps: Array<{id:string;zone:string;gapType:string;severity:string;recommendation:string}> = [
    {id:"MSG01",zone:"IoT Network",gapType:"Missing East-West Controls",severity:"High",recommendation:"Implement micro-segmentation with service mesh"},
    {id:"MSG02",zone:"Corporate LAN",gapType:"Flat Network Subnet",severity:"Critical",recommendation:"Split into VLANs by department"},
    {id:"MSG03",zone:"Development",gapType:"No Egress Filtering",severity:"Medium",recommendation:"Deploy proxy-based egress controls"},
  ];
  private _renderSocanalystwoNetworkSeg(): TemplateResult {
    const zones = this._socAnalystWoZones;
    const gaps = this._socAnalystWoMicroSegGaps;
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
    {id: 'cc-soc-analyst-workflow-001', title: 'SOX Section 404 Compliance Review', deadline: '2026-06-30', category: 'Regulatory', status: 'In Progress', assignee: 'Compliance Team', notes: 'Annual internal control assessment for financial reporting'},
    {id: 'cc-soc-analyst-workflow-002', title: 'GDPR Data Protection Impact Assessment', deadline: '2026-05-15', category: 'Privacy', status: 'Pending', assignee: 'DPO Office', notes: 'Quarterly DPIA for high-risk processing activities'},
    {id: 'cc-soc-analyst-workflow-003', title: 'ISO 27001 Surveillance Audit', deadline: '2026-07-20', category: 'Certification', status: 'Scheduled', assignee: 'QA Lead', notes: 'Stage 2 surveillance audit for ISMS certification renewal'},
    {id: 'cc-soc-analyst-workflow-004', title: 'PCI DSS v4.0 Gap Analysis', deadline: '2026-05-30', category: 'Payment', status: 'Not Started', assignee: 'Security Architect', notes: 'Assess current state against PCI DSS v4.0 requirements'},
    {id: 'cc-soc-analyst-workflow-005', title: 'NIST CSF Self-Assessment', deadline: '2026-08-15', category: 'Framework', status: 'Pending', assignee: 'CISO', notes: 'Biannual self-assessment against NIST Cybersecurity Framework'},
    {id: 'cc-soc-analyst-workflow-006', title: 'HIPAA Security Rule Audit', deadline: '2026-06-15', category: 'Healthcare', status: 'In Progress', assignee: 'Compliance Analyst', notes: 'Annual audit of administrative, physical, and technical safeguards'},
    {id: 'cc-soc-analyst-workflow-007', title: 'SOC 2 Type II Report Renewal', deadline: '2026-09-30', category: 'Audit', status: 'Scheduled', assignee: 'External Auditor', notes: 'Engage auditor for SOC 2 Type II examination period'},
    {id: 'cc-soc-analyst-workflow-008', title: 'FedRAMP Authorization Review', deadline: '2026-07-01', category: 'Government', status: 'Pending', assignee: 'FedRAMP PMO', notes: 'Review and update security authorization package'},
    {id: 'cc-soc-analyst-workflow-009', title: 'Annual Penetration Test', deadline: '2026-10-15', category: 'Testing', status: 'Not Started', assignee: 'Red Team Lead', notes: 'Comprehensive external and internal penetration testing engagement'},
    {id: 'cc-soc-analyst-workflow-010', title: 'Security Awareness Training Rollout', deadline: '2026-05-01', category: 'Training', status: 'Completed', assignee: 'Security Awareness Manager', notes: 'Q2 organization-wide security awareness training program'},
    {id: 'cc-soc-analyst-workflow-011', title: 'Vendor Security Review Cycle', deadline: '2026-06-01', category: 'Third Party', status: 'In Progress', assignee: 'Vendor Manager', notes: 'Quarterly review of critical vendor security posture and SLA compliance'},
    {id: 'cc-soc-analyst-workflow-012', title: 'Incident Response Plan Update', deadline: '2026-05-20', category: 'Operations', status: 'Pending', assignee: 'IR Team Lead', notes: 'Update IR procedures based on lessons learned from recent incidents'},
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
    {id: 'exc-soc-analyst-workflow-001', title: 'Legacy TLS 1.0 Exception for Payment Gateway', riskLevel: 'High', status: 'Approved', requestor: 'Infrastructure Team', approver: 'CISO', createdDate: '2026-01-15', expiryDate: '2026-07-15', compensatingControls: ['Network segmentation', 'Enhanced monitoring', 'Quarterly review'], justification: 'Third-party payment processor requires TLS 1.0; migration planned for Q3'},
    {id: 'exc-soc-analyst-workflow-002', title: 'Admin Account with Non-SSO Access', riskLevel: 'Medium', status: 'Under Review', requestor: 'DevOps Lead', approver: 'IAM Manager', createdDate: '2026-02-20', expiryDate: '2026-08-20', compensatingControls: ['MFA enforced', 'Session recording', 'Weekly access audit'], justification: 'Emergency break-glass account for critical infrastructure management'},
    {id: 'exc-soc-analyst-workflow-003', title: 'Outdated Database Version Support', riskLevel: 'High', status: 'Approved', requestor: 'DBA Team', approver: 'CTO', createdDate: '2025-12-01', expiryDate: '2026-06-01', compensatingControls: ['Isolated network zone', 'Application-layer WAF', 'Monthly patching'], justification: 'Vendor application incompatibility with newer DB version; upgrade scheduled'},
    {id: 'exc-soc-analyst-workflow-004', title: 'Public S3 Bucket for Customer Assets', riskLevel: 'Critical', status: 'Expired', requestor: 'Product Team', approver: 'CISO', createdDate: '2025-09-01', expiryDate: '2026-03-01', compensatingControls: ['Signed URLs', 'Access logging', 'Content encryption'], justification: 'Legacy customer portal requires public access for document delivery'},
    {id: 'exc-soc-analyst-workflow-005', title: 'VPN Bypass for Cloud-Native Workloads', riskLevel: 'Medium', status: 'Pending', requestor: 'Cloud Architecture', approver: 'Security Architect', createdDate: '2026-03-10', expiryDate: '2026-09-10', compensatingControls: ['Zero Trust network policies', 'mTLS between services', 'Service mesh encryption'], justification: 'Cloud-native microservices require direct connectivity for performance'},
    {id: 'exc-soc-analyst-workflow-006', title: 'Default Password Policy Override', riskLevel: 'High', status: 'Denied', requestor: 'HR Department', approver: 'CISO', createdDate: '2026-03-15', expiryDate: '2026-09-15', compensatingControls: ['Password manager deployment', 'SSO integration'], justification: 'Requested simpler password requirements for non-technical staff'},
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
    {id: 'dq-soc-analyst-workflow-001', dataSource: 'Vulnerability Scanner Feed', completenessScore: 94, accuracyScore: 91, timelinessScore: 88, consistencyScore: 95, reliabilityRank: 1, lastUpdated: '2026-04-23T08:00:00Z', issues: ['Minor delay in Nessus plugin updates'], trend: 'improving'},
    {id: 'dq-soc-analyst-workflow-002', dataSource: 'SIEM Event Logs', completenessScore: 87, accuracyScore: 93, timelinessScore: 96, consistencyScore: 89, reliabilityRank: 2, lastUpdated: '2026-04-23T07:30:00Z', issues: ['Some log sources showing gaps in off-hours'], trend: 'stable'},
    {id: 'dq-soc-analyst-workflow-003', dataSource: 'Asset Inventory Database', completenessScore: 82, accuracyScore: 78, timelinessScore: 75, consistencyScore: 84, reliabilityRank: 4, lastUpdated: '2026-04-22T18:00:00Z', issues: ['Shadow IT devices not fully cataloged', 'Decommissioned assets still listed'], trend: 'declining'},
    {id: 'dq-soc-analyst-workflow-004', dataSource: 'Threat Intelligence Platform', completenessScore: 91, accuracyScore: 89, timelinessScore: 92, consistencyScore: 87, reliabilityRank: 3, lastUpdated: '2026-04-23T06:00:00Z', issues: ['Some IOC sources lack confidence scoring'], trend: 'improving'},
    {id: 'dq-soc-analyst-workflow-005', dataSource: 'Identity Provider Logs', completenessScore: 96, accuracyScore: 97, timelinessScore: 98, consistencyScore: 96, reliabilityRank: 1, lastUpdated: '2026-04-23T09:00:00Z', issues: [], trend: 'stable'},
    {id: 'dq-soc-analyst-workflow-006', dataSource: 'Cloud Security Posture Data', completenessScore: 79, accuracyScore: 85, timelinessScore: 82, consistencyScore: 81, reliabilityRank: 5, lastUpdated: '2026-04-23T05:00:00Z', issues: ['Multi-cloud coverage gaps', 'API rate limiting affects scan frequency'], trend: 'declining'},
    {id: 'dq-soc-analyst-workflow-007', dataSource: 'Compliance Evidence Store', completenessScore: 88, accuracyScore: 86, timelinessScore: 80, consistencyScore: 83, reliabilityRank: 4, lastUpdated: '2026-04-21T14:00:00Z', issues: ['Manual evidence collection delays', 'Inconsistent formatting across frameworks'], trend: 'stable'},
    {id: 'dq-soc-analyst-workflow-008', dataSource: 'Network Flow Data', completenessScore: 92, accuracyScore: 90, timelinessScore: 94, consistencyScore: 91, reliabilityRank: 2, lastUpdated: '2026-04-23T08:30:00Z', issues: ['Encrypted traffic classification accuracy needs improvement'], trend: 'improving'},
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
    {id: 'wf-soc-analyst-workflow-001', name: 'Vulnerability Triage Pipeline', description: 'Automated vulnerability assessment, prioritization, and assignment workflow', category: 'Vulnerability Management', steps: 8, avgDuration: '12 min', successRate: 94.5, lastRun: '2026-04-23T06:00:00Z', manualInterventions: 2, optimizationScore: 87},
    {id: 'wf-soc-analyst-workflow-002', name: 'Incident Response Orchestration', description: 'End-to-end IR workflow from detection to containment and recovery', category: 'Incident Response', steps: 15, avgDuration: '45 min', successRate: 89.2, lastRun: '2026-04-22T14:30:00Z', manualInterventions: 5, optimizationScore: 72},
    {id: 'wf-soc-analyst-workflow-003', name: 'Access Request Approval Chain', description: 'Multi-level approval workflow for privileged access requests', category: 'Identity & Access', steps: 6, avgDuration: '4 hours', successRate: 97.1, lastRun: '2026-04-23T09:15:00Z', manualInterventions: 1, optimizationScore: 92},
    {id: 'wf-soc-analyst-workflow-004', name: 'Compliance Evidence Collection', description: 'Automated gathering and packaging of audit evidence artifacts', category: 'Compliance', steps: 10, avgDuration: '30 min', successRate: 91.8, lastRun: '2026-04-21T10:00:00Z', manualInterventions: 3, optimizationScore: 78},
    {id: 'wf-soc-analyst-workflow-005', name: 'Security Patch Deployment', description: 'Staged patch rollout with validation and rollback capability', category: 'Patch Management', steps: 12, avgDuration: '2 hours', successRate: 96.3, lastRun: '2026-04-20T22:00:00Z', manualInterventions: 1, optimizationScore: 85},
    {id: 'wf-soc-analyst-workflow-006', name: 'Threat Intelligence Enrichment', description: 'IOC enrichment and correlation with internal threat data', category: 'Threat Intelligence', steps: 7, avgDuration: '8 min', successRate: 93.7, lastRun: '2026-04-23T07:00:00Z', manualInterventions: 0, optimizationScore: 95},
    {id: 'wf-soc-analyst-workflow-007', name: 'Security Reporting Pipeline', description: 'Automated generation and distribution of security metrics reports', category: 'Reporting', steps: 5, avgDuration: '15 min', successRate: 98.9, lastRun: '2026-04-23T08:00:00Z', manualInterventions: 0, optimizationScore: 97},
    {id: 'wf-soc-analyst-workflow-008', name: 'Vendor Risk Assessment', description: 'Automated vendor security questionnaire distribution and scoring', category: 'Third Party', steps: 9, avgDuration: '3 days', successRate: 85.4, lastRun: '2026-04-19T11:00:00Z', manualInterventions: 4, optimizationScore: 65},
  ];

  @state() private _workflowExecutionHistory: Array<{workflowId: string; runDate: string; duration: string; status: string; trigger: string}> = [
    {workflowId: 'wf-soc-analyst-workflow-001', runDate: '2026-04-23T06:00:00Z', duration: '11 min 23 sec', status: 'Success', trigger: 'Scheduled'},
    {workflowId: 'wf-soc-analyst-workflow-002', runDate: '2026-04-22T14:30:00Z', duration: '42 min 15 sec', status: 'Success', trigger: 'Alert'},
    {workflowId: 'wf-soc-analyst-workflow-003', runDate: '2026-04-23T09:15:00Z', duration: '3h 45 min', status: 'Success', trigger: 'User Request'},
    {workflowId: 'wf-soc-analyst-workflow-001', runDate: '2026-04-22T06:00:00Z', duration: '13 min 08 sec', status: 'Partial', trigger: 'Scheduled'},
    {workflowId: 'wf-soc-analyst-workflow-004', runDate: '2026-04-21T10:00:00Z', duration: '28 min 42 sec', status: 'Success', trigger: 'Scheduled'},
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
    {id: 'kb-soc-analyst-workflow-001', title: 'Zero Trust Architecture Implementation Guide', category: 'Architecture', author: 'Security Architecture Team', publishDate: '2026-03-15', views: 1842, rating: 4.8, tags: ['zero-trust', 'network', 'identity'], summary: 'Comprehensive guide for implementing zero trust principles across enterprise infrastructure', readTime: '15 min'},
    {id: 'kb-soc-analyst-workflow-002', title: 'Ransomware Defense Playbook 2026', category: 'Threats', author: 'Threat Intelligence Team', publishDate: '2026-04-01', views: 2341, rating: 4.9, tags: ['ransomware', 'incident-response', 'defense'], summary: 'Updated playbook with latest ransomware tactics, techniques, and defensive measures', readTime: '12 min'},
    {id: 'kb-soc-analyst-workflow-003', title: 'Cloud Security Best Practices for Multi-Cloud', category: 'Cloud', author: 'Cloud Security Team', publishDate: '2026-02-28', views: 1567, rating: 4.5, tags: ['cloud', 'aws', 'azure', 'gcp'], summary: 'Best practices for securing workloads across multiple cloud service providers', readTime: '18 min'},
    {id: 'kb-soc-analyst-workflow-004', title: 'API Security Testing Methodology', category: 'Testing', author: 'Red Team', publishDate: '2026-03-22', views: 987, rating: 4.6, tags: ['api', 'testing', 'owasp'], summary: 'Structured methodology for identifying and testing API security vulnerabilities', readTime: '10 min'},
    {id: 'kb-soc-analyst-workflow-005', title: 'Supply Chain Security Risk Management', category: 'Third Party', author: 'GRC Team', publishDate: '2026-01-20', views: 1234, rating: 4.3, tags: ['supply-chain', 'vendor', 'risk'], summary: 'Framework for managing security risks in the software supply chain', readTime: '14 min'},
    {id: 'kb-soc-analyst-workflow-006', title: 'Kubernetes Security Hardening Checklist', category: 'Container', author: 'Platform Security', publishDate: '2026-04-10', views: 2103, rating: 4.7, tags: ['kubernetes', 'container', 'hardening'], summary: 'Step-by-step hardening checklist for production Kubernetes clusters', readTime: '11 min'},
    {id: 'kb-soc-analyst-workflow-007', title: 'Security Metrics That Matter for Executives', category: 'Metrics', author: 'CISO Office', publishDate: '2026-03-05', views: 876, rating: 4.4, tags: ['metrics', 'kpi', 'reporting'], summary: 'Key security metrics and KPIs that resonate with board-level stakeholders', readTime: '8 min'},
    {id: 'kb-soc-analyst-workflow-008', title: 'Phishing Simulation Campaign Design', category: 'Awareness', author: 'Security Awareness Team', publishDate: '2026-02-15', views: 1456, rating: 4.5, tags: ['phishing', 'simulation', 'training'], summary: 'Designing effective phishing simulations that drive real behavioral change', readTime: '9 min'},
    {id: 'kb-soc-analyst-workflow-009', title: 'Data Loss Prevention Strategy and Implementation', category: 'Data Protection', author: 'Data Security Team', publishDate: '2026-03-28', views: 1678, rating: 4.6, tags: ['dlp', 'data-protection', 'compliance'], summary: 'Strategic approach to DLP covering people, process, and technology layers', readTime: '16 min'},
    {id: 'kb-soc-analyst-workflow-010', title: 'Security Automation with SOAR Platforms', category: 'Automation', author: 'SOC Engineering', publishDate: '2026-04-05', views: 1098, rating: 4.7, tags: ['soar', 'automation', 'soc'], summary: 'Building effective security automation playbooks using SOAR technology', readTime: '13 min'},
    {id: 'kb-soc-analyst-workflow-011', title: 'Third-Party Risk Assessment Framework', category: 'GRC', author: 'Vendor Management', publishDate: '2026-01-30', views: 1345, rating: 4.4, tags: ['vendor', 'risk', 'assessment'], summary: 'Structured framework for evaluating and monitoring third-party security risks', readTime: '12 min'},
    {id: 'kb-soc-analyst-workflow-012', title: 'Network Detection and Response Best Practices', category: 'Network', author: 'Network Security Team', publishDate: '2026-03-18', views: 1567, rating: 4.5, tags: ['ndr', 'network', 'detection'], summary: 'Implementing effective network detection and response capabilities', readTime: '14 min'},
    {id: 'kb-soc-analyst-workflow-013', title: 'Security Chaos Engineering Guide', category: 'Resilience', author: 'SRE Security', publishDate: '2026-04-12', views: 789, rating: 4.3, tags: ['chaos-engineering', 'resilience', 'testing'], summary: 'Applying chaos engineering principles to validate security controls', readTime: '10 min'},
    {id: 'kb-soc-analyst-workflow-014', title: 'Incident Communication Templates', category: 'Incident Response', author: 'IR Team', publishDate: '2026-02-22', views: 2234, rating: 4.8, tags: ['incident', 'communication', 'templates'], summary: 'Ready-to-use communication templates for security incident scenarios', readTime: '7 min'},
    {id: 'kb-soc-analyst-workflow-015', title: 'Endpoint Detection and Response Configuration', category: 'Endpoint', author: 'Endpoint Security', publishDate: '2026-03-08', views: 1345, rating: 4.5, tags: ['edr', 'endpoint', 'configuration'], summary: 'Optimal EDR configuration for maximum detection with minimal false positives', readTime: '11 min'},
    {id: 'kb-soc-analyst-workflow-016', title: 'Security Code Review Standards', category: 'Development', author: 'AppSec Team', publishDate: '2026-02-10', views: 1890, rating: 4.6, tags: ['code-review', 'secure-sdlc', 'standards'], summary: 'Standards and checklists for security-focused code reviews', readTime: '13 min'},
    {id: 'kb-soc-analyst-workflow-017', title: 'IoT Security Assessment Methodology', category: 'IoT', author: 'IoT Security Lab', publishDate: '2026-04-08', views: 654, rating: 4.2, tags: ['iot', 'embedded', 'assessment'], summary: 'Methodology for assessing security posture of IoT devices and ecosystems', readTime: '15 min'},
    {id: 'kb-soc-analyst-workflow-018', title: 'Passwordless Authentication Migration Guide', category: 'Identity', author: 'IAM Team', publishDate: '2026-03-25', views: 1678, rating: 4.7, tags: ['passwordless', 'authentication', 'mfa'], summary: 'Step-by-step migration plan from password-based to passwordless authentication', readTime: '12 min'},
    {id: 'kb-soc-analyst-workflow-019', title: 'Security Awareness Program Metrics', category: 'Awareness', author: 'Security Culture Team', publishDate: '2026-01-25', views: 1123, rating: 4.4, tags: ['awareness', 'metrics', 'culture'], summary: 'Measuring the effectiveness of your security awareness and training programs', readTime: '9 min'},
    {id: 'kb-soc-analyst-workflow-020', title: 'Deception Technology Deployment Guide', category: 'Detection', author: 'Blue Team', publishDate: '2026-04-15', views: 876, rating: 4.5, tags: ['deception', 'honeypot', 'detection'], summary: 'Planning and deploying deception technology for advanced threat detection', readTime: '11 min'},
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

  // --- Security Scenario Planning Methods (SOANWO) ---
  private _initSoanwoScenarios(): void {
    const worstCaseScenarios = [
      { id: "soanwo-sc-01", name: "Ransomware Attack on Critical Infrastructure", category: "Malware", impact: 9500000, probability: 0.12, recoveryDays: 21, affectedSystems: 47, dataLossGb: 320, businessImpact: "critical" },
      { id: "soanwo-sc-02", name: "Insider Data Exfiltration via Authorized Channels", category: "Insider Threat", impact: 7200000, probability: 0.18, recoveryDays: 14, affectedSystems: 12, dataLossGb: 85, businessImpact: "high" },
      { id: "soanwo-sc-03", name: "Supply Chain Compromise via Third-Party Library", category: "Supply Chain", impact: 6800000, probability: 0.09, recoveryDays: 30, affectedSystems: 63, dataLossGb: 0, businessImpact: "critical" },
      { id: "soanwo-sc-04", name: "Cloud Misconfiguration Leading to Public Exposure", category: "Cloud", impact: 4100000, probability: 0.22, recoveryDays: 7, affectedSystems: 8, dataLossGb: 450, businessImpact: "high" },
      { id: "soanwo-sc-05", name: "Zero-Day Exploit in Core Application Framework", category: "Vulnerability", impact: 8900000, probability: 0.05, recoveryDays: 45, affectedSystems: 120, dataLossGb: 0, businessImpact: "critical" },
      { id: "soanwo-sc-06", name: "Distributed Denial of Service on Customer-Facing Services", category: "Availability", impact: 3400000, probability: 0.25, recoveryDays: 3, affectedSystems: 15, dataLossGb: 0, businessImpact: "medium" },
      { id: "soanwo-sc-07", name: "Credential Stuffing and Account Takeover Wave", category: "Identity", impact: 2800000, probability: 0.30, recoveryDays: 5, affectedSystems: 6, dataLossGb: 12, businessImpact: "medium" },
      { id: "soanwo-sc-08", name: "Physical Security Breach at Data Center Facility", category: "Physical", impact: 12000000, probability: 0.02, recoveryDays: 60, affectedSystems: 200, dataLossGb: 5000, businessImpact: "critical" },
    ];
    this._soanwoScenarios = worstCaseScenarios.map(s => ({ ...s, mitigationCost: Math.round(s.impact * 0.08), drillScheduled: false, lastDrillDate: null, drillScore: null, controlGaps: Math.floor(Math.random() * 5) + 1 }));
  }

  private _calculateSoanwoScenarioRisk(): void {
    this._soanwoScenarios.forEach(s => {
      const riskScore = s.impact * s.probability;
      s.riskScore = Math.round(riskScore);
      s.riskLevel = riskScore > 1000000 ? "extreme" : riskScore > 500000 ? "high" : riskScore > 200000 ? "medium" : "low";
      s.mitigationPriority = s.riskScore > 500000 ? "immediate" : s.riskScore > 200000 ? "planned" : "monitor";
      s.residualRisk = Math.round(s.riskScore * (1 - (s.controlGaps * 0.12)));
      s.bciScore = Math.round((s.recoveryDays * 0.3 + s.affectedSystems * 0.4 + (s.dataLossGb > 0 ? 0.3 : 0)) * 100);
    });
  }

  private _scheduleSoanwoDrills(): void {
    const drillCadence = { quarterly: ["Q1", "Q2", "Q3", "Q4"], semiAnnual: ["H1", "H2"], annual: ["FY"] };
    this._soanwoScenarios.forEach(s => {
      if (s.probability > 0.15 && s.businessImpact === "critical") s.drillCadence = "quarterly";
      else if (s.probability > 0.10 || s.businessImpact === "high") s.drillCadence = "semiAnnual";
      else s.drillCadence = "annual";
      const periods = drillCadence[s.drillCadence as keyof typeof drillCadence];
      s.nextDrillDate = periods[Math.floor(Math.random() * periods.length)] + "-2026";
    });
  }

  private _soanwoScenarioComparison(): Record<string, unknown>[] {
    return this._soanwoScenarios.map(s => ({
      scenario: s.name, impact: s.impact, probability: s.probability, risk: s.riskScore,
      level: s.riskLevel, recovery: s.recoveryDays + "d", priority: s.mitigationPriority,
      residual: s.residualRisk, bci: s.bciScore, gaps: s.controlGaps
    }));
  }

  // --- Security Control Effectiveness Analytics (SOANWO) ---
  private _initSoanwoControls(): void {
    const controls = [
      { id: "soanwo-ct-01", name: "Network Segmentation", type: "preventive", maturity: "defined", score: 82, target: 90, failures: 3, lastTest: "2026-03-15" },
      { id: "soanwo-ct-02", name: "Endpoint Detection and Response", type: "detective", maturity: "managed", score: 88, target: 92, failures: 1, lastTest: "2026-04-01" },
      { id: "soanwo-ct-03", name: "Data Loss Prevention", type: "preventive", maturity: "repeatable", score: 71, target: 85, failures: 7, lastTest: "2026-03-22" },
      { id: "soanwo-ct-04", name: "Security Information and Event Management", type: "detective", maturity: "managed", score: 85, target: 90, failures: 2, lastTest: "2026-04-05" },
      { id: "soanwo-ct-05", name: "Identity and Access Management", type: "preventive", maturity: "defined", score: 76, target: 88, failures: 5, lastTest: "2026-03-28" },
      { id: "soanwo-ct-06", name: "Vulnerability Management", type: "corrective", maturity: "managed", score: 80, target: 90, failures: 4, lastTest: "2026-04-02" },
      { id: "soanwo-ct-07", name: "Email Security Gateway", type: "preventive", maturity: "managed", score: 90, target: 95, failures: 1, lastTest: "2026-04-08" },
      { id: "soanwo-ct-08", name: "Web Application Firewall", type: "preventive", maturity: "managed", score: 87, target: 92, failures: 2, lastTest: "2026-03-30" },
      { id: "soanwo-ct-09", name: "Patch Management", type: "corrective", maturity: "defined", score: 68, target: 85, failures: 9, lastTest: "2026-03-18" },
      { id: "soanwo-ct-10", name: "Encryption at Rest", type: "preventive", maturity: "managed", score: 93, target: 95, failures: 0, lastTest: "2026-04-10" },
      { id: "soanwo-ct-11", name: "Encryption in Transit", type: "preventive", maturity: "optimized", score: 96, target: 98, failures: 0, lastTest: "2026-04-12" },
      { id: "soanwo-ct-12", name: "Privileged Access Management", type: "preventive", maturity: "defined", score: 74, target: 88, failures: 6, lastTest: "2026-03-25" },
      { id: "soanwo-ct-13", name: "Security Awareness Training", type: "preventive", maturity: "repeatable", score: 65, target: 80, failures: 11, lastTest: "2026-03-20" },
      { id: "soanwo-ct-14", name: "Incident Response Plan", type: "corrective", maturity: "managed", score: 78, target: 88, failures: 4, lastTest: "2026-04-03" },
      { id: "soanwo-ct-15", name: "Backup and Recovery", type: "corrective", maturity: "managed", score: 84, target: 92, failures: 3, lastTest: "2026-04-06" },
      { id: "soanwo-ct-16", name: "Multi-Factor Authentication", type: "preventive", maturity: "managed", score: 91, target: 95, failures: 1, lastTest: "2026-04-09" },
      { id: "soanwo-ct-17", name: "Network Traffic Analysis", type: "detective", maturity: "defined", score: 72, target: 85, failures: 5, lastTest: "2026-03-27" },
      { id: "soanwo-ct-18", name: "Cloud Security Posture Management", type: "detective", maturity: "repeatable", score: 69, target: 82, failures: 8, lastTest: "2026-03-24" },
      { id: "soanwo-ct-19", name: "Container Security Scanning", type: "preventive", maturity: "defined", score: 75, target: 85, failures: 5, lastTest: "2026-04-04" },
      { id: "soanwo-ct-20", name: "API Security Gateway", type: "preventive", maturity: "repeatable", score: 70, target: 82, failures: 7, lastTest: "2026-03-29" },
      { id: "soanwo-ct-21", name: "Threat Intelligence Platform", type: "detective", maturity: "managed", score: 83, target: 90, failures: 2, lastTest: "2026-04-07" },
      { id: "soanwo-ct-22", name: "Database Activity Monitoring", type: "detective", maturity: "defined", score: 67, target: 80, failures: 8, lastTest: "2026-03-21" },
      { id: "soanwo-ct-23", name: "Deception Technology", type: "detective", maturity: "initial", score: 55, target: 75, failures: 12, lastTest: "2026-03-16" },
      { id: "soanwo-ct-24", name: "Security Orchestration Automation", type: "corrective", maturity: "repeatable", score: 73, target: 85, failures: 6, lastTest: "2026-04-01" },
      { id: "soanwo-ct-25", name: "Third-Party Risk Assessment", type: "preventive", maturity: "defined", score: 64, target: 78, failures: 9, lastTest: "2026-03-19" },
    ];
    this._soanwoControls = controls;
  }

  private _analyzeSoanwoControlEffectiveness(): void {
    const typeBreakdown: Record<string, { total: number; avgScore: number; avgFailures: number }> = {};
    this._soanwoControls.forEach(c => {
      if (!typeBreakdown[c.type]) typeBreakdown[c.type] = { total: 0, avgScore: 0, avgFailures: 0 };
      typeBreakdown[c.type].total++;
      typeBreakdown[c.type].avgScore += c.score;
      typeBreakdown[c.type].avgFailures += c.failures;
    });
    Object.keys(typeBreakdown).forEach(t => {
      typeBreakdown[t].avgScore = Math.round(typeBreakdown[t].avgScore / typeBreakdown[t].total);
      typeBreakdown[t].avgFailures = Math.round(typeBreakdown[t].avgFailures / typeBreakdown[t].total * 10) / 10;
    });
    this._soanwoControlTypeBreakdown = typeBreakdown;
  }

  private _soanwoControlOptimization(): Record<string, unknown>[] {
    return this._soanwoControls.filter(c => c.score < c.target).map(c => ({
      control: c.name, current: c.score, target: c.target, gap: c.target - c.score,
      failures: c.failures, maturity: c.maturity, recommendation:
        c.score < 70 ? "Critical: Immediate improvement required" :
        c.score < 80 ? "Significant: Plan improvement sprint" :
        "Moderate: Fine-tune and optimize"
    })).sort((a: any, b: any) => (b.gap as number) - (a.gap as number));
  }

  // --- Security Data Pipeline Health (SOANWO) ---
  private _initSoanwoPipelines(): void {
    const pipelines = [
      { id: "soanwo-pl-01", name: "SIEM Log Ingestion", status: "healthy", healthScore: 94, latencyMs: 120, freshnessMin: 2, errorRate: 0.02, throughputMbps: 450, recordsPerSec: 12000, backPressure: 0.05, uptime: 99.97 },
      { id: "soanwo-pl-02", name: "Threat Feed Aggregation", status: "healthy", healthScore: 91, latencyMs: 300, freshnessMin: 15, errorRate: 0.05, throughputMbps: 85, recordsPerSec: 3200, backPressure: 0.08, uptime: 99.92 },
      { id: "soanwo-pl-03", name: "Vulnerability Scan Results", status: "degraded", healthScore: 72, latencyMs: 2500, freshnessMin: 60, errorRate: 0.15, throughputMbps: 25, recordsPerSec: 800, backPressure: 0.35, uptime: 98.50 },
      { id: "soanwo-pl-04", name: "Endpoint Telemetry Stream", status: "healthy", healthScore: 88, latencyMs: 450, freshnessMin: 5, errorRate: 0.08, throughputMbps: 280, recordsPerSec: 8500, backPressure: 0.12, uptime: 99.85 },
      { id: "soanwo-pl-05", name: "Cloud Audit Log Pipeline", status: "healthy", healthScore: 86, latencyMs: 600, freshnessMin: 10, errorRate: 0.06, throughputMbps: 150, recordsPerSec: 4500, backPressure: 0.10, uptime: 99.80 },
      { id: "soanwo-pl-06", name: "Identity Event Stream", status: "warning", healthScore: 78, latencyMs: 1200, freshnessMin: 20, errorRate: 0.12, throughputMbps: 45, recordsPerSec: 1500, backPressure: 0.22, uptime: 99.40 },
      { id: "soanwo-pl-07", name: "Network Flow Collection", status: "healthy", healthScore: 82, latencyMs: 800, freshnessMin: 8, errorRate: 0.09, throughputMbps: 650, recordsPerSec: 18000, backPressure: 0.15, uptime: 99.70 },
      { id: "soanwo-pl-08", name: "DLP Incident Pipeline", status: "degraded", healthScore: 68, latencyMs: 3500, freshnessMin: 45, errorRate: 0.20, throughputMbps: 18, recordsPerSec: 500, backPressure: 0.42, uptime: 97.80 },
    ];
    this._soanwoPipelines = pipelines.map(p => ({ ...p, dependencies: [], slaBreached: p.healthScore < 75, alertThreshold: p.errorRate > 0.15 }));
    this._soanwoPipelines[0].dependencies = ["soanwo-pl-04", "soanwo-pl-07"];
    this._soanwoPipelines[4].dependencies = ["soanwo-pl-01"];
    this._soanwoPipelines[5].dependencies = ["soanwo-pl-02"];
    this._soanwoPipelines[7].dependencies = ["soanwo-pl-04", "soanwo-pl-05"];
  }

  private _soanwoPipelineTrend(): Record<string, unknown>[] {
    const hours = Array.from({ length: 24 }, (_, i) => `H${String(i).padStart(2, "0")}`);
    return this._soanwoPipelines.map(p => ({
      pipeline: p.name, status: p.status, health: p.healthScore,
      latency: p.latencyMs, freshness: p.freshnessMin, errors: p.errorRate,
      throughput: p.throughputMbps, recordsSec: p.recordsPerSec, slaOk: !p.slaBreached,
      hourlyHealth: hours.map(h => Math.max(50, p.healthScore + Math.floor(Math.random() * 20) - 10))
    }));
  }

  // --- Security Stakeholder Report Generator (SOANWO) ---
  private _initSoanwoReportTemplates(): void {
    this._soanwoReportTemplates = [
      { id: "soanwo-rp-01", name: "Board Security Report", audience: "board", frequency: "quarterly", sections: 6, autoGenerate: true, lastGenerated: "2026-03-31", pages: 12 },
      { id: "soanwo-rp-02", name: "Executive Risk Summary", audience: "executive", frequency: "monthly", sections: 8, autoGenerate: true, lastGenerated: "2026-04-01", pages: 8 },
      { id: "soanwo-rp-03", name: "Technical Security Review", audience: "technical", frequency: "weekly", sections: 12, autoGenerate: true, lastGenerated: "2026-04-21", pages: 25 },
      { id: "soanwo-rp-04", name: "Audit Compliance Report", audience: "audit", frequency: "quarterly", sections: 10, autoGenerate: false, lastGenerated: "2026-03-15", pages: 35 },
      { id: "soanwo-rp-05", name: "Regulatory Filing Package", audience: "regulatory", frequency: "annual", sections: 15, autoGenerate: false, lastGenerated: "2025-12-31", pages: 48 },
    ];
  }

  private _generateSoanwoExecSummary(): string {
    const totalRisk = this._soanwoScenarios.reduce((sum: number, s: any) => sum + s.riskScore, 0);
    const avgControl = Math.round(this._soanwoControls.reduce((sum: number, c: any) => sum + c.score, 0) / this._soanwoControls.length);
    const degradedPipes = this._soanwoPipelines.filter((p: any) => p.status !== "healthy").length;
    return `Overall risk exposure: ${(totalRisk / 1000000).toFixed(1)}M. Average control effectiveness: {avgControl}%. {degradedPipes} pipeline(s) need attention. {this._soanwoScenarios.filter((s: any) => s.mitigationPriority === "immediate").length} scenarios require immediate action.`;
  }

  // --- Security Technology Radar (SOANWO) ---
  private _initSoanwoTechRadar(): void {
    this._soanwoTechRadar = [
      { id: "soanwo-tr-01", name: "AI-Powered Threat Detection", ring: "adopt", category: "Detection", maturity: 4, trend: "up", investment: "high", roi: 3.2, vendorCount: 8 },
      { id: "soanwo-tr-02", name: "Zero Trust Architecture", ring: "adopt", category: "Architecture", maturity: 4, trend: "up", investment: "high", roi: 2.8, vendorCount: 12 },
      { id: "soanwo-tr-03", name: "SASE/SSE Platform", ring: "trial", category: "Network", maturity: 3, trend: "up", investment: "medium", roi: 2.4, vendorCount: 10 },
      { id: "soanwo-tr-04", name: "CNAPP Cloud Security", ring: "trial", category: "Cloud", maturity: 3, trend: "up", investment: "medium", roi: 2.1, vendorCount: 7 },
      { id: "soanwo-tr-05", name: "Extended Detection and Response", ring: "adopt", category: "Detection", maturity: 4, trend: "stable", investment: "high", roi: 2.9, vendorCount: 9 },
      { id: "soanwo-tr-06", name: "Quantum-Safe Cryptography", ring: "assess", category: "Crypto", maturity: 2, trend: "up", investment: "low", roi: 0.8, vendorCount: 4 },
      { id: "soanwo-tr-07", name: "Security Service Edge", ring: "trial", category: "Network", maturity: 3, trend: "up", investment: "medium", roi: 2.0, vendorCount: 6 },
      { id: "soanwo-tr-08", name: "SOAR 2.0 Autonomous SOC", ring: "assess", category: "Operations", maturity: 2, trend: "up", investment: "low", roi: 1.2, vendorCount: 5 },
      { id: "soanwo-tr-09", name: "Software Supply Chain Security", ring: "trial", category: "DevSecOps", maturity: 3, trend: "up", investment: "medium", roi: 2.3, vendorCount: 8 },
      { id: "soanwo-tr-10", name: "Identity Threat Detection", ring: "adopt", category: "Identity", maturity: 3, trend: "up", investment: "high", roi: 2.7, vendorCount: 7 },
      { id: "soanwo-tr-11", name: "Data Security Posture Management", ring: "trial", category: "Data", maturity: 3, trend: "up", investment: "medium", roi: 2.2, vendorCount: 9 },
      { id: "soanwo-tr-12", name: "Decentralized Identity Standards", ring: "hold", category: "Identity", maturity: 1, trend: "stable", investment: "low", roi: 0.5, vendorCount: 3 },
    ];
  }

  private _soanwoRadarSummary(): Record<string, unknown> {
    const rings: Record<string, number> = { adopt: 0, trial: 0, assess: 0, hold: 0 };
    this._soanwoTechRadar.forEach(t => { if (rings[t.ring as keyof typeof rings] !== undefined) rings[t.ring as keyof typeof rings]++; });
    return { adopt: rings.adopt, trial: rings.trial, assess: rings.assess, hold: rings.hold, total: this._soanwoTechRadar.length, avgMaturity: 2.8, topInvestment: this._soanwoTechRadar.filter(t => t.investment === "high").map(t => t.name) };
  }

  // --- SOANWO Security Compliance Mapping Matrix ---
  private _initSoanwoComplianceMatrix(): void {
    const frameworks = ["ISO 27001", "SOC 2 Type II", "PCI DSS 4.0", "NIST CSF 2.0", "GDPR", "HIPAA", "FedRAMP", "CIS Controls v8"];
    const domains = ["Access Control", "Data Protection", "Network Security", "Endpoint Security", "Incident Response", "Risk Management", "Asset Management", "Compliance Monitoring"];
    this._soanwoComplianceMatrix = frameworks.map(fw => ({
      framework: fw, totalControls: Math.floor(Math.random() * 60) + 80, implemented: Math.floor(Math.random() * 40) + 50,
      partial: Math.floor(Math.random() * 20) + 10, gaps: Math.floor(Math.random() * 15) + 3,
      lastAudit: "2026-" + String(Math.floor(Math.random() * 4) + 1).padStart(2, "0") + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0"),
      nextAudit: "2027-" + String(Math.floor(Math.random() * 6) + 1).padStart(2, "0") + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0"),
      score: Math.floor(Math.random() * 20) + 72, status: Math.random() > 0.3 ? "compliant" : "partial",
      domains: domains.map(d => ({ domain: d, controls: Math.floor(Math.random() * 10) + 5, passed: Math.floor(Math.random() * 8) + 2 }))
    }));
  }

  private _soanwoComplianceTrend(): Record<string, unknown>[] {
    const quarters = ["Q1-2025", "Q2-2025", "Q3-2025", "Q4-2025", "Q1-2026", "Q2-2026"];
    return this._soanwoComplianceMatrix.map(fw => ({
      framework: fw, score: fw.score, status: fw.status,
      trend: quarters.map(q => Math.min(100, fw.score - 15 + Math.floor(Math.random() * 20))),
      gaps: fw.gaps, implemented: fw.implemented, total: fw.totalControls,
      coverage: Math.round((fw.implemented / fw.totalControls) * 100)
    }));
  }

  // --- SOANWO Threat Intelligence Correlation Engine ---
  private _initSoanwoThreatIntel(): void {
    const threatActors = ["APT29", "APT41", "Lazarus Group", "FIN7", "Conti", "Sandworm", "Fancy Bear", "Tick Group"];
    const techniques = ["T1059.001", "T1190", "T1566.001", "T1078", "T1055", "T1486", "T1021.001", "T1071.001"];
    const sectors = ["Finance", "Healthcare", "Technology", "Government", "Energy", "Manufacturing", "Retail", "Telecom"];
    this._soanwoThreatIntel = threatActors.map((actor, i) => ({
      actor, sophistication: ["advanced", "advanced", "moderate", "advanced", "moderate", "advanced", "advanced", "moderate"][i],
      targeting: sectors.slice(0, Math.floor(Math.random() * 4) + 2),
      primaryTechniques: techniques.slice(Math.floor(Math.random() * 3), Math.floor(Math.random() * 3) + 4),
      confidence: Math.floor(Math.random() * 30) + 65, lastObserved: "2026-04-" + String(Math.floor(Math.random() * 22) + 1).padStart(2, "0"),
      iocCount: Math.floor(Math.random() * 200) + 50, attributedCampaigns: Math.floor(Math.random() * 8) + 1,
      mitreTactics: ["Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion"].slice(0, Math.floor(Math.random() * 3) + 2),
      riskScore: Math.floor(Math.random() * 40) + 55, alertsTriggered: Math.floor(Math.random() * 30) + 5
    }));
  }

  private _soanwoThreatCorrelation(): Record<string, unknown>[] {
    return this._soanwoThreatIntel.filter(t => t.riskScore > 70).map(t => ({
      actor: t.actor, risk: t.riskScore, confidence: t.confidence,
      techniques: t.primaryTechniques, targeting: t.targeting,
      lastSeen: t.lastObserved, iocs: t.iocCount, campaigns: t.attributedCampaigns,
      recommendation: t.riskScore > 85 ? "Immediate defensive action required" : t.riskScore > 75 ? "Enhanced monitoring recommended" : "Standard monitoring sufficient"
    })).sort((a: any, b: any) => (b.risk as number) - (a.risk as number));
  }

  // --- SOANWO Security Metrics Deep Dive ---
  private _initSoanwoMetricsDeep(): void {
    const metricCategories = ["Detection Coverage", "Response Efficiency", "Prevention Effectiveness", "Recovery Speed", "Compliance Adherence"];
    this._soanwoMetricsDeep = metricCategories.map(cat => ({
      category: cat, metrics: Array.from({ length: 6 }, (_, i) => ({
        name: `${cat} Metric ${i + 1}`, value: Math.floor(Math.random() * 40) + 55,
        target: Math.floor(Math.random() * 15) + 82, unit: ["%", "ms", "count", "score"][Math.floor(Math.random() * 4)],
        trend: Math.random() > 0.4 ? "improving" : "stable", period: "30d",
        baseline: Math.floor(Math.random() * 20) + 50, benchmark: Math.floor(Math.random() * 10) + 80
      })),
      overallScore: Math.floor(Math.random() * 20) + 70, maturity: ["initial", "developing", "defined", "managed", "optimized"][Math.floor(Math.random() * 5)]
    }));
  }

  private _soanwoMetricsHeatmap(): number[][] {
    return this._soanwoMetricsDeep.map(cat =>
      cat.metrics.map(m => Math.round((m.value / m.target) * 100))
    );
  }

  // --- SOANWO Incident Cost Modeling ---
  private _initSoanwoCostModel(): void {
    const incidentTypes = ["Data Breach", "Ransomware", "DDoS", "Insider Threat", "Phishing", "Supply Chain", "Cloud Misconfig", "Zero-Day"];
    this._soanwoCostModel = incidentTypes.map(inc => ({
      incident: inc, avgCost: Math.floor(Math.random() * 8000000) + 1000000,
      maxCost: Math.floor(Math.random() * 20000000) + 5000000, minCost: Math.floor(Math.random() * 500000) + 100000,
      detectionTimeHrs: Math.floor(Math.random() * 200) + 10, containmentTimeHrs: Math.floor(Math.random() * 150) + 5,
      recoveryTimeHrs: Math.floor(Math.random() * 500) + 50, recordsAffected: Math.floor(Math.random() * 500000) + 10000,
      regulatoryFine: Math.floor(Math.random() * 3000000) + 200000, reputationCost: Math.floor(Math.random() * 2000000) + 500000,
      legalCost: Math.floor(Math.random() * 1500000) + 100000, notificationCost: Math.floor(Math.random() * 800000) + 50000,
      forensicsCost: Math.floor(Math.random() * 400000) + 50000, totalAnnualExposure: 0, frequency: Math.floor(Math.random() * 5) + 1
    }));
    this._soanwoCostModel.forEach(m => { m.totalAnnualExposure = m.avgCost * m.frequency; });
  }

  private _soanwoCostProjection(): Record<string, unknown>[] {
    return this._soanwoCostModel.map(m => ({
      incident: m.incident, avgCost: m.avgCost, annualExposure: m.totalAnnualExposure,
      frequency: m.frequency, detectionHrs: m.detectionTimeHrs, recoveryHrs: m.recoveryTimeHrs,
      records: m.recordsAffected, regulatory: m.regulatoryFine,
      roiOfInvestment: Math.round(m.avgCost * 0.15 / 100000), priority: m.totalAnnualExposure > 10000000 ? "critical" : m.totalAnnualExposure > 5000000 ? "high" : "medium"
    })).sort((a: any, b: any) => (b.annualExposure as number) - (a.annualExposure as number));
  }

  // --- SOANWO Security Architecture Pattern Library ---
  private _initSoanwoArchPatterns(): void {
    const patterns = ["Defense in Depth", "Zero Trust Network", "Microsegmentation", "Layered Encryption", "Blast Radius Minimization", "Fail Secure Design", "Least Privilege Access", "Secure-by-Default"];
    this._soanwoArchPatterns = patterns.map((p, i) => ({
      pattern: p, category: ["network", "identity", "network", "data", "architecture", "design", "identity", "development"][i],
      maturity: ["optimized", "managed", "defined", "managed", "repeatable", "defined", "managed", "repeatable"][i],
      implementation: Math.floor(Math.random() * 40) + 55, coverage: Math.floor(Math.random() * 30) + 60,
      components: Math.floor(Math.random() * 15) + 5, integrationPoints: Math.floor(Math.random() * 20) + 3,
      riskReduction: Math.floor(Math.random() * 25) + 60, costComplexity: ["low", "high", "medium", "medium", "high", "low", "medium", "medium"][i],
      dependencies: patterns.slice(0, Math.floor(Math.random() * 3)).filter(x => x !== p),
      lastReview: "2026-0" + String(Math.floor(Math.random() * 4) + 1) + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")
    }));
  }

  private _soanwoArchPatternAnalysis(): Record<string, unknown> {
    const implemented = this._soanwoArchPatterns.filter(p => p.implementation > 75).length;
    const avgCoverage = Math.round(this._soanwoArchPatterns.reduce((s: number, p: any) => s + p.coverage, 0) / this._soanwoArchPatterns.length);
    return {
      totalPatterns: this._soanwoArchPatterns.length, fullyImplemented: implemented, avgCoverage,
      avgRiskReduction: Math.round(this._soanwoArchPatterns.reduce((s: number, p: any) => s + p.riskReduction, 0) / this._soanwoArchPatterns.length),
      gaps: this._soanwoArchPatterns.filter(p => p.implementation < 60).map(p => p.pattern),
      recommendations: this._soanwoArchPatterns.filter(p => p.implementation < 70).map(p => ({ pattern: p.pattern, current: p.implementation, target: 85, effort: p.costComplexity }))
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


  private _ea7RiskAssessmentWorkflow = [
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

  private _ea7RiskMatrix5x5 = [
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

  private _ea7TreatmentOptions = [
    {id: 'ea7-T-001', riskId: 'RSK-042', risk: 'Ransomware Attack on Critical Infrastructure', before: 20, after: 6, strategy: 'Mitigate', controls: ['Next-gen EDR with behavioral detection and automated response', 'Zero-trust network micro-segmentation isolating critical assets', 'Immutable offline backup rotation with quarterly recovery testing', 'Incident response retainer with 1-hour response SLA'], cost: '$450K/yr', roi: '78% reduction vs $2.8M potential loss', timeline: 'Q3 2026', status: 'approved' as const},
    {id: 'ea7-T-002', riskId: 'RSK-018', risk: 'Insider Data Exfiltration via Cloud Storage', before: 15, after: 5, strategy: 'Mitigate', controls: ['Comprehensive DLP policies for all cloud applications and endpoints', 'UEBA behavioral analytics for anomalous access pattern detection', 'Endpoint restrictions on USB and personal cloud storage services', 'CASB integration for shadow IT discovery and policy enforcement'], cost: '$180K/yr', roi: '67% reduction vs $1.2M potential loss', timeline: 'Q2 2026', status: 'approved' as const},
    {id: 'ea7-T-003', riskId: 'RSK-067', risk: 'Supply Chain Compromise via Third-Party Component', before: 12, after: 8, strategy: 'Transfer', controls: ['Software supply chain insurance policy covering vendor incidents', 'SCA scanning requirements in all vendor procurement contracts', 'SBOM requirements and continuous monitoring for third-party components', 'Vendor security assessment program with annual re-evaluation'], cost: '$95K/yr', roi: '33% reduction vs $800K potential loss', timeline: 'Q4 2026', status: 'in_review' as const},
    {id: 'ea7-T-004', riskId: 'RSK-033', risk: 'Phishing-Driven Credential Theft Campaign', before: 16, after: 4, strategy: 'Mitigate', controls: ['AI-powered email filtering with real-time threat intelligence feeds', 'Monthly mandatory phishing simulations with targeted follow-up training', 'Hardware MFA enforcement across all users with passwordless transition', 'Security awareness program with role-specific training tracks'], cost: '$120K/yr', roi: '75% reduction vs $1.5M potential loss', timeline: 'Q2 2026', status: 'approved' as const},
    {id: 'ea7-T-005', riskId: 'RSK-091', risk: 'Zero-Day Exploit on Public-Facing Application', before: 10, after: 8, strategy: 'Accept', controls: ['WAF with virtual patching capability and rapid rule deployment', 'RASP runtime application self-protection on all production web apps', 'Incident response retainer with 4-hour response SLA commitment', 'Bug bounty program for proactive vulnerability discovery'], cost: '$60K/yr', roi: '20% reduction vs $500K potential loss', timeline: 'Ongoing', status: 'accepted' as const},
    {id: 'ea7-T-006', riskId: 'RSK-055', risk: 'GDPR Regulatory Non-Compliance Penalty', before: 15, after: 4, strategy: 'Mitigate', controls: ['Dedicated Data Protection Officer with quarterly board reporting', 'Automated compliance monitoring platform with real-time dashboards', 'Quarterly DPIA reviews for all high-risk processing activities', 'Privacy by design framework integrated into product development lifecycle'], cost: '$220K/yr', roi: '73% reduction vs $4M+ potential regulatory penalty', timeline: 'Q3 2026', status: 'approved' as const}
  ];

  private _ea7ComplianceRules = [
    {id: 'ea7-C-001', name: 'Password Policy Compliance', framework: 'NIST 800-53 IA-5', desc: 'Verify all accounts meet minimum password complexity, length, diversity, and rotation requirements defined in the security policy', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'pass' as const, passRate: 94.2, violations: 12, autoFix: true as const, fix: 'Force password reset within 24h', history: [{d: '04-22', r: 'pass', v: 12}, {d: '04-21', r: 'pass', v: 14}, {d: '04-20', r: 'fail', v: 18}, {d: '04-19', r: 'pass', v: 15}, {d: '04-18', r: 'pass', v: 13}]},
    {id: 'ea7-C-002', name: 'MFA Enrollment Verification', framework: 'NIST 800-53 IA-2', desc: 'Ensure all privileged and standard user accounts have multi-factor authentication properly enrolled and actively enforced', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'fail' as const, passRate: 87.5, violations: 34, autoFix: true as const, fix: 'Send mandatory enrollment notice with 48h deadline', history: [{d: '04-22', r: 'fail', v: 34}, {d: '04-21', r: 'fail', v: 31}, {d: '04-20', r: 'fail', v: 28}, {d: '04-19', r: 'fail', v: 25}, {d: '04-18', r: 'fail', v: 22}]},
    {id: 'ea7-C-003', name: 'Inactive Account Review', framework: 'NIST 800-53 AC-2', desc: 'Identify and disable accounts inactive for more than 90 days with automatic escalation at the 120-day threshold', enabled: true as const, freq: 'Weekly', lastRun: '2026-04-21T00:00Z', result: 'pass' as const, passRate: 96.8, violations: 5, autoFix: true as const, fix: 'Auto-disable at 120 days with manager notification', history: [{d: '04-21', r: 'pass', v: 5}, {d: '04-14', r: 'pass', v: 7}, {d: '04-07', r: 'pass', v: 9}, {d: '03-31', r: 'pass', v: 11}, {d: '03-24', r: 'pass', v: 13}]},
    {id: 'ea7-C-004', name: 'Encryption Standards Check', framework: 'NIST 800-53 SC-28', desc: 'Verify all production storage volumes use AES-256 or equivalent encryption with valid non-expired certificates', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'pass' as const, passRate: 99.1, violations: 2, autoFix: false as const, fix: 'Create priority ticket for manual remediation', history: [{d: '04-22', r: 'pass', v: 2}, {d: '04-21', r: 'pass', v: 2}, {d: '04-20', r: 'pass', v: 3}, {d: '04-19', r: 'pass', v: 3}, {d: '04-18', r: 'pass', v: 4}]},
    {id: 'ea7-C-005', name: 'Firewall Baseline Compliance', framework: 'NIST 800-53 SC-7', desc: 'Validate firewall rules against approved baseline to detect unauthorized modifications, drift, or orphaned rules', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T06:00Z', result: 'fail' as const, passRate: 91.3, violations: 18, autoFix: true as const, fix: 'Auto-revert non-compliant rules to baseline', history: [{d: '04-22', r: 'fail', v: 18}, {d: '04-21', r: 'pass', v: 12}, {d: '04-20', r: 'pass', v: 15}, {d: '04-19', r: 'pass', v: 14}, {d: '04-18', r: 'fail', v: 20}]},
    {id: 'ea7-C-006', name: 'Patch SLA Compliance', framework: 'CIS Benchmark L2', desc: 'Check all production systems against critical and high patch SLA requirements with overdue flagging', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T08:00Z', result: 'pass' as const, passRate: 97.6, violations: 8, autoFix: false as const, fix: 'Escalate overdue patches for expedited deployment', history: [{d: '04-22', r: 'pass', v: 8}, {d: '04-21', r: 'pass', v: 10}, {d: '04-20', r: 'pass', v: 12}, {d: '04-19', r: 'pass', v: 11}, {d: '04-18', r: 'pass', v: 14}]},
    {id: 'ea7-C-007', name: 'Data Classification Labels', framework: 'GDPR Art. 30', desc: 'Verify all databases, file shares, and cloud repositories have appropriate classification labels applied', enabled: true as const, freq: 'Weekly', lastRun: '2026-04-20T00:00Z', result: 'fail' as const, passRate: 82.4, violations: 45, autoFix: false as const, fix: 'Generate review tasks for data owners', history: [{d: '04-20', r: 'fail', v: 45}, {d: '04-13', r: 'fail', v: 42}, {d: '04-06', r: 'fail', v: 38}, {d: '03-30', r: 'fail', v: 35}, {d: '03-23', r: 'pass', v: 30}]},
    {id: 'ea7-C-008', name: 'Privileged Access Review', framework: 'SOX AC-6', desc: 'Review and validate all privileged access assignments on quarterly recertification schedule', enabled: true as const, freq: 'Monthly', lastRun: '2026-04-01T00:00Z', result: 'pass' as const, passRate: 93.7, violations: 22, autoFix: false as const, fix: 'Initiate recertification workflow with approvals', history: [{d: '04-01', r: 'pass', v: 22}, {d: '03-01', r: 'pass', v: 25}, {d: '02-01', r: 'pass', v: 28}, {d: '01-01', r: 'pass', v: 30}, {d: '12-01', r: 'pass', v: 32}]},
    {id: 'ea7-C-009', name: 'SIEM Log Coverage', framework: 'NIST 800-53 AU-2', desc: 'Verify all critical systems have logging enabled and actively forwarding to the centralized SIEM platform', enabled: true as const, freq: 'Weekly', lastRun: '2026-04-21T12:00Z', result: 'pass' as const, passRate: 95.5, violations: 7, autoFix: true as const, fix: 'Deploy missing log agents via config management', history: [{d: '04-21', r: 'pass', v: 7}, {d: '04-14', r: 'pass', v: 9}, {d: '04-07', r: 'pass', v: 11}, {d: '03-31', r: 'pass', v: 10}, {d: '03-24', r: 'pass', v: 13}]},
    {id: 'ea7-C-010', name: 'Certificate Expiry Monitor', framework: 'NIST 800-53 SC-13', desc: 'Monitor all TLS/SSL certificates for upcoming expiry within 30-day warning windows', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'pass' as const, passRate: 98.9, violations: 3, autoFix: true as const, fix: 'Trigger auto-renewal via ACME protocol', history: [{d: '04-22', r: 'pass', v: 3}, {d: '04-21', r: 'pass', v: 3}, {d: '04-20', r: 'pass', v: 4}, {d: '04-19', r: 'pass', v: 4}, {d: '04-18', r: 'pass', v: 5}]}
  ];

  private _ea7TalentPositions = [
    {id: 'ea7-H-001', title: 'Senior Penetration Tester', dept: 'Red Team', level: 'Senior', loc: 'Remote US', salary: '$165K-$195K', posted: '2026-03-15', applicants: 23, pipeline: 8, interviews: 4, offers: 1, urgency: 'high' as const, manager: 'Alex Chen', skills: ['Burp Suite', 'Metasploit', 'Cobalt Strike', 'Python', 'OWASP Top 10'], nice: ['OSCP/OSCE', 'Bug bounty', 'Cloud pentest']},
    {id: 'ea7-H-002', title: 'Cloud Security Engineer', dept: 'Cloud Security', level: 'Mid-Senior', loc: 'SF/Remote', salary: '$155K-$180K', posted: '2026-03-20', applicants: 45, pipeline: 12, interviews: 6, offers: 2, urgency: 'high' as const, manager: 'Mike Johnson', skills: ['AWS/Azure/GCP', 'Terraform', 'Kubernetes', 'IAM', 'CSPM'], nice: ['CCSP', 'CKS', 'Serverless']},
    {id: 'ea7-H-003', title: 'SOC Analyst L2', dept: 'Security Operations', level: 'Mid', loc: 'Austin TX', salary: '$105K-$130K', posted: '2026-04-01', applicants: 67, pipeline: 18, interviews: 8, offers: 0, urgency: 'medium' as const, manager: 'Lisa Park', skills: ['SIEM', 'Incident triage', 'Malware analysis', 'TCP/IP'], nice: ['GCIA', 'SOAR', 'Kill chain']},
    {id: 'ea7-H-004', title: 'Staff Security Architect', dept: 'Architecture', level: 'Staff', loc: 'Remote US', salary: '$200K-$240K', posted: '2026-02-28', applicants: 12, pipeline: 3, interviews: 2, offers: 0, urgency: 'critical' as const, manager: 'David Lee', skills: ['Enterprise arch', 'Zero trust', 'Risk frameworks', 'Board comms'], nice: ['CISSP+SABSA', 'Team building', 'Speaker']},
    {id: 'ea7-H-005', title: 'GRC Analyst', dept: 'GRC', level: 'Mid', loc: 'NY/Remote', salary: '$110K-$135K', posted: '2026-04-05', applicants: 34, pipeline: 9, interviews: 3, offers: 1, urgency: 'medium' as const, manager: 'Rachel Green', skills: ['ISO 27001', 'SOC 2', 'Risk assessment', 'Audit'], nice: ['CRISC', 'CISA', 'GDPR']},
    {id: 'ea7-H-006', title: 'Threat Intel Analyst', dept: 'Threat Intel', level: 'Mid-Senior', loc: 'Remote US', salary: '$140K-$170K', posted: '2026-03-25', applicants: 19, pipeline: 5, interviews: 2, offers: 0, urgency: 'low' as const, manager: 'James Wilson', skills: ['MITRE ATT&CK', 'OSINT', 'Threat modeling', 'Reverse eng'], nice: ['CTIA', 'Nation-state', 'Dark web']},
    {id: 'ea7-H-007', title: 'AppSec Engineer', dept: 'AppSec', level: 'Senior', loc: 'Seattle/Remote', salary: '$160K-$190K', posted: '2026-04-10', applicants: 28, pipeline: 7, interviews: 3, offers: 0, urgency: 'medium' as const, manager: 'Emily Zhang', skills: ['SAST/DAST/SCA', 'Secure SDLC', 'Code review', 'CI/CD'], nice: ['CSSLP', 'Mobile security']},
    {id: 'ea7-H-008', title: 'IAM Engineer', dept: 'IAM', level: 'Mid', loc: 'Remote US', salary: '$135K-$160K', posted: '2026-04-08', applicants: 31, pipeline: 10, interviews: 5, offers: 1, urgency: 'medium' as const, manager: 'Chris Martinez', skills: ['Okta/Azure AD', 'SAML/OIDC', 'PAM', 'RBAC'], nice: ['CISSP', 'Zero trust IAM']}
  ];

  private _ea7InterviewScorecard = [
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

  private _ea7OnboardingSteps = [
    {id: 'ea7-OB-01', item: 'Provision security-hardened laptop, monitors, peripherals, and configured workstation image with all required security tools', cat: 'IT Setup', day: 'Day 1', owner: 'IT Operations'},
    {id: 'ea7-OB-02', item: 'Create AD account, email, Slack, VPN, SSO enrollment, and all required application access accounts', cat: 'Access', day: 'Day 1', owner: 'IAM Team'},
    {id: 'ea7-OB-03', item: 'Grant security tooling access: SIEM console, EDR dashboard, vuln scanner, pentest platforms, SOAR', cat: 'Tools', day: 'Day 1-2', owner: 'SOC Manager'},
    {id: 'ea7-OB-04', item: 'Complete MFA enrollment, security awareness onboarding course, and acceptable use policy acknowledgment', cat: 'Security', day: 'Day 1', owner: 'Awareness Team'},
    {id: 'ea7-OB-05', item: 'Sign NDA, employment agreement, IP assignment, and code of conduct documents with HR', cat: 'HR', day: 'Day 1', owner: 'Human Resources'},
    {id: 'ea7-OB-06', item: 'Introduction meetings with direct team members and key cross-functional stakeholders', cat: 'Integration', day: 'Week 1', owner: 'Hiring Manager'},
    {id: 'ea7-OB-07', item: 'Security architecture overview, tooling walkthrough, and operational runbook review sessions', cat: 'Training', day: 'Week 1-2', owner: 'Security Architect'},
    {id: 'ea7-OB-08', item: 'Shadow experienced team member on active incident response and threat hunting investigations', cat: 'Mentoring', day: 'Week 2-3', owner: 'SOC Lead'},
    {id: 'ea7-OB-09', item: 'Set up individual certification study plan aligned with role requirements and career goals', cat: 'Development', day: 'Week 2', owner: 'Hiring Manager'},
    {id: 'ea7-OB-10', item: 'Establish 30-60-90 day goals, define success metrics, and schedule first performance checkpoint', cat: 'Goals', day: 'Week 1', owner: 'Hiring Manager'}
  ];

  private _ea7MetricsDashboard = [
    {id: 'ea7-MTD-001', name: 'Mean Time to Detect (MTTD)', value: '4.2 hours', trend: 'improving' as const, target: '< 4 hours', source: 'SIEM - Splunk', method: 'Median time from first alert to analyst acknowledgment', owner: 'SOC Manager', sla: '4 hours', prev: '5.1 hours', spark: [5.8, 5.4, 5.1, 4.9, 4.7, 4.5, 4.3, 4.2], breakdown: [{src: 'Network IDS', pct: '35%', avg: '3.8h'}, {src: 'Endpoint EDR', pct: '28%', avg: '4.1h'}, {src: 'Email Gateway', pct: '22%', avg: '3.5h'}, {src: 'Cloud Security', pct: '10%', avg: '5.2h'}, {src: 'User Reports', pct: '5%', avg: '6.8h'}]},
    {id: 'ea7-MTD-002', name: 'Mean Time to Respond (MTTR)', value: '2.8 hours', trend: 'stable' as const, target: '< 3 hours', source: 'SOAR - XSOAR', method: 'Median time from acknowledgment to first containment action', owner: 'IR Lead', sla: '3 hours', prev: '2.7 hours', spark: [3.2, 3.0, 2.9, 2.8, 2.8, 2.9, 2.8, 2.8], breakdown: [{src: 'Auto Playbooks', pct: '42%', avg: '1.2h'}, {src: 'Semi-Auto', pct: '33%', avg: '2.5h'}, {src: 'Manual', pct: '20%', avg: '5.1h'}, {src: 'L3 Escalation', pct: '5%', avg: '8.3h'}]},
    {id: 'ea7-MTD-003', name: 'Patch Compliance Rate', value: '97.6%', trend: 'improving' as const, target: '> 95%', source: 'Tenable.io', method: 'Pct of critical/high vulns patched within SLA windows', owner: 'Vuln Manager', sla: '95%', prev: '96.1%', spark: [93.2, 94.1, 94.8, 95.3, 95.9, 96.4, 97.0, 97.6], breakdown: [{src: 'Critical (7d)', pct: '40%', rate: '99.2%'}, {src: 'High (30d)', pct: '35%', rate: '97.8%'}, {src: 'Medium (90d)', pct: '20%', rate: '95.1%'}, {src: 'Low (180d)', pct: '5%', rate: '89.4%'}]},
    {id: 'ea7-MTD-004', name: 'Phishing Click Rate', value: '3.2%', trend: 'improving' as const, target: '< 5%', source: 'KnowBe4 + Proofpoint', method: 'Pct of users clicking simulated phishing links monthly', owner: 'Awareness Lead', sla: '5%', prev: '4.1%', spark: [6.8, 6.2, 5.5, 5.1, 4.6, 4.1, 3.6, 3.2], breakdown: [{src: 'Spear Phishing', pct: '35%', rate: '5.1%'}, {src: 'Generic Phishing', pct: '30%', rate: '2.8%'}, {src: 'BEC Sim', pct: '20%', rate: '3.5%'}, {src: 'SMS Phishing', pct: '15%', rate: '1.9%'}]},
    {id: 'ea7-MTD-005', name: 'Security Posture Score', value: '784', trend: 'improving' as const, target: '> 750', source: 'SecurityScorecard', method: 'Composite: external 30%, compliance 25%, vuln 25%, config 20%', owner: 'CISO', sla: '> 750', prev: '771', spark: [748, 752, 758, 762, 768, 773, 778, 784], breakdown: [{src: 'External Rating', pct: '30%', score: '791'}, {src: 'Compliance', pct: '25%', score: '812'}, {src: 'Vuln Mgmt', pct: '25%', score: '745'}, {src: 'Config', pct: '20%', score: '769'}]},
    {id: 'ea7-MTD-006', name: 'Vulnerability Backlog', value: '142', trend: 'improving' as const, target: '< 150', source: 'Tenable + Qualys', method: 'Total open vulns across all scanned assets tracked weekly', owner: 'Vuln Manager', sla: '< 150', prev: '168', spark: [210, 198, 185, 175, 165, 158, 150, 142], breakdown: [{src: 'Critical', pct: '8%', count: '11'}, {src: 'High', pct: '22%', count: '31'}, {src: 'Medium', pct: '45%', count: '64'}, {src: 'Low', pct: '25%', count: '36'}]}
  ];

  private _ea7ArchReview = [
    {id: 'ea7-AR-001', cat: 'Network', item: 'Network segmentation between trust zones with dedicated firewalls and granular ACLs', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Micro-segmentation via NSX across all production zones'},
    {id: 'ea7-AR-002', cat: 'Network', item: 'DMZ architecture isolating public services from internal network', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Dual-firewall DMZ with WAF and DDoS mitigation'},
    {id: 'ea7-AR-003', cat: 'Network', item: 'Least-privilege traffic flows with deny-by-default and quarterly review', sev: 'high' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Explicit allow rules with automated drift detection'},
    {id: 'ea7-AR-004', cat: 'Network', item: 'Encrypted external communications with IPSec/TLS 1.3 and PFS', sev: 'high' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'IKEv2 with PFS, TLS 1.3 for all external APIs'},
    {id: 'ea7-AR-005', cat: 'Identity', item: 'Centralized IdP with SSO and automated SCIM provisioning', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'Okta SSO SAML 2.0 for 247 apps with SCIM'},
    {id: 'ea7-AR-006', cat: 'Identity', item: 'RBAC with quarterly reviews and automated deprovisioning', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'Quarterly recertification with JIT admin access'},
    {id: 'ea7-AR-007', cat: 'Identity', item: 'PAM controlling all admin and service accounts with session recording', sev: 'high' as const, status: 'fail' as const, reviewer: 'IAM Lead', notes: '3 legacy accounts pending CyberArk enrollment'},
    {id: 'ea7-AR-008', cat: 'Identity', item: 'MFA enforced for all users, hardware tokens for privileged access', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'FIDO2 for admins, push MFA for users, 99.8% enrollment'},
    {id: 'ea7-AR-009', cat: 'Data', item: 'Data classification enforced with automated labeling on all repos', sev: 'high' as const, status: 'partial' as const, reviewer: 'Data Protection Lead', notes: 'Framework deployed, gaps on 4 legacy file shares'},
    {id: 'ea7-AR-010', cat: 'Data', item: 'AES-256 encryption at rest for all sensitive data stores', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Data Protection Lead', notes: 'Full-disk, TDE on DBs, SSE-KMS on cloud storage'},
    {id: 'ea7-AR-011', cat: 'Data', item: 'DLP monitoring and preventing unauthorized data exfiltration', sev: 'high' as const, status: 'pass' as const, reviewer: 'Data Protection Lead', notes: 'DLP active on email, endpoint, cloud, and network'},
    {id: 'ea7-AR-012', cat: 'Data', item: 'Encrypted off-site backups with quarterly restore testing', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Infrastructure Lead', notes: '3-2-1 strategy with immutable backups'},
    {id: 'ea7-AR-013', cat: 'AppSec', item: 'Secure SDLC with SAST, DAST, SCA in all CI/CD pipelines', sev: 'high' as const, status: 'pass' as const, reviewer: 'AppSec Lead', notes: '34 pipelines with security gates and PR blocking'},
    {id: 'ea7-AR-014', cat: 'AppSec', item: 'API gateway with auth, rate limiting, schema validation', sev: 'high' as const, status: 'pass' as const, reviewer: 'AppSec Lead', notes: 'Kong with OAuth2, rate limits, OpenAPI validation'},
    {id: 'ea7-AR-015', cat: 'AppSec', item: 'Container security with image scanning and runtime protection', sev: 'high' as const, status: 'partial' as const, reviewer: 'Cloud Security Lead', notes: 'Trivy scanning, Falco runtime in 80% of clusters'},
    {id: 'ea7-AR-016', cat: 'Monitoring', item: 'SIEM collecting from all critical systems with correlation rules', sev: 'critical' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'Splunk 98% coverage with 1200+ correlation rules'},
    {id: 'ea7-AR-017', cat: 'Monitoring', item: 'EDR with behavioral detection on all managed endpoints', sev: 'high' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'CrowdStrike on 99.2% endpoints with 24/7 MDR'},
    {id: 'ea7-AR-018', cat: 'Monitoring', item: 'Executive dashboards with real-time posture visibility', sev: 'medium' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'PowerBI dashboards with weekly exec summaries'},
    {id: 'ea7-AR-019', cat: 'Cloud', item: 'CSPM monitoring and remediating cloud misconfigurations', sev: 'high' as const, status: 'pass' as const, reviewer: 'Cloud Security Lead', notes: 'Prisma Cloud 450+ checks with auto-remediation'},
    {id: 'ea7-AR-020', cat: 'Cloud', item: 'IaC templates scanned before deployment to production', sev: 'high' as const, status: 'partial' as const, reviewer: 'Cloud Security Lead', notes: 'Checkov for Terraform, cfn-nag for CloudFormation pending'}
  ];

  private _getea7RiskProgress(): number {
    return Math.round(this._ea7RiskAssessmentWorkflow.filter(s => s.status === 'completed').length / this._ea7RiskAssessmentWorkflow.length * 100);
  }

  private _getea7TreatmentSummary(): {total: number; approved: number; avgReduction: number; investment: string} {
    const a = this._ea7TreatmentOptions.filter(r => r.status === 'approved').length;
    const avg = this._ea7TreatmentOptions.reduce((s, r) => s + ((r.before - r.after) / r.before * 100), 0) / this._ea7TreatmentOptions.length;
    return {total: this._ea7TreatmentOptions.length, approved: a, avgReduction: Math.round(avg), investment: '$1.125M annually'};
  }

  private _getea7RuleSummary(): {total: number; passing: number; failing: number; avgRate: number; violations: number} {
    const p = this._ea7ComplianceRules.filter(r => r.result === 'pass').length;
    const f = this._ea7ComplianceRules.filter(r => r.result === 'fail').length;
    const avg = this._ea7ComplianceRules.reduce((s, r) => s + r.passRate, 0) / this._ea7ComplianceRules.length;
    const v = this._ea7ComplianceRules.reduce((s, r) => s + r.violations, 0);
    return {total: this._ea7ComplianceRules.length, passing: p, failing: f, avgRate: Math.round(avg * 10) / 10, violations: v};
  }

  private _getea7PipelineStats(): {positions: number; applicants: number; interviewing: number; offers: number; critical: number} {
    const t = this._ea7TalentPositions.length;
    const a = this._ea7TalentPositions.reduce((s, p) => s + p.applicants, 0);
    const i = this._ea7TalentPositions.reduce((s, p) => s + p.interviews, 0);
    const o = this._ea7TalentPositions.reduce((s, p) => s + p.offers, 0);
    const c = this._ea7TalentPositions.filter(x => x.urgency === 'critical').length;
    return {positions: t, applicants: a, interviewing: i, offers: o, critical: c};
  }

  private _getea7MetricTrends(): {improving: number; stable: number; total: number} {
    const imp = this._ea7MetricsDashboard.filter(m => m.trend === 'improving').length;
    const stb = this._ea7MetricsDashboard.filter(m => m.trend === 'stable').length;
    return {improving: imp, stable: stb, total: this._ea7MetricsDashboard.length};
  }

  private _getea7ArchScore(): {total: number; passed: number; failed: number; partial: number; score: number} {
    const p = this._ea7ArchReview.filter(c => c.status === 'pass').length;
    const f = this._ea7ArchReview.filter(c => c.status === 'fail').length;
    const pa = this._ea7ArchReview.filter(c => c.status === 'partial').length;
    return {total: this._ea7ArchReview.length, passed: p, failed: f, partial: pa, score: Math.round((p / this._ea7ArchReview.length) * 100)};
  }


  private _zea7IncidentScenarios = [
    {id: 'zea7-IS-001', name: 'Ransomware Outbreak in Production Environment', category: 'Malware', likelihood: 'Medium', impact: 'Critical', riskScore: 15, playbooks: ['IR-Ransomware-Isolate', 'IR-Ransomware-Eradicate', 'IR-Ransomway-Recover'], estimatedMTTD: '15min', estimatedMTTR: '4h', involvedTeams: ['SOC', 'IR', 'Infrastructure', 'Legal', 'Comms'], keyIndicators: ['Mass file encryption events', 'Ransom note deployment', 'Lateral movement via SMB/RDP', 'Backup deletion attempts'], mitigationControls: ['EDR behavioral detection', 'Network segmentation', 'Immutable backups', 'Email filtering'], lessonsLearned: 'Ensure offline backups are tested quarterly and Ransomware-specific playbooks are updated with latest threat intelligence', lastDrillDate: '2026-03-15', nextDrillDate: '2026-06-15'},
    {id: 'zea7-IS-002', name: 'Cloud Misconfiguration Leading to Data Exposure', category: 'Cloud', likelihood: 'High', impact: 'High', riskScore: 16, playbooks: ['IR-Cloud-Misconfig-Assess', 'IR-Cloud-Misconfig-Remediate', 'IR-Cloud-Misconfig-Notify'], estimatedMTTD: '2h', estimatedMTTR: '6h', involvedTeams: ['Cloud Security', 'SOC', 'Data Protection', 'Legal'], keyIndicators: ['Public S3 bucket exposure', 'Overly permissive IAM policies', 'Unencrypted database snapshots', 'Public API endpoint discovery'], mitigationControls: ['CSPM monitoring', 'IAM policy analyzer', 'Automated remediation', 'Cloud audit logging'], lessonsLearned: 'Implement CSPM with auto-remediation for common misconfigurations and conduct monthly cloud configuration reviews', lastDrillDate: '2026-02-20', nextDrillDate: '2026-05-20'},
    {id: 'zea7-IS-003', name: 'Insider Threat Data Exfiltration', category: 'Insider', likelihood: 'Low', impact: 'Critical', riskScore: 12, playbooks: ['IR-Insider-Investigate', 'IR-Insider-Contain', 'IR-Insider-Escalate'], estimatedMTTD: '8h', estimatedMTTR: '24h', involvedTeams: ['SOC', 'IR', 'HR', 'Legal', 'IAM'], keyIndicators: ['Anomalous data access patterns', 'Large file downloads to USB or cloud', 'Off-hours access to sensitive systems', 'Accessing data outside normal job scope'], mitigationControls: ['UEBA analytics', 'DLP policies', 'PAM controls', 'Access reviews'], lessonsLearned: 'Strengthen UEBA baselines and implement automated alerts for data access pattern anomalies', lastDrillDate: '2026-01-10', nextDrillDate: '2026-04-10'},
    {id: 'zea7-IS-004', name: 'Supply Chain Attack via Compromised Vendor Software', category: 'Supply Chain', likelihood: 'Low', impact: 'Critical', riskScore: 12, playbooks: ['IR-SupplyChain-Detect', 'IR-SupplyChain-Isolate', 'IR-SupplyChain-Remediate'], estimatedMTTD: '24h', estimatedMTTR: '72h', involvedTeams: ['SOC', 'IR', 'Procurement', 'Vendor Mgmt', 'Legal'], keyIndicators: ['Unexpected network connections from vendor software', 'Modified binaries or dependencies', 'Anomalous behavior from trusted applications', 'SBOM discrepancy alerts'], mitigationControls: ['SCA scanning', 'SBOM monitoring', 'Vendor security assessments', 'Network segmentation'], lessonsLearned: 'Require SBOM from all vendors and implement continuous monitoring of third-party component behavior', lastDrillDate: '2026-03-01', nextDrillDate: '2026-06-01'},
    {id: 'zea7-IS-005', name: 'Credential Stuffing Attack on Customer Portal', category: 'External Attack', likelihood: 'High', impact: 'Medium', riskScore: 12, playbooks: ['IR-CredentialStuffing-Detect', 'IR-CredentialStuffing-Block', 'IR-CredentialStuffing-Notify'], estimatedMTTD: '30min', estimatedMTTR: '2h', involvedTeams: ['SOC', 'AppSec', 'Customer Support', 'Comms'], keyIndicators: ['High volume of failed login attempts', 'Login attempts from known compromised credential lists', 'Unusual geographic distribution of login attempts', 'Account takeover indicators'], mitigationControls: ['WAF rate limiting', 'CAPTCHA on login', 'MFA enforcement', 'Credential monitoring service'], lessonsLearned: 'Deploy advanced bot detection on login endpoints and implement proactive credential monitoring for customer accounts', lastDrillDate: '2026-04-01', nextDrillDate: '2026-07-01'},
    {id: 'zea7-IS-006', name: 'Phishing Campaign Targeting Executive Team', category: 'Social Engineering', likelihood: 'High', impact: 'High', riskScore: 16, playbooks: ['IR-Phishing-Contain', 'IR-Phishing-Investigate', 'IR-Phishing-Notify'], estimatedMTTD: '1h', estimatedMTTR: '4h', involvedTeams: ['SOC', 'Awareness', 'Executive Office', 'IT'], keyIndicators: ['Sophisticated spear-phishing emails to C-suite', 'Business email compromise indicators', 'Redirected MFA approval requests', 'Unauthorized wire transfer attempts'], mitigationControls: ['AI email filtering', 'Executive awareness training', 'Out-of-band verification policy', 'DMARC/DKIM/SPF'], lessonsLearned: 'Implement additional email security controls for executive mailboxes and conduct monthly spear-phishing simulations', lastDrillDate: '2026-02-15', nextDrillDate: '2026-05-15'}
  ];

  private _zea7SecurityFrameworks = [
    {name: 'NIST Cybersecurity Framework 2.0', version: '2.0', categories: ['Govern', 'Identify', 'Protect', 'Detect', 'Respond', 'Recover'], currentMaturity: 'Tier 3 - Repeatable', targetMaturity: 'Tier 4 - Adaptive', gaps: ['Supply chain risk management maturity', 'Continuous improvement feedback loop documentation', 'External dependency mapping completeness'], strengths: ['Strong detect and respond capabilities', 'Well-documented protect controls', 'Active vulnerability management program'], lastAssessment: '2026-03-01', nextAssessment: '2026-09-01', owner: 'CISO'},
    {name: 'ISO 27001:2022', version: '2022', categories: ['A.5 Organizational', 'A.6 People', 'A.7 Physical', 'A.8 Technological'], currentMaturity: 'Certified', targetMaturity: 'Certified with zero nonconformities', gaps: ['A.8.25 Secure development lifecycle documentation', 'A.5.23 Cloud services information security policy update', 'A.8.16 Monitoring activities completeness'], strengths: ['Clean certification audit with zero major nonconformities', 'Strong access control framework', 'Comprehensive incident management process'], lastAssessment: '2026-01-15', nextAssessment: '2027-01-15', owner: 'Compliance Officer'},
    {name: 'CIS Controls v8.1', version: '8.1', categories: ['IG1 (Essential Cyber Hygiene)', 'IG2 (Expanded)', 'IG3 (Comprehensive)'], currentMaturity: 'IG2 - 87% Implementation', targetMaturity: 'IG3 - 95% Implementation', gaps: ['Control 4.8 - Uninterruptible Power Supply monitoring', 'Control 13.3 - Application software security testing automation', 'Control 16.9 - Adversary emulation testing frequency'], strengths: ['Strong IG1 implementation at 98%', 'Comprehensive inventory and control management', 'Active continuous monitoring and response'], lastAssessment: '2026-04-01', nextAssessment: '2026-10-01', owner: 'Security Architect'},
    {name: 'MITRE ATT&CK v14.1', version: '14.1', categories: ['Enterprise', 'Mobile', 'ICS'], currentMaturity: 'Detection coverage 72%', targetMaturity: 'Detection coverage 90%', gaps: ['Collection techniques detection coverage', 'Command and control channel identification', 'Impact technique prevention controls'], strengths: ['Strong initial access detection', 'Comprehensive persistence monitoring', 'Active threat hunting program aligned to ATT&CK'], lastAssessment: '2026-02-01', nextAssessment: '2026-05-01', owner: 'Threat Intelligence Lead'}
  ];

  private _zea7ThirdPartyRiskData = [
    {vendorId: 'zea7-V-001', vendorName: 'CloudFlare Inc', category: 'CDN and DDoS Protection', tier: 'Critical', riskScore: 22, assessmentDate: '2026-03-15', nextReview: '2026-06-15', findings: ['Shared responsibility model documentation needs update', 'Incident notification SLA verification required'], controls: ['SOC 2 Type II certified', 'ISO 27001 certified', 'Annual penetration testing'], slaCompliance: '99.99% uptime SLA met', dataProcessing: 'Minimal PII access, no data storage', status: 'approved' as const},
    {vendorId: 'zea7-V-002', vendorName: 'Okta Inc', category: 'Identity Provider', tier: 'Critical', riskScore: 18, assessmentDate: '2026-02-28', nextReview: '2026-05-28', findings: ['MFA bypass vulnerability remediation verified', 'API rate limiting configuration reviewed'], controls: ['SOC 2 Type II certified', 'FedRAMP authorized', 'Bug bounty program active'], slaCompliance: '99.95% uptime SLA met', dataProcessing: 'Identity data processing with DPA in place', status: 'approved' as const},
    {vendorId: 'zea7-V-003', vendorName: 'CrowdStrike Holdings', category: 'Endpoint Detection and Response', tier: 'Critical', riskScore: 15, assessmentDate: '2026-03-01', nextReview: '2026-06-01', findings: ['Sensor performance optimization review completed', 'Data retention policy aligned with requirements'], controls: ['SOC 2 Type II certified', 'ISO 27001 certified', 'Independent code review'], slaCompliance: 'All SLAs met within defined thresholds', dataProcessing: 'Telemetry data only, no customer content access', status: 'approved' as const},
    {vendorId: 'zea7-V-004', vendorName: 'AnalyticsPro Corp', category: 'Business Intelligence', tier: 'High', riskScore: 28, assessmentDate: '2026-01-15', nextReview: '2026-04-15', findings: ['Data residency requirements not fully documented', 'Sub-processor list needs update with new acquisitions', 'Encryption key management review pending'], controls: ['SOC 2 Type II pending renewal', 'GDPR compliance self-assessed'], slaCompliance: '98.5% uptime - below 99% target', dataProcessing: 'Extensive customer data access for analytics processing', status: 'conditional' as const},
    {vendorId: 'zea7-V-005', vendorName: 'MarketingTech LLC', category: 'Email Marketing Platform', tier: 'Medium', riskScore: 35, assessmentDate: '2025-12-01', nextReview: '2026-03-01', findings: ['Outdated security assessment - 4 months overdue', 'No current SOC 2 certification', 'Data processing agreement expired', 'Sub-processor transparency report not available'], controls: ['Self-assessed security questionnaire', 'Basic encryption standards'], slaCompliance: '96% uptime - below contractual SLA', dataProcessing: 'Full customer contact list access with email sending capabilities', status: 'remediation_required' as const}
  ];

  private _zea7SecurityTrainingCatalog = [
    {id: 'zea7-TR-001', title: 'Security Awareness Fundamentals', audience: 'All Employees', duration: '45 min', frequency: 'Annual', completionRate: 94.2, passingScore: 80, avgScore: 87, modules: ['Security threats overview', 'Phishing identification', 'Social engineering awareness', 'Data handling best practices', 'Incident reporting procedures'], lastUpdated: '2026-01-15', nextUpdate: '2027-01-15', platform: 'KnowBe4'},
    {id: 'zea7-TR-002', title: 'Advanced Phishing Defense', audience: 'All Employees', duration: '30 min', frequency: 'Quarterly', completionRate: 91.8, passingScore: 90, avgScore: 82, modules: ['Spear phishing recognition', 'BEC identification', 'Vishing and smishing awareness', 'Verify before you trust framework'], lastUpdated: '2026-03-01', nextUpdate: '2026-06-01', platform: 'KnowBe4'},
    {id: 'zea7-TR-003', title: 'Secure Coding Practices', audience: 'Development Teams', duration: '4 hours', frequency: 'Annual', completionRate: 88.5, passingScore: 75, avgScore: 81, modules: ['OWASP Top 10 deep dive', 'Secure SDLC integration', 'Code review best practices', 'Dependency management', 'Security testing methodologies'], lastUpdated: '2026-02-01', nextUpdate: '2027-02-01', platform: 'Internal LMS'},
    {id: 'zea7-TR-004', title: 'Incident Response Training', audience: 'SOC and IR Teams', duration: '8 hours', frequency: 'Quarterly', completionRate: 96.7, passingScore: 85, avgScore: 91, modules: ['IR process and procedures', 'Evidence handling and chain of custody', 'Communication protocols', 'Tabletop exercise scenarios', 'Tool proficiency assessment'], lastUpdated: '2026-04-01', nextUpdate: '2026-07-01', platform: 'Internal LMS + Range'},
    {id: 'zea7-TR-005', title: 'Cloud Security Fundamentals', audience: 'DevOps and Cloud Teams', duration: '3 hours', frequency: 'Annual', completionRate: 85.2, passingScore: 75, avgScore: 78, modules: ['Cloud shared responsibility model', 'IAM best practices', 'Network security in the cloud', 'Data protection and encryption', 'Compliance in cloud environments'], lastUpdated: '2026-01-01', nextUpdate: '2027-01-01', platform: 'Internal LMS'},
    {id: 'zea7-TR-006', title: 'Executive Security Briefing', audience: 'C-Suite and Board', duration: '1 hour', frequency: 'Quarterly', completionRate: 100.0, passingScore: 0, avgScore: 0, modules: ['Current threat landscape', 'Security posture update', 'Risk register review', 'Upcoming security initiatives', 'Compliance status summary'], lastUpdated: '2026-04-01', nextUpdate: '2026-07-01', platform: 'In-person/Video'}
  ];

  private _zea7SecurityToolInventory = [
    {id: 'zea7-TL-001', name: 'Splunk Enterprise Security', category: 'SIEM', version: '9.1.2', license: 'Enterprise', annualCost: '$285K', users: 45, coverage: '98% of critical log sources', integrations: ['CrowdStrike', 'Okta', 'AWS CloudTrail', 'Azure AD', 'Proofpoint'], health: 'healthy' as const, lastMaintenance: '2026-04-15', nextMaintenance: '2026-07-15', owner: 'SOC Manager'},
    {id: 'zea7-TL-002', name: 'CrowdStrike Falcon', category: 'EDR/XDR', version: '7.12', license: 'Enterprise', annualCost: '$320K', users: 2800, coverage: '99.2% of managed endpoints', integrations: ['Splunk', 'ServiceNow', 'Okta', 'Palo Alto Networks'], health: 'healthy' as const, lastMaintenance: '2026-04-10', nextMaintenance: '2026-07-10', owner: 'Endpoint Security Lead'},
    {id: 'zea7-TL-003', name: 'Tenable.io', category: 'Vulnerability Management', version: '6.14', license: 'Enterprise', annualCost: '$180K', users: 25, coverage: 'All production and staging assets', integrations: ['Splunk', 'ServiceNow', 'Jira', 'Slack'], health: 'healthy' as const, lastMaintenance: '2026-04-12', nextMaintenance: '2026-07-12', owner: 'Vulnerability Manager'},
    {id: 'zea7-TL-004', name: 'Prisma Cloud', category: 'CSPM/CWPP', version: '32.1', license: 'Enterprise', annualCost: '$240K', users: 18, coverage: 'AWS, Azure, GCP environments', integrations: ['AWS Security Hub', 'Azure Defender', 'Splunk', 'Jira'], health: 'degraded' as const, lastMaintenance: '2026-04-08', nextMaintenance: '2026-07-08', owner: 'Cloud Security Lead'},
    {id: 'zea7-TL-005', name: 'KnowBe4 Platform', category: 'Security Awareness', version: 'Current', license: 'Enterprise', annualCost: '$85K', users: 3200, coverage: 'All employees', integrations: ['Okta SCIM', 'Slack', 'HRIS system'], health: 'healthy' as const, lastMaintenance: '2026-04-05', nextMaintenance: '2026-07-05', owner: 'Awareness Lead'},
    {id: 'zea7-TL-006', name: 'CyberArk Privileged Access Manager', category: 'PAM', version: '12.2', license: 'Enterprise', annualCost: '$195K', users: 350, coverage: 'All privileged accounts', integrations: ['Active Directory', 'Splunk', 'ServiceNow', 'Okta'], health: 'healthy' as const, lastMaintenance: '2026-04-18', nextMaintenance: '2026-07-18', owner: 'IAM Lead'}
  ];

  private _getzea7ScenarioSummary(): {total: number; critical: number; high: number; drilled: number; avgRiskScore: number} {
    const crit = this._zea7IncidentScenarios.filter(s => s.impact === 'Critical').length;
    const high = this._zea7IncidentScenarios.filter(s => s.impact === 'High').length;
    const avg = this._zea7IncidentScenarios.reduce((s, x) => s + x.riskScore, 0) / this._zea7IncidentScenarios.length;
    return {total: this._zea7IncidentScenarios.length, critical: crit, high: high, drilled: this._zea7IncidentScenarios.length, avgRiskScore: Math.round(avg)};
  }

  private _getzea7VendorRiskSummary(): {total: number; approved: number; conditional: number; remediation: number; avgScore: number} {
    const approved = this._zea7ThirdPartyRiskData.filter(v => v.status === 'approved').length;
    const cond = this._zea7ThirdPartyRiskData.filter(v => v.status === 'conditional').length;
    const rem = this._zea7ThirdPartyRiskData.filter(v => v.status === 'remediation_required').length;
    const avg = this._zea7ThirdPartyRiskData.reduce((s, v) => s + v.riskScore, 0) / this._zea7ThirdPartyRiskData.length;
    return {total: this._zea7ThirdPartyRiskData.length, approved, conditional: cond, remediation: rem, avgScore: Math.round(avg)};
  }

  private _getzea7TrainingSummary(): {total: number; avgCompletion: number; avgScore: number; overdueUpdates: number} {
    const avgComp = this._zea7SecurityTrainingCatalog.reduce((s, t) => s + t.completionRate, 0) / this._zea7SecurityTrainingCatalog.length;
    const avgScore = this._zea7SecurityTrainingCatalog.filter(t => t.avgScore > 0).reduce((s, t) => s + t.avgScore, 0) / this._zea7SecurityTrainingCatalog.filter(t => t.avgScore > 0).length;
    return {total: this._zea7SecurityTrainingCatalog.length, avgCompletion: Math.round(avgComp * 10) / 10, avgScore: Math.round(avgScore), overdueUpdates: 0};
  }

  private _getzea7ToolHealthSummary(): {total: number; healthy: number; degraded: number; annualCost: string} {
    const healthy = this._zea7SecurityToolInventory.filter(t => t.health === 'healthy').length;
    const degraded = this._zea7SecurityToolInventory.filter(t => t.health === 'degraded').length;
    const cost = this._zea7SecurityToolInventory.reduce((s, t) => s + parseInt(t.annualCost.replace(/[^0-9]/g, '')), 0);
    return {total: this._zea7SecurityToolInventory.length, healthy, degraded, annualCost: '$' + (cost / 1000).toFixed(0) + 'K'};
  }


  private _xea7SecurityZones = [
    {zoneId: 'xea7-Z-001', name: 'Internet DMZ', trustLevel: 'Untrusted', subnet: '10.0.0.0/24', segmentation: 'Dual-firewall', firewallRules: 45, monitoring: 'Full packet capture', assets: ['Web servers', 'Load balancers', 'WAF appliances', 'Reverse proxy'], riskLevel: 'high' as const, lastAssessment: '2026-04-15', nextAssessment: '2026-07-15'},
    {zoneId: 'xea7-Z-002', name: 'Corporate Network', trustLevel: 'Trusted', subnet: '10.1.0.0/16', segmentation: 'VLAN + micro-seg', firewallRules: 128, monitoring: 'NetFlow + IDS', assets: ['Workstations', 'Printers', 'Meeting room systems', 'VoIP phones'], riskLevel: 'medium' as const, lastAssessment: '2026-04-10', nextAssessment: '2026-07-10'},
    {zoneId: 'xea7-Z-003', name: 'Production Data Center', trustLevel: 'Restricted', subnet: '10.2.0.0/16', segmentation: 'Full micro-segmentation', firewallRules: 256, monitoring: 'Full packet capture + EDR', assets: ['Application servers', 'Database clusters', 'Message queues', 'API gateways'], riskLevel: 'low' as const, lastAssessment: '2026-04-12', nextAssessment: '2026-07-12'},
    {zoneId: 'xea7-Z-004', name: 'Management Network', trustLevel: 'Restricted', subnet: '10.3.0.0/24', segmentation: 'Isolated VLAN', firewallRules: 32, monitoring: 'Syslog + SNMP', assets: ['Hypervisors', 'Switch management', 'Storage controllers', 'Backup appliances'], riskLevel: 'low' as const, lastAssessment: '2026-04-08', nextAssessment: '2026-07-08'},
    {zoneId: 'xea7-Z-005', name: 'Cloud Production', trustLevel: 'Restricted', subnet: 'VPC: 172.16.0.0/12', segmentation: 'Security groups + NACLs', firewallRules: 189, monitoring: 'VPC Flow Logs + GuardDuty', assets: ['Kubernetes clusters', 'Managed databases', 'Object storage', 'Serverless functions'], riskLevel: 'medium' as const, lastAssessment: '2026-04-18', nextAssessment: '2026-07-18'}
  ];

  private _xea7SecurityAlerts = [
    {id: 'xea7-AL-001', severity: 'critical', title: 'Active ransomware encryption detected on PROD-DB-01', source: 'CrowdStrike', timestamp: '2026-04-22T13:45:00Z', status: 'investigating', assignee: 'SOC Analyst J. Smith', asset: 'PROD-DB-01 (10.2.1.15)', mitreTechnique: 'T1486 - Data Encrypted for Impact', playbook: 'IR-Ransomware-Isolate', sla: '15 minutes', elapsed: '12 minutes', notes: 'EDR detected mass file encryption event pattern. Automated isolation triggered. IR team paged.'},
    {id: 'xea7-AL-002', severity: 'high', title: 'Impossible travel detected for user admin@company.com', source: 'Okta', timestamp: '2026-04-22T12:30:00Z', status: 'triaged', assignee: 'SOC Analyst M. Johnson', asset: 'Okta - admin@company.com', mitreTechnique: 'T1078 - Valid Accounts', playbook: 'IR-ImpossibleTravel', sla: '30 minutes', elapsed: '87 minutes', notes: 'Login from Tokyo followed by login from New York within 30 minutes. Account temporarily locked. User confirmed via out-of-band channel they are in New York.'},
    {id: 'xea7-AL-003', severity: 'high', title: 'Public S3 bucket discovered with customer PII exposure', source: 'Prisma Cloud', timestamp: '2026-04-22T11:15:00Z', status: 'remediating', assignee: 'Cloud Security Lead A. Chen', asset: 'AWS S3: customer-data-archive-2024', mitreTechnique: 'N/A - Misconfiguration', playbook: 'IR-Cloud-Misconfig-Remediate', sla: '1 hour', elapsed: '2.5 hours', notes: 'Bucket containing archived customer records was publicly accessible. Bucket blocked and encrypted. Data exposure assessment in progress.'},
    {id: 'xea7-AL-004', severity: 'medium', title: 'Anomalous data download by user jane.developer@company.com', source: 'Microsoft DLP', timestamp: '2026-04-22T10:00:00Z', status: 'investigating', assignee: 'SOC Analyst R. Davis', asset: 'Endpoint: WS-DEV-042', mitreTechnique: 'T1567 - Exfil Over Web Service', playbook: 'IR-DLP-Investigation', sla: '4 hours', elapsed: '3.5 hours', notes: 'User downloaded 4.2GB of source code files to personal Google Drive. Interview scheduled with user and manager.'},
    {id: 'xea7-AL-005', severity: 'medium', title: 'Credential stuffing attack detected on customer portal', source: 'Cloudflare WAF', timestamp: '2026-04-22T09:30:00Z', status: 'contained', assignee: 'SOC Analyst K. Wilson', asset: 'Customer Portal (portal.company.com)', mitreTechnique: 'T1110 - Brute Force', playbook: 'IR-CredentialStuffing-Block', sla: '2 hours', elapsed: '4 hours', notes: 'Rate limiting and CAPTCHA automatically deployed. 12,000 failed login attempts from 800 unique IPs blocked. No successful account takeovers confirmed.'},
    {id: 'xea7-AL-006', severity: 'low', title: 'SSL certificate expiring in 14 days for api.company.com', source: 'Certificate monitoring', timestamp: '2026-04-22T08:00:00Z', status: 'remediated', assignee: 'Infrastructure Lead T. Brown', asset: 'api.company.com', mitreTechnique: 'N/A', playbook: 'Certificate Renewal', sla: '30 days', elapsed: '16 days', notes: 'Automated renewal triggered via ACME. New certificate deployed successfully. No service interruption.'}
  ];

  private _xea7ComplianceFrameworks = [
    {name: 'PCI DSS v4.0', status: 'compliant' as const, lastAudit: '2026-02-15', nextAudit: '2027-02-15', requirements: 250, compliant: 248, partiallyCompliant: 2, nonCompliant: 0, keyGaps: ['Requirement 6.4.3 - Additional verification for changes to payment pages', 'Requirement 12.3.1 - Targeted risk analysis frequency documentation'], remediationOwner: 'Compliance Officer', estimatedRemediation: 'Q3 2026'},
    {name: 'HIPAA Security Rule', status: 'compliant' as const, lastAudit: '2026-01-20', nextAudit: '2027-01-20', requirements: 78, compliant: 76, partiallyCompliant: 2, nonCompliant: 0, keyGaps: ['Administrative safeguards - workforce security training documentation', 'Technical safeguards - audit control review frequency'], remediationOwner: 'Privacy Officer', estimatedRemediation: 'Q2 2026'},
    {name: 'SOC 2 Type II', status: 'compliant' as const, lastAudit: '2026-03-01', nextAudit: '2027-03-01', requirements: 64, compliant: 63, partiallyCompliant: 1, nonCompliant: 0, keyGaps: ['CC6.1 - Logical access security for production systems documentation update'], remediationOwner: 'GRC Team', estimatedRemediation: 'Q2 2026'},
    {name: 'GDPR', status: 'mostly_compliant' as const, lastAudit: '2026-04-01', nextAudit: '2026-10-01', requirements: 99, compliant: 94, partiallyCompliant: 4, nonCompliant: 1, keyGaps: ['Article 30 - Records of processing activities update', 'Article 35 - DPIA for new AI processing', 'Article 32 - Security of processing documentation', 'Article 33 - 72-hour breach notification procedure test'], remediationOwner: 'DPO', estimatedRemediation: 'Q3 2026'}
  ];

  private _xea7DataClassificationPolicy = [
    {level: 'Public', description: 'Information approved for public disclosure with no restrictions on access or distribution', color: 'green', examples: ['Marketing materials', 'Press releases', 'Public financial reports', 'Published research papers'], handling: ['No access restrictions', 'Standard handling procedures', 'No encryption required for transmission'], retention: 'Per business need', owner: 'Communications Team'},
    {level: 'Internal', description: 'Information intended for internal use within the organization that could cause minimal harm if disclosed', color: 'blue', examples: ['Internal policies', 'Meeting notes', 'Project documentation', 'Internal newsletters'], handling: ['Access restricted to employees', 'No external sharing without approval', 'Standard encryption for external transmission'], retention: '3-7 years', owner: 'Department Heads'},
    {level: 'Confidential', description: 'Sensitive information that could cause significant harm to the organization or individuals if disclosed', color: 'yellow', examples: ['Customer PII', 'Financial data', 'Employee records', 'Business strategy documents', 'Vendor contracts'], handling: ['Need-to-know access only', 'Encryption required at rest and in transit', 'DLP monitoring enabled', 'Audit logging mandatory'], retention: 'Per regulatory requirements', owner: 'Data Owners'},
    {level: 'Restricted', description: 'Highly sensitive information that could cause severe or catastrophic harm if disclosed', color: 'red', examples: ['Authentication credentials', 'Encryption keys', 'Trade secrets', 'M&A due diligence materials', 'Security vulnerability details'], handling: ['Strict need-to-know with CISO approval', 'End-to-end encryption mandatory', 'Air-gapped storage where possible', 'Enhanced monitoring and alerting', 'Multi-factor authentication required'], retention: 'Minimum necessary', owner: 'CISO'}
  ];

  private _getxea7ZoneSummary(): {total: number; highRisk: number; mediumRisk: number; lowRisk: number; totalRules: number} {
    const high = this._xea7SecurityZones.filter(z => z.riskLevel === 'high').length;
    const med = this._xea7SecurityZones.filter(z => z.riskLevel === 'medium').length;
    const low = this._xea7SecurityZones.filter(z => z.riskLevel === 'low').length;
    const rules = this._xea7SecurityZones.reduce((s, z) => s + z.firewallRules, 0);
    return {total: this._xea7SecurityZones.length, highRisk: high, mediumRisk: med, lowRisk: low, totalRules: rules};
  }

  private _getxea7AlertSummary(): {total: number; critical: number; high: number; medium: number; low: number; open: number; contained: number} {
    const crit = this._xea7SecurityAlerts.filter(a => a.severity === 'critical').length;
    const high = this._xea7SecurityAlerts.filter(a => a.severity === 'high').length;
    const med = this._xea7SecurityAlerts.filter(a => a.severity === 'medium').length;
    const low = this._xea7SecurityAlerts.filter(a => a.severity === 'low').length;
    const open = this._xea7SecurityAlerts.filter(a => a.status === 'investigating' || a.status === 'triaged').length;
    const contained = this._xea7SecurityAlerts.filter(a => a.status === 'contained' || a.status === 'remediated').length;
    return {total: this._xea7SecurityAlerts.length, critical: crit, high, medium: med, low, open, contained};
  }

  private _getxea7ComplianceSummary(): {total: number; fullyCompliant: number; mostlyCompliant: number; avgComplianceRate: number} {
    const full = this._xea7ComplianceFrameworks.filter(f => f.status === 'compliant').length;
    const mostly = this._xea7ComplianceFrameworks.filter(f => f.status === 'mostly_compliant').length;
    const avgRate = this._xea7ComplianceFrameworks.reduce((s, f) => s + (f.compliant / f.requirements * 100), 0) / this._xea7ComplianceFrameworks.length;
    return {total: this._xea7ComplianceFrameworks.length, fullyCompliant: full, mostlyCompliant: mostly, avgComplianceRate: Math.round(avgRate * 10) / 10};
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


  render() {
    const activeAlerts = this._alerts.filter(a => a.status !== 'resolved').length;
    const criticalActive = this._alerts.filter(a => a.status !== 'resolved' && a.severity === 'critical').length;
    const openCases = this._cases.filter(c => c.status !== 'resolved').length;
    const unreadNotifs = this._notifications.filter(n => !n.read).length;

    return html`
      <div class="panel">
        <div class="pt">SOC Analyst Workflow<span style="flex:1"></span>
          <div style="position:relative;display:inline-block">
            <button style="background:none;border:none;cursor:pointer;font-size:16px;color:#94a3b8;position:relative" @click=${() => { this._showNotifPanel = !this._showNotifPanel; }}>
              ${this._showNotifPanel ? '\uD83D\uDD14' : '\uD83D\uDD15'}
              ${unreadNotifs > 0 ? html`<span class="notification-dot" style="position:absolute;top:-2px;right:-4px"></span>` : nothing}
            </button>
            ${this._showNotifPanel ? html`
              <div style="position:absolute;top:28px;right:0;width:300px;background:#1f2937;border-radius:8px;padding:10px;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.5)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                  <span style="font-size:12px;font-weight:700">Notifications (${unreadNotifs})</span>
                  <span style="font-size:10px;color:#3b82f6;cursor:pointer" @click=${this._markAllNotifsRead}>Mark all read</span>
                </div>
                ${this._notifications.map(n => html`
                  <div style="padding:8px;background:${n.read ? 'transparent' : '#0f172a'};border-radius:6px;margin-bottom:4px;cursor:pointer;border-left:3px solid ${n.type === 'critical' ? '#ef4444' : n.type === 'warning' ? '#f59e0b' : '#3b82f6'}" @click=${() => this._markNotifRead(n.id)}>
                    <div style="font-size:11px;color:${n.read ? '#6b7280' : '#e2e8f0'};font-weight:${n.read ? '400' : '600'}">${n.message}</div>
                    <div style="font-size:9px;color:#6b7280;margin-top:2px">${n.time}</div>
                  </div>
                `)}
              </div>
            ` : nothing}
          </div>
          <button class="export-btn" @click=${this._exportJSON}>Export</button>
        </div>
        <div class="stats">
          <div class="stat"><div class="sv" style="color:#ef4444">${criticalActive}</div><div class="sl">Critical Active</div></div>
          <div class="stat"><div class="sv">${activeAlerts}</div><div class="sl">Active Alerts</div></div>
          <div class="stat"><div class="sv">${openCases}</div><div class="sl">Open Cases</div></div>
          <div class="stat"><div class="sv" style="color:#22c55e">12</div><div class="sl">Resolved Today</div></div>
          <div class="stat"><div class="sv" style="color:#3b82f6">2.3h</div><div class="sl">Avg MTTR</div></div>
          <div class="stat"><div class="sv">12m</div><div class="sl">Avg MTTD</div></div>
        </div>
        <div class="tabs">
          <span class="tab ${this._tab === 'alerts' ? 'active' : ''}" @click=${() => { this._tab = 'alerts'; this.requestUpdate(); }}>Alerts (${activeAlerts})</span>
          <span class="tab ${this._tab === 'cases' ? 'active' : ''}" @click=${() => { this._tab = 'cases'; this.requestUpdate(); }}>Cases (${openCases})</span>
          <span class="tab ${this._tab === 'workload' ? 'active' : ''}" @click=${() => { this._tab = 'workload'; this.requestUpdate(); }}>Workload</span>
          <span class="tab ${this._tab === 'analysis' ? 'active' : ''}" @click=${() => { this._tab = 'analysis'; this.requestUpdate(); }}>Analysis</span>
          <span class="tab ${this._tab === 'sla' ? 'active' : ''}" @click=${() => { this._tab = 'sla'; this.requestUpdate(); }}>SLA</span>
          <span class="tab ${this._tab === 'playbook' ? 'active' : ''}" @click=${() => { this._tab = 'playbook'; this.requestUpdate(); }}>Playbook</span>
          <span class="tab ${this._tab === 'tasks' ? 'active' : ''}" @click=${() => { this._tab = 'tasks'; this.requestUpdate(); }}>Tasks</span>
          <span class="tab ${this._tab === 'approvals' ? 'active' : ''}" @click=${() => { this._tab = 'approvals'; this.requestUpdate(); }}>Approvals (${this._approvalQueue.filter(a => a.status === 'pending').length})</span>
          <span class="tab ${this._tab === 'audit' ? 'active' : ''}" @click=${() => { this._tab = 'audit'; this.requestUpdate(); }}>Audit</span>
          <span class="tab ${this._tab === 'config' ? 'active' : ''}" @click=${() => { this._tab = 'config'; this.requestUpdate(); }}>Config</span>
          <span class="tab ${this._tab === 'handoff' ? 'active' : ''}" @click=${() => { this._tab = 'handoff'; this.requestUpdate(); }}>Handoff</span>
        </div>
        ${this._tab === 'alerts' ? this._renderAlertsTab() : ''}
        ${this._tab === 'cases' ? this._renderCasesTab() : ''}
        ${this._tab === 'workload' ? this._renderWorkloadTab() : ''}
        ${this._tab === 'playbook' ? html`
          <div style="margin-bottom:12px">
            <div style="font-size:13px;font-weight:700;margin-bottom:10px">Incident Response Playbook</div>
            ${this._playbookSteps.map(s => html`
              <div class="playbook-step">
                <div class="step-num ${s.status}">${s.step}</div>
                <div style="flex:1">
                  <div style="font-size:12px;font-weight:600">${s.name}</div>
                  <div style="font-size:10px;color:#94a3b8;margin-top:2px">${s.desc}</div>
                  <div style="margin-top:4px">${s.techniques.map(t => html`<span class="tag" style="background:#3b82f620;color:#60a5fa">${t}</span>`)}</div>
                </div>
                <span class="status-badge ${s.status === 'done' ? 'completed' : s.status === 'active' ? 'in-progress' : 'pending'}">${s.status}</span>
              </div>
            `)}
          </div>
          <div style="background:#1f2937;border-radius:8px;padding:14px;margin-bottom:12px">
            <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:8px">MITRE ATT&CK Mapping</div>
            ${this._alerts.map(a => {
              const mitre = this._mitreMap[a.ruleName];
              return mitre ? html`<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #0f172a;font-size:10px"><span style="font-family:monospace;color:#60a5fa;min-width:70px">${mitre.id}</span><span style="flex:1;color:#e2e8f0">${a.title}</span><span class="tag" style="background:#a855f720;color:#c084fc">${mitre.tactic}</span></div>` : nothing;
            })}
          </div>
        ` : ''}
        ${this._tab === 'tasks' ? html`
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;margin-bottom:10px;color:#94a3b8;text-transform:uppercase">Analyst Task Queue</div>
            ${this._taskQueue.map(t => html`
              <div class="task-row">
                <div style="width:8px;height:8px;border-radius:50%;background:${this._getSeverityColor(t.priority)}"></div>
                <input type="checkbox" class="task-check" .checked=${t.status === 'completed'} @change=${() => this._completeTask(t.id)} />
                <div style="flex:1"><div style="font-size:12px;font-weight:600;${t.status === 'completed' ? 'text-decoration:line-through;color:#6b7280' : ''}">${t.task}</div><div style="font-size:10px;color:#6b7280">Assigned: ${t.assignee}</div></div>
                <span class="status-badge ${t.status}">${t.status}</span>
              </div>
            `)}
          </div>
        ` : ''}
        ${this._tab === 'approvals' ? html`
          <div style="background:#1f2937;border-radius:8px;padding:14px">
            <div style="font-size:12px;font-weight:600;margin-bottom:10px;color:#94a3b8;text-transform:uppercase">Escalation Approvals</div>
            ${this._approvalQueue.map(a => html`
              <div class="approval-row">
                <div style="flex:1"><div style="font-size:12px;font-weight:600">${a.action}</div><div style="font-size:10px;color:#6b7280">Requested by: ${a.requester}</div></div>
                ${a.status === 'pending' ? html`
                  <button class="approval-btn approve" @click=${() => this._approveAction(a.id)}>Approve</button>
                  <button class="approval-btn reject" @click=${() => this._rejectAction(a.id)}>Reject</button>
                ` : html`<span class="status-badge ${a.status}">${a.status}</span>`}
              </div>
            `)}
          </div>
        ` : ''}
        ${this._tab === 'analysis' ? html`
          <div class="grid-2">
            <div>
              <div class="section">
                <div class="stitle">Auto-Triage Pipeline</div>
                <div style="display:flex;gap:8px;margin-bottom:12px">
                  <button class="runbook-btn" @click=${this._runTriagePipeline} ?disabled=${this._execPhase === 'running'}>${this._execPhase === 'running' ? 'Running...' : 'Run Auto-Triage'}</button>
                  ${this._execPhase === 'complete' ? html`<button class="runbook-btn" style="background:#374151" @click=${() => { this._execPhase = 'idle'; this._execResults = []; }}>Reset</button>` : nothing}
                  <span style="flex:1"></span>
                  <span style="font-size:10px;color:#94a3b8">${this._execProgress}%</span>
                </div>
                <div style="height:8px;background:#374151;border-radius:4px;overflow:hidden;margin-bottom:12px"><div style="height:100%;width:${this._execProgress}%;background:${this._execPhase === 'complete' ? '#22c55e' : '#f59e0b'};border-radius:4px;transition:width 0.3s"></div></div>
                <div class="exec-pipeline">
                  ${this._execSteps.map((s, i) => html`
                    <div class="pipeline-step">
                      <div class="step-icon ${s.status}">${s.status === 'done' ? '\u2713' : s.status === 'running' ? '\u25CF' : (i + 1)}</div>
                      <div class="step-info"><div class="step-name">${s.name}</div><div class="step-desc">${s.desc}</div></div>
                      <div class="step-time">${s.status === 'done' ? s.duration + 'ms' : ''}</div>
                    </div>
                  `)}
                </div>
                ${this._execResults.length > 0 ? html`
                  <div style="background:#0f172a;border-radius:8px;padding:12px;margin-top:12px">
                    <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:8px">Triage Results</div>
                    ${this._execResults.map(r => html`<div style="padding:6px 0;border-bottom:1px solid #1f2937"><div style="font-size:11px;font-weight:600;color:#f59e0b">${r.step}</div><div style="font-size:10px;color:#94a3b8;margin-top:2px">${r.output}</div></div>`)}
                  </div>
                ` : nothing}
              </div>
              <div class="section" style="margin-top:12px">
                <div class="stitle">Alert-to-Case Flow (Sankey)</div>
                <div class="sankey-svg">${this._sankeyFlowSVG()}</div>
              </div>
              <div class="section">
                <div class="stitle">MITRE ATT&CK Tactic Coverage</div>
                <div style="display:flex;justify-content:center;padding:8px 0">${this._mitreRadarSVG()}</div>
              </div>
            </div>
            <div>
              <div class="section">
                <div class="stitle">Alert Volume Trend (24h)</div>
                ${this._trendChartSVG()}
                <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap">
                  ${(() => {
                    const reg = this._linearRegression(this._trendData.map(d => d.alerts));
                    const trendClass = reg.trend === 'up' ? 'trend-up' : reg.trend === 'down' ? 'trend-down' : 'trend-flat';
                    const arrow = reg.trend === 'up' ? '\u2191' : reg.trend === 'down' ? '\u2193' : '\u2192';
                    return html`<span class="trend-indicator ${trendClass}">${arrow} Slope: ${reg.slope.toFixed(2)}/hr</span>`;
                  })()}
                  <span class="trend-indicator ${this._anomalyPoints.length > 0 ? 'trend-up' : 'trend-down'}">${this._anomalyPoints.length} anomalies</span>
                </div>
              </div>
              <div class="section" style="margin-top:12px">
                <div class="stitle">Auto-Generated Insights</div>
                ${this._generateInsights().map(ins => html`
                  <div class="insight-card" style="border-left-color:${ins.severity === 'critical' ? '#ef4444' : ins.severity === 'warning' ? '#f59e0b' : '#3b82f6'}">
                    <div class="insight-title" style="color:${ins.severity === 'critical' ? '#ef4444' : ins.severity === 'warning' ? '#f59e0b' : '#3b82f6'}">${ins.severity.toUpperCase()}: ${ins.title}</div>
                    <div class="insight-body">${ins.body}</div>
                  </div>
                `)}
              </div>
              <div class="section" style="margin-top:12px">
                <div class="stitle">Threat Intelligence Feed</div>
                ${this._threatIntelFeed.map(ti => html`
                  <div class="intel-row">
                    <span class="intel-type" style="background:${ti.type === 'ip' ? '#ef444420' : ti.type === 'domain' ? '#3b82f620' : ti.type === 'hash' ? '#a855f720' : '#f9731620'};color:${ti.type === 'ip' ? '#ef4444' : ti.type === 'domain' ? '#3b82f6' : ti.type === 'hash' ? '#a855f7' : '#f97316'}">${ti.type}</span>
                    <span class="intel-ip">${ti.value}</span>
                    <span class="intel-detail">${ti.description}</span>
                    <span class="intel-confidence" style="color:${ti.confidence >= 85 ? '#22c55e' : ti.confidence >= 70 ? '#f59e0b' : '#ef4444'}">${ti.confidence}%</span>
                  </div>
                `)}
              </div>
            </div>
          </div>
          <div class="section" style="margin-top:12px">
            <div class="stitle">SOC Infrastructure Topology</div>
            <div class="topology-svg"><svg viewBox="0 0 360 160" width="100%" height="160">${this._socTopologySVG()}</svg></div>
          </div>
          <div class="grid-2" style="margin-top:12px">
            <div class="section">
              <div class="stitle">MITRE ATT&CK Coverage Heatmap</div>
              ${this._mitreHeatmapSVG()}
            </div>
            <div class="section">
              <div class="stitle">Case Timeline</div>
              ${this._caseTimelineSVG()}
            </div>
          </div>
        ` : ''}

        ${this._tab === 'sla' ? html`
          <div class="section">
            <div class="stitle">Case SLA Timers</div>
            ${this._slaItems.map(item => {
              const pct = Math.min(100, (item.elapsed / item.total) * 100);
              const remaining = Math.max(0, item.total - item.elapsed);
              const hrs = Math.floor(remaining / 3600000);
              const mins = Math.floor((remaining % 3600000) / 60000);
              const color = pct > 100 ? '#ef4444' : pct > 80 ? '#f59e0b' : '#22c55e';
              const caseInfo = this._cases.find(c => c.id === item.case);
              return html`
                <div class="sla-timer">
                  <div style="width:8px;height:8px;border-radius:50%;background:${this._getSeverityColor(item.priority)}"></div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:11px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${caseInfo?.title || item.case}</div>
                    <div style="font-size:9px;color:#6b7280">${item.assignee}</div>
                  </div>
                  <div style="width:100px;flex-shrink:0"><div class="sla-bar"><div class="sla-fill" style="width:${Math.min(pct, 100)}%;background:${color}"></div></div></div>
                  <div class="sla-label" style="color:${color}">${pct > 100 ? 'OVERDUE' : hrs + 'h' + mins + 'm'}</div>
                </div>`;
            })}
            <div style="margin-top:12px">
              <div style="font-size:10px;font-weight:600;color:#94a3b8;margin-bottom:6px">SLA Overview</div>
              ${this._slaOverviewSVG()}
            </div>
          </div>
        ` : ''}

        ${this._tab === 'audit' ? html`
          <div class="section">
            <div class="stitle">Audit Log (${this._auditLog.length})</div>
            ${this._auditLog.map(entry => html`
              <div class="audit-entry">
                <div class="audit-time">${new Date(entry.timestamp).toLocaleString()}</div>
                <div class="audit-action">${entry.action}</div>
                <div class="audit-detail">${entry.user}: ${entry.detail}</div>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tab === 'config' ? html`
          <div class="section">
            <div class="stitle">SOC Configuration</div>
            ${Object.entries(this._configSettings).map(([key, val]) => {
              const labels: Record<string, { label: string; desc: string }> = {
                autoEscalate: { label: 'Auto-Escalate', desc: 'Automatically escalate critical alerts to L3' },
                autoAssign: { label: 'Auto-Assign', desc: 'Distribute alerts based on analyst workload' },
                slaAlerts: { label: 'SLA Alerts', desc: 'Notify when case SLA is at 80% utilization' },
                mitreMapping: { label: 'MITRE Mapping', desc: 'Auto-map alerts to MITRE ATT&CK techniques' },
                playbookAuto: { label: 'Auto-Playbook', desc: 'Automatically execute matching playbooks' },
                shiftHandoff: { label: 'Shift Handoff', desc: 'Generate shift handoff reports automatically' },
              };
              const info = labels[key] || { label: key, desc: '' };
              return html`
                <div class="config-row">
                  <div><div class="config-label">${info.label}</div><div class="config-desc">${info.desc}</div></div>
                  <button class="config-toggle ${val ? 'on' : ''}" @click=${() => { this._configSettings = { ...this._configSettings, [key]: !val }; this._addAudit('CONFIG_CHANGE', 'You', `Toggled ${info.label}`); }}></button>
                </div>`;
            })}
          </div>
          <div class="config-section">
            <div class="form-group"><label class="form-label">SIEM Integration URL</label><input class="form-input" type="text" value="https://siem.internal/api/v2" readonly></div>
            <div class="form-group"><label class="form-label">SOAR Platform</label><input class="form-input" type="text" value="Splunk SOAR" readonly></div>
            <div class="form-group"><label class="form-label">Default Triage SLA (min)</label><input class="form-input" type="number" value="15"></div>
            <div style="display:flex;gap:8px"><button class="runbook-btn" @click=${() => this._addAudit('CONFIG_SAVE', 'You', 'Saved SOC configuration')}>Save</button><button class="runbook-btn" style="background:#374151">Test Integration</button></div>
          </div>
        ` : ''}

        ${this._tab === 'handoff' ? this._renderHandoffTab() : ''}
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
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Soc Analyst Workflow Findings Grid</span>
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
  @state() private _socScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _socScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _socScenarioCompare: boolean = false;
  @state() private _socScenarioSelected: string[] = [];

  private _socInitScenarios(): void {
    const saved = localStorage.getItem('soc_scenarios');
    if (saved) { try { this._socScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._socScenarios.length === 0) {
      this._socScenarios = [
        {id:'soc-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'soc-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'soc-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _socSaveScenarios(): void {
    localStorage.setItem('soc_scenarios', JSON.stringify(this._socScenarios));
  }

  private _socAddScenario(): void {
    const f = this._socScenarioForm;
    if (!f.attackType || !f.target) return;
    this._socScenarios = [...this._socScenarios, {
      id: 'soc-s' + (this._socScenarios.length + 1),
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
    this._socScenarioForm = {attackType:'',target:'',method:''};
    this._socSaveScenarios();
  }

  private _socRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._socScenarioCompare = !this._socScenarioCompare; }}>${this._socScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._socScenarioForm = {...this._socScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._socScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._socScenarioForm = {...this._socScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._socScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._socScenarioForm = {...this._socScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._socScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._socAddScenario}>Run Simulation</button>
      </div>
      ${this._socScenarioCompare && this._socScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._socScenarios.length)},1fr);gap:8px">
            ${this._socScenarios.slice(0,3).map(s => html`
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
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._socScenarios.length})</div>
        ${this._socScenarios.map(s => html`
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
  @state() private _socTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _socTrendZoom: {start:number;end:number} | null = null;
  @state() private _socTrendMA: number = 7;

  private _socInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._socTrendData = data;
  }

  private _socCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._socTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._socTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _socGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._socTrendData.map(d => d.value);
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

  private _socRenderTimeSeries(): any {
    const stats = this._socGetStats();
    const filtered = this._socTrendZoom ? this._socTrendData.filter(d => d.day >= this._socTrendZoom.start && d.day <= this._socTrendZoom.end) : this._socTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._socTrendMA === 7 ? 'active' : ''}" @click=${() => { this._socTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._socTrendMA === 30 ? 'active' : ''}" @click=${() => { this._socTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._socTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._socTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
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
  @state() private _socRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _socActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _socPermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _socPermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _socPermCompare: string[] = [];

  private _socInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._socRoles) {
      perms[role] = {};
      this._socActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._socPermissions = perms;
  }

  private _socTogglePermission(role: string, action: string): void {
    const old = this._socPermissions[role][action];
    this._socPermissions = {...this._socPermissions, [role]: {...this._socPermissions[role], [action]: !old}};
    this._socPermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _socRenderRBAC(): any {
    const compareRoles = this._socPermCompare.map(r => this._socPermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._socRoles.map(r => html`
              <button class="tab ${this._socPermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._socPermCompare = this._socPermCompare.includes(r) ? this._socPermCompare.filter(x => x !== r) : [...this._socPermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._socActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._socRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._socActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._socPermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._socTogglePermission(role, action)}>${this._socPermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._socPermCompare.join(' vs ')}</div>
            ${this._socActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._socPermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._socPermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._socPermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _socReportTemplate: string = 'executive';
  @state() private _socReportSchedule: string = 'weekly';
  @state() private _socReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _socReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _socGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._socReportHistory.unshift({id,template:this._socReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _socRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._socReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._socReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._socReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._socReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._socReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._socReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._socGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._socReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._socReportHistory.slice(0,3).map(r => html`
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
  @state() private _socHighContrast: boolean = false;
  @state() private _socA11yAnnounce: string = '';
  @state() private _socShortcutsVisible: boolean = false;
  @state() private _socFocusTrap: boolean = false;

  private _socShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _socHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._socFocusTrap) { this._socFocusTrap = false; this._socAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._socHighContrast = !this._socHighContrast; this._socAnnounce('High contrast ' + (this._socHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._socShortcutsVisible = !this._socShortcutsVisible; }
  }

  private _socAnnounce(msg: string): void {
    this._socA11yAnnounce = msg;
    setTimeout(() => { this._socA11yAnnounce = ''; }, 2000);
  }

  private _socRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._socShortcutsVisible ? 'active' : ''}" @click=${() => { this._socShortcutsVisible = !this._socShortcutsVisible; }} aria-expanded=${this._socShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._socHighContrast} @change=${() => { this._socHighContrast = !this._socHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._socShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._socShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._socA11yAnnounce}</div>
      </div>
    `;
  }


  
  // === MACHINE LEARNING FEATURES ===
  @state() private _socMlActiveView: string = 'importance';
  @state() private _socMlModelVersion: string = 'v3.2.1';
  @state() private _socMlFeatureImportance: {name:string;importance:number;color:string}[] = [];
  @state() private _socMlMetrics: {accuracy:number;precision:number;recall:number;f1:number;auc:number} = {accuracy:0.945,precision:0.931,recall:0.952,f1:0.941,auc:0.973};
  @state() private _socMlConfusionMatrix: number[][] = [];
  @state() private _socMlTrainingHistory: {epoch:number;loss:number;valLoss:number;accuracy:number;valAccuracy:number}[] = [];
  @state() private _socMlConfidenceBins: {range:string;count:number;color:string}[] = [];
  @state() private _socMlVersionHistory: {version:string;date:string;accuracy:number;f1:number;notes:string}[] = [];
  @state() private _socMlSelectedVersion: string = 'v3.2.1';

  private _socInitMlData(): void {
    this._socMlFeatureImportance = [
      {name:'Request Rate',importance:0.234,color:'#f97316'},
      {name:'Payload Size',importance:0.198,color:'#3b82f6'},
      {name:'Time of Day',importance:0.167,color:'#8b5cf6'},
      {name:'Source IP Reputation',importance:0.145,color:'#10b981'},
      {name:'User Behavior Score',importance:0.112,color:'#ef4444'},
      {name:'Endpoint Type',importance:0.089,color:'#06b6d4'},
      {name:'Protocol Anomaly',importance:0.055,color:'#f59e0b'},
    ];
    this._socMlConfusionMatrix = [
      [142, 3, 1],
      [2, 98, 4],
      [0, 5, 45],
    ];
    this._socMlTrainingHistory = Array.from({length:20}, (_,i) => ({
      epoch: i+1,
      loss: Math.max(0.02, 0.8 * Math.exp(-0.15*i) + 0.02 + Math.random()*0.01),
      valLoss: Math.max(0.03, 0.85 * Math.exp(-0.14*i) + 0.03 + Math.random()*0.015),
      accuracy: Math.min(0.99, 0.6 + 0.39 * (1 - Math.exp(-0.18*i)) + Math.random()*0.005),
      valAccuracy: Math.min(0.98, 0.58 + 0.38 * (1 - Math.exp(-0.16*i)) + Math.random()*0.008),
    }));
    this._socMlConfidenceBins = [
      {range:'0-10%',count:12,color:'#ef4444'},
      {range:'10-30%',count:34,color:'#f97316'},
      {range:'30-50%',count:67,color:'#f59e0b'},
      {range:'50-70%',count:128,color:'#eab308'},
      {range:'70-90%',count:245,color:'#22c55e'},
      {range:'90-100%',count:514,color:'#10b981'},
    ];
    this._socMlVersionHistory = [
      {version:'v1.0.0',date:'2025-01-15',accuracy:0.812,f1:0.789,notes:'Initial model with basic features'},
      {version:'v2.0.0',date:'2025-04-20',accuracy:0.887,f1:0.874,notes:'Added behavioral analysis features'},
      {version:'v2.5.0',date:'2025-08-10',accuracy:0.912,f1:0.901,notes:'Improved temporal pattern detection'},
      {version:'v3.0.0',date:'2025-11-30',accuracy:0.931,f1:0.922,notes:'Neural network architecture upgrade'},
      {version:'v3.2.1',date:'2026-03-15',accuracy:0.945,f1:0.941,notes:'Fine-tuned on recent threat data'},
    ];
  }

  private _socRenderMlFeatures(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Machine Learning Features">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Machine Learning Analysis</span>
          <div style="display:flex;gap:4px">
            ${['importance','metrics','matrix','training','confidence','versions'].map(v => html`
              <button class="tab ${this._socMlActiveView === v ? 'active' : ''}" @click=${() => { this._socMlActiveView = v; }}>${v.charAt(0).toUpperCase() + v.slice(1)}</button>
            `)}
          </div>
        </div>
        ${this._socMlActiveView === 'importance' ? this._socRenderFeatureImportance() : nothing}
        ${this._socMlActiveView === 'metrics' ? this._socRenderModelMetrics() : nothing}
        ${this._socMlActiveView === 'matrix' ? this._socRenderConfusionMatrix() : nothing}
        ${this._socMlActiveView === 'training' ? this._socRenderTrainingHistory() : nothing}
        ${this._socMlActiveView === 'confidence' ? this._socRenderConfidenceDist() : nothing}
        ${this._socMlActiveView === 'versions' ? this._socRenderVersionHistory() : nothing}
      </div>
    `;
  }

  private _socRenderFeatureImportance(): any {
    const maxImp = Math.max(...this._socMlFeatureImportance.map(f => f.importance));
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Feature Importance Ranking (Model ${this._socMlModelVersion})</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${this._socMlFeatureImportance.map((f, i) => html`
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

  private _socRenderModelMetrics(): any {
    const m = this._socMlMetrics;
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

  private _socRenderConfusionMatrix(): any {
    const labels = ['Benign','Suspicious','Malicious'];
    const cm = this._socMlConfusionMatrix;
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

  private _socRenderTrainingHistory(): any {
    const data = this._socMlTrainingHistory;
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

  private _socRenderConfidenceDist(): any {
    const bins = this._socMlConfidenceBins;
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

  private _socRenderVersionHistory(): any {
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Model Version Comparison</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${this._socMlVersionHistory.map(v => html`
          <div style="background:${v.version === this._socMlSelectedVersion ? '#1e293b' : '#1a1d2e'};border-radius:6px;padding:10px;border-left:3px solid ${v.version === this._socMlSelectedVersion ? '#3b82f6' : '#374151'};cursor:pointer" @click=${() => { this._socMlSelectedVersion = v.version; }}>
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
  @state() private _socCompActiveFramework: string = 'nist';
  @state() private _socNistCategories: {id:string;name:string;status:'implemented'|'partial'|'not-started';priority:number;progress:number}[] = [];
  @state() private _socCisControls: {number:number;name:string;implementation:number;maturity:string;owner:string}[] = [];
  @state() private _socIsoClauses: {clause:string;title:string;status:string;evidence:number;gap:string}[] = [];
  @state() private _socGdprArticles: {article:string;title:string;compliant:boolean;notes:string}[] = [];
  @state() private _socSoc2Criteria: {criteria:string;category:string;status:string;score:number}[] = [];
  @state() private _socCompGapFilter: string = 'all';

  private _socInitComplianceData(): void {
    this._socNistCategories = [
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
    this._socCisControls = [
      {number:1,name:'Inventory and Control of Enterprise Assets',implementation:82,maturity:'Defined',owner:'IT Ops'},
      {number:2,name:'Inventory and Control of Software Assets',implementation:75,maturity:'Managed',owner:'SecOps'},
      {number:3,name:'Data Protection',implementation:90,maturity:'Defined',owner:'DPO'},
      {number:4,name:'Secure Configuration of Enterprise Assets',implementation:68,maturity:'Managed',owner:'IT Ops'},
      {number:5,name:'Account Management',implementation:85,maturity:'Defined',owner:'IAM Team'},
      {number:6,name:'Access Control Management',implementation:88,maturity:'Defined',owner:'IAM Team'},
      {number:7,name:'Continuous Vulnerability Management',implementation:72,maturity:'Managed',owner:'SecOps'},
      {number:8,name:'Audit Log Management',implementation:80,maturity:'Defined',owner:'SecOps'},
    ];
    this._socIsoClauses = [
      {clause:'A.5.1',title:'Policies for Information Security',status:'Compliant',evidence:12,gap:'None'},
      {clause:'A.5.9',title:'Inventory of Information Assets',status:'Compliant',evidence:8,gap:'None'},
      {clause:'A.6.1',title:'Screening of Candidates',status:'Partial',evidence:5,gap:'Background check process not documented for contractors'},
      {clause:'A.7.1',title:'Before Using Information',status:'Compliant',evidence:10,gap:'None'},
      {clause:'A.8.1',title:'User Endpoint Devices',status:'Partial',evidence:4,gap:'MDM coverage at 78%, target 95%'},
      {clause:'A.8.9',title:'Configuration Management',status:'Partial',evidence:6,gap:'Automated config drift detection missing'},
      {clause:'A.8.16',title:'Monitoring Activities',status:'Compliant',evidence:9,gap:'None'},
      {clause:'A.8.23',title:'Web Filtering',status:'Not Started',evidence:0,gap:'No web filtering solution deployed'},
    ];
    this._socGdprArticles = [
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
    this._socSoc2Criteria = [
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

  private _socRenderComplianceDeepDive(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Compliance Framework Deep Dive">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Compliance Framework</span>
          <div style="display:flex;gap:4px">
            ${['nist','cis','iso','gdpr','soc2'].map(fw => html`
              <button class="tab ${this._socCompActiveFramework === fw ? 'active' : ''}" @click=${() => { this._socCompActiveFramework = fw; }}>${fw.toUpperCase()}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:10px">
          ${['all','implemented','partial','not-started'].map(f => html`
            <button class="tab ${this._socCompGapFilter === f ? 'active' : ''}" @click=${() => { this._socCompGapFilter = f; }} style="font-size:10px">${f === 'all' ? 'All' : f === 'not-started' ? 'Not Started' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
          `)}
        </div>
        ${this._socCompActiveFramework === 'nist' ? this._socRenderNistCsf() : nothing}
        ${this._socCompActiveFramework === 'cis' ? this._socRenderCisControls() : nothing}
        ${this._socCompActiveFramework === 'iso' ? this._socRenderIso27001() : nothing}
        ${this._socCompActiveFramework === 'gdpr' ? this._socRenderGdprChecklist() : nothing}
        ${this._socCompActiveFramework === 'soc2' ? this._socRenderSoc2Criteria() : nothing}
      </div>
    `;
  }

  private _socRenderNistCsf(): any {
    const filtered = this._socCompGapFilter === 'all' ? this._socNistCategories : this._socNistCategories.filter(c => c.status === this._socCompGapFilter);
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

  private _socRenderCisControls(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">CIS Controls v8 Implementation Tracking</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._socCisControls.map(c => html`
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

  private _socRenderIso27001(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">ISO 27001 Clause Coverage Matrix</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._socIsoClauses.map(c => html`
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

  private _socRenderGdprChecklist(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">GDPR Article Compliance Checklist</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._socGdprArticles.map(a => html`
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

  private _socRenderSoc2Criteria(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">SOC 2 Trust Service Criteria Mapping</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._socSoc2Criteria.map(c => html`
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
  @state() private _socNetNodes: {id:string;label:string;type:string;segment:string;x:number;y:number;status:string}[] = [];
  @state() private _socNetEdges: {from:string;to:string;weight:number;traffic:number;type:string}[] = [];
  @state() private _socNetSelectedNode: string = '';
  @state() private _socNetPathStart: string = '';
  @state() private _socNetPathEnd: string = '';
  @state() private _socNetPathResult: string[] = [];
  @state() private _socNetSegmentFilter: string = 'all';
  @state() private _socNetTrafficOverlay: boolean = false;
  @state() private _socNetZoom: number = 1;

  private _socInitNetworkData(): void {
    this._socNetNodes = [
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
    this._socNetEdges = [
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

  private _socFindPath(start: string, end: string): string[] {
    const adj = new Map<string, string[]>();
    for (const e of this._socNetEdges) {
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

  private _socRenderNetworkMap(): any {
    const filteredNodes = this._socNetSegmentFilter === 'all' ? this._socNetNodes : this._socNetNodes.filter(n => n.segment === this._socNetSegmentFilter);
    const nodeMap = new Map(this._socNetNodes.map(n => [n.id, n]));
    const filteredEdges = this._socNetEdges.filter(e => filteredNodes.some(n => n.id === e.from) && filteredNodes.some(n => n.id === e.to));
    const typeColor: Record<string,string> = {firewall:'#ef4444',network:'#3b82f6',server:'#10b981',gateway:'#8b5cf6',database:'#f97316',cache:'#eab308',auth:'#06b6d4',monitoring:'#ec4899'};
    const pathSet = new Set(this._socNetPathResult);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Interactive Network Map">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Network Topology</span>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            ${['all','dmz','frontend','backend','data','services'].map(s => html`
              <button class="tab ${this._socNetSegmentFilter === s ? 'active' : ''}" @click=${() => { this._socNetSegmentFilter = s; }} style="font-size:10px">${s.charAt(0).toUpperCase() + s.slice(1)}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap">
          <select style="background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:4px;padding:4px 8px;font-size:11px" @change=${(e: any) => { this._socNetPathStart = e.target.value; }}>
            <option value="">Path Start...</option>
            ${this._socNetNodes.map(n => html`<option value=${n.id}>${n.label}</option>`)}
          </select>
          <span style="color:#6b7280;font-size:12px">→</span>
          <select style="background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:4px;padding:4px 8px;font-size:11px" @change=${(e: any) => { this._socNetPathEnd = e.target.value; }}>
            <option value="">Path End...</option>
            ${this._socNetNodes.map(n => html`<option value=${n.id}>${n.label}</option>`)}
          </select>
          <button class="tab active" @click=${() => { if (this._socNetPathStart && this._socNetPathEnd) this._socNetPathResult = this._socFindPath(this._socNetPathStart, this._socNetPathEnd); }} style="font-size:10px">Trace Path</button>
          <label style="display:flex;align-items:center;gap:4px;font-size:10px;color:#9ca3af;cursor:pointer">
            <input type="checkbox" .checked=${this._socNetTrafficOverlay} @change=${() => { this._socNetTrafficOverlay = !this._socNetTrafficOverlay; }}> Traffic Overlay
          </label>
        </div>
        <svg viewBox="0 0 650 540" style="width:100%;max-height:400px;background:#0a0c14;border-radius:6px;border:1px solid #1e293b">
          ${filteredEdges.map(e => {
            const from = nodeMap.get(e.from);
            const to = nodeMap.get(e.to);
            if (!from || !to) return nothing;
            const isPath = pathSet.has(e.from) && pathSet.has(e.to) && Math.abs(pathSet.indexOf(e.from) - pathSet.indexOf(e.to)) === 1;
            const strokeWidth = Math.max(1, e.weight / 10);
            const opacity = this._socNetTrafficOverlay ? Math.min(1, e.traffic / 500) : 0.6;
            return html`<line x1=${from.x} y1=${from.y} x2=${to.x} y2=${to.y} stroke=${isPath ? '#fbbf24' : '#374151'} stroke-width=${isPath ? strokeWidth + 2 : strokeWidth} opacity=${opacity} ${isPath ? 'stroke-dasharray="6"' : ''}/>`;
          })}
          ${filteredNodes.map(n => html`
            <g @click=${() => { this._socNetSelectedNode = n.id; }}>
              <circle cx=${n.x} cy=${n.y} r="16" fill=${typeColor[n.type] || '#6b7280'} opacity=${n.status === 'inactive' ? 0.3 : n.status === 'warning' ? 0.7 : 1} stroke=${this._socNetSelectedNode === n.id ? '#fbbf24' : 'none'} stroke-width="2"/>
              <text x=${n.x} y=${n.y + 1} text-anchor="middle" fill="white" font-size="7" font-weight="600">${n.type.charAt(0).toUpperCase()}</text>
              <text x=${n.x} y=${n.y + 28} text-anchor="middle" fill="#9ca3af" font-size="8">${n.label}</text>
              ${this._socNetTrafficOverlay ? html`<text x=${n.x} y=${n.y - 20} text-anchor="middle" fill="#60a5fa" font-size="7">${this._socNetEdges.filter(e => e.from === n.id || e.to === n.id).reduce((s,e) => s + e.traffic, 0)} Mbps</text>` : nothing}
            </g>
          `)}
        </svg>
        ${this._socNetPathResult.length > 0 ? html`
          <div style="margin-top:8px;background:#1a1d2e;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:4px">Traced Path (${this._socNetPathResult.length} hops):</div>
            <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
              ${this._socNetPathResult.map((id, i) => {
                const node = nodeMap.get(id);
                return html`
                  <span style="background:#fbbf2422;color:#fbbf24;font-size:10px;padding:2px 8px;border-radius:3px;font-weight:600">${node?.label || id}</span>
                  ${i < this._socNetPathResult.length - 1 ? html`<span style="color:#6b7280">→</span>` : nothing}
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
  @state() private _socSearchQuery: string = '';
  @state() private _socSearchResults: {id:string;title:string;relevance:number;type:string;date:string;preview:string}[] = [];
  @state() private _socSavedSearches: {id:string;query:string;createdAt:string;runCount:number}[] = [];
  @state() private _socRecentSearches: string[] = [];
  @state() private _socSearchFilters: {field:string;operator:string;value:string;logic:'and'|'or'|'not'}[] = [];
  @state() private _socSearchActiveFilterIdx: number = -1;
  @state() private _socSearchPreset: string = 'none';
  @state() private _socSearchIsRunning: boolean = false;

  private _socInitSearchData(): void {
    this._socSavedSearches = [
      {id:'s1',query:'severity:critical status:open',createdAt:'2026-04-20',runCount:12},
      {id:'s2',query:'type:intrusion network:internal',createdAt:'2026-04-18',runCount:8},
      {id:'s3',query:'policy:DLP destination:cloud',createdAt:'2026-04-15',runCount:5},
    ];
    this._socRecentSearches = ['critical vulnerabilities','failed login attempts','data exfiltration','phishing reports'];
  }

  private _socExecuteSearch(): void {
    if (!this._socSearchQuery.trim()) return;
    this._socSearchIsRunning = true;
    this._socRecentSearches = [this._socSearchQuery, ...this._socRecentSearches.filter(s => s !== this._socSearchQuery)].slice(0, 10);
    setTimeout(() => {
      const q = this._socSearchQuery.toLowerCase();
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
      this._socSearchResults = mockData.filter(r => r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || r.preview.toLowerCase().includes(q) || q.length < 3);
      this._socSearchIsRunning = false;
    }, 300);
  }

  private _socAddSearchFilter(): void {
    this._socSearchFilters.push({field:'',operator:'contains',value:'',logic:'and'});
    this._socSearchActiveFilterIdx = this._socSearchFilters.length - 1;
  }

  private _socRemoveSearchFilter(idx: number): void {
    this._socSearchFilters = this._socSearchFilters.filter((_, i) => i !== idx);
    if (this._socSearchActiveFilterIdx >= this._socSearchFilters.length) this._socSearchActiveFilterIdx = -1;
  }

  private _socApplySearchPreset(preset: string): void {
    this._socSearchPreset = preset;
    if (preset === 'critical') this._socSearchQuery = 'severity:critical status:open';
    else if (preset === 'recent') this._socSearchQuery = 'date:>2026-04-20 type:*';
    else if (preset === 'failed') this._socSearchQuery = 'status:failed action:blocked';
    this._socExecuteSearch();
  }

  private _socRenderAdvancedSearch(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Advanced Search and Filter">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Advanced Search</span>
          <div style="display:flex;gap:4px">
            ${['none','critical','recent','failed'].map(p => html`
              <button class="tab ${this._socSearchPreset === p ? 'active' : ''}" @click=${() => this._socApplySearchPreset(p)} style="font-size:10px">${p === 'none' ? 'Presets' : p.charAt(0).toUpperCase() + p.slice(1)}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <div style="flex:1;position:relative">
            <input type="text" placeholder="Search across all data types..." value=${this._socSearchQuery} @input=${(e: any) => { this._socSearchQuery = e.target.value; }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._socExecuteSearch(); }} style="width:100%;background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:6px;padding:8px 12px;font-size:12px;outline:none" aria-label="Search input"/>
          </div>
          <button class="tab active" @click=${() => this._socExecuteSearch()} style="padding:8px 16px" ?disabled=${this._socSearchIsRunning}>${this._socSearchIsRunning ? '...' : 'Search'}</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap">
          <span style="font-size:10px;color:#6b7280">Filters:</span>
          <button class="tab" @click=${() => this._socAddSearchFilter()} style="font-size:10px">+ Add Filter</button>
          ${this._socSearchFilters.map((f, i) => html`
            <div style="display:flex;gap:4px;align-items:center;background:#1a1d2e;border-radius:4px;padding:4px 8px">
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._socSearchFilters[i].field = e.target.value; }}>
                <option value="">Field</option>
                <option value="severity">Severity</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
                <option value="date">Date</option>
                <option value="source">Source</option>
              </select>
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._socSearchFilters[i].operator = e.target.value; }}>
                <option value="contains">Contains</option>
                <option value="equals">Equals</option>
                <option value="starts">Starts with</option>
                <option value="gt">Greater than</option>
                <option value="lt">Less than</option>
              </select>
              <input type="text" placeholder="Value" style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 6px;font-size:10px;width:80px" @input=${(e: any) => { this._socSearchFilters[i].value = e.target.value; }}/>
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._socSearchFilters[i].logic = e.target.value; }}>
                <option value="and">AND</option>
                <option value="or">OR</option>
                <option value="not">NOT</option>
              </select>
              <button @click=${() => this._socRemoveSearchFilter(i)} style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:12px;padding:0 2px">✕</button>
            </div>
          `)}
        </div>
        ${this._socSearchResults.length > 0 ? html`
          <div style="margin-bottom:8px;font-size:10px;color:#9ca3af">${this._socSearchResults.length} results found</div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto">
            ${this._socSearchResults.map(r => html`
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
        ${this._socRecentSearches.length > 0 && this._socSearchResults.length === 0 ? html`
          <div style="margin-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Recent Searches:</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              ${this._socRecentSearches.map(s => html`
                <button class="tab" @click=${() => { this._socSearchQuery = s; this._socExecuteSearch(); }} style="font-size:10px">${s}</button>
              `)}
            </div>
          </div>
        ` : nothing}
        ${this._socSavedSearches.length > 0 ? html`
          <div style="margin-top:8px;border-top:1px solid #1e293b;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Saved Searches:</div>
            <div style="display:flex;flex-direction:column;gap:3px">
              ${this._socSavedSearches.map(s => html`
                <div style="display:flex;justify-content:space-between;align-items:center;background:#1a1d2e;border-radius:4px;padding:4px 8px;cursor:pointer" @click=${() => { this._socSearchQuery = s.query; this._socExecuteSearch(); }}>
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
  @state() private _socUndoStack: {id:number;action:string;timestamp:string;snapshot:string}[] = [];
  @state() private _socRedoStack: {id:number;action:string;timestamp:string;snapshot:string}[] = [];
  @state() private _socHistoryCounter: number = 0;
  @state() private _socHistoryVisible: boolean = false;
  @state() private _socDiffViewActive: boolean = false;
  @state() private _socDiffFromId: number = -1;
  @state() private _socDiffToId: number = -1;
  @state() private _socCurrentSnapshot: string = '';

  private _socPushHistory(action: string): void {
    this._socHistoryCounter++;
    const entry = {
      id: this._socHistoryCounter,
      action,
      timestamp: new Date().toISOString(),
      snapshot: JSON.stringify({searchQuery: this._socSearchQuery, filters: this._socSearchFilters, compFramework: this._socCompActiveFramework, mlView: this._socMlActiveView}),
    };
    this._socUndoStack.push(entry);
    this._socRedoStack = [];
    this._socCurrentSnapshot = entry.snapshot;
  }

  private _socUndo(): void {
    if (this._socUndoStack.length <= 1) return;
    const current = this._socUndoStack.pop()!;
    this._socRedoStack.push(current);
    const prev = this._socUndoStack[this._socUndoStack.length - 1];
    this._socCurrentSnapshot = prev.snapshot;
    try {
      const data = JSON.parse(prev.snapshot);
      if (data.searchQuery !== undefined) this._socSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._socSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._socCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._socMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _socRedo(): void {
    if (this._socRedoStack.length === 0) return;
    const entry = this._socRedoStack.pop()!;
    this._socUndoStack.push(entry);
    this._socCurrentSnapshot = entry.snapshot;
    try {
      const data = JSON.parse(entry.snapshot);
      if (data.searchQuery !== undefined) this._socSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._socSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._socCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._socMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _socJumpToHistory(id: number): void {
    const idx = this._socUndoStack.findIndex(e => e.id === id);
    if (idx < 0) return;
    const removed = this._socUndoStack.splice(idx + 1);
    this._socRedoStack.push(...removed.reverse());
    const target = this._socUndoStack[this._socUndoStack.length - 1];
    this._socCurrentSnapshot = target.snapshot;
    try {
      const data = JSON.parse(target.snapshot);
      if (data.searchQuery !== undefined) this._socSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._socSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._socCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._socMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _socGetDiff(fromId: number, toId: number): {field:string;from:string;to:string}[] {
    const fromEntry = this._socUndoStack.find(e => e.id === fromId);
    const toEntry = this._socUndoStack.find(e => e.id === toId);
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

  private _socRenderUndoRedo(): any {
    const allHistory = [...this._socUndoStack];
    const diffs = this._socDiffViewActive && this._socDiffFromId >= 0 && this._socDiffToId >= 0 ? this._socGetDiff(this._socDiffFromId, this._socDiffToId) : [];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Undo Redo History">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Action History</span>
          <div style="display:flex;gap:4px">
            <button class="tab" @click=${() => this._socUndo()} ?disabled=${this._socUndoStack.length <= 1} style="font-size:10px">↩ Undo</button>
            <button class="tab" @click=${() => this._socRedo()} ?disabled=${this._socRedoStack.length === 0} style="font-size:10px">Redo ↪</button>
            <button class="tab ${this._socHistoryVisible ? 'active' : ''}" @click=${() => { this._socHistoryVisible = !this._socHistoryVisible; }} style="font-size:10px">Timeline</button>
            <button class="tab ${this._socDiffViewActive ? 'active' : ''}" @click=${() => { this._socDiffViewActive = !this._socDiffViewActive; }} style="font-size:10px">Diff</button>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;font-size:10px;color:#6b7280">
          <span>Undo: ${this._socUndoStack.length}</span>
          <span>|</span>
          <span>Redo: ${this._socRedoStack.length}</span>
          <span>|</span>
          <span>Total Actions: ${this._socHistoryCounter}</span>
        </div>
        ${this._socHistoryVisible ? html`
          <div style="background:#1a1d2e;border-radius:6px;padding:8px;max-height:200px;overflow-y:auto;margin-bottom:8px">
            ${allHistory.map((entry, i) => html`
              <div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #0f1117;cursor:pointer;opacity:${i === allHistory.length - 1 ? 1 : 0.6}" @click=${() => this._socJumpToHistory(entry.id)}>
                <div style="width:12px;height:12px;border-radius:50%;background:${i === allHistory.length - 1 ? '#3b82f6' : '#374151'};flex-shrink:0"></div>
                <span style="font-size:10px;color:#e2e8f0;flex:1">${entry.action}</span>
                <span style="font-size:9px;color:#6b7280">${new Date(entry.timestamp).toLocaleTimeString()}</span>
                ${this._socDiffViewActive ? html`
                  <input type="radio" name="diff-from" style="accent-color:#3b82f6" @change=${() => { this._socDiffFromId = entry.id; }}/>
                  <input type="radio" name="diff-to" style="accent-color:#f97316" @change=${() => { this._socDiffToId = entry.id; }}/>
                ` : nothing}
              </div>
            `)}
          </div>
        ` : nothing}
        ${this._socDiffViewActive ? html`
          <div style="background:#1a1d2e;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:6px">${diffs.length > 0 ? 'Differences found:' : this._socDiffFromId >= 0 && this._socDiffToId >= 0 ? 'No differences' : 'Select two points in timeline to compare'}</div>
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
  @state() private _socActiveSubTab: string = 'scenario';

  private _socGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _socRenderSubPanel(): any {
    switch (this._socActiveSubTab) {
      case 'scenario': return this._socRenderScenarioEngine();
      case 'timeseries': return this._socRenderTimeSeries();
      case 'rbac': return this._socRenderRBAC();
      case 'reporting': return this._socRenderReporting();
      case 'a11y': return this._socRenderAccessibility();
      default: return nothing;
    }
  }

  private _socRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._socGetAllSubTabs().map(t => html`
          <button class="tab ${this._socActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._socActiveSubTab = t.key; }} role="tab" aria-selected=${this._socActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="soc-tab-${this._socActiveSubTab}">
        ${this._socRenderSubPanel()}
      </div>
    `;
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
  @state() private _sawAle: number = 0;
  @state() private _sawSroi: number = 0;
  @state() private _sawCpi: number = 0;
  @state() private _sawBudgetAlloc: number = 0;
  @state() private _sawCostBenefit: number = 0;

  // Security Economics Calculator
  private sawInitEconomics() {
    this._sawAle = Math.round(2850000 + Math.random() * 4500000);
    this._sawSroi = Math.round(180 + Math.random() * 320);
    this._sawCpi = Math.round(45000 + Math.random() * 120000);
    this._sawBudgetAlloc = Math.round(2500000 + Math.random() * 3000000);
    this._sawCostBenefit = Math.round(220 + Math.random() * 180);
  }

  private _sawCalcAle(): { annual: number; perIncident: number; byCategory: Array<{name: string; value: number}> } {
    const base = this._sawAle;
    const categories = [
      { name: "Data Breach", value: Math.round(base * 0.35) },
      { name: "Ransomware", value: Math.round(base * 0.25) },
      { name: "Insider Threat", value: Math.round(base * 0.18) },
      { name: "Business Disruption", value: Math.round(base * 0.12) },
      { name: "Regulatory Fines", value: Math.round(base * 0.10) }
    ];
    return { annual: base, perIncident: Math.round(base / (3 + Math.floor(Math.random() * 8))), byCategory: categories };
  }

  private _sawCalcSroi(): Array<{year: number; investment: number; savings: number; roi: number}> {
    const baseInv = this._sawSroi * 10000;
    const projections: Array<{year: number; investment: number; savings: number; roi: number}> = [];
    for (let i = 1; i <= 5; i++) {
      const inv = Math.round(baseInv * (1 + 0.08 * i));
      const savings = Math.round(inv * (0.6 + i * 0.25));
      projections.push({ year: 2026 + i, investment: inv, savings, roi: Math.round((savings - inv) / inv * 100) });
    }
    return projections;
  }

  private _sawGetBudgetAlloc(): Array<{category: string; amount: number; pct: number; trend: string}> {
    const total = this._sawBudgetAlloc;
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

  private _sawGetCostBenefit(): Array<{control: string; cost: number; benefit: number; ratio: number; priority: string}> {
    const base = this._sawCostBenefit;
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

  private _sawRenderEconomics() {
    const ale = this._sawCalcAle();
    const roi = this._sawCalcSroi();
    const budget = this._sawGetBudgetAlloc();
    const cb = this._sawGetCostBenefit();
    const cpi = this._sawCpi;
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

  @state() private _sawThreatLevel: any = null;
  @state() private _sawEmergingThreats: any = null;
  @state() private _sawThreatTrends: any = null;
  @state() private _sawSectorRadar: any = null;
  @state() private _sawActorActivity: any = null;

  // Threat Landscape Intelligence
  private sawInitThreatIntel() {
    this._sawThreatLevel = {
      americas: Math.round(50 + Math.random() * 40),
      europe: Math.round(40 + Math.random() * 45),
      asiaPacific: Math.round(55 + Math.random() * 35),
      middleEast: Math.round(45 + Math.random() * 50),
      africa: Math.round(30 + Math.random() * 40)
    };
    this._sawEmergingThreats = [
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
    this._sawThreatTrends = [
      { month: "Jan", phishing: 142, malware: 89, ransomware: 34 },
      { month: "Feb", phishing: 158, malware: 95, ransomware: 38 },
      { month: "Mar", phishing: 175, malware: 102, ransomware: 42 },
      { month: "Apr", phishing: 163, malware: 98, ransomware: 39 }
    ];
    this._sawSectorRadar = [
      { sector: "Financial", risk: 82, trend: "up" },
      { sector: "Healthcare", risk: 78, trend: "up" },
      { sector: "Technology", risk: 71, trend: "stable" },
      { sector: "Government", risk: 85, trend: "up" },
      { sector: "Energy", risk: 68, trend: "down" }
    ];
    this._sawActorActivity = [
      { actor: "APT-29", country: "Russia", activity: 85, targets: "Government" },
      { actor: "Lazarus", country: "DPRK", activity: 72, targets: "Financial" },
      { actor: "APT-41", country: "China", activity: 68, targets: "Technology" },
      { actor: "Fancy Bear", country: "Russia", activity: 64, targets: "Healthcare" },
      { actor: "Charming Kitten", country: "Iran", activity: 58, targets: "Energy" }
    ];
  }

  private _sawRenderThreatIntel() {
    const tl = this._sawThreatLevel;
    const et = this._sawEmergingThreats;
    const sr = this._sawSectorRadar;
    const aa = this._sawActorActivity;
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

  @state() private _sawPolicies: any = null;
  @state() private _sawExceptions: any = null;
  @state() private _sawRiskRegister: any = null;
  @state() private _sawMeetings: any = null;
  @state() private _sawDeadlines: any = null;

  // Security Governance Dashboard
  private sawInitGovernance() {
    this._sawPolicies = [
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
    this._sawExceptions = [
      { id: "EXC-001", policy: "Access Control", reason: "Legacy system", risk: "Medium", expiry: "2026-06-30" },
      { id: "EXC-002", policy: "Encryption", reason: "Performance", risk: "High", expiry: "2026-05-15" },
      { id: "EXC-003", policy: "Password Policy", reason: "Vendor req", risk: "Low", expiry: "2026-08-01" }
    ];
    this._sawRiskRegister = [
      { id: "RSK-001", desc: "Unpatched Exchange", likelihood: 4, impact: 5, owner: "IT Ops" },
      { id: "RSK-002", desc: "Shadow IT SaaS", likelihood: 3, impact: 4, owner: "CISO" },
      { id: "RSK-003", desc: "Privileged Access Creep", likelihood: 3, impact: 5, owner: "IAM Team" },
      { id: "RSK-004", desc: "DR Plan Gaps", likelihood: 2, impact: 5, owner: "BCP Lead" },
      { id: "RSK-005", desc: "Vendor Data Sharing", likelihood: 3, impact: 3, owner: "Legal" }
    ];
    this._sawMeetings = [
      { name: "Security Steering", date: "2026-04-25", attendees: 8, status: "Scheduled" },
      { name: "Risk Committee", date: "2026-04-18", attendees: 6, status: "Completed" },
      { name: "Audit Review", date: "2026-05-02", attendees: 5, status: "Pending" }
    ];
    this._sawDeadlines = [
      { regulation: "SOC 2 Type II", deadline: "2026-06-15", daysLeft: 53, status: "On Track" },
      { regulation: "GDPR Annual Review", deadline: "2026-05-25", daysLeft: 32, status: "At Risk" },
      { regulation: "ISO 27001 Audit", deadline: "2026-07-20", daysLeft: 88, status: "On Track" },
      { regulation: "PCI DSS v4.0", deadline: "2026-08-30", daysLeft: 129, status: "Planning" }
    ];
  }

  private _sawRenderGovernance() {
    const policies = this._sawPolicies;
    const risks = this._sawRiskRegister;
    const deadlines = this._sawDeadlines;
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

  @state() private _sawCriticalAssets: any = null;
  @state() private _sawAssetDeps: any = null;
  @state() private _sawEolAssets: any = null;
  @state() private _sawAssetRisk: any = null;

  // Asset Intelligence
  private sawInitAssetIntel() {
    this._sawCriticalAssets = [
      { name: "Core Banking DB", type: "Database", impact: "Critical", risk: 85, owner: "DBA Team" },
      { name: "Customer API Gateway", type: "Service", impact: "Critical", risk: 72, owner: "Platform" },
      { name: "Active Directory", type: "Infrastructure", impact: "Critical", risk: 68, owner: "IAM" },
      { name: "Data Warehouse", type: "Database", impact: "High", risk: 55, owner: "Analytics" },
      { name: "Email Server", type: "Application", impact: "High", risk: 48, owner: "IT Ops" },
      { name: "CI/CD Pipeline", type: "DevOps", impact: "High", risk: 62, owner: "DevOps" },
      { name: "Payment Processor", type: "Service", impact: "Critical", risk: 78, owner: "Finance IT" }
    ];
    this._sawAssetDeps = [
      { from: "Web App", to: "API Gateway", type: "depends" },
      { from: "API Gateway", to: "Core Banking DB", type: "depends" },
      { from: "API Gateway", to: "Auth Service", type: "depends" },
      { from: "Auth Service", to: "Active Directory", type: "depends" },
      { from: "Payment Processor", to: "Core Banking DB", type: "depends" },
      { from: "Mobile App", to: "API Gateway", type: "depends" }
    ];
    this._sawEolAssets = [
      { name: "Windows Server 2012 R2", count: 12, eolDate: "2023-10-10", risk: "Critical" },
      { name: "Oracle 11g", count: 3, eolDate: "2025-12-31", risk: "High" },
      { name: "Cisco ASA 5505", count: 8, eolDate: "2024-07-15", risk: "High" },
      { name: "CentOS 7", count: 25, eolDate: "2024-06-30", risk: "Medium" }
    ];
    this._sawAssetRisk = { critical: 7, high: 23, medium: 45, low: 128, total: 203 };
  }

  private _sawRenderAssetIntel() {
    const assets = this._sawCriticalAssets;
    const eol = this._sawEolAssets;
    const ar = this._sawAssetRisk;
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

  @state() private _sawUserBaseline: any = null;
  @state() private _sawAnomalyRules: any = null;
  @state() private _sawDataAccess: any = null;
  @state() private _sawInsiderRisk: any = null;
  @state() private _socanar15Timeline: Array<{id:string;time:string;event:string;severity:string;actor:string}> = [
    {id:'t1',time:'2026-01-15 08:23',event:'Anomalous login detected from external IP',severity:'high',actor:'unknown'},
    {id:'t2',time:'2026-01-15 08:45',event:'Privilege escalation via misconfigured service account',severity:'critical',actor:'SA-deploy-01'},
    {id:'t3',time:'2026-01-15 09:12',event:'Data exfiltration to external cloud storage',severity:'critical',actor:'SA-deploy-01'},
    {id:'t4',time:'2026-01-15 09:30',event:'Incident response team notified',severity:'medium',actor:'SOC Team'},
    {id:'t5',time:'2026-01-15 10:15',event:'Affected service account disabled',severity:'low',actor:'IR Lead'},
  ];
  @state() private _socanar15RootCauses: Array<{why:string;answer:string}> = [
    {why:'Why was the login anomalous?',answer:'Credentials leaked via phishing email to IT admin'},
    {why:'Why was the phishing successful?',answer:'Email filter rules were too permissive for internal domains'},
    {why:'Why were rules misconfigured?',answer:'Change review process skipped for emergency rule update'},
    {why:'Why was the review skipped?',answer:'No automated enforcement of review policy for rule changes'},
    {why:'Why no automated enforcement?',answer:'Policy-as-code implementation backlog for 6 months'},
  ];
  @state() private _socanar15ImpactMatrix: Array<{system:string;users:number;data:string;revenue:string;status:string}> = [
    {system:'Customer Database',users:12400,data:'PII of all customers',revenue:'$2.4M/day',status:'contained'},
    {system:'Payment Gateway',users:8900,data:'Tokenized payment records',revenue:'$1.8M/day',status:'unaffected'},
    {system:'HR Portal',users:3200,data:'Employee PII and payroll',revenue:'N/A',status:'investigating'},
    {system:'API Gateway',users:45000,data:'Auth tokens and API keys',revenue:'$5.1M/day',status:'contained'},
  ];
  @state() private _socanar15Actions: Array<{id:string;item:string;owner:string;deadline:string;priority:string;status:string}> = [
    {id:'a1',item:'Rotate all service account credentials',owner:'DevOps Team',deadline:'2026-01-18',priority:'critical',status:'in_progress'},
    {id:'a2',item:'Implement email filter policy-as-code',owner:'Email Admin',deadline:'2026-01-22',priority:'high',status:'pending'},
    {id:'a3',item:'Deploy automated change review enforcement',owner:'Platform Team',deadline:'2026-01-25',priority:'high',status:'pending'},
    {id:'a4',item:'Conduct phishing awareness refresher',owner:'Security Awareness',deadline:'2026-01-20',priority:'medium',status:'assigned'},
    {id:'a5',item:'Review and update incident response playbook',owner:'IR Team',deadline:'2026-01-30',priority:'low',status:'pending'},
  ];
  @state() private _socanar15Lessons: Array<{id:string;lesson:string;category:string;severity:string;applies_to:string}> = [
    {id:'l1',lesson:'Service accounts must have MFA enabled regardless of automation needs',category:'Identity',severity:'high',applies_to:'All service accounts'},
    {id:'l2',lesson:'Emergency changes still require post-incident review within 24 hours',category:'Process',severity:'high',applies_to:'All infrastructure changes'},
    {id:'l3',lesson:'Email filter rules must be version controlled and peer reviewed',category:'Email Security',severity:'medium',applies_to:'Email infrastructure'},
    {id:'l4',lesson:'Data exfiltration detection latency must be under 5 minutes',category:'Monitoring',severity:'medium',applies_to:'DLP systems'},
  ];
  @state() private _socanar15ActiveTab: string = 'timeline';
  @state() private _socanar15Benchmarks: Array<{metric:string;current:number;industry:number;target:number;unit:string;source:string}> = [
    {metric:'Mean Time to Detect',current:4.2,industry:6.8,target:3.0,unit:'hours',source:'SANS 2026'},
    {metric:'Mean Time to Respond',current:2.1,industry:4.5,target:1.0,unit:'hours',source:'SANS 2026'},
    {metric:'Patch Compliance',current:87,industry:72,target:95,unit:'%',source:'CIS Benchmark'},
    {metric:'Vuln Remediation SLA',current:78,industry:65,target:90,unit:'%',source:'Gartner'},
    {metric:'Phishing Click Rate',current:3.2,industry:12.5,target:2.0,unit:'%',source:'KnowBe4'},
    {metric:'MFA Coverage',current:94,industry:68,target:100,unit:'%',source:'CIS Controls'},
  ];
  @state() private _socanar15MaturityLevels: Array<{domain:string;current:number;target:number;description:string}> = [
    {domain:'Identity and Access',current:4,target:5,description:'Strong MFA, automated provisioning, JIT access'},
    {domain:'Network Security',current:3,target:4,description:'Micro-segmentation partial, ZTNA in progress'},
    {domain:'Data Protection',current:3,target:4,description:'DLP deployed, encryption at rest in progress'},
    {domain:'Vulnerability Mgmt',current:4,target:5,description:'Automated scanning, risk-based prioritization'},
    {domain:'Incident Response',current:3,target:4,description:'Playbooks defined, automation growing'},
    {domain:'Governance and Risk',current:3,target:4,description:'Framework aligned, continuous monitoring building'},
  ];
  @state() private _socanar15QuarterlyData: Array<{quarter:string;score:number;improvement:number}> = [
    {quarter:'Q1 2025',score:62,improvement:0},{quarter:'Q2 2025',score:67,improvement:5},
    {quarter:'Q3 2025',score:71,improvement:4},{quarter:'Q4 2025',score:74,improvement:3},
    {quarter:'Q1 2026',score:78,improvement:4},
  ];
  @state() private _socanar15SelectedDomain: string = 'all';
  @state() private _socanar15Alerts: Array<{id:string;name:string;severity:number;confidence:number;assetCrit:number;score:number;enriched:boolean;group:string;status:string;enrichData:Array<{key:string;value:string}>}> = [
    {id:'al1',name:'Brute force login attempt on prod-db',severity:5,confidence:0.9,assetCrit:5,score:0,enriched:true,group:'auth',status:'triaged',enrichData:[{key:'Source IP',value:'203.0.113.42'},{key:'Country',value:'Russia'},{key:'Threat Intel',value:'Known APT IP'}]},
    {id:'al2',name:'Unusual data transfer to external endpoint',severity:4,confidence:0.7,assetCrit:4,score:0,enriched:true,group:'exfil',status:'escalated',enrichData:[{key:'Destination',value:'s3-eu-west.amazonaws.com'},{key:'Volume',value:'2.4 GB in 30 min'},{key:'Reputation',value:'Neutral'}]},
    {id:'al3',name:'Privilege escalation attempt detected',severity:5,confidence:0.85,assetCrit:5,score:0,enriched:false,group:'auth',status:'new',enrichData:[]},
    {id:'al4',name:'Suspicious PowerShell execution',severity:3,confidence:0.5,assetCrit:3,score:0,enriched:false,group:'host',status:'new',enrichData:[]},
    {id:'al5',name:'Failed SSL certificate validation',severity:2,confidence:0.95,assetCrit:2,score:0,enriched:true,group:'net',status:'dismissed',enrichData:[{key:'Host',value:'api.internal.corp'},{key:'Expiry',value:'2026-01-10'}]},
  ];
  @state() private _socanar15QualityMetrics: {fpRate:number;enrichSuccess:number;avgTriageTime:number;enrichedCount:number;totalCount:number} = {fpRate:0.12, enrichSuccess:0.78, avgTriageTime:4.5, enrichedCount:3, totalCount:5};
  @state() private _socanar15RoutingRules: Array<{name:string;condition:string;channel:string;active:boolean}> = [
    {name:'Critical Asset Alert',condition:'asset_criticality >= 5 && severity >= 4',channel:'SOC Phone Bridge',active:true},
    {name:'Data Exfiltration',condition:'group == exfil && severity >= 3',channel:'IR Slack Channel',active:true},
    {name:'Authentication Anomaly',condition:'group == auth && confidence >= 0.8',channel:'SOC Dashboard',active:true},
    {name:'Low Priority Host',condition:'severity <= 2 && asset_criticality <= 2',channel:'Email Digest',active:false},
  ];
  @state() private _socanar15Shapes: Array<{id:string;type:string;label:string;controls:string[]}> = [
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
  @state() private _socanar15TrustBoundaries: Array<{from:string;to:string;label:string;strength:string}> = [
    {from:'sh1',to:'sh4',label:'External Boundary',strength:'strong'},
    {from:'sh2',to:'sh5',label:'Data Boundary',strength:'strong'},
    {from:'sh3',to:'sh6',label:'Identity Boundary',strength:'medium'},
    {from:'sh7',to:'sh8',label:'Build Boundary',strength:'weak'},
  ];
  @state() private _socanar15ADRs: Array<{id:string;title:string;status:string;date:string;decision:string}> = [
    {id:'adr-001',title:'Adopt Zero Trust Network Architecture',status:'accepted',date:'2025-11-15',decision:'Replace VPN with ZTNA for all remote access'},
    {id:'adr-002',title:'Implement Service Mesh for East-West Traffic',status:'proposed',date:'2026-01-10',decision:'Deploy Istio with mTLS for all internal service communication'},
    {id:'adr-003',title:'Consolidate SIEM to Single Platform',status:'accepted',date:'2025-09-20',decision:'Migrate from Splunk+QRadar to unified Elastic SIEM'},
    {id:'adr-004',title:'Enforce Policy-as-Code for All Infrastructure',status:'in_review',date:'2026-02-01',decision:'Use Open Policy Agent for admission control and compliance checks'},
  ];
  @state() private _socanar15SelectedShape: string = '';
  @state() private _socanar15Gauges: Array<{name:string;value:number;max:number;unit:string;status:string;color:string}> = [
    {name:'API Response Time',value:142,max:500,unit:'ms',status:'healthy',color:'#4f4'},
    {name:'Error Rate',value:0.3,max:5,unit:'%',status:'healthy',color:'#4f4'},
    {name:'CPU Utilization',value:67,max:100,unit:'%',status:'warning',color:'#fa0'},
    {name:'Memory Usage',value:4.2,max:8,unit:'GB',status:'healthy',color:'#4f4'},
    {name:'Active Connections',value:1247,max:2000,unit:'',status:'healthy',color:'#4f4'},
    {name:'Queue Depth',value:342,max:500,unit:'',status:'warning',color:'#fa0'},
  ];
  @state() private _socanar15Anomalies: Array<{id:string;time:string;description:string;severity:string;acknowledged:boolean}> = [
    {id:'an1',time:'10:42:15',description:'Spike in failed authentication attempts from 10.0.0.0/8',severity:'high',acknowledged:false},
    {id:'an2',time:'10:38:22',description:'Unusual data transfer volume on DB replication channel',severity:'medium',acknowledged:true},
    {id:'an3',time:'10:25:07',description:'Certificate expiry warning for api.internal.corp (7 days)',severity:'low',acknowledged:false},
    {id:'an4',time:'10:12:44',description:'DNS query pattern matches DGA domain characteristics',severity:'high',acknowledged:false},
  ];
  @state() private _socanar15Integrations: Array<{name:string;status:string;uptime:number;lastCheck:string;latency:number}> = [
    {name:'SIEM Connector',status:'online',uptime:99.97,lastCheck:'10:45:00',latency:12},
    {name:'EDR Feed',status:'online',uptime:99.95,lastCheck:'10:45:00',latency:45},
    {name:'Threat Intel API',status:'degraded',uptime:98.2,lastCheck:'10:44:30',latency:230},
    {name:'Cloud Provider API',status:'online',uptime:99.99,lastCheck:'10:45:00',latency:8},
    {name:'Email Gateway',status:'online',uptime:99.98,lastCheck:'10:45:00',latency:15},
  ];
  @state() private _socanar15AlertFatigue: Array<{analyst:string;alertsPerDay:number;escalated:number;dismissed:number;avgResponseMin:number}> = [
    {analyst:'Alice Chen',alertsPerDay:45,escalated:8,dismissed:12,avgResponseMin:3.2},
    {analyst:'Bob Martinez',alertsPerDay:62,escalated:11,dismissed:18,avgResponseMin:5.1},
    {analyst:'Carol Kim',alertsPerDay:38,escalated:5,dismissed:10,avgResponseMin:2.8},
    {analyst:'Dave Wilson',alertsPerDay:71,escalated:14,dismissed:22,avgResponseMin:6.4},
  ];
  @state() private _socanar15SlaTarget: number = 99.9;

  // Insider Threat Detection
  private sawInitInsiderThreat() {
    this._sawUserBaseline = [
      { user: "admin_jdoe", avgLogins: 18, avgFiles: 45, avgNetwork: 2.3, riskScore: 12 },
      { user: "dev_ssmith", avgLogins: 22, avgFiles: 120, avgNetwork: 5.1, riskScore: 25 },
      { user: "mgr_jchen", avgLogins: 8, avgFiles: 30, avgNetwork: 1.2, riskScore: 8 },
      { user: "analyst_mlee", avgLogins: 15, avgFiles: 85, avgNetwork: 3.4, riskScore: 18 },
      { user: "contractor_abrown", avgLogins: 12, avgFiles: 200, avgNetwork: 8.7, riskScore: 42 }
    ];
    this._sawAnomalyRules = [
      { rule: "After-hours access", enabled: true, triggers: 3, severity: "Medium" },
      { rule: "Mass download detection", enabled: true, triggers: 1, severity: "Critical" },
      { rule: "Privilege escalation", enabled: true, triggers: 0, severity: "High" },
      { rule: "Unusual data transfer", enabled: true, triggers: 5, severity: "High" },
      { rule: "Account sharing pattern", enabled: false, triggers: 2, severity: "Medium" },
      { rule: "Departure data spike", enabled: true, triggers: 0, severity: "Critical" }
    ];
    this._sawDataAccess = [
      { resource: "Customer PII DB", accesses: 1245, anomalous: 18, trend: "up" },
      { resource: "Financial Reports", accesses: 832, anomalous: 5, trend: "stable" },
      { resource: "Source Code Repo", accesses: 2100, anomalous: 32, trend: "up" },
      { resource: "Trade Secrets", accesses: 156, anomalous: 8, trend: "up" }
    ];
    this._sawInsiderRisk = { totalUsers: 2847, monitored: 342, flagged: 18, investigated: 5, confirmed: 1 };
  }

  private _sawRenderInsiderThreat() {
    const baseline = this._sawUserBaseline;
    const rules = this._sawAnomalyRules;
    const ir = this._sawInsiderRisk;
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
              <button class="btn ${this._socanar15ActiveTab === t ? 'btn-primary' : ''}" style="font-size:10px;padding:3px 8px" @click=${() => { this._socanar15ActiveTab = t; }}>${t.charAt(0).toUpperCase() + t.slice(1)}</button>
            `)}
          </div>
          ${this._socanar15ActiveTab === 'timeline' ? html`
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._socanar15Timeline.map(e => html`
                <div style="display:flex;gap:8px;align-items:flex-start;padding:6px;background:#1a1d27;border-radius:4px;border-left:3px solid ${e.severity === 'critical' ? '#f44' : e.severity === 'high' ? '#fa0' : e.severity === 'medium' ? '#ff0' : '#4f4'}">
                  <span style="color:#888;font-size:10px;min-width:110px">${e.time}</span>
                  <span style="color:#ddd;font-size:11px;flex:1">${e.event}</span>
                  <span style="color:#888;font-size:10px">${e.actor}</span>
                </div>
              `)}
            </div>
          ` : this._socanar15ActiveTab === 'rootcause' ? html`
            <div style="margin-bottom:8px">${{__html: this._socanar15RenderFishbone()}}</div>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._socanar15RootCauses.map((rc, i) => html`
                <div style="display:flex;gap:8px;align-items:flex-start;padding:6px;background:#1a1d27;border-radius:4px">
                  <span style="color:#4a9eff;font-size:10px;min-width:20px">${i + 1}.</span>
                  <div style="flex:1"><div style="color:#aaa;font-size:10px">${rc.why}</div><div style="color:#ddd;font-size:11px">${rc.answer}</div></div>
                </div>
              `)}
            </div>
          ` : this._socanar15ActiveTab === 'impact' ? html`
            <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:10px">
              <thead><tr style="color:#888"><th style="text-align:left;padding:4px">System</th><th style="padding:4px">Users</th><th style="text-align:left;padding:4px">Data</th><th style="padding:4px">Revenue</th><th style="padding:4px">Status</th></tr></thead>
              <tbody>${this._socanar15ImpactMatrix.map(imp => html`
                <tr style="border-top:1px solid #2a2d37"><td style="padding:4px;color:#ddd">${imp.system}</td><td style="padding:4px;color:#aaa;text-align:center">${imp.users.toLocaleString()}</td><td style="padding:4px;color:#aaa">${imp.data}</td><td style="padding:4px;color:#fa0;text-align:center">${imp.revenue}</td><td style="padding:4px"><span style="color:${imp.status === 'contained' ? '#4f4' : imp.status === 'investigating' ? '#fa0' : '#f44'};font-size:9px;padding:2px 6px;background:${imp.status === 'contained' ? 'rgba(0,255,0,0.1)' : imp.status === 'investigating' ? 'rgba(255,170,0,0.1)' : 'rgba(255,0,0,0.1)'};border-radius:3px">${imp.status}</span></td></tr>
              `)}</tbody>
            </table></div>
          ` : this._socanar15ActiveTab === 'actions' ? html`
            <div style="display:flex;gap:12px;margin-bottom:8px;font-size:10px;color:#888">
              ${Object.entries(this._socanar15GetActionStats()).map(([k,v]) => html`<span>${k}: <b style="color:#ddd">${v}</b></span>`)}
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
              ${this._socanar15Actions.map(a => html`
                <div style="display:flex;gap:8px;align-items:center;padding:6px;background:#1a1d27;border-radius:4px;cursor:pointer" @click=${() => this._socanar15ToggleAction(a.id)}>
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
              ${this._socanar15Lessons.map(l => html`
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
            ${['all', ...this._socanar15MaturityLevels.map(m => m.domain)].map(d => html`
              <button class="btn ${this._socanar15SelectedDomain === d ? 'btn-primary' : ''}" style="font-size:9px;padding:2px 6px" @click=${() => { this._socanar15SelectedDomain = d; }}>${d}</button>
            `)}
          </div>
          <div style="display:flex;gap:16px;margin-bottom:10px">
            <div style="text-align:center"><div style="color:#e0e0e0;font-size:20px;font-weight:bold">${this._socanar15GetOverallMaturity()}/5</div><div style="color:#888;font-size:10px">Maturity Level</div></div>
            <div style="text-align:center"><div style="color:#4f4;font-size:20px;font-weight:bold">${this._socanar15GetGapAnalysis().filter(g => g.isAbove).length}/${this._socanar15Benchmarks.length}</div><div style="color:#888;font-size:10px">Above Industry</div></div>
          </div>
          <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead><tr style="color:#888"><th style="text-align:left;padding:3px">Metric</th><th style="padding:3px">Current</th><th style="padding:3px">Industry</th><th style="padding:3px">Target</th><th style="padding:3px">Gap</th><th style="padding:3px">Source</th></tr></thead>
            <tbody>${this._socanar15GetGapAnalysis().map(b => html`
              <tr style="border-top:1px solid #2a2d37"><td style="padding:3px;color:#ddd">${b.metric}</td><td style="padding:3px;color:#e0e0e0;text-align:center;font-weight:bold">${b.current}${b.unit}</td><td style="padding:3px;color:#888;text-align:center">${b.industry}${b.unit}</td><td style="padding:3px;color:#4a9eff;text-align:center">${b.target}${b.unit}</td><td style="padding:3px;text-align:center;color:${b.isAbove ? '#4f4' : '#fa0'}">${b.isAbove ? '+' : ''}${b.gap.toFixed(1)}</td><td style="padding:3px;color:#666;font-size:9px">${b.source}</td></tr>
            `)}</tbody>
          </table></div>
          <div style="margin-top:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Maturity by Domain</div>
            ${this._socanar15MaturityLevels.filter(m => this._socanar15SelectedDomain === 'all' || m.domain === this._socanar15SelectedDomain).map(m => html`
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
                <span style="color:#aaa;font-size:10px;min-width:100px">${m.domain}</span>
                <div style="flex:1;background:#1a1d27;border-radius:3px;height:8px;overflow:hidden"><div style="height:100%;width:${m.current * 20}%;background:${m.current >= 4 ? '#4f4' : m.current >= 3 ? '#fa0' : '#f44'};border-radius:3px"></div></div>
                <span style="color:#ddd;font-size:10px;min-width:40px">${m.current}/5</span>
              </div>
            `)}
          </div>
          <div style="margin-top:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Quarterly Trend</div>
            <div style="display:flex;height:40px;align-items:flex-end;gap:4px">
              ${this._socanar15QuarterlyData.map(q => html`<div style="flex:1;text-align:center"><div style="background:#4a9eff;height:${q.score * 0.5}px;border-radius:2px 2px 0 0" title="${q.score}"></div><div style="color:#666;font-size:8px;margin-top:2px">${q.quarter}</div></div>`)}
            </div>
          </div>
        </div>

        <div class="card" style="padding:12px;margin-bottom:8px">
          <h4 style="margin:0 0 8px;color:#e0e0e0">Alert Triage and Enrichment</h4>
          <div style="display:flex;gap:12px;margin-bottom:8px;font-size:10px">
            <div style="display:flex;gap:4px;flex-wrap:wrap">${this._socanar15GroupAlerts().map(g => html`<span style="color:#888;padding:2px 6px;background:#1a1d27;border-radius:3px">${g.group}: ${g.count}</span>`)}</div>
          </div>
          <div style="display:flex;gap:8px;margin-bottom:8px;font-size:10px;color:#888">
            <span>FP Rate: <b style="color:${this._socanar15QualityMetrics.fpRate > 0.15 ? '#f44' : '#4f4'}">${(this._socanar15QualityMetrics.fpRate * 100).toFixed(1)}%</b></span>
            <span>Enrich: <b style="color:#4a9eff">${(this._socanar15QualityMetrics.enrichSuccess * 100).toFixed(0)}%</b></span>
            <span>Avg Triage: <b style="color:#ddd">${this._socanar15QualityMetrics.avgTriageTime}m</b></span>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto">
            ${this._socanar15Alerts.sort((a, b) => this._socanar15CalcScore(b) - this._socanar15CalcScore(a)).map(a => {
              const score = this._socanar15CalcScore(a);
              return html`
                <div style="padding:6px;background:#1a1d27;border-radius:4px;border-left:3px solid ${a.severity >= 4 ? '#f44' : a.severity >= 3 ? '#fa0' : '#4a9eff'}">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="color:#ddd;font-size:11px;flex:1">${a.name}</span>
                    <span style="color:#e0e0e0;font-size:12px;font-weight:bold;min-width:40px;text-align:center">${score.toFixed(1)}</span>
                    <button class="btn" style="font-size:9px;padding:1px 6px;margin-left:4px" @click=${() => this._socanar15EnrichAlert(a.id)}>${a.enriched ? 'Re-enrich' : 'Enrich'}</button>
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
            ${this._socanar15RoutingRules.map(r => html`
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
            ${this._socanar15Shapes.map(s => {
              const v = this._socanar15ValidateControl(s.id);
              return html`<div style="padding:4px 8px;background:#1a1d27;border-radius:3px;cursor:pointer;border:1px solid ${this._socanar15SelectedShape === s.id ? '#4a9eff' : '#2a2d37'}" @click=${() => { this._socanar15SelectedShape = this._socanar15SelectedShape === s.id ? '' : s.id; }}>
                <div style="display:flex;align-items:center;gap:4px"><span style="color:${v.valid ? '#4f4' : '#f44'};font-size:10px">${v.valid ? '\u2713' : '\u2717'}</span><span style="color:#ddd;font-size:10px">${s.label}</span></div>
                <div style="color:#888;font-size:8px">${s.controls.length} controls</div>
              </div>`;
            })}
          </div>
          ${this._socanar15SelectedShape ? html`
            ${(() => {
              const shape = this._socanar15Shapes.find(s => s.id === this._socanar15SelectedShape);
              const v = this._socanar15ValidateControl(this._socanar15SelectedShape);
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
            ${this._socanar15TrustBoundaries.map(tb => html`
              <div style="display:flex;gap:6px;align-items:center;padding:3px;background:#1a1d27;border-radius:3px;margin-bottom:2px;font-size:9px">
                <span style="color:#ddd">${this._socanar15Shapes.find(s => s.id === tb.from)?.label || tb.from}</span>
                <span style="color:#4a9eff">\u2194</span>
                <span style="color:#ddd">${this._socanar15Shapes.find(s => s.id === tb.to)?.label || tb.to}</span>
                <span style="flex:1"></span>
                <span style="color:#888">${tb.label}</span>
                <span style="color:${tb.strength === 'strong' ? '#4f4' : tb.strength === 'medium' ? '#fa0' : '#f44'};font-size:9px;padding:1px 4px;border-radius:2px;background:${tb.strength === 'strong' ? 'rgba(0,255,0,0.1)' : tb.strength === 'medium' ? 'rgba(255,170,0,0.1)' : 'rgba(255,0,0,0.1)'}">${tb.strength}</span>
              </div>
            `)}
          </div>
          <div><div style="color:#888;font-size:10px;margin-bottom:4px">Architecture Decision Records</div>
            ${this._socanar15ADRs.map(adr => html`
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
            ${this._socanar15Gauges.map(g => html`
              <div style="flex:1;min-width:100px;padding:6px;background:#1a1d27;border-radius:4px;text-align:center">
                <div style="color:#888;font-size:9px;margin-bottom:2px">${g.name}</div>
                <div style="color:${g.status === 'healthy' ? '#4f4' : g.status === 'warning' ? '#fa0' : '#f44'};font-size:18px;font-weight:bold">${g.value}${g.unit}</div>
                <div style="background:#2a2d37;border-radius:3px;height:4px;margin-top:4px;overflow:hidden"><div style="height:100%;width:${(g.value / g.max * 100)}%;background:${g.color};border-radius:3px"></div></div>
              </div>
            `)}
          </div>
          <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center">
            <span style="color:#888;font-size:10px">System Health:</span>
            <span style="color:${this._socanar15GetOverallHealth().score >= 99 ? '#4f4' : '#fa0'};font-size:12px;font-weight:bold">${this._socanar15GetOverallHealth().score}%</span>
            <span style="color:#888;font-size:10px">(Target: ${this._socanar15SlaTarget}%)</span>
            <span style="color:#4f4;font-size:10px">${this._socanar15GetOverallHealth().healthy} healthy</span>
            <span style="color:#fa0;font-size:10px">${this._socanar15GetOverallHealth().degraded} degraded</span>
          </div>
          <div style="margin-bottom:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Anomaly Stream</div>
            ${this._socanar15Anomalies.slice(0, 3).map(a => html`
              <div style="display:flex;gap:6px;align-items:center;padding:4px;background:#1a1d27;border-radius:3px;margin-bottom:2px;opacity:${a.acknowledged ? 0.5 : 1}">
                <span style="color:#888;font-size:9px;min-width:50px">${a.time}</span>
                <span style="color:${a.severity === 'high' ? '#f44' : a.severity === 'medium' ? '#fa0' : '#888'};font-size:9px;min-width:30px">${a.severity.toUpperCase()}</span>
                <span style="color:#ddd;font-size:10px;flex:1">${a.description}</span>
                ${!a.acknowledged ? html`<button class="btn" style="font-size:8px;padding:1px 4px" @click=${() => this._socanar15AckAnomaly(a.id)}>ACK</button>` : html`<span style="color:#4f4;font-size:9px">ACK'd</span>`}
              </div>
            `)}
          </div>
          <div style="margin-bottom:8px"><div style="color:#888;font-size:10px;margin-bottom:4px">Integration Health</div>
            ${this._socanar15Integrations.map(i => html`
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
              <tbody>${this._socanar15AlertFatigue.map(af => html`
                <tr style="border-top:1px solid #2a2d37"><td style="padding:3px;color:#ddd">${af.analyst}</td><td style="padding:3px;color:${af.alertsPerDay > 60 ? '#f44' : af.alertsPerDay > 40 ? '#fa0' : '#4f4'};text-align:center">${af.alertsPerDay}</td><td style="padding:3px;color:#aaa;text-align:center">${af.escalated}</td><td style="padding:3px;color:#888;text-align:center">${af.dismissed}</td><td style="padding:3px;color:#aaa;text-align:center">${af.avgResponseMin}m</td><td style="padding:3px;text-align:center;color:${af.alertsPerDay > 60 ? '#f44' : af.alertsPerDay > 40 ? '#fa0' : '#4f4'}">${af.alertsPerDay > 60 ? 'HIGH' : af.alertsPerDay > 40 ? 'MEDIUM' : 'LOW'}</td></tr>
              `)}</tbody>
            </table></div>
          </div>
        </div>
</div>
      </div>`;
  }


  

  private _socanar15RenderFishbone(): string {
    const categories = ['People','Process','Technology','Environment','Communication','Policy'];
    const bones = categories.map((cat, i) => {
      const angle = 30 + i * 20;
      return '<line x1="200" y1="150" x2="' + (200 + Math.cos(angle * Math.PI / 180) * 140) + '" y2="' + (150 - Math.sin(angle * Math.PI / 180) * 140) + '" stroke="#4a9eff" stroke-width="1.5"/><text x="' + (200 + Math.cos(angle * Math.PI / 180) * 145) + '" y="' + (150 - Math.sin(angle * Math.PI / 180) * 145) + '" fill="#e0e0e0" font-size="9" text-anchor="middle">' + cat + '</text>';
    }).join('');
    return '<svg width="400" height="300" viewBox="0 0 400 300"><line x1="60" y1="150" x2="340" y2="150" stroke="#e0e0e0" stroke-width="2"/><line x1="200" y1="30" x2="200" y2="270" stroke="#e0e0e0" stroke-width="2"/><text x="200" y="290" fill="#fa0" font-size="11" text-anchor="middle" font-weight="bold">Service Account Compromise</text>' + bones + '</svg>';
  }

  private _socanar15ToggleAction(id: string) {
    this._socanar15Actions = this._socanar15Actions.map(a => a.id === id ? {...a, status: a.status === 'pending' ? 'in_progress' : a.status === 'in_progress' ? 'completed' : 'pending'} : a);
  }

  private _socanar15GetActionStats() {
    const total = this._socanar15Actions.length;
    const done = this._socanar15Actions.filter(a => a.status === 'completed').length;
    const inProg = this._socanar15Actions.filter(a => a.status === 'in_progress').length;
    return { total, done, inProg, pending: total - done - inProg };
  }

  private _socanar15GetOverallMaturity(): number {
    if (this._socanar15SelectedDomain === 'all') {
      return Math.round(this._socanar15MaturityLevels.reduce((s, m) => s + m.current, 0) / this._socanar15MaturityLevels.length * 10) / 10;
    }
    const d = this._socanar15MaturityLevels.find(m => m.domain === this._socanar15SelectedDomain);
    return d ? d.current : 0;
  }

  private _socanar15GetGapAnalysis() {
    return this._socanar15Benchmarks.map(b => {
      const gap = b.current - b.industry;
      const targetGap = b.target - b.current;
      const isAbove = gap > 0;
      return { ...b, gap, targetGap, isAbove, status: isAbove ? 'exceeds' : targetGap > 0 ? 'improving' : 'on_track' };
    });
  }

  private _socanar15CalcScore(alert: any): number {
    return Math.round(alert.severity * alert.confidence * alert.assetCrit * 100) / 100;
  }

  private _socanar15EnrichAlert(id: string) {
    this._socanar15Alerts = this._socanar15Alerts.map(a => {
      if (a.id !== id) return a;
      const score = this._socanar15CalcScore(a);
      return { ...a, enriched: true, score, enrichData: a.enrichData.length > 0 ? a.enrichData : [{key:'Auto-Enriched',value:'Simulated at ' + new Date().toLocaleTimeString()},{key:'Reputation',value: Math.random() > 0.5 ? 'Malicious' : 'Neutral'},{key:'Geo',value: 'US-EAST'}] };
    });
  }

  private _socanar15GroupAlerts() {
    const groups: Record<string, number> = {};
    this._socanar15Alerts.forEach(a => { groups[a.group] = (groups[a.group] || 0) + 1; });
    return Object.entries(groups).map(([g, c]) => ({group: g, count: c}));
  }

  private _socanar15ValidateControl(shapeId: string): {valid:boolean;missing:string[]} {
    const shape = this._socanar15Shapes.find(s => s.id === shapeId);
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

  private _socanar15GetOverallHealth(): {healthy:number;degraded:number;down:number;score:number} {
    const online = this._socanar15Integrations.filter(i => i.status === 'online').length;
    const degraded = this._socanar15Integrations.filter(i => i.status === 'degraded').length;
    const total = this._socanar15Integrations.length;
    return { healthy: online, degraded, down: total - online - degraded, score: Math.round(online / total * 100) };
  }

  private _socanar15AckAnomaly(id: string) {
    this._socanar15Anomalies = this._socanar15Anomalies.map(a => a.id === id ? {...a, acknowledged: true} : a);
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


  private _renderBudgetPlanning() {
    const budgetData = [
      { category: "Personnel & Training", planned: 3831000, actual: 1463000, utilization: 38.2, q1: "25%", q2: "30%", q3: "28%", q4: "20%" },
      { category: "Tooling & Licensing", planned: 3838000, actual: 1476000, utilization: 38.5, q1: "28%", q2: "35%", q3: "23%", q4: "21%" },
      { category: "Infrastructure Security", planned: 3845000, actual: 1489000, utilization: 38.7, q1: "15%", q2: "24%", q3: "18%", q4: "22%" },
      { category: "Compliance & Audit", planned: 3852000, actual: 1502000, utilization: 39.0, q1: "18%", q2: "29%", q3: "29%", q4: "23%" },
      { category: "Incident Response", planned: 3859000, actual: 1515000, utilization: 39.3, q1: "21%", q2: "34%", q3: "24%", q4: "24%" },
      { category: "Third-Party Assessments", planned: 3866000, actual: 1528000, utilization: 39.5, q1: "24%", q2: "23%", q3: "19%", q4: "25%" },
      { category: "Security Awareness", planned: 3873000, actual: 1541000, utilization: 39.8, q1: "27%", q2: "28%", q3: "30%", q4: "10%" },
      { category: "Research & Innovation", planned: 3880000, actual: 1554000, utilization: 40.1, q1: "30%", q2: "33%", q3: "25%", q4: "11%" },
    ];
    const totalBudget = budgetData.reduce((s, d) => s + d.planned, 0);
    const totalSpent = budgetData.reduce((s, d) => s + d.actual, 0);
    const overallUtil = ((totalSpent / totalBudget) * 100).toFixed(1);
    const headcount = [
      { team: "SOC Tier 1", current: 6, target: 17, gap: 4, avgSalary: "188k" },
      { team: "SOC Tier 2", current: 15, target: 16, gap: 3, avgSalary: "106k" },
      { team: "Threat Intel", current: 7, target: 15, gap: 2, avgSalary: "135k" },
      { team: "Red Team", current: 16, target: 14, gap: 1, avgSalary: "164k" },
      { team: "GRC", current: 8, target: 13, gap: 0, avgSalary: "193k" },
      { team: "AppSec", current: 17, target: 12, gap: 5, avgSalary: "111k" },
      { team: "Cloud Sec", current: 9, target: 11, gap: 4, avgSalary: "140k" },
      { team: "Identity & Access", current: 18, target: 10, gap: 3, avgSalary: "169k" },
    ];
    const vendorSpend = [
      { vendor: "CrowdStrike", annual: "741k", contractEnd: "2026-11", renewalRisk: "Low", satisfaction: 4 },
      { vendor: "Palo Alto", annual: "772k", contractEnd: "2026-12", renewalRisk: "Medium", satisfaction: 3 },
      { vendor: "Splunk", annual: "52k", contractEnd: "2026-01", renewalRisk: "High", satisfaction: 5 },
      { vendor: "Qualys", annual: "83k", contractEnd: "2026-02", renewalRisk: "Low", satisfaction: 4 },
      { vendor: "Rapid7", annual: "114k", contractEnd: "2026-03", renewalRisk: "Medium", satisfaction: 3 },
      { vendor: "Mandiant", annual: "145k", contractEnd: "2026-04", renewalRisk: "High", satisfaction: 5 },
      { vendor: "Zscaler", annual: "176k", contractEnd: "2026-05", renewalRisk: "Low", satisfaction: 4 },
      { vendor: "Duo Security", annual: "207k", contractEnd: "2026-06", renewalRisk: "Medium", satisfaction: 3 },
    ];
    const roiProjections = [
      { area: "Threat Detection", investment: "761k", projectedReturn: "1041k", roiMultiple: "1.5x", confidence: 82 },
      { area: "Incident Reduction", investment: "804k", projectedReturn: "1088k", roiMultiple: "4.0x", confidence: 63 },
      { area: "Compliance Savings", investment: "847k", projectedReturn: "1135k", roiMultiple: "3.9x", confidence: 80 },
      { area: "Automation Gains", investment: "890k", projectedReturn: "1182k", roiMultiple: "3.8x", confidence: 61 },
      { area: "Risk Avoidance", investment: "132k", projectedReturn: "1229k", roiMultiple: "3.7x", confidence: 78 },
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
      { id: "kpi-1", name: "MTTD", owner: "SOC", unit: "minutes", target: 83, current: 72, benchmark: 82, collection: "auto", frequency: "realtime" },
      { id: "kpi-2", name: "MTTR", owner: "GRC", unit: "%", target: 86, current: 79, benchmark: 93, collection: "semi-auto", frequency: "daily" },
      { id: "kpi-3", name: "MTTC", owner: "AppSec", unit: "score", target: 89, current: 86, benchmark: 70, collection: "manual", frequency: "weekly" },
      { id: "kpi-4", name: "Vuln SLA Compliance", owner: "Cloud Sec", unit: "count", target: 92, current: 93, benchmark: 81, collection: "auto", frequency: "monthly" },
      { id: "kpi-5", name: "Patch Coverage", owner: "Identity", unit: "days", target: 95, current: 100, benchmark: 92, collection: "semi-auto", frequency: "realtime" },
      { id: "kpi-6", name: "Phishing Click Rate", owner: "Threat Intel", unit: "minutes", target: 98, current: 61, benchmark: 69, collection: "manual", frequency: "daily" },
      { id: "kpi-7", name: "Training Completion", owner: "Security Ops", unit: "%", target: 71, current: 68, benchmark: 80, collection: "auto", frequency: "weekly" },
      { id: "kpi-8", name: "Escalation Rate", owner: "Risk Mgmt", unit: "score", target: 74, current: 75, benchmark: 91, collection: "semi-auto", frequency: "monthly" },
      { id: "kpi-9", name: "False Positive Rate", owner: "SOC", unit: "count", target: 77, current: 82, benchmark: 68, collection: "manual", frequency: "realtime" },
      { id: "kpi-10", name: "Threat Intel Actionability", owner: "GRC", unit: "days", target: 80, current: 89, benchmark: 79, collection: "auto", frequency: "daily" },
      { id: "kpi-11", name: "Endpoint Compliance", owner: "AppSec", unit: "minutes", target: 83, current: 96, benchmark: 90, collection: "semi-auto", frequency: "weekly" },
      { id: "kpi-12", name: "Cloud Misconfig Score", owner: "Cloud Sec", unit: "%", target: 86, current: 57, benchmark: 67, collection: "manual", frequency: "monthly" },
      { id: "kpi-13", name: "Identity Anomaly Rate", owner: "Identity", unit: "score", target: 89, current: 64, benchmark: 78, collection: "auto", frequency: "realtime" },
      { id: "kpi-14", name: "DLP Events", owner: "Threat Intel", unit: "count", target: 92, current: 71, benchmark: 89, collection: "semi-auto", frequency: "daily" },
      { id: "kpi-15", name: "Vendor Risk Avg", owner: "Security Ops", unit: "days", target: 95, current: 78, benchmark: 66, collection: "manual", frequency: "weekly" },
      { id: "kpi-16", name: "Compliance Audit Pass Rate", owner: "Risk Mgmt", unit: "minutes", target: 98, current: 85, benchmark: 77, collection: "auto", frequency: "monthly" },
      { id: "kpi-17", name: "Awareness Score", owner: "SOC", unit: "%", target: 71, current: 92, benchmark: 88, collection: "semi-auto", frequency: "realtime" },
      { id: "kpi-18", name: "SOC Utilization", owner: "GRC", unit: "score", target: 74, current: 99, benchmark: 65, collection: "manual", frequency: "daily" },
      { id: "kpi-19", name: "Automation Coverage", owner: "AppSec", unit: "count", target: 77, current: 60, benchmark: 76, collection: "auto", frequency: "weekly" },
      { id: "kpi-20", name: "Risk Register Currency", owner: "Cloud Sec", unit: "days", target: 80, current: 67, benchmark: 87, collection: "semi-auto", frequency: "monthly" },
    ];
    const benchmarkSources = [
      { source: "NIST CSF", mappedKPIs: 4, alignment: 97, lastReview: "2026-02-02", status: "aligned" },
      { source: "CIS Controls v8", mappedKPIs: 5, alignment: 75, lastReview: "2026-03-25", status: "partial" },
      { source: "ISO 27001:2022", mappedKPIs: 6, alignment: 92, lastReview: "2026-04-20", status: "reviewing" },
      { source: "PCI DSS 4.0", mappedKPIs: 7, alignment: 70, lastReview: "2026-05-15", status: "aligned" },
      { source: "SOC 2 Type II", mappedKPIs: 8, alignment: 87, lastReview: "2026-06-10", status: "partial" },
      { source: "MITRE ATT&CK", mappedKPIs: 3, alignment: 65, lastReview: "2026-01-05", status: "reviewing" },
      { source: "SANS Top 20", mappedKPIs: 4, alignment: 82, lastReview: "2026-02-28", status: "aligned" },
      { source: "OWASP Top 10", mappedKPIs: 5, alignment: 60, lastReview: "2026-03-23", status: "partial" },
    ];
    const normalizationRules = [
      { rule: "Time metrics normalized to minutes", appliesTo: 6, exceptions: 1, version: "v2.3" },
      { rule: "Percentage metrics capped at 100", appliesTo: 5, exceptions: 2, version: "v2.0" },
      { rule: "Count metrics use 7-day rolling avg", appliesTo: 4, exceptions: 0, version: "v2.7" },
      { rule: "Score metrics use 0-100 scale", appliesTo: 3, exceptions: 1, version: "v2.4" },
      { rule: "Rate metrics per 1000 events", appliesTo: 7, exceptions: 2, version: "v2.1" },
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
      { id: "HC-1001", name: "Lateral Movement Sweep", status: "active", hypothesis: "H1: Actors using pass-the-hash for lateral movement", leadHunter: "Alice Chen", findings: 41, startDate: "2026-02-22", endDate: null, effectiveness: 76 },
      { id: "HC-1002", name: "Credential Harvesting Hunt", status: "completed", hypothesis: "H2: Actors using web shells for persistence", leadHunter: "Bob Martinez", findings: 44, startDate: "2026-01-05", endDate: "2026-04-11", effectiveness: 95 },
      { id: "HC-1003", name: "Persistence Mechanism Audit", status: "planned", hypothesis: "H3: Actors using scheduled tasks for data theft", leadHunter: "Carol Wu", findings: 47, startDate: "2026-04-16", endDate: null, effectiveness: 55 },
      { id: "HC-1004", name: "C2 Beacon Detection", status: "in-review", hypothesis: "H4: Actors using DNS tunneling for C2 communication", leadHunter: "Dave Kim", findings: 2, startDate: "2026-03-27", endDate: null, effectiveness: 74 },
      { id: "HC-1005", name: "Data Exfiltration Patterns", status: "active", hypothesis: "H5: Actors using encrypted channels for privilege escalation", leadHunter: "Eve Johnson", findings: 5, startDate: "2026-02-10", endDate: null, effectiveness: 93 },
      { id: "HC-1006", name: "Privilege Escalation Scan", status: "completed", hypothesis: "H6: Actors using token impersonation for defense evasion", leadHunter: "Frank Liu", findings: 8, startDate: "2026-01-21", endDate: "2026-05-23", effectiveness: 53 },
      { id: "HC-1007", name: "Supply Chain Implant Hunt", status: "planned", hypothesis: "H7: Actors using poisoned images for initial access", leadHunter: "Grace Park", findings: 11, startDate: "2026-04-04", endDate: null, effectiveness: 72 },
      { id: "HC-1008", name: "Insider Threat Indicators", status: "in-review", hypothesis: "H8: Actors using legitimate tools for credential access", leadHunter: "Hector Silva", findings: 14, startDate: "2026-03-15", endDate: null, effectiveness: 91 },
      { id: "HC-1009", name: "Cloud Metadata Analysis", status: "active", hypothesis: "H9: Actors using API keys for command execution", leadHunter: "Alice Chen", findings: 17, startDate: "2026-02-26", endDate: null, effectiveness: 51 },
      { id: "HC-1010", name: "DNS Tunnel Detection", status: "completed", hypothesis: "H10: Actors using encoded subdomains for exfiltration", leadHunter: "Bob Martinez", findings: 20, startDate: "2026-01-09", endDate: "2026-06-07", effectiveness: 70 },
      { id: "HC-1011", name: "Fileless Malware Search", status: "planned", hypothesis: "H11: Actors using WMI providers for discovery", leadHunter: "Carol Wu", findings: 23, startDate: "2026-04-20", endDate: null, effectiveness: 89 },
      { id: "HC-1012", name: "Zero-Day Exploit Traces", status: "in-review", hypothesis: "H12: Actors using exploit kits for collection", leadHunter: "Dave Kim", findings: 26, startDate: "2026-03-03", endDate: null, effectiveness: 49 },
    ];
    const hunterLeaderboard = [
      { hunter: "Alice Chen", campaigns: 13, findings: 22, highSeverity: 23, avgScore: 60, streak: 2 },
      { hunter: "Bob Martinez", campaigns: 10, findings: 51, highSeverity: 2, avgScore: 97, streak: 3 },
      { hunter: "Carol Wu", campaigns: 7, findings: 80, highSeverity: 7, avgScore: 90, streak: 4 },
      { hunter: "Dave Kim", campaigns: 4, findings: 109, highSeverity: 12, avgScore: 83, streak: 5 },
      { hunter: "Eve Johnson", campaigns: 14, findings: 22, highSeverity: 17, avgScore: 76, streak: 6 },
      { hunter: "Frank Liu", campaigns: 11, findings: 51, highSeverity: 22, avgScore: 69, streak: 7 },
      { hunter: "Grace Park", campaigns: 8, findings: 80, highSeverity: 1, avgScore: 62, streak: 8 },
      { hunter: "Hector Silva", campaigns: 5, findings: 109, highSeverity: 6, avgScore: 55, streak: 1 },
    ];
    const mitreMapping = [
      { tactic: "Initial Access", techniques: 7, campaigns: 6, coverage: 30 },
      { tactic: "Execution", techniques: 6, campaigns: 5, coverage: 81 },
      { tactic: "Persistence", techniques: 5, campaigns: 4, coverage: 61 },
      { tactic: "Privilege Escalation", techniques: 4, campaigns: 3, coverage: 41 },
      { tactic: "Defense Evasion", techniques: 3, campaigns: 2, coverage: 92 },
      { tactic: "Credential Access", techniques: 2, campaigns: 1, coverage: 72 },
      { tactic: "Discovery", techniques: 12, campaigns: 6, coverage: 52 },
      { tactic: "Lateral Movement", techniques: 11, campaigns: 5, coverage: 32 },
      { tactic: "Collection", techniques: 10, campaigns: 4, coverage: 83 },
      { tactic: "Exfiltration", techniques: 9, campaigns: 3, coverage: 63 },
      { tactic: "Command & Control", techniques: 8, campaigns: 2, coverage: 43 },
      { tactic: "Impact", techniques: 7, campaigns: 1, coverage: 94 },
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
      { id: "CTL-2001", name: "MFA Enforcement", domain: "Access Control", status: "implemented", effectiveness: 73, lastTest: "2026-02-14", nextReview: "2026-06-14", owner: "SOC", risk: "Low" },
      { id: "CTL-2002", name: "Network Segmentation", domain: "Network Security", status: "partial", effectiveness: 1, lastTest: "2026-01-27", nextReview: "2026-07-05", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2003", name: "EDR Deployment", domain: "Endpoint Protection", status: "planned", effectiveness: 8, lastTest: "2026-04-12", nextReview: "2026-08-24", owner: "IT Ops", risk: "High" },
      { id: "CTL-2004", name: "DLP Policy", domain: "Data Protection", status: "gap", effectiveness: 15, lastTest: "2026-03-25", nextReview: "2026-09-15", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2005", name: "SSO Integration", domain: "Identity Management", status: "implemented", effectiveness: 85, lastTest: "2026-02-10", nextReview: "2026-10-06", owner: "IAM", risk: "Low" },
      { id: "CTL-2006", name: "SAST Pipeline", domain: "Application Security", status: "partial", effectiveness: 29, lastTest: "2026-01-23", nextReview: "2026-11-25", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2007", name: "CSPM Scanning", domain: "Cloud Security", status: "planned", effectiveness: 36, lastTest: "2026-04-08", nextReview: "2026-12-16", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2008", name: "Badge Access", domain: "Physical Security", status: "gap", effectiveness: 43, lastTest: "2026-03-21", nextReview: "2026-05-07", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2009", name: "Least Privilege", domain: "Access Control", status: "implemented", effectiveness: 97, lastTest: "2026-02-06", nextReview: "2026-06-26", owner: "SOC", risk: "Low" },
      { id: "CTL-2010", name: "Firewall Rules", domain: "Network Security", status: "partial", effectiveness: 6, lastTest: "2026-01-19", nextReview: "2026-07-17", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2011", name: "Disk Encryption", domain: "Endpoint Protection", status: "planned", effectiveness: 13, lastTest: "2026-04-04", nextReview: "2026-08-08", owner: "IT Ops", risk: "High" },
      { id: "CTL-2012", name: "Data Classification", domain: "Data Protection", status: "gap", effectiveness: 20, lastTest: "2026-03-17", nextReview: "2026-09-27", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2013", name: "PAM Implementation", domain: "Identity Management", status: "implemented", effectiveness: 50, lastTest: "2026-02-02", nextReview: "2026-10-18", owner: "IAM", risk: "Low" },
      { id: "CTL-2014", name: "DAST Pipeline", domain: "Application Security", status: "partial", effectiveness: 34, lastTest: "2026-01-15", nextReview: "2026-11-09", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2015", name: "IAM Policy Review", domain: "Cloud Security", status: "planned", effectiveness: 41, lastTest: "2026-04-28", nextReview: "2026-12-28", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2016", name: "Visitor Management", domain: "Physical Security", status: "gap", effectiveness: 48, lastTest: "2026-03-13", nextReview: "2026-05-19", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2017", name: "Access Reviews", domain: "Access Control", status: "implemented", effectiveness: 62, lastTest: "2026-02-26", nextReview: "2026-06-10", owner: "SOC", risk: "Low" },
      { id: "CTL-2018", name: "IDS/IPS Tuning", domain: "Network Security", status: "partial", effectiveness: 11, lastTest: "2026-01-11", nextReview: "2026-07-01", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2019", name: "Patch Management", domain: "Endpoint Protection", status: "planned", effectiveness: 18, lastTest: "2026-04-24", nextReview: "2026-08-20", owner: "IT Ops", risk: "High" },
      { id: "CTL-2020", name: "Backup Encryption", domain: "Data Protection", status: "gap", effectiveness: 25, lastTest: "2026-03-09", nextReview: "2026-09-11", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2021", name: "Password Policy", domain: "Identity Management", status: "implemented", effectiveness: 74, lastTest: "2026-02-22", nextReview: "2026-10-02", owner: "IAM", risk: "Low" },
      { id: "CTL-2022", name: "Container Scanning", domain: "Application Security", status: "partial", effectiveness: 39, lastTest: "2026-01-07", nextReview: "2026-11-21", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2023", name: "WAF Configuration", domain: "Cloud Security", status: "planned", effectiveness: 46, lastTest: "2026-04-20", nextReview: "2026-12-12", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2024", name: "CCTV Coverage", domain: "Physical Security", status: "gap", effectiveness: 2, lastTest: "2026-03-05", nextReview: "2026-05-03", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2025", name: "RBAC Enforcement", domain: "Access Control", status: "implemented", effectiveness: 86, lastTest: "2026-02-18", nextReview: "2026-06-22", owner: "SOC", risk: "Low" },
      { id: "CTL-2026", name: "VPN Management", domain: "Network Security", status: "partial", effectiveness: 16, lastTest: "2026-01-03", nextReview: "2026-07-13", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2027", name: "App Whitelisting", domain: "Endpoint Protection", status: "planned", effectiveness: 23, lastTest: "2026-04-16", nextReview: "2026-08-04", owner: "IT Ops", risk: "High" },
      { id: "CTL-2028", name: "Key Management", domain: "Data Protection", status: "gap", effectiveness: 30, lastTest: "2026-03-01", nextReview: "2026-09-23", owner: "Data Gov", risk: "Critical" },
    ];
    const gapAnalysis = [
      { gap: "Insufficient MFA coverage for legacy apps", severity: "High", remediationPlan: "Plan R3001", eta: "2026-Q2", estimatedCost: "186k" },
      { gap: "Missing network micro-segmentation", severity: "Medium", remediationPlan: "Plan R3002", eta: "2026-Q4", estimatedCost: "34k" },
      { gap: "Inconsistent EDR deployment", severity: "Medium", remediationPlan: "Plan R3003", eta: "2026-Q3", estimatedCost: "63k" },
      { gap: "DLP not covering cloud storage", severity: "Low", remediationPlan: "Plan R3004", eta: "2026-Q2", estimatedCost: "92k" },
      { gap: "SSO not integrated with all SaaS", severity: "High", remediationPlan: "Plan R3005", eta: "2026-Q4", estimatedCost: "121k" },
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
      { id: "INC-7001", name: "Security Incident 1", severity: "Critical", totalCost: 1794000, responseCost: 609960, recoveryCost: 699660, legalCost: 251160, regulatoryCost: 143520, insuranceClaim: 986700, avoidedCost: 382000, date: "2026-02-06" },
      { id: "INC-7002", name: "Security Incident 2", severity: "High", totalCost: 1797000, responseCost: 359400, recoveryCost: 521130, legalCost: 197670, regulatoryCost: 251580, insuranceClaim: 0, avoidedCost: 411000, date: "2026-01-15" },
      { id: "INC-7003", name: "Security Incident 3", severity: "Medium", totalCost: 1800000, responseCost: 486000, recoveryCost: 720000, legalCost: 144000, regulatoryCost: 162000, insuranceClaim: 900000, avoidedCost: 440000, date: "2026-04-24" },
      { id: "INC-7004", name: "Security Incident 4", severity: "Low", totalCost: 1803000, responseCost: 613020, recoveryCost: 540900, legalCost: 90150, regulatoryCost: 270450, insuranceClaim: 0, avoidedCost: 469000, date: "2026-03-05" },
      { id: "INC-7005", name: "Security Incident 5", severity: "Critical", totalCost: 1806000, responseCost: 361200, recoveryCost: 361200, legalCost: 325080, regulatoryCost: 180600, insuranceClaim: 812700, avoidedCost: 498000, date: "2026-02-14" },
      { id: "INC-7006", name: "Security Incident 6", severity: "High", totalCost: 1809000, responseCost: 488430, recoveryCost: 560790, legalCost: 271350, regulatoryCost: 90450, insuranceClaim: 0, avoidedCost: 31000, date: "2026-01-23" },
      { id: "INC-7007", name: "Security Incident 7", severity: "Medium", totalCost: 1812000, responseCost: 616080, recoveryCost: 380520, legalCost: 217440, regulatoryCost: 199320, insuranceClaim: 724800, avoidedCost: 60000, date: "2026-04-04" },
      { id: "INC-7008", name: "Security Incident 8", severity: "Low", totalCost: 1815000, responseCost: 363000, recoveryCost: 580800, legalCost: 163350, regulatoryCost: 108900, insuranceClaim: 0, avoidedCost: 89000, date: "2026-03-13" },
      { id: "INC-7009", name: "Security Incident 9", severity: "Critical", totalCost: 1818000, responseCost: 490860, recoveryCost: 399960, legalCost: 109080, regulatoryCost: 218160, insuranceClaim: 636300, avoidedCost: 118000, date: "2026-02-22" },
      { id: "INC-7010", name: "Security Incident 10", severity: "High", totalCost: 1821000, responseCost: 619140, recoveryCost: 600930, legalCost: 345990, regulatoryCost: 127470, insuranceClaim: 0, avoidedCost: 147000, date: "2026-01-03" },
      { id: "INC-7011", name: "Security Incident 11", severity: "Medium", totalCost: 1824000, responseCost: 364800, recoveryCost: 419520, legalCost: 291840, regulatoryCost: 237120, insuranceClaim: 547200, avoidedCost: 176000, date: "2026-04-12" },
      { id: "INC-7012", name: "Security Incident 12", severity: "Low", totalCost: 1827000, responseCost: 493290, recoveryCost: 621180, legalCost: 237510, regulatoryCost: 146160, insuranceClaim: 0, avoidedCost: 205000, date: "2026-03-21" },
    ];
    const yearlyTrend = [
      { month: "Jan", incidents: 5, totalCost: "234k", avgCost: "100k", insured: 45 },
      { month: "Feb", incidents: 2, totalCost: "277k", avgCost: "147k", insured: 45 },
      { month: "Mar", incidents: 10, totalCost: "320k", avgCost: "194k", insured: 45 },
      { month: "Apr", incidents: 7, totalCost: "363k", avgCost: "60k", insured: 45 },
      { month: "May", incidents: 4, totalCost: "406k", avgCost: "107k", insured: 45 },
      { month: "Jun", incidents: 12, totalCost: "449k", avgCost: "154k", insured: 45 },
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


declare global { interface HTMLElementTagNameMap { 'sc-soc-analyst-workflow': ScSocAnalystWorkflow; } }
