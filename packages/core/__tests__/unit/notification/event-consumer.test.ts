import { EventConsumer, MessageBroker, NotificationService } from '../../../src/notification/event-consumer';

class MockBroker implements MessageBroker {
  private handlers: Map<string, Array<(payload: any) => void>> = new Map();
  
  subscribe(topic: string, handler: (payload: any) => void) {
    if (!this.handlers.has(topic)) this.handlers.set(topic, []);
    this.handlers.get(topic)!.push(handler);
  }
  
  publish(topic: string, payload: any) {
    const hs = this.handlers.get(topic) || [];
    hs.forEach((h) => h(payload));
  }
}

class MockNotificationService implements NotificationService {
  lastPayload: any = null;
  async sendNotification(payload: any) {
    this.lastPayload = payload;
  }
}

describe('EventConsumer', () => {
  test('forwards notification messages to NotificationService', () => {
    const broker = new MockBroker();
    const svc = new MockNotificationService();
    const consumer = new EventConsumer(broker, svc);
    
    consumer.start();
    broker.publish('notification', { id: 'n1', msg: 'hello', recipients: ['user1@example.com'] });
    
    expect(svc.lastPayload).toEqual({ id: 'n1', msg: 'hello', recipients: ['user1@example.com'] });
  });

  test('ignores non-notification topics', () => {
    const broker = new MockBroker();
    const svc = new MockNotificationService();
    const consumer = new EventConsumer(broker, svc);
    
    consumer.start();
    broker.publish('other-topic', { id: 'n2', msg: 'other' });
    
    expect(svc.lastPayload).toBeNull();
  });

  test('handles async notification sending', async () => {
    const broker = new MockBroker();
    const svc = new MockNotificationService();
    const consumer = new EventConsumer(broker, svc);
    
    consumer.start();
    broker.publish('notification', { id: 'n3', async: true });
    
    // Wait for async operation
    await new Promise(resolve => setImmediate(resolve));
    
    expect(svc.lastPayload).toEqual({ id: 'n3', async: true });
  });
});
