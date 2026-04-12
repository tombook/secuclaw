export type Handler = (params: Record<string, unknown>, deps?: any, clientContext?: Record<string, unknown>) => Promise<unknown>;

export interface HandlerResponse {
  result?: unknown;
  error?: { code: string; message: string };
}

export abstract class RouteGroup {
  private registered = false;
  protected handlers: Map<string, Handler> = new Map();

  abstract register(): void;

  getHandlers(): Map<string, Handler> {
    if (!this.registered) {
      this.register();
      this.registered = true;
    }
    return this.handlers;
  }

  protected registerHandler(method: string, handler: Handler): void {
    this.handlers.set(method, handler);
  }

  hasMethod(method: string): boolean {
    this.getHandlers();
    return this.handlers.has(method);
  }
}
