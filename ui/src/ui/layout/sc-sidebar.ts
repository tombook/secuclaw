import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { I18nController } from '../../i18n/lib/lit-controller.js';
import { uiStore } from '../store/ui-store.js';
import { MENU_GROUPS, type NavGroup } from '../config/menu-config.js';

@customElement('sc-sidebar')
export class ScSidebar extends LitElement {
  @state()
  private collapsed = false;

  @state()
  private currentPath = '/';

  @state()
  private expandedGroups: Set<string> = new Set(['operations']);

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

    .nav-container {
      flex: 1;
      overflow-y: auto;
      padding: var(--sc-spacing-sm) 0;
    }

    .nav-group {
      margin-bottom: var(--sc-spacing-xs);
    }

    .nav-group-header {
      display: flex;
      align-items: center;
      padding: var(--sc-spacing-sm) var(--sc-spacing-md);
      cursor: pointer;
      color: var(--sc-text-tertiary);
      font-size: var(--sc-font-size-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: color var(--sc-transition-fast);
    }

    .nav-group-header:hover {
      color: var(--sc-text-secondary);
    }

    .nav-group-icon {
      font-size: 14px;
      margin-right: var(--sc-spacing-sm);
    }

    .nav-group-name {
      flex: 1;
    }

    .nav-group-arrow {
      font-size: 10px;
      transition: transform var(--sc-transition-fast);
    }

    .nav-group-arrow.expanded {
      transform: rotate(90deg);
    }

    :host([collapsed]) .nav-group-header {
      justify-content: center;
      padding: var(--sc-spacing-sm);
    }

    :host([collapsed]) .nav-group-icon,
    :host([collapsed]) .nav-group-name,
    :host([collapsed]) .nav-group-arrow {
      display: none;
    }

    .nav-items {
      overflow: hidden;
      max-height: 0;
      transition: max-height var(--sc-transition-normal);
    }

    .nav-items.expanded {
      max-height: 500px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: var(--sc-spacing-sm) var(--sc-spacing-md);
      padding-left: calc(var(--sc-spacing-md) + 20px);
      margin: 2px var(--sc-spacing-xs);
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
      font-size: 18px;
      min-width: 20px;
      text-align: center;
    }

    .nav-label {
      margin-left: var(--sc-spacing-sm);
      font-size: var(--sc-font-size-sm);
      white-space: nowrap;
    }

    :host([collapsed]) .nav-item {
      justify-content: center;
      padding: var(--sc-spacing-sm);
      padding-left: var(--sc-spacing-sm);
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
      this.updateExpandedGroups();
    }) as EventListener);
  }

  private updateExpandedGroups() {
    // Auto-expand group containing current path
    for (const group of MENU_GROUPS) {
      if (group.items.some(item => item.path === this.currentPath || 
          (item.children && item.children.some(c => c.path === this.currentPath)))) {
        this.expandedGroups = new Set([...this.expandedGroups, group.id]);
      }
    }
  }

  private toggleGroup(groupId: string) {
    const newExpanded = new Set(this.expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    this.expandedGroups = newExpanded;
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

  private isActive(path: string): boolean {
    return this.currentPath === path;
  }

  private renderNavGroup(group: NavGroup) {
    const isExpanded = this.expandedGroups.has(group.id) && !this.collapsed;
    // Key format: nav.group + capitalized group id (e.g., "operations" -> "nav.groupOperations")
    const groupLabelKey = `nav.group${group.id.charAt(0).toUpperCase() + group.id.slice(1)}` as any;
    
    return html`
      <div class="nav-group">
        <div class="nav-group-header" @click=${() => this.toggleGroup(group.id)}>
          <span class="nav-group-icon">${group.icon}</span>
          <span class="nav-group-name">${this.i18nCtrl.t(groupLabelKey) || group.name}</span>
          <span class="nav-group-arrow ${isExpanded ? 'expanded' : ''}">▶</span>
        </div>
        <div class="nav-items ${isExpanded ? 'expanded' : ''}">
          ${group.items.map(item => this.renderNavItem(item))}
        </div>
      </div>
    `;
  }

  private renderNavItem(item: any) {
    const isActive = this.isActive(item.path);
    
    return html`
      <div
        class="nav-item ${isActive ? 'active' : ''}"
        @click=${() => this.handleNavigate(item.path)}
      >
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${this.i18nCtrl.t(item.labelKey)}</span>
      </div>
    `;
  }

  render() {
    return html`
      <div class="logo">
        <span class="logo-icon">🛡️</span>
        ${!this.collapsed ? html`<span class="logo-text">SecuClaw</span>` : ''}
      </div>
      
      <div class="nav-container">
        ${MENU_GROUPS.map(group => this.renderNavGroup(group))}
      </div>

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
