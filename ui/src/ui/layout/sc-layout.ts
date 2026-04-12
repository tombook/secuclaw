import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { roleContext, type RoleId } from '../store/role-context.js';
import { ROLE_THEMES, applyRoleTheme } from '../config/role-themes.js';
import './sc-sidebar.js';
import './sc-header.js';

const DEFAULT_ROLE: RoleId = 'security-expert';

@customElement('sc-layout')
export class ScLayout extends LitElement {
  @property({ type: Boolean })
  connected = false;

  @state()
  private currentRole: RoleId = DEFAULT_ROLE;

  private roleUnsub: (() => void) | null = null;

  connectedCallback() {
    super.connectedCallback();
    const state = roleContext.getState();
    this.currentRole = state.currentRole ?? DEFAULT_ROLE;
    this.roleUnsub = roleContext.subscribe((state) => {
      this.currentRole = state.currentRole ?? DEFAULT_ROLE;
      applyRoleTheme(this.currentRole);
    });
    applyRoleTheme(this.currentRole);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.roleUnsub) {
      this.roleUnsub();
      this.roleUnsub = null;
    }
  }

  static styles = css`
    :host {
      display: flex;
      min-height: 100vh;
    }

    .layout-container {
      display: flex;
      width: 100%;
    }

    sc-sidebar {
      flex-shrink: 0;
    }

    .main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    sc-header {
      flex-shrink: 0;
    }

    .content {
      flex: 1;
      padding: var(--sc-spacing-lg);
      overflow-y: auto;
      background-color: var(--sc-bg-secondary);
    }

    @media (max-width: 768px) {
      .content {
        padding: var(--sc-spacing-md);
      }
    }
  `;

  render() {
    return html`
      <div class="layout-container">
        <sc-sidebar></sc-sidebar>
        <div class="main-area">
          <sc-header .connected=${this.connected}></sc-header>
          <main class="content">
            <slot></slot>
          </main>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-layout': ScLayout;
  }
}
