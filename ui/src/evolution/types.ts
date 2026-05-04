/**
 * SecuClaw Evolution System — 类型定义
 * 
 * 对标 Hermes Agent 的进化相关类型，适配浏览器端 TypeScript
 */

import type { RoleId } from '../config/role-tool-config';

// ─── Memory Types ─────────────────────────────────────────────

export type MemoryCategory = 'preference' | 'insight' | 'pattern' | 'correction' | 'lesson';
export type MemoryTarget = 'memory' | 'user';
export type MemorySource = 'auto' | 'manual' | 'review';

export interface MemoryEntry {
  id?: number;                   // IndexedDB autoIncrement
  target: MemoryTarget;          // memory 或 user
  role: RoleId;                  // 绑定安全角色
  category: MemoryCategory;
  content: string;               // 条目文本（§ 分隔）
  tags: string[];
  confidence: number;            // 0-1
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number;
  source: MemorySource;
  turnCount: number;
}

export interface AddResult {
  success: boolean;
  message: string;
  entry?: MemoryEntry;
  error?: string;
}

export interface ReplaceResult {
  success: boolean;
  message: string;
  oldContent?: string;
  newContent?: string;
  error?: string;
}

export interface RemoveResult {
  success: boolean;
  message: string;
  removedContent?: string;
  error?: string;
}

// ─── Skill Types ──────────────────────────────────────────────

export type SkillSource = 'builtin' | 'hub' | 'evolved';
export type SkillTrustLevel = 'builtin' | 'trusted' | 'community';
export type SkillScanStatus = 'passed' | 'failed' | 'pending';

export interface EvolvedSkill {
  id?: number;
  name: string;
  description: string;
  role: RoleId;
  source: SkillSource;
  version: number;
  trustLevel: SkillTrustLevel;

  // 核心内容（对标 Hermes SKILL.md）
  frontmatter: {
    name: string;
    description: string;
    tags?: string[];
    [key: string]: unknown;
  };
  body: string;

  // 元数据
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number;
  usageCount: number;
  successCount: number;

  // 进化历史
  improvementHistory: Array<{
    version: number;
    change: string;
    reason: string;
    timestamp: number;
  }>;

  // 安全扫描
  scanStatus: SkillScanStatus;
  lastScanAt: number;

  // 附件
  files?: Array<{
    path: string;       // e.g. "references/example.md"
    content: string;
    size: number;
  }>;
}

export interface CreateSkillInput {
  name: string;
  description: string;
  role: RoleId;
  content: string;         // 完整 SKILL.md（frontmatter + body）
  category?: string;
}

export interface PatchOptions {
  filePath?: string;
  replaceAll?: boolean;
}

export interface SkillResult {
  success: boolean;
  message: string;
  path?: string;
  skill?: EvolvedSkill;
  error?: string;
}

export interface ScanResult {
  passed: boolean;
  threats: Array<{ pattern: string; type: string; match: string }>;
  reason?: string;
}

// ─── Context Types ────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | ContentBlock[];
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ContentBlock {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

// ─── Nudge Types ──────────────────────────────────────────────

export interface NudgeState {
  id: string;               // 固定 "current"
  turnsSinceMemory: number;
  itersSinceSkill: number;
  turnsSinceContextCheck: number;
  lastMemoryReview: number;
  lastSkillReview: number;
  lastContextCheck: number;
}

// ─── Review Types ─────────────────────────────────────────────

export type ReviewType = 'memory' | 'skill' | 'combined';

export interface ReviewResult {
  type: ReviewType;
  actions: Array<{
    tool: 'memory' | 'skill_manage';
    action: string;
    args: Record<string, unknown>;
    success: boolean;
    message: string;
  }>;
  summary: string;
}

export interface ToolCallAction {
  name: 'memory' | 'skill_manage';
  arguments: Record<string, unknown>;
}

// ─── Insights Types ────────────────────────────────────────────

export interface InsightsReport {
  period: { start: string; end: string };
  summary: {
    totalTurns: number;
    totalToolCalls: number;
    estimatedTokens: { input: number; output: number };
    estimatedCost: number;
    skillsCreated: number;
    memoriesSaved: number;
    compressionsPerformed: number;
  };
  byRole: Partial<Record<RoleId, RoleInsights>>;
  topTools: Array<{ name: string; count: number; role: RoleId }>;
  evolutionActivity: {
    skillsCreated: number;
    skillsUpdated: number;
    memoriesAdded: number;
    reviewsTriggered: number;
  };
}

export interface RoleInsights {
  turns: number;
  toolCalls: number;
  topSkills: string[];
  memoriesAdded: number;
}

// ─── Evolution Log ────────────────────────────────────────────

export type EvolutionLogType = 'memory_add' | 'memory_replace' | 'memory_remove'
  | 'skill_create' | 'skill_edit' | 'skill_patch' | 'skill_delete'
  | 'review_triggered' | 'review_completed' | 'compression'
  | 'nudge_memory' | 'nudge_skill' | 'nudge_context';

export interface EvolutionLogEntry {
  id?: number;
  type: EvolutionLogType;
  role: RoleId;
  timestamp: number;
  details: string;
  metadata?: Record<string, unknown>;
}

// ─── Config ───────────────────────────────────────────────────

export interface EvolutionConfig {
  memory: {
    enabled: boolean;
    nudgeInterval: number;
    memoryCharLimit: number;
    userCharLimit: number;
    flushMinTurns: number;
  };
  skills: {
    evolutionEnabled: boolean;
    creationNudgeInterval: number;
    guardAgentCreated: boolean;
    maxSkillsPerRole: number;
    maxContentChars: number;
    maxFileBytes: number;
  };
  context: {
    compressionEnabled: boolean;
    thresholdPercent: number;
    protectFirstN: number;
    protectLastN: number;
    summaryRatio: number;
    summaryTokenCeiling: number;
    failureCooldownSeconds: number;
  };
  review: {
    maxIterations: number;
    quietMode: boolean;
  };
  insights: {
    enabled: boolean;
    trackingDays: number;
  };
}

// ─── RoleBridge Types ─────────────────────────────────────────

/**
 * 跨角色事件类型
 * SecuClaw 独有，Hermes 无对应实现
 */
export type BridgeEventType =
  | 'vulnerability_found'       // 安全专家发现漏洞
  | 'compliance_gap'           // 隐私官发现合规缺口
  | 'risk_accepted'            // CISO 审批了风险
  | 'strategy_defined'         // Commander 定义了战略
  | 'incident_detected'         // 安全运营官检测到事件
  | 'supply_chain_alert'        // 供应链安全官发出警报
  | 'architecture_review'       // 安全架构师完成架构评审
  | 'business_impact'          // 业务安全官评估了业务影响
  | 'raci_phase_complete';     // RACI 阶段完成通知

export interface BridgeEvent {
  id?: number;               // IndexedDB autoIncrement
  type: BridgeEventType;
  sourceRole: RoleId;         // 事件发布者
  targetRoles: RoleId[];      // 定向目标（空=广播）
  timestamp: number;
  summary: string;            // LLM 压缩后的摘要（唯一共享内容）
  metadata?: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    eventId?: string;         // 关联安全事件 ID
    warRoomId?: string;       // 关联作战室 ID
    confidence?: number;
  };
}

export interface SharePolicy {
  trigger: BridgeEventType;
  sourceRole: RoleId;
  targetRoles: RoleId[];
  transform: 'summarize' | 'pass_through' | 'filter';
  enabled: boolean;
}

export interface RoleBridgeConfig {
  policies: SharePolicy[];
  maxEventsPerRole: number;  // 每个角色最多保留多少历史事件
  ttlHours: number;         // 事件保留时长（小时）
}
