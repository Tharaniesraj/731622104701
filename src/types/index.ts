export interface ShortenedURL {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  createdAt: Date;
  expiresAt: Date;
  isActive: boolean;
  clickCount: number;
  clicks: ClickEvent[];
}

export interface ClickEvent {
  id: string;
  timestamp: Date;
  userAgent: string;
  ipAddress: string;
  referrer: string;
  location: string;
}

export interface LogEvent {
  id: string;
  timestamp: Date;
  level: 'INFO' | 'WARN' | 'ERROR';
  action: string;
  details: Record<string, any>;
  userId?: string;
  sessionId: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
