/**
 * Compliance Repository
 * 合规审计数据访问层
 */

import type { JsonStore } from '../storage/json-store.js';

const FILE_NAME = 'compliance.json';

export interface Regulation {
  id: string;
  name: string;
  fullName: string;
  jurisdiction: string;
  version: string;
  effectiveDate: number;
  authority: string;
  controlFramework: {
    domains: string[];
    totalControls: number;
  };
  requirements: {
    mandatory: boolean;
    penalties: string;
    auditCycle: string;
  };
  compliance?: {
    score: number;
    compliant: number;
    partial: number;
    nonCompliant: number;
    lastAudit?: number;
  };
}

export interface ComplianceQueryParams {
  jurisdiction?: string;
  page?: number;
  pageSize?: number;
}

export class ComplianceRepository {
  constructor(private store: JsonStore) {}

  async getAll(): Promise<Regulation[]> {
    return this.store.get<Regulation[]>(FILE_NAME) || [];
  }

  async getById(id: string): Promise<Regulation | null> {
    const regs = await this.getAll();
    return regs.find(r => r.id === id) || null;
  }

  async query(params: ComplianceQueryParams): Promise<Regulation[]> {
    let regs = await this.getAll();

    if (params.jurisdiction) {
      regs = regs.filter(r => r.jurisdiction === params.jurisdiction);
    }

    if (params.page !== undefined && params.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      regs = regs.slice(start, start + params.pageSize);
    }

    return regs;
  }

  async getStats(): Promise<{
    total: number;
    byJurisdiction: Record<string, number>;
    avgScore: number;
  }> {
    const regs = await this.getAll();
    
    const byJurisdiction: Record<string, number> = {};
    let totalScore = 0;
    let scoreCount = 0;

    for (const reg of regs) {
      byJurisdiction[reg.jurisdiction] = (byJurisdiction[reg.jurisdiction] || 0) + 1;
      if (reg.compliance?.score) {
        totalScore += reg.compliance.score;
        scoreCount++;
      }
    }

    return {
      total: regs.length,
      byJurisdiction,
      avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
    };
  }
}
