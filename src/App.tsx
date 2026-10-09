// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useState } from 'react';
import Gallery from './components/Gallery';
import useSecurityProtection from './hooks/useSecurity';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const { isBlurred, blurClassName } = useSecurityProtection({
    onSuspiciousActivity: () => setIsAuthenticated(false),
  });
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isAuthenticated) {
        sessionStorage.setItem('session_expired', 'true');
        sessionStorage.removeItem('session_expired');
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const handleFocus = () => setIsAuthenticated(false);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated]);
  
  return (
    <div className={`min-h-screen bg-gray-900 dark:bg-gray-900 ${isBlurred ? blurClassName : ''}`}>
      <Gallery />
    </div>
  );
}

export default App;

/*
{!isAuthenticated ? (
        <PasswordProtection 
          onAuthenticated={handleAuthentication} 
          correctPassword={PASSWORD} 
        />
      ) : (
        <Gallery />
      )}
*/