import type { Router } from '../router.js';
import { CommanderService } from '../../commander/service.js';
import { CommanderRepository } from '../../commander/repository.js';

export function registerSkillsRoutes(router: Router): void {
  function getCommanderService(): CommanderService {
    const deps = router.getDeps();
    if (!deps.commanderService) {
      const repo = new CommanderRepository(deps.jsonStore);
      deps.commanderService = new CommanderService(repo);
    }
    return deps.commanderService;
  }

  router.registerHandler('skills.list', async () => {
    const loader = router.getDeps().skillLoader;
    if (!loader) throw new Error('Skill loader not available');
    return loader.getAll();
  });

  router.registerHandler('skills.get', async (params: Record<string, unknown>) => {
    const loader = router.getDeps().skillLoader;
    if (!loader) throw new Error('Skill loader not available');
    const { roleId } = params;
    if (!roleId || typeof roleId !== 'string') throw new Error('roleId is required');
    return loader.get(roleId);
  });

  router.registerHandler('skills.getStates', async (params: Record<string, unknown>) => {
    const { commanderId } = params;
    if (!commanderId) throw new Error('Missing required field: commanderId');
    const svc = getCommanderService();
    const commander = await svc.getOrCreate(commanderId as string);
    return (commander as any).skillStates || {};
  });

  router.registerHandler('skills.install', async (params: Record<string, unknown>) => {
    const { commanderId, roleId, version } = params;
    if (!commanderId || !roleId) throw new Error('Missing required fields: commanderId, roleId');
    const svc = getCommanderService();
    const commander = await svc.getOrCreate(commanderId as string);
    const skillStates = { ...((commander as any).skillStates || {}) };
    if ((skillStates as any)[roleId as string]?.installed) {
      throw new Error(`Skill ${roleId} is already installed`);
    }
    (skillStates as any)[roleId as string] = {
      installed: true,
      activated: false,
      installedAt: Date.now(),
      version: version || '1.0.0',
    };
    await svc.update(commanderId as string, { skillStates });
    return { success: true, roleId, installed: true };
  });

  router.registerHandler('skills.uninstall', async (params: Record<string, unknown>) => {
    const { commanderId, roleId } = params;
    if (!commanderId || !roleId) throw new Error('Missing required fields: commanderId, roleId');
    const svc = getCommanderService();
    const commander = await svc.getOrCreate(commanderId as string);
    const skillStates = { ...((commander as any).skillStates || {}) };
    const state = (skillStates as any)[roleId as string];
    if (!state?.installed) throw new Error(`Skill ${roleId} is not installed`);
    if (state.activated) throw new Error('Cannot uninstall activated skill. Deactivate first.');
    delete (skillStates as any)[roleId as string];
    await svc.update(commanderId as string, { skillStates });
    return { success: true, roleId, installed: false };
  });

  router.registerHandler('skills.activate', async (params: Record<string, unknown>) => {
    const { commanderId, roleId } = params;
    if (!commanderId || !roleId) throw new Error('Missing required fields: commanderId, roleId');
    const svc = getCommanderService();
    const commander = await svc.getOrCreate(commanderId as string);
    const skillStates = { ...((commander as any).skillStates || {}) };
    if (!(skillStates as any)[roleId as string]?.installed) throw new Error(`Skill ${roleId} is not installed`);
    (skillStates as any)[roleId as string].activated = true;
    (skillStates as any)[roleId as string].activatedAt = Date.now();
    await svc.update(commanderId as string, { skillStates });
    return { success: true, roleId, activated: true };
  });

  router.registerHandler('skills.deactivate', async (params: Record<string, unknown>) => {
    const { commanderId, roleId } = params;
    if (!commanderId || !roleId) throw new Error('Missing required fields: commanderId, roleId');
    const svc = getCommanderService();
    const commander = await svc.getOrCreate(commanderId as string);
    const skillStates = { ...((commander as any).skillStates || {}) };
    if (!(skillStates as any)[roleId as string]?.activated) throw new Error(`Skill ${roleId} is not activated`);
    (skillStates as any)[roleId as string].activated = false;
    await svc.update(commanderId as string, { skillStates });
    return { success: true, roleId, activated: false };
  });
}
