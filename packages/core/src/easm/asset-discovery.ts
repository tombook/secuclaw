import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type AssetType =
  | 'domain'
  | 'subdomain'
  | 'ip'
  | 'ipv6'
  | 'cidr'
  | 'asn'
  | 'certificate'
  | 'service'
  | 'port'
  | 'url'
  | 'email'
  | 'repository'
  | 'cloud_resource';

export type AssetStatus = 'active' | 'inactive' | 'unknown' | 'decommissioned';

export type DiscoveryMethod =
  | 'dns_enum'
  | 'certificate_transparency'
  | 'web_crawler'
  | 'shodan'
  | 'censys'
  | 'search_engine'
  | 'whois'
  | 'asn_lookup'
  | 'manual'
  | 'wordlist';

export type CloudProvider =
  | 'aws'
  | 'azure'
  | 'gcp'
  | 'aliyun'
  | 'tencent'
  | 'huawei'
  | 'oracle'
  | 'other'
  | null;

export type RelationshipKind =
  | 'subdomain_of'
  | 'resolves_to'
  | 'hosted_on'
  | 'points_to'
  | 'redirects_to'
  | 'shares_certificate_with'
  | 'shares_ip_with'
  | 'owned_by_same_org';

export interface AssetCertificate {
  issuer: string;
  subject: string;
  validFrom: number;
  validTo: number;
  sanDomains: string[];
}

export interface DiscoveredAsset {
  id: string;
  type: AssetType;
  value: string;
  parentAssetId: string | null;
  rootDomain: string;
  status: AssetStatus;
  firstSeen: number;
  lastSeen: number;
  lastScanned: number | null;
  discoveryMethods: DiscoveryMethod[];
  confidence: number;
  riskScore: number;
  riskFactors: string[];
  technologies: string[];
  ports: number[];
  protocols: string[];
  certificates: AssetCertificate[];
  metadata: Record<string, unknown>;
  tags: string[];
  monitored: boolean;
  country: string | null;
  asn: number | null;
  asnOrganization: string | null;
  cloudProvider: CloudProvider;
}

export interface DiscoveryTarget {
  id: string;
  rootDomain: string;
  organization: string;
  description: string;
  seeds: string[];
  includedMethods: DiscoveryMethod[];
  excludedMethods: DiscoveryMethod[];
  scopeIncludes: string[];
  scopeExcludes: string[];
  active: boolean;
  createdAt: number;
  lastDiscoveryRun: number | null;
  totalAssets: number;
  createdBy: string;
}

export interface DiscoveryResult {
  targetId: string;
  targetDomain: string;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  methodsRun: DiscoveryMethod[];
  assetsDiscovered: number;
  assetsByType: Record<AssetType, number>;
  subdomainsFound: string[];
  newAssets: number;
  updatedAssets: number;
  errors: string[];
}

export interface AssetRelationship {
  sourceAssetId: string;
  targetAssetId: string;
  relationship: RelationshipKind;
  discoveredAt: number;
}

const TARGETS_KEY = 'easm/targets.json';
const ASSETS_KEY = 'easm/assets.json';
const RELATIONSHIPS_KEY = 'easm/relationships.json';
const HISTORY_KEY = 'easm/discovery-history.json';

const ASSET_TYPES: AssetType[] = [
  'domain',
  'subdomain',
  'ip',
  'ipv6',
  'cidr',
  'asn',
  'certificate',
  'service',
  'port',
  'url',
  'email',
  'repository',
  'cloud_resource',
];

const STATUSES: AssetStatus[] = ['active', 'inactive', 'unknown', 'decommissioned'];

const HIGH_RISK_ASN: Set<number> = new Set([
  9009, 174, 13213, 36352, 51167, 200651, 207990, 394711, 140227, 204957,
]);

const KNOWN_VULNERABLE_TECH: Set<string> = new Set([
  'wordpress',
  'tomcat',
  'iis',
  'joomla',
  'drupal',
  'struts',
  'weblogic',
  'jboss',
  'coldfusion',
  'exchange',
  ' confluence',
]);

const WAF_CDN_TECH: Set<string> = new Set([
  'cloudflare',
  'akamai',
  'aws-waf',
  'azure-frontdoor',
  'fastly',
  'imperva',
  'sucuri',
  'aliyun-waf',
  'tencent-waf',
  'huawei-waf',
  'f5',
  'barracuda',
]);

const CLOUD_IP_PREFIXES: Array<{ prefix: string; provider: Exclude<CloudProvider, null> }> = [
  { prefix: '3.', provider: 'aws' },
  { prefix: '13.', provider: 'aws' },
  { prefix: '52.', provider: 'aws' },
  { prefix: '54.', provider: 'aws' },
  { prefix: '18.', provider: 'aws' },
  { prefix: '20.', provider: 'azure' },
  { prefix: '40.', provider: 'azure' },
  { prefix: '52.', provider: 'azure' },
  { prefix: '104.', provider: 'azure' },
  { prefix: '13.', provider: 'gcp' },
  { prefix: '34.', provider: 'gcp' },
  { prefix: '35.', provider: 'gcp' },
  { prefix: '47.', provider: 'aliyun' },
  { prefix: '39.', provider: 'aliyun' },
  { prefix: '106.', provider: 'aliyun' },
  { prefix: '129.', provider: 'tencent' },
  { prefix: '140.', provider: 'tencent' },
  { prefix: '81.', provider: 'tencent' },
  { prefix: '139.', provider: 'huawei' },
  { prefix: '152.', provider: 'huawei' },
  { prefix: '150.', provider: 'oracle' },
  { prefix: '132.', provider: 'oracle' },
];

const SUBDOMAIN_WORDLIST: string[] = [
  'www', 'api', 'mail', 'cdn', 'cloud', 'dev', 'staging', 'admin', 'portal',
  'app', 'm', 'static', 'blog', 'shop', 'auth', 'sso', 'vpn', 'git', 'docs',
  'status', 'demo', 'beta', 'test', 'internal', 'jira', 'grafana', 'kibana',
];

export class AssetDiscoveryService {
  constructor(private store: JsonStore) {}

  private async loadTargets(): Promise<DiscoveryTarget[]> {
    const data = await this.store.get<DiscoveryTarget[]>(TARGETS_KEY);
    return data ?? [];
  }

  private async saveTargets(targets: DiscoveryTarget[]): Promise<void> {
    await this.store.set(TARGETS_KEY, targets);
  }

  private async loadAssets(): Promise<DiscoveredAsset[]> {
    const data = await this.store.get<DiscoveredAsset[]>(ASSETS_KEY);
    return data ?? [];
  }

  private async saveAssets(assets: DiscoveredAsset[]): Promise<void> {
    await this.store.set(ASSETS_KEY, assets);
  }

  private async loadRelationships(): Promise<AssetRelationship[]> {
    const data = await this.store.get<AssetRelationship[]>(RELATIONSHIPS_KEY);
    return data ?? [];
  }

  private async saveRelationships(rels: AssetRelationship[]): Promise<void> {
    await this.store.set(RELATIONSHIPS_KEY, rels);
  }

  private async loadHistory(): Promise<DiscoveryResult[]> {
    const data = await this.store.get<DiscoveryResult[]>(HISTORY_KEY);
    return data ?? [];
  }

  private async saveHistory(history: DiscoveryResult[]): Promise<void> {
    await this.store.set(HISTORY_KEY, history);
  }

  async createTarget(
    params: Omit<DiscoveryTarget, 'id' | 'createdAt' | 'lastDiscoveryRun' | 'totalAssets'>,
  ): Promise<DiscoveryTarget> {
    const target: DiscoveryTarget = {
      ...params,
      id: this.generateId(),
      createdAt: Date.now(),
      lastDiscoveryRun: null,
      totalAssets: 0,
    };
    const targets = await this.loadTargets();
    targets.push(target);
    await this.saveTargets(targets);
    return target;
  }

  async updateTarget(
    targetId: string,
    updates: Partial<DiscoveryTarget>,
  ): Promise<DiscoveryTarget | null> {
    const targets = await this.loadTargets();
    const index = targets.findIndex((t) => t.id === targetId);
    if (index === -1) return null;
    const current = targets[index] as DiscoveryTarget;
    const merged: DiscoveryTarget = {
      ...current,
      ...updates,
      id: current.id,
      createdAt: current.createdAt,
    };
    targets[index] = merged;
    await this.saveTargets(targets);
    return merged;
  }

  async getTarget(targetId: string): Promise<DiscoveryTarget | null> {
    const targets = await this.loadTargets();
    return targets.find((t) => t.id === targetId) ?? null;
  }

  async listTargets(filters?: {
    active?: boolean;
    organization?: string;
  }): Promise<DiscoveryTarget[]> {
    let targets = await this.loadTargets();
    if (filters?.active !== undefined) {
      const wanted = filters.active;
      targets = targets.filter((t) => t.active === wanted);
    }
    if (filters?.organization) {
      const org = filters.organization.toLowerCase();
      targets = targets.filter((t) => t.organization.toLowerCase().includes(org));
    }
    return targets;
  }

  async deleteTarget(targetId: string): Promise<boolean> {
    const targets = await this.loadTargets();
    const index = targets.findIndex((t) => t.id === targetId);
    if (index === -1) return false;
    targets.splice(index, 1);
    await this.saveTargets(targets);
    return true;
  }

  async addDiscoveredAsset(
    asset: Omit<DiscoveredAsset, 'id' | 'firstSeen' | 'lastSeen'>,
  ): Promise<DiscoveredAsset> {
    const now = Date.now();
    const newAsset: DiscoveredAsset = {
      ...asset,
      id: this.generateId(),
      firstSeen: now,
      lastSeen: now,
    };
    newAsset.riskScore = this.computeRiskScore(newAsset);
    const assets = await this.loadAssets();
    assets.push(newAsset);
    await this.saveAssets(assets);
    return newAsset;
  }

  async getAsset(assetId: string): Promise<DiscoveredAsset | null> {
    const assets = await this.loadAssets();
    return assets.find((a) => a.id === assetId) ?? null;
  }

  async listAssets(filters?: {
    targetId?: string;
    type?: AssetType;
    status?: AssetStatus;
    riskScoreMin?: number;
    rootDomain?: string;
    cloudProvider?: string;
    limit?: number;
  }): Promise<DiscoveredAsset[]> {
    let assets = await this.loadAssets();
    if (filters?.type) {
      const wanted = filters.type;
      assets = assets.filter((a) => a.type === wanted);
    }
    if (filters?.status) {
      const wanted = filters.status;
      assets = assets.filter((a) => a.status === wanted);
    }
    if (filters?.riskScoreMin !== undefined) {
      const min = filters.riskScoreMin;
      assets = assets.filter((a) => a.riskScore >= min);
    }
    if (filters?.rootDomain) {
      const rd = filters.rootDomain.toLowerCase();
      assets = assets.filter((a) => a.rootDomain.toLowerCase() === rd);
    }
    if (filters?.cloudProvider) {
      const cp = filters.cloudProvider;
      assets = assets.filter((a) => a.cloudProvider === cp);
    }
    if (filters?.targetId) {
      const tid = filters.targetId;
      assets = assets.filter((a) => {
        if (a.metadata && (a.metadata as Record<string, unknown>)['targetId'] === tid) return true;
        return a.tags.includes(tid);
      });
    }
    assets.sort((a, b) => b.riskScore - a.riskScore);
    if (filters?.limit) {
      assets = assets.slice(0, filters.limit);
    }
    return assets;
  }

  async updateAsset(
    assetId: string,
    updates: Partial<DiscoveredAsset>,
  ): Promise<DiscoveredAsset | null> {
    const assets = await this.loadAssets();
    const index = assets.findIndex((a) => a.id === assetId);
    if (index === -1) return null;
    const current = assets[index] as DiscoveredAsset;
    const merged: DiscoveredAsset = {
      ...current,
      ...updates,
      id: current.id,
      firstSeen: current.firstSeen,
      lastSeen: Date.now(),
    };
    merged.riskScore = this.computeRiskScore(merged);
    assets[index] = merged;
    await this.saveAssets(assets);
    return merged;
  }

  async deleteAsset(assetId: string): Promise<boolean> {
    const assets = await this.loadAssets();
    const index = assets.findIndex((a) => a.id === assetId);
    if (index === -1) return false;
    assets.splice(index, 1);
    await this.saveAssets(assets);
    return true;
  }

  async runDiscovery(
    targetId: string,
    options?: { methods?: DiscoveryMethod[] },
  ): Promise<DiscoveryResult> {
    const target = await this.getTarget(targetId);
    if (!target) {
      return this.buildEmptyResult(targetId, '', []);
    }

    const startedAt = Date.now();
    const errors: string[] = [];
    const collected: DiscoveredAsset[] = [];
    const subdomainSet = new Set<string>();

    let methodsRun: DiscoveryMethod[];
    if (options?.methods && options.methods.length > 0) {
      methodsRun = options.methods.filter((m) => !target.excludedMethods.includes(m));
    } else {
      methodsRun = target.includedMethods.filter((m) => !target.excludedMethods.includes(m));
    }

    for (const method of methodsRun) {
      try {
        const assets = await this.runMethod(target, method);
        for (const a of assets) {
          collected.push(a);
          if (a.type === 'subdomain') {
            subdomainSet.add(a.value.toLowerCase());
          }
        }
      } catch (err) {
        errors.push(`${method}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    const mergeOutcome = await this.mergeDiscoveredAssets(target, collected);
    const completedAt = Date.now();

    const assetsByType = this.emptyAssetsByType();
    for (const a of mergeOutcome.merged) {
      assetsByType[a.type] = (assetsByType[a.type] ?? 0) + 1;
    }

    const result: DiscoveryResult = {
      targetId: target.id,
      targetDomain: target.rootDomain,
      startedAt,
      completedAt,
      durationMs: completedAt - startedAt,
      methodsRun,
      assetsDiscovered: collected.length,
      assetsByType,
      subdomainsFound: Array.from(subdomainSet),
      newAssets: mergeOutcome.newCount,
      updatedAssets: mergeOutcome.updatedCount,
      errors,
    };

    await this.updateTarget(target.id, {
      lastDiscoveryRun: completedAt,
      totalAssets: mergeOutcome.merged.length,
    });

    await this.persistRelationships(target, mergeOutcome.merged);

    const history = await this.loadHistory();
    history.push(result);
    await this.saveHistory(history);

    return result;
  }

  async simulateDiscovery(
    targetId: string,
    seedSubdomains: string[],
  ): Promise<DiscoveryResult> {
    const target = await this.getTarget(targetId);
    if (!target) {
      return this.buildEmptyResult(targetId, '', []);
    }

    const startedAt = Date.now();
    const now = startedAt;
    const errors: string[] = [];
    const subdomainSet = new Set<string>();
    const collected: DiscoveredAsset[] = [];

    const domainAsset = this.buildDomainAsset(target, now);
    collected.push(domainAsset);

    for (const seed of seedSubdomains) {
      const cleaned = seed.trim().toLowerCase();
      if (!cleaned) continue;
      subdomainSet.add(cleaned);
      collected.push(this.buildSubdomainAsset(target.rootDomain, cleaned, target.id, now, 'wordlist'));
    }

    const shodan = await this.runShodanLookup(target.rootDomain);
    for (const ip of shodan.ips) {
      collected.push(
        this.buildIpAsset(target.rootDomain, ip, target.id, now, 'shodan', shodan.ports, shodan.technologies),
      );
    }

    const whois = await this.runWhois(target.rootDomain);
    domainAsset.metadata = { ...domainAsset.metadata, whois };

    const mergeOutcome = await this.mergeDiscoveredAssets(target, collected);
    const completedAt = Date.now();

    const assetsByType = this.emptyAssetsByType();
    for (const a of mergeOutcome.merged) {
      assetsByType[a.type] = (assetsByType[a.type] ?? 0) + 1;
    }

    const result: DiscoveryResult = {
      targetId: target.id,
      targetDomain: target.rootDomain,
      startedAt,
      completedAt,
      durationMs: completedAt - startedAt,
      methodsRun: ['wordlist', 'shodan', 'whois'],
      assetsDiscovered: collected.length,
      assetsByType,
      subdomainsFound: Array.from(subdomainSet),
      newAssets: mergeOutcome.newCount,
      updatedAssets: mergeOutcome.updatedCount,
      errors,
    };

    await this.updateTarget(target.id, {
      lastDiscoveryRun: completedAt,
      totalAssets: mergeOutcome.merged.length,
    });

    await this.persistRelationships(target, mergeOutcome.merged);

    const history = await this.loadHistory();
    history.push(result);
    await this.saveHistory(history);

    return result;
  }

  async getRelationships(assetId: string): Promise<AssetRelationship[]> {
    const all = await this.loadRelationships();
    return all.filter((r) => r.sourceAssetId === assetId || r.targetAssetId === assetId);
  }

  async getSubdomains(rootDomain: string): Promise<DiscoveredAsset[]> {
    const rd = rootDomain.toLowerCase();
    const assets = await this.loadAssets();
    return assets.filter((a) => a.type === 'subdomain' && a.rootDomain.toLowerCase() === rd);
  }

  async getAssetGraph(rootDomain: string): Promise<{
    nodes: DiscoveredAsset[];
    edges: AssetRelationship[];
  }> {
    const rd = rootDomain.toLowerCase();
    const assets = await this.loadAssets();
    const nodes = assets.filter((a) => a.rootDomain.toLowerCase() === rd);
    const nodeIds = new Set(nodes.map((n) => n.id));
    const allRels = await this.loadRelationships();
    const edges = allRels.filter(
      (r) => nodeIds.has(r.sourceAssetId) && nodeIds.has(r.targetAssetId),
    );
    return { nodes, edges };
  }

  async getStats(): Promise<{
    totalAssets: number;
    byType: Record<AssetType, number>;
    byStatus: Record<AssetStatus, number>;
    byCloud: Record<string, number>;
    highRiskCount: number;
  }> {
    const assets = await this.loadAssets();
    const byType = this.emptyAssetsByType();
    const byStatus = this.emptyStatusMap();
    const byCloud: Record<string, number> = {};
    let highRiskCount = 0;

    for (const a of assets) {
      byType[a.type] = (byType[a.type] ?? 0) + 1;
      byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
      if (a.cloudProvider) {
        const cp = a.cloudProvider;
        byCloud[cp] = (byCloud[cp] ?? 0) + 1;
      }
      if (a.riskScore >= 70) highRiskCount++;
    }

    return {
      totalAssets: assets.length,
      byType,
      byStatus,
      byCloud,
      highRiskCount,
    };
  }

  private async runMethod(
    target: DiscoveryTarget,
    method: DiscoveryMethod,
  ): Promise<DiscoveredAsset[]> {
    const now = Date.now();
    const domain = target.rootDomain;
    const assets: DiscoveredAsset[] = [];

    const domainAsset = this.buildDomainAsset(target, now);
    assets.push(domainAsset);

    switch (method) {
      case 'dns_enum':
      case 'wordlist': {
        const subs = await this.runDnsEnum(domain);
        for (const s of subs) {
          assets.push(this.buildSubdomainAsset(domain, s, target.id, now, method));
        }
        break;
      }
      case 'certificate_transparency': {
        const subs = await this.runCertificateTransparency(domain);
        for (const s of subs) {
          assets.push(this.buildSubdomainAsset(domain, s, target.id, now, method));
        }
        break;
      }
      case 'shodan':
      case 'censys': {
        const data = await this.runShodanLookup(domain);
        for (const ip of data.ips) {
          assets.push(
            this.buildIpAsset(domain, ip, target.id, now, method, data.ports, data.technologies),
          );
        }
        for (const port of data.ports) {
          assets.push(this.buildPortAsset(domain, port, target.id, now, method));
        }
        break;
      }
      case 'whois': {
        const whois = await this.runWhois(domain);
        domainAsset.metadata = { ...domainAsset.metadata, whois };
        domainAsset.discoveryMethods = Array.from(
          new Set<DiscoveryMethod>([...domainAsset.discoveryMethods, method]),
        );
        break;
      }
      case 'asn_lookup': {
        const asnValue = 15169 + (this.simpleHash(domain) % 60000);
        const asnAsset: DiscoveredAsset = {
          id: this.generateId(),
          type: 'asn',
          value: `AS${asnValue}`,
          parentAssetId: null,
          rootDomain: domain.toLowerCase(),
          status: 'active',
          firstSeen: now,
          lastSeen: now,
          lastScanned: now,
          discoveryMethods: [method],
          confidence: 0.7,
          riskScore: 0,
          riskFactors: [],
          technologies: [],
          ports: [],
          protocols: [],
          certificates: [],
          metadata: { targetId: target.id, asn: asnValue },
          tags: ['asn'],
          monitored: false,
          country: null,
          asn: asnValue,
          asnOrganization: target.organization,
          cloudProvider: null,
        };
        assets.push(asnAsset);
        break;
      }
      case 'web_crawler':
      case 'search_engine':
      case 'manual': {
        const subs = await this.runDnsEnum(domain);
        const first = subs[0];
        if (first) {
          assets.push(this.buildSubdomainAsset(domain, first, target.id, now, method));
        }
        break;
      }
    }

    for (const a of assets) {
      a.riskScore = this.computeRiskScore(a);
    }
    return assets;
  }

  private async runDnsEnum(domain: string): Promise<string[]> {
    const seed = this.simpleHash(domain);
    const count = 4 + (seed % 6);
    const out: string[] = [];
    const seen = new Set<string>();
    let cursor = seed;
    while (out.length < count) {
      const word = SUBDOMAIN_WORDLIST[cursor % SUBDOMAIN_WORDLIST.length];
      cursor += 7;
      if (!word) continue;
      const value = `${word}.${domain}`;
      if (!seen.has(value)) {
        seen.add(value);
        out.push(value);
      }
      if (cursor > seed + 200) break;
    }
    return out;
  }

  private async runCertificateTransparency(domain: string): Promise<string[]> {
    const subs = await this.runDnsEnum(domain);
    return subs;
  }

  private async runShodanLookup(domain: string): Promise<{
    ips: string[];
    ports: number[];
    technologies: string[];
  }> {
    const seed = this.simpleHash(domain);
    const ips: string[] = [];
    const portPool = [80, 443, 22, 3389, 8080, 8443, 25, 21, 23, 445];
    const techPool = ['nginx', 'apache', 'cloudflare', 'iis', 'tomcat', 'wordpress', 'aws-elb'];

    for (let i = 0; i < 2; i++) {
      const a = ((seed >> (i * 3)) & 0xff) % 250;
      const b = ((seed * (i + 3)) & 0xff) % 250;
      const c = ((seed * (i + 5)) & 0xff) % 250;
      const d = ((seed * (i + 7)) & 0xff) % 250;
      ips.push(`${a + 1}.${b}.${c}.${d}`);
    }

    const ports: number[] = [];
    for (let i = 0; i < 4; i++) {
      const p = portPool[(seed + i * 5) % portPool.length];
      if (p !== undefined && !ports.includes(p)) ports.push(p);
    }

    const technologies: string[] = [];
    for (let i = 0; i < 3; i++) {
      const t = techPool[(seed + i * 11) % techPool.length];
      if (t && !technologies.includes(t)) technologies.push(t);
    }

    return { ips, ports, technologies };
  }

  private async runWhois(domain: string): Promise<{ registrar: string; organization: string }> {
    const seed = this.simpleHash(domain);
    const registrars = ['MarkMonitor', 'GoDaddy', 'Namecheap', 'Gandi', 'Tucows'];
    const registrar = registrars[seed % registrars.length] ?? 'Unknown';
    const labels = domain.split('.');
    const organization = labels.length >= 2 ? (labels[labels.length - 2] ?? domain) : domain;
    return { registrar, organization };
  }

  private inferCloudProvider(ips: string[]): CloudProvider {
    for (const ip of ips) {
      for (const entry of CLOUD_IP_PREFIXES) {
        if (ip.startsWith(entry.prefix)) {
          return entry.provider;
        }
      }
    }
    return null;
  }

  private computeRiskScore(asset: DiscoveredAsset): number {
    let score = 0;
    const factors: string[] = [];
    const exposedPorts = new Set<number>([22, 23, 445, 3389]);
    if (asset.ports.some((p) => exposedPorts.has(p))) {
      score += 25;
      factors.push('internet-exposed-risky-port');
    }
    if (
      asset.technologies.some((t) => KNOWN_VULNERABLE_TECH.has(t.toLowerCase()))
    ) {
      score += 15;
      factors.push('known-vulnerable-technology');
    }
    if (!asset.technologies.some((t) => WAF_CDN_TECH.has(t.toLowerCase()))) {
      score += 20;
      factors.push('no-waf-or-cdn-detected');
    }
    if (asset.type === 'cloud_resource') {
      score += 20;
      factors.push('cloud-resource-directly-exposed');
    }
    const now = Date.now();
    if (asset.certificates.some((c) => c.validTo < now)) {
      score += 15;
      factors.push('expired-or-old-tls-certificate');
    }
    if (asset.asn !== null && HIGH_RISK_ASN.has(asset.asn)) {
      score += 10;
      factors.push('high-abuse-asn');
    }
    return Math.min(100, score);
  }

  private generateId(): string {
    return `easm_${randomUUID()}`;
  }

  private simpleHash(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
  }

  private emptyAssetsByType(): Record<AssetType, number> {
    const out = {} as Record<AssetType, number>;
    for (const t of ASSET_TYPES) out[t] = 0;
    return out;
  }

  private emptyStatusMap(): Record<AssetStatus, number> {
    const out = {} as Record<AssetStatus, number>;
    for (const s of STATUSES) out[s] = 0;
    return out;
  }

  private buildEmptyResult(
    targetId: string,
    targetDomain: string,
    methodsRun: DiscoveryMethod[],
  ): DiscoveryResult {
    const now = Date.now();
    return {
      targetId,
      targetDomain,
      startedAt: now,
      completedAt: now,
      durationMs: 0,
      methodsRun,
      assetsDiscovered: 0,
      assetsByType: this.emptyAssetsByType(),
      subdomainsFound: [],
      newAssets: 0,
      updatedAssets: 0,
      errors: ['target-not-found'],
    };
  }

  private buildDomainAsset(target: DiscoveryTarget, now: number): DiscoveredAsset {
    return {
      id: this.generateId(),
      type: 'domain',
      value: target.rootDomain.toLowerCase(),
      parentAssetId: null,
      rootDomain: target.rootDomain.toLowerCase(),
      status: 'active',
      firstSeen: now,
      lastSeen: now,
      lastScanned: now,
      discoveryMethods: ['manual'],
      confidence: 1,
      riskScore: 0,
      riskFactors: [],
      technologies: [],
      ports: [],
      protocols: [],
      certificates: [],
      metadata: { targetId: target.id, organization: target.organization },
      tags: ['root-domain'],
      monitored: true,
      country: null,
      asn: null,
      asnOrganization: null,
      cloudProvider: null,
    };
  }

  private buildSubdomainAsset(
    rootDomain: string,
    value: string,
    targetId: string,
    now: number,
    method: DiscoveryMethod,
  ): DiscoveredAsset {
    return {
      id: this.generateId(),
      type: 'subdomain',
      value: value.toLowerCase(),
      parentAssetId: null,
      rootDomain: rootDomain.toLowerCase(),
      status: 'active',
      firstSeen: now,
      lastSeen: now,
      lastScanned: now,
      discoveryMethods: [method],
      confidence: 0.8,
      riskScore: 0,
      riskFactors: [],
      technologies: [],
      ports: [],
      protocols: [],
      certificates: [],
      metadata: { targetId },
      tags: ['subdomain'],
      monitored: false,
      country: null,
      asn: null,
      asnOrganization: null,
      cloudProvider: null,
    };
  }

  private buildIpAsset(
    rootDomain: string,
    ip: string,
    targetId: string,
    now: number,
    method: DiscoveryMethod,
    ports: number[],
    technologies: string[],
  ): DiscoveredAsset {
    const protocols: string[] = [];
    if (ports.includes(443)) protocols.push('https');
    if (ports.includes(80)) protocols.push('http');
    if (ports.includes(22)) protocols.push('ssh');
    if (ports.includes(3389)) protocols.push('rdp');
    return {
      id: this.generateId(),
      type: 'ip',
      value: ip,
      parentAssetId: null,
      rootDomain: rootDomain.toLowerCase(),
      status: 'active',
      firstSeen: now,
      lastSeen: now,
      lastScanned: now,
      discoveryMethods: [method],
      confidence: 0.9,
      riskScore: 0,
      riskFactors: [],
      technologies: [...technologies],
      ports: [...ports],
      protocols,
      certificates: [],
      metadata: { targetId },
      tags: ['ip'],
      monitored: false,
      country: null,
      asn: null,
      asnOrganization: null,
      cloudProvider: this.inferCloudProvider([ip]),
    };
  }

  private buildPortAsset(
    rootDomain: string,
    port: number,
    targetId: string,
    now: number,
    method: DiscoveryMethod,
  ): DiscoveredAsset {
    return {
      id: this.generateId(),
      type: 'port',
      value: String(port),
      parentAssetId: null,
      rootDomain: rootDomain.toLowerCase(),
      status: 'active',
      firstSeen: now,
      lastSeen: now,
      lastScanned: now,
      discoveryMethods: [method],
      confidence: 0.9,
      riskScore: 0,
      riskFactors: [],
      technologies: [],
      ports: [port],
      protocols: [],
      certificates: [],
      metadata: { targetId, port },
      tags: ['port'],
      monitored: false,
      country: null,
      asn: null,
      asnOrganization: null,
      cloudProvider: null,
    };
  }

  private async mergeDiscoveredAssets(
    target: DiscoveryTarget,
    collected: DiscoveredAsset[],
  ): Promise<{
    merged: DiscoveredAsset[];
    newCount: number;
    updatedCount: number;
  }> {
    const allAssets = await this.loadAssets();
    const others = allAssets.filter((a) => a.rootDomain.toLowerCase() !== target.rootDomain.toLowerCase());
    const targetAssets = allAssets.filter(
      (a) => a.rootDomain.toLowerCase() === target.rootDomain.toLowerCase(),
    );
    const targetKeyMap = new Map<string, number>();
    targetAssets.forEach((a, idx) => {
      targetKeyMap.set(this.assetKey(a), idx);
    });

    const merged = [...targetAssets];
    let newCount = 0;
    let updatedCount = 0;
    const now = Date.now();

    for (const incoming of collected) {
      const key = this.assetKey(incoming);
      const existingIdx = targetKeyMap.get(key);
      if (existingIdx === undefined) {
        merged.push(incoming);
        newCount++;
      } else {
        const existing = merged[existingIdx] as DiscoveredAsset;
        const methodSet = new Set<DiscoveryMethod>([
          ...existing.discoveryMethods,
          ...incoming.discoveryMethods,
        ]);
        const updated: DiscoveredAsset = {
          ...existing,
          ...incoming,
          id: existing.id,
          firstSeen: existing.firstSeen,
          lastSeen: now,
          lastScanned: now,
          discoveryMethods: Array.from(methodSet),
          parentAssetId: existing.parentAssetId,
        };
        updated.riskScore = this.computeRiskScore(updated);
        merged[existingIdx] = updated;
        updatedCount++;
      }
    }

    await this.saveAssets([...others, ...merged]);
    return { merged, newCount, updatedCount };
  }

  private assetKey(asset: DiscoveredAsset): string {
    return `${asset.type}:${asset.value.toLowerCase()}`;
  }

  private async persistRelationships(
    target: DiscoveryTarget,
    assets: DiscoveredAsset[],
  ): Promise<void> {
    const rootAsset = assets.find(
      (a) => a.type === 'domain' && a.rootDomain.toLowerCase() === target.rootDomain.toLowerCase(),
    );
    if (!rootAsset) return;

    const subdomainAssets = assets.filter(
      (a) => a.type === 'subdomain' && a.rootDomain.toLowerCase() === target.rootDomain.toLowerCase(),
    );
    if (subdomainAssets.length === 0) return;

    const allRels = await this.loadRelationships();
    const relKeys = new Set(
      allRels.map(
        (r) => `${r.sourceAssetId}|${r.targetAssetId}|${r.relationship}`,
      ),
    );
    const now = Date.now();
    let added = false;
    for (const sub of subdomainAssets) {
      const key = `${sub.id}|${rootAsset.id}|subdomain_of`;
      if (!relKeys.has(key)) {
        allRels.push({
          sourceAssetId: sub.id,
          targetAssetId: rootAsset.id,
          relationship: 'subdomain_of',
          discoveredAt: now,
        });
        added = true;
      }
    }
    if (added) await this.saveRelationships(allRels);
  }
}