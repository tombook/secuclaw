import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type ComplianceFramework = 'GDPR' | 'PIPL' | 'CCPA' | 'HIPAA' | 'PCI_DSS' | 'SOX' | 'ISO_27001' | 'China_Data_Security_Law' | 'China_PIPL' | 'EU_Data_Act' | 'APPI' | 'LGPD' | 'other';
export type ViolationSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ViolationStatus = 'open' | 'acknowledged' | 'in_remediation' | 'resolved' | 'false_positive' | 'risk_accepted';

export interface ResidencyPolicy {
  id: string;
  name: string;
  description: string;
  framework: ComplianceFramework;
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted' | 'top_secret';
  allowedRegions: string[];
  blockedRegions: string[];
  allowedCountries: string[];
  blockedCountries: string[];
  dataTypes: string[];
  enforcementLevel: 'advisory' | 'warning' | 'blocking' | 'audit';
  active: boolean;
  createdAt: number;
  createdBy: string;
}

export interface ResidencyViolation {
  id: string;
  timestamp: number;
  policyId: string;
  policyName: string;
  framework: ComplianceFramework;
  severity: ViolationSeverity;
  status: ViolationStatus;
  assetId: string;
  assetName: string;
  assetType: string;
  dataType: string;
  classification: string;
  currentLocation: string;
  currentRegion: string;
  currentCountry: string | null;
  destinationLocation: string | null;
  destinationRegion: string | null;
  destinationCountry: string | null;
  description: string;
  evidence: string[];
  remediation: string[];
  remediationDeadline: number | null;
  resolvedAt: number | null;
  resolvedBy: string | null;
  notes: string;
  fine: string | null;
}

export interface ResidencyCheckResult {
  allowed: boolean;
  policy: ResidencyPolicy;
  violations: ResidencyViolation[];
  warnings: string[];
}

export interface ResidencyStats {
  totalPolicies: number;
  totalViolations: number;
  byFramework: Record<ComplianceFramework, number>;
  bySeverity: Record<ViolationSeverity, number>;
  byStatus: Record<ViolationStatus, number>;
  openViolations: number;
  criticalViolations: number;
  finesEstimate: number;
  byRegion: Record<string, number>;
}

const COUNTRY_TO_REGION: Record<string, string> = {
  CN: 'cn-north', HK: 'cn-east', MO: 'cn-east', TW: 'cn-east',
  US: 'us-east', CA: 'us-east', MX: 'us-east',
  GB: 'eu-west', DE: 'eu-west', FR: 'eu-west', IT: 'eu-west', ES: 'eu-west', NL: 'eu-west',
  JP: 'ap-northeast', KR: 'ap-northeast',
  SG: 'ap-southeast', AU: 'ap-southeast', IN: 'ap-southeast',
  AE: 'me-south', SA: 'me-south',
  BR: 'sa-east', AR: 'sa-east',
  ZA: 'af-south', EG: 'af-south',
};

export class DataResidencyChecker {
  constructor(private store: JsonStore) {}

  async createPolicy(policy: Omit<ResidencyPolicy, 'id' | 'createdAt'>): Promise<ResidencyPolicy> {
    const newPolicy: ResidencyPolicy = { ...policy, id: this.generateId('pol'), createdAt: Date.now() };
    const policies = await this.loadPolicies();
    policies.push(newPolicy);
    await this.store.set(STORE_KEYS.policies, policies);
    return newPolicy;
  }

  async updatePolicy(policyId: string, updates: Partial<ResidencyPolicy>): Promise<ResidencyPolicy | null> {
    const policies = await this.loadPolicies();
    const idx = policies.findIndex((p) => p.id === policyId);
    if (idx === -1) return null;
    policies[idx] = { ...policies[idx], ...updates };
    await this.store.set(STORE_KEYS.policies, policies);
    return policies[idx];
  }

  async getPolicy(policyId: string): Promise<ResidencyPolicy | null> {
    const policies = await this.loadPolicies();
    return policies.find((p) => p.id === policyId) || null;
  }

  async listPolicies(filters?: { framework?: ComplianceFramework; active?: boolean }): Promise<ResidencyPolicy[]> {
    let policies = await this.loadPolicies();
    if (filters?.framework) policies = policies.filter((p) => p.framework === filters.framework);
    if (filters?.active !== undefined) policies = policies.filter((p) => p.active === filters.active);
    return policies;
  }

  async deletePolicy(policyId: string): Promise<boolean> {
    const policies = await this.loadPolicies();
    const filtered = policies.filter((p) => p.id !== policyId);
    if (filtered.length === policies.length) return false;
    await this.store.set(STORE_KEYS.policies, filtered);
    return true;
  }

  async checkAccess(params: { assetId: string; assetName: string; assetType: string; dataType: string; classification: string; currentRegion: string; currentCountry: string | null; destinationRegion?: string; destinationCountry?: string }): Promise<ResidencyCheckResult> {
    const policies = await this.loadPolicies();
    const matched = policies.filter((p) => p.active && p.dataClassification === params.classification);
    const violations: ResidencyViolation[] = [];
    const warnings: string[] = [];
    let allowed = true;
    for (const policy of matched) {
      const violation = this.evaluatePolicy(policy, params);
      if (violation) {
        violations.push(violation);
        if (policy.enforcementLevel === 'blocking') allowed = false;
        if (policy.enforcementLevel === 'warning' || policy.enforcementLevel === 'audit') {
          warnings.push(`${policy.name}: ${violation.description}`);
        }
      }
    }
    if (violations.length > 0) {
      const all = await this.loadViolations();
      all.push(...violations);
      if (all.length > 10000) all.splice(0, all.length - 10000);
      await this.store.set(STORE_KEYS.violations, all);
    }
    return { allowed, policy: matched[0], violations, warnings };
  }

  async listViolations(filters?: { framework?: ComplianceFramework; severity?: ViolationSeverity; status?: ViolationStatus; since?: number; limit?: number }): Promise<ResidencyViolation[]> {
    let violations = await this.loadViolations();
    if (filters?.framework) violations = violations.filter((v) => v.framework === filters.framework);
    if (filters?.severity) violations = violations.filter((v) => v.severity === filters.severity);
    if (filters?.status) violations = violations.filter((v) => v.status === filters.status);
    if (filters?.since !== undefined) violations = violations.filter((v) => v.timestamp >= filters.since!);
    violations.sort((a, b) => b.timestamp - a.timestamp);
    if (filters?.limit !== undefined) violations = violations.slice(0, filters.limit);
    return violations;
  }

  async updateViolationStatus(violationId: string, status: ViolationStatus, resolvedBy?: string): Promise<boolean> {
    const violations = await this.loadViolations();
    const idx = violations.findIndex((v) => v.id === violationId);
    if (idx === -1) return false;
    violations[idx].status = status;
    if (status === 'resolved') {
      violations[idx].resolvedAt = Date.now();
      violations[idx].resolvedBy = resolvedBy || null;
    }
    await this.store.set(STORE_KEYS.violations, violations);
    return true;
  }

  async getStats(): Promise<ResidencyStats> {
    const policies = await this.loadPolicies();
    const violations = await this.loadViolations();
    const byFramework = this.emptyFrameworkMap();
    const bySeverity = this.emptySeverityMap();
    const byStatus = this.emptyStatusMap();
    const byRegion: Record<string, number> = {};
    let finesEstimate = 0;
    for (const v of violations) {
      byFramework[v.framework]++;
      bySeverity[v.severity]++;
      byStatus[v.status]++;
      byRegion[v.currentRegion] = (byRegion[v.currentRegion] || 0) + 1;
      if (v.fine) {
        const num = parseFloat(v.fine.replace(/[^\d.]/g, ''));
        if (!isNaN(num)) finesEstimate += num;
      }
    }
    return {
      totalPolicies: policies.length,
      totalViolations: violations.length,
      byFramework,
      bySeverity,
      byStatus,
      openViolations: byStatus.open + byStatus.acknowledged + byStatus.in_remediation,
      criticalViolations: bySeverity.critical,
      finesEstimate,
      byRegion,
    };
  }

  async initializeDefaultPolicies(): Promise<ResidencyPolicy[]> {
    const existing = await this.loadPolicies();
    if (existing.length > 0) return existing;
    const defaults: ResidencyPolicy[] = [
      {
        id: this.generateId('pol'),
        name: 'PIPL 境内存储',
        description: '中国个人信息保护法 — 境内公民个人信息应存储在境内',
        framework: 'PIPL',
        dataClassification: 'confidential',
        allowedRegions: ['cn-north', 'cn-east', 'cn-west', 'cn-northwest', 'cn-southwest'],
        blockedRegions: ['us-east', 'us-west', 'eu-west', 'eu-central', 'ap-southeast', 'ap-northeast'],
        allowedCountries: ['CN', 'HK', 'MO'],
        blockedCountries: ['US', 'GB', 'DE', 'FR', 'JP'],
        dataTypes: ['pii', 'personal_info', 'sensitive_personal_info'],
        enforcementLevel: 'blocking',
        active: true,
        createdAt: Date.now(),
        createdBy: 'system',
      },
      {
        id: this.generateId('pol'),
        name: 'GDPR 欧盟外传',
        description: 'GDPR — 欧盟个人数据外传需有合法基础',
        framework: 'GDPR',
        dataClassification: 'confidential',
        allowedRegions: ['eu-west', 'eu-central', 'eu-north'],
        blockedRegions: [],
        allowedCountries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'IE', 'BE', 'SE'],
        blockedCountries: [],
        dataTypes: ['pii', 'personal_data'],
        enforcementLevel: 'warning',
        active: true,
        createdAt: Date.now(),
        createdBy: 'system',
      },
      {
        id: this.generateId('pol'),
        name: '中国数据安全法 — 重要数据',
        description: '中国数据安全法 — 重要数据境内存储',
        framework: 'China_Data_Security_Law',
        dataClassification: 'restricted',
        allowedRegions: ['cn-north', 'cn-east', 'cn-west', 'cn-northwest', 'cn-southwest'],
        blockedRegions: ['us-east', 'us-west', 'eu-west', 'eu-central', 'ap-southeast', 'ap-northeast', 'me-south'],
        allowedCountries: ['CN', 'HK', 'MO', 'TW'],
        blockedCountries: ['US', 'GB', 'DE', 'FR', 'JP', 'SG', 'AU'],
        dataTypes: ['important_data', 'national_data', 'pii', 'sensitive_personal_info'],
        enforcementLevel: 'blocking',
        active: true,
        createdAt: Date.now(),
        createdBy: 'system',
      },
      {
        id: this.generateId('pol'),
        name: 'PCI DSS 信用卡数据',
        description: 'PCI DSS — 信用卡数据存储要求',
        framework: 'PCI_DSS',
        dataClassification: 'restricted',
        allowedRegions: [],
        blockedRegions: [],
        allowedCountries: [],
        blockedCountries: [],
        dataTypes: ['cardholder_data', 'sensitive_auth_data', 'pan'],
        enforcementLevel: 'audit',
        active: true,
        createdAt: Date.now(),
        createdBy: 'system',
      },
    ];
    await this.store.set(STORE_KEYS.policies, defaults);
    return defaults;
  }

  private evaluatePolicy(policy: ResidencyPolicy, params: { assetId: string; assetName: string; assetType: string; dataType: string; classification: string; currentRegion: string; currentCountry: string | null; destinationRegion?: string; destinationCountry?: string }): ResidencyViolation | null {
    if (policy.dataTypes.length > 0 && !policy.dataTypes.includes(params.dataType)) return null;
    if (params.classification !== policy.dataClassification) return null;
    if (policy.allowedRegions.length > 0 && !policy.allowedRegions.includes(params.currentRegion)) {
      return this.buildViolation(policy, params, 'currentRegion', `Region ${params.currentRegion} not in allowed regions: ${policy.allowedRegions.join(', ')}`);
    }
    if (policy.blockedRegions.length > 0 && policy.blockedRegions.includes(params.currentRegion)) {
      return this.buildViolation(policy, params, 'currentRegion', `Region ${params.currentRegion} is in blocked regions`);
    }
    if (params.currentCountry && policy.allowedCountries.length > 0 && !policy.allowedCountries.includes(params.currentCountry)) {
      return this.buildViolation(policy, params, 'currentCountry', `Country ${params.currentCountry} not in allowed countries: ${policy.allowedCountries.join(', ')}`);
    }
    if (params.currentCountry && policy.blockedCountries.length > 0 && policy.blockedCountries.includes(params.currentCountry)) {
      return this.buildViolation(policy, params, 'currentCountry', `Country ${params.currentCountry} is in blocked countries`);
    }
    if (params.destinationRegion && policy.allowedRegions.length > 0 && !policy.allowedRegions.includes(params.destinationRegion)) {
      return this.buildViolation(policy, params, 'destinationRegion', `Destination region ${params.destinationRegion} not in allowed regions`);
    }
    return null;
  }

  private buildViolation(policy: ResidencyPolicy, params: any, locationType: string, reason: string): ResidencyViolation {
    const severity: ViolationSeverity = policy.enforcementLevel === 'blocking' ? 'critical' : policy.enforcementLevel === 'warning' ? 'high' : 'medium';
    const fines: Record<ComplianceFramework, string> = {
      GDPR: '€20M or 4% of global revenue',
      PIPL: '¥50M or 5% of revenue',
      CCPA: '$7,500 per violation',
      HIPAA: '$1.5M per year per category',
      PCI_DSS: '$5,000-$100,000 per month',
      SOX: 'Criminal penalties',
      ISO_27001: 'Certification loss',
      China_Data_Security_Law: '¥10M',
      China_PIPL: '¥50M or 5% of revenue',
      EU_Data_Act: '€10M',
      APPI: '¥100M',
      LGPD: 'R$50M or 2% of revenue',
      other: 'Varies',
    };
    return {
      id: this.generateId('vio'),
      timestamp: Date.now(),
      policyId: policy.id,
      policyName: policy.name,
      framework: policy.framework,
      severity,
      status: 'open',
      assetId: params.assetId,
      assetName: params.assetName,
      assetType: params.assetType,
      dataType: params.dataType,
      classification: params.classification,
      currentLocation: `${params.currentRegion}/${params.currentCountry || 'unknown'}`,
      currentRegion: params.currentRegion,
      currentCountry: params.currentCountry,
      destinationLocation: params.destinationRegion || null,
      destinationRegion: params.destinationRegion || null,
      destinationCountry: params.destinationCountry || null,
      description: reason,
      evidence: [locationType, reason, `policy=${policy.name}`, `framework=${policy.framework}`],
      remediation: [
        `Migrate asset ${params.assetId} to allowed region`,
        `Update policy to permit this region if business-justified`,
        `Document data transfer mechanism (SCC, BCRs, etc.)`,
        `Notify DPO and compliance team`,
      ],
      remediationDeadline: severity === 'critical' ? Date.now() + 7 * 24 * 60 * 60 * 1000 : severity === 'high' ? Date.now() + 30 * 24 * 60 * 60 * 1000 : Date.now() + 90 * 24 * 60 * 60 * 1000,
      resolvedAt: null,
      resolvedBy: null,
      notes: '',
      fine: fines[policy.framework] || null,
    };
  }

  private emptyFrameworkMap(): Record<ComplianceFramework, number> {
    return { GDPR: 0, PIPL: 0, CCPA: 0, HIPAA: 0, PCI_DSS: 0, SOX: 0, ISO_27001: 0, China_Data_Security_Law: 0, China_PIPL: 0, EU_Data_Act: 0, APPI: 0, LGPD: 0, other: 0 };
  }
  private emptySeverityMap(): Record<ViolationSeverity, number> {
    return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  }
  private emptyStatusMap(): Record<ViolationStatus, number> {
    return { open: 0, acknowledged: 0, in_remediation: 0, resolved: 0, false_positive: 0, risk_accepted: 0 };
  }

  private async loadPolicies(): Promise<ResidencyPolicy[]> {
    return (await this.store.get<ResidencyPolicy[]>(STORE_KEYS.policies)) || [];
  }

  private async loadViolations(): Promise<ResidencyViolation[]> {
    return (await this.store.get<ResidencyViolation[]>(STORE_KEYS.violations)) || [];
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`;
  }
}

const STORE_KEYS = {
  policies: 'dspm/residency-policies.json',
  violations: 'dspm/residency-violations.json',
};
