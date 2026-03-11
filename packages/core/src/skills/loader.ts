import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import matter from 'gray-matter';

const logger = {
  info: (...args: any[]) => console.log('[SkillLoader]', ...args),
  error: (...args: any[]) => console.error('[SkillLoader]', ...args),
  warn: (...args: any[]) => console.warn('[SkillLoader]', ...args),
  debug: (...args: any[]) => console.log('[SkillLoader:DEBUG]', ...args),
};

interface Capabilities {
  light: string[];
  dark: string[];
  security: string[];
  legal: string[];
  technology: string[];
  business: string[];
}

interface SkillMetadata {
  openclaw: {
    emoji: string;
    role: string;
    combination: 'single' | 'binary' | 'ternary' | 'quaternary';
    version: string;
    capabilities: Capabilities;
    mitre_coverage: string[];
    scf_coverage: string[];
  };
}

interface SkillDefinition {
  name: string;
  description: string;
  homepage: string;
  metadata: SkillMetadata;
  content: string;
  roleId: string;
}

export class SkillLoader {
  private skillsPath: string;
  private skills: Map<string, SkillDefinition> = new Map();

  constructor(skillsPath: string) {
    this.skillsPath = skillsPath;
  }

  async loadAll(): Promise<void> {
    try {
      const dirs = await readdir(this.skillsPath);

      for (const dir of dirs) {
        const skillPath = join(this.skillsPath, dir, 'SKILL.md');
        try {
          const skill = await this.loadSkill(dir, skillPath);
          if (skill) {
            this.skills.set(dir, skill);
            logger.debug(`Loaded skill: ${dir}`);
          }
        } catch (error) {
          logger.warn(`Failed to load skill ${dir}:`, error);
        }
      }

      logger.info(`Loaded ${this.skills.size} skills`);
    } catch (error) {
      logger.error('Failed to load skills:', error);
      throw error;
    }
  }

  private async loadSkill(roleId: string, filePath: string): Promise<SkillDefinition | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const { data, content: body } = matter(content);

      return {
        name: data.name || roleId,
        description: data.description || '',
        homepage: data.homepage || '',
        metadata: data.metadata || { openclaw: {} },
        content: body,
        roleId,
      };
    } catch (error) {
      // File doesn't exist or parsing error
      return null;
    }
  }

  get(roleId: string): SkillDefinition | undefined {
    return this.skills.get(roleId);
  }

  getAll(): Record<string, SkillDefinition> {
    return Object.fromEntries(this.skills);
  }

  getCapabilities(roleId: string): Capabilities | null {
    const skill = this.skills.get(roleId);
    return skill?.metadata?.openclaw?.capabilities || null;
  }

  getMitreCoverage(roleId: string): string[] {
    const skill = this.skills.get(roleId);
    return skill?.metadata?.openclaw?.mitre_coverage || [];
  }

  getScfCoverage(roleId: string): string[] {
    const skill = this.skills.get(roleId);
    return skill?.metadata?.openclaw?.scf_coverage || [];
  }
}
