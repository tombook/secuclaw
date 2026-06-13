import type { JsonStore } from '../storage/json-store.js';
import { randomUUID } from 'crypto';

export type ModelRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type ModelStatus = 'active' | 'deprecated' | 'testing' | 'retired';
export type AttackSurfaceStatus = 'secure' | 'at_risk' | 'compromised' | 'unknown';

export interface AIModelAsset {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  version: string;
  status: ModelStatus;
  riskLevel: ModelRiskLevel;
  endpoint: string;
  capabilities: string[];
  dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
  accessControl: {
    allowedRoles: string[];
    allowedUsers: string[];
    rateLimit: number;
  };
  securityConfig: {
    inputSanitization: boolean;
    outputValidation: boolean;
    contentFiltering: boolean;
    piiRedaction: boolean;
    maxTokenLimit: number;
  };
  lastSecurityScan: number | null;
  deployedAt: number;
  metadata: Record<string, unknown>;
}

export interface DriftReport {
  id: string;
  modelId: string;
  timestamp: number;
  driftType: 'output' | 'input' | 'performance' | 'behavior' | 'config';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  baselineMetrics: Record<string, number>;
  currentMetrics: Record<string, number>;
  delta: Record<string, number>;
  recommendation: string;
}

export interface AttackSurfaceAssessment {
  id: string;
  modelId: string;
  timestamp: number;
  status: AttackSurfaceStatus;
  vulnerabilities: Array<{
    type: string;
    description: string;
    severity: ModelRiskLevel;
    evidence: string;
  }>;
  promptInjectionScore: number;
  dataExfiltrationScore: number;
  jailbreakScore: number;
  toxicityScore: number;
  overallScore: number;
  recommendations: string[];
}

export interface AISPMReport {
  id: string;
  timestamp: number;
  totalModels: number;
  modelsByRisk: Record<ModelRiskLevel, number>;
  driftAlerts: number;
  attackSurfaceSummary: { secure: number; atRisk: number; compromised: number };
  complianceScore: number;
  findings: Array<{
    modelId: string;
    modelName: string;
    category: string;
    severity: ModelRiskLevel;
    description: string;
  }>;
}

const STORE_KEYS = {
  models: 'ai-spm/models.json',
  driftReports: 'ai-spm/drift-reports.json',
  attackSurface: 'ai-spm/attack-surface.json',
  reports: 'ai-spm/reports.json',
} as const;

export class AISPMService {
  constructor(private store: JsonStore) {}

  async registerModel(model: Omit<AIModelAsset, 'id'>): Promise<AIModelAsset> {
    const models = await this.loadModels();
    const asset: AIModelAsset = {
      ...model,
      id: this.generateId(),
    };
    models.push(asset);
    await this.store.set(STORE_KEYS.models, models);
    return asset;
  }

  async updateModel(modelId: string, updates: Partial<AIModelAsset>): Promise<AIModelAsset | null> {
    const models = await this.loadModels();
    const index = models.findIndex((m) => m.id === modelId);
    if (index === -1) return null;

    const updated: AIModelAsset = {
      ...models[index],
      ...updates,
      id: models[index].id,
    };
    models[index] = updated;
    await this.store.set(STORE_KEYS.models, models);
    return updated;
  }

  async retireModel(modelId: string): Promise<boolean> {
    const models = await this.loadModels();
    const index = models.findIndex((m) => m.id === modelId);
    if (index === -1) return false;

    models[index].status = 'retired';
    await this.store.set(STORE_KEYS.models, models);
    return true;
  }

  async getModel(modelId: string): Promise<AIModelAsset | null> {
    const models = await this.loadModels();
    return models.find((m) => m.id === modelId) ?? null;
  }

  async listModels(filters?: {
    provider?: string;
    status?: ModelStatus;
    riskLevel?: ModelRiskLevel;
  }): Promise<AIModelAsset[]> {
    let models = await this.loadModels();
    if (filters?.provider) {
      models = models.filter((m) => m.provider === filters.provider);
    }
    if (filters?.status) {
      models = models.filter((m) => m.status === filters.status);
    }
    if (filters?.riskLevel) {
      models = models.filter((m) => m.riskLevel === filters.riskLevel);
    }
    return models;
  }

  async detectDrift(
    modelId: string,
    baselineMetrics: Record<string, number>,
    currentMetrics: Record<string, number>,
  ): Promise<DriftReport> {
    const delta: Record<string, number> = {};
    const keys = new Set([...Object.keys(baselineMetrics), ...Object.keys(currentMetrics)]);
    let totalDelta = 0;

    for (const key of keys) {
      const baseline = baselineMetrics[key] ?? 0;
      const current = currentMetrics[key] ?? 0;
      const diff = current - baseline;
      delta[key] = diff;
      totalDelta += Math.abs(diff);
    }

    const avgDelta = keys.size > 0 ? totalDelta / keys.size : 0;
    const severity = avgDelta >= 25 ? 'critical' : avgDelta >= 15 ? 'high' : avgDelta >= 5 ? 'medium' : 'low';

    const driftTypes: Array<DriftReport['driftType']> = ['output', 'input', 'performance', 'behavior', 'config'];
    const driftType = driftTypes.find((_, i) => {
      const metricKeys = Object.keys(delta);
      return metricKeys.some((k) => k.toLowerCase().includes(driftTypes[i]));
    }) ?? 'performance';

    const report: DriftReport = {
      id: this.generateId(),
      modelId,
      timestamp: Date.now(),
      driftType,
      severity,
      description: `Detected ${severity} ${driftType} drift with average delta ${avgDelta.toFixed(2)}`,
      baselineMetrics,
      currentMetrics,
      delta,
      recommendation:
        severity === 'critical'
          ? 'Immediate investigation required. Consider rolling back to previous model version.'
          : severity === 'high'
            ? 'Schedule review within 24 hours. Monitor closely for further degradation.'
            : severity === 'medium'
              ? 'Add to monitoring watchlist. Review during next assessment cycle.'
              : 'Within acceptable range. Continue standard monitoring.',
    };

    const reports = await this.loadDriftReports();
    reports.push(report);
    await this.store.set(STORE_KEYS.driftReports, reports);

    return report;
  }

  async getDriftHistory(modelId: string, limit?: number): Promise<DriftReport[]> {
    const reports = await this.loadDriftReports();
    const filtered = reports
      .filter((r) => r.modelId === modelId)
      .sort((a, b) => b.timestamp - a.timestamp);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  async assessAttackSurface(modelId: string): Promise<AttackSurfaceAssessment> {
    const model = await this.getModel(modelId);
    const vulnerabilities: AttackSurfaceAssessment['vulnerabilities'] = [];

    if (!model) {
      return {
        id: this.generateId(),
        modelId,
        timestamp: Date.now(),
        status: 'unknown',
        vulnerabilities: [],
        promptInjectionScore: 0,
        dataExfiltrationScore: 0,
        jailbreakScore: 0,
        toxicityScore: 0,
        overallScore: 0,
        recommendations: ['Model not found. Register the model before assessment.'],
      };
    }

    let promptInjectionScore = 10;
    let dataExfiltrationScore = 10;
    let jailbreakScore = 10;
    let toxicityScore = 10;

    if (!model.securityConfig.inputSanitization) {
      vulnerabilities.push({
        type: 'prompt_injection',
        description: 'Input sanitization is not enabled',
        severity: 'high',
        evidence: 'inputSanitization=false in security configuration',
      });
      promptInjectionScore += 30;
    }

    if (!model.securityConfig.outputValidation) {
      vulnerabilities.push({
        type: 'output_integrity',
        description: 'Output validation is not enabled',
        severity: 'medium',
        evidence: 'outputValidation=false in security configuration',
      });
      dataExfiltrationScore += 20;
    }

    if (!model.securityConfig.contentFiltering) {
      vulnerabilities.push({
        type: 'content_safety',
        description: 'Content filtering is not enabled',
        severity: 'high',
        evidence: 'contentFiltering=false in security configuration',
      });
      toxicityScore += 35;
      jailbreakScore += 15;
    }

    if (!model.securityConfig.piiRedaction) {
      vulnerabilities.push({
        type: 'data_leakage',
        description: 'PII redaction is not enabled',
        severity: 'critical',
        evidence: 'piiRedaction=false in security configuration',
      });
      dataExfiltrationScore += 40;
    }

    if (model.dataClassification === 'restricted' || model.dataClassification === 'confidential') {
      if (model.accessControl.rateLimit > 100) {
        vulnerabilities.push({
          type: 'rate_limit',
          description: `High rate limit (${model.accessControl.rateLimit}) for ${model.dataClassification} data model`,
          severity: 'medium',
          evidence: `rateLimit=${model.accessControl.rateLimit} with dataClassification=${model.dataClassification}`,
        });
        dataExfiltrationScore += 10;
      }

      if (model.accessControl.allowedRoles.length === 0 && model.accessControl.allowedUsers.length === 0) {
        vulnerabilities.push({
          type: 'access_control',
          description: `No access restrictions on ${model.dataClassification} data model`,
          severity: 'critical',
          evidence: `empty allowedRoles and allowedUsers for dataClassification=${model.dataClassification}`,
        });
        dataExfiltrationScore += 25;
        jailbreakScore += 20;
      }
    }

    if (model.endpoint.startsWith('http://')) {
      vulnerabilities.push({
        type: 'transport_security',
        description: 'Model endpoint uses insecure HTTP',
        severity: 'critical',
        evidence: `endpoint=${model.endpoint}`,
      });
      dataExfiltrationScore += 30;
    }

    if (model.status === 'deprecated') {
      vulnerabilities.push({
        type: 'lifecycle',
        description: 'Model is deprecated but still accessible',
        severity: 'medium',
        evidence: `status=${model.status}`,
      });
      promptInjectionScore += 5;
    }

    promptInjectionScore = Math.min(100, promptInjectionScore);
    dataExfiltrationScore = Math.min(100, dataExfiltrationScore);
    jailbreakScore = Math.min(100, jailbreakScore);
    toxicityScore = Math.min(100, toxicityScore);

    const partial: Partial<AttackSurfaceAssessment> = {
      promptInjectionScore,
      dataExfiltrationScore,
      jailbreakScore,
      toxicityScore,
    };
    const overallScore = this.computeOverallScore(partial);
    const criticalCount = vulnerabilities.filter((v) => v.severity === 'critical').length;
    const highCount = vulnerabilities.filter((v) => v.severity === 'high').length;
    const status: AttackSurfaceStatus =
      criticalCount > 0 ? 'compromised' : highCount > 0 ? 'at_risk' : 'secure';

    const recommendations: string[] = [];
    if (!model.securityConfig.inputSanitization) recommendations.push('Enable input sanitization to mitigate prompt injection attacks');
    if (!model.securityConfig.outputValidation) recommendations.push('Enable output validation to prevent data leakage');
    if (!model.securityConfig.contentFiltering) recommendations.push('Enable content filtering to reduce toxic output risk');
    if (!model.securityConfig.piiRedaction) recommendations.push('Enable PII redaction to protect sensitive data');
    if (model.endpoint.startsWith('http://')) recommendations.push('Migrate endpoint to HTTPS for transport security');
    if (model.accessControl.allowedRoles.length === 0) recommendations.push('Define role-based access controls');
    if (model.status === 'deprecated') recommendations.push('Retire or replace deprecated model');

    const assessment: AttackSurfaceAssessment = {
      id: this.generateId(),
      modelId,
      timestamp: Date.now(),
      status,
      vulnerabilities,
      promptInjectionScore,
      dataExfiltrationScore,
      jailbreakScore,
      toxicityScore,
      overallScore,
      recommendations,
    };

    const history = await this.loadAttackSurfaceHistory();
    history.push(assessment);
    await this.store.set(STORE_KEYS.attackSurface, history);

    return assessment;
  }

  async getAttackSurfaceHistory(modelId: string, limit?: number): Promise<AttackSurfaceAssessment[]> {
    const history = await this.loadAttackSurfaceHistory();
    const filtered = history
      .filter((a) => a.modelId === modelId)
      .sort((a, b) => b.timestamp - a.timestamp);
    return limit ? filtered.slice(0, limit) : filtered;
  }

  async generateReport(): Promise<AISPMReport> {
    const models = await this.loadModels();
    const driftReports = await this.loadDriftReports();
    const attackSurfaceHistory = await this.loadAttackSurfaceHistory();

    const modelsByRisk: Record<ModelRiskLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };
    for (const model of models) {
      modelsByRisk[model.riskLevel]++;
    }

    const latestAssessments = new Map<string, AttackSurfaceAssessment>();
    for (const assessment of attackSurfaceHistory) {
      const existing = latestAssessments.get(assessment.modelId);
      if (!existing || assessment.timestamp > existing.timestamp) {
        latestAssessments.set(assessment.modelId, assessment);
      }
    }

    let secure = 0;
    let atRisk = 0;
    let compromised = 0;
    for (const assessment of latestAssessments.values()) {
      if (assessment.status === 'secure') secure++;
      else if (assessment.status === 'at_risk') atRisk++;
      else if (assessment.status === 'compromised') compromised++;
    }

    const findings: AISPMReport['findings'] = [];
    for (const model of models) {
      if (model.riskLevel === 'critical' || model.riskLevel === 'high') {
        findings.push({
          modelId: model.id,
          modelName: model.name,
          category: 'risk',
          severity: model.riskLevel,
          description: `Model has ${model.riskLevel} risk level`,
        });
      }
    }

    for (const report of driftReports) {
      if (report.severity === 'critical' || report.severity === 'high') {
        const model = models.find((m) => m.id === report.modelId);
        findings.push({
          modelId: report.modelId,
          modelName: model?.name ?? 'Unknown',
          category: 'drift',
          severity: report.severity as ModelRiskLevel,
          description: report.description,
        });
      }
    }

    for (const assessment of latestAssessments.values()) {
      for (const vuln of assessment.vulnerabilities) {
        if (vuln.severity === 'critical' || vuln.severity === 'high') {
          const model = models.find((m) => m.id === assessment.modelId);
          findings.push({
            modelId: assessment.modelId,
            modelName: model?.name ?? 'Unknown',
            category: 'vulnerability',
            severity: vuln.severity,
            description: vuln.description,
          });
        }
      }
    }

    findings.sort((a, b) => {
      const order: Record<ModelRiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity];
    });

    const totalSecurityEnabled = models.reduce(
      (sum, m) =>
        sum +
        (m.securityConfig.inputSanitization ? 1 : 0) +
        (m.securityConfig.outputValidation ? 1 : 0) +
        (m.securityConfig.contentFiltering ? 1 : 0) +
        (m.securityConfig.piiRedaction ? 1 : 0),
      0,
    );
    const maxSecurity = models.length * 4;
    const complianceScore =
      maxSecurity > 0 ? Math.round((totalSecurityEnabled / maxSecurity) * 100) : 100;

    const report: AISPMReport = {
      id: this.generateId(),
      timestamp: Date.now(),
      totalModels: models.length,
      modelsByRisk,
      driftAlerts: driftReports.filter(
        (r) => r.severity === 'critical' || r.severity === 'high',
      ).length,
      attackSurfaceSummary: { secure, atRisk, compromised },
      complianceScore,
      findings,
    };

    const reports = await this.loadReports();
    reports.push(report);
    await this.store.set(STORE_KEYS.reports, reports);

    return report;
  }

  async getComplianceReport(
    framework: 'EU-AI-Act' | 'NIST-AI-RMF' | 'ISO-42001',
  ): Promise<Record<string, unknown>> {
    const models = await this.loadModels();
    const latestAssessments = await this.loadAttackSurfaceHistory();

    const modelSummaries = models.map((m) => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      modelId: m.modelId,
      status: m.status,
      riskLevel: m.riskLevel,
      dataClassification: m.dataClassification,
    }));

    const securityOverview = {
      totalModels: models.length,
      withInputSanitization: models.filter((m) => m.securityConfig.inputSanitization).length,
      withOutputValidation: models.filter((m) => m.securityConfig.outputValidation).length,
      withContentFiltering: models.filter((m) => m.securityConfig.contentFiltering).length,
      withPiiRedaction: models.filter((m) => m.securityConfig.piiRedaction).length,
    };

    if (framework === 'EU-AI-Act') {
      const highRiskModels = models.filter(
        (m) => m.riskLevel === 'high' || m.riskLevel === 'critical',
      );
      return {
        framework: 'EU-AI-Act',
        generatedAt: Date.now(),
        riskClassification: {
          prohibited: models.filter((m) => m.dataClassification === 'restricted' && m.status === 'active').length,
          highRisk: highRiskModels.length,
          limitedRisk: models.filter((m) => m.riskLevel === 'medium').length,
          minimalRisk: models.filter((m) => m.riskLevel === 'low').length,
        },
        transparencyRequirements: {
          modelsRequiringDisclosure: models.filter((m) => m.status === 'active').length,
          humanOversightImplemented: highRiskModels.filter(
            (m) => m.accessControl.allowedRoles.length > 0,
          ).length,
        },
        dataGovernance: {
          restrictedDataModels: models.filter((m) => m.dataClassification === 'restricted').length,
          piiProtectionEnabled: models.filter((m) => m.securityConfig.piiRedaction).length,
        },
        models: modelSummaries,
        securityOverview,
      };
    }

    if (framework === 'NIST-AI-RMF') {
      return {
        framework: 'NIST-AI-RMF',
        generatedAt: Date.now(),
        govern: {
          policiesEstablished: models.length > 0,
          rolesDefined: models.filter((m) => m.accessControl.allowedRoles.length > 0).length,
          riskToleranceDocumented: true,
        },
        map: {
          totalModels: models.length,
          modelsByRisk: models.reduce(
            (acc, m) => {
              acc[m.riskLevel] = (acc[m.riskLevel] || 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
          contextEstablished: modelSummaries,
        },
        measure: {
          assessmentsConducted: latestAssessments.length,
          securityOverview,
        },
        manage: {
          mitigationsInPlace: models.filter(
            (m) =>
              m.securityConfig.inputSanitization &&
              m.securityConfig.outputValidation &&
              m.securityConfig.contentFiltering,
          ).length,
          outstandingRisks: models.filter(
            (m) => m.riskLevel === 'critical' || m.riskLevel === 'high',
          ).length,
        },
      };
    }

    return {
      framework: 'ISO-42001',
      generatedAt: Date.now(),
      scope: {
        totalModels: models.length,
        providers: [...new Set(models.map((m) => m.provider))],
      },
      leadership: {
        aiPolicyEstablished: models.length > 0,
        responsibilitiesAssigned: models.filter((m) => m.accessControl.allowedRoles.length > 0).length > 0,
      },
      planning: {
        riskAssessmentComplete: latestAssessments.length > 0,
        objectivesSet: true,
      },
      support: {
        competency: securityOverview,
        awareness: models.filter((m) => m.securityConfig.contentFiltering).length,
      },
      operation: {
        operationalControls: securityOverview,
        changeManagement: models.filter((m) => m.version).length,
      },
      performance: {
        monitoring: latestAssessments.length,
        incidents: models.filter((m) => m.riskLevel === 'critical').length,
      },
      improvement: {
        continuousImprovement: true,
        correctiveActions: models.filter(
          (m) => !m.securityConfig.inputSanitization || !m.securityConfig.piiRedaction,
        ).length,
      },
    };
  }

  async getLatestReport(): Promise<AISPMReport | null> {
    const reports = await this.loadReports();
    if (reports.length === 0) return null;
    return reports.sort((a, b) => b.timestamp - a.timestamp)[0];
  }

  private computeRiskLevel(model: AIModelAsset): ModelRiskLevel {
    let score = 0;

    if (model.dataClassification === 'restricted') score += 40;
    else if (model.dataClassification === 'confidential') score += 30;
    else if (model.dataClassification === 'internal') score += 15;

    if (!model.securityConfig.inputSanitization) score += 15;
    if (!model.securityConfig.outputValidation) score += 10;
    if (!model.securityConfig.contentFiltering) score += 15;
    if (!model.securityConfig.piiRedaction) score += 20;

    if (model.accessControl.allowedRoles.length === 0) score += 10;
    if (model.accessControl.rateLimit > 200) score += 5;

    if (model.endpoint.startsWith('http://')) score += 15;

    if (score >= 75) return 'critical';
    if (score >= 50) return 'high';
    if (score >= 25) return 'medium';
    return 'low';
  }

  private computeOverallScore(assessment: Partial<AttackSurfaceAssessment>): number {
    const scores = [
      assessment.promptInjectionScore ?? 0,
      assessment.dataExfiltrationScore ?? 0,
      assessment.jailbreakScore ?? 0,
      assessment.toxicityScore ?? 0,
    ];
    const max = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return Math.round(max * 0.6 + avg * 0.4);
  }

  private generateId(): string {
    return randomUUID();
  }

  private async loadModels(): Promise<AIModelAsset[]> {
    const data = await this.store.get<AIModelAsset[]>(STORE_KEYS.models);
    return data ?? [];
  }

  private async loadDriftReports(): Promise<DriftReport[]> {
    const data = await this.store.get<DriftReport[]>(STORE_KEYS.driftReports);
    return data ?? [];
  }

  private async loadAttackSurfaceHistory(): Promise<AttackSurfaceAssessment[]> {
    const data = await this.store.get<AttackSurfaceAssessment[]>(STORE_KEYS.attackSurface);
    return data ?? [];
  }

  private async loadReports(): Promise<AISPMReport[]> {
    const data = await this.store.get<AISPMReport[]>(STORE_KEYS.reports);
    return data ?? [];
  }
}
