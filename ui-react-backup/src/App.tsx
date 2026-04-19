import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/pages/Dashboard';
import { LoginPage } from '@/pages/LoginPage';
import { IncidentsPage } from '@/pages/IncidentsPage';
import { VulnerabilitiesPage } from '@/pages/VulnerabilitiesPage';
import { ThreatsPage } from '@/pages/ThreatsPage';
import { CompliancePage } from '@/pages/CompliancePage';
import { WarRoomPage } from '@/pages/WarRoomPage';
import { AIExpertsPage } from '@/pages/AIExpertsPage';
import { KnowledgeBasePage } from '@/pages/KnowledgeBasePage';
import { SkillsMarketPage } from '@/pages/SkillsMarketPage';
import { ChannelsPage } from '@/pages/ChannelsPage';
import { SettingsPage } from '@/pages/SettingsPage';

/**
 * Root Application Component
 *
 * Route structure:
 *   /login       → LoginPage (standalone, no layout)
 *   /            → Dashboard (via AppLayout)
 *   /incidents   → IncidentsPage
 *   /vulnerabilities → VulnerabilitiesPage
 *   /threats     → ThreatsPage
 *   /compliance  → CompliancePage
 *   /*           → Placeholder pages (war-room, risk, reports, etc.)
 */
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Standalone login (no sidebar/header) */}
        <Route path="/login" element={<LoginPage />} />

        {/* Main app routes with layout */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="vulnerabilities" element={<VulnerabilitiesPage />} />
          <Route path="threats" element={<ThreatsPage />} />
          <Route path="compliance" element={<CompliancePage />} />
          {/* Phase 4B pages */}
          <Route path="war-room" element={<WarRoomPage />} />
          <Route path="ai-experts" element={<AIExpertsPage />} />
          <Route path="knowledge" element={<KnowledgeBasePage />} />
          <Route path="skills-market" element={<SkillsMarketPage />} />
          <Route path="channels" element={<ChannelsPage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Remaining placeholder routes */}
          <Route path="risk" element={<PlaceholderPage title="安全风险 Risk" />} />
          <Route path="reports" element={<PlaceholderPage title="分析报告 Reports" />} />
          <Route path="commander" element={<PlaceholderPage title="角色指挥台 Commander" />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<PlaceholderPage title="404 — 页面不存在" />} />
      </Routes>
    </BrowserRouter>
  );
}

/**
 * Temporary placeholder — will be replaced by real page components during migration.
 */
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center space-y-4">
        <div className="text-4xl">🛡️</div>
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        <p className="text-white/40 text-sm">
          SecuClaw Security Commander — 页面建设中
        </p>
        <div className="inline-flex items-center gap-2 rounded-md bg-white/[0.04] border border-white/[0.06] px-4 py-2 text-xs text-white/40">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          System Operational
        </div>
      </div>
    </div>
  );
}

export default App;
