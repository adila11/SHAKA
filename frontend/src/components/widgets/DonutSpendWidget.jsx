import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../data/financeData';

export default function DonutSpendWidget({ customTheme = null }) {
  const { totalSpent, categoryTotals } = useFinance();
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  const foodAmt = categoryTotals['Food'] || 6800;
  const rentAmt = categoryTotals['Rent'] || 5200;
  const travelAmt = categoryTotals['Travel'] || 2800;
  const billsAmt = categoryTotals['Bills'] || 3600;

  const sumTotal = foodAmt + rentAmt + travelAmt + billsAmt || totalSpent || 1;
  const circumference = 2 * Math.PI * 38; // ~238.76

  const foodLen = (foodAmt / sumTotal) * circumference;
  const rentLen = (rentAmt / sumTotal) * circumference;
  const travelLen = (travelAmt / sumTotal) * circumference;
  const billsLen = (billsAmt / sumTotal) * circumference;

  const foodOffset = 0;
  const rentOffset = -foodLen;
  const travelOffset = -(foodLen + rentLen);
  const billsOffset = -(foodLen + rentLen + travelLen);

  const formatShort = (amt) => {
    return '₹' + (amt >= 1000 ? (amt / 1000).toFixed(1) + 'k' : amt);
  };

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
        <span className="text-[11px] font-semibold text-[#c9b27c]">
          Top: Food ({formatCurrency(foodAmt)})
        </span>
      </div>

      <div className="relative w-40 h-40 mx-auto my-1 flex items-center justify-center">
        {/* SVG Donut Chart with Muted Palette */}
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Food segment */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="transparent"
            stroke="#c9b27c"
            strokeWidth="11"
            strokeDasharray={`${foodLen} ${circumference}`}
            strokeDashoffset={foodOffset}
            className="transition-all duration-700"
          />
          {/* Rent segment */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="transparent"
            stroke="#8fb39a"
            strokeWidth="11"
            strokeDasharray={`${rentLen} ${circumference}`}
            strokeDashoffset={rentOffset}
            className="transition-all duration-700"
          />
          {/* Travel segment */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="transparent"
            stroke="#dcc48d"
            strokeWidth="11"
            strokeDasharray={`${travelLen} ${circumference}`}
            strokeDashoffset={travelOffset}
            className="transition-all duration-700"
          />
          {/* Bills segment */}
          <circle
            cx="50"
            cy="50"
            r="38"
            fill="transparent"
            stroke="#d4a359"
            strokeWidth="11"
            strokeDasharray={`${billsLen} ${circumference}`}
            strokeDashoffset={billsOffset}
            className="transition-all duration-700"
          />
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
            {formatShort(totalSpent)}
          </span>
        </div>
      </div>

      {/* Legend row */}
      <div className="grid grid-cols-4 gap-1 text-center pt-2 border-t border-[#26262b]/40 mt-1">
        <div>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#c9b27c]" />
          <p className={`text-[9px] ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>Food</p>
          <p className={`text-[10px] font-bold font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            {formatShort(foodAmt)}
          </p>
        </div>
        <div>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8fb39a]" />
          <p className={`text-[9px] ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>Rent</p>
          <p className={`text-[10px] font-bold font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            {formatShort(rentAmt)}
          </p>
        </div>
        <div>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#dcc48d]" />
          <p className={`text-[9px] ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>Travel</p>
          <p className={`text-[10px] font-bold font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            {formatShort(travelAmt)}
          </p>
        </div>
        <div>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#d4a359]" />
          <p className={`text-[9px] ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>Bills</p>
          <p className={`text-[10px] font-bold font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            {formatShort(billsAmt)}
          </p>
        </div>
      </div>
    </div>
  );
}
