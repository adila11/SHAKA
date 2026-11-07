import { useState } from 'react';
import { X, Check, Calendar, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import ExpenseAuthorizationModal from './ExpenseAuthorizationModal';

const getTodayDate = () => new Date();
const getYesterdayDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
};

const toIsoDateString = (dateObj) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toFormattedDates = (dateObj) => {
  const d = new Date(dateObj);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const day = d.getDate();
  const year = d.getFullYear();
  return {
    shortDate: `${month} ${day}`,
    fullDate: `${month} ${day}, ${year}`,
  };
};

export default function AddExpenseModal() {
  const { isAddExpenseModalOpen, setIsAddExpenseModalOpen, addExpense, setCurrentScreen, availableCategories, currentUser } = useFinance();
  const { isDark } = useTheme();

  const [amount, setAmount] = useState('750');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [description, setDescription] = useState('Coffee & Workspace with Sam');

  // Date Selection: 'today' | 'yesterday' | 'calendar'
  const [dateOption, setDateOption] = useState('today');
  const [selectedDateObj, setSelectedDateObj] = useState(getTodayDate());
  const [customCalendarDate, setCustomCalendarDate] = useState(toIsoDateString(getTodayDate()));

  // Custom JavaScript form validation errors
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expense Authorization Modal state for amounts > ₹7,000
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [pendingExpenseData, setPendingExpenseData] = useState(null);

  if (!isAddExpenseModalOpen) return null;

  const validateAmount = (val) => {
    if (val === '' || val === null || val === undefined) {
      return 'Amount is required.';
    }
    const num = Number(val);
    if (isNaN(num)) {
      return 'Amount must be a valid number.';
    }
    if (num <= 0) {
      return 'Amount must be greater than 0.';
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
      return 'Category is required.';
    }
    const exists = availableCategories.some(
      (c) => c.name.toLowerCase() === val.trim().toLowerCase()
    );
    if (!exists) {
      return 'Selected category is not valid.';
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
      return 'Future dates are not permitted.';
    }
    return '';
  };

  const executeAddExpense = async (payload, authorizationToken = null) => {
    setIsSubmitting(true);
    try {
      const dataToSend = authorizationToken
        ? { ...payload, authorizationToken }
        : payload;

      const res = await addExpense(dataToSend);

      if (res?.success) {
        setIsAddExpenseModalOpen(false);
        setIsAuthModalOpen(false);
        setPendingExpenseData(null);
        setCurrentScreen('ledger');
      } else {
        setErrors({ form: res?.message || 'Failed to add expense.' });
      }
    } catch (err) {
      setErrors({ form: err.message || 'Error occurred while saving expense.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const amountErr = validateAmount(amount);
    const catErr = validateCategory(selectedCategory);
    const descErr = validateDescription(description);
    const dateErr = validateDate(selectedDateObj);

    const fieldErrors = {};
    if (amountErr) fieldErrors.amount = amountErr;
    if (catErr) fieldErrors.category = catErr;
    if (descErr) fieldErrors.description = descErr;
    if (dateErr) fieldErrors.date = dateErr;

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    const numAmount = Number(amount);
    const { shortDate, fullDate } = toFormattedDates(selectedDateObj);

    const expensePayload = {
      amount: numAmount,
      category: selectedCategory,
      description: description.trim() || `${selectedCategory} expense`,
      date: shortDate,
      fullDate,
      time: dateOption === 'today' ? 'Just now' : '12:00 PM',
      user: currentUser?.username || '',
    };

    if (numAmount > 7000) {
      setPendingExpenseData(expensePayload);
      setIsAuthModalOpen(true);
      return;
    }

    await executeAddExpense(expensePayload);
  };

  const handleAuthorized = async (authToken) => {
    if (pendingExpenseData) {
      await executeAddExpense(pendingExpenseData, authToken);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 transition-all">
      {/* Background click to dismiss */}
      <div
        className="fixed inset-0"
        onClick={() => setIsAddExpenseModalOpen(false)}
      />

      {/* Modal / Sheet Container */}
      <div
        className={`relative z-10 w-full sm:max-w-md rounded-t-[28px] sm:rounded-2xl p-5 sm:p-6 border shadow-2xl overflow-y-auto overflow-x-hidden max-h-[90vh] transition-colors min-w-0 max-w-full break-words ${
          isDark
            ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]'
            : 'bg-white border-[#e5e3dc] text-[#18181b]'
        }`}
      >
        {/* Mobile Drag Indicator */}
        <div
          className={`sm:hidden w-12 h-1 rounded-full mx-auto mb-3 ${
            isDark ? 'bg-[#26262b]' : 'bg-[#e5e3dc]'
          }`}
        />

        <div className="flex items-center justify-between mb-4 min-w-0">
          <div className="min-w-0">
            <h3 className={`text-lg font-bold tracking-tight truncate ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              Log Expense
            </h3>
            <p className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Record a new shared transaction in the ledger
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddExpenseModalOpen(false)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
              isDark
                ? 'border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea] hover:bg-[#202024]'
                : 'border-[#e5e3dc] text-[#71717a] hover:text-[#18181b] hover:bg-[#f6f5f2]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errors.form && (
          <div className="mb-4 p-3 rounded-xl bg-[#d97070]/10 border border-[#d97070]/30 text-[#d97070] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Date Selection: Today | Yesterday | Calendar */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Date
            </label>
            <div
              className={`p-1 rounded-xl border flex items-center gap-1 ${
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
                  setDateOption('today');
                  const t = getTodayDate();
                  setSelectedDateObj(t);
                  setCustomCalendarDate(toIsoDateString(t));
                  if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                onClick={() => {
                  setDateOption('yesterday');
                  const y = getYesterdayDate();
                  setSelectedDateObj(y);
                  setCustomCalendarDate(toIsoDateString(y));
                  if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
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
                onClick={() => setDateOption('calendar')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  dateOption === 'calendar'
                    ? isDark
                      ? 'bg-[#202024] text-[#c9b27c] shadow-sm'
                      : 'bg-white text-[#c9b27c] shadow-sm'
                    : isDark
                    ? 'text-[#8a8a93] hover:text-[#e8e8ea]'
                    : 'text-[#71717a] hover:text-[#18181b]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendar</span>
              </button>
            </div>

            {/* If Calendar option is chosen, show the interactive calendar date picker */}
            {dateOption === 'calendar' ? (
              <div className="mt-2.5">
                <input
                  type="date"
                  value={customCalendarDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomCalendarDate(val);
                    if (val) {
                      const parts = val.split('-');
                      setSelectedDateObj(new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
                      if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
                    }
                  }}
                  className={`w-full h-11 px-3 rounded-xl border text-xs font-mono outline-none focus:border-[#c9b27c] transition-colors cursor-pointer ${
                    errors.date
                      ? 'border-[#d97070]'
                      : isDark
                      ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                      : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                  }`}
                />
              </div>
            ) : (
              <div className={`mt-2 text-right text-[11px] font-medium font-mono ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                Selected: <span className="text-[#c9b27c]">{toFormattedDates(selectedDateObj).fullDate}</span>
              </div>
            )}
            {errors.date && (
              <p className="text-[10px] text-[#d97070] font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.date}</span>
              </p>
            )}
          </div>

          {/* Big Number Input (Responsive & Overflow Proof) */}
          <div
            className={`p-4 rounded-2xl border text-center transition-colors min-w-0 max-w-full ${
              errors.amount
                ? 'border-[#d97070] bg-[#d97070]/5'
                : isDark
                ? 'bg-[#0e0e10] border-[#26262b]'
                : 'bg-[#f6f5f2] border-[#e5e3dc]'
            }`}
          >
            <span className={`block text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Amount (₹7,000 threshold)
            </span>
            <div className="flex items-center justify-center gap-1 mt-1 min-w-0 max-w-full">
              <span className="text-2xl sm:text-3xl font-bold text-[#c9b27c] shrink-0">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors(prev => ({ ...prev, amount: '' }));
                }}
                className={`text-2xl sm:text-4xl font-black bg-transparent w-full max-w-[200px] text-center outline-none font-mono min-w-0 break-all ${
                  isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'
                }`}
                placeholder="0"
                autoFocus
              />
            </div>
            {errors.amount && (
              <p className="text-[10px] text-[#d97070] font-semibold mt-2 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.amount}</span>
              </p>
            )}
            {!errors.amount && Number(amount) > 7000 && (
              <p className="text-[10px] text-[#c9b27c] font-semibold mt-2 flex items-center justify-center gap-1">
                <span>Exceeds ₹7,000 threshold (Auth required)</span>
              </p>
            )}
          </div>

          {/* Category Chip Selector */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availableCategories.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat.name);
                      if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-between min-w-0 ${
                      isSelected
                        ? 'bg-[#c9b27c]/20 border-[#c9b27c] text-[#c9b27c]'
                        : isDark
                        ? 'bg-[#0e0e10] border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea]'
                        : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#71717a] hover:text-[#18181b]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="truncate">{cat.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] shrink-0" />}
                  </button>
                );
              })}
            </div>
            {errors.category && (
              <p className="text-[10px] text-[#d97070] font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.category}</span>
              </p>
            )}
          </div>

          {/* Description / Notes */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Description / Notes
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
              }}
              placeholder="e.g. Dinner, taxi split, grocery store"
              className={`w-full h-11 px-3 rounded-xl border text-xs outline-none focus:border-[#c9b27c] transition-colors ${
                errors.description
                  ? 'border-[#d97070]'
                  : isDark
                  ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                  : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
              }`}
            />
            {errors.description && (
              <p className="text-[10px] text-[#d97070] font-semibold mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.description}</span>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-sm shadow-md shadow-[#c9b27c]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
          >
            <span>Confirm & Log to Ledger</span>
          </button>
        </form>
      </div>

      <ExpenseAuthorizationModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        amount={pendingExpenseData?.amount || Number(amount) || 0}
        onAuthorized={handleAuthorized}
      />
    </div>
  );
}
