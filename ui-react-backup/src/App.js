import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsx(BrowserRouter, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(LoginPage, {}) }), _jsxs(Route, { path: "/", element: _jsx(AppLayout, {}), children: [_jsx(Route, { index: true, element: _jsx(Dashboard, {}) }), _jsx(Route, { path: "incidents", element: _jsx(IncidentsPage, {}) }), _jsx(Route, { path: "vulnerabilities", element: _jsx(VulnerabilitiesPage, {}) }), _jsx(Route, { path: "threats", element: _jsx(ThreatsPage, {}) }), _jsx(Route, { path: "compliance", element: _jsx(CompliancePage, {}) }), _jsx(Route, { path: "war-room", element: _jsx(WarRoomPage, {}) }), _jsx(Route, { path: "ai-experts", element: _jsx(AIExpertsPage, {}) }), _jsx(Route, { path: "knowledge", element: _jsx(KnowledgeBasePage, {}) }), _jsx(Route, { path: "skills-market", element: _jsx(SkillsMarketPage, {}) }), _jsx(Route, { path: "channels", element: _jsx(ChannelsPage, {}) }), _jsx(Route, { path: "settings", element: _jsx(SettingsPage, {}) }), _jsx(Route, { path: "risk", element: _jsx(PlaceholderPage, { title: "\u5B89\u5168\u98CE\u9669 Risk" }) }), _jsx(Route, { path: "reports", element: _jsx(PlaceholderPage, { title: "\u5206\u6790\u62A5\u544A Reports" }) }), _jsx(Route, { path: "commander", element: _jsx(PlaceholderPage, { title: "\u89D2\u8272\u6307\u6325\u53F0 Commander" }) })] }), _jsx(Route, { path: "*", element: _jsx(PlaceholderPage, { title: "404 \u2014 \u9875\u9762\u4E0D\u5B58\u5728" }) })] }) }));
}
/**
 * Temporary placeholder — will be replaced by real page components during migration.
 */
function PlaceholderPage({ title }) {
    return (_jsx("div", { className: "flex h-full items-center justify-center", children: _jsxs("div", { className: "text-center space-y-4", children: [_jsx("div", { className: "text-4xl", children: "\uD83D\uDEE1\uFE0F" }), _jsx("h1", { className: "text-2xl font-bold tracking-tight text-white", children: title }), _jsx("p", { className: "text-white/40 text-sm", children: "SecuClaw Security Commander \u2014 \u9875\u9762\u5EFA\u8BBE\u4E2D" }), _jsxs("div", { className: "inline-flex items-center gap-2 rounded-md bg-white/[0.04] border border-white/[0.06] px-4 py-2 text-xs text-white/40", children: [_jsx("span", { className: "h-2 w-2 rounded-full bg-green-500 animate-pulse" }), "System Operational"] })] }) }));
}
export default App;
//# sourceMappingURL=App.js.map