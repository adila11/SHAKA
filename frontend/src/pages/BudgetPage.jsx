import { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert
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
    addCategory,
    updateCategory,
    deleteCategory,
    isLoading,
  } = useFinance();
  const { isDark } = useTheme();

  // State for adding a new category
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatLimit, setNewCatLimit] = useState('5000');
  const [newCatColor, setNewCatColor] = useState('#c9b27c');

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
    await updateCategory(catId, {
      name: editName.trim(),
      limit: Number(editLimit) || 1000,
    });
    setEditingCatId(null);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingCatId(null);
  };

  // Confirm delete
  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    await deleteCategory(categoryToDelete.id);
    if (editingCatId === categoryToDelete.id) {
      setEditingCatId(null);
    }
    setCategoryToDelete(null);
  };

  // Open delete confirmation modal
  const handleDeleteCategory = (cat) => {
    setCategoryToDelete(cat);
  };

  // Handle Add Category submission
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    await addCategory({
      name: newCatName.trim(),
      limit: Number(newCatLimit) || 5000,
      color: newCatColor,
    });

    setNewCatName('');
    setNewCatLimit('5000');
    setNewCatColor('#c9b27c');
    setIsAddModalOpen(false);
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
        className={`p-6 rounded-2xl border transition-colors shadow-sm ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Total Monthly Budget
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <span className={`text-3xl font-black font-mono tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                {isLoading ? <Skeleton className="w-28 h-8 my-0.5 inline-block" /> : formatCurrency(totalSpent)}
              </span>
              <span className={`text-sm font-medium ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                spent of {isLoading ? <Skeleton className="w-16 h-4 inline-block" /> : formatCurrency(monthlyLimit)}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Surplus Remaining
            </span>
            <div className="text-2xl font-black font-mono text-[#8fb39a] mt-1">
              {isLoading ? <Skeleton className="w-24 h-7 my-0.5 ml-auto" /> : formatCurrency(remainingLimit)}
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
        <div className="flex justify-between text-xs mt-2 font-medium">
          <span className="text-[#c9b27c]">
            {isLoading ? <Skeleton className="w-32 h-3" /> : `${monthlyLimit > 0 ? ((totalSpent / monthlyLimit) * 100).toFixed(1) : '0.0'}% of total cap utilized`}
          </span>
          <span className={isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}>
            8 days remaining in November
          </span>
        </div>
      </div>

      {/* Grid of Categories (Responsive 3 cols on desktop, 2 on tablet, 1 on mobile) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`p-5 rounded-2xl border transition-colors shadow-sm space-y-4 ${
                isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1.5">
                  <Skeleton className="w-28 h-4 rounded" />
                  <Skeleton className="w-20 h-3 rounded" />
                </div>
                <Skeleton className="w-16 h-5 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="w-32 h-6 rounded" />
                <Skeleton className="w-full h-2 rounded-full" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="w-16 h-3 rounded" />
                <Skeleton className="w-16 h-3 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : budgetCategories.length === 0 ? (
        <div
          className={`p-10 rounded-2xl border text-center transition-colors shadow-sm ${
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
            className="px-4 py-2 rounded-xl bg-[#c9b27c] text-neutral-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Category</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgetCategories.map((cat) => {
          const isEditingThis = editingCatId === cat.id;
          const percent = cat.limit > 0 ? Math.round((cat.spent / cat.limit) * 100) : 0;
          const remaining = Math.max(0, cat.limit - cat.spent);

          return (
            <div
              key={cat.id}
              className={`p-5 rounded-2xl border transition-colors shadow-sm flex flex-col justify-between ${
                isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
              }`}
            >
              <div>
                {/* Header with Title, Status & Actions */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1 min-w-0 pr-2">
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
                        <h3 className={`text-sm font-bold tracking-tight truncate ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                          {cat.name}
                        </h3>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                          {cat.category} allocation
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isEditingThis && (
                      <>
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

                        {/* Edit trigger button */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          title="Edit Category Name & Limit"
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
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
                          title="Delete Category"
                          className="p-1.5 rounded-lg border border-[#26262b] text-[#8a8a93] hover:text-[#d97070] hover:border-[#d97070]/40 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
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
                  <div className="text-right">
                    {isEditingThis ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-[#8a8a93]">Limit: ₹</span>
                        <input
                          type="number"
                          value={editLimit}
                          onChange={(e) => setEditLimit(e.target.value)}
                          className={`w-24 px-2 py-1 text-xs font-mono font-bold rounded-lg border outline-none focus:border-[#c9b27c] ${
                            isDark
                              ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                              : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                          }`}
                        />
                      </div>
                    ) : (
                      <span className={`text-xs font-mono ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
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

                <div className="flex justify-between text-xs mt-2">
                  <span className={`font-semibold ${percent > 100 ? 'text-[#d97070]' : 'text-[#8a8a93]'}`}>
                    {percent}% used
                  </span>
                  <span className={percent > 100 ? 'text-[#d97070] font-medium' : 'text-[#8fb39a] font-medium'}>
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
            className={`relative z-10 w-full max-w-md rounded-2xl p-6 border shadow-2xl transition-colors ${
              isDark ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]' : 'bg-white border-[#e5e3dc] text-[#18181b]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold tracking-tight">Add New Category</h3>
                <p className="text-xs text-[#8a8a93]">Define a new category and monthly ceiling limit</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg border border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-[#8a8a93]">
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
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
                    onChange={(e) => setNewCatLimit(e.target.value)}
                    placeholder="5000"
                    className={`w-full h-11 pl-8 pr-4 rounded-xl border text-sm font-mono outline-none focus:border-[#c9b27c] transition-colors ${
                      isDark ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]' : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                    }`}
                  />
                </div>
              </div>

              {/* Color accent selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#8a8a93]">
                  Color Accent
                </label>
                <div className="flex items-center gap-2.5">
                  {COLOR_PALETTE.map((pal) => (
                    <button
                      key={pal.hex}
                      type="button"
                      onClick={() => setNewCatColor(pal.hex)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform cursor-pointer ${
                        newCatColor === pal.hex ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-neutral-900' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: pal.hex }}
                      title={pal.name}
                    >
                      {newCatColor === pal.hex && <Check className="w-4 h-4 text-neutral-950 stroke-[3]" />}
                    </button>
                  ))}
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
            className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#d97070]/15 border border-[#d97070]/30 flex items-center justify-center text-[#d97070] shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-bold ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                  Delete Category
                </h3>
                <p className="text-xs text-[#8a8a93]">This action cannot be undone.</p>
              </div>
            </div>

            <p className={`text-xs my-4 leading-relaxed ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Are you sure you want to delete <span className="font-semibold text-[#c9b27c]">"{categoryToDelete.name}"</span>? Its allocated budget limit will be removed from your monthly ceiling.
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
