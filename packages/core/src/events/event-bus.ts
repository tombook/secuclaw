import 'reflect-metadata';
import { Service } from 'typedi';
import type { EventMap, EventName, EventHandler } from './types.js';

@Service()
export class EventBus {
  private handlers = new Map<string, Set<EventHandler<any>>>();

  on<K extends EventName>(event: K, handler: EventHandler<EventMap[K]>): () => void {
    const key = event as string;
    let bucket = this.handlers.get(key);
    if (!bucket) {
      bucket = new Set<EventHandler<any>>();
      this.handlers.set(key, bucket);
    }
    bucket.add(handler as EventHandler<any>);
    return () => {
      bucket!.delete(handler as EventHandler<any>);
    };
  }

  once<K extends EventName>(event: K, handler: EventHandler<EventMap[K]>): () => void {
    let wrapper: EventHandler<EventMap[K]>;
    wrapper = async (payload: EventMap[K]) => {
      try {
        await handler(payload);
      } catch (err) {
        console.error('[EventBus] error in once handler', err);
      } finally {
        this.off(event, wrapper as any);
      }
    };
    return this.on(event, wrapper as EventHandler<EventMap[K]>);
  }

  off<K extends EventName>(event: K, handler: EventHandler<EventMap[K]>): void {
    const bucket = this.handlers.get(event as string);
    if (!bucket) return;
    bucket.delete(handler as any);
  }

  async emit<K extends EventName>(event: K, payload: EventMap[K]): Promise<void> {
    const bucket = this.handlers.get(event as string);
    if (!bucket || bucket.size === 0) return;
    const promises = Array.from(bucket).map((handler) => (handler as EventHandler<any>)(payload));
    const results = await Promise.allSettled(promises);
    for (const r of results) {
      if (r.status === 'rejected') {
        console.error('[EventBus] handler threw an error', (r as any).reason);
      }
    }
  }

  handlerCount(event: EventName): number {
    const bucket = this.handlers.get(event as string);
    return bucket?.size ?? 0;
  }
  removeAllHandlers(): void {
    this.handlers.clear();
  }
}
