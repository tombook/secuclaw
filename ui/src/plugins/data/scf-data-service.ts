/**
 * SCF (Secure Controls Framework) 数据服务
 * 提供 34 个安全控制域、1,451 个控制项的查询接口
 * 
 * 数据来源：SCF 2025.4 (Secure Controls Framework)
 * 精简版：每域保留前 8 个控制项，用于 UI Mock 数据生成
 */

import SCF_DATA from './scf-compact.json';

export interface ScfDomain {
  code: string;
  name: string;
  totalControls: number;
  controls: ScfControl[];
}

export interface ScfControl {
  id: string;
  name: string;
  description: string;
  status?: 'compliant' | 'partial' | 'non-compliant' | 'not-assessed';
  evidence?: string;
  priority?: 'P1' | 'P2' | 'P3';
}

/** Parse compact JSON into typed structure */
function parseDomains(): ScfDomain[] {
  return (SCF_DATA as Array<{ c: string; n: string; ct: number; ctrls: Array<{ id: string; name: string; d: string }> }>).map(d => ({
    code: d.c,
    name: d.n,
    totalControls: d.ct,
    controls: d.ctrls.map(c => ({
      id: c.id,
      name: c.name,
      description: c.d,
    })),
  }));
}

const _domains = parseDomains();

/** Get all domains */
export function getScfDomains(): ScfDomain[] {
  return _domains;
}

/** Get domain by code */
export function getScfDomain(code: string): ScfDomain | undefined {
  return _domains.find(d => d.code === code);
}

/** Get controls for a domain */
export function getScfControls(domainCode: string): ScfControl[] {
  return getScfDomain(domainCode)?.controls ?? [];
}

/** Generate compliance mock data for a domain */
export function generateComplianceMock(domainCode: string): ScfControl[] {
  const controls = getScfControls(domainCode);
  const statuses: ScfControl['status'][] = ['compliant', 'partial', 'non-compliant', 'not-assessed'];
  const priorities: ScfControl['priority'][] = ['P1', 'P2', 'P3'];

  return controls.map((c, i) => ({
    ...c,
    status: statuses[i % 4],
    evidence: i % 3 === 0 ? '已提供证据' : i % 3 === 1 ? '部分证据' : '缺少证据',
    priority: i % 5 === 0 ? 'P1' : i % 3 === 0 ? 'P2' : 'P3',
  }));
}

/** Calculate domain compliance score */
export function calculateComplianceScore(controls: ScfControl[]): number {
  if (controls.length === 0) return 0;
  const scoreMap: Record<string, number> = { 'compliant': 100, 'partial': 50, 'non-compliant': 0, 'not-assessed': 25 };
  const total = controls.reduce((sum, c) => sum + (scoreMap[c.status ?? 'not-assessed'] ?? 25), 0);
  return Math.round(total / controls.length);
}

/** Map tool ID to relevant SCF domain(s) */
export const TOOL_SCF_MAPPING: Record<string, string[]> = {
  'alert-queue': ['MON', 'OPS'],
  'soar-exec': ['IRO', 'OPS'],
  'vuln-scan': ['VPM', 'NET'],
  'threat-intel': ['THR', 'MON'],
  'global-situation': ['GOV', 'MON', 'RSK'],
  'risk-score': ['RSK'],
  'board-report': ['GOV'],
  'compliance-chk': ['CPL', 'GOV', 'PRI'],
  'threat-model': ['SEA', 'THR'],
  'bcp-mgmt': ['BCD'],
  'sbom-scan': ['TPM', 'TDA'],
  'pen-test': ['VPM', 'NET', 'WEB'],
  'gdpr-audit': ['PRI', 'DCH'],
  'zero-trust': ['IAC', 'NET', 'END'],
  'report-gen': ['GOV'],
  'ai-dispatch': ['OPS', 'IRO'],
  'kpi-track': ['GOV', 'RSK'],
  'incident-mgmt': ['IRO', 'OPS'],
  'log-analysis': ['MON', 'NET'],
  'vendor-eval': ['TPM', 'SRM'],
};

/** Domain display names (Chinese) */
export const SCF_DOMAIN_LABELS: Record<string, string> = {
  GOV: '安全治理', AAT: 'AI 与自主技术', AST: '资产管理', BCD: '业务连续性',
  CAP: '容量规划', CHG: '变更管理', CLD: '云安全', CPL: '合规管理',
  CFG: '配置管理', MON: '持续监控', CRY: '密码保护', DCH: '数据分类',
  EMB: '嵌入式技术', END: '终端安全', HRS: '人力资源安全', IAC: '身份认证',
  IRO: '事件响应', IAO: '信息保障', MNT: '运维管理', MDM: '移动设备',
  NET: '网络安全', PES: '物理安全', PRI: '数据隐私', PRM: '项目管理',
  RSK: '风险管理', SEA: '安全架构', OPS: '安全运营', SAT: '安全培训',
  TDA: '技术采购', TPM: '第三方管理', THR: '威胁管理', VPM: '漏洞管理',
  WEB: 'Web 安全',
};
