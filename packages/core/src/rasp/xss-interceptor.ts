import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type XssAttackType =
  | 'reflected_xss'
  | 'stored_xss'
  | 'dom_xss'
  | 'event_handler_injection'
  | 'javascript_uri'
  | 'svg_injection'
  | 'html_injection'
  | 'css_injection'
  | 'template_injection'
  | 'mutation_xss'
  | 'polyglot_xss'
  | 'mXSS';

export type Context =
  | 'html_body'
  | 'html_attribute'
  | 'javascript'
  | 'url'
  | 'css'
  | 'json'
  | 'comment'
  | 'script_tag'
  | 'iframe_src'
  | 'img_src'
  | 'form_action'
  | 'meta_refresh'
  | 'style_attribute';

export type BlockAction = 'block' | 'log_only' | 'sanitize' | 'rate_limit' | 'challenge';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface XssInspectionRequest {
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
  context: Context;
  renderLocation: 'response_body' | 'response_header' | 'dom' | 'local_storage' | 'url_fragment';
  outputEncoding: 'none' | 'html' | 'url' | 'javascript' | 'css' | 'attribute';
  metadata: Record<string, unknown>;
}

export interface XssFinding {
  attackType: XssAttackType;
  severity: Severity;
  parameter: string;
  matchedValue: string;
  matchedPattern: string;
  context: Context;
  description: string;
  bypassAttempt: boolean;
  confidence: number;
  evidence: string[];
  recommendedAction: BlockAction;
  sanitizedValue: string | null;
}

export interface XssInspectionResult {
  request: XssInspectionRequest;
  allowed: boolean;
  action: BlockAction;
  findings: XssFinding[];
  highestSeverity: Severity;
  overallConfidence: number;
  sanitizedParameters: Record<string, any>;
  detectionTime: number;
  timestamp: number;
}

export interface XssPattern {
  id: string;
  name: string;
  description: string;
  attackType: XssAttackType;
  context: Context[];
  severity: Severity;
  pattern: RegExp;
  confidence: number;
  examples: string[];
  enabled: boolean;
  falsePositiveRisk: 'low' | 'medium' | 'high';
}

export interface XssStats {
  totalRequests: number;
  byAction: Record<BlockAction, number>;
  byAttackType: Record<XssAttackType, number>;
  byContext: Record<Context, number>;
  bySeverity: Record<Severity, number>;
  blockRate: number;
  averageDetectionTimeMs: number;
  topAttackingIps: Array<{ ip: string; count: number }>;
  storedXssDetected: number;
}

const PATTERN_STORE_KEY = 'rasp/xss-patterns.json';
const RESULT_STORE_KEY = 'rasp/xss-results.json';

const SEVERITY_RANK: Record<Severity, number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const DEFAULT_PATTERNS: Omit<XssPattern, 'id'>[] = [
  {
    name: 'Script Tag Injection',
    description: 'Detects inline or external script tag injection in HTML body.',
    attackType: 'reflected_xss',
    context: ['html_body', 'comment', 'script_tag'],
    severity: 'critical',
    pattern: /<script\b[^>]*>([\s\S]*?)<\/script>/gi,
    confidence: 0.97,
    examples: ['<script>alert(1)</script>'],
    enabled: true,
    falsePositiveRisk: 'low',
  },
  {
    name: 'Closing Script Tag',
    description: 'Detects attempts to break out of an existing script context.',
    attackType: 'reflected_xss',
    context: ['script_tag', 'javascript'],
    severity: 'critical',
    pattern: /<\/script>/gi,
    confidence: 0.9,
    examples: ['</script><script>alert(1)</script>'],
    enabled: true,
    falsePositiveRisk: 'low',
  },
  {
    name: 'Event Handler Attribute',
    description: 'Detects inline event handler attributes such as onclick, onerror, onload.',
    attackType: 'event_handler_injection',
    context: ['html_body', 'html_attribute', 'style_attribute'],
    severity: 'high',
    pattern: /\bon[a-z]+\s*=\s*["']?[^"'>\s]*/gi,
    confidence: 0.92,
    examples: ['" onclick="alert(1)', 'onerror=alert(1)'],
    enabled: true,
    falsePositiveRisk: 'low',
  },
  {
    name: 'JavaScript URI Scheme',
    description: 'Detects javascript: URI scheme used to execute code in navigation.',
    attackType: 'javascript_uri',
    context: ['url', 'iframe_src', 'img_src', 'form_action', 'meta_refresh'],
    severity: 'high',
    pattern: /javascript\s*:/gi,
    confidence: 0.95,
    examples: ['javascript:alert(1)'],
    enabled: true,
    falsePositiveRisk: 'low',
  },
  {
    name: 'VBScript URI Scheme',
    description: 'Detects vbscript: URI scheme used in legacy IE contexts.',
    attackType: 'javascript_uri',
    context: ['url', 'iframe_src', 'img_src', 'form_action'],
    severity: 'medium',
    pattern: /vbscript\s*:/gi,
    confidence: 0.93,
    examples: ['vbscript:msgbox(1)'],
    enabled: true,
    falsePositiveRisk: 'low',
  },
  {
    name: 'Data URI HTML Payload',
    description: 'Detects data:text/html URIs that can be used to deliver XSS.',
    attackType: 'javascript_uri',
    context: ['url', 'iframe_src', 'img_src', 'form_action'],
    severity: 'high',
    pattern: /data\s*:\s*text\/html/gi,
    confidence: 0.94,
    examples: ['data:text/html,<script>alert(1)</script>'],
    enabled: true,
    falsePositiveRisk: 'low',
  },
  {
    name: 'SVG With Inline Script',
    description: 'Detects SVG containers that smuggle inline script content.',
    attackType: 'svg_injection',
    context: ['html_body', 'iframe_src', 'img_src'],
    severity: 'critical',
    pattern: /<svg\b[^>]*>[\s\S]*?<script/gi,
    confidence: 0.96,
    examples: ['<svg><script>alert(1)</script></svg>'],
    enabled: true,
    falsePositiveRisk: 'low',
  },
  {
    name: 'Iframe Injection',
    description: 'Detects iframe tag injection used for UI redress or payload delivery.',
    attackType: 'html_injection',
    context: ['html_body'],
    severity: 'high',
    pattern: /<iframe\b[^>]*>/gi,
    confidence: 0.88,
    examples: ['<iframe src="javascript:alert(1)"></iframe>'],
    enabled: true,
    falsePositiveRisk: 'medium',
  },
  {
    name: 'Object Or Embed Tag',
    description: 'Detects object or embed tags used for legacy plugin-based XSS.',
    attackType: 'html_injection',
    context: ['html_body'],
    severity: 'high',
    pattern: /<object\b|<embed\b/gi,
    confidence: 0.85,
    examples: ['<object data="javascript:alert(1)"></object>'],
    enabled: true,
    falsePositiveRisk: 'medium',
  },
  {
    name: 'Image Onerror Handler',
    description: 'Detects img tags that rely on onerror handlers for execution.',
    attackType: 'event_handler_injection',
    context: ['html_body', 'html_attribute'],
    severity: 'high',
    pattern: /<img\b[^>]*onerror\s*=/gi,
    confidence: 0.94,
    examples: ['<img src=x onerror=alert(1)>'],
    enabled: true,
    falsePositiveRisk: 'low',
  },
  {
    name: 'Body Onload Handler',
    description: 'Detects body tags with onload handlers that auto-fire code.',
    attackType: 'event_handler_injection',
    context: ['html_body', 'html_attribute'],
    severity: 'high',
    pattern: /<body\b[^>]*onload\s*=/gi,
    confidence: 0.95,
    examples: ['<body onload=alert(1)>'],
    enabled: true,
    falsePositiveRisk: 'low',
  },
  {
    name: 'Meta Refresh Injection',
    description: 'Detects meta refresh tags that can redirect to javascript URIs.',
    attackType: 'html_injection',
    context: ['html_body', 'meta_refresh'],
    severity: 'medium',
    pattern: /<meta\b[^>]*http-equiv\s*=\s*["']?refresh/gi,
    confidence: 0.86,
    examples: ['<meta http-equiv="refresh" content="0;url=javascript:alert(1)">'],
    enabled: true,
    falsePositiveRisk: 'medium',
  },
  {
    name: 'CSS Expression Or Behavior',
    description: 'Detects legacy IE CSS expression and behavior property usage.',
    attackType: 'css_injection',
    context: ['css', 'style_attribute'],
    severity: 'medium',
    pattern: /expression\s*\(|behavior\s*:/gi,
    confidence: 0.9,
    examples: ['width: expression(alert(1))'],
    enabled: true,
    falsePositiveRisk: 'medium',
  },
  {
    name: 'Base64 Encoded Payload',
    description: 'Detects base64-encoded payloads often used to obfuscate XSS.',
    attackType: 'javascript_uri',
    context: ['url', 'html_body', 'html_attribute'],
    severity: 'medium',
    pattern: /base64,\s*[A-Za-z0-9+/=]{20,}/gi,
    confidence: 0.75,
    examples: ['data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='],
    enabled: true,
    falsePositiveRisk: 'medium',
  },
  {
    name: 'Template Injection',
    description: 'Detects Angular, Vue or generic template injection sequences.',
    attackType: 'template_injection',
    context: ['html_body', 'html_attribute', 'javascript'],
    severity: 'high',
    pattern: /\{\{.*?\}\}|\$\{.*?\}/g,
    confidence: 0.8,
    examples: ['{{constructor.constructor("alert(1)")()}}', '${alert(1)}'],
    enabled: true,
    falsePositiveRisk: 'medium',
  },
  {
    name: 'Polyglot XSS',
    description: 'Detects mixed-case polyglot payloads that survive multiple contexts.',
    attackType: 'polyglot_xss',
    context: ['html_body', 'url', 'javascript'],
    severity: 'critical',
    pattern: /jaVasCript:|<svg onload=/gi,
    confidence: 0.96,
    examples: ['jaVasCript:alert(1)', '<svg onload=alert(1)>'],
    enabled: true,
    falsePositiveRisk: 'low',
  },
  {
    name: 'Mutation XSS In Noscript',
    description: 'Detects mutation XSS patterns hidden in noscript elements.',
    attackType: 'mutation_xss',
    context: ['html_body', 'comment'],
    severity: 'medium',
    pattern: /<noscript\b[\s\S]*?<\/noscript>/gi,
    confidence: 0.7,
    examples: ['<noscript><p title="</noscript><img src=x onerror=alert(1)>">'],
    enabled: true,
    falsePositiveRisk: 'high',
  },
  {
    name: 'CSS Import Statement',
    description: 'Detects CSS @import statements that may load remote stylesheets.',
    attackType: 'css_injection',
    context: ['css', 'style_attribute'],
    severity: 'medium',
    pattern: /@import\s+url/gi,
    confidence: 0.78,
    examples: ['@import url("javascript:alert(1)");'],
    enabled: true,
    falsePositiveRisk: 'medium',
  },
];

export class XssInterceptor {
  constructor(private store: JsonStore) {}

  async inspect(request: XssInspectionRequest): Promise<XssInspectionResult> {
    const start = Date.now();
    const findings: XssFinding[] = [];

    for (const [name, value] of Object.entries(request.parameters ?? {})) {
      if (value === null || value === undefined) {
        continue;
      }
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      findings.push(...this.runPatterns(stringValue, request.context, name));
      findings.push(...this.runHeuristics(stringValue, request.context, name));
    }

    const { allowed, action } = this.determineAction(findings);

    const sanitizedParameters: Record<string, any> = {};
    if (action === 'sanitize') {
      for (const [name, value] of Object.entries(request.parameters)) {
        if (typeof value === 'string') {
          sanitizedParameters[name] = this.sanitize(value, request.context);
        } else {
          sanitizedParameters[name] = value;
        }
      }
    } else {
      Object.assign(sanitizedParameters, request.parameters);
    }

    const highestSeverity = this.computeHighestSeverity(findings);
    const overallConfidence = this.computeOverallConfidence(findings);

    const result: XssInspectionResult = {
      request,
      allowed,
      action,
      findings,
      highestSeverity,
      overallConfidence,
      sanitizedParameters,
      detectionTime: Date.now() - start,
      timestamp: Date.now(),
    };

    await this.persistResult(result);
    return result;
  }

  async inspectBatch(requests: XssInspectionRequest[]): Promise<XssInspectionResult[]> {
    const results: XssInspectionResult[] = [];
    for (const request of requests) {
      results.push(await this.inspect(request));
    }
    return results;
  }

  async addCustomPattern(pattern: Omit<XssPattern, 'id'>): Promise<XssPattern> {
    const patterns = await this.loadPatterns();
    const newPattern: XssPattern = { id: this.generateId(), ...pattern };
    patterns.push(newPattern);
    await this.store.set(PATTERN_STORE_KEY, patterns);
    return newPattern;
  }

  async listPatterns(
    filters?: { attackType?: XssAttackType; context?: Context; enabled?: boolean },
  ): Promise<XssPattern[]> {
    const patterns = await this.loadPatterns();
    if (!filters) {
      return patterns;
    }
    return patterns.filter((p) => {
      if (filters.attackType && p.attackType !== filters.attackType) {
        return false;
      }
      if (filters.context && !p.context.includes(filters.context)) {
        return false;
      }
      if (typeof filters.enabled === 'boolean' && p.enabled !== filters.enabled) {
        return false;
      }
      return true;
    });
  }

  async removePattern(patternId: string): Promise<boolean> {
    const patterns = await this.loadPatterns();
    const remaining = patterns.filter((p) => p.id !== patternId);
    if (remaining.length === patterns.length) {
      return false;
    }
    await this.store.set(PATTERN_STORE_KEY, remaining);
    return true;
  }

  async enablePattern(patternId: string): Promise<boolean> {
    return this.togglePattern(patternId, true);
  }

  async disablePattern(patternId: string): Promise<boolean> {
    return this.togglePattern(patternId, false);
  }

  async getRecentResults(
    filters?: {
      applicationId?: string;
      since?: number;
      severity?: Severity;
      context?: Context;
      limit?: number;
    },
  ): Promise<XssInspectionResult[]> {
    const all = await this.loadResults();
    let filtered = all;
    if (filters?.applicationId) {
      filtered = filtered.filter((r) => r.request.applicationId === filters.applicationId);
    }
    if (typeof filters?.since === 'number') {
      filtered = filtered.filter((r) => r.timestamp >= (filters.since as number));
    }
    if (filters?.severity) {
      const min = SEVERITY_RANK[filters.severity];
      filtered = filtered.filter((r) => SEVERITY_RANK[r.highestSeverity] >= min);
    }
    if (filters?.context) {
      filtered = filtered.filter((r) => r.request.context === filters.context);
    }
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }
    return filtered;
  }

  async getStats(applicationId?: string, since?: number): Promise<XssStats> {
    const all = await this.loadResults();
    let results = all;
    if (applicationId) {
      results = results.filter((r) => r.request.applicationId === applicationId);
    }
    if (typeof since === 'number') {
      results = results.filter((r) => r.timestamp >= since);
    }

    const totalRequests = results.length;
    const byAction = this.emptyActionCounts();
    const byAttackType = this.emptyAttackTypeCounts();
    const byContext = this.emptyContextCounts();
    const bySeverity = this.emptySeverityCounts();

    const ipCounts = new Map<string, number>();
    let totalDetectionTime = 0;
    let storedXssDetected = 0;

    for (const r of results) {
      byAction[r.action] = (byAction[r.action] || 0) + 1;
      byContext[r.request.context] = (byContext[r.request.context] || 0) + 1;
      bySeverity[r.highestSeverity] = (bySeverity[r.highestSeverity] || 0) + 1;
      for (const f of r.findings) {
        byAttackType[f.attackType] = (byAttackType[f.attackType] || 0) + 1;
        if (f.attackType === 'stored_xss') {
          storedXssDetected += 1;
        }
      }
      ipCounts.set(r.request.sourceIp, (ipCounts.get(r.request.sourceIp) || 0) + 1);
      totalDetectionTime += r.detectionTime;
    }

    const blocked = byAction.block || 0;
    const blockRate = totalRequests > 0 ? blocked / totalRequests : 0;
    const averageDetectionTimeMs = totalRequests > 0 ? totalDetectionTime / totalRequests : 0;

    const topAttackingIps = Array.from(ipCounts.entries())
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRequests,
      byAction,
      byAttackType,
      byContext,
      bySeverity,
      blockRate,
      averageDetectionTimeMs,
      topAttackingIps,
      storedXssDetected,
    };
  }

  sanitize(value: string, context: Context): string {
    switch (context) {
      case 'html_body':
        return this.escapeHtmlBody(value);
      case 'html_attribute':
        return this.escapeHtmlAttribute(value);
      case 'javascript':
        return this.escapeJavaScript(value);
      case 'url':
      case 'iframe_src':
      case 'img_src':
      case 'form_action':
      case 'meta_refresh':
        return this.sanitizeUrl(value);
      case 'css':
      case 'style_attribute':
        return this.sanitizeCss(value);
      default:
        return this.escapeHtmlBody(value);
    }
  }

  private runPatterns(input: string, context: Context, parameter: string): XssFinding[] {
    const findings: XssFinding[] = [];
    return findings;
  }

  private runHeuristics(input: string, context: Context, parameter: string): XssFinding[] {
    const findings: XssFinding[] = [];

    if (this.checkScriptTags(input)) {
      findings.push({
        attackType: 'reflected_xss',
        severity: 'critical',
        parameter,
        matchedValue: input.slice(0, 200),
        matchedPattern: '<script>',
        context,
        description: 'Script tag detected in user input.',
        bypassAttempt: true,
        confidence: 0.97,
        evidence: [input],
        recommendedAction: 'block',
        sanitizedValue: this.sanitize(input, context),
      });
    }

    if (this.checkEventHandlers(input)) {
      findings.push({
        attackType: 'event_handler_injection',
        severity: 'high',
        parameter,
        matchedValue: input.slice(0, 200),
        matchedPattern: 'on*=' ,
        context,
        description: 'Inline event handler detected in user input.',
        bypassAttempt: true,
        confidence: 0.9,
        evidence: [input],
        recommendedAction: 'sanitize',
        sanitizedValue: this.sanitize(input, context),
      });
    }

    if (this.checkJavaScriptUri(input)) {
      findings.push({
        attackType: 'javascript_uri',
        severity: 'high',
        parameter,
        matchedValue: input.slice(0, 200),
        matchedPattern: 'javascript:',
        context,
        description: 'JavaScript URI scheme detected.',
        bypassAttempt: true,
        confidence: 0.95,
        evidence: [input],
        recommendedAction: 'block',
        sanitizedValue: this.sanitize(input, 'url'),
      });
    }

    if (this.checkSvgVectors(input)) {
      findings.push({
        attackType: 'svg_injection',
        severity: 'high',
        parameter,
        matchedValue: input.slice(0, 200),
        matchedPattern: '<svg>',
        context,
        description: 'SVG vector containing executable content detected.',
        bypassAttempt: true,
        confidence: 0.92,
        evidence: [input],
        recommendedAction: 'block',
        sanitizedValue: this.sanitize(input, context),
      });
    }

    if (this.checkDataUri(input)) {
      findings.push({
        attackType: 'javascript_uri',
        severity: 'medium',
        parameter,
        matchedValue: input.slice(0, 200),
        matchedPattern: 'data:text/html',
        context,
        description: 'Data URI detected that may carry executable payload.',
        bypassAttempt: true,
        confidence: 0.85,
        evidence: [input],
        recommendedAction: 'sanitize',
        sanitizedValue: this.sanitize(input, 'url'),
      });
    }

    if (this.checkIframeInjection(input)) {
      findings.push({
        attackType: 'html_injection',
        severity: 'high',
        parameter,
        matchedValue: input.slice(0, 200),
        matchedPattern: '<iframe>',
        context,
        description: 'Iframe tag injection detected.',
        bypassAttempt: true,
        confidence: 0.88,
        evidence: [input],
        recommendedAction: 'block',
        sanitizedValue: this.sanitize(input, context),
      });
    }

    if (this.checkBase64Content(input)) {
      findings.push({
        attackType: 'javascript_uri',
        severity: 'medium',
        parameter,
        matchedValue: input.slice(0, 200),
        matchedPattern: 'base64,',
        context,
        description: 'Base64-encoded payload detected.',
        bypassAttempt: true,
        confidence: 0.7,
        evidence: [input],
        recommendedAction: 'log_only',
        sanitizedValue: null,
      });
    }

    if (this.checkObfuscation(input)) {
      findings.push({
        attackType: 'polyglot_xss',
        severity: 'medium',
        parameter,
        matchedValue: input.slice(0, 200),
        matchedPattern: 'obfuscation',
        context,
        description: 'Suspicious obfuscation patterns detected in input.',
        bypassAttempt: true,
        confidence: 0.65,
        evidence: [input],
        recommendedAction: 'log_only',
        sanitizedValue: this.sanitize(input, context),
      });
    }

    if (this.checkTemplateInjection(input)) {
      findings.push({
        attackType: 'template_injection',
        severity: 'high',
        parameter,
        matchedValue: input.slice(0, 200),
        matchedPattern: '{{...}} | ${...}',
        context,
        description: 'Template injection sequence detected.',
        bypassAttempt: true,
        confidence: 0.82,
        evidence: [input],
        recommendedAction: 'sanitize',
        sanitizedValue: this.sanitize(input, context),
      });
    }

    return findings;
  }

  private checkScriptTags(input: string): boolean {
    return /<\s*script\b[^>]*>|<\s*\/\s*script\s*>/i.test(input);
  }

  private checkEventHandlers(input: string): boolean {
    return /\bon[a-z]+\s*=/i.test(input);
  }

  private checkJavaScriptUri(input: string): boolean {
    return /\b(?:javascript|vbscript)\s*:/i.test(input);
  }

  private checkSvgVectors(input: string): boolean {
    return /<\s*svg\b[^>]*>[\s\S]*?(?:<script|on\w+\s*=)/i.test(input);
  }

  private checkDataUri(input: string): boolean {
    return /\bdata\s*:\s*text\/html/i.test(input);
  }

  private checkIframeInjection(input: string): boolean {
    return /<\s*iframe\b[^>]*>/i.test(input);
  }

  private checkBase64Content(input: string): boolean {
    return /base64,\s*[A-Za-z0-9+/=]{20,}/i.test(input);
  }

  private checkObfuscation(input: string): boolean {
    const hexEscapes = (input.match(/\\x[0-9a-f]{2}/gi) || []).length;
    const unicodeEscapes = (input.match(/\\u[0-9a-f]{4}/gi) || []).length;
    const htmlEntities = (input.match(/&#x?[0-9a-f]+;/gi) || []).length;
    const zeroWidth = (input.match(/[\u200B-\u200D\uFEFF]/g) || []).length;
    const mixedCaseKeywords = /jaVaScrIpT|vBsCrIpT|ScRiPt/i.test(input);
    return hexEscapes >= 3 || unicodeEscapes >= 3 || htmlEntities >= 3 || zeroWidth >= 1 || mixedCaseKeywords;
  }

  private checkTemplateInjection(input: string): boolean {
    return /\{\{[\s\S]*?\}\}|\$\{[\s\S]*?\}/.test(input);
  }

  private determineAction(findings: XssFinding[]): { allowed: boolean; action: BlockAction } {
    if (findings.length === 0) {
      return { allowed: true, action: 'log_only' };
    }

    const highest = findings.reduce((acc, f) =>
      SEVERITY_RANK[f.severity] > SEVERITY_RANK[acc.severity] ? f : acc,
    );

    const hasCritical = findings.some((f) => f.severity === 'critical');
    const hasHighConfidence = findings.some((f) => f.confidence >= 0.9);

    if (hasCritical && hasHighConfidence) {
      return { allowed: false, action: 'block' };
    }
    if (highest.severity === 'critical' || highest.severity === 'high') {
      return { allowed: true, action: 'sanitize' };
    }
    if (highest.severity === 'medium') {
      return { allowed: true, action: 'sanitize' };
    }
    return { allowed: true, action: 'log_only' };
  }

  private async togglePattern(patternId: string, enabled: boolean): Promise<boolean> {
    const patterns = await this.loadPatterns();
    const target = patterns.find((p) => p.id === patternId);
    if (!target) {
      return false;
    }
    target.enabled = enabled;
    await this.store.set(PATTERN_STORE_KEY, patterns);
    return true;
  }

  private async loadPatterns(): Promise<XssPattern[]> {
    const existing = (await this.store.get<XssPattern[]>(PATTERN_STORE_KEY)) || [];
    if (existing.length === 0) {
      const seeded = DEFAULT_PATTERNS.map((p) => ({ id: this.generateId(), ...p }));
      await this.store.set(PATTERN_STORE_KEY, seeded);
      return seeded;
    }
    return existing;
  }

  private async loadResults(): Promise<XssInspectionResult[]> {
    return (await this.store.get<XssInspectionResult[]>(RESULT_STORE_KEY)) || [];
  }

  private async persistResult(result: XssInspectionResult): Promise<void> {
    const results = await this.loadResults();
    results.push(result);
    if (results.length > 5000) {
      results.splice(0, results.length - 5000);
    }
    await this.store.set(RESULT_STORE_KEY, results);
  }

  private computeHighestSeverity(findings: XssFinding[]): Severity {
    if (findings.length === 0) {
      return 'info';
    }
    return findings.reduce<Severity>((acc, f) => {
      return SEVERITY_RANK[f.severity] > SEVERITY_RANK[acc] ? f.severity : acc;
    }, 'info');
  }

  private computeOverallConfidence(findings: XssFinding[]): number {
    if (findings.length === 0) {
      return 0;
    }
    const sum = findings.reduce((acc, f) => acc + f.confidence, 0);
    return Math.min(1, sum / findings.length);
  }

  private emptyActionCounts(): Record<BlockAction, number> {
    return {
      block: 0,
      log_only: 0,
      sanitize: 0,
      rate_limit: 0,
      challenge: 0,
    };
  }

  private emptyAttackTypeCounts(): Record<XssAttackType, number> {
    return {
      reflected_xss: 0,
      stored_xss: 0,
      dom_xss: 0,
      event_handler_injection: 0,
      javascript_uri: 0,
      svg_injection: 0,
      html_injection: 0,
      css_injection: 0,
      template_injection: 0,
      mutation_xss: 0,
      polyglot_xss: 0,
      mXSS: 0,
    };
  }

  private emptyContextCounts(): Record<Context, number> {
    return {
      html_body: 0,
      html_attribute: 0,
      javascript: 0,
      url: 0,
      css: 0,
      json: 0,
      comment: 0,
      script_tag: 0,
      iframe_src: 0,
      img_src: 0,
      form_action: 0,
      meta_refresh: 0,
      style_attribute: 0,
    };
  }

  private emptySeverityCounts(): Record<Severity, number> {
    return {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
  }

  private escapeHtmlBody(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeHtmlAttribute(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/>/g, '&gt;')
      .replace(/=/g, '&#61;');
  }

  private escapeJavaScript(value: string): string {
    return value
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\//g, '\\/')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
  }

  private sanitizeUrl(value: string): string {
    if (/^\s*(?:javascript|vbscript|data)\s*:/i.test(value)) {
      return '';
    }
    try {
      const encoded = encodeURI(value);
      return encoded.replace(/%22/gi, '&quot;').replace(/%27/gi, '&#39;');
    } catch {
      return '';
    }
  }

  private sanitizeCss(value: string): string {
    return value
      .replace(/expression\s*\([^)]*\)/gi, '')
      .replace(/behavior\s*:[^;]*/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/@import/gi, '');
  }

  private generateId(): string {
    if (typeof randomUUID === 'function') {
      return randomUUID();
    }
    return `xss-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}