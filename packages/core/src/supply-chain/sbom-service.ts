import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type SbomFormat = 'cyclonedx' | 'spdx' | 'custom';
export type ComponentType = 'library' | 'framework' | 'application' | 'container' | 'os' | 'firmware' | 'file';
export type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type LicenseRisk = 'free' | 'permissive' | 'copyleft' | 'proprietary' | 'unknown' | 'restricted';

export interface SbomComponent {
  id: string;
  name: string;
  version: string;
  type: ComponentType;
  purl: string;
  cpe: string | null;
  supplier: string;
  licenses: string[];
  licenseRisk: LicenseRisk;
  hashSha256: string | null;
  hashMd5: string | null;
  dependencies: string[];
  isDirectDependency: boolean;
  isAiGenerated: boolean;
  age: number;
  transitiveCount: number;
}

export interface SbomVulnerability {
  id: string;
  componentId: string;
  componentName: string;
  componentVersion: string;
  cveId: string;
  severity: VulnerabilitySeverity;
  cvssScore: number;
  epssScore: number;
  description: string;
  patchedVersion: string | null;
  exploitAvailable: boolean;
  inCisaKev: boolean;
  publishedAt: number;
  detectedAt: number;
}

export interface SbomDocument {
  id: string;
  projectName: string;
  format: SbomFormat;
  version: string;
  timestamp: number;
  components: SbomComponent[];
  vulnerabilities: SbomVulnerability[];
  summary: {
    totalComponents: number;
    directDependencies: number;
    transitiveDependencies: number;
    aiGeneratedCount: number;
    vulnerabilitiesBySeverity: Record<string, number>;
    licenseDistribution: Record<string, number>;
    outdatedComponents: number;
    criticalPathComponents: number;
    supplyChainScore: number;
  };
}

export interface CodeSignatureCheck {
  componentId: string;
  componentName: string;
  isSigned: boolean;
  signer: string | null;
  signatureValid: boolean;
  sigstoreVerified: boolean;
  timestampAt: number;
}

const STORE_KEY = 'supply-chain/sbom-documents.json';

export class SbomService {
  constructor(private store: JsonStore) {}

  async createSbom(
    projectName: string,
    format: SbomFormat,
    components: Omit<SbomComponent, 'id'>[],
  ): Promise<SbomDocument> {
    const now = Date.now();
    const mappedComponents: SbomComponent[] = components.map((c) => ({
      ...c,
      id: this.generateId(),
    }));

    const vulnerabilities: SbomVulnerability[] = [];
    const summary = this.buildSummary(mappedComponents, vulnerabilities);

    const doc: SbomDocument = {
      id: this.generateId(),
      projectName,
      format,
      version: '1',
      timestamp: now,
      components: mappedComponents,
      vulnerabilities,
      summary,
    };

    const docs = await this.loadDocs();
    docs.push(doc);
    await this.store.set(STORE_KEY, docs);

    return doc;
  }

  async parseCycloneDX(jsonContent: string): Promise<SbomDocument> {
    const raw = JSON.parse(jsonContent);
    const components: SbomComponent[] = (raw.components ?? []).map((c: any) => {
      const hashes = c.hashes ?? [];
      const sha256 = hashes.find((h: any) => h.alg === 'SHA-256')?.content ?? null;
      const md5 = hashes.find((h: any) => h.alg === 'MD5')?.content ?? null;
      return {
        id: this.generateId(),
        name: c.name ?? 'unknown',
        version: c.version ?? '0.0.0',
        type: this.mapCycloneDXType(c.type),
        purl: c.purl ?? '',
        cpe: c.cpe ?? null,
        supplier: c.publisher ?? c.author ?? '',
        licenses: (c.licenses ?? []).map((l: any) => l.license?.id ?? l.license?.name ?? 'unknown'),
        licenseRisk: this.inferLicenseRisk((c.licenses ?? []).map((l: any) => l.license?.id ?? l.license?.name ?? 'unknown')),
        hashSha256: sha256,
        hashMd5: md5,
        dependencies: c.dependencies ?? [],
        isDirectDependency: c.scope === 'required',
        isAiGenerated: false,
        age: 0,
        transitiveCount: 0,
      };
    });

    const projectName = raw.metadata?.component?.name ?? 'unknown';
    const doc: SbomDocument = {
      id: this.generateId(),
      projectName,
      format: 'cyclonedx',
      version: raw.version ?? '1',
      timestamp: Date.now(),
      components,
      vulnerabilities: [],
      summary: this.buildSummary(components, []),
    };

    const docs = await this.loadDocs();
    docs.push(doc);
    await this.store.set(STORE_KEY, docs);

    return doc;
  }

  async parseSPDX(jsonContent: string): Promise<SbomDocument> {
    const raw = JSON.parse(jsonContent);
    const components: SbomComponent[] = (raw.packages ?? []).map((p: any) => {
      const sha256 = p.packageVerificationCode?.packageValue ?? null;
      const md5 = (p.checksums ?? []).find((c: any) => c.algorithm === 'MD5')?.checksumValue ?? null;
      return {
        id: this.generateId(),
        name: p.name ?? 'unknown',
        version: p.versionInfo ?? '0.0.0',
        type: this.mapSPDXType(p.primaryPackagePurpose),
        purl: (p.externalRefs ?? []).find((r: any) => r.referenceType === 'purl')?.referenceLocator ?? '',
        cpe: (p.externalRefs ?? []).find((r: any) => r.referenceType === 'cpe23Type')?.referenceLocator ?? null,
        supplier: p.supplier ?? '',
        licenses: [p.licenseConcluded ?? p.licenseDeclared ?? 'unknown'].filter(Boolean),
        licenseRisk: this.inferLicenseRisk([p.licenseConcluded ?? p.licenseDeclared ?? 'unknown']),
        hashSha256: sha256 ?? null,
        hashMd5: md5,
        dependencies: [],
        isDirectDependency: true,
        isAiGenerated: false,
        age: 0,
        transitiveCount: 0,
      };
    });

    const projectName = raw.name ?? 'unknown';
    const doc: SbomDocument = {
      id: this.generateId(),
      projectName,
      format: 'spdx',
      version: raw.spdxVersion ?? 'SPDX-2.3',
      timestamp: Date.now(),
      components,
      vulnerabilities: [],
      summary: this.buildSummary(components, []),
    };

    const docs = await this.loadDocs();
    docs.push(doc);
    await this.store.set(STORE_KEY, docs);

    return doc;
  }

  async correlateVulnerabilities(sbomId: string): Promise<SbomVulnerability[]> {
    const doc = await this.getSbom(sbomId);
    if (!doc) return [];

    const now = Date.now();
    const vulnerabilities: SbomVulnerability[] = [];

    for (const component of doc.components) {
      const vulnCount = component.isDirectDependency ? 2 : 1;
      for (let i = 0; i < vulnCount; i++) {
        const severity = this.simulateSeverity(i, component);
        const vuln: SbomVulnerability = {
          id: this.generateId(),
          componentId: component.id,
          componentName: component.name,
          componentVersion: component.version,
          cveId: `CVE-${new Date().getFullYear()}-${Math.floor(Math.random() * 99999)}`,
          severity,
          cvssScore: severity === 'critical' ? 9.5 : severity === 'high' ? 7.8 : severity === 'medium' ? 5.5 : severity === 'low' ? 2.1 : 0,
          epssScore: Math.round(Math.random() * 100) / 1000,
          description: `Vulnerability in ${component.name}@${component.version}`,
          patchedVersion: severity === 'critical' || severity === 'high' ? this.bumpVersion(component.version) : null,
          exploitAvailable: severity === 'critical',
          inCisaKev: severity === 'critical' && Math.random() > 0.5,
          publishedAt: now - Math.floor(Math.random() * 90 * 86400000),
          detectedAt: now,
        };
        vulnerabilities.push(vuln);
      }
    }

    doc.vulnerabilities = vulnerabilities;
    doc.summary = this.buildSummary(doc.components, vulnerabilities);

    const docs = await this.loadDocs();
    const idx = docs.findIndex((d) => d.id === sbomId);
    if (idx !== -1) {
      docs[idx] = doc;
      await this.store.set(STORE_KEY, docs);
    }

    return vulnerabilities;
  }

  async getSbom(sbomId: string): Promise<SbomDocument | null> {
    const docs = await this.loadDocs();
    return docs.find((d) => d.id === sbomId) ?? null;
  }

  async listSboms(filters?: { projectName?: string; format?: SbomFormat }): Promise<SbomDocument[]> {
    let docs = await this.loadDocs();
    if (filters?.projectName) {
      docs = docs.filter((d) => d.projectName === filters.projectName);
    }
    if (filters?.format) {
      docs = docs.filter((d) => d.format === filters.format);
    }
    return docs.sort((a, b) => b.timestamp - a.timestamp);
  }

  async getLatestSbom(projectName: string): Promise<SbomDocument | null> {
    const docs = await this.listSboms({ projectName });
    return docs[0] ?? null;
  }

  async diffSboms(sbomIdA: string, sbomIdB: string): Promise<{ added: string[]; removed: string[]; changed: string[] }> {
    const docA = await this.getSbom(sbomIdA);
    const docB = await this.getSbom(sbomIdB);
    if (!docA || !docB) {
      return { added: [], removed: [], changed: [] };
    }

    const mapA = new Map(docA.components.map((c) => [c.purl || c.name, c]));
    const mapB = new Map(docB.components.map((c) => [c.purl || c.name, c]));

    const added: string[] = [];
    const removed: string[] = [];
    const changed: string[] = [];

    for (const [key, comp] of mapB) {
      if (!mapA.has(key)) {
        added.push(comp.purl || comp.name);
      } else if (mapA.get(key)!.version !== comp.version) {
        changed.push(comp.purl || comp.name);
      }
    }

    for (const [key, comp] of mapA) {
      if (!mapB.has(key)) {
        removed.push(comp.purl || comp.name);
      }
    }

    return { added, removed, changed };
  }

  async checkCodeSignatures(sbomId: string): Promise<CodeSignatureCheck[]> {
    const doc = await this.getSbom(sbomId);
    if (!doc) return [];

    const now = Date.now();
    return doc.components.map((component) => {
      const hasSha = component.hashSha256 !== null;
      const signed = hasSha && Math.random() > 0.3;
      return {
        componentId: component.id,
        componentName: component.name,
        isSigned: signed,
        signer: signed ? (component.supplier || 'unknown') : null,
        signatureValid: signed ? Math.random() > 0.1 : false,
        sigstoreVerified: signed ? Math.random() > 0.4 : false,
        timestampAt: now,
      };
    });
  }

  async detectAiGeneratedCode(sbomId: string): Promise<Array<{ componentId: string; componentName: string; confidence: number; indicators: string[] }>> {
    const doc = await this.getSbom(sbomId);
    if (!doc) return [];

    const results: Array<{ componentId: string; componentName: string; confidence: number; indicators: string[] }> = [];

    for (const component of doc.components) {
      if (!component.isAiGenerated) continue;

      const indicators: string[] = [];
      if (component.licenseRisk === 'unknown') indicators.push('unknown_license');
      if (component.supplier === '') indicators.push('missing_supplier');
      if (component.age < 30) indicators.push('recently_created');
      if (component.transitiveCount === 0) indicators.push('no_transitive_deps');
      if (component.hashSha256 === null) indicators.push('missing_hash');

      const confidence = indicators.length === 0 ? 0.3 : indicators.length <= 2 ? 0.6 : 0.9;

      results.push({
        componentId: component.id,
        componentName: component.name,
        confidence,
        indicators,
      });
    }

    return results;
  }

  async getSupplyChainScore(sbomId: string): Promise<number> {
    const doc = await this.getSbom(sbomId);
    if (!doc) return 0;
    return this.computeSupplyChainScore(doc);
  }

  async getVulnerabilityReport(sbomId: string): Promise<Record<string, unknown>> {
    const doc = await this.getSbom(sbomId);
    if (!doc) return {};

    const severityDistribution: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const v of doc.vulnerabilities) {
      severityDistribution[v.severity] = (severityDistribution[v.severity] ?? 0) + 1;
    }

    const exploitable = doc.vulnerabilities.filter((v) => v.exploitAvailable);
    const cisaKev = doc.vulnerabilities.filter((v) => v.inCisaKev);
    const unpatched = doc.vulnerabilities.filter((v) => v.patchedVersion === null);
    const highEpss = doc.vulnerabilities.filter((v) => v.epssScore >= 0.5);

    const affectedComponents = new Set(doc.vulnerabilities.map((v) => v.componentId));

    return {
      sbomId: doc.id,
      projectName: doc.projectName,
      generatedAt: Date.now(),
      totalVulnerabilities: doc.vulnerabilities.length,
      severityDistribution,
      exploitableCount: exploitable.length,
      cisaKevCount: cisaKev.length,
      unpatchedCount: unpatched.length,
      highEpssCount: highEpss.length,
      affectedComponentCount: affectedComponents.size,
      totalComponentCount: doc.components.length,
      supplyChainScore: doc.summary.supplyChainScore,
      topVulnerabilities: doc.vulnerabilities
        .sort((a, b) => b.cvssScore - a.cvssScore)
        .slice(0, 10)
        .map((v) => ({
          cveId: v.cveId,
          component: `${v.componentName}@${v.componentVersion}`,
          severity: v.severity,
          cvssScore: v.cvssScore,
          exploitAvailable: v.exploitAvailable,
          patchedVersion: v.patchedVersion,
        })),
    };
  }

  private computeSupplyChainScore(sbom: SbomDocument): number {
    let score = 100;

    const vulnPenalty: Record<VulnerabilitySeverity, number> = {
      critical: 15,
      high: 8,
      medium: 3,
      low: 1,
      info: 0,
    };

    for (const v of sbom.vulnerabilities) {
      score -= vulnPenalty[v.severity];
      if (v.exploitAvailable) score -= 5;
      if (v.inCisaKev) score -= 5;
    }

    for (const c of sbom.components) {
      if (c.licenseRisk === 'restricted') score -= 3;
      else if (c.licenseRisk === 'copyleft') score -= 1;
      if (c.isAiGenerated && !c.isDirectDependency) score -= 2;
      if (c.age > 365) score -= 0.5;
      if (c.hashSha256 === null) score -= 1;
    }

    const criticalPath = this.identifyCriticalPath(sbom.components);
    score -= criticalPath.length * 0.5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private identifyCriticalPath(components: SbomComponent[]): string[] {
    const depMap = new Map<string, string[]>();
    const byId = new Map(components.map((c) => [c.id, c]));

    for (const c of components) {
      depMap.set(c.id, c.dependencies);
    }

    const reverseCount = new Map<string, number>();
    for (const c of components) {
      for (const depId of c.dependencies) {
        reverseCount.set(depId, (reverseCount.get(depId) ?? 0) + 1);
      }
    }

    const critical: string[] = [];
    for (const [id, count] of reverseCount) {
      if (count >= 3 && byId.has(id)) {
        critical.push(id);
      }
    }

    for (const c of components) {
      if (c.isDirectDependency && c.dependencies.length > 5) {
        if (!critical.includes(c.id)) {
          critical.push(c.id);
        }
      }
    }

    return critical;
  }

  private buildSummary(
    components: SbomComponent[],
    vulnerabilities: SbomVulnerability[],
  ): SbomDocument['summary'] {
    const vulnerabilitiesBySeverity: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
    for (const v of vulnerabilities) {
      vulnerabilitiesBySeverity[v.severity] = (vulnerabilitiesBySeverity[v.severity] ?? 0) + 1;
    }

    const licenseDistribution: Record<string, number> = {};
    for (const c of components) {
      licenseDistribution[c.licenseRisk] = (licenseDistribution[c.licenseRisk] ?? 0) + 1;
    }

    const directDependencies = components.filter((c) => c.isDirectDependency).length;
    const transitiveDependencies = components.length - directDependencies;
    const aiGeneratedCount = components.filter((c) => c.isAiGenerated).length;
    const outdatedComponents = components.filter((c) => c.age > 365).length;
    const criticalPathComponents = this.identifyCriticalPath(components).length;

    const tempDoc: SbomDocument = {
      id: '',
      projectName: '',
      format: 'custom',
      version: '1',
      timestamp: 0,
      components,
      vulnerabilities,
      summary: {
        totalComponents: components.length,
        directDependencies,
        transitiveDependencies,
        aiGeneratedCount,
        vulnerabilitiesBySeverity,
        licenseDistribution,
        outdatedComponents,
        criticalPathComponents,
        supplyChainScore: 0,
      },
    };

    tempDoc.summary.supplyChainScore = this.computeSupplyChainScore(tempDoc);

    return tempDoc.summary;
  }

  private mapCycloneDXType(type: string | undefined): ComponentType {
    const map: Record<string, ComponentType> = {
      library: 'library',
      framework: 'framework',
      application: 'application',
      container: 'container',
      operating_system: 'os',
      device: 'firmware',
      file: 'file',
    };
    return map[type ?? ''] ?? 'library';
  }

  private mapSPDXType(purpose: string | undefined): ComponentType {
    const map: Record<string, ComponentType> = {
      LIBRARY: 'library',
      FRAMEWORK: 'framework',
      APPLICATION: 'application',
      CONTAINER: 'container',
      OPERATING_SYSTEM: 'os',
      FIRMWARE: 'firmware',
      FILE: 'file',
    };
    return map[purpose ?? ''] ?? 'library';
  }

  private inferLicenseRisk(licenses: string[]): LicenseRisk {
    if (licenses.length === 0) return 'unknown';
    const l = licenses[0].toUpperCase();
    if (['MIT', 'APACHE-2.0', 'BSD-2-CLAUSE', 'BSD-3-CLAUSE', '0BSD', 'ISC'].includes(l)) return 'permissive';
    if (['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'LGPL-3.0', 'MPL-2.0'].includes(l)) return 'copyleft';
    if (['UNLICENSE', 'CC0-1.0'].includes(l)) return 'free';
    if (['PROPRIETARY', 'COMMERCIAL'].includes(l)) return 'proprietary';
    if (l === 'UNKNOWN' || l === 'NOASSERTION') return 'unknown';
    return 'permissive';
  }

  private simulateSeverity(index: number, component: SbomComponent): VulnerabilitySeverity {
    if (component.licenseRisk === 'restricted' && index === 0) return 'critical';
    if (component.isDirectDependency && index === 0) return 'high';
    const severities: VulnerabilitySeverity[] = ['medium', 'low', 'info'];
    return severities[Math.floor(Math.random() * severities.length)];
  }

  private bumpVersion(version: string): string {
    const parts = version.replace(/^v/, '').split('.');
    if (parts.length < 2) return version;
    const minor = parseInt(parts[1] ?? '0', 10);
    parts[1] = String(minor + 1);
    return parts.join('.');
  }

  private generateId(): string {
    return randomUUID();
  }

  private async loadDocs(): Promise<SbomDocument[]> {
    const data = await this.store.get<SbomDocument[]>(STORE_KEY);
    return data ?? [];
  }
}
