import { BaseStore } from './base-store.js';
import { gatewayClient } from '../gateway-client.js';

interface RoleConfig {
  roleId: string;
  enabled: boolean;
  activatedAt?: number;
  customCapabilities?: Partial<Capabilities>;
}

interface LLMBinding {
  providerId: string;
  modelName: string;
  temperature?: number;
  maxTokens?: number;
}

interface SkillState {
  installed: boolean;
  activated: boolean;
  installedAt?: number;
  activatedAt?: number;
  version: string;
}

interface CommanderSettings {
  language: 'zh-CN' | 'en' | 'zh-TW';
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    channels: string[];
  };
}

interface Commander {
  id: string;
  name: string;
  type: 'personal' | 'organization' | 'government';
  organization?: string;
  createdAt: number;
  updatedAt: number;
  roles: RoleConfig[];
  primaryRole: string;
  llmBindings: Record<string, LLMBinding>;
  skillStates: Record<string, SkillState>;
  settings: CommanderSettings;
}

interface Capabilities {
  light: string[];
  dark: string[];
  security: string[];
  legal: string[];
  technology: string[];
  business: string[];
}

interface CommanderState {
  commander: Commander | null;
  loading: boolean;
  error: string | null;
}

class CommanderStore extends BaseStore<CommanderState> {
  constructor() {
    super({
      commander: null,
      loading: false,
      error: null,
    });
  }

  async initialize(): Promise<void> {
    await this.loadCommander();
  }

  async loadCommander(): Promise<void> {
    this.setState({ loading: true, error: null });
    try {
      const commander = await gatewayClient.request<Commander>('commander.get', {
        id: 'default',
      });
      this.setState({ commander, loading: false });
    } catch (error) {
      this.setState({
        error: error instanceof Error ? error.message : 'Failed to load commander',
        loading: false,
      });
    }
  }

  async activateRole(roleId: string): Promise<void> {
    if (!this.state.commander) return;
    try {
      await gatewayClient.request('commander.activateRole', {
        commanderId: this.state.commander.id,
        roleId,
      });
      await this.loadCommander();
    } catch (error) {
      console.error('Failed to activate role:', error);
      throw error;
    }
  }

  async deactivateRole(roleId: string): Promise<void> {
    if (!this.state.commander) return;
    try {
      await gatewayClient.request('commander.deactivateRole', {
        commanderId: this.state.commander.id,
        roleId,
      });
      await this.loadCommander();
    } catch (error) {
      console.error('Failed to deactivate role:', error);
      throw error;
    }
  }

  async bindLLM(roleId: string, binding: LLMBinding): Promise<void> {
    if (!this.state.commander) return;
    try {
      await gatewayClient.request('commander.bindLLM', {
        commanderId: this.state.commander.id,
        roleId,
        binding,
      });
      await this.loadCommander();
    } catch (error) {
      console.error('Failed to bind LLM:', error);
      throw error;
    }
  }

  async updateSettings(settings: Partial<CommanderSettings>): Promise<void> {
    if (!this.state.commander) return;
    try {
      await gatewayClient.request('commander.update', {
        id: this.state.commander.id,
        updates: { settings: { ...this.state.commander.settings, ...settings } },
      });
      await this.loadCommander();
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  }

  getPrimaryRole(): string {
    return this.state.commander?.primaryRole || 'security-expert';
  }

  getActiveRoles(): RoleConfig[] {
    return this.state.commander?.roles.filter((r) => r.enabled) || [];
  }
}

export const commanderStore = new CommanderStore();
export type {
  Commander,
  RoleConfig,
  LLMBinding,
  SkillState,
  CommanderSettings,
  Capabilities,
};
