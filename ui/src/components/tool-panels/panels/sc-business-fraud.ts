/**
 * sc-business-fraud.ts - Business Fraud Detection Engine (BSO Dark Capability)
 * Transaction pattern analysis, anomaly detection rules, fraud scenario templates,
 * alert generation with risk scoring, investigation workflow, case management
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

type FraudType = 'transaction-fraud' | 'account-takeover' | 'identity-theft' | 'insider-fraud' | 'invoice-fraud' | 'payroll-fraud' | 'expense-fraud' | 'procurement-fraud';
type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
type CaseStatus = 'new' | 'investigating' | 'escalated' | 'resolved' | 'false-positive';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  from: string;
  to: string;
  timestamp: string;
  type: string;
  channel: string;
  location: string;
  riskIndicators: string[];
}

interface FraudRule {
  id: string;
  name: string;
  description: string;
  category: FraudType;
  threshold: number;
  unit: string;
  windowMinutes: number;
  enabled: boolean;
  severity: AlertSeverity;
  falsePositiveRate: number;
}

interface FraudAlert {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  timestamp: string;
  transactions: Transaction[];
  entity: string;
  riskScore: number;
  indicators: string[];
  status: CaseStatus;
  assignee: string;
  notes: string[];
}

interface FraudCase {
  id: string;
  alertIds: string[];
  title: string;
  status: CaseStatus;
  priority: number;
  assignee: string;
  created: string;
  updated: string;
  estimatedLoss: number;
  transactions: Transaction[];
  timeline: { timestamp: string; event: string; actor: string }[];
}

const FRAUD_RULES: FraudRule[] = [
  { id: 'FR1', name: 'High Value Transaction', description: 'Single transaction exceeds threshold', category: 'transaction-fraud', threshold: 50000, unit: 'USD', windowMinutes: 0, enabled: true, severity: 'high', falsePositiveRate: 0.1 },
  { id: 'FR2', name: 'Velocity Spike', description: 'Unusual number of transactions in short window', category: 'transaction-fraud', threshold: 10, unit: 'transactions', windowMinutes: 60, enabled: true, severity: 'medium', falsePositiveRate: 0.15 },
  { id: 'FR3', name: 'Geographic Anomaly', description: 'Transactions from impossible travel locations', category: 'account-takeover', threshold: 2, unit: 'countries', windowMinutes: 120, enabled: true, severity: 'critical', falsePositiveRate: 0.05 },
  { id: 'FR4', name: 'New Payee Pattern', description: 'First-time payment to new beneficiary', category: 'invoice-fraud', threshold: 10000, unit: 'USD', windowMinutes: 0, enabled: true, severity: 'medium', falsePositiveRate: 0.3 },
  { id: 'FR5', name: 'After-Hours Activity', description: 'Large transactions outside business hours', category: 'insider-fraud', threshold: 25000, unit: 'USD', windowMinutes: 0, enabled: true, severity: 'high', falsePositiveRate: 0.2 },
  { id: 'FR6', name: 'Round Amount Pattern', description: 'Multiple round-amount transactions (structuring)', category: 'transaction-fraud', threshold: 5, unit: 'transactions', windowMinutes: 1440, enabled: true, severity: 'high', falsePositiveRate: 0.25 },
  { id: 'FR7', name: 'Duplicate Invoice Detection', description: 'Similar invoice amounts to same vendor', category: 'invoice-fraud', threshold: 3, unit: 'invoices', windowMinutes: 43200, enabled: true, severity: 'medium', falsePositiveRate: 0.15 },
  { id: 'FR8', name: 'Employee Expense Anomaly', description: 'Expense claims deviating significantly from average', category: 'expense-fraud', threshold: 3, unit: 'stddev', windowMinutes: 0, enabled: true, severity: 'low', falsePositiveRate: 0.35 },
  { id: 'FR9', name: 'Payroll Ghost Employee', description: 'Payments to employees with no activity', category: 'payroll-fraud', threshold: 0, unit: 'activity', windowMinutes: 43200, enabled: true, severity: 'critical', falsePositiveRate: 0.08 },
  { id: 'FR10', name: 'Vendor Split Purchase', description: 'Same vendor multiple purchases below approval threshold', category: 'procurement-fraud', threshold: 4, unit: 'purchases', windowMinutes: 43200, enabled: true, severity: 'medium', falsePositiveRate: 0.2 },
];

interface FraudExecRecord {
  id: string;
  timestamp: string;
  transactionsAnalyzed: number;
  alertsGenerated: number;
  casesCreated: number;
  estimatedLoss: number;
  duration: number;
  status: 'success' | 'failed' | 'running';
  riskThreshold: number;
}

interface FraudAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  category: 'analysis' | 'case' | 'config' | 'export' | 'rule';
}

interface FraudComment {
  id: string;
  timestamp: string;
  author: string;
  text: string;
  caseId: string;
}

@customElement('sc-business-fraud')
export class ScBusinessFraud extends LitElement {
  @property({ type: String }) panelId = 'business-fraud';
  @state() private _activeTab: 'monitor' | 'rules' | 'cases' | 'report' | 'history' | 'audit' | 'settings' = 'monitor';
  @state() private _rules: FraudRule[] = [...FRAUD_RULES];
  @state() private _alerts: FraudAlert[] = [];
  @state() private _cases: FraudCase[] = [];
  @state() private _sampleTransactions: Transaction[] = [];
  @state() private _analyzing = false;
  @state() private _progress = 0;
  @state() private _totalAlerts = 0;
  @state() private _criticalAlerts = 0;
  @state() private _estimatedLoss = 0;
  @state() private _selectedCase: FraudCase | null = null;
  @state() private _showReport = false;
  @state() private _reportContent = '';
  @state() private _filterSeverity: AlertSeverity | 'all' = 'all';
  @state() private _execHistory: FraudExecRecord[] = [];
  @state() private _execRunning = false;
  @state() private _execProgress = 0;
  @state() private _slaCountdown = 0;
  @state() private _slaTarget = 4;
  @state() private _auditTrail: FraudAuditEntry[] = [];
  @state() private _auditFilter = 'all';
  @state() private _comments: FraudComment[] = [];
  @state() private _newComment = '';
  @state() private _showSettings = false;
  @state() private _settingsTab: 'general' | 'thresholds' | 'integrations' = 'general';
  @state() private _riskThreshold = 7;
  @state() private _escalationEmail = '';
  @state() private _webhookUrl = '';
  @state() private _tableSort = 'timestamp';
  @state() private _tableSortDir: 'asc' | 'desc' = 'desc';
  @state() private _tablePage = 0;
  @state() private _tablePageSize = 10;
  @state() private _selectedAlerts: Set<string> = new Set();
  @state() private _activeTab: 'monitor' | 'rules' | 'cases' | 'report' | 'history' | 'audit' | 'settings' | 'analytics' = 'monitor';
  @state() private _analyticsSubTab = 'benford' | 'anomaly' | 'sankey' | 'team' | 'trends' | 'prediction' = 'benford';

  // --- Benford's Law Analysis ---
  private _benfordData = [
    { digit: 1, expected: 30.1, actual: 31.2, deviation: 1.1 },
    { digit: 2, expected: 17.6, actual: 16.8, deviation: 0.8 },
    { digit: 3, expected: 12.5, actual: 12.9, deviation: 0.4 },
    { digit: 4, expected: 9.7, actual: 10.2, deviation: 0.5 },
    { digit: 5, expected: 7.9, actual: 7.5, deviation: 0.4 },
    { digit: 6, expected: 6.7, actual: 6.1, deviation: 0.6 },
    { digit: 7, expected: 5.8, actual: 5.5, deviation: 0.3 },
    { digit: 8, expected: 5.1, actual: 5.8, deviation: 0.7 },
    { digit: 9, expected: 4.6, actual: 4.0, deviation: 0.6 },
  ];

  // --- Anomaly Detection Engine ---
  private _anomalyResults = [
    { id: 'an-1', entity: 'Vendor-Acme Corp', metric: 'Invoice Amount', value: 85000, baseline: 12000, zscore: 4.2, status: 'confirmed', type: 'statistical' },
    { id: 'an-2', entity: 'Employee-JSmith', metric: 'Expense Claims', value: 15200, baseline: 3200, zscore: 3.8, status: 'investigating', type: 'statistical' },
    { id: 'an-3', entity: 'Account-7742', metric: 'Transaction Freq', value: 47, baseline: 8, zscore: 5.1, status: 'confirmed', type: 'behavioral' },
    { id: 'an-4', entity: 'Vendor-GlobalTech', metric: 'Payment Velocity', value: 12, baseline: 2, zscore: 3.5, status: 'review', type: 'temporal' },
    { id: 'an-5', entity: 'Employee-KChen', metric: 'After-hours Access', value: 34, baseline: 5, zscore: 4.6, status: 'investigating', type: 'behavioral' },
    { id: 'an-6', entity: 'Payroll-Dept', metric: 'Ghost Employee', value: 3, baseline: 0, zscore: 6.2, status: 'confirmed', type: 'pattern' },
  ];

  // --- Fund Flow Data for Sankey ---
  private _fundFlows = [
    { source: 'Client A', target: 'Acme Corp', amount: 250000, risk: 'low' },
    { source: 'Client B', target: 'Acme Corp', amount: 180000, risk: 'low' },
    { source: 'Acme Corp', target: 'Vendor Alpha', amount: 95000, risk: 'high' },
    { source: 'Acme Corp', target: 'Vendor Beta', amount: 120000, risk: 'medium' },
    { source: 'Acme Corp', target: 'Payroll', amount: 340000, risk: 'low' },
    { source: 'Vendor Alpha', target: 'Unknown Entity X', amount: 45000, risk: 'critical' },
    { source: 'Payroll', target: 'Ghost Employee 1', amount: 8500, risk: 'critical' },
    { source: 'Payroll', target: 'Ghost Employee 2', amount: 7200, risk: 'critical' },
    { source: 'Vendor Beta', target: 'Shell Company Y', amount: 60000, risk: 'high' },
  ];

  // --- Team workload ---
  private _fraudTeam = [
    { id: 'ft1', name: 'Sarah Mitchell', role: 'Lead Investigator', avatar: 'SM', color: '#ef4444', cases: 5, resolved: 12, active: 3 },
    { id: 'ft2', name: 'James Wilson', role: 'Forensic Analyst', avatar: 'JW', color: '#3b82f6', cases: 3, resolved: 8, active: 2 },
    { id: 'ft3', name: 'Emily Zhang', role: 'Data Analyst', avatar: 'EZ', color: '#22c55e', cases: 4, resolved: 15, active: 4 },
    { id: 'ft4', name: 'Michael Brown', role: 'Compliance Officer', avatar: 'MB', color: '#f59e0b', cases: 2, resolved: 10, active: 1 },
  ];

  // --- Monthly trend data ---
  private _monthlyTrends = [
    { month: 'Jan', alerts: 12, confirmed: 4, loss: 85000, recovered: 72000 },
    { month: 'Feb', alerts: 18, confirmed: 7, loss: 142000, recovered: 95000 },
    { month: 'Mar', alerts: 15, confirmed: 5, loss: 98000, recovered: 88000 },
    { month: 'Apr', alerts: 22, confirmed: 9, loss: 210000, recovered: 165000 },
    { month: 'May', alerts: 19, confirmed: 6, loss: 125000, recovered: 110000 },
    { month: 'Jun', alerts: 25, confirmed: 11, loss: 280000, recovered: 195000 },
  ];

  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #0f1117); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 8px; }
    .title { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
    .stats-bar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
    .stat { background: #1a1d27; border-radius: 8px; padding: 10px 16px; text-align: center; min-width: 90px; }
    .stat-value { font-size: 22px; font-weight: 700; }
    .stat-label { font-size: 11px; color: #9ca3af; margin-top: 2px; }
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
    .progress-bar { width: 100%; height: 6px; background: #1a1d27; border-radius: 3px; overflow: hidden; margin-bottom: 12px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius: 3px; transition: width 0.3s; }
    .alert-list { display: flex; flex-direction: column; gap: 8px; }
    .alert-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; border-left: 3px solid; }
    .alert-critical { border-left-color: #dc2626; }
    .alert-high { border-left-color: #f59e0b; }
    .alert-medium { border-left-color: #3b82f6; }
    .alert-low { border-left-color: #6b7280; }
    .alert-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; flex-wrap: wrap; gap: 4px; }
    .alert-name { font-weight: 600; font-size: 13px; }
    .alert-meta { display: flex; gap: 8px; font-size: 11px; color: #9ca3af; flex-wrap: wrap; margin-bottom: 6px; }
    .alert-indicators { display: flex; gap: 4px; flex-wrap: wrap; }
    .indicator-tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #374151; color: #d1d5db; }
    .sev-critical { color: #f87171; font-weight: 700; }
    .sev-high { color: #fbbf24; font-weight: 600; }
    .sev-medium { color: #60a5fa; }
    .sev-low { color: #9ca3af; }
    .rule-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .rule-table th { text-align: left; padding: 8px 12px; background: #1a1d27; color: #9ca3af; font-weight: 600; border-bottom: 1px solid #2a2d3a; }
    .rule-table td { padding: 8px 12px; border-bottom: 1px solid #1a1d27; }
    .rule-table tr:hover td { background: #1a1d27; }
    .toggle { width: 36px; height: 20px; border-radius: 10px; background: #374151; cursor: pointer; position: relative; transition: background 0.2s; }
    .toggle.on { background: #3b82f6; }
    .toggle-dot { width: 16px; height: 16px; border-radius: 50%; background: white; position: absolute; top: 2px; left: 2px; transition: left 0.2s; }
    .toggle.on .toggle-dot { left: 18px; }
    .case-card { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 12px; cursor: pointer; margin-bottom: 8px; transition: all 0.2s; }
    .case-card:hover { border-color: #3b82f6; }
    .case-card.selected { border-color: #3b82f6; background: #1e2a3a; }
    .case-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; }
    .case-title { font-weight: 600; font-size: 14px; }
    .status-tag { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 600; }
    .status-new { background: #1e3a5f; color: #60a5fa; }
    .status-investigating { background: #78350f; color: #fbbf24; }
    .status-escalated { background: #7f1d1d; color: #fca5a5; }
    .status-resolved { background: #064e3b; color: #34d399; }
    .status-false-positive { background: #374151; color: #9ca3af; }
    .case-detail { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .timeline-item { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #1a1d27; font-size: 12px; }
    .timeline-time { color: #9ca3af; white-space: nowrap; min-width: 120px; }
    .report-box { background: #0a0c10; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; font-size: 12px; line-height: 1.8; max-height: 400px; overflow-y: auto; white-space: pre-wrap; font-family: 'JetBrains Mono', monospace; color: #d1d5db; }
    .empty-state { text-align: center; padding: 40px; color: #6b7280; }
    .sla-bar { display: flex; align-items: center; gap: 12px; background: #1a1d27; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
    .sla-indicator { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
    .sla-text { font-size: 13px; }
    .sla-time { font-weight: 700; font-size: 16px; }
    .settings-panel { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .settings-title { font-weight: 700; font-size: 14px; margin-bottom: 12px; }
    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .slider-row { display: flex; align-items: center; gap: 10px; }
    .slider-row input[type="range"] { flex: 1; accent-color: #3b82f6; background: transparent; border: none; padding: 0; }
    .slider-val { font-size: 13px; font-weight: 700; color: #3b82f6; min-width: 40px; text-align: right; }
    .audit-entry { display: flex; gap: 10px; padding: 8px 10px; background: #0a0c10; border-radius: 6px; margin-bottom: 4px; font-size: 12px; align-items: flex-start; }
    .audit-cat { padding: 2px 6px; border-radius: 3px; font-size: 9px; font-weight: 600; flex-shrink: 0; margin-top: 2px; }
    .audit-cat-analysis { background: #3b82f620; color: #60a5fa; }
    .audit-cat-case { background: #f59e0b20; color: #fbbf24; }
    .audit-cat-config { background: #8b5cf620; color: #a78bfa; }
    .audit-cat-export { background: #22c55e20; color: #34d399; }
    .audit-cat-rule { background: #ef444420; color: #f87171; }
    .comment-section { background: #1a1d27; border: 1px solid #2a2d3a; border-radius: 8px; padding: 14px; margin-bottom: 16px; }
    .comment-item { display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid #2a2d3a; }
    .comment-item:last-child { border-bottom: none; }
    .comment-avatar { width: 28px; height: 28px; border-radius: 50%; background: #374151; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
    .comment-body { flex: 1; }
    .comment-author { font-weight: 600; font-size: 12px; }
    .comment-time { font-size: 10px; color: #6b7280; margin-left: 8px; }
    .comment-text { font-size: 12px; color: #d1d5db; margin-top: 2px; }
    .exec-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .exec-table th { text-align: left; padding: 8px 10px; background: #0a0c10; color: #9ca3af; font-weight: 600; border-bottom: 1px solid #2a2d3a; cursor: pointer; user-select: none; position: sticky; top: 0; z-index: 1; }
    .exec-table th:hover { color: #e2e8f0; }
    .exec-table td { padding: 7px 10px; border-bottom: 1px solid #1a1d27; }
    .exec-table tr:hover td { background: #1a1d2780; }
    .exec-table tr.selected td { background: #3b82f615; }
    .page-nav { display: flex; gap: 4px; justify-content: center; margin-top: 8px; }
    .page-btn { padding: 4px 10px; border: 1px solid #2a2d3a; border-radius: 4px; background: transparent; color: #9ca3af; cursor: pointer; font-size: 11px; }
    .page-btn:hover { border-color: #3b82f6; color: #e2e8f0; }
    .page-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
    @media (max-width: 640px) { .stats-bar { flex-direction: column; } .settings-grid { grid-template-columns: 1fr; } }
  `;

  private _generateSampleTransactions(): Transaction[] {
    const entities = ['ACME Corp', 'Globex Inc', 'Initech LLC', 'Umbrella Corp', 'Wayne Enterprises', 'Stark Industries'];
    const locations = ['New York, US', 'London, UK', 'Tokyo, JP', 'Lagos, NG', 'Sao Paulo, BR', 'Moscow, RU'];
    const channels = ['Wire Transfer', 'ACH', 'Wire', 'Check', 'Card', 'SWIFT'];
    const txns: Transaction[] = [];
    for (let i = 0; i < 50; i++) {
      const isFraudulent = Math.random() > 0.85;
      const amt = isFraudulent ? Math.floor(Math.random() * 200000) + 50000 : Math.floor(Math.random() * 30000) + 100;
      const indicators: string[] = [];
      if (isFraudulent) {
        if (amt > 50000) indicators.push('high-value');
        if (Math.random() > 0.5) indicators.push('after-hours');
        if (Math.random() > 0.5) indicators.push('round-amount');
        if (Math.random() > 0.7) indicators.push('new-payee');
        if (Math.random() > 0.6) indicators.push('geographic-anomaly');
      }
      txns.push({
        id: 'TXN-' + String(10000 + i),
        amount: amt,
        currency: 'USD',
        from: entities[Math.floor(Math.random() * entities.length)],
        to: entities[Math.floor(Math.random() * entities.length)],
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000 * 7)).toISOString(),
        type: isFraudulent ? 'Outgoing' : 'Routine',
        channel: channels[Math.floor(Math.random() * channels.length)],
        location: isFraudulent && indicators.includes('geographic-anomaly') ? locations[Math.floor(Math.random() * locations.length)] : locations[0],
        riskIndicators: indicators,
      });
    }
    return txns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private _runAnalysis(): void {
    this._analyzing = true;
    this._progress = 0;
    this._sampleTransactions = this._generateSampleTransactions();
    this._alerts = [];

    const enabledRules = this._rules.filter(r => r.enabled);
    let step = 0;
    const totalSteps = enabledRules.length;

    const analyzeRule = () => {
      if (step >= totalSteps) {
        this._buildCases();
        this._analyzing = false;
        this._totalAlerts = this._alerts.length;
        this._criticalAlerts = this._alerts.filter(a => a.severity === 'critical').length;
        this._estimatedLoss = this._alerts.reduce((s, a) => s + a.transactions.reduce((t, tx) => t + tx.amount, 0), 0);
        return;
      }

      const rule = enabledRules[step];
      const matchingTxns = this._sampleTransactions.filter(tx => {
        switch (rule.category) {
          case 'transaction-fraud':
            return rule.id === 'FR1' ? tx.amount > rule.threshold && tx.riskIndicators.includes('high-value') :
                   rule.id === 'FR2' ? tx.riskIndicators.length > 1 :
                   rule.id === 'FR6' ? tx.amount % 10000 < 100 && tx.amount > 5000 :
                   false;
          case 'account-takeover':
            return tx.riskIndicators.includes('geographic-anomaly');
          case 'invoice-fraud':
            return tx.riskIndicators.includes('new-payee') && tx.amount > rule.threshold;
          case 'insider-fraud':
            return tx.riskIndicators.includes('after-hours') && tx.amount > rule.threshold;
          case 'expense-fraud':
            return tx.amount > 5000 && tx.type === 'Routine';
          default:
            return tx.riskIndicators.length > 0;
        }
      });

      if (matchingTxns.length > 0) {
        const entities = [...new Set(matchingTxns.map(t => t.from))];
        entities.forEach(entity => {
          const entityTxns = matchingTxns.filter(t => t.from === entity);
          const riskScore = Math.min(100, Math.round((entityTxns.reduce((s, t) => s + t.amount, 0) / 100000) * 50 + entityTxns.length * 10));
          this._alerts.push({
            id: 'ALR-' + Date.now() + '-' + step,
            ruleId: rule.id,
            ruleName: rule.name,
            severity: riskScore > 80 ? 'critical' : riskScore > 60 ? 'high' : riskScore > 40 ? 'medium' : 'low',
            timestamp: entityTxns[0].timestamp,
            transactions: entityTxns,
            entity,
            riskScore,
            indicators: [...new Set(entityTxns.flatMap(t => t.riskIndicators))],
            status: 'new',
            assignee: 'Fraud Analyst',
            notes: [],
          });
        });
      }

      step++;
      this._progress = Math.round((step / totalSteps) * 100);
      setTimeout(analyzeRule, 300);
    };

    setTimeout(analyzeRule, 200);
  }

  private _buildCases(): void {
    const critical = this._alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
    const cases: FraudCase[] = [];
    critical.forEach((alert, i) => {
      const totalLoss = alert.transactions.reduce((s, t) => s + t.amount, 0);
      cases.push({
        id: 'CASE-' + (100 + i),
        alertIds: [alert.id],
        title: `${alert.ruleName} - ${alert.entity}`,
        status: 'new',
        priority: alert.severity === 'critical' ? 1 : 2,
        assignee: 'Fraud Analyst',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        estimatedLoss: totalLoss,
        transactions: alert.transactions,
        timeline: [
          { timestamp: alert.timestamp, event: 'Suspicious activity detected by rule: ' + alert.ruleName, actor: 'System' },
          { timestamp: new Date().toISOString(), event: 'Alert generated, risk score: ' + alert.riskScore, actor: 'System' },
          { timestamp: new Date().toISOString(), event: 'Case created and assigned to Fraud Analyst', actor: 'System' },
        ],
      });
    });
    this._cases = cases.sort((a, b) => a.priority - b.priority);
  }

  private _updateAlertStatus(alertId: string, status: CaseStatus): void {
    const alert = this._alerts.find(a => a.id === alertId);
    if (alert) { alert.status = status; this._alerts = [...this._alerts]; }
  }

  private _toggleRule(ruleId: string): void {
    const rule = this._rules.find(r => r.id === ruleId);
    if (rule) { rule.enabled = !rule.enabled; this._rules = [...this._rules]; }
  }

  private _generateReport(): void {
    const lines: string[] = [];
    lines.push('# Fraud Detection Report');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push('## Summary');
    lines.push(`- Total Alerts: ${this._totalAlerts}`);
    lines.push(`- Critical Alerts: ${this._criticalAlerts}`);
    lines.push(`- Open Cases: ${this._cases.filter(c => c.status !== 'resolved' && c.status !== 'false-positive').length}`);
    lines.push(`- Estimated Loss: $${this._estimatedLoss.toLocaleString()}`);
    lines.push(`- Active Rules: ${this._rules.filter(r => r.enabled).length}/${this._rules.length}`);
    lines.push('');
    lines.push('## Alerts by Severity');
    ['critical', 'high', 'medium', 'low'].forEach(sev => {
      const count = this._alerts.filter(a => a.severity === sev).length;
      if (count > 0) lines.push(`- ${sev.toUpperCase()}: ${count}`);
    });
    lines.push('');
    lines.push('## Top Alerts');
    this._alerts.slice(0, 10).forEach(a => {
      lines.push(`- [${a.severity.toUpperCase()}] ${a.ruleName}: ${a.entity} (Risk: ${a.riskScore}, Loss: $${a.transactions.reduce((s, t) => s + t.amount, 0).toLocaleString()})`);
    });
    lines.push('');
    lines.push('## Open Cases');
    this._cases.forEach(c => {
      lines.push(`### ${c.id}: ${c.title}`);
      lines.push(`- Status: ${c.status} | Priority: P${c.priority}`);
      lines.push(`- Estimated Loss: $${c.estimatedLoss.toLocaleString()}`);
      lines.push(`- Transactions: ${c.transactions.length}`);
    });
    lines.push('');
    lines.push('## Recommendations');
    lines.push('1. Review all critical alerts immediately');
    lines.push('2. Enhance rules with lower false positive rates');
    lines.push('3. Implement real-time transaction monitoring');
    lines.push('4. Add machine learning-based anomaly detection');
    lines.push('5. Establish fraud investigation SLAs');
    this._reportContent = lines.join('\n');
    this._showReport = true;
    this._activeTab = 'report';
  }

  private _addAudit(category: FraudAuditEntry['category'], details: string): void {
    this._auditTrail = [{ id: 'fa-' + Date.now(), timestamp: new Date().toISOString(), action: category, user: 'Current User', details, category }, ...this._auditTrail].slice(0, 50);
  }

  private _addComment(): void {
    if (!this._newComment.trim() || !this._selectedCase) return;
    this._comments = [{ id: 'fc-' + Date.now(), timestamp: new Date().toISOString(), author: 'Current User', text: this._newComment.trim(), caseId: this._selectedCase.id }, ...this._comments].slice(0, 30);
    this._selectedCase.timeline.push({ timestamp: new Date().toISOString(), event: 'Comment added', actor: 'Current User' });
    this._newComment = '';
    this._addAudit('case', 'Comment added on case: ' + this._selectedCase.id);
  }

  private _analyzeWithHistory(): void {
    this._execRunning = true;
    this._execProgress = 0;
    this._addAudit('analysis', 'Starting fraud analysis with risk threshold: ' + this._riskThreshold);
    const record: FraudExecRecord = { id: 'fex-' + Date.now(), timestamp: new Date().toISOString(), transactionsAnalyzed: 0, alertsGenerated: 0, casesCreated: 0, estimatedLoss: 0, duration: 0, status: 'running', riskThreshold: this._riskThreshold };
    const start = Date.now();
    this._analyzeTransactions();
    const iv = setInterval(() => {
      this._execProgress = Math.min(this._execProgress + 10, 100);
      record.duration = Math.round((Date.now() - start) / 1000);
      if (this._execProgress >= 100) {
        clearInterval(iv);
        record.status = 'success';
        record.transactionsAnalyzed = this._sampleTransactions.length;
        record.alertsGenerated = this._alerts.length;
        record.casesCreated = this._cases.length;
        record.estimatedLoss = this._estimatedLoss;
        this._execHistory = [record, ...this._execHistory].slice(0, 20);
        this._execRunning = false;
        this._addAudit('analysis', 'Analysis completed: ' + record.alertsGenerated + ' alerts, ' + record.casesCreated + ' cases');
      }
    }, 200);
  }

  private _batchDeleteAlerts(): void {
    const count = this._selectedAlerts.size;
    this._alerts = this._alerts.filter(a => !this._selectedAlerts.has(a.id));
    this._selectedAlerts = new Set();
    this._addAudit('case', 'Deleted ' + count + ' alerts');
  }

  private _renderSLABar() {
    const elapsed = this._slaCountdown;
    const total = this._slaTarget * 3600;
    const percent = Math.max(0, Math.round(((total - elapsed) / total) * 100));
    const hrs = Math.floor(elapsed / 3600);
    const mins = Math.floor((elapsed % 3600) / 60);
    const color = percent < 25 ? '#ef4444' : percent < 50 ? '#f59e0b' : '#22c55e';
    return html`<div class="sla-bar">
      <div class="sla-indicator" style="background:${color}"></div>
      <div style="flex:1">
        <div style="font-size:11px;color:#9ca3af;margin-bottom:4px">Critical Alert SLA (${this._slaTarget}h response target)</div>
        <div class="progress-bar"><div class="progress-fill" style="width:${percent}%;background:${color}"></div></div>
      </div>
      <div class="sla-time" style="color:${color}">${hrs}h ${mins}m elapsed</div>
    </div>`;
  }

  private _renderComments() {
    if (!this._selectedCase) return nothing;
    const caseComments = this._comments.filter(c => c.caseId === this._selectedCase!.id);
    return html`<div class="comment-section">
      <div style="font-weight:600;font-size:13px;margin-bottom:10px">Case Discussion (${caseComments.length})</div>
      ${caseComments.length === 0 ? html`<div style="font-size:12px;color:#6b7280;padding:8px 0">No comments yet</div>` : ''}
      ${caseComments.map(c => html`<div class="comment-item">
        <div class="comment-avatar">${c.author.charAt(0)}</div>
        <div class="comment-body">
          <div><span class="comment-author">${c.author}</span><span class="comment-time">${new Date(c.timestamp).toLocaleString()}</span></div>
          <div class="comment-text">${c.text}</div>
        </div>
      </div>`)}
      <div style="display:flex;gap:8px;margin-top:10px">
        <input type="text" placeholder="Add a comment..." .value=${this._newComment} @input=${(e: Event) => { this._newComment = (e.target as HTMLInputElement).value; }} @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') this._addComment(); }} style="flex:1;background:#0a0c10;border:1px solid #2a2d3a;border-radius:6px;padding:8px 12px;color:#e2e8f0;font-size:13px;outline:none">
        <button class="btn btn-primary btn-sm" @click=${this._addComment}>Post</button>
      </div>
    </div>`;
  }

  private _renderHistoryTable() {
    if (this._execHistory.length === 0) return html`<div class="empty-state">No analysis history yet</div>`;
    const sorted = [...this._execHistory].sort((a, b) => {
      let cmp = 0;
      if (this._tableSort === 'timestamp') cmp = a.timestamp.localeCompare(b.timestamp);
      else if (this._tableSort === 'alertsGenerated') cmp = a.alertsGenerated - b.alertsGenerated;
      else if (this._tableSort === 'estimatedLoss') cmp = a.estimatedLoss - b.estimatedLoss;
      else if (this._tableSort === 'duration') cmp = a.duration - b.duration;
      return this._tableSortDir === 'asc' ? cmp : -cmp;
    });
    const totalPages = Math.max(1, Math.ceil(sorted.length / this._tablePageSize));
    const start = this._tablePage * this._tablePageSize;
    const records = sorted.slice(start, start + this._tablePageSize);
    const sortIcon = (col: string) => this._tableSort === col ? (this._tableSortDir === 'asc' ? ' \u2191' : ' \u2193') : '';
    return html`<div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">
        <span style="font-weight:600;font-size:12px;color:#9ca3af">Analysis History (${this._execHistory.length})</span>
        <select style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:4px;padding:4px 8px;color:#e2e8f0;font-size:11px" .value=${String(this._tablePageSize)} @change=${(e: Event) => { this._tablePageSize = parseInt((e.target as HTMLSelectElement).value); this._tablePage = 0; }}>
          <option value="5">5 per page</option><option value="10">10 per page</option><option value="25">25 per page</option>
        </select>
      </div>
      ${this._execRunning ? html`<div class="progress-bar" style="margin-bottom:10px"><div class="progress-fill" style="width:${this._execProgress}%"></div></div>` : nothing}
      <table class="exec-table">
        <thead><tr>
          <th @click=${() => { this._tableSort = 'timestamp'; this._tableSortDir = this._tableSortDir === 'asc' ? 'desc' : 'asc'; }}>Time${sortIcon('timestamp')}</th>
          <th @click=${() => { this._tableSort = 'alertsGenerated'; this._tableSortDir = this._tableSortDir === 'asc' ? 'desc' : 'asc'; }}>Alerts${sortIcon('alertsGenerated')}</th>
          <th>Cases</th>
          <th @click=${() => { this._tableSort = 'estimatedLoss'; this._tableSortDir = this._tableSortDir === 'asc' ? 'desc' : 'asc'; }}>Loss${sortIcon('estimatedLoss')}</th>
          <th @click=${() => { this._tableSort = 'duration'; this._tableSortDir = this._tableSortDir === 'asc' ? 'desc' : 'asc'; }}>Duration${sortIcon('duration')}</th>
          <th>Status</th>
        </tr></thead>
        <tbody>
          ${records.map(r => html`<tr>
            <td style="font-size:11px;color:#6b7280">${new Date(r.timestamp).toLocaleString()}</td>
            <td style="font-weight:700">${r.alertsGenerated}</td>
            <td>${r.casesCreated}</td>
            <td style="color:#fbbf24">$${r.estimatedLoss.toLocaleString()}</td>
            <td>${r.duration}s</td>
            <td><span class="status-tag status-${r.status === 'success' ? 'resolved' : r.status === 'failed' ? 'escalated' : 'investigating'}">${r.status}</span></td>
          </tr>`)}
        </tbody>
      </table>
      ${totalPages > 1 ? html`<div class="page-nav">${Array.from({ length: totalPages }, (_, i) => html`<button class="page-btn ${this._tablePage === i ? 'active' : ''}" @click=${() => { this._tablePage = i; }}>${i + 1}</button>`)}
      </div>` : nothing}
    </div>`;
  }

  private _renderAuditPanel() {
    const filtered = this._auditFilter === 'all' ? this._auditTrail : this._auditTrail.filter(e => e.category === this._auditFilter);
    return html`<div>
      <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">
        ${['all', 'analysis', 'case', 'config', 'export', 'rule'].map(f => html`<button class="btn btn-sm ${this._auditFilter === f ? 'btn-primary' : 'btn-secondary'}" @click=${() => { this._auditFilter = f; }}>${f}</button>`)}
      </div>
      <div style="max-height:400px;overflow-y:auto">
        ${filtered.length === 0 ? html`<div style="text-align:center;padding:30px;color:#6b7280;font-size:12px">No audit entries</div>` : ''}
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

  private _renderSettingsPanel() {
    return html`<div class="settings-panel">
      <div class="settings-title">Fraud Detection Settings</div>
      <div class="tabs" style="margin-bottom:12px">
        <button class="tab ${this._settingsTab === 'general' ? 'active' : ''}" @click=${() => { this._settingsTab = 'general'; }}>General</button>
        <button class="tab ${this._settingsTab === 'thresholds' ? 'active' : ''}" @click=${() => { this._settingsTab = 'thresholds'; }}>Thresholds</button>
        <button class="tab ${this._settingsTab === 'integrations' ? 'active' : ''}" @click=${() => { this._settingsTab = 'integrations'; }}>Integrations</button>
      </div>
      ${this._settingsTab === 'general' ? html`<div class="settings-grid">
        <div class="form-group"><label>Default Analysis Scope</label><select style="background:#0a0c10;border:1px solid #2a2d3a;border-radius:6px;padding:8px;color:#e2e8f0;font-size:13px;width:100%"><option>All Transactions</option><option>High Value Only</option><option>Suspicious Accounts</option></select></div>
        <div class="form-group"><label>SLA Target (hours)</label><input type="number" .value=${String(this._slaTarget)} @input=${(e: Event) => { this._slaTarget = parseInt((e.target as HTMLInputElement).value) || 4; }} style="background:#0a0c10;border:1px solid #2a2d3a;border-radius:6px;padding:8px;color:#e2e8f0;font-size:13px;width:100%"></div>
      </div>` : nothing}
      ${this._settingsTab === 'thresholds' ? html`<div class="settings-grid">
        <div class="form-group"><label>Risk Alert Threshold</label><div class="slider-row"><input type="range" min="1" max="10" .value=${String(this._riskThreshold)} @input=${(e: Event) => { this._riskThreshold = parseInt((e.target as HTMLInputElement).value); }}><span class="slider-val">${this._riskThreshold}/10</span></div></div>
      </div>` : nothing}
      ${this._settingsTab === 'integrations' ? html`<div class="settings-grid">
        <div class="form-group"><label>Escalation Email</label><input type="email" .value=${this._escalationEmail} @input=${(e: Event) => { this._escalationEmail = (e.target as HTMLInputElement).value; }} placeholder="fraud-alert@company.com" style="background:#0a0c10;border:1px solid #2a2d3a;border-radius:6px;padding:8px;color:#e2e8f0;font-size:13px;width:100%"></div>
        <div class="form-group"><label>Webhook URL</label><input type="url" .value=${this._webhookUrl} @input=${(e: Event) => { this._webhookUrl = (e.target as HTMLInputElement).value; }} placeholder="https://hooks.slack.com/..." style="background:#0a0c10;border:1px solid #2a2d3a;border-radius:6px;padding:8px;color:#e2e8f0;font-size:13px;width:100%"></div>
        <div class="form-group" style="grid-column:1/-1"><label>Scheduled Scan (Cron)</label><input type="text" value="0 */6 * * *" placeholder="0 */6 * * *" style="background:#0a0c10;border:1px solid #2a2d3a;border-radius:6px;padding:8px;color:#e2e8f0;font-size:13px;width:100%"></div>
        <div style="grid-column:1/-1;display:flex;gap:8px;margin-top:4px">
          <button class="btn btn-primary btn-sm" @click=${() => { this._addAudit('config', 'Settings saved'); }}>Save</button>
          <button class="btn btn-secondary btn-sm" @click=${() => { this._addAudit('config', 'Config exported'); }}>Export Config</button>
        </div>
      </div>` : nothing}
    </div>`;
  }

  private _exportReport(): void {
    if (!this._reportContent) return;
    const blob = new Blob([this._reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fraud-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }


  // --- Domain Rules Engine ---
  @state() private _bfRules: { id: string; name: string; category: string; severity: Severity; enabled: boolean; lastEval: string; passRate: number }[] = [];
  private _initBfRules() {
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
    this._bfRules = rules;
  }
  private _evaluateBfRules(): { passed: number; failed: number; skipped: number; total: number } {
    let passed = 0, failed = 0, skipped = 0;
    this._bfRules.forEach(r => { if (!r.enabled) { skipped++; } else if (r.passRate >= 80) { passed++; } else { failed++; } });
    return { passed, failed, skipped, total: this._bfRules.length };
  }

  // --- CVSS Scoring ---
  @state() private _bfcvssData: { itemId: string; vector: string; base: number; temporal: number; environmental: number; overall: number }[] = [];
  private _initBfCvss() {
    const vectors = ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:A/AC:H/PR:L/UI:R/S:C/C:L/I:L/A:N', 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N', 'CVSS:3.1/AV:L/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H', 'CVSS:3.1/AV:N/AC:H/PR:H/UI:R/S:U/C:N/I:L/A:N'];
    this._bfcvssData = vectors.map((v, i) => {
      const base = parseFloat((Math.random() * 6 + 3).toFixed(1));
      const temporal = parseFloat((base * (0.7 + Math.random() * 0.3)).toFixed(1));
      const environmental = parseFloat((temporal * (0.8 + Math.random() * 0.2)).toFixed(1));
      return { itemId: 'V-' + String(i + 1).padStart(3, '0'), vector: v, base, temporal, environmental, overall: environmental };
    });
  }

  // --- Anomaly Detection ---
  @state() private _bfanomalies: { id: string; type: string; severity: Severity; description: string; detected: string; confidence: number; affected: string[] }[] = [];
  private _runBfAnomalyDetection() {
    const types = [
      { type: 'Spike in violation rate', severity: 'high' as Severity, desc: 'Detected 280% increase in violations over the last 24 hours', affected: ['Core', 'Operations'] },
      { type: 'SLA breach pattern', severity: 'critical' as Severity, desc: 'Recurring SLA breaches on weekends indicating staffing gaps', affected: ['SLA', 'Staffing'] },
      { type: 'Baseline drift detected', severity: 'medium' as Severity, desc: 'Score drifted 10 points below established baseline over 7 days', affected: ['Metrics', 'Baseline'] },
      { type: 'Unusual escalation volume', severity: 'high' as Severity, desc: 'Escalation rate 2.5x above normal in infrastructure controls', affected: ['Infrastructure', 'Controls'] },
      { type: 'Stale findings accumulation', severity: 'low' as Severity, desc: '18 findings older than 90 days without status change', affected: ['Maintenance'] },
    ];
    this._bfanomalies = types.map((a, i) => ({
      id: 'ANO-' + String(i + 1).padStart(3, '0'), type: a.type, severity: a.severity,
      description: a.desc, detected: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
      confidence: parseFloat((0.65 + Math.random() * 0.30).toFixed(2)), affected: a.affected,
    }));
  }

  // --- Trend Prediction ---
  @state() private _bfpredictions: { horizon: string; metric: string; current: number; predicted: number; direction: 'up' | 'down' | 'stable'; confidence: number }[] = [];
  private _generateBfPredictions() {
    this._bfpredictions = [
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
  @state() private _bfApprovals: { id: string; title: string; requester: string; status: 'pending' | 'approved' | 'rejected' | 'expired'; createdAt: string; priority: Priority; type: string }[] = [];
  private _initBfApprovals() {
    this._bfApprovals = [
      { id: 'APR-001', title: 'Emergency exception request for critical finding', requester: 'Alice Chen', status: 'pending', createdAt: '2026-04-23T07:00:00Z', priority: 'p1', type: 'Exception' },
      { id: 'APR-002', title: 'Extend compliance deadline for quarterly audit', requester: 'Bob Martinez', status: 'pending', createdAt: '2026-04-22T18:00:00Z', priority: 'p2', type: 'Extension' },
      { id: 'APR-003', title: 'Disable security control for system migration', requester: 'Carol Wu', status: 'rejected', createdAt: '2026-04-22T14:00:00Z', priority: 'p1', type: 'Policy Change' },
      { id: 'APR-004', title: 'New assessment approval for third-party vendor', requester: 'Dave Kim', status: 'approved', createdAt: '2026-04-21T10:00:00Z', priority: 'p3', type: 'Vendor' },
      { id: 'APR-005', title: 'Network rule change for partner integration', requester: 'Eve Johnson', status: 'expired', createdAt: '2026-04-19T08:00:00Z', priority: 'p2', type: 'Network' },
    ];
  }
  private _approveBfItem(id: string) { const item = this._bfApprovals.find(a => a.id === id); if (item) item.status = 'approved'; this.requestUpdate(); }
  private _rejectBfItem(id: string) { const item = this._bfApprovals.find(a => a.id === id); if (item) item.status = 'rejected'; this.requestUpdate(); }

  // --- Activity Feed ---
  @state() private _bfActivity: { id: string; action: string; user: string; target: string; timestamp: string }[] = [];
  private _initBfActivity() {
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
    this._bfActivity = actions.map((a, i) => ({ id: 'ACT-' + String(i + 1).padStart(3, '0'), ...a, timestamp: new Date(Date.now() - i * 3600000).toISOString() }));
  }

  // --- Notification System ---
  @state() private _bfNotifications: { id: string; message: string; type: 'info' | 'warning' | 'error' | 'success'; read: boolean; timestamp: string }[] = [];
  private _initBfNotifications() {
    this._bfNotifications = [
      { id: 'NTF-001', message: 'Score dropped below threshold', type: 'warning', read: false, timestamp: new Date().toISOString() },
      { id: 'NTF-002', message: '3 items approaching SLA deadline within 24h', type: 'error', read: false, timestamp: new Date(Date.now() - 1800000).toISOString() },
      { id: 'NTF-003', message: 'Weekly report generated successfully', type: 'success', read: true, timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: 'NTF-004', message: 'New framework mapped to existing controls', type: 'info', read: true, timestamp: new Date(Date.now() - 14400000).toISOString() },
    ];
  }
  private _markBfNotifRead(id: string) { const n = this._bfNotifications.find(x => x.id === id); if (n) n.read = true; this.requestUpdate(); }

  // --- Panel Configuration ---
  @state() private _bfConfig: { layout: 'compact' | 'default' | 'expanded'; theme: 'dark' | 'midnight' | 'slate'; showAnomalies: boolean; showPredictions: boolean; autoRefresh: boolean; refreshInterval: number } = {
    layout: 'default', theme: 'dark', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60,
  };
  private _bfPresets: { name: string; config: typeof this._bfConfig }[] = [
    { name: 'Analyst View', config: { layout: 'expanded', theme: 'dark', showAnomalies: true, showPredictions: false, autoRefresh: true, refreshInterval: 30 } },
    { name: 'Executive Summary', config: { layout: 'compact', theme: 'slate', showAnomalies: false, showPredictions: true, autoRefresh: false, refreshInterval: 300 } },
    { name: 'Audit Mode', config: { layout: 'expanded', theme: 'midnight', showAnomalies: true, showPredictions: true, autoRefresh: true, refreshInterval: 60 } },
  ];
  private _applyBfPreset(preset: typeof this._bfPresets[0]) { this._bfConfig = { ...preset.config }; this.requestUpdate(); }

  private _renderBfTreemapSVG(): string {
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

  private _renderBfSankeySVG(): string {
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
  private _renderBfRules(): any {
    const ev = this._evaluateBfRules();
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
          $${this._bfRules.map(r => html`
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
  private _renderBfAnomalies(): any {
    const sc = (s: Severity) => s === 'critical' ? '#ef4444' : s === 'high' ? '#f97316' : s === 'medium' ? '#eab308' : '#22c55e';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Anomaly Detection</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._bfanomalies.map(a => html`
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
  private _renderBfPredictions(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Trend Predictions</div>
        <div style="display:flex;flex-direction:column;gap:4px">
          $${this._bfpredictions.map(pr => html`
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
  private _renderBfApprovals(): any {
    const stc = (s: string) => s === 'pending' ? '#eab308' : s === 'approved' ? '#22c55e' : s === 'rejected' ? '#ef4444' : '#6b7280';
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Approval Workflow</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:160px;overflow-y:auto">
          $${this._bfApprovals.map(a => html`
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
                  <button class="btn success" style="padding:2px 8px;font-size:9px" @click=$${() => this._approveBfItem(a.id)}>Approve</button>
                  <button class="btn error" style="padding:2px 8px;font-size:9px" @click=$${() => this._rejectBfItem(a.id)}>Reject</button>
                </div>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Activity Feed ---
  private _renderBfActivity(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Activity Feed</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:140px;overflow-y:auto">
          $${this._bfActivity.map(a => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:#1f2937;border-radius:4px;font-size:10px">
              <div style="width:20px;height:20px;border-radius:50%;background:#374151;display:flex;align-items:center;justify-content:center;font-size:9px">•</div>
              <div style="flex:1"><span style="font-weight:600">$${a.user}</span> $${a.action}</div>
              <span style="font-size:8px;color:#6b7280">$${new Date(a.timestamp).toLocaleTimeString()}</span>
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Notifications ---
  private _renderBfNotifications(): any {
    const tc = (t: string) => t === 'error' ? '#ef4444' : t === 'warning' ? '#eab308' : t === 'success' ? '#22c55e' : '#3b82f6';
    const unread = this._bfNotifications.filter(n => !n.read).length;
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Notifications $${unread > 0 ? html`<span class="badge badge-error">$${unread} new</span>` : nothing}</div>
        <div style="display:flex;flex-direction:column;gap:4px;max-height:120px;overflow-y:auto">
          $${this._bfNotifications.map(n => html`
            <div style="display:flex;align-items:center;gap:8px;padding:4px 8px;background:$${n.read ? '#1f2937' : '#252a36'};border-radius:4px;font-size:10px;opacity:$${n.read ? '0.6' : '1'};cursor:pointer" @click=$${() => this._markBfNotifRead(n.id)}>
              <span style="width:8px;height:8px;border-radius:50%;background:$${tc(n.type)}"></span>
              <span style="flex:1">$${n.message}</span>
              $${!n.read ? html`<span style="width:6px;height:6px;border-radius:50%;background:#3b82f6"></span>` : nothing}
            </div>`)}
        </div>
      </div>`;
  }

  // --- Render: Panel Config ---
  private _renderBfConfig(): any {
    return html`
      <div style="background:#1a1d27;border-radius:8px;padding:12px;margin-top:12px">
        <div style="font-weight:700;font-size:12px;margin-bottom:8px">Panel Configuration</div>
        <div style="display:flex;flex-direction:column;gap:6px;font-size:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Layout</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._bfConfig.layout = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="compact" ?selected=$${this._bfConfig.layout === 'compact'}>Compact</option>
              <option value="default" ?selected=$${this._bfConfig.layout === 'default'}>Default</option>
              <option value="expanded" ?selected=$${this._bfConfig.layout === 'expanded'}>Expanded</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Theme</span>
            <select class="form-input" style="flex:1" @change=$${(e: Event) => { this._bfConfig.theme = (e.target as HTMLSelectElement).value as any; this.requestUpdate(); }}>
              <option value="dark" ?selected=$${this._bfConfig.theme === 'dark'}>Dark</option>
              <option value="midnight" ?selected=$${this._bfConfig.theme === 'midnight'}>Midnight</option>
              <option value="slate" ?selected=$${this._bfConfig.theme === 'slate'}>Slate</option>
            </select>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Auto Refresh</span>
            <input type="checkbox" ?checked=$${this._bfConfig.autoRefresh} @change=$${() => { this._bfConfig.autoRefresh = !this._bfConfig.autoRefresh; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Anomalies</span>
            <input type="checkbox" ?checked=$${this._bfConfig.showAnomalies} @change=$${() => { this._bfConfig.showAnomalies = !this._bfConfig.showAnomalies; this.requestUpdate(); }}/>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:100px">Show Predictions</span>
            <input type="checkbox" ?checked=$${this._bfConfig.showPredictions} @change=$${() => { this._bfConfig.showPredictions = !this._bfConfig.showPredictions; this.requestUpdate(); }}/>
          </div>
          <div style="margin-top:6px;font-weight:600">Presets</div>
          <div style="display:flex;gap:4px">
            $${this._bfPresets.map(ps => html`<button class="btn" style="padding:2px 8px;font-size:9px" @click=$${() => this._applyBfPreset(ps)}>$${ps.name}</button>`)}
          </div>
        </div>
      </div>`;
  }

  render() {
    return html`
      <div class="panel">
        <div class="header">
          <div class="title"><span>&#x1F50D;</span> Business Fraud Detection</div>
          <div class="btn-row">
            <button class="btn btn-secondary btn-sm" @click=${() => { this._alerts = []; this._cases = []; this._sampleTransactions = []; this._totalAlerts = 0; this._criticalAlerts = 0; this._estimatedLoss = 0; }}>Reset</button>
            <button class="btn btn-secondary btn-sm" @click=${this._generateReport} ?disabled=${this._alerts.length === 0}>Generate Report</button>
          </div>
        </div>

        ${this._alerts.length > 0 ? html`
          <div class="stats-bar">
            <div class="stat"><div class="stat-value" style="color:#f87171">${this._criticalAlerts}</div><div class="stat-label">Critical</div></div>
            <div class="stat"><div class="stat-value" style="color:#fbbf24">${this._totalAlerts}</div><div class="stat-label">Total Alerts</div></div>
            <div class="stat"><div class="stat-value" style="color:#f87171">$${(this._estimatedLoss / 1000).toFixed(0)}K</div><div class="stat-label">Est. Loss</div></div>
            <div class="stat"><div class="stat-value">${this._cases.length}</div><div class="stat-label">Open Cases</div></div>
            <div class="stat"><div class="stat-value">${this._rules.filter(r => r.enabled).length}</div><div class="stat-label">Active Rules</div></div>
          </div>
        ` : nothing}

        <div class="tabs">
          <button class="tab ${this._activeTab === 'monitor' ? 'active' : ''}" @click=${() => { this._activeTab = 'monitor'; }}>Alert Monitor</button>
          <button class="tab ${this._activeTab === 'rules' ? 'active' : ''}" @click=${() => { this._activeTab = 'rules'; }}>Detection Rules</button>
          <button class="tab ${this._activeTab === 'cases' ? 'active' : ''}" @click=${() => { this._activeTab = 'cases'; }}>Cases (${this._cases.length})</button>
          <button class="tab ${this._activeTab === 'report' ? 'active' : ''}" @click=${() => { this._activeTab = 'report'; }}>Report</button>
          <button class="tab ${this._activeTab === 'history' ? 'active' : ''}" @click=${() => { this._activeTab = 'history'; }}>History</button>
          <button class="tab ${this._activeTab === 'audit' ? 'active' : ''}" @click=${() => { this._activeTab = 'audit'; }}>Audit</button>
          <button class="tab ${this._activeTab === 'settings' ? 'active' : ''}" @click=${() => { this._activeTab = 'settings'; }}>Settings</button>
          <button class="tab ${this._activeTab === 'analytics' ? 'active' : ''}" @click=${() => { this._activeTab = 'analytics'; }}>Analytics</button>
        </div>

        ${this._activeTab === 'monitor' ? html`${this._renderSLABar()}${this._renderMonitor()}` : nothing}
        ${this._activeTab === 'rules' ? this._renderRules() : nothing}
        ${this._activeTab === 'cases' ? html`${this._renderCases()}${this._renderComments()}` : nothing}
        ${this._activeTab === 'report' ? this._renderReport() : nothing}
        ${this._activeTab === 'history' ? this._renderHistoryTable() : nothing}
        ${this._activeTab === 'audit' ? this._renderAuditPanel() : nothing}
        ${this._activeTab === 'settings' ? this._renderSettingsPanel() : nothing}
        ${this._activeTab === 'analytics' ? this._renderAnalyticsTab() : nothing}
      </div>
    `;
  }

  private _renderRiskGauge(): ReturnType<typeof html> {
    const riskLevel = this._estimatedLoss > 100000 ? 'critical' : this._estimatedLoss > 50000 ? 'high' : this._estimatedLoss > 10000 ? 'medium' : 'low';
    const riskPercent = Math.min(100, Math.round((this._estimatedLoss / 200000) * 100));
    const riskColor = riskLevel === 'critical' ? '#ef4444' : riskLevel === 'high' ? '#f59e0b' : riskLevel === 'medium' ? '#3b82f6' : '#22c55e';
    const angle = (riskPercent / 100) * 180;
    const cx = 60, cy = 60, r = 45;
    const rad = (angle - 180) * Math.PI / 180;
    const ex = cx + r * Math.cos(rad);
    const ey = cy + r * Math.sin(rad);
    const arcPath = angle > 0 ? 'M ' + (cx - r) + ' ' + cy + ' A ' + r + ' ' + r + ' 0 0 1 ' + ex.toFixed(1) + ' ' + ey.toFixed(1) : '';
    return html`<div style="background:#1a1d27;border-radius:8px;padding:14px;margin-bottom:16px">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px">Fraud Risk Gauge</div>
      <svg width="100%" viewBox="0 0 120 80" style="max-width:200px;display:block;margin:0 auto">
        <path d="M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}" fill="none" stroke="#374151" stroke-width="8" stroke-linecap="round"/>
        <path d="${arcPath}" fill="none" stroke="${riskColor}" stroke-width="8" stroke-linecap="round"/>
        <circle cx="${cx}" cy="${cy}" r="28" fill="#0f1117" stroke="#2a2d3a" stroke-width="1"/>
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" fill="${riskColor}" font-size="16" font-weight="700">${riskPercent}%</text>
        <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="#6b7280" font-size="8">${riskLevel.toUpperCase()}</text>
        <text x="12" y="76" fill="#6b7280" font-size="7">LOW</text>
        <text x="108" y="76" fill="#6b7280" font-size="7" text-anchor="end">HIGH</text>
      </svg>
      <div style="display:flex;justify-content:space-around;margin-top:8px;font-size:11px">
        <div style="text-align:center"><div style="color:#ef4444;font-weight:700">${this._criticalAlerts}</div><div style="color:#6b7280">Critical</div></div>
        <div style="text-align:center"><div style="color:#fbbf24;font-weight:700">${this._alerts.filter(a => a.severity === 'high').length}</div><div style="color:#6b7280">High</div></div>
        <div style="text-align:center"><div style="color:#3b82f6;font-weight:700">${this._alerts.filter(a => a.severity === 'medium').length}</div><div style="color:#6b7280">Medium</div></div>
        <div style="text-align:center"><div style="color:#6b7280;font-weight:700">${this._alerts.filter(a => a.severity === 'low').length}</div><div style="color:#6b7280">Low</div></div>
      </div>
    </div>`;
  }

  private _renderMonitor() {
    return html`
      <div>
        ${this._alerts.length > 0 ? this._renderRiskGauge() : nothing}
        <div class="btn-row">
          <button class="btn btn-primary" @click=${this._analyzeWithHistory} ?disabled=${this._execRunning}>
            ${this._alerts.length === 0 ? 'Run Fraud Analysis' : 'Re-analyze Transactions'}
          </button>
          <select .value=${this._filterSeverity} @change=${(e: Event) => { this._filterSeverity = (e.target as HTMLSelectElement).value as any; }} style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:6px;padding:6px 12px;color:#e2e8f0;font-size:12px;font-family:inherit">
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        ${this._execRunning ? html`<div class="progress-bar"><div class="progress-fill" style="width:${this._execProgress}%"></div></div>` : nothing}
        ${this._alerts.length === 0 ? html`<div class="empty-state">Click "Run Fraud Analysis" to scan transactions</div>` : html`
          <div class="alert-list">
            ${this._alerts.filter(a => this._filterSeverity === 'all' || a.severity === this._filterSeverity).map(a => html`
              <div class="alert-card alert-${a.severity}">
                <div class="alert-header">
                  <div>
                    <div class="alert-name">${a.ruleName}</div>
                    <div style="font-size:12px;color:#9ca3af">Entity: ${a.entity} | Risk: <span class="sev-${a.severity}">${a.riskScore}</span></div>
                  </div>
                  <div style="display:flex;gap:4px;align-items:center">
                    <span class="sev-${a.severity}" style="font-weight:700">${a.severity.toUpperCase()}</span>
                    <span class="status-tag status-${a.status}">${a.status}</span>
                  </div>
                </div>
                <div class="alert-meta">
                  <span>Transactions: ${a.transactions.length}</span>
                  <span>Loss: $${a.transactions.reduce((s, t) => s + t.amount, 0).toLocaleString()}</span>
                  <span>${new Date(a.timestamp).toLocaleString()}</span>
                  <span>Assignee: ${a.assignee}</span>
                </div>
                <div class="alert-indicators">
                  ${a.indicators.map(ind => html`<span class="indicator-tag">${ind}</span>`)}
                </div>
                <div style="margin-top:6px;display:flex;gap:4px">
                  <button class="btn btn-sm btn-primary" @click=${() => this._updateAlertStatus(a.id, 'investigating')}>Investigate</button>
                  <button class="btn btn-sm btn-secondary" @click=${() => this._updateAlertStatus(a.id, 'escalated')}>Escalate</button>
                  <button class="btn btn-sm btn-secondary" @click=${() => this._updateAlertStatus(a.id, 'false-positive')}>False Positive</button>
                </div>
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }

  private _renderRules() {
    return html`<table class="rule-table">
      <thead><tr><th>Status</th><th>Rule Name</th><th>Category</th><th>Threshold</th><th>Severity</th><th>FPR</th></tr></thead>
      <tbody>${this._rules.map(r => html`
        <tr>
          <td><div class="toggle ${r.enabled ? 'on' : ''}" @click=${() => this._toggleRule(r.id)}><div class="toggle-dot"></div></div></td>
          <td style="font-weight:500">${r.name}<br><span style="font-size:10px;color:#9ca3af">${r.description}</span></td>
          <td><span class="indicator-tag">${r.category.replace(/-/g, ' ')}</span></td>
          <td>${r.threshold > 0 ? r.threshold.toLocaleString() + ' ' + r.unit : r.unit}${r.windowMinutes > 0 ? ' / ' + (r.windowMinutes / 60) + 'h' : ''}</td>
          <td class="sev-${r.severity}">${r.severity}</td>
          <td>${(r.falsePositiveRate * 100).toFixed(0)}%</td>
        </tr>
      `)}</tbody>
    </table>`;
  }

  private _renderCases() {
    if (this._cases.length === 0) return html`<div class="empty-state">No cases generated yet</div>`;
    return html`<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
      <div>
        <div style="font-weight:600;margin-bottom:8px">Case List</div>
        ${this._cases.map(c => html`
          <div class="case-card ${this._selectedCase?.id === c.id ? 'selected' : ''}" @click=${() => { this._selectedCase = c; }}>
            <div class="case-header">
              <div class="case-title">${c.id}: ${c.title}</div>
              <span class="status-tag status-${c.status}">${c.status}</span>
            </div>
            <div style="font-size:12px;color:#9ca3af;display:flex;gap:12px">
              <span>Priority: P${c.priority}</span>
              <span>Loss: $${c.estimatedLoss.toLocaleString()}</span>
              <span>Alerts: ${c.alertIds.length}</span>
            </div>
          </div>
        `)}
      </div>
      ${this._selectedCase ? html`
        <div>
          <div style="font-weight:600;margin-bottom:8px">Case Details: ${this._selectedCase.id}</div>
          <div class="case-detail">
            <div style="font-weight:600;margin-bottom:8px">${this._selectedCase.title}</div>
            <div style="font-size:12px;display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
              <div>Status: <span class="status-tag status-${this._selectedCase.status}">${this._selectedCase.status}</span></div>
              <div>Assignee: ${this._selectedCase.assignee}</div>
              <div>Estimated Loss: <strong style="color:#f87171">$${this._selectedCase.estimatedLoss.toLocaleString()}</strong></div>
              <div>Transactions: ${this._selectedCase.transactions.length}</div>
            </div>
            <div style="font-weight:600;margin-bottom:6px">Timeline</div>
            ${this._selectedCase.timeline.map(t => html`
              <div class="timeline-item">
                <span class="timeline-time">${new Date(t.timestamp).toLocaleString()}</span>
                <span>${t.event} <span style="color:#9ca3af">(${t.actor})</span></span>
              </div>
            `)}
            <div style="margin-top:12px;display:flex;gap:6px">
              <button class="btn btn-sm btn-primary" @click=${() => { if (this._selectedCase) { this._selectedCase.status = 'investigating'; this._selectedCase.timeline.push({ timestamp: new Date().toISOString(), event: 'Case moved to investigating', actor: this._selectedCase.assignee }); this._selectedCase = { ...this._selectedCase }; this._cases = [...this._cases]; } }}>Start Investigation</button>
              <button class="btn btn-sm btn-secondary" @click=${() => { if (this._selectedCase) { this._selectedCase.status = 'resolved'; this._selectedCase.timeline.push({ timestamp: new Date().toISOString(), event: 'Case resolved', actor: this._selectedCase.assignee }); this._selectedCase = { ...this._selectedCase }; this._cases = [...this._cases]; } }}>Resolve</button>
            </div>
          </div>
        </div>
      ` : html`<div class="empty-state" style="padding:20px">Select a case to view details</div>`}
    </div>`;
  }

  private _renderReport() {
    if (!this._showReport) return html`<div class="empty-state">Click "Generate Report" to create the fraud report</div>`;
    return html`<div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span style="font-weight:600;font-size:14px">Fraud Detection Report</span>
        <button class="btn btn-primary btn-sm" @click=${this._exportReport}>Export Markdown</button>
      </div>
      <div class="report-box">${this._reportContent}</div>
    </div>`;
  }

  // --- Benford's Law Visualization ---
  private _renderBenfordLaw(): any {
    const W = 460, H = 180, padL = 40, padB = 30, padT = 10;
    const chartW = W - padL - padB, chartH = H - padT - padB;
    const maxVal = 35;
    const toY = (v: number) => padT + chartH - (v / maxVal) * chartH;
    const barW = chartW / 9 - 4;
    return html`<div style="background:#1a1d27;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Benford's Law Analysis (First Digit Distribution)</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px">
        <div style="background:#0f1117;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:16px;font-weight:700;color:#22c55e">Pass</div>
          <div style="font-size:9px;color:#6b7280">Chi-Square Test</div>
        </div>
        <div style="background:#0f1117;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:16px;font-weight:700;color:#f59e0b">2.1%</div>
          <div style="font-size:9px;color:#6b7280">Max Deviation</div>
        </div>
        <div style="background:#0f1117;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:16px;font-weight:700;color:#3b82f6">0.94</div>
          <div style="font-size:9px;color:#6b7280">Correlation (R)</div>
        </div>
      </div>
      <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:480px">
        ${[0, 10, 20, 30].map(v => html`<line x1="${padL}" y1="${toY(v)}" x2="${W - padB}" y2="${toY(v)}" stroke="#2a2d3a" stroke-width="0.5"/><text x="${padL - 4}" y="${toY(v) + 3}" text-anchor="end" fill="#6b7280" font-size="7">${v}%</text>`)}
        ${this._benfordData.map((d, i) => {
          const x = padL + i * (chartW / 9) + 2;
          const expH = (d.expected / maxVal) * chartH;
          const actH = (d.actual / maxVal) * chartH;
          const devColor = d.deviation > 1.0 ? '#ef4444' : d.deviation > 0.5 ? '#f59e0b' : '#22c55e';
          return html`<g>
            <rect x="${x}" y="${padT + chartH - expH}" width="${barW / 2 - 1}" height="${expH}" fill="#3b82f640" rx="1" stroke="#3b82f6" stroke-width="0.5"/>
            <rect x="${x + barW / 2}" y="${padT + chartH - actH}" width="${barW / 2 - 1}" height="${actH}" fill="${devColor}40" rx="1" stroke="${devColor}" stroke-width="0.5"/>
            <text x="${x + barW / 2}" y="${H - padB + 14}" text-anchor="middle" fill="#9ca3af" font-size="8" font-weight="600">${d.digit}</text>
            ${d.deviation > 0.8 ? html`<circle cx="${x + barW / 2}" y="${toY(d.actual) - 8}" r="3" fill="${devColor}"/>` : nothing}
          </g>`;
        })}
        <line x1="${padL}" y1="${H - padB}" x2="${W - padB}" y2="${H - padB}" stroke="#2a2d3a" stroke-width="1"/>
      </svg>
      <div style="display:flex;gap:16px;margin-top:6px;font-size:9px;color:#6b7280">
        <span><span style="display:inline-block;width:10px;height:8px;background:#3b82f640;border:1px solid #3b82f6;margin-right:3px;vertical-align:middle"></span>Expected (Benford)</span>
        <span><span style="display:inline-block;width:10px;height:8px;background:#22c55e40;border:1px solid #22c55e;margin-right:3px;vertical-align:middle"></span>Actual</span>
        <span><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#ef4444;margin-right:3px;vertical-align:middle"></span>High deviation</span>
      </div>
    </div>`;
  }

  // --- Anomaly Detection Panel ---
  private _renderAnomalyDetection(): any {
    const statusColors: Record<string, string> = { confirmed: '#ef4444', investigating: '#f59e0b', review: '#3b82f6' };
    const typeColors: Record<string, string> = { statistical: '#8b5cf6', behavioral: '#06b6d4', temporal: '#f97316', pattern: '#ec4899' };
    return html`<div style="background:#1a1d27;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:12px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">Anomaly Detection Engine</div>
        <div style="display:flex;gap:6px">
          ${this._anomalyResults.filter(a => a.status === 'confirmed').length > 0 ? html`<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:#ef444420;color:#fca5a5;font-weight:600">${this._anomalyResults.filter(a => a.status === 'confirmed').length} confirmed</span>` : nothing}
          ${this._anomalyResults.filter(a => a.status === 'investigating').length > 0 ? html`<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:#f59e0b20;color:#fde047;font-weight:600">${this._anomalyResults.filter(a => a.status === 'investigating').length} investigating</span>` : nothing}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
        <div style="background:#0f1117;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#ef4444">${this._anomalyResults.length}</div>
          <div style="font-size:9px;color:#6b7280">Total Anomalies</div>
        </div>
        <div style="background:#0f1117;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#f59e0b">${Math.round(this._anomalyResults.reduce((s, a) => s + a.zscore, 0) / this._anomalyResults.length * 10) / 10}</div>
          <div style="font-size:9px;color:#6b7280">Avg Z-Score</div>
        </div>
        <div style="background:#0f1117;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#22c55e">${this._anomalyResults.filter(a => a.zscore >= 4).length}</div>
          <div style="font-size:9px;color:#6b7280">High Confidence (Z>=4)</div>
        </div>
      </div>
      ${this._anomalyResults.sort((a, b) => b.zscore - a.zscore).map(a => html`<div style="background:#0f1117;border-radius:6px;padding:10px;margin-bottom:6px;border-left:3px solid ${statusColors[a.status] || '#94a3b8'}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div style="font-size:12px;font-weight:600">${a.entity}</div>
          <div style="display:flex;gap:6px;align-items:center">
            <span style="font-size:9px;padding:1px 6px;border-radius:3px;background:${typeColors[a.type]}20;color:${typeColors[a.type]}">${a.type}</span>
            <span style="font-size:9px;padding:1px 6px;border-radius:3px;background:${statusColors[a.status]}20;color:${statusColors[a.status]};font-weight:600">${a.status}</span>
          </div>
        </div>
        <div style="font-size:10px;color:#94a3b8">${a.metric}: $${a.value.toLocaleString()} (baseline: $${a.baseline.toLocaleString()})</div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
          <span style="font-size:9px;color:#6b7280">Z-Score:</span>
          <div style="flex:1;height:6px;background:#2a2d3a;border-radius:3px;overflow:hidden;max-width:120px">
            <div style="width:${Math.min(100, (a.zscore / 7) * 100)}%;height:100%;background:${a.zscore >= 5 ? '#ef4444' : a.zscore >= 3 ? '#f59e0b' : '#22c55e'};border-radius:3px"></div>
          </div>
          <span style="font-size:11px;font-weight:700;color:${a.zscore >= 5 ? '#ef4444' : a.zscore >= 3 ? '#f59e0b' : '#22c55e'}">${a.zscore}</span>
        </div>
      </div>`)}
    </div>`;
  }

  // --- Sankey-style Fund Flow ---
  private _renderFundFlowSankey(): any {
    const riskColors: Record<string, string> = { low: '#22c55e', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' };
    const leftNodes = [...new Set(this._fundFlows.map(f => f.source))];
    const midNodes = [...new Set(this._fundFlows.map(f => f.target).filter(t => leftNodes.includes(this._fundFlows.find(fl => fl.target === t)?.source || ''))];
    const rightNodes = [...new Set(this._fundFlows.map(f => f.target).filter(t => !leftNodes.includes(t)))];
    const W = 500, H = 240;
    const leftX = 60, midX = 220, rightX = 380;
    const nodeH = 24;
    const leftSpacing = H / (leftNodes.length + 1);
    const midSpacing = H / (midNodes.length + 1);
    const rightSpacing = H / (rightNodes.length + 1);

    const leftPos: Record<string, number> = {};
    leftNodes.forEach((n, i) => { leftPos[n] = leftSpacing * (i + 1); });
    const midPos: Record<string, number> = {};
    midNodes.forEach((n, i) => { midPos[n] = midSpacing * (i + 1); });
    const rightPos: Record<string, number> = {};
    rightNodes.forEach((n, i) => { rightPos[n] = rightSpacing * (i + 1); });

    return html`<div style="background:#1a1d27;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Fund Flow Analysis (Sankey)</div>
      <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:520px">
        ${leftNodes.map(n => {
          const y = leftPos[n];
          return html`<rect x="${leftX - 40}" y="${y - 10}" width="80" height="20" fill="#1f2937" stroke="#374151" stroke-width="0.5" rx="4"/><text x="${leftX}" y="${y + 3}" text-anchor="middle" fill="#e2e8f0" font-size="7" font-weight="600">${n.length > 14 ? n.slice(0, 12) + '..' : n}</text>`;
        })}
        ${midNodes.map(n => {
          const y = midPos[n];
          return html`<rect x="${midX - 40}" y="${y - 10}" width="80" height="20" fill="#1f2937" stroke="#374151" stroke-width="0.5" rx="4"/><text x="${midX}" y="${y + 3}" text-anchor="middle" fill="#e2e8f0" font-size="7" font-weight="600">${n.length > 14 ? n.slice(0, 12) + '..' : n}</text>`;
        })}
        ${rightNodes.map(n => {
          const y = rightPos[n];
          const isHighRisk = this._fundFlows.some(f => f.target === n && (f.risk === 'critical' || f.risk === 'high'));
          return html`<rect x="${rightX - 40}" y="${y - 10}" width="80" height="20" fill="${isHighRisk ? '#450a0a' : '#1f2937'}" stroke="${isHighRisk ? '#ef4444' : '#374151'}" stroke-width="${isHighRisk ? '1.5' : '0.5'}" rx="4"/><text x="${rightX}" y="${y + 3}" text-anchor="middle" fill="${isHighRisk ? '#fca5a5' : '#e2e8f0'}" font-size="7" font-weight="600">${n.length > 14 ? n.slice(0, 12) + '..' : n}</text>`;
        })}
        ${this._fundFlows.map(f => {
          const fromY = leftPos[f.source] || midPos[f.source] || 0;
          const toY = midPos[f.target] || rightPos[f.target] || 0;
          const fromX = leftPos[f.source] ? leftX + 40 : midX + 40;
          const toX = midPos[f.target] ? midX - 40 : rightX - 40;
          const midY = (fromY + toY) / 2;
          const c = riskColors[f.risk] || '#94a3b8';
          return html`<path d="M ${fromX} ${fromY} C ${fromX + (toX - fromX) * 0.5} ${fromY}, ${fromX + (toX - fromX) * 0.5} ${toY}, ${toX} ${toY}" fill="none" stroke="${c}" stroke-width="${Math.max(1, Math.min(4, f.amount / 50000))}" opacity="0.6"/>`;
        })}
        <text x="${leftX}" y="16" text-anchor="middle" fill="#6b7280" font-size="8">Sources</text>
        <text x="${midX}" y="16" text-anchor="middle" fill="#6b7280" font-size="8">Intermediaries</text>
        <text x="${rightX}" y="16" text-anchor="middle" fill="#6b7280" font-size="8">Destinations</text>
      </svg>
      <div style="display:flex;gap:12px;margin-top:6px;font-size:9px;color:#6b7280;justify-content:center">
        ${Object.entries(riskColors).map(([k, v]) => html`<span><span style="display:inline-block;width:10px;height:2px;background:${v};margin-right:3px;vertical-align:middle"></span>${k}</span>`)}
      </div>
    </div>`;
  }

  // --- Team Workload ---
  private _renderFraudTeam(): any {
    return html`<div style="background:#1a1d27;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Investigation Team Workload</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px">
        ${this._fraudTeam.map(m => html`<div style="background:#0f1117;border-radius:8px;padding:10px;display:flex;gap:10px;align-items:center">
          <div style="width:36px;height:36px;border-radius:50%;background:${m.color};display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:white;flex-shrink:0">${m.avatar}</div>
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;font-weight:600">${m.name}</div>
            <div style="font-size:9px;color:#6b7280">${m.role}</div>
            <div style="display:flex;gap:8px;margin-top:3px;font-size:9px">
              <span style="color:#f59e0b">${m.active} active</span>
              <span style="color:#22c55e">${m.resolved} resolved</span>
            </div>
            <div style="height:4px;background:#2a2d3a;border-radius:2px;overflow:hidden;margin-top:3px">
              <div style="width:${(m.active / 5) * 100}%;height:100%;background:${m.active >= 4 ? '#ef4444' : m.active >= 3 ? '#f59e0b' : '#22c55e'};border-radius:2px"></div>
            </div>
          </div>
        </div>`)}
      </div>
      <div style="font-size:11px;font-weight:600;margin-bottom:6px">Activity Feed</div>
      ${[
        { user: 'Sarah Mitchell', action: 'confirmed fraud pattern for', target: 'Vendor Alpha', time: '12m ago', color: '#ef4444' },
        { user: 'Emily Zhang', action: 'generated anomaly report for', target: 'Q2 2026', time: '45m ago', color: '#22c55e' },
        { user: 'James Wilson', action: 'flagged transaction cluster in', target: 'Account-7742', time: '1h ago', color: '#3b82f6' },
        { user: 'Michael Brown', action: 'escalated case', target: 'Ghost Employee investigation', time: '2h ago', color: '#f59e0b' },
      ].map(a => html`<div style="display:flex;gap:8px;padding:4px 0;border-bottom:1px solid #2a2d3a;font-size:11px">
        <div style="width:5px;height:5px;border-radius:50%;background:${a.color};margin-top:6px;flex-shrink:0"></div>
        <div style="flex:1"><span style="font-weight:600;color:#e2e8f0">${a.user}</span> <span style="color:#9ca3af">${a.action}</span> <span style="color:#e2e8f0">${a.target}</span></div>
        <span style="font-size:9px;color:#6b7280;white-space:nowrap">${a.time}</span>
      </div>`)}
    </div>`;
  }

  // --- Trend Analysis ---
  private _renderFraudTrends(): any {
    const data = this._monthlyTrends;
    const W = 460, H = 140, padL = 40, padB = 25, padT = 10;
    const chartW = W - padL - padB, chartH = H - padT - padB;
    const maxAlerts = Math.max(...data.map(d => d.alerts));
    const maxLoss = Math.max(...data.map(d => d.loss));
    const toYAlerts = (v: number) => padT + chartH - (v / maxAlerts) * chartH;
    const toYLoss = (v: number) => padT + chartH - (v / maxLoss) * chartH;
    const toX = (i: number) => padL + (i / (data.length - 1)) * chartW;
    const alertPts = data.map((d, i) => `${toX(i)},${toYAlerts(d.alerts)}`).join(' ');
    const lossPts = data.map((d, i) => `${toX(i)},${toYLoss(d.loss / 1000)}`).join(' ');

    // Linear regression for alerts
    const n = data.length;
    const sumX = n * (n - 1) / 2;
    const sumY = data.reduce((s, d) => s + d.alerts, 0);
    const sumXY = data.reduce((s, d, i) => s + i * d.alerts, 0);
    const sumX2 = data.reduce((s, _, i) => s + i * i, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const predNext = Math.max(0, Math.round(slope * n + intercept));

    return html`<div style="background:#1a1d27;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Fraud Trend Analysis</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px">
        <div style="background:#0f1117;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:16px;font-weight:700;color:${slope > 0 ? '#ef4444' : '#22c55e'}">${slope > 0 ? '+' : ''}${slope.toFixed(1)}</div>
          <div style="font-size:9px;color:#6b7280">Alerts/month trend</div>
        </div>
        <div style="background:#0f1117;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:16px;font-weight:700;color:#f59e0b">${predNext}</div>
          <div style="font-size:9px;color:#6b7280">Predicted next month</div>
        </div>
        <div style="background:#0f1117;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:16px;font-weight:700;color:#3b82f6">$${(data.reduce((s, d) => s + d.loss, 0) / 1000).toFixed(0)}K</div>
          <div style="font-size:9px;color:#6b7280">Total loss (6mo)</div>
        </div>
        <div style="background:#0f1117;border-radius:6px;padding:8px;text-align:center">
          <div style="font-size:16px;font-weight:700;color:#22c55e">${Math.round((data.reduce((s, d) => s + d.recovered, 0) / data.reduce((s, d) => s + d.loss, 0)) * 100)}%</div>
          <div style="font-size:9px;color:#6b7280">Recovery rate</div>
        </div>
      </div>
      <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:480px">
        ${data.map((_, i) => html`<line x1="${toX(i)}" y1="${padT}" x2="${toX(i)}" y2="${H - padB}" stroke="#2a2d3a" stroke-width="0.3"/>`)}
        <polyline points="${alertPts}" fill="none" stroke="#ef4444" stroke-width="2"/>
        ${data.map((d, i) => html`<circle cx="${toX(i)}" cy="${toYAlerts(d.alerts)}" r="3" fill="#ef4444"/>`)}
        ${data.map((d, i) => html`<circle cx="${toX(i)}" cy="${toYLoss(d.loss / 1000)}" r="3" fill="#3b82f6"/>`)}
        <polyline points="${data.map((d, i) => `${toX(i)},${toYLoss(d.loss / 1000)}`).join(' ')}" fill="none" stroke="#3b82f6" stroke-width="1.5" stroke-dasharray="4,2"/>
        ${data.map((_, i) => html`<text x="${toX(i)}" y="${H - padB + 14}" text-anchor="middle" fill="#6b7280" font-size="7">${data[i].month}</text>`)}
        <text x="${toX(data.length - 0.5)}" y="${toYAlerts(predNext) - 6}" text-anchor="middle" fill="#f59e0b" font-size="7">${predNext} pred</text>
        <circle cx="${toX(data.length - 0.5)}" cy="${toYAlerts(predNext)}" r="3" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="2,2"/>
        <line x1="${padL}" y1="${H - padB}" x2="${W - padB}" y2="${H - padB}" stroke="#2a2d3a" stroke-width="1"/>
      </svg>
      <div style="display:flex;gap:16px;margin-top:6px;font-size:9px;color:#6b7280">
        <span><span style="display:inline-block;width:10px;height:2px;background:#ef4444;margin-right:3px;vertical-align:middle"></span>Alerts</span>
        <span><span style="display:inline-block;width:10px;height:2px;background:#3b82f6;margin-right:3px;vertical-align:middle;border-top:1px dashed #3b82f6"></span>Loss ($K)</span>
        <span><span style="display:inline-block;width:6px;height:6px;border-radius:50%;border:1.5px dashed #f59e0b;margin-right:3px;vertical-align:middle"></span>Predicted</span>
      </div>
    </div>`;
  }

  // --- SLA Breach Prediction ---
  private _renderSLAPrediction(): any {
    const cases = this._cases;
    const avgTimeToInvestigate = cases.length ? Math.round(cases.filter(c => c.status === 'investigating' || c.status === 'resolved').reduce((s, c) => s + ((new Date(c.updated).getTime() - new Date(c.created).getTime()) / 60000), 0) / Math.max(1, cases.filter(c => c.status === 'investigating' || c.status === 'resolved').length)) : 0;
    const slaHours = this._slaTarget;
    const slaMinutes = slaHours * 60;
    const breachRisk = avgTimeToInvestigate > slaMinutes * 0.8 ? 'critical' : avgTimeToInvestigate > slaMinutes * 0.5 ? 'high' : avgTimeToInvestigate > slaMinutes * 0.3 ? 'medium' : 'low';
    const riskColors: Record<string, string> = { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' };
    return html`<div style="background:#1a1d27;border-radius:8px;padding:14px;margin-bottom:12px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">SLA Breach Prediction</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
        <div style="background:#0f1117;border-radius:6px;padding:10px;text-align:center;border-top:3px solid ${riskColors[breachRisk]}">
          <div style="font-size:18px;font-weight:700;color:${riskColors[breachRisk]}">${breachRisk.toUpperCase()}</div>
          <div style="font-size:9px;color:#6b7280">Breach Risk Level</div>
        </div>
        <div style="background:#0f1117;border-radius:6px;padding:10px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#e2e8f0">${avgTimeToInvestigate}m</div>
          <div style="font-size:9px;color:#6b7280">Avg Investigation Time</div>
        </div>
        <div style="background:#0f1117;border-radius:6px;padding:10px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:#f59e0b">${slaHours}h</div>
          <div style="font-size:9px;color:#6b7280">SLA Target</div>
        </div>
      </div>
      <div style="height:8px;background:#2a2d3a;border-radius:4px;overflow:hidden;margin-bottom:8px">
        <div style="width:${Math.min(100, (avgTimeToInvestigate / slaMinutes) * 100)}%;height:100%;background:${riskColors[breachRisk]};border-radius:4px"></div>
      </div>
      <div style="font-size:10px;color:#6b7280">${avgTimeToInvestigate > 0 ? `At current rate, ${Math.max(0, Math.round(slaMinutes - avgTimeToInvestigate))} minutes of SLA buffer remaining.` : 'No active investigations to predict.'}</div>
    </div>`;
  }

  private _renderAnalyticsTab(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap">
        <button class="tab ${this._analyticsSubTab === 'benford' ? 'active' : ''}" @click=${() => { this._analyticsSubTab = 'benford'; }}>Benford's Law</button>
        <button class="tab ${this._analyticsSubTab === 'anomaly' ? 'active' : ''}" @click=${() => { this._analyticsSubTab = 'anomaly'; }}>Anomaly Detection</button>
        <button class="tab ${this._analyticsSubTab === 'sankey' ? 'active' : ''}" @click=${() => { this._analyticsSubTab = 'sankey'; }}>Fund Flows</button>
        <button class="tab ${this._analyticsSubTab === 'team' ? 'active' : ''}" @click=${() => { this._analyticsSubTab = 'team'; }}>Team</button>
        <button class="tab ${this._analyticsSubTab === 'trends' ? 'active' : ''}" @click=${() => { this._analyticsSubTab = 'trends'; }}>Trends</button>
        <button class="tab ${this._analyticsSubTab === 'prediction' ? 'active' : ''}" @click=${() => { this._analyticsSubTab = 'prediction'; }}>SLA Predict</button>
      </div>
      ${this._analyticsSubTab === 'benford' ? this._renderBenfordLaw() : ''}
      ${this._analyticsSubTab === 'anomaly' ? this._renderAnomalyDetection() : ''}
      ${this._analyticsSubTab === 'sankey' ? this._renderFundFlowSankey() : ''}
      ${this._analyticsSubTab === 'team' ? this._renderFraudTeam() : ''}
      ${this._analyticsSubTab === 'trends' ? this._renderFraudTrends() : ''}
      ${this._analyticsSubTab === 'prediction' ? html`${this._renderSLAPrediction()}${this._renderRiskGauge()}` : ''}
    `;
  }

  // === SCENARIO SIMULATION ENGINE ===
  @state() private _bfScenarios: {id:string;name:string;attackType:string;target:string;method:string;impactLow:number;impactHigh:number;confidence:number;mitigation:string;status:string}[] = [];
  @state() private _bfScenarioForm: {attackType:string;target:string;method:string} = {attackType:'',target:'',method:''};
  @state() private _bfScenarioCompare: boolean = false;
  @state() private _bfScenarioSelected: string[] = [];

  private _bfInitScenarios(): void {
    const saved = localStorage.getItem('bf_scenarios');
    if (saved) { try { this._bfScenarios = JSON.parse(saved); } catch { /* ignore */ } }
    if (this._bfScenarios.length === 0) {
      this._bfScenarios = [
        {id:'bf-s1',name:'Baseline Threat',attackType:'Phishing',target:'Employees',method:'Spear Email',impactLow:45,impactHigh:78,confidence:72,mitigation:'Security awareness training + email filtering',status:'active'},
        {id:'bf-s2',name:'Escalated Attack',attackType:'Ransomware',target:'Endpoints',method:'Drive-by Download',impactLow:65,impactHigh:95,confidence:58,mitigation:'EDR deployment + network segmentation',status:'saved'},
        {id:'bf-s3',name:'Insider Threat',attackType:'Data Exfiltration',target:'Databases',method:'SQL Injection',impactLow:55,impactHigh:88,confidence:65,mitigation:'DLP policies + query monitoring',status:'draft'},
      ];
    }
  }

  private _bfSaveScenarios(): void {
    localStorage.setItem('bf_scenarios', JSON.stringify(this._bfScenarios));
  }

  private _bfAddScenario(): void {
    const f = this._bfScenarioForm;
    if (!f.attackType || !f.target) return;
    this._bfScenarios = [...this._bfScenarios, {
      id: 'bf-s' + (this._bfScenarios.length + 1),
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
    this._bfScenarioForm = {attackType:'',target:'',method:''};
    this._bfSaveScenarios();
  }

  private _bfRenderScenarioEngine(): any {
    const attackTypes = ['Phishing','Ransomware','DDoS','SQL Injection','XSS','Privilege Escalation','Supply Chain','Zero-Day'];
    const targets = ['Employees','Endpoints','Servers','Databases','Network','Cloud','APIs','Mobile'];
    const methods = ['Spear Email','Drive-by Download','Brute Force','Social Engineering','Exploit Kit','Watering Hole','Malware','Misconfiguration'];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">Scenario Simulation Engine</span>
          <button class="tab" @click=${() => { this._bfScenarioCompare = !this._bfScenarioCompare; }}>${this._bfScenarioCompare ? 'List View' : 'Compare'}</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px">
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._bfScenarioForm = {...this._bfScenarioForm, attackType: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Attack Type</option>
            ${attackTypes.map(a => html`<option value=${a} ${this._bfScenarioForm.attackType === a ? 'selected' : ''}>${a}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._bfScenarioForm = {...this._bfScenarioForm, target: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Target</option>
            ${targets.map(t => html`<option value=${t} ${this._bfScenarioForm.target === t ? 'selected' : ''}>${t}</option>`)}
          </select>
          <select style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 6px;color:#e2e8f0;font-size:11px" @change=${(e: any) => { this._bfScenarioForm = {...this._bfScenarioForm, method: (e.target as HTMLSelectElement).value}; }}>
            <option value="">Method</option>
            ${methods.map(m => html`<option value=${m} ${this._bfScenarioForm.method === m ? 'selected' : ''}>${m}</option>`)}
          </select>
        </div>
        <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 12px;color:#fff;font-size:11px;cursor:pointer" @click=${this._bfAddScenario}>Run Simulation</button>
      </div>
      ${this._bfScenarioCompare && this._bfScenarios.length >= 2 ? html`
        <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Side-by-Side Comparison</div>
          <div style="display:grid;grid-template-columns:repeat(${Math.min(3, this._bfScenarios.length)},1fr);gap:8px">
            ${this._bfScenarios.slice(0,3).map(s => html`
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
        <div style="font-weight:600;font-size:12px;color:#e2e8f0;margin-bottom:8px">Saved Scenarios (${this._bfScenarios.length})</div>
        ${this._bfScenarios.map(s => html`
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
  @state() private _bfTrendData: {day:number;value:number;anomaly:boolean}[] = [];
  @state() private _bfTrendZoom: {start:number;end:number} | null = null;
  @state() private _bfTrendMA: number = 7;

  private _bfInitTrendData(): void {
    const data: {day:number;value:number;anomaly:boolean}[] = [];
    let base = 50 + Math.random() * 30;
    for (let i = 0; i < 90; i++) {
      base += (Math.random() - 0.48) * 8;
      base = Math.max(10, Math.min(100, base));
      const anomaly = Math.random() < 0.05;
      data.push({ day: i, value: anomaly ? base + (Math.random() > 0.5 ? 25 : -20) : base, anomaly });
    }
    this._bfTrendData = data;
  }

  private _bfCalcMA(window: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < this._bfTrendData.length; i++) {
      const start = Math.max(0, i - window + 1);
      const slice = this._bfTrendData.slice(start, i + 1);
      result.push(slice.reduce((s, d) => s + d.value, 0) / slice.length);
    }
    return result;
  }

  private _bfGetStats(): {mean:number;median:number;stddev:number;trend:string} {
    const vals = this._bfTrendData.map(d => d.value);
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

  private _bfRenderTimeSeries(): any {
    const stats = this._bfGetStats();
    const filtered = this._bfTrendZoom ? this._bfTrendData.filter(d => d.day >= this._bfTrendZoom.start && d.day <= this._bfTrendZoom.end) : this._bfTrendData;
    const maxVal = Math.max(...filtered.map(d => d.value));
    const minVal = Math.min(...filtered.map(d => d.value));
    const range = maxVal - minVal || 1;
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">90-Day Trend Analysis</span>
          <div style="display:flex;gap:4px">
            <button class="tab ${this._bfTrendMA === 7 ? 'active' : ''}" @click=${() => { this._bfTrendMA = 7; }}>7D MA</button>
            <button class="tab ${this._bfTrendMA === 30 ? 'active' : ''}" @click=${() => { this._bfTrendMA = 30; }}>30D MA</button>
            <button class="tab" @click=${() => { this._bfTrendZoom = null; }}>Reset Zoom</button>
          </div>
        </div>
        <div style="position:relative;height:120px;background:#1a1d2e;border-radius:6px;overflow:hidden;margin-bottom:8px;cursor:crosshair" @click=${(e: any) => {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const x = e.clientX - rect.left;
          const ratio = x / rect.width;
          const center = Math.floor(ratio * 90);
          this._bfTrendZoom = { start: Math.max(0, center - 10), end: Math.min(89, center + 10) };
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
  @state() private _bfRoles: string[] = ['Admin','Analyst','Operator','Viewer','Auditor'];
  @state() private _bfActions: string[] = ['Create','Read','Update','Delete','Export','Approve'];
  @state() private _bfPermissions: { [role: string]: { [action: string]: boolean } } = {};
  @state() private _bfPermAudit: {role:string;action:string;changedBy:string;timestamp:string;oldVal:boolean;newVal:boolean}[] = [];
  @state() private _bfPermCompare: string[] = [];

  private _bfInitPermissions(): void {
    const perms: Record<string, Record<string, boolean>> = {};
    const defaults: Record<string, boolean[]> = {
      Admin: [true,true,true,true,true,true],
      Analyst: [true,true,true,false,true,false],
      Operator: [true,true,true,false,false,false],
      Viewer: [false,true,false,false,false,false],
      Auditor: [false,true,false,false,true,false],
    };
    for (const role of this._bfRoles) {
      perms[role] = {};
      this._bfActions.forEach((a, i) => { perms[role][a] = defaults[role]?.[i] ?? false; });
    }
    this._bfPermissions = perms;
  }

  private _bfTogglePermission(role: string, action: string): void {
    const old = this._bfPermissions[role][action];
    this._bfPermissions = {...this._bfPermissions, [role]: {...this._bfPermissions[role], [action]: !old}};
    this._bfPermAudit.unshift({role,action,changedBy:'current_user',timestamp:new Date().toISOString(),oldVal:old,newVal:!old});
  }

  private _bfRenderRBAC(): any {
    const compareRoles = this._bfPermCompare.map(r => this._bfPermissions[r]).filter(Boolean);
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0">RBAC Permission Matrix</span>
          <div style="display:flex;gap:4px">
            ${this._bfRoles.map(r => html`
              <button class="tab ${this._bfPermCompare.includes(r) ? 'active' : ''}" @click=${() => {
                this._bfPermCompare = this._bfPermCompare.includes(r) ? this._bfPermCompare.filter(x => x !== r) : [...this._bfPermCompare, r];
              }}>${r}</button>
            `)}
          </div>
        </div>
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:10px">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a">Role \ Action</th>
                ${this._bfActions.map(a => html`<th style="padding:6px;color:#6b7280;border-bottom:1px solid #2a2d3a;text-align:center">${a}</th>`)}
              </tr>
            </thead>
            <tbody>
              ${this._bfRoles.map(role => html`
                <tr style="border-bottom:1px solid #1a1d2e">
                  <td style="padding:6px;color:#e2e8f0;font-weight:600">${role}</td>
                  ${this._bfActions.map(action => html`
                    <td style="text-align:center;padding:6px">
                      <button style="width:28px;height:20px;border-radius:3px;border:1px solid #2a2d3a;background:${this._bfPermissions[role][action] ? '#22c55e' : '#1a1d2e'};cursor:pointer;color:#fff;font-size:10px" @click=${() => this._bfTogglePermission(role, action)}>${this._bfPermissions[role][action] ? 'Y' : 'N'}</button>
                    </td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${compareRoles.length >= 2 ? html`
          <div style="margin-top:10px;padding:8px;background:#1a1d2e;border-radius:6px">
            <div style="font-size:11px;font-weight:600;color:#e2e8f0;margin-bottom:6px">Role Diff: ${this._bfPermCompare.join(' vs ')}</div>
            ${this._bfActions.map(action => {
              const vals = compareRoles.map(r => r[action]);
              const allSame = vals.every(v => v === vals[0]);
              return allSame ? nothing : html`
                <div style="display:flex;gap:8px;padding:3px 0;font-size:10px">
                  <span style="color:#6b7280;width:60px">${action}:</span>
                  ${compareRoles.map((r, i) => html`<span style="color:${r[action] ? '#22c55e' : '#ef4444'}">${this._bfPermCompare[i]}=${r[action] ? 'Y' : 'N'}</span>`)}
                </div>
              `;
            })}
          </div>
        ` : nothing}
        ${this._bfPermAudit.length > 0 ? html`
          <div style="margin-top:8px;font-size:9px;color:#6b7280">Recent: ${this._bfPermAudit.slice(0,3).map(a => html`<span style="margin-right:8px">${a.role}.${a.action}: ${a.oldVal ? 'Y' : 'N'}->${a.newVal ? 'Y' : 'N'}</span>`)}
        ` : nothing}
      </div>
    `;
  }

  // === REPORTING SUITE ===
  @state() private _bfReportTemplate: string = 'executive';
  @state() private _bfReportSchedule: string = 'weekly';
  @state() private _bfReportDistList: string[] = ['security-team@company.com','ciso@company.com'];
  @state() private _bfReportHistory: {id:string;template:string;generatedAt:string;status:string}[] = [];

  private _bfGenerateReport(): void {
    const id = 'rpt-' + Date.now();
    this._bfReportHistory.unshift({id,template:this._bfReportTemplate,generatedAt:new Date().toISOString(),status:'sent'});
  }

  private _bfRenderReporting(): any {
    const templates = [{key:'executive',label:'Executive Summary',desc:'High-level overview for leadership'},{key:'technical',label:'Technical Report',desc:'Detailed findings for engineers'},{key:'compliance',label:'Compliance Audit',desc:'Regulatory compliance evidence'}];
    const schedules = [{key:'daily',label:'Daily'},{key:'weekly',label:'Weekly'},{key:'monthly',label:'Monthly'}];
    return html`
      <div style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="font-weight:700;font-size:13px;color:#e2e8f0;margin-bottom:8px">Report Generator</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Template</div>
            ${templates.map(t => html`
              <div style="padding:6px;background:${this._bfReportTemplate === t.key ? '#1e3a5f' : '#1a1d2e'};border:1px solid ${this._bfReportTemplate === t.key ? '#3b82f6' : '#2a2d3a'};border-radius:4px;margin-bottom:4px;cursor:pointer" @click=${() => { this._bfReportTemplate = t.key; }}>
                <div style="font-size:11px;color:#e2e8f0">${t.label}</div>
                <div style="font-size:9px;color:#6b7280">${t.desc}</div>
              </div>
            `)}
          </div>
          <div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Schedule</div>
            <div style="display:flex;gap:4px;margin-bottom:8px">
              ${schedules.map(s => html`<button class="tab ${this._bfReportSchedule === s.key ? 'active' : ''}" @click=${() => { this._bfReportSchedule = s.key; }}>${s.label}</button>`)}
            </div>
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Distribution</div>
            <div style="font-size:10px;color:#9ca3af">${this._bfReportDistList.map(d => html`<div>${d}</div>`)}</div>
            <div style="margin-top:6px;display:flex;gap:4px">
              <button style="background:#3b82f6;border:none;border-radius:4px;padding:4px 10px;color:#fff;font-size:10px;cursor:pointer" @click=${this._bfGenerateReport}>Generate</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">PDF</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">CSV</button>
              <button style="background:#1a1d2e;border:1px solid #2a2d3a;border-radius:4px;padding:4px 10px;color:#9ca3af;font-size:10px;cursor:pointer">JSON</button>
            </div>
          </div>
        </div>
        ${this._bfReportHistory.length > 0 ? html`
          <div style="border-top:1px solid #2a2d3a;padding-top:8px">
            <div style="font-size:10px;color:#6b7280;margin-bottom:4px">Recent Reports</div>
            ${this._bfReportHistory.slice(0,3).map(r => html`
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
  @state() private _bfHighContrast: boolean = false;
  @state() private _bfA11yAnnounce: string = '';
  @state() private _bfShortcutsVisible: boolean = false;
  @state() private _bfFocusTrap: boolean = false;

  private _bfShortcuts: Record<string, string> = {
    'Escape': 'Close dialogs / Cancel',
    'Ctrl+Shift+S': 'Toggle scenario simulation',
    'Ctrl+Shift+T': 'Toggle time-series view',
    'Ctrl+Shift+R': 'Open report generator',
    'Ctrl+Shift+A': 'Toggle accessibility panel',
    'Ctrl+Shift+H': 'Toggle high contrast',
    'Tab': 'Navigate between sections',
    'Enter/Space': 'Activate focused button',
  };

  private _bfHandleKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape' && this._bfFocusTrap) { this._bfFocusTrap = false; this._bfAnnounce('Dialog closed'); }
    if (e.ctrlKey && e.shiftKey && e.key === 'H') { e.preventDefault(); this._bfHighContrast = !this._bfHighContrast; this._bfAnnounce('High contrast ' + (this._bfHighContrast ? 'enabled' : 'disabled')); }
    if (e.ctrlKey && e.shiftKey && e.key === 'A') { e.preventDefault(); this._bfShortcutsVisible = !this._bfShortcutsVisible; }
  }

  private _bfAnnounce(msg: string): void {
    this._bfA11yAnnounce = msg;
    setTimeout(() => { this._bfA11yAnnounce = ''; }, 2000);
  }

  private _bfRenderAccessibility(): any {
    return html`
      <div role="region" aria-label="Accessibility Controls" style="background:#0f1117;border-radius:8px;padding:12px;margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-weight:700;font-size:13px;color:#e2e8f0" role="heading" aria-level="3">Accessibility</span>
          <button class="tab ${this._bfShortcutsVisible ? 'active' : ''}" @click=${() => { this._bfShortcutsVisible = !this._bfShortcutsVisible; }} aria-expanded=${this._bfShortcutsVisible}>Shortcuts</button>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;font-size:11px;color:#e2e8f0;cursor:pointer">
            <input type="checkbox" .checked=${this._bfHighContrast} @change=${() => { this._bfHighContrast = !this._bfHighContrast; }} aria-label="Toggle high contrast mode">
            High Contrast
          </label>
        </div>
        ${this._bfShortcutsVisible ? html`
          <div role="list" aria-label="Keyboard shortcuts" style="background:#1a1d2e;border-radius:6px;padding:8px">
            ${Object.entries(this._bfShortcuts).map(([key, desc]) => html`
              <div role="listitem" style="display:flex;justify-content:space-between;padding:3px 0;font-size:10px">
                <kbd style="background:#2a2d3a;padding:1px 6px;border-radius:3px;color:#60a5fa;font-family:monospace">${key}</kbd>
                <span style="color:#9ca3af">${desc}</span>
              </div>
            `)}
          </div>
        ` : nothing}
        <div role="status" aria-live="polite" aria-atomic="true" style="position:absolute;left:-9999px">${this._bfA11yAnnounce}</div>
      </div>
    `;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this._bfInitScenarios();
    this._bfInitTrendData();
    this._bfInitPermissions();
    document.addEventListener('keydown', this._bfHandleKeydown.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this._bfHandleKeydown.bind(this));
  }

  // === TAB INTEGRATION FOR EXTENDED FEATURES ===
  @state() private _bfActiveSubTab: string = 'scenario';

  private _bfGetAllSubTabs(): {key:string;label:string}[] {
    return [
      {key:'scenario', label:'Simulation'},
      {key:'timeseries', label:'Trends'},
      {key:'rbac', label:'Access Control'},
      {key:'reporting', label:'Reports'},
      {key:'a11y', label:'Accessibility'},
    ];
  }

  private _bfRenderSubPanel(): any {
    switch (this._bfActiveSubTab) {
      case 'scenario': return this._bfRenderScenarioEngine();
      case 'timeseries': return this._bfRenderTimeSeries();
      case 'rbac': return this._bfRenderRBAC();
      case 'reporting': return this._bfRenderReporting();
      case 'a11y': return this._bfRenderAccessibility();
      default: return nothing;
    }
  }

  private _bfRenderTabBar(): any {
    return html`
      <div style="display:flex;gap:4px;margin-bottom:12px;border-bottom:1px solid #2a2d3a;padding-bottom:8px;flex-wrap:wrap" role="tablist" aria-label="Extended panel features">
        ${this._bfGetAllSubTabs().map(t => html`
          <button class="tab ${this._bfActiveSubTab === t.key ? 'active' : ''}" @click=${() => { this._bfActiveSubTab = t.key; }} role="tab" aria-selected=${this._bfActiveSubTab === t.key}>${t.label}</button>
        `)}
      </div>
      <div role="tabpanel" aria-labelledby="bf-tab-${this._bfActiveSubTab}">
        ${this._bfRenderSubPanel()}
      </div>
    `;
  }

  }
