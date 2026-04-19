import type { Router } from '../router.js';

export function registerChannelsRoutes(router: Router): void {
  router.registerHandler('channels.status', async () => router['getChannelManager']().getStatus());
  router.registerHandler('channels.configure', async (params: Record<string, unknown>) => {
    const channelId = params.channelId as string;
    const config = params.config as Record<string, unknown>;
    await router['getChannelManager']().saveConfig(channelId, {
      id: channelId,
      name: channelId.charAt(0).toUpperCase() + channelId.slice(1).replace(/-/g, ' '),
      enabled: (config as any).enabled !== false,
      config,
    });
    return { success: true, channelId };
  });
  router.registerHandler('channels.send', async (params: Record<string, unknown>) => {
    const channelId = params.channelId as string;
    const message = params.message as string;
    return router['getChannelManager']().send(channelId, {
      title: 'SecuClaw Notification',
      body: message,
      priority: (params.priority as any) || 'medium',
      recipients: params.recipients as string[] | undefined,
    });
  });
  router.registerHandler('channels.enable', async (params: Record<string, unknown>) => {
    const channelId = params.channelId as string;
    if (!channelId) throw new Error('Missing required field: channelId');
    const mgr = router['getChannelManager']();
    const existing = await mgr.getStatus();
    const configs: Record<string, any> = (existing as any)?.configs || {};
    const current = configs[channelId] || {};
    await mgr.saveConfig(channelId, {
      id: channelId,
      name: current.name || channelId.charAt(0).toUpperCase() + channelId.slice(1).replace(/-/g, ' '),
      enabled: true,
      config: current.config || {},
    });
    return { success: true, channelId, enabled: true };
  });
  router.registerHandler('channels.disable', async (params: Record<string, unknown>) => {
    const channelId = params.channelId as string;
    if (!channelId) throw new Error('Missing required field: channelId');
    const mgr = router['getChannelManager']();
    const existing = await mgr.getStatus();
    const configs: Record<string, any> = (existing as any)?.configs || {};
    const current = configs[channelId] || {};
    await mgr.saveConfig(channelId, {
      id: channelId,
      name: current.name || channelId.charAt(0).toUpperCase() + channelId.slice(1).replace(/-/g, ' '),
      enabled: false,
      config: current.config || {},
    });
    return { success: true, channelId, enabled: false };
  });
}
