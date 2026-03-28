import type { RouterDeps } from '../router.js';
import { CommanderService } from '../../commander/service.js';
import { CommanderRepository } from '../../commander/repository.js';

export function registerCommanderRoutes(
  handlers: Map<string, (params: Record<string, unknown>) => Promise<unknown>>,
  deps: RouterDeps
): void {
  handlers.set('commander.get', (params) => handleCommanderGet(params, deps));
  handlers.set('commander.create', (params) => handleCommanderCreate(params, deps));
  handlers.set('commander.update', (params) => handleCommanderUpdate(params, deps));
  handlers.set('commander.activateRole', (params) => handleCommanderActivateRole(params, deps));
  handlers.set('commander.deactivateRole', (params) => handleCommanderDeactivateRole(params, deps));
  handlers.set('commander.bindLLM', (params) => handleCommanderBindLLM(params, deps));
}

function getCommanderService(deps: RouterDeps): CommanderService {
  if (!deps.commanderService) {
    const repo = new CommanderRepository(deps.jsonStore);
    deps.commanderService = new CommanderService(repo);
  }
  return deps.commanderService;
}

async function handleCommanderGet(params: Record<string, unknown>, deps: RouterDeps) {
  return getCommanderService(deps).getOrCreate(params.id as string);
}

async function handleCommanderCreate(params: Record<string, unknown>, deps: RouterDeps) {
  return getCommanderService(deps).create({ name: params.name as string, type: params.type as string });
}

async function handleCommanderUpdate(params: Record<string, unknown>, deps: RouterDeps) {
  return getCommanderService(deps).update(params.id as string, params.updates as any);
}

async function handleCommanderActivateRole(params: Record<string, unknown>, deps: RouterDeps) {
  return getCommanderService(deps).activateRole(params.commanderId as string, params.roleId as string);
}

async function handleCommanderDeactivateRole(params: Record<string, unknown>, deps: RouterDeps) {
  return getCommanderService(deps).deactivateRole(params.commanderId as string, params.roleId as string);
}

async function handleCommanderBindLLM(params: Record<string, unknown>, deps: RouterDeps) {
  const { commanderId, roleId, binding } = params;
  return getCommanderService(deps).bindLLM(commanderId as string, roleId as string, binding);
}
