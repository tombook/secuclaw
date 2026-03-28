interface EventBusLike {
  emit(event: string, payload: unknown): Promise<void>;
  on?(event: string, handler: (payload: any) => Promise<void>): () => void;
}

export interface ConsumerConfig {
  consumerId: string;
  eventTypes: string[];
  handler: (payload: unknown) => Promise<void>;
  maxRetries?: number;
  retryBackoffMs?: number;
}

interface ConsumerState {
  config: ConsumerConfig;
  processedCount: number;
  errorCount: number;
  lastProcessedAt: number | null;
  status: 'active' | 'paused' | 'error';
}

const logger = {
  info: (...args: any[]) => console.log('[EventConsumer]', ...args),
  error: (...args: any[]) => console.error('[EventConsumer]', ...args),
};

export class NotificationEventConsumer {
  private consumers: Map<string, ConsumerState> = new Map();
  private eventBus: EventBusLike | null = null;

  setEventBus(bus: EventBusLike): void {
    this.eventBus = bus;
  }

  registerConsumer(config: ConsumerConfig): string {
    if (this.consumers.has(config.consumerId)) {
      throw new Error(`Consumer already registered: ${config.consumerId}`);
    }
    this.consumers.set(config.consumerId, {
      config,
      processedCount: 0,
      errorCount: 0,
      lastProcessedAt: null,
      status: 'active',
    });
    this.bindConsumer(config);
    return config.consumerId;
  }

  unregisterConsumer(consumerId: string): void {
    this.consumers.delete(consumerId);
  }

  getConsumerStatus(consumerId: string): ConsumerState | null {
    return this.consumers.get(consumerId) ?? null;
  }

  listConsumers(): Array<{ consumerId: string; status: string; processedCount: number }> {
    return Array.from(this.consumers.entries()).map(([id, state]) => ({
      consumerId: id,
      status: state.status,
      processedCount: state.processedCount,
    }));
  }

  async processEvent(eventType: string, payload: unknown): Promise<void> {
    for (const [id, state] of this.consumers) {
      if (state.status !== 'active') continue;
      if (!state.config.eventTypes.includes(eventType) && !state.config.eventTypes.includes('*')) continue;

      const maxRetries = state.config.maxRetries ?? 1;
      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          await state.config.handler(payload);
          state.processedCount++;
          state.lastProcessedAt = Date.now();
          break;
        } catch (err) {
          attempt++;
          state.errorCount++;
          if (attempt >= maxRetries) {
            state.status = 'error';
            logger.error(`Consumer ${id} failed after ${maxRetries} attempts:`, err);
          } else {
            const backoff = state.config.retryBackoffMs ?? 1000;
            await new Promise(resolve => setTimeout(resolve, backoff * attempt));
          }
        }
      }
    }
  }

  private bindConsumer(config: ConsumerConfig): void {
    if (!this.eventBus?.on) return;
    for (const eventType of config.eventTypes) {
      this.eventBus.on(eventType, async (payload: unknown) => {
        await this.processEvent(eventType, payload);
      });
    }
  }
}
