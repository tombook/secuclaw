import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../../i18n/lib/lit-controller.js';
import { gatewayClient } from '../../gateway-client.js';

interface LLMProvider {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  apiKey?: string;
  models: string[];
  enabled: boolean;
  createdAt?: number;
  updatedAt?: number;
}

interface TestResult {
  [providerId: string]: 'idle' | 'testing' | 'success' | 'error';
}

@customElement('sc-llm-service-config')
export class ScLlmServiceConfig extends LitElement {
  private i18n = new I18nController(this);

  @state()
  private providers: LLMProvider[] = [];

  @state()
  private testResults: TestResult = {};

  @state()
  private showAddForm = false;

  @state()
  private editingId: string | null = null;

  @state()
  private newProvider: Partial<LLMProvider> = {
    name: '',
    type: 'openai',
    baseUrl: '',
    apiKey: '',
    models: [],
  };

  @state()
  private newModelInput = '';

  @state()
  private loading = false;

  private normalizeProvider(input: unknown, index: number): LLMProvider {
    const source = (input && typeof input === 'object') ? (input as Partial<LLMProvider>) : {};
    return {
      id: source.id || `provider_${Date.now()}_${index}`,
      name: source.name || `Provider ${index + 1}`,
      type: source.type || 'custom',
      baseUrl: source.baseUrl || '',
      apiKey: source.apiKey || '',
      models: Array.isArray(source.models) ? source.models.map((m) => String(m)) : [],
      enabled: typeof source.enabled === 'boolean' ? source.enabled : true,
      createdAt: source.createdAt,
      updatedAt: source.updatedAt,
    };
  }

  static styles = css`
    :host { display: block; }
    .page-title { 
      font-size: var(--sc-font-size-2xl); 
      font-weight: 600; 
      color: var(--sc-text-primary); 
      margin-bottom: var(--sc-spacing-lg); 
    }
    .loading {
      padding: var(--sc-spacing-xl);
      text-align: center;
      color: var(--sc-text-tertiary);
    }
    .provider-card { 
      background: var(--sc-bg-card); 
      border: 1px solid var(--sc-border-color); 
      border-radius: var(--sc-radius-lg); 
      padding: var(--sc-spacing-lg); 
      margin-bottom: var(--sc-spacing-md); 
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
      padding: 2px 8px; 
      background: var(--sc-bg-tertiary); 
      border-radius: var(--sc-radius-full); 
      font-size: var(--sc-font-size-xs); 
      color: var(--sc-text-secondary); 
    }
    .provider-detail { 
      font-size: var(--sc-font-size-sm); 
      color: var(--sc-text-secondary); 
      margin-bottom: var(--sc-spacing-xs); 
    }
    .add-button { 
      padding: var(--sc-spacing-sm) var(--sc-spacing-lg); 
      background: var(--sc-primary); 
      color: white; 
      border: none; 
      border-radius: var(--sc-radius-md); 
      cursor: pointer; 
      margin-bottom: var(--sc-spacing-lg); 
    }
    .add-button:hover { 
      background: var(--sc-primary-hover); 
    }
    .add-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .toggle-switch { 
      position: relative; 
      width: 48px; 
      height: 24px; 
      background: var(--sc-bg-tertiary); 
      border-radius: 12px; 
      cursor: pointer; 
    }
    .toggle-switch.active { 
      background: var(--sc-success); 
    }
    .toggle-switch::after { 
      content: ''; 
      position: absolute; 
      width: 20px; 
      height: 20px; 
      background: white; 
      border-radius: 50%; 
      top: 2px; 
      left: 2px; 
      transition: transform 0.2s; 
    }
    .toggle-switch.active::after { 
      transform: translateX(24px); 
    }
    .form-overlay { 
      position: fixed; 
      top: 0; 
      left: 0; 
      right: 0; 
      bottom: 0; 
      background: rgba(0,0,0,0.5); 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      z-index: 1000; 
    }
    .form-dialog { 
      background: var(--sc-bg-card); 
      border-radius: var(--sc-radius-lg); 
      padding: var(--sc-spacing-xl); 
      min-width: 400px; 
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
    .form-input { 
      width: 100%; 
      padding: var(--sc-spacing-sm); 
      border: 1px solid var(--sc-border-color); 
      border-radius: var(--sc-radius-md); 
      background: var(--sc-input-bg); 
      color: var(--sc-text-primary); 
      box-sizing: border-box; 
    }
    .form-input:focus { 
      outline: none; 
      border-color: var(--sc-primary); 
    }
    .form-actions { 
      display: flex; 
      gap: var(--sc-spacing-sm); 
      justify-content: flex-end; 
      margin-top: var(--sc-spacing-lg); 
    }
    .btn { 
      padding: var(--sc-spacing-sm) var(--sc-spacing-lg); 
      border: none; 
      border-radius: var(--sc-radius-md); 
      cursor: pointer; 
      font-size: var(--sc-font-size-sm); 
    }
    .btn-primary { background: var(--sc-primary); color: white; }
    .btn-secondary { background: var(--sc-bg-tertiary); color: var(--sc-text-primary); }
    .btn-danger { background: var(--sc-error); color: white; }
    .btn-small { padding: 4px 12px; font-size: var(--sc-font-size-xs); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .model-tag { 
      display: inline-flex; 
      align-items: center; 
      gap: 4px; 
      padding: 2px 8px; 
      background: var(--sc-bg-tertiary); 
      border-radius: var(--sc-radius-sm); 
      font-size: var(--sc-font-size-xs); 
    }
    .model-tag button { 
      background: none; 
      border: none; 
      color: var(--sc-error); 
      cursor: pointer; 
      padding: 0; 
      margin-left: 4px; 
    }
    .action-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: var(--sc-spacing-md);
      gap: var(--sc-spacing-sm);
    }
    .test-status {
      font-size: var(--sc-font-size-sm);
      padding: 2px 8px;
      border-radius: var(--sc-radius-sm);
      margin-bottom: var(--sc-spacing-sm);
    }
    .test-status.success { background: var(--sc-success-bg); color: var(--sc-success); }
    .test-status.error { background: var(--sc-error-bg); color: var(--sc-error); }
    .test-status.testing { background: var(--sc-warning-bg); color: var(--sc-warning); }
    .button-group {
      display: flex;
      gap: var(--sc-spacing-xs);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadProviders();
  }

  private async loadProviders() {
    this.loading = true;
    try {
      // Wait for gateway connection (30 seconds timeout)
      await gatewayClient.waitForConnection(30000);
      await gatewayClient.waitForConnection(5000);
      
      // Load from backend API
      const providers = await gatewayClient.request<unknown>('llm.providers.list');
      const list = Array.isArray(providers) ? providers : [];
      this.providers = list.map((provider, index) => this.normalizeProvider(provider, index));
      
      // Migration: if backend is empty, check localStorage for legacy data
      if (this.providers.length === 0) {
        await this.migrateFromLocalStorage();
      }
    } catch (error) {
      console.error('[sc-llm-service-config] Failed to load providers:', error);
      this.providers = [];
    }
    this.loading = false;
  }

  private async migrateFromLocalStorage() {
    const LEGACY_STORAGE_KEY = 'secuclaw-llm-providers';
    const MIGRATION_FLAG_KEY = 'secuclaw-llm-providers-migrated';
    
    // Check if already migrated
    if (localStorage.getItem(MIGRATION_FLAG_KEY)) {
      return;
    }
    
    try {
      const stored = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!stored) {
        return;
      }
      
      const legacyProviders = JSON.parse(stored);
      if (!Array.isArray(legacyProviders) || legacyProviders.length === 0) {
        return;
      }
      
      console.log('[sc-llm-service-config] Migrating', legacyProviders.length, 'providers from localStorage to backend...');
      
      // Add each provider to backend
      for (const provider of legacyProviders) {
        await gatewayClient.request<LLMProvider>('llm.providers.add', {
          name: provider.name,
          type: provider.type,
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey || '',
          models: provider.models || [],
        });
      }
      
      // Reload providers from backend
      const providers = await gatewayClient.request<LLMProvider[]>('llm.providers.list');
      this.providers = providers || [];
      
      // Mark as migrated and clean up
      localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      
      console.log('[sc-llm-service-config] Migration completed successfully');
    } catch (error) {
      console.error('[sc-llm-service-config] Migration failed:', error);
    }
  }

  private openAddForm() {
    this.showAddForm = true;
    this.editingId = null;
    this.newProvider = { name: '', type: 'openai', baseUrl: '', apiKey: '', models: [] };
    this.newModelInput = '';
  }

  private openEditForm(provider: LLMProvider) {
    this.showAddForm = true;
    this.editingId = provider.id;
    this.newProvider = { ...provider };
    this.newModelInput = '';
  }

  private closeForm() {
    this.showAddForm = false;
    this.editingId = null;
  }

  private async handleSave() {
    if (!this.newProvider.name || !this.newProvider.baseUrl) return;

    try {
      if (this.editingId) {
        // Update existing provider via backend API
        await gatewayClient.request<LLMProvider>('llm.providers.update', {
          id: this.editingId,
          updates: {
            name: this.newProvider.name,
            type: this.newProvider.type,
            baseUrl: this.newProvider.baseUrl,
            apiKey: this.newProvider.apiKey,
            models: this.newProvider.models,
          },
        });
      } else {
        // Add new provider via backend API
        await gatewayClient.request<LLMProvider>('llm.providers.add', {
          name: this.newProvider.name,
          type: this.newProvider.type || 'openai',
          baseUrl: this.newProvider.baseUrl,
          apiKey: this.newProvider.apiKey || '',
          models: this.newProvider.models || [],
        });
      }
      
      // Reload providers from backend
      await this.loadProviders();
      this.closeForm();
    } catch (error) {
      console.error('[sc-llm-service-config] Failed to save provider:', error);
    }
  }

  private async handleDelete(id: string) {
    try {
      await gatewayClient.request('llm.providers.delete', { id });
      await this.loadProviders();
    } catch (error) {
      console.error('[sc-llm-service-config] Failed to delete provider:', error);
    }
  }

  private async handleToggle(id: string) {
    const provider = this.providers.find(p => p.id === id);
    if (!provider) return;

    try {
      await gatewayClient.request('llm.providers.update', {
        id,
        updates: { enabled: !provider.enabled },
      });
      await this.loadProviders();
    } catch (error) {
      console.error('[sc-llm-service-config] Failed to toggle provider:', error);
    }
  }

  private async handleTest(provider: LLMProvider) {
    this.testResults = { ...this.testResults, [provider.id]: 'testing' };

    try {
      const baseUrl = provider.baseUrl.replace(/\/+$/, '');
      const lowerName = (provider.name || '').toLowerCase();
      const lowerType = (provider.type || '').toLowerCase();
      const lowerBaseUrl = baseUrl.toLowerCase();
      const likelyOllama =
        lowerType === 'local' ||
        lowerType === 'ollama' ||
        lowerName.includes('ollama') ||
        lowerBaseUrl.includes('11434') ||
        lowerBaseUrl.includes('/ollama');

      const testEndpoints = likelyOllama
        ? [`${baseUrl}/api/tags`, `${baseUrl}/models`, `${baseUrl}/v1/models`]
        : [`${baseUrl}/models`, `${baseUrl}/v1/models`, `${baseUrl}/api/tags`];

      let isSuccess = false;
      for (const endpoint of testEndpoints) {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: this.getAuthHeaders(provider),
        });
        if (response.ok) {
          isSuccess = true;
          break;
        }
      }

      this.testResults = {
        ...this.testResults,
        [provider.id]: isSuccess ? 'success' : 'error'
      };
    } catch (e) {
      console.error('[sc-llm-service-config] Test failed:', e);
      this.testResults = { ...this.testResults, [provider.id]: 'error' };
    }
  }

  private getAuthHeaders(provider: LLMProvider): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (provider.apiKey) {
      if (provider.type === 'anthropic') {
        headers['x-api-key'] = provider.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
      }
    }
    return headers;
  }

  private handleAddModel() {
    if (this.newModelInput.trim()) {
      this.newProvider = {
        ...this.newProvider,
        models: [...(this.newProvider.models || []), this.newModelInput.trim()]
      };
      this.newModelInput = '';
    }
  }

  private handleRemoveModel(model: string) {
    this.newProvider = {
      ...this.newProvider,
      models: (this.newProvider.models || []).filter(m => m !== model)
    };
  }

  private updateField(field: string, value: string) {
    this.newProvider = { ...this.newProvider, [field]: value };
  }

  private updateModelInput(value: string) {
    this.newModelInput = value;
  }

  private handleModelKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.handleAddModel();
    }
  }

  render() {
    if (this.loading) {
      return html`
        <h1 class="page-title">${this.i18n.t('settings.llmConfig')}</h1>
        <div class="loading">${this.i18n.t('common.loading')}</div>
      `;
    }

    return html`
      <h1 class="page-title">${this.i18n.t('settings.llmConfig')}</h1>
      
      <button class="add-button" @click=${this.openAddForm}>
        + ${this.i18n.t('common.add')}
      </button>

      ${this.providers.length === 0 ? html`
        <div class="provider-card" style="text-align: center; color: var(--sc-text-tertiary);">
          ${this.i18n.t('chat.noProvider') || '未配置LLM服务提供商，点击上方按钮添加'}
        </div>
      ` : this.providers.map(p => {
        const testStatus = this.testResults[p.id] || 'idle';
        return html`
          <div class="provider-card">
            <div class="provider-header">
              <span class="provider-name">${p.name}</span>
              <span class="provider-type">${p.type}</span>
            </div>
            <div class="provider-detail">URL: ${p.baseUrl}</div>
            <div class="provider-detail">Models: ${Array.isArray(p.models) ? p.models.join(', ') : ''}</div>
            <div class="provider-detail">Status: ${p.enabled ? '✅ Enabled' : '❌ Disabled'}</div>
            
            ${testStatus !== 'idle' ? html`
              <div class="test-status ${testStatus}">
                ${testStatus === 'testing' ? '⏳ Testing...' : 
                  testStatus === 'success' ? '✅ Connection OK' : 
                  '❌ Connection Failed'}
              </div>
            ` : ''}
            
            <div class="action-row">
              <div 
                class="toggle-switch ${p.enabled ? 'active' : ''}" 
                @click=${() => this.handleToggle(p.id)}
              ></div>
              <div class="button-group">
                <button 
                  class="btn btn-secondary btn-small" 
                  @click=${() => this.handleTest(p)}
                  ?disabled=${testStatus === 'testing'}
                >
                  Test
                </button>
                <button 
                  class="btn btn-secondary btn-small" 
                  @click=${() => this.openEditForm(p)}
                >
                  Edit
                </button>
                <button 
                  class="btn btn-danger btn-small" 
                  @click=${() => this.handleDelete(p.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        `;
      })}

      ${this.showAddForm ? html`
        <div class="form-overlay" @click=${this.closeForm}>
          <div class="form-dialog" @click=${(e: Event) => e.stopPropagation()}>
            <h2 class="form-title">
              ${this.editingId ? 'Edit Provider' : this.i18n.t('settings.addProvider')}
            </h2>
            
            <div class="form-group">
              <label class="form-label">${this.i18n.t('settings.providerName')}</label>
              <input 
                class="form-input" 
                type="text" 
                .value=${this.newProvider.name || ''} 
                @input=${(e: InputEvent) => this.updateField('name', (e.target as HTMLInputElement).value)} 
                placeholder="e.g., OpenAI" 
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">${this.i18n.t('settings.providerType')}</label>
              <select 
                class="form-input" 
                .value=${this.newProvider.type || 'openai'} 
                @change=${(e: Event) => this.updateField('type', (e.target as HTMLSelectElement).value)}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="azure">Azure OpenAI</option>
                <option value="local">Local (Ollama)</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">${this.i18n.t('settings.baseUrl')}</label>
              <input 
                class="form-input" 
                type="text" 
                .value=${this.newProvider.baseUrl || ''} 
                @input=${(e: InputEvent) => this.updateField('baseUrl', (e.target as HTMLInputElement).value)} 
                placeholder="https://api.example.com/v1" 
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">${this.i18n.t('settings.apiKey')}</label>
              <input 
                class="form-input" 
                type="password" 
                .value=${this.newProvider.apiKey || ''} 
                @input=${(e: InputEvent) => this.updateField('apiKey', (e.target as HTMLInputElement).value)} 
                placeholder="sk-..." 
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">${this.i18n.t('settings.models')}</label>
              <div style="display: flex; gap: var(--sc-spacing-sm); margin-bottom: var(--sc-spacing-sm);">
                <input 
                  class="form-input" 
                  type="text" 
                  .value=${this.newModelInput} 
                  @input=${(e: InputEvent) => this.updateModelInput((e.target as HTMLInputElement).value)} 
                  @keydown=${this.handleModelKeydown} 
                  placeholder="e.g., gpt-4" 
                  style="flex: 1" 
                />
                <button class="btn btn-secondary" @click=${this.handleAddModel}>Add</button>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: var(--sc-spacing-xs);">
                ${(this.newProvider.models || []).map(m => html`
                  <span class="model-tag">
                    ${m}
                    <button @click=${() => this.handleRemoveModel(m)}>×</button>
                  </span>
                `)}
              </div>
            </div>
            
            <div class="form-actions">
              <button class="btn btn-secondary" @click=${this.closeForm}>
                ${this.i18n.t('common.cancel')}
              </button>
              <button class="btn btn-primary" @click=${this.handleSave}>
                ${this.i18n.t('common.save')}
              </button>
            </div>
          </div>
        </div>
      ` : ''}
    `;
  }
}
