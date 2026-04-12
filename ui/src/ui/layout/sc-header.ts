import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Router } from '@vaadin/router';
import { i18n } from '../../i18n/index.js';
import type { Locale } from '../../i18n/index.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { uiStore } from '../store/ui-store.js';
import { authStore } from '../store/auth-store.js';
import '../components/sc-role-switcher.js';

@customElement('sc-header')
export class ScHeader extends LitElement {
  @property({ type: Boolean })
  connected = false;

  @state()
  private locale: Locale = 'zh-CN';

  @state()
  private theme: 'light' | 'dark' | 'system' = 'dark';

  private i18nCtrl = new I18nController(this);

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
      padding: 0 var(--sc-spacing-lg);
      background-color: var(--sc-bg-card);
      border-bottom: 1px solid var(--sc-border-color);
    }

    .left-section {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md);
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-xs);
      padding: var(--sc-spacing-xs) var(--sc-spacing-sm);
      border-radius: var(--sc-radius-full);
      font-size: var(--sc-font-size-sm);
    }

    .connection-status.connected {
      background-color: var(--sc-success-bg);
      color: var(--sc-success);
    }

    .connection-status.disconnected {
      background-color: var(--sc-error-bg);
      color: var(--sc-error);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: currentColor;
    }

    .right-section {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md);
    }

    .icon-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border: none;
      background-color: transparent;
      color: var(--sc-text-secondary);
      cursor: pointer;
      border-radius: var(--sc-radius-md);
      transition: all var(--sc-transition-fast);
    }

    .icon-button:hover {
      background-color: var(--sc-bg-hover);
      color: var(--sc-text-primary);
    }

    .locale-select {
      padding: var(--sc-spacing-xs) var(--sc-spacing-sm);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      background-color: var(--sc-input-bg);
      color: var(--sc-text-primary);
      font-size: var(--sc-font-size-sm);
      cursor: pointer;
    }

    .locale-select:focus {
      outline: none;
      border-color: var(--sc-input-focus);
    }
  `;

  constructor() {
    super();
    const state = uiStore.getState();
    this.locale = state.locale;
    this.theme = state.theme;

    uiStore.subscribe((state) => {
      this.locale = state.locale;
      this.theme = state.theme;
    });
  }

  private handleLocaleChange(e: Event): void {
    const select = e.target as HTMLSelectElement;
    const locale = select.value as Locale;
    i18n.setLocale(locale);
    uiStore.setLocale(locale);
    localStorage.setItem('secuclaw-locale', locale);
  }

  private handleThemeToggle(): void {
    const newTheme = this.theme === 'dark' ? 'light' : 'dark';
    uiStore.setTheme(newTheme);
  }

  private handleLogout(): void {
    authStore.logout();
    Router.go('/login');
  }

  render() {
    return html`
      <div class="left-section">
        <div class="connection-status ${this.connected ? 'connected' : 'disconnected'}">
          <span class="status-dot"></span>
          <span>${this.connected ? this.i18nCtrl.t('connection.connected') : this.i18nCtrl.t('connection.disconnected')}</span>
        </div>
        <span style="color: var(--sc-text-tertiary); font-size: var(--sc-font-size-sm);">
          ws://127.0.0.1:21981
        </span>
        <sc-role-switcher></sc-role-switcher>
      </div>

      <div class="right-section">
        <button class="icon-button" @click=${this.handleThemeToggle} title="Toggle theme">
          ${this.theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <select class="locale-select" @change=${this.handleLocaleChange} .value=${this.locale}>
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
          <option value="zh-TW">繁體中文</option>
        </select>

        <button class="icon-button" @click=${this.handleLogout} title="Logout">
          🚪
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-header': ScHeader;
  }
}
