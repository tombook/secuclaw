import type { RaciAssignment, RoleId, ScenarioType } from './types.js';
import { RACI_SCENARIO_MAP } from './types.js';

export interface RaciSubscription {
  clientId: string;
  roleId: RoleId;
  events: string[];
}

export class RaciEventRouter {
  private subscriptions: Map<string, RaciSubscription> = new Map();

  subscribe(clientId: string, roleId: RoleId, events: string[]): void {
    this.subscriptions.set(clientId, { clientId, roleId, events });
  }

  unsubscribe(clientId: string): void {
    this.subscriptions.delete(clientId);
  }

  getSubscribersForRole(roleId: RoleId): RaciSubscription[] {
    return Array.from(this.subscriptions.values()).filter(s => s.roleId === roleId);
  }

  routeEvent(eventType: string, scenario: ScenarioType): Map<RoleId, string> {
    const notifications = new Map<RoleId, string>();
    const roleMap = RACI_SCENARIO_MAP[scenario];
    if (!roleMap) return notifications;

    for (const [role, raci] of Object.entries(roleMap)) {
      const roleId = role as RoleId;
      switch (raci) {
        case 'R':
          notifications.set(roleId, `${eventType}:task`);
          break;
        case 'A':
          notifications.set(roleId, `${eventType}:decision`);
          break;
        case 'C':
          notifications.set(roleId, `${eventType}:consult`);
          break;
        case 'I':
          notifications.set(roleId, `${eventType}:info`);
          break;
      }
    }

    return notifications;
  }

  getRolesForScenario(scenario: ScenarioType, filter?: RaciAssignment): RoleId[] {
    const roleMap = RACI_SCENARIO_MAP[scenario];
    if (!roleMap) return [];
    if (!filter) return Object.keys(roleMap) as RoleId[];
    return Object.entries(roleMap).filter(([, v]) => v === filter).map(([k]) => k as RoleId);
  }
}
