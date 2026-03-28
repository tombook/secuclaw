export interface WebSocketClient {
  send(data: string): void;
  close(): void;
}

// Lightweight KPI WebSocket pusher with injectable client factory (for testability)
export class KpiWebSocketPusher {
  private client?: WebSocketClient;
  private connected = false;

  constructor(private url: string, private createClient: (url: string) => WebSocketClient) {}

  private ensureConnected(): void {
    if (!this.connected) {
      this.client = this.createClient(this.url);
      this.connected = true;
    }
  }

  pushKpiResult(kpiId: string, metrics: any) {
    this.ensureConnected();
    const payload = {
      kpiId,
      metrics,
      ts: new Date().toISOString(),
    };
    this.client?.send(JSON.stringify(payload));
  }

  close() {
    if (this.client) {
      this.client.close();
      this.connected = false;
    }
  }
}
