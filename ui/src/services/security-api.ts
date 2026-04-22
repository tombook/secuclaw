/**
 * SecuClaw Security Data Services
 * Unified API layer for all security data operations
 */

// Types for security data
export interface Vulnerability {
  id: string;
  cve: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'discovered' | 'triaged' | 'assigned' | 'remediating' | 'remediated' | 'verified' | 'accepted';
  cvss: number;
  cvssVector?: string;
  asset: string;
  assignee?: { name: string; initials: string; email?: string };
  discoveredAt: string;
  dueDate?: string;
  remediatedAt?: string;
  sla: { daysRemaining: number; total: number; status: 'on-track' | 'at-risk' | 'breached' };
  tags?: string[];
  affectedSystems?: number;
}

export interface SecurityIncident {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'investigating' | 'contained' | 'eradicated' | 'recovered' | 'closed';
  source: string;
  assignee?: { name: string; initials: string };
  createdAt: string;
  updatedAt: string;
  description: string;
  indicators?: string[];
  affectedAssets?: string[];
  timeline: { timestamp: string; action: string; actor?: string }[];
}

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  score: number;
  status: 'compliant' | 'non-compliant' | 'in-progress' | 'not-applicable';
  requirementsTotal: number;
  requirementsMet: number;
  requirementsPartial: number;
  lastAudited: string;
  nextAudit?: string;
  controls: ComplianceControl[];
}

export interface ComplianceControl {
  id: string;
  name: string;
  description: string;
  status: 'compliant' | 'non-compliant' | 'in-progress' | 'not-applicable' | 'partial';
  evidence?: string[];
  lastVerified?: string;
  assignee?: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'server' | 'workstation' | 'network' | 'cloud' | 'container' | 'database' | 'application' | 'iot';
  criticality: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'maintenance' | 'decommissioned' | 'at-risk';
  ip?: string;
  hostname?: string;
  os?: string;
  owner?: string;
  lastScanned?: string;
  vulnerabilities?: number;
  riskScore?: number;
  tags?: string[];
  location?: string;
  classification?: 'public' | 'internal' | 'confidential' | 'restricted';
}

export interface SecurityMetric {
  id: string;
  name: string;
  value: number;
  unit?: string;
  trend: 'up' | 'down' | 'stable';
  change?: number;
  baseline?: number;
  target?: number;
  category: string;
}

export interface ThreatIntel {
  id: string;
  indicator: string;
  type: 'ipv4' | 'ipv6' | 'domain' | 'hash' | 'url' | 'email';
  threatType: string;
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  firstSeen: string;
  lastSeen: string;
  tags?: string[];
  description?: string;
}

export interface SecurityAlert {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  status: 'new' | 'acknowledged' | 'resolved' | 'false-positive';
  source: string;
  rule?: string;
  timestamp: string;
  description: string;
  rawData?: Record<string, any>;
}

export interface RemediationTask {
  id: string;
  title: string;
  description: string;
  vulnerabilityId?: string;
  incidentId?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked' | 'verified';
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignee?: { name: string; initials: string };
  createdAt: string;
  dueDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  notes?: string[];
}

// Mock data generators
function generateMockId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
}

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString();
}

// Mock vulnerabilities
export function getMockVulnerabilities(count: number = 20): Vulnerability[] {
  const severities: Vulnerability['severity'][] = ['critical', 'high', 'medium', 'low', 'info'];
  const statuses: Vulnerability['status'][] = ['discovered', 'triaged', 'assigned', 'remediating', 'remediated', 'verified', 'accepted'];
  
  const cveTemplates = [
    { cve: 'CVE-2024-21762', title: 'FortiOS SSL-VPN Remote Code Execution', severity: 'critical' as const },
    { cve: 'CVE-2024-3400', title: 'Palo Alto PAN-OS Command Injection', severity: 'critical' as const },
    { cve: 'CVE-2024-27198', title: 'TeamCity Authentication Bypass', severity: 'critical' as const },
    { cve: 'CVE-2024-1709', title: 'ConnectWise ScreenConnect Auth Bypass', severity: 'critical' as const },
    { cve: 'CVE-2024-23897', title: 'Jenkins CLI Arbitrary File Read', severity: 'high' as const },
    { cve: 'CVE-2024-22252', title: 'VMware ESXi Use-After-Free', severity: 'high' as const },
    { cve: 'CVE-2024-21413', title: 'Microsoft Exchange Server SSRF', severity: 'high' as const },
    { cve: 'CVE-2024-0056', title: 'Microsoft SQL Server Privilege Escalation', severity: 'high' as const },
    { cve: 'CVE-2024-1701', title: 'Chrome V8 Type Confusion', severity: 'medium' as const },
    { cve: 'CVE-2024-26248', title: 'Windows SmartScreen Bypass', severity: 'medium' as const },
  ];

  return Array.from({ length: count }, (_, i) => {
    const template = cveTemplates[i % cveTemplates.length];
    const severity = template.severity;
    const cvss = severity === 'critical' ? 9.8 : severity === 'high' ? 7.5 : severity === 'medium' ? 5.3 : 3.2;
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const slaTotal = severity === 'critical' ? 7 : severity === 'high' ? 14 : severity === 'medium' ? 30 : 90;
    const daysRemaining = status === 'remediated' || status === 'verified' ? 0 : Math.floor(Math.random() * slaTotal);
    
    return {
      id: generateMockId('VULN'),
      cve: template.cve,
      title: template.title,
      description: `A vulnerability in ${template.title.split(' ')[0]} allows attackers to ${severity === 'critical' ? 'execute arbitrary code remotely without authentication' : 'perform unauthorized actions'}.`,
      severity,
      status,
      cvss,
      asset: `asset-${Math.floor(Math.random() * 100)}.prod.internal`,
      assignee: status !== 'discovered' && status !== 'triaged' ? { name: ['Alice Chen', 'Bob Wilson', 'Carol Smith', 'David Lee'][Math.floor(Math.random() * 4)], initials: 'XX' } : undefined,
      discoveredAt: randomDate(30),
      dueDate: new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toISOString(),
      sla: {
        daysRemaining,
        total: slaTotal,
        status: daysRemaining < 2 ? 'breached' : daysRemaining < slaTotal / 3 ? 'at-risk' : 'on-track'
      }
    };
  });
}

// Mock security incidents
export function getMockIncidents(count: number = 15): SecurityIncident[] {
  const severities: SecurityIncident['severity'][] = ['critical', 'high', 'medium', 'low'];
  const statuses: SecurityIncident['status'][] = ['new', 'investigating', 'contained', 'eradicated', 'recovered', 'closed'];
  const sources = ['SIEM', 'EDR', 'DLP', 'Firewall', 'IDS/IPS', 'Cloud Security', 'Email Gateway'];
  
  const titles = [
    'Suspicious PowerShell Execution Detected',
    'Multiple Failed Login Attempts',
    'Data Exfiltration Alert',
    'Malware Detected on Endpoint',
    'Unauthorized Access Attempt',
    'Lateral Movement Detected',
    'Privilege Escalation Attempt',
    'Brute Force Attack Detected',
    'Ransomware Indicators Found',
    'Phishing Email Blocked',
    'Anomalous Network Traffic',
    'Unusual Data Access Pattern',
    'Certificate Expiration Warning',
    'Configuration Change Alert',
    'Vulnerability Exploitation Attempt',
  ];

  return Array.from({ length: count }, (_, i) => {
    const severity = severities[Math.floor(Math.random() * severities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const createdAt = randomDate(7);
    
    return {
      id: generateMockId('INC'),
      title: titles[i % titles.length],
      severity,
      status,
      source: sources[Math.floor(Math.random() * sources.length)],
      assignee: status !== 'new' ? { name: ['Sarah Chen', 'Mike Johnson', 'Emma Davis', 'Chris Lee'][Math.floor(Math.random() * 4)], initials: 'XX' } : undefined,
      createdAt,
      updatedAt: randomDate(1),
      description: `Security incident detected by ${sources[Math.floor(Math.random() * sources.length)]} requiring immediate investigation.`,
      timeline: [
        { timestamp: createdAt, action: 'Incident created', actor: 'System' },
        { timestamp: randomDate(0), action: status === 'new' ? 'Awaiting triage' : 'Assigned to analyst', actor: status !== 'new' ? 'SOC Manager' : undefined },
      ].filter(t => t.actor !== undefined || t.action !== undefined)
    };
  });
}

// Mock compliance frameworks
export function getMockComplianceFrameworks(): ComplianceFramework[] {
  return [
    {
      id: 'SOC2-TYPE2',
      name: 'SOC 2 Type II',
      version: '2017',
      score: 92,
      status: 'compliant',
      requirementsTotal: 89,
      requirementsMet: 82,
      requirementsPartial: 7,
      lastAudited: randomDate(90),
      nextAudit: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      controls: []
    },
    {
      id: 'GDPR',
      name: 'GDPR',
      version: 'EU 2016/679',
      score: 78,
      status: 'in-progress',
      requirementsTotal: 50,
      requirementsMet: 39,
      requirementsPartial: 8,
      lastAudited: randomDate(180),
      controls: []
    },
    {
      id: 'ISO27001',
      name: 'ISO 27001',
      version: '2022',
      score: 88,
      status: 'compliant',
      requirementsTotal: 114,
      requirementsMet: 100,
      requirementsPartial: 12,
      lastAudited: randomDate(60),
      nextAudit: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      controls: []
    },
    {
      id: 'PCI-DSS',
      name: 'PCI-DSS',
      version: '4.0',
      score: 95,
      status: 'compliant',
      requirementsTotal: 78,
      requirementsMet: 74,
      requirementsPartial: 4,
      lastAudited: randomDate(45),
      controls: []
    },
    {
      id: 'HIPAA',
      name: 'HIPAA',
      version: 'Omnibus',
      score: 85,
      status: 'compliant',
      requirementsTotal: 60,
      requirementsMet: 51,
      requirementsPartial: 6,
      lastAudited: randomDate(120),
      controls: []
    },
  ];
}

// Mock assets
export function getMockAssets(count: number = 100): Asset[] {
  const types: Asset['type'][] = ['server', 'workstation', 'network', 'cloud', 'container', 'database', 'application', 'iot'];
  const criticalities: Asset['criticality'][] = ['critical', 'high', 'medium', 'low'];
  const statuses: Asset['status'][] = ['active', 'maintenance', 'decommissioned', 'at-risk'];
  const owners = ['IT Operations', 'Development', 'Security', 'Infrastructure', 'DevOps'];
  
  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    const criticality = criticalities[Math.floor(Math.random() * criticalities.length)];
    
    return {
      id: generateMockId('AST'),
      name: `${type}-${String(i + 1).padStart(3, '0')}`,
      type,
      criticality,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      ip: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      hostname: `${type}${i + 1}.internal.corp`,
      os: ['Windows Server 2022', 'Ubuntu 22.04', 'RHEL 9', 'CentOS 8', 'macOS 14'][Math.floor(Math.random() * 5)],
      owner: owners[Math.floor(Math.random() * owners.length)],
      lastScanned: randomDate(7),
      vulnerabilities: Math.floor(Math.random() * 15),
      riskScore: Math.floor(Math.random() * 100),
      classification: criticality === 'critical' ? 'restricted' : criticality === 'high' ? 'confidential' : 'internal'
    };
  });
}

// Mock security metrics
export function getMockMetrics(): SecurityMetric[] {
  return [
    { id: 'mttd', name: 'Mean Time to Detect', value: 2.3, unit: 'hours', trend: 'down', change: 15, category: 'detection' },
    { id: 'mttr', name: 'Mean Time to Respond', value: 4.7, unit: 'hours', trend: 'down', change: 22, category: 'response' },
    { id: 'mttrc', name: 'Mean Time to Recover', value: 8.2, unit: 'hours', trend: 'stable', change: 3, category: 'recovery' },
    { id: 'vuln-critical', name: 'Critical Vulnerabilities', value: 3, trend: 'down', change: 40, category: 'vulnerability' },
    { id: 'vuln-high', name: 'High Vulnerabilities', value: 12, trend: 'down', change: 25, category: 'vulnerability' },
    { id: 'incidents-open', name: 'Open Incidents', value: 8, trend: 'stable', change: 0, category: 'incident' },
    { id: 'incidents-critical', name: 'Critical Incidents (30d)', value: 2, trend: 'down', change: 50, category: 'incident' },
    { id: 'compliance-score', name: 'Overall Compliance', value: 89, unit: '%', trend: 'up', change: 5, category: 'compliance' },
    { id: 'patch-compliance', name: 'Patch Compliance', value: 94, unit: '%', trend: 'up', change: 8, category: 'vulnerability' },
    { id: 'mfa-coverage', name: 'MFA Coverage', value: 87, unit: '%', trend: 'up', change: 12, category: 'identity' },
    { id: 'endpoint-protection', name: 'Endpoint Protection', value: 98, unit: '%', trend: 'stable', change: 1, category: 'endpoint' },
    { id: 'phishing-rate', name: 'Phishing Click Rate', value: 3.2, unit: '%', trend: 'down', change: 28, category: 'awareness' },
  ];
}

// Mock threat intel
export function getMockThreatIntel(count: number = 20): ThreatIntel[] {
  const types: ThreatIntel['type'][] = ['ipv4', 'domain', 'hash', 'url'];
  const threatTypes = ['C2 Server', 'Malware Hosting', 'Phishing', 'Botnet', 'Ransomware', 'APT', 'Spam'];
  const sources = ['AlienVault OTX', 'VirusTotal', 'AbuseIPDB', 'ThreatFox', 'MISP', 'CrowdSec'];
  
  return Array.from({ length: count }, (_, i) => {
    const type = types[Math.floor(Math.random() * types.length)];
    let indicator: string;
    
    switch (type) {
      case 'ipv4':
        indicator = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        break;
      case 'domain':
        indicator = `malicious-${i}.${['evil.com', 'bad.net', 'phish.io', 'malware.xyz'][Math.floor(Math.random() * 4)]}`;
        break;
      case 'hash':
        indicator = Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
        break;
      case 'url':
        indicator = `https://malicious-${i}.com/payload.exe`;
        break;
      default:
        indicator = 'unknown';
    }
    
    return {
      id: generateMockId('TI'),
      indicator,
      type,
      threatType: threatTypes[Math.floor(Math.random() * threatTypes.length)],
      confidence: Math.floor(Math.random() * 30) + 70,
      severity: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)] as ThreatIntel['severity'],
      source: sources[Math.floor(Math.random() * sources.length)],
      firstSeen: randomDate(30),
      lastSeen: randomDate(1),
      description: `Known ${threatTypes[Math.floor(Math.random() * threatTypes.length)]} infrastructure detected.`
    };
  });
}

// Mock alerts
export function getMockAlerts(count: number = 50): SecurityAlert[] {
  const severities: SecurityAlert['severity'][] = ['critical', 'high', 'medium', 'low', 'info'];
  const statuses: SecurityAlert['status'][] = ['new', 'acknowledged', 'resolved', 'false-positive'];
  const sources = ['SIEM', 'EDR', 'DLP', 'Firewall', 'IDS/IPS', 'WAF', 'CloudTrail', 'DNS Security'];
  
  const titles = [
    'Suspicious login detected from unusual location',
    'Multiple authentication failures',
    'Sensitive data uploaded to external destination',
    'New process spawned from rundll32',
    'Network connection to known malicious IP',
    'Unauthorized privilege escalation attempt',
    'Potential data exfiltration detected',
    'Brute force attack detected',
    'Malware signature match',
    'Anomalous outbound traffic pattern',
    'Certificate validation failure',
    'SQL injection attempt blocked',
    'Cross-site scripting (XSS) attempt',
    'Privilege escalation successful',
    'Unusual admin activity detected',
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const severity = severities[Math.floor(Math.random() * severities.length)];
    
    return {
      id: generateMockId('ALERT'),
      title: titles[i % titles.length],
      severity,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      rule: `SOC-RULE-${Math.floor(Math.random() * 1000)}`,
      timestamp: randomDate(1),
      description: `Security rule triggered: ${titles[i % titles.length].toLowerCase()}`,
    };
  });
}

// Mock remediation tasks
export function getMockRemediationTasks(count: number = 15): RemediationTask[] {
  const priorities: RemediationTask['priority'][] = ['critical', 'high', 'medium', 'low'];
  const statuses: RemediationTask['status'][] = ['pending', 'in-progress', 'completed', 'blocked', 'verified'];
  const titles = [
    'Apply critical security patches to production servers',
    'Enable MFA for all privileged accounts',
    'Update firewall rules to block malicious IPs',
    'Isolate compromised endpoint for forensics',
    'Implement DLP policy for sensitive data',
    'Configure SIEM correlation rules',
    'Remediate SQL injection vulnerability',
    'Update SSL certificates',
    'Enable endpoint detection and response',
    'Implement network segmentation',
    'Configure backup verification',
    'Review and revoke unused access',
    'Update incident response playbooks',
    'Conduct security awareness training',
    'Perform penetration testing',
  ];
  
  return Array.from({ length: count }, (_, i) => {
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      id: generateMockId('REM'),
      title: titles[i % titles.length],
      description: `Remediation task for: ${titles[i % titles.length].toLowerCase()}`,
      status,
      priority,
      assignee: status !== 'pending' ? { name: ['Alex Kim', 'Jordan Lee', 'Taylor Swift', 'Morgan Chen'][Math.floor(Math.random() * 4)], initials: 'XX' } : undefined,
      createdAt: randomDate(14),
      dueDate: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: status === 'completed' || status === 'verified' ? randomDate(3) : undefined,
      estimatedHours: Math.floor(Math.random() * 8) + 1,
    };
  });
}

// API Service class
export class SecurityApiService {
  private baseUrl: string;
  private apiKey?: string;
  
  constructor(baseUrl: string = '/api', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }
  
  // Use mock data for development
  private useMock = true;
  
  async getVulnerabilities(filters?: Partial<Vulnerability>): Promise<Vulnerability[]> {
    if (this.useMock) {
      return getMockVulnerabilities();
    }
    // Real API call would go here
    const params = new URLSearchParams();
    if (filters?.severity) params.set('severity', filters.severity);
    if (filters?.status) params.set('status', filters.status);
    const response = await fetch(`${this.baseUrl}/vulnerabilities?${params}`, this.getHeaders());
    return response.json();
  }
  
  async getIncidents(): Promise<SecurityIncident[]> {
    if (this.useMock) {
      return getMockIncidents();
    }
    const response = await fetch(`${this.baseUrl}/incidents`, this.getHeaders());
    return response.json();
  }
  
  async getComplianceFrameworks(): Promise<ComplianceFramework[]> {
    if (this.useMock) {
      return getMockComplianceFrameworks();
    }
    const response = await fetch(`${this.baseUrl}/compliance`, this.getHeaders());
    return response.json();
  }
  
  async getAssets(): Promise<Asset[]> {
    if (this.useMock) {
      return getMockAssets();
    }
    const response = await fetch(`${this.baseUrl}/assets`, this.getHeaders());
    return response.json();
  }
  
  async getMetrics(): Promise<SecurityMetric[]> {
    if (this.useMock) {
      return getMockMetrics();
    }
    const response = await fetch(`${this.baseUrl}/metrics`, this.getHeaders());
    return response.json();
  }
  
  async getThreatIntel(): Promise<ThreatIntel[]> {
    if (this.useMock) {
      return getMockThreatIntel();
    }
    const response = await fetch(`${this.baseUrl}/threat-intel`, this.getHeaders());
    return response.json();
  }
  
  async getAlerts(): Promise<SecurityAlert[]> {
    if (this.useMock) {
      return getMockAlerts();
    }
    const response = await fetch(`${this.baseUrl}/alerts`, this.getHeaders());
    return response.json();
  }
  
  async getRemediationTasks(): Promise<RemediationTask[]> {
    if (this.useMock) {
      return getMockRemediationTasks();
    }
    const response = await fetch(`${this.baseUrl}/remediation`, this.getHeaders());
    return response.json();
  }
  
  // Dashboard summary
  async getDashboardSummary(): Promise<{
    metrics: SecurityMetric[];
    criticalVulns: number;
    openIncidents: number;
    complianceScore: number;
    riskScore: number;
  }> {
    if (this.useMock) {
      const metrics = getMockMetrics();
      return {
        metrics,
        criticalVulns: metrics.find(m => m.id === 'vuln-critical')?.value || 0,
        openIncidents: metrics.find(m => m.id === 'incidents-open')?.value || 0,
        complianceScore: metrics.find(m => m.id === 'compliance-score')?.value || 0,
        riskScore: 35
      };
    }
    const response = await fetch(`${this.baseUrl}/dashboard/summary`, this.getHeaders());
    return response.json();
  }
  
  private getHeaders(): RequestInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    return { headers };
  }
}

// Export singleton instance
export const securityApi = new SecurityApiService();

export default SecurityApiService;
