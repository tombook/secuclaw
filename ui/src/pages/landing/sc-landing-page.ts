import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('sc-landing-page')
export class ScLandingPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(180deg, #0a0f1a 0%, #0d1424 50%, #0a0f1a 100%);
      color: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }

    nav {
      position: sticky; top: 0; z-index: 100;
      background: rgba(10, 15, 26, 0.85);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(55, 65, 81, 0.5);
    }
    .nav-inner { display: flex; align-items: center; justify-content: space-between; padding: 16px 24px; max-width: 1280px; margin: 0 auto; }
    .logo { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 700; }
    .logo-icon { font-size: 28px; }
    .logo-text { background: linear-gradient(135deg, #00d4ff 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .nav-links { display: flex; gap: 32px; align-items: center; }
    .nav-link { color: #9ca3af; text-decoration: none; font-size: 14px; cursor: pointer; transition: color 0.2s; }
    .nav-link:hover { color: #00d4ff; }
    .nav-cta { padding: 8px 18px; background: linear-gradient(135deg, #00d4ff, #0ea5e9); color: #0a0f1a; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; }
    .nav-cta:hover { opacity: 0.9; }

    .hero { padding: 80px 0 100px; text-align: center; position: relative; }
    .hero::before {
      content: '';
      position: absolute;
      top: 0; left: 50%;
      transform: translateX(-50%);
      width: 1200px; height: 800px;
      background: radial-gradient(ellipse at center, rgba(0, 212, 255, 0.15) 0%, transparent 60%);
      pointer-events: none;
    }
    .hero-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 20px; font-size: 12px; color: #00d4ff; margin-bottom: 24px; }
    .hero h1 {
      font-size: 64px;
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -0.02em;
      margin-bottom: 24px;
      background: linear-gradient(180deg, #ffffff 0%, #9ca3af 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero h1 .gradient {
      background: linear-gradient(135deg, #00d4ff 0%, #a855f7 50%, #ec4899 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-sub { font-size: 20px; color: #9ca3af; max-width: 720px; margin: 0 auto 40px; line-height: 1.5; }
    .hero-actions { display: flex; gap: 16px; justify-content: center; align-items: center; }
    .btn-primary { padding: 14px 32px; background: linear-gradient(135deg, #00d4ff, #0ea5e9); color: #0a0f1a; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; border: none; box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3); }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 12px 32px rgba(0, 212, 255, 0.4); }
    .btn-secondary { padding: 14px 32px; background: transparent; color: #f9fafb; border: 1px solid #4b5563; border-radius: 8px; font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; }
    .btn-secondary:hover { border-color: #00d4ff; color: #00d4ff; }
    .hero-stats { display: flex; gap: 48px; justify-content: center; margin-top: 56px; }
    .hero-stat { text-align: center; }
    .hero-stat-value { font-size: 32px; font-weight: 800; color: #00d4ff; }
    .hero-stat-label { font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; }

    .section { padding: 80px 0; }
    .section-header { text-align: center; margin-bottom: 56px; }
    .section-tag { font-size: 13px; font-weight: 600; color: #00d4ff; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 12px; }
    .section-title { font-size: 44px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 16px; }
    .section-sub { font-size: 18px; color: #9ca3af; max-width: 640px; margin: 0 auto; }

    .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .feature { padding: 28px; background: linear-gradient(180deg, rgba(17, 24, 39, 0.5) 0%, rgba(17, 24, 39, 0.2) 100%); border: 1px solid rgba(55, 65, 81, 0.5); border-radius: 12px; transition: all 0.3s; }
    .feature:hover { transform: translateY(-4px); border-color: #00d4ff; box-shadow: 0 12px 32px rgba(0, 212, 255, 0.1); }
    .feature-icon { font-size: 32px; margin-bottom: 16px; }
    .feature-name { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
    .feature-desc { font-size: 13px; color: #9ca3af; line-height: 1.6; }

    .capabilities-section { background: linear-gradient(180deg, transparent 0%, rgba(168, 85, 247, 0.03) 50%, transparent 100%); }
    .cap-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .cap { padding: 20px; background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 8px; text-align: center; transition: all 0.3s; }
    .cap:hover { border-color: #00d4ff; }
    .cap-icon { font-size: 32px; margin-bottom: 8px; }
    .cap-name { font-size: 13px; font-weight: 600; margin-bottom: 4px; }
    .cap-handler { font-size: 10px; color: #9ca3af; }

    .pricing-section { background: linear-gradient(180deg, transparent 0%, rgba(0, 212, 255, 0.03) 50%, transparent 100%); }
    .pricing-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }
    .price { padding: 28px 20px; background: var(--sc-bg-secondary, #111827); border: 1px solid var(--sc-border, #374151); border-radius: 12px; position: relative; }
    .price.popular { border-color: #00d4ff; box-shadow: 0 0 32px rgba(0, 212, 255, 0.2); transform: scale(1.05); }
    .price-popular-tag { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, #00d4ff, #0ea5e9); color: #0a0f1a; padding: 2px 12px; border-radius: 12px; font-size: 10px; font-weight: 700; }
    .price-tier { font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em; }
    .price-name { font-size: 24px; font-weight: 800; margin: 8px 0; }
    .price-amount { font-size: 36px; font-weight: 800; }
    .price-amount span { font-size: 14px; color: #9ca3af; font-weight: 500; }
    .price-desc { font-size: 12px; color: #9ca3af; margin: 8px 0 20px; line-height: 1.5; }
    .price-features { list-style: none; margin: 0 0 24px; }
    .price-features li { padding: 6px 0; font-size: 12px; color: #d1d5db; display: flex; align-items: center; gap: 6px; }
    .price-features li::before { content: '✓'; color: #22c55e; font-weight: 800; }
    .price-btn { width: 100%; padding: 10px; background: var(--sc-bg-tertiary, #1f2937); color: #f9fafb; border: 1px solid #4b5563; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
    .price.popular .price-btn { background: linear-gradient(135deg, #00d4ff, #0ea5e9); color: #0a0f1a; border: none; }
    .price-btn:hover { opacity: 0.9; }

    .cta-section { padding: 100px 0; text-align: center; }
    .cta-box { padding: 60px 40px; background: linear-gradient(135deg, rgba(0, 212, 255, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 16px; }
    .cta-title { font-size: 40px; font-weight: 800; margin-bottom: 16px; }
    .cta-sub { font-size: 18px; color: #9ca3af; margin-bottom: 32px; }
    .cta-actions { display: flex; gap: 16px; justify-content: center; }

    footer { padding: 60px 0 30px; border-top: 1px solid rgba(55, 65, 81, 0.5); }
    .footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 40px; }
    .footer-brand { font-size: 13px; color: #6b7280; line-height: 1.6; max-width: 320px; }
    .footer-col h4 { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; color: #9ca3af; }
    .footer-col a { display: block; font-size: 13px; color: #6b7280; text-decoration: none; padding: 4px 0; cursor: pointer; }
    .footer-col a:hover { color: #00d4ff; }
    .footer-bottom { padding-top: 24px; border-top: 1px solid rgba(55, 65, 81, 0.5); display: flex; justify-content: space-between; font-size: 12px; color: #6b7280; }
  `;

  @state() private _plans: any[] = [];
  @state() private _loadingPlans = false;

  connectedCallback() {
    super.connectedCallback();
    this._loadPlans();
  }

  private async _apiCall(handler: string, params: any = {}): Promise<any> {
    try {
      const r = await fetch(`http://127.0.0.1:21981/api/v1/${handler}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ params }),
      });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) { return null; }
  }

  private async _loadPlans() {
    this._loadingPlans = true;
    this._plans = await this._apiCall('saas.billing.plans.list') || [];
    this._loadingPlans = false;
  }

  private _navigateTo(route: string) {
    window.location.hash = `#/${route}`;
  }

  private _renderNav() {
    return html`
      <nav>
        <div class="nav-inner">
          <div class="logo">
            <span class="logo-icon">🐾</span>
            <span class="logo-text">SecuClaw</span>
          </div>
          <div class="nav-links">
            <a class="nav-link" @click=${() => this._navigateTo('features')}>能力</a>
            <a class="nav-link" @click=${() => this._navigateTo('capabilities')}>模块</a>
            <a class="nav-link" @click=${() => this._navigateTo('pricing')}>价格</a>
            <a class="nav-link" @click=${() => this._navigateTo('docs')}>文档</a>
            <a class="nav-link" @click=${() => this._navigateTo('auth')}>登录</a>
            <button class="nav-cta" @click=${() => this._navigateTo('auth?mode=signup')}>免费试用</button>
          </div>
        </div>
      </nav>
    `;
  }

  private _renderHero() {
    return html`
      <section class="hero">
        <div class="container" style="position: relative;">
          <div class="hero-badge">🛡️ 9 大顶级安全能力 · 797 API · 71 核心模块</div>
          <h1>
            企业级 SaaS 化<br/>
            <span class="gradient">网络安全平台</span>
          </h1>
          <p class="hero-sub">
            一站式整合 CSPM / EASM / RASP / DSPM / ITDR / SOAR / UEBA / Sigma / AI-SCM 九大顶级安全能力。
            为中型企业和 MSSP 服务商提供完整的多租户 SaaS 化部署。
          </p>
          <div class="hero-actions">
            <button class="btn-primary" @click=${() => this._navigateTo('auth?mode=signup')}>🚀 14 天免费试用</button>
            <a class="btn-secondary" @click=${() => this._navigateTo('demo')}>观看产品演示</a>
          </div>
          <div class="hero-stats">
            <div class="hero-stat"><div class="hero-stat-value">71</div><div class="hero-stat-label">核心模块</div></div>
            <div class="hero-stat"><div class="hero-stat-value">797</div><div class="hero-stat-label">API 接口</div></div>
            <div class="hero-stat"><div class="hero-stat-value">9</div><div class="hero-stat-label">顶级能力</div></div>
            <div class="hero-stat"><div class="hero-stat-value">99.99%</div><div class="hero-stat-label">SLA</div></div>
          </div>
        </div>
      </section>
    `;
  }

  private _renderFeatures() {
    const features = [
      { icon: '☁️', name: 'CSPM 云安全', desc: '7 大云合规扫描 · AWS/Azure/GCP/阿里云/腾讯云/华为云 · 自动修复' },
      { icon: '🌐', name: 'EASM 外部攻击面', desc: '资产发现 · 暴露扫描 · 凭证泄露监控 · 钓鱼站点检测' },
      { icon: '🛡️', name: 'RASP 运行时自保护', desc: 'SQL 注入拦截 · XSS 拦截 · API 滥用检测 · 15+ 攻击模式' },
      { icon: '💾', name: 'DSPM 数据安全', desc: 'PII 扫描 · GDPR/PIPL/HIPAA 合规 · 跨境数据流监控' },
      { icon: '🔐', name: 'ITDR 身份威胁', desc: '凭证滥用 · MFA 攻击 · 横向移动 · Kerberoasting/PtH 检测' },
      { icon: '🤖', name: 'AI-SCM 工具链安全', desc: 'MCP 风险评分 · 提示词注入 · Agent 行为审计' },
      { icon: '⚡', name: 'SOAR 告警关联', desc: '6 攻击链规则 · MITRE ATT&CK 重建 · 自动 Playbook' },
      { icon: '🧠', name: 'UEBA 行为基线', desc: '用户/实体画像 · 异常检测 · 风险评分' },
      { icon: '💼', name: 'SaaS 运营中心', desc: '多租户 · 计费订阅 · 通知推送 · 审计合规 · 多区部署' },
    ];
    return html`
      <section class="section" id="features">
        <div class="container">
          <div class="section-header">
            <div class="section-tag">SECUCLAW PLATFORM</div>
            <h2 class="section-title">9 大顶级安全能力，一站搞定</h2>
            <p class="section-sub">从外部攻击面到内部身份威胁，从数据合规到 AI 工具链安全</p>
          </div>
          <div class="features-grid">
            ${features.map((f) => html`
              <div class="feature">
                <div class="feature-icon">${f.icon}</div>
                <div class="feature-name">${f.name}</div>
                <div class="feature-desc">${f.desc}</div>
              </div>
            `)}
          </div>
        </div>
      </section>
    `;
  }

  private _renderCapabilities() {
    const caps = [
      { icon: '🛡️', name: 'RASP', handlers: 37 }, { icon: '🔐', name: 'ITDR', handlers: 51 },
      { icon: '💾', name: 'DSPM', handlers: 42 }, { icon: '💼', name: 'SaaS Ops', handlers: 45 },
      { icon: '☁️', name: 'CSPM', handlers: 22 }, { icon: '🌐', name: 'EASM', handlers: 25 },
      { icon: '🤖', name: 'AI-SCM', handlers: 15 }, { icon: '⚡', name: 'SOAR', handlers: 12 },
      { icon: '🧠', name: 'UEBA', handlers: 9 }, { icon: '🎯', name: 'Sigma', handlers: 8 },
      { icon: '📋', name: 'AI-SPM', handlers: 10 }, { icon: '🔒', name: 'Privacy', handlers: 11 },
    ];
    return html`
      <section class="section capabilities-section" id="capabilities">
        <div class="container">
          <div class="section-header">
            <div class="section-tag">PRODUCTION-READY</div>
            <h2 class="section-title">797 个 API · 71 个核心模块</h2>
            <p class="section-sub">完整覆盖网络安全全栈场景</p>
          </div>
          <div class="cap-grid">
            ${caps.map((c) => html`
              <div class="cap">
                <div class="cap-icon">${c.icon}</div>
                <div class="cap-name">${c.name}</div>
                <div class="cap-handler">${c.handlers} API</div>
              </div>
            `)}
          </div>
        </div>
      </section>
    `;
  }

  private _renderPricing() {
    return html`
      <section class="section pricing-section" id="pricing">
        <div class="container">
          <div class="section-header">
            <div class="section-tag">PRICING</div>
            <h2 class="section-title">5 大定价层，满足所有规模</h2>
            <p class="section-sub">从个人开发者到 MSSP 多租户，灵活的计费方案</p>
          </div>
          ${this._loadingPlans ? html`<div class="empty" style="text-align: center; color: #6b7280; padding: 40px;">加载定价中...</div>` : ''}
          <div class="pricing-grid">
            ${this._plans.map((p, idx) => html`
              <div class="price ${p.code === 'professional' ? 'popular' : ''}">
                ${p.code === 'professional' ? html`<div class="price-popular-tag">最受欢迎</div>` : ''}
                <div class="price-tier">${p.code}</div>
                <div class="price-name">${p.name}</div>
                <div class="price-amount">$${p.price}<span>/月</span></div>
                <div class="price-desc">${p.description}</div>
                <ul class="price-features">
                  <li>${p.limits?.users === -1 ? '不限' : p.limits?.users} 用户</li>
                  <li>${p.limits?.apiCallsPerDay === -1 ? '不限' : (p.limits?.apiCallsPerDay || 0).toLocaleString()} API/天</li>
                  <li>${p.limits?.storageGb} GB 存储</li>
                  <li>${p.limits?.retentionDays === -1 ? '永久' : p.limits?.retentionDays + ' 天'} 数据保留</li>
                  ${(p.features || []).slice(0, 3).map((f: string) => html`<li>${f}</li>`)}
                </ul>
                <button class="price-btn" @click=${() => this._navigateTo(`auth?plan=${p.code}`)}>
                  ${idx === 0 ? '免费开始' : '选择计划'}
                </button>
              </div>
            `)}
          </div>
        </div>
      </section>
    `;
  }

  private _renderCTA() {
    return html`
      <section class="cta-section">
        <div class="container">
          <div class="cta-box">
            <h2 class="cta-title">立即开始保护您的组织</h2>
            <p class="cta-sub">14 天免费试用 · 无需信用卡 · 1 分钟部署</p>
            <div class="cta-actions">
              <button class="btn-primary" @click=${() => this._navigateTo('auth?mode=signup')}>🚀 立即开始</button>
              <a class="btn-secondary" @click=${() => this._navigateTo('contact')}>联系销售</a>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  private _renderFooter() {
    return html`
      <footer>
        <div class="container">
          <div class="footer-grid">
            <div>
              <div class="logo" style="margin-bottom: 12px;"><span class="logo-icon">🐾</span><span class="logo-text">SecuClaw</span></div>
              <div class="footer-brand">企业级 SaaS 化网络安全平台。9 大顶级安全能力，797 API，71 核心模块，为中型企业和 MSSP 提供完整的多租户解决方案。</div>
            </div>
            <div class="footer-col">
              <h4>产品</h4>
              <a @click=${() => this._navigateTo('features')}>能力</a>
              <a @click=${() => this._navigateTo('capabilities')}>模块</a>
              <a @click=${() => this._navigateTo('pricing')}>价格</a>
              <a @click=${() => this._navigateTo('changelog')}>更新日志</a>
            </div>
            <div class="footer-col">
              <h4>资源</h4>
              <a @click=${() => this._navigateTo('docs')}>文档</a>
              <a @click=${() => this._navigateTo('api')}>API 参考</a>
              <a @click=${() => this._navigateTo('blog')}>博客</a>
              <a @click=${() => this._navigateTo('support')}>支持</a>
            </div>
            <div class="footer-col">
              <h4>公司</h4>
              <a @click=${() => this._navigateTo('about')}>关于</a>
              <a @click=${() => this._navigateTo('careers')}>招聘</a>
              <a @click=${() => this._navigateTo('privacy')}>隐私</a>
              <a @click=${() => this._navigateTo('terms')}>条款</a>
            </div>
          </div>
          <div class="footer-bottom">
            <span>© 2026 SecuClaw. All rights reserved.</span>
            <span>SOC 2 Type II · ISO 27001 · GDPR · PIPL</span>
          </div>
        </div>
      </footer>
    `;
  }

  render() {
    return html`
      ${this._renderNav()}
      ${this._renderHero()}
      ${this._renderFeatures()}
      ${this._renderCapabilities()}
      ${this._renderPricing()}
      ${this._renderCTA()}
      ${this._renderFooter()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-landing-page': ScLandingPage;
  }
}
