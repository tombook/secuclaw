/**
 * sc-scan-results-table — 高级扫描结果表格
 * 
 * Phase 2 进化：支持分页、排序、筛选、全局搜索
 * 对应 SKILL.md security-expert 的 scan-results 可视化定义
 */

import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';

/* ─── Types ──────────────────────────────────────── */

interface ScanResult {
  target: string;
  vulnerability: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss: number;
  status: string;
  cve: string;
}

/* ─── Mock Data ──────────────────────────────────── */

const MOCK_SCAN_RESULTS: ScanResult[] = [
  { target: 'web-prod-01', vulnerability: 'Apache Log4j2 RCE', severity: 'critical', cvss: 9.1, status: 'Open', cve: 'CVE-2026-1234' },
  { target: 'web-prod-01', vulnerability: 'SSRF via file upload', severity: 'high', cvss: 7.8, status: 'Open', cve: 'CVE-2026-1198' },
  { target: 'nginx-lb-02', vulnerability: 'Buffer overflow in Nginx', severity: 'high', cvss: 7.5, status: 'In Progress', cve: 'CVE-2026-1155' },
  { target: 'api-gateway-01', vulnerability: 'OpenSSL info disclosure', severity: 'medium', cvss: 6.5, status: 'Open', cve: 'CVE-2026-1055' },
  { target: 'db-master-01', vulnerability: 'MySQL privilege escalation', severity: 'medium', cvss: 5.3, status: 'Resolved', cve: 'CVE-2026-0892' },
  { target: 'cache-01', vulnerability: 'Redis unauthorized access', severity: 'high', cvss: 7.2, status: 'Open', cve: 'CVE-2026-0741' },
  { target: 'k8s-node-03', vulnerability: 'Container escape via runc', severity: 'critical', cvss: 9.8, status: 'Open', cve: 'CVE-2026-0672' },
  { target: 'web-prod-02', vulnerability: 'XSS stored in comments', severity: 'medium', cvss: 5.4, status: 'In Progress', cve: 'CVE-2026-0987' },
  { target: 'mail-server-01', vulnerability: 'Postfix SMTP smuggling', severity: 'high', cvss: 7.9, status: 'Open', cve: 'CVE-2026-1011' },
  { target: 'vpn-gateway', vulnerability: 'IPSec IKE weak DH group', severity: 'medium', cvss: 5.9, status: 'Resolved', cve: 'CVE-2026-0456' },
  { target: 'cd-server-01', vulnerability: 'Jenkins RCE via pipeline', severity: 'critical', cvss: 9.0, status: 'Open', cve: 'CVE-2026-0333' },
  { target: 'web-prod-01', vulnerability: 'Spring4Shell variant', severity: 'critical', cvss: 9.5, status: 'Open', cve: 'CVE-2026-0222' },
  { target: 'storage-01', vulnerability: 'S3 bucket misconfiguration', severity: 'high', cvss: 8.2, status: 'In Progress', cve: 'N/A' },
  { target: 'dns-server-01', vulnerability: 'DNS zone transfer allowed', severity: 'medium', cvss: 5.3, status: 'Resolved', cve: 'N/A' },
  { target: 'fw-core-01', vulnerability: 'Firewall rule shadowing', severity: 'low', cvss: 3.2, status: 'Open', cve: 'N/A' },
  { target: 'endpoint-42', vulnerability: 'Outdated Chrome version', severity: 'low', cvss: 4.1, status: 'Open', cve: 'CVE-2026-0188' },
  { target: 'db-replica-01', vulnerability: 'MongoDB NoSQL injection', severity: 'high', cvss: 7.6, status: 'Open', cve: 'N/A' },
  { target: 'web-staging', vulnerability: 'Debug mode enabled in production', severity: 'medium', cvss: 5.0, status: 'Resolved', cve: 'N/A' },
  { target: 'lb-frontend-01', vulnerability: 'HAProxy HTTP request smuggling', severity: 'high', cvss: 7.3, status: 'In Progress', cve: 'CVE-2026-1290' },
  { target: 'k8s-master', vulnerability: 'K8s API server anonymous access', severity: 'critical', cvss: 9.6, status: 'Open', cve: 'N/A' },
];

type SortField = 'target' | 'vulnerability' | 'severity' | 'cvss' | 'status';
type SortDir = 'asc' | 'desc';

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const PAGE_SIZE = 8;

/* ─── Component ──────────────────────────────────── */

@customElement('sc-scan-results-table')
export class ScScanResultsTable extends LitElement {

  static styles = css`
    :host {
      display: block;
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      color: #e2e8f0;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .scan-table-container {
      background: #111827;
      border-radius: 12px;
      padding: 20px;
    }

    .table-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
      gap: 12px;
      flex-wrap: wrap;
    }
    .table-toolbar h4 {
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .search-box {
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid #374151;
      background: #1f2937;
      color: #e2e8f0;
      font-size: 13px;
      width: 200px;
      outline: none;
    }
    .search-box:focus { border-color: #f59e0b; }
    .search-box::placeholder { color: #6b7280; }

    .filter-select {
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid #374151;
      background: #1f2937;
      color: #e2e8f0;
      font-size: 13px;
      outline: none;
      cursor: pointer;
    }
    .filter-select:focus { border-color: #f59e0b; }

    .results-count {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 12px;
    }

    /* Table */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    thead th {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 2px solid #374151;
      color: #94a3b8;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
    }
    thead th:hover { color: #f59e0b; }
    thead th.sorted { color: #f59e0b; }
    thead th .sort-arrow { margin-left: 4px; font-size: 10px; }

    tbody tr {
      border-bottom: 1px solid #1e293b;
      transition: background 0.15s;
    }
    tbody tr:hover { background: #1a1f2e; }
    tbody td {
      padding: 10px 12px;
      vertical-align: middle;
    }

    /* Severity Badge */
    .sev-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .sev-badge.critical { background: #450a0a; color: #fca5a5; }
    .sev-badge.high { background: #431407; color: #fdba74; }
    .sev-badge.medium { background: #422006; color: #fde047; }
    .sev-badge.low { background: #052e16; color: #86efac; }

    /* Status */
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 4px;
    }
    .status-badge.open { background: #450a0a; color: #fca5a5; }
    .status-badge.in-progress { background: #422006; color: #fde047; }
    .status-badge.resolved { background: #052e16; color: #86efac; }

    /* CVSS Score */
    .cvss-score {
      font-weight: 700;
      font-size: 14px;
    }
    .cvss-score.critical { color: #ef4444; }
    .cvss-score.high { color: #f97316; }
    .cvss-score.medium { color: #eab308; }
    .cvss-score.low { color: #22c55e; }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid #1e293b;
    }
    .page-info {
      font-size: 12px;
      color: #94a3b8;
    }
    .page-buttons {
      display: flex;
      gap: 4px;
    }
    .page-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid #374151;
      background: transparent;
      color: #e2e8f0;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s;
    }
    .page-btn:hover:not(:disabled) { border-color: #f59e0b; color: #f59e0b; }
    .page-btn.active { background: #f59e0b; color: #000; border-color: #f59e0b; font-weight: 700; }
    .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
  `;

  /* ─── State ──────────────────────────────────── */

  @state() private _searchQuery = '';
  @state() private _severityFilter = 'all';
  @state() private _statusFilter = 'all';
  @state() private _sortField: SortField = 'cvss';
  @state() private _sortDir: SortDir = 'desc';
  @state() private _currentPage = 1;

  /* ─── Computed ───────────────────────────────── */

  private get _filteredResults(): ScanResult[] {
    let results = [...MOCK_SCAN_RESULTS];

    // Global search
    if (this._searchQuery) {
      const q = this._searchQuery.toLowerCase();
      results = results.filter(r =>
        r.target.toLowerCase().includes(q) ||
        r.vulnerability.toLowerCase().includes(q) ||
        r.cve.toLowerCase().includes(q)
      );
    }

    // Severity filter
    if (this._severityFilter !== 'all') {
      results = results.filter(r => r.severity === this._severityFilter);
    }

    // Status filter
    if (this._statusFilter !== 'all') {
      const statusMap: Record<string, string> = {
        'open': 'Open',
        'in-progress': 'In Progress',
        'resolved': 'Resolved',
      };
      results = results.filter(r => r.status === statusMap[this._statusFilter]);
    }

    // Sorting
    results.sort((a, b) => {
      let cmp = 0;
      switch (this._sortField) {
        case 'target': cmp = a.target.localeCompare(b.target); break;
        case 'vulnerability': cmp = a.vulnerability.localeCompare(b.vulnerability); break;
        case 'severity': cmp = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]; break;
        case 'cvss': cmp = a.cvss - b.cvss; break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
      }
      return this._sortDir === 'asc' ? cmp : -cmp;
    });

    return results;
  }

  private get _totalPages(): number {
    return Math.max(1, Math.ceil(this._filteredResults.length / PAGE_SIZE));
  }

  private get _pageResults(): ScanResult[] {
    const start = (this._currentPage - 1) * PAGE_SIZE;
    return this._filteredResults.slice(start, start + PAGE_SIZE);
  }

  /* ─── Handlers ───────────────────────────────── */

  private _handleSearch(e: Event) {
    this._searchQuery = (e.target as HTMLInputElement).value;
    this._currentPage = 1;
  }

  private _handleSeverityFilter(e: Event) {
    this._severityFilter = (e.target as HTMLSelectElement).value;
    this._currentPage = 1;
  }

  private _handleStatusFilter(e: Event) {
    this._statusFilter = (e.target as HTMLSelectElement).value;
    this._currentPage = 1;
  }

  private _handleSort(field: SortField) {
    if (this._sortField === field) {
      this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this._sortField = field;
      this._sortDir = 'desc';
    }
  }

  private _cvssClass(cvss: number): string {
    if (cvss >= 9) return 'critical';
    if (cvss >= 7) return 'high';
    if (cvss >= 4) return 'medium';
    return 'low';
  }

  private _statusClass(status: string): string {
    if (status === 'Open') return 'open';
    if (status === 'In Progress') return 'in-progress';
    return 'resolved';
  }

  /* ─── Render ─────────────────────────────────── */

  render() {
    const results = this._filteredResults;
    const pageResults = this._pageResults;
    const start = (this._currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(this._currentPage * PAGE_SIZE, results.length);

    return html`
      <div class="scan-table-container">
        <div class="table-toolbar">
          <h4>🔍 Scan Results</h4>
          <div class="toolbar-controls">
            <input
              class="search-box"
              type="text"
              placeholder="Search target, vuln, CVE..."
              .value=${this._searchQuery}
              @input=${this._handleSearch}
            />
            <select class="filter-select" .value=${this._severityFilter} @change=${this._handleSeverityFilter}>
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select class="filter-select" .value=${this._statusFilter} @change=${this._handleStatusFilter}>
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div class="results-count">
          Showing ${results.length > 0 ? start : 0}–${end} of ${results.length} results
        </div>

        <table>
          <thead>
            <tr>
              <th class=${this._sortField === 'target' ? 'sorted' : ''} @click=${() => this._handleSort('target')}>
                Target ${this._sortField === 'target' ? html`<span class="sort-arrow">${this._sortDir === 'asc' ? '↑' : '↓'}</span>` : nothing}
              </th>
              <th class=${this._sortField === 'vulnerability' ? 'sorted' : ''} @click=${() => this._handleSort('vulnerability')}>
                Vulnerability ${this._sortField === 'vulnerability' ? html`<span class="sort-arrow">${this._sortDir === 'asc' ? '↑' : '↓'}</span>` : nothing}
              </th>
              <th class=${this._sortField === 'severity' ? 'sorted' : ''} @click=${() => this._handleSort('severity')}>
                Severity ${this._sortField === 'severity' ? html`<span class="sort-arrow">${this._sortDir === 'asc' ? '↑' : '↓'}</span>` : nothing}
              </th>
              <th class=${this._sortField === 'cvss' ? 'sorted' : ''} @click=${() => this._handleSort('cvss')}>
                CVSS ${this._sortField === 'cvss' ? html`<span class="sort-arrow">${this._sortDir === 'asc' ? '↑' : '↓'}</span>` : nothing}
              </th>
              <th class=${this._sortField === 'status' ? 'sorted' : ''} @click=${() => this._handleSort('status')}>
                Status ${this._sortField === 'status' ? html`<span class="sort-arrow">${this._sortDir === 'asc' ? '↑' : '↓'}</span>` : nothing}
              </th>
            </tr>
          </thead>
          <tbody>
            ${pageResults.map(r => html`
              <tr>
                <td>${r.target}</td>
                <td>${r.vulnerability}<br/><span style="font-size:11px;color:#6b7280">${r.cve}</span></td>
                <td><span class="sev-badge ${r.severity}">${r.severity}</span></td>
                <td><span class="cvss-score ${this._cvssClass(r.cvss)}">${r.cvss.toFixed(1)}</span></td>
                <td><span class="status-badge ${this._statusClass(r.status)}">${r.status === 'In Progress' ? '🔄' : r.status === 'Resolved' ? '✅' : '🔴'} ${r.status}</span></td>
              </tr>
            `)}
            ${results.length === 0 ? html`
              <tr><td colspan="5" style="text-align:center;padding:40px;color:#6b7280">No results match your filters</td></tr>
            ` : nothing}
          </tbody>
        </table>

        ${this._totalPages > 1 ? html`
          <div class="pagination">
            <div class="page-info">Page ${this._currentPage} of ${this._totalPages}</div>
            <div class="page-buttons">
              <button class="page-btn" ?disabled=${this._currentPage <= 1} @click=${() => this._currentPage--}>‹</button>
              ${Array.from({ length: this._totalPages }, (_, i) => i + 1).map(p => html`
                <button class="page-btn ${this._currentPage === p ? 'active' : ''}" @click=${() => this._currentPage = p}>${p}</button>
              `)}
              <button class="page-btn" ?disabled=${this._currentPage >= this._totalPages} @click=${() => this._currentPage++}>›</button>
            </div>
          </div>
        ` : nothing}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-scan-results-table': ScScanResultsTable;
  }
}
