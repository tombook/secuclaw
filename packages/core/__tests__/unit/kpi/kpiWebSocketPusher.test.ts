import { KpiWebSocketPusher, WebSocketClient } from '../../../src/kpi/kpiWebSocketPusher';

class MockWebSocketClient implements WebSocketClient {
  lastMessage: string | null = null;
  closed = false;
  
  send(data: string) {
    this.lastMessage = data;
  }
  
  close() {
    this.closed = true;
  }
}

describe('KpiWebSocketPusher', () => {
  test('sends KPI payload over WebSocket when connected', () => {
    const clientInstance = new MockWebSocketClient();
    const factory = (_url: string) => clientInstance;
    const pusher = new KpiWebSocketPusher('wss://kpi.example.com', factory);
    
    pusher.pushKpiResult('kpi-123', { score: 95, threshold: 80 });
    
    expect(clientInstance.lastMessage).toBeTruthy();
    const parsed = JSON.parse(clientInstance.lastMessage as string);
    expect(parsed.kpiId).toBe('kpi-123');
    expect(parsed.metrics.score).toBe(95);
    expect(parsed.metrics.threshold).toBe(80);
    expect(parsed.ts).toBeDefined();
  });

  test('reuses existing connection for multiple pushes', () => {
    const clientInstance = new MockWebSocketClient();
    const factory = jest.fn(() => clientInstance);
    const pusher = new KpiWebSocketPusher('wss://kpi.example.com', factory);
    
    pusher.pushKpiResult('kpi-1', { value: 10 });
    pusher.pushKpiResult('kpi-2', { value: 20 });
    
    expect(factory).toHaveBeenCalledTimes(1); // Only one connection created
    expect(clientInstance.lastMessage).toContain('kpi-2');
  });

  test('closes connection properly', () => {
    const clientInstance = new MockWebSocketClient();
    const factory = (_url: string) => clientInstance;
    const pusher = new KpiWebSocketPusher('wss://kpi.example.com', factory);
    
    pusher.pushKpiResult('kpi-1', { value: 10 });
    pusher.close();
    
    expect(clientInstance.closed).toBe(true);
  });
});
