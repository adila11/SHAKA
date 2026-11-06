const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('shaka_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Authentication
  auth: {
    login: (credentials) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
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

