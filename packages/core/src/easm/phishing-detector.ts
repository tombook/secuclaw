import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type PhishingType =
  | 'lookalike_domain'
  | 'typosquatting'
  | 'homograph_attack'
  | 'subdomain_spoofing'
  | 'tld_swap'
  | 'punycode_abuse'
  | 'brand_impersonation'
  | 'credential_harvesting'
  | 'malware_distribution'
  | 'crypto_scam'
  | 'clone_site'
  | 'unknown';

export type PhishingStatus = 'active' | 'inactive' | 'taken_down' | 'monitoring' | 'false_positive';

export type PhishingRisk = 'critical' | 'high' | 'medium' | 'low';

export type BrandProtection = 'high_value' | 'medium_value' | 'low_value';

export interface PhishingSite {
  id: string;
  url: string;
  domain: string;
  type: PhishingType;
  risk: PhishingRisk;
  status: PhishingStatus;
  brandImpersonated: string | null;
  title: string;
  description: string;
  screenshotUrl: string | null;
  firstDetected: number;
  lastSeen: number;
  detectionCount: number;
  confidence: number;
  evidence: string[];
  serverIp: string | null;
  serverLocation: string | null;
  registrar: string | null;
  sslIssuer: string | null;
  asn: number | null;
  hostingProvider: string | null;
  contentHash: string;
  targetBrand: string | null;
  targetDomain: string | null;
  harpoonsUrls: string[];
  indicators: Array<{ type: string; value: string; description: string }>;
  reportedTo: string[];
  reportedAt: number | null;
  takenDownAt: number | null;
  notes: string;
}

export interface BrandWatch {
  id: string;
  brand: string;
  description: string;
  officialDomains: string[];
  keywords: string[];
  protectionLevel: BrandProtection;
  active: boolean;
  createdAt: number;
  lastCheck: number | null;
  totalDetections: number;
  createdBy: string;
}

export interface PhishingStats {
  totalSites: number;
  byType: Record<PhishingType, number>;
  byStatus: Record<PhishingStatus, number>;
  byRisk: Record<PhishingRisk, number>;
  activeSites: number;
  takenDownSites: number;
  byBrand: Record<string, number>;
  avgDetectionToTakeDownHours: number;
}

export interface DetectionFeatures {
  domainLevenshteinTo: Record<string, number>;
  hasIpAddress: boolean;
  hasPunycode: boolean;
  hasExcessiveSubdomains: boolean;
  suspiciousTld: boolean;
  brandInSubdomain: boolean;
  tlsValid: boolean;
  tlsAge: number;
  httpStatus: number;
  pageSize: number;
  hasLoginForm: boolean;
  hasFaviconMismatch: boolean;
}

const SITES_KEY = 'easm/phishing-sites.json';
const WATCHES_KEY = 'easm/brand-watches.json';

const SUSPICIOUS_TLDS = [
  'zip',
  'mov',
  'top',
  'click',
  'tk',
  'ml',
  'ga',
  'cf',
  'gq',
  'xyz',
  'country',
  'work',
  'rest',
  'cam',
  'quest',
];

const ALL_PHISHING_TYPES: PhishingType[] = [
  'lookalike_domain',
  'typosquatting',
  'homograph_attack',
  'subdomain_spoofing',
  'tld_swap',
  'punycode_abuse',
  'brand_impersonation',
  'credential_harvesting',
  'malware_distribution',
  'crypto_scam',
  'clone_site',
  'unknown',
];

const ALL_STATUSES: PhishingStatus[] = [
  'active',
  'inactive',
  'taken_down',
  'monitoring',
  'false_positive',
];

const ALL_RISKS: PhishingRisk[] = ['critical', 'high', 'medium', 'low'];

const DEFAULT_TLDS = ['com', 'net', 'org', 'io', 'co', 'app', 'dev', 'xyz', 'click', 'top', 'site', 'online'];

function emptyByType(): Record<PhishingType, number> {
  const obj = {} as Record<PhishingType, number>;
  for (const t of ALL_PHISHING_TYPES) obj[t] = 0;
  return obj;
}

function emptyByStatus(): Record<PhishingStatus, number> {
  const obj = {} as Record<PhishingStatus, number>;
  for (const s of ALL_STATUSES) obj[s] = 0;
  return obj;
}

function emptyByRisk(): Record<PhishingRisk, number> {
  const obj = {} as Record<PhishingRisk, number>;
  for (const r of ALL_RISKS) obj[r] = 0;
  return obj;
}

export class PhishingDetectorService {
  constructor(private store: JsonStore) {}

  async createBrandWatch(
    watch: Omit<BrandWatch, 'id' | 'createdAt' | 'lastCheck' | 'totalDetections'>
  ): Promise<BrandWatch> {
    const now = Date.now();
    const newWatch: BrandWatch = {
      ...watch,
      id: this.generateId(),
      createdAt: now,
      lastCheck: null,
      totalDetections: 0,
    };
    const all = await this.loadWatches();
    all.push(newWatch);
    await this.saveWatches(all);
    return newWatch;
  }

  async getBrandWatch(watchId: string): Promise<BrandWatch | null> {
    const all = await this.loadWatches();
    return all.find((w) => w.id === watchId) ?? null;
  }

  async listBrandWatches(filters?: { active?: boolean; brand?: string }): Promise<BrandWatch[]> {
    const all = await this.loadWatches();
    if (!filters) return all;
    return all.filter((w) => {
      if (filters.active !== undefined && w.active !== filters.active) return false;
      if (filters.brand && w.brand.toLowerCase() !== filters.brand.toLowerCase()) return false;
      return true;
    });
  }

  async updateBrandWatch(watchId: string, updates: Partial<BrandWatch>): Promise<BrandWatch | null> {
    const all = await this.loadWatches();
    const idx = all.findIndex((w) => w.id === watchId);
    if (idx < 0) return null;
    const merged: BrandWatch = {
      ...all[idx],
      ...updates,
      id: all[idx].id,
      createdAt: all[idx].createdAt,
    };
    all[idx] = merged;
    await this.saveWatches(all);
    return merged;
  }

  async deleteBrandWatch(watchId: string): Promise<boolean> {
    const all = await this.loadWatches();
    const next = all.filter((w) => w.id !== watchId);
    if (next.length === all.length) return false;
    await this.saveWatches(next);
    return true;
  }

  async checkUrl(url: string, options?: { brandWatchIds?: string[] }): Promise<PhishingSite | null> {
    let domain = '';
    try {
      const u = new URL(url);
      domain = u.hostname;
    } catch {
      domain = url.replace(/^https?:\/\//, '').split('/')[0];
    }
    return this.checkDomain(domain, options);
  }

  async checkDomain(domain: string, options?: { brandWatchIds?: string[] }): Promise<PhishingSite | null> {
    const normalized = domain.trim().toLowerCase();
    if (!normalized) return null;

    const watches = options?.brandWatchIds
      ? (await this.loadWatches()).filter((w) => options.brandWatchIds!.includes(w.id))
      : await this.loadWatches();

    let matched: BrandWatch | null = null;
    for (const w of watches) {
      if (this.domainMatchesWatch(normalized, w)) {
        matched = w;
        break;
      }
    }
    if (!matched) return null;

    const features = this.extractFeatures(normalized, [matched]);
    const classification = this.classifyRisk(features, matched);
    if (classification.confidence < 0.3) return null;

    const now = Date.now();
    const existingSites = await this.loadSites();
    const existing = existingSites.find(
      (s) => s.domain === normalized && s.targetBrand === matched!.brand
    );
    if (existing) {
      const updated: PhishingSite = {
        ...existing,
        lastSeen: now,
        detectionCount: existing.detectionCount + 1,
        type: classification.type,
        risk: classification.risk,
        confidence: Math.max(existing.confidence, classification.confidence),
        evidence: Array.from(new Set([...existing.evidence, ...classification.reasons])),
        status: existing.status === 'taken_down' ? 'monitoring' : existing.status,
      };
      const idx = existingSites.findIndex((s) => s.id === existing.id);
      existingSites[idx] = updated;
      await this.saveSites(existingSites);
      await this.incrementWatchDetections(matched.id);
      return updated;
    }

    const newSite: PhishingSite = {
      id: this.generateId(),
      url: `http://${normalized}`,
      domain: normalized,
      type: classification.type,
      risk: classification.risk,
      status: 'active',
      brandImpersonated: matched.brand,
      title: '',
      description: classification.reasons.join('; '),
      screenshotUrl: null,
      firstDetected: now,
      lastSeen: now,
      detectionCount: 1,
      confidence: classification.confidence,
      evidence: classification.reasons,
      serverIp: null,
      serverLocation: null,
      registrar: null,
      sslIssuer: null,
      asn: null,
      hostingProvider: null,
      contentHash: '',
      targetBrand: matched.brand,
      targetDomain: matched.officialDomains[0] ?? null,
      harpoonsUrls: [],
      indicators: classification.reasons.map((r) => ({
        type: 'heuristic',
        value: normalized,
        description: r,
      })),
      reportedTo: [],
      reportedAt: null,
      takenDownAt: null,
      notes: '',
    };
    existingSites.push(newSite);
    await this.saveSites(existingSites);
    await this.incrementWatchDetections(matched.id);
    return newSite;
  }

  async recordPhishingSite(
    site: Omit<PhishingSite, 'id' | 'firstDetected' | 'lastSeen' | 'detectionCount'>
  ): Promise<PhishingSite> {
    const now = Date.now();
    const newSite: PhishingSite = {
      ...site,
      id: this.generateId(),
      firstDetected: now,
      lastSeen: now,
      detectionCount: 1,
    };
    const all = await this.loadSites();
    all.push(newSite);
    await this.saveSites(all);
    if (newSite.targetBrand) {
      const watches = await this.loadWatches();
      const watch = watches.find((w) => w.brand === newSite.targetBrand);
      if (watch) await this.incrementWatchDetections(watch.id);
    }
    return newSite;
  }

  async getPhishingSite(siteId: string): Promise<PhishingSite | null> {
    const all = await this.loadSites();
    return all.find((s) => s.id === siteId) ?? null;
  }

  async listPhishingSites(
    filters?: {
      brandWatchId?: string;
      type?: PhishingType;
      status?: PhishingStatus;
      risk?: PhishingRisk;
      brand?: string;
      since?: number;
      limit?: number;
    }
  ): Promise<PhishingSite[]> {
    const all = await this.loadSites();
    let result = all;
    if (filters) {
      const watchBrandCache = new Map<string, string | null>();
      const watches = await this.loadWatches();
      const watchIdToBrand = new Map(watches.map((w) => [w.id, w.brand]));

      if (filters.brandWatchId) {
        const brand = watchIdToBrand.get(filters.brandWatchId) ?? null;
        watchBrandCache.set(filters.brandWatchId, brand);
        result = result.filter((s) => s.targetBrand === brand);
      }
      if (filters.type) {
        result = result.filter((s) => s.type === filters.type);
      }
      if (filters.status) {
        result = result.filter((s) => s.status === filters.status);
      }
      if (filters.risk) {
        result = result.filter((s) => s.risk === filters.risk);
      }
      if (filters.brand) {
        const b = filters.brand.toLowerCase();
        result = result.filter(
          (s) =>
            (s.brandImpersonated && s.brandImpersonated.toLowerCase() === b) ||
            (s.targetBrand && s.targetBrand.toLowerCase() === b)
        );
      }
      if (filters.since !== undefined) {
        result = result.filter((s) => s.firstDetected >= filters.since!);
      }
      result = result.sort((a, b) => b.firstDetected - a.firstDetected);
      if (filters.limit !== undefined && filters.limit > 0) {
        result = result.slice(0, filters.limit);
      }
    }
    return result;
  }

  async updatePhishingStatus(siteId: string, status: PhishingStatus): Promise<boolean> {
    const all = await this.loadSites();
    const idx = all.findIndex((s) => s.id === siteId);
    if (idx < 0) return false;
    const now = Date.now();
    const updated: PhishingSite = {
      ...all[idx],
      status,
      lastSeen: now,
    };
    if (status === 'taken_down' && !all[idx].takenDownAt) {
      updated.takenDownAt = now;
    }
    all[idx] = updated;
    await this.saveSites(all);
    return true;
  }

  async markTakenDown(siteId: string): Promise<boolean> {
    return this.updatePhishingStatus(siteId, 'taken_down');
  }

  async reportToExternal(siteId: string, target: string): Promise<boolean> {
    const all = await this.loadSites();
    const idx = all.findIndex((s) => s.id === siteId);
    if (idx < 0) return false;
    const now = Date.now();
    const reported = Array.from(new Set([...(all[idx].reportedTo || []), target]));
    all[idx] = {
      ...all[idx],
      reportedTo: reported,
      reportedAt: now,
      lastSeen: now,
    };
    await this.saveSites(all);
    return true;
  }

  async runBrandWatchScan(watchId: string, candidateDomains: string[]): Promise<PhishingSite[]> {
    const watches = await this.loadWatches();
    const watch = watches.find((w) => w.id === watchId);
    if (!watch) return [];
    const detected: PhishingSite[] = [];
    for (const candidate of candidateDomains) {
      const domain = candidate.trim().toLowerCase();
      if (!domain) continue;
      const site = await this.checkDomain(domain, { brandWatchIds: [watchId] });
      if (site) detected.push(site);
    }
    if (detected.length > 0) {
      await this.updateBrandWatch(watchId, { lastCheck: Date.now() });
    } else {
      await this.updateBrandWatch(watchId, { lastCheck: Date.now() });
    }
    return detected;
  }

  async getStats(): Promise<PhishingStats> {
    const sites = await this.loadSites();
    const byType = emptyByType();
    const byStatus = emptyByStatus();
    const byRisk = emptyByRisk();
    const byBrand: Record<string, number> = {};
    let activeSites = 0;
    let takenDownSites = 0;
    let totalTakeDownHours = 0;
    let takeDownSamples = 0;

    for (const s of sites) {
      byType[s.type] = (byType[s.type] || 0) + 1;
      byStatus[s.status] = (byStatus[s.status] || 0) + 1;
      byRisk[s.risk] = (byRisk[s.risk] || 0) + 1;
      if (s.status === 'active') activeSites += 1;
      if (s.status === 'taken_down') takenDownSites += 1;
      const brand = s.brandImpersonated || s.targetBrand || 'unknown';
      byBrand[brand] = (byBrand[brand] || 0) + 1;
      if (s.takenDownAt && s.firstDetected) {
        const hours = (s.takenDownAt - s.firstDetected) / (1000 * 60 * 60);
        if (hours >= 0) {
          totalTakeDownHours += hours;
          takeDownSamples += 1;
        }
      }
    }

    return {
      totalSites: sites.length,
      byType,
      byStatus,
      byRisk,
      activeSites,
      takenDownSites,
      byBrand,
      avgDetectionToTakeDownHours: takeDownSamples > 0 ? totalTakeDownHours / takeDownSamples : 0,
    };
  }

  async getActiveSites(): Promise<PhishingSite[]> {
    return this.listPhishingSites({ status: 'active' });
  }

  generateLookalikeCandidates(brand: string, tlds: string[] = DEFAULT_TLDS): string[] {
    const cleanBrand = brand.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanBrand) return [];
    const candidates = new Set<string>();
    const tldList = tlds.length > 0 ? tlds : DEFAULT_TLDS;

    for (const tld of tldList) {
      candidates.add(`${cleanBrand}.${tld}`);
      candidates.add(`${cleanBrand}-${tld}.com`);
      candidates.add(`${cleanBrand}${tld}.com`);
    }

    const commonPrefixes = ['login', 'secure', 'account', 'verify', 'update', 'support', 'my'];
    for (const p of commonPrefixes) {
      candidates.add(`${p}-${cleanBrand}.com`);
      candidates.add(`${p}.${cleanBrand}.com`);
    }

    const subHyphen = cleanBrand.replace(/o/g, '0').replace(/i/g, '1').replace(/l/g, '1');
    if (subHyphen !== cleanBrand) {
      for (const tld of tldList) {
        candidates.add(`${subHyphen}.${tld}`);
      }
    }

    if (cleanBrand.length > 2) {
      for (let i = 0; i < cleanBrand.length; i++) {
        for (const ch of 'abcdefghijklmnopqrstuvwxyz0123456789-') {
          if (ch === cleanBrand[i]) continue;
          const typo = cleanBrand.slice(0, i) + ch + cleanBrand.slice(i + 1);
          if (typo.length > 0 && !typo.startsWith('-') && !typo.endsWith('-')) {
            for (const tld of tldList.slice(0, 4)) {
              candidates.add(`${typo}.${tld}`);
            }
          }
        }
      }
    }

    candidates.delete(`${cleanBrand}.com`);
    return Array.from(candidates);
  }

  private domainMatchesWatch(domain: string, watch: BrandWatch): boolean {
    for (const official of watch.officialDomains) {
      const o = official.toLowerCase();
      if (domain === o) return false;
      if (domain.endsWith(`.${o}`)) return false;
    }
    for (const keyword of watch.keywords) {
      const k = keyword.toLowerCase();
      if (domain.includes(k)) return true;
    }
    for (const official of watch.officialDomains) {
      const o = official.toLowerCase();
      const base = o.split('.')[0];
      if (base && domain.split('.')[0].includes(base)) return true;
      const distance = this.levenshteinDistance(domain, o);
      if (distance > 0 && distance <= 2) return true;
    }
    return false;
  }

  private levenshteinDistance(s1: string, s2: string): number {
    const a = s1.toLowerCase();
    const b = s2.toLowerCase();
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const prev = new Array<number>(b.length + 1);
    const curr = new Array<number>(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;

    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        const del = prev[j] + 1;
        const ins = curr[j - 1] + 1;
        const sub = prev[j - 1] + cost;
        let min = del < ins ? del : ins;
        if (sub < min) min = sub;
        curr[j] = min;
      }
      for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
    }
    return prev[b.length];
  }

  private isHomograph(domain: string): boolean {
    for (const ch of domain) {
      if (ch.charCodeAt(0) > 127) return true;
    }
    const hasLatin = /[a-zA-Z]/.test(domain);
    const hasCyrillic = /[\u0400-\u04FF]/.test(domain);
    const hasGreek = /[\u0370-\u03FF]/.test(domain);
    if (hasCyrillic && hasLatin) return true;
    if (hasGreek && hasLatin) return true;
    return false;
  }

  private hasBrandInSubdomain(domain: string, brand: string): boolean {
    const parts = domain.split('.');
    if (parts.length < 3) return false;
    const b = brand.toLowerCase();
    return parts.slice(0, -2).some((p) => p.toLowerCase().includes(b));
  }

  private isSuspiciousTld(tld: string): boolean {
    return SUSPICIOUS_TLDS.includes(tld.toLowerCase());
  }

  private extractFeatures(domain: string, brandWatches: BrandWatch[]): DetectionFeatures {
    const domainLevenshteinTo: Record<string, number> = {};
    const watchList: BrandWatch[] = brandWatches.length > 0 ? brandWatches : [];
    for (const w of watchList) {
      for (const official of w.officialDomains) {
        const baseDomain = official.split('.')[0];
        if (baseDomain) {
          domainLevenshteinTo[official] = this.levenshteinDistance(
            domain.split('.')[0] || domain,
            baseDomain
          );
        }
        domainLevenshteinTo[official] = this.levenshteinDistance(domain, official);
      }
    }
    const labels = domain.split('.');
    const tld = labels[labels.length - 1] || '';
    const hasIpAddress = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(domain);
    const hasPunycode = domain.includes('xn--');
    const hasExcessiveSubdomains = labels.length >= 5;
    const suspiciousTld = this.isSuspiciousTld(tld);
    let brandInSubdomain = false;
    for (const w of watchList) {
      if (this.hasBrandInSubdomain(domain, w.brand)) {
        brandInSubdomain = true;
        break;
      }
      for (const kw of w.keywords) {
        if (labels.slice(0, -2).some((p) => p.toLowerCase().includes(kw.toLowerCase()))) {
          brandInSubdomain = true;
          break;
        }
      }
      if (brandInSubdomain) break;
    }
    return {
      domainLevenshteinTo,
      hasIpAddress,
      hasPunycode,
      hasExcessiveSubdomains,
      suspiciousTld,
      brandInSubdomain,
      tlsValid: false,
      tlsAge: 0,
      httpStatus: 0,
      pageSize: 0,
      hasLoginForm: false,
      hasFaviconMismatch: false,
    };
  }

  private classifyRisk(
    features: DetectionFeatures,
    brandWatch: BrandWatch | null
  ): { type: PhishingType; risk: PhishingRisk; confidence: number; reasons: string[] } {
    const reasons: string[] = [];
    let type: PhishingType = 'unknown';
    let score = 0;

    if (features.hasIpAddress) {
      reasons.push('Domain is a raw IP address');
      type = 'malware_distribution';
      score += 0.5;
    }
    if (features.hasPunycode) {
      reasons.push('Punycode (xn--) detected, possible homograph attack');
      if (type === 'unknown') type = 'punycode_abuse';
      if (this.isHomograph(features.domainLevenshteinTo ? '' : '')) {
        type = 'homograph_attack';
        reasons.push('Non-ASCII characters present');
      }
      score += 0.4;
    }
    if (features.suspiciousTld) {
      reasons.push('Suspicious TLD');
      if (type === 'unknown') type = 'tld_swap';
      score += 0.3;
    }
    if (features.hasExcessiveSubdomains) {
      reasons.push('Excessive subdomain depth');
      if (type === 'unknown') type = 'subdomain_spoofing';
      score += 0.2;
    }
    if (features.brandInSubdomain) {
      reasons.push('Brand keyword found in subdomain');
      if (type === 'unknown') type = 'subdomain_spoofing';
      score += 0.35;
    }

    const distances = Object.values(features.domainLevenshteinTo);
    if (distances.length > 0) {
      const minDist = Math.min(...distances);
      if (minDist > 0 && minDist <= 1) {
        reasons.push(`Domain is ${minDist} edit-distance from an official domain`);
        if (type === 'unknown') type = 'typosquatting';
        score += 0.5;
      } else if (minDist === 2) {
        reasons.push(`Domain is ${minDist} edit-distance from an official domain`);
        if (type === 'unknown') type = 'lookalike_domain';
        score += 0.3;
      } else if (minDist > 2 && minDist <= 4) {
        if (type === 'unknown') type = 'lookalike_domain';
        score += 0.15;
      }
    }

    if (reasons.length === 0) {
      if (brandWatch) {
        type = 'brand_impersonation';
        reasons.push('Keyword match against a watched brand');
        score += 0.4;
      }
    }

    if (!brandWatch && score < 0.2) {
      return { type: 'unknown', risk: 'low', confidence: 0, reasons };
    }

    let risk: PhishingRisk = 'low';
    if (score >= 0.85) risk = 'critical';
    else if (score >= 0.6) risk = 'high';
    else if (score >= 0.4) risk = 'medium';
    else risk = 'low';

    if (brandWatch) {
      if (brandWatch.protectionLevel === 'high_value' && risk !== 'critical') {
        if (score >= 0.4) risk = 'high';
      } else if (brandWatch.protectionLevel === 'low_value' && risk === 'critical') {
        risk = 'high';
      }
    }

    const confidence = Math.min(1, Math.max(0, score));
    return { type, risk, confidence, reasons };
  }

  private generateId(): string {
    try {
      return `phish_${randomUUID()}`;
    } catch {
      return `phish_${Date.now()}-${Math.floor(Math.random() * 1_000_000).toString(16)}`;
    }
  }

  private async loadSites(): Promise<PhishingSite[]> {
    const stored = await this.store.get<PhishingSite[]>(SITES_KEY);
    return stored ?? [];
  }

  private async saveSites(sites: PhishingSite[]): Promise<void> {
    await this.store.set(SITES_KEY, sites);
  }

  private async loadWatches(): Promise<BrandWatch[]> {
    const stored = await this.store.get<BrandWatch[]>(WATCHES_KEY);
    return stored ?? [];
  }

  private async saveWatches(watches: BrandWatch[]): Promise<void> {
    await this.store.set(WATCHES_KEY, watches);
  }

  private async incrementWatchDetections(watchId: string): Promise<void> {
    const all = await this.loadWatches();
    const idx = all.findIndex((w) => w.id === watchId);
    if (idx < 0) return;
    all[idx] = {
      ...all[idx],
      totalDetections: all[idx].totalDetections + 1,
      lastCheck: Date.now(),
    };
    await this.saveWatches(all);
  }
}
