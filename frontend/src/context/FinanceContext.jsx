import { createContext, useContext, useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { api, setAuthEventHandlers } from '../services/api';
import { DEFAULT_AVAILABLE_CATEGORIES } from '../data/financeData';
import { pathToScreen, screenToPath, LOCATION_CHANGE_EVENT } from '../router/routerUtils';
import { useToast } from './ToastContext';
import { parseApiError } from '../utils/errorHandler';

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
  // Authentication status states: 'INITIALIZING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'SERVER_UNAVAILABLE'
  const [authStatus, setAuthStatus] = useState(() => {
    if (typeof localStorage !== 'undefined' && !localStorage.getItem('shaka_token') && !localStorage.getItem('shaka_session_id')) {
      return 'UNAUTHENTICATED';
    }
    return 'INITIALIZING';
  });
  const [currentUser, setCurrentUser] = useState(null);

  // HTML5 History API Browser Routing state & synchronization
  const [currentScreen, setCurrentScreenState] = useState(() => {
    if (typeof window !== 'undefined') {
      // Migrate legacy hash if a user visits e.g. /#profile
      if (window.location.hash && window.location.hash.length > 1) {
        const hashPath = window.location.hash.replace(/^#\/?/, '/');
        window.history.replaceState(null, '', hashPath);
        return pathToScreen(hashPath);
      }
      return pathToScreen(window.location.pathname);
    }
    return 'dashboard';
  });

  const setCurrentScreen = useCallback((screenOrPath, options = {}) => {
    const screen = pathToScreen(screenOrPath);
    setCurrentScreenState(screen);

    if (typeof window !== 'undefined') {
      const targetPath = screenToPath(screenOrPath);
      const currentPath = window.location.pathname;

      if (currentPath !== targetPath && !(currentPath === '/' && targetPath === '/dashboard')) {
        if (options.replace) {
          window.history.replaceState(null, '', targetPath);
        } else {
          window.history.pushState(null, '', targetPath);
        }
      }
    }
  }, []);

  // Synchronize state with browser Back/Forward (popstate) and programmatic navigation
  useEffect(() => {
    const onLocationChange = () => {
      const screen = pathToScreen(window.location.pathname);
      setCurrentScreenState(screen);
    };

    window.addEventListener('popstate', onLocationChange);
    window.addEventListener(LOCATION_CHANGE_EVENT, onLocationChange);
    return () => {
      window.removeEventListener('popstate', onLocationChange);
      window.removeEventListener(LOCATION_CHANGE_EVENT, onLocationChange);
    };
  }, []);

  const [viewMode, setViewMode] = useState('page'); // 'page' | 'all' | 'single'
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);

  // Derived authenticated state
  const isLoggedIn = authStatus === 'AUTHENTICATED' && currentUser !== null;

  // Access Code Security & Session Management state
  const [sessionInfo, setSessionInfo] = useState(null);
  const [isAccessCodeEnabled, setIsAccessCodeEnabled] = useState(false);
  const [isAccessCodeModalOpen, setIsAccessCodeModalOpen] = useState(false);
  const [sessionExpiryNotice, setSessionExpiryNotice] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [budgetCategories, setBudgetCategories] = useState([]);
  const [availableCategories, setAvailableCategories] = useState(DEFAULT_AVAILABLE_CATEGORIES);
  const [monthlyLimitState, setMonthlyLimitState] = useState(0);

  const [householdMembers, setHouseholdMembers] = useState([]);
  const [householdBalances, setHouseholdBalances] = useState(null);

  // Admin Two-Admin Password Reset Approval System State
  const [pendingAdminRequests, setPendingAdminRequests] = useState([]);
  const [adminRequestsHistory, setAdminRequestsHistory] = useState([]);
  const [isReviewResetModalOpen, setIsReviewResetModalOpen] = useState(false);
  const [selectedResetRequest, setSelectedResetRequest] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBackendConnected, setIsBackendConnected] = useState(null);
  const [error, setError] = useState(null);
  const [pendingActionIds, setPendingActionIds] = useState(() => new Set());
  const toast = useToast();

  const isActionPending = useCallback((key) => {
    return pendingActionIds.has(key);
  }, [pendingActionIds]);

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

  // Thoroughly purge all stored tokens, credentials, and session state from browser storage
  const clearLocalAuthData = useCallback(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('shaka_token');
      localStorage.removeItem('shaka_refresh_token');
      localStorage.removeItem('shaka_session_id');
      localStorage.removeItem('shaka_session_expires_at');
      // Clean up all other shaka session keys except the theme preference
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('shaka_') && key !== 'shaka_theme') {
          localStorage.removeItem(key);
        }
      }
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    if (typeof document !== 'undefined') {
      document.cookie = 'refreshToken=; Max-Age=0; path=/; SameSite=Lax';
    }
  }, []);

  // Listen for Token Expiration & Session Inactivity Expiration
  useEffect(() => {
    setAuthEventHandlers({
      onRequiresAccessCode: () => {
        setIsAccessCodeModalOpen(true);
      },
      onSessionExpired: (msg) => {
        clearLocalAuthData();
        setCurrentUser(null);
        setSessionInfo(null);
        setTransactions([]);
        setBudgetCategories([]);
        setHouseholdMembers([]);
        setHouseholdBalances(null);
        setAuthStatus('UNAUTHENTICATED');
        setSessionExpiryNotice(msg || 'Session expired. Please log in again.');
        setCurrentScreen('login');
      },
    });
  }, [setCurrentScreen, clearLocalAuthData]);

  // Optimized data fetch with in-flight request deduplication & background preservation
  const refreshData = useCallback(async (options = {}) => {
    if (isFetchingRef.current) return;
    const token = localStorage.getItem('shaka_token');
    if (!token) return;

    isFetchingRef.current = true;
    const showSkeleton = options.showLoading ?? false;
    const isFullSync = options.full ?? false;
    if (showSkeleton) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const coreRequests = [
        api.transactions.getAll(),
        api.budget.getCategories(),
        api.budget.getMonthlyLimit(),
      ];
      if (isFullSync) {
        coreRequests.push(
          api.budget.getAvailableCategories(),
          api.household.getMembers(),
          api.household.getBalances()
        );
      }

      const results = await Promise.allSettled(coreRequests);
      const [txRes, catRes, limitRes, availRes, membersRes, balancesRes] = results;

      const anySuccess = results.some(
        r => r.status === 'fulfilled' && r.value?.success
      );

      if (anySuccess) {
        setIsBackendConnected(true);
      }

      if (txRes?.status === 'fulfilled' && txRes.value?.success) {
        setTransactions(sortTransactionsNewestFirst(deduplicateTransactions(txRes.value.data || [])));
      }

      if (catRes?.status === 'fulfilled' && catRes.value?.success) {
        setBudgetCategories(catRes.value.data || []);
      }

      if (limitRes?.status === 'fulfilled' && limitRes.value?.success) {
        setMonthlyLimitState(limitRes.value.monthlyLimit || 0);
      }

      if (availRes?.status === 'fulfilled' && availRes.value?.success && availRes.value.data?.length) {
        setAvailableCategories(availRes.value.data);
      }

      if (membersRes?.status === 'fulfilled' && membersRes.value?.success && membersRes.value.data?.length) {
        setHouseholdMembers(membersRes.value.data);
      }

      if (balancesRes?.status === 'fulfilled' && balancesRes.value?.success) {
        setHouseholdBalances(balancesRes.value.data || null);
      }
    } catch {
      setIsBackendConnected(false);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Secure Backend Authentication Initialization
  const initializeAuth = useCallback(async () => {
    const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('shaka_token') : null;
    const storedSessionId = typeof localStorage !== 'undefined' ? localStorage.getItem('shaka_session_id') : null;

    if (!storedToken && !storedSessionId) {
      setAuthStatus('UNAUTHENTICATED');
      setCurrentUser(null);
      setTransactions([]);
      setBudgetCategories([]);
      setHouseholdMembers([]);
      setHouseholdBalances(null);
      setSessionInfo(null);
      return;
    }

    try {
      const res = await api.auth.getMe();
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        setIsAccessCodeEnabled(Boolean(res.user.accessCodeEnabled));
        setAuthStatus('AUTHENTICATED');
        setIsBackendConnected(true);
        await refreshData({ showLoading: false });
        await fetchSessionInfo();
      } else {
        localStorage.removeItem('shaka_token');
        localStorage.removeItem('shaka_refresh_token');
        localStorage.removeItem('shaka_session_id');
        localStorage.removeItem('shaka_session_expires_at');
        setCurrentUser(null);
        setAuthStatus('UNAUTHENTICATED');
      }
    } catch (err) {
      if (err.status === 401 || err.errorCode === 'UNAUTHORIZED') {
        localStorage.removeItem('shaka_token');
        localStorage.removeItem('shaka_refresh_token');
        localStorage.removeItem('shaka_session_id');
        localStorage.removeItem('shaka_session_expires_at');
        setCurrentUser(null);
        setAuthStatus('UNAUTHENTICATED');
      } else {
        // Backend server is unreachable or stopped
        setIsBackendConnected(false);
        setAuthStatus('SERVER_UNAVAILABLE');
        setError(err.message || 'Cannot connect to SHAKA secure backend server.');
      }
    }
  }, [refreshData, fetchSessionInfo]);

  // Initial session verification on mount
  useEffect(() => {
    let isSubscribed = true;
    const hasCredentials = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem('shaka_token') || localStorage.getItem('shaka_session_id'));
    if (!hasCredentials) return;

    api.auth.getMe().then(res => {
      if (!isSubscribed) return;
      if (res && res.success && res.user) {
        setCurrentUser(res.user);
        setIsAccessCodeEnabled(Boolean(res.user.accessCodeEnabled));
        setAuthStatus('AUTHENTICATED');
        setIsBackendConnected(true);
        refreshData({ showLoading: false, full: true });
        fetchSessionInfo();
      } else {
        localStorage.removeItem('shaka_token');
        localStorage.removeItem('shaka_refresh_token');
        localStorage.removeItem('shaka_session_id');
        localStorage.removeItem('shaka_session_expires_at');
        setCurrentUser(null);
        setAuthStatus('UNAUTHENTICATED');
      }
    }).catch(err => {
      if (!isSubscribed) return;
      if (err.status === 401 || err.errorCode === 'UNAUTHORIZED') {
        localStorage.removeItem('shaka_token');
        localStorage.removeItem('shaka_refresh_token');
        localStorage.removeItem('shaka_session_id');
        localStorage.removeItem('shaka_session_expires_at');
        setCurrentUser(null);
        setAuthStatus('UNAUTHENTICATED');
      } else {
        setIsBackendConnected(false);
        setAuthStatus('SERVER_UNAVAILABLE');
        setError(err.message || 'Cannot connect to SHAKA secure backend server.');
      }
    });

    return () => {
      isSubscribed = false;
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

  // Background health check & shared ledger real-time automatic synchronization
  useEffect(() => {
    const onOnline = () => {
      checkHealth();
      refreshData({ showLoading: false, full: false });
    };

    const onFocus = () => {
      checkHealth();
      if (isLoggedIn) {
        refreshData({ showLoading: false, full: false });
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isLoggedIn) {
        refreshData({ showLoading: false, full: false });
      }
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Active ledger synchronization polling every 25 seconds when tab is visible
    const pollInterval = isLoggedIn
      ? setInterval(() => {
          if (document.visibilityState === 'visible') {
            refreshData({ showLoading: false, full: false });
          }
        }, 25000)
      : null;

    const healthInterval = setInterval(checkHealth, 30000);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(healthInterval);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [checkHealth, refreshData, isLoggedIn]);

  // Fetch pending admin password reset requests awaiting approval
  const fetchPendingAdminRequests = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'Admin') {
      setPendingAdminRequests([]);
      return;
    }
    try {
      const res = await api.admin.getPendingRequests();
      if (res?.success) {
        setPendingAdminRequests(res.requests || []);
        if (res.history) {
          setAdminRequestsHistory(res.history);
        }
      }
    } catch {
      // Background polling failure suppressed
    }
  }, [currentUser]);

  const approveAdminResetRequest = useCallback(async (requestId) => {
    try {
      const res = await api.admin.approveRequest(requestId);
      if (res?.success) {
        setPendingAdminRequests(prev => prev.filter(r => r.id !== requestId && r._id !== requestId));
        await fetchPendingAdminRequests();
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to approve request' };
    }
  }, [fetchPendingAdminRequests]);

  const rejectAdminResetRequest = useCallback(async (requestId) => {
    try {
      const res = await api.admin.rejectRequest(requestId);
      if (res?.success) {
        setPendingAdminRequests(prev => prev.filter(r => r.id !== requestId && r._id !== requestId));
        await fetchPendingAdminRequests();
      }
      return res;
    } catch (err) {
      return { success: false, message: err.message || 'Failed to reject request' };
    }
  }, [fetchPendingAdminRequests]);

  // Synchronize admin password reset notification badge
  useEffect(() => {
    if (!isLoggedIn || currentUser?.role !== 'Admin') return;
    const checkRequests = () => {
      if (document.visibilityState === 'visible') {
        fetchPendingAdminRequests();
      }
    };
    checkRequests();
    const interval = setInterval(checkRequests, 20000);
    return () => clearInterval(interval);
  }, [isLoggedIn, currentUser?.role, fetchPendingAdminRequests]);

  // Explicit retry connection action for UI error recovery
  const retryConnection = useCallback(async () => {
    setError(null);
    const healthy = await checkHealth();
    await initializeAuth();
    return healthy;
  }, [checkHealth, initializeAuth]);

  // Dynamic Month & Days remaining calculation
  const dateMetrics = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthName = now.toLocaleString('en-US', { month: 'long' });
    const shortMonth = now.toLocaleString('en-US', { month: 'short' });
    const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysPassed = Math.max(1, currentDay);
    const daysRemaining = Math.max(0, totalDaysInMonth - currentDay);
    return {
      currentYear,
      currentMonth,
      currentDay,
      monthName,
      shortMonth,
      totalDaysInMonth,
      daysPassed,
      daysRemaining,
    };
  }, []);

  const {
    currentYear,
    currentDay,
    monthName,
    shortMonth,
    totalDaysInMonth,
    daysPassed,
    daysRemaining,
  } = dateMetrics;

  // Derived shared financial metrics computed from the complete shared ledger
  const totalIncome = useMemo(() => {
    return transactions
      .filter(t => t.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [transactions]);

  // Derive total monthly budget limit as the combined total of all individual category spend limits
  const monthlyLimit = useMemo(() => {
    if (budgetCategories && budgetCategories.length > 0) {
      return budgetCategories.reduce((sum, cat) => sum + Number(cat.limit || 0), 0);
    }
    return monthlyLimitState || 0;
  }, [budgetCategories, monthlyLimitState]);

  const totalExpense = useMemo(() => {
    return transactions
      .filter(t => t.type !== 'income')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [transactions]);

  // Total spent across the shared ledger.
  // The spend limit is all category spend limits together, and total spent reflects all category spending combined
  const totalSpent = useMemo(() => {
    const categorySpentSum = budgetCategories.reduce(
      (sum, cat) => sum + Number(cat.spent || 0),
      0
    );
    if (categorySpentSum > 0 && totalExpense === 0) {
      return categorySpentSum;
    }
    return totalExpense > 0 ? totalExpense : categorySpentSum;
  }, [totalExpense, budgetCategories]);

  const balance = useMemo(() => {
    return totalIncome - totalExpense;
  }, [totalIncome, totalExpense]);

  const remainingLimit = useMemo(() => {
    return Math.max(0, monthlyLimit - totalSpent);
  }, [monthlyLimit, totalSpent]);

  const percentSpent = useMemo(() => {
    if (!monthlyLimit || monthlyLimit <= 0) return 0;
    return Number(((totalSpent / monthlyLimit) * 100).toFixed(1));
  }, [totalSpent, monthlyLimit]);

  // Today's spend calculation (matching current day, dynamic date format, or 'Just now')
  const todaySpent = useMemo(() => {
    const todayMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthStr = todayMonths[now.getMonth()];
    const day = now.getDate();
    const dayPadded = String(day).padStart(2, '0');
    return transactions
      .filter(t => {
        if (t.type === 'income') return false;
        if (t.time === 'Just now') return true;
        const d = (t.date || '').toLowerCase();
        return (
          d.includes(`${monthStr.toLowerCase()} ${day}`) ||
          d.includes(`${monthStr.toLowerCase()} ${dayPadded}`) ||
          d.includes(`${day} ${monthStr.toLowerCase()}`) ||
          d.includes(`${dayPadded} ${monthStr.toLowerCase()}`)
        );
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const todayLogsCount = useMemo(() => {
    const todayMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthStr = todayMonths[now.getMonth()];
    const day = now.getDate();
    const dayPadded = String(day).padStart(2, '0');
    return transactions.filter(t => {
      if (t.type === 'income') return false;
      if (t.time === 'Just now') return true;
      const d = (t.date || '').toLowerCase();
      return (
        d.includes(`${monthStr.toLowerCase()} ${day}`) ||
        d.includes(`${monthStr.toLowerCase()} ${dayPadded}`) ||
        d.includes(`${day} ${monthStr.toLowerCase()}`) ||
        d.includes(`${dayPadded} ${monthStr.toLowerCase()}`)
      );
    }).length;
  }, [transactions]);

  // Category breakdown for charts and budget calculations
  const categoryTotals = useMemo(() => {
    const totals = {};
    transactions
      .filter(t => t.type !== 'income')
      .forEach(t => {
        if (t.category) {
          totals[t.category] = (totals[t.category] || 0) + Number(t.amount || 0);
        }
      });
    return totals;
  }, [transactions]);

  // Add Expense to shared backend ledger with Optimistic UI & Automatic Rollback
  const addExpense = async ({
    amount,
    category,
    description,
    date,
    fullDate,
    time = 'Just now',
    type = 'expense',
    authorizationToken,
  }) => {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Valid positive amount is required');
      return { success: false, message: 'Valid positive amount is required' };
    }

    const lockKey = 'tx-add';
    if (pendingActionIds.has(lockKey)) {
      return { success: false, message: 'Transaction submission already in progress' };
    }
    setPendingActionIds(prev => new Set(prev).add(lockKey));

    const defaultDate = `${shortMonth} ${String(currentDay).padStart(2, '0')}`;
    const defaultFullDate = `${shortMonth} ${String(currentDay).padStart(2, '0')}, ${currentYear}`;
    const txCategory = category || 'Food';
    const catColor = budgetCategories.find(c => c.name.toLowerCase() === txCategory.toLowerCase())?.color || '#c9b27c';

    const tempId = `temp-tx-${Date.now()}`;
    const optimisticTx = {
      id: tempId,
      amount: numAmount,
      category: txCategory,
      categoryColor: catColor,
      description: description || 'New expense',
      date: date || defaultDate,
      fullDate: fullDate || defaultFullDate,
      time: time || 'Just now',
      type: type || 'expense',
      isSplit: true,
      isOptimistic: true,
      createdAt: new Date().toISOString(),
    };

    // 1. Optimistic UI update: Immediately insert transaction at top
    setTransactions(prev => [optimisticTx, ...prev]);
    setIsAddExpenseModalOpen(false);

    try {
      const res = await api.transactions.create({
        amount: numAmount,
        category: txCategory,
        description: description || 'New expense',
        date: date || defaultDate,
        fullDate: fullDate || defaultFullDate,
        time,
        type: type || 'expense',
        isSplit: true,
        authorizationToken,
      });

      if (res.success && res.data) {
        setIsBackendConnected(true);
        // Replace optimistic placeholder with real confirmed transaction
        setTransactions(prev =>
          sortTransactionsNewestFirst(
            deduplicateTransactions(
              prev.map(t => (t.id === tempId ? res.data : t))
            )
          )
        );
        toast.success(`Expense of ₹${numAmount.toLocaleString('en-IN')} recorded`);
        return { success: true, data: res.data };
      }

      throw new Error(res.message || 'Failed to log expense');
    } catch (err) {
      // 2. Automatic Rollback: Remove the optimistic transaction
      setTransactions(prev => prev.filter(t => t.id !== tempId));
      setIsBackendConnected(false);

      const parsed = parseApiError(err, 'Failed to log expense');
      toast.error(parsed.message);
      return {
        success: false,
        requiresAuthorization: err.status === 403,
        message: parsed.message,
      };
    } finally {
      setPendingActionIds(prev => {
        const next = new Set(prev);
        next.delete(lockKey);
        return next;
      });
    }
  };

  // Update existing shared transaction with Optimistic UI & Automatic Rollback
  const updateExpense = async (id, updates) => {
    const lockKey = `tx-update-${id}`;
    if (pendingActionIds.has(lockKey)) return { success: false, message: 'Update already in progress' };

    const txIndex = transactions.findIndex(t => t.id === id);
    if (txIndex === -1) return { success: false, message: 'Transaction not found' };
    const previousTx = transactions[txIndex];

    setPendingActionIds(prev => new Set(prev).add(lockKey));

    // Optimistic Update
    setTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, ...updates } : t))
    );

    try {
      const res = await api.transactions.update(id, updates);
      if (res.success && res.data) {
        setTransactions(prev =>
          sortTransactionsNewestFirst(
            prev.map(t => (t.id === id ? { ...t, ...res.data } : t))
          )
        );
        toast.success('Transaction updated');
        return { success: true, data: res.data };
      }
      throw new Error(res.message || 'Failed to update transaction');
    } catch (err) {
      // Rollback to snapshot
      setTransactions(prev =>
        prev.map(t => (t.id === id ? previousTx : t))
      );
      const parsed = parseApiError(err, 'Failed to update transaction');
      toast.error(parsed.message);
      return { success: false, message: parsed.message };
    } finally {
      setPendingActionIds(prev => {
        const next = new Set(prev);
        next.delete(lockKey);
        return next;
      });
    }
  };

  // Delete shared transaction from ledger with Optimistic UI & Automatic Rollback
  const deleteExpense = async (id) => {
    const lockKey = `tx-del-${id}`;
    if (pendingActionIds.has(lockKey)) return { success: false, message: 'Deletion already in progress' };

    const txIndex = transactions.findIndex(t => t.id === id);
    if (txIndex === -1) return { success: false, message: 'Transaction not found' };
    const previousTx = transactions[txIndex];

    setPendingActionIds(prev => new Set(prev).add(lockKey));

    // Optimistically remove
    setTransactions(prev => prev.filter(t => t.id !== id));

    try {
      const res = await api.transactions.delete(id);
      if (res.success) {
        toast.success('Transaction deleted');
        return { success: true };
      }
      throw new Error(res.message || 'Failed to delete transaction');
    } catch (err) {
      // Rollback: restore transaction at original index
      setTransactions(prev => {
        if (prev.some(t => t.id === id)) return prev;
        const restored = [...prev];
        restored.splice(txIndex, 0, previousTx);
        return restored;
      });
      const parsed = parseApiError(err, 'Failed to delete transaction');
      toast.error(parsed.message);
      return { success: false, message: parsed.message };
    } finally {
      setPendingActionIds(prev => {
        const next = new Set(prev);
        next.delete(lockKey);
        return next;
      });
    }
  };

  // Authorize expense exceeding ₹7,000 threshold
  const authorizeExpense = async ({ amount, credential, credentialType }) => {
    try {
      const res = await api.transactions.authorizeExpense({
        amount: Number(amount),
        credential,
        credentialType,
      });
      return res;
    } catch (err) {
      const parsed = parseApiError(err, 'Verification failed. Please check your credentials.');
      return {
        success: false,
        message: parsed.message,
      };
    }
  };

  // Update category limit via backend API
  const updateCategoryLimit = async (categoryId, newLimit) => {
    return updateCategory(categoryId, { limit: newLimit });
  };

  // Add category via backend API with Optimistic UI & Automatic Rollback
  const addCategory = async ({ name, limit, color }) => {
    const trimmedName = name ? name.trim() : '';
    if (!trimmedName) {
      toast.error('Category name is required');
      return { success: false, message: 'Category name is required' };
    }

    const lockKey = 'cat-add';
    if (pendingActionIds.has(lockKey)) return { success: false, message: 'Action already in progress' };

    // Client-side duplicate check
    if (budgetCategories.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
      const msg = `Category "${trimmedName}" already exists.`;
      toast.error(msg);
      return { success: false, message: msg };
    }

    setPendingActionIds(prev => new Set(prev).add(lockKey));

    const tempId = `temp-cat-${Date.now()}`;
    const optimisticCategory = {
      id: tempId,
      name: trimmedName,
      category: trimmedName,
      limit: Number(limit) || 5000,
      color: color || '#c9b27c',
      spent: 0,
      status: 'Healthy',
      isOptimistic: true,
    };

    // 1. Optimistic UI update
    setBudgetCategories(prev => [...prev, optimisticCategory]);
    setAvailableCategories(prev => {
      if (prev.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) return prev;
      return [...prev, { name: trimmedName, color: color || '#c9b27c' }];
    });

    try {
      const res = await api.budget.addCategory({
        name: trimmedName,
        limit: Number(limit) || 5000,
        color: color || '#c9b27c',
      });

      if (res.success && res.data) {
        setIsBackendConnected(true);
        // Reconcile optimistic item with confirmed backend item
        setBudgetCategories(prev =>
          prev.map(c => (c.id === tempId ? res.data : c))
        );
        toast.success(`Category "${trimmedName}" created`);
        return { success: true, data: res.data };
      }
      throw new Error(res.message || 'Failed to create category');
    } catch (err) {
      // 2. Automatic Rollback: remove optimistic item
      setBudgetCategories(prev => prev.filter(c => c.id !== tempId));
      setAvailableCategories(prev => prev.filter(c => c.name.toLowerCase() !== trimmedName.toLowerCase()));
      setIsBackendConnected(false);

      const parsed = parseApiError(err, 'Failed to create category');
      toast.error(parsed.message);
      return { success: false, message: parsed.message };
    } finally {
      setPendingActionIds(prev => {
        const next = new Set(prev);
        next.delete(lockKey);
        return next;
      });
    }
  };

  // Update category via backend API with Optimistic UI & Automatic Rollback
  const updateCategory = async (categoryId, { name, limit, color }) => {
    const lockKey = `cat-update-${categoryId}`;
    if (pendingActionIds.has(lockKey)) return { success: false, message: 'Update already in progress' };

    const previousCategory = budgetCategories.find(c => c.id === categoryId);
    if (!previousCategory) return { success: false, message: 'Category not found' };

    setPendingActionIds(prev => new Set(prev).add(lockKey));

    // 1. Optimistic UI update
    setBudgetCategories(prev =>
      prev.map(cat => {
        if (cat.id !== categoryId) return cat;
        const newLimit = limit !== undefined ? Number(limit) : cat.limit;
        const newSpent = cat.spent || 0;
        const percent = newLimit > 0 ? (newSpent / newLimit) * 100 : 0;
        const status = percent > 100 ? 'Exceeded' : percent >= 80 ? 'Warning' : 'Healthy';
        return {
          ...cat,
          name: name !== undefined ? name : cat.name,
          category: name !== undefined ? name : cat.category,
          limit: newLimit,
          color: color || cat.color,
          status,
        };
      })
    );

    try {
      const res = await api.budget.updateCategory(categoryId, { name, limit, color });
      if (res.success && res.data) {
        setIsBackendConnected(true);
        setBudgetCategories(prev =>
          prev.map(cat => (cat.id === categoryId ? res.data : cat))
        );
        toast.success(`Category "${res.data.name || previousCategory.name}" updated`);
        return { success: true, data: res.data };
      }
      throw new Error(res.message || 'Failed to update category');
    } catch (err) {
      // 2. Automatic Rollback: restore previous category snapshot
      setBudgetCategories(prev =>
        prev.map(cat => (cat.id === categoryId ? previousCategory : cat))
      );
      setIsBackendConnected(false);

      const parsed = parseApiError(err, 'Failed to update category');
      toast.error(parsed.message);
      return { success: false, message: parsed.message };
    } finally {
      setPendingActionIds(prev => {
        const next = new Set(prev);
        next.delete(lockKey);
        return next;
      });
    }
  };

  // Delete category via backend API with Optimistic UI & Automatic Rollback
  const deleteCategory = async (categoryId) => {
    const lockKey = `cat-del-${categoryId}`;
    if (pendingActionIds.has(lockKey)) return { success: false, message: 'Deletion already in progress' };

    const catIndex = budgetCategories.findIndex(c => c.id === categoryId);
    if (catIndex === -1) return { success: false, message: 'Category not found' };
    const previousCategory = budgetCategories[catIndex];
    const previousAvailable = [...availableCategories];

    setPendingActionIds(prev => new Set(prev).add(lockKey));

    // 1. Optimistic UI update: Immediately remove from UI
    setBudgetCategories(prev => prev.filter(cat => cat.id !== categoryId));
    setAvailableCategories(prev =>
      prev.filter(c => c.name.toLowerCase() !== previousCategory.name.toLowerCase())
    );

    try {
      const res = await api.budget.deleteCategory(categoryId);
      if (res.success) {
        setIsBackendConnected(true);
        toast.success(`Category "${previousCategory.name}" deleted`);
        return { success: true };
      }
      throw new Error(res.message || 'Failed to delete category');
    } catch (err) {
      // 2. Automatic Rollback: Restore category at original index
      setBudgetCategories(prev => {
        if (prev.some(c => c.id === categoryId)) return prev;
        const restored = [...prev];
        restored.splice(catIndex, 0, previousCategory);
        return restored;
      });
      setAvailableCategories(previousAvailable);
      setIsBackendConnected(false);

      const parsed = parseApiError(err, 'Failed to delete category');
      toast.error(parsed.message);
      return { success: false, message: parsed.message };
    } finally {
      setPendingActionIds(prev => {
        const next = new Set(prev);
        next.delete(lockKey);
        return next;
      });
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
        setAuthStatus('AUTHENTICATED');
        setCurrentScreen('dashboard');
        await refreshData({ showLoading: true });
        await fetchSessionInfo();
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err) {
      if (err.status !== 401) {
        setIsBackendConnected(false);
      }
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  // User signup / registration via backend API
  const signup = async ({ username, email, password }) => {
    try {
      const res = await api.auth.signup({ username, email, password });
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
          setIsAccessCodeEnabled(false);
        }
        setSessionExpiryNotice(null);
        setAuthStatus('AUTHENTICATED');
        setCurrentScreen('dashboard');
        await refreshData({ showLoading: true });
        return { success: true };
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  // User logout and session revocation
  const logout = useCallback(async () => {
    const sessionId = typeof localStorage !== 'undefined' ? localStorage.getItem('shaka_session_id') : null;
    const userToLogout = currentUser?.username;

    // 1. Immediately wipe all local credentials, tokens, and session ID upfront
    // This ensures that even if the backend is down or unreachable, the frontend
    // NEVER retains the session, session ID, or credentials.
    clearLocalAuthData();
    setCurrentUser(null);
    setSessionInfo(null);
    setTransactions([]);
    setBudgetCategories([]);
    setHouseholdMembers([]);
    setHouseholdBalances(null);
    setPendingAdminRequests([]);
    setAdminRequestsHistory([]);
    setAuthStatus('UNAUTHENTICATED');
    setCurrentScreen('login');
    setError(null);
    setSessionExpiryNotice(null);

    // 2. Best-effort server session revocation (non-blocking if server is offline)
    if (sessionId) {
      try {
        await api.auth.logout({ sessionId, username: userToLogout });
      } catch {
        // Server unreachable or connection error: local session is already wiped clean
      }
    }
  }, [currentUser?.username, setCurrentScreen, clearLocalAuthData]);

  const setIsLoggedIn = useCallback((val) => {
    if (!val) {
      logout();
    }
  }, [logout]);

  // Update User Profile (Username & Profile Image) with Optimistic UI & Automatic Rollback
  const updateProfile = async ({ username: newUsername, avatar, profileImage }) => {
    const previousUser = currentUser ? { ...currentUser } : null;
    const lockKey = 'profile-update';
    if (pendingActionIds.has(lockKey)) return { success: false, message: 'Profile update in progress' };

    setPendingActionIds(prev => new Set(prev).add(lockKey));

    const payload = {};
    if (newUsername !== undefined) payload.username = newUsername;
    if (avatar !== undefined) payload.avatar = avatar;
    if (profileImage !== undefined) payload.profileImage = profileImage;
    // If profileImage is provided without avatar, or vice versa, keep them in sync
    if (profileImage && !avatar) payload.avatar = profileImage;
    if (avatar && !profileImage) payload.profileImage = avatar;

    // 1. Optimistic UI update
    setCurrentUser(prev => ({
      ...prev,
      ...payload,
    }));

    try {
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
            m.username === currentUser?.username || (newUsername && m.username === newUsername)
              ? {
                  ...m,
                  username: newUsername || m.username,
                  avatar: res.user?.avatar !== undefined ? res.user.avatar : m.avatar,
                  profileImage: res.user?.profileImage !== undefined ? res.user.profileImage : m.profileImage,
                }
              : m
          )
        );
        toast.success(res.message || 'Profile updated successfully');
        return { success: true, message: res.message || 'Profile updated successfully', user: res.user };
      }
      throw new Error(res.message || 'Failed to update profile');
    } catch (err) {
      // 2. Rollback to snapshot
      if (previousUser) {
        setCurrentUser(previousUser);
      }
      const parsed = parseApiError(err, 'Error updating profile');
      toast.error(parsed.message);
      return {
        success: false,
        message: parsed.message,
      };
    } finally {
      setPendingActionIds(prev => {
        const next = new Set(prev);
        next.delete(lockKey);
        return next;
      });
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

  const navigateTo = (screenName, options = {}) => {
    setCurrentScreen(screenName, options);
  };

  return (
    <FinanceContext.Provider
      value={{
        authStatus,
        setAuthStatus,
        initializeAuth,
        clearLocalAuthData,
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
        signup,
        logout,
        updateProfile,
        transactions,
        budgetCategories,
        availableCategories,
        monthlyLimit,
        setMonthlyLimit,
        householdMembers,
        householdBalances,
        totalIncome,
        totalExpense,
        totalSpent,
        balance,
        remainingLimit,
        percentSpent,
        todaySpent,
        todayLogsCount,
        categoryTotals,
        daysRemaining,
        daysPassed,
        totalDaysInMonth,
        monthName,
        shortMonth,
        currentDay,
        currentYear,
        addExpense,
        updateExpense,
        deleteExpense,
        authorizeExpense,
        updateCategoryLimit,
        addCategory,
        updateCategory,
        deleteCategory,
        isLoading,
        isRefreshing,
        isBackendConnected,
        isActionPending,
        error,
        refreshData,
        checkHealth,
        retryConnection,
        pendingAdminRequests,
        pendingAdminRequestsCount: pendingAdminRequests.length,
        adminRequestsHistory,
        isReviewResetModalOpen,
        setIsReviewResetModalOpen,
        selectedResetRequest,
        setSelectedResetRequest,
        fetchPendingAdminRequests,
        approveAdminResetRequest,
        rejectAdminResetRequest,
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
