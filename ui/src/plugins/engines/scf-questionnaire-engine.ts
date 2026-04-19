/**
 * SCF 问卷引擎 — 从 Secure Controls Framework 控制项自动生成问卷
 *
 * 数据来源: scf-data.json (33 域, 1,451 控制项)
 * 支持: 合规检查、差距分析、成熟度评估、审计问卷
 */

// No external imports needed — pure data engine// ─── Types ──────────────────────────────────────────

export type QuestionnaireMode = 'assessment' | 'audit' | 'gap-analysis' | 'maturity';
export type ScoringModel = 'binary' | 'likert-5' | 'compliance-4';

export interface QuestionnaireConfig {
  domainCodes: string[];
  mode: QuestionnaireMode;
  includeMappings: boolean;
  scoringModel: ScoringModel;
  maxQuestions?: number;
}

export interface ScfQuestion {
  id: string;
  domain: string;
  domainName: string;
  text: string;
  description: string;
  category: string;
  options: QuestionOption[];
  weight: number;
  evidence: string;
  mappings: FrameworkMapping[];
}

export interface QuestionOption {
  value: string;
  label: string;
  score: number;
  color?: string;
}

export interface FrameworkMapping {
  framework: string;
  controlId: string;
  controlName?: string;
}

export interface AssessmentAnswer {
  questionId: string;
  value: string;
  score: number;
  evidence?: string;
  timestamp: number;
}

export interface DomainResult {
  domain: string;
  domainName: string;
  totalQuestions: number;
  answeredQuestions: number;
  score: number;
  maxScore: number;
  percentage: number;
  gaps: GapItem[];
  maturity: number;
}

export interface GapItem {
  controlId: string;
  domain: string;
  name: string;
  gap: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface AssessmentResult {
  overallScore: number;
  maxScore: number;
  percentage: number;
  maturityLevel: number;
  maturityLabel: string;
  domainResults: DomainResult[];
  allGaps: GapItem[];
  recommendations: string[];
  answeredCount: number;
  totalCount: number;
  completedAt: number;
}

// ─── Scoring Models ─────────────────────────────────

const SCORING_MODELS: Record<ScoringModel, QuestionOption[]> = {
  'binary': [
    { value: 'yes', label: '已实施', score: 1, color: '#22c55e' },
    { value: 'partial', label: '部分实施', score: 0.5, color: '#f59e0b' },
    { value: 'no', label: '未实施', score: 0, color: '#ef4444' },
    { value: 'na', label: '不适用', score: -1, color: '#64748b' },
  ],
  'likert-5': [
    { value: '5', label: '完全实施且持续监控', score: 5, color: '#22c55e' },
    { value: '4', label: '已实施并定期审查', score: 4, color: '#3b82f6' },
    { value: '3', label: '部分实施', score: 3, color: '#f59e0b' },
    { value: '2', label: '已规划但未实施', score: 2, color: '#f97316' },
    { value: '1', label: '未实施', score: 1, color: '#ef4444' },
    { value: '0', label: '不适用', score: 0, color: '#64748b' },
  ],
  'compliance-4': [
    { value: 'compliant', label: '合规', score: 4, color: '#22c55e' },
    { value: 'partial', label: '部分合规', score: 3, color: '#3b82f6' },
    { value: 'non-compliant', label: '不合规', score: 1, color: '#ef4444' },
    { value: 'not-assessed', label: '未评估', score: 0, color: '#64748b' },
  ],
};

// ─── SCF Domain Labels ──────────────────────────────

const SCF_DOMAIN_NAMES: Record<string, string> = {
  GOV: '安全治理', AAT: 'AI 与自主技术', AST: '资产管理', BCD: '业务连续性',
  CAP: '容量规划', CHG: '变更管理', CLD: '云安全', CPL: '合规管理',
  CFG: '配置管理', MON: '持续监控', CRY: '加密保护', DCH: '数据分类',
  EMB: '嵌入式技术', END: '终端安全', HRS: '人力资源安全', IAC: '身份认证',
  IRO: '事件响应', IAO: '信息保障', MNT: '运维管理', MDM: '移动设备管理',
  NET: '网络安全', PES: '物理环境安全', PRI: '数据隐私', PRM: '项目管理',
  RSK: '风险管理', SEA: '安全架构', OPS: '安全运营', SAT: '安全培训',
  TDA: '技术开发', TPM: '第三方管理', THR: '威胁管理', VPM: '漏洞管理',
  WEB: 'Web 安全',
};

// ─── Engine ─────────────────────────────────────────

class ScfQuestionnaireEngine {
  private scfData: { domains: Array<{ code: string; name: string; description: string; controls: Array<any> }> } | null = null;
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const mod = await import('../data/scf-compact.json');
      const raw = mod.default ?? mod;

      // scf-compact.json is an array: [{c:'GOV', n:'...', ct:38, ctrls:[{id,name,d}]}]
      if (Array.isArray(raw)) {
        this.scfData = {
          domains: raw.map((d: any) => ({
            code: d.c,
            name: d.n ?? SCF_DOMAIN_NAMES[d.c] ?? d.c,
            description: '',
            controls: (d.ctrls ?? []).map((c: any) => ({
              id: c.id,
              name: c.name,
              description: c.d ?? '',
              category: d.n ?? d.c,
              mappings: [],
            })),
          })),
        };
      } else {
        // Dict format fallback
        const compact = raw as Record<string, Array<{ id: string; name: string; d: string }>>;
        this.scfData = {
          domains: Object.entries(compact).map(([code, controls]) => ({
            code,
            name: SCF_DOMAIN_NAMES[code] ?? code,
            description: '',
            controls: controls.map(c => ({ id: c.id, name: c.name, description: c.d, category: code, mappings: [] })),
          })),
        };
      }
      this.loaded = true;
    } catch (e) {
      console.error('[SCF Engine] Failed to load SCF data:', e);
    }
  }

  /**
   * 生成问卷
   */
  generateQuestionnaire(config: QuestionnaireConfig): ScfQuestion[] {
    if (!this.scfData) return [];

    const questions: ScfQuestion[] = [];
    const options = SCORING_MODELS[config.scoringModel] ?? SCORING_MODELS['binary'];

    for (const domain of this.scfData.domains) {
      if (!config.domainCodes.includes(domain.code) && !config.domainCodes.includes('*')) continue;

      for (const ctrl of domain.controls) {
        questions.push({
          id: ctrl.id,
          domain: domain.code,
          domainName: SCF_DOMAIN_NAMES[domain.code] ?? domain.name,
          text: this._generateQuestionText(ctrl, config.mode),
          description: ctrl.description ?? ctrl.d ?? '',
          category: ctrl.category ?? SCF_DOMAIN_NAMES[domain.code] ?? domain.code,
          options,
          weight: this._calculateWeight(ctrl),
          evidence: this._generateEvidenceRequest(ctrl, config.mode),
          mappings: config.includeMappings ? this._extractMappings(ctrl) : [],
        });
      }
    }

    if (config.maxQuestions && questions.length > config.maxQuestions) {
      // Prioritize by weight, take top N
      questions.sort((a, b) => b.weight - a.weight);
      return questions.slice(0, config.maxQuestions);
    }

    return questions;
  }

  /**
   * 评估结果
   */
  assess(questions: ScfQuestion[], answers: AssessmentAnswer[]): AssessmentResult {
    const answerMap = new Map(answers.map(a => [a.questionId, a]));

    // Group by domain
    const domainMap = new Map<string, { questions: ScfQuestion[]; answers: AssessmentAnswer[] }>();
    for (const q of questions) {
      if (!domainMap.has(q.domain)) domainMap.set(q.domain, { questions: [], answers: [] });
      domainMap.get(q.domain)!.questions.push(q);
    }
    for (const a of answers) {
      const q = questions.find(q => q.id === a.questionId);
      if (q && domainMap.has(q.domain)) {
        domainMap.get(q.domain)!.answers.push(a);
      }
    }

    // Calculate domain results
    const domainResults: DomainResult[] = [];
    let totalScore = 0;
    let totalMax = 0;

    for (const [domain, data] of domainMap) {
      let dScore = 0;
      let dMax = 0;
      const gaps: GapItem[] = [];

      for (const q of data.questions) {
        const answer = answerMap.get(q.id);
        const maxOptionScore = Math.max(...q.options.map(o => o.score));
        dMax += maxOptionScore * q.weight;

        if (answer && answer.score >= 0) {
          dScore += answer.score * q.weight;
        } else if (answer && answer.score < 0) {
          // N/A — skip from scoring
          dMax -= maxOptionScore * q.weight;
        }

        // Gap detection
        if (answer && answer.score >= 0 && answer.score < maxOptionScore * 0.6) {
          gaps.push({
            controlId: q.id,
            domain,
            name: q.text.substring(0, 50),
            gap: this._describeGap(q, answer),
            severity: this._gapSeverity(q, answer, maxOptionScore),
            recommendation: this._recommendFix(q),
          });
        }
      }

      const pct = dMax > 0 ? Math.round((dScore / dMax) * 100) : 0;
      totalScore += dScore;
      totalMax += dMax;

      domainResults.push({
        domain,
        domainName: SCF_DOMAIN_NAMES[domain] ?? domain,
        totalQuestions: data.questions.length,
        answeredQuestions: data.answers.length,
        score: Math.round(dScore),
        maxScore: Math.round(dMax),
        percentage: pct,
        gaps,
        maturity: this._maturityFromScore(pct),
      });
    }

    const overallPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    const allGaps = domainResults.flatMap(d => d.gaps);
    allGaps.sort((a, b) => {
      const sev = { critical: 0, high: 1, medium: 2, low: 3 };
      return (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3);
    });

    return {
      overallScore: Math.round(totalScore),
      maxScore: Math.round(totalMax),
      percentage: overallPct,
      maturityLevel: this._maturityFromScore(overallPct),
      maturityLabel: this._maturityLabel(this._maturityFromScore(overallPct)),
      domainResults,
      allGaps,
      recommendations: this._generateRecommendations(domainResults, allGaps),
      answeredCount: answers.filter(a => a.score >= 0).length,
      totalCount: questions.length,
      completedAt: Date.now(),
    };
  }

  /**
   * 获取域概览
   */
  getDomainOverview(): Array<{ code: string; name: string; controlCount: number }> {
    if (!this.scfData) return [];
    return this.scfData.domains.map(d => ({
      code: d.code,
      name: SCF_DOMAIN_NAMES[d.code] ?? d.name,
      controlCount: d.controls.length,
    }));
  }

  // ─── Private helpers ──────────────────────────────

  private _generateQuestionText(ctrl: any, mode: QuestionnaireMode): string {
    const name = ctrl.name ?? '';
    const desc = ctrl.description ?? ctrl.d ?? '';

    switch (mode) {
      case 'audit':
        return `是否满足"${name}"要求？`;
      case 'gap-analysis':
        return `"${name}"的实施现状如何？`;
      case 'maturity':
        return `"${name}"的成熟度水平？`;
      default:
        return name.endsWith('？') || name.endsWith('?') ? name : `是否已实施"${name}"？`;
    }
  }

  private _generateEvidenceRequest(ctrl: any, mode: QuestionnaireMode): string {
    const name = ctrl.name ?? '';
    if (mode === 'audit' || mode === 'gap-analysis') {
      return `请提供"${name}"相关证据：策略文档、配置截图、审计报告等`;
    }
    return '';
  }

  private _calculateWeight(ctrl: any): number {
    // Higher weight for controls with more framework mappings
    const mappings = ctrl.mappings ?? [];
    return Math.min(1 + mappings.length * 0.1, 2.0);
  }

  private _extractMappings(ctrl: any): FrameworkMapping[] {
    const mappings = ctrl.mappings ?? [];
    return mappings.slice(0, 5).map((m: any) => ({
      framework: m.framework ?? m.source ?? '?',
      controlId: m.controlId ?? m.external_id ?? '',
      controlName: m.controlName ?? '',
    }));
  }

  private _describeGap(q: ScfQuestion, a: AssessmentAnswer): string {
    if (a.score === 0) return `"${q.text.substring(0, 30)}"完全未实施`;
    return `"${q.text.substring(0, 30)}"实施不充分，得分 ${a.score.toFixed(1)}`;
  }

  private _gapSeverity(q: ScfQuestion, a: AssessmentAnswer, max: number): GapItem['severity'] {
    const ratio = max > 0 ? a.score / max : 0;
    if (ratio === 0 && q.weight >= 1.5) return 'critical';
    if (ratio < 0.3) return 'high';
    if (ratio < 0.6) return 'medium';
    return 'low';
  }

  private _recommendFix(q: ScfQuestion): string {
    return `建议优先实施"${q.text.substring(0, 40)}"，参考控制项 ${q.id}`;
  }

  private _maturityFromScore(pct: number): number {
    if (pct >= 90) return 5;
    if (pct >= 75) return 4;
    if (pct >= 55) return 3;
    if (pct >= 35) return 2;
    return 1;
  }

  private _maturityLabel(level: number): string {
    const labels = ['', '初始', '可重复', '已定义', '已管理', '优化'];
    return labels[level] ?? '未知';
  }

  private _generateRecommendations(domainResults: DomainResult[], gaps: GapItem[]): string[] {
    const recs: string[] = [];

    // Critical domains below threshold
    for (const dr of domainResults) {
      if (dr.percentage < 50) {
        recs.push(`🚨 ${dr.domainName} 域得分仅 ${dr.percentage}%，需立即整改`);
      } else if (dr.percentage < 75) {
        recs.push(`⚠️ ${dr.domainName} 域得分 ${dr.percentage}%，建议制定改进计划`);
      }
    }

    // Top gaps
    const criticalGaps = gaps.filter(g => g.severity === 'critical').slice(0, 3);
    for (const g of criticalGaps) {
      recs.push(`🔴 关键差距: ${g.controlId} — ${g.recommendation}`);
    }

    if (recs.length === 0) {
      recs.push('✅ 所有评估域均达到基本合规水平');
    }

    return recs;
  }
}

// Singleton
export const scfQuestionnaireEngine = new ScfQuestionnaireEngine();
