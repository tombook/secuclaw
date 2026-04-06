/**
 * Threat Intelligence API - 威胁情报分析
 * 
 * 分析威胁情报，关联MITRE ATT&CK框架
 * 支持威胁识别、评估和响应建议
 */

import type { JsonStore } from '../storage/json-store.js';
import type {
  ThreatIntelligence,
  ThreatIntelligenceRequest,
  AnomalySeverity,
} from './types.js';

const logger = {
  info: (...args: any[]) => console.log('[ThreatIntel]', ...args),
  error: (...args: any[]) => console.error('[ThreatIntel]', ...args),
  warn: (...args: any[]) => console.warn('[ThreatIntel]', ...args),
};

/**
 * Raw Threat Data - 原始威胁数据输入
 */
export interface RawThreatData {
  // 威胁标识
  id?: string;
  name: string;
  description?: string;
  
  // 威胁类型
  type?: string;
  category?: string;
  
  // 威胁行为者
  threatActors?: string[];
  attributedGroups?: string[];
  
  // 技术细节
  ttps?: string[]; // MITRE ATT&CK techniques
  malwareFamilies?: string[];
  tools?: string[];
  
  // 指标
  indicators?: {
    type: 'ip' | 'domain' | 'hash' | 'email' | 'url' | 'file' | 'registry' | 'process';
    value: string;
    context?: string;
  }[];
  
  // 目标信息
  targetSectors?: string[];
  targetRegions?: string[];
  targetAssets?: string[];
  
  // 能力评估
  sophistication?: 'low' | 'medium' | 'high' | 'advanced';
  intent?: 'opportunistic' | 'targeted' | 'strategic';
  capability?: 'low' | 'medium' | 'high' | 'critical';
  
  // 时间信息
  firstSeen?: number;
  lastSeen?: number;
  activeSince?: number;
  
  // 来源
  source?: string;
  confidence?: number;
  
  // 严重性
  severity?: AnomalySeverity;
}

/**
 * MITRE ATT&CK Mapping - MITRE ATT&CK映射
 */
const MITRE_TACTIC_MAP: Record<string, string> = {
  'T1566': 'Initial Access',
  'T1190': 'Initial Access',
  'T1133': 'Initial Access',
  'T1200': 'Initial Access',
  'T1566.001': 'Initial Access',
  'T1566.002': 'Initial Access',
  'T1199': 'Initial Access',
  'T1201': 'Privilege Escalation',
  'T1068': 'Privilege Escalation',
  'T1548': 'Privilege Escalation',
  'T1134': 'Privilege Escalation',
  'T1053': 'Execution',
  'T1059': 'Execution',
  'T1204': 'Execution',
  'T1203': 'Execution',
  'T1021': 'Lateral Movement',
  'T1570': 'Lateral Movement',
  'T1056': 'Collection',
  'T1560': 'Collection',
  'T1119': 'Collection',
  'T1005': 'Collection',
  'T1041': 'Exfiltration',
  'T1048': 'Exfiltration',
  'T1567': 'Exfiltration',
  'T1049': 'Exfiltration',
  'T1486': 'Impact',
  'T1489': 'Impact',
  'T1490': 'Impact',
  'T1485': 'Impact',
  'T1078': 'Defense Evasion',
  'T1036': 'Defense Evasion',
  'T1027': 'Defense Evasion',
  'T1562': 'Defense Evasion',
  'T1082': 'Discovery',
  'T1083': 'Discovery',
  'T1040': 'Discovery',
  'T1007': 'Discovery',
  'T1087': 'Discovery',
  'T1057': 'Discovery',
  'T1018': 'Discovery',
  'T1063': 'Discovery',
  'T1080': 'Discovery',
  'T1006': 'Defense Evasion',
  'T1106': 'Execution',
  'T1127': 'Defense Evasion',
  'T1055': 'Privilege Escalation',
  'T1011': 'Exfiltration',
  'T1114': 'Collection',
  'T1110': 'Credential Access',
  'T1112': 'Credential Access',
  'T1003': 'Credential Access',
  'T1555': 'Credential Access',
  'T1047': 'Discovery',
};

const MITRE_TECHNIQUE_MAP: Record<string, { name: string; description: string }> = {
  'T1566': { name: 'Phishing', description: '通过钓鱼获取初始访问权限' },
  'T1566.001': { name: 'Spearphishing Attachment', description: '钓鱼邮件附件' },
  'T1566.002': { name: 'Spearphishing Link', description: '钓鱼邮件链接' },
  'T1190': { name: 'Exploit Public-Facing Application', description: '利用面向公众的应用' },
  'T1059': { name: 'Command and Scripting Interpreter', description: '命令和脚本解释器' },
  'T1059.004': { name: 'Unix Shell', description: 'Unix Shell' },
  'T1059.007': { name: 'JavaScript', description: 'JavaScript' },
  'T1082': { name: 'System Information Discovery', description: '系统信息发现' },
  'T1083': { name: 'File and Directory Discovery', description: '文件和目录发现' },
  'T1005': { name: 'Data from Local System', description: '本地系统数据' },
  'T1041': { name: 'Exfiltration Over C2 Channel', description: '通过C2通道外泄数据' },
  'T1486': { name: 'Data Encrypted for Impact', description: '数据加密影响' },
  'T1078': { name: 'Valid Accounts', description: '有效账户' },
  'T1027': { name: 'Obfuscated Files or Information', description: '混淆文件或信息' },
  'T1053': { name: 'Scheduled Task/Job', description: '计划任务/作业' },
  'T1021': { name: 'Remote Services', description: '远程服务' },
  'T1047': { name: 'Windows Management Instrumentation', description: 'WMI' },
  'T1110': { name: 'Brute Force', description: '暴力破解' },
  'T1003': { name: 'OS Credential Dumping', description: '凭证转储' },
  'T1555': { name: 'Credentials from Password Stores', description: '密码存储凭证' },
  'T1068': { name: 'Exploitation for Privilege Escalation', description: '权限提升利用' },
  'T1036': { name: 'Masquerading', description: '伪装' },
  'T1048': { name: 'Exfiltration Over Alternative Protocol', description: '替代协议外泄' },
  'T1204': { name: 'User Execution', description: '用户执行' },
  'T1018': { name: 'Remote System Discovery', description: '远程系统发现' },
  'T1057': { name: 'Process Discovery', description: '进程发现' },
  'T1087': { name: 'Account Discovery', description: '账户发现' },
  'T1134': { name: 'Access Token Manipulation', description: '访问令牌操作' },
  'T1548': { name: 'Abuse Elevation Control Mechanism', description: '滥用提升控制机制' },
  'T1562': { name: 'Impair Defenses', description: '削弱防御' },
  'T1560': { name: 'Archive Collected Data', description: '归档收集的数据' },
  'T1119': { name: 'Automated Collection', description: '自动收集' },
  'T1006': { name: 'Direct Volume Access', description: '直接卷访问' },
  'T1489': { name: 'Service Stop', description: '服务停止' },
  'T1490': { name: 'Inhibit System Recovery', description: '阻止系统恢复' },
  'T1485': { name: 'Data Destruction', description: '数据销毁' },
  'T1491': { name: 'Defacement', description: '破坏' },
};

/**
 * Threat Intelligence Engine - 威胁情报分析引擎
 */
export class ThreatIntelEngine {
  constructor(private store: JsonStore) {}

  /**
   * 分析威胁情报
   * @param threatData 原始威胁数据
   */
  async analyzeThreat(threatData: RawThreatData): Promise<ThreatIntelligence> {
    logger.info(`Analyzing threat: ${threatData.name}`);

    try {
      // 1. 映射MITRE ATT&CK技术
      const ttps = this.mapToMitreTechniques(threatData.ttps || [], threatData.type);

      // 2. 确定严重性
      const severity = this.determineSeverity(threatData);

      // 3. 评估相关性
      const relevance = this.assessRelevance(threatData);

      // 4. 计算置信度
      const confidence = this.calculateConfidence(threatData);

      // 5. 生成描述
      const description = this.generateDescription(threatData, ttps);

      // 6. 生成摘要
      const summary = this.generateSummary(threatData, ttps);

      // 7. 生成推荐行动
      const recommendedActions = this.generateRecommendedActions(threatData, ttps, severity);

      const intelligence: ThreatIntelligence = {
        id: `threat-${threatData.id || Date.now()}`,
        threatType: threatData.type || threatData.category || 'Unknown',
        threatActors: threatData.threatActors || threatData.attributedGroups,
        ttps,
        summary,
        description,
        indicators: threatData.indicators?.map(ind => ({
          ...(ind as any),
          confidence: (ind as any).confidence || 80,
        })) as ThreatIntelligence['indicators'],
        severity,
        relevance,
        confidence,
        targetSectors: threatData.targetSectors,
        targetRegions: threatData.targetRegions,
        activeSince: threatData.activeSince || threatData.firstSeen,
        lastActivity: threatData.lastSeen,
        sources: threatData.source ? [threatData.source] : [],
        recommendedActions,
        generatedAt: Date.now(),
      };

      // 保存情报到存储
      await this.saveIntelligence(intelligence);

      return intelligence;

    } catch (error) {
      logger.error('Failed to analyze threat:', error);
      throw error;
    }
  }

  /**
   * 批量分析威胁情报
   * @param threats 威胁列表
   */
  async analyzeBatchThreats(threats: RawThreatData[]): Promise<ThreatIntelligence[]> {
    const results: ThreatIntelligence[] = [];

    for (const threat of threats) {
      try {
        const intelligence = await this.analyzeThreat(threat);
        results.push(intelligence);
      } catch (error) {
        logger.warn(`Failed to analyze threat ${threat.name}:`, error);
      }
    }

    return results;
  }

  /**
   * 搜索威胁情报
   */
  async searchIntelligence(request: ThreatIntelligenceRequest): Promise<ThreatIntelligence[]> {
    const all = await this.store.get<ThreatIntelligence[]>('threat-intelligence.json');
    if (!all) return [];

    let results = [...all];

    // 按类型过滤
    if (request.types?.length) {
      results = results.filter(t => request.types!.includes(t.threatType));
    }

    // 按严重性过滤
    if (request.severity?.length) {
      results = results.filter(t => request.severity!.includes(t.severity));
    }

    // 按时间过滤
    if (request.fromDate) {
      results = results.filter(t => t.generatedAt >= request.fromDate!);
    }

    if (request.toDate) {
      results = results.filter(t => t.generatedAt <= request.toDate!);
    }

    // 按关键词搜索
    if (request.query) {
      const query = request.query.toLowerCase();
      results = results.filter(t =>
        t.threatType.toLowerCase().includes(query) ||
        t.summary.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.threatActors?.some(actor => actor.toLowerCase().includes(query)) ||
        t.ttps?.some(ttp => ttp.toLowerCase().includes(query))
      );
    }

    // 限制数量
    if (request.limit) {
      results = results.slice(0, request.limit);
    }

    return results.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }

  /**
   * 获取威胁情报列表
   */
  async listIntelligence(filter?: {
    severity?: AnomalySeverity[];
    fromDate?: number;
    toDate?: number;
  }): Promise<ThreatIntelligence[]> {
    return this.searchIntelligence({
      query: '',
      ...filter,
    });
  }

  /**
   * 获取单个威胁情报
   */
  async getIntelligence(id: string): Promise<ThreatIntelligence | null> {
    const all = await this.store.get<ThreatIntelligence[]>('threat-intelligence.json');
    if (!all) return null;
    return all.find(t => t.id === id) || null;
  }

  /**
   * 获取威胁统计
   */
  async getStats(): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    topThreatActors: string[];
    topTechniques: string[];
  }> {
    const all = await this.store.get<ThreatIntelligence[]>('threat-intelligence.json') || [];

    const stats = {
      total: all.length,
      bySeverity: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      topThreatActors: [] as string[],
      topTechniques: [] as string[],
    };

    // 统计严重性
    all.forEach(t => {
      stats.bySeverity[t.severity] = (stats.bySeverity[t.severity] || 0) + 1;
      stats.byType[t.threatType] = (stats.byType[t.threatType] || 0) + 1;
    });

    // 统计威胁行为者
    const actorCounts: Record<string, number> = {};
    all.forEach(t => {
      t.threatActors?.forEach(actor => {
        actorCounts[actor] = (actorCounts[actor] || 0) + 1;
      });
    });
    stats.topThreatActors = Object.entries(actorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([actor]) => actor);

    // 统计技术
    const techniqueCounts: Record<string, number> = {};
    all.forEach(t => {
      t.ttps?.forEach(ttp => {
        techniqueCounts[ttp] = (techniqueCounts[ttp] || 0) + 1;
      });
    });
    stats.topTechniques = Object.entries(techniqueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tech]) => tech);

    return stats;
  }

  // ==================== Private Methods ====================

  private mapToMitreTechniques(existingTttps: string[], threatType?: string): string[] {
    const techniques: string[] = [...(existingTttps || [])];

    // 如果没有提供TTPS，根据威胁类型推断
    if (techniques.length === 0 && threatType) {
      const typeToTtpMap: Record<string, string[]> = {
        'phishing': ['T1566', 'T1566.001', 'T1566.002', 'T1204'],
        'malware': ['T1059', 'T1053', 'T1027'],
        'ransomware': ['T1486', 'T1490', 'T1489', 'T1048'],
        'apt': ['T1021', 'T1059', 'T1082', 'T1005', 'T1041'],
        'bruteforce': ['T1110', 'T1078'],
        'ddos': ['T1498', 'T1499'],
        'databreach': ['T1005', 'T1119', 'T1041'],
      };

      const mapped = typeToTtpMap[threatType.toLowerCase()];
      if (mapped) {
        techniques.push(...mapped);
      }
    }

    // 去重
    return [...new Set(techniques)];
  }

  private determineSeverity(threat: RawThreatData): AnomalySeverity {
    // 如果已明确指定严重性
    if (threat.severity) {
      return threat.severity;
    }

    // 根据能力评估严重性
    if (threat.capability === 'critical' || threat.capability === 'high') {
      if (threat.intent === 'targeted' || threat.intent === 'strategic') {
        return 'critical';
      }
      return 'high';
    }

    // 根据复杂度和目标
    if (threat.sophistication === 'advanced' || threat.sophistication === 'high') {
      return 'high';
    }

    // 根据威胁类型
    const highSeverityTypes = ['ransomware', 'apt', 'malware', 'data-theft'];
    if (threat.type && highSeverityTypes.includes(threat.type.toLowerCase())) {
      return 'high';
    }

    const criticalSeverityTypes = ['apt', 'nation-state'];
    if (threat.type && criticalSeverityTypes.includes(threat.type.toLowerCase())) {
      return 'critical';
    }

    return 'medium';
  }

  private assessRelevance(threat: RawThreatData): 'global' | 'industry' | 'organization' | 'specific' {
    // 如果有明确的目标信息
    if (threat.targetAssets?.length) {
      return 'specific';
    }

    // 如果目标是特定行业
    if (threat.targetSectors?.length) {
      return 'industry';
    }

    // 如果目标是特定地区
    if (threat.targetRegions?.length) {
      return 'global';
    }

    return 'global';
  }

  private calculateConfidence(threat: RawThreatData): number {
    let confidence = threat.confidence || 50;

    // 根据来源调整
    if (threat.source) {
      const sourceWeights: Record<string, number> = {
        'cisa': 95,
        'nvd': 90,
        'mandiant': 85,
        'crowdstrike': 85,
        'fireeye': 85,
        'recorded-future': 80,
        'virusTotal': 75,
        'open-source': 60,
      };

      const sourceWeight = Object.entries(sourceWeights)
        .find(([key]) => threat.source!.toLowerCase().includes(key));

      if (sourceWeight) {
        confidence = Math.min(confidence, sourceWeight[1]);
      }
    }

    // 根据指标数量调整
    if (threat.indicators?.length) {
      confidence = Math.min(confidence + threat.indicators.length * 2, 95);
    }

    // 根据时间信息调整
    if (threat.lastSeen || threat.firstSeen) {
      confidence += 5;
    }

    return Math.min(confidence, 100);
  }

  private generateDescription(threat: RawThreatData, ttps: string[]): string {
    const parts: string[] = [];

    // 基本描述
    if (threat.description) {
      parts.push(threat.description);
    } else {
      parts.push(`该威胁类型为${threat.type || '未知'}`);
    }

    // 威胁行为者
    if (threat.threatActors?.length) {
      parts.push(`已知威胁行为者包括：${threat.threatActors.join(', ')}`);
    }

    // 技术信息
    if (ttps.length > 0) {
      const techniqueDetails = ttps
        .slice(0, 5)
        .map(t => MITRE_TECHNIQUE_MAP[t]?.name || t)
        .join(', ');
      parts.push(`涉及技术：${techniqueDetails}`);
    }

    // 目标信息
    if (threat.targetSectors?.length) {
      parts.push(`主要目标行业：${threat.targetSectors.join(', ')}`);
    }

    if (threat.targetRegions?.length) {
      parts.push(`主要目标地区：${threat.targetRegions.join(', ')}`);
    }

    // 能力评估
    if (threat.capability) {
      const capabilityText: Record<string, string> = {
        critical: '具有极其先进的攻击能力',
        high: '具有高级攻击能力',
        medium: '具有中等攻击能力',
        low: '攻击能力有限',
      };
      parts.push(capabilityText[threat.capability] || '');
    }

    return parts.filter(p => p).join('。');
  }

  private generateSummary(threat: RawThreatData, ttps: string[]): string {
    const summaries: string[] = [];

    // 威胁类型
    summaries.push(`${threat.name}是一个${threat.type || '未知类型的'}威胁`);

    // 严重性
    const severityText: Record<string, string> = {
      critical: '极其严重的',
      high: '高危的',
      medium: '中等的',
      low: '低危的',
    };
    summaries.push(`属于${severityText[this.determineSeverity(threat)]}威胁`);

    // 关键战术
    if (ttps.length > 0) {
      const tactics = [...new Set(ttps.map(t => MITRE_TACTIC_MAP[t]).filter(Boolean))];
      if (tactics.length > 0) {
        summaries.push(`主要战术包括：${tactics.join(', ')}`);
      }
    }

    return summaries.join('，') + '。';
  }

  private generateRecommendedActions(
    threat: RawThreatData,
    ttps: string[],
    severity: AnomalySeverity
  ): string[] {
    const actions: string[] = [];

    // 基于严重性的通用建议
    if (severity === 'critical' || severity === 'high') {
      actions.push('立即启动威胁响应流程');
      actions.push('通知安全管理层和关键干系人');
      actions.push('加强网络和终端监控');
    }

    // 基于战术的建议
    const tactics = [...new Set(ttps.map(t => MITRE_TACTIC_MAP[t]).filter(Boolean))];

    if (tactics.includes('Initial Access')) {
      actions.push('审查和加固边界防护措施');
      actions.push('加强用户安全意识培训');
      actions.push('实施邮件安全网关防护');
    }

    if (tactics.includes('Execution')) {
      actions.push('审查终端应用程序白名单策略');
      actions.push('加强PowerShell和脚本监控');
    }

    if (tactics.includes('Privilege Escalation')) {
      actions.push('审查和最小化特权账户使用');
      actions.push('实施特权访问管理(PAM)');
    }

    if (tactics.includes('Lateral Movement')) {
      actions.push('实施网络分段');
      actions.push('加强横向移动检测规则');
    }

    if (tactics.includes('Collection') || tactics.includes('Exfiltration')) {
      actions.push('审查数据外泄防护策略');
      actions.push('加强DLP规则');
    }

    if (tactics.includes('Impact')) {
      actions.push('验证备份完整性');
      actions.push('测试灾难恢复流程');
    }

    // 基于威胁类型的特定建议
    if (threat.type?.toLowerCase().includes('phishing')) {
      actions.push('部署钓鱼防护解决方案');
      actions.push('开展钓鱼演练');
    }

    if (threat.type?.toLowerCase().includes('ransomware')) {
      actions.push('审查勒索软件防护策略');
      actions.push('确保离线备份可用');
    }

    // 基于指标的特定建议
    if (threat.indicators?.length) {
      actions.push('在安全设备上添加IOC检测规则');
    }

    // 去重并返回
    return [...new Set(actions)];
  }

  private async saveIntelligence(intelligence: ThreatIntelligence): Promise<void> {
    const existing = await this.store.get<ThreatIntelligence[]>('threat-intelligence.json') || [];
    const updated = [intelligence, ...existing].slice(0, 1000);
    await this.store.set('threat-intelligence.json', updated);
  }
}
