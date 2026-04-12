import 'reflect-metadata';
import { Service, Inject } from 'typedi';
import type { EventName, EventMap } from './types.js';
import { EventRule, EventRuleContext, EventMiddleware, MiddlewareChain, EventMiddlewareContext } from './rule.js';
import { EventBus } from './event-bus.js';

@Service()
export class EventSystem {
  private rules: EventRule[] = [];
  private middlewareChain = new MiddlewareChain();
  private eventSubscriptions: Array<() => void> = [];
  private registeredEvents: Set<EventName> = new Set();

  constructor(@Inject(() => EventBus) private eventBus: EventBus) {}

  registerRule(rule: EventRule): void {
    this.rules.push(rule);
    for (const event of rule.events) {
      if (!this.registeredEvents.has(event)) {
        this.registeredEvents.add(event);
        const unsub = this.eventBus.on(event, async (payload: any) => {
          await this.processEvent(event, payload);
        });
        this.eventSubscriptions.push(unsub);
      }
    }
  }

  unregisterRule(name: string): void {
    this.rules = this.rules.filter((r) => r.name !== name);
  }

  useMiddleware(mw: EventMiddleware): void {
    this.middlewareChain.use(mw);
  }

  getRules(): EventRule[] {
    return [...this.rules];
  }

  getMiddleware(): EventMiddleware[] {
    return this.middlewareChain.getMiddleware();
  }

  async processEvent<K extends EventName>(
    event: K,
    payload: EventMap[K]
  ): Promise<void> {
    const context: EventMiddlewareContext = { event, payload };
    await this.middlewareChain.execute(context);
    await this.executeRules(event, payload);
  }

  private async executeRules<K extends EventName>(
    event: K,
    payload: EventMap[K]
  ): Promise<void> {
    const ruleContext: EventRuleContext = {
      emit: (e, p) => this.eventBus.emit(e, p),
    };

    for (const rule of this.rules) {
      if (rule.shouldExecute(event)) {
        try {
          await rule.execute(event, payload, ruleContext);
        } catch (err) {
          console.error(`[EventSystem] Rule "${rule.name}" error:`, err);
        }
      }
    }
  }

  dispose(): void {
    for (const unsub of this.eventSubscriptions) {
      unsub();
    }
    this.eventSubscriptions = [];
    this.registeredEvents.clear();
  }
}