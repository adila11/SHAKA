import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../data/financeData';
import { Skeleton } from '../common/Skeleton';

export default function ProjectedSpendWidget({ customTheme = null }) {
  const { totalSpent, monthlyLimit, isLoading } = useFinance();
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  // Assuming 22 days passed, projected = (totalSpent / 22) * 30
  const projectedVal = Math.round((totalSpent / 22) * 30) || 25080;
  const underPercent = monthlyLimit > 0
    ? (((monthlyLimit - projectedVal) / monthlyLimit) * 100).toFixed(1)
    : '0.0';

  return (
    <div
      className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors shadow-sm ${
        isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-[#c9b27c]/15 text-[#c9b27c] flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4" />
        </div>
        <div>
          <span className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Projected Month-End
          </span>
          <div className={`text-sm font-black font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            {isLoading ? (
              <Skeleton className="w-24 h-4 my-0.5" />
            ) : (
              <>
                {formatCurrency(projectedVal)}{' '}
                <span className={`text-[10px] font-normal ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                  of {formatCurrency(monthlyLimit)}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 text-[11px] font-semibold text-[#8fb39a]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>{underPercent > 0 ? `-${underPercent}% under` : `${Math.abs(underPercent)}% over`}</span>
      </div>
    </div>
  );
}
