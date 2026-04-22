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
        </div>

        ${this._activeTab === 'monitor' ? html`${this._renderSLABar()}${this._renderMonitor()}` : nothing}
        ${this._activeTab === 'rules' ? this._renderRules() : nothing}
        ${this._activeTab === 'cases' ? html`${this._renderCases()}${this._renderComments()}` : nothing}
        ${this._activeTab === 'report' ? this._renderReport() : nothing}
        ${this._activeTab === 'history' ? this._renderHistoryTable() : nothing}
        ${this._activeTab === 'audit' ? this._renderAuditPanel() : nothing}
        ${this._activeTab === 'settings' ? this._renderSettingsPanel() : nothing}
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
}
