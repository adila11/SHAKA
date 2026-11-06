import { ArrowRight, Plus, Calendar, CheckCircle2, ShieldCheck } from 'lucide-react';
import MonthlyLimitWidget from '../components/widgets/MonthlyLimitWidget';
import DonutSpendWidget from '../components/widgets/DonutSpendWidget';
import StatCardsWidget from '../components/widgets/StatCardsWidget';
import ProjectedSpendWidget from '../components/widgets/ProjectedSpendWidget';
import CategoryBadge from '../components/common/CategoryBadge';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../data/financeData';

export default function DashboardPage() {
  const { currentUser, transactions, totalSpent, monthlyLimit, setCurrentScreen, setIsAddExpenseModalOpen } = useFinance();
  const { isDark } = useTheme();

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6 w-full">
      {/* Hero Greeting Row */}
      <div
        className={`p-6 rounded-2xl border transition-colors shadow-sm ${
          isDark
            ? 'bg-gradient-to-r from-[#17171a] via-[#1a1a1e] to-[#17171a] border-[#26262b]'
            : 'bg-gradient-to-r from-white via-[#faf9f6] to-white border-[#e5e3dc]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                <Calendar className="w-3.5 h-3.5 text-[#c9b27c]" />
                November 2026
              </span>
              <span className="w-1 h-1 rounded-full bg-[#8a8a93]" />
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#8fb39a]/15 text-[#8fb39a] font-semibold border border-[#8fb39a]/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                On Track
              </span>
            </div>
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              Welcome back, {currentUser.name.split(' ')[0]}
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Financial ledger is active • Real-time overview of monthly limits and spending.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-tr from-[#c9b27c] to-[#a68d55] text-neutral-950 font-bold text-xs shadow-md shadow-[#c9b27c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Log Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentScreen('ledger')}
              className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea] hover:bg-[#202024]'
                  : 'bg-white border-[#e5e3dc] text-[#18181b] hover:bg-[#f6f5f2]'
              }`}
            >
              <span>View Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          className={`p-4 rounded-2xl border transition-colors shadow-sm ${
            isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
          }`}
        >
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Total Spent
          </span>
          <div className={`text-2xl font-black font-mono tracking-tight mt-1 ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            {formatCurrency(totalSpent)}
          </div>
          <span className="text-[11px] font-medium text-[#c9b27c] mt-1 inline-block">
            {monthlyLimit > 0 ? ((totalSpent / monthlyLimit) * 100).toFixed(1) : '0.0'}% of limit
          </span>
        </div>

        {/* Metric 2 */}
        <div
          className={`p-4 rounded-2xl border transition-colors shadow-sm ${
            isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
          }`}
        >
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Remaining Budget
          </span>
          <div className="text-2xl font-black font-mono tracking-tight mt-1 text-[#8fb39a]">
            {formatCurrency(Math.max(0, monthlyLimit - totalSpent))}
          </div>
          <span className={`text-[11px] font-medium mt-1 inline-block ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Limit: {formatCurrency(monthlyLimit)}
          </span>
        </div>

        {/* Metric 3 */}
        <div
          className={`p-4 rounded-2xl border transition-colors shadow-sm ${
            isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
          }`}
        >
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Daily Average
          </span>
          <div className={`text-2xl font-black font-mono tracking-tight mt-1 ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            {formatCurrency(Math.round(totalSpent / 22))}
          </div>
          <span className="text-[11px] font-semibold text-[#8fb39a] mt-1 inline-block">
            Normalized pace
          </span>
        </div>

        {/* Metric 4 */}
        <div
          className={`p-4 rounded-2xl border transition-colors shadow-sm ${
            isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
          }`}
        >
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Shared Members
          </span>
          <div className={`text-2xl font-black font-mono tracking-tight mt-1 ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            3 Active
          </div>
          <span className="text-[11px] font-semibold text-[#c9b27c] mt-1 inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Admin verified
          </span>
        </div>
      </div>

      {/* Main Grid: Widgets & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols on desktop): Budget Cards & Donut Chart */}
        <div className="lg:col-span-7 space-y-6">
          <MonthlyLimitWidget />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProjectedSpendWidget />
            <StatCardsWidget />
          </div>

          <DonutSpendWidget />
        </div>

        {/* Right Column (5 cols on desktop): Recent Shared Ledger Feed */}
        <div className="lg:col-span-5 space-y-6">
          <div
            className={`p-5 rounded-2xl border transition-colors shadow-sm ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#26262b]/60">
              <div>
                <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                  Recent Activity
                </h3>
                <p className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                  Latest shared team logs
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentScreen('ledger')}
                className="text-xs font-semibold text-[#c9b27c] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-[#26262b]/50">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#202024] border border-[#26262b] flex items-center justify-center shrink-0">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tx.categoryColor }} />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-[#8a8a93] flex items-center gap-2 mt-0.5">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <CategoryBadge category={tx.category} customColor={tx.categoryColor} />
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`text-xs font-bold font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                      {formatCurrency(tx.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-[#26262b] hover:border-[#c9b27c] text-xs font-semibold text-[#8a8a93] hover:text-[#c9b27c] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log another transaction</span>
            </button>
          </div>

          {/* Quick Category Health Widget */}
          <div
            className={`p-5 rounded-2xl border transition-colors shadow-sm ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                Category Health
              </span>
              <button
                type="button"
                onClick={() => setCurrentScreen('budget')}
                className="text-xs font-semibold text-[#c9b27c] hover:underline cursor-pointer"
              >
                Manage Limits →
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className={isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}>Food & Groceries</span>
                  <span className="text-[#d4a359] font-bold font-mono">85%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#26262b] overflow-hidden">
                  <div className="h-full rounded-full bg-[#d4a359]" style={{ width: '85%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className={isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}>Rent & Maintenance</span>
                  <span className="text-[#8fb39a] font-bold font-mono">52%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#26262b] overflow-hidden">
                  <div className="h-full rounded-full bg-[#8fb39a]" style={{ width: '52%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className={isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}>Bills & Utilities</span>
                  <span className="text-[#d97070] font-bold font-mono">104% (Exceeded)</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#26262b] overflow-hidden">
                  <div className="h-full rounded-full bg-[#d97070]" style={{ width: '100%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
