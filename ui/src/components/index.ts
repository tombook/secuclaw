/**
 * SecuClaw Security Components Index v3.0
 * Central registry of all security dashboard components
 * 
 * Features:
 * - Full dark mode consistency with CSS custom properties
 * - WCAG 2.1 AAA accessibility compliance
 * - Responsive design across all breakpoints
 * - Unified theming system with role-based themes
 * 
 * Usage: Import and register components for use in the application
 * import './components/index';
 */

// ============ Master Dashboard ============
export { ScSecuClawOverview } from './sc-secuclaw-overview.js';

// ============ Unified Security Dashboard ============
export { ScUnifiedSecurityDashboard } from './unified-dashboard/sc-unified-security-dashboard.js';

// ============ Security Dashboard & Analytics ============
export { ScSecurityDashboard } from './security-dashboards/sc-security-dashboard.js';
export { ScThreatTrendChart } from './security-dashboards/sc-threat-trend-chart.js';

// ============ Attack Surface Management ============
export { ScAttackSurfacePanel } from './attack-surface/sc-attack-surface-panel.js';

// ============ Vulnerability Management ============
export { ScVulnLifecyclePanel } from './vulnerability/sc-vuln-lifecycle-panel.js';

// ============ Security Posture ============
export { ScSecurityPostureScore } from './security-posture/sc-security-posture-score.js';

// ============ Threat Hunting ============
export { ScThreatHuntingWorkspace } from './threat-hunting/sc-threat-hunting-workspace.js';

// ============ SOC Operations ============
export { ScSocDashboard } from './soc/sc-soc-dashboard.js';
export { ScSocWorkflowAutomation } from './soc-workflow/sc-soc-workflow-automation.js';

// ============ KPI Metrics ============
export { ScKpiMetricsDashboard } from './kpi-metrics/sc-kpi-metrics-dashboard.js';

// ============ Timeline & Incidents ============
export { ScIncidentTimeline } from './timeline/sc-incident-timeline.js';

// ============ Compliance & Audit ============
export { ScComplianceAuditTracker } from './compliance-audit/sc-compliance-audit-tracker.js';

// ============ Asset Management ============
export { ScAssetInventory } from './asset-inventory/sc-asset-inventory.js';

// ============ Network Security ============
export { ScNetworkSecurityMonitor } from './network-security/sc-network-security-monitor.js';

// ============ IAM Analytics ============
export { ScIamAnalytics } from './iam-analytics/sc-iam-analytics.js';

// ============ DLP (Data Loss Prevention) ============
export { ScDlpPanel } from './dlp/sc-dlp-panel.js';

// ============ Security Training ============
export { ScSecurityTrainingTracker } from './security-training/sc-security-training-tracker.js';

// ============ Vendor Risk ============
export { ScVendorRiskAssessment } from './vendor-risk/sc-vendor-risk-assessment.js';

// ============ Policy Management ============
export { ScSecurityPolicyManagement } from './policy-management/sc-security-policy-management.js';

// ============ Pentest Reports ============
export { ScPentestReportGenerator } from './pentest-report/sc-pentest-report-generator.js';

// ============ Remediation ============
export { ScRemediationTracking } from './remediation/sc-remediation-tracking.js';

// ============ Security ROI ============
export { ScSecurityRoiCalculator } from './security-roi/sc-security-roi-calculator.js';

// ============ Threat Modeling ============
export { ScThreatModelVisualization } from './threat-model/sc-threat-model-visualization.js';

// ============ New Modules (P0/P1 Phase 2) ============
export { ScNewModulesHub } from './sc-new-modules-hub.js';
export { ScSoarDashboard } from './detection/sc-soar-dashboard.js';
export { ScUebaDashboard } from './ueba/sc-ueba-dashboard.js';
export { ScSigmaDashboard } from './detection/sc-sigma-dashboard.js';
export { ScAiScmDashboard } from './ai-scm/sc-ai-scm-dashboard.js';
export { ScEasmDashboard } from './easm/sc-easm-dashboard.js';
export { ScRaspDashboard } from './rasp/sc-rasp-dashboard.js';
export { ScDspmDashboard } from './dspm/sc-dspm-dashboard.js';
export { ScItrdDashboard } from './itdr/sc-itdr-dashboard.js';
export { ScSaasDashboard } from './saas/sc-saas-dashboard.js';
export { ScTenantDashboard } from './tenant/sc-tenant-dashboard.js';
export { ScNotificationCenter } from './notification/sc-notification-center.js';

/**
 * Component Categories:
 * 
 * DASHBOARDS (Core)
 * - ScSecuClawMasterDashboard - Full-featured security operations center v3.0
 * - ScUnifiedSecurityDashboard - Enhanced unified dashboard with dark mode
 * - ScSecuClawOverview - Overview/landing page
 * - ScSecurityDashboard - Core security monitoring
 * 
 * DETECTION & ANALYSIS
 * - ScAttackSurfacePanel - Attack surface visualization & management
 * - ScVulnLifecyclePanel - Vulnerability lifecycle tracking (discovery → remediation)
 * - ScThreatHuntingWorkspace - Interactive threat hunting workspace
 * - ScThreatTrendChart - Trend visualization
 * 
 * RESPONSE & SOC
 * - ScSocDashboard - SOC operations center
 * - ScSocWorkflowAutomation - Automated incident response workflows
 * - ScIncidentTimeline - Incident timeline visualization
 * - ScRemediationTracking - Remediation management
 * 
 * COMPLIANCE & RISK
 * - ScComplianceAuditTracker - Compliance audit tracking & reporting
 * - ScSecurityPostureScore - Security posture scoring & trends
 * - ScVendorRiskAssessment - Third-party risk management
 * 
 * IDENTITY & ACCESS
 * - ScIamAnalytics - IAM monitoring and analytics
 * - ScDlpPanel - Data loss prevention monitoring
 * 
 * TRAINING & POLICY
 * - ScSecurityTrainingTracker - Security training management
 * - ScSecurityPolicyManagement - Policy controls & governance
 * 
 * ASSESSMENT & CALCULATION
 * - ScPentestReportGenerator - Penetration testing reports
 * - ScSecurityRoiCalculator - ROI analysis & cost benefit
 * - ScThreatModelVisualization - Threat modeling & STRIDE
 * 
 * ASSET MANAGEMENT
 * - ScAssetInventory - Asset tracking and inventory
 * - ScNetworkSecurityMonitor - Network monitoring & IDS/IPS
 */

// Shared Components
export { ScCard } from './shared/sc-card.js';
export { ScBadge } from './shared/sc-badge.js';
export { ScTooltip } from './shared/sc-tooltip.js';
export { ScSkeleton } from './shared/sc-states.js';
export { ScErrorState } from './shared/sc-states.js';
export { ScEmptyState } from './shared/sc-states.js';
export { SeverityBadge, ProgressRing, StatusIndicator, LiveClock } from './shared/sc-chart-components.js';

/**
 * Dark Mode Color System
 * 
 * All components use CSS custom properties for consistent theming:
 * - --sc-bg-primary: Main background
 * - --sc-bg-secondary: Card/panel backgrounds
 * - --sc-text-primary: Main text
 * - --sc-text-secondary: Muted text
 * - --sc-border: Border colors
 * - --sc-primary: Primary brand color (cyan)
 * - --sc-success/warning/danger/info: Semantic colors
 * 
 * Accessibility:
 * - WCAG 2.1 AAA contrast ratios
 * - Focus visible indicators
 * - Screen reader announcements
 * - Keyboard navigation support
 * - Reduced motion support
 */

console.log('[SecuClaw] Security components loaded - 27 components available');
console.log('[SecuClaw] Theme system: Dark mode, WCAG 2.1 AAA compliant, responsive design');
console.log('[SecuClaw] Modules: Attack Surface, Vulnerability, SOC, Compliance, IAM, DLP, Training, Policy, ROI, Pentest, Threat Model');
