export type RoleId = 'security-expert' | 'privacy-officer' | 'security-architect' | 
              'business-security-officer' | 'secuclaw-commander' | 'ciso' | 
              'security-ops' | 'supply-chain-security';

export interface ParamSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  default?: any;
}

export interface SkillDefinition {
  id: string;
  name: string;
  description: string;
  executor: string;
  params: ParamSchema[];
  resultType: string;
  requiredRoles: RoleId[];
}

class SkillRegistry {
  private skills = new Map<string, SkillDefinition>();
  private roleSkills = new Map<RoleId, Set<string>>();

  register(skill: SkillDefinition) {
    this.skills.set(skill.id, skill);
    
    for (const role of skill.requiredRoles) {
      if (!this.roleSkills.has(role)) {
        this.roleSkills.set(role, new Set());
      }
      this.roleSkills.get(role)!.add(skill.id);
    }
  }

  getSkill(skillId: string): SkillDefinition | undefined {
    return this.skills.get(skillId);
  }

  getSkillsForRole(roleId: RoleId): SkillDefinition[] {
    const skillIds = this.roleSkills.get(roleId);
    if (!skillIds) return [];
    return Array.from(skillIds)
      .map(id => this.skills.get(id))
      .filter((s): s is SkillDefinition => s !== undefined)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  getExecutorForSkill(skillId: string): string | null {
    const skill = this.skills.get(skillId);
    return skill?.executor ?? null;
  }

  canExecute(skillId: string, roleId: RoleId): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;
    return skill.requiredRoles.includes(roleId);
  }

  getParamsForSkill(skillId: string): ParamSchema[] {
    const skill = this.skills.get(skillId);
    return skill?.params ?? [];
  }

  clear() {
    this.skills.clear();
    this.roleSkills.clear();
  }

  reloadSkill(skillId: string, skill: SkillDefinition) {
    this.skills.set(skillId, skill);
    for (const role of skill.requiredRoles) {
      if (!this.roleSkills.has(role)) {
        this.roleSkills.set(role, new Set());
      }
      this.roleSkills.get(role)!.add(skillId);
    }
  }

  removeSkill(skillId: string) {
    const skill = this.skills.get(skillId);
    if (skill) {
      for (const role of skill.requiredRoles) {
        this.roleSkills.get(role)?.delete(skillId);
      }
      this.skills.delete(skillId);
    }
  }
}

export const skillRegistry = new SkillRegistry();
