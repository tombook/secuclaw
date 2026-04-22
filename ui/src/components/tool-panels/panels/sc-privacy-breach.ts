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
}
