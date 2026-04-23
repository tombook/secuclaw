/**
 * sc-ransomware-simulator — Ransomware Attack Simulator (Security Resilience Testing Component)
 * Full ransomware kill chain simulation, defense effectiveness testing, business impact assessment, backup/recovery verification
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

type SimulationStatus = 'not-started' | 'running' | 'completed' | 'failed';
type AttackPhaseStatus = 'not-started' | 'in-progress' | 'succeeded' | 'failed' | 'blocked' | 'detected';
type RecoveryTestStatus = 'passed' | 'failed' | 'warning';
type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

interface AttackPhase {
  id: string;
  name: string;
  status: AttackPhaseStatus;
  progress: number;
  startTime?: string;
  endTime?: string;
  techniques: string[];
  detectionStatus: 'undetected' | 'detected' | 'delayed-detection';
  preventionStatus: 'not-blocked' | 'blocked' | 'delayed-blocking';
  details: string;
}

interface ImpactAssessment {
  systemsEncrypted: number;
  totalFilesEncrypted: number;
  sensitiveDataExfiltrated: number; // in GB
  estimatedDowntime: number; // in hours
  estimatedRecoveryTime: number; // in hours
  estimatedFinancialLoss: number; // in USD
  businessProcessesAffected: string[];
  regulatoryImpact: string;
}

interface DefenseControl {
  id: string;
  name: string;
  type: 'prevention' | 'detection' | 'response' | 'recovery';
  effectiveness: 'effective' | 'partially-effective' | 'ineffective' | 'not-tested';
  attackPhase: string;
  comments: string;
}

interface BackupTestResult {
  id: string;
  name: string;
  type: 'full-backup' | 'incremental-backup' | 'offline-backup' | 'cloud-backup';
  status: RecoveryTestStatus;
  recoveryTime: number; // in hours
  dataLoss: number; // data lost in GB, 0 means no loss
  integrityVerified: boolean;
  details: string;
}

interface RansomwareFamily {
  id: string;
  name: string;
  aliases: string[];
  severity: SeverityLevel;
  characteristics: string[];
  knownExtortionTactics: string[];
}

interface SimulationScenario {
  id: string;
  name: string;
  description: string;
  ransomwareFamily: RansomwareFamily;
  attackVector: 'phishing' | 'exploit-public-facing' | 'compromised-credentials' | 'supply-chain' | 'insider-threat';
  targetSystems: string[];
  targetDepartments: string[];
  exfiltrationEnabled: boolean;
  doubleExtortionEnabled: boolean;
  tripleExtortionEnabled: boolean;
  lateralMovementEnabled: boolean;
}

interface SimulationRun {
  id: string;
  name: string;
  scenario: SimulationScenario;
  status: SimulationStatus;
  startTime?: string;
  endTime?: string;
  operator: string;
  attackPhases: AttackPhase[];
  impact: ImpactAssessment;
  defenseControls: DefenseControl[];
  backupTests: BackupTestResult[];
  summary: {
    overallResilienceScore: number;
    preventionEffectiveness: number;
    detectionEffectiveness: number;
    responseEffectiveness: number;
    recoveryEffectiveness: number;
    recommendations: string[];
    gapsIdentified: number;
  };
}

@customElement('sc-ransomware-simulator')
export class ScRansomwareSimulator extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #111827); border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .simulation-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; gap: 12px; }
    .simulation-info h2 { font-size: 18px; font-weight: 700; margin-bottom: 6px; }
    .simulation-meta { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; font-size: 12px; color: var(--text-secondary, #cbd5e1); }
    .status-badge { padding: 4px 10px; border-radius: 4px; font-weight: 600; font-size: 11px; }
    .status-not-started { background: #1e293b; color: #94a3b8; }
    .status-running { background: #431407; color: #fdba74; animation: pulse 2s infinite; }
    .status-completed { background: #052e16; color: #86efac; }
    .status-failed { background: #450a0a; color: #fca5a5; }
    .severity-badge { padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .severity-critical { background: #450a0a; color: #fca5a5; }
    .severity-high { background: #431407; color: #fdba74; }
    .severity-medium { background: #422006; color: #fde047; }
    .severity-low { background: #166534; color: #86efac; }
    .type-badge { padding: 3px 8px; border-radius: 3px; font-size: 10px; font-weight: 600; background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); text-transform: uppercase; }
    .controls { display: flex; gap: 6px; flex-wrap: wrap; }
    .btn { padding: 6px 12px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); color: var(--text-secondary, #94a3b8); transition: all 0.2s; }
    .btn.active { background: var(--accent-color, #3b82f6); color: white; border-color: var(--accent-color, #3b82f6); }
    .btn:hover { border-color: var(--accent-color, #3b82f6); color: var(--text-primary, #e2e8f0); }
    .btn.danger { background: #450a0a; border-color: #7f1d1d; color: #fca5a5; }
    .btn.danger:hover { background: #7f1d1d; }
    .btn.success { background: #052e16; border-color: #166534; color: #86efac; }
    .btn.success:hover { background: #166534; }
    .btn.warning { background: #422006; border-color: #854d0e; color: #fde047; }
    .btn.warning:hover { background: #854d0e; }
    .score-card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .score-card { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 12px; text-align: center; border: 1px solid var(--border-color, #374151); }
    .score-value { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .score-label { font-size: 11px; color: var(--text-tertiary, #94a3b8); text-transform: uppercase; font-weight: 600; }
    .score-value.excellent { color: #22c55e; }
    .score-value.good { color: #84cc16; }
    .score-value.average { color: #eab308; }
    .score-value.poor { color: #f97316; }
    .score-value.bad { color: #ef4444; }
    .kill-chain-container { margin-bottom: 20px; overflow-x: auto; padding-bottom: 8px; }
    .kill-chain { display: flex; gap: 2px; min-width: 900px; }
    .phase-card { flex: 1; min-width: 80px; background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); border-radius: 6px; padding: 8px; cursor: pointer; transition: all 0.2s; position: relative; text-align: center; }
    .phase-card:hover { border-color: var(--accent-color, #3b82f6); transform: translateY(-2px); }
    .phase-card.active { border-color: var(--accent-color, #3b82f6); background: var(--bg-primary, #111827); }
    .phase-name { font-weight: 700; font-size: 10px; margin-bottom: 6px; line-height: 1.3; }
    .phase-status-badge { position: absolute; top: 4px; right: 4px; font-size: 8px; padding: 1px 3px; border-radius: 2px; font-weight: 600; }
    .status-not-started { background: #0a0e17; color: #6b7280; }
    .status-in-progress { background: #1e3a8a; color: #93c5fd; animation: pulse 2s infinite; }
    .status-succeeded { background: #052e16; color: #86efac; }
    .status-failed { background: #450a0a; color: #fca5a5; }
    .status-blocked { background: #15803d; color: #86efac; }
    .status-detected { background: #1e40af; color: #93c5fd; }
    .phase-progress { height: 4px; background: var(--bg-tertiary, #0a0e17); border-radius: 2px; margin-bottom: 6px; overflow: hidden; }
    .phase-progress-fill { height: 100%; border-radius: 2px; }
    .phase-detection-status { font-size: 8px; font-weight: 600; margin-top: 4px; text-transform: uppercase; }
    .detection-undetected { color: #ef4444; }
    .detection-detected { color: #22c55e; }
    .detection-delayed-detection { color: #eab308; }
    .content-tabs { display: flex; gap: 0; margin-bottom: 12px; border-bottom: 1px solid var(--border-color, #374151); }
    .tab-btn { padding: 6px 16px; font-size: 12px; font-weight: 600; border: none; background: transparent; color: var(--text-secondary, #94a3b8); cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .tab-btn.active { color: var(--accent-color, #3b82f6); border-bottom-color: var(--accent-color, #3b82f6); }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .impact-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .impact-card { background: var(--bg-tertiary, #0a0e17); border-radius: 6px; padding: 10px; }
    .impact-value { font-size: 20px; font-weight: 700; margin-bottom: 2px; }
    .impact-value.critical { color: #ef4444; }
    .impact-value.high { color: #f97316; }
    .impact-value.medium { color: #eab308; }
    .impact-value.low { color: #22c55e; }
    .impact-label { font-size: 10px; color: var(--text-tertiary, #94a3b8); text-transform: uppercase; font-weight: 600; }
    .impact-desc { font-size: 11px; color: var(--text-secondary, #cbd5e1); margin-top: 4px; }
    .controls-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 8px; max-height: 400px; overflow-y: auto; }
    .control-item { background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); border-radius: 6px; padding: 10px 12px; }
    .control-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .control-name { font-weight: 600; font-size: 13px; }
    .control-type { font-size: 9px; padding: 1px 4px; border-radius: 2px; text-transform: uppercase; font-weight: 600; background: var(--bg-tertiary, #0a0e17); }
    .control-effectiveness { padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .effectiveness-effective { background: #052e16; color: #86efac; }
    .effectiveness-partially-effective { background: #422006; color: #fde047; }
    .effectiveness-ineffective { background: #450a0a; color: #fca5a5; }
    .effectiveness-not-tested { background: #1e293b; color: #94a3b8; }
    .control-phase { font-size: 10px; color: var(--text-tertiary, #94a3b8); margin-bottom: 6px; }
    .control-details { font-size: 11px; color: var(--text-secondary, #cbd5e1); }
    .backup-tests-list { display: flex; flex-direction: column; gap: 8px; max-height: 400px; overflow-y: auto; }
    .backup-test-item { background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); border-radius: 6px; padding: 10px 12px; }
    .backup-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .backup-name { font-weight: 600; font-size: 13px; }
    .backup-status { padding: 2px 6px; border-radius: 3px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .status-passed { background: #052e16; color: #86efac; }
    .status-failed { background: #450a0a; color: #fca5a5; }
    .status-warning { background: #422006; color: #fde047; }
    .backup-metrics { display: flex; gap: 16px; font-size: 11px; color: var(--text-secondary, #cbd5e1); margin-bottom: 6px; }
    .backup-details { font-size: 11px; color: var(--text-secondary, #cbd5e1); }
    .recommendations-list { display: flex; flex-direction: column; gap: 8px; }
    .recommendation-card { background: var(--bg-secondary, #1f2937); border-left: 4px solid #ef4444; border-radius: 0 6px 6px 0; padding: 10px 12px; }
    .recommendation-title { font-weight: 600; font-size: 12px; margin-bottom: 4px; color: #ef4444; }
    .recommendation-desc { font-size: 11px; color: var(--text-secondary, #cbd5e1); line-height: 1.4; }
    .priority-badge { padding: 1px 4px; border-radius: 2px; font-size: 9px; font-weight: 600; margin-left: 6px; }
    .priority-critical { background: #450a0a; color: #fca5a5; }
    .priority-high { background: #431407; color: #fdba74; }
    .priority-medium { background: #422006; color: #fde047; }
    .empty-state { text-align: center; padding: 40px 20px; color: var(--text-tertiary, #94a3b8); font-size: 14px; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
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

  @state() private _selectedSimulation: SimulationRun | null = null;
  @state() private _selectedPhaseId: string | null = null;
  @state() private _activeTab: 'impact-assessment' | 'defense-controls' | 'backup-recovery' | 'recommendations' = 'impact-assessment';
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


  private _simulations: SimulationRun[] = [
    {
      id: 'ransom-sim-2026-001',
      name: 'BlackCat/ALPHV Ransomware Simulation',
      scenario: {
        id: 'scenario-001',
        name: 'Enterprise Double Extortion Ransomware',
        description: 'Full simulation of modern double extortion ransomware attack with data exfiltration',
        ransomwareFamily: {
          id: 'family-001',
          name: 'BlackCat/ALPHV',
          aliases: ['ALPHV', 'BlackCat', 'Noberus'],
          severity: 'critical',
          characteristics: ['Rust-based', 'Double extortion', 'Triple extortion support', 'Encrypts ESXi hosts', 'File exfiltration', 'DDoS threats'],
          knownExtortionTactics: ['Data leak on public leak site', 'DDoS attacks', 'Contacting customers/partners', 'Threat of regulatory reporting']
        },
        attackVector: 'phishing',
        targetSystems: ['Windows 10 endpoints', 'Windows Server 2022', 'Linux web servers', 'ESXi hypervisors', 'NAS storage devices'],
        targetDepartments: ['Finance', 'HR', 'Engineering', 'Operations', 'Customer Support'],
        exfiltrationEnabled: true,
        doubleExtortionEnabled: true,
        tripleExtortionEnabled: true,
        lateralMovementEnabled: true
      },
      status: 'completed',
      startTime: '2026-04-20 14:00',
      endTime: '2026-04-20 16:30',
      operator: 'red-team-lead',
      attackPhases: [
        {
          id: 'phase-1',
          name: 'Initial Access',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 14:00',
          endTime: '2026-04-20 14:15',
          techniques: ['Phishing email with malicious macro attachment', 'User execution of malicious document'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Phishing email sent to 50 finance department employees, 3 users enabled macros, initial access achieved on 2 workstations.'
        },
        {
          id: 'phase-2',
          name: 'Execution',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 14:15',
          endTime: '2026-04-20 14:25',
          techniques: ['PowerShell execution', 'C2 communication established'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Malicious macro executed PowerShell download cradle, established C2 connection to attacker-controlled server, downloaded additional payloads.'
        },
        {
          id: 'phase-3',
          name: 'Persistence',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 14:25',
          endTime: '2026-04-20 14:30',
          techniques: ['Registry run keys', 'Scheduled tasks'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Persistence established via run keys and scheduled tasks to maintain access after reboots.'
        },
        {
          id: 'phase-4',
          name: 'Privilege Escalation',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 14:30',
          endTime: '2026-04-20 14:40',
          techniques: ['Local privilege escalation via CVE-2026-XXXX', 'Credential dumping from LSASS'],
          detectionStatus: 'delayed-detection',
          preventionStatus: 'not-blocked',
          details: 'Privilege escalation to local admin successful, LSASS memory dumped, 18 domain credentials recovered. Detected after 2 hours.'
        },
        {
          id: 'phase-5',
          name: 'Defense Evasion',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 14:40',
          endTime: '2026-04-20 14:50',
          techniques: ['Obfuscated payloads', 'AMSI bypass', 'EDR evasion'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Payload obfuscation successfully evaded EDR detection, no alerts generated during entire attack chain.'
        },
        {
          id: 'phase-6',
          name: 'Credential Access',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 14:50',
          endTime: '2026-04-20 15:00',
          techniques: ['Pass-the-hash', 'Domain account compromise'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Pass-the-hash used to move laterally, Domain Admin credentials obtained via compromised domain controller.'
        },
        {
          id: 'phase-7',
          name: 'Lateral Movement',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 15:00',
          endTime: '2026-04-20 15:30',
          techniques: ['SMB lateral movement', 'RDP access to servers'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Successfully moved laterally to 38 endpoints and 12 servers, including all file servers and domain controllers.'
        },
        {
          id: 'phase-8',
          name: 'Collection',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 15:30',
          endTime: '2026-04-20 15:50',
          techniques: ['Document collection', 'Database enumeration'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Collected 280GB of sensitive documents, customer data, financial records, and intellectual property.'
        },
        {
          id: 'phase-9',
          name: 'Command & Control',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 14:25',
          endTime: '2026-04-20 16:30',
          techniques: ['HTTPS C2 communication', 'Domain generation algorithm (DGA)'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: 'Persistent C2 connection maintained throughout entire attack, no network detection.'
        },
        {
          id: 'phase-10',
          name: 'Exfiltration',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 15:50',
          endTime: '2026-04-20 16:10',
          techniques: ['Encrypted data exfiltration to cloud storage'],
          detectionStatus: 'undetected',
          preventionStatus: 'not-blocked',
          details: '280GB of collected data successfully exfiltrated to attacker-controlled cloud storage via HTTPS.'
        },
        {
          id: 'phase-11',
          name: 'Impact (Encryption)',
          status: 'succeeded',
          progress: 100,
          startTime: '2026-04-20 16:10',
          endTime: '2026-04-20 16:30',
          techniques: ['Mass file encryption', 'Ransom note deployment', 'ESXi host encryption', 'Backup deletion'],
          detectionStatus: 'detected',
          preventionStatus: 'not-blocked',
          details: '12 servers and 38 endpoints encrypted, 850,000+ files encrypted, all accessible backups deleted. Ransom note deployed after encryption completed.'
        }
      ],
      impact: {
        systemsEncrypted: 50,
        totalFilesEncrypted: 850000,
        sensitiveDataExfiltrated: 280,
        estimatedDowntime: 72,
        estimatedRecoveryTime: 96,
        estimatedFinancialLoss: 12500000,
        businessProcessesAffected: ['All core business operations', 'Customer support', 'Financial systems', 'Engineering development', 'Manufacturing operations'],
        regulatoryImpact: 'GDPR breach notification required, potential fines up to 4% of global annual revenue.'
      },
      defenseControls: [
        {
          id: 'control-001',
          name: 'Email Security Gateway',
          type: 'prevention',
          effectiveness: 'ineffective',
          attackPhase: 'Initial Access',
          comments: 'Phishing email with malicious macro attachment not detected or blocked, delivered to user inboxes.'
        },
        {
          id: 'control-002',
          name: 'Endpoint Detection and Response (EDR)',
          type: 'prevention',
          effectiveness: 'ineffective',
          attackPhase: 'Execution / Defense Evasion',
          comments: 'Malicious macro execution, PowerShell activity, and payload obfuscation completely undetected. No prevention actions taken.'
        },
        {
          id: 'control-003',
          name: 'Privilege Access Management (PAM)',
          type: 'prevention',
          effectiveness: 'not-tested',
          attackPhase: 'Privilege Escalation',
          comments: 'PAM not implemented for domain admin accounts, allowing unfettered privileged access.'
        },
        {
          id: 'control-004',
          name: 'Network Detection and Response (NDR)',
          type: 'detection',
          effectiveness: 'ineffective',
          attackPhase: 'C2 / Exfiltration',
          comments: 'C2 communication and 280GB data exfiltration completely undetected by network security monitoring.'
        },
        {
          id: 'control-005',
          name: 'SIEM Correlation Rules',
          type: 'detection',
          effectiveness: 'partially-effective',
          attackPhase: 'Privilege Escalation / Encryption',
          comments: 'LSASS credential dumping detected after 2 hour delay. Mass file encryption activity detected immediately at impact phase.'
        },
        {
          id: 'control-006',
          name: 'Zero Trust Microsegmentation',
          type: 'prevention',
          effectiveness: 'ineffective',
          attackPhase: 'Lateral Movement',
          comments: 'Lateral movement unrestricted, no network segmentation between endpoints and critical servers.'
        },
        {
          id: 'control-007',
          name: 'Backup Protection',
          type: 'recovery',
          effectiveness: 'ineffective',
          attackPhase: 'Impact',
          comments: 'All online backups connected to domain, accessible to attackers and deleted during attack.'
        }
      ],
      backupTests: [
        {
          id: 'backup-001',
          name: 'Primary File Server Backup',
          type: 'full-backup',
          status: 'failed',
          recoveryTime: 0,
          dataLoss: 120,
          integrityVerified: false,
          details: 'All primary backups were connected to domain and deleted during attack. No usable backup available.'
        },
        {
          id: 'backup-002',
          name: 'Offline Air-Gapped Backup',
          type: 'offline-backup',
          status: 'passed',
          recoveryTime: 72,
          dataLoss: 24,
          integrityVerified: true,
          details: 'Offline air-gapped backup intact, contains data up to 24 hours before attack. Full recovery estimated to take 72 hours.'
        },
        {
          id: 'backup-003',
          name: 'Cloud Object Storage Backup',
          type: 'cloud-backup',
          status: 'warning',
          recoveryTime: 12,
          dataLoss: 6,
          integrityVerified: true,
          details: 'Cloud backup intact, but immutable backup configuration misconfigured, allowing partial deletion. 6 hours of data lost.'
        },
        {
          id: 'backup-004',
          name: 'Virtual Machine Hypervisor Backup',
          type: 'incremental-backup',
          status: 'failed',
          recoveryTime: 0,
          dataLoss: 24,
          integrityVerified: false,
          details: 'ESXi hypervisor backups encrypted by ransomware, no usable VM backups available.'
        }
      ],
      summary: {
        overallResilienceScore: 22,
        preventionEffectiveness: 10,
        detectionEffectiveness: 25,
        responseEffectiveness: 30,
        recoveryEffectiveness: 45,
        gapsIdentified: 12,
        recommendations: [
          'Implement macro blocking for all Office documents from external senders',
          'Deploy advanced EDR with behavior-based ransomware prevention capabilities',
          'Implement zero-trust network segmentation to prevent lateral movement between endpoints and critical servers',
          'Implement offline air-gapped backups with 3-2-1 backup strategy, regular recovery testing',
          'Enable immutable storage for cloud backups, restrict backup access with MFA and least privilege',
          'Tune SIEM correlation rules to detect ransomware TTPs in real-time',
          'Implement Privileged Access Management (PAM) for all admin and service accounts',
          'Deploy Network Detection and Response (NDR) to detect C2 and data exfiltration activity',
          'Develop and test ransomware incident response plan, regular tabletop exercises',
          'Implement email security with anti-phishing, URL rewriting, and attachment sandboxing'
        ]
      }
    }
  ];

  constructor() {
    super();
    this._selectedSimulation = this._simulations[0];
    const lastPhase = this._selectedSimulation.attackPhases[this._selectedSimulation.attackPhases.length - 1];
    this._selectedPhaseId = lastPhase.id;
  }

  private _getPhaseColor(phase: AttackPhase): string {
    switch (phase.status) {
      case 'succeeded': return '#ef4444';
      case 'blocked': return '#22c55e';
      case 'detected': return '#3b82f6';
      case 'failed': return '#6b7280';
      case 'in-progress': return '#f97316';
      default: return '#6b7280';
    }
  }

  private _getScoreClass(score: number): string {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'average';
    if (score >= 30) return 'poor';
    return 'bad';
  }

  private _getImpactSeverity(value: number, thresholdHigh: number, thresholdCritical: number): 'low' | 'medium' | 'high' | 'critical' {
    if (value >= thresholdCritical) return 'critical';
    if (value >= thresholdHigh) return 'high';
    if (value > 0) return 'medium';
    return 'low';
  }

  private _getPriorityForRecommendation(index: number, total: number): 'critical' | 'high' | 'medium' {
    const third = Math.ceil(total / 3);
    if (index < third) return 'critical';
    if (index < 2 * third) return 'high';
    return 'medium';
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
          <span style="padding:2px 6px;border-radius:3px;font-size:9px;font-weight:600;background:${((({scan:'#3b82f6',review:'#f59e0b',config:'#8b5cf6',export:'#22c55e'}) as any)[e.category]) || '#374151'}20;color:${((({scan:'#60a5fa',review:'#fbbf24',config:'#a78bfa',export:'#34d399'}) as any)[e.category]) || '#9ca3af'}">${e.category}</span>
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
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Auto-scan Interval</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="168" .value=${String(this._autoInterval)} @input=${(e: Event) => { this._autoInterval = parseInt((e.target as HTMLInputElement).value); }} style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._autoInterval}h</span></div></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">SLA Target</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="720" .value=${String(this._slaTargetHours)} @input=${(e: Event) => { this._slaTargetHours = parseInt((e.target as HTMLInputElement).value); }} style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._slaTargetHours}h</span></div></div>
      </div>` : nothing}
      ${this._settingsTab === 'thresholds' ? html`<div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Critical Threshold</div><div style="display:flex;align-items:center;gap:10px"><input type="range" min="1" max="20" .value=${String(this._criticalThreshold)} @input=${(e: Event) => { this._criticalThreshold = parseInt((e.target as HTMLInputElement).value); }} style="flex:1;accent-color:#8b5cf6;background:transparent;border:none"><span style="font-weight:700;color:#8b5cf6;min-width:40px;text-align:right;font-size:13px">${this._criticalThreshold}</span></div></div>` : nothing}
      ${this._settingsTab === 'integrations' ? html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Escalation Email</div><input type="email" .value=${this._escalationEmail} @input=${(e: Event) => { this._escalationEmail = (e.target as HTMLInputElement).value; }} style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
        <div><div style="font-size:11px;color:#94a3b8;margin-bottom:4px">Webhook URL</div><input type="url" .value=${this._webhookUrl} @input=${(e: Event) => { this._webhookUrl = (e.target as HTMLInputElement).value; }} style="background:#0f172a;border:1px solid #374151;border-radius:6px;padding:8px;color:#e2e8f0;font-size:12px;width:100%"></div>
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
    const data = this._items.slice(0, 10).map((item: any, i: number) => ({ name: (item.name || item.title || item.id || 'Item ' + i).substring(0, 8), score: ({critical: 10, high: 7, medium: 4, low: 1} as any)[item.severity] || 2, risk: item.severity || 'medium' }));
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



  // --- Domain Rules Engine ---
  @state() private _rsimRules: { id: string; name: string; category: string; severity: Severity; enabled: boolean; lastEval: string; passRate: number }[] = [];
  private _initRsimRules() {
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
    this._rsimRules = rules;
  }
  private _evaluateRsimRules(): { passed: number; failed: number; skipped: number; total: number } {
    let passed = 0, failed = 0, skipped = 0;
    this._rsimRules.forEach(r => { if (!r.enabled) { skipped++; } else if (r.passRate >= 80) { passed++; } else { failed++; } });
    return { passed, failed, skipped, total: this._rsimRules.length };
  }

  // --- CVSS Scoring ---
  @state() private _rsimcvssData: { itemId: string; vector: string; base: number; temporal: number; environmental: number; overall: number }[] = [];
  private _initRsimCvss() {
    const vectors = ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:A/AC:H/PR:L/UI:R/S:C/C:L/I:L/A:N', 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N', 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:N/I:L/A:N'];
    this._rsimcvssData = vectors.map((v, i) => {
      const base = parseFloat((Math.random() * 6 + 3).toFixed(1));
      const temporal = parseFloat((base * (0.7 + Math.random() * 0.3)).toFixed(1));
      const environmental = parseFloat((temporal * (0.8 + Math.random() * 0.2)).toFixed(1));
      return { itemId: 'V-' + String(i + 1).padStart(3, '0'), vector: v, base, temporal, environmental, overall: environmental };
    });
  }

  // --- Anomaly Detection ---
  @state() private _rsimanomalies: { id: string; type: string; severity: Severity; description: string; detected: string; confidence: number; affected: string[] }[] = [];
  private _runRsimAnomalyDetection() {
    const types = [
      { type: 'Spike in violation rate', severity: 'high' as Severity, desc: 'Detected 280% increase in violations over the last 24 hours', affected: ['Core', 'Operations'] },
      { type: 'SLA breach pattern', severity: 'critical' as Severity, desc: 'Recurring SLA breaches on weekends indicating staffing gaps', affected: ['SLA', 'Staffing'] },
      { type: 'Baseline drift detected', severity: 'medium' as Severity, desc: 'Score drifted 10 points below established baseline over 7 days', affected: ['Metrics', 'Baseline'] },
      { type: 'Unusual escalation volume', severity: 'high' as Severity, desc: 'Escalation rate 2.5x above normal in infrastructure controls', affected: ['Infrastructure', 'Controls'] },
      { type: 'Stale findings accumulation', severity: 'low' as Severity, desc: '18 findings older than 90 days without status change', affected: ['Maintenance'] },
    ];
    this._rsimanomalies = types.map((a, i) => ({
      id: 'ANO-' + String(i + 1).padStart(3, '0'), type: a.type, severity: a.severity,
      description: a.desc, detected: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(2)), affected: a.affected,
    }));
  }

  // --- Trend Prediction ---
  @state() private _rsimpredictions: { horizon: string; metric: string; current: number; predicted: number; direction: 'up' | 'down' | 'stable'; confidence: number }[] = [];
  private _generateRsimPredictions() {
    this._rsimpredictions = [
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
  @state() private _rsimApprovals: { id: string; title: string; requester: string; status: 'pending' | 'approved' | 'rejected' | 'expired'; createdAt: string; priority: Priority; type: string }[] = [];
  private _initRsimApprovals() {
    this._rsimApprovals = [
      { id: 'APR-001', title: 'Emergency exception request for critical finding', requester: 'Alice Chen', status: 'pending', createdAt: '2026-04-23T07:00:00Z', priority: 'p1', type: 'Exception' },
      { id: 'APR-002', title: 'Extend compliance deadline for quarterly audit', requester: 'Bob Martinez', status: 'pending', createdAt: '2026-04-22T18:00:00Z', priority: 'p2', type: 'Extension' },
      { id: 'APR-003', title: 'Disable security control for system migration', requester: 'Carol Wu', status: 'rejected', createdAt: '2026-04-22T14:00:00Z', priority: 'p1', type: 'Policy Change' },
      { id: 'APR-004', title: 'New assessment approval for third-party vendor', requester: 'Dave Kim', status: 'approved', createdAt: '2026-04-21T10:00:00Z', priority: 'p3', type: 'Vendor' },
      { id: 'APR-005', title: 'Network rule change for partner integration', requester: 'Eve Johnson', status: 'expired', createdAt: '2026-04-19T08:00:00Z', priority: 'p2', type: 'Network' },
    ];
  }
  private _approveRsimItem(id: string) { const item = this._rsimApprovals.find(a => a.id === id); if (item) item.status = 'approved'; this.requestUpdate(); }
  private _rejectRsimItem(id: string) { const item = this._rsimApprovals.find(a => a.id === id); if (item) item.status = 'rejected'; this.requestUpdate(); }

  // --- Activity Feed ---
  @state() private _rsimActivity: { id: string; action: string; user: string; target: string; timestamp: string }[] = [];
  private _initRsimActivity() {
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
    this._rsimActivity = actions.map((a, i) => ({ id: 'ACT-' + String(i + 1).padStart(3, '0'), ...a, timestamp: new Date(Date.now() - i * 3600000).toISOString() }));
  }

  // --- Notification System ---
  @state() private _rsimNotifications: { id: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; read: boolean; timestamp: string }[] = [];
  private _initRsimNotifications() {
    this._rsimNotifications = [
      { id: 'NTF-001', message: 'Score dropped below threshold', type: 'warning', read: false, timestamp: new Date().toISOString() },
      { id: 'NTF-002', message: '3 items approaching SLA deadline within 24h', type: 'error', read: false, timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: 'NTF-003', message: 'Weekly report generated successfully', type: 'success', read: true, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'NTF-004', message: 'New framework mapped to existing controls', type: 'info', read: true, timestamp: new Date(Date.now() - 14400000).toISOString() },
    ];
  }
  private _markRsimNotifRead(id: string) { const n = this._rsimNotifications.find(x => x.id === id); if (n) n.read = true; this.requestUpdate(); }

  // --- Panel Configuration ---
  @state() private _rsimConfig: { layout: 'compact' | 'default' | 'expanded'; theme: 'dark' | 'midnight' | 'slate'; showAnomalies: boolean; showPredictions: boolean; autoRefresh: boolean; refreshInterval: number } = {
    layout: 'default', theme: 'dark', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60,
  };
  private _rsimPresets: { name: string; config: typeof this._rsimConfig }[] = [
    { name: 'Analyst View', config: { layout: 'expanded', theme: 'dark', showAnomalies: true, showPredictions: false, autoRefresh: true, refreshInterval: 30 } },
    { name: 'Executive Summary', config: { layout: 'compact', theme: 'slate', showAnomalies: false, showPredictions: true, autoRefresh: false, refreshInterval: 300 } },
    { name: 'Audit Mode', config: { layout: 'expanded', theme: 'midnight', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60 } },
  ];
  private _applyRsimPreset(preset: typeof this._rsimPresets[0]) { this._rsimConfig = { ...preset.config }; this.requestUpdate(); }

  private _renderRsimTreemapSVG(): string {
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

  private _renderRsimSankeySVG(): string {
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
  private _renderRsimRules(): any {
    const ev = this._evaluateRsimRules();
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
          $${this._rsimRules.map(r => html`
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
  private _renderRsimAnomalies(): any {
    const sc = (s: Severity) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Anomaly Detection</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._rsimanomalies.map(a => html`
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
  private _renderRsimPredictions(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Trend Predictions</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          $${this._rsimpredictions.map(pr => html`
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
  private _renderRsimApprovals(): any {
    const stc = (s: string) => s === 'pending' ? '#eab308' : s === 'approved' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#6b7280';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Approval Workflow</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._rsimApprovals.map(a => html`
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
                  <button class="btn success" style="padding:2px 8px;font-size:9px" @click=$${() => this._approveRsimItem(a.id)}>Approve</button>
                  <button class="btn error" style="padding:2px 8px;font-size:9px" @click=$${() => this._rejectRsimItem(a.id)}>Reject</button>
                </div>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Activity Feed ---
  private _renderRsimActivity(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Activity Feed</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto">
          $${this._rsimActivity.map(a => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <div style="width:20px;height:20px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;font-size:9px">•</div>
              <div style="flex:1"><span style="font-weight:600">$${a.user}</span> $${a.action}</div>
              <span style="font-size:8px;color:#6b7280">$${new Date(a.timestamp).toLocaleTimeString()}</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Notifications ---
  private _renderRsimNotifications(): any {
    const tc = (t: string) => t === 'error' ? '#ef4444' : t === 'warning' ? '#eab308' : t === 'success' ? '#22c55e' : '#3b82f6';
    const unread = this._rsimNotifications.filter(n => !n.read).length;
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Notifications $${unread > 0 ? html`<span class="badge badge-error">$${unread} new</span>` : nothing}</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:120px;overflow-y:auto">
          $${this._rsimNotifications.map(n => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:$${n.read ? '#1f2937' : '#252a36'};border-radius:4px;font-size:10px;opacity:$${n.read ? '0.6' : '1'};cursor:pointer" @click=$${() => this._markRsimNotifRead(n.id)}>
              <span style="width:8px;height:8px;border-radius:50%;background:$${tc(n.type)}"></span>
              <span style="flex:1">$${n.message}</span>
              $${!n.read ? html`<span style="width:6px;height:6px;border-radius:50%;background:#3b82f6"></span>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Panel Config ---
  private _renderRsimConfig(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Panel Configuration</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Layout</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._rsimConfig.layout = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="compact" ?selected=$${this._rsimConfig.layout === 'compact'}>Compact</option>
              <option value="default" ?selected=$${this._rsimConfig.layout === 'default'}>Default</option>
              <option value="expanded" ?selected=$${this._rsimConfig.layout === 'expanded'}>Expanded</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Theme</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._rsimConfig.theme = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="dark" ?selected=$${this._rsimConfig.theme === 'dark'}>Dark</option>
              <option value="midnight" ?selected=$${this._rsimConfig.theme === 'midnight'}>Midnight</option>
              <option value="slate" ?selected=$${this._rsimConfig.theme === 'slate'}>Slate</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Auto Refresh</span>
            <input type="checkbox" ?checked=$${this._rsimConfig.autoRefresh} @change=$${() => { this._rsimConfig.autoRefresh = !this._rsimConfig.autoRefresh; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Anomalies</span>
            <input type="checkbox" ?checked=$${this._rsimConfig.showAnomalies} @change=$${() => { this._rsimConfig.showAnomalies = !this._rsimConfig.showAnomalies; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Predictions</span>
            <input type="checkbox" ?checked=$${this._rsimConfig.showPredictions} @change=$${() => { this._rsimConfig.showPredictions = !this._rsimConfig.showPredictions; this.requestUpdate(); }}/>
          </div>
          <div style="margin-top:6px;font-weight:600">Presets</div>
          <div style="display:flex;gap:4px">
            $${this._rsimPresets.map(ps => html`<button class="btn" style="padding:2px 8px;font-size:9px" @click=$${() => this._applyRsimPreset(ps)}>$${ps.name}</button>`)}
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



  // === Round 17: Risk Quantification Framework ===
  @state() private _rsFairModel: any = null;
  @state() private _rsRiskHeatMap: any = null;
  @state() private _rsRiskAppetite: any = null;
  @state() private _rsMonteCarlo: any = null;
  @state() private _rsRiskRegister: any = null;
  @state() private _rsRiskTrend: any = null;

  private rsInitRiskQuant() {
    this._rsFairModel = {
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
    this._rsRiskHeatMap = ((): any[] => {
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
    this._rsRiskAppetite = {
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
    this._rsMonteCarlo = ((): any[] => {
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
    this._rsRiskRegister = [
      { id: "RSK-001", name: "Credential Stuffing", owner: "IAM Team", likelihood: 4, impact: 3, score: 12, status: "Mitigating", trend: "improving" },
      { id: "RSK-002", name: "Cloud Data Exposure", owner: "Cloud Sec", likelihood: 3, impact: 5, score: 15, status: "Open", trend: "stable" },
      { id: "RSK-003", name: "Third-Party Breach", owner: "GRC Team", likelihood: 3, impact: 4, score: 12, status: "Mitigating", trend: "worsening" },
      { id: "RSK-004", name: "Insider Data Theft", owner: "HR + SecOps", likelihood: 2, impact: 4, score: 8, status: "Monitoring", trend: "stable" },
      { id: "RSK-005", name: "Ransomware", owner: "SecOps", likelihood: 4, impact: 5, score: 20, status: "Mitigating", trend: "improving" },
      { id: "RSK-006", name: "API Security Flaw", owner: "AppSec", likelihood: 3, impact: 3, score: 9, status: "Open", trend: "worsening" },
      { id: "RSK-007", name: "Compliance Violation", owner: "GRC Team", likelihood: 2, impact: 5, score: 10, status: "Mitigating", trend: "improving" },
      { id: "RSK-008", name: "Social Engineering", owner: "SecAwareness", likelihood: 5, impact: 2, score: 10, status: "Monitoring", trend: "stable" }
    ];
    this._rsRiskTrend = [
      { month: "Oct", critical: 3, high: 8, medium: 15, low: 22 },
      { month: "Nov", critical: 2, high: 7, medium: 14, low: 24 },
      { month: "Dec", critical: 4, high: 9, medium: 16, low: 20 },
      { month: "Jan", critical: 3, high: 8, medium: 13, low: 21 },
      { month: "Feb", critical: 2, high: 6, medium: 12, low: 23 },
      { month: "Mar", critical: 1, high: 5, medium: 11, low: 25 }
    ];
  }

  private rsRenderRiskQuant() {
    const fm = this._rsFairModel;
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
          ${this._rsRiskHeatMap.map((c: any) => html`<div style="background:${c.color}22;border:1px solid ${c.color}44;border-radius:2px;padding:3px;text-align:center;color:${c.color}">
              <div>${c.score}</div>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Monte Carlo Simulation (20 iterations)</div>
            ${this._rsMonteCarlo.slice(0, 10).map((r: any) => html`<div style="display:flex;gap:4px;font-size:8px;margin-bottom:1px">
                <span style="color:#888;width:20px">#${r.iteration}</span>
                <div style="flex:1;background:#1a1d27;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(r.loss / 8000000) * 100}%;background:${r.loss > 5000000 ? "#f44" : r.loss > 3000000 ? "#f84" : "#4caf50"}"></div>
                </div>
                <span style="color:#ccc;width:40px;text-align:right">${fmt(r.loss)}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Risk Register (Top 8)</div>
            ${this._rsRiskRegister.map((r: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
                <span style="color:${sevColor(r.score)};font-weight:bold;width:16px">${r.score}</span>
                <span style="color:#ccc;flex:1">${r.name}</span>
                <span style="color:${r.trend === "improving" ? "#4caf50" : r.trend === "worsening" ? "#f44" : "#888"};font-size:7px">${r.trend}</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:8px 0 4px">Risk Trend (6 months)</div>
        <div style="display:flex;gap:4px;align-items:flex-end;height:50px">
          ${this._rsRiskTrend.map((t: any) => html`<div style="flex:1;display:flex;flex-direction:column;gap:1px;align-items:center">
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
  @state() private _rsOkrs: any = null;
  @state() private _rsInitiatives: any = null;
  @state() private _rsResourceAlloc: any = null;
  @state() private _rsHeadcount: any = null;
  @state() private _rsMilestones: any = null;
  @state() private _rsBudget: any = null;

  private rsInitSecProgram() {
    this._rsOkrs = [
      { objective: "Reduce Mean Time to Detect", keyResults: [{ kr: "MTTD < 24 hours", progress: 72 }, { kr: "Deploy EDR to 100% endpoints", progress: 89 }, { kr: "SIEM coverage 95%+", progress: 81 }], overallProgress: 81 },
      { objective: "Eliminate Critical Vulnerabilities in 7 days", keyResults: [{ kr: "Patch SLA compliance > 95%", progress: 67 }, { kr: "Zero critical vulns > 30 days", progress: 45 }, { kr: "Automated patching 80%+", progress: 58 }], overallProgress: 57 },
      { objective: "Achieve Zero Trust Architecture", keyResults: [{ kr: "Micro-segment 90% workloads", progress: 63 }, { kr: "ZTNA adoption 100%", progress: 78 }, { kr: "Continuous verification deployed", progress: 54 }], overallProgress: 65 },
      { objective: "Build Security-First Culture", keyResults: [{ kr: "Phishing click rate < 3%", progress: 85 }, { kr: "Security training 100%", progress: 92 }, { kr: "DevSecOps maturity L3+", progress: 48 }], overallProgress: 75 }
    ];
    this._rsInitiatives = [
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
    this._rsResourceAlloc = [
      { domain: "Security Operations", allocated: 35, used: 31, budget: 2800000 },
      { domain: "Identity & Access", allocated: 12, used: 11, budget: 960000 },
      { domain: "Application Security", allocated: 10, used: 8, budget: 800000 },
      { domain: "Cloud Security", allocated: 8, used: 9, budget: 640000 },
      { domain: "GRC & Compliance", allocated: 8, used: 7, budget: 640000 },
      { domain: "Threat Intelligence", allocated: 5, used: 4, budget: 400000 },
      { domain: "Security Engineering", allocated: 7, used: 6, budget: 560000 }
    ];
    this._rsHeadcount = {
      total: 85, filled: 72, open: 13, budget: 10200000,
      byLevel: [{ level: "L3 (Senior)", count: 28, target: 32 }, { level: "L4 (Staff)", count: 18, target: 20 }, { level: "L5 (Principal)", count: 8, target: 10 }, { level: "L2 (Mid)", count: 14, target: 15 }, { level: "L1 (Junior)", count: 4, target: 8 }],
      criticalRoles: ["Cloud Security Architect", "Senior Threat Hunter", "AppSec Engineer", "SOC Analyst L2"]
    };
    this._rsMilestones = [
      { initiative: "Zero Trust", milestone: "Micro-seg Phase 2 complete", due: "2026-03-31", status: "On Track", rag: "green" },
      { initiative: "SOC Mod", milestone: "SOAR platform deployed", due: "2026-04-15", status: "At Risk", rag: "amber" },
      { initiative: "Cloud Sec", milestone: "CSPM full coverage", due: "2026-05-01", status: "Behind", rag: "red" },
      { initiative: "AppSec", milestone: "SAST in all CI/CD", due: "2026-06-30", status: "On Track", rag: "green" },
      { initiative: "IAM", milestone: "PAM deployment complete", due: "2026-04-30", status: "Delayed", rag: "red" },
      { initiative: "Automation", milestone: "50% alert triage automated", due: "2026-05-15", status: "On Track", rag: "green" }
    ];
    this._rsBudget = {
      total: 10200000, allocated: 9650000, spent: 5480000, remaining: 4170000,
      quarterly: [{ q: "Q1", allocated: 2412500, spent: 2412500 }, { q: "Q2", allocated: 2412500, spent: 1950000 }, { q: "Q3", allocated: 2412500, spent: 1117500 }, { q: "Q4", allocated: 2412500, spent: 0 }],
      byCategory: [{ cat: "Personnel", pct: 68 }, { cat: "Tools & Licenses", pct: 18 }, { cat: "Services", pct: 9 }, { cat: "Training", pct: 5 }]
    };
  }

  private rsRenderSecProgram() {
    const okrs = this._rsOkrs;
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
          ${this._rsInitiatives.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
              <span style="color:${i.priority === "P0" ? "#f44" : i.priority === "P1" ? "#f84" : "#888"};font-weight:bold;width:16px">${i.priority}</span>
              <span style="color:#ccc;flex:1">${i.name}</span>
              <span style="color:${statusColor(i.status)};width:50px">${i.status}</span>
              <span style="color:#888;width:24px;text-align:right">${i.completion}%</span>
            </div>`)}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Resource Allocation</div>
            ${this._rsResourceAlloc.slice(0, 5).map((r: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:90px">${r.domain}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(r.used / r.allocated) * 100}%;background:${r.used > r.allocated ? "#f44" : "#48f"}"></div>
                </div>
                <span style="color:#888">${r.used}/${r.allocated}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Budget Utilization</div>
            <div style="font-size:9px;color:#ccc;margin-bottom:4px">Total: ${fmt(this._rsBudget.total)} | Spent: ${fmt(this._rsBudget.spent)}</div>
            ${this._rsBudget.quarterly.map((q: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#888;width:16px">${q.q}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(q.spent / q.allocated) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#aaa">${fmt(q.spent)}</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">Milestone Tracker</div>
        ${this._rsMilestones.map((m: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <div style="width:6px;height:6px;border-radius:50%;background:${ragColor(m.rag)}"></div>
            <span style="color:#ccc;width:60px">${m.initiative}</span>
            <span style="color:#bbb;flex:1">${m.milestone}</span>
            <span style="color:#888">${m.due}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Third-Party Risk Assessment ===
  @state() private _rsVendorTiers: any = null;
  @state() private _rsDueDiligence: any = null;
  @state() private _rsContractClauses: any = null;
  @state() private _rsVendorScorecard: any = null;
  @state() private _rsSubProcessors: any = null;
  @state() private _rsVendorIncidents: any = null;

  private rsInitThirdParty() {
    this._rsVendorTiers = [
      { tier: "Critical", count: 8, vendors: ["AWS", "Azure AD", "CrowdStrike", "Okta", "ServiceNow", "Salesforce", "Workday", "Datadog"] },
      { tier: "High", count: 14, vendors: ["Slack", "GitHub", "Jenkins", "Terraform", "Artifactory", "Snyk", "Palo Alto", "Zscaler"] },
      { tier: "Medium", count: 32, vendors: ["Figma", "Confluence", "Zoom", "Dropbox", "Notion", "Linear"] },
      { tier: "Low", count: 67, vendors: ["Various SaaS tools", "Utilities", "Dev tools"] }
    ];
    this._rsDueDiligence = [
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
    this._rsContractClauses = [
      { clause: "Data Breach Notification", vendors: 98, compliant: 89, gap: 9 },
      { clause: "Right to Audit", vendors: 85, compliant: 72, gap: 13 },
      { clause: "Data Return on Termination", vendors: 92, compliant: 78, gap: 14 },
      { clause: "Liability Cap", vendors: 90, compliant: 65, gap: 25 },
      { clause: "Sub-processor Restrictions", vendors: 88, compliant: 80, gap: 8 },
      { clause: "Encryption Requirements", vendors: 95, compliant: 91, gap: 4 },
      { clause: "Incident Response SLA", vendors: 86, compliant: 74, gap: 12 },
      { clause: "Data Residency", vendors: 78, compliant: 62, gap: 16 }
    ];
    this._rsVendorScorecard = [
      { vendor: "AWS", security: 92, compliance: 95, reliability: 98, risk: "Low", overall: 95 },
      { vendor: "CrowdStrike", security: 94, compliance: 90, reliability: 96, risk: "Low", overall: 93 },
      { vendor: "Okta", security: 85, compliance: 92, reliability: 90, risk: "Low", overall: 89 },
      { vendor: "GitHub", security: 82, compliance: 78, reliability: 94, risk: "Medium", overall: 85 },
      { vendor: "Slack", security: 78, compliance: 80, reliability: 92, risk: "Medium", overall: 83 },
      { vendor: "Figma", security: 75, compliance: 72, reliability: 88, risk: "Medium", overall: 78 },
      { vendor: "Linear", security: 70, compliance: 65, reliability: 90, risk: "Medium", overall: 75 },
      { vendor: "StartupAI Inc", security: 55, compliance: 48, reliability: 72, risk: "High", overall: 58 }
    ];
    this._rsSubProcessors = [
      { vendor: "AWS", subProcessors: ["CloudFront", "S3 (US-East)", "DynamoDB", "Lambda"], reviewed: "2026-01" },
      { vendor: "CrowdStrike", subProcessors: ["AWS (hosting)", "Snowflake (analytics)"], reviewed: "2026-02" },
      { vendor: "Okta", subProcessors: ["AWS", "MongoDB Atlas"], reviewed: "2026-01" },
      { vendor: "Salesforce", subProcessors: ["AWS", "Heroku", "MuleSoft"], reviewed: "2025-11" },
      { vendor: "Datadog", subProcessors: ["GCP", "AWS"], reviewed: "2026-03" }
    ];
    this._rsVendorIncidents = [
      { vendor: "Okta", date: "2026-01-15", severity: "Medium", description: "Support access breach", resolved: true, ourImpact: "None" },
      { vendor: "Cloudflare", date: "2026-02-20", severity: "Low", description: "Config exposure", resolved: true, ourImpact: "Minimal" },
      { vendor: "GitHub", date: "2026-03-05", severity: "Low", description: "Dependency confusion", resolved: true, ourImpact: "None" },
      { vendor: "StartupAI Inc", date: "2026-03-18", severity: "High", description: "Data exposure incident", resolved: false, ourImpact: "Under review" }
    ];
  }

  private rsRenderThirdParty() {
    const tiers = this._rsVendorTiers;
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
            ${this._rsDueDiligence.slice(0, 8).map((d: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
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
            ${this._rsContractClauses.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;flex:1">${c.clause}</span>
                <span style="color:${c.gap > 15 ? "#f44" : c.gap > 8 ? "#f84" : "#4caf50"};width:28px;text-align:right">${c.gap} gap</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">Vendor Security Scorecard</div>
        ${this._rsVendorScorecard.map((v: any) => html`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;font-size:8px">
            <span style="color:#ccc;width:80px;flex-shrink:0">${v.vendor}</span>
            <div style="display:flex;gap:2px;flex:1">
              <div title="Security" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.security}%;background:#48f"></div></div>
              <div title="Compliance" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.compliance}%;background:#4caf50"></div></div>
              <div title="Reliability" style="width:30px;background:#111;border-radius:2px;height:6px;overflow:hidden"><div style="height:100%;width:${v.reliability}%;background:#ff9800"></div></div>
            </div>
            <span style="color:${tierColor(v.risk)};font-weight:bold;width:40px;text-align:right">${v.overall}</span>
          </div>`)}
        <div style="color:#aaa;font-size:10px;margin:8px 0 4px">Vendor Incidents (Recent)</div>
        ${this._rsVendorIncidents.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <div style="width:6px;height:6px;border-radius:50%;background:${sevColor(i.severity)}"></div>
            <span style="color:#ccc;width:70px">${i.vendor}</span>
            <span style="color:#bbb;flex:1">${i.description}</span>
            <span style="color:${i.resolved ? "#4caf50" : "#f44"}">${i.resolved ? "Resolved" : "Open"}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Data Loss Prevention ===
  @state() private _rsDlpRules: any = null;
  @state() private _rsDataMovement: any = null;
  @state() private _rsDataDiscovery: any = null;
  @state() private _rsDlpIncidents: any = null;
  @state() private _rsEncryptionMatrix: any = null;

  private rsInitDLP() {
    this._rsDlpRules = [
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
    this._rsDataMovement = {
      totalEvents: 15847, monitored: 12456, blocked: 1533, allowed: 10923,
      byChannel: [{ channel: "Email", events: 5234, blocked: 892 }, { channel: "Cloud Upload", events: 4123, blocked: 345 }, { channel: "USB", events: 1234, blocked: 198 }, { channel: "Network", events: 3890, blocked: 67 }, { channel: "Print", events: 1366, blocked: 31 }],
      bySensitivity: [{ level: "Confidential", pct: 35 }, { level: "Internal", pct: 45 }, { level: "Public", pct: 20 }]
    };
    this._rsDataDiscovery = [
      { location: "SharePoint", total: 245000, sensitive: 12300, unclassified: 45000, lastScan: "2026-04-20" },
      { location: "S3 Buckets", total: 189000, sensitive: 8900, unclassified: 32000, lastScan: "2026-04-21" },
      { location: "Database Servers", total: 3400, sensitive: 2100, unclassified: 800, lastScan: "2026-04-19" },
      { location: "File Shares", total: 156000, sensitive: 6700, unclassified: 28000, lastScan: "2026-04-18" },
      { location: "Endpoints", total: 89000, sensitive: 3400, unclassified: 15000, lastScan: "2026-04-21" }
    ];
    this._rsDlpIncidents = [
      { id: "DLP-001", type: "PII Exposure", status: "Resolved", severity: "Critical", assignee: "SecOps", time: "2h" },
      { id: "DLP-002", type: "Source Code Leak", status: "Investigating", severity: "High", assignee: "AppSec", time: "4h" },
      { id: "DLP-003", type: "Credential Commit", status: "Resolved", severity: "High", assignee: "DevSecOps", time: "1h" },
      { id: "DLP-004", type: "Bulk Export", status: "Monitoring", severity: "Medium", assignee: "SOC", time: "8h" },
      { id: "DLP-005", type: "API Key in Log", status: "Resolved", severity: "Medium", assignee: "SecOps", time: "30m" }
    ];
    this._rsEncryptionMatrix = [
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

  private rsRenderDLP() {
    const rules = this._rsDlpRules;
    if (!rules) return nothing;
    const sevColor = (s: string) => s === "Critical" ? "#f44" : s === "High" ? "#f84" : "#ff8";
    const statusColor = (s: string) => s === "Resolved" ? "#4caf50" : s === "Investigating" ? "#f84" : "#ff8";
    return html`<div class="card" style="padding:14px;margin-bottom:8px">
        <h4 style="margin:0 0 10px;color:#e0e0e0;font-size:13px">Data Loss Prevention</h4>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
          ${[["Monitored",this._rsDataMovement.monitored.toLocaleString(),"#48f"],["Blocked",this._rsDataMovement.blocked.toLocaleString(),"#f44"],["Rules",rules.length,"#ff8"],["Incidents",this._rsDlpIncidents.length,"#f84"]].map(([l,v,c]) => html`<div style="background:#1a1d27;border-radius:4px;padding:6px;text-align:center">
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
            ${this._rsDataMovement.byChannel.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:60px">${c.channel}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(c.events / 5500) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#888;width:30px;text-align:right">${c.blocked}</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Encryption Coverage</div>
            ${this._rsEncryptionMatrix.map((e: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:60px">${e.data}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${e.coverage}%;background:${e.coverage >= 95 ? "#4caf50" : e.coverage >= 85 ? "#ff9800" : "#f44"}"></div>
                </div>
                <span style="color:#888;width:28px;text-align:right">${e.coverage}%</span>
              </div>`)}
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin:6px 0 4px">DLP Incident Response</div>
        ${this._rsDlpIncidents.map((i: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <span style="color:${statusColor(i.status)};width:70px">${i.status}</span>
            <span style="color:#ccc;flex:1">${i.type}</span>
            <span style="color:${sevColor(i.severity)}">${i.severity}</span>
            <span style="color:#888">${i.time}</span>
          </div>`)}
      </div>`;
  }

  // === Round 17: Security Automation Metrics ===
  @state() private _rsAutoMetrics: any = null;
  @state() private _rsAutoTimeSaved: any = null;
  @state() private _rsAutoReliability: any = null;
  @state() private _rsAutoComparison: any = null;
  @state() private _rsAutoROI: any = null;
  @state() private _rsAutoCandidates: any = null;

  private rsInitAutomation() {
    this._rsAutoMetrics = {
      totalPlaybooks: 48, activePlaybooks: 42, triggered: 12847, successful: 12156, failed: 691,
      coverage: 67, targetCoverage: 85, mttrReduction: 58, falsePositiveRate: 3.2
    };
    this._rsAutoTimeSaved = [
      { task: "Alert Triage", manualMin: 15, autoMin: 0.5, daily: 120, savedHours: 2920 },
      { task: "Vuln Scanning", manualMin: 60, autoMin: 5, daily: 8, savedHours: 2730 },
      { task: "Patch Deployment", manualMin: 45, autoMin: 10, daily: 15, savedHours: 2555 },
      { task: "User Provisioning", manualMin: 30, autoMin: 2, daily: 25, savedHours: 1825 },
      { task: "Compliance Reporting", manualMin: 120, autoMin: 15, daily: 1, savedHours: 639 },
      { task: "Incident Escalation", manualMin: 10, autoMin: 1, daily: 45, savedHours: 2737 },
      { task: "Log Analysis", manualMin: 90, autoMin: 8, daily: 3, savedHours: 1277 },
      { task: "Threat Intel Enrichment", manualMin: 20, autoMin: 3, daily: 60, savedHours: 1972 }
    ];
    this._rsAutoReliability = [
      { playbook: "Phishing Auto-Block", success: 98.5, executions: 4521, avgTime: "1.2s" },
      { playbook: "Vuln Auto-Scan", success: 97.2, executions: 2340, avgTime: "4.5m" },
      { playbook: "User Offboard", success: 99.1, executions: 156, avgTime: "30s" },
      { playbook: "Alert Enrichment", success: 96.8, executions: 8945, avgTime: "3.1s" },
      { playbook: "Malware Isolate", success: 95.4, executions: 89, avgTime: "8.2s" },
      { playbook: "Compliance Check", success: 94.7, executions: 365, avgTime: "2.1m" }
    ];
    this._rsAutoComparison = [
      { process: "Vulnerability Management", manual: 45, automated: 12, reduction: 73 },
      { process: "Incident Response", manual: 180, automated: 65, reduction: 64 },
      { process: "Access Reviews", manual: 30, automated: 5, reduction: 83 },
      { process: "Compliance Audits", manual: 120, automated: 45, reduction: 63 },
      { process: "Threat Detection", manual: 60, automated: 8, reduction: 87 },
      { process: "Configuration Drift", manual: 40, automated: 10, reduction: 75 }
    ];
    this._rsAutoROI = {
      investment: 850000, annualSavings: 2100000, roi: 147,
      costAvoidance: 1200000, efficiencyGain: 900000, headcountSaved: 4.5
    };
    this._rsAutoCandidates = [
      { task: "Security Questionnaire Response", complexity: "Medium", savings: "120 hrs/yr", priority: "High" },
      { task: "Certificate Rotation", complexity: "Low", savings: "80 hrs/yr", priority: "High" },
      { task: "Firewall Rule Review", complexity: "High", savings: "200 hrs/yr", priority: "Medium" },
      { task: "Data Classification Tagging", complexity: "Medium", savings: "150 hrs/yr", priority: "High" },
      { task: "Vendor Risk Scoring", complexity: "Medium", savings: "90 hrs/yr", priority: "Medium" },
      { task: "Security Awareness Campaigns", complexity: "Low", savings: "60 hrs/yr", priority: "Low" }
    ];
  }

  private rsRenderAutomation() {
    const m = this._rsAutoMetrics;
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
            ${this._rsAutoTimeSaved.slice(0, 5).map((t: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
                <span style="color:#ccc;width:90px">${t.task}</span>
                <div style="flex:1;background:#111;border-radius:2px;height:4px;overflow:hidden">
                  <div style="height:100%;width:${(t.savedHours / 3000) * 100}%;background:#48f"></div>
                </div>
                <span style="color:#888;width:40px;text-align:right">${t.savedHours}h</span>
              </div>`)}
          </div>
          <div>
            <div style="color:#aaa;font-size:10px;margin-bottom:4px">Playbook Reliability</div>
            ${this._rsAutoReliability.map((p: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
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
              <div style="color:#4caf50;font-size:16px;font-weight:bold">${this._rsAutoROI.roi}%</div>
            </div>
            <div style="text-align:center">
              <div style="color:#aaa;font-size:9px">Annual Savings</div>
              <div style="color:#48f;font-size:16px;font-weight:bold">${(this._rsAutoROI.annualSavings / 1000000).toFixed(1)}M</div>
            </div>
            <div style="text-align:center">
              <div style="color:#aaa;font-size:9px">Headcount Saved</div>
              <div style="color:#ff8;font-size:16px;font-weight:bold">${this._rsAutoROI.headcountSaved}</div>
            </div>
            <div style="text-align:right">
              <div style="color:#aaa;font-size:9px">Investment</div>
              <div style="color:#ccc;font-size:16px;font-weight:bold">${(this._rsAutoROI.investment / 1000).toFixed(0)}K</div>
            </div>
          </div>
        </div>
        <div style="color:#aaa;font-size:10px;margin-bottom:4px">Manual vs Automated (hours/process)</div>
        ${this._rsAutoComparison.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;font-size:8px;margin-bottom:2px">
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
        ${this._rsAutoCandidates.map((c: any) => html`<div style="display:flex;align-items:center;gap:4px;margin-bottom:2px;font-size:8px">
            <span style="color:${c.priority === "High" ? "#f44" : c.priority === "Medium" ? "#f84" : "#888"};font-weight:bold;width:40px">${c.priority}</span>
            <span style="color:#ccc;flex:1">${c.task}</span>
            <span style="color:#888">${c.savings}</span>
          </div>`)}
      </div>`;
  }

  // Round 17 initialization
  private rsInitRound17() {
    this.rsInitRiskQuant();
    this.rsInitSecProgram();
    this.rsInitThirdParty();
    this.rsInitDLP();
    this.rsInitAutomation();
  }

  private rsRenderRound17() {
    return html`${this.rsRenderRiskQuant()}${this.rsRenderSecProgram()}${this.rsRenderThirdParty()}${this.rsRenderDLP()}${this.rsRenderAutomation()}`;
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

  // === Security Event Correlation Block ===
  @state() private _ransomwareSiCorrRules: Array<{id:string;name:string;sources:string[];logic:string;severity:string;active:boolean;lastTriggered:string}> = [
    {id:"CR01",name:"Brute Force Detection",sources:["AD","Firewall","SIEM"],logic:"5 failed logins + firewall block within 10min",severity:"High",active:true,lastTriggered:"2026-04-22T08:30:00Z"},
    {id:"CR02",name:"Data Exfiltration Pattern",sources:["DLP","Proxy","DNS"],logic:"Large upload + DNS tunneling indicators",severity:"Critical",active:true,lastTriggered:"2026-04-21T14:22:00Z"},
    {id:"CR03",name:"Lateral Movement Detection",sources:["EDR","AD","Network"],logic:"New admin session + unusual SMB traffic",severity:"High",active:true,lastTriggered:"2026-04-20T11:15:00Z"},
    {id:"CR04",name:"Malware Beacon Detection",sources:["DNS","Proxy","EDR"],logic:"Periodic DNS queries + known C2 patterns",severity:"Critical",active:true,lastTriggered:"2026-04-22T06:45:00Z"},
  ];
  @state() private _ransomwareSiEventTimeline: Array<{timestamp:string;source:string;eventType:string;details:string;correlated:boolean}> = [
    {timestamp:"2026-04-22T10:34:12Z",source:"EDR",eventType:"Process Injection",details:"cmd.exe spawned from powershell",correlated:true},
    {timestamp:"2026-04-22T10:33:58Z",source:"AD",eventType:"Anomalous Login",details:"Service account used from new IP",correlated:true},
    {timestamp:"2026-04-22T10:32:01Z",source:"Firewall",eventType:"Port Scan",details:"192.168.1.45 scanning 10.0.0.0/8",correlated:false},
    {timestamp:"2026-04-22T10:30:45Z",source:"DLP",eventType:"Data Transfer",details:"10MB zip uploaded to external share",correlated:true},
    {timestamp:"2026-04-22T10:28:33Z",source:"DNS",eventType:"Suspicious Query",details:"Query to known malicious domain",correlated:true},
  ];
  @state() private _ransomwareSiFalsePosMetrics: {totalEvents:number;correlatedEvents:number;falsePositives:number;fpRate:number;topFpRules:string[]} = {
    totalEvents: 45230, correlatedEvents: 3847, falsePositives: 892, fpRate: 0.232,
    topFpRules: ["Port Scan Detection", "Anomalous Login Location", "Large File Download"]
  };
  @state() private _ransomwareSiEventPatterns: Array<{id:string;pattern:string;frequency:number;firstSeen:string;lastSeen:string;status:string}> = [
    {id:"EP01",pattern:"Credential stuffing from Tor exit nodes",frequency:23,firstSeen:"2026-03-15",lastSeen:"2026-04-22",status:"Active"},
    {id:"EP02",pattern:"DNS tunneling via TXT records",frequency:8,firstSeen:"2026-04-01",lastSeen:"2026-04-20",status:"Monitoring"},
    {id:"EP03",pattern:"Scheduled task persistence mechanism",frequency:3,firstSeen:"2026-04-10",lastSeen:"2026-04-18",status:"Investigating"},
  ];
  private _renderRansomwaresiEventCorr(): TemplateResult {
    const rules = this._ransomwareSiCorrRules;
    const timeline = this._ransomwareSiEventTimeline;
    const fpMetrics = this._ransomwareSiFalsePosMetrics;
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
  @state() private _ransomwareSiCourses: Array<{id:string;title:string;category:string;duration:number;enrolled:number;completed:number;difficulty:string;rating:number}> = [
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
  @state() private _ransomwareSiLearningPaths: Array<{id:string;name:string;courseIds:string[];progress:number;enrolled:number}> = [
    {id:"LP01",name:"Security Analyst Fundamentals",courseIds:["C001","C004","C007"],progress:72,enrolled:156},
    {id:"LP02",name:"DevSecOps Engineer",courseIds:["C001","C002","C008","C012"],progress:45,enrolled:78},
    {id:"LP03",name:"Cloud Security Specialist",courseIds:["C003","C006","C009"],progress:58,enrolled:89},
    {id:"LP04",name:"Advanced Penetration Tester",courseIds:["C010","C002","C005"],progress:33,enrolled:45},
  ];
  @state() private _ransomwareSiDeptCompliance: Array<{dept:string;trainedPct:number;targetPct:number;avgScore:number;certCount:number}> = [
    {dept:"Engineering",trainedPct:88,targetPct:95,avgScore:82,certCount:34},
    {dept:"Operations",trainedPct:92,targetPct:95,avgScore:87,certCount:28},
    {dept:"Finance",trainedPct:78,targetPct:90,avgScore:74,certCount:12},
    {dept:"HR",trainedPct:85,targetPct:90,avgScore:79,certCount:8},
    {dept:"Legal",trainedPct:71,targetPct:85,avgScore:71,certCount:6},
  ];
  @state() private _ransomwareSiSkillsGaps: Array<{skill:string;current:number;required:number;gap:number;priority:string}> = [
    {skill:"Cloud Security",current:62,required:85,gap:23,priority:"High"},
    {skill:"Threat Hunting",current:55,required:80,gap:25,priority:"High"},
    {skill:"Incident Response",current:70,required:85,gap:15,priority:"Medium"},
    {skill:"Secure Coding",current:75,required:90,gap:15,priority:"Medium"},
    {skill:"Forensics",current:45,required:75,gap:30,priority:"Critical"},
  ];
  private _renderRansomwaresiTraining(): TemplateResult {
    const courses = this._ransomwareSiCourses;
    const deptComp = this._ransomwareSiDeptCompliance;
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

  // === Security Risk Dashboard Block ===
  @state() private _ransomwareSiRiskTopTen: Array<{id:string;name:string;score:number;trend:string;owner:string;category:string;lastAssessed:string}> = [
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
  @state() private _ransomwareSiRiskCategories: Array<{category:string;count:number;avgScore:number;color:string}> = [
    {category:"Vulnerability",count:47,avgScore:82,color:"#ef4444"},
    {category:"Configuration",count:32,avgScore:75,color:"#f97316"},
    {category:"Identity",count:28,avgScore:71,color:"#eab308"},
    {category:"Network",count:24,avgScore:68,color:"#22c55e"},
    {category:"Data Loss",count:19,avgScore:65,color:"#3b82f6"},
    {category:"Encryption",count:15,avgScore:62,color:"#8b5cf6"},
  ];
  @state() private _ransomwareSiRiskVelocity: Array<{week:string;newRisks:number;closedRisks:number;netChange:number}> = [
    {week:"W15",newRisks:12,closedRisks:8,netChange:4},
    {week:"W16",newRisks:15,closedRisks:11,netChange:4},
    {week:"W17",newRisks:9,closedRisks:14,netChange:-5},
    {week:"W18",newRisks:18,closedRisks:10,netChange:8},
    {week:"W19",newRisks:7,closedRisks:16,netChange:-9},
    {week:"W20",newRisks:11,closedRisks:13,netChange:-2},
    {week:"W21",newRisks:14,closedRisks:9,netChange:5},
  ];
  @state() private _ransomwareSiRiskAppetite: {current:number;threshold:number;maxTolerated:number;status:string} = {
    current: 68, threshold: 55, maxTolerated: 80, status: 'Warning'
  };
  @state() private _ransomwareSiRiskOwnerMatrix: Array<{owner:string;criticalCount:number;highCount:number;mediumCount:number;complianceRate:number}> = [
    {owner:"IT Ops",criticalCount:5,highCount:12,mediumCount:23,complianceRate:0.72},
    {owner:"Cloud Team",criticalCount:3,highCount:9,mediumCount:18,complianceRate:0.81},
    {owner:"IAM Team",criticalCount:2,highCount:7,mediumCount:14,complianceRate:0.88},
    {owner:"Network",criticalCount:4,highCount:11,mediumCount:20,complianceRate:0.76},
    {owner:"DevOps",criticalCount:3,highCount:8,mediumCount:16,complianceRate:0.83},
    {owner:"Security",criticalCount:1,highCount:5,mediumCount:12,complianceRate:0.91},
  ];
  private _renderRansomwaresiRiskDash(): TemplateResult {
    const riskItems = this._ransomwareSiRiskTopTen;
    const velocity = this._ransomwareSiRiskVelocity;
    const appetite = this._ransomwareSiRiskAppetite;
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

  // === Cloud Workload Protection Block ===
  @state() private _ransomwareSiContainerScans: Array<{image:string;registry:string;critical:number;high:number;medium:number;scanDate:string;status:string}> = [
    {image:"nginx:1.25",registry:"docker.io",critical:2,high:5,medium:12,scanDate:"2026-04-22",status:"Vulnerable"},
    {image:"postgres:16",registry:"ghcr.io",critical:0,high:1,medium:3,scanDate:"2026-04-22",status:"Clean"},
    {image:"redis:7.2",registry:"docker.io",critical:1,high:3,medium:8,scanDate:"2026-04-21",status:"Vulnerable"},
    {image:"app-server:v2.3",registry:"ecr.aws",critical:0,high:0,medium:2,scanDate:"2026-04-22",status:"Clean"},
    {image:"sidecar-proxy:v1.8",registry:"gcr.io",critical:3,high:7,medium:15,scanDate:"2026-04-20",status:"Critical"},
  ];
  @state() private _ransomwareSiK8sPods: Array<{namespace:string;pod:string;securityContext:string;hostIPC:boolean;hostPID:boolean;privileged:boolean;riskLevel:string}> = [
    {namespace:"production",pod:"web-frontend-7d9f8",securityContext:"Restricted",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Low"},
    {namespace:"production",pod:"api-gateway-4b2c1",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
    {namespace:"staging",pod:"db-migrator-x8k3m",securityContext:"Privileged",hostIPC:true,hostPID:false,privileged:true,riskLevel:"Critical"},
    {namespace:"monitoring",pod:"prometheus-q7r2p",securityContext:"Baseline",hostIPC:false,hostPID:false,privileged:false,riskLevel:"Medium"},
  ];
  @state() private _ransomwareSiServerlessRisk: Array<{function:string;runtime:string;timeout:number;iamPerms:string;externalCalls:number;riskScore:number}> = [
    {function:"processPayment",runtime:"nodejs20.x",timeout:30,iamPerms:"dynamodb:*",externalCalls:3,riskScore:78},
    {function:"sendNotification",runtime:"python3.12",timeout:15,iamPerms:"sns:Publish",externalCalls:1,riskScore:25},
    {function:"imageResizer",runtime:"python3.12",timeout:60,iamPerms:"s3:*",externalCalls:0,riskScore:45},
    {function:"authValidator",runtime:"go1.x",timeout:10,iamPerms:"cognito-idp:*",externalCalls:2,riskScore:62},
  ];
  @state() private _ransomwareSiRuntimeAlerts: Array<{id:string;workload:string;alertType:string;severity:string;description:string;timestamp:string}> = [
    {id:"RTA01",workload:"db-migrator-x8k3m",alertType:"Privilege Escalation",severity:"Critical",description:"Container attempted to access /etc/shadow",timestamp:"2026-04-22T10:34:00Z"},
    {id:"RTA02",workload:"web-frontend-7d9f8",alertType:"Anomalous Outbound",severity:"High",description:"Unexpected DNS query to known C2 domain",timestamp:"2026-04-22T09:12:00Z"},
    {id:"RTA03",workload:"sidecar-proxy:v1.8",alertType:"Crypto Mining",severity:"Critical",description:"CPU utilization exceeded 95% for 30 minutes",timestamp:"2026-04-21T23:45:00Z"},
  ];
  private _renderRansomwaresiCloudWl(): TemplateResult {
    const containers = this._ransomwareSiContainerScans;
    const pods = this._ransomwareSiK8sPods;
    const alerts = this._ransomwareSiRuntimeAlerts;
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
    {id: 'cc-ransomware-simulator-001', title: 'SOX Section 404 Compliance Review', deadline: '2026-06-30', category: 'Regulatory', status: 'In Progress', assignee: 'Compliance Team', notes: 'Annual internal control assessment for financial reporting'},
    {id: 'cc-ransomware-simulator-002', title: 'GDPR Data Protection Impact Assessment', deadline: '2026-05-15', category: 'Privacy', status: 'Pending', assignee: 'DPO Office', notes: 'Quarterly DPIA for high-risk processing activities'},
    {id: 'cc-ransomware-simulator-003', title: 'ISO 27001 Surveillance Audit', deadline: '2026-07-20', category: 'Certification', status: 'Scheduled', assignee: 'QA Lead', notes: 'Stage 2 surveillance audit for ISMS certification renewal'},
    {id: 'cc-ransomware-simulator-004', title: 'PCI DSS v4.0 Gap Analysis', deadline: '2026-05-30', category: 'Payment', status: 'Not Started', assignee: 'Security Architect', notes: 'Assess current state against PCI DSS v4.0 requirements'},
    {id: 'cc-ransomware-simulator-005', title: 'NIST CSF Self-Assessment', deadline: '2026-08-15', category: 'Framework', status: 'Pending', assignee: 'CISO', notes: 'Biannual self-assessment against NIST Cybersecurity Framework'},
    {id: 'cc-ransomware-simulator-006', title: 'HIPAA Security Rule Audit', deadline: '2026-06-15', category: 'Healthcare', status: 'In Progress', assignee: 'Compliance Analyst', notes: 'Annual audit of administrative, physical, and technical safeguards'},
    {id: 'cc-ransomware-simulator-007', title: 'SOC 2 Type II Report Renewal', deadline: '2026-09-30', category: 'Audit', status: 'Scheduled', assignee: 'External Auditor', notes: 'Engage auditor for SOC 2 Type II examination period'},
    {id: 'cc-ransomware-simulator-008', title: 'FedRAMP Authorization Review', deadline: '2026-07-01', category: 'Government', status: 'Pending', assignee: 'FedRAMP PMO', notes: 'Review and update security authorization package'},
    {id: 'cc-ransomware-simulator-009', title: 'Annual Penetration Test', deadline: '2026-10-15', category: 'Testing', status: 'Not Started', assignee: 'Red Team Lead', notes: 'Comprehensive external and internal penetration testing engagement'},
    {id: 'cc-ransomware-simulator-010', title: 'Security Awareness Training Rollout', deadline: '2026-05-01', category: 'Training', status: 'Completed', assignee: 'Security Awareness Manager', notes: 'Q2 organization-wide security awareness training program'},
    {id: 'cc-ransomware-simulator-011', title: 'Vendor Security Review Cycle', deadline: '2026-06-01', category: 'Third Party', status: 'In Progress', assignee: 'Vendor Manager', notes: 'Quarterly review of critical vendor security posture and SLA compliance'},
    {id: 'cc-ransomware-simulator-012', title: 'Incident Response Plan Update', deadline: '2026-05-20', category: 'Operations', status: 'Pending', assignee: 'IR Team Lead', notes: 'Update IR procedures based on lessons learned from recent incidents'},
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
    {id: 'exc-ransomware-simulator-001', title: 'Legacy TLS 1.0 Exception for Payment Gateway', riskLevel: 'High', status: 'Approved', requestor: 'Infrastructure Team', approver: 'CISO', createdDate: '2026-01-15', expiryDate: '2026-07-15', compensatingControls: ['Network segmentation', 'Enhanced monitoring', 'Quarterly review'], justification: 'Third-party payment processor requires TLS 1.0; migration planned for Q3'},
    {id: 'exc-ransomware-simulator-002', title: 'Admin Account with Non-SSO Access', riskLevel: 'Medium', status: 'Under Review', requestor: 'DevOps Lead', approver: 'IAM Manager', createdDate: '2026-02-20', expiryDate: '2026-08-20', compensatingControls: ['MFA enforced', 'Session recording', 'Weekly access audit'], justification: 'Emergency break-glass account for critical infrastructure management'},
    {id: 'exc-ransomware-simulator-003', title: 'Outdated Database Version Support', riskLevel: 'High', status: 'Approved', requestor: 'DBA Team', approver: 'CTO', createdDate: '2025-12-01', expiryDate: '2026-06-01', compensatingControls: ['Isolated network zone', 'Application-layer WAF', 'Monthly patching'], justification: 'Vendor application incompatibility with newer DB version; upgrade scheduled'},
    {id: 'exc-ransomware-simulator-004', title: 'Public S3 Bucket for Customer Assets', riskLevel: 'Critical', status: 'Expired', requestor: 'Product Team', approver: 'CISO', createdDate: '2025-09-01', expiryDate: '2026-03-01', compensatingControls: ['Signed URLs', 'Access logging', 'Content encryption'], justification: 'Legacy customer portal requires public access for document delivery'},
    {id: 'exc-ransomware-simulator-005', title: 'VPN Bypass for Cloud-Native Workloads', riskLevel: 'Medium', status: 'Pending', requestor: 'Cloud Architecture', approver: 'Security Architect', createdDate: '2026-03-10', expiryDate: '2026-09-10', compensatingControls: ['Zero Trust network policies', 'mTLS between services', 'Service mesh encryption'], justification: 'Cloud-native microservices require direct connectivity for performance'},
    {id: 'exc-ransomware-simulator-006', title: 'Default Password Policy Override', riskLevel: 'High', status: 'Denied', requestor: 'HR Department', approver: 'CISO', createdDate: '2026-03-15', expiryDate: '2026-09-15', compensatingControls: ['Password manager deployment', 'SSO integration'], justification: 'Requested simpler password requirements for non-technical staff'},
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
    {id: 'dq-ransomware-simulator-001', dataSource: 'Vulnerability Scanner Feed', completenessScore: 94, accuracyScore: 91, timelinessScore: 88, consistencyScore: 95, reliabilityRank: 1, lastUpdated: '2026-04-23T08:00:00Z', issues: ['Minor delay in Nessus plugin updates'], trend: 'improving'},
    {id: 'dq-ransomware-simulator-002', dataSource: 'SIEM Event Logs', completenessScore: 87, accuracyScore: 93, timelinessScore: 96, consistencyScore: 89, reliabilityRank: 2, lastUpdated: '2026-04-23T07:30:00Z', issues: ['Some log sources showing gaps in off-hours'], trend: 'stable'},
    {id: 'dq-ransomware-simulator-003', dataSource: 'Asset Inventory Database', completenessScore: 82, accuracyScore: 78, timelinessScore: 75, consistencyScore: 84, reliabilityRank: 4, lastUpdated: '2026-04-22T18:00:00Z', issues: ['Shadow IT devices not fully cataloged', 'Decommissioned assets still listed'], trend: 'declining'},
    {id: 'dq-ransomware-simulator-004', dataSource: 'Threat Intelligence Platform', completenessScore: 91, accuracyScore: 89, timelinessScore: 92, consistencyScore: 87, reliabilityRank: 3, lastUpdated: '2026-04-23T06:00:00Z', issues: ['Some IOC sources lack confidence scoring'], trend: 'improving'},
    {id: 'dq-ransomware-simulator-005', dataSource: 'Identity Provider Logs', completenessScore: 96, accuracyScore: 97, timelinessScore: 98, consistencyScore: 96, reliabilityRank: 1, lastUpdated: '2026-04-23T09:00:00Z', issues: [], trend: 'stable'},
    {id: 'dq-ransomware-simulator-006', dataSource: 'Cloud Security Posture Data', completenessScore: 79, accuracyScore: 85, timelinessScore: 82, consistencyScore: 81, reliabilityRank: 5, lastUpdated: '2026-04-23T05:00:00Z', issues: ['Multi-cloud coverage gaps', 'API rate limiting affects scan frequency'], trend: 'declining'},
    {id: 'dq-ransomware-simulator-007', dataSource: 'Compliance Evidence Store', completenessScore: 88, accuracyScore: 86, timelinessScore: 80, consistencyScore: 83, reliabilityRank: 4, lastUpdated: '2026-04-21T14:00:00Z', issues: ['Manual evidence collection delays', 'Inconsistent formatting across frameworks'], trend: 'stable'},
    {id: 'dq-ransomware-simulator-008', dataSource: 'Network Flow Data', completenessScore: 92, accuracyScore: 90, timelinessScore: 94, consistencyScore: 91, reliabilityRank: 2, lastUpdated: '2026-04-23T08:30:00Z', issues: ['Encrypted traffic classification accuracy needs improvement'], trend: 'improving'},
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
    {id: 'wf-ransomware-simulator-001', name: 'Vulnerability Triage Pipeline', description: 'Automated vulnerability assessment, prioritization, and assignment workflow', category: 'Vulnerability Management', steps: 8, avgDuration: '12 min', successRate: 94.5, lastRun: '2026-04-23T06:00:00Z', manualInterventions: 2, optimizationScore: 87},
    {id: 'wf-ransomware-simulator-002', name: 'Incident Response Orchestration', description: 'End-to-end IR workflow from detection to containment and recovery', category: 'Incident Response', steps: 15, avgDuration: '45 min', successRate: 89.2, lastRun: '2026-04-22T14:30:00Z', manualInterventions: 5, optimizationScore: 72},
    {id: 'wf-ransomware-simulator-003', name: 'Access Request Approval Chain', description: 'Multi-level approval workflow for privileged access requests', category: 'Identity & Access', steps: 6, avgDuration: '4 hours', successRate: 97.1, lastRun: '2026-04-23T09:15:00Z', manualInterventions: 1, optimizationScore: 92},
    {id: 'wf-ransomware-simulator-004', name: 'Compliance Evidence Collection', description: 'Automated gathering and packaging of audit evidence artifacts', category: 'Compliance', steps: 10, avgDuration: '30 min', successRate: 91.8, lastRun: '2026-04-21T10:00:00Z', manualInterventions: 3, optimizationScore: 78},
    {id: 'wf-ransomware-simulator-005', name: 'Security Patch Deployment', description: 'Staged patch rollout with validation and rollback capability', category: 'Patch Management', steps: 12, avgDuration: '2 hours', successRate: 96.3, lastRun: '2026-04-20T22:00:00Z', manualInterventions: 1, optimizationScore: 85},
    {id: 'wf-ransomware-simulator-006', name: 'Threat Intelligence Enrichment', description: 'IOC enrichment and correlation with internal threat data', category: 'Threat Intelligence', steps: 7, avgDuration: '8 min', successRate: 93.7, lastRun: '2026-04-23T07:00:00Z', manualInterventions: 0, optimizationScore: 95},
    {id: 'wf-ransomware-simulator-007', name: 'Security Reporting Pipeline', description: 'Automated generation and distribution of security metrics reports', category: 'Reporting', steps: 5, avgDuration: '15 min', successRate: 98.9, lastRun: '2026-04-23T08:00:00Z', manualInterventions: 0, optimizationScore: 97},
    {id: 'wf-ransomware-simulator-008', name: 'Vendor Risk Assessment', description: 'Automated vendor security questionnaire distribution and scoring', category: 'Third Party', steps: 9, avgDuration: '3 days', successRate: 85.4, lastRun: '2026-04-19T11:00:00Z', manualInterventions: 4, optimizationScore: 65},
  ];

  @state() private _workflowExecutionHistory: Array<{workflowId: string; runDate: string; duration: string; status: string; trigger: string}> = [
    {workflowId: 'wf-ransomware-simulator-001', runDate: '2026-04-23T06:00:00Z', duration: '11 min 23 sec', status: 'Success', trigger: 'Scheduled'},
    {workflowId: 'wf-ransomware-simulator-002', runDate: '2026-04-22T14:30:00Z', duration: '42 min 15 sec', status: 'Success', trigger: 'Alert'},
    {workflowId: 'wf-ransomware-simulator-003', runDate: '2026-04-23T09:15:00Z', duration: '3h 45 min', status: 'Success', trigger: 'User Request'},
    {workflowId: 'wf-ransomware-simulator-001', runDate: '2026-04-22T06:00:00Z', duration: '13 min 08 sec', status: 'Partial', trigger: 'Scheduled'},
    {workflowId: 'wf-ransomware-simulator-004', runDate: '2026-04-21T10:00:00Z', duration: '28 min 42 sec', status: 'Success', trigger: 'Scheduled'},
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
    {id: 'kb-ransomware-simulator-001', title: 'Zero Trust Architecture Implementation Guide', category: 'Architecture', author: 'Security Architecture Team', publishDate: '2026-03-15', views: 1842, rating: 4.8, tags: ['zero-trust', 'network', 'identity'], summary: 'Comprehensive guide for implementing zero trust principles across enterprise infrastructure', readTime: '15 min'},
    {id: 'kb-ransomware-simulator-002', title: 'Ransomware Defense Playbook 2026', category: 'Threats', author: 'Threat Intelligence Team', publishDate: '2026-04-01', views: 2341, rating: 4.9, tags: ['ransomware', 'incident-response', 'defense'], summary: 'Updated playbook with latest ransomware tactics, techniques, and defensive measures', readTime: '12 min'},
    {id: 'kb-ransomware-simulator-003', title: 'Cloud Security Best Practices for Multi-Cloud', category: 'Cloud', author: 'Cloud Security Team', publishDate: '2026-02-28', views: 1567, rating: 4.5, tags: ['cloud', 'aws', 'azure', 'gcp'], summary: 'Best practices for securing workloads across multiple cloud service providers', readTime: '18 min'},
    {id: 'kb-ransomware-simulator-004', title: 'API Security Testing Methodology', category: 'Testing', author: 'Red Team', publishDate: '2026-03-22', views: 987, rating: 4.6, tags: ['api', 'testing', 'owasp'], summary: 'Structured methodology for identifying and testing API security vulnerabilities', readTime: '10 min'},
    {id: 'kb-ransomware-simulator-005', title: 'Supply Chain Security Risk Management', category: 'Third Party', author: 'GRC Team', publishDate: '2026-01-20', views: 1234, rating: 4.3, tags: ['supply-chain', 'vendor', 'risk'], summary: 'Framework for managing security risks in the software supply chain', readTime: '14 min'},
    {id: 'kb-ransomware-simulator-006', title: 'Kubernetes Security Hardening Checklist', category: 'Container', author: 'Platform Security', publishDate: '2026-04-10', views: 2103, rating: 4.7, tags: ['kubernetes', 'container', 'hardening'], summary: 'Step-by-step hardening checklist for production Kubernetes clusters', readTime: '11 min'},
    {id: 'kb-ransomware-simulator-007', title: 'Security Metrics That Matter for Executives', category: 'Metrics', author: 'CISO Office', publishDate: '2026-03-05', views: 876, rating: 4.4, tags: ['metrics', 'kpi', 'reporting'], summary: 'Key security metrics and KPIs that resonate with board-level stakeholders', readTime: '8 min'},
    {id: 'kb-ransomware-simulator-008', title: 'Phishing Simulation Campaign Design', category: 'Awareness', author: 'Security Awareness Team', publishDate: '2026-02-15', views: 1456, rating: 4.5, tags: ['phishing', 'simulation', 'training'], summary: 'Designing effective phishing simulations that drive real behavioral change', readTime: '9 min'},
    {id: 'kb-ransomware-simulator-009', title: 'Data Loss Prevention Strategy and Implementation', category: 'Data Protection', author: 'Data Security Team', publishDate: '2026-03-28', views: 1678, rating: 4.6, tags: ['dlp', 'data-protection', 'compliance'], summary: 'Strategic approach to DLP covering people, process, and technology layers', readTime: '16 min'},
    {id: 'kb-ransomware-simulator-010', title: 'Security Automation with SOAR Platforms', category: 'Automation', author: 'SOC Engineering', publishDate: '2026-04-05', views: 1098, rating: 4.7, tags: ['soar', 'automation', 'soc'], summary: 'Building effective security automation playbooks using SOAR technology', readTime: '13 min'},
    {id: 'kb-ransomware-simulator-011', title: 'Third-Party Risk Assessment Framework', category: 'GRC', author: 'Vendor Management', publishDate: '2026-01-30', views: 1345, rating: 4.4, tags: ['vendor', 'risk', 'assessment'], summary: 'Structured framework for evaluating and monitoring third-party security risks', readTime: '12 min'},
    {id: 'kb-ransomware-simulator-012', title: 'Network Detection and Response Best Practices', category: 'Network', author: 'Network Security Team', publishDate: '2026-03-18', views: 1567, rating: 4.5, tags: ['ndr', 'network', 'detection'], summary: 'Implementing effective network detection and response capabilities', readTime: '14 min'},
    {id: 'kb-ransomware-simulator-013', title: 'Security Chaos Engineering Guide', category: 'Resilience', author: 'SRE Security', publishDate: '2026-04-12', views: 789, rating: 4.3, tags: ['chaos-engineering', 'resilience', 'testing'], summary: 'Applying chaos engineering principles to validate security controls', readTime: '10 min'},
    {id: 'kb-ransomware-simulator-014', title: 'Incident Communication Templates', category: 'Incident Response', author: 'IR Team', publishDate: '2026-02-22', views: 2234, rating: 4.8, tags: ['incident', 'communication', 'templates'], summary: 'Ready-to-use communication templates for security incident scenarios', readTime: '7 min'},
    {id: 'kb-ransomware-simulator-015', title: 'Endpoint Detection and Response Configuration', category: 'Endpoint', author: 'Endpoint Security', publishDate: '2026-03-08', views: 1345, rating: 4.5, tags: ['edr', 'endpoint', 'configuration'], summary: 'Optimal EDR configuration for maximum detection with minimal false positives', readTime: '11 min'},
    {id: 'kb-ransomware-simulator-016', title: 'Security Code Review Standards', category: 'Development', author: 'AppSec Team', publishDate: '2026-02-10', views: 1890, rating: 4.6, tags: ['code-review', 'secure-sdlc', 'standards'], summary: 'Standards and checklists for security-focused code reviews', readTime: '13 min'},
    {id: 'kb-ransomware-simulator-017', title: 'IoT Security Assessment Methodology', category: 'IoT', author: 'IoT Security Lab', publishDate: '2026-04-08', views: 654, rating: 4.2, tags: ['iot', 'embedded', 'assessment'], summary: 'Methodology for assessing security posture of IoT devices and ecosystems', readTime: '15 min'},
    {id: 'kb-ransomware-simulator-018', title: 'Passwordless Authentication Migration Guide', category: 'Identity', author: 'IAM Team', publishDate: '2026-03-25', views: 1678, rating: 4.7, tags: ['passwordless', 'authentication', 'mfa'], summary: 'Step-by-step migration plan from password-based to passwordless authentication', readTime: '12 min'},
    {id: 'kb-ransomware-simulator-019', title: 'Security Awareness Program Metrics', category: 'Awareness', author: 'Security Culture Team', publishDate: '2026-01-25', views: 1123, rating: 4.4, tags: ['awareness', 'metrics', 'culture'], summary: 'Measuring the effectiveness of your security awareness and training programs', readTime: '9 min'},
    {id: 'kb-ransomware-simulator-020', title: 'Deception Technology Deployment Guide', category: 'Detection', author: 'Blue Team', publishDate: '2026-04-15', views: 876, rating: 4.5, tags: ['deception', 'honeypot', 'detection'], summary: 'Planning and deploying deception technology for advanced threat detection', readTime: '11 min'},
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


  // ─── Security Architecture Decision Records (ADR) Catalog ───
  private _adrCatalog: Array<{id:string;title:string;status:string;context:string;decision:string;consequences:string;date:string;author:string;reviewer:string;impactLevel:string;supersededBy:string|null;relatedAdrs:string[];tags:string[]}> = [
    {id:"ADR-001",title:"Adopt Zero Trust Network Architecture",status:"accepted",context:"Legacy perimeter-based security model insufficient for hybrid cloud workforce",decision:"Implement Zero Trust with micro-segmentation and continuous verification",consequences:"Reduced lateral movement attack surface; requires investment in identity infrastructure",date:"2024-01-15",author:"Security Architect",reviewer:"CTO",impactLevel:"high",supersededBy:null,relatedAdrs:["ADR-003","ADR-007"],tags:["architecture","network","identity"]},
    {id:"ADR-002",title:"Migrate SIEM to Cloud-Native Platform",status:"accepted",context:"On-premise SIEM at capacity with 18-month data retention requirement",decision:"Deploy cloud-native SIEM with 12-month hot storage and 6-year cold archive",consequences:"Improved scalability; ongoing SaaS costs; faster deployment of detection rules",date:"2024-02-20",author:"SOC Manager",reviewer:"CISO",impactLevel:"high",supersededBy:null,relatedAdrs:["ADR-005"],tags:["siem","cloud","monitoring"]},
    {id:"ADR-003",title:"Implement Passwordless Authentication",status:"accepted",context:"Password-related incidents account for 34% of helpdesk tickets and 22% of breaches",decision:"Deploy FIDO2/WebAuthn across all user populations with phased rollout",consequences:"Reduced credential theft risk; requires hardware token procurement; user training needed",date:"2024-03-10",author:"IAM Lead",reviewer:"Security Architect",impactLevel:"high",supersededBy:null,relatedAdrs:["ADR-001","ADR-006"],tags:["iam","authentication","mfa"]},
    {id:"ADR-004",title:"Adopt Shift-Left Security in CI/CD",status:"accepted",context:"Late-stage vulnerability discovery causing release delays averaging 3.2 days",decision:"Integrate SAST/DAST/SCA gates at build, test, and deploy pipeline stages",consequences:"Earlier vulnerability detection; initial pipeline slowdown; developer training required",date:"2024-04-05",author:"DevSecOps Lead",reviewer:"VP Engineering",impactLevel:"medium",supersededBy:null,relatedAdrs:["ADR-008"],tags:["devsecops","pipeline","sast"]},
    {id:"ADR-005",title:"Centralize Log Aggregation with Kafka",status:"accepted",context:"Siloed logging across 14 systems with inconsistent formats and retention",decision:"Deploy Kafka-based log pipeline with unified schema and 90-day retention",consequences:"Consistent log format; improved incident response; infrastructure cost increase",date:"2024-05-18",author:"Platform Engineer",reviewer:"SOC Manager",impactLevel:"medium",supersededBy:null,relatedAdrs:["ADR-002"],tags:["logging","infrastructure","kafka"]},
    {id:"ADR-006",title:"Implement Just-In-Time Privileged Access",status:"proposed",context:"Standing privileged accounts represent 67% of high-risk exposure in recent audit",decision:"Deploy JIT PAM with approval workflows and session recording for all admin access",consequences:"Elimination of standing privileges; potential friction for emergency response; audit trail improvement",date:"2024-06-22",author:"IAM Lead",reviewer:"CISO",impactLevel:"high",supersededBy:null,relatedAdrs:["ADR-003"],tags:["pam","privilege","access"]},
    {id:"ADR-007",title:"Deploy Runtime Application Self-Protection",status:"proposed",context:"WAF bypass incidents increased 40% year-over-year despite signature updates",decision:"Implement RASP agents on all production application servers for in-app threat detection",consequences:"Defense in depth improvement; performance overhead ~2-5%; agent management complexity",date:"2024-07-14",author:"App Security Lead",reviewer:"Security Architect",impactLevel:"medium",supersededBy:null,relatedAdrs:["ADR-001","ADR-004"],tags:["rasp","application","runtime"]},
    {id:"ADR-008",title:"Automate Compliance Evidence Collection",status:"deprecated",context:"Manual compliance evidence collection consuming 240 person-hours per audit cycle",decision:"Build automated evidence collection framework integrated with GRC platform",consequences:"80% reduction in manual effort; superseded by continuous compliance approach in ADR-012",date:"2024-03-28",author:"GRC Analyst",reviewer:"Compliance Director",impactLevel:"medium",supersededBy:"ADR-012",relatedAdrs:["ADR-004"],tags:["compliance","automation","grc"]}
  ];

  private _adrStatusOptions = ["proposed","accepted","deprecated","superseded"];
  private _adrStatusColors: Record<string,string> = {proposed:"#f59e0b",accepted:"#10b981",deprecated:"#ef4444",superseded:"#6b7280"};
  private _adrImpactLevels = ["low","medium","high","critical"];
  private _adrSearchQuery = "";
  private _adrFilterStatus = "";
  private _adrFilterImpact = "";
  private _adrSortField = "date";
  private _adrSortDir = "desc" as const;

  private _getFilteredAdrs() {
    let adrs = [...this._adrCatalog];
    if (this._adrSearchQuery) {
      const q = this._adrSearchQuery.toLowerCase();
      adrs = adrs.filter(a => a.title.toLowerCase().includes(q) || a.context.toLowerCase().includes(q) || a.tags.some(t => t.includes(q)));
    }
    if (this._adrFilterStatus) adrs = adrs.filter(a => a.status === this._adrFilterStatus);
    if (this._adrFilterImpact) adrs = adrs.filter(a => a.impactLevel === this._adrFilterImpact);
    adrs.sort((a, b) => {
      const dir = this._adrSortDir === "asc" ? 1 : -1;
      if (this._adrSortField === "date") return dir * (new Date(a.date).getTime() - new Date(b.date).getTime());
      if (this._adrSortField === "impact") return dir * (this._adrImpactLevels.indexOf(b.impactLevel) - this._adrImpactLevels.indexOf(a.impactLevel));
      return dir * a.title.localeCompare(b.title);
    });
    return adrs;
  }

  private _getAdrStats() {
    const total = this._adrCatalog.length;
    const byStatus = this._adrCatalog.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {} as Record<string,number>);
    const byImpact = this._adrCatalog.reduce((acc, a) => { acc[a.impactLevel] = (acc[a.impactLevel] || 0) + 1; return acc; }, {} as Record<string,number>);
    const avgAge = this._adrCatalog.reduce((s, a) => s + (Date.now() - new Date(a.date).getTime()) / 86400000, 0) / total;
    const superseded = this._adrCatalog.filter(a => a.supersededBy).length;
    const highImpact = this._adrCatalog.filter(a => a.impactLevel === "high" || a.impactLevel === "critical").length;
    return { total, byStatus, byImpact, avgAge: Math.round(avgAge), superseded, highImpact };
  }

  private _getAdrEvolutionTimeline() {
    const sorted = [...this._adrCatalog].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const timeline = sorted.map(a => ({quarter: "Q" + (Math.floor(new Date(a.date).getMonth() / 3) + 1) + " " + new Date(a.date).getFullYear(), id: a.id, title: a.title, status: a.status, impact: a.impactLevel}));
    return timeline;
  }

  private _getAdrStakeholderMatrix() {
    const stakeholders: Record<string,{authored:number;reviewed:number;affected:number}> = {};
    for (const a of this._adrCatalog) {
      if (!stakeholders[a.author]) stakeholders[a.author] = {authored:0,reviewed:0,affected:0};
      stakeholders[a.author].authored++;
      if (!stakeholders[a.reviewer]) stakeholders[a.reviewer] = {authored:0,reviewed:0,affected:0};
      stakeholders[a.reviewer].reviewed++;
    }
    return stakeholders;
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

  // --- Security Scenario Planning Methods (RASI) ---
  private _initRasiScenarios(): void {
    const worstCaseScenarios = [
      { id: "rasi-sc-01", name: "Ransomware Attack on Critical Infrastructure", category: "Malware", impact: 9500000, probability: 0.12, recoveryDays: 21, affectedSystems: 47, dataLossGb: 320, businessImpact: "critical" },
      { id: "rasi-sc-02", name: "Insider Data Exfiltration via Authorized Channels", category: "Insider Threat", impact: 7200000, probability: 0.18, recoveryDays: 14, affectedSystems: 12, dataLossGb: 85, businessImpact: "high" },
      { id: "rasi-sc-03", name: "Supply Chain Compromise via Third-Party Library", category: "Supply Chain", impact: 6800000, probability: 0.09, recoveryDays: 30, affectedSystems: 63, dataLossGb: 0, businessImpact: "critical" },
      { id: "rasi-sc-04", name: "Cloud Misconfiguration Leading to Public Exposure", category: "Cloud", impact: 4100000, probability: 0.22, recoveryDays: 7, affectedSystems: 8, dataLossGb: 450, businessImpact: "high" },
      { id: "rasi-sc-05", name: "Zero-Day Exploit in Core Application Framework", category: "Vulnerability", impact: 8900000, probability: 0.05, recoveryDays: 45, affectedSystems: 120, dataLossGb: 0, businessImpact: "critical" },
      { id: "rasi-sc-06", name: "Distributed Denial of Service on Customer-Facing Services", category: "Availability", impact: 3400000, probability: 0.25, recoveryDays: 3, affectedSystems: 15, dataLossGb: 0, businessImpact: "medium" },
      { id: "rasi-sc-07", name: "Credential Stuffing and Account Takeover Wave", category: "Identity", impact: 2800000, probability: 0.30, recoveryDays: 5, affectedSystems: 6, dataLossGb: 12, businessImpact: "medium" },
      { id: "rasi-sc-08", name: "Physical Security Breach at Data Center Facility", category: "Physical", impact: 12000000, probability: 0.02, recoveryDays: 60, affectedSystems: 200, dataLossGb: 5000, businessImpact: "critical" },
    ];
    this._rasiScenarios = worstCaseScenarios.map(s => ({ ...s, mitigationCost: Math.round(s.impact * 0.08), drillScheduled: false, lastDrillDate: null, drillScore: null, controlGaps: Math.floor(Math.random() * 5) + 1 }));
  }

  private _calculateRasiScenarioRisk(): void {
    this._rasiScenarios.forEach(s => {
      const riskScore = s.impact * s.probability;
      s.riskScore = Math.round(riskScore);
      s.riskLevel = riskScore > 1000000 ? "extreme" : riskScore > 500000 ? "high" : riskScore > 200000 ? "medium" : "low";
      s.mitigationPriority = s.riskScore > 500000 ? "immediate" : s.riskScore > 200000 ? "planned" : "monitor";
      s.residualRisk = Math.round(s.riskScore * (1 - (s.controlGaps * 0.12)));
      s.bciScore = Math.round((s.recoveryDays * 0.3 + s.affectedSystems * 0.4 + (s.dataLossGb > 0 ? 0.3 : 0)) * 100);
    });
  }

  private _scheduleRasiDrills(): void {
    const drillCadence = { quarterly: ["Q1", "Q2", "Q3", "Q4"], semiAnnual: ["H1", "H2"], annual: ["FY"] };
    this._rasiScenarios.forEach(s => {
      if (s.probability > 0.15 && s.businessImpact === "critical") s.drillCadence = "quarterly";
      else if (s.probability > 0.10 || s.businessImpact === "high") s.drillCadence = "semiAnnual";
      else s.drillCadence = "annual";
      const periods = drillCadence[s.drillCadence as keyof typeof drillCadence];
      s.nextDrillDate = periods[Math.floor(Math.random() * periods.length)] + "-2026";
    });
  }

  private _rasiScenarioComparison(): Record<string, unknown>[] {
    return this._rasiScenarios.map(s => ({
      scenario: s.name, impact: s.impact, probability: s.probability, risk: s.riskScore,
      level: s.riskLevel, recovery: s.recoveryDays + "d", priority: s.mitigationPriority,
      residual: s.residualRisk, bci: s.bciScore, gaps: s.controlGaps
    }));
  }

  // --- Security Control Effectiveness Analytics (RASI) ---
  private _initRasiControls(): void {
    const controls = [
      { id: "rasi-ct-01", name: "Network Segmentation", type: "preventive", maturity: "defined", score: 82, target: 90, failures: 3, lastTest: "2026-03-15" },
      { id: "rasi-ct-02", name: "Endpoint Detection and Response", type: "detective", maturity: "managed", score: 88, target: 92, failures: 1, lastTest: "2026-04-01" },
      { id: "rasi-ct-03", name: "Data Loss Prevention", type: "preventive", maturity: "repeatable", score: 71, target: 85, failures: 7, lastTest: "2026-03-22" },
      { id: "rasi-ct-04", name: "Security Information and Event Management", type: "detective", maturity: "managed", score: 85, target: 90, failures: 2, lastTest: "2026-04-05" },
      { id: "rasi-ct-05", name: "Identity and Access Management", type: "preventive", maturity: "defined", score: 76, target: 88, failures: 5, lastTest: "2026-03-28" },
      { id: "rasi-ct-06", name: "Vulnerability Management", type: "corrective", maturity: "managed", score: 80, target: 90, failures: 4, lastTest: "2026-04-02" },
      { id: "rasi-ct-07", name: "Email Security Gateway", type: "preventive", maturity: "managed", score: 90, target: 95, failures: 1, lastTest: "2026-04-08" },
      { id: "rasi-ct-08", name: "Web Application Firewall", type: "preventive", maturity: "managed", score: 87, target: 92, failures: 2, lastTest: "2026-03-30" },
      { id: "rasi-ct-09", name: "Patch Management", type: "corrective", maturity: "defined", score: 68, target: 85, failures: 9, lastTest: "2026-03-18" },
      { id: "rasi-ct-10", name: "Encryption at Rest", type: "preventive", maturity: "managed", score: 93, target: 95, failures: 0, lastTest: "2026-04-10" },
      { id: "rasi-ct-11", name: "Encryption in Transit", type: "preventive", maturity: "optimized", score: 96, target: 98, failures: 0, lastTest: "2026-04-12" },
      { id: "rasi-ct-12", name: "Privileged Access Management", type: "preventive", maturity: "defined", score: 74, target: 88, failures: 6, lastTest: "2026-03-25" },
      { id: "rasi-ct-13", name: "Security Awareness Training", type: "preventive", maturity: "repeatable", score: 65, target: 80, failures: 11, lastTest: "2026-03-20" },
      { id: "rasi-ct-14", name: "Incident Response Plan", type: "corrective", maturity: "managed", score: 78, target: 88, failures: 4, lastTest: "2026-04-03" },
      { id: "rasi-ct-15", name: "Backup and Recovery", type: "corrective", maturity: "managed", score: 84, target: 92, failures: 3, lastTest: "2026-04-06" },
      { id: "rasi-ct-16", name: "Multi-Factor Authentication", type: "preventive", maturity: "managed", score: 91, target: 95, failures: 1, lastTest: "2026-04-09" },
      { id: "rasi-ct-17", name: "Network Traffic Analysis", type: "detective", maturity: "defined", score: 72, target: 85, failures: 5, lastTest: "2026-03-27" },
      { id: "rasi-ct-18", name: "Cloud Security Posture Management", type: "detective", maturity: "repeatable", score: 69, target: 82, failures: 8, lastTest: "2026-03-24" },
      { id: "rasi-ct-19", name: "Container Security Scanning", type: "preventive", maturity: "defined", score: 75, target: 85, failures: 5, lastTest: "2026-04-04" },
      { id: "rasi-ct-20", name: "API Security Gateway", type: "preventive", maturity: "repeatable", score: 70, target: 82, failures: 7, lastTest: "2026-03-29" },
      { id: "rasi-ct-21", name: "Threat Intelligence Platform", type: "detective", maturity: "managed", score: 83, target: 90, failures: 2, lastTest: "2026-04-07" },
      { id: "rasi-ct-22", name: "Database Activity Monitoring", type: "detective", maturity: "defined", score: 67, target: 80, failures: 8, lastTest: "2026-03-21" },
      { id: "rasi-ct-23", name: "Deception Technology", type: "detective", maturity: "initial", score: 55, target: 75, failures: 12, lastTest: "2026-03-16" },
      { id: "rasi-ct-24", name: "Security Orchestration Automation", type: "corrective", maturity: "repeatable", score: 73, target: 85, failures: 6, lastTest: "2026-04-01" },
      { id: "rasi-ct-25", name: "Third-Party Risk Assessment", type: "preventive", maturity: "defined", score: 64, target: 78, failures: 9, lastTest: "2026-03-19" },
    ];
    this._rasiControls = controls;
  }

  private _analyzeRasiControlEffectiveness(): void {
    const typeBreakdown: Record<string, { total: number; avgScore: number; avgFailures: number }> = {};
    this._rasiControls.forEach(c => {
      if (!typeBreakdown[c.type]) typeBreakdown[c.type] = { total: 0, avgScore: 0, avgFailures: 0 };
      typeBreakdown[c.type].total++;
      typeBreakdown[c.type].avgScore += c.score;
      typeBreakdown[c.type].avgFailures += c.failures;
    });
    Object.keys(typeBreakdown).forEach(t => {
      typeBreakdown[t].avgScore = Math.round(typeBreakdown[t].avgScore / typeBreakdown[t].total);
      typeBreakdown[t].avgFailures = Math.round(typeBreakdown[t].avgFailures / typeBreakdown[t].total * 10) / 10;
    });
    this._rasiControlTypeBreakdown = typeBreakdown;
  }

  private _rasiControlOptimization(): Record<string, unknown>[] {
    return this._rasiControls.filter(c => c.score < c.target).map(c => ({
      control: c.name, current: c.score, target: c.target, gap: c.target - c.score,
      failures: c.failures, maturity: c.maturity, recommendation:
        c.score < 70 ? "Critical: Immediate improvement required" :
        c.score < 80 ? "Significant: Plan improvement sprint" :
        "Moderate: Fine-tune and optimize"
    })).sort((a: any, b: any) => (b.gap as number) - (a.gap as number));
  }

  // --- Security Data Pipeline Health (RASI) ---
  private _initRasiPipelines(): void {
    const pipelines = [
      { id: "rasi-pl-01", name: "SIEM Log Ingestion", status: "healthy", healthScore: 94, latencyMs: 120, freshnessMin: 2, errorRate: 0.02, throughputMbps: 450, recordsPerSec: 12000, backPressure: 0.05, uptime: 99.97 },
      { id: "rasi-pl-02", name: "Threat Feed Aggregation", status: "healthy", healthScore: 91, latencyMs: 300, freshnessMin: 15, errorRate: 0.05, throughputMbps: 85, recordsPerSec: 3200, backPressure: 0.08, uptime: 99.92 },
      { id: "rasi-pl-03", name: "Vulnerability Scan Results", status: "degraded", healthScore: 72, latencyMs: 2500, freshnessMin: 60, errorRate: 0.15, throughputMbps: 25, recordsPerSec: 800, backPressure: 0.35, uptime: 98.50 },
      { id: "rasi-pl-04", name: "Endpoint Telemetry Stream", status: "healthy", healthScore: 88, latencyMs: 450, freshnessMin: 5, errorRate: 0.08, throughputMbps: 280, recordsPerSec: 8500, backPressure: 0.12, uptime: 99.85 },
      { id: "rasi-pl-05", name: "Cloud Audit Log Pipeline", status: "healthy", healthScore: 86, latencyMs: 600, freshnessMin: 10, errorRate: 0.06, throughputMbps: 150, recordsPerSec: 4500, backPressure: 0.10, uptime: 99.80 },
      { id: "rasi-pl-06", name: "Identity Event Stream", status: "warning", healthScore: 78, latencyMs: 1200, freshnessMin: 20, errorRate: 0.12, throughputMbps: 45, recordsPerSec: 1500, backPressure: 0.22, uptime: 99.40 },
      { id: "rasi-pl-07", name: "Network Flow Collection", status: "healthy", healthScore: 82, latencyMs: 800, freshnessMin: 8, errorRate: 0.09, throughputMbps: 650, recordsPerSec: 18000, backPressure: 0.15, uptime: 99.70 },
      { id: "rasi-pl-08", name: "DLP Incident Pipeline", status: "degraded", healthScore: 68, latencyMs: 3500, freshnessMin: 45, errorRate: 0.20, throughputMbps: 18, recordsPerSec: 500, backPressure: 0.42, uptime: 97.80 },
    ];
    this._rasiPipelines = pipelines.map(p => ({ ...p, dependencies: [], slaBreached: p.healthScore < 75, alertThreshold: p.errorRate > 0.15 }));
    this._rasiPipelines[0].dependencies = ["rasi-pl-04", "rasi-pl-07"];
    this._rasiPipelines[4].dependencies = ["rasi-pl-01"];
    this._rasiPipelines[5].dependencies = ["rasi-pl-02"];
    this._rasiPipelines[7].dependencies = ["rasi-pl-04", "rasi-pl-05"];
  }

  private _rasiPipelineTrend(): Record<string, unknown>[] {
    const hours = Array.from({ length: 24 }, (_, i) => `H${String(i).padStart(2, "0")}`);
    return this._rasiPipelines.map(p => ({
      pipeline: p.name, status: p.status, health: p.healthScore,
      latency: p.latencyMs, freshness: p.freshnessMin, errors: p.errorRate,
      throughput: p.throughputMbps, recordsSec: p.recordsPerSec, slaOk: !p.slaBreached,
      hourlyHealth: hours.map(h => Math.max(50, p.healthScore + Math.floor(Math.random() * 20) - 10))
    }));
  }

  // --- Security Stakeholder Report Generator (RASI) ---
  private _initRasiReportTemplates(): void {
    this._rasiReportTemplates = [
      { id: "rasi-rp-01", name: "Board Security Report", audience: "board", frequency: "quarterly", sections: 6, autoGenerate: true, lastGenerated: "2026-03-31", pages: 12 },
      { id: "rasi-rp-02", name: "Executive Risk Summary", audience: "executive", frequency: "monthly", sections: 8, autoGenerate: true, lastGenerated: "2026-04-01", pages: 8 },
      { id: "rasi-rp-03", name: "Technical Security Review", audience: "technical", frequency: "weekly", sections: 12, autoGenerate: true, lastGenerated: "2026-04-21", pages: 25 },
      { id: "rasi-rp-04", name: "Audit Compliance Report", audience: "audit", frequency: "quarterly", sections: 10, autoGenerate: false, lastGenerated: "2026-03-15", pages: 35 },
      { id: "rasi-rp-05", name: "Regulatory Filing Package", audience: "regulatory", frequency: "annual", sections: 15, autoGenerate: false, lastGenerated: "2025-12-31", pages: 48 },
    ];
  }

  private _generateRasiExecSummary(): string {
    const totalRisk = this._rasiScenarios.reduce((sum: number, s: any) => sum + s.riskScore, 0);
    const avgControl = Math.round(this._rasiControls.reduce((sum: number, c: any) => sum + c.score, 0) / this._rasiControls.length);
    const degradedPipes = this._rasiPipelines.filter((p: any) => p.status !== "healthy").length;
    return `Overall risk exposure: ${(totalRisk / 1000000).toFixed(1)}M. Average control effectiveness: {avgControl}%. {degradedPipes} pipeline(s) need attention. {this._rasiScenarios.filter((s: any) => s.mitigationPriority === "immediate").length} scenarios require immediate action.`;
  }

  // --- Security Technology Radar (RASI) ---
  private _initRasiTechRadar(): void {
    this._rasiTechRadar = [
      { id: "rasi-tr-01", name: "AI-Powered Threat Detection", ring: "adopt", category: "Detection", maturity: 4, trend: "up", investment: "high", roi: 3.2, vendorCount: 8 },
      { id: "rasi-tr-02", name: "Zero Trust Architecture", ring: "adopt", category: "Architecture", maturity: 4, trend: "up", investment: "high", roi: 2.8, vendorCount: 12 },
      { id: "rasi-tr-03", name: "SASE/SSE Platform", ring: "trial", category: "Network", maturity: 3, trend: "up", investment: "medium", roi: 2.4, vendorCount: 10 },
      { id: "rasi-tr-04", name: "CNAPP Cloud Security", ring: "trial", category: "Cloud", maturity: 3, trend: "up", investment: "medium", roi: 2.1, vendorCount: 7 },
      { id: "rasi-tr-05", name: "Extended Detection and Response", ring: "adopt", category: "Detection", maturity: 4, trend: "stable", investment: "high", roi: 2.9, vendorCount: 9 },
      { id: "rasi-tr-06", name: "Quantum-Safe Cryptography", ring: "assess", category: "Crypto", maturity: 2, trend: "up", investment: "low", roi: 0.8, vendorCount: 4 },
      { id: "rasi-tr-07", name: "Security Service Edge", ring: "trial", category: "Network", maturity: 3, trend: "up", investment: "medium", roi: 2.0, vendorCount: 6 },
      { id: "rasi-tr-08", name: "SOAR 2.0 Autonomous SOC", ring: "assess", category: "Operations", maturity: 2, trend: "up", investment: "low", roi: 1.2, vendorCount: 5 },
      { id: "rasi-tr-09", name: "Software Supply Chain Security", ring: "trial", category: "DevSecOps", maturity: 3, trend: "up", investment: "medium", roi: 2.3, vendorCount: 8 },
      { id: "rasi-tr-10", name: "Identity Threat Detection", ring: "adopt", category: "Identity", maturity: 3, trend: "up", investment: "high", roi: 2.7, vendorCount: 7 },
      { id: "rasi-tr-11", name: "Data Security Posture Management", ring: "trial", category: "Data", maturity: 3, trend: "up", investment: "medium", roi: 2.2, vendorCount: 9 },
      { id: "rasi-tr-12", name: "Decentralized Identity Standards", ring: "hold", category: "Identity", maturity: 1, trend: "stable", investment: "low", roi: 0.5, vendorCount: 3 },
    ];
  }

  private _rasiRadarSummary(): Record<string, unknown> {
    const rings: Record<string, number> = { adopt: 0, trial: 0, assess: 0, hold: 0 };
    this._rasiTechRadar.forEach(t => { if (rings[t.ring as keyof typeof rings] !== undefined) rings[t.ring as keyof typeof rings]++; });
    return { adopt: rings.adopt, trial: rings.trial, assess: rings.assess, hold: rings.hold, total: this._rasiTechRadar.length, avgMaturity: 2.8, topInvestment: this._rasiTechRadar.filter(t => t.investment === "high").map(t => t.name) };
  }

  // --- RASI Security Compliance Mapping Matrix ---
  private _initRasiComplianceMatrix(): void {
    const frameworks = ["ISO 27001", "SOC 2 Type II", "PCI DSS 4.0", "NIST CSF 2.0", "GDPR", "HIPAA", "FedRAMP", "CIS Controls v8"];
    const domains = ["Access Control", "Data Protection", "Network Security", "Endpoint Security", "Incident Response", "Risk Management", "Asset Management", "Compliance Monitoring"];
    this._rasiComplianceMatrix = frameworks.map(fw => ({
      framework: fw, totalControls: Math.floor(Math.random() * 60) + 80, implemented: Math.floor(Math.random() * 40) + 50,
      partial: Math.floor(Math.random() * 20) + 10, gaps: Math.floor(Math.random() * 15) + 3,
      lastAudit: "2026-" + String(Math.floor(Math.random() * 4) + 1).padStart(2, "0") + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0"),
      nextAudit: "2027-" + String(Math.floor(Math.random() * 6) + 1).padStart(2, "0") + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0"),
      score: Math.floor(Math.random() * 20) + 72, status: Math.random() > 0.3 ? "compliant" : "partial",
      domains: domains.map(d => ({ domain: d, controls: Math.floor(Math.random() * 10) + 5, passed: Math.floor(Math.random() * 8) + 2 }))
    }));
  }

  private _rasiComplianceTrend(): Record<string, unknown>[] {
    const quarters = ["Q1-2025", "Q2-2025", "Q3-2025", "Q4-2025", "Q1-2026", "Q2-2026"];
    return this._rasiComplianceMatrix.map(fw => ({
      framework: fw, score: fw.score, status: fw.status,
      trend: quarters.map(q => Math.min(100, fw.score - 15 + Math.floor(Math.random() * 20))),
      gaps: fw.gaps, implemented: fw.implemented, total: fw.totalControls,
      coverage: Math.round((fw.implemented / fw.totalControls) * 100)
    }));
  }

  // --- RASI Threat Intelligence Correlation Engine ---
  private _initRasiThreatIntel(): void {
    const threatActors = ["APT29", "APT41", "Lazarus Group", "FIN7", "Conti", "Sandworm", "Fancy Bear", "Tick Group"];
    const techniques = ["T1059.001", "T1190", "T1566.001", "T1078", "T1055", "T1486", "T1021.001", "T1071.001"];
    const sectors = ["Finance", "Healthcare", "Technology", "Government", "Energy", "Manufacturing", "Retail", "Telecom"];
    this._rasiThreatIntel = threatActors.map((actor, i) => ({
      actor, sophistication: ["advanced", "advanced", "moderate", "advanced", "moderate", "advanced", "advanced", "moderate"][i],
      targeting: sectors.slice(0, Math.floor(Math.random() * 4) + 2),
      primaryTechniques: techniques.slice(Math.floor(Math.random() * 3), Math.floor(Math.random() * 3) + 4),
      confidence: Math.floor(Math.random() * 30) + 65, lastObserved: "2026-04-" + String(Math.floor(Math.random() * 22) + 1).padStart(2, "0"),
      iocCount: Math.floor(Math.random() * 200) + 50, attributedCampaigns: Math.floor(Math.random() * 8) + 1,
      mitreTactics: ["Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion"].slice(0, Math.floor(Math.random() * 3) + 2),
      riskScore: Math.floor(Math.random() * 40) + 55, alertsTriggered: Math.floor(Math.random() * 30) + 5
    }));
  }

  private _rasiThreatCorrelation(): Record<string, unknown>[] {
    return this._rasiThreatIntel.filter(t => t.riskScore > 70).map(t => ({
      actor: t.actor, risk: t.riskScore, confidence: t.confidence,
      techniques: t.primaryTechniques, targeting: t.targeting,
      lastSeen: t.lastObserved, iocs: t.iocCount, campaigns: t.attributedCampaigns,
      recommendation: t.riskScore > 85 ? "Immediate defensive action required" : t.riskScore > 75 ? "Enhanced monitoring recommended" : "Standard monitoring sufficient"
    })).sort((a: any, b: any) => (b.risk as number) - (a.risk as number));
  }

  // --- RASI Security Metrics Deep Dive ---
  private _initRasiMetricsDeep(): void {
    const metricCategories = ["Detection Coverage", "Response Efficiency", "Prevention Effectiveness", "Recovery Speed", "Compliance Adherence"];
    this._rasiMetricsDeep = metricCategories.map(cat => ({
      category: cat, metrics: Array.from({ length: 6 }, (_, i) => ({
        name: `${cat} Metric ${i + 1}`, value: Math.floor(Math.random() * 40) + 55,
        target: Math.floor(Math.random() * 15) + 82, unit: ["%", "ms", "count", "score"][Math.floor(Math.random() * 4)],
        trend: Math.random() > 0.4 ? "improving" : "stable", period: "30d",
        baseline: Math.floor(Math.random() * 20) + 50, benchmark: Math.floor(Math.random() * 10) + 80
      })),
      overallScore: Math.floor(Math.random() * 20) + 70, maturity: ["initial", "developing", "defined", "managed", "optimized"][Math.floor(Math.random() * 5)]
    }));
  }

  private _rasiMetricsHeatmap(): number[][] {
    return this._rasiMetricsDeep.map(cat =>
      cat.metrics.map(m => Math.round((m.value / m.target) * 100))
    );
  }

  // --- RASI Incident Cost Modeling ---
  private _initRasiCostModel(): void {
    const incidentTypes = ["Data Breach", "Ransomware", "DDoS", "Insider Threat", "Phishing", "Supply Chain", "Cloud Misconfig", "Zero-Day"];
    this._rasiCostModel = incidentTypes.map(inc => ({
      incident: inc, avgCost: Math.floor(Math.random() * 8000000) + 1000000,
      maxCost: Math.floor(Math.random() * 20000000) + 5000000, minCost: Math.floor(Math.random() * 500000) + 100000,
      detectionTimeHrs: Math.floor(Math.random() * 200) + 10, containmentTimeHrs: Math.floor(Math.random() * 150) + 5,
      recoveryTimeHrs: Math.floor(Math.random() * 500) + 50, recordsAffected: Math.floor(Math.random() * 500000) + 10000,
      regulatoryFine: Math.floor(Math.random() * 3000000) + 200000, reputationCost: Math.floor(Math.random() * 2000000) + 500000,
      legalCost: Math.floor(Math.random() * 1500000) + 100000, notificationCost: Math.floor(Math.random() * 800000) + 50000,
      forensicsCost: Math.floor(Math.random() * 400000) + 50000, totalAnnualExposure: 0, frequency: Math.floor(Math.random() * 5) + 1
    }));
    this._rasiCostModel.forEach(m => { m.totalAnnualExposure = m.avgCost * m.frequency; });
  }

  private _rasiCostProjection(): Record<string, unknown>[] {
    return this._rasiCostModel.map(m => ({
      incident: m.incident, avgCost: m.avgCost, annualExposure: m.totalAnnualExposure,
      frequency: m.frequency, detectionHrs: m.detectionTimeHrs, recoveryHrs: m.recoveryTimeHrs,
      records: m.recordsAffected, regulatory: m.regulatoryFine,
      roiOfInvestment: Math.round(m.avgCost * 0.15 / 100000), priority: m.totalAnnualExposure > 10000000 ? "critical" : m.totalAnnualExposure > 5000000 ? "high" : "medium"
    })).sort((a: any, b: any) => (b.annualExposure as number) - (a.annualExposure as number));
  }

  // --- RASI Security Architecture Pattern Library ---
  private _initRasiArchPatterns(): void {
    const patterns = ["Defense in Depth", "Zero Trust Network", "Microsegmentation", "Layered Encryption", "Blast Radius Minimization", "Fail Secure Design", "Least Privilege Access", "Secure-by-Default"];
    this._rasiArchPatterns = patterns.map((p, i) => ({
      pattern: p, category: ["network", "identity", "network", "data", "architecture", "design", "identity", "development"][i],
      maturity: ["optimized", "managed", "defined", "managed", "repeatable", "defined", "managed", "repeatable"][i],
      implementation: Math.floor(Math.random() * 40) + 55, coverage: Math.floor(Math.random() * 30) + 60,
      components: Math.floor(Math.random() * 15) + 5, integrationPoints: Math.floor(Math.random() * 20) + 3,
      riskReduction: Math.floor(Math.random() * 25) + 60, costComplexity: ["low", "high", "medium", "medium", "high", "low", "medium", "medium"][i],
      dependencies: patterns.slice(0, Math.floor(Math.random() * 3)).filter(x => x !== p),
      lastReview: "2026-0" + String(Math.floor(Math.random() * 4) + 1) + "-" + String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")
    }));
  }

  private _rasiArchPatternAnalysis(): Record<string, unknown> {
    const implemented = this._rasiArchPatterns.filter(p => p.implementation > 75).length;
    const avgCoverage = Math.round(this._rasiArchPatterns.reduce((s: number, p: any) => s + p.coverage, 0) / this._rasiArchPatterns.length);
    return {
      totalPatterns: this._rasiArchPatterns.length, fullyImplemented: implemented, avgCoverage,
      avgRiskReduction: Math.round(this._rasiArchPatterns.reduce((s: number, p: any) => s + p.riskReduction, 0) / this._rasiArchPatterns.length),
      gaps: this._rasiArchPatterns.filter(p => p.implementation < 60).map(p => p.pattern),
      recommendations: this._rasiArchPatterns.filter(p => p.implementation < 70).map(p => ({ pattern: p.pattern, current: p.implementation, target: 85, effort: p.costComplexity }))
    };
  }




  // === Security Incident War Room Module ===
  private _warRoomIncidents: Array<{id:string;title:string;severity:string;status:string;assignedTo:string;startedAt:string;updatedAt:string;participants:string[];evidenceCount:number;actionItems:number}> = [];
  private _warRoomActiveIncidentId: string = '';
  private _warRoomFilter: string = 'all';
  private _warRoomTimeline: Array<{timestamp:string;event:string;actor:string;type:string}> = [];
  private _warRoomCommunicationLog: Array<{id:string;from:string;to:string;channel:string;message:string;timestamp:string;priority:string}> = [];
  private _warRoomEvidenceItems: Array<{id:string;name:string;type:string;collectedBy:string;collectedAt:string;hash:string;status:string}> = [];
  private _warRoomActionItems: Array<{id:string;description:string;assignee:string;priority:string;status:string;dueDate:string;createdAt:string}> = [];
  private _warRoomParticipants: Array<{id:string;name:string;role:string;department:string;joinTime:string;status:string}> = [];

  private _initWarRoomData(): void {
    this._warRoomIncidents = [
      {id:'INC-2026-0401',title:'Ransomware Attack on Finance Server',severity:'critical',status:'active',assignedTo:'Alice Chen',startedAt:'2026-04-23T08:30:00Z',updatedAt:'2026-04-23T12:00:00Z',participants:['alice.chen','bob.smith','carol.jones'],evidenceCount:47,actionItems:12},
      {id:'INC-2026-0402',title:'Phishing Campaign Targeting Executives',severity:'high',status:'investigating',assignedTo:'Bob Smith',startedAt:'2026-04-22T14:15:00Z',updatedAt:'2026-04-23T09:30:00Z',participants:['bob.smith','david.lee'],evidenceCount:23,actionItems:8},
      {id:'INC-2026-0403',title:'Unauthorized Data Access in HR Systems',severity:'high',status:'containment',assignedTo:'Carol Jones',startedAt:'2026-04-21T11:00:00Z',updatedAt:'2026-04-23T08:00:00Z',participants:['carol.jones','eve.wilson'],evidenceCount:31,actionItems:15},
      {id:'INC-2026-0404',title:'Suspicious DNS Tunneling Activity',severity:'medium',status:'monitoring',assignedTo:'David Lee',startedAt:'2026-04-20T16:45:00Z',updatedAt:'2026-04-23T10:15:00Z',participants:['david.lee'],evidenceCount:18,actionItems:6},
      {id:'INC-2026-0405',title:'Zero-Day Exploit in Web Application',severity:'critical',status:'active',assignedTo:'Eve Wilson',startedAt:'2026-04-23T06:00:00Z',updatedAt:'2026-04-23T13:45:00Z',participants:['eve.wilson','alice.chen','bob.smith'],evidenceCount:52,actionItems:19}
    ];
    this._warRoomTimeline = [
      {timestamp:'2026-04-23T06:00:00Z',event:'Zero-day exploit detected in production web app',actor:'IDS Sensor',type:'detection'},
      {timestamp:'2026-04-23T06:15:00Z',event:'Incident response team activated',actor:'SOC Manager',type:'response'},
      {timestamp:'2026-04-23T06:30:00Z',event:'Affected servers isolated from network',actor:'Alice Chen',type:'containment'},
      {timestamp:'2026-04-23T07:00:00Z',event:'Forensic image captured from compromised host',actor:'Carol Jones',type:'evidence'},
      {timestamp:'2026-04-23T07:30:00Z',event:'Vendor notified for emergency patch',actor:'Eve Wilson',type:'communication'},
      {timestamp:'2026-04-23T08:00:00Z',event:'Temporary WAF rules deployed',actor:'Bob Smith',type:'mitigation'},
      {timestamp:'2026-04-23T09:00:00Z',event:'Malware sample uploaded to analysis sandbox',actor:'David Lee',type:'analysis'},
      {timestamp:'2026-04-23T10:00:00Z',event:'Communication sent to affected customers',actor:'PR Team',type:'communication'},
      {timestamp:'2026-04-23T11:00:00Z',event:'Patch testing completed in staging',actor:'DevOps Team',type:'remediation'},
      {timestamp:'2026-04-23T12:00:00Z',event:'Executive briefing completed',actor:'CISO',type:'reporting'}
    ];
    this._warRoomCommunicationLog = [
      {id:'COM-001',from:'SOC Manager',to:'All IR Team',channel:'Slack #incident-response',message:'All hands - critical incident declared for web application zero-day. War room activated.',timestamp:'2026-04-23T06:20:00Z',priority:'urgent'},
      {id:'COM-002',from:'Alice Chen',to:'Network Ops',channel:'Email',message:'Please isolate servers 10.0.1.50-60 from the production network immediately.',timestamp:'2026-04-23T06:25:00Z',priority:'high'},
      {id:'COM-003',from:'Eve Wilson',to:'Vendor Support',channel:'Phone',message:'Emergency patch request for CVE-2026-1234. Active exploitation detected in the wild.',timestamp:'2026-04-23T07:45:00Z',priority:'critical'},
      {id:'COM-004',from:'Legal Counsel',to:'CISO',channel:'Encrypted Email',message:'Regulatory notification requirements triggered. 72-hour reporting window starts now.',timestamp:'2026-04-23T08:30:00Z',priority:'high'},
      {id:'COM-005',from:'PR Team',to:'Customer Success',channel:'Slack #crisis-comms',message:'Customer notification draft approved. Ready to send to affected 250 accounts.',timestamp:'2026-04-23T10:30:00Z',priority:'medium'}
    ];
    this._warRoomEvidenceItems = [
      {id:'EVD-001',name:'Forensic image server-50.dd',type:'disk-image',collectedBy:'Carol Jones',collectedAt:'2026-04-23T07:05:00Z',hash:'sha256:a1b2c3d4e5f6',status:'analyzing'},
      {id:'EVD-002',name:'Network capture pcap-0423.pcap',type:'network-capture',collectedBy:'David Lee',collectedAt:'2026-04-23T07:15:00Z',hash:'sha256:f6e5d4c3b2a1',status:'reviewed'},
      {id:'EVD-003',name:'Malware sample evil.exe',type:'malware-sample',collectedBy:'David Lee',collectedAt:'2026-04-23T07:45:00Z',hash:'sha256:1a2b3c4d5e6f',status:'analyzed'},
      {id:'EVD-004',name:'Web server access logs',type:'log-file',collectedBy:'Alice Chen',collectedAt:'2026-04-23T08:00:00Z',hash:'sha256:6f5e4d3c2b1a',status:'preserved'},
      {id:'EVD-005',name:'Firewall rule change history',type:'config-snapshot',collectedBy:'Bob Smith',collectedAt:'2026-04-23T08:10:00Z',hash:'sha256:aabbccddeeff',status:'preserved'},
      {id:'EVD-006',name:'Memory dump server-50.mem',type:'memory-dump',collectedBy:'Carol Jones',collectedAt:'2026-04-23T07:30:00Z',hash:'sha256:ffeeddccbbaa',status:'queued'},
      {id:'EVD-007',name:'Email headers phishing campaign',type:'email-evidence',collectedBy:'Bob Smith',collectedAt:'2026-04-23T09:00:00Z',hash:'sha256:112233445566',status:'analyzed'},
      {id:'EVD-008',name:'WAF request logs 0423.json',type:'log-file',collectedBy:'Alice Chen',collectedAt:'2026-04-23T10:00:00Z',hash:'sha256:665544332211',status:'reviewed'}
    ];
    this._warRoomActionItems = [
      {id:'ACT-001',description:'Isolate all affected servers from production network',assignee:'Alice Chen',priority:'critical',status:'completed',dueDate:'2026-04-23T07:00:00Z',createdAt:'2026-04-23T06:20:00Z'},
      {id:'ACT-002',description:'Capture forensic images of compromised hosts',assignee:'Carol Jones',priority:'critical',status:'completed',dueDate:'2026-04-23T08:00:00Z',createdAt:'2026-04-23T06:25:00Z'},
      {id:'ACT-003',description:'Deploy emergency WAF rules to block exploit pattern',assignee:'Bob Smith',priority:'critical',status:'completed',dueDate:'2026-04-23T09:00:00Z',createdAt:'2026-04-23T06:30:00Z'},
      {id:'ACT-004',description:'Analyze malware sample in sandbox environment',assignee:'David Lee',priority:'high',status:'in-progress',dueDate:'2026-04-23T14:00:00Z',createdAt:'2026-04-23T07:00:00Z'},
      {id:'ACT-005',description:'Contact vendor for emergency patch',assignee:'Eve Wilson',priority:'critical',status:'in-progress',dueDate:'2026-04-23T18:00:00Z',createdAt:'2026-04-23T07:30:00Z'},
      {id:'ACT-006',description:'Prepare regulatory breach notification',assignee:'Legal Counsel',priority:'high',status:'pending',dueDate:'2026-04-26T12:00:00Z',createdAt:'2026-04-23T08:30:00Z'},
      {id:'ACT-007',description:'Test vendor patch in staging environment',assignee:'DevOps Team',priority:'high',status:'in-progress',dueDate:'2026-04-23T16:00:00Z',createdAt:'2026-04-23T09:00:00Z'},
      {id:'ACT-008',description:'Notify affected customers via email',assignee:'PR Team',priority:'medium',status:'completed',dueDate:'2026-04-23T12:00:00Z',createdAt:'2026-04-23T10:00:00Z'}
    ];
    this._warRoomParticipants = [
      {id:'alice.chen',name:'Alice Chen',role:'Incident Commander',department:'Security Operations',joinTime:'2026-04-23T06:15:00Z',status:'active'},
      {id:'bob.smith',name:'Bob Smith',role:'Network Analyst',department:'Network Security',joinTime:'2026-04-23T06:20:00Z',status:'active'},
      {id:'carol.jones',name:'Carol Jones',role:'Forensic Examiner',department:'Digital Forensics',joinTime:'2026-04-23T06:25:00Z',status:'active'},
      {id:'david.lee',name:'David Lee',role:'Malware Analyst',department:'Threat Intelligence',joinTime:'2026-04-23T06:30:00Z',status:'active'},
      {id:'eve.wilson',name:'Eve Wilson',role:'Vulnerability Manager',department:'Patch Management',joinTime:'2026-04-23T06:35:00Z',status:'active'},
      {id:'frank.garcia',name:'Frank Garcia',role:'Legal Counsel',department:'Legal',joinTime:'2026-04-23T08:00:00Z',status:'standby'},
      {id:'grace.kim',name:'Grace Kim',role:'PR Lead',department:'Communications',joinTime:'2026-04-23T09:00:00Z',status:'active'},
      {id:'henry.wang',name:'Henry Wang',role:'DevOps Engineer',department:'Infrastructure',joinTime:'2026-04-23T09:30:00Z',status:'active'}
    ];
  }

  private _getWarRoomIncidentStats(): {total:number;active:number;resolved:number;avgMttc:string;avgMttr:string} {
    const active = this._warRoomIncidents.filter(i => i.status === 'active').length;
    const resolved = this._warRoomIncidents.filter(i => i.status === 'resolved').length;
    return {total:this._warRoomIncidents.length, active, resolved, avgMttc:'47min', avgMttr:'4.2h'};
  }

  private _getWarRoomEvidenceProgress(): {collected:number;analyzed:number;pending:number;total:number} {
    const analyzed = this._warRoomEvidenceItems.filter(e => e.status === 'analyzed').length;
    const pending = this._warRoomEvidenceItems.filter(e => e.status === 'pending' || e.status === 'queued').length;
    return {collected:this._warRoomEvidenceItems.length, analyzed, pending, total:this._warRoomEvidenceItems.length + 5};
  }

  private _getWarRoomActionSummary(): {completed:number;inProgress:number;pending:number;overdue:number} {
    return {
      completed: this._warRoomActionItems.filter(a => a.status === 'completed').length,
      inProgress: this._warRoomActionItems.filter(a => a.status === 'in-progress').length,
      pending: this._warRoomActionItems.filter(a => a.status === 'pending').length,
      overdue: this._warRoomActionItems.filter(a => new Date(a.dueDate) < new Date() && a.status !== 'completed').length
    };
  }


  // --- War Room Incident Severity Matrix ---
  private _warRoomSeverityMatrix: Record<string, {color:string;responseTime:string;escalationChain:string[];autoActions:string[]}> = {};
  private _warRoomStats: {incidentsBySeverity:Record<string,number>;avgResolutionBySeverity:Record<string,string>;escalationRate:number;containmentSuccessRate:number;communicationDelay:string} = {incidentsBySeverity:{},avgResolutionBySeverity:{},escalationRate:0,containmentSuccessRate:0,communicationDelay:''};
  private _warRoomSLACompliance: Array<{severity:string;targetMttc:string;actualMttc:string;targetMttr:string;actualMttr:string;compliant:boolean}> = [];
  private _warRoomResourceAllocation: Array<{role:string;assigned:string;available:string;utilization:number;overtimeHours:number}> = [];
  private _warRoomPostIncidentReviews: Array<{incidentId:string;lessonsLearned:string[];rootCauses:string[];recommendations:string[];followUpItems:string[];reviewDate:string;participants:string[]}> = [];
  private _warRoomAutomationPolicies: Array<{id:string;name:string;triggerCondition:string;actions:string[];enabled:boolean;lastTriggered:string;triggerCount:number}> = [];

  private _initWarRoomSeverityMatrix(): void {
    this._warRoomSeverityMatrix = {
      'critical': {color:'#FF1744',responseTime:'15 minutes',escalationChain:['SOC Analyst','SOC Manager','CISO','CEO'],autoActions:['auto-isolate-affected-systems','enable-enhanced-monitoring','notify-executive-team','preserve-all-evidence']},
      'high': {color:'#FF5722',responseTime:'30 minutes',escalationChain:['SOC Analyst','SOC Manager','CISO'],autoActions:['enable-enhanced-monitoring','collect-forensic-evidence','notify-affected-team-lead']},
      'medium': {color:'#FF9800',responseTime:'2 hours',escalationChain:['SOC Analyst','SOC Manager'],autoActions:['collect-forensic-evidence','update-incident-ticket']},
      'low': {color:'#4CAF50',responseTime:'24 hours',escalationChain:['SOC Analyst'],autoActions:['log-incident','schedule-review']}
    };
    this._warRoomStats = {
      incidentsBySeverity: {'critical':3,'high':8,'medium':15,'low':42},
      avgResolutionBySeverity: {'critical':'3.5h','high':'8.2h','medium':'24.1h','low':'72.5h'},
      escalationRate: 18.5,
      containmentSuccessRate: 94.2,
      communicationDelay: '4.3 min average'
    };
    this._warRoomSLACompliance = [
      {severity:'critical',targetMttc:'15m',actualMttc:'12m',targetMttr:'4h',actualMttr:'3.5h',compliant:true},
      {severity:'high',targetMttc:'30m',actualMttc:'28m',targetMttr:'8h',actualMttr:'8.2h',compliant:false},
      {severity:'medium',targetMttc:'2h',actualMttc:'1.5h',targetMttr:'24h',actualMttr:'24.1h',compliant:false},
      {severity:'low',targetMttc:'24h',actualMttc:'18h',targetMttr:'72h',actualMttr:'72.5h',compliant:false}
    ];
    this._warRoomResourceAllocation = [
      {role:'Incident Commander',assigned:'3',available:'5',utilization:60,overtimeHours:12},
      {role:'Network Analyst',assigned:'4',available:'6',utilization:67,overtimeHours:8},
      {role:'Forensic Examiner',assigned:'2',available:'3',utilization:67,overtimeHours:16},
      {role:'Malware Analyst',assigned:'3',available:'4',utilization:75,overtimeHours:10},
      {role:'Communications Lead',assigned:'1',available:'2',utilization:50,overtimeHours:4},
      {role:'Legal Counsel',assigned:'1',available:'2',utilization:50,overtimeHours:6}
    ];
    this._warRoomPostIncidentReviews = [
      {incidentId:'INC-2026-0398',lessonsLearned:['WAF rules need faster deployment pipeline','Communication templates need pre-approval','Forensic tool chain needs update'],rootCauses:['Unpatched vulnerability in web framework','Insufficient input validation','Missing security headers'],recommendations:['Implement automated WAF rule deployment','Pre-approve 10 communication templates','Upgrade forensic workstation to v3.2'],followUpItems:['FW-RULE-PIPELINE-001','COMMS-TEMPLATE-002','FORENSIC-UPGRADE-003'],reviewDate:'2026-04-15',participants:['alice.chen','bob.smith','carol.jones','david.lee']},
      {incidentId:'INC-2026-0395',lessonsLearned:['Phishing detection needs improvement','User awareness training frequency too low','Emergency access procedures unclear'],rootCauses:['Sophisticated spear-phishing technique','Quarterly training insufficient','No documented emergency access SOP'],recommendations:['Deploy AI-based email analysis','Move to monthly phishing simulations','Create and distribute emergency access SOP'],followUpItems:['EMAIL-AI-001','TRAINING-FREQ-002','SOP-EMERGENCY-003'],reviewDate:'2026-04-10',participants:['alice.chen','eve.wilson','grace.kim']}
    ];
    this._warRoomAutomationPolicies = [
      {id:'AUTO-001',name:'Critical Isolation Policy',triggerCondition:'severity=critical AND affected_systems>3',actions:['auto-isolate-affected-systems','enable-network-segmentation','preserve-memory-dumps'],enabled:true,lastTriggered:'2026-04-23T06:30:00Z',triggerCount:5},
      {id:'AUTO-002',name:'Evidence Collection Policy',triggerCondition:'incident_type=ransomware OR incident_type=malware',actions:['auto-collect-forensic-images','capture-network-traffic','snapshot-affected-systems'],enabled:true,lastTriggered:'2026-04-23T07:00:00Z',triggerCount:12},
      {id:'AUTO-003',name:'Executive Notification Policy',triggerCondition:'severity=critical OR data_breach=confirmed',actions:['send-executive-briefing','activate-crisis-communication','notify-legal-counsel'],enabled:true,lastTriggered:'2026-04-23T08:00:00Z',triggerCount:3},
      {id:'AUTO-004',name:'Threat Intel Enrichment Policy',triggerCondition:'ioc_extracted=true',actions:['query-threat-intel-feeds','enrich-ioc-context','check-compromise-indicators'],enabled:true,lastTriggered:'2026-04-23T09:15:00Z',triggerCount:47}
    ];
  }

  private _getWarRoomSLASummary(): {compliant:number;breached:number;complianceRate:number;worstOffender:string;improvementNeeded:boolean} {
    const compliant = this._warRoomSLACompliance.filter(s => s.compliant).length;
    const breached = this._warRoomSLACompliance.filter(s => !s.compliant).length;
    const worstOffender = this._warRoomSLACompliance.find(s => !s.compliant)?.severity || 'none';
    return {compliant, breached, complianceRate: Math.round((compliant / this._warRoomSLACompliance.length) * 100), worstOffender, improvementNeeded: breached > 0};
  }

  private _getWarRoomResourceAlerts(): string[] {
    const alerts: string[] = [];
    for (const r of this._warRoomResourceAllocation) {
      if (r.utilization > 80) alerts.push(r.role + ' at ' + r.utilization + '% utilization - burnout risk');
      if (r.overtimeHours > 12) alerts.push(r.role + ' has ' + r.overtimeHours + ' overtime hours this week');
    }
    return alerts;
  }

  private _getWarRoomAutomationStats(): {enabled:number;disabled:number;totalTriggers:number;lastTriggered:string} {
    const enabled = this._warRoomAutomationPolicies.filter(a => a.enabled).length;
    const totalTriggers = this._warRoomAutomationPolicies.reduce((s,a) => s + a.triggerCount, 0);
    const lastTriggered = this._warRoomAutomationPolicies.sort((a,b) => b.lastTriggered.localeCompare(a.lastTriggered))[0]?.lastTriggered || '';
    return {enabled, disabled: this._warRoomAutomationPolicies.length - enabled, totalTriggers, lastTriggered};
  }



  // === Threat Intelligence Correlation Engine ===
  private _tiCorrelationRules: Array<{id:string;name:string;sourceFeed:string;targetType:string;confidenceThreshold:number;actionOnMatch:string;enabled:boolean;matchCount:number;lastMatched:string}> = [];
  private _tiFeedStatus: Array<{feedId:string;feedName:string;status:string;lastUpdate:string;iocCount:number;freshnessHours:number;coverage:string}> = [];
  private _tiCorrelationResults: Array<{id:string;ruleId:string;iocType:string;iocValue:string;confidence:number;firstSeen:string;lastSeen:string;affectedAssets:string[];status:string}> = [];
  private _tiThreatActors: Array<{id:string;name:string;aliases:string[];motivation:string;targetSectors:string[]; sophistication:string;lastActivity:string;associatedIocs:number}> = [];

  private _initThreatIntelligenceCorrelation(): void {
    this._tiCorrelationRules = [
      {id:'TCR-001',name:'Malware Hash Lookup',sourceFeed:'VirusTotal',targetType:'file_hash',confidenceThreshold:0.8,actionOnMatch:'alert',enabled:true,matchCount:234,lastMatched:'2026-04-23T12:30:00Z'},
      {id:'TCR-002',name:'C2 Domain Detection',sourceFeed:'Abuse.ch',targetType:'domain',confidenceThreshold:0.9,actionOnMatch:'block',enabled:true,matchCount:56,lastMatched:'2026-04-23T11:45:00Z'},
      {id:'TCR-003',name:'Suspicious IP Correlation',sourceFeed:'CrowdStrike Intel',targetType:'ip_address',confidenceThreshold:0.7,actionOnMatch:'alert',enabled:true,matchCount:189,lastMatched:'2026-04-23T13:00:00Z'},
      {id:'TCR-004',name:'Phishing URL Detection',sourceFeed:'PhishTank',targetType:'url',confidenceThreshold:0.85,actionOnMatch:'block',enabled:true,matchCount:412,lastMatched:'2026-04-23T12:15:00Z'},
      {id:'TCR-005',name:'APT Indicator Matching',sourceFeed:'MITRE ATT&CK',targetType:'behavioral',confidenceThreshold:0.75,actionOnMatch:'alert',enabled:true,matchCount:28,lastMatched:'2026-04-23T10:30:00Z'}
    ];
    this._tiFeedStatus = [
      {feedId:'TF-001',feedName:'VirusTotal Live',status:'active',lastUpdate:'2026-04-23T13:50:00Z',iocCount:4520000,freshnessHours:0.2,coverage:'Malware hashes, URLs, domains'},
      {feedId:'TF-002',feedName:'Abuse.ch ThreatFox',status:'active',lastUpdate:'2026-04-23T13:45:00Z',iocCount:1280000,freshnessHours:0.3,coverage:'C2 infrastructure, malware configs'},
      {feedId:'TF-003',feedName:'CrowdStrike Intel',status:'active',lastUpdate:'2026-04-23T13:40:00Z',iocCount:850000,freshnessHours:0.5,coverage:'Nation-state IOCs, APT profiles'},
      {feedId:'TF-004',feedName:'PhishTank',status:'active',lastUpdate:'2026-04-23T13:30:00Z',iocCount:320000,freshnessHours:1.0,coverage:'Phishing URLs, email campaigns'},
      {feedId:'TF-005',feedName:'AlienVault OTX',status:'degraded',lastUpdate:'2026-04-23T11:00:00Z',iocCount:2100000,freshnessHours:3.0,coverage:'Community-driven IOCs, pulses'},
      {feedId:'TF-006',feedName:'Shodan InternetDB',status:'active',lastUpdate:'2026-04-23T13:55:00Z',iocCount:680000,freshnessHours:0.1,coverage:'Exposed services, vulnerable ports'}
    ];
    this._tiCorrelationResults = [
      {id:'TCR-001-001',ruleId:'TCR-001',iocType:'file_hash',iocValue:'a1b2c3d4e5f6...truncated',confidence:0.95,firstSeen:'2026-04-23T12:30:00Z',lastSeen:'2026-04-23T12:30:00Z',affectedAssets:['workstation-045','workstation-078'],status:'investigating'},
      {id:'TCR-002-001',ruleId:'TCR-002',iocType:'domain',iocValue:'evil-c2-domain.ru',confidence:0.92,firstSeen:'2026-04-23T11:45:00Z',lastSeen:'2026-04-23T11:50:00Z',affectedAssets:['proxy-server-01'],status:'blocked'},
      {id:'TCR-003-001',ruleId:'TCR-003',iocType:'ip_address',iocValue:'203.0.113.45',confidence:0.78,firstSeen:'2026-04-23T10:00:00Z',lastSeen:'2026-04-23T13:00:00Z',affectedAssets:['firewall-01','ids-01'],status:'monitoring'}
    ];
    this._tiThreatActors = [
      {id:'TA-001',name:'APT29 (Cozy Bear)',aliases:['The Dukes','Cozy Bear','Midnight Blizzard'],motivation:'Espionage',targetSectors:['Government','Technology','Think Tanks'],sophistication:'advanced',lastActivity:'2026-04-22',associatedIocs:4521},
      {id:'TA-002',name:'APT28 (Fancy Bear)',aliases:['Fancy Bear','Sofacy','Sednit'],motivation:'Espionage',targetSectors:['Government','Military','Media'],sophistication:'advanced',lastActivity:'2026-04-20',associatedIocs:3876},
      {id:'TA-003',name:'Lazarus Group',aliases:['Hidden Cobra','Labyrinth Chollima'],motivation:'Financial',targetSectors:['Finance','Cryptocurrency','Defense'],sophistication:'advanced',lastActivity:'2026-04-23',associatedIocs:5234},
      {id:'TA-004',name:'FIN7',aliases:['Carbanak','Carbon Spider'],motivation:'Financial',targetSectors:['Retail','Hospitality','Finance'],sophistication:'high',lastActivity:'2026-04-18',associatedIocs:2890}
    ];
  }

  private _getTISummary(): {activeFeeds:number;degradedFeeds:number;totalIocs:number;correlationsToday:number;blockedThreats:number;topActor:string} {
    const activeFeeds = this._tiFeedStatus.filter(f => f.status === 'active').length;
    const degradedFeeds = this._tiFeedStatus.filter(f => f.status !== 'active').length;
    const totalIocs = this._tiFeedStatus.reduce((s,f) => s + f.iocCount, 0);
    const blockedThreats = this._tiCorrelationResults.filter(r => r.status === 'blocked').length;
    return {activeFeeds, degradedFeeds, totalIocs, correlationsToday: this._tiCorrelationResults.length, blockedThreats, topActor: this._tiThreatActors.sort((a,b) => b.associatedIocs - a.associatedIocs)[0]?.name || ''};
  }

  private _getTIFreshnessAlerts(): string[] {
    return this._tiFeedStatus.filter(f => f.freshnessHours > 2).map(f => f.feedName + ' last updated ' + f.freshnessHours + ' hours ago');
  }


  private _rsRiskSteps = [
    {step: 1, name: 'Scope Definition and Context Establishment', desc: 'Define assessment boundaries including organizational scope, asset coverage, threat landscape context, and regulatory requirements applicable to the security assessment engagement', status: 'completed' as const, owner: 'Risk Assessment Lead', duration: '2h', deliverable: 'Assessment scope document with stakeholder sign-off and boundary diagram', artifacts: ['scope-document.pdf', 'stakeholder-register.xlsx', 'boundary-diagram.vsdx']},
    {step: 2, name: 'Asset Inventory and Criticality Classification', desc: 'Catalog all assets within scope including infrastructure components, applications, data repositories, third-party integrations, and classify each by business criticality and data sensitivity', status: 'completed' as const, owner: 'Asset Management Team', duration: '4h', deliverable: 'Complete asset inventory with business criticality ratings and data sensitivity labels', artifacts: ['asset-inventory.csv', 'criticality-matrix.xlsx', 'data-sensitivity-map.pdf']},
    {step: 3, name: 'Threat Landscape Analysis and Intelligence Gathering', desc: 'Identify relevant threat actors, attack vectors, and threat scenarios based on current intelligence feeds, industry-specific threat reports, and historical incident data from the organization', status: 'completed' as const, owner: 'Threat Intelligence Team', duration: '6h', deliverable: 'Threat model document with actor profiles, TTP mapping, and scenario library', artifacts: ['threat-model.pdf', 'actor-profiles.json', 'ttp-mapping.xlsx']},
    {step: 4, name: 'Vulnerability Assessment and Control Gap Analysis', desc: 'Map known and suspected vulnerabilities against identified assets and threat vectors using automated scanning tools, manual penetration testing results, and configuration audit findings', status: 'completed' as const, owner: 'Vulnerability Management', duration: '8h', deliverable: 'Comprehensive vulnerability assessment report with CVSS scoring and trend analysis', artifacts: ['vuln-report.pdf', 'scan-results.xml', 'cvss-trending.xlsx']},
    {step: 5, name: 'Business Impact Analysis and Financial Quantification', desc: 'Evaluate potential business impact for each identified threat-vulnerability combination including direct financial loss, operational disruption duration, reputational damage assessment, and regulatory penalty estimation', status: 'in_progress' as const, owner: 'Business Continuity Team', duration: '4h', deliverable: 'Impact assessment matrix with quantified risk scenarios and financial exposure estimates', artifacts: ['bia-matrix.xlsx', 'financial-exposure.pdf', 'impact-scenarios.docx']},
    {step: 6, name: 'Likelihood Estimation and Expert Calibration', desc: 'Assess probability of each risk scenario materializing based on threat intelligence credibility, historical incident frequency analysis, current control effectiveness measurements, and environmental factor evaluation', status: 'pending' as const, owner: 'Senior Risk Analyst', duration: '3h', deliverable: 'Calibrated likelihood ratings with supporting evidence base and confidence intervals', artifacts: ['likelihood-analysis.xlsx', 'evidence-log.pdf', 'confidence-intervals.json']},
    {step: 7, name: 'Risk Scoring and Prioritization Matrix', desc: 'Apply 5x5 risk scoring matrix to calculate composite risk scores for each risk item, prioritize risks by severity tier, and identify the top risks requiring immediate executive attention and resource allocation', status: 'pending' as const, owner: 'Risk Assessment Lead', duration: '2h', deliverable: 'Risk heat map visualization and prioritized risk register extract with tier assignments', artifacts: ['risk-heatmap.png', 'risk-register.xlsx', 'priority-tier-list.pdf']},
    {step: 8, name: 'Risk Treatment Strategy and Cost-Benefit Analysis', desc: 'Define optimal treatment strategies for each risk including avoid, mitigate, transfer, or accept with specific control recommendations, implementation timelines, and resource requirement estimates', status: 'pending' as const, owner: 'CISO and Risk Committee', duration: '3h', deliverable: 'Treatment plan with detailed cost-benefit analysis for each recommended risk option', artifacts: ['treatment-plan.pdf', 'cost-benefit.xlsx', 'implementation-timeline.xlsx']},
    {step: 9, name: 'Control Mapping and Gap Remediation Roadmap', desc: 'Map existing security controls to identified risks using the control framework taxonomy, identify control gaps and weaknesses, and define detailed remediation roadmaps with timelines and ownership assignments', status: 'pending' as const, owner: 'GRC Team', duration: '4h', deliverable: 'Control-to-risk mapping matrix with gap analysis and prioritized remediation roadmap', artifacts: ['control-mapping.xlsx', 'gap-analysis.pdf', 'remediation-roadmap.xlsx']},
    {step: 10, name: 'Executive Presentation and Risk Register Update', desc: 'Present assessment findings to executive stakeholders with clear risk narratives, obtain formal sign-off on risk ratings and treatment plans, update the enterprise risk register, and schedule the next assessment review cycle', status: 'pending' as const, owner: 'CISO', duration: '2h', deliverable: 'Executive summary presentation with updated risk register and assessment completion report', artifacts: ['exec-summary.pptx', 'risk-register-v3.xlsx', 'completion-report.pdf']}
  ];

  private _rsRiskMatrix = [
    {impact: 'Negligible (1)', rare: 1, unlikely: 2, possible: 3, likely: 4, certain: 5},
    {impact: 'Minor (2)', rare: 2, unlikely: 4, possible: 6, likely: 8, certain: 10},
    {impact: 'Moderate (3)', rare: 3, unlikely: 6, possible: 9, likely: 12, certain: 15},
    {impact: 'Major (4)', rare: 4, unlikely: 8, possible: 12, likely: 16, certain: 20},
    {impact: 'Catastrophic (5)', rare: 5, unlikely: 10, possible: 15, likely: 20, certain: 25}
  ];

  private _rsTreatmentRecords = [
    {id: 'rs-RT-001', riskId: 'RSK-042', riskName: 'Ransomware Attack on Critical Production Infrastructure', currentScore: 20, treatment: 'Mitigate', strategy: 'Deploy next-generation EDR with behavioral analysis and automated response, implement zero-trust network micro-segmentation, establish immutable offline backup rotation with quarterly recovery testing', residualScore: 6, costEstimate: '$450K annually', timeline: 'Q3 2026', owner: 'Infrastructure Security Lead', status: 'approved' as const, controls: ['Next-gen EDR with behavioral detection', 'Zero-trust micro-segmentation', 'Immutable offline backups', 'Incident response retainer with 1hr SLA'], roi: '78% risk reduction for $450K investment vs $2.8M potential loss'},
    {id: 'rs-RT-002', riskId: 'RSK-018', riskName: 'Insider Data Exfiltration via Unauthorized Cloud Storage', currentScore: 15, treatment: 'Mitigate', strategy: 'Implement comprehensive DLP policies for all cloud applications, enable UEBA analytics for anomalous behavior detection, restrict USB and personal cloud storage access at the endpoint layer', residualScore: 5, costEstimate: '$180K annually', timeline: 'Q2 2026', owner: 'Data Protection Lead', status: 'approved' as const, controls: ['Cloud DLP policy suite', 'UEBA behavioral analytics', 'Endpoint USB and cloud restrictions', 'CASB integration for shadow IT'], roi: '67% risk reduction for $180K investment vs $1.2M potential loss'},
    {id: 'rs-RT-003', riskId: 'RSK-067', riskName: 'Supply Chain Compromise via Malicious Third-Party Library', currentScore: 12, treatment: 'Transfer', strategy: 'Procure comprehensive software supply chain insurance policy, require SCA scanning in all vendor contracts, establish SBOM requirements and continuous monitoring for all third-party components', residualScore: 8, costEstimate: '$95K annually', timeline: 'Q4 2026', owner: 'Procurement and Legal', status: 'in_review' as const, controls: ['Supply chain insurance policy', 'SCA scanning in vendor contracts', 'SBOM requirements and monitoring', 'Vendor security assessment program'], roi: '33% risk reduction for $95K investment vs $800K potential loss'},
    {id: 'rs-RT-004', riskId: 'RSK-033', riskName: 'Sophisticated Phishing-Driven Credential Theft Campaign', currentScore: 16, treatment: 'Mitigate', strategy: 'Deploy AI-powered email filtering with real-time threat intelligence, mandate monthly phishing simulations for all staff, enforce hardware-based MFA for all users and transition to passwordless authentication', residualScore: 4, costEstimate: '$120K annually', timeline: 'Q2 2026', owner: 'Security Awareness Lead', status: 'approved' as const, controls: ['AI email filtering with threat intel', 'Monthly phishing simulation program', 'Hardware MFA enforcement', 'Passwordless authentication rollout'], roi: '75% risk reduction for $120K investment vs $1.5M potential loss'},
    {id: 'rs-RT-005', riskId: 'RSK-091', riskName: 'Zero-Day Exploit Targeting Public-Facing Web Application', currentScore: 10, treatment: 'Accept', strategy: 'Maintain WAF with virtual patching capability and rapid rule deployment, implement RASP for runtime application self-protection, establish 4-hour incident response SLA with dedicated retainer team', residualScore: 8, costEstimate: '$60K annually', timeline: 'Ongoing', owner: 'Application Security Lead', status: 'accepted' as const, controls: ['WAF with virtual patching', 'RASP runtime protection', 'IR retainer with 4hr SLA', 'Bug bounty program for proactive discovery'], roi: '20% risk reduction for $60K investment vs $500K potential loss'}
  ];

  private _rsChecklist = [
    {category: 'Technical Security Controls', items: ['Network architecture reviewed for segmentation adequacy, zero-trust compliance, and east-west traffic controls', 'All externally facing assets inventoried with assigned ownership, business justification, and risk classification', 'Encryption standards verified for data at rest (AES-256 minimum), in transit (TLS 1.3 preferred), and in processing', 'Patch management SLA compliance confirmed with zero critical patches overdue beyond their defined SLA window', 'Identity and access management controls validated with completed quarterly access review and attestation cycle', 'Logging and monitoring coverage gaps identified across all critical systems with documented remediation plan and timeline', 'Backup and recovery procedures tested with documented restore time objectives met for all critical business systems', 'Vulnerability scan results from all scanning tools incorporated into risk profile with false positive rate tracked and optimized']},
    {category: 'Organizational and Process Controls', items: ['Security policies reviewed and updated within the last 12-month review cycle with version control and approval tracking', 'Roles and responsibilities for risk management confirmed with current RACI matrix documentation and contact information', 'Incident response plan tested via tabletop exercise within the last 6 months with documented lessons learned and improvements', 'Third-party risk assessments completed for all critical and high-risk vendor relationships with documented risk acceptance where applicable', 'Security awareness training completion rate verified above the organizational threshold with remediation for non-compliant employees', 'Regulatory requirement mapping validated against current operations, technology stack, and data processing activities', 'Board-level risk reporting cadence established with defined escalation criteria, formats, and communication channels']},
    {category: 'Physical and Environmental Controls', items: ['Data center physical access controls reviewed with badge audit log verification and visitor access tracking', 'Remote work security controls assessed including endpoint hardening compliance, VPN usage, and home office guidelines', 'Hardware disposal and decommissioning procedures verified with certificate of destruction tracking and chain of custody', 'Physical security monitoring coverage confirmed with no identified blind spots or gaps in camera and sensor placement']}
  ];

  private _getrsRiskProgress(): number {
    const done = this._rsRiskSteps.filter(s => s.status === 'completed').length;
    return Math.round((done / this._rsRiskSteps.length) * 100);
  }

  private _getrsTreatmentSummary(): {total: number; approved: number; inReview: number; avgReduction: number; investment: string} {
    const approved = this._rsTreatmentRecords.filter(r => r.status === 'approved').length;
    const inReview = this._rsTreatmentRecords.filter(r => r.status === 'in_review').length;
    const avgRed = this._rsTreatmentRecords.reduce((s, r) => s + ((r.currentScore - r.residualScore) / r.currentScore * 100), 0) / this._rsTreatmentRecords.length;
    return {total: this._rsTreatmentRecords.length, approved, inReview, avgReduction: Math.round(avgRed), investment: '$905K annually'};
  }

  private _rsAutoRules = [
    {id: 'rs-CR-001', name: 'Password Policy Compliance Check', framework: 'NIST 800-53 IA-5', desc: 'Verify all user accounts meet minimum password complexity requirements including length, character diversity, and rotation intervals', enabled: true as const, frequency: 'Daily', lastRun: '2026-04-22T14:00:00Z', lastResult: 'pass' as const, passRate: 94.2, violations: 12, autoRemediate: true as const, remediation: 'Force password reset on non-compliant accounts within 24h notification window', history: [{d: '04-22', r: 'pass', v: 12}, {d: '04-21', r: 'pass', v: 14}, {d: '04-20', r: 'fail', v: 18}, {d: '04-19', r: 'pass', v: 15}, {d: '04-18', r: 'pass', v: 13}]},
    {id: 'rs-CR-002', name: 'MFA Enrollment Verification', framework: 'NIST 800-53 IA-2', desc: 'Ensure all privileged and standard accounts have multi-factor authentication properly enrolled and actively used for authentication', enabled: true as const, frequency: 'Daily', lastRun: '2026-04-22T14:00:00Z', lastResult: 'fail' as const, passRate: 87.5, violations: 34, autoRemediate: true as const, remediation: 'Send mandatory MFA enrollment notification with 48-hour compliance deadline and escalation path', history: [{d: '04-22', r: 'fail', v: 34}, {d: '04-21', r: 'fail', v: 31}, {d: '04-20', r: 'fail', v: 28}, {d: '04-19', r: 'fail', v: 25}, {d: '04-18', r: 'fail', v: 22}]},
    {id: 'rs-CR-003', name: 'Inactive Account Lifecycle Review', framework: 'NIST 800-53 AC-2', desc: 'Identify and disable user accounts that have been inactive for more than 90 days with automatic escalation at 120 days', enabled: true as const, frequency: 'Weekly', lastRun: '2026-04-21T00:00:00Z', lastResult: 'pass' as const, passRate: 96.8, violations: 5, autoRemediate: true as const, remediation: 'Auto-disable accounts exceeding 120-day inactivity with manager notification and audit trail', history: [{d: '04-21', r: 'pass', v: 5}, {d: '04-14', r: 'pass', v: 7}, {d: '04-07', r: 'pass', v: 9}, {d: '03-31', r: 'pass', v: 11}, {d: '03-24', r: 'pass', v: 13}]},
    {id: 'rs-CR-004', name: 'Encryption Standards Verification', framework: 'NIST 800-53 SC-28', desc: 'Verify all production and staging storage volumes use approved encryption standards with valid non-expired certificates', enabled: true as const, frequency: 'Daily', lastRun: '2026-04-22T14:00:00Z', lastResult: 'pass' as const, passRate: 99.1, violations: 2, autoRemediate: false as const, remediation: 'Create priority ticket for manual encryption remediation on non-compliant storage volumes', history: [{d: '04-22', r: 'pass', v: 2}, {d: '04-21', r: 'pass', v: 2}, {d: '04-20', r: 'pass', v: 3}, {d: '04-19', r: 'pass', v: 3}, {d: '04-18', r: 'pass', v: 4}]},
    {id: 'rs-CR-005', name: 'Firewall Rule Baseline Compliance', framework: 'NIST 800-53 SC-7', desc: 'Validate all firewall rules against the approved baseline configuration to detect unauthorized modifications or configuration drift', enabled: true as const, frequency: 'Daily', lastRun: '2026-04-22T06:00:00Z', lastResult: 'fail' as const, passRate: 91.3, violations: 18, autoRemediate: true as const, remediation: 'Automatically revert non-compliant firewall rules to the approved baseline configuration with change audit', history: [{d: '04-22', r: 'fail', v: 18}, {d: '04-21', r: 'pass', v: 12}, {d: '04-20', r: 'pass', v: 15}, {d: '04-19', r: 'pass', v: 14}, {d: '04-18', r: 'fail', v: 20}]},
    {id: 'rs-CR-006', name: 'Critical Patch SLA Compliance', framework: 'CIS Benchmark Level 2', desc: 'Check all production systems against critical and high severity patch SLA requirements and flag overdue patches for escalation', enabled: true as const, frequency: 'Daily', lastRun: '2026-04-22T08:00:00Z', lastResult: 'pass' as const, passRate: 97.6, violations: 8, autoRemediate: false as const, remediation: 'Escalate overdue patches to the patch management team for expedited deployment and root cause analysis', history: [{d: '04-22', r: 'pass', v: 8}, {d: '04-21', r: 'pass', v: 10}, {d: '04-20', r: 'pass', v: 12}, {d: '04-19', r: 'pass', v: 11}, {d: '04-18', r: 'pass', v: 14}]},
    {id: 'rs-CR-007', name: 'Data Classification Label Enforcement', framework: 'GDPR Article 30', desc: 'Verify all databases, file shares, and cloud storage repositories have appropriate data classification labels applied and enforced', enabled: true as const, frequency: 'Weekly', lastRun: '2026-04-20T00:00:00Z', lastResult: 'fail' as const, passRate: 82.4, violations: 45, autoRemediate: false as const, remediation: 'Generate classification review tasks assigned to respective data owners with defined completion deadline', history: [{d: '04-20', r: 'fail', v: 45}, {d: '04-13', r: 'fail', v: 42}, {d: '04-06', r: 'fail', v: 38}, {d: '03-30', r: 'fail', v: 35}, {d: '03-23', r: 'pass', v: 30}]},
    {id: 'rs-CR-008', name: 'Privileged Access Recertification', framework: 'SOX ITGC AC-6', desc: 'Review and validate all privileged access assignments on the quarterly recertification schedule with manager attestation', enabled: true as const, frequency: 'Monthly', lastRun: '2026-04-01T00:00:00Z', lastResult: 'pass' as const, passRate: 93.7, violations: 22, autoRemediate: false as const, remediation: 'Initiate access recertification workflow with multi-level manager approval chain and audit trail', history: [{d: '04-01', r: 'pass', v: 22}, {d: '03-01', r: 'pass', v: 25}, {d: '02-01', r: 'pass', v: 28}, {d: '01-01', r: 'pass', v: 30}, {d: '12-01', r: 'pass', v: 32}]},
    {id: 'rs-CR-009', name: 'SIEM Log Source Coverage Audit', framework: 'NIST 800-53 AU-2', desc: 'Verify all critical systems have required logging enabled and actively forwarding events to the centralized SIEM platform', enabled: true as const, frequency: 'Weekly', lastRun: '2026-04-21T12:00:00Z', lastResult: 'pass' as const, passRate: 95.5, violations: 7, autoRemediate: true as const, remediation: 'Deploy missing log collection agents automatically via configuration management system integration', history: [{d: '04-21', r: 'pass', v: 7}, {d: '04-14', r: 'pass', v: 9}, {d: '04-07', r: 'pass', v: 11}, {d: '03-31', r: 'pass', v: 10}, {d: '03-24', r: 'pass', v: 13}]},
    {id: 'rs-CR-010', name: 'TLS Certificate Expiry Monitoring', framework: 'NIST 800-53 SC-13', desc: 'Monitor all TLS and SSL certificates for upcoming expiry within configurable warning windows with automated renewal', enabled: true as const, frequency: 'Daily', lastRun: '2026-04-22T14:00:00Z', lastResult: 'pass' as const, passRate: 98.9, violations: 3, autoRemediate: true as const, remediation: 'Trigger automated certificate renewal via ACME protocol integration with internal certificate authority', history: [{d: '04-22', r: 'pass', v: 3}, {d: '04-21', r: 'pass', v: 3}, {d: '04-20', r: 'pass', v: 4}, {d: '04-19', r: 'pass', v: 4}, {d: '04-18', r: 'pass', v: 5}]}
  ];

  private _rsDriftAlerts = [
    {ruleId: 'rs-CR-007', name: 'Data Classification Label Enforcement', dir: 'regression' as const, prev: 86.1, curr: 82.4, delta: -3.7, sev: 'warning' as const, detected: '2026-04-20T12:00:00Z', rootCause: 'New file shares created during Q1 cloud migration project lacked classification labels due to process gap', remediation: 'Bulk classification task scheduled for all data owners with 2-week deadline and compliance tracking'},
    {ruleId: 'rs-CR-002', name: 'MFA Enrollment Verification', dir: 'regression' as const, prev: 89.2, curr: 87.5, delta: -1.7, sev: 'info' as const, detected: '2026-04-21T08:00:00Z', rootCause: '12 new contractor accounts onboarded without MFA enforcement due to HR onboarding process gap', remediation: 'HR onboarding checklist updated to include MFA as mandatory step before system access is granted'},
    {ruleId: 'rs-CR-005', name: 'Firewall Rule Baseline Compliance', dir: 'improvement' as const, prev: 89.8, curr: 91.3, delta: 1.5, sev: 'info' as const, detected: '2026-04-22T06:00:00Z', rootCause: 'Automated remediation workflow successfully cleaned up 5 orphaned firewall rules from decommissioned systems', remediation: 'Continue automated cleanup on weekly schedule and expand to include staging environment firewalls'},
    {ruleId: 'rs-CR-011', name: 'Endpoint Detection Status', dir: 'improvement' as const, prev: 95.1, curr: 96.2, delta: 1.1, sev: 'info' as const, detected: '2026-04-22T10:00:00Z', rootCause: 'RMM integration enabled bulk EDR reinstallation on 15 previously offline or reimaged endpoints', remediation: 'No action needed, improvement trend expected to continue as offline device recovery completes'}
  ];

  private _getrsRuleSummary(): {total: number; enabled: number; passing: number; failing: number; avgPassRate: number; autoRemRate: number; totalVulns: number} {
    const enabled = this._rsAutoRules.filter(r => r.enabled).length;
    const passing = this._rsAutoRules.filter(r => r.lastResult === 'pass').length;
    const failing = this._rsAutoRules.filter(r => r.lastResult === 'fail').length;
    const avgRate = this._rsAutoRules.reduce((s, r) => s + r.passRate, 0) / this._rsAutoRules.length;
    const autoRate = this._rsAutoRules.filter(r => r.autoRemediate).length / this._rsAutoRules.length * 100;
    const totalVulns = this._rsAutoRules.reduce((s, r) => s + r.violations, 0);
    return {total: this._rsAutoRules.length, enabled, passing, failing, avgPassRate: Math.round(avgRate * 10) / 10, autoRemRate: Math.round(autoRate), totalVulns};
  }

  private _getrsEffectiveness(): {autoRemSuccess: number; avgRemTime: string; fpRate: number; coverage: number; savings: string} {
    return {autoRemSuccess: 87.3, avgRemTime: '23 minutes', fpRate: 2.1, coverage: 92, savings: '$340K annually vs manual compliance checking'};
  }

  private _rsOpenPositions = [
    {id: 'rs-P-001', title: 'Senior Penetration Tester', dept: 'Red Team', level: 'Senior', location: 'Remote US', salary: '$165K-$195K', posted: '2026-03-15', applicants: 23, pipeline: 8, interviews: 4, offers: 1, status: 'active' as const, urgency: 'high' as const, manager: 'Alex Chen', recruiter: 'Sarah Kim', skills: ['Burp Suite', 'Metasploit', 'Cobalt Strike', 'Python scripting', 'OWASP Top 10'], nice: ['OSCP/OSCE', 'Bug bounty experience', 'Cloud pentesting', 'Active directory attacks']},
    {id: 'rs-P-002', title: 'Cloud Security Engineer', dept: 'Cloud Security', level: 'Mid-Senior', location: 'San Francisco / Remote', salary: '$155K-$180K', posted: '2026-03-20', applicants: 45, pipeline: 12, interviews: 6, offers: 2, status: 'active' as const, urgency: 'high' as const, manager: 'Mike Johnson', recruiter: 'Sarah Kim', skills: ['AWS/Azure/GCP security', 'Terraform IaC', 'Kubernetes security', 'IAM policies', 'CSPM tools'], nice: ['CCSP certification', 'CKS certification', 'Serverless security', 'Multi-cloud experience']},
    {id: 'rs-P-003', title: 'SOC Analyst Level 2', dept: 'Security Operations', level: 'Mid', location: 'Austin TX', salary: '$105K-$130K', posted: '2026-04-01', applicants: 67, pipeline: 18, interviews: 8, offers: 0, status: 'active' as const, urgency: 'medium' as const, manager: 'Lisa Park', recruiter: 'Tom Wilson', skills: ['SIEM operations', 'Incident triage', 'Malware analysis basics', 'TCP/IP networking', 'Log analysis'], nice: ['GCIA certification', 'Cyber Kill Chain knowledge', 'SOAR platform experience', 'Threat hunting']},
    {id: 'rs-P-004', title: 'Staff Security Architect', dept: 'Architecture', level: 'Staff', location: 'Remote US', salary: '$200K-$240K', posted: '2026-02-28', applicants: 12, pipeline: 3, interviews: 2, offers: 0, status: 'active' as const, urgency: 'critical' as const, manager: 'David Lee', recruiter: 'Sarah Kim', skills: ['Enterprise security architecture', 'Zero trust design', 'Risk frameworks', 'Cloud-native security', 'Board communication'], nice: ['CISSP with SABSA', 'Prior team building experience', 'Industry conference speaker', 'M&A due diligence']},
    {id: 'rs-P-005', title: 'GRC Analyst', dept: 'Governance Risk Compliance', level: 'Mid', location: 'New York / Remote', salary: '$110K-$135K', posted: '2026-04-05', applicants: 34, pipeline: 9, interviews: 3, offers: 1, status: 'active' as const, urgency: 'medium' as const, manager: 'Rachel Green', recruiter: 'Tom Wilson', skills: ['ISO 27001', 'SOC 2 Type II', 'Risk assessment', 'Policy development', 'Audit management'], nice: ['CRISC certification', 'CISA certification', 'GDPR expertise', 'PCI DSS experience']},
    {id: 'rs-P-006', title: 'Threat Intelligence Analyst', dept: 'Threat Intelligence', level: 'Mid-Senior', location: 'Remote US', salary: '$140K-$170K', posted: '2026-03-25', applicants: 19, pipeline: 5, interviews: 2, offers: 0, status: 'active' as const, urgency: 'low' as const, manager: 'James Wilson', recruiter: 'Sarah Kim', skills: ['MITRE ATT&CK framework', 'OSINT techniques', 'Threat modeling', 'Malware reverse engineering', 'Intelligence reporting'], nice: ['CTIA certification', 'Nation-state actor experience', 'Dark web monitoring', 'Financial sector threat intel']},
    {id: 'rs-P-007', title: 'Application Security Engineer', dept: 'AppSec', level: 'Senior', location: 'Seattle / Remote', salary: '$160K-$190K', posted: '2026-04-10', applicants: 28, pipeline: 7, interviews: 3, offers: 0, status: 'active' as const, urgency: 'medium' as const, manager: 'Emily Zhang', recruiter: 'Tom Wilson', skills: ['SAST/DAST/SCA tools', 'Secure SDLC', 'Code review', 'CI/CD security integration', 'Threat modeling'], nice: ['CSSLP certification', 'Buffer overflow research', 'Mobile application security', 'API security testing']},
    {id: 'rs-P-008', title: 'IAM Engineer', dept: 'Identity and Access Management', level: 'Mid', location: 'Remote US', salary: '$135K-$160K', posted: '2026-04-08', applicants: 31, pipeline: 10, interviews: 5, offers: 1, status: 'active' as const, urgency: 'medium' as const, manager: 'Chris Martinez', recruiter: 'Sarah Kim', skills: ['Okta/Azure AD', 'SAML/OIDC protocols', 'PAM solutions', 'RBAC/ABAC models', 'Directory services'], nice: ['CISSP certification', 'Zero trust IAM design', 'Identity governance platforms', 'Federation architecture']}
  ];

  private _rsInterviewTemplate = [
    {category: 'Technical Proficiency Assessment', weight: 40, criteria: [
      {name: 'Core Security Knowledge Depth', maxScore: 10, desc: 'Demonstrated understanding of security fundamentals, industry frameworks (NIST, ISO, CIS), and established best practices across multiple domains'},
      {name: 'Hands-on Technical Execution', maxScore: 10, desc: 'Practical ability to effectively use security tools, write automation scripts, and solve complex technical security challenges under time pressure'},
      {name: 'Domain-Specific Expertise', maxScore: 10, desc: 'Depth of specialized knowledge and practical experience in the specific role domain area being hired for'},
      {name: 'Incident Analysis and Response Thinking', maxScore: 10, desc: 'Ability to systematically analyze security incidents and propose effective, proportionate response strategies with clear communication'}
    ]},
    {category: 'Communication and Collaboration', weight: 20, criteria: [
      {name: 'Technical Explanation Clarity', maxScore: 10, desc: 'Ability to clearly explain complex security concepts and findings to both technical peers and non-technical business stakeholders'},
      {name: 'Written Documentation Quality', maxScore: 10, desc: 'Demonstrated ability to produce clear, accurate, well-structured, and actionable security documentation and reports'}
    ]},
    {category: 'Cultural and Team Alignment', weight: 20, criteria: [
      {name: 'Cross-functional Collaboration', maxScore: 10, desc: 'Track record of working effectively and building relationships with development, operations, and business teams'},
      {name: 'Continuous Learning and Growth Mindset', maxScore: 10, desc: 'Demonstrated commitment to ongoing professional development, knowledge sharing, and staying current with evolving threats'}
    ]},
    {category: 'Professional Experience', weight: 20, criteria: [
      {name: 'Relevant Industry Experience', maxScore: 10, desc: 'Quality, breadth, and direct relevance of past work experience in security roles at comparable organizations'},
      {name: 'Certifications and Education', maxScore: 10, desc: 'Relevant industry certifications (CISSP, OSCP, etc.) and academic background supporting the role requirements'}
    ]}
  ];

  private _rsOnboardingChecklist = [
    {id: 'rs-OB-001', item: 'Provision security-hardened laptop, dual monitors, peripherals, and configured workstation image with all required tools', cat: 'IT Setup', day: 'Day 1', owner: 'IT Operations'},
    {id: 'rs-OB-002', item: 'Create Active Directory account, corporate email, Slack workspace, VPN access, SSO enrollment, and all required application accounts', cat: 'Access Provisioning', day: 'Day 1', owner: 'IAM Team'},
    {id: 'rs-OB-003', item: 'Grant access to security tooling platform: SIEM console, EDR dashboard, vulnerability scanner, penetration testing tools, and SOAR platform', cat: 'Security Tool Access', day: 'Day 1-2', owner: 'SOC Manager'},
    {id: 'rs-OB-004', item: 'Complete MFA enrollment for all accounts, security awareness onboarding course, and sign acceptable use policy acknowledgment', cat: 'Security Onboarding', day: 'Day 1', owner: 'Security Awareness Team'},
    {id: 'rs-OB-005', item: 'Sign NDA, employment agreement, intellectual property assignment, and code of conduct documents with HR representative', cat: 'HR Documentation', day: 'Day 1', owner: 'Human Resources'},
    {id: 'rs-OB-006', item: 'Schedule and complete introduction meetings with all direct team members and key cross-functional stakeholders', cat: 'Team Integration', day: 'Week 1', owner: 'Hiring Manager'},
    {id: 'rs-OB-007', item: 'Attend security architecture overview sessions, tooling walkthrough demonstrations, and review operational runbooks and SOPs', cat: 'Technical Training', day: 'Week 1-2', owner: 'Security Architect'},
    {id: 'rs-OB-008', item: 'Shadow experienced team member on active incident response cases and threat hunting investigations for hands-on exposure', cat: 'Mentoring and Shadowing', day: 'Week 2-3', owner: 'SOC Team Lead'},
    {id: 'rs-OB-009', item: 'Set up individual certification study plan aligned with role requirements and long-term career development goals', cat: 'Professional Development', day: 'Week 2', owner: 'Hiring Manager'},
    {id: 'rs-OB-010', item: 'Establish 30-60-90 day performance goals, define success metrics, and schedule first formal performance review checkpoint', cat: 'Goal Setting', day: 'Week 1', owner: 'Hiring Manager'}
  ];

  private _rsRetentionRisks = [
    {indicator: 'Tenure exceeds 3 years without promotion, lateral move, or significant role expansion', weight: 15, threshold: 'High', flagged: 4, action: 'Schedule career development discussion with manager and HR business partner'},
    {indicator: 'Team voluntary attrition rate in the past 6 months exceeds 15 percent of team headcount', weight: 20, threshold: 'Medium', flagged: 2, action: 'Conduct confidential stay interviews with remaining team members to identify root causes'},
    {indicator: 'Employee engagement survey score falls below team average or company average for two consecutive surveys', weight: 10, threshold: 'Medium', flagged: 6, action: 'Manager to review individual engagement drivers and create personalized action plan'},
    {indicator: 'No professional certification obtained or formal training completed in the past 12 months', weight: 10, threshold: 'Low', flagged: 8, action: 'Discuss training budget allocation and professional development priorities with employee'},
    {indicator: 'Total compensation falls below 75th percentile of market rate for comparable role and level', weight: 25, threshold: 'High', flagged: 3, action: 'Submit compensation adjustment request to HR and finance with market data justification'},
    {indicator: 'Productivity metrics show declining trend over two consecutive quarterly performance reviews', weight: 10, threshold: 'Medium', flagged: 2, action: 'Schedule focused 1:1 to understand root causes and develop improvement plan together'},
    {indicator: 'Recurring pattern of missed or frequently rescheduled 1:1 meetings with direct manager', weight: 10, threshold: 'Low', flagged: 5, action: 'Reinforce importance of regular 1:1 cadence and implement calendar blocking policy'}
  ];

  private _getrsPipelineSummary(): {total: number; applicants: number; inPipeline: number; interviewing: number; offers: number; critical: number; avgFillDays: number} {
    const t = this._rsOpenPositions.length;
    const a = this._rsOpenPositions.reduce((s, p) => s + p.applicants, 0);
    const p = this._rsOpenPositions.reduce((s, p) => s + p.pipeline, 0);
    const i = this._rsOpenPositions.reduce((s, p) => s + p.interviews, 0);
    const o = this._rsOpenPositions.reduce((s, p) => s + p.offers, 0);
    const c = this._rsOpenPositions.filter(x => x.urgency === 'critical').length;
    return {total: t, applicants: a, inPipeline: p, interviewing: i, offers: o, critical: c, avgFillDays: 47};
  }

  private _rsMetricDetails = [
    {id: 'rs-M-001', name: 'Mean Time to Detect (MTTD)', value: '4.2 hours', trend: 'improving' as const, target: '< 4 hours', unit: 'hours', source: 'SIEM - Splunk Enterprise Security', methodology: 'Median time from first security alert generation timestamp to analyst acknowledgment in SOAR platform', owner: 'SOC Manager', sla: '4 hours', prev: '5.1 hours', sparkData: [5.8, 5.4, 5.1, 4.9, 4.7, 4.5, 4.3, 4.2], period: 'Last 8 weeks', breakdown: [{src: 'Network IDS (Suricata)', pct: '35%', avg: '3.8h', dir: 'improving'}, {src: 'Endpoint EDR (CrowdStrike)', pct: '28%', avg: '4.1h', dir: 'stable'}, {src: 'Email Gateway (Proofpoint)', pct: '22%', avg: '3.5h', dir: 'improving'}, {src: 'Cloud Security (Prisma)', pct: '10%', avg: '5.2h', dir: 'stable'}, {src: 'User-Reported Incidents', pct: '5%', avg: '6.8h', dir: 'improving'}]},
    {id: 'rs-M-002', name: 'Mean Time to Respond (MTTR)', value: '2.8 hours', trend: 'stable' as const, target: '< 3 hours', unit: 'hours', source: 'SOAR - Cortex XSOAR', methodology: 'Median time from analyst acknowledgment to first containment or remediation action being executed including automated playbook triggers', owner: 'IR Lead', sla: '3 hours', prev: '2.7 hours', sparkData: [3.2, 3.0, 2.9, 2.8, 2.8, 2.9, 2.8, 2.8], period: 'Last 8 weeks', breakdown: [{src: 'Fully Automated Playbooks', pct: '42%', avg: '1.2h', dir: 'improving'}, {src: 'Semi-Automated with Approval', pct: '33%', avg: '2.5h', dir: 'stable'}, {src: 'Manual Investigation Required', pct: '20%', avg: '5.1h', dir: 'stable'}, {src: 'Escalated to L3 Engineering', pct: '5%', avg: '8.3h', dir: 'declining'}]},
    {id: 'rs-M-003', name: 'Patch Compliance Rate', value: '97.6%', trend: 'improving' as const, target: '> 95%', unit: 'percent', source: 'Tenable.io Vulnerability Management', methodology: 'Percentage of critical and high severity vulnerabilities patched within their defined SLA windows (7 days critical, 30 days high)', owner: 'Vuln Manager', sla: '95%', prev: '96.1%', sparkData: [93.2, 94.1, 94.8, 95.3, 95.9, 96.4, 97.0, 97.6], period: 'Last 8 weeks', breakdown: [{src: 'Critical Patches (7d SLA)', pct: '40%', rate: '99.2%', dir: 'stable'}, {src: 'High Patches (30d SLA)', pct: '35%', rate: '97.8%', dir: 'improving'}, {src: 'Medium Patches (90d SLA)', pct: '20%', rate: '95.1%', dir: 'improving'}, {src: 'Low Patches (180d SLA)', pct: '5%', rate: '89.4%', dir: 'improving'}]},
    {id: 'rs-M-004', name: 'Phishing Simulation Click Rate', value: '3.2%', trend: 'improving' as const, target: '< 5%', unit: 'percent', source: 'KnowBe4 + Proofpoint TAP', methodology: 'Percentage of targeted employees who clicked links in simulated phishing campaigns measured monthly across all campaign types', owner: 'Awareness Lead', sla: '5%', prev: '4.1%', sparkData: [6.8, 6.2, 5.5, 5.1, 4.6, 4.1, 3.6, 3.2], period: 'Last 8 months', breakdown: [{src: 'Spear Phishing Simulations', pct: '35%', rate: '5.1%', dir: 'improving'}, {src: 'Generic Mass Phishing Sims', pct: '30%', rate: '2.8%', dir: 'improving'}, {src: 'BEC Simulation Campaigns', pct: '20%', rate: '3.5%', dir: 'stable'}, {src: 'SMS Phishing Simulations', pct: '15%', rate: '1.9%', dir: 'improving'}]},
    {id: 'rs-M-005', name: 'Security Posture Score', value: '784', trend: 'improving' as const, target: '> 750', unit: 'score', source: 'SecurityScorecard + Internal Model', methodology: 'Composite score: external security rating 30%, compliance framework alignment 25%, vulnerability management 25%, security configuration 20%', owner: 'CISO', sla: '> 750', prev: '771', sparkData: [748, 752, 758, 762, 768, 773, 778, 784], period: 'Last 8 weeks', breakdown: [{src: 'External Rating (BitSight)', pct: '30%', score: '791', dir: 'improving'}, {src: 'Compliance Framework Score', pct: '25%', score: '812', dir: 'stable'}, {src: 'Vulnerability Mgmt Score', pct: '25%', score: '745', dir: 'improving'}, {src: 'Security Config Score', pct: '20%', score: '769', dir: 'improving'}]},
    {id: 'rs-M-006', name: 'Vulnerability Backlog Count', value: '142', trend: 'improving' as const, target: '< 150', unit: 'count', source: 'Tenable.io + Qualys Cloud Agent', methodology: 'Total open vulnerabilities across all scanned and assessed assets tracked weekly with severity distribution breakdown', owner: 'Vuln Manager', sla: '< 150', prev: '168', sparkData: [210, 198, 185, 175, 165, 158, 150, 142], period: 'Last 8 weeks', breakdown: [{src: 'Critical (CVSS 9.0+)', pct: '8%', count: '11', dir: 'stable'}, {src: 'High (CVSS 7.0-8.9)', pct: '22%', count: '31', dir: 'improving'}, {src: 'Medium (CVSS 4.0-6.9)', pct: '45%', count: '64', dir: 'improving'}, {src: 'Low (CVSS 0.1-3.9)', pct: '25%', count: '36', dir: 'stable'}]}
  ];

  private _getrsMetricTrends(): {improving: number; stable: number; declining: number; total: number} {
    const imp = this._rsMetricDetails.filter(m => m.trend === 'improving').length;
    const stb = this._rsMetricDetails.filter(m => m.trend === 'stable').length;
    const dec = this._rsMetricDetails.filter(m => m.trend === 'declining').length;
    return {improving: imp, stable: stb, declining: dec, total: this._rsMetricDetails.length};
  }

  private _rsArchChecklist = [
    {id: 'rs-A-001', cat: 'Network Architecture', item: 'Network segmentation between trust zones properly implemented with dedicated firewalls and granular ACLs', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Micro-segmentation via VMware NSX deployed across all production trust zones with automated policy enforcement'},
    {id: 'rs-A-002', cat: 'Network Architecture', item: 'DMZ architecture effectively isolates all public-facing services from internal corporate network segments with defense in depth', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Dual-firewall DMZ with WAF, reverse proxy, and DDoS mitigation layer protecting public-facing assets'},
    {id: 'rs-A-003', cat: 'Network Architecture', item: 'Network traffic flows enforce least-privilege principles with deny-by-default policies and quarterly rule review cycle', sev: 'high' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'All inter-zone traffic requires explicit allow rules with automated drift detection and alerting'},
    {id: 'rs-A-004', cat: 'Network Architecture', item: 'All external communications protected by encrypted tunnels using IPSec or TLS 1.3 with perfect forward secrecy enabled', sev: 'high' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'IKEv2 with PFS on all VPN tunnels, TLS 1.3 for all external API and web communications'},
    {id: 'rs-A-005', cat: 'Identity and Access', item: 'Centralized identity provider manages all user and service accounts with enterprise SSO and automated SCIM provisioning', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'Okta SSO with SAML 2.0 for 247 enterprise applications with automated SCIM provisioning and deprovisioning'},
    {id: 'rs-A-006', cat: 'Identity and Access', item: 'Role-based access control implemented with quarterly access reviews, attestation, and automated deprovisioning workflows', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'Quarterly recertification with just-in-time access provisioning for all administrative tasks'},
    {id: 'rs-A-007', cat: 'Identity and Access', item: 'Privileged access management solution controls all administrative and service accounts with session recording and audit', sev: 'high' as const, status: 'fail' as const, reviewer: 'IAM Lead', notes: '3 legacy service accounts pending CyberArk enrollment with session recording - remediation ETA 2 weeks'},
    {id: 'rs-A-008', cat: 'Identity and Access', item: 'Multi-factor authentication enforced for all users with hardware security tokens required for all privileged access scenarios', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'FIDO2 YubiKey for all admin accounts, push-based MFA for standard users, 99.8% enrollment rate'},
    {id: 'rs-A-009', cat: 'Data Protection', item: 'Data classification policy enforced with automated labeling on all repositories including databases, file shares, and cloud storage', sev: 'high' as const, status: 'partial' as const, reviewer: 'Data Protection Lead', notes: 'Classification framework defined and deployed, enforcement gaps on 4 legacy file shares being actively remediated'},
    {id: 'rs-A-010', cat: 'Data Protection', item: 'AES-256 encryption at rest applied to all sensitive data stores including databases, backups, and cloud storage volumes', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Data Protection Lead', notes: 'Full-disk encryption on all servers, TDE on all SQL databases, SSE-KMS on all cloud storage buckets'},
    {id: 'rs-A-011', cat: 'Data Protection', item: 'Data loss prevention controls actively monitor and prevent unauthorized data exfiltration across email, endpoint, cloud, and network', sev: 'high' as const, status: 'pass' as const, reviewer: 'Data Protection Lead', notes: 'Comprehensive DLP policies active across email, endpoint, cloud applications, and network with ML-based detection'},
    {id: 'rs-A-012', cat: 'Data Protection', item: 'Encrypted off-site backups with tested restore procedures on quarterly schedule including immutable backup copies', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Infrastructure Lead', notes: '3-2-1 backup strategy with immutable backup copies and quarterly restore testing with documented RTO/RPO'},
    {id: 'rs-A-013', cat: 'Application Security', item: 'Secure SDLC mandates SAST, DAST, and SCA scanning integrated into all CI/CD pipelines with quality gate enforcement', sev: 'high' as const, status: 'pass' as const, reviewer: 'AppSec Lead', notes: 'All 34 CI/CD pipelines include security gates with quality thresholds and automatic pull request blocking'},
    {id: 'rs-A-014', cat: 'Application Security', item: 'API gateway enforces authentication, authorization, rate limiting, and schema validation for all internal and external APIs', sev: 'high' as const, status: 'pass' as const, reviewer: 'AppSec Lead', notes: 'Kong API Gateway with OAuth2 authentication, rate limiting, OpenAPI schema validation, and analytics dashboard'},
    {id: 'rs-A-015', cat: 'Application Security', item: 'Container security includes image scanning, runtime protection, and Kubernetes network policies across all clusters', sev: 'high' as const, status: 'partial' as const, reviewer: 'Cloud Security Lead', notes: 'Trivy image scanning on all registries, Falco runtime protection deployed in 80% of Kubernetes clusters'},
    {id: 'rs-A-016', cat: 'Monitoring and Detection', item: 'SIEM platform collects logs from all critical systems with real-time correlation rules and automated alerting', sev: 'critical' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'Splunk Enterprise Security with 98% log source coverage and over 1,200 active correlation rules'},
    {id: 'rs-A-017', cat: 'Monitoring and Detection', item: 'EDR solution provides continuous monitoring and behavioral detection across all managed endpoints in the fleet', sev: 'high' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'CrowdStrike Falcon deployed on 99.2% of managed endpoints with 24/7 managed detection and response'},
    {id: 'rs-A-018', cat: 'Monitoring and Detection', item: 'Executive security dashboards provide real-time posture visibility with automated alerting and weekly summary reporting', sev: 'medium' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'Custom PowerBI dashboards with automated alerting thresholds and weekly executive summary reports'},
    {id: 'rs-A-019', cat: 'Cloud Security', item: 'CSPM continuously monitors cloud environments and remediates misconfigurations with automated playbook execution', sev: 'high' as const, status: 'pass' as const, reviewer: 'Cloud Security Lead', notes: 'Prisma Cloud with 450+ compliance checks and automated remediation playbooks across AWS and Azure'},
    {id: 'rs-A-020', cat: 'Cloud Security', item: 'Infrastructure as Code templates scanned for security misconfigurations before any deployment to production environments', sev: 'high' as const, status: 'partial' as const, reviewer: 'Cloud Security Lead', notes: 'Checkov scanning active for Terraform, cfn-nag scanning for CloudFormation templates pending setup'}
  ];

  private _rsDesignPatterns = [
    {pattern: 'Defense in Depth', adherence: 'strong' as const, score: 92, desc: 'Multiple independent security layers provide redundant protection across network, application, and data layers', examples: ['WAF + IPS + EDR layered defense', 'MFA + PAM + RBAC access controls', 'Encryption at rest + in transit + in processing']},
    {pattern: 'Zero Trust Architecture', adherence: 'moderate' as const, score: 71, desc: 'Never trust always verify principle applied to all access decisions regardless of network location or user context', examples: ['Micro-segmentation deployed in production', 'UEBA continuous verification active', 'Legacy flat network segments in staging environment']},
    {pattern: 'Least Privilege Access', adherence: 'strong' as const, score: 88, desc: 'Users and services granted minimum necessary permissions with just-in-time provisioning and regular review cycles', examples: ['Just-in-time admin access provisioning', 'Quarterly permission review cycles', 'Comprehensive service account inventory maintained']},
    {pattern: 'Secure by Default', adherence: 'moderate' as const, score: 76, desc: 'Secure configurations applied at deployment with automated compliance checking and drift detection capabilities', examples: ['CIS benchmarks applied to new systems', 'Default credential rotation enforced', 'Legacy system hardening backlog tracked']}
  ];

  private _getrsArchSummary(): {total: number; passed: number; failed: number; partial: number; criticalFails: number; score: number} {
    const p = this._rsArchChecklist.filter(c => c.status === 'pass').length;
    const f = this._rsArchChecklist.filter(c => c.status === 'fail').length;
    const pa = this._rsArchChecklist.filter(c => c.status === 'partial').length;
    const cf = this._rsArchChecklist.filter(c => c.status === 'fail' && c.sev === 'critical').length;
    return {total: this._rsArchChecklist.length, passed: p, failed: f, partial: pa, criticalFails: cf, score: Math.round((p / this._rsArchChecklist.length) * 100)};
  }

  private _getrsApprovalStatus(): {stage: string; approvers: Array<{name: string; role: string; status: string}>; nextAction: string} {
    return {stage: 'Final Review Stage', approvers: [
      {name: 'Alex Chen', role: 'Security Architect', status: 'approved'},
      {name: 'Sarah Kim', role: 'CISO', status: 'approved'},
      {name: 'Mike Johnson', role: 'VP Engineering', status: 'pending'},
      {name: 'Board Risk Committee', role: 'Governance Oversight', status: 'pending'}
    ], nextAction: 'Awaiting VP Engineering review and final governance sign-off before board presentation'};
  }


  private _e25RiskAssessmentWorkflow = [
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

  private _e25RiskMatrix5x5 = [
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

  private _e25TreatmentOptions = [
    {id: 'e25-T-001', riskId: 'RSK-042', risk: 'Ransomware Attack on Critical Infrastructure', before: 20, after: 6, strategy: 'Mitigate', controls: ['Next-gen EDR with behavioral detection and automated response', 'Zero-trust network micro-segmentation isolating critical assets', 'Immutable offline backup rotation with quarterly recovery testing', 'Incident response retainer with 1-hour response SLA'], cost: '$450K/yr', roi: '78% reduction vs $2.8M potential loss', timeline: 'Q3 2026', status: 'approved' as const},
    {id: 'e25-T-002', riskId: 'RSK-018', risk: 'Insider Data Exfiltration via Cloud Storage', before: 15, after: 5, strategy: 'Mitigate', controls: ['Comprehensive DLP policies for all cloud applications and endpoints', 'UEBA behavioral analytics for anomalous access pattern detection', 'Endpoint restrictions on USB and personal cloud storage services', 'CASB integration for shadow IT discovery and policy enforcement'], cost: '$180K/yr', roi: '67% reduction vs $1.2M potential loss', timeline: 'Q2 2026', status: 'approved' as const},
    {id: 'e25-T-003', riskId: 'RSK-067', risk: 'Supply Chain Compromise via Third-Party Component', before: 12, after: 8, strategy: 'Transfer', controls: ['Software supply chain insurance policy covering vendor incidents', 'SCA scanning requirements in all vendor procurement contracts', 'SBOM requirements and continuous monitoring for third-party components', 'Vendor security assessment program with annual re-evaluation'], cost: '$95K/yr', roi: '33% reduction vs $800K potential loss', timeline: 'Q4 2026', status: 'in_review' as const},
    {id: 'e25-T-004', riskId: 'RSK-033', risk: 'Phishing-Driven Credential Theft Campaign', before: 16, after: 4, strategy: 'Mitigate', controls: ['AI-powered email filtering with real-time threat intelligence feeds', 'Monthly mandatory phishing simulations with targeted follow-up training', 'Hardware MFA enforcement across all users with passwordless transition', 'Security awareness program with role-specific training tracks'], cost: '$120K/yr', roi: '75% reduction vs $1.5M potential loss', timeline: 'Q2 2026', status: 'approved' as const},
    {id: 'e25-T-005', riskId: 'RSK-091', risk: 'Zero-Day Exploit on Public-Facing Application', before: 10, after: 8, strategy: 'Accept', controls: ['WAF with virtual patching capability and rapid rule deployment', 'RASP runtime application self-protection on all production web apps', 'Incident response retainer with 4-hour response SLA commitment', 'Bug bounty program for proactive vulnerability discovery'], cost: '$60K/yr', roi: '20% reduction vs $500K potential loss', timeline: 'Ongoing', status: 'accepted' as const},
    {id: 'e25-T-006', riskId: 'RSK-055', risk: 'GDPR Regulatory Non-Compliance Penalty', before: 15, after: 4, strategy: 'Mitigate', controls: ['Dedicated Data Protection Officer with quarterly board reporting', 'Automated compliance monitoring platform with real-time dashboards', 'Quarterly DPIA reviews for all high-risk processing activities', 'Privacy by design framework integrated into product development lifecycle'], cost: '$220K/yr', roi: '73% reduction vs $4M+ potential regulatory penalty', timeline: 'Q3 2026', status: 'approved' as const}
  ];

  private _e25ComplianceRules = [
    {id: 'e25-C-001', name: 'Password Policy Compliance', framework: 'NIST 800-53 IA-5', desc: 'Verify all accounts meet minimum password complexity, length, diversity, and rotation requirements defined in the security policy', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'pass' as const, passRate: 94.2, violations: 12, autoFix: true as const, fix: 'Force password reset within 24h', history: [{d: '04-22', r: 'pass', v: 12}, {d: '04-21', r: 'pass', v: 14}, {d: '04-20', r: 'fail', v: 18}, {d: '04-19', r: 'pass', v: 15}, {d: '04-18', r: 'pass', v: 13}]},
    {id: 'e25-C-002', name: 'MFA Enrollment Verification', framework: 'NIST 800-53 IA-2', desc: 'Ensure all privileged and standard user accounts have multi-factor authentication properly enrolled and actively enforced', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'fail' as const, passRate: 87.5, violations: 34, autoFix: true as const, fix: 'Send mandatory enrollment notice with 48h deadline', history: [{d: '04-22', r: 'fail', v: 34}, {d: '04-21', r: 'fail', v: 31}, {d: '04-20', r: 'fail', v: 28}, {d: '04-19', r: 'fail', v: 25}, {d: '04-18', r: 'fail', v: 22}]},
    {id: 'e25-C-003', name: 'Inactive Account Review', framework: 'NIST 800-53 AC-2', desc: 'Identify and disable accounts inactive for more than 90 days with automatic escalation at the 120-day threshold', enabled: true as const, freq: 'Weekly', lastRun: '2026-04-21T00:00Z', result: 'pass' as const, passRate: 96.8, violations: 5, autoFix: true as const, fix: 'Auto-disable at 120 days with manager notification', history: [{d: '04-21', r: 'pass', v: 5}, {d: '04-14', r: 'pass', v: 7}, {d: '04-07', r: 'pass', v: 9}, {d: '03-31', r: 'pass', v: 11}, {d: '03-24', r: 'pass', v: 13}]},
    {id: 'e25-C-004', name: 'Encryption Standards Check', framework: 'NIST 800-53 SC-28', desc: 'Verify all production storage volumes use AES-256 or equivalent encryption with valid non-expired certificates', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'pass' as const, passRate: 99.1, violations: 2, autoFix: false as const, fix: 'Create priority ticket for manual remediation', history: [{d: '04-22', r: 'pass', v: 2}, {d: '04-21', r: 'pass', v: 2}, {d: '04-20', r: 'pass', v: 3}, {d: '04-19', r: 'pass', v: 3}, {d: '04-18', r: 'pass', v: 4}]},
    {id: 'e25-C-005', name: 'Firewall Baseline Compliance', framework: 'NIST 800-53 SC-7', desc: 'Validate firewall rules against approved baseline to detect unauthorized modifications, drift, or orphaned rules', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T06:00Z', result: 'fail' as const, passRate: 91.3, violations: 18, autoFix: true as const, fix: 'Auto-revert non-compliant rules to baseline', history: [{d: '04-22', r: 'fail', v: 18}, {d: '04-21', r: 'pass', v: 12}, {d: '04-20', r: 'pass', v: 15}, {d: '04-19', r: 'pass', v: 14}, {d: '04-18', r: 'fail', v: 20}]},
    {id: 'e25-C-006', name: 'Patch SLA Compliance', framework: 'CIS Benchmark L2', desc: 'Check all production systems against critical and high patch SLA requirements with overdue flagging', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T08:00Z', result: 'pass' as const, passRate: 97.6, violations: 8, autoFix: false as const, fix: 'Escalate overdue patches for expedited deployment', history: [{d: '04-22', r: 'pass', v: 8}, {d: '04-21', r: 'pass', v: 10}, {d: '04-20', r: 'pass', v: 12}, {d: '04-19', r: 'pass', v: 11}, {d: '04-18', r: 'pass', v: 14}]},
    {id: 'e25-C-007', name: 'Data Classification Labels', framework: 'GDPR Art. 30', desc: 'Verify all databases, file shares, and cloud repositories have appropriate classification labels applied', enabled: true as const, freq: 'Weekly', lastRun: '2026-04-20T00:00Z', result: 'fail' as const, passRate: 82.4, violations: 45, autoFix: false as const, fix: 'Generate review tasks for data owners', history: [{d: '04-20', r: 'fail', v: 45}, {d: '04-13', r: 'fail', v: 42}, {d: '04-06', r: 'fail', v: 38}, {d: '03-30', r: 'fail', v: 35}, {d: '03-23', r: 'pass', v: 30}]},
    {id: 'e25-C-008', name: 'Privileged Access Review', framework: 'SOX AC-6', desc: 'Review and validate all privileged access assignments on quarterly recertification schedule', enabled: true as const, freq: 'Monthly', lastRun: '2026-04-01T00:00Z', result: 'pass' as const, passRate: 93.7, violations: 22, autoFix: false as const, fix: 'Initiate recertification workflow with approvals', history: [{d: '04-01', r: 'pass', v: 22}, {d: '03-01', r: 'pass', v: 25}, {d: '02-01', r: 'pass', v: 28}, {d: '01-01', r: 'pass', v: 30}, {d: '12-01', r: 'pass', v: 32}]},
    {id: 'e25-C-009', name: 'SIEM Log Coverage', framework: 'NIST 800-53 AU-2', desc: 'Verify all critical systems have logging enabled and actively forwarding to the centralized SIEM platform', enabled: true as const, freq: 'Weekly', lastRun: '2026-04-21T12:00Z', result: 'pass' as const, passRate: 95.5, violations: 7, autoFix: true as const, fix: 'Deploy missing log agents via config management', history: [{d: '04-21', r: 'pass', v: 7}, {d: '04-14', r: 'pass', v: 9}, {d: '04-07', r: 'pass', v: 11}, {d: '03-31', r: 'pass', v: 10}, {d: '03-24', r: 'pass', v: 13}]},
    {id: 'e25-C-010', name: 'Certificate Expiry Monitor', framework: 'NIST 800-53 SC-13', desc: 'Monitor all TLS/SSL certificates for upcoming expiry within 30-day warning windows', enabled: true as const, freq: 'Daily', lastRun: '2026-04-22T14:00Z', result: 'pass' as const, passRate: 98.9, violations: 3, autoFix: true as const, fix: 'Trigger auto-renewal via ACME protocol', history: [{d: '04-22', r: 'pass', v: 3}, {d: '04-21', r: 'pass', v: 3}, {d: '04-20', r: 'pass', v: 4}, {d: '04-19', r: 'pass', v: 4}, {d: '04-18', r: 'pass', v: 5}]}
  ];

  private _e25TalentPositions = [
    {id: 'e25-H-001', title: 'Senior Penetration Tester', dept: 'Red Team', level: 'Senior', loc: 'Remote US', salary: '$165K-$195K', posted: '2026-03-15', applicants: 23, pipeline: 8, interviews: 4, offers: 1, urgency: 'high' as const, manager: 'Alex Chen', skills: ['Burp Suite', 'Metasploit', 'Cobalt Strike', 'Python', 'OWASP Top 10'], nice: ['OSCP/OSCE', 'Bug bounty', 'Cloud pentest']},
    {id: 'e25-H-002', title: 'Cloud Security Engineer', dept: 'Cloud Security', level: 'Mid-Senior', loc: 'SF/Remote', salary: '$155K-$180K', posted: '2026-03-20', applicants: 45, pipeline: 12, interviews: 6, offers: 2, urgency: 'high' as const, manager: 'Mike Johnson', skills: ['AWS/Azure/GCP', 'Terraform', 'Kubernetes', 'IAM', 'CSPM'], nice: ['CCSP', 'CKS', 'Serverless']},
    {id: 'e25-H-003', title: 'SOC Analyst L2', dept: 'Security Operations', level: 'Mid', loc: 'Austin TX', salary: '$105K-$130K', posted: '2026-04-01', applicants: 67, pipeline: 18, interviews: 8, offers: 0, urgency: 'medium' as const, manager: 'Lisa Park', skills: ['SIEM', 'Incident triage', 'Malware analysis', 'TCP/IP'], nice: ['GCIA', 'SOAR', 'Kill chain']},
    {id: 'e25-H-004', title: 'Staff Security Architect', dept: 'Architecture', level: 'Staff', loc: 'Remote US', salary: '$200K-$240K', posted: '2026-02-28', applicants: 12, pipeline: 3, interviews: 2, offers: 0, urgency: 'critical' as const, manager: 'David Lee', skills: ['Enterprise arch', 'Zero trust', 'Risk frameworks', 'Board comms'], nice: ['CISSP+SABSA', 'Team building', 'Speaker']},
    {id: 'e25-H-005', title: 'GRC Analyst', dept: 'GRC', level: 'Mid', loc: 'NY/Remote', salary: '$110K-$135K', posted: '2026-04-05', applicants: 34, pipeline: 9, interviews: 3, offers: 1, urgency: 'medium' as const, manager: 'Rachel Green', skills: ['ISO 27001', 'SOC 2', 'Risk assessment', 'Audit'], nice: ['CRISC', 'CISA', 'GDPR']},
    {id: 'e25-H-006', title: 'Threat Intel Analyst', dept: 'Threat Intel', level: 'Mid-Senior', loc: 'Remote US', salary: '$140K-$170K', posted: '2026-03-25', applicants: 19, pipeline: 5, interviews: 2, offers: 0, urgency: 'low' as const, manager: 'James Wilson', skills: ['MITRE ATT&CK', 'OSINT', 'Threat modeling', 'Reverse eng'], nice: ['CTIA', 'Nation-state', 'Dark web']},
    {id: 'e25-H-007', title: 'AppSec Engineer', dept: 'AppSec', level: 'Senior', loc: 'Seattle/Remote', salary: '$160K-$190K', posted: '2026-04-10', applicants: 28, pipeline: 7, interviews: 3, offers: 0, urgency: 'medium' as const, manager: 'Emily Zhang', skills: ['SAST/DAST/SCA', 'Secure SDLC', 'Code review', 'CI/CD'], nice: ['CSSLP', 'Mobile security']},
    {id: 'e25-H-008', title: 'IAM Engineer', dept: 'IAM', level: 'Mid', loc: 'Remote US', salary: '$135K-$160K', posted: '2026-04-08', applicants: 31, pipeline: 10, interviews: 5, offers: 1, urgency: 'medium' as const, manager: 'Chris Martinez', skills: ['Okta/Azure AD', 'SAML/OIDC', 'PAM', 'RBAC'], nice: ['CISSP', 'Zero trust IAM']}
  ];

  private _e25InterviewScorecard = [
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

  private _e25OnboardingSteps = [
    {id: 'e25-OB-01', item: 'Provision security-hardened laptop, monitors, peripherals, and configured workstation image with all required security tools', cat: 'IT Setup', day: 'Day 1', owner: 'IT Operations'},
    {id: 'e25-OB-02', item: 'Create AD account, email, Slack, VPN, SSO enrollment, and all required application access accounts', cat: 'Access', day: 'Day 1', owner: 'IAM Team'},
    {id: 'e25-OB-03', item: 'Grant security tooling access: SIEM console, EDR dashboard, vuln scanner, pentest platforms, SOAR', cat: 'Tools', day: 'Day 1-2', owner: 'SOC Manager'},
    {id: 'e25-OB-04', item: 'Complete MFA enrollment, security awareness onboarding course, and acceptable use policy acknowledgment', cat: 'Security', day: 'Day 1', owner: 'Awareness Team'},
    {id: 'e25-OB-05', item: 'Sign NDA, employment agreement, IP assignment, and code of conduct documents with HR', cat: 'HR', day: 'Day 1', owner: 'Human Resources'},
    {id: 'e25-OB-06', item: 'Introduction meetings with direct team members and key cross-functional stakeholders', cat: 'Integration', day: 'Week 1', owner: 'Hiring Manager'},
    {id: 'e25-OB-07', item: 'Security architecture overview, tooling walkthrough, and operational runbook review sessions', cat: 'Training', day: 'Week 1-2', owner: 'Security Architect'},
    {id: 'e25-OB-08', item: 'Shadow experienced team member on active incident response and threat hunting investigations', cat: 'Mentoring', day: 'Week 2-3', owner: 'SOC Lead'},
    {id: 'e25-OB-09', item: 'Set up individual certification study plan aligned with role requirements and career goals', cat: 'Development', day: 'Week 2', owner: 'Hiring Manager'},
    {id: 'e25-OB-10', item: 'Establish 30-60-90 day goals, define success metrics, and schedule first performance checkpoint', cat: 'Goals', day: 'Week 1', owner: 'Hiring Manager'}
  ];

  private _e25MetricsDashboard = [
    {id: 'e25-MTD-001', name: 'Mean Time to Detect (MTTD)', value: '4.2 hours', trend: 'improving' as const, target: '< 4 hours', source: 'SIEM - Splunk', method: 'Median time from first alert to analyst acknowledgment', owner: 'SOC Manager', sla: '4 hours', prev: '5.1 hours', spark: [5.8, 5.4, 5.1, 4.9, 4.7, 4.5, 4.3, 4.2], breakdown: [{src: 'Network IDS', pct: '35%', avg: '3.8h'}, {src: 'Endpoint EDR', pct: '28%', avg: '4.1h'}, {src: 'Email Gateway', pct: '22%', avg: '3.5h'}, {src: 'Cloud Security', pct: '10%', avg: '5.2h'}, {src: 'User Reports', pct: '5%', avg: '6.8h'}]},
    {id: 'e25-MTD-002', name: 'Mean Time to Respond (MTTR)', value: '2.8 hours', trend: 'stable' as const, target: '< 3 hours', source: 'SOAR - XSOAR', method: 'Median time from acknowledgment to first containment action', owner: 'IR Lead', sla: '3 hours', prev: '2.7 hours', spark: [3.2, 3.0, 2.9, 2.8, 2.8, 2.9, 2.8, 2.8], breakdown: [{src: 'Auto Playbooks', pct: '42%', avg: '1.2h'}, {src: 'Semi-Auto', pct: '33%', avg: '2.5h'}, {src: 'Manual', pct: '20%', avg: '5.1h'}, {src: 'L3 Escalation', pct: '5%', avg: '8.3h'}]},
    {id: 'e25-MTD-003', name: 'Patch Compliance Rate', value: '97.6%', trend: 'improving' as const, target: '> 95%', source: 'Tenable.io', method: 'Pct of critical/high vulns patched within SLA windows', owner: 'Vuln Manager', sla: '95%', prev: '96.1%', spark: [93.2, 94.1, 94.8, 95.3, 95.9, 96.4, 97.0, 97.6], breakdown: [{src: 'Critical (7d)', pct: '40%', rate: '99.2%'}, {src: 'High (30d)', pct: '35%', rate: '97.8%'}, {src: 'Medium (90d)', pct: '20%', rate: '95.1%'}, {src: 'Low (180d)', pct: '5%', rate: '89.4%'}]},
    {id: 'e25-MTD-004', name: 'Phishing Click Rate', value: '3.2%', trend: 'improving' as const, target: '< 5%', source: 'KnowBe4 + Proofpoint', method: 'Pct of users clicking simulated phishing links monthly', owner: 'Awareness Lead', sla: '5%', prev: '4.1%', spark: [6.8, 6.2, 5.5, 5.1, 4.6, 4.1, 3.6, 3.2], breakdown: [{src: 'Spear Phishing', pct: '35%', rate: '5.1%'}, {src: 'Generic Phishing', pct: '30%', rate: '2.8%'}, {src: 'BEC Sim', pct: '20%', rate: '3.5%'}, {src: 'SMS Phishing', pct: '15%', rate: '1.9%'}]},
    {id: 'e25-MTD-005', name: 'Security Posture Score', value: '784', trend: 'improving' as const, target: '> 750', source: 'SecurityScorecard', method: 'Composite: external 30%, compliance 25%, vuln 25%, config 20%', owner: 'CISO', sla: '> 750', prev: '771', spark: [748, 752, 758, 762, 768, 773, 778, 784], breakdown: [{src: 'External Rating', pct: '30%', score: '791'}, {src: 'Compliance', pct: '25%', score: '812'}, {src: 'Vuln Mgmt', pct: '25%', score: '745'}, {src: 'Config', pct: '20%', score: '769'}]},
    {id: 'e25-MTD-006', name: 'Vulnerability Backlog', value: '142', trend: 'improving' as const, target: '< 150', source: 'Tenable + Qualys', method: 'Total open vulns across all scanned assets tracked weekly', owner: 'Vuln Manager', sla: '< 150', prev: '168', spark: [210, 198, 185, 175, 165, 158, 150, 142], breakdown: [{src: 'Critical', pct: '8%', count: '11'}, {src: 'High', pct: '22%', count: '31'}, {src: 'Medium', pct: '45%', count: '64'}, {src: 'Low', pct: '25%', count: '36'}]}
  ];

  private _e25ArchReview = [
    {id: 'e25-AR-001', cat: 'Network', item: 'Network segmentation between trust zones with dedicated firewalls and granular ACLs', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Micro-segmentation via NSX across all production zones'},
    {id: 'e25-AR-002', cat: 'Network', item: 'DMZ architecture isolating public services from internal network', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Dual-firewall DMZ with WAF and DDoS mitigation'},
    {id: 'e25-AR-003', cat: 'Network', item: 'Least-privilege traffic flows with deny-by-default and quarterly review', sev: 'high' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'Explicit allow rules with automated drift detection'},
    {id: 'e25-AR-004', cat: 'Network', item: 'Encrypted external communications with IPSec/TLS 1.3 and PFS', sev: 'high' as const, status: 'pass' as const, reviewer: 'Network Architect', notes: 'IKEv2 with PFS, TLS 1.3 for all external APIs'},
    {id: 'e25-AR-005', cat: 'Identity', item: 'Centralized IdP with SSO and automated SCIM provisioning', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'Okta SSO SAML 2.0 for 247 apps with SCIM'},
    {id: 'e25-AR-006', cat: 'Identity', item: 'RBAC with quarterly reviews and automated deprovisioning', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'Quarterly recertification with JIT admin access'},
    {id: 'e25-AR-007', cat: 'Identity', item: 'PAM controlling all admin and service accounts with session recording', sev: 'high' as const, status: 'fail' as const, reviewer: 'IAM Lead', notes: '3 legacy accounts pending CyberArk enrollment'},
    {id: 'e25-AR-008', cat: 'Identity', item: 'MFA enforced for all users, hardware tokens for privileged access', sev: 'critical' as const, status: 'pass' as const, reviewer: 'IAM Lead', notes: 'FIDO2 for admins, push MFA for users, 99.8% enrollment'},
    {id: 'e25-AR-009', cat: 'Data', item: 'Data classification enforced with automated labeling on all repos', sev: 'high' as const, status: 'partial' as const, reviewer: 'Data Protection Lead', notes: 'Framework deployed, gaps on 4 legacy file shares'},
    {id: 'e25-AR-010', cat: 'Data', item: 'AES-256 encryption at rest for all sensitive data stores', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Data Protection Lead', notes: 'Full-disk, TDE on DBs, SSE-KMS on cloud storage'},
    {id: 'e25-AR-011', cat: 'Data', item: 'DLP monitoring and preventing unauthorized data exfiltration', sev: 'high' as const, status: 'pass' as const, reviewer: 'Data Protection Lead', notes: 'DLP active on email, endpoint, cloud, and network'},
    {id: 'e25-AR-012', cat: 'Data', item: 'Encrypted off-site backups with quarterly restore testing', sev: 'critical' as const, status: 'pass' as const, reviewer: 'Infrastructure Lead', notes: '3-2-1 strategy with immutable backups'},
    {id: 'e25-AR-013', cat: 'AppSec', item: 'Secure SDLC with SAST, DAST, SCA in all CI/CD pipelines', sev: 'high' as const, status: 'pass' as const, reviewer: 'AppSec Lead', notes: '34 pipelines with security gates and PR blocking'},
    {id: 'e25-AR-014', cat: 'AppSec', item: 'API gateway with auth, rate limiting, schema validation', sev: 'high' as const, status: 'pass' as const, reviewer: 'AppSec Lead', notes: 'Kong with OAuth2, rate limits, OpenAPI validation'},
    {id: 'e25-AR-015', cat: 'AppSec', item: 'Container security with image scanning and runtime protection', sev: 'high' as const, status: 'partial' as const, reviewer: 'Cloud Security Lead', notes: 'Trivy scanning, Falco runtime in 80% of clusters'},
    {id: 'e25-AR-016', cat: 'Monitoring', item: 'SIEM collecting from all critical systems with correlation rules', sev: 'critical' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'Splunk 98% coverage with 1200+ correlation rules'},
    {id: 'e25-AR-017', cat: 'Monitoring', item: 'EDR with behavioral detection on all managed endpoints', sev: 'high' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'CrowdStrike on 99.2% endpoints with 24/7 MDR'},
    {id: 'e25-AR-018', cat: 'Monitoring', item: 'Executive dashboards with real-time posture visibility', sev: 'medium' as const, status: 'pass' as const, reviewer: 'SOC Manager', notes: 'PowerBI dashboards with weekly exec summaries'},
    {id: 'e25-AR-019', cat: 'Cloud', item: 'CSPM monitoring and remediating cloud misconfigurations', sev: 'high' as const, status: 'pass' as const, reviewer: 'Cloud Security Lead', notes: 'Prisma Cloud 450+ checks with auto-remediation'},
    {id: 'e25-AR-020', cat: 'Cloud', item: 'IaC templates scanned before deployment to production', sev: 'high' as const, status: 'partial' as const, reviewer: 'Cloud Security Lead', notes: 'Checkov for Terraform, cfn-nag for CloudFormation pending'}
  ];

  private _gete25RiskProgress(): number {
    return Math.round(this._e25RiskAssessmentWorkflow.filter(s => s.status === 'completed').length / this._e25RiskAssessmentWorkflow.length * 100);
  }

  private _gete25TreatmentSummary(): {total: number; approved: number; avgReduction: number; investment: string} {
    const a = this._e25TreatmentOptions.filter(r => r.status === 'approved').length;
    const avg = this._e25TreatmentOptions.reduce((s, r) => s + ((r.before - r.after) / r.before * 100), 0) / this._e25TreatmentOptions.length;
    return {total: this._e25TreatmentOptions.length, approved: a, avgReduction: Math.round(avg), investment: '$1.125M annually'};
  }

  private _gete25RuleSummary(): {total: number; passing: number; failing: number; avgRate: number; violations: number} {
    const p = this._e25ComplianceRules.filter(r => r.result === 'pass').length;
    const f = this._e25ComplianceRules.filter(r => r.result === 'fail').length;
    const avg = this._e25ComplianceRules.reduce((s, r) => s + r.passRate, 0) / this._e25ComplianceRules.length;
    const v = this._e25ComplianceRules.reduce((s, r) => s + r.violations, 0);
    return {total: this._e25ComplianceRules.length, passing: p, failing: f, avgRate: Math.round(avg * 10) / 10, violations: v};
  }

  private _gete25PipelineStats(): {positions: number; applicants: number; interviewing: number; offers: number; critical: number} {
    const t = this._e25TalentPositions.length;
    const a = this._e25TalentPositions.reduce((s, p) => s + p.applicants, 0);
    const i = this._e25TalentPositions.reduce((s, p) => s + p.interviews, 0);
    const o = this._e25TalentPositions.reduce((s, p) => s + p.offers, 0);
    const c = this._e25TalentPositions.filter(x => x.urgency === 'critical').length;
    return {positions: t, applicants: a, interviewing: i, offers: o, critical: c};
  }

  private _gete25MetricTrends(): {improving: number; stable: number; total: number} {
    const imp = this._e25MetricsDashboard.filter(m => m.trend === 'improving').length;
    const stb = this._e25MetricsDashboard.filter(m => m.trend === 'stable').length;
    return {improving: imp, stable: stb, total: this._e25MetricsDashboard.length};
  }

  private _gete25ArchScore(): {total: number; passed: number; failed: number; partial: number; score: number} {
    const p = this._e25ArchReview.filter(c => c.status === 'pass').length;
    const f = this._e25ArchReview.filter(c => c.status === 'fail').length;
    const pa = this._e25ArchReview.filter(c => c.status === 'partial').length;
    return {total: this._e25ArchReview.length, passed: p, failed: f, partial: pa, score: Math.round((p / this._e25ArchReview.length) * 100)};
  }

  // === Security Program Health Scorecard (Round 36 - Block A) ===
  private _hsScores: Array<{id: string; name: string; score: number; trend: string; weight: number}> = [];
  private _hsOverall: number = 0;
  private _hsHistory: Array<{month: string; score: number}> = [];
  private _hsRecommendations: Array<{id: number; dimension: string; action: string; priority: string; effort: string}> = [];

  private _initHsScorecard() {
    const dims = ['Governance & Policy', 'Technical Controls', 'Threat Detection', 'Incident Response',
      'Vulnerability Management', 'Compliance & Audit', 'Security Awareness', 'Third-Party Risk'];
    const trends = ['improving', 'stable', 'declining', 'improving', 'stable', 'improving', 'declining', 'stable'];
    const weights = [15, 20, 15, 12, 13, 10, 8, 7];
    this._hsScores = dims.map((name, i) => ({
      id: 'hs-dim-' + i, name, score: 55 + ((idx * 7 + i * 11) % 40),
      trend: trends[i], weight: weights[i]
    }));
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    let base = 58 + (idx % 15);
    this._hsHistory = months.map((m, i) => ({month: m, score: Math.min(100, base + i * 2 + (idx % 3))}));
    this._hsOverall = Math.round(this._hsScores.reduce((s, d) => s + d.score * d.weight, 0) / 100);
    this._hsRecommendations = [
      {id: 1, dimension: dims[0], action: 'Update security policies to reflect current threat landscape', priority: 'high', effort: 'medium'},
      {id: 2, dimension: dims[1], action: 'Deploy EDR solution across remaining endpoints', priority: 'high', effort: 'high'},
      {id: 3, dimension: dims[2], action: 'Tune SIEM correlation rules to reduce false positives', priority: 'medium', effort: 'low'},
      {id: 4, dimension: dims[3], action: 'Conduct tabletop exercise for ransomware scenarios', priority: 'high', effort: 'medium'},
      {id: 5, dimension: dims[4], action: 'Reduce mean time to remediate critical vulnerabilities below 7 days', priority: 'medium', effort: 'medium'},
      {id: 6, dimension: dims[5], action: 'Prepare evidence packages for upcoming SOC 2 audit', priority: 'high', effort: 'high'},
      {id: 7, dimension: dims[6], action: 'Launch phishing simulation campaign for engineering teams', priority: 'medium', effort: 'low'},
      {id: 8, dimension: dims[7], action: 'Complete security assessments for top 20 critical vendors', priority: 'medium', effort: 'high'},
    ];
  }

  private _hsGetStatusColor(score: number): string {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }

  private _hsGetTrendIcon(trend: string): string {
    if (trend === 'improving') return '\u2191';
    if (trend === 'declining') return '\u2193';
    return '\u2192';
  }

  private _hsCalculateRisk(): {level: string; score: number; factors: string[]} {
    const lowScores = this._hsScores.filter(d => d.score < 60);
    const declining = this._hsScores.filter(d => d.trend === 'declining');
    const riskScore = Math.max(0, 100 - this._hsOverall + (lowScores.length * 5) + (declining.length * 8));
    const level = riskScore > 60 ? 'critical' : riskScore > 35 ? 'elevated' : 'moderate';
    const factors = [];
    if (lowScores.length > 0) factors.push(lowScores.length + ' dimensions below 60');
    if (declining.length > 0) factors.push(declining.length + ' dimensions declining');
    if (this._hsOverall < 70) factors.push('Overall score below target');
    return {level, score: Math.min(100, riskScore), factors};
  }

  private _hsGetRadarData(): Array<{dimension: string; current: number; target: number; gap: number}> {
    return this._hsScores.map(d => ({
      dimension: d.name, current: d.score, target: 85,
      gap: 85 - d.score
    }));
  }

  private _hsCompareWithIndustry(): {ours: number; industry: number; percentile: number} {
    const industryAvg = 72 + (idx % 5);
    const ours = this._hsOverall;
    const percentile = Math.min(99, Math.max(1, Math.round(50 + (ours - industryAvg) * 3)));
    return {ours, industryAvg, percentile};
  }


  // === Security Metrics Deep Dive (Round 36 - Pass 2 - Block C) ===

  private _smKpis: Array<{id: string; name: string; value: number; unit: string; target: number;
    status: string; trend: string; dataPoints: number[]}> = [];
  private _smCategories: Array<{name: string; kpis: string[]; score: number; weight: number}> = [];

  private _initSmMetrics() {
    const kpis = [
      {name: 'Mean Time to Detect', unit: 'hours', target: 4, status: 'warning'},
      {name: 'Mean Time to Respond', unit: 'hours', target: 8, status: 'good'},
      {name: 'Mean Time to Contain', unit: 'hours', target: 24, status: 'good'},
      {name: 'Vulnerability Remediation SLA', unit: '%', target: 95, status: 'warning'},
      {name: 'Patch Compliance Rate', unit: '%', target: 98, status: 'good'},
      {name: 'Security Awareness Score', unit: '%', target: 85, status: 'critical'},
      {name: 'Phishing Click Rate', unit: '%', target: 5, status: 'good'},
      {name: 'Endpoint Protection Coverage', unit: '%', target: 100, status: 'good'},
      {name: 'MFA Adoption Rate', unit: '%', target: 95, status: 'warning'},
      {name: 'Incident Response Drills', unit: '/year', target: 4, status: 'good'},
      {name: 'Policy Review Compliance', unit: '%', target: 100, status: 'good'},
      {name: 'Third-Party Risk Assessments', unit: '%', target: 90, status: 'warning'},
    ];
    const trends = ['improving', 'stable', 'improving', 'stable', 'improving',
      'declining', 'improving', 'stable', 'improving', 'stable', 'stable', 'improving'];
    this._smKpis = kpis.map((kpi, i) => {
      let value: number;
      if (kpi.unit === 'hours') value = 2 + ((idx + i * 5) % 10);
      else if (kpi.unit === '%') value = 70 + ((idx + i * 7) % 28);
      else value = 1 + ((idx + i) % 4);
      return {
        id: 'sm-kpi-' + i, name: kpi.name, value, unit: kpi.unit, target: kpi.target,
        status: kpi.status, trend: trends[i],
        dataPoints: Array.from({length: 12}, (_, j) => value + ((j * 3 - 15 + (idx % 7)) % 10) - 5)
      };
    });
    this._smCategories = [
      {name: 'Detection & Response', kpis: ['Mean Time to Detect', 'Mean Time to Respond', 'Mean Time to Contain'], score: 72 + (idx % 15), weight: 30},
      {name: 'Vulnerability Management', kpis: ['Vulnerability Remediation SLA', 'Patch Compliance Rate'], score: 78 + (idx % 12), weight: 25},
      {name: 'People & Awareness', kpis: ['Security Awareness Score', 'Phishing Click Rate', 'MFA Adoption Rate'], score: 65 + (idx % 18), weight: 20},
      {name: 'Governance & Risk', kpis: ['Policy Review Compliance', 'Third-Party Risk Assessments', 'Incident Response Drills'], score: 70 + (idx % 20), weight: 25},
    ];
  }

  private _smGetOverallScore(): number {
    const weighted = this._smCategories.reduce((s, c) => s + c.score * c.weight, 0);
    return Math.round(weighted / 100);
  }

  private _smGetBreachedKpis(): Array<{name: string; value: number; target: number; gap: number}> {
    return this._smKpis.filter(k => {
      if (k.unit === 'hours') return k.value > k.target;
      if (k.unit === '%') return k.value < k.target;
      return k.value < k.target;
    }).map(k => ({name: k.name, value: k.value, target: k.target, gap: Math.abs(k.value - k.target)}));
  }

  private _smGetMonthlyProgress(): Array<{month: string; score: number; target: number}> {
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    let base = 65 + (idx % 10);
    return months.map((m, i) => ({
      month: m, score: Math.min(100, base + i * 2 + (idx % 3)), target: 85
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



  // === Security Risk Register (ransomware_s) ===
  private _ransomware_sRiskRegister = [
    { id: "RSK-RAN-0001", title: "Data breach from unpatched systems", owner: "CTO", category: "Financial", status: "mitigating", trend: "stable", severity: "critical", likelihood: 9, impact: 5, treatment: "Monitor and review quarterly", lastReview: "2026-04-21", nextReview: "2026-07-05" },
    { id: "RSK-RAN-0002", title: "Ransomware attack on critical infrastructure", owner: "CRO", category: "Strategic", status: "closed", trend: "decreasing", severity: "high", likelihood: 3, impact: 7, treatment: "Monitor and review quarterly", lastReview: "2026-04-12", nextReview: "2026-07-15" },
    { id: "RSK-RAN-0003", title: "Insider threat data exfiltration", owner: "VP Eng", category: "Compliance", status: "accepted", trend: "increasing", severity: "high", likelihood: 10, impact: 2, treatment: "Monitor and review quarterly", lastReview: "2026-04-16", nextReview: "2026-07-28" },
    { id: "RSK-RAN-0004", title: "Supply chain compromise", owner: "Security Lead", category: "Technical", status: "open", trend: "stable", severity: "critical", likelihood: 10, impact: 7, treatment: "Monitor and review quarterly", lastReview: "2026-04-20", nextReview: "2026-07-03" },
    { id: "RSK-RAN-0005", title: "Cloud misconfiguration exposure", owner: "Risk Mgr", category: "Reputational", status: "mitigating", trend: "decreasing", severity: "medium", likelihood: 9, impact: 3, treatment: "Monitor and review quarterly", lastReview: "2026-04-20", nextReview: "2026-07-21" },
    { id: "RSK-RAN-0006", title: "Phishing campaign success rate", owner: "Compliance Dir", category: "Legal", status: "closed", trend: "increasing", severity: "low", likelihood: 9, impact: 7, treatment: "Monitor and review quarterly", lastReview: "2026-04-01", nextReview: "2026-07-17" },
    { id: "RSK-RAN-0007", title: "Third-party vendor data breach", owner: "IT Dir", category: "Regulatory", status: "accepted", trend: "stable", severity: "critical", likelihood: 6, impact: 8, treatment: "Monitor and review quarterly", lastReview: "2026-04-15", nextReview: "2026-07-10" },
    { id: "RSK-RAN-0008", title: "Regulatory non-compliance penalty", owner: "DevOps Lead", category: "Third-Party", status: "open", trend: "decreasing", severity: "medium", likelihood: 2, impact: 6, treatment: "Monitor and review quarterly", lastReview: "2026-04-07", nextReview: "2026-07-08" },
    { id: "RSK-RAN-0009", title: "Zero-day exploit in production", owner: "Architect", category: "Human Capital", status: "mitigating", trend: "increasing", severity: "critical", likelihood: 10, impact: 10, treatment: "Monitor and review quarterly", lastReview: "2026-04-08", nextReview: "2026-07-06" },
    { id: "RSK-RAN-0010", title: "Insufficient access controls", owner: "CISO", category: "Operational", status: "closed", trend: "stable", severity: "low", likelihood: 7, impact: 10, treatment: "Monitor and review quarterly", lastReview: "2026-04-12", nextReview: "2026-07-11" },
    { id: "RSK-RAN-0011", title: "DDoS attack on services", owner: "CTO", category: "Financial", status: "accepted", trend: "decreasing", severity: "medium", likelihood: 10, impact: 9, treatment: "Monitor and review quarterly", lastReview: "2026-04-10", nextReview: "2026-07-12" },
    { id: "RSK-RAN-0012", title: "Social engineering attack", owner: "CRO", category: "Strategic", status: "open", trend: "increasing", severity: "low", likelihood: 7, impact: 3, treatment: "Monitor and review quarterly", lastReview: "2026-04-01", nextReview: "2026-07-08" },
    { id: "RSK-RAN-0013", title: "API security vulnerability", owner: "VP Eng", category: "Compliance", status: "mitigating", trend: "stable", severity: "medium", likelihood: 5, impact: 4, treatment: "Monitor and review quarterly", lastReview: "2026-04-04", nextReview: "2026-07-14" },
    { id: "RSK-RAN-0014", title: "Mobile device compromise", owner: "Security Lead", category: "Technical", status: "closed", trend: "decreasing", severity: "critical", likelihood: 2, impact: 8, treatment: "Monitor and review quarterly", lastReview: "2026-04-07", nextReview: "2026-07-08" },
    { id: "RSK-RAN-0015", title: "Physical security breach", owner: "Risk Mgr", category: "Reputational", status: "accepted", trend: "increasing", severity: "medium", likelihood: 8, impact: 2, treatment: "Monitor and review quarterly", lastReview: "2026-04-10", nextReview: "2026-07-17" },
    { id: "RSK-RAN-0016", title: "Password policy weakness", owner: "Compliance Dir", category: "Legal", status: "open", trend: "stable", severity: "critical", likelihood: 2, impact: 3, treatment: "Monitor and review quarterly", lastReview: "2026-04-06", nextReview: "2026-07-03" },
    { id: "RSK-RAN-0017", title: "Network segmentation gap", owner: "IT Dir", category: "Regulatory", status: "mitigating", trend: "decreasing", severity: "low", likelihood: 3, impact: 3, treatment: "Monitor and review quarterly", lastReview: "2026-04-23", nextReview: "2026-07-14" },
    { id: "RSK-RAN-0018", title: "Encryption key management failure", owner: "DevOps Lead", category: "Third-Party", status: "closed", trend: "increasing", severity: "critical", likelihood: 4, impact: 2, treatment: "Monitor and review quarterly", lastReview: "2026-04-20", nextReview: "2026-07-28" },
    { id: "RSK-RAN-0019", title: "Audit trail tampering", owner: "Architect", category: "Human Capital", status: "accepted", trend: "stable", severity: "high", likelihood: 2, impact: 2, treatment: "Monitor and review quarterly", lastReview: "2026-04-14", nextReview: "2026-07-16" },
    { id: "RSK-RAN-0020", title: "Business email compromise", owner: "CISO", category: "Operational", status: "open", trend: "decreasing", severity: "critical", likelihood: 1, impact: 1, treatment: "Monitor and review quarterly", lastReview: "2026-04-01", nextReview: "2026-07-19" },
  ];
  private _ransomware_sRiskFilter: string = 'all';
  private _ransomware_sRiskSeverity: string = 'all';
  private _ransomware_sRiskStatus: string = 'all';
  private _ransomware_sExpandedRisk: string = '';
  private _ransomware_sFilterRisks() {
    const reg = this._ransomware_sRiskRegister;
    return reg.filter(r => {
      if (this._ransomware_sRiskFilter !== "all" && r.category !== this._ransomware_sRiskFilter) return false;
      if (this._ransomware_sRiskSeverity !== "all" && r.severity !== this._ransomware_sRiskSeverity) return false;
      if (this._ransomware_sRiskStatus !== "all" && r.status !== this._ransomware_sRiskStatus) return false;
      return true;
    });
  }
  private _ransomware_sGetRiskScore(r: any) { return Math.round(r.likelihood * r.impact * 1.5); }
  private _ransomware_sGetRiskTrendIcon(trend: string) {
    if (trend === "increasing") return "\u2191";
    if (trend === "decreasing") return "\u2193";
    return "\u2192";
  }
  private _ransomware_sGetRiskColor(sev: string) {
    if (sev === "critical") return "#dc2626";
    if (sev === "high") return "#ea580c";
    if (sev === "medium") return "#d97706";
    return "#16a34a";
  }
  private _ransomware_sGetRiskCounts() {
    const reg = this._ransomware_sRiskRegister;
    return { total: reg.length, open: reg.filter(r=>r.status==="open").length, mitigating: reg.filter(r=>r.status==="mitigating").length, closed: reg.filter(r=>r.status==="closed").length, accepted: reg.filter(r=>r.status==="accepted").length, critical: reg.filter(r=>r.severity==="critical").length };
  }
  private _ransomware_sGetTreatmentProgress() {
    const reg = this._ransomware_sRiskRegister;
    const treated = reg.filter(r => r.status === "mitigating" || r.status === "closed").length;
    return Math.round((treated / Math.max(reg.length, 1)) * 100);
  }

  // === Security Metrics API Gateway (ransomware_s) ===
  private _ransomware_sApiEndpoints = [
    { method: "GET", path: "/api/v1/threats", name: "Threat Intelligence Feed", status: "active", avgLatency: 445.1, reqPerMin: 302.0, errorRate: 1.54, uptime: round(96.47361822189532,2), version: "v3.6.7" },
    { method: "POST", path: "/api/v1/scans/start", name: "Vulnerability Scanner", status: "active", avgLatency: 116.9, reqPerMin: 60.0, errorRate: 1.73, uptime: round(99.29079691663257,2), version: "v1.2.12" },
    { method: "GET", path: "/api/v1/assets", name: "Asset Inventory", status: "active", avgLatency: 259.2, reqPerMin: 634.0, errorRate: 2.22, uptime: round(99.87952386037924,2), version: "v2.7.15" },
    { method: "POST", path: "/api/v1/alerts", name: "Alert Management", status: "active", avgLatency: 125.7, reqPerMin: 123.0, errorRate: 2.04, uptime: round(95.14543755043725,2), version: "v2.1.13" },
    { method: "GET", path: "/api/v1/compliance", name: "Compliance Status", status: "active", avgLatency: 372.2, reqPerMin: 2294.0, errorRate: 1.19, uptime: round(98.38681962464895,2), version: "v3.9.7" },
    { method: "PUT", path: "/api/v1/policies", name: "Policy Engine", status: "active", avgLatency: 169.7, reqPerMin: 58.0, errorRate: 0.18, uptime: round(95.11147982091522,2), version: "v1.7.19" },
    { method: "GET", path: "/api/v1/incidents", name: "Incident Tracker", status: "active", avgLatency: 315.3, reqPerMin: 593.0, errorRate: 1.19, uptime: round(97.64537060346962,2), version: "v3.8.13" },
    { method: "POST", path: "/api/v1/forensics", name: "Forensics Collector", status: "degraded", avgLatency: 89.7, reqPerMin: 1958.0, errorRate: 1.5, uptime: round(96.99490624466685,2), version: "v3.1.8" },
    { method: "GET", path: "/api/v1/risk/assess", name: "Risk Assessment", status: "active", avgLatency: 324.4, reqPerMin: 1499.0, errorRate: 0.72, uptime: round(95.13159280042399,2), version: "v2.4.19" },
    { method: "POST", path: "/api/v1/auth/verify", name: "Authentication", status: "active", avgLatency: 122.2, reqPerMin: 1395.0, errorRate: 1.96, uptime: round(95.5451680413474,2), version: "v2.6.2" },
    { method: "GET", path: "/api/v1/logs/audit", name: "Audit Log Query", status: "active", avgLatency: 341.5, reqPerMin: 1012.0, errorRate: 1.88, uptime: round(98.92353703820419,2), version: "v1.1.11" },
    { method: "PUT", path: "/api/v1/users/roles", name: "Role Management", status: "active", avgLatency: 411.1, reqPerMin: 912.0, errorRate: 0.89, uptime: round(96.63777111631602,2), version: "v1.8.10" },
    { method: "POST", path: "/api/v1/encrypt", name: "Encryption Service", status: "active", avgLatency: 94.2, reqPerMin: 1063.0, errorRate: 1.38, uptime: round(95.42416593446993,2), version: "v3.5.4" },
    { method: "GET", path: "/api/v1/network/topo", name: "Network Topology", status: "maintenance", avgLatency: 277.9, reqPerMin: 1899.0, errorRate: 0.81, uptime: round(95.54782889905262,2), version: "v3.8.3" },
    { method: "DELETE", path: "/api/v1/sessions", name: "Session Manager", status: "active", avgLatency: 281.8, reqPerMin: 1989.0, errorRate: 1.44, uptime: round(95.0674903452188,2), version: "v1.7.11" },
  ];
  private _ransomware_sApiKeys = [
    { id: "ak-000001", name: "key-rans-001", created: "2026-06-28", lastUsed: "2026-04-14", status: "revoked", calls: 20649, rateLimit: 500 },
    { id: "ak-000002", name: "key-rans-002", created: "2026-01-21", lastUsed: "2026-04-17", status: "revoked", calls: 39348, rateLimit: 5000 },
    { id: "ak-000003", name: "key-rans-003", created: "2026-03-28", lastUsed: "2026-04-01", status: "revoked", calls: 11212, rateLimit: 5000 },
    { id: "ak-000004", name: "key-rans-004", created: "2026-09-23", lastUsed: "2026-04-13", status: "active", calls: 26300, rateLimit: 1000 },
    { id: "ak-000005", name: "key-rans-005", created: "2026-09-23", lastUsed: "2026-04-17", status: "active", calls: 10277, rateLimit: 500 },
    { id: "ak-000006", name: "key-rans-006", created: "2026-01-04", lastUsed: "2026-04-19", status: "revoked", calls: 12543, rateLimit: 500 },
    { id: "ak-000007", name: "key-rans-007", created: "2026-01-25", lastUsed: "2026-04-20", status: "active", calls: 42341, rateLimit: 1000 },
    { id: "ak-000008", name: "key-rans-008", created: "2026-05-20", lastUsed: "2026-04-15", status: "revoked", calls: 24309, rateLimit: 100 },
  ];
  private _ransomware_sApiHealthSummary() {
    const eps = this._ransomware_sApiEndpoints;
    return { total: eps.length, active: eps.filter(e=>e.status==="active").length, degraded: eps.filter(e=>e.status==="degraded").length, maintenance: eps.filter(e=>e.status==="maintenance").length, avgLatency: round(eps.reduce((s,e)=>s+e.avgLatency,0)/eps.length,1), totalReqPerMin: round(eps.reduce((s,e)=>s+e.reqPerMin,0)), avgUptime: round(eps.reduce((s,e)=>s+e.uptime,0)/eps.length,2) };
  }
  private _ransomware_sGetApiByMethod(method: string) { return this._ransomware_sApiEndpoints.filter(e=>e.method===method); }
  private _ransomware_sGetSlowEndpoints() { return this._ransomware_sApiEndpoints.filter(e=>e.avgLatency>200).sort((a,b)=>b.avgLatency-a.avgLatency); }
  private _ransomware_sGetHighErrorEndpoints() { return this._ransomware_sApiEndpoints.filter(e=>e.errorRate>1.0).sort((a,b)=>b.errorRate-a.errorRate); }

  // === Security Training Effectiveness (ransomware_s) ===
  private _ransomware_sTrainingModules = [
    { id: "TRN-001", name: "Security Fundamentals", completionRate: 95.1, avgScore: 90.6, behaviorChange: 56.2, enrolled: 172, completed: 269, duration: "52min", category: "mandatory" },
    { id: "TRN-002", name: "Phishing Awareness", completionRate: 45.7, avgScore: 58.1, behaviorChange: 64.9, enrolled: 440, completed: 232, duration: "95min", category: "mandatory" },
    { id: "TRN-003", name: "Social Engineering Defense", completionRate: 92.8, avgScore: 87.3, behaviorChange: 77.3, enrolled: 334, completed: 423, duration: "97min", category: "optional" },
    { id: "TRN-004", name: "Password Hygiene", completionRate: 86.1, avgScore: 64.1, behaviorChange: 81.0, enrolled: 444, completed: 313, duration: "113min", category: "mandatory" },
    { id: "TRN-005", name: "Data Classification", completionRate: 84.1, avgScore: 62.6, behaviorChange: 61.0, enrolled: 465, completed: 259, duration: "78min", category: "mandatory" },
    { id: "TRN-006", name: "Incident Response Basics", completionRate: 54.3, avgScore: 64.0, behaviorChange: 65.1, enrolled: 492, completed: 41, duration: "28min", category: "mandatory" },
    { id: "TRN-007", name: "Secure Coding", completionRate: 55.9, avgScore: 70.8, behaviorChange: 70.8, enrolled: 423, completed: 398, duration: "72min", category: "optional" },
    { id: "TRN-008", name: "Cloud Security", completionRate: 63.8, avgScore: 82.7, behaviorChange: 56.9, enrolled: 166, completed: 296, duration: "32min", category: "mandatory" },
    { id: "TRN-009", name: "Mobile Device Security", completionRate: 77.9, avgScore: 68.5, behaviorChange: 52.6, enrolled: 338, completed: 81, duration: "35min", category: "mandatory" },
    { id: "TRN-010", name: "Network Security", completionRate: 48.7, avgScore: 91.3, behaviorChange: 57.8, enrolled: 76, completed: 223, duration: "117min", category: "mandatory" },
    { id: "TRN-011", name: "Physical Security", completionRate: 94.2, avgScore: 68.6, behaviorChange: 41.0, enrolled: 188, completed: 224, duration: "111min", category: "optional" },
    { id: "TRN-012", name: "Regulatory Compliance", completionRate: 71.5, avgScore: 57.4, behaviorChange: 74.5, enrolled: 70, completed: 219, duration: "65min", category: "mandatory" },
    { id: "TRN-013", name: "Risk Management", completionRate: 64.4, avgScore: 72.9, behaviorChange: 81.1, enrolled: 293, completed: 166, duration: "62min", category: "mandatory" },
    { id: "TRN-014", name: "Cryptography Basics", completionRate: 56.5, avgScore: 79.8, behaviorChange: 41.6, enrolled: 273, completed: 209, duration: "66min", category: "mandatory" },
    { id: "TRN-015", name: "Access Control", completionRate: 65.2, avgScore: 57.0, behaviorChange: 82.5, enrolled: 317, completed: 212, duration: "69min", category: "optional" },
    { id: "TRN-016", name: "Vendor Management", completionRate: 47.9, avgScore: 59.1, behaviorChange: 59.0, enrolled: 60, completed: 44, duration: "46min", category: "mandatory" },
  ];
  private _ransomware_sPhishingResults = [
    { month: "2026-01", sent: 405, clicked: 98, reported: 46, clickRate: round(24.19753086419753,1), reportRate: round(11.358024691358025,1) },
    { month: "2026-02", sent: 223, clicked: 11, reported: 74, clickRate: round(4.932735426008969,1), reportRate: round(33.18385650224215,1) },
    { month: "2026-03", sent: 431, clicked: 20, reported: 208, clickRate: round(4.640371229698376,1), reportRate: round(48.25986078886311,1) },
    { month: "2026-04", sent: 627, clicked: 115, reported: 366, clickRate: round(18.341307814992025,1), reportRate: round(58.3732057416268,1) },
    { month: "2026-05", sent: 685, clicked: 96, reported: 193, clickRate: round(14.014598540145986,1), reportRate: round(28.175182481751825,1) },
    { month: "2026-06", sent: 448, clicked: 97, reported: 110, clickRate: round(21.651785714285715,1), reportRate: round(24.553571428571427,1) },
  ];
  private _ransomware_sTrainingROI = { totalInvestment: 152909, avgCostPerEmployee: 751, riskReductionPct: round(random.uniform(15,45),1), incidentReductionPct: round(random.uniform(10,35),1), complianceScoreGain: round(random.uniform(5,25),1) };
  private _ransomware_sLearningPaths = [
    { name: "Beginner Security Analyst", totalModules: 14, completedModules: 15, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 13, enrolled: 67 },
    { name: "Advanced Threat Hunter", totalModules: 20, completedModules: 15, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 11, enrolled: 143 },
    { name: "Security Architect", totalModules: 15, completedModules: 2, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 34, enrolled: 37 },
    { name: "Incident Responder", totalModules: 19, completedModules: 4, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 53, enrolled: 169 },
    { name: "Compliance Specialist", totalModules: 10, completedModules: 15, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 28, enrolled: 110 },
    { name: "DevSecOps Engineer", totalModules: 15, completedModules: 5, progress: round(random.uniform(10,95),1), estimatedHoursLeft: 73, enrolled: 167 },
  ];
  private _ransomware_sGetOverallCompletion() {
    const mods = this._ransomware_sTrainingModules;
    return round(mods.reduce((s,m)=>s+m.completionRate,0)/mods.length,1);
  }
  private _ransomware_sGetTopPerformers() { return [...this._ransomware_sTrainingModules].sort((a,b)=>b.avgScore-a.avgScore).slice(0,5); }
  private _ransomware_sGetModulesNeedingAttention() { return this._ransomware_sTrainingModules.filter(m=>m.completionRate<70||m.avgScore<65); }

  // === Security Governance Framework (ransomware_s) ===
  private _ransomware_sGovBodies = [
    { name: "Security Steering Committee", members: 9, chair: "CISO", meetingFreq: "Weekly", lastMeeting: "2026-04-21", nextMeeting: "2026-05-13", quorum: 6 },
    { name: "Risk Management Board", members: 15, chair: "CTO", meetingFreq: "Bi-weekly", lastMeeting: "2026-04-12", nextMeeting: "2026-05-24", quorum: 7 },
    { name: "Data Governance Council", members: 8, chair: "CRO", meetingFreq: "Monthly", lastMeeting: "2026-04-04", nextMeeting: "2026-05-17", quorum: 8 },
    { name: "Compliance Oversight Board", members: 14, chair: "CDO", meetingFreq: "Monthly", lastMeeting: "2026-04-18", nextMeeting: "2026-05-18", quorum: 6 },
    { name: "Architecture Review Board", members: 13, chair: "VP Eng", meetingFreq: "Bi-weekly", lastMeeting: "2026-04-21", nextMeeting: "2026-05-12", quorum: 7 },
    { name: "Change Advisory Board", members: 15, chair: "CISO", meetingFreq: "Weekly", lastMeeting: "2026-04-10", nextMeeting: "2026-05-01", quorum: 6 },
    { name: "Incident Review Board", members: 14, chair: "CIO", meetingFreq: "As needed", lastMeeting: "2026-04-19", nextMeeting: "2026-05-20", quorum: 5 },
    { name: "Vendor Risk Committee", members: 15, chair: "CFO", meetingFreq: "Quarterly", lastMeeting: "2026-04-04", nextMeeting: "2026-05-22", quorum: 7 },
  ];
  private _ransomware_sDecisions = [
    { id: "DEC-0001", title: "Adopt zero-trust architecture framework", date: "2026-02-26", status: "approved", owner: "CISO" },
    { id: "DEC-0002", title: "Migrate to SIEM 2.0 platform", date: "2026-01-05", status: "implemented", owner: "CTO" },
    { id: "DEC-0003", title: "Implement DLP across all endpoints", date: "2026-03-21", status: "in-progress", owner: "Security Lead" },
    { id: "DEC-0004", title: "Mandate MFA for all external access", date: "2026-02-15", status: "pending", owner: "CRO" },
    { id: "DEC-0005", title: "Establish bug bounty program", date: "2026-04-17", status: "approved", owner: "VP Eng" },
    { id: "DEC-0006", title: "Deploy EDR solution enterprise-wide", date: "2026-04-08", status: "approved", owner: "CISO" },
    { id: "DEC-0007", title: "Conduct annual penetration testing", date: "2026-01-03", status: "implemented", owner: "CTO" },
    { id: "DEC-0008", title: "Implement network micro-segmentation", date: "2026-03-28", status: "in-progress", owner: "Security Lead" },
    { id: "DEC-0009", title: "Establish security champion program", date: "2026-01-02", status: "pending", owner: "CRO" },
    { id: "DEC-0010", title: "Migrate to passwordless authentication", date: "2026-01-11", status: "approved", owner: "VP Eng" },
  ];
  private _ransomware_sPolicyLifecycle = [
    { name: "Information Security Policy", version: "v3.3", status: "active", lastUpdated: "2026-03-15", nextReview: "2026-7-10", owner: "CISO" },
    { name: "Acceptable Use Policy", version: "v2.2", status: "active", lastUpdated: "2026-02-16", nextReview: "2026-11-22", owner: "Legal" },
    { name: "Data Retention Policy", version: "v2.3", status: "under-review", lastUpdated: "2026-02-14", nextReview: "2026-7-19", owner: "DPO" },
    { name: "Access Control Policy", version: "v1.4", status: "active", lastUpdated: "2026-02-18", nextReview: "2026-8-20", owner: "IAM Lead" },
    { name: "Incident Response Policy", version: "v3.3", status: "draft", lastUpdated: "2026-02-08", nextReview: "2026-9-20", owner: "IR Lead" },
    { name: "Business Continuity Plan", version: "v3.1", status: "active", lastUpdated: "2026-04-26", nextReview: "2026-8-14", owner: "BCP Mgr" },
    { name: "Vendor Management Policy", version: "v2.0", status: "active", lastUpdated: "2026-04-14", nextReview: "2026-8-15", owner: "Procurement" },
    { name: "Encryption Standard", version: "v4.2", status: "under-review", lastUpdated: "2026-01-09", nextReview: "2026-7-27", owner: "Security Arch" },
  ];
  private _ransomware_sGovMaturityScore = { overall: 5.5, riskManagement: 5.1, compliance: 2.8, incidentResponse: 2.8, awareness: 2.2, technology: 2.0 };
  private _ransomware_sGetPendingDecisions() { return this._ransomware_sDecisions.filter(d=>d.status==='pending'||d.status==='in-progress'); }
  private _ransomware_sGetActivePolicies() { return this._ransomware_sPolicyLifecycle.filter(p=>p.status==='active'); }
  private _ransomware_sGetEscalationPath() { return ["L1 Analyst","L2 Senior","Security Lead","CISO","Board"]; }

  // === Security Innovation Lab (ransomware_s) ===
  private _ransomware_sInnoProjects = [
    { id: "INN-001", name: "AI-Powered Threat Detection", description: "Machine learning models for real-time threat identification", status: "active", progress: 72, startDate: "2026-01-19", teamSize: 2, budget: 74273, milestones: 10, completedMilestones: 4 },
    { id: "INN-002", name: "Quantum-Resistant Cryptography", description: "Post-quantum encryption algorithm prototyping", status: "research", progress: 35, startDate: "2026-01-02", teamSize: 3, budget: 132663, milestones: 4, completedMilestones: 6 },
    { id: "INN-003", name: "Automated Red Teaming", description: "Autonomous penetration testing framework", status: "active", progress: 58, startDate: "2026-03-16", teamSize: 8, budget: 19128, milestones: 6, completedMilestones: 9 },
    { id: "INN-004", name: "Zero-Knowledge Authentication", description: "Privacy-preserving identity verification", status: "poc", progress: 88, startDate: "2026-01-21", teamSize: 7, budget: 102585, milestones: 4, completedMilestones: 7 },
    { id: "INN-005", name: "Blockchain Audit Trail", description: "Immutable security event logging", status: "active", progress: 45, startDate: "2026-03-11", teamSize: 7, budget: 100456, milestones: 4, completedMilestones: 9 },
    { id: "INN-006", name: "Behavioral Biometrics", description: "Continuous authentication via user behavior patterns", status: "research", progress: 22, startDate: "2026-03-18", teamSize: 7, budget: 77944, milestones: 9, completedMilestones: 2 },
    { id: "INN-007", name: "Deception Grid 2.0", description: "Advanced honeypot network with adaptive responses", status: "active", progress: 65, startDate: "2026-01-25", teamSize: 3, budget: 10143, milestones: 8, completedMilestones: 7 },
    { id: "INN-008", name: "Secure Enclave Integration", description: "Hardware-backed security for critical workloads", status: "poc", progress: 40, startDate: "2026-02-02", teamSize: 4, budget: 39467, milestones: 5, completedMilestones: 1 },
  ];
  private _ransomware_sTechEvaluations = [
    { name: "Rust for Security Tools", status: "evaluating", score: 3.6, recommendation: "Adopt", vendor: "Open Source" },
    { name: "eBPF for Runtime Detection", status: "completed", score: 9.5, recommendation: "Adopt", vendor: "AWS" },
    { name: "Confidential Computing", status: "planned", score: 7.0, recommendation: "Investigate", vendor: "Azure" },
    { name: "Homomorphic Encryption", status: "evaluating", score: 7.7, recommendation: "Pilot", vendor: "GCP" },
    { name: "SASE Architecture", status: "completed", score: 8.7, recommendation: "Adopt", vendor: "Multiple" },
    { name: "SOAR Platform 3.0", status: "planned", score: 7.7, recommendation: "Monitor", vendor: "Splunk" },
  ];
  private _ransomware_sCollaborationPartners = [
    { name: "MIT CSAIL", type: "Academic", projects: 4, status: "active" },
    { name: "Stanford Security Lab", type: "Academic", projects: 5, status: "active" },
    { name: "DARPA Cyber", type: "Government", projects: 2, status: "pending" },
    { name: "NIST", type: "Government", projects: 2, status: "active" },
    { name: "CISA", type: "Government", projects: 2, status: "active" },
    { name: "OWASP Foundation", type: "Non-profit", projects: 1, status: "active" },
    { name: "SANS Institute", type: "Training", projects: 2, status: "completed" },
    { name: "Cloud Security Alliance", type: "Industry", projects: 5, status: "active" },
  ];
  private _ransomware_sInnoMetrics = { totalProjects: 8, activeProjects: 4, avgTimeToValue: "159 days", pocSuccessRate: round(random.uniform(55,85),1), researchToProduction: round(random.uniform(20,50),1), innovationIndex: round(random.uniform(6.0,9.5),1) };
  private _ransomware_sGetProjectByStatus(status: string) { return this._ransomware_sInnoProjects.filter(p=>p.status===status); }
  private _ransomware_sGetTopEvaluations() { return [...this._ransomware_sTechEvaluations].sort((a,b)=>b.score-a.score).slice(0,3); }



  // === Compliance Dashboard Extension (ransomware_s) ===
  private _ransomware_sComplianceFrameworks = [
    { name: "SOC 2 Type II", description: "Trust Services Criteria", totalControls: 5, implementedControls: 2, status: "partially-compliant", lastAudit: "2026-02-07", nextAudit: "2026-9-03", evidenceCount: 252 },
    { name: "ISO 27001", description: "Information Security Management", totalControls: 114, implementedControls: 96, status: "in-review", lastAudit: "2026-04-01", nextAudit: "2026-10-14", evidenceCount: 289 },
    { name: "PCI DSS 4.0", description: "Payment Card Industry", totalControls: 12, implementedControls: 10, status: "compliant", lastAudit: "2026-04-01", nextAudit: "2026-11-02", evidenceCount: 477 },
    { name: "HIPAA", description: "Health Insurance Portability", totalControls: 18, implementedControls: 13, status: "in-review", lastAudit: "2026-02-21", nextAudit: "2026-12-10", evidenceCount: 431 },
    { name: "GDPR", description: "Data Protection Regulation", totalControls: 99, implementedControls: 97, status: "in-review", lastAudit: "2026-03-14", nextAudit: "2026-8-09", evidenceCount: 302 },
    { name: "NIST CSF 2.0", description: "Cybersecurity Framework", totalControls: 6, implementedControls: 5, status: "in-review", lastAudit: "2026-04-15", nextAudit: "2026-9-14", evidenceCount: 412 },
    { name: "FedRAMP", description: "Federal Risk Authorization", totalControls: 15, implementedControls: 13, status: "partially-compliant", lastAudit: "2026-04-01", nextAudit: "2026-8-25", evidenceCount: 182 },
    { name: "SOX", description: "Sarbanes-Oxley Compliance", totalControls: 8, implementedControls: 7, status: "compliant", lastAudit: "2026-04-20", nextAudit: "2026-7-24", evidenceCount: 165 },
    { name: "CIS Controls v8", description: "Center for Internet Security", totalControls: 18, implementedControls: 9, status: "non-compliant", lastAudit: "2026-02-06", nextAudit: "2026-8-04", evidenceCount: 363 },
    { name: "COBIT 2019", description: "IT Governance Framework", totalControls: 40, implementedControls: 29, status: "compliant", lastAudit: "2026-03-18", nextAudit: "2026-11-20", evidenceCount: 354 },
  ];
  private _ransomware_sGetComplianceScore() {
    const fw = this._ransomware_sComplianceFrameworks;
    return round(fw.reduce((s,f)=>s + (f.implementedControls/Math.max(f.totalControls,1))*100, 0) / fw.length, 1);
  }
  private _ransomware_sGetGaps() {
    return this._ransomware_sComplianceFrameworks.filter(f => f.status !== "compliant");
  }
  private _ransomware_sAuditTrail = [
    { id: "AUD-0001", action: "Control tested", auditor: "Internal Audit", date: "2026-04-06", result: "pass", findings: 5 },
    { id: "AUD-0002", action: "Evidence collected", auditor: "External Auditor", date: "2026-04-14", result: "pass", findings: 0 },
    { id: "AUD-0003", action: "Gap identified", auditor: "Security Team", date: "2026-04-15", result: "fail", findings: 3 },
    { id: "AUD-0004", action: "Remediation completed", auditor: "Compliance Officer", date: "2026-04-10", result: "pass", findings: 0 },
    { id: "AUD-0005", action: "Policy updated", auditor: "IT Audit", date: "2026-04-17", result: "pass", findings: 2 },
    { id: "AUD-0006", action: "Training verified", auditor: "Risk Team", date: "2026-04-08", result: "pass", findings: 4 },
    { id: "AUD-0007", action: "Access reviewed", auditor: "QA Team", date: "2026-04-16", result: "pass", findings: 2 },
    { id: "AUD-0008", action: "Exception approved", auditor: "CISO Office", date: "2026-04-12", result: "conditional", findings: 3 },
    { id: "AUD-0009", action: "Risk accepted", auditor: "Board Audit", date: "2026-04-21", result: "pass", findings: 3 },
    { id: "AUD-0010", action: "Control enhanced", auditor: "Third Party", date: "2026-04-19", result: "pass", findings: 0 },
  ];

  // === Threat Intelligence Feed Extension (ransomware_s) ===
  private _ransomware_sThreatActors = [
    { name: "APT-29", alias: "Cozy Bear", origin: "Russia", type: "Nation-State", severity: "high", lastActivity: "2026-04-01", targets: "Energy", indicators: 163, ttps: 19 },
    { name: "APT-41", alias: "Double Dragon", origin: "China", type: "Nation-State", severity: "critical", lastActivity: "2026-04-02", targets: "Technology", indicators: 409, ttps: 35 },
    { name: "Lazarus Group", alias: "Hidden Cobra", origin: "North Korea", type: "Nation-State", severity: "critical", lastActivity: "2026-04-23", targets: "Manufacturing", indicators: 342, ttps: 30 },
    { name: "FIN7", alias: "Carbanak", origin: "Eastern Europe", type: "Financial", severity: "high", lastActivity: "2026-04-13", targets: "Government", indicators: 327, ttps: 18 },
    { name: "Conti", alias: "Wizard Spider", origin: "Russia", type: "Ransomware", severity: "critical", lastActivity: "2026-04-10", targets: "Energy", indicators: 50, ttps: 27 },
    { name: "LockBit", alias: "LockBit Gang", origin: "Unknown", type: "Ransomware", severity: "high", lastActivity: "2026-04-15", targets: "Healthcare", indicators: 120, ttps: 7 },
    { name: "Cl0p", alias: "Cl0p Team", origin: "Unknown", type: "Ransomware", severity: "high", lastActivity: "2026-04-15", targets: "Manufacturing", indicators: 193, ttps: 32 },
    { name: "Sandworm", alias: "Unit 74455", origin: "Russia", type: "Nation-State", severity: "critical", lastActivity: "2026-04-13", targets: "Government", indicators: 342, ttps: 32 },
  ];
  private _ransomware_sIoCFeed = [
    { id: "ioc-000001", type: "ip", value: "125.82.186.122", confidence: 76, source: "MISP", firstSeen: "2026-04-10", lastSeen: "2026-04-14" },
    { id: "ioc-000002", type: "ip", value: "70.97.200.30", confidence: 84, source: "Mandiant", firstSeen: "2026-04-01", lastSeen: "2026-04-23" },
    { id: "ioc-000003", type: "ip", value: "203.51.203.14", confidence: 65, source: "STIX", firstSeen: "2026-04-18", lastSeen: "2026-04-16" },
    { id: "ioc-000004", type: "ip", value: "230.99.102.189", confidence: 40, source: "STIX", firstSeen: "2026-04-05", lastSeen: "2026-04-21" },
    { id: "ioc-000005", type: "ip", value: "148.85.76.67", confidence: 52, source: "CrowdStrike", firstSeen: "2026-04-08", lastSeen: "2026-04-19" },
    { id: "ioc-000006", type: "ip", value: "19.6.35.155", confidence: 53, source: "STIX", firstSeen: "2026-04-06", lastSeen: "2026-04-14" },
    { id: "ioc-000007", type: "ip", value: "231.0.52.146", confidence: 64, source: "AlienVault", firstSeen: "2026-04-20", lastSeen: "2026-04-21" },
    { id: "ioc-000008", type: "ip", value: "45.135.1.60", confidence: 78, source: "CrowdStrike", firstSeen: "2026-04-15", lastSeen: "2026-04-09" },
    { id: "ioc-000009", type: "ip", value: "17.69.239.59", confidence: 92, source: "STIX", firstSeen: "2026-04-13", lastSeen: "2026-04-14" },
    { id: "ioc-000010", type: "ip", value: "6.102.184.119", confidence: 61, source: "Mandiant", firstSeen: "2026-04-13", lastSeen: "2026-04-21" },
    { id: "ioc-000011", type: "ip", value: "30.215.203.68", confidence: 71, source: "VirusTotal", firstSeen: "2026-04-15", lastSeen: "2026-04-11" },
    { id: "ioc-000012", type: "ip", value: "126.193.175.74", confidence: 62, source: "STIX", firstSeen: "2026-04-18", lastSeen: "2026-04-13" },
    { id: "ioc-000013", type: "ip", value: "21.53.19.118", confidence: 68, source: "VirusTotal", firstSeen: "2026-04-03", lastSeen: "2026-04-12" },
    { id: "ioc-000014", type: "ip", value: "181.195.44.140", confidence: 45, source: "MISP", firstSeen: "2026-04-12", lastSeen: "2026-04-08" },
    { id: "ioc-000015", type: "ip", value: "254.119.70.107", confidence: 60, source: "AlienVault", firstSeen: "2026-04-23", lastSeen: "2026-04-06" },
  ];
  private _ransomware_sGetActiveThreats() { return this._ransomware_sThreatActors.filter(a => a.severity === 'critical'); }
  private _ransomware_sGetThreatSummary() {
    const actors = this._ransomware_sThreatActors;
    return { total: actors.length, critical: actors.filter(a=>a.severity==="critical").length, high: actors.filter(a=>a.severity==="high").length, nationState: actors.filter(a=>a.type==="Nation-State").length, ransomware: actors.filter(a=>a.type==="Ransomware").length };
  }

  // === Incident Management Extension (ransomware_s) ===
  private _ransomware_sIncidents = [
    { id: "INC-20260001", title: "Unauthorized access detected", severity: "critical", status: "open", assignedTo: "SOC L1", detectedAt: "2026-04-13T05:12", affectedAssets: 9, rootCause: "Misconfiguration" },
    { id: "INC-20260002", title: "Malware outbreak on workstation", severity: "high", status: "investigating", assignedTo: "SOC L2", detectedAt: "2026-04-22T17:32", affectedAssets: 11, rootCause: "Credential compromise" },
    { id: "INC-20260003", title: "Data leak from S3 bucket", severity: "medium", status: "contained", assignedTo: "IR Lead", detectedAt: "2026-04-05T13:17", affectedAssets: 4, rootCause: "Zero-day" },
    { id: "INC-20260004", title: "Phishing campaign targeting finance", severity: "low", status: "eradicated", assignedTo: "CISO", detectedAt: "2026-04-04T17:53", affectedAssets: 22, rootCause: "Human error" },
    { id: "INC-20260005", title: "DDoS attack on web services", severity: "critical", status: "recovered", assignedTo: "Security Eng", detectedAt: "2026-04-08T23:58", affectedAssets: 37, rootCause: "Policy violation" },
    { id: "INC-20260006", title: "Ransomware encryption attempt", severity: "high", status: "closed", assignedTo: "Forensics", detectedAt: "2026-04-23T19:39", affectedAssets: 18, rootCause: "Unknown" },
    { id: "INC-20260007", title: "Insider data exfiltration", severity: "medium", status: "open", assignedTo: "SOC L1", detectedAt: "2026-04-08T18:13", affectedAssets: 48, rootCause: "Misconfiguration" },
    { id: "INC-20260008", title: "API key exposure in repo", severity: "low", status: "investigating", assignedTo: "SOC L2", detectedAt: "2026-04-17T07:03", affectedAssets: 23, rootCause: "Credential compromise" },
    { id: "INC-20260009", title: "SQL injection on portal", severity: "critical", status: "contained", assignedTo: "IR Lead", detectedAt: "2026-04-10T16:04", affectedAssets: 17, rootCause: "Zero-day" },
    { id: "INC-20260010", title: "Brute force on VPN", severity: "high", status: "eradicated", assignedTo: "CISO", detectedAt: "2026-04-03T19:27", affectedAssets: 40, rootCause: "Human error" },
    { id: "INC-20260011", title: "Supply chain alert from vendor", severity: "medium", status: "recovered", assignedTo: "Security Eng", detectedAt: "2026-04-08T03:27", affectedAssets: 2, rootCause: "Policy violation" },
    { id: "INC-20260012", title: "Suspicious lateral movement", severity: "low", status: "closed", assignedTo: "Forensics", detectedAt: "2026-04-03T15:14", affectedAssets: 2, rootCause: "Unknown" },
  ];
  private _ransomware_sGetIncidentStats() {
    const inc = this._ransomware_sIncidents;
    return { total: inc.length, open: inc.filter(i=>i.status==="open").length, investigating: inc.filter(i=>i.status==="investigating").length, mttd: 9, mttr: 84 };
  }
  private _ransomware_sGetSeverityDistribution() {
    const inc = this._ransomware_sIncidents;
    return { critical: inc.filter(i=>i.severity==="critical").length, high: inc.filter(i=>i.severity==="high").length, medium: inc.filter(i=>i.severity==="medium").length, low: inc.filter(i=>i.severity==="low").length };
  }


  render() {
    if (!this._selectedSimulation) {
      return html`${this.rsRenderRound17()}<div class="panel"><div class="empty-state">No simulation selected</div></div>`;
    }
    if (this._rsimRules.length === 0) { this._initRsimRules(); this._initRsimCvss(); this._runRsimAnomalyDetection(); this._generateRsimPredictions(); this._initRsimApprovals(); this._initRsimActivity(); this._initRsimNotifications(); }

    const summary = this._selectedSimulation.summary;
    const scenario = this._selectedSimulation.scenario;
    const impact = this._selectedSimulation.impact;

    return html`
      <div class="panel">
        <div class="pt">
          🦹‍♂️ Ransomware Attack Simulator
          <span class="status-badge status-${this._selectedSimulation.status}">
            ${this._selectedSimulation.status.replace('-', ' ').toUpperCase()}
          </span>
        </div>

        <div class="simulation-header">
          <div class="simulation-info">
            <h2>
              ${this._selectedSimulation.name}
              <span class="severity-badge severity-${scenario.ransomwareFamily.severity}">
                ${scenario.ransomwareFamily.severity.toUpperCase()}
              </span>
            </h2>
            <div class="simulation-meta">
              <span class="type-badge">${scenario.attackVector.replace('-', ' ')}</span>
              <span>Ransomware: ${scenario.ransomwareFamily.name}</span>
              <span>Duration: ${this._selectedSimulation.startTime} - ${this._selectedSimulation.endTime || 'In Progress'}</span>
              <span>Operator: ${this._selectedSimulation.operator}</span>
              <span>${scenario.doubleExtortionEnabled ? 'Double Extortion' : ''} ${scenario.tripleExtortionEnabled ? ' / Triple Extortion' : ''}</span>
            </div>
          </div>
          <div class="controls">
            ${this._simulations.map(s => html`
              <button class="btn ${s.id === this._selectedSimulation.id ? 'active' : ''}" @click=${() => {
                this._selectedSimulation = s;
                const lastPhase = s.attackPhases[s.attackPhases.length - 1];
                this._selectedPhaseId = lastPhase.id;
              }}>
                ${s.name.length > 20 ? s.name.substring(0, 20) + '...' : s.name}
              </button>
            `)}
            <button class="btn success">▶ Run Simulation</button>
            <button class="btn warning">⏸ Pause</button>
            <button class="btn">📊 Generate Report</button>
          </div>
        </div>

        ${summary ? html`
          <div class="score-card-grid">
            <div class="score-card">
              <div class="score-value ${this._getScoreClass(summary.overallResilienceScore)}">${summary.overallResilienceScore}%</div>
              <div class="score-label">Overall Resilience</div>
            </div>
            <div class="score-card">
              <div class="score-value ${this._getScoreClass(summary.preventionEffectiveness)}">${summary.preventionEffectiveness}%</div>
              <div class="score-label">Prevention Effectiveness</div>
            </div>
            <div class="score-card">
              <div class="score-value ${this._getScoreClass(summary.detectionEffectiveness)}">${summary.detectionEffectiveness}%</div>
              <div class="score-label">Detection Effectiveness</div>
            </div>
            <div class="score-card">
              <div class="score-value ${this._getScoreClass(summary.responseEffectiveness)}">${summary.responseEffectiveness}%</div>
              <div class="score-label">Response Effectiveness</div>
            </div>
            <div class="score-card">
              <div class="score-value ${this._getScoreClass(summary.recoveryEffectiveness)}">${summary.recoveryEffectiveness}%</div>
              <div class="score-label">Recovery Effectiveness</div>
            </div>
            <div class="score-card">
              <div class="score-value bad">${summary.gapsIdentified}</div>
              <div class="score-label">Gaps Identified</div>
            </div>
          </div>
        ` : nothing}

        <div class="kill-chain-container">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">
            Ransomware Kill Chain Execution (${this._selectedSimulation.attackPhases.length} phases)
          </h3>
          <div class="kill-chain">
            ${this._selectedSimulation.attackPhases.map(phase => html`
              <div 
                class="phase-card ${this._selectedPhaseId === phase.id ? 'active' : ''}"
                @click=${() => this._selectedPhaseId = phase.id}
              >
                <div class="phase-name">${phase.name}</div>
                <div class="phase-status-badge status-${phase.status}">
                  ${phase.status.replace('-', ' ').toUpperCase()}
                </div>
                <div class="phase-progress">
                  <div class="phase-progress-fill" style="width: ${phase.progress}%; background: ${this._getPhaseColor(phase)}"></div>
                </div>
                <div class="phase-detection-status detection-${phase.detectionStatus}">
                  ${phase.detectionStatus.replace('-', ' ').toUpperCase()}
                </div>
              </div>
            `)}
          </div>
          ${this._selectedPhaseId ? html`
            <div style="background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); border-radius: 6px; padding: 10px; margin-top: 8px;">
              ${this._selectedSimulation.attackPhases.find(p => p.id === this._selectedPhaseId)?.details}
            </div>
          ` : nothing}
        </div>

        <div class="content-tabs">
          <button class="tab-btn ${this._activeTab === 'impact-assessment' ? 'active' : ''}" @click=${() => this._activeTab = 'impact-assessment'}>
            📉 Impact Assessment
          </button>
          <button class="tab-btn ${this._activeTab === 'defense-controls' ? 'active' : ''}" @click=${() => this._activeTab = 'defense-controls'}>
            🔒 Defense Controls
          </button>
          <button class="tab-btn ${this._activeTab === 'backup-recovery' ? 'active' : ''}" @click=${() => this._activeTab = 'backup-recovery'}>
            💾 Backup & Recovery
          </button>
          <button class="tab-btn ${this._activeTab === 'recommendations' ? 'active' : ''}" @click=${() => this._activeTab = 'recommendations'}>
            💡 Recommendations
          </button>
        </div>

        <div class="tab-content ${this._activeTab === 'impact-assessment' ? 'active' : ''}">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">
            Business Impact Assessment
          </h3>
          <div class="impact-metrics">
            <div class="impact-card">
              <div class="impact-value ${this._getImpactSeverity(impact.systemsEncrypted, 20, 40)}">${impact.systemsEncrypted}</div>
              <div class="impact-label">Systems Encrypted</div>
              <div class="impact-desc">38 endpoints, 12 servers including domain controllers, file servers, and ESXi hypervisors</div>
            </div>
            <div class="impact-card">
              <div class="impact-value ${this._getImpactSeverity(impact.totalFilesEncrypted, 100000, 500000)}">${impact.totalFilesEncrypted.toLocaleString()}</div>
              <div class="impact-label">Files Encrypted</div>
              <div class="impact-desc">850,000+ business documents, database files, VM disks, and system files</div>
            </div>
            <div class="impact-card">
              <div class="impact-value ${this._getImpactSeverity(impact.sensitiveDataExfiltrated, 50, 200)}">${impact.sensitiveDataExfiltrated} GB</div>
              <div class="impact-label">Sensitive Data Exfiltrated</div>
              <div class="impact-desc">280GB of customer PII, financial records, intellectual property, and internal documents</div>
            </div>
            <div class="impact-card">
              <div class="impact-value ${this._getImpactSeverity(impact.estimatedDowntime, 24, 72)}">${impact.estimatedDowntime}h</div>
              <div class="impact-label">Estimated Downtime</div>
              <div class="impact-desc">All core business operations expected to be down for 3 days during recovery</div>
            </div>
            <div class="impact-card">
              <div class="impact-value ${this._getImpactSeverity(impact.estimatedRecoveryTime, 48, 96)}">${impact.estimatedRecoveryTime}h</div>
              <div class="impact-label">Estimated Recovery Time</div>
              <div class="impact-desc">Full system recovery expected to take 4 days from offline air-gapped backups</div>
            </div>
            <div class="impact-card">
              <div class="impact-value ${this._getImpactSeverity(impact.estimatedFinancialLoss, 1000000, 10000000)}">$${(impact.estimatedFinancialLoss / 1000000).toFixed(1)}M</div>
              <div class="impact-label">Estimated Financial Loss</div>
              <div class="impact-desc">$12.5M estimated loss including downtime, recovery costs, and regulatory fines</div>
            </div>
          </div>
          <div style="background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); border-radius: 6px; padding: 12px;">
            <div style="font-weight: 600; font-size: 13px; margin-bottom: 6px;">Business Impact Summary</div>
            <div style="font-size: 12px; color: var(--text-secondary, #cbd5e1); line-height: 1.5;">
              <div style="margin-bottom: 4px;"><strong>Affected Business Processes:</strong> ${impact.businessProcessesAffected.join(', ')}</div>
              <div><strong>Regulatory Impact:</strong> ${impact.regulatoryImpact}</div>
            </div>
          </div>
        </div>

        <div class="tab-content ${this._activeTab === 'defense-controls' ? 'active' : ''}">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">
            Defense Control Effectiveness Evaluation
          </h3>
          <div class="controls-list">
            ${this._selectedSimulation.defenseControls.map(control => html`
              <div class="control-item">
                <div class="control-header">
                  <div class="control-name">${control.name}</div>
                  <div style="display: flex; gap: 6px; align-items: center;">
                    <span class="control-type">${control.type}</span>
                    <span class="control-effectiveness effectiveness-${control.effectiveness}">${control.effectiveness.replace('-', ' ').toUpperCase()}</span>
                  </div>
                </div>
                <div class="control-phase">Attack Phase: ${control.attackPhase}</div>
                <div class="control-details">${control.comments}</div>
              </div>
            `)}
          </div>
        </div>

        <div class="tab-content ${this._activeTab === 'backup-recovery' ? 'active' : ''}">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">
            Backup & Recovery Test Results
          </h3>
          <div class="backup-tests-list">
            ${this._selectedSimulation.backupTests.map(test => html`
              <div class="backup-test-item">
                <div class="backup-header">
                  <div class="backup-name">${test.name}</div>
                  <span class="backup-status status-${test.status}">${test.status}</span>
                </div>
                <div style="font-size: 11px; color: var(--text-secondary, #cbd5e1); margin-bottom: 6px;">
                  Type: ${test.type.replace('-', ' ')} • Integrity Verified: ${test.integrityVerified ? '✅ Yes' : '❌ No'}
                </div>
                <div class="backup-metrics">
                  <span>Recovery Time: ${test.recoveryTime || 'N/A'}h</span>
                  <span>Data Loss: ${test.dataLoss || '0'} GB</span>
                </div>
                <div class="backup-details">${test.details}</div>
              </div>
            `)}
          </div>
        </div>

        <div class="tab-content ${this._activeTab === 'recommendations' ? 'active' : ''}">
          <h3 style="font-size: 14px; margin-bottom: 12px; font-weight: 600;">
            Improvement Recommendations (${summary?.recommendations.length || 0} total)
          </h3>
          ${summary && summary.recommendations.length > 0 ? html`
            <div class="recommendations-list">
              ${summary.recommendations.map((rec, index) => {
                const priority = this._getPriorityForRecommendation(index, summary.recommendations.length);
                return html`
                  <div class="recommendation-card">
                    <div class="recommendation-title">
                      Recommendation ${index + 1}
                      <span class="priority-badge priority-${priority}">${priority.toUpperCase()} PRIORITY</span>
                    </div>
                    <div class="recommendation-desc">${rec}</div>
                  </div>
                `;
              })}
            </div>
          ` : html`<div class="empty-state">No recommendations available for this simulation</div>`}
        </div>
      </div>
      </div>
      <div style="margin-top:12px;display:flex;justify-content:center">
        <button class="btn btn-sm ${this._showEnhanced ? 'btn-primary' : 'btn-secondary'}}" @click=${() => {{ this._showEnhanced = !this._showEnhanced; this.requestUpdate(); }}}}>${this._showEnhanced ? 'Hide' : 'Show'}} Advanced</button>
      </div>
      ${this._renderEnhancedSection()}}
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
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Ransomware Simulator Findings Grid</span>
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
  @state() private _rsScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _rsScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _rsScenarioCompare: boolean = false;
  @state() private _rsScenarioSelected: string[] = [];

  private _rsInitScenarios(): void {
    const saved = localStorage.getItem('rs_scenarios');
    if (saved) { try { this._rsScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._rsScenarios.length === 0) {
      this._rsScenarios = [
        {id:'rs-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'rs-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'rs-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _rsSaveScenarios(): void {
    localStorage.setItem('rs_scenarios', JSON.stringify(this._rsScenarios));
  }

  private _rsAddScenario(): void {
    const f = this._rsScenarioForm;
    if (!f.attackType || !f.target) return;
    this._rsScenarios = [...this._rsScenarios, {
      id: 'rs-s' + (this._rsScenarios.length + 1),
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
    this._rsScenarioForm = {attackType:'',target:'',method:''};
    this._rsSaveScenarios();
  }

  private _rsRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._rsScenarioCompare = !this._rsScenarioCompare; }}>${this._rsScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._rsScenarioForm = {...this._rsScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._rsScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._rsScenarioForm = {...this._rsScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._rsScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._rsScenarioForm = {...this._rsScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._rsScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._rsAddScenario}>Run Simulation</button>
      </div>
      ${this._rsScenarioCompare && this._rsScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._rsScenarios.length)},1fr);gap:8px">
            ${this._rsScenarios.slice(0,3).map(s => html`
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
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._rsScenarios.length})</div>
        ${this._rsScenarios.map(s => html`
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
  @state() private _rsTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _rsTrendZoom: {start:number;end:number} | null = null;
  @state() private _rsTrendMA: number = 7;

  private _rsInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._rsTrendData = data;
  }

  private _rsCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._rsTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._rsTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _rsGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._rsTrendData.map(d => d.value);
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

  private _rsRenderTimeSeries(): any {
    const stats = this._rsGetStats();
    const filtered = this._rsTrendZoom ? this._rsTrendData.filter(d => d.day >= this._rsTrendZoom.start && d.day <= this._rsTrendZoom.end) : this._rsTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._rsTrendMA === 7 ? 'active' : ''}" @click=${() => { this._rsTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._rsTrendMA === 30 ? 'active' : ''}" @click=${() => { this._rsTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._rsTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._rsTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
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
  @state() private _rsRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _rsActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _rsPermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _rsPermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _rsPermCompare: string[] = [];

  private _rsInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._rsRoles) {
      perms[role] = {};
      this._rsActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._rsPermissions = perms;
  }

  private _rsTogglePermission(role: string, action: string): void {
    const old = this._rsPermissions[role][action];
    this._rsPermissions = {...this._rsPermissions, [role]: {...this._rsPermissions[role], [action]: !old}};
    this._rsPermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _rsRenderRBAC(): any {
    const compareRoles = this._rsPermCompare.map(r => this._rsPermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._rsRoles.map(r => html`
              <button class="tab ${this._rsPermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._rsPermCompare = this._rsPermCompare.includes(r) ? this._rsPermCompare.filter(x => x !== r) : [...this._rsPermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._rsActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._rsRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._rsActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._rsPermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._rsTogglePermission(role, action)}>${this._rsPermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._rsPermCompare.join(' vs ')}</div>
            ${this._rsActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._rsPermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._rsPermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._rsPermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _rsReportTemplate: string = 'executive';
  @state() private _rsReportSchedule: string = 'weekly';
  @state() private _rsReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _rsReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _rsGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._rsReportHistory.unshift({id,template:this._rsReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _rsRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._rsReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._rsReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._rsReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._rsReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._rsReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._rsReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._rsGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._rsReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._rsReportHistory.slice(0,3).map(r => html`
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
  @state() private _rsHighContrast: boolean = false;
  @state() private _rsA11yAnnounce: string = '';
  @state() private _rsShortcutsVisible: boolean = false;
  @state() private _rsFocusTrap: boolean = false;

  private _rsShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _rsHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._rsFocusTrap) { this._rsFocusTrap = false; this._rsAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._rsHighContrast = !this._rsHighContrast; this._rsAnnounce('High contrast ' + (this._rsHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._rsShortcutsVisible = !this._rsShortcutsVisible; }
  }

  private _rsAnnounce(msg: string): void {
    this._rsA11yAnnounce = msg;
    setTimeout(() => { this._rsA11yAnnounce = ''; }, 2000);
  }

  private _rsRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._rsShortcutsVisible ? 'active' : ''}" @click=${() => { this._rsShortcutsVisible = !this._rsShortcutsVisible; }} aria-expanded=${this._rsShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._rsHighContrast} @change=${() => { this._rsHighContrast = !this._rsHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._rsShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._rsShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._rsA11yAnnounce}</div>
      </div>
    `;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.rsInitRound17();
    this._rsInitScenarios();
    this._rsInitTrendData();
    this._rsInitPermissions();
    document.addEventListener('keydown', this._rsHandleKeydown.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._rsHandleKeydown.bind(this));
  }

  
  // === MACHINE LEARNING FEATURES ===
  @state() private _rsMlActiveView: string = 'importance';
  @state() private _rsMlModelVersion: string = 'v3.2.1';
  @state() private _rsMlFeatureImportance: {name:string;importance:number;color:string}[] = [];
  @state() private _rsMlMetrics: {accuracy:number;precision:number;recall:number;f1:number;auc:number} = {accuracy:0.945,precision:0.931,recall:0.952,f1:0.941,auc:0.973};
  @state() private _rsMlConfusionMatrix: number[][] = [];
  @state() private _rsMlTrainingHistory: {epoch:number;loss:number;valLoss:number;accuracy:number;valAccuracy:number}[] = [];
  @state() private _rsMlConfidenceBins: {range:string;count:number;color:string}[] = [];
  @state() private _rsMlVersionHistory: {version:string;date:string;accuracy:number;f1:number;notes:string}[] = [];
  @state() private _rsMlSelectedVersion: string = 'v3.2.1';

  private _rsInitMlData(): void {
    this._rsMlFeatureImportance = [
      {name:'Request Rate',importance:0.234,color:'#f97316'},
      {name:'Payload Size',importance:0.198,color:'#3b82f6'},
      {name:'Time of Day',importance:0.167,color:'#8b5cf6'},
      {name:'Source IP Reputation',importance:0.145,color:'#10b981'},
      {name:'User Behavior Score',importance:0.112,color:'#ef4444'},
      {name:'Endpoint Type',importance:0.089,color:'#06b6d4'},
      {name:'Protocol Anomaly',importance:0.055,color:'#f59e0b'},
    ];
    this._rsMlConfusionMatrix = [
      [142, 3, 1],
      [2, 98, 4],
      [0, 5, 45],
    ];
    this._rsMlTrainingHistory = Array.from({length:20}, (_,i) => ({
      epoch: i+1,
      loss: Math.max(0.02, 0.8 * Math.exp(-0.15*i) + 0.02 + Math.random()*0.01),
      valLoss: Math.max(0.03, 0.85 * Math.exp(-0.14*i) + 0.03 + Math.random()*0.015),
      accuracy: Math.min(0.99, 0.6 + 0.39 * (1 - Math.exp(-0.18*i)) + Math.random()*0.005),
      valAccuracy: Math.min(0.98, 0.58 + 0.38 * (1 - Math.exp(-0.16*i)) + Math.random()*0.008),
    }));
    this._rsMlConfidenceBins = [
      {range:'0-10%',count:12,color:'#ef4444'},
      {range:'10-30%',count:34,color:'#f97316'},
      {range:'30-50%',count:67,color:'#f59e0b'},
      {range:'50-70%',count:128,color:'#eab308'},
      {range:'70-90%',count:245,color:'#22c55e'},
      {range:'90-100%',count:514,color:'#10b981'},
    ];
    this._rsMlVersionHistory = [
      {version:'v1.0.0',date:'2025-01-15',accuracy:0.812,f1:0.789,notes:'Initial model with basic features'},
      {version:'v2.0.0',date:'2025-04-20',accuracy:0.887,f1:0.874,notes:'Added behavioral analysis features'},
      {version:'v2.5.0',date:'2025-08-10',accuracy:0.912,f1:0.901,notes:'Improved temporal pattern detection'},
      {version:'v3.0.0',date:'2025-11-30',accuracy:0.931,f1:0.922,notes:'Neural network architecture upgrade'},
      {version:'v3.2.1',date:'2026-03-15',accuracy:0.945,f1:0.941,notes:'Fine-tuned on recent threat data'},
    ];
  }

  private _rsRenderMlFeatures(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Machine Learning Features">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Machine Learning Analysis</span>
          <div style="display:flex;gap:4px">
            ${['importance','metrics','matrix','training','confidence','versions'].map(v => html`
              <button class="tab ${this._rsMlActiveView === v ? 'active' : ''}" @click=${() => { this._rsMlActiveView = v; }}>${v.charAt(0).toUpperCase() + v.slice(1)}</button>
            `)}
          </div>
        </div>
        ${this._rsMlActiveView === 'importance' ? this._rsRenderFeatureImportance() : nothing}
        ${this._rsMlActiveView === 'metrics' ? this._rsRenderModelMetrics() : nothing}
        ${this._rsMlActiveView === 'matrix' ? this._rsRenderConfusionMatrix() : nothing}
        ${this._rsMlActiveView === 'training' ? this._rsRenderTrainingHistory() : nothing}
        ${this._rsMlActiveView === 'confidence' ? this._rsRenderConfidenceDist() : nothing}
        ${this._rsMlActiveView === 'versions' ? this._rsRenderVersionHistory() : nothing}
      </div>
    `;
  }

  private _rsRenderFeatureImportance(): any {
    const maxImp = Math.max(...this._rsMlFeatureImportance.map(f => f.importance));
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Feature Importance Ranking (Model ${this._rsMlModelVersion})</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${this._rsMlFeatureImportance.map((f, i) => html`
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

  private _rsRenderModelMetrics(): any {
    const m = this._rsMlMetrics;
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

  private _rsRenderConfusionMatrix(): any {
    const labels = ['Benign','Suspicious','Malicious'];
    const cm = this._rsMlConfusionMatrix;
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

  private _rsRenderTrainingHistory(): any {
    const data = this._rsMlTrainingHistory;
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

  private _rsRenderConfidenceDist(): any {
    const bins = this._rsMlConfidenceBins;
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

  private _rsRenderVersionHistory(): any {
    return html`
      <div style="margin-bottom:8px;font-size:11px;color:#9ca3af">Model Version Comparison</div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${this._rsMlVersionHistory.map(v => html`
          <div style="background:${v.version === this._rsMlSelectedVersion ? '#1e293b' : '#1a1d2e'};border-radius:6px;padding:10px;border-left:3px solid ${v.version === this._rsMlSelectedVersion ? '#3b82f6' : '#374151'};cursor:pointer" @click=${() => { this._rsMlSelectedVersion = v.version; }}>
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
  @state() private _rsCompActiveFramework: string = 'nist';
  @state() private _rsNistCategories: {id:string;name:string;status:'implemented'|'partial'|'not-started';priority:number;progress:number}[] = [];
  @state() private _rsCisControls: {number:number;name:string;implementation:number;maturity:string;owner:string}[] = [];
  @state() private _rsIsoClauses: {clause:string;title:string;status:string;evidence:number;gap:string}[] = [];
  @state() private _rsGdprArticles: {article:string;title:string;compliant:boolean;notes:string}[] = [];
  @state() private _rsSoc2Criteria: {criteria:string;category:string;status:string;score:number}[] = [];
  @state() private _rsCompGapFilter: string = 'all';

  private _rsInitComplianceData(): void {
    this._rsNistCategories = [
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
    this._rsCisControls = [
      {number:1,name:'Inventory and Control of Enterprise Assets',implementation:82,maturity:'Defined',owner:'IT Ops'},
      {number:2,name:'Inventory and Control of Software Assets',implementation:75,maturity:'Managed',owner:'SecOps'},
      {number:3,name:'Data Protection',implementation:90,maturity:'Defined',owner:'DPO'},
      {number:4,name:'Secure Configuration of Enterprise Assets',implementation:68,maturity:'Managed',owner:'IT Ops'},
      {number:5,name:'Account Management',implementation:85,maturity:'Defined',owner:'IAM Team'},
      {number:6,name:'Access Control Management',implementation:88,maturity:'Defined',owner:'IAM Team'},
      {number:7,name:'Continuous Vulnerability Management',implementation:72,maturity:'Managed',owner:'SecOps'},
      {number:8,name:'Audit Log Management',implementation:80,maturity:'Defined',owner:'SecOps'},
    ];
    this._rsIsoClauses = [
      {clause:'A.5.1',title:'Policies for Information Security',status:'Compliant',evidence:12,gap:'None'},
      {clause:'A.5.9',title:'Inventory of Information Assets',status:'Compliant',evidence:8,gap:'None'},
      {clause:'A.6.1',title:'Screening of Candidates',status:'Partial',evidence:5,gap:'Background check process not documented for contractors'},
      {clause:'A.7.1',title:'Before Using Information',status:'Compliant',evidence:10,gap:'None'},
      {clause:'A.8.1',title:'User Endpoint Devices',status:'Partial',evidence:4,gap:'MDM coverage at 78%, target 95%'},
      {clause:'A.8.9',title:'Configuration Management',status:'Partial',evidence:6,gap:'Automated config drift detection missing'},
      {clause:'A.8.16',title:'Monitoring Activities',status:'Compliant',evidence:9,gap:'None'},
      {clause:'A.8.23',title:'Web Filtering',status:'Not Started',evidence:0,gap:'No web filtering solution deployed'},
    ];
    this._rsGdprArticles = [
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
    this._rsSoc2Criteria = [
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

  private _rsRenderComplianceDeepDive(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Compliance Framework Deep Dive">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Compliance Framework</span>
          <div style="display:flex;gap:4px">
            ${['nist','cis','iso','gdpr','soc2'].map(fw => html`
              <button class="tab ${this._rsCompActiveFramework === fw ? 'active' : ''}" @click=${() => { this._rsCompActiveFramework = fw; }}>${fw.toUpperCase()}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:10px">
          ${['all','implemented','partial','not-started'].map(f => html`
            <button class="tab ${this._rsCompGapFilter === f ? 'active' : ''}" @click=${() => { this._rsCompGapFilter = f; }} style="font-size:10px">${f === 'all' ? 'All' : f === 'not-started' ? 'Not Started' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
          `)}
        </div>
        ${this._rsCompActiveFramework === 'nist' ? this._rsRenderNistCsf() : nothing}
        ${this._rsCompActiveFramework === 'cis' ? this._rsRenderCisControls() : nothing}
        ${this._rsCompActiveFramework === 'iso' ? this._rsRenderIso27001() : nothing}
        ${this._rsCompActiveFramework === 'gdpr' ? this._rsRenderGdprChecklist() : nothing}
        ${this._rsCompActiveFramework === 'soc2' ? this._rsRenderSoc2Criteria() : nothing}
      </div>
    `;
  }

  private _rsRenderNistCsf(): any {
    const filtered = this._rsCompGapFilter === 'all' ? this._rsNistCategories : this._rsNistCategories.filter(c => c.status === this._rsCompGapFilter);
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

  private _rsRenderCisControls(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">CIS Controls v8 Implementation Tracking</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._rsCisControls.map(c => html`
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

  private _rsRenderIso27001(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">ISO 27001 Clause Coverage Matrix</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._rsIsoClauses.map(c => html`
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

  private _rsRenderGdprChecklist(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">GDPR Article Compliance Checklist</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._rsGdprArticles.map(a => html`
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

  private _rsRenderSoc2Criteria(): any {
    return html`
      <div style="font-size:11px;color:#9ca3af;margin-bottom:8px">SOC 2 Trust Service Criteria Mapping</div>
      <div style="display:flex;flex-direction:column;gap:4px;max-height:240px;overflow-y:auto">
        ${this._rsSoc2Criteria.map(c => html`
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
  @state() private _rsNetNodes: {id:string;label:string;type:string;segment:string;x:number;y:number;status:string}[] = [];
  @state() private _rsNetEdges: {from:string;to:string;weight:number;traffic:number;type:string}[] = [];
  @state() private _rsNetSelectedNode: string = '';
  @state() private _rsNetPathStart: string = '';
  @state() private _rsNetPathEnd: string = '';
  @state() private _rsNetPathResult: string[] = [];
  @state() private _rsNetSegmentFilter: string = 'all';
  @state() private _rsNetTrafficOverlay: boolean = false;
  @state() private _rsNetZoom: number = 1;

  private _rsInitNetworkData(): void {
    this._rsNetNodes = [
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
    this._rsNetEdges = [
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

  private _rsFindPath(start: string, end: string): string[] {
    const adj = new Map<string, string[]>();
    for (const e of this._rsNetEdges) {
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

  private _rsRenderNetworkMap(): any {
    const filteredNodes = this._rsNetSegmentFilter === 'all' ? this._rsNetNodes : this._rsNetNodes.filter(n => n.segment === this._rsNetSegmentFilter);
    const nodeMap = new Map(this._rsNetNodes.map(n => [n.id, n]));
    const filteredEdges = this._rsNetEdges.filter(e => filteredNodes.some(n => n.id === e.from) && filteredNodes.some(n => n.id === e.to));
    const typeColor: Record<string,string> = {firewall:'#ef4444',network:'#3b82f6',server:'#10b981',gateway:'#8b5cf6',database:'#f97316',cache:'#eab308',auth:'#06b6d4',monitoring:'#ec4899'};
    const pathSet = new Set(this._rsNetPathResult);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Interactive Network Map">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Network Topology</span>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            ${['all','dmz','frontend','backend','data','services'].map(s => html`
              <button class="tab ${this._rsNetSegmentFilter === s ? 'active' : ''}" @click=${() => { this._rsNetSegmentFilter = s; }} style="font-size:10px">${s.charAt(0).toUpperCase() + s.slice(1)}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap">
          <select style="background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:4px;padding:4px 8px;font-size:11px" @change=${(e: any) => { this._rsNetPathStart = e.target.value; }}>
            <option value="">Path Start...</option>
            ${this._rsNetNodes.map(n => html`<option value=${n.id}>${n.label}</option>`)}
          </select>
          <span style="color:#6b7280;font-size:12px">→</span>
          <select style="background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:4px;padding:4px 8px;font-size:11px" @change=${(e: any) => { this._rsNetPathEnd = e.target.value; }}>
            <option value="">Path End...</option>
            ${this._rsNetNodes.map(n => html`<option value=${n.id}>${n.label}</option>`)}
          </select>
          <button class="tab active" @click=${() => { if (this._rsNetPathStart && this._rsNetPathEnd) this._rsNetPathResult = this._rsFindPath(this._rsNetPathStart, this._rsNetPathEnd); }} style="font-size:10px">Trace Path</button>
          <label style="display:flex;align-items:center;gap:4px;font-size:10px;color:#9ca3af;cursor:pointer">
            <input type="checkbox" .checked=${this._rsNetTrafficOverlay} @change=${() => { this._rsNetTrafficOverlay = !this._rsNetTrafficOverlay; }}> Traffic Overlay
          </label>
        </div>
        <svg viewBox="0 0 650 540" style="width:100%;max-height:400px;background:#0a0c14;border-radius:6px;border:1px solid #1e293b">
          ${filteredEdges.map(e => {
            const from = nodeMap.get(e.from);
            const to = nodeMap.get(e.to);
            if (!from || !to) return nothing;
            const isPath = pathSet.has(e.from) && pathSet.has(e.to) && Math.abs(pathSet.indexOf(e.from) - pathSet.indexOf(e.to)) === 1;
            const strokeWidth = Math.max(1, e.weight / 10);
            const opacity = this._rsNetTrafficOverlay ? Math.min(1, e.traffic / 500) : 0.6;
            return html`<line x1=${from.x} y1=${from.y} x2=${to.x} y2=${to.y} stroke=${isPath ? '#fbbf24' : '#374151'} stroke-width=${isPath ? strokeWidth + 2 : strokeWidth} opacity=${opacity} ${isPath ? 'stroke-dasharray="6"' : ''}/>`;
          })}
          ${filteredNodes.map(n => html`
            <g @click=${() => { this._rsNetSelectedNode = n.id; }}>
              <circle cx=${n.x} cy=${n.y} r="16" fill=${typeColor[n.type] || '#6b7280'} opacity=${n.status === 'inactive' ? 0.3 : n.status === 'warning' ? 0.7 : 1} stroke=${this._rsNetSelectedNode === n.id ? '#fbbf24' : 'none'} stroke-width="2"/>
              <text x=${n.x} y=${n.y + 1} text-anchor="middle" fill="white" font-size="7" font-weight="600">${n.type.charAt(0).toUpperCase()}</text>
              <text x=${n.x} y=${n.y + 28} text-anchor="middle" fill="#9ca3af" font-size="8">${n.label}</text>
              ${this._rsNetTrafficOverlay ? html`<text x=${n.x} y=${n.y - 20} text-anchor="middle" fill="#60a5fa" font-size="7">${this._rsNetEdges.filter(e => e.from === n.id || e.to === n.id).reduce((s,e) => s + e.traffic, 0)} Mbps</text>` : nothing}
            </g>
          `)}
        </svg>
        ${this._rsNetPathResult.length > 0 ? html`
          <div style="margin-top:8px;background:#1a1d2e;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:4px">Traced Path (${this._rsNetPathResult.length} hops):</div>
            <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
              ${this._rsNetPathResult.map((id, i) => {
                const node = nodeMap.get(id);
                return html`
                  <span style="background:#fbbf2422;color:#fbbf24;font-size:10px;padding:2px 8px;border-radius:3px;font-weight:600">${node?.label || id}</span>
                  ${i < this._rsNetPathResult.length - 1 ? html`<span style="color:#6b7280">→</span>` : nothing}
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
  @state() private _rsSearchQuery: string = '';
  @state() private _rsSearchResults: {id:string;title:string;relevance:number;type:string;date:string;preview:string}[] = [];
  @state() private _rsSavedSearches: {id:string;query:string;createdAt:string;runCount:number}[] = [];
  @state() private _rsRecentSearches: string[] = [];
  @state() private _rsSearchFilters: {field:string;operator:string;value:string;logic:'and'|'or'|'not'}[] = [];
  @state() private _rsSearchActiveFilterIdx: number = -1;
  @state() private _rsSearchPreset: string = 'none';
  @state() private _rsSearchIsRunning: boolean = false;

  private _rsInitSearchData(): void {
    this._rsSavedSearches = [
      {id:'s1',query:'severity:critical status:open',createdAt:'2026-04-20',runCount:12},
      {id:'s2',query:'type:intrusion network:internal',createdAt:'2026-04-18',runCount:8},
      {id:'s3',query:'policy:DLP destination:cloud',createdAt:'2026-04-15',runCount:5},
    ];
    this._rsRecentSearches = ['critical vulnerabilities','failed login attempts','data exfiltration','phishing reports'];
  }

  private _rsExecuteSearch(): void {
    if (!this._rsSearchQuery.trim()) return;
    this._rsSearchIsRunning = true;
    this._rsRecentSearches = [this._rsSearchQuery, ...this._rsRecentSearches.filter(s => s !== this._rsSearchQuery)].slice(0, 10);
    setTimeout(() => {
      const q = this._rsSearchQuery.toLowerCase();
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
      this._rsSearchResults = mockData.filter(r => r.title.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || r.preview.toLowerCase().includes(q) || q.length < 3);
      this._rsSearchIsRunning = false;
    }, 300);
  }

  private _rsAddSearchFilter(): void {
    this._rsSearchFilters.push({field:'',operator:'contains',value:'',logic:'and'});
    this._rsSearchActiveFilterIdx = this._rsSearchFilters.length - 1;
  }

  private _rsRemoveSearchFilter(idx: number): void {
    this._rsSearchFilters = this._rsSearchFilters.filter((_, i) => i !== idx);
    if (this._rsSearchActiveFilterIdx >= this._rsSearchFilters.length) this._rsSearchActiveFilterIdx = -1;
  }

  private _rsApplySearchPreset(preset: string): void {
    this._rsSearchPreset = preset;
    if (preset === 'critical') this._rsSearchQuery = 'severity:critical status:open';
    else if (preset === 'recent') this._rsSearchQuery = 'date:>2026-04-20 type:*';
    else if (preset === 'failed') this._rsSearchQuery = 'status:failed action:blocked';
    this._rsExecuteSearch();
  }

  private _rsRenderAdvancedSearch(): any {
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Advanced Search and Filter">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Advanced Search</span>
          <div style="display:flex;gap:4px">
            ${['none','critical','recent','failed'].map(p => html`
              <button class="tab ${this._rsSearchPreset === p ? 'active' : ''}" @click=${() => this._rsApplySearchPreset(p)} style="font-size:10px">${p === 'none' ? 'Presets' : p.charAt(0).toUpperCase() + p.slice(1)}</button>
            `)}
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px">
          <div style="flex:1;position:relative">
            <input type="text" placeholder="Search across all data types..." value=${this._rsSearchQuery} @input=${(e: any) => { this._rsSearchQuery = e.target.value; }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._rsExecuteSearch(); }} style="width:100%;background:#1a1d2e;color:#e2e8f0;border:1px solid #374151;border-radius:6px;padding:8px 12px;font-size:12px;outline:none" aria-label="Search input"/>
          </div>
          <button class="tab active" @click=${() => this._rsExecuteSearch()} style="padding:8px 16px" ?disabled=${this._rsSearchIsRunning}>${this._rsSearchIsRunning ? '...' : 'Search'}</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:10px;align-items:center;flex-wrap:wrap">
          <span style="font-size:10px;color:#6b7280">Filters:</span>
          <button class="tab" @click=${() => this._rsAddSearchFilter()} style="font-size:10px">+ Add Filter</button>
          ${this._rsSearchFilters.map((f, i) => html`
            <div style="display:flex;gap:4px;align-items:center;background:#1a1d2e;border-radius:4px;padding:4px 8px">
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._rsSearchFilters[i].field = e.target.value; }}>
                <option value="">Field</option>
                <option value="severity">Severity</option>
                <option value="type">Type</option>
                <option value="status">Status</option>
                <option value="date">Date</option>
                <option value="source">Source</option>
              </select>
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._rsSearchFilters[i].operator = e.target.value; }}>
                <option value="contains">Contains</option>
                <option value="equals">Equals</option>
                <option value="starts">Starts with</option>
                <option value="gt">Greater than</option>
                <option value="lt">Less than</option>
              </select>
              <input type="text" placeholder="Value" style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 6px;font-size:10px;width:80px" @input=${(e: any) => { this._rsSearchFilters[i].value = e.target.value; }}/>
              <select style="background:#0f1117;color:#e2e8f0;border:1px solid #374151;border-radius:3px;padding:2px 4px;font-size:10px" @change=${(e: any) => { this._rsSearchFilters[i].logic = e.target.value; }}>
                <option value="and">AND</option>
                <option value="or">OR</option>
                <option value="not">NOT</option>
              </select>
              <button @click=${() => this._rsRemoveSearchFilter(i)} style="background:none;border:none;color:#ef4444;cursor:pointer;font-size:12px;padding:0 2px">✕</button>
            </div>
          `)}
        </div>
        ${this._rsSearchResults.length > 0 ? html`
          <div style="margin-bottom:8px;font-size:10px;color:#9ca3af">${this._rsSearchResults.length} results found</div>
          <div style="display:flex;flex-direction:column;gap:4px;max-height:200px;overflow-y:auto">
            ${this._rsSearchResults.map(r => html`
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
        ${this._rsRecentSearches.length > 0 && this._rsSearchResults.length === 0 ? html`
          <div style="margin-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Recent Searches:</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              ${this._rsRecentSearches.map(s => html`
                <button class="tab" @click=${() => { this._rsSearchQuery = s; this._rsExecuteSearch(); }} style="font-size:10px">${s}</button>
              `)}
            </div>
          </div>
        ` : nothing}
        ${this._rsSavedSearches.length > 0 ? html`
          <div style="margin-top:8px;border-top:1px solid #1e293b;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:6px">Saved Searches:</div>
            <div style="display:flex;flex-direction:column;gap:3px">
              ${this._rsSavedSearches.map(s => html`
                <div style="display:flex;justify-content:space-between;align-items:center;background:#1a1d2e;border-radius:4px;padding:4px 8px;cursor:pointer" @click=${() => { this._rsSearchQuery = s.query; this._rsExecuteSearch(); }}>
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
  @state() private _rsUndoStack: {id:number;action:string;timestamp:string;snapshot:string}[] = [];
  @state() private _rsRedoStack: {id:number;action:string;timestamp:string;snapshot:string}[] = [];
  @state() private _rsHistoryCounter: number = 0;
  @state() private _rsHistoryVisible: boolean = false;
  @state() private _rsDiffViewActive: boolean = false;
  @state() private _rsDiffFromId: number = -1;
  @state() private _rsDiffToId: number = -1;
  @state() private _rsCurrentSnapshot: string = '';

  private _rsPushHistory(action: string): void {
    this._rsHistoryCounter++;
    const entry = {
      id: this._rsHistoryCounter,
      action,
      timestamp: new Date().toISOString(),
      snapshot: JSON.stringify({searchQuery: this._rsSearchQuery, filters: this._rsSearchFilters, compFramework: this._rsCompActiveFramework, mlView: this._rsMlActiveView}),
    };
    this._rsUndoStack.push(entry);
    this._rsRedoStack = [];
    this._rsCurrentSnapshot = entry.snapshot;
  }

  private _rsUndo(): void {
    if (this._rsUndoStack.length <= 1) return;
    const current = this._rsUndoStack.pop()!;
    this._rsRedoStack.push(current);
    const prev = this._rsUndoStack[this._rsUndoStack.length - 1];
    this._rsCurrentSnapshot = prev.snapshot;
    try {
      const data = JSON.parse(prev.snapshot);
      if (data.searchQuery !== undefined) this._rsSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._rsSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._rsCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._rsMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _rsRedo(): void {
    if (this._rsRedoStack.length === 0) return;
    const entry = this._rsRedoStack.pop()!;
    this._rsUndoStack.push(entry);
    this._rsCurrentSnapshot = entry.snapshot;
    try {
      const data = JSON.parse(entry.snapshot);
      if (data.searchQuery !== undefined) this._rsSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._rsSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._rsCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._rsMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _rsJumpToHistory(id: number): void {
    const idx = this._rsUndoStack.findIndex(e => e.id === id);
    if (idx < 0) return;
    const removed = this._rsUndoStack.splice(idx + 1);
    this._rsRedoStack.push(...removed.reverse());
    const target = this._rsUndoStack[this._rsUndoStack.length - 1];
    this._rsCurrentSnapshot = target.snapshot;
    try {
      const data = JSON.parse(target.snapshot);
      if (data.searchQuery !== undefined) this._rsSearchQuery = data.searchQuery;
      if (data.filters !== undefined) this._rsSearchFilters = data.filters;
      if (data.compFramework !== undefined) this._rsCompActiveFramework = data.compFramework;
      if (data.mlView !== undefined) this._rsMlActiveView = data.mlView;
    } catch(_e) { /* ignore parse errors */ }
  }

  private _rsGetDiff(fromId: number, toId: number): {field:string;from:string;to:string}[] {
    const fromEntry = this._rsUndoStack.find(e => e.id === fromId);
    const toEntry = this._rsUndoStack.find(e => e.id === toId);
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

  private _rsRenderUndoRedo(): any {
    const allHistory = [...this._rsUndoStack];
    const diffs = this._rsDiffViewActive && this._rsDiffFromId >= 0 && this._rsDiffToId >= 0 ? this._rsGetDiff(this._rsDiffFromId, this._rsDiffToId) : [];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:16px;margin-bottom:12px" role="region" aria-label="Undo Redo History">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:14px;color:#e2e8f0" role="heading" aria-level="3">Action History</span>
          <div style="display:flex;gap:4px">
            <button class="tab" @click=${() => this._rsUndo()} ?disabled=${this._rsUndoStack.length <= 1} style="font-size:10px">↩ Undo</button>
            <button class="tab" @click=${() => this._rsRedo()} ?disabled=${this._rsRedoStack.length === 0} style="font-size:10px">Redo ↪</button>
            <button class="tab ${this._rsHistoryVisible ? 'active' : ''}" @click=${() => { this._rsHistoryVisible = !this._rsHistoryVisible; }} style="font-size:10px">Timeline</button>
            <button class="tab ${this._rsDiffViewActive ? 'active' : ''}" @click=${() => { this._rsDiffViewActive = !this._rsDiffViewActive; }} style="font-size:10px">Diff</button>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px;font-size:10px;color:#6b7280">
          <span>Undo: ${this._rsUndoStack.length}</span>
          <span>|</span>
          <span>Redo: ${this._rsRedoStack.length}</span>
          <span>|</span>
          <span>Total Actions: ${this._rsHistoryCounter}</span>
        </div>
        ${this._rsHistoryVisible ? html`
          <div style="background:#1a1d2e;border-radius:6px;padding:8px;max-height:200px;overflow-y:auto;margin-bottom:8px">
            ${allHistory.map((entry, i) => html`
              <div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #0f1117;cursor:pointer;opacity:${i === allHistory.length - 1 ? 1 : 0.6}" @click=${() => this._rsJumpToHistory(entry.id)}>
                <div style="width:12px;height:12px;border-radius:50%;background:${i === allHistory.length - 1 ? '#3b82f6' : '#374151'};flex-shrink:0"></div>
                <span style="font-size:10px;color:#e2e8f0;flex:1">${entry.action}</span>
                <span style="font-size:9px;color:#6b7280">${new Date(entry.timestamp).toLocaleTimeString()}</span>
                ${this._rsDiffViewActive ? html`
                  <input type="radio" name="diff-from" style="accent-color:#3b82f6" @change=${() => { this._rsDiffFromId = entry.id; }}/>
                  <input type="radio" name="diff-to" style="accent-color:#f97316" @change=${() => { this._rsDiffToId = entry.id; }}/>
                ` : nothing}
              </div>
            `)}
          </div>
        ` : nothing}
        ${this._rsDiffViewActive ? html`
          <div style="background:#1a1d2e;border-radius:6px;padding:8px">
            <div style="font-size:10px;color:#9ca3af;margin-bottom:6px">${diffs.length > 0 ? 'Differences found:' : this._rsDiffFromId >= 0 && this._rsDiffToId >= 0 ? 'No differences' : 'Select two points in timeline to compare'}</div>
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
  @state() private _rsActiveSubTab: string = 'scenario';

  private _rsGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _rsRenderSubPanel(): any {
    switch (this._rsActiveSubTab) {
      case 'scenario': return this._rsRenderScenarioEngine();
      case 'timeseries': return this._rsRenderTimeSeries();
      case 'rbac': return this._rsRenderRBAC();
      case 'reporting': return this._rsRenderReporting();
      case 'a11y': return this._rsRenderAccessibility();
      default: return nothing;
    }
  }

  private _rsRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._rsGetAllSubTabs().map(t => html`
          <button class="tab ${this._rsActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._rsActiveSubTab = t.key; }} role="tab" aria-selected=${this._rsActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="rs-tab-${this._rsActiveSubTab}">
        ${this._rsRenderSubPanel()}
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
  @state() private _rsAle: number = 0;
  @state() private _rsSroi: number = 0;
  @state() private _rsCpi: number = 0;
  @state() private _rsBudgetAlloc: number = 0;
  @state() private _rsCostBenefit: number = 0;

  // Security Economics Calculator
  private rsInitEconomics() {
    this._rsAle = Math.round(2850000 + Math.random() * 4500000);
    this._rsSroi = Math.round(180 + Math.random() * 320);
    this._rsCpi = Math.round(45000 + Math.random() * 120000);
    this._rsBudgetAlloc = Math.round(2500000 + Math.random() * 3000000);
    this._rsCostBenefit = Math.round(220 + Math.random() * 180);
  }

  private _rsCalcAle(): { annual: number; perIncident: number; byCategory: Array<{name: string; value: number}> } {
    const base = this._rsAle;
    const categories = [
      { name: "Data Breach", value: Math.round(base * 0.35) },
      { name: "Ransomware", value: Math.round(base * 0.25) },
      { name: "Insider Threat", value: Math.round(base * 0.18) },
      { name: "Business Disruption", value: Math.round(base * 0.12) },
      { name: "Regulatory Fines", value: Math.round(base * 0.10) }
    ];
    return { annual: base, perIncident: Math.round(base / (3 + Math.floor(Math.random() * 8))), byCategory: categories };
  }

  private _rsCalcSroi(): Array<{year: number; investment: number; savings: number; roi: number}> {
    const baseInv = this._rsSroi * 10000;
    const projections: Array<{year: number; investment: number; savings: number; roi: number}> = [];
    for (let i = 1; i <= 5; i++) {
      const inv = Math.round(baseInv * (1 + 0.08 * i));
      const savings = Math.round(inv * (0.6 + i * 0.25));
      projections.push({ year: 2026 + i, investment: inv, savings, roi: Math.round((savings - inv) / inv * 100) });
    }
    return projections;
  }

  private _rsGetBudgetAlloc(): Array<{category: string; amount: number; pct: number; trend: string}> {
    const total = this._rsBudgetAlloc;
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

  private _rsGetCostBenefit(): Array<{control: string; cost: number; benefit: number; ratio: number; priority: string}> {
    const base = this._rsCostBenefit;
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

  private _rsRenderEconomics() {
    const ale = this._rsCalcAle();
    const roi = this._rsCalcSroi();
    const budget = this._rsGetBudgetAlloc();
    const cb = this._rsGetCostBenefit();
    const cpi = this._rsCpi;
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

  @state() private _rsThreatLevel: any = null;
  @state() private _rsEmergingThreats: any = null;
  @state() private _rsThreatTrends: any = null;
  @state() private _rsSectorRadar: any = null;
  @state() private _rsActorActivity: any = null;

  // Threat Landscape Intelligence
  private rsInitThreatIntel() {
    this._rsThreatLevel = {
      americas: Math.round(50 + Math.random() * 40),
      europe: Math.round(40 + Math.random() * 45),
      asiaPacific: Math.round(55 + Math.random() * 35),
      middleEast: Math.round(45 + Math.random() * 50),
      africa: Math.round(30 + Math.random() * 40)
    };
    this._rsEmergingThreats = [
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
    this._rsThreatTrends = [
      { month: "Jan", phishing: 142, malware: 89, ransomware: 34 },
      { month: "Feb", phishing: 158, malware: 95, ransomware: 38 },
      { month: "Mar", phishing: 175, malware: 102, ransomware: 42 },
      { month: "Apr", phishing: 163, malware: 98, ransomware: 39 }
    ];
    this._rsSectorRadar = [
      { sector: "Financial", risk: 82, trend: "up" },
      { sector: "Healthcare", risk: 78, trend: "up" },
      { sector: "Technology", risk: 71, trend: "stable" },
      { sector: "Government", risk: 85, trend: "up" },
      { sector: "Energy", risk: 68, trend: "down" }
    ];
    this._rsActorActivity = [
      { actor: "APT-29", country: "Russia", activity: 85, targets: "Government" },
      { actor: "Lazarus", country: "DPRK", activity: 72, targets: "Financial" },
      { actor: "APT-41", country: "China", activity: 68, targets: "Technology" },
      { actor: "Fancy Bear", country: "Russia", activity: 64, targets: "Healthcare" },
      { actor: "Charming Kitten", country: "Iran", activity: 58, targets: "Energy" }
    ];
  }

  private _rsRenderThreatIntel() {
    const tl = this._rsThreatLevel;
    const et = this._rsEmergingThreats;
    const sr = this._rsSectorRadar;
    const aa = this._rsActorActivity;
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

  @state() private _rsPolicies: any = null;
  @state() private _rsExceptions: any = null;
  @state() private _rsRiskRegister: any = null;
  @state() private _rsMeetings: any = null;
  @state() private _rsDeadlines: any = null;

  // Security Governance Dashboard
  private rsInitGovernance() {
    this._rsPolicies = [
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
    this._rsExceptions = [
      { id: "EXC-001", policy: "Access Control", reason: "Legacy system", risk: "Medium", expiry: "2026-06-30" },
      { id: "EXC-002", policy: "Encryption", reason: "Performance", risk: "High", expiry: "2026-05-15" },
      { id: "EXC-003", policy: "Password Policy", reason: "Vendor req", risk: "Low", expiry: "2026-08-01" }
    ];
    this._rsRiskRegister = [
      { id: "RSK-001", desc: "Unpatched Exchange", likelihood: 4, impact: 5, owner: "IT Ops" },
      { id: "RSK-002", desc: "Shadow IT SaaS", likelihood: 3, impact: 4, owner: "CISO" },
      { id: "RSK-003", desc: "Privileged Access Creep", likelihood: 3, impact: 5, owner: "IAM Team" },
      { id: "RSK-004", desc: "DR Plan Gaps", likelihood: 2, impact: 5, owner: "BCP Lead" },
      { id: "RSK-005", desc: "Vendor Data Sharing", likelihood: 3, impact: 3, owner: "Legal" }
    ];
    this._rsMeetings = [
      { name: "Security Steering", date: "2026-04-25", attendees: 8, status: "Scheduled" },
      { name: "Risk Committee", date: "2026-04-18", attendees: 6, status: "Completed" },
      { name: "Audit Review", date: "2026-05-02", attendees: 5, status: "Pending" }
    ];
    this._rsDeadlines = [
      { regulation: "SOC 2 Type II", deadline: "2026-06-15", daysLeft: 53, status: "On Track" },
      { regulation: "GDPR Annual Review", deadline: "2026-05-25", daysLeft: 32, status: "At Risk" },
      { regulation: "ISO 27001 Audit", deadline: "2026-07-20", daysLeft: 88, status: "On Track" },
      { regulation: "PCI DSS v4.0", deadline: "2026-08-30", daysLeft: 129, status: "Planning" }
    ];
  }

  private _rsRenderGovernance() {
    const policies = this._rsPolicies;
    const risks = this._rsRiskRegister;
    const deadlines = this._rsDeadlines;
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

  @state() private _rsCriticalAssets: any = null;
  @state() private _rsAssetDeps: any = null;
  @state() private _rsEolAssets: any = null;
  @state() private _rsAssetRisk: any = null;

  // Asset Intelligence
  private rsInitAssetIntel() {
    this._rsCriticalAssets = [
      { name: "Core Banking DB", type: "Database", impact: "Critical", risk: 85, owner: "DBA Team" },
      { name: "Customer API Gateway", type: "Service", impact: "Critical", risk: 72, owner: "Platform" },
      { name: "Active Directory", type: "Infrastructure", impact: "Critical", risk: 68, owner: "IAM" },
      { name: "Data Warehouse", type: "Database", impact: "High", risk: 55, owner: "Analytics" },
      { name: "Email Server", type: "Application", impact: "High", risk: 48, owner: "IT Ops" },
      { name: "CI/CD Pipeline", type: "DevOps", impact: "High", risk: 62, owner: "DevOps" },
      { name: "Payment Processor", type: "Service", impact: "Critical", risk: 78, owner: "Finance IT" }
    ];
    this._rsAssetDeps = [
      { from: "Web App", to: "API Gateway", type: "depends" },
      { from: "API Gateway", to: "Core Banking DB", type: "depends" },
      { from: "API Gateway", to: "Auth Service", type: "depends" },
      { from: "Auth Service", to: "Active Directory", type: "depends" },
      { from: "Payment Processor", to: "Core Banking DB", type: "depends" },
      { from: "Mobile App", to: "API Gateway", type: "depends" }
    ];
    this._rsEolAssets = [
      { name: "Windows Server 2012 R2", count: 12, eolDate: "2023-10-10", risk: "Critical" },
      { name: "Oracle 11g", count: 3, eolDate: "2025-12-31", risk: "High" },
      { name: "Cisco ASA 5505", count: 8, eolDate: "2024-07-15", risk: "High" },
      { name: "CentOS 7", count: 25, eolDate: "2024-06-30", risk: "Medium" }
    ];
    this._rsAssetRisk = { critical: 7, high: 23, medium: 45, low: 128, total: 203 };
  }

  private _rsRenderAssetIntel() {
    const assets = this._rsCriticalAssets;
    const eol = this._rsEolAssets;
    const ar = this._rsAssetRisk;
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

  @state() private _rsUserBaseline: any = null;
  @state() private _rsAnomalyRules: any = null;
  @state() private _rsDataAccess: any = null;
  @state() private _rsInsiderRisk: any = null;

  // Insider Threat Detection
  private rsInitInsiderThreat() {
    this._rsUserBaseline = [
      { user: "admin_jdoe", avgLogins: 18, avgFiles: 45, avgNetwork: 2.3, riskScore: 12 },
      { user: "dev_ssmith", avgLogins: 22, avgFiles: 120, avgNetwork: 5.1, riskScore: 25 },
      { user: "mgr_jchen", avgLogins: 8, avgFiles: 30, avgNetwork: 1.2, riskScore: 8 },
      { user: "analyst_mlee", avgLogins: 15, avgFiles: 85, avgNetwork: 3.4, riskScore: 18 },
      { user: "contractor_abrown", avgLogins: 12, avgFiles: 200, avgNetwork: 8.7, riskScore: 42 }
    ];
    this._rsAnomalyRules = [
      { rule: "After-hours access", enabled: true, triggers: 3, severity: "Medium" },
      { rule: "Mass download detection", enabled: true, triggers: 1, severity: "Critical" },
      { rule: "Privilege escalation", enabled: true, triggers: 0, severity: "High" },
      { rule: "Unusual data transfer", enabled: true, triggers: 5, severity: "High" },
      { rule: "Account sharing pattern", enabled: false, triggers: 2, severity: "Medium" },
      { rule: "Departure data spike", enabled: true, triggers: 0, severity: "Critical" }
    ];
    this._rsDataAccess = [
      { resource: "Customer PII DB", accesses: 1245, anomalous: 18, trend: "up" },
      { resource: "Financial Reports", accesses: 832, anomalous: 5, trend: "stable" },
      { resource: "Source Code Repo", accesses: 2100, anomalous: 32, trend: "up" },
      { resource: "Trade Secrets", accesses: 156, anomalous: 8, trend: "up" }
    ];
    this._rsInsiderRisk = { totalUsers: 2847, monitored: 342, flagged: 18, investigated: 5, confirmed: 1 };
  }

  private _rsRenderInsiderThreat() {
    const baseline = this._rsUserBaseline;
    const rules = this._rsAnomalyRules;
    const ir = this._rsInsiderRisk;
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

  // --- Security Metrics Deep Dive ---
  private _renderSecurityMetricsDeepDive(): TemplateResult {
    const mttrData = [
      { month: 'Jan', detect: 12, triage: 8, contain: 24, eradicate: 18, recover: 6 },
      { month: 'Feb', detect: 10, triage: 7, contain: 20, eradicate: 15, recover: 5 },
      { month: 'Mar', detect: 8, triage: 6, contain: 18, eradicate: 14, recover: 4 },
      { month: 'Apr', detect: 7, triage: 5, contain: 15, eradicate: 12, recover: 3 },
      { month: 'May', detect: 6, triage: 5, contain: 14, eradicate: 11, recover: 3 },
      { month: 'Jun', detect: 5, triage: 4, contain: 12, eradicate: 10, recover: 2 },
    ];
    const alertFunnel = [
      { stage: 'Raw Events', count: 1250000, pct: 100 },
      { stage: 'Deduplicated', count: 450000, pct: 36 },
      { stage: 'Correlated', count: 85000, pct: 6.8 },
      { stage: 'Alerts Generated', count: 32000, pct: 2.6 },
      { stage: 'Investigated', count: 8200, pct: 0.66 },
      { stage: 'Incidents Created', count: 1450, pct: 0.12 },
    ];
    const severityMetrics = [
      { severity: 'Critical', mttd: 4.2, mttr: 2.1, mttc: 6.3, count: 12 },
      { severity: 'High', mttd: 8.5, mttr: 4.3, mttc: 12.8, count: 45 },
      { severity: 'Medium', mttd: 18.3, mttr: 8.7, mttc: 27.0, count: 128 },
      { severity: 'Low', mttd: 36.1, mttr: 12.4, mttc: 48.5, count: 340 },
      { severity: 'Informational', mttd: 48.0, mttr: 6.2, mttc: 54.2, count: 890 },
    ];
    const heatmapData = Array.from({ length: 7 }, (_, day) =>
      Array.from({ length: 24 }, (_, hour) => ({
        day, hour,
        events: Math.floor(Math.random() * 50) + (hour >= 9 && hour <= 17 ? 20 : 5),
      }))
    );
    const totalEvents = heatmapData.flat().reduce((s, c) => s + c.events, 0);
    const peakHour = heatmapData.flat().sort((a, b) => b.events - a.events)[0];
    const efficiencyScore = 78.4;
    const capacityUtil = 67.2;
    const projectedLoad = [67, 72, 78, 85, 92, 98, 95];
    return html`
      <div class="metrics-deep-dive">
        <h4>Security Operations Metrics Deep Dive</h4>
        <div class="metrics-grid">
          <div class="metric-card">
            <h5>MTTR/MTTD/MTTC Waterfall (Hours)</h5>
            <div class="waterfall-chart">
              ${mttrData.map(m => html`
                <div class="waterfall-bar-group">
                  <span class="bar-label">${m.month}</span>
                  <div class="waterfall-stacked">
                    <div class="wf-segment detect" style="width:${m.detect * 2}px" title="Detect: ${m.detect}h"></div>
                    <div class="wf-segment triage" style="width:${m.triage * 2}px" title="Triage: ${m.triage}h"></div>
                    <div class="wf-segment contain" style="width:${m.contain * 1.5}px" title="Contain: ${m.contain}h"></div>
                    <div class="wf-segment eradicate" style="width:${m.eradicate * 1.5}px" title="Eradicate: ${m.eradicate}h"></div>
                    <div class="wf-segment recover" style="width:${m.recover * 3}px" title="Recover: ${m.recover}h"></div>
                  </div>
                  <span class="bar-total">${m.detect + m.triage + m.contain + m.eradicate + m.recover}h</span>
                </div>
              `)}
            </div>
          </div>
          <div class="metric-card">
            <h5>Alert-to-Incident Conversion Funnel</h5>
            <div class="funnel-chart">
              ${alertFunnel.map((f, i) => html`
                <div class="funnel-row" style="width:${20 + (1 - i / alertFunnel.length) * 80}%">
                  <span class="funnel-stage">${f.stage}</span>
                  <span class="funnel-count">${f.count.toLocaleString()}</span>
                  <span class="funnel-pct">${f.pct}%</span>
                </div>
              `)}
            </div>
          </div>
          <div class="metric-card">
            <h5>Mean Time Metrics by Severity</h5>
            <table class="metrics-table">
              <thead><tr><th>Severity</th><th>MTTD (h)</th><th>MTTR (h)</th><th>MTTC (h)</th><th>Count</th></tr></thead>
              <tbody>
                ${severityMetrics.map(s => html`
                  <tr class="sev-${s.severity.toLowerCase()}">
                    <td>${s.severity}</td>
                    <td>${s.mttd}</td>
                    <td>${s.mttr}</td>
                    <td>${s.mttc}</td>
                    <td>${s.count}</td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
          <div class="metric-card">
            <h5>Analyst Productivity Heatmap (Events/Hour)</h5>
            <div class="heatmap-container">
              <div class="heatmap-legend">
                <span>Low</span>
                <div class="legend-gradient"></div>
                <span>High</span>
              </div>
              <div class="heatmap-grid">
                ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, di) => html`
                  <div class="heatmap-row">
                    <span class="day-label">${d}</span>
                    ${heatmapData[di].map(cell => html`
                      <div class="heatmap-cell" style="background:rgba(59,130,246,${cell.events / 70})"
                        title="${d} ${cell.hour}:00 - ${cell.events} events"></div>
                    `)}
                  </div>
                `)}
                <div class="hour-labels">
                  ${Array.from({length:24}, (_, i) => html`<span>${i}h</span>`)}
                </div>
              </div>
              <div class="heatmap-stats">
                <span>Total events: ${totalEvents.toLocaleString()}</span>
                <span>Peak: ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][peakHour.day]} ${peakHour.hour}:00 (${peakHour.events} events)</span>
              </div>
            </div>
          </div>
          <div class="metric-card">
            <h5>Security Operations Efficiency Score</h5>
            <div class="efficiency-gauge">
              <div class="gauge-arc" style="--score:${efficiencyScore}"></div>
              <span class="gauge-value">${efficiencyScore}%</span>
            </div>
            <div class="efficiency-breakdown">
              <div class="eff-row"><span>Alert Triage Rate</span><div class="eff-bar" style="width:82%"></div><span>82%</span></div>
              <div class="eff-row"><span>False Positive Rate</span><div class="eff-bar warn" style="width:34%"></div><span>34%</span></div>
              <div class="eff-row"><span>Mean Triage Time</span><div class="eff-bar" style="width:71%"></div><span>71%</span></div>
              <div class="eff-row"><span>Automation Coverage</span><div class="eff-bar" style="width:65%"></div><span>65%</span></div>
              <div class="eff-row"><span>Capacity Utilization</span><div class="eff-bar" style="width:${capacityUtil}%"></div><span>${capacityUtil}%</span></div>
            </div>
          </div>
          <div class="metric-card">
            <h5>Capacity Planning Projection (6 Months)</h5>
            <div class="capacity-chart">
              ${projectedLoad.map((val, i) => html`
                <div class="cap-bar-container">
                  <div class="cap-bar" style="height:${val * 2}px">
                    <span class="cap-val">${val}%</span>
                  </div>
                  <span class="cap-label">M+${i + 1}</span>
                </div>
              `)}
              <div class="capacity-threshold" style="bottom:180px">
                <span>85% Threshold</span>
              </div>
            </div>
            <div class="capacity-note">
              <span class="note-warn">Warning: Capacity expected to exceed 85% by M+5</span>
              <span>Recommendation: Add 2 FTE analysts by Q3</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _getSecurityMetricsTrend(period: string): number[] {
    const trends: Record<string, number[]> = {
      daily: Array.from({ length: 30 }, (_, i) => 60 + Math.sin(i * 0.3) * 15 + Math.random() * 10),
      weekly: Array.from({ length: 12 }, (_, i) => 55 + Math.sin(i * 0.5) * 20 + Math.random() * 8),
      monthly: Array.from({ length: 6 }, (_, i) => 50 + i * 5 + Math.random() * 10),
    };
    return trends[period] || trends.daily;
  }

  private _calculateEfficiencyComponents(): { alertTri: number; fpRate: number; mtt: number; autoCov: number; capUtil: number } {
    return { alertTri: 82, fpRate: 34, mtt: 71, autoCov: 65, capUtil: 67 };
  }

  private _generateCapacityForecast(months: number): { month: string; projected: number; min: number; max: number }[] {
    const base = 67;
    return Array.from({ length: months }, (_, i) => ({
      month: 'M+' + (i + 1),
      projected: base + i * 5.2 + Math.random() * 3,
      min: base + i * 4.5 - 5,
      max: base + i * 6.0 + 5,
    }));
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
          <div class="pb-controls">
            <select class="pb-filter-cat">
              <option value="all">All Categories</option>
              <option value="Incident Response">Incident Response</option>
              <option value="Compliance">Compliance</option>
              <option value="Recovery">Recovery</option>
              <option value="Investigation">Investigation</option>
              <option value="Assessment">Assessment</option>
              <option value="Vulnerability">Vulnerability</option>
              <option value="Social Engineering">Social Engineering</option>
              <option value="Advanced Threats">Advanced Threats</option>
            </select>
            <button class="pb-btn">Import Playbook</button>
            <button class="pb-btn">Create New</button>
          </div>
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
              <div class="pb-actions">
                <button class="pb-action-btn">View</button>
                <button class="pb-action-btn">Edit</button>
                <button class="pb-action-btn">Test</button>
                <button class="pb-action-btn">Share</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="playbook-execution-tracker">
          <h5>Active Playbook Executions</h5>
          <div class="exec-list">
            ${this._getActiveExecutions().map(ex => html`
              <div class="exec-row">
                <span class="exec-playbook">${ex.playbook}</span>
                <span class="exec-trigger">${ex.trigger}</span>
                <div class="exec-progress"><div class="exec-fill" style="width:${ex.progress}%"></div></div>
                <span class="exec-step">${ex.currentStep}/${ex.totalSteps}</span>
                <span class="exec-time">${ex.elapsed}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </section>`;
  }

  private _getActiveExecutions() {
    return [
      { id: 'EX-101', playbook: 'Ransomware Response', trigger: 'Auto: IOC Match', currentStep: 7, totalSteps: 14, progress: 50, elapsed: '2h 10m' },
      { id: 'EX-102', playbook: 'Phishing Triage', trigger: 'Manual: SOC Analyst', currentStep: 6, totalSteps: 8, progress: 75, elapsed: '35m' },
      { id: 'EX-103', playbook: 'DDoS Mitigation', trigger: 'Auto: Traffic Threshold', currentStep: 4, totalSteps: 10, progress: 40, elapsed: '52m' },
    ];
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


  private _renderBudgetPlanning() {
    const budgetData = [
      { category: "Personnel & Training", planned: 1700000, actual: 3889000, utilization: 228.8, q1: "20%", q2: "25%", q3: "23%", q4: "15%" },
      { category: "Tooling & Licensing", planned: 1707000, actual: 3902000, utilization: 228.6, q1: "23%", q2: "30%", q3: "18%", q4: "16%" },
      { category: "Infrastructure Security", planned: 1714000, actual: 3915000, utilization: 228.4, q1: "26%", q2: "35%", q3: "29%", q4: "17%" },
      { category: "Compliance & Audit", planned: 1721000, actual: 3928000, utilization: 228.2, q1: "29%", q2: "24%", q3: "24%", q4: "18%" },
      { category: "Incident Response", planned: 1728000, actual: 3941000, utilization: 228.1, q1: "16%", q2: "29%", q3: "19%", q4: "19%" },
      { category: "Third-Party Assessments", planned: 1735000, actual: 3954000, utilization: 227.9, q1: "19%", q2: "34%", q3: "30%", q4: "20%" },
      { category: "Security Awareness", planned: 1742000, actual: 3967000, utilization: 227.7, q1: "22%", q2: "23%", q3: "25%", q4: "21%" },
      { category: "Research & Innovation", planned: 1749000, actual: 3980000, utilization: 227.6, q1: "25%", q2: "28%", q3: "20%", q4: "22%" },
    ];
    const totalBudget = budgetData.reduce((s, d) => s + d.planned, 0);
    const totalSpent = budgetData.reduce((s, d) => s + d.actual, 0);
    const overallUtil = ((totalSpent / totalBudget) * 100).toFixed(1);
    const headcount = [
      { team: "SOC Tier 1", current: 8, target: 4, gap: 3, avgSalary: "118k" },
      { team: "SOC Tier 2", current: 17, target: 3, gap: 2, avgSalary: "147k" },
      { team: "Threat Intel", current: 9, target: 22, gap: 1, avgSalary: "176k" },
      { team: "Red Team", current: 18, target: 21, gap: 0, avgSalary: "94k" },
      { team: "GRC", current: 10, target: 20, gap: 5, avgSalary: "123k" },
      { team: "AppSec", current: 2, target: 19, gap: 4, avgSalary: "152k" },
      { team: "Cloud Sec", current: 11, target: 18, gap: 3, avgSalary: "181k" },
      { team: "Identity & Access", current: 3, target: 17, gap: 2, avgSalary: "99k" },
    ];
    const vendorSpend = [
      { vendor: "CrowdStrike", annual: "186k", contractEnd: "2026-10", renewalRisk: "Low", satisfaction: 3 },
      { vendor: "Palo Alto", annual: "217k", contractEnd: "2026-11", renewalRisk: "Medium", satisfaction: 5 },
      { vendor: "Splunk", annual: "248k", contractEnd: "2026-12", renewalRisk: "High", satisfaction: 4 },
      { vendor: "Qualys", annual: "279k", contractEnd: "2026-01", renewalRisk: "Low", satisfaction: 3 },
      { vendor: "Rapid7", annual: "310k", contractEnd: "2026-02", renewalRisk: "Medium", satisfaction: 5 },
      { vendor: "Mandiant", annual: "341k", contractEnd: "2026-03", renewalRisk: "High", satisfaction: 4 },
      { vendor: "Zscaler", annual: "372k", contractEnd: "2026-04", renewalRisk: "Low", satisfaction: 3 },
      { vendor: "Duo Security", annual: "403k", contractEnd: "2026-05", renewalRisk: "Medium", satisfaction: 5 },
    ];
    const roiProjections = [
      { area: "Threat Detection", investment: "715k", projectedReturn: "816k", roiMultiple: "2.6x", confidence: 81 },
      { area: "Incident Reduction", investment: "758k", projectedReturn: "863k", roiMultiple: "2.5x", confidence: 62 },
      { area: "Compliance Savings", investment: "801k", projectedReturn: "910k", roiMultiple: "2.4x", confidence: 79 },
      { area: "Automation Gains", investment: "844k", projectedReturn: "957k", roiMultiple: "2.3x", confidence: 60 },
      { area: "Risk Avoidance", investment: "887k", projectedReturn: "1004k", roiMultiple: "2.2x", confidence: 77 },
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
      { id: "kpi-1", name: "MTTD", owner: "SOC", unit: "minutes", target: 70, current: 67, benchmark: 67, collection: "auto", frequency: "realtime" },
      { id: "kpi-2", name: "MTTR", owner: "GRC", unit: "%", target: 73, current: 74, benchmark: 78, collection: "semi-auto", frequency: "daily" },
      { id: "kpi-3", name: "MTTC", owner: "AppSec", unit: "score", target: 76, current: 81, benchmark: 89, collection: "manual", frequency: "weekly" },
      { id: "kpi-4", name: "Vuln SLA Compliance", owner: "Cloud Sec", unit: "count", target: 79, current: 88, benchmark: 66, collection: "auto", frequency: "monthly" },
      { id: "kpi-5", name: "Patch Coverage", owner: "Identity", unit: "days", target: 82, current: 95, benchmark: 77, collection: "semi-auto", frequency: "realtime" },
      { id: "kpi-6", name: "Phishing Click Rate", owner: "Threat Intel", unit: "minutes", target: 85, current: 56, benchmark: 88, collection: "manual", frequency: "daily" },
      { id: "kpi-7", name: "Training Completion", owner: "Security Ops", unit: "%", target: 88, current: 63, benchmark: 65, collection: "auto", frequency: "weekly" },
      { id: "kpi-8", name: "Escalation Rate", owner: "Risk Mgmt", unit: "score", target: 91, current: 70, benchmark: 76, collection: "semi-auto", frequency: "monthly" },
      { id: "kpi-9", name: "False Positive Rate", owner: "SOC", unit: "count", target: 94, current: 77, benchmark: 87, collection: "manual", frequency: "realtime" },
      { id: "kpi-10", name: "Threat Intel Actionability", owner: "GRC", unit: "days", target: 97, current: 84, benchmark: 98, collection: "auto", frequency: "daily" },
      { id: "kpi-11", name: "Endpoint Compliance", owner: "AppSec", unit: "minutes", target: 70, current: 91, benchmark: 75, collection: "semi-auto", frequency: "weekly" },
      { id: "kpi-12", name: "Cloud Misconfig Score", owner: "Cloud Sec", unit: "%", target: 73, current: 98, benchmark: 86, collection: "manual", frequency: "monthly" },
      { id: "kpi-13", name: "Identity Anomaly Rate", owner: "Identity", unit: "score", target: 76, current: 59, benchmark: 97, collection: "auto", frequency: "realtime" },
      { id: "kpi-14", name: "DLP Events", owner: "Threat Intel", unit: "count", target: 79, current: 66, benchmark: 74, collection: "semi-auto", frequency: "daily" },
      { id: "kpi-15", name: "Vendor Risk Avg", owner: "Security Ops", unit: "days", target: 82, current: 73, benchmark: 85, collection: "manual", frequency: "weekly" },
      { id: "kpi-16", name: "Compliance Audit Pass Rate", owner: "Risk Mgmt", unit: "minutes", target: 85, current: 80, benchmark: 96, collection: "auto", frequency: "monthly" },
      { id: "kpi-17", name: "Awareness Score", owner: "SOC", unit: "%", target: 88, current: 87, benchmark: 73, collection: "semi-auto", frequency: "realtime" },
      { id: "kpi-18", name: "SOC Utilization", owner: "GRC", unit: "score", target: 91, current: 94, benchmark: 84, collection: "manual", frequency: "daily" },
      { id: "kpi-19", name: "Automation Coverage", owner: "AppSec", unit: "count", target: 94, current: 55, benchmark: 95, collection: "auto", frequency: "weekly" },
      { id: "kpi-20", name: "Risk Register Currency", owner: "Cloud Sec", unit: "days", target: 97, current: 62, benchmark: 72, collection: "semi-auto", frequency: "monthly" },
    ];
    const benchmarkSources = [
      { source: "NIST CSF", mappedKPIs: 3, alignment: 69, lastReview: "2026-01-17", status: "aligned" },
      { source: "CIS Controls v8", mappedKPIs: 4, alignment: 86, lastReview: "2026-02-12", status: "partial" },
      { source: "ISO 27001:2022", mappedKPIs: 5, alignment: 64, lastReview: "2026-03-07", status: "reviewing" },
      { source: "PCI DSS 4.0", mappedKPIs: 6, alignment: 81, lastReview: "2026-04-02", status: "aligned" },
      { source: "SOC 2 Type II", mappedKPIs: 7, alignment: 98, lastReview: "2026-05-25", status: "partial" },
      { source: "MITRE ATT&CK", mappedKPIs: 8, alignment: 76, lastReview: "2026-06-20", status: "reviewing" },
      { source: "SANS Top 20", mappedKPIs: 3, alignment: 93, lastReview: "2026-01-15", status: "aligned" },
      { source: "OWASP Top 10", mappedKPIs: 4, alignment: 71, lastReview: "2026-02-10", status: "partial" },
    ];
    const normalizationRules = [
      { rule: "Time metrics normalized to minutes", appliesTo: 3, exceptions: 0, version: "v1.0" },
      { rule: "Percentage metrics capped at 100", appliesTo: 7, exceptions: 1, version: "v1.7" },
      { rule: "Count metrics use 7-day rolling avg", appliesTo: 6, exceptions: 2, version: "v1.4" },
      { rule: "Score metrics use 0-100 scale", appliesTo: 5, exceptions: 0, version: "v1.1" },
      { rule: "Rate metrics per 1000 events", appliesTo: 4, exceptions: 1, version: "v1.8" },
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
      { id: "HC-1001", name: "Lateral Movement Sweep", status: "active", hypothesis: "H1: Actors using pass-the-hash for lateral movement", leadHunter: "Alice Chen", findings: 4, startDate: "2026-01-09", endDate: null, effectiveness: 74 },
      { id: "HC-1002", name: "Credential Harvesting Hunt", status: "completed", hypothesis: "H2: Actors using web shells for persistence", leadHunter: "Bob Martinez", findings: 7, startDate: "2026-04-20", endDate: "2026-06-26", effectiveness: 93 },
      { id: "HC-1003", name: "Persistence Mechanism Audit", status: "planned", hypothesis: "H3: Actors using scheduled tasks for data theft", leadHunter: "Carol Wu", findings: 10, startDate: "2026-03-03", endDate: null, effectiveness: 53 },
      { id: "HC-1004", name: "C2 Beacon Detection", status: "in-review", hypothesis: "H4: Actors using DNS tunneling for C2 communication", leadHunter: "Dave Kim", findings: 13, startDate: "2026-02-14", endDate: null, effectiveness: 72 },
      { id: "HC-1005", name: "Data Exfiltration Patterns", status: "active", hypothesis: "H5: Actors using encrypted channels for privilege escalation", leadHunter: "Eve Johnson", findings: 16, startDate: "2026-01-25", endDate: null, effectiveness: 91 },
      { id: "HC-1006", name: "Privilege Escalation Scan", status: "completed", hypothesis: "H6: Actors using token impersonation for defense evasion", leadHunter: "Frank Liu", findings: 19, startDate: "2026-04-08", endDate: "2026-04-10", effectiveness: 51 },
      { id: "HC-1007", name: "Supply Chain Implant Hunt", status: "planned", hypothesis: "H7: Actors using poisoned images for initial access", leadHunter: "Grace Park", findings: 22, startDate: "2026-03-19", endDate: null, effectiveness: 70 },
      { id: "HC-1008", name: "Insider Threat Indicators", status: "in-review", hypothesis: "H8: Actors using legitimate tools for credential access", leadHunter: "Hector Silva", findings: 25, startDate: "2026-02-02", endDate: null, effectiveness: 89 },
      { id: "HC-1009", name: "Cloud Metadata Analysis", status: "active", hypothesis: "H9: Actors using API keys for command execution", leadHunter: "Alice Chen", findings: 28, startDate: "2026-01-13", endDate: null, effectiveness: 49 },
      { id: "HC-1010", name: "DNS Tunnel Detection", status: "completed", hypothesis: "H10: Actors using encoded subdomains for exfiltration", leadHunter: "Bob Martinez", findings: 31, startDate: "2026-04-24", endDate: "2026-05-22", effectiveness: 68 },
      { id: "HC-1011", name: "Fileless Malware Search", status: "planned", hypothesis: "H11: Actors using WMI providers for discovery", leadHunter: "Carol Wu", findings: 34, startDate: "2026-03-07", endDate: null, effectiveness: 87 },
      { id: "HC-1012", name: "Zero-Day Exploit Traces", status: "in-review", hypothesis: "H12: Actors using exploit kits for collection", leadHunter: "Dave Kim", findings: 37, startDate: "2026-02-18", endDate: null, effectiveness: 47 },
    ];
    const hunterLeaderboard = [
      { hunter: "Alice Chen", campaigns: 11, findings: 117, highSeverity: 8, avgScore: 87, streak: 5 },
      { hunter: "Bob Martinez", campaigns: 8, findings: 30, highSeverity: 13, avgScore: 80, streak: 6 },
      { hunter: "Carol Wu", campaigns: 5, findings: 59, highSeverity: 18, avgScore: 73, streak: 7 },
      { hunter: "Dave Kim", campaigns: 15, findings: 88, highSeverity: 23, avgScore: 66, streak: 8 },
      { hunter: "Eve Johnson", campaigns: 12, findings: 117, highSeverity: 2, avgScore: 59, streak: 1 },
      { hunter: "Frank Liu", campaigns: 9, findings: 30, highSeverity: 7, avgScore: 96, streak: 2 },
      { hunter: "Grace Park", campaigns: 6, findings: 59, highSeverity: 12, avgScore: 89, streak: 3 },
      { hunter: "Hector Silva", campaigns: 3, findings: 88, highSeverity: 17, avgScore: 82, streak: 4 },
    ];
    const mitreMapping = [
      { tactic: "Initial Access", techniques: 12, campaigns: 5, coverage: 62 },
      { tactic: "Execution", techniques: 11, campaigns: 4, coverage: 42 },
      { tactic: "Persistence", techniques: 10, campaigns: 3, coverage: 93 },
      { tactic: "Privilege Escalation", techniques: 9, campaigns: 2, coverage: 73 },
      { tactic: "Defense Evasion", techniques: 8, campaigns: 1, coverage: 53 },
      { tactic: "Credential Access", techniques: 7, campaigns: 6, coverage: 33 },
      { tactic: "Discovery", techniques: 6, campaigns: 5, coverage: 84 },
      { tactic: "Lateral Movement", techniques: 5, campaigns: 4, coverage: 64 },
      { tactic: "Collection", techniques: 4, campaigns: 3, coverage: 44 },
      { tactic: "Exfiltration", techniques: 3, campaigns: 2, coverage: 95 },
      { tactic: "Command & Control", techniques: 2, campaigns: 1, coverage: 75 },
      { tactic: "Impact", techniques: 12, campaigns: 6, coverage: 55 },
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
      { id: "CTL-2001", name: "MFA Enforcement", domain: "Access Control", status: "implemented", effectiveness: 71, lastTest: "2026-01-01", nextReview: "2026-09-01", owner: "SOC", risk: "Low" },
      { id: "CTL-2002", name: "Network Segmentation", domain: "Network Security", status: "partial", effectiveness: 3, lastTest: "2026-04-14", nextReview: "2026-10-20", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2003", name: "EDR Deployment", domain: "Endpoint Protection", status: "planned", effectiveness: 10, lastTest: "2026-03-27", nextReview: "2026-11-11", owner: "IT Ops", risk: "High" },
      { id: "CTL-2004", name: "DLP Policy", domain: "Data Protection", status: "gap", effectiveness: 17, lastTest: "2026-02-12", nextReview: "2026-12-02", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2005", name: "SSO Integration", domain: "Identity Management", status: "implemented", effectiveness: 83, lastTest: "2026-01-25", nextReview: "2026-05-21", owner: "IAM", risk: "Low" },
      { id: "CTL-2006", name: "SAST Pipeline", domain: "Application Security", status: "partial", effectiveness: 31, lastTest: "2026-04-10", nextReview: "2026-06-12", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2007", name: "CSPM Scanning", domain: "Cloud Security", status: "planned", effectiveness: 38, lastTest: "2026-03-23", nextReview: "2026-07-03", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2008", name: "Badge Access", domain: "Physical Security", status: "gap", effectiveness: 45, lastTest: "2026-02-08", nextReview: "2026-08-22", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2009", name: "Least Privilege", domain: "Access Control", status: "implemented", effectiveness: 95, lastTest: "2026-01-21", nextReview: "2026-09-13", owner: "SOC", risk: "Low" },
      { id: "CTL-2010", name: "Firewall Rules", domain: "Network Security", status: "partial", effectiveness: 8, lastTest: "2026-04-06", nextReview: "2026-10-04", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2011", name: "Disk Encryption", domain: "Endpoint Protection", status: "planned", effectiveness: 15, lastTest: "2026-03-19", nextReview: "2026-11-23", owner: "IT Ops", risk: "High" },
      { id: "CTL-2012", name: "Data Classification", domain: "Data Protection", status: "gap", effectiveness: 22, lastTest: "2026-02-04", nextReview: "2026-12-14", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2013", name: "PAM Implementation", domain: "Identity Management", status: "implemented", effectiveness: 48, lastTest: "2026-01-17", nextReview: "2026-05-05", owner: "IAM", risk: "Low" },
      { id: "CTL-2014", name: "DAST Pipeline", domain: "Application Security", status: "partial", effectiveness: 36, lastTest: "2026-04-02", nextReview: "2026-06-24", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2015", name: "IAM Policy Review", domain: "Cloud Security", status: "planned", effectiveness: 43, lastTest: "2026-03-15", nextReview: "2026-07-15", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2016", name: "Visitor Management", domain: "Physical Security", status: "gap", effectiveness: 50, lastTest: "2026-02-28", nextReview: "2026-08-06", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2017", name: "Access Reviews", domain: "Access Control", status: "implemented", effectiveness: 60, lastTest: "2026-01-13", nextReview: "2026-09-25", owner: "SOC", risk: "Low" },
      { id: "CTL-2018", name: "IDS/IPS Tuning", domain: "Network Security", status: "partial", effectiveness: 13, lastTest: "2026-04-26", nextReview: "2026-10-16", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2019", name: "Patch Management", domain: "Endpoint Protection", status: "planned", effectiveness: 20, lastTest: "2026-03-11", nextReview: "2026-11-07", owner: "IT Ops", risk: "High" },
      { id: "CTL-2020", name: "Backup Encryption", domain: "Data Protection", status: "gap", effectiveness: 27, lastTest: "2026-02-24", nextReview: "2026-12-26", owner: "Data Gov", risk: "Critical" },
      { id: "CTL-2021", name: "Password Policy", domain: "Identity Management", status: "implemented", effectiveness: 72, lastTest: "2026-01-09", nextReview: "2026-05-17", owner: "IAM", risk: "Low" },
      { id: "CTL-2022", name: "Container Scanning", domain: "Application Security", status: "partial", effectiveness: 41, lastTest: "2026-04-22", nextReview: "2026-06-08", owner: "DevSecOps", risk: "Medium" },
      { id: "CTL-2023", name: "WAF Configuration", domain: "Cloud Security", status: "planned", effectiveness: 48, lastTest: "2026-03-07", nextReview: "2026-07-27", owner: "Cloud Ops", risk: "High" },
      { id: "CTL-2024", name: "CCTV Coverage", domain: "Physical Security", status: "gap", effectiveness: 4, lastTest: "2026-02-20", nextReview: "2026-08-18", owner: "Facilities", risk: "Critical" },
      { id: "CTL-2025", name: "RBAC Enforcement", domain: "Access Control", status: "implemented", effectiveness: 84, lastTest: "2026-01-05", nextReview: "2026-09-09", owner: "SOC", risk: "Low" },
      { id: "CTL-2026", name: "VPN Management", domain: "Network Security", status: "partial", effectiveness: 18, lastTest: "2026-04-18", nextReview: "2026-10-28", owner: "Network Ops", risk: "Medium" },
      { id: "CTL-2027", name: "App Whitelisting", domain: "Endpoint Protection", status: "planned", effectiveness: 25, lastTest: "2026-03-03", nextReview: "2026-11-19", owner: "IT Ops", risk: "High" },
      { id: "CTL-2028", name: "Key Management", domain: "Data Protection", status: "gap", effectiveness: 32, lastTest: "2026-02-16", nextReview: "2026-12-10", owner: "Data Gov", risk: "Critical" },
    ];
    const gapAnalysis = [
      { gap: "Insufficient MFA coverage for legacy apps", severity: "High", remediationPlan: "Plan R3001", eta: "2026-Q4", estimatedCost: "51k" },
      { gap: "Missing network micro-segmentation", severity: "Medium", remediationPlan: "Plan R3002", eta: "2026-Q3", estimatedCost: "80k" },
      { gap: "Inconsistent EDR deployment", severity: "Medium", remediationPlan: "Plan R3003", eta: "2026-Q2", estimatedCost: "109k" },
      { gap: "DLP not covering cloud storage", severity: "Low", remediationPlan: "Plan R3004", eta: "2026-Q4", estimatedCost: "138k" },
      { gap: "SSO not integrated with all SaaS", severity: "High", remediationPlan: "Plan R3005", eta: "2026-Q3", estimatedCost: "167k" },
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
      { id: "INC-7001", name: "Security Incident 1", severity: "Critical", totalCost: 2261000, responseCost: 474810, recoveryCost: 587860, legalCost: 203490, regulatoryCost: 293930, insuranceClaim: 0, avoidedCost: 233000, date: "2026-01-21" },
      { id: "INC-7002", name: "Security Incident 2", severity: "High", totalCost: 2264000, responseCost: 633920, recoveryCost: 837680, legalCost: 135840, regulatoryCost: 181120, insuranceClaim: 1811200, avoidedCost: 262000, date: "2026-04-02" },
      { id: "INC-7003", name: "Security Incident 3", severity: "Medium", totalCost: 2267000, responseCost: 793450, recoveryCost: 612090, legalCost: 430730, regulatoryCost: 317380, insuranceClaim: 0, avoidedCost: 291000, date: "2026-03-11" },
      { id: "INC-7004", name: "Security Incident 4", severity: "Low", totalCost: 2270000, responseCost: 476700, recoveryCost: 862600, legalCost: 363200, regulatoryCost: 204300, insuranceClaim: 1702500, avoidedCost: 320000, date: "2026-02-20" },
      { id: "INC-7005", name: "Security Incident 5", severity: "Critical", totalCost: 2273000, responseCost: 636440, recoveryCost: 636440, legalCost: 295490, regulatoryCost: 340950, insuranceClaim: 0, avoidedCost: 349000, date: "2026-01-01" },
      { id: "INC-7006", name: "Security Incident 6", severity: "High", totalCost: 2276000, responseCost: 796600, recoveryCost: 887640, legalCost: 227600, regulatoryCost: 227600, insuranceClaim: 1593200, avoidedCost: 378000, date: "2026-04-10" },
      { id: "INC-7007", name: "Security Incident 7", severity: "Medium", totalCost: 2279000, responseCost: 478590, recoveryCost: 660910, legalCost: 159530, regulatoryCost: 113950, insuranceClaim: 0, avoidedCost: 407000, date: "2026-03-19" },
      { id: "INC-7008", name: "Security Incident 8", severity: "Low", totalCost: 2282000, responseCost: 638960, recoveryCost: 912800, legalCost: 456400, regulatoryCost: 251020, insuranceClaim: 1483300, avoidedCost: 436000, date: "2026-02-28" },
      { id: "INC-7009", name: "Security Incident 9", severity: "Critical", totalCost: 2285000, responseCost: 799750, recoveryCost: 685500, legalCost: 388450, regulatoryCost: 137100, insuranceClaim: 0, avoidedCost: 465000, date: "2026-01-09" },
      { id: "INC-7010", name: "Security Incident 10", severity: "High", totalCost: 2288000, responseCost: 480480, recoveryCost: 457600, legalCost: 320320, regulatoryCost: 274560, insuranceClaim: 1372800, avoidedCost: 494000, date: "2026-04-18" },
      { id: "INC-7011", name: "Security Incident 11", severity: "Medium", totalCost: 2291000, responseCost: 641480, recoveryCost: 710210, legalCost: 252010, regulatoryCost: 160370, insuranceClaim: 0, avoidedCost: 27000, date: "2026-03-27" },
      { id: "INC-7012", name: "Security Incident 12", severity: "Low", totalCost: 2294000, responseCost: 802900, recoveryCost: 481740, legalCost: 183520, regulatoryCost: 298220, insuranceClaim: 1261700, avoidedCost: 56000, date: "2026-02-08" },
    ];
    const yearlyTrend = [
      { month: "Jan", incidents: 10, totalCost: "430k", avgCost: "146k", insured: 47 },
      { month: "Feb", incidents: 7, totalCost: "473k", avgCost: "193k", insured: 47 },
      { month: "Mar", incidents: 4, totalCost: "516k", avgCost: "59k", insured: 47 },
      { month: "Apr", incidents: 12, totalCost: "559k", avgCost: "106k", insured: 47 },
      { month: "May", incidents: 9, totalCost: "602k", avgCost: "153k", insured: 47 },
      { month: "Jun", incidents: 6, totalCost: "645k", avgCost: "200k", insured: 47 },
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



declare global { interface HTMLElementTagNameMap { 'sc-ransomware-simulator': ScRansomwareSimulator; } }
