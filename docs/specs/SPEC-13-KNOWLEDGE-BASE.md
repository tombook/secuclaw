# SPEC-13: Knowledge Base Page

> **Document Version**: 1.0  
> **Created**: 2026-03-08  
> **Purpose**: AI-Implementation-Ready Specification for SecuClaw Knowledge Base Page

---

## 1. Page Overview

### 1.1 Purpose
The Knowledge Base page provides browse and search functionality for MITRE ATT&CK and SCF (Secure Controls Framework) data. Users can explore tactics, techniques, controls, and domains.

### 1.2 Data Sources
- **MITRE ATT&CK**: `data/mitre/attack-stix-data/enterprise-attack.json`, `mobile-attack.json`, `ics-attack.json`
- **SCF**: `data/scf/scf-20254.json`, `scf-domains-principles.json`

---

## 2. Component Structure

**File**: `ui/src/ui/pages/sc-knowledge-base.ts`

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { gatewayClient } from '../gateway-client.js';

interface MitreTactic {
  id: string;
  external_id: string;
  name: string;
  description: string;
  shortname: string;
}

interface MitreTechnique {
  id: string;
  external_id: string;
  name: string;
  description: string;
  tactics: string[];
  platforms: string[];
}

interface ScfDomain {
  id: string;
  scfIdentifier: string;
  name: string;
  description: string;
}

interface ScfControl {
  id: string;
  scfNumber: string;
  name: string;
  description: string;
  domain: string;
  category: string;
}

interface MitreStats {
  techniques: number;
  tactics: number;
  enterprise: number;
  mobile: number;
  ics: number;
}

interface ScfStats {
  controls: number;
  domains: number;
  categories: string[];
}

@customElement('sc-knowledge-base')
export class ScKnowledgeBase extends LitElement {
  private i18n = new I18nController(this);

  @state()
  private activeTab: 'mitre' | 'scf' = 'mitre';

  @state()
  private searchQuery: string = '';

  @state()
  private mitreStats: MitreStats | null = null;

  @state()
  private mitreTactics: MitreTactic[] = [];

  @state()
  private mitreTechniques: MitreTechnique[] = [];

  @state()
  private scfStats: ScfStats | null = null;

  @state()
  private scfDomains: ScfDomain[] = [];

  @state()
  private scfControls: ScfControl[] = [];

  @state()
  private searchResults: any[] = [];

  @state()
  private loading: boolean = true;

  static styles = css`
    :host {
      display: block;
    }

    .page-header {
      margin-bottom: var(--sc-spacing-lg);
    }

    .page-title {
      font-size: var(--sc-font-size-2xl);
      font-weight: 600;
      color: var(--sc-text-primary);
    }

    .page-subtitle {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
      margin-top: var(--sc-spacing-xs);
    }

    /* Tabs */
    .tabs {
      display: flex;
      gap: var(--sc-spacing-sm);
      margin-bottom: var(--sc-spacing-lg);
    }

    .tab {
      padding: var(--sc-spacing-md) var(--sc-spacing-xl);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      background-color: var(--sc-bg-card);
      color: var(--sc-text-secondary);
      font-size: var(--sc-font-size-sm);
      cursor: pointer;
      transition: all var(--sc-transition-fast);
    }

    .tab:hover {
      background-color: var(--sc-bg-hover);
    }

    .tab.active {
      background-color: var(--sc-primary);
      color: white;
      border-color: var(--sc-primary);
    }

    /* Search */
    .search-container {
      margin-bottom: var(--sc-spacing-lg);
    }

    .search-input {
      width: 100%;
      max-width: 500px;
      padding: var(--sc-spacing-md);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      background-color: var(--sc-input-bg);
      color: var(--sc-text-primary);
      font-size: var(--sc-font-size-md);
    }

    .search-input:focus {
      outline: none;
      border-color: var(--sc-input-focus);
    }

    /* Stats */
    .stats-bar {
      display: flex;
      gap: var(--sc-spacing-lg);
      padding: var(--sc-spacing-md);
      background-color: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      margin-bottom: var(--sc-spacing-lg);
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: var(--sc-font-size-xl);
      font-weight: 700;
      color: var(--sc-primary);
    }

    .stat-label {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
    }

    /* Grid Layout */
    .content-grid {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: var(--sc-spacing-lg);
    }

    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Sidebar */
    .sidebar {
      background-color: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-spacing-md);
      max-height: 600px;
      overflow-y: auto;
    }

    .sidebar-title {
      font-size: var(--sc-font-size-sm);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-md);
    }

    .sidebar-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .sidebar-item {
      padding: var(--sc-spacing-sm);
      border-radius: var(--sc-radius-sm);
      cursor: pointer;
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
      transition: all var(--sc-transition-fast);
    }

    .sidebar-item:hover {
      background-color: var(--sc-bg-hover);
    }

    .sidebar-item.active {
      background-color: var(--sc-primary-light);
      color: var(--sc-primary);
    }

    /* Main Content */
    .main-content {
      background-color: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-spacing-lg);
    }

    .item-header {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md);
      margin-bottom: var(--sc-spacing-md);
      padding-bottom: var(--sc-spacing-md);
      border-bottom: 1px solid var(--sc-border-color);
    }

    .item-id {
      padding: var(--sc-spacing-xs) var(--sc-spacing-sm);
      background-color: var(--sc-primary-light);
      color: var(--sc-primary);
      border-radius: var(--sc-radius-sm);
      font-size: var(--sc-font-size-sm);
      font-weight: 600;
    }

    .item-name {
      font-size: var(--sc-font-size-xl);
      font-weight: 600;
      color: var(--sc-text-primary);
    }

    .item-description {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
      line-height: 1.6;
    }

    .item-meta {
      margin-top: var(--sc-spacing-lg);
      padding-top: var(--sc-spacing-md);
      border-top: 1px solid var(--sc-border-color);
    }

    .meta-label {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
      text-transform: uppercase;
      margin-bottom: var(--sc-spacing-xs);
    }

    .meta-tags {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-xs);
    }

    .meta-tag {
      padding: var(--sc-spacing-xs) var(--sc-spacing-sm);
      background-color: var(--sc-bg-tertiary);
      border-radius: var(--sc-radius-full);
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-secondary);
    }

    /* Technique List */
    .technique-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .technique-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--sc-spacing-sm) 0;
      border-bottom: 1px solid var(--sc-border-color);
      cursor: pointer;
    }

    .technique-item:last-child {
      border-bottom: none;
    }

    .technique-item:hover {
      color: var(--sc-primary);
    }

    .technique-id {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
      margin-right: var(--sc-spacing-sm);
    }

    .technique-name {
      font-size: var(--sc-font-size-sm);
    }

    /* Control List */
    .control-item {
      padding: var(--sc-spacing-md);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      margin-bottom: var(--sc-spacing-sm);
    }

    .control-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--sc-spacing-xs);
    }

    .control-number {
      font-size: var(--sc-font-size-sm);
      font-weight: 600;
      color: var(--sc-primary);
    }

    .control-domain {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
    }

    .control-name {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-primary);
    }

    .control-description {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-secondary);
      margin-top: var(--sc-spacing-xs);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--sc-spacing-2xl);
      color: var(--sc-text-tertiary);
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: var(--sc-spacing-2xl);
    }
  `;

  constructor() {
    super();
    this.loadKnowledgeBase();
  }

  private async loadKnowledgeBase() {
    this.loading = true;

    try {
      const [mitreStats, mitreTactics, scfStats, scfDomains] = await Promise.all([
        gatewayClient.request<MitreStats>('knowledge.mitre.stats'),
        gatewayClient.request<MitreTactic[]>('knowledge.mitre.tactics'),
        gatewayClient.request<ScfStats>('knowledge.scf.stats'),
        gatewayClient.request<ScfDomain[]>('knowledge.scf.domains'),
      ]);

      this.mitreStats = mitreStats;
      this.mitreTactics = mitreTactics;
      this.scfStats = scfStats;
      this.scfDomains = scfDomains;
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    }

    this.loading = false;
  }

  private handleTabChange(tab: 'mitre' | 'scf') {
    this.activeTab = tab;
    this.searchQuery = '';
    this.searchResults = [];
  }

  private async handleSearch(e: Event) {
    this.searchQuery = (e.target as HTMLInputElement).value;

    if (this.searchQuery.length < 2) {
      this.searchResults = [];
      return;
    }

    try {
      if (this.activeTab === 'mitre') {
        this.searchResults = await gatewayClient.request<MitreTechnique[]>(
          'knowledge.mitre.search',
          { query: this.searchQuery }
        );
      } else {
        this.searchResults = await gatewayClient.request<ScfControl[]>(
          'knowledge.scf.search',
          { query: this.searchQuery }
        );
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  }

  private async handleTacticSelect(tacticId: string) {
    try {
      this.mitreTechniques = await gatewayClient.request<MitreTechnique[]>(
        'knowledge.mitre.techniques',
        { tacticId }
      );
    } catch (error) {
      console.error('Failed to load techniques:', error);
    }
  }

  private async handleDomainSelect(domainId: string) {
    try {
      this.scfControls = await gatewayClient.request<ScfControl[]>(
        'knowledge.scf.controls',
        { domainId }
      );
    } catch (error) {
      console.error('Failed to load controls:', error);
    }
  }

  private renderMitreView() {
    return html`
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value">${this.mitreStats?.techniques || 0}</div>
          <div class="stat-label">Techniques</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${this.mitreStats?.tactics || 0}</div>
          <div class="stat-label">Tactics</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${this.mitreStats?.enterprise || 0}</div>
          <div class="stat-label">Enterprise</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${this.mitreStats?.mobile || 0}</div>
          <div class="stat-label">Mobile</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${this.mitreStats?.ics || 0}</div>
          <div class="stat-label">ICS</div>
        </div>
      </div>

      <div class="content-grid">
        <div class="sidebar">
          <div class="sidebar-title">Tactics</div>
          <ul class="sidebar-list">
            ${this.mitreTactics.map(
              (tactic) => html`
                <li
                  class="sidebar-item"
                  @click=${() => this.handleTacticSelect(tactic.id)}
                >
                  ${tactic.external_id} - ${tactic.name}
                </li>
              `
            )}
          </ul>
        </div>

        <div class="main-content">
          ${this.searchResults.length > 0
            ? this.renderSearchResults()
            : this.mitreTechniques.length > 0
              ? this.renderTechniqueList()
              : html`
                  <div class="empty-state">
                    Select a tactic from the sidebar to view techniques
                  </div>
                `}
        </div>
      </div>
    `;
  }

  private renderTechniqueList() {
    return html`
      <ul class="technique-list">
        ${this.mitreTechniques.map(
          (technique) => html`
            <li class="technique-item">
              <div>
                <span class="technique-id">${technique.external_id}</span>
                <span class="technique-name">${technique.name}</span>
              </div>
            </li>
          `
        )}
      </ul>
    `;
  }

  private renderScfView() {
    return html`
      <div class="stats-bar">
        <div class="stat-item">
          <div class="stat-value">${this.scfStats?.controls || 0}</div>
          <div class="stat-label">Controls</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${this.scfStats?.domains || 0}</div>
          <div class="stat-label">Domains</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${this.scfStats?.categories?.length || 0}</div>
          <div class="stat-label">Categories</div>
        </div>
      </div>

      <div class="content-grid">
        <div class="sidebar">
          <div class="sidebar-title">Domains</div>
          <ul class="sidebar-list">
            ${this.scfDomains.map(
              (domain) => html`
                <li
                  class="sidebar-item"
                  @click=${() => this.handleDomainSelect(domain.id)}
                >
                  ${domain.scfIdentifier} - ${domain.name}
                </li>
              `
            )}
          </ul>
        </div>

        <div class="main-content">
          ${this.searchResults.length > 0
            ? this.renderSearchResults()
            : this.scfControls.length > 0
              ? this.renderControlList()
              : html`
                  <div class="empty-state">
                    Select a domain from the sidebar to view controls
                  </div>
                `}
        </div>
      </div>
    `;
  }

  private renderControlList() {
    return html`
      ${this.scfControls.map(
        (control) => html`
          <div class="control-item">
            <div class="control-header">
              <span class="control-number">${control.scfNumber}</span>
              <span class="control-domain">${control.domain}</span>
            </div>
            <div class="control-name">${control.name}</div>
            <div class="control-description">${control.description}</div>
          </div>
        `
      )}
    `;
  }

  private renderSearchResults() {
    if (this.activeTab === 'mitre') {
      return html`
        <h4>Search Results (${this.searchResults.length})</h4>
        <ul class="technique-list">
          ${(this.searchResults as MitreTechnique[]).map(
            (item) => html`
              <li class="technique-item">
                <div>
                  <span class="technique-id">${item.external_id}</span>
                  <span class="technique-name">${item.name}</span>
                </div>
              </li>
            `
          )}
        </ul>
      `;
    }

    return html`
      <h4>Search Results (${this.searchResults.length})</h4>
      ${(this.searchResults as ScfControl[]).map(
        (item) => html`
          <div class="control-item">
            <div class="control-header">
              <span class="control-number">${item.scfNumber}</span>
            </div>
            <div class="control-name">${item.name}</div>
          </div>
        `
      )}
    `;
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-container">
          ${this.i18n.t('common.loading')}
        </div>
      `;
    }

    return html`
      <div class="page-header">
        <h1 class="page-title">${this.i18n.t('nav.knowledgeBase')}</h1>
        <p class="page-subtitle">${this.i18n.t('knowledge.search')}</p>
      </div>

      <div class="tabs">
        <div
          class="tab ${this.activeTab === 'mitre' ? 'active' : ''}"
          @click=${() => this.handleTabChange('mitre')}
        >
          ${this.i18n.t('knowledge.mitre')}
        </div>
        <div
          class="tab ${this.activeTab === 'scf' ? 'active' : ''}"
          @click=${() => this.handleTabChange('scf')}
        >
          ${this.i18n.t('knowledge.scf')}
        </div>
      </div>

      <div class="search-container">
        <input
          type="text"
          class="search-input"
          placeholder=${this.i18n.t('knowledge.search')}
          .value=${this.searchQuery}
          @input=${this.handleSearch}
        />
      </div>

      ${this.activeTab === 'mitre' ? this.renderMitreView() : this.renderScfView()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-knowledge-base': ScKnowledgeBase;
  }
}
```

---

## 3. API Endpoints

| Method | Description |
|--------|-------------|
| `knowledge.mitre.stats` | Get MITRE statistics |
| `knowledge.mitre.tactics` | List all tactics |
| `knowledge.mitre.techniques` | List techniques (optionally by tactic) |
| `knowledge.mitre.search` | Search MITRE data |
| `knowledge.scf.stats` | Get SCF statistics |
| `knowledge.scf.domains` | List all domains |
| `knowledge.scf.controls` | List controls (optionally by domain) |
| `knowledge.scf.search` | Search SCF data |

---

## 4. UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Knowledge Base                                                              │
│ Search MITRE ATT&CK and SCF data                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ [MITRE ATT&CK] [SCF Controls]                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ [Search knowledge base...                                        ]          │
├─────────────────────────────────────────────────────────────────────────────┤
│ │ 1451 Techniques │ 14 Tactics │ Enterprise │ Mobile │ ICS │               │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────────────────────────────────────────────────┐ │
│ │ Tactics     │ │                                                         │ │
│ │─────────────│ │ Select a tactic from the sidebar to view techniques     │ │
│ │ TA0001      │ │                                                         │ │
│ │ Initial     │ │                                                         │ │
│ │ Access      │ │                                                         │ │
│ │─────────────│ │                                                         │ │
│ │ TA0002      │ │                                                         │ │
│ │ Execution   │ │                                                         │ │
│ │─────────────│ │                                                         │ │
│ │ TA0003      │ │                                                         │ │
│ │ Persistence │ │                                                         │ │
│ └─────────────┘ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*End of SPEC-13: Knowledge Base Page*
