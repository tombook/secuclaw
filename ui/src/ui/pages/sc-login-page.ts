/**
 * sc-login-page.ts - 登录页面
 */

import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router } from '@vaadin/router';
import { authStore } from '../store/auth-store.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';

@customElement('sc-login-page')
export class ScLoginPage extends LitElement {
  private i18n = new I18nController(this);

  @state() private username = '';
  @state() private password = '';
  @state() private loading = false;
  @state() private error = '';

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .login-container {
      background: white;
      border-radius: 16px;
      padding: 48px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .logo {
      text-align: center;
      margin-bottom: 32px;
    }

    .logo-text {
      font-size: 28px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .logo-sub {
      font-size: 14px;
      color: #6b7280;
      margin-top: 4px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-label {
      display: block;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input.error {
      border-color: #ef4444;
    }

    .error-message {
      color: #ef4444;
      font-size: 13px;
      margin-top: 8px;
    }

    .btn-login {
      width: 100%;
      padding: 14px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      margin-top: 24px;
    }

    .btn-login:hover {
      background: #2563eb;
    }

    .btn-login:disabled {
      background: #93c5fd;
      cursor: not-allowed;
    }

    .demo-hint {
      margin-top: 24px;
      padding: 16px;
      background: #f3f4f6;
      border-radius: 8px;
      font-size: 13px;
      color: #6b7280;
    }

    .demo-hint-title {
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }

    .demo-account {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
    }
  `;

  render() {
    return html`
      <div class="login-container">
        <div class="logo">
          <div class="logo-text">🔒 SecuClaw</div>
          <div class="logo-sub">安全指挥官系统</div>
        </div>

        <form @submit=${this.handleLogin}>
          <div class="form-group">
            <label class="form-label">${this.i18n.t('login.username', '用户名')}</label>
            <input 
              type="text" 
              class="form-input ${this.error ? 'error' : ''}"
              .value=${this.username}
              @input=${(e: any) => this.username = e.target.value}
              placeholder=${this.i18n.t('login.usernamePlaceholder', '请输入用户名')}
            />
          </div>

          <div class="form-group">
            <label class="form-label">${this.i18n.t('login.password', '密码')}</label>
            <input 
              type="password" 
              class="form-input ${this.error ? 'error' : ''}"
              .value=${this.password}
              @input=${(e: any) => this.password = e.target.value}
              placeholder=${this.i18n.t('login.passwordPlaceholder', '请输入密码')}
            />
          </div>

          ${this.error ? html`
            <div class="error-message">${this.error}</div>
          ` : ''}

          <button type="submit" class="btn-login" ?disabled=${this.loading}>
            ${this.loading ? this.i18n.t('login.loggingIn', '登录中...') : this.i18n.t('login.submit', '登录')}
          </button>
        </form>

        <div class="demo-hint">
          <div class="demo-hint-title">${this.i18n.t('login.demoAccount', '演示账户')}</div>
          <div class="demo-account">
            <span>admin / admin123</span>
            <span>user / user123</span>
          </div>
        </div>
      </div>
    `;
  }

  private async handleLogin(e: Event) {
    e.preventDefault();
    
    if (!this.username || !this.password) {
      this.error = this.i18n.t('login.fillAll', '请填写用户名和密码');
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await authStore.login(this.username, this.password);
      Router.go('/');
    } catch (error: any) {
      this.error = error.message || this.i18n.t('login.failed', '登录失败');
    } finally {
      this.loading = false;
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-login-page': ScLoginPage;
  }
}
