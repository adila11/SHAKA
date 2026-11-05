import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BottomNavigation from '../components/layout/BottomNavigation';
import CategoryBadge from '../components/common/CategoryBadge';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../data/financeData';

export default function Screen4Ledger({ customTheme = null, onNavigate }) {
  const { transactions, totalSpent } = useFinance();
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  const [selectedMonth, setSelectedMonth] = useState('Nov 2026');

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Month Selector Header */}
      <div
        className={`px-5 py-2.5 border-b flex items-center justify-between shrink-0 transition-colors ${
          isDark ? 'border-[#26262b] bg-[#0e0e10]' : 'border-[#e5e3dc] bg-[#f6f5f2]'
        }`}
      >
        <div>
          <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            Ledger
          </h3>
          <p className={`text-[11px] ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Synced across 3 members
          </p>
        </div>
        <div
          className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-xl shadow-sm ${
            isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
          }`}
        >
          <button
            type="button"
            onClick={() => setSelectedMonth('Oct 2026')}
            className={`cursor-pointer ${isDark ? 'text-[#8a8a93] hover:text-[#e8e8ea]' : 'text-[#71717a] hover:text-[#18181b]'}`}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className={`text-xs font-semibold px-1 ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            {selectedMonth}
          </span>
          <button
            type="button"
            onClick={() => setSelectedMonth('Nov 2026')}
            className={`cursor-pointer ${isDark ? 'text-[#8a8a93] hover:text-[#e8e8ea]' : 'text-[#71717a] hover:text-[#18181b]'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontally Scrollable Table Container */}
      <div className="flex-1 overflow-y-auto overflow-x-auto p-4">
        <div
          className={`min-w-[360px] rounded-2xl border overflow-hidden shadow-sm transition-colors ${
            isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
          }`}
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className={`border-b text-[10px] uppercase tracking-wider font-semibold ${
                  isDark
                    ? 'border-[#26262b] bg-[#121214] text-[#8a8a93]'
                    : 'border-[#e5e3dc] bg-[#fbfaf8] text-[#71717a]'
                }`}
              >
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDark ? 'divide-[#26262b]/60' : 'divide-[#e5e3dc]/80'
              }`}
            >
              {transactions.map((tx) => (
                <tr
                  key={tx.id}
                  className={`transition-colors ${
                    isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-neutral-100/60'
                  }`}
                >
                  <td className={`py-2.5 px-3 whitespace-nowrap ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    {tx.date}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <CategoryBadge category={tx.category} customColor={tx.categoryColor} />
                  </td>
                  <td className={`py-2.5 px-3 font-medium max-w-[120px] truncate ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                    {tx.description}
                  </td>
                  <td className={`py-2.5 px-3 text-right font-bold font-mono whitespace-nowrap ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                    {formatCurrency(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Sticky Total Footer Row */}
          <div
            className={`px-4 py-3 border-t flex items-center justify-between ${
              isDark ? 'bg-[#131316] border-[#26262b]' : 'bg-[#fbfaf8] border-[#e5e3dc]'
            }`}
          >
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Month Total
            </span>
            <span className="text-base font-extrabold font-mono text-[#c9b27c]">
              {formatCurrency(totalSpent)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation currentScreen="ledger" onNavigate={onNavigate} customTheme={customTheme} />
    </div>
  );
}
