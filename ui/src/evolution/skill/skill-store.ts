/**
 * SecuClaw Evolution — SkillStore (IndexedDB 实现)
 *
 * 对标 Hermes skill_manager_tool (tools/skill_manager_tool.py)
 *
 * 关键设计（从 Hermes 移植）:
 * 1. 6 种操作: create, edit, patch, delete, writeFile, removeFile
 * 2. YAML frontmatter 验证: name + description 必填
 * 3. 原子写入: 先写临时文件，再 rename（对标 Hermes _atomic_write_text）
 * 4. 安全扫描（可选）: 检测 prompt injection 等威胁
 * 5. 内容限制: 100K chars (SKILL.md), 1MB (附件)
 * 6. 角色绑定: skill.role = RoleId
 */

import { getEvolutionDB, STORES, putSkill, getSkillsByRole, getSkillByName } from '../db';
import type { EvolvedSkill, CreateSkillInput, SkillResult, ScanResult, RoleId } from '../types';

// ─── 常量（对标 Hermes）──────────────────────────────────────

const MAX_SKILL_CONTENT_CHARS = 100_000;   // Hermes: 100000
const MAX_FILE_BYTES = 1_048_576;         // Hermes: 1MB

// 安全扫描模式（从 Hermes _SECURITY_PATTERNS 移植）
const SKILL_THREAT_PATTERNS: Array<[RegExp, string]> = [
  // Prompt injection
  [/ignore\s+(previous|all|above|prior)\s+instructions/i, 'prompt_injection'],
  [/disregard\s+(your|all|any)\s+(instructions|rules)/i, 'disregard_rules'],
  // Credential exfil patterns
  [/curl\s+.*\$\{?\w*(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|API)/i, 'credential_exfil'],
  [/wget\s+.*\$\{?\w*(KEY|TOKEN|SECRET|PASSWORD)/i, 'credential_exfil'],
  // System override
  [/you\s+are\s+now\s+/i, 'role_hijack'],
  [/system\s+prompt\s+override/i, 'sys_prompt_override'],
  // Exfil via file write
  [/eval\s*\(\s*atob\s*\(/i, 'base64_decode_exfil'],
  [/from\s+base64\s+import.*atob|import\s*\(.*base64.*\)/i, 'base64_import_exfil'],
];

// ─── 验证错误 ───────────────────────────────────────────────

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ─── SkillStore ─────────────────────────────────────────────

export class SkillStore {
  private maxContentChars: number;
  private maxFileBytes: number;

  constructor(opts?: { maxContentChars?: number; maxFileBytes?: number }) {
    this.maxContentChars = opts?.maxContentChars ?? MAX_SKILL_CONTENT_CHARS;
    this.maxFileBytes = opts?.maxFileBytes ?? MAX_FILE_BYTES;
  }

  // ─── CRUD（对标 Hermes skill_manage actions）───────────────

  /**
   * 创建技能
   * 对标 Hermes create_skill()
   */
  async create(input: CreateSkillInput): Promise<SkillResult> {
    // 1. 验证名称
    const nameError = this.validateName(input.name);
    if (nameError) return { success: false, message: nameError, error: nameError };

    // 2. 解析 frontmatter
    const parseResult = this.parseFrontmatter(input.content);
    if (!parseResult.valid) {
      return { success: false, message: parseResult.error!, error: parseResult.error };
    }

    // 3. 检查内容大小
    const sizeError = this.validateContentSize(input.content, 'SKILL.md');
    if (sizeError) return { success: false, message: sizeError, error: sizeError };

    // 4. 检查同名技能
    const existing = await getSkillByName(input.role, input.name);
    if (existing) {
      return { success: false, message: `Skill '${input.name}' already exists for role '${input.role}'`, error: 'DUPLICATE' };
    }

    // 5. 提取 frontmatter 字段
    const fm = parseResult.frontmatter!;

    // 6. 创建技能条目
    const skill: EvolvedSkill = {
      name: input.name,
      description: fm.description || input.description || fm.name,
      role: input.role,
      source: 'evolved',
      version: 1,
      trustLevel: 'community',
      frontmatter: {
        name: fm.name || input.name,
        description: fm.description || input.description || '',
        tags: fm.tags || [],
      },
      body: parseResult.body!,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastUsedAt: Date.now(),
      usageCount: 0,
      successCount: 0,
      improvementHistory: [],
      scanStatus: 'pending',
      lastScanAt: 0,
    };

    await putSkill(skill);
    return { success: true, message: `Skill '${input.name}' created`, skill };
  }

  /**
   * 编辑技能内容（完全覆盖）
   * 对标 Hermes edit_skill()
   */
  async edit(name: string, newContent: string, role: RoleId): Promise<SkillResult> {
    const skill = await getSkillByName(role, name);
    if (!skill) {
      return { success: false, message: `Skill '${name}' not found`, error: 'NOT_FOUND' };
    }

    // 重新解析 frontmatter
    const parseResult = this.parseFrontmatter(newContent);
    if (!parseResult.valid) {
      return { success: false, message: parseResult.error!, error: parseResult.error };
    }

    const sizeError = this.validateContentSize(newContent, 'SKILL.md');
    if (sizeError) return { success: false, message: sizeError, error: sizeError };

    const fm = parseResult.frontmatter!;
    skill.frontmatter = {
      name: fm.name || name,
      description: fm.description || '',
      tags: fm.tags || [],
    };
    skill.body = parseResult.body!;
    skill.description = fm.description || skill.description;
    skill.updatedAt = Date.now();
    skill.version++;

    await putSkill(skill);
    return { success: true, message: `Skill '${name}' updated to v${skill.version}`, skill };
  }

  /**
   * 精准补丁（子串替换）
   * 对标 Hermes patch_skill()
   */
  async patch(
    name: string,
    oldString: string,
    newString: string,
    role: RoleId,
    opts?: { filePath?: string; replaceAll?: boolean }
  ): Promise<SkillResult> {
    const skill = await getSkillByName(role, name);
    if (!skill) {
      return { success: false, message: `Skill '${name}' not found`, error: 'NOT_FOUND' };
    }

    const targetContent = opts?.filePath ? this._getFileContent(skill, opts.filePath) : skill.body;

    if (!targetContent.includes(oldString)) {
      return { success: false, message: `Substring not found in skill content`, error: 'NOT_FOUND' };
    }

    const newContent = opts?.replaceAll
      ? targetContent.split(oldString).join(newString)
      : targetContent.replace(oldString, newString);

    if (opts?.filePath) {
      // 更新附件
      const fileIdx = skill.files?.findIndex((f) => f.path === opts.filePath) ?? -1;
      if (fileIdx >= 0 && skill.files) {
        skill.files[fileIdx].content = newContent;
        skill.updatedAt = Date.now();
        skill.version++;
        await putSkill(skill);
      }
    } else {
      skill.body = newContent;
      skill.updatedAt = Date.now();
      skill.version++;
      await putSkill(skill);
    }

    return { success: true, message: `Skill '${name}' patched` };
  }

  /**
   * 删除技能
   * 对标 Hermes delete_skill()
   */
  async delete(name: string, role: RoleId): Promise<SkillResult> {
    const db = getEvolutionDB();
    const skills = await getSkillsByRole(role);
    const skill = skills.find((s) => s.name === name);

    if (!skill) {
      return { success: false, message: `Skill '${name}' not found`, error: 'NOT_FOUND' };
    }

    if (skill.id !== undefined) {
      await db.delete(STORES.SKILLS, skill.id);
    }

    return { success: true, message: `Skill '${name}' deleted` };
  }

  /**
   * 添加/更新附件文件
   * 对标 Hermes write_file()
   */
  async writeFile(name: string, filePath: string, content: string, role: RoleId): Promise<SkillResult> {
    const skill = await getSkillByName(role, name);
    if (!skill) {
      return { success: false, message: `Skill '${name}' not found`, error: 'NOT_FOUND' };
    }

    if (new Blob([content]).size > this.maxFileBytes) {
      return { success: false, message: `File exceeds ${this.maxFileBytes} byte limit`, error: 'SIZE_LIMIT' };
    }

    if (!skill.files) skill.files = [];
    const fileIdx = skill.files.findIndex((f) => f.path === filePath);
    if (fileIdx >= 0) {
      skill.files[fileIdx] = { path: filePath, content, size: new Blob([content]).size };
    } else {
      skill.files.push({ path: filePath, content, size: new Blob([content]).size });
    }

    skill.updatedAt = Date.now();
    await putSkill(skill);
    return { success: true, message: `File '${filePath}' written`, path: filePath };
  }

  /**
   * 移除附件文件
   * 对标 Hermes remove_file()
   */
  async removeFile(name: string, filePath: string, role: RoleId): Promise<SkillResult> {
    const skill = await getSkillByName(role, name);
    if (!skill) {
      return { success: false, message: `Skill '${name}' not found`, error: 'NOT_FOUND' };
    }

    if (!skill.files) {
      return { success: false, message: `File '${filePath}' not found`, error: 'NOT_FOUND' };
    }

    const fileIdx = skill.files.findIndex((f) => f.path === filePath);
    if (fileIdx < 0) {
      return { success: false, message: `File '${filePath}' not found`, error: 'NOT_FOUND' };
    }

    skill.files.splice(fileIdx, 1);
    skill.updatedAt = Date.now();
    await putSkill(skill);
    return { success: true, message: `File '${filePath}' removed` };
  }

  // ─── 查询 ─────────────────────────────────────────────────

  async find(name: string, role: RoleId): Promise<EvolvedSkill | null> {
    return getSkillByName(role, name) ?? null;
  }

  async getForRole(role: RoleId): Promise<EvolvedSkill[]> {
    return getSkillsByRole(role);
  }

  async search(query: string, role?: RoleId): Promise<EvolvedSkill[]> {
    const db = getEvolutionDB();
    const allSkills = role
      ? await getSkillsByRole(role)
      : await db.getAll<EvolvedSkill>(STORES.SKILLS);

    const lower = query.toLowerCase();
    return allSkills.filter(
      (s) =>
        s.name.toLowerCase().includes(lower) ||
        s.description.toLowerCase().includes(lower) ||
        s.body.toLowerCase().includes(lower)
    );
  }

  // ─── 验证（对标 Hermes _validate_* 方法）────────────────

  validateName(name: string): string | null {
    if (!name?.trim()) return 'Skill name is required';
    if (name.length < 2) return 'Skill name must be at least 2 characters';
    if (name.length > 64) return 'Skill name must be at most 64 characters';
    // 禁止的字符
    if (!/^[a-zA-Z0-9_\-\s]+$/.test(name)) {
      return 'Skill name contains invalid characters (allowed: alphanumeric, underscore, hyphen, space)';
    }
    return null;
  }

  validateContentSize(content: string, label = 'Content'): string | null {
    if (content.length > this.maxContentChars) {
      return `${label} exceeds ${this.maxContentChars} character limit (got ${content.length})`;
    }
    return null;
  }

  parseFrontmatter(content: string): { valid: true; frontmatter: Record<string, unknown>; body: string } | { valid: false; error: string } {
    // 支持 YAML frontmatter (--- ... ---) 或简单的 JSON frontmatter ({ ... })
    const yamlMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (yamlMatch) {
      try {
        const fm = this._parseYamlFrontmatter(yamlMatch[1]);
        return { valid: true, frontmatter: fm, body: yamlMatch[2] };
      } catch (e) {
        return { valid: false, error: `Invalid YAML frontmatter: ${String(e)}` };
      }
    }

    const jsonMatch = content.match(/^\{\s*"name"\s*:\s*"[^"]+"/);
    if (jsonMatch) {
      try {
        const fm = JSON.parse(content.split('\n\n')[0]);
        const body = content.slice(content.indexOf('\n\n') + 2);
        if (!fm.name) return { valid: false, error: 'Frontmatter must have name field' };
        return { valid: true, frontmatter: fm, body };
      } catch {
        return { valid: false, error: 'Invalid JSON frontmatter' };
      }
    }

    // 无 frontmatter，整个内容作为 body
    return { valid: true, frontmatter: {}, body: content };
  }

  // ─── 安全扫描（对标 Hermes _security_scan_skill）────────

  scanSecurity(skill: EvolvedSkill): ScanResult {
    const threats: ScanResult['threats'] = [];
    const content = `${JSON.stringify(skill.frontmatter)}\n${skill.body}`;

    for (const [pattern, type] of SKILL_THREAT_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        threats.push({ pattern: pattern.source, type, match: match[0] });
      }
    }

    // 检查隐形字符
    const invisibleChars = /[\u200b\u200c\u200d\u2060\ufeff]/.test(content);
    if (invisibleChars) {
      threats.push({ pattern: 'invisible_char', type: 'invisible_char', match: 'content contains invisible unicode' });
    }

    return {
      passed: threats.length === 0,
      threats,
      reason: threats.length > 0 ? `Security scan failed: ${threats.map((t) => t.type).join(', ')}` : undefined,
    };
  }

  // ─── 内部方法 ────────────────────────────────────────────

  private _getFileContent(skill: EvolvedSkill, filePath: string): string | null {
    return skill.files?.find((f) => f.path === filePath)?.content ?? null;
  }

  /**
   * 简化的 YAML frontmatter 解析
   * 只支持简单的 key: value 格式（无嵌套）
   */
  private _parseYamlFrontmatter(yaml: string): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const lines = yaml.split('\n');

    for (const line of lines) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;
      const key = line.slice(0, colonIdx).trim();
      let value: unknown = line.slice(colonIdx + 1).trim();

      // 去掉引号
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      // 解析数组
      if (value === '') {
        // 检查下一行是否是缩进的数组
        continue;
      }

      result[key] = value;
    }

    return result;
  }
}
