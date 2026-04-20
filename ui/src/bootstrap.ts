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

// Shared components (unused stubs removed — inline styles used instead)
// import './components/shared/sc-badge';
// import './components/shared/sc-card';
// import './components/shared/sc-tooltip';
// import './components/shared/sc-states';

// Smart recommendation
import './components/smart-recommendation/sc-smart-recommendation-bar';

// Role commander components (sc-role-toolbar, sc-raci-panel, sc-metrics-grid unused — inline in sc-role-commander)
import './components/role-commander/sc-collab-hub';
import './components/role-commander/sc-role-commander';

// Pages
import './pages/sc-overview';
import './components/sc-plugin-market';
import './pages/sc-app-shell';

// Command Palette
import './components/sc-command-palette';

// Services
import { initKeyboardShortcuts } from './services/keyboard-shortcuts';

// Mount
const app = document.getElementById('app');
if (app) {
  const shell = document.createElement('sc-app-shell');
  app.innerHTML = '';
  app.appendChild(shell);

  initKeyboardShortcuts((action) => {
    if (action.type === 'go-overview' || action.type === 'go-back') {
      shell.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'overview' }, bubbles: true }));
    } else if (action.type === 'switch-role' && action.roleId) {
      shell.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'role', roleId: action.roleId }, bubbles: true }));
    }
  });
}
