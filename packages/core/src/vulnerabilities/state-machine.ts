import type { Vulnerability } from './repository.js';

export type VulnStatus = Vulnerability['remediation']['status'];

interface TransitionRule {
  from: VulnStatus;
  to: VulnStatus[];
}

const TRANSITIONS: TransitionRule[] = [
  { from: 'open', to: ['in_progress', 'accepted'] },
  { from: 'in_progress', to: ['mitigated', 'resolved', 'open'] },
  { from: 'mitigated', to: ['resolved', 'open', 'in_progress'] },
  { from: 'resolved', to: ['open'] },
  { from: 'accepted', to: ['open'] },
];

export class VulnStateMachine {
  private static transitionMap = new Map<VulnStatus, VulnStatus[]>(
    TRANSITIONS.map(rule => [rule.from, rule.to])
  );

  /** Check if a transition is valid */
  static canTransition(from: VulnStatus, to: VulnStatus): boolean {
    if (from === to) return true; // idempotent
    const allowed = this.transitionMap.get(from);
    return allowed ? allowed.includes(to) : false;
  }

  /** Validate and throw if transition is invalid */
  static validateTransition(from: VulnStatus, to: VulnStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Invalid vulnerability status transition: ${from} → ${to}. ` +
        `Allowed transitions from '${from}': [${this.transitionMap.get(from)?.join(', ') || 'none'}]`
      );
    }
  }

  /** Get all valid next statuses from current status */
  static getNextStatuses(current: VulnStatus): VulnStatus[] {
    return this.transitionMap.get(current) || [];
  }

  /** Get all possible statuses */
  static getAllStatuses(): VulnStatus[] {
    return ['open', 'in_progress', 'mitigated', 'resolved', 'accepted'];
  }
}
