import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type LateralTechnique = 'pass_the_hash' | 'pass_the_ticket' | 'kerberoasting' | 'as_rep_roasting' | 'overpass_the_hash' | 'golden_ticket' | 'silver_ticket' | 'dcshadow' | 'dcsync' | 'lsass_dump' | 'ntdsutil_dump' | 'mimikatz' | 'bloodhound' | 'account_hopping' | 'privilege_escalation_chain' | 'token_impersonation' | 'service_account_abuse' | 'admin_sd_holder' | 'skeleton_key' | 'unknown';

export interface AuthEvent {
  id: string;
  timestamp: number;
  userId: string;
  targetUserId: string | null;
  eventType: 'logon' | 'logoff' | 'auth_attempt' | 'kerberos_request' | 'ntlm_auth' | 'privilege_use' | 'resource_access' | 'service_ticket_request' | 'tgt_request';
  sourceHost: string;
  sourceIp: string;
  targetHost: string | null;
  targetService: string | null;
  authMethod: 'kerberos' | 'ntlm' | 'sso' | 'oauth' | 'certificate' | 'password';
  authPackage: string | null;
  ticketType: 'tgt' | 'service_ticket' | 'tgs' | 'as_rep' | 'referral_ticket' | null;
  ticketEncryption: string | null;
  privileges: string[];
  sourceUserAgent: string | null;
  logonType: 'interactive' | 'network' | 'batch' | 'service' | 'remote' | 'rdesktop' | 'unc' | 'cached' | null;
  success: boolean;
  failureReason: string | null;
  applicationId: string;
  metadata: Record<string, unknown>;
}

export interface LateralMovementDetection {
  id: string;
  timestamp: number;
  technique: LateralTechnique;
  severity: Severity;
  title: string;
  description: string;
  evidence: string[];
  userId: string;
  targetUserId: string | null;
  sourceHost: string;
  targetHosts: string[];
  durationMs: number;
  techniques: LateralTechnique[];
  mitreTechnique: string | null;
  mitreTactic: string | null;
  confidence: number;
  recommendedAction: 'isolate_host' | 'disable_account' | 'force_password_reset' | 'revoke_tickets' | 'alert_soc' | 'block' | 'investigate' | 'log';
  isolated: boolean;
  resolvedAt: number | null;
  notes: string;
}

export interface AttackPath {
  id: string;
  startUserId: string;
  endUserId: string;
  hops: Array<{ fromUser: string; toUser: string; via: string; host: string; timestamp: number; technique: LateralTechnique }>;
  path: string[];
  durationMs: number;
  privilegeGained: string[];
  techniques: LateralTechnique[];
  severity: Severity;
  discoveredAt: number;
  blocked: boolean;
  notes: string;
}

export interface LateralStats {
  totalEvents: number;
  totalDetections: number;
  byTechnique: Record<LateralTechnique, number>;
  bySeverity: Record<Severity, number>;
  attackPaths: number;
  topUsers: Array<{ userId: string; detections: number; paths: number }>;
  topTargets: Array<{ target: string; attempts: number; compromised: boolean }>;
  isolatedHosts: number;
  credentialsReused: number;
}

const STORE_KEYS = {
  events: 'itdr/auth-events.json',
  detections: 'itdr/lateral-detections.json',
  paths: 'itdr/attack-paths.json',
};

const HISTORY_LIMIT = 50000;

function emptyTechniqueMap(): Record<LateralTechnique, number> {
  return {
    pass_the_hash: 0, pass_the_ticket: 0, kerberoasting: 0, as_rep_roasting: 0, overpass_the_hash: 0,
    golden_ticket: 0, silver_ticket: 0, dcshadow: 0, dcsync: 0, lsass_dump: 0, ntdsutil_dump: 0,
    mimikatz: 0, bloodhound: 0, account_hopping: 0, privilege_escalation_chain: 0,
    token_impersonation: 0, service_account_abuse: 0, admin_sd_holder: 0, skeleton_key: 0, unknown: 0,
  };
}
function emptySeverityMap(): Record<Severity, number> {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

export class LateralMovementDetector {
  constructor(private store: JsonStore) {}

  async recordEvent(eventInput: Omit<AuthEvent, 'id'> & { id?: string }): Promise<{ event: AuthEvent; detections: LateralMovementDetection[] }> {
    const event: AuthEvent = { ...eventInput, id: eventInput.id || this.generateId('ev') };
    const events = await this.loadEvents();
    events.push(event);
    if (events.length > HISTORY_LIMIT) events.splice(0, events.length - HISTORY_LIMIT);
    await this.store.set(STORE_KEYS.events, events);

    const recent = events.filter((e) => e.userId === event.userId);
    const detections: LateralMovementDetection[] = [];
    for (const detector of [this.detectPassTheHash, this.detectKerberoasting, this.detectAsRepRoasting, this.detectOverpassTheHash, this.detectGoldenTicket, this.detectAccountHopping, this.detectPrivilegeEscalationChain, this.detectTokenImpersonation]) {
      const d = detector.call(this, recent);
      if (d && !(await this.detectionExists(d))) {
        d.id = this.generateId('det');
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
    return { event, detections };
  }

  async recordBatch(eventInputs: Array<Omit<AuthEvent, 'id'> & { id?: string }>): Promise<{ events: AuthEvent[]; detections: LateralMovementDetection[] }> {
    const resultEvents: AuthEvent[] = [];
    const resultDetections: LateralMovementDetection[] = [];
    for (const e of eventInputs) {
      const r = await this.recordEvent(e);
      resultEvents.push(r.event);
      resultDetections.push(...r.detections);
    }
    return { events: resultEvents, detections: resultDetections };
  }

  async getEvent(eventId: string): Promise<AuthEvent | null> {
    const events = await this.loadEvents();
    return events.find((e) => e.id === eventId) || null;
  }

  async listEvents(filters?: { userId?: string; eventType?: string; sourceHost?: string; targetHost?: string; since?: number; limit?: number }): Promise<AuthEvent[]> {
    let events = await this.loadEvents();
    if (filters?.userId) events = events.filter((e) => e.userId === filters.userId);
    if (filters?.eventType) events = events.filter((e) => e.eventType === filters.eventType);
    if (filters?.sourceHost) events = events.filter((e) => e.sourceHost === filters.sourceHost);
    if (filters?.targetHost) events = events.filter((e) => e.targetHost === filters.targetHost);
    if (filters?.since !== undefined) events = events.filter((e) => e.timestamp >= filters.since!);
    events.sort((a, b) => b.timestamp - a.timestamp);
    if (filters?.limit !== undefined) events = events.slice(0, filters.limit);
    return events;
  }

  async getDetections(filters?: { technique?: LateralTechnique; severity?: Severity; userId?: string; since?: number; limit?: number }): Promise<LateralMovementDetection[]> {
    let detections = await this.loadDetections();
    if (filters?.technique) detections = detections.filter((d) => d.technique === filters.technique);
    if (filters?.severity) detections = detections.filter((d) => d.severity === filters.severity);
    if (filters?.userId) detections = detections.filter((d) => d.userId === filters.userId);
    if (filters?.since !== undefined) detections = detections.filter((d) => d.timestamp >= filters.since!);
    detections.sort((a, b) => b.timestamp - a.timestamp);
    if (filters?.limit !== undefined) detections = detections.slice(0, filters.limit);
    return detections;
  }

  async updateDetection(detectionId: string, updates: Partial<LateralMovementDetection>): Promise<boolean> {
    const detections = await this.loadDetections();
    const idx = detections.findIndex((d) => d.id === detectionId);
    if (idx === -1) return false;
    detections[idx] = { ...detections[idx], ...updates };
    await this.store.set(STORE_KEYS.detections, detections);
    return true;
  }

  async getAttackPath(pathId: string): Promise<AttackPath | null> {
    const paths = await this.loadPaths();
    return paths.find((p) => p.id === pathId) || null;
  }

  async listAttackPaths(filters?: { userId?: string; since?: number; limit?: number }): Promise<AttackPath[]> {
    let paths = await this.loadPaths();
    if (filters?.userId) paths = paths.filter((p) => p.startUserId === filters.userId || p.endUserId === filters.userId);
    if (filters?.since !== undefined) paths = paths.filter((p) => p.discoveredAt >= filters.since!);
    paths.sort((a, b) => b.discoveredAt - a.discoveredAt);
    if (filters?.limit !== undefined) paths = paths.slice(0, filters.limit);
    return paths;
  }

  async recordAttackPath(path: Omit<AttackPath, 'id' | 'discoveredAt'>): Promise<AttackPath> {
    const newPath: AttackPath = { ...path, id: this.generateId('path'), discoveredAt: Date.now() };
    const paths = await this.loadPaths();
    paths.push(newPath);
    if (paths.length > 5000) paths.splice(0, paths.length - 5000);
    await this.store.set(STORE_KEYS.paths, paths);
    return newPath;
  }

  async getStats(since?: number): Promise<LateralStats> {
    let events = await this.loadEvents();
    if (since !== undefined) events = events.filter((e) => e.timestamp >= since);
    const detections = await this.loadDetections();
    const paths = await this.loadPaths();
    const byTechnique = emptyTechniqueMap();
    const bySeverity = emptySeverityMap();
    for (const d of detections) {
      byTechnique[d.technique]++;
      bySeverity[d.severity]++;
    }
    const userMap = new Map<string, { userId: string; detections: number; paths: number }>();
    for (const d of detections) {
      const ex = userMap.get(d.userId) || { userId: d.userId, detections: 0, paths: 0 };
      ex.detections++;
      userMap.set(d.userId, ex);
    }
    for (const p of paths) {
      const ex = userMap.get(p.endUserId) || { userId: p.endUserId, detections: 0, paths: 0 };
      ex.paths++;
      userMap.set(p.endUserId, ex);
    }
    const targetMap = new Map<string, { target: string; attempts: number; compromised: boolean }>();
    for (const e of events) {
      if (!e.targetHost && !e.targetUserId) continue;
      const t = e.targetHost || e.targetUserId || '';
      const ex = targetMap.get(t) || { target: t, attempts: 0, compromised: false };
      ex.attempts++;
      targetMap.set(t, ex);
    }
    return {
      totalEvents: events.length,
      totalDetections: detections.length,
      byTechnique,
      bySeverity,
      attackPaths: paths.length,
      topUsers: Array.from(userMap.values()).sort((a, b) => b.detections - a.detections).slice(0, 10),
      topTargets: Array.from(targetMap.values()).sort((a, b) => b.attempts - a.attempts).slice(0, 10),
      isolatedHosts: detections.filter((d) => d.isolated).length,
      credentialsReused: detections.filter((d) => d.technique === 'pass_the_hash' || d.technique === 'pass_the_ticket').length,
    };
  }

  private detectPassTheHash(events: AuthEvent[]): LateralMovementDetection | null {
    const now = Date.now();
    const window = 10 * 60 * 1000;
    const ntlmAuths = events.filter((e) => e.authMethod === 'ntlm' && now - e.timestamp <= window && e.success);
    if (ntlmAuths.length < 3) return null;
    const hosts = new Set(ntlmAuths.map((e) => e.sourceHost));
    if (hosts.size < 3) return null;
    return {
      id: this.generateId('det'),
      timestamp: now,
      technique: 'pass_the_hash',
      severity: 'critical',
      title: 'Pass-the-Hash 攻击',
      description: `用户 ${events[0].userId} 在 10 分钟内用 NTLM 认证到 ${hosts.size} 个不同主机`,
      evidence: [`authCount=${ntlmAuths.length}`, `hosts=${Array.from(hosts).join(',')}`],
      userId: events[0].userId,
      targetUserId: null,
      sourceHost: events[0].sourceHost,
      targetHosts: Array.from(hosts),
      durationMs: window,
      techniques: ['pass_the_hash'],
      mitreTechnique: 'T1550.003',
      mitreTactic: 'Lateral Movement',
      confidence: 0.9,
      recommendedAction: 'isolate_host',
      isolated: false,
      resolvedAt: null,
      notes: '',
    };
  }

  private detectKerberoasting(events: AuthEvent[]): LateralMovementDetection | null {
    const now = Date.now();
    const window = 5 * 60 * 1000;
    const ticketRequests = events.filter((e) => (e.eventType === 'service_ticket_request' || e.ticketType === 'service_ticket') && now - e.timestamp <= window);
    const highPrivilegeTickets = ticketRequests.filter((e) => e.targetUserId && (e.targetUserId.toLowerCase().includes('admin') || e.targetUserId.toLowerCase().includes('krbtgt') || e.targetUserId.toLowerCase().includes('svc')));
    if (highPrivilegeTickets.length < 2) return null;
    return {
      id: this.generateId('det'),
      timestamp: now,
      technique: 'kerberoasting',
      severity: 'critical',
      title: 'Kerberoasting 攻击',
      description: `用户 ${events[0].userId} 请求 ${highPrivilegeTickets.length} 个高权限服务票据 (可能是 Kerberoasting)`,
      evidence: highPrivilegeTickets.map((e) => `${e.targetUserId}@${e.targetService || 'unknown'}`),
      userId: events[0].userId,
      targetUserId: null,
      sourceHost: events[0].sourceHost,
      targetHosts: highPrivilegeTickets.map((e) => e.targetHost || '').filter(Boolean),
      durationMs: window,
      techniques: ['kerberoasting'],
      mitreTechnique: 'T1558.003',
      mitreTactic: 'Credential Access',
      confidence: 0.85,
      recommendedAction: 'force_password_reset',
      isolated: false,
      resolvedAt: null,
      notes: '',
    };
  }

  private detectAsRepRoasting(events: AuthEvent[]): LateralMovementDetection | null {
    const now = Date.now();
    const window = 60 * 1000;
    const asRepRequests = events.filter((e) => e.ticketType === 'as_rep' && now - e.timestamp <= window);
    if (asRepRequests.length < 5) return null;
    return {
      id: this.generateId('det'),
      timestamp: now,
      technique: 'as_rep_roasting',
      severity: 'high',
      title: 'AS-REP Roasting 攻击',
      description: `用户 ${events[0].userId} 在 1 分钟内发起 ${asRepRequests.length} 次 AS-REP 请求`,
      evidence: [`asRepCount=${asRepRequests.length}`, `window=1min`],
      userId: events[0].userId,
      targetUserId: null,
      sourceHost: events[0].sourceHost,
      targetHosts: [],
      durationMs: window,
      techniques: ['as_rep_roasting'],
      mitreTechnique: 'T1558.004',
      mitreTactic: 'Credential Access',
      confidence: 0.8,
      recommendedAction: 'alert_soc',
      isolated: false,
      resolvedAt: null,
      notes: '',
    };
  }

  private detectOverpassTheHash(events: AuthEvent[]): LateralMovementDetection | null {
    const now = Date.now();
    const ntlmAuths = events.filter((e) => e.authMethod === 'ntlm' && now - e.timestamp <= 10000);
    const tgtRequests = events.filter((e) => e.ticketType === 'tgt' && now - e.timestamp <= 10000);
    if (ntlmAuths.length === 0 || tgtRequests.length === 0) return null;
    return {
      id: this.generateId('det'),
      timestamp: now,
      technique: 'overpass_the_hash',
      severity: 'critical',
      title: 'Overpass-the-Hash 攻击',
      description: `用户 ${events[0].userId} 在 10s 内先 NTLM 认证后请求 TGT (可能 overpass-the-hash)`,
      evidence: [`ntlmCount=${ntlmAuths.length}`, `tgtCount=${tgtRequests.length}`],
      userId: events[0].userId,
      targetUserId: null,
      sourceHost: events[0].sourceHost,
      targetHosts: [],
      durationMs: 10000,
      techniques: ['overpass_the_hash'],
      mitreTechnique: 'T1550.003',
      mitreTactic: 'Lateral Movement',
      confidence: 0.9,
      recommendedAction: 'revoke_tickets',
      isolated: false,
      resolvedAt: null,
      notes: '',
    };
  }

  private detectGoldenTicket(events: AuthEvent[]): LateralMovementDetection | null {
    const now = Date.now();
    const window = 60 * 60 * 1000;
    const tgtRequests = events.filter((e) => e.ticketType === 'tgt' && now - e.timestamp <= window);
    const suspicious = tgtRequests.filter((e) => e.ticketEncryption === 'RC4' || (e.metadata?.lifetime_hours && (e.metadata.lifetime_hours as number) > 10));
    if (suspicious.length === 0) return null;
    return {
      id: this.generateId('det'),
      timestamp: now,
      technique: 'golden_ticket',
      severity: 'critical',
      title: 'Golden Ticket 攻击',
      description: `检测到 ${suspicious.length} 个可疑 TGT (RC4 加密或异常生命周期)`,
      evidence: [`suspiciousTgtCount=${suspicious.length}`, `encryption=RC4`],
      userId: events[0].userId,
      targetUserId: null,
      sourceHost: events[0].sourceHost,
      targetHosts: [],
      durationMs: window,
      techniques: ['golden_ticket'],
      mitreTechnique: 'T1558.001',
      mitreTactic: 'Credential Access',
      confidence: 0.85,
      recommendedAction: 'revoke_tickets',
      isolated: false,
      resolvedAt: null,
      notes: '',
    };
  }

  private detectAccountHopping(events: AuthEvent[]): LateralMovementDetection | null {
    const now = Date.now();
    const window = 5 * 60 * 1000;
    const recent = events.filter((e) => e.eventType === 'logon' && e.success && now - e.timestamp <= window);
    const userIds = new Set(recent.map((e) => e.userId));
    if (userIds.size < 5) return null;
    return {
      id: this.generateId('det'),
      timestamp: now,
      technique: 'account_hopping',
      severity: 'high',
      title: '账户跳跃攻击',
      description: `${userIds.size} 个账户在 5 分钟内从同一主机 ${events[0].sourceHost} 登录`,
      evidence: [`accountCount=${userIds.size}`, `host=${events[0].sourceHost}`],
      userId: events[0].userId,
      targetUserId: null,
      sourceHost: events[0].sourceHost,
      targetHosts: [events[0].sourceHost],
      durationMs: window,
      techniques: ['account_hopping'],
      mitreTechnique: 'T1078',
      mitreTactic: 'Lateral Movement',
      confidence: 0.85,
      recommendedAction: 'isolate_host',
      isolated: false,
      resolvedAt: null,
      notes: '',
    };
  }

  private detectPrivilegeEscalationChain(events: AuthEvent[]): LateralMovementDetection | null {
    const now = Date.now();
    const window = 60 * 60 * 1000;
    const recent = events.filter((e) => e.privileges.length > 0 && now - e.timestamp <= window);
    if (recent.length < 2) return null;
    const highPriv = recent.filter((e) => e.privileges.some((p) => p.includes('SeDebug') || p.includes('SeBackup') || p.includes('SeTakeOwnership') || p.includes('admin')));
    if (highPriv.length === 0) return null;
    return {
      id: this.generateId('det'),
      timestamp: now,
      technique: 'privilege_escalation_chain',
      severity: 'high',
      title: '权限提升链',
      description: `用户 ${events[0].userId} 1h 内获得 ${highPriv.length} 次高权限使用`,
      evidence: highPriv.flatMap((e) => e.privileges).slice(0, 5),
      userId: events[0].userId,
      targetUserId: null,
      sourceHost: events[0].sourceHost,
      targetHosts: [],
      durationMs: window,
      techniques: ['privilege_escalation_chain'],
      mitreTechnique: 'T1068',
      mitreTactic: 'Privilege Escalation',
      confidence: 0.75,
      recommendedAction: 'alert_soc',
      isolated: false,
      resolvedAt: null,
      notes: '',
    };
  }

  private detectTokenImpersonation(events: AuthEvent[]): LateralMovementDetection | null {
    const now = Date.now();
    const window = 30 * 60 * 1000;
    const recent = events.filter((e) => now - e.timestamp <= window);
    const sessionIds = new Set(recent.filter((e) => e.metadata?.session_id).map((e) => e.metadata.session_id as string));
    const hostSet = new Set(recent.map((e) => e.sourceHost));
    if (sessionIds.size === 0 || hostSet.size < 2) return null;
    const sharedSessions: Array<{ sessionId: string; hosts: Set<string> }> = [];
    for (const sid of sessionIds) {
      const hosts = new Set(recent.filter((e) => e.metadata?.session_id === sid).map((e) => e.sourceHost));
      if (hosts.size > 1) sharedSessions.push({ sessionId: sid, hosts });
    }
    if (sharedSessions.length === 0) return null;
    return {
      id: this.generateId('det'),
      timestamp: now,
      technique: 'token_impersonation',
      severity: 'critical',
      title: 'Token 模拟攻击',
      description: `检测到 ${sharedSessions.length} 个会话 token 在多主机复用`,
      evidence: sharedSessions.map((s) => `${s.sessionId}: ${Array.from(s.hosts).join(',')}`),
      userId: events[0].userId,
      targetUserId: null,
      sourceHost: events[0].sourceHost,
      targetHosts: Array.from(hostSet),
      durationMs: window,
      techniques: ['token_impersonation'],
      mitreTechnique: 'T1134.001',
      mitreTactic: 'Privilege Escalation',
      confidence: 0.9,
      recommendedAction: 'revoke_tickets',
      isolated: false,
      resolvedAt: null,
      notes: '',
    };
  }

  private async detectionExists(newDet: LateralMovementDetection): Promise<boolean> {
    const existing = await this.loadDetections();
    return existing.some((e) => e.technique === newDet.technique && e.userId === newDet.userId && Date.now() - e.timestamp < 5 * 60 * 1000);
  }

  private async loadEvents(): Promise<AuthEvent[]> {
    return (await this.store.get<AuthEvent[]>(STORE_KEYS.events)) || [];
  }

  private async loadDetections(): Promise<LateralMovementDetection[]> {
    return (await this.store.get<LateralMovementDetection[]>(STORE_KEYS.detections)) || [];
  }

  private async loadPaths(): Promise<AttackPath[]> {
    return (await this.store.get<AttackPath[]>(STORE_KEYS.paths)) || [];
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`;
  }
}
