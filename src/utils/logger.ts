import { LogEvent } from '../types';

class Logger {
  private logs: LogEvent[] = [];
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createLogEvent(
    level: LogEvent['level'],
    action: string,
    details: Record<string, any>
  ): LogEvent {
    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      level,
      action,
      details: {
        ...details,
        jurisdiction: 'Hyderabad/Secunderabad, India',
        compliance: 'Data processed under Indian IT Act 2000'
      },
      sessionId: this.sessionId
    };
  }

  info(action: string, details: Record<string, any> = {}) {
    const logEvent = this.createLogEvent('INFO', action, details);
    this.logs.push(logEvent);
    this.persistLog(logEvent);
  }

  warn(action: string, details: Record<string, any> = {}) {
    const logEvent = this.createLogEvent('WARN', action, details);
    this.logs.push(logEvent);
    this.persistLog(logEvent);
  }

  error(action: string, details: Record<string, any> = {}) {
    const logEvent = this.createLogEvent('ERROR', action, details);
    this.logs.push(logEvent);
    this.persistLog(logEvent);
  }

  private persistLog(logEvent: LogEvent) {
    // Store in localStorage for demo purposes
    // In production, this would send to a secure logging service
    const existingLogs = JSON.parse(localStorage.getItem('urlShortener_logs') || '[]');
    existingLogs.push(logEvent);
    
    // Keep only last 1000 logs for performance
    if (existingLogs.length > 1000) {
      existingLogs.splice(0, existingLogs.length - 1000);
    }
    
    localStorage.setItem('urlShortener_logs', JSON.stringify(existingLogs));
  }

  getLogs(): LogEvent[] {
    return [...this.logs];
  }

  getStoredLogs(): LogEvent[] {
    return JSON.parse(localStorage.getItem('urlShortener_logs') || '[]');
  }
}

export const logger = new Logger();
