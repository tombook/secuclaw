/**
 * SecuClaw Role Dashboard Configuration — React-compatible
 * Migrated from ui/src/ui/config/role-dashboard-config.ts
 */
import type { RoleId } from './role-themes';
export interface KpiCard {
    id: string;
    label: string;
    metricKey: string;
    format: 'number' | 'percentage' | 'trend';
}
export interface ChartConfig {
    type: 'vulnerability-trend' | 'compliance-status' | 'incident-timeline' | 'risk-distribution' | 'asset-coverage' | 'threat-landscape' | 'supply-chain-risk' | 'security-score';
    dataKey: string;
}
export interface AlertFilter {
    category: string[];
    severity?: string[];
    status?: string[];
}
export interface RaciTaskSummary {
    showRSummary: boolean;
    showASummary: boolean;
    showISummary: boolean;
    label: string;
}
export interface RoleDashboardConfig {
    primaryKpis: KpiCard[];
    secondaryKpis: KpiCard[];
    mainChart: ChartConfig;
    alertFilters: AlertFilter;
    quickActions: string[];
    raciTaskSummary: RaciTaskSummary;
}
export declare const ROLE_DASHBOARD_CONFIG: Record<RoleId, RoleDashboardConfig>;
export declare function getRoleDashboardConfig(roleId: RoleId): RoleDashboardConfig;
//# sourceMappingURL=role-dashboard-config.d.ts.map