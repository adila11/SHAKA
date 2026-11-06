import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { api, setAuthEventHandlers } from '../services/api';
import { DEFAULT_USER, DEFAULT_AVAILABLE_CATEGORIES } from '../data/financeData';

const FinanceContext = createContext();

export function FinanceProvider({ children }) {
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [viewMode, setViewMode] = useState('page'); // 'page' | 'all' | 'single'
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentUser, setCurrentUser] = useState(DEFAULT_USER);

  // Access Code Security & Session Management state
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isAccessCodeEnabled, setIsAccessCodeEnabled] = useState(false);
  const [isAccessCodeModalOpen, setIsAccessCodeModalOpen] = useState(false);
  const [sessionExpiryNotice, setSessionExpiryNotice] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState(DEFAULT_AVAILABLE_CATEGORIES);
  const [monthlyLimit, setMonthlyLimitState] = useState(0);

  const [householdMembers, setHouseholdMembers] = useState([]);
  const [householdBalances, setHouseholdBalances] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isBackendConnected, setIsBackendConnected] = useState(null);
  const [error, setError] = useState(null);

  const isFetchingRef = useRef(false);
  const isHealthCheckingRef = useRef(false);

  // Fetch Session Information from Backend
  const fetchSessionInfo = useCallback(async () => {
    try {
      const res = await api.auth.getSessionInfo();
      if (res.success && res.data) {
        setSessionInfo(res.data);
        setIsAccessCodeEnabled(Boolean(res.data.accessCodeEnabled));
      }
    } catch {
      // Session info unavailable or not logged in
    }
  }, []);

  // Listen for Token Expiration & Session Inactivity Expiration
  useEffect(() => {
    setAuthEventHandlers({
      onRequiresAccessCode: () => {
        setIsAccessCodeModalOpen(true);
      },
      onSessionExpired: (msg) => {
        localStorage.removeItem('shaka_token');
        localStorage.removeItem('shaka_refresh_token');
        localStorage.removeItem('shaka_session_id');
        setIsLoggedIn(false);
        setSessionExpiryNotice(msg || 'Session expired. Please log in again.');
        setCurrentScreen('login');
      },
    });
  }, []);

  // Optimized data fetch with in-flight request deduplication
  const refreshData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const [txRes, catRes, limitRes, availRes, membersRes, balancesRes] = await Promise.allSettled([
        api.transactions.getAll(),
        api.budget.getCategories(),
        api.budget.getMonthlyLimit(),
        api.budget.getAvailableCategories(),
        api.household.getMembers(),
        api.household.getBalances(),
      ]);

      const anySuccess = [txRes, catRes, limitRes, availRes, membersRes, balancesRes].some(
        r => r.status === 'fulfilled' && r.value?.success
      );
      setIsBackendConnected(anySuccess);

      if (txRes.status === 'fulfilled' && txRes.value.success) {
        setTransactions(txRes.value.data || []);
      }

      if (catRes.status === 'fulfilled' && catRes.value.success) {
        setBudgetCategories(catRes.value.data || []);
      }

      if (limitRes.status === 'fulfilled' && limitRes.value.success) {
        setMonthlyLimitState(limitRes.value.monthlyLimit || 0);
      }

      if (availRes.status === 'fulfilled' && availRes.value.success && availRes.value.data?.length) {
        setAvailableCategories(availRes.value.data);
      }

      if (membersRes.status === 'fulfilled' && membersRes.value.success && membersRes.value.data?.length) {
        setHouseholdMembers(membersRes.value.data);
        const me = membersRes.value.data.find(u => u.username === 'abdulshamil') || membersRes.value.data[0];
        if (me) setCurrentUser(me);
      }

      if (balancesRes.status === 'fulfilled' && balancesRes.value.success) {
        setHouseholdBalances(balancesRes.value.data || null);
      }
    } catch (err) {
      console.warn('Failed to fetch from backend:', err);
      setError(err.message);
      setIsBackendConnected(false);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // Initial load only once on mount
  useEffect(() => {
    let ignore = false;
    async function initLoad() {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        const [txRes, catRes, limitRes, availRes, membersRes, balancesRes] = await Promise.allSettled([
          api.transactions.getAll(),
          api.budget.getCategories(),
          api.budget.getMonthlyLimit(),
          api.budget.getAvailableCategories(),
          api.household.getMembers(),
          api.household.getBalances(),
        ]);

        if (!ignore) {
          const anySuccess = [txRes, catRes, limitRes, availRes, membersRes, balancesRes].some(
            r => r.status === 'fulfilled' && r.value?.success
          );
          setIsBackendConnected(anySuccess);

          if (txRes.status === 'fulfilled' && txRes.value.success) {
            setTransactions(txRes.value.data || []);
          }
          if (catRes.status === 'fulfilled' && catRes.value.success) {
            setBudgetCategories(catRes.value.data || []);
          }
          if (limitRes.status === 'fulfilled' && limitRes.value.success) {
            setMonthlyLimitState(limitRes.value.monthlyLimit || 0);
          }
          if (availRes.status === 'fulfilled' && availRes.value.success && availRes.value.data?.length) {
            setAvailableCategories(availRes.value.data);
          }
          if (membersRes.status === 'fulfilled' && membersRes.value.success && membersRes.value.data?.length) {
            setHouseholdMembers(membersRes.value.data);
            const me = membersRes.value.data.find(u => u.username === 'abdulshamil') || membersRes.value.data[0];
            if (me) setCurrentUser(me);
          }
          if (balancesRes.status === 'fulfilled' && balancesRes.value.success) {
            setHouseholdBalances(balancesRes.value.data || null);
          }
          setIsLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message);
          setIsBackendConnected(false);
          setIsLoading(false);
        }
      } finally {
        isFetchingRef.current = false;
      }
    }

    initLoad();
    return () => {
      ignore = true;
    };
  }, []);

  // Smart background heartbeat: skips polling when tab is inactive to avoid unnecessary network traffic
  useEffect(() => {
    const checkHealth = async () => {
      // Don't poll if document is hidden / tab in background
      if (typeof document !== 'undefined' && document.hidden) return;
      if (isHealthCheckingRef.current) return;

      isHealthCheckingRef.current = true;
      try {
        const res = await api.health.check();
        setIsBackendConnected(Boolean(res && res.status === 'healthy'));
      } catch {
        setIsBackendConnected(false);
      } finally {
        isHealthCheckingRef.current = false;
      }
    };

    const interval = setInterval(checkHealth, 15000); // 15-second light interval
    return () => clearInterval(interval);
  }, []);

  // Derived financial metrics computed from real data
  const totalSpent = useMemo(() => {
    return transactions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [transactions]);

  const remainingLimit = useMemo(() => {
    return Math.max(0, monthlyLimit - totalSpent);
  }, [monthlyLimit, totalSpent]);

  const percentSpent = useMemo(() => {
    if (!monthlyLimit || monthlyLimit <= 0) return 0;
    return Number(((totalSpent / monthlyLimit) * 100).toFixed(1));
  }, [totalSpent, monthlyLimit]);

  // Today's spend calculation (matching current day or reference date)
  const todaySpent = useMemo(() => {
    return transactions
      .filter(t => t.date === 'Nov 22' || t.time === 'Just now')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const todayLogsCount = useMemo(() => {
    return transactions.filter(t => t.date === 'Nov 22' || t.time === 'Just now').length;
  }, [transactions]);

  // Category breakdown for charts and budget calculations
  const categoryTotals = useMemo(() => {
    const totals = {};
    transactions.forEach(t => {
      if (t.category) {
        totals[t.category] = (totals[t.category] || 0) + Number(t.amount || 0);
      }
    });
    return totals;
  }, [transactions]);

  // Add Expense to backend
  const addExpense = async ({ amount, category, description, date = 'Nov 22', time = 'Just now', user }) => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;

    try {
      const res = await api.transactions.create({
        amount: numAmount,
        category: category || 'Food',
        description: description || 'New expense',
        date,
        time,
        user: user || currentUser?.username || 'abdulshamil',
        isSplit: true,
      });

      if (res.success && res.data) {
        setIsBackendConnected(true);
        setTransactions(prev => [res.data, ...prev]);

        // Optimistically update budget categories
        setBudgetCategories(prev =>
          prev.map(cat => {
            if (cat.category.toLowerCase() === (category || 'food').toLowerCase()) {
              const updatedSpent = cat.spent + numAmount;
              const status =
                updatedSpent > cat.limit
                  ? 'Limit reached'
                  : updatedSpent >= cat.limit * 0.85
                  ? 'Near limit'
                  : 'Healthy';
              const statusColor =
                status === 'Limit reached' ? '#d97070' : status === 'Near limit' ? '#d4a359' : '#8fb39a';
              return { ...cat, spent: updatedSpent, status, statusColor };
            }
            return cat;
          })
        );
      }
    } catch (err) {
      console.error('Failed to add expense:', err);
      setIsBackendConnected(false);
    } finally {
      setIsAddExpenseModalOpen(false);
    }
  };

  // Update category limit via backend API
  const updateCategoryLimit = async (categoryId, newLimit) => {
    await updateCategory(categoryId, { limit: newLimit });
  };

  // Add category via backend API
  const addCategory = async ({ name, limit, color }) => {
    const trimmedName = name ? name.trim() : '';
    if (!trimmedName) return;

    try {
      const res = await api.budget.addCategory({
        name: trimmedName,
        limit: Number(limit) || 5000,
        color: color || '#c9b27c',
      });

      if (res.success && res.data) {
        setIsBackendConnected(true);
        setBudgetCategories(prev => [...prev, res.data]);
        setAvailableCategories(prev => {
          if (prev.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) return prev;
          return [...prev, { name: trimmedName, color: color || '#c9b27c' }];
        });
      }
    } catch (err) {
      console.error('Failed to add category:', err);
      setIsBackendConnected(false);
    }
  };

  // Update category via backend API
  const updateCategory = async (categoryId, { name, limit, color }) => {
    try {
      const res = await api.budget.updateCategory(categoryId, { name, limit, color });
      if (res.success && res.data) {
        setIsBackendConnected(true);
        setBudgetCategories(prev =>
          prev.map(cat => (cat.id === categoryId ? res.data : cat))
        );
      }
    } catch (err) {
      console.error('Failed to update category:', err);
      setIsBackendConnected(false);
    }
  };

  // Delete category via backend API
  const deleteCategory = async (categoryId) => {
    try {
      const res = await api.budget.deleteCategory(categoryId);
      if (res.success) {
        setIsBackendConnected(true);
        const catToDelete = budgetCategories.find(c => c.id === categoryId);
        setBudgetCategories(prev => prev.filter(cat => cat.id !== categoryId));
        if (catToDelete) {
          setAvailableCategories(prev =>
            prev.filter(c => c.name.toLowerCase() !== catToDelete.name.toLowerCase())
          );
        }
      }
    } catch (err) {
      console.error('Failed to delete category:', err);
      setIsBackendConnected(false);
    }
  };

  // Update monthly limit via backend API
  const setMonthlyLimit = async (newLimit) => {
    const num = Number(newLimit);
    if (isNaN(num) || num <= 0) return;

    try {
      const res = await api.budget.updateMonthlyLimit(num);
      if (res.success) {
        setIsBackendConnected(true);
        setMonthlyLimitState(num);
      }
    } catch (err) {
      console.error('Failed to update monthly limit:', err);
      setIsBackendConnected(false);
    }
  };

  // User authentication via backend API
  const login = async (username, password) => {
    try {
      const res = await api.auth.login({ username, password });
      if (res.success) {
        setIsBackendConnected(true);
        if (res.token) {
          localStorage.setItem('shaka_token', res.token);
        }
        if (res.refreshToken) {
          localStorage.setItem('shaka_refresh_token', res.refreshToken);
        }
        if (res.sessionId) {
          localStorage.setItem('shaka_session_id', res.sessionId);
        }
        if (res.sessionExpiresAt) {
          localStorage.setItem('shaka_session_expires_at', res.sessionExpiresAt);
        }
        if (res.user) {
          setCurrentUser(res.user);
          setIsAccessCodeEnabled(Boolean(res.user.accessCodeEnabled));
        }
        setSessionExpiryNotice(null);
        setIsLoggedIn(true);
        setCurrentScreen('dashboard');
        refreshData();
        fetchSessionInfo();
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      setIsBackendConnected(false);
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  // User logout and session revocation
  const logout = async () => {
    const sessionId = localStorage.getItem('shaka_session_id');
    try {
      if (sessionId) {
        await api.auth.logout({ sessionId, username: currentUser?.username });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('shaka_token');
      localStorage.removeItem('shaka_refresh_token');
      localStorage.removeItem('shaka_session_id');
      localStorage.removeItem('shaka_session_expires_at');
      setSessionInfo(null);
      setIsLoggedIn(false);
      setCurrentScreen('login');
    }
  };

  // Access Code Operations
  const enableAccessCode = async (accessCode) => {
    try {
      const res = await api.auth.enableAccessCode({ accessCode });
      if (res.success) {
        setIsAccessCodeEnabled(true);
        await fetchSessionInfo();
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to enable access code' };
    }
  };

  const changeAccessCode = async (currentAccessCode, newAccessCode) => {
    try {
      const res = await api.auth.changeAccessCode({ currentAccessCode, newAccessCode });
      if (res.success) {
        await fetchSessionInfo();
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to change access code' };
    }
  };

  const disableAccessCode = async (accessCode, password) => {
    try {
      const res = await api.auth.disableAccessCode({ accessCode, password });
      if (res.success) {
        setIsAccessCodeEnabled(false);
        await fetchSessionInfo();
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to disable access code' };
    }
  };

  const resetAccessCode = async (password, newAccessCode) => {
    try {
      const res = await api.auth.resetAccessCode({ password, newAccessCode });
      if (res.success) {
        setIsAccessCodeEnabled(true);
        await fetchSessionInfo();
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to reset access code' };
    }
  };

  const verifyAccessCode = async (accessCode) => {
    const sessionId = localStorage.getItem('shaka_session_id');
    if (!sessionId) {
      return { success: false, message: 'No active session found. Please log in with password.' };
    }

    try {
      const res = await api.auth.verifyAccessCode({ accessCode, sessionId });
      if (res.success && res.token) {
        localStorage.setItem('shaka_token', res.token);
        if (res.refreshToken) {
          localStorage.setItem('shaka_refresh_token', res.refreshToken);
        }
        setIsAccessCodeModalOpen(false);
        await fetchSessionInfo();
        return { success: true };
      }
      return { success: false, message: res.message || 'Verification failed' };
    } catch (err) {
      return {
        success: false,
        message: err.data?.message || err.message || 'Invalid access code',
        lockedOut: err.data?.lockedOut,
        remainingAttempts: err.data?.remainingAttempts,
        sessionExpired: err.data?.sessionExpired,
      };
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
        sessionInfo,
        fetchSessionInfo,
        isAccessCodeEnabled,
        isAccessCodeModalOpen,
        setIsAccessCodeModalOpen,
        sessionExpiryNotice,
        setSessionExpiryNotice,
        enableAccessCode,
        changeAccessCode,
        disableAccessCode,
        resetAccessCode,
        verifyAccessCode,
        login,
        logout,
        transactions,
        budgetCategories,
        availableCategories,
        monthlyLimit,
        setMonthlyLimit,
        householdMembers,
        householdBalances,
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
        isLoading,
        isBackendConnected,
        error,
        refreshData,
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
