import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { Router } from '@vaadin/router';

import './layout/sc-layout.js';
import './pages/sc-dashboard.js';
import './pages/sc-threats-page.js';
import './pages/sc-incidents-page.js';
import './pages/sc-vulnerabilities-page.js';
import './pages/sc-compliance-page.js';
import './pages/sc-reports-page.js';
import './pages/sc-risk-page.js';
import './pages/sc-war-room-page.js';
import './pages/sc-ai-experts-page.js';
import './pages/sc-knowledge-base.js';
import './pages/sc-skills-market.js';
import './pages/sc-channels-page.js';
import './pages/settings/sc-settings-page.js';
import './pages/settings/sc-llm-service-config.js';
import './pages/settings/sc-ai-experts-config.js';
import './pages/capabilities/sc-capabilities-page.js';
import './pages/tools/sc-tool-demo-base.js';
import './pages/tools/sc-tool-baseline.js';
import './pages/tools/sc-tool-baseline-v2.js';
import './pages/tools/sc-security-tools.js';
import './pages/sc-secops-center.js';
import './pages/sc-baseline-page.js';
import './pages/sc-vulnscan-page.js';
import './pages/sc-pentest-page.js';
import './pages/sc-threathunt-page.js';
import './pages/sc-datacenter-page.js';
import './pages/sc-reports-pro.js';
import './pages/sc-risk-page.js';
import './pages/sc-risk-center.js';
import './pages/tools/sc-tool-all.js';

import { gatewayClient } from './gateway-client.js';
import { i18n } from '../i18n/index.js';

@customElement('sc-app')
export class ScApp extends LitElement {
  @state() private connected = false;
  @state() private loading = true;

  static styles = css`
    :host { display: block; min-height: 100vh; background-color: var(--sc-bg-primary); color: var(--sc-text-primary); }
    .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 1rem; }
    .loading-spinner { width: 48px; height: 48px; border: 3px solid var(--sc-border-color); border-top-color: var(--sc-primary); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  constructor() { super(); }

  protected async firstUpdated(): Promise<void> {
    gatewayClient.onConnectionChange((connected) => { this.connected = connected; });
    this.loading = false;
    await this.updateComplete;
    this.initRouter();
  }

  private initRouter(): void {
    const outlet = this.shadowRoot!.querySelector('#outlet');
    if (!outlet) { console.error('[sc-app] Router outlet not found'); return; }
    const router = new Router(outlet);
    router.setRoutes([
      { path: '/', component: 'sc-dashboard' },
      { path: '/threats', component: 'sc-threats-page' },
      { path: '/incidents', component: 'sc-incidents-page' },
      { path: '/vulnerabilities', component: 'sc-vulnerabilities-page' },
      { path: '/compliance', component: 'sc-compliance-page' },
      { path: '/reports', component: 'sc-reports-page' },
      { path: '/risk', component: 'sc-risk-page' },
      { path: '/war-room', component: 'sc-war-room-page' },
      { path: '/ai-experts', component: 'sc-ai-experts-page' },
      { path: '/knowledge-base', component: 'sc-knowledge-base' },
      { path: '/skills-market', component: 'sc-skills-market' },
      { path: '/channels', component: 'sc-channels-page' },
      { path: '/settings', component: 'sc-settings-page' },
      { path: '/settings/llm-config', component: 'sc-llm-service-config' },
      { path: '/settings/ai-experts-config', component: 'sc-ai-experts-config' },
      { path: '/capabilities', component: 'sc-capabilities-page' },
      // Professional Design Pages
      { path: '/tools/baseline', component: 'sc-baseline-page' },
      { path: '/tools/vuln-scan', component: 'sc-vulnscan-page' },
      { path: '/tools/pentest', component: 'sc-pentest-page' },
      { path: '/tools/threat-hunt', component: 'sc-threathunt-page' },
      { path: '/tools/security-ops', component: 'sc-secops-center' },
      { path: '/data-center', component: 'sc-datacenter-page' },
      { path: '/reports-pro', component: 'sc-reports-pro' },
      { path: '/risk-center', component: 'sc-risk-page' },
      // Legacy tool routes (redirect to secops center)
      { path: '/tools/config-check', component: 'sc-secops-center' },
      { path: '/tools/attack-path', component: 'sc-secops-center' },
      { path: '/tools/supply-chain', component: 'sc-secops-center' },
      { path: '/tools/alerts', component: 'sc-secops-center' },
      { path: '/tools/edr', component: 'sc-secops-center' },
      { path: '/tools/compliance', component: 'sc-secops-center' },
      { path: '/tools/dpia', component: 'sc-secops-center' },
      { path: '/tools/risk', component: 'sc-secops-center' },
      { path: '(.*)', redirect: '/' },
    ]);
    (window as any).__router = router;
  }

  render() {
    if (this.loading) {
      return html`<div class="loading-screen"><div class="loading-spinner"></div><span>${i18n.t('common.loading')}</span></div>`;
    }
    return html`<sc-layout .connected=${this.connected}><div id="outlet"></div></sc-layout>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sc-app': ScApp; }
}
