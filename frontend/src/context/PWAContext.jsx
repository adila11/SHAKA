import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const PWAContext = createContext(null);

function getInitialPlatformInfo() {
  if (typeof window === 'undefined') {
    return { isIOS: false, isAndroid: false, isDesktop: true };
  }
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIOSDevice =
    /iphone|ipad|ipod/.test(userAgent) ||
    (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);
  const isAndroidDevice = /android/.test(userAgent);
  const isDesktopDevice = !isIOSDevice && !isAndroidDevice;

  return {
    isIOS: isIOSDevice,
    isAndroid: isAndroidDevice,
    isDesktop: isDesktopDevice,
  };
}

function getInitialIsStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

export function PWAProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(getInitialIsStandalone);
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [platformInfo] = useState(getInitialPlatformInfo);

  // 1. Network connectivity listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 2. Register Service Worker & handle updates
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let refreshing = false;
    const handleControllerChange = () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        // If an updated worker is already waiting
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        // Listen for new workers being installed
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setUpdateAvailable(true);
            }
          });
        });

        // Periodically check for service worker updates (every 60 minutes)
        const updateInterval = setInterval(() => {
          registration.update().catch((err) => {
            console.warn('[PWA] Periodic update check skipped:', err);
          });
        }, 60 * 60 * 1000);

        return () => clearInterval(updateInterval);
      })
      .catch((err) => {
        console.warn('[PWA] Service worker registration error:', err);
      });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // 3. Capture native beforeinstallprompt and appinstalled events
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e) => {
      // Prevent automatic mini-infobar on mobile Chrome
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      setIsInstallModalOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 4. Trigger install prompt or show custom installation guide modal
  const installApp = useCallback(async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          setIsInstallable(false);
          setIsInstallModalOpen(false);
        }
      } catch (err) {
        console.warn('[PWA] Install prompt error:', err);
        setIsInstallModalOpen(true);
      }
    } else {
      // If browser doesn't support automatic prompt (e.g. iOS Safari), show instructions
      setIsInstallModalOpen(true);
    }
  }, [deferredPrompt]);

  // 5. Apply pending service worker update
  const applyUpdate = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    } else {
      window.location.reload();
    }
  }, [waitingWorker]);

  const value = useMemo(
    () => ({
      isInstallable,
      isInstalled,
      isOffline,
      updateAvailable,
      installApp,
      applyUpdate,
      isInstallModalOpen,
      setIsInstallModalOpen,
      platformInfo,
      canNativePrompt: !!deferredPrompt,
    }),
    [
      isInstallable,
      isInstalled,
      isOffline,
      updateAvailable,
      installApp,
      applyUpdate,
      isInstallModalOpen,
      platformInfo,
      deferredPrompt,
    ]
  );

  return <PWAContext.Provider value={value}>{children}</PWAContext.Provider>;
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}
