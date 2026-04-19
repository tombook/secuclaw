/**
 * MITRE ATT&CK 数据服务
 * 提供 Enterprise ATT&CK 技术库、威胁组织、恶意软件、检测策略查询
 * 
 * 数据来源：MITRE ATT&CK STIX (enterprise-attack.json)
 * 精简版：835 techniques, 187 intrusion-sets, 50 malware, 50 detection, 268 COA
 */

import MITRE_DATA from './mitre-compact.json';

export interface AttackTechnique {
  id: string;       // e.g. T1059.001
  name: string;
  tactics: string[]; // kill chain phases
}

export interface IntrusionSet {
  name: string;
  aliases: string[];
}

export interface MalwareEntry {
  name: string;
  types: string[];
}

export interface DetectionStrategy {
  name: string;
}

export interface CourseOfAction {
  name: string;
}

export interface AttackTool {
  name: string;
}

interface MitreCompact {
  techniques: Array<{ id: string; n: string; p: string[] }>;
  intrusion_sets: Array<{ n: string; a: string[] }>;
  malware: Array<{ n: string; f: string[] }>;
  detection: Array<{ n: string }>;
  coa: Array<{ n: string }>;
  tools: Array<{ n: string }>;
}

const data = MITRE_DATA as MitreCompact;

const _techniques: AttackTechnique[] = data.techniques.map(t => ({
  id: t.id, name: t.n, tactics: t.p,
}));

const _intrusionSets: IntrusionSet[] = data.intrusion_sets.map(i => ({
  name: i.n, aliases: i.a,
}));

const _malware: MalwareEntry[] = data.malware.map(m => ({
  name: m.n, types: m.f,
}));

const _detection: DetectionStrategy[] = data.detection.map(d => ({
  name: d.n,
}));

const _coa: CourseOfAction[] = data.coa.map(c => ({
  name: c.n,
}));

const _tools: AttackTool[] = data.tools.map(t => ({
  name: t.n,
}));

// ─── Query API ─────────────────────────────────────────

export function getTechniques(): AttackTechnique[] { return _techniques; }
export function getIntrusionSets(): IntrusionSet[] { return _intrusionSets; }
export function getMalware(): MalwareEntry[] { return _malware; }
export function getDetectionStrategies(): DetectionStrategy[] { return _detection; }
export function getCoursesOfAction(): CourseOfAction[] { return _coa; }
export function getTools(): AttackTool[] { return _tools; }

/** Get techniques by tactic */
export function getTechniquesByTactic(tactic: string): AttackTechnique[] {
  return _techniques.filter(t => t.tactics.includes(tactic));
}

/** Search techniques by keyword */
export function searchTechniques(query: string): AttackTechnique[] {
  const q = query.toLowerCase();
  return _techniques.filter(t => t.id.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
}

/** Get tactics list */
export function getTactics(): string[] {
  const tactics = new Set<string>();
  _techniques.forEach(t => t.tactics.forEach(p => tactics.add(p)));
  return [...tactics].sort();
}

/** Generate mock threat intel data */
export function generateThreatIntelMock(ioc: string) {
  const relatedTechniques = _techniques.slice(0, 5).map(t => ({
    techniqueId: t.id,
    techniqueName: t.name,
    tactics: t.tactics,
    relevance: 'high' as const,
  }));
  const relatedGroups = _intrusionSets.slice(0, 3).map(g => ({
    name: g.name,
    aliases: g.aliases,
    confidence: 80 + Math.floor(Math.random() * 20),
  }));
  const relatedMalware = _malware.slice(0, 4).map(m => ({
    name: m.name,
    types: m.types,
  }));

  return { ioc, techniques: relatedTechniques, groups: relatedGroups, malware: relatedMalware };
}

/** Generate mock alert data from detection strategies */
export function generateAlertMock(count = 5) {
  const strategies = _detection.slice(0, count);
  const severities: Array<'P1' | 'P2' | 'P3'> = ['P1', 'P2', 'P3'];
  const sources = ['EDR', 'SIEM', 'IDS', 'DLP', 'WAF'];
  const statuses: Array<'new' | 'investigating' | 'resolved'> = ['new', 'investigating', 'resolved'];

  return strategies.map((s, i) => ({
    id: `ALT-${String(i + 1).padStart(4, '0')}`,
    title: s.name,
    severity: severities[i % 3],
    source: sources[i % 5],
    status: statuses[i % 3],
    technique: _techniques[i % _techniques.length]?.id ?? '',
    createdAt: Date.now() - i * 600000,
  }));
}

/** Generate mock incident data from COA */
export function generateIncidentMock(count = 5) {
  return _coa.slice(0, count).map((c, i) => ({
    id: `INC-${String(i + 27).padStart(4, '0')}`,
    title: c.name,
    severity: (['P1', 'P2', 'P3'] as const)[i % 3],
    status: (['new', 'investigating', 'contained', 'resolved'] as const)[i % 4],
    assignee: ['张伟', '李明', '王磊', '陈静', '赵强'][i % 5],
    technique: _techniques[i * 10 % _techniques.length]?.id ?? '',
    updatedAt: `${i === 0 ? '10分钟' : i === 1 ? '2小时' : i + '天'}前`,
  }));
}

/** MITRE ATT&CK tactics (Chinese labels) */
export const TACTIC_LABELS: Record<string, string> = {
  'reconnaissance': '侦察',
  'resource-development': '资源开发',
  'initial-access': '初始访问',
  'execution': '执行',
  'persistence': '持久化',
  'privilege-escalation': '权限提升',
  'defense-evasion': '防御规避',
  'credential-access': '凭证访问',
  'discovery': '发现',
  'lateral-movement': '横向移动',
  'collection': '收集',
  'command-and-control': '命令与控制',
  'exfiltration': '数据渗出',
  'impact': '影响',
};
