import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../data/financeData';
import { Skeleton } from '../common/Skeleton';

export default function DonutSpendWidget({ customTheme = null }) {
  const { totalSpent, budgetCategories, categoryTotals, isLoading } = useFinance();
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  const circumference = 2 * Math.PI * 38; // ~238.76

  const formatShort = (amt) => {
    return '₹' + (amt >= 1000 ? (amt / 1000).toFixed(1) + 'k' : amt);
  };

  // Compute category items dynamically
  const categoriesWithSpend = budgetCategories.map((cat) => {
    const spent = cat.spent !== undefined ? cat.spent : categoryTotals[cat.name] || 0;
    return {
      ...cat,
      spent,
      color: cat.color || '#c9b27c',
    };
  });

  const sumTotal = totalSpent > 0 ? totalSpent : categoriesWithSpend.reduce((acc, c) => acc + c.spent, 0);

  // Calculate segment lengths and offsets
  let runningOffset = 0;
  const segments = categoriesWithSpend.map((cat) => {
    const len = sumTotal > 0 ? (cat.spent / sumTotal) * circumference : 0;
    const segOffset = -runningOffset;
    runningOffset += len;
    return {
      ...cat,
      len,
      offset: segOffset,
    };
  });

  const sortedCategories = [...categoriesWithSpend].sort((a, b) => b.spent - a.spent);
  const topCategory = sortedCategories[0];

  return (
    <div
      className={`p-4 rounded-2xl border shadow-sm transition-colors ${
        isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-[11px] uppercase tracking-wider font-semibold ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
          Spending by Category
        </span>
        {topCategory && (
          <span className="text-[11px] font-semibold text-[#c9b27c]">
            Top: {topCategory.name} ({formatCurrency(topCategory.spent)})
          </span>
        )}
      </div>

      <div className="relative w-40 h-40 mx-auto my-1 flex items-center justify-center">
        {/* SVG Donut Chart with Dynamic Palette */}
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {sumTotal === 0 ? (
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke={isDark ? '#26262b' : '#e5e3dc'}
              strokeWidth="11"
            />
          ) : (
            segments.map((seg) => (
              <circle
                key={seg.id || seg.name}
                cx="50"
                cy="50"
                r="38"
                fill="transparent"
                stroke={seg.color}
                strokeWidth="11"
                strokeDasharray={`${seg.len} ${circumference}`}
                strokeDashoffset={seg.offset}
                className="transition-all duration-700"
              />
            ))
          )}
        </svg>

        {/* Center Pill */}
        <div
          className={`absolute flex flex-col items-center justify-center w-20 h-20 rounded-full border shadow-inner ${
            isDark
              ? 'bg-[#0e0e10] border-[#26262b]'
              : 'bg-[#f6f5f2] border-[#e5e3dc]'
          }`}
        >
          <span className={`text-[9px] uppercase tracking-wider font-medium ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Nov Total
          </span>
          <span className={`text-xs font-black font-mono tracking-tight mt-0.5 ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            {isLoading ? <Skeleton className="w-10 h-3 my-0.5" /> : formatShort(totalSpent)}
          </span>
        </div>
      </div>

      {/* Legend row */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2.5 border-t border-[#26262b]/40 mt-1">
        {categoriesWithSpend.slice(0, 5).map((cat) => (
          <div key={cat.id || cat.name} className="flex items-center gap-1.5 text-center">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <p className={`text-[10px] ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>{cat.name}</p>
            <p className={`text-[10px] font-bold font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              {formatShort(cat.spent)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
