import { Moon, Sun, Smartphone, Layers, Plus } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';

export default function ShakaHeader() {
  const { currentScreen, setCurrentScreen, viewMode, setViewMode } = useFinance();
  const { toggleTheme, isDark } = useTheme();

  const screens = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'ledger', label: 'Ledger' },
    { id: 'add-expense', label: 'Log Expense' },
    { id: 'budget', label: 'Budget' },
    { id: 'profile', label: 'Profile' },
    { id: 'login', label: 'Login' },
    { id: 'forgot', label: 'Forgot' },
    { id: 'change-pass', label: 'Change Pass' },
  ];

  return (
    <header className="w-full max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 bg-neutral-900/90 dark:bg-[#17171a]/95 border border-neutral-800 dark:border-[#26262b] p-4 rounded-2xl shadow-xl backdrop-blur-md sticky top-4 z-50">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9b27c] to-[#917d50] flex items-center justify-center font-black text-neutral-950 text-xl shadow-lg shadow-[#c9b27c]/25 select-none">
          S
        </div>
        <div>
          <h1 className="text-lg font-bold text-neutral-100 dark:text-[#e8e8ea] tracking-tight flex items-center gap-2">
            SHAKA
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#c9b27c]/20 text-[#c9b27c] font-semibold border border-[#c9b27c]/30">
              Stitch Design Integration
            </span>
          </h1>
          <p className="text-xs text-neutral-400 dark:text-[#8a8a93]">
            Quiet Luxury Shared Finance • 8 Modular Screens • JetBrains Mono Numerics
          </p>
        </div>
      </div>

      {/* Screen Quick Navigator (in Single mode) */}
      {viewMode === 'single' && (
        <div className="hidden lg:flex items-center gap-1 bg-neutral-950/80 dark:bg-[#0e0e10] p-1 rounded-xl border border-neutral-800 dark:border-[#26262b] text-xs">
          {screens.map(s => {
            const isActive = currentScreen === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentScreen(s.id)}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                  isActive
                    ? 'bg-[#c9b27c] text-neutral-950 font-bold shadow-sm'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      )}

      {/* View Mode & Theme Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Quick Add Button */}
        <button
          type="button"
          onClick={() => setCurrentScreen('add-expense')}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-tr from-[#c9b27c] to-[#a68d55] text-neutral-950 font-bold text-xs shadow-md shadow-[#c9b27c]/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Add Expense</span>
        </button>

        {/* View Mode Switcher */}
        <div className="bg-neutral-950 dark:bg-[#0e0e10] p-1 rounded-xl border border-neutral-800 dark:border-[#26262b] flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'all'
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All 8 Screens</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('single')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'single'
                ? 'bg-neutral-800 text-white font-semibold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Interactive App</span>
          </button>
        </div>

        {/* Theme Switcher */}
        <div className="bg-neutral-950 dark:bg-[#0e0e10] p-1 rounded-xl border border-neutral-800 dark:border-[#26262b] flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={(e) => toggleTheme(e, 'dark')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              isDark
                ? 'bg-[#c9b27c] text-neutral-950'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>
          <button
            type="button"
            onClick={(e) => toggleTheme(e, 'light')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1 cursor-pointer ${
              !isDark
                ? 'bg-[#c9b27c] text-neutral-950'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>
        </div>
      </div>
    </header>
  );
}
