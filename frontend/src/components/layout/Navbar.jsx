import {
  LayoutDashboard,
  BookOpen,
  PieChart,
  User,
  Plus,
  Moon,
  Sun,
  Bell,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { getProfileImageUrl } from '../../data/financeData';

export default function Navbar() {
  const {
    currentScreen,
    setCurrentScreen,
    currentUser,
    isLoggedIn,
    pendingAdminRequestsCount,
    setIsReviewResetModalOpen,
  } = useFinance();
  const { toggleTheme, isDark } = useTheme();

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ledger', label: 'Ledger', icon: BookOpen },
    { id: 'budget', label: 'Budget Planner', icon: PieChart },
    { id: 'profile', label: 'Settings & Profile', icon: User },
  ];

  const handleNavClick = (screenId) => {
    setCurrentScreen(screenId);
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
        isDark
          ? 'bg-[#0e0e10]/95 border-[#26262b] text-[#e8e8ea]'
          : 'bg-[#f6f5f2]/95 border-[#e5e3dc] text-[#18181b]'
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick(isLoggedIn ? 'dashboard' : 'login')}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center select-none shadow-md shadow-[#c9b27c]/20 transition-transform group-hover:scale-105 border border-[#c9b27c]/30 bg-[#17171a] shrink-0">
              <img src="/Logo.png" alt="SHAKA Logo" className="w-full h-full object-contain p-0.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-[#e8e8ea] group-hover:text-[#c9b27c] transition-colors">
                  SHAKA
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#c9b27c]/15 text-[#c9b27c] border border-[#c9b27c]/30 font-semibold hidden sm:inline-block">
                  LEDGER
                </span>
              </div>
              <p className="text-[11px] text-[#8a8a93] hidden md:block">
                Structure Your Spend. Elevate Your Wealth.
              </p>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        {isLoggedIn && (
          <nav className="hidden md:flex items-center gap-1 bg-[#17171a] border border-[#26262b] p-1 rounded-xl">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentScreen === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#c9b27c] text-neutral-950 shadow-sm'
                      : 'text-[#8a8a93] hover:text-[#e8e8ea] hover:bg-[#202024]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Actions & Utilities */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Add Expense Button (hidden on mobile since MobileNav has prominent + button) */}
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => handleNavClick('add-expense')}
              className="hidden sm:flex px-3.5 py-2 rounded-xl bg-gradient-to-tr from-[#c9b27c] to-[#a68d55] text-neutral-950 font-bold text-xs shadow-md shadow-[#c9b27c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Expense</span>
            </button>
          )}

          {/* Admin Password Reset Approval Notification Badge */}
          {isLoggedIn && currentUser?.role === 'Admin' && (
            <button
              type="button"
              title={
                pendingAdminRequestsCount > 0
                  ? `${pendingAdminRequestsCount} pending password reset request awaiting your approval`
                  : 'No pending reset requests'
              }
              onClick={() => setIsReviewResetModalOpen(true)}
              className="relative p-2 rounded-xl border border-[#26262b] bg-[#17171a] text-[#8a8a93] hover:text-[#e8e8ea] hover:border-[#c9b27c]/40 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4 text-[#c9b27c]" />
              {pendingAdminRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#d4a359] text-neutral-950 font-black text-[10px] flex items-center justify-center animate-pulse shadow-sm">
                  {pendingAdminRequestsCount}
                </span>
              )}
            </button>
          )}

          {/* Theme switcher */}
          <button
            type="button"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
            onClick={(e) => toggleTheme(e)}
            className="p-2 rounded-xl border border-[#26262b] bg-[#17171a] text-[#8a8a93] hover:text-[#e8e8ea] hover:border-[#c9b27c]/40 transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4 text-[#c9b27c]" /> : <Moon className="w-4 h-4 text-[#c9b27c]" />}
          </button>

          {/* User profile avatar badge */}
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => handleNavClick('profile')}
              title={currentUser?.name ? `${currentUser.name} (@${currentUser.username})` : (currentUser?.username || 'Profile')}
              className="flex items-center gap-2 pl-1 group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full border border-[#26262b] bg-[#17171a] group-hover:border-[#c9b27c] text-[#c9b27c] font-bold text-xs flex items-center justify-center transition-colors shadow-sm overflow-hidden">
                <img
                  src={getProfileImageUrl(currentUser?.profileImage || currentUser?.avatar)}
                  alt={currentUser?.username || 'User'}
                  className="w-full h-full object-cover"
                />
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleNavClick('login')}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#c9b27c] text-neutral-950 hover:bg-[#bba46e] transition-colors cursor-pointer"
              >
                Log In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

