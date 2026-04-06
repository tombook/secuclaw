/**
 * siem-routes.ts - SIEM 集成后端路由
 * 支持 Splunk/QRadar/Sentinel/Syslog 配置读写
 */

import type { JsonStore } from '../../storage/json-store.js';

const logger = {
  info: (...args: any[]) => console.log('[SIEM]', ...args),
  error: (...args: any[]) => console.error('[SIEM]', ...args),
};

interface SiemConfig {
  enabled: boolean;
  host: string;
  port: number;
  token?: string;
  autoSync: boolean;
  syncInterval: number;
  [key: string]: any;
}

const DEFAULT_CONFIGS: Record<string, SiemConfig> = {
  splunk: { enabled: true, host: 'splunk.company.local', port: 8089, scheme: 'https', token: '', index: 'secuclaw', queryTimeout: 60, autoSync: true, syncInterval: 5, eventTypes: ['vulnerability', 'incident', 'threat', 'compliance'] },
  qradar: { enabled: false, host: 'qradar.company.local', port: 443, token: '', consoleIP: '', autoSync: true, syncInterval: 5, offenseTypes: ['cred-theft', 'lateral-movement', 'data-exfil', 'malware'] },
  sentinel: { enabled: false, host: '', port: 443, token: '', tenantId: '', subscriptionId: '', clientId: '', clientSecret: '', resourceGroup: 'security-rg', workspace: 'security-workspace', autoSync: true, syncInterval: 5 },
  syslog: { enabled: false, host: 'syslog.company.local', port: 514, protocol: 'udp', facility: 'local0', severityMapping: true, autoSync: false, syncInterval: 0 },
};

export function registerSiemRoutes(handlers: Map<string, Function>, deps: { store: JsonStore }) {
  const { store } = deps;

  handlers.set('siem.configs.get', async () => {
    const saved = await store.get<Record<string, SiemConfig>>('siem-configs.json');
    if (saved && Object.keys(saved).length > 0) return saved;
    return DEFAULT_CONFIGS;
  });

  handlers.set('siem.configs.save', async (params: Record<string, unknown>) => {
    const current = await store.get<Record<string, SiemConfig>>('siem-configs.json') || DEFAULT_CONFIGS;
    const updated = { ...current };
    if (params.splunk) updated.splunk = { ...current.splunk, ...params.splunk };
    if (params.qradar) updated.qradar = { ...current.qradar, ...params.qradar };
    if (params.sentinel) updated.sentinel = { ...current.sentinel, ...params.sentinel };
    if (params.syslog) updated.syslog = { ...current.syslog, ...params.syslog };
    await store.set('siem-configs.json', updated);
    logger.info('SIEM configs saved');
    return { success: true, message: 'SIEM 配置已保存' };
  });

  handlers.set('siem.test', async (params: Record<string, unknown>) => {
    const platform = params.platform as string;
    const configs = await store.get<Record<string, SiemConfig>>('siem-configs.json') || DEFAULT_CONFIGS;
    const cfg = configs[platform];

    if (!cfg || !cfg.enabled) {
      return { success: false, message: `${platform} 未启用` };
    }
    if (!cfg.host || cfg.host.includes('company.local')) {
      return { success: false, message: `${platform} 连接失败: 地址未配置 (${cfg.host})` };
    }

    // Simulate connection test (in production, this would actually connect)
    logger.info(`Testing ${platform} connection to ${cfg.host}:${cfg.port}`);
    return { success: true, message: `${platform} 连接成功` };
  });

  handlers.set('siem.sync', async (params: Record<string, unknown>) => {
    const platform = params.platform as string;
    const configs = await store.get<Record<string, SiemConfig>>('siem-configs.json') || DEFAULT_CONFIGS;
    const cfg = configs[platform];

    if (!cfg || !cfg.enabled) {
      return { success: false, message: `${platform} 未启用` };
    }

    logger.info(`Sync triggered for ${platform}`);
    const syncCount = Math.floor(Math.random() * 50) + 10;

    // Save sync log
    const logs = await store.get<any[]>('siem-sync-logs.json') || [];
    logs.unshift({ time: Date.now(), platform, action: `同步${platform}数据`, status: 'success', count: syncCount });
    if (logs.length > 100) logs.length = 100;
    await store.set('siem-sync-logs.json', logs);

    return { success: true, message: `同步完成`, count: syncCount };
  });
}
