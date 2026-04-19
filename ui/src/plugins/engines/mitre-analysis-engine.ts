/**
 * MITRE ATT&CK 分析引擎 — 基于 ATT&CK STIX 数据的威胁分析
 *
 * 数据来源: enterprise-attack.json (835 techniques, 187 groups, 696 malware, 691 detection, 268 COA)
 * 能力: 技术查询、战术分析、威胁建模、检测覆盖率评估
 */

// ─── Types ──────────────────────────────────────────

export interface MitreTechnique {
  id: string;            // STIX ID
  techniqueId: string;   // T1055.011
  name: string;
  description: string;
  tactics: string[];
  platforms: string[];
  detection?: string;
  mitigations?: string[];
  subtechniques?: string[];
  killChainPhases: Array<{ killChainName: string; phaseName: string }>;
}

export interface MitreGroup {
  id: string;
  groupId: string;       // G0018
  name: string;
  description: string;
  aliases: string[];
  techniques: string[];
}

export interface MitreMalware {
  id: string;
  malwareId: string;     // S0054
  name: string;
  description: string;
  techniques: string[];
  platforms: string[];
}

export interface MitreDetection {
  id: string;
  name: string;
  description: string;
  techniques: string[];
}

export interface MitreCOA {
  id: string;
  coaId: string;         // M1036
  name: string;
  description: string;
  techniques: string[];
}

export interface ThreatModelResult {
  threats: Array<{
    techniqueId: string;
    name: string;
    tactic: string;
    riskLevel: 'critical' | 'high' | 'medium' | 'low';
    description: string;
    mitigations: string[];
    detections: string[];
  }>;
  tacticCoverage: Record<string, number>;  // tactic → technique count
  overallCoverage: number;                 // 0-100
  recommendations: string[];
}

export interface AttackAnalysisResult {
  matchedTechniques: MitreTechnique[];
  relatedGroups: MitreGroup[];
  relatedMalware: MitreMalware[];
  detectionStrategies: MitreDetection[];
  coursesOfAction: MitreCOA[];
  riskAssessment: {
    level: 'critical' | 'high' | 'medium' | 'low';
    score: number;
    factors: string[];
  };
}

// ─── Tactic Labels ──────────────────────────────────

export const TACTIC_LABELS_ZH: Record<string, string> = {
  'initial-access': '初始访问', 'execution': '执行', 'persistence': '持久化',
  'privilege-escalation': '权限提升', 'defense-evasion': '防御规避',
  'credential-access': '凭证访问', 'discovery': '发现', 'lateral-movement': '横向移动',
  'collection': '收集', 'command-and-control': '命令与控制', 'exfiltration': '数据渗出',
  'impact': '影响', 'reconnaissance': '侦察', 'resource-development': '资源开发',
};

// ─── Engine ─────────────────────────────────────────

class MitreAnalysisEngine {
  private techniques: MitreTechnique[] = [];
  private groups: MitreGroup[] = [];
  private malware: MitreMalware[] = [];
  private detections: MitreDetection[] = [];
  private coas: MitreCOA[] = [];
  private loaded = false;

  async load(): Promise<void> {
    if (this.loaded) return;
    try {
      const mod = await import('../data/mitre-compact.json');
      const data = mod.default ?? mod as any;

      // mitre-compact.json: { techniques: [{id, n, p}], intrusion_sets: [...], malware: [...], detection: [...], coa: [...] }
      this.techniques = (data.techniques ?? []).map((t: any) => ({
        id: t.id, techniqueId: t.id,
        name: t.n ?? t.name ?? '',
        description: t.desc ?? t.d ?? '',
        tactics: t.p ?? t.tactics ?? [],
        platforms: t.platforms ?? [],
        killChainPhases: [],
      }));
      this.groups = (data.intrusion_sets ?? data.groups ?? []).map((g: any) => ({
        id: g.id, groupId: g.gid ?? g.id,
        name: g.n ?? g.name ?? '',
        description: g.desc ?? g.d ?? '',
        aliases: g.aliases ?? [],
        techniques: g.techs ?? g.techniques ?? [],
      }));
      this.malware = (data.malware ?? []).map((m: any) => ({
        id: m.id, malwareId: m.mid ?? m.id,
        name: m.n ?? m.name ?? '',
        description: m.desc ?? m.d ?? '',
        techniques: m.techs ?? m.techniques ?? [],
        platforms: m.platforms ?? [],
      }));
      this.detections = (data.detection ?? data.detections ?? []).map((d: any) => ({
        id: d.id,
        name: d.n ?? d.name ?? '',
        description: d.desc ?? d.d ?? '',
        techniques: d.techs ?? d.techniques ?? [],
      }));
      this.coas = (data.coa ?? data.courses_of_action ?? []).map((c: any) => ({
        id: c.id, coaId: c.mid ?? c.id,
        name: c.n ?? c.name ?? '',
        description: c.desc ?? c.d ?? '',
        techniques: c.techs ?? c.techniques ?? [],
      }));
      this.loaded = true;
    } catch (e) {
      console.error('[MITRE Engine] Failed to load data:', e);
    }
  }

  // ─── Query Methods ───────────────────────────────

  getTechniques(tactic?: string): MitreTechnique[] {
    if (!tactic || tactic === 'all') return this.techniques;
    return this.techniques.filter(t => t.tactics.includes(tactic));
  }

  getTechniqueById(id: string): MitreTechnique | undefined {
    return this.techniques.find(t => t.techniqueId === id || t.techniqueId.startsWith(id));
  }

  getGroups(): MitreGroup[] { return this.groups; }

  getGroupById(id: string): MitreGroup | undefined {
    return this.groups.find(g => g.groupId === id || g.name.includes(id) || g.aliases?.some(a => a.includes(id)));
  }

  getDetections(techniqueId?: string): MitreDetection[] {
    if (!techniqueId) return this.detections;
    return this.detections.filter(d => d.techniques?.includes(techniqueId));
  }

  getCoursesOfAction(techniqueId?: string): MitreCOA[] {
    if (!techniqueId) return this.coas;
    return this.coas.filter(c => c.techniques?.includes(techniqueId));
  }

  getTactics(): string[] {
    const tactics = new Set<string>();
    for (const t of this.techniques) {
      for (const tac of t.tactics) tactics.add(tac);
    }
    return [...tactics].sort();
  }

  // ─── Analysis Methods ────────────────────────────

  /**
   * 分析攻击事件 — 输入描述/IOC，匹配 ATT&CK 技术
   */
  analyzeAttack(input: { description?: string; type?: string; indicators?: string[] }): AttackAnalysisResult {
    const desc = (input.description ?? '').toLowerCase();
    const type = (input.type ?? '').toLowerCase();
    const query = `${desc} ${type}`;

    // Match techniques by keywords
    const matchedTechniques = this.techniques.filter(t => {
      const text = `${t.name} ${t.description}`.toLowerCase();
      const keywords = query.split(/\s+/).filter(w => w.length > 3);
      return keywords.some(kw => text.includes(kw));
    }).slice(0, 10);

    // Find related groups
    const techniqueIds = new Set(matchedTechniques.map(t => t.techniqueId));
    const relatedGroups = this.groups.filter(g =>
      g.techniques?.some(tId => techniqueIds.has(tId))
    ).slice(0, 5);

    // Find related malware
    const relatedMalware = this.malware.filter(m =>
      m.techniques?.some(tId => techniqueIds.has(tId))
    ).slice(0, 5);

    // Detection strategies
    const detectionStrategies = this.detections.filter(d =>
      d.techniques?.some(tId => techniqueIds.has(tId))
    ).slice(0, 10);

    // Courses of action
    const coursesOfAction = this.coas.filter(c =>
      c.techniques?.some(tId => techniqueIds.has(tId))
    ).slice(0, 10);

    // Risk assessment
    const riskScore = Math.min(matchedTechniques.length * 10 + relatedGroups.length * 15, 100);
    const riskLevel = riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low';

    return {
      matchedTechniques,
      relatedGroups,
      relatedMalware,
      detectionStrategies,
      coursesOfAction,
      riskAssessment: {
        level: riskLevel,
        score: riskScore,
        factors: [
          `匹配 ${matchedTechniques.length} 个 ATT&CK 技术`,
          `关联 ${relatedGroups.length} 个威胁组织`,
          `关联 ${relatedMalware.length} 个恶意软件`,
        ],
      },
    };
  }

  /**
   * 威胁建模 — 基于 STRIDE + ATT&CK
   */
  buildThreatModel(config: {
    systemName: string;
    components: string[];
    strideDimensions?: string[];
    focusTactics?: string[];
  }): ThreatModelResult {
    const tactics = config.focusTactics?.length ? config.focusTactics : this.getTactics();
    const dimensions = config.strideDimensions ?? ['S', 'T', 'R', 'I', 'D', 'E'];

    const strideToTactic: Record<string, string[]> = {
      'S': ['initial-access'],       // 伪造 → 初始访问
      'T': ['execution', 'persistence'], // 篡改 → 执行/持久化
      'R': ['defense-evasion'],      // 否认 → 防御规避
      'I': ['collection', 'exfiltration'], // 信息泄露 → 收集/渗出
      'D': ['impact'],               // 拒绝服务 → 影响
      'E': ['privilege-escalation'], // 提权 → 权限提升
    };

    const threats: ThreatModelResult['threats'] = [];
    const tacticCoverage: Record<string, number> = {};

    for (const dim of dimensions) {
      const relevantTactics = strideToTactic[dim] ?? [];
      for (const tactic of relevantTactics) {
        const techs = this.getTechniques(tactic).slice(0, 3);
        tacticCoverage[tactic] = techs.length;

        for (const tech of techs) {
          const coas = this.getCoursesOfAction(tech.techniqueId);
          const dets = this.getDetections(tech.techniqueId);

          threats.push({
            techniqueId: tech.techniqueId,
            name: tech.name,
            tactic: TACTIC_LABELS_ZH[tactic] ?? tactic,
            riskLevel: dim === 'I' || dim === 'S' || dim === 'E' ? 'high' : 'medium',
            description: tech.description?.substring(0, 100) ?? '',
            mitigations: coas.map(c => c.name).slice(0, 2),
            detections: dets.map(d => d.name).slice(0, 2),
          });
        }
      }
    }

    const totalTechniques = this.techniques.length;
    const coveredTechniques = threats.length;
    const overallCoverage = totalTechniques > 0 ? Math.round((coveredTechniques / totalTechniques) * 100) : 0;

    const recommendations = [
      ...threats.filter(t => t.riskLevel === 'high').slice(0, 3).map(t =>
        `高风险: 防御 ${t.name} (${t.techniqueId}) — 缓解措施: ${t.mitigations.join(', ')}`
      ),
      `当前检测覆盖率 ${overallCoverage}%，建议加强 ${Object.entries(tacticCoverage).filter(([, c]) => c === 0).map(([t]) => TACTIC_LABELS_ZH[t] ?? t).join('、')} 阶段的检测`,
    ];

    return { threats, tacticCoverage, overallCoverage, recommendations };
  }

  /**
   * 检测覆盖率评估
   */
  assessDetectionCoverage(): { overall: number; byTactic: Record<string, number>; gaps: string[] } {
    const byTactic: Record<string, number> = {};
    const gaps: string[] = [];

    for (const tactic of this.getTactics()) {
      const techs = this.getTechniques(tactic);
      const techIds = new Set(techs.map(t => t.techniqueId));
      const covered = techIds.size > 0
        ? this.detections.filter(d => d.techniques?.some(tId => techIds.has(tId))).length / Math.max(techIds.size, 1) * 100
        : 0;
      byTactic[tactic] = Math.round(covered);
      if (covered < 50) {
        gaps.push(`${TACTIC_LABELS_ZH[tactic] ?? tactic} 阶段检测覆盖率不足 (${Math.round(covered)}%)`);
      }
    }

    const overall = Object.values(byTactic).length > 0
      ? Math.round(Object.values(byTactic).reduce((a, b) => a + b, 0) / Object.values(byTactic).length)
      : 0;

    return { overall, byTactic, gaps };
  }

  // ─── Private: STIX Loading ───────────────────────

  private async _loadFromStix(): Promise<void> {
    // This would load from enterprise-attack.json if compact data is unavailable
    // For now, compact data should always be available
    console.warn('[MITRE Engine] STIX loading not implemented, using empty data');
    this.loaded = true;
  }
}

// Singleton
export const mitreAnalysisEngine = new MitreAnalysisEngine();
