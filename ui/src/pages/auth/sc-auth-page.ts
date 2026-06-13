import { LitElement, html, css } from 'lit';
import { customElement, state, property } from 'lit/decorators.js';

@customElement('sc-auth-page')
export class ScAuthPage extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0f1a 0%, #111827 50%, #0a0f1a 100%);
      color: #f9fafb;
      font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .wrapper { display: flex; min-height: 100vh; }

    .left { flex: 1; padding: 60px 80px; display: flex; flex-direction: column; justify-content: space-between; }
    .brand { display: flex; align-items: center; gap: 12px; font-size: 22px; font-weight: 700; cursor: pointer; }
    .brand-icon { font-size: 32px; }
    .brand-text { background: linear-gradient(135deg, #00d4ff 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .left-content { max-width: 460px; }
    .left h1 { font-size: 44px; font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 20px; }
    .left h1 .gradient { background: linear-gradient(135deg, #00d4ff 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .left p { font-size: 16px; color: #9ca3af; line-height: 1.6; margin-bottom: 32px; }
    .features { display: flex; flex-direction: column; gap: 16px; }
    .feat { display: flex; gap: 12px; align-items: center; font-size: 13px; color: #d1d5db; }
    .feat-icon { font-size: 20px; }
    .left-footer { color: #6b7280; font-size: 12px; }

    .right { flex: 1; padding: 60px 80px; display: flex; align-items: center; justify-content: center; background: rgba(17, 24, 39, 0.4); border-left: 1px solid rgba(55, 65, 81, 0.3); }
    .form-box { width: 100%; max-width: 420px; }
    .form-header { text-align: center; margin-bottom: 32px; }
    .form-title { font-size: 28px; font-weight: 800; margin-bottom: 8px; }
    .form-sub { font-size: 14px; color: #9ca3af; }
    .form-sub a { color: #00d4ff; cursor: pointer; text-decoration: none; }

    .field { margin-bottom: 16px; }
    .field-label { display: block; font-size: 12px; font-weight: 600; color: #9ca3af; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
    .input, .select { width: 100%; padding: 12px 14px; background: #1f2937; border: 1px solid #374151; border-radius: 8px; color: #f9fafb; font-size: 14px; font-family: inherit; transition: all 0.2s; }
    .input:focus, .select:focus { outline: none; border-color: #00d4ff; box-shadow: 0 0 0 3px rgba(0, 212, 255, 0.1); }
    .input::placeholder { color: #6b7280; }
    .input-group { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

    .btn-primary { width: 100%; padding: 14px; background: linear-gradient(135deg, #00d4ff, #0ea5e9); color: #0a0f1a; border: none; border-radius: 8px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(0, 212, 255, 0.3); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .divider { display: flex; align-items: center; gap: 12px; margin: 24px 0; color: #6b7280; font-size: 12px; }
    .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: #374151; }

    .btn-sso { width: 100%; padding: 12px; background: #1f2937; color: #f9fafb; border: 1px solid #374151; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-sso:hover { border-color: #4b5563; background: #243240; }

    .error { padding: 12px 14px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; color: #fca5a5; font-size: 13px; margin-bottom: 16px; }
    .success { padding: 12px 14px; background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 8px; color: #86efac; font-size: 13px; margin-bottom: 16px; }

    .plans-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin: 16px 0; }
    .plan-opt { padding: 12px 8px; background: #1f2937; border: 1px solid #374151; border-radius: 6px; cursor: pointer; text-align: center; transition: all 0.2s; }
    .plan-opt:hover { border-color: #4b5563; }
    .plan-opt.selected { border-color: #00d4ff; background: rgba(0, 212, 255, 0.05); }
    .plan-name { font-size: 11px; font-weight: 700; }
    .plan-price { font-size: 10px; color: #9ca3af; margin-top: 2px; }

    .back { display: inline-flex; align-items: center; gap: 6px; color: #9ca3af; font-size: 12px; cursor: pointer; margin-bottom: 20px; }
    .back:hover { color: #00d4ff; }

    @media (max-width: 900px) {
      .left { display: none; }
    }
  `;

  @state() private _mode: 'login' | 'signup' = 'signup';
  @state() private _email = '';
  @state() private _password = '';
  @state() private _name = '';
  @state() private _company = '';
  @state() private _plan = 'professional';
  @state() private _error = '';
  @state() private _success = '';
  @state() private _loading = false;

  connectedCallback() {
    super.connectedCallback();
    const url = new URL(window.location.href);
    const m = url.searchParams.get('mode');
    if (m === 'login' || m === 'signup') this._mode = m;
    const p = url.searchParams.get('plan');
    if (p) this._plan = p;
  }

  private _navigateTo(route: string) {
    window.location.hash = `#/${route}`;
  }

  private _setMode(mode: 'login' | 'signup') {
    this._mode = mode;
    this._error = '';
    this._success = '';
  }

  private async _handleSubmit(e: Event) {
    e.preventDefault();
    this._error = '';
    this._success = '';

    if (this._mode === 'login') {
      if (!this._email || !this._password) {
        this._error = '请输入邮箱和密码';
        return;
      }
    } else {
      if (!this._email || !this._password || !this._name || !this._company) {
        this._error = '请填写所有必填字段';
        return;
      }
      if (this._password.length < 8) {
        this._error = '密码至少需要 8 个字符';
        return;
      }
    }

    this._loading = true;
    await new Promise((r) => setTimeout(r, 800));

    this._loading = false;
    if (this._mode === 'login') {
      this._success = '登录成功！正在跳转...';
      setTimeout(() => this._navigateTo('app'), 800);
    } else {
      this._success = '注册成功！14 天免费试用已激活。';
      setTimeout(() => this._navigateTo('app'), 1200);
    }
  }

  private _handleSso(provider: string) {
    this._error = `${provider} SSO 集成即将上线`;
  }

  private _renderLogin() {
    return html`
      <div class="form-box">
        <div class="form-header">
          <h2 class="form-title">欢迎回来 👋</h2>
          <p class="form-sub">还没有账号？<a @click=${() => this._setMode('signup')}>免费注册</a></p>
        </div>
        <form @submit=${this._handleSubmit}>
          ${this._error ? html`<div class="error">❌ ${this._error}</div>` : ''}
          ${this._success ? html`<div class="success">✅ ${this._success}</div>` : ''}
          <div class="field">
            <label class="field-label">邮箱</label>
            <input class="input" type="email" placeholder="you@company.com" .value=${this._email} @input=${(e: any) => this._email = e.target.value} required />
          </div>
          <div class="field">
            <label class="field-label">密码</label>
            <input class="input" type="password" placeholder="••••••••" .value=${this._password} @input=${(e: any) => this._password = e.target.value} required />
          </div>
          <button class="btn-primary" type="submit" ?disabled=${this._loading}>
            ${this._loading ? '登录中...' : '登录 →'}
          </button>
        </form>
        <div class="divider">或使用企业 SSO</div>
        <button class="btn-sso" @click=${() => this._handleSso('Google')}>🔵 使用 Google 登录</button>
        <button class="btn-sso" style="margin-top: 8px;" @click=${() => this._handleSso('Okta')}>🟣 使用 Okta 登录</button>
        <button class="btn-sso" style="margin-top: 8px;" @click=${() => this._handleSso('Azure AD')}>🔷 使用 Azure AD 登录</button>
      </div>
    `;
  }

  private _renderSignup() {
    return html`
      <div class="form-box">
        <div class="form-header">
          <h2 class="form-title">开始 14 天免费试用 🚀</h2>
          <p class="form-sub">已有账号？<a @click=${() => this._setMode('login')}>直接登录</a></p>
        </div>
        <form @submit=${this._handleSubmit}>
          ${this._error ? html`<div class="error">❌ ${this._error}</div>` : ''}
          ${this._success ? html`<div class="success">✅ ${this._success}</div>` : ''}
          <div class="field">
            <label class="field-label">姓名</label>
            <input class="input" type="text" placeholder="张三" .value=${this._name} @input=${(e: any) => this._name = e.target.value} required />
          </div>
          <div class="field">
            <label class="field-label">公司名称</label>
            <input class="input" type="text" placeholder="Acme Corp" .value=${this._company} @input=${(e: any) => this._company = e.target.value} required />
          </div>
          <div class="field">
            <label class="field-label">工作邮箱</label>
            <input class="input" type="email" placeholder="you@company.com" .value=${this._email} @input=${(e: any) => this._email = e.target.value} required />
          </div>
          <div class="field">
            <label class="field-label">密码（至少 8 字符）</label>
            <input class="input" type="password" placeholder="••••••••" .value=${this._password} @input=${(e: any) => this._password = e.target.value} required />
          </div>
          <div class="field">
            <label class="field-label">选择计划</label>
            <div class="plans-grid">
              <div class="plan-opt ${this._plan === 'free' ? 'selected' : ''}" @click=${() => this._plan = 'free'}>
                <div class="plan-name">免费版</div>
                <div class="plan-price">$0/月</div>
              </div>
              <div class="plan-opt ${this._plan === 'starter' ? 'selected' : ''}" @click=${() => this._plan = 'starter'}>
                <div class="plan-name">入门</div>
                <div class="plan-price">$99/月</div>
              </div>
              <div class="plan-opt ${this._plan === 'professional' ? 'selected' : ''}" @click=${() => this._plan = 'professional'}>
                <div class="plan-name">专业 ⭐</div>
                <div class="plan-price">$499/月</div>
              </div>
              <div class="plan-opt ${this._plan === 'enterprise' ? 'selected' : ''}" @click=${() => this._plan = 'enterprise'}>
                <div class="plan-name">企业</div>
                <div class="plan-price">$2999/月</div>
              </div>
              <div class="plan-opt ${this._plan === 'mssp' ? 'selected' : ''}" @click=${() => this._plan = 'mssp'}>
                <div class="plan-name">MSSP</div>
                <div class="plan-price">$9999/月</div>
              </div>
            </div>
          </div>
          <button class="btn-primary" type="submit" ?disabled=${this._loading}>
            ${this._loading ? '创建账号中...' : '🚀 创建账号 + 14 天试用'}
          </button>
        </form>
        <div class="divider">或使用企业 SSO</div>
        <button class="btn-sso" @click=${() => this._handleSso('Google')}>🔵 使用 Google 注册</button>
        <button class="btn-sso" style="margin-top: 8px;" @click=${() => this._handleSso('Okta')}>🟣 使用 Okta 注册</button>
        <button class="btn-sso" style="margin-top: 8px;" @click=${() => this._handleSso('Azure AD')}>🔷 使用 Azure AD 注册</button>
        <p style="text-align: center; margin-top: 20px; font-size: 11px; color: #6b7280;">注册即表示您同意我们的 <a style="color: #00d4ff; cursor: pointer;">服务条款</a> 和 <a style="color: #00d4ff; cursor: pointer;">隐私政策</a></p>
      </div>
    `;
  }

  render() {
    return html`
      <div class="wrapper">
        <div class="left">
          <div class="brand" @click=${() => this._navigateTo('landing')}>
            <span class="brand-icon">🐾</span>
            <span class="brand-text">SecuClaw</span>
          </div>
          <div class="left-content">
            <h1>
              保护企业<br/>
              <span class="gradient">数字资产</span>
            </h1>
            <p>9 大顶级安全能力 · 797 个 API · 71 核心模块。多租户 SaaS 化部署，1 分钟即可启用。</p>
            <div class="features">
              <div class="feat"><span class="feat-icon">✓</span> 实时检测 SQL 注入 / XSS / API 滥用</div>
              <div class="feat"><span class="feat-icon">✓</span> GDPR / PIPL / PCI DSS 合规扫描</div>
              <div class="feat"><span class="feat-icon">✓</span> MCP 风险评分 + 提示词注入防护</div>
              <div class="feat"><span class="feat-icon">✓</span> 身份威胁检测 + 自动化响应</div>
              <div class="feat"><span class="feat-icon">✓</span> 多租户隔离 + 完整审计</div>
            </div>
          </div>
          <div class="left-footer">© 2026 SecuClaw · SOC 2 · ISO 27001 · GDPR</div>
        </div>
        <div class="right">
          <a class="back" @click=${() => this._navigateTo('landing')}>← 返回首页</a>
          ${this._mode === 'login' ? this._renderLogin() : this._renderSignup()}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-auth-page': ScAuthPage;
  }
}
