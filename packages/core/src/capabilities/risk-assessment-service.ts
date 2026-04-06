import type { JsonStore } from '../storage/json-store.js';

const logger = {
  info: (...args: any[]) => console.log('[RiskAssessmentService]', ...args),
  error: (...args: any[]) => console.error('[RiskAssessmentService]', ...args),
  warn: (...args: any[]) => console.warn('[RiskAssessmentService]', ...args),
  debug: (...args: any[]) => console.log('[RiskAssessmentService:DEBUG]', ...args),
};

export interface RiskFactor {
  id: string;
  name: string;
  description: string;
  category: 'threat' | 'vulnerability' | 'asset' | 'process' | 'people';
  likelihood: number;
  impact: number;
  score: number;
  status: 'active' | 'mitigated' | 'monitored' | 'accepted';
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface RiskAssessment {
  id: string;
  name: string;
  description: string;
  factors: RiskFactor[];
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  assessmentDate: number;
  assessor: string;
  recommendations: string[];
  createdAt: number;
  updatedAt: number;
}

export interface RiskMetrics {
  totalRisks: number;
  byRiskLevel: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byCategory: Record<string, number>;
  avgRiskScore: number;
  topRisks: RiskFactor[];
  trend: {
    currentScore: number;
    previousScore: number;
    change: number;
  };
}

// Prediction entry storage for Monte Carlo / forecast data
export interface RiskPredictionEntry {
  id: string;
  days: number;
  createdAt: number;
  predictions: {
    date: string;
    predictedScore: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
  }[];
  summary: {
    currentScore: number;
    predictedScore: number;
    trend: 'up' | 'down' | 'stable';
    confidence: number;
  };
}

export class RiskAssessmentService {
  private assessments: Map<string, RiskAssessment> = new Map();
  private factors: Map<string, RiskFactor> = new Map();
  private jsonStore: JsonStore | undefined;
  // In-memory store for generated predictions (persisted if jsonStore is provided)
  private predictions: Map<string, RiskPredictionEntry> = new Map();

  constructor(store?: JsonStore) {
    this.jsonStore = store;
  }

  async initialize(): Promise<void> {
    if (this.jsonStore) {
      try {
        const savedAssessments = await this.jsonStore.get<RiskAssessment[]>('risk-assessments.json');
        if (savedAssessments) {
          for (const assessment of savedAssessments) {
            this.assessments.set(assessment.id, assessment);
          }
          logger.info(`Loaded ${savedAssessments.length} saved risk assessments`);
        }

        const savedFactors = await this.jsonStore.get<RiskFactor[]>('risk-factors.json');
        if (savedFactors) {
          for (const factor of savedFactors) {
            this.factors.set(factor.id, factor);
          }
          logger.info(`Loaded ${savedFactors.length} saved risk factors`);
        }

        const savedPredictions = await this.jsonStore.get<RiskPredictionEntry[]>('risk-predictions.json');
        if (savedPredictions) {
          for (const p of savedPredictions) {
            this.predictions.set(p.id, p);
          }
          logger.info(`Loaded ${savedPredictions.length} saved risk predictions`);
        }
      } catch (error) {
        logger.warn('Could not load saved risk data:', error);
      }
    }
  }

  private async saveRiskData(): Promise<void> {
    if (this.jsonStore) {
      const assessmentsArray = Array.from(this.assessments.values());
      const factorsArray = Array.from(this.factors.values());
      await this.jsonStore.set('risk-assessments.json', assessmentsArray);
      await this.jsonStore.set('risk-factors.json', factorsArray);
      // Persist any in-memory predictions if we have them
      if (this.predictions.size > 0) {
        await this.jsonStore.set('risk-predictions.json', Array.from(this.predictions.values()));
      }
    }
  }

  calculateRiskScore(likelihood: number, impact: number): number {
    return likelihood * impact;
  }

  determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  async createRiskFactor(
    name: string,
    description: string,
    category: RiskFactor['category'],
    likelihood: number,
    impact: number,
    options?: {
      tags?: string[];
      status?: RiskFactor['status'];
    }
  ): Promise<RiskFactor> {
    const now = Date.now();
    const factor: RiskFactor = {
      id: `risk_${now}_${Math.random().toString(36).substring(2, 11)}`,
      name,
      description,
      category,
      likelihood,
      impact,
      score: this.calculateRiskScore(likelihood, impact),
      status: options?.status || 'active',
      tags: options?.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    this.factors.set(factor.id, factor);
    logger.info(`Created risk factor: ${factor.id}`);
    await this.saveRiskData();
    return factor;
  }

  async updateRiskFactor(
    factorId: string,
    updates: Partial<Omit<RiskFactor, 'id' | 'createdAt'>>
  ): Promise<RiskFactor> {
    const factor = this.factors.get(factorId);
    if (!factor) {
      throw new Error(`Risk factor not found: ${factorId}`);
    }

    let newScore = factor.score;
    if (updates.likelihood !== undefined || updates.impact !== undefined) {
      newScore = this.calculateRiskScore(
        updates.likelihood ?? factor.likelihood,
        updates.impact ?? factor.impact
      );
    }

    const updatedFactor: RiskFactor = {
      ...factor,
      ...updates,
      score: newScore,
      updatedAt: Date.now(),
    };

    this.factors.set(factorId, updatedFactor);
    await this.saveRiskData();
    return updatedFactor;
  }

  async deleteRiskFactor(factorId: string): Promise<void> {
    if (!this.factors.has(factorId)) {
      throw new Error(`Risk factor not found: ${factorId}`);
    }
    this.factors.delete(factorId);
    await this.saveRiskData();
  }

  async getRiskFactor(factorId: string): Promise<RiskFactor> {
    const factor = this.factors.get(factorId);
    if (!factor) {
      throw new Error(`Risk factor not found: ${factorId}`);
    }
    return factor;
  }

  async listRiskFactors(options?: {
    category?: RiskFactor['category'];
    status?: RiskFactor['status'];
    riskLevel?: RiskAssessment['riskLevel'];
    limit?: number;
    offset?: number;
  }): Promise<RiskFactor[]> {
    let factors = Array.from(this.factors.values());

    if (options?.category) {
      factors = factors.filter(f => f.category === options.category);
    }
    if (options?.status) {
      factors = factors.filter(f => f.status === options.status);
    }
    if (options?.riskLevel) {
      factors = factors.filter(f => {
        const level = this.determineRiskLevel(f.score);
        return level === options.riskLevel;
      });
    }

    factors.sort((a, b) => b.score - a.score);

    if (options?.limit) {
      const offset = options.offset || 0;
      factors = factors.slice(offset, offset + options.limit);
    }

    return factors;
  }

  async createRiskAssessment(
    name: string,
    description: string,
    assessor: string,
    factorIds?: string[]
  ): Promise<RiskAssessment> {
    const now = Date.now();
    const factorsToAssess = factorIds 
      ? factorIds.map(id => this.factors.get(id)).filter(f => f !== undefined) as RiskFactor[]
      : Array.from(this.factors.values());

    const overallRiskScore = factorsToAssess.length > 0 
      ? factorsToAssess.reduce((sum, f) => sum + f.score, 0) / factorsToAssess.length
      : 0;

    const assessment: RiskAssessment = {
      id: `assessment_${now}_${Math.random().toString(36).substring(2, 11)}`,
      name,
      description,
      factors: factorsToAssess,
      overallRiskScore,
      riskLevel: this.determineRiskLevel(overallRiskScore),
      assessmentDate: now,
      assessor,
      recommendations: this.generateRecommendations(factorsToAssess),
      createdAt: now,
      updatedAt: now,
    };

    this.assessments.set(assessment.id, assessment);
    logger.info(`Created risk assessment: ${assessment.id}`);
    await this.saveRiskData();
    return assessment;
  }

  private generateRecommendations(factors: RiskFactor[]): string[] {
    const recommendations: string[] = [];
    const criticalFactors = factors.filter(f => this.determineRiskLevel(f.score) === 'critical');
    const highFactors = factors.filter(f => this.determineRiskLevel(f.score) === 'high');

    if (criticalFactors.length > 0) {
      recommendations.push(`Address ${criticalFactors.length} critical risk factors immediately`);
    }
    if (highFactors.length > 0) {
      recommendations.push(`Prioritize ${highFactors.length} high-risk factors within 30 days`);
    }
    if (factors.some(f => f.category === 'vulnerability')) {
      recommendations.push('Conduct regular vulnerability scanning');
    }
    if (factors.some(f => f.category === 'people')) {
      recommendations.push('Implement security awareness training');
    }

    return recommendations;
  }

  async getRiskMetrics(): Promise<RiskMetrics> {
    const activeFactors = Array.from(this.factors.values()).filter(f => f.status === 'active');
    const total = activeFactors.length;

    const byRiskLevel = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const factor of activeFactors) {
      const level = this.determineRiskLevel(factor.score);
      byRiskLevel[level]++;
    }

    const byCategory: Record<string, number> = {};
    for (const factor of activeFactors) {
      byCategory[factor.category] = (byCategory[factor.category] || 0) + 1;
    }

    const avgRiskScore = total > 0 
      ? activeFactors.reduce((sum, f) => sum + f.score, 0) / total 
      : 0;

    const topRisks = [...activeFactors]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      totalRisks: total,
      byRiskLevel,
      byCategory,
      avgRiskScore,
      topRisks,
      trend: {
        currentScore: avgRiskScore,
        previousScore: avgRiskScore,
        change: 0,
      },
    };
  }

  // Persisted prediction helpers
  async savePrediction(entry: RiskPredictionEntry): Promise<void> {
    this.predictions.set(entry.id, entry);
    await this.saveRiskData();
  }

  async listPredictions(): Promise<RiskPredictionEntry[]> {
    return Array.from(this.predictions.values());
  }

  async getPrediction(id: string): Promise<RiskPredictionEntry> {
    const p = this.predictions.get(id);
    if (!p) throw new Error(`Prediction not found: ${id}`);
    return p;
  }

  async simulatePrediction(days?: number): Promise<RiskPredictionEntry> {
    const horizon = days && days > 0 ? days : 7;
    const metrics = await this.getRiskMetrics();
    const currentScore = metrics?.avgRiskScore ?? 72;

    // Monte Carlo simulation: 100 trials over the horizon
    const trials = 100;
    const sums = new Array(horizon).fill(0);
    for (let t = 0; t < trials; t++) {
      let score = currentScore;
      for (let d = 0; d < horizon; d++) {
        // small random walk
        score = Math.max(0, Math.min(100, score + (Math.random() - 0.5) * 4));
        sums[d] += score;
      }
    }
    const avgPred = sums.map(s => Math.round(s / trials));

    const dates: string[] = [];
    for (let i = 0; i < horizon; i++) {
      const date = new Date(Date.now() + (i + 1) * 86400000);
      dates.push(date.toISOString().split('T')[0]);
    }

    const predictions = dates.map((date, idx) => {
      const predictedScore = avgPred[idx];
      const confidence = Math.max(50, Math.round(60 + (1 - idx / horizon) * 35));
      const diff = predictedScore - currentScore;
      const trend: 'up' | 'down' | 'stable' = diff > 2 ? 'up' : diff < -2 ? 'down' : 'stable';
      return { date, predictedScore, confidence, trend };
    });

    const finalScore = predictions[predictions.length - 1]?.predictedScore ?? currentScore;
    const overallTrend = finalScore > currentScore + 3 ? 'up' : finalScore < currentScore - 3 ? 'down' : 'stable';
    const entry: RiskPredictionEntry = {
      id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      days: horizon,
      createdAt: Date.now(),
      predictions,
      summary: {
        currentScore,
        predictedScore: finalScore,
        trend: overallTrend,
        confidence: predictions[0]?.confidence ?? 85,
      },
    };

    await this.savePrediction(entry);
    return entry;
  }
}

export let riskAssessmentService: RiskAssessmentService | undefined;

export function initRiskAssessmentService(store?: JsonStore): RiskAssessmentService {
  riskAssessmentService = new RiskAssessmentService(store);
  return riskAssessmentService;
}

export function getRiskAssessmentService(): RiskAssessmentService {
  if (!riskAssessmentService) {
    throw new Error('RiskAssessmentService not initialized');
  }
  return riskAssessmentService;
}
