/**
 * sc-privacy-breach.ts - Privacy Breach Response Workflow (Privacy Officer Dark Capability)
 * Data classification, breach scenario analysis, impact calculator, regulatory timeline tracker,
 * response workflow, affected subject estimation, documentation generator
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

type BreachSeverity = 'critical' | 'high' | 'medium' | 'low';
type BreachCategory = 'unauthorized-access' | 'data-loss' | 'data-theft' | 'accidental-disclosure' | 'ransomware' | 'insider-threat' | 'third-party';
type PIIType = 'name' | 'email' | 'phone' | 'address' | 'ssn' | 'financial' | 'health' | 'biometric' | 'credentials' | 'location';
type WorkflowPhase = 'identification' | 'containment' | 'assessment' | 'notification' | 'remediation' | 'review';
type RegulatoryFramework = 'gdpr' | 'ccpa' | 'hipaa' | 'pdpa' | 'lgpd' | 'pipeda';

interface DataClassification {
  piiType: PIIType;
  volume: number;
  sensitivity: 'high' | 'medium' | 'low';
  encrypted: boolean;
  pseudonymized: boolean;
  retentionPolicy: string;
}

interface BreachScenario {
  id: string;
  category: BreachCategory;
  name: string;
  description: string;
  likelihood: number;
  dataTypes: PIIType[];
  regulatoryImpact: RegulatoryFramework[];
  baseFine: number;
  maxFine: number;
}

interface RegulatoryRequirement {
  framework: RegulatoryFramework;
  notificationDeadline: string;
  deadlineHours: number;
  notifyAuthority: boolean;
  notifySubjects: boolean;
  documentationRequired: string[];
  penaltyRange: string;
  dpoRequired: boolean;
}

interface BreachAssessment {
  id: string;
  timestamp: string;
  scenario: BreachScenario;
  classifications: DataClassification[];
  affectedSubjects: number;
  dataVolume: string;
  detectionDate: string;
  breachStartDate: string;
  breachEndDate: string;
  containmentStatus: string;
  riskScore: number;
  regulatoryRequirements: RegulatoryRequirement[];
  estimatedFine: number;
  reputationImpact: 'severe' | 'significant' | 'moderate' | 'minor';
}

interface WorkflowStep {
  phase: WorkflowPhase;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  completedAt?: string;
  assignee: string;
  actions: string[];
  evidence: string[];
}

interface ExecutionRecord {
  id: string;
  timestamp: string;
  scenarioId: string;
  scenarioName: string;
  riskScore: number;
  affectedSubjects: number;
  estimatedFine: number;
  status: 'success' | 'failed' | 'running';
  duration: number;
  params: Record<string, string | number>;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  category: 'assessment' | 'workflow' | 'notification' | 'config' | 'export';
}

interface CommentEntry {
  id: string;
  timestamp: string;
  author: string;
  text: string;
  phase: WorkflowPhase;
}

@customElement('sc-privacy-breach')
export class ScPrivacyBreach extends LitElement {
  @property({ type: String }) panelId = 'privacy-breach';
  @state() private _activeTab: 'assessment' | 'workflow' | 'timeline' | 'report' | 'history' | 'audit' | 'settings' = 'assessment';
  @state() private _scenario: BreachScenario | null = null;
  @state() private _classifications: DataClassification[] = [];
  @state() private _assessment: BreachAssessment | null = null;
  @state() private _workflowSteps: WorkflowStep[] = [];
  @state() private _currentPhase: WorkflowPhase = 'identification';
  @state() private _breachName = '';
  @state() private _detectionDate = new Date().toISOString().split('T')[0];
  @state() private _breachStartDate = '';
  @state() private _breachEndDate = '';
  @state() private _affectedSubjects = 1000;
  @state() private _selectedFramework: RegulatoryFramework = 'gdpr';
  @state() private _showReport = false;
  @state() private _reportContent = '';
  @state() private _assessing = false;
  @state() private _progress = 0;
  @state() private _historyExecutions: ExecutionRecord[] = [];
  @state() private _activeSettingsTab: 'general' | 'thresholds' | 'integrations' = 'general';
  @state() private _showSettings = false;
  @state() private _slaThreshold = 48;
  @state() private _alertThreshold = 7;
  @state() private _notifyEmail = '';
  @state() private _webhookUrl = '';
  @state() private _autoEscalate = true;
  @state() private _auditLog: AuditEntry[] = [];
  @state() private _auditFilter = 'all';
  @state() private _comments: CommentEntry[] = [];
  @state() private _newComment = '';
  @state() private _sortColumn = 'timestamp';
  @state() private _sortDir: 'asc' | 'desc' = 'desc';
  @state() private _tablePage = 0;
  @state() private _tablePageSize = 10;
  @state() private _selectedRows: Set<string> = new Set();
  @state() private _groupField = 'category';
  @state() private _expandedRow: string | null = null;

  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #0f1117); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
    .title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid #2a2d3a; }
    .tab { padding: 8px 16px; cursor: pointer; border: none; background: none; color: #6b7280; font-size: 13px; font-weight: 500; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .tab:hover { color: #d1d5db; }
    .tab.active { color: #e2e8f0; border-bottom-color: #3b82f6; }
    .btn { padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; font-family: inherit; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover:not(:disabled) { background: #2563eb; }
    .btn-secondary { background: #374151; color: #d1d5db; }
    .btn-secondary:hover:not(:disabled) { background: #4b5563; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-sm { padding: 4px 10px; font-size: 11px; }
    .btn-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group.full { grid-column: 1 / -1; }
    label { font-size: 12px; color: #9ca3af; font-weight: 500; }
    input, select, textarea { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 6px; padding: 8px 12px; color: #e2e8f0; font-size: 13px; outline: none; font-family: inherit; }
    input:focus, select:focus, textarea:focus { border-color: #3b82f6; }
    .progress-bar { width: 100%; height: 6px; background: #1a1d27; border-radius: 3px; overflow: hidden; margin-bottom: 12px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 3px; transition: width 0.3s; }
    .scenario-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .scenario-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 14px; cursor: pointer; transition: all 0.2s; }
    .scenario-card:hover { border-color: #3b82f6; }
    .scenario-card.selected { border-color: #3b82f6; background: #1e2a3a; }
    .scenario-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .scenario-desc { font-size: 12px; color: #9ca3af; margin-bottom: 8px; }
    .scenario-meta { display: flex; gap: 8px; flex-wrap: wrap; font-size: 11px; }
    .tag { padding: 2px 8px; border-radius: 4px; background: #374151; color: #d1d5db; }
    .tag-high { background: #78350f; color: #fcd34d; }
    .tag-critical { background: #7f1d1d; color: #fca5a5; }
    .pii-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; margin-bottom: 16px; }
    .pii-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; }
    .pii-type { font-weight: 600; font-size: 13px; margin-bottom: 6px; }
    .pii-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 3px; }
    .pii-label { color: #9ca3af; }
    .impact-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .impact-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #2a2d3a; font-size: 13px; }
    .impact-value { font-weight: 700; }
    .impact-critical { color: #f87171; }
    .impact-high { color: #fbbf24; }
    .impact-medium { color: #60a5fa; }
    .workflow-timeline { display: flex; flex-direction: column; gap: 0; margin-bottom: 16px; }
    .wf-phase { display: flex; gap: 16px; }
    .wf-track { display: flex; flex-direction: column; align-items: center; width: 24px; }
    .wf-dot { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #4b5563; background: #1a1d27; flex-shrink: 0; }
    .wf-dot.completed { background: #34d399; border-color: #34d399; }
    .wf-dot.active { background: #3b82f6; border-color: #3b82f6; box-shadow: 0 0 8px rgba(59,130,246,0.5); }
    .wf-line { width: 2px; flex: 1; background: #2a2d3a; min-height: 20px; }
    .wf-line.completed { background: #34d399; }
    .wf-content { padding-bottom: 16px; flex: 1; }
    .wf-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .wf-desc { font-size: 12px; color: #9ca3af; margin-bottom: 6px; }
    .wf-actions { font-size: 11px; color: #d1d5db; }
    .wf-action-item { display: flex; align-items: center; gap: 6px; margin-bottom: 3px; }
    .wf-check { width: 14px; height: 14px; border: 1px solid #4b5563; border-radius: 3px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
    .wf-check.checked { background: #34d399; border-color: #34d399; color: #064e3b; }
    .reg-table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
    .reg-table th { text-align: left; padding: 8px 12px; background: #1a1d27; color: #9ca3af; font-weight: 600; border-bottom: 1px solid #2a2d3a; }
    .reg-table td { padding: 8px 12px; border-bottom: 1px solid #1a1d27; }
    .reg-table tr:hover td { background: #1a1d27; }
    .report-box { background: #0a0c10; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; font-size: 12px; line-height: 1.8; max-height: 400px; overflow-y: auto; white-space: pre-wrap; font-family: 'JetBrains Mono', monospace; color: #d1d5db; }
    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    .deadline-urgent { color: #f87171; font-weight: 700; }
    .deadline-ok { color: #34d399; }
    .settings-panel { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .settings-title { font-weight: 700; font-size: 14px; margin-bottom: 12px; color: #e2e8f0; }
    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .slider-row { display: flex; align-items: center; gap: 10px; }
    .slider-row input[type="range"] { flex: 1; accent-color: #3b82f6; background: transparent; border: none; padding: 0; }
    .slider-val { font-size: 13px; font-weight: 700; color: #3b82f6; min-width: 40px; text-align: right; }
    .audit-log { max-height: 300px; overflow-y: auto; }
    .audit-entry { display: flex; gap: 10px; padding: 8px 10px; background: #0a0c10; border-radius: 6px; margin-bottom: 4px; font-size: 12px; align-items: flex-start; }
    .audit-cat { padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; flex-shrink: 0; margin-top: 2px; }
    .audit-cat-assessment { background: #3b82f620; color: #60a5fa; }
    .audit-cat-workflow { background: #f59e0b20; color: #fbbf24; }
    .audit-cat-notification { background: #ef444420; color: #f87171; }
    .audit-cat-config { background: #8b5cf620; color: #a78bfa; }
    .audit-cat-export { background: #22c55e20; color: #34d399; }
    .comment-section { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
    .comment-item { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #2a2d3a; }
    .comment-item:last-child { border-bottom: none; }
    .comment-avatar { width: 28px; height: 28px; border-radius: 50%; background: #374151; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .comment-body { flex: 1; }
    .comment-author { font-weight: 600; font-size: 12px; }
    .comment-time { font-size: 10px; color: #6b7280; margin-left: 8px; }
    .comment-text { font-size: 12px; color: #d1d5db; margin-top: 2px; }
    .comment-input-row { display: flex; gap: 8px; margin-top: 10px; }
    .comment-input-row input { flex: 1; }
    .exec-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .exec-table th { text-align: left; padding: 8px 10px; background: #0a0c10; color: #9ca3af; font-weight: 600; border-bottom: 1px solid #2a2d3a; cursor: pointer; user-select: none; position: sticky; top: 0; z-index: 1; }
    .exec-table th:hover { color: #e2e8f0; }
    .exec-table td { padding: 7px 10px; border-bottom: 1px solid #1a1d27; }
    .exec-table tr:hover td { background: #1a1d2780; }
    .exec-table tr.selected td { background: #3b82f615; }
    .table-toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
    .table-toolbar select, .table-toolbar input { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 4px; padding: 4px 8px; color: #e2e8f0; font-size: 11px; }
    .page-nav { display: flex; gap: 4px; justify-content: center; margin-top: 8px; }
    .page-btn { padding: 4px 10px; border: 1px solid #2a2d3a; border-radius: 4px; background: transparent; color: #9ca3af; cursor: pointer; font-size: 11px; }
    .page-btn:hover { border-color: #3b82f6; color: #e2e8f0; }
    .page-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
    .sla-bar { display: flex; align-items: center; gap: 12px; background: #1a1d27; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
    .sla-indicator { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
    .sla-text { font-size: 13px; }
    .sla-time { font-weight: 700; font-size: 16px; }
    .batch-actions { display: flex; gap: 6px; }
    .checkbox-cell { width: 30px; text-align: center; }
    .checkbox-cell input { accent-color: #3b82f6; }
    .group-header { background: #0a0c10; padding: 8px 10px; font-weight: 700; font-size: 12px; color: #3b82f6; cursor: pointer; display: flex; align-items: center; gap: 6px; }
    .group-header:hover { background: #1a1d27; }
    .expand-row { background: #0a0c10; padding: 10px; }
    .expand-content { font-size: 11px; color: #94a3b8; line-height: 1.6; }
    @media (max-width: 640px) { .form-grid { grid-template-columns: 1fr; } .scenario-grid, .pii-grid { grid-template-columns: 1fr; } .settings-grid { grid-template-columns: 1fr; } }
  `;

  private _scenarios: BreachScenario[] = [
    { id: 'BS1', category: 'unauthorized-access', name: 'Unauthorized Database Access', description: 'Employee accessed customer database beyond authorized scope', likelihood: 75, dataTypes: ['name', 'email', 'phone', 'address', 'financial'], regulatoryImpact: ['gdpr', 'ccpa', 'hipaa'], baseFine: 500000, maxFine: 20000000 },
    { id: 'BS2', category: 'ransomware', name: 'Ransomware Attack on File Server', description: 'Ransomware encrypted files containing PII on shared drive', likelihood: 60, dataTypes: ['name', 'email', 'ssn', 'health', 'financial'], regulatoryImpact: ['gdpr', 'hipaa', 'ccpa'], baseFine: 1000000, maxFine: 50000000 },
    { id: 'BS3', category: 'data-theft', name: 'Data Exfiltration by Departing Employee', description: 'Employee downloaded customer data before leaving organization', likelihood: 55, dataTypes: ['name', 'email', 'phone', 'financial', 'credentials'], regulatoryImpact: ['gdpr', 'ccpa', 'pdpa'], baseFine: 300000, maxFine: 15000000 },
    { id: 'BS4', category: 'accidental-disclosure', name: 'Email Misdirected with PII Attachment', description: 'Employee sent spreadsheet with customer data to wrong recipient', likelihood: 80, dataTypes: ['name', 'email', 'phone', 'address'], regulatoryImpact: ['gdpr', 'ccpa', 'pipeda'], baseFine: 100000, maxFine: 5000000 },
    { id: 'BS5', category: 'third-party', name: 'Third-Party Vendor Data Breach', description: 'Service provider experienced breach exposing shared customer data', likelihood: 45, dataTypes: ['name', 'email', 'financial', 'credentials'], regulatoryImpact: ['gdpr', 'ccpa', 'hipaa', 'pdpa'], baseFine: 500000, maxFine: 30000000 },
    { id: 'BS6', category: 'insider-threat', name: 'Privileged Insider Credential Abuse', description: 'System administrator used elevated access to access sensitive records', likelihood: 30, dataTypes: ['name', 'email', 'ssn', 'health', 'biometric', 'financial'], regulatoryImpact: ['gdpr', 'hipaa', 'ccpa', 'lgpd'], baseFine: 2000000, maxFine: 100000000 },
  ];

  private _regulatoryMap: Record<RegulatoryFramework, RegulatoryRequirement> = {
    gdpr: { framework: 'gdpr', notificationDeadline: '72 hours', deadlineHours: 72, notifyAuthority: true, notifySubjects: true, documentationRequired: ['Nature of breach', 'Categories and number of data subjects', 'DPO contact', 'Consequences', 'Measures taken'], penaltyRange: 'Up to 20M EUR or 4% global turnover', dpoRequired: true },
    ccpa: { framework: 'ccpa', notificationDeadline: 'Expeditious, no specific timeline', deadlineHours: 0, notifyAuthority: false, notifySubjects: true, documentationRequired: ['Types of info compromised', 'Business contact info', 'Consumer rights notice'], penaltyRange: '$100-$750 per consumer per incident', dpoRequired: false },
    hipaa: { framework: 'hipaa', notificationDeadline: '60 days (individuals), 2 days (HHS if >500)', deadlineHours: 1440, notifyAuthority: true, notifySubjects: true, documentationRequired: ['Breach description', 'Types of PHI', 'Steps to protect', 'Mitigation actions'], penaltyRange: '$100-$50,000 per violation (max $1.5M/year)', dpoRequired: true },
    pdpa: { framework: 'pdpa', notificationDeadline: 'As soon as practicable', deadlineHours: 168, notifyAuthority: true, notifySubjects: true, documentationRequired: ['Breach circumstances', 'Data involved', 'Actions taken', 'Contact information'], penaltyRange: 'Up to SGD 1M or 10% annual turnover', dpoRequired: true },
    lgpd: { framework: 'lgpd', notificationDeadline: 'Reasonable time', deadlineHours: 72, notifyAuthority: true, notifySubjects: true, documentationRequired: ['Nature of data', 'Subjects affected', 'Risk measures', 'Remediation steps'], penaltyRange: 'Up to 2% revenue (max 50M BRL per infraction)', dpoRequired: true },
    pipeda: { framework: 'pipeda', notificationDeadline: 'As soon as feasible', deadlineHours: 0, notifyAuthority: false, notifySubjects: true, documentationRequired: ['What happened', 'What info was compromised', 'What we are doing', 'What to do'], penaltyRange: 'Up to CAD 100,000 per violation', dpoRequired: false },
  };

  private _selectScenario(s: BreachScenario): void {
    this._scenario = s;
    this._classifications = s.dataTypes.map(dt => ({
      piiType: dt, volume: Math.floor(Math.random() * 50000) + 1000, sensitivity: ['ssn', 'health', 'biometric', 'financial'].includes(dt) ? 'high' : ['name', 'email', 'phone', 'credentials'].includes(dt) ? 'medium' : 'low',
      encrypted: Math.random() > 0.5, pseudonymized: Math.random() > 0.7, retentionPolicy: '7 years',
    }));
  }

  private _runAssessment(): void {
    if (!this._scenario) return;
    this._assessing = true;
    this._progress = 0;
    const scenario = this._scenario;

    const reqs = scenario.regulatoryImpact.map(f => this._regulatoryMap[f]).filter(Boolean);
    const volFactor = this._affectedSubjects > 100000 ? 3 : this._affectedSubjects > 10000 ? 2 : this._affectedSubjects > 1000 ? 1.5 : 1;
    const sensFactor = this._classifications.filter(c => c.sensitivity === 'high').length * 0.3;
    const encFactor = this._classifications.every(c => c.encrypted) ? 0.5 : 1;
    const estimatedFine = Math.round(scenario.baseFine * volFactor * (1 + sensFactor) * encFactor);
    const riskScore = Math.min(10, Math.round((scenario.likelihood / 10 + volFactor + sensFactor) * 1.5));

    this._assessment = {
      id: 'BA-' + Date.now(), timestamp: new Date().toISOString(), scenario,
      classifications: this._classifications, affectedSubjects: this._affectedSubjects,
      dataVolume: this._classifications.reduce((s, c) => s + c.volume, 0).toLocaleString() + ' records',
      detectionDate: this._detectionDate, breachStartDate: this._breachStartDate, breachEndDate: this._breachEndDate,
      containmentStatus: 'Active investigation', riskScore, regulatoryRequirements: reqs,
      estimatedFine, reputationImpact: riskScore >= 8 ? 'severe' : riskScore >= 6 ? 'significant' : riskScore >= 4 ? 'moderate' : 'minor',
    };

    this._workflowSteps = [
      { phase: 'identification', name: 'Identify and Contain', description: 'Immediately secure affected systems and preserve evidence', status: 'in-progress', assignee: 'Incident Response Team', actions: ['Isolate affected systems', 'Preserve forensic evidence', 'Change compromised credentials', 'Activate incident response plan', 'Brief legal counsel'], evidence: [] },
      { phase: 'containment', name: 'Contain Breach', description: 'Stop ongoing data loss and prevent further exposure', status: 'pending', assignee: 'Security Team', actions: ['Block exfiltration channels', 'Revoke compromised access', 'Patch exploited vulnerability', 'Deploy additional monitoring', 'Notify internal stakeholders'], evidence: [] },
      { phase: 'assessment', name: 'Assess Impact', description: 'Determine scope and severity of data compromise', status: 'pending', assignee: 'Privacy Team', actions: ['Identify all affected data types', 'Quantify affected individuals', 'Assess data sensitivity', 'Evaluate encryption status', 'Determine regulatory obligations'], evidence: [] },
      { phase: 'notification', name: 'Regulatory Notification', description: 'Notify authorities and affected individuals per regulatory requirements', status: 'pending', assignee: 'Legal / DPO', actions: ['Prepare authority notification', 'Draft subject notification', 'Set up call center/support', 'Submit regulatory filings', 'Document all notifications'], evidence: [] },
      { phase: 'remediation', name: 'Remediate and Recover', description: 'Fix root cause and implement preventive measures', status: 'pending', assignee: 'Engineering Team', actions: ['Fix root cause vulnerability', 'Implement additional controls', 'Update security policies', 'Conduct staff retraining', 'Perform penetration testing'], evidence: [] },
      { phase: 'review', name: 'Post-Incident Review', description: 'Analyze response effectiveness and update procedures', status: 'pending', assignee: 'Privacy Team', actions: ['Conduct lessons learned', 'Update incident response plan', 'Review data handling practices', 'Implement monitoring improvements', 'Schedule follow-up audit'], evidence: [] },
    ];

    let p = 0;
    const iv = setInterval(() => {
      p += 15;
      this._progress = Math.min(p, 100);
      if (p >= 100) {
        clearInterval(iv);
        this._assessing = false;
        this._activeTab = 'workflow';
      }
    }, 200);
  }

  private _completeAction(phaseIdx: number, actionIdx: number): void {
    const step = this._workflowSteps[phaseIdx];
    if (!step) return;
    step.actions[actionIdx] = step.actions[actionIdx]; // keep text
    // toggle completion by checking if phase is complete
    const allDone = step.status === 'completed';
    if (allDone) {
      step.status = 'in-progress';
    }
    this._workflowSteps = [...this._workflowSteps];
  }

  private _completePhase(phaseIdx: number): void {
    const step = this._workflowSteps[phaseIdx];
    if (!step) return;
    step.status = step.status === 'completed' ? 'in-progress' : 'completed';
    step.completedAt = step.status === 'completed' ? new Date().toISOString() : undefined;
    if (step.status === 'completed' && phaseIdx < this._workflowSteps.length - 1) {
      this._workflowSteps[phaseIdx + 1].status = 'in-progress';
      this._currentPhase = this._workflowSteps[phaseIdx + 1].phase;
    }
    this._workflowSteps = [...this._workflowSteps];
  }

  private _getTimeRemaining(hours: number): { text: string; urgent: boolean } {
    if (hours <= 0) return { text: 'No strict deadline', urgent: false };
    const detection = new Date(this._detectionDate);
    const deadline = new Date(detection.getTime() + hours * 3600000);
    const now = new Date();
    const remaining = deadline.getTime() - now.getTime();
    if (remaining <= 0) return { text: 'DEADLINE PASSED', urgent: true };
    const days = Math.floor(remaining / 86400000);
    const hrs = Math.floor((remaining % 86400000) / 3600000);
    return { text: `${days}d ${hrs}h remaining`, urgent: remaining < 86400000 };
  }

  private _generateReport(): void {
    if (!this._assessment) return;
    const a = this._assessment;
    const lines: string[] = [];
    lines.push('# Privacy Breach Assessment Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Breach: ${this._breachName || a.scenario.name}`);
    lines.push('');
    lines.push('## Breach Summary');
    lines.push(`- Category: ${a.scenario.category.replace(/-/g, ' ')}`);
    lines.push(`- Detection Date: ${a.detectionDate}`);
    lines.push(`- Affected Subjects: ${a.affectedSubjects.toLocaleString()}`);
    lines.push(`- Data Volume: ${a.dataVolume}`);
    lines.push(`- Risk Score: ${a.riskScore}/10`);
    lines.push(`- Reputation Impact: ${a.reputationImpact}`);
    lines.push(`- Estimated Fine: $${a.estimatedFine.toLocaleString()}`);
    lines.push('');
    lines.push('## Data Classification');
    a.classifications.forEach(c => {
      lines.push(`- ${c.piiType}: ${c.volume.toLocaleString()} records, ${c.sensitivity} sensitivity, Encrypted: ${c.encrypted}, Pseudonymized: ${c.pseudonymized}`);
    });
    lines.push('');
    lines.push('## Regulatory Requirements');
    a.regulatoryRequirements.forEach(r => {
      const time = this._getTimeRemaining(r.deadlineHours);
      lines.push(`### ${r.framework.toUpperCase()}`);
      lines.push(`- Notification Deadline: ${r.notificationDeadline} ${time.urgent ? '(URGENT)' : ''}`);
      lines.push(`- Notify Authority: ${r.notifyAuthority ? 'Yes' : 'No'}`);
      lines.push(`- Notify Subjects: ${r.notifySubjects ? 'Yes' : 'No'}`);
      lines.push(`- Penalty Range: ${r.penaltyRange}`);
      lines.push(`- Required Documentation: ${r.documentationRequired.join(', ')}`);
    });
    lines.push('');
    lines.push('## Workflow Progress');
    this._workflowSteps.forEach(s => {
      lines.push(`- [${s.status === 'completed' ? 'x' : ' '}] ${s.name} (${s.status})`);
      s.actions.forEach(act => { lines.push(`  - ${act}`); });
    });
    lines.push('');
    lines.push('## Recommendations');
    lines.push('1. Engage legal counsel immediately for regulatory guidance');
    lines.push('2. Prioritize notification to meet regulatory deadlines');
    lines.push('3. Implement technical containment to prevent further data loss');
    lines.push('4. Prepare clear communication for affected individuals');
    lines.push('5. Document all response actions for regulatory compliance');
    lines.push('6. Schedule post-incident review within 30 days');
    this._reportContent = lines.join('\n');
    this._showReport = true;
    this._activeTab = 'report';
  }

  private _exportReport(): void {
    if (!this._reportContent) return;
    const blob = new Blob([this._reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacy-breach-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    this._addAuditEntry('export', 'Report exported as Markdown');
  }

  private _addAuditEntry(category: AuditEntry['category'], details: string): void {
    this._auditLog = [{ id: 'au-' + Date.now(), timestamp: new Date().toISOString(), action: category, user: 'Current User', details, category }, ...this._auditLog].slice(0, 50);
  }

  private _addComment(): void {
    if (!this._newComment.trim()) return;
    this._comments = [{ id: 'cm-' + Date.now(), timestamp: new Date().toISOString(), author: 'Current User', text: this._newComment.trim(), phase: this._currentPhase }, ...this._comments].slice(0, 30);
    this._newComment = '';
    this._addAuditEntry('workflow', 'Comment added for phase: ' + this._currentPhase);
  }

  private _runAssessmentWithHistory(): void {
    const startTime = Date.now();
    this._addAuditEntry('assessment', 'Starting assessment for scenario: ' + (this._scenario?.name || 'unknown'));
    this._runAssessment();
    const record: ExecutionRecord = {
      id: 'EX-' + Date.now(),
      timestamp: new Date().toISOString(),
      scenarioId: this._scenario?.id || '',
      scenarioName: this._scenario?.name || '',
      riskScore: this._assessment?.riskScore || 0,
      affectedSubjects: this._affectedSubjects,
      estimatedFine: this._assessment?.estimatedFine || 0,
      status: 'success',
      duration: 0,
      params: { framework: this._selectedFramework, detectionDate: this._detectionDate },
    };
    const iv = setInterval(() => {
      record.duration = Math.round((Date.now() - startTime) / 1000);
      if (this._progress >= 100) {
        clearInterval(iv);
        this._historyExecutions = [record, ...this._historyExecutions].slice(0, 20);
        this._addAuditEntry('assessment', 'Assessment completed. Risk score: ' + record.riskScore);
      }
    }, 200);
  }

  private _replayExecution(record: ExecutionRecord): void {
    const scenario = this._scenarios.find(s => s.id === record.scenarioId);
    if (!scenario) return;
    this._selectScenario(scenario);
    this._affectedSubjects = record.affectedSubjects;
    this._selectedFramework = record.params.framework as RegulatoryFramework;
    this._addAuditEntry('assessment', 'Replaying execution: ' + record.id);
    setTimeout(() => this._runAssessmentWithHistory(), 100);
  }

  private _batchDeleteHistory(): void {
    const count = this._selectedRows.size;
    this._historyExecutions = this._historyExecutions.filter(r => !this._selectedRows.has(r.id));
    this._selectedRows = new Set();
    this._addAuditEntry('config', 'Deleted ' + count + ' execution records');
  }

  private _getSLAStatus(): { remaining: number; text: string; color: string; percent: number } {
    if (!this._detectionDate || !this._assessment) return { remaining: 0, text: 'No active assessment', color: '#6b7280', percent: 100 };
    const detection = new Date(this._detectionDate).getTime();
    const deadline = detection + this._slaThreshold * 3600000;
    const now = Date.now();
    const remaining = Math.max(0, deadline - now);
    const total = this._slaThreshold * 3600000;
    const percent = Math.round((remaining / total) * 100);
    const hrs = Math.floor(remaining / 3600000);
    const mins = Math.floor((remaining % 3600000) / 60000);
    if (remaining <= 0) return { remaining: 0, text: 'DEADLINE EXCEEDED', color: '#ef4444', percent: 0 };
    if (percent < 25) return { remaining, text: `${hrs}h ${mins}m - CRITICAL`, color: '#ef4444', percent };
    if (percent < 50) return { remaining, text: `${hrs}h ${mins}m - Warning`, color: '#f59e0b', percent };
    return { remaining, text: `${hrs}h ${mins}m remaining`, color: '#22c55e', percent };
  }

  private _getSortedHistory(): ExecutionRecord[] {
    const records = [...this._historyExecutions];
    records.sort((a, b) => {
      let cmp = 0;
      const col = this._sortColumn;
      if (col === 'timestamp') cmp = a.timestamp.localeCompare(b.timestamp);
      else if (col === 'scenarioName') cmp = a.scenarioName.localeCompare(b.scenarioName);
      else if (col === 'riskScore') cmp = a.riskScore - b.riskScore;
      else if (col === 'affectedSubjects') cmp = a.affectedSubjects - b.affectedSubjects;
      else if (col === 'estimatedFine') cmp = a.estimatedFine - b.estimatedFine;
      else if (col === 'duration') cmp = a.duration - b.duration;
      return this._sortDir === 'asc' ? cmp : -cmp;
    });
    return records;
  }

  private _getPagedHistory(): { records: ExecutionRecord[]; totalPages: number } {
    const sorted = this._getSortedHistory();
    const totalPages = Math.max(1, Math.ceil(sorted.length / this._tablePageSize));
    const start = this._tablePage * this._tablePageSize;
    return { records: sorted.slice(start, start + this._tablePageSize), totalPages };
  }

  private _toggleSort(col: string): void {
    if (this._sortColumn === col) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortColumn = col;
      this._sortDir = 'desc';
    }
  }

  private _getGroupedHistory(): Map<string, ExecutionRecord[]> {
    const groups = new Map<string, ExecutionRecord[]>();
    this._getSortedHistory().forEach(r => {
      const key = r.params[this._groupField] || 'Unknown';
      const list = groups.get(String(key)) || [];
      list.push(r);
      groups.set(String(key), list);
    });
    return groups;
  }

  private _renderSLABar() {
    const sla = this._getSLAStatus();
    return html`<div class="sla-bar">
      <div class="sla-indicator" style="background:${sla.color}"></div>
      <div style="flex:1">
        <div style="font-size:11px;color:#9ca3af;margin-bottom:4px">Notification SLA (${this._slaThreshold}h threshold)</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${sla.percent}%;background:${sla.color}"></div></div>
      </div>
      <div class="sla-time" style="color:${sla.color}">${sla.text}</div>
    </div>`;
  }

  private _renderComments() {
    const phaseComments = this._comments.filter(c => c.phase === this._currentPhase);
    return html`<div class="comment-section">
      <div style="font-weight:600;font-size:13px;margin-bottom:10px">Discussion - ${this._currentPhase.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())} Phase (${phaseComments.length})</div>
      ${phaseComments.length === 0 ? html`<div style="font-size:12px;color:#6b7280;padding:8px 0">No comments yet. Start the discussion below.</div>` : ''}
      ${phaseComments.map(c => html`<div class="comment-item">
        <div class="comment-avatar">${c.author.charAt(0)}</div>
        <div class="comment-body">
          <div><span class="comment-author">${c.author}</span><span class="comment-time">${new Date(c.timestamp).toLocaleString()}</span></div>
          <div class="comment-text">${c.text}</div>
        </div>
      </div>`)}
      <div class="comment-input-row">
        <input type="text" placeholder="Add a comment..." .value=${this._newComment} @input=${(e: Event) => { this._newComment = (e.target as HTMLInputElement).value; }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._addComment(); }}>
        <button class="btn btn-primary btn-sm" @click=${this._addComment}>Post</button>
      </div>
    </div>`;
  }

  private _renderHistoryTable() {
    if (this._historyExecutions.length === 0) return html`<div class="empty-state">No assessment history yet. Run an assessment to see results here.</div>`;
    const { records, totalPages } = this._getPagedHistory();
    const sortIcon = (col: string) => this._sortColumn === col ? (this._sortDir === 'asc' ? ' \u2191' : ' \u2193') : '';
    return html`<div>
      <div class="table-toolbar">
        <span style="font-weight:600;font-size:12px;color:#9ca3af">Execution History (${this._historyExecutions.length})</span>
        <select .value=${this._groupField} @change=${(e: Event) => { this._groupField = (e.target as HTMLSelectElement).value; this._tablePage = 0; }}>
          <option value="category">Group by Framework</option>
          <option value="scenarioId">Group by Scenario</option>
          <option value="riskScore">Group by Risk</option>
        </select>
        <select .value=${String(this._tablePageSize)} @change=${(e: Event) => { this._tablePageSize = parseInt((e.target as HTMLSelectElement).value); this._tablePage = 0; }}>
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="25">25 per page</option>
        </select>
        ${this._selectedRows.size > 0 ? html`<div class="batch-actions">
          <span style="font-size:11px;color:#9ca3af">${this._selectedRows.size} selected</span>
          <button class="btn btn-danger btn-sm" @click=${this._batchDeleteHistory}>Delete Selected</button>
        </div>` : nothing}
      </div>
      <div style="max-height:350px;overflow-y:auto">
        <table class="exec-table">
          <thead><tr>
            <th class="checkbox-cell"><input type="checkbox" .checked=${this._selectedRows.size === this._historyExecutions.length && this._historyExecutions.length > 0} @change=${(e: Event) => {
              const checked = (e.target as HTMLInputElement).checked;
              this._selectedRows = checked ? new Set(this._historyExecutions.map(r => r.id)) : new Set();
            }}></th>
            <th @click=${() => this._toggleSort('timestamp')}>Time${sortIcon('timestamp')}</th>
            <th @click=${() => this._toggleSort('scenarioName')}>Scenario${sortIcon('scenarioName')}</th>
            <th @click=${() => this._toggleSort('riskScore')}>Risk${sortIcon('riskScore')}</th>
            <th @click=${() => this._toggleSort('affectedSubjects')}>Subjects${sortIcon('affectedSubjects')}</th>
            <th @click=${() => this._toggleSort('estimatedFine')}>Est. Fine${sortIcon('estimatedFine')}</th>
            <th @click=${() => this._toggleSort('duration')}>Duration${sortIcon('duration')}</th>
            <th>Actions</th>
          </tr></thead>
          <tbody>
            ${records.map(r => html`<tr class="${this._selectedRows.has(r.id) ? 'selected' : ''}">
              <td class="checkbox-cell"><input type="checkbox" .checked=${this._selectedRows.has(r.id)} @change=${() => {
                const s = new Set(this._selectedRows);
                if (s.has(r.id)) s.delete(r.id); else s.add(r.id);
                this._selectedRows = s;
              }}></td>
              <td style="font-size:11px;color:#6b7280">${new Date(r.timestamp).toLocaleString()}</td>
              <td style="font-weight:600">${r.scenarioName}</td>
              <td><span style="color:${r.riskScore >= 8 ? '#f87171' : r.riskScore >= 6 ? '#fbbf24' : '#34d399'};font-weight:700">${r.riskScore}</span></td>
              <td>${r.affectedSubjects.toLocaleString()}</td>
              <td style="color:#fbbf24">$${r.estimatedFine.toLocaleString()}</td>
              <td>${r.duration}s</td>
              <td><button class="btn btn-secondary btn-sm" @click=${() => this._replayExecution(r)}>Replay</button></td>
            </tr>`)}
          </tbody>
        </table>
      </div>
      ${totalPages > 1 ? html`<div class="page-nav">
        ${Array.from({ length: totalPages }, (_, i) => html`<button class="page-btn ${this._tablePage === i ? 'active' : ''}" @click=${() => { this._tablePage = i; }}>${i + 1}</button>`)}
      </div>` : nothing}
    </div>`;
  }

  private _renderAuditLog() {
    const filtered = this._auditFilter === 'all' ? this._auditLog : this._auditLog.filter(e => e.category === this._auditFilter);
    return html`<div>
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
        ${['all', 'assessment', 'workflow', 'notification', 'config', 'export'].map(f => html`<button class="btn btn-sm ${this._auditFilter === f ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._auditFilter = f; }}>${f}</button>`)}
      </div>
      <div class="audit-log">
        ${filtered.length === 0 ? html`<div style="font-size:12px;color:#6b7280;text-align:center;padding:20px">No audit entries</div>` : ''}
        ${filtered.map(e => html`<div class="audit-entry">
          <span class="audit-cat audit-cat-${e.category}">${e.category}</span>
          <div style="flex:1">
            <div style="color:#e2e8f0;font-weight:500">${e.details}</div>
            <div style="font-size:10px;color:#6b7280;margin-top:2px">${e.user} | ${new Date(e.timestamp).toLocaleString()}</div>
          </div>
        </div>`)}
      </div>
    </div>`;
  }

  private _renderSettings() {
    return html`<div class="settings-panel">
      <div class="settings-title">Panel Settings</div>
      <div class="tabs" style="margin-bottom:12px">
        <button class="tab ${this._activeSettingsTab === 'general' ? 'active' : ''}" @click=${() => { this._activeSettingsTab = 'general'; }}>General</button>
        <button class="tab ${this._activeSettingsTab === 'thresholds' ? 'active' : ''}" @click=${() => { this._activeSettingsTab = 'thresholds'; }}>Thresholds</button>
        <button class="tab ${this._activeSettingsTab === 'integrations' ? 'active' : ''}" @click=${() => { this._activeSettingsTab = 'integrations'; }}>Integrations</button>
      </div>
      ${this._activeSettingsTab === 'general' ? html`<div class="settings-grid">
        <div class="form-group"><label>Default Regulation</label>
          <select .value=${this._selectedFramework} @change=${(e: Event) => { this._selectedFramework = (e.target as HTMLSelectElement).value as RegulatoryFramework; }}>
            <option value="gdpr">GDPR</option><option value="ccpa">CCPA</option><option value="hipaa">HIPAA</option><option value="pdpa">PDPA</option><option value="lgpd">LGPD</option><option value="pipeda">PIPEDA</option>
          </select>
        </div>
        <div class="form-group"><label>Default Assessment Name</label><input type="text" .value=${this._breachName} @input=${(e: Event) => { this._breachName = (e.target as HTMLInputElement).value; }}></div>
        <div class="form-group"><label>Auto-escalate</label>
          <div style="display:flex;align-items:center;gap:8px;padding-top:4px">
            <input type="checkbox" .checked=${this._autoEscalate} @change=${(e: Event) => { this._autoEscalate = (e.target as HTMLInputElement).checked; this._addAuditEntry('config', 'Auto-escalate ' + (this._autoEscalate ? 'enabled' : 'disabled')); }}>
            <span style="font-size:12px;color:#9ca3af">Escalate when SLA < 25%</span>
          </div>
        </div>
      </div>` : nothing}
      ${this._activeSettingsTab === 'thresholds' ? html`<div class="settings-grid">
        <div class="form-group">
          <label>SLA Notification Threshold (hours)</label>
          <div class="slider-row"><input type="range" min="1" max="168" .value=${String(this._slaThreshold)} @input=${(e: Event) => { this._slaThreshold = parseInt((e.target as HTMLInputElement).value); }}><span class="slider-val">${this._slaThreshold}h</span></div>
        </div>
        <div class="form-group">
          <label>Risk Alert Threshold</label>
          <div class="slider-row"><input type="range" min="1" max="10" .value=${String(this._alertThreshold)} @input=${(e: Event) => { this._alertThreshold = parseInt((e.target as HTMLInputElement).value); }}><span class="slider-val">${this._alertThreshold}/10</span></div>
        </div>
        <div class="form-group"><label>Affected Subjects Estimate</label><input type="number" .value=${String(this._affectedSubjects)} @input=${(e: Event) => { this._affectedSubjects = parseInt((e.target as HTMLInputElement).value) || 0; }}></div>
      </div>` : nothing}
      ${this._activeSettingsTab === 'integrations' ? html`<div class="settings-grid">
        <div class="form-group"><label>Notification Email</label><input type="email" .value=${this._notifyEmail} @input=${(e: Event) => { this._notifyEmail = (e.target as HTMLInputElement).value; }} placeholder="privacy-officer@company.com"></div>
        <div class="form-group"><label>Webhook URL</label><input type="url" .value=${this._webhookUrl} @input=${(e: Event) => { this._webhookUrl = (e.target as HTMLInputElement).value; }} placeholder="https://hooks.slack.com/..."></div>
        <div class="form-group" style="grid-column:1/-1"><label>Scheduled Report (Cron)</label><input type="text" placeholder="0 9 * * MON" value="0 9 * * MON"></div>
        <div style="grid-column:1/-1;display:flex;gap:8px;margin-top:4px">
          <button class="btn btn-primary btn-sm" @click=${() => { this._addAuditEntry('config', 'Settings saved'); }}>Save Settings</button>
          <button class="btn btn-secondary btn-sm" @click=${() => { this._addAuditEntry('config', 'Config exported'); }}>Export Config</button>
          <button class="btn btn-secondary btn-sm" @click=${() => { this._addAuditEntry('config', 'Config import requested'); }}>Import Config</button>
        </div>
      </div>` : nothing}
    </div>`;
  }


  // --- Domain Rules Engine ---
  @state() private _pbRules: { id: string; name: string; category: string; severity: Severity; enabled: boolean; lastEval: string; passRate: number }[] = [];
  private _initPbRules() {
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
    this._pbRules = rules;
  }
  private _evaluatePbRules(): { passed: number; failed: number; skipped: number; total: number } {
    let passed = 0, failed = 0, skipped = 0;
    this._pbRules.forEach(r => { if (!r.enabled) { skipped++; } else if (r.passRate >= 80) { passed++; } else { failed++; } });
    return { passed, failed, skipped, total: this._pbRules.length };
  }

  // --- CVSS Scoring ---
  @state() private _pbcvssData: { itemId: string; vector: string; base: number; temporal: number; environmental: number; overall: number }[] = [];
  private _initPbCvss() {
    const vectors = ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:A/AC:H/PR:L/UI:R/S:C/C:L/I:L/A:N', 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N', 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:N/I:L/A:N'];
    this._pbcvssData = vectors.map((v, i) => {
      const base = parseFloat((Math.random() * 6 + 3).toFixed(1));
      const temporal = parseFloat((base * (0.7 + Math.random() * 0.3)).toFixed(1));
      const environmental = parseFloat((temporal * (0.8 + Math.random() * 0.2)).toFixed(1));
      return { itemId: 'V-' + String(i + 1).padStart(3, '0'), vector: v, base, temporal, environmental, overall: environmental };
    });
  }

  // --- Anomaly Detection ---
  @state() private _pbanomalies: { id: string; type: string; severity: Severity; description: string; detected: string; confidence: number; affected: string[] }[] = [];
  private _runPbAnomalyDetection() {
    const types = [
      { type: 'Spike in violation rate', severity: 'high' as Severity, desc: 'Detected 280% increase in violations over the last 24 hours', affected: ['Core', 'Operations'] },
      { type: 'SLA breach pattern', severity: 'critical' as Severity, desc: 'Recurring SLA breaches on weekends indicating staffing gaps', affected: ['SLA', 'Staffing'] },
      { type: 'Baseline drift detected', severity: 'medium' as Severity, desc: 'Score drifted 10 points below established baseline over 7 days', affected: ['Metrics', 'Baseline'] },
      { type: 'Unusual escalation volume', severity: 'high' as Severity, desc: 'Escalation rate 2.5x above normal in infrastructure controls', affected: ['Infrastructure', 'Controls'] },
      { type: 'Stale findings accumulation', severity: 'low' as Severity, desc: '18 findings older than 90 days without status change', affected: ['Maintenance'] },
    ];
    this._pbanomalies = types.map((a, i) => ({
      id: 'ANO-' + String(i + 1).padStart(3, '0'), type: a.type, severity: a.severity,
      description: a.desc, detected: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(2)), affected: a.affected,
    }));
  }

  // --- Trend Prediction ---
  @state() private _pbpredictions: { horizon: string; metric: string; current: number; predicted: number; direction: 'up' | 'down' | 'stable'; confidence: number }[] = [];
  private _generatePbPredictions() {
    this._pbpredictions = [
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
  @state() private _pbApprovals: { id: string; title: string; requester: string; status: 'pending' | 'approved' | 'rejected' | 'expired'; createdAt: string; priority: Priority; type: string }[] = [];
  private _initPbApprovals() {
    this._pbApprovals = [
      { id: 'APR-001', title: 'Emergency exception request for critical finding', requester: 'Alice Chen', status: 'pending', createdAt: '2026-04-23T07:00:00Z', priority: 'p1', type: 'Exception' },
      { id: 'APR-002', title: 'Extend compliance deadline for quarterly audit', requester: 'Bob Martinez', status: 'pending', createdAt: '2026-04-22T18:00:00Z', priority: 'p2', type: 'Extension' },
      { id: 'APR-003', title: 'Disable security control for system migration', requester: 'Carol Wu', status: 'rejected', createdAt: '2026-04-22T14:00:00Z', priority: 'p1', type: 'Policy Change' },
      { id: 'APR-004', title: 'New assessment approval for third-party vendor', requester: 'Dave Kim', status: 'approved', createdAt: '2026-04-21T10:00:00Z', priority: 'p3', type: 'Vendor' },
      { id: 'APR-005', title: 'Network rule change for partner integration', requester: 'Eve Johnson', status: 'expired', createdAt: '2026-04-19T08:00:00Z', priority: 'p2', type: 'Network' },
    ];
  }
  private _approvePbItem(id: string) { const item = this._pbApprovals.find(a => a.id === id); if (item) item.status = 'approved'; this.requestUpdate(); }
  private _rejectPbItem(id: string) { const item = this._pbApprovals.find(a => a.id === id); if (item) item.status = 'rejected'; this.requestUpdate(); }

  // --- Activity Feed ---
  @state() private _pbActivity: { id: string; action: string; user: string; target: string; timestamp: string }[] = [];
  private _initPbActivity() {
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
    this._pbActivity = actions.map((a, i) => ({ id: 'ACT-' + String(i + 1).padStart(3, '0'), ...a, timestamp: new Date(Date.now() - i * 3600000).toISOString() }));
  }

  // --- Notification System ---
  @state() private _pbNotifications: { id: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; read: boolean; timestamp: string }[] = [];
  private _initPbNotifications() {
    this._pbNotifications = [
      { id: 'NTF-001', message: 'Score dropped below threshold', type: 'warning', read: false, timestamp: new Date().toISOString() },
      { id: 'NTF-002', message: '3 items approaching SLA deadline within 24h', type: 'error', read: false, timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: 'NTF-003', message: 'Weekly report generated successfully', type: 'success', read: true, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'NTF-004', message: 'New framework mapped to existing controls', type: 'info', read: true, timestamp: new Date(Date.now() - 14400000).toISOString() },
    ];
  }
  private _markPbNotifRead(id: string) { const n = this._pbNotifications.find(x => x.id === id); if (n) n.read = true; this.requestUpdate(); }

  // --- Panel Configuration ---
  @state() private _pbConfig: { layout: 'compact' | 'default' | 'expanded'; theme: 'dark' | 'midnight' | 'slate'; showAnomalies: boolean; showPredictions: boolean; autoRefresh: boolean; refreshInterval: number } = {
    layout: 'default', theme: 'dark', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60,
  };
  private _pbPresets: { name: string; config: typeof this._pbConfig }[] = [
    { name: 'Analyst View', config: { layout: 'expanded', theme: 'dark', showAnomalies: true, showPredictions: false, autoRefresh: true, refreshInterval: 30 } },
    { name: 'Executive Summary', config: { layout: 'compact', theme: 'slate', showAnomalies: false, showPredictions: true, autoRefresh: false, refreshInterval: 300 } },
    { name: 'Audit Mode', config: { layout: 'expanded', theme: 'midnight', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60 } },
  ];
  private _applyPbPreset(preset: typeof this._pbPresets[0]) { this._pbConfig = { ...preset.config }; this.requestUpdate(); }

  private _renderPbTreemapSVG(): string {
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

  private _renderPbSankeySVG(): string {
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
  private _renderPbRules(): any {
    const ev = this._evaluatePbRules();
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
          $${this._pbRules.map(r => html`
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
  private _renderPbAnomalies(): any {
    const sc = (s: Severity) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Anomaly Detection</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._pbanomalies.map(a => html`
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
  private _renderPbPredictions(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Trend Predictions</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          $${this._pbpredictions.map(pr => html`
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
  private _renderPbApprovals(): any {
    const stc = (s: string) => s === 'pending' ? '#eab308' : s === 'approved' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#6b7280';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Approval Workflow</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._pbApprovals.map(a => html`
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
                  <button class="btn success" style="padding:2px 8px;font-size:9px" @click=$${() => this._approvePbItem(a.id)}>Approve</button>
                  <button class="btn error" style="padding:2px 8px;font-size:9px" @click=$${() => this._rejectPbItem(a.id)}>Reject</button>
                </div>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Activity Feed ---
  private _renderPbActivity(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Activity Feed</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto">
          $${this._pbActivity.map(a => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <div style="width:20px;height:20px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;font-size:9px">•</div>
              <div style="flex:1"><span style="font-weight:600">$${a.user}</span> $${a.action}</div>
              <span style="font-size:8px;color:#6b7280">$${new Date(a.timestamp).toLocaleTimeString()}</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Notifications ---
  private _renderPbNotifications(): any {
    const tc = (t: string) => t === 'error' ? '#ef4444' : t === 'warning' ? '#eab308' : t === 'success' ? '#22c55e' : '#3b82f6';
    const unread = this._pbNotifications.filter(n => !n.read).length;
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Notifications $${unread > 0 ? html`<span class="badge badge-error">$${unread} new</span>` : nothing}</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:120px;overflow-y:auto">
          $${this._pbNotifications.map(n => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:$${n.read ? '#1f2937' : '#252a36'};border-radius:4px;font-size:10px;opacity:$${n.read ? '0.6' : '1'};cursor:pointer" @click=$${() => this._markPbNotifRead(n.id)}>
              <span style="width:8px;height:8px;border-radius:50%;background:$${tc(n.type)}"></span>
              <span style="flex:1">$${n.message}</span>
              $${!n.read ? html`<span style="width:6px;height:6px;border-radius:50%;background:#3b82f6"></span>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Panel Config ---
  private _renderPbConfig(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Panel Configuration</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Layout</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._pbConfig.layout = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="compact" ?selected=$${this._pbConfig.layout === 'compact'}>Compact</option>
              <option value="default" ?selected=$${this._pbConfig.layout === 'default'}>Default</option>
              <option value="expanded" ?selected=$${this._pbConfig.layout === 'expanded'}>Expanded</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Theme</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._pbConfig.theme = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="dark" ?selected=$${this._pbConfig.theme === 'dark'}>Dark</option>
              <option value="midnight" ?selected=$${this._pbConfig.theme === 'midnight'}>Midnight</option>
              <option value="slate" ?selected=$${this._pbConfig.theme === 'slate'}>Slate</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Auto Refresh</span>
            <input type="checkbox" ?checked=$${this._pbConfig.autoRefresh} @change=$${() => { this._pbConfig.autoRefresh = !this._pbConfig.autoRefresh; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Anomalies</span>
            <input type="checkbox" ?checked=$${this._pbConfig.showAnomalies} @change=$${() => { this._pbConfig.showAnomalies = !this._pbConfig.showAnomalies; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Predictions</span>
            <input type="checkbox" ?checked=$${this._pbConfig.showPredictions} @change=$${() => { this._pbConfig.showPredictions = !this._pbConfig.showPredictions; this.requestUpdate(); }}/>
          </div>
          <div style="margin-top:6px;font-weight:600">Presets</div>
          <div style="display:flex;gap:4px">
            $${this._pbPresets.map(ps => html`<button class="btn" style="padding:2px 8px;font-size:9px" @click=$${() => this._applyPbPreset(ps)}>$${ps.name}</button>`)}
          </div>
        </div>
      </div>`;
  }

  render() {
    return html`
      <div class="panel">
        <div class="header">
          <div class="title"><span>&#x1F6E1;</span> Privacy Breach Response</div>
          <div class="btn-row">
            <button class="btn btn-secondary btn-sm" @click=${() => { this._scenario = null; this._assessment = null; this._workflowSteps = []; this._activeTab = 'assessment'; }}>Reset</button>
            <button class="btn btn-secondary btn-sm" @click=${this._generateReport} ?disabled=${!this._assessment}>Generate Report</button>
          </div>
        </div>

        <div class="tabs">
          <button class="tab ${this._activeTab === 'assessment' ? 'active' : ''}" @click=${() => { this._activeTab = 'assessment'; }}>Assessment</button>
          <button class="tab ${this._activeTab === 'workflow' ? 'active' : ''}" @click=${() => { this._activeTab = 'workflow'; }}>Response Workflow</button>
          <button class="tab ${this._activeTab === 'timeline' ? 'active' : ''}" @click=${() => { this._activeTab = 'timeline'; }}>Regulatory Timeline</button>
          <button class="tab ${this._activeTab === 'report' ? 'active' : ''}" @click=${() => { this._activeTab = 'report'; }}>Report</button>
          <button class="tab ${this._activeTab === 'history' ? 'active' : ''}" @click=${() => { this._activeTab = 'history'; }}>History</button>
          <button class="tab ${this._activeTab === 'audit' ? 'active' : ''}" @click=${() => { this._activeTab = 'audit'; }}>Audit</button>
          <button class="tab ${this._activeTab === 'settings' ? 'active' : ''}" @click=${() => { this._activeTab = 'settings'; }}>Settings</button>
        </div>

        ${this._activeTab === 'assessment' ? this._renderAssessment() : nothing}
        ${this._activeTab === 'workflow' ? html`${this._renderSLABar()}${this._renderWorkflow()}${this._renderComments()}` : nothing}
        ${this._activeTab === 'timeline' ? this._renderTimeline() : nothing}
        ${this._activeTab === 'report' ? this._renderReport() : nothing}
        ${this._activeTab === 'history' ? this._renderHistoryTable() : nothing}
        ${this._activeTab === 'audit' ? this._renderAuditLog() : nothing}
        ${this._activeTab === 'settings' ? this._renderSettings() : nothing}
      </div>
    `;
  }

  private _renderAssessment() {
    return html`
      <div>
        <div style="font-weight:600;margin-bottom:8px">1. Select Breach Scenario</div>
        <div class="scenario-grid">
          ${this._scenarios.map(s => html`
            <div class="scenario-card ${this._scenario?.id === s.id ? 'selected' : ''}" @click=${() => this._selectScenario(s)}>
              <div class="scenario-name">${s.name}</div>
              <div class="scenario-desc">${s.description}</div>
              <div class="scenario-meta">
                <span class="tag ${s.likelihood > 60 ? 'tag-critical' : 'tag-high'}">${s.likelihood}% likelihood</span>
                <span class="tag">Fine: $${(s.baseFine / 1000).toFixed(0)}K-$${(s.maxFine / 1000000).toFixed(0)}M</span>
                ${s.regulatoryImpact.map(f => html`<span class="tag">${f.toUpperCase()}</span>`)}
              </div>
            </div>
          `)}
        </div>

        ${this._scenario ? html`
          <div style="font-weight:600;margin-bottom:8px">2. Breach Details</div>
          <div class="form-grid">
            <div class="form-group"><label>Breach Name</label><input type="text" .value=${this._breachName} @input=${(e: Event) => { this._breachName = (e.target as HTMLInputElement).value; }} placeholder="e.g. Q2 Database Incident"></div>
            <div class="form-group"><label>Affected Subjects (est.)</label><input type="number" .value=${String(this._affectedSubjects)} @input=${(e: Event) => { this._affectedSubjects = parseInt((e.target as HTMLInputElement).value) || 0; }}></div>
            <div class="form-group"><label>Detection Date</label><input type="date" .value=${this._detectionDate} @change=${(e: Event) => { this._detectionDate = (e.target as HTMLInputElement).value; }}></div>
            <div class="form-group"><label>Primary Regulation</label>
              <select .value=${this._selectedFramework} @change=${(e: Event) => { this._selectedFramework = (e.target as HTMLSelectElement).value as RegulatoryFramework; }}>
                <option value="gdpr">GDPR</option><option value="ccpa">CCPA</option><option value="hipaa">HIPAA</option><option value="pdpa">PDPA</option><option value="lgpd">LGPD</option><option value="pipeda">PIPEDA</option>
              </select>
            </div>
            <div class="form-group"><label>Breach Start Date</label><input type="date" .value=${this._breachStartDate} @change=${(e: Event) => { this._breachStartDate = (e.target as HTMLInputElement).value; }}></div>
            <div class="form-group"><label>Breach End Date</label><input type="date" .value=${this._breachEndDate} @change=${(e: Event) => { this._breachEndDate = (e.target as HTMLInputElement).value; }}></div>
          </div>

          <div style="font-weight:600;margin-bottom:8px">3. Data Classification</div>
          <div class="pii-grid">
            ${this._classifications.map(c => html`
              <div class="pii-card">
                <div class="pii-type">${c.piiType}</div>
                <div class="pii-row"><span class="pii-label">Volume:</span><span>${c.volume.toLocaleString()} records</span></div>
                <div class="pii-row"><span class="pii-label">Sensitivity:</span><span style="color:${c.sensitivity === 'high' ? '#f87171' : c.sensitivity === 'medium' ? '#fbbf24' : '#34d399'}">${c.sensitivity}</span></div>
                <div class="pii-row"><span class="pii-label">Encrypted:</span><span>${c.encrypted ? 'Yes' : 'No'}</span></div>
                <div class="pii-row"><span class="pii-label">Pseudonymized:</span><span>${c.pseudonymized ? 'Yes' : 'No'}</span></div>
              </div>
            `)}
          </div>

          <div class="btn-row">
            <button class="btn btn-primary" @click=${this._runAssessmentWithHistory} ?disabled=${this._assessing}>Run Impact Assessment</button>
          </div>
          ${this._assessing ? html`<div class="progress-bar"><div class="progress-fill" style="width:${this._progress}%"></div></div>` : nothing}

          ${this._assessment ? html`
            <div style="font-weight:600;margin-bottom:8px">4. Assessment Results</div>
            <div class="impact-card">
              <div class="impact-row"><span>Risk Score</span><span class="impact-value impact-critical">${this._assessment.riskScore}/10</span></div>
              <div class="impact-row"><span>Affected Subjects</span><span class="impact-value">${this._assessment.affectedSubjects.toLocaleString()}</span></div>
              <div class="impact-row"><span>Data Volume</span><span class="impact-value">${this._assessment.dataVolume}</span></div>
              <div class="impact-row"><span>Estimated Fine</span><span class="impact-value impact-high">$${this._assessment.estimatedFine.toLocaleString()}</span></div>
              <div class="impact-row"><span>Reputation Impact</span><span class="impact-value impact-${this._assessment.reputationImpact === 'severe' ? 'critical' : this._assessment.reputationImpact === 'significant' ? 'high' : 'medium'}">${this._assessment.reputationImpact}</span></div>
              <div class="impact-row"><span>Applicable Regulations</span><span class="impact-value">${this._assessment.regulatoryRequirements.map(r => r.framework.toUpperCase()).join(', ')}</span></div>
            </div>
          ` : nothing}
        ` : nothing}
      </div>
    `;
  }

  private _renderWorkflow() {
    if (this._workflowSteps.length === 0) return html`<div class="empty-state">Run an assessment first to activate the response workflow</div>`;
    return html`
      <div style="font-weight:600;margin-bottom:12px">Breach Response Workflow</div>
      <div class="workflow-timeline">
        ${this._workflowSteps.map((s, i) => html`
          <div class="wf-phase">
            <div class="wf-track">
              <div class="wf-dot ${s.status === 'completed' ? 'completed' : s.status === 'in-progress' ? 'active' : ''}"></div>
              ${i < this._workflowSteps.length - 1 ? html`<div class="wf-line ${s.status === 'completed' ? 'completed' : ''}"></div>` : nothing}
            </div>
            <div class="wf-content">
              <div class="wf-title">${s.name} <span style="font-size:11px;color:${s.status === 'completed' ? '#34d399' : s.status === 'in-progress' ? '#3b82f6' : '#6b7280'}">[${s.status.toUpperCase()}]</span></div>
              <div class="wf-desc">${s.description} | Assignee: ${s.assignee}</div>
              <div class="wf-actions">
                ${s.actions.map((act, j) => html`
                  <div class="wf-action-item">
                    <div class="wf-check ${s.status === 'completed' ? 'checked' : ''}" @click=${() => this._completePhase(i)}>${s.status === 'completed' ? '&#x2713;' : ''}</div>
                    <span>${act}</span>
                  </div>
                `)}
              </div>
              <button class="btn btn-sm ${s.status === 'in-progress' ? 'btn-primary' : 'btn-secondary'}" style="margin-top:6px" @click=${() => this._completePhase(i)}>
                ${s.status === 'completed' ? 'Reopen Phase' : 'Mark Complete'}
              </button>
            </div>
          </div>
        `)}
      </div>
    `;
  }

  private _renderTimeline() {
    if (!this._assessment) return html`<div class="empty-state">Run an assessment first</div>`;
    return html`
      <div>
        <div style="font-weight:600;margin-bottom:12px">Regulatory Notification Timeline</div>
        <table class="reg-table">
          <thead><tr><th>Framework</th><th>Deadline</th><th>Time Remaining</th><th>Notify Authority</th><th>Notify Subjects</th><th>Penalty Range</th></tr></thead>
          <tbody>
            ${this._assessment.regulatoryRequirements.map(r => {
              const time = this._getTimeRemaining(r.deadlineHours);
              return html`<tr>
                <td style="font-weight:600">${r.framework.toUpperCase()}</td>
                <td>${r.notificationDeadline}</td>
                <td class="${time.urgent ? 'deadline-urgent' : 'deadline-ok'}">${r.deadlineHours > 0 ? time.text : 'Best effort'}</td>
                <td>${r.notifyAuthority ? 'Yes' : 'No'}</td>
                <td>${r.notifySubjects ? 'Yes' : 'No'}</td>
                <td>${r.penaltyRange}</td>
              </tr>`;
            })}
          </tbody>
        </table>
        <div style="font-weight:600;margin-bottom:8px">Required Documentation</div>
        ${this._assessment.regulatoryRequirements.map(r => html`
          <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-bottom:8px">
            <div style="font-weight:600;font-size:13px;margin-bottom:4px">${r.framework.toUpperCase()} Documentation</div>
            <ul style="font-size:12px;padding-left:20px;color:#d1d5db">
              ${r.documentationRequired.map(d => html`<li>${d}</li>`)}
            </ul>
          </div>
        `)}
      </div>
    `;
  }

  private _renderReport() {
    if (!this._showReport) return html`<div class="empty-state">Click "Generate Report" to create the breach report</div>`;
    return html`<div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:600;font-size:14px">Breach Assessment Report</span>
        <button class="btn btn-primary btn-sm" @click=${this._exportReport}>Export Markdown</button>
      </div>
      <div class="report-box">${this._reportContent}</div>
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
          <span style="font-weight:600;font-size:12px;color:#9ca3af;text-transform:uppercase">Privacy Breach Findings Grid</span>
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

}
