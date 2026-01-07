/**
 * Development-only logger utility
 * Prevents debug information disclosure in production (ZAP Alert 10027)
 * 
 * Usage:
 *   import { devLog, devWarn, devError } from '@/lib/logger';
 *   devLog('Debug message', data);
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Logs messages only in development mode
 * Prevents information disclosure in production
 */
export const devLog = (...args: unknown[]): void => {
  if (isDevelopment) {
    console.log(...args);
  }
};

/**
 * Logs warnings only in development mode
 */
export const devWarn = (...args: unknown[]): void => {
  if (isDevelopment) {
    console.warn(...args);
  }
};

/**
 * Logs errors only in development mode
 * Note: For critical errors that need monitoring in production,
 * use a proper error tracking service instead
 */
export const devError = (...args: unknown[]): void => {
  if (isDevelopment) {
    console.error(...args);
  }
};

/**
 * Logs debug info with a specific prefix for easier filtering
 */
export const devDebug = (prefix: string, ...args: unknown[]): void => {
  if (isDevelopment) {
    console.log(`[${prefix}]`, ...args);
  }
};

// Named export for the logger object
export const logger = {
  log: devLog,
  warn: devWarn,
  error: devError,
  debug: devDebug,
};
