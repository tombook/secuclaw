import type { EventName, EventMap } from './types.js';

export interface EventRuleContext {
  emit<K extends EventName>(event: K, payload: EventMap[K]): Promise<void>;
}

export interface EventRule {
  readonly name: string;
  readonly events: EventName[];
  execute(
    event: EventName,
    payload: EventMap[EventName],
    context: EventRuleContext
  ): Promise<void>;
  shouldExecute(event: EventName): boolean;
}

export function createEventRule(
  name: string,
  events: EventName[],
  execute: (event: EventName, payload: EventMap[EventName], context: EventRuleContext) => Promise<void>
): EventRule {
  return {
    name,
    events,
    execute,
    shouldExecute(event: EventName): boolean {
      return events.includes(event);
    },
  };
}

export interface EventMiddlewareContext {
  event: EventName;
  payload: unknown;
}

export interface EventMiddleware {
  readonly name: string;
  readonly priority: number;

  process(
    context: EventMiddlewareContext,
    next: () => Promise<void>
  ): Promise<void>;
}

export class MiddlewareChain {
  private middleware: EventMiddleware[] = [];

  use(mw: EventMiddleware): void {
    this.middleware.push(mw);
    this.middleware.sort((a, b) => b.priority - a.priority);
  }

  async execute(context: EventMiddlewareContext): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= this.middleware.length) return;
      const mw = this.middleware[index++];
      await mw.process(context, next);
    };

    await next();
  }

  getMiddleware(): EventMiddleware[] {
    return [...this.middleware];
  }
}
