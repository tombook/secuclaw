/**
 * SecuClaw UI Bootstrap
 * 注册所有 Web Components + 初始化全局服务
 */

// Styles
import './styles/global.css';
import './styles/themes/security-expert.css';
import './styles/themes/privacy-officer.css';
import './styles/themes/security-architect.css';
import './styles/themes/business-security-officer.css';
import './styles/themes/secuclaw-commander.css';
import './styles/themes/ciso.css';
import './styles/themes/security-ops.css';
import './styles/themes/supply-chain-security.css';

// Config (side-effect: registers nothing, just exports)
// These are imported by components directly

// Shared components
import './components/shared/sc-badge';
import './components/shared/sc-card';
import './components/shared/sc-tooltip';
import './components/shared/sc-states';

// Smart recommendation
import './components/smart-recommendation/sc-smart-recommendation-bar';

// Role commander components
import './components/role-commander/sc-role-toolbar';
import './components/role-commander/sc-raci-panel';
import './components/role-commander/sc-metrics-grid';
import './components/role-commander/sc-collab-hub';
import './components/role-commander/sc-role-commander';

// Pages
import './pages/sc-overview';
import './pages/sc-dashboard';

// Services
import { initKeyboardShortcuts } from './services/keyboard-shortcuts';

// Mount app
const app = document.getElementById('app');
if (app) {
  const dashboard = document.createElement('sc-dashboard');
  app.innerHTML = '';
  app.appendChild(dashboard);

  // Init keyboard shortcuts — delegate to dashboard via events
  initKeyboardShortcuts((action) => {
    if (action.type === 'go-overview' || action.type === 'go-back') {
      dashboard.dispatchEvent(new CustomEvent('navigate', {
        detail: { view: 'overview' },
        bubbles: true,
      }));
    } else if (action.type === 'switch-role' && action.roleId) {
      dashboard.dispatchEvent(new CustomEvent('navigate', {
        detail: { view: 'role', roleId: action.roleId },
        bubbles: true,
      }));
    }
  });
}
