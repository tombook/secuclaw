import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../../i18n/lib/lit-controller.js';
import { uiStore } from '../../store/ui-store.js';

@customElement('sc-settings-page')
export class ScSettingsPage extends LitElement {
  private i18n = new I18nController(this);

  @state()
  private theme: 'light' | 'dark' | 'system' = 'dark';

  @state()
  private locale: 'zh-CN' | 'en' | 'zh-TW' = 'zh-CN';

  static styles = css`
    :host {
      display: block;
    }

    .page-title {
      font-size: var(--sc-font-size-2xl);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-lg);
    }

    .settings-nav {
      display: flex;
      gap: var(--sc-spacing-md);
      margin-bottom: var(--sc-spacing-lg);
    }

    .nav-card {
      flex: 1;
      padding: var(--sc-spacing-lg);
      background-color: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      cursor: pointer;
      transition: all var(--sc-transition-fast);
    }

    .nav-card:hover {
      border-color: var(--sc-primary);
      box-shadow: var(--sc-shadow-md);
    }

    .nav-card-title {
      font-size: var(--sc-font-size-lg);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-sm);
    }

    .nav-card-desc {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-secondary);
    }

    .settings-section {
      background-color: var(--sc-bg-card);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-lg);
      padding: var(--sc-spacing-lg);
      margin-bottom: var(--sc-spacing-lg);
    }

    .section-title {
      font-size: var(--sc-font-size-lg);
      font-weight: 600;
      color: var(--sc-text-primary);
      margin-bottom: var(--sc-spacing-md);
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--sc-spacing-md) 0;
      border-bottom: 1px solid var(--sc-border-color);
    }

    .setting-item:last-child {
      border-bottom: none;
    }

    .setting-label {
      font-size: var(--sc-font-size-sm);
      color: var(--sc-text-primary);
    }

    .setting-desc {
      font-size: var(--sc-font-size-xs);
      color: var(--sc-text-tertiary);
      margin-top: var(--sc-spacing-xs);
    }

    .setting-control {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-sm);
    }

    select, input {
      padding: var(--sc-spacing-sm);
      border: 1px solid var(--sc-border-color);
      border-radius: var(--sc-radius-md);
      background-color: var(--sc-input-bg);
      color: var(--sc-text-primary);
      font-size: var(--sc-font-size-sm);
    }

    .toggle-switch {
      position: relative;
      width: 48px;
      height: 24px;
      background-color: var(--sc-bg-tertiary);
      border-radius: var(--sc-radius-full);
      cursor: pointer;
      transition: background-color var(--sc-transition-fast);
    }

    .toggle-switch.active {
      background-color: var(--sc-success);
    }

    .toggle-switch::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      background-color: white;
      border-radius: 50%;
      top: 2px;
      left: 2px;
      transition: transform var(--sc-transition-fast);
    }

    .toggle-switch.active::after {
      transform: translateX(24px);
    }
  `;

  constructor() {
    super();
    const state = uiStore.getState();
    this.theme = state.theme;
    this.locale = state.locale;

    uiStore.subscribe((state) => {
      this.theme = state.theme;
      this.locale = state.locale;
    });
  }

  private handleThemeChange(e: Event): void {
    const theme = (e.target as HTMLSelectElement).value as typeof this.theme;
    uiStore.setTheme(theme);
  }

  private handleLocaleChange(e: Event): void {
    const locale = (e.target as HTMLSelectElement).value as typeof this.locale;
    uiStore.setLocale(locale);
  }

  private navigateTo(path: string): void {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  render() {
    return html`
      <h1 class="page-title">${this.i18n.t('nav.settings')}</h1>

      <div class="settings-nav">
        <div class="nav-card" @click=${() => this.navigateTo('/settings/llm-config')}>
          <div class="nav-card-title">🤖 ${this.i18n.t('settings.llmConfig')}</div>
          <div class="nav-card-desc">Configure LLM providers like OpenAI, Anthropic, Azure</div>
        </div>
        <div class="nav-card" @click=${() => this.navigateTo('/settings/ai-experts-config')}>
          <div class="nav-card-title">👔 ${this.i18n.t('settings.aiExpertsConfig')}</div>
          <div class="nav-card-desc">Bind AI experts to LLM providers</div>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="section-title">General Settings</h2>

        <div class="setting-item">
          <div>
            <div class="setting-label">${this.i18n.t('settings.theme')}</div>
            <div class="setting-desc">Choose your preferred color theme</div>
          </div>
          <div class="setting-control">
            <select @change=${this.handleThemeChange} .value=${this.theme}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        <div class="setting-item">
          <div>
            <div class="setting-label">${this.i18n.t('settings.language')}</div>
            <div class="setting-desc">Select your preferred language</div>
          </div>
          <div class="setting-control">
            <select @change=${this.handleLocaleChange} .value=${this.locale}>
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
              <option value="zh-TW">繁體中文</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-settings-page': ScSettingsPage;
  }
}
