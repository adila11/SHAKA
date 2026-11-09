import { useState, useMemo, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Receipt,
  Plus
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../data/financeData';
import CategoryBadge from '../components/common/CategoryBadge';
import ExpenseAuthorizationModal from '../components/modals/ExpenseAuthorizationModal';

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
    setCurrentScreen,
  } = useFinance();
  const { isDark } = useTheme();

  // Collapsible Form State: true = collapsed (only heading & arrow), false = expanded
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);

  // Form input states (preserved when expanding/collapsing)
  // Only show existing categories; if none exist, show 'None'
  const displayedCategories = availableCategories && availableCategories.length > 0
    ? availableCategories
    : [{ name: 'None', color: '#8a8a93', icon: 'Tag' }];

  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const activeCategory = (selectedCategory && displayedCategories.some(c => c.name.toLowerCase() === selectedCategory.toLowerCase()))
    ? selectedCategory
    : displayedCategories[0].name;
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Custom JavaScript form validation errors
  const [errors, setErrors] = useState({});

  // Expense Authorization Modal state for amounts > ₹7,000
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingExpenseData, setPendingExpenseData] = useState(null);

  // Date selection states: 'today' | 'yesterday' | 'calendar'
  const [dateOption, setDateOption] = useState('today');
  const [selectedDate, setSelectedDate] = useState(getTodayDate());

  // Interactive Calendar Pop-up modal states
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarViewYear, setCalendarViewYear] = useState(new Date().getFullYear());
  const [calendarViewMonth, setCalendarViewMonth] = useState(new Date().getMonth());

  // Dynamic screen height tracking for responsive layout fitting
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute dynamic visible items count and list height so everything fits perfectly
  const { visibleCount, listHeightPx } = useMemo(() => {
    const ITEM_HEIGHT = 51; // exactly 51px per transaction row

    if (isFormCollapsed) {
      // When form is collapsed (~42px at bottom), list expands into available space
      const availableSpace = Math.max(255, viewportHeight - 290);
      const targetHeight = Math.min(availableSpace, 510);
      const count = Math.max(1, Math.floor(targetHeight / ITEM_HEIGHT));
      return {
        visibleCount: count,
        listHeightPx: count * ITEM_HEIGHT,
      };
    }

    // When form is expanded:
    // Screen height < 700px (small phones): exactly 2 items visible so form never shifts off-screen
    // Screen height 700px - 880px (standard screens): exactly 3 items visible
    // Screen height >= 880px (tall screens / desktop): 4 items visible
    let count = 3;
    if (viewportHeight < 700) {
      count = 2;
    } else if (viewportHeight >= 880) {
      count = 4;
    }

    return {
      visibleCount: count,
      listHeightPx: count * ITEM_HEIGHT,
    };
  }, [viewportHeight, isFormCollapsed]);

  // Ref for dedicated scrolling area
  const listScrollContainerRef = useRef(null);

  // Today's formatted date string prominently displayed at top (updates dynamically)
  const todayFormatted = useMemo(() => {
    const now = new Date();
    return {
      fullHeader: now.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      shortDate: formatDateStrings(now).shortDate,
      fullDate: formatDateStrings(now).fullDate,
    };
  }, []);

  // Sort expenses strictly from newest to oldest (Top-to-Bottom ordering)
  const sortedTransactions = useMemo(() => {
    const unique = [];
    const seen = new Set();
    for (const t of transactions) {
      if (t && t.id && !seen.has(t.id)) {
        seen.add(t.id);
        unique.push(t);
      }
    }

    return unique.sort((a, b) => {
      // 1. Newly created item with "Just now" always appears at the very top
      if (a.time === 'Just now' && b.time !== 'Just now') return -1;
      if (b.time === 'Just now' && a.time !== 'Just now') return 1;

      // 2. Sort by createdAt ISO timestamp descending
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA && timeB && timeA !== timeB) return timeB - timeA;

      // 3. Sort by fullDate / date descending
      const dateA = new Date(a.fullDate || a.date).getTime();
      const dateB = new Date(b.fullDate || b.date).getTime();
      if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) return dateB - dateA;

      return 0;
    });
  }, [transactions]);

  // Exclusively display today's transactions (newest first, no extra filter needed)
  const todayTransactions = useMemo(() => {
    const now = new Date();
    return sortedTransactions.filter(t => {
      if (t.time === 'Just now') return true;
      if (t.date === todayFormatted.shortDate || t.fullDate === todayFormatted.fullDate) return true;
      if (t.createdAt) {
        const cd = new Date(t.createdAt);
        if (cd.toDateString() === now.toDateString()) return true;
      }
      return false;
    });
  }, [sortedTransactions, todayFormatted]);

  // Aggregate today's metrics
  const todayTotalSpent = useMemo(() => {
    return todayTransactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [todayTransactions]);

  // Selected date formatted
  const selectedFormatted = useMemo(() => {
    return formatDateStrings(selectedDate);
  }, [selectedDate]);

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
    if (isFutureDate(dateObj)) return;
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

  // ----------------------------------------------------
  // Custom JavaScript Validation Methods (No HTML Native Validation)
  // ----------------------------------------------------
  const validateAmount = (val) => {
    if (val === '' || val === null || val === undefined) {
      return 'Amount is required.';
    }
    const num = Number(val);
    if (isNaN(num)) {
      return 'Amount must be a valid number.';
    }
    if (num <= 0) {
      return 'Amount must be a positive number greater than 0.';
    }
    const strVal = String(val);
    if (strVal.includes('.')) {
      const parts = strVal.split('.');
      if (parts[1] && parts[1].length > 2) {
        return 'Amount cannot exceed 2 decimal places.';
      }
    }
    return '';
  };

  const validateCategory = (val) => {
    if (!val || typeof val !== 'string' || !val.trim()) {
      return 'Category selection is mandatory.';
    }
    const exists = displayedCategories.some(
      c => c.name.toLowerCase() === val.trim().toLowerCase()
    );
    if (!exists) {
      return 'Selected category is not in the approved category list.';
    }
    return '';
  };

  const validateDescription = (val) => {
    if (typeof val === 'string' && val.length > 0 && !val.trim()) {
      return 'Description cannot consist solely of whitespace.';
    }
    if (val && val.trim().length > 150) {
      return 'Description cannot exceed 150 characters.';
    }
    return '';
  };

  const validateDate = (dateObj) => {
    if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
      return 'A valid expense date must be selected.';
    }
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (dateObj.getTime() > today.getTime()) {
      return 'Future dates are not permitted for logging expenses.';
    }
    return '';
  };

  // Perform backend expense addition with optional authorization token
  const executeAddExpense = async (payload, authorizationToken = null) => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const dataToSend = authorizationToken
        ? { ...payload, authorizationToken }
        : payload;

      const res = await addExpense(dataToSend);

      if (res?.success) {
        setFeedback({
          type: 'success',
          message: `₹${payload.amount.toLocaleString('en-IN')} added to ${payload.category}! See updated list above.`
        });
        setAmount('');
        setDescription('');
        setPendingExpenseData(null);
        setIsAuthModalOpen(false);

        // Smoothly scroll the expense list to the top so the newest expense is visible
        if (listScrollContainerRef.current) {
          listScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
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

  // Submit expense handler with comprehensive custom JS validation & ₹7,000 threshold check
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback(null);

    // Validate all form fields with custom JavaScript
    const amountErr = validateAmount(amount);
    const categoryErr = validateCategory(activeCategory);
    const descriptionErr = validateDescription(description);
    const dateErr = validateDate(selectedDate);

    const fieldErrors = {};
    if (amountErr) fieldErrors.amount = amountErr;
    if (categoryErr) fieldErrors.category = categoryErr;
    if (descriptionErr) fieldErrors.description = descriptionErr;
    if (dateErr) fieldErrors.date = dateErr;

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    const numAmount = Number(amount);
    const { shortDate, fullDate } = formatDateStrings(selectedDate);

    const expensePayload = {
      amount: numAmount,
      category: activeCategory,
      description: description.trim() || `${activeCategory} expense`,
      date: shortDate,
      fullDate,
      time: dateOption === 'today' ? 'Just now' : '12:00 PM',
    };

    // ₹7,000 threshold check: triggers security authorization modal if exceeded
    if (numAmount > 7000) {
      setPendingExpenseData(expensePayload);
      setIsAuthModalOpen(true);
      return;
    }

    // Normal expense (<= ₹7,000) proceeds directly
    await executeAddExpense(expensePayload);
  };

  // Called when authorization is verified with access code / password token
  const handleAuthorized = async (authToken) => {
    if (pendingExpenseData) {
      await executeAddExpense(pendingExpenseData, authToken);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col justify-between min-h-[calc(100vh-165px)] md:min-h-0 space-y-3.5 px-1 sm:px-2 pb-2">
      {/* ======================================================== */}
      {/* TOP BLOCK: Today's Date & Today's Expenses List          */}
      {/* ======================================================== */}
      <div className={`space-y-3 sm:space-y-4 flex flex-col transition-all duration-300 ${isFormCollapsed ? 'flex-1' : ''}`}>
        {/* Prominent Header with Today's Date */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#c9b27c] font-semibold">
                Expense Tracker
              </span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              Log Shared Expense
            </h2>
          </div>

          {/* Prominent Today's Date Display (Always visible, dynamic) */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <div
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 shadow-sm ${
                isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-[#c9b27c] shrink-0" />
              <div className="text-left">
                <span className={`block text-[9px] uppercase tracking-wider font-bold ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                  Today&apos;s Date
                </span>
                <span className="text-xs sm:text-sm font-bold font-mono text-[#c9b27c]">
                  {todayFormatted.fullHeader}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentScreen('ledger')}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                isDark
                  ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea] hover:bg-[#202024]'
                  : 'bg-white border-[#e5e3dc] text-[#18181b] hover:bg-[#f6f5f2]'
              }`}
            >
              <span>Ledger</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* TODAY'S EXPENSES LIST (Expands to fill available space when form is collapsed) */}
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-300 shadow-sm flex flex-col ${
            isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
          } ${isFormCollapsed ? 'flex-1 min-h-[360px]' : ''}`}
        >
          {/* List Header with Today's Metrics & Scroll indicator */}
          <div className="flex items-center justify-between pb-2 border-b border-[#26262b]/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#c9b27c]/15 text-[#c9b27c] flex items-center justify-center font-bold shrink-0">
                <Receipt className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className={`text-xs sm:text-sm font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                  Today&apos;s Expenses
                </h3>
              </div>
              {todayTransactions.length > 0 && (
                <span className="text-[10px] text-[#c9b27c] font-mono font-semibold ml-1">
                  {todayTransactions.length > visibleCount ? (
                    `(Showing ${visibleCount} • Scroll for ${todayTransactions.length - visibleCount} more ↓)`
                  ) : (
                    `(${todayTransactions.length === 1 ? '1 entry' : `All ${todayTransactions.length} entries`} visible)`
                  )}
                </span>
              )}
            </div>

            {/* Today's Metrics: Count & Total */}
            <div className="flex items-center gap-2 shrink-0 min-w-0">
              <div
                className={`px-2.5 py-0.5 rounded-lg border text-center shrink-0 ${
                  isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                }`}
              >
                <span className={`text-xs font-extrabold font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                  {todayTransactions.length} {todayTransactions.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              <div
                className={`px-2.5 py-0.5 rounded-lg border text-right max-w-[140px] sm:max-w-[200px] min-w-0 ${
                  isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                }`}
              >
                <span className="text-xs font-extrabold font-mono text-[#c9b27c] truncate block break-all">
                  {formatCurrency(todayTotalSpent)}
                </span>
              </div>
            </div>
          </div>

          {/* Dedicated Scrolling Area (Dynamic pixel height tailored to screen size & state for a perfect fit) */}
          <div
            ref={listScrollContainerRef}
            style={{ height: `${listHeightPx}px` }}
            className="mt-1 divide-y divide-[#26262b]/30 overflow-y-auto pr-1 overscroll-contain transition-all duration-300"
          >
            {todayTransactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-1">
                <p className={`text-xs font-semibold ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                  No expenses recorded for today yet.
                </p>
                <p className={`text-[11px] ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                  Use the form below to log your first transaction today!
                </p>
              </div>
            ) : (
              todayTransactions.map((tx, idx) => (
                <div
                  key={tx.id || `tx-${idx}`}
                  className="h-[51px] py-1 flex items-center justify-between gap-3 group transition-colors px-0.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 shadow-sm"
                      style={{
                        borderColor: `${tx.categoryColor || '#c9b27c'}40`,
                        backgroundColor: `${tx.categoryColor || '#c9b27c'}15`,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: tx.categoryColor || '#c9b27c' }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs font-bold truncate ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                          {tx.description}
                        </p>
                        {tx.time === 'Just now' && (
                          <span className="text-[8px] font-bold px-1.5 py-0.2 rounded-full bg-[#8fb39a]/20 text-[#8fb39a] border border-[#8fb39a]/40 shrink-0">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#8a8a93] flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <CategoryBadge category={tx.category} customColor={tx.categoryColor} />
                        <span>•</span>
                        <span>{tx.time || '12:00 PM'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0 max-w-[45%] min-w-0">
                    <div className={`text-xs sm:text-sm font-bold font-mono break-all line-clamp-1 ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                      {formatCurrency(tx.amount)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BOTTOM BLOCK: NEW EXPENSE DETAILS (Constant position)    */}
      {/* ======================================================== */}
      <div className="mt-auto pt-1">
        <div
          className={`rounded-2xl border transition-all duration-300 shadow-sm relative ${
            isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
          } ${isFormCollapsed ? 'p-3 sm:p-3.5' : 'p-3.5 sm:p-4'}`}
        >
          {/* Panel Header & Centered Collapse / Expand Arrow Button */}
          <div className="relative flex items-center justify-between pb-2 border-b border-[#26262b]/40 min-h-[32px]">
            {/* Left: Heading (Always visible in collapsed & expanded state) */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#c9b27c]/15 text-[#c9b27c] flex items-center justify-center font-bold shrink-0">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className={`text-xs sm:text-sm font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                  New Expense Details
                </h3>
              </div>
            </div>

            {/* CENTER OF TOP EDGE: Downward / Upward Arrow Button */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-2.5 sm:-top-3 z-10">
              <button
                type="button"
                onClick={() => setIsFormCollapsed(prev => !prev)}
                aria-label={isFormCollapsed ? 'Expand expense form' : 'Collapse expense form'}
                title={isFormCollapsed ? 'Expand expense form' : 'Collapse expense form'}
                className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                  isDark
                    ? 'bg-[#202024] border-[#383840] hover:border-[#c9b27c] text-[#c9b27c]'
                    : 'bg-white border-[#dcdad4] hover:border-[#c9b27c] text-[#a68d55]'
                }`}
              >
                {isFormCollapsed ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Expand</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="text-[10px] uppercase tracking-wider font-bold">Collapse</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Quick amount/status indicator */}
            <div className="flex items-center gap-2">
              {isFormCollapsed ? (
                <span className="text-[11px] font-mono text-[#c9b27c] font-semibold">
                  {amount ? `₹${amount}` : 'Tap arrow to open'}
                </span>
              ) : (
                <span className={`text-[10px] hidden md:inline ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                  Selected: {selectedFormatted.shortDate}
                </span>
              )}
            </div>
          </div>

          {/* Collapsible Form Body (Values are preserved in React state) */}
          <div
            className={`transition-all duration-300 ease-in-out ${
              isFormCollapsed
                ? 'max-h-0 opacity-0 overflow-hidden pointer-events-none'
                : 'max-h-[600px] opacity-100 mt-2.5 pt-0.5'
            }`}
          >
            <form onSubmit={handleSubmit} noValidate className="space-y-2.5">
              {/* Row 1: Amount, Category Dropdown, and Date Picker (Unified h-10 inputs) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {/* Amount Input */}
                <div>
                  <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    Amount (Max ₹7,000 without auth)
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-sm font-bold text-[#c9b27c] pointer-events-none select-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        if (errors.amount) {
                          setErrors(prev => ({ ...prev, amount: '' }));
                        }
                      }}
                      onBlur={() => {
                        if (amount) {
                          const err = validateAmount(amount);
                          if (err) setErrors(prev => ({ ...prev, amount: err }));
                        }
                      }}
                      placeholder="0.00"
                      className={`w-full h-10 pl-7 pr-3 rounded-xl border text-xs sm:text-sm font-mono font-bold outline-none transition-colors ${
                        errors.amount
                          ? 'border-[#d97070] text-[#d97070]'
                          : isDark
                          ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea] focus:border-[#c9b27c]'
                          : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b] focus:border-[#c9b27c]'
                      } ${isDark ? 'bg-[#0e0e10]' : 'bg-[#f6f5f2]'}`}
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-[10px] text-[#d97070] font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.amount}</span>
                    </p>
                  )}
                  {!errors.amount && Number(amount) > 7000 && (
                    <p className="text-[10px] text-[#c9b27c] font-semibold mt-1 flex items-center gap-1">
                      <span>Exceeds ₹7,000 threshold (Auth required)</span>
                    </p>
                  )}
                </div>

                {/* Category Dropdown Component */}
                <div>
                  <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    Category
                  </label>
                  <div className="relative">
                    <select
                      value={activeCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        if (errors.category) {
                          setErrors(prev => ({ ...prev, category: '' }));
                        }
                      }}
                      className={`w-full h-10 pl-3 pr-8 rounded-xl border text-xs font-semibold appearance-none outline-none transition-colors cursor-pointer ${
                        errors.category
                          ? 'border-[#d97070]'
                          : isDark
                          ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea] focus:border-[#c9b27c]'
                          : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b] focus:border-[#c9b27c]'
                      } ${isDark ? 'bg-[#0e0e10] text-[#e8e8ea]' : 'bg-[#f6f5f2] text-[#18181b]'}`}
                    >
                      {displayedCategories.map((cat) => (
                        <option
                          key={cat.name}
                          value={cat.name}
                          className={isDark ? 'bg-[#17171a] text-[#e8e8ea]' : 'bg-white text-[#18181b]'}
                        >
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8a8a93] pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                  {errors.category && (
                    <p className="text-[10px] text-[#d97070] font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.category}</span>
                    </p>
                  )}
                </div>

                {/* Date Picker (Unified h-10 segment with Calendar Pop-up) */}
                <div>
                  <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    Date
                  </label>
                  <div
                    className={`h-10 rounded-xl border p-1 flex items-center gap-1 ${
                      errors.date
                        ? 'border-[#d97070]'
                        : isDark
                        ? 'bg-[#0e0e10] border-[#26262b]'
                        : 'bg-[#f6f5f2] border-[#e5e3dc]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectToday();
                        if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                      }}
                      className={`flex-1 h-full rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        dateOption === 'today'
                          ? isDark
                            ? 'bg-[#202024] text-[#c9b27c] shadow-sm font-bold'
                            : 'bg-white text-[#c9b27c] shadow-sm font-bold'
                          : isDark
                          ? 'text-[#8a8a93] hover:text-[#e8e8ea]'
                          : 'text-[#71717a] hover:text-[#18181b]'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleSelectYesterday();
                        if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                      }}
                      className={`flex-1 h-full rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                        dateOption === 'yesterday'
                          ? isDark
                            ? 'bg-[#202024] text-[#c9b27c] shadow-sm font-bold'
                            : 'bg-white text-[#c9b27c] shadow-sm font-bold'
                          : isDark
                          ? 'text-[#8a8a93] hover:text-[#e8e8ea]'
                          : 'text-[#71717a] hover:text-[#18181b]'
                      }`}
                    >
                      Y&apos;day
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenCalendar}
                      title={selectedFormatted.fullDate}
                      className={`flex-1 h-full rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        dateOption === 'calendar'
                          ? isDark
                            ? 'bg-[#202024] text-[#c9b27c] shadow-sm font-bold'
                            : 'bg-white text-[#c9b27c] shadow-sm font-bold'
                          : isDark
                          ? 'text-[#8a8a93] hover:text-[#e8e8ea]'
                          : 'text-[#71717a] hover:text-[#18181b]'
                      }`}
                    >
                      <CalendarIcon className="w-3 h-3" />
                      <span className="truncate max-w-[55px]">{selectedFormatted.shortDate}</span>
                    </button>
                  </div>
                  {errors.date && (
                    <p className="text-[10px] text-[#d97070] font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.date}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Description and Submit Button */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-2.5 items-end">
                <div className="sm:col-span-3">
                  <label className={`block text-[10px] font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    Description / Notes
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (errors.description) {
                        setErrors(prev => ({ ...prev, description: '' }));
                      }
                    }}
                    onBlur={() => {
                      if (description) {
                        const err = validateDescription(description);
                        if (err) setErrors(prev => ({ ...prev, description: err }));
                      }
                    }}
                    placeholder="e.g. Groceries at Trader Joe's, Metro recharge, Dinner split"
                    className={`w-full h-10 px-3 rounded-xl border text-xs outline-none transition-colors ${
                      errors.description
                        ? 'border-[#d97070]'
                        : isDark
                        ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea] focus:border-[#c9b27c]'
                        : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b] focus:border-[#c9b27c]'
                    } ${isDark ? 'bg-[#0e0e10] text-[#e8e8ea]' : 'bg-[#f6f5f2] text-[#18181b]'}`}
                  />
                  {errors.description && (
                    <p className="text-[10px] text-[#d97070] font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.description}</span>
                    </p>
                  )}
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-10 rounded-xl bg-gradient-to-tr from-[#c9b27c] to-[#a68d55] text-neutral-950 font-bold text-xs shadow-md shadow-[#c9b27c]/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      <>
                        <span>Add to Ledger</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Feedback Alert */}
              {feedback && (
                <div
                  className={`p-2.5 rounded-xl text-xs flex items-center justify-between gap-2 animate-fadeIn ${
                    feedback.type === 'success'
                      ? 'bg-[#8fb39a]/15 text-[#8fb39a] border border-[#8fb39a]/30'
                      : 'bg-[#d97070]/15 text-[#d97070] border border-[#d97070]/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{feedback.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedback(null)}
                    className="p-1 rounded-md hover:bg-black/10 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CALENDAR POPUP MODAL (Disables future dates beyond today)*/}
      {/* ======================================================== */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
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
                  Select a date up to today ({todayFormatted.shortDate})
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
                  className="p-1.5 ml-1 rounded-lg text-[#8a8a93] hover:text-white cursor-pointer"
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

            {/* Footer with shortcuts & Cancel */}
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
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                  isDark ? 'border-[#26262b] text-[#e8e8ea]' : 'border-[#e5e3dc] text-[#18181b]'
                }`}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Expense Authorization Modal for amounts > ₹7,000 */}
      <ExpenseAuthorizationModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        amount={pendingExpenseData?.amount || Number(amount) || 0}
        onAuthorized={handleAuthorized}
      />
    </div>
  );
}
