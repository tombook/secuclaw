/**
 * 内置 Mock 响应函数
 * 每个函数返回 StandardToolResult，按 toolId 注册
 * 
 * 数据驱动：
 * - SCF 工具 → scf-data-service (34 域, 1,451 控制项)
 * - MITRE 工具 → mitre-data-service (835 techniques, 187 groups, 696 malware)
 * - 混合工具 → SCF + MITRE 联合
 */

import type { StandardToolResult } from './types';
import { getScfControls, generateComplianceMock, calculateComplianceScore, getScfDomains, SCF_DOMAIN_LABELS, TOOL_SCF_MAPPING } from './data/scf-data-service';
import { generateThreatIntelMock, generateAlertMock, generateIncidentMock, getTechniques, getTactics, getCoursesOfAction, getDetectionStrategies, TACTIC_LABELS, getTechniquesByTactic } from './data/mitre-data-service';

// ─── Helper: generate vuln data from MITRE + SCF ─────

function _generateVulns() {
  const techniques = getTechniquesByTactic('initial-access').slice(0, 5);
  const assets = ['web-prod-01', 'nginx-lb-02', 'api-gateway-01', 'db-master-01', 'cache-01'];
  const statuses = ['未修复', '修复中', '未修复', '已修复', '未修复'];
  return techniques.map((t, i) => ({
    cve: `CVE-2026-${1000 + i * 137}`,
    cvss: [9.1, 7.8, 6.5, 5.3, 4.2][i],
    desc: t.name,
    asset: assets[i],
    status: statuses[i],
    technique: t.id,
    scfControl: `VPM-0${i + 1}`,
  }));
}

function _generateSbom() {
  return [
    { component: 'log4j', version: '2.14.1', license: 'Apache-2.0', vulns: 2, risk: '高危', technique: 'T1190' },
    { component: 'openssl', version: '1.1.1k', license: 'OpenSSL', vulns: 1, risk: '中危', technique: 'T1190' },
    { component: 'nginx', version: '1.21.3', license: 'BSD-2', vulns: 0, risk: '低危', technique: '-' },
    { component: 'mysql-connector', version: '8.0.28', license: 'GPL-2.0', vulns: 1, risk: '中危', technique: 'T1078' },
    { component: 'spring-boot', version: '2.7.0', license: 'Apache-2.0', vulns: 3, risk: '高危', technique: 'T1190' },
  ];
}

function _generateStride() {
  const tactics = getTactics().slice(0, 6);
  const types = ['伪造 (S)', '篡改 (T)', '否认 (R)', '信息泄露 (I)', '拒绝服务 (D)', '提权 (E)'];
  const components = ['API 网关 → IAM', '配置中心 → 数据库', '审计日志服务', 'API 响应数据', 'API 网关入口', 'IAM → 管理后台'];
  const mitigations = ['mTLS 双向认证 + JWT 签名验证', '数据签名 + 传输加密', '区块链存证 + 不可变日志', '字段级脱敏 + 响应过滤', '限流 + 熔断 + CDN 分流', '最小权限 + RBAC + MFA'];
  return types.map((t, i) => ({
    threat: t, component: components[i], risk: i === 0 || i === 1 || i === 3 || i === 5 ? '高' : '中',
    mitigation: mitigations[i], tactic: tactics[i],
    tacticLabel: TACTIC_LABELS[tactics[i]] ?? tactics[i],
    techniques: getTechniquesByTactic(tactics[i]).slice(0, 3).map(t => t.id).join(', '),
  }));
}

export const MOCK_RESPONSES: Record<string, () => StandardToolResult> = {
  // ─── MITRE ATT&CK 数据驱动 ─────────────────────────

  'alert-queue': () => {
    const alerts = generateAlertMock(6);
    return {
      rows: alerts.map(a => ({
        id: a.id, severity: a.severity, source: a.source, type: a.title.substring(0, 20),
        time: `${Math.floor(Math.random() * 60)} 分钟前`, status: a.status === 'new' ? '待处理' : a.status === 'investigating' ? '处理中' : '已处理',
        technique: a.technique,
      })),
      summary: { total: alerts.length, P1: alerts.filter(a => a.severity === 'P1').length, P2: alerts.filter(a => a.severity === 'P2').length, P3: alerts.filter(a => a.severity === 'P3').length, pending: alerts.filter(a => a.status === 'new').length, source: 'MITRE ATT&CK Detection (691)' },
      status: 'success', duration: 800,
    };
  },

  'soar-exec': () => {
    const coa = getCoursesOfAction().slice(0, 4);
    return {
      rows: coa.map((c, i) => ({
        step: `${i + 1}. ${c.name.substring(0, 25)}`, status: i < 3 ? '成功' : '执行中',
        action: ['隔离主机', '终止进程', '封禁 IOC', '取证分析'][i],
        target: ['10.0.1.45', 'malware.exe', '8.8.x.x', 'full-dump'][i],
        result: ['已隔离', '已终止', '已封禁', '分析中...'][i],
      })),
      summary: { total: coa.length, success: 3, failed: 0, duration: '3.2s', source: 'MITRE ATT&CK COA (268)' },
      status: 'success', duration: 3200,
    };
  },

  'threat-intel': () => {
    const intel = generateThreatIntelMock('10.0.1.45');
    const allRows = [
      ...intel.techniques.map(t => ({ type: 'ATT&CK 技术', name: `${t.techniqueId} ${t.techniqueName}`, confidence: '95%', desc: `战术: ${t.tactics.join(', ')}` })),
      ...intel.groups.map(g => ({ type: '威胁组织', name: g.name, confidence: `${g.confidence}%`, desc: `别名: ${g.aliases.join(', ')}` })),
      ...intel.malware.map(m => ({ type: '恶意软件', name: m.name, confidence: '85%', desc: `类型: ${m.types.join(', ') || '未知'}` })),
    ];
    return {
      rows: allRows,
      summary: { total: allRows.length, high: allRows.filter(r => parseInt(r.confidence) >= 90).length, mitreMatch: intel.techniques.length, confidence: '89%', source: 'MITRE ATT&CK (835 techniques, 187 groups, 696 malware)' },
      status: 'success', duration: 600,
    };
  },

  'incident-mgmt': () => {
    const incidents = generateIncidentMock(5);
    return {
      rows: incidents.map(inc => ({
        id: inc.id, title: inc.title.substring(0, 30), severity: inc.severity,
        status: ({ new: '待处理', investigating: '调查中', contained: '已遏制', resolved: '已解决' })[inc.status] ?? inc.status,
        assignee: inc.assignee, updated: inc.updatedAt, technique: inc.technique,
      })),
      summary: { active: incidents.filter(i => i.status !== 'resolved').length, todayNew: Math.floor(Math.random() * 3) + 1, avgTime: '2.4h', resolved: incidents.filter(i => i.status === 'resolved').length, source: 'MITRE ATT&CK COA (268)' },
      status: 'success', duration: 1500,
    };
  },

  'pen-test': () => {
    const techniques = getTechniquesByTactic('initial-access').slice(0, 5);
    return {
      rows: techniques.map(t => ({
        vuln: t.name, severity: (['严重', '高危', '中危', '高危', '严重'])[techniques.indexOf(t) % 5],
        vector: t.tactics[0]?.substring(0, 10) ?? 'unknown', exploitable: Math.random() > 0.3 ? '是' : '否',
        detail: `ATT&CK ${t.id}`,
      })),
      chartData: [{ severity: '严重', count: 2 }, { severity: '高危', count: 2 }, { severity: '中危', count: 1 }],
      summary: { total: techniques.length, critical: 2, exploitable: 4, coverage: '78%', source: 'MITRE ATT&CK (835 techniques)' },
      status: 'success', duration: 35000,
    };
  },

  'log-analysis': () => {
    const detection = getDetectionStrategies().slice(0, 6);
    return {
      rows: detection.map((d, i) => ({
        time: `2026-04-18 ${13 - i}:${55 - i * 7}:${10 + i * 8}`.padEnd(19),
        source: ['firewall', 'edr', 'ids', 'dns', 'proxy', 'waf'][i],
        level: (['WARN', 'ERROR', 'WARN', 'INFO', 'WARN', 'ERROR'])[i],
        host: `sec-${['fw', 'edr', 'ids', 'dns', 'pxy', 'waf'][i]}-01`,
        message: d.name.substring(0, 60),
      })),
      chartData: [{ level: 'ERROR', count: 2 }, { level: 'WARN', count: 3 }, { level: 'INFO', count: 1 }],
      summary: { total: detection.length, errors: 2, warnings: 3, sources: 6, source: 'MITRE Detection Strategies (691)' },
      status: 'success', duration: 2000,
    };
  },

  // ─── SCF 数据驱动 ───────────────────────────────────

  'compliance-chk': () => {
    const domainCode = 'CPL';
    const controls = generateComplianceMock(domainCode);
    return {
      rows: controls.map(c => ({
        item: c.name.substring(0, 35), regulation: c.id,
        status: c.status === 'compliant' ? '通过' : c.status === 'partial' ? '整改中' : c.status === 'non-compliant' ? '未通过' : '未评估',
        detail: c.evidence ?? '-',
      })),
      summary: { score: calculateComplianceScore(controls) + '%', pass: controls.filter(c => c.status === 'compliant').length, fail: controls.filter(c => c.status === 'non-compliant').length, pending: controls.filter(c => c.status === 'partial').length, source: `SCF ${domainCode} 域 (${controls.length} 控制项)` },
      status: 'success', duration: 2000,
    };
  },

  'gdpr-audit': () => {
    const controls = generateComplianceMock('PRI');
    return {
      rows: controls.map(c => ({
        article: c.id, requirement: c.name.substring(0, 30),
        status: c.status === 'compliant' ? '合规' : c.status === 'partial' ? '部分合规' : '不合规',
        gap: c.status !== 'compliant' ? `${c.name.substring(0, 25)} 存在差距` : '-',
        priority: c.priority ?? '-',
      })),
      summary: { compliance: calculateComplianceScore(controls) + '%', critical: controls.filter(c => c.status === 'non-compliant').length, gaps: controls.filter(c => c.status !== 'compliant').length, articles: controls.length, source: 'SCF PRI 数据隐私域 (102 控制项)' },
      status: 'success', duration: 5000,
    };
  },

  'bcp-mgmt': () => {
    const controls = generateComplianceMock('BCD');
    return {
      rows: controls.map(c => ({
        item: c.name.substring(0, 30), plan: c.id, owner: ['张伟', '李明', '王磊', '陈静'][controls.indexOf(c) % 4],
        status: c.status === 'compliant' ? '已落实' : c.status === 'partial' ? '部分落实' : '未落实',
        lastDrill: '2026-03-15', rto: `${controls.indexOf(c) * 2 + 1}h`,
      })),
      summary: { rto: '2.4h', rpo: '1.2h', passRate: calculateComplianceScore(controls) + '%', lastDrill: '3天前', source: 'SCF BCD 业务连续性域 (58 控制项)' },
      status: 'success', duration: 3000,
    };
  },

  'risk-score': () => {
    const rskControls = generateComplianceMock('RSK');
    const domains = getScfDomains().slice(0, 8);
    return {
      rows: domains.map(d => ({
        domain: `${SCF_DOMAIN_LABELS[d.code] ?? d.name} (${d.code})`,
        controls: d.totalControls, score: 50 + Math.floor(Math.random() * 50),
        trend: Math.random() > 0.5 ? '↑' : '↓', risk: ['低', '中', '高', '严重'][Math.floor(Math.random() * 4)],
      })),
      summary: { overall: '44/100', trend: '↓ 改善', scfCoverage: '72%', mitreCoverage: '8/12 战术', overallScore: 44, domains: domains.length, highRisk: 3, source: 'SCF 34 域概览 (1,451 控制项)' },
      status: 'success', duration: 1500,
    };
  },

  'board-report': () => {
    const govControls = generateComplianceMock('GOV');
    const score = calculateComplianceScore(govControls);
    return {
      rows: [
        { module: '安全评分', value: `${score}/100`, trend: '↑', detail: `基于 SCF GOV 域 ${govControls.length} 项控制` },
        { module: 'KPI 达成率', value: '85%', trend: '→', detail: 'MTTD 15min / MTTR 38h / 检出率 89%' },
        { module: '重大事件', value: '3 件', trend: '↓', detail: 'P1 已全部闭环，平均响应 28min' },
        { module: '预算使用', value: '63%', trend: '→', detail: '安全预算 ¥2.4M 已使用 ¥1.5M' },
      ],
      summary: { riskScore: `${score}/100`, kpiRate: '85%', incidents: 3, budgetUsage: '63%', source: 'SCF GOV 域 (38 控制项)' },
      status: 'success', duration: 3000,
    };
  },

  'vendor-eval': () => {
    const tpmControls = generateComplianceMock('TPM');
    return {
      rows: tpmControls.slice(0, 6).map((c, i) => ({
        domain: ['数据保护', '访问控制', '安全治理', '事件响应', '合规管理', '供应链透明'][i],
        score: `${50 + i * 10}/100`,
        level: (['C', 'B', 'B', 'A', 'A', 'A'])[i],
        finding: c.description.substring(0, 50) || `${c.id} 评估项`,
      })),
      radarData: [
        { label: '数据保护', score: 50 }, { label: '访问控制', score: 60 },
        { label: '安全治理', score: 70 }, { label: '事件响应', score: 80 },
        { label: '合规管理', score: 90 }, { label: '供应链透明', score: 75 },
      ],
      summary: { overall: '74/100', critical: 2, domains: 6, recommendation: '需改善', source: `SCF TPM 第三方管理域 (${tpmControls.length} 控制项)` },
      status: 'success', duration: 5000,
    };
  },

  'report-gen': () => {
    const domains = getScfDomains();
    const totalControls = domains.reduce((s, d) => s + d.totalControls, 0);
    return {
      rows: [
        { module: '安全评分', value: '79/100', trend: '↑', detail: `基于 SCF ${domains.length} 域 ${totalControls} 控制项` },
        { module: '高危发现', value: '5 项', trend: '↓', detail: '较上月减少 2 项' },
        { module: '改善措施', value: '12 项', trend: '↑', detail: '已完成 8 项，4 项进行中' },
      ],
      summary: { total: totalControls, critical: 5, improved: 12, period: '2026-04', source: `SCF (${domains.length} 域, ${totalControls} 控制项)` },
      status: 'success', duration: 3000,
    };
  },

  'global-situation': () => {
    const roleNames = ['CISO', '安全指挥官', '安全运营', '安全专家', '安全架构师', '隐私官', '业务安全', '供应链'];
    const healthStates = ['normal', 'normal', 'warning', 'normal', 'normal', 'warning', 'normal', 'danger'];
    const scores = [72, 85, 68, 74, 81, 76, 89, 55];
    return {
      rows: roleNames.map((r, i) => ({
        role: r, status: `评分 ${scores[i]}`,
        health: healthStates[i], score: scores[i],
      })),
      radarData: roleNames.map((r, i) => ({ label: r, score: scores[i] })),
      summary: { totalRoles: 8, healthy: healthStates.filter(h => h === 'normal').length, warning: healthStates.filter(h => h === 'warning').length, danger: healthStates.filter(h => h === 'danger').length, source: 'SCF 34 域态势概览' },
      status: 'success', duration: 2000,
    };
  },

  'kpi-track': () => {
    const govControls = getScfControls('GOV');
    return {
      rows: [],
      chartData: [
        { month: '1月', kpi: 'MTTD', score: 28 }, { month: '1月', kpi: 'MTTR', score: 52 },
        { month: '2月', kpi: 'MTTD', score: 24 }, { month: '2月', kpi: 'MTTR', score: 48 },
        { month: '3月', kpi: 'MTTD', score: 20 }, { month: '3月', kpi: 'MTTR', score: 45 },
        { month: '4月', kpi: 'MTTD', score: 15 }, { month: '4月', kpi: 'MTTR', score: 38 },
      ],
      summary: { mttd: '15 min', mttr: '38 min', detectionRate: '94%', satisfaction: '87%', source: `SCF GOV 域 (${govControls.length} 控制项)` },
      status: 'success', duration: 2000,
    };
  },

  // ─── 混合数据驱动 ───────────────────────────────────

  'vuln-scan': () => {
    const vpmControls = generateComplianceMock('VPM');
    const vulns = _generateVulns();
    return {
      rows: vulns.map((v, i) => ({ ...v, scfControl: vpmControls[i]?.id ?? 'VPM-??' })),
      summary: { total: vulns.length, critical: vulns.filter(v => v.cvss >= 9).length, high: vulns.filter(v => v.cvss >= 7 && v.cvss < 9).length, exploitable: vulns.filter(v => v.cvss >= 7).length, source: `SCF VPM 漏洞管理域 (${vpmControls.length} 控制项)` },
      status: 'success', duration: 2800,
    };
  },

  'threat-model': () => {
    const strideData = _generateStride();
    return {
      rows: strideData.map(s => ({
        threat: s.threat, component: s.component, risk: s.risk, mitigation: s.mitigation,
        tactic: s.tactic, tacticLabel: s.tacticLabel, techniques: s.techniques,
      })),
      summary: { total: strideData.length, high: strideData.filter(s => s.risk === '高').length, mitigated: strideData.filter(s => s.risk === '低').length, mitreMatch: strideData.reduce((a, s) => a + (s.techniques?.length || 0), 0), source: 'MITRE ATT&CK (835 techniques) + STRIDE' },
      status: 'success', duration: 5000,
    };
  },

  'zero-trust': () => {
    const iacControls = generateComplianceMock('IAC');
    const netControls = generateComplianceMock('NET');
    const endControls = generateComplianceMock('END');
    return {
      rows: [
        { domain: '身份验证', score: calculateComplianceScore(iacControls), level: 'L2-进阶', finding: `SCF IAC 域合规率 ${calculateComplianceScore(iacControls)}%` },
        { domain: '设备信任', score: calculateComplianceScore(endControls), level: 'L1-基础', finding: `SCF END 域合规率 ${calculateComplianceScore(endControls)}%` },
        { domain: '网络分段', score: calculateComplianceScore(netControls), level: 'L1-进阶', finding: `SCF NET 域合规率 ${calculateComplianceScore(netControls)}%` },
        { domain: '应用安全', score: 80, level: 'L2-进阶', finding: 'SSO 已部署，API 网关待加强' },
        { domain: '数据保护', score: 65, level: 'L2-基础', finding: 'DLP 部署中，分类标签未完成' },
      ],
      summary: { maturity: `L${Math.round((calculateComplianceScore(iacControls) + calculateComplianceScore(endControls) + calculateComplianceScore(netControls) + 80 + 65) / 500 * 3)}`, identity: `${calculateComplianceScore(iacControls)}%`, network: `${calculateComplianceScore(netControls)}%`, gaps: 2, source: 'SCF IAC + NET + END 域' },
      status: 'success', duration: 8000,
    };
  },

  'sbom-scan': () => {
    const tpmControls = generateComplianceMock('TPM');
    const sbomData = _generateSbom();
    return {
      rows: sbomData.map((s, i) => ({ ...s, scfControl: tpmControls[i]?.id ?? 'TPM-??' })),
      summary: { components: sbomData.length, vulnComponents: sbomData.filter(s => s.risk === '高危').length, critical: sbomData.filter(s => s.vulns >= 3).length, licenseRisk: 2, source: `SCF TPM 域 (${tpmControls.length} 控制项) + CycloneDX` },
      status: 'success', duration: 3500,
    };
  },

  'ai-dispatch': () => {
    const techniques = getTechniquesByTactic('defense-evasion').slice(0, 5);
    return {
      rows: [
        { task: '数据采集', status: '完成', finding: `提取 ${techniques.length} 个防御规避技术` },
        { task: '模式识别', status: '完成', finding: `关联 ${getDetectionStrategies().length} 个检测策略` },
        { task: '风险评估', status: '完成', finding: `${techniques[0]?.id} 确认活跃` },
        { task: '自动处置', status: '完成', finding: `执行 COA ${getCoursesOfAction().slice(0, 2).map(c => c.name.substring(0, 15)).join(', ')}` },
        { task: '生成报告', status: '完成', finding: '综合分析报告已生成' },
      ],
      summary: { tasks: 5, sources: 3, findings: 3, confidence: '92%', source: 'MITRE ATT&CK + SCF 混合' },
      status: 'success', duration: 12000,
    };
  },
  // ─── 第三方工具 Mock ────────────────────────────

  'nessus-scan': () => ({
    rows: [
      { pluginId: '19506', name: 'Nessus SYN scanner', severity: 'Info', host: '10.0.1.45', protocol: 'TCP' },
      { pluginId: '11219', name: 'Nessus Scan Information', severity: 'Info', host: '10.0.1.45', protocol: 'TCP' },
      { pluginId: '34220', name: 'OpenSSL Advisory 20260318', severity: 'Critical', host: '10.0.1.45', protocol: 'TCP' },
      { pluginId: '157488', name: 'Apache Log4j2 RCE (CVE-2026-1234)', severity: 'Critical', host: '10.0.2.88', protocol: 'HTTP' },
      { pluginId: '108795', name: 'Nginx Version Disclosure', severity: 'Low', host: '10.0.2.88', protocol: 'HTTP' },
      { pluginId: '104966', name: 'MySQL Version Disclosure', severity: 'Medium', host: '10.0.3.12', protocol: 'TCP' },
      { pluginId: '21745', name: 'Redis Unauthorized Access', severity: 'High', host: '10.0.3.15', protocol: 'TCP' },
    ],
    summary: { total: 7, critical: 2, high: 1, medium: 1, low: 1, info: 2 },
    status: 'success', duration: 45000,
  }),

  'splunk-query': () => ({
    rows: [
      { _time: '2026-04-18 10:23:15', source: 'firewall-palo', action: 'blocked', src_ip: '185.220.101.34', dest_ip: '10.0.1.45', message: 'TCP SYN flood detected from TOR exit node' },
      { _time: '2026-04-18 10:22:08', source: 'ids-suricata', action: 'detected', src_ip: '192.168.1.105', dest_ip: '10.0.2.88', message: 'ET POLICY HTTP traffic on port 443 (potential C2)' },
      { _time: '2026-04-18 10:20:44', source: 'firewall-palo', action: 'blocked', src_ip: '45.33.32.156', dest_ip: '10.0.3.12', message: 'SSH brute force attempt (15 failures in 60s)' },
      { _time: '2026-04-18 10:18:32', source: 'proxy-bluecoat', action: 'allowed', src_ip: '10.0.1.100', dest_ip: '104.21.12.34', message: 'User downloaded file from unknown domain' },
      { _time: '2026-04-18 10:15:10', source: 'edr-crowdstrike', action: 'detected', src_ip: '10.0.2.200', dest_ip: '10.0.2.88', message: 'Lateral movement via PSExec detected' },
      { _time: '2026-04-18 10:12:55', source: 'dns-bind', action: 'allowed', src_ip: '10.0.1.50', dest_ip: '8.8.8.8', message: 'DNS query for known malicious domain evil-c2.xyz' },
    ],
    summary: { total: 6, blocked: 2, detected: 2, allowed: 2 },
    status: 'success', duration: 2500,
  }),

  'crowdstrike-detections': () => ({
    rows: [
      { detection_id: 'ldt:abc123:456', severity: 'Critical', technique: 'T1059.001', hostname: 'WIN-WS-045', timestamp: '2026-04-18 10:23', description: 'PowerShell reverse shell execution detected' },
      { detection_id: 'ldt:def456:789', severity: 'High', technique: 'T1021.001', hostname: 'SRV-DB-01', timestamp: '2026-04-18 10:18', description: 'Remote desktop lateral movement from compromised host' },
      { detection_id: 'ldt:ghi789:012', severity: 'High', technique: 'T1566.001', hostname: 'WIN-HR-022', timestamp: '2026-04-18 09:45', description: 'Malicious macro in email attachment (Invoice_2026.xlsm)' },
      { detection_id: 'ldt:jkl012:345', severity: 'Medium', technique: 'T1071.001', hostname: 'SRV-WEB-03', timestamp: '2026-04-18 09:30', description: 'Suspicious HTTP beaconing to unknown C2 server' },
      { detection_id: 'ldt:mno345:678', severity: 'Low', technique: 'T1082', hostname: 'WIN-DEV-011', timestamp: '2026-04-18 08:15', description: 'System information discovery via WMI' },
    ],
    summary: { total: 5, critical: 1, high: 2, medium: 1, low: 1 },
    status: 'success', duration: 1800,
  }),

  'virustotal-scan': () => ({
    rows: [
      { engine: 'Malwarebytes', category: 'malicious', result: 'Trojan.GenericKD.48291', detail: 'Detected by signature-based scan' },
      { engine: 'Kaspersky', category: 'malicious', result: 'HEUR:Trojan.Win32.Generic', detail: 'Heuristic detection of trojan behavior' },
      { engine: 'CrowdStrike', category: 'malicious', result: 'win/malicious_confidence_100%', detail: 'High confidence malicious file' },
      { engine: 'Symantec', category: 'malicious', result: 'ML.Attribute.HighConfidence', detail: 'Machine learning detection' },
      { engine: 'McAfee', category: 'malicious', result: 'RDN/Generic.dldr', detail: 'Generic downloader trojan' },
      { engine: 'Microsoft', category: 'malicious', result: 'Program:Win32/Wacatac.B!ml', detail: 'Trojan with ML confidence' },
      { engine: 'Google', category: 'undetected', result: 'Clean', detail: 'No malicious indicators found' },
      { engine: 'Bitdefender', category: 'malicious', result: 'Gen:Variant.Razy.123456', detail: 'Generic variant detection' },
    ],
    summary: { total: 8, malicious: 7, undetected: 1, detection_ratio: '7/8' },
    status: 'success', duration: 3200,
  }),

  'elastic-security': () => ({
    rows: [
      { '@timestamp': '2026-04-18T10:23:15Z', 'event.kind': 'alert', 'host.name': 'web-prod-01', 'source.ip': '185.220.101.34', message: 'SQL injection attempt detected in /api/users endpoint' },
      { '@timestamp': '2026-04-18T10:20:44Z', 'event.kind': 'alert', 'host.name': 'srv-db-01', 'source.ip': '192.168.1.105', message: 'Anomalous database query pattern - bulk data exfiltration' },
      { '@timestamp': '2026-04-18T10:18:32Z', 'event.kind': 'event', 'host.name': 'win-ws-045', 'source.ip': '10.0.2.88', message: 'User logged in from new device (Linux → Windows)' },
      { '@timestamp': '2026-04-18T10:15:10Z', 'event.kind': 'alert', 'host.name': 'proxy-01', 'source.ip': '10.0.1.100', message: 'Data transfer to cloud storage exceeding threshold (500MB)' },
      { '@timestamp': '2026-04-18T10:12:55Z', 'event.kind': 'event', 'host.name': 'dns-01', 'source.ip': '10.0.1.50', message: 'DNS query for newly registered domain (< 24h old)' },
    ],
    summary: { total: 5, alerts: 3, events: 2, index: 'logs-security-*' },
    status: 'success', duration: 1500,
  }),

  // ─── 新增工具 v3 mock 数据生成器 ──────────────────────

  'risk-register': () => {
    const risks = [
      { id: 'RSK-001', name: '核心数据库未加密', level: '严重', owner: '安全架构师', status: '缓解中', treatment: '部署 TDE 加密，预计 Q3 完成' },
      { id: 'RSK-002', name: '第三方API无访问控制', level: '高', owner: '安全专家', status: '待处理', treatment: '实施 API Gateway + OAuth2' },
      { id: 'RSK-003', name: '员工安全意识不足', level: '中', owner: '业务安全官', status: '缓解中', treatment: '季度钓鱼演练 + 培训计划' },
      { id: 'RSK-004', name: '灾难恢复计划过期', level: '高', owner: '业务安全官', status: '待处理', treatment: '更新DRP并安排半年演练' },
      { id: 'RSK-005', name: '零信任落地进度滞后', level: '中', owner: '安全架构师', status: '缓解中', treatment: '分阶段实施路线图' },
      { id: 'RSK-006', name: 'GDPR DPIA未覆盖新业务', level: '高', owner: '隐私官', status: '待处理', treatment: '对新业务线执行DPIA评估' },
      { id: 'RSK-007', name: '供应链依赖未监控', level: '严重', owner: '供应链安全', status: '缓解中', treatment: '部署SBOM扫描+持续监控' },
      { id: 'RSK-008', name: 'SOC人员不足', level: '中', owner: 'CISO', status: '已接受', treatment: '已申请HC，预计Q3到岗' },
    ];
    return { rows: risks, summary: { total: risks.length, critical: risks.filter(r => r.level === '严重').length, high: risks.filter(r => r.level === '高').length, open: risks.filter(r => r.status === '待处理').length }, status: 'success', duration: 800 };
  },

  'budget-dash': () => ({
    rows: [
      { category: '安全技术', budget: '¥320万', spent: '¥198万', usage: '62%', status: '正常', detail: 'SIEM/SOAR/EDR 续费已完成，剩余用于零信任采购', amount: 320 },
      { category: '安全人员', budget: '¥480万', spent: '¥240万', usage: '50%', status: '正常', detail: 'SOC 2 组招聘进行中，预计新增3人', amount: 480 },
      { category: '安全培训', budget: '¥45万', spent: '¥32万', usage: '71%', status: '偏高', detail: '钓鱼模拟+SOC培训，剩余Q4安全意识月活动', amount: 45 },
      { category: '安全咨询', budget: '¥120万', spent: '¥85万', usage: '71%', status: '偏高', detail: 'ISO27001外审已完成，剩余红队评估', amount: 120 },
      { category: '安全审计', budget: '¥80万', spent: '¥52万', usage: '65%', status: '正常', detail: 'PCI-DSS年度审计进行中', amount: 80 },
    ],
    summary: { total: '¥1045万', used: '¥607万', usage: '58%', trend: '↑+12%' },
    status: 'success', duration: 900,
  }),

  'policy-mgmt': () => ({
    rows: [
      { id: 'POL-001', name: '信息安全总体策略', version: 'v3.2', status: '生效中', owner: 'CISO', nextReview: '2026-07-01' },
      { id: 'POL-002', name: '数据分类分级策略', version: 'v2.1', status: '审核中', owner: '隐私官', nextReview: '2026-05-15' },
      { id: 'POL-003', name: '访问控制策略', version: 'v4.0', status: '生效中', owner: '安全架构师', nextReview: '2026-09-01' },
      { id: 'POL-004', name: '事件响应策略', version: 'v2.5', status: '生效中', owner: '安全运营', nextReview: '2026-06-01' },
      { id: 'POL-005', name: '可接受使用策略', version: 'v1.8', status: '草稿中', owner: 'CISO', nextReview: '2026-05-30' },
      { id: 'POL-006', name: '供应商安全管理策略', version: 'v1.2', status: '生效中', owner: '供应链安全', nextReview: '2026-08-01' },
    ],
    summary: { total: 6, active: 4, review: 1, overdue: 0 },
    status: 'success', duration: 700,
  }),

  'data-map': () => ({
    rows: [
      { id: 'DM-001', name: '客户身份信息库', type: 'PII-身份', sensitivity: 'L4 极敏感', location: 'CN-华东MySQL', count: '2,340,000' },
      { id: 'DM-002', name: '交易记录数据湖', type: '金融', sensitivity: 'L3 敏感', location: 'CN-华北OSS', count: '15,800,000' },
      { id: 'DM-003', name: '员工健康档案', type: '健康', sensitivity: 'L4 极敏感', location: 'CN-华东MySQL', count: '8,500' },
      { id: 'DM-004', name: '用户行为日志', type: '行为', sensitivity: 'L2 内部', location: 'CN-华东ES', count: '2.3亿条/月' },
      { id: 'DM-005', name: '合作伙伴合同', type: '商业', sensitivity: 'L3 敏感', location: 'EU-Frankfurt S3', count: '1,230' },
      { id: 'DM-006', name: '公开产品信息', type: '公开', sensitivity: 'L1 公开', location: 'CDN', count: '45,000' },
    ],
    summary: { datasets: 6, l4: 2, crossBorder: 1, compliant: 5 },
    status: 'success', duration: 1100,
  }),

  'cost-calc': () => ({
    rows: [
      { category: '直接损失', amount: '¥850万', severity: 'critical', detail: '包含通知成本、信用监控、法律费用', amountNum: 850 },
      { category: '业务中断', amount: '¥320万/天', severity: 'high', detail: '核心系统停机，按日营收计算', amountNum: 320 },
      { category: '监管罚款', amount: '¥500-5000万', severity: 'high', detail: 'GDPR最高全球营收4%，PIPL最高5000万', amountNum: 2750 },
      { category: '品牌损失', amount: '¥1200万', severity: 'medium', detail: '客户流失+品牌修复投入，基于行业基准', amountNum: 1200 },
      { category: '安全投资对比', amount: '¥1045万/年', severity: 'low', detail: '当前年度安全总投入，ROI约1:8', amountNum: 1045 },
    ],
    summary: { total: '¥2870万', investment: '¥1045万', roi: '2.7:1', scenario: '数据泄露' },
    status: 'success', duration: 1200,
  }),

  'patch-mgmt': () => ({
    rows: [
      { patchId: 'MS26-042', system: 'Windows Server 2022', severity: '紧急', cve: 'CVE-2026-2345', status: '缺失' },
      { patchId: 'MS26-039', system: 'Windows 11', severity: '重要', cve: 'CVE-2026-2101', status: '已排期' },
      { patchId: 'RHSA-2026:1234', system: 'RHEL 9', severity: '紧急', cve: 'CVE-2026-3456', status: '部署中' },
      { patchId: 'Cisco-SA-2026', system: 'Cisco ASA', severity: '重要', cve: 'CVE-2026-4567', status: '缺失' },
      { patchId: 'ORA-2026-089', system: 'Oracle 19c', severity: '中等', cve: 'CVE-2026-5678', status: '已完成' },
      { patchId: 'NGINX-2026-12', system: 'Nginx 1.25', severity: '中等', cve: 'CVE-2026-6789', status: '已排期' },
    ],
    summary: { total: 6, missing: 2, scheduled: 2, deploying: 1, completed: 1 },
    status: 'success', duration: 900,
  }),

  'iam-config': () => ({
    rows: [
      { check: '特权账号审查', count: '12个过度授权', severity: 'critical', finding: '发现3个Domain Admin账号长期未使用，建议禁用' },
      { check: 'MFA覆盖情况', count: '覆盖率 87%', severity: 'high', finding: '15个服务账号未启用MFA，含2个管理员账号' },
      { check: '孤儿账号检测', count: '23个', severity: 'medium', finding: '离职员工账号未及时清理，最长存在180天' },
      { check: '职责分离检查', count: '5个冲突', severity: 'high', finding: '财务系统同一人拥有创建+审批权限' },
      { check: '账号生命周期', count: '38个过期', severity: 'medium', finding: '临时账号/供应商账号未设置过期策略' },
    ],
    summary: { checks: 5, critical: 1, mfaRate: '87%', orphans: 23 },
    status: 'success', duration: 1500,
  }),

  'cloud-security': () => ({
    rows: [
      { domain: '身份与访问', score: '78/100', level: 'medium', finding: '4个存储桶公开访问，2个IAM策略过度宽松', scoreVal: 78 },
      { domain: '网络安全', score: '85/100', level: 'low', finding: '安全组规则基本合规，1个端口(3389)对外暴露', scoreVal: 85 },
      { domain: '存储安全', score: '65/100', level: 'high', finding: '3个S3桶未启用加密，日志归档策略缺失', scoreVal: 65 },
      { domain: '计算安全', score: '82/100', level: 'low', finding: 'IMDSv2覆盖率92%，8个实例仍使用v1', scoreVal: 82 },
      { domain: '日志与监控', score: '90/100', level: 'low', finding: 'CloudTrail已启用多区域，Config合规规则覆盖良好', scoreVal: 90 },
    ],
    summary: { score: '80/100', framework: 'CIS v2.0', critical: 1, passed: 3 },
    status: 'success', duration: 2000,
  }),

  'contract-review': () => ({
    rows: [
      { clause: '数据保护条款', requirement: 'GDPR Art.28', status: '部分合规', risk: '高', recommendation: '补充数据处理协议(DPA)附件，明确数据主体权利响应流程' },
      { clause: '安全事件通知', requirement: '72小时通知', status: '合规', risk: '低', recommendation: '已约定通知时限和方式' },
      { clause: '审计权利', requirement: '年度审计权', status: '不合规', risk: '高', recommendation: '要求增加甲方年度安全审计权利条款' },
      { clause: '责任限制', requirement: '违约赔偿', status: '部分合规', risk: '中', recommendation: '提高数据泄露赔偿上限至实际损失' },
      { clause: '数据跨境传输', requirement: 'SCC/BCR', status: '合规', risk: '低', recommendation: '已采用EU标准合同条款' },
      { clause: '子处理者管理', requirement: '事先授权', status: '不合规', risk: '高', recommendation: '要求供应商使用子处理者前获得书面授权' },
    ],
    summary: { compliance: '62%', gaps: 3, highRisk: 3, vendor: '待填写' },
    status: 'success', duration: 1300,
  }),

  'third-party-risk': () => ({
    rows: [
      { risk: '供应商网络攻击面', score: '高危(78/100)', level: 'high', detail: '发现3个暴露的管理端口和过期SSL证书' },
      { risk: '数据泄露路径', score: '严重(85/100)', level: 'critical', detail: '供应商可访问核心客户数据库，缺乏加密传输' },
      { risk: '合规状态', score: '中危(55/100)', level: 'medium', detail: 'SOC2 Type II报告过期60天，ISO27001证书有效' },
      { risk: '运营连续性', score: '低危(32/100)', level: 'low', detail: '双数据中心部署，RTO<4h，RPO<1h' },
      { risk: '供应链攻击风险', score: '高危(72/100)', level: 'high', detail: '使用12个开源组件含2个已知高危CVE' },
    ],
    summary: { overall: '高风险', critical: 1, high: 2, recommendation: '升级管理' },
    status: 'success', duration: 1800,
  }),
} as const;
