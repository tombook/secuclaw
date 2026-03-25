/**
 * AI Module Types - AI 模块通用类型定义
 * 
 * 包含洞察引擎、异常检测、趋势预测、AI助手的共享类型
 */

// ==================== Insight Engine Types ====================

export type InsightType = 'warning' | 'info' | 'recommendation' | 'critical' | 'opportunity';
export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';
export type InsightCategory = 'security' | 'compliance' | 'operations' | 'risk' | 'threat' | 'vulnerability';

export interface InsightEntity {
  type: 'asset' | 'vulnerability' | 'threat' | 'incident' | 'compliance' | 'user';
  id: string;
  name: string;
  metadata?: Record<string, unknown>;
}

export interface InsightMetric {
  name: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  changePercent?: number;
}

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  priority: InsightPriority;
  category: InsightCategory;
  source: string;
  confidence: number; // 0-100
  relatedEntities?: InsightEntity[];
  metrics?: InsightMetric[];
  recommendations?: string[];
  affectedScope?: string;
  createdAt: number;
  expiresAt?: number;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
}

export interface InsightFilter {
  types?: InsightType[];
  priorities?: InsightPriority[];
  categories?: InsightCategory[];
  sources?: string[];
  fromDate?: number;
  toDate?: number;
  acknowledged?: boolean;
}

export interface InsightGenerateRequest {
  context: string;
  data?: {
    incidents?: any[];
    vulnerabilities?: any[];
    threats?: any[];
    assets?: any[];
    compliance?: any[];
    metrics?: Record<string, number>;
  };
  options?: {
    maxInsights?: number;
    minConfidence?: number;
    categories?: InsightCategory[];
  };
}

// ==================== Anomaly Detection Types ====================

export type AnomalyType = 
  | 'event_spike' 
  | 'login_failure' 
  | 'traffic_anomaly' 
  | 'resource_usage' 
  | 'behavioral' 
  | 'performance'
  | 'security_breach'
  | 'data_exfiltration';

export type AnomalySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type AnomalyStatus = 'active' | 'investigating' | 'acknowledged' | 'resolved' | 'false_positive';

export interface AnomalyBaseline {
  value: number;
  deviation: number;
  upperThreshold: number;
  lowerThreshold: number;
  sampleSize: number;
  calculatedAt: number;
}

export interface AnomalyContext {
  metric: string;
  value: number;
  baseline: number;
  deviation: number;
  deviationPercent: number;
  historicalValues?: number[];
}

export interface Anomaly {
  id: string;
  type: AnomalyType;
  title: string;
  description: string;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  
  // Detection details
  metric: string;
  value: number;
  baseline: AnomalyBaseline;
  deviation: number;
  deviationPercent: number;
  
  // Context
  context?: AnomalyContext;
  affectedEntities?: InsightEntity[];
  possibleCauses?: string[];
  recommendedActions?: string[];
  
  // Timestamps
  detectedAt: number;
  acknowledgedAt?: number;
  acknowledgedBy?: string;
  resolvedAt?: number;
  resolvedBy?: string;
  resolutionNote?: string;
}

export interface AnomalyFilter {
  types?: AnomalyType[];
  severities?: AnomalySeverity[];
  statuses?: AnomalyStatus[];
  fromDate?: number;
  toDate?: number;
  metric?: string;
}

export interface AnomalyDetectRequest {
  context: string;
  data?: {
    metrics?: Record<string, number>;
    events?: any[];
    logs?: any[];
  };
  options?: {
    sensitivity?: 'high' | 'medium' | 'low';
    metrics?: string[];
  };
}

export interface AnomalyAcknowledgeRequest {
  anomalyId: string;
  acknowledgedBy: string;
  note?: string;
}

export interface AnomalyResolveRequest {
  anomalyId: string;
  resolvedBy: string;
  resolution: 'fixed' | 'ignored' | 'false_positive';
  note?: string;
}

// ==================== Trend Prediction Types ====================

export type TrendDirection = 'up' | 'down' | 'stable' | 'volatile';
export type PredictionTimeframe = '1h' | '6h' | '24h' | '7d' | '30d' | '90d';

export interface TrendFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface TrendDataPoint {
  timestamp: number;
  value: number;
}

export interface Prediction {
  id: string;
  metric: string;
  timeframe: PredictionTimeframe;
  
  // Current state
  currentValue: number;
  currentTrend: TrendDirection;
  
  // Predictions
  predictedValue: number;
  predictionRange: {
    min: number;
    max: number;
  };
  
  // Confidence
  confidence: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  
  // Analysis
  trend: TrendDirection;
  trendStrength: number; // 0-100
  factors: TrendFactor[];
  seasonality?: {
    detected: boolean;
    pattern?: string;
    strength?: number;
  };
  
  // Historical data used
  dataPoints: number;
  dataRange: {
    start: number;
    end: number;
  };
  
  generatedAt: number;
}

export interface PredictionFilter {
  metric?: string;
  timeframe?: PredictionTimeframe;
  fromDate?: number;
  toDate?: number;
}

export interface PredictionRequest {
  metric: string;
  timeframe: PredictionTimeframe;
  options?: {
    confidence?: number;
    includeHistorical?: boolean;
    includeFactors?: boolean;
  };
}

// ==================== AI Assistant Types ====================

export type AssistantCapability = 
  | 'insight_analysis'
  | 'anomaly_explanation'
  | 'threat_assessment'
  | 'remediation_guidance'
  | 'compliance_advice'
  | 'risk_evaluation'
  | 'natural_language_query'
  | 'report_generation';

export type AssistantTone = 'professional' | 'casual' | 'technical' | 'executive';

export interface AssistantContext {
  sessionId?: string;
  userId?: string;
  domain?: string;
  currentView?: string;
  selectedEntities?: InsightEntity[];
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: {
    type: 'insight' | 'anomaly' | 'prediction' | 'report';
    data: any;
  }[];
}

export interface AssistantRequest {
  message: string;
  context?: AssistantContext;
  options?: {
    tone?: AssistantTone;
    capabilities?: AssistantCapability[];
    maxResults?: number;
  };
}

export interface AssistantResponse {
  message: AssistantMessage;
  insights?: Insight[];
  anomalies?: Anomaly[];
  predictions?: Prediction[];
  actions?: {
    type: string;
    label: string;
    payload?: any;
  }[];
  suggestedQuestions?: string[];
}

export interface AssistantSession {
  id: string;
  userId: string;
  createdAt: number;
  lastActivityAt: number;
  messages: AssistantMessage[];
  context: AssistantContext;
  preferences: {
    tone: AssistantTone;
    language: string;
  };
}

// ==================== Vulnerability Fix Recommendation Types (P1) ====================

export interface VulnerabilityFixRecommendation {
  id: string;
  vulnerabilityId: string;
  cveId?: string;
  title: string;
  description: string;
  
  // Fix details
  fixType: 'patch' | 'configuration' | 'workaround' | 'mitigation' | 'compensating_control';
  complexity: 'low' | 'medium' | 'high';
  estimatedEffort: string;
  
  // Priority
  priority: InsightPriority;
  riskReduction: number; // percentage
  
  // Resources
  resources?: {
    url?: string;
    patches?: {
      vendor: string;
      version: string;
      url?: string;
    }[];
    cweIds?: string[];
    mitreTechniques?: string[];
  };
  
  // Steps
  steps?: {
    order: number;
    description: string;
    code?: string;
    optional: boolean;
  }[];
  
  // Verification
  validationMethod?: string;
  rollbackPlan?: string;
  
  generatedAt: number;
}

// ==================== Threat Intelligence Types (P1) ====================

export interface ThreatIntelligence {
  id: string;
  
  // Identification
  threatType: string;
  threatActors?: string[];
  ttps?: string[]; // MITRE ATT&CK techniques
  
  // Intelligence
  summary: string;
  description: string;
  indicators?: {
    type: 'ip' | 'domain' | 'hash' | 'email' | 'url';
    value: string;
    confidence: number;
  }[];
  
  // Assessment
  severity: AnomalySeverity;
  relevance: 'global' | 'industry' | 'organization' | 'specific';
  confidence: number;
  
  // Context
  targetSectors?: string[];
  targetRegions?: string[];
  activeSince?: number;
  lastActivity?: number;
  
  // Sources
  sources?: string[];
  originalSource?: string;
  
  // Recommended actions
  recommendedActions?: string[];
  
  generatedAt: number;
  expiresAt?: number;
}

export interface ThreatIntelligenceRequest {
  query: string;
  types?: string[];
  severity?: AnomalySeverity[];
  fromDate?: number;
  toDate?: number;
  limit?: number;
}

// ==================== Security Event Summary Types (P1) ====================

export interface SecurityEventSummary {
  id: string;
  period: {
    start: number;
    end: number;
  };
  
  // Overview
  totalEvents: number;
  criticalEvents: number;
  resolvedEvents: number;
  meanResolutionTime?: number;
  
  // Categories breakdown
  byCategory?: Record<string, number>;
  bySeverity?: Record<string, number>;
  byStatus?: Record<string, number>;
  bySource?: Record<string, number>;
  
  // Top items
  topThreats?: ThreatIntelligence[];
  topVulnerabilities?: VulnerabilityFixRecommendation[];
  topInsights?: Insight[];
  
  // Trends
  trendComparison?: {
    vsPreviousPeriod: number;
    vsSamePeriodLastYear?: number;
  };
  
  // Recommendations
  recommendations?: string[];
  
  generatedAt: number;
}

export interface SecurityEventSummaryRequest {
  period: {
    start: number;
    end: number;
  };
  options?: {
    includeThreats?: boolean;
    includeVulnerabilities?: boolean;
    includeInsights?: boolean;
    includeTrends?: boolean;
  };
}
