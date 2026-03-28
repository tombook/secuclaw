/**
 * Mock Data Service - Mock数据服务
 * 
 * 当后端API不可用时，提供完整的Mock数据支持
 */

// ============ Mock Data Types ============

export interface MockIncident {
  id: string;
  ticketId: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'new' | 'investigating' | 'containing' | 'eradicating' | 'recovering' | 'resolved';
  category: string;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  description: string;
}

export interface MockVulnerability {
  id: string;
  cveId: string;
  title: string;
  cvss: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'accepted';
  affectedAssets: number;
  discoveredAt: string;
  fixedAt?: string;
}

export interface MockThreat {
  id: string;
  type: string;
  name: string;
  source: string;
  confidence: number;
  iocs: string[];
  lastSeen: string;
}

export interface MockComplianceItem {
  id: string;
  framework: string;
  requirement: string;
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_applicable';
  score: number;
  lastAudit: string;
}

export interface MockAsset {
  id: string;
  name: string;
  type: 'server' | 'workstation' | 'network' | 'database' | 'application';
  status: 'online' | 'offline' | 'maintenance';
  risk: 'critical' | 'high' | 'medium' | 'low';
  owner: string;
}

// ============ Mock Data ============

export const mockIncidents: MockIncident[] = [
  { id: 'inc-001', ticketId: 'SEC-2026-0001', title: 'APT29钓鱼攻击响应', severity: 'critical', status: 'containing', category: 'Phishing', assignee: '张安全', createdAt: '2026-03-26T05:00:00Z', updatedAt: '2026-03-26T05:27:00Z', description: '检测到APT29组织针对高管的钓鱼攻击' },
  { id: 'inc-002', ticketId: 'SEC-2026-0002', title: '勒索软件感染处理', severity: 'critical', status: 'eradicating', category: 'Ransomware', assignee: '李运维', createdAt: '2026-03-26T04:00:00Z', updatedAt: '2026-03-26T05:17:00Z', description: 'LockBit勒索软件感染，已隔离' },
  { id: 'inc-003', ticketId: 'SEC-2026-0003', title: '异常数据传输调查', severity: 'high', status: 'investigating', category: 'Data Breach', assignee: '王合规', createdAt: '2026-03-26T03:30:00Z', updatedAt: '2026-03-26T04:47:00Z', description: '检测到大量数据外传' },
  { id: 'inc-004', ticketId: 'SEC-2026-0004', title: 'DDoS攻击缓解', severity: 'medium', status: 'recovering', category: 'DDoS', assignee: '赵网络', createdAt: '2026-03-26T01:00:00Z', updatedAt: '2026-03-26T04:57:00Z', description: 'DDoS攻击流量已缓解' },
  { id: 'inc-005', ticketId: 'SEC-2026-0005', title: '可疑进程分析', severity: 'low', status: 'new', category: 'Malware', assignee: '陈分析', createdAt: '2026-03-26T05:22:00Z', updatedAt: '2026-03-26T05:22:00Z', description: '检测到可疑进程' },
];

export const mockVulnerabilities: MockVulnerability[] = [
  { id: 'vuln-001', cveId: 'CVE-2024-21762', title: 'FortiOS SSL VPN远程代码执行', cvss: 9.8, severity: 'critical', status: 'open', affectedAssets: 12, discoveredAt: '2026-03-20T00:00:00Z' },
  { id: 'vuln-002', cveId: 'CVE-2024-3400', title: 'Palo Alto PAN-OS命令注入', cvss: 10.0, severity: 'critical', status: 'in_progress', affectedAssets: 8, discoveredAt: '2026-03-21T00:00:00Z' },
  { id: 'vuln-003', cveId: 'CVE-2024-27198', title: 'TeamCity认证绕过漏洞', cvss: 9.8, severity: 'critical', status: 'open', affectedAssets: 5, discoveredAt: '2026-03-22T00:00:00Z' },
  { id: 'vuln-004', cveId: 'CVE-2023-22515', title: 'Confluence模板注入', cvss: 9.1, severity: 'critical', status: 'resolved', affectedAssets: 3, discoveredAt: '2026-03-15T00:00:00Z', fixedAt: '2026-03-25T00:00:00Z' },
  { id: 'vuln-005', cveId: 'CVE-2024-XXXX', title: 'CVE-2024-XXXX 需优先修复', cvss: 7.5, severity: 'high', status: 'open', affectedAssets: 15, discoveredAt: '2026-03-24T00:00:00Z' },
  { id: 'vuln-006', cveId: 'CVE-2023-44487', title: 'HTTP/2 Rapid Reset攻击', cvss: 7.5, severity: 'high', status: 'in_progress', affectedAssets: 20, discoveredAt: '2026-03-18T00:00:00Z' },
  { id: 'vuln-007', cveId: 'CVE-2024-0056', title: 'Microsoft SQL Server权限提升', cvss: 6.5, severity: 'medium', status: 'open', affectedAssets: 10, discoveredAt: '2026-03-19T00:00:00Z' },
];

export const mockThreats: MockThreat[] = [
  { id: 'threat-001', type: 'APT', name: 'APT29 (Cozy Bear)', source: '威胁情报订阅', confidence: 95, iocs: ['185.234.72.15', 'evil-domain.com'], lastSeen: '2026-03-26T05:00:00Z' },
  { id: 'threat-002', type: 'Ransomware', name: 'LockBit 3.0', source: '内部检测', confidence: 88, iocs: ['hash:abc123...'], lastSeen: '2026-03-26T04:00:00Z' },
  { id: 'threat-003', type: 'Phishing', name: 'BEC攻击活动', source: '邮件网关', confidence: 75, iocs: ['suspicious@attacker.com'], lastSeen: '2026-03-25T15:00:00Z' },
  { id: 'threat-004', type: 'Botnet', name: 'Mirai变种', source: '网络监控', confidence: 92, iocs: ['192.168.1.100'], lastSeen: '2026-03-24T10:00:00Z' },
];

export const mockComplianceItems: MockComplianceItem[] = [
  { id: 'comp-001', framework: 'GDPR', requirement: '数据保护', status: 'compliant', score: 85, lastAudit: '2026-03-01T00:00:00Z' },
  { id: 'comp-002', framework: 'SOC 2', requirement: '安全控制', status: 'partial', score: 75, lastAudit: '2026-03-05T00:00:00Z' },
  { id: 'comp-003', framework: 'ISO 27001', requirement: '信息安全管理', status: 'compliant', score: 92, lastAudit: '2026-03-10T00:00:00Z' },
  { id: 'comp-004', framework: 'PIPL', requirement: '个人信息保护', status: 'partial', score: 68, lastAudit: '2026-03-15T00:00:00Z' },
  { id: 'comp-005', framework: 'NIST CSF', requirement: '网络安全框架', status: 'compliant', score: 88, lastAudit: '2026-03-20T00:00:00Z' },
  { id: 'comp-006', framework: '等保2.0', requirement: '网络安全等级保护', status: 'partial', score: 78, lastAudit: '2026-03-22T00:00:00Z' },
];

export const mockAssets: MockAsset[] = [
  { id: 'asset-001', name: 'WEB-PROD-01', type: 'server', status: 'online', risk: 'high', owner: '李运维' },
  { id: 'asset-002', name: 'DB-PRIMARY', type: 'database', status: 'online', risk: 'critical', owner: '张安全' },
  { id: 'asset-003', name: 'FW-EDGE-01', type: 'network', status: 'online', risk: 'medium', owner: '赵网络' },
  { id: 'asset-004', name: 'WS-FINANCE-01', type: 'workstation', status: 'maintenance', risk: 'low', owner: '王合规' },
  { id: 'asset-005', name: 'APP-CRM-PROD', type: 'application', status: 'online', risk: 'medium', owner: '陈分析' },
];

// ============ Mock Stats ============

export const mockIncidentStats = {
  total: 5,
  open: 5,
  closed: 0,
  bySeverity: { critical: 2, high: 1, medium: 1, low: 1 },
  byStatus: { new: 1, investigating: 1, containing: 1, eradicating: 1, recovering: 1 },
  avgResponseTime: 15,
  avgResolutionTime: 180,
};

export const mockVulnerabilityStats = {
  total: 7,
  open: 5,
  resolved: 1,
  bySeverity: { critical: 4, high: 2, medium: 1, low: 0 },
  avgCvss: 8.5,
  exploitableCount: 4,
};

export const mockThreatStats = {
  total: 156,
  activeAPT: 3,
  activeRansomware: 2,
  highConfidence: 45,
};

export const mockComplianceStats = {
  overall: 81,
  frameworks: {
    GDPR: 85,
    'SOC 2': 75,
    'ISO 27001': 92,
    PIPL: 68,
    'NIST CSF': 88,
    '等保2.0': 78,
  },
};

// ============ Helper Functions ============

export function getMockDataByType<T>(type: string): T[] {
  switch (type) {
    case 'incidents': return mockIncidents as unknown as T[];
    case 'vulnerabilities': return mockVulnerabilities as unknown as T[];
    case 'threats': return mockThreats as unknown as T[];
    case 'compliance': return mockComplianceItems as unknown as T[];
    case 'assets': return mockAssets as unknown as T[];
    default: return [] as T[];
  }
}
