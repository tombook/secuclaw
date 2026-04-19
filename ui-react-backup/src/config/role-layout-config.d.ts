/**
 * SecuClaw Role Layout Configuration — React-compatible
 * Migrated from ui/src/ui/config/role-layout-config.ts
 */
import type { RoleId, LayoutType } from './role-themes';
export interface LayoutSection {
    id: string;
    type: 'raci' | 'metrics' | 'collaboration' | 'custom';
    title: string;
    order: number;
    size: 'small' | 'medium' | 'large' | 'full';
}
export interface GridConfig {
    columns: number;
    rows?: number;
    gap: number;
}
export interface TimelineConfig {
    orientation: 'horizontal' | 'vertical';
    showMilestones: boolean;
}
export interface QueueConfig {
    priorityOrdering: boolean;
    maxVisible: number;
}
export interface RoleLayoutConfig {
    roleId: RoleId;
    layoutType: LayoutType;
    sections: LayoutSection[];
    gridConfig?: GridConfig;
    timelineConfig?: TimelineConfig;
    queueConfig?: QueueConfig;
}
export declare const ROLE_LAYOUT_CONFIG: Record<RoleId, RoleLayoutConfig>;
export declare function getRoleLayoutConfig(roleId: RoleId): RoleLayoutConfig;
//# sourceMappingURL=role-layout-config.d.ts.map