/**
 * SecuClaw Plugin System — 初始化入口
 */

import { pluginStore } from './plugin-store';
import { BUILT_IN_MANIFESTS } from './manifests/index';
import { THIRD_PARTY_MANIFESTS } from './manifests/third-party/index';

export { pluginStore } from './plugin-store';
export { renderPluginForm, renderPluginResult, executeMock, executePlugin, PLUGIN_PANEL_CSS } from './plugin-runtime';
export { adapterRegistry, mockApiPlugin } from './adapters/index';
export type * from './types';

/** 初始化插件系统（注册所有内置 + 第三方 manifest） */
export function initPluginSystem(): void {
  pluginStore.getState().registerAll(BUILT_IN_MANIFESTS);
  pluginStore.getState().registerAll(THIRD_PARTY_MANIFESTS);
}

// Auto-init on import
initPluginSystem();
