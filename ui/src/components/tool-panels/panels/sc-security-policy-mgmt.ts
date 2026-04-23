/**
 * sc-security-policy-mgmt.ts - Security Policy Management
 * Policy library with CRUD, version control, exception workflow,
 * review scheduling, acknowledgment tracking, compliance scoring,
 * history and export capabilities
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

type PolicyStatus = 'current' | 'review' | 'draft' | 'deprecated' | 'archived';
type ExceptionStatus = 'pending' | 'approved' | 'denied' | 'expired';
type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';
type TabView = 'policies' | 'exceptions' | 'calendar' | 'create' | 'history';

interface Policy {
  id: string;
  name: string;
  category: string;
  version: string;
  status: PolicyStatus;
  lastReview: string;
  nextReview: string;
  owner: string;
  ackRate: number;
  totalEmployees: number;
  ackedEmployees: number;
  riskLevel: SeverityLevel;
  regulatoryRefs: string[];
  description: string;
  changes: string[];
}

interface PolicyException {
  id: string;
  policyId: string;
  policyName: string;
  requester: string;
  department: string;
  reason: string;
  riskMitigation: string;
  requestedDate: string;
  expiryDate: string;
  status: ExceptionStatus;
  approver?: string;
  impactScore: number;
}

interface ReviewEvent {
  id: string;
  policyName: string;
  date: string;
  owner: string;
  type: 'scheduled' | 'overdue' | 'draft';
  urgency: SeverityLevel;
}

interface ExecutionRecord {
  id: string;
  timestamp: string;
  action: string;
  policyName: string;
  result: string;
  details: string;
}

const CATEGORIES = ['Governance', 'Access', 'Data', 'Operations', 'Network', 'Physical', 'Compliance', 'HR'];
const SEVERITY_COLORS: Record<SeverityLevel, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
const STATUS_COLORS: Record<PolicyStatus, string> = { current: '#22c55e', review: '#eab308', draft: '#3b82f6', deprecated: '#ef4444', archived: '#6b7280' };
const EXCEPTION_COLORS: Record<ExceptionStatus, string> = { pending: '#eab308', approved: '#22c55e', denied: '#ef4444', expired: '#6b7280' };

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

@customElement('sc-security-policy-mgmt')
export class ScSecurityPolicyMgmt extends LitElement {
  @property({ type: String }) panelId = 'security-policy-mgmt';

  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; max-height: 80vh; overflow-y: auto; }
    .panel::-webkit-scrollbar { width: 4px; }
    .panel::-webkit-scrollbar-thumb { background: #374151; border-radius: 2px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 16px; }
    .stat { background: #1f2937; border-radius: 8px; padding: 12px; text-align: center; }
    .sv { font-size: 20px; font-weight: 700; }
    .sl { font-size: 9px; color: #94a3b8; margin-top: 2px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; flex-wrap: wrap; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; color: #94a3b8; border: none; }
    .tab:hover { background: #374151; }
    .tab.active { background: #f59e0b; color: #111827; }
    .section { background: #1f2937; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .stitle { font-weight: 600; font-size: 12px; margin-bottom: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
    .badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .policy-row { background: #0f172a; border-radius: 6px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: background 0.2s; }
    .policy-row:hover { background: #1a2744; }
    .policy-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .policy-name { font-weight: 600; font-size: 13px; }
    .policy-meta { display: flex; gap: 12px; font-size: 10px; color: #6b7280; }
    .progress-bar { height: 6px; background: #374151; border-radius: 3px; overflow: hidden; margin-top: 6px; }
    .progress-fill { height: 100%; border-radius: 3px; transition: width 0.5s ease; }
    .exception-row { background: #0f172a; border-radius: 6px; padding: 10px; margin-bottom: 6px; border-left: 3px solid #f97316; }
    .form-group { margin-bottom: 12px; }
    .form-label { display: block; font-size: 11px; font-weight: 600; color: #94a3b8; margin-bottom: 4px; }
    .form-input, .form-select, .form-textarea {
      width: 100%; padding: 8px 12px; background: #0f172a; border: 1px solid #374151; border-radius: 6px;
      color: #e2e8f0; font-size: 12px; font-family: inherit; outline: none;
    }
    .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: #f59e0b; }
    .form-textarea { min-height: 60px; resize: vertical; }
    .form-select { cursor: pointer; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .btn { padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-primary { background: #f59e0b; color: #111827; }
    .btn-primary:hover { background: #d97706; }
    .btn-secondary { background: #374151; color: #e2e8f0; }
    .btn-secondary:hover { background: #4b5563; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-danger:hover { background: #b91c1c; }
    .btn-sm { padding: 4px 10px; font-size: 10px; }
    .btn-row { display: flex; gap: 8px; margin-top: 12px; }
    .severity-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .compliance-score { display: flex; align-items: center; gap: 8px; padding: 12px; background: #0f172a; border-radius: 8px; margin-bottom: 12px; }
    .score-circle { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; }
    .calendar-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #374151; }
    .history-item { padding: 8px 12px; background: #0f172a; border-radius: 6px; margin-bottom: 6px; font-size: 11px; }
    .search-box { position: relative; margin-bottom: 12px; }
    .search-box input { width: 100%; padding: 8px 12px 8px 32px; background: #0f172a; border: 1px solid #374151; border-radius: 6px; color: #e2e8f0; font-size: 12px; outline: none; }
    .search-box input:focus { border-color: #f59e0b; }
    .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); font-size: 12px; }
    .filter-row { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .filter-chip { padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 600; cursor: pointer; background: #374151; color: #94a3b8; border: none; }
    .filter-chip.active { background: #f59e0b; color: #111827; }
    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    .empty-state .icon { font-size: 32px; margin-bottom: 8px; }
    .detail-panel { background: #0f172a; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
    .tag { display: inline-block; padding: 2px 6px; background: #374151; border-radius: 4px; font-size: 9px; margin: 2px; color: #94a3b8; }
    .risk-bar { display: flex; gap: 2px; height: 4px; border-radius: 2px; overflow: hidden; }
    .risk-seg { height: 100%; }
    .sla-bar { display: flex; align-items: center; gap: 12px; background: #1f2937; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; }
    .sla-indicator { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
  `;

  @state() private _tab: TabView = 'policies';
  @state() private _policies: Policy[] = [];
  @state() private _exceptions: PolicyException[] = [];
  @state() private _history: ExecutionRecord[] = [];
  @state() private _searchQuery = '';
  @state() private _filterCategory = '';
  @state() private _filterStatus = '';
  @state() private _selectedPolicy: Policy | null = null;
  @state() private _expandedPolicy: string | null = null;
  @state() private _complianceScore = 0;

  // Create form state
  @state() private _newName = '';
  @state() private _newCategory = 'Governance';
  @state() private _newOwner = '';
  @state() private _newDescription = '';
  @state() private _newRiskLevel: SeverityLevel = 'medium';
  @state() private _newRegRefs = '';
  @state() private _newReviewCycle = 12;

  // Exception form state
  @state() private _excPolicyId = '';
  @state() private _excRequester = '';
  @state() private _excDepartment = '';
  @state() private _excReason = '';
  @state() private _excMitigation = '';
  @state() private _excDuration = 90;
  @state() private _showExceptionForm = false;
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


  connectedCallback() {
    super.connectedCallback();
    this._initData();
  }

  private _initData() {
    this._policies = [
      { id: 'p1', name: 'Information Security Policy', category: 'Governance', version: '3.2', status: 'current', lastReview: '2026-01-15', nextReview: '2026-07-15', owner: 'CISO', ackRate: 94, totalEmployees: 500, ackedEmployees: 470, riskLevel: 'critical', regulatoryRefs: ['ISO 27001', 'SOC 2', 'NIST 800-53'], description: 'Overarching information security policy defining organizational security requirements, roles, and responsibilities.', changes: ['Added cloud security requirements', 'Updated incident reporting SLA to 1 hour', 'Added third-party risk section'] },
      { id: 'p2', name: 'Acceptable Use Policy', category: 'Access', version: '2.1', status: 'current', lastReview: '2026-02-01', nextReview: '2026-08-01', owner: 'IT Security', ackRate: 98, totalEmployees: 500, ackedEmployees: 490, riskLevel: 'high', regulatoryRefs: ['ISO 27001 A.8.1'], description: 'Defines acceptable use of organizational IT resources, including internet, email, and endpoint devices.', changes: ['Added social media guidelines', 'Updated BYOD requirements'] },
      { id: 'p3', name: 'Data Classification Policy', category: 'Data', version: '1.5', status: 'review', lastReview: '2025-10-01', nextReview: '2026-04-01', owner: 'DPO', ackRate: 87, totalEmployees: 500, ackedEmployees: 435, riskLevel: 'critical', regulatoryRefs: ['GDPR Art. 30', 'CCPA', 'HIPAA'], description: 'Establishes data classification levels (Public, Internal, Confidential, Restricted) and handling requirements.', changes: ['Proposed: AI/ML data classification requirements', 'Proposed: Cross-border transfer procedures'] },
      { id: 'p4', name: 'Password Policy', category: 'Access', version: '4.0', status: 'current', lastReview: '2026-03-01', nextReview: '2026-09-01', owner: 'IAM Team', ackRate: 99, totalEmployees: 500, ackedEmployees: 495, riskLevel: 'high', regulatoryRefs: ['NIST SP 800-63B'], description: 'Defines password complexity, rotation, and multi-factor authentication requirements.', changes: ['Migrated to NIST password guidelines', 'Removed forced rotation for MFA users'] },
      { id: 'p5', name: 'Incident Response Policy', category: 'Operations', version: '2.3', status: 'review', lastReview: '2025-11-01', nextReview: '2026-05-01', owner: 'SOC Lead', ackRate: 100, totalEmployees: 85, ackedEmployees: 85, riskLevel: 'critical', regulatoryRefs: ['NIST SP 800-61', 'ISO 27035'], description: 'Defines incident classification, escalation procedures, communication protocols, and post-incident review requirements.', changes: ['Proposed: Ransomware-specific playbook', 'Proposed: Third-party notification SLA'] },
      { id: 'p6', name: 'Remote Work Policy', category: 'HR', version: '1.2', status: 'draft', lastReview: '2026-04-01', nextReview: '2026-05-01', owner: 'HR Director', ackRate: 0, totalEmployees: 500, ackedEmployees: 0, riskLevel: 'medium', regulatoryRefs: ['OSHA Guidelines'], description: 'Establishes security requirements for remote workers including VPN usage, endpoint protection, and data handling.', changes: ['Initial draft creation', 'Pending legal review'] },
      { id: 'p7', name: 'Network Security Policy', category: 'Network', version: '3.0', status: 'current', lastReview: '2026-01-20', nextReview: '2026-07-20', owner: 'Network Ops', ackRate: 92, totalEmployees: 150, ackedEmployees: 138, riskLevel: 'high', regulatoryRefs: ['CIS Controls v8', 'NIST 800-41'], description: 'Defines network segmentation, firewall rules, IDS/IPS requirements, and network monitoring standards.', changes: ['Updated micro-segmentation requirements', 'Added zero-trust network access section'] },
      { id: 'p8', name: 'Physical Security Policy', category: 'Physical', version: '2.0', status: 'current', lastReview: '2025-12-01', nextReview: '2026-06-01', owner: 'Facilities', ackRate: 96, totalEmployees: 500, ackedEmployees: 480, riskLevel: 'medium', regulatoryRefs: ['ISO 27001 A.11'], description: 'Covers physical access controls, visitor management, clean desk policy, and equipment disposal.', changes: ['Added badge access audit requirements', 'Updated visitor log retention'] },
    ];

    this._exceptions = [
      { id: 'e1', policyId: 'p4', policyName: 'Password Policy', requester: 'Dev Team Lead', department: 'Engineering', reason: 'CI/CD service accounts require non-expiring credentials for automation pipelines', riskMitigation: 'Credentials stored in vault with audit logging, rotated quarterly', requestedDate: '2026-01-15', expiryDate: '2026-06-01', status: 'approved', approver: 'CISO', impactScore: 6 },
      { id: 'e2', policyId: 'p3', policyName: 'Data Classification Policy', requester: 'Marketing Director', department: 'Marketing', reason: 'Legacy CRM system cannot auto-classify customer data based on new taxonomy', riskMitigation: 'Manual quarterly audit of CRM data, DLP rules applied at network layer', requestedDate: '2026-03-01', expiryDate: '2026-12-01', status: 'pending', impactScore: 7 },
      { id: 'e3', policyId: 'p7', policyName: 'Network Security Policy', requester: 'IoT Team', department: 'Engineering', reason: 'IoT devices on dedicated VLAN cannot meet micro-segmentation requirements due to hardware limitations', riskMitigation: 'Isolated VLAN with strict egress filtering, no internet access', requestedDate: '2026-02-15', expiryDate: '2026-05-15', status: 'approved', approver: 'Network Ops Lead', impactScore: 4 },
    ];

    this._calculateComplianceScore();
  }

  private _calculateComplianceScore() {
    if (this._policies.length === 0) return;
    const currentPolicies = this._policies.filter(p => p.status === 'current');
    const avgAck = currentPolicies.reduce((sum, p) => sum + p.ackRate, 0) / Math.max(1, currentPolicies.length);
    const overduePolicies = this._policies.filter(p => {
      const next = new Date(p.nextReview);
      return next < new Date() && p.status !== 'draft';
    }).length;
    const overduePenalty = overduePolicies * 5;
    this._complianceScore = Math.max(0, Math.min(100, Math.round(avgAck - overduePenalty)));
  }

  private _getFilteredPolicies(): Policy[] {
    return this._policies.filter(p => {
      const matchSearch = !this._searchQuery || p.name.toLowerCase().includes(this._searchQuery.toLowerCase()) || p.category.toLowerCase().includes(this._searchQuery.toLowerCase()) || p.owner.toLowerCase().includes(this._searchQuery.toLowerCase());
      const matchCat = !this._filterCategory || p.category === this._filterCategory;
      const matchStatus = !this._filterStatus || p.status === this._filterStatus;
      return matchSearch && matchCat && matchStatus;
    });
  }

  private _toggleExpand(id: string) {
    this._expandedPolicy = this._expandedPolicy === id ? null : id;
    this._selectedPolicy = this._policies.find(p => p.id === id) || null;
  }

  private _createPolicy() {
    if (!this._newName.trim()) return;
    const now = new Date().toISOString().split('T')[0];
    const nextReview = new Date(Date.now() + this._newReviewCycle * 30 * 86400000).toISOString().split('T')[0];
    const policy: Policy = {
      id: 'p' + (this._policies.length + 1),
      name: this._newName.trim(),
      category: this._newCategory,
      version: '1.0',
      status: 'draft',
      lastReview: now,
      nextReview,
      owner: this._newOwner || 'Unassigned',
      ackRate: 0,
      totalEmployees: 0,
      ackedEmployees: 0,
      riskLevel: this._newRiskLevel,
      regulatoryRefs: this._newRegRefs.split(',').map(s => s.trim()).filter(Boolean),
      description: this._newDescription || 'No description provided.',
      changes: ['Initial creation'],
    };
    this._policies = [...this._policies, policy];
    this._addHistory('CREATE', policy.name, 'Policy created as draft', 'v1.0');
    this._newName = ''; this._newDescription = ''; this._newOwner = ''; this._newRegRefs = '';
    this._tab = 'policies';
    this.requestUpdate();
  }

  private _approvePolicy(id: string) {
    this._policies = this._policies.map(p => p.id === id ? { ...p, status: 'current' as PolicyStatus, version: p.version } : p);
    const pol = this._policies.find(p => p.id === id);
    if (pol) this._addHistory('APPROVE', pol.name, 'Policy approved and published', pol.version);
    this._calculateComplianceScore();
  }

  private _requestReview(id: string) {
    this._policies = this._policies.map(p => p.id === id ? { ...p, status: 'review' as PolicyStatus } : p);
    const pol = this._policies.find(p => p.id === id);
    if (pol) this._addHistory('REVIEW', pol.name, 'Review requested', pol.version);
  }

  private _deprecatePolicy(id: string) {
    this._policies = this._policies.map(p => p.id === id ? { ...p, status: 'deprecated' as PolicyStatus } : p);
    const pol = this._policies.find(p => p.id === id);
    if (pol) this._addHistory('DEPRECATE', pol.name, 'Policy deprecated', pol.version);
    this._calculateComplianceScore();
  }

  private _createException() {
    if (!this._excReason.trim() || !this._excPolicyId) return;
    const now = new Date().toISOString().split('T')[0];
    const expiry = new Date(Date.now() + this._excDuration * 86400000).toISOString().split('T')[0];
    const pol = this._policies.find(p => p.id === this._excPolicyId);
    const exc: PolicyException = {
      id: 'e' + (this._exceptions.length + 1),
      policyId: this._excPolicyId,
      policyName: pol?.name || 'Unknown',
      requester: this._excRequester || 'Unknown',
      department: this._excDepartment || 'Unknown',
      reason: this._excReason,
      riskMitigation: this._excMitigation || 'None specified',
      requestedDate: now,
      expiryDate: expiry,
      status: 'pending',
      impactScore: this._calcImpactScore(this._excReason),
    };
    this._exceptions = [...this._exceptions, exc];
    this._addHistory('EXCEPTION', exc.policyName, 'Exception requested by ' + exc.requester, 'Impact: ' + exc.impactScore);
    this._showExceptionForm = false;
    this._excReason = ''; this._excMitigation = ''; this._excRequester = ''; this._excDepartment = '';
    this.requestUpdate();
  }

  private _calcImpactScore(reason: string): number {
    const keywords = ['credential', 'password', 'access', 'authentication'];
    let score = 5;
    keywords.forEach(kw => { if (reason.toLowerCase().includes(kw)) score += 2; });
    return Math.min(10, score);
  }

  private _approveException(id: string) {
    this._exceptions = this._exceptions.map(e => e.id === id ? { ...e, status: 'approved' as ExceptionStatus, approver: 'CISO' } : e);
    this._addHistory('EXCEPTION_APPROVE', 'Policy Exception', 'Exception approved', '');
  }

  private _denyException(id: string) {
    this._exceptions = this._exceptions.map(e => e.id === id ? { ...e, status: 'denied' as ExceptionStatus } : e);
    this._addHistory('EXCEPTION_DENY', 'Policy Exception', 'Exception denied', '');
  }

  private _addHistory(action: string, policyName: string, result: string, details: string) {
    const record: ExecutionRecord = {
      id: 'h' + (this._history.length + 1),
      timestamp: new Date().toISOString(),
      action, policyName, result, details,
    };
    this._history = [record, ...this._history];
  }

  private _exportData(format: 'json' | 'csv') {
    const data = { policies: this._policies, exceptions: this._exceptions, complianceScore: this._complianceScore, exportedAt: new Date().toISOString() };
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'security-policies.json'; a.click(); URL.revokeObjectURL(url);
    } else {
      const headers = ['ID', 'Name', 'Category', 'Version', 'Status', 'Owner', 'Risk Level', 'Ack Rate', 'Next Review'];
      const rows = this._policies.map(p => [p.id, p.name, p.category, p.version, p.status, p.owner, p.riskLevel, p.ackRate + '%', p.nextReview].join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'security-policies.csv'; a.click(); URL.revokeObjectURL(url);
    }
    this._addHistory('EXPORT', 'All Policies', 'Exported as ' + format.toUpperCase(), this._policies.length + ' policies');
  }

  private _getReviewCalendar(): ReviewEvent[] {
    const now = new Date();
    return this._policies.map(p => {
      const next = new Date(p.nextReview);
      const daysUntil = Math.ceil((next.getTime() - now.getTime()) / 86400000);
      return {
        id: p.id, policyName: p.name, date: p.nextReview, owner: p.owner,
        type: daysUntil < 0 ? 'overdue' as const : p.status === 'draft' ? 'draft' as const : 'scheduled' as const,
        urgency: daysUntil < 0 ? 'critical' as const : daysUntil < 14 ? 'high' as const : daysUntil < 30 ? 'medium' as const : 'low' as const,
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  private _getCategoryStats() {
    const cats: Record<string, number> = {};
    this._policies.forEach(p => { cats[p.category] = (cats[p.category] || 0) + 1; });
    return cats;
  }

  private _getRiskDistribution() {
    const dist: Record<SeverityLevel, number}> = { critical: 0, high: 0, medium: 0, low: 0 };
    this._policies.filter(p => p.status === 'current').forEach(p => { dist[p.riskLevel]++; });
    return dist;
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
        record.itemsScanned = this._policies.length;
        record.findings = this._policies.filter((x: any) => x.risk && x.risk !== 'low').length;
        record.criticalCount = this._policies.filter((x: any) => x.risk === 'critical').length;
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
    this._policies.forEach((item: any) => { const r = item.risk; if (riskDist[r] !== undefined) riskDist[r]++; else riskDist.medium++; });
    const total = this._policies.length || 1;
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
    const data = this._policies.slice(0, 10).map((item: any, i: number) => ({ name: (item.name || item.title || item.id || 'Item ' + i).substring(0, 8), score: ({critical: 10, high: 7, medium: 4, low: 1}}}}) as any)[item.risk]) || 2, risk: item.risk || 'medium' }));
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
        <span>${this._policies.length} items | ${this._auditTrail.length} audit entries</span>
      </div>
    </div>`;
  }


  private _workflowTasks: WorkflowTask[] = [
    { id: 'wt-1', title: 'Review Security Policy Mgmt finding #1', status: 'active', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T12:00:00Z', priority: 'p1', createdAt: '2026-04-23T00:00:00Z', completedAt: null },
    { id: 'wt-2', title: 'Remediate critical endpoint misconfiguration', status: 'pending', assignee: 'security-eng', blockedBy: ['wt-1'], slaDeadline: '2026-04-23T16:00:00Z', priority: 'p1', createdAt: '2026-04-23T02:00:00Z', completedAt: null },
    { id: 'wt-3', title: 'Update Security Policy Mgmt detection rules', status: 'blocked', assignee: 'soc-tier2', blockedBy: ['wt-2'], slaDeadline: '2026-04-24T00:00:00Z', priority: 'p2', createdAt: '2026-04-23T03:00:00Z', completedAt: null },
    { id: 'wt-4', title: 'Generate compliance report', status: 'pending', assignee: 'compliance', blockedBy: [], slaDeadline: '2026-04-24T08:00:00Z', priority: 'p3', createdAt: '2026-04-23T04:00:00Z', completedAt: null },
    { id: 'wt-5', title: 'Validate remediation for finding #6', status: 'completed', assignee: 'security-eng', blockedBy: [], slaDeadline: '2026-04-23T10:00:00Z', priority: 'p2', createdAt: '2026-04-22T18:00:00Z', completedAt: '2026-04-23T08:00:00Z' },
    { id: 'wt-6', title: 'Notify stakeholders of findings', status: 'completed', assignee: 'manager', blockedBy: [], slaDeadline: '2026-04-23T06:00:00Z', priority: 'p3', createdAt: '2026-04-22T20:00:00Z', completedAt: '2026-04-23T04:00:00Z' },
    { id: 'wt-7', title: 'Schedule follow-up scan', status: 'pending', assignee: 'ops', blockedBy: ['wt-2'], slaDeadline: '2026-04-25T00:00:00Z', priority: 'p4', createdAt: '2026-04-23T05:00:00Z', completedAt: null },
    { id: 'wt-8', title: 'Archive resolved Security Policy Mgmt findings', status: 'failed', assignee: 'soc-tier1', blockedBy: [], slaDeadline: '2026-04-23T08:00:00Z', priority: 'p4', createdAt: '2026-04-22T22:00:00Z', completedAt: null },
  ];

  private _executionHistory: ExecutionRecord[] = [
    {
      id: 'exec-1', name: 'Security Policy Mgmt Full Assessment Run', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:12:00Z', status: 'success',
      steps: [
        { id: 's1', name: 'Validate Scope', status: 'success', startedAt: '2026-04-22T10:00:00Z', completedAt: '2026-04-22T10:00:30Z', duration: 30, output: 'Scope validated: 142 targets' },
        { id: 's2', name: 'Collect Evidence', status: 'success', startedAt: '2026-04-22T10:00:30Z', completedAt: '2026-04-22T10:06:00Z', duration: 330, output: '1,847 events collected from 12 sources' },
        { id: 's3', name: 'Analyze Patterns', status: 'success', startedAt: '2026-04-22T10:06:00Z', completedAt: '2026-04-22T10:10:00Z', duration: 240, output: '23 patterns identified, 7 correlated' },
        { id: 's4', name: 'Generate Report', status: 'success', startedAt: '2026-04-22T10:10:00Z', completedAt: '2026-04-22T10:12:00Z', duration: 120, output: 'Report generated: 10 findings, 3 critical' },
      ],
    },
    {
      id: 'exec-2', name: 'Security Policy Mgmt Delta Scan', startedAt: '2026-04-23T02:00:00Z', completedAt: '2026-04-23T02:05:00Z', status: 'failed',
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
      id: 'exec-' + Date.now(), name: 'Security Policy Mgmt Assessment ' + new Date().toISOString().slice(0, 10), startedAt: new Date().toISOString(), completedAt: null, status: 'running', steps,
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
        ` : html`<div class="empty-state">Click "Run Assessment" to start the Security Policy Mgmt analysis pipeline</div>`}
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
              const a = document.createElement('a'); a.href = url; a.download = 'security-policy-mgmt-config.json'; a.click();
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
          <input class="search-box" type="text" placeholder="Add a comment..." style="min-width:auto;flex:1;" id="security-policy-mgmt-comment-input" />
          <button class="btn primary" @click=${() => {
            const input = this.shadowRoot?.querySelector('#security-policy-mgmt-comment-input') as HTMLInputElement;
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
    const filtered = this._getFilteredPolicies();
    const overdue = this._policies.filter(p => new Date(p.nextReview) < new Date() && p.status !== 'draft').length;
    const calendar = this._getReviewCalendar();
    const riskDist = this._getRiskDistribution();
    const catStats = this._getCategoryStats();
    const totalRisk = Object.values(riskDist).reduce((a, b) => a + b, 0);

    return html`
      <div class="panel">
        <div class="pt">
          <span>📋 Security Policy Management</span>
          <span style="flex:1"></span>
          <button class="btn btn-sm btn-secondary" @click=${() => this._exportData('json')}>Export JSON</button>
          <button class="btn btn-sm btn-secondary" @click=${() => this._exportData('csv')}>Export CSV</button>
        </div>

        <div class="stats">
          <div class="stat"><div class="sv">${this._policies.length}</div><div class="sl">Total Policies</div></div>
          <div class="stat"><div class="sv" style="color:#22c55e">${this._policies.filter(p => p.status === 'current').length}</div><div class="sl">Current</div></div>
          <div class="stat"><div class="sv" style="color:#eab308">${this._policies.filter(p => p.status === 'review').length}</div><div class="sl">In Review</div></div>
          <div class="stat"><div class="sv" style="color:#ef4444">${overdue}</div><div class="sl">Overdue</div></div>
          <div class="stat"><div class="sv" style="color:#f97316">${this._exceptions.filter(e => e.status === 'pending').length}</div><div class="sl">Pending Excep.</div></div>
          <div class="stat"><div class="sv" style="color:${this._complianceScore >= 80 ? '#22c55e' : this._complianceScore >= 60 ? '#eab308' : '#ef4444'}">${this._complianceScore}%</div><div class="sl">Compliance</div></div>
        </div>

        <div class="compliance-score">
          <div class="score-circle" style="background:${this._complianceScore >= 80 ? '#052e16' : this._complianceScore >= 60 ? '#422006' : '#450a0a'};color:${this._complianceScore >= 80 ? '#22c55e' : this._complianceScore >= 60 ? '#eab308' : '#ef4444'}">${this._complianceScore}</div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:600">Overall Policy Compliance Score</div>
            <div style="font-size:10px;color:#94a3b8;margin-top:2px">Based on acknowledgment rates, review status, and overdue penalties</div>
            <div class="risk-bar" style="margin-top:6px">
              <div class="risk-seg" style="width:${totalRisk ? (riskDist.critical / totalRisk * 100) : 0}%;background:#ef4444"></div>
              <div class="risk-seg" style="width:${totalRisk ? (riskDist.high / totalRisk * 100) : 0}%;background:#f97316"></div>
              <div class="risk-seg" style="width:${totalRisk ? (riskDist.medium / totalRisk * 100) : 0}%;background:#eab308"></div>
              <div class="risk-seg" style="width:${totalRisk ? (riskDist.low / totalRisk * 100) : 0}%;background:#22c55e"></div>
            </div>
            <div style="display:flex;gap:8px;margin-top:4px;font-size:9px;color:#94a3b8">
              <span>🔴 Critical: ${riskDist.critical}</span><span>🟠 High: ${riskDist.high}</span><span>🟡 Medium: ${riskDist.medium}</span><span>🟢 Low: ${riskDist.low}</span>
            </div>
          </div>
        </div>

        <div class="tabs">
          <button class="tab ${this._tab === 'policies' ? 'active' : ''}" @click=${() => this._tab = 'policies'}>Policy Library (${filtered.length})</button>
          <button class="tab ${this._tab === 'exceptions' ? 'active' : ''}" @click=${() => this._tab = 'exceptions'}>Exceptions (${this._exceptions.length})</button>
          <button class="tab ${this._tab === 'calendar' ? 'active' : ''}" @click=${() => this._tab = 'calendar'}>Review Calendar</button>
          <button class="tab ${this._tab === 'create' ? 'active' : ''}" @click=${() => this._tab = 'create'}>+ New Policy</button>
          <button class="tab ${this._tab === 'history' ? 'active' : ''}" @click=${() => this._tab = 'history'}>History (${this._history.length})</button>
        </div>

        ${this._tab === 'policies' ? html`
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" placeholder="Search policies by name, category, or owner..." .value=${this._searchQuery} @input=${(e: Event) => { this._searchQuery = (e.target as HTMLInputElement).value; this.requestUpdate(); }}>
          </div>
          <div class="filter-row">
            <button class="filter-chip ${!this._filterCategory ? 'active' : ''}" @click=${() => { this._filterCategory = ''; this.requestUpdate(); }}>All</button>
            ${CATEGORIES.map(c => html`<button class="filter-chip ${this._filterCategory === c ? 'active' : ''}" @click=${() => { this._filterCategory = c; this.requestUpdate(); }}>${c}</button>`)}
          </div>
          <div class="filter-row">
            <button class="filter-chip ${!this._filterStatus ? 'active' : ''}" @click=${() => { this._filterStatus = ''; this.requestUpdate(); }}>All Status</button>
            ${(['current', 'review', 'draft', 'deprecated'] as PolicyStatus[]).map(s => html`<button class="filter-chip ${this._filterStatus === s ? 'active' : ''}" @click=${() => { this._filterStatus = s; this.requestUpdate(); }}>${s}</button>`)}
          </div>
          ${filtered.length === 0 ? html`<div class="empty-state"><div class="icon">📄</div><div>No policies match your filters</div></div>` : ''}
          ${filtered.map(p => html`
            <div class="policy-row" @click=${() => this._toggleExpand(p.id)}>
              <div class="policy-header">
                <div style="display:flex;align-items:center;gap:6px">
                  <span class="severity-dot" style="background:${SEVERITY_COLORS[p.riskLevel]}"></span>
                  <span class="policy-name">${p.name}</span>
                </div>
                <div style="display:flex;gap:4px;align-items:center">
                  <span class="badge" style="background:${STATUS_COLORS[p.status]}20;color:${STATUS_COLORS[p.status]}">v${p.version} - ${p.status}</span>
                  <span style="font-size:10px;color:#6b7280">${this._expandedPolicy === p.id ? '▲' : '▼'}</span>
                </div>
              </div>
              <div class="policy-meta">
                <span>📁 ${p.category}</span>
                <span>👤 ${p.owner}</span>
                <span>📅 Next: ${p.nextReview}</span>
                <span>⚠ ${p.riskLevel.toUpperCase()}</span>
              </div>
              <div style="display:flex;align-items:center;gap:12px;margin-top:6px">
                <div style="flex:1">
                  <div class="progress-bar">
                    <div class="progress-fill" style="width:${p.ackRate}%;background:${p.ackRate > 90 ? '#22c55e' : p.ackRate > 70 ? '#eab308' : '#ef4444'}"></div>
                  </div>
                </div>
                <span style="font-size:11px;font-weight:600;color:${p.ackRate > 90 ? '#22c55e' : p.ackRate > 70 ? '#eab308' : '#ef4444'}">${p.ackRate}% ack (${p.ackedEmployees}/${p.totalEmployees})</span>
              </div>
              ${this._expandedPolicy === p.id ? html`
                <div class="detail-panel" style="margin-top:10px" @click=${(e: Event) => e.stopPropagation()}>
                  <div style="font-size:11px;color:#94a3b8;margin-bottom:6px">${p.description}</div>
                  <div style="margin-bottom:6px"><span style="font-size:10px;color:#6b7280">Regulatory References:</span> ${p.regulatoryRefs.map(r => html`<span class="tag">${r}</span>`)}</div>
                  <div style="margin-bottom:8px"><span style="font-size:10px;color:#6b7280">Recent Changes:</span></div>
                  <ul style="font-size:10px;color:#94a3b8;padding-left:16px;margin-bottom:8px">
                    ${p.changes.map(c => html`<li>${c}</li>`)}
                  </ul>
                  <div class="btn-row">
                    ${p.status === 'draft' ? html`<button class="btn btn-sm btn-primary" @click=${() => this._approvePolicy(p.id)}>Approve & Publish</button>` : nothing}
                    ${p.status === 'current' ? html`<button class="btn btn-sm btn-secondary" @click=${() => this._requestReview(p.id)}>Request Review</button>` : nothing}
                    ${p.status !== 'deprecated' ? html`<button class="btn btn-sm btn-danger" @click=${() => this._deprecatePolicy(p.id)}>Deprecate</button>` : nothing}
                  </div>
                </div>
              ` : nothing}
            </div>
          `)}
        ` : ''}

        ${this._tab === 'exceptions' ? html`
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div class="stitle" style="margin:0">Policy Exceptions</div>
            <button class="btn btn-sm btn-primary" @click=${() => this._showExceptionForm = !this._showExceptionForm}>+ New Exception</button>
          </div>
          ${this._showExceptionForm ? html`
            <div class="section">
              <div class="form-group">
                <label class="form-label">Policy *</label>
                <select class="form-select" .value=${this._excPolicyId} @change=${(e: Event) => this._excPolicyId = (e.target as HTMLSelectElement).value}>
                  <option value="">Select policy...</option>
                  ${this._policies.map(p => html`<option value=${p.id}>${p.name} (v${p.version})</option>`)}
                </select>
              </div>
              <div class="form-row">
                <div class="form-group"><label class="form-label">Requester</label><input class="form-input" type="text" .value=${this._excRequester} @input=${(e: Event) => this._excRequester = (e.target as HTMLInputElement).value}></div>
                <div class="form-group"><label class="form-label">Department</label><input class="form-input" type="text" .value=${this._excDepartment} @input=${(e: Event) => this._excDepartment = (e.target as HTMLInputElement).value}></div>
              </div>
              <div class="form-group"><label class="form-label">Reason *</label><textarea class="form-textarea" .value=${this._excReason} @input=${(e: Event) => this._excReason = (e.target as HTMLTextAreaElement).value}></textarea></div>
              <div class="form-group"><label class="form-label">Risk Mitigation</label><textarea class="form-textarea" .value=${this._excMitigation} @input=${(e: Event) => this._excMitigation = (e.target as HTMLTextAreaElement).value}></textarea></div>
              <div class="form-group">
                <label class="form-label">Duration (days): ${this._excDuration}</label>
                <input type="range" min="30" max="365" .value=${String(this._excDuration)} @input=${(e: Event) => this._excDuration = Number((e.target as HTMLInputElement).value)} style="width:100%">
              </div>
              <div class="btn-row">
                <button class="btn btn-primary" @click=${this._createException}>Submit Exception</button>
                <button class="btn btn-secondary" @click=${() => this._showExceptionForm = false}>Cancel</button>
              </div>
            </div>
          ` : nothing}
          ${this._exceptions.map(e => html`
            <div class="exception-row" style="border-left-color:${EXCEPTION_COLORS[e.status]}">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-weight:600;font-size:12px">${e.policyName}</span>
                <span class="badge" style="background:${EXCEPTION_COLORS[e.status]}20;color:${EXCEPTION_COLORS[e.status]}">${e.status}</span>
              </div>
              <div style="font-size:10px;color:#94a3b8;margin-top:4px">Requested by: ${e.requester} (${e.department})</div>
              <div style="font-size:11px;margin-top:4px">${e.reason}</div>
              <div style="font-size:10px;color:#94a3b8;margin-top:4px">Mitigation: ${e.riskMitigation}</div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">
                <span style="font-size:10px;color:#6b7280">Expires: ${e.expiryDate} | Impact: ${e.impactScore}/10</span>
                ${e.status === 'pending' ? html`
                  <div style="display:flex;gap:4px">
                    <button class="btn btn-sm btn-primary" @click=${() => this._approveException(e.id)}>Approve</button>
                    <button class="btn btn-sm btn-danger" @click=${() => this._denyException(e.id)}>Deny</button>
                  </div>
                ` : html`<span style="font-size:10px;color:#94a3b8">By: ${e.approver || 'N/A'}</span>`}
              </div>
            </div>
          `)}
        ` : ''}

        ${this._tab === 'calendar' ? html`
          <div class="section">
            <div class="stitle">Policy Review Schedule</div>
            ${calendar.map(c => html`
              <div class="calendar-item">
                <div>
                  <div style="display:flex;align-items:center;gap:6px">
                    <span class="severity-dot" style="background:${SEVERITY_COLORS[c.urgency]}"></span>
                    <span style="font-size:12px;font-weight:600">${c.policyName}</span>
                  </div>
                  <div style="font-size:10px;color:#6b7280;margin-top:2px">${c.owner} | ${c.type === 'overdue' ? '⚠ OVERDUE' : c.type === 'draft' ? '📝 Draft' : '📅 Scheduled'}</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px">
                  <span style="font-size:11px;color:#94a3b8">${c.date}</span>
                  <span class="badge" style="background:${SEVERITY_COLORS[c.urgency]}20;color:${SEVERITY_COLORS[c.urgency]}">${c.urgency}</span>
                </div>
              </div>
            `)}
          </div>
          <div class="section">
            <div class="stitle">Category Distribution</div>
            ${Object.entries(catStats).map(([cat, count]) => html`
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
                <span style="font-size:11px;width:80px;color:#94a3b8">${cat}</span>
                <div style="flex:1;height:8px;background:#374151;border-radius:4px;overflow:hidden">
                  <div style="height:100%;width:${(count / this._policies.length * 100)}%;background:#f59e0b;border-radius:4px"></div>
                </div>
                <span style="font-size:11px;font-weight:600;width:20px;text-align:right">${count}</span>
              </div>
            `)}
          </div>
        ` : ''}

        ${this._tab === 'create' ? html`
          <div class="section">
            <div class="stitle">Create New Policy</div>
            <div class="form-group"><label class="form-label">Policy Name *</label><input class="form-input" type="text" placeholder="e.g., Cloud Security Policy" .value=${this._newName} @input=${(e: Event) => this._newName = (e.target as HTMLInputElement).value}></div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Category</label>
                <select class="form-select" .value=${this._newCategory} @change=${(e: Event) => this._newCategory = (e.target as HTMLSelectElement).value}>
                  ${CATEGORIES.map(c => html`<option value=${c}>${c}</option>`)}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Risk Level</label>
                <select class="form-select" .value=${this._newRiskLevel} @change=${(e: Event) => this._newRiskLevel = (e.target as HTMLSelectElement).value as SeverityLevel}>
                  <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
              </div>
            </div>
            <div class="form-group"><label class="form-label">Owner</label><input class="form-input" type="text" placeholder="e.g., CISO" .value=${this._newOwner} @input=${(e: Event) => this._newOwner = (e.target as HTMLInputElement).value}></div>
            <div class="form-group"><label class="form-label">Description</label><textarea class="form-textarea" placeholder="Describe the policy scope and requirements..." .value=${this._newDescription} @input=${(e: Event) => this._newDescription = (e.target as HTMLTextAreaElement).value}></textarea></div>
            <div class="form-group"><label class="form-label">Regulatory References (comma-separated)</label><input class="form-input" type="text" placeholder="e.g., ISO 27001, SOC 2, NIST 800-53" .value=${this._newRegRefs} @input=${(e: Event) => this._newRegRefs = (e.target as HTMLInputElement).value}></div>
            <div class="form-group">
              <label class="form-label">Review Cycle: ${this._newReviewCycle} months</label>
              <input type="range" min="3" max="24" step="3" .value=${String(this._newReviewCycle)} @input=${(e: Event) => this._newReviewCycle = Number((e.target as HTMLInputElement).value)} style="width:100%">
            </div>
            <div class="btn-row">
              <button class="btn btn-primary" @click=${this._createPolicy} ?disabled=${!this._newName.trim()}>Create Draft Policy</button>
              <button class="btn btn-secondary" @click=${() => this._tab = 'policies'}>Cancel</button>
            </div>
          </div>
        ` : ''}

        ${this._tab === 'history' ? html`
          <div class="section">
            <div class="stitle">Action History</div>
            ${this._history.length === 0 ? html`<div class="empty-state"><div class="icon">📜</div><div>No actions recorded yet</div></div>` : nothing}
            ${this._history.map(h => html`
              <div class="history-item">
                <div style="display:flex;justify-content:space-between">
                  <span style="font-weight:600;color:#f59e0b">${h.action}</span>
                  <span style="color:#6b7280">${new Date(h.timestamp).toLocaleString()}</span>
                </div>
                <div style="margin-top:4px">${h.policyName} - ${h.result}</div>
                ${h.details ? html`<div style="color:#6b7280;margin-top:2px">${h.details}</div>` : nothing}
              </div>
            `)}
          </div>
        ` : ''}
      </div>
      </div>
      <div style="margin-top:12px;display:flex;justify-content:center">
        <button class="btn btn-sm ${this._showEnhanced ? 'btn-primary' : 'btn-secondary'}" @click=${() => {{ this._showEnhanced = !this._showEnhanced; this.requestUpdate(); }}>${this._showEnhanced ? 'Hide' : 'Show'} Advanced</button>
      </div>
      ${this._renderEnhancedSection()}
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-security-policy-mgmt': ScSecurityPolicyMgmt; } }
