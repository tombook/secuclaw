import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type AttackType =
  | 'sql_injection'
  | 'sqli_time_based'
  | 'sqli_union'
  | 'sqli_boolean'
  | 'sqli_stacked'
  | 'sqli_error_based'
  | 'sqli_comment'
  | 'sqli_tautology';

export type BlockAction = 'block' | 'log_only' | 'sanitize' | 'rate_limit' | 'challenge';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type SqlDatabase = 'mysql' | 'postgres' | 'oracle' | 'sqlserver' | 'sqlite';

export interface SqlInspectionRequest {
  id: string;
  timestamp: number;
  applicationId: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  userId: string | null;
  sessionId: string;
  sourceIp: string;
  userAgent: string;
  parameters: Record<string, any>;
  query: string | null;
  database: SqlDatabase;
  context: {
    source: 'http' | 'graphql' | 'grpc' | 'cli' | 'internal';
    route: string;
    referer: string | null;
  };
}

export interface SqlInjectionFinding {
  attackType: AttackType;
  severity: Severity;
  parameter: string;
  matchedValue: string;
  matchedPattern: string;
  patternDescription: string;
  confidence: number;
  contextSnippet: string;
  evidence: string[];
  recommendedAction: BlockAction;
}

export interface SqlInspectionResult {
  request: SqlInspectionRequest;
  allowed: boolean;
  action: BlockAction;
  findings: SqlInjectionFinding[];
  overallConfidence: number;
  highestSeverity: Severity;
  detectionTime: number;
  sanitizedParameters: Record<string, any> | null;
  timestamp: number;
}

export interface SqlPattern {
  id: string;
  name: string;
  description: string;
  attackType: AttackType;
  severity: Severity;
  pattern: RegExp;
  confidence: number;
  description_zh: string;
  examples: string[];
  enabled: boolean;
  falsePositiveRisk: 'low' | 'medium' | 'high';
}

export interface SqlInjectionStats {
  totalRequests: number;
  byAction: Record<BlockAction, number>;
  byAttackType: Record<AttackType, number>;
  bySeverity: Record<Severity, number>;
  blockRate: number;
  averageDetectionTimeMs: number;
  topAttackingIps: Array<{ ip: string; count: number }>;
  topAttackedEndpoints: Array<{ endpoint: string; count: number }>;
}

const STORE_KEYS = {
  patterns: 'rasp/sql-patterns.json',
  results: 'rasp/sql-results.json',
} as const;

const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

const ACTION_BY_SEVERITY: Record<Severity, BlockAction> = {
  critical: 'block',
  high: 'block',
  medium: 'sanitize',
  low: 'log_only',
  info: 'log_only',
};

function buildBuiltinPatterns(): SqlPattern[] {
  const seed = (suffix: string): string => `sqli-${suffix}-${randomUUID()}`;
  return [
    {
      id: seed('union-select'),
      name: 'UNION SELECT keyword',
      description: 'Detects UNION/UNION ALL SELECT clauses used to combine attacker queries',
      attackType: 'sqli_union',
      severity: 'high',
      pattern: /\bunion\s+(all\s+)?select\b/i,
      confidence: 0.92,
      description_zh: '检测 UNION/UNION ALL SELECT 子句合并攻击者查询',
      examples: ["' UNION SELECT username, password FROM users--", "1 UNION ALL SELECT NULL,NULL,NULL--"],
      enabled: true,
      falsePositiveRisk: 'low',
    },
    {
      id: seed('tautology-or-1-1'),
      name: 'OR 1=1 tautology',
      description: 'Detects classic tautology predicates (OR/AND with literal equality) used to bypass WHERE clauses',
      attackType: 'sqli_tautology',
      severity: 'critical',
      pattern: /\b(or|and)\s+[\d'"]+\s*=\s*[\d'"]+/i,
      confidence: 0.95,
      description_zh: '检测经典永真谓词绕过 WHERE 条件',
      examples: ["admin' OR '1'='1", "' OR 1=1 --", "' AND 1=1 #"],
      enabled: true,
      falsePositiveRisk: 'low',
    },
    {
      id: seed('sql-comment'),
      name: 'SQL comment injection',
      description: 'Detects SQL line or block comments used to terminate the legitimate query',
      attackType: 'sqli_comment',
      severity: 'medium',
      pattern: /(--|\/\*|\*\/|#)/,
      confidence: 0.7,
      description_zh: '检测 SQL 行/块注释注入',
      examples: ["admin'--", "1; DROP TABLE x;/*", "name # comment"],
      enabled: true,
      falsePositiveRisk: 'high',
    },
    {
      id: seed('stacked-queries'),
      name: 'Stacked destructive queries',
      description: 'Detects stacked queries that issue DROP/DELETE/UPDATE/INSERT/CREATE/ALTER/TRUNCATE/EXEC',
      attackType: 'sqli_stacked',
      severity: 'critical',
      pattern: /;\s*(drop|delete|update|insert|create|alter|truncate|exec)\s+/i,
      confidence: 0.96,
      description_zh: '检测堆叠查询触发的破坏性 DDL/DML',
      examples: ["1; DROP TABLE users--", "x'; UPDATE accounts SET balance=0;--"],
      enabled: true,
      falsePositiveRisk: 'low',
    },
    {
      id: seed('time-based-sleep'),
      name: 'Time-based SLEEP function',
      description: 'Detects sleep/pg_sleep/waitfor/benchmark calls used for blind time-based injection',
      attackType: 'sqli_time_based',
      severity: 'high',
      pattern: /\b(sleep|pg_sleep|waitfor\s+delay|benchmark)\s*\(/i,
      confidence: 0.9,
      description_zh: '检测用于盲注的时间函数调用',
      examples: ["1' AND SLEEP(5)--", "'; WAITFOR DELAY '0:0:10'--", "BENCHMARK(1000000,MD5(1))"],
      enabled: true,
      falsePositiveRisk: 'medium',
    },
    {
      id: seed('error-extractvalue'),
      name: 'Error-based extractvalue/updatexml',
      description: 'Detects MySQL extractvalue/updatexml calls used for error-based extraction',
      attackType: 'sqli_error_based',
      severity: 'high',
      pattern: /\b(extractvalue|updatexml)\s*\(/i,
      confidence: 0.94,
      description_zh: '检测 MySQL extractvalue/updatexml 报错注入',
      examples: ["AND extractvalue(1,concat(0x7e,version()))", "OR updatexml(1,concat(0x7e,user()),1)"],
      enabled: true,
      falsePositiveRisk: 'low',
    },
    {
      id: seed('xp-cmdshell'),
      name: 'xp_cmdshell execution',
      description: 'Detects SQL Server xp_cmdshell attempts to invoke operating system commands',
      attackType: 'sqli_error_based',
      severity: 'critical',
      pattern: /\bxp_cmdshell\b/i,
      confidence: 0.99,
      description_zh: '检测 SQL Server xp_cmdshell 执行操作系统命令',
      examples: ["'; EXEC xp_cmdshell('whoami')--", "1; EXEC master..xp_cmdshell 'net user'"],
      enabled: true,
      falsePositiveRisk: 'low',
    },
    {
      id: seed('information-schema'),
      name: 'Information schema probing',
      description: 'Detects references to information_schema / pg_catalog / sysobjects / syscolumns used for schema discovery',
      attackType: 'sqli_union',
      severity: 'high',
      pattern: /\b(information_schema|pg_catalog|sysobjects|syscolumns)\b/i,
      confidence: 0.88,
      description_zh: '检测对信息模式/系统表的探测',
      examples: ["UNION SELECT * FROM information_schema.tables", "1' AND 1=(SELECT TOP 1 name FROM sysobjects)"],
      enabled: true,
      falsePositiveRisk: 'medium',
    },
    {
      id: seed('hex-encoding-bypass'),
      name: 'Hex-encoded payload',
      description: 'Detects long hex literals (0x...) often used to bypass string filters',
      attackType: 'sqli_union',
      severity: 'medium',
      pattern: /\b0x[0-9a-f]{6,}\b/i,
      confidence: 0.6,
      description_zh: '检测用于绕过过滤的长十六进制负载',
      examples: ["UNION SELECT 0x70617373776f7264", "0x27204f5220313d31202d2d20"],
      enabled: true,
      falsePositiveRisk: 'high',
    },
    {
      id: seed('into-outfile'),
      name: 'INTO OUTFILE / DUMPFILE',
      description: 'Detects INTO OUTFILE/DUMPFILE statements used to write webshells',
      attackType: 'sqli_stacked',
      severity: 'critical',
      pattern: /\binto\s+(out|dump)file\b/i,
      confidence: 0.97,
      description_zh: '检测 INTO OUTFILE/DUMPFILE 写文件',
      examples: ["' UNION SELECT 1,2 INTO OUTFILE '/var/www/shell.php'--", "1; SELECT 0x3c3f706870 INTO DUMPFILE '/tmp/x.php'"],
      enabled: true,
      falsePositiveRisk: 'low',
    },
    {
      id: seed('load-file'),
      name: 'LOAD_FILE() function',
      description: 'Detects MySQL LOAD_FILE calls used to read arbitrary server files',
      attackType: 'sqli_stacked',
      severity: 'critical',
      pattern: /\bload_file\s*\(/i,
      confidence: 0.98,
      description_zh: '检测 LOAD_FILE 读取服务器任意文件',
      examples: ["UNION SELECT LOAD_FILE('/etc/passwd')", "SELECT load_file(0x2f6574632f706173737764)"],
      enabled: true,
      falsePositiveRisk: 'low',
    },
    {
      id: seed('char-function'),
      name: 'CHAR() numeric encoding',
      description: 'Detects CHAR() numeric encoding used to obfuscate strings',
      attackType: 'sqli_error_based',
      severity: 'medium',
      pattern: /\bchar\s*\(\s*\d+\s*\)/i,
      confidence: 0.55,
      description_zh: '检测 CHAR() 数字编码混淆字符串',
      examples: ["CHAR(68,69,70)", "0x" + "/*char*/"],
      enabled: true,
      falsePositiveRisk: 'high',
    },
    {
      id: seed('subquery-select'),
      name: 'Parenthesized SELECT subquery',
      description: 'Detects parenthesized SELECT subqueries used for boolean/data extraction',
      attackType: 'sqli_union',
      severity: 'medium',
      pattern: /\(\s*select\s+[^)]+\)/i,
      confidence: 0.65,
      description_zh: '检测括号包裹的 SELECT 子查询',
      examples: ["1 AND (SELECT COUNT(*) FROM users)>0", "'; (SELECT password FROM admins LIMIT 1)--"],
      enabled: true,
      falsePositiveRisk: 'medium',
    },
    {
      id: seed('waitfor-delay-quoted'),
      name: 'WAITFOR DELAY with quoted payload',
      description: 'Detects SQL Server WAITFOR DELAY followed by quoted time argument (time-based blind)',
      attackType: 'sqli_time_based',
      severity: 'high',
      pattern: /\bwaitfor\s+delay\s+['"]/i,
      confidence: 0.93,
      description_zh: '检测 SQL Server WAITFOR DELAY 引号参数盲注',
      examples: ["'; WAITFOR DELAY '0:0:5'--", "1; IF 1=1 WAITFOR DELAY '0:0:10'"],
      enabled: true,
      falsePositiveRisk: 'low',
    },
    {
      id: seed('mysql-meta-functions'),
      name: 'MySQL metadata functions',
      description: 'Detects MySQL current_user/database/version/user() metadata calls used in fingerprinting',
      attackType: 'sqli_error_based',
      severity: 'medium',
      pattern: /\b(current_user|database|version|user\s*\(\s*\))\b/i,
      confidence: 0.5,
      description_zh: '检测 MySQL 元数据函数用于指纹识别',
      examples: ["UNION SELECT version(),database()", "' AND user()=current_user --"],
      enabled: true,
      falsePositiveRisk: 'high',
    },
  ];
}

export class SqlInjectionInterceptor {
  private cachedPatterns: SqlPattern[] = [];
  private patternsLoaded = false;

  constructor(private store: JsonStore) {}

  async inspect(request: SqlInspectionRequest): Promise<SqlInspectionResult> {
    const start = Date.now();
    const patterns = await this.loadPatterns();
    const findings: SqlInjectionFinding[] = [];

    const paramEntries = Object.entries(request.parameters ?? {});
    for (const [name, value] of paramEntries) {
      const text = this.stringifyValue(value);
      if (!text) continue;
      const matched = this.runPatterns(text, name, patterns);
      findings.push(...matched);
    }

    if (request.query) {
      const matched = this.runPatterns(request.query, '__query__', patterns);
      findings.push(...matched);
    }

    const allowedAndAction = this.determineAction(findings);
    const sanitizedParameters = allowedAndAction.action === 'sanitize'
      ? this.sanitizeParameters(request.parameters)
      : null;

    const overallConfidence = this.computeOverallConfidence(findings);
    const highestSeverity = this.computeHighestSeverity(findings);
    const detectionTime = Date.now() - start;

    const result: SqlInspectionResult = {
      request,
      allowed: allowedAndAction.allowed,
      action: allowedAndAction.action,
      findings,
      overallConfidence,
      highestSeverity,
      detectionTime,
      sanitizedParameters,
      timestamp: Date.now(),
    };

    const history = await this.loadResults();
    history.push(result);
    if (history.length > 5000) {
      history.splice(0, history.length - 5000);
    }
    await this.store.set(STORE_KEYS.results, history);

    return result;
  }

  async inspectBatch(requests: SqlInspectionRequest[]): Promise<SqlInspectionResult[]> {
    const results: SqlInspectionResult[] = [];
    for (const req of requests) {
      results.push(await this.inspect(req));
    }
    return results;
  }

  async addCustomPattern(pattern: Omit<SqlPattern, 'id'>): Promise<SqlPattern> {
    const patterns = await this.loadPatterns();
    const newPattern: SqlPattern = { ...pattern, id: this.generateId() };
    patterns.push(newPattern);
    await this.store.set(STORE_KEYS.patterns, patterns);
    this.cachedPatterns = patterns;
    return newPattern;
  }

  async listPatterns(filters?: { attackType?: AttackType; enabled?: boolean }): Promise<SqlPattern[]> {
    const patterns = await this.loadPatterns();
    let filtered = patterns;
    if (filters?.attackType) {
      filtered = filtered.filter((p) => p.attackType === filters.attackType);
    }
    if (typeof filters?.enabled === 'boolean') {
      filtered = filtered.filter((p) => p.enabled === filters.enabled);
    }
    return filtered;
  }

  async removePattern(patternId: string): Promise<boolean> {
    const patterns = await this.loadPatterns();
    const index = patterns.findIndex((p) => p.id === patternId);
    if (index === -1) return false;
    patterns.splice(index, 1);
    await this.store.set(STORE_KEYS.patterns, patterns);
    this.cachedPatterns = patterns;
    return true;
  }

  async enablePattern(patternId: string): Promise<boolean> {
    return this.setPatternEnabled(patternId, true);
  }

  async disablePattern(patternId: string): Promise<boolean> {
    return this.setPatternEnabled(patternId, false);
  }

  async getRecentResults(filters?: {
    applicationId?: string;
    since?: number;
    severity?: Severity;
    limit?: number;
  }): Promise<SqlInspectionResult[]> {
    const history = await this.loadResults();
    let filtered = history;
    if (filters?.applicationId) {
      filtered = filtered.filter((r) => r.request.applicationId === filters.applicationId);
    }
    if (typeof filters?.since === 'number') {
      filtered = filtered.filter((r) => r.timestamp >= filters.since!);
    }
    if (filters?.severity) {
      filtered = filtered.filter((r) => r.highestSeverity === filters.severity);
    }
    filtered = filtered.sort((a, b) => b.timestamp - a.timestamp);
    return filters?.limit ? filtered.slice(0, filters.limit) : filtered;
  }

  async getStats(applicationId?: string, since?: number): Promise<SqlInjectionStats> {
    const history = await this.loadResults();
    let filtered = history;
    if (applicationId) {
      filtered = filtered.filter((r) => r.request.applicationId === applicationId);
    }
    if (typeof since === 'number') {
      filtered = filtered.filter((r) => r.timestamp >= since);
    }

    const byAction: Record<BlockAction, number> = {
      block: 0,
      log_only: 0,
      sanitize: 0,
      rate_limit: 0,
      challenge: 0,
    };
    const byAttackType: Record<AttackType, number> = {
      sql_injection: 0,
      sqli_time_based: 0,
      sqli_union: 0,
      sqli_boolean: 0,
      sqli_stacked: 0,
      sqli_error_based: 0,
      sqli_comment: 0,
      sqli_tautology: 0,
    };
    const bySeverity: Record<Severity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    const ipCounts = new Map<string, number>();
    const endpointCounts = new Map<string, number>();
    let blockedCount = 0;
    let totalDetectionTime = 0;

    for (const result of filtered) {
      byAction[result.action]++;
      bySeverity[result.highestSeverity]++;
      if (result.action === 'block') blockedCount++;
      totalDetectionTime += result.detectionTime;

      ipCounts.set(result.request.sourceIp, (ipCounts.get(result.request.sourceIp) ?? 0) + 1);
      endpointCounts.set(
        result.request.endpoint,
        (endpointCounts.get(result.request.endpoint) ?? 0) + 1,
      );

      for (const finding of result.findings) {
        byAttackType[finding.attackType] = (byAttackType[finding.attackType] ?? 0) + 1;
      }
    }

    const totalRequests = filtered.length;
    const blockRate = totalRequests > 0 ? blockedCount / totalRequests : 0;
    const averageDetectionTimeMs = totalRequests > 0 ? totalDetectionTime / totalRequests : 0;

    const topAttackingIps = Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topAttackedEndpoints = Array.from(endpointCounts.entries())
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      byAction,
      byAttackType,
      bySeverity,
      blockRate,
      averageDetectionTimeMs,
      topAttackingIps,
      topAttackedEndpoints,
    };
  }

  private runPatterns(input: string, parameter: string, patterns: SqlPattern[]): SqlInjectionFinding[] {
    const findings: SqlInjectionFinding[] = [];
    if (!input || patterns.length === 0) return findings;

    for (const pattern of patterns) {
      if (!pattern.enabled) continue;
      const flags = pattern.pattern.flags;
      const hasGlobal = flags.includes('g');
      const scanner = hasGlobal
        ? new RegExp(pattern.pattern.source, flags)
        : new RegExp(pattern.pattern.source, flags + 'g');
      scanner.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = scanner.exec(input)) !== null) {
        if (match[0].length === 0) {
          scanner.lastIndex++;
          continue;
        }
        const start = Math.max(0, match.index - 40);
        const end = Math.min(input.length, match.index + match[0].length + 40);
        const contextSnippet = input.slice(start, end);
        findings.push({
          attackType: pattern.attackType,
          severity: pattern.severity,
          parameter,
          matchedValue: match[0],
          matchedPattern: pattern.pattern.source,
          patternDescription: pattern.description,
          confidence: pattern.confidence,
          contextSnippet,
          evidence: [`Pattern: ${pattern.name}`, `Match: ${match[0]}`, `Param: ${parameter}`],
          recommendedAction: ACTION_BY_SEVERITY[pattern.severity],
        });
      }
    }

    if (this.checkTautology(input)) {
      findings.push(this.buildHeuristicFinding(input, parameter, 'sqli_tautology', 'critical', 0.95, 'Tautology-like logical equality detected'));
    }
    if (this.checkUnion(input)) {
      findings.push(this.buildHeuristicFinding(input, parameter, 'sqli_union', 'high', 0.85, 'UNION-style combined query detected'));
    }
    if (this.checkStackedQueries(input)) {
      findings.push(this.buildHeuristicFinding(input, parameter, 'sqli_stacked', 'critical', 0.95, 'Stacked destructive statement detected'));
    }
    if (this.checkComments(input)) {
      findings.push(this.buildHeuristicFinding(input, parameter, 'sqli_comment', 'medium', 0.6, 'SQL comment terminator detected'));
    }
    if (this.checkTimeBased(input)) {
      findings.push(this.buildHeuristicFinding(input, parameter, 'sqli_time_based', 'high', 0.9, 'Time-based blind injection primitive detected'));
    }
    if (this.checkErrorBased(input)) {
      findings.push(this.buildHeuristicFinding(input, parameter, 'sqli_error_based', 'high', 0.85, 'Error-based extraction primitive detected'));
    }
    if (this.checkFunctionCalls(input)) {
      findings.push(this.buildHeuristicFinding(input, parameter, 'sql_injection', 'medium', 0.55, 'Suspicious SQL function call detected'));
    }

    return findings;
  }

  private checkTautology(input: string): boolean {
    return /\b(or|and)\s+\(?['"]?[\d\w]+['"]?\s*=\s*['"]?[\d\w]+['"]?\)?/i.test(input)
      && /['"]/.test(input);
  }

  private checkUnion(input: string): boolean {
    return /\bunion\b/i.test(input) && /\bselect\b/i.test(input);
  }

  private checkStackedQueries(input: string): boolean {
    return /;\s*(drop|delete|update|insert|create|alter|truncate|exec|select)\b/i.test(input);
  }

  private checkComments(input: string): boolean {
    return /(--|\/\*|\*\/|#)/.test(input) && /['";]/.test(input);
  }

  private checkTimeBased(input: string): boolean {
    return /\b(sleep|pg_sleep|waitfor\s+delay|benchmark)\b/i.test(input);
  }

  private checkErrorBased(input: string): boolean {
    return /\b(extractvalue|updatexml|xp_cmdshell|load_file)\b/i.test(input);
  }

  private checkFunctionCalls(input: string): boolean {
    return /\b(char|concat|group_concat|substring|substr|ascii|ord|hex|unhex)\s*\(/i.test(input)
      && /['";]/.test(input);
  }

  private sanitize(input: string): string {
    return input
      .replace(/--/g, '')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/#/g, '')
      .replace(/;\s*(drop|delete|update|insert|create|alter|truncate|exec)\b/gi, '')
      .replace(/\bunion\b/gi, 'union_blocked')
      .replace(/\bselect\b/gi, 'select_blocked')
      .replace(/\b(extractvalue|updatexml|xp_cmdshell|load_file|char|sleep|pg_sleep|benchmark|waitfor\s+delay)\s*\(/gi, 'blocked(')
      .replace(/'/g, "''")
      .replace(/"/g, '""');
  }

  private sanitizeParameters(parameters: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(parameters ?? {})) {
      if (typeof value === 'string') {
        sanitized[key] = this.sanitize(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((v) => (typeof v === 'string' ? this.sanitize(v) : v));
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeParameters(value as Record<string, any>);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  private determineAction(findings: SqlInjectionFinding[]): { allowed: boolean; action: BlockAction } {
    if (findings.length === 0) {
      return { allowed: true, action: 'log_only' };
    }
    const highest = this.computeHighestSeverity(findings);
    const action = ACTION_BY_SEVERITY[highest];
    if (action === 'log_only') {
      return { allowed: true, action };
    }
    return { allowed: false, action };
  }

  private buildHeuristicFinding(
    input: string,
    parameter: string,
    attackType: AttackType,
    severity: Severity,
    confidence: number,
    description: string,
  ): SqlInjectionFinding {
    const snippetStart = Math.max(0, 0);
    const snippetEnd = Math.min(input.length, 80);
    return {
      attackType,
      severity,
      parameter,
      matchedValue: input.slice(snippetStart, snippetEnd),
      matchedPattern: 'heuristic',
      patternDescription: description,
      confidence,
      contextSnippet: input.slice(snippetStart, snippetEnd),
      evidence: [`Heuristic: ${description}`, `Param: ${parameter}`],
      recommendedAction: ACTION_BY_SEVERITY[severity],
    };
  }

  private computeOverallConfidence(findings: SqlInjectionFinding[]): number {
    if (findings.length === 0) return 0;
    const max = findings.reduce((acc, f) => Math.max(acc, f.confidence), 0);
    const avg = findings.reduce((acc, f) => acc + f.confidence, 0) / findings.length;
    const bonus = Math.min(findings.length - 1, 3) * 0.03;
    return Math.min(1, max * 0.6 + avg * 0.4 + bonus);
  }

  private computeHighestSeverity(findings: SqlInjectionFinding[]): Severity {
    if (findings.length === 0) return 'info';
    return findings.reduce<Severity>(
      (acc, f) => (SEVERITY_ORDER[f.severity] > SEVERITY_ORDER[acc] ? f.severity : acc),
      'info',
    );
  }

  private async setPatternEnabled(patternId: string, enabled: boolean): Promise<boolean> {
    const patterns = await this.loadPatterns();
    const target = patterns.find((p) => p.id === patternId);
    if (!target) return false;
    target.enabled = enabled;
    await this.store.set(STORE_KEYS.patterns, patterns);
    this.cachedPatterns = patterns;
    return true;
  }

  private stringifyValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map((v) => this.stringifyValue(v)).join(' ');
    if (value instanceof Date) return value.toISOString();
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  private generateId(): string {
    return `sqli-${randomUUID()}`;
  }

  private async loadPatterns(): Promise<SqlPattern[]> {
    if (this.patternsLoaded && this.cachedPatterns.length > 0) {
      return this.cachedPatterns;
    }
    const stored = await this.store.get<any[]>(STORE_KEYS.patterns);
    if (stored && stored.length > 0) {
      this.cachedPatterns = stored.map((p) => this.hydratePattern(p));
      this.patternsLoaded = true;
      return this.cachedPatterns;
    }
    const seeded = buildBuiltinPatterns();
    await this.store.set(STORE_KEYS.patterns, seeded);
    this.cachedPatterns = seeded;
    this.patternsLoaded = true;
    return seeded;
  }

  private hydratePattern(p: any): SqlPattern {
    if (p.pattern && typeof p.pattern.test === 'function') return p;
    const source = p.pattern?.source || p.pattern;
    const flags = p.pattern?.flags || 'i';
    return { ...p, pattern: new RegExp(source, flags) };
  }

  private async loadResults(): Promise<SqlInspectionResult[]> {
    const data = await this.store.get<SqlInspectionResult[]>(STORE_KEYS.results);
    return data ?? [];
  }
}
