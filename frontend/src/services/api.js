/**
 * SHAKA Centralized API Service
 * Robust, resilient API client with:
 * - Single-flight refresh token queue (prevents duplicate refresh races and token invalidation)
 * - Automatic request timeout (12s) with AbortController
 * - Network failure detection & transparent IPv4 localhost fallback
 * - Standardized error handling and session management hooks
 */

let currentBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api';

// Authentication & Reauthentication event hooks
let onRequiresAccessCodeCallback = null;
let onSessionExpiredCallback = null;

export const setAuthEventHandlers = ({ onRequiresAccessCode, onSessionExpired }) => {
  onRequiresAccessCodeCallback = onRequiresAccessCode;
  onSessionExpiredCallback = onSessionExpired;
};

// Single-flight refresh token queue
let isRefreshing = false;
let refreshQueue = [];

function subscribeTokenRefresh(cb) {
  refreshQueue.push(cb);
}

function onRefreshed(error, newToken) {
  refreshQueue.forEach(cb => cb(error, newToken));
  refreshQueue = [];
}

/**
 * Core centralized request dispatcher
 * @param {string} endpoint - API path relative to currentBaseUrl
 * @param {object} options - Fetch options (method, headers, body, timeout, isPublic, signal)
 * @param {boolean} isRetry - Whether this is an automatic retry attempt
 */
export async function request(endpoint, options = {}, isRetry = false) {
  const isPublic = Boolean(options.isPublic);
  const token = !isPublic ? localStorage.getItem('shaka_token') : null;
  const sessionId = !isPublic ? localStorage.getItem('shaka_session_id') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(sessionId ? { 'X-Session-Id': sessionId } : {}),
    ...options.headers,
  };

  const timeoutMs = options.timeout || 12000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error('REQUEST_TIMEOUT'));
  }, timeoutMs);

  if (options.signal) {
    options.signal.addEventListener('abort', () => controller.abort(options.signal.reason));
  }

  const fetchOptions = { ...options };
  delete fetchOptions.isPublic;
  delete fetchOptions.timeout;
  delete fetchOptions.signal;
  const config = {
    ...fetchOptions,
    headers,
    signal: controller.signal,
  };

  try {
    const response = await fetch(`${currentBaseUrl}${endpoint}`, config);
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // 1. Session expired (3-day inactivity or session revoked) -> Force logout
      if (response.status === 401 && (data.sessionExpired || data.sessionRevoked)) {
        if (onSessionExpiredCallback) {
          onSessionExpiredCallback(data.message || 'Session expired. Please log in again.');
        }
      }

      // 2. Access token expired but session valid -> Queue-based Single-Flight Refresh
      if (
        response.status === 401 &&
        data.tokenExpired &&
        !isRetry &&
        endpoint !== '/auth/login' &&
        endpoint !== '/auth/refresh'
      ) {
        const storedRefresh = localStorage.getItem('shaka_refresh_token');
        const storedSessionId = localStorage.getItem('shaka_session_id');

        if (storedRefresh && storedSessionId) {
          // If another request is already refreshing, join the single-flight queue
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              subscribeTokenRefresh((refreshErr, newToken) => {
                if (refreshErr) {
                  reject(refreshErr);
                } else {
                  const retryOptions = {
                    ...options,
                    headers: {
                      ...options.headers,
                      Authorization: `Bearer ${newToken}`,
                    },
                  };
                  resolve(request(endpoint, retryOptions, true));
                }
              });
            });
          }

          // This request is the primary leader for token refresh
          isRefreshing = true;

          try {
            const refreshRes = await fetch(`${currentBaseUrl}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: storedRefresh, sessionId: storedSessionId }),
            });
            const refreshData = await refreshRes.json().catch(() => ({}));

            if (refreshRes.ok && refreshData.success && refreshData.token) {
              localStorage.setItem('shaka_token', refreshData.token);
              if (refreshData.refreshToken) {
                localStorage.setItem('shaka_refresh_token', refreshData.refreshToken);
              }
              isRefreshing = false;
              onRefreshed(null, refreshData.token);

              // Retry original request
              const retryOptions = {
                ...options,
                headers: {
                  ...options.headers,
                  Authorization: `Bearer ${refreshData.token}`,
                },
              };
              return request(endpoint, retryOptions, true);
            } else if (refreshData.requiresAccessCode) {
              isRefreshing = false;
              const accessErr = new Error('Access code authentication required');
              accessErr.requiresAccessCode = true;
              accessErr.sessionId = storedSessionId;
              onRefreshed(accessErr, null);

              if (onRequiresAccessCodeCallback) {
                onRequiresAccessCodeCallback(storedSessionId);
              }
              throw accessErr;
            } else {
              isRefreshing = false;
              const expireErr = new Error(refreshData.message || 'Session expired. Please log in again.');
              expireErr.sessionExpired = true;
              onRefreshed(expireErr, null);

              if (onSessionExpiredCallback) {
                onSessionExpiredCallback(expireErr.message);
              }
              throw expireErr;
            }
          } catch (refreshError) {
            isRefreshing = false;
            onRefreshed(refreshError, null);
            throw refreshError;
          }
        }
      }

      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.errorCode = data.errorCode || (response.status === 401 ? 'UNAUTHORIZED' : 'API_ERROR');
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);

    // Timeout detection
    if (err.name === 'AbortError' || err.message === 'REQUEST_TIMEOUT') {
      const timeoutError = new Error('Request timeout: The server took too long to respond.');
      timeoutError.status = 408;
      timeoutError.errorCode = 'REQUEST_TIMEOUT';
      timeoutError.isTimeout = true;
      throw timeoutError;
    }

    // Network connection failure detection and IPv4 fallback for Windows
    if (currentBaseUrl.includes('localhost:5000') && !isRetry) {
      try {
        const altUrl = currentBaseUrl.replace('localhost:5000', '127.0.0.1:5000');
        const altResponse = await fetch(`${altUrl}${endpoint}`, config);
        const altData = await altResponse.json().catch(() => ({}));
        if (altResponse.ok) {
          currentBaseUrl = altUrl; // Successfully locked in IPv4 loopback
          return altData;
        }
      } catch {
        // Fall back to original network error
      }
    }

    err.isNetworkError = err.message === 'Failed to fetch' || err.code === 'ECONNREFUSED';
    console.error(`API Error on [${config.method || 'GET'} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Health Check (Public, non-session-extending)
  health: {
    check: () => request('/health', { isPublic: true, timeout: 5000 }),
  },

  // Authentication & Session Management
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        isPublic: true,
        body: JSON.stringify(credentials),
      }),
    refresh: (data) =>
      request('/auth/refresh', {
        method: 'POST',
        isPublic: true,
        body: JSON.stringify(data),
      }),
    verifyAccessCode: ({ accessCode, sessionId }) =>
      request('/auth/verify-access-code', {
        method: 'POST',
        isPublic: true,
        body: JSON.stringify({ accessCode, sessionId }),
      }),
    enableAccessCode: ({ accessCode }) =>
      request('/auth/access-code/enable', {
        method: 'POST',
        body: JSON.stringify({ accessCode }),
      }),
    changeAccessCode: ({ currentAccessCode, newAccessCode }) =>
      request('/auth/access-code/change', {
        method: 'POST',
        body: JSON.stringify({ currentAccessCode, newAccessCode }),
      }),
    disableAccessCode: ({ accessCode, password }) =>
      request('/auth/access-code/disable', {
        method: 'POST',
        body: JSON.stringify({ accessCode, password }),
      }),
    resetAccessCode: ({ password, newAccessCode }) =>
      request('/auth/access-code/reset', {
        method: 'POST',
        body: JSON.stringify({ password, newAccessCode }),
      }),
    getSessionInfo: () => request('/auth/session-info'),
    logout: (data = {}) =>
      request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMe: () => request('/auth/me'),
    updateProfile: (data) =>
      request('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    forgotPassword: (email) =>
      request('/auth/forgot-password', {
        method: 'POST',
        isPublic: true,
        body: JSON.stringify({ email }),
      }),
    changePassword: (data) =>
      request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Transactions / Expenses
  transactions: {
    getAll: (params = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          searchParams.append(key, val);
        }
      });
      const query = searchParams.toString();
      return request(`/transactions${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/transactions/${id}`),
    authorizeExpense: ({ amount, credential, credentialType, user }) =>
      request('/transactions/authorize', {
        method: 'POST',
        body: JSON.stringify({ amount, credential, credentialType, user }),
      }),
    create: (expense) =>
      request('/transactions', {
        method: 'POST',
        body: JSON.stringify(expense),
      }),
    update: (id, updates) =>
      request(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    delete: (id) =>
      request(`/transactions/${id}`, {
        method: 'DELETE',
      }),
  },

  // Budget & Categories
  budget: {
    getCategories: () => request('/budget/categories'),
    addCategory: (category) =>
      request('/budget/categories', {
        method: 'POST',
        body: JSON.stringify(category),
      }),
    updateCategory: (id, updates) =>
      request(`/budget/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),
    deleteCategory: (id) =>
      request(`/budget/categories/${id}`, {
        method: 'DELETE',
      }),
    getMonthlyLimit: () => request('/budget/monthly-limit'),
    updateMonthlyLimit: (monthlyLimit) =>
      request('/budget/monthly-limit', {
        method: 'PUT',
        body: JSON.stringify({ monthlyLimit }),
      }),
    getAvailableCategories: () => request('/budget/available-categories'),
  },

  // Analytics & Metrics
  analytics: {
    getSummary: () => request('/analytics/summary'),
  },

  // Household & Shared Balances
  household: {
    getMembers: () => request('/household/members'),
    getBalances: () => request('/household/balances'),
    settle: () =>
      request('/household/settle', {
        method: 'POST',
      }),
  },
};

export default api;
