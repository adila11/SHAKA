import { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Receipt
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../data/financeData';
import CategoryBadge from '../components/common/CategoryBadge';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const getTodayDate = () => new Date();
const getYesterdayDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
};

const formatDateStrings = (dateObj) => {
  const d = new Date(dateObj);
  const month = SHORT_MONTHS[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return {
    shortDate: `${month} ${day}`,
    fullDate: `${month} ${day}, ${year}`,
  };
};

export default function LogExpensePage() {
  const {
    transactions,
    addExpense,
    availableCategories,
    currentUser,
    setCurrentScreen,
  } = useFinance();
  const { isDark } = useTheme();

  // Form states
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(
    availableCategories[0]?.name || 'Food'
  );
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Date selection states: 'today' | 'yesterday' | 'calendar'
  const [dateOption, setDateOption] = useState('today');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  // Interactive Calendar Pop-up modal states
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewYear, setCalendarViewYear] = useState(new Date().getFullYear());
  const [calendarViewMonth, setCalendarViewMonth] = useState(new Date().getMonth());

  // Today's formatted string helper for filtering top section
  const todayInfo = useMemo(() => {
    return formatDateStrings(getTodayDate());
  }, []);

  // Filter transactions added today (dynamically reactive when new expense added)
  const todayTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      if (t.time === 'Just now') return true;
      if (t.date === todayInfo.shortDate || t.fullDate === todayInfo.fullDate) return true;
      if (t.date === 'Nov 22' && now.getDate() === 22) return true;
      if (t.createdAt) {
        const cd = new Date(t.createdAt);
        if (cd.toDateString() === now.toDateString()) return true;
      }
      return false;
    });
  }, [transactions, todayInfo]);

  const todayTotalSpent = useMemo(() => {
    return todayTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [todayTransactions]);

  // Calendar Days computation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(calendarViewYear, calendarViewMonth, 1).getDay();
    const daysInMonth = new Date(calendarViewYear, calendarViewMonth + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(calendarViewYear, calendarViewMonth, d));
    }
    return days;
  }, [calendarViewYear, calendarViewMonth]);

  // Calendar month navigation
  const handlePrevMonth = () => {
    if (calendarViewMonth === 0) {
      setCalendarViewMonth(11);
      setCalendarViewYear(y => y - 1);
    } else {
      setCalendarViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    const today = new Date();
    // Cannot navigate into future months
    if (calendarViewYear === today.getFullYear() && calendarViewMonth >= today.getMonth()) {
      return;
    }
    if (calendarViewMonth === 11) {
      setCalendarViewMonth(0);
      setCalendarViewYear(y => y + 1);
    } else {
      setCalendarViewMonth(m => m + 1);
    }
  };

  const isFutureDate = (dateObj) => {
    if (!dateObj) return false;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return dateObj.getTime() > today.getTime();
  };

  const isSelectedDate = (dateObj) => {
    if (!dateObj || !selectedDate) return false;
    return dateObj.toDateString() === selectedDate.toDateString();
  };

  const isTodayDate = (dateObj) => {
    if (!dateObj) return false;
    return dateObj.toDateString() === new Date().toDateString();
  };

  const handleSelectCalendarDay = (dateObj) => {
    if (isFutureDate(dateObj)) return; // Disallow selecting future dates
    setSelectedDate(dateObj);
    setDateOption('calendar');
    setIsCalendarOpen(false);
  };

  const handleSelectToday = () => {
    setDateOption('today');
    setSelectedDate(getTodayDate());
  };

  const handleSelectYesterday = () => {
    setDateOption('yesterday');
    setSelectedDate(getYesterdayDate());
  };

  const handleOpenCalendar = () => {
    const current = selectedDate || new Date();
    setCalendarViewYear(current.getFullYear());
    setCalendarViewMonth(current.getMonth());
    setIsCalendarOpen(true);
  };

  // Submit expense handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const numAmount = Number(amount);
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setFeedback({ type: 'error', message: 'Please enter a valid expense amount greater than 0.' });
      return;
    }

    const { shortDate, fullDate } = formatDateStrings(selectedDate);
    setIsSubmitting(true);

    try {
      const res = await addExpense({
        amount: numAmount,
        category: selectedCategory,
        description: description.trim() || `${selectedCategory} expense`,
        date: shortDate,
        fullDate,
        time: dateOption === 'today' ? 'Just now' : '12:00 PM',
        user: currentUser?.username || 'abdulshamil',
      });

      if (res?.success) {
        setFeedback({
          type: 'success',
          message: `₹${numAmount.toLocaleString('en-IN')} added to ${selectedCategory}! See updated list above.`
        });
        setAmount('');
        setDescription('');
        // Smooth scroll to top to see newly added expense
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setFeedback({
          type: 'error',
          message: res?.message || 'Failed to add expense. Please try again.'
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Connection error while saving expense.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedFormatted = useMemo(() => {
    return formatDateStrings(selectedDate);
  }, [selectedDate]);

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      {/* Page Title & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-[#c9b27c] font-semibold">
              Expense Entry Hub
            </span>
          </div>
          <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            Log Shared Expense
          </h2>
          <p className={`text-xs sm:text-sm mt-0.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Record shared household purchases. New entries instantly appear in today&apos;s summary above.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCurrentScreen('ledger')}
          className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto ${
            isDark
              ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea] hover:bg-[#202024]'
              : 'bg-white border-[#e5e3dc] text-[#18181b] hover:bg-[#f6f5f2]'
          }`}
        >
          <span>View Full Ledger</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* TOP SECTION: Expenses Added Today (Real-time live list) */}
      {/* ======================================================== */}
      <div
        className={`p-6 rounded-2xl border transition-colors shadow-sm ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#26262b]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#c9b27c]/15 text-[#c9b27c] flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                Expenses Added Today
              </h3>
              <p className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                {todayInfo.fullDate} • Instant Ledger Synchronization
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1.5 rounded-xl border text-right ${
                isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
              }`}
            >
              <span className={`block text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                Today&apos;s Total
              </span>
              <span className="text-sm sm:text-base font-extrabold font-mono text-[#c9b27c]">
                {formatCurrency(todayTotalSpent)}
              </span>
            </div>
            <div
              className={`px-3 py-1.5 rounded-xl border text-center ${
                isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
              }`}
            >
              <span className={`block text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                Entries
              </span>
              <span className={`text-sm sm:text-base font-extrabold font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                {todayTransactions.length}
              </span>
            </div>
          </div>
        </div>

        {/* Live List of Today's Transactions */}
        <div className="mt-4 divide-y divide-[#26262b]/40 max-h-60 overflow-y-auto pr-1">
          {todayTransactions.length === 0 ? (
            <div className="py-8 text-center space-y-1">
              <p className={`text-xs font-semibold ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                No expenses recorded for today yet.
              </p>
              <p className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                Fill out the form below to add your first transaction today!
              </p>
            </div>
          ) : (
            todayTransactions.map(tx => (
              <div
                key={tx.id}
                className="py-3 flex items-center justify-between gap-3 group transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#202024] border border-[#26262b] flex items-center justify-center shrink-0">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tx.categoryColor || '#c9b27c' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                      {tx.description}
                    </p>
                    <p className="text-[11px] text-[#8a8a93] flex items-center gap-2 mt-0.5">
                      <CategoryBadge category={tx.category} customColor={tx.categoryColor} />
                      <span>•</span>
                      <span>{tx.time || 'Just now'}</span>
                      <span>•</span>
                      <span className="font-mono text-[#c9b27c]">{tx.user}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-xs sm:text-sm font-bold font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                    {formatCurrency(tx.amount)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* BOTTOM SECTION: Log Expense Form */}
      {/* ======================================================== */}
      <form
        onSubmit={handleSubmit}
        className={`p-6 sm:p-8 rounded-2xl border transition-colors shadow-sm space-y-6 ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            New Expense Details
          </h3>
          <span className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            All fields verified before ledger write
          </span>
        </div>

        {/* Amount Input */}
        <div
          className={`p-5 rounded-2xl border text-center transition-colors ${
            isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
          }`}
        >
          <span className={`block text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Expense Amount
          </span>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="text-3xl sm:text-4xl font-black text-[#c9b27c]">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              required
              min="1"
              step="any"
              className={`text-4xl sm:text-5xl font-black bg-transparent w-64 text-center outline-none font-mono ${
                isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'
              }`}
              autoFocus
            />
          </div>
        </div>

        {/* Date Selector: Today | Yesterday | Calendar Popup */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={`block text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Date of Expense
            </label>
            <span className="text-xs font-mono text-[#c9b27c] font-semibold">
              Selected: {selectedFormatted.fullDate}
            </span>
          </div>

          <div
            className={`p-1 rounded-xl border flex items-center gap-1.5 ${
              isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
            }`}
          >
            <button
              type="button"
              onClick={handleSelectToday}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                dateOption === 'today'
                  ? isDark
                    ? 'bg-[#202024] text-[#c9b27c] shadow-sm'
                    : 'bg-white text-[#c9b27c] shadow-sm'
                  : isDark
                  ? 'text-[#8a8a93] hover:text-[#e8e8ea]'
                  : 'text-[#71717a] hover:text-[#18181b]'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={handleSelectYesterday}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                dateOption === 'yesterday'
                  ? isDark
                    ? 'bg-[#202024] text-[#c9b27c] shadow-sm'
                    : 'bg-white text-[#c9b27c] shadow-sm'
                  : isDark
                  ? 'text-[#8a8a93] hover:text-[#e8e8ea]'
                  : 'text-[#71717a] hover:text-[#18181b]'
              }`}
            >
              Yesterday
            </button>

            <button
              type="button"
              onClick={handleOpenCalendar}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                dateOption === 'calendar'
                  ? isDark
                    ? 'bg-[#202024] text-[#c9b27c] shadow-sm'
                    : 'bg-white text-[#c9b27c] shadow-sm'
                  : isDark
                  ? 'text-[#8a8a93] hover:text-[#e8e8ea]'
                  : 'text-[#71717a] hover:text-[#18181b]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Calendar</span>
            </button>
          </div>
        </div>

        {/* Category Chip Selector */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-2.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {availableCategories.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#c9b27c]/20 border-[#c9b27c] text-[#c9b27c] shadow-sm'
                      : isDark
                      ? 'bg-[#0e0e10] border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea] hover:border-[#383840]'
                      : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#71717a] hover:text-[#18181b]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Description / Notes */}
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Description / Notes
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Groceries at Trader Joe's, Dinner split, Metro recharge"
            className={`w-full h-11 px-3.5 rounded-xl border text-xs outline-none focus:border-[#c9b27c] transition-colors ${
              isDark ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]' : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
            }`}
          />
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-[#8fb39a]/15 text-[#8fb39a] border border-[#8fb39a]/30'
                : 'bg-[#d97070]/15 text-[#d97070] border border-[#d97070]/30'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Confirm & Add Button */}
        <button
          type="submit"
          disabled={isSubmitting || !amount || Number(amount) <= 0}
          className="w-full h-12 rounded-xl bg-gradient-to-tr from-[#c9b27c] to-[#a68d55] text-neutral-950 font-bold text-sm shadow-md shadow-[#c9b27c]/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Logging to Ledger...</span>
            </>
          ) : (
            <>
              <span>Confirm & Add to Ledger</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* ======================================================== */}
      {/* CALENDAR POPUP MODAL (Disables Future Dates beyond today)*/}
      {/* ======================================================== */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div
            className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl transition-colors ${
              isDark ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]' : 'bg-white border-[#e5e3dc] text-[#18181b]'
            }`}
          >
            {/* Header: Month/Year and navigation */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#26262b]/50">
              <div>
                <h4 className="text-sm font-bold tracking-tight">
                  {MONTH_NAMES[calendarViewMonth]} {calendarViewYear}
                </h4>
                <p className={`text-[10px] ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                  Select a date up to today
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isDark ? 'border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea]' : 'border-[#e5e3dc] text-[#71717a] hover:text-[#18181b]'
                  }`}
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={calendarViewYear === new Date().getFullYear() && calendarViewMonth >= new Date().getMonth()}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isDark ? 'border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea]' : 'border-[#e5e3dc] text-[#71717a] hover:text-[#18181b]'
                  }`}
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(false)}
                  className={`p-1.5 ml-1 rounded-lg text-[#8a8a93] hover:text-white cursor-pointer`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {DAYS_OF_WEEK.map(d => (
                <span
                  key={d}
                  className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((dayDate, idx) => {
                if (!dayDate) {
                  return <div key={`empty-${idx}`} className="h-9 w-9" />;
                }

                const isFuture = isFutureDate(dayDate);
                const isSelected = isSelectedDate(dayDate);
                const isToday = isTodayDate(dayDate);

                return (
                  <button
                    key={dayDate.toISOString()}
                    type="button"
                    disabled={isFuture}
                    onClick={() => handleSelectCalendarDay(dayDate)}
                    className={`h-9 w-9 mx-auto rounded-xl text-xs font-mono font-semibold transition-all flex items-center justify-center cursor-pointer ${
                      isSelected
                        ? 'bg-[#c9b27c] text-neutral-950 font-bold shadow-md shadow-[#c9b27c]/25 scale-105'
                        : isFuture
                        ? 'opacity-20 cursor-not-allowed line-through'
                        : isDark
                        ? 'text-[#e8e8ea] hover:bg-[#202024] hover:text-[#c9b27c]'
                        : 'text-[#18181b] hover:bg-[#f6f5f2] hover:text-[#c9b27c]'
                    } ${isToday && !isSelected ? 'border border-[#c9b27c]/60 font-bold' : ''}`}
                    title={isFuture ? 'Future dates are disabled' : dayDate.toLocaleDateString()}
                  >
                    {dayDate.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Footer with Today shortcut & Cancel */}
            <div className="mt-4 pt-3 border-t border-[#26262b]/50 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  handleSelectToday();
                  setIsCalendarOpen(false);
                }}
                className="text-xs text-[#c9b27c] font-semibold hover:underline cursor-pointer"
              >
                Jump to Today
              </button>
              <button
                type="button"
                onClick={() => setIsCalendarOpen(false)}
                className="px-3 py-1.5 rounded-lg border border-[#26262b] text-xs font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
