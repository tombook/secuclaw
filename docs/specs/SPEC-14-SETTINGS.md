# SPEC-14: Settings Pages

> **Document Version**: 1.0  
> **Created**: 2026-03-08  
> **Purpose**: AI-Implementation-Ready Specification for SecuClaw Settings Pages

---

## 1. Overview

The Settings section contains three pages:
1. **Main Settings** (`/settings`) - General system settings
2. **LLM Service Config** (`/settings/llm-config`) - LLM provider management
3. **AI Experts Config** (`/settings/ai-experts-config`) - Role-to-LLM bindings

### 1.1 Implementation Status Update (2026-03-09)

Current code implementation already includes:

1. Main settings page with theme/language switching via `uiStore` and localStorage persistence.
2. LLM provider management with backend persistence (`llm.providers.list/add/update/delete`) and connectivity test.
3. Legacy migration path from localStorage and compatibility handling for provider data normalization.
4. AI Experts Config UI for 8 roles with enable toggle, provider selection, and model selection.

Current integration gap:

1. AI Experts Config selections are currently UI-local and not yet persisted as authoritative backend role bindings.
2. This gap is explicitly covered by `SPEC-15` Sprint 0 alignment tasks.

### 1.2 Detailed As-Is Implementation

#### 1.2.1 Main Settings (`/settings`)

1. File: `ui/src/ui/pages/settings/sc-settings-page.ts`
2. Implemented controls:
   - Theme switch (`light` / `dark` / `system`)
   - Locale switch (`zh-CN` / `en` / `zh-TW`)
3. Data source: `ui/src/ui/store/ui-store.ts`
4. Persistence:
   - `secuclaw-theme`
   - `secuclaw-locale`
5. Navigation cards:
   - jump to `/settings/llm-config`
   - jump to `/settings/ai-experts-config`

#### 1.2.2 LLM Service Config (`/settings/llm-config`)

1. File: `ui/src/ui/pages/settings/sc-llm-service-config.ts`
2. Backend methods used:
   - `llm.providers.list`
   - `llm.providers.add`
   - `llm.providers.update`
   - `llm.providers.delete`
3. Implemented operations:
   - add/edit/delete provider
   - enable/disable provider
   - model list management
   - connectivity test (Ollama/OpenAI-compatible probing)
4. Migration behavior:
   - localStorage legacy key migration
   - backend normalization compatibility for provider payload
5. Persistence file:
   - `packages/core/data/storage/llm-providers.json`

#### 1.2.3 AI Experts Config (`/settings/ai-experts-config`)

1. File: `ui/src/ui/pages/settings/sc-ai-experts-config.ts`
2. UI behavior:
   - 8 role cards
   - role enable/disable toggle
   - provider dropdown (enabled providers only)
   - model dropdown (from selected provider models)
3. Current data path:
   - providers come from `llm.providers.list`
   - role selections are maintained in frontend component state
4. Current limitation:
   - no authoritative persistence to commander role binding yet
   - reload resets custom role-provider-model selection

---

## 2. LLM Service Configuration

**File**: `ui/src/ui/pages/settings/sc-llm-service-config.ts`

### 2.1 Purpose
Manage LLM providers (OpenAI, Anthropic, Azure, Local models) with CRUD operations.

### 2.2 Component

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { gatewayClient } from '../../gateway-client.js';

interface LLMProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'azure' | 'local' | 'custom';
  baseUrl: string;
  apiKey?: string;
  models: string[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

@customElement('sc-llm-service-config')
export class ScLlmServiceConfig extends LitElement {
  private i18n = new I18nController(this);

  @state()
  private providers: LLMProvider[] = [];

  @state()
  private loading: boolean = true;

  @state()
  private editingProvider: LLMProvider | null = null;

  @state()
  private showAddForm: boolean = false;

  @state()
  private formData = {
    name: '',
    type: 'openai' as LLMProvider['type'],
    baseUrl: '',
    apiKey: '',
    models: '',
    enabled: true,
  };

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

    .add-button {
      padding: var(--sc-spacing-sm) var(--sc-spacing-lg);
      background-color: var(--sc-primary);
      color: white;
      border: none;
      border-radius: var(--sc-radius-md);
      font-size: var(--sc-font-size-sm);
      cursor: pointer;
      margin-bottom: var(--sc-spacing-lg);
    }

    .provider-list {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-md);
    }

    .provider-card {
      background-color: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-spacing-lg);
    }

    .provider-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-md);
    }

    .provider-name {
      font-size: var(--sc-font-size-lg);
      font-weight: 600;
      color: var(--sc-text-primary);
    }

    .provider-type {
      padding: var(--sc-spacing-xs) var(--sc-spacing-sm);
      background-color: var(--sc-bg-tertiary);
      border-radius: var(--sc-radius-full);
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-secondary);
    }

    .provider-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--sc-spacing-md);
    }

    .detail-item {
      font-size: var(--sc-font-size-sm);
    }

    .detail-label {
      color: var(--sc-text-tertiary);
      margin-bottom: var(--sc-spacing-xs);
    }

    .detail-value {
      color: var(--sc-text-primary);
    }

    .provider-actions {
      display: flex;
      gap: var(--sc-spacing-sm);
      margin-top: var(--sc-spacing-md);
      padding-top: var(--sc-spacing-md);
      border-top: 1px solid var(--sc-border-color);
    }

    .action-button {
      padding: var(--sc-spacing-xs) var(--sc-spacing-md);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      background-color: transparent;
      color: var(--sc-text-secondary);
      font-size: var(--sc-font-size-sm);
      cursor: pointer;
    }

    .action-button:hover {
      background-color: var(--sc-bg-hover);
    }

    .action-button.danger {
      border-color: var(--sc-error);
      color: var(--sc-error);
    }

    /* Form */
    .form-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--sc-z-modal);
    }

    .form-container {
      background-color: var(--sc-bg-card);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-spacing-xl);
      width: 100%;
      max-width: 500px;
    }

    .form-title {
      font-size: var(--sc-font-size-xl);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-lg);
    }

    .form-group {
      margin-bottom: var(--sc-spacing-md);
    }

    .form-label {
      display: block;
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
      margin-bottom: var(--sc-spacing-xs);
    }

    .form-input,
    .form-select {
      width: 100%;
      padding: var(--sc-spacing-sm);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      background-color: var(--sc-input-bg);
      color: var(--sc-text-primary);
      font-size: var(--sc-font-size-sm);
    }

    .form-input:focus,
    .form-select:focus {
      outline: none;
      border-color: var(--sc-input-focus);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--sc-spacing-sm);
      margin-top: var(--sc-spacing-lg);
    }

    .toggle-switch {
      position: relative;
      width: 48px;
      height: 24px;
      background-color: var(--sc-bg-tertiary);
      border-radius: var(--sc-radius-full);
      cursor: pointer;
    }

    .toggle-switch.active {
      background-color: var(--sc-success);
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      background-color: white;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: transform var(--sc-transition-fast);
    }

    .toggle-switch.active::after {
      transform: translateX(24px);
    }
  `;

  constructor() {
    super();
    this.loadProviders();
  }

  private async loadProviders() {
    this.loading = true;
    try {
      this.providers = await gatewayClient.request<LLMProvider[]>('llm.providers.list');
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
    this.loading = false;
  }

  private openAddForm() {
    this.formData = {
      name: '',
      type: 'openai',
      baseUrl: '',
      apiKey: '',
      models: '',
      enabled: true,
    };
    this.editingProvider = null;
    this.showAddForm = true;
  }

  private openEditForm(provider: LLMProvider) {
    this.formData = {
      name: provider.name,
      type: provider.type,
      baseUrl: provider.baseUrl,
      apiKey: provider.apiKey || '',
      models: provider.models.join(', '),
      enabled: provider.enabled,
    };
    this.editingProvider = provider;
    this.showAddForm = true;
  }

  private closeForm() {
    this.showAddForm = false;
    this.editingProvider = null;
  }

  private handleInputChange(field: string, value: string | boolean) {
    this.formData = { ...this.formData, [field]: value };
  }

  private async handleSubmit() {
    try {
      const providerData = {
        name: this.formData.name,
        type: this.formData.type,
        baseUrl: this.formData.baseUrl,
        apiKey: this.formData.apiKey,
        models: this.formData.models.split(',').map((m) => m.trim()).filter(Boolean),
        enabled: this.formData.enabled,
      };

      if (this.editingProvider) {
        await gatewayClient.request('llm.providers.update', {
          id: this.editingProvider.id,
          updates: providerData,
        });
      } else {
        await gatewayClient.request('llm.providers.add', providerData);
      }

      this.closeForm();
      await this.loadProviders();
    } catch (error) {
      console.error('Failed to save provider:', error);
    }
  }

  private async handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this provider?')) return;

    try {
      await gatewayClient.request('llm.providers.delete', { id });
      await this.loadProviders();
    } catch (error) {
      console.error('Failed to delete provider:', error);
    }
  }

  private async handleToggleEnabled(provider: LLMProvider) {
    try {
      await gatewayClient.request('llm.providers.update', {
        id: provider.id,
        updates: { enabled: !provider.enabled },
      });
      await this.loadProviders();
    } catch (error) {
      console.error('Failed to toggle provider:', error);
    }
  }

  private renderForm() {
    return html`
      <div class="form-overlay" @click=${this.closeForm}>
        <div class="form-container" @click=${(e: Event) => e.stopPropagation()}>
          <h3 class="form-title">
            ${this.editingProvider ? 'Edit Provider' : 'Add Provider'}
          </h3>

          <div class="form-group">
            <label class="form-label">Name</label>
            <input
              class="form-input"
              type="text"
              .value=${this.formData.name}
              @input=${(e: Event) => this.handleInputChange('name', (e.target as HTMLInputElement).value)}
              placeholder="My LLM Provider"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Type</label>
            <select
              class="form-select"
              .value=${this.formData.type}
              @change=${(e: Event) => this.handleInputChange('type', (e.target as HTMLSelectElement).value as LLMProvider['type'])}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="azure">Azure OpenAI</option>
              <option value="local">Local Model</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Base URL</label>
            <input
              class="form-input"
              type="text"
              .value=${this.formData.baseUrl}
              @input=${(e: Event) => this.handleInputChange('baseUrl', (e.target as HTMLInputElement).value)}
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div class="form-group">
            <label class="form-label">API Key</label>
            <input
              class="form-input"
              type="password"
              .value=${this.formData.apiKey}
              @input=${(e: Event) => this.handleInputChange('apiKey', (e.target as HTMLInputElement).value)}
              placeholder="sk-..."
            />
          </div>

          <div class="form-group">
            <label class="form-label">Models (comma-separated)</label>
            <input
              class="form-input"
              type="text"
              .value=${this.formData.models}
              @input=${(e: Event) => this.handleInputChange('models', (e.target as HTMLInputElement).value)}
              placeholder="gpt-4, gpt-3.5-turbo"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Enabled</label>
            <div
              class="toggle-switch ${this.formData.enabled ? 'active' : ''}"
              @click=${() => this.handleInputChange('enabled', !this.formData.enabled)}
            ></div>
          </div>

          <div class="form-actions">
            <button class="action-button" @click=${this.closeForm}>
              ${this.i18n.t('common.cancel')}
            </button>
            <button class="action-button primary" @click=${this.handleSubmit}>
              ${this.i18n.t('common.save')}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <div class="page-header">
        <h1 class="page-title">${this.i18n.t('settings.llmConfig')}</h1>
      </div>

      <button class="add-button" @click=${this.openAddForm}>
        + Add Provider
      </button>

      <div class="provider-list">
        ${this.providers.map(
          (provider) => html`
            <div class="provider-card">
              <div class="provider-header">
                <span class="provider-name">${provider.name}</span>
                <span class="provider-type">${provider.type}</span>
              </div>

              <div class="provider-details">
                <div class="detail-item">
                  <div class="detail-label">Base URL</div>
                  <div class="detail-value">${provider.baseUrl}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Models</div>
                  <div class="detail-value">${provider.models.join(', ') || 'None'}</div>
                </div>
                <div class="detail-item">
                  <div class="detail-label">Status</div>
                  <div class="detail-value">
                    ${provider.enabled ? '✅ Enabled' : '❌ Disabled'}
                  </div>
                </div>
              </div>

              <div class="provider-actions">
                <div
                  class="toggle-switch ${provider.enabled ? 'active' : ''}"
                  @click=${() => this.handleToggleEnabled(provider)}
                ></div>
                <button class="action-button" @click=${() => this.openEditForm(provider)}>
                  Edit
                </button>
                <button class="action-button danger" @click=${() => this.handleDelete(provider.id)}>
                  Delete
                </button>
              </div>
            </div>
          `
        )}
      </div>

      ${this.showAddForm ? this.renderForm() : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-llm-service-config': ScLlmServiceConfig;
  }
}
```

---

## 3. AI Experts Configuration

**File**: `ui/src/ui/pages/settings/sc-ai-experts-config.ts`

### 3.1 Purpose
Bind LLM providers and models to specific security roles.

### 3.2 Features
- List 8 security roles
- Select LLM provider per role
- Select model per role
- Configure temperature and max tokens

### 3.3 Data Model

```typescript
interface RoleLLMConfig {
  roleId: string;
  roleName: string;
  providerId: string;
  modelName: string;
  enabled: boolean;
}
```

### 3.4 UI Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ AI Experts Configuration                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🛡️ Security Expert                                        [✓ Enabled]  │ │
│ │ Provider: [OpenAI ▼]    Model: [gpt-4 ▼]                               │ │
│ │ Temperature: [0.7]      Max Tokens: [4096]                             │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ 🔐 Privacy Officer                                         [✓ Enabled]  │ │
│ │ Provider: [Anthropic ▼]  Model: [claude-3 ▼]                           │ │
│ │ Temperature: [0.5]      Max Tokens: [8192]                             │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│ ... (6 more role cards)                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Main Settings Page

**File**: `ui/src/ui/pages/settings/sc-settings-page.ts`

### 4.1 Features
- Theme selection (Light/Dark/System)
- Language selection (zh-CN/en/zh-TW)
- Notification preferences
- Links to sub-settings pages

### 4.2 Navigation

```
Settings
├── General (main page)
├── LLM Service Config (/settings/llm-config)
└── AI Experts Config (/settings/ai-experts-config)
```

---

## 5. API Endpoints

| Method | Description |
|--------|-------------|
| `llm.providers.list` | List all LLM providers |
| `llm.providers.add` | Add new provider |
| `llm.providers.update` | Update provider |
| `llm.providers.delete` | Delete provider |
| `commander.bindLLM` | Bind LLM to role |
| `commander.update` | Update commander settings |

---

*End of SPEC-14: Settings Pages*
