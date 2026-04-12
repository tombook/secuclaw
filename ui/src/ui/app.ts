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
import './pages/settings/sc-roles-page.js';
import './pages/capabilities/sc-capabilities-page.js';
import './pages/tools/sc-tool-baseline-v2.js';
import './pages/tools/sc-security-tools.js';
import './pages/sc-secops-center.js';

import './pages/sc-datacenter-page.js';
import './pages/sc-reports-pro.js';
import './pages/sc-login-page.js';
import './pages/sc-tasks-page.js';
import './pages/sc-audit-page.js';
import './pages/sc-approval-page.js';
import './pages/sc-assets-page.js';

import './pages/settings/sc-siem-config.js';

import { gatewayClient } from './gateway-client.js';
import { authStore } from './store/auth-store.js';
import { i18n } from '../i18n/index.js';

@customElement('sc-app')
export class ScApp extends LitElement {
  @state() private connected = false;
  @state() private loading = true;
  @state() private isAuthenticated = false;
  private authUnsub: (() => void) | null = null;
  private prevAuthState = false;

  static styles = css`
    :host { display: block; min-height: 100vh; background-color: var(--sc-bg-primary); color: var(--sc-text-primary); }
    .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; gap: 1rem; }
    .loading-spinner { width: 48px; height: 48px; border: 3px solid var(--sc-border-color); border-top-color: var(--sc-primary); border-radius: 50%; animation: spin 1s linear infinite; }
    #outlet { min-height: 100vh; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `;

  constructor() { 
    super(); 
    this.isAuthenticated = authStore.getState().isAuthenticated;
    this.prevAuthState = this.isAuthenticated;
  }

  connectedCallback() {
    super.connectedCallback();
    this.authUnsub = authStore.subscribe((state) => {
      this.isAuthenticated = state.isAuthenticated;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.authUnsub) {
      this.authUnsub();
      this.authUnsub = null;
    }
  }

  protected async firstUpdated(): Promise<void> {
    gatewayClient.onConnectionChange((connected) => { this.connected = connected; });

    this.isAuthenticated = authStore.getState().isAuthenticated;
    this.prevAuthState = this.isAuthenticated;
    this.loading = false;
    await this.updateComplete;
    this.initRouter();
  }

  protected updated(changedProps: Map<string, unknown>): void {
    if (changedProps.has('isAuthenticated') && !this.loading) {
      const wasAuth = this.prevAuthState;
      const isAuth = this.isAuthenticated;
      this.prevAuthState = isAuth;

      if (wasAuth && !isAuth) {
        Router.go('/login');
      } else if (!wasAuth && isAuth) {
        Router.go('/');
      }

      this.updateComplete.then(() => {
        const outlet = this.shadowRoot!.querySelector('#outlet');
        if (outlet) {
          const router = (window as any).__router as Router | undefined;
          if (router) {
            (router as any).setOutlet(outlet);
            router.render((window as any).location?.pathname || '/');
          }
        }
      });
    }
  }

  private initRouter(): void {
    const outlet = this.shadowRoot!.querySelector('#outlet');
    if (!outlet) { return; }
    const router = new Router(outlet);

    const guardRoute = async (_context: any, commands: any) => {
      const state = authStore.getState();
      if (!state.isAuthenticated || !state.user) {
        return commands.redirect('/login');
      }
    };

    const guardAdmin = async (_context: any, commands: any) => {
      const state = authStore.getState();
      if (!state.isAuthenticated || !state.user) {
        return commands.redirect('/login');
      }
      if (!authStore.hasPermission('settings:manage')) {
        return commands.redirect('/unauthorized');
      }
    };

    router.setRoutes([
      { path: '/login', component: 'sc-login-page', action: async (_ctx: any, commands: any) => {
        if (authStore.getState().isAuthenticated) {
          return commands.redirect('/');
        }
      }},
      { path: '/unauthorized', component: 'sc-dashboard' },
      
      { path: '/', component: 'sc-dashboard', action: guardRoute },
      { path: '/threats', component: 'sc-threats-page', action: guardRoute },
      { path: '/incidents', component: 'sc-incidents-page', action: guardRoute },
      { path: '/vulnerabilities', component: 'sc-vulnerabilities-page', action: guardRoute },
      { path: '/compliance', component: 'sc-compliance-page', action: guardRoute },
      { path: '/reports', component: 'sc-reports-page', action: guardRoute },
      { path: '/risk', component: 'sc-risk-page', action: guardRoute },
      { path: '/war-room', component: 'sc-war-room-page', action: guardRoute },
      { path: '/war-room/:eventId', component: 'sc-war-room-page', action: guardRoute },
      { path: '/ai-experts', component: 'sc-ai-experts-page', action: guardRoute },
      { path: '/knowledge-base', component: 'sc-knowledge-base', action: guardRoute },
      { path: '/skills-market', component: 'sc-skills-market', action: guardRoute },
      { path: '/channels', component: 'sc-channels-page', action: guardRoute },
      { path: '/capabilities', component: 'sc-capabilities-page', action: guardRoute },
      
      { path: '/settings', component: 'sc-settings-page', action: guardAdmin },
      { path: '/settings/llm-config', component: 'sc-llm-service-config', action: guardAdmin },
      { path: '/settings/ai-experts-config', component: 'sc-ai-experts-config', action: guardAdmin },
      { path: '/settings/roles', component: 'sc-roles-page', action: guardAdmin },
      
      { path: '/tools/baseline', component: 'sc-tool-baseline-v2', action: guardRoute },
      { path: '/tools/vuln-scan', component: 'sc-security-tools', action: guardRoute },
      { path: '/tools/pentest', component: 'sc-security-tools', action: guardRoute },
      { path: '/tools/threat-hunt', component: 'sc-security-tools', action: guardRoute },
      { path: '/tools/security-ops', component: 'sc-secops-center', action: guardRoute },
      { path: '/data-center', component: 'sc-datacenter-page', action: guardRoute },
      { path: '/audit', component: 'sc-audit-page', action: guardRoute },
      { path: '/approval', component: 'sc-approval-page', action: guardRoute },
      { path: '/tasks', component: 'sc-tasks-page', action: guardRoute },
      { path: '/assets', component: 'sc-assets-page', action: guardRoute },
      { path: '/settings/siem-config', component: 'sc-siem-config', action: guardAdmin },
      { path: '/risk-center', component: 'sc-risk-page', action: guardRoute },
      { path: '/reports-pro', component: 'sc-reports-pro', action: guardRoute },
      
      { path: '/tools/config-check', component: 'sc-secops-center', action: guardRoute },
      { path: '/tools/attack-path', component: 'sc-secops-center', action: guardRoute },
      { path: '/tools/supply-chain', component: 'sc-secops-center', action: guardRoute },
      { path: '/tools/alerts', component: 'sc-secops-center', action: guardRoute },
      { path: '/tools/edr', component: 'sc-secops-center', action: guardRoute },
      { path: '/tools/compliance', component: 'sc-secops-center', action: guardRoute },
      { path: '/tools/dpia', component: 'sc-secops-center', action: guardRoute },
      { path: '/tools/risk', component: 'sc-secops-center', action: guardRoute },
      
      { path: '(.*)', redirect: '/' },
    ]);
    (window as any).__router = router;
  }

  render() {
    if (this.loading) {
      return html`<div class="loading-screen"><div class="loading-spinner"></div><span>${i18n.t('common.loading')}</span></div>`;
    }
    
    if (this.isAuthenticated) {
      return html`<sc-layout .connected=${this.connected}><div id="outlet"></div></sc-layout>`;
    }
    
    return html`<div id="outlet"></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'sc-app': ScApp; }
}
