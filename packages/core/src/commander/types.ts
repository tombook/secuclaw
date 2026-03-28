export interface CommanderSettings {
  language: string;
  theme: string;
  notifications: {
    enabled: boolean;
    channels: string[];
  };
}

export interface CommanderRole {
  roleId: string;
  enabled: boolean;
  activatedAt?: number;
}

export interface Commander {
  id: string;
  name: string;
  type: 'personal' | 'team' | 'organization';
  createdAt: number;
  updatedAt: number;
  roles: CommanderRole[];
  primaryRole: string;
  llmBindings: Record<string, unknown>;
  skillStates: Record<string, unknown>;
  settings: CommanderSettings;
}
