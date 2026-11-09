import { useState, useEffect } from 'react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';

export default function OfflineBanner() {
  const { isOffline } = usePWA();
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timer = null;
    const handleOnline = () => {
      setShowRestored(true);
      timer = setTimeout(() => {
        setShowRestored(false);
      }, 4000);
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (showRestored) {
    return (
      <div
        className="w-full bg-emerald-950/80 border-b border-emerald-500/30 text-emerald-300 px-4 py-2 text-xs flex items-center justify-center gap-2 backdrop-blur-md animate-fade-in z-50"
        style={{
          paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
        }}
      >
        <Wifi className="w-4 h-4 text-emerald-400" />
        <span className="font-medium">Connection Restored — You are back online.</span>
      </div>
    );
  }

  if (!isOffline) return null;

  return (
    <aside
      aria-label="Network status banner"
      className="w-full bg-[#1e1b13]/95 border-b border-[#c9b27c]/40 text-[#ecd9aa] px-4 py-2 text-xs flex items-center justify-between gap-3 backdrop-blur-md z-50 shadow-sm animate-fade-in"
      style={{
        paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
      }}
    >
      <div className="flex items-center gap-2.5 mx-auto">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#eab308] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#eab308]"></span>
        </span>
        <WifiOff className="w-4 h-4 text-[#eab308]" />
        <span className="font-semibold text-[11px] sm:text-xs">
          Offline Mode Active:
        </span>
        <span className="text-[11px] sm:text-xs text-[#d1c29e] hidden sm:inline">
          Viewing local cached ledger. Remote sync will resume once reconnected.
        </span>
      </div>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-2.5 py-1 rounded-lg bg-[#c9b27c]/20 hover:bg-[#c9b27c]/30 text-[#ecd9aa] text-[10px] font-bold border border-[#c9b27c]/40 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Retry</span>
      </button>
    </aside>
  );
}
