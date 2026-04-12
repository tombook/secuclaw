import 'reflect-metadata';
import { Service } from 'typedi';
import type { Commander } from './types.js';
import { CommanderRepository } from './repository.js';

const logger = {
  info: (...args: any[]) => console.log('[CommanderService]', ...args),
  error: (...args: any[]) => console.error('[CommanderService]', ...args),
};

@Service()
export class CommanderService {
  constructor(private repo: CommanderRepository) {}
  
  // Helper to build default Commander with predictable defaults
  private buildDefaultCommander(id: string): Commander {
    const now = Date.now();
    return {
      id: id,
      name: 'Default Commander',
      type: 'personal',
      createdAt: now,
      updatedAt: now,
      roles: [],
      primaryRole: 'security-expert',
      llmBindings: {},
      skillStates: {},
      settings: {
        language: 'zh-CN',
        theme: 'dark',
        notifications: { enabled: true, channels: [] },
      },
    };
  }
  
  async getOrCreate(id: string): Promise<Commander> {
    const keyId = id || 'default';
    logger.info(`getOrCreate called for id=${keyId}`);
    const existing = await this.repo.getById(keyId);
    if (existing) return existing;
    const def = this.buildDefaultCommander(keyId);
    logger.info(`Commander not found. Creating default for id=${keyId}`);
    await this.repo.create(def);
    return def;
  }

  async create(params: { name?: string; type?: string }): Promise<Commander> {
    const id = `cmdr_${Date.now()}`;
    const now = Date.now();
    const commander: Commander = {
      id,
      name: params.name ?? 'Default Commander',
      type: (params.type as any) ?? 'personal',
      createdAt: now,
      updatedAt: now,
      roles: [],
      primaryRole: 'security-expert',
      llmBindings: {},
      skillStates: {},
      settings: {
        language: 'zh-CN',
        theme: 'dark',
        notifications: { enabled: true, channels: [] },
      },
    };
    await this.repo.create(commander);
    logger.info(`Commander created id=${commander.id}`);
    return commander;
  }

  async update(id: string, updates: Partial<Commander>): Promise<Commander> {
    const existing = await this.repo.getById(id);
    if (!existing) throw new Error('Commander not found');
    const updated = { ...existing, ...updates, updatedAt: Date.now() } as Commander;
    const result = await this.repo.update(id, updated);
    if (!result) throw new Error('Commander not found');
    logger.info(`Commander updated id=${id}`);
    return result;
  }

  async activateRole(commanderId: string, roleId: string): Promise<Commander> {
    const commander = await this.repo.getById(commanderId);
    if (!commander) throw new Error('Commander not found');
    const idx = commander.roles.findIndex((r) => r.roleId === roleId);
    if (idx >= 0) {
      commander.roles[idx].enabled = true;
      commander.roles[idx].activatedAt = Date.now();
    } else {
      commander.roles.push({ roleId, enabled: true, activatedAt: Date.now() });
    }
    commander.updatedAt = Date.now();
    await this.repo.update(commanderId, commander);
    logger.info(`Activated role ${roleId} for commander ${commanderId}`);
    return commander;
  }

  async deactivateRole(commanderId: string, roleId: string): Promise<Commander> {
    const commander = await this.repo.getById(commanderId);
    if (!commander) throw new Error('Commander not found');
    const role = commander.roles.find((r) => r.roleId === roleId);
    if (role) role.enabled = false;
    commander.updatedAt = Date.now();
    await this.repo.update(commanderId, commander);
    logger.info(`Deactivated role ${roleId} for commander ${commanderId}`);
    return commander;
  }

  async bindLLM(commanderId: string, roleId: string, binding: unknown): Promise<Commander> {
    const commander = await this.repo.getById(commanderId);
    if (!commander) throw new Error('Commander not found');
    (commander.llmBindings as any)[roleId] = binding;
    commander.updatedAt = Date.now();
    await this.repo.update(commanderId, commander);
    logger.info(`Bound LLM for commander ${commanderId}, role ${roleId}`);
    return commander;
  }
}
