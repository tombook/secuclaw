/**
 * Redis 广播适配器（Phase 14：集群模式）
 *
 * 通过 Redis pub/sub 实现 WebSocket 消息的跨实例广播：
 * 1. 本实例 broadcast → localBroadcast（本机客户端）+ publish（通知其他实例）
 * 2. 其他实例 publish → 本实例 subscriber → localBroadcast（本机客户端）
 *
 * 使用独立的订阅连接（ioredis 限制：subscribe 后不能执行其他命令）
 * 消息含 sourceId 以避免接收自己发出的广播（回环）
 */
import type Redis from 'ioredis';

const logger = {
  info: (...args: any[]) => console.log('[RedisAdapter]', ...args),
  error: (...args: any[]) => console.error('[RedisAdapter]', ...args),
  warn: (...args: any[]) => console.warn('[RedisAdapter]', ...args),
};

/** 广播目标类型 */
export type BroadcastTarget = 'subscribed' | 'all';

/** Redis pub/sub 消息格式 */
interface BroadcastMessage {
  event: string;
  data: unknown;
  target: BroadcastTarget;
  sourceId: string;
}

/** 本地广播回调（由 GatewayServer 提供） */
export interface LocalBroadcastCallbacks {
  /** 仅推送给本机订阅了该事件的客户端 */
  localBroadcast(event: string, data: unknown): void;
  /** 推送给本机所有客户端 */
  localBroadcastToAll(event: string, data: unknown): void;
}

// Redis pub/sub 频道名
const CHANNEL = 'secuclaw:ws:broadcast';

export class RedisBroadcastAdapter {
  private instanceId: string;
  private publisher: Redis;
  private subscriber: Redis;
  private callbacks: LocalBroadcastCallbacks;

  constructor(
    publisher: Redis,
    subscriber: Redis,
    callbacks: LocalBroadcastCallbacks,
  ) {
    this.publisher = publisher;
    this.subscriber = subscriber;
    this.callbacks = callbacks;
    // 生成唯一实例 ID（用于过滤自己发出的消息）
    this.instanceId = `inst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    this.setupSubscription();
  }

  /** 订阅 Redis 频道，收到消息后转发给本机客户端 */
  private setupSubscription(): void {
    this.subscriber.subscribe(CHANNEL, (err) => {
      if (err) {
        logger.error('订阅频道失败:', err.message);
      }
    });

    this.subscriber.on('message', (channel: string, message: string) => {
      if (channel !== CHANNEL) return;

      try {
        const msg: BroadcastMessage = JSON.parse(message);

        // 过滤自己发出的消息（避免回环重复推送）
        if (msg.sourceId === this.instanceId) return;

        // 根据目标类型调用对应的本地广播方法
        if (msg.target === 'all') {
          this.callbacks.localBroadcastToAll(msg.event, msg.data);
        } else {
          this.callbacks.localBroadcast(msg.event, msg.data);
        }
      } catch (error) {
        logger.error('解析广播消息失败:', error);
      }
    });

    logger.info(`实例 ${this.instanceId} 已订阅广播频道`);
  }

  /**
   * 发布消息到 Redis（通知其他实例）
   * 由 GatewayServer.broadcast / broadcastToAll 调用
   */
  publish(event: string, data: unknown, target: BroadcastTarget): void {
    const message: BroadcastMessage = {
      event,
      data,
      target,
      sourceId: this.instanceId,
    };

    this.publisher.publish(CHANNEL, JSON.stringify(message)).catch((err) => {
      logger.error(`发布广播失败: event=${event}, error=${err.message}`);
    });
  }

  /** 断开适配器（取消订阅） */
  async disconnect(): Promise<void> {
    await this.subscriber.unsubscribe(CHANNEL).catch(() => undefined);
    logger.info('已取消订阅广播频道');
  }
}
