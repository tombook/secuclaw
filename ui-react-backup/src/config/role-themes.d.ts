/**
 * SecuClaw Role Themes — React-compatible configuration
 * Migrated from Lit version at ui/src/ui/config/role-themes.ts
 */
export type RoleId = 'security-expert' | 'privacy-officer' | 'security-architect' | 'business-security-officer' | 'secuclaw-commander' | 'ciso' | 'security-ops' | 'supply-chain-security';
export type AnimationType = 'scan' | 'pulse' | 'flow' | 'build' | 'trend' | 'tactical' | 'steady' | 'chain';
export type LayoutType = 'grid' | 'card-flow' | 'three-column' | 'timeline' | 'war-room' | 'dashboard' | 'queue' | 'graph';
export interface RoleColors {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
}
export interface RoleTheme {
    id: RoleId;
    name: string;
    nameCn: string;
    icon: string;
    colors: RoleColors;
    backgroundPattern: string;
    animation: AnimationType;
    layout: LayoutType;
    description: string;
}
export declare const ROLE_THEMES: Record<RoleId, RoleTheme>;
/** All role IDs in canonical order */
export declare const ALL_ROLE_IDS: RoleId[];
/** Get theme config for a role */
export declare function getRoleTheme(roleId: RoleId): RoleTheme;
/**
 * Apply role theme to CSS custom properties on document root.
 * This is the React equivalent of the old Lit `applyRoleTheme`.
 */
export declare function applyRoleTheme(roleId: RoleId): void;
/**
 * Reset role-specific CSS variables to defaults.
 */
export declare function clearRoleTheme(): void;
//# sourceMappingURL=role-themes.d.ts.map