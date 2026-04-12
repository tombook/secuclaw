import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { roleContext, type RoleId } from '../store/role-context.js';
import { ROLE_THEMES } from '../config/role-themes.js';

@customElement('sc-role-identity')
export class ScRoleIdentity extends LitElement {
  @property({ type: String })
  roleId: RoleId = 'security-expert';

  @property({ type: Boolean })
  compact = false;

  static styles = css`
    :host {
      display: block;
      font-family: var(--sc-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    }

    .identity-card {
      background-color: var(--sc-bg-card, #1e293b);
      border: 1px solid var(--sc-border-color, #334155);
      border-radius: var(--sc-radius-lg, 0.75rem);
      padding: var(--sc-spacing-md, 1rem);
      transition: all var(--sc-transition-fast, 150ms ease);
    }

    .identity-card:hover {
      border-color: var(--sc-primary, #3b82f6);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .identity-header {
      display: flex;
      align-items: center;
      gap: var(--sc-spacing-md, 1rem);
      margin-bottom: var(--sc-spacing-md, 1rem);
    }

    .identity-emoji {
      font-size: 2.5rem;
      line-height: 1;
    }

    .identity-info {
      flex: 1;
    }

    .identity-name {
      font-size: var(--sc-font-size-lg, 1.125rem);
      font-weight: 600;
      color: var(--sc-text-primary, #f8fafc);
      margin-bottom: var(--sc-spacing-xs, 0.25rem);
    }

    .identity-description {
      font-size: var(--sc-font-size-sm, 0.875rem);
      color: var(--sc-text-secondary, #cbd5e1);
    }

    .identity-badges {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sc-spacing-xs, 0.5rem);
      margin-top: var(--sc-spacing-md, 1rem);
    }

    .identity-badge {
      padding: var(--sc-spacing-xs, 0.25rem) var(--sc-spacing-sm, 0.5rem);
      border-radius: var(--sc-radius-full, 999px);
      font-size: var(--sc-font-size-xs, 0.75rem);
      font-weight: 500;
    }

    .identity-badge.role {
      background-color: rgba(59, 130, 246, 0.1);
      color: var(--sc-primary, #3b82f6);
    }

    .identity-badge.dimension {
      background-color: var(--sc-bg-tertiary, #334155);
      color: var(--sc-text-secondary, #cbd5e1);
    }

    @media (max-width: 768px) {
      .identity-card {
        padding: var(--sc-spacing-sm, 0.75rem);
      }

      .identity-emoji {
        font-size: 2rem;
      }

      .identity-name {
        font-size: var(--sc-font-size-md, 1rem);
      }
    }
  `;

  render() {
    const theme = ROLE_THEMES[this.roleId];
    const roleProfile = roleContext.getRoleProfile(this.roleId);

    if (!theme || !roleProfile) {
      return html``;
    }

    const dimensions = [
      'Light Side',
      'Dark Side',
      'Security',
      'Legal',
      'Technology',
      'Business',
    ];

    return html`
      <div class="identity-card">
        <div class="identity-header">
          <span class="identity-emoji">${roleProfile.emoji}</span>
          <div class="identity-info">
            <div class="identity-name">${roleProfile.displayName}</div>
            <div class="identity-description">${roleProfile.description}</div>
          </div>
        </div>
        ${!this.compact ? html`
          <div class="identity-badges">
            <span class="identity-badge role">${this.roleId}</span>
            ${dimensions.map(dim => html`
              <span class="identity-badge dimension">${dim}</span>
            `)}
          </div>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-role-identity': ScRoleIdentity;
  }
}
