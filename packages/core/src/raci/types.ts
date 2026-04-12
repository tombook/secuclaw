export type TaskStatus = 'created' | 'assigned' | 'in_progress' | 'pending_handoff' | 'completed' | 'escalated';
export type RaciAssignment = 'R' | 'A' | 'C' | 'I';
export type ScenarioType = 'incident-response' | 'vulnerability-management' | 'threat-hunting' | 'compliance-audit' | 'security-assessment';
export type RoleId = 'security-expert' | 'privacy-officer' | 'security-architect' | 'business-security-officer' | 'secuclaw-commander' | 'ciso' | 'security-ops' | 'supply-chain-security';

export interface WorkflowStep {
  id: string;
  title: string;
  description?: string;
  type: 'manual' | 'automated' | 'approval';
  dependsOn?: string[];
  skillId?: string;
  assignedRole?: RoleId;
}

export interface RaciWorkflowTemplate {
  id: string;
  roleId: RoleId;
  scenario: ScenarioType;
  raciType: RaciAssignment;
  title: string;
  description?: string;
  triggerConditions: string[];
  steps: WorkflowStep[];
}

export interface RaciTask {
  id: string;
  sessionId: string;
  title: string;
  description?: string;
  scenario: ScenarioType;
  assignedRole: RoleId;
  assignedBy?: string;
  status: TaskStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  eventId?: string;
  eventType?: 'incident' | 'vulnerability' | 'threat';
  nextRole?: RoleId;
  escalationLevel?: number;
  parentTaskId?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  metadata?: Record<string, unknown>;
}

export interface WarRoomSession {
  id: string;
  title: string;
  scenario: ScenarioType;
  eventId?: string;
  eventType?: 'incident' | 'vulnerability' | 'threat';
  status: 'active' | 'paused' | 'closed';
  participants: Array<{ roleId: RoleId; joinedAt: number; userId?: string }>;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
}

export interface TimelineEvent {
  id: string;
  sessionId: string;
  type: 'task_created' | 'task_assigned' | 'task_updated' | 'task_completed' | 'task_handoff' | 'task_escalated' | 'message' | 'participant_joined' | 'participant_left' | 'session_created' | 'session_closed';
  actor: string;
  actorRole?: RoleId;
  data?: Record<string, unknown>;
  timestamp: number;
}

export const ROLE_HIERARCHY: Record<string, string[]> = {
  'secuclaw-commander': [],
  'ciso': ['secuclaw-commander'],
  'security-ops': ['secuclaw-commander'],
  'security-expert': ['security-ops', 'ciso'],
  'security-architect': ['ciso'],
  'privacy-officer': ['ciso'],
  'business-security-officer': ['ciso'],
  'supply-chain-security': ['security-expert'],
};

export const EVENT_TYPE_TO_SCENARIO: Record<string, ScenarioType> = {
  'incident': 'incident-response',
  'vulnerability': 'vulnerability-management',
  'threat': 'threat-hunting',
};

export const RACI_SCENARIO_MAP: Record<ScenarioType, Record<RoleId, RaciAssignment>> = {
  'incident-response': {
    'security-expert': 'R',
    'secuclaw-commander': 'A',
    'ciso': 'C',
    'security-ops': 'I',
    'privacy-officer': 'C',
    'security-architect': 'I',
    'business-security-officer': 'I',
    'supply-chain-security': 'I',
  },
  'vulnerability-management': {
    'security-expert': 'R',
    'security-architect': 'A',
    'privacy-officer': 'C',
    'ciso': 'I',
    'secuclaw-commander': 'I',
    'security-ops': 'C',
    'business-security-officer': 'I',
    'supply-chain-security': 'I',
  },
  'threat-hunting': {
    'security-ops': 'R',
    'security-expert': 'A',
    'secuclaw-commander': 'C',
    'ciso': 'I',
    'privacy-officer': 'I',
    'security-architect': 'I',
    'business-security-officer': 'I',
    'supply-chain-security': 'I',
  },
  'compliance-audit': {
    'privacy-officer': 'R',
    'ciso': 'A',
    'security-architect': 'C',
    'business-security-officer': 'I',
    'security-expert': 'I',
    'secuclaw-commander': 'I',
    'security-ops': 'I',
    'supply-chain-security': 'I',
  },
  'security-assessment': {
    'security-architect': 'R',
    'ciso': 'A',
    'security-expert': 'C',
    'business-security-officer': 'I',
    'privacy-officer': 'I',
    'secuclaw-commander': 'I',
    'security-ops': 'C',
    'supply-chain-security': 'C',
  },
};
