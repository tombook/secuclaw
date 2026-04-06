/**
 * sc-siem-config.ts - SIEM 集成配置页面
 * 
 * 支持 Splunk、IBM QRadar、Microsoft Sentinel 等 SIEM 平台集成配置
 */

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { gatewayClient } from '../../gateway-client.js';

interface SiemPlatform {
  id: string;
  name: string;
  logo: string;
  color: string;
  enabled: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'unknown';
  lastSync?: number;
  eventCount?: number;
}

interface SplunkConfig {
  enabled: boolean;
  host: string;
  port: number;
  scheme: 'https' | 'http';
  token: string;
  index: string;
  queryTimeout: number;
  autoSync: boolean;
  syncInterval: number;
  eventTypes: string[];
}

interface QRadarConfig {
  enabled: boolean;
  host: string;
  port: number;
  apiToken: string;
  consoleIP: string;
  autoSync: boolean;
  syncInterval: number;
  offenseTypes: string[];
}

interface SentinelConfig {
  enabled: boolean;
  tenantId: string;
  subscriptionId: string;
  clientId: string;
  clientSecret: string;
  resourceGroup: string;
  workspace: string;
  autoSync: boolean;
  syncInterval: number;
}

interface SyslogConfig {
  enabled: boolean;
  protocol: 'tcp' | 'udp';
  host: string;
  port: number;
  facility: string;
  severityMapping: boolean;
}

@customElement('sc-siem-config')
export class ScSiemConfig extends LitElement {
  @state() private activeTab: 'splunk' | 'qradar' | 'sentinel' | 'syslog' | 'status' = 'splunk';
  @state() private saving = false;
  @state() private testing = false;
  @state() private _testResult: { success: boolean; message: string } | null = null;
  @state() private platforms: SiemPlatform[] = [
    { id: 'splunk', name: 'Splunk', logo: '🔍', color: '#CF5300', enabled: true, status: 'unknown' },
    { id: 'qradar', name: 'IBM QRadar', logo: '🛡️', color: '#072688', enabled: false, status: 'unknown' },
    { id: 'sentinel', name: 'Microsoft Sentinel', logo: '☁️', color: '#0078D4', enabled: false, status: 'unknown' },
    { id: 'syslog', name: 'Syslog', logo: '📝', color: '#6B7280', enabled: false, status: 'unknown' },
  ];

  @state() private splunkConfig: SplunkConfig = {
    enabled: true,
    host: 'splunk.company.local',
    port: 8089,
    scheme: 'https',
    token: '',
    index: 'secuclaw',
    queryTimeout: 60,
    autoSync: true,
    syncInterval: 5,
    eventTypes: ['vulnerability', 'incident', 'threat', 'compliance'],
  };

  @state() private qradarConfig: QRadarConfig = {
    enabled: false,
    host: 'qradar.company.local',
    port: 443,
    apiToken: '',
    consoleIP: '',
    autoSync: true,
    syncInterval: 5,
    offenseTypes: ['cred-theft', 'lateral-movement', 'data-exfil', 'malware'],
  };

  @state() private sentinelConfig: SentinelConfig = {
    enabled: false,
    tenantId: '',
    subscriptionId: '',
    clientId: '',
    clientSecret: '',
    resourceGroup: 'security-rg',
    workspace: 'security-workspace',
    autoSync: true,
    syncInterval: 5,
  };

  @state() private syslogConfig: SyslogConfig = {
    enabled: false,
    protocol: 'udp',
    host: 'syslog.company.local',
    port: 514,
    facility: 'local0',
    severityMapping: true,
  };

  @state() private syncLogs: Array<{ time: number; platform: string; action: string; status: string; count?: number; error?: string }> = [];

  static styles = css`
    :host { display: block; padding: 24px; font-family: system-ui, -apple-system, sans-serif; background: var(--sc-bg-primary, #0f172a); color: var(--sc-text-primary, #f8fafc); min-height: 100vh; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 24px; font-weight: 700; margin: 0 0 8px; display: flex; align-items: center; gap: 12px; }
    .page-desc { font-size: 14px; color: var(--sc-text-secondary, #94a3b8); margin: 0; }
    .platform-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .platform-card { background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden; }
    .platform-card::before { content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: var(--platform-color, #6b7280); }
    .platform-card:hover { border-color: var(--platform-color, #6b7280); transform: translateY(-2px); }
    .platform-card.active { border-color: var(--platform-color, #6b7280); box-shadow: 0 0 0 1px var(--platform-color, #6b7280); }
    .platform-card.disabled { opacity: 0.6; }
    .platform-logo { font-size: 32px; margin-bottom: 12px; }
    .platform-name { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
    .platform-status { display: flex; align-items: center; gap: 6px; font-size: 12px; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; }
    .status-dot.connected { background: #22c55e; }
    .status-dot.disconnected { background: #6b7280; }
    .status-dot.error { background: #ef4444; }
    .status-dot.unknown { background: #94a3b8; }
    .config-panel { background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 12px; padding: 24px; }
    .config-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--sc-border-color, #334155); }
    .config-title { font-size: 18px; font-weight: 600; }
    .config-tabs { display: flex; gap: 4px; background: var(--sc-bg-primary, #0f172a); padding: 4px; border-radius: 8px; margin-bottom: 24px; }
    .config-tab { padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--sc-text-secondary, #94a3b8); transition: all 0.2s; border: none; background: none; }
    .config-tab:hover { color: var(--sc-text-primary, #f8fafc); }
    .config-tab.active { background: var(--sc-primary, #3b82f6); color: white; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: 13px; font-weight: 500; color: var(--sc-text-secondary, #94a3b8); margin-bottom: 6px; }
    .form-input, .form-select { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--sc-border-color, #334155); background: var(--sc-bg-primary, #0f172a); color: var(--sc-text-primary, #f8fafc); font-size: 14px; box-sizing: border-box; }
    .form-input:focus, .form-select:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2); }
    .form-input[type="password"] { font-family: monospace; }
    .form-row { display: flex; gap: 16px; align-items: center; }
    .form-row .form-group { flex: 1; }
    .toggle { position: relative; width: 44px; height: 24px; background: var(--sc-bg-tertiary, #334155); border-radius: 12px; cursor: pointer; transition: background 0.2s; flex-shrink: 0; }
    .toggle.active { background: #3b82f6; }
    .toggle::after { content: ''; position: absolute; width: 20px; height: 20px; background: white; border-radius: 50%; top: 2px; left: 2px; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2); }
    .toggle.active::after { transform: translateX(20px); }
    .checkbox-group { display: flex; flex-wrap: wrap; gap: 12px; }
    .checkbox-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--sc-bg-primary, #0f172a); border: 1px solid var(--sc-border-color, #334155); border-radius: 8px; cursor: pointer; font-size: 13px; transition: all 0.2s; }
    .checkbox-item:hover { border-color: #3b82f6; }
    .checkbox-item.checked { background: rgba(59, 130, 246, 0.15); border-color: #3b82f6; color: #3b82f6; }
    .checkbox-item input { display: none; }
    .btn { padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: all 0.2s; }
    .btn-primary { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
    .btn-secondary { background: var(--sc-bg-tertiary, #334155); color: var(--sc-text-primary, #f8fafc); border: 1px solid var(--sc-border-color, #334155); }
    .btn-secondary:hover { background: #475569; }
    .btn-success { background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 1px solid rgba(34, 197, 94, 0.3); }
    .btn-success:hover { background: rgba(34, 197, 94, 0.25); }
    .btn-danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
    .btn-group { display: flex; gap: 12px; margin-top: 24px; }
    .section-title { font-size: 16px; font-weight: 600; margin: 24px 0 16px; padding-bottom: 8px; border-bottom: 1px solid var(--sc-border-color, #334155); }
    .sync-logs { margin-top: 24px; }
    .log-table { width: 100%; border-collapse: collapse; }
    .log-table th { text-align: left; padding: 12px 16px; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; background: var(--sc-bg-primary, #0f172a); border-bottom: 1px solid var(--sc-border-color, #334155); }
    .log-table td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid var(--sc-border-color, #334155); }
    .log-table tr:hover td { background: rgba(59, 130, 246, 0.05); }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-success { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
    .badge-error { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .badge-warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    .badge-info { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
    .connection-status { display: flex; align-items: center; gap: 8px; padding: 12px 16px; background: var(--sc-bg-primary, #0f172a); border-radius: 8px; margin-bottom: 20px; }
    .status-indicator { width: 12px; height: 12px; border-radius: 50%; }
    .status-indicator.connected { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.5); }
    .status-indicator.disconnected { background: #6b7280; }
    .status-indicator.error { background: #ef4444; box-shadow: 0 0 8px rgba(239, 68, 68, 0.5); }
    .status-indicator.testing { background: #f59e0b; animation: pulse 1s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .info-box { background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #93c5fd; margin-bottom: 20px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: var(--sc-bg-primary, #0f172a); border-radius: 12px; padding: 20px; text-align: center; }
    .stat-value { font-size: 28px; font-weight: 700; }
    .stat-label { font-size: 13px; color: #94a3b8; margin-top: 4px; }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadConfigs();
    this.addMockLogs();
  }

  private addMockLogs() {
    this.syncLogs = [
      { time: Date.now() - 300000, platform: 'Splunk', action: '同步漏洞数据', status: 'success', count: 47 },
      { time: Date.now() - 600000, platform: 'Splunk', action: '同步安全事件', status: 'success', count: 12 },
      { time: Date.now() - 900000, platform: 'Splunk', action: '推送告警', status: 'success', count: 5 },
      { time: Date.now() - 3600000, platform: 'QRadar', action: '获取 Offense', status: 'error', error: '认证失败' },
      { time: Date.now() - 7200000, platform: 'Splunk', action: '同步任务状态', status: 'success', count: 23 },
    ];
  }

  private showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    this.dispatchEvent(new CustomEvent('toast', { detail: { message, type }, bubbles: true, composed: true }));
  }

  private async loadConfigs() {
    try {
      const configs = await gatewayClient.request<{
        splunk?: Partial<SplunkConfig>;
        qradar?: Partial<QRadarConfig>;
        sentinel?: Partial<SentinelConfig>;
        syslog?: Partial<SyslogConfig>;
      }>('siem.configs.get', {});
      if (configs.splunk) this.splunkConfig = { ...this.splunkConfig, ...configs.splunk };
      if (configs.qradar) this.qradarConfig = { ...this.qradarConfig, ...configs.qradar };
      if (configs.sentinel) this.sentinelConfig = { ...this.sentinelConfig, ...configs.sentinel };
      if (configs.syslog) this.syslogConfig = { ...this.syslogConfig, ...configs.syslog };
    } catch { /* Use defaults */ }
  }

  private async saveConfig() {
    this.saving = true;
    try {
      await gatewayClient.request('siem.configs.save', {
        splunk: this.splunkConfig, qradar: this.qradarConfig,
        sentinel: this.sentinelConfig, syslog: this.syslogConfig,
      });
      this.showToast('SIEM 配置已保存', 'success');
    } catch (e) { this.showToast('保存失败: ' + (e as Error).message, 'error'); }
    this.saving = false;
  }

  private async testConnection() {
    this.testing = true;
    this._testResult = null;
    try {
      const result = await gatewayClient.request<{ success: boolean; message: string }>('siem.test', {
        platform: this.activeTab, config: this.getCurrentConfig(),
      });
      this._testResult = result;
      this.showToast(result.success ? '连接成功！' : '连接失败', result.success ? 'success' : 'error');
    } catch (e) {
      this._testResult = { success: false, message: (e as Error).message };
      this.showToast('测试连接失败', 'error');
    }
    this.testing = false;
  }

  private async syncNow() {
    try {
      await gatewayClient.request('siem.sync', { platform: this.activeTab });
      this.showToast('同步已触发', 'success');
      this.addMockLogs();
    } catch (e) { this.showToast('同步失败: ' + (e as Error).message, 'error'); }
  }

  private getCurrentConfig() {
    switch (this.activeTab) {
      case 'splunk': return this.splunkConfig;
      case 'qradar': return this.qradarConfig;
      case 'sentinel': return this.sentinelConfig;
      case 'syslog': return this.syslogConfig;
      default: return null;
    }
  }

  private setTab(tab: typeof this.activeTab) { this.activeTab = tab; this._testResult = null; }

  private formatTime(ts: number): string {
    return new Date(ts).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  private getStatusText(status: string): string {
    return { success: '成功', error: '失败', warning: '警告' }[status] || status;
  }

  private toggleEventType(type: string, platform: 'splunk' | 'qradar') {
    if (platform === 'splunk') {
      const types = [...this.splunkConfig.eventTypes];
      const idx = types.indexOf(type);
      idx >= 0 ? types.splice(idx, 1) : types.push(type);
      this.splunkConfig = { ...this.splunkConfig, eventTypes: types };
    } else {
      const types = [...this.qradarConfig.offenseTypes];
      const idx = types.indexOf(type);
      idx >= 0 ? types.splice(idx, 1) : types.push(type);
      this.qradarConfig = { ...this.qradarConfig, offenseTypes: types };
    }
  }

  render() {
    return html`
      <div>
        <div class="page-header">
          <h1 class="page-title">🔗 SIEM 集成配置</h1>
          <p class="page-desc">配置与 Splunk、QRadar、Sentinel 等 SIEM 平台的数据同步</p>
        </div>

        <div class="platform-cards">
          ${this.platforms.map(p => html`
            <div class="platform-card ${p.id === this.activeTab ? 'active' : ''} ${!p.enabled ? 'disabled' : ''}"
              style="--platform-color: ${p.color}"
              @click=${() => p.enabled && this.setTab(p.id as any)}>
              <div class="platform-logo">${p.logo}</div>
              <div class="platform-name">${p.name}</div>
              <div class="platform-status">
                <span class="status-dot ${p.status}"></span>
                <span>${p.status === 'connected' ? '已连接' : p.status === 'disconnected' ? '未连接' : p.status === 'error' ? '连接错误' : '未知'}</span>
              </div>
            </div>
          `)}
        </div>

        <div class="config-panel">
          ${this.activeTab === 'splunk' ? this.renderSplunkConfig() : ''}
          ${this.activeTab === 'qradar' ? this.renderQRadarConfig() : ''}
          ${this.activeTab === 'sentinel' ? this.renderSentinelConfig() : ''}
          ${this.activeTab === 'syslog' ? this.renderSyslogConfig() : ''}
          ${this.activeTab === 'status' ? this.renderStatusView() : ''}
        </div>

        ${this.syncLogs.length > 0 ? html`
          <div class="config-panel" style="margin-top: 24px;">
            <h3 class="section-title">📋 同步日志</h3>
            <table class="log-table">
              <thead><tr><th>时间</th><th>平台</th><th>操作</th><th>状态</th><th>详情</th></tr></thead>
              <tbody>
                ${this.syncLogs.map(log => html`
                  <tr>
                    <td>${this.formatTime(log.time)}</td>
                    <td>${log.platform}</td>
                    <td>${log.action}</td>
                    <td><span class="badge badge-${log.status}">${this.getStatusText(log.status)}</span></td>
                    <td>${log.count !== undefined ? `+${log.count} 条` : log.error || '-'}</td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderSplunkConfig() {
    return html`
      <div class="config-header">
        <h2 class="config-title">🔍 Splunk 配置</h2>
        <div class="toggle ${this.splunkConfig.enabled ? 'active' : ''}"
          @click=${() => this.splunkConfig = { ...this.splunkConfig, enabled: !this.splunkConfig.enabled }}></div>
      </div>
      <div class="connection-status">
        <span class="status-indicator ${this.splunkConfig.enabled ? 'connected' : 'disconnected'}"></span>
        <span>${this.splunkConfig.enabled ? '配置已启用' : '配置已禁用'}</span>
      </div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">Splunk 服务器地址</label>
          <input type="text" class="form-input" .value=${this.splunkConfig.host}
            @input=${(e: any) => this.splunkConfig = { ...this.splunkConfig, host: e.target.value }}
            placeholder="splunk.company.local" /></div>
        <div class="form-group"><label class="form-label">端口</label>
          <input type="number" class="form-input" .value=${this.splunkConfig.port}
            @input=${(e: any) => this.splunkConfig = { ...this.splunkConfig, port: parseInt(e.target.value) }} /></div>
        <div class="form-group"><label class="form-label">协议</label>
          <select class="form-select" .value=${this.splunkConfig.scheme}
            @change=${(e: any) => this.splunkConfig = { ...this.splunkConfig, scheme: e.target.value }}>
            <option value="https">HTTPS (推荐)</option><option value="http">HTTP</option>
          </select></div>
        <div class="form-group"><label class="form-label">访问令牌 (Token)</label>
          <input type="password" class="form-input" .value=${this.splunkConfig.token}
            @input=${(e: any) => this.splunkConfig = { ...this.splunkConfig, token: e.target.value }}
            placeholder="输入 Splunk API Token" /></div>
        <div class="form-group"><label class="form-label">索引名称</label>
          <input type="text" class="form-input" .value=${this.splunkConfig.index}
            @input=${(e: any) => this.splunkConfig = { ...this.splunkConfig, index: e.target.value }} /></div>
        <div class="form-group"><label class="form-label">查询超时 (秒)</label>
          <input type="number" class="form-input" .value=${this.splunkConfig.queryTimeout}
            @input=${(e: any) => this.splunkConfig = { ...this.splunkConfig, queryTimeout: parseInt(e.target.value) }} /></div>
      </div>
      <h3 class="section-title">同步选项</h3>
      <div class="form-row" style="margin-bottom: 16px;">
        <div class="form-group"><label class="form-label">自动同步</label>
          <div class="toggle ${this.splunkConfig.autoSync ? 'active' : ''}"
            @click=${() => this.splunkConfig = { ...this.splunkConfig, autoSync: !this.splunkConfig.autoSync }}></div></div>
        <div class="form-group"><label class="form-label">同步间隔 (分钟)</label>
          <input type="number" class="form-input" style="width: 120px;" .value=${this.splunkConfig.syncInterval}
            @input=${(e: any) => this.splunkConfig = { ...this.splunkConfig, syncInterval: parseInt(e.target.value) }} /></div>
      </div>
      <h3 class="section-title">同步数据类型</h3>
      <div class="checkbox-group">
        ${['vulnerability', 'incident', 'threat', 'compliance', 'asset', 'task'].map(type => html`
          <label class="checkbox-item ${this.splunkConfig.eventTypes.includes(type) ? 'checked' : ''}">
            <input type="checkbox" .checked=${this.splunkConfig.eventTypes.includes(type)}
              @change=${() => this.toggleEventType(type, 'splunk')} />
            ${type === 'vulnerability' ? '🛡️ 漏洞' : type === 'incident' ? '🚨 安全事件' :
              type === 'threat' ? '⚠️ 威胁' : type === 'compliance' ? '📋 合规' :
              type === 'asset' ? '🖥️ 资产' : '📋 任务'}
          </label>
        `)}
      </div>
      <div class="btn-group">
        <button class="btn btn-secondary" @click=${this.testConnection} ?disabled=${this.testing}>${this.testing ? '测试中...' : '🧪 测试连接'}</button>
        <button class="btn btn-success" @click=${this.syncNow}>🔄 立即同步</button>
        <button class="btn btn-primary" @click=${this.saveConfig} ?disabled=${this.saving}>${this.saving ? '保存中...' : '💾 保存配置'}</button>
      </div>
    `;
  }

  private renderQRadarConfig() {
    return html`
      <div class="config-header">
        <h2 class="config-title">🛡️ IBM QRadar 配置</h2>
        <div class="toggle ${this.qradarConfig.enabled ? 'active' : ''}"
          @click=${() => this.qradarConfig = { ...this.qradarConfig, enabled: !this.qradarConfig.enabled }}></div>
      </div>
      <div class="info-box">💡 QRadar 支持通过 AQL 查询 Offense 和 Events。需要在 QRadar 中创建 API Token 并授权。</div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">QRadar Console IP / Hostname</label>
          <input type="text" class="form-input" .value=${this.qradarConfig.host}
            @input=${(e: any) => this.qradarConfig = { ...this.qradarConfig, host: e.target.value }}
            placeholder="qradar.company.local" /></div>
        <div class="form-group"><label class="form-label">API 端口</label>
          <input type="number" class="form-input" .value=${this.qradarConfig.port}
            @input=${(e: any) => this.qradarConfig = { ...this.qradarConfig, port: parseInt(e.target.value) }} /></div>
        <div class="form-group"><label class="form-label">API Token</label>
          <input type="password" class="form-input" .value=${this.qradarConfig.apiToken}
            @input=${(e: any) => this.qradarConfig = { ...this.qradarConfig, apiToken: e.target.value }}
            placeholder="输入 QRadar API Token" /></div>
        <div class="form-group"><label class="form-label">Console IP</label>
          <input type="text" class="form-input" .value=${this.qradarConfig.consoleIP}
            @input=${(e: any) => this.qradarConfig = { ...this.qradarConfig, consoleIP: e.target.value }}
            placeholder="QRadar Console IP" /></div>
      </div>
      <h3 class="section-title">同步选项</h3>
      <div class="form-row" style="margin-bottom: 16px;">
        <div class="form-group"><label class="form-label">自动同步</label>
          <div class="toggle ${this.qradarConfig.autoSync ? 'active' : ''}"
            @click=${() => this.qradarConfig = { ...this.qradarConfig, autoSync: !this.qradarConfig.autoSync }}></div></div>
        <div class="form-group"><label class="form-label">同步间隔 (分钟)</label>
          <input type="number" class="form-input" style="width: 120px;" .value=${this.qradarConfig.syncInterval}
            @input=${(e: any) => this.qradarConfig = { ...this.qradarConfig, syncInterval: parseInt(e.target.value) }} /></div>
      </div>
      <h3 class="section-title">Offense 类型过滤</h3>
      <div class="checkbox-group">
        ${['cred-theft', 'lateral-movement', 'data-exfil', 'malware', 'phishing', 'brute-force'].map(type => html`
          <label class="checkbox-item ${this.qradarConfig.offenseTypes.includes(type) ? 'checked' : ''}">
            <input type="checkbox" .checked=${this.qradarConfig.offenseTypes.includes(type)}
              @change=${() => this.toggleEventType(type, 'qradar')} />
            ${type.replace('-', ' ')}
          </label>
        `)}
      </div>
      <div class="btn-group">
        <button class="btn btn-secondary" @click=${this.testConnection} ?disabled=${this.testing}>${this.testing ? '测试中...' : '🧪 测试连接'}</button>
        <button class="btn btn-success" @click=${this.syncNow}>🔄 立即同步</button>
        <button class="btn btn-primary" @click=${this.saveConfig} ?disabled=${this.saving}>${this.saving ? '保存中...' : '💾 保存配置'}</button>
      </div>
    `;
  }

  private renderSentinelConfig() {
    return html`
      <div class="config-header">
        <h2 class="config-title">☁️ Microsoft Sentinel 配置</h2>
        <div class="toggle ${this.sentinelConfig.enabled ? 'active' : ''}"
          @click=${() => this.sentinelConfig = { ...this.sentinelConfig, enabled: !this.sentinelConfig.enabled }}></div>
      </div>
      <div class="info-box">💡 Microsoft Sentinel (Azure) 需要 Azure AD 应用注册。请先在 Azure Portal 创建应用并授予 Log Analytics API 权限。</div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">租户 ID (Tenant ID)</label>
          <input type="text" class="form-input" .value=${this.sentinelConfig.tenantId}
            @input=${(e: any) => this.sentinelConfig = { ...this.sentinelConfig, tenantId: e.target.value }}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></div>
        <div class="form-group"><label class="form-label">订阅 ID (Subscription ID)</label>
          <input type="text" class="form-input" .value=${this.sentinelConfig.subscriptionId}
            @input=${(e: any) => this.sentinelConfig = { ...this.sentinelConfig, subscriptionId: e.target.value }}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></div>
        <div class="form-group"><label class="form-label">客户端 ID (Client ID / App ID)</label>
          <input type="text" class="form-input" .value=${this.sentinelConfig.clientId}
            @input=${(e: any) => this.sentinelConfig = { ...this.sentinelConfig, clientId: e.target.value }}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" /></div>
        <div class="form-group"><label class="form-label">客户端密钥 (Client Secret)</label>
          <input type="password" class="form-input" .value=${this.sentinelConfig.clientSecret}
            @input=${(e: any) => this.sentinelConfig = { ...this.sentinelConfig, clientSecret: e.target.value }}
            placeholder="输入 Client Secret" /></div>
        <div class="form-group"><label class="form-label">资源组</label>
          <input type="text" class="form-input" .value=${this.sentinelConfig.resourceGroup}
            @input=${(e: any) => this.sentinelConfig = { ...this.sentinelConfig, resourceGroup: e.target.value }} /></div>
        <div class="form-group"><label class="form-label">工作区名称</label>
          <input type="text" class="form-input" .value=${this.sentinelConfig.workspace}
            @input=${(e: any) => this.sentinelConfig = { ...this.sentinelConfig, workspace: e.target.value }} /></div>
      </div>
      <h3 class="section-title">同步选项</h3>
      <div class="form-row" style="margin-bottom: 16px;">
        <div class="form-group"><label class="form-label">自动同步</label>
          <div class="toggle ${this.sentinelConfig.autoSync ? 'active' : ''}"
            @click=${() => this.sentinelConfig = { ...this.sentinelConfig, autoSync: !this.sentinelConfig.autoSync }}></div></div>
        <div class="form-group"><label class="form-label">同步间隔 (分钟)</label>
          <input type="number" class="form-input" style="width: 120px;" .value=${this.sentinelConfig.syncInterval}
            @input=${(e: any) => this.sentinelConfig = { ...this.sentinelConfig, syncInterval: parseInt(e.target.value) }} /></div>
      </div>
      <div class="btn-group">
        <button class="btn btn-secondary" @click=${this.testConnection} ?disabled=${this.testing}>${this.testing ? '测试中...' : '🧪 测试连接'}</button>
        <button class="btn btn-success" @click=${this.syncNow}>🔄 立即同步</button>
        <button class="btn btn-primary" @click=${this.saveConfig} ?disabled=${this.saving}>${this.saving ? '保存中...' : '💾 保存配置'}</button>
      </div>
    `;
  }

  private renderSyslogConfig() {
    return html`
      <div class="config-header">
        <h2 class="config-title">📝 Syslog 配置</h2>
        <div class="toggle ${this.syslogConfig.enabled ? 'active' : ''}"
          @click=${() => this.syslogConfig = { ...this.syslogConfig, enabled: !this.syslogConfig.enabled }}></div>
      </div>
      <div class="info-box">💡 Syslog 是标准日志转发协议。支持 TCP/UDP 两种传输方式，建议生产环境使用 TCP。</div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">传输协议</label>
          <select class="form-select" .value=${this.syslogConfig.protocol}
            @change=${(e: any) => this.syslogConfig = { ...this.syslogConfig, protocol: e.target.value }}>
            <option value="udp">UDP (低延迟，不保证送达)</option>
            <option value="tcp">TCP (可靠传输，推荐)</option>
          </select></div>
        <div class="form-group"><label class="form-label">Syslog 服务器地址</label>
          <input type="text" class="form-input" .value=${this.syslogConfig.host}
            @input=${(e: any) => this.syslogConfig = { ...this.syslogConfig, host: e.target.value }}
            placeholder="syslog.company.local" /></div>
        <div class="form-group"><label class="form-label">端口</label>
          <input type="number" class="form-input" .value=${this.syslogConfig.port}
            @input=${(e: any) => this.syslogConfig = { ...this.syslogConfig, port: parseInt(e.target.value) }} /></div>
        <div class="form-group"><label class="form-label">Facility (设施)</label>
          <select class="form-select" .value=${this.syslogConfig.facility}
            @change=${(e: any) => this.syslogConfig = { ...this.syslogConfig, facility: e.target.value }}>
            <option value="local0">local0 (推荐)</option>
            <option value="local1">local1</option><option value="local2">local2</option>
            <option value="local3">local3</option><option value="local4">local4</option>
            <option value="local5">local5</option><option value="local6">local6</option>
            <option value="local7">local7</option><option value="auth">auth</option>
            <option value="daemon">daemon</option><option value="user">user</option>
          </select></div>
      </div>
      <h3 class="section-title">高级选项</h3>
      <div class="form-row" style="margin-bottom: 16px;">
        <div class="form-group"><label class="form-label">严重级别映射</label>
          <div class="toggle ${this.syslogConfig.severityMapping ? 'active' : ''}"
            @click=${() => this.syslogConfig = { ...this.syslogConfig, severityMapping: !this.syslogConfig.severityMapping }}></div></div>
      </div>
      <div class="info-box">📋 Syslog 格式说明：<br/>- severity: 0=Emergency, 1=Alert, 2=Critical, 3=Error, 4=Warning, 5=Notice, 6=Info, 7=Debug<br/>- 启用严重级别映射后，会根据事件级别自动设置 Syslog severity</div>
      <div class="btn-group">
        <button class="btn btn-secondary" @click=${this.testConnection} ?disabled=${this.testing}>${this.testing ? '测试中...' : '🧪 测试连接'}</button>
        <button class="btn btn-success" @click=${this.syncNow}>🔄 发送测试消息</button>
        <button class="btn btn-primary" @click=${this.saveConfig} ?disabled=${this.saving}>${this.saving ? '保存中...' : '💾 保存配置'}</button>
      </div>
    `;
  }

  private renderStatusView() {
    return html`
      <div class="config-header"><h2 class="config-title">📊 SIEM 集成状态总览</h2></div>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">1,247</div><div class="stat-label">总事件数</div></div>
        <div class="stat-card"><div class="stat-value" style="color:#22c55e;">2</div><div class="stat-label">已连接平台</div></div>
        <div class="stat-card"><div class="stat-value" style="color:#f59e0b;">3</div><div class="stat-label">同步错误</div></div>
        <div class="stat-card"><div class="stat-value">5分钟前</div><div class="stat-label">最后同步</div></div>
      </div>
      <h3 class="section-title">各平台详细状态</h3>
      <table class="log-table">
        <thead><tr><th>平台</th><th>状态</th><th>最后同步</th><th>同步事件数</th><th>错误数</th><th>操作</th></tr></thead>
        <tbody>
          <tr><td>🔍 Splunk</td><td><span class="badge badge-success">已连接</span></td><td>5分钟前</td><td>1,180</td><td>0</td>
            <td><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px;" @click=${() => this.setTab('splunk')}>配置</button>
                <button class="btn btn-success" style="padding:4px 10px;font-size:12px;" @click=${() => { this.activeTab = 'splunk'; this.syncNow(); }}>同步</button></td></tr>
          <tr><td>🛡️ IBM QRadar</td><td><span class="badge badge-error">连接错误</span></td><td>1小时前</td><td>67</td><td>3</td>
            <td><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px;" @click=${() => this.setTab('qradar')}>配置</button></td></tr>
          <tr><td>☁️ Microsoft Sentinel</td><td><span class="badge badge-warning">未配置</span></td><td>-</td><td>0</td><td>0</td>
            <td><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px;" @click=${() => this.setTab('sentinel')}>配置</button></td></tr>
          <tr><td>📝 Syslog</td><td><span class="badge badge-info">就绪</span></td><td>-</td><td>0</td><td>0</td>
            <td><button class="btn btn-secondary" style="padding:4px 10px;font-size:12px;" @click=${() => this.setTab('syslog')}>配置</button></td></tr>
        </tbody>
      </table>
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'sc-siem-config': ScSiemConfig; } }
