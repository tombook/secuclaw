import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type CloudProvider = 'aws' | 'azure' | 'gcp' | 'kubernetes' | 'generic';
export type CspmSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type CspmStatus = 'pass' | 'fail' | 'error' | 'skip' | 'unknown';

export interface CspmRule {
  id: string;
  name: string;
  description: string;
  provider: CloudProvider;
  service: string;
  category: string;
  severity: CspmSeverity;
  framework: string[];
  check: (resource: Record<string, unknown>) => Promise<boolean>;
  remediation: string;
}

export interface CspmResource {
  id: string;
  provider: CloudProvider;
  service: string;
  type: string;
  region: string;
  name: string;
  config: Record<string, unknown>;
  tags: Record<string, string>;
}

export interface CspmFinding {
  id: string;
  ruleId: string;
  ruleName: string;
  resourceId: string;
  resourceName: string;
  provider: CloudProvider;
  service: string;
  severity: CspmSeverity;
  status: CspmStatus;
  description: string;
  remediation: string;
  framework: string[];
  detectedAt: number;
  dismissed: boolean;
  dismissedBy: string | null;
  dismissReason: string | null;
}

export interface CspmScanResult {
  id: string;
  timestamp: number;
  provider: CloudProvider;
  totalRules: number;
  totalResources: number;
  findings: CspmFinding[];
  summary: Record<CspmSeverity, number>;
  complianceScore: number;
  duration: number;
}

interface CspmStoredData {
  scans: CspmScanResult[];
  findings: CspmFinding[];
}

const STORE_KEY = 'cspm/scans.json';
const FINDINGS_KEY = 'cspm/findings.json';

const SEVERITY_LEVELS: CspmSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];

function emptySummary(): Record<CspmSeverity, number> {
  return { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
}

export class CspmEngine {
  private rules = new Map<string, CspmRule>();

  constructor(private store: JsonStore) {
    this.registerBuiltinRules();
  }

  registerRule(rule: CspmRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): boolean {
    return this.rules.delete(ruleId);
  }

  getRule(ruleId: string): CspmRule | undefined {
    return this.rules.get(ruleId);
  }

  listRules(filters?: { provider?: CloudProvider; service?: string; severity?: CspmSeverity }): CspmRule[] {
    let result = Array.from(this.rules.values());
    if (filters?.provider) {
      result = result.filter(r => r.provider === filters.provider);
    }
    if (filters?.service) {
      result = result.filter(r => r.service === filters.service);
    }
    if (filters?.severity) {
      result = result.filter(r => r.severity === filters.severity);
    }
    return result;
  }

  async scanResources(resources: CspmResource[]): Promise<CspmScanResult> {
    const start = Date.now();
    const findings: CspmFinding[] = [];

    const applicableRules = Array.from(this.rules.values());
    let totalChecks = 0;

    for (const rule of applicableRules) {
      const matchingResources = resources.filter(r => r.provider === rule.provider && r.service === rule.service);
      for (const resource of matchingResources) {
        totalChecks++;
        const finding = await this.evaluateRule(rule, resource);
        if (finding) {
          findings.push(finding);
        }
      }
    }

    const providerSet = new Set<CloudProvider>(resources.map(r => r.provider));
    const primaryProvider: CloudProvider = providerSet.size === 1 ? resources[0]?.provider ?? 'generic' : 'generic';

    const result: CspmScanResult = {
      id: this.generateId(),
      timestamp: start,
      provider: primaryProvider,
      totalRules: applicableRules.length,
      totalResources: resources.length,
      findings,
      summary: this.computeSummary(findings),
      complianceScore: this.computeComplianceScore(findings, totalChecks),
      duration: Date.now() - start,
    };

    await this.persistScanResult(result, findings);
    return result;
  }

  async scanProvider(provider: CloudProvider, resourceFetcher: () => Promise<CspmResource[]>): Promise<CspmScanResult> {
    const resources = await resourceFetcher();
    const filtered = resources.filter(r => r.provider === provider);
    return this.scanResources(filtered);
  }

  async getLatestScan(): Promise<CspmScanResult | null> {
    const data = await this.loadData();
    if (data.scans.length === 0) return null;
    return data.scans[data.scans.length - 1] ?? null;
  }

  async getScanHistory(limit = 10): Promise<CspmScanResult[]> {
    const data = await this.loadData();
    return data.scans.slice(-limit);
  }

  async dismissFinding(findingId: string, dismissedBy: string, reason: string): Promise<boolean> {
    const data = await this.loadData();
    const finding = data.findings.find(f => f.id === findingId);
    if (!finding) return false;
    finding.dismissed = true;
    finding.dismissedBy = dismissedBy;
    finding.dismissReason = reason;
    await this.store.set(FINDINGS_KEY, data.findings);
    const scan = data.scans.find(s => s.findings.some(f => f.id === findingId));
    if (scan) {
      const scanFinding = scan.findings.find(f => f.id === findingId);
      if (scanFinding) {
        scanFinding.dismissed = true;
        scanFinding.dismissedBy = dismissedBy;
        scanFinding.dismissReason = reason;
      }
      await this.store.set(STORE_KEY, data.scans);
    }
    return true;
  }

  async getComplianceTrend(limit = 10): Promise<Array<{ timestamp: number; score: number; provider: CloudProvider }>> {
    const data = await this.loadData();
    return data.scans.slice(-limit).map(s => ({
      timestamp: s.timestamp,
      score: s.complianceScore,
      provider: s.provider,
    }));
  }

  async getFindingsByFramework(framework: string): Promise<CspmFinding[]> {
    const data = await this.loadData();
    return data.findings.filter(f => f.framework.includes(framework));
  }

  private async evaluateRule(rule: CspmRule, resource: CspmResource): Promise<CspmFinding | null> {
    try {
      const passed = await rule.check(resource.config);
      if (passed) return null;
      return {
        id: this.generateId(),
        ruleId: rule.id,
        ruleName: rule.name,
        resourceId: resource.id,
        resourceName: resource.name,
        provider: rule.provider,
        service: rule.service,
        severity: rule.severity,
        status: 'fail',
        description: rule.description,
        remediation: rule.remediation,
        framework: rule.framework,
        detectedAt: Date.now(),
        dismissed: false,
        dismissedBy: null,
        dismissReason: null,
      };
    } catch {
      return {
        id: this.generateId(),
        ruleId: rule.id,
        ruleName: rule.name,
        resourceId: resource.id,
        resourceName: resource.name,
        provider: rule.provider,
        service: rule.service,
        severity: rule.severity,
        status: 'error',
        description: rule.description,
        remediation: rule.remediation,
        framework: rule.framework,
        detectedAt: Date.now(),
        dismissed: false,
        dismissedBy: null,
        dismissReason: null,
      };
    }
  }

  private computeComplianceScore(findings: CspmFinding[], totalChecks: number): number {
    if (totalChecks === 0) return 100;
    const failed = findings.filter(f => f.status === 'fail').length;
    const score = ((totalChecks - failed) / totalChecks) * 100;
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  private generateId(): string {
    return `cspm_${randomUUID()}`;
  }

  private computeSummary(findings: CspmFinding[]): Record<CspmSeverity, number> {
    const summary = emptySummary();
    for (const f of findings) {
      if (f.status === 'fail' || f.status === 'error') {
        summary[f.severity]++;
      }
    }
    return summary;
  }

  private async loadData(): Promise<CspmStoredData> {
    const [scans, findings] = await Promise.all([
      this.store.get<CspmScanResult[]>(STORE_KEY),
      this.store.get<CspmFinding[]>(FINDINGS_KEY),
    ]);
    return {
      scans: scans ?? [],
      findings: findings ?? [],
    };
  }

  private async persistScanResult(result: CspmScanResult, newFindings: CspmFinding[]): Promise<void> {
    const data = await this.loadData();
    data.scans.push(result);
    data.findings.push(...newFindings);
    await Promise.all([
      this.store.set(STORE_KEY, data.scans),
      this.store.set(FINDINGS_KEY, data.findings),
    ]);
  }

  private registerBuiltinRules(): void {
    this.registerRule({
      id: 'aws-s3-public-access-block',
      name: 'S3 Public Access Block Enabled',
      description: 'Ensure S3 bucket has public access blocks configured',
      provider: 'aws',
      service: 's3',
      category: 'network',
      severity: 'critical',
      framework: ['CIS', 'NIST-800-53', 'GDPR', 'PCI-DSS'],
      check: async (config) => {
        const block = config.PublicAccessBlockConfiguration as Record<string, unknown> | undefined;
        if (!block) return false;
        return block['RestrictPublicBuckets'] === true
          && block['BlockPublicAcls'] === true
          && block['BlockPublicPolicy'] === true
          && block['IgnorePublicAcls'] === true;
      },
      remediation: 'Enable all four public access block settings on the S3 bucket via AWS Console or CLI',
    });

    this.registerRule({
      id: 'aws-s3-encryption',
      name: 'S3 Bucket Encryption Enabled',
      description: 'Ensure S3 bucket has server-side encryption enabled',
      provider: 'aws',
      service: 's3',
      category: 'encryption',
      severity: 'high',
      framework: ['CIS', 'NIST-800-53', 'GDPR', 'PCI-DSS'],
      check: async (config) => {
        const enc = config.ServerSideEncryptionConfiguration as Record<string, unknown> | undefined;
        if (!enc) return false;
        const rules = enc['Rules'] as unknown[] | undefined;
        return Array.isArray(rules) && rules.length > 0;
      },
      remediation: 'Enable default server-side encryption (AES-256 or aws:kms) on the S3 bucket',
    });

    this.registerRule({
      id: 'aws-ebs-encryption',
      name: 'EBS Volume Encryption Enabled',
      description: 'Ensure EBS volumes are encrypted at rest',
      provider: 'aws',
      service: 'ec2',
      category: 'encryption',
      severity: 'high',
      framework: ['CIS', 'NIST-800-53', 'GDPR', 'PCI-DSS'],
      check: async (config) => config.Encrypted === true,
      remediation: 'Enable encryption on EBS volumes. Use AWS account-level default encryption for new volumes',
    });

    this.registerRule({
      id: 'aws-rds-no-public-access',
      name: 'RDS Public Accessibility Disabled',
      description: 'Ensure RDS instances are not publicly accessible',
      provider: 'aws',
      service: 'rds',
      category: 'network',
      severity: 'critical',
      framework: ['CIS', 'NIST-800-53', 'PCI-DSS'],
      check: async (config) => config.PubliclyAccessible !== true,
      remediation: 'Set PubliclyAccessible to false on the RDS instance. Place it in a private subnet',
    });

    this.registerRule({
      id: 'aws-sg-no-ssh-open',
      name: 'Security Group Restricts SSH Access',
      description: 'Ensure no security group allows 0.0.0.0/0 inbound on port 22',
      provider: 'aws',
      service: 'ec2',
      category: 'network',
      severity: 'critical',
      framework: ['CIS', 'NIST-800-53', 'PCI-DSS'],
      check: async (config) => {
        const rules = config.IpPermissions as Array<Record<string, unknown>> | undefined;
        if (!rules) return true;
        return !rules.some(rule => {
          const fromPort = rule.FromPort as number | undefined;
          const ipRanges = rule.IpRanges as Array<Record<string, unknown>> | undefined;
          return fromPort === 22 && ipRanges?.some((r) => r.CidrIp === '0.0.0.0/0');
        });
      },
      remediation: 'Remove 0.0.0.0/0 inbound rule for port 22. Restrict SSH access to known IP ranges or use VPN/bastion host',
    });

    this.registerRule({
      id: 'aws-iam-root-mfa',
      name: 'IAM Root MFA Enabled',
      description: 'Ensure MFA is enabled for the root account',
      provider: 'aws',
      service: 'iam',
      category: 'identity',
      severity: 'critical',
      framework: ['CIS', 'NIST-800-53', 'GDPR', 'PCI-DSS'],
      check: async (config) => config.MFAEnabled === true,
      remediation: 'Enable MFA on the AWS root account immediately. Use a hardware MFA device for maximum security',
    });

    this.registerRule({
      id: 'aws-cloudtrail-enabled',
      name: 'CloudTrail Enabled',
      description: 'Ensure CloudTrail is enabled for logging API activity',
      provider: 'aws',
      service: 'cloudtrail',
      category: 'logging',
      severity: 'high',
      framework: ['CIS', 'NIST-800-53', 'GDPR', 'PCI-DSS'],
      check: async (config) => {
        const trails = config.TrailList as Array<Record<string, unknown>> | undefined;
        if (!trails || trails.length === 0) return false;
        return trails.some(t => t.IsLogging === true);
      },
      remediation: 'Enable CloudTrail with multi-region logging and log file validation. Send logs to a centralized S3 bucket',
    });

    this.registerRule({
      id: 'k8s-pod-non-root',
      name: 'Pod Runs as Non-Root',
      description: 'Ensure containers run with non-root user',
      provider: 'kubernetes',
      service: 'k8s-pod',
      category: 'compute',
      severity: 'high',
      framework: ['CIS', 'NIST-800-53'],
      check: async (config) => {
        const sc = config.securityContext as Record<string, unknown> | undefined;
        if (!sc) return false;
        return sc.runAsNonRoot === true;
      },
      remediation: 'Set securityContext.runAsNonRoot=true and specify runAsUser > 0 in the pod spec',
    });

    this.registerRule({
      id: 'k8s-container-resource-limits',
      name: 'Container Has Resource Limits',
      description: 'Ensure containers have CPU and memory resource limits set',
      provider: 'kubernetes',
      service: 'k8s-pod',
      category: 'compute',
      severity: 'medium',
      framework: ['CIS', 'NIST-800-53'],
      check: async (config) => {
        const containers = config.containers as Array<Record<string, unknown>> | undefined;
        if (!containers) return false;
        return containers.every(c => {
          const resources = c['resources'] as Record<string, unknown> | undefined;
          const limits = resources?.['limits'] as Record<string, unknown> | undefined;
          return limits && limits['cpu'] && limits['memory'];
        });
      },
      remediation: 'Set resource limits (cpu and memory) for all containers in the pod spec',
    });

    this.registerRule({
      id: 'k8s-no-privileged',
      name: 'No Privileged Containers',
      description: 'Ensure containers do not run in privileged mode',
      provider: 'kubernetes',
      service: 'k8s-pod',
      category: 'compute',
      severity: 'critical',
      framework: ['CIS', 'NIST-800-53'],
      check: async (config) => {
        const containers = config.containers as Array<Record<string, unknown>> | undefined;
        if (!containers) return true;
        return containers.every(c => {
          const sc = c.securityContext as Record<string, unknown> | undefined;
          return !sc || sc.privileged !== true;
        });
      },
      remediation: 'Remove privileged: true from container securityContext. Use capabilities for fine-grained permissions',
    });

    this.registerRule({
      id: 'k8s-readonly-root-fs',
      name: 'Read-Only Root Filesystem',
      description: 'Ensure containers use a read-only root filesystem',
      provider: 'kubernetes',
      service: 'k8s-pod',
      category: 'compute',
      severity: 'medium',
      framework: ['CIS'],
      check: async (config) => {
        const containers = config.containers as Array<Record<string, unknown>> | undefined;
        if (!containers) return false;
        return containers.every(c => {
          const sc = c.securityContext as Record<string, unknown> | undefined;
          return sc?.readOnlyRootFilesystem === true;
        });
      },
      remediation: 'Set securityContext.readOnlyRootFilesystem=true and use emptyDir volumes for writable paths',
    });

    this.registerRule({
      id: 'k8s-network-policy',
      name: 'Network Policy Exists',
      description: 'Ensure namespaces have network policies to restrict pod communication',
      provider: 'kubernetes',
      service: 'k8s-pod',
      category: 'network',
      severity: 'high',
      framework: ['CIS', 'NIST-800-53'],
      check: async (config) => {
        const policies = config.networkPolicies as unknown[] | undefined;
        return Array.isArray(policies) && policies.length > 0;
      },
      remediation: 'Define NetworkPolicy resources to restrict pod-to-pod traffic to only necessary communication paths',
    });

    this.registerRule({
      id: 'k8s-no-host-pid-ipc',
      name: 'Host PID/IPC Not Shared',
      description: 'Ensure pods do not share the host PID or IPC namespace',
      provider: 'kubernetes',
      service: 'k8s-pod',
      category: 'compute',
      severity: 'high',
      framework: ['CIS', 'NIST-800-53'],
      check: async (config) => {
        const sc = config.securityContext as Record<string, unknown> | undefined;
        if (!sc) return true;
        return sc.hostPID !== true && sc.hostIPC !== true;
      },
      remediation: 'Remove hostPID: true and hostIPC: true from the pod securityContext',
    });

    this.registerRule({
      id: 'generic-encryption-at-rest',
      name: 'Encryption at Rest Enabled',
      description: 'Ensure resources have encryption at rest enabled',
      provider: 'generic',
      service: 'storage',
      category: 'encryption',
      severity: 'high',
      framework: ['NIST-800-53', 'GDPR', 'PCI-DSS'],
      check: async (config) => config.encryptionAtRest === true || config.encrypted === true,
      remediation: 'Enable encryption at rest for all storage resources using provider-managed or customer-managed keys',
    });

    this.registerRule({
      id: 'generic-encryption-in-transit',
      name: 'Encryption in Transit Enforced',
      description: 'Ensure resources enforce encryption in transit (TLS)',
      provider: 'generic',
      service: 'network',
      category: 'encryption',
      severity: 'high',
      framework: ['NIST-800-53', 'GDPR', 'PCI-DSS'],
      check: async (config) => config.tlsEnforced === true || config.encryptionInTransit === true,
      remediation: 'Enforce TLS for all data in transit. Disable plaintext protocols and require minimum TLS 1.2',
    });
  }
}
