
import React, { useState, useEffect, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, CheckCircle, MonitorSmartphone, Chrome, Info, ExternalLink, ShieldCheck } from 'lucide-react';
import Logo from '../components/Logo';
import { PWAInstallContext } from '../components/PWAInstallContext'; // Import the context

export default function InstallApp() {
  const installPrompt = useContext(PWAInstallContext); // Consume the context
  const [isInstalled, setIsInstalled] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [browserInfo, setBrowserInfo] = useState({});

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true;
      setIsInstalled(standalone);
    };

    // Enhanced browser detection
    const checkSupport = () => {
      const userAgent = navigator.userAgent;
      const isChrome = /Chrome/.test(userAgent) && !/Edg/.test(userAgent);
      const isEdge = /Edg/.test(userAgent);
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      const isMac = /Macintosh|Mac OS X/.test(userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      
      setIsSupported(isChrome || isEdge || (isSafari && (isMac || isIOS)));
      setBrowserInfo({ isChrome, isEdge, isSafari, isMac, isIOS });
    };

    checkInstalled();
    checkSupport();

    const handleAppInstalled = () => {
      setIsInstalled(true);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    
    if (installPrompt) {
      try {
        await installPrompt.prompt();
      } catch (error) {
        console.error('Installation failed:', error);
        setShowManualInstructions(true);
      }
    } else {
      setShowManualInstructions(true);
    }
    
    setInstalling(false);
  };
  
  const getInstallInstructions = () => {
    // Chrome (works on Mac and Windows)
    if (browserInfo.isChrome) {
      return {
        title: "Install on Chrome (Mac & Windows)",
        steps: [
          "Look for the Install icon (a screen with a down arrow) in the address bar on the right.",
          "Alternatively, click the three-dots menu (⋮) in the top-right corner.",
          "Select 'Install Orbit360...'.",
          "Click 'Install' in the confirmation pop-up."
        ]
      };
    }
    // Safari on macOS
    if (browserInfo.isMac && browserInfo.isSafari) {
      return {
        title: "Install on macOS (Safari)",
        steps: [
          "Ensure you are on macOS Sonoma (14.0) or later for the best experience.",
          "With the Orbit360 app open, click 'File' in the top menu bar (next to the Apple logo).",
          "Select 'Add to Dock...'.",
          "You can rename the app if you wish, then click 'Add'.",
          "The app icon will now be in your Dock for easy access."
        ]
      };
    }
    // Safari on iOS
    if (browserInfo.isIOS && browserInfo.isSafari) {
      return {
        title: "Install on iPhone/iPad (Safari)",
        steps: [
          "Tap the 'Share' button (an icon with a square and an up arrow) in Safari's toolbar.",
          "Scroll down in the share menu and tap 'Add to Home Screen'.",
          "Confirm the name and tap 'Add' in the top right corner."
        ]
      };
    }
     // Edge
    if (browserInfo.isEdge) {
      return {
        title: "Install on Edge (Mac & Windows)",
        steps: [
          "Look for the Install icon (a screen with a plus) in the address bar.",
          "Alternatively, click the three-dots menu (···) in the top-right.",
          "Go to 'Apps' and select 'Install Orbit360'.",
          "Click 'Install' in the confirmation pop-up."
        ]
      };
    }
    // Fallback
    return {
      title: "Manual Installation Instructions",
      steps: [
        "For the best experience, use a modern browser like Google Chrome, Safari (on macOS/iOS), or Microsoft Edge.",
        "In your browser's address bar or main menu, look for an option like 'Install App', 'Add to Dock', or 'Add to Home Screen'.",
        "Follow your browser's prompts to complete the installation.",
        "This will add Orbit360 to your device for quick, app-like access."
      ]
    };
  };

  if (isInstalled) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4" style={{ backgroundColor: '#F5F5F5' }}>
        <Card className="w-full max-w-lg text-center shadow-xl">
          <CardHeader>
            <Logo size="large" className="mx-auto mb-4" />
            <CardTitle className="text-3xl font-bold text-green-700">App Installed!</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-xl font-semibold mb-4">Orbit360 is now installed on your device</h2>
            <p className="text-gray-600 mb-6">You can access it from your desktop, start menu, or dock anytime - even offline!</p>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                The app will automatically sync when you're back online.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const instructions = getInstallInstructions();

  return (
    <div className="flex items-center justify-center min-h-screen p-4" style={{ backgroundColor: '#F5F5F5' }}>
      <Card className="w-full max-w-2xl text-center shadow-2xl">
        <CardHeader>
          <Logo size="large" className="mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-gray-900">Install Orbit360</CardTitle>
          <CardDescription className="text-gray-600 mt-2 text-lg">
            Get the full desktop app experience with offline capabilities.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4 text-left p-6 bg-gray-50 rounded-xl border">
              <h3 className="text-xl font-semibold text-gray-800">Why install the app?</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-green-600 mt-1" />
                  <span><span className="font-semibold">Works Offline:</span> Access your data from anywhere, anytime.</span>
                </li>
                <li className="flex items-start gap-3">
                  <ExternalLink className="w-5 h-5 text-blue-600 mt-1" />
                  <span><span className="font-semibold">Launches Separately:</span> Runs in its own window, not a browser tab.</span>
                </li>
                <li className="flex items-start gap-3">
                  <MonitorSmartphone className="w-5 h-5 text-purple-600 mt-1" />
                  <span><span className="font-semibold">Faster & Focused:</span> Better performance and fewer distractions.</span>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col items-center justify-center">
               {!isSupported && (
                <Alert variant="destructive" className="mb-4">
                  <Chrome className="h-4 w-4" />
                  <AlertDescription>
                    Your browser may not fully support installation. For the best experience, please use Google Chrome or Microsoft Edge.
                  </AlertDescription>
                </Alert>
              )}
              
              <Button
                onClick={handleInstall}
                className="w-full py-6 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                disabled={installing}
              >
                <Download className="w-6 h-6 mr-3" />
                {installing ? 'Installing...' : 'Install Desktop App'}
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                Click to install or show manual instructions.
              </p>
            </div>
          </div>

          {showManualInstructions && (
            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-xl text-left animate-in fade-in duration-500">
              <h3 className="text-xl font-bold text-blue-800 mb-4">{instructions.title}</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                {instructions.steps.map((step, index) => <li key={index}>{step}</li>)}
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
