import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type AttackType =
  | 'credential_stuffing'
  | 'password_spraying'
  | 'brute_force'
  | 'breach_replay'
  | 'session_hijacking'
  | 'token_theft'
  | 'oauth_abuse'
  | 'sso_bypass'
  | 'mfa_fatigue'
  | 'mfa_bypass'
  | 'kerberoasting'
  | 'pass_the_hash'
  | 'golden_ticket'
  | 'silver_ticket'
  | 'dcshadow'
  | 'unknown';

export type AuthMethod = 'password' | 'sso' | 'oauth' | 'api_key' | 'mfa' | 'passkey' | 'certificate';

export type RecommendedAction =
  | 'block_ip'
  | 'force_password_reset'
  | 'disable_account'
  | 'require_mfa'
  | 'alert_security_team'
  | 'lock_session'
  | 'log_only'
  | 'investigate';

export interface LoginAttempt {
  id: string;
  timestamp: number;
  userId: string | null;
  username: string;
  sourceIp: string;
  userAgent: string;
  geo: string | null;
  country: string | null;
  asn: number | null;
  deviceFingerprint: string | null;
  authMethod: AuthMethod;
  mfaCompleted: boolean;
  success: boolean;
  failureReason: string | null;
  responseTime: number;
  sessionId: string | null;
  application: string;
  headers: Record<string, string>;
}

export interface CredentialStuffingDetection {
  id: string;
  timestamp: number;
  attackType: AttackType;
  severity: Severity;
  title: string;
  description: string;
  evidence: string[];
  sourceIp: string;
  asn: number | null;
  userIds: string[];
  attemptCount: number;
  timeWindowMs: number;
  successCount: number;
  confidence: number;
  recommendedAction: RecommendedAction;
  blocked: boolean;
  resolvedAt: number | null;
  assignedTo: string | null;
  notes: string;
}

export interface IpReputationSource {
  source: string;
  listed: boolean;
  reason: string;
}

export interface IpReputation {
  ip: string;
  reputation: 'malicious' | 'suspicious' | 'neutral' | 'trusted' | 'unknown';
  score: number;
  sources: IpReputationSource[];
  country: string | null;
  asn: number | null;
  isp: string | null;
  isTor: boolean;
  isVpn: boolean;
  isProxy: boolean;
  isDatacenter: boolean;
  lastSeen: number;
}

export interface CompromisedCredential {
  id: string;
  userId: string;
  email: string;
  source: string;
  breachDate: number;
  discoveredAt: number;
  exposedData: string[];
  plaintextPassword: string | null;
  passwordHash: string;
  severity: Severity;
  notified: boolean;
  passwordReset: boolean;
  resetAt: number | null;
}

export interface CredentialStuffingStats {
  totalAttempts: number;
  totalDetections: number;
  byAttackType: Record<AttackType, number>;
  bySeverity: Record<Severity, number>;
  blockedAttempts: number;
  successfulAttacks: number;
  meanAttemptsPerDetection: number;
  topAttackingIps: Array<{ ip: string; attempts: number; reputation: string }>;
  topTargetedUsers: Array<{ userId: string; attempts: number; compromised: boolean }>;
  compromisedCredentials: number;
  breachSourcesTracked: number;
}

const STORE_KEYS = {
  attempts: 'itdr/login-attempts.json',
  detections: 'itdr/detections.json',
  ipReputation: 'itdr/ip-reputation.json',
  credentials: 'itdr/compromised-credentials.json',
};

const HISTORY_LIMIT = 50000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function emptyAttackTypeMap(): Record<AttackType, number> {
  return {
    credential_stuffing: 0,
    password_spraying: 0,
    brute_force: 0,
    breach_replay: 0,
    session_hijacking: 0,
    token_theft: 0,
    oauth_abuse: 0,
    sso_bypass: 0,
    mfa_fatigue: 0,
    mfa_bypass: 0,
    kerberoasting: 0,
    pass_the_hash: 0,
    golden_ticket: 0,
    silver_ticket: 0,
    dcshadow: 0,
    unknown: 0,
  };
}

function emptySeverityMap(): Record<Severity, number> {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

export class CredentialStuffingDetector {
  constructor(private store: JsonStore) {}

  async recordLogin(attempt: Omit<LoginAttempt, 'id'>): Promise<{ attempt: LoginAttempt; detections: CredentialStuffingDetection[] }> {
    const full: LoginAttempt = { ...attempt, id: this.generateId('login') };
    const all = await this.loadAttempts();
    all.push(full);
    if (all.length > HISTORY_LIMIT) all.splice(0, all.length - HISTORY_LIMIT);
    await this.store.set(STORE_KEYS.attempts, all);

    const detections: CredentialStuffingDetection[] = [];

    const stuffing = this.detectCredentialStuffing(all);
    if (stuffing) detections.push(stuffing);

    const spraying = this.detectPasswordSpraying(all);
    if (spraying) detections.push(spraying);

    const brute = this.detectBruteForce(all);
    if (brute) detections.push(brute);

    const breach = await this.detectBreachReplay(full);
    if (breach) detections.push(breach);

    const mfaFatigue = this.detectMfaFatigue(all);
    if (mfaFatigue) detections.push(mfaFatigue);

    const travel = this.detectImpossibleTravel(all);
    if (travel) detections.push(travel);

    if (detections.length > 0) {
      const allDetections = await this.loadDetections();
      allDetections.push(...detections);
      if (allDetections.length > HISTORY_LIMIT) allDetections.splice(0, allDetections.length - HISTORY_LIMIT);
      await this.store.set(STORE_KEYS.detections, allDetections);

      const rep = await this.lookupIpReputation(full.sourceIp);
      const reputations = await this.loadIpReputations();
      const idx = reputations.findIndex((r) => r.ip === rep.ip);
      if (idx >= 0) reputations[idx] = rep;
      else reputations.push(rep);
      await this.store.set(STORE_KEYS.ipReputation, reputations);
    }

    return { attempt: full, detections };
  }

  async recordBatch(attempts: Omit<LoginAttempt, 'id'>[]): Promise<{ attempts: LoginAttempt[]; detections: CredentialStuffingDetection[] }> {
    const allDetections: CredentialStuffingDetection[] = [];
    const recorded: LoginAttempt[] = [];
    for (const a of attempts) {
      const result = await this.recordLogin(a);
      recorded.push(result.attempt);
      allDetections.push(...result.detections);
    }
    return { attempts: recorded, detections: allDetections };
  }

  async getDetections(filters?: { attackType?: AttackType; severity?: Severity; sourceIp?: string; userId?: string; since?: number; resolved?: boolean; limit?: number }): Promise<CredentialStuffingDetection[]> {
    let items = await this.loadDetections();
    if (filters?.attackType) items = items.filter((d) => d.attackType === filters.attackType);
    if (filters?.severity) items = items.filter((d) => d.severity === filters.severity);
    if (filters?.sourceIp) items = items.filter((d) => d.sourceIp === filters.sourceIp);
    if (filters?.userId) items = items.filter((d) => d.userIds.includes(filters.userId!));
    if (filters?.since !== undefined) items = items.filter((d) => d.timestamp >= filters.since!);
    if (filters?.resolved !== undefined) {
      items = items.filter((d) => (d.resolvedAt !== null) === filters.resolved);
    }
    items.sort((a, b) => b.timestamp - a.timestamp);
    if (filters?.limit !== undefined) items = items.slice(0, filters.limit);
    return items;
  }

  async updateDetection(detectionId: string, updates: Partial<CredentialStuffingDetection>): Promise<boolean> {
    const detections = await this.loadDetections();
    const idx = detections.findIndex((d) => d.id === detectionId);
    if (idx === -1) return false;
    detections[idx] = { ...detections[idx], ...updates, id: detections[idx].id, timestamp: detections[idx].timestamp };
    await this.store.set(STORE_KEYS.detections, detections);
    return true;
  }

  async getIpReputation(ip: string): Promise<IpReputation | null> {
    const reps = await this.loadIpReputations();
    return reps.find((r) => r.ip === ip) || null;
  }

  async listIpReputations(filters?: { reputation?: string; minScore?: number; limit?: number }): Promise<IpReputation[]> {
    let items = await this.loadIpReputations();
    if (filters?.reputation) items = items.filter((r) => r.reputation === filters.reputation);
    if (filters?.minScore !== undefined) items = items.filter((r) => r.score >= filters.minScore!);
    items.sort((a, b) => a.score - b.score);
    if (filters?.limit !== undefined) items = items.slice(0, filters.limit);
    return items;
  }

  async addCompromisedCredential(cred: Omit<CompromisedCredential, 'id' | 'discoveredAt' | 'notified'>): Promise<CompromisedCredential> {
    const all = await this.loadCredentials();
    const full: CompromisedCredential = {
      ...cred,
      id: this.generateId('cred'),
      discoveredAt: Date.now(),
      notified: false,
    };
    all.push(full);
    await this.store.set(STORE_KEYS.credentials, all);
    return full;
  }

  async checkCompromisedCredentials(userId: string): Promise<CompromisedCredential[]> {
    const all = await this.loadCredentials();
    return all.filter((c) => c.userId === userId);
  }

  async listCompromisedCredentials(filters?: { severity?: Severity; passwordReset?: boolean; since?: number; limit?: number }): Promise<CompromisedCredential[]> {
    let items = await this.loadCredentials();
    if (filters?.severity) items = items.filter((c) => c.severity === filters.severity);
    if (filters?.passwordReset !== undefined) items = items.filter((c) => c.passwordReset === filters.passwordReset);
    if (filters?.since !== undefined) items = items.filter((c) => c.discoveredAt >= filters.since!);
    items.sort((a, b) => b.discoveredAt - a.discoveredAt);
    if (filters?.limit !== undefined) items = items.slice(0, filters.limit);
    return items;
  }

  async markPasswordReset(credId: string): Promise<boolean> {
    const all = await this.loadCredentials();
    const idx = all.findIndex((c) => c.id === credId);
    if (idx === -1) return false;
    all[idx].passwordReset = true;
    all[idx].resetAt = Date.now();
    await this.store.set(STORE_KEYS.credentials, all);
    return true;
  }

  async getStats(since?: number): Promise<CredentialStuffingStats> {
    const attempts = await this.loadAttempts();
    let detections = await this.loadDetections();
    const credentials = await this.loadCredentials();
    const reps = await this.loadIpReputations();

    if (since !== undefined) {
      detections = detections.filter((d) => d.timestamp >= since);
    }

    const byAttackType = emptyAttackTypeMap();
    const bySeverity = emptySeverityMap();
    let blocked = 0;
    let successful = 0;
    for (const d of detections) {
      byAttackType[d.attackType] = (byAttackType[d.attackType] || 0) + 1;
      bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
      if (d.blocked) blocked++;
      if (d.successCount > 0) successful++;
    }

    const ipMap = new Map<string, { ip: string; attempts: number; reputation: string }>();
    const userMap = new Map<string, { userId: string; attempts: number; compromised: boolean }>();

    for (const a of attempts) {
      const existingIp = ipMap.get(a.sourceIp);
      if (existingIp) existingIp.attempts++;
      else {
        const rep = reps.find((r) => r.ip === a.sourceIp);
        ipMap.set(a.sourceIp, { ip: a.sourceIp, attempts: 1, reputation: rep?.reputation ?? 'unknown' });
      }
      if (a.userId) {
        const existingUser = userMap.get(a.userId);
        const compromised = credentials.some((c) => c.userId === a.userId);
        if (existingUser) existingUser.attempts++;
        else userMap.set(a.userId, { userId: a.userId, attempts: 1, compromised });
      }
    }

    const breachSources = new Set(credentials.map((c) => c.source));

    return {
      totalAttempts: attempts.length,
      totalDetections: detections.length,
      byAttackType,
      bySeverity,
      blockedAttempts: blocked,
      successfulAttacks: successful,
      meanAttemptsPerDetection: detections.length > 0 ? attempts.length / detections.length : 0,
      topAttackingIps: Array.from(ipMap.values()).sort((a, b) => b.attempts - a.attempts).slice(0, 10),
      topTargetedUsers: Array.from(userMap.values()).sort((a, b) => b.attempts - a.attempts).slice(0, 10),
      compromisedCredentials: credentials.length,
      breachSourcesTracked: breachSources.size,
    };
  }

  private detectCredentialStuffing(attempts: LoginAttempt[]): CredentialStuffingDetection | null {
    const now = Date.now();
    const window = 5 * 60 * 1000;
    const recent = attempts.filter((a) => a.timestamp >= now - window);
    const byIp = new Map<string, Set<string>>();
    const byIpList = new Map<string, LoginAttempt[]>();
    for (const a of recent) {
      const set = byIp.get(a.sourceIp) || new Set<string>();
      set.add(a.username);
      byIp.set(a.sourceIp, set);
      const list = byIpList.get(a.sourceIp) || [];
      list.push(a);
      byIpList.set(a.sourceIp, list);
    }
    for (const [ip, userSet] of byIp) {
      if (userSet.size >= 10) {
        const list = byIpList.get(ip)!;
        const successCount = list.filter((a) => a.success).length;
        return this.buildDetection({
          attackType: 'credential_stuffing',
          severity: 'high',
          title: 'Credential Stuffing Attack',
          description: `${userSet.size} distinct usernames attempted from ${ip} within ${Math.round(window / 1000)}s`,
          evidence: Array.from(userSet).slice(0, 10).map((u) => `username=${u}`),
          sourceIp: ip,
          asn: list[0].asn,
          userIds: Array.from(new Set(list.map((a) => a.userId).filter((u): u is string => u !== null))),
          attemptCount: list.length,
          timeWindowMs: window,
          successCount,
          confidence: Math.min(0.98, 0.7 + userSet.size * 0.02),
          recommendedAction: 'block_ip',
        });
      }
    }
    return null;
  }

  private detectPasswordSpraying(attempts: LoginAttempt[]): CredentialStuffingDetection | null {
    const now = Date.now();
    const window = 10 * 60 * 1000;
    const recent = attempts.filter((a) => !a.success && a.timestamp >= now - window);
    const byIpPattern = new Map<string, LoginAttempt[]>();
    for (const a of recent) {
      const key = `${a.sourceIp}::${a.failureReason ?? 'unknown'}`;
      const list = byIpPattern.get(key) || [];
      list.push(a);
      byIpPattern.set(key, list);
    }
    for (const [key, list] of byIpPattern) {
      const uniqueUsers = new Set(list.map((a) => a.username));
      if (uniqueUsers.size >= 20) {
        const ip = key.split('::')[0];
        return this.buildDetection({
          attackType: 'password_spraying',
          severity: 'high',
          title: 'Password Spraying Attack',
          description: `${uniqueUsers.size} distinct usernames sprayed from ${ip} with same failure pattern within ${Math.round(window / 1000)}s`,
          evidence: [
            `failureReason=${list[0].failureReason ?? 'unknown'}`,
            `distinctUsernames=${uniqueUsers.size}`,
            ...Array.from(uniqueUsers).slice(0, 5).map((u) => `username=${u}`),
          ],
          sourceIp: ip,
          asn: list[0].asn,
          userIds: Array.from(new Set(list.map((a) => a.userId).filter((u): u is string => u !== null))),
          attemptCount: list.length,
          timeWindowMs: window,
          successCount: 0,
          confidence: Math.min(0.95, 0.75 + uniqueUsers.size * 0.01),
          recommendedAction: 'block_ip',
        });
      }
    }
    return null;
  }

  private detectBruteForce(attempts: LoginAttempt[]): CredentialStuffingDetection | null {
    const now = Date.now();
    const window = 60 * 1000;
    const recent = attempts.filter((a) => !a.success && a.userId && a.timestamp >= now - window);
    const byUserIp = new Map<string, LoginAttempt[]>();
    for (const a of recent) {
      const key = `${a.userId}::${a.sourceIp}`;
      const list = byUserIp.get(key) || [];
      list.push(a);
      byUserIp.set(key, list);
    }
    for (const [key, list] of byUserIp) {
      if (list.length >= 5) {
        const [userId, ip] = key.split('::');
        return this.buildDetection({
          attackType: 'brute_force',
          severity: 'high',
          title: 'Brute Force Attack',
          description: `${list.length} failed logins for userId ${userId} from ${ip} within ${Math.round(window / 1000)}s`,
          evidence: list.slice(-5).map((a) => `${a.timestamp}: ${a.username} → ${a.failureReason ?? 'failed'}`),
          sourceIp: ip,
          asn: list[0].asn,
          userIds: [userId],
          attemptCount: list.length,
          timeWindowMs: window,
          successCount: 0,
          confidence: Math.min(0.95, 0.6 + list.length * 0.07),
          recommendedAction: 'disable_account',
        });
      }
    }
    return null;
  }

  private async detectBreachReplay(attempt: LoginAttempt): Promise<CredentialStuffingDetection | null> {
    if (!attempt.success) return null;
    if (!attempt.userId) return null;
    const credentials = await this.loadCredentials();
    const breachThreshold = Date.now() - SEVEN_DAYS_MS;
    const matching = credentials.filter(
      (c) => c.userId === attempt.userId && c.discoveredAt >= breachThreshold,
    );
    if (matching.length === 0) return null;
    return this.buildDetection({
      attackType: 'breach_replay',
      severity: 'critical',
      title: 'Breach Replay',
      description: `User ${attempt.userId} successfully logged in within 7 days of credentials appearing in known breach (${matching[0].source})`,
      evidence: matching.map((c) => `breach=${c.source} discoveredAt=${c.discoveredAt} severity=${c.severity}`),
      sourceIp: attempt.sourceIp,
      asn: attempt.asn,
      userIds: [attempt.userId],
      attemptCount: 1,
      timeWindowMs: SEVEN_DAYS_MS,
      successCount: 1,
      confidence: 0.95,
      recommendedAction: 'force_password_reset',
    });
  }

  private detectMfaFatigue(attempts: LoginAttempt[]): CredentialStuffingDetection | null {
    const now = Date.now();
    const window = 10 * 60 * 1000;
    const recent = attempts.filter((a) => a.authMethod === 'mfa' && a.userId && a.timestamp >= now - window);
    const byUser = new Map<string, LoginAttempt[]>();
    for (const a of recent) {
      const list = byUser.get(a.userId!) || [];
      list.push(a);
      byUser.set(a.userId!, list);
    }
    for (const [userId, list] of byUser) {
      if (list.length < 5) continue;
      const hasFailure = list.some((a) => !a.success);
      if (!hasFailure) continue;
      const ips = Array.from(new Set(list.map((a) => a.sourceIp)));
      return this.buildDetection({
        attackType: 'mfa_fatigue',
        severity: 'high',
        title: 'MFA Fatigue Attack',
        description: `${list.length} MFA prompts for userId ${userId} within ${Math.round(window / 1000)}s with at least 1 failure`,
        evidence: list.slice(-5).map((a) => `${a.timestamp}: success=${a.success} ip=${a.sourceIp}`),
        sourceIp: list[0].sourceIp,
        asn: list[0].asn,
        userIds: [userId],
        attemptCount: list.length,
        timeWindowMs: window,
        successCount: list.filter((a) => a.success).length,
        confidence: Math.min(0.9, 0.6 + list.length * 0.04),
        recommendedAction: ips.length > 1 ? 'lock_session' : 'alert_security_team',
      });
    }
    return null;
  }

  private detectImpossibleTravel(attempts: LoginAttempt[]): CredentialStuffingDetection | null {
    const now = Date.now();
    const window = 60 * 60 * 1000;
    const recent = attempts.filter((a) => a.success && a.userId && a.country && a.timestamp >= now - window);
    const byUser = new Map<string, LoginAttempt[]>();
    for (const a of recent) {
      const list = byUser.get(a.userId!) || [];
      list.push(a);
      byUser.set(a.userId!, list);
    }
    for (const [userId, list] of byUser) {
      if (list.length < 2) continue;
      const sorted = [...list].sort((a, b) => a.timestamp - b.timestamp);
      const countries = Array.from(new Set(sorted.map((a) => a.country!)));
      if (countries.length < 2) continue;
      return this.buildDetection({
        attackType: 'session_hijacking',
        severity: 'high',
        title: 'Impossible Travel',
        description: `User ${userId} logged in successfully from ${countries.length} different countries (${countries.join(', ')}) within ${Math.round(window / 1000)}s`,
        evidence: sorted.map((a) => `${a.timestamp}: country=${a.country} ip=${a.sourceIp}`),
        sourceIp: sorted[sorted.length - 1].sourceIp,
        asn: sorted[sorted.length - 1].asn,
        userIds: [userId],
        attemptCount: sorted.length,
        timeWindowMs: window,
        successCount: sorted.length,
        confidence: 0.9,
        recommendedAction: 'lock_session',
      });
    }
    return null;
  }

  private async lookupIpReputation(ip: string): Promise<IpReputation> {
    const reps = await this.loadIpReputations();
    const existing = reps.find((r) => r.ip === ip);
    if (existing) {
      existing.lastSeen = Date.now();
      return existing;
    }
    const isPrivate = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|127\.|::1|fc|fd)/.test(ip);
    const isTor = /^198\.18\.|^185\.220\./.test(ip);
    const isDatacenter = /^52\.|^54\.|^35\./.test(ip);
    return {
      ip,
      reputation: isTor ? 'malicious' : isDatacenter ? 'suspicious' : isPrivate ? 'trusted' : 'unknown',
      score: isTor ? 5 : isDatacenter ? 35 : isPrivate ? 90 : 70,
      sources: [],
      country: null,
      asn: null,
      isp: null,
      isTor,
      isVpn: false,
      isProxy: isTor,
      isDatacenter,
      lastSeen: Date.now(),
    };
  }

  private buildDetection(opts: {
    attackType: AttackType;
    severity: Severity;
    title: string;
    description: string;
    evidence: string[];
    sourceIp: string;
    asn: number | null;
    userIds: string[];
    attemptCount: number;
    timeWindowMs: number;
    successCount: number;
    confidence: number;
    recommendedAction: RecommendedAction;
  }): CredentialStuffingDetection {
    return {
      id: this.generateId('det'),
      timestamp: Date.now(),
      attackType: opts.attackType,
      severity: opts.severity,
      title: opts.title,
      description: opts.description,
      evidence: opts.evidence,
      sourceIp: opts.sourceIp,
      asn: opts.asn,
      userIds: opts.userIds,
      attemptCount: opts.attemptCount,
      timeWindowMs: opts.timeWindowMs,
      successCount: opts.successCount,
      confidence: opts.confidence,
      recommendedAction: opts.recommendedAction,
      blocked: false,
      resolvedAt: null,
      assignedTo: null,
      notes: '',
    };
  }

  private async loadAttempts(): Promise<LoginAttempt[]> {
    return (await this.store.get<LoginAttempt[]>(STORE_KEYS.attempts)) || [];
  }

  private async loadDetections(): Promise<CredentialStuffingDetection[]> {
    return (await this.store.get<CredentialStuffingDetection[]>(STORE_KEYS.detections)) || [];
  }

  private async loadIpReputations(): Promise<IpReputation[]> {
    return (await this.store.get<IpReputation[]>(STORE_KEYS.ipReputation)) || [];
  }

  private async loadCredentials(): Promise<CompromisedCredential[]> {
    return (await this.store.get<CompromisedCredential[]>(STORE_KEYS.credentials)) || [];
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`;
  }
}
