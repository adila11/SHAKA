import {
  ShieldCheck,
  KeyRound,
  SunMedium,
  Moon,
  LogOut,
  ChevronRight,
  Coins,
  UserCheck
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';

export default function ProfilePage() {
  const { currentUser, setCurrentScreen, setIsLoggedIn, transactions } = useFinance();
  const { isDark, setTheme } = useTheme();

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentScreen('login');
  };

  const userTransactionsCount = transactions.filter((t) => t.user === 'Alex').length;

  return (
    <div className="space-y-6 w-full">
      {/* Page Header */}
      <div
        className={`p-6 rounded-2xl border transition-colors shadow-sm ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#c9b27c]/15 text-[#c9b27c] border border-[#c9b27c]/30">
                Verified Account
              </span>
              <span className="text-xs text-[#8a8a93]">SHAKA Instance #3811</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              Settings & Account
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Manage your personal credentials, security settings, and app preferences.
            </p>
          </div>
        </div>
      </div>

      {/* Responsive 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (4 cols on desktop): Member Profile */}
        <div className="lg:col-span-4 space-y-6">
          {/* Profile Card */}
          <div
            className={`p-6 rounded-2xl border text-center transition-colors shadow-sm ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#26262b] to-[#1f1f24] border-2 border-[#c9b27c] text-[#c9b27c] text-2xl font-black flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#c9b27c]/15">
              {currentUser.initials}
            </div>
            <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              {currentUser.name}
            </h3>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              {currentUser.username} • {currentUser.email}
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9b27c]/15 text-[#c9b27c] text-xs font-semibold border border-[#c9b27c]/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{currentUser.role}</span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-[#26262b]/60">
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                }`}
              >
                <span className="text-[10px] text-[#8a8a93] uppercase tracking-wider block">
                  Logged Entries
                </span>
                <span className={`text-lg font-bold font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                  {userTransactionsCount || 14}
                </span>
              </div>
              <div
                className={`p-3 rounded-xl border ${
                  isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                }`}
              >
                <span className="text-[10px] text-[#8a8a93] uppercase tracking-wider block">
                  Status
                </span>
                <span className={`text-lg font-bold font-mono text-[#8fb39a]`}>
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (8 cols on desktop): Settings Panels */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Security & Credentials */}
          <div
            className={`p-5 rounded-2xl border transition-colors shadow-sm ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Security & Credentials
            </h4>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setCurrentScreen('change-pass')}
                className={`w-full p-4 rounded-xl border flex items-center justify-between text-left transition-colors cursor-pointer ${
                  isDark
                    ? 'bg-[#0e0e10] border-[#26262b] hover:border-[#c9b27c]'
                    : 'bg-[#f6f5f2] border-[#e5e3dc] hover:border-[#c9b27c]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#c9b27c]/15 text-[#c9b27c] flex items-center justify-center">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-sm font-bold block ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                      Change Password
                    </span>
                    <span className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                      Update your login passphrase and multi-user authentication token
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-[#8a8a93]" />
              </button>

              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#8fb39a]/15 text-[#8fb39a] flex items-center justify-center">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-sm font-bold block ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                      Two-Factor Authentication
                    </span>
                    <span className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                      Enforced for all admin transactions above ₹5,000
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#8fb39a]/15 text-[#8fb39a] border border-[#8fb39a]/30">
                  Enabled
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Preferences & Theme */}
          <div
            className={`p-5 rounded-2xl border transition-colors shadow-sm ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Preferences & Styling
            </h4>

            <div className="space-y-4">
              {/* Theme Selector */}
              <div>
                <span className={`text-xs font-medium block mb-2 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                  Color Theme (Stitch Design Specification)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      isDark
                        ? 'bg-[#0e0e10] border-[#c9b27c] ring-1 ring-[#c9b27c]'
                        : 'bg-[#f6f5f2] border-[#e5e3dc] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Moon className="w-5 h-5 text-[#c9b27c]" />
                    <div className="text-left">
                      <span className="text-xs font-bold block text-[#e8e8ea]">Obsidian Dark</span>
                      <span className="text-[10px] text-[#8a8a93]">Base #0e0e10 & Gold</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`p-4 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      !isDark
                        ? 'bg-white border-[#c9b27c] ring-1 ring-[#c9b27c]'
                        : 'bg-[#0e0e10] border-[#26262b] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <SunMedium className="w-5 h-5 text-[#c9b27c]" />
                    <div className="text-left">
                      <span className={`text-xs font-bold block ${!isDark ? 'text-[#18181b]' : 'text-[#e8e8ea]'}`}>
                        Alabaster Light
                      </span>
                      <span className="text-[10px] text-[#8a8a93]">Base #f6f5f2 & Gold</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Currency Standard */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#c9b27c]/15 text-[#c9b27c] flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={`text-sm font-bold block ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                      Standard Currency
                    </span>
                    <span className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                      Indian Rupee (₹) with JetBrains Mono tabular numerics
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#c9b27c]">INR (₹)</span>
              </div>
            </div>
          </div>

          {/* Section 3: Danger Zone */}
          <div
            className={`p-5 rounded-2xl border border-[#d97070]/30 bg-[#d97070]/5 transition-colors shadow-sm`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#d97070]">
                  Session Control
                </h4>
                <p className={`text-xs mt-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                  Terminate your active login session on this browser.
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl bg-[#d97070]/15 hover:bg-[#d97070]/25 text-[#d97070] font-bold text-xs border border-[#d97070]/30 transition-all flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Session</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
