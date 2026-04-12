import { BaseStore } from './base-store.js';
import { skillStore } from './skill-store.js';
import type { SkillDefinition } from './skill-store.js';
import { hasAnyPermission, hasAllPermissions, getRolePermissions } from '../../../../packages/core/src/roles/permissions.js';
import { RACI_SCENARIOS, type RaciRole, type ScenarioType } from '../config/raci-matrix.js';
import { ROLE_THEMES, applyRoleTheme } from '../config/role-themes.js';

type RoleId = 'security-expert' | 'privacy-officer' | 'security-architect' | 
              'business-security-officer' | 'secuclaw-commander' | 'ciso' | 
              'security-ops' | 'supply-chain-security';

export interface RoleProfile {
  roleId: RoleId;
  displayName: string;
  emoji: string;
  description: string;
  capabilities: {
    light: string[];
    dark: string[];
    security: string[];
    legal: string[];
    technology: string[];
    business: string[];
  };
  mitreCoverage: string[];
  scfCoverage: string[];
}

export interface RoleContextState {
  currentRole: RoleId | null;
  roleProfile: RoleProfile | null;
  loading: boolean;
  recentExecutions: { skillId: string; timestamp: Date }[];
  recentRoles: RoleId[];
  warRoomSessionId: string | null;
  currentScenarioType: ScenarioType | null;
  currentRaciAssignment: RaciRole | null;
  isCommanderMode: boolean;
  currentScenario: string | null;
}

class RoleContextStore extends BaseStore<RoleContextState> {
  constructor() {
    const savedRole = localStorage.getItem('secuclaw-current-role') as RoleId | null;
    const savedRecentRoles = RoleContextStore.loadRecentRolesFromStorage();
    super({
      currentRole: savedRole,
      roleProfile: null,
      loading: false,
      recentExecutions: [],
      recentRoles: savedRecentRoles,
      warRoomSessionId: null,
      currentScenarioType: null,
      currentRaciAssignment: null,
      isCommanderMode: false,
      currentScenario: null,
    });
  }

  private static loadRecentRolesFromStorage(): RoleId[] {
    try {
      const stored = localStorage.getItem('secuclaw-recent-roles');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private static saveRecentRolesToStorage(roles: RoleId[]) {
    localStorage.setItem('secuclaw-recent-roles', JSON.stringify(roles));
  }

  can(required: string | string[]): boolean {
    const roleId = this.state.currentRole;
    if (!roleId) return false;
    const permissions = getRolePermissions(roleId);
    const requiredList = Array.isArray(required) ? required : [required];
    return hasAnyPermission(permissions, requiredList);
  }

  canRead(resource: string): boolean {
    return this.can(`${resource}.read`);
  }

  canWrite(resource: string): boolean {
    return this.can(`${resource}.write`);
  }

  canDelete(resource: string): boolean {
    return this.can(`${resource}.delete`);
  }

  async initialize(): Promise<void> {
    if (this.state.currentRole) {
      await this.setRole(this.state.currentRole);
    }
  }

  async setRole(roleId: RoleId): Promise<void> {
    this.setState({ loading: true });
    
    try {
      let skill = skillStore.getSkill(roleId);
      if (!skill) {
        await skillStore.loadSkill(roleId);
        skill = skillStore.getSkill(roleId);
      }

      if (!skill) {
        throw new Error(`Skill not found for role: ${roleId}`);
      }

      const roleProfile = this.buildRoleProfile(roleId, skill);
      
      const recentRoles = this.addToRecentRoles(roleId);
      
      this.setState({
        currentRole: roleId,
        roleProfile,
        loading: false,
        recentRoles,
      });

      localStorage.setItem('secuclaw-current-role', roleId);
      
      applyRoleTheme(roleId);
    } catch (error) {
      this.setState({ loading: false });
      throw error;
    }
  }

  private addToRecentRoles(roleId: RoleId): RoleId[] {
    const recent = this.state.recentRoles.filter(r => r !== roleId);
    recent.unshift(roleId);
    const limited = recent.slice(0, 3);
    RoleContextStore.saveRecentRolesToStorage(limited);
    return limited;
  }

  private buildRoleProfile(roleId: RoleId, skill: SkillDefinition): RoleProfile {
    const metadata = skill.metadata.openclaw;
    return {
      roleId,
      displayName: skill.name,
      emoji: metadata.emoji,
      description: metadata.description || `${skill.name} - Security Role`,
      capabilities: metadata.capabilities,
      mitreCoverage: metadata.mitre_coverage,
      scfCoverage: metadata.scf_coverage,
    };
  }

  clearRole(): void {
    this.setState({
      currentRole: null,
      roleProfile: null,
      isCommanderMode: false,
      currentScenario: null,
    });
    localStorage.removeItem('secuclaw-current-role');
  }

  getRoleProfile(roleId: RoleId): RoleProfile | null {
    if (this.state.currentRole === roleId) {
      return this.state.roleProfile;
    }
    const skill = skillStore.getSkill(roleId);
    if (!skill) return null;
    return this.buildRoleProfile(roleId, skill);
  }

  getAllRoleIds(): RoleId[] {
    return [
      'security-expert',
      'privacy-officer',
      'security-architect',
      'business-security-officer',
      'secuclaw-commander',
      'ciso',
      'security-ops',
      'supply-chain-security',
    ];
  }

  getSkillsForCurrentRole(): SkillDefinition[] {
    const currentRole = this.state.currentRole;
    if (!currentRole) return [];
    return skillStore.getAllSkills().filter(skill => {
      const roles = skill.metadata.openclaw.role;
      return roles === currentRole;
    });
  }

  addExecutionToHistory(skillId: string) {
    const recent = this.state.recentExecutions;
    recent.unshift({ skillId, timestamp: new Date() });
    if (recent.length > 10) {
      recent.pop();
    }
    this.setState({ recentExecutions: recent });
  }

  getExecutionHistory(): { skillId: string; timestamp: Date }[] {
    return this.state.recentExecutions;
  }

  getRaciAssignments(): { scenarios: Array<{ scenario: ScenarioType; raciRole: RaciRole }> } {
    const currentRoleId = this.state.currentRole;
    if (!currentRoleId) {
      return { scenarios: [] };
    }

    const assignments: Array<{ scenario: ScenarioType; raciRole: RaciRole }> = [];
    
    for (const scenario of RACI_SCENARIOS) {
      const assignment = scenario.assignments.find(a => a.role === currentRoleId);
      if (assignment) {
        assignments.push({
          scenario: scenario.id,
          raciRole: assignment.raci,
        });
      }
    }

    return { scenarios: assignments };
  }

  getTheme(): { primary: string; secondary: string } | null {
    const currentRoleId = this.state.currentRole;
    if (!currentRoleId) {
      return null;
    }

    const theme = ROLE_THEMES[currentRoleId];
    if (theme) {
      return {
        primary: theme.colors.primary,
        secondary: theme.colors.secondary,
      };
    }

    return null;
  }

  setWarRoomSession(sessionId: string, scenarioType: ScenarioType, raciAssignment: RaciRole): void {
    this.setState({
      warRoomSessionId: sessionId,
      currentScenarioType: scenarioType,
      currentRaciAssignment: raciAssignment,
    });
  }

  clearWarRoomSession(): void {
    this.setState({
      warRoomSessionId: null,
      currentScenarioType: null,
      currentRaciAssignment: null,
    });
  }

  setScenario(scenario: string | null): void {
    this.setState({
      currentScenario: scenario,
      isCommanderMode: scenario !== null,
    });
  }

  resetToOverview(): void {
    this.setState({
      currentScenario: null,
      isCommanderMode: false,
    });
  }

  get isCommanderMode(): boolean {
    return this.state.isCommanderMode;
  }

  get currentScenario(): string | null {
    return this.state.currentScenario;
  }
}

export const roleContext = new RoleContextStore();
export type { RoleId };
export type { RaciRole, ScenarioType } from '../config/raci-matrix.js';
