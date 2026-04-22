/**
 * sc-vuln-management-workflow — Vulnerability Management Workflow
 * Full lifecycle tracking: Discover → Triage → Remediate → Verify
 * With SLA monitoring, CVSS distribution, scanner analytics, and bulk operations.
 */
import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

interface VulnFinding {
  id: string;
  cve: string;
  title: string;
  cvss: number;
  status: 'open' | 'in-progress' | 'remediated' | 'verified' | 'fp';
  assignee: string;
  dueDate: string;
  scanner: string;
  asset: string;
  sla: string;
  description: string;
  remediation: string;
  effort: 'low' | 'medium' | 'high';
  epss: number;
  exploitAvailable: boolean;
  affectedVersions: string;
  patchAvailable: boolean;
  firstSeen: string;
}

interface ScannerStats {
  name: string;
  findings: number;
  critical: number;
  high: number;
  lastScan: string;
}

@customElement('sc-vuln-management-workflow')
export class ScVulnManagementWorkflow extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: #e2e8f0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: #111827; border-radius: 12px; padding: 20px; }
    .pt { font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .stats { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 16px; }
    .stat { background: #1f2937; border-radius: 8px; padding: 10px; text-align: center; }
    .sv { font-size: 18px; font-weight: 700; }
    .sl { font-size: 9px; color: #94a3b8; margin-top: 2px; text-transform: uppercase; }
    .tabs { display: flex; gap: 4px; margin-bottom: 14px; flex-wrap: wrap; }
    .tab { padding: 6px 14px; border-radius: 6px; font-size: 11px; font-weight: 600; cursor: pointer; background: transparent; border: 1px solid transparent; color: #94a3b8; }
    .tab:hover { background: #374151; }
    .tab.active { background: #f59e0b; color: #111827; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
    .tbl th { text-align: left; padding: 8px; background: #0f172a; color: #94a3b8; font-weight: 600; font-size: 10px; text-transform: uppercase; border-bottom: 1px solid #374151; white-space: nowrap; }
    .tbl td { padding: 10px 8px; border-bottom: 1px solid #1f2937; vertical-align: middle; }
    .tbl tr:hover td { background: #1f2937; }
    .badge { display: inline-block; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
    .b-open { background: #450a0a; color: #fca5a5; }
    .b-in-progress { background: #422006; color: #fde047; }
    .b-remediated { background: #172554; color: #93c5fd; }
    .b-verified { background: #052e16; color: #86efac; }
    .b-fp { background: #1f2937; color: #6b7280; }
    .b-critical { background: #450a0a; color: #fca5a5; }
    .b-high { background: #431407; color: #fdba74; }
    .b-medium { background: #422006; color: #fde047; }
    .b-low { background: #052e16; color: #86efac; }
    .b-yes { background: #450a0a; color: #fca5a5; }
    .b-no { background: #1f2937; color: #6b7280; }
    .cvss-bar { width: 50px; height: 6px; background: #374151; border-radius: 3px; display: inline-block; vertical-align: middle; }
    .overdue { color: #ef4444; font-size: 10px; font-weight: 600; }
    .on-track { color: #22c55e; font-size: 10px; }
    .sb { padding: 8px 12px; border-radius: 6px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 12px; width: 100%; margin-bottom: 12px; outline: none; }
    .sb:focus { border-color: #f59e0b; }
    .progress-steps { display: flex; gap: 8px; margin-bottom: 16px; }
    .step { flex: 1; padding: 10px; background: #1f2937; border-radius: 8px; text-align: center; }
    .step-num { font-size: 18px; font-weight: 700; }
    .step-label { font-size: 10px; color: #94a3b8; margin-top: 2px; }
    .action-btn { padding: 5px 10px; border-radius: 4px; border: 1px solid #374151; background: #1f2937; color: #e2e8f0; font-size: 10px; font-weight: 600; cursor: pointer; margin-right: 4px; }
    .action-btn:hover { border-color: #f59e0b; }
    .action-btn.primary { background: #f59e0b; color: #111827; border-color: #f59e0b; }
    .filter-row { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .filter-chip { padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; cursor: pointer; background: #374151; color: #94a3b8; border: 1px solid transparent; }
    .filter-chip.active { background: #f59e0b; color: #111827; }
    .filter-chip:hover { border-color: #f59e0b; }
    .section { background: #1f2937; border-radius: 8px; padding: 14px; margin-bottom: 12px; }
    .stitle { font-weight: 600; font-size: 12px; margin-bottom: 10px; color: #94a3b8; }
    .scanner-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid #374151; gap: 10px; font-size: 12px; }
    .scanner-row:last-child { border-bottom: none; }
    .detail-panel { background: #0f172a; border: 1px solid #374151; border-radius: 10px; padding: 16px; margin-bottom: 14px; animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .detail-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
    .dm { background: #1f2937; border-radius: 6px; padding: 10px; }
    .dm-label { font-size: 10px; color: #6b7280; margin-bottom: 4px; }
    .dm-value { font-size: 13px; font-weight: 700; }
    .checkbox { width: 14px; height: 14px; accent-color: #f59e0b; cursor: pointer; }
    .bulk-bar { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: #0f172a; border-radius: 8px; margin-bottom: 12px; }
    .bulk-count { font-size: 12px; font-weight: 600; color: #f59e0b; }
    .cvss-dist { display: flex; gap: 4px; align-items: flex-end; height: 60px; padding: 10px; }
    .cvss-col { display: flex; flex-direction: column; align-items: center; flex: 1; }
    .cvss-col-bar { width: 100%; border-radius: 3px 3px 0 0; transition: height 0.3s; }
    .cvss-col-label { font-size: 9px; color: #94a3b8; margin-top: 4px; }
    .cvss-col-val { font-size: 10px; font-weight: 700; margin-bottom: 2px; }

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
  `;

  @state() private _tab: 'all' | 'critical' | 'high' | 'sla' | 'scanners' = 'all';
  @state() private _search = '';
  @state() private _statusFilter = 'all';
  @state() private _selectedFinding: VulnFinding | null = null;
  @state() private _selectedIds = new Set<string>();

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


  private _findings: VulnFinding[] = [
    { id: 'v1', cve: 'CVE-2026-1234', title: 'Log4Shell RCE', cvss: 10.0, status: 'in-progress', assignee: 'Wang Wei', dueDate: '2026-04-25', scanner: 'Nessus', asset: 'web-prod-01', sla: 'P1-24h', description: 'Remote code execution via JNDI lookup in Log4j 2.x. Critical severity, actively exploited in the wild.', remediation: 'Upgrade Log4j to 2.17.1+. Apply vendor patches.', effort: 'medium', epss: 0.975, exploitAvailable: true, affectedVersions: 'Log4j 2.0-2.14.1', patchAvailable: true, firstSeen: '2026-04-15' },
    { id: 'v2', cve: 'CVE-2026-2345', title: 'OpenSSL Buffer Overflow', cvss: 9.8, status: 'verified', assignee: 'Chen Li', dueDate: '2026-04-20', scanner: 'Qualys', asset: 'nginx-lb-02', sla: 'P1-24h', description: 'Buffer overflow in OpenSSL allows remote code execution. Affects TLS connections.', remediation: 'Upgrade to OpenSSL 3.0.9+.', effort: 'medium', epss: 0.650, exploitAvailable: true, affectedVersions: 'OpenSSL 1.1.1-1.1.1t', patchAvailable: true, firstSeen: '2026-04-10' },
    { id: 'v3', cve: 'CVE-2026-3456', title: 'Spring4Shell RCE', cvss: 9.1, status: 'open', assignee: 'Unassigned', dueDate: '2026-04-26', scanner: 'Nessus', asset: 'api-prod-03', sla: 'P1-24h', description: 'Remote code execution via class loader manipulation in Spring Framework.', remediation: 'Upgrade Spring Framework to 5.3.18+ or 5.2.20+.', effort: 'high', epss: 0.970, exploitAvailable: true, affectedVersions: 'Spring Framework 5.3.0-5.3.17', patchAvailable: true, firstSeen: '2026-04-18' },
    { id: 'v4', cve: 'CVE-2026-4567', title: 'SQL Injection', cvss: 8.2, status: 'in-progress', assignee: 'Zhang San', dueDate: '2026-05-01', scanner: 'Burp Suite', asset: 'web-front-05', sla: 'P2-7d', description: 'SQL injection in search endpoint allows unauthorized database access.', remediation: 'Use parameterized queries. Add input validation.', effort: 'medium', epss: 0.550, exploitAvailable: true, affectedVersions: 'Custom application', patchAvailable: false, firstSeen: '2026-04-16' },
    { id: 'v5', cve: 'CVE-2026-5678', title: 'XSS in jQuery', cvss: 6.5, status: 'remediated', assignee: 'Li Si', dueDate: '2026-05-05', scanner: 'Nessus', asset: 'wiki.internal', sla: 'P3-30d', description: 'Cross-site scripting vulnerability in outdated jQuery library.', remediation: 'Update jQuery to 3.7.0+.', effort: 'low', epss: 0.120, exploitAvailable: false, affectedVersions: 'jQuery < 3.4.1', patchAvailable: true, firstSeen: '2026-04-12' },
    { id: 'v6', cve: 'CVE-2026-6789', title: 'Path Traversal', cvss: 7.8, status: 'open', assignee: 'Unassigned', dueDate: '2026-04-28', scanner: 'OpenVAS', asset: 'file-server-02', sla: 'P2-7d', description: 'Directory traversal allows reading arbitrary files on the server.', remediation: 'Sanitize file path inputs. Restrict file access to intended directories.', effort: 'low', epss: 0.380, exploitAvailable: true, affectedVersions: 'Custom file server', patchAvailable: false, firstSeen: '2026-04-14' },
    { id: 'v7', cve: 'CVE-2026-7890', title: 'Weak TLS Config', cvss: 5.3, status: 'fp', assignee: 'Analyst-1', dueDate: '2026-05-10', scanner: 'Qualys', asset: 'web-prod-01', sla: 'P4-90d', description: 'TLS 1.0 and 1.1 still enabled with weak cipher suites.', remediation: 'Disable TLS 1.0/1.1. Configure strong cipher suites.', effort: 'low', epss: 0.050, exploitAvailable: false, affectedVersions: 'Nginx 1.18', patchAvailable: true, firstSeen: '2026-04-08' },
    { id: 'v8', cve: 'CVE-2026-8901', title: 'Redis Auth Bypass', cvss: 7.2, status: 'verified', assignee: 'DBA Team', dueDate: '2026-04-22', scanner: 'Nessus', asset: 'cache-cluster', sla: 'P1-24h', description: 'Authentication bypass in Redis allows unauthorized data access and remote code execution.', remediation: 'Enable Redis AUTH. Upgrade to Redis 7.0+. Configure firewall rules.', effort: 'low', epss: 0.480, exploitAvailable: true, affectedVersions: 'Redis < 7.0', patchAvailable: true, firstSeen: '2026-04-11' },
    { id: 'v9', cve: 'CVE-2026-9012', title: 'Kubernetes RBAC Misconfig', cvss: 8.1, status: 'in-progress', assignee: 'DevOps-2', dueDate: '2026-05-03', scanner: 'Kubesec', asset: 'k8s-prod-01', sla: 'P2-7d', description: 'Overly permissive RBAC bindings allow privilege escalation within the cluster.', remediation: 'Review and restrict RBAC policies. Implement Pod Security Standards.', effort: 'high', epss: 0.420, exploitAvailable: false, affectedVersions: 'Kubernetes 1.24-1.26', patchAvailable: false, firstSeen: '2026-04-17' },
    { id: 'v10', cve: 'CVE-2026-0123', title: 'SSH Weak Keys', cvss: 4.8, status: 'open', assignee: 'Unassigned', dueDate: '2026-05-15', scanner: 'Nessus', asset: 'jump-host-01', sla: 'P3-30d', description: 'SSH server using weak key exchange algorithms and allowing root login.', remediation: 'Disable weak KEX algorithms. Disable root login. Use key-based auth.', effort: 'low', epss: 0.080, exploitAvailable: false, affectedVersions: 'OpenSSH 7.4', patchAvailable: true, firstSeen: '2026-04-09' },
  ];

  private _scannerStats: ScannerStats[] = [
    { name: 'Nessus', findings: 5, critical: 2, high: 1, lastScan: '2h ago' },
    { name: 'Qualys', findings: 2, critical: 1, high: 1, lastScan: '4h ago' },
    { name: 'OpenVAS', findings: 1, critical: 0, high: 1, lastScan: '6h ago' },
    { name: 'Burp Suite', findings: 1, critical: 0, high: 1, lastScan: '1d ago' },
    { name: 'Kubesec', findings: 1, critical: 0, high: 1, lastScan: '3h ago' },
  ];

  private _getCvssColor(cvss: number): string {
    if (cvss >= 9) return '#ef4444';
    if (cvss >= 7) return '#f97316';
    if (cvss >= 4) return '#eab308';
    return '#22c55e';
  }

  private _isOverdue(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  private _getFilteredFindings(): VulnFinding[] {
    let filtered = this._findings;
    if (this._tab === 'critical') filtered = filtered.filter(f => f.cvss >= 9);
    else if (this._tab === 'high') filtered = filtered.filter(f => f.cvss >= 7 && f.cvss < 9);
    else if (this._tab === 'sla') filtered = filtered.filter(f => f.status !== 'verified' && f.status !== 'fp' && this._isOverdue(f.dueDate));

    if (this._statusFilter !== 'all') filtered = filtered.filter(f => f.status === this._statusFilter);

    const q = this._search.toLowerCase();
    if (q) filtered = filtered.filter(f => f.cve.toLowerCase().includes(q) || f.title.toLowerCase().includes(q) || f.asset.toLowerCase().includes(q));

    return filtered;
  }

  private _toggleSelect(id: string) {
    const s = new Set(this._selectedIds);
    if (s.has(id)) s.delete(id); else s.add(id);
    this._selectedIds = s;
  }

  private _renderCvssDistribution(): string {
    const ranges = [
      { label: '9-10', min: 9, max: 10.1, color: '#ef4444' },
      { label: '7-8.9', min: 7, max: 9, color: '#f97316' },
      { label: '4-6.9', min: 4, max: 7, color: '#eab308' },
      { label: '0-3.9', min: 0, max: 4, color: '#22c55e' },
    ];
    const maxCount = Math.max(...ranges.map(r => this._findings.filter(f => f.cvss >= r.min && f.cvss < r.max).length), 1);
    return ranges.map(r => {
      const count = this._findings.filter(f => f.cvss >= r.min && f.cvss < r.max).length;
      const h = (count / maxCount) * 50;
      return html`<div class="cvss-col">
        <div class="cvss-col-val" style="color:${r.color}">${count}</div>
        <div class="cvss-col-bar" style="height:${h}px;background:${r.color}"></div>
        <div class="cvss-col-label">${r.label}</div>
      </div>`;
    }).join('');
  }


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
    const blob = new Blob(['vuln-management-workflow export'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vuln-management-workflow-export.' + (format === 'markdown' ? 'md' : format); a.click();
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
      <div style="font-size:12px;font-weight:600;color:#94a3b8;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Vulnerability Management Workflow Playbook</div>
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


  render() {
    const findings = this._getFilteredFindings();
    const open = this._findings.filter(f => f.status === 'open' || f.status === 'in-progress');
    const critical = this._findings.filter(f => f.cvss >= 9);
    const overdue = this._findings.filter(f => f.status !== 'verified' && f.status !== 'fp' && this._isOverdue(f.dueDate));
    const sel = this._selectedFinding;
    const hasExploit = this._findings.filter(f => f.exploitAvailable).length;
    const hasPatch = this._findings.filter(f => f.patchAvailable).length;
    const allSelected = this._selectedIds.size === findings.length && findings.length > 0;

    return html`
      <div class="panel">
        <div class="pt">🔍 Vulnerability Management Workflow</div>

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

        <div class="progress-steps">
          <div class="step"><div class="step-num" style="color:#ef4444">${critical.length}</div><div class="step-label">Critical</div></div>
          <div class="step"><div class="step-num" style="color:#f97316">${this._findings.filter(f => f.cvss >= 7).length}</div><div class="step-label">High+</div></div>
          <div class="step"><div class="step-num" style="color:#eab308">${open.length}</div><div class="step-label">Active</div></div>
          <div class="step"><div class="step-num" style="color:#ef4444">${overdue.length}</div><div class="step-label">Overdue</div></div>
          <div class="step"><div class="step-num" style="color:#dc2626">${hasExploit}</div><div class="step-label">Exploitable</div></div>
          <div class="step"><div class="step-num" style="color:#22c55e">${hasPatch}</div><div class="step-label">Has Patch</div></div>
        </div>

        <div class="tabs">
          ${['all', 'critical', 'high', 'sla', 'scanners'].map(t => html`
            <span class="tab ${this._tab === t ? 'active' : ''}" @click=${() => { this._tab = t as any; this._selectedFinding = null; }}>${t === 'all' ? 'All' : t === 'sla' ? 'SLA Breach' : t === 'scanners' ? 'Scanners' : t.charAt(0).toUpperCase() + t.slice(1)} (${t === 'all' ? this._findings.length : t === 'critical' ? critical.length : t === 'sla' ? overdue.length : '-'})</span>
          `)}
        </div>

        ${this._tab === 'scanners' ? html`
          <div class="section">
            <div class="stitle">Scanner Coverage</div>
            ${this._scannerStats.map(s => html`
              <div class="scanner-row">
                <span style="flex:1;font-weight:600">${s.name}</span>
                <span style="font-size:10px;color:#ef4444">${s.critical} crit</span>
                <span style="font-size:10px;color:#f97316">${s.high} high</span>
                <span style="font-size:11px;font-weight:600">${s.findings} total</span>
                <span style="font-size:10px;color:#6b7280">Last: ${s.lastScan}</span>
              </div>
            `)}
          </div>
          <div class="section">
            <div class="stitle">CVSS Score Distribution</div>
            <div class="cvss-dist">${this._renderCvssDistribution()}</div>
          </div>
        ` : html`
          ${sel ? html`
            <div class="detail-panel">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <div>
                  <div style="font-weight:700;font-size:14px">${sel.cve} - ${sel.title}</div>
                  <div style="font-size:11px;color:#6b7280;margin-top:2px">First seen: ${sel.firstSeen} | Asset: ${sel.asset} | Scanner: ${sel.scanner}</div>
                </div>
                <button class="action-btn" @click=${() => { this._selectedFinding = null; }}>✕ Close</button>
              </div>
              <div class="detail-grid">
                <div class="dm"><div class="dm-label">CVSS Score</div><div class="dm-value" style="color:${this._getCvssColor(sel.cvss)}">${sel.cvss}</div></div>
                <div class="dm"><div class="dm-label">EPSS</div><div class="dm-value" style="color:${sel.epss > 0.5 ? '#ef4444' : sel.epss > 0.2 ? '#f97316' : '#22c55e'}">${(sel.epss * 100).toFixed(1)}%</div></div>
                <div class="dm"><div class="dm-label">Exploit</div><div class="dm-value"><span class="badge ${sel.exploitAvailable ? 'b-yes' : 'b-no'}">${sel.exploitAvailable ? 'Available' : 'No PoC'}</span></div></div>
                <div class="dm"><div class="dm-label">Patch</div><div class="dm-value"><span class="badge ${sel.patchAvailable ? 'b-verified' : 'b-no'}">${sel.patchAvailable ? 'Available' : 'No Patch'}</span></div></div>
                <div class="dm"><div class="dm-label">SLA</div><div class="dm-value" style="color:${sel.sla.startsWith('P1') ? '#ef4444' : '#f97316'}">${sel.sla}</div></div>
                <div class="dm"><div class="dm-label">Effort</div><div class="dm-value">${sel.effort}</div></div>
              </div>
              <div style="font-size:12px;margin-top:10px"><strong>Description:</strong> ${sel.description}</div>
              <div style="background:#1f2937;padding:10px;border-radius:6px;margin-top:8px;border-left:3px solid #3b82f6">
                <div style="font-weight:600;font-size:11px;color:#3b82f6;margin-bottom:4px">Remediation</div>
                <div style="font-size:12px">${sel.remediation}</div>
              </div>
              <div style="font-size:10px;color:#6b7280;margin-top:6px">Affected versions: ${sel.affectedVersions}</div>
              <div style="margin-top:10px">
                <button class="action-btn primary">✅ Mark Remediated</button>
                <button class="action-btn">👤 Reassign</button>
                <button class="action-btn">⏱ Extend SLA</button>
                <button class="action-btn">❌ False Positive</button>
                <button class="action-btn">📋 Create Ticket</button>
              </div>
            </div>
          ` : nothing}

          <div class="filter-row">
            <span class="filter-chip ${this._statusFilter === 'all' ? 'active' : ''}" @click=${() => { this._statusFilter = 'all'; this.requestUpdate(); }}>All Status</span>
            <span class="filter-chip ${this._statusFilter === 'open' ? 'active' : ''}" @click=${() => { this._statusFilter = 'open'; this.requestUpdate(); }}>Open</span>
            <span class="filter-chip ${this._statusFilter === 'in-progress' ? 'active' : ''}" @click=${() => { this._statusFilter = 'in-progress'; this.requestUpdate(); }}>In Progress</span>
            <span class="filter-chip ${this._statusFilter === 'remediated' ? 'active' : ''}" @click=${() => { this._statusFilter = 'remediated'; this.requestUpdate(); }}>Remediated</span>
            <span class="filter-chip ${this._statusFilter === 'verified' ? 'active' : ''}" @click=${() => { this._statusFilter = 'verified'; this.requestUpdate(); }}>Verified</span>
          </div>

          <input class="sb" placeholder="Search CVE, title, or asset..." .value=${this._search} @input=${(e: Event) => { this._search = (e.target as HTMLInputElement).value; this.requestUpdate(); }/>

          ${this._selectedIds.size > 0 ? html`
            <div class="bulk-bar">
              <span class="bulk-count">${this._selectedIds.size} selected</span>
              <button class="action-btn primary">▶ Bulk Assign</button>
              <button class="action-btn">📋 Export Selected</button>
              <button class="action-btn">⏱ Bulk Extend SLA</button>
            </div>
          ` : nothing}

          <div style="overflow-x:auto">
            <table class="tbl">
              <thead>
                <tr>
                  <th><input type="checkbox" class="checkbox" .checked=${allSelected} @change=${() => {
                    if (allSelected) this._selectedIds = new Set();
                    else this._selectedIds = new Set(findings.map(f => f.id));
                  } /></th>
                  <th>CVE</th><th>Title</th><th>CVSS</th><th>EPSS</th><th>Asset</th><th>Scanner</th><th>Status</th><th>Assignee</th><th>Due Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${findings.map(f => html`
                  <tr style="cursor:pointer" @click=${() => { this._selectedFinding = f; }}>
                    <td @click=${(e: Event) => { e.stopPropagation(); this._toggleSelect(f.id); }}><input type="checkbox" class="checkbox" .checked=${this._selectedIds.has(f.id)} /></td>
                    <td style="font-weight:700">${f.cve}</td>
                    <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis">${f.title}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:6px">
                        <div class="cvss-bar"><div style="width:${f.cvss * 10}%;height:100%;background:${this._getCvssColor(f.cvss)};border-radius:3px"></div></div>
                        <span style="font-weight:600;color:${this._getCvssColor(f.cvss)}">${f.cvss}</span>
                      </div>
                    </td>
                    <td>
                      <span style="font-size:10px;color:${f.epss > 0.5 ? '#ef4444' : f.epss > 0.2 ? '#f97316' : '#22c55e'}">${(f.epss * 100).toFixed(1)}%</span>
                      ${f.exploitAvailable ? html`<span class="badge b-yes" style="margin-left:2px">EXP</span>` : nothing}
                    </td>
                    <td>${f.asset}</td>
                    <td><span style="font-size:10px;color:#94a3b8">${f.scanner}</span></td>
                    <td><span class="badge b-${f.status}">${f.status.replace('-', ' ')}</span></td>
                    <td>${f.assignee}</td>
                    <td>
                      <div>${f.dueDate}</div>
                      ${this._isOverdue(f.dueDate) && f.status !== 'verified' && f.status !== 'fp' ? html`<div class="overdue">⚠ OVERDUE</div>` : nothing}
                    </td>
                    <td @click=${(e: Event) => e.stopPropagation()}>
                      <button class="action-btn" @click=${() => alert('Assigning ' + f.cve + '...')}>Assign</button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
          ${findings.length === 0 ? html`<div style="text-align:center;padding:40px;color:#6b7280">No findings match your filters</div>` : nothing}
        `}
      </div>
      </div>
      <div style="margin-top:12px;display:flex;justify-content:center">
        <button class="btn btn-sm ${this._showEnhanced ? 'btn-primary' : 'btn-secondary'}" @click=${() => {{ this._showEnhanced = !this._showEnhanced; this.requestUpdate(); }}>${this._showEnhanced ? 'Hide' : 'Show'} Advanced</button>
      </div>
      ${this._renderEnhancedSection()}
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-vuln-management-workflow': ScVulnManagementWorkflow; } }
