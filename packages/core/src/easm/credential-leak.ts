import type { JsonStore } from '../storage/json-store.js';
import { randomUUID, createHash } from 'crypto';

export type LeakSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type LeakStatus = 'new' | 'verified' | 'revoked' | 'false_positive' | 'expired';
export type LeakSource =
  | 'github'
  | 'gitlab'
  | 'bitbucket'
  | 'pastebin'
  | 's3_bucket'
  | 'azure_blob'
  | 'docker_hub'
  | 'npm'
  | 'pypi'
  | 'public_html'
  | 'forum'
  | 'dark_web'
  | 'search_engine'
  | 'code_search'
  | 'unknown';
export type SecretType =
  | 'aws_access_key'
  | 'aws_secret_key'
  | 'gcp_service_account'
  | 'azure_sas'
  | 'ssh_private_key'
  | 'rsa_private_key'
  | 'github_pat'
  | 'gitlab_token'
  | 'slack_token'
  | 'stripe_key'
  | 'jwt_secret'
  | 'password'
  | 'api_key'
  | 'database_url'
  | 'oauth_client_secret'
  | 'generic_high_entropy';

export interface CredentialLeak {
  id: string;
  secretType: SecretType;
  severity: LeakSeverity;
  status: LeakStatus;
  source: LeakSource;
  sourceUrl: string;
  sourceFile: string;
  secretValueHash: string;
  secretPreview: string;
  repository: string;
  author: string;
  commitSha: string;
  firstSeen: number;
  lastSeen: number;
  detectedAt: number;
  scope: string;
  potentialImpact: string;
  rotatedAt: number | null;
  revokedAt: number | null;
  dismissedBy: string | null;
  dismissedReason: string | null;
  assignedTo: string | null;
  notes: string;
}

export interface LeakWatch {
  id: string;
  name: string;
  description: string;
  organization: string;
  type: 'organization' | 'domain' | 'repository' | 'keyword';
  query: string;
  active: boolean;
  createdAt: number;
  lastRun: number | null;
  totalLeaks: number;
  createdBy: string;
}

export interface LeakStats {
  totalLeaks: number;
  byStatus: Record<LeakStatus, number>;
  bySeverity: Record<LeakSeverity, number>;
  bySecretType: Record<SecretType, number>;
  bySource: Record<LeakSource, number>;
  activeLeaks: number;
  meanTimeToRevokeHours: number;
  criticalLeaks: number;
}

export interface SecretPattern {
  type: SecretType;
  name: string;
  description: string;
  regex: RegExp;
  severity: LeakSeverity;
  entropyThreshold: number;
}

export interface LeakFilters {
  secretType?: SecretType;
  severity?: LeakSeverity;
  status?: LeakStatus;
  source?: LeakSource;
  repository?: string;
  since?: number;
  limit?: number;
}

export interface WatchFilters {
  active?: boolean;
  type?: 'organization' | 'domain' | 'repository' | 'keyword';
  organization?: string;
}

export interface ScanResult {
  watchId: string;
  contentSources: number;
  patternsEvaluated: number;
  matchesFound: number;
  leaksRecorded: number;
  duplicates: number;
  matches: Array<{
    patternName: string;
    secretType: SecretType;
    severity: LeakSeverity;
    preview: string;
    sourceUrl: string;
    sourceFile: string;
  }>;
  startedAt: number;
  completedAt: number;
  durationMs: number;
}

const LEAKS_STORE_KEY = 'easm/leaks.json';
const WATCHES_STORE_KEY = 'easm/leak-watches.json';
const PATTERNS_STORE_KEY = 'easm/secret-patterns.json';

const STATUS_KEYS: LeakStatus[] = ['new', 'verified', 'revoked', 'false_positive', 'expired'];
const SEVERITY_KEYS: LeakSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
const SOURCE_KEYS: LeakSource[] = [
  'github',
  'gitlab',
  'bitbucket',
  'pastebin',
  's3_bucket',
  'azure_blob',
  'docker_hub',
  'npm',
  'pypi',
  'public_html',
  'forum',
  'dark_web',
  'search_engine',
  'code_search',
  'unknown',
];
const SECRET_TYPE_KEYS: SecretType[] = [
  'aws_access_key',
  'aws_secret_key',
  'gcp_service_account',
  'azure_sas',
  'ssh_private_key',
  'rsa_private_key',
  'github_pat',
  'gitlab_token',
  'slack_token',
  'stripe_key',
  'jwt_secret',
  'password',
  'api_key',
  'database_url',
  'oauth_client_secret',
  'generic_high_entropy',
];

export class CredentialLeakMonitor {
  constructor(private store: JsonStore) {}

  async createWatch(
    params: Omit<LeakWatch, 'id' | 'createdAt' | 'lastRun' | 'totalLeaks'>,
  ): Promise<LeakWatch> {
    const watch: LeakWatch = {
      ...params,
      id: this.generateId('watch'),
      createdAt: Date.now(),
      lastRun: null,
      totalLeaks: 0,
    };
    const watches = await this.loadWatches();
    watches.push(watch);
    await this.saveWatches(watches);
    return watch;
  }

  async getWatch(watchId: string): Promise<LeakWatch | null> {
    const watches = await this.loadWatches();
    return watches.find((w) => w.id === watchId) ?? null;
  }

  async listWatches(filters: WatchFilters = {}): Promise<LeakWatch[]> {
    const all = await this.loadWatches();
    let filtered = all;
    if (filters.active !== undefined) {
      const wanted = filters.active;
      filtered = filtered.filter((w) => w.active === wanted);
    }
    if (filters.type) {
      const wanted = filters.type;
      filtered = filtered.filter((w) => w.type === wanted);
    }
    if (filters.organization) {
      const org = filters.organization.toLowerCase();
      filtered = filtered.filter((w) => w.organization.toLowerCase().includes(org));
    }
    return filtered;
  }

  async updateWatch(
    watchId: string,
    updates: Partial<Omit<LeakWatch, 'id' | 'createdAt'>>,
  ): Promise<LeakWatch | null> {
    const watches = await this.loadWatches();
    const idx = watches.findIndex((w) => w.id === watchId);
    if (idx === -1) return null;
    const current = watches[idx] as LeakWatch;
    const merged: LeakWatch = {
      ...current,
      ...updates,
      id: current.id,
      createdAt: current.createdAt,
    };
    watches[idx] = merged;
    await this.saveWatches(watches);
    return merged;
  }

  async deleteWatch(watchId: string): Promise<boolean> {
    const watches = await this.loadWatches();
    const idx = watches.findIndex((w) => w.id === watchId);
    if (idx === -1) return false;
    watches.splice(idx, 1);
    await this.saveWatches(watches);
    return true;
  }

  async scanWatch(
    watchId: string,
    content: Array<{ url: string; file: string; body: string }>,
  ): Promise<ScanResult> {
    const startedAt = Date.now();
    const patterns = await this.listPatterns();
    const allLeaks = await this.loadLeaks();
    const hashes = new Set(allLeaks.map((l) => l.secretValueHash));

    const matches: ScanResult['matches'] = [];
    let duplicates = 0;
    let leaksRecorded = 0;

    for (const item of content) {
      for (const pattern of patterns) {
        const found = pattern.regex.exec(item.body);
        if (!found) continue;
        const secretValue = found[0];
        const hash = this.hashSecret(secretValue);
        const entropy = this.computeEntropy(secretValue);
        if (pattern.entropyThreshold > 0 && entropy < pattern.entropyThreshold) continue;
        if (hashes.has(hash)) {
          duplicates++;
          continue;
        }
        hashes.add(hash);

        const preview = this.extractPreview(secretValue);
        const inferredSource = this.inferSource(item.url);

        matches.push({
          patternName: pattern.name,
          secretType: pattern.type,
          severity: pattern.severity,
          preview,
          sourceUrl: item.url,
          sourceFile: item.file,
        });

        const leak = await this.recordLeak({
          secretType: pattern.type,
          severity: pattern.severity,
          source: inferredSource,
          sourceUrl: item.url,
          sourceFile: item.file,
          secretValueHash: hash,
          secretPreview: preview,
          repository: '',
          author: '',
          commitSha: '',
          scope: '',
          potentialImpact: this.buildImpact(pattern.type),
          assignedTo: null,
          notes: `Detected via watch ${watchId} using pattern "${pattern.name}".`,
        });
        if (leak) leaksRecorded++;
      }
    }

    const completedAt = Date.now();

    const watches = await this.loadWatches();
    const idx = watches.findIndex((w) => w.id === watchId);
    if (idx !== -1) {
      const current = watches[idx] as LeakWatch;
      watches[idx] = {
        ...current,
        lastRun: completedAt,
        totalLeaks: current.totalLeaks + leaksRecorded,
      };
      await this.saveWatches(watches);
    }

    return {
      watchId,
      contentSources: content.length,
      patternsEvaluated: patterns.length,
      matchesFound: matches.length,
      leaksRecorded,
      duplicates,
      matches,
      startedAt,
      completedAt,
      durationMs: completedAt - startedAt,
    };
  }

  async scanContent(
    content: Array<{ url: string; file: string; body: string }>,
    options: { severityThreshold?: LeakSeverity; secretType?: SecretType } = {},
  ): Promise<ScanResult> {
    const startedAt = Date.now();
    const patterns = await this.listPatterns();
    const allLeaks = await this.loadLeaks();
    const hashes = new Set(allLeaks.map((l) => l.secretValueHash));
    const threshold = options.severityThreshold ?? 'info';

    const matches: ScanResult['matches'] = [];
    let duplicates = 0;
    let leaksRecorded = 0;

    for (const item of content) {
      for (const pattern of patterns) {
        if (options.secretType && pattern.type !== options.secretType) continue;
        if (severityWeight(pattern.severity) < severityWeight(threshold)) continue;
        const found = pattern.regex.exec(item.body);
        if (!found) continue;
        const secretValue = found[0];
        const hash = this.hashSecret(secretValue);
        const entropy = this.computeEntropy(secretValue);
        if (pattern.entropyThreshold > 0 && entropy < pattern.entropyThreshold) continue;
        if (hashes.has(hash)) {
          duplicates++;
          continue;
        }
        hashes.add(hash);

        const preview = this.extractPreview(secretValue);
        matches.push({
          patternName: pattern.name,
          secretType: pattern.type,
          severity: pattern.severity,
          preview,
          sourceUrl: item.url,
          sourceFile: item.file,
        });

        const leak = await this.recordLeak({
          secretType: pattern.type,
          severity: pattern.severity,
          source: this.inferSource(item.url),
          sourceUrl: item.url,
          sourceFile: item.file,
          secretValueHash: hash,
          secretPreview: preview,
          repository: '',
          author: '',
          commitSha: '',
          scope: '',
          potentialImpact: this.buildImpact(pattern.type),
          assignedTo: null,
          notes: `Detected via ad-hoc scan using pattern "${pattern.name}".`,
        });
        if (leak) leaksRecorded++;
      }
    }

    const completedAt = Date.now();
    return {
      watchId: 'adhoc',
      contentSources: content.length,
      patternsEvaluated: patterns.length,
      matchesFound: matches.length,
      leaksRecorded,
      duplicates,
      matches,
      startedAt,
      completedAt,
      durationMs: completedAt - startedAt,
    };
  }

  async recordLeak(
    params: Omit<CredentialLeak, 'id' | 'status' | 'firstSeen' | 'lastSeen' | 'detectedAt' | 'rotatedAt' | 'revokedAt' | 'dismissedBy' | 'dismissedReason'>,
  ): Promise<CredentialLeak | null> {
    const allLeaks = await this.loadLeaks();
    const existingIdx = allLeaks.findIndex((l) => l.secretValueHash === params.secretValueHash);
    const now = Date.now();
    if (existingIdx !== -1) {
      const existing = allLeaks[existingIdx] as CredentialLeak;
      allLeaks[existingIdx] = {
        ...existing,
        lastSeen: now,
        sourceUrl: params.sourceUrl || existing.sourceUrl,
        sourceFile: params.sourceFile || existing.sourceFile,
      };
      await this.saveLeaks(allLeaks);
      return null;
    }
    const leak: CredentialLeak = {
      ...params,
      id: this.generateId('leak'),
      status: 'new',
      firstSeen: now,
      lastSeen: now,
      detectedAt: now,
      rotatedAt: null,
      revokedAt: null,
      dismissedBy: null,
      dismissedReason: null,
    };
    allLeaks.push(leak);
    await this.saveLeaks(allLeaks);
    return leak;
  }

  async getLeak(leakId: string): Promise<CredentialLeak | null> {
    const leaks = await this.loadLeaks();
    return leaks.find((l) => l.id === leakId) ?? null;
  }

  async listLeaks(filters: LeakFilters = {}): Promise<CredentialLeak[]> {
    let leaks = await this.loadLeaks();
    if (filters.secretType) {
      const wanted = filters.secretType;
      leaks = leaks.filter((l) => l.secretType === wanted);
    }
    if (filters.severity) {
      const wanted = filters.severity;
      leaks = leaks.filter((l) => l.severity === wanted);
    }
    if (filters.status) {
      const wanted = filters.status;
      leaks = leaks.filter((l) => l.status === wanted);
    }
    if (filters.source) {
      const wanted = filters.source;
      leaks = leaks.filter((l) => l.source === wanted);
    }
    if (filters.repository) {
      const repo = filters.repository.toLowerCase();
      leaks = leaks.filter((l) => l.repository.toLowerCase().includes(repo));
    }
    if (typeof filters.since === 'number') {
      const since = filters.since;
      leaks = leaks.filter((l) => l.detectedAt >= since);
    }

    leaks.sort((a, b) => {
      const sa = severityWeight(a.severity);
      const sb = severityWeight(b.severity);
      if (sa !== sb) return sb - sa;
      return b.detectedAt - a.detectedAt;
    });

    if (typeof filters.limit === 'number') {
      leaks = leaks.slice(0, filters.limit);
    }
    return leaks;
  }

  async updateLeakStatus(leakId: string, status: LeakStatus): Promise<boolean> {
    const leaks = await this.loadLeaks();
    const idx = leaks.findIndex((l) => l.id === leakId);
    if (idx === -1) return false;
    const current = leaks[idx] as CredentialLeak;
    const now = Date.now();
    const updated: CredentialLeak = {
      ...current,
      status,
      lastSeen: now,
    };
    if (status === 'revoked' && current.revokedAt === null) {
      updated.revokedAt = now;
    }
    leaks[idx] = updated;
    await this.saveLeaks(leaks);
    return true;
  }

  async dismissLeak(
    leakId: string,
    dismissedBy: string,
    reason: string,
  ): Promise<boolean> {
    const leaks = await this.loadLeaks();
    const idx = leaks.findIndex((l) => l.id === leakId);
    if (idx === -1) return false;
    const current = leaks[idx] as CredentialLeak;
    leaks[idx] = {
      ...current,
      status: 'false_positive',
      dismissedBy,
      dismissedReason: reason,
      lastSeen: Date.now(),
    };
    await this.saveLeaks(leaks);
    return true;
  }

  async markRevoked(leakId: string): Promise<boolean> {
    const leaks = await this.loadLeaks();
    const idx = leaks.findIndex((l) => l.id === leakId);
    if (idx === -1) return false;
    const current = leaks[idx] as CredentialLeak;
    const now = Date.now();
    leaks[idx] = {
      ...current,
      status: 'revoked',
      revokedAt: now,
      rotatedAt: current.rotatedAt ?? now,
      lastSeen: now,
    };
    await this.saveLeaks(leaks);
    return true;
  }

  async getStats(): Promise<LeakStats> {
    const leaks = await this.loadLeaks();
    const byStatus = emptyStatusMap();
    const bySeverity = emptySeverityMap();
    const bySecretType = emptySecretTypeMap();
    const bySource = emptySourceMap();

    let activeLeaks = 0;
    let criticalLeaks = 0;
    let totalRevokeTimeMs = 0;
    let revokedCount = 0;

    for (const l of leaks) {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;
      bySeverity[l.severity] = (bySeverity[l.severity] || 0) + 1;
      bySecretType[l.secretType] = (bySecretType[l.secretType] || 0) + 1;
      bySource[l.source] = (bySource[l.source] || 0) + 1;
      if (l.status === 'new' || l.status === 'verified') activeLeaks++;
      if (l.severity === 'critical') criticalLeaks++;
      if (l.revokedAt !== null) {
        totalRevokeTimeMs += Math.max(0, l.revokedAt - l.detectedAt);
        revokedCount++;
      }
    }

    const meanTimeToRevokeHours = revokedCount > 0 ? totalRevokeTimeMs / revokedCount / (1000 * 60 * 60) : 0;

    return {
      totalLeaks: leaks.length,
      byStatus,
      bySeverity,
      bySecretType,
      bySource,
      activeLeaks,
      meanTimeToRevokeHours,
      criticalLeaks,
    };
  }

  async getActiveLeaks(): Promise<CredentialLeak[]> {
    return this.listLeaks({ status: 'new' });
  }

  async getCriticalLeaks(): Promise<CredentialLeak[]> {
    return this.listLeaks({ severity: 'critical' });
  }

  async listPatterns(): Promise<SecretPattern[]> {
    const stored = await this.store.get<SecretPattern[]>(PATTERNS_STORE_KEY);
    if (Array.isArray(stored) && stored.length > 0) {
      return stored.map((p) => ({
        ...p,
        regex: new RegExp(p.regex.source, p.regex.flags),
      }));
    }
    const builtIn = this.buildBuiltInPatterns();
    await this.savePatterns(builtIn);
    return builtIn;
  }

  async registerPattern(pattern: SecretPattern): Promise<SecretPattern> {
    const all = await this.listPatterns();
    all.push(pattern);
    await this.savePatterns(all);
    return pattern;
  }

  private buildBuiltInPatterns(): SecretPattern[] {
    return [
      {
        type: 'aws_access_key',
        name: 'AWS Access Key ID',
        description: 'Amazon Web Services Access Key ID (16 uppercase chars after AKIA prefix).',
        regex: /\bAKIA[0-9A-Z]{16}\b/,
        severity: 'critical',
        entropyThreshold: 0,
      },
      {
        type: 'aws_secret_key',
        name: 'AWS Secret Access Key',
        description: '40-character base64-like string isolated from alphanumerics.',
        regex: /(?<![A-Za-z0-9])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9])/,
        severity: 'high',
        entropyThreshold: 3.5,
      },
      {
        type: 'github_pat',
        name: 'GitHub Personal Access Token',
        description: 'GitHub classic personal access token (ghp_ prefix).',
        regex: /\bghp_[A-Za-z0-9]{36}\b/,
        severity: 'high',
        entropyThreshold: 0,
      },
      {
        type: 'github_pat',
        name: 'GitHub Fine-Grained Token',
        description: 'GitHub fine-grained personal access token (github_pat_ prefix).',
        regex: /\bgithub_pat_[A-Za-z0-9_]{82}\b/,
        severity: 'high',
        entropyThreshold: 0,
      },
      {
        type: 'gitlab_token',
        name: 'GitLab Personal Access Token',
        description: 'GitLab personal access token (glpat- prefix).',
        regex: /\bglpat-[A-Za-z0-9_\-]{20,}\b/,
        severity: 'high',
        entropyThreshold: 0,
      },
      {
        type: 'slack_token',
        name: 'Slack Token',
        description: 'Slack API token (xoxb, xoxp, xoxa, xoxr, xoxs prefix).',
        regex: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/,
        severity: 'medium',
        entropyThreshold: 0,
      },
      {
        type: 'stripe_key',
        name: 'Stripe Live Secret Key',
        description: 'Stripe live secret API key (sk_live_ prefix).',
        regex: /\bsk_live_[A-Za-z0-9]{24,}\b/,
        severity: 'critical',
        entropyThreshold: 0,
      },
      {
        type: 'api_key',
        name: 'Google API Key',
        description: 'Google Cloud API key (AIza prefix).',
        regex: /\bAIza[0-9A-Za-z_\-]{35}\b/,
        severity: 'medium',
        entropyThreshold: 0,
      },
      {
        type: 'jwt_secret',
        name: 'JSON Web Token',
        description: 'Encoded JWT with header.payload.signature segments.',
        regex: /\beyJ[A-Za-z0-9_=]+\.[A-Za-z0-9_=]+\.?[A-Za-z0-9_.+/=]*\b/,
        severity: 'medium',
        entropyThreshold: 0,
      },
      {
        type: 'rsa_private_key',
        name: 'PEM Private Key',
        description: 'PEM-encoded private key (RSA, EC, DSA, OPENSSH, PGP).',
        regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]+?-----END/,
        severity: 'critical',
        entropyThreshold: 0,
      },
      {
        type: 'ssh_private_key',
        name: 'OpenSSH Private Key',
        description: 'OpenSSH-format private key header.',
        regex: /-----BEGIN OPENSSH PRIVATE KEY-----[\s\S]+?-----END/,
        severity: 'critical',
        entropyThreshold: 0,
      },
      {
        type: 'database_url',
        name: 'Database Connection URL',
        description: 'Connection URL with embedded credentials (postgres, mysql, mongodb, redis).',
        regex: /\b(?:postgres|mysql|mongodb|redis):\/\/[^\s]+:[^\s]+@/,
        severity: 'high',
        entropyThreshold: 0,
      },
      {
        type: 'api_key',
        name: 'Generic API Key Assignment',
        description: 'Assignment or JSON-style declaration of an api_key/api-key.',
        regex: /\bapi[_-]?key['":\s]+['"]?([A-Za-z0-9_\-]{20,})/i,
        severity: 'medium',
        entropyThreshold: 3.0,
      },
      {
        type: 'stripe_key',
        name: 'Stripe Test Secret Key',
        description: 'Stripe test secret API key (sk_test_ prefix).',
        regex: /\bsk_test_[A-Za-z0-9]{24,}\b/,
        severity: 'low',
        entropyThreshold: 0,
      },
      {
        type: 'password',
        name: 'Password in URL',
        description: 'Generic URL containing user:password@ credentials.',
        regex: /\b[a-zA-Z]+:\/\/[^:\s]+:[^@\s]+@/,
        severity: 'medium',
        entropyThreshold: 0,
      },
      {
        type: 'azure_sas',
        name: 'Azure Shared Access Signature',
        description: 'Azure Storage SAS URL with signature component.',
        regex: /\?sv=[\d.]{4,}-[\d.]{4,}&[^"\s]*sig=[A-Za-z0-9%]{20,}/,
        severity: 'critical',
        entropyThreshold: 0,
      },
      {
        type: 'oauth_client_secret',
        name: 'OAuth Client Secret Assignment',
        description: 'Assignment of an oauth client secret or client_secret.',
        regex: /\bclient[_-]?secret['":\s]+['"]?([A-Za-z0-9_\-]{20,})/i,
        severity: 'high',
        entropyThreshold: 3.0,
      },
    ];
  }

  private computeEntropy(input: string): number {
    if (!input || input.length === 0) return 0;
    const counts: Record<string, number> = {};
    for (const ch of input) {
      counts[ch] = (counts[ch] || 0) + 1;
    }
    let entropy = 0;
    const len = input.length;
    for (const key of Object.keys(counts)) {
      const p = (counts[key] ?? 0) / len;
      if (p > 0) entropy -= p * Math.log2(p);
    }
    return entropy;
  }

  private hashSecret(value: string): string {
    return createHash('sha256').update(value, 'utf8').digest('hex');
  }

  private extractPreview(value: string): string {
    if (value.length <= 8) return `${value[0] ?? ''}***${value[value.length - 1] ?? ''}`;
    const head = value.slice(0, 4);
    const tail = value.slice(-4);
    return `${head}***${tail}`;
  }

  private inferSource(url: string): LeakSource {
    const lower = url.toLowerCase();
    if (lower.includes('github.com')) return 'github';
    if (lower.includes('gitlab.com') || lower.includes('gitlab.')) return 'gitlab';
    if (lower.includes('bitbucket.org') || lower.includes('bitbucket.')) return 'bitbucket';
    if (lower.includes('pastebin.com') || lower.includes('pastebin.') || lower.includes('paste.')) return 'pastebin';
    if (lower.includes('.s3.amazonaws.com') || lower.includes('s3://')) return 's3_bucket';
    if (lower.includes('blob.core.windows.net')) return 'azure_blob';
    if (lower.includes('hub.docker.com') || lower.includes('dockerhub')) return 'docker_hub';
    if (lower.includes('npmjs.com') || lower.includes('npm.')) return 'npm';
    if (lower.includes('pypi.org') || lower.includes('pypi.')) return 'pypi';
    if (lower.includes('forum') || lower.includes('discuss') || lower.includes('community')) return 'forum';
    if (lower.includes('onion') || lower.includes('darkweb') || lower.includes('dark_web')) return 'dark_web';
    if (lower.includes('google.com/search') || lower.includes('bing.com/search')) return 'search_engine';
    if (lower.includes('grep.app') || lower.includes('sourcegraph') || lower.includes('publicwww')) return 'code_search';
    if (lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.php')) return 'public_html';
    return 'unknown';
  }

  private buildImpact(secretType: SecretType): string {
    switch (secretType) {
      case 'aws_access_key':
      case 'aws_secret_key':
        return 'Unauthorized access to AWS resources, data exfiltration, and compute abuse.';
      case 'gcp_service_account':
        return 'Unauthorized access to Google Cloud projects and stored secrets.';
      case 'azure_sas':
        return 'Direct read/write/delete on Azure Blob containers via shared access signature.';
      case 'ssh_private_key':
      case 'rsa_private_key':
        return 'Direct SSH or TLS access to production systems and source repositories.';
      case 'github_pat':
        return 'Access to private repositories, packages, and CI workflows.';
      case 'gitlab_token':
        return 'Access to private GitLab projects, pipelines, and registry images.';
      case 'slack_token':
        return 'Access to Slack workspace channels, files, and messaging capabilities.';
      case 'stripe_key':
        return 'Ability to issue refunds, view customer data, or extract payment information.';
      case 'jwt_secret':
        return 'Forging of authentication tokens and impersonation of users.';
      case 'password':
        return 'Credential reuse against internal services and third-party platforms.';
      case 'api_key':
        return 'Unauthorized access to the API surface tied to this key.';
      case 'database_url':
        return 'Direct read/write/exfiltration of production database contents.';
      case 'oauth_client_secret':
        return 'Impersonation of OAuth application and theft of user tokens.';
      case 'generic_high_entropy':
        return 'High-entropy string that may correspond to a credential, API key, or token.';
      default:
        return 'Potential credential exposure with unknown downstream impact.';
    }
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`;
  }

  private async loadWatches(): Promise<LeakWatch[]> {
    const data = await this.store.get<LeakWatch[]>(WATCHES_STORE_KEY);
    return data ?? [];
  }

  private async saveWatches(watches: LeakWatch[]): Promise<void> {
    await this.store.set(WATCHES_STORE_KEY, watches);
  }

  private async loadLeaks(): Promise<CredentialLeak[]> {
    const data = await this.store.get<CredentialLeak[]>(LEAKS_STORE_KEY);
    return data ?? [];
  }

  private async saveLeaks(leaks: CredentialLeak[]): Promise<void> {
    await this.store.set(LEAKS_STORE_KEY, leaks);
  }

  private async savePatterns(patterns: SecretPattern[]): Promise<void> {
    const serializable = patterns.map((p) => ({
      ...p,
      regex: { source: p.regex.source, flags: p.regex.flags },
    }));
    await this.store.set(PATTERNS_STORE_KEY, serializable as unknown as SecretPattern[]);
  }
}

function emptyStatusMap(): Record<LeakStatus, number> {
  const out = {} as Record<LeakStatus, number>;
  for (const k of STATUS_KEYS) out[k] = 0;
  return out;
}

function emptySeverityMap(): Record<LeakSeverity, number> {
  const out = {} as Record<LeakSeverity, number>;
  for (const k of SEVERITY_KEYS) out[k] = 0;
  return out;
}

function emptySecretTypeMap(): Record<SecretType, number> {
  const out = {} as Record<SecretType, number>;
  for (const k of SECRET_TYPE_KEYS) out[k] = 0;
  return out;
}

function emptySourceMap(): Record<LeakSource, number> {
  const out = {} as Record<LeakSource, number>;
  for (const k of SOURCE_KEYS) out[k] = 0;
  return out;
}

function severityWeight(severity: LeakSeverity): number {
  switch (severity) {
    case 'critical':
      return 5;
    case 'high':
      return 4;
    case 'medium':
      return 3;
    case 'low':
      return 2;
    case 'info':
      return 1;
    default:
      return 0;
  }
}
