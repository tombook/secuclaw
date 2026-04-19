/**
 * 真实工具执行器 — 替代 mock，基于三大引擎的真正可用的工具
 *
 * A 类（API 适配）: 连接外部工具 API，导入数据后 AI 分析
 * B 类（SCF 问卷）: 基于 SCF 控制项生成问卷，用户填写后 AI 评估
 * C 类（MITRE 分析）: 基于 ATT&CK 数据的威胁分析和检测覆盖率评估
 */

import type { RoleId } from '../config/role-theme-config';
import type { StandardToolResult, ToolPluginManifest } from './types';
import { scfQuestionnaireEngine, aiAnalysisEngine, mitreAnalysisEngine } from './engines/index';
import type { AssessmentResult, ScfQuestion, AssessmentAnswer, ScfContext, MitreContext } from './engines/index';
import { pluginStore } from './plugin-store';
import { MOCK_RESPONSES } from './mock-responses';

// ─── Tool Categories ────────────────────────────────

type ToolCategory = 'api-adapter' | 'scf-questionnaire' | 'mitre-analysis';

interface ToolExecutor {
  category: ToolCategory;
  execute(manifest: ToolPluginManifest, params: Record<string, unknown>, roleId: RoleId): Promise<StandardToolResult>;
}

// ─── B 类：SCF 问卷评估工具 ────────────────────────

// SCF questionnaire tools - all upgraded to composite, now use API/mock path
// Keep this for any future SCF-only tools
const SCF_TOOL_DOMAINS: Record<string, { domains: string[]; mode: 'assessment' | 'audit' | 'gap-analysis' | 'maturity'; scoring: 'binary' | 'likert-5' | 'compliance-4' }> = {
};

// ─── A 类：API 适配工具 ────────────────────────────

const API_TOOL_CONFIGS: Record<string, { defaultEndpoint: string; description: string }> = {
  // Original API tools
  'alert-queue':   { defaultEndpoint: '/api/v1/alerts', description: '导入告警数据，AI 分类分析' },
  'vuln-scan':     { defaultEndpoint: '/api/v1/vulns', description: '导入漏洞数据，AI 风险评估' },
  'soar-exec':     { defaultEndpoint: '/api/v1/soar/playbooks', description: 'AI 生成响应剧本' },
  'threat-intel':  { defaultEndpoint: '/api/v1/threat-intel', description: '查询威胁情报，AI 关联分析' },
  'pen-test':      { defaultEndpoint: '/api/v1/pentest/results', description: '导入测试结果，AI 解读' },
  'incident-mgmt': { defaultEndpoint: '/api/v1/incidents', description: '导入事件数据，AI 响应建议' },
  'log-analysis':  { defaultEndpoint: '/api/v1/logs', description: '导入日志数据，AI 异常识别' },
  'sbom-scan':     { defaultEndpoint: '/api/v1/sbom', description: '导入 SBOM，AI 组件风险评估' },
  'risk-score':    { defaultEndpoint: '/api/v1/risk/score', description: '风险评分综合分析' },
  'threat-model':  { defaultEndpoint: '/api/v1/threat-model/stride', description: 'STRIDE 威胁建模 + MITRE 映射' },
  // Upgraded from SCF to composite (API + mock path)
  'compliance-chk': { defaultEndpoint: '/api/v1/compliance/check', description: '合规检查分析' },
  'gdpr-audit':     { defaultEndpoint: '/api/v1/gdpr/audit', description: 'GDPR 合规审计' },
  'bcp-mgmt':       { defaultEndpoint: '/api/v1/bcp/drill', description: 'BCP 灾备演练分析' },
  'zero-trust':     { defaultEndpoint: '/api/v1/zero-trust/eval', description: '零信任成熟度评估' },
  'vendor-eval':    { defaultEndpoint: '/api/v1/vendor/eval', description: '供应商评估' },
  'board-report':   { defaultEndpoint: '/api/v1/report/generate', description: '董事会报告生成' },
  'kpi-track':      { defaultEndpoint: '/api/v1/kpi/track', description: 'KPI 追踪分析' },
  'global-situation': { defaultEndpoint: '/api/v1/situation', description: '全域安全态势' },
  'report-gen':     { defaultEndpoint: '/api/v1/report/gen', description: '报表生成' },
  'ai-dispatch':    { defaultEndpoint: '/api/v1/ai/dispatch', description: 'AI 调度分析' },
  // v3 新增工具
  'risk-register':  { defaultEndpoint: '/api/v1/risk/register', description: '风险登记册' },
  'budget-dash':    { defaultEndpoint: '/api/v1/budget/dash', description: '预算仪表盘' },
  'policy-mgmt':    { defaultEndpoint: '/api/v1/policy/mgmt', description: '策略管理' },
  'data-map':       { defaultEndpoint: '/api/v1/data/map', description: '数据地图' },
  'cost-calc':      { defaultEndpoint: '/api/v1/cost/calc', description: '成本计算' },
  'patch-mgmt':     { defaultEndpoint: '/api/v1/patch/mgmt', description: '补丁管理' },
  'iam-config':     { defaultEndpoint: '/api/v1/iam/config', description: 'IAM 配置审计' },
  'cloud-security': { defaultEndpoint: '/api/v1/cloud/security', description: '云安全评估' },
  'contract-review': { defaultEndpoint: '/api/v1/contract/review', description: '合同审查' },
  'third-party-risk': { defaultEndpoint: '/api/v1/thirdparty/risk', description: '第三方风险评估' },
};

// ─── Main Execution Function ────────────────────────

/**
 * 真实工具执行 — 替代 mock
 */
export async function executeRealTool(
  manifest: ToolPluginManifest,
  formValues: Record<string, unknown>,
  roleId: RoleId,
): Promise<StandardToolResult> {
  const toolId = manifest.meta.id;

  // Ensure engines are loaded
  await Promise.all([
    scfQuestionnaireEngine.load(),
    mitreAnalysisEngine.load(),
  ]);

  // Determine category
  if (SCF_TOOL_DOMAINS[toolId]) {
    return executeScfTool(toolId, formValues, roleId);
  }

  if (API_TOOL_CONFIGS[toolId]) {
    return executeApiTool(toolId, formValues, roleId, manifest);
  }

  // C 类: MITRE+SCF 分析
  return executeAnalysisTool(toolId, formValues, roleId);
}

// ─── B 类：SCF 问卷工具执行 ─────────────────────────

async function executeScfTool(
  toolId: string,
  params: Record<string, unknown>,
  roleId: RoleId,
): Promise<StandardToolResult> {
  const config = SCF_TOOL_DOMAINS[toolId];
  if (!config) return errorResult(toolId, '未找到 SCF 域配置');

  // 1. Generate questionnaire
  const questions = scfQuestionnaireEngine.generateQuestionnaire({
    domainCodes: config.domains,
    mode: config.mode,
    includeMappings: true,
    scoringModel: config.scoring,
    maxQuestions: typeof params.maxQuestions === 'number' ? params.maxQuestions : undefined,
  });

  // 2. Build SCF context for AI
  const scfContext: ScfContext[] = questions.slice(0, 20).map(q => ({
    controlId: q.id,
    domain: q.domain,
    name: q.text.substring(0, 60),
    description: q.description.substring(0, 100),
    mappings: q.mappings.slice(0, 3).map(m => ({ framework: m.framework, controlId: m.controlId })),
  }));

  // 3. If user provided answers, assess; otherwise return questionnaire
  const userAnswers = params.answers as Record<string, string> | undefined;

  if (userAnswers && Object.keys(userAnswers).length > 0) {
    // User submitted answers → assess
    const answers: AssessmentAnswer[] = Object.entries(userAnswers).map(([qId, value]) => {
      const q = questions.find(q => q.id === qId);
      const option = q?.options.find(o => o.value === value);
      return {
        questionId: qId,
        value: value as string,
        score: option?.score ?? 0,
        timestamp: Date.now(),
      };
    });

    const assessment = scfQuestionnaireEngine.assess(questions, answers);

    // 4. AI analysis
    const aiResult = await aiAnalysisEngine.analyze({
      toolId,
      role: roleId,
      inputData: {
        totalQuestions: assessment.totalCount,
        answeredQuestions: assessment.answeredCount,
        overallScore: assessment.percentage,
        maturityLevel: assessment.maturityLevel,
        maturityLabel: assessment.maturityLabel,
        domainScores: Object.fromEntries(assessment.domainResults.map(d => [d.domainName, d.percentage])),
        gapCount: assessment.allGaps.length,
        criticalGaps: assessment.allGaps.filter(g => g.severity === 'critical').length,
      },
      scfContext,
    });

    // 5. Build result
    return {
      rows: assessment.domainResults.map(d => ({
        domain: d.domainName,
        total: d.totalQuestions,
        answered: d.answeredQuestions,
        score: `${d.percentage}%`,
        maturity: d.maturity,
        gaps: d.gaps.length,
        status: d.percentage >= 80 ? '达标' : d.percentage >= 60 ? '待改进' : '不达标',
      })),
      summary: {
        overallScore: assessment.percentage,
        maturity: `${assessment.maturityLevel} - ${assessment.maturityLabel}`,
        gapCount: assessment.allGaps.length,
        source: `SCF ${config.domains.join('+')} 域 (${questions.length} 控制项) + AI 分析`,
      },
      aiAnalysis: aiResult,
      questionnaire: { questions, assessment },
    };
  }

  // Return questionnaire for user to fill
  return {
    rows: questions.slice(0, 20).map(q => ({
      id: q.id,
      domain: q.domainName,
      question: q.text,
      options: q.options.map(o => o.label).join(' / '),
      mappings: q.mappings.map(m => `${m.framework}: ${m.controlId}`).join(', '),
    })),
    summary: {
      totalQuestions: questions.length,
      domains: config.domains.join(', '),
      mode: config.mode,
      source: `SCF ${config.domains.join('+')} 域 (${questions.length} 控制项)`,
    },
    _meta: { type: 'questionnaire', questions },
  };
}

// ─── A 类：API 适配工具执行 ─────────────────────────

async function executeApiTool(
  toolId: string,
  params: Record<string, unknown>,
  roleId: RoleId,
  manifest: ToolPluginManifest,
): Promise<StandardToolResult> {
  const apiConfig = API_TOOL_CONFIGS[toolId];

  // 1. Try real API
  let apiData: Record<string, unknown> | null = null;
  const endpoint = params.apiEndpoint as string ?? apiConfig.defaultEndpoint;

  try {
    // Check if backend is available
    const healthCheck = await fetch('/api/v1/health').catch(() => null);
    if (healthCheck?.ok) {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (resp.ok) {
        apiData = await resp.json();
      }
    }
  } catch {
    // API unavailable
  }

  // 2. If user provided raw data, use that
  const rawData = params.rawData ?? params.data ?? params.input ?? null;

  // 3. Build MITRE context for attack-related tools
  const mitreContext = await _buildMitreContext(toolId, params, apiData);

  // 4. AI analysis
  const aiInput = {
    ...params,
    ...(apiData ?? {}),
    rawDataProvided: !!rawData,
    apiAvailable: !!apiData,
  };

  const aiResult = await aiAnalysisEngine.analyze({
    toolId,
    role: roleId,
    inputData: aiInput,
    mitreContext,
  });

  // 5. Build result
  if (apiData) {
    // Unwrap mock-api-server envelope if present
    const actualRows = (apiData as any).data ?? (Array.isArray(apiData) ? apiData : [apiData]);
    const actualSummary = (apiData as any).summary ?? {};
    return {
      rows: Array.isArray(actualRows) ? actualRows.slice(0, 20) : [actualRows],
      summary: {
        ...actualSummary,
        source: actualSummary.source ?? `${toolId} API 实时数据`,
        apiConnected: true,
      },
      aiAnalysis: aiResult,
    };
  }

  if (rawData) {
    // Parse user-provided data
    const parsed = _parseRawData(rawData as string);
    return {
      rows: parsed,
      summary: {
        source: `用户导入数据 (${parsed.length} 条)`,
        apiConnected: false,
        aiAnalyzed: true,
      },
      aiAnalysis: aiResult,
    };
  }

  // Fallback: use mock data if available
  const mockFn = MOCK_RESPONSES[manifest.api?.mockFn as string];
  if (mockFn) {
    const mockData = mockFn() as Record<string, unknown>;
    // Re-run AI analysis with actual mock data for better insights
    let mockAiResult = aiResult;
    try {
      const mockSummary = (mockData as any).summary ?? {};
      mockAiResult = await aiAnalysisEngine.analyze({
        toolId,
        role: roleId,
        inputData: {
          toolId,
          rowCount: (mockData as any).rows?.length ?? 0,
          summary: mockSummary,
          ...((mockData as any).rows?.[0] ?? {}),
          apiAvailable: false,
          mockData: true,
        },
        mitreContext,
      });
    } catch (_) { /* keep original aiResult */ }
    return {
      ...(mockData as any),
      aiAnalysis: mockAiResult,
    };
  }

  // No data available — return connection guide
  return {
    rows: [],
    summary: {
      source: apiConfig.description,
      apiConnected: false,
      status: 'waiting_for_data',
    },
    _meta: {
      type: 'api-adapter',
      endpoint: apiConfig.defaultEndpoint,
      message: `请配置 ${toolId} API 连接，或直接粘贴数据`,
      configFields: [
        { name: 'apiEndpoint', label: 'API 地址', type: 'text', placeholder: apiConfig.defaultEndpoint },
        { name: 'apiKey', label: 'API Key', type: 'password' },
        { name: 'rawData', label: '或直接粘贴数据', type: 'textarea' },
      ],
    },
  };
}

// ─── C 类：MITRE+SCF 分析工具 ──────────────────────

async function executeAnalysisTool(
  toolId: string,
  params: Record<string, unknown>,
  roleId: RoleId,
): Promise<StandardToolResult> {
  switch (toolId) {
    case 'threat-model':
      return _executeThreatModel(params, roleId);
    case 'global-situation':
      return _executeGlobalSituation(params, roleId);
    case 'report-gen':
      return _executeReportGen(params, roleId);
    case 'ai-dispatch':
      return _executeAiDispatch(params, roleId);
    default:
      return errorResult(toolId, '未知分析工具');
  }
}

// ─── C 类具体实现 ───────────────────────────────────

async function _executeThreatModel(params: Record<string, unknown>, roleId: RoleId): Promise<StandardToolResult> {
  const systemName = (params.systemName as string) ?? (params.target as string) ?? '目标系统';
  const components = (params.components as string[]) ?? ['API 网关', '数据库', '前端应用'];
  const strideDimensions = (params.dimensions as string[]) ?? ['S', 'T', 'R', 'I', 'D', 'E'];

  const result = mitreAnalysisEngine.buildThreatModel({
    systemName,
    components,
    strideDimensions,
  });

  const aiResult = await aiAnalysisEngine.analyze({
    toolId: 'threat-model',
    role: roleId,
    inputData: { systemName, threatCount: result.threats.length, coverage: result.overallCoverage },
    mitreContext: result.threats.slice(0, 10).map(t => ({
      techniqueId: t.techniqueId,
      name: t.name,
      tactic: t.tactic,
      description: t.description,
      mitigations: t.mitigations,
      detection: t.detections,
    })),
  });

  return {
    rows: result.threats.map(t => ({
      threat: t.name,
      techniqueId: t.techniqueId,
      tactic: t.tactic,
      risk: t.riskLevel === 'critical' ? '严重' : t.riskLevel === 'high' ? '高' : '中',
      mitigations: t.mitigations.join('; '),
      detections: t.detections.join('; '),
    })),
    summary: {
      threats: result.threats.length,
      highRisk: result.threats.filter(t => t.riskLevel === 'high').length,
      coverage: result.overallCoverage,
      source: `MITRE ATT&CK + STRIDE 分析`,
    },
    aiAnalysis: aiResult,
  };
}

async function _executeGlobalSituation(params: Record<string, unknown>, roleId: RoleId): Promise<StandardToolResult> {
  // Aggregate from all assessments in store
  const state = pluginStore.getState();
  const allPlugins = state.getAll();

  const domainResults: Array<{ domain: string; score: number; status: string }> = [];

  for (const [id, plugin] of Object.entries(allPlugins)) {
    const result = state.getResult(id);
    if (result?.summary) {
      domainResults.push({
        domain: id,
        score: typeof result.summary.overallScore === 'number' ? result.summary.overallScore : 0,
        status: result.summary.source as string ?? '',
      });
    }
  }

  const mitreCoverage = mitreAnalysisEngine.assessDetectionCoverage();
  const scfOverview = scfQuestionnaireEngine.getDomainOverview();

  const aiResult = await aiAnalysisEngine.analyze({
    toolId: 'global-situation',
    role: roleId,
    inputData: {
      assessedTools: domainResults.length,
      avgScore: domainResults.length > 0 ? Math.round(domainResults.reduce((s, d) => s + d.score, 0) / domainResults.length) : 0,
      mitreCoverage: mitreCoverage.overall,
      scfDomains: scfOverview.length,
      gaps: mitreCoverage.gaps.length,
    },
  });

  return {
    rows: scfOverview.slice(0, 10).map(d => ({
      domain: d.name,
      controlCount: d.controlCount,
      assessed: domainResults.some(r => r.domain.includes(d.code)) ? '✓' : '-',
    })),
    summary: {
      totalDomains: scfOverview.length,
      totalControls: scfOverview.reduce((s, d) => s + d.controlCount, 0),
      mitreDetectionCoverage: mitreCoverage.overall,
      source: `SCF 34 域 + MITRE ATT&CK 全域态势`,
    },
    aiAnalysis: aiResult,
  };
}

async function _executeReportGen(params: Record<string, unknown>, roleId: RoleId): Promise<StandardToolResult> {
  const period = (params.period as string) ?? '季度';
  const state = pluginStore.getState();
  const allResults = Object.entries(state.getAll())
    .map(([id, plugin]) => ({ id, result: state.getResult(id) }))
    .filter(r => r.result);

  const aiResult = await aiAnalysisEngine.analyze({
    toolId: 'report-gen',
    role: roleId,
    inputData: {
      period,
      totalTools: allResults.length,
      toolsWithResults: allResults.filter(r => r.result).length,
    },
    customPrompt: `生成${period}安全态势报告，包含：1) 执行摘要 2) 风险评估 3) 合规状态 4) 关键发现 5) 改进建议`,
  });

  const reportContent = aiResult.analysis || `# ${period}安全态势报告\n\n基于 ${allResults.length} 个工具的评估结果生成。\n\n${aiResult.boardSummary || '暂无数据'}`;

  return {
    rows: [{ content: reportContent }],
    summary: {
      source: `SCF (33 域, 1451 控制项) + AI 自动生成`,
      period,
    },
    aiAnalysis: aiResult,
  };
}

async function _executeAiDispatch(params: Record<string, unknown>, roleId: RoleId): Promise<StandardToolResult> {
  const query = (params.query as string) ?? '';

  const aiResult = await aiAnalysisEngine.analyze({
    toolId: 'ai-dispatch',
    role: roleId,
    inputData: { query },
    customPrompt: `分析安全场景: "${query}"，建议: 1) 应使用哪个工具 2) 应由哪个角色负责 3) 风险等级 4) 建议的行动`,
  });

  return {
    rows: [{ content: aiResult.analysis ?? 'AI 分析中...' }],
    summary: {
      source: 'AI 智能分析引擎',
      query,
    },
    aiAnalysis: aiResult,
  };
}

// ─── Helpers ────────────────────────────────────────

async function _buildMitreContext(
  toolId: string,
  params: Record<string, unknown>,
  apiData: Record<string, unknown> | null,
): Promise<MitreContext[]> {
  const context: MitreContext[] = [];

  // For attack-related tools, try to match MITRE techniques
  if (['alert-queue', 'incident-mgmt', 'threat-intel', 'pen-test', 'log-analysis'].includes(toolId)) {
    const description = [
      params.query, params.target, params.input,
      apiData?.description, apiData?.type,
    ].filter(Boolean).join(' ');

    if (description) {
      const analysis = mitreAnalysisEngine.analyzeAttack({ description });
      context.push(...analysis.matchedTechniques.slice(0, 10).map(t => ({
        techniqueId: t.techniqueId,
        name: t.name,
        tactic: t.tactics[0] ?? '',
        description: t.description?.substring(0, 100) ?? '',
        mitigations: analysis.coursesOfAction.filter(c => c.techniques?.includes(t.techniqueId)).map(c => c.name).slice(0, 3),
        detection: analysis.detectionStrategies.filter(d => d.techniques?.includes(t.techniqueId)).map(d => d.name).slice(0, 3),
      })));
    }
  }

  return context;
}

function _parseRawData(raw: string): Record<string, unknown>[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    // Try line-by-line
    return raw.split('\n').filter(l => l.trim()).map(line => {
      try { return JSON.parse(line); } catch { return { raw: line }; }
    });
  }
}

function errorResult(toolId: string, message: string): StandardToolResult {
  return {
    rows: [],
    status: 'error',
    duration: 0,
    error: `[${toolId}] ${message}`,
  };
}
