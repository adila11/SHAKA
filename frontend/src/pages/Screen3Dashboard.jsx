import AppHeader from '../components/layout/AppHeader';
import BottomNavigation from '../components/layout/BottomNavigation';
import MonthlyLimitWidget from '../components/widgets/MonthlyLimitWidget';
import DonutSpendWidget from '../components/widgets/DonutSpendWidget';
import StatCardsWidget from '../components/widgets/StatCardsWidget';
import ProjectedSpendWidget from '../components/widgets/ProjectedSpendWidget';
import { useTheme } from '../context/ThemeContext';

export default function Screen3Dashboard({ customTheme = null, onNavigate }) {
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* App Header Inside Phone */}
      <AppHeader title="SHAKA" customTheme={customTheme} onProfileClick={() => onNavigate && onNavigate('profile')} />

      {/* Scrollable Dashboard Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
        {/* Greeting Row */}
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-[11px] font-medium uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              November 2026
            </p>
            <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              Shared Overview
            </h3>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#8fb39a]/15 text-[#8fb39a] font-semibold border border-[#8fb39a]/30">
            On Track
          </span>
        </div>

        {/* WIDGET 1: Monthly Limit Card */}
        <MonthlyLimitWidget customTheme={customTheme} />

        {/* WIDGET 2: Donut Chart with Center Pill */}
        <DonutSpendWidget customTheme={customTheme} />

        {/* WIDGET 3: Row of 3 Small Stat Cards */}
        <StatCardsWidget customTheme={customTheme} />

        {/* WIDGET 4: Projected Month-End Spend Card */}
        <ProjectedSpendWidget customTheme={customTheme} />
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation currentScreen="dashboard" onNavigate={onNavigate} customTheme={customTheme} />
    </div>
  );
}
