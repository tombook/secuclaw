export interface SanitizeFinding {
  strategy: string;
  category: SanitizerStrategy['category'];
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  offset?: number;
  length?: number;
}

export interface SanitizeResult {
  text: string;
  wasModified: boolean;
  findings: SanitizeFinding[];
  riskScore: number;
}

export interface SanitizerStrategy {
  id: string;
  name: string;
  category: 'pii' | 'prompt-injection' | 'jailbreak' | 'toxicity' | 'data-exfil' | 'custom';
  sanitize(text: string): SanitizeResult;
}

const PII_PATTERNS: Array<{
  regex: RegExp;
  label: string;
  replacement: string;
  severity: SanitizeFinding['severity'];
}> = [
  { regex: /-----BEGIN\s+(?:RSA\s+|EC\s+|DSA\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/g, label: 'Private Key', replacement: '[REDACTED_KEY]', severity: 'critical' },
  { regex: /AKIA[0-9A-Z]{16}/g, label: 'AWS Access Key', replacement: '[REDACTED_AWS]', severity: 'critical' },
  { regex: /(?:mongodb|postgres|mysql|redis|jdbc):\/\/[^:]+:[^@]+@/gi, label: 'Connection String', replacement: '[REDACTED_CONN]', severity: 'critical' },
  { regex: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g, label: 'JWT Token', replacement: '[REDACTED_JWT]', severity: 'critical' },
  { regex: /(?:sk-|ak-|api[_-]?key)[=:]\s*["']?([a-zA-Z0-9_-]{20,})["']?/gi, label: 'API Key', replacement: '[REDACTED_APIKEY]', severity: 'critical' },
  { regex: /(?:password|passwd|pwd|secret|token|key|credential)["\s:=]+["']?([^"'\s,;}\]]+)/gi, label: 'Credential', replacement: '[REDACTED]', severity: 'critical' },
  { regex: /[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]/g, label: 'Chinese ID Number', replacement: '[REDACTED_ID]', severity: 'high' },
  { regex: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, label: 'Credit Card Number', replacement: '[REDACTED_CC]', severity: 'high' },
  { regex: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, label: 'IP Address', replacement: '[REDACTED_IP]', severity: 'medium' },
  { regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, label: 'Email Address', replacement: '[REDACTED_EMAIL]', severity: 'medium' },
  { regex: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, label: 'Phone Number', replacement: '[REDACTED_PHONE]', severity: 'medium' },
  { regex: /([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}/g, label: 'MAC Address', replacement: '[REDACTED_MAC]', severity: 'low' },
];

class PiiRedactionStrategy implements SanitizerStrategy {
  id = 'pii-redaction';
  name = 'PII Redaction';
  category = 'pii' as const;

  sanitize(text: string): SanitizeResult {
    const findings: SanitizeFinding[] = [];
    let modified = text;

    for (const pattern of PII_PATTERNS) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      while ((match = regex.exec(text)) !== null) {
        findings.push({
          strategy: this.id,
          category: this.category,
          severity: pattern.severity,
          description: `${pattern.label} detected`,
          offset: match.index,
          length: match[0].length,
        });
      }
      modified = modified.replace(new RegExp(pattern.regex.source, pattern.regex.flags), pattern.replacement);
    }

    return {
      text: modified,
      wasModified: modified !== text,
      findings,
      riskScore: findings.length > 0 ? Math.min(1, findings.length * 0.1) : 0,
    };
  }
}

const PROMPT_INJECTION_PATTERNS: Array<{
  regex: RegExp;
  label: string;
  severity: SanitizeFinding['severity'];
}> = [
  { regex: /ignore\s+(all\s+)?previous\s+instructions/gi, label: 'Ignore previous instructions', severity: 'critical' },
  { regex: /忽略之前(的)?指令/g, label: 'Ignore previous instructions (Chinese)', severity: 'critical' },
  { regex: /^(system|assistant|user)\s*:/gim, label: 'Role prefix spoofing', severity: 'critical' },
  { regex: /^ROLE\s*:/gim, label: 'ROLE directive', severity: 'high' },
  { regex: /ACT\s+AS\b/gi, label: 'ACT AS directive', severity: 'high' },
  { regex: /(?:[A-Za-z0-9+/]{40,}={0,2})/g, label: 'Base64 encoded content', severity: 'medium' },
  { regex: /(?:%[0-9A-Fa-f]{2}){10,}/g, label: 'URL encoded content', severity: 'medium' },
  { regex: /```[\s\S]*?```/g, label: 'Code block injection', severity: 'medium' },
  { regex: /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions|rules|guidelines)/gi, label: 'Disregard instructions', severity: 'critical' },
  { regex: /forget\s+(all\s+)?(previous|your)\s+(instructions|rules)/gi, label: 'Forget instructions', severity: 'high' },
  { regex: /new\s+instructions?\s*:/gi, label: 'New instructions override', severity: 'high' },
];

class PromptInjectionDetectorStrategy implements SanitizerStrategy {
  id = 'prompt-injection';
  name = 'Prompt Injection Detector';
  category = 'prompt-injection' as const;

  sanitize(text: string): SanitizeResult {
    const findings: SanitizeFinding[] = [];

    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      while ((match = regex.exec(text)) !== null) {
        findings.push({
          strategy: this.id,
          category: this.category,
          severity: pattern.severity,
          description: pattern.label,
          offset: match.index,
          length: match[0].length,
        });
      }
    }

    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    const riskScore = Math.min(1, criticalCount * 0.3 + highCount * 0.15 + findings.length * 0.05);

    return {
      text,
      wasModified: false,
      findings,
      riskScore,
    };
  }
}

const JAILBREAK_PATTERNS: Array<{
  regex: RegExp;
  label: string;
  severity: SanitizeFinding['severity'];
}> = [
  { regex: /\bDAN\b.*?(?:Do Anything Now|do anything now)/gi, label: 'DAN mode', severity: 'critical' },
  { regex: /you\s+are\s+now\s+free\b/gi, label: 'Freedom assertion', severity: 'high' },
  { regex: /restrictions?\s+(?:removed|lifted|disabled|turned\s+off)/gi, label: 'Restrictions removed', severity: 'high' },
  { regex: /developer\s+mode/gi, label: 'Developer mode', severity: 'high' },
  { regex: /debug\s+mode/gi, label: 'Debug mode', severity: 'high' },
  { regex: /hypothetically.*?(?:hack|exploit|attack|bomb|kill|weapon|drug)/gi, label: 'Hypothetical attack', severity: 'critical' },
  { regex: /(?:in\s+a\s+)?fictional\s+world.*?(?:hack|exploit|attack|bomb|kill|weapon|drug)/gi, label: 'Fictional world attack', severity: 'critical' },
  { regex: /you\s+are\s+(?:now\s+)?(?:unfiltered|unrestricted|uncensored|unchained)/gi, label: 'Unfiltered assertion', severity: 'high' },
  { regex: /bypass\s+(?:all\s+)?(?:safety|security|filter|guard|restriction)/gi, label: 'Safety bypass', severity: 'critical' },
  { regex: /jailbreak(?:ed|ing)?\s*(?:mode|prompt)/gi, label: 'Jailbreak mode', severity: 'high' },
  { regex: /sudo\s+mode/gi, label: 'Sudo mode', severity: 'medium' },
  { regex: /god\s+mode/gi, label: 'God mode', severity: 'medium' },
  { regex: /override\s+(?:all\s+)?(?:safety|security|policy|rules)/gi, label: 'Safety override', severity: 'critical' },
];

class JailbreakDetectorStrategy implements SanitizerStrategy {
  id = 'jailbreak';
  name = 'Jailbreak Detector';
  category = 'jailbreak' as const;

  sanitize(text: string): SanitizeResult {
    const findings: SanitizeFinding[] = [];

    for (const pattern of JAILBREAK_PATTERNS) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      while ((match = regex.exec(text)) !== null) {
        findings.push({
          strategy: this.id,
          category: this.category,
          severity: pattern.severity,
          description: pattern.label,
          offset: match.index,
          length: match[0].length,
        });
      }
    }

    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    const riskScore = Math.min(1, criticalCount * 0.35 + highCount * 0.15 + findings.length * 0.05);

    return {
      text,
      wasModified: false,
      findings,
      riskScore,
    };
  }
}

const TOXICITY_KEYWORDS_EN: Array<{ pattern: RegExp; label: string; severity: SanitizeFinding['severity'] }> = [
  { pattern: /\bkill\s+(?:yourself|himself|herself|them)\b/gi, label: 'Violence - self-harm encouragement', severity: 'critical' },
  { pattern: /\bhow\s+to\s+(?:make|build|create)\s+(?:a\s+)?(?:bomb|weapon|explosive)\b/gi, label: 'Violence - weapon creation', severity: 'critical' },
  { pattern: /\bhow\s+to\s+(?:hack|exploit|breach)\s+/gi, label: 'Illegal activity - hacking', severity: 'high' },
  { pattern: /\b(?:rape|murder|assassinate|torture)\b/gi, label: 'Violence - severe', severity: 'critical' },
  { pattern: /\b(?:nigger|chink|spic|kike|faggot|retard)\b/gi, label: 'Discrimination - slur', severity: 'critical' },
  { pattern: /\b(?:terrorist|terrorism|isis|al[- ]qaeda)\b/gi, label: 'Terrorism', severity: 'high' },
  { pattern: /\b(?:child|underage)\s+(?:porn|abuse|exploitation)\b/gi, label: 'Child exploitation', severity: 'critical' },
  { pattern: /\bhow\s+to\s+(?:synthesize|manufacture|cook)\s+(?:drugs|meth|cocaine|heroin|fentanyl)\b/gi, label: 'Illegal drug manufacturing', severity: 'high' },
  { pattern: /\b(?:suicide|kill\s+myself|end\s+my\s+life)\b/gi, label: 'Self-harm', severity: 'high' },
  { pattern: /\bhate\s+(?:speech|crime)\b/gi, label: 'Hate speech', severity: 'high' },
];

const TOXICITY_KEYWORDS_ZH: Array<{ pattern: RegExp; label: string; severity: SanitizeFinding['severity'] }> = [
  { pattern: /自杀|跳楼|割腕/g, label: 'Violence - self-harm (Chinese)', severity: 'high' },
  { pattern: /制作炸弹|制造武器|自制炸药/g, label: 'Violence - weapon creation (Chinese)', severity: 'critical' },
  { pattern: /恐怖分子|恐怖袭击|炸弹袭击/g, label: 'Terrorism (Chinese)', severity: 'high' },
  { pattern: /儿童色情|未成年.*色情|幼童.*虐待/g, label: 'Child exploitation (Chinese)', severity: 'critical' },
  { pattern: /制作毒品|制造冰毒|贩卖毒品/g, label: 'Illegal drug manufacturing (Chinese)', severity: 'high' },
  { pattern: /黑客攻击|入侵系统|网络攻击/g, label: 'Illegal activity - hacking (Chinese)', severity: 'high' },
  { pattern: /种族歧视|性别歧视|仇恨言论/g, label: 'Hate speech (Chinese)', severity: 'high' },
];

const ALL_TOXICITY_PATTERNS = [...TOXICITY_KEYWORDS_EN, ...TOXICITY_KEYWORDS_ZH];

class ToxicityDetectorStrategy implements SanitizerStrategy {
  id = 'toxicity';
  name = 'Toxicity Detector';
  category = 'toxicity' as const;

  sanitize(text: string): SanitizeResult {
    const findings: SanitizeFinding[] = [];

    for (const entry of ALL_TOXICITY_PATTERNS) {
      let match: RegExpExecArray | null;
      const regex = new RegExp(entry.pattern.source, entry.pattern.flags);
      while ((match = regex.exec(text)) !== null) {
        findings.push({
          strategy: this.id,
          category: this.category,
          severity: entry.severity,
          description: entry.label,
          offset: match.index,
          length: match[0].length,
        });
      }
    }

    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    const riskScore = Math.min(1, criticalCount * 0.4 + highCount * 0.2 + findings.length * 0.05);

    return {
      text,
      wasModified: false,
      findings,
      riskScore,
    };
  }
}

function mergeResults(base: SanitizeResult, incoming: SanitizeResult): SanitizeResult {
  return {
    text: incoming.text,
    wasModified: base.wasModified || incoming.wasModified,
    findings: [...base.findings, ...incoming.findings],
    riskScore: Math.max(base.riskScore, incoming.riskScore),
  };
}

export class SanitizerRegistry {
  private strategies: Map<string, SanitizerStrategy> = new Map();

  register(strategy: SanitizerStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  unregister(id: string): boolean {
    return this.strategies.delete(id);
  }

  sanitize(text: string, strategies?: string[]): SanitizeResult {
    const targets =
      strategies !== undefined
        ? strategies.map(id => this.strategies.get(id)).filter((s): s is SanitizerStrategy => s !== undefined)
        : Array.from(this.strategies.values());

    if (targets.length === 0) {
      return { text, wasModified: false, findings: [], riskScore: 0 };
    }

    return targets.reduce<SanitizeResult>(
      (acc, strategy) => {
        const result = strategy.sanitize(acc.text);
        return mergeResults(acc, result);
      },
      { text, wasModified: false, findings: [], riskScore: 0 },
    );
  }

  sanitizeWithCategory(text: string, categories: string[]): SanitizeResult {
    const targets = Array.from(this.strategies.values()).filter(s =>
      categories.includes(s.category),
    );

    if (targets.length === 0) {
      return { text, wasModified: false, findings: [], riskScore: 0 };
    }

    return targets.reduce<SanitizeResult>(
      (acc, strategy) => {
        const result = strategy.sanitize(acc.text);
        return mergeResults(acc, result);
      },
      { text, wasModified: false, findings: [], riskScore: 0 },
    );
  }

  getRiskScore(text: string): number {
    let maxScore = 0;
    const allStrategies = Array.from(this.strategies.values());
    for (const strategy of allStrategies) {
      const result = strategy.sanitize(text);
      if (result.riskScore > maxScore) {
        maxScore = result.riskScore;
      }
    }
    return maxScore;
  }

  listStrategies(): SanitizerStrategy[] {
    return Array.from(this.strategies.values());
  }
}

export const sanitizerRegistry = new SanitizerRegistry();

sanitizerRegistry.register(new PiiRedactionStrategy());
sanitizerRegistry.register(new PromptInjectionDetectorStrategy());
sanitizerRegistry.register(new JailbreakDetectorStrategy());
sanitizerRegistry.register(new ToxicityDetectorStrategy());
