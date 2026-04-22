// Security Data Types and Mock Data
export interface SecurityMetrics {
  overallScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  trend: number;
  lastScanned: Date;
}

export interface Vulnerability {
  id: string;
  cveId: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvss: number;
  status: 'discovered' | 'validated' | 'prioritized' | 'remediated' | 'verified';
  affectedAssets: number;
  discoveredDate: Date;
  dueDate: Date;
  assignee: string;
  description: string;
  remediation: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'server' | 'workstation' | 'cloud' | 'container' | 'iot' | 'network';
  classification: 'critical' | 'high' | 'medium' | 'low';
  owner: string;
  ipAddress: string;
  os: string;
  status: 'active' | 'inactive' | 'maintenance';
  vulnerabilities: number;
  lastScan: Date;
  tags: string[];
}

export interface Incident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'investigating' | 'contained' | 'resolved';
  assignee: string;
  createdAt: Date;
  updatedAt: Date;
  source: string;
  affectedAssets: string[];
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  action: string;
  user: string;
  details: string;
}

export interface Alert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  timestamp: Date;
  status: 'new' | 'acknowledged' | 'resolved';
  description: string;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  overallScore: number;
  controlsPassed: number;
  controlsFailed: number;
  controlsNotApplicable: number;
  lastAudit: Date;
  nextAudit: Date;
}

export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: number;
  category: string;
}

export interface NetworkEvent {
  id: string;
  timestamp: Date;
  sourceIp: string;
  destIp: string;
  protocol: string;
  action: 'allowed' | 'blocked' | 'alert';
  bytes: number;
  category: string;
}

export interface IAMEvent {
  id: string;
  user: string;
  action: string;
  resource: string;
  timestamp: Date;
  risk: 'low' | 'medium' | 'high';
  status: 'success' | 'failed';
}

export interface DLPPolicy {
  id: string;
  name: string;
  type: 'email' | 'web' | 'endpoint' | 'cloud';
  violations: number;
  status: 'active' | 'paused';
  lastTriggered: Date;
}

export interface TrainingRecord {
  id: string;
  user: string;
  course: string;
  completion: number;
  score: number;
  dueDate: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  riskScore: number;
  criticality: 'critical' | 'high' | 'medium' | 'low';
  contractExpiry: Date;
  lastAssessment: Date;
  status: 'approved' | 'pending' | 'under_review' | 'rejected';
}

export interface SecurityPolicy {
  id: string;
  title: string;
  category: string;
  version: string;
  status: 'draft' | 'review' | 'approved' | 'published';
  lastUpdated: Date;
  owner: string;
}

export interface RemediationTask {
  id: string;
  title: string;
  vulnerabilityId: string;
  assignee: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'critical' | 'high' | 'medium' | 'low';
  dueDate: Date;
  createdAt: Date;
  completedAt?: Date;
}

export interface ThreatHunt {
  id: string;
  name: string;
  hypothesis: string;
  status: 'planned' | 'in_progress' | 'completed';
  createdBy: string;
  createdAt: Date;
  findings: number;
  iocCount: number;
}

export interface SOCWorkflow {
  id: string;
  name: string;
  type: 'incident_response' | 'alert_triage' | 'enrichment' | 'escalation';
  status: 'active' | 'paused' | 'draft';
  runs: number;
  lastRun: Date;
  avgDuration: number;
}

export interface AttackSurfaceEntry {
  id: string;
  type: 'domain' | 'ip' | 'certificate' | 'subdomain' | 'service';
  value: string;
  risk: 'critical' | 'high' | 'medium' | 'low';
  lastSeen: Date;
  exposed: boolean;
  vulnerabilities: number;
}

// Mock Data
export const mockSecurityMetrics: SecurityMetrics = {
  overallScore: 78,
  riskLevel: 'medium',
  trend: 5,
  lastScanned: new Date(),
};

export const mockVulnerabilities: Vulnerability[] = [
  { id: 'vuln-001', cveId: 'CVE-2024-21762', title: 'FortiOS SSL-VPN RCE', severity: 'critical', cvss: 9.8, status: 'prioritized', affectedAssets: 12, discoveredDate: new Date('2024-01-15'), dueDate: new Date('2024-02-15'), assignee: 'Sarah Chen', description: 'Remote code execution in FortiOS SSL-VPN', remediation: 'Upgrade to FortiOS 7.4.3' },
  { id: 'vuln-002', cveId: 'CVE-2024-23897', title: 'Jenkins CLI File Read', severity: 'high', cvss: 8.8, status: 'remediated', affectedAssets: 8, discoveredDate: new Date('2024-01-10'), dueDate: new Date('2024-02-10'), assignee: 'Mike Johnson', description: 'Arbitrary file read via Jenkins CLI', remediation: 'Upgrade Jenkins to 2.442' },
  { id: 'vuln-003', cveId: 'CVE-2024-1709', title: 'ScreenConnect Auth Bypass', severity: 'critical', cvss: 10.0, status: 'validated', affectedAssets: 25, discoveredDate: new Date('2024-02-19'), dueDate: new Date('2024-02-26'), assignee: 'Alex Kim', description: 'Authentication bypass vulnerability', remediation: 'Apply ScreenConnect 23.9.8 patches' },
  { id: 'vuln-004', cveId: 'CVE-2023-48795', title: 'OpenSSH RegreSSHion', severity: 'high', cvss: 7.8, status: 'discovered', affectedAssets: 45, discoveredDate: new Date('2024-02-20'), dueDate: new Date('2024-03-20'), assignee: 'Unassigned', description: 'Stack overflow in OpenSSH', remediation: 'Upgrade OpenSSH to 9.6' },
  { id: 'vuln-005', cveId: 'CVE-2024-21413', title: 'Outlook RCE', severity: 'critical', cvss: 9.8, status: 'verified', affectedAssets: 156, discoveredDate: new Date('2024-02-15'), dueDate: new Date('2024-02-22'), assignee: 'James Wilson', description: 'Preview pane attack vector', remediation: 'Apply Feb 2024 security updates' },
];

export const mockAssets: Asset[] = [
  { id: 'asset-001', name: 'PROD-WEB-01', type: 'server', classification: 'critical', owner: 'Platform Team', ipAddress: '10.0.1.15', os: 'Ubuntu 22.04', status: 'active', vulnerabilities: 3, lastScan: new Date('2024-02-20'), tags: ['production', 'web'] },
  { id: 'asset-002', name: 'PROD-DB-01', type: 'server', classification: 'critical', owner: 'Database Team', ipAddress: '10.0.2.10', os: 'PostgreSQL 15', status: 'active', vulnerabilities: 1, lastScan: new Date('2024-02-20'), tags: ['production', 'database'] },
  { id: 'asset-003', name: 'AWS-PROD-API', type: 'cloud', classification: 'high', owner: 'API Team', ipAddress: '54.123.45.67', os: 'AWS Lambda', status: 'active', vulnerabilities: 2, lastScan: new Date('2024-02-19'), tags: ['aws', 'api'] },
];

export const mockIncidents: Incident[] = [
  { id: 'INC-2024-0089', title: 'Ransomware Activity Detected', severity: 'critical', status: 'contained', assignee: 'IR Team', createdAt: new Date('2024-02-20T08:30:00'), updatedAt: new Date('2024-02-20T14:45:00'), source: 'EDR - SentinelOne', affectedAssets: ['WIN-SRV-01'], timeline: [
    { id: 'e1', timestamp: new Date('2024-02-20T08:30:00'), action: 'Alert Generated', user: 'SIEM', details: 'Suspicious file encryption detected' },
    { id: 'e2', timestamp: new Date('2024-02-20T08:32:00'), action: 'Triage Started', user: 'Analyst 1', details: 'Initial assessment initiated' },
    { id: 'e3', timestamp: new Date('2024-02-20T09:15:00'), action: 'Containment', user: 'IR Team', details: 'Affected systems isolated' },
  ]},
  { id: 'INC-2024-0088', title: 'Phishing Campaign Targeting Finance', severity: 'high', status: 'investigating', assignee: 'Email Security', createdAt: new Date('2024-02-19T14:20:00'), updatedAt: new Date('2024-02-20T09:00:00'), source: 'Email Gateway', affectedAssets: ['finance-group'], timeline: [
    { id: 'e1', timestamp: new Date('2024-02-19T14:20:00'), action: 'Detection', user: 'Email Gateway', details: '12 suspicious emails identified' },
    { id: 'e2', timestamp: new Date('2024-02-19T14:25:00'), action: 'Analysis', user: 'Analyst 2', details: 'Credential harvesting campaign' },
  ]},
];

export const mockAlerts: Alert[] = [
  { id: 'alert-001', title: 'Brute Force Attack Detected', severity: 'critical', source: 'Firewall', timestamp: new Date('2024-02-20T15:30:00'), status: 'new', description: 'Multiple failed login attempts' },
  { id: 'alert-002', title: 'Data Exfiltration Attempt', severity: 'high', source: 'DLP', timestamp: new Date('2024-02-20T14:15:00'), status: 'acknowledged', description: 'Large data transfer to unauthorized IP' },
  { id: 'alert-003', title: 'Malware Signature Match', severity: 'critical', source: 'EDR', timestamp: new Date('2024-02-20T13:45:00'), status: 'new', description: 'Emotet malware detected' },
  { id: 'alert-004', title: 'Unusual API Calls', severity: 'medium', source: 'CloudTrail', timestamp: new Date('2024-02-20T12:00:00'), status: 'new', description: 'Excessive API calls from IAM user' },
];

export const mockComplianceFrameworks: ComplianceFramework[] = [
  { id: 'nist', name: 'NIST CSF', version: '2.0', overallScore: 85, controlsPassed: 98, controlsFailed: 12, controlsNotApplicable: 15, lastAudit: new Date('2024-01-15'), nextAudit: new Date('2024-07-15') },
  { id: 'soc2', name: 'SOC 2 Type II', version: '2017', overallScore: 92, controlsPassed: 78, controlsFailed: 5, controlsNotApplicable: 8, lastAudit: new Date('2024-02-01'), nextAudit: new Date('2025-02-01') },
  { id: 'iso', name: 'ISO 27001', version: '2022', overallScore: 88, controlsPassed: 112, controlsFailed: 14, controlsNotApplicable: 20, lastAudit: new Date('2023-12-01'), nextAudit: new Date('2024-12-01') },
  { id: 'pci', name: 'PCI-DSS', version: '4.0', overallScore: 76, controlsPassed: 65, controlsFailed: 18, controlsNotApplicable: 5, lastAudit: new Date('2024-01-30'), nextAudit: new Date('2024-07-30') },
  { id: 'hipaa', name: 'HIPAA', version: '2024', overallScore: 82, controlsPassed: 45, controlsFailed: 8, controlsNotApplicable: 12, lastAudit: new Date('2024-02-10'), nextAudit: new Date('2025-02-10') },
];

export const mockKPIMetrics: KPIMetric[] = [
  { id: 'kpi-001', name: 'Mean Time to Detect (MTTD)', value: 12, target: 15, unit: 'minutes', trend: -8, category: 'Detection' },
  { id: 'kpi-002', name: 'Mean Time to Respond (MTTR)', value: 45, target: 60, unit: 'minutes', trend: -12, category: 'Response' },
  { id: 'kpi-003', name: 'Mean Time to Resolve', value: 4.5, target: 8, unit: 'hours', trend: -15, category: 'Resolution' },
  { id: 'kpi-004', name: 'Alert Volume', value: 1250, target: 1500, unit: 'daily', trend: -5, category: 'Volume' },
  { id: 'kpi-005', name: 'False Positive Rate', value: 12, target: 15, unit: '%', trend: -25, category: 'Quality' },
  { id: 'kpi-006', name: 'Coverage Rate', value: 94, target: 95, unit: '%', trend: 3, category: 'Coverage' },
];

export const mockNetworkEvents: NetworkEvent[] = [
  { id: 'net-001', timestamp: new Date('2024-02-20T15:30:00'), sourceIp: '192.168.1.100', destIp: '8.8.8.8', protocol: 'DNS', action: 'allowed', bytes: 256, category: 'query' },
  { id: 'net-002', timestamp: new Date('2024-02-20T15:29:45'), sourceIp: '10.0.1.15', destIp: '10.0.2.10', protocol: 'PostgreSQL', action: 'allowed', bytes: 15420, category: 'database' },
  { id: 'net-003', timestamp: new Date('2024-02-20T15:29:30'), sourceIp: '185.220.101.45', destIp: '192.168.1.50', protocol: 'SSH', action: 'blocked', bytes: 0, category: 'intrusion' },
];

export const mockIAMEvents: IAMEvent[] = [
  { id: 'iam-001', user: 'john.smith@company.com', action: 'Password Change', resource: 'Active Directory', timestamp: new Date('2024-02-20T15:00:00'), risk: 'low', status: 'success' },
  { id: 'iam-002', user: 'admin@company.com', action: 'Privilege Escalation', resource: 'AWS Console', timestamp: new Date('2024-02-20T14:45:00'), risk: 'high', status: 'success' },
  { id: 'iam-003', user: 'former.employee@company.com', action: 'Login Attempt', resource: 'VPN', timestamp: new Date('2024-02-20T14:30:00'), risk: 'high', status: 'failed' },
];

export const mockDLPPolicies: DLPPolicy[] = [
  { id: 'dlp-001', name: 'PII Email Protection', type: 'email', violations: 23, status: 'active', lastTriggered: new Date('2024-02-20T12:00:00') },
  { id: 'dlp-002', name: 'Credit Card Detection', type: 'endpoint', violations: 5, status: 'active', lastTriggered: new Date('2024-02-20T10:30:00') },
  { id: 'dlp-003', name: 'Cloud Storage Monitor', type: 'cloud', violations: 45, status: 'active', lastTriggered: new Date('2024-02-20T09:15:00') },
];

export const mockTrainingRecords: TrainingRecord[] = [
  { id: 'train-001', user: 'John Smith', course: 'Security Awareness Basics', completion: 100, score: 92, dueDate: new Date('2024-02-28'), status: 'completed' },
  { id: 'train-002', user: 'Jane Doe', course: 'Phishing Recognition', completion: 75, score: 0, dueDate: new Date('2024-03-01'), status: 'in_progress' },
  { id: 'train-003', user: 'Bob Wilson', course: 'Data Protection', completion: 0, score: 0, dueDate: new Date('2024-02-25'), status: 'overdue' },
  { id: 'train-004', user: 'Alice Chen', course: 'Password Security', completion: 100, score: 98, dueDate: new Date('2024-02-20'), status: 'completed' },
];

export const mockVendors: Vendor[] = [
  { id: 'vendor-001', name: 'Cloudflare', category: 'CDN/Security', riskScore: 15, criticality: 'high', contractExpiry: new Date('2024-12-31'), lastAssessment: new Date('2024-01-15'), status: 'approved' },
  { id: 'vendor-002', name: 'AWS', category: 'Cloud Provider', riskScore: 25, criticality: 'critical', contractExpiry: new Date('2025-06-30'), lastAssessment: new Date('2024-02-01'), status: 'approved' },
  { id: 'vendor-003', name: 'Slack', category: 'Communication', riskScore: 35, criticality: 'medium', contractExpiry: new Date('2024-09-30'), lastAssessment: new Date('2023-12-01'), status: 'approved' },
  { id: 'vendor-004', name: 'Acme SaaS', category: 'HR Software', riskScore: 68, criticality: 'low', contractExpiry: new Date('2024-03-15'), lastAssessment: new Date('2022-06-01'), status: 'under_review' },
];

export const mockPolicies: SecurityPolicy[] = [
  { id: 'pol-001', title: 'Information Security Policy', category: 'Governance', version: '3.2', status: 'published', lastUpdated: new Date('2024-01-15'), owner: 'CISO' },
  { id: 'pol-002', title: 'Acceptable Use Policy', category: 'Usage', version: '2.1', status: 'published', lastUpdated: new Date('2023-11-20'), owner: 'IT Director' },
  { id: 'pol-003', title: 'Data Classification Policy', category: 'Data', version: '1.5', status: 'review', lastUpdated: new Date('2024-02-01'), owner: 'DPO' },
  { id: 'pol-004', title: 'Incident Response Plan', category: 'Response', version: '4.0', status: 'approved', lastUpdated: new Date('2024-02-10'), owner: 'SOC Lead' },
];

export const mockRemediationTasks: RemediationTask[] = [
  { id: 'rem-001', title: 'Patch FortiGate VPN vulnerability', vulnerabilityId: 'vuln-001', assignee: 'Sarah Chen', status: 'in_progress', priority: 'critical', dueDate: new Date('2024-02-22'), createdAt: new Date('2024-02-15') },
  { id: 'rem-002', title: 'Upgrade Jenkins to latest version', vulnerabilityId: 'vuln-002', assignee: 'Mike Johnson', status: 'done', priority: 'high', dueDate: new Date('2024-02-18'), createdAt: new Date('2024-02-10'), completedAt: new Date('2024-02-17') },
  { id: 'rem-003', title: 'Apply ScreenConnect security patch', vulnerabilityId: 'vuln-003', assignee: 'Alex Kim', status: 'todo', priority: 'critical', dueDate: new Date('2024-02-26'), createdAt: new Date('2024-02-19') },
];

export const mockThreatHunts: ThreatHunt[] = [
  { id: 'hunt-001', name: 'APT29 Campaign Investigation', hypothesis: 'Potential Cobalt Strike beacons', status: 'in_progress', createdBy: 'Threat Intel Team', createdAt: new Date('2024-02-18'), findings: 3, iocCount: 12 },
  { id: 'hunt-002', name: 'Ransomware Pre-Cursor Search', hypothesis: 'Early ransomware indicators', status: 'completed', createdBy: 'SOC Team', createdAt: new Date('2024-02-15'), findings: 1, iocCount: 5 },
];

export const mockSOCWorkflows: SOCWorkflow[] = [
  { id: 'wf-001', name: 'Critical Alert Triage', type: 'alert_triage', status: 'active', runs: 1542, lastRun: new Date('2024-02-20T15:00:00'), avgDuration: 45 },
  { id: 'wf-002', name: 'Phishing Response', type: 'incident_response', status: 'active', runs: 892, lastRun: new Date('2024-02-20T14:30:00'), avgDuration: 120 },
  { id: 'wf-003', name: 'IOC Enrichment', type: 'enrichment', status: 'active', runs: 3421, lastRun: new Date('2024-02-20T15:25:00'), avgDuration: 30 },
];

export const mockAttackSurface: AttackSurfaceEntry[] = [
  { id: 'as-001', type: 'domain', value: 'company.com', risk: 'medium', lastSeen: new Date('2024-02-20'), exposed: true, vulnerabilities: 2 },
  { id: 'as-002', type: 'subdomain', value: 'api.company.com', risk: 'high', lastSeen: new Date('2024-02-20'), exposed: true, vulnerabilities: 4 },
  { id: 'as-003', type: 'ip', value: '54.123.45.67', risk: 'low', lastSeen: new Date('2024-02-19'), exposed: true, vulnerabilities: 1 },
  { id: 'as-004', type: 'service', value: 'VPN (OpenVPN)', risk: 'critical', lastSeen: new Date('2024-02-18'), exposed: true, vulnerabilities: 3 },
  { id: 'as-005', type: 'certificate', value: '*.company.com', risk: 'low', lastSeen: new Date('2024-02-15'), exposed: true, vulnerabilities: 0 },
  { id: 'as-006', type: 'subdomain', value: 'staging.company.com', risk: 'high', lastSeen: new Date('2024-02-20'), exposed: true, vulnerabilities: 6 },
];

// Chart Data Functions
export function getVulnerabilityBySeverity() {
  return {
    critical: mockVulnerabilities.filter(v => v.severity === 'critical').length,
    high: mockVulnerabilities.filter(v => v.severity === 'high').length,
    medium: mockVulnerabilities.filter(v => v.severity === 'medium').length,
    low: mockVulnerabilities.filter(v => v.severity === 'low').length,
  };
}

export function getVulnerabilityTrend() {
  return {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    critical: [8, 12, 15, 11, 9, 7],
    high: [25, 28, 32, 30, 26, 22],
    medium: [45, 48, 42, 38, 35, 30],
    low: [78, 82, 75, 68, 62, 58],
  };
}

export function getComplianceTrend() {
  return {
    labels: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024'],
    nist: [72, 75, 78, 82, 85],
    soc2: [85, 87, 89, 91, 92],
    iso: [78, 80, 83, 86, 88],
    pci: [65, 68, 72, 74, 76],
  };
}

export function getSecurityScoreTrend() {
  return {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    score: [68, 71, 73, 75, 77, 78],
  };
}

export function getAlertVolumeTrend() {
  return {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    volume: [1250, 1380, 1290, 1420, 1150, 780, 620],
  };
}

export function getAssetTypeDistribution() {
  return {
    server: mockAssets.filter(a => a.type === 'server').length,
    workstation: mockAssets.filter(a => a.type === 'workstation').length,
    cloud: mockAssets.filter(a => a.type === 'cloud').length,
    container: mockAssets.filter(a => a.type === 'container').length,
    iot: mockAssets.filter(a => a.type === 'iot').length,
    network: mockAssets.filter(a => a.type === 'network').length,
  };
}

export function getNetworkProtocolDistribution() {
  return {
    https: 45,
    dns: 25,
    ssh: 12,
    smtp: 8,
    database: 6,
    other: 4,
  };
}
