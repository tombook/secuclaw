/**
 * SecuClaw Core Data Types
 * Based on sec2.md specification
 * Version: 1.0
 */

// ==================== Enums ====================

export type AssetType = 'server' | 'network' | 'application' | 'database' | 'container' | 'cloud' | 'endpoint' | 'iot';
export type AssetCategory = 'production' | 'development' | 'staging' | 'testing';
export type AssetEnvironment = 'on-premise' | 'cloud' | 'hybrid';
export type AssetCriticality = 'critical' | 'high' | 'medium' | 'low';
export type AssetStatus = 'active' | 'deprecated' | 'retired' | 'maintenance' | 'unknown';
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';
export type ExposureLevel = 'internet-facing' | 'internal' | 'isolated';

export type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type VulnerabilityStatus = 'open' | 'in_progress' | 'fixed' | 'wont_fix' | 'risk_accepted';
export type VulnerabilityPriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export type ThreatType = 'apt' | 'malware' | 'ransomware' | 'phishing' | 'c2' | 'ddos' | 'insider' | 'unknown';
export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IOCType = 'ip' | 'domain' | 'url' | 'hash' | 'email' | 'certificate';
export type IOCStatus = 'active' | 'expired' | 'false_positive';
export type IOCConfidence = 'high' | 'medium' | 'low';

export type IncidentSeverity = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
export type IncidentStatus = 'new' | 'confirmed' | 'analyzing' | 'containing' | 'eradicating' | 'recovering' | 'closed' | 'reopened' | 'false_positive';
export type IncidentCategory = 'malware' | 'intrusion' | 'phishing' | 'ddos' | 'data_breach' | 'insider' | 'other';

export type ComplianceStatus = 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
export type ControlMaturity = 1 | 2 | 3 | 4 | 5;

export type RiskCategory = 'operational' | 'strategic' | 'compliance' | 'financial' | 'reputational';
export type RiskTreatmentStrategy = 'avoid' | 'mitigate' | 'transfer' | 'accept';
export type RiskStatus = 'open' | 'in_progress' | 'treated' | 'closed';

// ==================== Core Interfaces ====================

export interface NetworkInfo {
  ip: string;
  mac: string;
  hostname: string;
  ports: number[];
  fqdn: string;
}

export interface Software {
  name: string;
  version: string;
  vendor: string;
}

export interface Service {
  name: string;
  port: number;
  protocol: string;
}

export interface Technology {
  os: string;
  osVersion: string;
  software: Software[];
  services: Service[];
}

export interface Location {
  datacenter: string;
  region: string;
  zone: string;
}

export interface BusinessAttributes {
  owner: string;
  department: string;
  criticality: AssetCriticality;
  dataClassification: DataClassification;
  businessImpact: number; // 1-10
}

export interface SecurityAttributes {
  attackSurface: number; // 0-100
  exposureLevel: ExposureLevel;
  lastScanDate: number;
  vulnerabilities: string[]; // VulnRef[]
  compliance: string[]; // ComplianceRef[]
}

// ==================== Asset ====================

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  category: AssetCategory;
  environment: AssetEnvironment;
  
  // Location
  location: Location;
  
  // Network
  network: NetworkInfo;
  
  // Technology
  technology: Technology;
  
  // Business
  business: BusinessAttributes;
  
  // Security
  security: SecurityAttributes;
  
  // Status
  status: AssetStatus;
  lastSeen: number;
  firstSeen: number;
  
  // Metadata
  tags: string[];
  customFields: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

// ==================== Vulnerability ====================

export interface CVSS {
  score: number;
  vector: string;
  severity: VulnerabilitySeverity;
}

export interface VulnerabilityInfo {
  cveId: string;
  title: string;
  description: string;
  cvss: CVSS;
  cwe: string[];
  affectedProducts: string[];
  exploitAvailable: boolean;
  exploitInWild: boolean;
}

export interface AffectedAsset {
  assetId: string;
  componentName: string;
  componentVersion: string;
  fixVersion: string;
}

export interface VulnerabilityRemediation {
  status: VulnerabilityStatus;
  priority: number; // AI calculated 1-100
  assignedTo: string;
  dueDate: number;
  slaDeadline: number;
  fixAvailable: boolean;
  fixSteps: string[];
}

export interface VulnerabilityRisk {
  baseScore: number;
  adjustedScore: number;
  businessImpact: number;
  exposureScore: number;
  threatScore: number;
}

export interface VulnerabilityEvidence {
  scanSource: string;
  firstDetected: number;
  lastDetected: number;
  proofOfConcept: string;
  screenshot: string;
}

export interface Vulnerability {
  id: string;
  info: VulnerabilityInfo;
  
  // Affected assets
  affectedAssets: AffectedAsset[];
  
  // Remediation
  remediation: VulnerabilityRemediation;
  
  // Risk assessment
  risk: VulnerabilityRisk;
  
  // Evidence
  evidence: VulnerabilityEvidence;
  
  // Audit trail
  createdBy: string;
  createdAt: number;
  updatedBy: string;
  updatedAt: number;
  history: AuditLog[];
}

export interface AuditLog {
  timestamp: number;
  action: string;
  userId: string;
  details: string;
}

// ==================== Threat Intelligence ====================

export interface ThreatActor {
  id: string;
  name: string;
  aliases: string[];
  type: 'nation-state' | 'cybercrime' | 'hacktivist' | 'insider' | 'unknown';
  motivation: string[];
  
  // Capabilities
  capabilities: {
    sophistication: 'advanced' | 'intermediate' | 'novice';
    techniques: string[];
    tools: string[];
    malware: string[];
  };
  
  // Activity
  campaigns: Campaign[];
  targets: string[];
  indicators: string[];
  
  // Sources
  sources: ThreatSource[];
}

export interface Campaign {
  id: string;
  name: string;
  startDate: number;
  endDate?: number;
  description: string;
  techniques: string[];
}

export interface ThreatSource {
  provider: string;
  confidence: number;
  lastUpdated: number;
}

export interface IOC {
  id: string;
  type: IOCType;
  value: string;
  threatActor?: string;
  
  // Classification
  classification: {
    category: 'malware' | 'c2' | 'phishing' | 'malicious' | 'suspicious';
    confidence: number;
    severity: ThreatSeverity;
  };
  
  // Context
  context: {
    firstSeen: number;
    lastSeen: number;
    sightings: number;
    relatedIOCs: string[];
  };
  
  // Status
  status: IOCStatus;
  expirationDate: number;
  
  // Response
  response: {
    blocked: boolean;
    blockList: string[];
    alerts: string[];
  };
}

export interface AttackPattern {
  id: string;
  mitreId: string;
  name: string;
  tactic: string;
  platforms: string[];
  detection: {
    detectionMethods: string[];
    dataSource: string[];
  };
  mitigation: string[];
}

// ==================== Security Incident ====================

export interface IncidentTimeline {
  detectedAt: number;
  reportedAt: number;
  acknowledgedAt?: number;
  containingAt?: number;
  eradicatedAt?: number;
  recoveredAt?: number;
  closedAt?: number;
}

export interface IncidentSLA {
  responseDeadline: number;
  resolutionDeadline: number;
  responseBreached: boolean;
  resolutionBreached: boolean;
}

export interface IncidentImpact {
  affectedAssets: string[];
  affectedUsers: number;
  dataTypes: string[];
  businessImpact: string;
  estimatedLoss: number;
}

export interface IncidentAttack {
  attackVector: string;
  threatActor?: string;
  mitreTechniques: string[];
  iocs: string[];
}

export interface IncidentHandler {
  user: string;
  role: string;
  joinedAt: number;
  actions: string[];
}

export interface IncidentEvidence {
  artifacts: string[];
  chainOfCustody: string[];
}

export interface IncidentPostMortem {
  rootCause: string;
  lessonsLearned: string[];
  recommendations: string[];
  completed: boolean;
}

export interface Incident {
  id: string;
  ticketId: string;
  
  // Basic info
  info: {
    title: string;
    description: string;
    category: IncidentCategory;
    severity: IncidentSeverity;
    priority: number;
  };
  
  // Timeline
  timeline: IncidentTimeline;
  
  // SLA
  sla: IncidentSLA;
  
  // Status
  workflow: {
    status: IncidentStatus;
    assignee: string;
    previousStatus: string;
  };
  
  // Impact
  impact: IncidentImpact;
  
  // Attack info
  attack: IncidentAttack;
  
  // Handlers
  handlers: IncidentHandler[];
  
  // Evidence
  evidence: IncidentEvidence;
  
  // Post-mortem
  postMortem: IncidentPostMortem;
}

// ==================== Compliance ====================

export interface Regulation {
  id: string;
  name: string;
  fullName: string;
  jurisdiction: string;
  version: string;
  effectiveDate: number;
  authority: string;
  
  // Control framework
  controlFramework: {
    domains: string[];
    totalControls: number;
  };
  
  // Requirements
  requirements: {
    mandatory: boolean;
    penalties: string;
    auditCycle: string;
  };
}

export interface ControlImplementation {
  status: ComplianceStatus;
  maturity: number;
  evidenceRequired: string[];
  evidenceCollected: string[];
}

export interface ControlOwnership {
  owner: string;
  department: string;
  reviewer: string;
}

export interface ControlAudit {
  lastAssessed: number;
  nextAssessment: number;
  findings: string[];
}

export interface ControlMapping {
  mitreTechniques: string[];
  scfControls: string[];
  relatedControls: string[];
}

export interface Control {
  id: string;
  regulationId: string;
  code: string;
  name: string;
  description: string;
  domain: string;
  category: string;
  
  // Implementation
  implementation: ControlImplementation;
  
  // Ownership
  ownership: ControlOwnership;
  
  // Audit
  audit: ControlAudit;
  
  // Mapping
  mapping: ControlMapping;
}

export interface Evidence {
  id: string;
  controlId: string;
  type: 'document' | 'screenshot' | 'log' | 'config' | 'certificate';
  name: string;
  description: string;
  
  // File
  file: {
    path: string;
    mimeType: string;
    size: number;
    hash: string;
  };
  
  // Verification
  verification: {
    status: 'pending' | 'verified' | 'rejected';
    verifiedBy: string;
    verifiedAt: number;
    notes: string;
  };
  
  // Validity
  validity: {
    validFrom: number;
    validUntil: number;
    renewalRequired: boolean;
  };
}

// ==================== Risk ====================

export interface RiskDescription {
  title: string;
  description: string;
  category: RiskCategory;
  source: string;
}

export interface RiskAssessment {
  likelihood: number; // 1-5
  impact: number; // 1-5
  inherentRisk: number;
  residualRisk: number;
  riskScore: number;
}
export interface RiskBusinessImpact {
  financial: number;
  operational: string;
  reputational: string;
  regulatory: string;
}
export interface RiskTreatment {
  strategy: RiskTreatmentStrategy;
  status: RiskStatus;
  owner: string;
  dueDate: number;
  plan: string;
  controls: string[];
}
export interface KRI {
  name: string;
  currentValue: number;
  threshold: number;
  status: 'green' | 'amber' | 'red';
  trend: 'increasing' | 'stable' | 'decreasing';
}
export interface RiskReview {
  lastReviewed: number;
  nextReview: number;
  reviewFrequency: string;
  history: ReviewLog[];
}
export interface Risk {
  id: string;
  code: string;
  
  // Description
  description: RiskDescription;
  
  // Assessment
  assessment: RiskAssessment;
  
  // Business impact
  businessImpact: RiskBusinessImpact;
  
  // Treatment
  treatment: RiskTreatment;
  
  // KRI
  kri: KRI[];
  
  // Review
  review: RiskReview;
}
export interface ReviewLog {
  timestamp: number;
  reviewer: string;
  notes: string;
  riskScore: number;
}

