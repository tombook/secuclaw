/**
 * Compliance Service
 * 合规审计业务逻辑层
 */

import { ComplianceRepository, type Regulation, type ComplianceQueryParams } from './repository.js';
import type { EventBus as EventBusType } from '../events/event-bus.js';

export class ComplianceService {
  private eventBus: EventBusType | null = null;

  constructor(private repo: ComplianceRepository) {}

  setEventBus(bus: EventBusType): void {
    this.eventBus = bus;
  }

  private async emitEvent(event: string, payload: unknown): Promise<void> {
    if (this.eventBus) {
      try {
        await this.eventBus.emit(event as any, payload);
      } catch (err) {
        console.error('[ComplianceService] EventBus emit failed', err);
      }
    }
  }

  async list(params: ComplianceQueryParams = {}): Promise<Regulation[]> {
    return this.repo.query(params);
  }

  async get(id: string): Promise<Regulation | null> {
    return this.repo.getById(id);
  }

  async getStats() {
    return this.repo.getStats();
  }

  
  async getFrameworkScore(frameworkId: string): Promise<{
    framework: string;
    score: number;
    totalControls: number;
    compliant: number;
    partial: number;
    nonCompliant: number;
    gaps: string[];
  } | null> {
    const reg = await this.repo.getById(frameworkId);
    if (!reg) return null;

    const score = reg.compliance?.score ?? 0;
    const totalControls = reg.controlFramework.totalControls;
    const compliant = reg.compliance?.compliant ?? 0;
    const partial = reg.compliance?.partial ?? 0;
    const nonCompliant = reg.compliance?.nonCompliant ?? 0;
    // Simple gaps: derive from non-compliant count if available; otherwise empty
    const gaps = nonCompliant > 0 ? Array.from({ length: nonCompliant }).map((_, i) => `gap_${reg.id}_${i + 1}`) : [];

    return {
      framework: reg.name,
      score,
      totalControls,
      compliant,
      partial,
      nonCompliant,
      gaps,
    };
  }

  
  async getPosture(): Promise<{
    overallScore: number;
    frameworkCount: number;
    frameworks: Array<{ name: string; score: number; status: 'compliant' | 'partial' | 'non-compliant' }>;
    criticalGaps: number;
    recommendations: string[];
  }> {
    const regs = await this.repo.getAll();
    const frameworks = regs.map(r => {
      const score = r.compliance?.score ?? 0;
      let status: 'compliant' | 'partial' | 'non-compliant' = 'non-compliant';
      if (score >= 80) status = 'compliant';
      else if (score >= 50) status = 'partial';
      return { name: r.name, score, status };
    });

    const overallScore = Math.round(
      (regs.reduce((acc, r) => acc + (r.compliance?.score ?? 0), 0) /
        (regs.length || 1)) * 10
    ) / 10;
    const criticalGaps = regs.reduce((acc, r) => acc + (r.compliance?.nonCompliant ?? 0), 0);

    const recommendations: string[] = [];
    for (const fw of frameworks) {
      if (fw.score < 80) {
        recommendations.push(`Improve ${fw.name} compliance by addressing gaps`);
      } else {
        recommendations.push(`Maintain ${fw.name} compliance posture`);
      }
    }

    return {
      overallScore,
      frameworkCount: regs.length,
      frameworks,
      criticalGaps,
      recommendations,
    };
  }

  
  async compareFrameworks(): Promise<Array<{
    framework: string;
    jurisdiction: string;
    score: number;
    mandatory: boolean;
    auditCycle: string;
  }>> {
    const regs = await this.repo.getAll();
    return regs.map(r => ({
      framework: r.name,
      jurisdiction: r.jurisdiction,
      score: r.compliance?.score ?? 0,
      mandatory: r.requirements.mandatory,
      auditCycle: r.requirements.auditCycle,
    }))
    .sort((a, b) => b.score - a.score);
  }

  
  async getAuditSchedule(): Promise<Array<{
    framework: string;
    lastAudit: number | null;
    nextAudit: number | null;
    daysUntilAudit: number | null;
  }>> {
    const regs = await this.repo.getAll();
    const now = Date.now();
    const map = regs.map(r => {
      const lastAudit = r.compliance?.lastAudit ?? null;
      const cycle = r.requirements.auditCycle.toLowerCase();
      let nextAudit: number | null = null;
      if (lastAudit) {
        const base = new Date(lastAudit).getTime();
        let delta = 0;
        if (cycle === 'annual') delta = 365 * 24 * 60 * 60 * 1000;
        else if (cycle === 'quarterly') delta = 90 * 24 * 60 * 60 * 1000;
        else if (cycle === 'monthly') delta = 30 * 24 * 60 * 60 * 1000;
        else delta = 0;
        if (delta > 0) nextAudit = base + delta;
      }
      const daysUntilAudit = nextAudit ? Math.ceil((nextAudit - now) / (1000 * 60 * 60 * 24)) : null;
      return {
        framework: r.name,
        lastAudit,
        nextAudit,
        daysUntilAudit,
      };
    });
    return map;
  }

  async reportViolation(framework: string, controlId: string, severity: string): Promise<void> {
    await this.emitEvent('compliance.violation', { framework, controlId, severity });
  }

  async recalculateFrameworkScore(frameworkId: string): Promise<{
    framework: string;
    oldScore: number;
    newScore: number;
    changed: boolean;
  } | null> {
    const reg = await this.repo.getById(frameworkId);
    if (!reg) return null;

    const oldScore = reg.compliance?.score ?? 0;

    // 基于控制项重新计算: compliant=100%, partial=50%, nonCompliant=0%
    const total = reg.controlFramework.totalControls || 1;
    const compliant = reg.compliance?.compliant ?? 0;
    const partial = reg.compliance?.partial ?? 0;
    const newScore = Math.round(((compliant * 100 + partial * 50) / total) * 10) / 10;

    if (newScore !== oldScore) {
      await this.emitEvent('compliance.scoreChanged', {
        framework: reg.name,
        oldScore,
        newScore,
      });
    }

    return { framework: reg.name, oldScore, newScore, changed: newScore !== oldScore };
  }
}
