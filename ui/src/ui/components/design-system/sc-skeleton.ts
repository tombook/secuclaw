import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'rounded';

@customElement('sc-skeleton')
export class ScSkeleton extends LitElement {
  @property({ type: String, attribute: 'variant' })
  variant: SkeletonVariant = 'text';

  @property({ type: String })
  width = '100%';

  @property({ type: String })
  height = '1em';

  @property({ type: String })
  borderRadius = 'var(--radius-sm, 0.25rem)';

  static styles = css`
    :host {
      display: block;
    }

    .skeleton {
      background: linear-gradient(
        90deg,
        var(--color-bg-tertiary, #334155) 25%,
        var(--color-bg-hover, #475569) 50%,
        var(--color-bg-tertiary, #334155) 75%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton.text {
      height: 1em;
      border-radius: var(--radius-sm, 0.25rem);
    }

    .skeleton.circular {
      width: 40px;
      height: 40px;
      border-radius: 50%;
    }

    .skeleton.rectangular {
      border-radius: 0;
    }

    .skeleton.rounded {
      border-radius: var(--radius-lg, 0.5rem);
    }

    @keyframes shimmer {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
  `;

  render() {
    return html`
      <div 
        class="skeleton ${this.variant}"
        style="
          width: ${this.variant === 'circular' ? '40px' : this.width};
          height: ${this.variant === 'circular' ? '40px' : this.height};
          border-radius: ${this.variant === 'circular' ? '50%' : this.borderRadius};
        "
      ></div>
    `;
  }
}

@customElement('sc-skeleton-group')
export class ScSkeletonGroup extends LitElement {
  @property({ type: Number })
  count = 3;

  @property({ type: String, attribute: 'skeleton-variant' })
  skeletonVariant: SkeletonVariant = 'text';

  @property({ type: String })
  gap = 'var(--space-2, 0.5rem)';

  static styles = css`
    :host {
      display: block;
    }

    .skeleton-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2, 0.5rem);
    }
  `;

  render() {
    return html`
      <div class="skeleton-group" style="gap: ${this.gap}">
        ${Array(this.count).fill(0).map(() => html`
          <sc-skeleton variant=${this.skeletonVariant}></sc-skeleton>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sc-skeleton': ScSkeleton;
    'sc-skeleton-group': ScSkeletonGroup;
  }
}
