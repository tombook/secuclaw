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
// Phase 2 — Advanced tool panels (101 components)
import './components/tool-panels/panels/sc-access-matrix';
import './components/tool-panels/panels/sc-alert-correlation';
import './components/tool-panels/panels/sc-alert-system';
import './components/tool-panels/panels/sc-api-security';
import './components/tool-panels/panels/sc-arch-review';
import './components/tool-panels/panels/sc-asset-inventory';
import './components/tool-panels/panels/sc-attack-patterns';
import './components/tool-panels/panels/sc-attack-surface-graph';
import './components/tool-panels/panels/sc-automation-editor';
import './components/tool-panels/panels/sc-backup-check';
import './components/tool-panels/panels/sc-baseline-scan';
import './components/tool-panels/panels/sc-bcp-dashboard';
import './components/tool-panels/panels/sc-bia-analysis';
import './components/tool-panels/panels/sc-board-report';
import './components/tool-panels/panels/sc-budget-planner';
import './components/tool-panels/panels/sc-cert-management';
import './components/tool-panels/panels/sc-champions';
import './components/tool-panels/panels/sc-change-review';
import './components/tool-panels/panels/sc-cloud-posture';
import './components/tool-panels/panels/sc-code-review';
import './components/tool-panels/panels/sc-compliance-calendar';
import './components/tool-panels/panels/sc-compliance-map';
import './components/tool-panels/panels/sc-config-audit';
import './components/tool-panels/panels/sc-container-security';
import './components/tool-panels/panels/sc-contract-review';
import './components/tool-panels/panels/sc-dark-sim-engine';
import './components/tool-panels/panels/sc-darkweb-monitor';
import './components/tool-panels/panels/sc-data-classification';
import './components/tool-panels/panels/sc-data-flow';
import './components/tool-panels/panels/sc-data-transfer';
import './components/tool-panels/panels/sc-deception';
import './components/tool-panels/panels/sc-dependency-tree';
import './components/tool-panels/panels/sc-dlp-dashboard';
import './components/tool-panels/panels/sc-dns-security';
import './components/tool-panels/panels/sc-dpia-workflow';
import './components/tool-panels/panels/sc-dr-plan';
import './components/tool-panels/panels/sc-dr-test';
import './components/tool-panels/panels/sc-email-security';
import './components/tool-panels/panels/sc-encryption-mgmt';
import './components/tool-panels/panels/sc-endpoint-dash';
import './components/tool-panels/panels/sc-evidence-collector';
import './components/tool-panels/panels/sc-exfil-detection';
import './components/tool-panels/panels/sc-exploit-predict';
import './components/tool-panels/panels/sc-forensics-timeline';
import './components/tool-panels/panels/sc-gdpr-tracker';
import './components/tool-panels/panels/sc-gov-framework';
import './components/tool-panels/panels/sc-identity-gov';
import './components/tool-panels/panels/sc-incident-comms';
import './components/tool-panels/panels/sc-incident-timeline';
import './components/tool-panels/panels/sc-integration-health';
import './components/tool-panels/panels/sc-ir-playbook';
import './components/tool-panels/panels/sc-k8s-security';
import './components/tool-panels/panels/sc-kpi-dashboard';
import './components/tool-panels/panels/sc-log-query';
import './components/tool-panels/panels/sc-malware-analysis';
import './components/tool-panels/panels/sc-mdm-dashboard';
import './components/tool-panels/panels/sc-metrics-export';
import './components/tool-panels/panels/evolution-dashboard';
import './components/tool-panels/panels/sc-mitre-navigator';
import './components/tool-panels/panels/sc-network-topo';
import './components/tool-panels/panels/sc-news-feed';
import './components/tool-panels/panels/sc-orchestration';
import './components/tool-panels/panels/sc-osint-tool';
import './components/tool-panels/panels/sc-pam-dashboard';
import './components/tool-panels/panels/sc-password-audit';
import './components/tool-panels/panels/sc-patch-tracker';
import './components/tool-panels/panels/sc-pentest-method';
import './components/tool-panels/panels/sc-pentest-report';
import './components/tool-panels/panels/sc-phishing-sim';
import './components/tool-panels/panels/sc-policy-checker';
import './components/tool-panels/panels/sc-privacy-computing';
import './components/tool-panels/panels/sc-purple-team';
import './components/tool-panels/panels/sc-reg-tracker';
import './components/tool-panels/panels/sc-risk-gauge';
import './components/tool-panels/panels/sc-risk-heatmap';
import './components/tool-panels/panels/sc-risk-register';
import './components/tool-panels/panels/sc-roi-calculator';
import './components/tool-panels/panels/sc-scan-results-table';
import './components/tool-panels/panels/sc-scanner-integration';
import './components/tool-panels/panels/sc-scf-questionnaire';
import './components/tool-panels/panels/sc-sec-quiz';
import './components/tool-panels/panels/sc-security-chat';
import './components/tool-panels/panels/sc-security-timeline';
import './components/tool-panels/panels/sc-severity-calc';
import './components/tool-panels/panels/sc-soc-metrics';
import './components/tool-panels/panels/sc-sso-config';
import './components/tool-panels/panels/sc-stride-model';
import './components/tool-panels/panels/sc-supply-chain-graph';
import './components/tool-panels/panels/sc-threat-feed';
import './components/tool-panels/panels/sc-threat-hunting';
import './components/tool-panels/panels/sc-training-module';
import './components/tool-panels/panels/sc-training-tracker';
import './components/tool-panels/panels/sc-vendor-onboard';
import './components/tool-panels/panels/sc-vendor-scorecard';
import './components/tool-panels/panels/sc-vendor-sla';
import './components/tool-panels/panels/sc-vuln-priority';
import './components/tool-panels/panels/sc-vuln-sla';
import './components/tool-panels/panels/sc-vuln-summary-chart';
import './components/tool-panels/panels/sc-vuln-trend';
import './components/tool-panels/panels/sc-waf-dashboard';
import './components/tool-panels/panels/sc-wireless-security';
import './components/tool-panels/panels/sc-zero-trust-designer';

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
