/** New Modules Hub */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../components/detection/sc-soar-dashboard.js';
import '../components/ueba/sc-ueba-dashboard.js';
import '../components/detection/sc-sigma-dashboard.js';
import '../components/ai-scm/sc-ai-scm-dashboard.js';
import '../components/easm/sc-easm-dashboard.js';
import '../components/rasp/sc-rasp-dashboard.js';
import '../components/dspm/sc-dspm-dashboard.js';
import '../components/itdr/sc-itdr-dashboard.js';
import '../components/saas/sc-saas-dashboard.js';
import '../components/tenant/sc-tenant-dashboard.js';
import '../components/notification/sc-notification-center.js';

type ModuleKey = 'soar' | 'ueba' | 'sigma' | 'ai-scm' | 'easm' | 'rasp' | 'dspm' | 'itdr' | 'saas' | 'tenant' | 'notification';

interface ModuleMeta {
  key: ModuleKey;
  icon: string;
  name: string;
  description: string;
  accent: string;
}

@customElement('sc-new-modules-hub')
export class ScNewModulesHub extends LitElement {
  static styles = css`
    :host {
      display: block;
      --sc-bg-primary: #0a0e17;
      --sc-bg-secondary: #141b26;
      --sc-text-primary: #ffffff;
      --sc-text-muted: #8899aa;
      --sc-border: #2a3a4a;
      --sc-primary: #00d4ff;
      --sc-critical: #ff4d6d;
      --sc-high: #ffaa00;
      --sc-medium: #facc15;
      --sc-low: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .hub {
      background: var(--sc-bg-primary);
      min-height: 100vh;
      color: var(--sc-text-primary);
      padding: 32px 24px;
      font-family: Inter, system-ui, sans-serif;
    }
    .welcome {
      text-align: center;
      margin-bottom: 36px;
      padding: 28px 20px;
      background: linear-gradient(135deg, rgba(0, 212, 255, 0.08), rgba(168, 85, 247, 0.05));
      border: 1px solid var(--sc-border);
      border-radius: 16px;
    }
    .welcome-title {
      font-size: 30px;
      font-weight: 700;
      color: var(--sc-text-primary);
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }
    .welcome-title span { color: var(--sc-primary); }
    .welcome-subtitle {
      font-size: 14px;
      color: var(--sc-text-muted);
      letter-spacing: 0.4px;
    }
    .welcome-subtitle strong {
      color: var(--sc-primary);
      font-weight: 600;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      max-width: 1600px;
      margin: 0 auto;
    }
    .card {
      background: var(--sc-bg-secondary);
      border: 1px solid var(--sc-border);
      border-radius: 14px;
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      position: relative;
      overflow: hidden;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      background: var(--accent, var(--sc-primary));
      opacity: 0.8;
    }
    .card:hover {
      transform: translateY(-4px);
      border-color: var(--accent, var(--sc-primary));
      box-shadow: 0 8px 24px rgba(0, 212, 255, 0.12);
    }
    .card-icon {
      font-size: 38px;
      line-height: 1;
      margin-bottom: 4px;
    }
    .card-name {
      font-size: 17px;
      font-weight: 700;
      color: var(--sc-text-primary);
    }
    .card-desc {
      font-size: 12.5px;
      color: var(--sc-text-muted);
      line-height: 1.55;
      flex: 1;
    }
    .open-btn {
      align-self: stretch;
      padding: 10px 14px;
      background: var(--accent, var(--sc-primary));
      color: #0a0e17;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: filter 0.2s ease, transform 0.2s ease;
      margin-top: 8px;
    }
    .open-btn:hover { filter: brightness(1.1); transform: translateX(2px); }
    .open-btn::after { content: ' →'; }

    .active-view {
      max-width: 1600px;
      margin: 0 auto;
      background: var(--sc-bg-secondary);
      border: 1px solid var(--sc-border);
      border-radius: 14px;
      overflow: hidden;
    }
    .active-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 24px;
      background: var(--sc-bg-primary);
      border-bottom: 1px solid var(--sc-border);
    }
    .active-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 18px;
      font-weight: 700;
      color: var(--sc-text-primary);
    }
    .active-title .icon { font-size: 22px; }
    .close-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--sc-bg-secondary);
      border: 1px solid var(--sc-border);
      color: var(--sc-text-muted);
      font-size: 20px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
    }
    .close-btn:hover {
      color: var(--sc-critical);
      border-color: var(--sc-critical);
      background: rgba(255, 77, 109, 0.08);
    }
    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--sc-border), transparent);
    }
    .active-body { padding: 8px; }

    @media (max-width: 1400px) { .grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 1024px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px)  {
      .grid { grid-template-columns: 1fr; }
      .welcome-title { font-size: 22px; }
      .hub { padding: 20px 14px; }
    }
  `;

  @state() private _activeModule: ModuleKey | null = null;

  private _modules: ModuleMeta[] = [
    {
      key: 'soar',
      icon: '🛡️',
      name: 'SOAR 告警关联',
      description: '6 攻击链规则 · MITRE 重建 · 动态优先级',
      accent: '#00d4ff',
    },
    {
      key: 'ueba',
      icon: '🧠',
      name: 'UEBA 行为基线',
      description: '用户/实体画像 · 异常检测 · 风险评分',
      accent: '#a855f7',
    },
    {
      key: 'sigma',
      icon: '🎯',
      name: 'Sigma 检测工程',
      description: '7 内置规则 · 6 SIEM 转换 · MITRE 覆盖',
      accent: '#10b981',
    },
    {
      key: 'ai-scm',
      icon: '🔒',
      name: 'AI 工具链安全',
      description: 'MCP 风险评分 · 提示词注入 · 行为审计',
      accent: '#ffaa00',
    },
    {
      key: 'easm',
      icon: '🌐',
      name: '外部攻击面',
      description: '资产发现 · 暴露扫描 · 凭证监控 · 钓鱼检测',
      accent: '#ff4d6d',
    },
    {
      key: 'rasp',
      icon: '🛡️',
      name: 'RASP 运行时自保护',
      description: 'SQL 注入拦截 · XSS 拦截 · API 滥用检测',
      accent: '#22c55e',
    },
    {
      key: 'dspm',
      icon: '💾',
      name: 'DSPM 数据安全态势',
      description: '数据资产 · 访问分析 · 居住地合规 · 数据流',
      accent: '#0ea5e9',
    },
    {
      key: 'tenant',
      icon: '🏢',
      name: '多租户管理',
      description: '租户 CRUD · 使用量 · 隔离 · 管理员操作',
      accent: '#a78bfa',
    },
    {
      key: 'notification',
      icon: '📨',
      name: '通知中心',
      description: '多通道推送 · 订阅者 · 偏好配置 · 实时统计',
      accent: '#fb923c',
    },
  ];

  private _openModule(name: ModuleKey) {
    this._activeModule = name;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private _closeModule() {
    this._activeModule = null;
  }

  private _renderHub() {
    return html`
      <section class="welcome" aria-label="Welcome">
        <div class="welcome-title">🚀 <span>SecuClaw</span> 进化能力中心</div>
        <div class="welcome-subtitle">
          12 大新能力 · <strong>800+</strong> API · 11 大仪表盘
        </div>
      </section>
      <div class="grid" role="list" aria-label="Capability modules">
        ${this._modules.map(m => html`
          <div class="card" role="listitem" style="--accent: ${m.accent}">
            <div class="card-icon">${m.icon}</div>
            <div class="card-name">${m.name}</div>
            <div class="card-desc">${m.description}</div>
            <button class="open-btn" @click=${() => this._openModule(m.key)}>Open</button>
          </div>
        `)}
      </div>
    `;
  }

  private _renderActiveView() {
    const active = this._modules.find(m => m.key === this._activeModule);
    if (!active) return html``;
    return html`
      <div class="active-view">
        <div class="active-header">
          <div class="active-title">
            <span class="icon">${active.icon}</span>
            <span>${active.name}</span>
          </div>
          <button class="close-btn" @click=${() => this._closeModule()} aria-label="Close">×</button>
        </div>
        <div class="divider"></div>
        <div class="active-body">
          ${this._renderModuleDashboard(active.key)}
        </div>
      </div>
    `;
  }

  private _renderModuleDashboard(key: ModuleKey) {
    switch (key) {
      case 'soar':   return html`<sc-soar-dashboard></sc-soar-dashboard>`;
      case 'ueba':   return html`<sc-ueba-dashboard></sc-ueba-dashboard>`;
      case 'sigma':  return html`<sc-sigma-dashboard></sc-sigma-dashboard>`;
      case 'ai-scm': return html`<sc-ai-scm-dashboard></sc-ai-scm-dashboard>`;
      case 'easm':   return html`<sc-easm-dashboard></sc-easm-dashboard>`;
      case 'rasp':   return html`<sc-rasp-dashboard></sc-rasp-dashboard>`;
      case 'dspm':   return html`<sc-dspm-dashboard></sc-dspm-dashboard>`;
      case 'itdr':   return html`<sc-itdr-dashboard></sc-itdr-dashboard>`;
      case 'saas':   return html`<sc-saas-dashboard></sc-saas-dashboard>`;
    }
  }

  render() {
    return html`
      <div class="hub" role="main" aria-label="SecuClaw New Modules Hub">
        ${this._activeModule ? this._renderActiveView() : this._renderHub()}
      </div>
    `;
  }
}
declare global { interface HTMLElementTagNameMap { 'sc-new-modules-hub': ScNewModulesHub; } }
