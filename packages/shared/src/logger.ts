/**
 * Minimal structured logger with correlation IDs and automatic redaction.
 * Emits single-line JSON so it plays well with log aggregators, and never
 * prints sensitive fields (see redaction.ts). Swap the sink for pino/Sentry
 * in production without changing call sites.
 */
import { redact } from './redaction.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

export interface LogContext {
  correlationId?: string;
  organizationId?: string;
  [key: string]: unknown;
}

export interface Logger {
  child(context: LogContext): Logger;
  debug(msg: string, meta?: Record<string, unknown>): void;
  info(msg: string, meta?: Record<string, unknown>): void;
  warn(msg: string, meta?: Record<string, unknown>): void;
  error(msg: string, meta?: Record<string, unknown>): void;
}

function createLogger(base: LogContext, minLevel: LogLevel): Logger {
  const emit = (level: LogLevel, msg: string, meta?: Record<string, unknown>) => {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;
    const line = {
      ts: new Date().toISOString(),
      level,
      msg,
      ...redact(base),
      ...(meta ? redact(meta) : {}),
    };
    const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    sink(JSON.stringify(line));
  };

  return {
    child: (context) => createLogger({ ...base, ...context }, minLevel),
    debug: (msg, meta) => emit('debug', msg, meta),
    info: (msg, meta) => emit('info', msg, meta),
    warn: (msg, meta) => emit('warn', msg, meta),
    error: (msg, meta) => emit('error', msg, meta),
  };
}

export function createRootLogger(minLevel: LogLevel = 'info'): Logger {
  return createLogger({}, minLevel);
}

export const logger = createRootLogger(
  (process.env.LOG_LEVEL as LogLevel | undefined) ?? 'info',
);
