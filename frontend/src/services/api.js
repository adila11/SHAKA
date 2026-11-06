let currentBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Authentication & Reauthentication event hooks
let onRequiresAccessCodeCallback = null;
let onSessionExpiredCallback = null;

export const setAuthEventHandlers = ({ onRequiresAccessCode, onSessionExpired }) => {
  onRequiresAccessCodeCallback = onRequiresAccessCode;
  onSessionExpiredCallback = onSessionExpired;
};

async function request(endpoint, options = {}, isRetry = false) {
  const token = localStorage.getItem('shaka_token');
  const sessionId = localStorage.getItem('shaka_session_id');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(sessionId ? { 'X-Session-Id': sessionId } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${currentBaseUrl}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      // 1. Session expired (3-day inactivity) -> Force logout to login screen
      if (response.status === 401 && (data.sessionExpired || data.sessionRevoked)) {
        if (onSessionExpiredCallback) {
          onSessionExpiredCallback(data.message || 'Session expired. Please log in again.');
        }
      }

      // 2. Access token expired but 3-day session still valid -> Try refresh or trigger access code
      if (response.status === 401 && data.tokenExpired && !isRetry && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
        const storedRefresh = localStorage.getItem('shaka_refresh_token');
        const storedSessionId = localStorage.getItem('shaka_session_id');

        if (storedRefresh && storedSessionId) {
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
              // Retry original request once
              return request(endpoint, options, true);
            } else if (refreshData.requiresAccessCode) {
              if (onRequiresAccessCodeCallback) {
                onRequiresAccessCodeCallback(storedSessionId);
              }
            }
          } catch {
            // Proceed to throw
          }
        }
      }

      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    // If localhost failed (e.g. IPv6 vs IPv4 on Windows), automatically try 127.0.0.1
    if (currentBaseUrl.includes('localhost:5000')) {
      try {
        const altUrl = currentBaseUrl.replace('localhost:5000', '127.0.0.1:5000');
        const altResponse = await fetch(`${altUrl}${endpoint}`, config);
        const altData = await altResponse.json().catch(() => ({}));
        if (altResponse.ok) {
          currentBaseUrl = altUrl; // Lock in working base
          return altData;
        }
      } catch {
        // Fall back to original error
      }
    }
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health Check
  health: {
    check: () => request('/health'),
  },

  // Authentication & Session Management
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    refresh: (data) =>
      request('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    verifyAccessCode: ({ accessCode, sessionId }) =>
      request('/auth/verify-access-code', {
        method: 'POST',
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
    forgotPassword: (email) =>
      request('/auth/forgot-password', {
        method: 'POST',
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

