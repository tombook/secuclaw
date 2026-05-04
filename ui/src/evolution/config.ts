/**
 * SecuClaw Evolution System — 默认配置
 * 
 * 对标 Hermes config.yaml 的 evolution 相关字段
 * 参考: run_agent.py:1429-1541, context_compressor.py:301-400
 */

import type { EvolutionConfig } from './types';

export const DEFAULT_EVOLUTION_CONFIG: EvolutionConfig = {
  memory: {
    enabled: true,
    nudgeInterval: 10,          // Hermes 默认 10 (run_agent.py:1429)
    memoryCharLimit: 2200,      // Hermes 默认 2200 (memory_tool.py)
    userCharLimit: 1375,        // Hermes 默认 1375 (memory_tool.py)
    flushMinTurns: 6,           // Hermes 默认 6 (run_agent.py:1438)
  },
  skills: {
    evolutionEnabled: true,
    creationNudgeInterval: 10,  // Hermes 默认 10 (run_agent.py:1538)
    guardAgentCreated: false,   // Hermes 默认 false (skill_manager_tool.py:52)
    maxSkillsPerRole: 50,
    maxContentChars: 100_000,   // Hermes 默认 100000 (skill_manager_tool.py)
    maxFileBytes: 1_048_576,    // Hermes 默认 1MB (skill_manager_tool.py)
  },
  context: {
    compressionEnabled: true,
    thresholdPercent: 0.75,     // Hermes 默认 0.75 (context_compressor.py)
    protectFirstN: 3,           // Hermes 默认 3 (context_compressor.py)
    protectLastN: 6,            // Hermes 默认 6 (context_compressor.py)
    summaryRatio: 0.20,         // Hermes 默认 0.20 (context_compressor.py)
    summaryTokenCeiling: 12_000, // Hermes 默认 12000 (context_compressor.py)
    failureCooldownSeconds: 600, // Hermes 默认 600 (context_compressor.py)
  },
  review: {
    maxIterations: 8,           // Hermes 默认 8 (run_agent.py:2920)
    quietMode: true,            // Hermes 后台审查默认 quiet
  },
  insights: {
    enabled: true,
    trackingDays: 30,
  },
};

const CONFIG_STORAGE_KEY = 'secuclaw-evolution-config';

/** 从 localStorage 加载用户覆盖的配置 */
export function loadEvolutionConfig(): EvolutionConfig {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      const overrides = JSON.parse(raw);
      return deepMerge(DEFAULT_EVOLUTION_CONFIG, overrides);
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_EVOLUTION_CONFIG };
}

/** 保存配置到 localStorage */
export function saveEvolutionConfig(config: EvolutionConfig): void {
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch { /* quota exceeded, ignore */ }
}

/** 深度合并两个对象（仅合并已有字段） */
function deepMerge<T extends Record<string, unknown>>(base: T, overrides: Partial<T>): T {
  const result = { ...base };
  for (const key of Object.keys(overrides) as Array<keyof T>) {
    const overrideVal = overrides[key];
    if (overrideVal && typeof overrideVal === 'object' && !Array.isArray(overrideVal)) {
      const baseVal = base[key];
      if (baseVal && typeof baseVal === 'object' && !Array.isArray(baseVal)) {
        (result as Record<string, unknown>)[key as string] = deepMerge(
          baseVal as Record<string, unknown>,
          overrideVal as Record<string, unknown>,
        );
        continue;
      }
    }
    if (overrideVal !== undefined) {
      (result as Record<string, unknown>)[key as string] = overrideVal;
    }
  }
  return result;
}
