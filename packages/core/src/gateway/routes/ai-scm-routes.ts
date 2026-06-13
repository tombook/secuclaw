import { McpRiskScorer } from '../../ai-scm/mcp-risk-scorer.js';
import { PromptInjectionGuard } from '../../ai-scm/prompt-injection-guard.js';
import { AgentBehaviorAuditService } from '../../ai-scm/agent-behavior-audit.js';
import type { RouterDeps } from '../router.js';
import type { JsonStore } from '../../storage/json-store.js';

export function registerAiScmRoutes(handlers: Map<string, Function>, deps: RouterDeps): void {
  const store: any = (deps as any).jsonStore ?? (deps as any).store;
  const mcp = new McpRiskScorer(store);
  const guard = new PromptInjectionGuard(store);
  const audit = new AgentBehaviorAuditService(store);

  handlers.set('ai-scm.mcp.tool.register', async (params: Record<string, unknown>) => {
    const tool = params.tool as any;
    return mcp.registerTool(tool);
  });

  handlers.set('ai-scm.mcp.tool.update', async (params: Record<string, unknown>) => {
    const toolId = params.toolId as string;
    const updates = params.updates as any;
    return mcp.updateTool(toolId, updates);
  });

  handlers.set('ai-scm.mcp.tool.get', async (params: Record<string, unknown>) => {
    const toolId = params.toolId as string;
    return mcp.getTool(toolId);
  });

  handlers.set('ai-scm.mcp.tool.list', async (params: Record<string, unknown>) => {
    const filters: { category?: any; status?: any; riskLevel?: any } = {};
    if (params.category) filters.category = params.category;
    if (params.status) filters.status = params.status;
    if (params.riskLevel) filters.riskLevel = params.riskLevel;
    return mcp.listTools(filters);
  });

  handlers.set('ai-scm.mcp.tool.disable', async (params: Record<string, unknown>) => {
    const toolId = params.toolId as string;
    const reason = params.reason as string;
    const success = await mcp.disableTool(toolId, reason);
    return { success };
  });

  handlers.set('ai-scm.mcp.tool.quarantine', async (params: Record<string, unknown>) => {
    const toolId = params.toolId as string;
    const reason = params.reason as string;
    const success = await mcp.quarantineTool(toolId, reason);
    return { success };
  });

  handlers.set('ai-scm.mcp.tool.evaluate', async (params: Record<string, unknown>) => {
    const toolId = params.toolId as string;
    const input = (params.input ?? {}) as Record<string, any>;
    return mcp.evaluateInvocation(toolId, input);
  });

  handlers.set('ai-scm.mcp.tool.evaluate-all', async () => {
    return mcp.evaluateAllTools();
  });

  handlers.set('ai-scm.mcp.tool.high-risk', async () => {
    return mcp.getHighRiskTools();
  });

  handlers.set('ai-scm.mcp.tool.record-usage', async (params: Record<string, unknown>) => {
    const toolId = params.toolId as string;
    await mcp.recordUsage(toolId);
    return { success: true };
  });

  handlers.set('ai-scm.mcp.tool.stats', async () => {
    return mcp.getStats();
  });

  handlers.set('ai-scm.mcp.whitelist.create', async (params: Record<string, unknown>) => {
    const whitelist = params.whitelist as any;
    return mcp.createWhitelist(whitelist);
  });

  handlers.set('ai-scm.mcp.whitelist.list', async (params: Record<string, unknown>) => {
    const roleId = params.roleId as string | undefined;
    return mcp.listWhitelists(roleId);
  });

  handlers.set('ai-scm.mcp.whitelist.delete', async (params: Record<string, unknown>) => {
    const whitelistId = params.whitelistId as string;
    const success = await mcp.deleteWhitelist(whitelistId);
    return { success };
  });

  handlers.set('ai-scm.mcp.whitelist.is-allowed', async (params: Record<string, unknown>) => {
    const toolId = params.toolId as string;
    const roleId = params.roleId as string;
    const allowed = await mcp.isToolAllowed(toolId, roleId);
    return { allowed };
  });

  handlers.set('ai-scm.guard.scan', async (params: Record<string, unknown>) => {
    const input = params.input as any;
    return guard.scan(input);
  });

  handlers.set('ai-scm.guard.scan-batch', async (params: Record<string, unknown>) => {
    const inputs = (params.inputs ?? []) as any[];
    return guard.scanBatch(inputs);
  });

  handlers.set('ai-scm.guard.history', async (params: Record<string, unknown>) => {
    const filters: { sessionId?: string; agentId?: string; severity?: any; since?: number; limit?: number } = {};
    if (params.sessionId) filters.sessionId = params.sessionId as string;
    if (params.agentId) filters.agentId = params.agentId as string;
    if (params.severity) filters.severity = params.severity;
    if (typeof params.since === 'number') filters.since = params.since;
    if (typeof params.limit === 'number') filters.limit = params.limit;
    return guard.getScanHistory(filters);
  });

  handlers.set('ai-scm.guard.rule.add', async (params: Record<string, unknown>) => {
    const rule = params.rule as any;
    return guard.addCustomRule(rule);
  });

  handlers.set('ai-scm.guard.rule.list', async () => {
    return guard.listRules();
  });

  handlers.set('ai-scm.guard.rule.remove', async (params: Record<string, unknown>) => {
    const ruleId = params.ruleId as string;
    const success = await guard.removeRule(ruleId);
    return { success };
  });

  handlers.set('ai-scm.guard.sanitization.add', async (params: Record<string, unknown>) => {
    const rule = params.rule as any;
    return guard.addSanitizationRule(rule);
  });

  handlers.set('ai-scm.guard.sanitization.list', async () => {
    return guard.listSanitizationRules();
  });

  handlers.set('ai-scm.guard.stats', async (params: Record<string, unknown>) => {
    const since = typeof params.since === 'number' ? (params.since as number) : undefined;
    return guard.getStats(since);
  });

  handlers.set('ai-scm.audit.action.record', async (params: Record<string, unknown>) => {
    const action = params.action as any;
    return audit.recordAction(action);
  });

  handlers.set('ai-scm.audit.action.record-batch', async (params: Record<string, unknown>) => {
    const actions = (params.actions ?? []) as any[];
    return audit.recordBatch(actions);
  });

  handlers.set('ai-scm.audit.action.get', async (params: Record<string, unknown>) => {
    const actionId = params.actionId as string;
    return audit.getAction(actionId);
  });

  handlers.set('ai-scm.audit.action.list', async (params: Record<string, unknown>) => {
    const filters: { agentId?: string; sessionId?: string; actionType?: any; riskClassification?: any; since?: number; limit?: number } = {};
    if (params.agentId) filters.agentId = params.agentId as string;
    if (params.sessionId) filters.sessionId = params.sessionId as string;
    if (params.actionType) filters.actionType = params.actionType;
    if (params.riskClassification) filters.riskClassification = params.riskClassification;
    if (typeof params.since === 'number') filters.since = params.since;
    if (typeof params.limit === 'number') filters.limit = params.limit;
    return audit.listActions(filters);
  });

  handlers.set('ai-scm.audit.baseline.build', async (params: Record<string, unknown>) => {
    const agentId = params.agentId as string;
    const timeRange = params.timeRange as { start: number; end: number } | undefined;
    return audit.buildBaseline(agentId, timeRange);
  });

  handlers.set('ai-scm.audit.baseline.get', async (params: Record<string, unknown>) => {
    const agentId = params.agentId as string;
    return audit.getBaseline(agentId);
  });

  handlers.set('ai-scm.audit.baseline.list', async () => {
    return audit.listBaselines();
  });

  handlers.set('ai-scm.audit.anomalies', async (params: Record<string, unknown>) => {
    const filters: { agentId?: string; severity?: any; since?: number; limit?: number } = {};
    if (params.agentId) filters.agentId = params.agentId as string;
    if (params.severity) filters.severity = params.severity;
    if (typeof params.since === 'number') filters.since = params.since;
    if (typeof params.limit === 'number') filters.limit = params.limit;
    return audit.getAnomalies(filters);
  });

  handlers.set('ai-scm.audit.summary', async (params: Record<string, unknown>) => {
    const agentId = params.agentId as string;
    const timeRange = params.timeRange as { start: number; end: number };
    return audit.getBehaviorSummary(agentId, timeRange);
  });

  handlers.set('ai-scm.audit.exfiltration', async () => {
    return audit.detectDataExfiltration();
  });

  handlers.set('ai-scm.audit.loops', async () => {
    return audit.detectLoopBehavior();
  });

  handlers.set('ai-scm.audit.cost-anomaly', async () => {
    return audit.detectCostAnomaly();
  });

  handlers.set('ai-scm.audit.stats', async () => {
    return audit.getStats();
  });
}
