import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../data/financeData';
import { Skeleton } from '../common/Skeleton';

export default function MonthlyLimitWidget({ customTheme = null }) {
  const { totalSpent, monthlyLimit, remainingLimit, percentSpent, isLoading } = useFinance();
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  return (
    <div
      className={`p-4 rounded-2xl border shadow-sm transition-colors ${
        isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className={`text-[11px] uppercase tracking-wider font-medium ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Spent so far
          </span>
          <div className={`text-2xl font-black font-mono tracking-tight mt-0.5 ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            {isLoading ? <Skeleton className="w-28 h-7 my-0.5" /> : formatCurrency(totalSpent)}
          </div>
        </div>
        <div className="text-right">
          <span className={`text-[11px] uppercase tracking-wider font-medium ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Monthly Limit
          </span>
          <div className={`text-sm font-bold font-mono mt-0.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            {isLoading ? <Skeleton className="w-20 h-4 my-0.5" /> : formatCurrency(monthlyLimit)}
          </div>
        </div>
      </div>

      {/* Slim progress bar */}
      <div className={`w-full h-2 rounded-full mt-3.5 overflow-hidden ${isDark ? 'bg-[#26262b]' : 'bg-[#e5e3dc]'}`}>
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-full" />
        ) : (
          <div
            className="h-full rounded-full bg-[#c9b27c] transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, percentSpent)}%` }}
          />
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] mt-2">
        <span className="font-medium text-[#c9b27c]">
          {isLoading ? <Skeleton className="w-16 h-3" /> : `${percentSpent}% consumed`}
        </span>
        <span className="font-semibold text-[#8fb39a]">
          {isLoading ? <Skeleton className="w-20 h-3" /> : `${formatCurrency(remainingLimit)} left`}
        </span>
      </div>
    </div>
  );
}
