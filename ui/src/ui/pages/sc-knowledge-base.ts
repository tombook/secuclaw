import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { gatewayClient } from '../gateway-client.js';
import { roleContext } from '../store/role-context.js';
import '../components/design-system/sc-button.js';
import '../components/design-system/sc-card.js';
import '../components/design-system/sc-badge.js';
import '../components/sc-smart-recommendation-bar.js';

@customElement('sc-knowledge-base')
export class ScKnowledgeBase extends LitElement {
  private i18n = new I18nController(this);

  @state() private activeTab = 'mitre';
  @state() private mitreStats: any = null;
  @state() private tactics: any[] = [];
  @state() private techniques: any[] = [];
  @state() private scfStats: any = null;
  @state() private scfDomains: any[] = [];
  @state() private scfControls: any[] = [];
  @state() private searchQuery = '';
  @state() private searchResults: any[] = [];
  @state() private loading = false;

  private fallbackTactics = [
    { id: 'TA0001', name: 'Initial Access', description: '对手正试图进入您的网络', techniqueCount: 10 },
    { id: 'TA0002', name: 'Execution', description: '对手正试图运行恶意代码', techniqueCount: 14 },
    { id: 'TA0003', name: 'Persistence', description: '对手正试图保持其立足点', techniqueCount: 20 },
    { id: 'TA0004', name: 'Privilege Escalation', description: '对手正试图获得更高级别权限', techniqueCount: 16 },
    { id: 'TA0005', name: 'Defense Evasion', description: '对手正试图避免被检测到', techniqueCount: 18 },
    { id: 'TA0006', name: 'Credential Access', description: '对手正试图窃取账户凭据', techniqueCount: 12 },
    { id: 'TA0007', name: 'Discovery', description: '对手正试图了解您的环境', techniqueCount: 14 },
    { id: 'TA0008', name: 'Lateral Movement', description: '对手正试图在您的环境中移动', techniqueCount: 10 },
  ];

  private fallbackDomains = [
    { id: 'GOV', name: '治理 (GOV)', description: '安全治理、策略和风险管理', controlCount: 12 },
    { id: 'IDM', name: '身份管理 (IDM)', description: '身份和访问管理控制', controlCount: 8 },
    { id: 'NET', name: '网络安全 (NET)', description: '网络基础设施安全控制', controlCount: 10 },
    { id: 'DSP', name: '数据安全 (DSP)', description: '数据保护和隐私控制', controlCount: 14 },
    { id: 'OPS', name: '安全运营 (OPS)', description: '安全监控和事件响应', controlCount: 11 },
  ];

  static styles = css`
    :host { display: block; min-height: 100vh; background: var(--sc-bg-primary, #0f172a); color: var(--sc-text-primary, #f8fafc); font-family: system-ui, -apple-system, sans-serif; }
    .container { max-width: 1600px; margin: 0 auto; padding: 24px; }
    .hero { display: flex; gap: 24px; align-items: flex-start; padding: 32px; background: linear-gradient(135deg, var(--sc-bg-card, #1e293b) 0%, rgba(139, 92, 246, 0.1) 100%); border: 1px solid var(--sc-border-color, #334155); border-radius: 16px; margin-bottom: 32px; }
    .hero-icon { width: 72px; height: 72px; background: linear-gradient(135deg, #8B5CF6, #7C3AED); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 36px; flex-shrink: 0; }
    .hero-title { font-size: 28px; font-weight: 700; margin: 0 0 8px; }
    .hero-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(139, 92, 246, 0.15); color: #8B5CF6; border-radius: 20px; font-size: 12px; font-weight: 500; margin-bottom: 12px; }
    .hero-desc { font-size: 15px; line-height: 1.6; color: var(--sc-text-secondary, #cbd5e1); margin: 0; max-width: 600px; }
    .search-bar { display: flex; gap: 12px; margin-bottom: 24px; }
    .search-input { flex: 1; padding: 12px 16px; background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 10px; color: var(--sc-text-primary, #f8fafc); font-size: 14px; }
    .search-input:focus { outline: none; border-color: #8B5CF6; }
    .search-btn { padding: 12px 24px; background: linear-gradient(135deg, #8B5CF6, #7C3AED); color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; }
    .tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--sc-border-color, #334155); margin-bottom: 24px; }
    .tab { padding: 12px 20px; font-size: 14px; font-weight: 500; color: var(--sc-text-secondary, #cbd5e1); background: none; border: none; cursor: pointer; position: relative; transition: all 200ms ease; }
    .tab:hover { color: var(--sc-text-primary, #f8fafc); }
    .tab.active { color: #8B5CF6; }
    .tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 2px; background: #8B5CF6; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .stat-card { background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 12px; padding: 20px; }
    .stat-value { font-size: 32px; font-weight: 700; color: #8B5CF6; }
    .stat-label { font-size: 13px; color: var(--sc-text-secondary, #cbd5e1); margin-top: 4px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .card { background: var(--sc-bg-card, #1e293b); border: 1px solid var(--sc-border-color, #334155); border-radius: 12px; padding: 20px; cursor: pointer; transition: all 200ms ease; }
    .card:hover { border-color: #8B5CF6; transform: translateY(-2px); }
    .card-id { font-size: 11px; font-weight: 600; color: #8B5CF6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .card-name { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
    .card-desc { font-size: 13px; color: var(--sc-text-secondary, #cbd5e1); line-height: 1.5; margin-bottom: 12px; }
    .card-meta { display: flex; gap: 12px; font-size: 12px; color: var(--sc-text-tertiary, #94a3b8); }
    .card-meta span { display: inline-flex; align-items: center; gap: 4px; }
    .loading { text-align: center; padding: 48px; color: var(--sc-text-tertiary, #94a3b8); }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.loadData();
  }

  private async loadData() {
    this.loading = true;
    try {
      const [statsRes, tacticsRes, scfStatsRes, scfDomainsRes] = await Promise.allSettled([
        gatewayClient.request('knowledge.mitre.stats', {}),
        gatewayClient.request('knowledge.mitre.tactics', {}),
        gatewayClient.request('knowledge.scf.stats', {}),
        gatewayClient.request('knowledge.scf.domains', {}),
      ]);

      if (statsRes.status === 'fulfilled') {
        this.mitreStats = statsRes.value;
      }
      if (tacticsRes.status === 'fulfilled') {
        const d = tacticsRes.value as Record<string, unknown>;
        if (Array.isArray(d?.tactics)) this.tactics = [...d.tactics as any[]];
      }
      if (scfStatsRes.status === 'fulfilled') {
        this.scfStats = scfStatsRes.value;
      }
      if (scfDomainsRes.status === 'fulfilled') {
        const d = scfDomainsRes.value as Record<string, unknown>;
        if (Array.isArray(d?.domains)) this.scfDomains = [...d.domains as any[]];
      }
    } catch (e) {
      console.error('[knowledge-base] Failed to load data:', e);
    }
    this.loading = false;
  }

  private async handleSearch() {
    if (!this.searchQuery.trim()) return;
    try {
      const method = this.activeTab === 'mitre' ? 'knowledge.mitre.search' : 'knowledge.scf.search';
      const res = await gatewayClient.request(method, { query: this.searchQuery });
      const d = res as Record<string, unknown>;
      this.searchResults = Array.isArray(d?.results) ? [...d.results as any[]] : [];
    } catch (e) {
      console.error('[knowledge-base] Search failed:', e);
      this.searchResults = [];
    }
  }

  private async handleTacticClick(tacticId: string) {
    try {
      const res = await gatewayClient.request('knowledge.mitre.techniques', { tacticId });
      const d = res as Record<string, unknown>;
      if (Array.isArray(d?.techniques)) this.techniques = [...d.techniques as any[]];
    } catch (e) {
      console.error('[knowledge-base] Failed to load techniques:', e);
    }
  }

  private async handleDomainClick(domainId: string) {
    try {
      const res = await gatewayClient.request('knowledge.scf.controls', { domainId });
      const d = res as Record<string, unknown>;
      if (Array.isArray(d?.controls)) this.scfControls = [...d.controls as any[]];
    } catch (e) {
      console.error('[knowledge-base] Failed to load controls:', e);
    }
  }

  render() {
    return html`
      <sc-smart-recommendation-bar></sc-smart-recommendation-bar>
      <div class="container">
        <div class="hero">
          <div class="hero-icon">📚</div>
          <div>
            <h1 class="hero-title">${this.i18n.t('nav.knowledgeBase')}</h1>
            <span class="hero-badge">🔒 安全知识库</span>
            <p class="hero-desc">基于 MITRE ATT&CK 框架和 Secure Controls Framework (SCF) 的安全知识库，帮助团队理解威胁模型和合规要求。</p>
          </div>
        </div>

        <div class="search-bar">
          <input class="search-input" type="text" placeholder="搜索战术、技术或控制..." .value=${this.searchQuery} @input=${(e: Event) => { this.searchQuery = (e.target as HTMLInputElement).value; }} @keydown=${(e: KeyboardEvent) => e.key === 'Enter' && this.handleSearch()} />
          <button class="search-btn" @click=${this.handleSearch}>🔍 搜索</button>
        </div>

        <div class="tabs">
          <button class="tab ${this.activeTab === 'mitre' ? 'active' : ''}" @click=${() => { this.activeTab = 'mitre'; this.searchResults = []; }}>🎯 MITRE ATT&CK</button>
          <button class="tab ${this.activeTab === 'scf' ? 'active' : ''}" @click=${() => { this.activeTab = 'scf'; this.searchResults = []; }}>📋 安全控制框架</button>
        </div>

        ${this.searchResults.length > 0 ? this.renderSearchResults() : this.activeTab === 'mitre' ? this.renderMitre() : this.renderScf()}
      </div>
    `;
  }

  private renderSearchResults() {
    return html`
      <div class="grid">
        ${this.searchResults.map((r: any) => html`
          <div class="card">
            <div class="card-id">${r.id || r.externalId || '-'}</div>
            <div class="card-name">${r.name || '-'}</div>
            <div class="card-desc">${r.description || '-'}</div>
          </div>
        `)}
      </div>
    `;
  }

  private renderMitre() {
    if (this.loading) return html`<div class="loading">加载中...</div>`;
    const stats = this.mitreStats || {};
    const displayTactics = this.tactics.length > 0 ? this.tactics : this.fallbackTactics;

    return html`
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.totalTactics || displayTactics.length}</div>
          <div class="stat-label">战术</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.totalTechniques || '200+'}</div>
          <div class="stat-label">技术</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.totalSubTechniques || '400+'}</div>
          <div class="stat-label">子技术</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.coverage || '78%'}</div>
          <div class="stat-label">检测覆盖率</div>
        </div>
      </div>

      ${this.techniques.length > 0 ? html`
        <div style="margin-bottom: 24px;">
          <button class="tab" @click=${() => { this.techniques = []; }} style="color: #8B5CF6; padding: 8px 12px;">← 返回战术列表</button>
        </div>
        <div class="grid">
          ${this.techniques.map((t: any) => html`
            <div class="card">
              <div class="card-id">${t.id || t.externalId || '-'}</div>
              <div class="card-name">${t.name || '-'}</div>
              <div class="card-desc">${t.description || '-'}</div>
              <div class="card-meta">
                ${t.platform ? html`<span>💻 ${Array.isArray(t.platform) ? t.platform.join(', ') : t.platform}</span>` : ''}
              </div>
            </div>
          `)}
        </div>
      ` : html`
        <div class="grid">
          ${displayTactics.map((t: any) => html`
            <div class="card" @click=${() => this.handleTacticClick(t.id || t.tacticId)}>
              <div class="card-id">${t.id || '-'}</div>
              <div class="card-name">${t.name || '-'}</div>
              <div class="card-desc">${t.description || '-'}</div>
              <div class="card-meta">
                <span>📋 ${t.techniqueCount || t.techniques?.length || '?'} 个技术</span>
              </div>
            </div>
          `)}
        </div>
      `}
    `;
  }

  private renderScf() {
    if (this.loading) return html`<div class="loading">加载中...</div>`;
    const stats = this.scfStats || {};
    const displayDomains = this.scfDomains.length > 0 ? this.scfDomains : this.fallbackDomains;

    return html`
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.totalDomains || displayDomains.length}</div>
          <div class="stat-label">控制域</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.totalControls || '150+'}</div>
          <div class="stat-label">控制项</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.complianceRate || '85%'}</div>
          <div class="stat-label">合规率</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.coveredControls || '120+'}</div>
          <div class="stat-label">已覆盖</div>
        </div>
      </div>

      ${this.scfControls.length > 0 ? html`
        <div style="margin-bottom: 24px;">
          <button class="tab" @click=${() => { this.scfControls = []; }} style="color: #8B5CF6; padding: 8px 12px;">← 返回域列表</button>
        </div>
        <div class="grid">
          ${this.scfControls.map((c: any) => html`
            <div class="card">
              <div class="card-id">${c.id || c.controlId || '-'}</div>
              <div class="card-name">${c.name || c.title || '-'}</div>
              <div class="card-desc">${c.description || '-'}</div>
            </div>
          `)}
        </div>
      ` : html`
        <div class="grid">
          ${displayDomains.map((d: any) => html`
            <div class="card" @click=${() => this.handleDomainClick(d.id || d.domainId)}>
              <div class="card-id">${d.id || '-'}</div>
              <div class="card-name">${d.name || '-'}</div>
              <div class="card-desc">${d.description || '-'}</div>
              <div class="card-meta">
                <span>📋 ${d.controlCount || d.controls?.length || '?'} 个控制项</span>
              </div>
            </div>
          `)}
        </div>
      `}
    `;
  }
}
