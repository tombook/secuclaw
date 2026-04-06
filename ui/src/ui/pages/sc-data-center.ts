import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * Data Resource Center - Professional Design
 */
@customElement('sc-data-center')
export class ScDataCenter extends LitElement {
  static styles = css`
    :host { display: block; }
    .container { max-width: 1600px; margin: 0 auto; padding: 24px; }
    .hero { display: flex; gap: 24px; padding: 32px; background: linear-gradient(135deg, var(--sc-bg-card) 0%, var(--sc-bg-secondary) 100%); border-radius: 16px; margin-bottom: 32px; }
    .hero-icon { width: 72px; height: 72px; background: linear-gradient(135deg, #8B5CF6, #7C3AED); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 36px; }
    .hero-title { font-size: 28px; font-weight: 700; margin: 0 0 8px; }
    .hero-desc { color: var(--sc-text-secondary); margin: 0; line-height: 1.6; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .card { background: var(--sc-bg-card); border: 1px solid var(--sc-border-color); border-radius: 12px; padding: 24px; }
    .card-icon { width: 48px; height: 48px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 24px; margin-bottom: 16px; }
    .card-value { font-size: 32px; font-weight: 700; color: var(--sc-text-primary); }
    .card-label { font-size: 14px; color: var(--sc-text-secondary); margin-top: 4px; }
    .table-container { background: var(--sc-bg-card); border: 1px solid var(--sc-border-color); border-radius: 16px; overflow: hidden; }
    .table-header { padding: 16px 24px; background: var(--sc-bg-secondary); border-bottom: 1px solid var(--sc-border-color); font-weight: 600; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 600; color: var(--sc-text-tertiary); text-transform: uppercase; background: var(--sc-bg-tertiary); }
    td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid var(--sc-border-color); }
    tr:hover td { background: var(--sc-bg-hover); }
    .status { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 500; }
    .status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .healthy { background: rgba(16, 185, 129, 0.15); color: #10B981; }
    .warning { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
    .error { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
  `;

  private databases = [
    { name: '威胁情报库', type: 'Knowledge', records: '2.3M', size: '45GB', health: 'healthy' },
    { name: '漏洞库', type: 'Business', records: '156K', size: '12GB', health: 'healthy' },
    { name: '事件日志库', type: 'Business', records: '890M', size: '234GB', health: 'warning' },
    { name: '资产库', type: 'Organization', records: '12K', size: '3GB', health: 'healthy' },
    { name: '证书库', type: 'Security', records: '2.4K', size: '512MB', health: 'healthy' },
    { name: '情报共享库', type: 'Knowledge', records: '45K', size: '8GB', health: 'error' },
  ];

  render() {
    const healthy = this.databases.filter(d => d.health === 'healthy').length;
    const warning = this.databases.filter(d => d.health === 'warning').length;
    const error = this.databases.filter(d => d.health === 'error').length;

    return html`
      <div class="container">
        <div class="hero">
          <div class="hero-icon">🗄️</div>
          <div>
            <h1 class="hero-title">数据资源中心</h1>
            <p class="hero-desc">统一管理安全运营数据资产，跟踪数据血缘、质量和合规状态。</p>
          </div>
        </div>

        <div class="grid">
          <div class="card" style="border-left: 3px solid #8B5CF6;">
            <div class="card-icon" style="background: rgba(139, 92, 246, 0.15);">🗄️</div>
            <div class="card-value">${this.databases.length}</div>
            <div class="card-label">总数据库</div>
          </div>
          <div class="card" style="border-left: 3px solid #10B981;">
            <div class="card-icon" style="background: rgba(16, 185, 129, 0.15); color: #10B981;">✓</div>
            <div class="card-value">${healthy}</div>
            <div class="card-label">健康</div>
          </div>
          <div class="card" style="border-left: 3px solid #F59E0B;">
            <div class="card-icon" style="background: rgba(245, 158, 11, 0.15); color: #F59E0B;">⚠</div>
            <div class="card-value">${warning}</div>
            <div class="card-label">警告</div>
          </div>
          <div class="card" style="border-left: 3px solid #EF4444;">
            <div class="card-icon" style="background: rgba(239, 68, 68, 0.15); color: #EF4444;">✗</div>
            <div class="card-value">${error}</div>
            <div class="card-label">错误</div>
          </div>
        </div>

        <div class="table-container">
          <div class="table-header">📋 数据库列表</div>
          <table>
            <thead>
              <tr>
                <th>名称</th>
                <th>类型</th>
                <th>记录数</th>
                <th>大小</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              ${this.databases.map(db => html`
                <tr>
                  <td><strong>${db.name}</strong></td>
                  <td>${db.type}</td>
                  <td>${db.records}</td>
                  <td>${db.size}</td>
                  <td>
                    <span class="status ${db.health}">
                      ${db.health === 'healthy' ? '健康' : db.health === 'warning' ? '警告' : '错误'}
                    </span>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sc-data-center': ScDataCenter; }
}
