import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { urlService } from '../services/urlService';
import { logger } from '../utils/logger';

export const RedirectHandler = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [status, setStatus] = useState<'loading' | 'redirecting' | 'not-found' | 'expired'>('loading');

  useEffect(() => {
    if (!shortCode) {
      setStatus('not-found');
      return;
    }

    const url = urlService.getUrlByShortCode(shortCode);
    
    if (!url) {
      setStatus('not-found');
      logger.warn('REDIRECT_NOT_FOUND', { shortCode });
      return;
    }

    if (!url.isActive || url.expiresAt < new Date()) {
      setStatus('expired');
      logger.warn('REDIRECT_EXPIRED', { shortCode, expiresAt: url.expiresAt });
      return;
    }

    // Record the click
    const userAgent = navigator.userAgent;
    const referrer = document.referrer;
    
    urlService.recordClick(shortCode, userAgent, referrer);
    
    setStatus('redirecting');
    
    // Redirect after a brief delay to show the redirect message
    setTimeout(() => {
      window.location.href = url.originalUrl;
    }, 2000);

  }, [shortCode]);

  const getStatusMessage = () => {
    switch (status) {
      case 'loading':
        return {
          title: 'Loading...',
          message: 'Checking URL validity...',
          color: 'blue'
        };
      case 'redirecting':
        return {
          title: 'Redirecting...',
          message: 'You will be redirected shortly. If not, click the link below.',
          color: 'green'
        };
      case 'expired':
        return {
          title: 'Link Expired',
          message: 'This short URL has expired and is no longer valid.',
          color: 'red'
        };
      case 'not-found':
        return {
          title: 'Link Not Found',
          message: 'The requested short URL does not exist or has been deleted.',
          color: 'red'
        };
      default:
        return {
          title: 'Error',
          message: 'An unexpected error occurred.',
          color: 'red'
        };
    }
  };

  const statusInfo = getStatusMessage();
  const url = shortCode ? urlService.getUrlByShortCode(shortCode) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
            statusInfo.color === 'blue' ? 'bg-blue-100' :
            statusInfo.color === 'green' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {status === 'loading' && (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            )}
            {status === 'redirecting' && (
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            )}
            {(status === 'not-found' || status === 'expired') && (
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
          </div>

          <h1 className={`text-2xl font-bold mb-2 ${
            statusInfo.color === 'blue' ? 'text-blue-900' :
            statusInfo.color === 'green' ? 'text-green-900' : 'text-red-900'
          }`}>
            {statusInfo.title}
          </h1>

          <p className="text-gray-600 mb-6">
            {statusInfo.message}
          </p>

          {status === 'redirecting' && url && (
            <div className="mb-6">
              <a
                href={url.originalUrl}
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue to Destination
              </a>
              <div className="mt-3 text-xs text-gray-500 break-all">
                Destination: {url.originalUrl}
              </div>
            </div>
          )}

          {(status === 'not-found' || status === 'expired') && (
            <a
              href="/"
              className="inline-block bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Create New Short URL
            </a>
          )}

          <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
            <p>Powered by URL Shortener</p>
            <p>Hyderabad/Secunderabad, India</p>
          </div>
        </div>
      </div>
    </div>
  );
};
