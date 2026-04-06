/**
 * sc-settings-page.ts - 系统设置页面
 * 
 * 包含：常规设置、系统配置、通知设置、安全设置、API配置、数据管理、关于
 */

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { uiStore } from '../../store/ui-store.js';
import {  } from '../../gateway-client.js';

type TabId = 'general' | 'system' | 'notifications' | 'security' | 'api' | 'data' | 'about';

interface SystemConfig {
  systemName: string;
  organization: string;
  timezone: string;
  dateFormat: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxSessionTimeout: number;
}

interface NotificationConfig {
  emailEnabled: boolean;
  emailHost: string;
  emailPort: number;
  emailFrom: string;
  slackEnabled: boolean;
  slackWebhook: string;
  feishuEnabled: boolean;
  feishuWebhook: string;
  alertLevel: 'critical' | 'high' | 'medium' | 'all';
}

interface SecurityConfig {
  sessionTimeout: number;
  passwordMinLength: number;
  passwordRequireSpecial: boolean;
  twoFactorEnabled: boolean;
  ipWhitelistEnabled: boolean;
  ipWhitelist: string;
  apiKeyRotation: number;
}

interface ApiConfig {
  apiEnabled: boolean;
  apiRateLimit: number;
  apiKey: string;
  webhookEnabled: boolean;
  webhookUrl: string;
}

@customElement('sc-settings-page')
export class ScSettingsPage extends LitElement {
  @state() private theme: 'light' | 'dark' | 'system' = 'dark';
  @state() private locale: 'zh-CN' | 'en' | 'zh-TW' = 'zh-CN';
  @state() private activeTab: TabId = 'general';
  @state() private saving = false;
  @state() private saveSuccess = false;

  // System Config
  @state() private systemConfig: SystemConfig = {
    systemName: 'SecuClaw',
    organization: 'SecuClaw Security',
    timezone: 'Asia/Shanghai',
    dateFormat: 'YYYY-MM-DD',
    logLevel: 'info',
    maxSessionTimeout: 3600,
  };

  // Notification Config
  @state() private notificationConfig: NotificationConfig = {
    emailEnabled: false,
    emailHost: '',
    emailPort: 587,
    emailFrom: '',
    slackEnabled: false,
    slackWebhook: '',
    feishuEnabled: true,
    feishuWebhook: '',
    alertLevel: 'high',
  };

  // Security Config
  @state() private securityConfig: SecurityConfig = {
    sessionTimeout: 1800,
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    twoFactorEnabled: false,
    ipWhitelistEnabled: false,
    ipWhitelist: '',
    apiKeyRotation: 90,
  };

  // API Config
  @state() private apiConfig: ApiConfig = {
    apiEnabled: true,
    apiRateLimit: 100,
    apiKey: '',
    webhookEnabled: false,
    webhookUrl: '',
  };

  static styles = css`
    :host {
      display: block;
      padding: var(--sc-spacing-lg, 20px);
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: var(--sc-spacing-xl, 24px);
    }

    .page-title {
      font-size: var(--sc-font-size-2xl, 24px);
      font-weight: 600;
      color: var(--sc-text-primary, #f1f5f9);
      margin: 0 0 var(--sc-spacing-xs, 4px);
    }

    .page-subtitle {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #94a3b8);
      margin: 0;
    }

    .settings-layout {
      display: grid;
      grid-template-columns: 220px 1fr;
      gap: var(--sc-spacing-lg, 20px);
    }

    .settings-tabs {
      background: var(--sc-bg-card, #ffffff);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-md, 16px);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      height: fit-content;
    }

    .tab-item {
      padding: var(--sc-spacing-md, 12px) var(--sc-spacing-md, 16px);
      border-radius: var(--sc-radius-md, 8px);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #94a3b8);
      transition: all 0.2s;
      margin-bottom: 4px;
    }

    .tab-item:hover {
      background: var(--sc-bg-hover, #f1f5f9);
      color: var(--sc-text-primary, #f1f5f9);
    }

    .tab-item.active {
      background: var(--sc-primary-light, #eff6ff);
      color: var(--sc-primary, #3b82f6);
      font-weight: 500;
    }

    .tab-icon {
      font-size: 18px;
    }

    .settings-content {
      background: var(--sc-bg-card, #ffffff);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-xl, 24px);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-title {
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 600;
      color: var(--sc-text-primary, #f1f5f9);
      margin: 0 0 var(--sc-spacing-lg, 20px);
      padding-bottom: var(--sc-spacing-md, 12px);
      border-bottom: 1px solid var(--sc-border-color, #334155);
    }

    .setting-group {
      margin-bottom: var(--sc-spacing-xl, 24px);
    }

    .group-title {
      font-size: var(--sc-font-size-base, 14px);
      font-weight: 600;
      color: var(--sc-text-primary, #f1f5f9);
      margin: 0 0 var(--sc-spacing-md, 12px);
    }

    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--sc-spacing-md, 16px) 0;
      border-bottom: 1px solid var(--sc-border-color, #334155);
    }

    .setting-row:last-child {
      border-bottom: none;
    }

    .setting-info {
      flex: 1;
      margin-right: var(--sc-spacing-lg, 20px);
    }

    .setting-label {
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #f1f5f9);
      margin: 0 0 4px;
    }

    .setting-desc {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #94a3b8);
      margin: 0;
    }

    .setting-control {
      flex-shrink: 0;
    }

    input[type="text"],
    input[type="number"],
    input[type="password"],
    select {
      padding: 8px 12px;
      border: 1px solid var(--sc-border-color, #475569);
      border-radius: var(--sc-radius-md, 6px);
      font-size: var(--sc-font-size-sm, 14px);
      min-width: 200px;
      background: var(--sc-bg-tertiary, #1e293b);
      color: var(--sc-text-primary, #f1f5f9);
    }

    input:focus, select:focus {
      outline: none;
      border-color: var(--sc-primary, #3b82f6);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    textarea {
      width: 100%;
      min-height: 80px;
      padding: 8px 12px;
      border: 1px solid var(--sc-border-color, #475569);
      border-radius: var(--sc-radius-md, 6px);
      font-size: var(--sc-font-size-sm, 14px);
      resize: vertical;
      font-family: inherit;
      background: var(--sc-bg-tertiary, #1e293b);
      color: var(--sc-text-primary, #f1f5f9);
    }

    .toggle {
      position: relative;
      width: 44px;
      height: 24px;
      background: var(--sc-bg-tertiary, #e5e7eb);
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .toggle.active {
      background: var(--sc-primary, #3b82f6);
    }

    .toggle::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: transform 0.2s;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .toggle.active::after {
      transform: translateX(20px);
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: var(--sc-radius-md, 6px);
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: var(--sc-primary, #3b82f6);
      color: white;
    }

    .btn-primary:hover {
      background: var(--sc-primary-dark, #2563eb);
    }

    .btn-primary:disabled {
      background: var(--sc-bg-tertiary, #d1d5db);
      cursor: not-allowed;
    }

    .btn-secondary {
      background: var(--sc-bg-tertiary, #334155);
      color: var(--sc-text-primary, #f1f5f9);
    }

    .btn-secondary:hover {
      background: var(--sc-bg-hover, #475569);
    }

    .btn-danger {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }

    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.3);
    }

    .btn-group {
      display: flex;
      gap: var(--sc-spacing-md, 12px);
      margin-top: var(--sc-spacing-lg, 20px);
    }

    .alert {
      padding: var(--sc-spacing-md, 12px) var(--sc-spacing-lg, 16px);
      border-radius: var(--sc-radius-md, 8px);
      margin-bottom: var(--sc-spacing-lg, 20px);
      font-size: var(--sc-font-size-sm, 14px);
    }

    .alert-success {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
      border: 1px solid rgba(34, 197, 94, 0.3);
    }

    .api-key-display {
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
      align-items: center;
    }

    .api-key-value {
      font-family: monospace;
      background: var(--sc-bg-secondary, #f3f4f6);
      padding: 8px 12px;
      border-radius: var(--sc-radius-md, 6px);
      font-size: var(--sc-font-size-sm, 13px);
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--sc-spacing-md, 16px);
      margin-bottom: var(--sc-spacing-lg, 20px);
    }

    .stat-card {
      background: var(--sc-bg-secondary, #1e293b);
      padding: var(--sc-spacing-md, 16px);
      border-radius: var(--sc-radius-md, 8px);
      text-align: center;
    }

    .stat-value {
      font-size: var(--sc-font-size-xl, 20px);
      font-weight: 600;
      color: var(--sc-text-primary, #f1f5f9);
    }

    .stat-label {
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #94a3b8);
      margin-top: 4px;
    }
  `;

  constructor() {
    super();
    const state = uiStore.getState();
    this.theme = state.theme;
    this.locale = state.locale;

    uiStore.subscribe((state) => {
      this.theme = state.theme;
      this.locale = state.locale;
    });
  }

  private handleThemeChange(e: Event): void {
    const theme = (e.target as HTMLSelectElement).value as typeof this.theme;
    uiStore.setTheme(theme);
  }

  private handleLocaleChange(e: Event): void {
    const locale = (e.target as HTMLSelectElement).value as typeof this.locale;
    uiStore.setLocale(locale);
  }

  private async handleSave(): Promise<void> {
    this.saving = true;
    this.saveSuccess = false;
    
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.saving = false;
    this.saveSuccess = true;
    
    setTimeout(() => {
      this.saveSuccess = false;
    }, 3000);
  }

  private async handleGenerateApiKey(): Promise<void> {
    const newKey = 'sk_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    this.apiConfig = { ...this.apiConfig, apiKey: newKey };
  }

  private async handleBackup(): Promise<void> {
    alert('数据备份功能即将上线');
  }

  private async handleRestore(): Promise<void> {
    alert('数据恢复功能即将上线');
  }

  private renderGeneralSettings() {
    return html`
      <div class="setting-group">
        <h3 class="group-title">外观设置</h3>
        
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">主题</div>
            <div class="setting-desc">选择界面主题</div>
          </div>
          <div class="setting-control">
            <select @change=${this.handleThemeChange} .value=${this.theme}>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
              <option value="system">跟随系统</option>
            </select>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">语言</div>
            <div class="setting-desc">选择界面语言</div>
          </div>
          <div class="setting-control">
            <select @change=${this.handleLocaleChange} .value=${this.locale}>
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
              <option value="zh-TW">繁體中文</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  private renderSystemSettings() {
    return html`
      <div class="setting-group">
        <h3 class="group-title">基本配置</h3>
        
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">系统名称</div>
            <div class="setting-desc">显示在界面左上角的系统名称</div>
          </div>
          <div class="setting-control">
            <input type="text" .value=${this.systemConfig.systemName} 
              @input=${(e: any) => this.systemConfig = { ...this.systemConfig, systemName: e.target.value }}>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">组织名称</div>
            <div class="setting-desc">您的组织或公司名称</div>
          </div>
          <div class="setting-control">
            <input type="text" .value=${this.systemConfig.organization}
              @input=${(e: any) => this.systemConfig = { ...this.systemConfig, organization: e.target.value }}>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">时区</div>
            <div class="setting-desc">系统使用的时区设置</div>
          </div>
          <div class="setting-control">
            <select .value=${this.systemConfig.timezone}
              @change=${(e: any) => this.systemConfig = { ...this.systemConfig, timezone: e.target.value }}>
              <option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</option>
              <option value="America/New_York">America/New_York (UTC-5)</option>
              <option value="Europe/London">Europe/London (UTC+0)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
            </select>
          </div>
        </div>
      </div>

      <div class="setting-group">
        <h3 class="group-title">日志配置</h3>
        
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">日志级别</div>
            <div class="setting-desc">控制日志详细程度</div>
          </div>
          <div class="setting-control">
            <select .value=${this.systemConfig.logLevel}
              @change=${(e: any) => this.systemConfig = { ...this.systemConfig, logLevel: e.target.value }}>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">会话超时时间 (秒)</div>
            <div class="setting-desc">用户无操作后自动登出的时间</div>
          </div>
          <div class="setting-control">
            <input type="number" min="300" max="86400" .value=${this.systemConfig.maxSessionTimeout}
              @input=${(e: any) => this.systemConfig = { ...this.systemConfig, maxSessionTimeout: parseInt(e.target.value) }}>
          </div>
        </div>
      </div>
    `;
  }

  private renderNotificationSettings() {
    return html`
      <div class="setting-group">
        <h3 class="group-title">邮件通知</h3>
        
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">启用邮件通知</div>
            <div class="setting-desc">接收重要告警的邮件通知</div>
          </div>
          <div class="setting-control">
            <div class="toggle ${this.notificationConfig.emailEnabled ? 'active' : ''}"
              @click=${() => this.notificationConfig = { ...this.notificationConfig, emailEnabled: !this.notificationConfig.emailEnabled }}></div>
          </div>
        </div>

        ${this.notificationConfig.emailEnabled ? html`
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">SMTP 服务器</div>
              <div class="setting-desc">邮件发送服务器地址</div>
            </div>
            <div class="setting-control">
              <input type="text" placeholder="smtp.example.com" .value=${this.notificationConfig.emailHost}
                @input=${(e: any) => this.notificationConfig = { ...this.notificationConfig, emailHost: e.target.value }}>
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">SMTP 端口</div>
              <div class="setting-desc">通常为 587 (TLS) 或 465 (SSL)</div>
            </div>
            <div class="setting-control">
              <input type="number" .value=${this.notificationConfig.emailPort}
                @input=${(e: any) => this.notificationConfig = { ...this.notificationConfig, emailPort: parseInt(e.target.value) }}>
            </div>
          </div>
        ` : ''}
      </div>

      <div class="setting-group">
        <h3 class="group-title">即时通讯通知</h3>
        
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">飞书通知</div>
            <div class="setting-desc">通过飞书机器人发送告警通知</div>
          </div>
          <div class="setting-control">
            <div class="toggle ${this.notificationConfig.feishuEnabled ? 'active' : ''}"
              @click=${() => this.notificationConfig = { ...this.notificationConfig, feishuEnabled: !this.notificationConfig.feishuEnabled }}></div>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">告警级别</div>
            <div class="setting-desc">选择接收哪些级别的告警通知</div>
          </div>
          <div class="setting-control">
            <select .value=${this.notificationConfig.alertLevel}
              @change=${(e: any) => this.notificationConfig = { ...this.notificationConfig, alertLevel: e.target.value }}>
              <option value="all">全部告警</option>
              <option value="critical">仅Critical</option>
              <option value="high">High及以上</option>
              <option value="medium">Medium及以上</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  private renderSecuritySettings() {
    return html`
      <div class="setting-group">
        <h3 class="group-title">认证配置</h3>
        
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">会话超时 (秒)</div>
            <div class="setting-desc">用户无操作后自动登出的时间</div>
          </div>
          <div class="setting-control">
            <input type="number" min="300" max="86400" .value=${this.securityConfig.sessionTimeout}
              @input=${(e: any) => this.securityConfig = { ...this.securityConfig, sessionTimeout: parseInt(e.target.value) }}>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">密码最小长度</div>
            <div class="setting-desc">用户密码的最少字符数</div>
          </div>
          <div class="setting-control">
            <input type="number" min="6" max="32" .value=${this.securityConfig.passwordMinLength}
              @input=${(e: any) => this.securityConfig = { ...this.securityConfig, passwordMinLength: parseInt(e.target.value) }}>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">双因素认证</div>
            <div class="setting-desc">启用额外的身份验证步骤</div>
          </div>
          <div class="setting-control">
            <div class="toggle ${this.securityConfig.twoFactorEnabled ? 'active' : ''}"
              @click=${() => this.securityConfig = { ...this.securityConfig, twoFactorEnabled: !this.securityConfig.twoFactorEnabled }}></div>
          </div>
        </div>
      </div>

      <div class="setting-group">
        <h3 class="group-title">访问控制</h3>
        
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">IP白名单</div>
            <div class="setting-desc">仅允许指定IP地址访问系统</div>
          </div>
          <div class="setting-control">
            <div class="toggle ${this.securityConfig.ipWhitelistEnabled ? 'active' : ''}"
              @click=${() => this.securityConfig = { ...this.securityConfig, ipWhitelistEnabled: !this.securityConfig.ipWhitelistEnabled }}></div>
          </div>
        </div>

        ${this.securityConfig.ipWhitelistEnabled ? html`
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">允许的IP地址</div>
              <div class="setting-desc">每行一个IP，支持CIDR格式</div>
            </div>
            <div class="setting-control">
              <textarea .value=${this.securityConfig.ipWhitelist}
                @input=${(e: any) => this.securityConfig = { ...this.securityConfig, ipWhitelist: e.target.value }}
                placeholder="192.168.1.1&#10;10.0.0.0/8"></textarea>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderApiSettings() {
    return html`
      <div class="setting-group">
        <h3 class="group-title">API配置</h3>
        
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">启用API访问</div>
            <div class="setting-desc">允许通过API访问系统功能</div>
          </div>
          <div class="setting-control">
            <div class="toggle ${this.apiConfig.apiEnabled ? 'active' : ''}"
              @click=${() => this.apiConfig = { ...this.apiConfig, apiEnabled: !this.apiConfig.apiEnabled }}></div>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">API密钥</div>
            <div class="setting-desc">用于API认证的密钥</div>
          </div>
          <div class="setting-control">
            <div class="api-key-display">
              <div class="api-key-value">${this.apiConfig.apiKey || '未设置'}</div>
              <button class="btn btn-secondary" @click=${this.handleGenerateApiKey}>重新生成</button>
            </div>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">速率限制 (请求/分钟)</div>
            <div class="setting-desc">API调用频率限制</div>
          </div>
          <div class="setting-control">
            <input type="number" min="10" max="1000" .value=${this.apiConfig.apiRateLimit}
              @input=${(e: any) => this.apiConfig = { ...this.apiConfig, apiRateLimit: parseInt(e.target.value) }}>
          </div>
        </div>
      </div>

      <div class="setting-group">
        <h3 class="group-title">Webhook配置</h3>
        
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">启用Webhook</div>
            <div class="setting-desc">事件触发时发送HTTP回调</div>
          </div>
          <div class="setting-control">
            <div class="toggle ${this.apiConfig.webhookEnabled ? 'active' : ''}"
              @click=${() => this.apiConfig = { ...this.apiConfig, webhookEnabled: !this.apiConfig.webhookEnabled }}></div>
          </div>
        </div>

        ${this.apiConfig.webhookEnabled ? html`
          <div class="setting-row">
            <div class="setting-info">
              <div class="setting-label">Webhook URL</div>
              <div class="setting-desc">接收事件的HTTP端点</div>
            </div>
            <div class="setting-control">
              <input type="text" placeholder="https://your-server.com/webhook" style="min-width: 300px;"
                .value=${this.apiConfig.webhookUrl}
                @input=${(e: any) => this.apiConfig = { ...this.apiConfig, webhookUrl: e.target.value }}>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderDataSettings() {
    return html`
      <div class="setting-group">
        <h3 class="group-title">数据统计</h3>
        
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">20</div>
            <div class="stat-label">资产总数</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">156</div>
            <div class="stat-label">威胁情报</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">5</div>
            <div class="stat-label">待处理事件</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">3.2MB</div>
            <div class="stat-label">存储使用</div>
          </div>
        </div>
      </div>

      <div class="setting-group">
        <h3 class="group-title">数据操作</h3>
        
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">导出数据</div>
            <div class="setting-desc">将所有配置和业务数据导出为JSON文件</div>
          </div>
          <div class="setting-control">
            <button class="btn btn-secondary" @click=${this.handleBackup}>
              导出备份
            </button>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">导入数据</div>
            <div class="setting-desc">从备份文件恢复系统配置和数据</div>
          </div>
          <div class="setting-control">
            <button class="btn btn-secondary" @click=${this.handleRestore}>
              恢复数据
            </button>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">清除所有数据</div>
            <div class="setting-desc">删除所有业务数据，此操作不可恢复</div>
          </div>
          <div class="setting-control">
            <button class="btn btn-danger">
              清除数据
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderAboutSettings() {
    return html`
      <div class="setting-group">
        <h3 class="group-title">系统信息</h3>
        
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">系统名称</div>
            <div class="setting-desc">SecuClaw 安全指挥官系统</div>
          </div>
          <div class="setting-control">
            <span style="color: var(--sc-text-secondary)">v1.0.0</span>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">构建时间</div>
            <div class="setting-desc">2026-03-26</div>
          </div>
          <div class="setting-control">
            <span style="color: var(--sc-text-secondary)">Production</span>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">前端版本</div>
            <div class="setting-desc">Lit + Vite + TypeScript</div>
          </div>
          <div class="setting-control">
            <span style="color: var(--sc-text-secondary)">v5.4.21</span>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">后端版本</div>
            <div class="setting-desc">Bun + TypeScript</div>
          </div>
          <div class="setting-control">
            <span style="color: var(--sc-text-secondary)">v1.0.0</span>
          </div>
        </div>
      </div>

      <div class="setting-group">
        <h3 class="group-title">技术栈</h3>
        
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">前端框架</div>
            <div class="setting-desc">Lit Web Components</div>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">后端框架</div>
            <div class="setting-desc">Bun + WebSocket Gateway</div>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">数据存储</div>
            <div class="setting-desc">JSON File Storage</div>
          </div>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">知识库</div>
            <div class="setting-desc">MITRE ATT&CK + SCF Controls</div>
          </div>
        </div>
      </div>
    `;
  }

  private renderTabContent() {
    switch (this.activeTab) {
      case 'general': return this.renderGeneralSettings();
      case 'system': return this.renderSystemSettings();
      case 'notifications': return this.renderNotificationSettings();
      case 'security': return this.renderSecuritySettings();
      case 'api': return this.renderApiSettings();
      case 'data': return this.renderDataSettings();
      case 'about': return this.renderAboutSettings();
      default: return this.renderGeneralSettings();
    }
  }

  render() {
    return html`
      <div class="page-header">
        <h1 class="page-title">系统设置</h1>
        <p class="page-subtitle">配置系统参数和用户偏好设置</p>
      </div>

      ${this.saveSuccess ? html`
        <div class="alert alert-success">
          设置已保存成功
        </div>
      ` : ''}

      <div class="settings-layout">
        <div class="settings-tabs">
          <div class="tab-item ${this.activeTab === 'general' ? 'active' : ''}" @click=${() => this.activeTab = 'general'}>
            <span class="tab-icon">⚙️</span>
            <span>常规设置</span>
          </div>
          <div class="tab-item ${this.activeTab === 'system' ? 'active' : ''}" @click=${() => this.activeTab = 'system'}>
            <span class="tab-icon">🖥️</span>
            <span>系统配置</span>
          </div>
          <div class="tab-item ${this.activeTab === 'notifications' ? 'active' : ''}" @click=${() => this.activeTab = 'notifications'}>
            <span class="tab-icon">🔔</span>
            <span>通知设置</span>
          </div>
          <div class="tab-item ${this.activeTab === 'security' ? 'active' : ''}" @click=${() => this.activeTab = 'security'}>
            <span class="tab-icon">🔒</span>
            <span>安全设置</span>
          </div>
          <div class="tab-item ${this.activeTab === 'api' ? 'active' : ''}" @click=${() => this.activeTab = 'api'}>
            <span class="tab-icon">🔌</span>
            <span>API配置</span>
          </div>
          <div class="tab-item ${this.activeTab === 'data' ? 'active' : ''}" @click=${() => this.activeTab = 'data'}>
            <span class="tab-icon">💾</span>
            <span>数据管理</span>
          </div>
          <div class="tab-item ${this.activeTab === 'about' ? 'active' : ''}" @click=${() => this.activeTab = 'about'}>
            <span class="tab-icon">ℹ️</span>
            <span>关于</span>
          </div>
        </div>

        <div class="settings-content">
          ${this.renderTabContent()}

          <div class="btn-group">
            <button class="btn btn-primary" ?disabled=${this.saving} @click=${this.handleSave}>
              ${this.saving ? '保存中...' : '保存设置'}
            </button>
            <button class="btn btn-secondary">
              恢复默认
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-settings-page': ScSettingsPage;
  }
}
