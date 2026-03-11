# SPEC-02: Frontend Architecture

> **Document Version**: 1.0  
> **Created**: 2026-03-08  
> **Purpose**: AI-Implementation-Ready Specification for SecuClaw Frontend Architecture

---

## 1. Core Components

### 1.1 App Root Component

**File**: `ui/src/ui/app.ts`

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Router, RouterLocation } from '@vaadin/router';
import './layout/sc-layout.js';
import './pages/sc-dashboard.js';
import './pages/sc-threats-page.js';
import './pages/sc-incidents-page.js';
import './pages/sc-vulnerabilities-page.js';
import './pages/sc-compliance-page.js';
import './pages/sc-reports-page.js';
import './pages/sc-risk-page.js';
import './pages/sc-war-room-page.js';
import './pages/sc-ai-experts-page.js';
import './pages/sc-knowledge-base.js';
import './pages/sc-skills-market.js';
import './pages/sc-channels-page.js';
import './pages/settings/sc-settings-page.js';
import './pages/settings/sc-llm-service-config.js';
import './pages/settings/sc-ai-experts-config.js';
import { gatewayClient } from './gateway-client.js';
import { initI18n, i18n } from '../i18n/index.js';
import { uiStore } from './store/ui-store.js';

@customElement('sc-app')
export class ScApp extends LitElement {
  @state()
  private connected = false;

  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background-color: var(--sc-bg-primary);
      color: var(--sc-text-primary);
    }

    .loading-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 1rem;
    }

    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 3px solid var(--sc-border-color);
      border-top-color: var(--sc-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-screen {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      text-align: center;
    }

    .error-icon {
      font-size: 48px;
      margin-bottom: 1rem;
    }

    .retry-button {
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: var(--sc-primary);
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  `;

  constructor() {
    super();
    this.initializeApp();
  }

  private async initializeApp() {
    try {
      // Initialize i18n
      await initI18n();

      // Connect to gateway
      await gatewayClient.connect();

      // Setup connection status listener
      gatewayClient.onConnectionChange((connected) => {
        this.connected = connected;
      });

      // Initialize router
      this.initRouter();

      this.loading = false;
    } catch (err) {
      console.error('Failed to initialize app:', err);
      this.error = err instanceof Error ? err.message : 'Initialization failed';
      this.loading = false;
    }
  }

  private initRouter() {
    const router = new Router(this.shadowRoot!.querySelector('#outlet'));
    
    router.setRoutes([
      { path: '/', component: 'sc-dashboard' },
      { path: '/threats', component: 'sc-threats-page' },
      { path: '/threats/:id', component: 'sc-threat-detail' },
      { path: '/incidents', component: 'sc-incidents-page' },
      { path: '/vulnerabilities', component: 'sc-vulnerabilities-page' },
      { path: '/compliance', component: 'sc-compliance-page' },
      { path: '/reports', component: 'sc-reports-page' },
      { path: '/risk', component: 'sc-risk-page' },
      { path: '/war-room', component: 'sc-war-room-page' },
      { path: '/ai-experts', component: 'sc-ai-experts-page' },
      { path: '/knowledge-base', component: 'sc-knowledge-base' },
      { path: '/skills-market', component: 'sc-skills-market' },
      { path: '/channels', component: 'sc-channels-page' },
      { path: '/settings', component: 'sc-settings-page' },
      { path: '/settings/llm-config', component: 'sc-llm-service-config' },
      { path: '/settings/ai-experts-config', component: 'sc-ai-experts-config' },
      { path: '(.*)', redirect: '/' },
    ]);

    // Store router reference globally
    (window as any).__router = router;
  }

  private handleRetry() {
    this.loading = true;
    this.error = null;
    this.initializeApp();
  }

  render() {
    if (this.loading) {
      return html`
        <div class="loading-screen">
          <div class="loading-spinner"></div>
          <span>${i18n.t('common.loading')}</span>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="error-screen">
          <div class="error-icon">⚠️</div>
          <h2>${i18n.t('errors.initializationFailed')}</h2>
          <p>${this.error}</p>
          <button class="retry-button" @click=${this.handleRetry}>
            ${i18n.t('common.retry')}
          </button>
        </div>
      `;
    }

    return html`
      <sc-layout .connected=${this.connected}>
        <div id="outlet"></div>
      </sc-layout>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-app': ScApp;
  }
}
```

---

### 1.2 Router Configuration

**File**: `ui/src/ui/router.ts`

```typescript
import { Router } from '@vaadin/router';

// Route definitions with lazy loading
export const routes = [
  {
    path: '/',
    name: 'dashboard',
    component: 'sc-dashboard',
    import: () => import('./pages/sc-dashboard.js'),
  },
  {
    path: '/threats',
    name: 'threats',
    component: 'sc-threats-page',
    import: () => import('./pages/sc-threats-page.js'),
    children: [
      {
        path: ':id',
        name: 'threat-detail',
        component: 'sc-threat-detail',
        import: () => import('./pages/sc-threat-detail.js'),
      },
    ],
  },
  {
    path: '/incidents',
    name: 'incidents',
    component: 'sc-incidents-page',
    import: () => import('./pages/sc-incidents-page.js'),
  },
  {
    path: '/vulnerabilities',
    name: 'vulnerabilities',
    component: 'sc-vulnerabilities-page',
    import: () => import('./pages/sc-vulnerabilities-page.js'),
  },
  {
    path: '/compliance',
    name: 'compliance',
    component: 'sc-compliance-page',
    import: () => import('./pages/sc-compliance-page.js'),
  },
  {
    path: '/reports',
    name: 'reports',
    component: 'sc-reports-page',
    import: () => import('./pages/sc-reports-page.js'),
  },
  {
    path: '/risk',
    name: 'risk',
    component: 'sc-risk-page',
    import: () => import('./pages/sc-risk-page.js'),
  },
  {
    path: '/war-room',
    name: 'war-room',
    component: 'sc-war-room-page',
    import: () => import('./pages/sc-war-room-page.js'),
  },
  {
    path: '/ai-experts',
    name: 'ai-experts',
    component: 'sc-ai-experts-page',
    import: () => import('./pages/sc-ai-experts-page.js'),
  },
  {
    path: '/knowledge-base',
    name: 'knowledge-base',
    component: 'sc-knowledge-base',
    import: () => import('./pages/sc-knowledge-base.js'),
  },
  {
    path: '/skills-market',
    name: 'skills-market',
    component: 'sc-skills-market',
    import: () => import('./pages/sc-skills-market.js'),
  },
  {
    path: '/channels',
    name: 'channels',
    component: 'sc-channels-page',
    import: () => import('./pages/sc-channels-page.js'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: 'sc-settings-page',
    import: () => import('./pages/settings/sc-settings-page.js'),
    children: [
      {
        path: 'llm-config',
        name: 'llm-config',
        component: 'sc-llm-service-config',
        import: () => import('./pages/settings/sc-llm-service-config.js'),
      },
      {
        path: 'ai-experts-config',
        name: 'ai-experts-config',
        component: 'sc-ai-experts-config',
        import: () => import('./pages/settings/sc-ai-experts-config.js'),
      },
    ],
  },
  {
    path: '(.*)',
    redirect: '/',
  },
];

// Navigation helper
export class RouterService {
  private static router: Router;

  static init(outlet: HTMLElement) {
    this.router = new Router(outlet);
    this.router.setRoutes(routes);
    return this.router;
  }

  static navigate(path: string) {
    this.router.go(path);
  }

  static getCurrentRoute() {
    return this.router.location;
  }

  static getRouteParams() {
    return this.router.location.params;
  }
}

// Export singleton
export const routerService = RouterService;
```

---

### 1.3 Gateway Client (WebSocket)

**File**: `ui/src/ui/gateway-client.ts`

```typescript
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
type MessageHandler = (data: unknown) => void;
type ConnectionHandler = (connected: boolean) => void;

interface RequestMessage {
  type: 'req';
  seq: number;
  method: string;
  params?: Record<string, unknown>;
}

interface ResponseMessage {
  type: 'res';
  seq: number;
  result?: unknown;
  error?: { code: string; message: string };
}

interface EventMessage {
  type: 'event';
  event: string;
  data?: unknown;
}

type GatewayMessage = RequestMessage | ResponseMessage | EventMessage;

class GatewayClient {
  private ws: WebSocket | null = null;
  private url: string;
  private status: ConnectionStatus = 'disconnected';
  private seq = 0;
  private pendingRequests = new Map<number, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }>();
  private eventHandlers = new Map<string, Set<MessageHandler>>();
  private connectionHandlers = new Set<ConnectionHandler>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000;
  private messageQueue: RequestMessage[] = [];

  constructor(url: string = 'ws://127.0.0.1:21981/ws') {
    this.url = url;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.status = 'connecting';
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[Gateway] Connected to', this.url);
        this.status = 'connected';
        this.reconnectAttempts = 0;
        this.flushMessageQueue();
        this.notifyConnectionHandlers(true);
        resolve();
      };

      this.ws.onclose = (event) => {
        console.log('[Gateway] Disconnected:', event.code, event.reason);
        this.status = 'disconnected';
        this.notifyConnectionHandlers(false);
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[Gateway] Error:', error);
        this.status = 'error';
        if (this.status === 'connecting') {
          reject(new Error('Connection failed'));
        }
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    this.status = 'disconnected';
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Connection closed'));
    });
    this.pendingRequests.clear();
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Gateway] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[Gateway] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  private handleMessage(data: string) {
    try {
      const message: GatewayMessage = JSON.parse(data);

      if (message.type === 'res') {
        const pending = this.pendingRequests.get(message.seq);
        if (pending) {
          clearTimeout(pending.timeout);
          this.pendingRequests.delete(message.seq);
          if (message.error) {
            pending.reject(new Error(message.error.message));
          } else {
            pending.resolve(message.result);
          }
        }
      } else if (message.type === 'event') {
        const handlers = this.eventHandlers.get(message.event);
        if (handlers) {
          handlers.forEach((handler) => handler(message.data));
        }
      }
    } catch (error) {
      console.error('[Gateway] Failed to parse message:', error);
    }
  }

  async request<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      const seq = ++this.seq;
      const message: RequestMessage = {
        type: 'req',
        seq,
        method,
        params,
      };

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(seq);
        reject(new Error(`Request timeout: ${method}`));
      }, 30000);

      this.pendingRequests.set(seq, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timeout,
      });

      if (this.status === 'connected' && this.ws) {
        this.ws.send(JSON.stringify(message));
      } else {
        this.messageQueue.push(message);
      }
    });
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()!;
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribe(event: string, handler: MessageHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);

    return () => {
      this.eventHandlers.get(event)?.delete(handler);
    };
  }

  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    handler(this.status === 'connected');
    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  private notifyConnectionHandlers(connected: boolean) {
    this.connectionHandlers.forEach((handler) => handler(connected));
  }

  isConnected(): boolean {
    return this.status === 'connected';
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }
}

// Export singleton instance
export const gatewayClient = new GatewayClient();
export type { GatewayClient, ConnectionStatus };
```

---

## 2. State Management

### 2.1 Base Store Pattern

**File**: `ui/src/ui/store/base-store.ts`

```typescript
type Subscriber<T> = (state: T) => void;

export abstract class BaseStore<T> {
  protected state: T;
  private subscribers = new Set<Subscriber<T>>();

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState(): T {
    return { ...this.state };
  }

  setState(updates: Partial<T>) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  subscribe(subscriber: Subscriber<T>): () => void {
    this.subscribers.add(subscriber);
    subscriber(this.getState()); // Initial notification
    return () => this.subscribers.delete(subscriber);
  }

  private notify() {
    const state = this.getState();
    this.subscribers.forEach((subscriber) => subscriber(state));
  }

  protected abstract initialize(): Promise<void>;
}
```

---

### 2.2 Commander Store

**File**: `ui/src/ui/store/commander-store.ts`

```typescript
import { BaseStore } from './base-store.js';
import { gatewayClient } from '../gateway-client.js';

// Types from ARCHITECTURE.md
interface RoleConfig {
  roleId: string;
  enabled: boolean;
  activatedAt?: number;
  customCapabilities?: Partial<Capabilities>;
}

interface LLMBinding {
  providerId: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
}

interface SkillState {
  installed: boolean;
  activated: boolean;
  installedAt?: number;
  activatedAt?: number;
  version: string;
}

interface CommanderSettings {
  language: 'zh-CN' | 'en' | 'zh-TW';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    channels: string[];
  };
}

interface Commander {
  id: string;
  name: string;
  type: 'personal' | 'organization' | 'government';
  organization?: string;
  createdAt: number;
  updatedAt: number;
  roles: RoleConfig[];
  primaryRole: string;
  llmBindings: Record<string, LLMBinding>;
  skillStates: Record<string, SkillState>;
  settings: CommanderSettings;
}

interface Capabilities {
  light: string[];
  dark: string[];
  security: string[];
  legal: string[];
  technology: string[];
  business: string[];
}

interface CommanderState {
  commander: Commander | null;
  loading: boolean;
  error: string | null;
}

class CommanderStore extends BaseStore<CommanderState> {
  constructor() {
    super({
      commander: null,
      loading: false,
      error: null,
    });
  }

  async initialize() {
    await this.loadCommander();
  }

  async loadCommander() {
    this.setState({ loading: true, error: null });
    try {
      const commander = await gatewayClient.request<Commander>('commander.get', {
        id: 'default',
      });
      this.setState({ commander, loading: false });
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to load commander',
        loading: false,
      });
    }
  }

  async activateRole(roleId: string) {
    if (!this.state.commander) return;
    try {
      await gatewayClient.request('commander.activateRole', {
        commanderId: this.state.commander.id,
        roleId,
      });
      await this.loadCommander();
    } catch (error) {
      console.error('Failed to activate role:', error);
      throw error;
    }
  }

  async deactivateRole(roleId: string) {
    if (!this.state.commander) return;
    try {
      await gatewayClient.request('commander.deactivateRole', {
        commanderId: this.state.commander.id,
        roleId,
      });
      await this.loadCommander();
    } catch (error) {
      console.error('Failed to deactivate role:', error);
      throw error;
    }
  }

  async bindLLM(roleId: string, binding: LLMBinding) {
    if (!this.state.commander) return;
    try {
      await gatewayClient.request('commander.bindLLM', {
        commanderId: this.state.commander.id,
        roleId,
        binding,
      });
      await this.loadCommander();
    } catch (error) {
      console.error('Failed to bind LLM:', error);
      throw error;
    }
  }

  async updateSettings(settings: Partial<CommanderSettings>) {
    if (!this.state.commander) return;
    try {
      await gatewayClient.request('commander.update', {
        id: this.state.commander.id,
        updates: { settings: { ...this.state.commander.settings, ...settings } },
      });
      await this.loadCommander();
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }

  getPrimaryRole(): string {
    return this.state.commander?.primaryRole || 'security-expert';
  }

  getActiveRoles(): RoleConfig[] {
    return this.state.commander?.roles.filter((r) => r.enabled) || [];
  }
}

export const commanderStore = new CommanderStore();
export type {
  Commander,
  RoleConfig,
  LLMBinding,
  SkillState,
  CommanderSettings,
  Capabilities,
};
```

---

### 2.3 Skill Store

**File**: `ui/src/ui/store/skill-store.ts`

```typescript
import { BaseStore } from './base-store.js';
import { gatewayClient } from '../gateway-client.js';

interface SkillDefinition {
  name: string;
  description: string;
  homepage: string;
  metadata: {
    openclaw: {
      emoji: string;
      role: string;
      combination: 'single' | 'binary' | 'ternary' | 'quaternary';
      version: string;
      capabilities: {
        light: string[];
        dark: string[];
        security: string[];
        legal: string[];
        technology: string[];
        business: string[];
      };
      mitre_coverage: string[];
      scf_coverage: string[];
    };
  };
  content: string;
}

interface SkillState {
  skills: Record<string, SkillDefinition>;
  activeSkillId: string | null;
  loading: boolean;
  error: string | null;
}

class SkillStore extends BaseStore<SkillState> {
  constructor() {
    super({
      skills: {},
      activeSkillId: null,
      loading: false,
      error: null,
    });
  }

  async initialize() {
    await this.loadSkills();
  }

  async loadSkills() {
    this.setState({ loading: true, error: null });
    try {
      const skills = await gatewayClient.request<Record<string, SkillDefinition>>('skills.list');
      this.setState({ skills, loading: false });
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to load skills',
        loading: false,
      });
    }
  }

  async loadSkill(roleId: string) {
    try {
      const skill = await gatewayClient.request<SkillDefinition>('skills.get', { roleId });
      this.setState({
        skills: { ...this.state.skills, [roleId]: skill },
      });
    } catch (error) {
      console.error('Failed to load skill:', error);
      throw error;
    }
  }

  setActiveSkill(skillId: string | null) {
    this.setState({ activeSkillId: skillId });
  }

  getActiveSkill(): SkillDefinition | null {
    if (!this.state.activeSkillId) return null;
    return this.state.skills[this.state.activeSkillId] || null;
  }

  getSkill(roleId: string): SkillDefinition | null {
    return this.state.skills[roleId] || null;
  }

  getAllSkills(): SkillDefinition[] {
    return Object.values(this.state.skills);
  }
}

export const skillStore = new SkillStore();
export type { SkillDefinition };
```

---

### 2.4 UI Store

**File**: `ui/src/ui/store/ui-store.ts`

```typescript
import { BaseStore } from './base-store.js';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  locale: 'zh-CN' | 'en' | 'zh-TW';
  sidebarCollapsed: boolean;
  loading: boolean;
  notifications: Notification[];
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

class UIStore extends BaseStore<UIState> {
  constructor() {
    super({
      theme: (localStorage.getItem('secuclaw-theme') as UIState['theme']) || 'dark',
      locale: (localStorage.getItem('secuclaw-locale') as UIState['locale']) || 'zh-CN',
      sidebarCollapsed: localStorage.getItem('secuclaw-sidebar-collapsed') === 'true',
      loading: false,
      notifications: [],
    });
  }

  async initialize() {
    this.applyTheme();
  }

  setTheme(theme: UIState['theme']) {
    this.setState({ theme });
    localStorage.setItem('secuclaw-theme', theme);
    this.applyTheme();
  }

  private applyTheme() {
    const { theme } = this.state;
    let effectiveTheme = theme;
    
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }

  setLocale(locale: UIState['locale']) {
    this.setState({ locale });
    localStorage.setItem('secuclaw-locale', locale);
  }

  toggleSidebar() {
    const collapsed = !this.state.sidebarCollapsed;
    this.setState({ sidebarCollapsed: collapsed });
    localStorage.setItem('secuclaw-sidebar-collapsed', String(collapsed));
  }

  showNotification(notification: Omit<Notification, 'id'>) {
    const id = crypto.randomUUID();
    const newNotification = { ...notification, id };
    this.setState({
      notifications: [...this.state.notifications, newNotification],
    });

    if (notification.duration !== 0) {
      setTimeout(() => this.dismissNotification(id), notification.duration || 5000);
    }
  }

  dismissNotification(id: string) {
    this.setState({
      notifications: this.state.notifications.filter((n) => n.id !== id),
    });
  }

  setLoading(loading: boolean) {
    this.setState({ loading });
  }
}

export const uiStore = new UIStore();
export type { Notification };
```

---

## 3. i18n System

### 3.1 I18n Manager

**File**: `ui/src/i18n/lib/translate.ts`

```typescript
type Locale = 'zh-CN' | 'en' | 'zh-TW';
type TranslationMap = Record<string, string | TranslationMap>;

interface I18nConfig {
  defaultLocale: Locale;
  supportedLocales: Locale[];
}

class I18nManager {
  private locale: Locale;
  private translations: Map<Locale, TranslationMap> = new Map();
  private subscribers = new Set<() => void>();

  constructor(config: I18nConfig) {
    this.locale = config.defaultLocale;
  }

  async setLocale(locale: Locale) {
    if (!this.translations.has(locale)) {
      await this.loadLocale(locale);
    }
    this.locale = locale;
    this.notify();
  }

  getLocale(): Locale {
    return this.locale;
  }

  private async loadLocale(locale: Locale) {
    const module = await import(`../locales/${locale}.js`);
    this.translations.set(locale, module.default || module[locale]);
  }

  t(key: string, params?: Record<string, string>): string {
    const translation = this.translations.get(this.locale);
    if (!translation) return key;

    const value = this.getNestedValue(translation, key);
    if (value === undefined) return key;

    if (params) {
      return Object.entries(params).reduce(
        (str, [k, v]) => str.replace(new RegExp(`\\{${k}\\}`, 'g'), v),
        value
      );
    }

    return value;
  }

  private getNestedValue(obj: TranslationMap, key: string): string | undefined {
    const keys = key.split('.');
    let current: TranslationMap | string = obj;

    for (const k of keys) {
      if (typeof current === 'string') return undefined;
      current = current[k];
      if (current === undefined) return undefined;
    }

    return typeof current === 'string' ? current : undefined;
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    this.subscribers.forEach((callback) => callback());
  }

  async initialize(defaultLocale: Locale) {
    await this.loadLocale(defaultLocale);
    this.locale = defaultLocale;
  }
}

export const i18n = new I18nManager({
  defaultLocale: 'zh-CN',
  supportedLocales: ['zh-CN', 'en', 'zh-TW'],
});

export type { Locale, TranslationMap };
```

---

### 3.2 Lit Controller

**File**: `ui/src/i18n/lib/lit-controller.ts`

```typescript
import { ReactiveController, ReactiveControllerHost } from 'lit';
import { i18n, Locale } from './translate.js';

export class I18nController implements ReactiveController {
  private host: ReactiveControllerHost;
  private unsubscribe: (() => void) | null = null;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    host.addController(this);
  }

  hostConnected() {
    this.unsubscribe = i18n.subscribe(() => {
      this.host.requestUpdate();
    });
  }

  hostDisconnected() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  t(key: string, params?: Record<string, string>): string {
    return i18n.t(key, params);
  }

  getLocale(): Locale {
    return i18n.getLocale();
  }

  async setLocale(locale: Locale) {
    await i18n.setLocale(locale);
  }
}
```

---

### 3.3 Locale Files

**File**: `ui/src/i18n/locales/zh-CN.ts`

```typescript
export const zh_CN = {
  common: {
    loading: '加载中...',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    edit: '编辑',
    search: '搜索',
    retry: '重试',
    confirm: '确认',
    close: '关闭',
    add: '添加',
    update: '更新',
    enable: '启用',
    disable: '禁用',
    status: '状态',
    actions: '操作',
    details: '详情',
    settings: '设置',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    noData: '暂无数据',
    success: '操作成功',
    failed: '操作失败',
  },

  nav: {
    dashboard: '仪表盘',
    threats: '威胁情报',
    incidents: '安全事件',
    vulnerabilities: '漏洞管理',
    compliance: '合规审计',
    reports: '分析报告',
    risk: '安全风险',
    warRoom: '作战室',
    aiExperts: 'AI安全专家',
    knowledgeBase: '知识库',
    skillsMarket: '技能市场',
    channels: '通讯管理',
    settings: '系统设置',
  },

  roles: {
    'security-expert': '安全专家',
    'privacy-officer': '隐私安全官',
    'security-architect': '安全架构师',
    'business-security-officer': '业务安全官',
    'secuclaw-commander': '全域安全指挥官',
    ciso: '首席信息安全官',
    'security-ops': '安全运营官',
    'supply-chain-security': '供应链安全官',
  },

  capabilities: {
    light: '光明面',
    dark: '黑暗面',
    security: '安全技术',
    legal: '法律合规',
    technology: '技术架构',
    business: '业务',
  },

  connection: {
    connected: '已连接',
    disconnected: '已断开',
    connecting: '连接中',
    error: '连接错误',
  },

  errors: {
    initializationFailed: '初始化失败',
    loadFailed: '加载失败',
    saveFailed: '保存失败',
    connectionFailed: '连接失败',
    notFound: '未找到',
    unauthorized: '未授权',
    forbidden: '禁止访问',
  },

  settings: {
    llmConfig: 'LLM服务配置',
    aiExpertsConfig: 'AI专家配置',
    theme: '主题',
    language: '语言',
    notifications: '通知',
  },

  knowledge: {
    mitre: 'MITRE ATT&CK',
    scf: 'SCF控制框架',
    tactics: '战术',
    techniques: '技术',
    controls: '控制项',
    domains: '域',
    search: '搜索知识库',
  },
};

export default zh_CN;
```

**File**: `ui/src/i18n/locales/en.ts`

```typescript
export const en = {
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    retry: 'Retry',
    confirm: 'Confirm',
    close: 'Close',
    add: 'Add',
    update: 'Update',
    enable: 'Enable',
    disable: 'Disable',
    status: 'Status',
    actions: 'Actions',
    details: 'Details',
    settings: 'Settings',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    noData: 'No data',
    success: 'Success',
    failed: 'Failed',
  },

  nav: {
    dashboard: 'Dashboard',
    threats: 'Threats',
    incidents: 'Incidents',
    vulnerabilities: 'Vulnerabilities',
    compliance: 'Compliance',
    reports: 'Reports',
    risk: 'Risk',
    warRoom: 'War Room',
    aiExperts: 'AI Experts',
    knowledgeBase: 'Knowledge Base',
    skillsMarket: 'Skills Market',
    channels: 'Channels',
    settings: 'Settings',
  },

  roles: {
    'security-expert': 'Security Expert',
    'privacy-officer': 'Privacy Officer',
    'security-architect': 'Security Architect',
    'business-security-officer': 'Business Security Officer',
    'secuclaw-commander': 'SecuClaw Commander',
    ciso: 'CISO',
    'security-ops': 'Security Ops',
    'supply-chain-security': 'Supply Chain Security',
  },

  capabilities: {
    light: 'Light',
    dark: 'Dark',
    security: 'Security',
    legal: 'Legal',
    technology: 'Technology',
    business: 'Business',
  },

  connection: {
    connected: 'Connected',
    disconnected: 'Disconnected',
    connecting: 'Connecting',
    error: 'Error',
  },

  errors: {
    initializationFailed: 'Initialization failed',
    loadFailed: 'Load failed',
    saveFailed: 'Save failed',
    connectionFailed: 'Connection failed',
    notFound: 'Not found',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
  },

  settings: {
    llmConfig: 'LLM Service Config',
    aiExpertsConfig: 'AI Experts Config',
    theme: 'Theme',
    language: 'Language',
    notifications: 'Notifications',
  },

  knowledge: {
    mitre: 'MITRE ATT&CK',
    scf: 'SCF Controls',
    tactics: 'Tactics',
    techniques: 'Techniques',
    controls: 'Controls',
    domains: 'Domains',
    search: 'Search Knowledge Base',
  },
};

export default en;
```

**File**: `ui/src/i18n/locales/zh-TW.ts`

```typescript
export const zh_TW = {
  common: {
    loading: '載入中...',
    save: '儲存',
    cancel: '取消',
    delete: '刪除',
    edit: '編輯',
    search: '搜尋',
    retry: '重試',
    confirm: '確認',
    close: '關閉',
    add: '新增',
    update: '更新',
    enable: '啟用',
    disable: '停用',
    status: '狀態',
    actions: '操作',
    details: '詳情',
    settings: '設定',
    back: '返回',
    next: '下一步',
    previous: '上一步',
    noData: '暫無資料',
    success: '操作成功',
    failed: '操作失敗',
  },

  nav: {
    dashboard: '儀表板',
    threats: '威脅情資',
    incidents: '安全事件',
    vulnerabilities: '漏洞管理',
    compliance: '合規審計',
    reports: '分析報告',
    risk: '安全風險',
    warRoom: '作戰室',
    aiExperts: 'AI安全專家',
    knowledgeBase: '知識庫',
    skillsMarket: '技能市集',
    channels: '通訊管理',
    settings: '系統設定',
  },

  roles: {
    'security-expert': '安全專家',
    'privacy-officer': '隱私安全官',
    'security-architect': '安全架構師',
    'business-security-officer': '業務安全官',
    'secuclaw-commander': '全域安全指揮官',
    ciso: '首席資訊安全官',
    'security-ops': '安全營運官',
    'supply-chain-security': '供應鏈安全官',
  },

  capabilities: {
    light: '光明面',
    dark: '黑暗面',
    security: '安全技術',
    legal: '法律合規',
    technology: '技術架構',
    business: '業務',
  },

  connection: {
    connected: '已連線',
    disconnected: '已斷線',
    connecting: '連線中',
    error: '連線錯誤',
  },

  errors: {
    initializationFailed: '初始化失敗',
    loadFailed: '載入失敗',
    saveFailed: '儲存失敗',
    connectionFailed: '連線失敗',
    notFound: '未找到',
    unauthorized: '未授權',
    forbidden: '禁止存取',
  },

  settings: {
    llmConfig: 'LLM服務設定',
    aiExpertsConfig: 'AI專家設定',
    theme: '主題',
    language: '語言',
    notifications: '通知',
  },

  knowledge: {
    mitre: 'MITRE ATT&CK',
    scf: 'SCF控制框架',
    tactics: '戰術',
    techniques: '技術',
    controls: '控制項',
    domains: '域',
    search: '搜尋知識庫',
  },
};

export default zh_TW;
```

---

### 3.4 i18n Index

**File**: `ui/src/i18n/index.ts`

```typescript
export { i18n, type Locale, type TranslationMap } from './lib/translate.js';
export { I18nController } from './lib/lit-controller.js';

export async function initI18n() {
  const savedLocale = localStorage.getItem('secuclaw-locale') as Locale | null;
  const locale = savedLocale || 'zh-CN';
  await i18n.initialize(locale);
}

import type { Locale } from './lib/translate.js';
```

---

## 4. Theme System

### 4.1 Main CSS

**File**: `ui/src/styles/main.css`

```css
/* CSS Reset and Base Styles */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  /* Typography */
  --sc-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --sc-font-mono: 'SF Mono', 'Fira Code', Consolas, monospace;
  --sc-font-size-xs: 0.75rem;
  --sc-font-size-sm: 0.875rem;
  --sc-font-size-md: 1rem;
  --sc-font-size-lg: 1.125rem;
  --sc-font-size-xl: 1.25rem;
  --sc-font-size-2xl: 1.5rem;
  --sc-font-size-3xl: 2rem;

  /* Spacing */
  --sc-spacing-xs: 0.25rem;
  --sc-spacing-sm: 0.5rem;
  --sc-spacing-md: 1rem;
  --sc-spacing-lg: 1.5rem;
  --sc-spacing-xl: 2rem;
  --sc-spacing-2xl: 3rem;

  /* Border Radius */
  --sc-radius-sm: 4px;
  --sc-radius-md: 8px;
  --sc-radius-lg: 12px;
  --sc-radius-full: 9999px;

  /* Shadows */
  --sc-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --sc-shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --sc-shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --sc-transition-fast: 150ms ease;
  --sc-transition-normal: 250ms ease;
  --sc-transition-slow: 350ms ease;

  /* Z-index layers */
  --sc-z-dropdown: 100;
  --sc-z-modal: 200;
  --sc-z-toast: 300;
}

html {
  font-size: 16px;
  line-height: 1.5;
}

body {
  font-family: var(--sc-font-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Utility Classes */
.visually-hidden {
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

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### 4.2 Light Theme

**File**: `ui/src/styles/themes/light.css`

```css
[data-theme="light"] {
  /* Primary Colors */
  --sc-primary: #3b82f6;
  --sc-primary-hover: #2563eb;
  --sc-primary-light: #dbeafe;
  
  /* Secondary Colors */
  --sc-secondary: #64748b;
  --sc-secondary-hover: #475569;
  
  /* Accent Colors */
  --sc-accent: #8b5cf6;
  --sc-accent-hover: #7c3aed;

  /* Background Colors */
  --sc-bg-primary: #ffffff;
  --sc-bg-secondary: #f8fafc;
  --sc-bg-tertiary: #f1f5f9;
  --sc-bg-card: #ffffff;
  --sc-bg-hover: #f1f5f9;

  /* Text Colors */
  --sc-text-primary: #0f172a;
  --sc-text-secondary: #475569;
  --sc-text-tertiary: #94a3b8;
  --sc-text-inverse: #ffffff;

  /* Border Colors */
  --sc-border-color: #e2e8f0;
  --sc-border-focus: #3b82f6;

  /* Status Colors */
  --sc-success: #22c55e;
  --sc-success-bg: #dcfce7;
  --sc-warning: #f59e0b;
  --sc-warning-bg: #fef3c7;
  --sc-error: #ef4444;
  --sc-error-bg: #fee2e2;
  --sc-info: #3b82f6;
  --sc-info-bg: #dbeafe;

  /* Sidebar */
  --sc-sidebar-bg: #f8fafc;
  --sc-sidebar-border: #e2e8f0;
  --sc-sidebar-item-hover: #e2e8f0;
  --sc-sidebar-item-active: #dbeafe;

  /* Input */
  --sc-input-bg: #ffffff;
  --sc-input-border: #e2e8f0;
  --sc-input-focus: #3b82f6;
  --sc-input-placeholder: #94a3b8;

  /* Code */
  --sc-code-bg: #f1f5f9;
  --sc-code-text: #0f172a;
}
```

### 4.3 Dark Theme

**File**: `ui/src/styles/themes/dark.css`

```css
[data-theme="dark"] {
  /* Primary Colors */
  --sc-primary: #3b82f6;
  --sc-primary-hover: #60a5fa;
  --sc-primary-light: #1e3a5f;
  
  /* Secondary Colors */
  --sc-secondary: #94a3b8;
  --sc-secondary-hover: #cbd5e1;
  
  /* Accent Colors */
  --sc-accent: #a78bfa;
  --sc-accent-hover: #c4b5fd;

  /* Background Colors */
  --sc-bg-primary: #0f172a;
  --sc-bg-secondary: #1e293b;
  --sc-bg-tertiary: #334155;
  --sc-bg-card: #1e293b;
  --sc-bg-hover: #334155;

  /* Text Colors */
  --sc-text-primary: #f8fafc;
  --sc-text-secondary: #cbd5e1;
  --sc-text-tertiary: #64748b;
  --sc-text-inverse: #0f172a;

  /* Border Colors */
  --sc-border-color: #334155;
  --sc-border-focus: #3b82f6;

  /* Status Colors */
  --sc-success: #22c55e;
  --sc-success-bg: #14532d;
  --sc-warning: #f59e0b;
  --sc-warning-bg: #78350f;
  --sc-error: #ef4444;
  --sc-error-bg: #7f1d1d;
  --sc-info: #3b82f6;
  --sc-info-bg: #1e3a5f;

  /* Sidebar */
  --sc-sidebar-bg: #0f172a;
  --sc-sidebar-border: #1e293b;
  --sc-sidebar-item-hover: #1e293b;
  --sc-sidebar-item-active: #1e3a5f;

  /* Input */
  --sc-input-bg: #1e293b;
  --sc-input-border: #334155;
  --sc-input-focus: #3b82f6;
  --sc-input-placeholder: #64748b;

  /* Code */
  --sc-code-bg: #1e293b;
  --sc-code-text: #f8fafc;
}
```

---

## 5. Layout Components

### 5.1 sc-layout

**File**: `ui/src/ui/layout/sc-layout.ts`

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './sc-sidebar.js';
import './sc-header.js';

@customElement('sc-layout')
export class ScLayout extends LitElement {
  @property({ type: Boolean })
  connected = false;

  static styles = css`
    :host {
      display: flex;
      min-height: 100vh;
    }

    .layout-container {
      display: flex;
      width: 100%;
    }

    sc-sidebar {
      flex-shrink: 0;
    }

    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    sc-header {
      flex-shrink: 0;
    }

    .content {
      flex: 1;
      padding: var(--sc-spacing-lg);
      overflow-y: auto;
      background-color: var(--sc-bg-secondary);
    }

    @media (max-width: 768px) {
      .content {
        padding: var(--sc-spacing-md);
      }
    }
  `;

  render() {
    return html`
      <div class="layout-container">
        <sc-sidebar></sc-sidebar>
        <div class="main-area">
          <sc-header .connected=${this.connected}></sc-header>
          <main class="content">
            <slot></slot>
          </main>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-layout': ScLayout;
  }
}
```

### 5.2 sc-sidebar

**File**: `ui/src/ui/layout/sc-sidebar.ts`

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { i18n } from '../../i18n/index.js';
import { uiStore } from '../store/ui-store.js';
import { routerService } from '../router.js';

interface NavItem {
  path: string;
  icon: string;
  labelKey: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: '📊', labelKey: 'nav.dashboard' },
  { path: '/threats', icon: '🔍', labelKey: 'nav.threats' },
  { path: '/incidents', icon: '🚨', labelKey: 'nav.incidents' },
  { path: '/vulnerabilities', icon: '🐛', labelKey: 'nav.vulnerabilities' },
  { path: '/compliance', icon: '✅', labelKey: 'nav.compliance' },
  { path: '/reports', icon: '📄', labelKey: 'nav.reports' },
  { path: '/risk', icon: '⚠️', labelKey: 'nav.risk' },
  { path: '/war-room', icon: '🎯', labelKey: 'nav.warRoom' },
  { path: '/ai-experts', icon: '🤖', labelKey: 'nav.aiExperts' },
  { path: '/knowledge-base', icon: '📚', labelKey: 'nav.knowledgeBase' },
  { path: '/skills-market', icon: '🛒', labelKey: 'nav.skillsMarket' },
  { path: '/channels', icon: '💬', labelKey: 'nav.channels' },
  { path: '/settings', icon: '⚙️', labelKey: 'nav.settings' },
];

@customElement('sc-sidebar')
export class ScSidebar extends LitElement {
  @state()
  private collapsed = false;

  @state()
  private currentPath = '/';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 240px;
      background-color: var(--sc-sidebar-bg);
      border-right: 1px solid var(--sc-sidebar-border);
      transition: width var(--sc-transition-normal);
    }

    :host([collapsed]) {
      width: 64px;
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 64px;
      padding: var(--sc-spacing-md);
      border-bottom: 1px solid var(--sc-sidebar-border);
    }

    .logo-icon {
      font-size: 24px;
    }

    .logo-text {
      margin-left: var(--sc-spacing-sm);
      font-size: var(--sc-font-size-lg);
      font-weight: 600;
      color: var(--sc-text-primary);
    }

    :host([collapsed]) .logo-text {
      display: none;
    }

    .nav-list {
      flex: 1;
      list-style: none;
      padding: var(--sc-spacing-md) 0;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: var(--sc-spacing-sm) var(--sc-spacing-md);
      margin: var(--sc-spacing-xs) var(--sc-spacing-sm);
      border-radius: var(--sc-radius-md);
      cursor: pointer;
      color: var(--sc-text-secondary);
      text-decoration: none;
      transition: all var(--sc-transition-fast);
    }

    .nav-item:hover {
      background-color: var(--sc-sidebar-item-hover);
      color: var(--sc-text-primary);
    }

    .nav-item.active {
      background-color: var(--sc-sidebar-item-active);
      color: var(--sc-primary);
    }

    .nav-icon {
      font-size: 20px;
      min-width: 24px;
      text-align: center;
    }

    .nav-label {
      margin-left: var(--sc-spacing-md);
      font-size: var(--sc-font-size-sm);
      white-space: nowrap;
    }

    :host([collapsed]) .nav-label {
      display: none;
    }

    .toggle-button {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 40px;
      margin: var(--sc-spacing-sm);
      border: none;
      background-color: transparent;
      color: var(--sc-text-secondary);
      cursor: pointer;
      border-radius: var(--sc-radius-md);
    }

    .toggle-button:hover {
      background-color: var(--sc-sidebar-item-hover);
    }
  `;

  constructor() {
    super();
    this.collapsed = uiStore.getState().sidebarCollapsed;
    uiStore.subscribe((state) => {
      this.collapsed = state.sidebarCollapsed;
    });
  }

  private handleNavigate(path: string) {
    routerService.navigate(path);
    this.currentPath = path;
  }

  private handleToggle() {
    uiStore.toggleSidebar();
  }

  render() {
    return html`
      <div class="logo">
        <span class="logo-icon">🛡️</span>
        ${!this.collapsed ? html`<span class="logo-text">SecuClaw</span>` : ''}
      </div>
      
      <ul class="nav-list">
        ${navItems.map(
          (item) => html`
            <li
              class="nav-item ${this.currentPath === item.path ? 'active' : ''}"
              @click=${() => this.handleNavigate(item.path)}
            >
              <span class="nav-icon">${item.icon}</span>
              ${!this.collapsed
                ? html`<span class="nav-label">${i18n.t(item.labelKey)}</span>`
                : ''}
            </li>
          `
        )}
      </ul>

      <button class="toggle-button" @click=${this.handleToggle}>
        ${this.collapsed ? '▶' : '◀'}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-sidebar': ScSidebar;
  }
}
```

### 5.3 sc-header

**File**: `ui/src/ui/layout/sc-header.ts`

```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { i18n, Locale } from '../../i18n/index.js';
import { uiStore } from '../store/ui-store.js';

@customElement('sc-header')
export class ScHeader extends LitElement {
  @property({ type: Boolean })
  connected = false;

  @state()
  private locale: Locale = 'zh-CN';

  @state()
  private theme: 'light' | 'dark' | 'system' = 'dark';

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      padding: 0 var(--sc-spacing-lg);
      background-color: var(--sc-bg-card);
      border-bottom: 1px solid var(--sc-border-color);
    }

    .left-section {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md);
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs);
      padding: var(--sc-spacing-xs) var(--sc-spacing-sm);
      border-radius: var(--sc-radius-full);
      font-size: var(--sc-font-size-sm);
    }

    .connection-status.connected {
      background-color: var(--sc-success-bg);
      color: var(--sc-success);
    }

    .connection-status.disconnected {
      background-color: var(--sc-error-bg);
      color: var(--sc-error);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: currentColor;
    }

    .right-section {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md);
    }

    .icon-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background-color: transparent;
      color: var(--sc-text-secondary);
      cursor: pointer;
      border-radius: var(--sc-radius-md);
      transition: all var(--sc-transition-fast);
    }

    .icon-button:hover {
      background-color: var(--sc-bg-hover);
      color: var(--sc-text-primary);
    }

    .locale-select {
      padding: var(--sc-spacing-xs) var(--sc-spacing-sm);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      background-color: var(--sc-input-bg);
      color: var(--sc-text-primary);
      font-size: var(--sc-font-size-sm);
      cursor: pointer;
    }

    .locale-select:focus {
      outline: none;
      border-color: var(--sc-input-focus);
    }
  `;

  constructor() {
    super();
    const state = uiStore.getState();
    this.locale = state.locale;
    this.theme = state.theme;

    uiStore.subscribe((state) => {
      this.locale = state.locale;
      this.theme = state.theme;
    });
  }

  private handleLocaleChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    const locale = select.value as Locale;
    i18n.setLocale(locale);
    uiStore.setLocale(locale);
  }

  private handleThemeToggle() {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    uiStore.setTheme(newTheme);
  }

  render() {
    return html`
      <div class="left-section">
        <div class="connection-status ${this.connected ? 'connected' : 'disconnected'}">
          <span class="status-dot"></span>
          <span>${this.connected ? i18n.t('connection.connected') : i18n.t('connection.disconnected')}</span>
        </div>
        <span style="color: var(--sc-text-tertiary); font-size: var(--sc-font-size-sm);">
          ws://127.0.0.1:21981
        </span>
      </div>

      <div class="right-section">
        <button class="icon-button" @click=${this.handleThemeToggle} title="Toggle theme">
          ${this.theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <select class="locale-select" @change=${this.handleLocaleChange} .value=${this.locale}>
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
          <option value="zh-TW">繁體中文</option>
        </select>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-header': ScHeader;
  }
}
```

---

## 6. Base Component Patterns

### 6.1 Component Template

Every page component should follow this structure:

```typescript
// ui/src/ui/pages/sc-example-page.ts

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';

@customElement('sc-example-page')
export class ScExamplePage extends LitElement {
  // i18n controller for automatic re-renders
  private i18n = new I18nController(this);

  // Reactive state
  @state()
  private loading = true;

  @state()
  private error: string | null = null;

  @state()
  private data: unknown = null;

  static styles = css`
    :host {
      display: block;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .error-container {
      padding: var(--sc-spacing-lg);
      text-align: center;
      color: var(--sc-error);
    }
  `;

  constructor() {
    super();
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    this.error = null;

    try {
      // Load data via gateway client
      // this.data = await gatewayClient.request('method.name', params);
      this.loading = false;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
      this.loading = false;
    }
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
        <button @click=${this.loadData}>${this.i18n.t('common.retry')}</button>
      </div>
    `;
  }

  private renderContent() {
    return html`
      <!-- Page content here -->
    `;
  }

  render() {
    if (this.loading) return this.renderLoading();
    if (this.error) return this.renderError();
    return this.renderContent();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-example-page': ScExamplePage;
  }
}
```

### 6.2 Common Patterns

| Pattern | Usage |
|---------|-------|
| Loading State | Show spinner/skeleton while data loads |
| Error State | Show error message with retry button |
| Empty State | Show helpful message when no data |
| i18n | Use `this.i18n.t('key')` for all text |
| Theme | Use CSS variables for all colors |

---

*End of SPEC-02: Frontend Architecture*
