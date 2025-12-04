import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export function OfflineDetector() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showOfflineAlert) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert className="bg-orange-50 border-orange-300 shadow-lg animate-in slide-in-from-top duration-300">
        <WifiOff className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800 ml-2">
          You're currently offline. Some features may not be available.
        </AlertDescription>
      </Alert>
    </div>
  );
}
