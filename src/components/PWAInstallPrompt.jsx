
import React, { useState, useEffect, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import Logo from './Logo';
import { PWAInstallContext } from './PWAInstallContext';

export default function PWAInstallPrompt() {
  const installPrompt = useContext(PWAInstallContext);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (installPrompt) {
      const timer = setTimeout(() => {
        // Check if app is not already installed before showing
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
        if (!isStandalone) {
          setIsVisible(true);
        }
      }, 3000); // Wait 3 seconds before showing
      return () => clearTimeout(timer);
    }
  }, [installPrompt]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    try {
      await installPrompt.prompt();
    } catch (error) {
      console.error('PWA installation prompt failed:', error);
    }
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Optional: could set a cookie/localStorage to not show again for a while
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm border border-gray-200">
        <div className="flex items-start gap-4">
          <Logo size="default" />
          <div>
            <h3 className="font-bold text-gray-900">Get the Orbit360 App</h3>
            <p className="text-sm text-gray-600 mt-1">
              Install our app for a faster, focused experience with offline access.
            </p>
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8 flex-shrink-0" onClick={handleDismiss}>
            <X className="w-4 h-4 text-gray-500" />
          </Button>
        </div>
        <div className="mt-4 flex gap-3">
          <Button 
            className="w-full bg-blue-700 hover:bg-blue-800 text-white" 
            onClick={handleInstallClick}
          >
            <Download className="w-4 h-4 mr-2" />
            Install
          </Button>
          <Button variant="outline" className="w-full" onClick={handleDismiss}>
            Not Now
          </Button>
        </div>
      </div>
    </div>
  );
}
