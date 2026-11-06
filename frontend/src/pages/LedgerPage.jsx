import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search, Filter } from 'lucide-react';
import CategoryBadge from '../components/common/CategoryBadge';
import { Skeleton } from '../components/common/Skeleton';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../data/financeData';

export default function LedgerPage() {
  const { transactions, totalSpent, setIsAddExpenseModalOpen, availableCategories, isLoading } = useFinance();
  const { isDark } = useTheme();

  const [selectedMonth, setSelectedMonth] = useState('Nov 2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || tx.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 w-full">
      {/* Ledger Header & Month Selector */}
      <div
        className={`p-6 rounded-2xl border transition-colors shadow-sm ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              Ledger
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Month Switcher */}
            <div
              className={`flex items-center gap-2 border px-3 py-1.5 rounded-xl shadow-sm ${
                isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedMonth('Oct 2026')}
                className={`p-1 rounded-lg cursor-pointer ${
                  isDark ? 'text-[#8a8a93] hover:text-[#e8e8ea]' : 'text-[#71717a] hover:text-[#18181b]'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className={`text-xs font-bold px-2 ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                {selectedMonth}
              </span>
              <button
                type="button"
                onClick={() => setSelectedMonth('Nov 2026')}
                className={`p-1 rounded-lg cursor-pointer ${
                  isDark ? 'text-[#8a8a93] hover:text-[#e8e8ea]' : 'text-[#71717a] hover:text-[#18181b]'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Total Month Metric Pill */}
            <div
              className={`px-4 py-2 rounded-xl border flex items-center gap-2 ${
                isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
              }`}
            >
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#8a8a93]">
                Total:
              </span>
              <span className="text-sm font-extrabold font-mono text-[#c9b27c]">
                {isLoading ? <Skeleton className="w-16 h-4" /> : formatCurrency(totalSpent)}
              </span>
            </div>

            {/* Log Expense Button */}
            <button
              type="button"
              onClick={() => setIsAddExpenseModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-tr from-[#c9b27c] to-[#a68d55] text-neutral-950 font-bold text-xs shadow-md shadow-[#c9b27c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Log Expense</span>
            </button>
          </div>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="mt-6 pt-4 border-t border-[#26262b]/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description, member, or category..."
              className={`w-full h-10 pl-9 pr-4 rounded-xl border text-xs outline-none focus:border-[#c9b27c] transition-colors ${
                isDark
                  ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                  : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
              }`}
            />
            <Search className="w-4 h-4 text-[#8a8a93] absolute left-3 top-3" />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-[#8a8a93] flex items-center gap-1 pr-1 hidden sm:flex">
              <Filter className="w-3 h-3" />
            </span>
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'All'
                  ? 'bg-[#c9b27c] text-neutral-950 border-[#c9b27c]'
                  : isDark
                  ? 'bg-[#0e0e10] border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea]'
                  : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#71717a] hover:text-[#18181b]'
              }`}
            >
              All ({transactions.length})
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === cat.name
                    ? 'bg-[#c9b27c]/20 border-[#c9b27c] text-[#c9b27c]'
                    : isDark
                    ? 'bg-[#0e0e10] border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea]'
                    : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#71717a] hover:text-[#18181b]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Ledger Table (Desktop & Tablet) */}
      <div
        className={`rounded-2xl border overflow-hidden shadow-sm transition-colors ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr
                className={`border-b text-[11px] uppercase tracking-wider font-semibold ${
                  isDark
                    ? 'border-[#26262b] bg-[#121214] text-[#8a8a93]'
                    : 'border-[#e5e3dc] bg-[#fbfaf8] text-[#71717a]'
                }`}
              >
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                isDark ? 'divide-[#26262b]/60' : 'divide-[#e5e3dc]/80'
              }`}
            >
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="py-3">
                    <td className="py-3.5 px-4"><Skeleton className="w-20 h-4" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="w-16 h-5 rounded-full" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="w-48 h-4" /></td>
                    <td className="py-3.5 px-4 text-right"><Skeleton className="w-20 h-4 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-xs text-[#8a8a93]">
                    No transactions match your search filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className={`transition-colors ${
                      isDark ? 'hover:bg-neutral-800/30' : 'hover:bg-neutral-100/60'
                    }`}
                  >
                    <td className={`py-3 px-4 whitespace-nowrap font-medium ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                      {tx.fullDate || tx.date}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <CategoryBadge category={tx.category} customColor={tx.categoryColor} />
                    </td>
                    <td className={`py-3 px-4 font-medium ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                      {tx.description}
                    </td>
                    <td className={`py-3 px-4 text-right font-bold font-mono text-sm whitespace-nowrap ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Sticky Table Footer with Summary */}
        <div
          className={`px-6 py-4 border-t flex items-center justify-between flex-wrap gap-4 ${
            isDark ? 'bg-[#131316] border-[#26262b]' : 'bg-[#fbfaf8] border-[#e5e3dc]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Filtered Entries: {isLoading ? '...' : filteredTransactions.length}
            </span>
            <span className="text-xs text-[#8a8a93]">•</span>
            <span className="text-xs text-[#8fb39a] font-medium">All reconciled</span>
          </div>

          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Total Expenditure
            </span>
            <span className="text-xl font-extrabold font-mono text-[#c9b27c]">
              {isLoading ? <Skeleton className="w-24 h-6" /> : formatCurrency(totalSpent)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

