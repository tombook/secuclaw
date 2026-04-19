/**
 * SecuClaw RACI Matrix — React-compatible
 * Migrated from ui/src/ui/config/raci-matrix.ts
 */
import type { RoleId } from './role-themes';
export type RaciRole = 'R' | 'A' | 'C' | 'I';
export type ScenarioType = 'incident-response' | 'vulnerability-management' | 'threat-response' | 'compliance-audit' | 'supply-chain-incident';
export interface RaciAssignment {
    role: RoleId;
    raci: RaciRole;
    tasks: string[];
}
export interface RaciScenario {
    id: ScenarioType;
    name: string;
    description: string;
    assignments: RaciAssignment[];
}
export declare const RACI_SCENARIOS: RaciScenario[];
/** Get RACI assignment for a specific role across all scenarios */
export declare function getRaciForRole(roleId: RoleId): Array<{
    scenario: ScenarioType;
    raciRole: RaciRole;
    scenarioName: string;
}>;
/** Get full scenario with assignments */
export declare function getScenario(scenarioId: ScenarioType): RaciScenario | undefined;
//# sourceMappingURL=raci-matrix.d.ts.map