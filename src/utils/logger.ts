/**
 * Centralized Logging Utility
 * 
 * Provides consistent logging across the application with environment-aware behavior.
 * In production, console statements are suppressed and errors can be sent to monitoring services.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
}

class Logger {
  private isDevelopment: boolean;
  private logHistory: LogEntry[] = [];
  private maxHistorySize = 100;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
  }

  /**
   * Log informational messages
   * Only shown in development mode
   */
  info(message: string, data?: any): void {
    this.log('info', message, data);
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, data !== undefined ? data : '');
    }
  }

  /**
   * Log warning messages
   * Shown in both development and production
   */
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data !== undefined ? data : '');
    }
  }

  /**
   * Log error messages
   * Shown in both development and production
   * In production, should be sent to error tracking service
   */
  error(message: string, error?: any): void {
    this.log('error', message, error);
    
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, error !== undefined ? error : '');
    } else {
      // In production, send to error tracking service
      // TODO: Integrate with Sentry, LogRocket, or similar
      this.sendToErrorTracking(message, error);
    }
  }

  /**
   * Log debug messages
   * Only shown in development mode
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data !== undefined ? data : '');
    }
  }

  /**
   * Log RPC-related messages
   * Useful for debugging blockchain interactions
   */
  rpc(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[RPC] ${message}`, data !== undefined ? data : '');
    }
    this.log('info', `[RPC] ${message}`, data);
  }

  /**
   * Log API-related messages
   * Useful for debugging backend interactions
   */
  api(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`[API] ${message}`, data !== undefined ? data : '');
    }
    this.log('info', `[API] ${message}`, data);
  }

  /**
   * Internal logging method that stores log history
   */
  private log(level: LogLevel, message: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    this.logHistory.push(entry);

    // Keep history size manageable
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift();
    }
  }

  /**
   * Send error to tracking service (placeholder)
   * TODO: Implement actual error tracking integration
   */
  private sendToErrorTracking(message: string, error?: any): void {
    // Placeholder for error tracking service integration
    // Example: Sentry.captureException(error, { extra: { message } });
    
    // For now, just store in history
    // In production, you would send this to your error tracking service
  }

  /**
   * Get recent log history
   * Useful for debugging or showing logs to admin
   */
  getHistory(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logHistory.filter(entry => entry.level === level);
    }
    return [...this.logHistory];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logHistory = [];
  }

  /**
   * Export logs as JSON
   * Useful for debugging or support tickets
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }
}

// Create singleton instance
export const logger = new Logger();

// Export for use in other files
export default logger;

// Convenience exports for common patterns
export const logInfo = logger.info.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logError = logger.error.bind(logger);
export const logDebug = logger.debug.bind(logger);
export const logRpc = logger.rpc.bind(logger);
export const logApi = logger.api.bind(logger);
