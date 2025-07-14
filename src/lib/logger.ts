/**
 * Logger utility for consistent logging across the application
 * Supports different log levels and module-specific logging
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Current log level (can be set based on environment)
const currentLogLevel = process.env.NODE_ENV === 'production' 
  ? LogLevel.WARN  // Only warnings and errors in production
  : LogLevel.DEBUG; // All logs in development

// Interface for logger instance
interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

/**
 * Create a logger for a specific module
 * @param module The module name to include in log messages
 * @returns A logger instance with debug, info, warn, and error methods
 */
export function createLogger(module: string): Logger {
  const formatMessage = (level: string, message: string): string => {
    return `[${level}] [${module}] ${message}`;
  };

  return {
    debug(message: string, ...args: any[]) {
      if (currentLogLevel <= LogLevel.DEBUG) {
        console.debug(formatMessage('DEBUG', message), ...args);
      }
    },
    info(message: string, ...args: any[]) {
      if (currentLogLevel <= LogLevel.INFO) {
        console.info(formatMessage('INFO', message), ...args);
      }
    },
    warn(message: string, ...args: any[]) {
      if (currentLogLevel <= LogLevel.WARN) {
        console.warn(formatMessage('WARN', message), ...args);
      }
    },
    error(message: string, ...args: any[]) {
      if (currentLogLevel <= LogLevel.ERROR) {
        console.error(formatMessage('ERROR', message), ...args);
      }
    },
  };
}

// Create and export a default logger instance
export const logger = createLogger('default');

export default logger; 