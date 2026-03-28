import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';

interface ChannelConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  status: 'connected' | 'disconnected' | 'configuring';
  configFields: ConfigField[];
  color: string;
}

interface ConfigField {
  key: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'number';
  placeholder: string;
  required: boolean;
}

const channels: ChannelConfig[] = [
  {
    id: 'feishu',
    name: '飞书',
    icon: '📮',
    description: '飞书（Lark）企业即时通讯平台，支持机器人、Webhook',
    status: 'connected',
    color: '#3370ff',
    configFields: [
      { key: 'appId', label: 'App ID', type: 'text', placeholder: 'cli_xxxxxxxx', required: true },
      { key: 'appSecret', label: 'App Secret', type: 'password', placeholder: '输入 App Secret', required: true },
      { key: 'botName', label: '机器人名称', type: 'text', placeholder: 'SecuClaw Bot', required: false },
    ],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: '✈️',
    description: 'Telegram Bot API，支持群组、私聊、频道',
    status: 'disconnected',
    color: '#0088cc',
    configFields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: '123456:ABC-DEF...', required: true },
      { key: 'chatId', label: 'Chat ID', type: 'text', placeholder: '-1001234567890', required: false },
      { key: 'apiUrl', label: 'API URL', type: 'url', placeholder: 'https://api.telegram.org', required: false },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    icon: '💬',
    description: 'Slack Bolt SDK，支持工作区、频道、App',
    status: 'disconnected',
    color: '#4a154b',
    configFields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: 'xoxb-...', required: true },
      { key: 'appToken', label: 'App Token', type: 'password', placeholder: 'xapp-...', required: true },
      { key: 'signingSecret', label: 'Signing Secret', type: 'password', placeholder: 'Signing Secret', required: true },
    ],
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: '🎮',
    description: 'Discord Bot API，支持服务器、频道、Webhooks',
    status: 'disconnected',
    color: '#5865f2',
    configFields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: 'MTIz...', required: true },
      { key: 'guildId', label: 'Guild ID', type: 'text', placeholder: '123456789', required: false },
      { key: 'webhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://discord.com/api/webhooks/...', required: false },
    ],
  },
  {
    id: 'msteams',
    name: 'Microsoft Teams',
    icon: '🏢',
    description: 'Microsoft Teams Bot Framework，支持企业部署',
    status: 'disconnected',
    color: '#6264a7',
    configFields: [
      { key: 'microsoftAppId', label: 'Microsoft App ID', type: 'text', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', required: true },
      { key: 'microsoftAppPassword', label: 'Microsoft App Password', type: 'password', placeholder: 'App Password', required: true },
      { key: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', required: false },
    ],
  },
];

@customElement('sc-channels-page')
export class ScChannelsPage extends LitElement {
  private i18n = new I18nController(this);

  @state()
  private selectedChannel: ChannelConfig | null = null;

  @state()
  private configs: Record<string, Record<string, string>> = {};

  @state()
  private showConfigModal = false;

  static styles = css`
    :host {
      display: block;
      padding: var(--sc-spacing-lg);
      background: var(--sc-bg-primary);
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: var(--sc-spacing-xl);
    }

    .page-title {
      font-size: var(--sc-font-size-2xl);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-sm);
    }

    .page-subtitle {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-tertiary);
    }

    .channels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--sc-spacing-lg);
    }

    .channel-card {
      background: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-spacing-lg);
      transition: all var(--sc-transition-normal);
      cursor: pointer;
    }

    .channel-card:hover {
      border-color: var(--sc-primary);
      box-shadow: var(--sc-shadow-md);
      transform: translateY(-2px);
    }

    .channel-card.connected {
      border-color: var(--sc-success);
    }

    .channel-header {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md);
      margin-bottom: var(--sc-spacing-md);
    }

    .channel-icon {
      font-size: 32px;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--sc-bg-secondary);
      border-radius: var(--sc-radius-md);
    }

    .channel-info {
      flex: 1;
    }

    .channel-name {
      font-size: var(--sc-font-size-lg);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: 4px;
    }

    .channel-status {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: var(--sc-font-size-xs);
      padding: 2px 8px;
      border-radius: 12px;
    }

    .channel-status.connected {
      background: rgba(16, 185, 129, 0.15);
      color: var(--sc-success);
    }

    .channel-status.disconnected {
      background: rgba(107, 114, 128, 0.15);
      color: var(--sc-text-tertiary);
    }

    .channel-status.configuring {
      background: rgba(245, 158, 11, 0.15);
      color: var(--sc-warning);
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .channel-description {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
      line-height: 1.5;
      margin-bottom: var(--sc-spacing-md);
    }

    .channel-actions {
      display: flex;
      gap: var(--sc-spacing-sm);
    }

    .btn {
      padding: var(--sc-spacing-sm) var(--sc-spacing-md);
      border-radius: var(--sc-radius-md);
      font-size: var(--sc-font-size-sm);
      font-weight: 500;
      cursor: pointer;
      transition: all var(--sc-transition-fast);
      border: none;
    }

    .btn-primary {
      background: var(--sc-primary);
      color: white;
    }

    .btn-primary:hover {
      background: var(--sc-primary-dark);
    }

    .btn-secondary {
      background: var(--sc-bg-secondary);
      color: var(--sc-text-primary);
      border: 1px solid var(--sc-border-color);
    }

    .btn-secondary:hover {
      background: var(--sc-bg-tertiary);
    }

    .btn-danger {
      background: transparent;
      color: var(--sc-danger);
      border: 1px solid var(--sc-danger);
    }

    .btn-danger:hover {
      background: var(--sc-danger);
      color: white;
    }

    .btn-sm {
      padding: var(--sc-spacing-xs) var(--sc-spacing-sm);
      font-size: var(--sc-font-size-xs);
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: var(--sc-bg-card);
      border-radius: var(--sc-radius-lg);
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--sc-spacing-lg);
      border-bottom: 1px solid var(--sc-border-color);
    }

    .modal-title {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
      font-size: var(--sc-font-size-lg);
      font-weight: 600;
      color: var(--sc-text-primary);
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--sc-text-tertiary);
      padding: 4px;
      line-height: 1;
    }

    .modal-close:hover {
      color: var(--sc-text-primary);
    }

    .modal-body {
      padding: var(--sc-spacing-lg);
    }

    .form-group {
      margin-bottom: var(--sc-spacing-lg);
    }

    .form-label {
      display: block;
      font-size: var(--sc-font-size-sm);
      font-weight: 500;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-xs);
    }

    .form-label .required {
      color: var(--sc-danger);
      margin-left: 4px;
    }

    .form-input {
      width: 100%;
      padding: var(--sc-spacing-sm) var(--sc-spacing-md);
      background: var(--sc-bg-secondary);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-primary);
      transition: border-color var(--sc-transition-fast);
    }

    .form-input:focus {
      outline: none;
      border-color: var(--sc-primary);
    }

    .form-input::placeholder {
      color: var(--sc-text-tertiary);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--sc-spacing-sm);
      padding: var(--sc-spacing-lg);
      border-top: 1px solid var(--sc-border-color);
    }

    /* Info Box */
    .info-box {
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: var(--sc-radius-md);
      padding: var(--sc-spacing-md);
      margin-bottom: var(--sc-spacing-lg);
    }

    .info-box-title {
      font-weight: 600;
      color: var(--sc-primary);
      margin-bottom: var(--sc-spacing-xs);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .info-box-content {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
      line-height: 1.5;
    }
  `;

  private getChannelConfigs(channelId: string): Record<string, string> {
    return this.configs[channelId] || {};
  }

  private openConfig(channel: ChannelConfig) {
    this.selectedChannel = channel;
    this.showConfigModal = true;
  }

  private closeConfig() {
    this.showConfigModal = false;
    this.selectedChannel = null;
  }

  private handleConfigChange(key: string, value: string) {
    if (!this.selectedChannel) return;
    const current = this.getChannelConfigs(this.selectedChannel.id);
    this.configs = {
      ...this.configs,
      [this.selectedChannel.id]: {
        ...current,
        [key]: value,
      },
    };
  }

  private async saveConfig() {
    if (!this.selectedChannel) return;
    
    const config = this.getChannelConfigs(this.selectedChannel.id);
    const required = this.selectedChannel.configFields.filter(f => f.required);
    const missing = required.filter(f => !config[f.key]);
    
    if (missing.length > 0) {
      alert(`请填写必填字段: ${missing.map(f => f.label).join(', ')}`);
      return;
    }

    // Simulate save
    console.log(`[Channel] Saving config for ${this.selectedChannel.id}:`, config);
    
    // Update status to connected
    const channelIndex = channels.findIndex(c => c.id === this.selectedChannel!.id);
    if (channelIndex >= 0) {
      channels[channelIndex].status = 'connected';
      this.requestUpdate();
    }

    this.closeConfig();
  }

  private async disconnectChannel(channel: ChannelConfig) {
    if (confirm(`确定断开 ${channel.name} 连接吗？`)) {
      const channelIndex = channels.findIndex(c => c.id === channel.id);
      if (channelIndex >= 0) {
        channels[channelIndex].status = 'disconnected';
        this.requestUpdate();
      }
    }
  }

  render() {
    return html`
      <div class="page-header">
        <h1 class="page-title">${this.i18n.t('nav.channels')}</h1>
        <p class="page-subtitle">管理安全告警和通知的通讯渠道</p>
      </div>

      <div class="info-box">
        <div class="info-box-title">
          💡 配置说明
        </div>
        <div class="info-box-content">
          连接通讯渠道后，安全告警和事件通知将自动推送至对应平台。支持同时连接多个渠道，消息将同步发送至所有已连接渠道。
        </div>
      </div>

      <div class="channels-grid">
        ${channels.map(channel => this.renderChannelCard(channel))}
      </div>

      ${this.showConfigModal ? this.renderConfigModal() : null}
    `;
  }

  private renderChannelCard(channel: ChannelConfig) {
    const statusClass = channel.status;
    const statusText = {
      connected: '已连接',
      disconnected: '未连接',
      configuring: '配置中',
    }[channel.status];

    return html`
      <div class="channel-card ${statusClass}">
        <div class="channel-header">
          <div class="channel-icon">${channel.icon}</div>
          <div class="channel-info">
            <div class="channel-name">${channel.name}</div>
            <div class="channel-status ${statusClass}">
              <span class="status-dot"></span>
              ${statusText}
            </div>
          </div>
        </div>
        <p class="channel-description">${channel.description}</p>
        <div class="channel-actions">
          ${channel.status === 'connected'
            ? html`
                <button class="btn btn-secondary btn-sm" @click=${() => this.openConfig(channel)}>
                  查看配置
                </button>
                <button class="btn btn-danger btn-sm" @click=${() => this.disconnectChannel(channel)}>
                  断开连接
                </button>
              `
            : html`
                <button class="btn btn-primary btn-sm" @click=${() => this.openConfig(channel)}>
                  连接
                </button>
              `}
        </div>
      </div>
    `;
  }

  private renderConfigModal() {
    if (!this.selectedChannel) return null;

    const config = this.getChannelConfigs(this.selectedChannel.id);

    return html`
      <div class="modal-overlay" @click=${(e: Event) => e.target === e.currentTarget && this.closeConfig()}>
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">
              ${this.selectedChannel.icon} ${this.selectedChannel.name} 配置
            </div>
            <button class="modal-close" @click=${this.closeConfig}>×</button>
          </div>
          <div class="modal-body">
            ${this.selectedChannel.configFields.map(field => html`
              <div class="form-group">
                <label class="form-label">
                  ${field.label}
                  ${field.required ? html`<span class="required">*</span>` : null}
                </label>
                <input
                  type=${field.type}
                  class="form-input"
                  placeholder=${field.placeholder}
                  .value=${config[field.key] || ''}
                  @input=${(e: Event) => this.handleConfigChange(field.key, (e.target as HTMLInputElement).value)}
                />
              </div>
            `)}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click=${this.closeConfig}>取消</button>
            <button class="btn btn-primary" @click=${this.saveConfig}>
              ${this.selectedChannel.status === 'connected' ? '保存更新' : '连接'}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
