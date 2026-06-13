import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type ExposureSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ExposureStatus = 'open' | 'closed' | 'filtered' | 'unknown';
export type ExposureCategory =
  | 'open_port'
  | 'exposed_service'
  | 'vulnerable_tech'
  | 'cloud_storage'
  | 'leaked_code'
  | 'exposed_admin'
  | 'misconfig'
  | 'expired_cert'
  | 'weak_crypto'
  | 'info_disclosure'
  | 'shadow_it'
  | 'default_credentials';
export type RemediationStatus = 'new' | 'in_progress' | 'fixed' | 'accepted' | 'false_positive';

export interface Exposure {
  id: string;
  category: ExposureCategory;
  severity: ExposureSeverity;
  status: ExposureStatus;
  title: string;
  description: string;
  affectedAssetId: string;
  affectedAssetValue: string;
  evidence: string[];
  cvssScore: number | null;
  cvssVector: string | null;
  cveIds: string[];
  exploitAvailable: boolean;
  inTheWild: boolean;
  firstDetected: number;
  lastDetected: number;
  detectionCount: number;
  remediation: string;
  remediationSteps: string[];
  remediationStatus: RemediationStatus;
  remediationOwner: string | null;
  remediationDeadline: number | null;
  references: string[];
  tags: string[];
  metadata: Record<string, unknown>;
  assignedTo: string | null;
}

export interface ExposureScan {
  id: string;
  targetId: string;
  rootDomain: string;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  exposuresFound: number;
  bySeverity: Record<ExposureSeverity, number>;
  byCategory: Record<ExposureCategory, number>;
  assetsScanned: number;
  errors: string[];
}

export interface ExposureRule {
  id: string;
  name: string;
  description: string;
  category: ExposureCategory;
  severity: ExposureSeverity;
  check: (asset: {
    type: string;
    value: string;
    ports: number[];
    technologies: string[];
    metadata: Record<string, any>;
  }) => Exposure | null;
}

export interface ScanOptions {
  categories?: ExposureCategory[];
}

export interface ExposureFilters {
  targetId?: string;
  category?: ExposureCategory;
  severity?: ExposureSeverity;
  status?: RemediationStatus;
  assignedTo?: string;
  since?: number;
  limit?: number;
}

export interface ScanFilters {
  targetId?: string;
  status?: string;
  limit?: number;
}

export interface ExposureScannerStats {
  totalExposures: number;
  bySeverity: Record<ExposureSeverity, number>;
  byCategory: Record<ExposureCategory, number>;
  byRemediationStatus: Record<RemediationStatus, number>;
  byExploitAvailability: { available: number; inTheWild: number };
  averageDetectionAge: number;
}

const EXPOSURE_STORE_KEY = 'easm/exposures.json';
const SCAN_STORE_KEY = 'easm/scans.json';
const RULE_STORE_KEY = 'easm/exposure-rules.json';

const SEVERITY_LEVELS: ExposureSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
const CATEGORY_KEYS: ExposureCategory[] = [
  'open_port',
  'exposed_service',
  'vulnerable_tech',
  'cloud_storage',
  'leaked_code',
  'exposed_admin',
  'misconfig',
  'expired_cert',
  'weak_crypto',
  'info_disclosure',
  'shadow_it',
  'default_credentials',
];
const REMEDIATION_KEYS: RemediationStatus[] = ['new', 'in_progress', 'fixed', 'accepted', 'false_positive'];

function emptySeverityMap(): Record<ExposureSeverity, number> {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

function emptyCategoryMap(): Record<ExposureCategory, number> {
  const m = {} as Record<ExposureCategory, number>;
  for (const k of CATEGORY_KEYS) m[k] = 0;
  return m;
}

function emptyRemediationMap(): Record<RemediationStatus, number> {
  return { new: 0, in_progress: 0, fixed: 0, accepted: 0, false_positive: 0 };
}

function normalizeSeverityMap(input: Partial<Record<ExposureSeverity, number>> | undefined): Record<ExposureSeverity, number> {
  const base = emptySeverityMap();
  if (!input) return base;
  for (const key of SEVERITY_LEVELS) {
    if (typeof input[key] === 'number') base[key] = input[key]!;
  }
  return base;
}

function normalizeCategoryMap(input: Partial<Record<ExposureCategory, number>> | undefined): Record<ExposureCategory, number> {
  const base = emptyCategoryMap();
  if (!input) return base;
  for (const key of CATEGORY_KEYS) {
    if (typeof input[key] === 'number') base[key] = input[key]!;
  }
  return base;
}

export class ExposureScannerService {
  private rules: Map<string, ExposureRule> = new Map();

  constructor(private store: JsonStore) {}

  private generateId(): string {
    return randomUUID();
  }

  async scanTarget(targetId: string, options: ScanOptions = {}): Promise<ExposureScan> {
    const startedAt = Date.now();
    const categories = options.categories && options.categories.length > 0 ? new Set(options.categories) : null;

    const scan: ExposureScan = {
      id: `scan_${this.generateId()}`,
      targetId,
      rootDomain: targetId,
      startedAt,
      completedAt: 0,
      durationMs: 0,
      status: 'running',
      exposuresFound: 0,
      bySeverity: emptySeverityMap(),
      byCategory: emptyCategoryMap(),
      assetsScanned: 0,
      errors: [],
    };

    const targetAssets = await this.resolveTargetAssets(targetId);

    let totalExposures = 0;
    const bySeverity = emptySeverityMap();
    const byCategory = emptyCategoryMap();

    for (const asset of targetAssets) {
      try {
        const found = this.runBuiltInChecks(asset);
        const custom = this.runCustomRules(asset);
        const all = [...found, ...custom];

        for (const exp of all) {
          if (categories && !categories.has(exp.category)) continue;
          exp.metadata = { ...(exp.metadata || {}), scanId: scan.id };
          await this.persistExposure(exp);
          bySeverity[exp.severity] = (bySeverity[exp.severity] || 0) + 1;
          byCategory[exp.category] = (byCategory[exp.category] || 0) + 1;
          totalExposures++;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        scan.errors.push(`${asset.value}: ${msg}`);
      }
      scan.assetsScanned++;
    }

    const completedAt = Date.now();
    scan.completedAt = completedAt;
    scan.durationMs = completedAt - startedAt;
    scan.exposuresFound = totalExposures;
    scan.bySeverity = bySeverity;
    scan.byCategory = byCategory;
    scan.status = scan.errors.length > 0 && totalExposures === 0 ? 'failed' : 'completed';

    await this.persistScan(scan);
    return scan;
  }

  async scanAsset(assetId: string): Promise<Exposure[]> {
    const asset = await this.resolveAsset(assetId);
    const builtIn = this.runBuiltInChecks(asset);
    const custom = this.runCustomRules(asset);
    const combined = [...builtIn, ...custom];

    for (const exposure of combined) {
      await this.persistExposure(exposure);
    }
    return combined;
  }

  async getExposure(exposureId: string): Promise<Exposure | null> {
    const exposures = await this.loadExposures();
    return exposures.find((e) => e.id === exposureId) ?? null;
  }

  async listExposures(filters: ExposureFilters = {}): Promise<Exposure[]> {
    const all = await this.loadExposures();
    let filtered = all;

    if (filters.targetId) {
      filtered = filtered.filter((e) => e.affectedAssetValue === filters.targetId || e.affectedAssetId === filters.targetId);
    }
    if (filters.category) {
      filtered = filtered.filter((e) => e.category === filters.category);
    }
    if (filters.severity) {
      filtered = filtered.filter((e) => e.severity === filters.severity);
    }
    if (filters.status) {
      filtered = filtered.filter((e) => e.remediationStatus === filters.status);
    }
    if (filters.assignedTo) {
      filtered = filtered.filter((e) => e.assignedTo === filters.assignedTo);
    }
    if (typeof filters.since === 'number') {
      filtered = filtered.filter((e) => e.lastDetected >= filters.since!);
    }

    filtered.sort((a, b) => {
      const sa = severityWeight(a.severity);
      const sb = severityWeight(b.severity);
      if (sa !== sb) return sb - sa;
      return b.lastDetected - a.lastDetected;
    });

    if (typeof filters.limit === 'number') {
      filtered = filtered.slice(0, filters.limit);
    }
    return filtered;
  }

  async updateRemediation(exposureId: string, status: RemediationStatus, owner?: string): Promise<boolean> {
    const exposures = await this.loadExposures();
    const idx = exposures.findIndex((e) => e.id === exposureId);
    if (idx === -1) return false;

    exposures[idx] = {
      ...exposures[idx],
      remediationStatus: status,
      remediationOwner: owner !== undefined ? owner : exposures[idx].remediationOwner,
      assignedTo: owner !== undefined ? owner : exposures[idx].assignedTo,
    };

    if (status === 'fixed') {
      exposures[idx].status = 'closed';
    }

    await this.store.set(EXPOSURE_STORE_KEY, exposures);
    return true;
  }

  async getScan(scanId: string): Promise<ExposureScan | null> {
    const scans = await this.loadScans();
    return scans.find((s) => s.id === scanId) ?? null;
  }

  async listScans(filters: ScanFilters = {}): Promise<ExposureScan[]> {
    const scans = await this.loadScans();
    let filtered = scans;

    if (filters.targetId) {
      filtered = filtered.filter((s) => s.targetId === filters.targetId);
    }
    if (filters.status) {
      filtered = filtered.filter((s) => s.status === filters.status);
    }
    filtered.sort((a, b) => b.startedAt - a.startedAt);

    if (typeof filters.limit === 'number') {
      filtered = filtered.slice(0, filters.limit);
    }
    return filtered;
  }

  registerRule(rule: Omit<ExposureRule, 'id'>): ExposureRule {
    const newRule: ExposureRule = {
      ...rule,
      id: `rule_${this.generateId()}`,
    };
    this.rules.set(newRule.id, newRule);
    void this.persistRules();
    return newRule;
  }

  listRules(): ExposureRule[] {
    return Array.from(this.rules.values());
  }

  async getStats(): Promise<ExposureScannerStats> {
    const exposures = await this.loadExposures();
    const bySeverity = emptySeverityMap();
    const byCategory = emptyCategoryMap();
    const byRemediationStatus = emptyRemediationMap();

    let available = 0;
    let inTheWild = 0;
    let totalAge = 0;
    const now = Date.now();

    for (const e of exposures) {
      bySeverity[e.severity] = (bySeverity[e.severity] || 0) + 1;
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
      byRemediationStatus[e.remediationStatus] = (byRemediationStatus[e.remediationStatus] || 0) + 1;
      if (e.exploitAvailable) available++;
      if (e.inTheWild) inTheWild++;
      if (e.firstDetected > 0) totalAge += Math.max(0, now - e.firstDetected);
    }

    const averageDetectionAge = exposures.length > 0 ? totalAge / exposures.length : 0;

    return {
      totalExposures: exposures.length,
      bySeverity,
      byCategory,
      byRemediationStatus,
      byExploitAvailability: { available, inTheWild },
      averageDetectionAge,
    };
  }

  async getTopRiskyExposures(limit: number = 10): Promise<Exposure[]> {
    const exposures = await this.loadExposures();
    const scored = exposures.map((e) => ({ e, score: riskScore(e) }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.e);
  }

  private runBuiltInChecks(asset: {
    type: string;
    value: string;
    ports: number[];
    technologies: string[];
    metadata: Record<string, any>;
  }): Exposure[] {
    const out: Exposure[] = [];
    const ports = asset.ports || [];
    const techs = (asset.technologies || []).map((t) => t.toLowerCase());
    const meta = asset.metadata || {};

    if (ports.includes(22)) {
      out.push(this.buildExposure(asset, {
        category: 'open_port',
        severity: 'medium',
        title: 'SSH exposed to the internet',
        description: `Port 22 (SSH) is reachable on ${asset.value}. Restrict SSH access to known management networks or bastion hosts.`,
        evidence: [`${asset.value}:22`],
        remediation: 'Restrict SSH access via firewall, VPN, or bastion. Disable password auth and enforce key-based authentication.',
        remediationSteps: [
          'Restrict port 22 to a bastion or VPN range',
          'Disable password authentication',
          'Enforce key-based auth and MFA',
          'Move SSH to a non-default port if necessary',
        ],
        references: ['https://www.cisecurity.org/controls/'],
        tags: ['ssh', 'remote-access'],
      }));
    }

    if (ports.includes(3389)) {
      out.push(this.buildExposure(asset, {
        category: 'open_port',
        severity: 'high',
        title: 'RDP exposed to the internet',
        description: `Port 3389 (RDP) is reachable on ${asset.value}. RDP exposure is a top ransomware vector.`,
        evidence: [`${asset.value}:3389`],
        cvssScore: 9.8,
        cvssVector: 'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
        cveIds: ['CVE-2019-0708'],
        exploitAvailable: true,
        inTheWild: true,
        remediation: 'Restrict RDP behind VPN or Zero Trust Network Access. Enable NLA and account lockout policies.',
        remediationSteps: [
          'Block 3389 at the perimeter firewall',
          'Place RDP behind a VPN gateway',
          'Enable Network Level Authentication',
          'Apply account lockout and MFA',
        ],
        references: ['https://msrc.microsoft.com/update-guide/vulnerability/CVE-2019-0708'],
        tags: ['rdp', 'remote-access', 'ransomware'],
      }));
    }

    if (ports.includes(23)) {
      out.push(this.buildExposure(asset, {
        category: 'open_port',
        severity: 'high',
        title: 'Telnet exposed to the internet',
        description: `Port 23 (Telnet) is reachable on ${asset.value}. Telnet transmits credentials in clear text.`,
        evidence: [`${asset.value}:23`],
        cvssScore: 7.5,
        cvssVector: 'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N',
        remediation: 'Disable Telnet and replace with SSH. Block port 23 at the firewall.',
        remediationSteps: [
          'Disable the Telnet daemon',
          'Block port 23 at the firewall',
          'Use SSH with key-based authentication',
        ],
        references: ['https://datatracker.ietf.org/doc/html/rfc854'],
        tags: ['telnet', 'cleartext'],
      }));
    }

    if (ports.includes(445)) {
      out.push(this.buildExposure(asset, {
        category: 'open_port',
        severity: 'high',
        title: 'SMB exposed to the internet',
        description: `Port 445 (SMB) is reachable on ${asset.value}. SMB exposure enables ransomware, worms, and credential theft.`,
        evidence: [`${asset.value}:445`],
        cvssScore: 9.8,
        cveIds: ['CVE-2017-0144', 'CVE-2020-0796'],
        exploitAvailable: true,
        inTheWild: true,
        remediation: 'Block SMB at the perimeter. Disable SMBv1. Require SMB signing.',
        remediationSteps: [
          'Block 445/139 at the internet edge',
          'Disable SMBv1 everywhere',
          'Require SMB signing',
          'Patch EternalBlue-class vulnerabilities',
        ],
        references: ['https://msrc.microsoft.com/update-guide/vulnerability/CVE-2017-0144'],
        tags: ['smb', 'ransomware', 'wormable'],
      }));
    }

    if (ports.includes(27017)) {
      out.push(this.buildExposure(asset, {
        category: 'exposed_service',
        severity: 'critical',
        title: 'MongoDB exposed to the internet',
        description: `Port 27017 (MongoDB) is reachable on ${asset.value}. Unauthenticated MongoDB instances are commonly wiped or ransomed.`,
        evidence: [`${asset.value}:27017`],
        cvssScore: 9.8,
        exploitAvailable: true,
        inTheWild: true,
        remediation: 'Bind MongoDB to localhost or a private interface. Enable authentication and TLS.',
        remediationSteps: [
          'Bind MongoDB to internal interface only',
          'Enable authentication (--auth)',
          'Configure TLS for client connections',
          'Restrict network access via firewall / security group',
        ],
        references: ['https://www.mongodb.com/docs/manual/security/'],
        tags: ['mongodb', 'nosql', 'ransomware'],
      }));
    }

    if (ports.includes(6379)) {
      out.push(this.buildExposure(asset, {
        category: 'exposed_service',
        severity: 'critical',
        title: 'Redis exposed to the internet',
        description: `Port 6379 (Redis) is reachable on ${asset.value}. Public Redis allows full RCE via CONFIG/SLAVEOF abuse.`,
        evidence: [`${asset.value}:6379`],
        cvssScore: 9.8,
        exploitAvailable: true,
        inTheWild: true,
        remediation: 'Bind Redis to 127.0.0.1. Require AUTH and TLS. Disable dangerous commands.',
        remediationSteps: [
          'Bind Redis to 127.0.0.1 or private interface',
          'Set requirepass and enable ACLs',
          'Enable TLS via --tls-port',
          'Disable or rename CONFIG, SLAVEOF, MODULE',
        ],
        references: ['https://redis.io/docs/manual/security/'],
        tags: ['redis', 'rce'],
      }));
    }

    const exposedGit = meta.exposedGit === true || asset.value.includes('/.git') || meta.paths?.includes?.('.git/HEAD');
    if (exposedGit) {
      out.push(this.buildExposure(asset, {
        category: 'leaked_code',
        severity: 'high',
        title: '.git directory exposed',
        description: `The .git directory appears to be exposed on ${asset.value}. Source code, secrets, and history may be downloadable.`,
        evidence: [`https://${stripProto(asset.value)}/.git/HEAD`],
        cvssScore: 7.5,
        exploitAvailable: true,
        remediation: 'Block access to .git via web server configuration. Reinstall from a clean source if exposure is confirmed.',
        remediationSteps: [
          'Block /.git/* in the web server config',
          'Audit repository for leaked secrets',
          'Rotate any credentials committed to history',
          'Re-deploy from a clean source tree',
        ],
        references: ['https://en.internetwache.org/dont-publicly-expose-git-or-how-we-downloaded-your-websites-sourcecode-29-03-2015/'],
        tags: ['git', 'leaked-code', 'source-disclosure'],
      }));
    }

    const exposedEnv = meta.exposedEnv === true || meta.paths?.includes?.('.env');
    if (exposedEnv) {
      out.push(this.buildExposure(asset, {
        category: 'leaked_code',
        severity: 'critical',
        title: '.env file exposed',
        description: `A .env file is publicly accessible on ${asset.value}. Environment variables frequently contain secrets and API keys.`,
        evidence: [`https://${stripProto(asset.value)}/.env`],
        cvssScore: 9.1,
        cvssVector: 'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N',
        exploitAvailable: true,
        inTheWild: true,
        remediation: 'Block .env at the web server. Rotate every secret that was present in the file.',
        remediationSteps: [
          'Block /.env in the web server configuration',
          'Rotate all secrets stored in the file',
          'Audit logs for prior access',
          'Move secrets to a managed secrets store',
        ],
        references: ['https://owasp.org/www-community/vulnerabilities/Information_exposure_through_directory_listing'],
        tags: ['env', 'secrets', 'leaked-code'],
      }));
    }

    if (techs.some((t) => t.includes('wordpress'))) {
      out.push(this.buildExposure(asset, {
        category: 'vulnerable_tech',
        severity: 'medium',
        title: 'WordPress detected',
        description: `WordPress detected on ${asset.value}. WordPress plugins and core versions are a top source of compromise.`,
        evidence: [`https://${stripProto(asset.value)}/wp-login.php`],
        cvssScore: 6.1,
        remediation: 'Keep WordPress core and plugins up to date. Hide version disclosure. Enable WAF rules.',
        remediationSteps: [
          'Update WordPress core to the latest release',
          'Update all plugins and themes',
          'Remove unused plugins/themes',
          'Deploy a WAF rule set for WordPress',
          'Hide the WordPress version header',
        ],
        references: ['https://wordpress.org/about/security/'],
        tags: ['wordpress', 'cms'],
      }));
    }

    const tomcatManager = meta.exposedPaths?.includes?.('/manager/html') || meta.tomcatManager === true;
    if (tomcatManager) {
      out.push(this.buildExposure(asset, {
        category: 'exposed_admin',
        severity: 'critical',
        title: 'Tomcat manager exposed',
        description: `Apache Tomcat manager (/manager/html) appears exposed on ${asset.value}.`,
        evidence: [`https://${stripProto(asset.value)}/manager/html`],
        cvssScore: 9.8,
        exploitAvailable: true,
        inTheWild: true,
        remediation: 'Restrict /manager/html to internal networks. Require strong credentials and rotate them.',
        remediationSteps: [
          'Restrict /manager/* to internal IPs in web.xml or RemoteAddrValve',
          'Rotate manager credentials',
          'Remove the manager app if not needed',
          'Enable HTTPS for the manager',
        ],
        references: ['https://tomcat.apache.org/tomcat-9.0-doc/manager-howto.html'],
        tags: ['tomcat', 'admin', 'rce'],
      }));
    }

    if (ports.includes(8080) && (meta.jenkinsDetected === true || techs.some((t) => t.includes('jenkins')))) {
      out.push(this.buildExposure(asset, {
        category: 'exposed_admin',
        severity: 'high',
        title: 'Jenkins exposed to the internet',
        description: `Jenkins detected on port 8080 at ${asset.value}. Jenkins often has Groovy script console RCE if exposed.`,
        evidence: [`http://${stripProto(asset.value)}:8080/jenkins`],
        cvssScore: 9.8,
        exploitAvailable: true,
        inTheWild: true,
        remediation: 'Place Jenkins behind VPN. Enforce authentication on the script console and rotate credentials.',
        remediationSteps: [
          'Restrict port 8080 to internal networks',
          'Enable authentication matrix-based security',
          'Restrict the script console to admins',
          'Patch Jenkins and plugins',
        ],
        references: ['https://www.jenkins.io/security/'],
        tags: ['jenkins', 'ci', 'rce'],
      }));
    }

    const isS3 = (asset.type === 'cloud_storage' || meta.provider === 'aws') && /s3/.test(String(meta.service || asset.value));
    const publicBucket = isS3 && (meta.publicRead === true || meta.publicWrite === true || meta.acl === 'public-read' || meta.acl === 'public-read-write');
    if (publicBucket) {
      out.push(this.buildExposure(asset, {
        category: 'cloud_storage',
        severity: 'critical',
        title: 'AWS S3 bucket publicly accessible',
        description: `S3 bucket ${asset.value} allows public read/write. Sensitive data may be exposed or exfiltrated.`,
        evidence: [`https://${stripProto(asset.value)}.s3.amazonaws.com/`, meta.acl ? `acl:${meta.acl}` : 'policy:public'],
        cvssScore: 9.1,
        inTheWild: true,
        remediation: 'Disable public access on the bucket. Apply least-privilege IAM and bucket policies. Enable Block Public Access.',
        remediationSteps: [
          'Enable S3 Block Public Access at the account level',
          'Apply a private bucket policy',
          'Audit bucket contents for sensitive data',
          'Enable S3 server access logging and CloudTrail',
        ],
        references: ['https://docs.aws.amazon.com/AmazonS3/latest/userguide/access-control-best-practices.html'],
        tags: ['aws', 's3', 'cloud-storage', 'data-exposure'],
      }));
    }

    const isCloudFront = (asset.type === 'cloud_service' || meta.provider === 'aws') && /cloudfront/i.test(String(meta.service || asset.value));
    if (isCloudFront && meta.wafEnabled === false) {
      out.push(this.buildExposure(asset, {
        category: 'misconfig',
        severity: 'high',
        title: 'CloudFront distribution missing WAF',
        description: `CloudFront distribution ${asset.value} does not have AWS WAF attached.`,
        evidence: [`arn:aws:cloudfront::${meta.accountId || 'unknown'}:distribution/${meta.distributionId || asset.value}`],
        cvssScore: 7.5,
        remediation: 'Attach AWS WAF to the distribution with managed rule sets (SQLi, XSS, bad bots).',
        remediationSteps: [
          'Create or select an AWS WAF web ACL',
          'Attach the web ACL to the distribution',
          'Enable AWS managed rule sets',
          'Monitor WAF logs via Kinesis or S3',
        ],
        references: ['https://docs.aws.amazon.com/waf/latest/developerguide/cloudfront-features.html'],
        tags: ['aws', 'cloudfront', 'waf', 'misconfig'],
      }));
    }

    if (meta.certExpired === true || (typeof meta.certExpiresAt === 'number' && meta.certExpiresAt < Date.now())) {
      out.push(this.buildExposure(asset, {
        category: 'expired_cert',
        severity: 'high',
        title: 'Expired TLS certificate',
        description: `TLS certificate for ${asset.value} is expired or expired at ${new Date(meta.certExpiresAt || 0).toISOString()}.`,
        evidence: [asset.value],
        cvssScore: 7.4,
        cvssVector: 'AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N',
        remediation: 'Renew the certificate via your CA or ACM. Automate renewal to prevent recurrence.',
        remediationSteps: [
          'Issue a new certificate from a trusted CA',
          'Deploy the certificate to the endpoint',
          'Enable automated renewal',
          'Monitor certificate expiration',
        ],
        references: ['https://datatracker.ietf.org/doc/html/rfc5280'],
        tags: ['tls', 'certificate', 'expired'],
      }));
    }

    const outdatedTls = Array.isArray(meta.supportedTlsVersions) && meta.supportedTlsVersions.some((v: string) => v === 'TLSv1.0' || v === 'TLSv1.1' || v === 'TLS 1.0' || v === 'TLS 1.1');
    if (outdatedTls) {
      out.push(this.buildExposure(asset, {
        category: 'weak_crypto',
        severity: 'medium',
        title: 'Outdated TLS version supported',
        description: `${asset.value} supports TLS 1.0 or TLS 1.1, which are deprecated and vulnerable to known attacks.`,
        evidence: meta.supportedTlsVersions,
        cvssScore: 6.5,
        remediation: 'Disable TLS 1.0 and TLS 1.1. Require TLS 1.2 or higher with strong ciphers.',
        remediationSteps: [
          'Disable TLS 1.0 and 1.1 on the server',
          'Require TLS 1.2+ with modern cipher suites',
          'Test clients for compatibility',
          'Update documentation for clients',
        ],
        references: ['https://datatracker.ietf.org/doc/html/rfc8996'],
        tags: ['tls', 'weak-crypto', 'deprecated'],
      }));
    }

    const defaultCreds = meta.defaultCredentials === true || meta.creds?.['admin:admin'] === true || meta.creds?.['root:root'] === true;
    if (defaultCreds) {
      out.push(this.buildExposure(asset, {
        category: 'default_credentials',
        severity: 'critical',
        title: 'Default credentials detected',
        description: `Default credentials (e.g., admin/admin, root/root) detected on ${asset.value}.`,
        evidence: [asset.value],
        cvssScore: 9.8,
        exploitAvailable: true,
        inTheWild: true,
        remediation: 'Change default credentials immediately. Enforce a credential rotation policy.',
        remediationSteps: [
          'Change all default passwords',
          'Enforce strong password complexity',
          'Enable MFA on administrative accounts',
          'Audit authentication logs',
        ],
        references: ['https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_credentials'],
        tags: ['credentials', 'default-password', 'authentication'],
      }));
    }

    return out;
  }

  private runCustomRules(asset: any): Exposure[] {
    const out: Exposure[] = [];
    for (const rule of this.rules.values()) {
      try {
        const exp = rule.check(asset);
        if (exp) {
          exp.metadata = { ...(exp.metadata || {}), ruleId: rule.id };
          out.push(exp);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[ExposureScanner] Custom rule failed', rule.id, msg);
      }
    }
    return out;
  }

  private buildExposure(
    asset: { type: string; value: string; ports: number[]; technologies: string[]; metadata: Record<string, any> },
    fields: {
      category: ExposureCategory;
      severity: ExposureSeverity;
      title: string;
      description: string;
      evidence: string[];
      cvssScore?: number | null;
      cvssVector?: string | null;
      cveIds?: string[];
      exploitAvailable?: boolean;
      inTheWild?: boolean;
      remediation: string;
      remediationSteps: string[];
      references: string[];
      tags: string[];
    }
  ): Exposure {
    const now = Date.now();
    return {
      id: `exp_${this.generateId()}`,
      category: fields.category,
      severity: fields.severity,
      status: 'open',
      title: fields.title,
      description: fields.description,
      affectedAssetId: asset.metadata?.assetId || asset.value,
      affectedAssetValue: asset.value,
      evidence: fields.evidence,
      cvssScore: fields.cvssScore ?? null,
      cvssVector: fields.cvssVector ?? null,
      cveIds: fields.cveIds ?? [],
      exploitAvailable: fields.exploitAvailable ?? false,
      inTheWild: fields.inTheWild ?? false,
      firstDetected: now,
      lastDetected: now,
      detectionCount: 1,
      remediation: fields.remediation,
      remediationSteps: fields.remediationSteps,
      remediationStatus: 'new',
      remediationOwner: null,
      remediationDeadline: defaultDeadline(fields.severity, now),
      references: fields.references,
      tags: fields.tags,
      metadata: { assetType: asset.type },
      assignedTo: null,
    };
  }

  private async loadExposures(): Promise<Exposure[]> {
    const data = await this.store.get<Exposure[]>(EXPOSURE_STORE_KEY);
    return data ?? [];
  }

  private async loadScans(): Promise<ExposureScan[]> {
    const data = await this.store.get<ExposureScan[]>(SCAN_STORE_KEY);
    return (data ?? []).map((s) => ({
      ...s,
      bySeverity: normalizeSeverityMap(s.bySeverity),
      byCategory: normalizeCategoryMap(s.byCategory),
    }));
  }

  private async loadRules(): Promise<void> {
    const data = await this.store.get<ExposureRule[]>(RULE_STORE_KEY);
    if (Array.isArray(data)) {
      for (const r of data) this.rules.set(r.id, r);
    }
  }

  private async persistExposure(exposure: Exposure): Promise<void> {
    const all = await this.loadExposures();
    const existingIdx = all.findIndex((e) => dedupKey(e) === dedupKey(exposure));
    if (existingIdx !== -1) {
      const existing = all[existingIdx];
      all[existingIdx] = {
        ...existing,
        lastDetected: Date.now(),
        detectionCount: existing.detectionCount + 1,
        status: exposure.status,
      };
    } else {
      all.push(exposure);
    }
    await this.store.set(EXPOSURE_STORE_KEY, all);
  }

  private async persistScan(scan: ExposureScan): Promise<void> {
    const all = await this.loadScans();
    all.push(scan);
    await this.store.set(SCAN_STORE_KEY, all);
  }

  private async persistRules(): Promise<void> {
    const list = Array.from(this.rules.values());
    await this.store.set(RULE_STORE_KEY, list);
  }

  private async resolveTargetAssets(targetId: string): Promise<Array<{ type: string; value: string; ports: number[]; technologies: string[]; metadata: Record<string, any> }>> {
    const data = await this.store.get<any>(`assets/targets/${targetId}.json`);
    if (Array.isArray(data?.assets)) {
      return data.assets as Array<{ type: string; value: string; ports: number[]; technologies: string[]; metadata: Record<string, any> }>;
    }
    return [
      {
        type: 'domain',
        value: targetId,
        ports: [],
        technologies: [],
        metadata: { assetId: targetId },
      },
    ];
  }

  private async resolveAsset(assetId: string): Promise<{ type: string; value: string; ports: number[]; technologies: string[]; metadata: Record<string, any> }> {
    const data = await this.store.get<any>(`assets/${assetId}.json`);
    if (data) {
      return {
        type: data.type || data.info?.type || 'unknown',
        value: data.value || data.info?.name || assetId,
        ports: data.ports || data.config?.ports || [],
        technologies: data.technologies || (data.config?.software?.map((s: any) => s.name) ?? []),
        metadata: { ...(data.metadata || {}), assetId },
      };
    }
    return {
      type: 'unknown',
      value: assetId,
      ports: [],
      technologies: [],
      metadata: { assetId },
    };
  }
}

function severityWeight(severity: ExposureSeverity): number {
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

function riskScore(exposure: Exposure): number {
  let score = severityWeight(exposure.severity) * 10;
  if (typeof exposure.cvssScore === 'number') score += exposure.cvssScore;
  if (exposure.exploitAvailable) score += 5;
  if (exposure.inTheWild) score += 10;
  if (exposure.remediationStatus === 'new') score += 3;
  return score;
}

function defaultDeadline(severity: ExposureSeverity, from: number): number {
  switch (severity) {
    case 'critical':
      return from + 7 * 24 * 60 * 60 * 1000;
    case 'high':
      return from + 30 * 24 * 60 * 60 * 1000;
    case 'medium':
      return from + 90 * 24 * 60 * 60 * 1000;
    case 'low':
      return from + 180 * 24 * 60 * 60 * 1000;
    case 'info':
      return from + 365 * 24 * 60 * 60 * 1000;
    default:
      return from + 30 * 24 * 60 * 60 * 1000;
  }
}

function stripProto(value: string): string {
  return value.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function dedupKey(exposure: Exposure): string {
  return `${exposure.category}:${exposure.affectedAssetValue}:${exposure.title}`;
}