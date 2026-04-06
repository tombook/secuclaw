/**
 * SecuClaw Data Resource Center Overview - 数据资源中心总览
 * 
 * 16个核心数据库状态概览、数据血缘关系、数据质量监控
 */
import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { dataStore, type DatabaseInfo, type LineageGraph } from '../store/data-store.js';
import '../components/sc-ai-assistant.js';
import '../components/sc-smart-card.js';

// ============ 页面组件 ============

@customElement('sc-data-overview')
export class ScDataOverview extends LitElement {
  private _i18n = new I18nController(this);

  @state() private loading = true;
  @state() private databases: DatabaseInfo[] = [];
  @state() private lineageGraph: LineageGraph | null = null;
  @state() private healthStats = { healthy: 0, warning: 0, error: 0, unknown: 0 };

  staticstyles= css`
    :host { display: block; }
    .data-container{
      display: grid;
      grid-template-columns: 1fr 360px;
      gap: var(--sc-spacing-lg, 20px);
      height: 100%;
    }
    @media (max-width: 1200px) {
      .data-container { grid-template-columns: 1fr; }
    }
    .main-content{
      display: flex;
      flex-direction: column;
      gap: var(--sc-spacing-lg, 20px);
      overflow-y: auto;
    }
    .page-header{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .page-title-section {
      flex: 1;
    }
    .page-title{
      font-size: var(--sc-font-size-2xl, 24px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
    }
    .page-description {
      font-size: var(--sc-font-size-sm, 14px);
      color: var(--sc-text-secondary, #64748b);
      margin-top: var(--sc-spacing-xs, 4px);
    }
    .header-actions{
      display: flex;
      gap: var(--sc-spacing-sm, 8px);
    }
    .btn{
      padding: var(--sc-spacing-sm, 8px) var(--sc-spacing-md, 16px);
      border-radius: var(--sc-radius-md, 8px);
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }
    .btn-primary{
      background-color: var(--sc-primary, #3b82f6);
      color: white;
    }
    .btn-secondary{
      background-color: var(--sc-bg-secondary, #f8fafc);
      color: var(--sc-text-primary, #1e293b);
      border: 1px solid var(--sc-border-color, #e2e8f0);
    }
    /* 统计卡片 */
    .stats-grid{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--sc-spacing-md, 16px);
    }
    @media (max-width: 900px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
    /* 数据库分类 */
    .db-section{
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }
    .section-header{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--sc-spacing-md, 16px);
    }
    .section-title{
      font-size: var(--sc-font-size-lg, 18px);
      font-weight: 600;
      color: var(--sc-text-primary, #1e293b);
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm, 8px);
    }
    .db-grid{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: var(--sc-spacing-md, 16px);
    }
    .db-card{
      padding: var(--sc-spacing-md, 16px);
      background-color: var(--sc-bg-secondary, #f8fafc);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-md, 8px);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .db-card:hover{
      border-color: var(--sc-primary, #3b82f6);
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
    }
    .db-header{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--sc-spacing-sm, 8px);
    }
    .db-icon{
      width: 40px;
      height: 40px;
      border-radius: var(--sc-radius-md, 8px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }
    .db-status{
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    .db-status.healthy{ background-color: var(--sc-success, #22c55e); }
    .db-status.warning{ background-color: var(--sc-warning, #f59e0b); }
    .db-status.error{ background-color: var(--sc-danger, #ef4444); }
    .db-status.unknown{ background-color: var(--sc-text-tertiary, #94a3b8); }
    .db-name{
      font-size: var(--sc-font-size-sm, 14px);
      font-weight: 500;
      color: var(--sc-text-primary, #1e293b);
    }
    .db-name-en{
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-tertiary, #94a3b8);
    }
    .db-meta{
      display: flex;
      justify-content: space-between;
      margin-top: var(--sc-spacing-sm, 8px);
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
    }
    .db-count{
      font-weight: 500;
      color: var(--sc-text-primary, #1e293b);
    }
    .db-pages{
      display: flex;
      gap: 4px;
      margin-top: var(--sc-spacing-sm, 8px);
      flex-wrap: wrap;
    }
    .page-tag{
      padding: 2px 6px;
      background-color: var(--sc-bg-tertiary, #f1f5f9);
      border-radius: var(--sc-radius-sm, 4px);
      font-size: 10px;
      color: var(--sc-text-secondary, #64748b);
    }
    /* 血缘关系图 */
    .lineage-section{
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }
    .lineage-placeholder{
      height: 300px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background-color: var(--sc-bg-secondary, #f8fafc);
      border-radius: var(--sc-radius-md, 8px);
      color: var(--sc-text-tertiary, #94a3b8);
    }
    .lineage-icon{
      font-size: 48px;
      margin-bottom: var(--sc-spacing-md, 16px);
    }
    /* 数据质量 */
    .quality-section{
      background-color: var(--sc-bg-card, #ffffff);
      border: 1px solid var(--sc-border-color, #e2e8f0);
      border-radius: var(--sc-radius-lg, 12px);
      padding: var(--sc-spacing-lg, 20px);
    }
    .quality-grid{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--sc-spacing-md, 16px);
    }
    @media (max-width: 900px) {
      .quality-grid { grid-template-columns: repeat(2, 1fr); }
    }
    .quality-item{
      text-align: center;
      padding: var(--sc-spacing-md, 16px);
      background-color: var(--sc-bg-secondary, #f8fafc);
      border-radius: var(--sc-radius-md, 8px);
    }
    .quality-value{
      font-size: var(--sc-font-size-2xl, 24px);
      font-weight: 700;
      color: var(--sc-text-primary, #1e293b);
    }
    .quality-label{
      font-size: var(--sc-font-size-xs, 12px);
      color: var(--sc-text-secondary, #64748b);
      margin-top: var(--sc-spacing-xs, 4px);
    }
    .ai-sidebar{
      position: sticky;
      top: 0;
      height: calc(100vh - var(--sc-spacing-lg, 20px) * 2);
      overflow: hidden;
    }
  `;

  constructor() {
    super();
    this.loadDataCenterData();
  }

  private async loadDataCenterData() {
    this.loading = true;
    try {
      await dataStore.loadDatabases();
      await dataStore.loadLineageGraph();
      this.databases = dataStore.getDatabases();
      this.lineageGraph = dataStore.getLineageGraph();
      this.healthStats = this.calculateHealthStats();
    } finally {
      this.loading = false;
    }
  }

  private calculateHealthStats() {
    return {
      healthy: this.databases.filter(db => db.health === 'healthy').length,
      warning: this.databases.filter(db => db.health === 'warning').length,
      error: this.databases.filter(db => db.health === 'error').length,
      unknown: this.databases.filter(db => db.health === 'unknown').length
    };
  }

  private getDatabasesByType(type: string) {
    return this.databases.filter(db => db.type === type);
  }

  private renderDatabaseCard(db: DatabaseInfo) {
    return html`
      <div class="db-card">
        <div class="db-header">
          <div class="db-icon" style="background-color: ${db.color}20;">${db.icon}</div>
          <div class="db-status ${db.health}"></div>
        </div>
        <div class="db-name">${db.name}</div>
        <div class="db-name-en">${db.nameEn}</div>
        <div class="db-meta">
          <span>记录数: <span class="db-count">${db.recordCount.toLocaleString()}</span></span>
          <span>大小: ${db.size}</span>
        </div>
        <div class="db-pages">
          ${db.relatedPages.slice(0, 3).map(page => html`<span class="page-tag">${page}</span>`)}
          ${db.relatedPages.length > 3? html`<span class="page-tag">+${db.relatedPages.length - 3}</span>`: ''}
        </div>
      </div>
    `;
  }

  render() {
    if (this.loading) {
      return html`<div style="text-align:center;padding:2rem;"><div style="font-size:48px;margin-bottom:16px;">⏳</div><div style="color:var(--sc-text-secondary);">加载中...</div></div>`;
    }

    const totalRecords = this.databases.reduce((sum, db) => sum + db.recordCount, 0);

    return html`
      <div class="data-container">
        <div class="main-content">
          <div class="page-header">
            <div class="page-title-section">
              <h1 class="page-title">
                <span>🗄️</span>
                数据资源中心
              </h1>
              <div class="page-description">
                <span>统一管理企业安全数据资产，确保数据质量、可追溯血缘</span>
              </div>
            </div>
            <div class="header-actions">
              <button class="btn btn-secondary">🔄 同步全部</button>
              <button class="btn btn-primary">+ 添加数据源</button>
            </div>
          </div>

          <div class="stats-grid">
            <sc-smart-card title="数据库总数" value="${this.databases.length}" icon="🗄️" status="success"></sc-smart-card>
            <sc-smart-card title="健康" value="${this.healthStats.healthy}" icon="✅" status="success"></sc-smart-card>
            <sc-smart-card title="警告" value="${this.healthStats.warning}" icon="⚠️" status="warning"></sc-smart-card>
            <sc-smart-card title="总记录数" value="${totalRecords > 1000000? (totalRecords/1000000).toFixed(1)+'M': totalRecords > 1000? (totalRecords/1000).toFixed(1)+'K': totalRecords}" icon="📊" status="success"></sc-smart-card>
          </div>

          <div class="db-section">
            <div class="section-header">
              <h3 class="section-title">📦 业务数据库</h3>
              <span style="font-size:12px;color:var(--sc-text-secondary);">${this.getDatabasesByType('business').length} 个</span>
            </div>
            <div class="db-grid">
              ${this.getDatabasesByType('business').map(db => this.renderDatabaseCard(db))}
            </div>
          </div>

          <div class="db-section">
            <div class="section-header">
              <h3 class="section-title">🔧 支撑数据库</h3>
              <span style="font-size:12px;color:var(--sc-text-secondary);">${this.getDatabasesByType('support').length} 个</span>
            </div>
            <div class="db-grid">
              ${this.getDatabasesByType('support').map(db => this.renderDatabaseCard(db))}
            </div>
          </div>

          <div class="db-section">
            <div class="section-header">
              <h3 class="section-title">📚 知识数据库</h3>
              <span style="font-size:12px;color:var(--sc-text-secondary);">${this.getDatabasesByType('knowledge').length} 个</span>
            </div>
            <div class="db-grid">
              ${this.getDatabasesByType('knowledge').map(db => this.renderDatabaseCard(db))}
            </div>
          </div>

          <div class="db-section">
            <div class="section-header">
              <h3 class="section-title">👥 组织数据库</h3>
              <span style="font-size:12px;color:var(--sc-text-secondary);">${this.getDatabasesByType('organization').length} 个</span>
            </div>
            <div class="db-grid">
              ${this.getDatabasesByType('organization').map(db => this.renderDatabaseCard(db))}
            </div>
          </div>

          <div class="lineage-section">
            <div class="section-header">
              <h3 class="section-title">🔗 数据血缘关系</h3>
              <button class="btn btn-secondary">查看详情</button>
            </div>
            <div class="lineage-placeholder">
              <div class="lineage-icon">🔗</div>
              <div>数据血缘关系图</div>
              <div style="font-size:12px;margin-top:8px;">可视化展示数据流向和依赖关系</div>
            </div>
          </div>

          <div class="quality-section">
            <div class="section-header">
              <h3 class="section-title">✨ 数据质量指标</h3>
            </div>
            <div class="quality-grid">
              <div class="quality-item">
                <div class="quality-value">98.5%</div>
                <div class="quality-label">完整性</div>
              </div>
              <div class="quality-item">
                <div class="quality-value">99.2%</div>
                <div class="quality-label">准确性</div>
              </div>
              <div class="quality-item">
                <div class="quality-value">97.8%</div>
                <div class="quality-label">及时性</div>
              </div>
              <div class="quality-item">
                <div class="quality-value">96.3%</div>
                <div class="quality-label">一致性</div>
              </div>
            </div>
          </div>
        </div>

        <div class="ai-sidebar">
          <sc-ai-assistant
            pageId="data-center"
            pageTitle="数据资源中心"
            .pageData=${{ databases: this.databases, lineage: this.lineageGraph }}
            userRole="security-expert"
          ></sc-ai-assistant>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-data-overview': ScDataOverview;
  }
}
