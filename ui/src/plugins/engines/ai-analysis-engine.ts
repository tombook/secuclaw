/**
 * AI 分析引擎 — 所有工具共享的 AI 分析能力
 *
 * 核心理念：不是建设安全工具集，而是让角色用 AI 对已有数据做专业分析和决策建议
 * 每个 tool 的流程：数据输入 → 数据增强(SCF/MITRE) → AI 分析 → 角色视角建议
 */

import type { RoleId } from '../../config/role-tool-config';
import { ROLE_THEMES } from '../../config/role-theme-config';

// ─── Types ──────────────────────────────────────────

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface ScfContext {
  controlId: string;
  domain: string;
  name: string;
  description: string;
  mappings?: Array<{ framework: string; controlId: string }>;
}

export interface MitreContext {
  techniqueId: string;
  name: string;
  tactic: string;
  description: string;
  mitigations?: string[];
  detection?: string[];
}

export interface AiAnalysisRequest {
  toolId: string;
  role: RoleId;
  inputData: Record<string, unknown>;
  scfContext?: ScfContext[];
  mitreContext?: MitreContext[];
  customPrompt?: string;
}

export interface ActionItem {
  priority: 'P1' | 'P2' | 'P3' | 'P4';
  action: string;
  owner: string;
  deadline: string;
}

export interface AiAnalysisResult {
  summary: string;
  riskLevel: RiskLevel;
  analysis: string;
  recommendations: string[];
  actionItems: ActionItem[];
  boardSummary: string;          // 向上汇报的摘要
  dataEnrichment?: {
    scfControlsMatched: number;
    mitreTechniquesMatched: number;
    coverageScore: number;       // 0-100
  };
}

// ─── AI Backend Configuration ──────────────────────

const AI_BACKEND_URL = 'https://api.minimaxi.com/v1';
const AI_API_KEY = 'sk-cp-Xbbc9YyGkfjGakX_uHOA0eoubcvC6ntqq0sR5NIqxOUuC-wGuuyMU3QJIiW-vh5F0KPISkPiuwBPCwtYU7pnxrDpFzd1JTer8oNI1y1RJ4ufqxEgCai67Kc';
const AI_MODEL = 'MiniMax-M2.7';

// ─── Role-specific Security Skills ─────────────────

const ROLE_SECURITY_SKILLS: Record<string, string> = {
  'ciso': `
CISO（首席信息安全官，SEC+LEG+IT三元组合）核心能力：
- 光明面：安全战略规划、合规治理、安全架构设计、风险管理、安全预算管理、监管对接、安全政策制定、安全绩效评估、危机管理
- 黑暗面：合规漏洞挖掘、监管渗透测试、架构弱点评估、法律风险分析、内部威胁检测、高管攻击模拟、供应链攻击评估
- MITRE覆盖：全部14个战术阶段
- SCF覆盖：GOV治理、RSK风险管理、AC访问控制、IR事件响应、PRV隐私等17个控制域
- 决策框架：高风险+高合规→立即行动；投资优先级：合规强制>高危修复>关键业务>风险缓解>能力提升`,

  'secuclaw-commander': `
SecuClaw指挥官（SEC+LEG+IT+BIZ四元组合，最高决策角色）核心能力：
- 光明面：战略规划、全面安全治理、合规管理、架构设计、风险管理、预算管理、危机管理、董事会汇报、跨部门协调
- 黑暗面：全面渗透测试、红队演练、APT模拟、供应链攻击、内部威胁评估、合规渗透、架构弱点分析
- MITRE覆盖：全部战术阶段
- SCF覆盖：23个控制域
- 决策框架：P0紧急(业务中断/大规模泄露)→P1高→P2中→P3低`,

  'privacy-officer': `
隐私安全官（SEC+LEG二元组合）核心能力：
- 光明面：隐私影响评估(PIA)、数据分类分级、合规审计、用户权利响应、数据保护政策、跨境传输合规、同意管理
- 黑暗面：隐私合规渗透、数据流向追踪、合规漏洞挖掘、个人信息窃取模拟、第三方数据泄露、隐私政策绕过
- 法律：GDPR/CCPA/PIPL合规、数据保护法、隐私政策审查
- 技术：数据脱敏、差分隐私、同态加密、联邦学习、数据水印、隐私计算
- 风险评估：数据敏感性×处理规模×用户影响=风险等级`,

  'business-security-officer': `
业务安全官（SEC+BIZ二元组合）核心能力：
- 光明面：业务连续性管理、风险量化评估、供应链安全、安全投资回报分析、业务影响分析、灾难恢复规划、安全KPI制定
- 黑暗面：业务逻辑漏洞挖掘、业务流程攻击模拟、供应链攻击面分析、业务中断攻击评估、经济影响分析
- MITRE覆盖：初始访问、持久化、权限提升、横向移动、收集、渗出、命令控制、影响
- SCF覆盖：BC业务连续性、RSK风险管理、TPM第三方管理
- 决策框架：风险优先级矩阵(低/高业务影响 × 低/高可能性)`,

  'security-ops': `
安全运营官（SEC+IT+BIZ三元组合）核心能力：
- 光明面：威胁监控、事件响应、SOC运营、漏洞管理、日志分析、威胁狩猎、安全自动化、运营指标分析
- 黑暗面：渗透测试、红队演练、攻击路径发现、漏洞利用验证、内网横向移动、权限提升
- MITRE覆盖：全部攻击战术
- SCF覆盖：MON监控、OPS运营、IR事件响应、AU审计
- 告警分类：P0紧急(正在攻击)→P1高(1h)→P2中(4h)→P3低(次日)
- 响应流程：发现→确认→遏制→根除→恢复→复盘`,

  'security-expert': `
安全专家（单一SEC组合）核心能力：
- 光明面：漏洞扫描、补丁管理、安全监控、事件响应、威胁检测、访问控制、加密管理、身份认证
- 黑暗面：渗透测试、红队演练、漏洞利用、权限提升、横向移动、数据窃取、社会工程
- 工具：Burp Suite、Metasploit、Nmap、Nessus、OpenVAS、Ghidra、Wireshark
- 决策：正在利用的漏洞(CVSS9.0+)→敏感数据暴露→权限提升路径→横向移动→持久化`,

  'security-architect': `
安全架构师（SEC+IT二元组合）核心能力：
- 光明面：安全架构设计、零信任架构、防御纵深设计、安全区域划分、身份架构、云安全架构、应用安全架构
- 黑暗面：架构弱点分析、攻击路径绘制、信任边界渗透、架构绕过设计、横向移动架构、持久化架构
- 原则：安全内嵌(Privacy by Design)、最小权限、纵深防御、持续演进、平衡取舍
- 决策：数据敏感性→保护级别；用户规模→认证架构；可用性→冗余级别`,

  'supply-chain-security': `
供应链安全官（SEC+LEG+BIZ三元组合）核心能力：
- 光明面：供应商安全评估、第三方风险管理、供应链合规、合同安全条款、供应商审计、数据共享协议、供应链可视化
- 黑暗面：供应链渗透测试、第三方漏洞挖掘、供应商攻击模拟、供应链弱点分析、数据泄露路径分析、供应链勒索评估
- 法律：GDPR供应链合规、CCPA供应链义务、合同法、跨境数据传输
- 分级：关键供应商(严格评估+持续监控)>重要供应商(定期评估)>一般供应商(标准流程)`,
};

const TOOL_TEMPLATES: Record<string, Partial<ToolAnalysisTemplate>> = {
  // ─── B 类：SCF 问卷评估 ─────────────────────────
  'compliance-chk': {
    systemPrompt: '你是合规管理专家，基于 SCF 合规管理域(CPL)控制项评估组织合规状态。',
  },
  'gdpr-audit': {
    systemPrompt: '你是数据隐私保护官，基于 SCF 数据隐私域(PRI, 102控制项)进行 GDPR/DPIA 合规审计和差距分析。',
  },
  'risk-score': {
    systemPrompt: '你是首席风险官，基于 SCF 风险管理域(RSK)和34域控制项进行四维风险评估(技术/合规/运营/战略)。',
  },
  'zero-trust': {
    systemPrompt: '你是安全架构师，基于 SCF 身份认证(IAC)+网络安全(NET)+终端安全(END)域评估零信任架构成熟度。',
  },
  'vendor-eval': {
    systemPrompt: '你是供应链安全管理专家，基于 SCF 第三方管理域(TPM)评估供应商安全风险。',
  },
  'board-report': {
    systemPrompt: '你是 CISO，基于 SCF 安全治理域(GOV)为董事会准备安全态势报告和风险控制建议。',
  },
  'kpi-track': {
    systemPrompt: '你是安全运营经理，基于 SCF 安全运营(OPS)+治理(GOV)域追踪安全 KPI 和趋势。',
  },
  'bcp-mgmt': {
    systemPrompt: '你是业务连续性管理专家，基于 SCF 业务连续性域(BCD, 58控制项)评估连续性计划。',
  },

  // ─── C 类：MITRE+SCF 分析 ──────────────────────
  'threat-model': {
    systemPrompt: '你是威胁建模专家，基于 MITRE ATT&CK 和 STRIDE 方法论分析系统威胁，提供缓解措施建议。',
  },
  'global-situation': {
    systemPrompt: '你是 CISO 的态势感知分析师，基于 SCF 34域和 MITRE ATT&CK 聚合全域安全态势。',
  },
  'report-gen': {
    systemPrompt: '你是安全报告生成专家，将安全评估数据自动生成为专业分析报告。',
  },
  'ai-dispatch': {
    systemPrompt: '你是 AI 安全调度引擎，智能分析安全事件并路由到合适的角色和工具。',
  },

  // ─── A 类：API 适配接入 ────────────────────────
  'alert-queue': {
    systemPrompt: '你是 SOC 分析师，对导入的告警数据进行 MITRE ATT&CK 分类，评估优先级并提供处置建议。',
  },
  'vuln-scan': {
    systemPrompt: '你是漏洞管理专家，基于 SCF 漏洞管理域(VPM)评估漏洞风险等级和修复优先级。',
  },
  'soar-exec': {
    systemPrompt: '你是 SOAR 编排专家，基于 MITRE ATT&CK COA 生成自动化响应剧本。',
  },
  'threat-intel': {
    systemPrompt: '你是威胁情报分析师，基于 MITRE ATT&CK 技术库关联分析 IOC 和威胁指标。',
  },
  'pen-test': {
    systemPrompt: '你是渗透测试专家，基于 MITRE ATT&CK 技术分析测试结果并提供修复建议。',
  },
  'incident-mgmt': {
    systemPrompt: '你是事件响应专家，基于 MITRE ATT&CK 和 SCF 事件响应域(IRO)提供事件处置建议。',
  },
  'log-analysis': {
    systemPrompt: '你是日志分析专家，基于 MITRE 检测策略(691)识别日志中的异常行为模式。',
  },
  'sbom-scan': {
    systemPrompt: '你是供应链安全专家，基于 SCF 第三方管理域(TPM)评估软件组件风险。',
  },
};

// ─── Role perspective formatters ────────────────────

const ROLE_PERSPECTIVES: Record<string, string> = {
  'ciso': '从 CISO 视角：关注全局风险、合规状态、董事会汇报要点',
  'secuclaw-commander': '从安全指挥官视角：关注事件协调、资源调度、应急响应',
  'privacy-officer': '从隐私官视角：关注数据隐私合规、DPIA、跨境传输',
  'business-security-officer': '从业务安全视角：关注业务连续性、供应链风险、安全投入 ROI',
  'security-ops': '从安全运营视角：关注告警处置、事件响应、日志分析',
  'security-expert': '从安全专家视角：关注漏洞评估、威胁分析、渗透测试',
  'security-architect': '从安全架构视角：关注零信任架构、威胁建模、安全设计',
  'supply-chain-security': '从供应链安全视角：关注第三方风险、SBOM 管理、供应商评估',
};

// ─── Engine ─────────────────────────────────────────

class AiAnalysisEngine {
  private _backendUrl = '';
  private _apiKey = '';
  private _model = 'glm-4';

  /**
   * 配置 AI 后端
   */
  configure(config: { backendUrl?: string; apiKey?: string; model?: string }): void {
    if (config.backendUrl) this._backendUrl = config.backendUrl;
    if (config.apiKey) this._apiKey = config.apiKey;
    if (config.model) this._model = config.model;
  }

  /**
   * 执行 AI 分析
   */
  async analyze(request: AiAnalysisRequest): Promise<AiAnalysisResult> {
    const template = TOOL_TEMPLATES[request.toolId] ?? {};
    const rolePerspective = ROLE_PERSPECTIVES[request.role] ?? '';
    const roleTheme = ROLE_THEMES[request.role];

    // 1. 构建 prompt
    const systemPrompt = this._buildSystemPrompt(template, rolePerspective, request.role);
    const userPrompt = this._buildUserPrompt(request, template);

    // 2. 尝试调用 MiniMax AI 后端
    const backendUrl = this._backendUrl || AI_BACKEND_URL;
    const apiKey = this._apiKey || AI_API_KEY;
    const model = this._model || AI_MODEL;

    if (backendUrl) {
      try {
        return await this._callBackend(backendUrl, apiKey, model, systemPrompt, userPrompt, request);
      } catch (e) {
        console.warn('[AI Engine] Backend failed, using local analysis:', e);
      }
    }

    // 3. Fallback: 本地规则引擎分析（基于 SCF/MITRE 数据）
    return this._localAnalysis(request, template, rolePerspective);
  }

  /**
   * 构建分析 prompt（供外部 AI 调用）
   */
  buildPrompt(request: AiAnalysisRequest): { system: string; user: string } {
    const template = TOOL_TEMPLATES[request.toolId] ?? {};
    const rolePerspective = ROLE_PERSPECTIVES[request.role] ?? '';
    return {
      system: this._buildSystemPrompt(template, rolePerspective, request.role),
      user: this._buildUserPrompt(request, template),
    };
  }

  // ─── Private: Prompt Construction ────────────────

  private _buildSystemPrompt(template: Partial<ToolAnalysisTemplate>, rolePerspective: string, roleId?: string): string {
    const parts = [
      template.systemPrompt ?? '你是安全分析专家。',
      '',
      '## 角色安全能力',
      ROLE_SECURITY_SKILLS[roleId ?? ''] ?? '',
      '',
      rolePerspective,
      '',
      '请按以下格式输出分析结果：',
      '1. 【风险等级】critical/high/medium/low/info',
      '2. 【摘要】一句话概括',
      '3. 【分析】详细分析（300-500字）',
      '4. 【建议】3-5条具体建议',
      '5. 【行动项】优先级+行动+负责人+时限',
      '6. 【汇报要点】可用于向上汇报的2-3句话摘要',
    ];
    return parts.join('\n');
  }

  private _buildUserPrompt(request: AiAnalysisRequest, template: Partial<ToolAnalysisTemplate>): string {
    const parts: string[] = [];

    // Input data
    parts.push('## 输入数据');
    parts.push(JSON.stringify(request.inputData, null, 2));

    // SCF context
    if (request.scfContext?.length) {
      parts.push('\n## SCF 控制项上下文');
      for (const c of request.scfContext.slice(0, 10)) {
        parts.push(`- ${c.controlId} (${c.domain}): ${c.name}`);
        if (c.description) parts.push(`  说明: ${c.description.substring(0, 100)}`);
      }
      if (request.scfContext.length > 10) {
        parts.push(`...共 ${request.scfContext.length} 个控制项`);
      }
    }

    // MITRE context
    if (request.mitreContext?.length) {
      parts.push('\n## MITRE ATT&CK 上下文');
      for (const t of request.mitreContext.slice(0, 10)) {
        parts.push(`- ${t.techniqueId} [${t.tactic}]: ${t.name}`);
        if (t.detection?.length) parts.push(`  检测: ${t.detection.slice(0, 2).join(', ')}`);
        if (t.mitigations?.length) parts.push(`  缓解: ${t.mitigations.slice(0, 2).join(', ')}`);
      }
    }

    if (request.customPrompt) {
      parts.push(`\n## 额外要求\n${request.customPrompt}`);
    }

    return parts.join('\n');
  }

  // ─── Private: Backend Call ───────────────────────

  private async _callBackend(backendUrl: string, apiKey: string, model: string, systemPrompt: string, userPrompt: string, request: AiAnalysisRequest): Promise<AiAnalysisResult> {
    const resp = await fetch(`${backendUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!resp.ok) throw new Error(`AI backend ${resp.status}`);

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    return this._parseAiResponse(content, request);
  }

  // ─── Private: Local Rule-Based Analysis ──────────

  private _localAnalysis(request: AiAnalysisRequest, template: Partial<ToolAnalysisTemplate>, rolePerspective: string): AiAnalysisResult {
    const { toolId, inputData, scfContext, mitreContext } = request;

    // Risk level from input data
    const riskLevel = this._assessRiskLevel(toolId, inputData);

    // Generate domain-specific analysis
    const analysis = this._generateLocalAnalysis(toolId, inputData, scfContext, mitreContext);

    // Recommendations based on SCF/MITRE data
    const recommendations = this._generateRecommendations(toolId, inputData, scfContext, mitreContext);

    // Action items
    const actionItems = this._generateActionItems(toolId, riskLevel, recommendations);

    // Board summary
    const boardSummary = this._generateBoardSummary(toolId, riskLevel, analysis, rolePerspective);

    return {
      summary: analysis.substring(0, 80),
      riskLevel,
      analysis,
      recommendations,
      actionItems,
      boardSummary,
      dataEnrichment: {
        scfControlsMatched: scfContext?.length ?? 0,
        mitreTechniquesMatched: mitreContext?.length ?? 0,
        coverageScore: this._calculateCoverage(scfContext, mitreContext),
      },
    };
  }

  // ─── Risk Assessment ─────────────────────────────

  private _assessRiskLevel(toolId: string, data: Record<string, unknown>): RiskLevel {
    // Check summary object first (from mock/real execution results)
    const summary = data.summary as Record<string, unknown> ?? {};
    const summaryScore = typeof summary.overallScore === 'number' ? summary.overallScore : 0;

    // Check for explicit severity/risk fields
    const severity = (data.severity as string ?? '') || (summary.riskLevel as string ?? '');
    const cvss = typeof data.cvss === 'number' ? data.cvss : 0;
    const score = typeof data.score === 'number' ? data.score : summaryScore;
    const complianceRate = typeof data.complianceRate === 'number' ? data.complianceRate : 100;

    if (severity === 'P1' || severity === 'critical' || cvss >= 9) return 'critical';
    if (severity === 'P2' || severity === 'high' || cvss >= 7) return 'high';
    if (complianceRate < 40 || score < 40) return 'critical';
    if (complianceRate < 60 || score < 60) return 'high';
    if (complianceRate < 80 || score < 75) return 'medium';
    return 'low';
  }

  // ─── Local Analysis Generation ───────────────────

  private _generateLocalAnalysis(
    toolId: string,
    data: Record<string, unknown>,
    scf?: ScfContext[],
    mitre?: MitreContext[],
  ): string {
    const scfCount = scf?.length ?? 0;
    const mitreCount = mitre?.length ?? 0;
    const summary = (data.summary ?? {}) as Record<string, unknown>;
    const summaryStr = Object.entries(summary)
      .filter(([k]) => k !== 'source')
      .map(([k, v]) => `${k}: ${v}`)
      .join('、');

    const parts: string[] = [];

    switch (toolId) {
      case 'gdpr-audit':
      case 'compliance-chk': {
        const rate = typeof data.complianceRate === 'number' ? data.complianceRate : (typeof summary.compliance === 'string' ? parseInt(summary.compliance) : 0);
        const gaps = data.gaps as unknown[] ?? [];
        parts.push(`基于 SCF ${scfCount} 个控制项的评估结果：合规率 ${rate}%。`);
        if (gaps.length > 0) parts.push(`发现 ${gaps.length} 项合规差距需要整改。`);
        parts.push(`参考标准：GDPR Art.5/28/35、PIPL Art.14/51、SCF PRI 域。`);
        break;
      }
      case 'risk-score': {
        const score = summary.overall ?? 'N/A';
        const coverage = summary.scfCoverage ?? 'N/A';
        const mitreCov = summary.mitreCoverage ?? 'N/A';
        const highRisk = summary.highRisk ?? 0;
        const domains = summary.domains ?? 0;
        parts.push(`基于 SCF ${domains} 域四维风险评估：综合得分 ${score}，SCF 覆盖 ${coverage}，MITRE 覆盖 ${mitreCov}。`);
        if (highRisk > 0) parts.push(`发现 ${highRisk} 个高风险域需重点关注。`);
        break;
      }
      case 'threat-model': {
        parts.push(`基于 MITRE ATT&CK ${mitreCount} 个技术和 STRIDE 模型的威胁分析。`);
        if (mitre?.length) {
          const tactics = [...new Set(mitre.map(m => m.tactic))];
          parts.push(`涉及 ${tactics.length} 个战术阶段：${tactics.join('、')}。`);
        }
        break;
      }
      case 'alert-queue':
      case 'incident-mgmt': {
        const count = typeof data.count === 'number' ? data.count : (data.alerts as unknown[])?.length ?? (data.rows as unknown[])?.length ?? 0;
        const total = summary.total ?? count;
        parts.push(`当前 ${total} 条告警/事件，基于 MITRE ${mitreCount} 个检测策略分类。`);
        break;
      }
      default: {
        if (summaryStr) {
          parts.push(`数据概览：${summaryStr}。`);
        }
        if (scfCount > 0 || mitreCount > 0) {
          parts.push(`补充：SCF ${scfCount} 个控制项和 MITRE ${mitreCount} 个技术的综合分析。`);
        }
      }
    }

    // Add generic analysis based on data
    const dataKeys = Object.keys(data);
    if (dataKeys.includes('rows')) {
      const rows = data.rows as unknown[];
      parts.push(`共分析 ${rows?.length ?? 0} 条数据记录。`);
    }

    return parts.join('\n');
  }

  // ─── Recommendations ─────────────────────────────

  private _generateRecommendations(
    toolId: string,
    data: Record<string, unknown>,
    scf?: ScfContext[],
    mitre?: MitreContext[],
  ): string[] {
    const recs: string[] = [];

    // SCF-based recommendations
    if (scf?.length) {
      const criticalDomains = this._findCriticalDomains(scf);
      for (const d of criticalDomains.slice(0, 2)) {
        recs.push(`优先加强 ${d} 域的安全控制（参考 SCF 控制项）`);
      }
    }

    // MITRE-based recommendations
    if (mitre?.length) {
      const topTactics = this._findTopTactics(mitre);
      for (const t of topTactics.slice(0, 2)) {
        recs.push(`重点防御 ${t} 阶段的攻击技术`);
      }
    }

    // Tool-specific recommendations
    switch (toolId) {
      case 'gdpr-audit':
        recs.push('完成 DPIA 数据保护影响评估并记录处理活动');
        recs.push('建立跨境数据传输机制（SCC 标准合同条款）');
        break;
      case 'risk-score':
        recs.push('对高风险域制定风险处置计划并设定缓解时限');
        recs.push('建立风险定期评估机制（季度/年度）');
        break;
      case 'zero-trust':
        recs.push('实施最小权限原则和持续验证机制');
        recs.push('部署微分段网络架构');
        break;
      case 'vendor-eval':
        recs.push('建立供应商安全评估准入流程');
        recs.push('对二级供应商实施安全延伸审计');
        break;
    }

    return recs.length > 0 ? recs : ['建议持续监控和定期评估'];
  }

  private _generateActionItems(toolId: string, riskLevel: RiskLevel, recs: string[]): ActionItem[] {
    const priorityMap: Record<RiskLevel, ActionItem['priority']> = {
      critical: 'P1', high: 'P2', medium: 'P3', low: 'P4', info: 'P4',
    };

    return recs.slice(0, 5).map((rec, i) => ({
      priority: i === 0 ? priorityMap[riskLevel] : 'P3',
      action: rec,
      owner: '待分配',
      deadline: riskLevel === 'critical' ? '48h 内' : riskLevel === 'high' ? '1 周内' : '1 月内',
    }));
  }

  private _generateBoardSummary(toolId: string, riskLevel: RiskLevel, analysis: string, perspective: string): string {
    const levelLabel = { critical: '严重', high: '高危', medium: '中等', low: '低', info: '信息' };
    return `${perspective ? perspective.split('：')[0] + '：' : ''}当前风险等级[${levelLabel[riskLevel]}] — ${analysis.substring(0, 100)}`;
  }

  // ─── Helpers ─────────────────────────────────────

  private _parseAiResponse(content: string, request: AiAnalysisRequest): AiAnalysisResult {
    // Parse structured AI response
    const riskMatch = content.match(/【风险等级】\s*(\S+)/);
    const summaryMatch = content.match(/【摘要】\s*(.+)/);
    const analysisMatch = content.match(/【分析】\s*([\s\S]+?)(?=【|$)/);
    const recsMatch = content.match(/【建议】\s*([\s\S]+?)(?=【|$)/);
    const boardMatch = content.match(/【汇报要点】\s*([\s\S]+?)(?=【|$)/);

    const riskLevel = (riskMatch?.[1]?.toLowerCase() ?? 'medium') as RiskLevel;

    return {
      summary: summaryMatch?.[1]?.trim() ?? content.substring(0, 80),
      riskLevel,
      analysis: analysisMatch?.[1]?.trim() ?? content,
      recommendations: recsMatch?.[1]?.split(/\n/).filter(l => l.trim()).map(l => l.replace(/^[-*]\s*/, '')) ?? [],
      actionItems: [],
      boardSummary: boardMatch?.[1]?.trim() ?? '',
      dataEnrichment: {
        scfControlsMatched: request.scfContext?.length ?? 0,
        mitreTechniquesMatched: request.mitreContext?.length ?? 0,
        coverageScore: this._calculateCoverage(request.scfContext, request.mitreContext),
      },
    };
  }

  private _calculateCoverage(scf?: ScfContext[], mitre?: MitreContext[]): number {
    const scfScore = scf?.length ? Math.min(scf.length * 2, 50) : 0;
    const mitreScore = mitre?.length ? Math.min(mitre.length * 2, 50) : 0;
    return Math.min(scfScore + mitreScore, 100);
  }

  private _findCriticalDomains(scf: ScfContext[]): string[] {
    const domainCount = new Map<string, number>();
    for (const c of scf) {
      domainCount.set(c.domain, (domainCount.get(c.domain) ?? 0) + 1);
    }
    return [...domainCount.entries()].sort((a, b) => b[1] - a[1]).map(([d]) => d);
  }

  private _findTopTactics(mitre: MitreContext[]): string[] {
    const tacticCount = new Map<string, number>();
    for (const t of mitre) {
      tacticCount.set(t.tactic, (tacticCount.get(t.tactic) ?? 0) + 1);
    }
    return [...tacticCount.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }
}

// Singleton
export const aiAnalysisEngine = new AiAnalysisEngine();
