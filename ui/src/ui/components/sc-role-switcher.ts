import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import { roleContext, type RoleId, type RoleProfile, type RaciRole, type ScenarioType } from '../store/role-context.js';

interface RoleOption {
  roleId: RoleId;
  emoji: string;
  displayName: string;
  description: string;
  keyPermissions: string[];
}

@customElement('sc-role-switcher')
export class ScRoleSwitcher extends LitElement {
  @state()
  private isOpen = false;

  @state()
  private hoveredRole: RoleId | null = null;

  @state()
  private focusedIndex = 0;

  @query('.dropdown')
  private dropdown!: HTMLElement;

  private roleOptions: RoleOption[] = [
    { roleId: 'security-expert', emoji: '🔐', displayName: '安全专家', description: '漏洞管理与安全分析', keyPermissions: ['vulnerabilities.read', 'vulnerabilities.write'] },
    { roleId: 'privacy-officer', emoji: '🔒', displayName: '隐私安全官', description: '隐私合规管理', keyPermissions: ['compliance.read', 'compliance.write'] },
    { roleId: 'security-architect', emoji: '🏗️', displayName: '安全架构师', description: '安全架构设计', keyPermissions: ['assets.read', 'assets.write'] },
    { roleId: 'business-security-officer', emoji: '📊', displayName: '业务安全官', description: '业务连续性管理', keyPermissions: ['vulnerabilities.write', 'incidents.write'] },
    { roleId: 'secuclaw-commander', emoji: '🎯', displayName: '全域安全指挥官', description: '全域安全指挥', keyPermissions: ['commander.read', 'commander.write'] },
    { roleId: 'ciso', emoji: '👔', displayName: '首席信息安全官', description: '安全战略规划', keyPermissions: ['roles.read', 'roles.write'] },
    { roleId: 'security-ops', emoji: '⚙️', displayName: '安全运营官', description: 'SOC运营管理', keyPermissions: ['channels.read', 'channels.write'] },
    { roleId: 'supply-chain-security', emoji: '🔗', displayName: '供应链安全官', description: '供应链安全管理', keyPermissions: ['assets.read', 'audit.read'] },
  ];

  private recentRoles: RoleId[] = [];

  static styles = css`
    :host {
      display: inline-block;
      position: relative;
      font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    .trigger {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      background-color: var(--color-bg-tertiary, #334155);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-md, 0.375rem);
      cursor: pointer;
      color: var(--color-text, #f8fafc);
      transition: all var(--transition-normal, 200ms ease);
      min-width: 180px;
    }

    .trigger:hover {
      border-color: var(--color-border-focus, #3b82f6);
      background-color: var(--color-bg-hover, #475569);
    }

    .trigger:focus {
      outline: 2px solid var(--color-primary, #3b82f6);
      outline-offset: 2px;
    }

    .trigger.open {
      border-color: var(--color-primary, #3b82f6);
    }

    .emoji {
      font-size: 1.25rem;
      transition: transform var(--transition-normal, 200ms ease);
    }

    .role-name {
      flex: 1;
      font-weight: var(--font-weight-medium, 500);
      text-align: left;
      transition: opacity var(--transition-normal, 200ms ease);
    }

    .dropdown-indicator {
      font-size: 0.75rem;
      color: var(--color-text-tertiary, #64748b);
      transition: transform var(--transition-normal, 200ms ease);
    }

    .trigger.open .dropdown-indicator {
      transform: rotate(180deg);
    }

    .dropdown {
      position: absolute;
      top: calc(100% + var(--space-1, 0.25rem));
      left: 0;
      width: 320px;
      background-color: var(--color-bg-card, #1e293b);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-lg, 0.5rem);
      box-shadow: var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
      z-index: var(--z-dropdown, 1000);
      overflow: hidden;
      opacity: 0;
      visibility: hidden;
      transform: translateY(-8px);
      transition: all var(--transition-normal, 200ms ease);
    }

    .dropdown.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .dropdown-section {
      padding: var(--space-2, 0.5rem) 0;
    }

    .dropdown-section:not(:last-child) {
      border-bottom: 1px solid var(--color-border, #334155);
    }

    .section-label {
      padding: var(--space-1, 0.25rem) var(--space-3, 0.75rem);
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-tertiary, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .role-option {
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
      padding: var(--space-3, 0.75rem);
      cursor: pointer;
      transition: all var(--transition-normal, 200ms ease);
    }

    .role-option:hover,
    .role-option.focused {
      background-color: var(--color-bg-hover, #334155);
    }

    .role-option.focused {
      outline: 2px solid var(--color-primary, #3b82f6);
      outline-offset: -2px;
    }

    .role-option.current {
      background-color: var(--color-primary-light, #1e3a5f);
    }

    .role-option .emoji {
      font-size: 1.5rem;
      width: 36px;
      text-align: center;
    }

    .role-info {
      flex: 1;
      min-width: 0;
    }

    .role-info .name {
      font-weight: var(--font-weight-medium, 500);
      color: var(--color-text, #f8fafc);
    }

    .role-info .desc {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-text-secondary, #cbd5e1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .role-info .name {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
    }

    .raci-badge {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: var(--font-weight-medium, 500);
      padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
      border-radius: var(--radius-full, 9999px);
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .color-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .check-icon {
      color: var(--color-primary, #3b82f6);
      font-size: 1rem;
    }

    .profile-card {
      position: absolute;
      right: -340px;
      top: 0;
      width: 320px;
      background-color: var(--color-bg-card, #1e293b);
      border: 1px solid var(--color-border, #334155);
      border-radius: var(--radius-lg, 0.5rem);
      padding: var(--space-4, 1rem);
      box-shadow: var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 0.1));
      opacity: 0;
      visibility: hidden;
      transition: opacity var(--transition-normal, 200ms ease);
      pointer-events: none;
    }

    .role-option:hover .profile-card,
    .profile-card.visible {
      opacity: 1;
      visibility: visible;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
      margin-bottom: var(--space-3, 0.75rem);
    }

    .profile-header .emoji {
      font-size: 2rem;
    }

    .profile-header .name {
      font-size: var(--font-size-lg, 1.125rem);
      font-weight: var(--font-weight-semibold, 600);
      color: var(--color-text, #f8fafc);
    }

    .profile-header .description {
      font-size: var(--font-size-sm, 0.875rem);
      color: var(--color-text-secondary, #cbd5e1);
    }

    .profile-section {
      margin-top: var(--space-3, 0.75rem);
    }

    .profile-section-title {
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-tertiary, #64748b);
      text-transform: uppercase;
      margin-bottom: var(--space-2, 0.5rem);
    }

    .permission-list {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1, 0.25rem);
    }

    .permission-tag {
      padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
      background-color: var(--color-bg-tertiary, #334155);
      border-radius: var(--radius-sm, 0.25rem);
      font-size: var(--font-size-xs, 0.75rem);
      color: var(--color-text-secondary, #cbd5e1);
    }

    @keyframes role-switch-enter {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    .role-option.switching {
      animation: role-switch-enter var(--transition-normal, 200ms ease);
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.recentRoles = roleContext.getState().recentRoles;
    document.addEventListener('click', this.handleOutsideClick);
    
    const savedOpenState = sessionStorage.getItem('sc-role-switcher-open');
    if (savedOpenState === 'true') {
      this.isOpen = true;
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleOutsideClick);
  }

  private handleOutsideClick = (e: MouseEvent) => {
    if (!this.contains(e.target as Node)) {
      this.closeDropdown();
    }
  };

  private toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.focusedIndex = 0;
    }
    sessionStorage.setItem('sc-role-switcher-open', this.isOpen.toString());
  }

  private closeDropdown() {
    this.isOpen = false;
    this.hoveredRole = null;
    sessionStorage.setItem('sc-role-switcher-open', 'false');
  }

  private async selectRole(roleId: RoleId) {
    await roleContext.setRole(roleId);
    this.recentRoles = roleContext.getState().recentRoles;
    this.closeDropdown();
  }

  private handleKeydown(e: KeyboardEvent) {
    if (!this.isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        this.toggleDropdown();
      }
      return;
    }

    const options = this.getAllOptions();

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.closeDropdown();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.focusedIndex = Math.min(this.focusedIndex + 1, options.length - 1);
        this.scrollToFocused(options);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
        this.scrollToFocused(options);
        break;
      case 'Enter':
        e.preventDefault();
        if (options[this.focusedIndex]) {
          this.selectRole(options[this.focusedIndex].roleId);
        }
        break;
      case 'Tab':
        this.closeDropdown();
        break;
    }
  }

  private getAllOptions(): RoleOption[] {
    return this.roleOptions;
  }

  private scrollToFocused(options: RoleOption[]) {
    const focused = options[this.focusedIndex];
    if (focused) {
      this.hoveredRole = focused.roleId;
    }
  }

  private getCurrentRole(): RoleOption | undefined {
    const currentRoleId = roleContext.getState().currentRole;
    return this.roleOptions.find(r => r.roleId === currentRoleId);
  }

  private getSortedOptions(): { recent: RoleOption[], others: RoleOption[] } {
    const recent = this.recentRoles
      .map(id => this.roleOptions.find(r => r.roleId === id))
      .filter((r): r is RoleOption => !!r);
    
    const recentIds = new Set(this.recentRoles);
    const others = this.roleOptions.filter(r => !recentIds.has(r.roleId));

    return { recent, others };
  }

  render() {
    const current = this.getCurrentRole();
    const { recent, others } = this.getSortedOptions();
    const currentRoleId = roleContext.getState().currentRole;

    return html`
      <div
        class="trigger ${this.isOpen ? 'open' : ''}"
        @click=${this.toggleDropdown}
        @keydown=${this.handleKeydown}
        tabindex="0"
        role="combobox"
        aria-expanded=${this.isOpen}
        aria-haspopup="listbox"
        aria-label="Role switcher, currently ${current?.displayName || 'No role selected'}"
      >
        ${current ? html`
          <span class="emoji">${current.emoji}</span>
          <span class="role-name">${current.displayName}</span>
        ` : html`
          <span class="role-name">Select Role</span>
        `}
        <span class="dropdown-indicator">▼</span>
      </div>

      <div class="dropdown ${this.isOpen ? 'open' : ''}" role="listbox">
        ${recent.length > 0 ? html`
          <div class="dropdown-section">
            <div class="section-label">Recent</div>
            ${recent.map((role, index) => this.renderRoleOption(role, index, currentRoleId))}
          </div>
        ` : ''}

        <div class="dropdown-section">
          ${recent.length > 0 ? html`<div class="section-label">All Roles</div>` : ''}
          ${others.map((role, index) => this.renderRoleOption(role, recent.length + index, currentRoleId))}
        </div>
      </div>
    `;
  }

  private renderRoleOption(role: RoleOption, index: number, currentRoleId: RoleId | null) {
    const isCurrent = role.roleId === currentRoleId;
    const isFocused = this.focusedIndex === index;
    const state = roleContext.getState();
    const isInWarRoom = state.warRoomSessionId !== null;
    const raciAssignments = roleContext.getRaciAssignments();
    
    let raciBadge: RaciRole | null = null;
    if (isInWarRoom) {
      const assignment = raciAssignments.scenarios.find(s => s.raciRole);
      if (assignment) {
        raciBadge = assignment.raciRole;
      }
    }

    const getRaciColor = (raci: RaciRole): string => {
      const colors: Record<RaciRole, string> = {
        'R': '#10b981',
        'A': '#ef4444',
        'C': '#f59e0b',
        'I': '#6366f1',
      };
      return colors[raci] || '#64748b';
    };

    const getRaciLabel = (raci: RaciRole): string => {
      const labels: Record<RaciRole, string> = {
        'R': 'Responsible',
        'A': 'Accountable',
        'C': 'Consulted',
        'I': 'Informed',
      };
      return labels[raci] || raci;
    };

    const getThemeColor = (roleId: RoleId): string => {
      const colors: Record<RoleId, string> = {
        'security-expert': '#3b82f6',
        'privacy-officer': '#8b5cf6',
        'security-architect': '#f59e0b',
        'business-security-officer': '#10b981',
        'secuclaw-commander': '#ef4444',
        'ciso': '#6366f1',
        'security-ops': '#f97316',
        'supply-chain-security': '#14b8a6',
      };
      return colors[roleId];
    };

    return html`
      <div
        class="role-option ${isCurrent ? 'current' : ''} ${isFocused ? 'focused' : ''}"
        @click=${() => this.selectRole(role.roleId)}
        @mouseenter=${() => this.hoveredRole = role.roleId}
        @mouseleave=${() => this.hoveredRole = null}
        role="option"
        aria-selected=${isCurrent}
        tabindex="-1"
      >
        <span class="emoji">${role.emoji}</span>
        <div class="role-info">
          <div class="name">
            ${role.displayName}
            ${raciBadge ? html`
              <span class="raci-badge" style="background-color: ${getRaciColor(raciBadge)};">
                ${getRaciLabel(raciBadge)}
              </span>
            ` : ''}
          </div>
          <div class="desc">${role.description}</div>
        </div>
        <span class="color-indicator" style="background-color: ${getThemeColor(role.roleId)};"></span>
        ${isCurrent ? html`<span class="check-icon">✓</span>` : ''}

        ${this.hoveredRole === role.roleId ? html`
          <div class="profile-card visible">
            <div class="profile-header">
              <span class="emoji">${role.emoji}</span>
              <div>
                <div class="name">${role.displayName}</div>
                <div class="description">${role.description}</div>
              </div>
            </div>
            <div class="profile-section">
              <div class="profile-section-title">Key Permissions</div>
              <div class="permission-list">
                ${role.keyPermissions.map(p => html`
                  <span class="permission-tag">${p}</span>
                `)}
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-role-switcher': ScRoleSwitcher;
  }
}
