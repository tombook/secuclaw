/**
 * Data Seed Service - 数据初始化服务
 * 
 * 提供所有数据模块的初始化
 */
import type { JsonStore } from '../storage/json-store.js';
import type { SecurityIncident } from '../incidents/types.js';

export class DataSeedService {
  constructor(private store: JsonStore) {}

  async seedAll(): Promise<void> {
    console.log('[DataSeed] Starting data seeding...');
    
    await this.seedIncidents();
    await this.seedVulnerabilities();
    await this.seedThreats();
    await this.seedCompliance();
    await this.seedAssets();
    await this.seedCapabilities();
    
    console.log('[DataSeed] Data seeding complete');
  }

  // ==================== Incidents ====================

  async seedIncidents(): Promise<void> {
    const existing = await this.store.get<SecurityIncident[]>('incidents.json');
    if (existing && existing.length > 0) {
      console.log('[DataSeed] Incidents already seeded, skipping');
      return;
    }

    const now = Date.now();
    const hour = 3600000;
    const day = 86400000;

    const incidents: SecurityIncident[] = [
      {
        id: 'inc-001',
        ticketId: 'SEC-2026-0001',
        info: {
          title: 'APT29钓鱼攻击响应',
          description: '检测到APT29组织针对高管的钓鱼攻击',
          category: 'Phishing',
          severity: 'critical',
          priority: 1,
          source: '邮件网关',
        },
        timeline: {
          detectedAt: now - hour * 2,
          reportedAt: now - hour * 2,
          acknowledgedAt: now - hour * 1.5,
          containingAt: now - hour,
        },
        sla: {
          responseDeadline: now - hour * 0.5,
          resolutionDeadline: now + day,
          responseBreached: true,
        },
        workflow: {
          status: 'containing',
          assignee: '张安全',
          assigneeRole: '安全专家',
        },
        impact: {
          affectedAssets: ['workstation-001', 'workstation-002'],
          affectedUsers: 2,
          dataTypes: ['credentials', 'emails'],
          businessImpact: '高 - 可能影响高管账户',
        },
        handlers: [
          { user: '张安全', role: '安全专家', joinedAt: now - hour * 1.5, actions: ['隔离工作站', '阻断钓鱼链接'] },
        ],
        createdAt: now - hour * 2,
        updatedAt: now - hour,
      },
      {
        id: 'inc-002',
        ticketId: 'SEC-2026-0002',
        info: {
          title: '勒索软件感染处理',
          description: 'LockBit勒索软件感染，已隔离',
          category: 'Ransomware',
          severity: 'critical',
          priority: 1,
          source: 'EDR',
        },
        timeline: {
          detectedAt: now - hour * 4,
          reportedAt: now - hour * 4,
          acknowledgedAt: now - hour * 3.5,
          containingAt: now - hour * 2,
          eradicatedAt: now - hour * 0.5,
        },
        sla: {
          responseDeadline: now - hour * 2,
          resolutionDeadline: now + day * 0.7,
        },
        workflow: {
          status: 'eradicating',
          assignee: '李运维',
          assigneeRole: '安全运营',
        },
        impact: {
          affectedAssets: ['server-db-001'],
          affectedUsers: 10,
          dataTypes: ['数据库', '文件'],
          businessImpact: '严重 - 数据库服务器被感染',
        },
        handlers: [
          { user: '李运维', role: '安全运营', joinedAt: now - hour * 3.5, actions: ['隔离服务器', '提取样本'] },
        ],
        createdAt: now - hour * 4,
        updatedAt: now - hour * 0.5,
      },
      {
        id: 'inc-003',
        ticketId: 'SEC-2026-0003',
        info: {
          title: '异常数据传输调查',
          description: '检测到大量数据外传',
          category: 'Data Breach',
          severity: 'high',
          priority: 2,
          source: 'DLP',
        },
        timeline: {
          detectedAt: now - hour * 6,
          reportedAt: now - hour * 6,
          acknowledgedAt: now - hour * 5.5,
        },
        sla: {
          responseDeadline: now - hour * 4,
          resolutionDeadline: now + day * 0.8,
        },
        workflow: {
          status: 'investigating',
          assignee: '王合规',
          assigneeRole: '合规官',
        },
        impact: {
          affectedAssets: ['workstation-finance-01'],
          affectedUsers: 1,
          dataTypes: ['财务数据'],
          businessImpact: '中 - 疑似数据泄露',
        },
        handlers: [
          { user: '王合规', role: '合规官', joinedAt: now - hour * 5.5, actions: ['阻断传输', '调查来源'] },
        ],
        createdAt: now - hour * 6,
        updatedAt: now - hour * 3,
      },
      {
        id: 'inc-004',
        ticketId: 'SEC-2026-0004',
        info: {
          title: 'DDoS攻击缓解',
          description: 'DDoS攻击流量已缓解',
          category: 'DDoS',
          severity: 'medium',
          priority: 3,
          source: '网络监控',
        },
        timeline: {
          detectedAt: now - hour * 10,
          reportedAt: now - hour * 10,
          acknowledgedAt: now - hour * 9.5,
          containingAt: now - hour * 9,
          eradicatedAt: now - hour * 5,
          recoveredAt: now - hour * 2,
        },
        sla: {
          responseDeadline: now - hour * 8,
          resolutionDeadline: now + day * 0.5,
        },
        workflow: {
          status: 'recovering',
          assignee: '赵网络',
          assigneeRole: '网络工程师',
          resolution: 'DDoS攻击已缓解，服务恢复正常',
        },
        impact: {
          affectedAssets: ['fw-edge-01', 'load-balancer-01'],
          affectedUsers: 50,
          dataTypes: [],
          businessImpact: '低 - 短暂服务中断',
        },
        handlers: [
          { user: '赵网络', role: '网络工程师', joinedAt: now - hour * 9.5, actions: ['启用DDoS防护', '清洗流量'] },
        ],
        createdAt: now - hour * 10,
        updatedAt: now - hour * 2,
      },
      {
        id: 'inc-005',
        ticketId: 'SEC-2026-0005',
        info: {
          title: '可疑进程分析',
          description: '检测到可疑进程',
          category: 'Malware',
          severity: 'low',
          priority: 4,
          source: 'EDR',
        },
        timeline: {
          detectedAt: now - hour * 0.5,
          reportedAt: now - hour * 0.5,
        },
        sla: {
          responseDeadline: now + day * 0.9,
          resolutionDeadline: now + day * 1,
        },
        workflow: {
          status: 'new',
        },
        impact: {
          affectedAssets: ['workstation-dev-01'],
          affectedUsers: 1,
          dataTypes: [],
          businessImpact: '低 - 待确认',
        },
        handlers: [],
        createdAt: now - hour * 0.5,
        updatedAt: now - hour * 0.5,
      },
    ];

    await this.store.set('incidents.json', incidents);
    console.log('[DataSeed] Seeded 5 incidents');
  }

  // ==================== Vulnerabilities ====================

  async seedVulnerabilities(): Promise<void> {
    const existing = await this.store.get<any[]>('vulnerabilities.json');
    if (existing && existing.length > 0) {
      console.log('[DataSeed] Vulnerabilities already seeded, skipping');
      return;
    }

    const now = Date.now();
    const day = 86400000;

    const vulns = [
      {
        id: 'vuln-001',
        info: {
          cveId: 'CVE-2024-21762',
          title: 'FortiOS SSL VPN远程代码执行漏洞',
          description: 'FortiOS SSL VPN存在远程代码执行漏洞，CVSS评分9.8',
          cvss: { score: 9.8, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', severity: 'critical' },
          cwe: ['CWE-1225'],
          affectedProducts: ['FortiOS 7.4.0-7.4.2'],
          exploitAvailable: true,
          exploitInWild: true,
        },
        affectedAssets: [
          { assetId: 'asset-001', componentName: 'FortiGate-100F', componentVersion: '7.4.1', fixVersion: '7.4.3' },
        ],
        remediation: { status: 'open', priority: 1, fixAvailable: true, fixSteps: ['升级到7.4.3'] },
        risk: { baseScore: 9.8, adjustedScore: 9.8, businessImpact: 10, exposureScore: 8, totalRiskScore: 9.8 },
        createdAt: now - day * 5,
        updatedAt: now - day * 2,
      },
      {
        id: 'vuln-002',
        info: {
          cveId: 'CVE-2024-3400',
          title: 'Palo Alto PAN-OS命令注入漏洞',
          description: 'Palo Alto PAN-OS存在命令注入漏洞',
          cvss: { score: 10.0, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H', severity: 'critical' },
          cwe: ['CWE-77'],
          affectedProducts: ['PAN-OS 10.2', 'PAN-OS 11.0'],
          exploitAvailable: true,
          exploitInWild: false,
        },
        affectedAssets: [
          { assetId: 'asset-003', componentName: 'PA-460', componentVersion: '10.2.8', fixVersion: '10.2.9-h1' },
        ],
        remediation: { status: 'in_progress', priority: 1, assignedTo: '李运维', fixAvailable: true, fixSteps: ['应用PAN-OS补丁'] },
        risk: { baseScore: 10.0, adjustedScore: 10.0, businessImpact: 10, exposureScore: 9, totalRiskScore: 10.0 },
        createdAt: now - day * 4,
        updatedAt: now - day,
      },
      {
        id: 'vuln-003',
        info: {
          cveId: 'CVE-2023-22515',
          title: 'Confluence模板注入漏洞',
          description: 'Atlassian Confluence存在模板注入漏洞',
          cvss: { score: 9.1, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H', severity: 'critical' },
          cwe: ['CWE-1336'],
          affectedProducts: ['Confluence 7.19-8.5'],
          exploitAvailable: true,
          exploitInWild: true,
        },
        affectedAssets: [
          { assetId: 'asset-006', componentName: 'Confluence DC', componentVersion: '8.5.0', fixVersion: '8.5.3' },
        ],
        remediation: { status: 'resolved', priority: 2, assignedTo: '张安全', fixAvailable: true, fixSteps: ['已升级到8.5.3'] },
        risk: { baseScore: 9.1, adjustedScore: 0, businessImpact: 8, exposureScore: 6, totalRiskScore: 0 },
        createdAt: now - day * 10,
        updatedAt: now - day * 5,
      },
      {
        id: 'vuln-004',
        info: {
          cveId: 'CVE-2024-0056',
          title: 'Microsoft SQL Server权限提升漏洞',
          description: 'Microsoft SQL Server存在权限提升漏洞',
          cvss: { score: 6.5, vector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:N', severity: 'medium' },
          cwe: ['CWE-269'],
          affectedProducts: ['SQL Server 2019'],
          exploitAvailable: false,
          exploitInWild: false,
        },
        affectedAssets: [
          { assetId: 'asset-007', componentName: 'SQL Server 2019', componentVersion: '15.0.4355', fixVersion: '15.0.4400' },
        ],
        remediation: { status: 'open', priority: 3, fixAvailable: true, fixSteps: ['应用SQL Server安全更新'] },
        risk: { baseScore: 6.5, adjustedScore: 6.5, businessImpact: 6, exposureScore: 4, totalRiskScore: 5.5 },
        createdAt: now - day * 7,
        updatedAt: now - day * 3,
      },
    ];

    await this.store.set('vulnerabilities.json', vulns);
    console.log('[DataSeed] Seeded 4 vulnerabilities');
  }

  // ==================== Threats ====================

  async seedThreats(): Promise<void> {
    const existing = await this.store.get<any[]>('threats.json');
    if (existing && existing.length > 0) {
      console.log('[DataSeed] Threats already seeded, skipping');
      return;
    }

    const now = Date.now();
    const day = 86400000;

    const threats = [
      {
        id: 'threat-001',
        name: 'APT29 (Cozy Bear)',
        type: 'apt',
        motivation: 'espionage',
        severity: 'critical',
        confidence: 95,
        source: '威胁情报订阅',
        description: '俄罗斯关联APT组织，专注于政府机构和智库的间谍活动',
        iocs: [
          { type: 'ip', value: '185.234.72.15', description: 'C2服务器' },
          { type: 'domain', value: 'cloud.俄国域名.com', description: '钓鱼域名' },
        ],
        ttps: ['T1566', 'T1041'],
        firstSeen: now - day * 90,
        lastSeen: now - day,
        createdAt: now - day * 90,
        updatedAt: now - day,
      },
      {
        id: 'threat-002',
        name: 'LockBit 3.0',
        type: 'ransomware',
        motivation: 'financial',
        severity: 'critical',
        confidence: 92,
        source: '内部检测',
        description: '最活跃的勒索软件即服务组织之一',
        iocs: [
          { type: 'hash', value: 'a1b2c3d4e5f6...', description: '勒索软件样本' },
        ],
        ttps: ['T1486', 'T1490'],
        firstSeen: now - day * 30,
        lastSeen: now - day,
        createdAt: now - day * 30,
        updatedAt: now - day,
      },
      {
        id: 'threat-003',
        name: 'BEC攻击活动',
        type: 'phishing',
        motivation: 'financial',
        severity: 'medium',
        confidence: 75,
        source: '邮件网关',
        description: '商业电子邮件欺诈攻击',
        iocs: [
          { type: 'email', value: 'ceo@公司-合作方.com', description: '伪造发件人' },
        ],
        ttps: ['T1566', 'T1071'],
        firstSeen: now - day * 7,
        lastSeen: now - day,
        createdAt: now - day * 7,
        updatedAt: now - day,
      },
    ];

    await this.store.set('threats.json', threats);
    console.log('[DataSeed] Seeded 3 threats');
  }

  // ==================== Compliance ====================

  async seedCompliance(): Promise<void> {
    const existing = await this.store.get<any[]>('compliance.json');
    if (existing && existing.length > 0) {
      console.log('[DataSeed] Compliance already seeded, skipping');
      return;
    }

    const now = Date.now();
    const day = 86400000;

    const items = [
      { id: 'gdpr-001', framework: 'GDPR', controlId: 'A.1', title: 'Lawfulness and transparency', titleCn: '合法性与透明性', description: '处理必须合法、公平和透明', descriptionCn: '处理必须合法', category: 'Principles', status: 'compliant', evidence: 'Privacy policy', auditor: '王合规', lastAuditDate: now - day * 30, nextAuditDate: now + day * 30 },
      { id: 'gdpr-002', framework: 'GDPR', controlId: 'A.2', title: 'Purpose limitation', titleCn: '目的限制', description: '数据仅用于指定目的', descriptionCn: '数据仅用于指定', category: 'Principles', status: 'partial', evidence: '', auditor: '王合规', lastAuditDate: now - day * 25, nextAuditDate: now + day * 35, findings: '部分系统数据保留期限未明确', remediation: '完善数据保留策略' },
      { id: 'soc2-001', framework: 'SOC 2', controlId: 'CC1.1', title: 'Control environment', titleCn: '控制环境', description: '实体展示对诚信的承诺', descriptionCn: '展示对诚信的承诺', category: 'Common Criteria', status: 'compliant', evidence: 'Code of conduct', auditor: '张安全', lastAuditDate: now - day * 60, nextAuditDate: now + day * 30 },
      { id: 'soc2-002', framework: 'SOC 2', controlId: 'CC6.1', title: 'Logical access', titleCn: '逻辑访问', description: '限制逻辑访问', descriptionCn: '限制逻辑访问', category: 'Security', status: 'compliant', evidence: 'IAM policy', auditor: '张安全', lastAuditDate: now - day * 60, nextAuditDate: now + day * 30 },
      { id: 'iso-001', framework: 'ISO 27001', controlId: 'A.5.1', title: 'Information security policies', titleCn: '信息安全政策', description: '政策已批准和发布', descriptionCn: '政策已批准发布', category: 'Policies', status: 'compliant', evidence: 'Policy documents', auditor: '李运维', lastAuditDate: now - day * 90, nextAuditDate: now + day * 90 },
    ];

    await this.store.set('compliance.json', items);
    console.log('[DataSeed] Seeded 5 compliance items');
  }

  // ==================== Assets ====================

  async seedAssets(): Promise<void> {
    const existing = await this.store.get<any[]>('assets.json');
    if (existing && existing.length > 0) {
      console.log('[DataSeed] Assets already seeded, skipping');
      return;
    }

    const now = Date.now();
    const day = 86400000;

    const assets = [
      { id: 'asset-001', name: 'WEB-PROD-01', type: 'server', subtype: 'nginx', status: 'online', criticality: 'critical', ipAddress: '10.0.1.10', owner: { name: '李运维', department: '运维部' }, department: '运维部', environment: 'production', platform: 'Linux', os: 'Ubuntu', osVersion: '22.04 LTS', tags: ['web', 'production'], vulnerabilities: [{ vulnId: 'vuln-001', cveId: 'CVE-2024-21762', severity: 'critical', status: 'open', discoveredAt: now - day * 5 }], firstSeen: now - day * 180, lastSeen: now - day, createdAt: now - day * 180, updatedAt: now - day },
      { id: 'asset-002', name: 'DB-PRIMARY', type: 'database', subtype: 'postgresql', status: 'online', criticality: 'critical', ipAddress: '10.0.2.10', owner: { name: '张安全', department: '安全部' }, department: '安全部', environment: 'production', platform: 'Linux', os: 'Debian', osVersion: '11', tags: ['database', 'postgresql'], vulnerabilities: [], firstSeen: now - day * 200, lastSeen: now - day, createdAt: now - day * 200, updatedAt: now - day },
      { id: 'asset-003', name: 'FW-EDGE-01', type: 'network', subtype: 'firewall', status: 'online', criticality: 'critical', ipAddress: '10.0.0.1', owner: { name: '赵网络', department: '基础架构部' }, department: '基础架构部', environment: 'production', platform: 'Fortinet', os: 'FortiOS', osVersion: '7.4.2', tags: ['firewall', 'security'], vulnerabilities: [{ vulnId: 'vuln-001', cveId: 'CVE-2024-21762', severity: 'critical', status: 'open', discoveredAt: now - day * 5 }], firstSeen: now - day * 365, lastSeen: now - day, createdAt: now - day * 365, updatedAt: now - day },
      { id: 'asset-004', name: 'WS-FINANCE-01', type: 'workstation', subtype: 'desktop', status: 'online', criticality: 'medium', ipAddress: '192.168.1.101', owner: { name: '陈财务', department: '财务部' }, department: '财务部', environment: 'production', platform: 'Windows', os: 'Windows 11', osVersion: '22H2', tags: ['workstation', 'finance'], vulnerabilities: [], firstSeen: now - day * 100, lastSeen: now - day, createdAt: now - day * 100, updatedAt: now - day },
      { id: 'asset-005', name: 'LAPTOP-DEV-01', type: 'workstation', subtype: 'laptop', status: 'online', criticality: 'medium', ipAddress: '192.168.1.201', owner: { name: '王开发', department: '研发部' }, department: '研发部', environment: 'production', platform: 'macOS', os: 'Sonoma', osVersion: '14.4', tags: ['laptop', 'developer'], vulnerabilities: [], firstSeen: now - day * 90, lastSeen: now - day, createdAt: now - day * 90, updatedAt: now - day },
    ];

    await this.store.set('assets.json', assets);
    console.log('[DataSeed] Seeded 5 assets');
  }

  // ==================== Capabilities ====================

  async seedCapabilities(): Promise<void> {
    const existing = await this.store.get<any[]>('capability-domains.json');
    if (existing && existing.length > 0) {
      console.log('[DataSeed] Capability domains already seeded, skipping');
      return;
    }

    const now = Date.now();
    const day = 86400000;

    // Define 6 capability domains
    const domains = [
      {
        id: 'light',
        name: '光明面',
        nameEn: 'Light',
        description: '检测防御：监控、检测与事件响应等防御性能力。',
        descriptionEn: 'Defensive security operations including monitoring, detection and incident response.',
        icon: '💡',
        color: '#4CAF50',
        ownerRoles: ['security-expert'],
        partnerRoles: ['ops-engineer'],
        kpi: { riskScore: 25, closureRate: 60, slaRate: 70, trend: 0.2, updatedAt: now },
        capabilityCount: 4,
        enabled: true,
        order: 1,
      },
      {
        id: 'dark',
        name: '黑暗面',
        nameEn: 'Dark',
        description: '攻击模拟：渗透测试、红队演练与攻击模拟的能力域。',
        descriptionEn: 'Offensive security including penetration testing, red team and attack simulations.',
        icon: '🕶️',
        color: '#212121',
        ownerRoles: ['red-team-lead'],
        partnerRoles: ['blue-team'],
        kpi: { riskScore: 45, closureRate: 50, slaRate: 65, trend: 0.1, updatedAt: now },
        capabilityCount: 4,
        enabled: true,
        order: 2,
      },
      {
        id: 'security',
        name: '安全管理',
        nameEn: 'Security',
        description: '安全治理：策略、风险管理、合规等 governance 领域。',
        descriptionEn: 'Security governance including policy, risk management and compliance.',
        icon: '🛡️',
        color: '#3F51B5',
        ownerRoles: ['security-officer'],
        partnerRoles: ['compliance-manager'],
        kpi: { riskScore: 35, closureRate: 70, slaRate: 75, trend: -0.05, updatedAt: now },
        capabilityCount: 4,
        enabled: true,
        order: 3,
      },
      {
        id: 'legal',
        name: '法律合规',
        nameEn: 'Legal',
        description: '法律与监管：隐私、审计、监管合规等领域。',
        descriptionEn: 'Legal and regulatory: privacy, audits and regulatory compliance.',
        icon: '⚖️',
        color: '#9C27B0',
        ownerRoles: ['privacy-officer'],
        partnerRoles: ['regulatory-analyst'],
        kpi: { riskScore: 28, closureRate: 65, slaRate: 68, trend: 0.0, updatedAt: now },
        capabilityCount: 4,
        enabled: true,
        order: 4,
      },
      {
        id: 'technology',
        name: '技术基础',
        nameEn: 'Technology',
        description: '技术基础：资产、漏洞、补丁等基础设施与运维相关能力。',
        descriptionEn: 'Technical infrastructure including asset, vulnerability and patch management.',
        icon: '🧰',
        color: '#00BCD4',
        ownerRoles: ['it-ops'],
        partnerRoles: ['sec-ops'],
        kpi: { riskScore: 40, closureRate: 55, slaRate: 60, trend: 0.15, updatedAt: now },
        capabilityCount: 4,
        enabled: true,
        order: 5,
      },
      {
        id: 'business',
        name: '业务安全',
        nameEn: 'Business',
        description: '商务层面的安全：欺诈检测、供应链与第三方风险等。',
        descriptionEn: 'Business security including fraud detection, supply chain and third-party risk.',
        icon: '💼',
        color: '#FFC107',
        ownerRoles: ['fraud-analyst'],
        partnerRoles: ['vendor-security'],
        kpi: { riskScore: 30, closureRate: 60, slaRate: 65, trend: 0.0, updatedAt: now },
        capabilityCount: 4,
        enabled: true,
        order: 6,
      },
    ];

    // Save domains
    await this.store.set('capability-domains.json', domains);
    console.log('[DataSeed] Seeded 6 capability domains');

    // Define 3-5 items per domain (total 24 items)
    const items = [
      // Light domain items
      {
        id: 'light-01', domainId: 'light', name: '威胁监控与检测', nameEn: 'Threat Monitoring & Detection',
        description: '监控与检测威胁活动', descriptionEn: 'Monitor and detect threat activity',
        ownerRoles: ['security-analyst'], partnerRoles: ['security-engineer'], tools: ['SIEM','EDR'], mitreCoverage: ['T1056'], scfCoverage: ['SCF-01'],
        enabled: true, requiresApproval: false, priority: 1, createdAt: now - day * 20, updatedAt: now - day * 10
      },
      {
        id: 'light-02', domainId: 'light', name: '安全事件响应', nameEn: 'Incident Response',
        description: '检测后响应与处置安全事件', descriptionEn: 'Detect and respond to security incidents',
        ownerRoles: ['security-analyst'], partnerRoles: ['forensics'], tools: ['SOAR'], mitreCoverage: ['TA0001'], scfCoverage: ['SCF-02'],
        enabled: true, requiresApproval: false, priority: 2, createdAt: now - day * 16, updatedAt: now - day * 5
      },
      {
        id: 'light-03', domainId: 'light', name: '安全日志分析', nameEn: 'Log Analysis',
        description: '分析安全日志以发现异常活动', descriptionEn: 'Analyze security logs for anomalies',
        ownerRoles: ['security-analyst'], partnerRoles: ['it-ops'], tools: ['ELK'], mitreCoverage: ['TA0004'], scfCoverage: ['SCF-03'],
        enabled: true, requiresApproval: false, priority: 3, createdAt: now - day * 12, updatedAt: now - day * 3
      },
      {
        id: 'light-04', domainId: 'light', name: '异常行为检测', nameEn: 'Anomaly Detection',
        description: '检测用户与系统的异常行为模式', descriptionEn: 'Detect anomalous user/system behaviors',
        ownerRoles: ['security-analyst'], partnerRoles: ['data-scientist'], tools: ['ML-SIEM'], mitreCoverage: ['TA0005'], scfCoverage: ['SCF-04'],
        enabled: true, requiresApproval: false, priority: 2, createdAt: now - day * 8, updatedAt: now - day * 2
      },
      // Dark domain items
      {
        id: 'dark-01', domainId: 'dark', name: '渗透测试', nameEn: 'Penetration Testing',
        description: '模拟攻击以发现薄弱点', descriptionEn: 'Simulate attacks to identify weaknesses',
        ownerRoles: ['red-team-lead'], partnerRoles: ['blue-team'], tools: ['Metasploit','Burp'], mitreCoverage: ['T1059'], scfCoverage: ['SCF-11'],
        enabled: true, requiresApproval: true, priority: 1, createdAt: now - day * 30, updatedAt: now - day * 14
      },
      {
        id: 'dark-02', domainId: 'dark', name: '红队演练', nameEn: 'Red Team Exercise',
        description: '完整模拟攻防演练', descriptionEn: 'Comprehensive red team exercise',
        ownerRoles: ['red-team-lead'], partnerRoles: ['blue-team'], tools: ['Cobalt Strike'], mitreCoverage: ['T1086'], scfCoverage: ['SCF-12'],
        enabled: true, requiresApproval: true, priority: 2, createdAt: now - day * 25, updatedAt: now - day * 5
      },
      {
        id: 'dark-03', domainId: 'dark', name: '社会工程测试', nameEn: 'Social Engineering',
        description: '模拟社工攻击以测试组织防线', descriptionEn: 'Simulate social engineering attacks to test defenses',
        ownerRoles: ['social-eng-ops'], partnerRoles: ['security-awareness'], tools: ['phishing-kit'], mitreCoverage: ['T1566'], scfCoverage: ['SCF-13'],
        enabled: true, requiresApproval: true, priority: 3, createdAt: now - day * 20, updatedAt: now - day * 4
      },
      {
        id: 'dark-04', domainId: 'dark', name: '漏洞利用验证', nameEn: 'Exploit Validation',
        description: '验证已发现漏洞是否可被利用', descriptionEn: 'Validate exploitability of identified vulnerabilities',
        ownerRoles: ['red-team-ops'], partnerRoles: ['blue-team'], tools: ['Immunity'], mitreCoverage: ['T1203'], scfCoverage: ['SCF-14'],
        enabled: true, requiresApproval: true, priority: 4, createdAt: now - day * 18, updatedAt: now - day * 3
      },
      // Security domain items
      {
        id: 'sec-01', domainId: 'security', name: '安全策略制定', nameEn: 'Security Policy Creation',
        description: '制定组织的安全策略', descriptionEn: 'Create security policies for the organization',
        ownerRoles: ['policy-manager'], partnerRoles: ['security-officer'], tools: ['PolicyGen'], mitreCoverage: ['TA0001'], scfCoverage: ['SCF-21'],
        enabled: true, requiresApproval: false, priority: 1, createdAt: now - day * 28, updatedAt: now - day * 7
      },
      {
        id: 'sec-02', domainId: 'security', name: '风险评估', nameEn: 'Risk Assessment',
        description: '识别与评估信息系统风险', descriptionEn: 'Identify and assess information system risks',
        ownerRoles: ['risk-manager'], partnerRoles: ['it-ao'], tools: ['RiskTool'], mitreCoverage: ['TA0009'], scfCoverage: ['SCF-22'],
        enabled: true, requiresApproval: false, priority: 2, createdAt: now - day * 22, updatedAt: now - day * 6
      },
      {
        id: 'sec-03', domainId: 'security', name: '安全培训', nameEn: 'Security Training',
        description: '对员工进行安全意识培训', descriptionEn: 'Security awareness training for employees',
        ownerRoles: ['security-education'], partnerRoles: ['hr'], tools: ['LMS'], mitreCoverage: ['TA0043'], scfCoverage: ['SCF-23'],
        enabled: true, requiresApproval: false, priority: 3, createdAt: now - day * 15, updatedAt: now - day * 2
      },
      {
        id: 'sec-04', domainId: 'security', name: '资产与访问管理', nameEn: 'Asset & Access Management',
        description: '管理资产清单与访问权限', descriptionEn: 'Manage asset inventory and access permissions',
        ownerRoles: ['it-admin'], partnerRoles: ['sec-admin'], tools: ['IAM'], mitreCoverage: ['TA0007'], scfCoverage: ['SCF-24'],
        enabled: true, requiresApproval: false, priority: 2, createdAt: now - day * 12, updatedAt: now - day * 1
      },
      // Legal domain items
      {
        id: 'leg-01', domainId: 'legal', name: '隐私影响评估', nameEn: 'PIA',
        description: '评估数据处理对隐私的影响', descriptionEn: 'Assess privacy impact of data processing',
        ownerRoles: ['privacy-officer'], partnerRoles: ['compliance-team'], tools: ['PIA-tool'], mitreCoverage: ['TA0003'], scfCoverage: ['SCF-31'],
        enabled: true, requiresApproval: false, priority: 1, createdAt: now - day * 25, updatedAt: now - day * 5
      },
      {
        id: 'leg-02', domainId: 'legal', name: '合规审计', nameEn: 'Compliance Audit',
        description: '对合规要求的审计与证明', descriptionEn: 'Audit and prove compliance requirements',
        ownerRoles: ['compliance-auditor'], partnerRoles: ['external-auditors'], tools: ['AuditSuite'], mitreCoverage: ['TA0002'], scfCoverage: ['SCF-32'],
        enabled: true, requiresApproval: false, priority: 2, createdAt: now - day * 18, updatedAt: now - day * 4
      },
      {
        id: 'leg-03', domainId: 'legal', name: '监管报告', nameEn: 'Regulatory Reporting',
        description: '定期向监管机构提交报告', descriptionEn: 'Regular reporting to regulators',
        ownerRoles: ['regulatory-comms'], partnerRoles: ['regulators'], tools: ['ReportGen'], mitreCoverage: ['TA0006'], scfCoverage: ['SCF-33'],
        enabled: true, requiresApproval: false, priority: 3, createdAt: now - day * 14, updatedAt: now - day * 3
      },
      {
        id: 'leg-04', domainId: 'legal', name: '隐私合规培训', nameEn: 'Privacy Compliance Training',
        description: '培训员工隐私合规要点', descriptionEn: 'Train employees on privacy compliance',
        ownerRoles: ['privacy-edu'], partnerRoles: ['legal'], tools: ['TrainingPlatform'], mitreCoverage: ['TA0010'], scfCoverage: ['SCF-34'],
        enabled: true, requiresApproval: false, priority: 2, createdAt: now - day * 10, updatedAt: now - day * 2
      },
      // Technology domain - 4 items
      {
        id: 'tech-01', domainId: 'technology', name: '漏洞扫描', nameEn: 'Vulnerability Scanning',
        description: '定期扫描漏洞并跟踪修复', descriptionEn: 'Regular vulnerability scanning and remediation tracking',
        ownerRoles: ['sec-arch'], partnerRoles: ['dev-ops'], tools: ['Nessus'], mitreCoverage: ['TA0003'], scfCoverage: ['SCF-41'],
        enabled: true, requiresApproval: false, priority: 1, createdAt: now - day * 26, updatedAt: now - day * 6
      },
      {
        id: 'tech-02', domainId: 'technology', name: '补丁管理', nameEn: 'Patch Management',
        description: '管理系统与应用的补丁', descriptionEn: 'Manage patches for systems and applications',
        ownerRoles: ['it-admin'], partnerRoles: ['security-team'], tools: ['WSUS'], mitreCoverage: ['TA0008'], scfCoverage: ['SCF-42'],
        enabled: true, requiresApproval: false, priority: 2, createdAt: now - day * 22, updatedAt: now - day * 4
      },
      {
        id: 'tech-03', domainId: 'technology', name: '资产管理', nameEn: 'Asset Management',
        description: '清点并追踪IT资产', descriptionEn: 'Inventory and track IT assets',
        ownerRoles: ['asset-manager'], partnerRoles: ['it-team'], tools: ['CMDB'], mitreCoverage: ['TA0006'], scfCoverage: ['SCF-43'],
        enabled: true, requiresApproval: false, priority: 2, createdAt: now - day * 18, updatedAt: now - day * 2
      },
      {
        id: 'tech-04', domainId: 'technology', name: '配置审计', nameEn: 'Configuration Audit',
        description: '审计系统配置与合规性', descriptionEn: 'Audit system configurations and compliance',
        ownerRoles: ['config-auditor'], partnerRoles: ['dev-ops'], tools: ['ConfigMgmt'], mitreCoverage: ['TA0005'], scfCoverage: ['SCF-44'],
        enabled: true, requiresApproval: false, priority: 3, createdAt: now - day * 14, updatedAt: now - day * 3
      },
      // Business domain - 4 items
      {
        id: 'biz-01', domainId: 'business', name: '供应链安全', nameEn: 'Supply Chain Security',
        description: '确保供应商与合作方的安全性', descriptionEn: 'Ensure security of suppliers and partners',
        ownerRoles: ['supply-chain-security'], partnerRoles: ['procurement'], tools: ['VendorRisk'], mitreCoverage: ['TA0009'], scfCoverage: ['SCF-51'],
        enabled: true, requiresApproval: false, priority: 1, createdAt: now - day * 24, updatedAt: now - day * 6
      },
      {
        id: 'biz-02', domainId: 'business', name: '第三方风险管理', nameEn: 'Third-Party Risk',
        description: '评估第三方风险与合规性', descriptionEn: 'Assess third-party risk and compliance',
        ownerRoles: ['vendor-security'], partnerRoles: ['compliance-team'], tools: ['VendorScan'], mitreCoverage: ['TA0002'], scfCoverage: ['SCF-52'],
        enabled: true, requiresApproval: false, priority: 2, createdAt: now - day * 20, updatedAt: now - day * 4
      },
      {
        id: 'biz-03', domainId: 'business', name: '业务连续性', nameEn: 'Business Continuity',
        description: '保障关键业务在灾难时段的连续性', descriptionEn: 'Ensure business continuity during disasters',
        ownerRoles: ['bc-manager'], partnerRoles: ['it-ops'], tools: ['BCP'], mitreCoverage: ['TA0000'], scfCoverage: ['SCF-53'],
        enabled: true, requiresApproval: false, priority: 3, createdAt: now - day * 15, updatedAt: now - day * 2
      },
      {
        id: 'biz-04', domainId: 'business', name: '欺诈检测', nameEn: 'Fraud Detection',
        description: '识别并预防业务欺诈', descriptionEn: 'Identify and prevent business fraud',
        ownerRoles: ['fraud-analyst'], partnerRoles: ['finance'], tools: ['FraudEngine'], mitreCoverage: ['TA0004'], scfCoverage: ['SCF-54'],
        enabled: true, requiresApproval: false, priority: 2, createdAt: now - day * 12, updatedAt: now - day * 1
      },
    ];

    await this.store.set('capability-items.json', items);
    console.log('[DataSeed] Seeded 24 capability items');
  }
}
