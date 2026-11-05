import { useState } from 'react';
import { Edit3, Check, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../data/financeData';

export default function BudgetPage() {
  const { budgetCategories, totalSpent, monthlyLimit, remainingLimit, updateCategoryLimit } = useFinance();
  const { isDark } = useTheme();

  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6 w-full">
      {/* Budget Header */}
      <div
        className={`p-6 rounded-2xl border transition-colors shadow-sm ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#c9b27c]/15 text-[#c9b27c] border border-[#c9b27c]/30">
                Ceiling Guard
              </span>
              <span className="text-xs text-[#8a8a93]">Target: Under ₹30,000 / month</span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              Budget Allocation
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Calibrated category caps to preserve long-term financial composure and shared clarity.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              isEditing
                ? 'bg-[#c9b27c] text-neutral-950 border-[#c9b27c] shadow-md shadow-[#c9b27c]/20'
                : isDark
                ? 'bg-[#0e0e10] border-[#26262b] text-[#c9b27c] hover:bg-[#202024]'
                : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#c9b27c] hover:bg-neutral-100'
            }`}
          >
            {isEditing ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save Limits</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                <span>Edit Category Limits</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Total Monthly Budget Overview Card */}
      <div
        className={`p-6 rounded-2xl border transition-colors shadow-sm ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Total Monthly Shared Budget
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className={`text-3xl font-black font-mono tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                {formatCurrency(totalSpent)}
              </span>
              <span className={`text-sm font-medium ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                allocated of {formatCurrency(monthlyLimit)}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Surplus Remaining
            </span>
            <div className="text-2xl font-black font-mono text-[#8fb39a] mt-1">
              {formatCurrency(remainingLimit)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-[#26262b]' : 'bg-[#e5e3dc]'}`}>
          <div
            className="h-full rounded-full bg-[#c9b27c] transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, (totalSpent / monthlyLimit) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs mt-2 font-medium">
          <span className="text-[#c9b27c]">
            {((totalSpent / monthlyLimit) * 100).toFixed(1)}% of total cap utilized
          </span>
          <span className={isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}>
            8 days remaining in November
          </span>
        </div>
      </div>

      {/* Grid of Categories (Responsive 3 cols on desktop, 2 on tablet, 1 on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgetCategories.map((cat) => {
          const percent = Math.round((cat.spent / cat.limit) * 100);
          const remaining = Math.max(0, cat.limit - cat.spent);

          return (
            <div
              key={cat.id}
              className={`p-5 rounded-2xl border transition-colors shadow-sm flex flex-col justify-between ${
                isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className={`text-sm font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                      {cat.name}
                    </h3>
                    <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                      {cat.category} allocation
                    </p>
                  </div>

                  {cat.status === 'Limit reached' ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d97070]/20 text-[#d97070] font-bold border border-[#d97070]/30 flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      Limit reached
                    </span>
                  ) : cat.status === 'Near limit' ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d4a359]/20 text-[#d4a359] font-bold border border-[#d4a359]/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Near limit
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8fb39a]/15 text-[#8fb39a] font-bold border border-[#8fb39a]/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Healthy
                    </span>
                  )}
                </div>

                {/* Amounts Readout */}
                <div className="flex items-baseline justify-between mb-2">
                  <span
                    className={`text-xl font-black font-mono ${
                      percent > 100 ? 'text-[#d97070]' : isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'
                    }`}
                  >
                    {formatCurrency(cat.spent)}
                  </span>
                  <span className={`text-xs font-mono ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    of {formatCurrency(cat.limit)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#26262b]' : 'bg-[#e5e3dc]'}`}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, percent)}%`,
                      backgroundColor: cat.statusColor || '#c9b27c',
                    }}
                  />
                </div>

                <div className="flex justify-between text-xs mt-2">
                  <span className={`font-semibold ${percent > 100 ? 'text-[#d97070]' : 'text-[#8a8a93]'}`}>
                    {percent}% used
                  </span>
                  <span className={percent > 100 ? 'text-[#d97070] font-medium' : 'text-[#8fb39a] font-medium'}>
                    {percent > 100 ? `${formatCurrency(cat.spent - cat.limit)} over` : `${formatCurrency(remaining)} left`}
                  </span>
                </div>
              </div>

              {/* Inline editor when in Edit Mode */}
              {isEditing && (
                <div className="mt-4 pt-3 border-t border-[#26262b]/60 flex items-center justify-between gap-3">
                  <label className="text-xs text-[#8a8a93] font-medium">Adjust limit:</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[#c9b27c]">₹</span>
                    <input
                      type="number"
                      value={cat.limit}
                      onChange={(e) => updateCategoryLimit(cat.id, e.target.value)}
                      className={`w-28 px-2.5 py-1 rounded-lg text-xs font-mono font-bold border outline-none focus:border-[#c9b27c] ${
                        isDark
                          ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                          : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

