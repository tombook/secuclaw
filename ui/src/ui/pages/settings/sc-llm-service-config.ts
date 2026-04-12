import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../../i18n/lib/lit-controller.js';
import { gatewayClient } from '../../gateway-client.js';
import '../../components/design-system/sc-button.js';
import '../../components/sc-smart-recommendation-bar.js';

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

  // Toast state
  @state()
  private toastMessage = '';

  @state()
  private toastType: 'success' | 'error' | 'info' = 'info';

  private toastTimeout: number | null = null;

  // Reliability: Auto-save
  private autoSaveTimer: number | null = null;
  private readonly AUTO_SAVE_INTERVAL = 30000; // 30秒自动保存
  private hasUnsavedChanges = false;

  // Reliability: Sync status
  @state()
  private syncStatus: 'synced' | 'pending' | 'error' = 'synced';

  @state()
  private lastSyncTime: string = '';

  // Reliability: Data version for conflict detection
  private dataVersion = 0;

  // Gateway status
  @state()
  private gatewayConnected = false;

  @state()
  private gatewayReconnecting = false;

  private gatewayStatusHandler: (() => void) | null = null;

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
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-lg);
    }
    .page-title { 
      font-size: var(--sc-font-size-2xl); 
      font-weight: 600; 
      color: var(--sc-text-primary); 
      margin: 0;
    }
    .page-subtitle {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-tertiary);
      margin-top: var(--sc-spacing-xs);
    }
    .loading {
      padding: var(--sc-spacing-xl);
      text-align: center;
      color: var(--sc-text-tertiary);
    }
    .provider-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: var(--sc-spacing-md);
    }
    .provider-card { 
      background: var(--sc-bg-card); 
      border: 1px solid var(--sc-border-color); 
      border-radius: var(--sc-radius-lg); 
      padding: var(--sc-spacing-lg);
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .provider-card:hover {
      border-color: var(--sc-primary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .provider-card.disabled {
      opacity: 0.6;
    }
    .provider-card.local .provider-icon { background: #10b98120; color: #10b981; }
    .provider-card.openai .provider-icon { background: #3b82f620; color: #3b82f6; }
    .provider-card.anthropic .provider-icon { background: #8b5cf620; color: #8b5cf6; }
    .provider-card.zhipu .provider-icon { background: #7c3aed20; color: #7c3aed; }
    .provider-card.minimax .provider-icon { background: #f59e0b20; color: #f59e0b; }
    .provider-card.azure .provider-icon { background: #0078d420; color: #0078d4; }
    .provider-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      margin-bottom: var(--sc-spacing-md); 
    }
    .provider-info {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md);
    }
    .provider-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--sc-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .provider-title {
      display: flex;
      flex-direction: column;
    }
    .provider-name { 
      font-size: var(--sc-font-size-lg); 
      font-weight: 600; 
      color: var(--sc-text-primary); 
    }
    .provider-type-badge { 
      display: inline-flex;
      align-items: center;
      padding: 2px 8px; 
      background: var(--sc-bg-tertiary); 
      border-radius: var(--sc-radius-full); 
      font-size: var(--sc-font-size-xs); 
      color: var(--sc-text-secondary);
      margin-top: 4px;
      width: fit-content;
    }
    .provider-status {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--sc-text-tertiary);
    }
    .status-dot.active {
      background: #10b981;
      box-shadow: 0 0 6px #10b98180;
    }
    .provider-detail { 
      font-size: var(--sc-font-size-sm); 
      color: var(--sc-text-secondary); 
      margin-bottom: var(--sc-spacing-sm); 
      display: flex;
      align-items: flex-start;
      gap: var(--sc-spacing-sm);
    }
    .provider-detail-icon {
      flex-shrink: 0;
      margin-top: 2px;
    }
    .provider-url {
      word-break: break-all;
      font-family: monospace;
      font-size: var(--sc-font-size-xs);
      background: var(--sc-bg-tertiary);
      padding: 2px 6px;
      border-radius: 4px;
    }
    .models-section {
      margin-top: var(--sc-spacing-md);
      padding-top: var(--sc-spacing-md);
      border-top: 1px solid var(--sc-border-color);
    }
    .models-label {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
      margin-bottom: var(--sc-spacing-sm);
    }
    .models-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-xs);
    }
    .model-tag { 
      display: inline-flex; 
      align-items: center; 
      gap: 4px; 
      padding: 4px 10px; 
      background: var(--sc-bg-tertiary); 
      border-radius: var(--sc-radius-sm); 
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-secondary);
    }
    .model-tag button { 
      background: none; 
      border: none; 
      color: var(--sc-text-tertiary); 
      cursor: pointer; 
      padding: 0; 
      margin-left: 4px;
      font-size: 14px;
      line-height: 1;
    }
    .model-tag button:hover {
      color: var(--sc-error);
    }
    .test-status {
      font-size: var(--sc-font-size-sm);
      padding: 4px 10px;
      border-radius: var(--sc-radius-sm);
      margin-top: var(--sc-spacing-sm);
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .test-status.success { background: #10b98120; color: #10b981; }
    .test-status.error { background: #ef444420; color: #ef4444; }
    .test-status.testing { background: #f59e0b20; color: #f59e0b; }
    .action-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: var(--sc-spacing-lg);
      padding-top: var(--sc-spacing-md);
      border-top: 1px solid var(--sc-border-color);
    }
    .action-row-left {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md);
    }
    .toggle-switch { 
      position: relative; 
      width: 44px; 
      height: 24px; 
      background: var(--sc-bg-tertiary); 
      border-radius: 12px; 
      cursor: pointer; 
      transition: background 0.2s;
    }
    .toggle-switch.active { 
      background: #10b981; 
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
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    }
    .toggle-switch.active::after { 
      transform: translateX(20px); 
    }
    .button-group {
      display: flex;
      gap: var(--sc-spacing-xs);
    }
    .add-button { 
      display: inline-flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
      padding: var(--sc-spacing-sm) var(--sc-spacing-lg); 
      background: var(--sc-primary); 
      color: white; 
      border: none; 
      border-radius: var(--sc-radius-md); 
      cursor: pointer; 
      font-weight: 500;
    }
    .add-button:hover { 
      background: var(--sc-primary-hover); 
    }
    .add-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .btn { 
      padding: var(--sc-spacing-sm) var(--sc-spacing-md); 
      border: none; 
      border-radius: var(--sc-radius-md); 
      cursor: pointer; 
      font-size: var(--sc-font-size-sm);
      font-weight: 500;
      transition: background 0.2s, opacity 0.2s;
    }
    .btn-primary { background: var(--sc-primary); color: white; }
    .btn-primary:hover { background: var(--sc-primary-hover); }
    .btn-secondary { background: var(--sc-bg-tertiary); color: var(--sc-text-primary); }
    .btn-secondary:hover { background: var(--sc-border-color); }
    .btn-danger { background: #ef4444; color: white; }
    .btn-danger:hover { background: #dc2626; }
    .btn-small { padding: 6px 12px; font-size: var(--sc-font-size-xs); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    
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
      min-width: 480px; 
      max-width: 560px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .form-title { 
      font-size: var(--sc-font-size-xl); 
      font-weight: 600; 
      color: var(--sc-text-primary); 
      margin-bottom: var(--sc-spacing-lg);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
    }
    .form-group { 
      margin-bottom: var(--sc-spacing-lg); 
    }
    .form-label { 
      display: block; 
      font-size: var(--sc-font-size-sm); 
      color: var(--sc-text-secondary); 
      margin-bottom: var(--sc-spacing-xs);
      font-weight: 500;
    }
    .form-input { 
      width: 100%; 
      padding: var(--sc-spacing-sm) var(--sc-spacing-md); 
      border: 1px solid var(--sc-border-color); 
      border-radius: var(--sc-radius-md); 
      background: var(--sc-input-bg); 
      color: var(--sc-text-primary); 
      box-sizing: border-box; 
      font-size: var(--sc-font-size-sm);
    }
    .form-input:focus { 
      outline: none; 
      border-color: var(--sc-primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    select.form-input {
      cursor: pointer;
    }
    .form-hint {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
      margin-top: 4px;
    }
    .form-actions { 
      display: flex; 
      gap: var(--sc-spacing-sm); 
      justify-content: flex-end; 
      margin-top: var(--sc-spacing-xl); 
      padding-top: var(--sc-spacing-lg);
      border-top: 1px solid var(--sc-border-color);
    }
    
    .empty-state {
      text-align: center;
      padding: var(--sc-spacing-2xl);
      color: var(--sc-text-tertiary);
    }
    .empty-icon {
      font-size: 48px;
      margin-bottom: var(--sc-spacing-md);
    }
    
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 20px;
      border-radius: var(--sc-radius-md);
      font-size: 14px;
      font-weight: 500;
      z-index: 1001;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .toast.success { background: #10b981; color: white; }
    .toast.error { background: #ef4444; color: white; }
    .toast.info { background: #3b82f6; color: white; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md);
    }
    .sync-status {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: var(--sc-radius-md);
      font-size: 12px;
      background: var(--sc-bg-tertiary);
    }
    .sync-status.synced {
      color: #10b981;
    }
    .sync-status.pending {
      color: #f59e0b;
    }
    .sync-status.error {
      color: #ef4444;
    }
    .sync-icon {
      font-size: 14px;
    }
    .sync-text {
      font-weight: 500;
    }
    .sync-time {
      color: var(--sc-text-tertiary);
      font-size: 11px;
    }
    .btn-icon {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: var(--sc-bg-tertiary);
      color: var(--sc-text-secondary);
      border: none;
      border-radius: var(--sc-radius-md);
      font-size: 12px;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
    }
    .btn-icon:hover {
      background: var(--sc-border-color);
      color: var(--sc-text-primary);
    }
    .gateway-status {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
      padding: 6px 12px;
      border-radius: var(--sc-radius-md);
      font-size: var(--sc-font-size-sm);
    }
    .gateway-status.connected {
      background: #10b98120;
      color: #10b981;
    }
    .gateway-status.disconnected {
      background: #ef444420;
      color: #ef4444;
    }
    .gateway-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .gateway-status.connected .gateway-dot {
      background: #10b981;
      box-shadow: 0 0 6px #10b98180;
    }
    .gateway-status.disconnected .gateway-dot {
      background: #ef4444;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .btn-restart {
      padding: 4px 10px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: var(--sc-radius-sm);
      font-size: var(--sc-font-size-xs);
      cursor: pointer;
      transition: background 0.2s, opacity 0.2s;
    }
    .btn-restart:hover {
      background: #dc2626;
    }
    .btn-restart.reconnecting {
      opacity: 0.7;
      cursor: wait;
    }
    .btn-restart:disabled {
      cursor: not-allowed;
    }
    .gateway-warning {
      display: flex;
      gap: var(--sc-spacing-lg);
      padding: var(--sc-spacing-lg);
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border: 1px solid #f59e0b;
      border-radius: var(--sc-radius-lg);
      margin-bottom: var(--sc-spacing-lg);
    }
    .gateway-warning .warning-icon {
      font-size: 32px;
      flex-shrink: 0;
    }
    .gateway-warning .warning-content {
      flex: 1;
    }
    .gateway-warning .warning-content h3 {
      margin: 0 0 var(--sc-spacing-sm) 0;
      font-size: var(--sc-font-size-lg);
      color: #92400e;
    }
    .gateway-warning .warning-content p {
      margin: 0 0 var(--sc-spacing-md) 0;
      font-size: var(--sc-font-size-sm);
      color: #a16207;
    }
    .btn-restart-large {
      padding: var(--sc-spacing-sm) var(--sc-spacing-lg);
      background: #f59e0b;
      color: white;
      border: none;
      border-radius: var(--sc-radius-md);
      font-size: var(--sc-font-size-sm);
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }
    .btn-restart-large:hover {
      background: #d97706;
    }
    .btn-restart-large.reconnecting {
      opacity: 0.7;
      cursor: wait;
    }
    .btn-restart-large:disabled {
      cursor: not-allowed;
    }
  `;

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

  // LocalStorage key for LLM providers
  private readonly STORAGE_KEY = 'secuclaw-llm-providers-v2';

  private loadFromLocalStorage(): LLMProvider[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as LLMProvider[];
      }
    } catch (e) {
      console.error('[LLM Config] Failed to load from localStorage:', e);
    }
    return [];
  }

  private saveToLocalStorage(providers: LLMProvider[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(providers));
    } catch (e) {
      console.error('[LLM Config] Failed to save to localStorage:', e);
    }
  }

  connectedCallback() {
    super.connectedCallback();
    this.gatewayConnected = gatewayClient.isConnected();
    
    // Listen for gateway connection changes
    this.gatewayStatusHandler = () => {
      this.gatewayConnected = gatewayClient.isConnected();
      if (this.gatewayConnected) {
        // Auto-sync when gateway reconnects
        this.syncToBackend();
      }
    };
    gatewayClient.onConnectionChange(this.gatewayStatusHandler);
    
    this.loadProviders();
    
    // Start auto-save timer for reliability
    this.startAutoSave();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.gatewayStatusHandler) {
      gatewayClient.onConnectionChange(this.gatewayStatusHandler);
    }
    // Save any pending changes before unload
    this.stopAutoSave();
    if (this.hasUnsavedChanges) {
      this.saveToLocalStorage(this.providers);
    }
  }

  // ==================== Reliability Features ====================

  private startAutoSave() {
    this.autoSaveTimer = window.setInterval(() => {
      if (this.hasUnsavedChanges) {
        this.saveToLocalStorage(this.providers);
        this.syncStatus = 'pending';
        this.syncToBackend().catch(() => {
          this.syncStatus = 'error';
        });
      }
    }, this.AUTO_SAVE_INTERVAL);
  }

  private stopAutoSave() {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  private _markUnsaved() {
    this.hasUnsavedChanges = true;
    this.syncStatus = 'pending';
    this.dataVersion++;
  }

  private async syncToBackend() {
    if (!gatewayClient.isConnected()) {
      return;
    }

    try {
      // Get current backend state
      const backendProviders = await gatewayClient.request<unknown>('llm.providers.list') as LLMProvider[];
      
      // Simple sync: add missing providers to backend
      for (const provider of this.providers) {
        const exists = backendProviders.some(p => p.id === provider.id);
        if (!exists) {
          await gatewayClient.request('llm.providers.add', {
            name: provider.name,
            type: provider.type,
            baseUrl: provider.baseUrl,
            apiKey: provider.apiKey || '',
            models: provider.models,
            enabled: provider.enabled,
          });
        }
      }
      
      this.syncStatus = 'synced';
      this.lastSyncTime = new Date().toLocaleTimeString();
      this.hasUnsavedChanges = false;
    } catch (error) {
      console.error('[LLM Config] Sync failed:', error);
      this.syncStatus = 'error';
    }
  }

  public exportConfig(): string {
    const config = {
      version: this.dataVersion,
      exportedAt: new Date().toISOString(),
      providers: this.providers,
    };
    return JSON.stringify(config, null, 2);
  }

  public async importConfig(jsonStr: string): Promise<boolean> {
    try {
      const config = JSON.parse(jsonStr);
      if (!config.providers || !Array.isArray(config.providers)) {
        this.showToast('导入格式错误：缺少 providers 数组', 'error');
        return false;
      }

      // Validate and normalize
      const validProviders = config.providers.map((p: Partial<LLMProvider>, i: number) => ({
        id: p.id || `imported_${Date.now()}_${i}`,
        name: p.name || '未命名',
        type: p.type || 'custom',
        baseUrl: p.baseUrl || '',
        apiKey: p.apiKey || '',
        models: Array.isArray(p.models) ? p.models : [],
        enabled: typeof p.enabled === 'boolean' ? p.enabled : true,
      }));

      this.providers = validProviders;
      this.hasUnsavedChanges = true;
      this.saveToLocalStorage(validProviders);
      await this.syncToBackend();

      this.showToast(`成功导入 ${validProviders.length} 个服务商`, 'success');
      return true;
    } catch (error) {
      console.error('[LLM Config] Import failed:', error);
      this.showToast('导入失败：' + (error as Error).message, 'error');
      return false;
    }
  }

  public createBackup(): void {
    const backup = {
      timestamp: Date.now(),
      data: this.exportConfig(),
    };
    const backupKey = `secuclaw-llm-backup-${Date.now()}`;
    localStorage.setItem(backupKey, JSON.stringify(backup));
    this.showToast('配置已备份到本地', 'success');
  }

  public async restoreFromBackup(backupKey: string): Promise<boolean> {
    try {
      const backupStr = localStorage.getItem(backupKey);
      if (!backupStr) {
        this.showToast('备份不存在', 'error');
        return false;
      }
      const backup = JSON.parse(backupStr);
      return await this.importConfig(backup.data);
    } catch (error) {
      this.showToast('恢复备份失败', 'error');
      return false;
    }
  }

  private async restartGateway() {
    this.gatewayReconnecting = true;
    this.showToast('正在重启网关...', 'info');
    
    try {
      // Try to reconnect the gateway client
      gatewayClient.disconnect();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await gatewayClient.connect();
      this.gatewayConnected = true;
      this.showToast('网关已重新连接', 'success');
      await this.loadProviders();
    } catch (error) {
      console.error('[Gateway] Restart failed:', error);
      this.showToast('网关重启失败，请检查服务是否运行', 'error');
    }
    this.gatewayReconnecting = false;
  }

  private async loadProviders() {
    this.loading = true;
    this.gatewayConnected = gatewayClient.isConnected();
    
    // 首先尝试从 localStorage 加载（用于离线或后端未保存数据的情况）
    const localProviders = this.loadFromLocalStorage();
    
    try {
      // 检查连接状态，最多等5秒
      if (!gatewayClient.isConnected()) {
        await gatewayClient.waitForConnection(5000);
        this.gatewayConnected = true;
      }
      
      const providers = await gatewayClient.request<unknown>('llm.providers.list');
      const list = Array.isArray(providers) ? providers : [];
      
      if (list.length > 0) {
        // 后端有数据，使用后端数据
        this.providers = list.map((provider, index) => this.normalizeProvider(provider, index));
        this.showToast(`已加载 ${this.providers.length} 个服务商配置`, 'success');
      } else if (localProviders.length > 0) {
        // 后端空，但本地有数据（可能后端没持久化），使用本地数据
        this.providers = localProviders;
        // 尝试同步本地数据到后端
        this.syncLocalToBackend(localProviders);
        this.showToast('后端无数据，已同步本地缓存', 'info');
      } else {
        // 都没有，显示预置示例
        this.providers = this.getFallbackProviders();
        this.showToast('显示预置服务商配置，请填写 API Key', 'info');
      }
    } catch (error) {
      console.error('[sc-llm-service-config] Failed to load providers:', error);
      this.gatewayConnected = false;
      // 后端请求失败，尝试使用本地数据或示例
      if (localProviders.length > 0) {
        this.providers = localProviders;
        this.showToast('网关未连接，使用本地缓存数据', 'info');
      } else {
        this.providers = this.getFallbackProviders();
        this.showToast('网关未连接，显示预置配置', 'info');
      }
    }
    this.loading = false;
    
    // Dispatch event to notify other components (AI Experts Config) that providers changed
    window.dispatchEvent(new CustomEvent('llm-providers-changed'));
  }

  private async syncLocalToBackend(providers: LLMProvider[]) {
    try {
      for (const provider of providers) {
        await gatewayClient.request('llm.providers.add', {
          name: provider.name,
          type: provider.type,
          baseUrl: provider.baseUrl,
          apiKey: provider.apiKey || '',
          models: provider.models,
          enabled: provider.enabled,
        });
      }
    } catch (e) {
      console.warn('[LLM Config] Failed to sync local providers to backend:', e);
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
    if (!this.newProvider.name || !this.newProvider.baseUrl) {
      this.showToast('请填写名称和URL', 'error');
      return;
    }

    // 如果后端未连接，使用本地存储
    if (!gatewayClient.isConnected()) {
      this.saveProviderLocally();
      return;
    }

    try {
      if (this.editingId) {
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
        this.showToast('配置更新成功', 'success');
      } else {
        const result = await gatewayClient.request<LLMProvider>('llm.providers.add', {
          name: this.newProvider.name,
          type: this.newProvider.type || 'openai',
          baseUrl: this.newProvider.baseUrl,
          apiKey: this.newProvider.apiKey || '',
          models: this.newProvider.models || [],
        });
        
        // 保存成功后同时更新本地存储
        const localProviders = this.loadFromLocalStorage();
        localProviders.push({ ...result, id: result.id || `provider_${Date.now()}` });
        this.saveToLocalStorage(localProviders);
        
        this.showToast('LLM服务商添加成功', 'success');
      }
      
      await this.loadProviders();
      // 延迟关闭表单，让用户看到成功提示
      setTimeout(() => {
        this.closeForm();
      }, 800);
    } catch (error) {
      console.error('[sc-llm-service-config] Failed to save provider:', error);
      // 后端请求失败，保存到本地存储
      this.saveProviderLocally();
    }
  }

  private saveProviderLocally() {
    const localProviders = this.loadFromLocalStorage();
    
    if (this.editingId) {
      // 更新现有
      const index = localProviders.findIndex(p => p.id === this.editingId);
      if (index >= 0) {
        localProviders[index] = {
          ...localProviders[index],
          name: this.newProvider.name || localProviders[index].name,
          type: this.newProvider.type || localProviders[index].type,
          baseUrl: this.newProvider.baseUrl || localProviders[index].baseUrl,
          apiKey: this.newProvider.apiKey || localProviders[index].apiKey,
          models: this.newProvider.models || localProviders[index].models,
        };
      }
      this.showToast('配置更新成功（本地保存）', 'success');
    } else {
      // 添加新项
      const newProvider: LLMProvider = {
        id: `local_${Date.now()}`,
        name: this.newProvider.name!,
        type: this.newProvider.type || 'openai',
        baseUrl: this.newProvider.baseUrl!,
        apiKey: this.newProvider.apiKey || '',
        models: this.newProvider.models || [],
        enabled: true,
      };
      localProviders.push(newProvider);
      this.showToast('LLM服务商添加成功（本地保存）', 'success');
    }
    
    this.saveToLocalStorage(localProviders);
    this.providers = localProviders;
    
    // Notify other components
    window.dispatchEvent(new CustomEvent('llm-providers-changed'));
    
    setTimeout(() => {
      this.closeForm();
    }, 800);
  }

  private async handleDelete(id: string) {
    if (!confirm('确定要删除这个LLM服务商吗？')) return;
    try {
      await gatewayClient.request('llm.providers.delete', { id });
      await this.loadProviders();
      this.showToast('LLM服务商已删除', 'success');
    } catch (error) {
      console.error('[sc-llm-service-config] Failed to delete provider:', error);
      this.showToast(`删除失败：${(error as Error).message || '后端未连接'}`, 'error');
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
      this.showToast(`${provider.name} ${!provider.enabled ? '已启用' : '已禁用'}`, 'success');
    } catch (error) {
      console.error('[sc-llm-service-config] Failed to toggle provider:', error);
      this.showToast(`切换状态失败：${(error as Error).message || '后端未连接'}`, 'error');
    }
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = window.setTimeout(() => {
      this.toastMessage = '';
    }, 3000);
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
      
      if (isSuccess) {
        this.showToast(`${provider.name} 连接成功`, 'success');
      } else {
        this.showToast(`${provider.name} 连接失败，请检查配置`, 'error');
      }
    } catch (e) {
      console.error('[sc-llm-service-config] Test failed:', e);
      this.testResults = { ...this.testResults, [provider.id]: 'error' };
      this.showToast(`连接测试失败：${(e as Error).message || '网络错误'}`, 'error');
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

  private handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        await this.importConfig(text);
      }
    };
    input.click();
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
        <div class="page-header">
          <div>
            <h1 class="page-title">${this.i18n.t('settings.llmConfig')}</h1>
            <p class="page-subtitle">管理 LLM 服务提供商配置</p>
          </div>
        </div>
        <div class="loading">${this.i18n.t('common.loading')}</div>
      `;
    }

    const getProviderIcon = (type: string) => {
      const icons: Record<string, string> = {
        'local': '🖥️',
        'openai': '🤖',
        'anthropic': '🧠',
        'zhipu': '📊',
        'minimax': '⚡',
        'azure': '☁️',
        'custom': '⚙️'
      };
      return icons[type?.toLowerCase()] || '🌐';
    };

    return html`
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <div class="page-header">
        <div>
          <h1 class="page-title">${this.i18n.t('settings.llmConfig')}</h1>
          <p class="page-subtitle">管理 LLM 服务提供商配置，支持 OpenAI、Claude、Ollama 等</p>
        </div>
        <div class="header-actions">
          <!-- Sync Status Indicator -->
          <div class="sync-status ${this.syncStatus}">
            ${this.syncStatus === 'synced' ? html`
              <span class="sync-icon">✅</span>
              <span class="sync-text">已同步</span>
            ` : this.syncStatus === 'pending' ? html`
              <span class="sync-icon">⏳</span>
              <span class="sync-text">同步中...</span>
            ` : html`
              <span class="sync-icon">⚠️</span>
              <span class="sync-text">同步失败</span>
            `}
            ${this.lastSyncTime ? html`
              <span class="sync-time">${this.lastSyncTime}</span>
            ` : ''}
          </div>
          
          <!-- Backup/Restore buttons -->
          <button class="btn-icon" @click=${() => this.createBackup()} title="备份配置">
            💾 备份
          </sc-button>
          <button class="btn-icon" @click=${() => this.handleImport()} title="导入配置">
            📂 导入
          </sc-button>
          <button class="btn-icon" @click=${() => this.syncToBackend()} title="手动同步">
            🔄 同步
          </sc-button>
          
          ${!this.gatewayConnected ? html`
            <div class="gateway-status disconnected">
              <span class="gateway-dot"></span>
              <span class="gateway-text">网关未连接</span>
              <button 
                class="btn-restart ${this.gatewayReconnecting ? 'reconnecting' : ''}" 
                @click=${this.restartGateway}
                ?disabled=${this.gatewayReconnecting}
              >
                ${this.gatewayReconnecting ? '🔄 连接中...' : '🔄 重启网关'}
              </sc-button>
            </div>
          ` : html`
            <div class="gateway-status connected">
              <span class="gateway-dot"></span>
              <span class="gateway-text">网关已连接</span>
            </div>
          `}
          <button class="add-button" @click=${this.openAddForm}>
            <span>+</span> 添加服务商
          </sc-button>
        </div>
      </div>
      
      ${!this.gatewayConnected ? html`
        <div class="gateway-warning">
          <div class="warning-icon">⚠️</div>
          <div class="warning-content">
            <h3>无法连接到 SecuClaw 网关</h3>
            <p>请确保网关服务正在运行。配置数据将保存在本地（重启服务后可同步到后端）。</p>
            <button class="btn-restart-large ${this.gatewayReconnecting ? 'reconnecting' : ''}" @click=${this.restartGateway} ?disabled=${this.gatewayReconnecting}>
              ${this.gatewayReconnecting ? '🔄 正在连接...' : '🔄 重启网关连接'}
            </sc-button>
          </div>
        </div>
      ` : ''}

      ${this.providers.length === 0 ? html`
        <div class="empty-state">
          <div class="empty-icon">🌐</div>
          <p>${this.i18n.t('chat.noProvider') || '未配置LLM服务提供商'}</p>
          <button class="add-button" @click=${this.openAddForm} style="margin-top: 16px;">
            <span>+</span> 添加第一个服务商
          </sc-button>
        </div>
      ` : html`
        <div class="provider-grid">
          ${this.providers.map(p => {
            const testStatus = this.testResults[p.id] || 'idle';
            const typeClass = p.type?.toLowerCase() || 'custom';
            return html`
              <div class="provider-card ${typeClass} ${!p.enabled ? 'disabled' : ''}">
                <div class="provider-header">
                  <div class="provider-info">
                    <div class="provider-icon">${getProviderIcon(p.type)}</div>
                    <div class="provider-title">
                      <span class="provider-name">${p.name}</span>
                      <span class="provider-type-badge">${p.type}</span>
                    </div>
                  </div>
                  <div class="provider-status">
                    <span class="status-dot ${p.enabled ? 'active' : ''}"></span>
                    <span style="font-size: 12px; color: var(--sc-text-tertiary);">
                      ${p.enabled ? '已启用' : '已禁用'}
                    </span>
                  </div>
                </div>
                
                <div class="provider-detail">
                  <span class="provider-detail-icon">🔗</span>
                  <span class="provider-url">${p.baseUrl}</span>
                </div>
                
                <div class="models-section">
                  <div class="models-label">可用模型 (${p.models?.length || 0})</div>
                  <div class="models-list">
                    ${(p.models || []).slice(0, 6).map(m => html`
                      <span class="model-tag">${m}</span>
                    `)}
                    ${(p.models || []).length > 6 ? html`
                      <span class="model-tag">+${p.models.length - 6} 更多</span>
                    ` : ''}
                  </div>
                </div>
                
                ${testStatus !== 'idle' ? html`
                  <div class="test-status ${testStatus}">
                    ${testStatus === 'testing' ? '⏳ 正在测试...' : 
                      testStatus === 'success' ? '✅ 连接成功' : 
                      '❌ 连接失败'}
                  </div>
                ` : ''}
                
                <div class="action-row">
                  <div class="action-row-left">
                    <div 
                      class="toggle-switch ${p.enabled ? 'active' : ''}" 
                      @click=${() => this.handleToggle(p.id)}
                      title="${p.enabled ? '点击禁用' : '点击启用'}"
                    ></div>
                    <span style="font-size: 12px; color: var(--sc-text-tertiary);">
                      ${p.enabled ? '启用中' : '已禁用'}
                    </span>
                  </div>
                  <div class="button-group">
                    <button 
                      variant="secondary" size="sm" 
                      @click=${() => this.handleTest(p)}
                      ?disabled=${testStatus === 'testing'}
                    >
                      ${testStatus === 'testing' ? '测试中...' : '测试连接'}
                    </sc-button>
                    <button 
                      variant="secondary" size="sm" 
                      @click=${() => this.openEditForm(p)}
                    >
                      编辑
                    </sc-button>
                    <button 
                      variant="danger" size="sm" 
                      @click=${() => this.handleDelete(p.id)}
                    >
                      删除
                    </sc-button>
                  </div>
                </div>
              </div>
            `;
          })}
        </div>
      `}

      ${this.showAddForm ? html`
        <div class="form-overlay" @click=${this.closeForm}>
          <div class="form-dialog" @click=${(e: Event) => e.stopPropagation()}>
            <h2 class="form-title">
              ${this.editingId ? '✏️ 编辑服务商' : '➕ 添加服务商'}
            </h2>
            
            <div class="form-group">
              <label class="form-label">服务商名称</label>
              <input 
                class="form-input" 
                type="text" 
                .value=${this.newProvider.name || ''} 
                @input=${(e: InputEvent) => this.updateField('name', (e.target as HTMLInputElement).value)} 
                placeholder="例如: OpenAI、Ollama (本地)" 
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">服务商类型</label>
              <select 
                class="form-input" 
                .value=${this.newProvider.type || 'openai'} 
                @change=${(e: Event) => this.updateField('type', (e.target as HTMLSelectElement).value)}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic Claude</option>
                <option value="zhipu">智谱 GLM</option>
                <option value="minimax">MiniMax</option>
                <option value="azure">Azure OpenAI</option>
                <option value="local">Local (Ollama)</option>
                <option value="custom">Custom (自定义)</option>
              </select>
              <p class="form-hint">选择对应的服务商类型，系统会自动适配 API 调用方式</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">API Base URL</label>
              <input 
                class="form-input" 
                type="text" 
                .value=${this.newProvider.baseUrl || ''} 
                @input=${(e: InputEvent) => this.updateField('baseUrl', (e.target as HTMLInputElement).value)} 
                placeholder="https://api.openai.com/v1 或 http://localhost:11434" 
              />
              <p class="form-hint">Ollama 本地部署通常为 http://localhost:11434</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">API Key</label>
              <input 
                class="form-input" 
                type="password" 
                .value=${this.newProvider.apiKey || ''} 
                @input=${(e: InputEvent) => this.updateField('apiKey', (e.target as HTMLInputElement).value)} 
                placeholder="sk-... (本地 Ollama 可留空)" 
              />
              <p class="form-hint">本地部署 Ollama 不需要 API Key</p>
            </div>
            
            <div class="form-group">
              <label class="form-label">模型列表</label>
              <div style="display: flex; gap: var(--sc-spacing-sm); margin-bottom: var(--sc-spacing-sm);">
                <input 
                  class="form-input" 
                  type="text" 
                  .value=${this.newModelInput} 
                  @input=${(e: InputEvent) => this.updateModelInput((e.target as HTMLInputElement).value)} 
                  @keydown=${this.handleModelKeydown} 
                  placeholder="输入模型名称，按 Enter 添加，如 gpt-4o" 
                  style="flex: 1" 
                />
                <sc-button variant="secondary" @click=${this.handleAddModel}>添加</sc-button>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: var(--sc-spacing-xs);">
                ${(this.newProvider.models || []).map(m => html`
                  <span class="model-tag">
                    ${m}
                    <sc-button variant="secondary" size="sm" @click=${() => this.handleRemoveModel(m)}>×</sc-button>
                  </span>
                `)}
              </div>
              <p class="form-hint">Ollama 可通过命令 ollama list 查看已安装模型</p>
            </div>
            
            <div class="form-actions">
              <sc-button variant="secondary" @click=${this.closeForm}>
                取消
              </sc-button>
              <sc-button variant="primary" @click=${this.handleSave}>
                ${this.i18n.t('common.save')}
              </sc-button>
            </div>
          </div>
        </div>
      ` : ''}
      
      ${this.renderToast()}
    `;
  }

  private renderToast() {
    if (!this.toastMessage) return html``;

    return html`
      <div class="toast ${this.toastType}">
        ${this.toastType === 'success' ? '✅ ' : this.toastType === 'error' ? '❌ ' : 'ℹ️ '}
        ${this.toastMessage}
      </div>
    `;
  }
}
