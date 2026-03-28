export enum LogLevel {
  trace = 0, debug = 1, info = 2, warn = 3, error = 4, fatal = 5,
}

export interface LogEntry {
  timestamp: string;
  level: keyof typeof LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export interface ILogger {
  trace(msg: string, ctx?: Record<string, unknown>): void;
  debug(msg: string, ctx?: Record<string, unknown>): void;
  info(msg: string, ctx?: Record<string, unknown>): void;
  warn(msg: string, ctx?: Record<string, unknown>): void;
  error(msg: string, ctx?: Record<string, unknown>): void;
  fatal(msg: string, ctx?: Record<string, unknown>): void;
  withCtx(ctx: Record<string, unknown>): ILogger;
}

export class StructuredLogger implements ILogger {
  private baseCtx: Record<string, unknown>;

  constructor(
    private minLevel: LogLevel = LogLevel.info,
    baseCtx: Record<string, unknown> = {},
  ) {
    this.baseCtx = baseCtx;
  }

  structuredLog(level: LogLevel, message: string, ctx?: Record<string, unknown>): void {
    if (level < this.minLevel) return;
    const levelName = LogLevel[level] as keyof typeof LogLevel;
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      message,
      context: { ...this.baseCtx, ...ctx },
    };
    const json = JSON.stringify(entry);
    if (level >= LogLevel.error) {
      process.stderr.write(json + '\n');
    } else {
      process.stdout.write(json + '\n');
    }
  }

  trace(msg: string, ctx?: Record<string, unknown>): void { this.structuredLog(LogLevel.trace, msg, ctx); }
  debug(msg: string, ctx?: Record<string, unknown>): void { this.structuredLog(LogLevel.debug, msg, ctx); }
  info(msg: string, ctx?: Record<string, unknown>): void { this.structuredLog(LogLevel.info, msg, ctx); }
  warn(msg: string, ctx?: Record<string, unknown>): void { this.structuredLog(LogLevel.warn, msg, ctx); }
  error(msg: string, ctx?: Record<string, unknown>): void { this.structuredLog(LogLevel.error, msg, ctx); }
  fatal(msg: string, ctx?: Record<string, unknown>): void { this.structuredLog(LogLevel.fatal, msg, ctx); }

  withCtx(ctx: Record<string, unknown>): ILogger {
    return new StructuredLogger(this.minLevel, { ...this.baseCtx, ...ctx });
  }
}

export const logger = new StructuredLogger(
  (process.env.LOG_LEVEL?.toUpperCase() === 'DEBUG' ? LogLevel.debug :
   process.env.LOG_LEVEL?.toUpperCase() === 'TRACE' ? LogLevel.trace :
   LogLevel.info),
);
