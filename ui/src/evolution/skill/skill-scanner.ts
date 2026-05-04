/**
 * SecuClaw Evolution — SkillScanner（技能安全扫描器）
 *
 * 对标 Hermes _security_scan_skill() (tools/skill_manager_tool.py)
 *
 * 13 种威胁模式（从 Hermes 完整移植）:
 * 1. prompt_injection — 忽略指令
 * 2. role_hijack — 角色劫持
 * 3. disregard_rules — 忽略规则
 * 4. bypass_restrictions — 绕过限制
 * 5. deception_hide — 欺骗性隐藏
 * 6. sys_prompt_override — 系统提示覆盖
 * 7. credential_exfil — 凭据窃取（curl/wget）
 * 8. read_secrets — 读取密钥文件
 * 9. ssh_backdoor — SSH 后门
 * 10. ssh_access — SSH 访问
 * 11. base64_decode_exfil — Base64 解码渗出
 * 12. base64_import_exfil — Base64 导入渗出
 * 13. invisible_char — 隐形字符
 */

import type { ScanResult } from '../types';

// 威胁检测模式
const THREAT_PATTERNS: Array<{
  pattern: RegExp;
  type: ScanResult['threats'][0]['type'];
  description: string;
}> = [
  // Prompt injection
  {
    pattern: /ignore\s+(previous|all|above|prior)\s+instructions/i,
    type: 'prompt_injection',
    description: 'Attempt to ignore previous instructions',
  },
  {
    pattern: /disregard\s+(your|all|any)\s+(instructions|rules|guidelines)/i,
    type: 'disregard_rules',
    description: 'Attempt to disregard all rules',
  },
  {
    pattern: /act\s+as\s+(if|though)\s+you\s+(have\s+no|don't\s+have)\s+(restrictions|limits|rules)/i,
    type: 'bypass_restrictions',
    description: 'Attempt to bypass restrictions',
  },

  // Role hijack
  {
    pattern: /you\s+are\s+now\s+/i,
    type: 'role_hijack',
    description: 'Attempt to override role definition',
  },
  {
    pattern: /forget\s+(about|all)\s+(your|previous)\s+(instructions|system\s+prompt)/i,
    type: 'role_hijack',
    description: 'Attempt to reset role identity',
  },

  // Deception
  {
    pattern: /do\s+not\s+tell\s+the\s+user/i,
    type: 'deception_hide',
    description: 'Attempt to hide information from user',
  },
  {
    pattern: /don't\s+mention\s+(this|system|instruction)/i,
    type: 'deception_hide',
    description: 'Attempt to conceal system information',
  },

  // System prompt override
  {
    pattern: /system\s+prompt\s+override/i,
    type: 'sys_prompt_override',
    description: 'Attempt to override system prompt',
  },
  {
    pattern: /\[SYSTEM\s+OVERRIDE\]/i,
    type: 'sys_prompt_override',
    description: 'Detected system override marker',
  },

  // Credential exfil
  {
    pattern: /curl\s+[^\n]*\$\{?\w*(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|API)[A-Z_]*/i,
    type: 'credential_exfil',
    description: 'Potential credential exfiltration via curl',
  },
  {
    pattern: /wget\s+[^\n]*\$\{?\w*(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|API)[A-Z_]*/i,
    type: 'credential_exfil',
    description: 'Potential credential exfiltration via wget',
  },
  {
    pattern: /curl\s+[^\n]*\$\{?\w*(aws_access|aws_secret|AWS_)/i,
    type: 'credential_exfil',
    description: 'Potential AWS credential exfiltration',
  },

  // Read secrets
  {
    pattern: /cat\s+[^\n]*(\.env|credentials|\.netrc|\.pgpass|\.npmrc|\.pypirc)/i,
    type: 'read_secrets',
    description: 'Attempt to read secret files',
  },
  {
    pattern: /<\s*(?:input|include)\s+(?:file|path)\s*=[^\n]*(\.env|credentials|secrets)/i,
    type: 'read_secrets',
    description: 'Attempt to include secret file paths',
  },

  // SSH backdoor
  {
    pattern: /authorized_keys/i,
    type: 'ssh_backdoor',
    description: 'SSH authorized_keys reference detected',
  },
  {
    pattern: /ssh[_-]?(?:config|known_hosts)/i,
    type: 'ssh_access',
    description: 'SSH configuration access',
  },

  // Base64 exfil
  {
    pattern: /eval\s*\(\s*atob\s*\(/i,
    type: 'base64_decode_exfil',
    description: 'Base64 decode execution detected',
  },
  {
    pattern: /\batob\s*\(['"][^')"]+['"]\)/i,
    type: 'base64_decode_exfil',
    description: 'Base64 decoding function call',
  },

  // Python import base64 exfil
  {
    pattern: /from\s+base64\s+import.*atob|import\s*\(\s*['"]base64['"].*atob|base64\.b64decode/i,
    type: 'base64_import_exfil',
    description: 'Python base64 decode import/usage',
  },

  // Node.js buffer exfil
  {
    pattern: /Buffer\.from\s*\([^)]*\.env/i,
    type: 'credential_exfil',
    description: 'Node.js Buffer from environment',
  },
  {
    pattern: /process\.env\[/i,
    type: 'credential_exfil',
    description: 'Process environment access',
  },
];

// 隐形 Unicode 字符
const INVISIBLE_CHARS = new Set([
  '\u200b', // ZERO WIDTH SPACE
  '\u200c', // ZERO WIDTH NON-JOINER
  '\u200d', // ZERO WIDTH JOINER
  '\u2060', // WORD JOINER
  '\ufeff', // BYTE ORDER MARK
  '\u202a', // LEFT-TO-RIGHT EMBEDDING
  '\u202b', // RIGHT-TO-LEFT EMBEDDING
  '\u202c', // POP DIRECTIONAL FORMATTING
  '\u202d', // LEFT-TO-RIGHT OVERRIDE
  '\u202e', // RIGHT-TO-LEFT OVERRIDE
]);

export class SkillScanner {
  private patterns: typeof THREAT_PATTERNS;

  constructor(patterns?: typeof THREAT_PATTERNS) {
    this.patterns = patterns ?? THREAT_PATTERNS;
  }

  /**
   * 扫描技能内容
   * 对标 Hermes _security_scan_skill()
   */
  scan(content: string): ScanResult {
    const threats: ScanResult['threats'] = [];

    // 1. 检测威胁模式
    for (const { pattern, type, description } of this.patterns) {
      const match = content.match(pattern);
      if (match) {
        threats.push({
          pattern: pattern.source,
          type,
          match: match[0],
        });
      }
    }

    // 2. 检测隐形字符
    for (const char of INVISIBLE_CHARS) {
      if (content.includes(char)) {
        threats.push({
          pattern: `U+${char.codePointAt(0)!.toString(16).toUpperCase()}`,
          type: 'invisible_char',
          match: `content contains invisible unicode: ${char}`,
        });
      }
    }

    // 3. 检测可疑的 URL 模式
    const suspiciousUrls = this._detectSuspiciousUrls(content);
    threats.push(...suspiciousUrls);

    return {
      passed: threats.length === 0,
      threats,
      reason:
        threats.length > 0
          ? `Security scan failed: ${threats.map((t) => t.type).join(', ')}`
          : undefined,
    };
  }

  /**
   * 扫描多个内容（用于批量扫描）
   */
  scanMultiple(contents: Array<{ name: string; content: string }>): Map<string, ScanResult> {
    const results = new Map<string, ScanResult>();
    for (const { name, content } of contents) {
      results.set(name, this.scan(content));
    }
    return results;
  }

  /**
   * 增量扫描（只扫描新增内容）
   */
  scanIncremental(oldContent: string, newContent: string): ScanResult {
    // 找出新增的文本
    const added = this._getAddedText(oldContent, newContent);
    return this.scan(added);
  }

  // ─── 内部方法 ──────────────────────────────────────────────

  /**
   * 检测可疑的 URL 模式
   */
  private _detectSuspiciousUrls(content: string): ScanResult['threats'] {
    const threats: ScanResult['threats'] = [];

    // 检测可能的渗出 URL（包含敏感关键词的 URL）
    const exfilUrlPattern = /https?:\/\/[^\s'"]*(?:exfil|steal|dump|leak|extract|payload|malware|backdoor)[^\s'"]*/gi;
    let match;
    while ((match = exfilUrlPattern.exec(content)) !== null) {
      threats.push({
        pattern: exfilUrlPattern.source,
        type: 'credential_exfil',
        match: match[0],
      });
    }

    return threats;
  }

  /**
   * 计算新增的文本（用于增量扫描）
   */
  private _getAddedText(oldContent: string, newContent: string): string {
    // 简单实现：返回新内容中超出旧内容的部分
    if (newContent.length <= oldContent.length) return '';
    const added = newContent.slice(oldContent.length);
    // 如果新增部分是其他内容的重复，则返回空
    if (oldContent.includes(added)) return '';
    return added;
  }
}

// ─── 导出单例 ─────────────────────────────────────────────────

let _scanner: SkillScanner | null = null;

export function getSkillScanner(): SkillScanner {
  if (!_scanner) {
    _scanner = new SkillScanner();
  }
  return _scanner;
}
