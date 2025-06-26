import React, { useState, useEffect } from 'react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { urlService } from '../services/urlService';
import { validateUrl, validateShortCode, validateExpiryMinutes } from '../utils/validation';
import { logger } from '../utils/logger';
import { ShortenedURL } from '../types';

export const URLShortener: React.FC = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customShortCode, setCustomShortCode] = useState('');
  const [expiryMinutes, setExpiryMinutes] = useState(30);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [urls, setUrls] = useState<ShortenedURL[]>([]);

  useEffect(() => {
    loadUrls();
    logger.info('URL_SHORTENER_PAGE_LOADED');
  }, []);

  const loadUrls = () => {
    const allUrls = urlService.getAllUrls();
    setUrls(allUrls);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const urlValidation = validateUrl(originalUrl);
    if (!urlValidation.isValid) {
      newErrors.originalUrl = urlValidation.errors[0];
    }

    if (customShortCode) {
      const shortCodeValidation = validateShortCode(customShortCode);
      if (!shortCodeValidation.isValid) {
        newErrors.customShortCode = shortCodeValidation.errors[0];
      }
    }

    const expiryValidation = validateExpiryMinutes(expiryMinutes);
    if (!expiryValidation.isValid) {
      newErrors.expiryMinutes = expiryValidation.errors[0];
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      logger.warn('FORM_VALIDATION_FAILED', { errors });
      return;
    }

    setIsLoading(true);

    try {
      const shortenedUrl = urlService.shortenUrl(
        originalUrl,
        customShortCode || undefined,
        expiryMinutes
      );

      // Reset form
      setOriginalUrl('');
      setCustomShortCode('');
      setExpiryMinutes(30);
      setErrors({});

      // Reload URLs
      loadUrls();

      logger.info('URL_CREATION_SUCCESS', { 
        shortCode: shortenedUrl.shortCode,
        expiryMinutes 
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setErrors({ submit: errorMessage });
      logger.error('URL_CREATION_FAILED', { error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (urlService.deleteUrl(id)) {
      loadUrls();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      logger.info('URL_COPIED_TO_CLIPBOARD', { url: text.substring(0, 50) });
    } catch (error) {
      logger.error('CLIPBOARD_COPY_FAILED', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const formatTimeRemaining = (expiresAt: Date): string => {
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">URL Shortener</h1>
        <p className="text-gray-600">
          Create short URLs with custom codes and expiry times. Maximum 5 concurrent URLs allowed.
        </p>
      </div>

      <Card title="Create Short URL" className="mb-8">
        <form onSubmit={handleSubmit}>
          <Input
            label="Original URL"
            value={originalUrl}
            onChange={setOriginalUrl}
            type="url"
            placeholder="https://example.com/very-long-url"
            error={errors.originalUrl}
            required
          />

          <Input
            label="Custom Short Code (Optional)"
            value={customShortCode}
            onChange={setCustomShortCode}
            placeholder="my-custom-code"
            error={errors.customShortCode}
          />

          <Input
            label="Expiry Time (Minutes)"
            value={expiryMinutes.toString()}
            onChange={(value) => setExpiryMinutes(parseInt(value) || 30)}
            type="number"
            error={errors.expiryMinutes}
            required
          />

          {errors.submit && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {errors.submit}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating...' : 'Shorten URL'}
          </Button>
        </form>
      </Card>

      <Card title={`Your URLs (${urls.filter(url => url.isActive).length}/5 active)`}>
        {urls.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No URLs created yet</p>
        ) : (
          <div className="space-y-4">
            {urls.map((url) => (
              <div
                key={url.id}
                className={`p-4 border rounded-lg ${
                  url.isActive && url.expiresAt > new Date()
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {url.shortCode}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        url.isActive && url.expiresAt > new Date()
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {url.isActive && url.expiresAt > new Date() ? 'Active' : 'Expired'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 break-all mb-1">
                      {url.originalUrl}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Clicks: {url.clickCount}</span>
                      <span>Expires: {formatTimeRemaining(url.expiresAt)}</span>
                      <span>Created: {url.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="secondary"
                      onClick={() => copyToClipboard(url.shortUrl)}
                      className="text-xs px-3 py-1"
                    >
                      Copy
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(url.id)}
                      className="text-xs px-3 py-1"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Compliance Notice</h3>
        <p className="text-sm text-blue-800">
          This service operates under Indian IT Act 2000 and processes data within Hyderabad/Secunderabad jurisdiction. 
          All activities are logged for security and compliance purposes.
        </p>
      </div>
    </div>
  );
};
