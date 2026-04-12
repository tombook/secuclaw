import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../../i18n/lib/lit-controller.js';
import { gatewayClient } from '../../gateway-client.js';
import '../../components/sc-smart-recommendation-bar.js';

interface LLMProvider {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  apiKey?: string;
  models: string[];
  enabled: boolean;
}

interface RoleConfig {
  id: string;
  emoji: string;
  nameKey: string;
  enabled: boolean;
  selectedProviderId: string;
  selectedModel: string;
}

// Shared localStorage key with sc-llm-service-config
const STORAGE_KEY = 'secuclaw-llm-providers-v2';

@customElement('sc-ai-experts-config')
export class ScAiExpertsConfig extends LitElement {
  private i18n = new I18nController(this);

  @state() private providers: LLMProvider[] = [];
  @state() private roles: RoleConfig[] = [
    { id: 'security-expert', emoji: '🛡️', nameKey: 'roles.security-expert', enabled: true, selectedProviderId: '', selectedModel: '' },
    { id: 'privacy-officer', emoji: '🔐', nameKey: 'roles.privacy-officer', enabled: true, selectedProviderId: '', selectedModel: '' },
    { id: 'security-architect', emoji: '🏗️', nameKey: 'roles.security-architect', enabled: true, selectedProviderId: '', selectedModel: '' },
    { id: 'business-security-officer', emoji: '💼', nameKey: 'roles.business-security-officer', enabled: true, selectedProviderId: '', selectedModel: '' },
    { id: 'secuclaw-commander', emoji: '⚔️', nameKey: 'roles.secuclaw-commander', enabled: true, selectedProviderId: '', selectedModel: '' },
    { id: 'ciso', emoji: '👔', nameKey: 'roles.ciso', enabled: true, selectedProviderId: '', selectedModel: '' },
    { id: 'security-ops', emoji: '🔧', nameKey: 'roles.security-ops', enabled: true, selectedProviderId: '', selectedModel: '' },
    { id: 'supply-chain-security', emoji: '🔗', nameKey: 'roles.supply-chain-security', enabled: true, selectedProviderId: '', selectedModel: '' },
  ];
  @state() private loading = true;
  @state() private saving = false;
  @state() private saveStatus: 'idle' | 'saving' | 'saved' | 'error' = 'idle';

  // Event listener cleanup
  private providerChangeHandler: (() => void) | null = null;

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
    .no-providers {
      padding: var(--sc-spacing-lg);
      background: var(--sc-bg-secondary);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      margin-bottom: var(--sc-spacing-lg);
      color: var(--sc-text-secondary);
    }
    .no-providers a {
      color: var(--sc-primary);
      text-decoration: none;
    }
    .no-providers a:hover {
      text-decoration: underline;
    }
    .role-card { 
      background: var(--sc-bg-card); 
      border: 1px solid var(--sc-border-color); 
      border-radius: var(--sc-radius-lg); 
      padding: var(--sc-spacing-lg); 
      margin-bottom: var(--sc-spacing-md); 
    }
    .role-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
    }
    .role-name { 
      font-size: var(--sc-font-size-lg); 
      font-weight: 600; 
      color: var(--sc-text-primary); 
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
    }
    .role-emoji { font-size: 24px; }
    .toggle-switch {
      width: 48px;
      height: 24px;
      background: var(--sc-border-color);
      border-radius: 12px;
      cursor: pointer;
      position: relative;
      transition: background var(--sc-transition-fast);
    }
    .toggle-switch.active { background: var(--sc-primary); }
    .toggle-switch::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: transform var(--sc-transition-fast);
    }
    .toggle-switch.active::after {
      transform: translateX(24px);
    }
    .role-config { 
      margin-top: var(--sc-spacing-md); 
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--sc-spacing-md);
    }
    @media (max-width: 600px) {
      .role-config { grid-template-columns: 1fr; }
    }
    .config-group {
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-xs);
    }
    .config-label {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
      font-weight: 500;
    }
    select { 
      padding: var(--sc-spacing-sm) var(--sc-spacing-md); 
      border: 1px solid var(--sc-border-color); 
      border-radius: var(--sc-radius-md); 
      background: var(--sc-input-bg); 
      color: var(--sc-text-primary);
      font-size: var(--sc-font-size-sm);
      cursor: pointer;
    }
    select:focus {
      outline: none;
      border-color: var(--sc-primary);
    }
    select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .provider-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--sc-spacing-xs);
      padding: 2px 8px;
      background: var(--sc-bg-tertiary);
      border-radius: var(--sc-radius-full);
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-secondary);
      margin-left: var(--sc-spacing-sm);
    }
    .provider-badge.local { background: #10b98120; color: #10b981; }
    .provider-badge.openai { background: #3b82f620; color: #3b82f6; }
    .provider-badge.anthropic { background: #8b5cf620; color: #8b5cf6; }
    .save-section {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: var(--sc-spacing-md);
      margin-top: var(--sc-spacing-xl);
      padding-top: var(--sc-spacing-lg);
      border-top: 1px solid var(--sc-border-color);
    }
    .save-button {
      padding: var(--sc-spacing-sm) var(--sc-spacing-xl);
      background: var(--sc-primary);
      color: white;
      border: none;
      border-radius: var(--sc-radius-md);
      font-size: var(--sc-font-size-sm);
      cursor: pointer;
      transition: background var(--sc-transition-fast);
    }
    .save-button:hover {
      background: var(--sc-primary-hover);
    }
    .save-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .save-status {
      font-size: var(--sc-font-size-sm);
      padding: var(--sc-spacing-xs) var(--sc-spacing-sm);
      border-radius: var(--sc-radius-sm);
    }
    .save-status.saving { color: var(--sc-primary); }
    .save-status.saved { color: var(--sc-success); }
    .save-status.error { color: var(--sc-error); }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
    
    // Listen for provider changes from LLM Config page
    this.providerChangeHandler = () => {
      this.handleProvidersChanged();
    };
    window.addEventListener('llm-providers-changed', this.providerChangeHandler);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.providerChangeHandler) {
      window.removeEventListener('llm-providers-changed', this.providerChangeHandler);
    }
  }

  private handleProvidersChanged() {
    // Reload providers from localStorage when LLM Config page changes them
    const localProviders = this.loadProvidersFromLocalStorage();
    if (localProviders.length > 0) {
      this.providers = localProviders;
      // Update role selections to use new providers if needed
      this.roles = this.roles.map(role => {
        const providerExists = this.providers.some(p => p.id === role.selectedProviderId && p.enabled);
        if (!providerExists) {
          const defaultProvider = this.providers.find(p => p.enabled) || this.providers[0];
          return {
            ...role,
            selectedProviderId: defaultProvider?.id || '',
            selectedModel: defaultProvider?.models?.[0] || '',
          };
        }
        return role;
      });
    }
  }

  private loadProvidersFromLocalStorage(): LLMProvider[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as LLMProvider[];
      }
    } catch (e) {
      console.error('[AI Experts Config] Failed to load from localStorage:', e);
    }
    return [];
  }

  private async loadData() {
    this.loading = true;
    try {
      await gatewayClient.waitForConnection(5000);
      
      const [providersResult, savedConfigResult] = await Promise.allSettled([
        gatewayClient.request<unknown>('llm.providers.list'),
        gatewayClient.request<unknown>('aiExperts.config.get'),
      ]);

      let loadedProviders: LLMProvider[] = [];
      if (providersResult.status === 'fulfilled') {
        const raw = providersResult.value;
        const list = Array.isArray(raw) ? raw : [];
        loadedProviders = list.map((p: unknown, i: number) => this.normalizeProvider(p, i));
      }

      // If no providers from gateway, try localStorage (shared with LLM Config)
      if (loadedProviders.length === 0) {
        loadedProviders = this.loadProvidersFromLocalStorage();
      }

      // If still empty, use fallback
      if (loadedProviders.length === 0) {
        loadedProviders = this.getFallbackProviders();
      }

      this.providers = loadedProviders;

      const defaultProvider = this.providers.find(p => p.enabled) || this.providers[0];
      const defaultModel = defaultProvider?.models?.[0] || '';

      if (savedConfigResult.status === 'fulfilled' && savedConfigResult.value) {
        const data = savedConfigResult.value as Record<string, unknown>;
        const savedRoles = Array.isArray(data.roles) ? data.roles : [];
        
        this.roles = this.roles.map(role => {
          const saved = savedRoles.find((r: unknown) => {
            const sr = r as Record<string, unknown>;
            return sr.id === role.id;
          }) as Record<string, unknown> | undefined;
          if (saved) {
            return {
              ...role,
              enabled: typeof saved.enabled === 'boolean' ? saved.enabled : role.enabled,
              selectedProviderId: String(saved.providerId || defaultProvider?.id || ''),
              selectedModel: String(saved.model || defaultModel),
            };
          }
          return {
            ...role,
            selectedProviderId: defaultProvider?.id || '',
            selectedModel: defaultModel,
          };
        });
      } else {
        this.roles = this.roles.map(role => ({
          ...role,
          selectedProviderId: defaultProvider?.id || '',
          selectedModel: defaultModel,
        }));
      }
    } catch (error) {
      console.error('[sc-ai-experts-config] Failed to load data:', error);
      // Try localStorage on error
      const localProviders = this.loadProvidersFromLocalStorage();
      this.providers = localProviders.length > 0 ? localProviders : this.getFallbackProviders();
      const defaultProvider = this.providers[0];
      this.roles = this.roles.map(role => ({
        ...role,
        selectedProviderId: defaultProvider?.id || '',
        selectedModel: defaultProvider?.models?.[0] || '',
      }));
    }
    this.loading = false;
  }

  private normalizeProvider(input: unknown, index: number): LLMProvider {
    const source = (input && typeof input === 'object') ? (input as Record<string, unknown>) : {};
    return {
      id: String(source.id || `provider_${index}`),
      name: String(source.name || `Provider ${index + 1}`),
      type: String(source.type || 'custom'),
      baseUrl: String(source.baseUrl || ''),
      apiKey: source.apiKey ? String(source.apiKey) : undefined,
      models: Array.isArray(source.models) ? source.models.map((m: unknown) => String(m)) : [],
      enabled: typeof source.enabled === 'boolean' ? source.enabled : true,
    };
  }

  private getFallbackProviders(): LLMProvider[] {
    return [
      {
        id: 'provider_volcengine',
        name: '火山引擎',
        type: 'openai',
        baseUrl: 'https://ark.cn-beijing.volces.com/api/coding/v3',
        apiKey: '075cca97-a0ca-4225-87bf-78ac1b1e9664',
        models: ['doubao-seed-2.0-code', 'doubao-seed-2.0-pro', 'doubao-seed-2.0-lite', 'deepseek-v3.2', 'kimi-k2.5'],
        enabled: true,
      },
      {
        id: 'provider_minimax',
        name: 'MiniMax',
        type: 'minimax',
        baseUrl: 'https://api.minimaxi.com/v1',
        apiKey: 'sk-cp-Xbbc9YyGkfjGakX_uHOA0eoubcvC6ntqq0sR5NIqxOUuC-wGuuyMU3QJIiW-vh5F0KPISkPiuwBPCwtYU7pnxrDpFzd1JTer8oNI1y1RJ4ufqxEgCai67Kc',
        models: ['MiniMax-M2.7', 'MiniMax-M2.5'],
        enabled: true,
      },
      {
        id: 'provider_zhipu',
        name: '智谱 GLM',
        type: 'zhipu',
        baseUrl: 'https://open.bigmodel.cn/api/coding/paas/v4',
        apiKey: '02795750a3db4446b3d675ac755e6c0a.lc9oQDOH86EZ1kwD',
        models: ['glm-5.1', 'GLM-5-Turbo'],
        enabled: true,
      },
    ];
  }
  private handleToggle(roleId: string) {
    this.roles = this.roles.map(r => 
      r.id === roleId ? { ...r, enabled: !r.enabled } : r
    );
  }

  private handleProviderChange(roleId: string, providerId: string) {
    const provider = this.providers.find(p => p.id === providerId);
    const defaultModel = provider?.models?.[0] || '';
    
    this.roles = this.roles.map(r => 
      r.id === roleId 
        ? { ...r, selectedProviderId: providerId, selectedModel: defaultModel }
        : r
    );
  }

  private handleModelChange(roleId: string, model: string) {
    this.roles = this.roles.map(r => 
      r.id === roleId ? { ...r, selectedModel: model } : r
    );
  }

  private getProviderBadgeClass(type: string): string {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('local') || typeLower.includes('ollama')) return 'local';
    if (typeLower.includes('openai')) return 'openai';
    if (typeLower.includes('anthropic')) return 'anthropic';
    return '';
  }

  private async handleSave() {
    this.saving = true;
    this.saveStatus = 'saving';
    try {
      const rolesData = this.roles.map(r => ({
        id: r.id,
        enabled: r.enabled,
        providerId: r.selectedProviderId,
        model: r.selectedModel,
      }));
      
      await gatewayClient.request('aiExperts.config.save', { roles: rolesData });
      this.saveStatus = 'saved';
      
      // Reset status after 2 seconds
      setTimeout(() => {
        this.saveStatus = 'idle';
      }, 2000);
    } catch (error) {
      console.error('Failed to save config:', error);
      this.saveStatus = 'error';
    }
    this.saving = false;
  }

  render() {
    if (this.loading) {
      return html`
        <h1 class="page-title">${this.i18n.t('settings.aiExpertsConfig')}</h1>
        <div class="loading">${this.i18n.t('common.loading')}</div>
      `;
    }

    if (this.providers.length === 0) {
      return html`
        <h1 class="page-title">${this.i18n.t('settings.aiExpertsConfig')}</h1>
        <div class="no-providers">
          ⚠️ ${this.i18n.t('chat.noProvider') || '未配置LLM服务提供商，使用演示数据'}
          <br /><br />
          <a href="#/settings/llm-config">${this.i18n.t('settings.llmConfig') || '前往配置'}</a>
        </div>
      `;
    }

    return html`
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <h1 class="page-title">${this.i18n.t('settings.aiExpertsConfig')}</h1>
      ${this.roles.map(r => {
        const provider = this.providers.find(p => p.id === r.selectedProviderId);
        return html`
          <div class="role-card">
            <div class="role-header">
              <span class="role-name">
                <span class="role-emoji">${r.emoji}</span>
                ${this.i18n.t(r.nameKey)}
                ${provider ? html`
                  <span class="provider-badge ${this.getProviderBadgeClass(provider.type)}">
                    ${provider.name}
                  </span>
                ` : ''}
              </span>
              <div 
                class="toggle-switch ${r.enabled ? 'active' : ''}"
                @click=${() => this.handleToggle(r.id)}
              ></div>
            </div>
            <div class="role-config">
              <div class="config-group">
                <span class="config-label">${this.i18n.t('settings.providerType') || '服务提供商'}</span>
                <select 
                  @change=${(e: Event) => this.handleProviderChange(r.id, (e.target as HTMLSelectElement).value)}
                  .value=${r.selectedProviderId}
                >
                  ${this.providers.filter(p => p.enabled).map(p => html`
                    <option value=${p.id}>${p.name} (${p.type})</option>
                  `)}
                </select>
              </div>
              <div class="config-group">
                <span class="config-label">${this.i18n.t('settings.models') || '模型'}</span>
                <select 
                  @change=${(e: Event) => this.handleModelChange(r.id, (e.target as HTMLSelectElement).value)}
                  .value=${r.selectedModel}
                  ?disabled=${!provider?.models?.length}
                >
                  ${(provider?.models || []).map(m => html`
                    <option value=${m}>${m}</option>
                  `)}
                </select>
              </div>
            </div>
          </div>
        `;
      })}
      
      <div class="save-section">
        ${this.saveStatus !== 'idle' ? html`
          <span class="save-status ${this.saveStatus}">
            ${this.saveStatus === 'saving' ? '⏳ 保存中...' : 
              this.saveStatus === 'saved' ? '✅ 已保存' : 
              '❌ 保存失败'}
          </span>
        ` : ''}
        <button 
          class="save-button" 
          @click=${this.handleSave}
          ?disabled=${this.saving}
        >
          ${this.i18n.t('common.save') || '保存配置'}
        </button>
      </div>
    `;
  }
}
