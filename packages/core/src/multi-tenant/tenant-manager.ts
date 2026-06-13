import type { JsonStore } from '../storage/json-store.js';
import { randomUUID, createHash } from 'crypto';

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled';
export type TenantTier = 'free' | 'professional' | 'enterprise' | 'mssp';

export interface TenantBranding {
  logo: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface TenantSettings {
  maxUsers: number;
  maxAssets: number;
  maxIncidents: number;
  maxRetentionDays: number;
  features: string[];
  dataResidency: string;
  branding: TenantBranding;
}

export interface TenantQuotas {
  apiCallsPerDay: number;
  storageMb: number;
  llmCallsPerDay: number;
  scanPerDay: number;
}

export interface TenantUsage {
  currentUsers: number;
  currentAssets: number;
  currentIncidents: number;
  apiCallsToday: number;
  storageUsedMb: number;
  llmCallsToday: number;
  scansToday: number;
  lastResetAt: number;
}

export interface TenantConfig {
  id: string;
  name: string;
  displayName: string;
  status: TenantStatus;
  tier: TenantTier;
  domain: string;
  createdAt: number;
  expiresAt: number | null;
  settings: TenantSettings;
  quotas: TenantQuotas;
  usage: TenantUsage;
  adminEmail: string;
  contactName: string;
  metadata: Record<string, unknown>;
}

export interface CreateTenantParams {
  name: string;
  displayName: string;
  tier: TenantTier;
  domain: string;
  adminEmail: string;
  contactName: string;
  expiresAt?: number | null;
  settings?: Partial<TenantSettings>;
  quotas?: Partial<TenantQuotas>;
  metadata?: Record<string, unknown>;
  status?: TenantStatus;
}

export interface UpdateTenantParams {
  name?: string;
  displayName?: string;
  status?: TenantStatus;
  tier?: TenantTier;
  domain?: string;
  expiresAt?: number | null;
  settings?: Partial<TenantSettings>;
  quotas?: Partial<TenantQuotas>;
  adminEmail?: string;
  contactName?: string;
  metadata?: Record<string, unknown>;
}

export type TenantListFilters = {
  status?: TenantStatus;
  tier?: TenantTier;
};

export type QuotaResource = 'apiCalls' | 'storage' | 'llmCalls' | 'scans';

export type UserStatus = 'active' | 'disabled' | 'invited';

export interface TenantUser {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
  lastLoginAt: number | null;
  createdAt: number;
  status: UserStatus;
}

export interface AddTenantUserParams {
  email: string;
  name: string;
  role: string;
  permissions?: string[];
  status?: UserStatus;
}

export type ShareDataType = 'ioc' | 'ttp' | 'vulnerability' | 'threat_actor';
export type ShareMode = 'anonymized' | 'hashed' | 'full';

export interface IntelligenceShareRule {
  id: string;
  sourceTenantId: string;
  targetTenantId: string;
  dataType: ShareDataType;
  shareMode: ShareMode;
  autoShare: boolean;
  createdAt: number;
}

export interface CreateShareRuleParams {
  sourceTenantId: string;
  targetTenantId: string;
  dataType: ShareDataType;
  shareMode: ShareMode;
  autoShare?: boolean;
}

export interface SharedIntelligenceResult {
  targetTenantId: string;
  shared: boolean;
  reason?: string;
}

const TENANTS_KEY = 'multi-tenant/tenants.json';
const USERS_KEY = 'multi-tenant/users.json';
const SHARE_RULES_KEY = 'multi-tenant/share-rules.json';

const TIER_PRESETS: Record<TenantTier, { settings: TenantSettings; quotas: TenantQuotas }> = {
  free: {
    settings: {
      maxUsers: 5,
      maxAssets: 100,
      maxIncidents: 50,
      maxRetentionDays: 30,
      features: ['basic_scan', 'basic_assets'],
      dataResidency: 'global',
      branding: { logo: '', primaryColor: '#000000', secondaryColor: '#ffffff' },
    },
    quotas: {
      apiCallsPerDay: 1000,
      storageMb: 500,
      llmCallsPerDay: 50,
      scanPerDay: 10,
    },
  },
  professional: {
    settings: {
      maxUsers: 50,
      maxAssets: 5000,
      maxIncidents: 1000,
      maxRetentionDays: 90,
      features: ['basic_scan', 'advanced_scan', 'ai_assist', 'custom_branding'],
      dataResidency: 'global',
      branding: { logo: '', primaryColor: '#1e40af', secondaryColor: '#f59e0b' },
    },
    quotas: {
      apiCallsPerDay: 20000,
      storageMb: 10240,
      llmCallsPerDay: 1000,
      scanPerDay: 200,
    },
  },
  enterprise: {
    settings: {
      maxUsers: 500,
      maxAssets: 100000,
      maxIncidents: 50000,
      maxRetentionDays: 365,
      features: ['basic_scan', 'advanced_scan', 'ai_assist', 'custom_branding', 'sso', 'audit_log'],
      dataResidency: 'configurable',
      branding: { logo: '', primaryColor: '#0f172a', secondaryColor: '#22c55e' },
    },
    quotas: {
      apiCallsPerDay: 200000,
      storageMb: 102400,
      llmCallsPerDay: 20000,
      scanPerDay: 5000,
    },
  },
  mssp: {
    settings: {
      maxUsers: 5000,
      maxAssets: 1000000,
      maxIncidents: 500000,
      maxRetentionDays: 730,
      features: ['basic_scan', 'advanced_scan', 'ai_assist', 'custom_branding', 'sso', 'audit_log', 'cross_tenant_intel', 'managed_soc'],
      dataResidency: 'configurable',
      branding: { logo: '', primaryColor: '#7c3aed', secondaryColor: '#06b6d4' },
    },
    quotas: {
      apiCallsPerDay: 2000000,
      storageMb: 1024000,
      llmCallsPerDay: 200000,
      scanPerDay: 50000,
    },
  },
};

export class TenantManager {
  constructor(private store: JsonStore) {}

  private async loadTenants(): Promise<TenantConfig[]> {
    const data = await this.store.get<TenantConfig[]>(TENANTS_KEY);
    return data ?? [];
  }

  private async saveTenants(tenants: TenantConfig[]): Promise<void> {
    await this.store.set(TENANTS_KEY, tenants);
  }

  private async loadUsers(): Promise<TenantUser[]> {
    const data = await this.store.get<TenantUser[]>(USERS_KEY);
    return data ?? [];
  }

  private async saveUsers(users: TenantUser[]): Promise<void> {
    await this.store.set(USERS_KEY, users);
  }

  private async loadShareRules(): Promise<IntelligenceShareRule[]> {
    const data = await this.store.get<IntelligenceShareRule[]>(SHARE_RULES_KEY);
    return data ?? [];
  }

  private async saveShareRules(rules: IntelligenceShareRule[]): Promise<void> {
    await this.store.set(SHARE_RULES_KEY, rules);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${randomUUID()}`;
  }

  private buildTenant(params: CreateTenantParams, now: number): TenantConfig {
    const preset = TIER_PRESETS[params.tier];
    const overrideSettings = params.settings ?? {};
    const overrideBranding: Partial<TenantBranding> = overrideSettings.branding ?? {};
    const settings: TenantSettings = {
      maxUsers: overrideSettings.maxUsers ?? preset.settings.maxUsers,
      maxAssets: overrideSettings.maxAssets ?? preset.settings.maxAssets,
      maxIncidents: overrideSettings.maxIncidents ?? preset.settings.maxIncidents,
      maxRetentionDays: overrideSettings.maxRetentionDays ?? preset.settings.maxRetentionDays,
      features: overrideSettings.features ?? [...preset.settings.features],
      dataResidency: overrideSettings.dataResidency ?? preset.settings.dataResidency,
      branding: {
        logo: overrideBranding.logo ?? preset.settings.branding.logo,
        primaryColor: overrideBranding.primaryColor ?? preset.settings.branding.primaryColor,
        secondaryColor: overrideBranding.secondaryColor ?? preset.settings.branding.secondaryColor,
      },
    };
    const quotas: TenantQuotas = {
      apiCallsPerDay: params.quotas?.apiCallsPerDay ?? preset.quotas.apiCallsPerDay,
      storageMb: params.quotas?.storageMb ?? preset.quotas.storageMb,
      llmCallsPerDay: params.quotas?.llmCallsPerDay ?? preset.quotas.llmCallsPerDay,
      scanPerDay: params.quotas?.scanPerDay ?? preset.quotas.scanPerDay,
    };
    return {
      id: this.generateId('tenant'),
      name: params.name,
      displayName: params.displayName,
      status: params.status ?? 'trial',
      tier: params.tier,
      domain: params.domain,
      createdAt: now,
      expiresAt: params.expiresAt ?? null,
      settings,
      quotas,
      usage: {
        currentUsers: 0,
        currentAssets: 0,
        currentIncidents: 0,
        apiCallsToday: 0,
        storageUsedMb: 0,
        llmCallsToday: 0,
        scansToday: 0,
        lastResetAt: now,
      },
      adminEmail: params.adminEmail,
      contactName: params.contactName,
      metadata: params.metadata ?? {},
    };
  }

  async createTenant(params: CreateTenantParams): Promise<TenantConfig> {
    const tenants = await this.loadTenants();
    if (tenants.some(t => t.name === params.name)) {
      throw new Error(`Tenant with name '${params.name}' already exists`);
    }
    if (tenants.some(t => t.domain === params.domain)) {
      throw new Error(`Tenant with domain '${params.domain}' already exists`);
    }
    const tenant = this.buildTenant(params, Date.now());
    tenants.push(tenant);
    await this.saveTenants(tenants);
    return tenant;
  }

  async getTenant(tenantId: string): Promise<TenantConfig | null> {
    const tenants = await this.loadTenants();
    return tenants.find(t => t.id === tenantId) ?? null;
  }

  async listTenants(filters: TenantListFilters = {}): Promise<TenantConfig[]> {
    let tenants = await this.loadTenants();
    if (filters.status) {
      tenants = tenants.filter(t => t.status === filters.status);
    }
    if (filters.tier) {
      tenants = tenants.filter(t => t.tier === filters.tier);
    }
    return tenants;
  }

  async updateTenant(tenantId: string, updates: UpdateTenantParams): Promise<TenantConfig | null> {
    const tenants = await this.loadTenants();
    const index = tenants.findIndex(t => t.id === tenantId);
    if (index === -1) return null;

    const current = tenants[index];
    const next: TenantConfig = {
      ...current,
      name: updates.name ?? current.name,
      displayName: updates.displayName ?? current.displayName,
      status: updates.status ?? current.status,
      tier: updates.tier ?? current.tier,
      domain: updates.domain ?? current.domain,
      expiresAt: updates.expiresAt !== undefined ? updates.expiresAt : current.expiresAt,
      adminEmail: updates.adminEmail ?? current.adminEmail,
      contactName: updates.contactName ?? current.contactName,
      metadata: updates.metadata ? { ...current.metadata, ...updates.metadata } : current.metadata,
      settings: updates.settings
        ? {
            ...current.settings,
            ...updates.settings,
            features: updates.settings.features ?? current.settings.features,
            branding: {
              ...current.settings.branding,
              ...(updates.settings.branding ?? {}),
            },
          }
        : current.settings,
      quotas: updates.quotas
        ? { ...current.quotas, ...updates.quotas }
        : current.quotas,
    };

    tenants[index] = next;
    await this.saveTenants(tenants);
    return next;
  }

  async suspendTenant(tenantId: string, _reason: string): Promise<TenantConfig> {
    const updated = await this.updateTenant(tenantId, { status: 'suspended' });
    if (!updated) {
      throw new Error(`Tenant '${tenantId}' not found`);
    }
    return updated;
  }

  async reactivateTenant(tenantId: string): Promise<TenantConfig> {
    const updated = await this.updateTenant(tenantId, { status: 'active' });
    if (!updated) {
      throw new Error(`Tenant '${tenantId}' not found`);
    }
    return updated;
  }

  async deleteTenant(tenantId: string): Promise<boolean> {
    const tenants = await this.loadTenants();
    const index = tenants.findIndex(t => t.id === tenantId);
    if (index === -1) return false;

    tenants.splice(index, 1);
    await this.saveTenants(tenants);

    const users = await this.loadUsers();
    const remaining = users.filter(u => u.tenantId !== tenantId);
    if (remaining.length !== users.length) {
      await this.saveUsers(remaining);
    }

    const rules = await this.loadShareRules();
    const remainingRules = rules.filter(r => r.sourceTenantId !== tenantId && r.targetTenantId !== tenantId);
    if (remainingRules.length !== rules.length) {
      await this.saveShareRules(remainingRules);
    }

    return true;
  }

  async checkQuota(tenantId: string, resource: QuotaResource): Promise<{ allowed: boolean; current: number; limit: number }> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant '${tenantId}' not found`);
    }
    if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
      return { allowed: false, current: 0, limit: 0 };
    }

    const map: Record<QuotaResource, { current: number; limit: number }> = {
      apiCalls: { current: tenant.usage.apiCallsToday, limit: tenant.quotas.apiCallsPerDay },
      storage: { current: tenant.usage.storageUsedMb, limit: tenant.quotas.storageMb },
      llmCalls: { current: tenant.usage.llmCallsToday, limit: tenant.quotas.llmCallsPerDay },
      scans: { current: tenant.usage.scansToday, limit: tenant.quotas.scanPerDay },
    };

    const entry = map[resource];
    return {
      allowed: entry.current < entry.limit,
      current: entry.current,
      limit: entry.limit,
    };
  }

  async incrementUsage(tenantId: string, resource: QuotaResource, amount: number = 1): Promise<void> {
    const tenants = await this.loadTenants();
    const index = tenants.findIndex(t => t.id === tenantId);
    if (index === -1) {
      throw new Error(`Tenant '${tenantId}' not found`);
    }

    const usage = { ...tenants[index].usage };
    switch (resource) {
      case 'apiCalls':
        usage.apiCallsToday += amount;
        break;
      case 'storage':
        usage.storageUsedMb += amount;
        break;
      case 'llmCalls':
        usage.llmCallsToday += amount;
        break;
      case 'scans':
        usage.scansToday += amount;
        break;
    }

    tenants[index] = { ...tenants[index], usage };
    await this.saveTenants(tenants);
  }

  async resetDailyUsage(tenantId: string): Promise<void> {
    const tenants = await this.loadTenants();
    const index = tenants.findIndex(t => t.id === tenantId);
    if (index === -1) {
      throw new Error(`Tenant '${tenantId}' not found`);
    }

    const now = Date.now();
    tenants[index] = {
      ...tenants[index],
      usage: {
        ...tenants[index].usage,
        apiCallsToday: 0,
        llmCallsToday: 0,
        scansToday: 0,
        lastResetAt: now,
      },
    };
    await this.saveTenants(tenants);
  }

  async resetAllDailyUsage(): Promise<number> {
    const tenants = await this.loadTenants();
    const now = Date.now();
    let count = 0;
    for (let i = 0; i < tenants.length; i++) {
      tenants[i] = {
        ...tenants[i],
        usage: {
          ...tenants[i].usage,
          apiCallsToday: 0,
          llmCallsToday: 0,
          scansToday: 0,
          lastResetAt: now,
        },
      };
      count++;
    }
    if (count > 0) {
      await this.saveTenants(tenants);
    }
    return count;
  }

  async getUsageReport(tenantId: string): Promise<TenantUsage> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant '${tenantId}' not found`);
    }
    return tenant.usage;
  }

  getStoreKey(tenantId: string, key: string): string {
    if (!tenantId) {
      throw new Error('tenantId is required');
    }
    if (!key) {
      throw new Error('key is required');
    }
    const sanitizedKey = key.replace(/^\/+/, '');
    return `multi-tenant/data/${tenantId}/${sanitizedKey}.json`;
  }

  async getTenantData(tenantId: string, key: string): Promise<unknown> {
    const storeKey = this.getStoreKey(tenantId, key);
    return this.store.get(storeKey);
  }

  async setTenantData(tenantId: string, key: string, value: unknown): Promise<void> {
    const storeKey = this.getStoreKey(tenantId, key);
    await this.store.set(storeKey, value);
  }

  async addUser(tenantId: string, user: AddTenantUserParams): Promise<TenantUser> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant '${tenantId}' not found`);
    }

    const users = await this.loadUsers();
    if (users.some(u => u.tenantId === tenantId && u.email === user.email)) {
      throw new Error(`User with email '${user.email}' already exists in tenant '${tenantId}'`);
    }
    if (tenant.usage.currentUsers >= tenant.settings.maxUsers) {
      throw new Error(`Tenant '${tenantId}' has reached maximum user limit (${tenant.settings.maxUsers})`);
    }

    const newUser: TenantUser = {
      id: this.generateId('user'),
      tenantId,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions ?? [],
      lastLoginAt: null,
      createdAt: Date.now(),
      status: user.status ?? 'invited',
    };

    users.push(newUser);
    await this.saveUsers(users);

    await this.updateTenant(tenantId, {});
    const tenants = await this.loadTenants();
    const tenantIndex = tenants.findIndex(t => t.id === tenantId);
    if (tenantIndex !== -1) {
      tenants[tenantIndex] = {
        ...tenants[tenantIndex],
        usage: {
          ...tenants[tenantIndex].usage,
          currentUsers: tenants[tenantIndex].usage.currentUsers + 1,
        },
      };
      await this.saveTenants(tenants);
    }

    return newUser;
  }

  async getUser(userId: string): Promise<TenantUser | null> {
    const users = await this.loadUsers();
    return users.find(u => u.id === userId) ?? null;
  }

  async listUsers(tenantId: string): Promise<TenantUser[]> {
    const users = await this.loadUsers();
    return users.filter(u => u.tenantId === tenantId);
  }

  async removeUser(userId: string): Promise<boolean> {
    const users = await this.loadUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return false;

    const removed = users[index];
    users.splice(index, 1);
    await this.saveUsers(users);

    const tenants = await this.loadTenants();
    const tenantIndex = tenants.findIndex(t => t.id === removed.tenantId);
    if (tenantIndex !== -1 && tenants[tenantIndex].usage.currentUsers > 0) {
      tenants[tenantIndex] = {
        ...tenants[tenantIndex],
        usage: {
          ...tenants[tenantIndex].usage,
          currentUsers: tenants[tenantIndex].usage.currentUsers - 1,
        },
      };
      await this.saveTenants(tenants);
    }

    return true;
  }

  createShareRule(rule: CreateShareRuleParams): IntelligenceShareRule {
    const newRule: IntelligenceShareRule = {
      id: this.generateId('share'),
      sourceTenantId: rule.sourceTenantId,
      targetTenantId: rule.targetTenantId,
      dataType: rule.dataType,
      shareMode: rule.shareMode,
      autoShare: rule.autoShare ?? false,
      createdAt: Date.now(),
    };
    return newRule;
  }

  async listShareRules(tenantId: string): Promise<IntelligenceShareRule[]> {
    const rules = await this.loadShareRules();
    return rules.filter(r => r.sourceTenantId === tenantId || r.targetTenantId === tenantId);
  }

  async removeShareRule(ruleId: string): Promise<boolean> {
    const rules = await this.loadShareRules();
    const index = rules.findIndex(r => r.id === ruleId);
    if (index === -1) return false;
    rules.splice(index, 1);
    await this.saveShareRules(rules);
    return true;
  }

  async shareIntelligence(
    sourceTenantId: string,
    data: { type: ShareDataType; payload: Record<string, unknown> }
  ): Promise<SharedIntelligenceResult[]> {
    const tenant = await this.getTenant(sourceTenantId);
    if (!tenant) {
      throw new Error(`Source tenant '${sourceTenantId}' not found`);
    }
    if (tenant.status === 'suspended' || tenant.status === 'cancelled') {
      return [];
    }

    const rules = await this.loadShareRules();
    const applicable = rules.filter(
      r => r.sourceTenantId === sourceTenantId && r.dataType === data.type
    );

    const results: SharedIntelligenceResult[] = [];
    for (const rule of applicable) {
      const target = await this.getTenant(rule.targetTenantId);
      if (!target) {
        results.push({ targetTenantId: rule.targetTenantId, shared: false, reason: 'target tenant not found' });
        continue;
      }
      if (target.status === 'suspended' || target.status === 'cancelled') {
        results.push({ targetTenantId: rule.targetTenantId, shared: false, reason: 'target tenant inactive' });
        continue;
      }

      const sharedPayload = this.anonymizeData(data.payload, rule.shareMode);
      const inboxKey = this.getStoreKey(rule.targetTenantId, `intel-inbox/${data.type}/${Date.now()}_${randomUUID()}`);
      await this.store.set(inboxKey, {
        source: sourceTenantId,
        type: data.type,
        mode: rule.shareMode,
        payload: sharedPayload,
        receivedAt: Date.now(),
      });

      results.push({ targetTenantId: rule.targetTenantId, shared: true });
    }

    return results;
  }

  private anonymizeData(data: Record<string, unknown>, mode: ShareMode): Record<string, unknown> {
    if (mode === 'full') {
      return { ...data };
    }

    const PII_KEYS = new Set([
      'email', 'adminEmail', 'contactEmail', 'userEmail', 'owner', 'contactName', 'adminName',
      'hostname', 'ip', 'ipAddress', 'ipAddresses', 'mac', 'macAddress', 'macAddresses',
      'domain', 'tenantName', 'organization', 'company', 'phone',
    ]);

    const transformString = (s: string): string =>
      mode === 'hashed' ? createHash('sha256').update(s).digest('hex').slice(0, 16) : `anon_${s.length}`;

    const walk = (value: unknown): unknown => {
      if (value === null || value === undefined) return value;
      if (typeof value === 'string') {
        return value.length === 0 ? value : transformString(value);
      }
      if (typeof value === 'number' || typeof value === 'boolean') {
        return value;
      }
      if (Array.isArray(value)) {
        return value.map(walk);
      }
      if (typeof value === 'object') {
        return this.anonymizeData(value as Record<string, unknown>, mode);
      }
      return value;
    };

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = PII_KEYS.has(key) ? walk(value) : value;
    }
    return result;
  }
}
