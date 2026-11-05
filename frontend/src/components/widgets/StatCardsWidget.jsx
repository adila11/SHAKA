import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../data/financeData';

export default function StatCardsWidget({ customTheme = null }) {
  const { totalSpent, todaySpent, todayLogsCount } = useFinance();
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  // Assuming 22 days passed in November
  const avgPerDay = Math.round(totalSpent / 22);

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Card 1: Avg / Day */}
      <div
        className={`p-3 rounded-2xl border flex flex-col justify-between transition-colors shadow-sm ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <span className={`text-[10px] font-medium leading-tight ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
          Avg / Day
        </span>
        <span className={`text-sm font-black font-mono mt-1 ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
          {formatCurrency(avgPerDay)}
        </span>
        <span className="text-[9px] text-[#8fb39a] font-medium mt-0.5">
          Stable
        </span>
      </div>

      {/* Card 2: Today */}
      <div
        className={`p-3 rounded-2xl border flex flex-col justify-between transition-colors shadow-sm ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <span className={`text-[10px] font-medium leading-tight ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
          Today
        </span>
        <span className={`text-sm font-black font-mono mt-1 ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
          {formatCurrency(todaySpent || 420)}
        </span>
        <span className="text-[9px] text-[#c9b27c] font-medium mt-0.5">
          {todayLogsCount || 2} logs
        </span>
      </div>

      {/* Card 3: Days Left */}
      <div
        className={`p-3 rounded-2xl border flex flex-col justify-between transition-colors shadow-sm ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <span className={`text-[10px] font-medium leading-tight ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
          Days Left
        </span>
        <span className={`text-sm font-black font-mono mt-1 ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
          8 d
        </span>
        <span className={`text-[9px] font-medium mt-0.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
          Nov 30
        </span>
      </div>
    </div>
  );
}
