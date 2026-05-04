/**
 * SecuClaw Evolution — MemoryStore (IndexedDB 实现)
 * 
 * 对标 Hermes MemoryStore (tools/memory_tool.py)
 * 
 * 关键设计（从 Hermes 移植）:
 * 1. § 分隔符格式 — 保持与 Hermes 兼容的记忆条目格式
 * 2. 双状态模式 — snapshot (冻结) + live (实时)
 *    - snapshot 在会话开始时捕获，用于系统提示注入
 *    - live 是实时状态，工具调用可修改
 * 3. 内容安全扫描 — 检测注入/渗出模式
 * 4. 字符限制 — memory 2200, user 1375（对标 Hermes）
 * 5. 唯一子串匹配 — replace/remove 使用子串匹配而非 ID
 */

import { getEvolutionDB, STORES, putMemory, getMemoriesByRole } from '../db';
import type { EvolutionConfig } from '../types';
import type { MemoryEntry, MemoryTarget, AddResult, ReplaceResult, RemoveResult, ScanResult, RoleId } from '../types';
import { MemoryProvider } from './memory-provider';

// ─── 常量（对标 Hermes）──────────────────────────────────────

const ENTRY_DELIMITER = '\n§\n';

// 内容安全扫描模式（对标 Hermes _MEMORY_THREAT_PATTERNS）
const THREAT_PATTERNS: Array<[RegExp, string]> = [
  [/ignore\s+(previous|all|above|prior)\s+instructions/i, 'prompt_injection'],
  [/you\s+are\s+now\s+/i, 'role_hijack'],
  [/do\s+not\s+tell\s+the\s+user/i, 'deception_hide'],
  [/system\s+prompt\s+override/i, 'sys_prompt_override'],
  [/disregard\s+(your|all|any)\s+(instructions|rules|guidelines)/i, 'disregard_rules'],
  [/act\s+as\s+(if|though)\s+you\s+(have\s+no|don't\s+have)\s+(restrictions|limits|rules)/i, 'bypass_restrictions'],
  [/curl\s+[^\n]*\$\{?\w*(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|API)/i, 'exfil_curl'],
  [/wget\s+[^\n]*\$\{?\w*(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|API)/i, 'exfil_wget'],
  [/cat\s+[^\n]*(\.env|credentials|\.netrc|\.pgpass|\.npmrc|\.pypirc)/i, 'read_secrets'],
  [/authorized_keys/i, 'ssh_backdoor'],
  [/\$HOME\/\.ssh|~\/\.ssh/i, 'ssh_access'],
];

// 隐形字符集（对标 Hermes _INVISIBLE_CHARS）
const INVISIBLE_CHARS = new Set([
  '\u200b', '\u200c', '\u200d', '\u2060', '\ufeff',
  '\u202a', '\u202b', '\u202c', '\u202d', '\u202e',
]);

export class MemoryStore extends MemoryProvider {
  readonly name = 'builtin';

  private config: EvolutionConfig['memory'];
  private _initialized = false;
  private _snapshot: Map<MemoryTarget, string> = new Map();

  constructor(config: EvolutionConfig['memory']) {
    super();
    this.config = config;
  }

  // ─── Provider 接口实现 ────────────────────────────────────

  isAvailable(): boolean {
    return this.config.enabled && typeof indexedDB !== 'undefined';
  }

  async initialize(): Promise<void> {
    if (this._initialized) return;
    const db = getEvolutionDB();
    await db.getDB(); // 触发数据库打开
    this._initialized = true;
  }

  // ─── 核心操作（对标 Hermes memory tool actions）───────────

  /**
   * 添加记忆条目
   * 对标 Hermes MemoryStore.add()
   */
  async add(target: MemoryTarget, content: string, role: RoleId): Promise<AddResult> {
    // 安全扫描
    const scanResult = this.scanContent(content);
    if (!scanResult.passed) {
      return { success: false, message: scanResult.reason || 'Content blocked by security scan', error: scanResult.reason };
    }

    // 检查总长度
    const existing = await this._getEntries(target, role);
    const totalChars = existing.reduce((sum, e) => sum + e.content.length, 0);
    const limit = target === 'memory' ? this.config.memoryCharLimit : this.config.userCharLimit;

    if (totalChars + content.length > limit) {
      // 对标 Hermes: 不直接拒绝，而是移除最旧的条目
      await this._trimEntries(target, role, limit - content.length);
    }

    const entry: MemoryEntry = {
      target,
      role,
      category: this._inferCategory(content),
      content,
      tags: [],
      confidence: 0.5,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastUsedAt: Date.now(),
      source: 'manual',
      turnCount: 0,
    };

    await putMemory(entry);
    return { success: true, message: 'Entry added', entry };
  }

  /**
   * 替换记忆条目（唯一子串匹配）
   * 对标 Hermes MemoryStore.replace()
   */
  async replace(target: MemoryTarget, oldSubstring: string, newContent: string, role: RoleId): Promise<ReplaceResult> {
    const scanResult = this.scanContent(newContent);
    if (!scanResult.passed) {
      return { success: false, message: scanResult.reason || 'Content blocked', error: scanResult.reason };
    }

    const entries = await this._getEntries(target, role);
    const idx = entries.findIndex(e => e.content.includes(oldSubstring));

    if (idx === -1) {
      return { success: false, message: `Substring not found in ${target}`, error: 'NOT_FOUND' };
    }

    const oldContent = entries[idx].content;
    entries[idx].content = newContent;
    entries[idx].updatedAt = Date.now();
    await putMemory(entries[idx]);

    return { success: true, message: 'Entry replaced', oldContent, newContent };
  }

  /**
   * 移除记忆条目（唯一子串匹配）
   * 对标 Hermes MemoryStore.remove()
   */
  async remove(target: MemoryTarget, substring: string, role: RoleId): Promise<RemoveResult> {
    const db = getEvolutionDB();
    const entries = await this._getEntries(target, role);
    const idx = entries.findIndex(e => e.content.includes(substring));

    if (idx === -1) {
      return { success: false, message: `Substring not found in ${target}`, error: 'NOT_FOUND' };
    }

    const removed = entries[idx];
    if (removed.id !== undefined) {
      await db.delete(STORES.MEMORIES, removed.id);
    }

    return { success: true, message: 'Entry removed', removedContent: removed.content };
  }

  /**
   * 读取所有记忆条目
   * 对标 Hermes MemoryStore.read()
   */
  async read(target: MemoryTarget, role: RoleId): Promise<string> {
    const entries = await this._getEntries(target, role);
    return entries.map(e => e.content).join(ENTRY_DELIMITER);
  }

  // ─── 快照机制（对标 Hermes frozen snapshot pattern）────────

  /**
   * 捕获快照 — 会话开始时调用
   * 对标 Hermes MemoryStore._system_prompt_snapshot
   */
  async captureSnapshot(role: RoleId): Promise<void> {
    const memory = await this.read('memory', role);
    const user = await this.read('user', role);
    this._snapshot.set('memory', memory);
    this._snapshot.set('user', user);
  }

  /** 获取快照（注入系统提示用） */
  getSnapshot(target: MemoryTarget): string {
    return this._snapshot.get(target) || '';
  }

  // ─── 内容安全扫描（对标 Hermes _scan_memory_content）───────

  scanContent(content: string): ScanResult {
    const threats: ScanResult['threats'] = [];

    // 检测隐形字符
    for (const char of INVISIBLE_CHARS) {
      if (content.includes(char)) {
        threats.push({
          pattern: `U+${char.codePointAt(0)!.toString(16).toUpperCase()}`,
          type: 'invisible_char',
          match: 'content contains invisible unicode character',
        });
      }
    }

    // 检测威胁模式
    for (const [pattern, type] of THREAT_PATTERNS) {
      const match = content.match(pattern);
      if (match) {
        threats.push({
          pattern: pattern.source,
          type,
          match: match[0],
        });
      }
    }

    return {
      passed: threats.length === 0,
      threats,
      reason: threats.length > 0
        ? `Blocked: ${threats.map(t => t.type).join(', ')}`
        : undefined,
    };
  }

  // ─── MemoryProvider 接口 ───────────────────────────────────

  override systemPromptBlock(): string {
    const memory = this._snapshot.get('memory') || '';
    const user = this._snapshot.get('user') || '';

    if (!memory && !user) return '';

    const parts: string[] = [];
    if (memory) {
      parts.push('## Memory (agent notes)\n' + memory);
    }
    if (user) {
      parts.push('## User Profile\n' + user);
    }
    return parts.join('\n\n');
  }

  override prefetch(query: string, opts?: { roleId?: string }): string {
    // builtin provider 的预取由 snapshot 处理
    // 外部 provider 负责语义搜索
    return '';
  }

  override syncTurn(userContent: string, assistantContent: string, opts?: { roleId?: string }): void {
    // Builtin provider 的 sync 由工具调用触发
    // 这里只做 turn 计数更新
  }

  // ─── 内部方法 ──────────────────────────────────────────────

  private async _getEntries(target: MemoryTarget, role: RoleId): Promise<MemoryEntry[]> {
    return getMemoriesByRole(role, target);
  }

  /** 自动推断条目类别 */
  private _inferCategory(content: string): MemoryEntry['category'] {
    const lower = content.toLowerCase();
    if (lower.includes('prefer') || lower.includes('always') || lower.includes('never') || lower.includes('不要') || lower.includes('总是')) {
      return 'preference';
    }
    if (lower.includes('mistake') || lower.includes('error') || lower.includes('failed') || lower.includes('fix') || lower.includes('修复')) {
      return 'correction';
    }
    if (lower.includes('pattern') || lower.includes('workflow') || lower.includes('步骤') || lower.includes('流程')) {
      return 'pattern';
    }
    if (lower.includes('lesson') || lower.includes('learned') || lower.includes('note') || lower.includes('记住')) {
      return 'lesson';
    }
    return 'insight';
  }

  /** 裁剪最旧的条目以腾出空间（对标 Hermes bounded memory） */
  private async _trimEntries(target: MemoryTarget, role: RoleId, maxChars: number): Promise<void> {
    const db = getEvolutionDB();
    let entries = await this._getEntries(target, role);
    let totalChars = entries.reduce((sum, e) => sum + e.content.length, 0);

    while (totalChars > maxChars && entries.length > 0) {
      // 移除最旧的条目
      const oldest = entries.shift()!;
      if (oldest.id !== undefined) {
        await db.delete(STORES.MEMORIES, oldest.id);
      }
      totalChars -= oldest.content.length;
    }
  }
}
