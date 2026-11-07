import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { api, setAuthEventHandlers } from '../services/api';
import { DEFAULT_USER, DEFAULT_AVAILABLE_CATEGORIES } from '../data/financeData';

const FinanceContext = createContext();

// Helper to sort transactions descending (newest first)
const sortTransactionsNewestFirst = (list) => {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    if (a.time === 'Just now' && b.time !== 'Just now') return -1;
    if (b.time === 'Just now' && a.time !== 'Just now') return 1;
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA && timeB && timeA !== timeB) return timeB - timeA;
    const dateA = new Date(a.fullDate || a.date).getTime();
    const dateB = new Date(b.fullDate || b.date).getTime();
    if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) return dateB - dateA;
    return 0;
  });
};

// Helper to prevent duplicate entries
const deduplicateTransactions = (list) => {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const deduped = [];
  for (const item of list) {
    if (item && item.id && !seen.has(item.id)) {
      seen.add(item.id);
      deduped.push(item);
    }
  }
  return deduped;
};

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
  const [isRefreshing, setIsRefreshing] = useState(false);
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

  // Optimized data fetch with in-flight request deduplication & background preservation
  const refreshData = useCallback(async (options = {}) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // Only trigger full skeleton loading if explicitly requested or initial data is absent
    const showSkeleton = options.showLoading ?? false;
    if (showSkeleton) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
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

      if (anySuccess) {
        setIsBackendConnected(true);
      }

      if (txRes.status === 'fulfilled' && txRes.value?.success) {
        setTransactions(sortTransactionsNewestFirst(deduplicateTransactions(txRes.value.data || [])));
      }

      if (catRes.status === 'fulfilled' && catRes.value?.success) {
        setBudgetCategories(catRes.value.data || []);
      }

      if (limitRes.status === 'fulfilled' && limitRes.value?.success) {
        setMonthlyLimitState(limitRes.value.monthlyLimit || 0);
      }

      if (availRes.status === 'fulfilled' && availRes.value?.success && availRes.value.data?.length) {
        setAvailableCategories(availRes.value.data);
      }

      if (membersRes.status === 'fulfilled' && membersRes.value?.success && membersRes.value.data?.length) {
        setHouseholdMembers(membersRes.value.data);
        const me = membersRes.value.data.find(u => u.username === 'abdulshamil') || membersRes.value.data[0];
        if (me) setCurrentUser(me);
      }

      if (balancesRes.status === 'fulfilled' && balancesRes.value?.success) {
        setHouseholdBalances(balancesRes.value.data || null);
      }

      if (!anySuccess) {
        const firstError = [txRes, catRes, limitRes, availRes, membersRes, balancesRes].find(
          r => r.status === 'rejected'
        );
        if (firstError) {
          setError(firstError.reason?.message || 'Failed to sync with backend');
          setIsBackendConnected(false);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch from backend:', err);
      setError(err.message || 'Unable to connect to backend');
      setIsBackendConnected(false);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load only once on mount
  useEffect(() => {
    let ignore = false;
    async function initLoad() {
      await refreshData({ showLoading: true });
      if (!ignore) {
        fetchSessionInfo();
      }
    }

    initLoad();
    return () => {
      ignore = true;
    };
  }, [refreshData, fetchSessionInfo]);

  // Health check worker: unauthenticated health check that does NOT slide user session
  const checkHealth = useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (isHealthCheckingRef.current) return;

    isHealthCheckingRef.current = true;
    try {
      const res = await api.health.check();
      const isOnline = Boolean(res && (res.status === 'healthy' || res.status === 'degraded' || res.success));
      setIsBackendConnected(isOnline);
      return isOnline;
    } catch {
      setIsBackendConnected(false);
      return false;
    } finally {
      isHealthCheckingRef.current = false;
    }
  }, []);

  // Background health check & window visibility / network status handlers
  useEffect(() => {
    const onOnline = () => {
      checkHealth();
      refreshData({ showLoading: false });
    };

    const onFocus = () => {
      checkHealth();
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onFocus);

    const interval = setInterval(checkHealth, 25000); // 25-second gentle check

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onFocus);
    };
  }, [checkHealth, refreshData]);

  // Explicit retry connection action for UI error recovery
  const retryConnection = useCallback(async () => {
    setError(null);
    const healthy = await checkHealth();
    await refreshData({ showLoading: transactions.length === 0 });
    return healthy;
  }, [checkHealth, refreshData, transactions.length]);

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

  // Today's spend calculation (matching current day, reference date, or 'Just now')
  const todaySpent = useMemo(() => {
    const todayMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const todayStr = `${todayMonths[now.getMonth()]} ${now.getDate()}`;
    return transactions
      .filter(t => t.date === todayStr || t.date === 'Nov 22' || t.time === 'Just now')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const todayLogsCount = useMemo(() => {
    const todayMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const todayStr = `${todayMonths[now.getMonth()]} ${now.getDate()}`;
    return transactions.filter(t => t.date === todayStr || t.date === 'Nov 22' || t.time === 'Just now').length;
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
  const addExpense = async ({
    amount,
    category,
    description,
    date = 'Nov 22',
    fullDate,
    time = 'Just now',
    user,
    authorizationToken,
  }) => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return { success: false, message: 'Valid positive amount is required' };
    }

    try {
      const res = await api.transactions.create({
        amount: numAmount,
        category: category || 'Food',
        description: description || 'New expense',
        date,
        fullDate,
        time,
        user: user || currentUser?.username || 'abdulshamil',
        isSplit: true,
        authorizationToken,
      });

      if (res.success && res.data) {
        setIsBackendConnected(true);
        setTransactions(prev => {
          const combined = [res.data, ...prev.filter(t => t.id !== res.data.id)];
          return sortTransactionsNewestFirst(deduplicateTransactions(combined));
        });

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
        setIsAddExpenseModalOpen(false);
        return { success: true, data: res.data };
      }
      return {
        success: false,
        requiresAuthorization: res.requiresAuthorization,
        message: res.message || 'Failed to log expense',
      };
    } catch (err) {
      console.error('Failed to add expense:', err);
      setIsBackendConnected(false);
      return {
        success: false,
        requiresAuthorization: err.status === 403,
        message: err.message || 'Network error while adding expense',
      };
    }
  };

  // Authorize expense exceeding ₹7,000 threshold
  const authorizeExpense = async ({ amount, credential, credentialType, user }) => {
    try {
      const res = await api.transactions.authorizeExpense({
        amount: Number(amount),
        credential,
        credentialType,
        user: user || currentUser?.username || 'abdulshamil',
      });
      return res;
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Verification failed. Please check your credentials.',
      };
    }
  };

  // Update category limit via backend API
  const updateCategoryLimit = async (categoryId, newLimit) => {
    return updateCategory(categoryId, { limit: newLimit });
  };

  // Add category via backend API
  const addCategory = async ({ name, limit, color }) => {
    const trimmedName = name ? name.trim() : '';
    if (!trimmedName) return { success: false, message: 'Category name is required' };

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
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'Failed to create category' };
    } catch (err) {
      console.error('Failed to add category:', err);
      setIsBackendConnected(false);
      return { success: false, message: err.message || 'Failed to add category' };
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
        return { success: true, data: res.data };
      }
      return { success: false, message: res.message || 'Failed to update category' };
    } catch (err) {
      console.error('Failed to update category:', err);
      setIsBackendConnected(false);
      return { success: false, message: err.message || 'Failed to update category' };
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
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to delete category' };
    } catch (err) {
      console.error('Failed to delete category:', err);
      setIsBackendConnected(false);
      return { success: false, message: err.message || 'Failed to delete category' };
    }
  };

  // Update monthly limit via backend API
  const setMonthlyLimit = async (newLimit) => {
    const num = Number(newLimit);
    if (isNaN(num) || num <= 0) return { success: false, message: 'Invalid limit amount' };

    try {
      const res = await api.budget.updateMonthlyLimit(num);
      if (res.success) {
        setIsBackendConnected(true);
        setMonthlyLimitState(num);
        return { success: true };
      }
      return { success: false, message: res.message || 'Failed to update limit' };
    } catch (err) {
      console.error('Failed to update monthly limit:', err);
      setIsBackendConnected(false);
      return { success: false, message: err.message || 'Failed to update limit' };
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
        await refreshData({ showLoading: true });
        await fetchSessionInfo();
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

  // Update User Profile (Username & Profile Image)
  const updateProfile = async ({ username: newUsername, avatar, profileImage }) => {
    try {
      const payload = {};
      if (newUsername !== undefined) payload.username = newUsername;
      if (avatar !== undefined) payload.avatar = avatar;
      if (profileImage !== undefined) payload.profileImage = profileImage;
      // If profileImage is provided without avatar, or vice versa, keep them in sync
      if (profileImage && !avatar) payload.avatar = profileImage;
      if (avatar && !profileImage) payload.profileImage = avatar;

      const res = await api.auth.updateProfile(payload);
      if (res.success) {
        if (res.token) {
          localStorage.setItem('shaka_token', res.token);
        }
        if (res.user) {
          setCurrentUser(prev => ({ ...prev, ...res.user }));
        }
        setHouseholdMembers(prev =>
          prev.map(m =>
            m.username === currentUser.username || (newUsername && m.username === newUsername)
              ? {
                  ...m,
                  username: newUsername || m.username,
                  avatar: res.user?.avatar !== undefined ? res.user.avatar : m.avatar,
                  profileImage: res.user?.profileImage !== undefined ? res.user.profileImage : m.profileImage,
                }
              : m
          )
        );
        if (newUsername) {
          setTransactions(prev =>
            prev.map(t =>
              t.user?.toLowerCase() === currentUser.username.toLowerCase()
                ? { ...t, user: newUsername }
                : t
            )
          );
        }
        return { success: true, message: res.message || 'Profile updated successfully', user: res.user };
      }
      return { success: false, message: res.message || 'Failed to update profile' };
    } catch (err) {
      return {
        success: false,
        message: err.data?.message || err.message || 'Error updating profile',
      };
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
    setCurrentScreen(screenName);
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
        updateProfile,
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
        authorizeExpense,
        updateCategoryLimit,
        addCategory,
        updateCategory,
        deleteCategory,
        isLoading,
        isRefreshing,
        isBackendConnected,
        error,
        refreshData,
        checkHealth,
        retryConnection,
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
