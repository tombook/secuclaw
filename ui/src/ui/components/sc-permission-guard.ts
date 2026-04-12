import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { permissionService } from '../services/permission-service.js';
import { roleContext } from '../store/role-context.js';

export type PermissionGuardMode = 'hide' | 'disable';

@customElement('sc-permission-guard')
export class ScPermissionGuard extends LitElement {
  @property({ type: String, attribute: 'requires' })
  requires: string = '';

  @property({ type: String, attribute: 'requires-any' })
  requiresAny: string = '';

  @property({ type: String, attribute: 'requires-all' })
  requiresAll: string = '';

  @property({ type: String, attribute: 'mode' })
  mode: PermissionGuardMode = 'hide';

  @property({ type: String, attribute: 'disabled-tooltip' })
  disabledTooltip: string = 'You do not have permission to perform this action';

  @state()
  private hasPermission = false;

  private unsubscribe?: () => void;

  static styles = css`
    :host {
      display: contents;
    }

    .guard-content {
      display: contents;
    }

    .guard-content.disabled {
      pointer-events: none;
      opacity: 0.5;
    }

    .guard-content.disabled ::slotted(*) {
      pointer-events: none;
    }

    .tooltip {
      position: relative;
    }

    .tooltip::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      padding: var(--space-1, 0.25rem) var(--space-2, 0.5rem);
      background-color: var(--color-bg-tertiary, #334155);
      color: var(--color-text, #f8fafc);
      font-size: var(--font-size-sm, 0.875rem);
      border-radius: var(--radius-sm, 0.25rem);
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: all var(--transition-fast, 150ms ease);
      z-index: var(--z-tooltip, 1100);
    }

    .tooltip:hover::after {
      opacity: 1;
      visibility: visible;
    }

    ::slotted([slot='fallback']) {
      display: block;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    this.checkPermission();
    this.unsubscribe = roleContext.subscribe(() => this.checkPermission());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  private checkPermission() {
    if (this.requires) {
      this.hasPermission = permissionService.can(this.requires);
    } else if (this.requiresAny) {
      const permissions = this.requiresAny.split(',').map(p => p.trim());
      this.hasPermission = permissionService.canAny(permissions);
    } else if (this.requiresAll) {
      const permissions = this.requiresAll.split(',').map(p => p.trim());
      this.hasPermission = permissionService.canAll(permissions);
    } else {
      this.hasPermission = true;
    }

    this.dispatchEvent(new CustomEvent('permission-change', {
      detail: { hasPermission: this.hasPermission },
      bubbles: true,
      composed: true,
    }));
  }

  private handleDisabledClick(e: Event) {
    if (this.mode === 'disable' && !this.hasPermission) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  render() {
    if (this.mode === 'hide') {
      if (!this.hasPermission) {
        return html`<slot name="fallback"></slot>`;
      }
      return html`<slot></slot>`;
    }

    if (this.mode === 'disable') {
      const disabled = !this.hasPermission;
      return html`
        <div 
          class="guard-content ${disabled ? 'disabled tooltip' : ''}"
          @click=${this.handleDisabledClick}
          data-tooltip=${disabled ? this.disabledTooltip : ''}
        >
          <slot></slot>
        </div>
      `;
    }

    return html`<slot></slot>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-permission-guard': ScPermissionGuard;
  }
}
