import { useState, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Pipette,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../data/financeData';
import { Skeleton } from '../components/common/Skeleton';

const COLOR_PALETTE = [
  { name: 'Gold', hex: '#c9b27c' },
  { name: 'Sage', hex: '#8fb39a' },
  { name: 'Amber', hex: '#d4a359' },
  { name: 'Rose', hex: '#d97070' },
  { name: 'Blue', hex: '#60a5fa' },
  { name: 'Muted', hex: '#8a8a93' },
];

export default function BudgetPage() {
  const {
    budgetCategories,
    totalSpent,
    monthlyLimit,
    remainingLimit,
    daysRemaining,
    monthName,
    addCategory,
    updateCategory,
    deleteCategory,
    isActionPending,
    isLoading,
  } = useFinance();
  const { isDark } = useTheme();

  // State for adding a new category
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('5000');
  const [newCatColor, setNewCatColor] = useState('#c9b27c');
  const [addCatError, setAddCatError] = useState('');
  const customColorInputRef = useRef(null);

  const isCustomColor = !COLOR_PALETTE.some(
    (pal) => pal.hex.toLowerCase() === (newCatColor || '').toLowerCase()
  );

  // State for editing a specific category
  const [editingCatId, setEditingCatId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editLimit, setEditLimit] = useState('');

  // State for deleting a category with custom modal
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Start editing a card
  const handleStartEdit = (cat) => {
    setEditingCatId(cat.id);
    setEditName(cat.name);
    setEditLimit(String(cat.limit));
  };

  // Save changes to category
  const handleSaveEdit = async (catId) => {
    if (!editName.trim()) return;
    const name = editName.trim();
    const limit = Number(editLimit) || 1000;
    setEditingCatId(null);
    await updateCategory(catId, {
      name,
      limit,
    });
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingCatId(null);
  };

  // Confirm delete
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const cat = categoryToDelete;
    setCategoryToDelete(null);
    if (editingCatId === cat.id) {
      setEditingCatId(null);
    }
    await deleteCategory(cat.id);
  };

  // Open delete confirmation modal
  const handleDeleteCategory = (cat) => {
    setCategoryToDelete(cat);
  };

  // Handle Add Category submission with JS validation
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    const trimmed = newCatName.trim();
    if (!trimmed) {
      setAddCatError('Category name is required.');
      return;
    }
    const numLimit = Number(newCatLimit);
    if (isNaN(numLimit) || numLimit <= 0) {
      setAddCatError('Monthly limit must be a positive number greater than 0.');
      return;
    }

    setAddCatError('');
    setIsAddModalOpen(false);

    const savedName = trimmed;
    const savedLimit = newCatLimit;
    const savedColor = newCatColor;

    setNewCatName('');
    setNewCatLimit('5000');
    setNewCatColor('#c9b27c');

    const res = await addCategory({
      name: savedName,
      limit: numLimit,
      color: savedColor,
    });

    if (!res.success) {
      // Preserve user-entered info if submission failed
      setNewCatName(savedName);
      setNewCatLimit(savedLimit);
      setNewCatColor(savedColor);
    }
  };

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
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              Budget Allocation
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Add Category Button */}
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-tr from-[#c9b27c] to-[#a68d55] text-neutral-950 font-bold text-xs shadow-md shadow-[#c9b27c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Category</span>
            </button>
          </div>
        </div>
      </div>

      {/* Total Monthly Budget Overview Card */}
      <div
        className={`p-4 sm:p-6 rounded-2xl border transition-colors shadow-sm min-w-0 max-w-full overflow-hidden ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 min-w-0">
          <div className="min-w-0">
            <span className={`text-xs font-semibold uppercase tracking-wider truncate block ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Total Monthly Budget
            </span>
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3 mt-1 min-w-0">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono tracking-tight truncate max-w-full ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}
                title={formatCurrency(totalSpent)}
              >
                {isLoading ? <Skeleton className="w-24 sm:w-28 h-7 sm:h-8 my-0.5 inline-block" /> : formatCurrency(totalSpent)}
              </span>
              <span
                className={`text-xs sm:text-sm font-medium truncate max-w-full ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}
                title={`spent of ${formatCurrency(monthlyLimit)}`}
              >
                spent of {isLoading ? <Skeleton className="w-16 h-4 inline-block" /> : formatCurrency(monthlyLimit)}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right min-w-0 shrink-0">
            <span className={`text-xs font-semibold uppercase tracking-wider truncate block ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Surplus Remaining
            </span>
            <div
              className="text-xl sm:text-2xl font-black font-mono text-[#8fb39a] mt-1 truncate max-w-full"
              title={formatCurrency(remainingLimit)}
            >
              {isLoading ? <Skeleton className="w-20 sm:w-24 h-6 sm:h-7 my-0.5 sm:ml-auto" /> : formatCurrency(remainingLimit)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-[#26262b]' : 'bg-[#e5e3dc]'}`}>
          {isLoading ? (
            <Skeleton className="w-full h-full rounded-full" />
          ) : (
            <div
              className="h-full rounded-full bg-[#c9b27c] transition-all duration-700 ease-out"
              style={{ width: `${monthlyLimit > 0 ? Math.min(100, (totalSpent / monthlyLimit) * 100) : 0}%` }}
            />
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs mt-2 font-medium min-w-0">
          <span className="text-[#c9b27c] truncate max-w-full">
            {isLoading ? <Skeleton className="w-32 h-3" /> : `${monthlyLimit > 0 ? ((totalSpent / monthlyLimit) * 100).toFixed(1) : '0.0'}% of total cap utilized`}
          </span>
          <span className={`shrink-0 text-right ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            {daysRemaining} days remaining in {monthName}
          </span>
        </div>
      </div>

      {/* Grid of Categories (Responsive 3 cols on desktop, 2 on tablet, 1 on mobile) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 min-w-0 max-w-full">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`p-4 sm:p-5 rounded-2xl border transition-colors shadow-sm space-y-4 min-w-0 max-w-full overflow-hidden ${
                isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
              }`}
            >
              <div className="flex justify-between items-start min-w-0">
                <div className="space-y-1.5 min-w-0">
                  <Skeleton className="w-28 h-4 rounded" />
                  <Skeleton className="w-20 h-3 rounded" />
                </div>
                <Skeleton className="w-16 h-5 rounded-full shrink-0" />
              </div>
              <div className="space-y-2 min-w-0">
                <Skeleton className="w-32 h-6 rounded" />
                <Skeleton className="w-full h-2 rounded-full" />
              </div>
              <div className="flex justify-between min-w-0">
                <Skeleton className="w-16 h-3 rounded" />
                <Skeleton className="w-16 h-3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : budgetCategories.length === 0 ? (
        <div
          className={`p-10 rounded-2xl border text-center transition-colors shadow-sm min-w-0 max-w-full ${
            isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
          }`}
        >
          <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            No budget categories found
          </p>
          <p className="text-xs text-[#8a8a93] mb-4">
            Create custom spending categories to track category-specific spending limits.
          </p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#c9b27c] text-neutral-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 min-w-0 max-w-full">
          {budgetCategories.map((cat) => {
          const isEditingThis = editingCatId === cat.id;
          const percent = cat.limit > 0 ? Math.round((cat.spent / cat.limit) * 100) : 0;
          const remaining = Math.max(0, cat.limit - cat.spent);

          return (
            <div
              key={cat.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-colors shadow-sm flex flex-col justify-between min-w-0 max-w-full overflow-hidden ${
                isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
              }`}
            >
              <div className="min-w-0">
                {/* Header with Title, Status & Actions */}
                <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
                  <div className="flex-1 min-w-0 pr-1">
                    {isEditingThis ? (
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#8a8a93] uppercase tracking-wider block font-medium">
                          Category Name
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={`w-full px-2.5 py-1 text-sm font-bold rounded-lg border outline-none focus:border-[#c9b27c] ${
                            isDark
                              ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                              : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                          }`}
                          placeholder="Category name"
                          autoFocus
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className={`text-sm font-bold tracking-tight truncate break-words ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                          {cat.name}
                        </h3>
                        <p className={`text-[11px] mt-0.5 truncate ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                          {cat.category} allocation
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 min-w-0">
                    {!isEditingThis && (
                      <>
                        {cat.status === 'Limit reached' || cat.status === 'Exceeded' ? (
                          <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[#d97070]/20 text-[#d97070] font-bold border border-[#d97070]/30 flex items-center gap-1 shrink-0">
                            <ShieldAlert className="w-3 h-3" />
                            <span className="truncate">{cat.status === 'Exceeded' ? 'Exceeded' : 'Limit reached'}</span>
                          </span>
                        ) : cat.status === 'Near limit' || cat.status === 'Warning' ? (
                          <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[#d4a359]/20 text-[#d4a359] font-bold border border-[#d4a359]/30 flex items-center gap-1 shrink-0">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="truncate">{cat.status === 'Warning' ? 'Warning' : 'Near limit'}</span>
                          </span>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded-full bg-[#8fb39a]/15 text-[#8fb39a] font-bold border border-[#8fb39a]/30 flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="truncate">Healthy</span>
                          </span>
                        )}

                        {/* Edit trigger button */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          disabled={isActionPending(`cat-update-${cat.id}`) || isActionPending(`cat-del-${cat.id}`)}
                          title="Edit Category Name & Limit"
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${
                            isDark
                              ? 'bg-[#0e0e10] border-[#26262b] text-[#8a8a93] hover:text-[#c9b27c] hover:border-[#c9b27c]'
                              : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#71717a] hover:text-[#c9b27c] hover:border-[#c9b27c]'
                          }`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete trigger button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          disabled={isActionPending(`cat-del-${cat.id}`)}
                          title="Delete Category"
                          className="p-1.5 rounded-lg border border-[#26262b] text-[#8a8a93] hover:text-[#d97070] hover:border-[#d97070]/40 transition-colors cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Amounts Readout */}
                <div className="flex items-baseline justify-between gap-2 mb-2 min-w-0">
                  <span
                    className={`text-base sm:text-lg lg:text-xl font-black font-mono truncate min-w-0 max-w-[55%] ${
                      percent > 100 ? 'text-[#d97070]' : isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'
                    }`}
                    title={formatCurrency(cat.spent)}
                  >
                    {formatCurrency(cat.spent)}
                  </span>
                  <div className="text-right shrink-0 min-w-0 max-w-[45%]">
                    {isEditingThis ? (
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-xs text-[#8a8a93]">Limit: ₹</span>
                        <input
                          type="number"
                          value={editLimit}
                          onChange={(e) => setEditLimit(e.target.value)}
                          className={`w-20 px-1.5 py-1 text-xs font-mono font-bold rounded-lg border outline-none focus:border-[#c9b27c] ${
                            isDark
                              ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                              : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                          }`}
                        />
                      </div>
                    ) : (
                      <span
                        className={`text-xs font-mono truncate block ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}
                        title={`of ${formatCurrency(cat.limit)}`}
                      >
                        of {formatCurrency(cat.limit)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#26262b]' : 'bg-[#e5e3dc]'}`}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, percent)}%`,
                      backgroundColor: cat.statusColor || cat.color || '#c9b27c',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs mt-2 min-w-0">
                  <span className={`font-semibold shrink-0 ${percent > 100 ? 'text-[#d97070]' : 'text-[#8a8a93]'}`}>
                    {percent}% used
                  </span>
                  <span
                    className={`font-medium truncate text-right min-w-0 ${percent > 100 ? 'text-[#d97070]' : 'text-[#8fb39a]'}`}
                    title={percent > 100 ? `${formatCurrency(cat.spent - cat.limit)} over` : `${formatCurrency(remaining)} left`}
                  >
                    {percent > 100 ? `${formatCurrency(cat.spent - cat.limit)} over` : `${formatCurrency(remaining)} left`}
                  </span>
                </div>
              </div>

              {/* Edit Controls Toolbar */}
              {isEditingThis && (
                <div className="mt-4 pt-3 border-t border-[#26262b]/60 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    className="px-2.5 py-1.5 rounded-lg border border-[#d97070]/30 text-[#d97070] text-xs font-semibold flex items-center gap-1.5 hover:bg-[#d97070]/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#8a8a93] hover:text-[#e8e8ea] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(cat.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </div>
      )}

      {/* Add New Category Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div
            className="fixed inset-0"
            onClick={() => setIsAddModalOpen(false)}
          />

          <div
            className={`relative z-10 w-full max-w-md rounded-2xl p-6 border shadow-2xl transition-colors min-w-0 max-w-full break-words overflow-hidden ${
              isDark ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]' : 'bg-white border-[#e5e3dc] text-[#18181b]'
            }`}
          >
            <div className="flex items-center justify-between mb-4 min-w-0">
              <div className="min-w-0">
                <h3 className="text-lg font-bold tracking-tight truncate">Add New Category</h3>
                <p className="text-xs text-[#8a8a93]">Define a new category and monthly ceiling limit</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg border border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea] cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addCatError && (
              <div className="mb-4 p-2.5 rounded-xl bg-[#d97070]/10 border border-[#d97070]/30 text-[#d97070] text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{addCatError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCategory} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[#8a8a93]">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    if (addCatError) setAddCatError('');
                  }}
                  placeholder="e.g. Entertainment, Fitness, Education"
                  className={`w-full h-11 px-3.5 rounded-xl border text-sm outline-none focus:border-[#c9b27c] transition-colors ${
                    isDark ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]' : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[#8a8a93]">
                  Monthly Limit (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-sm font-bold text-[#c9b27c]">₹</span>
                  <input
                    type="number"
                    value={newCatLimit}
                    onChange={(e) => {
                      setNewCatLimit(e.target.value);
                      if (addCatError) setAddCatError('');
                    }}
                    placeholder="5000"
                    className={`w-full h-11 pl-8 pr-4 rounded-xl border text-sm font-mono outline-none focus:border-[#c9b27c] transition-colors ${
                      isDark ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]' : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                    }`}
                  />
                </div>
              </div>

              {/* Color accent selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#8a8a93]">
                    Color Accent
                  </label>
                  <span className="text-[11px] font-mono text-[#c9b27c] uppercase">
                    {newCatColor}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PALETTE.map((pal) => (
                    <button
                      key={pal.hex}
                      type="button"
                      onClick={() => setNewCatColor(pal.hex)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                        newCatColor.toLowerCase() === pal.hex.toLowerCase()
                          ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-neutral-900'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: pal.hex }}
                      title={pal.name}
                    >
                      {newCatColor.toLowerCase() === pal.hex.toLowerCase() && (
                        <Check className="w-4 h-4 text-neutral-950 stroke-[3]" />
                      )}
                    </button>
                  ))}

                  {/* Custom Color Palette Option */}
                  <div className="relative flex items-center">
                    <button
                      type="button"
                      onClick={() => customColorInputRef.current?.click()}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer relative overflow-hidden ${
                        isCustomColor
                          ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-neutral-900 shadow-md'
                          : 'hover:scale-105 ring-1 ring-[#3a3a40]'
                      } ${
                        isCustomColor
                          ? ''
                          : 'bg-[conic-gradient(at_center,_#ef4444,_#f59e0b,_#10b981,_#06b6d4,_#3b82f6,_#8b5cf6,_#ec4899,_#ef4444)]'
                      }`}
                      style={isCustomColor ? { backgroundColor: newCatColor } : undefined}
                      title="Choose custom color palette..."
                    >
                      {isCustomColor ? (
                        <Check className="w-4 h-4 text-white stroke-[3] drop-shadow" />
                      ) : (
                        <Pipette className="w-3.5 h-3.5 text-white drop-shadow stroke-[2.5]" />
                      )}
                    </button>

                    {/* Native hidden color input that opens system color palette */}
                    <input
                      ref={customColorInputRef}
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="sr-only"
                      aria-label="Pick custom color"
                    />
                  </div>

                  {/* Hex quick edit */}
                  <div className="flex items-center gap-1.5 ml-1">
                    <input
                      type="text"
                      value={newCatColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNewCatColor(val);
                      }}
                      placeholder="#c9b27c"
                      maxLength={7}
                      className={`w-20 h-8 px-2 rounded-lg border text-xs font-mono uppercase text-center outline-none focus:border-[#c9b27c] transition-colors ${
                        isDark ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]' : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                      }`}
                      title="Enter hex code"
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                      style={{ backgroundColor: newCatColor }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8a8a93] hover:text-[#e8e8ea] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 text-xs font-bold transition-all shadow-md shadow-[#c9b27c]/20 cursor-pointer"
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl transition-all min-w-0 max-w-full break-words overflow-hidden ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <div className="flex items-center gap-3 mb-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#d97070]/15 border border-[#d97070]/30 flex items-center justify-center text-[#d97070] shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className={`text-base font-bold truncate ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                  Delete Category
                </h3>
                <p className="text-xs text-[#8a8a93]">This action cannot be undone.</p>
              </div>
            </div>

            <p className={`text-xs my-4 leading-relaxed ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Are you sure you want to delete <span className="font-semibold text-[#c9b27c] break-all">"{categoryToDelete.name}"</span>? Its allocated budget limit will be removed from your monthly ceiling.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8a8a93] hover:text-[#e8e8ea] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="px-4 py-2 rounded-xl bg-[#d97070] hover:bg-[#c65a5a] text-white text-xs font-bold transition-all shadow-md shadow-[#d97070]/20 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
