import { ShortenedURL, ClickEvent } from '../types';
import { logger } from '../utils/logger';

class URLService {
  private urls: Map<string, ShortenedURL> = new Map();
  private shortCodeToId: Map<string, string> = new Map();

  constructor() {
    this.loadFromStorage();
    this.startExpiryCleanup();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('urlShortener_urls');
      if (stored) {
        const urlsArray: ShortenedURL[] = JSON.parse(stored);
        urlsArray.forEach(url => {
          // Convert date strings back to Date objects
          url.createdAt = new Date(url.createdAt);
          url.expiresAt = new Date(url.expiresAt);
          url.clicks = url.clicks.map(click => ({
            ...click,
            timestamp: new Date(click.timestamp)
          }));
          
          this.urls.set(url.id, url);
          this.shortCodeToId.set(url.shortCode, url.id);
        });
        
        logger.info('URLS_LOADED_FROM_STORAGE', { count: urlsArray.length });
      }
    } catch (error) {
      logger.error('STORAGE_LOAD_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private saveToStorage() {
    try {
      const urlsArray = Array.from(this.urls.values());
      localStorage.setItem('urlShortener_urls', JSON.stringify(urlsArray));
      logger.info('URLS_SAVED_TO_STORAGE', { count: urlsArray.length });
    } catch (error) {
      logger.error('STORAGE_SAVE_ERROR', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }

  private generateShortCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private startExpiryCleanup() {
    setInterval(() => {
      this.cleanupExpiredUrls();
    }, 60000); // Check every minute
  }

  private cleanupExpiredUrls() {
    const now = new Date();
    let cleanedCount = 0;

    for (const [id, url] of this.urls.entries()) {
      if (url.expiresAt < now && url.isActive) {
        url.isActive = false;
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.saveToStorage();
      logger.info('EXPIRED_URLS_CLEANED', { count: cleanedCount });
    }
  }

  shortenUrl(
    originalUrl: string, 
    customShortCode?: string, 
    expiryMinutes: number = 30
  ): ShortenedURL {
    const id = `url_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const shortCode = customShortCode || this.generateShortCode();
    
    // Check if short code already exists
    if (this.shortCodeToId.has(shortCode)) {
      throw new Error('Short code already exists');
    }

    // Check concurrent limit (5 active URLs)
    const activeUrls = Array.from(this.urls.values()).filter(url => url.isActive);
    if (activeUrls.length >= 5) {
      logger.warn('CONCURRENT_LIMIT_REACHED', { activeCount: activeUrls.length });
      throw new Error('Maximum of 5 concurrent URLs allowed');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000);

    const shortenedUrl: ShortenedURL = {
      id,
      originalUrl,
      shortCode,
      shortUrl: `${window.location.origin}/${shortCode}`,
      createdAt: now,
      expiresAt,
      isActive: true,
      clickCount: 0,
      clicks: []
    };

    this.urls.set(id, shortenedUrl);
    this.shortCodeToId.set(shortCode, id);
    this.saveToStorage();

    logger.info('URL_SHORTENED', {
      id,
      shortCode,
      originalUrl: originalUrl.substring(0, 100),
      expiryMinutes
    });

    return shortenedUrl;
  }

  getUrlByShortCode(shortCode: string): ShortenedURL | null {
    const id = this.shortCodeToId.get(shortCode);
    if (!id) return null;

    const url = this.urls.get(id);
    if (!url || !url.isActive || url.expiresAt < new Date()) {
      return null;
    }

    return url;
  }

  recordClick(shortCode: string, userAgent: string, referrer: string): boolean {
    const url = this.getUrlByShortCode(shortCode);
    if (!url) return false;

    const clickEvent: ClickEvent = {
      id: `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      userAgent,
      ipAddress: 'xxx.xxx.xxx.xxx', // Masked for privacy
      referrer,
      location: 'Hyderabad/Secunderabad' // Jurisdiction compliance
    };

    url.clicks.push(clickEvent);
    url.clickCount++;
    this.saveToStorage();

    logger.info('CLICK_RECORDED', {
      shortCode,
      clickId: clickEvent.id,
      totalClicks: url.clickCount
    });

    return true;
  }

  getAllUrls(): ShortenedURL[] {
    return Array.from(this.urls.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  deleteUrl(id: string): boolean {
    const url = this.urls.get(id);
    if (!url) return false;

    this.urls.delete(id);
    this.shortCodeToId.delete(url.shortCode);
    this.saveToStorage();

    logger.info('URL_DELETED', { id, shortCode: url.shortCode });
    return true;
  }
}

export const urlService = new URLService();
