import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type McpToolRiskLevel = 'safe' | 'low' | 'medium' | 'high' | 'critical';

export type McpToolStatus = 'active' | 'quarantined' | 'disabled' | 'review';

export type McpToolCategory =
  | 'file_system'
  | 'network'
  | 'shell'
  | 'database'
  | 'api_call'
  | 'browser'
  | 'code_exec'
  | 'auth'
  | 'message'
  | 'data_transfer'
  | 'system'
  | 'other';

export type DataSensitivity =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'top_secret';

export interface McpToolPermissions {
  readFiles: boolean;
  writeFiles: boolean;
  executeCommands: boolean;
  networkAccess: boolean;
  accessTokens: string[];
  sensitiveDataAccess: DataSensitivity;
}

export interface McpToolDataEgress {
  canUpload: boolean;
  canDownload: boolean;
  allowedDestinations: string[];
}

export interface McpToolRiskFactor {
  factor: string;
  weight: number;
  description: string;
}

export interface McpToolExampleInvocation {
  input: Record<string, any>;
  risk: McpToolRiskLevel;
  reason: string;
}

export interface McpTool {
  id: string;
  name: string;
  server: string;
  version: string;
  description: string;
  category: McpToolCategory;
  status: McpToolStatus;
  riskLevel: McpToolRiskLevel;
  riskScore: number;
  riskFactors: McpToolRiskFactor[];
  capabilities: string[];
  permissions: McpToolPermissions;
  dataEgress: McpToolDataEgress;
  inputSchema: Record<string, any>;
  exampleInvocations: McpToolExampleInvocation[];
  lastAudited: number | null;
  auditNotes: string;
  createdAt: number;
  trustScore: number;
  installedBy: string;
  usageCount: number;
  lastUsedAt: number | null;
}

export interface McpToolWhitelist {
  id: string;
  name: string;
  description: string;
  toolIds: string[];
  roleId: string;
  createdAt: number;
  createdBy: string;
}

export interface RiskEvaluationFactor {
  factor: string;
  score: number;
  description: string;
}

export interface RiskEvaluation {
  tool: McpTool;
  input: Record<string, any>;
  riskScore: number;
  riskLevel: McpToolRiskLevel;
  factors: RiskEvaluationFactor[];
  shouldBlock: boolean;
  shouldQuarantine: boolean;
  requiresApproval: boolean;
  warnings: string[];
  recommendations: string[];
}

export interface McpToolStats {
  total: number;
  byRiskLevel: Record<McpToolRiskLevel, number>;
  byStatus: Record<McpToolStatus, number>;
  byCategory: Record<McpToolCategory, number>;
  highRiskCount: number;
}

const TOOLS_KEY = 'ai-scm/mcp-tools.json';
const WHITELISTS_KEY = 'ai-scm/mcp-whitelists.json';

const SYSTEM_DIRECTORIES = [
  '/etc',
  '/etc/passwd',
  '/etc/shadow',
  '/var',
  '/usr',
  '/bin',
  '/sbin',
  '/boot',
  '/root',
  '/sys',
  '/proc',
  'c:\\windows',
  'c:\\system32',
  'c:\\program files',
];

const CREDENTIAL_KEYWORDS = [
  'password',
  'passwd',
  'secret',
  'credential',
  'api_key',
  'apikey',
  'api-key',
  'token',
  'private_key',
  'privatekey',
  'access_key',
  'aws_secret',
  'auth',
];

const INCIDENT_KEYWORDS = ['incident', 'breach', 'compromise', 'abuse', 'misuse'];

export class McpRiskScorer {
  constructor(private store: JsonStore) {}

  async registerTool(
    tool: Omit<McpTool, 'id' | 'createdAt' | 'usageCount' | 'trustScore'>,
  ): Promise<McpTool> {
    const evaluation = this.computeRiskScore(tool as McpTool);
    const fullTool: McpTool = {
      ...tool,
      id: this.generateId(),
      createdAt: Date.now(),
      usageCount: 0,
      trustScore: this.computeTrustScore(tool as McpTool),
      riskScore: evaluation.score,
      riskLevel: evaluation.level,
      riskFactors: evaluation.factors.map((f) => ({
        factor: f.factor,
        weight: f.score,
        description: f.description,
      })),
    };

    const tools = await this.loadTools();
    tools.push(fullTool);
    await this.saveTools(tools);

    return fullTool;
  }

  async updateTool(
    toolId: string,
    updates: Partial<McpTool>,
  ): Promise<McpTool | null> {
    const tools = await this.loadTools();
    const index = tools.findIndex((t) => t.id === toolId);
    if (index === -1) return null;

    const updated: McpTool = { ...tools[index], ...updates, id: tools[index].id };
    const evaluation = this.computeRiskScore(updated);
    updated.riskScore = evaluation.score;
    updated.riskLevel = evaluation.level;
    updated.riskFactors = evaluation.factors.map((f) => ({
      factor: f.factor,
      weight: f.score,
      description: f.description,
    }));
    updated.trustScore = this.computeTrustScore(updated);

    tools[index] = updated;
    await this.saveTools(tools);
    return updated;
  }

  async getTool(toolId: string): Promise<McpTool | null> {
    const tools = await this.loadTools();
    return tools.find((t) => t.id === toolId) ?? null;
  }

  async listTools(filters?: {
    category?: McpToolCategory;
    status?: McpToolStatus;
    riskLevel?: McpToolRiskLevel;
  }): Promise<McpTool[]> {
    const tools = await this.loadTools();
    let result = [...tools];

    if (filters?.category) {
      result = result.filter((t) => t.category === filters.category);
    }
    if (filters?.status) {
      result = result.filter((t) => t.status === filters.status);
    }
    if (filters?.riskLevel) {
      result = result.filter((t) => t.riskLevel === filters.riskLevel);
    }

    return result.sort((a, b) => b.riskScore - a.riskScore);
  }

  async disableTool(toolId: string, reason: string): Promise<boolean> {
    const updated = await this.updateTool(toolId, {
      status: 'disabled',
      auditNotes: reason,
    });
    return updated !== null;
  }

  async quarantineTool(toolId: string, reason: string): Promise<boolean> {
    const updated = await this.updateTool(toolId, {
      status: 'quarantined',
      auditNotes: reason,
    });
    return updated !== null;
  }

  async evaluateInvocation(
    toolId: string,
    input: Record<string, any>,
  ): Promise<RiskEvaluation | null> {
    const tool = await this.getTool(toolId);
    if (!tool) return null;

    const result = this.computeRiskScore(tool, input);

    const evaluation: RiskEvaluation = {
      tool,
      input,
      riskScore: result.score,
      riskLevel: result.level,
      factors: result.factors,
      shouldBlock:
        tool.status === 'disabled' ||
        result.level === 'critical' ||
        (tool.status === 'quarantined' && result.level !== 'safe'),
      shouldQuarantine:
        tool.status === 'active' &&
        result.level === 'critical' &&
        result.score >= 90,
      requiresApproval:
        result.level === 'high' ||
        result.level === 'critical' ||
        tool.status === 'review',
      warnings: result.warnings,
      recommendations: result.recommendations,
    };

    return evaluation;
  }

  async evaluateAllTools(): Promise<
    {
      toolId: string;
      riskScore: number;
      riskLevel: McpToolRiskLevel;
      recommendations: string[];
    }[]
  > {
    const tools = await this.loadTools();
    return tools.map((tool) => {
      const result = this.computeRiskScore(tool);
      return {
        toolId: tool.id,
        riskScore: result.score,
        riskLevel: result.level,
        recommendations: result.recommendations,
      };
    });
  }

  async getHighRiskTools(): Promise<McpTool[]> {
    const tools = await this.loadTools();
    return tools
      .filter((t) => t.riskLevel === 'high' || t.riskLevel === 'critical')
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  async createWhitelist(
    whitelist: Omit<McpToolWhitelist, 'id' | 'createdAt'>,
  ): Promise<McpToolWhitelist> {
    const full: McpToolWhitelist = {
      ...whitelist,
      id: this.generateId(),
      createdAt: Date.now(),
    };

    const whitelists = await this.loadWhitelists();
    whitelists.push(full);
    await this.saveWhitelists(whitelists);
    return full;
  }

  async listWhitelists(roleId?: string): Promise<McpToolWhitelist[]> {
    const whitelists = await this.loadWhitelists();
    if (!roleId) return [...whitelists];
    return whitelists.filter((w) => w.roleId === roleId);
  }

  async deleteWhitelist(whitelistId: string): Promise<boolean> {
    const whitelists = await this.loadWhitelists();
    const filtered = whitelists.filter((w) => w.id !== whitelistId);
    if (filtered.length === whitelists.length) return false;
    await this.saveWhitelists(filtered);
    return true;
  }

  async isToolAllowed(toolId: string, roleId: string): Promise<boolean> {
    const tool = await this.getTool(toolId);
    if (!tool) return false;
    if (tool.status === 'disabled' || tool.status === 'quarantined') return false;

    const whitelists = await this.loadWhitelists();
    const matched = whitelists.filter(
      (w) => w.roleId === roleId && w.toolIds.includes(toolId),
    );
    return matched.length > 0;
  }

  async recordUsage(toolId: string): Promise<void> {
    const tools = await this.loadTools();
    const index = tools.findIndex((t) => t.id === toolId);
    if (index === -1) return;

    tools[index] = {
      ...tools[index],
      usageCount: tools[index].usageCount + 1,
      lastUsedAt: Date.now(),
    };
    await this.saveTools(tools);
  }

  async getStats(): Promise<McpToolStats> {
    const tools = await this.loadTools();
    const byRiskLevel: Record<McpToolRiskLevel, number> = {
      safe: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    const byStatus: Record<McpToolStatus, number> = {
      active: 0,
      quarantined: 0,
      disabled: 0,
      review: 0,
    };
    const byCategory: Record<McpToolCategory, number> = {
      file_system: 0,
      network: 0,
      shell: 0,
      database: 0,
      api_call: 0,
      browser: 0,
      code_exec: 0,
      auth: 0,
      message: 0,
      data_transfer: 0,
      system: 0,
      other: 0,
    };

    let highRiskCount = 0;
    for (const tool of tools) {
      byRiskLevel[tool.riskLevel]++;
      byStatus[tool.status]++;
      byCategory[tool.category]++;
      if (tool.riskLevel === 'high' || tool.riskLevel === 'critical') {
        highRiskCount++;
      }
    }

    return {
      total: tools.length,
      byRiskLevel,
      byStatus,
      byCategory,
      highRiskCount,
    };
  }

  private computeRiskScore(
    tool: McpTool,
    input?: Record<string, any>,
  ): {
    score: number;
    level: McpToolRiskLevel;
    factors: RiskEvaluationFactor[];
    warnings: string[];
    recommendations: string[];
  } {
    const factors: RiskEvaluationFactor[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let total = 0;

    if (tool.permissions.executeCommands) {
      total += 30;
      factors.push({
        factor: 'executeCommands',
        score: 30,
        description: 'Tool can execute shell commands on the host',
      });
      warnings.push('Tool can execute arbitrary shell commands');
      recommendations.push('Restrict command execution to a sandbox or allowlist');
    }

    if (tool.permissions.accessTokens && tool.permissions.accessTokens.length > 0) {
      total += 25;
      factors.push({
        factor: 'accessTokens',
        score: 25,
        description: `Tool has access to ${tool.permissions.accessTokens.length} token(s)`,
      });
      warnings.push('Tool has access to secret tokens or credentials');
      recommendations.push('Rotate tokens regularly and monitor their usage');
    }

    switch (tool.permissions.sensitiveDataAccess) {
      case 'top_secret':
        total += 25;
        factors.push({
          factor: 'sensitiveDataAccess:top_secret',
          score: 25,
          description: 'Tool can access top-secret data',
        });
        warnings.push('Tool has access to top-secret data');
        recommendations.push('Require dual approval for invocations');
        break;
      case 'restricted':
        total += 15;
        factors.push({
          factor: 'sensitiveDataAccess:restricted',
          score: 15,
          description: 'Tool can access restricted data',
        });
        warnings.push('Tool has access to restricted data');
        recommendations.push('Require explicit approval before invocation');
        break;
      case 'confidential':
        total += 8;
        factors.push({
          factor: 'sensitiveDataAccess:confidential',
          score: 8,
          description: 'Tool can access confidential data',
        });
        recommendations.push('Log all invocations and audit outputs');
        break;
    }

    if (tool.dataEgress.canUpload) {
      total += 15;
      factors.push({
        factor: 'canUpload',
        score: 15,
        description: 'Tool can upload data to external destinations',
      });
      warnings.push('Tool can exfiltrate data via upload');
      recommendations.push('Restrict allowed destinations to a verified allowlist');
    }

    if (tool.permissions.writeFiles) {
      total += 10;
      factors.push({
        factor: 'writeFiles',
        score: 10,
        description: 'Tool can write to the file system',
      });
      recommendations.push('Scope write access to a sandboxed directory');
    }

    if (input) {
      const flat = JSON.stringify(input).toLowerCase();
      const hasCredential = CREDENTIAL_KEYWORDS.some((k) => flat.includes(k));
      if (hasCredential) {
        total += 20;
        factors.push({
          factor: 'input:credentials',
          score: 20,
          description: 'Invocation input contains credentials or secrets',
        });
        warnings.push('Input contains sensitive credentials');
        recommendations.push('Strip secrets from inputs before forwarding to the tool');
      }

      const hasSystemPath = SYSTEM_DIRECTORIES.some((dir) =>
        flat.includes(dir.toLowerCase()),
      );
      if (hasSystemPath) {
        total += 15;
        factors.push({
          factor: 'input:system_path',
          score: 15,
          description: 'Invocation input references a system directory',
        });
        warnings.push('Input targets sensitive system directories');
        recommendations.push('Validate file paths against an allowlist of safe directories');
      }
    }

    if (tool.category === 'shell' || tool.category === 'code_exec') {
      recommendations.push('Capture full transcripts for after-action review');
    }

    if (tool.status === 'quarantined') {
      warnings.push('Tool is currently quarantined');
      recommendations.push('Review quarantine reason and reset status only after audit');
    }

    if (tool.status === 'disabled') {
      warnings.push('Tool is disabled and should not be invoked');
    }

    const score = Math.max(0, Math.min(100, total));
    const level = this.scoreToLevel(score);

    return { score, level, factors, warnings, recommendations };
  }

  private computeTrustScore(tool: McpTool): number {
    let score = 50;

    const versionStable = !/alpha|beta|rc|pre|dev|snapshot/i.test(tool.version);
    const ageMs = Date.now() - tool.createdAt;
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (versionStable && ageDays > 30) {
      score += 20;
    }

    if (tool.lastAudited) {
      const auditAgeMs = Date.now() - tool.lastAudited;
      const auditAgeDays = auditAgeMs / (1000 * 60 * 60 * 24);
      if (auditAgeDays <= 30) {
        score += 10;
      }
    }

    if (tool.installedBy && tool.installedBy.toLowerCase() === 'admin') {
      score += 10;
    }

    const notes = (tool.auditNotes || '').toLowerCase();
    if (INCIDENT_KEYWORDS.some((k) => notes.includes(k))) {
      score -= 30;
    }

    if (tool.status === 'quarantined') {
      score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }

  private scoreToLevel(score: number): McpToolRiskLevel {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'safe';
  }

  private generateId(): string {
    return randomUUID();
  }

  private async loadTools(): Promise<McpTool[]> {
    const raw = await this.store.get<McpTool[]>(TOOLS_KEY);
    if (!raw || raw.length === 0) {
      const seeded = await this.seedBuiltInTools();
      await this.saveTools(seeded);
      return seeded;
    }
    return raw;
  }

  private async saveTools(tools: McpTool[]): Promise<void> {
    await this.store.set(TOOLS_KEY, tools);
  }

  private async loadWhitelists(): Promise<McpToolWhitelist[]> {
    const raw = await this.store.get<McpToolWhitelist[]>(WHITELISTS_KEY);
    return raw ?? [];
  }

  private async saveWhitelists(whitelists: McpToolWhitelist[]): Promise<void> {
    await this.store.set(WHITELISTS_KEY, whitelists);
  }

  private async seedBuiltInTools(): Promise<McpTool[]> {
    const now = Date.now();
    const day = 1000 * 60 * 60 * 24;
    const adminId = 'admin';

    const blueprints: Array<Omit<McpTool, 'id' | 'createdAt' | 'usageCount' | 'trustScore'>> = [
      {
        name: 'filesystem-read',
        server: 'filesystem-mcp',
        version: '1.4.2',
        description: 'Read files and list directories from the local file system',
        category: 'file_system',
        status: 'active',
        riskLevel: 'low',
        riskScore: 0,
        riskFactors: [],
        capabilities: ['read_file', 'list_directory', 'stat'],
        permissions: {
          readFiles: true,
          writeFiles: false,
          executeCommands: false,
          networkAccess: false,
          accessTokens: [],
          sensitiveDataAccess: 'internal',
        },
        dataEgress: {
          canUpload: false,
          canDownload: false,
          allowedDestinations: [],
        },
        inputSchema: {
          type: 'object',
          properties: { path: { type: 'string' } },
          required: ['path'],
        },
        exampleInvocations: [
          {
            input: { path: '/srv/reports/q1.pdf' },
            risk: 'low',
            reason: 'Read-only access to a benign file path',
          },
        ],
        lastAudited: now - 5 * day,
        auditNotes: 'Audited by secops; low risk, scoped to /srv',
        installedBy: adminId,
        lastUsedAt: null,
      },
      {
        name: 'filesystem-write',
        server: 'filesystem-mcp',
        version: '1.4.2',
        description: 'Write or append to files in allowed directories',
        category: 'file_system',
        status: 'active',
        riskLevel: 'medium',
        riskScore: 0,
        riskFactors: [],
        capabilities: ['write_file', 'append_file', 'create_directory'],
        permissions: {
          readFiles: true,
          writeFiles: true,
          executeCommands: false,
          networkAccess: false,
          accessTokens: [],
          sensitiveDataAccess: 'internal',
        },
        dataEgress: {
          canUpload: false,
          canDownload: false,
          allowedDestinations: [],
        },
        inputSchema: {
          type: 'object',
          properties: { path: { type: 'string' }, content: { type: 'string' } },
          required: ['path', 'content'],
        },
        exampleInvocations: [
          {
            input: { path: '/srv/reports/summary.txt', content: 'OK' },
            risk: 'medium',
            reason: 'Writes a file to an allowed directory',
          },
        ],
        lastAudited: now - 10 * day,
        auditNotes: 'Write access limited to /srv',
        installedBy: adminId,
        lastUsedAt: null,
      },
      {
        name: 'shell-exec',
        server: 'shell-mcp',
        version: '2.1.0',
        description: 'Execute shell commands on the host',
        category: 'shell',
        status: 'review',
        riskLevel: 'high',
        riskScore: 0,
        riskFactors: [],
        capabilities: ['exec_command', 'spawn_process'],
        permissions: {
          readFiles: true,
          writeFiles: true,
          executeCommands: true,
          networkAccess: true,
          accessTokens: [],
          sensitiveDataAccess: 'confidential',
        },
        dataEgress: {
          canUpload: true,
          canDownload: true,
          allowedDestinations: ['*'],
        },
        inputSchema: {
          type: 'object',
          properties: { command: { type: 'string' } },
          required: ['command'],
        },
        exampleInvocations: [
          {
            input: { command: 'ls -la /tmp' },
            risk: 'high',
            reason: 'Shell execution with broad host access',
          },
        ],
        lastAudited: now - 45 * day,
        auditNotes: 'Pending security review; restrict to admin role only',
        installedBy: 'devops',
        lastUsedAt: null,
      },
      {
        name: 'network-fetch',
        server: 'http-mcp',
        version: '3.0.1',
        description: 'Fetch arbitrary URLs via HTTP/HTTPS',
        category: 'network',
        status: 'active',
        riskLevel: 'medium',
        riskScore: 0,
        riskFactors: [],
        capabilities: ['http_get', 'http_post', 'stream'],
        permissions: {
          readFiles: false,
          writeFiles: false,
          executeCommands: false,
          networkAccess: true,
          accessTokens: [],
          sensitiveDataAccess: 'public',
        },
        dataEgress: {
          canUpload: true,
          canDownload: true,
          allowedDestinations: ['api.example.com', 'cdn.example.com'],
        },
        inputSchema: {
          type: 'object',
          properties: { url: { type: 'string' }, method: { type: 'string' } },
          required: ['url'],
        },
        exampleInvocations: [
          {
            input: { url: 'https://api.example.com/health' },
            risk: 'medium',
            reason: 'Egress to an allowed external API',
          },
        ],
        lastAudited: now - 7 * day,
        auditNotes: 'Domain allowlist enforced',
        installedBy: adminId,
        lastUsedAt: null,
      },
      {
        name: 'database-query',
        server: 'postgres-mcp',
        version: '2.5.0',
        description: 'Run read-only SQL queries against the warehouse',
        category: 'database',
        status: 'active',
        riskLevel: 'medium',
        riskScore: 0,
        riskFactors: [],
        capabilities: ['select', 'explain'],
        permissions: {
          readFiles: false,
          writeFiles: false,
          executeCommands: false,
          networkAccess: true,
          accessTokens: ['warehouse-readonly'],
          sensitiveDataAccess: 'confidential',
        },
        dataEgress: {
          canUpload: false,
          canDownload: true,
          allowedDestinations: ['warehouse.internal'],
        },
        inputSchema: {
          type: 'object',
          properties: { sql: { type: 'string' } },
          required: ['sql'],
        },
        exampleInvocations: [
          {
            input: { sql: 'SELECT count(*) FROM users' },
            risk: 'medium',
            reason: 'Read-only query against warehouse',
          },
        ],
        lastAudited: now - 14 * day,
        auditNotes: 'Read-only role enforced at the database',
        installedBy: adminId,
        lastUsedAt: null,
      },
      {
        name: 'database-write',
        server: 'postgres-mcp',
        version: '2.5.0',
        description: 'Insert, update, or delete rows in the warehouse',
        category: 'database',
        status: 'active',
        riskLevel: 'high',
        riskScore: 0,
        riskFactors: [],
        capabilities: ['insert', 'update', 'delete', 'transaction'],
        permissions: {
          readFiles: false,
          writeFiles: true,
          executeCommands: false,
          networkAccess: true,
          accessTokens: ['warehouse-readonly', 'warehouse-write'],
          sensitiveDataAccess: 'restricted',
        },
        dataEgress: {
          canUpload: false,
          canDownload: true,
          allowedDestinations: ['warehouse.internal'],
        },
        inputSchema: {
          type: 'object',
          properties: { sql: { type: 'string' }, params: { type: 'array' } },
          required: ['sql'],
        },
        exampleInvocations: [
          {
            input: { sql: 'UPDATE users SET last_login=now() WHERE id=$1', params: [42] },
            risk: 'high',
            reason: 'Mutates production warehouse state',
          },
        ],
        lastAudited: now - 60 * day,
        auditNotes: 'Re-audit recommended; write access to restricted tables',
        installedBy: 'data-eng',
        lastUsedAt: null,
      },
      {
        name: 'code-execute',
        server: 'python-mcp',
        version: '0.9.0',
        description: 'Run arbitrary Python code in a sandboxed interpreter',
        category: 'code_exec',
        status: 'review',
        riskLevel: 'critical',
        riskScore: 0,
        riskFactors: [],
        capabilities: ['eval', 'exec', 'import'],
        permissions: {
          readFiles: true,
          writeFiles: true,
          executeCommands: true,
          networkAccess: true,
          accessTokens: ['python-runtime', 's3-read'],
          sensitiveDataAccess: 'top_secret',
        },
        dataEgress: {
          canUpload: true,
          canDownload: true,
          allowedDestinations: ['*'],
        },
        inputSchema: {
          type: 'object',
          properties: { code: { type: 'string' } },
          required: ['code'],
        },
        exampleInvocations: [
          {
            input: { code: 'import os; os.system("ls")' },
            risk: 'critical',
            reason: 'Sandbox can be escaped to execute shell commands',
          },
        ],
        lastAudited: now - 90 * day,
        auditNotes: 'Prior incident: sandbox escape attempted 2025-04-12',
        installedBy: 'data-eng',
        lastUsedAt: null,
      },
      {
        name: 'secret-read',
        server: 'vault-mcp',
        version: '1.0.0',
        description: 'Read secrets from the central vault',
        category: 'auth',
        status: 'active',
        riskLevel: 'critical',
        riskScore: 0,
        riskFactors: [],
        capabilities: ['read_secret', 'list_secrets'],
        permissions: {
          readFiles: true,
          writeFiles: false,
          executeCommands: false,
          networkAccess: true,
          accessTokens: ['vault-read', 'kms-decrypt'],
          sensitiveDataAccess: 'top_secret',
        },
        dataEgress: {
          canUpload: false,
          canDownload: true,
          allowedDestinations: ['vault.internal'],
        },
        inputSchema: {
          type: 'object',
          properties: { secretPath: { type: 'string' } },
          required: ['secretPath'],
        },
        exampleInvocations: [
          {
            input: { secretPath: 'prod/db/password' },
            risk: 'critical',
            reason: 'Returns plaintext top-secret credentials',
          },
        ],
        lastAudited: now - 2 * day,
        auditNotes: 'Each invocation is dual-approval gated',
        installedBy: adminId,
        lastUsedAt: null,
      },
      {
        name: 'slack-post',
        server: 'slack-mcp',
        version: '4.2.0',
        description: 'Post messages to Slack channels',
        category: 'message',
        status: 'active',
        riskLevel: 'low',
        riskScore: 0,
        riskFactors: [],
        capabilities: ['post_message', 'list_channels'],
        permissions: {
          readFiles: false,
          writeFiles: false,
          executeCommands: false,
          networkAccess: true,
          accessTokens: ['slack-bot-token'],
          sensitiveDataAccess: 'public',
        },
        dataEgress: {
          canUpload: true,
          canDownload: false,
          allowedDestinations: ['slack.com'],
        },
        inputSchema: {
          type: 'object',
          properties: { channel: { type: 'string' }, text: { type: 'string' } },
          required: ['channel', 'text'],
        },
        exampleInvocations: [
          {
            input: { channel: '#alerts', text: 'Deployment succeeded' },
            risk: 'low',
            reason: 'Posting a benign message to a public channel',
          },
        ],
        lastAudited: now - 3 * day,
        auditNotes: 'Bot token scoped to chat:write only',
        installedBy: adminId,
        lastUsedAt: null,
      },
      {
        name: 'email-send',
        server: 'smtp-mcp',
        version: '2.0.4',
        description: 'Send email via the corporate SMTP relay',
        category: 'message',
        status: 'active',
        riskLevel: 'medium',
        riskScore: 0,
        riskFactors: [],
        capabilities: ['send_email', 'send_with_attachment'],
        permissions: {
          readFiles: true,
          writeFiles: false,
          executeCommands: false,
          networkAccess: true,
          accessTokens: ['smtp-relay'],
          sensitiveDataAccess: 'confidential',
        },
        dataEgress: {
          canUpload: true,
          canDownload: false,
          allowedDestinations: ['smtp.internal'],
        },
        inputSchema: {
          type: 'object',
          properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' } },
          required: ['to', 'subject', 'body'],
        },
        exampleInvocations: [
          {
            input: { to: 'team@example.com', subject: 'Update', body: 'See attached' },
            risk: 'medium',
            reason: 'Outbound email may carry confidential content',
          },
        ],
        lastAudited: now - 12 * day,
        auditNotes: 'Relay enforces DLP scanning',
        installedBy: adminId,
        lastUsedAt: null,
      },
    ];

    const seeded: McpTool[] = blueprints.map((b) => {
      const evaluation = this.computeRiskScore(b as McpTool);
      const full: McpTool = {
        ...b,
        id: this.generateId(),
        createdAt: now,
        usageCount: 0,
        trustScore: this.computeTrustScore(b as McpTool),
        riskScore: evaluation.score,
        riskLevel: evaluation.level,
        riskFactors: evaluation.factors.map((f) => ({
          factor: f.factor,
          weight: f.score,
          description: f.description,
        })),
      };
      return full;
    });

    return seeded;
  }
}
