/**
 * sc-vendor-risk-assessment - Third-Party Vendor Risk Assessment
 * Comprehensive vendor risk management and assessment tracking
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-vendor-risk-assessment')
export class ScVendorRiskAssessment extends LitElement {
  static styles = css`
    :host { display: block; --primary: #00ff88; --secondary: #00aaff; --danger: #ff4444; --warning: #ffaa00; --success: #10b981; --purple: #a855f7; --bg-dark: #0a0e17; --bg-card: #141b26; --bg-card-hover: #1a2536; --text-primary: #ffffff; --text-secondary: #8899aa; --border: #2a3a4a; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-dark); min-height: 100vh; color: var(--text-primary); padding: 24px; font-family: 'Inter', system-ui, sans-serif; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .title { font-size: 24px; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 12px; }
    .header-actions { display: flex; gap: 12px; }
    .btn { padding: 10px 20px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-primary); font-size: 13px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px; }
    .btn:hover { background: var(--bg-card-hover); border-color: var(--primary); }
    .btn-primary { background: linear-gradient(135deg, var(--primary), #00cc6a); color: var(--bg-dark); border: none; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px; }
    .stat-card { background: var(--bg-card); border-radius: 12px; padding: 20px; border: 1px solid var(--border); text-align: center; }
    .stat-icon { font-size: 32px; margin-bottom: 12px; }
    .stat-value { font-size: 32px; font-weight: 700; }
    .stat-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; margin-top: 4px; }
    .main-content { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    .card { background: var(--bg-card); border-radius: 12px; padding: 20px; border: 1px solid var(--border); margin-bottom: 20px; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
    .card-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .vendor-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .vendor-table th { text-align: left; padding: 12px 8px; color: var(--text-secondary); text-transform: uppercase; font-size: 11px; border-bottom: 1px solid var(--border); }
    .vendor-table td { padding: 14px 8px; border-bottom: 1px solid var(--border); }
    .vendor-table tr:hover td { background: var(--bg-card-hover); }
    .vendor-info { display: flex; align-items: center; gap: 12px; }
    .vendor-logo { width: 36px; height: 36px; border-radius: 8px; background: var(--bg-dark); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; }
    .vendor-name { font-weight: 600; }
    .vendor-type { font-size: 11px; color: var(--text-secondary); }
    .risk-score { display: flex; align-items: center; gap: 8px; }
    .score-bar { width: 60px; height: 6px; background: var(--bg-dark); border-radius: 3px; overflow: hidden; }
    .score-fill { height: 100%; border-radius: 3px; }
    .score-value { font-weight: 600; min-width: 30px; }
    .badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .badge-critical { background: rgba(255,68,68,0.2); color: var(--danger); }
    .badge-high { background: rgba(255,170,0,0.2); color: var(--warning); }
    .badge-medium { background: rgba(0,170,255,0.2); color: var(--secondary); }
    .badge-low { background: rgba(0,255,136,0.2); color: var(--success); }
    .status-badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
    .status-approved { background: rgba(0,255,136,0.2); color: var(--success); }
    .status-review { background: rgba(255,170,0,0.2); color: var(--warning); }
    .status-pending { background: rgba(170,170,200,0.2); color: var(--text-secondary); }
    .risk-factors { display: flex; flex-direction: column; gap: 12px; }
    .factor-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-dark); border-radius: 8px; }
    .factor-name { font-size: 13px; }
    .factor-impact { font-size: 12px; padding: 3px 8px; border-radius: 4px; font-weight: 600; }
    .impact-high { background: rgba(255,68,68,0.2); color: var(--danger); }
    .impact-medium { background: rgba(255,170,0,0.2); color: var(--warning); }
    .impact-low { background: rgba(0,255,136,0.2); color: var(--success); }
    .compliance-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .compliance-item { background: var(--bg-dark); border-radius: 8px; padding: 14px; text-align: center; }
    .compliance-icon { font-size: 24px; margin-bottom: 8px; }
    .compliance-name { font-size: 12px; color: var(--text-secondary); }
    .assessment-form { display: flex; flex-direction: column; gap: 16px; }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    .form-input, .form-select, .form-textarea { padding: 10px 14px; background: var(--bg-dark); border: 1px solid var(--border); border-radius: 8px; color: var(--text-primary); font-size: 14px; font-family: inherit; }
    .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: var(--primary); }
    .form-textarea { resize: vertical; min-height: 80px; }
    .tabs { display: flex; gap: 4px; margin-bottom: 20px; }
    .tab { padding: 10px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; color: var(--text-secondary); font-size: 13px; cursor: pointer; transition: all 0.2s; }
    .tab:hover { color: var(--text-primary); }
    .tab.active { background: var(--primary); color: var(--bg-dark); border-color: var(--primary); }
    @media (max-width: 1200px) { .main-content { grid-template-columns: 1fr; } .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr; } }
  `;

  @state() private activeTab: 'vendors' | 'assessments' | 'questionnaire' = 'vendors';

  private stats = [
    { icon: '🏢', value: '47', label: 'Active Vendors', color: 'var(--primary)' },
    { icon: '⚠️', value: '12', label: 'High Risk', color: 'var(--danger)' },
    { icon: '📋', value: '23', label: 'Pending Review', color: 'var(--warning)' },
    { icon: '✓', value: '35', label: 'Approved', color: 'var(--success)' },
  ];

  private vendors = [
    { name: 'Cloudflare', type: 'Security', logo: 'CF', risk: 15, status: 'approved', lastAssess: '2024-01-15', critical: false },
    { name: 'AWS', type: 'Cloud Provider', logo: 'AW', risk: 25, status: 'approved', lastAssess: '2024-02-01', critical: true },
    { name: 'Okta', type: 'IAM Provider', logo: 'OK', risk: 18, status: 'approved', lastAssess: '2024-01-20', critical: true },
    { name: 'GitHub', type: 'Development', logo: 'GH', risk: 35, status: 'review', lastAssess: '2024-02-10', critical: false },
    { name: 'Stripe', type: 'Payment', logo: 'ST', risk: 22, status: 'approved', lastAssess: '2024-01-25', critical: true },
    { name: 'Datadog', type: 'Monitoring', logo: 'DD', risk: 28, status: 'pending', lastAssess: '2024-02-15', critical: false },
  ];

  private riskFactors = [
    { name: 'Data Access Level', impact: 'high', value: 'Full DB Access' },
    { name: 'Security Certifications', impact: 'medium', value: 'SOC2, ISO27001' },
    { name: 'Incident Response', impact: 'high', value: '24/7 Support' },
    { name: 'Data Retention', impact: 'medium', value: '90 Days' },
    { name: 'Sub-processor Count', impact: 'low', value: '3 Approved' },
  ];

  private complianceStandards = [
    { name: 'SOC 2', icon: '🔒', status: '✓' },
    { name: 'ISO 27001', icon: '📋', status: '✓' },
    { name: 'GDPR', icon: '🇪🇺', status: '✓' },
    { name: 'HIPAA', icon: '🏥', status: '○' },
  ];

  private getRiskColor(score: number): string {
    if (score >= 60) return 'var(--danger)';
    if (score >= 40) return 'var(--warning)';
    return 'var(--success)';
  }

  private getRiskBadge(risk: number): string {
    if (risk >= 60) return 'critical';
    if (risk >= 40) return 'high';
    if (risk >= 20) return 'medium';
    return 'low';
  }

  render() {
    return html`
      <div class="panel" role="main" aria-label="Vendor Risk Assessment">
        <header class="header">
          <h1 class="title"><span>🏢</span> Vendor Risk Assessment</h1>
          <div class="header-actions">
            <button class="btn">📊 Generate Report</button>
            <button class="btn btn-primary">+ Add Vendor</button>
          </div>
        </header>

        <div class="stats-grid" role="status">
          ${this.stats.map(s => html`
            <div class="stat-card">
              <div class="stat-icon">${s.icon}</div>
              <div class="stat-value" style="color: ${s.color}">${s.value}</div>
              <div class="stat-label">${s.label}</div>
            </div>
          `)}
        </div>

        <div class="tabs">
          <button class="tab ${this.activeTab === 'vendors' ? 'active' : ''}" @click=${() => this.activeTab = 'vendors'}>Vendor List</button>
          <button class="tab ${this.activeTab === 'assessments' ? 'active' : ''}" @click=${() => this.activeTab = 'assessments'}>Risk Assessments</button>
          <button class="tab ${this.activeTab === 'questionnaire' ? 'active' : ''}" @click=${() => this.activeTab = 'questionnaire'}>Questionnaire</button>
        </div>

        ${this.activeTab === 'vendors' ? html`
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Third-Party Vendors</h2>
              <input type="text" class="form-input" style="width: 250px;" placeholder="Search vendors..." />
            </div>
            <table class="vendor-table" role="table">
              <thead>
                <tr>
                  <th scope="col">Vendor</th>
                  <th scope="col">Type</th>
                  <th scope="col">Risk Score</th>
                  <th scope="col">Status</th>
                  <th scope="col">Last Assessment</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${this.vendors.map(v => html`
                  <tr>
                    <td>
                      <div class="vendor-info">
                        <div class="vendor-logo">${v.logo}</div>
                        <div>
                          <div class="vendor-name">${v.name} ${v.critical ? '⭐' : ''}</div>
                          <div class="vendor-type">${v.type}</div>
                        </div>
                      </div>
                    </td>
                    <td>${v.type}</td>
                    <td>
                      <div class="risk-score">
                        <div class="score-bar">
                          <div class="score-fill" style="width: ${v.risk}%; background: ${this.getRiskColor(v.risk)}"></div>
                        </div>
                        <span class="score-value" style="color: ${this.getRiskColor(v.risk)}">${v.risk}</span>
                      </div>
                    </td>
                    <td>
                      <span class="badge badge-${this.getRiskBadge(v.risk)}">${this.getRiskBadge(v.risk)}</span>
                      <span class="status-badge status-${v.status}">${v.status}</span>
                    </td>
                    <td>${v.lastAssess}</td>
                    <td>
                      <button class="btn" style="padding: 4px 10px; font-size: 11px;">Assess</button>
                      <button class="btn" style="padding: 4px 10px; font-size: 11px;">View</button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${this.activeTab === 'assessments' ? html`
          <div class="main-content">
            <div class="card">
              <div class="card-header"><h2 class="card-title">Risk Factor Analysis</h2></div>
              <div class="risk-factors">
                ${this.riskFactors.map(f => html`
                  <div class="factor-item">
                    <div>
                      <div class="factor-name">${f.name}</div>
                      <div style="font-size: 11px; color: var(--text-secondary);">${f.value}</div>
                    </div>
                    <span class="factor-impact impact-${f.impact}">${f.impact}</span>
                  </div>
                `)}
              </div>
            </div>
            <aside>
              <div class="card">
                <div class="card-header"><h2 class="card-title">Compliance Status</h2></div>
                <div class="compliance-grid">
                  ${this.complianceStandards.map(c => html`
                    <div class="compliance-item">
                      <div class="compliance-icon">${c.icon}</div>
                      <div class="compliance-name">${c.name}</div>
                      <div style="color: ${c.status === '✓' ? 'var(--success)' : 'var(--text-secondary)'}; font-size: 14px;">${c.status}</div>
                    </div>
                  `)}
                </div>
              </div>
            </aside>
          </div>
        ` : ''}

        ${this.activeTab === 'questionnaire' ? html`
          <div class="card">
            <div class="card-header"><h2 class="card-title">Security Assessment Questionnaire</h2></div>
            <div class="assessment-form">
              <div class="form-group">
                <label class="form-label">Vendor Name</label>
                <input type="text" class="form-input" placeholder="Enter vendor name" />
              </div>
              <div class="form-group">
                <label class="form-label">Data Handling Practices</label>
                <select class="form-select">
                  <option>Select assessment...</option>
                  <option>Full encryption at rest and in transit</option>
                  <option>Encryption in transit only</option>
                  <option>No encryption specified</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Security Certifications</label>
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                  ${['SOC 2', 'ISO 27001', 'PCI-DSS', 'HIPAA', 'GDPR'].map(cert => html`
                    <label style="display: flex; align-items: center; gap: 6px; font-size: 13px; cursor: pointer;">
                      <input type="checkbox" /> ${cert}
                    </label>
                  `)}
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Additional Notes</label>
                <textarea class="form-textarea" placeholder="Add any additional assessment notes..."></textarea>
              </div>
              <button class="btn btn-primary" style="align-self: flex-start;">Submit Assessment</button>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-vendor-risk-assessment': ScVendorRiskAssessment; } }
