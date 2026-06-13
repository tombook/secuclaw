import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type AbuseType =
  | 'brute_force'
  | 'credential_stuffing'
  | 'api_scraping'
  | 'rate_limit_exceeded'
  | 'enumeration_attack'
  | 'session_hijacking'
  | 'token_replay'
  | 'privilege_escalation'
  | 'api_misuse'
  | 'data_exfiltration'
  | 'suspicious_ip'
  | 'user_agent_anomaly'
  | 'geographic_anomaly'
  | 'time_anomaly'
  | 'bot_activity'
  | 'unknown';

export type AbuseStatus = 'active' | 'auto_blocked' | 'manual_review' | 'false_positive' | 'whitelisted';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type SubjectType = 'user' | 'ip' | 'api_key' | 'session';

export interface ApiRequest {
  id: string;
  timestamp: number;
  applicationId: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  userId: string | null;
  sessionId: string | null;
  sourceIp: string;
  userAgent: string;
  referer: string | null;
  apiKey: string | null;
  requestSize: number;
  responseSize: number;
  statusCode: number;
  responseTime: number;
  error: string | null;
  authenticated: boolean;
  rateLimit: { allowed: boolean; limit: number; remaining: number; reset: number };
  metadata: Record<string, unknown>;
}

export interface BehaviorProfile {
  id: string;
  subjectType: SubjectType;
  subjectId: string;
  windowStart: number;
  windowEnd: number;
  totalRequests: number;
  uniqueEndpoints: number;
  failureRate: number;
  avgResponseTime: number;
  dataTransferred: number;
  uniqueUserAgents: string[];
  uniqueIps: string[];
  distinctSessions: number;
  firstSeen: number;
  lastSeen: number;
  errorCount: number;
  suspiciousScore: number;
  riskFactors: string[];
}

export interface AbuseDetection {
  id: string;
  timestamp: number;
  type: AbuseType;
  severity: Severity;
  status: AbuseStatus;
  subjectType: SubjectType;
  subjectId: string;
  request: ApiRequest;
  description: string;
  evidence: string[];
  triggeredRule: string;
  confidence: number;
  actionTaken: 'block' | 'rate_limit' | 'challenge' | 'log' | 'whitelist';
  actionExpires: number | null;
  metadata: Record<string, unknown>;
  relatedRequests: string[];
  assignedTo: string | null;
}

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  type: AbuseType;
  severity: Severity;
  checkName: AbuseType;
  enabled: boolean;
}

export interface ApiAbuseStats {
  totalRequests: number;
  totalDetections: number;
  byType: Record<AbuseType, number>;
  bySeverity: Record<Severity, number>;
  byStatus: Record<AbuseStatus, number>;
  blockRate: number;
  topAbusers: Array<{ subjectType: string; subjectId: string; detections: number; riskScore: number }>;
  topEndpoints: Array<{ endpoint: string; requests: number; attacks: number }>;
}

const STORE_KEYS = {
  requests: 'rasp/api-requests.json',
  detections: 'rasp/api-detections.json',
  profiles: 'rasp/api-profiles.json',
  whitelist: 'rasp/api-whitelist.json',
  rules: 'rasp/api-rules.json',
};

const HISTORY_LIMIT = 20000;

function emptyTypeMap(): Record<AbuseType, number> {
  return {
    brute_force: 0, credential_stuffing: 0, api_scraping: 0, rate_limit_exceeded: 0,
    enumeration_attack: 0, session_hijacking: 0, token_replay: 0, privilege_escalation: 0,
    api_misuse: 0, data_exfiltration: 0, suspicious_ip: 0, user_agent_anomaly: 0,
    geographic_anomaly: 0, time_anomaly: 0, bot_activity: 0, unknown: 0,
  };
}

function emptySeverityMap(): Record<Severity, number> {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

function emptyStatusMap(): Record<AbuseStatus, number> {
  return { active: 0, auto_blocked: 0, manual_review: 0, false_positive: 0, whitelisted: 0 };
}

export class ApiAbuseDetector {
  constructor(private store: JsonStore) {}

  async recordRequest(request: ApiRequest): Promise<{ request: ApiRequest; detections: AbuseDetection[] }> {
    if (!request.id) request.id = this.generateId('req');
    const requests = await this.loadRequests();
    requests.push(request);
    if (requests.length > HISTORY_LIMIT) requests.splice(0, requests.length - HISTORY_LIMIT);
    await this.store.set(STORE_KEYS.requests, requests);

    const recent = requests.filter((r) => r.sourceIp === request.sourceIp || r.userId === request.userId);
    const rules = await this.loadRules();
    const whitelist = await this.loadWhitelist();
    const detections: AbuseDetection[] = [];
    const isWhitelisted = whitelist.some((w) => w.subjectType === 'ip' && w.subjectId === request.sourceIp);

    if (!isWhitelisted) {
      for (const rule of rules) {
        if (!rule.enabled) continue;
        try {
          const detection = this.runCheck(rule.checkName, recent);
          if (detection) {
            detection.id = detection.id || this.generateId('det');
            detection.timestamp = Date.now();
            detection.status = 'active';
            detections.push(detection);
          }
        } catch (e: any) {
        }
      }
    }

    if (detections.length > 0) {
      const allDetections = await this.loadDetections();
      allDetections.push(...detections);
      if (allDetections.length > HISTORY_LIMIT) allDetections.splice(0, allDetections.length - HISTORY_LIMIT);
      await this.store.set(STORE_KEYS.detections, allDetections);
    }

    await this.updateBehaviorProfile(request);
    return { request, detections };
  }

  async recordBatch(reqs: ApiRequest[]): Promise<{ requests: ApiRequest[]; detections: AbuseDetection[] }> {
    const allDetections: AbuseDetection[] = [];
    const allRequests: ApiRequest[] = [];
    for (const r of reqs) {
      const result = await this.recordRequest(r);
      allRequests.push(result.request);
      allDetections.push(...result.detections);
    }
    return { requests: allRequests, detections: allDetections };
  }

  async getDetections(filters?: { subjectType?: string; subjectId?: string; type?: AbuseType; severity?: Severity; status?: AbuseStatus; since?: number; limit?: number }): Promise<AbuseDetection[]> {
    let items = await this.loadDetections();
    if (filters?.subjectType) items = items.filter((d) => d.subjectType === filters.subjectType);
    if (filters?.subjectId) items = items.filter((d) => d.subjectId === filters.subjectId);
    if (filters?.type) items = items.filter((d) => d.type === filters.type);
    if (filters?.severity) items = items.filter((d) => d.severity === filters.severity);
    if (filters?.status) items = items.filter((d) => d.status === filters.status);
    if (filters?.since !== undefined) items = items.filter((d) => d.timestamp >= filters.since!);
    items.sort((a, b) => b.timestamp - a.timestamp);
    if (filters?.limit !== undefined) items = items.slice(0, filters.limit);
    return items;
  }

  async updateDetectionStatus(detectionId: string, status: AbuseStatus, actionExpires?: number): Promise<boolean> {
    const detections = await this.loadDetections();
    const idx = detections.findIndex((d) => d.id === detectionId);
    if (idx === -1) return false;
    detections[idx].status = status;
    if (actionExpires !== undefined) detections[idx].actionExpires = actionExpires;
    await this.store.set(STORE_KEYS.detections, detections);
    return true;
  }

  async getBehaviorProfile(subjectType: SubjectType, subjectId: string): Promise<BehaviorProfile | null> {
    const profiles = await this.loadProfiles();
    return profiles.find((p) => p.subjectType === subjectType && p.subjectId === subjectId) || null;
  }

  async listBehaviorProfiles(filters?: { subjectType?: SubjectType; minSuspiciousScore?: number; limit?: number }): Promise<BehaviorProfile[]> {
    let items = await this.loadProfiles();
    if (filters?.subjectType) items = items.filter((p) => p.subjectType === filters.subjectType);
    if (filters?.minSuspiciousScore !== undefined) items = items.filter((p) => p.suspiciousScore >= filters.minSuspiciousScore!);
    items.sort((a, b) => b.suspiciousScore - a.suspiciousScore);
    if (filters?.limit !== undefined) items = items.slice(0, filters.limit);
    return items;
  }

  async addCustomRule(rule: Omit<DetectionRule, 'id' | 'checkName'> & { checkName?: AbuseType }): Promise<DetectionRule> {
    const rules = await this.loadRules();
    const newRule: DetectionRule = {
      id: this.generateId('rule'),
      name: rule.name,
      description: rule.description,
      type: rule.type,
      severity: rule.severity,
      checkName: rule.checkName || rule.type,
      enabled: rule.enabled,
    };
    rules.push(newRule);
    await this.store.set(STORE_KEYS.rules, rules);
    return newRule;
  }

  async listRules(filters?: { type?: AbuseType; enabled?: boolean }): Promise<DetectionRule[]> {
    let rules = await this.loadRules();
    if (filters?.type) rules = rules.filter((r) => r.type === filters.type);
    if (filters?.enabled !== undefined) rules = rules.filter((r) => r.enabled === filters.enabled);
    return rules;
  }

  async removeRule(ruleId: string): Promise<boolean> {
    const rules = await this.loadRules();
    const filtered = rules.filter((r) => r.id !== ruleId);
    if (filtered.length === rules.length) return false;
    await this.store.set(STORE_KEYS.rules, filtered);
    return true;
  }

  async isSubjectBlocked(subjectType: SubjectType, subjectId: string): Promise<boolean> {
    const detections = await this.getDetections({ subjectType, subjectId, status: 'auto_blocked', limit: 1 });
    if (detections.length > 0) {
      const det = detections[0];
      if (det.actionExpires === null || det.actionExpires > Date.now()) return true;
    }
    return false;
  }

  async whitelistSubject(subjectType: SubjectType, subjectId: string, reason: string): Promise<boolean> {
    const whitelist = await this.loadWhitelist();
    if (whitelist.some((w) => w.subjectType === subjectType && w.subjectId === subjectId)) return false;
    whitelist.push({ subjectType, subjectId, reason, addedAt: Date.now() });
    await this.store.set(STORE_KEYS.whitelist, whitelist);
    return true;
  }

  async removeFromWhitelist(subjectType: SubjectType, subjectId: string): Promise<boolean> {
    const whitelist = await this.loadWhitelist();
    const filtered = whitelist.filter((w) => !(w.subjectType === subjectType && w.subjectId === subjectId));
    if (filtered.length === whitelist.length) return false;
    await this.store.set(STORE_KEYS.whitelist, filtered);
    return true;
  }

  async getStats(since?: number): Promise<ApiAbuseStats> {
    const requests = await this.loadRequests();
    let detections = await this.loadDetections();
    if (since !== undefined) {
      const filtered = detections.filter((d) => d.timestamp >= since);
      detections = filtered;
    }
    const byType = emptyTypeMap();
    const bySeverity = emptySeverityMap();
    const byStatus = emptyStatusMap();
    let blocked = 0;
    for (const d of detections) {
      byType[d.type] = (byType[d.type] || 0) + 1;
      bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
      byStatus[d.status] = (byStatus[d.status] || 0) + 1;
      if (d.actionTaken === 'block') blocked++;
    }
    const topAbuserMap = new Map<string, { subjectType: string; subjectId: string; detections: number; riskScore: number }>();
    for (const d of detections) {
      const key = `${d.subjectType}:${d.subjectId}`;
      const existing = topAbuserMap.get(key);
      const risk = severityToRisk(d.severity);
      if (existing) {
        existing.detections++;
        existing.riskScore = Math.max(existing.riskScore, risk);
      } else {
        topAbuserMap.set(key, { subjectType: d.subjectType, subjectId: d.subjectId, detections: 1, riskScore: risk });
      }
    }
    const endpointMap = new Map<string, { endpoint: string; requests: number; attacks: number }>();
    for (const r of requests) {
      const existing = endpointMap.get(r.endpoint);
      if (existing) existing.requests++;
      else endpointMap.set(r.endpoint, { endpoint: r.endpoint, requests: 1, attacks: 0 });
    }
    for (const d of detections) {
      const existing = endpointMap.get(d.request.endpoint);
      if (existing) existing.attacks++;
    }
    return {
      totalRequests: requests.length,
      totalDetections: detections.length,
      byType,
      bySeverity,
      byStatus,
      blockRate: detections.length > 0 ? blocked / detections.length : 0,
      topAbusers: Array.from(topAbuserMap.values()).sort((a, b) => b.detections - a.detections).slice(0, 10),
      topEndpoints: Array.from(endpointMap.values()).sort((a, b) => b.attacks - a.attacks).slice(0, 10),
    };
  }

  private detectBruteForce(recent: ApiRequest[]): AbuseDetection | null {
    const now = Date.now();
    const window = 60000;
    const loginFails = recent.filter((r) => r.endpoint.includes('/login') && r.statusCode === 401 && now - r.timestamp <= window);
    const byIp = new Map<string, ApiRequest[]>();
    for (const r of loginFails) {
      const list = byIp.get(r.sourceIp) || [];
      list.push(r);
      byIp.set(r.sourceIp, list);
    }
    for (const [ip, items] of byIp) {
      if (items.length >= 5) {
        return this.buildDetection('brute_force', 'high', 'ip', ip, items[items.length - 1], {
          triggeredRule: 'brute_force_login',
          description: `${items.length} failed login attempts from ${ip} within ${window / 1000}s`,
          evidence: items.slice(-5).map((r) => `${r.timestamp}: ${r.method} ${r.endpoint} → ${r.statusCode}`),
          confidence: Math.min(0.95, 0.5 + items.length * 0.08),
          actionTaken: 'block',
          actionExpires: now + 30 * 60 * 1000,
          relatedRequests: items.map((r) => r.id),
        });
      }
    }
    return null;
  }

  private detectCredentialStuffing(recent: ApiRequest[]): AbuseDetection | null {
    const now = Date.now();
    const window = 5 * 60 * 1000;
    const loginAttempts = recent.filter((r) => r.endpoint.includes('/login') && now - r.timestamp <= window);
    const byIp = new Map<string, Set<string>>();
    for (const r of loginAttempts) {
      if (!r.userId) continue;
      const set = byIp.get(r.sourceIp) || new Set();
      set.add(r.userId);
      byIp.set(r.sourceIp, set);
    }
    for (const [ip, userSet] of byIp) {
      if (userSet.size >= 10) {
        return this.buildDetection('credential_stuffing', 'high', 'ip', ip, loginAttempts[loginAttempts.length - 1], {
          triggeredRule: 'credential_stuffing',
          description: `${userSet.size} distinct userIds from ${ip} within 5min`,
          evidence: Array.from(userSet).slice(0, 10).map((u) => `userId=${u}`),
          confidence: 0.9,
          actionTaken: 'block',
          actionExpires: now + 60 * 60 * 1000,
        });
      }
    }
    return null;
  }

  private detectScraping(recent: ApiRequest[]): AbuseDetection | null {
    const now = Date.now();
    const window = 60000;
    const apiGets = recent.filter((r) => r.endpoint.startsWith('/api/') && r.method === 'GET' && now - r.timestamp <= window);
    const byIp = new Map<string, number>();
    for (const r of apiGets) byIp.set(r.sourceIp, (byIp.get(r.sourceIp) || 0) + 1);
    for (const [ip, count] of byIp) {
      if (count >= 100) {
        return this.buildDetection('api_scraping', 'high', 'ip', ip, apiGets[apiGets.length - 1], {
          triggeredRule: 'api_scraping',
          description: `${count} GET requests to /api/* from ${ip} within 60s`,
          evidence: [`count=${count}`, `window=60s`],
          confidence: 0.95,
          actionTaken: 'rate_limit',
          actionExpires: now + 30 * 60 * 1000,
        });
      }
    }
    return null;
  }

  private detectRateLimitExceedance(recent: ApiRequest[]): AbuseDetection | null {
    const now = Date.now();
    const window = 60000;
    const fresh = recent.filter((r) => now - r.timestamp <= window);
    const byKey = new Map<string, ApiRequest[]>();
    for (const r of fresh) {
      const key = r.apiKey || r.userId || r.sourceIp;
      const list = byKey.get(key) || [];
      list.push(r);
      byKey.set(key, list);
    }
    for (const [key, items] of byKey) {
      if (items.length === 0) continue;
      const limit = items[items.length - 1].rateLimit.limit;
      if (limit > 0 && items.length > limit * 2) {
        const subjectType: SubjectType = items[items.length - 1].apiKey ? 'api_key' : items[items.length - 1].userId ? 'user' : 'ip';
        return this.buildDetection('rate_limit_exceeded', 'medium', subjectType, key, items[items.length - 1], {
          triggeredRule: 'rate_limit_exceeded',
          description: `${items.length} requests vs limit ${limit} (${items.length / limit}x) within 60s`,
          evidence: [`requests=${items.length}`, `limit=${limit}`],
          confidence: 0.8,
          actionTaken: 'rate_limit',
        });
      }
    }
    return null;
  }

  private detectEnumeration(recent: ApiRequest[]): AbuseDetection | null {
    const now = Date.now();
    const window = 60000;
    const userCalls = recent.filter((r) => r.endpoint.includes('/api/users/') && r.statusCode === 403 && now - r.timestamp <= window);
    const byUser = new Map<string, ApiRequest[]>();
    for (const r of userCalls) {
      if (!r.userId) continue;
      const list = byUser.get(r.userId) || [];
      list.push(r);
      byUser.set(r.userId, list);
    }
    for (const [userId, items] of byUser) {
      if (items.length >= 20) {
        return this.buildDetection('enumeration_attack', 'high', 'user', userId, items[items.length - 1], {
          triggeredRule: 'enumeration',
          description: `${items.length} forbidden access attempts to /api/users/:id by ${userId} within 60s`,
          evidence: items.slice(0, 5).map((r) => r.endpoint),
          confidence: 0.85,
          actionTaken: 'block',
          actionExpires: now + 60 * 60 * 1000,
        });
      }
    }
    return null;
  }

  private detectSessionHijacking(recent: ApiRequest[]): AbuseDetection | null {
    const now = Date.now();
    const window = 5 * 60 * 1000;
    const withSession = recent.filter((r) => r.sessionId && now - r.timestamp <= window);
    const bySession = new Map<string, Set<string>>();
    for (const r of withSession) {
      const set = bySession.get(r.sessionId!) || new Set();
      set.add(r.sourceIp);
      bySession.set(r.sessionId!, set);
    }
    for (const [sessionId, ipSet] of bySession) {
      if (ipSet.size >= 2) {
        const ref = withSession.find((r) => r.sessionId === sessionId)!;
        return this.buildDetection('session_hijacking', 'critical', 'session', sessionId, ref, {
          triggeredRule: 'session_hijacking',
          description: `Session ${sessionId} accessed from ${ipSet.size} different IPs: ${Array.from(ipSet).join(', ')}`,
          evidence: Array.from(ipSet).map((ip) => `ip=${ip}`),
          confidence: 0.95,
          actionTaken: 'block',
          actionExpires: now + 24 * 60 * 60 * 1000,
        });
      }
    }
    return null;
  }

  private detectUserAgentAnomaly(recent: ApiRequest[]): AbuseDetection | null {
    const now = Date.now();
    const window = 60000;
    const emptyUA = recent.filter((r) => !r.userAgent && now - r.timestamp <= window);
    const byIp = new Map<string, number>();
    for (const r of emptyUA) byIp.set(r.sourceIp, (byIp.get(r.sourceIp) || 0) + 1);
    for (const [ip, count] of byIp) {
      if (count >= 20) {
        return this.buildDetection('user_agent_anomaly', 'medium', 'ip', ip, emptyUA[emptyUA.length - 1], {
          triggeredRule: 'empty_user_agent',
          description: `${count} requests with empty User-Agent from ${ip} within 60s`,
          evidence: [`count=${count}`, 'userAgent=""'],
          confidence: 0.75,
          actionTaken: 'challenge',
        });
      }
    }
    return null;
  }

  private detectBotActivity(recent: ApiRequest[]): AbuseDetection | null {
    const now = Date.now();
    const window = 60000;
    const botUA = recent.filter((r) => /bot|spider|crawler|scrapy|wget|curl/i.test(r.userAgent) && now - r.timestamp <= window);
    const byIp = new Map<string, number>();
    for (const r of botUA) byIp.set(r.sourceIp, (byIp.get(r.sourceIp) || 0) + 1);
    for (const [ip, count] of byIp) {
      if (count >= 30) {
        return this.buildDetection('bot_activity', 'low', 'ip', ip, botUA[botUA.length - 1], {
          triggeredRule: 'bot_activity',
          description: `${count} bot-like requests from ${ip} within 60s`,
          evidence: [`count=${count}`, `uaSample=${botUA[0].userAgent.substring(0, 50)}`],
          confidence: 0.7,
          actionTaken: 'challenge',
        });
      }
    }
    return null;
  }

  private buildDetection(
    type: AbuseType,
    severity: Severity,
    subjectType: SubjectType,
    subjectId: string,
    request: ApiRequest,
    opts: { triggeredRule: string; description: string; evidence: string[]; confidence: number; actionTaken: 'block' | 'rate_limit' | 'challenge' | 'log' | 'whitelist'; actionExpires?: number; relatedRequests?: string[] }
  ): AbuseDetection {
    return {
      id: this.generateId('det'),
      timestamp: Date.now(),
      type,
      severity,
      status: 'active',
      subjectType,
      subjectId,
      request,
      description: opts.description,
      evidence: opts.evidence,
      triggeredRule: opts.triggeredRule,
      confidence: opts.confidence,
      actionTaken: opts.actionTaken,
      actionExpires: opts.actionExpires ?? null,
      metadata: {},
      relatedRequests: opts.relatedRequests || [],
      assignedTo: null,
    };
  }

  private async updateBehaviorProfile(request: ApiRequest): Promise<BehaviorProfile> {
    const profiles = await this.loadProfiles();
    const subjectType: SubjectType = request.apiKey ? 'api_key' : request.userId ? 'user' : 'ip';
    const subjectId = request.apiKey || request.userId || request.sourceIp;
    let profile = profiles.find((p) => p.subjectType === subjectType && p.subjectId === subjectId);
    if (!profile) {
      profile = this.emptyProfile(subjectType, subjectId);
      profiles.push(profile);
    }
    profile.totalRequests++;
    profile.lastSeen = Date.now();
    if (profile.firstSeen === 0) profile.firstSeen = request.timestamp;
    const allRequests = await this.loadRequests();
    const subjectRequests = allRequests.filter((r) => {
      if (subjectType === 'api_key') return r.apiKey === subjectId;
      if (subjectType === 'user') return r.userId === subjectId;
      return r.sourceIp === subjectId;
    });
    const endpoints = new Set(subjectRequests.map((r) => r.endpoint));
    profile.uniqueEndpoints = endpoints.size;
    const failures = subjectRequests.filter((r) => r.statusCode >= 400).length;
    profile.failureRate = subjectRequests.length > 0 ? failures / subjectRequests.length : 0;
    profile.avgResponseTime = subjectRequests.reduce((sum, r) => sum + r.responseTime, 0) / Math.max(1, subjectRequests.length);
    profile.dataTransferred = subjectRequests.reduce((sum, r) => sum + r.requestSize + r.responseSize, 0);
    profile.uniqueUserAgents = Array.from(new Set(subjectRequests.map((r) => r.userAgent))).slice(0, 20);
    profile.uniqueIps = Array.from(new Set(subjectRequests.map((r) => r.sourceIp))).slice(0, 20);
    profile.distinctSessions = new Set(subjectRequests.map((r) => r.sessionId).filter(Boolean)).size;
    profile.errorCount = subjectRequests.filter((r) => r.error !== null).length;
    profile.suspiciousScore = this.computeSuspiciousScore(profile, subjectRequests);
    profile.riskFactors = this.computeRiskFactors(profile, subjectRequests);
    await this.store.set(STORE_KEYS.profiles, profiles);
    return profile;
  }

  private emptyProfile(subjectType: SubjectType, subjectId: string): BehaviorProfile {
    return {
      id: this.generateId('prof'),
      subjectType,
      subjectId,
      windowStart: Date.now(),
      windowEnd: Date.now(),
      totalRequests: 0,
      uniqueEndpoints: 0,
      failureRate: 0,
      avgResponseTime: 0,
      dataTransferred: 0,
      uniqueUserAgents: [],
      uniqueIps: [],
      distinctSessions: 0,
      firstSeen: 0,
      lastSeen: 0,
      errorCount: 0,
      suspiciousScore: 0,
      riskFactors: [],
    };
  }

  private computeSuspiciousScore(profile: BehaviorProfile, requests: ApiRequest[]): number {
    let score = 0;
    if (profile.failureRate > 0.5) score += 30;
    else if (profile.failureRate > 0.2) score += 15;
    if (profile.totalRequests > 1000) score += 20;
    if (profile.uniqueIps.length > 5) score += 25;
    if (profile.uniqueUserAgents.length > 10) score += 15;
    if (profile.avgResponseTime > 5000) score += 10;
    if (profile.distinctSessions > 20) score += 15;
    return Math.min(100, score);
  }

  private computeRiskFactors(profile: BehaviorProfile, _requests: ApiRequest[]): string[] {
    const factors: string[] = [];
    if (profile.failureRate > 0.5) factors.push('high_failure_rate');
    if (profile.totalRequests > 1000) factors.push('high_volume');
    if (profile.uniqueIps.length > 5) factors.push('multiple_ips');
    if (profile.uniqueUserAgents.length > 10) factors.push('multiple_user_agents');
    return factors;
  }

  private async loadRequests(): Promise<ApiRequest[]> {
    return (await this.store.get<ApiRequest[]>(STORE_KEYS.requests)) || [];
  }

  private async loadDetections(): Promise<AbuseDetection[]> {
    return (await this.store.get<AbuseDetection[]>(STORE_KEYS.detections)) || [];
  }

  private async loadProfiles(): Promise<BehaviorProfile[]> {
    return (await this.store.get<BehaviorProfile[]>(STORE_KEYS.profiles)) || [];
  }

  private async loadWhitelist(): Promise<Array<{ subjectType: SubjectType; subjectId: string; reason: string; addedAt: number }>> {
    return (await this.store.get<Array<{ subjectType: SubjectType; subjectId: string; reason: string; addedAt: number }>>(STORE_KEYS.whitelist)) || [];
  }

  private async loadRules(): Promise<DetectionRule[]> {
    let rules = await this.store.get<DetectionRule[]>(STORE_KEYS.rules);
    if (!rules || rules.length === 0) {
      rules = this.buildDefaultRules();
      await this.store.set(STORE_KEYS.rules, rules);
      return rules;
    }
    const valid = rules.filter((r) => r && r.id && r.checkName && typeof r.enabled === 'boolean');
    if (valid.length !== rules.length) {
      await this.store.set(STORE_KEYS.rules, valid.length > 0 ? valid : this.buildDefaultRules());
      return valid.length > 0 ? valid : this.buildDefaultRules();
    }
    return rules;
  }

  private buildDefaultRules(): DetectionRule[] {
    return [
      { id: this.generateId('rule'), name: 'Brute Force Login', description: '5+ failed logins from same IP within 60s', type: 'brute_force', severity: 'high', checkName: 'brute_force', enabled: true },
      { id: this.generateId('rule'), name: 'Credential Stuffing', description: '10+ distinct userIds from same IP within 5min', type: 'credential_stuffing', severity: 'high', checkName: 'credential_stuffing', enabled: true },
      { id: this.generateId('rule'), name: 'API Scraping', description: '100+ GET /api/* from same IP within 60s', type: 'api_scraping', severity: 'high', checkName: 'api_scraping', enabled: true },
      { id: this.generateId('rule'), name: 'Rate Limit Exceeded', description: 'Requests/min > 2x limit', type: 'rate_limit_exceeded', severity: 'medium', checkName: 'rate_limit_exceeded', enabled: true },
      { id: this.generateId('rule'), name: 'Enumeration Attack', description: '20+ forbidden /api/users/:id access within 1min', type: 'enumeration_attack', severity: 'high', checkName: 'enumeration_attack', enabled: true },
      { id: this.generateId('rule'), name: 'Session Hijacking', description: 'Same session from 2+ IPs within 5min', type: 'session_hijacking', severity: 'critical', checkName: 'session_hijacking', enabled: true },
      { id: this.generateId('rule'), name: 'Empty User Agent', description: '20+ requests with empty UA from same IP within 60s', type: 'user_agent_anomaly', severity: 'medium', checkName: 'user_agent_anomaly', enabled: true },
      { id: this.generateId('rule'), name: 'Bot Activity', description: '30+ bot-like requests from same IP within 60s', type: 'bot_activity', severity: 'low', checkName: 'bot_activity', enabled: true },
    ];
  }

  private runCheck(name: AbuseType, recent: ApiRequest[]): AbuseDetection | null {
    switch (name) {
      case 'brute_force': return this.detectBruteForce(recent);
      case 'credential_stuffing': return this.detectCredentialStuffing(recent);
      case 'api_scraping': return this.detectScraping(recent);
      case 'rate_limit_exceeded': return this.detectRateLimitExceedance(recent);
      case 'enumeration_attack': return this.detectEnumeration(recent);
      case 'session_hijacking': return this.detectSessionHijacking(recent);
      case 'user_agent_anomaly': return this.detectUserAgentAnomaly(recent);
      case 'bot_activity': return this.detectBotActivity(recent);
      default: return null;
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`;
  }
}

function severityToRisk(severity: Severity): number {
  switch (severity) {
    case 'critical': return 100;
    case 'high': return 75;
    case 'medium': return 50;
    case 'low': return 25;
    case 'info': return 10;
  }
}
