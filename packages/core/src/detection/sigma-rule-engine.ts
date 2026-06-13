import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';
import { parse as parseYaml } from 'yaml';

export type SigmaStatus = 'experimental' | 'test' | 'stable' | 'deprecated';
export type SigmaLevel = 'informational' | 'low' | 'medium' | 'high' | 'critical';

export interface SigmaRule {
  id: string;
  title: string;
  description: string;
  status: SigmaStatus;
  level: SigmaLevel;
  author: string;
  date: string;
  modified: string;
  references: string[];
  tags: string[];
  logsource: {
    product: string;
    category: string;
    service?: string;
  };
  detection: {
    selection: Record<string, any> | Array<Record<string, any>>;
    condition: string;
    filter?: Record<string, any>;
    timeframe?: string;
  };
  falsepositives: string[];
  fields: string[];
  related: Array<{ type: 'similar' | 'derived' | 'obsolete'; id: string }>;
  tests: Array<{ name: string; expected: boolean; log: Record<string, any> }>;
}

export interface MatchResult {
  ruleId: string;
  ruleTitle: string;
  matched: boolean;
  confidence: number;
  matchedFields: string[];
  evaluation: string;
  timestamp: number;
}

export interface RuleEvaluation {
  rule: SigmaRule;
  result: MatchResult;
  log: Record<string, any>;
  durationMs: number;
}

export type ConversionTarget = 'splunk' | 'elasticsearch' | 'wazuh' | 'kql' | 'sql' | 'lucene';

export interface SigmaStats {
  total: number;
  byLevel: Record<SigmaLevel, number>;
  byStatus: Record<SigmaStatus, number>;
  mitreCoverage: { tactics: number; techniques: number };
}

interface MitreIndex {
  tactics: Set<string>;
  techniques: Set<string>;
}

interface TestResult {
  log: Record<string, any>;
  matched: boolean;
  expected: boolean;
}

const RULES_KEY = 'detection/sigma-rules.json';
const TESTS_KEY = 'detection/sigma-tests.json';

const LEVELS: SigmaLevel[] = ['informational', 'low', 'medium', 'high', 'critical'];
const STATUSES: SigmaStatus[] = ['experimental', 'test', 'stable', 'deprecated'];

const BUILTIN_RULES: SigmaRule[] = [
  {
    id: '8e2c4f0a-1d3b-4a4e-9b1c-2a0b1c2d3e4f',
    title: 'Suspicious PowerShell Encoded Command',
    description: 'Detects usage of PowerShell with encoded command arguments often used to obfuscate payloads',
    status: 'stable',
    level: 'high',
    author: 'SecuClaw',
    date: '2025-01-10',
    modified: '2025-01-10',
    references: [
      'https://attack.mitre.org/techniques/T1059/001/',
      'https://docs.microsoft.com/powershell/module/microsoft.powershell.core/start-process',
    ],
    tags: ['attack.execution', 'attack.t1059.001', 'attack.defense_evasion', 'attack.t1027'],
    logsource: { product: 'windows', category: 'process_creation', service: 'powershell' },
    detection: {
      selection: {
        Image: '*\\powershell.exe',
        CommandLine: ['*-EncodedCommand*', '*-enc *', '*-e *'],
      },
      filter: {
        CommandLine: '*SQBadmin*',
      },
      condition: 'selection and not filter',
    },
    falsepositives: ['Administrative scripts that legitimately use encoded commands'],
    fields: ['Image', 'CommandLine', 'User', 'ParentImage'],
    related: [],
    tests: [
      {
        name: 'Encoded PowerShell detected',
        expected: true,
        log: {
          Image: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
          CommandLine: 'powershell -EncodedCommand ZQBjAGgAbwAgACIAdABlAHMAdAAiAA==',
          User: 'CONTOSO\\alice',
        },
      },
      {
        name: 'Normal PowerShell',
        expected: false,
        log: {
          Image: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
          CommandLine: 'powershell -File C:\\scripts\\report.ps1',
        },
      },
    ],
  },
  {
    id: 'b1f2c3d4-5e6a-4b7c-8d9e-0f1a2b3c4d5e',
    title: 'SSH Brute Force Attempt',
    description: 'Multiple failed SSH authentication attempts originating from a single source',
    status: 'stable',
    level: 'medium',
    author: 'SecuClaw',
    date: '2025-01-12',
    modified: '2025-01-12',
    references: ['https://attack.mitre.org/techniques/T1110/001/'],
    tags: ['attack.credential_access', 'attack.t1110.001', 'attack.initial_access'],
    logsource: { product: 'linux', category: 'auth', service: 'sshd' },
    detection: {
      selection: {
        'event.type': 'ssh_login',
        status: 'failed',
      },
      condition: 'selection',
    },
    falsepositives: ['Misconfigured SSH clients, port scanners'],
    fields: ['source.ip', 'user.name', 'host.name'],
    related: [],
    tests: [
      {
        name: 'Failed login from external',
        expected: true,
        log: {
          'event.type': 'ssh_login',
          status: 'failed',
          'source.ip': '203.0.113.45',
          'user.name': 'root',
        },
      },
    ],
  },
  {
    id: 'c2d3e4f5-6a7b-4c8d-9e0f-1a2b3c4d5e6f',
    title: 'Web Shell File Creation',
    description: 'Detects creation of files with web shell indicators in web server directories',
    status: 'stable',
    level: 'critical',
    author: 'SecuClaw',
    date: '2025-01-15',
    modified: '2025-01-15',
    references: ['https://attack.mitre.org/techniques/T1505/003/'],
    tags: ['attack.persistence', 'attack.t1505.003', 'attack.t1190'],
    logsource: { product: 'linux', category: 'file_create', service: 'webserver' },
    detection: {
      selection: {
        'file.path': ['*/www/*', '*/htdocs/*', '*/public/*'],
        'file.extension': ['.php', '.jsp', '.aspx'],
      },
      condition: 'selection',
    },
    falsepositives: ['Legitimate web application deployments'],
    fields: ['file.path', 'file.name', 'process.executable'],
    related: [],
    tests: [
      {
        name: 'PHP web shell in webroot',
        expected: true,
        log: {
          'file.path': '/var/www/html/uploads/shell.php',
          'file.extension': '.php',
          'process.executable': '/usr/bin/wget',
        },
      },
    ],
  },
  {
    id: 'd3e4f5a6-7b8c-4d9e-af10-2b3c4d5e6f70',
    title: 'Kubernetes Privileged Pod',
    description: 'Detects creation of pods with privileged security context or host namespace access',
    status: 'stable',
    level: 'high',
    author: 'SecuClaw',
    date: '2025-01-18',
    modified: '2025-01-18',
    references: ['https://attack.mitre.org/techniques/T1611/'],
    tags: ['attack.privilege_escalation', 'attack.t1611', 'attack.t1078'],
    logsource: { product: 'kubernetes', category: 'audit', service: 'kube-apiserver' },
    detection: {
      selection: {
        'verb': 'create',
        'objectRef.resource': 'pods',
        'requestObject.spec.containers[*].securityContext.privileged': true,
      },
      condition: 'selection',
    },
    falsepositives: ['Trusted DaemonSets and system pods'],
    fields: ['user.username', 'objectRef.namespace', 'objectRef.name'],
    related: [],
    tests: [
      {
        name: 'Privileged pod created',
        expected: true,
        log: {
          verb: 'create',
          'objectRef.resource': 'pods',
          'objectRef.namespace': 'default',
          'user.username': 'attacker@cluster.local',
        },
      },
    ],
  },
  {
    id: 'e4f5a6b7-8c9d-4e0f-b120-3c4d5e6f7081',
    title: 'AWS S3 Bucket Policy Change',
    description: 'Detects modifications to S3 bucket policies that may indicate data exfiltration setup',
    status: 'stable',
    level: 'high',
    author: 'SecuClaw',
    date: '2025-01-20',
    modified: '2025-01-20',
    references: ['https://attack.mitre.org/techniques/T1530/'],
    tags: ['attack.exfiltration', 'attack.t1530', 'attack.t1078.004'],
    logsource: { product: 'aws', category: 'cloudtrail', service: 's3' },
    detection: {
      selection: {
        'eventSource': 's3.amazonaws.com',
        'eventName': ['PutBucketPolicy', 'DeleteBucketPolicy', 'PutBucketAcl'],
      },
      filter: {
        'userIdentity.arn': 'arn:aws:iam::*:role/aws-service-role/*',
      },
      condition: 'selection and not filter',
    },
    falsepositives: ['Authorized security tooling and admin activities'],
    fields: ['eventName', 'userIdentity.arn', 'requestParameters.bucketName', 'sourceIPAddress'],
    related: [],
    tests: [
      {
        name: 'Public bucket policy change',
        expected: true,
        log: {
          eventSource: 's3.amazonaws.com',
          eventName: 'PutBucketPolicy',
          'userIdentity.arn': 'arn:aws:iam::123456789012:user/attacker',
          sourceIPAddress: '198.51.100.10',
        },
      },
    ],
  },
  {
    id: 'f5a6b7c8-9d0e-4f10-bc21-4d5e6f708192',
    title: 'Mimikatz LSASS Access',
    description: 'Detects suspicious access to LSASS process handle by non-system processes',
    status: 'stable',
    level: 'critical',
    author: 'SecuClaw',
    date: '2025-01-22',
    modified: '2025-01-22',
    references: [
      'https://attack.mitre.org/techniques/T1003/001/',
      'https://attack.mitre.org/software/S0002/',
    ],
    tags: ['attack.credential_access', 'attack.t1003.001', 'attack.t1003'],
    logsource: { product: 'windows', category: 'sysmon', service: 'process_access' },
    detection: {
      selection: {
        'TargetImage': '*\\lsass.exe',
        'GrantedAccess': ['*0x1010', '*0x1410', '*0x1438'],
      },
      filter: {
        'SourceImage': [
          '*\\MsMpEng.exe',
          '*\\System32\\svchost.exe',
          '*\\wbengine.exe',
        ],
      },
      condition: 'selection and not filter',
    },
    falsepositives: ['Antivirus and EDR products'],
    fields: ['SourceImage', 'TargetImage', 'SourceProcessId', 'SourceUser'],
    related: [],
    tests: [
      {
        name: 'Mimikatz-style LSASS access',
        expected: true,
        log: {
          SourceImage: 'C:\\Tools\\mimikatz.exe',
          TargetImage: 'C:\\Windows\\System32\\lsass.exe',
          GrantedAccess: '0x1010',
        },
      },
    ],
  },
  {
    id: 'a6b7c8d9-0e1f-4a20-bd32-5e6f708192a3',
    title: 'Linux Passwd File Modification',
    description: 'Detects changes to /etc/passwd or /etc/shadow outside of expected administrative activity',
    status: 'stable',
    level: 'high',
    author: 'SecuClaw',
    date: '2025-01-25',
    modified: '2025-01-25',
    references: ['https://attack.mitre.org/techniques/T1098/'],
    tags: ['attack.persistence', 'attack.t1098', 'attack.privilege_escalation'],
    logsource: { product: 'linux', category: 'file_event', service: 'auditd' },
    detection: {
      selection: {
        'syscall': 'openat',
        'file.path': ['/etc/passwd', '/etc/shadow', '/etc/sudoers'],
        'event.type': ['write', 'modify', 'append'],
      },
      filter: {
        'process.executable': ['/usr/bin/vim', '/usr/bin/nano', '/usr/sbin/visudo'],
      },
      condition: 'selection and not filter',
    },
    falsepositives: ['Package managers, configuration management'],
    fields: ['process.executable', 'process.name', 'user.name', 'file.path'],
    related: [],
    tests: [
      {
        name: 'Passwd modified by suspicious tool',
        expected: true,
        log: {
          syscall: 'openat',
          'file.path': '/etc/passwd',
          'event.type': 'modify',
          'process.executable': '/tmp/evil',
          'user.name': 'www-data',
        },
      },
    ],
  },
];

export class SigmaRuleEngine {
  constructor(private store: JsonStore) {}

  async importRule(yamlContent: string): Promise<SigmaRule> {
    const parsed = parseYaml(yamlContent) as Partial<SigmaRule>;
    const rule = this.normalizeRule(parsed);
    if (!rule.id) {
      rule.id = this.generateId();
    }
    if (!rule.modified) {
      rule.modified = rule.date || new Date().toISOString().slice(0, 10);
    }
    const all = await this.loadAll();
    const idx = all.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      all[idx] = rule;
    } else {
      all.push(rule);
    }
    await this.saveAll(all);
    return rule;
  }

  async importBulk(yamlContents: string[]): Promise<SigmaRule[]> {
    const imported: SigmaRule[] = [];
    for (const content of yamlContents) {
      const rule = await this.importRule(content);
      imported.push(rule);
    }
    return imported;
  }

  async getRule(ruleId: string): Promise<SigmaRule | null> {
    const all = await this.loadAll();
    return all.find((r) => r.id === ruleId) ?? null;
  }

  async listRules(
    filters?: { level?: SigmaLevel; status?: SigmaStatus; tag?: string }
  ): Promise<SigmaRule[]> {
    const all = await this.loadAll();
    if (!filters) return all;
    return all.filter((r) => {
      if (filters.level && r.level !== filters.level) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.tag && !r.tags.includes(filters.tag)) return false;
      return true;
    });
  }

  async deleteRule(ruleId: string): Promise<boolean> {
    const all = await this.loadAll();
    const next = all.filter((r) => r.id !== ruleId);
    if (next.length === all.length) return false;
    await this.saveAll(next);
    return true;
  }

  async updateRule(
    ruleId: string,
    updates: Partial<SigmaRule>
  ): Promise<SigmaRule | null> {
    const all = await this.loadAll();
    const idx = all.findIndex((r) => r.id === ruleId);
    if (idx < 0) return null;
    const merged: SigmaRule = {
      ...all[idx],
      ...updates,
      id: all[idx].id,
      modified: new Date().toISOString().slice(0, 10),
    };
    all[idx] = merged;
    await this.saveAll(all);
    return merged;
  }

  async matchLog(
    log: Record<string, any>,
    rules?: SigmaRule[]
  ): Promise<RuleEvaluation[]> {
    const effective = rules && rules.length > 0 ? rules : await this.loadAll();
    const results: RuleEvaluation[] = [];
    for (const rule of effective) {
      results.push(await this.matchWithSingleRule(log, rule));
    }
    return results;
  }

  async matchWithSingleRule(
    log: Record<string, any>,
    rule: SigmaRule
  ): Promise<RuleEvaluation> {
    const start = Date.now();
    const evalResult = this.evaluateCondition(rule, log);
    const durationMs = Date.now() - start;
    const result: MatchResult = {
      ruleId: rule.id,
      ruleTitle: rule.title,
      matched: evalResult.matched,
      confidence: evalResult.confidence,
      matchedFields: evalResult.matchedFields,
      evaluation: evalResult.evaluation,
      timestamp: Date.now(),
    };
    return { rule, result, log, durationMs };
  }

  async testRule(
    rule: SigmaRule,
    testLogs: Record<string, any>[]
  ): Promise<{ passed: number; failed: number; results: TestResult[] }> {
    const results: TestResult[] = [];
    let passed = 0;
    let failed = 0;
    const cases = testLogs.length > 0 ? testLogs : rule.tests.map((t) => t.log);
    for (const log of cases) {
      const expected = rule.tests.find(
        (t) => JSON.stringify(t.log) === JSON.stringify(log)
      )?.expected ?? true;
      const evalResult = this.evaluateCondition(rule, log);
      const matched = evalResult.matched;
      if (matched === expected) {
        passed += 1;
      } else {
        failed += 1;
      }
      results.push({ log, matched, expected });
    }
    return { passed, failed, results };
  }

  convertRule(rule: SigmaRule, target: ConversionTarget): string {
    switch (target) {
      case 'splunk':
        return this.toSplunk(rule);
      case 'elasticsearch':
        return this.toElasticsearch(rule);
      case 'wazuh':
        return this.toWazuh(rule);
      case 'kql':
        return this.toKql(rule);
      case 'sql':
        return this.toSql(rule);
      case 'lucene':
        return this.toLucene(rule);
      default:
        throw new Error(`Unsupported target: ${target}`);
    }
  }

  async convertAll(
    target: ConversionTarget,
    filters?: { level?: SigmaLevel }
  ): Promise<Array<{ ruleId: string; target: ConversionTarget; query: string }>> {
    const rules = await this.listRules(filters);
    return rules.map((rule) => ({
      ruleId: rule.id,
      target,
      query: this.convertRule(rule, target),
    }));
  }

  async getStats(): Promise<SigmaStats> {
    const rules = await this.loadAll();
    const byLevel: Record<SigmaLevel, number> = {
      informational: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    const byStatus: Record<SigmaStatus, number> = {
      experimental: 0,
      test: 0,
      stable: 0,
      deprecated: 0,
    };
    for (const r of rules) {
      byLevel[r.level] = (byLevel[r.level] || 0) + 1;
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    }
    const mitreIndex = this.buildMitreIndex(rules);
    return {
      total: rules.length,
      byLevel,
      byStatus,
      mitreCoverage: {
        tactics: mitreIndex.tactics.size,
        techniques: mitreIndex.techniques.size,
      },
    };
  }

  async initialize(): Promise<void> {
    const existing = await this.store.get<SigmaRule[]>(RULES_KEY);
    if (!existing || existing.length === 0) {
      await this.saveAll(BUILTIN_RULES);
    }
  }

  private buildMitreIndex(rules: SigmaRule[]): MitreIndex {
    const tactics = new Set<string>();
    const techniques = new Set<string>();
    for (const rule of rules) {
      for (const tag of rule.tags) {
        const lower = tag.toLowerCase();
        if (lower.startsWith('attack.')) {
          const parts = lower.split('.');
          if (parts.length >= 2) {
            tactics.add(parts[1]);
          }
          for (const part of parts) {
            if (/^t\d{4}/.test(part)) {
              techniques.add(part);
            }
          }
        }
      }
    }
    return { tactics, techniques };
  }

  private evaluateCondition(
    rule: SigmaRule,
    log: Record<string, any>
  ): { matched: boolean; confidence: number; evaluation: string; matchedFields: string[] } {
    const conditionRaw = (rule.detection?.condition || 'selection').toLowerCase();
    const selections = this.normalizeSelections(rule.detection?.selection);
    const filter = rule.detection?.filter;
    const matchedFields: string[] = [];
    const matched: boolean = (() => {
      if (conditionRaw === 'selection') {
        const r = this.matchSelection(selections, log);
        matchedFields.push(...r.matchedFields);
        return r.matched;
      }
      if (conditionRaw === 'selection and not filter') {
        const sel = this.matchSelection(selections, log);
        const flt = filter
          ? this.matchSelection(this.normalizeSelections(filter), log)
          : { matched: false, matchedFields: [] as string[] };
        if (sel.matched) {
          matchedFields.push(...sel.matchedFields);
          if (!flt.matched) return true;
          return false;
        }
        return false;
      }
      if (conditionRaw === 'not selection') {
        return !this.matchSelection(selections, log).matched;
      }
      if (conditionRaw.startsWith('1 of them')) {
        for (const sel of selections) {
          const r = this.matchSelection([sel], log);
          if (r.matched) {
            matchedFields.push(...r.matchedFields);
            return true;
          }
        }
        return false;
      }
      if (conditionRaw.startsWith('all of them')) {
        if (selections.length === 0) return false;
        for (const sel of selections) {
          const r = this.matchSelection([sel], log);
          if (!r.matched) return false;
          matchedFields.push(...r.matchedFields);
        }
        return true;
      }
      const r = this.matchSelection(selections, log);
      matchedFields.push(...r.matchedFields);
      return r.matched;
    })();

    const confidence = matched ? this.confidenceForLevel(rule.level) : 0;
    const evaluation = `condition=${conditionRaw} | matched=${matched} | fields=[${matchedFields.join(',')}]`;
    return { matched, confidence, evaluation, matchedFields: Array.from(new Set(matchedFields)) };
  }

  private matchSelection(
    selection: Record<string, any> | Array<Record<string, any>>,
    log: Record<string, any>
  ): { matched: boolean; matchedFields: string[] } {
    const arr = Array.isArray(selection) ? selection : [selection];
    if (arr.length === 0) return { matched: false, matchedFields: [] };
    const allMatchedFields: string[] = [];
    for (const sel of arr) {
      const keys = Object.keys(sel);
      let allMatch = true;
      const localFields: string[] = [];
      for (const key of keys) {
        const expected = sel[key];
        const actual = this.resolveField(log, key);
        if (!this.matchesValue(actual, expected)) {
          allMatch = false;
          break;
        }
        localFields.push(key);
      }
      if (allMatch) {
        allMatchedFields.push(...localFields);
        return { matched: true, matchedFields: localFields };
      }
    }
    return { matched: false, matchedFields: allMatchedFields };
  }

  private resolveField(log: Record<string, any>, key: string): any {
    if (key in log) return log[key];
    const parts = key.split('.');
    let cur: any = log;
    for (const p of parts) {
      if (cur && typeof cur === 'object' && p in cur) {
        cur = cur[p];
      } else {
        return undefined;
      }
    }
    return cur;
  }

  private matchesValue(actual: any, expected: any): boolean {
    if (Array.isArray(expected)) {
      if (Array.isArray(actual)) {
        return actual.some((a) => expected.some((e) => this.matchesValue(a, e)));
      }
      return expected.some((e) => this.matchesValue(actual, e));
    }
    if (expected instanceof RegExp) {
      return typeof actual === 'string' && expected.test(actual);
    }
    if (typeof expected === 'string') {
      if (expected.includes('*') || expected.includes('?')) {
        return this.wildcardMatch(expected, String(actual ?? ''));
      }
      return String(actual ?? '') === expected;
    }
    if (typeof expected === 'number') {
      return typeof actual === 'number' && actual === expected;
    }
    if (typeof expected === 'boolean') {
      return actual === expected;
    }
    return actual === expected;
  }

  private wildcardMatch(pattern: string, value: string): boolean {
    const regex = new RegExp(
      '^' + pattern.split('*').map(escapeRegex).join('.*').split('?').map((s) => s.split('.*').join('.*')).join('.') + '$'
    );
    const simpler = '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$';
    return new RegExp(simpler).test(value);
  }

  private normalizeSelections(
    selection: Record<string, any> | Array<Record<string, any>> | undefined
  ): Array<Record<string, any>> {
    if (!selection) return [];
    return Array.isArray(selection) ? selection : [selection];
  }

  private normalizeRule(parsed: Partial<SigmaRule>): SigmaRule {
    const today = new Date().toISOString().slice(0, 10);
    const detection: SigmaRule['detection'] = parsed.detection ?? { selection: {}, condition: 'selection' };
    const level = (LEVELS.includes(parsed.level as SigmaLevel)
      ? parsed.level
      : 'medium') as SigmaLevel;
    const status = (STATUSES.includes(parsed.status as SigmaStatus)
      ? parsed.status
      : 'experimental') as SigmaStatus;
    return {
      id: parsed.id || this.generateId(),
      title: parsed.title || 'Untitled Rule',
      description: parsed.description || '',
      status,
      level,
      author: parsed.author || 'unknown',
      date: parsed.date || today,
      modified: parsed.modified || today,
      references: parsed.references || [],
      tags: parsed.tags || [],
      logsource: {
        product: parsed.logsource?.product || '',
        category: parsed.logsource?.category || '',
        service: parsed.logsource?.service,
      },
      detection: {
        selection: detection.selection || {},
        condition: detection.condition || 'selection',
        filter: detection.filter,
        timeframe: detection.timeframe,
      },
      falsepositives: parsed.falsepositives || [],
      fields: parsed.fields || [],
      related: (parsed.related || []) as SigmaRule['related'],
      tests: parsed.tests || [],
    };
  }

  private confidenceForLevel(level: SigmaLevel): number {
    switch (level) {
      case 'critical':
        return 0.95;
      case 'high':
        return 0.85;
      case 'medium':
        return 0.7;
      case 'low':
        return 0.55;
      case 'informational':
        return 0.4;
      default:
        return 0.5;
    }
  }

  private toSplunk(rule: SigmaRule): string {
    const sel = Array.isArray(rule.detection.selection)
      ? rule.detection.selection[0]
      : rule.detection.selection;
    const parts = Object.entries(sel || {}).map(([k, v]) => this.toSplunkFragment(k, v));
    return parts.join(' AND ');
  }

  private toSplunkFragment(key: string, value: any): string {
    if (Array.isArray(value)) {
      const ors = value.map((v) => this.toSplunkFragment(key, v));
      return `(${ors.join(' OR ')})`;
    }
    if (typeof value === 'string') {
      if (value.includes('*')) {
        return `${key}=${value}`;
      }
      return `${key}="${value}"`;
    }
    return `${key}=${JSON.stringify(value)}`;
  }

  private toElasticsearch(rule: SigmaRule): string {
    const sel = Array.isArray(rule.detection.selection)
      ? rule.detection.selection[0]
      : rule.detection.selection;
    const must: any[] = [];
    const should: any[] = [];
    for (const [k, v] of Object.entries(sel || {})) {
      if (Array.isArray(v)) {
        should.push(...v.map((x) => ({ match_phrase: { [k]: String(x) } })));
      } else if (typeof v === 'string' && v.includes('*')) {
        must.push({ wildcard: { [k]: { value: v, case_insensitive: true } } });
      } else {
        must.push({ match: { [k]: v } });
      }
    }
    return JSON.stringify({ bool: { must, should, minimum_should_match: should.length > 0 ? 1 : 0 } });
  }

  private toWazuh(rule: SigmaRule): string {
    const sel = Array.isArray(rule.detection.selection)
      ? rule.detection.selection[0]
      : rule.detection.selection;
    const parts: string[] = [];
    for (const [k, v] of Object.entries(sel || {})) {
      if (Array.isArray(v)) {
        parts.push(`(${v.map((x) => `${k}:${x}`).join(' OR ')})`);
      } else {
        parts.push(`${k}:${v}`);
      }
    }
    const base = parts.join(' AND ');
    const ruleXml = `<rule id="${rule.id}" level="${this.levelToInt(rule.level)}">\n` +
      `  <description>${this.escapeXml(rule.title)}</description>\n` +
      `  <match>${this.escapeXml(base)}</match>\n` +
      `</rule>`;
    return ruleXml;
  }

  private toKql(rule: SigmaRule): string {
    const sel = Array.isArray(rule.detection.selection)
      ? rule.detection.selection[0]
      : rule.detection.selection;
    const parts: string[] = [];
    for (const [k, v] of Object.entries(sel || {})) {
      if (Array.isArray(v)) {
        parts.push(`(${v.map((x) => `${k} == "${x}"`).join(' or ')})`);
      } else if (typeof v === 'string' && v.includes('*')) {
        parts.push(`${k} matches regex "${this.wildcardToRegex(v)}"`);
      } else {
        parts.push(`${k} == "${v}"`);
      }
    }
    return parts.join(' and ');
  }

  private toSql(rule: SigmaRule): string {
    const sel = Array.isArray(rule.detection.selection)
      ? rule.detection.selection[0]
      : rule.detection.selection;
    const conditions: string[] = [];
    for (const [k, v] of Object.entries(sel || {})) {
      if (Array.isArray(v)) {
        const orParts = v.map((x) => {
          if (typeof x === 'string' && x.includes('*')) {
            return `${k} LIKE '${x.replace(/\*/g, '%')}'`;
          }
          return `${k} = '${x}'`;
        });
        conditions.push(`(${orParts.join(' OR ')})`);
      } else if (typeof v === 'string' && v.includes('*')) {
        conditions.push(`${k} LIKE '${v.replace(/\*/g, '%')}'`);
      } else {
        conditions.push(`${k} = '${v}'`);
      }
    }
    return `SELECT * FROM logs WHERE ${conditions.join(' AND ')}`;
  }

  private toLucene(rule: SigmaRule): string {
    const sel = Array.isArray(rule.detection.selection)
      ? rule.detection.selection[0]
      : rule.detection.selection;
    const parts: string[] = [];
    for (const [k, v] of Object.entries(sel || {})) {
      if (Array.isArray(v)) {
        parts.push(`(${v.map((x) => `${k}:"${x}"`).join(' OR ')})`);
      } else {
        parts.push(`${k}:"${v}"`);
      }
    }
    return parts.join(' AND ');
  }

  private wildcardToRegex(pattern: string): string {
    return pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  }

  private levelToInt(level: SigmaLevel): number {
    switch (level) {
      case 'critical':
        return 15;
      case 'high':
        return 12;
      case 'medium':
        return 8;
      case 'low':
        return 5;
      case 'informational':
        return 2;
      default:
        return 3;
    }
  }

  private escapeXml(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private generateId(): string {
    try {
      return randomUUID();
    } catch {
      return `${Date.now()}-${Math.floor(Math.random() * 1_000_000).toString(16)}`;
    }
  }

  private async loadAll(): Promise<SigmaRule[]> {
    const stored = await this.store.get<SigmaRule[]>(RULES_KEY);
    if (stored && stored.length > 0) return stored;
    await this.saveAll(BUILTIN_RULES);
    return [...BUILTIN_RULES];
  }

  private async saveAll(rules: SigmaRule[]): Promise<void> {
    await this.store.set(RULES_KEY, rules);
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const SIGMA_RULES_STORE_KEY = RULES_KEY;
export const SIGMA_TESTS_STORE_KEY = TESTS_KEY;
export const BUILTIN_SIGMA_RULES = BUILTIN_RULES;
