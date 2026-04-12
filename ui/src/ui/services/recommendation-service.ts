import type { RoleId } from '../config/role-themes.js';

export interface SecurityEvent {
  type: 'vulnerability' | 'incident' | 'compliance' | 'threat-intel' | 'supply-chain';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  timestamp: number;
  relatedRole?: RoleId;
}

export type NavigationAction = {
  type: 'navigate';
  path: string;
};

export type ActionHandler = NavigationAction;

export interface Recommendation {
  id: string;
  type: 'role' | 'scenario';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  roleId?: RoleId;
  scenarioId?: string;
  action: ActionHandler;
  dismissible: boolean;
  createdAt: number;
}

export interface RecommendationContext {
  currentRole: RoleId | null;
  securityEvents: SecurityEvent[];
  activeIncidents: number;
  criticalVulnerabilities: number;
  pendingComplianceTasks: number;
  supplyChainAlerts: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

type RecommendationHandler = (context: RecommendationContext) => Recommendation[];

class RecommendationService {
  private handlers: Map<string, RecommendationHandler> = new Map();
  private recommendations: Recommendation[] = [];
  private listeners: Set<(recs: Recommendation[]) => void> = new Set();

  constructor() {
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers() {
    this.registerHandler('vulnerability-critical', (ctx) => {
      if (ctx.criticalVulnerabilities > 0) {
        return [{
          id: `vuln-${Date.now()}`,
          type: 'role' as const,
          priority: 'high' as const,
          title: '发现高危漏洞',
          description: `当前有 ${ctx.criticalVulnerabilities} 个高危漏洞需要处理`,
          roleId: 'security-expert' as RoleId,
          scenarioId: 'vulnerability-response',
          action: { type: 'navigate', path: '/vulnerabilities' },
          dismissible: true,
          createdAt: Date.now(),
        }];
      }
      return [];
    });

    this.registerHandler('incident-massive', (ctx) => {
      if (ctx.activeIncidents > 5) {
        return [{
          id: `incident-${Date.now()}`,
          type: 'role' as const,
          priority: 'high' as const,
          title: '多起活跃安全事件',
          description: `当前有 ${ctx.activeIncidents} 起活跃安全事件需要协调`,
          roleId: 'secuclaw-commander' as RoleId,
          scenarioId: 'crisis-management',
          action: { type: 'navigate', path: '/incidents' },
          dismissible: true,
          createdAt: Date.now(),
        }];
      }
      return [];
    });

    this.registerHandler('compliance-audit', (ctx) => {
      if (ctx.pendingComplianceTasks > 3) {
        return [{
          id: `compliance-${Date.now()}`,
          type: 'scenario' as const,
          priority: 'medium' as const,
          title: '合规审计周期',
          description: `当前有 ${ctx.pendingComplianceTasks} 项合规任务待处理`,
          roleId: 'privacy-officer' as RoleId,
          scenarioId: 'compliance-audit',
          action: { type: 'navigate', path: '/compliance' },
          dismissible: true,
          createdAt: Date.now(),
        }];
      }
      return [];
    });

    this.registerHandler('supply-chain-alert', (ctx) => {
      if (ctx.supplyChainAlerts > 0) {
        return [{
          id: `supply-${Date.now()}`,
          type: 'role' as const,
          priority: 'medium' as const,
          title: '供应链安全告警',
          description: `当前有 ${ctx.supplyChainAlerts} 项供应链告警需要处理`,
          roleId: 'supply-chain-security' as RoleId,
          scenarioId: 'supply-chain-review',
          action: { type: 'navigate', path: '/supply-chain' },
          dismissible: true,
          createdAt: Date.now(),
        }];
      }
      return [];
    });
  }

  registerHandler(id: string, handler: RecommendationHandler) {
    this.handlers.set(id, handler);
  }

  async generateRecommendations(context: RecommendationContext): Promise<Recommendation[]> {
    const results: Recommendation[] = [];
    
    for (const handler of this.handlers.values()) {
      try {
        const recs = await handler(context);
        if (recs && Array.isArray(recs)) {
          results.push(...recs);
        }
      } catch (e) {
        console.warn('Recommendation handler error, skipping:', e);
      }
    }

    // 按优先级排序
    results.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // 如果没有任何推荐，返回默认推荐
    if (results.length === 0) {
      results.push({
        id: `default-${Date.now()}`,
        type: 'role',
        priority: 'low',
        title: '欢迎使用 SecuClaw',
        description: '选择一个角色开始您的安全之旅',
        roleId: 'security-expert',
        scenarioId: 'overview',
        action: { type: 'navigate', path: '/dashboard' },
        dismissible: false,
        createdAt: Date.now(),
      });
    }

    // 只保留前3个
    this.recommendations = results.slice(0, 3);
    this.notifyListeners();
    
    return this.recommendations;
  }

  dismissRecommendation(id: string) {
    this.recommendations = this.recommendations.filter(r => r.id !== id);
    this.notifyListeners();
  }

  subscribe(listener: (recs: Recommendation[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.recommendations);
    }
  }

  getCurrentRecommendations(): Recommendation[] {
    return this.recommendations;
  }
}

export const recommendationService = new RecommendationService();
