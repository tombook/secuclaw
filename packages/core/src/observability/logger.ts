/**
 * Unified Structured Logger for SecuClaw
 * Replaces scattered console.log calls with consistent, level-aware logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const DEFAULT_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

export class Logger {
  private minLevel: number;
  private prefix: string;

  constructor(prefix: string, level?: LogLevel) {
    this.prefix = prefix;
    this.minLevel = LOG_LEVELS[level ?? DEFAULT_LEVEL] ?? LOG_LEVELS[DEFAULT_LEVEL];
  }

  debug(...args: any[]): void {
    if (this.minLevel <= LOG_LEVELS.debug) {
      console.log(`[DEBUG][${this.prefix}]`, ...args);
    }
  }

  info(...args: any[]): void {
    if (this.minLevel <= LOG_LEVELS.info) {
      console.log(`[INFO][${this.prefix}]`, ...args);
    }
  }

  warn(...args: any[]): void {
    if (this.minLevel <= LOG_LEVELS.warn) {
      console.warn(`[WARN][${this.prefix}]`, ...args);
    }
  }

  error(...args: any[]): void {
    if (this.minLevel <= LOG_LEVELS.error) {
      console.error(`[ERROR][${this.prefix}]`, ...args);
    }
  }
}

/** Create a module-scoped logger */
export function createLogger(prefix: string, level?: LogLevel): Logger {
  return new Logger(prefix, level);
}
