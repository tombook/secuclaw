/**
 * SecuClaw Evolution — SkillManager（技能编排器）
 *
 * 对标 Hermes SkillManager (tools/skill_manager_tool.py)
 *
 * 职责:
 * 1. 编排所有技能操作（CRUD + 进化）
 * 2. 工具 schema 暴露（供 LLM 调用）
 * 3. SkillScanner 集成（可选安全扫描）
 * 4. 进化历史记录
 */

import { SkillStore } from './skill-store';
import type { EvolvedSkill, CreateSkillInput, SkillResult, ScanResult, RoleId } from '../types';
import type { EvolutionConfig } from '../types';
import { logEvolution } from '../db';

export class SkillManager {
  private store: SkillStore;
  private config: EvolutionConfig['skills'];

  constructor(config: EvolutionConfig['skills']) {
    this.store = new SkillStore({ maxContentChars: config.maxContentChars, maxFileBytes: config.maxFileBytes });
    this.config = config;
  }

  // ─── 工具 schema（对标 Hermes get_tool_schema）────────────

  getToolSchemas(): Array<{ name: string; description: string; parameters: Record<string, unknown> }> {
    return [
      {
        name: 'skill_manage',
        description: 'Create, edit, patch, or delete evolved skills for the security role. Skills are stored as SKILL.md files with YAML frontmatter.',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['create', 'edit', 'patch', 'delete', 'write_file', 'remove_file'],
              description: 'The action to perform',
            },
            name: {
              type: 'string',
              description: 'Skill name (required for all actions except create)',
            },
            content: {
              type: 'string',
              description: 'Skill content (for create/edit actions). Use YAML frontmatter: --- name: SkillName description: ... ---',
            },
            old_string: {
              type: 'string',
              description: 'Old substring to replace (for patch action)',
            },
            new_string: {
              type: 'string',
              description: 'New substring (for patch action)',
            },
            file_path: {
              type: 'string',
              description: 'File path within skill (for write_file/remove_file actions)',
            },
            replace_all: {
              type: 'boolean',
              description: 'Replace all occurrences (for patch action)',
            },
          },
          required: ['action'],
        },
      },
    ];
  }

  // ─── 工具处理（对标 Hermes handle_tool_call）──────────────

  async handleToolCall(args: Record<string, unknown>): Promise<string> {
    const action = args.action as string;

    switch (action) {
      case 'create': {
        const name = (args.name as string) || '';
        const content = (args.content as string) || '';
        const role = (args.role as RoleId) || 'secuclaw-commander';
        if (!name || !content) {
          return JSON.stringify({ success: false, error: 'name and content are required for create' });
        }
        const result = await this.create({ name, content, role });
        return JSON.stringify(result);
      }
      case 'edit': {
        const name = (args.name as string) || '';
        const content = (args.content as string) || '';
        const role = (args.role as RoleId) || 'secuclaw-commander';
        if (!name || !content) {
          return JSON.stringify({ success: false, error: 'name and content are required for edit' });
        }
        const result = await this.edit(name, content, role);
        return JSON.stringify(result);
      }
      case 'patch': {
        const name = (args.name as string) || '';
        const oldString = (args.old_string as string) || '';
        const newString = (args.new_string as string) || '';
        const role = (args.role as RoleId) || 'secuclaw-commander';
        const opts = {
          filePath: args.file_path as string | undefined,
          replaceAll: args.replace_all as boolean | undefined,
        };
        if (!name || !oldString || !newString) {
          return JSON.stringify({ success: false, error: 'name, old_string, and new_string are required' });
        }
        const result = await this.patch(name, oldString, newString, role, opts);
        return JSON.stringify(result);
      }
      case 'delete': {
        const name = (args.name as string) || '';
        const role = (args.role as RoleId) || 'secuclaw-commander';
        if (!name) {
          return JSON.stringify({ success: false, error: 'name is required for delete' });
        }
        const result = await this.delete(name, role);
        return JSON.stringify(result);
      }
      case 'write_file': {
        const name = (args.name as string) || '';
        const filePath = (args.file_path as string) || '';
        const content = (args.content as string) || '';
        const role = (args.role as RoleId) || 'secuclaw-commander';
        if (!name || !filePath || !content) {
          return JSON.stringify({ success: false, error: 'name, file_path, and content are required' });
        }
        const result = await this.writeFile(name, filePath, content, role);
        return JSON.stringify(result);
      }
      case 'remove_file': {
        const name = (args.name as string) || '';
        const filePath = (args.file_path as string) || '';
        const role = (args.role as RoleId) || 'secuclaw-commander';
        if (!name || !filePath) {
          return JSON.stringify({ success: false, error: 'name and file_path are required' });
        }
        const result = await this.removeFile(name, filePath, role);
        return JSON.stringify(result);
      }
      default:
        return JSON.stringify({ success: false, error: `Unknown action: ${action}` });
    }
  }

  // ─── CRUD 操作 ───────────────────────────────────────────

  async create(input: CreateSkillInput): Promise<SkillResult> {
    const result = await this.store.create(input);

    if (result.success) {
      await logEvolution({
        type: 'skill_create',
        role: input.role,
        timestamp: Date.now(),
        details: `Created skill '${input.name}'`,
        metadata: { name: input.name, version: 1 },
      });

      // 如果开启了安全扫描，则扫描
      if (this.config.guardAgentCreated && result.skill) {
        const scanResult = this.store.scanSecurity(result.skill);
        result.skill.scanStatus = scanResult.passed ? 'passed' : 'failed';
        result.skill.lastScanAt = Date.now();
      }
    }

    return result;
  }

  async edit(name: string, content: string, role: RoleId): Promise<SkillResult> {
    const before = await this.store.find(name, role);
    const result = await this.store.edit(name, content, role);

    if (result.success && result.skill) {
      result.skill.improvementHistory.push({
        version: result.skill.version,
        change: 'edit',
        reason: `Updated from v${(before?.version ?? 0)}`,
        timestamp: Date.now(),
      });

      await logEvolution({
        type: 'skill_edit',
        role,
        timestamp: Date.now(),
        details: `Edited skill '${name}'`,
        metadata: { name, version: result.skill.version },
      });
    }

    return result;
  }

  async patch(
    name: string,
    oldString: string,
    newString: string,
    role: RoleId,
    opts?: { filePath?: string; replaceAll?: boolean }
  ): Promise<SkillResult> {
    const before = await this.store.find(name, role);
    const result = await this.store.patch(name, oldString, newString, role, opts);

    if (result.success && result.skill) {
      result.skill.improvementHistory.push({
        version: result.skill.version,
        change: 'patch',
        reason: `"${oldString}" → "${newString}"`,
        timestamp: Date.now(),
      });

      await logEvolution({
        type: 'skill_patch',
        role,
        timestamp: Date.now(),
        details: `Patched skill '${name}'`,
        metadata: { name, version: result.skill.version },
      });
    }

    return result;
  }

  async delete(name: string, role: RoleId): Promise<SkillResult> {
    const result = await this.store.delete(name, role);

    if (result.success) {
      await logEvolution({
        type: 'skill_delete',
        role,
        timestamp: Date.now(),
        details: `Deleted skill '${name}'`,
        metadata: { name },
      });
    }

    return result;
  }

  async writeFile(name: string, filePath: string, content: string, role: RoleId): Promise<SkillResult> {
    return this.store.writeFile(name, filePath, content, role);
  }

  async removeFile(name: string, filePath: string, role: RoleId): Promise<SkillResult> {
    return this.store.removeFile(name, filePath, role);
  }

  // ─── 查询 ───────────────────────────────────────────────

  async find(name: string, role: RoleId): Promise<EvolvedSkill | null> {
    return this.store.find(name, role);
  }

  async getForRole(role: RoleId): Promise<EvolvedSkill[]> {
    return this.store.getForRole(role);
  }

  async search(query: string, role?: RoleId): Promise<EvolvedSkill[]> {
    return this.store.search(query, role);
  }

  // ─── 统计 ───────────────────────────────────────────────

  async getStats(): Promise<{
    total: number;
    byRole: Partial<Record<RoleId, number>>;
    bySource: Record<string, number>;
  }> {
    const db = (await import('../db')).getEvolutionDB();
    const allSkills = await db.getAll<EvolvedSkill>('skills');

    const byRole: Partial<Record<RoleId, number>> = {};
    const bySource: Record<string, number> = {};

    for (const skill of allSkills) {
      byRole[skill.role] = (byRole[skill.role] ?? 0) + 1;
      bySource[skill.source] = (bySource[skill.source] ?? 0) + 1;
    }

    return { total: allSkills.length, byRole, bySource };
  }

  // ─── 工具调用（供 BackgroundReviewer 使用）───────────────

  getStore(): SkillStore {
    return this.store;
  }
}
