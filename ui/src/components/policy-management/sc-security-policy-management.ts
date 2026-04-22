import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

/**
 * Security Policy Management Component
 * @element sc-security-policy-management
 */
@customElement('sc-security-policy-management')
export class ScSecurityPolicyManagement extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      --primary: #00ff88;
      --secondary: #00aaff;
      --danger: #ff4444;
      --warning: #ffaa00;
      --bg-dark: #0d1117;
      --bg-card: #161b22;
      --bg-hover: #21262d;
      --text-primary: #f0f6fc;
      --text-secondary: #8b949e;
      --border-color: #30363d;
    }

    * {
      box-sizing: border-box;
    }

    .container {
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      overflow: hidden;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
      background: linear-gradient(180deg, rgba(0,255,136,0.05) 0%, transparent 100%);
    }

    .header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header h2::before {
      content: '';
      width: 4px;
      height: 20px;
      background: var(--primary);
      border-radius: 2px;
    }

    .actions {
      display: flex;
      gap: 12px;
    }

    .btn {
      padding: 10px 18px;
      border-radius: 8px;
      border: none;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-primary {
      background: var(--primary);
      color: #000;
    }

    .btn-primary:hover {
      background: #00dd77;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0,255,136,0.3);
    }

    .btn-secondary {
      background: var(--bg-hover);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover {
      border-color: var(--secondary);
      background: rgba(0,170,255,0.1);
    }

    .search-bar {
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color);
    }

    .search-input {
      width: 100%;
      padding: 12px 16px 12px 44px;
      background: var(--bg-dark);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(0,255,136,0.1);
    }

    .search-input::placeholder {
      color: var(--text-secondary);
    }

    .search-wrapper {
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
    }

    .filters {
      display: flex;
      gap: 12px;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color);
      overflow-x: auto;
    }

    .filter-chip {
      padding: 8px 16px;
      border-radius: 20px;
      background: var(--bg-hover);
      color: var(--text-secondary);
      font-size: 13px;
      border: 1px solid transparent;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }

    .filter-chip:hover,
    .filter-chip.active {
      background: rgba(0,255,136,0.1);
      color: var(--primary);
      border-color: var(--primary);
    }

    .policy-list {
      max-height: 500px;
      overflow-y: auto;
    }

    .policy-item {
      display: grid;
      grid-template-columns: auto 1fr auto auto auto;
      align-items: center;
      gap: 16px;
      padding: 16px 24px;
      border-bottom: 1px solid var(--border-color);
      transition: background 0.2s;
    }

    .policy-item:hover {
      background: var(--bg-hover);
    }

    .policy-item:last-child {
      border-bottom: none;
    }

    .policy-status {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .policy-status.active {
      background: var(--primary);
      box-shadow: 0 0 8px var(--primary);
    }

    .policy-status.draft {
      background: var(--warning);
    }

    .policy-status.inactive {
      background: var(--text-secondary);
    }

    .policy-status.violated {
      background: var(--danger);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .policy-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .policy-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .policy-meta {
      font-size: 12px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .policy-badge {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge-critical {
      background: rgba(255,68,68,0.15);
      color: var(--danger);
    }

    .badge-high {
      background: rgba(255,170,0,0.15);
      color: var(--warning);
    }

    .badge-medium {
      background: rgba(0,170,255,0.15);
      color: var(--secondary);
    }

    .badge-low {
      background: rgba(0,255,136,0.15);
      color: var(--primary);
    }

    .policy-compliance {
      text-align: center;
    }

    .compliance-value {
      font-size: 16px;
      font-weight: 600;
    }

    .compliance-value.high {
      color: var(--primary);
    }

    .compliance-value.medium {
      color: var(--warning);
    }

    .compliance-value.low {
      color: var(--danger);
    }

    .compliance-label {
      font-size: 11px;
      color: var(--text-secondary);
    }

    .policy-actions {
      display: flex;
      gap: 8px;
    }

    .icon-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .icon-btn:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }

    .icon-btn:hover.delete {
      color: var(--danger);
      background: rgba(255,68,68,0.1);
    }

    .stats-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: var(--border-color);
      border-bottom: 1px solid var(--border-color);
    }

    .stat-item {
      background: var(--bg-card);
      padding: 16px 24px;
      text-align: center;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .stat-label {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .stat-item:nth-child(1) .stat-value { color: var(--primary); }
    .stat-item:nth-child(2) .stat-value { color: var(--warning); }
    .stat-item:nth-child(3) .stat-value { color: var(--danger); }
    .stat-item:nth-child(4) .stat-value { color: var(--secondary); }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }

    .modal {
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid var(--border-color);
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h3 {
      margin: 0;
      color: var(--text-primary);
      font-size: 18px;
    }

    .modal-body {
      padding: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      margin-bottom: 8px;
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 500;
    }

    .form-input,
    .form-select,
    .form-textarea {
      width: 100%;
      padding: 12px 16px;
      background: var(--bg-dark);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }

    .form-input:focus,
    .form-select:focus,
    .form-textarea:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(0,255,136,0.1);
    }

    .form-textarea {
      min-height: 100px;
      resize: vertical;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .empty-state {
      padding: 60px 24px;
      text-align: center;
      color: var(--text-secondary);
    }

    .empty-state svg {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      color: var(--text-primary);
    }

    @media (max-width: 768px) {
      .policy-item {
        grid-template-columns: auto 1fr;
        gap: 12px;
      }
      
      .policy-compliance,
      .policy-badge {
        display: none;
      }
      
      .stats-bar {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    /* Keyboard focus styles */
    .btn:focus-visible,
    .filter-chip:focus-visible,
    .icon-btn:focus-visible {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }

    /* Screen reader only */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `;

  @state() private policies = [
    {
      id: 1,
      name: 'Data Encryption Policy',
      category: 'Data Protection',
      severity: 'critical',
      status: 'active',
      compliance: 98,
      lastUpdated: '2024-01-15',
      violations: 2
    },
    {
      id: 2,
      name: 'Access Control Standards',
      category: 'Identity & Access',
      severity: 'critical',
      status: 'active',
      compliance: 95,
      lastUpdated: '2024-01-14',
      violations: 5
    },
    {
      id: 3,
      name: 'Network Segmentation Rules',
      category: 'Network Security',
      severity: 'high',
      status: 'active',
      compliance: 87,
      lastUpdated: '2024-01-13',
      violations: 12
    },
    {
      id: 4,
      name: 'Incident Response Protocol',
      category: 'Incident Response',
      severity: 'high',
      status: 'active',
      compliance: 92,
      lastUpdated: '2024-01-12',
      violations: 3
    },
    {
      id: 5,
      name: 'Password Complexity Requirements',
      category: 'Identity & Access',
      severity: 'medium',
      status: 'active',
      compliance: 100,
      lastUpdated: '2024-01-11',
      violations: 0
    },
    {
      id: 6,
      name: 'Cloud Security Baseline',
      category: 'Cloud Security',
      severity: 'high',
      status: 'draft',
      compliance: 45,
      lastUpdated: '2024-01-10',
      violations: 28
    },
    {
      id: 7,
      name: 'Endpoint Protection Standards',
      category: 'Endpoint Security',
      severity: 'high',
      status: 'active',
      compliance: 78,
      lastUpdated: '2024-01-09',
      violations: 15
    },
    {
      id: 8,
      name: 'Third-Party Risk Management',
      category: 'Vendor Risk',
      severity: 'medium',
      status: 'inactive',
      compliance: 62,
      lastUpdated: '2024-01-08',
      violations: 18
    },
    {
      id: 9,
      name: 'Security Awareness Training',
      category: 'Training & Awareness',
      severity: 'low',
      status: 'active',
      compliance: 85,
      lastUpdated: '2024-01-07',
      violations: 8
    },
    {
      id: 10,
      name: 'Malware Prevention Policy',
      category: 'Threat Protection',
      severity: 'critical',
      status: 'active',
      compliance: 94,
      lastUpdated: '2024-01-06',
      violations: 4
    }
  ];

  @state() private selectedFilter = 'all';
  @state() private searchQuery = '';
  @state() private showModal = false;
  @state() private modalMode: 'create' | 'edit' = 'create';

  @property({ type: String }) accessiblename = 'Security Policy Management Dashboard';

  private categories = [
    { id: 'all', label: 'All Policies' },
    { id: 'critical', label: 'Critical' },
    { id: 'high', label: 'High Priority' },
    { id: 'medium', label: 'Medium' },
    { id: 'low', label: 'Low' },
    { id: 'draft', label: 'Draft' }
  ];

  private get filteredPolicies() {
    return this.policies.filter(policy => {
      const matchesFilter = this.selectedFilter === 'all' || 
        policy.severity === this.selectedFilter || 
        policy.status === this.selectedFilter;
      const matchesSearch = policy.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        policy.category.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }

  private get totalStats() {
    return {
      active: this.policies.filter(p => p.status === 'active').length,
      draft: this.policies.filter(p => p.status === 'draft').length,
      violations: this.policies.reduce((sum, p) => sum + p.violations, 0),
      avgCompliance: Math.round(
        this.policies.reduce((sum, p) => sum + p.compliance, 0) / this.policies.length
      )
    };
  }

  private openModal(mode: 'create' | 'edit' = 'create') {
    this.modalMode = mode;
    this.showModal = true;
  }

  private closeModal() {
    this.showModal = false;
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      this.closeModal();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }

  private getComplianceClass(value: number) {
    if (value >= 90) return 'high';
    if (value >= 70) return 'medium';
    return 'low';
  }

  private getStatusClass(status: string) {
    if (status === 'active') return 'active';
    if (status === 'draft') return 'draft';
    if (status === 'inactive') return 'inactive';
    return 'active';
  }

  render() {
    return html`
      <div 
        class="container" 
        role="region" 
        aria-label="${this.accessiblename}"
        aria-describedby="policy-desc"
      >
        <span id="policy-desc" class="sr-only">
          Manage security policies, track compliance, and monitor violations
        </span>

        <div class="stats-bar" role="status" aria-live="polite">
          <div class="stat-item">
            <div class="stat-value">${this.totalStats.active}</div>
            <div class="stat-label">Active Policies</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${this.totalStats.draft}</div>
            <div class="stat-label">Draft</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${this.totalStats.violations}</div>
            <div class="stat-label">Total Violations</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${this.totalStats.avgCompliance}%</div>
            <div class="stat-label">Avg Compliance</div>
          </div>
        </div>

        <div class="header">
          <h2>Policy Management</h2>
          <div class="actions">
            <button 
              class="btn btn-secondary" 
              aria-label="Export policies"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
            <button 
              class="btn btn-primary" 
              @click=${() => this.openModal('create')}
              aria-label="Create new policy"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Policy
            </button>
          </div>
        </div>

        <div class="search-bar">
          <div class="search-wrapper">
            <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="search" 
              class="search-input" 
              placeholder="Search policies by name or category..."
              .value=${this.searchQuery}
              @input=${(e: Event) => this.searchQuery = (e.target as HTMLInputElement).value}
              aria-label="Search policies"
            />
          </div>
        </div>

        <div class="filters" role="tablist" aria-label="Filter policies">
          ${this.categories.map(cat => html`
            <button
              class="filter-chip ${this.selectedFilter === cat.id ? 'active' : ''}"
              role="tab"
              aria-selected=${this.selectedFilter === cat.id}
              @click=${() => this.selectedFilter = cat.id}
            >
              ${cat.label}
            </button>
          `)}
        </div>

        <div class="policy-list" role="list" aria-label="Security policies">
          ${this.filteredPolicies.length > 0 ? 
            this.filteredPolicies.map(policy => html`
              <div 
                class="policy-item" 
                role="listitem"
                tabindex="0"
                aria-label="${policy.name}, ${policy.severity} severity, ${policy.compliance}% compliant"
              >
                <div 
                  class="policy-status ${this.getStatusClass(policy.status)}" 
                  aria-label="Policy status: ${policy.status}"
                ></div>
                <div class="policy-info">
                  <span class="policy-name">${policy.name}</span>
                  <span class="policy-meta">
                    <span>${policy.category}</span>
                    <span>•</span>
                    <span>Updated ${policy.lastUpdated}</span>
                  </span>
                </div>
                <span class="policy-badge badge-${policy.severity}">
                  ${policy.severity}
                </span>
                <div class="policy-compliance">
                  <div class="compliance-value ${this.getComplianceClass(policy.compliance)}">
                    ${policy.compliance}%
                  </div>
                  <div class="compliance-label">Compliance</div>
                </div>
                <div class="policy-actions">
                  <button 
                    class="icon-btn" 
                    aria-label="Edit ${policy.name}"
                    title="Edit policy"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button 
                    class="icon-btn" 
                    aria-label="Delete ${policy.name}"
                    title="Delete policy"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            `) : html`
              <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <h3>No policies found</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            `
          }
        </div>

        ${this.showModal ? html`
          <div 
            class="modal-overlay" 
            @click=${(e: Event) => e.target === e.currentTarget && this.closeModal()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div class="modal">
              <div class="modal-header">
                <h3 id="modal-title">
                  ${this.modalMode === 'create' ? 'Create New Policy' : 'Edit Policy'}
                </h3>
                <button 
                  class="icon-btn" 
                  @click=${this.closeModal}
                  aria-label="Close modal"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              <div class="modal-body">
                <div class="form-group">
                  <label class="form-label" for="policy-name">Policy Name</label>
                  <input 
                    type="text" 
                    id="policy-name"
                    class="form-input" 
                    placeholder="Enter policy name"
                  />
                </div>
                <div class="form-group">
                  <label class="form-label" for="policy-category">Category</label>
                  <select id="policy-category" class="form-select">
                    <option value="">Select category</option>
                    <option value="data-protection">Data Protection</option>
                    <option value="identity-access">Identity & Access</option>
                    <option value="network-security">Network Security</option>
                    <option value="endpoint-security">Endpoint Security</option>
                    <option value="cloud-security">Cloud Security</option>
                    <option value="threat-protection">Threat Protection</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="policy-severity">Severity Level</label>
                  <select id="policy-severity" class="form-select">
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label" for="policy-description">Description</label>
                  <textarea 
                    id="policy-description"
                    class="form-textarea" 
                    placeholder="Describe the policy requirements..."
                  ></textarea>
                </div>
              </div>
              <div class="modal-footer">
                <button class="btn btn-secondary" @click=${this.closeModal}>
                  Cancel
                </button>
                <button class="btn btn-primary" @click=${this.closeModal}>
                  ${this.modalMode === 'create' ? 'Create Policy' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-security-policy-management': ScSecurityPolicyManagement;
  }
}
