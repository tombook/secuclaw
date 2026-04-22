/**
 * SecuClaw Cloud Security Posture Panel
 * Multi-cloud security posture management for AWS, Azure, and GCP
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

export interface CloudProvider {
  id: string; name: string; displayName: string; icon: string;
  status: string; postureScore: number; resources: number;
  alerts: number; criticalAlerts: number; compliance: number;
  misconfigurations: Misconfiguration[];
}

export interface Misconfiguration {
  id: string; rule: string; severity: string; resource: string;
  resourceType: string; region?: string; status: string;
  detectedAt: string; description: string; remediation: string;
  currentValue?: string; compliantValue?: string;
}

@customElement('sc-cloud-security-posture')
export class ScCloudSecurityPosture extends LitElement {
  static styles = css`
    :host { display: block; font-family: 'Inter', system-ui, sans-serif; color: var(--text-primary, #e2e8f0); }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .panel { background: var(--bg-primary, #111827); border-radius: 12px; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .title { font-size: 16px; font-weight: 700; }
    .overall-score { display: flex; align-items: center; gap: 20px; background: var(--bg-secondary, #1f2937); padding: 16px; border-radius: 12px; margin-bottom: 20px; }
    .score-circle { width: 70px; height: 70px; border-radius: 50%; background: conic-gradient(var(--c, #22c55e) calc(var(--s, 0) * 1%), #1e293b 0); display: flex; align-items: center; justify-content: center; }
    .score-inner { width: 56px; height: 56px; border-radius: 50%; background: var(--bg-secondary, #1f2937); display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .score-value { font-size: 18px; font-weight: 700; }
    .score-label { font-size: 8px; color: #94a3b8; text-transform: uppercase; }
    .provider-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
    .provider-tab { padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; background: var(--bg-secondary, #1f2937); border: 1px solid var(--border-color, #374151); transition: all 0.2s; }
    .provider-tab:hover { border-color: #3b82f6; }
    .provider-tab.active { background: #3b82f6; border-color: #3b82f6; color: white; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .stat-card { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 12px; text-align: center; }
    .stat-value { font-size: 20px; font-weight: 700; }
    .stat-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-top: 4px; }
    .misconfig-list { max-height: 350px; overflow-y: auto; }
    .misconfig-item { background: var(--bg-secondary, #1f2937); border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 4px solid; }
    .misconfig-item.critical { border-color: #ef4444; }
    .misconfig-item.high { border-color: #f97316; }
    .misconfig-item.medium { border-color: #eab308; }
    .misconfig-item.low { border-color: #3b82f6; }
    .misconfig-header { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .misconfig-rule { font-size: 13px; font-weight: 600; }
    .sev-badge { padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 600; text-transform: uppercase; }
    .sev-critical { background: #450a0a; color: #fca5a5; }
    .sev-high { background: #431407; color: #fdba74; }
    .sev-medium { background: #422006; color: #fde047; }
    .misconfig-meta { font-size: 11px; color: #94a3b8; margin-bottom: 6px; }
    .remediation { background: var(--bg-tertiary, #0a0e17); border-radius: 4px; padding: 8px; font-size: 11px; margin-top: 8px; color: #22c55e; }
    .btn { padding: 8px 14px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: 1px solid var(--border-color, #374151); background: var(--bg-secondary, #1f2937); color: var(--text-primary, #e2e8f0); }
    .btn.primary { background: #059669; border-color: #059669; color: white; }
    .compliance-bars { margin-top: 16px; }
    .compliance-item { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
    .compliance-label { width: 80px; font-size: 11px; }
    .compliance-bar { flex: 1; height: 6px; background: #1e293b; border-radius: 3px; overflow: hidden; }
    .compliance-fill { height: 100%; border-radius: 3px; }
    .compliance-value { width: 35px; text-align: right; font-size: 11px; font-weight: 600; }
  `;

  @state() private selectedProvider = 'all';
  @state() private severityFilter = 'all';

  private providers: CloudProvider[] = [
    { id: 'aws', name: 'aws', displayName: 'Amazon Web Services', icon: '☁️', status: 'connected', postureScore: 87, resources: 1247, alerts: 23, criticalAlerts: 3, compliance: 92,
      misconfigurations: [
        { id: 'aws-001', rule: 'S3 Bucket Public Access', severity: 'critical', resource: 'prod-data-bucket', resourceType: 'S3', region: 'us-east-1', status: 'open', detectedAt: '2024-04-18', description: 'S3 bucket allows public access', remediation: 'Enable "Block all public access"', currentValue: 'Public: ON', compliantValue: 'Public: OFF' },
        { id: 'aws-002', rule: 'MFA Not Enabled', severity: 'high', resource: 'iam-user-admin', resourceType: 'IAM User', status: 'open', detectedAt: '2024-04-17', description: 'Admin user lacks MFA', remediation: 'Enable virtual MFA', currentValue: 'MFA: OFF', compliantValue: 'MFA: ON' },
        { id: 'aws-003', rule: 'Security Group Open SSH', severity: 'medium', resource: 'sg-web', resourceType: 'Security Group', region: 'us-west-2', status: 'open', detectedAt: '2024-04-15', description: 'SSH open to internet', remediation: 'Restrict to specific IPs', currentValue: '0.0.0.0/0', compliantValue: '10.0.0.0/8' },
      ]},
    { id: 'azure', name: 'azure', displayName: 'Microsoft Azure', icon: '🔷', status: 'connected', postureScore: 91, resources: 892, alerts: 12, criticalAlerts: 1, compliance: 95,
      misconfigurations: [
        { id: 'az-001', rule: 'Storage HTTP Allowed', severity: 'high', resource: 'stgappdata001', resourceType: 'Storage', status: 'open', detectedAt: '2024-04-19', description: 'HTTPS not required', remediation: 'Enable secure transfer', currentValue: 'HTTPS: Optional', compliantValue: 'HTTPS: Required' },
        { id: 'az-002', rule: 'VM Disk Unencrypted', severity: 'medium', resource: 'vm-dev', resourceType: 'VM', status: 'open', detectedAt: '2024-04-17', description: 'VM disk not encrypted', remediation: 'Enable Azure Disk Encryption', currentValue: 'Encryption: OFF', compliantValue: 'Encryption: ON' },
      ]},
    { id: 'gcp', name: 'gcp', displayName: 'Google Cloud', icon: '🌥️', status: 'connected', postureScore: 84, resources: 654, alerts: 18, criticalAlerts: 2, compliance: 88,
      misconfigurations: [
        { id: 'gcp-001', rule: 'SQL Public IP', severity: 'critical', resource: 'sql-prod', resourceType: 'Cloud SQL', status: 'open', detectedAt: '2024-04-18', description: 'SQL has public IP', remediation: 'Remove public IP, use Private IP', currentValue: 'Public: Enabled', compliantValue: 'Public: Disabled' },
        { id: 'gcp-002', rule: 'Broad IAM Permissions', severity: 'high', resource: 'project-dev', resourceType: 'Project', status: 'open', detectedAt: '2024-04-16', description: 'Editor role assigned broadly', remediation: 'Apply least privilege', currentValue: 'Roles: Editor', compliantValue: 'Roles: Minimal' },
      ]}
  ];

  private complianceStandards = [
    { name: 'CIS', score: 85, color: '#3b82f6' },
    { name: 'PCI DSS', score: 92, color: '#22c55e' },
    { name: 'SOC 2', score: 88, color: '#eab308' },
    { name: 'GDPR', score: 94, color: '#8b5cf6' },
  ];

  private get overallScore(): number {
    return Math.round(this.providers.reduce((s, p) => s + p.postureScore, 0) / this.providers.length);
  }

  private get scoreColor(): string {
    return this.overallScore >= 90 ? '#22c55e' : this.overallScore >= 70 ? '#eab308' : '#ef4444';
  }

  private get filteredMisconfigs(): Misconfiguration[] {
    let all = this.providers.flatMap(p => p.misconfigurations);
    if (this.selectedProvider !== 'all') {
      const p = this.providers.find(p => p.id === this.selectedProvider);
      all = p ? p.misconfigurations : [];
    }
    if (this.severityFilter !== 'all') {
      all = all.filter(m => m.severity === this.severityFilter);
    }
    return all.sort((a, b) => {
      const o: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return o[a.severity] - o[b.severity];
    });
  }

  render() {
    const misconfigs = this.filteredMisconfigs;
    return html`
      <div class="panel">
        <div class="header">
          <h2 class="title">☁️ Cloud Security Posture</h2>
          <div style="display: flex; gap: 8px;">
            <button class="btn" @click=${() => {}}>🔄 Sync</button>
            <button class="btn primary" @click=${() => {}}>🛡️ Assess</button>
          </div>
        </div>

        <div class="overall-score">
          <div class="score-circle" style="--s: ${this.overallScore}; --c: ${this.scoreColor}">
            <div class="score-inner">
              <div class="score-value" style="color: ${this.scoreColor}">${this.overallScore}</div>
              <div class="score-label">Score</div>
            </div>
          </div>
          <div style="flex: 1;">
            <div style="font-size: 16px; font-weight: 700;">Overall Cloud Posture</div>
            <div style="font-size: 12px; color: #22c55e;">↑ 3.2% improvement</div>
          </div>
          <div style="display: flex; gap: 20px;">
            <div style="text-align: center;"><div style="font-size: 18px; font-weight: 700; color: #ef4444;">${this.providers.reduce((s, p) => s + p.criticalAlerts, 0)}</div><div style="font-size: 10px; color: #94a3b8;">Critical</div></div>
            <div style="text-align: center;"><div style="font-size: 18px; font-weight: 700;">${this.providers.reduce((s, p) => s + p.alerts, 0)}</div><div style="font-size: 10px; color: #94a3b8;">Alerts</div></div>
            <div style="text-align: center;"><div style="font-size: 18px; font-weight: 700;">${this.providers.reduce((s, p) => s + p.resources, 0)}</div><div style="font-size: 10px; color: #94a3b8;">Resources</div></div>
          </div>
        </div>

        <div class="provider-tabs">
          <button class="provider-tab ${this.selectedProvider === 'all' ? 'active' : ''}" @click=${() => this.selectedProvider = 'all'}>All</button>
          ${this.providers.map(p => html`<button class="provider-tab ${this.selectedProvider === p.id ? 'active' : ''}" @click=${() => this.selectedProvider = p.id}>${p.icon} ${p.name.toUpperCase()}</button>`)}
        </div>

        <div class="stats-grid">
          ${this.providers.map(p => html`
            <div class="stat-card">
              <div class="stat-value" style="color: ${p.postureScore >= 90 ? '#22c55e' : p.postureScore >= 70 ? '#eab308' : '#ef4444'}">${p.postureScore}%</div>
              <div class="stat-label">${p.icon} ${p.name.toUpperCase()}</div>
            </div>
          `)}
        </div>

        <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <h3 style="font-size: 13px; font-weight: 600;">🚨 Misconfigurations (${misconfigs.length})</h3>
          <div style="display: flex; gap: 6px;">
            <button class="btn" style="padding: 4px 8px; font-size: 10px;" @click=${() => this.severityFilter = 'all'}>All</button>
            <button class="btn" style="padding: 4px 8px; font-size: 10px; ${this.severityFilter === 'critical' ? 'border-color: #ef4444; color: #ef4444;' : ''}" @click=${() => this.severityFilter = 'critical'}>Critical</button>
            <button class="btn" style="padding: 4px 8px; font-size: 10px;" @click=${() => this.severityFilter = 'high'}>High</button>
            <button class="btn" style="padding: 4px 8px; font-size: 10px;" @click=${() => this.severityFilter = 'medium'}>Medium</button>
          </div>
        </div>

        <div class="misconfig-list">
          ${misconfigs.map(m => html`
            <div class="misconfig-item ${m.severity}">
              <div class="misconfig-header">
                <span class="misconfig-rule">${m.rule} <span class="sev-badge sev-${m.severity}">${m.severity}</span></span>
                <span style="font-size: 10px; color: ${m.status === 'resolved' ? '#22c55e' : '#94a3b8'};">${m.status}</span>
              </div>
              <div class="misconfig-meta">📦 ${m.resourceType}: ${m.resource} ${m.region ? `🌍 ${m.region}` : ''} • ${m.detectedAt}</div>
              <div style="font-size: 11px; color: #94a3b8; margin-bottom: 6px;">${m.description}</div>
              ${m.currentValue && m.compliantValue ? html`
                <div style="display: flex; gap: 16px; font-size: 10px;">
                  <span style="color: #ef4444;">Current: ${m.currentValue}</span>
                  <span style="color: #22c55e;">Expected: ${m.compliantValue}</span>
                </div>
              ` : ''}
              <div class="remediation">✅ ${m.remediation}</div>
            </div>
          `)}
        </div>

        <div class="compliance-bars">
          <h4 style="font-size: 13px; font-weight: 600; margin-bottom: 10px;">📋 Compliance Frameworks</h4>
          ${this.complianceStandards.map(std => html`
            <div class="compliance-item">
              <div class="compliance-label">${std.name}</div>
              <div class="compliance-bar"><div class="compliance-fill" style="width: ${std.score}%; background: ${std.color}"></div></div>
              <div class="compliance-value" style="color: ${std.color}">${std.score}%</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-cloud-security-posture': ScCloudSecurityPosture; } }
