# SPEC-04: Dashboard Page

> **Document Version**: 1.0  
> **Created**: 2026-03-08  
> **Purpose**: AI-Implementation-Ready Specification for SecuClaw Dashboard Page

---

## 1. Page Overview

### 1.1 Purpose
The Dashboard is the main landing page for SecuClaw, providing an at-a-glance view of the organization's security posture. It aggregates data from multiple security domains into actionable insights.

### 1.2 Primary Role
**CISO (Chief Information Security Officer)** - Strategic security governance

### 1.3 Secondary Role
**Security Expert** - Tactical security analysis

---

## 2. Component Structure

### 2.1 File Location
`ui/src/ui/pages/sc-dashboard.ts`

### 2.2 Component Definition

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { gatewayClient } from '../gateway-client.js';
import '../components/sc-skill-panel.js';
import '../components/sc-mitre-heatmap.js';
import '../components/sc-scf-dashboard.js';

interface DashboardStats {
  riskScore: number;
  riskTrend: 'up' | 'down' | 'stable';
  compliancePercentage: number;
  openIncidents: number;
  criticalVulnerabilities: number;
  activeThreats: number;
}

interface ComplianceStatus {
  framework: string;
  name: string;
  score: number;
  totalControls: number;
  passedControls: number;
}

interface RecentIncident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved';
  createdAt: number;
}

@customElement('sc-dashboard')
export class ScDashboard extends LitElement {
  private i18n = new I18nController(this);

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private stats: DashboardStats | null = null;

  @state()
  private complianceStatus: ComplianceStatus[] = [];

  @state()
  private recentIncidents: RecentIncident[] = [];

  @state()
  private selectedRole: string = 'ciso';

  static styles = css`
    :host {
      display: block;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-lg);
    }

    .page-title {
      font-size: var(--sc-font-size-2xl);
      font-weight: 600;
      color: var(--sc-text-primary);
    }

    .role-selector {
      padding: var(--sc-spacing-sm) var(--sc-spacing-md);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      background-color: var(--sc-input-bg);
      color: var(--sc-text-primary);
      font-size: var(--sc-font-size-sm);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--sc-spacing-md);
      margin-bottom: var(--sc-spacing-lg);
    }

    .stat-card {
      background-color: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-spacing-lg);
      transition: box-shadow var(--sc-transition-fast);
    }

    .stat-card:hover {
      box-shadow: var(--sc-shadow-md);
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-sm);
    }

    .stat-title {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
    }

    .stat-icon {
      font-size: 24px;
    }

    .stat-value {
      font-size: var(--sc-font-size-3xl);
      font-weight: 700;
      color: var(--sc-text-primary);
    }

    .stat-trend {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs);
      font-size: var(--sc-font-size-sm);
      margin-top: var(--sc-spacing-xs);
    }

    .stat-trend.up { color: var(--sc-error); }
    .stat-trend.down { color: var(--sc-success); }
    .stat-trend.stable { color: var(--sc-text-tertiary); }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--sc-spacing-lg);
    }

    @media (max-width: 1024px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    .panel {
      background-color: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-spacing-lg);
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-md);
      padding-bottom: var(--sc-spacing-sm);
      border-bottom: 1px solid var(--sc-border-color);
    }

    .panel-title {
      font-size: var(--sc-font-size-lg);
      font-weight: 600;
      color: var(--sc-text-primary);
    }

    .panel-link {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-primary);
      text-decoration: none;
    }

    .compliance-list {
      list-style: none;
    }

    .compliance-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--sc-spacing-sm) 0;
      border-bottom: 1px solid var(--sc-border-color);
    }

    .compliance-item:last-child {
      border-bottom: none;
    }

    .compliance-name {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-primary);
    }

    .compliance-score {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
    }

    .score-bar {
      width: 100px;
      height: 8px;
      background-color: var(--sc-bg-tertiary);
      border-radius: var(--sc-radius-full);
      overflow: hidden;
    }

    .score-fill {
      height: 100%;
      border-radius: var(--sc-radius-full);
      transition: width var(--sc-transition-normal);
    }

    .score-fill.high { background-color: var(--sc-success); }
    .score-fill.medium { background-color: var(--sc-warning); }
    .score-fill.low { background-color: var(--sc-error); }

    .incident-list {
      list-style: none;
    }

    .incident-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--sc-spacing-sm) 0;
      border-bottom: 1px solid var(--sc-border-color);
    }

    .incident-info {
      flex: 1;
    }

    .incident-title {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-primary);
    }

    .incident-meta {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
      margin-top: var(--sc-spacing-xs);
    }

    .severity-badge {
      padding: var(--sc-spacing-xs) var(--sc-spacing-sm);
      border-radius: var(--sc-radius-full);
      font-size: var(--sc-font-size-xs);
      font-weight: 500;
    }

    .severity-badge.critical {
      background-color: var(--sc-error-bg);
      color: var(--sc-error);
    }

    .severity-badge.high {
      background-color: var(--sc-warning-bg);
      color: var(--sc-warning);
    }

    .severity-badge.medium {
      background-color: var(--sc-info-bg);
      color: var(--sc-info);
    }

    .severity-badge.low {
      background-color: var(--sc-bg-tertiary);
      color: var(--sc-text-secondary);
    }

    .skill-panel-container {
      grid-column: 1 / -1;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }
  `;

  constructor() {
    super();
    this.loadDashboardData();
  }

  private async loadDashboardData() {
    this.loading = true;
    this.error = null;

    try {
      // Load all dashboard data in parallel
      const [stats, compliance, incidents] = await Promise.all([
        gatewayClient.request<DashboardStats>('dashboard.stats'),
        gatewayClient.request<ComplianceStatus[]>('dashboard.compliance'),
        gatewayClient.request<RecentIncident[]>('dashboard.recentIncidents'),
      ]);

      this.stats = stats;
      this.complianceStatus = compliance;
      this.recentIncidents = incidents;
      this.loading = false;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Failed to load dashboard';
      this.loading = false;
    }
  }

  private handleRoleChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    this.selectedRole = select.value;
  }

  private getScoreClass(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  private formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString();
  }

  private renderStatCard(title: string, value: number | string, icon: string, trend?: 'up' | 'down' | 'stable') {
    return html`
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-title">${title}</span>
          <span class="stat-icon">${icon}</span>
        </div>
        <div class="stat-value">${value}</div>
        ${trend
          ? html`
              <div class="stat-trend ${trend}">
                ${trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
                ${trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
              </div>
            `
          : ''}
      </div>
    `;
  }

  private renderCompliancePanel() {
    return html`
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">${this.i18n.t('nav.compliance')}</h3>
          <a href="/compliance" class="panel-link">${this.i18n.t('common.details')} →</a>
        </div>
        <ul class="compliance-list">
          ${this.complianceStatus.map(
            (item) => html`
              <li class="compliance-item">
                <span class="compliance-name">${item.name}</span>
                <div class="compliance-score">
                  <div class="score-bar">
                    <div
                      class="score-fill ${this.getScoreClass(item.score)}"
                      style="width: ${item.score}%"
                    ></div>
                  </div>
                  <span>${item.score}%</span>
                </div>
              </li>
            `
          )}
        </ul>
      </div>
    `;
  }

  private renderIncidentsPanel() {
    return html`
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">${this.i18n.t('nav.incidents')}</h3>
          <a href="/incidents" class="panel-link">${this.i18n.t('common.details')} →</a>
        </div>
        <ul class="incident-list">
          ${this.recentIncidents.map(
            (incident) => html`
              <li class="incident-item">
                <div class="incident-info">
                  <div class="incident-title">${incident.title}</div>
                  <div class="incident-meta">${this.formatDate(incident.createdAt)}</div>
                </div>
                <span class="severity-badge ${incident.severity}">${incident.severity}</span>
              </li>
            `
          )}
        </ul>
      </div>
    `;
  }

  private renderLoading() {
    return html`
      <div class="loading-container">
        <span>${this.i18n.t('common.loading')}</span>
      </div>
    `;
  }

  private renderError() {
    return html`
      <div class="error-container">
        <p>${this.error}</p>
        <button @click=${this.loadDashboardData}>${this.i18n.t('common.retry')}</button>
      </div>
    `;
  }

  render() {
    if (this.loading) return this.renderLoading();
    if (this.error) return this.renderError();

    return html`
      <div class="dashboard-header">
        <h1 class="page-title">${this.i18n.t('nav.dashboard')}</h1>
        <select class="role-selector" @change=${this.handleRoleChange} .value=${this.selectedRole}>
          <option value="ciso">${this.i18n.t('roles.ciso')}</option>
          <option value="security-expert">${this.i18n.t('roles.security-expert')}</option>
          <option value="security-ops">${this.i18n.t('roles.security-ops')}</option>
        </select>
      </div>

      <div class="stats-grid">
        ${this.renderStatCard('Risk Score', this.stats?.riskScore || 0, '📊', this.stats?.riskTrend)}
        ${this.renderStatCard('Compliance', `${this.stats?.compliancePercentage || 0}%`, '✅')}
        ${this.renderStatCard('Open Incidents', this.stats?.openIncidents || 0, '🚨')}
        ${this.renderStatCard('Critical Vulns', this.stats?.criticalVulnerabilities || 0, '🐛')}
      </div>

      <div class="dashboard-grid">
        ${this.renderCompliancePanel()}
        ${this.renderIncidentsPanel()}

        <div class="panel">
          <div class="panel-header">
            <h3 class="panel-title">MITRE ATT&CK Coverage</h3>
            <a href="/threats" class="panel-link">${this.i18n.t('common.details')} →</a>
          </div>
          <sc-mitre-heatmap></sc-mitre-heatmap>
        </div>

        <div class="panel">
          <div class="panel-header">
            <h3 class="panel-title">SCF Controls</h3>
            <a href="/knowledge-base" class="panel-link">${this.i18n.t('common.details')} →</a>
          </div>
          <sc-scf-dashboard></sc-scf-dashboard>
        </div>

        <div class="skill-panel-container">
          <sc-skill-panel .roleId=${this.selectedRole}></sc-skill-panel>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-dashboard': ScDashboard;
  }
}
```

---

## 3. Page Features

### 3.1 Statistics Cards

| Card | Description | Data Source |
|------|-------------|-------------|
| Risk Score | Overall security risk score (0-100) | `dashboard.stats` |
| Compliance | Compliance percentage across all frameworks | `dashboard.compliance` |
| Open Incidents | Count of unresolved security incidents | `dashboard.stats` |
| Critical Vulnerabilities | Count of critical severity vulnerabilities | `dashboard.stats` |

### 3.2 Compliance Panel

Shows compliance status for major frameworks:
- GDPR
- SOC 2
- ISO 27001
- NIST CSF
- PCI DSS

### 3.3 Recent Incidents Panel

Shows the 5 most recent security incidents with:
- Title
- Severity (Critical/High/Medium/Low)
- Creation date
- Quick link to details

### 3.4 MITRE ATT&CK Coverage

Heatmap showing coverage across MITRE tactics.

### 3.5 SCF Controls Dashboard

Overview of SCF control implementation status.

### 3.6 Role Skill Panel

Shows the capabilities of the selected role (CISO or Security Expert).

---

## 4. API Endpoints Required

### 4.1 WebSocket Methods

| Method | Description | Response |
|--------|-------------|----------|
| `dashboard.stats` | Get dashboard statistics | `DashboardStats` |
| `dashboard.compliance` | Get compliance status | `ComplianceStatus[]` |
| `dashboard.recentIncidents` | Get recent incidents | `RecentIncident[]` |

### 4.2 Response Types

```typescript
interface DashboardStats {
  riskScore: number;           // 0-100
  riskTrend: 'up' | 'down' | 'stable';
  compliancePercentage: number;
  openIncidents: number;
  criticalVulnerabilities: number;
  activeThreats: number;
}

interface ComplianceStatus {
  framework: string;
  name: string;
  score: number;              // 0-100
  totalControls: number;
  passedControls: number;
}

interface RecentIncident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved';
  createdAt: number;
}
```

---

## 5. UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────┐
│ Dashboard                                    [CISO ▼]               │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                    │
│ │Risk     │ │Compliance│ │Incidents│ │Critical │                    │
│ │  Score  │ │   85%   │ │    12   │ │  Vulns  │                    │
│ │   72    │ │         │ │         │ │    5    │                    │
│ │ ↓ Down  │ │         │ │         │ │         │                    │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                    │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌─────────────────────────┐            │
│ │ Compliance Status       │ │ Recent Incidents        │            │
│ │─────────────────────────│ │─────────────────────────│            │
│ │ GDPR      ████████░░ 85%│ │ 🔴 Critical: API breach │            │
│ │ SOC 2     ███████░░░ 75%│ │ 🟠 High: Malware detect │            │
│ │ ISO 27001 █████████░ 92%│ │ 🟡 Medium: Login fail   │            │
│ └─────────────────────────┘ └─────────────────────────┘            │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────┐ ┌─────────────────────────┐            │
│ │ MITRE ATT&CK Coverage   │ │ SCF Controls            │            │
│ │─────────────────────────│ │─────────────────────────│            │
│ │ [Heatmap Grid]          │ │ [Domain Progress Bars]  │            │
│ │                         │ │                         │            │
│ └─────────────────────────┘ └─────────────────────────┘            │
├─────────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────────┐  │
│ │ Role Skills Panel (CISO)                                      │  │
│ │───────────────────────────────────────────────────────────────│  │
│ │ Light: Strategic planning, Risk management, Compliance...    │  │
│ │ Dark: Compliance testing, Audit simulation...                │  │
│ │ MITRE: 11/14 tactics  |  SCF: 17/20 domains                  │  │
│ └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Integration Points

### 6.1 Navigation
- Sidebar link to `/` (active by default)
- Links to `/compliance`, `/incidents`, `/threats`, `/knowledge-base` from panels

### 6.2 State Management
- Uses `uiStore` for theme/locale
- Uses `commanderStore` for role selection
- Uses `skillStore` for role capabilities

### 6.3 Real-time Updates
- Subscribe to `incident.created`, `incident.updated` events
- Subscribe to `compliance.updated` events
- Update stats without full page refresh

---

## 7. Responsive Design

| Breakpoint | Layout |
|------------|--------|
| > 1024px | 2-column grid for panels |
| 768-1024px | Single column, stacked panels |
| < 768px | Cards become full-width, simplified view |

---

*End of SPEC-04: Dashboard Page*
