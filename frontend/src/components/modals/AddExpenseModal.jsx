import { useState } from 'react';
import { X, Check, Calendar } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';

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

  if (!isAddExpenseModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    const { shortDate, fullDate } = toFormattedDates(selectedDateObj);

    const res = await addExpense({
      amount: Number(amount),
      category: selectedCategory,
      description: description || `${selectedCategory} expense`,
      date: shortDate,
      fullDate,
      time: dateOption === 'today' ? 'Just now' : '12:00 PM',
      user: currentUser?.username || 'abdulshamil',
    });

    if (res?.success) {
      setIsAddExpenseModalOpen(false);
      setCurrentScreen('ledger');
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
        className={`relative z-10 w-full sm:max-w-md rounded-t-[28px] sm:rounded-2xl p-5 sm:p-6 border shadow-2xl overflow-y-auto max-h-[90vh] transition-colors ${
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

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              Log Expense
            </h3>
            <p className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Record a new shared transaction in the ledger
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddExpenseModalOpen(false)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isDark
                ? 'border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea] hover:bg-[#202024]'
                : 'border-[#e5e3dc] text-[#71717a] hover:text-[#18181b] hover:bg-[#f6f5f2]'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Selection: Today | Yesterday | Calendar */}
        <div className="mb-4">
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Date
          </label>
          <div
            className={`p-1 rounded-xl border flex items-center gap-1 ${
              isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setDateOption('today');
                const t = getTodayDate();
                setSelectedDateObj(t);
                setCustomCalendarDate(toIsoDateString(t));
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
                  }
                }}
                className={`w-full h-11 px-3 rounded-xl border text-xs font-mono outline-none focus:border-[#c9b27c] transition-colors cursor-pointer ${
                  isDark ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]' : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                }`}
              />
            </div>
          ) : (
            <div className={`mt-2 text-right text-[11px] font-medium font-mono ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Selected: <span className="text-[#c9b27c]">{toFormattedDates(selectedDateObj).fullDate}</span>
            </div>
          )}
        </div>

        {/* Big Number Input */}
        <div
          className={`p-4 rounded-2xl border text-center mb-4 ${
            isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
          }`}
        >
          <span className={`block text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Amount
          </span>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-3xl font-bold text-[#c9b27c]">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`text-4xl font-black bg-transparent w-48 text-center outline-none font-mono ${
                isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'
              }`}
              placeholder="0"
              autoFocus
            />
          </div>
        </div>

        {/* Category Chip Selector */}
        <div className="mb-4">
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
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#c9b27c]/20 border-[#c9b27c] text-[#c9b27c]'
                      : isDark
                      ? 'bg-[#0e0e10] border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea]'
                      : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#71717a] hover:text-[#18181b]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
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
        <div className="mb-5">
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Description / Notes
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Dinner, taxi split, grocery store"
            className={`w-full h-11 px-3 rounded-xl border text-xs outline-none focus:border-[#c9b27c] transition-colors ${
              isDark ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]' : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
            }`}
          />
        </div>

        {/* Submit Button */}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full h-12 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-sm shadow-md shadow-[#c9b27c]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <span>Confirm & Log to Ledger</span>
        </button>
      </div>
    </div>
  );
}
