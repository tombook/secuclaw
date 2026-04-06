import type { RouterDeps } from '../router.js';
import { toolRegistry, type ToolTask } from '../../scanner/scanner-adapter.js';
import { getToolTaskService, initToolTaskService } from '../../capabilities/tool-task-service.js';

export function registerToolRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  initToolTaskService(deps.jsonStore);
  const toolTaskService = getToolTaskService();

  handlers.set('tools.list', async () => {
    const availableTools = await toolRegistry.listAvailable();
    return { data: availableTools.map(tool => ({
      id: tool.id,
      name: tool.name,
      version: tool.version,
      type: tool.type,
      isAvailable: true,
    })) };
  });

  handlers.set('tools.createTask', async (params) => {
    const { toolId, target, config } = params;
    if (!toolId || !target) throw new Error('toolId and target required');
    const task = await toolTaskService.createTask(toolId as string, target as string, config as Record<string, unknown> | undefined);
    return task;
  });

  handlers.set('tools.getTask', async (params) => {
    const { taskId } = params;
    if (!taskId) throw new Error('taskId required');
    return toolTaskService.getTask(taskId as string);
  });

  handlers.set('tools.listTasks', async (params) => {
    const tasks = await toolTaskService.listTasks({
      toolId: params.toolId as string | undefined,
      status: params.status as ToolTask['status'] | undefined,
      limit: params.limit ? Number(params.limit) : undefined,
      offset: params.offset ? Number(params.offset) : undefined,
    });
    return { data: tasks };
  });

  handlers.set('tools.cancelTask', async (params) => {
    const { taskId } = params;
    if (!taskId) throw new Error('taskId required');
    return toolTaskService.cancelTask(taskId as string);
  });

  handlers.set('tools.getFindings', async (params) => {
    const { taskId } = params;
    if (!taskId) throw new Error('taskId required');
    const findings = await toolTaskService.getTaskFindings(taskId as string);
    return { data: findings };
  });
}
