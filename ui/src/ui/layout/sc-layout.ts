import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import './sc-sidebar.js';
import './sc-header.js';

@customElement('sc-layout')
export class ScLayout extends LitElement {
  @property({ type: Boolean })
  connected = false;

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
