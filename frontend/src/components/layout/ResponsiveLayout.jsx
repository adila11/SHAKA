import Navbar from './Navbar';
import MobileNav from './MobileNav';
import OfflineBanner from '../pwa/OfflineBanner';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { usePWA } from '../../context/PWAContext';
import { Download } from 'lucide-react';

export default function ResponsiveLayout({ children }) {
  const { isLoggedIn } = useFinance();
  const { isDark } = useTheme();
  const { isInstalled, installApp } = usePWA();

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${isDark ? 'bg-[#0e0e10] text-[#e8e8ea]' : 'bg-[#f6f5f2] text-[#18181b]'
        }`}
    >
      {/* Offline Status Banner */}
      <OfflineBanner />

      {/* Top Navbar */}
      <Navbar />

      {/* Main Responsive Page Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12 min-w-0 max-w-full overflow-x-hidden">
        {children}
      </main>

      {/* Mobile Floating Bottom Navigation */}
      {isLoggedIn && <MobileNav />}

      {/* Modern Desktop Footer */}
      <footer className="hidden md:block w-full border-t border-[#26262b]/80 py-6 text-xs text-[#8a8a93] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/Logo.png" alt="SHAKA Logo" className="w-4 h-4 object-contain rounded" />
            <span>SHAKA • Structure Your Spend. Elevate Your Wealth.</span>
          </div>
          <div className="flex items-center gap-4">
            {!isInstalled && (
              <button
                type="button"
                onClick={installApp}
                className="text-[#c9b27c] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install Web App</span>
              </button>
            )}
            <span>Created By Shaka 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

