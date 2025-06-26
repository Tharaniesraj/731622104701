import { ValidationResult } from '../types';
import { logger } from './logger';

export const validateUrl = (url: string): ValidationResult => {
  const errors: string[] = [];

  if (!url.trim()) {
    errors.push('URL is required');
  } else {
    try {
      const urlObj = new URL(url);
      
      // Check for valid protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('URL must use HTTP or HTTPS protocol');
      }

      // Check for malicious patterns
      const maliciousPatterns = [
        /javascript:/i,
        /data:/i,
        /vbscript:/i,
        /file:/i
      ];

      if (maliciousPatterns.some(pattern => pattern.test(url))) {
        errors.push('URL contains potentially malicious content');
        logger.warn('MALICIOUS_URL_ATTEMPT', { url, timestamp: new Date() });
      }

    } catch {
      errors.push('Invalid URL format');
    }
  }

  const result = {
    isValid: errors.length === 0,
    errors
  };

  logger.info('URL_VALIDATION', { 
    url: url.substring(0, 100), 
    isValid: result.isValid, 
    errorCount: errors.length 
  });

  return result;
};

export const validateShortCode = (shortCode: string): ValidationResult => {
  const errors: string[] = [];

  if (shortCode.trim()) {
    if (shortCode.length < 3 || shortCode.length > 20) {
      errors.push('Short code must be between 3 and 20 characters');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(shortCode)) {
      errors.push('Short code can only contain letters, numbers, hyphens, and underscores');
    }

    // Reserved words check
    const reservedWords = ['admin', 'api', 'www', 'app', 'stats', 'analytics'];
    if (reservedWords.includes(shortCode.toLowerCase())) {
      errors.push('Short code cannot use reserved words');
    }
  }

  const result = {
    isValid: errors.length === 0,
    errors
  };

  logger.info('SHORTCODE_VALIDATION', { 
    shortCode, 
    isValid: result.isValid, 
    errorCount: errors.length 
  });

  return result;
};

export const validateExpiryMinutes = (minutes: number): ValidationResult => {
  const errors: string[] = [];

  if (minutes < 1) {
    errors.push('Expiry time must be at least 1 minute');
  }

  if (minutes > 43200) { // 30 days max
    errors.push('Expiry time cannot exceed 30 days');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
