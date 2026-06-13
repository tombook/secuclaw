import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type MfaAttackType = 'mfa_fatigue' | 'mfa_bombing' | 'sim_swap' | 'prompt_bombing' | 'authenticator_phishing' | 'push_fatigue' | 'sms_interception' | 'voice_phishing' | 'realtime_phishing' | 'mfa_replay' | 'mfa_bypass' | 'session_hijack_after_mfa' | 'passkey_phishing' | 'webauthn_bypass' | 'unknown';
export type MfaStatus = 'pending' | 'verified' | 'rejected' | 'expired' | 'cancelled' | 'locked';
export type MfaMethod = 'totp' | 'sms' | 'email' | 'push' | 'fido2' | 'webauthn' | 'passkey' | 'voice' | 'hardware_token' | 'biometric';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface MfaChallenge {
  id: string;
  timestamp: number;
  userId: string;
  sessionId: string;
  method: MfaMethod;
  status: MfaStatus;
  sourceIp: string;
  userAgent: string;
  deviceFingerprint: string | null;
  geo: string | null;
  country: string | null;
  attemptCount: number;
  codeRedacted: string;
  appId: string;
  expiresAt: number;
  completedAt: number | null;
  responseTimeMs: number | null;
  rejected: boolean;
  rejectReason: string | null;
  context: { initiatedFromIp: string; triggeredBy: 'login' | 'sensitive_action' | 'admin' | 'recovery'; riskScore: number };
}

export interface MfaAttackDetection {
  id: string;
  timestamp: number;
  attackType: MfaAttackType;
  severity: Severity;
  userId: string;
  sourceIp: string;
  method: MfaMethod;
  title: string;
  description: string;
  evidence: string[];
  challenges: string[];
  attemptCount: number;
  timeWindowMs: number;
  confidence: number;
  recommendation: 'block' | 'lock_account' | 'force_reenroll' | 'notify_user' | 'require_video_verification' | 'alert_only' | 'log';
  blocked: boolean;
  resolvedAt: number | null;
  notes: string;
}

export interface SimSwapIndicator {
  id: string;
  userId: string;
  phoneNumber: string;
  carrier: string | null;
  timestamp: number;
  indicators: string[];
  source: 'carrier_api' | 'user_report' | 'threat_intel' | 'behavioral';
  riskScore: number;
  description: string;
  confirmed: boolean;
  resolvedAt: number | null;
}

export interface MfaStats {
  totalChallenges: number;
  totalDetections: number;
  successRate: number;
  byMethod: Record<MfaMethod, number>;
  byStatus: Record<MfaStatus, number>;
  byAttackType: Record<MfaAttackType, number>;
  bySeverity: Record<Severity, number>;
  averageCompletionTime: number;
  topTargetedUsers: Array<{ userId: string; challenges: number; attacks: number }>;
  simSwapIndicators: number;
  reenrollmentsTriggered: number;
}

const STORE_KEYS = {
  challenges: 'itdr/mfa-challenges.json',
  detections: 'itdr/mfa-detections.json',
  simSwaps: 'itdr/sim-swaps.json',
};

const HISTORY_LIMIT = 30000;

function emptyMethodMap(): Record<MfaMethod, number> {
  return { totp: 0, sms: 0, email: 0, push: 0, fido2: 0, webauthn: 0, passkey: 0, voice: 0, hardware_token: 0, biometric: 0 };
}
function emptyStatusMap(): Record<MfaStatus, number> {
  return { pending: 0, verified: 0, rejected: 0, expired: 0, cancelled: 0, locked: 0 };
}
function emptyAttackMap(): Record<MfaAttackType, number> {
  return { mfa_fatigue: 0, mfa_bombing: 0, sim_swap: 0, prompt_bombing: 0, authenticator_phishing: 0, push_fatigue: 0, sms_interception: 0, voice_phishing: 0, realtime_phishing: 0, mfa_replay: 0, mfa_bypass: 0, session_hijack_after_mfa: 0, passkey_phishing: 0, webauthn_bypass: 0, unknown: 0 };
}
function emptySeverityMap(): Record<Severity, number> {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

export class MfaAttackDetector {
  constructor(private store: JsonStore) {}

  async recordChallenge(challengeInput: Omit<MfaChallenge, 'id'> & { id?: string }): Promise<{ challenge: MfaChallenge; detections: MfaAttackDetection[] }> {
    const challenge: MfaChallenge = { ...challengeInput, id: challengeInput.id || this.generateId('mfa') };
    const challenges = await this.loadChallenges();
    challenges.push(challenge);
    if (challenges.length > HISTORY_LIMIT) challenges.splice(0, challenges.length - HISTORY_LIMIT);
    await this.store.set(STORE_KEYS.challenges, challenges);

    const userChallenges = challenges.filter((c) => c.userId === challenge.userId);
    const detections: MfaAttackDetection[] = [];
    for (const detector of [this.detectMfaFatigue, this.detectMfaBypass, this.detectPromptBombing, this.detectRealTimePhishing, this.detectAuthenticatorCompromise, this.detectSessionHijackAfterMfa]) {
      const d = detector.call(this, userChallenges);
      if (d && !this.detectionExists(d, await this.loadDetections())) {
        d.id = this.generateId('mfad');
        d.timestamp = Date.now();
        detections.push(d);
      }
    }
    if (detections.length > 0) {
      const all = await this.loadDetections();
      all.push(...detections);
      if (all.length > HISTORY_LIMIT) all.splice(0, all.length - HISTORY_LIMIT);
      await this.store.set(STORE_KEYS.detections, all);
    }
    return { challenge, detections };
  }

  async recordBatch(challengeInputs: Array<Omit<MfaChallenge, 'id'> & { id?: string }>): Promise<{ challenges: MfaChallenge[]; detections: MfaAttackDetection[] }> {
    const resultChallenges: MfaChallenge[] = [];
    const resultDetections: MfaAttackDetection[] = [];
    for (const c of challengeInputs) {
      const r = await this.recordChallenge(c);
      resultChallenges.push(r.challenge);
      resultDetections.push(...r.detections);
    }
    return { challenges: resultChallenges, detections: resultDetections };
  }

  async getChallenge(challengeId: string): Promise<MfaChallenge | null> {
    const challenges = await this.loadChallenges();
    return challenges.find((c) => c.id === challengeId) || null;
  }

  async listChallenges(filters?: { userId?: string; method?: MfaMethod; status?: MfaStatus; since?: number; limit?: number }): Promise<MfaChallenge[]> {
    let challenges = await this.loadChallenges();
    if (filters?.userId) challenges = challenges.filter((c) => c.userId === filters.userId);
    if (filters?.method) challenges = challenges.filter((c) => c.method === filters.method);
    if (filters?.status) challenges = challenges.filter((c) => c.status === filters.status);
    if (filters?.since !== undefined) challenges = challenges.filter((c) => c.timestamp >= filters.since!);
    challenges.sort((a, b) => b.timestamp - a.timestamp);
    if (filters?.limit !== undefined) challenges = challenges.slice(0, filters.limit);
    return challenges;
  }

  async getDetections(filters?: { attackType?: MfaAttackType; severity?: Severity; userId?: string; since?: number; limit?: number }): Promise<MfaAttackDetection[]> {
    let detections = await this.loadDetections();
    if (filters?.attackType) detections = detections.filter((d) => d.attackType === filters.attackType);
    if (filters?.severity) detections = detections.filter((d) => d.severity === filters.severity);
    if (filters?.userId) detections = detections.filter((d) => d.userId === filters.userId);
    if (filters?.since !== undefined) detections = detections.filter((d) => d.timestamp >= filters.since!);
    detections.sort((a, b) => b.timestamp - a.timestamp);
    if (filters?.limit !== undefined) detections = detections.slice(0, filters.limit);
    return detections;
  }

  async updateDetection(detectionId: string, updates: Partial<MfaAttackDetection>): Promise<boolean> {
    const detections = await this.loadDetections();
    const idx = detections.findIndex((d) => d.id === detectionId);
    if (idx === -1) return false;
    detections[idx] = { ...detections[idx], ...updates };
    await this.store.set(STORE_KEYS.detections, detections);
    return true;
  }

  async recordSimSwap(indicator: Omit<SimSwapIndicator, 'id'>): Promise<SimSwapIndicator> {
    const newInd: SimSwapIndicator = { ...indicator, id: this.generateId('sim') };
    const all = await this.loadSimSwaps();
    all.push(newInd);
    if (all.length > 5000) all.splice(0, all.length - 5000);
    await this.store.set(STORE_KEYS.simSwaps, all);
    return newInd;
  }

  async listSimSwaps(filters?: { userId?: string; confirmed?: boolean; since?: number; limit?: number }): Promise<SimSwapIndicator[]> {
    let items = await this.loadSimSwaps();
    if (filters?.userId) items = items.filter((s) => s.userId === filters.userId);
    if (filters?.confirmed !== undefined) items = items.filter((s) => s.confirmed === filters.confirmed);
    if (filters?.since !== undefined) items = items.filter((s) => s.timestamp >= filters.since!);
    items.sort((a, b) => b.timestamp - a.timestamp);
    if (filters?.limit !== undefined) items = items.slice(0, filters.limit);
    return items;
  }

  async confirmSimSwap(swapId: string, confirmed: boolean): Promise<boolean> {
    const all = await this.loadSimSwaps();
    const idx = all.findIndex((s) => s.id === swapId);
    if (idx === -1) return false;
    all[idx].confirmed = confirmed;
    if (confirmed) all[idx].resolvedAt = Date.now();
    await this.store.set(STORE_KEYS.simSwaps, all);
    return true;
  }

  async getStats(since?: number): Promise<MfaStats> {
    let challenges = await this.loadChallenges();
    if (since !== undefined) challenges = challenges.filter((c) => c.timestamp >= since);
    const detections = await this.loadDetections();
    const simSwaps = await this.loadSimSwaps();
    const byMethod = emptyMethodMap();
    const byStatus = emptyStatusMap();
    const byAttackType = emptyAttackMap();
    const bySeverity = emptySeverityMap();
    let totalCompletionTime = 0;
    let completedCount = 0;
    let verifiedCount = 0;
    for (const c of challenges) {
      byMethod[c.method]++;
      byStatus[c.status]++;
      if (c.status === 'verified') verifiedCount++;
      if (c.completedAt) {
        totalCompletionTime += c.completedAt - c.timestamp;
        completedCount++;
      }
    }
    for (const d of detections) {
      byAttackType[d.attackType]++;
      bySeverity[d.severity]++;
    }
    const userMap = new Map<string, { userId: string; challenges: number; attacks: number }>();
    for (const c of challenges) {
      const ex = userMap.get(c.userId) || { userId: c.userId, challenges: 0, attacks: 0 };
      ex.challenges++;
      userMap.set(c.userId, ex);
    }
    for (const d of detections) {
      const ex = userMap.get(d.userId) || { userId: d.userId, challenges: 0, attacks: 0 };
      ex.attacks++;
      userMap.set(d.userId, ex);
    }
    return {
      totalChallenges: challenges.length,
      totalDetections: detections.length,
      successRate: challenges.length > 0 ? verifiedCount / challenges.length : 0,
      byMethod,
      byStatus,
      byAttackType,
      bySeverity,
      averageCompletionTime: completedCount > 0 ? totalCompletionTime / completedCount : 0,
      topTargetedUsers: Array.from(userMap.values()).sort((a, b) => b.attacks - a.attacks).slice(0, 10),
      simSwapIndicators: simSwaps.length,
      reenrollmentsTriggered: 0,
    };
  }

  private detectMfaFatigue(challenges: MfaChallenge[]): MfaAttackDetection | null {
    const now = Date.now();
    const window = 10 * 60 * 1000;
    const recent = challenges.filter((c) => now - c.timestamp <= window);
    if (recent.length < 5) return null;
    const rejected = recent.filter((c) => c.rejected).length;
    if (rejected === 0) return null;
    return {
      id: this.generateId('mfad'),
      timestamp: now,
      attackType: 'mfa_fatigue',
      severity: 'high',
      userId: recent[recent.length - 1].userId,
      sourceIp: recent[recent.length - 1].sourceIp,
      method: recent[recent.length - 1].method,
      title: 'MFA 疲劳攻击',
      description: `用户 ${recent[0].userId} 在 10 分钟内收到 ${recent.length} 次 MFA 提示 (${rejected} 次被拒)`,
      evidence: [`prompts=${recent.length}`, `rejected=${rejected}`, `window=10min`],
      challenges: recent.map((c) => c.id),
      attemptCount: recent.length,
      timeWindowMs: window,
      confidence: Math.min(0.95, 0.5 + recent.length * 0.08),
      recommendation: 'lock_account',
      blocked: false,
      resolvedAt: null,
      notes: '',
    };
  }

  private detectMfaBypass(challenges: MfaChallenge[]): MfaAttackDetection | null {
    const now = Date.now();
    const window = 5 * 60 * 1000;
    const recent = challenges.filter((c) => now - c.timestamp <= window);
    const ipSet = new Set(recent.map((c) => c.sourceIp));
    if (ipSet.size < 2) return null;
    const verified = recent.filter((c) => c.status === 'verified');
    if (verified.length === 0) return null;
    return {
      id: this.generateId('mfad'),
      timestamp: now,
      attackType: 'mfa_bypass',
      severity: 'critical',
      userId: recent[recent.length - 1].userId,
      sourceIp: recent[recent.length - 1].sourceIp,
      method: recent[recent.length - 1].method,
      title: 'MFA 绕过尝试',
      description: `用户 ${recent[0].userId} 的 MFA 从 ${ipSet.size} 个不同 IP 完成 (${Array.from(ipSet).join(', ')})`,
      evidence: [`ips=${ipSet.size}`, `verifiedCount=${verified.length}`],
      challenges: recent.map((c) => c.id),
      attemptCount: recent.length,
      timeWindowMs: window,
      confidence: 0.9,
      recommendation: 'lock_account',
      blocked: false,
      resolvedAt: null,
      notes: '',
    };
  }

  private detectPromptBombing(challenges: MfaChallenge[]): MfaAttackDetection | null {
    const now = Date.now();
    const window = 5 * 60 * 1000;
    const recent = challenges.filter((c) => c.method === 'push' && now - c.timestamp <= window);
    if (recent.length < 10) return null;
    return {
      id: this.generateId('mfad'),
      timestamp: now,
      attackType: 'prompt_bombing',
      severity: 'high',
      userId: recent[0].userId,
      sourceIp: recent[0].sourceIp,
      method: 'push',
      title: 'MFA 推送轰炸',
      description: `用户 ${recent[0].userId} 在 5 分钟内收到 ${recent.length} 次推送通知`,
      evidence: [`pushCount=${recent.length}`, `window=5min`],
      challenges: recent.map((c) => c.id),
      attemptCount: recent.length,
      timeWindowMs: window,
      confidence: 0.9,
      recommendation: 'force_reenroll',
      blocked: false,
      resolvedAt: null,
      notes: '',
    };
  }

  private detectRealTimePhishing(challenges: MfaChallenge[]): MfaAttackDetection | null {
    const now = Date.now();
    const window = 60 * 60 * 1000;
    const recent = challenges.filter((c) => c.responseTimeMs !== null && c.responseTimeMs < 3000 && now - c.timestamp <= window);
    if (recent.length === 0) return null;
    return {
      id: this.generateId('mfad'),
      timestamp: now,
      attackType: 'realtime_phishing',
      severity: 'high',
      userId: recent[0].userId,
      sourceIp: recent[0].sourceIp,
      method: recent[0].method,
      title: '实时钓鱼代理',
      description: `用户 ${recent[0].userId} MFA 响应时间异常快 (<3s,可能为代理机器人)`,
      evidence: [`responseTimes=${recent.map((c) => c.responseTimeMs).join(',')}`],
      challenges: recent.map((c) => c.id),
      attemptCount: recent.length,
      timeWindowMs: window,
      confidence: 0.8,
      recommendation: 'force_reenroll',
      blocked: false,
      resolvedAt: null,
      notes: '',
    };
  }

  private detectAuthenticatorCompromise(challenges: MfaChallenge[]): MfaAttackDetection | null {
    const now = Date.now();
    const window = 60 * 60 * 1000;
    const recent = challenges.filter((c) => now - c.timestamp <= window);
    if (recent.length < 2) return null;
    const devices = new Set(recent.map((c) => c.deviceFingerprint).filter(Boolean));
    const countries = new Set(recent.map((c) => c.country).filter(Boolean));
    if (devices.size > 1 && countries.size > 1) {
      return {
        id: this.generateId('mfad'),
        timestamp: now,
        attackType: 'authenticator_phishing',
        severity: 'high',
        userId: recent[0].userId,
        sourceIp: recent[recent.length - 1].sourceIp,
        method: recent[0].method,
        title: '身份验证器可能被泄露',
        description: `用户 ${recent[0].userId} 在 1 小时内从 ${devices.size} 设备 / ${countries.size} 国家使用 MFA`,
        evidence: [`devices=${devices.size}`, `countries=${Array.from(countries).join(',')}`],
        challenges: recent.map((c) => c.id),
        attemptCount: recent.length,
        timeWindowMs: window,
        confidence: 0.85,
        recommendation: 'force_reenroll',
        blocked: false,
        resolvedAt: null,
        notes: '',
      };
    }
    return null;
  }

  private detectSessionHijackAfterMfa(challenges: MfaChallenge[]): MfaAttackDetection | null {
    const now = Date.now();
    const window = 30 * 60 * 1000;
    const recent = challenges.filter((c) => c.status === 'verified' && now - c.timestamp <= window);
    if (recent.length < 2) return null;
    const ipSet = new Set(recent.map((c) => c.sourceIp));
    if (ipSet.size < 2) return null;
    return {
      id: this.generateId('mfad'),
      timestamp: now,
      attackType: 'session_hijack_after_mfa',
      severity: 'critical',
      userId: recent[0].userId,
      sourceIp: recent[recent.length - 1].sourceIp,
      method: recent[0].method,
      title: 'MFA 后会话劫持',
      description: `用户 ${recent[0].userId} 在 MFA 验证后从 ${ipSet.size} 个不同 IP 活动`,
      evidence: [`ips=${Array.from(ipSet).join(',')}`, `verifiedCount=${recent.length}`],
      challenges: recent.map((c) => c.id),
      attemptCount: recent.length,
      timeWindowMs: window,
      confidence: 0.95,
      recommendation: 'block',
      blocked: false,
      resolvedAt: null,
      notes: '',
    };
  }

  private detectionExists(newDet: MfaAttackDetection, existing: MfaAttackDetection[]): boolean {
    return existing.some((e) => e.attackType === newDet.attackType && e.userId === newDet.userId && Date.now() - e.timestamp < 5 * 60 * 1000);
  }

  private async loadChallenges(): Promise<MfaChallenge[]> {
    return (await this.store.get<MfaChallenge[]>(STORE_KEYS.challenges)) || [];
  }

  private async loadDetections(): Promise<MfaAttackDetection[]> {
    return (await this.store.get<MfaAttackDetection[]>(STORE_KEYS.detections)) || [];
  }

  private async loadSimSwaps(): Promise<SimSwapIndicator[]> {
    return (await this.store.get<SimSwapIndicator[]>(STORE_KEYS.simSwaps)) || [];
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`;
  }
}
