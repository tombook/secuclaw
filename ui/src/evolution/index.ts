/**
 * SecuClaw Evolution System — 统一导出
 * 
 * Phase 1: Memory Foundation ✅
 * Phase 2: Skill Evolution + RoleBridge ✅
 * Phase 3: Context Compression ✅
 * Phase 4: Insights + Usage Tracking ✅
 */

// ─── 核心门面 ─────────────────────────────────────────────────
export { EvolutionFacade } from './facade';
export { EvolutionService, evolutionService } from './evolution-service';

// ─── Gateway Hooks ─────────────────────────────────────────────
export {
  evolutionOnUserMessage,
  evolutionOnToolCall,
  evolutionOnTurnComplete,
  evolutionOnRoleSwitch,
  evolutionAddMemory,
  evolutionReadMemory,
  evolutionPublishBridgeEvent,
  evolutionTriggerReview,
  evolutionGetStatus,
  evolutionGetConfig,
  evolutionUpdateConfig,
  evolutionGetMemoryToolSchema,
  evolutionGetSkillToolSchema,
} from './evolution-hooks';

// ─── Memory ───────────────────────────────────────────────────
export { MemoryStore } from './memory/memory-store';
export { MemoryManager } from './memory/memory-manager';
export { MemoryProvider } from './memory/memory-provider';

// ─── Skill ────────────────────────────────────────────────────
export { SkillStore } from './skill/skill-store';
export { SkillManager } from './skill/skill-manager';
export { SkillScanner, getSkillScanner } from './skill/skill-scanner';

// ─── Nudge ────────────────────────────────────────────────────
export { NudgeTracker } from './nudge/nudge-tracker';
export { REVIEW_PROMPTS } from './nudge/review-prompts';
export type { ReviewPromptType } from './nudge/review-prompts';
export { BackgroundReviewer } from './nudge/background-reviewer';

// ─── RoleBridge ───────────────────────────────────────────────
export { RoleBridge, DEFAULT_SHARE_POLICIES } from './bridge/role-bridge';

// ─── Context ─────────────────────────────────────────────────
export { ContextCompressor } from './context/compressor';
export { DefaultContextEngine, ContextEngine } from './context/context-engine';
export {
  estimateMessageTokens,
  estimateTextTokens,
  estimateMessagesTokens,
  getModelContextLength,
  computeSummaryBudget,
} from './context/token-estimator';

// ─── Insights ─────────────────────────────────────────────────
export { UsageTracker, type UsageRecord, type ToolUsageRecord } from './insights/usage-tracker';
export { InsightsEngine } from './insights/insights-engine';

// ─── Database ─────────────────────────────────────────────────
export { EvolutionDB, getEvolutionDB, STORES } from './db';
export {
  putMemory,
  getMemoriesByRole,
  putSkill,
  getSkillsByRole,
  getSkillByName,
  getNudgeState,
  saveNudgeState,
  logEvolution,
} from './db';

// ─── Config ───────────────────────────────────────────────────
export { DEFAULT_EVOLUTION_CONFIG, loadEvolutionConfig, saveEvolutionConfig } from './config';

// ─── Types ────────────────────────────────────────────────────
export type {
  MemoryCategory,
  MemoryTarget,
  MemorySource,
  MemoryEntry,
  AddResult,
  ReplaceResult,
  RemoveResult,
  SkillSource,
  SkillTrustLevel,
  SkillScanStatus,
  EvolvedSkill,
  CreateSkillInput,
  PatchOptions,
  SkillResult,
  ScanResult,
  ChatMessage,
  ContentBlock,
  ToolCall,
  NudgeState,
  ReviewType,
  ReviewResult,
  ToolCallAction,
  InsightsReport,
  RoleInsights,
  EvolutionLogType,
  EvolutionLogEntry,
  EvolutionConfig,
  BridgeEventType,
  BridgeEvent,
  SharePolicy,
  CompressionResult,
} from './types';
