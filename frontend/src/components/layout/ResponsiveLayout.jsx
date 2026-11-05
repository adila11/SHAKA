import Navbar from './Navbar';
import MobileNav from './MobileNav';
import AddExpenseModal from '../modals/AddExpenseModal';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';

export default function ResponsiveLayout({ children }) {
  const { isLoggedIn } = useFinance();
  const { isDark } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col font-sans transition-colors ${
        isDark ? 'bg-[#0e0e10] text-[#e8e8ea]' : 'bg-[#f6f5f2] text-[#18181b]'
      }`}
    >
      {/* Top Navbar */}
      <Navbar />

      {/* Main Responsive Page Viewport */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
        {children}
      </main>

      {/* Mobile Floating Bottom Navigation */}
      {isLoggedIn && <MobileNav />}

      {/* Universal Responsive Add Expense Modal */}
      <AddExpenseModal />

      {/* Modern Desktop Footer */}
      <footer className="hidden md:block w-full border-t border-[#26262b]/80 py-6 text-xs text-[#8a8a93] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#c9b27c]" />
            <span>SHAKA • Quiet Luxury Personal Finance & Ledger</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Responsive Web & Mobile Architecture</span>
            <span>•</span>
            <span>Google Stitch Integration</span>
            <span>•</span>
            <span className="font-mono text-[#c9b27c]">v1.0.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

