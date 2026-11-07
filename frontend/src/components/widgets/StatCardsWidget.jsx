import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../data/financeData';
import { Skeleton } from '../common/Skeleton';

export default function StatCardsWidget({ customTheme = null }) {
  const {
    totalSpent,
    todaySpent,
    todayLogsCount,
    daysPassed,
    daysRemaining,
    shortMonth,
    totalDaysInMonth,
    isLoading,
  } = useFinance();
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  const avgPerDay = daysPassed > 0 ? Math.round(totalSpent / daysPassed) : totalSpent;

  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 min-w-0 max-w-full">
      {/* Card 1: Avg / Day */}
      <div
        className={`p-2 sm:p-2.5 rounded-2xl border flex flex-col justify-between transition-colors shadow-sm min-w-0 max-w-full overflow-hidden ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <span className={`text-[9px] sm:text-[10px] font-medium leading-tight truncate block ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
          Avg / Day
        </span>
        <span
          className={`text-[11px] sm:text-xs md:text-sm font-black font-mono mt-1 truncate block max-w-full ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}
          title={formatCurrency(avgPerDay)}
        >
          {isLoading ? <Skeleton className="w-12 h-4 my-0.5" /> : formatCurrency(avgPerDay)}
        </span>
        <span className="text-[8px] sm:text-[9px] text-[#8fb39a] font-medium mt-0.5 truncate block">
          Stable
        </span>
      </div>

      {/* Card 2: Today */}
      <div
        className={`p-2 sm:p-2.5 rounded-2xl border flex flex-col justify-between transition-colors shadow-sm min-w-0 max-w-full overflow-hidden ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <span className={`text-[9px] sm:text-[10px] font-medium leading-tight truncate block ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
          Today
        </span>
        <span
          className={`text-[11px] sm:text-xs md:text-sm font-black font-mono mt-1 truncate block max-w-full ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}
          title={formatCurrency(todaySpent || 0)}
        >
          {isLoading ? <Skeleton className="w-12 h-4 my-0.5" /> : formatCurrency(todaySpent || 0)}
        </span>
        <span className="text-[8px] sm:text-[9px] text-[#c9b27c] font-medium mt-0.5 truncate block">
          {todayLogsCount || 0} logs
        </span>
      </div>

      {/* Card 3: Days Left */}
      <div
        className={`p-2 sm:p-2.5 rounded-2xl border flex flex-col justify-between transition-colors shadow-sm min-w-0 max-w-full overflow-hidden ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <span className={`text-[9px] sm:text-[10px] font-medium leading-tight truncate block ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
          Days Left
        </span>
        <span className={`text-[11px] sm:text-xs md:text-sm font-black font-mono mt-1 truncate block max-w-full ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
          {daysRemaining} d
        </span>
        <span className={`text-[8px] sm:text-[9px] font-medium mt-0.5 truncate block ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
          {shortMonth} {totalDaysInMonth}
        </span>
      </div>
    </div>
  );
}
