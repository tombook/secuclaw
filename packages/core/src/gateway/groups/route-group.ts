import type { Handler } from '../types.js';

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

  getMethodCount(): number {
    this.getHandlers();
    return this.handlers.size;
  }
}
