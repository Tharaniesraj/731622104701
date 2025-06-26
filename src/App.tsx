import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { URLShortener } from './pages/URLShortener';
import { Statistics } from './pages/Statistics';
import { RedirectHandler } from './components/RedirectHandler';
import { logger } from './utils/logger';

function App() {
  React.useEffect(() => {
    logger.info('APPLICATION_STARTED', {
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Redirect route - must come first to catch short codes */}
          <Route path="/:shortCode" element={<RedirectHandler />} />
          
          {/* Main application routes */}
          <Route path="/" element={
            <>
              <Navigation />
              <URLShortener />
            </>
          } />
          <Route path="/statistics" element={
            <>
              <Navigation />
              <Statistics />
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
