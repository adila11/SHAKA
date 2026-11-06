import { createContext, useContext, useState, useMemo } from 'react';
import {
  INITIAL_TRANSACTIONS,
  INITIAL_BUDGET_CATEGORIES,
  INITIAL_MONTHLY_LIMIT,
  INITIAL_USER,
  AVAILABLE_CATEGORIES,
} from '../data/financeData';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [viewMode, setViewMode] = useState('page'); // 'page' | 'all' | 'single'
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentUser, setCurrentUser] = useState(INITIAL_USER);

  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [budgetCategories, setBudgetCategories] = useState(INITIAL_BUDGET_CATEGORIES);
  const [availableCategories, setAvailableCategories] = useState(AVAILABLE_CATEGORIES);
  const [monthlyLimit, setMonthlyLimit] = useState(INITIAL_MONTHLY_LIMIT);

  // Derived financial metrics
  const totalSpent = useMemo(() => {
    return transactions.reduce((sum, item) => sum + Number(item.amount), 0);
  }, [transactions]);

  const remainingLimit = useMemo(() => {
    return Math.max(0, monthlyLimit - totalSpent);
  }, [monthlyLimit, totalSpent]);

  const percentSpent = useMemo(() => {
    if (!monthlyLimit) return 0;
    return Number(((totalSpent / monthlyLimit) * 100).toFixed(1));
  }, [totalSpent, monthlyLimit]);

  // Today's spend calculation (mocking today as Nov 22)
  const todaySpent = useMemo(() => {
    return transactions
      .filter(t => t.date === 'Nov 22')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions]);

  const todayLogsCount = useMemo(() => {
    return transactions.filter(t => t.date === 'Nov 22').length;
  }, [transactions]);

  // Category breakdown for Donut chart and budget calculations
  const categoryTotals = useMemo(() => {
    const totals = {};
    transactions.forEach(t => {
      totals[t.category] = (totals[t.category] || 0) + Number(t.amount);
    });
    return totals;
  }, [transactions]);

  const addExpense = ({ amount, category, description, date = 'Nov 22', time = 'Just now', user = 'Alex' }) => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;

    const chosenCategory = category || 'Food';

    // Find color dynamically from availableCategories or budgetCategories
    const matchedCategory =
      availableCategories.find(c => (c.name || '').toLowerCase() === chosenCategory.toLowerCase()) ||
      budgetCategories.find(c => (c.name || '').toLowerCase() === chosenCategory.toLowerCase() || (c.category || '').toLowerCase() === chosenCategory.toLowerCase());

    const catColor = matchedCategory?.color || '#c9b27c';

    const newTx = {
      id: `tx-${Date.now()}`,
      date,
      fullDate: `${date}, 2026`,
      time,
      category: chosenCategory,
      categoryColor: catColor,
      description: description || `${chosenCategory} expense`,
      amount: numAmount,
      user,
      userRole: 'Admin',
      isSplit: true,
    };

    setTransactions(prev => [newTx, ...prev]);

    // Update corresponding budget category spent
    setBudgetCategories(prev =>
      prev.map(cat => {
        const matches =
          (cat.category && cat.category.toLowerCase() === chosenCategory.toLowerCase()) ||
          (cat.name && cat.name.toLowerCase() === chosenCategory.toLowerCase());

        if (matches) {
          const updatedSpent = cat.spent + numAmount;
          const status =
            updatedSpent > cat.limit
              ? 'Limit reached'
              : updatedSpent >= cat.limit * 0.85
              ? 'Near limit'
              : 'Healthy';
          const statusColor =
            status === 'Limit reached' ? '#d97070' : status === 'Near limit' ? '#d4a359' : '#8fb39a';
          return {
            ...cat,
            spent: updatedSpent,
            status,
            statusColor,
          };
        }
        return cat;
      })
    );

    // Close modal if open
    setIsAddExpenseModalOpen(false);
  };

  const updateCategoryLimit = (categoryId, newLimit) => {
    updateCategory(categoryId, { limit: newLimit });
  };

  const addCategory = ({ name, limit, color }) => {
    const trimmedName = name ? name.trim() : '';
    if (!trimmedName) return;

    const limitVal = Number(limit) || 5000;
    const catColor = color || '#c9b27c';
    const newId = `cat-${Date.now()}`;

    // Check if any existing transactions match this category
    const existingSpent = transactions
      .filter(t => (t.category || '').toLowerCase() === trimmedName.toLowerCase())
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const status =
      existingSpent > limitVal ? 'Limit reached' : existingSpent >= limitVal * 0.85 ? 'Near limit' : 'Healthy';
    const statusColor =
      status === 'Limit reached' ? '#d97070' : status === 'Near limit' ? '#d4a359' : '#8fb39a';

    const newCategory = {
      id: newId,
      name: trimmedName,
      category: trimmedName,
      spent: existingSpent,
      limit: limitVal,
      color: catColor,
      status,
      statusColor,
    };

    setBudgetCategories(prev => [...prev, newCategory]);

    // Also add to availableCategories if not already present
    setAvailableCategories(prev => {
      if (prev.some(c => (c.name || '').toLowerCase() === trimmedName.toLowerCase())) {
        return prev;
      }
      return [...prev, { name: trimmedName, color: catColor }];
    });
  };

  const updateCategory = (categoryId, { name, limit, color }) => {
    const oldCat = budgetCategories.find(b => b.id === categoryId);
    const oldName = oldCat?.name || '';
    const updatedName = name !== undefined && name.trim() ? name.trim() : oldCat?.name || '';
    const limitVal = limit !== undefined && !isNaN(limit) && Number(limit) > 0 ? Number(limit) : oldCat?.limit || 5000;
    const catColor = color || oldCat?.color || '#c9b27c';

    setBudgetCategories(prev =>
      prev.map(cat => {
        if (cat.id === categoryId) {
          const status =
            cat.spent > limitVal ? 'Limit reached' : cat.spent >= limitVal * 0.85 ? 'Near limit' : 'Healthy';
          const statusColor =
            status === 'Limit reached' ? '#d97070' : status === 'Near limit' ? '#d4a359' : '#8fb39a';

          return {
            ...cat,
            name: updatedName,
            category: updatedName,
            limit: limitVal,
            color: catColor,
            status,
            statusColor,
          };
        }
        return cat;
      })
    );

    if (oldName && updatedName && oldName.toLowerCase() !== updatedName.toLowerCase()) {
      setAvailableCategories(prev =>
        prev.map(c => (c.name.toLowerCase() === oldName.toLowerCase() ? { ...c, name: updatedName, color: catColor } : c))
      );
      setTransactions(prev =>
        prev.map(t => ((t.category || '').toLowerCase() === oldName.toLowerCase() ? { ...t, category: updatedName } : t))
      );
    }
  };

  const deleteCategory = (categoryId) => {
    const catToDelete = budgetCategories.find(c => c.id === categoryId);
    setBudgetCategories(prev => prev.filter(cat => cat.id !== categoryId));
    if (catToDelete) {
      setAvailableCategories(prev =>
        prev.filter(c => (c.name || '').toLowerCase() !== (catToDelete.name || '').toLowerCase())
      );
    }
  };

  const navigateTo = screenName => {
    if (screenName === 'add-expense') {
      setIsAddExpenseModalOpen(true);
    } else {
      setCurrentScreen(screenName);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        currentScreen,
        setCurrentScreen,
        navigateTo,
        viewMode,
        setViewMode,
        isAddExpenseModalOpen,
        setIsAddExpenseModalOpen,
        isLoggedIn,
        setIsLoggedIn,
        currentUser,
        setCurrentUser,
        transactions,
        budgetCategories,
        availableCategories,
        monthlyLimit,
        setMonthlyLimit,
        totalSpent,
        remainingLimit,
        percentSpent,
        todaySpent,
        todayLogsCount,
        categoryTotals,
        addExpense,
        updateCategoryLimit,
        addCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}

