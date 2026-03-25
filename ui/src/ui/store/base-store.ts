type Subscriber<T> = (state: T) => void;

export abstract class BaseStore<T> {
  protected state: T;
  private subscribers = new Set<Subscriber<T>>();

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState(): T {
    return { ...this.state };
  }

  setState(updates: Partial<T>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  subscribe(subscriber: Subscriber<T>): () => void {
    this.subscribers.add(subscriber);
    subscriber(this.getState());
    return () => this.subscribers.delete(subscriber);
  }

  private notify(): void {
    const state = this.getState();
    this.subscribers.forEach((subscriber) => subscriber(state));
  }

  protected abstract initialize(): Promise<void>;
}
