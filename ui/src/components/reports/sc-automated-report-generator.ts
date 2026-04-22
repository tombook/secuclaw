/**
 * SecuClaw Automated Report Generator
 * Multi-format report generation with templates and scheduling
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-automated-report-generator')
export class ScAutomatedReportGenerator extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #111827); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; margin-bottom: 16px; }
    .title { font-size: 16px; font-weight: 700; }
    .templates-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
    .template-card { background: var(--bg-secondary, #1f2937); border: 1px solid #374151; border-radius: 8px; padding: 16px; cursor: pointer; transition: all 0.2s; text-align: center; }
    .template-card:hover { border-color: #3b82f6; transform: translateY(-2px); }
    .template-card.selected { border-color: #3b82f6; background: #1e3a5f; }
    .template-icon { font-size: 32px; margin-bottom: 8px; }
    .template-name { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
    .template-desc { font-size: 11px; color: #94a3b8; }
    .options-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .option-group { flex: 1; }
    .option-label { font-size: 11px; color: #94a3b8; text-transform: uppercase; margin-bottom: 6px; }
    .select-input { width: 100%; padding: 10px 12px; border-radius: 6px; border: 1px solid #374151; background: var(--bg-secondary, #1f2937); color: #e2e8f0; font-size: 13px; }
    .schedule-row { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 14px; margin-bottom: 16px; }
    .schedule-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .toggle { position: relative; width: 44px; height: 24px; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-slider { position: absolute; cursor: pointer; inset: 0; background: #374151; border-radius: 12px; transition: 0.3s; }
    .toggle-slider::before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
    .toggle input:checked + .toggle-slider { background: #3b82f6; }
    .toggle input:checked + .toggle-slider::before { transform: translateX(20px); }
    .schedule-options { display: flex; gap: 12px; flex-wrap: wrap; }
    .schedule-option { padding: 6px 12px; border-radius: 4px; font-size: 11px; background: var(--bg-tertiary, #0a0e17); border: 1px solid #374151; cursor: pointer; }
    .schedule-option.selected { border-color: #3b82f6; background: #1e3a5f; }
    .jobs-list { max-height: 300px; overflow-y: auto; }
    .job-item { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 12px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; }
    .job-info { flex: 1; }
    .job-name { font-size: 13px; font-weight: 600; }
    .job-meta { font-size: 11px; color: #94a3b8; margin-top: 2px; }
    .job-status { padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; }
    .job-status.pending { background: #1e3a5f; color: #93c5fd; }
    .job-status.completed { background: #052e16; color: #86efac; }
    .job-status.failed { background: #450a0a; color: #fca5a5; }
    .job-actions { display: flex; gap: 6px; }
    .btn { padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid #374151; background: var(--bg-secondary, #1f2937); color: #e2e8f0; }
    .btn.primary { background: #059669; border-color: #059669; color: white; }
    .btn.sm { padding: 4px 8px; font-size: 10px; }
    .filters { display: flex; gap: 8px; margin-bottom: 12px; }
    .filter-btn { padding: 6px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; background: var(--bg-secondary, #1f2937); border: 1px solid #374151; }
    .filter-btn.active { background: #3b82f6; border-color: #3b82f6; color: white; }
  `;

  @state() private selectedTemplate = 'exec-summary';
  @state() private format = 'pdf';
  @state() private scheduleEnabled = false;
  @state() private scheduleFrequency = 'weekly';
  @state() private filter = 'all';
  @state() private jobs: any[] = [
    { id: 'job-001', template: 'Executive Summary', format: 'PDF', status: 'completed', created: '2024-04-20 08:00', fileSize: '2.4 MB' },
    { id: 'job-002', template: 'Incident Report', format: 'PDF', status: 'completed', created: '2024-04-19 08:00', fileSize: '1.8 MB' },
    { id: 'job-003', template: 'Compliance Audit', format: 'XLSX', status: 'processing', created: '2024-04-20 14:30', progress: 65 },
    { id: 'job-004', template: 'Threat Analysis', format: 'JSON', status: 'pending', created: '2024-04-20 15:00' },
    { id: 'job-005', template: 'Vulnerability Report', format: 'PDF', status: 'failed', created: '2024-04-18 08:00', error: 'Connection timeout' },
  ];

  private templates = [
    { id: 'exec-summary', name: 'Executive Summary', icon: '📊', desc: 'High-level metrics for leadership' },
    { id: 'incident-report', name: 'Incident Report', icon: '🚨', desc: 'Detailed incident analysis' },
    { id: 'compliance-audit', name: 'Compliance Audit', icon: '✅', desc: 'Framework compliance status' },
    { id: 'threat-analysis', name: 'Threat Analysis', icon: '🎯', desc: 'IOCs and threat intel' },
    { id: 'vuln-report', name: 'Vulnerability Report', icon: '🔍', desc: 'Vulnerability findings' },
    { id: 'full-security', name: 'Full Security Review', icon: '🛡️', desc: 'Comprehensive security report' },
  ];

  private get filteredJobs() {
    if (this.filter === 'all') return this.jobs;
    return this.jobs.filter(j => j.status === this.filter);
  }

  render() {
    return html`
      <div class="panel">
        <div class="header">
          <h2 class="title">📄 Automated Report Generator</h2>
          <button class="btn primary" @click=${() => {}}>Generate Report</button>
        </div>

        <h3 style="font-size: 13px; font-weight: 600; margin-bottom: 12px;">Report Templates</h3>
        <div class="templates-grid">
          ${this.templates.map(t => html`
            <div class="template-card ${this.selectedTemplate === t.id ? 'selected' : ''}" @click=${() => this.selectedTemplate = t.id}>
              <div class="template-icon">${t.icon}</div>
              <div class="template-name">${t.name}</div>
              <div class="template-desc">${t.desc}</div>
            </div>
          `)}
        </div>

        <div class="options-row">
          <div class="option-group">
            <div class="option-label">Format</div>
            <select class="select-input" .value=${this.format} @change=${(e: Event) => this.format = (e.target as HTMLSelectElement).value}>
              <option value="pdf">PDF Document</option>
              <option value="xlsx">Excel Spreadsheet</option>
              <option value="csv">CSV Data</option>
              <option value="json">JSON Data</option>
              <option value="html">HTML Report</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>
          <div class="option-group">
            <div class="option-label">Date Range</div>
            <select class="select-input">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
              <option>Custom range</option>
            </select>
          </div>
          <div class="option-group">
            <div class="option-label">Destination</div>
            <select class="select-input">
              <option>Download</option>
              <option>Email</option>
              <option>S3 Bucket</option>
              <option>SharePoint</option>
            </select>
          </div>
        </div>

        <div class="schedule-row">
          <div class="schedule-header">
            <div>
              <div style="font-size: 13px; font-weight: 600;">📅 Schedule Report</div>
              <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Automatically generate reports on a schedule</div>
            </div>
            <label class="toggle">
              <input type="checkbox" .checked=${this.scheduleEnabled} @change=${(e: Event) => this.scheduleEnabled = (e.target as HTMLInputElement).checked} />
              <span class="toggle-slider"></span>
            </label>
          </div>
          ${this.scheduleEnabled ? html`
            <div class="schedule-options">
              <button class="schedule-option ${this.scheduleFrequency === 'daily' ? 'selected' : ''}" @click=${() => this.scheduleFrequency = 'daily'}>Daily</button>
              <button class="schedule-option ${this.scheduleFrequency === 'weekly' ? 'selected' : ''}" @click=${() => this.scheduleFrequency = 'weekly'}>Weekly</button>
              <button class="schedule-option ${this.scheduleFrequency === 'monthly' ? 'selected' : ''}" @click=${() => this.scheduleFrequency = 'monthly'}>Monthly</button>
              <button class="schedule-option ${this.scheduleFrequency === 'quarterly' ? 'selected' : ''}" @click=${() => this.scheduleFrequency = 'quarterly'}>Quarterly</button>
            </div>
          ` : ''}
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h3 style="font-size: 13px; font-weight: 600;">Recent Reports</h3>
          <div class="filters">
            <button class="filter-btn ${this.filter === 'all' ? 'active' : ''}" @click=${() => this.filter = 'all'}>All</button>
            <button class="filter-btn ${this.filter === 'completed' ? 'active' : ''}" @click=${() => this.filter = 'completed'}>Completed</button>
            <button class="filter-btn ${this.filter === 'pending' ? 'active' : ''}" @click=${() => this.filter = 'pending'}>Pending</button>
            <button class="filter-btn ${this.filter === 'failed' ? 'active' : ''}" @click=${() => this.filter = 'failed'}>Failed</button>
          </div>
        </div>

        <div class="jobs-list">
          ${this.filteredJobs.map(job => html`
            <div class="job-item">
              <div class="job-info">
                <div class="job-name">${job.template} <span style="font-size: 10px; color: #94a3b8;">(${job.format})</span></div>
                <div class="job-meta">Created: ${job.created} ${job.fileSize ? `• ${job.fileSize}` : ''} ${job.progress ? `• ${job.progress}%` : ''} ${job.error ? `• ❌ ${job.error}` : ''}</div>
              </div>
              <div class="job-status ${job.status}">${job.status}</div>
              <div class="job-actions">
                ${job.status === 'completed' ? html`<button class="btn sm">📥 Download</button>` : ''}
                ${job.status === 'failed' ? html`<button class="btn sm">🔄 Retry</button>` : ''}
                <button class="btn sm">🗑️</button>
              </div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-automated-report-generator': ScAutomatedReportGenerator; } }
