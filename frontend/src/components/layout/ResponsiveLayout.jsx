import Navbar from './Navbar';
import MobileNav from './MobileNav';
import OfflineBanner from '../pwa/OfflineBanner';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';

export default function ResponsiveLayout({ children }) {
  const { isLoggedIn } = useFinance();
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors overflow-x-clip ${
        isDark ? 'bg-[#0e0e10] text-[#e8e8ea]' : 'bg-[#f6f5f2] text-[#18181b]'
      }`}
    >
      {/* Offline Status Banner */}
      <OfflineBanner />

      {/* Top Navbar */}
      <Navbar />

      {/* Main Responsive Page Viewport */}
      <main
        className="flex-1 w-full max-w-7xl mx-auto py-6 md:pb-12 min-w-0 max-w-full"
        style={{
          paddingBottom: isLoggedIn
            ? 'calc(5.5rem + env(safe-area-inset-bottom, 0px))'
            : 'max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom, 0px)))',
          paddingLeft: 'max(0.875rem, env(safe-area-inset-left, 0px))',
          paddingRight: 'max(0.875rem, env(safe-area-inset-right, 0px))',
        }}
      >
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
          <div>
            <span>Created By Shaka 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

