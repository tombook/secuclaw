import { BaseStore } from './base-store.js';
import { gatewayClient } from '../gateway-client.js';

interface SkillDefinition {
  name: string;
  description: string;
  homepage: string;
  metadata: {
    openclaw: {
      emoji: string;
      role: string;
      combination: 'single' | 'binary' | 'ternary' | 'quaternary';
      version: string;
      capabilities: Capabilities;
      mitre_coverage: string[];
      scf_coverage: string[];
    };
  };
  content: string;
}

interface Capabilities {
  light: string[];
  dark: string[];
  security: string[];
  legal: string[];
  technology: string[];
  business: string[];
}

interface SkillState {
  skills: Record<string, SkillDefinition>;
  activeSkillId: string | null;
  loading: boolean;
  error: string | null;
}

class SkillStore extends BaseStore<SkillState> {
  constructor() {
    super({
      skills: {},
      activeSkillId: null,
      loading: false,
      error: null,
    });
  }

  async initialize(): Promise<void> {
    await this.loadSkills();
  }

  async loadSkills(): Promise<void> {
    this.setState({ loading: true, error: null });
    try {
      const skills = await gatewayClient.request<Record<string, SkillDefinition>>('skills.list');
      this.setState({ skills, loading: false });
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to load skills',
        loading: false,
      });
    }
  }

  async loadSkill(roleId: string): Promise<void> {
    try {
      const skill = await gatewayClient.request<SkillDefinition>('skills.get', { roleId });
      this.setState({
        skills: { ...this.state.skills, [roleId]: skill },
      });
    } catch (error) {
      console.error('Failed to load skill:', error);
      throw error;
    }
  }

  setActiveSkill(skillId: string | null): void {
    this.setState({ activeSkillId: skillId });
  }

  getActiveSkill(): SkillDefinition | null {
    if (!this.state.activeSkillId) return null;
    return this.state.skills[this.state.activeSkillId] || null;
  }

  getSkill(roleId: string): SkillDefinition | null {
    return this.state.skills[roleId] || null;
  }

  getAllSkills(): SkillDefinition[] {
    return Object.values(this.state.skills);
  }
}

export const skillStore = new SkillStore();
export type { SkillDefinition, Capabilities };
