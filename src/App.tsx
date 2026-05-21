import { useEffect, useState, useCallback } from 'react';
import Gallery from './components/Gallery';
import PasswordProtection from './components/PasswordProtection';
import useSecurityProtection from './hooks/useSecurity';

const PASSWORD = import.meta.env.VITE_PASSWORD_HERE;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const { isBlurred, blurClassName, unblur } = useSecurityProtection({
    onSuspiciousActivity: () => setIsAuthenticated(false),
  });
  
  const handleAuthentication = useCallback(() => {
    setIsAuthenticated(true);
    unblur();
  }, [unblur]);
  
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