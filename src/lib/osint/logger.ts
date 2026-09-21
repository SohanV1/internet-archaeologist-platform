/**
 * Observability & Structured Logging Engine
 * Provides JSON structured logs, execution timers, request tracing,
 * and error telemetry for passive reconnaissance operations.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  operation: string;
  message: string;
  requestId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private serviceName = 'internet-archaeologist';

  private emit(
    level: LogLevel,
    operation: string,
    message: string,
    metadata?: Record<string, unknown>,
    error?: unknown,
    durationMs?: number,
    requestId?: string
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      operation,
      message,
      requestId,
      durationMs,
      metadata,
    };

    if (error instanceof Error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    } else if (error) {
      entry.error = {
        name: 'UnknownError',
        message: String(error),
      };
    }

    const json = JSON.stringify(entry);
    if (level === 'ERROR') {
      console.error(json);
    } else if (level === 'WARN') {
      console.warn(json);
    } else {
      console.log(json);
    }
  }

  info(operation: string, message: string, metadata?: Record<string, unknown>, requestId?: string) {
    this.emit('INFO', operation, message, metadata, undefined, undefined, requestId);
  }

  warn(operation: string, message: string, metadata?: Record<string, unknown>, requestId?: string) {
    this.emit('WARN', operation, message, metadata, undefined, undefined, requestId);
  }

  error(
    operation: string,
    message: string,
    error?: unknown,
    metadata?: Record<string, unknown>,
    requestId?: string
  ) {
    this.emit('ERROR', operation, message, metadata, error, undefined, requestId);
  }

  /**
   * Helper to time asynchronous operations and record telemetry
   */
  async profile<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>,
    requestId?: string
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const durationMs = Math.round(performance.now() - start);
      this.emit('INFO', operation, `Completed ${operation}`, metadata, undefined, durationMs, requestId);
      return result;
    } catch (err) {
      const durationMs = Math.round(performance.now() - start);
      this.emit('ERROR', operation, `Failed ${operation}`, metadata, err, durationMs, requestId);
      throw err;
    }
  }
}

export const logger = new Logger();
