/**
 * sc-settings-store — 系统配置状态管理（Zustand Vanilla）
 * 管理 AI 后端配置、角色能力参数、全局设置
 */

import { createStore } from 'zustand/vanilla';
import type { RoleId } from '../config/role-tool-config';
import { ALL_ROLE_IDS, ROLE_TOOL_CONFIGS } from '../config/role-tool-config';

// ─── Types ──────────────────────────────────────────

export interface AiBackendConfig {
  apiUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;         // ms
  enabled: boolean;
  connectionStatus: 'unknown' | 'connected' | 'failed' | 'testing';
  lastTestedAt: number | null;
  lastErrorMessage: string;
}

export interface RoleSkillConfig {
  roleId: RoleId;
  enabled: boolean;
  lightCapabilities: string[];     // 光明面能力
  darkCapabilities: string[];      // 黑暗面能力
  customSystemPrompt: string;      // 自定义追加 prompt
  mitreCoverage: string[];         // MITRE 战术覆盖
  scfCoverage: string[];           // SCF 控制域覆盖
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  analysisDepth: 'brief' | 'standard' | 'thorough';
  preferredLanguage: 'zh-CN' | 'en-US';
}

export interface GlobalSettings {
  theme: 'dark';                   // v1 only dark
  autoSave: boolean;
  autoSaveInterval: number;        // seconds
  dataRetentionDays: number;
  enableNotifications: boolean;
  enableMetrics: boolean;
  defaultRole: RoleId;
  panelMode: 'slide' | 'modal' | 'fullscreen';
  showAiAnalysis: boolean;         // 是否显示 AI 分析块
  showBoardSummary: boolean;       // 是否显示向上汇报摘要
  showDarkCapabilities: boolean;   // 是否显示黑暗面能力
  scfDataPath: string;
  mitreDataPath: string;
}

export interface SettingsState {
  // AI 后端
  ai: AiBackendConfig;
  
  // 角色能力配置
  roles: Record<RoleId, RoleSkillConfig>;
  
  // 全局设置
  global: GlobalSettings;
  
  // UI state
  activeTab: 'ai' | 'roles' | 'global';
  dirty: boolean;
  
  // Actions
  setAiConfig: (patch: Partial<AiBackendConfig>) => void;
  testConnection: () => Promise<boolean>;
  setRoleConfig: (roleId: RoleId, patch: Partial<RoleSkillConfig>) => void;
  setGlobalSettings: (patch: Partial<GlobalSettings>) => void;
  setActiveTab: (tab: 'ai' | 'roles' | 'global') => void;
  resetToDefaults: () => void;
  exportConfig: () => string;
  importConfig: (json: string) => boolean;
  save: () => void;
  load: () => void;
}

// ─── Defaults ───────────────────────────────────────

const DEFAULT_AI: AiBackendConfig = {
  apiUrl: 'https://api.minimaxi.com/v1',
  apiKey: '',
  model: 'MiniMax-M2.7',
  maxTokens: 2048,
  temperature: 0.7,
  timeout: 30000,
  enabled: true,
  connectionStatus: 'unknown',
  lastTestedAt: null,
  lastErrorMessage: '',
};

const ROLE_CAPABILITIES: Record<RoleId, { light: string[]; dark: string[]; mitre: string[]; scf: string[] }> = {
  'ciso': {
    light: ['安全战略规划', '合规治理', '安全架构设计', '风险管理', '安全预算管理', '监管对接', '安全政策制定', '安全绩效评估', '危机管理'],
    dark: ['合规漏洞挖掘', '监管渗透测试', '架构弱点评估', '法律风险分析', '内部威胁检测', '高管攻击模拟', '供应链攻击评估'],
    mitre: ['TA0001-Initial Access', 'TA0002-Execution', 'TA0003-Persistence', 'TA0004-Privilege Escalation', 'TA0005-Defense Evasion', 'TA0006-Credential Access', 'TA0007-Discovery', 'TA0008-Lateral Movement', 'TA0009-Collection', 'TA0010-Exfiltration', 'TA0011-Command and Control', 'TA0040-Impact'],
    scf: ['GOV', 'RSK', 'AC', 'IR', 'PRV', 'AU', 'CM', 'PL', 'PM', 'SA', 'SC', 'SI', 'AT', 'CA', 'CP', 'IA', 'MP'],
  },
  'secuclaw-commander': {
    light: ['战略规划', '全面安全治理', '合规管理', '架构设计', '风险管理', '预算管理', '危机管理', '董事会汇报', '跨部门协调'],
    dark: ['全面渗透测试', '红队演练', 'APT模拟', '供应链攻击', '内部威胁评估', '合规渗透', '架构弱点分析'],
    mitre: ['TA0001', 'TA0002', 'TA0003', 'TA0004', 'TA0005', 'TA0006', 'TA0007', 'TA0008', 'TA0009', 'TA0010', 'TA0011', 'TA0040'],
    scf: ['GOV', 'RSK', 'AC', 'IR', 'PRV', 'BC', 'TPM', 'OPS', 'MON', 'CM', 'PL', 'PM'],
  },
  'privacy-officer': {
    light: ['隐私影响评估(PIA)', '数据分类分级', '合规审计', '用户权利响应', '数据保护政策', '跨境传输合规', '同意管理'],
    dark: ['隐私合规渗透', '数据流向追踪', '合规漏洞挖掘', '个人信息窃取模拟', '第三方数据泄露', '隐私政策绕过'],
    mitre: ['TA0006-Credential Access', 'TA0009-Collection', 'TA0010-Exfiltration', 'TA0011-Command and Control'],
    scf: ['AC', 'AU', 'IA', 'MP', 'SC', 'SI', 'PRV'],
  },
  'business-security-officer': {
    light: ['业务连续性管理', '风险量化评估', '供应链安全', '安全投资回报分析', '业务影响分析', '灾难恢复规划', '安全KPI制定'],
    dark: ['业务逻辑漏洞挖掘', '业务流程攻击模拟', '供应链攻击面分析', '业务中断攻击评估', '经济影响分析'],
    mitre: ['TA0001', 'TA0003', 'TA0004', 'TA0008', 'TA0009', 'TA0010', 'TA0011', 'TA0040'],
    scf: ['BC', 'RSK', 'TPM', 'AT', 'AU', 'CP', 'IR', 'RA'],
  },
  'security-ops': {
    light: ['威胁监控', '事件响应', 'SOC运营', '漏洞管理', '日志分析', '威胁狩猎', '安全自动化', '运营指标分析'],
    dark: ['渗透测试', '红队演练', '攻击路径发现', '漏洞利用验证', '内网横向移动', '权限提升'],
    mitre: ['TA0001', 'TA0002', 'TA0003', 'TA0004', 'TA0005', 'TA0006', 'TA0007', 'TA0008', 'TA0009', 'TA0010', 'TA0011'],
    scf: ['MON', 'OPS', 'IR', 'AU', 'AT', 'CA', 'CM', 'CP', 'MA', 'RA', 'SI'],
  },
  'security-expert': {
    light: ['漏洞扫描', '补丁管理', '安全监控', '事件响应', '威胁检测', '访问控制', '加密管理', '身份认证'],
    dark: ['渗透测试', '红队演练', '漏洞利用', '权限提升', '横向移动', '数据窃取', '社会工程'],
    mitre: ['TA0001', 'TA0002', 'TA0003', 'TA0004', 'TA0005', 'TA0006', 'TA0007', 'TA0008', 'TA0009', 'TA0010', 'TA0011'],
    scf: ['AC', 'AT', 'AU', 'CA', 'CM', 'CP', 'IA', 'IR', 'MA', 'MP', 'PL', 'RA', 'SA', 'SC', 'SI', 'PM'],
  },
  'security-architect': {
    light: ['安全架构设计', '零信任架构', '防御纵深设计', '安全区域划分', '身份架构', '云安全架构', '应用安全架构'],
    dark: ['架构弱点分析', '攻击路径绘制', '信任边界渗透', '架构绕过设计', '横向移动架构', '持久化架构'],
    mitre: ['TA0001', 'TA0004', 'TA0005', 'TA0008', 'TA0009', 'TA0010', 'TA0011'],
    scf: ['AC', 'CA', 'CM', 'PL', 'SA', 'SC', 'SI'],
  },
  'supply-chain-security': {
    light: ['供应商安全评估', '第三方风险管理', '供应链合规', '合同安全条款', '供应商审计', '数据共享协议', '供应链可视化'],
    dark: ['供应链渗透测试', '第三方漏洞挖掘', '供应商攻击模拟', '供应链弱点分析', '数据泄露路径分析', '供应链勒索评估'],
    mitre: ['TA0001', 'TA0003', 'TA0004', 'TA0005', 'TA0008', 'TA0009', 'TA0010', 'TA0011'],
    scf: ['AC', 'AU', 'CP', 'IA', 'IR', 'MP', 'PRV', 'RA', 'SA', 'SC', 'TPM'],
  },
};

function createDefaultRoles(): Record<RoleId, RoleSkillConfig> {
  const roles = {} as Record<RoleId, RoleSkillConfig>;
  for (const roleId of ALL_ROLE_IDS) {
    const caps = ROLE_CAPABILITIES[roleId];
    roles[roleId] = {
      roleId,
      enabled: true,
      lightCapabilities: caps?.light ?? [],
      darkCapabilities: caps?.dark ?? [],
      customSystemPrompt: '',
      mitreCoverage: caps?.mitre ?? [],
      scfCoverage: caps?.scf ?? [],
      riskTolerance: 'moderate',
      analysisDepth: 'standard',
      preferredLanguage: 'zh-CN',
    };
  }
  return roles;
}

const DEFAULT_GLOBAL: GlobalSettings = {
  theme: 'dark',
  autoSave: true,
  autoSaveInterval: 30,
  dataRetentionDays: 90,
  enableNotifications: true,
  enableMetrics: true,
  defaultRole: 'security-ops',
  panelMode: 'slide',
  showAiAnalysis: true,
  showBoardSummary: true,
  showDarkCapabilities: false,
  scfDataPath: '',
  mitreDataPath: '',
};

// ─── Persistence ────────────────────────────────────

const STORAGE_KEY = 'secuclaw-settings';

function persist(state: SettingsState) {
  const data = {
    ai: { ...state.ai, connectionStatus: 'unknown' as const }, // Don't persist status
    roles: state.roles,
    global: state.global,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* quota exceeded */ }
}

function hydrate(): Partial<SettingsState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

// ─── Store ──────────────────────────────────────────

export const settingsStore = createStore<SettingsState>()((set, get) => ({
  ai: DEFAULT_AI,
  roles: createDefaultRoles(),
  global: DEFAULT_GLOBAL,
  activeTab: 'ai',
  dirty: false,

  setAiConfig: (patch) => set((s) => ({ ai: { ...s.ai, ...patch }, dirty: true })),
  
  testConnection: async () => {
    set((s) => ({ ai: { ...s.ai, connectionStatus: 'testing', lastErrorMessage: '' } }));
    const { ai } = get();
    try {
      const resp = await fetch(`${ai.apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ai.apiKey}`,
        },
        body: JSON.stringify({
          model: ai.model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(ai.timeout),
      });
      if (!resp.ok) {
        const err = await resp.text().catch(() => '');
        set((s) => ({ ai: { ...s.ai, connectionStatus: 'failed', lastErrorMessage: `HTTP ${resp.status}: ${err.substring(0, 100)}`, lastTestedAt: Date.now() } }));
        return false;
      }
      set((s) => ({ ai: { ...s.ai, connectionStatus: 'connected', lastTestedAt: Date.now(), lastErrorMessage: '' } }));
      return true;
    } catch (e: any) {
      set((s) => ({ ai: { ...s.ai, connectionStatus: 'failed', lastErrorMessage: e?.message ?? String(e), lastTestedAt: Date.now() } }));
      return false;
    }
  },

  setRoleConfig: (roleId, patch) => set((s) => ({
    roles: { ...s.roles, [roleId]: { ...s.roles[roleId], ...patch } },
    dirty: true,
  })),

  setGlobalSettings: (patch) => set((s) => ({
    global: { ...s.global, ...patch },
    dirty: true,
  })),

  setActiveTab: (tab) => set({ activeTab: tab }),
  
  resetToDefaults: () => set({
    ai: DEFAULT_AI,
    roles: createDefaultRoles(),
    global: DEFAULT_GLOBAL,
    dirty: true,
  }),

  exportConfig: () => {
    const { ai, roles, global } = get();
    return JSON.stringify({ ai: { ...ai, apiKey: ai.apiKey ? ai.apiKey.substring(0, 4) + '****' : '' }, roles, global }, null, 2);
  },

  importConfig: (json) => {
    try {
      const data = JSON.parse(json);
      if (data.ai) set((s) => ({ ai: { ...s.ai, ...data.ai } }));
      if (data.roles) set((s) => ({ roles: { ...s.roles, ...data.roles } }));
      if (data.global) set((s) => ({ global: { ...s.global, ...data.global } }));
      set({ dirty: true });
      return true;
    } catch { return false; }
  },

  save: () => {
    persist(get());
    set({ dirty: false });
  },

  load: () => {
    const saved = hydrate();
    if (saved?.ai) set((s) => ({ ai: { ...s.ai, ...saved.ai } }));
    if (saved?.roles) set((s) => ({ roles: { ...s.roles, ...saved.roles! } }));
    if (saved?.global) set((s) => ({ global: { ...s.global, ...saved.global! } }));
  },
}));

// Auto-load on import
try { settingsStore.getState().load(); } catch { /* */ }
