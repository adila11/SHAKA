import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { AVAILABLE_CATEGORIES } from '../data/financeData';

export default function Screen5AddExpense({ customTheme = null, onNavigate, onClose }) {
  const { addExpense, navigateTo } = useFinance();
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  const [timing, setTiming] = useState('Spent now');
  const [amount, setAmount] = useState('750');
  const [selectedCategory, setSelectedCategory] = useState('Food');
  const [date, setDate] = useState('Nov 22, 2026');
  const [description, setDescription] = useState('Coffee with Sam');

  const handleNav = (screen) => {
    if (onNavigate) {
      onNavigate(screen);
    } else {
      navigateTo(screen);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      handleNav('dashboard');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    addExpense({
      amount: Number(amount),
      category: selectedCategory,
      description: description || `${selectedCategory} expense`,
      date: 'Nov 22',
      time: 'Just now',
      user: 'Alex',
    });

    if (onClose) {
      onClose();
    } else {
      handleNav('ledger');
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-end bg-black/40 overflow-hidden relative">
      {/* The Sheet Container */}
      <div
        className={`border-t rounded-t-[28px] p-5 flex flex-col max-h-[760px] overflow-y-auto shadow-2xl transition-colors ${
          isDark
            ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]'
            : 'bg-white border-[#e5e3dc] text-[#18181b]'
        }`}
      >
        {/* Sheet Drag Handle */}
        <div
          className={`w-10 h-1 rounded-full mx-auto mb-3 ${
            isDark ? 'bg-[#26262b]' : 'bg-[#e5e3dc]'
          }`}
        />

        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            Log Expense
          </h3>
          <button
            type="button"
            onClick={handleClose}
            className={`cursor-pointer ${isDark ? 'text-[#8a8a93] hover:text-[#e8e8ea]' : 'text-[#71717a] hover:text-[#18181b]'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Timing Toggle */}
        <div
          className={`p-1 rounded-xl border flex items-center gap-1 mb-4 ${
            isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
          }`}
        >
          <button
            type="button"
            onClick={() => setTiming('Spent now')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer ${
              timing === 'Spent now'
                ? isDark
                  ? 'bg-[#202024] text-[#e8e8ea]'
                  : 'bg-white text-[#18181b]'
                : isDark
                ? 'text-[#8a8a93] hover:text-[#e8e8ea]'
                : 'text-[#71717a] hover:text-[#18181b]'
            }`}
          >
            Spent now
          </button>
          <button
            type="button"
            onClick={() => setTiming('Planned upcoming')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              timing === 'Planned upcoming'
                ? isDark
                  ? 'bg-[#202024] text-[#e8e8ea]'
                  : 'bg-white text-[#18181b]'
                : isDark
                ? 'text-[#8a8a93] hover:text-[#e8e8ea]'
                : 'text-[#71717a] hover:text-[#18181b]'
            }`}
          >
            Planned upcoming
          </button>
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
            <span className="text-2xl font-bold text-[#c9b27c]">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`text-3xl font-black bg-transparent w-44 text-center outline-none font-mono ${
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
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#c9b27c]/20 border-[#c9b27c] text-[#c9b27c]'
                      : isDark
                      ? 'bg-[#0e0e10] border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea]'
                      : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#71717a] hover:text-[#18181b]'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.name}</span>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date & Description */}
        <div className="space-y-3 mb-4">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Date
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full h-10 px-3 rounded-xl border text-xs outline-none focus:border-[#c9b27c] transition-colors ${
                isDark ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]' : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
              }`}
            />
          </div>
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Description / Notes
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Dinner, taxi, supplies"
              className={`w-full h-10 px-3 rounded-xl border text-xs outline-none focus:border-[#c9b27c] transition-colors ${
                isDark ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]' : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
              }`}
            />
          </div>
        </div>

        {/* Log Expense Button */}
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full h-11 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-sm shadow-md shadow-[#c9b27c]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
        >
          <span>Log Expense</span>
        </button>
      </div>
    </div>
  );
}
