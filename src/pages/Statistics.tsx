import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { urlService } from '../services/urlService';
import { logger } from '../utils/logger';
import { ShortenedURL, LogEvent } from '../types';

export const Statistics: React.FC = () => {
  const [urls, setUrls] = useState<ShortenedURL[]>([]);
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const [selectedUrl, setSelectedUrl] = useState<ShortenedURL | null>(null);

  useEffect(() => {
    loadData();
    logger.info('STATISTICS_PAGE_LOADED');
  }, []);

  const loadData = () => {
    const allUrls = urlService.getAllUrls();
    const allLogs = logger.getStoredLogs();
    setUrls(allUrls);
    setLogs(allLogs);
  };

  const getTotalClicks = () => {
    return urls.reduce((total, url) => total + url.clickCount, 0);
  };

  const getActiveUrls = () => {
    return urls.filter(url => url.isActive && url.expiresAt > new Date()).length;
  };

  const getTopUrls = () => {
    return [...urls]
      .sort((a, b) => b.clickCount - a.clickCount)
      .slice(0, 5);
  };

  const getRecentActivity = () => {
    return logs
      .filter(log => log.action.includes('CLICK') || log.action.includes('URL'))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Statistics & Analytics</h1>
        <p className="text-gray-600">
          Comprehensive analytics for your shortened URLs and system activity.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{urls.length}</div>
            <div className="text-sm text-gray-600">Total URLs</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{getActiveUrls()}</div>
            <div className="text-sm text-gray-600">Active URLs</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{getTotalClicks()}</div>
            <div className="text-sm text-gray-600">Total Clicks</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">{logs.length}</div>
            <div className="text-sm text-gray-600">Log Events</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Performing URLs */}
        <Card title="Top Performing URLs">
          {getTopUrls().length === 0 ? (
            <p className="text-gray-500 text-center py-4">No URLs with clicks yet</p>
          ) : (
            <div className="space-y-3">
              {getTopUrls().map((url, index) => (
                <div
                  key={url.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
                  onClick={() => setSelectedUrl(url)}
                >
                    <div className="flex-1">
                    <div className="font-mono text-sm font-medium">/{url.shortCode}</div>
                    <div className="text-xs text-gray-600 truncate">
                      {url.originalUrl}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{url.clickCount}</div>
                    <div className="text-xs text-gray-500">clicks</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Activity">
          {getRecentActivity().length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {getRecentActivity().map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2 hover:bg-gray-50 rounded">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    log.level === 'ERROR' ? 'bg-red-500' :
                    log.level === 'WARN' ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{log.action.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-gray-500">{formatDate(log.timestamp)}</div>
                    {log.details.shortCode && (
                      <div className="text-xs text-blue-600">/{log.details.shortCode}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* URL Details Modal */}
      {selectedUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">URL Details</h3>
                <button
                  onClick={() => setSelectedUrl(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Short Code</label>
                  <div className="font-mono text-lg">/{selectedUrl.shortCode}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Original URL</label>
                  <div className="text-sm break-all text-blue-600">{selectedUrl.originalUrl}</div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Clicks</label>
                    <div className="text-2xl font-bold text-purple-600">{selectedUrl.clickCount}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className={`inline-block px-2 py-1 rounded text-sm ${
                      selectedUrl.isActive && selectedUrl.expiresAt > new Date()
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedUrl.isActive && selectedUrl.expiresAt > new Date() ? 'Active' : 'Expired'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Created</label>
                    <div className="text-sm">{formatDate(selectedUrl.createdAt)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expires</label>
                    <div className="text-sm">{formatDate(selectedUrl.expiresAt)}</div>
                  </div>
                </div>

                {selectedUrl.clicks.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recent Clicks</label>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {selectedUrl.clicks.slice(-10).reverse().map((click) => (
                        <div key={click.id} className="text-xs bg-gray-50 p-2 rounded">
                          <div className="flex justify-between">
                            <span>{formatDate(click.timestamp)}</span>
                            <span className="text-gray-500">{click.location}</span>
                          </div>
                          {click.referrer && (
                            <div className="text-gray-600 truncate">From: {click.referrer}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Logs */}
      <Card title="System Logs" className="mt-8">
        <div className="max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No logs available</p>
          ) : (
            <div className="space-y-1">
              {logs.slice(-50).reverse().map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-2 text-xs hover:bg-gray-50 rounded">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 ${
                    log.level === 'ERROR' ? 'bg-red-500' :
                    log.level === 'WARN' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.action}</span>
                      <span className="text-gray-500">{formatDate(log.timestamp)}</span>
                    </div>
                    {Object.keys(log.details).length > 0 && (
                      <div className="text-gray-600 mt-1">
                        {JSON.stringify(log.details, null, 0).substring(0, 100)}
                        {JSON.stringify(log.details).length > 100 && '...'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Privacy & Compliance</h3>
        <p className="text-sm text-blue-800">
          All analytics data is processed locally and complies with Indian data protection regulations. 
          IP addresses are masked for privacy protection. Data jurisdiction: Hyderabad/Secunderabad, India.
        </p>
      </div>
    </div>
  );
};