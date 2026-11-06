import { useState } from 'react';
import BottomNavigation from '../components/layout/BottomNavigation';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../data/financeData';

export default function Screen6Budget({ customTheme = null, onNavigate }) {
  const { budgetCategories, totalSpent, monthlyLimit, remainingLimit, updateCategoryLimit } = useFinance();
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Budget Header */}
      <div
        className={`px-5 py-2.5 border-b flex items-center justify-between shrink-0 transition-colors ${
          isDark ? 'border-[#26262b] bg-[#0e0e10]' : 'border-[#e5e3dc] bg-[#f6f5f2]'
        }`}
      >
        <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
          Budget Allocation
        </h3>
        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className={`px-2.5 py-1 rounded-xl border text-xs font-semibold text-[#c9b27c] transition-colors cursor-pointer ${
            isDark ? 'bg-[#17171a] border-[#26262b] hover:bg-neutral-800' : 'bg-white border-[#e5e3dc] hover:bg-neutral-50'
          }`}
        >
          {isEditing ? 'Done' : 'Edit Limits'}
        </button>
      </div>

      {/* Content List */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {/* Total Monthly Budget Card */}
        <div
          className={`p-4 rounded-2xl border transition-colors shadow-sm ${
            isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] uppercase tracking-wider font-semibold ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Total Monthly Budget
            </span>
            <span className="text-xs font-bold text-[#8fb39a]">
              {formatCurrency(remainingLimit)} Left
            </span>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className={`text-xl font-black font-mono tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              {formatCurrency(totalSpent)}
            </span>
            <span className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Limit {formatCurrency(monthlyLimit)}
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#26262b]' : 'bg-[#e5e3dc]'}`}>
            <div
              className="h-full rounded-full bg-[#c9b27c] transition-all duration-500"
              style={{ width: `${monthlyLimit > 0 ? Math.min(100, (totalSpent / monthlyLimit) * 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Category Allocations List */}
        <div className="space-y-2.5">
          {budgetCategories.map((cat) => {
            const percent = cat.limit > 0 ? Math.round((cat.spent / cat.limit) * 100) : 0;
            const remaining = Math.max(0, cat.limit - cat.spent);

            return (
              <div
                key={cat.id}
                className={`p-3.5 rounded-2xl border transition-colors shadow-sm ${
                  isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs font-bold ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                    {cat.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {cat.status === 'Limit reached' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d97070]/20 text-[#d97070] font-bold">
                        Limit reached
                      </span>
                    )}
                    {cat.status === 'Near limit' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4a359]/20 text-[#d4a359] font-bold">
                        Near limit
                      </span>
                    )}
                    <span
                      className={`text-xs font-bold font-mono ${
                        percent > 100 ? 'text-[#d97070]' : isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'
                      }`}
                    >
                      {formatCurrency(cat.spent)}{' '}
                      <span className={`text-[10px] font-normal ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                        / {formatCurrency(cat.limit)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#26262b]' : 'bg-[#e5e3dc]'}`}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, percent)}%`,
                      backgroundColor: cat.statusColor || '#c9b27c',
                    }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-[#8a8a93] mt-1.5">
                  <span className={percent > 100 ? 'text-[#d97070] font-medium' : ''}>
                    {percent}% used
                  </span>
                  <span>{percent > 100 ? 'Over budget' : `${formatCurrency(remaining)} remaining`}</span>
                </div>

                {/* Interactive Limit Adjuster */}
                {isEditing && (
                  <div className="mt-2.5 pt-2 border-t border-[#26262b]/50 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#8a8a93]">Adjust limit:</span>
                    <input
                      type="number"
                      value={cat.limit}
                      onChange={(e) => updateCategoryLimit(cat.id, e.target.value)}
                      className={`w-28 px-2 py-1 rounded-lg text-xs font-mono border ${
                        isDark ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]' : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                      }`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation currentScreen="budget" onNavigate={onNavigate} customTheme={customTheme} />
    </div>
  );
}
