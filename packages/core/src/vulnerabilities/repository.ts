/**
 * Vulnerabilities Repository
 * 漏洞数据访问层
 */

import type { JsonStore } from '../storage/json-store.js';

const FILE_NAME = 'vulnerabilities.json';

export interface Vulnerability {
  id: string;
  info: {
    cveId: string;
    title: string;
    description: string;
    cvss: {
      score: number;
      vector: string;
      severity: string;
    };
    cwe: string[];
    affectedProducts: string[];
    exploitAvailable: boolean;
    exploitInWild: boolean;
  };
  affectedAssets: Array<{
    assetId: string;
    componentName: string;
    componentVersion: string;
    fixVersion: string;
  }>;
  remediation: {
    status: 'open' | 'in_progress' | 'mitigated' | 'resolved' | 'accepted';
    priority: number;
    assignedTo?: string;
    dueDate?: number;
    slaDeadline?: number;
    fixAvailable: boolean;
    fixSteps: string[];
  };
  risk: {
    baseScore: number;
    adjustedScore: number;
    businessImpact: number;
    exposureScore: number;
    totalRiskScore: number;
  };
  history: Array<{
    action: string;
    user: string;
    timestamp: number;
  }>;
  createdAt: number;
  updatedAt: number;
}

export interface VulnerabilityQueryParams {
  status?: string;
  severity?: string;
  cveId?: string;
  assetId?: string;
  assignedTo?: string;
  fromDate?: number;
  toDate?: number;
  page?: number;
  pageSize?: number;
}

export class VulnerabilitiesRepository {
  constructor(private store: JsonStore) {}

  async getAll(): Promise<Vulnerability[]> {
    return this.store.get<Vulnerability[]>(FILE_NAME) || [];
  }

  async getById(id: string): Promise<Vulnerability | null> {
    const vulns = await this.getAll();
    return vulns.find(v => v.id === id) || null;
  }

  async getByCVE(cveId: string): Promise<Vulnerability | null> {
    const vulns = await this.getAll();
    return vulns.find(v => v.info.cveId === cveId) || null;
  }

  async query(params: VulnerabilityQueryParams): Promise<Vulnerability[]> {
    let vulns = await this.getAll();

    if (params.status) {
      vulns = vulns.filter(v => v.remediation.status === params.status);
    }
    if (params.severity) {
      vulns = vulns.filter(v => v.info.cvss.severity === params.severity);
    }
    if (params.cveId) {
      vulns = vulns.filter(v => v.info.cveId.toLowerCase().includes(params.cveId!.toLowerCase()));
    }
    if (params.assetId) {
      vulns = vulns.filter(v => v.affectedAssets.some(a => a.assetId === params.assetId));
    }
    if (params.assignedTo) {
      vulns = vulns.filter(v => v.remediation.assignedTo === params.assignedTo);
    }

    // Sort by priority (descending)
    vulns.sort((a, b) => b.remediation.priority - a.remediation.priority);

    if (params.page !== undefined && params.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      vulns = vulns.slice(start, start + params.pageSize);
    }

    return vulns;
  }

  async update(id: string, updates: Partial<Vulnerability>): Promise<Vulnerability | null> {
    const vulns = await this.getAll();
    const index = vulns.findIndex(v => v.id === id);
    if (index === -1) return null;

    vulns[index] = { ...vulns[index], ...updates, updatedAt: Date.now() };
    await this.store.set(FILE_NAME, vulns);
    return vulns[index];
  }

  async addHistory(id: string, action: string, user: string): Promise<void> {
    const vuln = await this.getById(id);
    if (!vuln) return;

    vuln.history.push({
      action,
      user,
      timestamp: Date.now(),
    });

    await this.store.set(FILE_NAME, await this.getAll());
  }

  async getStats(): Promise<{
    total: number;
    open: number;
    resolved: number;
    bySeverity: Record<string, number>;
    avgCvss: number;
    exploitableCount: number;
  }> {
    const vulns = await this.getAll();
    
    const bySeverity: Record<string, number> = {};
    let totalCvss = 0;
    let exploitable = 0;

    for (const vuln of vulns) {
      const sev = vuln.info.cvss.severity;
      bySeverity[sev] = (bySeverity[sev] || 0) + 1;
      totalCvss += vuln.info.cvss.score;
      if (vuln.info.exploitInWild) exploitable++;
    }

    return {
      total: vulns.length,
      open: vulns.filter(v => v.remediation.status === 'open').length,
      resolved: vulns.filter(v => v.remediation.status === 'resolved').length,
      bySeverity,
      avgCvss: vulns.length > 0 ? Math.round((totalCvss / vulns.length) * 10) / 10 : 0,
      exploitableCount: exploitable,
    };
  }
}
