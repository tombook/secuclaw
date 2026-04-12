import { roleContext } from '../store/role-context.js';
import type { RoleId, RoleProfile } from '../store/role-context.js';

type FilterOperator = 'equals' | 'contains' | 'in' | 'gte' | 'lte';

interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
}

interface DataFilter {
  capabilities?: string[];
  mitreTactics?: string[];
  scfDomains?: string[];
  conditions?: FilterCondition[];
}

interface FilterResult<T> {
  data: T[];
  meta: {
    total: number;
    filtered: number;
    role: RoleId;
  };
}

class RoleFilterService {
  private filterCache = new Map<string, { timestamp: number; result: any }>();

  filterByRole<T extends Record<string, any>>(data: T[], filter?: DataFilter): FilterResult<T> {
    const currentRole = roleContext.getState().currentRole;
    if (!currentRole) {
      return { data, meta: { total: data.length, filtered: data.length, role: 'security-expert' } };
    }

    const profile = roleContext.getState().roleProfile;
    if (!profile) {
      return { data, meta: { total: data.length, filtered: data.length, role: currentRole } };
    }

    let filtered = data;

    // Apply capability-based filtering
    if (filter?.capabilities?.length) {
      filtered = this.applyCapabilityFilter(filtered, profile, filter.capabilities);
    }

    // Apply MITRE-based filtering
    if (filter?.mitreTactics?.length) {
      filtered = this.applyMitreFilter(filtered, profile, filter.mitreTactics);
    }

    // Apply SCF-based filtering
    if (filter?.scfDomains?.length) {
      filtered = this.applyScfFilter(filtered, profile, filter.scfDomains);
    }

    // Apply custom conditions
    if (filter?.conditions?.length) {
      filtered = this.applyConditions(filtered, filter.conditions);
    }

    return {
      data: filtered,
      meta: {
        total: data.length,
        filtered: filtered.length,
        role: currentRole,
      },
    };
  }

  private applyCapabilityFilter<T extends Record<string, any>>(
    data: T[],
    profile: RoleProfile,
    capabilities: string[]
  ): T[] {
    const { capabilities: roleCapabilities } = profile;
    const allCapabilities = [
      ...roleCapabilities.light,
      ...roleCapabilities.dark,
      ...roleCapabilities.security,
      ...roleCapabilities.legal,
      ...roleCapabilities.technology,
      ...roleCapabilities.business,
    ];

    return data.filter((item) => {
      const itemCategories = this.getItemCategories(item);
      return capabilities.some((cap) => allCapabilities.includes(cap) && itemCategories.includes(cap));
    });
  }

  private applyMitreFilter<T extends Record<string, any>>(
    data: T[],
    profile: RoleProfile,
    tactics: string[]
  ): T[] {
    const { mitreCoverage } = profile;
    const relevantTactics = tactics.filter((t) => mitreCoverage.includes(t));

    if (relevantTactics.length === 0) {
      return data;
    }

    return data.filter((item) => {
      const itemTactics = this.getItemMitreTactics(item);
      return relevantTactics.some((t) => itemTactics.includes(t));
    });
  }

  private applyScfFilter<T extends Record<string, any>>(
    data: T[],
    profile: RoleProfile,
    domains: string[]
  ): T[] {
    const { scfCoverage } = profile;
    const relevantDomains = domains.filter((d) => scfCoverage.includes(d));

    if (relevantDomains.length === 0) {
      return data;
    }

    return data.filter((item) => {
      const itemDomains = this.getItemScfDomains(item);
      return relevantDomains.some((d) => itemDomains.includes(d));
    });
  }

  private applyConditions<T extends Record<string, any>>(
    data: T[],
    conditions: FilterCondition[]
  ): T[] {
    return data.filter((item) => {
      return conditions.every((condition) => {
        const value = this.getNestedValue(item, condition.field);
        return this.evaluateCondition(value, condition.operator, condition.value);
      });
    });
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateCondition(value: any, operator: FilterOperator, target: any): boolean {
    switch (operator) {
      case 'equals':
        return value === target;
      case 'contains':
        return String(value).includes(String(target));
      case 'in':
        return Array.isArray(target) && target.includes(value);
      case 'gte':
        return value >= target;
      case 'lte':
        return value <= target;
      default:
        return true;
    }
  }

  private getItemCategories(item: Record<string, any>): string[] {
    return item.categories || item.capabilities || [];
  }

  private getItemMitreTactics(item: Record<string, any>): string[] {
    return item.mitreTactics || item.mitre_attck || [];
  }

  private getItemScfDomains(item: Record<string, any>): string[] {
    return item.scfDomains || item.complianceDomains || [];
  }

  getRoleBasedPriority(roleId: RoleId): Record<string, number> {
    const priorityMap: Record<RoleId, Record<string, number>> = {
      'security-expert': {
        vulnerability: 100,
        incident: 70,
        task: 50,
      },
      'privacy-officer': {
        privacy: 100,
        compliance: 90,
        incident: 60,
      },
      'security-architect': {
        architecture: 100,
        design: 90,
        vulnerability: 70,
      },
      'business-security-officer': {
        business: 100,
        incident: 80,
        risk: 70,
      },
      'secuclaw-commander': {
        alert: 100,
        incident: 90,
        vulnerability: 80,
      },
      'ciso': {
        executive: 100,
        report: 90,
        compliance: 80,
      },
      'security-ops': {
        alert: 100,
        incident: 90,
        forensic: 80,
      },
      'supply-chain-security': {
        vendor: 100,
        dependency: 90,
        license: 80,
      },
    };

    return priorityMap[roleId] || {};
  }

  sortByRolePriority<T extends Record<string, any>>(items: T[], roleId: RoleId): T[] {
    const priorityMap = this.getRoleBasedPriority(roleId);
    return [...items].sort((a, b) => {
      const priorityA = this.getItemPriority(a, priorityMap);
      const priorityB = this.getItemPriority(b, priorityMap);
      return priorityB - priorityA;
    });
  }

  private getItemPriority(item: Record<string, any>, priorityMap: Record<string, number>): number {
    const categories = this.getItemCategories(item);
    let maxPriority = 0;
    for (const cat of categories) {
      const p = priorityMap[cat];
      if (p && p > maxPriority) {
        maxPriority = p;
      }
    }
    return maxPriority;
  }

  clearCache(): void {
    this.filterCache.clear();
  }
}

export const roleFilterService = new RoleFilterService();
export type { DataFilter, FilterCondition, FilterResult, FilterOperator };
