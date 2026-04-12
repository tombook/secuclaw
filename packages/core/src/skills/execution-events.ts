import type { ExecutionResult, ExecutionStatus } from './executor.js';

type ProgressCallback = (executionId: string, progress: number, status: ExecutionStatus) => void;

interface EventBus {
  emit(event: string, payload: unknown): Promise<void>;
}

class ExecutionEvents {
  private progressCallbacks = new Map<string, Set<ProgressCallback>>();
  private completionCallbacks = new Map<string, Set<(result: ExecutionResult) => void>>();
  private eventBus: EventBus | null = null;

  setEventBus(bus: EventBus): void {
    this.eventBus = bus;
  }

  onProgress(executionId: string, callback: ProgressCallback): () => void {
    if (!this.progressCallbacks.has(executionId)) {
      this.progressCallbacks.set(executionId, new Set());
    }
    this.progressCallbacks.get(executionId)!.add(callback);

    return () => {
      this.progressCallbacks.get(executionId)?.delete(callback);
    };
  }

  onComplete(executionId: string, callback: (result: ExecutionResult) => void): () => void {
    if (!this.completionCallbacks.has(executionId)) {
      this.completionCallbacks.set(executionId, new Set());
    }
    this.completionCallbacks.get(executionId)!.add(callback);

    return () => {
      this.completionCallbacks.get(executionId)?.delete(callback);
    };
  }

  emitProgress(executionId: string, progress: number, status: ExecutionStatus) {
    const callbacks = this.progressCallbacks.get(executionId);
    if (callbacks) {
      callbacks.forEach(cb => cb(executionId, progress, status));
    }

    if (this.eventBus && status === 'running') {
      this.eventBus.emit('skill.execution.progress', { executionId, progress, status }).catch(console.error);
    }
  }

  emitComplete(result: ExecutionResult) {
    const callbacks = this.completionCallbacks.get(result.executionId);
    if (callbacks) {
      callbacks.forEach(cb => cb(result));
      this.completionCallbacks.delete(result.executionId);
    }

    if (this.eventBus) {
      const eventName = result.status === 'completed' ? 'skill.execution.completed' : 'skill.execution.failed';
      this.eventBus.emit(eventName, result).catch(console.error);
    }
  }

  removeAllListeners(executionId: string) {
    this.progressCallbacks.delete(executionId);
    this.completionCallbacks.delete(executionId);
  }
}

export const executionEvents = new ExecutionEvents();
