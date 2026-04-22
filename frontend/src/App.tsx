import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import ThreatsPage from './pages/ThreatsPage';
import AttackSimulationPage from './pages/AttackSimulationPage';
import MitreAttackPage from './pages/MitreAttackPage';
import CompliancePage from './pages/CompliancePage';
import IncidentResponsePage from './pages/IncidentResponsePage';
import CloudSecurityPage from './pages/CloudSecurityPage';
import IdentityThreatPage from './pages/IdentityThreatPage';
import ThreatIntelPage from './pages/ThreatIntelPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';

// Import comprehensive security dashboard modules
import {
  SecurityDashboard,
  AttackSurface,
  VulnerabilityManagement,
  ComplianceAudit,
  ThreatHunting,
  KPIDashboard,
  IncidentTimeline,
  AssetInventory,
  NetworkSecurityMonitoring,
  IAMAnalytics,
  DLPPanel,
  SecurityTrainingTracker,
  VendorRiskAssessment,
  SecurityPolicyManagement,
  SOCWorkflowAutomation,
  PentestReportGenerator,
  RemediationTracking,
  SecurityROICalculator,
  ThreatModelVisualization,
} from './pages/security';

const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      
      // === Security Operations Center Modules ===
      { path: 'security-operations', element: <SecurityDashboard /> },
      { path: 'attack-surface', element: <AttackSurface /> },
      { path: 'vulnerability-management', element: <VulnerabilityManagement /> },
      { path: 'compliance-audit', element: <ComplianceAudit /> },
      
      // === Advanced Security Modules ===
      { path: 'threat-hunting', element: <ThreatHunting /> },
      { path: 'kpi-dashboard', element: <KPIDashboard /> },
      { path: 'incident-timeline', element: <IncidentTimeline /> },
      { path: 'asset-inventory', element: <AssetInventory /> },
      
      // === Security Monitoring Modules ===
      { path: 'network-monitoring', element: <NetworkSecurityMonitoring /> },
      { path: 'iam-analytics', element: <IAMAnalytics /> },
      { path: 'dlp-panel', element: <DLPPanel /> },
      
      // === Security Management Modules ===
      { path: 'security-training', element: <SecurityTrainingTracker /> },
      { path: 'vendor-risk', element: <VendorRiskAssessment /> },
      { path: 'policy-management', element: <SecurityPolicyManagement /> },
      { path: 'soc-workflows', element: <SOCWorkflowAutomation /> },
      
      // === Security Analysis & Reporting ===
      { path: 'pentest-reports', element: <PentestReportGenerator /> },
      { path: 'remediation-tracking', element: <RemediationTracking /> },
      { path: 'security-roi', element: <SecurityROICalculator /> },
      { path: 'threat-model', element: <ThreatModelVisualization /> },
      
      // === Existing pages ===
      { path: 'threats', element: <ThreatsPage /> },
      { path: 'attack-simulation', element: <AttackSimulationPage /> },
      { path: 'mitre-attack', element: <MitreAttackPage /> },
      { path: 'compliance', element: <CompliancePage /> },
      { path: 'incident-response', element: <IncidentResponsePage /> },
      { path: 'cloud-security', element: <CloudSecurityPage /> },
      { path: 'identity-threats', element: <IdentityThreatPage /> },
      { path: 'threat-intelligence', element: <ThreatIntelPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
