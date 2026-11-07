import { ShieldCheck, UserPen, KeyRound, Palette, SunMedium, Moon, LogOut, ChevronRight } from 'lucide-react';
import BottomNavigation from '../components/layout/BottomNavigation';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { getProfileImageUrl } from '../data/financeData';

export default function Screen7Profile({ customTheme = null, onNavigate }) {
  const { currentUser, navigateTo, logout } = useFinance();
  const { isDark: globalDark, toggleTheme } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  const handleNav = (screen) => {
    if (onNavigate) {
      onNavigate(screen);
    } else {
      navigateTo(screen);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Profile Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Profile Card */}
        <div
          className={`p-5 rounded-2xl border text-center transition-colors shadow-sm ${
            isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
          }`}
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#26262b] to-[#1f1f24] border-2 border-[#c9b27c] text-[#c9b27c] text-xl font-bold flex items-center justify-center mx-auto mb-3 shadow-md shadow-[#c9b27c]/10 overflow-hidden">
            <img
              src={getProfileImageUrl(currentUser?.profileImage || currentUser?.avatar)}
              alt={currentUser?.username || 'Profile'}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className={`text-base font-bold tracking-tight font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            {currentUser?.username || 'User'}
          </h3>
          <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Multi-User Shared Ledger Admin
          </p>
          <div className="mt-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#c9b27c]/15 text-[#c9b27c] text-[10px] font-semibold">
            <ShieldCheck className="w-3 h-3" />
            <span>{currentUser.role}</span>
          </div>
        </div>

        {/* Settings Rows Card */}
        <div
          className={`rounded-2xl border divide-y overflow-hidden shadow-sm transition-colors ${
            isDark
              ? 'bg-[#17171a] border-[#26262b] divide-[#26262b]'
              : 'bg-white border-[#e5e3dc] divide-[#e5e3dc]'
          }`}
        >
          {/* Edit Profile */}
          <button
            type="button"
            onClick={() => handleNav('profile')}
            className={`w-full px-4 py-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
              isDark ? 'hover:bg-neutral-800/40' : 'hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <UserPen className="w-4 h-4 text-[#8a8a93]" />
              <span className={`text-xs font-medium ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                Edit Profile Info
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8a8a93]" />
          </button>

          {/* Change Password */}
          <button
            type="button"
            onClick={() => handleNav('change-pass')}
            className={`w-full px-4 py-3.5 flex items-center justify-between text-left transition-colors cursor-pointer ${
              isDark ? 'hover:bg-neutral-800/40' : 'hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-[#8a8a93]" />
              <span className={`text-xs font-medium ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                Change Password
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#8a8a93]" />
          </button>

          {/* Theme Switcher Toggle */}
          <div className="w-full px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="w-4 h-4 text-[#8a8a93]" />
              <span className={`text-xs font-medium ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                Theme Appearance
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => toggleTheme(e)}
              className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isDark
                  ? 'bg-neutral-800 border-[#26262b] text-[#e8e8ea] hover:bg-neutral-700'
                  : 'bg-neutral-100 border-[#e5e3dc] text-[#18181b] hover:bg-neutral-200'
              }`}
            >
              {isDark ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#c9b27c]" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <SunMedium className="w-3.5 h-3.5 text-[#c9b27c]" />
                  <span>Light</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="w-full py-3.5 rounded-2xl bg-[#d97070]/15 hover:bg-[#d97070]/25 text-[#d97070] font-semibold text-xs border border-[#d97070]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out of Session</span>
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation currentScreen="profile" onNavigate={onNavigate} customTheme={customTheme} />
    </div>
  );
}
