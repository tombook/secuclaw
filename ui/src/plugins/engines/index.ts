/**
 * Engines 统一导出
 */

export { scfQuestionnaireEngine } from './scf-questionnaire-engine';
export type {
  QuestionnaireConfig, QuestionnaireMode, ScoringModel,
  ScfQuestion, QuestionOption, AssessmentAnswer,
  AssessmentResult, DomainResult, GapItem,
} from './scf-questionnaire-engine';

export { aiAnalysisEngine } from './ai-analysis-engine';
export type {
  AiAnalysisRequest, AiAnalysisResult, RiskLevel,
  ScfContext, MitreContext, ActionItem,
} from './ai-analysis-engine';

export { mitreAnalysisEngine } from './mitre-analysis-engine';
export type {
  MitreTechnique, MitreGroup, MitreMalware,
  ThreatModelResult, AttackAnalysisResult,
} from './mitre-analysis-engine';
