import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { uiStore } from '../store/ui-store.js';

interface NavItem {
  path: string;
  icon: string;
  labelKey: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: '📊', labelKey: 'nav.dashboard' },
  { path: '/threats', icon: '🔍', labelKey: 'nav.threats' },
  { path: '/incidents', icon: '🚨', labelKey: 'nav.incidents' },
  { path: '/vulnerabilities', icon: '🐛', labelKey: 'nav.vulnerabilities' },
  { path: '/compliance', icon: '✅', labelKey: 'nav.compliance' },
  { path: '/war-room', icon: '🎯', labelKey: 'nav.warRoom' },
  { path: '/ai-experts', icon: '🤖', labelKey: 'nav.aiExperts' },
  { path: '/capabilities', icon: '⚔️', labelKey: 'nav.capabilities' },
  // Security Operations Center (统一入口)
  { path: '/tools/security-ops', icon: '🛡️', labelKey: 'nav.securityOps' },
  { path: '/skills-market', icon: '🛒', labelKey: 'nav.skillsMarket' },
  { path: '/channels', icon: '💬', labelKey: 'nav.channels' },
  { path: '/settings', icon: '⚙️', labelKey: 'nav.settings' },
];

@customElement('sc-sidebar')
export class ScSidebar extends LitElement {
  @state()
  private collapsed = false;

  @state()
  private currentPath = '/';

  private i18nCtrl = new I18nController(this);

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      width: 240px;
      background-color: var(--sc-sidebar-bg);
      border-right: 1px solid var(--sc-sidebar-border);
      transition: width var(--sc-transition-normal);
    }

    :host([collapsed]) {
      width: 64px;
    }

    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 64px;
      padding: var(--sc-spacing-md);
      border-bottom: 1px solid var(--sc-sidebar-border);
    }

    .logo-icon {
      font-size: 24px;
    }

    .logo-text {
      margin-left: var(--sc-spacing-sm);
      font-size: var(--sc-font-size-lg);
      font-weight: 600;
      color: var(--sc-text-primary);
    }

    :host([collapsed]) .logo-text {
      display: none;
    }

    .nav-list {
      flex: 1;
      list-style: none;
      padding: var(--sc-spacing-md) 0;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: var(--sc-spacing-sm) var(--sc-spacing-md);
      margin: var(--sc-spacing-xs) var(--sc-spacing-sm);
      border-radius: var(--sc-radius-md);
      cursor: pointer;
      color: var(--sc-text-secondary);
      text-decoration: none;
      transition: all var(--sc-transition-fast);
    }

    .nav-item:hover {
      background-color: var(--sc-sidebar-item-hover);
      color: var(--sc-text-primary);
    }

    .nav-item.active {
      background-color: var(--sc-sidebar-item-active);
      color: var(--sc-primary);
    }

    .nav-icon {
      font-size: 20px;
      min-width: 24px;
      text-align: center;
    }

    .nav-label {
      margin-left: var(--sc-spacing-md);
      font-size: var(--sc-font-size-sm);
      white-space: nowrap;
    }

    :host([collapsed]) .nav-label {
      display: none;
    }

    .toggle-button {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 40px;
      margin: var(--sc-spacing-sm);
      border: none;
      background-color: transparent;
      color: var(--sc-text-secondary);
      cursor: pointer;
      border-radius: var(--sc-radius-md);
    }

    .toggle-button:hover {
      background-color: var(--sc-sidebar-item-hover);
    }
  `;

  constructor() {
    super();
    this.collapsed = uiStore.getState().sidebarCollapsed;
    uiStore.subscribe((state) => {
      this.collapsed = state.sidebarCollapsed;
    });

    window.addEventListener('vaadin-router-location-changed', ((e: CustomEvent) => {
      this.currentPath = e.detail.location.pathname;
    }) as EventListener);
  }

  private handleNavigate(path: string): void {
    const router = (window as any).__router;
    if (!router) {
      console.warn('[sc-sidebar] Router not ready yet, delaying navigation...');
      return;
    }
    this.currentPath = path;
    router.render(path);
  }

  private handleToggle(): void {
    uiStore.toggleSidebar();
  }

  render() {
    return html`
      <div class="logo">
        <span class="logo-icon">🛡️</span>
        ${!this.collapsed ? html`<span class="logo-text">SecuClaw</span>` : ''}
      </div>
      
      <ul class="nav-list">
        ${navItems.map(
          (item) => html`
            <li
              class="nav-item ${this.currentPath === item.path ? 'active' : ''}"
              @click=${() => this.handleNavigate(item.path)}
            >
              <span class="nav-icon">${item.icon}</span>
              ${!this.collapsed
                ? html`<span class="nav-label">${this.i18nCtrl.t(item.labelKey)}</span>`
                : ''}
            </li>
          `
        )}
      </ul>

      <button class="toggle-button" @click=${this.handleToggle}>
        ${this.collapsed ? '▶' : '◀'}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-sidebar': ScSidebar;
  }
}
