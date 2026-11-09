import { ArrowRight, Plus, Calendar, ShieldAlert, UserCheck } from 'lucide-react';
import MonthlyLimitWidget from '../components/widgets/MonthlyLimitWidget';
import DonutSpendWidget from '../components/widgets/DonutSpendWidget';
import StatCardsWidget from '../components/widgets/StatCardsWidget';
import ProjectedSpendWidget from '../components/widgets/ProjectedSpendWidget';
import CategoryBadge from '../components/common/CategoryBadge';
import BackendSyncBadge from '../components/common/BackendSyncBadge';
import { Skeleton } from '../components/common/Skeleton';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../data/financeData';

export default function DashboardPage() {
  const {
    currentUser,
    transactions,
    budgetCategories,
    totalSpent,
    monthlyLimit,
    daysPassed,
    monthName,
    currentYear,
    setCurrentScreen,
    isLoading,
    pendingAdminRequests,
    pendingAdminRequestsCount,
    setIsReviewResetModalOpen,
    setSelectedResetRequest,
  } = useFinance();
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
                {monthName} {currentYear}
              </span>
              <span className="w-1 h-1 rounded-full bg-[#8a8a93]" />
              <BackendSyncBadge />
            </div>
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              Welcome back{currentUser?.name || currentUser?.username ? `, ${currentUser?.name || currentUser?.username}` : ''}
            </h2>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Financial ledger is active • Real-time overview of monthly limits and spending.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentScreen('add-expense')}
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

      {/* Admin Password Reset Approval Notification Banner */}
      {currentUser?.role === 'Admin' && pendingAdminRequestsCount > 0 && (
        <div
          className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all animate-in fade-in duration-300 shadow-sm ${
            isDark
              ? 'bg-[#d4a359]/10 border-[#d4a359]/30 text-[#e8e8ea]'
              : 'bg-[#fdfaf2] border-[#d4a359]/40 text-[#18181b]'
          }`}
        >
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#d4a359]/20 text-[#d4a359] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold tracking-tight text-[#d4a359]">
                  Password Reset Request Awaiting Your Approval
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#d4a359] text-neutral-950 font-black text-[10px] uppercase tracking-wider">
                  {pendingAdminRequestsCount} Pending
                </span>
              </div>
              <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                Administrator{' '}
                <span className="font-bold text-[#c9b27c] font-mono">
                  {pendingAdminRequests[0]?.requestingAdminUsername}
                </span>{' '}
                ({pendingAdminRequests[0]?.requestingAdminEmail}) requested permission to reset their account password.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedResetRequest(pendingAdminRequests[0]);
              setIsReviewResetModalOpen(true);
            }}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-xs shadow-md shadow-[#c9b27c]/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <UserCheck className="w-4 h-4" />
            <span>Review & Respond</span>
          </button>
        </div>
      )}

      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 min-w-0 max-w-full">
        {/* Metric 1 */}
        <div
          className={`p-3 sm:p-4 rounded-2xl border transition-colors shadow-sm min-w-0 max-w-full overflow-hidden flex flex-col justify-between ${
            isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
          }`}
        >
          <span className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate block ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Total Spent
          </span>
          <div
            className={`text-base sm:text-xl lg:text-2xl font-black font-mono tracking-tight mt-1 truncate block max-w-full ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}
            title={formatCurrency(totalSpent)}
          >
            {isLoading ? <Skeleton className="h-6 sm:h-7 w-20 sm:w-28 my-1" /> : formatCurrency(totalSpent)}
          </div>
          <span className="text-[10px] sm:text-[11px] font-medium text-[#c9b27c] mt-1 truncate block">
            {isLoading ? (
              <Skeleton className="h-3 w-16 sm:w-20" />
            ) : (
              `${monthlyLimit > 0 ? ((totalSpent / monthlyLimit) * 100).toFixed(1) : '0.0'}% of limit`
            )}
          </span>
        </div>

        {/* Metric 2 */}
        <div
          className={`p-3 sm:p-4 rounded-2xl border transition-colors shadow-sm min-w-0 max-w-full overflow-hidden flex flex-col justify-between ${
            isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
          }`}
        >
          <span className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate block ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Remaining Budget
          </span>
          <div
            className="text-base sm:text-xl lg:text-2xl font-black font-mono tracking-tight mt-1 text-[#8fb39a] truncate block max-w-full"
            title={formatCurrency(Math.max(0, monthlyLimit - totalSpent))}
          >
            {isLoading ? <Skeleton className="h-6 sm:h-7 w-20 sm:w-28 my-1" /> : formatCurrency(Math.max(0, monthlyLimit - totalSpent))}
          </div>
          <span
            className={`text-[10px] sm:text-[11px] font-medium mt-1 truncate block ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}
            title={`Limit: ${formatCurrency(monthlyLimit)}`}
          >
            {isLoading ? <Skeleton className="h-3 w-16 sm:w-24" /> : `Limit: ${formatCurrency(monthlyLimit)}`}
          </span>
        </div>

        {/* Metric 3 */}
        <div
          className={`p-3 sm:p-4 rounded-2xl border transition-colors shadow-sm min-w-0 max-w-full overflow-hidden flex flex-col justify-between ${
            isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
          }`}
        >
          <span className={`text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider truncate block ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Daily Average
          </span>
          <div
            className={`text-base sm:text-xl lg:text-2xl font-black font-mono tracking-tight mt-1 truncate block max-w-full ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}
            title={formatCurrency(daysPassed > 0 ? Math.round(totalSpent / daysPassed) : totalSpent)}
          >
            {isLoading ? <Skeleton className="h-6 sm:h-7 w-20 sm:w-28 my-1" /> : formatCurrency(daysPassed > 0 ? Math.round(totalSpent / daysPassed) : totalSpent)}
          </div>
          <span className="text-[10px] sm:text-[11px] font-semibold text-[#8fb39a] mt-1 truncate block">
            Normalized pace
          </span>
        </div>
      </div>

      {/* Main Grid: Widgets & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0 max-w-full">
        {/* Left Column (7 cols on desktop): Budget Cards & Donut Chart */}
        <div className="lg:col-span-7 space-y-6 min-w-0 max-w-full">
          <MonthlyLimitWidget />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 max-w-full">
            <ProjectedSpendWidget />
            <StatCardsWidget />
          </div>

          <DonutSpendWidget />
        </div>

        {/* Right Column (5 cols on desktop): Recent Shared Ledger Feed */}
        <div className="lg:col-span-5 space-y-6 min-w-0 max-w-full">
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
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                      <div className="space-y-1.5">
                        <Skeleton className="w-32 h-3.5 rounded" />
                        <Skeleton className="w-20 h-2.5 rounded" />
                      </div>
                    </div>
                    <Skeleton className="w-16 h-4 rounded shrink-0" />
                  </div>
                ))
              ) : recentTransactions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8a8a93]">
                  No expenses recorded yet. Click below to add your first expense!
                </div>
              ) : (
                recentTransactions.map((tx) => (
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

                    <div className="text-right shrink-0 min-w-0 max-w-[45%]">
                      <div className={`text-xs font-bold font-mono truncate ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`} title={formatCurrency(tx.amount)}>
                        {formatCurrency(tx.amount)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setCurrentScreen('add-expense')}
              className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-[#26262b] hover:border-[#c9b27c] text-xs font-semibold text-[#8a8a93] hover:text-[#c9b27c] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log another transaction</span>
            </button>
          </div>

          {/* Quick Category Widget */}
          <div
            className={`p-5 rounded-2xl border transition-colors shadow-sm ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                Category
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
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between">
                      <Skeleton className="w-28 h-3.5 rounded" />
                      <Skeleton className="w-12 h-3.5 rounded" />
                    </div>
                    <Skeleton className="w-full h-1.5 rounded-full" />
                  </div>
                ))
              ) : budgetCategories.length === 0 ? (
                <div className="py-4 text-center text-xs text-[#8a8a93]">
                  No categories configured yet.
                </div>
              ) : (
                budgetCategories.map((cat) => {
                  const spent = Number(cat.spent || 0);
                  const limit = Number(cat.limit || 0);
                  const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                  const isExceeded = percent > 100 || cat.status === 'Exceeded' || cat.status === 'Limit reached';
                  const isWarning = !isExceeded && (percent >= 80 || cat.status === 'Warning' || cat.status === 'Near limit');

                  return (
                    <div key={cat.id || cat.name}>
                      <div className="flex justify-between text-xs font-medium mb-1 items-baseline min-w-0">
                        <span className={`truncate mr-2 ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                          {cat.name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0 font-mono">
                          <span
                            className={`font-bold ${
                              isExceeded
                                ? 'text-[#d97070]'
                                : isWarning
                                ? 'text-[#d4a359]'
                                : 'text-[#8fb39a]'
                            }`}
                          >
                            {percent}%{isExceeded ? ' (Exceeded)' : ''}
                          </span>
                          <span className={`text-[10px] ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                            ({formatCurrency(spent)} / {formatCurrency(limit)})
                          </span>
                        </div>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-[#26262b]' : 'bg-[#e5e3dc]'}`}>
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isExceeded
                              ? 'bg-[#d97070]'
                              : isWarning
                              ? 'bg-[#d4a359]'
                              : ''
                          }`}
                          style={{
                            width: `${Math.min(100, percent)}%`,
                            backgroundColor: !isExceeded && !isWarning ? (cat.color || '#8fb39a') : undefined,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
